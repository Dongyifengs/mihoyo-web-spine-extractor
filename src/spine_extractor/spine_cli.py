"""Optional integration with a locally installed, licensed Spine editor CLI."""

import asyncio
import json
import os
import re
import signal
import subprocess
import tempfile
import time
from pathlib import Path
from urllib.parse import urlsplit

from .models import Cancelled, Options
from .project_state import selection_candidate
from .urls import safe_name

EXTRA_EXPORT_NOTICE = "extra 飘动后处理仅支持网页预览，Spine 工程不包含此效果；原始骨骼文件已保留。"


def json_export_settings(folder: Path) -> str:
    # Explicit settings also work with 3.8, which does not accept `-e json`.
    path = folder / "export-settings.json"
    path.write_text(json.dumps({"class": "export-json", "extension": ".json", "format": "JSON",
        "prettyPrint": True, "nonessential": True, "cleanUp": False, "packAtlas": None,
        "warnings": True, "open": False}), encoding="utf-8")
    return str(path)


def editor_version(version: str) -> str:
    version = version.split("-from-")[-1]
    match = re.fullmatch(r"(\d+\.\d+(?:\.\d+)?)(?:-beta)?", version.strip())
    if not match:
        raise ValueError("无法确定 Spine 编辑器版本，请在设置中填写版本号")
    return version.strip()


def validate_cli(value: str) -> Path:
    path = Path(value.strip().strip('"')).expanduser().resolve()
    if not path.is_file() or path.name.lower() not in {"spine.com", "spine", "spine.sh"}:
        raise ValueError("请选择正版 Spine 安装目录里的 spine.com（macOS/Linux 使用 Spine CLI）")
    return path


def detect_cli() -> str:
    for candidate in ("D:/Program Files/Spine/spine.com", "C:/Program Files/Spine/spine.com",
                      "/Applications/Spine.app/Contents/MacOS/Spine", "/opt/spine/Spine"):
        if Path(candidate).is_file():
            return str(Path(candidate))
    return ""


def clean_log(text: str) -> str:
    # CLI diagnostics may include the editor owner's account; don't retain that in reports.
    return re.sub(r"(?im)^.*(?:Licensed to:|license key|activation code).*$", "[已隐藏许可账户信息]", text)


async def terminate(process):
    if process.returncode is not None:
        return
    if os.name == "nt":
        killer = await asyncio.create_subprocess_exec("taskkill", "/PID", str(process.pid), "/T", "/F",
                                                     stdout=asyncio.subprocess.DEVNULL,
                                                     stderr=asyncio.subprocess.DEVNULL,
                                                     creationflags=subprocess.CREATE_NO_WINDOW)
        await killer.wait()
    else:
        try:
            os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
    try:
        await asyncio.wait_for(process.wait(), 5)
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()


async def run_command(args: list[str], cwd: Path, options: Options) -> str:
    options.check()
    process = await asyncio.create_subprocess_exec(
        *args, cwd=cwd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT,
        **({"creationflags": subprocess.CREATE_NO_WINDOW} if os.name == "nt" else {"start_new_session": True}),
    )
    communication = asyncio.create_task(process.communicate())
    start = time.monotonic()
    try:
        while not communication.done():
            options.check()
            if time.monotonic() - start > options.spine_timeout:
                raise TimeoutError(f"Spine CLI 超过 {options.spine_timeout:g} 秒，已停止")
            await asyncio.sleep(0.2)
        body, _ = await communication
        log = clean_log(body.decode("utf-8", errors="replace"))
        if process.returncode:
            raise RuntimeError(f"Spine CLI 返回 {process.returncode}\n{log[-6000:]}")
        return log
    finally:
        await terminate(process)
        if not communication.done():
            await communication


async def select_animation(project: Path, names: list[str], prefix: list[str], options: Options,
                           runner, output_log: list[str]) -> dict:
    """Validate a state-only candidate with the official reader before installing it."""
    if not names:
        return {}
    original = project.read_bytes()
    try:
        candidate = selection_candidate(original, names)
        with tempfile.TemporaryDirectory(prefix=".spine-selection-", dir=project.parent) as temp:
            root = Path(temp)
            settings = json_export_settings(root)
            args = prefix.copy()
            for label, content in [("before", original), ("after", candidate)]:
                folder = root / label
                folder.mkdir()
                source = folder / "project.spine"
                source.write_bytes(content)
                args += ["-i", str(source), "-o", str(folder / "json"), "-e", settings]
            output_log.append(await runner(args, project.parent, options))
            exports = []
            for label in ("before", "after"):
                files = list((root / label / "json").glob("*.json"))
                if len(files) != 1:
                    raise ValueError("编辑器未返回唯一的校验骨骼")
                value = json.loads(files[0].read_bytes())
                # The two temporary directories change only this relative path.
                value.get("skeleton", {}).pop("images", None)
                value.get("skeleton", {}).pop("audio", None)
                exports.append(value)
            if exports[0] != exports[1]:
                raise ValueError("默认动画候选未通过骨骼数据一致性校验")
            options.check()
            if project.read_bytes() != original:
                raise ValueError("工程已被其他程序修改，保留当前文件")
            pending = root / "selected.spine"
            pending.write_bytes(candidate)
            pending.replace(project)
        output_log.append(f"已默认选中第一个动画：{names[0]}（官方 CLI 回读校验通过）")
        return {"default_animation": names[0]}
    except Cancelled:
        raise
    except Exception as exc:
        warning = f"工程已生成，但默认动画未自动选择：{exc}。请在编辑器中手动选择。"
        output_log.append(warning)
        return {"selection_warning": warning}


async def convert_group(folder: Path, group: dict, options: Options, log=print, runner=run_command) -> dict:
    """Import a complete group. A failed optional conversion never removes original assets."""
    info = {"status": "failed", "project": None, "editor_version": "", "log": "spine-cli.log"}
    output_log = []
    try:
        cli = validate_cli(options.spine_cli)
        version = editor_version(options.spine_version or group.get("version", ""))
        info["editor_version"] = version
        if group.get("status") != "complete":
            raise ValueError("资源未配齐，暂不生成 Spine 工程")
        prefix = [str(cli), "-u", version]
        if options.proxy:
            proxy = urlsplit(options.proxy)
            if proxy.hostname and proxy.port:
                prefix += ["-x", f"{proxy.hostname}:{proxy.port}"]
        json_path = folder / "skeleton.json"
        if json_path.is_file():
            value = json.loads(json_path.read_bytes())
        else:
            with tempfile.TemporaryDirectory(prefix=".spine-import-", dir=folder) as temp:
                target = Path(temp) / "json"
                settings = json_export_settings(Path(temp))
                output_log.append(await runner(prefix + ["-i", str(folder / "skeleton.skel"), "-o", str(target), "-e", settings], folder, options))
                candidates = list(target.glob("*.json"))
                if len(candidates) != 1:
                    raise RuntimeError("二进制骨骼导出 JSON 失败")
                value = json.loads(candidates[0].read_bytes())
        if "extra" in value:
            info["extra_notice"] = EXTRA_EXPORT_NOTICE
            log(EXTRA_EXPORT_NOTICE)
            output_log.append(EXTRA_EXPORT_NOTICE)
        for field in ("extra", "extraSlot", "extraConfig"):
            value.pop(field, None)
        value.setdefault("skeleton", {})["images"] = "./regions/"
        import_path = folder / "import.json"
        import_path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
        project = folder / (safe_name(group["name"], "project") + ".spine")
        if project.is_file() and project.stat().st_size and (folder / "regions").is_dir():
            # Existing projects may have been edited by the user; never patch them.
            previous = group.get("spine_project") or {}
            for key in ("default_animation", "selection_warning"):
                if key in previous:
                    info[key] = previous[key]
            info.update(status="success", project=project.name)
            return info
        log(f"Spine {version}：拆分贴图并生成 {project.name}")
        # One editor launch handles both operations; all arguments are passed without a shell.
        args = prefix + ["-i", str(folder), "-o", str(folder / "regions"), "-c", str(folder / "skeleton.atlas"),
                         "-i", str(import_path), "-o", str(project), "-r", group["name"]]
        output_log.append(await runner(args, folder, options))
        if not project.is_file() or not project.stat().st_size:
            raise RuntimeError("CLI 没有生成工程文件，请检查正版激活状态、版本和 CLI 日志")
        info.update(await select_animation(project, list(value.get("animations", {})), prefix, options,
                                           runner, output_log))
        if info.get("selection_warning"):
            log(info["selection_warning"])
        info.update(status="success", project=project.name)
        log(f"已生成：{project.name}")
    except Cancelled:
        info.update(status="cancelled", error="用户停止了工程转换")
        raise
    except Exception as exc:
        info["error"] = str(exc)
        output_log.append(str(exc))
        log(f"工程转换失败，原始素材已保留：{exc}")
    finally:
        if output_log or not (folder / "spine-cli.log").exists():
            (folder / "spine-cli.log").write_text(clean_log("\n".join(output_log)), encoding="utf-8")
    return info

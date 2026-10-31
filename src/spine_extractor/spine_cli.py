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
from .urls import safe_name


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
                output_log.append(await runner(prefix + ["-i", str(folder / "skeleton.skel"), "-o", temp, "-e", "json"], folder, options))
                candidates = list(Path(temp).glob("*.json"))
                if len(candidates) != 1:
                    raise RuntimeError("二进制骨骼导出 JSON 失败")
                value = json.loads(candidates[0].read_bytes())
        value.setdefault("skeleton", {})["images"] = "./regions/"
        import_path = folder / "import.json"
        import_path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
        project = folder / (safe_name(group["name"], "project") + ".spine")
        if project.is_file() and project.stat().st_size and (folder / "regions").is_dir():
            info.update(status="success", project=project.name)
            return info
        log(f"Spine {version}：拆分贴图并生成 {project.name}")
        # One editor launch handles both operations; all arguments are passed without a shell.
        args = prefix + ["-i", str(folder), "-o", str(folder / "regions"), "-c", str(folder / "skeleton.atlas"),
                         "-i", str(import_path), "-o", str(project), "-r", group["name"]]
        output_log.append(await runner(args, folder, options))
        if not project.is_file() or not project.stat().st_size:
            raise RuntimeError("CLI 没有生成工程文件，请检查正版激活状态、版本和 CLI 日志")
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

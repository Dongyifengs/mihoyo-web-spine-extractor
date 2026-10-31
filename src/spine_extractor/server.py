"""Loopback-only web workbench. One background job at a time; browser-independent extraction."""

import argparse
import asyncio
import json
import mimetypes
import os
import secrets
import subprocess
import sys
import threading
import time
import webbrowser
from copy import deepcopy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlsplit

from . import __version__
from .engine import run
from .browser import capture_cover
from .cover import save_cover
from .export import write_json
from .models import Cancelled, Options
from .network import Fetcher
from .news import SOURCES, list_events, validate_source, resolve_event, source_from_key
from .report import render_report
from .scene import capture_scene, save_scene
from .spine_cli import convert_group, detect_cli, editor_version, validate_cli
from .urls import digest, safe_relative

STATIC = Path(__file__).with_name("static")
DEFAULTS = {"output": str(Path("outputs").resolve()), "mode": "auto", "wait": 12, "feed_limit": 3,
            "headed": False, "unpack": True, "proxy": "", "spine_cli": "", "spine_version": "", "spine_timeout": 180}


def confined(root: Path, relative: str) -> Path:
    target = (root / safe_relative(relative)).resolve()
    if not target.is_relative_to(root.resolve()):
        raise ValueError("文件路径越界")
    return target


def open_local(path: Path):
    if os.name == "nt":
        os.startfile(path)
    elif sys.platform == "darwin":
        subprocess.Popen(["open", str(path)])
    else:
        subprocess.Popen(["xdg-open", str(path)])


def open_project(path: Path, group: dict, settings: dict):
    if not settings.get("spine_cli"):
        return open_local(path)
    cli = validate_cli(settings["spine_cli"])
    version = editor_version(group.get("spine_project", {}).get("editor_version") or group.get("version", ""))
    # Request a separate editor. Older launchers may still forward to an existing
    # window and ignore -u / animate mode; do not alter the user's global settings.
    args = [str(cli), "-u", version, "--no-reuse-instance", "--auto-start"]
    if tuple(int(part) for part in version.split(".")[:2]) >= (4, 1):
        args.append("--animate-mode")
    args.append(str(path))
    subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                     **({"creationflags": subprocess.CREATE_NO_WINDOW} if os.name == "nt" else {}))


class Workbench:
    def __init__(self, config_dir: Path, output: Path | None = None):
        self.config_dir = config_dir.resolve()
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.settings_file = self.config_dir / "settings.json"
        self.settings = DEFAULTS.copy()
        if self.settings_file.exists():
            self.settings.update({k: v for k, v in json.loads(self.settings_file.read_text("utf-8")).items() if k in DEFAULTS})
        if output is not None:
            self.settings["output"] = str(output.resolve())
        self.csrf = secrets.token_urlsafe(32)
        self.lock = threading.RLock()
        self.jobs: dict[str, dict] = {}
        self.job_options: dict[str, Options] = {}
        self.worker = None
        self.active_job = None
        self.port = 0
        self.library: dict[str, Path] = {}
        self.news_cache = {}

    def options(self, values=None) -> Options:
        data = {**self.settings, **(values or {})}
        data["proxy"] = data.get("proxy") or None
        allowed = Options.__dataclass_fields__.keys() - {"cancel"}
        return Options(**{k: v for k, v in data.items() if k in allowed and v is not None})

    def save_settings(self, payload):
        with self.lock:
            if self.active_job and self.jobs[self.active_job]["status"] == "running":
                raise ValueError("请等待当前任务结束后修改设置")
            settings = {**self.settings, **{k: v for k, v in payload.items() if k in DEFAULTS}}
            options = self.options(settings)
            if options.spine_cli:
                settings["spine_cli"] = str(validate_cli(options.spine_cli))
            settings["output"] = str(options.output.resolve())
            self.settings = settings
            self.library = {}
            write_json(self.settings_file, settings)
        return settings

    def refresh(self) -> list[dict]:
        root = Path(self.settings["output"]).resolve()
        entries, library = [], {}
        if root.exists():
            for path in sorted(root.rglob("manifest.json")):
                if not path.resolve().is_relative_to(root) or ".spine-extractor" in path.parts:
                    continue
                try:
                    manifest = json.loads(path.read_text("utf-8"))
                    if not isinstance(manifest.get("groups"), list):
                        continue
                    key = digest(str(path.parent.relative_to(root)).replace("\\", "/"), 16)
                    library[key] = path.parent.resolve()
                    entries.append({"id": key, "title": manifest.get("title") or path.parent.name,
                                    "folder_name": path.parent.name, "created_at": manifest.get("created_at", ""),
                                    "skeleton_count": manifest.get("skeleton_count", 0), "group_count": len(manifest["groups"]),
                                    "complete_count": manifest.get("complete_count", 0),
                                    "project_count": sum(g.get("spine_project", {}).get("status") == "success" for g in manifest["groups"]),
                                    "page_url": manifest.get("page_url", ""),
                                    "cover_url": self.cover_url(path.parent, key),
                                    "cover_error": manifest.get("cover_error", "")})
                except (ValueError, OSError, KeyError):
                    continue
        with self.lock:
            self.library = library
        return sorted(entries, key=lambda x: x["created_at"], reverse=True)

    @staticmethod
    def cover_url(folder: Path, key: str) -> str:
        path = confined(folder, "cover.jpg")
        return f"/files/{key}/cover.jpg?v={path.stat().st_mtime_ns}" if path.is_file() else ""

    def folder(self, key: str) -> Path:
        if key not in self.library:
            self.refresh()
        with self.lock:
            folder = self.library.get(key)
        if not folder:
            raise FileNotFoundError("没有找到该活动")
        return folder

    def activity(self, key: str) -> tuple[Path, dict]:
        folder = self.folder(key)
        return folder, json.loads((folder / "manifest.json").read_text("utf-8"))

    def detail(self, key: str) -> dict:
        folder, manifest = self.activity(key)
        result = deepcopy(manifest)
        result.pop("request_failures", None)
        result.pop("scanned_resources", None)
        result.update(id=key, folder=str(folder), report_url=f"/reports/{key}/report.html", cover_url=self.cover_url(folder, key))
        result["groups"] = [self.group_detail(folder, key, index, group) for index, group in enumerate(result["groups"])]
        return result

    def group_detail(self, folder: Path, key: str, index: int, original: dict) -> dict:
        group = deepcopy(original)
        directory = confined(folder, group["directory"])
        skeleton = "skeleton.json" if (directory / "skeleton.json").is_file() else "skeleton.skel"
        if "has_extra" not in group or not group.get("animations") or not group.get("skins") or not group.get("bounds"):
            try:
                source = directory / (skeleton if skeleton.endswith("json") else "import.json")
                value = json.loads(source.read_bytes())
                group["has_extra"] = "extra" in value
                group["animations"] = list(value.get("animations", {}))
                skins = value.get("skins", {})
                group["skins"] = list(skins) if isinstance(skins, dict) else [s["name"] for s in skins]
                header = value.get("skeleton", {})
                group["bounds"] = {name: header[name] for name in ("x", "y", "width", "height") if name in header}
            except (ValueError, OSError, KeyError):
                pass
        skins = group.get("skins", [])
        group["initial_skin"] = next((s for s in skins if s != "default"), skins[0] if skins else "")
        prefix = f"/files/{key}/" + quote(group["directory"], safe="/") + "/"
        group.update(index=index, base_url=prefix, skeleton_url=prefix + skeleton,
                     atlas_url=prefix + "skeleton.atlas", preview_url=f"/player?activity={key}&group={index}")
        group["file_links"] = [{"name": file, "url": prefix + quote(file, safe="/")} for file in group.get("files", [])]
        group["thumbnail"] = prefix + quote(group["textures"][0]["name"], safe="/") if group.get("textures") else ""
        return group

    def preview(self, key: str, index: int) -> dict:
        folder, manifest = self.activity(key)
        if not 0 <= index < len(manifest["groups"]):
            raise ValueError("无效的资源组")
        return self.group_detail(folder, key, index, manifest["groups"][index])

    def add_job(self, options: Options, callback, label: str) -> dict:
        with self.lock:
            if self.active_job and self.jobs[self.active_job]["status"] == "running":
                raise ValueError("已有任务运行中，请等待或停止后再开始")
            key = secrets.token_hex(8)
            job = {"id": key, "label": label, "status": "running", "logs": [], "result": None,
                   "started_at": time.time(), "error": None}
            self.jobs[key] = job
            self.job_options[key] = options
            self.active_job = key

            def log(message):
                with self.lock:
                    job["logs"].append(str(message))
                    if len(job["logs"]) > 4000:
                        job["logs"] = job["logs"][-4000:]

            def worker():
                try:
                    result = asyncio.run(callback(log))
                    with self.lock:
                        job["result"] = result
                        job["status"] = "cancelled" if result.get("cancelled") else "completed"
                except Cancelled:
                    job["status"] = "cancelled"
                except Exception as exc:
                    job.update(status="failed", error=str(exc))
                    log(str(exc))
                finally:
                    job["finished_at"] = time.time()
            self.worker = threading.Thread(target=worker, daemon=True)
            self.worker.start()
            return {k: v for k, v in job.items() if k != "logs"}

    def extract(self, payload):
        urls = payload.get("urls", [])
        if isinstance(urls, str):
            urls = [u.strip() for u in urls.splitlines() if u.strip()]
        if not isinstance(urls, list) or not urls or len(urls) > 100 or not all(isinstance(u, str) for u in urls):
            raise ValueError("请输入网页地址，每行一个，最多 100 行")
        values = {k: v for k, v in payload.get("options", {}).items()
                  if k in {"title", "mode", "wait", "headed", "feed_limit", "unpack"}}
        options = self.options(values)
        if not payload.get("convert", bool(options.spine_cli)):
            options.spine_cli = ""
        elif options.spine_cli:
            validate_cli(options.spine_cli)
        return self.add_job(options, lambda log: run(urls, options, log), "提取活动素材")

    def conversion(self, key: str, indexes: list[int] | None):
        folder, manifest = self.activity(key)
        options = self.options()
        if not options.spine_cli:
            raise ValueError("请先在设置中配置正版 Spine CLI 的路径")
        validate_cli(options.spine_cli)
        indexes = list(range(len(manifest["groups"]))) if indexes is None else indexes
        if not isinstance(indexes, list) or any(type(i) is not int or i < 0 or i >= len(manifest["groups"]) for i in indexes):
            raise ValueError("无效的资源组")

        async def convert(log):
            counts = {"converted": 0, "failed": 0, "cancelled": False}
            try:
                for index in indexes:
                    options.check()
                    group = manifest["groups"][index]
                    destination = confined(folder, group["directory"])
                    info = await convert_group(destination, group, options, log)
                    group["spine_project"] = info
                    if info["status"] == "success":
                        counts["converted"] += 1
                        group["files"] = list(dict.fromkeys(group.get("files", []) + ["import.json", info["project"]]))
                        group["region_images"] = len(list((destination / "regions").rglob("*.png")))
                    else:
                        counts["failed"] += 1
                    write_json(destination / "metadata.json", group)
                    write_json(folder / "manifest.json", manifest)
            except Cancelled:
                counts["cancelled"] = True
            finally:
                write_json(folder / "manifest.json", manifest)
                (folder / "report.html").write_text(render_report(manifest), encoding="utf-8")
            return counts
        return self.add_job(options, convert, "生成 Spine 工程")

    def covers(self, key: str | None = None):
        if key is not None:
            self.activity(key)
            keys = [key]
        else:
            keys = [entry["id"] for entry in self.refresh() if not entry["cover_url"]]
        if not keys:
            raise ValueError("所有活动已有封面，可以在卡片上单独重拍")
        options = self.options()

        async def generate(log):
            result = {"kind": "covers", "captured": 0, "failed": 0, "cancelled": False}
            try:
                for activity_key in keys:
                    options.check()
                    folder, manifest = self.activity(activity_key)
                    log(f"截取活动封面：{manifest.get('title') or folder.name}")
                    try:
                        cover = await capture_cover(manifest.get("page_url") or manifest.get("input_url", ""), options, log)
                        options.check()
                        # Reload the manifest so conversions completed elsewhere are retained.
                        _, manifest = self.activity(activity_key)
                        manifest["cover"] = save_cover(folder, cover)
                        manifest.pop("cover_error", None)
                        result["captured"] += 1
                    except Cancelled:
                        raise
                    except Exception as exc:
                        manifest["cover_error"] = str(exc).splitlines()[0]
                        result["failed"] += 1
                        log(f"封面失败：{manifest['cover_error']}")
                    write_json(folder / "manifest.json", manifest)
            except Cancelled:
                result["cancelled"] = True
            return result
        return self.add_job(options, generate, "截取活动封面")

    def composition(self, key: str):
        folder = self.folder(key)
        path = confined(folder, 'composition.json')
        if not path.is_file():
            return {'scenes': [], 'warnings': [], 'width': 1280, 'height': 720}
        data = json.loads(path.read_text('utf-8'))
        for scene in data['scenes']:
            scene['reference_url'] = f'/files/{key}/' + quote(scene['reference'], safe='/')
            for layer in scene['layers']:
                layer['image_url'] = f'/files/{key}/' + quote(layer['image'], safe='/')
        return data

    def capture_composition(self, key: str):
        folder, manifest = self.activity(key)
        options = self.options()

        async def generate(log):
            cover, data = await capture_scene(manifest.get('page_url') or manifest.get('input_url', ''), options, log)
            options.check()
            _, current = self.activity(key)
            saved = save_scene(folder, data, current['groups'])
            current['cover'] = save_cover(folder, cover)
            current.pop('cover_error', None)
            write_json(folder / 'manifest.json', current)
            return {'kind': 'composition', 'scenes': len(saved['scenes']),
                    'layers': sum(len(scene['layers']) for scene in saved['scenes'])}
        return self.add_job(options, generate, '捕获原网页布局')

    def resolve_news_selection(self, payload):
        keys = payload.get('keys')
        if not isinstance(keys, list) or not 1 <= len(keys) <= 100 or not all(isinstance(k, str) for k in keys):
            raise ValueError('请选择 1–100 条官方新闻')
        keys = list(dict.fromkeys(keys))
        for key in keys:
            source_from_key(key)
        options = self.options()

        async def work(log):
            urls, errors = [], []
            async with Fetcher(options, log) as fetcher:
                for key in keys:
                    options.check()
                    try:
                        targets = await resolve_event(fetcher, key)
                        urls.extend(t.url for t in targets)
                        log(f'已解析 {key}：{len(targets)} 个活动入口')
                    except Exception as exc:
                        options.check()
                        errors.append({'key': key, 'error': str(exc)})
                        log(f'{key} 解析失败：{exc}')
            return {'kind': 'news', 'urls': list(dict.fromkeys(urls)), 'errors': errors}
        return self.add_job(options, work, '解析官方新闻活动入口')

    def news(self, source):
        validate_source(source)
        with self.lock:
            cached = self.news_cache.get(source)
        if cached and time.monotonic() - cached[0] < 300:
            return cached[1]

        async def fetch():
            async with Fetcher(self.options(), lambda _: None) as fetcher:
                return await list_events(fetcher, source)
        result = asyncio.run(fetch())
        with self.lock:
            self.news_cache[source] = time.monotonic(), result
        return result


def make_server(state: Workbench, port: int = 8765) -> ThreadingHTTPServer:
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def send(self, status, data, mime="application/json; charset=utf-8", headers=None):
            if isinstance(data, (dict, list)):
                data = json.dumps(data, ensure_ascii=False).encode("utf-8")
            elif isinstance(data, str):
                data = data.encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Cache-Control", "no-store" if mime.startswith("application/json") else "no-cache")
            for key, value in (headers or {}).items():
                self.send_header(key, value)
            try:
                self.end_headers()
                self.wfile.write(data)
            except ConnectionError:
                pass

        def host_allowed(self):
            return self.headers.get("Host") in {f"127.0.0.1:{state.port}", f"localhost:{state.port}"}

        def send_file(self, path: Path):
            if not path.is_file():
                raise FileNotFoundError("文件不存在")
            mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
            if path.suffix in {".js", ".mjs"}:
                mime = "text/javascript"
            if mime.startswith("text/"):
                mime += "; charset=utf-8"
            self.send(200, path.read_bytes(), mime)

        def do_GET(self):
            if not self.host_allowed():
                return self.send(403, {"error": "仅允许从本机打开"})
            path = unquote(urlsplit(self.path).path)
            parts = path.strip("/").split("/")
            try:
                if path == "/":
                    return self.send_file(STATIC / "index.html")
                if path == "/player":
                    return self.send_file(STATIC / "player.html")
                if parts[0] == "static" and len(parts) > 1:
                    return self.send_file(confined(STATIC, "/".join(parts[1:])))
                if path == "/api/bootstrap":
                    return self.send(200, {"version": __version__, "csrf": state.csrf, "settings": state.settings,
                                           "detected_spine": detect_cli(), "active_job": state.active_job})
                if path == '/api/instance':
                    origin = self.headers.get('Origin', '')
                    parsed = urlsplit(origin)
                    if origin and (parsed.scheme != 'http' or parsed.hostname not in {'localhost', '127.0.0.1'}
                                   or parsed.path or parsed.query or parsed.fragment or parsed.username):
                        return self.send(403, {'error': '仅供本地工作台识别版本'})
                    return self.send(200, {'version': __version__, 'output': state.settings['output']},
                                     headers={'Access-Control-Allow-Origin': origin, 'Vary': 'Origin'} if origin else {})
                if path == "/api/activities":
                    return self.send(200, state.refresh())
                if path == '/api/news/sources':
                    return self.send(200, SOURCES)
                if path == '/api/news':
                    source = parse_qs(urlsplit(self.path).query).get('source', ['genshin.web_cn'])[0]
                    return self.send(200, state.news(source))
                if parts[:2] == ["api", "activities"] and len(parts) == 3:
                    return self.send(200, state.detail(parts[2]))
                if parts[:2] == ['api', 'activities'] and len(parts) == 4 and parts[3] == 'composition':
                    return self.send(200, state.composition(parts[2]))
                if parts[:2] == ["api", "activities"] and len(parts) == 5 and parts[3] == "preview":
                    return self.send(200, state.preview(parts[2], int(parts[4])))
                if parts[:2] == ["api", "jobs"] and len(parts) == 3:
                    with state.lock:
                        job = deepcopy(state.jobs.get(parts[2]))
                    if job is None:
                        raise FileNotFoundError("任务不存在")
                    return self.send(200, job)
                if parts[0] == "reports" and len(parts) == 3 and parts[2] == "report.html":
                    _, manifest = state.activity(parts[1])
                    return self.send(200, render_report(manifest), "text/html; charset=utf-8")
                if parts[0] == "files" and len(parts) > 2:
                    folder = state.folder(parts[1])
                    file = confined(folder, "/".join(parts[2:]))
                    if file.suffix.lower() not in {".json", ".atlas", ".skel", ".spine", ".png", ".jpg", ".jpeg", ".webp", ".avif", ".txt", ".log"}:
                        raise ValueError("不支持此文件类型")
                    return self.send_file(file)
                raise FileNotFoundError("地址不存在")
            except FileNotFoundError as exc:
                self.send(404, {"error": str(exc)})
            except (ValueError, OSError, KeyError, RuntimeError) as exc:
                self.send(400, {"error": str(exc)})

        def do_POST(self):
            self.connection.settimeout(10)
            allowed_origins = {f"http://127.0.0.1:{state.port}", f"http://localhost:{state.port}"}
            token = self.headers.get("X-Spine-Token", "")
            if (not self.host_allowed() or self.headers.get("Origin") not in allowed_origins
                    or not secrets.compare_digest(token, state.csrf)):
                # Drain small rejected bodies before closing: unread TCP data can reset the
                # connection on Windows before the browser receives the 403 response.
                try:
                    size = int(self.headers.get("Content-Length", "0"))
                    if 0 < size <= 1024 * 1024:
                        self.rfile.read(size)
                except (ValueError, OSError):
                    pass
                return self.send(403, {"error": "请求已拒绝，请刷新本地网页后重试"})
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 <= size <= 1024 * 1024 or not self.headers.get("Content-Type", "").startswith("application/json"):
                    raise ValueError("需要 JSON 请求")
                payload = json.loads(self.rfile.read(size) or b"{}")
                if not isinstance(payload, dict):
                    raise ValueError("无效的请求")
                path = unquote(urlsplit(self.path).path)
                parts = path.strip("/").split("/")
                if path == "/api/news/resolve":
                    return self.send(202, state.resolve_news_selection(payload))
                if path == "/api/settings":
                    return self.send(200, state.save_settings(payload))
                if path == "/api/jobs":
                    return self.send(202, state.extract(payload))
                if path == "/api/covers":
                    return self.send(202, state.covers())
                if parts[:2] == ["api", "jobs"] and len(parts) == 4 and parts[3] == "cancel":
                    options = state.job_options.get(parts[2])
                    if not options:
                        raise FileNotFoundError("任务不存在")
                    options.cancel.set()
                    return self.send(200, {"cancelled": True})
                if parts[:2] == ["api", "activities"] and len(parts) == 4:
                    key, action = parts[2:]
                    if action == "cover":
                        return self.send(202, state.covers(key))
                    if action == 'composition':
                        return self.send(202, state.capture_composition(key))
                    if action == "convert":
                        return self.send(202, state.conversion(key, payload.get("groups")))
                    folder, manifest = state.activity(key)
                    if action == "open-folder":
                        open_local(folder)
                        return self.send(200, {"opened": True})
                    if action == "open-project":
                        index = payload.get("group")
                        if type(index) is not int or not 0 <= index < len(manifest["groups"]):
                            raise ValueError("无效的资源组")
                        group = manifest["groups"][index]
                        project = group.get("spine_project", {}).get("project")
                        if not project:
                            raise ValueError("请先生成 .spine 工程")
                        file = confined(folder, group["directory"] + "/" + project)
                        if file.suffix.lower() != ".spine" or not file.is_file():
                            raise ValueError("工程文件不存在")
                        open_project(file, group, state.settings)
                        return self.send(200, {"opened": True})
                raise FileNotFoundError("地址不存在")
            except FileNotFoundError as exc:
                self.send(404, {"error": str(exc)})
            except (ValueError, OSError, KeyError, TypeError) as exc:
                self.send(400, {"error": str(exc)})

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    server.daemon_threads = True
    state.port = server.server_port
    return server


def main(argv=None):
    parser = argparse.ArgumentParser(description="在本机浏览器中使用 Spine 素材工作台")
    parser.add_argument("--port", type=int, default=None)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--config-dir", type=Path, default=Path(".spine-extractor"))
    parser.add_argument("--no-open", action="store_true", help="不自动打开浏览器")
    args = parser.parse_args(argv)
    if args.port is not None and not 0 <= args.port <= 65535:
        parser.error("端口必须在 0–65535 之间")
    state = Workbench(args.config_dir, args.output)
    for port in ([args.port] if args.port is not None else [*range(8765, 8776), 0]):
        try:
            server = make_server(state, port)
            break
        except OSError as exc:
            if args.port is not None or port == 0:
                parser.error(f'端口无法启动：{exc}')
    url = f"http://127.0.0.1:{state.port}"
    print(f"Spine 素材工作台：{url}\n保持此终端运行，Ctrl+C 退出。", flush=True)
    if not args.no_open:
        webbrowser.open(url)
    try:
        server.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        pass
    finally:
        for options in state.job_options.values():
            options.cancel.set()
        server.server_close()
        if state.worker:
            state.worker.join(timeout=30)


if __name__ == "__main__":
    main()

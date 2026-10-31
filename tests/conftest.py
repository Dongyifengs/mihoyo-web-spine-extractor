import io
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest
import httpx
from PIL import Image

from spine_extractor.server import Workbench, make_server


@pytest.fixture
def web(tmp_path):
    state = Workbench(tmp_path / "state", tmp_path / "outputs")
    httpd = make_server(state, 0)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    origin = f"http://127.0.0.1:{httpd.server_port}"
    with httpx.Client(base_url=origin, timeout=20, trust_env=False,
                      headers={"Origin": origin, "X-Spine-Token": state.csrf}) as client:
        yield client, state
    for options in state.job_options.values():
        options.cancel.set()
    if state.worker:
        state.worker.join(10)
    httpd.shutdown()
    httpd.server_close()
    thread.join()


@pytest.fixture
def skeleton():
    return {"skeleton": {"spine": "4.2.43", "images": "./source/"}, "bones": [{"name": "root"}],
            "slots": [{"name": "body", "bone": "root", "attachment": "body"}],
            "skins": [{"name": "default", "attachments": {"body": {"body": {"width": 2, "height": 3}}}}],
            "animations": {"idle": {}}}


@pytest.fixture
def atlas():
    return "hero.png\nsize: 4, 4\nfilter: Linear, Linear\nbody\nbounds: 0, 0, 2, 3\n"


@pytest.fixture
def png():
    out = io.BytesIO()
    Image.new("RGBA", (4, 4), (255, 40, 20, 255)).save(out, format="PNG")
    return out.getvalue()


@pytest.fixture
def server(skeleton, atlas, png):
    requests = []
    routes = {
        "/index.html": ("text/html", '<title>测试活动</title><base href="/assets/"><script src="redirect.js"></script>'),
        "/assets/app.js": ("application/javascript", "export const data=" + json.dumps(skeleton) + ";const atlas=" + json.dumps(atlas) + ';const tex="hero.1234abcd..png";'),
        "/assets/hero.1234abcd..png": ("image/png", png),
        "/dynamic.html": ("text/html", '<title>动态测试</title><iframe src="/frame.html"></iframe>'),
        "/frame.html": ("text/html", '<script>setTimeout(()=>{fetch("/hero.json");fetch("/hero.atlas");fetch("/hero.png")},300)</script>'),
        "/hero.json": ("application/json", json.dumps(skeleton)),
        "/hero.atlas": ("text/plain", atlas),
        "/hero.png": ("image/png", png),
        "/bad.png": ("text/html", "<html>not a texture</html>"),
        "/large.json": ("application/json", b"x" * (1024 * 1024 + 1)),
    }

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            requests.append(self.path)
            if self.path == "/assets/redirect.js":
                self.send_response(302)
                self.send_header("Location", "/assets/app.js")
                self.end_headers()
                return
            if self.path not in routes:
                self.send_response(404)
                self.end_headers()
                return
            content_type, body = routes[self.path]
            if isinstance(body, str):
                body = body.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_):
            pass

    httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    worker = threading.Thread(target=httpd.serve_forever, daemon=True)
    worker.start()
    yield f"http://127.0.0.1:{httpd.server_port}", routes, requests
    httpd.shutdown()
    httpd.server_close()
    worker.join()

import base64
import json
import re
from urllib.parse import unquote_to_bytes

from bs4 import BeautifulSoup

from .atlas import parse_atlas
from .javascript import scan_javascript
from .models import Asset, Resource
from .urls import ASSET_EXTS, IMAGE_EXTS, basename, digest, http_url, suffix


def is_skeleton(value) -> bool:
    return (isinstance(value, dict) and isinstance(value.get("bones"), list) and bool(value["bones"])
            and all(isinstance(b, dict) and "name" in b for b in value["bones"])
            and (isinstance(value.get("skeleton"), dict) or "slots" in value))


def binary_version(data: bytes) -> str:
    def read_string(offset):
        size = 0
        for shift in range(0, 35, 7):
            byte = data[offset]
            offset += 1
            size |= (byte & 127) << shift
            if byte < 128:
                break
        else:
            raise ValueError("invalid varint")
        size = max(size - 1, 0)
        if size > 256 or offset + size > len(data):
            raise ValueError("invalid string length")
        return data[offset:offset + size], offset + size

    # Older versions encode a string hash, current runtimes use an 8-byte hash.
    starts = [8]
    try:
        _, start = read_string(0)
        starts.append(start)
    except (ValueError, IndexError):
        pass
    for start in starts:
        try:
            version, _ = read_string(start)
            if re.fullmatch(rb"[34]\.\d{1,2}(?:\.\d{1,4})?(?:[-+][A-Za-z0-9_.-]+)?", version):
                return version.decode("ascii")
        except (ValueError, IndexError):
            pass
    return ""


class Scanner:
    def __init__(self, page_url: str):
        self.page_url = page_url
        self.title = ""
        self.assets: dict[tuple[str, str], Asset] = {}
        self.refs: set[str] = set()
        self.images: set[str] = set()
        self.scanned: set[str] = set()
        self.public_paths: set[str] = set()
        self.warnings: list[str] = []
        self.pairs: dict[str, set[str]] = {}

    def add(self, kind: str, data: bytes, source: str, name: str = "", value=None):
        # Bundled literals and standalone JSON often differ only in whitespace/key order.
        content = json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode('utf8') if kind == 'json' and value else data
        key = (kind, digest(content, 64))
        if key not in self.assets:
            self.assets[key] = Asset(kind, data, source, basename(name), value, [source])
        elif source not in self.assets[key].sources:
            self.assets[key].sources.append(source)
        if name and not self.assets[key].name:
            self.assets[key].name = basename(name)

    def reference(self, value: str, base: str, public: bool = False):
        value = value.strip()
        if len(value) > 4096 or re.search(r"[\s<>\"'{}|]", value):
            return
        if suffix(value) not in ASSET_EXTS or value.startswith(("data:", "blob:")):
            return
        url = http_url(value, base)
        if not url:
            return
        target = self.images if suffix(url) in IMAGE_EXTS else self.refs
        target.add(url)
        if public and not value.startswith(("http:", "https:", "/", "../", "./")):
            for prefix in self.public_paths:
                alternative = http_url(value, prefix)
                if alternative:
                    target.add(alternative)

    def scan(self, resource: Resource):
        if resource.url in self.scanned:
            return
        self.scanned.add(resource.url)
        ext, mime = suffix(resource.url), resource.content_type.lower()
        if ext in IMAGE_EXTS or mime.startswith("image/"):
            self.images.add(resource.url)
            return
        if ext in {".skel", ".bin", ".bytes"} or ("octet-stream" in mime and ext not in {".json", ".js", ".mjs"}):
            if binary_version(resource.body):
                self.add("skel", resource.body, resource.url, basename(resource.url))
                return
            if ext == ".skel" and "html" not in mime and not resource.body.lstrip().startswith(b"<"):
                self.add("skel", resource.body, resource.url, basename(resource.url))
                self.warnings.append(f"未识别二进制骨骼版本，已原样保存: {resource.url}")
                return
        text = resource.text
        if parse_atlas(text):
            self.add("atlas", text.encode("utf-8"), resource.url, basename(resource.url))
            return
        if ext == ".json" or "json" in mime or text.lstrip().startswith(("{", "[")):
            try:
                value = json.loads(text)
                if is_skeleton(value):
                    self.add("json", resource.body, resource.url, basename(resource.url), value)
                else:
                    self.walk_json(value, resource.url, basename(resource.url))
                return
            except (ValueError, RecursionError):
                pass
        if "html" in mime or re.match(r"\s*(?:<!doctype|<html)", text, re.I):
            self.scan_html(text, resource.url)
        elif ext in {".js", ".mjs"} or "javascript" in mime:
            self.scan_js(text, resource.url)
        elif ext == ".css" or "css" in mime:
            for match in re.finditer(r"url\(\s*['\"]?([^'\")]+)", text):
                self.reference(match.group(1), resource.url)

    def scan_html(self, text: str, source: str):
        soup = BeautifulSoup(text, "html.parser")
        if soup.title and soup.title.get_text(strip=True) and not self.title:
            self.title = soup.title.get_text(strip=True)
        if not self.title:
            meta = soup.find("meta", attrs={"property": "og:title"}) or soup.find("meta", attrs={"name": "twitter:title"})
            if meta and meta.get("content"):
                self.title = meta["content"].strip()
        base_tag = soup.find("base", href=True)
        base = http_url(base_tag["href"], source) if base_tag else source
        base = base or source
        for script in soup.find_all("script"):
            if script.get("src"):
                url = http_url(script["src"], base)
                if url:
                    self.refs.add(url)
            elif script.string:
                if script.get("type") in {"application/json", "application/ld+json", "importmap"}:
                    try:
                        self.walk_json(json.loads(script.string), base)
                    except ValueError:
                        pass
                else:
                    self.scan_js(str(script.string), base)
        for link in soup.find_all("link", href=True):
            self.reference(link["href"], base)
        for frame in soup.find_all("iframe", src=True):
            url = http_url(frame["src"], base)
            if url:
                self.refs.add(url)
        for image in soup.find_all("img", src=True):
            self.reference(image["src"], base)

    def scan_js(self, text: str, source: str):
        parsed = scan_javascript(text)
        for skeleton, atlas in parsed.pairs:
            self.pairs.setdefault(f'{source}#js-{skeleton}', set()).add(f'{source}#js-{atlas}')
        for path in parsed.public_paths:
            url = http_url(path or "./", source)
            if url:
                self.public_paths.add(url)
        for value, hint, offset in parsed.skeletons:
            if is_skeleton(value):
                self.add_json(value, f"{source}#js-{offset}", hint)
        for value, hint, offset in parsed.strings:
            self.string(value, f"{source}#js-{offset}", hint, base=source)
        for chunk in parsed.chunks:
            self.reference(chunk, source, public=True)

    def add_json(self, value: dict, source: str, name: str = ""):
        data = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.add("json", data, source, name, value)

    def walk_json(self, value, source: str, hint: str = "", depth: int = 0):
        if depth > 60:
            return
        if is_skeleton(value):
            self.add_json(value, source, hint)
        elif isinstance(value, dict):
            for key, child in value.items():
                if key == "web_title" and isinstance(child, str) and not self.title:
                    self.title = child.strip()
                self.walk_json(child, source, key, depth + 1)
        elif isinstance(value, list):
            for child in value:
                self.walk_json(child, source, hint, depth + 1)
        elif isinstance(value, str):
            self.string(value, source, hint)

    def string(self, value: str, source: str, hint: str = "", base: str | None = None):
        if not isinstance(value, str):
            return
        if parse_atlas(value):
            self.add("atlas", value.encode("utf-8"), source, hint)
            return
        if value.lstrip().startswith(("{", "[")) and '"bones"' in value:
            try:
                self.walk_json(json.loads(value), source, hint)
                return
            except (ValueError, RecursionError):
                pass
        if value.startswith("data:") and len(value) < 64_000_000:
            header, sep, payload = value.partition(",")
            if sep:
                try:
                    data = base64.b64decode(payload, validate=True) if ";base64" in header else unquote_to_bytes(payload)
                    if header.startswith("data:image/"):
                        ext = header.split("/", 1)[1].split(";", 1)[0]
                        self.add("image", data, source, hint or f"embedded-{digest(data)}.{ext}")
                    elif "json" in header:
                        self.walk_json(json.loads(data), source, hint)
                    elif binary_version(data):
                        self.add("skel", data, source, hint)
                except (ValueError, RecursionError):
                    pass
            return
        self.reference(value, base or source, public=True)
        if "url(" in value:
            for match in re.finditer(r"url\(\s*['\"]?([^'\")]+)", value):
                self.reference(match.group(1), base or source)

    @property
    def skeletons(self) -> list[Asset]:
        return [a for a in self.assets.values() if a.kind in {"json", "skel"}]

    @property
    def atlases(self) -> list[Asset]:
        return [a for a in self.assets.values() if a.kind == "atlas"]

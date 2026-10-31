import hashlib
import html
import re
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".avif"}
TEXT_EXTS = {".js", ".mjs", ".json", ".atlas", ".txt", ".css"}
ASSET_EXTS = IMAGE_EXTS | TEXT_EXTS | {".skel", ".bin", ".bytes"}


def http_url(value: str, base: str = "") -> str | None:
    value = html.unescape(value.strip()).replace("\\/", "/")
    if not value or any(c in value for c in "\r\n\x00"):
        return None
    result = urlsplit(urljoin(base, value))
    if result.scheme not in {"http", "https"} or not result.hostname or result.username or result.password:
        return None
    return urlunsplit((result.scheme, result.netloc, result.path or "/", result.query, ""))


def suffix(url: str) -> str:
    return Path(urlsplit(url).path).suffix.lower()


def basename(url: str) -> str:
    return unquote(urlsplit(url).path.rsplit("/", 1)[-1])


def normalized_name(name: str) -> str:
    name = basename(name)
    name = re.sub(r"-([A-Za-z0-9_-]{8})(?=\.[^.]+$)",
                  lambda m: "" if re.search(r"[0-9A-Z]", m[1]) else m[0], name)
    name = name.lower()
    # webpack: foo.1234abcd..png; Vite: foo-Dd_72mAx.png
    name = re.sub(r"[._-][a-f0-9]{6,32}(?=[._-]|$)", "", name)
    name = re.sub(r"\.(json|atlas|skel|bin|bytes|png|jpg|jpeg|webp|avif)$", "", name)
    return name.strip("._-")


def safe_name(name: str, fallback: str = "asset") -> str:
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name).strip(" .")[:80].rstrip(" .")
    if not name:
        name = fallback
    if re.match(r"^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)", name, re.I):
        name = "_" + name
    return name


def safe_relative(name: str) -> Path:
    """Retain atlas subdirectories, but reject traversal, drives and Windows ADS."""
    name = name.replace("\\", "/")
    pieces = name.split("/")
    if name.startswith("/") or any(p in {"", ".", ".."} for p in pieces):
        raise ValueError(f"不安全的资源路径: {name}")
    if any(safe_name(p) != p for p in pieces):
        raise ValueError(f"不安全的资源路径: {name}")
    return Path(*pieces)


def digest(data: bytes | str, length: int = 12) -> str:
    return hashlib.sha256(data.encode() if isinstance(data, str) else data).hexdigest()[:length]


def unique_directory(parent: Path, name: str) -> Path:
    """Reserve a human-readable directory atomically, with Windows-safe collision handling."""
    parent.mkdir(parents=True, exist_ok=True)
    stem = safe_name(name, "未命名活动")
    existing = {p.name.casefold() for p in parent.iterdir()}
    counter = 0
    while True:
        suffix = "" if counter == 0 else f"-{counter}"
        candidate = stem[:80 - len(suffix)].rstrip(" .") + suffix
        if candidate.casefold() not in existing:
            path = parent / candidate
            try:
                path.mkdir(exist_ok=False)
                return path
            except FileExistsError:
                pass
        counter += 1


def event_link(url: str) -> bool:
    p = urlsplit(url)
    return bool(p.hostname and any(p.hostname == d or p.hostname.endswith("." + d)
                                  for d in ("mihoyo.com", "hoyoverse.com", "hoyolab.com"))
                and "/event/" in p.path and not p.path.startswith("/common/")
                and Path(p.path).suffix.lower() in {"", ".html", ".htm"})

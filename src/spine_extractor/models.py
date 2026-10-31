from dataclasses import dataclass, field
from pathlib import Path
from threading import Event
from typing import Callable


class Cancelled(Exception):
    pass


@dataclass
class Options:
    output: Path = Path("outputs")
    mode: str = "auto"
    browser: str = "auto"
    headed: bool = False
    wait: float = 12
    concurrency: int = 6
    timeout: float = 25
    retries: int = 2
    max_files: int = 1500
    max_file_mb: int = 48
    max_total_mb: int = 512
    feed_limit: int = 3
    unpack: bool = True
    cover: bool = True
    proxy: str | None = None
    title: str = ""
    spine_cli: str = ""
    spine_version: str = ""
    spine_timeout: float = 180
    cancel: Event = field(default_factory=Event, repr=False)

    def __post_init__(self):
        self.output = Path(self.output)
        if self.mode not in {"auto", "static", "browser"}:
            raise ValueError("mode 必须是 auto、static 或 browser")
        if self.browser not in {"auto", "chromium", "msedge", "chrome"}:
            raise ValueError("browser 必须是 auto、chromium、msedge 或 chrome")
        for key in ("concurrency", "timeout", "max_files", "max_file_mb", "max_total_mb", "feed_limit", "spine_timeout"):
            if getattr(self, key) <= 0:
                raise ValueError(f"{key} 必须大于 0")
        if self.wait < 0 or self.retries < 0:
            raise ValueError("等待时间和重试次数不能为负数")

    def check(self):
        if self.cancel.is_set():
            raise Cancelled("已取消")


@dataclass
class Resource:
    url: str
    body: bytes
    content_type: str = ""

    @property
    def text(self) -> str:
        # Web event JSON, JS and HTML are normally UTF-8; preserve Chinese identifiers.
        for encoding in ("utf-8-sig", "gb18030"):
            try:
                return self.body.decode(encoding)
            except UnicodeDecodeError:
                pass
        return self.body.decode("utf-8", errors="replace")


@dataclass
class Asset:
    kind: str
    data: bytes
    source: str
    name: str = ""
    value: dict | None = None
    sources: list[str] = field(default_factory=list)


Log = Callable[[str], None]

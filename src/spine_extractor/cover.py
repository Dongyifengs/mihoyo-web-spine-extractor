"""Clean activity covers from an isolated browser page, without changing source assets."""

import asyncio
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from playwright.async_api import Error

from .models import Log, Options

COVER_WAIT_SECONDS = 20
COVER_VIEWPORT = {"width": 1280, "height": 720}
CLEANUP = Path(__file__).with_name("static").joinpath("cover-cleanup.js").read_text("utf-8")


@dataclass
class Cover:
    image: bytes
    metadata: dict


async def page_cover(page, options: Options, log: Log) -> Cover:
    log(f"封面：网页加载后等待 {COVER_WAIT_SECONDS} 秒")
    loaded_at = time.monotonic()
    deadline = loaded_at + COVER_WAIT_SECONDS + options.timeout

    def navigation_loaded():
        nonlocal loaded_at
        loaded_at = time.monotonic()

    page.on("load", navigation_loaded)
    try:
        while time.monotonic() < loaded_at + COVER_WAIT_SECONDS:
            options.check()
            if time.monotonic() >= deadline:
                raise RuntimeError("网页持续跳转，未能截取稳定封面")
            if page.is_closed():
                raise RuntimeError("网页已关闭，无法生成封面")
            await asyncio.sleep(min(0.25, max(0, loaded_at + COVER_WAIT_SECONDS - time.monotonic())))
        options.check()
        hidden = 0
        cleaned = []
        try:
            for frame in page.frames:
                try:
                    hidden += await frame.evaluate(CLEANUP)
                    cleaned.append(frame)
                except Error:
                    if frame == page.main_frame:
                        raise
            # Visibility changes leave the canvas size and running animation intact.
            await page.evaluate("""() => new Promise(resolve => {
                const timer = setTimeout(resolve, 250);
                requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(timer); resolve(); }));
            })""")
            image = await page.screenshot(type="jpeg", quality=86, full_page=False, timeout=15000)
            options.check()
            metadata = {"file": "cover.jpg", "captured_at": datetime.now(timezone.utc).isoformat(),
                        "source_url": page.url, "wait_seconds": COVER_WAIT_SECONDS,
                        "hidden_layers": hidden, **(page.viewport_size or COVER_VIEWPORT)}
            log(f"封面已截取，隐藏 {hidden} 个界面元素")
            return Cover(image, metadata)
        finally:
            for frame in cleaned:
                try:
                    await frame.evaluate("() => window.__spineCoverRestore?.()")
                except Error:
                    pass
    finally:
        page.remove_listener("load", navigation_loaded)


def save_cover(folder: Path, cover: Cover) -> dict:
    target = folder / "cover.jpg"
    temporary = target.with_suffix(".jpg.part")
    try:
        temporary.write_bytes(cover.image)
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    return cover.metadata

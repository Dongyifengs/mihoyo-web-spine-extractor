import asyncio
import time
from dataclasses import dataclass

from playwright.async_api import Error, async_playwright

from .cover import COVER_VIEWPORT, Cover, page_cover
from .models import Cancelled, Log, Options, Resource
from .network import Fetcher
from .urls import ASSET_EXTS, http_url, suffix


@dataclass
class CaptureResult:
    url: str
    html: str
    cover: Cover | None = None
    cover_error: str = ""


async def launch_browser(pw, options: Options, *, headed=None):
    failures = []
    channels = [None, "msedge", "chrome"] if options.browser == "auto" else [None if options.browser == "chromium" else options.browser]
    for channel in channels:
        try:
            return await pw.chromium.launch(channel=channel, headless=not (options.headed if headed is None else headed),
                proxy={"server": options.proxy} if options.proxy else None)
        except Error as exc:
            failures.append(str(exc).splitlines()[0])
    raise RuntimeError("没有可用浏览器。安装 Edge / Chrome，或执行 python -m playwright install chromium。" + " | ".join(failures))


async def capture_cover(url: str, options: Options, log: Log) -> Cover:
    """A fresh context for existing activities and static extraction; never use a signed-in profile."""
    url = http_url(url)
    if not url:
        raise ValueError("活动没有有效的 HTTP(S) 网页地址")
    options.check()
    async with async_playwright() as pw:
        browser = await launch_browser(pw, options, headed=False)
        try:
            page = await browser.new_page(viewport=COVER_VIEWPORT, accept_downloads=False)
            response = await page.goto(url, wait_until="load", timeout=options.timeout * 1000)
            if response and response.status >= 400:
                raise RuntimeError(f"活动网页返回 HTTP {response.status}")
            return await page_cover(page, options, log)
        finally:
            await browser.close()


async def capture(fetcher: Fetcher, url: str, *, with_cover=False) -> CaptureResult:
    """Capture an isolated browsing session, including frames, lazy scripts and API payloads."""
    options = fetcher.options
    tasks: set[asyncio.Task] = set()
    cover_task = None
    async with async_playwright() as pw:
        browser = await launch_browser(pw, options)
        try:
            context = await browser.new_context(viewport=COVER_VIEWPORT, accept_downloads=False)

            async def response_body(response):
                try:
                    if response.status != 200 or response.url in fetcher.resources:
                        return
                    if len(fetcher.resources) >= options.max_files:
                        fetcher.failures[response.url] = "浏览器捕获达到文件数限制"
                        return
                    mime = response.headers.get("content-type", "")
                    kind = response.request.resource_type
                    if kind not in {"document", "script", "stylesheet", "xhr", "fetch", "image"} and suffix(response.url) not in ASSET_EXTS:
                        return
                    if any(x in mime for x in ("audio/", "video/", "font/")):
                        return
                    if int(response.headers.get("content-length", "0")) > options.max_file_mb * 1024**2:
                        fetcher.failures[response.url] = "浏览器响应超过单文件限制"
                        return
                    body = await response.body()
                    options.check()
                    fetcher.remember(Resource(response.url, body, mime))
                except (Error, ValueError):
                    # Aborted/incomplete response bodies are common during navigation.
                    pass

            def on_response(response):
                task = asyncio.create_task(response_body(response))
                tasks.add(task)
                task.add_done_callback(tasks.discard)

            context.on("response", on_response)
            page = await context.new_page()
            fetcher.log(f"浏览器捕获 {options.wait:g} 秒" + ("，可在浏览器中点击活动内容" if options.headed else ""))
            try:
                await page.goto(url, wait_until="load" if with_cover else "domcontentloaded", timeout=options.timeout * 1000)
            except Error as exc:
                fetcher.log(f"页面导航提示: {str(exc).splitlines()[0]}")
            if with_cover:
                cover_task = asyncio.create_task(page_cover(page, options, fetcher.log))
            deadline = time.monotonic() + options.wait
            while time.monotonic() < deadline:
                options.check()
                if page.is_closed():
                    break
                await asyncio.sleep(0.25)
            if page.is_closed():
                return CaptureResult(url, "", cover_error="网页已关闭，无法生成封面" if with_cover else "")
            cover, cover_error = None, ""
            if cover_task:
                try:
                    cover = await cover_task
                except Cancelled:
                    raise
                except Exception as exc:
                    cover_error = str(exc).splitlines()[0]
                    fetcher.log(f"封面截图失败：{cover_error}")
            final_url, html = page.url, await page.content()
            context.remove_listener("response", on_response)
            if tasks:
                done, pending = await asyncio.wait(tasks, timeout=min(options.timeout, 10))
                for task in done:
                    task.result()
                for task in pending:
                    task.cancel()
                await asyncio.gather(*pending, return_exceptions=True)
            # Reuse only this isolated session's cookies for CDN downloads.
            for cookie in await context.cookies():
                fetcher.client.cookies.set(cookie["name"], cookie["value"], domain=cookie["domain"], path=cookie["path"])
            return CaptureResult(final_url, html, cover, cover_error)
        finally:
            if cover_task:
                cover_task.cancel()
                await asyncio.gather(cover_task, return_exceptions=True)
            for task in tasks:
                task.cancel()
            await asyncio.gather(*list(tasks), return_exceptions=True)
            await browser.close()

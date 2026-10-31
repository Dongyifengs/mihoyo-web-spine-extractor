import asyncio
from datetime import datetime
from pathlib import Path

from .browser import capture
from .discovery import Scanner
from .export import export, write_json
from .models import Cancelled, Log, Options
from .network import Fetcher
from .resolve import Target, resolve
from .urls import digest, safe_name


async def crawl(scanner: Scanner, fetcher: Fetcher):
    while True:
        fetcher.options.check()
        pending = sorted(scanner.refs - scanner.scanned - fetcher.attempted)
        # Browser responses may already be in memory without a static HTTP request.
        cached = sorted((scanner.refs & fetcher.resources.keys()) - scanner.scanned)
        for url in cached:
            await asyncio.to_thread(scanner.scan, fetcher.resources[url])
            scanner.scanned.add(url)
        if not pending:
            if cached:
                continue
            break
        batch = pending[:fetcher.options.concurrency]
        resources = await asyncio.gather(*(fetcher.get(u, scanner.page_url) for u in batch))
        for url, resource in zip(batch, resources):
            if resource:
                await asyncio.to_thread(scanner.scan, resource)
                scanner.scanned.add(url)
        fetcher.log(f"扫描资源 {len(scanner.scanned)} 个 · 骨骼 {len(scanner.skeletons)} · 图集 {len(scanner.atlases)}")
        if len(fetcher.attempted) >= fetcher.options.max_files:
            scanner.warnings.append("已达到静态扫描文件数上限，可调大 --max-files 后重试")
            break


async def extract_target(target: Target, options: Options, log: Log, batch_folder: Path) -> dict:
    async with Fetcher(options, log) as fetcher:
        scanner = Scanner(target.url)
        log(f"开始活动: {target.title or target.url}")
        resource = await fetcher.get(target.url)
        if resource:
            scanner.page_url = resource.url
            await asyncio.to_thread(scanner.scan, resource)
            await crawl(scanner, fetcher)
        elif options.mode == "static":
            raise RuntimeError(f"页面下载失败: {fetcher.failures.get(target.url, target.url)}")
        browser_ok = False
        if options.mode in {"auto", "browser"}:
            try:
                final_url, markup = await capture(fetcher, target.url)
                scanner.page_url = final_url
                if markup:
                    await asyncio.to_thread(scanner.scan_html, markup, final_url)
                for item in list(fetcher.resources.values()):
                    options.check()
                    await asyncio.to_thread(scanner.scan, item)
                await crawl(scanner, fetcher)
                browser_ok = True
            except Cancelled:
                raise
            except Exception as exc:
                scanner.warnings.append(f"浏览器捕获未完成: {exc}")
                log(scanner.warnings[-1])
        if not scanner.skeletons:
            scanner.warnings.append("未发现骨骼：页面可能没有 Spine、活动已下线，或需要交互才能加载。")
        title = scanner.title or target.title or target.url.split("/event/")[-1].split("/")[0]
        folder = batch_folder / (safe_name(title, "activity")[:48] + "-" + digest(target.url.split("?", 1)[0], 8))
        if folder.exists():
            folder = folder.with_name(folder.name + "-" + digest(target.url, 8))
        manifest = await export(scanner, fetcher, folder, {
            "input_url": target.url, "article_url": target.article, "title": title,
            "mode": options.mode, "browser_capture": browser_ok,
        })
        return {"url": target.url, "folder": str(folder.resolve()), "report": str((folder / "report.html").resolve()),
                "skeletons": manifest["skeleton_count"], "atlases": manifest["atlas_count"],
                "complete": manifest["complete_count"], "partial": sum(g["status"] != "complete" for g in manifest["groups"]),
                "warnings": manifest["warnings"]}


async def run(urls: list[str], options: Options, log: Log = print) -> dict:
    """One run gets a fresh directory. Partial batch results survive errors/cancellation."""
    options.output.mkdir(parents=True, exist_ok=True)
    run_name = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    folder = options.output.resolve() / run_name
    folder.mkdir(exist_ok=False)
    result = {"directory": str(folder), "activities": [], "errors": [], "cancelled": False}
    seen = set()
    try:
        for url in urls:
            options.check()
            try:
                async with Fetcher(options, log) as fetcher:
                    targets = await resolve(fetcher, url)
            except Cancelled:
                raise
            except Exception as exc:
                result["errors"].append({"url": url, "error": str(exc)})
                log(f"入口解析失败: {exc}")
                continue
            for target in targets:
                options.check()
                key = target.url.split("?", 1)[0].rstrip("/")
                if key in seen:
                    continue
                seen.add(key)
                try:
                    activity = await extract_target(target, options, log, folder)
                    result["activities"].append(activity)
                    log(f"报告已保存: {activity['report']}")
                except Cancelled:
                    raise
                except Exception as exc:
                    result["errors"].append({"url": target.url, "error": str(exc)})
                    log(f"活动处理失败: {exc}")
                write_json(folder / "batch.json", result)
    except Cancelled:
        result["cancelled"] = True
        log("已取消，已完成的文件保留")
    except asyncio.CancelledError:
        result["cancelled"] = True
        raise
    finally:
        write_json(folder / "batch.json", result)
    return result

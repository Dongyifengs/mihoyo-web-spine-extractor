import argparse
import asyncio
import json
import sys
from pathlib import Path

from . import __version__
from .engine import run
from .models import Options
from .network import Fetcher
from .resolve import resolve


def parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="米哈游网页 Spine 提取器：支持活动页、新闻页和 RSS/Atom/JSON Feed")
    p.add_argument("urls", nargs="*", help="一个或多个网页地址")
    p.add_argument("--version", action="version", version=__version__)
    p.add_argument("--urls-file", type=Path, help="UTF-8 文本，每行一个网址")
    p.add_argument("-o", "--output", type=Path, default=Path("outputs"), help="输出目录，默认 outputs")
    p.add_argument("--title", default="", help="活动名称，留空读取网页标题")
    p.add_argument("--spine-cli", default="", help="可选，已激活的正版 Spine CLI 路径，如 spine.com")
    p.add_argument("--spine-version", default="", help="可选，指定用于导入工程的编辑器版本")
    p.add_argument("--spine-timeout", type=float, default=180, help="每组工程转换超时秒数")
    p.add_argument("--mode", choices=["auto", "static", "browser"], default="auto", help="auto/browser 均扫描静态资源并捕获浏览器；static 仅静态")
    p.add_argument("--browser", choices=["auto", "chromium", "msedge", "chrome"], default="auto")
    p.add_argument("--headed", action="store_true", help="显示浏览器，可手动触发活动场景")
    p.add_argument("--wait", type=float, default=12, help="页面打开后的捕获秒数，默认 12")
    p.add_argument("--feed-limit", type=int, default=3, help="每个订阅源最多处理多少个入口，默认 3")
    p.add_argument("--list", action="store_true", help="只列出解析后的活动入口")
    p.add_argument("--concurrency", type=int, default=6)
    p.add_argument("--timeout", type=float, default=25)
    p.add_argument("--retries", type=int, default=2)
    p.add_argument("--max-files", type=int, default=1500)
    p.add_argument("--max-file-mb", type=int, default=48)
    p.add_argument("--max-total-mb", type=int, default=512)
    p.add_argument("--proxy", help="例如 http://127.0.0.1:7890；HTTP 下载也支持系统环境变量代理")
    p.add_argument("--no-unpack", action="store_true", help="只保存骨骼、图集和整张贴图，不拆分区域图片")
    p.add_argument("--json", action="store_true", help="标准输出仅打印最终 JSON 摘要，日志输出到 stderr")
    return p


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        if stream and hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv or argv[0] == "serve":
        from .server import main as serve
        serve(argv[1:] if argv else [])
        return 0
    p = parser()
    args = p.parse_args(argv)
    urls = args.urls[:]
    if args.urls_file:
        try:
            urls.extend(line.strip() for line in args.urls_file.read_text("utf-8-sig").splitlines()
                        if line.strip() and not line.lstrip().startswith("#"))
        except OSError as exc:
            p.error(str(exc))
    if not urls:
        p.error("没有输入地址")
    def log(message):
        print(message, file=sys.stderr, flush=True)
    try:
        options = Options(
            output=args.output, mode=args.mode, browser=args.browser, headed=args.headed, wait=args.wait,
            feed_limit=args.feed_limit, concurrency=args.concurrency, timeout=args.timeout, retries=args.retries,
            max_files=args.max_files, max_file_mb=args.max_file_mb, max_total_mb=args.max_total_mb,
            proxy=args.proxy, unpack=not args.no_unpack,
            title=args.title, spine_cli=args.spine_cli, spine_version=args.spine_version, spine_timeout=args.spine_timeout,
        )
        if args.list:
            async def listing():
                async with Fetcher(options, log) as fetcher:
                    return [t.__dict__ for u in urls for t in await resolve(fetcher, u)]
            print(json.dumps(asyncio.run(listing()), ensure_ascii=False, indent=2))
            return 0
        result = asyncio.run(run(urls, options, log))
    except KeyboardInterrupt:
        return 130
    except (ValueError, RuntimeError) as exc:
        log(f"错误: {exc}")
        return 1
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        complete = sum(a["complete"] for a in result["activities"])
        print(f"处理结束：{len(result['activities'])} 个活动，{complete} 组完整资源\n结果目录：{result['directory']}")
    if result["cancelled"]:
        return 130
    if result["errors"] or not result["activities"] or any(
        a["partial"] or a.get("conversion_failed") or not a["skeletons"] or (args.mode == "browser" and a["warnings"])
        for a in result["activities"]
    ):
        return 2
    return 0

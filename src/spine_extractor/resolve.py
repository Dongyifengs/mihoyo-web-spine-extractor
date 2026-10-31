import html
import json
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass

from bs4 import BeautifulSoup

from .browser import capture
from .network import Fetcher
from .urls import event_link, http_url


@dataclass
class Target:
    url: str
    title: str = ""
    article: str = ""


def activity_links(text: str, base: str) -> list[str]:
    # Handles JSON-escaped article HTML as well as ordinary anchor elements.
    text = html.unescape(text.replace("\\/", "/").replace('\\"', '"').replace("\\u0026", "&"))
    soup = BeautifulSoup(text, "html.parser")
    priority, rest = [], []
    for anchor in soup.find_all("a", href=True):
        url = http_url(anchor["href"], base)
        if url and event_link(url):
            (priority if re.search("参与|前往|进入|点击", anchor.get_text()) else rest).append(url)
    for value in re.findall(r"https?://[^\s<>\"'\\]+", text):
        url = http_url(value)
        if url and event_link(url):
            rest.append(url)
    return list(dict.fromkeys(priority or rest))


def parse_feed(body: bytes, base: str) -> list[Target] | None:
    targets = []
    try:
        value = json.loads(body)
    except ValueError:
        value = None
    if isinstance(value, dict) and isinstance(value.get("items"), list):
        for item in value["items"]:
            if not isinstance(item, dict):
                continue
            article = http_url(item.get("url", item.get("link", "")), base) or ""
            links = activity_links(item.get("content_html", "") + item.get("content_text", ""), base)
            for url in links or ([article] if article else []):
                targets.append(Target(url, item.get("title", ""), article))
        return targets
    try:
        root = ET.fromstring(body)
    except ET.ParseError:
        return None
    if root.tag.split("}")[-1] not in {"rss", "feed", "RDF"}:
        return None
    for item in root.iter():
        if item.tag.split("}")[-1] not in {"item", "entry"}:
            continue
        title, article, contents = "", "", []
        for child in item:
            tag = child.tag.split("}")[-1]
            if tag == "title":
                title = "".join(child.itertext())
            elif tag == "link" and child.get("rel", "alternate") == "alternate":
                article = http_url(child.get("href") or child.text or "", base) or ""
            elif tag in {"encoded", "content", "description", "summary"}:
                contents.append("".join(child.itertext()) + ET.tostring(child, encoding="unicode"))
        links = activity_links("\n".join(contents), article or base)
        for url in links or ([article] if article else []):
            targets.append(Target(url, title, article))
    return targets


async def resolve(fetcher: Fetcher, input_url: str) -> list[Target]:
    url = http_url(input_url)
    if not url:
        raise ValueError("请输入完整的 http:// 或 https:// 网页地址")
    if event_link(url):
        return [Target(url)]
    resource = await fetcher.get(url)
    if not resource:
        raise RuntimeError(f"无法访问输入地址: {fetcher.failures.get(url, url)}")
    feed = parse_feed(resource.body, resource.url)
    if feed is not None:
        unique = {}
        for target in feed:
            # Tracking parameters do not identify a different activity.
            unique.setdefault(target.url.split("?", 1)[0].rstrip("/"), target)
        chosen = list(unique.values())[:fetcher.options.feed_limit]
        if not chosen:
            raise RuntimeError("订阅源中未找到活动或文章链接")
        fetcher.log(f"订阅源发现 {len(unique)} 个入口，本次处理前 {len(chosen)} 个")
        result = []
        for target in chosen:
            if event_link(target.url):
                result.append(target)
            else:
                for resolved in await resolve_article(fetcher, target.url, target.title):
                    result.append(resolved)
        return result
    links = activity_links(resource.text, resource.url)
    if links:
        return [Target(link, article=resource.url) for link in links]
    if "/news/" in resource.url or "/article/" in resource.url:
        return await resolve_article(fetcher, resource.url)
    return [Target(resource.url)]


async def resolve_article(fetcher: Fetcher, url: str, title: str = "") -> list[Target]:
    resource = await fetcher.get(url)
    links = activity_links(resource.text, resource.url) if resource else []
    if not links:
        if fetcher.options.mode == "static":
            raise RuntimeError("文章为动态页面，请使用自动/浏览器模式，或直接粘贴“点击参与活动”的地址")
        fetcher.log("正在展开动态新闻页，查找“点击参与活动”入口")
        final_url, markup = await capture(fetcher, url)
        links = activity_links(markup, final_url)
        if not links:
            for captured in list(fetcher.resources.values()):
                if "json" in captured.content_type:
                    links.extend(activity_links(captured.text, final_url))
    if not links:
        raise RuntimeError(f"未找到活动入口，请粘贴活动本身的地址: {url}")
    return [Target(link, title, url) for link in dict.fromkeys(links)]

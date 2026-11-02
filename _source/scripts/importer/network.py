import asyncio

import httpx

from .models import Log, Options, Resource
from .urls import http_url

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"


class Fetcher:
    def __init__(self, options: Options, log: Log = print):
        self.options, self.log = options, log
        self.resources: dict[str, Resource] = {}
        self.failures: dict[str, str] = {}
        self.attempted: set[str] = set()
        self.transferred = 0
        self.sem = asyncio.Semaphore(options.concurrency)
        self.client = httpx.AsyncClient(
            follow_redirects=False, timeout=options.timeout,
            headers={"User-Agent": UA}, proxy=options.proxy,
            limits=httpx.Limits(max_connections=options.concurrency * 2),
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        await self.client.aclose()

    def remember(self, resource: Resource) -> bool:
        if resource.url in self.resources:
            return True
        if len(resource.body) > self.options.max_file_mb * 1024**2:
            self.failures[resource.url] = "超过单文件大小限制"
            return False
        if self.transferred + len(resource.body) > self.options.max_total_mb * 1024**2:
            self.failures[resource.url] = "超过总下载大小限制"
            return False
        self.transferred += len(resource.body)
        self.resources[resource.url] = resource
        return True

    async def get(self, url: str, referer: str = "") -> Resource | None:
        self.options.check()
        url = http_url(url) or ""
        if not url:
            return None
        if url in self.resources:
            return self.resources[url]
        if url in self.attempted:
            return None
        if len(self.attempted) >= self.options.max_files:
            self.failures[url] = "超过请求数量限制"
            return None
        self.attempted.add(url)
        async with self.sem:
            for attempt in range(self.options.retries + 1):
                self.options.check()
                try:
                    async with self.client.stream("GET", url, headers={"Referer": referer} if referer else {}) as response:
                        if response.is_redirect:
                            target = http_url(response.headers.get('location', ''), url)
                            if not target or target in self.attempted:
                                raise ValueError('重定向目标不在官方资源范围内或出现循环')
                            # Release this semaphore before following the redirect.
                            break
                        response.raise_for_status()
                        chunks, size = [], 0
                        async for chunk in response.aiter_bytes():
                            self.options.check()
                            size += len(chunk)
                            if size > self.options.max_file_mb * 1024**2:
                                raise ValueError("超过单文件大小限制")
                            if self.transferred + size > self.options.max_total_mb * 1024**2:
                                raise ValueError("超过总下载大小限制")
                            chunks.append(chunk)
                        resource = Resource(str(response.url), b"".join(chunks), response.headers.get("content-type", ""))
                        if self.remember(resource):
                            self.resources[url] = resource
                            return resource
                        self.failures[url] = self.failures.get(resource.url, "下载受限")
                        return None
                except (httpx.HTTPError, ValueError) as exc:
                    self.failures[url] = str(exc)
                    if isinstance(exc, ValueError):
                        break
                    if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code < 500 and exc.response.status_code != 429:
                        break
                    if attempt < self.options.retries:
                        await asyncio.sleep(min(2**attempt, 4))
        if 'target' in locals() and target:
            return await self.get(target, referer)
        return None

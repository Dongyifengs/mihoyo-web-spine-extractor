"""Read news HTML, falling back to the public content endpoint used by the official page."""
import json
import re
from urllib.parse import urlencode, urljoin, urlsplit

from bs4 import BeautifulSoup

from .urls import event_link, http_url

OFFICIAL_CONTENT = 'https://act-api-takumi-static.mihoyo.com/content_v2_user/app/16471662a82d418a/getContent'


class SourceUnavailable(RuntimeError):
    pass


def article_url(row):
    match = re.fullmatch(r'genshin\.web_cn-(\d+)', row['key'])
    if not match:
        raise ValueError('新闻标识无效')
    return 'https://ys.mihoyo.com/main/news/detail/' + match[1]


def activity_links(content, base):
    soup = BeautifulSoup(content, 'html.parser')
    links = list(dict.fromkeys(url for a in soup.select('a[href]')
                               if (url := http_url(urljoin(base, a['href'])))))
    events = [url for url in links if event_link(url) and '/event/' in urlsplit(url).path]
    return events or [url for url in links if event_link(url) or urlsplit(url).hostname in {'mhyurl.cn', 'hoyo.link'}]


def payload(resource):
    try:
        value = json.loads(resource.body) if resource else {}
        return value if isinstance(value, dict) else {}
    except (ValueError, UnicodeError):
        return {}


def valid_body(content):
    if not isinstance(content, str) or not content.strip():
        return False
    soup = BeautifulSoup(content, 'html.parser')
    for tag in soup.select('script, style'):
        tag.decompose()
    text = soup.get_text(strip=True)
    return bool(text or soup.select_one('img[src], a[href]')) and not text.startswith('新闻加载失败')


async def fetch_article(fetcher, row):
    article = article_url(row)
    detail_url = 'https://news-api.amarea.cn/news/detail/' + row['key']
    response = payload(await fetcher.get(detail_url))
    detail = response.get('data') if isinstance(response.get('data'), dict) else {}
    if response.get('code') == 200 and detail.get('key') == row['key'] and valid_body(detail.get('content')):
        return {**row, **detail, 'articleUrl': article, 'contentSource': detail_url, 'sourceType': 'news-api'}

    # Prefer HTML already rendered by the official website, when available.
    page = await fetcher.get(article)
    soup = BeautifulSoup(page.text, 'html.parser') if page else BeautifulSoup('', 'html.parser')
    body = soup.select_one('.article__content')
    if body and valid_body(str(body)):
        return {**row, 'content': str(body), 'articleUrl': article, 'contentSource': article, 'sourceType': 'official-page'}

    # The Nuxt page normally renders its body from this public, unauthenticated GET.
    endpoint = OFFICIAL_CONTENT + '?' + urlencode({'iAppId': 43, 'iInfoId': row['key'].rsplit('-', 1)[1], 'sLangKey': 'zh-cn', 'iAround': 0})
    response = payload(await fetcher.get(endpoint, article))
    data = response.get('data') if isinstance(response.get('data'), dict) else {}
    if response.get('retcode') != 0 or str(data.get('iInfoId')) != row['key'].rsplit('-', 1)[1] or not valid_body(data.get('sContent')):
        raise SourceUnavailable('新闻接口与官方正文均读取失败，可打开原文核对：' + article)
    content = data['sContent']
    cover = row.get('coverUrl') or next((i.get('src') for i in BeautifulSoup(content, 'html.parser').select('img[src]')), None)
    published = data.get('dtStartTime')
    return {**row, 'title': data.get('sTitle') or row['title'], 'content': content, 'coverUrl': cover,
            'startTime': row.get('startTime') or (published.replace(' ', 'T') + '+08:00' if published else ''),
            'articleUrl': article, 'contentSource': endpoint, 'sourceType': 'official-page'}


def content_fingerprint_data(detail):
    # Provider/provenance changes must not make an unchanged article a new task.
    return {key: detail.get(key) for key in ('title', 'content', 'coverUrl', 'startTime')}

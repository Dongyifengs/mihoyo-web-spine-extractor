"""HoyoNews public API adapter. Only exact-tagged web events become targets."""

import json
import re
from urllib.parse import quote, urlsplit

API_BASE = 'https://news-api.amarea.cn'
API_HOSTS = {'news-api.amarea.cn', 'news-api.hk4e.com'}
TAGS = {'genshin': '网页活动', 'starrail': '版本专题展示页', 'zzz': '网页活动'}
GAMES = {
    'genshin': ('原神', 'https://ys.mihoyo.com/main/news/detail/{id}', 'ys'),
    'starrail': ('崩坏：星穹铁道', 'https://sr.mihoyo.com/news/{id}', 'sr'),
    'zzz': ('绝区零', 'https://zzz.mihoyo.com/news/{id}', 'zzz'),
}
SOURCES = {f'{game}.{channel}': f'{name} · {label}'
           for game, (name, _, _) in GAMES.items() for channel, label in [('web_cn', '官网'), ('bbs_cn_all', '米游社')]}


def validate_source(source: str) -> str:
    if source not in SOURCES:
        raise ValueError('不支持的新闻来源，请选择原神、星穹铁道或绝区零的官网 / 米游社')
    return source


def source_from_key(key: str) -> str:
    source, separator, remote_id = key.partition('-')
    validate_source(source)
    if not separator or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', remote_id):
        raise ValueError('无效的新闻标识')
    return source


def news_input(url: str) -> tuple[str, str] | None:
    parsed = urlsplit(url)
    if parsed.hostname == 'news.hk4e.com':
        return 'list', 'genshin.web_cn'
    if parsed.hostname not in API_HOSTS:
        return None
    path = parsed.path.strip('/').split('/')
    if len(path) == 3 and path[:2] == ['news', 'detail']:
        source_from_key(path[2])
        return 'detail', path[2]
    if len(path) == 3 and path[:2] == ['news', 'feed']:
        return 'list', validate_source(path[2])
    if len(path) == 2 and path[0] == 'news':
        return 'list', validate_source(path[1])
    return None


async def payload(fetcher, path):
    url = API_BASE + path
    resource = await fetcher.get(url)
    if not resource:
        raise RuntimeError('HoyoNews API 无法访问：' + fetcher.failures.get(url, url))
    try:
        data = json.loads(resource.body)
    except ValueError as exc:
        raise ValueError('HoyoNews API 未返回有效 JSON') from exc
    if not isinstance(data, dict) or data.get('code') != 200 or not isinstance(data.get('data'), dict):
        raise ValueError('HoyoNews API：' + str(data.get('message', '数据格式不兼容') if isinstance(data, dict) else '数据格式不兼容'))
    return data['data']


def tagged(item, source):
    return isinstance(item, dict) and isinstance(item.get('tags'), list) and TAGS[source.split('.')[0]] in item['tags']


def article_url(source, remote_id):
    game, channel = source.split('.')
    _, template, bbs = GAMES[game]
    return (template if channel == 'web_cn' else f'https://www.miyoushe.com/{bbs}/article/{{id}}').format(id=quote(str(remote_id), safe=''))


async def list_events(fetcher, source='genshin.web_cn'):
    validate_source(source)
    tag = TAGS[source.split('.')[0]]
    data = await payload(fetcher, '/news/' + source)
    rows = data.get('list')
    if not isinstance(rows, list):
        raise ValueError('HoyoNews API 缺少新闻列表')
    seen, items = set(), []
    for row in rows:
        if not tagged(row, source):
            continue
        key = row.get('key')
        if not isinstance(key, str) or key in seen:
            continue
        try:
            if source_from_key(key) != source:
                continue
        except ValueError:
            continue
        seen.add(key)
        items.append({'key': key, 'title': str(row.get('title') or key), 'tags': [tag],
                      'published_at': str(row.get('startTime') or ''), 'article_url': article_url(source, row.get('remoteId') or key.partition('-')[2]),
                      'input_url': API_BASE + '/news/detail/' + key})
    items.sort(key=lambda item: item['published_at'], reverse=True)
    return {'source': source, 'source_name': SOURCES[source], 'tag': tag, 'total': len(items),
            'updated_at': data.get('lastSync', ''), 'items': items}


async def resolve_event(fetcher, key):
    from .resolve import Target, activity_links

    source = source_from_key(key)
    data = await payload(fetcher, '/news/detail/' + key)
    tag = TAGS[source.split('.')[0]]
    if not tagged(data, source):
        raise ValueError(f'这篇新闻没有「{tag}」标签，已跳过')
    if data.get('key') != key:
        raise ValueError('HoyoNews 返回的新闻标识不匹配')
    article = article_url(source, data.get('remoteId') or key.partition('-')[2])
    content = data.get('content')
    if not isinstance(content, str):
        raise ValueError('HoyoNews 新闻正文为空')
    links = activity_links(content, article)
    if not links:
        raise ValueError(f'带有「{tag}」标签，但正文未找到活动入口：' + str(data.get('title') or key))
    return [Target(url, str(data.get('title') or ''), article) for url in links]


async def resolve_news(fetcher, request):
    kind, value = request
    if kind == 'detail':
        return await resolve_event(fetcher, value)
    listing = await list_events(fetcher, value)
    chosen = listing['items'][:fetcher.options.feed_limit]
    fetcher.log(f"HoyoNews：仅保留「{listing['tag']}」标签，共 {listing['total']} 条，本次解析前 {len(chosen)} 条")
    targets, seen, errors = [], set(), []
    for item in chosen:
        fetcher.options.check()
        try:
            for target in await resolve_event(fetcher, item['key']):
                key = target.url.split('?', 1)[0].rstrip('/')
                if key not in seen:
                    targets.append(target)
                    seen.add(key)
        except (ValueError, RuntimeError) as exc:
            errors.append(str(exc))
            fetcher.log('新闻入口跳过：' + str(exc))
    if not targets:
        raise ValueError('未找到可提取的网页活动' + ('：' + '；'.join(errors) if errors else ''))
    return targets

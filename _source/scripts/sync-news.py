"""Import public event links, without executing scripts or storing Spine payloads."""
import argparse
import copy
import asyncio
import hashlib
import html
import io
import json
import os
import re
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

from bs4 import BeautifulSoup
from PIL import Image
from importer.discovery import Scanner, binary_version
from importer.matching import pair_assets, attachments
from importer.atlas import parse_atlas, numbers
from importer.models import Options
from importer.network import Fetcher
from importer.urls import normalized_name, event_link
from importer.jobs import AssetValidationError, EmptyActivity, CATEGORIES, LABELS, failure_record, failed_jobs, select_jobs, summarize
from importer.news import SourceUnavailable, article_url, activity_links, fetch_article, content_fingerprint_data

ROOT = Path(__file__).resolve().parent.parent
API = 'https://news-api.amarea.cn/news/genshin.web_cn'
VERSION = 1
ADAPTER_VERSION = 2
VERBOSE = False


def digest(value):
    return hashlib.sha256(value if isinstance(value, bytes) else json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    for attempt in range(10):
        try:
            temporary.replace(path)
            break
        except PermissionError:
            if attempt == 9:
                raise
            time.sleep(0.05)


def read(path, fallback):
    return json.loads(path.read_text(encoding='utf8')) if path.exists() else fallback


def canonical(url):
    p = urlsplit(url)
    path = p.path.rstrip('/')
    if path.endswith('/index.html'):
        path = path[:-11]
    return urlunsplit(('https', p.netloc.lower(), path, '', ''))


def links_from_article(content, base):
    return activity_links(content, base)


def source_ref(asset, fetcher, kind=None):
    url, _, fragment = asset.source.partition('#')
    fmt = kind or asset.kind
    ref = {'url': url, 'format': fmt, 'sizeBytes': len(asset.data)}
    if fragment.startswith('js-'):
        ref.update(format='embedded-' + ('image' if fmt == 'image' else fmt), key='@byte:' + fragment[3:])
        ref['sourceSha256'] = digest(fetcher.resources[url].text.encode('utf8'))
    elif fragment or (fmt == 'json' and urlsplit(url).path.endswith('.js')):
        raise ValueError('尚未适配的内嵌资源定位方式：' + asset.source)
    return ref


def image_size(data):
    try:
        with Image.open(io.BytesIO(data)) as image:
            size = image.size
            image.verify()
            return size
    except (OSError, ValueError):
        return None


def image_digest(data):
    with Image.open(io.BytesIO(data)) as image:
        return digest(image.convert('RGBA').tobytes())


def square_pot_variant(expected, actual):
    # Some official pipelines stretch the whole image to a square power-of-two
    # texture. Normalized atlas UVs remain valid without rewriting coordinates.
    if not expected or not actual or min(expected) <= 0:
        return False
    side = 1 << (int(max(expected)) - 1).bit_length()
    return actual == (side, side)


async def crawl(scanner, fetcher):
    while True:
        pending = sorted(scanner.refs - scanner.scanned - fetcher.attempted)
        if not pending:
            break
        if len(fetcher.attempted) >= fetcher.options.max_files:
            raise ValueError('扫描达到文件数限制，需扩大扫描范围')
        batch = pending[:fetcher.options.concurrency]
        if VERBOSE:
            print(f'  扫描 {len(scanner.scanned)} / 待扫描 {len(pending)}，骨骼 {len(scanner.skeletons)}，图集 {len(scanner.atlases)}', flush=True)
        for resource in await asyncio.gather(*(fetcher.get(u, scanner.page_url) for u in batch)):
            if resource:
                await asyncio.to_thread(scanner.scan, resource)


async def extract(url):
    options = Options(mode='static', cover=False, timeout=18, retries=1, concurrency=5, max_files=2000)
    async with Fetcher(options, lambda *_: None) as fetcher:
        scanner = Scanner(url)
        resource = await fetcher.get(url)
        if not resource:
            raise ValueError('活动入口读取失败：' + fetcher.failures.get(url, url))
        scanner.page_url = resource.url
        await asyncio.to_thread(scanner.scan, resource)
        await crawl(scanner, fetcher)
        matches = pair_assets(scanner.skeletons, scanner.atlases)
        items, issues = [], []
        for match in matches:
            skeleton, atlas = match.skeleton, match.atlas
            registered_sources = set().union(*(scanner.pairs.get(source, set()) for source in skeleton.sources))
            registered = [a for a in scanner.atlases if registered_sources.intersection(a.sources)]
            if len(registered) == 1:
                atlas = registered[0]
            if not atlas:
                # Some official bundles contain both original and runtime-scaled atlases.
                # Resolve ambiguity using actual texture dimensions, never atlas names alone.
                paths = attachments(skeleton.value or {})
                viable = []
                for candidate in registered or scanner.atlases:
                    if normalized_name(candidate.name) != normalized_name(skeleton.name):
                        continue
                    candidate_pages = parse_atlas(candidate.data.decode('utf8'))
                    if paths - {r.name for p in candidate_pages for r in p.regions}:
                        continue
                    verified = True
                    for page in candidate_pages:
                        size = numbers(page.props, 'size')
                        urls = [u for u in scanner.images if normalized_name(u) == normalized_name(page.name)]
                        resources = await asyncio.gather(*(fetcher.get(u, url) for u in urls))
                        if not size or not any(r and image_size(r.body) == size for r in resources):
                            verified = False
                            break
                    if verified:
                        viable.append(candidate)
                if len(viable) == 1:
                    atlas = viable[0]
                elif viable and registered:
                    # The same skeleton is explicitly registered with several resolution variants.
                    atlas = max(viable, key=lambda a: sum(numbers(p.props, 'size')[0] * numbers(p.props, 'size')[1] for p in parse_atlas(a.data.decode('utf8'))))
            if not atlas:
                issues.append((skeleton.name or skeleton.source) + '：图集匹配待适配')
                continue
            pages = parse_atlas(atlas.data.decode('utf8'))
            if skeleton.value and attachments(skeleton.value) - {r.name for p in pages for r in p.regions}:
                issues.append((skeleton.name or skeleton.source) + '：图集区域不完全匹配')
                continue
            textures = []
            for page in pages:
                if page.name.startswith('/') or '\\' in page.name or '..' in page.name.split('/'):
                    raise ValueError('图集页面路径需要适配')
                expected = numbers(page.props, 'size')
                candidates = sorted(u for u in scanner.images if normalized_name(u) == normalized_name(page.name))
                if not candidates:
                    candidates = [urljoin(atlas.source.split('#')[0], page.name)]
                    candidates += [urljoin(prefix, page.name) for prefix in scanner.public_paths]
                possible = []
                for image in await asyncio.gather(*(fetcher.get(candidate, url) for candidate in dict.fromkeys(candidates))):
                    actual = image_size(image.body) if image else None
                    stretched = bool(registered and len(candidates) == 1 and normalized_name(candidates[0]) == normalized_name(page.name) and square_pot_variant(expected, actual))
                    if image and actual and (not expected or expected == (0, 0) or actual == expected or stretched):
                        ref = {'page': page.name, 'url': image.url, 'sizeBytes': len(image.body)}
                        if stretched and actual != expected:
                            ref['textureSizing'] = 'normalized-square-pot'
                        possible.append((image_digest(image.body), ref))
                embedded = [asset for asset in scanner.assets.values() if asset.kind == 'image' and image_size(asset.data)
                            and (not expected or image_size(asset.data) == expected)]
                named = [asset for asset in embedded if normalized_name(asset.name) == normalized_name(page.name)]
                for asset in named or ([] if possible or not expected else embedded):
                    possible.append((image_digest(asset.data), {'page': page.name, **source_ref(asset, fetcher)}))
                if len({key for key, _ in possible}) != 1:
                    issues.append(page.name + '：贴图地址尚未唯一确认')
                    break
                textures.append(possible[0][1])
            if len(textures) != len(pages):
                continue
            value = skeleton.value or {}
            version = value.get('skeleton', {}).get('spine') or binary_version(skeleton.data)
            if not re.match(r'^[34]\.\d+(?:\.\d+|(?:-from-[34]\.\d+)+)', version):
                issues.append(f'{skeleton.name}：骨骼版本尚未识别（{version}）')
                continue
            if re.match(r'^\d+\.\d+', version)[0] not in {'3.8', '4.0', '4.1', '4.2'}:
                issues.append(f'{skeleton.name}：运行时版本尚未支持（{version}）')
                continue
            name = normalized_name(skeleton.name or atlas.name or pages[0].name)
            ident = re.sub('[^a-zA-Z0-9_-]', '-', name).strip('-') or 'spine'
            if any(i['id'] == ident for i in items):
                ident += '-' + digest(skeleton.data)[:8]
            skins = value.get('skins', {})
            items.append({'id': ident, 'name': name, 'version': version,
                          'animations': list(value.get('animations', {})),
                          'skins': list(skins) if isinstance(skins, dict) else [s.get('name', 'default') for s in skins],
                          'hasExtra': 'extra' in value,
                          'premultipliedAlpha': any(p.props.get('pma') == 'true' for p in pages),
                          'skeleton': source_ref(skeleton, fetcher), 'atlas': source_ref(atlas, fetcher), 'textures': textures})
            if VERBOSE:
                print(f'  已验证 {len(items)}/{len(matches)}: {name}', flush=True)
        if issues:
            raise AssetValidationError(issues, {'eventUrl': url, 'scannedFiles': len(scanner.scanned), 'skeletonCount': len(scanner.skeletons),
                                               'atlasCount': len(scanner.atlases), 'failedRequests': fetcher.failures})
        if not items:
            raise EmptyActivity(f'已扫描 {len(scanner.scanned)} 个文件，未发现可收录的 Spine 素材')
        return items, {'files': len(scanner.scanned), 'skeletons': len(scanner.skeletons), 'atlases': len(scanner.atlases)}


async def run(args):
    state_path = ROOT / 'sync-state.json'
    state = read(state_path, {'version': VERSION, 'articles': {}})
    if state.get('version') != VERSION:
        state = {'version': VERSION, 'articles': {}}
    report_path = ROOT / 'public/sync-status.json'
    saved_report = read(report_path, {})
    failures = failed_jobs(state, saved_report)
    retry_failed = getattr(args, 'retry_failed', False)
    report = {'startedAt': datetime.now(timezone.utc).isoformat(), 'running': True, 'total': 0, 'done': 0, 'items': []}
    def progress():
        write(report_path, report)
        write(ROOT / 'sync-failures.json', summarize(failed_jobs(state, report)))
    async with Fetcher(Options(timeout=25, concurrency=3)) as api:
        rows = state.get('queue', []) if retry_failed else []
        if not rows:
            resource = await api.get(API)
            try:
                payload = json.loads(resource.body) if resource else {}
            except ValueError:
                payload = {}
            if isinstance(payload, dict) and payload.get('code') == 200 and isinstance(payload.get('data'), dict) and isinstance(payload['data'].get('list'), list):
                rows = [r for r in payload['data']['list'] if isinstance(r, dict) and '网页活动' in r.get('tags', [])]
                rows = list({r['key']: r for r in rows if re.fullmatch(r'genshin\.web_cn-\d+', r.get('key', ''))}.values())
                state['discoveredTotal'] = len(rows)
            else:
                rows = state.get('queue') or read(ROOT / '.cache/news-list.json', [])
                if not rows:
                    rows = [{'key': r['key'], 'remoteId': r['key'].rsplit('-', 1)[1], 'title': r['title'], 'tags': ['网页活动'], '_savedReport': True}
                            for r in saved_report.get('items', []) if re.fullmatch(r'genshin\.web_cn-\d+', r.get('key', ''))]
                if not rows:
                    raise SourceUnavailable('新闻列表读取失败，且没有已保存的文章清单')
                state.setdefault('discoveredTotal', saved_report.get('discoveredTotal', saved_report.get('total', len(rows))))
                report['notice'] = f'新闻列表暂不可用，继续处理已保存的 {len(rows)} 篇文章；新文章待接口恢复后检查。'
            state['queue'] = rows
            write(state_path, state)
            write(ROOT / '.cache/news-list.json', rows)
        rows = select_jobs(rows, failures, retry_failed, getattr(args, 'category', None), args.limit)
        report['total'] = len(rows)
        report['discoveredTotal'] = state.get('discoveredTotal', len(rows))
        report['items'] = [{'key': row['key'], 'title': row['title'], 'articleUrl': article_url(row), 'status': 'queued'} for row in rows]
        progress()
        catalog = read(ROOT / 'catalog.json', {})
        manifests = {r['id']: read(ROOT / r['manifest'], {}) for r in catalog['projects']}
        changed = False
        event_cache = {}
        unavailable = 0
        for row, result in zip(rows, report['items']):
            key = row['key']
            previous = state['articles'].get(key, {})
            fingerprint = previous.get('fingerprint') if row.get('_savedReport') and previous.get('fingerprint') else digest(row)
            result['status'] = 'checking'
            progress()
            stage = 'network'
            try:
                detail_url = 'https://news-api.amarea.cn/news/detail/' + key
                cached = read(ROOT / '.cache/articles' / (key + '.json'), None) if retry_failed and not args.force and previous.get('fingerprint') == fingerprint else None
                if cached:
                    detail = cached
                else:
                    result['stage'] = '读取新闻，失败时回退官方文章'
                    detail = await fetch_article(api, row)
                if detail.get('key') != key or not isinstance(detail.get('content'), str):
                    raise SourceUnavailable('文章接口未返回有效正文')
                unavailable = 0
                result['sourceType'] = detail.get('sourceType', 'news-api')
                row = {**row, **{k: detail[k] for k in ('title', 'startTime', 'coverUrl') if detail.get(k)}}
                write(ROOT / '.cache/articles' / (key + '.json'), detail)
                content_hash = digest(content_fingerprint_data(detail))
                if (not args.force and previous.get('fingerprint') == fingerprint
                        and previous.get('status') in {'complete', 'no-link', 'empty'} and previous.get('contentHash', content_hash) == content_hash):
                    result.update(status='unchanged' if previous['status'] == 'complete' else previous['status'], projectIds=previous.get('projectIds', []))
                    if previous.get('message'):
                        result['message'] = previous['message']
                    if 'contentHash' not in previous:
                        changed = True
                    previous['contentHash'] = content_hash
                    previous.pop('lastFailure', None)
                    continue
                stage = 'entry'
                article = article_url(row)
                links = links_from_article(detail['content'], article)
                if not links:
                    result.update(status='no-link', message='正文没有可识别的活动链接，可打开原文查看。')
                    state['articles'][key] = {'fingerprint': fingerprint, 'contentHash': content_hash, 'status': 'no-link', 'message': result['message']}
                    changed = True
                    continue
                result.update(status='parsing', links=links)
                progress()
                ids = []
                for link in links:
                    if urlsplit(link).hostname in {'mhyurl.cn', 'hoyo.link'}:
                        resolved = await api.get(link)
                        if not resolved or not event_link(resolved.url):
                            raise ValueError('官方短链接尚未解析到活动入口：' + link)
                        link = resolved.url
                    existing = next((m for m in manifests.values() if canonical(m['sourceUrl']) == canonical(link)), None)
                    ident = existing['id'] if existing else 'genshin-' + row['remoteId'] + ('-' + digest(canonical(link))[:6] if len(links) > 1 else '')
                    event_key = canonical(link)
                    stage = 'scan'
                    if event_key not in event_cache:
                        try:
                            event_cache[event_key] = await extract(link)
                        except Exception as error:
                            event_cache[event_key] = error
                    if isinstance(event_cache[event_key], Exception):
                        raise event_cache[event_key]
                    items, audit = copy.deepcopy(event_cache[event_key])
                    stage = 'metadata'
                    if existing:
                        previous_items = read(ROOT / f'projects/{ident}/spine/index.json', {})['items']
                        for item in items:
                            matches = [old for old in previous_items if normalized_name(old.get('name', old['id'])) == normalized_name(item['name'])]
                            if len(matches) == 1:
                                item['id'] = matches[0]['id']
                                item['name'] = matches[0].get('name', item['name'])
                    today = datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d')
                    body = BeautifulSoup(detail['content'], 'html.parser')
                    cover = detail.get('coverUrl') or row.get('coverUrl') or next((i.get('src') for i in body.select('img[src]')), None)
                    if not cover:
                        raise ValueError('文章未提供活动封面')
                    title = re.sub(r'^【网页活动上线】', '', row['title']).split('——')[0].strip()
                    paragraphs = body.get_text('\n', strip=True).splitlines()
                    period = next((p for p in paragraphs if re.search(r'20\d{2}年\d+月\d+日.*(?:至|-|—).*\d+月\d+日', p)), '')
                    eligibility = next((p for p in paragraphs if '冒险等阶' in p), '')
                    manifest = {**(existing or {}), 'schemaVersion': 1, 'id': ident, 'title': (existing or {}).get('title') or title,
                                'subtitle': (existing or {}).get('subtitle') or row['title'], 'game': '原神', 'kind': '网页活动',
                                'eventDate': row['startTime'][:10], 'indexedAt': (existing or {}).get('indexedAt') or today,
                                'sourceUrl': link.split('?')[0], 'cover': {'url': cover, 'alt': title, 'sourceUrl': detail.get('contentSource', detail_url), 'kind': 'official-news-cover'},
                                'spineIndex': 'spine/index.json', 'spineCount': len(items), 'textureCount': sum(len(i['textures']) for i in items),
                                'tags': ['原神', '网页活动'], 'sizeMeasuredOn': today,
                                'officialArticle': {'url': article, 'title': row['title'], 'publishedAt': row['startTime'], 'source': detail.get('contentSource', detail_url)},
                                'articleText': body.get_text('\n', strip=True), 'importAudit': audit}
                    manifest['activityPeriod'] = (existing or {}).get('activityPeriod') or period or '官方文章未标明'
                    manifest['eligibility'] = (existing or {}).get('eligibility') or eligibility or '以官方活动页面为准'
                    manifest['activitySummary'] = (existing or {}).get('activitySummary') or '\n'.join(paragraphs[:6])
                    if existing and existing['cover']['url'] == cover and 'sizeBytes' in existing['cover']:
                        manifest['cover']['sizeBytes'] = existing['cover']['sizeBytes']
                    else:
                        cover_resource = await api.get(cover, article)
                        if cover_resource and image_size(cover_resource.body):
                            manifest['cover']['sizeBytes'] = len(cover_resource.body)
                    if existing and existing.get('composition'):
                        old = read(ROOT / f'projects/{ident}/spine/index.json', {})['items']
                        if not {i['id'] for i in old} <= {i['id'] for i in items}:
                            raise ValueError('自动命名与已收录场景不一致，保留原项目等待校对')
                    directory = ROOT / 'projects' / ident
                    write(directory / 'spine/index.json', {'schemaVersion': 1, 'projectId': ident, 'items': items})
                    write(directory / 'manifest.json', manifest)
                    write(directory / 'cover.json', manifest['cover'])
                    template = (ROOT / 'projects/nicoles-tea-party/index.html').read_text(encoding='utf8')
                    template = template.replace('data-project="nicoles-tea-party"', f'data-project="{ident}"')
                    template = re.sub(r'<title>.*?</title>', '<title>' + html.escape(manifest['title']) + ' · Spine 素材工作台</title>', template)
                    (directory / 'index.html').write_text(template, encoding='utf8')
                    if ident not in manifests:
                        catalog['projects'].append({'id': ident, 'manifest': f'projects/{ident}/manifest.json'})
                    manifests[ident] = manifest
                    catalog['updatedAt'] = today
                    write(ROOT / 'catalog.json', catalog)
                    ids.append(ident)
                    changed = True
                result.update(status='complete', projectIds=ids)
                state['articles'][key] = {'fingerprint': fingerprint, 'contentHash': content_hash, 'status': 'complete', 'projectIds': ids, 'adapterVersion': ADAPTER_VERSION}
            except EmptyActivity as error:
                result.update(status='empty', message=str(error))
                state['articles'][key] = {'fingerprint': fingerprint, 'contentHash': content_hash, 'status': 'empty', 'message': str(error)}
                changed = True
            except SourceUnavailable as error:
                unavailable += 1
                failure = failure_record(error, 'network', row, result.get('links', []))
                result.update(status='unavailable', message=str(error), failure=failure)
                state['articles'][key] = {**previous, 'lastFailure': failure}
                if unavailable >= 3:
                    raise SourceUnavailable('新闻详情接口连续 3 次失败，保留原有索引并停止本次同步') from error
            except Exception as error:
                failure = failure_record(error, stage, row, result.get('links', []))
                result.update(status='needs-adapter', message=str(error), failure=failure)
                state['articles'][key] = {**previous, 'fingerprint': fingerprint, 'status': 'needs-adapter', 'message': str(error), 'lastFailure': failure}
            finally:
                report['done'] += 1
                print(f"[{report['done']}/{report['total']}] {row['title']}: {result['status']} {result.get('message', '')}", flush=True)
                write(state_path, state)
                progress()
        report.update(running=False, finishedAt=datetime.now(timezone.utc).isoformat())
        progress()
        if os.environ.get('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
                output.write(f'changed={str(changed).lower()}\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--retry-failed', action='store_true', help='使用已保存队列，只重试失败项，优先复用文章缓存')
    parser.add_argument('--category', choices=CATEGORIES, help='只处理指定问题类别，须配合 --retry-failed')
    parser.add_argument('--diagnose', action='store_true', help='离线汇总问题，不发起网络请求')
    parser.add_argument('--verbose', action='store_true', help='输出逐文件扫描日志')
    args = parser.parse_args()
    if args.category and not args.retry_failed:
        parser.error('--category 必须配合 --retry-failed')
    if args.limit < 0:
        parser.error('--limit 不能为负数')
    VERBOSE = args.verbose
    if args.diagnose:
        summary = summarize(failed_jobs(read(ROOT / 'sync-state.json', {}), read(ROOT / 'public/sync-status.json', {})))
        write(ROOT / 'sync-failures.json', summary)
        print(f"待处理 {summary['total']} 篇文章；详细证据见 sync-failures.json")
        for category, count in summary['categories'].items():
            print(f'  {LABELS.get(category, category)}: {count}')
        raise SystemExit(0)
    try:
        asyncio.run(run(args))
    except BaseException as error:
        path = ROOT / 'public/sync-status.json'
        report = read(path, {})
        report.update(running=False, error=str(error) or type(error).__name__)
        write(path, report)
        raise

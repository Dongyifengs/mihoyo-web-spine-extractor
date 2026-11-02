import sys
import unittest
from pathlib import Path
import importlib.util
import json
import tempfile
import os
from types import SimpleNamespace
from unittest.mock import patch, AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
spec = importlib.util.spec_from_file_location('sync_news', Path(__file__).resolve().parent.parent / 'scripts/sync-news.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
from importer.urls import http_url
from importer.discovery import Scanner
from importer.models import Resource
from importer.javascript import scan_javascript
from importer.jobs import failed_jobs, select_jobs, failure_record, summarize


class ImporterTests(unittest.TestCase):
    def test_square_pot_texture_preserves_normalized_uv_size(self):
        self.assertTrue(module.square_pot_variant((2000, 855), (2048, 2048)))
        self.assertFalse(module.square_pot_variant((2000, 855), (1024, 1024)))
        self.assertFalse(module.square_pot_variant((244, 556), (158, 361)))
        self.assertFalse(module.square_pot_variant((), (2048, 2048)))
    def test_equivalent_json_files_are_deduplicated(self):
        scanner = Scanner('https://act.mihoyo.com/ys/event/a/')
        value = {'skeleton': {'spine': '4.2.43'}, 'bones': [{'name': 'root'}], 'slots': []}
        scanner.add_json(value, 'https://act.mihoyo.com/a.js#js-10', 'hero.json')
        scanner.scan(Resource('https://act.mihoyo.com/hero.json', json.dumps(value, indent=2).encode(), 'application/json'))
        self.assertEqual(len(scanner.skeletons), 1)
        self.assertEqual(len(scanner.skeletons[0].sources), 2)

    def test_explicit_webpack_registration_keeps_skeleton_atlas_pairs(self):
        script = '(self.chunk=self.chunk||[]).push([[1],{1:function(e,t,r){t.spine={hero:{atlas:r(2),json:r(3)}}},2:function(e){e.exports="hero.png\\nsize:2,2\\na\\nbounds:0,0,2,2"},3:function(e){e.exports={skeleton:{spine:"4.1-from-4.2.33"},bones:[{name:"root"}],slots:[]}}}]);'
        scanner = Scanner('https://act.mihoyo.com/ys/event/a/')
        scanner.scan(Resource('https://act.mihoyo.com/a.js', script.encode(), 'text/javascript'))
        self.assertEqual(scanner.pairs[scanner.skeletons[0].source], {scanner.atlases[0].source})
    def test_webpack_image_registration_resolves_equal_size_embedded_images(self):
        script = '(self.webpackChunk=self.webpackChunk||[]).push([[1],{1:function(e,t,r){const images=[{src:r(2),id:"star_a",type:"image"},{src:r(3),id:"star_b",type:"image"}]},2:function(e){e.exports="data:image/png;base64,AAAA"},3:function(e){e.exports="data:image/png;base64,BBBB"}}]);'
        images = [(s, hint) for s, hint, _ in scan_javascript(script).strings if s.startswith('data:')]
        self.assertEqual(images, [('data:image/png;base64,AAAA', 'star_a.png'), ('data:image/png;base64,BBBB', 'star_b.png')])

    def test_article_only_follows_real_official_activity_anchors(self):
        markup = '<script>"https://act.mihoyo.com/ys/event/fake/"</script><a href="https://act.mihoyo.com/ys/event/real/?a=1&amp;b=2">参加</a><a href="https://evil.test/event/fake">假链接</a>'
        self.assertEqual(module.links_from_article(markup, 'https://ys.mihoyo.com/'), ['https://act.mihoyo.com/ys/event/real/?a=1&b=2'])

    def test_network_scope(self):
        for value in ['https://127.0.0.1/a', 'https://mihoyo.com.evil.test/a', 'file:///a', 'https://u:p@act.mihoyo.com/a', 'https://act.mihoyo.com:8080/a']:
            self.assertIsNone(http_url(value))
        self.assertEqual(http_url('http://act.mihoyo.com/a'), 'https://act.mihoyo.com/a')

    def test_tracking_urls_have_same_identity(self):
        self.assertEqual(module.canonical('https://act.mihoyo.com/ys/event/a/index.html?utm_source=x'), module.canonical('https://act.mihoyo.com/ys/event/a/'))

    def test_script_scanner_uses_data_not_executable_code(self):
        scanner = Scanner('https://act.mihoyo.com/ys/event/a/')
        script = 'throw new Error("must not execute");var x={"hero.json":{skeleton:{spine:"4.2.43"},bones:[{name:"root"}],slots:[]}};'
        scanner.scan(Resource('https://act.mihoyo.com/ys/event/a/main.js', script.encode(), 'text/javascript'))
        self.assertEqual(len(scanner.skeletons), 1)
        self.assertIn('#js-', scanner.skeletons[0].source)


class QueueTests(unittest.IsolatedAsyncioTestCase):
    async def test_normal_terminal_states_skip_scan_until_forced(self):
        for expected in ('no-link', 'empty'):
            row = {'key': 'genshin.web_cn-1', 'remoteId': '1', 'title': '普通结果', 'tags': ['网页活动']}
            detail = {**row, 'content': '<p>只有说明</p>' if expected == 'no-link' else '<a href="https://act.mihoyo.com/ys/event/a/">活动</a>'}
            class FakeFetcher:
                def __init__(self, *_): pass
                async def __aenter__(self): return self
                async def __aexit__(self, *_): pass
                async def get(self, url): return Resource(url, json.dumps({'code': 200, 'data': {'list': [row]} if url == module.API else detail}).encode())
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                module.write(root / 'catalog.json', {'projects': []})
                with patch.object(module, 'ROOT', root), patch.object(module, 'Fetcher', FakeFetcher), patch.object(module, 'extract', AsyncMock(side_effect=module.EmptyActivity('没有 Spine'))) as extract:
                    await module.run(SimpleNamespace(force=False, limit=0))
                    first_count = extract.await_count
                    with patch.dict(os.environ, {'GITHUB_OUTPUT': str(root / 'output')}):
                        await module.run(SimpleNamespace(force=False, limit=0))
                    self.assertEqual((root / 'output').read_text(), 'changed=false\n')
                    self.assertEqual(extract.await_count, first_count)
                    # A forced run must check links and scan again despite the saved status.
                    detail['content'] = '<a href="https://act.mihoyo.com/ys/event/a/">活动</a>'
                    await module.run(SimpleNamespace(force=True, limit=0))
                    self.assertEqual(extract.await_count, first_count + 1)
                self.assertEqual(module.read(root / 'sync-failures.json', {})['total'], 0)

    async def test_force_retry_fetches_fresh_body_instead_of_using_article_cache(self):
        row = {'key': 'genshin.web_cn-1', 'remoteId': '1', 'title': '重新获取', 'tags': ['网页活动']}
        class FakeFetcher:
            def __init__(self, *_): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *_): pass
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            module.write(root / 'catalog.json', {'projects': []})
            module.write(root / 'sync-state.json', {'version': module.VERSION, 'queue': [row], 'articles': {row['key']: {'status': 'needs-adapter', 'fingerprint': module.digest(row)}}})
            module.write(root / '.cache/articles' / (row['key'] + '.json'), {**row, 'content': '旧正文'})
            with patch.object(module, 'ROOT', root), patch.object(module, 'Fetcher', FakeFetcher), patch.object(module, 'fetch_article', AsyncMock(return_value={**row, 'content': '新正文'})) as fetch:
                await module.run(SimpleNamespace(force=True, limit=0, retry_failed=True, category=None))
                fetch.assert_awaited_once()
            self.assertEqual(module.read(root / '.cache/articles' / (row['key'] + '.json'), {})['content'], '新正文')

    async def test_list_outage_recovers_article_links_from_saved_progress(self):
        row = {'key': 'genshin.web_cn-117708', 'title': '线上音乐会'}
        class FakeFetcher:
            def __init__(self, *_): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *_): pass
            async def get(self, url): return None
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            module.write(root / 'catalog.json', {'projects': []})
            module.write(root / 'public/sync-status.json', {'total': 115, 'items': [row]})
            with patch.object(module, 'ROOT', root), patch.object(module, 'Fetcher', FakeFetcher), patch.object(module, 'fetch_article', AsyncMock(return_value={**row, 'content': '活动介绍'})):
                await module.run(SimpleNamespace(force=False, limit=0))
            report = module.read(root / 'public/sync-status.json', {})
            self.assertEqual(report['discoveredTotal'], 115)
            self.assertEqual(report['items'][0]['articleUrl'], 'https://ys.mihoyo.com/main/news/detail/117708')
            self.assertEqual(report['items'][0]['status'], 'no-link')
            self.assertIn('已保存的 1 篇文章', report['notice'])

    async def test_retry_only_selected_failure_reuses_queue_and_article_cache(self):
        good = {'key': 'genshin.web_cn-1', 'remoteId': '1', 'title': '完成', 'tags': ['网页活动']}
        bad = {**good, 'key': 'genshin.web_cn-2', 'remoteId': '2', 'title': '待修复'}
        failure = failure_record(ValueError('贴图地址尚未唯一确认'), 'scan', bad)
        class NoNetwork:
            def __init__(self, *_): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *_): pass
            async def get(self, url): raise AssertionError('队列和文章应复用缓存：' + url)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            module.write(root / 'catalog.json', {'projects': []})
            module.write(root / 'sync-state.json', {'version': module.VERSION, 'queue': [good, bad], 'articles': {
                good['key']: {'status': 'complete'}, bad['key']: {'status': 'needs-adapter', 'fingerprint': module.digest(bad), 'lastFailure': failure}}})
            module.write(root / '.cache/articles' / (bad['key'] + '.json'), {'key': bad['key'], 'content': '<a href="https://act.mihoyo.com/ys/event/a/">活动</a>'})
            with patch.object(module, 'ROOT', root), patch.object(module, 'Fetcher', NoNetwork), patch.object(module, 'extract', AsyncMock(side_effect=ValueError('测试拦截'))) as extract:
                await module.run(SimpleNamespace(force=False, limit=0, retry_failed=True, category='texture'))
                extract.assert_awaited_once()
            report = module.read(root / 'public/sync-status.json', {})
            self.assertEqual([r['key'] for r in report['items']], [bad['key']])

    async def test_failed_import_is_retryable_and_never_publishes_partial_project(self):
        row = {'key': 'genshin.web_cn-1', 'remoteId': '1', 'title': '测试活动', 'tags': ['网页活动'], 'startTime': '2026-01-01', 'coverUrl': 'https://act.mihoyo.com/cover.png'}
        detail = {**row, 'content': '<a href="https://act.mihoyo.com/ys/event/a/index.html">参加</a>'}
        class FakeFetcher:
            def __init__(self, *_): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *_): pass
            async def get(self, url):
                data = {'list': [row]} if url == module.API else detail
                return Resource(url, json.dumps({'code': 200, 'data': data}).encode())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            module.write(root / 'catalog.json', {'projects': []})
            with patch.object(module, 'ROOT', root), patch.object(module, 'Fetcher', FakeFetcher), patch.object(module, 'extract', AsyncMock(side_effect=ValueError('贴图待适配'))):
                await module.run(SimpleNamespace(force=False, limit=0))
                self.assertEqual(module.read(root / 'catalog.json', {})['projects'], [])
                state = module.read(root / 'sync-state.json', {})
                self.assertEqual(state['articles'][row['key']]['status'], 'needs-adapter')
                await module.run(SimpleNamespace(force=False, limit=0))
                self.assertEqual(module.extract.await_count, 2)

    async def test_unchanged_completed_news_does_not_parse_again(self):
        row = {'key': 'genshin.web_cn-1', 'title': '已收录', 'tags': ['网页活动']}
        detail = {'key': row['key'], 'content': '<p>同一篇文章</p>'}
        class FakeFetcher:
            def __init__(self, *_): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *_): pass
            async def get(self, url): return Resource(url, json.dumps({'code': 200, 'data': {'list': [row]} if url == module.API else detail}).encode())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            module.write(root / 'catalog.json', {'projects': []})
            module.write(root / 'sync-state.json', {'version': module.VERSION, 'articles': {row['key']: {'fingerprint': module.digest(row), 'contentHash': module.digest(module.content_fingerprint_data({**row, **detail})), 'status': 'complete', 'projectIds': ['a']}}})
            with patch.object(module, 'ROOT', root), patch.object(module, 'Fetcher', FakeFetcher), patch.object(module, 'extract', AsyncMock()) as extract, patch.dict(os.environ, {'GITHUB_OUTPUT': str(root / 'output')}):
                await module.run(SimpleNamespace(force=False, limit=0))
                extract.assert_not_awaited()
                self.assertEqual((root / 'output').read_text(), 'changed=false\n')
                self.assertEqual(module.read(root / 'public/sync-status.json', {})['items'][0]['status'], 'unchanged')

    async def test_article_body_change_schedules_parse_even_when_list_is_unchanged(self):
        row = {'key': 'genshin.web_cn-1', 'remoteId': '1', 'title': '已更新', 'tags': ['网页活动']}
        detail = {'key': row['key'], 'content': '<a href="https://act.mihoyo.com/ys/event/new/">参加</a>'}
        class FakeFetcher:
            def __init__(self, *_): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *_): pass
            async def get(self, url): return Resource(url, json.dumps({'code': 200, 'data': {'list': [row]} if url == module.API else detail}).encode())
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            module.write(root / 'catalog.json', {'projects': []})
            module.write(root / 'sync-state.json', {'version': module.VERSION, 'articles': {row['key']: {'fingerprint': module.digest(row), 'contentHash': 'old', 'status': 'complete', 'projectIds': ['a']}}})
            with patch.object(module, 'ROOT', root), patch.object(module, 'Fetcher', FakeFetcher), patch.object(module, 'extract', AsyncMock(side_effect=ValueError('测试拦截'))) as extract:
                await module.run(SimpleNamespace(force=False, limit=0))
                extract.assert_awaited_once_with('https://act.mihoyo.com/ys/event/new/')

    async def test_api_outage_stops_after_three_failures_and_preserves_state(self):
        rows = [{'key': f'genshin.web_cn-{i}', 'title': str(i), 'tags': ['网页活动']} for i in range(5)]
        class FakeFetcher:
            calls = []
            failures = {}
            def __init__(self, *_): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *_): pass
            async def get(self, url, referer=''):
                self.calls.append(url)
                return Resource(url, json.dumps({'code': 200, 'data': {'list': rows}}).encode()) if url == module.API else None
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            module.write(root / 'catalog.json', {'projects': []})
            original = {'version': module.VERSION, 'articles': {row['key']: {'fingerprint': module.digest(row), 'status': 'complete', 'projectIds': ['a']} for row in rows}}
            module.write(root / 'sync-state.json', original)
            with patch.object(module, 'ROOT', root), patch.object(module, 'Fetcher', FakeFetcher):
                with self.assertRaises(module.SourceUnavailable): await module.run(SimpleNamespace(force=False, limit=0))
            saved = module.read(root / 'sync-state.json', {})
            for key, previous in original['articles'].items():
                self.assertEqual({name: saved['articles'][key][name] for name in previous}, previous)
            self.assertEqual(len(FakeFetcher.calls), 10)


if __name__ == '__main__':
    unittest.main()

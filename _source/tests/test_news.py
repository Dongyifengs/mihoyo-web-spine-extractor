import json
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
from importer.models import Resource
from importer.news import fetch_article, article_url, activity_links, valid_body, SourceUnavailable
from importer.jobs import failed_jobs

ROW = {'key': 'genshin.web_cn-117708', 'title': '线上音乐会', 'remoteId': '117708'}
ARTICLE = article_url(ROW)
EVENT = 'https://webstatic.mihoyo.com/ys/event/e20220916music/index.html'


def response(data):
    return Resource(ARTICLE, json.dumps(data).encode())


class NewsTests(unittest.IsolatedAsyncioTestCase):
    async def test_failed_news_uses_official_article_and_prefers_event_anchor(self):
        markup = f'<div class="article__content"><a href="https://hoyo.link/test">短链接</a><a href="https://act.mihoyo.com/ys/event/a/">活动一</a><a href="{EVENT}">活动二</a></div>'
        fetcher = AsyncMock()
        fetcher.get.side_effect = [response({'code': 200, 'data': {**ROW, 'content': '<p>新闻加载失败</p>'}}), Resource(ARTICLE, markup.encode())]
        result = await fetch_article(fetcher, ROW)
        self.assertEqual(result['sourceType'], 'official-page')
        self.assertEqual(result['articleUrl'], ARTICLE)
        self.assertEqual(activity_links(result['content'], ARTICLE), ['https://act.mihoyo.com/ys/event/a/', EVENT])
        self.assertEqual(fetcher.get.call_args.args, (ARTICLE,))

    async def test_empty_official_shell_uses_official_public_content_endpoint(self):
        fetcher = AsyncMock()
        fetcher.get.side_effect = [None, Resource(ARTICLE, b'<div class="article__content"></div>'), response({'retcode': 0, 'data': {'iInfoId': 117708, 'sTitle': '官网标题', 'dtStartTime': '2022-09-25 12:00:00', 'sContent': f'<a href="{EVENT}">参加</a>'}})]
        result = await fetch_article(fetcher, ROW)
        self.assertEqual(result['title'], '官网标题')
        self.assertEqual(result['startTime'], '2022-09-25T12:00:00+08:00')
        self.assertEqual(activity_links(result['content'], ARTICLE), [EVENT])
        self.assertIn('iInfoId=117708', fetcher.get.call_args.args[0])
        self.assertEqual(fetcher.get.call_args.args[1], ARTICLE)

    async def test_wrong_article_and_malformed_payload_fail_with_original_link(self):
        for data in ([], {'iInfoId': 123, 'sContent': '<p>其他文章</p>'}):
            fetcher = AsyncMock()
            fetcher.get.side_effect = [response({'code': 200, 'data': []}), None, response({'retcode': 0, 'data': data})]
            with self.assertRaisesRegex(SourceUnavailable, '117708'):
                await fetch_article(fetcher, ROW)

    def test_blank_or_error_body_is_not_a_valid_article(self):
        for content in ('', '<div></div>', '<script>foo()</script>', '新闻加载失败，请稍后重试', '<p>新闻加载失败</p><button>重试</button>', None):
            self.assertFalse(valid_body(content))
        self.assertTrue(valid_body('<img src="https://act.mihoyo.com/a.png">'))
        self.assertTrue(valid_body('<p>新闻正文</p>'))

    def test_no_link_and_empty_are_excluded_from_failures_including_legacy_reports(self):
        items = [
            {**ROW, 'key': 'genshin.web_cn-1', 'status': 'no-link'},
            {**ROW, 'key': 'genshin.web_cn-2', 'status': 'empty'},
            {**ROW, 'key': 'genshin.web_cn-3', 'status': 'unchanged'},
            {**ROW, 'key': 'genshin.web_cn-4', 'status': 'needs-adapter', 'message': '文章内没有官方活动超链接'},
            {**ROW, 'key': 'genshin.web_cn-5', 'status': 'needs-adapter', 'message': '尚未识别到可验证的 Spine'},
            {**ROW, 'key': 'genshin.web_cn-6', 'status': 'needs-adapter', 'message': '贴图匹配待适配'},
        ]
        state = {'articles': {row['key']: row for row in items}}
        self.assertEqual(list(failed_jobs(state, {'items': items})), ['genshin.web_cn-6'])


if __name__ == '__main__':
    unittest.main()

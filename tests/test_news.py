import json
import os

import pytest

from spine_extractor.models import Options
from spine_extractor.network import Fetcher
from spine_extractor.news import TAGS, list_events, news_input, resolve_event
from spine_extractor.resolve import resolve


@pytest.mark.parametrize('game', ['genshin', 'starrail', 'zzz'])
async def test_exact_game_tag_filter_and_detail_recheck(server, monkeypatch, game):
    base, routes, requests = server
    monkeypatch.setattr('spine_extractor.news.API_BASE', base)
    source, tag = game + '.web_cn', TAGS[game]
    rows = [
        {'key': source+'-1', 'title': '标题中有网页活动但标签不匹配', 'tags': ['未分类']},
        {'key': source+'-2', 'title': '精确标签', 'tags': [tag], 'startTime': '2026-10-30T00:00:00Z'},
        {'key': source+'-3', 'title': '多个标签', 'tags': ['活动', tag], 'startTime': '2026-10-31T00:00:00Z'},
        {'key': source+'-4', 'title': '标签相似', 'tags': [tag+'预告']},
        {'key': source+'-5', 'title': '字符串不算标签数组', 'tags': tag},
        {'key': source+'-6', 'title': '没有标签'},
        {'key': source+'-7', 'title': '另一个游戏的标签', 'tags': ['网页活动' if game == 'starrail' else '版本专题展示页']},
    ]
    routes['/news/'+source] = ('application/json', json.dumps({'code': 200, 'data': {'list': rows + [rows[1]]}}))
    url = 'https://act.mihoyo.com/puzzle/hkrpg/e20261024version_123/index.html?a=1'
    async def official(fetcher, article, selected_game):
        assert selected_game == game
        return [url]
    monkeypatch.setattr('spine_extractor.news.official_links', official)
    for key in [source+'-2', source+'-3']:
        routes['/news/detail/'+key] = ('application/json', json.dumps({'code': 200, 'data': {
            'key': key, 'title': key, 'tags': [tag], 'content': '<a href="'+url+'">点击前往</a>'}}))
    routes['/news/detail/'+source+'-1'] = ('application/json', json.dumps({'code':200,'data':{
        'key':source+'-1', 'tags':['未分类'], 'content':'<a href="'+url+'">点击参与</a>'}}))
    async with Fetcher(Options(feed_limit=2, retries=0), lambda _: None) as fetcher:
        listing = await list_events(fetcher, source)
        assert listing['tag'] == tag and listing['total'] == 2
        assert [x['key'] for x in listing['items']] == [source+'-3', source+'-2']
        assert all(x['tags'] == [tag] for x in listing['items'])
        targets = await resolve(fetcher, 'https://news-api.amarea.cn/news/'+source)
        assert len(targets) == 1 and targets[0].url == url
        assert '/news/detail/'+source+'-1' not in requests
        with pytest.raises(ValueError, match='标签'):
            await resolve_event(fetcher, source+'-1')
    assert news_input('https://news.hk4e.com') == ('list', 'genshin.web_cn')
    assert news_input('https://news-api.amarea.cn/news/feed/'+source+'?whitelist=x') == ('list', source)
    assert news_input('https://example.test') is None


async def test_news_api_invalid_payload_and_source(server, monkeypatch):
    base, routes, requests = server
    monkeypatch.setattr('spine_extractor.news.API_BASE', base)
    routes['/news/genshin.web_cn'] = ('application/json', json.dumps({'code': 503, 'message': '维护中'}))
    async with Fetcher(Options(retries=0), lambda _: None) as fetcher:
        with pytest.raises(ValueError, match='维护中'):
            await list_events(fetcher)
        with pytest.raises(ValueError, match='不支持'):
            await list_events(fetcher, '../anything')
    assert len(requests) == 1


@pytest.mark.skipif(not os.environ.get('SPINE_BROWSER_TEST'), reason='Set SPINE_BROWSER_TEST=1')
async def test_news_ui_switches_tag_and_queues_only_selected_entries(web, monkeypatch):
    from playwright.async_api import async_playwright

    from spine_extractor.browser import launch_browser

    async def listing(fetcher, source):
        tag = TAGS[source.split('.')[0]]
        return {'tag': tag, 'total': 2, 'items': [
            {'key': source+'-'+str(i), 'title': '测试活动 '+str(i), 'tags':[tag], 'published_at':'2026-10-31T00:00:00Z',
             'article_url':'https://example.test/article/'+str(i), 'input_url':'https://news-api.amarea.cn/news/detail/'+source+'-'+str(i)} for i in range(2)]}

    async def official(fetcher, key):
        from spine_extractor.resolve import Target
        return [Target('https://act.mihoyo.com/puzzle/test/'+key+'/index.html')]
    monkeypatch.setattr('spine_extractor.server.resolve_event', official)
    monkeypatch.setattr('spine_extractor.server.list_events', listing)
    client, state = web
    assert client.get('/api/news?source=../escape').status_code == 400
    async with async_playwright() as pw:
        browser = await launch_browser(pw, Options(), headed=False)
        try:
            page = await browser.new_page()
            await page.goto(f'{client.base_url}#news')
            await page.locator('.news-row').first.wait_for()
            assert await page.locator('.news-row .badge').all_text_contents() == ['网页活动'] * 2
            await page.get_by_label('新闻来源').select_option('starrail.web_cn')
            await page.wait_for_function('document.querySelector(".news-row .badge")?.textContent === "版本专题展示页"')
            assert await page.get_by_label('新闻来源').locator('option').count() == 3
            rows = page.locator('.news-row')
            a, b = await rows.first.bounding_box(), await rows.last.bounding_box()
            await page.mouse.move(a['x']+2,a['y']+2)
            await page.mouse.down()
            await page.mouse.move(b['x']+b['width']-2,b['y']+b['height']-2,steps=8)
            await page.mouse.up()
            assert await page.locator('.news-row input:checked').count() == 2
            await page.get_by_role('button',name='清空选择').click()
            await page.get_by_label('搜索活动标题').fill('活动 1')
            assert await page.locator('.news-row').count() == 1
            await page.locator('.news-row input[type=checkbox]').check()
            await page.get_by_role('button', name='加入提取（1）', exact=True).click()
            await page.wait_for_function("document.querySelector('#urls').value.includes('https://act.mihoyo.com/puzzle/test/starrail.web_cn-1/index.html')")
            assert await page.locator('#urls').input_value() == 'https://act.mihoyo.com/puzzle/test/starrail.web_cn-1/index.html'
            assert not any(j['status'] == 'running' for j in state.jobs.values())
            await page.get_by_role('link', name='◷ 网页活动').click()
            await page.locator('.news-row').first.wait_for()
            await page.set_viewport_size({'width':390, 'height':844})
            assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        finally:
            await browser.close()


@pytest.mark.parametrize('game,body', [('genshin','<div class="article__content">{}</div>'),
    ('starrail','<div class="detail-content"><div class="main-wrap">{}</div></div>'),
    ('zzz','<div class="news-detail__content">{}</div>')])
def test_official_article_body_excludes_navigation(game, body):
    from spine_extractor.news import article_body_links, validate_source
    url = 'https://act.mihoyo.com/ys/event/test/index.html?a=1&amp;b=2'
    html = '<nav><a href="https://act.mihoyo.com/ys/event/wrong/index.html">点击参与</a></nav>'
    html += body.format('<a href="'+url+'">网页链接</a>')
    assert article_body_links(html,'https://ys.mihoyo.com/',game) == [url.replace('&amp;','&')]
    with pytest.raises(ValueError):
        validate_source(game+'.bbs_cn_all')

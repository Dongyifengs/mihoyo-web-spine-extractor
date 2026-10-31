import base64
import json
import os
from copy import deepcopy

import pytest

from spine_extractor.cover import Cover
from spine_extractor.scene import save_scene
from test_cover import wait_job


def scene_fixture(web, skeleton, atlas, png):
    client, state = web
    folder = state.options().output / '合并测试'
    dest = folder / 'spine' / 'hero'
    dest.mkdir(parents=True)
    skeleton = deepcopy(skeleton)
    skeleton['skeleton'].update(hash='fixture-hash', x=-50, y=-50, width=100, height=100)
    skeleton['skins'][0]['attachments']['body']['body'].update(width=40, height=40)
    skeleton['animations'] = {'in': {}, 'preLOOP_end': {}}
    (dest / 'skeleton.json').write_text(json.dumps(skeleton), 'utf-8')
    (dest / 'skeleton.atlas').write_text(atlas, 'utf-8')
    (dest / 'hero.png').write_bytes(png)
    groups = [{'name': 'hero', 'directory': 'spine/hero', 'version': '4.2.43', 'status': 'complete', 'textures': [{'name': 'hero.png'}]}]
    (folder / 'manifest.json').write_text(json.dumps({'title': '合并测试', 'page_url': 'https://example.test/event', 'groups': groups}), 'utf-8')
    image = 'data:image/png;base64,' + base64.b64encode(png).decode()
    data = {'width': 400, 'height': 200, 'default_scene': 0, 'warnings': [], 'scenes': [{'name': 'scene_main', 'reference': image, 'layers': [
        {'kind': 'spine', 'name': 'hero-instance', 'hash': 'fixture-hash', 'image': image,
         'matrix': [.01,0,0,0, 0,.01,0,0, 0,0,1,0, .25,0,0,1], 'skeleton': {}, 'opacity': 1},
    ]}]}
    key = client.get('/api/activities').json()[0]['id']
    return folder, groups, data, key


def test_composition_capture_api_and_failure_preserve_existing(web, skeleton, atlas, png, monkeypatch):
    client, _ = web
    folder, groups, data, key = scene_fixture(web, skeleton, atlas, png)
    assert client.get(f'/api/activities/{key}/composition').json()['scenes'] == []

    async def capture(*args):
        return Cover(png, {'file': 'cover.jpg'}), deepcopy(data)

    monkeypatch.setattr('spine_extractor.server.capture_scene', capture)
    job = wait_job(client, client.post(f'/api/activities/{key}/composition', json={}))
    assert job['status'] == 'completed' and job['result']['scenes'] == 1
    saved = client.get(f'/api/activities/{key}/composition').json()
    layer = saved['scenes'][0]['layers'][0]
    assert layer['group'] == 0
    assert client.get(layer['image_url']).content == png
    before = (folder / 'composition.json').read_bytes()

    async def failure(*args):
        return Cover(b'invalid', {}), {'scenes': [], 'warnings': ['未识别渲染引擎']}

    monkeypatch.setattr('spine_extractor.server.capture_scene', failure)
    job = wait_job(client, client.post(f'/api/activities/{key}/composition', json={}))
    assert job['status'] == 'failed' and '未识别' in job['error']
    assert (folder / 'composition.json').read_bytes() == before
    assert (folder / 'cover.jpg').read_bytes() == png
    assert client.post(f'/api/activities/{key}/composition', json={}, headers={'Origin':'https://evil.test'}).status_code == 403
    assert client.get(f'/files/{key}/composition/%2e%2e/%2e%2e/%2e%2e/settings.json').status_code == 400
    data['scenes'][0]['layers'][0]['hash'] = 'missing'
    fallback = save_scene(folder, data, groups)
    assert fallback['scenes'][0]['layers'][0]['kind'] == 'image' and fallback['warnings']


@pytest.mark.skipif(not os.environ.get('SPINE_BROWSER_TEST'), reason='Set SPINE_BROWSER_TEST=1')
async def test_composition_local_render_position_controls_and_disposal(web, skeleton, atlas, png):
    from playwright.async_api import async_playwright

    from spine_extractor.browser import launch_browser
    from spine_extractor.models import Options
    from spine_extractor.server import STATIC

    client, _ = web
    folder, groups, data, key = scene_fixture(web, skeleton, atlas, png)
    save_scene(folder, data, groups)
    async with async_playwright() as pw:
        browser = await launch_browser(pw, Options(), headed=False)
        try:
            page = await browser.new_page(viewport={'width': 1450, 'height': 950})
            await page.route('https://unpkg.com/**', lambda route: route.abort())
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            script = (STATIC / 'composition.js').read_text('utf-8').replace('Object.assign(this, {container, activity, data});',
                'window.__composition=this; Object.assign(this, {container, activity, data});')
            await page.route('**/static/composition.js', lambda route: route.fulfill(body=script, content_type='text/javascript'))
            await page.goto(f'{client.base_url}#composition/{key}')
            await page.wait_for_function('window.__composition?.rows[0]?.surface?.ready')
            # A loading fallback fills the stage; wait for the projected animation frame,
            # not merely its data-ready callback or an opaque fallback pixel.
            await page.wait_for_function('''__composition.context.getImageData(250,100,1,1).data[3] > 200 &&
                __composition.context.getImageData(190,100,1,1).data[3] === 0''')
            # A skeleton at clip-space x=.25 belongs at x=250, not the center x=200.
            assert await page.evaluate('__composition.context.getImageData(190,100,1,1).data[3]') == 0
            assert await page.get_by_label('hero-instance 合并动作').input_value() == 'preLOOP_end'
            await page.get_by_role('button', name='暂停', exact=True).click()
            assert not await page.evaluate('__composition.rows[0].state.playing')
            await page.locator('.composition-layer input[type=checkbox]').uncheck()
            await page.wait_for_function('__composition.context.getImageData(250,100,1,1).data[3] === 0')
            await page.get_by_role('button', name='对照原网页画面').click()
            await page.wait_for_function('__composition.reference && __composition.referenceImage')
            await page.set_viewport_size({'width': 390, 'height': 844})
            assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            await page.get_by_role('link', name='返回素材', exact=True).click()
            await page.wait_for_function('__composition.destroyed && __composition.hub.disposed')
            assert not errors
        finally:
            await browser.close()

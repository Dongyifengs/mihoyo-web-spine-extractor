import asyncio
import io
import json
import os
import time

import pytest
from PIL import Image

from spine_extractor.cover import Cover
from spine_extractor.models import Cancelled, Options


def wait_job(client, response):
    assert response.status_code == 202, response.text
    key = response.json()['id']
    for _ in range(100):
        job = client.get('/api/jobs/' + key).json()
        if job['status'] != 'running':
            return job
        time.sleep(0.03)
    pytest.fail('Cover job did not finish')


def test_cover_jobs_persist_and_keep_previous_image_on_failure(web, tmp_path, monkeypatch):
    client, state = web
    folder = state.options().output / '封面活动'
    folder.mkdir(parents=True)
    manifest = {'title': '封面活动', 'groups': [], 'page_url': 'https://example.test/event/'}
    (folder / 'manifest.json').write_text(json.dumps(manifest), 'utf-8')
    content = io.BytesIO()
    Image.new('RGB', (1280, 720), '#315d77').save(content, 'JPEG')
    image = content.getvalue()
    calls = []

    async def capture(url, options, log):
        calls.append(url)
        return Cover(image, {'file': 'cover.jpg', 'wait_seconds': 20, 'hidden_layers': 3})

    monkeypatch.setattr('spine_extractor.server.capture_cover', capture)
    response = client.post('/api/covers', json={})
    job = wait_job(client, response)
    assert job['result']['captured'] == 1
    assert calls == [manifest['page_url']]
    entry = client.get('/api/activities').json()[0]
    assert client.get(entry['cover_url']).content == image
    stored = json.loads((folder / 'manifest.json').read_text('utf-8'))
    assert stored['cover']['wait_seconds'] == 20 and stored['groups'] == []
    assert client.post('/api/covers', json={}).status_code == 400
    assert client.post('/api/covers', json={}, headers={'X-Spine-Token': 'invalid'}).status_code == 403

    async def failure(*args):
        raise RuntimeError('活动已下线')

    monkeypatch.setattr('spine_extractor.server.capture_cover', failure)
    job = wait_job(client, client.post(f"/api/activities/{entry['id']}/cover", json={}))
    assert job['result']['failed'] == 1
    assert (folder / 'cover.jpg').read_bytes() == image
    stored = json.loads((folder / 'manifest.json').read_text('utf-8'))
    assert stored['cover'] == {'file': 'cover.jpg', 'wait_seconds': 20, 'hidden_layers': 3}
    assert stored['cover_error'] == '活动已下线'


@pytest.mark.skipif(not os.environ.get('SPINE_BROWSER_TEST'), reason='Set SPINE_BROWSER_TEST=1')
async def test_cover_wait_cleanup_restore_and_cancel(server, monkeypatch):
    from playwright.async_api import async_playwright

    from spine_extractor.browser import launch_browser
    from spine_extractor.cover import page_cover

    base, routes, _ = server
    routes['/cover.html'] = ('text/html', '''<!doctype html><style>
        body {margin:0} .login-root {position:absolute;inset:0}
        canvas {position:absolute;inset:0;width:100vw;height:100vh}
        button {position:absolute;left:0;top:0;background:red;width:180px;height:100px}
        #art {position:absolute;left:300px;top:0;width:50px;height:50px;background:blue}
        </style><div class="login-root"><canvas id="scene" width="1280" height="720"></canvas>
        <div id="art" title="activity artwork"></div><button id="enter">进入活动</button></div>
        <script>
        const c = document.querySelector('canvas').getContext('2d');
        const plate = {isObject3D:true, visible:true, name:'main_btn', children:[]};
        const art = {isObject3D:true, visible:true, name:'main_character', children:[]};
        window.coverScene = {isObject3D:true, isScene:true, visible:true, name:'scene_start', children:[plate,art]};
        document.querySelector('.login-root').__vue__ = {player:{scenes:{main:coverScene}}};
        function draw() {
            c.fillStyle='#00ff00'; c.fillRect(0,0,1280,720);
            if(plate.visible) {c.fillStyle='red';c.fillRect(500,0,100,100);}
            if(art.visible) {c.fillStyle='blue';c.fillRect(700,0,100,100);}
            requestAnimationFrame(draw);
        }
        draw();
        window.addEventListener('load',()=>setTimeout(()=>{
            let button=document.createElement('button');button.textContent='分享';
            button.id='late-share';button.style.left='200px';document.body.append(button);
        },100));</script>''')
    monkeypatch.setattr('spine_extractor.cover.COVER_WAIT_SECONDS', 0.35)
    async with async_playwright() as pw:
        options = Options()
        browser = await launch_browser(pw, options, headed=False)
        try:
            page = await browser.new_page(viewport={'width': 1280, 'height': 720})
            await page.goto(base + '/cover.html', wait_until='load')
            started = time.monotonic()
            cover = await page_cover(page, options, lambda _: None)
            assert time.monotonic() - started >= 0.35
            assert cover.metadata['hidden_layers'] >= 2
            image = Image.open(io.BytesIO(cover.image)).convert('RGB')
            assert image.size == (1280, 720)
            for point in [(10, 10), (210, 10), (510, 10)]:
                r, g, b = image.getpixel(point)
                assert g > 220 and r < 30 and b < 30, 'UI overlays should be hidden; the scene must remain'
            r, g, b = image.getpixel((320, 10))
            assert b > 220 and r < 30 and g < 30, 'Keep non-interactive artwork'
            r, g, b = image.getpixel((710, 10))
            assert b > 220 and r < 30 and g < 30, 'Keep character objects in the scene'
            assert await page.locator('#enter').is_visible()
            assert await page.locator('#late-share').is_visible()
            assert await page.locator('.login-root').is_visible()
            assert await page.evaluate('coverScene.visible && coverScene.children.every(object => object.visible)')
            monkeypatch.setattr('spine_extractor.cover.COVER_WAIT_SECONDS', 20)
            task = asyncio.create_task(page_cover(page, options, lambda _: None))
            await asyncio.sleep(0.05)
            options.cancel.set()
            with pytest.raises(Cancelled):
                await asyncio.wait_for(task, timeout=2)
        finally:
            await browser.close()


@pytest.mark.skipif(not os.environ.get('SPINE_BROWSER_TEST'), reason='Set SPINE_BROWSER_TEST=1')
async def test_library_shows_cover_and_retake_action(web):
    from playwright.async_api import async_playwright

    from spine_extractor.browser import launch_browser

    client, state = web
    folder = state.options().output / '卡片测试'
    folder.mkdir(parents=True)
    (folder / 'manifest.json').write_text(json.dumps({'title': '卡片测试', 'groups': []}), 'utf-8')
    Image.new('RGB', (1280, 720), '#315d77').save(folder / 'cover.jpg')
    async with async_playwright() as pw:
        browser = await launch_browser(pw, Options(), headed=False)
        try:
            page = await browser.new_page()
            await page.goto(f'{client.base_url}#library')
            cover = page.get_by_alt_text('卡片测试 网页封面')
            await cover.wait_for()
            await page.wait_for_function('document.querySelector(".activity-cover img")?.naturalWidth === 1280')
            assert await page.get_by_role('button', name='卡片测试 重拍封面').is_visible()
            assert not await page.get_by_role('button', name='补全封面').is_enabled()
            assert await page.locator('a a, a button').count() == 0
        finally:
            await browser.close()


@pytest.mark.skipif(not os.environ.get('SPINE_BROWSER_TEST'), reason='Set SPINE_BROWSER_TEST=1')
async def test_stale_backend_explains_version_instead_of_missing_cover(web):
    from playwright.async_api import async_playwright

    from spine_extractor.browser import launch_browser

    client, _ = web
    bootstrap = client.get('/api/bootstrap').json()
    bootstrap['version'] = '0.3.0'
    async with async_playwright() as pw:
        browser = await launch_browser(pw, Options(), headed=False)
        try:
            page = await browser.new_page()
            posts = []
            page.on('request', lambda request: posts.append(request.url) if request.method == 'POST' else None)
            await page.route('**/api/bootstrap', lambda route: route.fulfill(json=bootstrap))
            await page.route('**/api/instance', lambda route: route.abort())
            await page.goto(str(client.base_url))
            banner = page.locator('.backend-warning')
            await banner.wait_for()
            assert 'v0.3.0' in await banner.inner_text()
            assert '重新运行' in await banner.inner_text()
            assert '封面文件无需重新生成' in await banner.inner_text()
            message = await page.evaluate("async () => { const {api}=await import('/static/api.js'); try {await api('/api/covers',{});} catch(e) {return e.message;} }")
            assert 'v0.3.0' in message and not posts
        finally:
            await browser.close()

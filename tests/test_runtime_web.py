import os

import pytest


pytestmark = pytest.mark.skipif(not os.environ.get('SPINE_BROWSER_TEST'), reason='Set SPINE_BROWSER_TEST=1')

# A loader contract fixture; full rendering with real vendored runtimes is covered in test_web.py.
RUNTIME = '''var spine = Object.fromEntries([
  'Skeleton', 'SkeletonJson', 'SkeletonBinary', 'AnimationState', 'AnimationStateData',
  'AtlasAttachmentLoader', 'Vector2', 'ManagedWebGLRenderingContext', 'SceneRenderer', 'AssetManager'
].map(key => [key, function(){}])); spine.source = 'fixture';'''


@pytest.mark.parametrize('failure', ['404', 'html', 'empty', 'invalid-js', 'missing-runtime'])
async def test_runtime_exact_version_falls_back_to_latest_minor(web, failure):
    from playwright.async_api import async_playwright
    from spine_extractor.browser import launch_browser
    from spine_extractor.models import Options

    client, _ = web
    async with async_playwright() as pw:
        browser = await launch_browser(pw, Options())
        try:
            page = await browser.new_page()
            requested = []

            async def cdn(route):
                url = route.request.url
                requested.append(url)
                if '@4.2.x/' in url:
                    await route.fulfill(body=RUNTIME, content_type='text/javascript')
                else:
                    bodies = {'404': 'Not found', 'html': '<html>Unavailable</html>', 'empty': '',
                              'invalid-js': 'var spine = )', 'missing-runtime': 'var spine = {};'}
                    await route.fulfill(status=404 if failure == '404' else 200, body=bodies[failure],
                                        content_type='text/html' if failure == 'html' else 'text/javascript')

            await page.route('https://unpkg.com/**', cdn)
            await page.goto(str(client.base_url))
            assert await page.evaluate('''async () => {
                const {loadRuntime} = await import('/static/renderer.js');
                const [a, b] = await Promise.all([loadRuntime('4.2.999'), loadRuntime('4.2.999')]);
                return a === b && a.source === 'fixture';
            }''')
            assert requested == [f'https://unpkg.com/@esotericsoftware/spine-player@{v}/dist/iife/spine-player.js'
                                 for v in ['4.2.999', '4.2.x']]
            # Runtime namespaces are isolated, and loading the same minor reuses one instance.
            assert await page.evaluate('typeof window.spine') == 'undefined'
            await page.evaluate("import('/static/renderer.js').then(m => m.loadRuntime('4.2.43'))")
            assert len(requested) == 2
        finally:
            await browser.close()


async def test_exact_runtime_success_and_frame_measurements(web):
    from playwright.async_api import async_playwright
    from spine_extractor.browser import launch_browser
    from spine_extractor.models import Options

    client, _ = web
    async with async_playwright() as pw:
        browser = await launch_browser(pw, Options())
        try:
            page = await browser.new_page()
            requested = []

            async def cdn(route):
                requested.append(route.request.url)
                await route.fulfill(body=RUNTIME, content_type='text/javascript')

            await page.route('https://unpkg.com/**', cdn)
            await page.goto(str(client.base_url))
            await page.evaluate("import('/static/renderer.js').then(m => m.loadRuntime('4.1.56'))")
            assert requested == ['https://unpkg.com/@esotericsoftware/spine-player@4.1.56/dist/iife/spine-player.js']
            stats = await page.evaluate('''async () => {
                const {FrameStats} = await import('/static/performance.js');
                const stats = new FrameStats();
                [0, 16, 32, 80].forEach(time => stats.record(time, 5, 22));
                return stats.read();
            }''')
            assert stats['fps'] == pytest.approx(37.5)
            assert stats['p95'] == 48
            assert 15 < stats['jitter'] < 16
            assert stats['renderMs'] == 5 and stats['count'] == 22
        finally:
            await browser.close()

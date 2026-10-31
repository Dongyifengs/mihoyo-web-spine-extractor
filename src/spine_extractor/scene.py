"""Capture original scene transforms and static passes for an offline composition."""

import base64
import json
import secrets
from datetime import datetime, timezone
from pathlib import Path

from .models import Options
from .urls import http_url, normalized_name

CAPTURE = Path(__file__).with_name('static').joinpath('scene-capture.js').read_text('utf-8')


async def page_scene(page, options: Options, log) -> dict:
    options.check()
    log('读取原网页场景的位置、缩放和图层顺序')
    data = await page.evaluate(CAPTURE)
    options.check()
    data.update(source_url=page.url, captured_at=datetime.now(timezone.utc).isoformat(), schema_version=1)
    return data


async def capture_scene(url, options, log):
    from playwright.async_api import async_playwright

    from .browser import launch_browser
    from .cover import COVER_VIEWPORT, page_cover

    url = http_url(url)
    if not url:
        raise ValueError('活动没有有效的 HTTP(S) 网页地址')
    async with async_playwright() as pw:
        browser = await launch_browser(pw, options, headed=False)
        try:
            page = await browser.new_page(viewport=COVER_VIEWPORT, accept_downloads=False)
            response = await page.goto(url, wait_until='load', timeout=options.timeout * 1000)
            if response and response.status >= 400:
                raise RuntimeError(f'活动网页返回 HTTP {response.status}')
            cover = await page_cover(page, options, log)
            return cover, await page_scene(page, options, log)
        finally:
            await browser.close()


def save_scene(folder: Path, data: dict, groups: list) -> dict:
    if not data.get('scenes'):
        raise ValueError('；'.join(data.get('warnings', [])) or '原网页没有可读取的场景')
    hashes, names = {}, {}
    for index, group in enumerate(groups):
        if group.get('status') != 'complete':
            continue
        names.setdefault(normalized_name(group['name']), []).append(index)
        try:
            value = json.loads((folder / group['directory'] / 'skeleton.json').read_bytes())
            key = value.get('skeleton', {}).get('hash')
            if key:
                hashes.setdefault(key, []).append(index)
        except (ValueError, OSError):
            pass
    # New generation directory keeps the previous scene usable if a capture fails.
    destination = folder / 'composition' / secrets.token_hex(6)
    destination.mkdir(parents=True)
    counter, total = 0, 0

    def image(value):
        nonlocal counter, total
        if not isinstance(value, str) or not value.startswith('data:image/png;base64,'):
            raise ValueError('场景图层不是 PNG')
        content = base64.b64decode(value.split(',', 1)[1], validate=True)
        total += len(content)
        if total > 96 * 1024**2 or not content.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValueError('场景图片无效或超出 96 MB')
        path = destination / f'{counter}.png'
        counter += 1
        path.write_bytes(content)
        return path.relative_to(folder).as_posix()

    data = json.loads(json.dumps(data))
    for scene in data['scenes']:
        scene['reference'] = image(scene['reference'])
        for layer in scene['layers']:
            layer['image'] = image(layer['image'])
            if layer['kind'] == 'spine':
                matches = hashes.get(layer.get('hash'), []) or names.get(normalized_name(layer.get('spine_id') or layer['name']), [])
                if len(matches) == 1:
                    layer['group'] = matches[0]
                else:
                    layer['kind'] = 'image'
                    data.setdefault('warnings', []).append(f"{layer['name']} 未匹配本地骨骼，保留原网页画面图层")
    path = folder / 'composition.json'
    temporary = path.with_suffix('.json.part')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2), 'utf-8')
    temporary.replace(path)
    return data

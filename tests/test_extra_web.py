"""Real browser tests for extra motion and the compact control rules."""

import json
import os
from copy import deepcopy
from pathlib import Path

import pytest

@pytest.mark.skipif(not os.environ.get("SPINE_BROWSER_TEST"), reason="Set SPINE_BROWSER_TEST=1")
async def test_extra_panel_and_animation_control_counts(web, skeleton, atlas, png):
    from playwright.async_api import async_playwright

    from spine_extractor.server import STATIC

    client, state = web
    folder = Path(state.settings["output"]) / "extra测试"
    groups = []
    for index, count in enumerate([1, 2, 4, 5]):
        group_folder = folder / "spine" / str(index)
        group_folder.mkdir(parents=True)
        value = deepcopy(skeleton)
        value["skeleton"].update(spine="4.2.43", width=100, height=100, hash=f"fixture-{index}")
        value["bones"].append({"name": "flutter", "parent": "root", "length": 32})
        value["slots"][0]["bone"] = "flutter"
        value["skins"][0]["attachments"]["body"]["body"].update(width=32, height=48)
        value["animations"] = {f"anim-{i}": {} for i in range(count)}
        if count == 5:
            value['animations'] = {name: {} for name in ['in', 'idle', 'preLoOp_end', 'loop_last', 'out']}
        value["extra"] = {"flutter": {"rootBoneName": "flutter", "animation": {
            "default": {"mode": 1, "rotateTime": 1, "rotateRange": 30},
        }}}
        value["extraSlot"] = {"body": {"slotName": "body", "animation": {
            "default": {"mode": 1, "blinkTime": 1, "min": 0.1, "max": 0.5},
        }}}
        (group_folder / "skeleton.json").write_text(json.dumps(value), "utf-8")
        (group_folder / "skeleton.atlas").write_text(atlas, "utf-8")
        (group_folder / "hero.png").write_bytes(png)
        groups.append({"name": f"case-{count}", "directory": f"spine/{index}", "status": "complete",
                       "version": "4.2.43", "textures": [{"name": "hero.png"}]})
    (folder / "manifest.json").write_text(json.dumps({"title": "extra测试", "groups": groups,
        "complete_count": 4, "skeleton_count": 4, "atlas_count": 4, "page_url": "https://example.test/"}), "utf-8")
    key = client.get("/api/activities").json()[0]["id"]
    assert all(group["has_extra"] for group in client.get(f"/api/activities/{key}").json()["groups"])
    async with async_playwright() as pw:
        browser = None
        for channel in (None, "msedge", "chrome"):
            try:
                browser = await pw.chromium.launch(channel=channel, args=["--enable-unsafe-swiftshader"])
                break
            except Exception:
                continue
        assert browser
        try:
            page = await browser.new_page(viewport={"width": 1400, "height": 960})
            await page.route('https://unpkg.com/**', lambda route: route.abort())
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            script = (STATIC / "gallery.js").read_text("utf-8").replace(
                "this.container = container;", "window.__gallery = this; this.container = container;")
            await page.route("**/static/gallery.js", lambda route: route.fulfill(body=script, content_type="text/javascript"))
            await page.goto(f"{client.base_url}#activity/{key}")
            await page.wait_for_function("document.querySelectorAll('.asset-card[data-preview=ready]').length === 4")
            cards = page.locator('.asset-card')
            assert await cards.nth(0).locator('.current-animation').inner_text() == 'anim-0'
            assert await cards.nth(0).locator('select').count() == 0
            assert await cards.nth(1).locator('.animation-buttons button').count() == 2
            assert await cards.nth(2).locator('.animation-buttons button').count() == 4
            assert await cards.nth(3).get_by_label('case-5 动作').locator('option').count() == 5
            assert await cards.nth(3).get_by_label('case-5 动作').input_value() == 'preLoOp_end'
            assert await page.locator('.asset-header .extra-tag').count() == 4
            assert await page.locator('select[aria-label$=" 皮肤"]').count() == 0
            await cards.first.get_by_role('button', name='详情 ↗').click()
            await page.wait_for_function('__gallery.detailSurface?.ready')
            await page.wait_for_function('Number(document.querySelector("dialog .fps-value").textContent) > 0')
            assert await page.locator('dialog .fps-monitor').is_visible()
            await page.locator('dialog').get_by_label('隐藏帧率调试').click()
            assert await page.locator('dialog .fps-monitor').is_hidden()
            await page.locator('dialog').get_by_role('button', name='帧率调试', exact=True).click()
            assert await page.locator('dialog .fps-monitor').is_visible()
            before = await page.evaluate('__gallery.cards.map(c => c.surface.elapsed)')
            await page.wait_for_timeout(350)
            assert await page.evaluate('__gallery.cards.map(c => c.surface.elapsed)') == before
            assert not await cards.first.locator('canvas').is_visible()
            await page.wait_for_function('Math.abs(__gallery.detailSurface.skeleton.findBone("flutter").rotation) > 1')
            assert await page.evaluate('__gallery.detailSurface.skeleton.findSlot("body").color.a') < 0.6
            await page.get_by_text('extra 飘动调试', exact=True).click()
            panel = page.locator('.extra-debug')
            await panel.locator('.extra-bone-editor').wait_for()
            assert await panel.evaluate("e => e.closest('.detail-side') !== null")
            assert await panel.evaluate("e => getComputedStyle(e).position") == 'static'
            side = await page.locator('.detail-side').bounding_box()
            panel_box = await panel.bounding_box()
            assert side['x'] <= panel_box['x'] and panel_box['x'] + panel_box['width'] <= side['x'] + side['width']
            assert await panel.locator('.extra-curve').count() > 0
            assert await panel.evaluate('e => e.scrollWidth <= e.clientWidth')
            assert await panel.locator('.extra-param-row').first.evaluate('e => getComputedStyle(e).fontSize') == '12px'
            assert await page.locator('.dayu-panel').count() == 0
            await panel.get_by_label('启用飘动', exact=True).click()
            await page.wait_for_function('__gallery.detailSurface.skeleton.findBone("flutter").rotation === 0')
            assert await page.evaluate('__gallery.detailSurface.skeleton.findSlot("body").color.a') == 1
            await panel.get_by_label('启用飘动', exact=True).click()
            await page.wait_for_function('Math.abs(__gallery.detailSurface.skeleton.findBone("flutter").rotation) > 1')
            rotation = panel.locator('.extra-param-row').filter(has=page.get_by_text('旋转范围', exact=True))
            assert await rotation.locator('input[type=text]').get_attribute('readonly') is not None
            assert await rotation.locator('input[type=range]').is_disabled()
            await rotation.locator('input[type=text]').focus()
            await page.keyboard.press('ControlOrMeta+A')
            await page.keyboard.type('12')
            assert await rotation.locator('input[type=text]').input_value() == '30'
            assert await panel.locator('button').count() == 0
            assert 'flutter · 正弦波动' in await panel.get_by_label('飘动骨骼', exact=True).inner_text()
            # Native select popups must not be rebuilt on every debug sample.
            await panel.get_by_label('飘动骨骼', exact=True).click()
            mutations = await panel.locator('.extra-bone-list').evaluate('''async element => {
                let changes = 0;
                const observer = new MutationObserver(records => changes += records.length);
                observer.observe(element, {subtree: true, childList: true, characterData: true});
                await new Promise(resolve => setTimeout(resolve, 350));
                observer.disconnect(); return changes;
            }''')
            await page.keyboard.press('Escape')
            assert mutations == 0
            curve = await panel.locator('.extra-curve').screenshot()
            await page.wait_for_timeout(250)
            assert curve != await panel.locator('.extra-curve').screenshot()
            await panel.get_by_placeholder('搜索飘动骨骼').fill('missing-bone')
            assert await panel.get_by_text('没有匹配的飘动骨骼').is_visible()
            await panel.get_by_placeholder('搜索飘动骨骼').fill('flutter')
            assert await panel.get_by_label('飘动骨骼', exact=True).locator('option').count() == 1
            assert await rotation.locator('input[type=text]').input_value() == '30'
            await page.set_viewport_size({'width': 390, 'height': 844})
            await panel.scroll_into_view_if_needed()
            assert await panel.evaluate('e => e.scrollWidth <= e.clientWidth')
            assert await page.locator('.detail-side').evaluate('e => e.scrollWidth <= e.clientWidth')
            assert await page.locator('.extra-export-notice').is_visible()
            # The inspector never changes the runtime parameters or source JSON.
            assert await page.evaluate('__gallery.detailSurface.extra.mesh.autoBone[0].currentAnimation.rotateRange') == 30
            original = json.loads((folder / 'spine/0/skeleton.json').read_text('utf-8'))
            assert original['extra']['flutter']['animation']['default']['rotateRange'] == 30
            await page.get_by_label('关闭详情', exact=True).click()
            await panel.wait_for(state='detached')
            assert await cards.first.locator('canvas').is_visible()
            resumed = await page.evaluate('__gallery.cards[1].surface.elapsed')
            await page.wait_for_function('__gallery.cards[1].surface.elapsed > ' + str(resumed))
            assert not errors, errors
        finally:
            await browser.close()

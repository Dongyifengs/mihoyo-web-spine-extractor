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
            assert await page.locator('.asset-header .extra-tag').count() == 4
            assert await page.locator('select[aria-label$=" 皮肤"]').count() == 0
            await cards.first.get_by_role('button', name='详情 ↗').click()
            await page.wait_for_function('__gallery.detailSurface?.ready')
            await page.wait_for_function('Math.abs(__gallery.detailSurface.skeleton.findBone("flutter").rotation) > 1')
            assert await page.evaluate('__gallery.detailSurface.skeleton.findSlot("body").color.a') < 0.6
            await page.get_by_role('button', name='extra 调试面板', exact=True).click()
            panel = page.locator('.dayu-panel')
            await panel.locator('.dayu-bone-section').wait_for()
            assert await panel.locator('.dayu-sparkline').count() > 0
            await panel.locator('.dayu-toggle-btn').click()
            await page.wait_for_function('__gallery.detailSurface.skeleton.findBone("flutter").rotation === 0')
            assert await page.evaluate('__gallery.detailSurface.skeleton.findSlot("body").color.a') == 1
            await panel.locator('.dayu-toggle-btn').click()
            await page.wait_for_function('Math.abs(__gallery.detailSurface.skeleton.findBone("flutter").rotation) > 1')
            await panel.get_by_title('编辑参数', exact=True).first.click()
            rotation = panel.locator('.dayu-param-row').filter(has=page.get_by_text('旋转范围', exact=True))
            await rotation.locator('input[type=text]').fill('0')
            # Let live parameter refreshes run while the user's edit is uncommitted.
            await page.evaluate('''() => {
                const provider = __gallery.detailSurface.extra.provider;
                const original = provider.getExtraParams;
                window.__paramRefreshes = 0;
                provider.getExtraParams = function (...args) {
                    window.__paramRefreshes++;
                    return original.apply(this, args);
                };
            }''')
            await page.wait_for_function('__paramRefreshes >= 2')
            assert await rotation.locator('input[type=text]').input_value() == '0'
            await rotation.locator('input[type=text]').press('Enter')
            await page.wait_for_function('__gallery.detailSurface.skeleton.findBone("flutter").rotation === 0')
            await rotation.locator('input[type=text]').fill('12')
            await page.evaluate('window.__paramRefreshes = 0')
            await page.wait_for_function('__paramRefreshes >= 2')
            assert await rotation.locator('input[type=text]').input_value() == '12'
            await rotation.locator('input[type=text]').press('Tab')
            await page.wait_for_function('''
                __gallery.detailSurface.extra.mesh.autoBone[0].currentAnimation.rotateRange === 12
                && Math.abs(__gallery.detailSurface.skeleton.findBone("flutter").rotation) > 1
            ''')
            await panel.get_by_placeholder('搜索骨骼名称...').fill('missing-bone')
            assert not await panel.locator('.dayu-bone-section').is_visible()
            await panel.get_by_placeholder('搜索骨骼名称...').fill('flutter')
            assert await panel.locator('.dayu-bone-section').is_visible()
            assert await page.locator('.extra-export-notice').is_visible()
            # Tuning changes runtime state only; the downloaded JSON remains byte-for-byte intact.
            original = json.loads((folder / 'spine/0/skeleton.json').read_text('utf-8'))
            assert original['extra']['flutter']['animation']['default']['rotateRange'] == 30
            await page.get_by_label('关闭详情', exact=True).click()
            await panel.wait_for(state='detached')
            assert not errors, errors
        finally:
            await browser.close()

import json
import os
import time
from pathlib import Path

import pytest

from spine_extractor.server import Workbench
from spine_extractor.urls import unique_directory


@pytest.mark.parametrize("version, animated", [("4.2.43", True), ("4.1.17", True), ("3.8.99", False)])
def test_open_project_uses_saved_editor_version(tmp_path, monkeypatch, version, animated):
    from spine_extractor.server import open_project

    cli = tmp_path / "spine.com"
    cli.touch()
    project = tmp_path / "测试 空格.spine"
    called = []
    monkeypatch.setattr("spine_extractor.server.subprocess.Popen", lambda args, **kwargs: called.append(args))
    open_project(project, {"version": "4.0-from-4.1.17", "spine_project": {"editor_version": version}},
                 {"spine_cli": str(cli)})
    assert called == [[str(cli), "-u", version, "--no-reuse-instance", "--auto-start"]
                      + (["--animate-mode"] if animated else []) + [str(project)]]


def test_default_page_and_auth_guards(web):
    client, _ = web
    assert client.get("/").status_code == 200
    assert "正版" in client.get("/").text
    assert client.get("/api/bootstrap").json()["version"] == "0.4.0"
    assert client.post("/api/settings", json={"spine_cli": ""}, headers={"Origin": "https://evil.test"}).status_code == 403
    assert client.post("/api/settings", json={}, headers={"X-Spine-Token": "wrong"}).status_code == 403
    assert client.get("/api/bootstrap", headers={"Host": "evil.test"}).status_code == 403
    assert client.get("/static/%2e%2e/server.py").status_code == 400
    assert client.get("/static/vendor/spine-player-4.2.120.js").status_code == 200


def test_job_to_library_and_report(web, server, monkeypatch):
    from spine_extractor.cover import Cover

    client, state = web
    base, _, _ = server

    async def cover(*args):
        return Cover(b'cover-fixture', {'file': 'cover.jpg', 'wait_seconds': 20})

    monkeypatch.setattr('spine_extractor.engine.capture_cover', cover)
    response = client.post("/api/jobs", json={"urls": [base + "/index.html"], "options": {"mode": "static"}})
    assert response.status_code == 202
    key = response.json()["id"]
    deadline = time.monotonic() + 20
    while time.monotonic() < deadline:
        job = client.get("/api/jobs/" + key).json()
        if job["status"] != "running":
            break
        time.sleep(0.1)
    assert job["status"] == "completed", job
    assert job["result"]["activities"][0]["complete"] == 1
    library = client.get("/api/activities").json()
    assert len(library) == 1 and library[0]["folder_name"] == "测试活动"
    assert client.get(library[0]['cover_url']).content == b'cover-fixture'
    activity = client.get("/api/activities/" + library[0]["id"]).json()
    group = activity["groups"][0]
    assert group["directory"] == "spine/hero"
    assert group["animations"] == ["idle"]
    assert group["skins"] == ["default"]
    assert group["has_extra"] is False
    assert client.get(group["skeleton_url"]).status_code == 200
    assert client.get(group["atlas_url"]).status_code == 200
    assert client.get(group["preview_url"]).status_code == 200
    assert client.get(activity["report_url"]).status_code == 200
    assert client.post(f"/api/activities/{activity['id']}/convert", json={"groups": [0]}).status_code == 400
    assert client.get(f"/files/{activity['id']}/%2e%2e/settings.json").status_code == 400
    assert Path(state.settings["output"], "测试活动", "spine", "hero", "skeleton.json").exists()


def test_settings_persist_and_invalid_cli_does_not_save(web):
    client, state = web
    assert client.post("/api/settings", json={"spine_cli": "missing.com"}).status_code == 400
    assert state.settings["spine_cli"] == ""
    assert client.post("/api/settings", json={"spine_timeout": 300}).status_code == 200
    stored = json.loads(state.settings_file.read_text("utf-8"))
    assert stored["spine_timeout"] == 300
    loaded = Workbench(state.config_dir)
    assert loaded.settings["spine_timeout"] == 300


def test_sequential_names_without_hashes(tmp_path):
    assert unique_directory(tmp_path, "活动标题").name == "活动标题"
    assert unique_directory(tmp_path, "活动标题").name == "活动标题-1"
    assert unique_directory(tmp_path, "活动标题").name == "活动标题-2"
    assert unique_directory(tmp_path, "Hero").name == "Hero"
    assert unique_directory(tmp_path, "hero").name == "hero-1"
    unique_directory(tmp_path, "长" * 80)
    assert unique_directory(tmp_path, "长" * 80).name == "长" * 78 + "-1"


@pytest.mark.skipif(not os.environ.get("SPINE_BROWSER_TEST"), reason="Set SPINE_BROWSER_TEST=1")
@pytest.mark.parametrize("version", ["3.8.99", "4.0.64", "4.1.24", "4.2.43"])
async def test_gallery_renders_all_cards_and_interactive_details(web, skeleton, atlas, png, version):
    """Use real bundled runtimes and WebGL with synthetic assets, without internet access."""
    from copy import deepcopy

    from playwright.async_api import async_playwright

    from spine_extractor.server import STATIC

    client, state = web
    folder = Path(state.settings["output"]) / "动画测试"
    group_folder = folder / "spine" / "hero"
    group_folder.mkdir(parents=True)
    value = deepcopy(skeleton)
    value["skeleton"].update(spine=version, width=64, height=64)
    value["skins"][0]["attachments"]["body"]["body"].update(width=32, height=48)
    alt = deepcopy(value["skins"][0])
    alt["name"] = "alternate"
    alt["attachments"]["body"]["body"]["color"] = "55ff55ff"
    value["skins"].append(alt)
    value["animations"] = {"idle": {"bones": {"root": {"translate": [
        {"x": -20}, {"time": 1, "x": 20}, {"time": 2, "x": -20}]}}}, "still": {}}
    value["animations"]["0"] = {"slots": {"body": {"attachment": [{}]}}}
    (group_folder / "skeleton.json").write_text(json.dumps(value), encoding="utf-8")
    if version.startswith("3.8"):
        atlas = "hero.png\nsize: 4, 4\nformat: RGBA8888\nfilter: Linear, Linear\nrepeat: none\nbody\n  rotate: false\n  xy: 0, 0\n  size: 2, 3\n  orig: 2, 3\n  offset: 0, 0\n  index: -1\n"
    (group_folder / "skeleton.atlas").write_text(atlas, encoding="utf-8")
    (group_folder / "hero.png").write_bytes(png)
    group = {"name": "hero", "directory": "spine/hero", "status": "complete", "version": version,
             "textures": [{"name": "hero.png"}], "files": ["skeleton.json", "skeleton.atlas", "hero.png"],
             "animations": list(value["animations"]), "skins": ["default", "alternate"]}
    count = 70 if version.startswith("4.2") else 1
    manifest = {"title": "动画测试", "groups": [dict(group, name=f"hero-{i}") for i in range(count)],
                "complete_count": count, "skeleton_count": count, "atlas_count": count, "page_url": "https://example.test/event/"}
    (folder / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    key = client.get("/api/activities").json()[0]["id"]
    errors = []
    async with async_playwright() as pw:
        browser = None
        for channel in (None, "msedge", "chrome"):
            try:
                browser = await pw.chromium.launch(channel=channel, args=["--enable-unsafe-swiftshader"])
                break
            except Exception:
                continue
        assert browser is not None, "Install a Playwright Chromium, Edge or Chrome browser"
        try:
            page = await browser.new_page(viewport={"width": 1400, "height": 960})
            page.on("pageerror", lambda error: errors.append(str(error)))
            # Observe real runtime instances without adding test hooks to the shipped app.
            script = (STATIC / "gallery.js").read_text("utf-8").replace(
                "this.container = container;", "window.__testGallery = this; this.container = container;")
            await page.route("**/static/gallery.js", lambda route: route.fulfill(body=script, content_type="text/javascript"))
            await page.goto(f"{client.base_url}#activity/{key}")
            card = page.locator(".asset-card").first
            await page.wait_for_function("document.querySelectorAll('.asset-card[data-preview=ready]').length === " + str(count), timeout=45000)
            assert not await card.locator(".placeholder").is_visible()
            await page.evaluate("() => { window.surface = __testGallery.cards[0].surface; }")
            await page.wait_for_function("surface.animationState.getCurrent(0).trackTime > 0.05")
            canvas = card.locator("canvas")
            before = await canvas.screenshot()
            await page.wait_for_timeout(250)
            assert before != await canvas.screenshot(), "Animation pixels must change while playing"
            await card.get_by_title("播放 / 暂停", exact=True).click()
            time_before = await page.evaluate("surface.animationState.getCurrent(0).trackTime")
            await page.wait_for_timeout(150)
            assert await page.evaluate("surface.animationState.getCurrent(0).trackTime") == time_before
            await card.get_by_title("循环播放", exact=True).click()
            assert await page.evaluate("surface.animationState.getCurrent(0).loop") is False
            await card.get_by_label("hero-0 皮肤", exact=True).select_option("default")
            assert await page.evaluate("surface.skeleton.skin.name") == "default"
            await card.get_by_label("hero-0 皮肤", exact=True).select_option("alternate")
            assert await page.evaluate("surface.skeleton.skin.name") == "alternate"
            assert await card.locator(".animation-buttons button").count() == 3
            assert await card.get_by_label("hero-0 动作", exact=True).count() == 0
            await card.locator('[data-animation="0"]').click()
            assert await page.evaluate("surface.animationState.getCurrent(0).animation.name") == "0"
            assert await card.get_attribute("data-preview") == "ready"
            await card.locator('[data-animation="still"]').click()
            assert await page.evaluate("surface.animationState.getCurrent(0).animation.name") == "still"
            await card.get_by_role("button", name="详情 ↗").click()
            dialog = page.locator("dialog")
            await page.wait_for_function("__testGallery.detailSurface?.ready")
            assert await page.evaluate("__testGallery.detailSurface.skeleton.skin.name") == "alternate"
            await dialog.get_by_label("播放速度", exact=True).select_option("0.5")
            assert await page.evaluate("__testGallery.detailSurface.state.speed") == 0.5
            await dialog.get_by_label("放大", exact=True).click()
            assert await page.evaluate("__testGallery.detailSurface.view.zoom") > 1
            view = dialog.locator('.detail-preview canvas')
            box = await view.bounding_box()
            await page.mouse.move(box['x'] + 100, box['y'] + 100)
            await page.mouse.down()
            await page.mouse.move(box['x'] + 170, box['y'] + 140, steps=5)
            await page.mouse.up()
            assert await page.evaluate("__testGallery.detailSurface.view.x") != 0
            await page.mouse.wheel(0, -200)
            await page.wait_for_function("__testGallery.detailSurface.view.zoom > 1.2")
            await dialog.get_by_role('button', name='适应窗口').click()
            assert await page.evaluate("__testGallery.detailSurface.view") == {"zoom": 1, "x": 0, "y": 0}
            await dialog.get_by_label('骨骼', exact=True).check()
            await page.wait_for_timeout(100)
            assert await page.evaluate("__testGallery.detailSurface.pool.renderer.skeletonDebugRenderer.drawBones") is True
            await dialog.get_by_label('全屏观看', exact=True).click()
            await page.wait_for_function("document.fullscreenElement?.tagName === 'HTML'")
            await dialog.get_by_label('全屏观看', exact=True).click()
            await page.wait_for_function("!document.fullscreenElement")
            await dialog.get_by_label("关闭详情", exact=True).click()
            assert await page.locator('.asset-card[data-preview=ready]').count() == count
            if count > 1:
                # The last card is already running before scrolling to it, with only one WebGL pool.
                assert await page.evaluate("__testGallery.cards.at(-1).surface.animationState.getCurrent(0).trackTime") > 0
                assert await page.evaluate("__testGallery.hub.pools.size") == 1
                await page.locator(".asset-card").last.scroll_into_view_if_needed()
                assert await card.get_attribute("data-preview") == "ready"
                assert await card.locator('canvas').count() == 1
            assert not errors, errors
            await page.goto(f"{client.base_url}/reports/{key}/report.html")
            await page.wait_for_function("document.querySelectorAll('.asset-card[data-preview=ready]').length === " + str(count), timeout=45000)
            assert await page.locator(".asset-card").count() == count
        finally:
            await browser.close()

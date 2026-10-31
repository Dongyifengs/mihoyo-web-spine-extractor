import json
import os
import threading
import time
from pathlib import Path

import httpx
import pytest

from spine_extractor.server import Workbench, make_server
from spine_extractor.urls import unique_directory


@pytest.fixture
def web(tmp_path):
    state = Workbench(tmp_path / "state", tmp_path / "outputs")
    httpd = make_server(state, 0)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    origin = f"http://127.0.0.1:{httpd.server_port}"
    with httpx.Client(base_url=origin, timeout=20, trust_env=False, headers={"Origin": origin, "X-Spine-Token": state.csrf}) as client:
        yield client, state
    for options in state.job_options.values():
        options.cancel.set()
    if state.worker:
        state.worker.join(10)
    httpd.shutdown()
    httpd.server_close()
    thread.join()


def test_default_page_and_auth_guards(web):
    client, _ = web
    assert client.get("/").status_code == 200
    assert "正版" in client.get("/").text
    assert client.get("/api/bootstrap").json()["version"] == "0.2.0"
    assert client.post("/api/settings", json={"spine_cli": ""}, headers={"Origin": "https://evil.test"}).status_code == 403
    assert client.post("/api/settings", json={}, headers={"X-Spine-Token": "wrong"}).status_code == 403
    assert client.get("/api/bootstrap", headers={"Host": "evil.test"}).status_code == 403
    assert client.get("/static/%2e%2e/server.py").status_code == 400
    assert client.get("/static/vendor/spine-player-4.2.120.js").status_code == 200


def test_job_to_library_and_report(web, server):
    client, state = web
    base, _, _ = server
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
    activity = client.get("/api/activities/" + library[0]["id"]).json()
    group = activity["groups"][0]
    assert group["directory"] == "spine/hero"
    assert group["animations"] == ["idle"]
    assert group["skins"] == ["default"]
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
async def test_gallery_renders_controls_and_releases_offscreen_players(web, skeleton, atlas, png, version):
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
    count = 30 if version.startswith("4.2") else 1
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
            # Expose the real player instance only in the test response; do not mock playback.
            script = (STATIC / "player.js").read_text("utf-8").replace(
                "player = new spine.SpinePlayer", "window.__testPlayer = player = new spine.SpinePlayer")
            await page.route("**/static/player.js", lambda route: route.fulfill(body=script, content_type="text/javascript"))
            await page.goto(f"{client.base_url}#activity/{key}")
            card = page.locator(".asset-card").first
            await card.locator("[title='播放 / 暂停']").wait_for()
            await page.wait_for_function("document.querySelector('.asset-card').dataset.preview", timeout=30000)
            assert await card.get_attribute("data-preview") == "ready", await card.inner_text()
            assert not await card.locator(".placeholder").is_visible()
            frame = await (await card.locator("iframe").element_handle()).content_frame()
            await frame.wait_for_function("window.__testPlayer.animationState.getCurrent(0).trackTime > 0.05")
            canvas = frame.locator("canvas").first
            before = await canvas.screenshot()
            await page.wait_for_timeout(250)
            assert before != await canvas.screenshot(), "Animation pixels must change while playing"
            await card.get_by_title("播放 / 暂停", exact=True).click()
            await frame.wait_for_function("window.__testPlayer.paused === true")
            time_before = await frame.evaluate("__testPlayer.animationState.getCurrent(0).trackTime")
            await page.wait_for_timeout(150)
            assert await frame.evaluate("__testPlayer.animationState.getCurrent(0).trackTime") == time_before
            await card.get_by_title("循环播放", exact=True).click()
            await frame.wait_for_function("__testPlayer.animationState.getCurrent(0).loop === false")
            await card.get_by_label("hero-0 皮肤", exact=True).select_option("default")
            await frame.wait_for_function("__testPlayer.skeleton.skin.name === 'default'")
            await card.get_by_label("hero-0 皮肤", exact=True).select_option("alternate")
            await frame.wait_for_function("__testPlayer.skeleton.skin.name === 'alternate'")
            await card.get_by_label("hero-0 动作", exact=True).select_option("0")
            await frame.wait_for_function("__testPlayer.animationState.getCurrent(0).animation.name === '0'")
            assert await card.get_attribute("data-preview") == "ready"
            await card.get_by_label("hero-0 动作", exact=True).select_option("still")
            await frame.wait_for_function("__testPlayer.animationState.getCurrent(0).animation.name === 'still'")
            await card.get_by_role("button", name="详情 ↗").click()
            dialog = page.locator("dialog")
            await dialog.wait_for(state="visible")
            detail = await (await dialog.locator("iframe").element_handle()).content_frame()
            await detail.wait_for_function("window.__testPlayer?.skeleton?.skin?.name === 'alternate'")
            await dialog.get_by_label("播放速度", exact=True).select_option("0.5")
            await detail.wait_for_function("__testPlayer.speed === 0.5")
            await dialog.get_by_label("关闭详情", exact=True).click()
            await page.wait_for_function("document.querySelector('.asset-card').dataset.preview === 'ready'")
            if count > 1:
                assert await page.locator(".asset-preview iframe").count() <= 8
                await page.locator(".asset-card").last.scroll_into_view_if_needed()
                await page.wait_for_function("!document.querySelector('.asset-card').querySelector('iframe')")
                await page.wait_for_function("Array.from(document.querySelectorAll('.asset-card')).at(-1).dataset.preview === 'ready'")
                assert await card.locator(".placeholder").evaluate("element => !element.hidden")
                assert await page.locator(".asset-preview iframe").count() <= 8
            assert not errors, errors
            await page.goto(f"{client.base_url}/reports/{key}/report.html")
            await page.wait_for_selector(".asset-card[data-preview=ready]")
            assert await page.locator(".asset-card").count() == count
        finally:
            await browser.close()

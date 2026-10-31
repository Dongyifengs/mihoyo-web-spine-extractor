import asyncio
import json
import os
from pathlib import Path

import pytest

from spine_extractor.browser import capture
from spine_extractor.discovery import Scanner
from spine_extractor.engine import run
from spine_extractor.models import Options
from spine_extractor.network import Fetcher


async def test_static_pipeline_redirect_base_and_repeat_run(server, tmp_path):
    base, _, requests = server
    options = Options(output=tmp_path, mode="static", retries=0)
    result = await asyncio.wait_for(run([base + "/index.html"], options, lambda _: None), timeout=20)
    assert not result["errors"]
    item = result["activities"][0]
    assert (item["skeletons"], item["atlases"], item["complete"], item["partial"]) == (1, 1, 1, 0)
    folder = Path(item["folder"])
    manifest = json.loads((folder / "manifest.json").read_text("utf-8"))
    group = manifest["groups"][0]
    dest = folder / group["directory"]
    assert (dest / "hero.png").exists()
    assert (dest / "regions/body.png").exists()
    assert json.loads((dest / "skeleton.json").read_text())["skeleton"]["images"] == "./source/"
    assert json.loads((dest / "import.json").read_text())["skeleton"]["images"] == "./regions/"
    again = await run([base + "/index.html"], options, lambda _: None)
    assert again["directory"] != result["directory"]
    assert (dest / "hero.png").exists()
    assert requests.count("/assets/hero.1234abcd..png") == 2


async def test_missing_texture_has_partial_status(server, tmp_path):
    base, routes, _ = server
    del routes["/assets/hero.1234abcd..png"]
    result = await run([base + "/index.html"], Options(output=tmp_path, mode="static", retries=0), lambda _: None)
    assert result["activities"][0]["partial"] == 1
    assert result["activities"][0]["complete"] == 0


async def test_limits_404_and_cancellation(server, tmp_path):
    base, _, requests = server
    options = Options(output=tmp_path, max_file_mb=1, retries=2)
    async with Fetcher(options, lambda _: None) as fetcher:
        assert await fetcher.get(base + "/large.json") is None
        assert "大小限制" in fetcher.failures[base + "/large.json"]
        assert await fetcher.get(base + "/404") is None
        assert requests.count("/404") == 1
    options.cancel.set()
    result = await run([base + "/index.html"], options, lambda _: None)
    assert result["cancelled"]
    assert (Path(result["directory"]) / "batch.json").exists()


@pytest.mark.skipif(not os.environ.get("SPINE_BROWSER_TEST"), reason="Set SPINE_BROWSER_TEST=1 with a browser installed")
async def test_browser_captures_delayed_iframe_network(server, tmp_path):
    base, _, _ = server
    options = Options(output=tmp_path, wait=2, retries=0)
    async with Fetcher(options, lambda _: None) as fetcher:
        await capture(fetcher, base + "/dynamic.html")
        scanner = Scanner(base + "/dynamic.html")
        for resource in fetcher.resources.values():
            scanner.scan(resource)
        assert len(scanner.skeletons) == len(scanner.atlases) == 1
        assert base + "/hero.png" in fetcher.resources

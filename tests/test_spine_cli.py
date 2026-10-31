import json
import sys
import threading
import time
from pathlib import Path

import pytest

from spine_extractor.models import Cancelled, Options
from spine_extractor.spine_cli import clean_log, convert_group, editor_version, run_command


def test_editor_version_and_log_privacy():
    assert editor_version("4.0-from-4.1.24") == "4.1.24"
    assert editor_version("4.2.43") == "4.2.43"
    with pytest.raises(ValueError):
        editor_version("anything --logout")
    assert "private@example.com" not in clean_log("Licensed to: Someone <private@example.com>\nComplete.")


async def test_cli_import_arguments_and_relative_images(tmp_path, skeleton, atlas):
    cli = tmp_path / "正版 Spine" / "spine.com"
    cli.parent.mkdir()
    cli.touch()
    folder = tmp_path / "项目 空格"
    folder.mkdir()
    skeleton["extra"] = {"root": {"animation": {"default": {"mode": 1}}, "rootBoneName": "root"}}
    skeleton["extraConfig"] = {"timeScale": 1}
    skeleton["extraSlot"] = {}
    (folder / "skeleton.json").write_text(json.dumps(skeleton), encoding="utf-8")
    (folder / "skeleton.atlas").write_text(atlas, encoding="utf-8")
    recorded = []

    async def fake(args, cwd, options):
        recorded.append(args)
        assert cwd == folder
        assert "-c" in args and "-r" in args
        project = Path(args[args.index("-r") - 1])
        project.write_bytes(b"valid-test-project")
        return "Licensed to: user <private@example.com>\nComplete."

    options = Options(spine_cli=str(cli))
    info = await convert_group(folder, {"name": "角色", "version": "4.0-from-4.1.24", "status": "complete"}, options, lambda _: None, fake)
    assert info["status"] == "success"
    assert info["project"] == "角色.spine"
    assert "不包含此效果" in info["extra_notice"]
    assert recorded[0][:3] == [str(cli), "-u", "4.1.24"]
    assert str(folder / "skeleton.atlas") in recorded[0]
    assert json.loads((folder / "import.json").read_text("utf-8"))["skeleton"]["images"] == "./regions/"
    assert json.loads((folder / "skeleton.json").read_text("utf-8"))["skeleton"]["images"] == "./source/"
    imported = json.loads((folder / "import.json").read_text("utf-8"))
    assert not {"extra", "extraSlot", "extraConfig"} & imported.keys()
    assert "extra" in json.loads((folder / "skeleton.json").read_text("utf-8"))
    assert "private@example.com" not in (folder / "spine-cli.log").read_text("utf-8")


async def test_optional_failure_keeps_assets(tmp_path, skeleton):
    data = json.dumps(skeleton)
    (tmp_path / "skeleton.json").write_text(data, encoding="utf-8")
    info = await convert_group(tmp_path, {"name": "hero", "version": "4.2.43", "status": "complete"}, Options(spine_cli="missing/spine.com"), lambda _: None)
    assert info["status"] == "failed"
    assert (tmp_path / "skeleton.json").read_text("utf-8") == data


async def test_cli_timeout_and_cancellation_stop_the_process(tmp_path):
    options = Options(spine_timeout=0.3)
    start = time.monotonic()
    with pytest.raises(TimeoutError):
        await run_command([sys.executable, "-c", "import time;time.sleep(30)"], tmp_path, options)
    assert time.monotonic() - start < 8
    options = Options(spine_timeout=30)
    threading.Timer(0.3, options.cancel.set).start()
    with pytest.raises(Cancelled):
        await run_command([sys.executable, "-c", "import time;time.sleep(30)"], tmp_path, options)

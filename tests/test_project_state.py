import json
import zlib
from pathlib import Path

import pytest

from spine_extractor.models import Options
from spine_extractor.project_state import UnsupportedProject, selection_candidate
from spine_extractor.spine_cli import select_animation

FIXTURES = Path(__file__).with_name("fixtures") / "project-state"
STATES = json.loads((FIXTURES / "states.json").read_text("utf-8"))
NAMES = ["first_animation", "second_animation"]


@pytest.mark.parametrize("version", STATES)
def test_only_the_selected_animation_flag_changes(version):
    original = (FIXTURES / (version + ".spine")).read_bytes()
    before = zlib.decompress(original, -15)
    first, second = STATES[version]["active_offsets"]
    assert before[first] == before[second] == 0
    candidate = selection_candidate(original, NAMES)
    expected = bytearray(before)
    expected[first] = 1
    assert zlib.decompress(candidate, -15) == expected
    # Switching an existing selection clears the previous flag, without touching keys.
    switched = selection_candidate(candidate, NAMES[::-1])
    expected[first], expected[second] = 0, 1
    assert zlib.decompress(switched, -15) == expected
    assert selection_candidate(switched, NAMES[::-1]) == switched


@pytest.mark.parametrize("names", [[], ["missing"], NAMES + ["missing"], ["first_animation"] * 2])
def test_unknown_or_ambiguous_records_are_rejected(names):
    with pytest.raises(UnsupportedProject):
        selection_candidate((FIXTURES / "4.2.43.spine").read_bytes(), names)


def test_corrupt_and_newer_formats_are_rejected():
    with pytest.raises(UnsupportedProject):
        selection_candidate(b"not-a-project", NAMES)
    original = (FIXTURES / "4.2.43.spine").read_bytes()
    with pytest.raises(UnsupportedProject):
        selection_candidate(original + b"unexpected", NAMES)
    body = zlib.decompress(original, -15).replace(b"4.2.4\xb3", b"4.3.4\xb3")
    compressor = zlib.compressobj(wbits=-15)
    with pytest.raises(UnsupportedProject):
        selection_candidate(compressor.compress(body) + compressor.flush(), NAMES)


@pytest.mark.parametrize("outcome", ["valid", "changed", "unreadable", "concurrent_edit"])
async def test_official_roundtrip_guards_project_replacement(tmp_path, outcome):
    original = (FIXTURES / "4.2.43.spine").read_bytes()
    project = tmp_path / "hero.spine"
    project.write_bytes(original)

    async def runner(args, cwd, options):
        if outcome == "unreadable":
            raise RuntimeError("CLI could not read project")
        for index, at in enumerate(i for i, value in enumerate(args) if value == "-o"):
            folder = Path(args[at + 1])
            folder.mkdir(parents=True)
            value = {"skeleton": {"spine": "4.2.43", "images": str(folder)},
                     "bones": [{"name": "root"}], "animations": {name: {} for name in NAMES}}
            if outcome == "changed" and index == 1:
                value["bones"][0]["rotation"] = 90
            (folder / "hero.json").write_text(json.dumps(value), "utf-8")
        if outcome == "concurrent_edit":
            project.write_bytes(b"user-edited-project")
        return "Export complete"

    info = await select_animation(project, NAMES, ["spine", "-u", "4.2.43"], Options(), runner, [])
    if outcome == "valid":
        assert info == {"default_animation": NAMES[0]}
        assert project.read_bytes() == selection_candidate(original, NAMES)
    else:
        assert "selection_warning" in info
        assert project.read_bytes() == (b"user-edited-project" if outcome == "concurrent_edit" else original)
    assert not list(tmp_path.glob(".spine-selection-*"))


@pytest.mark.parametrize('names, expected', [(['in', 'idle', 'prefixLOOPsuffix', 'loop2'], 'prefixLOOPsuffix'), (['idle', 'out'], 'idle')])
async def test_export_prefers_loop_substring_before_writing_selection(tmp_path, monkeypatch, names, expected):
    project = tmp_path / 'project.spine'
    project.write_bytes(b'original')
    selected = []

    def candidate(original, ordered):
        selected.append(ordered)
        return original

    monkeypatch.setattr('spine_extractor.spine_cli.selection_candidate', candidate)

    async def runner(args, cwd, options):
        for i, arg in enumerate(args):
            if arg == '-o':
                dest = Path(args[i + 1])
                dest.mkdir(parents=True)
                (dest / 'skeleton.json').write_text(json.dumps({'bones': [{'name': 'root'}]}), 'utf-8')
        return ''

    info = await select_animation(project, names, ['spine'], Options(), runner, [])
    assert info['default_animation'] == expected
    assert selected[0][0] == expected and set(selected[0]) == set(names)

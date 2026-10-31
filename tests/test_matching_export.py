
from PIL import Image

from spine_extractor.atlas import parse_atlas, unpack_atlas
from spine_extractor.export import render_report, select_image
from spine_extractor.discovery import Scanner
from spine_extractor.matching import pair_assets
from spine_extractor.models import Asset, Options, Resource
from spine_extractor.network import Fetcher


def test_match_by_regions_independent_of_bundle_order(skeleton, atlas):
    a = Asset("atlas", atlas.encode(), "https://site.test/first.js")
    b = Asset("json", b"{}", "https://site.test/other.js", value=skeleton)
    assert pair_assets([b], [a])[0].atlas is a


def test_repeated_region_names_match_by_dimensions(skeleton, atlas):
    a = Asset("atlas", atlas.encode(), "x")
    b = Asset("atlas", atlas.replace("2, 3", "3, 2").encode(), "y")
    s = Asset("json", b"{}", "z", value=skeleton)
    assert pair_assets([s], [b, a])[0].atlas is a
    # If both names and sizes are identical, refuse to guess by source ordering.
    b.data = atlas.replace("hero.png", "other.png").encode()
    assert pair_assets([s], [b, a])[0].confidence == "ambiguous"


def test_wrong_filename_cannot_override_region_mismatch(skeleton, atlas):
    a = Asset("atlas", atlas.replace("body", "wrong").encode(), "x", "hero.atlas")
    s = Asset("json", b"{}", "y", "hero.json", skeleton)
    assert pair_assets([s], [a])[0].atlas is None


def test_binary_match_by_name(atlas):
    a = Asset("atlas", atlas.encode(), "x", "hero.atlas")
    s = Asset("skel", b"binary", "y", "hero.skel")
    assert pair_assets([s], [a])[0].confidence == "name"


def test_rotated_crop_restores_original_pixels_and_offsets(tmp_path):
    original = Image.new("RGBA", (2, 3))
    original.putdata([(255, 0, 0, 255), (0, 255, 0, 255), (0, 0, 255, 255), (1, 2, 3, 255), (4, 5, 6, 255), (7, 8, 9, 255)])
    packed = Image.new("RGBA", (8, 8))
    packed.paste(original.rotate(90, expand=True), (1, 2))
    packed.save(tmp_path / "hero.png")
    text = "hero.png\nsize: 8,8\nfilter: Linear,Linear\nbody\nbounds: 1,2,2,3\nrotate: 90\noffsets: 1,1,4,5\n"
    count, errors = unpack_atlas(parse_atlas(text), tmp_path)
    assert count == 1 and not errors
    with Image.open(tmp_path / "regions/body.png") as result:
        assert result.size == (4, 5)
        assert result.crop((1, 1, 3, 4)).tobytes() == original.tobytes()
        assert result.getpixel((0, 0))[3] == 0


def test_region_traversal_does_not_write_outside_output(tmp_path, png, atlas):
    (tmp_path / "hero.png").write_bytes(png)
    count, errors = unpack_atlas(parse_atlas(atlas.replace("body\n", "../../escape\n")), tmp_path)
    assert not count and errors
    assert not (tmp_path.parent / "escape.png").exists()


async def test_image_validation_and_ambiguity(png, atlas):
    scanner = Scanner("https://site.test/")
    a = Asset("atlas", atlas.encode(), "https://site.test/hero.atlas")
    page = parse_atlas(atlas)[0]
    async with Fetcher(Options()) as fetcher:
        fetcher.remember(Resource("https://cdn.test/hero.png", b"<html>error</html>"))
        assert select_image(scanner, fetcher, a, page, ["https://cdn.test/hero.png"])[0] is None
        fetcher.resources["https://cdn.test/hero.png"] = Resource("https://cdn.test/hero.png", png)
        assert select_image(scanner, fetcher, a, page, ["https://cdn.test/hero.png"])[0] == png


def test_report_escapes_site_and_resource_names():
    report = render_report({"title": '<script>alert(1)</script>', "skeleton_count": 0, "atlas_count": 0,
                            "complete_count": 0, "page_url": "https://example.com/", "groups": [],
                            "warnings": [], "scope": "test"})
    assert "<script>" not in report
    assert "&lt;script&gt;" in report

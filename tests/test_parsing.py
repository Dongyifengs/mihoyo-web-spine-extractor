import base64
import json

import pytest

from spine_extractor.atlas import parse_atlas
from spine_extractor.discovery import Scanner, binary_version
from spine_extractor.javascript import scan_javascript, unquote_js
from spine_extractor.models import Resource
from spine_extractor.resolve import activity_links, parse_feed
from spine_extractor.urls import event_link, http_url, normalized_name, safe_name, safe_relative


def test_legacy_embedded_json_and_single_quote_atlas(skeleton, atlas):
    text = "a.exports=" + json.dumps(atlas) + ";x.exports=JSON.parse(" + json.dumps(json.dumps(skeleton, ensure_ascii=False)) + ")"
    s = Scanner("https://site.test/event/")
    s.scan(Resource("https://site.test/event/vendor.aa.js", text.encode()))
    assert len(s.skeletons) == len(s.atlases) == 1
    assert s.skeletons[0].value == skeleton


def test_modern_object_literals_unicode_and_minified_booleans():
    text = '''export const a={"../hero.json":{skeleton:{spine:"4.2.43"},bones:[{name:"根骨",x:-1.25}],slots:[],skins:[],extra:!0}};const f=()=>42;'''
    s = Scanner("https://site.test/")
    s.scan(Resource("https://site.test/app.js", text.encode()))
    assert s.skeletons[0].name == "hero.json"
    assert s.skeletons[0].value["bones"][0] == {"name": "根骨", "x": -1.25}
    assert s.skeletons[0].value["extra"] is True
    assert not s.refs  # Virtual source paths must not be requested.


def test_modern_lazy_chunk_filename_map():
    parsed = scan_javascript('r.p="https://cdn.test/v2/";r.u=e=>"chunks/"+e+"."+{12:"abcdef",48:"fedcba"}[e]+".js";')
    assert parsed.chunks == ["chunks/12.abcdef.js", "chunks/48.fedcba.js"]
    assert parsed.public_paths == ["https://cdn.test/v2/"]


def test_template_literal_and_do_not_eval(atlas):
    text = "const t=`" + atlas + "`; const side=process.exit(9);"
    parsed = scan_javascript(text)
    assert parsed.strings[0][0] == atlas
    assert unquote_js(r"'中文\n\x41\u4e2d\u{1f600}'") == "中文\nA中😀"


def test_raw_json_preserved(skeleton):
    data = json.dumps(skeleton, indent=4).encode()
    s = Scanner("https://site.test/")
    s.scan(Resource("https://site.test/hero.json?token=x", data, "application/json"))
    assert s.skeletons[0].data == data


def test_binary_and_data_uri(png):
    s = Scanner("https://site.test/")
    data = b"12345678\x074.2.43\x00rest"
    s.scan(Resource("https://site.test/hero.skel?v=1", data, "application/octet-stream"))
    s.string("data:image/png;base64," + base64.b64encode(png).decode(), "https://site.test/app.js")
    assert s.skeletons[0].data == data
    assert len(s.assets) == 2


def test_binary_header_and_octet_stream_json(skeleton):
    assert binary_version(b"\x05hash\x073.8.99\x00rest") == "3.8.99"
    assert binary_version(b'var x="4.2.43";') == ""
    scanner = Scanner("https://site.test/")
    scanner.scan(Resource("https://site.test/hero.json", json.dumps(skeleton).encode(), "application/octet-stream"))
    assert scanner.skeletons[0].kind == "json"


def test_atlas_multiple_pages_and_legacy_regions(atlas):
    text = atlas + "\nsecond.webp\nsize: 8, 8\nfilter: Linear, Linear\nface\n  rotate: true\n  xy: 0, 1\n  size: 2, 3\n  orig: 4, 5\n  offset: 1, 1\n  index: -1\n"
    pages = parse_atlas(text)
    assert [p.name for p in pages] == ["hero.png", "second.webp"]
    assert pages[1].regions[0].name == "face"
    assert not parse_atlas("hello.png\nthis is not an atlas\n")


def test_rss_atom_json_feed():
    event = "https://act.mihoyo.com/ys/event/e2026/index.html?a=1&amp;b=2"
    rss = f'<rss><channel><item><title>活动</title><link>https://ys.mihoyo.com/news/1</link><description><![CDATA[<a href="{event}">&gt;&gt;点击参与活动&lt;&lt;</a>]]></description></item></channel></rss>'
    targets = parse_feed(rss.encode(), "https://feed.test/")
    assert targets[0].url.endswith("?a=1&b=2")
    assert targets[0].title == "活动"
    atom = '<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>测试</title><link href="https://ys.mihoyo.com/news/2" /></entry></feed>'
    assert parse_feed(atom.encode(), "https://feed.test/")[0].url.endswith("/2")
    feed = {"items": [{"title": "活动", "url": "https://ys.mihoyo.com/news/1", "content_html": f'<a href="{event}">参与活动</a>'}]}
    assert parse_feed(json.dumps(feed).encode(), "https://feed.test/")[0].title == "活动"


def test_activity_resolver_ignores_sdk_scripts():
    sdk = "https://act.mihoyo.com/common/event/libs/apm/sdk-cn.js"
    assert not event_link(sdk)
    assert activity_links(f'<script src="{sdk}"></script>', "https://ys.mihoyo.com/news/1") == []


def test_article_participation_link_wins_over_navigation():
    page = '<a href="https://act.mihoyo.com/ys/event/nav/index.html">社区</a>'
    page += '<a href="https://act.mihoyo.com/ys/event/target/index.html">&gt;&gt;点击参与活动&lt;&lt;</a>'
    assert activity_links(page, "https://ys.mihoyo.com/news/1") == ["https://act.mihoyo.com/ys/event/target/index.html"]


@pytest.mark.parametrize("path", ["../evil.png", "/abs.png", "C:/file.png", "a/../../file", "a:stream", "CON.png", "a\\..\\x", "a//b"])
def test_unsafe_paths_rejected(path):
    with pytest.raises(ValueError):
        safe_relative(path)


def test_urls_and_names():
    assert http_url("//cdn.test/a.png?x=1&amp;y=2", "https://site.test/") == "https://cdn.test/a.png?x=1&y=2"
    assert http_url("file:///secret") is None
    assert http_url("javascript:alert(1)") is None
    assert normalized_name("hero.1234abcd..png") == "hero"
    assert normalized_name("hero-Dd_72mAx.png") == "hero"
    assert normalized_name("hero-standing.png") == "hero-standing"
    assert safe_name("A:B/活动") == "A_B_活动"

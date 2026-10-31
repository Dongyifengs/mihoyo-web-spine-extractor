import html
import json


def render_report(manifest: dict) -> str:
    title = html.escape(manifest.get("title") or "Spine 素材报告")
    data = json.dumps(manifest, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Spine 素材报告</title><link rel="stylesheet" href="/static/app.css"></head>
<body class="report-body"><header class="report-header"><a href="/" class="brand">SPINE / 素材工作台</a><h1>{title}</h1>
<p>{manifest['skeleton_count']} 份骨骼 · {manifest['atlas_count']} 份图集 · {manifest['complete_count']} 组齐全</p></header>
<main id="report-gallery"></main><p id="local-notice">请在本地网页服务中打开报告，以加载动画预览和工程操作。</p>
<script id="report-data" type="application/json">{data}</script>
<script type="module">
import {{Gallery}} from '/static/gallery.js';
if(location.protocol==='http:'){{
 document.getElementById('local-notice').remove();
 const id=location.pathname.split('/')[2];
 const data=await (await fetch('/api/activities/'+id)).json();
 new Gallery(document.getElementById('report-gallery'),data);
}}
</script></body></html>'''

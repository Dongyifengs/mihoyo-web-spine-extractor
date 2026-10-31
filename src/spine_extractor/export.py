import asyncio
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urljoin, urlsplit

from PIL import Image

from .atlas import numbers, parse_atlas, unpack_atlas
from .discovery import Scanner, binary_version
from .matching import attachments, pair_assets
from .network import Fetcher
from .urls import basename, digest, normalized_name, safe_name, safe_relative, unique_directory
from .report import render_report
from .spine_cli import convert_group


def image_info(data: bytes) -> tuple[int, int] | None:
    try:
        with Image.open(io.BytesIO(data)) as image:
            size = image.size
            image.verify()
            return size
    except (OSError, ValueError, Image.DecompressionBombError):
        return None


def image_candidates(scanner: Scanner, atlas, page) -> list[str]:
    name = normalized_name(page.name)
    candidates = sorted(url for url in scanner.images if normalized_name(url) == name)
    if not candidates:
        candidates = [urljoin(atlas.source.split("#", 1)[0], page.name)]
    return candidates


def select_image(scanner: Scanner, fetcher: Fetcher, atlas, page, candidates: list[str]):
    expected = numbers(page.props, "size")
    possible = []
    for url in candidates:
        resource = fetcher.resources.get(url)
        if resource:
            size = image_info(resource.body)
            if size and (not expected or expected == (0, 0) or size == expected):
                score = 2 if basename(url) == basename(page.name) else 0
                if urlsplit(url).path.rsplit("/", 1)[0] == urlsplit(atlas.source).path.rsplit("/", 1)[0]:
                    score += 1
                possible.append((score, resource.body, url))
    for asset in scanner.assets.values():
        if asset.kind == "image":
            named = normalized_name(asset.name) == normalized_name(page.name)
            size = image_info(asset.data)
            if size and (named or (expected and size == expected)):
                possible.append((2 if named else -1, asset.data, asset.source))
    # OSS can serve a lossy WebP copy under the same PNG path. Prefer the valid
    # unprocessed original for that exact resource; other query selectors stay distinct.
    def variant(url):
        parts = urlsplit(url)
        query = parse_qsl(parts.query, keep_blank_values=True)
        return ((parts.scheme, parts.netloc, parts.path, tuple(sorted((k, v) for k, v in query if k != 'x-oss-process'))),
                any(k == 'x-oss-process' for k, _ in query))

    originals = {variant(url)[0] for _, _, url in possible if not variant(url)[1]}
    possible = [item for item in possible if not variant(item[2])[1] or variant(item[2])[0] not in originals]
    possible.sort(key=lambda item: (-item[0], item[2]))
    if not possible:
        return None, None, "未找到可用贴图（可能未加载、下载失败或尺寸不符）"
    top = [item for item in possible if item[0] == possible[0][0]]
    if len({digest(item[1], 64) for item in top}) > 1:
        return None, None, "发现多个内容不同的同名/同尺寸贴图，无法确定配对"
    return possible[0][1], possible[0][2], None


def write_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


async def export(scanner: Scanner, fetcher: Fetcher, folder: Path, metadata: dict) -> dict:
    folder.mkdir(parents=True, exist_ok=True)
    matches = pair_assets(scanner.skeletons, scanner.atlases)
    candidates = {}
    for atlas in scanner.atlases:
        for page in parse_atlas(atlas.data.decode("utf-8")):
            candidates[(digest(atlas.data), page.name)] = image_candidates(scanner, atlas, page)
    urls = sorted({url for items in candidates.values() for url in items})
    fetcher.log(f"发现 {len(scanner.skeletons)} 份骨骼、{len(scanner.atlases)} 份图集，下载 {len(urls)} 个候选贴图")
    for start in range(0, len(urls), fetcher.options.concurrency):
        fetcher.options.check()
        await asyncio.gather(*(fetcher.get(u, scanner.page_url) for u in urls[start:start + fetcher.options.concurrency]))
    groups = []
    used_atlases = set()
    pairs = [(m.skeleton, m.atlas, m.confidence, m.reason) for m in matches]
    for match in matches:
        if match.atlas:
            used_atlases.add(digest(match.atlas.data, 64))
    pairs.extend((None, a, "unmatched", "未找到相符骨骼") for a in scanner.atlases if digest(a.data, 64) not in used_atlases)
    for skeleton, atlas, confidence, reason in pairs:
        fetcher.options.check()
        pages = parse_atlas(atlas.data.decode("utf-8")) if atlas else []
        name = normalized_name(skeleton.name if skeleton and skeleton.name else atlas.name if atlas and atlas.name else pages[0].name if pages else "skeleton")
        category = "spine" if skeleton and atlas else "unpaired"
        dest = unique_directory(folder / category, name)
        name = dest.name
        relative = dest.relative_to(folder)
        warnings, files, textures = [], [], []
        missing_regions = []
        version = ""
        if skeleton:
            path = dest / f"skeleton.{skeleton.kind}"
            path.write_bytes(skeleton.data)
            files.append(path.name)
            version = skeleton.value.get("skeleton", {}).get("spine", "") if skeleton.value else binary_version(skeleton.data)
            if atlas and skeleton.value:
                missing_regions = sorted(attachments(skeleton.value) - {r.name for p in pages for r in p.regions})
                if missing_regions:
                    warnings.append(f"图集缺少 {len(missing_regions)} 个骨骼附件区域")
        if atlas:
            (dest / "skeleton.atlas").write_bytes(atlas.data)
            files.append("skeleton.atlas")
            written_paths = {"skeleton.atlas", "skeleton.json", "skeleton.skel", "metadata.json", "import.json"}
            for page in pages:
                row = {"name": page.name, "source": None, "sha256": None, "status": "missing"}
                try:
                    local = safe_relative(page.name)
                    if str(local).casefold() in written_paths or local.parts[0].casefold() == "regions":
                        raise ValueError("图集页面文件名与输出文件冲突")
                    data, source, warning = select_image(scanner, fetcher, atlas, page, candidates[(digest(atlas.data), page.name)])
                    if warning:
                        warnings.append(f"{page.name}: {warning}")
                    else:
                        path = dest / local
                        path.parent.mkdir(parents=True, exist_ok=True)
                        path.write_bytes(data)
                        written_paths.add(str(local).casefold())
                        row.update(source=source, sha256=digest(data, 64), status="downloaded")
                        files.append(local.as_posix())
                except (ValueError, OSError) as exc:
                    warnings.append(str(exc))
                textures.append(row)
        crop_count = 0
        if atlas and (fetcher.options.unpack or fetcher.options.spine_cli):
            crop_count, crop_warnings = await asyncio.to_thread(unpack_atlas, pages, dest)
            warnings.extend(crop_warnings)
            if skeleton and skeleton.value and crop_count and not crop_warnings:
                # A convenience copy for the editor; original skeleton remains untouched.
                editable = json.loads(skeleton.data)
                editable.setdefault("skeleton", {})["images"] = "./regions/"
                write_json(dest / "import.json", editable)
                files.append("import.json")
        complete = bool(skeleton and atlas and textures and all(t["status"] == "downloaded" for t in textures) and not missing_regions)
        group = {
            "name": name, "directory": relative.as_posix(), "status": "complete" if complete else "partial",
            "version": version, "pairing": confidence, "pairing_reason": reason,
            "skeleton_sources": skeleton.sources if skeleton else [],
            "atlas_sources": atlas.sources if atlas else [],
            "skeleton_sha256": digest(skeleton.data, 64) if skeleton else None,
            "atlas_sha256": digest(atlas.data, 64) if atlas else None,
            "files": files, "textures": textures, "region_images": crop_count,
            "missing_regions": missing_regions, "warnings": warnings,
            "animations": list(skeleton.value.get("animations", {})) if skeleton and skeleton.value else [],
            "has_extra": "extra" in skeleton.value if skeleton and skeleton.value else False,
            "skins": (list(skeleton.value.get("skins", {})) if isinstance(skeleton.value.get("skins", {}), dict)
                      else [s.get("name", "default") for s in skeleton.value.get("skins", [])]) if skeleton and skeleton.value else [],
            "premultiplied_alpha": any(p.props.get("pma", "false").lower() == "true" for p in pages),
            "bounds": {key: val for key, val in (skeleton.value.get("skeleton", {}) if skeleton and skeleton.value else {}).items()
                       if key in {"x", "y", "width", "height"}},
        }
        if fetcher.options.spine_cli and complete:
            group["spine_project"] = await convert_group(dest.resolve(), group, fetcher.options, fetcher.log)
            if group["spine_project"]["status"] == "success":
                files.append(group["spine_project"]["project"])
                group["region_images"] = len(list((dest / "regions").rglob("*.png")))
        write_json(dest / "metadata.json", group)
        groups.append(group)
        fetcher.log(f"{'完整' if complete else '待补齐'} · {name} · Spine {version or '未知'} · {len(textures)} 张贴图")
    # Preserve embedded images that could be useful when an atlas has opaque names.
    embedded = []
    for asset in scanner.assets.values():
        if asset.kind == "image" and image_info(asset.data):
            path = folder / "embedded-images" / (digest(asset.data) + "-" + safe_name(asset.name))
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(asset.data)
            embedded.append({"file": path.relative_to(folder).as_posix(), "source": asset.source})
    manifest = {
        "schema_version": 2, "created_at": datetime.now(timezone.utc).isoformat(),
        **metadata, "page_url": scanner.page_url, "title": scanner.title or metadata.get("title", ""),
        "skeleton_count": len(scanner.skeletons), "atlas_count": len(scanner.atlases),
        "complete_count": sum(g["status"] == "complete" for g in groups),
        "groups": groups, "embedded_images": embedded,
        "warnings": scanner.warnings,
        "request_failures": [{"url": u, "error": e} for u, e in sorted(fetcher.failures.items())],
        "scanned_resources": sorted(scanner.scanned),
        "scope": "已发现的公开静态资源和本次浏览器会话加载的资源；未触发的远端分支不保证可见。",
    }
    write_json(folder / "manifest.json", manifest)
    (folder / "report.html").write_text(render_report(manifest), encoding="utf-8")
    return manifest

from dataclasses import dataclass

from .atlas import numbers, parse_atlas
from .models import Asset
from .urls import normalized_name


def attachment_records(value: dict) -> list[tuple[str, dict]]:
    result = []
    skins = value.get("skins", {})
    skins = skins.values() if isinstance(skins, dict) else [s.get("attachments", {}) for s in skins if isinstance(s, dict)]
    for skin in skins:
        if not isinstance(skin, dict):
            continue
        for slot in skin.values():
            if not isinstance(slot, dict):
                continue
            for key, item in slot.items():
                if not isinstance(item, dict) or item.get("type", "region") not in {"region", "mesh", "linkedmesh", "weightedmesh", "skinnedmesh"}:
                    continue
                name = item.get("path", item.get("name", key))
                sequence = item.get("sequence")
                if isinstance(sequence, dict):
                    start, count, digits = sequence.get("start", 1), sequence.get("count", 0), sequence.get("digits", 0)
                    if isinstance(count, int) and 0 < count < 10000:
                        result.extend((name + str(i).zfill(digits), item) for i in range(start, start + count))
                else:
                    result.append((name, item))
    return result


def attachments(value: dict) -> set[str]:
    return {name for name, _ in attachment_records(value)}


def region_sizes(pages) -> dict:
    sizes = {}
    for page in pages:
        for region in page.regions:
            offsets = numbers(region.props, "offsets")
            size = numbers(region.props, "orig") or (offsets[2:] if offsets else ())
            size = size or numbers(region.props, "size") or numbers(region.props, "bounds")[2:]
            sizes[region.name] = size
    return sizes


@dataclass
class Match:
    skeleton: Asset
    atlas: Asset | None
    confidence: str
    reason: str


def pair_assets(skeletons: list[Asset], atlases: list[Asset]) -> list[Match]:
    result = []
    index = []
    for atlas in atlases:
        pages = parse_atlas(atlas.data.decode("utf-8"))
        index.append((atlas, {normalized_name(atlas.name)} | {normalized_name(p.name) for p in pages},
                      {r.name for p in pages for r in p.regions}, region_sizes(pages)))
    for skeleton in skeletons:
        paths = attachments(skeleton.value) if skeleton.value else set()
        dimensions_records = [(name, (item.get("width"), item.get("height")))
                              for name, item in attachment_records(skeleton.value or {})
                              if item.get("width") and item.get("height")]
        skeleton_name = normalized_name(skeleton.name)
        ranked = []
        for atlas, names, regions, sizes in index:
            common = paths & regions
            coverage = len(common) / len(paths) if paths else 0
            precision = len(common) / len(regions) if regions else 0
            named = bool(skeleton_name and skeleton_name in names)
            # A matching filename cannot override contradictory attachment contents.
            if paths and coverage < 0.5:
                continue
            if not named and coverage < 0.7:
                continue
            dimensions = (sum(size == sizes.get(name) for name, size in dimensions_records) / len(dimensions_records)
                          if dimensions_records else 0)
            score = (100 if named else 0) + coverage * 80 + precision * 10 + dimensions * 20
            ranked.append((score, atlas, coverage, named, dimensions))
        ranked.sort(key=lambda item: item[0], reverse=True)
        if not ranked:
            result.append(Match(skeleton, None, "unmatched", "未找到相符图集"))
        elif len(ranked) > 1 and ranked[0][0] - ranked[1][0] < 2:
            result.append(Match(skeleton, None, "ambiguous", "多个图集同样匹配，保留原始文件供核对"))
        else:
            _, atlas, coverage, named, dimensions = ranked[0]
            confidence = "name+regions" if named and paths else "name" if named else "regions+dimensions" if dimensions else "regions"
            result.append(Match(skeleton, atlas, confidence,
                                f"附件区域覆盖率 {coverage:.0%}，尺寸相符率 {dimensions:.0%}" if paths else "骨骼与图集文件名相同"))
    return result

"""Atlas parsing and lossless region crops for Spine's legacy and current formats."""

from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image

from .urls import safe_relative


@dataclass
class Region:
    name: str
    props: dict[str, str] = field(default_factory=dict)


@dataclass
class Page:
    name: str
    props: dict[str, str] = field(default_factory=dict)
    regions: list[Region] = field(default_factory=list)


def parse_atlas(text: str) -> list[Page]:
    if "\n" not in text or len(text) > 8_000_000:
        return []
    pages: list[Page] = []
    target = None
    next_page = True
    for raw in text.strip().splitlines():
        line = raw.strip()
        if not line:
            next_page = True
            continue
        if ":" in line:
            if target is None:
                return []
            key, value = line.split(":", 1)
            target.props[key.strip()] = value.strip()
        elif next_page:
            page = Page(line)
            pages.append(page)
            target = page
            next_page = False
        else:
            if not pages:
                return []
            target = Region(line)
            pages[-1].regions.append(target)
    # Do not mistake arbitrary multi-line JS strings or CSS for atlases.
    if not pages or any(not p.regions or not ({"size", "filter", "format"} & p.props.keys()) for p in pages):
        return []
    if any(not ({"bounds", "xy"} & r.props.keys()) for p in pages for r in p.regions):
        return []
    return pages


def numbers(props: dict, key: str, default: tuple = ()) -> tuple[int, ...]:
    return tuple(int(float(v.strip())) for v in props[key].split(",")) if key in props else default


def unpack_atlas(pages: list[Page], folder: Path) -> tuple[int, list[str]]:
    count, warnings = 0, []
    written: set[str] = set()
    for page in pages:
        try:
            path = folder / safe_relative(page.name)
            with Image.open(path) as raw_image:
                image = raw_image.convert("RGBA")
        except (OSError, ValueError) as exc:
            warnings.append(f"无法拆分贴图 {page.name}: {exc}")
            continue
        for region in page.regions:
            try:
                bounds = numbers(region.props, "bounds")
                if bounds:
                    x, y, w, h = bounds
                else:
                    x, y = numbers(region.props, "xy")
                    w, h = numbers(region.props, "size")
                rotation = region.props.get("rotate", "false").lower()
                angle = 90 if rotation == "true" else 0 if rotation == "false" else int(rotation)
                if angle not in {0, 90, 180, 270}:
                    raise ValueError(f"不支持旋转角度 {angle}")
                pw, ph = (h, w) if angle in {90, 270} else (w, h)
                if min(x, y) < 0 or min(w, h) <= 0 or x + pw > image.width or y + ph > image.height:
                    raise ValueError("区域超出贴图范围")
                crop = image.crop((x, y, x + pw, y + ph))
                if angle:
                    crop = crop.rotate(-angle, expand=True)
                offsets = numbers(region.props, "offsets")
                if offsets:
                    ox, oy, ow, oh = offsets
                else:
                    ox, oy = numbers(region.props, "offset", (0, 0))
                    ow, oh = numbers(region.props, "orig", (w, h))
                if max(ow, oh) > 16384 or ow * oh > 40_000_000 or min(ow, oh) <= 0:
                    raise ValueError("原图尺寸超出限制")
                if ox < 0 or oy < 0 or ox + w > ow or oy + h > oh:
                    raise ValueError("裁剪偏移超出原图")
                canvas = Image.new("RGBA", (ow, oh))
                canvas.paste(crop, (ox, oh - oy - h))
                index = region.props.get("index", "-1")
                name = region.name + (f"_{index}" if index != "-1" else "") + ".png"
                relative = safe_relative(name)
                if str(relative).casefold() in written:
                    raise ValueError("同名区域冲突，未覆盖已有图片")
                out = folder / "regions" / relative
                out.parent.mkdir(parents=True, exist_ok=True)
                canvas.save(out)
                written.add(str(relative).casefold())
                count += 1
            except (ValueError, OSError, TypeError) as exc:
                warnings.append(f"区域 {region.name}: {exc}")
    return count, warnings

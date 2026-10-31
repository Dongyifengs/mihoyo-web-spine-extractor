"""Narrow editor-state patch for fresh CLI imports, never a general .spine writer.

Spine 3.8–4.2 uses raw DEFLATE and version-specific Kryo field layouts. The
layouts below were checked against independent projects saved in the editor.
Only the animation's active boolean is changed. Every expected animation must
match exactly once; ambiguous/unknown layouts are rejected. The caller must
also round-trip both files through the official CLI before replacing a project.
"""

import re
import zlib


class UnsupportedProject(ValueError):
    pass


def kryo_string(value: str) -> bytes:
    """Kryo's short ASCII / UTF-16-length-prefixed CESU-8 string representation."""
    if value.isascii() and 1 < len(value) < 64:
        raw = value.encode("ascii")
        return raw[:-1] + bytes([raw[-1] | 0x80])
    utf16 = value.encode("utf-16-le", errors="surrogatepass")
    units = [int.from_bytes(utf16[i:i + 2], "little") for i in range(0, len(utf16), 2)]
    count = len(units) + 1
    length = bytearray([(count & 0x3f) | 0x80 | (0x40 if count >= 64 else 0)])
    count >>= 6
    while count:
        length.append((count & 0x7f) | (0x80 if count >= 128 else 0))
        count >>= 7
    return bytes(length) + b"".join(chr(unit).encode("utf-8", errors="surrogatepass") for unit in units)


def _unique(body: bytes, pattern: bytes) -> re.Match:
    matches = list(re.finditer(pattern, body))
    if len(matches) != 1:
        raise UnsupportedProject("动画记录不唯一或使用了未适配的编辑器字段")
    return matches[0]


def selection_candidate(project: bytes, names: list[str]) -> bytes:
    if not names or len(set(names)) != len(names):
        raise UnsupportedProject("没有可选择的动画，或动画名称重复")
    inflater = zlib.decompressobj(-15)
    try:
        body = inflater.decompress(project, 64 * 1024 * 1024 + 1)
    except zlib.error as exc:
        raise UnsupportedProject("无法识别工程压缩格式") from exc
    if len(body) > 64 * 1024 * 1024 or not inflater.eof or inflater.unused_data:
        raise UnsupportedProject("工程过大或压缩数据不完整")
    # Numeric serialization IDs and the editor version are both checked.
    version = re.match(rb"([\x12\x21\x27\x34])\xb0 \xb0 ([34]\.[0182]\.\d*[\xb0-\xb9])", body)
    if not version:
        raise UnsupportedProject("该工程版本尚未适配默认动画选择")
    series = version[2][:3].decode("ascii")
    if version[1] != {"3.8": b"\x12", "4.0": b"\x21", "4.1": b"\x27", "4.2": b"\x34"}.get(series):
        raise UnsupportedProject("该编辑器使用了不同的工程结构")
    flags = {}
    if series == "4.1":
        for name in names:
            pattern = rb"\x06\x01\x00\x05\x05\x01\x03([\x00\x01])\x01\x01"
            match = _unique(body, pattern + re.escape(kryo_string(name)) + rb"\x09\x00")
            flags[name] = match.start(1)
    elif series in {"3.8", "4.0", "4.2"}:
        events = []
        if series == "4.0":
            for match in re.finditer(rb"\x12\x01\x08\x03([\x00\x01])\x07\x6c", body):
                events.append((match.start(), "start", match.start(1)))
            for name in names:
                match = _unique(body, rb"\x05\x01\x01\x01" + re.escape(kryo_string(name)) + rb"\x02\x0f")
                events.append((match.start(), "name", name))
        else:
            start = (rb"\x12\x01\x07\x00\x04\x01\x01" if series == "3.8"
                     else rb"\x12\x01\x09\x05\x01\x00\x03\x01\x01")
            after_name = rb"\x02\x0f" if series == "3.8" else rb"\x06\x01"
            end = (rb"\x04\x01\x03([\x00\x01])\x05\x01\x06\x01\x07\x6c" if series == "3.8"
                   else rb"\x09\x00\x03([\x00\x01])\x08\x74\x01\x00")
            for name in names:
                match = _unique(body, start + re.escape(kryo_string(name)) + after_name)
                events.append((match.start(), "start", name))
            for match in re.finditer(end, body):
                events.append((match.start(), "end", match.start(1)))
        if len(events) != 2 * len(names):
            raise UnsupportedProject("动画记录数量不匹配")
        # Parent folders can recursively serialize siblings before finishing the
        # first animation. Pair the actual records, not the first/last byte match.
        stack = []
        for _, kind, value in sorted(events):
            if kind == "start":
                stack.append(value)
            elif not stack:
                raise UnsupportedProject("动画记录顺序不匹配")
            elif kind == "name":
                flags[value] = stack.pop()
            else:
                flags[stack.pop()] = value
        if stack:
            raise UnsupportedProject("动画记录未结束")
    else:
        raise UnsupportedProject("该工程版本尚未适配默认动画选择")
    if set(flags) != set(names) or len(set(flags.values())) != len(names):
        raise UnsupportedProject("动画记录不完整")
    changed = bytearray(body)
    for name, offset in flags.items():
        changed[offset] = int(name == names[0])
    compressor = zlib.compressobj(wbits=-15)
    return compressor.compress(changed) + compressor.flush()

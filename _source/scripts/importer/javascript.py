"""Read JavaScript syntax, never eval it. Names/whitespace/minifier choices are irrelevant."""

from bisect import bisect_right
import json
import re
from dataclasses import dataclass, field

import tree_sitter_javascript
from tree_sitter import Language, Parser

LANGUAGE = Language(tree_sitter_javascript.language())


def unquote_js(raw: str) -> str:
    if raw.startswith('"'):
        try:
            return json.loads(raw)
        except (ValueError, TypeError):
            pass
    value = raw[1:-1]
    escapes = {"n": "\n", "r": "\r", "t": "\t", "b": "\b", "f": "\f", "v": "\v", "0": "\0"}

    def replace(match):
        esc = match.group(1)
        if esc.startswith("u{"):
            return chr(int(esc[2:-1], 16))
        if esc.startswith(("u", "x")) and len(esc) > 1:
            return chr(int(esc[1:], 16))
        if esc in {"\n", "\r", "\r\n"}:
            return ""
        return escapes.get(esc, esc)

    value = re.sub(r"\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\r\n|[\s\S])", replace, value)
    # Combine escaped surrogate pairs without corrupting literal non-ASCII text.
    return value.encode("utf-16-le", errors="surrogatepass").decode("utf-16-le", errors="replace")


def raw(node, source: bytes) -> str:
    return source[node.start_byte:node.end_byte].decode("utf-8", errors="replace")


def key_name(node, source: bytes) -> str:
    if node is None:
        return ""
    text = raw(node, source)
    return unquote_js(text) if node.type == "string" else text


def literal(node, source: bytes, env: dict | None = None, depth: int = 0):
    """Small whitelist interpreter for data literals and webpack filename expressions."""
    if node is None or depth > 100:
        raise ValueError("非静态表达式")
    kind = node.type
    env = env or {}
    def call(child):
        return literal(child, source, env, depth + 1)
    if kind in {"string", "template_string"}:
        if kind == "template_string" and any(n.type == "template_substitution" for n in node.named_children):
            raise ValueError("动态模板")
        return unquote_js(raw(node, source))
    if kind == "number":
        text = raw(node, source)
        return float(text) if any(x in text.lower() for x in (".", "e")) else int(text, 0) if text.startswith("0x") else int(text)
    if kind in {"true", "false", "null"}:
        return {"true": True, "false": False, "null": None}[kind]
    if kind in {"identifier", "shorthand_property_identifier"} and raw(node, source) in env:
        return env[raw(node, source)]
    if kind == "object":
        result = {}
        for pair in node.named_children:
            if pair.type != "pair":
                raise ValueError("非静态对象")
            result[key_name(pair.child_by_field_name("key"), source)] = call(pair.child_by_field_name("value"))
        return result
    if kind == "array":
        return [call(child) for child in node.named_children]
    if kind == "parenthesized_expression":
        return call(node.named_children[0])
    if kind == "unary_expression":
        op = raw(node.child_by_field_name("operator"), source)
        value = call(node.child_by_field_name("argument"))
        if op == "-":
            return -value
        if op == "+":
            return +value
        if op == "!":
            return not value
    if kind == "binary_expression":
        op = raw(node.child_by_field_name("operator"), source)
        left = call(node.child_by_field_name("left"))
        if op == "||" and left:
            return left
        right = call(node.child_by_field_name("right"))
        if op == "+":
            return str(left) + str(right) if isinstance(left, str) or isinstance(right, str) else left + right
        if op == "||":
            return right
    if kind == "subscript_expression":
        obj = call(node.child_by_field_name("object"))
        index = call(node.child_by_field_name("index"))
        return obj.get(str(index)) if isinstance(obj, dict) else obj[index]
    raise ValueError("非静态表达式")


def hint_for(node, source: bytes) -> str:
    parent = node.parent
    for _ in range(4):
        if parent is None:
            break
        if parent.type == "pair":
            key = key_name(parent.child_by_field_name("key"), source)
            if re.search(r"\.(json|atlas|skel|png|webp|jpg)$", key, re.I):
                return key
        parent = parent.parent
    return ""


@dataclass
class JSData:
    strings: list[tuple[str, str, int]] = field(default_factory=list)
    skeletons: list[tuple[dict, str, int]] = field(default_factory=list)
    public_paths: list[str] = field(default_factory=list)
    chunks: list[str] = field(default_factory=list)
    pairs: list[tuple[int, int]] = field(default_factory=list)


def scan_javascript(text: str) -> JSData:
    source = text.encode("utf-8")
    tree = Parser(LANGUAGE).parse(source)
    result = JSData()
    stack = [tree.root_node]
    while stack:
        node = stack.pop()
        if node.type == "object":
            keys = {key_name(p.child_by_field_name("key"), source) for p in node.named_children if p.type == "pair"}
            if "bones" in keys and ("skeleton" in keys or "slots" in keys):
                try:
                    value = literal(node, source)
                    result.skeletons.append((value, hint_for(node, source), node.start_byte))
                    continue
                except (ValueError, TypeError, KeyError, IndexError, OverflowError):
                    pass
        if node.type in {"string", "template_string"}:
            # Virtual source-path keys name embedded assets; they are not network URLs.
            if node.parent and node.parent.type == "pair" and node.parent.child_by_field_name("key") == node:
                continue
            try:
                result.strings.append((literal(node, source), hint_for(node, source), node.start_byte))
            except (ValueError, OverflowError):
                pass
            continue
        if node.type == "assignment_expression":
            left = node.child_by_field_name("left")
            right = node.child_by_field_name("right")
            if left and left.type == "member_expression":
                prop = key_name(left.child_by_field_name("property"), source)
                if prop == "p":
                    try:
                        val = literal(right, source)
                        if isinstance(val, str):
                            result.public_paths.append(val)
                    except (ValueError, TypeError):
                        pass
                if prop in {"u", "miniCssF"} and right.type in {"function_expression", "arrow_function"}:
                    result.chunks.extend(webpack_chunks(right, source))
        stack.extend(reversed(node.named_children))
    hints, pairs = webpack_asset_hints(tree.root_node, source)
    starts = sorted(hints)
    def named(hint, offset):
        i = bisect_right(starts, offset) - 1
        if i >= 0:
            end, names = hints[starts[i]]
            if offset < end and len(names) == 1:
                return next(iter(names))
        return hint
    result.strings = [(value, named(hint, offset), offset) for value, hint, offset in result.strings]
    result.skeletons = [(value, named(hint, offset), offset) for value, hint, offset in result.skeletons]
    for skeleton, atlas in pairs:
        json_offsets = [offset for _, _, offset in result.skeletons if skeleton.start_byte <= offset < skeleton.end_byte]
        json_offsets += [offset for value, _, offset in result.strings if skeleton.start_byte <= offset < skeleton.end_byte and '"bones"' in value]
        atlas_offsets = [offset for value, _, offset in result.strings if atlas.start_byte <= offset < atlas.end_byte and '\n' in value]
        if len(json_offsets) == len(atlas_offsets) == 1:
            result.pairs.append((json_offsets[0], atlas_offsets[0]))
    return result


def webpack_asset_hints(root, source):
    """Follow explicit {atlas: require(id), json: require(id)} registrations, without executing JS."""
    hints, registries, registrations = {}, {}, []
    stack = [root]
    while stack:
        node = stack.pop()
        if node.type in {'string', 'template_string'}:
            continue
        if node.type == 'object':
            pairs = {key_name(p.child_by_field_name('key'), source): p.child_by_field_name('value')
                     for p in node.named_children if p.type == 'pair'}
            parent = node.parent
            spine = {'atlas', 'json'} <= pairs.keys() and parent and parent.type == 'pair'
            image = {'src', 'id', 'type'} <= pairs.keys() and raw(pairs['type'], source) in {'"image"', "'image'"} and pairs['id'].type == 'string'
            if spine or image:
                name = key_name(parent.child_by_field_name('key'), source) if spine else unquote_js(raw(pairs['id'], source))
                kinds = ['atlas', 'json'] if spine else ['png']
                calls = [re.fullmatch(r'([\w$]+)\((\d+(?:e\d+)?)\)', raw(pairs[k], source)) for k in (['atlas','json'] if spine else ['src'])]
                fn = parent
                while fn and fn.type not in {'function_expression','arrow_function'}:
                    fn = fn.parent
                params = fn.child_by_field_name('parameters') if fn else None
                if all(calls) and params and len(params.named_children) >= 3 and all(m[1] == raw(params.named_children[2], source) for m in calls):
                    table = fn.parent
                    if table and table.type == 'pair':
                        table = table.parent
                    if table and table.type in {'array','object'}:
                        key = table.start_byte
                        if key not in registries:
                            modules = {}
                            if table.type == 'array':
                                index = 0
                                for child in table.children:
                                    if child.type == ',':
                                        index += 1
                                    elif child.type in {'function_expression','arrow_function'}:
                                        modules[str(index)] = child
                            else:
                                for pair in table.named_children:
                                    if pair.type == 'pair':
                                        modules[key_name(pair.child_by_field_name('key'),source)] = pair.child_by_field_name('value')
                            registries[key] = modules
                        for kind, match in zip(kinds, calls):
                            module = registries[key].get(str(int(float(match[2]))))
                            if module:
                                hints.setdefault(module.start_byte, (module.end_byte, set()))[1].add(name+'.'+kind)
                        if spine:
                            atlas, skeleton = (registries[key].get(str(int(float(match[2])))) for match in calls)
                            if atlas and skeleton:
                                registrations.append((skeleton, atlas))
        stack.extend(node.named_children)
    return hints, registrations


def webpack_chunks(function, source: bytes) -> list[str]:
    params = function.child_by_field_name("parameters")
    param = function.child_by_field_name("parameter")
    name = raw(params.named_children[0], source) if params and params.named_children else raw(param, source) if param else ""
    if not name:
        return []
    candidates, returns = set(), []
    stack = [function.child_by_field_name("body")]
    body = stack[0]
    if body.type != "statement_block":
        returns.append(body)
    while stack:
        node = stack.pop()
        if node.type == "object":
            candidates.update(key_name(p.child_by_field_name("key"), source) for p in node.named_children if p.type == "pair")
        if node.type == "return_statement" and node.named_children:
            returns.append(node.named_children[0])
        stack.extend(node.named_children)
    result = []
    for candidate in sorted(candidates)[:1000]:
        for expr in returns:
            try:
                value = literal(expr, source, {name: candidate})
                if isinstance(value, str) and value.endswith((".js", ".css")) and "None" not in value:
                    result.append(value)
            except (ValueError, TypeError, IndexError, KeyError):
                pass
    return result

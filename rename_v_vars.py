#!/usr/bin/env python3
"""Rename vNNN / fnNN / resNN minified variables — fast, destructuring-aware."""

import re
import sys
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).parent
V_VAR = re.compile(r"\b(v\d{3,}|fn\d+|res\d+)\b")
DESTRUCT_RE = re.compile(r"(\w+)\s*:\s*(v\d{3,}|fn\d+|res\d+)\b")

RESERVED = {
    "var", "let", "const", "function", "return", "if", "else", "for", "while",
    "do", "switch", "case", "break", "continue", "default", "try", "catch",
    "finally", "throw", "new", "delete", "typeof", "instanceof", "in", "of",
    "class", "extends", "super", "import", "export", "from", "async", "await",
    "yield", "static", "get", "set", "true", "false", "null", "undefined",
    "this", "self", "window", "document", "console", "Promise", "Map", "Set",
    "Array", "Object", "String", "Number", "Boolean", "Error", "Math", "JSON",
    "app", "path", "http", "dialog", "shell", "session", "protocol", "screen",
    "Buffer", "process",
}


def to_camel(name: str) -> str:
    if not name:
        return "arg"
    out = name[0].lower() + name[1:]
    return re.sub(r"[^a-zA-Z0-9_$]", "", out) or "arg"


def next_name(used: set[str], base: str) -> str:
    if base not in used and base not in RESERVED:
        return base
    i = 2
    while f"{base}{i}" in used or f"{base}{i}" in RESERVED:
        i += 1
    return f"{base}{i}"


def infer_from_snippet(snippet: str, var: str) -> str | None:
    """Lightweight inference from a small context window."""
    if re.search(rf"catch\s*\(\s*{re.escape(var)}\b", snippet):
        return "error"
    if re.search(rf"\b{re.escape(var)}\s*=\s*new\s+Map\b", snippet):
        return "map"
    if re.search(rf"\b{re.escape(var)}\s*=\s*new\s+Set\b", snippet):
        return "set"
    if re.search(rf"\b{re.escape(var)}\s*=\s*new\s+Promise\b", snippet):
        return "promise"
    if re.search(rf"\b{re.escape(var)}\s*=\s*await\b", snippet):
        return "promise"
    if re.search(rf"\b{re.escape(var)}\s*=\s*\[", snippet):
        return "list"
    if re.search(rf"\b{re.escape(var)}\s*=\s*\{{", snippet):
        return "obj"
    if re.search(rf"\b{re.escape(var)}\s*=\s*['\"]", snippet):
        return "text"
    if re.search(rf"\b{re.escape(var)}\s*=\s*(?:true|false)", snippet):
        return "flag"
    if re.search(rf"\b{re.escape(var)}\s*\.\s*(?:map|filter|forEach|push|find)\b", snippet):
        return "list"
    if re.search(rf"\b{re.escape(var)}\s*\.\s*(?:get|set|has|delete)\b", snippet):
        return "map"
    if re.search(rf"\b{re.escape(var)}\s*\.\s*(?:then|catch|finally)\b", snippet):
        return "promise"
    if re.search(rf"typeof\s+{re.escape(var)}\b", snippet):
        return "value"
    if var.startswith("fn"):
        return "NodeClass"
    if var.startswith("res"):
        return "el"
    return None


def build_snippets(text: str, var: str, limit: int = 3) -> str:
    parts = []
    for m in re.finditer(re.escape(var), text):
        start = max(0, m.start() - 80)
        end = min(len(text), m.end() + 120)
        parts.append(text[start:end])
        if len(parts) >= limit:
            break
    return "\n".join(parts)


def rename_file(path: Path, min_vars: int = 20) -> bool:
    text = path.read_text(encoding="utf-8")
    vars_found = list(OrderedDict.fromkeys(V_VAR.findall(text)))
    if len(vars_found) < min_vars:
        return False

    used: set[str] = set(RESERVED)
    for m in re.finditer(r"\b([a-zA-Z_$][\w$]*)\b", text):
        used.add(m.group(1))

    mapping: dict[str, str] = {}

    # Pass 1: destructuring `{ foo: v12 }` -> `{ foo: foo }` (camelCase)
    def destructure_repl(m: re.Match) -> str:
        key, old = m.group(1), m.group(2)
        if old in mapping:
            new = mapping[old]
        else:
            new = next_name(used, to_camel(key))
            mapping[old] = new
            used.add(new)
        return f"{key}: {new}"

    new_text = DESTRUCT_RE.sub(destructure_repl, text)

    # Remaining vars (order of first appearance in updated text)
    remaining = list(OrderedDict.fromkeys(V_VAR.findall(new_text)))
    letters = list("abcdefghijklmnopqrstuvwxyz")
    li = 0

    for var in remaining:
        if var in mapping:
            continue
        snippet = build_snippets(new_text, var)
        inferred = infer_from_snippet(snippet, var)
        if inferred:
            name = next_name(used, inferred)
        else:
            base = letters[li] if li < len(letters) else f"t{li}"
            li += 1
            name = next_name(used, base)
        mapping[var] = name
        used.add(name)

    for old in sorted(mapping, key=len, reverse=True):
        new_text = re.sub(rf"\b{re.escape(old)}\b", mapping[old], new_text)

    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


def collect_targets(min_vars: int = 30, roots: list[str] | None = None):
    targets = []
    search_roots = [ROOT / r for r in roots] if roots else [ROOT]
    for base in search_roots:
        if not base.exists():
            continue
        for p in base.rglob("*.js"):
            if any(x in p.parts for x in ("node_modules", "vendor", "dist", "release")):
                continue
            try:
                t = p.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            count = len(set(V_VAR.findall(t)))
            if count >= min_vars:
                targets.append((count, p))
    return [p for _, p in sorted(targets, reverse=True)]


def main():
    args = sys.argv[1:]
    min_v = 1
    if args and not args[0].startswith("-"):
        files = [Path(a).resolve() for a in args]
    else:
        roots = None
        if "--min" in args:
            min_v = int(args[args.index("--min") + 1])
        if "--dir" in args:
            i = args.index("--dir") + 1
            roots = args[i].split(",")
        files = collect_targets(min_vars=min_v, roots=roots)

    changed = 0
    for p in files:
        try:
            if rename_file(p, min_vars=min_v):
                changed += 1
                print(f"Renamed: {p.relative_to(ROOT)}")
        except Exception as e:
            print(f"Failed {p.relative_to(ROOT)}: {e}")

    print(f"\nDone: {changed} file(s) updated")


if __name__ == "__main__":
    main()

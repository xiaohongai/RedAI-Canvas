#!/usr/bin/env python3
"""Repair syntax damage from deobfuscation (strings, class methods, etc.)."""

import re
from pathlib import Path

ROOT = Path(__file__).parent
SKIP = {"node_modules", "vendor", "dist", "release"}


def fix_broken_quoted_line(line: str) -> str:
    """Convert broken double-quoted HTML/selector strings to single-quoted."""
    stripped = line.rstrip("\n")
    # " [<...>] " or " [<...>] ",
    m = re.match(r'^(\s*(?:[^"\']*\s*)?)\"((?:<|\[)[^"]*(?:\"[^",;)]+\"[^"]*)*)\"(\s*,?\s*)$', stripped)
    if m and m.group(2).count('"') >= 1:
        return f"{m.group(1)}'{m.group(2)}'{m.group(3)}\n"
    return line


def fix_multiline_string_literals(text: str) -> str:
    # .replace(..., "\n") split across lines
    text = re.sub(
        r'(\.replace\([^,]+,\s*)"\s*\n\s*"\)',
        r'\1"\\n")',
        text,
    )
    text = re.sub(
        r'(\.join\()\s*"\s*\n\s*"\)',
        r'\1"\\n")',
        text,
    )
    return text


def fix_text(text: str, is_test: bool = False) -> tuple[str, dict[str, int]]:
    stats: dict[str, int] = {}

    def subn(pattern, repl, s, name):
        nonlocal stats
        if isinstance(pattern, str):
            s2, n = re.subn(pattern, repl, s)
        else:
            s2, n = pattern.subn(repl, s)
        if n:
            stats[name] = stats.get(name, 0) + n
        return s2

    # Class / accessor syntax
    text = subn(re.compile(r"\basync \._"), "async _", text, "async_method")
    text = subn(re.compile(r"\bget \."), "get ", text, "get_accessor")
    text = subn(re.compile(r"\bset \."), "set ", text, "set_accessor")

    # ['key'] -> .key in value positions
    text = subn(re.compile(r":\s*\.([a-zA-Z_$][\w$]*)(\s*[,;\)])"), r': ["\1"]\2', text, "dot_literal")
    text = subn(re.compile(r",\s*\.([a-zA-Z_$][\w$]*)\)"), r', ["\1"])', text, "dot_arg")
    text = subn(re.compile(r"\{\s*([^:}]+):\s*\.([a-zA-Z_$][\w$]*)\s*\}"), r'{ \1: ["\2"] }', text, "dot_obj")
    text = subn(re.compile(r"=\s*\.([a-zA-Z_$][\w$]*)(\s*[,;\)])"), r'= ["\1"]\2', text, "dot_default")

    # import node:path / node:test corruption
    text = subn(re.compile(r"import node:(test|path) from"), r"import \1 from", text, "import_node")
    text = subn(re.compile(r"\(node:test\."), "(test.", text, "node_test_call")
    text = subn(re.compile(r"\bnode:path\."), "path.", text, "node_path_use")

    # Promise chain at line start (not test())
    text = subn(
        re.compile(r"^(\s+)(then|catch|finally)\(", re.MULTILINE),
        r"\1.\2(",
        text,
        "chain_promise",
    )
    chain_methods = (
        "find", "map", "filter", "flatMap", "reduce", "forEach", "some", "every",
        "sort", "slice", "trim", "toLowerCase", "toUpperCase", "startsWith",
        "includes", "replace", "split", "join", "push", "pop", "offsetHSL",
        "querySelector", "querySelectorAll", "addEventListener",
    )
    text = subn(
        re.compile(rf"^(\s+)({'|'.join(chain_methods)})\(", re.MULTILINE),
        r"\1.\2(",
        text,
        "chain_method",
    )

    # Optional chaining
    text = subn(re.compile(r"\?\.\."), "?.", text, "double_opt")

    # Invalid numeric identifiers
    text = subn(re.compile(r"\bconst (\d+) ="), r"const n\1 =", text, "num_const")

    # Quote character comparisons
    text = subn(re.compile(r'=== """\)'), "=== '\"')", text, "triple_quote")
    text = subn(re.compile(r'=== """'), "=== '\"'", text, "triple_quote_eq")

    # String literal fixes
    text = subn(re.compile(r'\.replace\(/&quot;/g, """\)'), ".replace(/&quot;/g, '\"')", text, "quot_entity")
    text = subn(re.compile(r"""\+ '\\"\]"'"""), "+ '\"]'", text, "str_bracket")
    text = subn(re.compile(r"""\+ ""\]"'"""), "+ '\"]'", text, "str_bracket2")
    text = subn(re.compile(r""" \+ "\\";"""), ' + "\\\\";', text, "backslash_str")
    text = subn(re.compile(r"""'url\("' \+ q \+ ""\)";"""), "'url(\"' + q + '\")';", text, "url_str")

    # Selector strings in function calls: ("[id^="foo"]")
    text = subn(
        re.compile(r'(\?\.\("|\.("|querySelector(?:All)?\?\.\("|querySelector\("|querySelectorAll\("))(\[[^\]]*="[^"]+"[^\]]*\])(")'),
        r"\1'\3'",
        text,
        "selector_str",
    )

    text = fix_multiline_string_literals(text)

    # Line-by-line HTML/selector string fixes
    lines = text.splitlines(keepends=True)
    new_lines = []
    html_fixes = 0
    for line in lines:
        fixed = fix_broken_quoted_line(line)
        if fixed != line:
            html_fixes += 1
        new_lines.append(fixed)
    if html_fixes:
        stats["html_line"] = html_fixes
    text = "".join(new_lines)

    if is_test:
        text = subn(re.compile(r"^(\s+)\.test\(", re.MULTILINE), r"\1test(", text, "test_lead")

    return text, stats


def main():
    changed = 0
    for path in ROOT.rglob("*.js"):
        if any(p in path.parts for p in SKIP):
            continue
        text = path.read_text(encoding="utf-8")
        new_text, stats = fix_text(text, is_test=path.name.endswith(".test.js"))
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            changed += 1
            detail = ", ".join(f"{k}={v}" for k, v in sorted(stats.items()))
            print(f"{path.relative_to(ROOT)}: {detail}")
    print(f"\nUpdated {changed} file(s)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Fix double-quoted strings that contain unescaped inner double quotes."""

from pathlib import Path

ROOT = Path(__file__).parent
SKIP = {"node_modules", "vendor", "dist", "release"}


def fix_nested_quote_strings(text: str) -> tuple[str, int]:
    result = []
    i = 0
    fixes = 0
    n = len(text)

    while i < n:
        ch = text[i]
        if ch != '"':
            result.append(ch)
            i += 1
            continue

        j = i + 1
        inner_quotes = 0
        while j < n:
            if text[j] == "\\":
                j += 2
                continue
            if text[j] == '"':
                k = j + 1
                while k < n and text[k] in " \t\n\r":
                    k += 1
                if k >= n or text[k] in ",);]}+|?:&":
                    break
                inner_quotes += 1
            j += 1

        if inner_quotes > 0 and j < n:
            content = text[i + 1 : j]
            result.append("'")
            result.append(content.replace("\\'", "'").replace("'", "\\'"))
            result.append("'")
            fixes += 1
            i = j + 1
        else:
            result.append(ch)
            i += 1

    return "".join(result), fixes


def main():
    total = 0
    changed = 0
    for path in ROOT.rglob("*.js"):
        if any(p in path.parts for p in SKIP):
            continue
        text = path.read_text(encoding="utf-8")
        new_text, n = fix_nested_quote_strings(text)
        if n:
            path.write_text(new_text, encoding="utf-8")
            changed += 1
            total += n
            print(f"{path.relative_to(ROOT)}: {n}")
    print(f"\n{changed} files, {total} strings fixed")


if __name__ == "__main__":
    main()

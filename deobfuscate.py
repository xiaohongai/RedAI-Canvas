#!/usr/bin/env python3
"""Deobfuscate JS code with _0x variable names, hex literals, bracket notation, etc."""

import re
import subprocess
from pathlib import Path
from collections import OrderedDict

ROOT = Path(__file__).parent

# Patterns for obfuscated code
OBF_VAR = re.compile(r'_0x[0-9a-fA-F]{4,}')
IMPORT_ALIAS = re.compile(r'a\d{2,3}_0x[0-9a-fA-F]+')
HEX_LITERAL = re.compile(r'(?<![a-zA-Z_0-9x])0x([0-9a-fA-F]+)(?![a-zA-Z_0-9x])')
BRACKET_PROP = re.compile(r'\["(\w+)"\]')
BRACKET_PROP_SINGLE = re.compile(r"\['(\w+)'\]")
BOOL_TRUE = re.compile(r'!!\[\]')
BOOL_FALSE_EXACT = re.compile(r'(?<!!)!\[\]')
ESCAPE_SEQ = re.compile(r'\\x([0-9a-fA-F]{2})')

# IIFE wrapper pattern
IIFE_PATTERN = re.compile(
    r'^\(function\([^)]+\),[^)]+\)\{[^}]*const\s+\w+=\w+,[^}]*while\(\!\!\[\]\)\{[^}]*try\{[^}]*const\s+\w+=[^}]+if\(\w+===\w+\)break;else[^}]*\}catch\([^)]+\)\{[^}]*\}\}\}\)\([^,]+,[^)]+\);',
    re.DOTALL,
)

# Common property names that are safe to convert from bracket to dot
SAFE_PROPS = {
    'test', 'match', 'search', 'replace', 'split', 'trim', 'toLowerCase',
    'toUpperCase', 'startsWith', 'endsWith', 'includes', 'indexOf', 'slice',
    'substr', 'substring', 'charAt', 'charCodeAt', 'length',
    'push', 'pop', 'shift', 'unshift', 'splice', 'join', 'sort', 'reverse',
    'map', 'filter', 'reduce', 'forEach', 'some', 'every', 'find', 'findIndex',
    'flat', 'flatMap', 'entries', 'keys', 'values',
    'add', 'delete', 'has', 'get', 'set', 'clear', 'size',
    'parse', 'stringify',
    'isArray', 'assign', 'freeze', 'create', 'defineProperty',
    'fromEntries',
    'then', 'catch', 'finally',
    'addEventListener', 'removeEventListener', 'dispatchEvent',
    'querySelector', 'querySelectorAll', 'getElementById',
    'createElement', 'appendChild', 'removeChild', 'insertBefore',
    'style', 'classList', 'innerHTML', 'textContent', 'innerText',
    'value', 'checked', 'disabled', 'selected', 'placeholder',
    'src', 'href', 'id', 'className', 'dataset', 'getAttribute',
    'setAttribute', 'removeAttribute', 'hasAttribute',
    'toString', 'toLocaleString', 'valueOf', 'constructor',
    'prototype', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
    'abort', 'signal', 'aborted',
    'log', 'warn', 'error', 'info', 'debug',
    'resolve', 'reject',
    'open', 'close', 'send',
    'read', 'write',
    'apply', 'call', 'bind',
    'constructor',
    'ok', 'status', 'body', 'headers', 'method', 'name', 'message',
    'text', 'json', 'blob', 'arrayBuffer',
    'round', 'floor', 'ceil', 'abs', 'sqrt', 'min', 'max', 'pow',
    'parseFloat', 'parseInt', 'isFinite', 'isNaN',
    'isFrozen', 'is', 'seal', 'isSealed', 'isExtensible', 'preventExtensions',
    'configurable', 'enumerable', 'writable',
    'captureStackTrace',
    'round', 'floor', 'ceil', 'abs', 'sqrt', 'min', 'max',
    'fromCharCode',
    'exec', 'compile',
    'assign', 'keys', 'values', 'entries', 'defineProperties',
    'getOwnPropertyDescriptor', 'getOwnPropertyDescriptors',
    'getOwnPropertyNames', 'getOwnPropertySymbols',
    'create', 'defineProperty', 'freeze', 'seal',
    'preventExtensions', 'isExtensible', 'isSealed', 'isFrozen',
    'getPrototypeOf', 'setPrototypeOf',
    'is', 'assign',
    'trim', 'replace', 'match', 'test',
    'log', 'warn', 'error', 'info', 'debug',
    'resolve', 'reject',
    'open', 'close', 'send',
    'read', 'write',
    'apply', 'call', 'bind',
    'toString', 'toLocaleString',
    'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
    'toLocaleString', 'valueOf',
    'origin', 'pathname', 'search', 'hash', 'host', 'hostname', 'port',
    'protocol',
    'success', 'data', 'error', 'status', 'type', 'provider', 'code',
    'retryable', 'raw', 'message', 'stack', 'level', 'source',
    'context', 'attempts', 'retries', 'errorType', 'statusCode',
    'displayWidth', 'displayHeight', 'inputWidth', 'inputHeight',
    'width', 'height', 'source', 'fallback',
    'aspectRatio', 'size', 'label', 'w', 'h', 'value', 'policy',
    'resolved', 'capability', 'params', 'suppressAspectRatio', 'notice',
    'ratioCapability', 'resolvedRatioLabel',
    'modelManifest', 'executionManifest', 'extensions', 'ratioPolicy',
    'ratiosByImageSize', 'ratios', 'fallbackStrategyByImageSize',
    'fallbackStrategy', 'uiSchema', 'fields', 'options', 'disabled',
    'disableWhen', 'disabledWhen', 'generationParams', 'field', 'param',
    'values', 'any', 'all',
    'adapterType',
    'id',
    'dedupeKey', 'taskKey',
    'content-type',
    'Content-Type',
    'application/json',
    'AbortError',
    'Failed to fetch',
    'GET', 'POST', 'DELETE', 'PUT', 'PATCH',
    'unknown',
    'NETWORK_ERROR', 'TIMEOUT', 'DNS_ERROR', 'AUTH_ERROR', 'FORBIDDEN',
    'RATE_LIMIT', 'INSUFFICIENT_BALANCE', 'INVALID_PARAMS',
    'CONTENT_FILTERED', 'MODEL_UNAVAILABLE', 'SERVER_ERROR',
    'SERVICE_UNAVAILABLE', 'TASK_FAILED', 'TASK_TIMEOUT', 'UNKNOWN',
    'grsai', 'ppio', 'apimart', 'runninghub', 'gemini', 'openai',
    'local',
    'api.request_failed', 'renderer',
    'blob', 'text', 'auto',
    'X-AIC-Device-Id',
    'window',
    '__aicDeviceId',
    'display', 'input-media',
    'none', 'aspectRatio', 'dimensions', 'size',
    'auto', 'default', 'adaptive',
    '1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '5:4', '4:5', '21:9',
    '1K', '2K', '3K', '4K',
    'GPT_IMAGE_2',
    'dreamina', 'runninghub', 'runninghubwf',
    'directional',
    'width', 'height',
}


def find_files():
    """Find all JS/TS files that contain obfuscation patterns."""
    files = []
    for ext in ('*.js', '*.ts', '*.tsx', '*.mjs'):
        for p in ROOT.rglob(ext):
            if 'node_modules' in p.parts or str(p).startswith(str(ROOT / 'release')):
                continue
            try:
                text = p.read_text(errors='ignore')
                if OBF_VAR.search(text) or IMPORT_ALIAS.search(text):
                    files.append(p)
            except Exception:
                pass
    return files


def strip_iife(text):
    """Remove IIFE obfuscation wrapper."""
    # Match the IIFE pattern: (function(_0x...,_0x...){...}(_0x...,0x...));
    iife_match = re.match(
        r'^\(function\([^)]*\),[^)]*\)\{[^}]*while\(\!\!\[\]\)\{[^}]*\}\}\)\([^)]*\);',
        text, re.DOTALL,
    )
    if iife_match:
        return text[iife_match.end():]
    return text


def fix_hex_literals(text):
    """Convert hex literals to decimal."""
    def replacer(m):
        try:
            val = int(m.group(1), 16)
            return str(val)
        except ValueError:
            return m.group(0)
    return HEX_LITERAL.sub(replacer, text)


def fix_escape_sequences(text):
    """Convert \\x20 etc to actual characters in string literals."""
    def replacer(m):
        return chr(int(m.group(1), 16))
    return ESCAPE_SEQ.sub(replacer, text)


def fix_bracket_notation(text):
    """Convert bracket property access to dot notation for safe properties."""
    def replacer(m):
        prop = m.group(1)
        if prop in SAFE_PROPS:
            return '.' + prop
        return m.group(0)
    text = BRACKET_PROP.sub(replacer, text)
    text = BRACKET_PROP_SINGLE.sub(replacer, text)
    return text


def fix_optional_chain_double_dot(text):
    """Fix ?..prop -> ?.prop (syntax error from bracket->dot conversion)."""
    return re.sub(r'\?\.\.', '?.', text)


def fix_booleans(text):
    """Fix obfuscated boolean values."""
    text = BOOL_TRUE.sub('true', text)
    text = BOOL_FALSE_EXACT.sub('false', text)
    return text


def derive_import_name(module_path):
    """Derive a meaningful import name from a module path."""
    basename = Path(module_path).stem
    if basename.startswith('_'):
        basename = basename[1:]
    return basename


def fix_import_aliases(text):
    """Replace obfuscated import aliases with meaningful names - two pass approach."""
    # First pass: build mapping from old alias to new name
    alias_map = {}

    # Default imports: `import a116_0x3830f5 from "path"`
    for m in re.finditer(
        r'import\s+(' + IMPORT_ALIAS.pattern + r')\s+from\s+[\'"]([^\'"]+)[\'"]', text
    ):
        alias_map[m.group(1)] = derive_import_name(m.group(2))

    # Namespace imports: `import * as a116_0x5a328b from "path"`
    for m in re.finditer(
        r'import\s+\*\s+as\s+(' + IMPORT_ALIAS.pattern + r')\s+from\s+[\'"]([^\'"]+)[\'"]',
        text,
    ):
        alias_map[m.group(1)] = derive_import_name(m.group(2))

    # Named import aliases: `getProjects as a116_0x4265e1`
    for m in re.finditer(r'(\w+)\s+as\s+(' + IMPORT_ALIAS.pattern + r')', text):
        alias_map[m.group(2)] = m.group(1)

    # Apply import statement replacements
    text = re.sub(
        r'import\s+(' + IMPORT_ALIAS.pattern + r')\s+from\s+[\'"]([^\'"]+)[\'"]',
        lambda m: f'import {alias_map[m.group(1)]} from "{m.group(2)}"',
        text,
    )

    text = re.sub(
        r'import\s+\*\s+as\s+(' + IMPORT_ALIAS.pattern + r')\s+from\s+[\'"]([^\'"]+)[\'"]',
        lambda m: f'import * as {alias_map[m.group(1)]} from "{m.group(2)}"',
        text,
    )

    # Named import aliases - just keep original name
    text = re.sub(
        r'(\w+)\s+as\s+(' + IMPORT_ALIAS.pattern + r')',
        r'\1',
        text,
    )

    # Replace usages in code body
    for old, new in alias_map.items():
        text = re.sub(r'\b' + re.escape(old) + r'\b', new, text)

    return text


def infer_var_name_from_context(text, var_name):
    """Infer a meaningful name for a _0x variable based on its usage context."""
    escaped = re.escape(var_name)

    # Method call patterns: varName.method(...)
    method_map = {
        'trim': 'str', 'toLowerCase': 'str', 'toUpperCase': 'str',
        'startsWith': 'str', 'endsWith': 'str', 'includes': 'str',
        'replace': 'str', 'split': 'str', 'match': 'str', 'search': 'str',
        'slice': 'str', 'indexOf': 'str', 'charAt': 'str',
        'push': 'arr', 'pop': 'arr', 'shift': 'arr', 'unshift': 'arr',
        'forEach': 'arr', 'map': 'arr', 'filter': 'arr', 'reduce': 'arr',
        'some': 'arr', 'every': 'arr', 'find': 'arr', 'findIndex': 'arr',
        'sort': 'arr', 'reverse': 'arr', 'join': 'arr', 'flat': 'arr',
        'splice': 'arr', 'concat': 'arr',
        'get': 'map', 'set': 'map', 'has': 'map', 'delete': 'map',
        'add': 'set', 'clear': 'set',
        'abort': 'controller', 'signal': 'controller',
        'addEventListener': 'el', 'removeEventListener': 'el',
        'querySelector': 'el', 'querySelectorAll': 'el',
        'createElement': 'doc', 'appendChild': 'el',
        'text': 'response', 'json': 'response', 'blob': 'response',
        'arrayBuffer': 'response',
    }
    for method, name in method_map.items():
        if re.search(r'\b' + escaped + r'\s*\.\s*' + method + r'\b', text):
            return name

    # Function call patterns: varName(...)
    if re.search(r'\b' + escaped + r'\s*\(', text):
        return 'fn'

    # Assignment patterns
    if re.search(r'\b' + escaped + r'\s*=\s*new\s+(\w+)', text):
        cls_m = re.search(r'\b' + escaped + r'\s*=\s*new\s+(\w+)', text)
        cls = cls_m.group(1)
        cls_map = {
            'Promise': 'promise', 'Map': 'map', 'Set': 'set',
            'AbortController': 'controller', 'URL': 'url',
            'Error': 'err', 'RegExp': 'regex', 'Headers': 'headers',
        }
        if cls in cls_map:
            return cls_map[cls]
        return cls.lower()

    # JSON patterns
    if re.search(r'JSON\.\w+\s*\(\s*' + escaped, text):
        return 'data'

    # String literal assignment
    if re.search(r'\b' + escaped + r'\s*=\s*["\']', text):
        return 'str'

    # Number assignment
    if re.search(r'\b' + escaped + r'\s*=\s*\d+', text):
        return 'num'

    # Boolean patterns
    if re.search(r'\b' + escaped + r'\s*=\s*(true|false)', text):
        return 'flag'

    # Array literal
    if re.search(r'\b' + escaped + r'\s*=\s*\[', text):
        return 'arr'

    # Object literal
    if re.search(r'\b' + escaped + r'\s*=\s*\{', text):
        return 'obj'

    # Arrow function / function expression
    if re.search(r'\b' + escaped + r'\s*=\s*(?:function|\()', text):
        return 'fn'

    # Property access patterns
    if re.search(r'\b' + escaped + r'\s*\.\s*data\b', text):
        return 'response'
    if re.search(r'\b' + escaped + r'\s*\.\s*error\b', text):
        return 'response'
    if re.search(r'\b' + escaped + r'\s*\.\s*status\b', text):
        return 'response'
    if re.search(r'\b' + escaped + r'\s*\.\s*body\b', text):
        return 'response'
    if re.search(r'\b' + escaped + r'\s*\.\s*length\b', text):
        return 'arr'
    if re.search(r'\b' + escaped + r'\s*\.\s*width\b', text):
        return 'size'
    if re.search(r'\b' + escaped + r'\s*\.\s*height\b', text):
        return 'size'

    # Return pattern
    if re.search(r'return\s+' + escaped + r'\b', text):
        return 'result'

    # Await pattern
    if re.search(r'await\s+' + escaped + r'\b', text):
        return 'promise'

    # Catch clause variable
    if re.search(r'catch\s*\(\s*' + escaped, text):
        return 'err'

    # Callback pattern
    if re.search(r'forEach\s*\(\s*\(\s*' + escaped, text):
        return 'item'

    # typeof pattern
    if re.search(r'typeof\s+' + escaped, text):
        return 'value'

    return None


def rename_obf_vars(text):
    """Rename _0xHEX variables to meaningful names."""
    # Find all unique _0x variable names in the file
    all_vars = OrderedDict()
    for m in re.finditer(OBF_VAR, text):
        all_vars[m.group(0)] = None

    reserved = {
        'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for',
        'while', 'do', 'switch', 'case', 'break', 'continue', 'default',
        'try', 'catch', 'finally', 'throw', 'new', 'delete', 'typeof',
        'instanceof', 'in', 'of', 'class', 'extends', 'super', 'import',
        'export', 'from', 'async', 'await', 'yield', 'static', 'get', 'set',
        'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
        'this', 'self', 'window', 'document', 'global', 'console',
        'Promise', 'Map', 'Set', 'Array', 'Object', 'String', 'Number',
        'Boolean', 'Error', 'RegExp', 'Date', 'Math', 'JSON', 'parseInt',
        'parseFloat', 'setTimeout', 'setInterval', 'clearTimeout',
        'clearInterval', 'fetch', 'requestAnimationFrame',
    }
    used_names = set(reserved)

    # First pass: try to infer names from context
    for var_name in all_vars:
        inferred = infer_var_name_from_context(text, var_name)
        if inferred and inferred not in used_names:
            all_vars[var_name] = inferred
            used_names.add(inferred)
        elif inferred:
            base = inferred
            i = 2
            while f'{base}{i}' in used_names:
                i += 1
            all_vars[var_name] = f'{base}{i}'
            used_names.add(f'{base}{i}')

    # Second pass: assign short generic names to remaining
    generics = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    ]
    gen_idx = 0
    for var_name in all_vars:
        if all_vars[var_name] is None:
            if gen_idx < len(generics):
                name = generics[gen_idx]
                gen_idx += 1
            else:
                name = f'v{gen_idx}'
            if name in used_names:
                i = 2
                while f'{name}{i}' in used_names:
                    i += 1
                name = f'{name}{i}'
            all_vars[var_name] = name
            used_names.add(name)

    # Apply replacements - sort by length to avoid partial replacements
    for var_name in sorted(all_vars, key=len, reverse=True):
        new_name = all_vars[var_name]
        text = re.sub(r'\b' + re.escape(var_name) + r'\b', new_name, text)

    return text


def deobfuscate_file(filepath):
    """Deobfuscate a single file."""
    try:
        text = filepath.read_text(encoding='utf-8')
    except Exception:
        return False

    original = text

    if not OBF_VAR.search(text) and not IMPORT_ALIAS.search(text):
        return False

    # Strip IIFE wrapper
    text = strip_iife(text)

    # Apply cosmetic fixes
    text = fix_hex_literals(text)
    text = fix_escape_sequences(text)
    text = fix_bracket_notation(text)
    text = fix_optional_chain_double_dot(text)
    text = fix_booleans(text)

    # Fix import aliases
    text = fix_import_aliases(text)

    # Rename _0x variables
    if OBF_VAR.search(text):
        text = rename_obf_vars(text)

    # Clean up
    text = text.strip()
    text = re.sub(r'^[;\s]+', '', text)

    if text != original:
        filepath.write_text(text, encoding='utf-8')
        return True
    return False


def main():
    files = find_files()
    print(f'Found {len(files)} obfuscated files')

    success = 0
    failed = 0
    failed_files = []
    for i, f in enumerate(files):
        rel = f.relative_to(ROOT)
        if i % 100 == 0:
            print(f'Processing {i}/{len(files)}...')
        try:
            if deobfuscate_file(f):
                success += 1
            else:
                failed += 1
                failed_files.append(str(rel))
        except Exception as e:
            failed += 1
            failed_files.append(f'{rel}: {e}')

    print(f'\nDone: {success} succeeded, {failed} failed')
    if failed_files:
        print(f'Failed files:')
        for ff in failed_files[:20]:
            print(f'  - {ff}')
        if len(failed_files) > 20:
            print(f'  ... and {len(failed_files) - 20} more')

    # Run prettier
    if success > 0:
        print('\nRunning prettier...')
        try:
            dirs = ['src', 'electron', 'api', 'main.js']
            subprocess.run(['npx', 'prettier', '--write'] + dirs, cwd=ROOT, check=True)
            print('Prettier done!')
        except subprocess.CalledProcessError as e:
            print(f'Prettier failed: {e}')
        except FileNotFoundError:
            print(
                'npx/prettier not found. Run `npx prettier --write src/ electron/ api/ main.js` manually.'
            )


if __name__ == '__main__':
    main()

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = '/workspace';

// Patterns
const OBF_VAR = /\b_0x[0-9a-fA-F]{4,}\b/g;
const IMPORT_ALIAS = /\ba\d{2,3}_0x[0-9a-fA-F]+\b/g;
const HEX_LITERAL = /(?<![a-zA-Z_0-9x])0x([0-9a-fA-F]+)(?![a-zA-Z_0-9x])/g;
const BRACKET_PROP = /\[["']([a-zA-Z_$][a-zA-Z0-9_$]*)["']\]/g;
const BOOL_TRUE = /!!\[\]/g;
const BOOL_FALSE = /(?<!!)!\[\]/g;
const ESCAPE_SEQ = /\\x([0-9a-fA-F]{2})/g;
const IIFE_WRAPPER = /^\(function\([^)]*\),[^)]*\)\{[^}]*while\(\!\!\[\]\)\{[^}]*\}\}\)\([^)]*\);/s;

// Method → type mapping for variable inference
const METHOD_TYPE = {
  trim: 'str', toLowerCase: 'str', toUpperCase: 'str',
  startsWith: 'str', endsWith: 'str', includes: 'str',
  replace: 'str', split: 'str', match: 'str', search: 'str',
  slice: 'str', indexOf: 'str', charAt: 'str',
  push: 'arr', pop: 'arr', shift: 'arr', unshift: 'arr',
  forEach: 'arr', map: 'arr', filter: 'arr', reduce: 'arr',
  some: 'arr', every: 'arr', find: 'arr', findIndex: 'arr',
  sort: 'arr', reverse: 'arr', join: 'arr', flat: 'arr',
  splice: 'arr', concat: 'arr',
  get: 'map', set: 'map', has: 'map', delete: 'map',
  add: 'set', clear: 'set',
  abort: 'ctrl', signal: 'ctrl',
  addEventListener: 'signal', removeEventListener: 'signal',
  text: 'res', json: 'res', blob: 'res', arrayBuffer: 'res',
};

const CLASS_TYPE = {
  Promise: 'promise', Map: 'map', Set: 'set',
  AbortController: 'ctrl', URL: 'url',
  Error: 'err', RegExp: 'regex', Headers: 'headers',
};

function inferVarName(text, varName) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Method calls
  for (const [method, type] of Object.entries(METHOD_TYPE)) {
    if (new RegExp(`\\b${escaped}\\s*\\.\\s*${method}\\b`).test(text)) {
      return type;
    }
  }

  // Function call
  if (new RegExp(`\\b${escaped}\\s*\\(`).test(text)) return 'fn';

  // New expression
  const newMatch = text.match(new RegExp(`\\b${escaped}\\s*=\\s*new\\s+(\\w+)`));
  if (newMatch) {
    const cls = newMatch[1];
    if (CLASS_TYPE[cls]) return CLASS_TYPE[cls];
    return cls.charAt(0).toLowerCase() + cls.slice(1);
  }

  // Assignment patterns
  if (new RegExp(`\\b${escaped}\\s*=\\s*["']`).test(text)) return 'str';
  if (new RegExp(`\\b${escaped}\\s*=\\s*\\d+`).test(text)) return 'num';
  if (new RegExp(`\\b${escaped}\\s*=\\s*(?:true|false)`).test(text)) return 'flag';
  if (new RegExp(`\\b${escaped}\\s*=\\s*\\[`).test(text)) return 'arr';
  if (new RegExp(`\\b${escaped}\\s*=\\s*\\{`).test(text)) return 'obj';
  if (new RegExp(`\\b${escaped}\\s*=\\s*(?:function|\\()`).test(text)) return 'fn';

  // Property access
  if (new RegExp(`\\b${escaped}\\s*\\.\\s*(?:data|error|status|body)`).test(text)) return 'res';
  if (new RegExp(`\\b${escaped}\\s*\\.\\s*length`).test(text)) return 'arr';
  if (new RegExp(`\\b${escaped}\\s*\\.\\s*(?:width|height)`).test(text)) return 'size';

  // Return / await
  if (new RegExp(`return\\s+${escaped}\\b`).test(text)) return 'result';
  if (new RegExp(`await\\s+${escaped}\\b`).test(text)) return 'promise';

  // Catch
  if (new RegExp(`catch\\s*\\(\\s*${escaped}`).test(text)) return 'err';

  // Callback
  if (new RegExp(`forEach\\s*\\(\\s*\\(\\s*${escaped}`).test(text)) return 'item';

  return null;
}

function getNextName(used, base) {
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

function renameObfVars(text) {
  const vars = new Map();
  OBF_VAR.lastIndex = 0;
  let m;
  while ((m = OBF_VAR.exec(text)) !== null) {
    vars.set(m[0], null);
  }

  const reserved = new Set([
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
  ]);

  const used = new Set(reserved);

  // First pass: infer names
  for (const varName of vars.keys()) {
    const inferred = inferVarName(text, varName);
    if (inferred) {
      const name = getNextName(used, inferred);
      vars.set(varName, name);
      used.add(name);
    }
  }

  // Second pass: generic names
  const generics = 'abcdefghijklmnopqrstuvwxyz'.split('');
  let gi = 0;
  for (const varName of vars.keys()) {
    if (vars.get(varName) === null) {
      const base = gi < generics.length ? generics[gi] : `v${gi}`;
      gi++;
      const name = getNextName(used, base);
      vars.set(varName, name);
      used.add(name);
    }
  }

  // Apply replacements (longest first)
  const sorted = [...vars.keys()].sort((a, b) => b.length - a.length);
  for (const varName of sorted) {
    const newName = vars.get(varName);
    text = text.replace(new RegExp(`\\b${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), newName);
  }

  return text;
}

function deriveImportName(modulePath) {
  const basename = path.basename(modulePath, path.extname(modulePath));
  return basename.startsWith('_') ? basename.slice(1) : basename;
}

function fixImportAliases(text) {
  const aliasMap = new Map();

  // Default imports
  for (const m of text.matchAll(/import\s+(\ba\d{2,3}_0x[0-9a-fA-F]+\b)\s+from\s+["']([^"']+)["']/g)) {
    aliasMap.set(m[1], deriveImportName(m[2]));
  }

  // Namespace imports
  for (const m of text.matchAll(/import\s+\*\s+as\s+(\ba\d{2,3}_0x[0-9a-fA-F]+\b)\s+from\s+["']([^"']+)["']/g)) {
    aliasMap.set(m[1], deriveImportName(m[2]));
  }

  // Named import aliases
  for (const m of text.matchAll(/(\w+)\s+as\s+(\ba\d{2,3}_0x[0-9a-fA-F]+\b)/g)) {
    aliasMap.set(m[2], m[1]);
  }

  // Apply
  for (const [old, newName] of aliasMap) {
    text = text.replace(new RegExp(`\\b${old}\\b`, 'g'), newName);
  }

  // Clean up import statements
  text = text.replace(/import\s+(\ba\d{2,3}_0x[0-9a-fA-F]+\b)\s+from/g, 'import from');
  text = text.replace(/import\s+\*\s+as\s+(\ba\d{2,3}_0x[0-9a-fA-F]+\b)\s+from/g, 'import * as from');

  return text;
}

function deobfuscate(text) {
  // Strip IIFE
  text = IIFE_WRAPPER.replace(text, '');

  // Hex literals
  text = text.replace(HEX_LITERAL, (m, hex) => parseInt(hex, 16).toString());

  // Escape sequences
  text = text.replace(ESCAPE_SEQ, (m, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Bracket notation → dot notation
  text = text.replace(BRACKET_PROP, (m, prop) => '.' + prop);

  // Fix ?.. → ?.
  text = text.replace(/\?\.\./g, '?.');

  // Booleans
  text = text.replace(BOOL_TRUE, 'true');
  text = text.replace(BOOL_FALSE, 'false');

  // Import aliases
  text = fixImportAliases(text);

  // Rename _0x variables
  if (OBF_VAR.test(text)) {
    text = renameObfVars(text);
  }

  // Clean up
  text = text.trimStart();

  return text;
}

function findFiles(dir, exts = ['.js', '.ts', '.tsx', '.mjs']) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'release') continue;
      results.push(...findFiles(path.join(dir, entry.name), exts));
    } else if (exts.includes(path.extname(entry.name))) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function processFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf-8');
  const original = text;

  if (!OBF_VAR.test(text) && !IMPORT_ALIAS.test(text)) return false;

  text = deobfuscate(text);

  if (text !== original) {
    fs.writeFileSync(filePath, text, 'utf-8');
    return true;
  }
  return false;
}

// Main
const dirs = ['src', 'electron', 'api'];
let allFiles = [];
for (const d of dirs) {
  const dirPath = path.join(ROOT, d);
  if (fs.existsSync(dirPath)) {
    allFiles.push(...findFiles(dirPath));
  }
}

console.log(`Found ${allFiles.length} files to check`);

let success = 0;
let failed = 0;
for (let i = 0; i < allFiles.length; i++) {
  if (i % 100 === 0) console.log(`Processing ${i}/${allFiles.length}...`);
  try {
    if (processFile(allFiles[i])) {
      success++;
    } else {
      failed++;
    }
  } catch (e) {
    failed++;
    console.error(`Error: ${allFiles[i]}: ${e.message}`);
  }
}

console.log(`\nDone: ${success} changed, ${failed} unchanged`);

// Run prettier
if (success > 0) {
  console.log('\nRunning prettier...');
  try {
    execSync(`npx prettier --write ${dirs.join(' ')} main.js`, { cwd: ROOT, stdio: 'inherit' });
    console.log('Prettier done!');
  } catch (e) {
    console.error('Prettier failed:', e.message);
  }
}

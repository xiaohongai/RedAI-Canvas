#!/usr/bin/env node
/**
 * Deobfuscate javascript-obfuscator string-array encoding.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const DECODER_RE =
  /function (a\d+_0x[0-9a-fA-F]+)\(\w+,\w+\)\{(?:const|var) (\w+)=(a\d+_0x[0-9a-fA-F]+)\(\);return \1=function\(\w+,\w+\)\{\w+=\w+-(0x[0-9a-fA-F]+|\d+);(?:let|var) \w+=\w+\[\w+\];return \w+;\},\1\(\w+,\w+\);\}/;

const SHUFFLE_RE =
  /(?:const\s+a\d+_0x[0-9a-fA-F]+\s*=\s*a\d+_0x[0-9a-fA-F]+;)?\(function\s*\([^)]+\)\s*\{[\s\S]*?\}\([^,)]+,\s*(?:0x[0-9a-fA-F]+|\d+)\)\);/;

function extractArrayFunction(text, arrayName) {
  const startMatch = text.match(
    new RegExp(`function ${arrayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\(\\)\\{(?:const|var)`),
  );
  if (!startMatch) throw new Error(`array function ${arrayName} not found`);
  const start = startMatch.index;

  const endToken = `return ${arrayName}();}`;
  const end = text.indexOf(endToken, start);
  if (end < 0) throw new Error(`array function ${arrayName} end not found`);

  return text.slice(start, end + endToken.length);
}

function buildDecoderContext(text) {
  const decoderMatch = text.match(DECODER_RE);
  if (!decoderMatch) throw new Error("decoder function not found");

  const [, decoderName, , arrayName] = decoderMatch;
  const decoderFn = decoderMatch[0];
  const arrayFn = extractArrayFunction(text, arrayName);
  const shuffleMatch = text.match(SHUFFLE_RE);

  const sandbox = {};
  vm.runInNewContext([decoderFn, arrayFn, shuffleMatch?.[0] || ""].filter(Boolean).join("\n"), sandbox);

  const decode = sandbox[decoderName];
  if (typeof decode !== "function") throw new Error("decoder init failed");

  const aliases = collectDecoderAliases(text, decoderName);
  for (const m of text.matchAll(/const\s+(a\d+_0x[0-9a-fA-F]+)\s*=\s*([a-zA-Z_$][\w$]*)\s*;/g)) {
    if (aliases.includes(m[2])) aliases.push(m[1]);
  }
  return { decode, aliases, decoderName, arrayName, decoderFn, arrayFn, shuffleIife: shuffleMatch?.[0] || "" };
}

function collectDecoderAliases(text, decoderName) {
  const aliases = new Set([decoderName]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const alias of [...aliases]) {
      for (const m of text.matchAll(
        new RegExp(
          `(?:const|let|var)\\s+([\\w$]+)\\s*=\\s*${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\s*\\()(?:;|,|$)`,
          "g",
        ),
      )) {
        if (!aliases.has(m[1])) {
          aliases.add(m[1]);
          changed = true;
        }
      }
    }
  }
  return [...aliases];
}

function decodeCallArg(argText) {
  const trimmed = argText.trim();
  if (/^0x[0-9a-fA-F]+$/i.test(trimmed)) return parseInt(trimmed, 16);
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  return null;
}

function replaceDecoderCalls(text, ctx) {
  const aliasPattern = ctx.aliases
    .sort((a, b) => b.length - a.length)
    .map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const callRe = new RegExp(`\\b(?:${aliasPattern})\\((0x[0-9a-fA-F]+|\\d+)\\)`, "g");

  return text.replace(callRe, (full, argText) => {
    const arg = decodeCallArg(argText);
    if (arg == null) return full;
    try {
      const value = ctx.decode(arg);
      return JSON.stringify(value);
    } catch {
      return full;
    }
  });
}

function stripObfuscationShell(text, ctx) {
  let out = text;

  if (ctx.shuffleIife) out = out.replace(ctx.shuffleIife, "");

  out = out.replace(
    new RegExp(
      `const\\s+a\\d+_0x[0-9a-fA-F]+\\s*=\\s*${ctx.decoderName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*;`,
      "g",
    ),
    "",
  );

  out = out.replace(ctx.decoderFn, "");
  out = out.replace(ctx.arrayFn, "");

  return out.replace(/^\s+/, "");
}

function cosmeticCleanup(text) {
  let out = text;
  out = out.replace(/!!\[\]/g, "true");
  out = out.replace(/!\[\]/g, "false");
  out = out.replace(/returnfalse\b/g, "return false");
  out = out.replace(/returntrue\b/g, "return true");
  out = out.replace(/(?<![a-zA-Z_0-9x])0x([0-9a-fA-F]+)(?![a-zA-Z_0-9x])/g, (_, hex) =>
    String(parseInt(hex, 16)),
  );
  out = out.replace(/\?\.\./g, "?.");
  // Dead decoder anti-tamper refs left after wrapper removal
  out = out.replace(/^\s*var v\d+ = a\d+_0x[0-9a-fA-F]+;\s*\n/gm, "");
  out = out.replace(/^var a\d+_0x[0-9a-fA-F]+ = a\d+_0x[0-9a-fA-F]+;\s*\n/gm, "");
  out = out.replace(/^\s*var v\d+ = v\d+;\s*\n/gm, "");
  return out;
}

function removeDeadDecoderAliases(text, aliases) {
  let out = text;
  for (const alias of aliases) {
    out = out.replace(
      new RegExp(`const\\s+(\\w+)\\s*=\\s*${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*,`, "g"),
      "const ",
    );
    out = out.replace(
      new RegExp(`const\\s+(\\w+)\\s*=\\s*${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*;`, "g"),
      "",
    );
  }
  return out;
}

function fixImportAliases(text) {
  const aliasMap = new Map();

  const deriveName = (modulePath) => {
    let base;
    if (modulePath.startsWith("node:")) {
      const sub = modulePath.slice(5);
      base = sub.includes("/") ? sub.split("/").pop() : sub;
    } else {
      base = path.basename(modulePath, path.extname(modulePath));
    }
    base = base.replace(/^_/, "");
    return base.replace(/-([a-zA-Z])/g, (_, ch) => ch.toUpperCase()).replace(/-/g, "");
  };

  for (const m of text.matchAll(
    /import\s+(a\d+_0x[0-9a-fA-F]+)\s+from\s*["']?([^"';]+)["']?/g,
  )) {
    aliasMap.set(m[1], deriveName(m[2]));
  }
  for (const m of text.matchAll(
    /import\s+(a\d+_0x[0-9a-fA-F]+)\s*,\s*\{[\s\S]*?\}\s*from\s*["']?([^"';]+)["']?/g,
  )) {
    aliasMap.set(m[1], deriveName(m[2]));
  }
  for (const m of text.matchAll(
    /import\s+\*\s+as\s+(a\d+_0x[0-9a-fA-F]+)\s+from\s*["']?([^"';]+)["']?/g,
  )) {
    aliasMap.set(m[1], deriveName(m[2]));
  }
  for (const m of text.matchAll(/(\w+)\s+as\s+(a\d+_0x[0-9a-fA-F]+)/g)) {
    const hasLocalWrapper =
      text.includes(`export function ${m[1]}(`) ||
      new RegExp(`\\bfunction ${m[1]}\\(`).test(text);
    aliasMap.set(m[2], hasLocalWrapper ? `${m[1]}Impl` : m[1]);
  }

  // appStore facade: named exports must not collide with const graphStore/uiStore/workspaceStore
  if (/\/stores\/appStore\.js["']?/.test(text)) {
    for (const name of ["graphStore", "uiStore", "workspaceStore"]) {
      for (const m of text.matchAll(
        new RegExp(`${name}\\s+as\\s+(a\\d{2,3}_0x[0-9a-fA-F]+)`, "g"),
      )) {
        aliasMap.set(m[1], `${name}Import`);
      }
    }
  }

  for (const [old, newName] of aliasMap) {
    text = text.replace(new RegExp(`\\b${old}\\b`, "g"), newName);
  }
  text = text.replace(/\b(\w+)\s+as\s+a\d+_0x[0-9a-fA-F]+\b/g, "$1");
  return text;
}

function fixBracketNotation(text) {
  // Disabled: ['method']() must NOT become .method() in class bodies.
  return text;
}

function fixFacadeStoreBindings(text) {
  return text;
}

function walkJsFiles(dir) {
  const skip = new Set(["node_modules", "vendor", "dist", "release"]);
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsFiles(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

function isObfuscated(text) {
  return text.includes("while(!![])") || /function a\d+_0x/.test(text);
}

function collectObfuscatedFiles(dirs) {
  const results = [];
  for (const dir of dirs) {
    for (const full of walkJsFiles(path.resolve(ROOT, dir))) {
      const text = fs.readFileSync(full, "utf-8");
      if (isObfuscated(text)) results.push(full);
    }
  }
  return results;
}

function verifySyntax(filePath) {
  try {
    execSync(`node --check ${JSON.stringify(filePath)}`, { stdio: "pipe" });
    return true;
  } catch (err) {
    const msg = err.stderr?.toString() || err.message;
    console.error(`Syntax error: ${path.relative(ROOT, filePath)}\n${msg}`);
    return false;
  }
}

function renameObfVars(text) {
  const OBF_VAR = /\b_0x[0-9a-fA-F]{4,}\b/g;
  const vars = [...new Set(text.match(OBF_VAR) || [])];
  if (vars.length === 0) return text;

  const used = new Set([
    "var", "let", "const", "function", "return", "if", "else", "for", "while",
    "true", "false", "null", "undefined", "this", "import", "export", "from",
    "async", "await", "class", "new", "try", "catch", "finally", "throw",
  ]);

  const mapping = new Map();
  let counter = 0;
  for (const name of vars) {
    let next = `v${counter++}`;
    while (used.has(next)) next = `v${counter++}`;
    mapping.set(name, next);
    used.add(next);
  }

  for (const [oldName, newName] of [...mapping.entries()].sort((a, b) => b[0].length - a[0].length)) {
    text = text.replace(new RegExp(`\\b${oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), newName);
  }
  return text;
}

function hasObfuscatedImportAlias(text) {
  return /\ba\d+_0x[0-9a-fA-F]+\b/.test(text);
}

function fixImportsFile(filePath) {
  const original = fs.readFileSync(filePath, "utf-8");
  if (!hasObfuscatedImportAlias(original)) return false;

  let out = cosmeticCleanup(original);
  out = fixImportAliases(out);
  out = fixFacadeStoreBindings(out);

  if (out === original) return false;
  fs.writeFileSync(filePath, out, "utf-8");
  return true;
}

function deobfuscateFile(filePath) {
  const original = fs.readFileSync(filePath, "utf-8");
  if (!isObfuscated(original)) return false;

  const ctx = buildDecoderContext(original);

  let out = stripObfuscationShell(original, ctx);
  out = replaceDecoderCalls(out, ctx);
  out = removeDeadDecoderAliases(out, ctx.aliases);
  out = replaceDecoderCalls(out, ctx);
  out = cosmeticCleanup(out);
  out = fixImportAliases(out);
  out = fixFacadeStoreBindings(out);
  out = renameObfVars(out);

  if (out === original) return false;
  fs.writeFileSync(filePath, out, "utf-8");
  return true;
}

function parseArgs(argv) {
  const dirs = [];
  const files = [];
  let fixImportsOnly = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dir" && argv[i + 1]) {
      dirs.push(...argv[++i].split(","));
    } else if (argv[i] === "--fix-imports") {
      fixImportsOnly = true;
    } else if (!argv[i].startsWith("-")) {
      files.push(path.resolve(argv[i]));
    }
  }
  if (dirs.length > 0) {
    if (fixImportsOnly) {
      for (const dir of dirs) {
        files.push(...walkJsFiles(path.resolve(ROOT, dir)));
      }
    } else {
      files.push(...collectObfuscatedFiles(dirs));
    }
  }
  return { files, fixImportsOnly };
}

const { files, fixImportsOnly } = parseArgs(process.argv.slice(2));
if (files.length === 0) {
  console.error(
    "Usage: node deobfuscate-string-array.mjs [--dir src/core,api] [--fix-imports] [files...]",
  );
  process.exit(1);
}

let changed = 0;
const updated = [];
const failed = [];

for (const file of files) {
  try {
    const didChange = fixImportsOnly ? fixImportsFile(file) : deobfuscateFile(file);
    if (didChange) {
      if (!verifySyntax(file)) {
        failed.push(file);
        continue;
      }
      changed++;
      updated.push(file);
      console.log(`${fixImportsOnly ? "Fixed imports" : "Deobfuscated"}: ${path.relative(ROOT, file)}`);
    }
  } catch (err) {
    failed.push(file);
    console.error(`Failed ${path.relative(ROOT, file)}: ${err.message}`);
  }
}

if (updated.length > 0) {
  try {
    execSync(`npx prettier --write ${updated.map((f) => JSON.stringify(f)).join(" ")}`, {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    console.warn("Prettier skipped");
  }
}

console.log(`\nDone: ${changed} file(s) updated, ${failed.length} failed`);
if (failed.length > 0) process.exit(1);

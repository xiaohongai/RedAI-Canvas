import yazl from "yazl";
import {
  appendFileSync,
  closeSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
const DESKTOP_LOG_NAME = "desktop.log.jsonl",
  DIAGNOSTIC_README_NAME = "README.txt",
  DIAGNOSTIC_METADATA_NAME = "metadata.json",
  DEFAULT_MAX_LOG_BYTES = 5 * 1024 * 1024,
  DEFAULT_SERVER_TAIL_BYTES = 1024 * 1024,
  DEFAULT_DESKTOP_TAIL_BYTES = 2 * 1024 * 1024,
  MAX_STRING_LENGTH = 2000,
  MAX_STACK_LENGTH = 10000,
  MAX_ARRAY_ITEMS = 30,
  MAX_OBJECT_KEYS = 80,
  MAX_DEPTH = 5,
  REDACTED = "[REDACTED]",
  SENSITIVE_KEY_RE =
    /(?:api[-_ ]?key|token|authorization|password|passwd|pwd|cdkey|secret|cookie|session|bearer|access[-_ ]?key|refresh[-_ ]?key)/i,
  SAFE_DIAGNOSTIC_KEYS = new Set([
    "dragFpsSessions",
    "panFpsSessions",
    "zoomFpsSessions",
    "resizeFpsSessions",
  ]);
function normalizeOneLine(v0, v1 = "") {
  return String(v0 ?? v1)
    ["replace"](/\s+/g, "\x20")
    ["trim"]();
}
function truncateString(v2, v3 = MAX_STRING_LENGTH) {
  const v4 = String(v2 ?? "");
  if (v4["length"] <= v3) return v4;
  return (
    v4["slice"](0, v3) + "... [truncated " + (v4["length"] - v3) + " chars]"
  );
}
function sanitizeError(v5) {
  return {
    name: truncateString(v5?.["name"] || "Error", 160),
    message: truncateString(
      v5?.["message"] || String(v5 || ""),
      MAX_STRING_LENGTH,
    ),
    stack: truncateString(v5?.["stack"] || "", MAX_STACK_LENGTH),
  };
}
export function sanitizeDiagnosticValue(v6, v7 = {}) {
  const v8 = Number(v7["depth"] || 0) || 0,
    v9 = String(v7["key"] || "");
  if (!SAFE_DIAGNOSTIC_KEYS["has"](v9) && SENSITIVE_KEY_RE["test"](v9))
    return REDACTED;
  if (v6 instanceof Error) return sanitizeError(v6);
  if (v6 == null) return v6;
  const v10 = typeof v6;
  if (v10 === "string") return truncateString(v6);
  if (v10 === "number" || v10 === "boolean") return v6;
  if (v10 === "bigint") return String(v6);
  if (v10 === "function") return "[Function]";
  if (v10 !== "object") return truncateString(String(v6));
  if (v8 >= MAX_DEPTH) return "[MaxDepth]";
  if (Array["isArray"](v6)) {
    const v11 = v6["slice"](0, MAX_ARRAY_ITEMS)["map"]((v12) =>
      sanitizeDiagnosticValue(v12, { depth: v8 + 1 }),
    );
    return (
      v6["length"] > MAX_ARRAY_ITEMS &&
        v11["push"](
          "[truncated " + (v6["length"] - MAX_ARRAY_ITEMS) + " items]",
        ),
      v11
    );
  }
  const v13 = {},
    v14 = Object["entries"](v6)["slice"](0, MAX_OBJECT_KEYS);
  for (const [v15, v16] of v14) {
    v13[v15] = sanitizeDiagnosticValue(v16, { key: v15, depth: v8 + 1 });
  }
  const v17 = Object["keys"](v6)["length"] - v14["length"];
  if (v17 > 0) v13["__truncatedKeys"] = v17;
  return v13;
}
export function buildDiagnosticLogEntry(v18 = {}, v19 = new Date()) {
  const v20 = normalizeOneLine(v18["source"], "unknown") || "unknown",
    v21 = normalizeOneLine(v18["type"], "event") || "event",
    v22 = normalizeOneLine(v18["level"], "info")["toLowerCase"](),
    v23 = ["debug", "info", "warn", "error"]["includes"](v22) ? v22 : "info",
    v24 = v18["error"] instanceof Error ? v18["error"] : null;
  return {
    ts: v19["toISOString"](),
    type: truncateString(v21, 120),
    level: v23,
    source: truncateString(v20, 120),
    message: truncateString(
      v18["message"] || v24?.["message"] || v18["error"] || v21,
      MAX_STRING_LENGTH,
    ),
    context: sanitizeDiagnosticValue(v18["context"] || {}),
    stack: truncateString(
      v18["stack"] || v24?.["stack"] || "",
      MAX_STACK_LENGTH,
    ),
  };
}
function ensureDir(v25) {
  return (mkdirSync(v25, { recursive: true }), v25);
}
function safeUnlink(v26) {
  try {
    if (existsSync(v26)) unlinkSync(v26);
  } catch {}
}
function rotateLogIfNeeded(v27, v28) {
  try {
    if (!existsSync(v27)) return;
    const v29 = statSync(v27)["size"];
    if (v29 < v28) return;
    const v30 = v27 + ".1";
    (safeUnlink(v30), renameSync(v27, v30));
  } catch {}
}
function readTailBuffer(v31, v32) {
  try {
    if (!v31 || !existsSync(v31)) return Buffer["alloc"](0);
    const v33 = statSync(v31);
    if (!v33["isFile"]() || v33["size"] <= 0) return Buffer["alloc"](0);
    const v34 = Math["min"](v33["size"], v32),
      v35 = Math["max"](0, v33["size"] - v34),
      v36 = Buffer["alloc"](v34),
      v37 = openSync(v31, "r");
    try {
      readSync(v37, v36, 0, v34, v35);
    } finally {
      closeSync(v37);
    }
    return v36;
  } catch {
    return Buffer["alloc"](0);
  }
}
function writeZip(v38, v39) {
  return new Promise((v40, v41) => {
    const v42 = createWriteStream(v39);
    (v42["once"]("close", v40),
      v42["once"]("error", v41),
      v38["outputStream"]["once"]("error", v41),
      v38["outputStream"]["pipe"](v42),
      v38["end"]());
  });
}
function resolveDownloadsDir(v43, v44) {
  try {
    const v45 = v43?.["getPath"]?.("downloads");
    if (v45) return ensureDir(v45);
  } catch {}
  return ensureDir(v44);
}
function timestampForFilename(v46 = new Date()) {
  const v47 = (v48) => String(v48)["padStart"](2, "0");
  return [
    v46["getFullYear"](),
    v47(v46["getMonth"]() + 1),
    v47(v46["getDate"]()),
    "-",
    v47(v46["getHours"]()),
    v47(v46["getMinutes"]()),
    v47(v46["getSeconds"]()),
  ]["join"]("");
}
function buildReadme() {
  return [
    "RedAI-Canvas 诊断包",
    "",
    "请将整个 ZIP 文件发送给开发者用于排查问题。",
    "本诊断包只包含运行日志和环境摘要，不包含项目文件、画布内容、素材、API Key 或授权码。",
    "",
  ]["join"]("\x0a");
}
export function createDiagnosticsManager(v49 = {}) {
  const v50 = ensureDir(v49["logDir"]),
    v51 = ensureDir(v49["diagnosticsDir"] || path["join"](v50, "diagnostics")),
    v52 = v49["desktopLogPath"] || path["join"](v50, DESKTOP_LOG_NAME),
    v53 = v49["serverLogPath"] || "",
    v54 =
      Number(v49["maxLogBytes"] || DEFAULT_MAX_LOG_BYTES) ||
      DEFAULT_MAX_LOG_BYTES,
    v55 = v49["app"] || null,
    v56 =
      typeof v49["getMetadata"] === "function"
        ? v49["getMetadata"]
        : () => ({});
  function v57(v58 = {}) {
    try {
      (ensureDir(v50), rotateLogIfNeeded(v52, v54));
      const v59 = buildDiagnosticLogEntry(v58);
      return (
        appendFileSync(v52, JSON["stringify"](v59) + "\x0a", "utf8"),
        { ok: true }
      );
    } catch (v60) {
      return { ok: false, error: String(v60?.["message"] || v60) };
    }
  }
  async function v61() {
    const v62 = new Date(),
      v63 = "RedAI-Canvas-Diagnostics-" + timestampForFilename(v62) + ".zip",
      v64 = resolveDownloadsDir(v55, v51),
      v65 = path["join"](v64, v63),
      v66 = await Promise["resolve"](v56()),
      v67 = sanitizeDiagnosticValue({
        generatedAt: v62["toISOString"](),
        host: {
          platform: process["platform"],
          arch: process["arch"],
          osRelease: os["release"](),
        },
        ...(v66 || {}),
      }),
      v68 = new yazl["ZipFile"]();
    v68["addBuffer"](
      Buffer["from"](JSON["stringify"](v67, null, 2) + "\x0a", "utf8"),
      DIAGNOSTIC_METADATA_NAME,
    );
    const v69 = readTailBuffer(v52, DEFAULT_DESKTOP_TAIL_BYTES);
    v68["addBuffer"](
      v69["length"] ? v69 : Buffer["from"]("", "utf8"),
      DESKTOP_LOG_NAME,
    );
    const v70 = readTailBuffer(v53, DEFAULT_SERVER_TAIL_BYTES);
    (v68["addBuffer"](
      v70["length"] ? v70 : Buffer["from"]("", "utf8"),
      "server.log",
    ),
      v68["addBuffer"](
        Buffer["from"](buildReadme(), "utf8"),
        DIAGNOSTIC_README_NAME,
      ));
    try {
      return (
        await writeZip(v68, v65),
        v57({
          type: "diagnostics.package_created",
          level: "info",
          source: "main",
          message: "Diagnostics package created",
          context: { outputPath: v65 },
        }),
        { ok: true, path: v65, filename: v63 }
      );
    } catch (v71) {
      v57({
        type: "diagnostics.package_failed",
        level: "error",
        source: "main",
        message: "Diagnostics\x20package\x20failed",
        error: v71,
      });
      throw v71;
    }
  }
  function v72() {
    (ensureDir(v50), !existsSync(v52) && writeFileSync(v52, "", "utf8"));
  }
  return {
    logDir: v50,
    diagnosticsDir: v51,
    desktopLogPath: v52,
    serverLogPath: v53,
    ensureInitialFiles: v72,
    logEvent: v57,
    createPackage: v61,
  };
}

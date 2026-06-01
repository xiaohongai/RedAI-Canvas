import {
  getPerfProbeSnapshot,
  setPerfProbeEnabled,
} from "../modules/perf/perfProbe.js";
const MAX_CONTEXT_STRING_LENGTH = 1200,
  MAX_CONTEXT_DEPTH = 5;
function getDiagnosticsApi() {
  const v0 = globalThis["window"]?.["electronAPI"]?.["diagnostics"];
  if (!v0 || typeof v0 !== "object") return null;
  return v0;
}
function toMessage(v1, v2 = "Unknown error") {
  if (typeof v1 === "string") return v1;
  if (v1?.["message"]) return String(v1["message"]);
  return String(v1 || v2);
}
function normalizeContextValue(v3, v4 = 0) {
  if (v3 == null) return v3;
  if (typeof v3 === "string") {
    if (v3["length"] <= MAX_CONTEXT_STRING_LENGTH) return v3;
    return v3["slice"](0, MAX_CONTEXT_STRING_LENGTH) + "...";
  }
  if (typeof v3 === "number" || typeof v3 === "boolean") return v3;
  if (typeof v3 !== "object") return String(v3);
  if (v4 >= MAX_CONTEXT_DEPTH) return "[Object]";
  if (v3 instanceof Error)
    return {
      name: v3["name"] || "Error",
      message: v3["message"] || "",
      stack: v3["stack"] || "",
    };
  if (Array["isArray"](v3))
    return v3["slice"](0, 20)["map"]((v5) => normalizeContextValue(v5, v4 + 1));
  const v6 = {};
  return (
    Object["entries"](v3)
      ["slice"](0, 50)
      ["forEach"](([v7, v8]) => {
        v6[v7] = normalizeContextValue(v8, v4 + 1);
      }),
    v6
  );
}
export function logDiagnosticEvent(v9 = {}) {
  const v10 = getDiagnosticsApi();
  if (typeof v10?.["logEvent"] !== "function")
    return Promise["resolve"]({ ok: false });
  const v11 = v9["error"] instanceof Error ? v9["error"] : null,
    v12 = {
      type: String(v9["type"] || "renderer.event"),
      level: String(v9["level"] || "info"),
      source: String(v9["source"] || "renderer"),
      message: String(
        v9["message"] || toMessage(v11 || v9["error"], "Renderer event"),
      ),
      context: normalizeContextValue(v9["context"] || {}),
      stack: String(v9["stack"] || v11?.["stack"] || ""),
    };
  try {
    return Promise["resolve"](v10["logEvent"](v12))["catch"](() => ({
      ok: false,
    }));
  } catch {
    return Promise["resolve"]({ ok: false });
  }
}
export function logPerformanceSnapshot(v13 = "manual") {
  const v14 = String(v13 || "manual")["trim"]() || "manual";
  return logDiagnosticEvent({
    type: "performance.snapshot",
    level: "info",
    source: "renderer",
    message: "Canvas performance snapshot",
    context: { reason: v14, snapshot: getPerfProbeSnapshot() },
  });
}
export async function createDiagnosticsPackage() {
  const v15 = getDiagnosticsApi();
  if (typeof v15?.["createPackage"] !== "function")
    throw new Error("当前环境不支持生成诊断包");
  return await v15["createPackage"]();
}
export async function openDiagnosticsLogsFolder() {
  const v16 = getDiagnosticsApi();
  if (typeof v16?.["openLogsFolder"] !== "function")
    throw new Error("当前环境不支持打开日志目录");
  return await v16["openLogsFolder"]();
}
export function canUseDiagnostics() {
  const v17 = getDiagnosticsApi();
  return !!(
    v17 &&
    typeof v17["logEvent"] === "function" &&
    typeof v17["createPackage"] === "function" &&
    typeof v17["openLogsFolder"] === "function"
  );
}
export function initDiagnosticsService() {
  if (globalThis["window"]?.["__aiCanvasDiagnosticsInstalled"]) return;
  if (!canUseDiagnostics()) return;
  ((globalThis["window"]["__aiCanvasDiagnosticsInstalled"] = true),
    setPerfProbeEnabled(true),
    globalThis["window"]["addEventListener"]("error", (v18) => {
      void logDiagnosticEvent({
        type: "renderer.window_error",
        level: "error",
        source: "renderer",
        message: v18?.["message"] || "Renderer window error",
        error: v18?.["error"],
        context: {
          filename: v18?.["filename"] || "",
          lineno: v18?.["lineno"] || 0,
          colno: v18?.["colno"] || 0,
        },
      });
    }),
    globalThis["window"]["addEventListener"]("unhandledrejection", (v19) => {
      const v20 = v19?.["reason"];
      void logDiagnosticEvent({
        type: "renderer.unhandled_rejection",
        level: "error",
        source: "renderer",
        message: toMessage(v20, "Renderer unhandled rejection"),
        error: v20 instanceof Error ? v20 : null,
        context: v20 instanceof Error ? {} : { reason: toMessage(v20) },
      });
    }),
    void logDiagnosticEvent({
      type: "renderer.diagnostics_ready",
      level: "info",
      source: "renderer",
      message: "Renderer diagnostics service initialized",
      context: {
        href: globalThis["location"]?.["href"] || "",
        userAgent: globalThis["navigator"]?.["userAgent"] || "",
      },
    }));
}

import {
  maskDebugBearer,
  maskDebugHeaders,
  maskDebugPayloadSecrets,
} from "./debugRequestMasking.js";
export const DEBUG_WRENCH_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
export function applyDebugWrenchIcon(v0) {
  if (!v0) return;
  v0["innerHTML"] = DEBUG_WRENCH_ICON_HTML;
}
export function buildFinalApiDebugRequest(v1, v2 = {}) {
  const v3 = v2["method"] || "POST",
    v4 = String(v1?.["url"] || ""),
    v5 = { ...(v1?.["body"] || {}) },
    v6 = String(v1?.["apiUrl"] || v5["apiUrl"] || "");
  let v7 = v1?.["headers"] || { "Content-Type": "application/json" },
    v8 = v5;
  if (v5["apiUrl"] && v4["startsWith"]("/api/v2/proxy/")) {
    const v9 = v5["apiKey"] || "";
    ((v8 = { ...v5 }),
      delete v8["apiUrl"],
      delete v8["apiKey"],
      (v7 = v9
        ? {
            "Content-Type": "application/json",
            Authorization: maskDebugBearer(v9),
          }
        : v7));
  } else
    v4 === "/api/v2/runninghubwf/run" &&
      (v7 = { "Content-Type": "application/json" });
  return {
    method: v3,
    url: v4,
    apiUrl: v6,
    headers: maskDebugHeaders(v7),
    payload: maskDebugPayloadSecrets(v8),
  };
}
export function formatFinalApiDebugRequest(v10, v11 = {}) {
  const v12 = buildFinalApiDebugRequest(v10, v11);
  return (
    '🎯 [最终发给 API 的参数]\n\nmethod = "' +
    v12["method"] +
    '"\n\nurl = "' +
    v12["url"] +
    '"\n\napiUrl = "' +
    v12["apiUrl"] +
    '"\n\nheaders = ' +
    JSON["stringify"](v12["headers"], null, 2) +
    "\n\npayload = " +
    JSON["stringify"](v12["payload"], null, 2)
  );
}

import { logDiagnosticEvent } from "./diagnosticsService.js";
export function normalizeHttpExternalUrl(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (!v1) return "";
  try {
    const v2 = new URL(v1);
    if (v2["protocol"] !== "http:" && v2["protocol"] !== "https:") return "";
    return ((v2["username"] = ""), (v2["password"] = ""), v2["toString"]());
  } catch {
    return "";
  }
}
function getElectronShellApi() {
  const v3 = globalThis["window"]?.["electronAPI"]?.["shell"];
  return v3 && typeof v3["openExternal"] === "function" ? v3 : null;
}
function openExternalInBrowser(v4) {
  const v5 = document["createElement"]("a");
  return (
    (v5["href"] = v4),
    (v5["target"] = "_blank"),
    (v5["rel"] = "noopener\x20noreferrer"),
    v5["click"](),
    { ok: true, url: v4 }
  );
}
export async function openExternalLink(v6, v7 = {}) {
  const v8 = normalizeHttpExternalUrl(v6),
    v9 = String(v7["label"] || "外部链接");
  if (!v8) {
    void logDiagnosticEvent({
      type: "external_link.renderer_blocked",
      level: "warn",
      source: "renderer",
      message: "Renderer blocked invalid external link",
      context: { label: v9 },
    });
    throw new Error("不允许打开该外部链接");
  }
  const v10 = getElectronShellApi();
  if (v10) return await v10["openExternal"](v8);
  return openExternalInBrowser(v8);
}
export async function openExternalLinkWithClipboardFallback(v11, v12 = "链接") {
  const v13 = normalizeHttpExternalUrl(v11);
  if (!v13) throw new Error("未检测到" + v12);
  try {
    return (await openExternalLink(v13, { label: v12 }), true);
  } catch {
    try {
      return (await navigator["clipboard"]?.["writeText"]?.(v13), false);
    } catch {
      return false;
    }
  }
}
export function initExternalLinkHandlers(v14 = document) {
  if (globalThis["window"]?.["__aiCanvasExternalLinksInstalled"]) return;
  ((globalThis["window"]["__aiCanvasExternalLinksInstalled"] = true),
    v14["addEventListener"]("click", (v15) => {
      const v16 = v15["target"]?.["closest"]?.(
        "[data-external-url],a[href^='http://'],a[href^='https://']",
      );
      if (!v16) return;
      const v17 =
        v16["dataset"]?.["externalUrl"] || v16["getAttribute"]?.("href") || "";
      if (!v17) return;
      (v15["preventDefault"](),
        void openExternalLink(v17, {
          label:
            v16["getAttribute"]?.("aria-label") ||
            v16["getAttribute"]?.("title") ||
            "外部链接",
        })["catch"]((v18) => {
          globalThis["window"]?.["showToast"]?.(
            v18?.["message"] || "无法打开外部链接",
            "error",
          );
        }));
    }));
}

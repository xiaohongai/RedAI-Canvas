const AUDIO_EXTENSIONS = new Set([
  "aac",
  "aiff",
  "amr",
  "flac",
  "m4a",
  "mp3",
  "oga",
  "ogg",
  "opus",
  "wav",
  "weba",
  "webm",
  "wma",
]);
function firstNonEmptyString(...v0) {
  for (const v1 of v0) {
    const v2 = String(v1 || "")["trim"]();
    if (v2) return v2;
  }
  return "";
}
function normalizeAudioDownloadUrl(v3) {
  const v4 = String(v3 || "")["trim"]();
  if (!v4) return "";
  if (/^(?:https?:|blob:|data:)/i["test"](v4)) return v4;
  if (v4["startsWith"]("/")) return v4;
  return "/" + v4["replace"](/^\/+/, "");
}
function safeDecode(v5) {
  try {
    return decodeURIComponent(v5);
  } catch {
    return v5;
  }
}
function basenameFromUrl(v6) {
  const v7 = String(v6 || "")["trim"]();
  if (!v7 || v7["startsWith"]("data:") || v7["startsWith"]("blob:")) return "";
  try {
    const v8 = new URL(
      v7,
      globalThis["location"]?.["href"] || "http://localhost/",
    );
    return safeDecode(
      v8["pathname"]["split"]("/")["filter"](Boolean)["pop"]() || "",
    );
  } catch {
    const v9 = v7["split"]("#")[0]["split"]("?")[0]["replace"](/\\/g, "/");
    return safeDecode(v9["split"]("/")["filter"](Boolean)["pop"]() || "");
  }
}
function sanitizeFileName(v10) {
  return String(v10 || "")
    ["trim"]()
    ["replace"](/[\\/:*?"<>|]/g, "_")
    ["slice"](0, 160);
}
function getFileExtension(v11) {
  const v12 = basenameFromUrl(v11) || String(v11 || "")["trim"](),
    v13 = v12["match"](/\.([a-z0-9]{1,8})$/i);
  return String(v13?.[1] || "")["toLowerCase"]();
}
function getAudioExtension(...v14) {
  for (const v15 of v14) {
    const v16 = getFileExtension(v15);
    if (AUDIO_EXTENSIONS["has"](v16)) return v16;
  }
  return "mp3";
}
function ensureAudioFileExtension(v17, v18) {
  const v19 = sanitizeFileName(v17);
  if (!v19) return "audio." + (v18 || "mp3");
  if (/\.[a-z0-9]{1,8}$/i["test"](v19)) return v19;
  return v19 + "." + (v18 || "mp3");
}
export function resolveAudioDownloadTarget({
  nodeData: nodeData = {},
  audioElement: audioElement = null,
} = {}) {
  const v20 = firstNonEmptyString(
      nodeData["localPath"],
      nodeData["audioUrl"],
      nodeData["src"],
      nodeData["url"],
      nodeData["resultUrl"],
      audioElement?.["currentSrc"],
      audioElement?.["src"],
    ),
    v21 = normalizeAudioDownloadUrl(v20);
  if (!v21) return null;
  const v22 = getAudioExtension(
      nodeData["fileName"],
      nodeData["localPath"],
      nodeData["audioUrl"],
      nodeData["src"],
      nodeData["url"],
      nodeData["resultUrl"],
      v21,
    ),
    v23 = firstNonEmptyString(
      nodeData["fileName"],
      basenameFromUrl(nodeData["localPath"]),
      basenameFromUrl(nodeData["audioUrl"]),
      basenameFromUrl(nodeData["src"]),
      basenameFromUrl(nodeData["url"]),
      basenameFromUrl(nodeData["resultUrl"]),
      basenameFromUrl(v21),
      nodeData["name"],
    );
  return { url: v21, filename: ensureAudioFileExtension(v23, v22) };
}
export function triggerAudioDownload(v24, v25 = globalThis["document"]) {
  if (!v24?.["url"] || !v25?.["createElement"] || !v25?.["body"]) return false;
  const v26 = v25["createElement"]("a");
  ((v26["href"] = v24["url"]),
    (v26["download"] = v24["filename"] || "audio.mp3"),
    (v26["rel"] = "noopener"),
    v25["body"]["appendChild"](v26),
    v26["click"](),
    v26["remove"]?.());
  if (v26["parentNode"]) v26["parentNode"]["removeChild"](v26);
  return true;
}
export function bindAudioDownloadAction({
  button: v27,
  getNodeData: v28,
  getAudioElement: v29,
  notifyMissing: v30,
  documentRef: documentRef = globalThis["document"],
} = {}) {
  if (!v27) return () => {};
  const v31 = (v32) => {
    (v32?.["preventDefault"]?.(), v32?.["stopPropagation"]?.());
    const v33 = resolveAudioDownloadTarget({
      nodeData: typeof v28 === "function" ? v28() : {},
      audioElement: typeof v29 === "function" ? v29() : null,
    });
    if (!v33) {
      if (typeof v30 === "function") v30();
      return;
    }
    triggerAudioDownload(v33, documentRef);
  };
  return (
    v27["addEventListener"]("click", v31),
    () => v27["removeEventListener"]("click", v31)
  );
}

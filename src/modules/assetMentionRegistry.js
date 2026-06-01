import { resolveGenerationInputImageUrl } from "../services/imageReferenceUrlService.js";
import {
  resolveCanvasAudioUrl,
  resolveCanvasVideoUrl,
} from "../services/canvasMediaLocalService.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
import { resolveEffectiveInputKind } from "./modelInputPolicy.js";
const TYPE_LABELS = Object["freeze"]({
  text: "文本",
  image: "图片",
  video: "视频",
  audio: "音频",
});
let _assetMentionRefs = [],
  _assetMentionRefMap = new Map(),
  _assetMentionRegistryRevision = 0;
const _assetMentionRegistryListeners = new Set();
function normalizeText(v0) {
  return String(v0 || "")["trim"]();
}
function normalizeAssetType(v1) {
  const v2 = normalizeText(v1)["toLowerCase"]();
  if (!v2) return "";
  if (v2 === "text" || v2 === "source-text" || v2 === "ai-text") return "text";
  if (v2 === "image" || v2 === "source-image" || v2 === "ai-image")
    return "image";
  if (v2 === "video" || v2 === "source-video" || v2 === "ai-video")
    return "video";
  if (v2 === "audio" || v2 === "source-audio" || v2 === "ai-audio")
    return "audio";
  if (v2["includes"]("text")) return "text";
  if (v2["includes"]("video")) return "video";
  if (v2["includes"]("audio")) return "audio";
  if (v2["includes"]("image")) return "image";
  return "";
}
function toUsableUrl(v3) {
  const v4 = normalizeText(v3);
  if (!v4) return "";
  if (/^(?:https?:|blob:|data:|\/)/i["test"](v4)) return v4;
  if (/^[a-z][a-z0-9+.-]*:/i["test"](v4)) return "";
  return localPathToUrl(v4) || "/" + v4["replace"](/^\/+/, "");
}
function firstUsableUrl(...v5) {
  for (const v6 of v5) {
    const v7 = toUsableUrl(v6);
    if (v7) return v7;
  }
  return "";
}
function pickResultItem(v8, v9) {
  if (!Array["isArray"](v8) || v8["length"] === 0) return null;
  const v10 = Number(v9),
    v11 = Number["isFinite"](v10) ? Math["max"](0, Math["trunc"](v10)) : 0;
  return v8[Math["min"](v11, v8["length"] - 1)] || null;
}
function getTextContent(v12 = {}, v13 = {}) {
  return normalizeText(
    v12["outputText"] ||
      v12["text"] ||
      v12["content"] ||
      v12["prompt"] ||
      v13["text"] ||
      v13["content"] ||
      v13["prompt"] ||
      v12["label"] ||
      v13["name"],
  );
}
function resolveRefUrl(v14, v15 = {}, v16 = {}) {
  if (v14 === "image")
    return (
      resolveGenerationInputImageUrl(v15) ||
      firstUsableUrl(
        v16["url"],
        v16["src"],
        v16["thumbSrc"],
        v15["originalLocalPath"],
        v15["localPath"],
        v15["imageUrl"],
        v15["sourceUrl"],
        v15["src"],
        v15["url"],
        v15["thumbUrl"],
      )
    );
  if (v14 === "video") {
    const v17 = pickResultItem(v15["videos"], v15["mainVideoIndex"]);
    return (
      resolveCanvasVideoUrl(v15) ||
      firstUsableUrl(
        v16["url"],
        v16["src"],
        v15["localPath"],
        v15["videoUrl"],
        v15["src"],
        v15["url"],
        v17?.["localPath"],
        v17?.["videoUrl"],
      )
    );
  }
  if (v14 === "audio")
    return (
      resolveCanvasAudioUrl(v15) ||
      firstUsableUrl(
        v16["url"],
        v16["src"],
        v15["localPath"],
        v15["audioUrl"],
        v15["src"],
        v15["url"],
      )
    );
  return "";
}
function resolveThumbUrl(v18, v19 = {}, v20 = {}) {
  const v21 = firstUsableUrl(
    v20["thumbSrc"],
    v20["thumbUrl"],
    v20["thumbnailUrl"],
    v20["coverUrl"],
    v19["thumbLocalPath"],
    v19["thumbUrl"],
    v19["thumbnailUrl"],
    v19["coverUrl"],
    v19["displayLocalPath"],
  );
  if (v21 || (v18 !== "image" && v18 !== "video")) return v21;
  return firstUsableUrl(
    v18 === "image" ? v19["originalLocalPath"] : "",
    v18 === "image" ? v19["localPath"] : "",
    v18 === "image" ? v19["imageUrl"] : "",
  );
}
function buildAssetMentionRefs(v22) {
  if (!v22 || typeof v22 !== "object") return [];
  const v23 = normalizeText(v22["id"]);
  if (!v23) return [];
  const v24 = Array["isArray"](v22["items"]),
    v25 = Array["isArray"](v22["nodes"]);
  if (!v24 && !v25) return [];
  const v26 = v24
      ? v22["items"]
      : v22["nodes"]["map"]((v27) => ({ nodeData: v27, type: v27?.["type"] })),
    v28 = normalizeText(v22["name"]),
    v29 = [];
  return (
    v26["forEach"]((v30, v31) => {
      if (!v30 || typeof v30 !== "object") return;
      const v32 =
          v30["nodeData"] && typeof v30["nodeData"] === "object"
            ? v30["nodeData"]
            : v30,
        v33 =
          resolveEffectiveInputKind(v32) ||
          normalizeAssetType(v30["type"] || v32["type"]);
      if (!v33) return;
      const v34 =
          normalizeText(v30["name"] || v32["name"] || v32["label"]) ||
          v28 ||
          "" + (TYPE_LABELS[v33] || "素材") + (v31 + 1),
        v35 = v33 === "text" ? getTextContent(v32, v30) : "",
        v36 = v33 === "text" ? "" : resolveRefUrl(v33, v32, v30),
        v37 = resolveThumbUrl(v33, v32, v30);
      if (v33 === "text" ? !v35 : !v36) return;
      v29["push"]({
        origin: "asset",
        assetId: v23,
        assetName: v28,
        itemIndex: v31,
        type: v33,
        name: v34,
        label: v34,
        insertLabel: v34,
        content: v35,
        url: v36,
        thumbUrl: v37,
        nodeData: v32,
      });
    }),
    v29
  );
}
function rebuildIndex(v38) {
  ((_assetMentionRefs = Array["isArray"](v38) ? v38 : []),
    (_assetMentionRefMap = new Map()),
    _assetMentionRefs["forEach"]((v39) => {
      _assetMentionRefMap["set"](v39["assetId"] + ":" + v39["itemIndex"], v39);
    }),
    (_assetMentionRegistryRevision += 1),
    _assetMentionRegistryListeners["forEach"]((v40) => {
      try {
        v40(_assetMentionRegistryRevision);
      } catch (v41) {
        console["warn"]("[assetMentionRegistry]\x20listener\x20failed", v41);
      }
    }));
  if (
    typeof window !== "undefined" &&
    typeof window["dispatchEvent"] === "function"
  )
    try {
      window["dispatchEvent"](
        new CustomEvent("asset-mention-registry-change", {
          detail: { revision: _assetMentionRegistryRevision },
        }),
      );
    } catch {}
}
export function getAssetMentionRegistryRevision() {
  return _assetMentionRegistryRevision;
}
export function subscribeAssetMentionRegistry(v42) {
  if (typeof v42 !== "function") return () => {};
  return (
    _assetMentionRegistryListeners["add"](v42),
    () => {
      _assetMentionRegistryListeners["delete"](v42);
    }
  );
}
export function setAssetMentionAssets(v43 = []) {
  const v44 = [];
  ((Array["isArray"](v43) ? v43 : [])["forEach"]((v45) => {
    v44["push"](...buildAssetMentionRefs(v45));
  }),
    rebuildIndex(v44));
}
export function upsertAssetMentionAsset(v46) {
  if (!v46 || typeof v46 !== "object") return;
  const v47 = normalizeText(v46["id"]);
  if (!v47) return;
  const v48 = _assetMentionRefs["filter"]((v49) => v49["assetId"] !== v47);
  (v48["push"](...buildAssetMentionRefs(v46)), rebuildIndex(v48));
}
export function removeAssetMentionAsset(v50) {
  const v51 = normalizeText(v50);
  if (!v51) return;
  rebuildIndex(_assetMentionRefs["filter"]((v52) => v52["assetId"] !== v51));
}
export function resolveAssetMentionRef({
  assetId: assetId = "",
  itemIndex: itemIndex = 0,
} = {}) {
  return (
    _assetMentionRefMap["get"](
      normalizeText(assetId) + ":" + Number(itemIndex),
    ) || null
  );
}
export function getAssetMentionCandidates({
  query: query = "",
  allowedTypes: allowedTypes = null,
} = {}) {
  const v53 = normalizeText(query)["replace"](/^@+/, "")["toLowerCase"](),
    v54 =
      Array["isArray"](allowedTypes) && allowedTypes["length"]
        ? new Set(allowedTypes)
        : null;
  return _assetMentionRefs["filter"]((v55) => {
    if (v54 && !v54["has"](v55["type"])) return false;
    if (!v53) return true;
    const v56 = [
      v55["name"],
      v55["assetName"],
      TYPE_LABELS[v55["type"]],
      v55["label"],
      v55["insertLabel"],
    ]
      ["join"]("\x20")
      ["toLowerCase"]();
    return v56["includes"](v53);
  });
}
export function _resetAssetMentionRegistryForTests() {
  rebuildIndex([]);
}

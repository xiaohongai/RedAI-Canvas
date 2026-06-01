import { generateThumbnail } from "../modules/imageUtils.js";
import { ensureLocalImageDerivatives, uploadFile } from "./projectService.js";
import { buildImageNodeStorageFields } from "./imageDerivativeService.js";
import appStore from "../core/stores/appStore.js";
import { screenToWorld } from "../core/math.js";
import { showError, showWarning } from "./toastService.js";
import { setThumbnail } from "./thumbnailCacheService.js";
import { installMediaTaskUpdateListener } from "./mediaTaskService.js";
import { logDiagnosticEvent } from "./diagnosticsService.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import {
  AI_GENERATION_NODE_SHORT_SIDE,
  AI_TEXT_DEFAULT_RATIO,
  SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE,
} from "./mediaSizingPolicy.js";
import { WEB_PREVIEW_MIN_SIZE } from "../modules/webPreviewSizing.js";
export {
  AI_GENERATION_NODE_SHORT_SIDE,
  AI_TEXT_DEFAULT_RATIO,
  SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE,
} from "./mediaSizingPolicy.js";
function _toOneLineMessage(v0) {
  const v1 =
    typeof v0 === "string"
      ? v0
      : v0?.["message"]
        ? String(v0["message"])
        : "未知错误";
  return v1["replace"](/\s+/g, "\x20")["trim"]();
}
function _profileDragImport(v2, v3 = {}) {
  try {
    const v4 = { t: Math["round"](performance["now"]()), ...v3 };
    (console["log"]("[drag-import-prof] " + v2, v4),
      globalThis["window"]?.["electronAPI"]?.["logDragImport"]?.(v2, v4));
  } catch {}
}
let _assetUpdatedListenerInstalled = false;
function installElectronAssetUpdatedListener() {
  if (_assetUpdatedListenerInstalled) return;
  _assetUpdatedListenerInstalled = true;
  const v5 = globalThis["window"]?.["electronAPI"]?.["onAssetUpdated"];
  if (typeof v5 !== "function") return;
  v5((v6) => {
    const v7 = String(v6?.["assetId"] || "")["trim"]();
    if (!v7) return;
    const v8 = appStore["getState"]()?.["nodes"] || {},
      v9 = {
        assetId: v7,
        localPath: v6?.["localPath"] || v6?.["originalLocalPath"] || "",
        originalLocalPath: v6?.["originalLocalPath"] || v6?.["localPath"] || "",
        displayLocalPath: v6?.["displayLocalPath"] || "",
        thumbLocalPath: v6?.["thumbLocalPath"] || v6?.["posterLocalPath"] || "",
        posterLocalPath: v6?.["posterLocalPath"] || "",
        waveformLocalPath: v6?.["waveformLocalPath"] || "",
        derivativeStatus: v6?.["derivativeStatus"] || v6?.["status"] || "",
        mediaTaskId: v6?.["mediaTaskId"] || "",
        mediaTaskKind: v6?.["mediaTaskKind"] || "",
        mediaTaskStatus: v6?.["mediaTaskStatus"] || "",
        mediaTaskProgress: Number(v6?.["mediaTaskProgress"] || 0) || 0,
        mediaTaskError: v6?.["mediaTaskError"] || "",
        videoProxyStatus: v6?.["videoProxyStatus"] || "",
        videoCodec: v6?.["videoCodec"] || "",
        videoWidth: Number(v6?.["videoWidth"] || v6?.["width"] || 0) || 0,
        videoHeight: Number(v6?.["videoHeight"] || v6?.["height"] || 0) || 0,
        videoDuration: Number(v6?.["videoDuration"] || 0) || 0,
        videoFps: Number(v6?.["videoFps"] || 0) || 0,
      };
    if (v6?.["kind"] === "image")
      ((v9["src"] = v6?.["displayUrl"] || v6?.["url"] || ""),
        (v9["imageUrl"] = v6?.["displayUrl"] || v6?.["url"] || ""),
        (v9["sourceUrl"] = v6?.["originalUrl"] || ""),
        (v9["thumbUrl"] = v6?.["thumbUrl"] || ""));
    else {
      if (v6?.["kind"] === "video")
        ((v9["src"] = v6?.["originalUrl"] || v6?.["url"] || ""),
          (v9["videoUrl"] = v6?.["originalUrl"] || v6?.["url"] || ""),
          (v9["thumbUrl"] = v6?.["posterUrl"] || v6?.["thumbUrl"] || ""));
      else
        v6?.["kind"] === "audio" &&
          ((v9["src"] = v6?.["originalUrl"] || v6?.["url"] || ""),
          (v9["audioUrl"] = v6?.["originalUrl"] || v6?.["url"] || ""));
    }
    Object["values"](v8)["forEach"]((v10) => {
      if (String(v10?.["assetId"] || "")["trim"]() !== v7) return;
      appStore["updateNodeData"](v10["id"], v9);
    });
  });
}
(installElectronAssetUpdatedListener(), installMediaTaskUpdateListener());
export function getBaseName(v11) {
  const v12 = String(v11 || "")["trim"]();
  return v12["replace"](/\.[^/.]+$/, "");
}
function getDefaultNodeName(v13) {
  const v14 = {
    "source-image": "图片",
    "source-video": "视频",
    "source-audio": "音频",
    "media-clip": "剪辑",
    "source-text": "文本",
  };
  return v14[v13] || "文件";
}
export function getNodeTypeByFile(v15) {
  if (v15["type"]["startsWith"]("image/")) return "source-image";
  if (v15["type"]["startsWith"]("video/")) return "source-video";
  if (v15["type"]["startsWith"]("audio/")) return "source-audio";
  if (v15["type"] === "text/plain" || v15["name"]["endsWith"](".txt"))
    return "source-text";
  return null;
}
export function getNodeDefaultSize(v16) {
  const v17 = {
    "source-image": { width: 512, height: 288 },
    "source-video": { width: 512, height: 288 },
    "web-preview": { ...WEB_PREVIEW_MIN_SIZE },
    "source-audio": { width: 320, height: 140 },
    "media-clip": { width: 760, height: 180 },
    collage: { width: 576, height: 576 },
    "source-text": { width: 512, height: 288 },
    "comment-note": { width: 260, height: 120 },
    "storyboard-script": { width: 1024, height: 576 },
    "panorama-scene": { width: 1024, height: 576 },
    "panorama-360": { width: 1024, height: 576 },
  };
  return v17[v16] || { width: 320, height: 180 };
}
export function getAutoMediaSizeByShortSide(
  v18,
  v19,
  v20 = SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE,
) {
  const v21 = Math["max"](1, Number(v18) || 1),
    v22 = Math["max"](1, Number(v19) || 1),
    v23 = Math["max"](1, Number(v20) || SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE),
    v24 = Math["min"](v21, v22),
    v25 = v23 / v24;
  return {
    width: Math["max"](1, Math["round"](v21 * v25)),
    height: Math["max"](1, Math["round"](v22 * v25)),
  };
}
export function getAIGenerationNodeSize(
  v26,
  v27,
  v28 = AI_GENERATION_NODE_SHORT_SIDE,
) {
  const v29 = Math["max"](1, Number(v28) || AI_GENERATION_NODE_SHORT_SIDE),
    v30 = Number(v26) || 0,
    v31 = Number(v27) || 0;
  if (v30 > 0 && v31 > 0) return getAutoMediaSizeByShortSide(v30, v31, v29);
  return { width: v29, height: v29 };
}
export function getAIGenerationDefaultSizeByType(
  v32,
  v33 = AI_GENERATION_NODE_SHORT_SIDE,
) {
  const v34 = String(v32 || "")["trim"]();
  if (v34 === "ai-text")
    return getAutoMediaSizeByShortSide(
      AI_TEXT_DEFAULT_RATIO["width"],
      AI_TEXT_DEFAULT_RATIO["height"],
      v33,
    );
  if (v34 === "ai-image" || v34 === "ai-video")
    return getAIGenerationNodeSize(undefined, undefined, v33);
  return {
    width: Math["max"](1, Number(v33) || AI_GENERATION_NODE_SHORT_SIDE),
    height: Math["max"](1, Number(v33) || AI_GENERATION_NODE_SHORT_SIDE),
  };
}
export function buildSourceMediaNodePayload(v35 = {}) {
  const v36 = String(v35["type"] || "")["trim"]();
  if (v36 !== "source-image" && v36 !== "source-video")
    throw new Error("Unsupported source media type: " + (v36 || "unknown"));
  const v37 = {
    ...v35,
    id: v35["id"],
    type: v36,
    x: Number(v35["x"]) || 0,
    y: Number(v35["y"]) || 0,
    src: v35["src"] || "",
    localPath: v35["localPath"] || "",
    fileName: v35["fileName"] || "",
    name: v35["name"] || getDefaultNodeName(v36),
  };
  (delete v37["naturalWidth"], delete v37["naturalHeight"]);
  const v38 = Number(v35["naturalWidth"] || 0),
    v39 = Number(v35["naturalHeight"] || 0),
    v40 = Number(v35["width"] || 0),
    v41 = Number(v35["height"] || 0),
    v42 = v38 > 0 && v39 > 0,
    v43 = v40 > 0 && v41 > 0,
    v44 =
      v43 &&
      (v35["needsAutoResize"] === false ||
        v35["fixedSize"] === true ||
        v35["useExplicitSizeAsSource"] === true),
    v45 = v42
      ? getAutoMediaSizeByShortSide(v38, v39)
      : v44
        ? { width: v40, height: v41 }
        : getNodeDefaultSize(v36),
    v46 = !!String(v35["src"] || v35["localPath"] || "")["trim"](),
    v47 =
      typeof v35["needsAutoResize"] === "boolean"
        ? v35["needsAutoResize"]
        : !v42 && !v44;
  return (
    v47 && v37["fixedSize"] && (v37["fixedSize"] = false),
    { ...v37, width: v45["width"], height: v45["height"], needsAutoResize: v47 }
  );
}
export function buildSourceAudioNodePayload(v48 = {}) {
  const v49 = String(v48["type"] || "source-audio")["trim"]();
  if (v49 !== "source-audio")
    throw new Error("Unsupported source audio type: " + (v49 || "unknown"));
  const v50 = getNodeDefaultSize("source-audio"),
    v51 = Number(v48["width"]) > 0 ? Number(v48["width"]) : v50["width"],
    v52 = Number(v48["height"]) > 0 ? Number(v48["height"]) : v50["height"];
  return {
    ...v48,
    id: v48["id"],
    type: "source-audio",
    x: Number(v48["x"]) || 0,
    y: Number(v48["y"]) || 0,
    width: v51,
    height: v52,
    src: v48["src"] || "",
    localPath: v48["localPath"] || "",
    fileName: v48["fileName"] || "",
    name: v48["name"] || getDefaultNodeName("source-audio"),
    needsAutoResize: false,
    fixedSize: typeof v48["fixedSize"] === "boolean" ? v48["fixedSize"] : true,
  };
}
function generateNodeId(v53, v54 = 0) {
  return (
    v53 +
    "-" +
    Date["now"]() +
    "-" +
    Math["random"]()["toString"](36)["slice"](2, 7) +
    "-" +
    v54
  );
}
const WEB_PREVIEW_IMAGE_DROP_MIME = "application/x-ai-canvas-web-preview-image",
  IMAGE_URL_EXTENSION_RE = /\.(?:png|jpe?g|webp|gif|bmp|svg|avif)(?:[?#].*)?$/i;
function normalizeHttpDropUrl(v55) {
  const v56 = String(v55 || "")["trim"]();
  if (!v56) return "";
  try {
    const v57 = new URL(
      v56,
      globalThis["location"]?.["href"] || "https://example.invalid/",
    );
    if (v57["protocol"] !== "http:" && v57["protocol"] !== "https:") return "";
    return ((v57["username"] = ""), (v57["password"] = ""), v57["href"]);
  } catch {
    return "";
  }
}
function readDataTransferText(v58, v59) {
  try {
    return String(v58?.["getData"]?.(v59) || "")["trim"]();
  } catch {
    return "";
  }
}
function parseWebPreviewImagePayload(v60) {
  try {
    const v61 = JSON["parse"](String(v60 || ""));
    if (v61?.["kind"] !== "image") return "";
    return normalizeHttpDropUrl(v61["url"]);
  } catch {
    return "";
  }
}
function extractFirstUriListUrl(v62) {
  return (
    String(v62 || "")
      ["split"](/\r?\n/)
      ["map"]((v63) => v63["trim"]())
      ["find"]((v64) => v64 && !v64["startsWith"]("#")) || ""
  );
}
function decodeHtmlAttribute(v65) {
  return String(v65 || "")
    ["replace"](/&amp;/g, "&")
    ["replace"](/&quot;/g, "\x22")
    ["replace"](/&#39;/g, "\x27")
    ["replace"](/&lt;/g, "<")
    ["replace"](/&gt;/g, ">");
}
function extractImageUrlFromHtml(v66) {
  const v67 = String(v66 || ""),
    v68 = v67["match"](/<img\b[^>]*\bsrc\s*=\s*(["'])(?<src>.*?)\1/i);
  return normalizeHttpDropUrl(
    decodeHtmlAttribute(v68?.["groups"]?.["src"] || ""),
  );
}
function looksLikeImageUrl(v69) {
  const v70 = normalizeHttpDropUrl(v69);
  if (!v70) return "";
  try {
    const v71 = new URL(v70);
    if (IMAGE_URL_EXTENSION_RE["test"](v71["pathname"])) return v70;
    const v72 =
      v71["searchParams"]["get"]("format") ||
      v71["searchParams"]["get"]("type") ||
      "";
    return /^(?:png|jpe?g|webp|gif|bmp|svg|avif)$/i["test"](v72) ? v70 : "";
  } catch {
    return "";
  }
}
export function extractWebImageDropUrl(v73) {
  const v74 = parseWebPreviewImagePayload(
    readDataTransferText(v73, WEB_PREVIEW_IMAGE_DROP_MIME),
  );
  if (v74) return v74;
  const v75 = extractImageUrlFromHtml(readDataTransferText(v73, "text/html"));
  if (v75) return v75;
  const v76 = looksLikeImageUrl(
    extractFirstUriListUrl(readDataTransferText(v73, "text/uri-list")),
  );
  if (v76) return v76;
  return looksLikeImageUrl(readDataTransferText(v73, "text/plain"));
}
function getRemoteImageFileName(v77) {
  try {
    const v78 = new URL(v77),
      v79 = decodeURIComponent(
        v78["pathname"]["split"]("/")["filter"](Boolean)["pop"]() || "",
      );
    return v79 || "网页图片";
  } catch {
    return "网页图片";
  }
}
export function buildWebImageDropNodePayload({
  url: v80,
  worldX: v81,
  worldY: v82,
  nodeId: v83,
} = {}) {
  const v84 = normalizeHttpDropUrl(v80);
  if (!v84) return null;
  const v85 = getRemoteImageFileName(v84);
  return buildSourceMediaNodePayload({
    id: v83 || generateNodeId("source-image"),
    type: "source-image",
    x: v81,
    y: v82,
    src: v84,
    imageUrl: v84,
    sourceUrl: v84,
    capturePreviewUrl: v84,
    fileName: v85,
    name: getBaseName(v85) || "网页图片",
    needsAutoResize: true,
  });
}
function createObjectUrlForFilePreview(v86) {
  const v87 = String(v86?.["type"] || "")["trim"]();
  if (!v87["startsWith"]("image/") && !v87["startsWith"]("video/")) return "";
  const v88 = globalThis["window"]?.["URL"] || globalThis["URL"];
  if (typeof v88?.["createObjectURL"] !== "function") return "";
  try {
    return v88["createObjectURL"](v86);
  } catch {
    return "";
  }
}
function revokeObjectUrl(v89) {
  const v90 = String(v89 || "")["trim"]();
  if (!v90["startsWith"]("blob:")) return;
  const v91 = globalThis["window"]?.["URL"] || globalThis["URL"];
  if (typeof v91?.["revokeObjectURL"] !== "function") return;
  try {
    v91["revokeObjectURL"](v90);
  } catch {}
}
function scheduleRevokeObjectUrl(v92) {
  const v93 = String(v92 || "")["trim"]();
  if (!v93["startsWith"]("blob:")) return;
  const v94 = globalThis["window"]?.["setTimeout"] || globalThis["setTimeout"];
  if (typeof v94 === "function") {
    v94(() => revokeObjectUrl(v93), 0);
    return;
  }
  revokeObjectUrl(v93);
}
function normalizeNaturalSize(v95, v96) {
  const v97 = Math["round"](Number(v95) || 0),
    v98 = Math["round"](Number(v96) || 0);
  if (v97 <= 0 || v98 <= 0) return null;
  return { width: v97, height: v98 };
}
function pickNaturalSize(v99 = {}) {
  return normalizeNaturalSize(
    v99?.["width"] ?? v99?.["naturalWidth"],
    v99?.["height"] ?? v99?.["naturalHeight"],
  );
}
async function readImageFileNaturalSize(v100) {
  if (!v100) return null;
  const v101 = globalThis?.["createImageBitmap"];
  if (typeof v101 === "function")
    try {
      const v102 = await v101(v100),
        v103 = normalizeNaturalSize(v102?.["width"], v102?.["height"]);
      if (typeof v102?.["close"] === "function") v102["close"]();
      if (v103) return v103;
    } catch {}
  const v104 = globalThis["Image"] || globalThis["window"]?.["Image"],
    v105 = globalThis["window"]?.["URL"] || globalThis["URL"];
  if (!v104 || typeof v105?.["createObjectURL"] !== "function") return null;
  let v106 = "";
  try {
    v106 = v105["createObjectURL"](v100);
  } catch {
    return null;
  }
  return new Promise((v107) => {
    const v108 = new v104();
    let v109 = false,
      v110 = null;
    const v111 = (v112) => {
      if (v109) return;
      v109 = true;
      if (v110) clearTimeout(v110);
      (revokeObjectUrl(v106), v107(v112));
    };
    ((v110 = setTimeout(() => v111(null), 2000)),
      (v108["onload"] = () =>
        v111(
          normalizeNaturalSize(
            v108["naturalWidth"] || v108["width"],
            v108["naturalHeight"] || v108["height"],
          ),
        )),
      (v108["onerror"] = () => v111(null)),
      (v108["src"] = v106));
  });
}
async function readVideoFileNaturalSize(v113) {
  const v114 = globalThis["document"],
    v115 = globalThis["window"]?.["URL"] || globalThis["URL"];
  if (!v113 || typeof v114?.["createElement"] !== "function") return null;
  if (typeof v115?.["createObjectURL"] !== "function") return null;
  let v116 = "";
  try {
    v116 = v115["createObjectURL"](v113);
  } catch {
    return null;
  }
  return new Promise((v117) => {
    const v118 = v114["createElement"]("video");
    let v119 = false,
      v120 = null;
    const v121 = (v122) => {
      if (v119) return;
      v119 = true;
      if (v120) clearTimeout(v120);
      v118["removeAttribute"]("src");
      try {
        v118["load"]?.();
      } catch {}
      (revokeObjectUrl(v116), v117(v122));
    };
    ((v120 = setTimeout(() => v121(null), 2500)),
      (v118["preload"] = "metadata"),
      (v118["muted"] = true),
      (v118["onloadedmetadata"] = () =>
        v121(normalizeNaturalSize(v118["videoWidth"], v118["videoHeight"]))),
      (v118["onerror"] = () => v121(null)),
      (v118["src"] = v116));
  });
}
export async function readFileNaturalSize(v123, v124 = "") {
  const v125 = String(v124 || getNodeTypeByFile(v123) || "")["trim"]();
  if (v125 === "source-image") return readImageFileNaturalSize(v123);
  if (v125 === "source-video") return readVideoFileNaturalSize(v123);
  return null;
}
function getElectronImportLocalFile() {
  const v126 = globalThis["window"]?.["electronAPI"]?.["importLocalFile"];
  return typeof v126 === "function" ? v126 : null;
}
function getElectronLocalPreviewUrl() {
  const v127 = globalThis["window"]?.["electronAPI"]?.["getLocalPreviewUrl"];
  return typeof v127 === "function" ? v127 : null;
}
function getElectronFilePath(v128) {
  if (!globalThis["window"]?.["electronAPI"]) return "";
  const v129 = String(v128?.["path"] || "")["trim"]();
  if (v129)
    return (
      _profileDragImport("electron-file-path:direct", {
        name: v128?.["name"] || "",
        path: v129,
      }),
      v129
    );
  const v130 = globalThis["window"]?.["electronAPI"]?.["getPathForFile"];
  if (typeof v130 !== "function")
    return (
      _profileDragImport("electron-file-path:missing-api", {
        name: v128?.["name"] || "",
        hasElectronAPI: !!globalThis["window"]?.["electronAPI"],
      }),
      ""
    );
  try {
    const v131 = String(v130(v128) || "")["trim"]();
    return (
      _profileDragImport("electron-file-path:webutils", {
        name: v128?.["name"] || "",
        path: v131,
      }),
      v131
    );
  } catch (v132) {
    return (
      _profileDragImport("electron-file-path:error", {
        name: v128?.["name"] || "",
        error: _toOneLineMessage(v132),
      }),
      ""
    );
  }
}
function canUseElectronLocalImport(v133) {
  return !!(getElectronImportLocalFile() && getElectronFilePath(v133));
}
function isPreviewablePendingFile(v134, v135 = "") {
  const v136 = String(v134?.["type"] || "")["trim"]();
  return (
    v135 === "source-image" ||
    v135 === "source-video" ||
    v136["startsWith"]("image/") ||
    v136["startsWith"]("video/")
  );
}
function isAllowedCapturePreviewUrl(v137) {
  const v138 = String(v137 || "")["trim"]();
  return (
    v138["startsWith"]("blob:") ||
    v138["startsWith"]("data:image/") ||
    v138["startsWith"]("aic-local-preview:")
  );
}
async function createCapturePreviewUrlForFile(v139, v140 = "") {
  if (!isPreviewablePendingFile(v139, v140)) return "";
  const v141 = getElectronLocalPreviewUrl(),
    v142 = getElectronImportLocalFile();
  if (v141 && v142) {
    const v143 = getElectronFilePath(v139);
    if (v143)
      try {
        const v144 = await v141({
            path: v143,
            name: v139?.["name"] || "",
            type: v139?.["type"] || "",
          }),
          v145 =
            typeof v144 === "string"
              ? v144
              : String(v144?.["url"] || "")["trim"]();
        if (isAllowedCapturePreviewUrl(v145))
          return (
            _profileDragImport("electron-preview-url:done", {
              name: v139?.["name"] || "",
              url: v145,
            }),
            v145
          );
      } catch (v146) {
        _profileDragImport("electron-preview-url:error", {
          name: v139?.["name"] || "",
          error: _toOneLineMessage(v146),
        });
      }
  }
  return createObjectUrlForFilePreview(v139);
}
async function importFileWithBestAvailableFlow(v147, v148, v149 = "") {
  const v150 = getElectronImportLocalFile();
  if (v150) {
    const v151 = getElectronFilePath(v147);
    if (v151)
      try {
        const v152 = await v150({
          path: v151,
          name: v147?.["name"] || "",
          type: v147?.["type"] || "",
          projectId: v148,
        });
        _profileDragImport("electron-import:done", {
          name: v147?.["name"] || "",
          localPath: v152?.["localPath"] || "",
          displayLocalPath: v152?.["displayLocalPath"] || "",
          thumbLocalPath: v152?.["thumbLocalPath"] || "",
        });
        const v153 = String(v152?.["localPath"] || "")["trim"](),
          v154 = !!String(
            v152?.["displayLocalPath"] ||
              v152?.["thumbLocalPath"] ||
              v152?.["originalLocalPath"] ||
              "",
          )["trim"]();
        if (v152 && v149 === "source-image" && v153 && !v154)
          try {
            _profileDragImport("ensure-derivatives:start", { localPath: v153 });
            const v155 = await ensureLocalImageDerivatives(v153);
            return (
              _profileDragImport("ensure-derivatives:done", {
                localPath: v155?.["localPath"] || "",
                displayLocalPath: v155?.["displayLocalPath"] || "",
                thumbLocalPath: v155?.["thumbLocalPath"] || "",
              }),
              v155
            );
          } catch (v156) {
            return (
              console["warn"](
                "[fileService]\x20Electron\x20本地导入图片派生生成失败，使用原始文件:",
                v156,
              ),
              v152
            );
          }
        if (v152) return v152;
      } catch (v157) {
        console["warn"](
          "[fileService] Electron 本地导入失败，回退上传流程:",
          v157,
        );
      }
  }
  return uploadFile(v147, v148);
}
export function buildPendingFileNodePayload(v158, v159, v160, v161, v162 = {}) {
  const v163 = getNodeTypeByFile(v158);
  if (!v163 || v163 === "source-text") return null;
  const v164 = v161 || generateNodeId(v163),
    v165 = getBaseName(v158?.["name"]),
    v166 = pickNaturalSize(
      v162["mediaNaturalSize"] || {
        width: v162["naturalWidth"],
        height: v162["naturalHeight"],
      },
    ),
    v167 = {
      id: v164,
      type: v163,
      x: v159,
      y: v160,
      fileName: v158?.["name"] || "",
      name: v165 || getDefaultNodeName(v163),
      isGenerating: true,
      jobStatus: "running",
      jobError: null,
      generationStartTime: Date["now"](),
      generationDuration: null,
    };
  if (v163 === "source-image" || v163 === "source-video")
    return buildSourceMediaNodePayload({
      ...v167,
      naturalWidth: v166?.["width"],
      naturalHeight: v166?.["height"],
      capturePreviewUrl:
        typeof v162["capturePreviewUrl"] === "string"
          ? v162["capturePreviewUrl"]
          : createObjectUrlForFilePreview(v158),
    });
  if (v163 === "source-audio") return buildSourceAudioNodePayload(v167);
  return null;
}
function readTextFile(v168) {
  return new Promise((v169, v170) => {
    const v171 = new FileReader();
    ((v171["onload"] = (v172) => v169(v172["target"]["result"])),
      (v171["onerror"] = v170),
      v171["readAsText"](v168, "UTF-8"));
  });
}
export async function processFile(v173, v174, v175, v176, v177 = {}) {
  const v178 = getNodeTypeByFile(v173);
  if (!v178)
    return (
      console["warn"]("[fileService] 暂不支持此类型文件: " + v173["type"]),
      showWarning(
        "暂不支持该文件类型：" + (v173["name"] || v173["type"] || "未知文件"),
      ),
      null
    );
  const { width: v179, height: v180 } = getNodeDefaultSize(v178),
    v181 = v177?.["nodeId"] || generateNodeId(v178),
    v182 = getBaseName(v173["name"]),
    v183 = pickNaturalSize(
      v177?.["mediaNaturalSize"] || {
        width: v177?.["naturalWidth"],
        height: v177?.["naturalHeight"],
      },
    );
  try {
    if (v178 === "source-text") {
      const v184 = await readTextFile(v173);
      return {
        id: v181,
        type: v178,
        x: v174,
        y: v175,
        width: v179,
        height: v180,
        text: v184,
        content: v184,
        fileName: v173["name"],
        name: v182 || "文本",
        isGenerating: false,
        jobStatus: null,
        jobError: null,
      };
    } else {
      const v185 =
          v178 === "source-image" && !canUseElectronLocalImport(v173)
            ? (() => {
                const v186 = URL["createObjectURL"](v173);
                return generateThumbnail(v186)["finally"](() => {
                  URL["revokeObjectURL"](v186);
                });
              })()
            : Promise["resolve"](null),
        v187 = await importFileWithBestAvailableFlow(v173, v176, v178),
        v188 = await v185,
        v189 = pickResultLocalPath(v187),
        v190 = localPathToUrl(v189);
      if (v178 === "source-image" && v188)
        try {
          await setThumbnail(
            { localPath: v189, src: v190, imageUrl: v190 },
            v188,
          );
        } catch (v191) {
          console["warn"]("[fileService] 写入缩略图缓存失败:", v191);
        }
      const v192 =
          v178 === "source-image" ? buildImageNodeStorageFields(v187) : {},
        v193 = {
          assetId: v187["assetId"] || "",
          originalLocalPath:
            v187["originalLocalPath"] || v187["localPath"] || "",
          displayLocalPath: v187["displayLocalPath"] || "",
          posterLocalPath: v187["posterLocalPath"] || "",
          waveformLocalPath: v187["waveformLocalPath"] || "",
          derivativeStatus: v187["derivativeStatus"] || v187["status"] || "",
          mediaTaskId: v187["mediaTaskId"] || "",
          mediaTaskKind: v187["mediaTaskKind"] || "",
          mediaTaskStatus: v187["mediaTaskStatus"] || "",
          mediaTaskProgress: Number(v187["mediaTaskProgress"] || 0) || 0,
          mediaTaskError: v187["mediaTaskError"] || "",
          videoProxyStatus: v187["videoProxyStatus"] || "",
          videoCodec: v187["videoCodec"] || "",
          videoDuration: Number(v187["videoDuration"] || 0) || 0,
          videoFps: Number(v187["videoFps"] || 0) || 0,
        };
      v178 === "source-video" &&
        (v187["posterLocalPath"] || v187["posterUrl"] || v187["thumbUrl"]) &&
        ((v193["thumbUrl"] = v187["posterUrl"] || v187["thumbUrl"] || ""),
        (v193["thumbLocalPath"] =
          v187["posterLocalPath"] || v187["thumbLocalPath"] || ""));
      const v194 = String(v187["mediaTaskStatus"] || "")["trim"](),
        v195 = String(v187["videoProxyStatus"] || "")["trim"](),
        v196 = v194 === "waiting" || v194 === "processing",
        v197 =
          v178 === "source-video" &&
          v196 &&
          isAllowedCapturePreviewUrl(v177?.["capturePreviewUrl"])
            ? String(v177["capturePreviewUrl"] || "")["trim"]()
            : "",
        v198 =
          Number(v187["videoWidth"] || v187["width"] || 0) ||
          v183?.["width"] ||
          0,
        v199 =
          Number(v187["videoHeight"] || v187["height"] || 0) ||
          v183?.["height"] ||
          0,
        v200 =
          Number(v192["originalWidth"] || v187["originalWidth"] || 0) ||
          v183?.["width"] ||
          0,
        v201 =
          Number(v192["originalHeight"] || v187["originalHeight"] || 0) ||
          v183?.["height"] ||
          0,
        v202 =
          v178 === "source-video" && v195 === "processing"
            ? ""
            : localPathToUrl(v187["displayLocalPath"]) || v190,
        v203 =
          v178 === "source-image"
            ? {
                originalWidth: v200 || undefined,
                originalHeight: v201 || undefined,
                imageWidth: v200 || undefined,
                imageHeight: v201 || undefined,
              }
            : {},
        v204 =
          v178 === "source-video"
            ? { videoWidth: v198, videoHeight: v199 }
            : {},
        v205 = {
          id: v181,
          type: v178,
          x: v174,
          y: v175,
          width: v179,
          height: v180,
          src: v178 === "source-video" ? v202 : v190,
          localPath: v189,
          ...v193,
          ...v192,
          fileName: v173["name"],
          name: v182 || getDefaultNodeName(v178),
          ...v203,
          naturalWidth: v178 === "source-video" ? v198 : v200,
          naturalHeight: v178 === "source-video" ? v199 : v201,
          ...v204,
          isGenerating: v196,
          jobStatus: v196 ? "running" : null,
          jobError: null,
          generationDuration: null,
          capturePreviewUrl: v197,
        };
      if (v178 === "source-image" || v178 === "source-video")
        return buildSourceMediaNodePayload(v205);
      return v205;
    }
  } catch (v206) {
    console["error"]("[fileService] 文件 " + v173["name"] + " 处理失败:", v206);
    throw v206;
  }
}
export async function handleFileDrop(v207, v208) {
  const v209 = v207["dataTransfer"]["files"];
  if (!v209 || v209["length"] === 0) return false;
  _profileDragImport("drop:start", { count: v209["length"], projectId: v208 });
  if (v209["length"] === 1 && v209[0]["name"]["endsWith"](".json"))
    return false;
  (v207["preventDefault"](), v207["stopPropagation"]());
  const { viewport: v210 } = appStore["getState"](),
    v211 = screenToWorld(v207["clientX"], v207["clientY"], v210);
  let v212 = v211["x"],
    v213 = v211["y"],
    v214 = false;
  for (let v215 = 0; v215 < v209["length"]; v215++) {
    const v216 = v209[v215],
      v217 = getNodeTypeByFile(v216);
    _profileDragImport("file:start", {
      name: v216?.["name"] || "",
      type: v216?.["type"] || "",
      size: v216?.["size"] || 0,
      nodeType: v217,
      canUseElectronLocalImport: canUseElectronLocalImport(v216),
    });
    let v218 = "",
      v219 = null;
    v217 &&
      v217 !== "source-text" &&
      ((v218 = await createCapturePreviewUrlForFile(v216, v217)),
      v217 !== "source-video" &&
        (v219 = await readFileNaturalSize(v216, v217)));
    v219 &&
      _profileDragImport("file:natural-size", {
        name: v216?.["name"] || "",
        width: v219["width"],
        height: v219["height"],
      });
    const v220 =
        v217 && v217 !== "source-text"
          ? buildPendingFileNodePayload(
              v216,
              v212,
              v213,
              generateNodeId(v217, v215),
              { capturePreviewUrl: v218, mediaNaturalSize: v219 },
            )
          : null,
      v221 = v220?.["capturePreviewUrl"] || "";
    v220 &&
      (appStore["addNode"](v220),
      appStore["setSelectedNodes"]([v220["id"]]),
      _profileDragImport("pending:add", {
        id: v220["id"],
        name: v216?.["name"] || "",
        hasCapturePreviewUrl: !!v220["capturePreviewUrl"],
        jobStatus: v220["jobStatus"] || "",
      }),
      (v214 = true),
      (v212 += 30),
      (v213 += 30));
    try {
      _profileDragImport("process:start", {
        name: v216?.["name"] || "",
        pendingId: v220?.["id"] || "",
      });
      const v222 = await processFile(
        v216,
        v220 ? v220["x"] : v212,
        v220 ? v220["y"] : v213,
        v208,
        v220
          ? {
              nodeId: v220["id"],
              mediaNaturalSize: v219,
              capturePreviewUrl: v218,
            }
          : { mediaNaturalSize: v219, capturePreviewUrl: v218 },
      );
      _profileDragImport("process:done", {
        name: v216?.["name"] || "",
        pendingId: v220?.["id"] || "",
        localPath: v222?.["localPath"] || "",
        displayLocalPath: v222?.["displayLocalPath"] || "",
        thumbLocalPath: v222?.["thumbLocalPath"] || "",
        jobStatus: v222?.["jobStatus"] || "",
      });
      if (v222) {
        if (v220) {
          const v223 = appStore["getState"]()["nodes"]?.[v220["id"]];
          v223
            ? (appStore["updateNodeData"](v220["id"], v222),
              _profileDragImport("pending:update-final", {
                id: v220["id"],
                localPath: v222?.["localPath"] || "",
                displayLocalPath: v222?.["displayLocalPath"] || "",
                thumbLocalPath: v222?.["thumbLocalPath"] || "",
              }),
              v222["capturePreviewUrl"] !== v221 &&
                scheduleRevokeObjectUrl(v221))
            : revokeObjectUrl(v221);
        } else
          (appStore["addNode"](v222),
            appStore["setSelectedNodes"]([v222["id"]]),
            (v214 = true),
            (v212 += 30),
            (v213 += 30));
      }
    } catch (v224) {
      const v225 = _toOneLineMessage(v224);
      (void logDiagnosticEvent({
        type: "import.file_failed",
        level: "error",
        source: "renderer",
        message: v225 || "导入失败",
        error: v224,
        context: {
          fileName: v216?.["name"] || "",
          fileType: v216?.["type"] || "",
          fileSize: Number(v216?.["size"] || 0) || 0,
          projectId: v208 || "",
        },
      }),
        v220 &&
          appStore["getState"]()["nodes"]?.[v220["id"]] &&
          appStore["updateNodeData"](v220["id"], {
            isGenerating: false,
            jobStatus: "error",
            jobError: v225 || "导入失败",
            generationDuration:
              Date["now"]() -
              Number(v220["generationStartTime"] || Date["now"]()),
            capturePreviewUrl: "",
          }),
        revokeObjectUrl(v221),
        showError(
          "导入失败：" +
            (v216?.["name"] || "文件") +
            "。" +
            (v225 ? "原因：" + v225 : ""),
        ),
        console["error"]("[fileService]\x20处理文件失败:", v224));
    }
  }
  return v214;
}
export async function handleWebImageUrlDrop(v226, v227 = {}) {
  const v228 = extractWebImageDropUrl(v226?.["dataTransfer"]);
  if (!v228) return false;
  (v226?.["preventDefault"]?.(), v226?.["stopPropagation"]?.());
  const v229 = v227["storeInstance"] || appStore,
    v230 = typeof v229["getState"] === "function" ? v229["getState"]() : {},
    v231 = screenToWorld(
      v226?.["clientX"] || 0,
      v226?.["clientY"] || 0,
      v230["viewport"] || {},
    ),
    v232 = buildWebImageDropNodePayload({
      url: v228,
      worldX: v231["x"],
      worldY: v231["y"],
    });
  if (!v232) return false;
  return (
    v229["addNode"]?.(v232),
    v229["setSelectedNodes"]?.([v232["id"]]),
    _profileDragImport("web-image:add", { id: v232["id"], url: v228 }),
    true
  );
}
export function downloadJson(v233, v234) {
  const v235 = new Blob([JSON["stringify"](v233, null, 2)], {
      type: "application/json",
    }),
    v236 = URL["createObjectURL"](v235),
    v237 = document["createElement"]("a");
  ((v237["href"] = v236),
    (v237["download"] = v234),
    document["body"]["appendChild"](v237),
    v237["click"](),
    document["body"]["removeChild"](v237),
    URL["revokeObjectURL"](v236));
}
export function readJsonFile(v238) {
  return new Promise((v239, v240) => {
    const v241 = new FileReader();
    ((v241["onload"] = (v242) => {
      try {
        const v243 = JSON["parse"](v242["target"]["result"]);
        v239(v243);
      } catch (v244) {
        v240(new Error("JSON 解析失败"));
      }
    }),
      (v241["onerror"] = () => v240(new Error("文件读取失败"))),
      v241["readAsText"](v238));
  });
}

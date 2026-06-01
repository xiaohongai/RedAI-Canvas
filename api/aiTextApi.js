import * as PpioAdapter from "./adapters/PpioAdapter.js";
import { buildTextRequestFromManifest } from "./adapters/ModelApiManifestNormalizer.js";
import { ensureConfig, getProviderConfig } from "./configApi.js";
import { applyCameraAngleToPrompt } from "./cameraPromptApi.js";
import { fetchWithTimeout, buildApiUrl } from "./apiBase.js";
import { resolveMappedResponseValue } from "./adapters/modelApiMappingEngine.js";
import {
  processInputImages,
  processInputImagesPreserveOrder,
  uploadToRunningHub,
} from "./imageUploadApi.js";
import { uploadInputsToVolcengineFiles } from "./volcengineFileApi.js";
import { get as get } from "./requester.js";
import {
  isModelApiModel,
  normalizeProviderId,
  resolveModelExecution,
} from "../src/manifests/index.js";
import { ApiError, parseError, parseNetworkError } from "./errors/index.js";
const GENERATION_TIMEOUT = 5 * 60 * 1000,
  IMAGE_MENTION_RE = /@图片\d+/g,
  VIDEO_MENTION_RE = /@视频\d+/g,
  GPT_TEXT_VIDEO_MEDIA_RE =
    /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp)(?:[?#].*)?$/i,
  GPT_TEXT_AUDIO_MEDIA_RE =
    /\.(?:mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  GPT_TEXT_UNSUPPORTED_MEDIA_RE =
    /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp|mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  RUNNINGHUB_CONTACT_SHEET_MAX_SIDE_PX = 2048,
  RUNNINGHUB_CONTACT_SHEET_GAP_PX = 24,
  RUNNINGHUB_CONTACT_SHEET_MIN_CELL_PX = 256,
  RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS = Object["freeze"]({
    background: "--canvas-contact-sheet-bg",
    cellBackground: "--canvas-contact-sheet-cell-bg",
    cellStroke: "--canvas-contact-sheet-cell-stroke",
    badgeBackground: "--canvas-contact-sheet-badge-bg",
    badgeText: "--canvas-contact-sheet-badge-text",
  }),
  RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS = Object["freeze"]({
    background: "white",
    cellBackground: "whitesmoke",
    cellStroke: "gainsboro",
    badgeBackground: "midnightblue",
    badgeText: "white",
  });
function normalizeInputUrls(v0) {
  return Array["isArray"](v0)
    ? v0["map"]((v1) => String(v1 || "")["trim"]())["filter"](Boolean)
    : [];
}
function hasUnsupportedGptTextMediaUrl(v2) {
  return normalizeInputUrls(v2)["some"]((v3) =>
    GPT_TEXT_UNSUPPORTED_MEDIA_RE["test"](v3),
  );
}
function isLikelyVideoUrl(v4) {
  return GPT_TEXT_VIDEO_MEDIA_RE["test"](String(v4 || "")["trim"]());
}
function isLikelyAudioUrl(v5) {
  return GPT_TEXT_AUDIO_MEDIA_RE["test"](String(v5 || "")["trim"]());
}
function hasUnsupportedGptTextAudioUrl(v6) {
  return normalizeInputUrls(v6)["some"]((v7) => isLikelyAudioUrl(v7));
}
function splitChatCompletionInputUrls(v8) {
  const v9 = [],
    v10 = [],
    v11 = [];
  for (const v12 of normalizeInputUrls(v8)) {
    if (isLikelyVideoUrl(v12)) v10["push"](v12);
    else isLikelyAudioUrl(v12) ? v11["push"](v12) : v9["push"](v12);
  }
  return { imageUrls: v9, videoUrls: v10, audioUrls: v11 };
}
function resolveChatCompletionInputUrls({
  providerId: providerId = "",
  mediaPolicy: mediaPolicy = "",
  inputUrls: v13,
  inputImageUrls: v14,
  inputVideoUrls: v15,
}) {
  const v16 = String(mediaPolicy || "")
      ["trim"]()
      ["toLowerCase"](),
    v17 = normalizeInputUrls(v13),
    v18 = normalizeInputUrls(v14),
    v19 = normalizeInputUrls(v15),
    v20 = splitChatCompletionInputUrls(v17);
  if (v16 === "image-video") {
    if (
      v20["audioUrls"]["length"] > 0 ||
      hasUnsupportedGptTextAudioUrl(v18) ||
      hasUnsupportedGptTextAudioUrl(v19)
    ) {
      const v21 = formatTextProviderLabel(providerId);
      throw new Error(
        v21 + "\x20文本模型暂不支持音频参考，请改用图片或视频参考",
      );
    }
    return {
      inputUrls: v17,
      inputImageUrls: v18["length"] > 0 ? v18 : v20["imageUrls"],
      inputVideoUrls: v19["length"] > 0 ? v19 : v20["videoUrls"],
      allowVideo: true,
      mediaPolicy: v16,
    };
  }
  if (v16 !== "image-only") return v17;
  if (
    v19["length"] > 0 ||
    hasUnsupportedGptTextMediaUrl(v17) ||
    hasUnsupportedGptTextMediaUrl(v18)
  ) {
    const v22 = formatTextProviderLabel(providerId);
    throw new Error(
      v22 +
        " 文本模型已统一使用 GPT 图文格式，暂不支持视频或音频参考，请改用图片参考",
    );
  }
  return v18["length"] > 0 ? v18 : v17;
}
const RUNNINGHUB_POLL_INTERVAL_MS = 3000;
function sleep(v23) {
  return new Promise((v24) => setTimeout(v24, v23));
}
function resolveCssColorValue(v25, v26 = new Set()) {
  const v27 = String(v25 || "")["trim"]();
  if (!v27) return "";
  const v28 = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+?)\s*)?\)$/["exec"](
    v27,
  );
  if (!v28) return v27;
  const v29 = v28[1],
    v30 = (v28[2] || "")["trim"]();
  if (v26["has"](v29)) return resolveCssColorValue(v30, v26);
  return (
    v26["add"](v29),
    readDocumentCssColorToken(v29, v26) || resolveCssColorValue(v30, v26)
  );
}
function readDocumentCssColorToken(v31, v32 = new Set()) {
  const v33 = globalThis?.["document"]?.["documentElement"],
    v34 =
      globalThis?.["getComputedStyle"] ||
      globalThis?.["window"]?.["getComputedStyle"];
  if (!v33 || typeof v34 !== "function") return "";
  const v35 = v34(v33)["getPropertyValue"](v31)["trim"]();
  if (!v35) return "";
  return resolveCssColorValue(v35, v32);
}
function getRunningHubContactSheetPalette() {
  return {
    background:
      readDocumentCssColorToken(
        RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS["background"],
      ) || RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS["background"],
    cellBackground:
      readDocumentCssColorToken(
        RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS["cellBackground"],
      ) || RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS["cellBackground"],
    cellStroke:
      readDocumentCssColorToken(
        RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS["cellStroke"],
      ) || RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS["cellStroke"],
    badgeBackground:
      readDocumentCssColorToken(
        RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS["badgeBackground"],
      ) || RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS["badgeBackground"],
    badgeText:
      readDocumentCssColorToken(
        RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS["badgeText"],
      ) || RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS["badgeText"],
  };
}
function pickFirstNonEmptyString(v36) {
  for (const v37 of v36) {
    if (typeof v37 === "string" && v37["trim"]()) return v37["trim"]();
  }
  return "";
}
function isRunningHubTextModel(v38, v39) {
  return v38 === "runninghub" && isModelApiModel(v39, "runninghub");
}
const MANIFEST_REQUIRED_TEXT_PROVIDERS = Object["freeze"](
  new Set(["apimart", "grsai", "ppio", "runninghub", "volcengine", "nvidia"]),
);
function formatTextProviderLabel(v40) {
  const v41 = normalizeProviderId(v40);
  if (v41 === "apimart") return "APIMart";
  if (v41 === "grsai") return "GRSAI";
  if (v41 === "ppio") return "PPIO";
  if (v41 === "runninghub") return "RunningHub";
  if (v41 === "volcengine") return "Volcengine";
  if (v41 === "nvidia") return "英伟达 NIM";
  return v41 || "Text";
}
function resolveTextExecution(v42 = {}, v43 = "") {
  const v44 = normalizeProviderId(v42?.["provider"]);
  if (v44 === "custom" || v44 === "openai") return null;
  return resolveModelExecution(v43 || v42?.["model"], { providerHint: v44 });
}
function resolveTextProviderId(v45 = {}, v46 = "", v47 = null) {
  if (v45["provider"] === "custom") return "openai";
  return normalizeProviderId(
    v47?.["modelManifest"]?.["provider"] || v45["provider"],
  );
}
function isManifestBackedTextExecution(v48) {
  return (
    v48?.["modelManifest"]?.["kind"] === "text" &&
    v48?.["executionManifest"]?.["kind"] === "text" &&
    v48?.["modelManifest"]?.["adapterType"] === "modelApi" &&
    v48?.["executionManifest"]?.["adapterType"] === "modelApi"
  );
}
function getTextManifestMissingError(v49, v50 = "") {
  const v51 = formatTextProviderLabel(v50);
  if (v50) return new Error(v51 + " text model API manifest missing: " + v49);
  return new Error("Text\x20model\x20API\x20manifest\x20missing:\x20" + v49);
}
function assertTextManifestResolution(v52, v53, v54) {
  if (isManifestBackedTextExecution(v54)) return;
  if (!v53 || MANIFEST_REQUIRED_TEXT_PROVIDERS["has"](normalizeProviderId(v53)))
    throw getTextManifestMissingError(v52, v53);
}
function parseRunningHubResponseData(v55) {
  if (!v55) return {};
  if (typeof v55 === "object") return v55;
  const v56 = String(v55 || "")["trim"]();
  if (!v56) return {};
  try {
    return JSON["parse"](v56);
  } catch {}
  const v57 = extractSseJsonSnapshots(v56);
  if (v57["length"] > 0) {
    const v58 = normalizeChatCompletionSnapshots(v57);
    if (v58) return v58;
    for (const v59 of v57) {
      if (getRunningHubTaskId(v59)) return v59;
    }
    return v57[v57["length"] - 1];
  }
  throw new Error("无法解析 RunningHUB 文本接口响应");
}
function extractSseJsonSnapshots(v60) {
  const v61 = String(v60 || "")
    ["split"]("\x0a")
    ["filter"]((v62) => v62["trim"]()["startsWith"]("data:"));
  if (v61["length"] === 0) return [];
  const v63 = [];
  for (const v64 of v61) {
    const v65 = String(v64 || "")
      ["trim"]()
      ["replace"](/^data:\s*/, "")
      ["trim"]();
    if (!v65 || v65 === "[DONE]") continue;
    try {
      v63["push"](JSON["parse"](v65));
    } catch {}
  }
  return v63;
}
function normalizeChatCompletionSnapshots(v66) {
  const v67 = [];
  let v68 = null,
    v69 = "",
    v70 = "assistant";
  for (const v71 of v66 || []) {
    if (!v71 || typeof v71 !== "object") continue;
    const v72 = v71["choices"] || v71["data"]?.["choices"] || [];
    if (!Array["isArray"](v72) || v72["length"] === 0) continue;
    v68 = v71;
    for (const v73 of v72) {
      if (!v73 || typeof v73 !== "object") continue;
      if (v73["finish_reason"]) v69 = v73["finish_reason"];
      if (typeof v73["delta"]?.["role"] === "string")
        v70 = v73["delta"]["role"] || v70;
      if (typeof v73["message"]?.["role"] === "string")
        v70 = v73["message"]["role"] || v70;
      if (typeof v73["delta"]?.["content"] === "string")
        v67["push"](v73["delta"]["content"]);
      if (typeof v73["message"]?.["content"] === "string")
        v67["push"](v73["message"]["content"]);
      if (typeof v73["text"] === "string") v67["push"](v73["text"]);
    }
  }
  const v74 = v67["join"]("");
  if (!v74) return null;
  return {
    id: v68?.["id"] || "",
    object: "chat.completion",
    choices: [
      {
        index: 0,
        message: { role: v70, content: v74 },
        finish_reason: v69 || "stop",
      },
    ],
  };
}
function getRunningHubTaskId(v75) {
  return String(
    v75?.["taskId"] ||
      v75?.["task_id"] ||
      v75?.["data"]?.["taskId"] ||
      v75?.["data"]?.["task_id"] ||
      v75?.["data"]?.["id"] ||
      v75?.["id"] ||
      "",
  )["trim"]();
}
function isChatCompletionResponse(v76) {
  const v77 = v76?.["choices"] || v76?.["data"]?.["choices"];
  if (Array["isArray"](v77)) return true;
  const v78 = String(v76?.["object"] || v76?.["data"]?.["object"] || "");
  return v78["startsWith"]("chat.completion");
}
function stringifyRunningHubReason(v79) {
  if (v79 == null) return "";
  if (typeof v79 === "string") return v79["trim"]();
  if (typeof v79 === "object") {
    const v80 = pickFirstNonEmptyString([
      v79["message"],
      v79["errorMessage"],
      v79["error"],
      v79["msg"],
      v79["reason"],
      v79["detail"],
    ]);
    if (v80) return v80;
    try {
      return JSON["stringify"](v79);
    } catch {}
  }
  return String(v79 || "")["trim"]();
}
function getRunningHubTextErrorMessage(v81, v82 = "文本生成失败") {
  return (
    pickFirstNonEmptyString([
      v81?.["errorMessage"],
      v81?.["message"],
      v81?.["error"],
      v81?.["msg"],
      stringifyRunningHubReason(v81?.["failedReason"]),
      stringifyRunningHubReason(v81?.["reason"]),
    ]) || v82
  );
}
function sanitizeGeneratedText(v83) {
  return String(v83 || "")
    ["replace"](/<think>[\s\S]*?<\/think>\n?/g, "")
    ["trim"]();
}
function hasImageMentions(v84) {
  return /@图片\d+/["test"](String(v84 || ""));
}
function hasVideoMentions(v85) {
  return /@视频\d+/["test"](String(v85 || ""));
}
function resolveInputFetchUrl(v86) {
  const v87 = String(v86 || "")["trim"]();
  if (!v87) return "";
  if (/^(?:https?:|data:|blob:)/i["test"](v87)) return v87;
  if (v87["startsWith"]("/")) return buildApiUrl(v87);
  return v87;
}
function loadCanvasImageFromObjectUrl(v88) {
  return new Promise((v89, v90) => {
    const v91 = globalThis?.["Image"];
    if (typeof v91 !== "function") {
      v90(new Error("当前环境不支持图片加载"));
      return;
    }
    const v92 = new v91();
    ("crossOrigin" in v92 && (v92["crossOrigin"] = "anonymous"),
      (v92["onload"] = () => v89(v92)),
      (v92["onerror"] = () => v90(new Error("图片加载失败"))),
      (v92["src"] = v88));
  });
}
async function loadCanvasImageSource(v93) {
  const v94 = globalThis?.["createImageBitmap"];
  if (typeof v94 === "function") {
    const v95 = await v94(v93),
      v96 = Number(v95?.["width"] || 0),
      v97 = Number(v95?.["height"] || 0);
    if (v96 > 0 && v97 > 0)
      return {
        handle: v95,
        width: v96,
        height: v97,
        dispose: () => v95?.["close"]?.(),
      };
    v95?.["close"]?.();
  }
  const v98 = globalThis?.["URL"];
  if (typeof v98?.["createObjectURL"] !== "function")
    throw new Error("当前环境不支持多图合成");
  const v99 = v98["createObjectURL"](v93);
  try {
    const v100 = await loadCanvasImageFromObjectUrl(v99),
      v101 = Number(v100?.["naturalWidth"] || v100?.["width"] || 0),
      v102 = Number(v100?.["naturalHeight"] || v100?.["height"] || 0);
    if (!(v101 > 0 && v102 > 0)) throw new Error("图片尺寸无效");
    return {
      handle: v100,
      width: v101,
      height: v102,
      dispose: () => v98["revokeObjectURL"]?.(v99),
    };
  } catch (v103) {
    v98["revokeObjectURL"]?.(v99);
    throw v103;
  }
}
function createCanvasTarget(v104, v105) {
  const v106 = globalThis?.["OffscreenCanvas"];
  if (typeof v106 === "function") {
    const v107 = new v106(v104, v105);
    return {
      canvas: v107,
      toBlob: async () => {
        if (typeof v107["convertToBlob"] === "function")
          return await v107["convertToBlob"]({ type: "image/png" });
        return null;
      },
    };
  }
  if (
    typeof document !== "undefined" &&
    typeof document["createElement"] === "function"
  ) {
    const v108 = document["createElement"]("canvas");
    return (
      (v108["width"] = v104),
      (v108["height"] = v105),
      {
        canvas: v108,
        toBlob: async () =>
          await new Promise((v109) => {
            if (typeof v108["toBlob"] !== "function") {
              v109(null);
              return;
            }
            v108["toBlob"]((v110) => v109(v110), "image/png");
          }),
      }
    );
  }
  throw new Error("当前环境不支持多图合成");
}
function resolveRunningHubContactSheetGrid(v111) {
  const v112 = Math["max"](1, Math["trunc"](Number(v111) || 1)),
    v113 = v112 === 2 ? 2 : Math["ceil"](Math["sqrt"](v112)),
    v114 = Math["ceil"](v112 / v113);
  return { cols: v113, rows: v114 };
}
function resolveRunningHubContactSheetCellSize(v115, v116) {
  const v117 = RUNNINGHUB_CONTACT_SHEET_MAX_SIDE_PX,
    v118 = RUNNINGHUB_CONTACT_SHEET_GAP_PX,
    v119 = Math["floor"]((v117 - v118 * (v115 + 1)) / v115),
    v120 = Math["floor"]((v117 - v118 * (v116 + 1)) / v116);
  return Math["max"](
    RUNNINGHUB_CONTACT_SHEET_MIN_CELL_PX,
    Math["min"](v119, v120),
  );
}
async function composeRunningHubMultiImageBlob(v121) {
  const v122 = normalizeInputUrls(v121),
    v123 = [];
  for (const v124 of v122) {
    try {
      const v125 = await get(resolveInputFetchUrl(v124), {
          provider: "remote",
          buildUrl: false,
          responseType: "blob",
        }),
        v126 = await loadCanvasImageSource(v125);
      v123["push"]({ blob: v125, source: v126 });
    } catch {}
  }
  if (v123["length"] === 0)
    throw new Error("参考图片处理失败，无法合成多图输入");
  if (v123["length"] === 1) {
    const v127 = v123[0]["blob"];
    return (v123[0]["source"]?.["dispose"]?.(), v127);
  }
  try {
    const { cols: v128, rows: v129 } = resolveRunningHubContactSheetGrid(
        v123["length"],
      ),
      v130 = RUNNINGHUB_CONTACT_SHEET_GAP_PX,
      v131 = resolveRunningHubContactSheetCellSize(v128, v129),
      v132 = getRunningHubContactSheetPalette(),
      v133 = v128 * v131 + v130 * (v128 + 1),
      v134 = v129 * v131 + v130 * (v129 + 1),
      { canvas: v135, toBlob: v136 } = createCanvasTarget(v133, v134),
      v137 = v135?.["getContext"]?.("2d");
    if (!v137 || typeof v137["drawImage"] !== "function")
      throw new Error("当前环境不支持多图合成");
    ((v137["fillStyle"] = v132["background"]),
      v137["fillRect"]?.(0, 0, v133, v134));
    const v138 = Math["max"](30, Math["round"](v131 * 0.14)),
      v139 = Math["max"](16, Math["round"](v138 * 0.48));
    v123["forEach"]((v140, v141) => {
      const v142 = Math["floor"](v141 / v128),
        v143 = v141 % v128,
        v144 = v130 + v143 * (v131 + v130),
        v145 = v130 + v142 * (v131 + v130);
      ((v137["fillStyle"] = v132["cellBackground"]),
        v137["fillRect"]?.(v144, v145, v131, v131));
      const v146 = Math["max"](1, Number(v140["source"]["width"] || 1)),
        v147 = Math["max"](1, Number(v140["source"]["height"] || 1)),
        v148 = Math["min"](v131 / v146, v131 / v147),
        v149 = Math["max"](1, Math["round"](v146 * v148)),
        v150 = Math["max"](1, Math["round"](v147 * v148)),
        v151 = v144 + Math["round"]((v131 - v149) / 2),
        v152 = v145 + Math["round"]((v131 - v150) / 2);
      (v137["drawImage"](v140["source"]["handle"], v151, v152, v149, v150),
        (v137["strokeStyle"] = v132["cellStroke"]),
        (v137["lineWidth"] = 2),
        v137["strokeRect"]?.(v144 + 1, v145 + 1, v131 - 2, v131 - 2),
        (v137["fillStyle"] = v132["badgeBackground"]),
        v137["fillRect"]?.(v144 + 12, v145 + 12, v138, v138),
        (v137["fillStyle"] = v132["badgeText"]),
        (v137["font"] = "600 " + v139 + "px sans-serif"),
        (v137["textAlign"] = "center"),
        (v137["textBaseline"] = "middle"),
        v137["fillText"]?.(
          String(v141 + 1),
          v144 + 12 + v138 / 2,
          v145 + 12 + v138 / 2,
        ));
    });
    const v153 = await v136();
    if (!v153) throw new Error("多图合成失败");
    return v153;
  } finally {
    v123["forEach"]((v154) => {
      v154["source"]?.["dispose"]?.();
    });
  }
}
async function buildRunningHubTextImageUrl(v155, v156) {
  const v157 = normalizeInputUrls(v155);
  if (v157["length"] === 0) return "";
  if (v157["length"] === 1) {
    const v158 = await processInputImages(v157, v156, {
      applyInputQualityProfile: true,
      provider: "runninghub",
      preferFree: false,
      strictUpload: true,
    });
    return String(v158[0] || "")["trim"]();
  }
  const v159 = await composeRunningHubMultiImageBlob(v157);
  return String(await uploadToRunningHub(v159, v156))["trim"]();
}
function mergeAdjacentTextParts(
  v160,
  { createTextPart: v161, isTextPart: v162 },
) {
  const v163 = [];
  let v164 = "";
  const v165 = () => {
    if (!v164) return;
    (v163["push"](v161(v164)), (v164 = ""));
  };
  for (const v166 of v160) {
    if (!v166) continue;
    if (v162(v166)) {
      v164 += String(v166["text"] || "");
      continue;
    }
    (v165(), v163["push"](v166));
  }
  return (v165(), v163);
}
function buildPromptMediaParts(
  v167,
  v168,
  { createTextPart: v169, isTextPart: v170 },
  v171 = {},
) {
  const v172 = String(v167 || ""),
    v173 = normalizePromptMediaGroups(v168, v171),
    v174 = v173["some"]((v175) => v175["parts"]["length"] > 0);
  if (!v174) return v172 ? [v169(v172)] : [];
  const v176 = [],
    v177 = new Set(),
    v178 = [];
  for (const v179 of v173) {
    v179["mentionRe"]["lastIndex"] = 0;
    let v180;
    while ((v180 = v179["mentionRe"]["exec"](v172))) {
      const v181 = Number["parseInt"](v180[0]["replace"](/\D+/g, ""), 10),
        v182 = Number["isFinite"](v181) ? Math["max"](0, v181 - 1) : -1;
      v178["push"]({
        index: v180["index"],
        endIndex: v180["index"] + v180[0]["length"],
        text: v180[0],
        group: v179,
        mediaIndex: v182,
      });
    }
  }
  v178["sort"](
    (v183, v184) =>
      v183["index"] - v184["index"] || v183["endIndex"] - v184["endIndex"],
  );
  let v185 = 0;
  for (const v186 of v178) {
    if (v186["index"] < v185) continue;
    const v187 = v172["slice"](v185, v186["index"]);
    v187 && v176["push"](v169(v187));
    const v188 = v186["group"]["parts"][v186["mediaIndex"]];
    (v188
      ? (v176["push"](v188),
        v177["add"](v186["group"]["kind"] + ":" + v186["mediaIndex"]))
      : v176["push"](v169(v186["text"])),
      (v185 = v186["endIndex"]));
  }
  const v189 = v172["slice"](v185);
  v189 && v176["push"](v169(v189));
  v173["forEach"]((v190) => {
    v190["parts"]["forEach"]((v191, v192) => {
      v191 && !v177["has"](v190["kind"] + ":" + v192) && v176["push"](v191);
    });
  });
  if (v176["length"] === 0)
    return v173["flatMap"]((v193) => v193["parts"]["filter"](Boolean));
  return mergeAdjacentTextParts(v176, {
    createTextPart: v169,
    isTextPart: v170,
  });
}
function normalizePromptMediaGroups(v194, v195 = {}) {
  const v196 =
    Array["isArray"](v194) &&
    v194["some"]((v197) => v197 && Array["isArray"](v197["parts"]))
      ? v194
      : [
          {
            kind: "image",
            mentionRe: IMAGE_MENTION_RE,
            parts: v194,
            preserveSlots: v195?.["preserveSlots"] === true,
          },
        ];
  return v196["map"]((v198, v199) => {
    const v200 =
        v198?.["preserveSlots"] === true || v195?.["preserveSlots"] === true,
      v201 = Array["isArray"](v198?.["parts"])
        ? v200
          ? v198["parts"]["slice"]()
          : v198["parts"]["filter"](Boolean)
        : [];
    return {
      kind: String(v198?.["kind"] || "media" + v199),
      mentionRe: v198?.["mentionRe"] || IMAGE_MENTION_RE,
      parts: v201,
    };
  });
}
function normalizeChatCompletionMediaInput(v202, v203 = {}) {
  const v204 =
      v202 && typeof v202 === "object" && !Array["isArray"](v202) ? v202 : {},
    v205 = normalizeInputUrls(
      v204["inputUrls"] !== undefined ? v204["inputUrls"] : v202,
    ),
    v206 = String(v203["mediaPolicy"] || v204["mediaPolicy"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v207 =
      v203["allowVideo"] === true ||
      v204["allowVideo"] === true ||
      v206 === "image-video",
    v208 = normalizeInputUrls(v203["inputImageUrls"]),
    v209 = normalizeInputUrls(v204["inputImageUrls"]),
    v210 = normalizeInputUrls(v203["inputVideoUrls"]),
    v211 = normalizeInputUrls(v204["inputVideoUrls"]),
    v212 = splitChatCompletionInputUrls(v205);
  return {
    inputImageUrls:
      v208["length"] > 0
        ? v208
        : v209["length"] > 0
          ? v209
          : v207
            ? v212["imageUrls"]
            : v205,
    inputVideoUrls: v207
      ? v210["length"] > 0
        ? v210
        : v211["length"] > 0
          ? v211
          : v212["videoUrls"]
      : [],
  };
}
function resolveChatCompletionVideoUrl(v213, v214) {
  const v215 = String(v213 || "")["trim"]();
  if (!v215) return "";
  if (normalizeProviderId(v214) === "volcengine") {
    if (/^https?:\/\//i["test"](v215)) return v215;
    throw new Error(
      "火山方舟视频输入需要公网可访问的视频\x20URL，当前本地视频无法直接发送",
    );
  }
  return resolveInputFetchUrl(v215);
}
async function buildVolcengineResponsesUserContent(
  v216,
  v217,
  v218,
  v219,
  v220 = {},
) {
  const v221 = normalizeChatCompletionMediaInput(v217, {
      ...v220,
      allowVideo: true,
      mediaPolicy: "image-video",
    }),
    v222 = String(v220["model"] || "")["trim"](),
    v223 =
      v221["inputImageUrls"]["length"] > 0
        ? await uploadInputsToVolcengineFiles(v221["inputImageUrls"], v218, {
            baseUrl: v220["baseUrl"],
            kind: "image",
            model: v222,
          })
        : [],
    v224 =
      v221["inputVideoUrls"]["length"] > 0
        ? await uploadInputsToVolcengineFiles(v221["inputVideoUrls"], v218, {
            baseUrl: v220["baseUrl"],
            kind: "video",
            model: v222,
            videoFps: v220["videoFps"] ?? 0.3,
          })
        : [],
    v225 = v223["map"]((v226) =>
      String(v226 || "")["trim"]()
        ? { type: "input_image", file_id: v226 }
        : null,
    ),
    v227 = v224["map"]((v228) =>
      String(v228 || "")["trim"]()
        ? { type: "input_video", file_id: v228 }
        : null,
    );
  if (
    hasImageMentions(v216) &&
    v221["inputImageUrls"]["length"] > 0 &&
    v225["filter"](Boolean)["length"] === 0
  )
    throw new Error("参考图片处理失败，无法映射 @图片 引用");
  if (
    hasVideoMentions(v216) &&
    v221["inputVideoUrls"]["length"] > 0 &&
    v227["filter"](Boolean)["length"] === 0
  )
    throw new Error("参考视频处理失败，无法映射 @视频 引用");
  return buildPromptMediaParts(
    v216,
    [
      {
        kind: "image",
        mentionRe: IMAGE_MENTION_RE,
        parts: v225,
        preserveSlots: true,
      },
      {
        kind: "video",
        mentionRe: VIDEO_MENTION_RE,
        parts: v227,
        preserveSlots: true,
      },
    ],
    {
      createTextPart: (v229) => ({ type: "input_text", text: v229 }),
      isTextPart: (v230) => !!v230 && v230["type"] === "input_text",
    },
  );
}
async function buildChatCompletionUserContent(
  v231,
  v232,
  v233,
  v234,
  v235 = {},
) {
  const v236 = normalizeChatCompletionMediaInput(v232, v235),
    v237 = v236["inputImageUrls"],
    v238 = v236["inputVideoUrls"],
    v239 = v234 !== "grsai",
    v240 =
      v237["length"] > 0
        ? await processInputImagesPreserveOrder(v237, v233, {
            applyInputQualityProfile: true,
            provider: v234,
            preferFree: v239,
          })
        : [],
    v241 = v240["map"]((v242) =>
      String(v242 || "")["trim"]()
        ? { type: "image_url", image_url: { url: v242 } }
        : null,
    ),
    v243 = v241["filter"](Boolean);
  if (hasImageMentions(v231) && v237["length"] > 0 && v243["length"] === 0)
    throw new Error("参考图片处理失败，无法映射 @图片 引用");
  const v244 = v238["map"]((v245) => {
      const v246 = resolveChatCompletionVideoUrl(v245, v234);
      return v246 ? { type: "video_url", video_url: { url: v246 } } : null;
    }),
    v247 = v244["filter"](Boolean);
  if (hasVideoMentions(v231) && v238["length"] > 0 && v247["length"] === 0)
    throw new Error("参考视频处理失败，无法映射 @视频 引用");
  const v248 = buildPromptMediaParts(
    v231,
    [
      {
        kind: "image",
        mentionRe: IMAGE_MENTION_RE,
        parts: v241,
        preserveSlots: true,
      },
      {
        kind: "video",
        mentionRe: VIDEO_MENTION_RE,
        parts: v244,
        preserveSlots: true,
      },
    ],
    {
      createTextPart: (v249) => ({ type: "text", text: v249 }),
      isTextPart: (v250) => !!v250 && v250["type"] === "text",
    },
  );
  if (v248["length"] === 1 && v248[0]?.["type"] === "text")
    return v248[0]["text"];
  return v248["length"] > 0 ? v248 : String(v231 || "");
}
export async function buildGenerateTextRequest(v251) {
  await ensureConfig();
  const v252 = applyCameraAngleToPrompt(v251["prompt"], v251["cameraAngle"]),
    v253 = v252["length"];
  if (v253 > 50000)
    throw new Error(
      "提示词过长（" +
        v253 +
        " 字符）。为避免接口/代理返回异常，请分段生成：先让模型输出大纲，再按章节逐段生成。",
    );
  const v254 = v251["model"] || "gemini-3.1-pro",
    v255 = resolveTextExecution(v251, v254),
    v256 = resolveTextProviderId(v251, v254, v255);
  assertTextManifestResolution(v254, v256, v255);
  const v257 = getProviderConfig(v256),
    v258 = v257["apiUrl"]["replace"](/\/v1\/?$/, ""),
    v259 = isRunningHubTextModel(v256, v254)
      ? v257["modelApiKey"] || v251["apiKey"]
      : v251["apiKey"] || v257["apiKey"];
  if (!v259)
    throw ApiError["authError"](
      v256,
      null,
      "API\x20Key\x20未配置（厂商：" + v256 + "），无法发起文本生成请求",
    );
  const v260 = normalizeInputUrls(v251["inputUrls"]),
    v261 = normalizeInputUrls(v251["inputImageUrls"]),
    v262 = normalizeInputUrls(v251["inputVideoUrls"]);
  if (isManifestBackedTextExecution(v255)) {
    const v263 = await buildTextRequestFromManifest(
      {
        ...v251,
        model: v254,
        inputUrls: v260,
        inputImageUrls: v261,
        inputVideoUrls: v262,
      },
      v252,
      {
        getProviderConfig: getProviderConfig,
        buildRunningHubTextImageUrl: buildRunningHubTextImageUrl,
        resolveChatCompletionInputUrls: resolveChatCompletionInputUrls,
        buildChatCompletionUserContent: buildChatCompletionUserContent,
        buildVolcengineResponsesUserContent:
          buildVolcengineResponsesUserContent,
      },
      { expectedProvider: v256 },
    );
    if (v263) return v263;
    throw getTextManifestMissingError(v254, v256);
  }
  const v264 = resolveChatCompletionInputUrls({
      providerId: v256,
      inputUrls: v260,
      inputImageUrls: v261,
      inputVideoUrls: v262,
    }),
    v265 = await buildChatCompletionUserContent(v252, v264, v259, v256),
    v266 = {
      model: v254,
      stream: false,
      messages: [
        {
          role: "system",
          content: v251["systemPrompt"] || "You are a helpful assistant.",
        },
        { role: "user", content: v265 },
      ],
    };
  if (
    v256 === "ppio" ||
    v256 === "openai" ||
    v256 === "grsai" ||
    v256 === "nvidia"
  ) {
    let v267;
    if (v256 === "ppio") v267 = PpioAdapter["getTextProxyApiUrl"](v258);
    else {
      if (
        v258["includes"](":generateContent") ||
        v258["includes"]("/v1beta/models") ||
        v258["endsWith"]("/chat/completions") ||
        (v258["includes"]("/api/") && v258["split"]("/api/")["length"] > 1)
      )
        v267 = v258;
      else {
        if (v258["endsWith"]("/api")) v267 = v258;
        else v258["endsWith"]("/v1") ? (v267 = v258) : (v267 = v258 + "/v1");
      }
    }
    return {
      url: "/api/v2/proxy/completions",
      headers: { "Content-Type": "application/json" },
      body: { apiUrl: v267, apiKey: v259, ...v266 },
      isProxy: true,
    };
  }
  let v268;
  if (
    v258["includes"](":generateContent") ||
    v258["includes"]("/v1beta/models") ||
    v258["endsWith"]("/chat/completions") ||
    (v258["includes"]("/api/") && v258["split"]("/api/")["length"] > 1)
  )
    v268 = v258;
  else {
    if (v258["endsWith"]("/api")) v268 = v258 + "/v1/chat/completions";
    else
      v258["endsWith"]("/v1")
        ? (v268 = v258 + "/chat/completions")
        : (v268 = v258 + "/v1/chat/completions");
  }
  return {
    url: v268,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer\x20" + v259,
    },
    body: v266,
    isProxy: false,
  };
}
function parseTextResponse(v269, v270) {
  const v271 = "",
    v272 = v269["length"],
    v273 = v269["slice"](0, 400),
    v274 = v269["slice"](Math["max"](0, v272 - 400)),
    v275 = /<!doctype\s+html|<html[\s>]/i["test"](v273),
    v276 = v269["replace"](/^\uFEFF/, "")["trim"]();
  let v277;
  try {
    v277 = JSON["parse"](v276);
  } catch (v278) {
    const v279 = v276["indexOf"]("{"),
      v280 = v276["lastIndexOf"]("}");
    if (v279 !== -1 && v280 > v279)
      try {
        v277 = JSON["parse"](v276["slice"](v279, v280 + 1));
      } catch {}
    if (!v277) {
      const v281 = v276["split"]("\x0a")["filter"]((v282) =>
        v282["trim"]()["startsWith"]("data:"),
      );
      if (v281["length"] > 0) {
        const v283 = v281[v281["length"] - 1]
          ["replace"](/^data:\s*/, "")
          ["trim"]();
        if (v283 === "[DONE]") {
          const v284 = v281["filter"](
            (v285) => v285["replace"](/^data:\s*/, "")["trim"]() !== "[DONE]",
          );
          if (v284["length"] > 0) {
            const v286 = v284[v284["length"] - 1]
              ["replace"](/^data:\s*/, "")
              ["trim"]();
            v277 = JSON["parse"](v286);
          } else
            throw new ApiError({
              type: "PARSE_ERROR",
              message: "服务端返回了空响应",
              status: v270,
              retryable: false,
            });
        } else
          try {
            v277 = JSON["parse"](v283);
          } catch (v287) {
            throw new ApiError({
              type: "PARSE_ERROR",
              message: "无法解析服务端响应:\x20" + v287["message"],
              status: v270,
              retryable: false,
            });
          }
      } else
        throw new ApiError({
          type: "PARSE_ERROR",
          message:
            "服务端返回的不是可解析的 JSON。HTTP " +
            v270 +
            (v271 ? "\x20(" + v271 + ")" : "") +
            "，长度 " +
            v272 +
            "。\x0a" +
            (v275
              ? "响应看起来像 HTML（常见原因：网关/防火墙拦截、API 地址错误、上游返回了错误页）。\n"
              : "") +
            "响应片段(截断)：\n[开头]\n" +
            v273 +
            "\n[结尾]\n" +
            v274,
          status: v270,
          retryable: false,
        });
    }
  }
  return v277;
}
function extractTextContent(v288, v289 = null) {
  const v290 = resolveMappedResponseValue(
    v288,
    v289?.["resultPaths"] || v289?.["textFields"] || [],
  );
  if (v290) return v290;
  const v291 = v288?.["choices"] || v288?.["data"]?.["choices"];
  let v292 = v291?.[0]?.["message"]?.["content"];
  !v292 && (v292 = v291?.[0]?.["delta"]?.["content"]);
  !v292 &&
    v288?.["data"]?.["candidates"]?.[0]?.["content"]?.["parts"]?.[0]?.[
      "text"
    ] &&
    (v292 = v288["data"]["candidates"][0]["content"]["parts"][0]["text"]);
  !v292 &&
    v288?.["candidates"]?.[0]?.["content"]?.["parts"]?.[0]?.["text"] &&
    (v292 = v288["candidates"][0]["content"]["parts"][0]["text"]);
  if (!v292) {
    const v293 = Array["isArray"](v288?.["output"])
        ? v288["output"]
        : Array["isArray"](v288?.["data"]?.["output"])
          ? v288["data"]["output"]
          : [],
      v294 = v293["flatMap"]((v295) =>
        Array["isArray"](v295?.["content"]) ? v295["content"] : [],
      );
    v292 =
      pickFirstNonEmptyString(v294["map"]((v296) => v296?.["text"])) ||
      pickFirstNonEmptyString(v294["map"]((v297) => v297?.["content"])) ||
      pickFirstNonEmptyString([
        v288?.["output_text"],
        v288?.["data"]?.["output_text"],
      ]);
  }
  if (!v292) {
    const v298 = Array["isArray"](v288?.["results"])
      ? v288["results"]
      : Array["isArray"](v288?.["data"]?.["results"])
        ? v288["data"]["results"]
        : [];
    v292 =
      pickFirstNonEmptyString(v298["map"]((v299) => v299?.["text"])) ||
      pickFirstNonEmptyString([
        v288?.["text"],
        v288?.["output"],
        typeof v288?.["content"] === "string" ? v288["content"] : "",
        v288?.["markdown"],
        v288?.["caption"],
        v288?.["data"]?.["text"],
        v288?.["data"]?.["output"],
        typeof v288?.["data"]?.["content"] === "string"
          ? v288["data"]["content"]
          : "",
      ]);
  }
  return v292;
}
async function pollRunningHubTextTask(v300, v301, v302) {
  const v303 = Date["now"]();
  while (Date["now"]() - v303 < GENERATION_TIMEOUT) {
    await sleep(RUNNINGHUB_POLL_INTERVAL_MS);
    const v304 = await fetchWithTimeout(
      buildApiUrl("/api/v2/proxy/image"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON["stringify"]({
          apiUrl: "https://www.runninghub.cn/openapi/v2/query",
          apiKey: v301,
          taskId: v300,
        }),
      },
      30000,
    );
    if (!v304["ok"]) {
      const v305 = await v304["text"]()["catch"](() => "");
      let v306;
      try {
        v306 = JSON["parse"](v305);
      } catch {
        v306 = { error: v305 };
      }
      throw parseError(v302, v306, v304["status"]);
    }
    const v307 = parseRunningHubResponseData(await v304["text"]()),
      v308 = Number(v307?.["code"]);
    if (Number["isFinite"](v308)) {
      if (v308 === 804 || v308 === 813) continue;
      if (v308 !== 0)
        throw new Error(
          getRunningHubTextErrorMessage(v307, "文本任务轮询失败"),
        );
    }
    const v309 =
        v307?.["data"] && typeof v307["data"] === "object"
          ? v307["data"]
          : v307,
      v310 = String(v309?.["status"] || "")["toUpperCase"]();
    if (["SUCCESS", "SUCCEEDED", "COMPLETED"]["includes"](v310)) return v309;
    if (["FAILED", "FAIL", "ERROR", "CANCELLED", "CANCELED"]["includes"](v310))
      throw new Error(getRunningHubTextErrorMessage(v309, "文本任务执行失败"));
  }
  throw new Error("文本任务超时，请稍后重试");
}
export async function generateText(v311) {
  const v312 = await buildGenerateTextRequest(v311),
    v313 = v311?.["model"] || "gemini-3.1-pro",
    v314 = resolveTextExecution(v311, v313),
    v315 = resolveTextProviderId(v311, v313, v314);
  let v316;
  try {
    const v317 = v312["isProxy"] ? buildApiUrl(v312["url"]) : v312["url"];
    v316 = await fetchWithTimeout(
      v317,
      {
        method: "POST",
        headers: v312["headers"],
        body: JSON["stringify"](v312["body"]),
      },
      GENERATION_TIMEOUT,
    );
  } catch (v318) {
    throw parseNetworkError(v315, v318, GENERATION_TIMEOUT);
  }
  if (!v316["ok"]) {
    const v319 = await v316["text"]()["catch"](() => "");
    let v320;
    try {
      v320 = JSON["parse"](v319);
    } catch {
      v320 = { error: v319 };
    }
    throw parseError(v315, v320, v316["status"]);
  }
  const v321 = await v316["text"]();
  if (isRunningHubTextModel(v315, v311["model"])) {
    const v322 = parseRunningHubResponseData(v321),
      v323 = Number(v322?.["code"]);
    if (Number["isFinite"](v323) && v323 !== 0)
      throw new Error(getRunningHubTextErrorMessage(v322, "文本任务创建失败"));
    const v324 = extractTextContent(v322, v312["responseMapping"]);
    if (v324) return { text: sanitizeGeneratedText(v324) };
    let v325 = v322;
    const v326 = String(v322?.["status"] || v322?.["data"]?.["status"] || "")[
        "toUpperCase"
      ](),
      v327 = isChatCompletionResponse(v322) ? "" : getRunningHubTaskId(v322);
    if (
      ["RUNNING", "PENDING", "QUEUED", "SUBMITTED"]["includes"](v326) ||
      (v327 && !["SUCCESS", "SUCCEEDED", "COMPLETED"]["includes"](v326))
    ) {
      if (!v327) throw new Error("RunningHUB 文本任务创建成功但未返回 taskId");
      v325 = await pollRunningHubTextTask(v327, v312["body"]["apiKey"], v315);
    } else {
      if (
        ["FAILED", "FAIL", "ERROR", "CANCELLED", "CANCELED"]["includes"](v326)
      )
        throw new Error(
          getRunningHubTextErrorMessage(v322, "文本任务创建失败"),
        );
    }
    const v328 = extractTextContent(v325, v312["responseMapping"]);
    if (!v328)
      throw new ApiError({
        type: "PARSE_ERROR",
        provider: v315,
        message: "RunningHUB 未返回文本内容",
        raw: v325,
        retryable: false,
      });
    return { text: sanitizeGeneratedText(v328) };
  }
  const v329 = parseTextResponse(v321, v316["status"]),
    v330 = extractTextContent(v329, v312["responseMapping"]);
  if (!v330)
    throw new ApiError({
      type: "PARSE_ERROR",
      provider: v315,
      message: "服务端未返回文本内容",
      raw: v329,
      retryable: false,
    });
  return { text: sanitizeGeneratedText(v330) };
}

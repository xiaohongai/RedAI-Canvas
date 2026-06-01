import {
  NANO_BANANA_FAMILIES,
  getDefaultModeForNanoBananaFamily,
  getNanoBananaModeOptions,
  isNanoBananaFamily,
  resolveNanoBananaModelBySelection,
  resolveNanoBananaSelectionFromModel,
} from "../../modules/nanoBananaModeRules.js";
import {
  getDreaminaImageMenuGroupHTML,
  getDreaminaImageTriggerIconHTML,
} from "./dreaminaModelMenuHelper.js";
import {
  isRunningHubGptImage2OfficialModel,
  normalizeImageSizeForProviderModel,
} from "../../modules/imageModelCapabilities.js";
import { AI_GENERATION_NODE_SHORT_SIDE } from "../../services/fileService.js";
import {
  getAllowedRatiosForProviderModel,
  pickClosestRatioForProviderModel,
} from "../../../api/imageRatioPolicy.js";
import {
  getGenerationRatioSizeWithDom,
  pickGenerationRatioSourceEdge,
} from "../../modules/generationRatioSource.js";
import {
  ANIME_REAL_MODEL_ID,
  PERSON_REPLACE_V21_MODEL_ID,
  PERSON_REPLACE_V3_MODEL_ID,
  QWEN_IMAGE_EDIT_MODEL_ID,
  getModelsByKind,
  getModelManifest,
  resolveModelExecution,
  resolveModelProvider,
} from "../../manifests/index.js";
import {
  renderNodeMenuGroup,
  renderNodeMenuItem,
} from "../shared/nodeModelMenu.js";
import {
  parseComfyuiModelId,
  toComfyuiModelId,
} from "../../modules/comfyui/comfyEngineUi.js";
export const AI_IMAGE_MIN_SIZE = 150;
export const GRSAI_GPT_IMAGE_2_MODEL = "gpt-image-2";
const GRSAI_GPT_IMAGE_2_VIP_MODEL = "gpt-image-2-vip";
export const APIMART_GPT_IMAGE_2_MODEL = "apimart/gpt-image-2";
export const APIMART_QWEN_IMAGE_MODEL = "apimart/qwen-image-2.0";
export const APIMART_Z_IMAGE_TURBO_MODEL = "apimart/z-image-turbo";
export const APIMART_WAN_IMAGE_MODEL = "apimart/wan2.7-image";
export const VOLCENGINE_SEEDREAM_5_MODEL = "volcengine/seedream-5.0";
export const VOLCENGINE_SEEDREAM_4_5_MODEL = "volcengine/seedream-4.5";
export const VOLCENGINE_SEEDREAM_4_MODEL = "volcengine/seedream-4.0";
export const RH_ANIME_REAL_MODEL = ANIME_REAL_MODEL_ID;
const GRSAI_IMAGE_MENU_ICON_HTML =
    '<img src="images/grsai.png" class="node-menu-icon node-menu-icon-padded" alt="grsai">',
  VOLCENGINE_IMAGE_MENU_ICON_HTML =
    '<img src="images/volcengine.svg" class="node-menu-icon" alt="volcengine">',
  DEFAULT_IMAGE_PROMPT_PLACEHOLDER =
    "描述任何你想要生成的内容，按\x20@\x20引用素材，/呼出指令\x20\x20\x20(Enter\x20生成，Shift+Enter\x20换行)";
function normalizeGrsaiModelToken(v0) {
  let v1 = String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
  return (
    v1["startsWith"]("grsai/") &&
      (v1 = v1["slice"]("grsai/"["length"])["trim"]()),
    v1
  );
}
function isAdvancedModeEnabled() {
  return typeof window !== "undefined" && window["ADVANCED_MODE"] === true;
}
function getManifestUiField(v2, v3) {
  const v4 = getModelManifest(v2)?.["uiSchema"]?.["fields"];
  return Array["isArray"](v4)
    ? v4["find"]((v5) => v5?.["id"] === v3) || null
    : null;
}
function pickNearestNumber(v6, v7, v8) {
  const v9 = (Array["isArray"](v7) ? v7 : [])
    ["map"]((v10) => Number(v10))
    ["filter"](Number["isFinite"]);
  if (v9["length"] === 0) return v8;
  const v11 = Number(v6);
  if (!Number["isFinite"](v11)) return v8;
  return v9["reduce"](
    (v12, v13) => (Math["abs"](v13 - v11) < Math["abs"](v12 - v11) ? v13 : v12),
    v9[0],
  );
}
export function isGrsaiGptImage2ModelToken(v14) {
  const v15 = normalizeGrsaiModelToken(v14);
  return v15 === GRSAI_GPT_IMAGE_2_MODEL || v15 === GRSAI_GPT_IMAGE_2_VIP_MODEL;
}
export function isGrsaiGptImage2Selection(v16, v17) {
  const v18 = String(v16 || "")
      ["trim"]()
      ["toLowerCase"](),
    v19 = String(v17 || "")
      ["trim"]()
      ["toLowerCase"](),
    v20 = normalizeGrsaiModelToken(v19);
  if (!isGrsaiGptImage2ModelToken(v20)) return false;
  return (
    v18 === "grsai" ||
    v19["startsWith"]("grsai/") ||
    (!v18 && !v19["includes"]("/"))
  );
}
export function isApimartGptImage2Selection(v21, v22) {
  const v23 = String(v21 || "")
      ["trim"]()
      ["toLowerCase"](),
    v24 = String(v22 || "")
      ["trim"]()
      ["toLowerCase"]();
  return (
    v24 === APIMART_GPT_IMAGE_2_MODEL ||
    (v23 === "apimart" && v24 === GRSAI_GPT_IMAGE_2_MODEL)
  );
}
export function isRunningHubGptImage2Selection(v25, v26) {
  const v27 = String(v25 || "")
      ["trim"]()
      ["toLowerCase"](),
    v28 = resolveNanoBananaSelectionFromModel(v26, "2K", v27 || "runninghub");
  return (
    v28?.["provider"] === "runninghub" &&
    v28["family"] === NANO_BANANA_FAMILIES["GPT_IMAGE_2"]
  );
}
export function getImageSizeCapabilityProvider(v29, v30) {
  return isGrsaiGptImage2Selection(v29, v30) ? "grsai" : v29;
}
export function getEffectiveImageSizeForUi(v31, v32, v33) {
  const v34 = String(v33 || "")["trim"]();
  if (v34) return v34["toUpperCase"]();
  return isGrsaiGptImage2Selection(v31, v32) ? "1K" : "2K";
}
function isAdaptiveImageRatio(v35) {
  const v36 = String(v35 || "")["trim"](),
    v37 = v36["toLowerCase"]();
  return !v36 || v36 === "自适应" || v37 === "auto" || v37 === "adaptive";
}
export function isAdaptiveImageAspectRatioValue(v38) {
  return isAdaptiveImageRatio(v38);
}
export function parseImageDisplayAspectRatio(v39) {
  if (isAdaptiveImageRatio(v39)) return null;
  const v40 = String(v39 || "")
      ["trim"]()
      ["replace"](/[：∶﹕]/g, ":")
      ["replace"](/\s+/g, ""),
    v41 = v40["match"](/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!v41) return null;
  const v42 = Number["parseFloat"](v41[1]),
    v43 = Number["parseFloat"](v41[2]);
  if (!Number["isFinite"](v42) || !Number["isFinite"](v43)) return null;
  if (v42 <= 0 || v43 <= 0) return null;
  return { width: v42, height: v43, label: v42 + ":" + v43 };
}
export function buildImageDisplayRatioResizePatch({
  nodeData: nodeData = {},
  ratioValue: ratioValue = "",
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
} = {}) {
  const v44 = parseImageDisplayAspectRatio(ratioValue);
  if (!v44) return {};
  const v45 = Math["max"](
      1,
      Math["round"](Number(minSide) || AI_GENERATION_NODE_SHORT_SIDE),
    ),
    v46 = Math["max"](1, Math["round"](Number(nodeData?.["width"]) || v45)),
    v47 = Math["max"](1, Math["round"](Number(nodeData?.["height"]) || v45)),
    v48 = Number["isFinite"](Number(nodeData?.["x"]))
      ? Number(nodeData["x"])
      : 0,
    v49 = Number["isFinite"](Number(nodeData?.["y"]))
      ? Number(nodeData["y"])
      : 0;
  let v50, v51;
  v44["width"] >= v44["height"]
    ? ((v51 = v45), (v50 = Math["round"]((v44["width"] / v44["height"]) * v45)))
    : ((v50 = v45),
      (v51 = Math["round"]((v44["height"] / v44["width"]) * v45)));
  if (v50 === v46 && v51 === v47) return {};
  const v52 = v50 - v46,
    v53 = v51 - v47;
  return {
    width: v50,
    height: v51,
    x: Math["round"](v48 - v52 / 2),
    y: Math["round"](v49 - v53),
  };
}
function getPlainSchemaParams(v54) {
  return v54 && typeof v54 === "object" && !Array["isArray"](v54)
    ? { ...v54 }
    : {};
}
function getImageSizeForRatioDisplay(v55 = {}, v56 = {}) {
  const v57 = v55 || {},
    v58 = v56 || {},
    v59 = getPlainSchemaParams(v57["generationParams"]);
  return getEffectiveImageSizeForUi(
    v57["provider"] || v58["provider"],
    v57["model"] || v58["model"],
    v59["imageSize"] || v57["imageSize"],
  );
}
function pickClosestRatioLabelForDisplay({
  nodeData: nodeData = {},
  fallbackNodeData: fallbackNodeData = {},
  width: v60,
  height: v61,
} = {}) {
  const v62 = Number(v60) || 0,
    v63 = Number(v61) || 0;
  if (v62 <= 0 || v63 <= 0) return null;
  return pickClosestRatioForProviderModel({
    provider: nodeData?.["provider"] || fallbackNodeData?.["provider"],
    model: nodeData?.["model"] || fallbackNodeData?.["model"],
    width: v62,
    height: v63,
    imageSize: getImageSizeForRatioDisplay(nodeData, fallbackNodeData),
  });
}
function getMediaSizeForRatioDisplay(v64, v65, v66 = null, v67 = "img, video") {
  return (
    getGenerationRatioSizeWithDom({
      nodeId: v64,
      nodeData: v65,
      edge: v66,
      mediaSelector: v67,
      includeNodeFrame: true,
    }) || { width: 0, height: 0 }
  );
}
function isAcceptedRatioInputKind(v68, v69, v70, v71) {
  const v72 = String(v68?.["refSlot"] || "")["toLowerCase"]();
  if (v72["includes"]("mask")) return false;
  const v73 = v69?.[v68?.["sourceId"]],
    v74 = String(v73?.["type"] || ""),
    v75 = typeof v71 === "function" ? v71(v74) : "";
  if (v75 && v70["has"](v75)) return true;
  const v76 = v74["toLowerCase"]();
  return Array["from"](v70)["some"](
    (v77) => v76 === v77 || v76 === "source-" + v77 || v76 === "ai-" + v77,
  );
}
export function resolveImageSchemaAdaptiveRatioDisplayValue({
  store: v78,
  nodeId: v79,
  nodeData: v80,
  fallbackNodeData: v81,
  getRefKindByNodeType: v82,
  inputKinds: inputKinds = ["image"],
  resultMediaElement: resultMediaElement = null,
  resultFields: resultFields = [
    "images",
    "localPath",
    "thumbUrl",
    "imageUrl",
    "sourceUrl",
    "thumbId",
    "sourceId",
  ],
  mediaSelector: mediaSelector = "img, video",
} = {}) {
  const v83 = v78?.["getState"]?.() || {},
    v84 = v83["nodes"] || {},
    v85 = v80 || v84?.[v79] || v81 || {},
    v86 = new Set(
      (Array["isArray"](inputKinds) ? inputKinds : ["image"])
        ["map"]((v87) => String(v87 || "")["trim"]())
        ["filter"](Boolean),
    ),
    v88 =
      typeof v78?.["getIncomingEdges"] === "function"
        ? v78["getIncomingEdges"](v79)
        : [],
    v89 = v88["filter"]((v90) => isAcceptedRatioInputKind(v90, v84, v86, v82));
  if (v89["length"] > 0) {
    const v91 = pickGenerationRatioSourceEdge(v89, v85),
      v92 = v84?.[v91?.["sourceId"]],
      v93 = getMediaSizeForRatioDisplay(
        v91?.["sourceId"],
        v92,
        v91,
        mediaSelector,
      );
    return (
      pickClosestRatioLabelForDisplay({
        nodeData: v85,
        fallbackNodeData: v81,
        width: v93["width"],
        height: v93["height"],
      }) || "1:1"
    );
  }
  const v94 = resultFields["some"]((v95) => {
    const v96 = v85?.[v95];
    return Array["isArray"](v96) ? v96["length"] > 0 : Boolean(v96);
  });
  if (v94) {
    const v97 =
        resultMediaElement?.["naturalWidth"] ||
        resultMediaElement?.["videoWidth"] ||
        Number(v85?.["width"]) ||
        0,
      v98 =
        resultMediaElement?.["naturalHeight"] ||
        resultMediaElement?.["videoHeight"] ||
        Number(v85?.["height"]) ||
        0;
    return (
      pickClosestRatioLabelForDisplay({
        nodeData: v85,
        fallbackNodeData: v81,
        width: v97,
        height: v98,
      }) || "1:1"
    );
  }
  return "1:1";
}
export function buildImageSchemaAspectRatioDisplayPatch({
  store: v99,
  nodeId: v100,
  nodeData: v101,
  fallbackNodeData: v102,
  ratioValue: ratioValue = "",
  minSide: minSide = AI_GENERATION_NODE_SHORT_SIDE,
  getRefKindByNodeType: v103,
  inputKinds: v104,
  resultMediaElement: v105,
  resultFields: v106,
  mediaSelector: v107,
} = {}) {
  const v108 = v99?.["getState"]?.()["nodes"]?.[v100];
  if (!v108 && !v101 && !v102) return {};
  const v109 = v101 || v108 || v102 || {},
    v110 = isAdaptiveImageAspectRatioValue(ratioValue)
      ? resolveImageSchemaAdaptiveRatioDisplayValue({
          store: v99,
          nodeId: v100,
          nodeData: v109,
          fallbackNodeData: v102,
          getRefKindByNodeType: v103,
          inputKinds: v104,
          resultMediaElement: v105,
          resultFields: v106,
          mediaSelector: v107,
        })
      : ratioValue;
  return buildImageDisplayRatioResizePatch({
    nodeData: v109,
    ratioValue: v110,
    minSide: minSide,
  });
}
export function armImageSchemaRatioResizeAnimation(v111, v112, v113 = 280) {
  const v114 =
    typeof document !== "undefined" ? document["getElementById"](v112) : null;
  if (!v114 || !v111) return;
  v114["classList"]["add"]("is-ratio-animating");
  if (v111["_ratioAnimTimer"]) clearTimeout(v111["_ratioAnimTimer"]);
  v111["_ratioAnimTimer"] = setTimeout(() => {
    const v115 =
      typeof document !== "undefined" ? document["getElementById"](v112) : null;
    (v115?.["classList"]["remove"]("is-ratio-animating"),
      (v111["_ratioAnimTimer"] = null));
  }, v113 + 80);
}
export function animateImageSchemaRatioResizeFlip(
  v116,
  {
    nodeId: v117,
    previewEl: v118,
    nodeData: v119,
    patch: v120,
    ms: ms = 280,
  } = {},
) {
  if (!v116 || !v118 || typeof v118["animate"] !== "function") return;
  const v121 = Math["max"](
      1,
      Number(v119?.["width"]) || Number(v120?.["width"]) || 1,
    ),
    v122 = Math["max"](
      1,
      Number(v119?.["height"]) || Number(v120?.["height"]) || 1,
    ),
    v123 = Math["max"](1, Number(v120?.["width"]) || v121),
    v124 = Math["max"](1, Number(v120?.["height"]) || v122);
  if (v121 === v123 && v122 === v124) return;
  const v125 = v121 / v123,
    v126 = v122 / v124,
    v127 = "scaleX(" + v125 + ")\x20scaleY(" + v126 + ")",
    v128 = () => {
      ((v116["_ratioFlipAnim"] = null),
        (v118["style"]["transformOrigin"] = ""),
        (v118["style"]["transform"] = ""));
    };
  if (v116["_ratioFlipAnim"]) v116["_ratioFlipAnim"]["cancel"]();
  ((v118["style"]["transition"] = "none"),
    (v118["style"]["transformOrigin"] = "bottom center"),
    (v118["style"]["transform"] = v127),
    void v118["offsetWidth"]);
  const v129 = () => {
    if (typeof document !== "undefined" && !document["getElementById"](v117)) {
      v128();
      return;
    }
    ((v116["_ratioFlipAnim"] = v118["animate"](
      [{ transform: v127 }, { transform: "none" }],
      {
        duration: ms,
        easing: "cubic-bezier(0.25,\x200.46,\x200.45,\x200.94)",
        fill: "forwards",
      },
    )),
      (v116["_ratioFlipAnim"]["onfinish"] = v128),
      (v116["_ratioFlipAnim"]["oncancel"] = v128));
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(v129);
  else setTimeout(v129, 0);
}
export function applyImageSchemaRatioResizeAnimation(
  v130,
  {
    nodeId: v131,
    previewEl: v132,
    nodeData: v133,
    patch: v134,
    ms: ms = 280,
  } = {},
) {
  if (!v134 || Object["keys"](v134)["length"] === 0) return;
  (armImageSchemaRatioResizeAnimation(v130, v131, ms),
    animateImageSchemaRatioResizeFlip(v130, {
      nodeId: v131,
      previewEl: v132,
      nodeData: v133,
      patch: v134,
      ms: ms,
    }));
}
export function normalizeQwenImageEditMode(v135) {
  const v136 = String(v135 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v136 === "qwen2509" ||
    v136 === "qwen-edit2509" ||
    v136 === "2509" ||
    v136 === "0"
    ? "qwen2509"
    : "qwen2511";
}
export function getQwenImageEditModeLabel(v137) {
  return normalizeQwenImageEditMode(v137) === "qwen2509" ? "2509" : "2511";
}
export function getQwenImageEditModeTooltip(v138) {
  const v139 = normalizeQwenImageEditMode(v138),
    v140 = getQwenUiFieldOptions("rhQwenEditMode")["find"](
      (v141) => v141["value"] === v139,
    );
  if (v140?.["tooltip"]) return v140["tooltip"];
  return v139 === "qwen2509"
    ? "2509：多图编辑与单图一致性增强，适合人物/产品/文字编辑；支持深度图、边缘图、关键点/姿势图等 ControlNet 条件图。"
    : "2511：新一代指令图像编辑，人物/多人一致性、材质/光照、工业设计与文字编辑更强；支持 1-3 张参考图和多轮编辑。";
}
export function normalizeQwenFirstImageMode(v142) {
  const v143 = String(v142 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v143 === "pose" || v143 === "1" || v143 === "姿势图") return "pose";
  if (v143 === "depth" || v143 === "2" || v143 === "深度图") return "depth";
  return "original";
}
export function getQwenFirstImageModeLabel(v144) {
  const v145 = normalizeQwenFirstImageMode(v144),
    v146 = getQwenUiFieldOptions("rhQwenFirstImageMode")["find"](
      (v147) => v147["value"] === v145,
    );
  if (v146?.["label"]) return v146["label"];
  if (v145 === "pose") return "姿势图";
  if (v145 === "depth") return "深度图";
  return "原图";
}
function getQwenModelManifest() {
  return getModelManifest(QWEN_IMAGE_EDIT_MODEL_ID);
}
function getQwenUiField(v148) {
  const v149 = getQwenModelManifest()?.["uiSchema"]?.["fields"];
  return Array["isArray"](v149)
    ? v149["find"]((v150) => v150?.["id"] === v148) || null
    : null;
}
function getQwenUiFieldOptions(v151) {
  const v152 = getQwenUiField(v151)?.["options"];
  return Array["isArray"](v152) ? v152 : [];
}
export function getQwenImageEditModelManifest() {
  return getQwenModelManifest();
}
export function getQwenFirstImageModeOptions() {
  const v153 = getQwenUiFieldOptions("rhQwenFirstImageMode");
  return v153["length"]
    ? v153
    : [
        { value: "original", label: "原图" },
        { value: "pose", label: "姿势图" },
        { value: "depth", label: "深度图" },
      ];
}
export function getPersonReplaceV21ResolutionOptions() {
  const v154 = getManifestUiField(PERSON_REPLACE_V21_MODEL_ID, "rhResolution"),
    v155 = Array["isArray"](v154?.["options"]) ? v154["options"] : [],
    v156 =
      isAdvancedModeEnabled() && Array["isArray"](v154?.["advancedOptions"])
        ? v154["advancedOptions"]
        : [];
  return [...v155, ...v156]
    ["map"]((v157) => Number(v157))
    ["filter"](Number["isFinite"]);
}
export function normalizePersonReplaceV21Resolution(v158) {
  const v159 = getManifestUiField(PERSON_REPLACE_V21_MODEL_ID, "rhResolution"),
    v160 = getPersonReplaceV21ResolutionOptions(),
    v161 = Number(v159?.["defaultValue"]) || 1280;
  return pickNearestNumber(v158, v160, v161);
}
export function buildRunningHubGptImage2OfficialPatch({
  provider: provider = "",
  model: model = "",
  imageSize: imageSize = "",
  aspectRatio: aspectRatio = "",
} = {}) {
  if (!isRunningHubGptImage2OfficialModel(model, provider)) return {};
  const v162 = normalizeImageSizeForProviderModel({
      model: model,
      provider: provider,
      imageSize: imageSize,
    }),
    v163 = {},
    v164 = String(imageSize || "")
      ["trim"]()
      ["toUpperCase"]();
  v162 && v162 !== v164 && (v163["imageSize"] = v162);
  if (!isAdaptiveImageRatio(aspectRatio)) {
    const v165 = String(aspectRatio || "")
        ["trim"]()
        ["replace"](/[：∶]/g, ":")
        ["replace"](/\s+/g, ""),
      v166 = new Set(
        getAllowedRatiosForProviderModel(provider, model, v162)["map"](
          (v167) => v167["label"],
        ),
      );
    v165 &&
      !v166["has"](v165) &&
      (v163["aspectRatio"] = pickClosestRatioForProviderModel({
        provider: provider,
        model: model,
        ratioLabel: v165,
        imageSize: v162,
      }));
  }
  return v163;
}
export function getImagePromptPlaceholderForModel(v168) {
  const v169 = resolveModelProvider(v168),
    v170 =
      getModelManifest(v168) ||
      resolveModelExecution(v168, { providerHint: v169 })?.["modelManifest"] ||
      null,
    v171 = String(v170?.["prompt"]?.["placeholder"] || "")["trim"]();
  if (v171) return v171;
  return DEFAULT_IMAGE_PROMPT_PLACEHOLDER;
}
export function escapeHtmlAttr(v172) {
  return String(v172 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/"/g, "&quot;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;");
}
const APIMART_BADGE_ICON_HTML =
  '<div class="node-menu-icon node-menu-icon-badge">AM</div>';
function getImageMenuMeta(v173) {
  const v174 = v173?.["extensions"]?.["imageMenu"];
  return v174 && typeof v174 === "object" ? v174 : null;
}
export function getImageModelMenuManifests(v175) {
  const v176 = String(v175 || "")["trim"]();
  return getModelsByKind("image")
    ["filter"]((v177) => getImageMenuMeta(v177)?.["group"] === v176)
    ["sort"]((v178, v179) => {
      const v180 = getImageMenuMeta(v178),
        v181 = getImageMenuMeta(v179);
      return (v180?.["order"] || 0) - (v181?.["order"] || 0);
    });
}
function renderImageMenuGroupHTML({
  headerClass: v182,
  toggleAttr: v183,
  submenuClass: v184,
  iconHtml: v185,
  title: v186,
  subtitle: v187,
  badgeHtml: badgeHtml = "",
  itemsHtml: itemsHtml = "",
}) {
  return renderNodeMenuGroup({
    id: v184,
    headerClass: v182,
    toggleAttr: v183,
    submenuClass: v184,
    iconHtml: v185,
    label: v186,
    subtitle: v187,
    badgeHtml: badgeHtml,
    itemsHtml: itemsHtml,
  });
}
function renderImageManifestIconHTML(v188, v189 = {}) {
  if (v189["iconKind"] === "apimartBadge") return APIMART_BADGE_ICON_HTML;
  const v190 = v189["icon"] || v188?.["icon"] || "";
  if (!v190) return "";
  const v191 =
    v189["iconAlt"] || v188?.["provider"] || v188?.["displayName"] || "";
  return (
    "<img\x20src=\x22" +
    escapeHtmlAttr(v190) +
    "\x22\x20class=\x22node-menu-icon\x22\x20alt=\x22" +
    escapeHtmlAttr(v191) +
    "\x22>"
  );
}
function renderImageManifestMenuItemHTML(v192, v193) {
  const v194 = getImageMenuMeta(v192) || {},
    v195 = v192?.["modelId"] || "",
    v196 = v192?.["provider"] || "",
    v197 = String(v193 || "") === v195;
  return renderNodeMenuItem({
    modelId: v195,
    provider: v196,
    label: v194["title"] || v192?.["displayName"] || v195,
    description: v194["subtitle"] || v192?.["description"] || "",
    iconHtml: renderImageManifestIconHTML(v192, v194),
    active: v197,
  });
}
export function buildGrsaiImageMenuGroupHTML(v198, v199 = "") {
  return renderImageMenuGroupHTML({
    headerClass: "grsai-group-header",
    toggleAttr: "data-grsai-toggle",
    submenuClass: "grsai-submenu",
    iconHtml: GRSAI_IMAGE_MENU_ICON_HTML,
    title: "GRSAI",
    subtitle: "高性能 AI 图像生成服务",
    itemsHtml: buildNanoBananaFamilyMenuHTML(v198, v199),
  });
}
export function buildApimartImageMenuGroupHTML(v200) {
  const v201 = getImageModelMenuManifests("apimart")
    ["map"]((v202) => renderImageManifestMenuItemHTML(v202, v200))
    ["join"]("");
  return renderImageMenuGroupHTML({
    headerClass: "apimart-group-header",
    toggleAttr: "data-apimart-toggle",
    submenuClass: "apimart-submenu",
    iconHtml: APIMART_BADGE_ICON_HTML,
    title: "APIMart",
    subtitle: "一个 API 搞定一切——节省 30-70%",
    itemsHtml: v201,
  });
}
export function buildVolcengineImageMenuGroupHTML(v203) {
  const v204 = getImageModelMenuManifests("volcengine")
    ["map"]((v205) => renderImageManifestMenuItemHTML(v205, v203))
    ["join"]("");
  return renderImageMenuGroupHTML({
    headerClass: "volcengine-group-header",
    toggleAttr: "data-volcengine-toggle",
    submenuClass: "volcengine-submenu",
    iconHtml: VOLCENGINE_IMAGE_MENU_ICON_HTML,
    title: "火山方舟",
    subtitle: "Ark Seedream 图像生成 API",
    itemsHtml: v204,
  });
}
export function buildRunningHubImageModelMenuGroupHTML(v206, v207 = "") {
  return renderImageMenuGroupHTML({
    headerClass: "runninghub-group-header",
    toggleAttr: "data-runninghub-toggle",
    submenuClass: "runninghub-submenu",
    iconHtml:
      '<img src="images/RH.png" class="node-menu-icon" alt="runninghub">',
    title: "RunningHUB模型",
    subtitle: "模型 API：文生图/图生图/图片编辑",
    itemsHtml: buildRunningHubNanoBananaFamilyMenuHTML(v206, v207),
  });
}
export function buildRunningHubWorkflowImageMenuGroupHTML(v208) {
  const v209 = getImageModelMenuManifests("runninghubWorkflow")
    ["map"]((v210) => buildManifestModelMenuItemHTML(v210["modelId"], v208))
    ["join"]("");
  return renderImageMenuGroupHTML({
    headerClass: "runninghubwf-group-header",
    toggleAttr: "data-runninghubwf-toggle",
    submenuClass: "runninghubwf-submenu",
    iconHtml:
      '<img src="images/RH.png" class="node-menu-icon" alt="runninghub">',
    title: "RunningHUB工作流",
    subtitle: "工作流模板：替换/风格迁移，结果更可控",
    itemsHtml: v209,
  });
}
const COMFYUI_MENU_ICON_HTML =
  '<div class="image-model-trigger-icon image-model-trigger-badge">CU</div>';
export function buildComfyuiImageMenuGroupHTML(
  workflows = [],
  activeWorkflow = "",
) {
  const activeName = String(activeWorkflow || "").trim();
  const itemsHtml = workflows.length
    ? workflows
        ["map"]((item) => {
          const name = String(item?.name || "").trim();
          if (!name) return "";
          return renderNodeMenuItem({
            modelId: toComfyuiModelId(name),
            provider: "comfyui",
            label: item?.title || name,
            description: "本地 ComfyUI 工作流",
            iconHtml: COMFYUI_MENU_ICON_HTML,
            active: activeName === name,
          });
        })
        ["filter"](Boolean)
        ["join"]("")
    : renderNodeMenuItem({
        label: "暂无工作流",
        description: "请先在设置 → ComfyUI 中导入",
        disabled: true,
        disabledValue: "true",
      });
  return renderImageMenuGroupHTML({
    headerClass: "comfyui-group-header",
    toggleAttr: "data-comfyui-toggle",
    submenuClass: "comfyui-submenu",
    iconHtml: COMFYUI_MENU_ICON_HTML,
    title: "本地 ComfyUI",
    subtitle: "已导入的 API 工作流",
    itemsHtml: itemsHtml,
  });
}
export function buildImageModelMenuHTML({
  activeModel: activeModel = "",
  nanoSelection: nanoSelection = null,
  comfyWorkflows: comfyWorkflows = [],
  activeComfyWorkflow: activeComfyWorkflow = "",
} = {}) {
  return (
    "<div\x20class=\x22floating-menu\x20img-model-menu\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
    buildGrsaiImageMenuGroupHTML(nanoSelection, activeModel) +
    "\n                " +
    getDreaminaImageMenuGroupHTML(activeModel) +
    "\n                " +
    buildApimartImageMenuGroupHTML(activeModel) +
    "\n                " +
    buildVolcengineImageMenuGroupHTML(activeModel) +
    "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
    buildRunningHubImageModelMenuGroupHTML(nanoSelection, activeModel) +
    "\n                " +
    buildRunningHubWorkflowImageMenuGroupHTML(activeModel) +
    "\n                " +
    buildComfyuiImageMenuGroupHTML(comfyWorkflows, activeComfyWorkflow) +
    "\n              </div>"
  );
}
function getLatestImageMenuNodeData(v211, v212, v213 = {}) {
  return (v211?.["getState"]?.() || {})["nodes"]?.[v212] || v213 || {};
}
function getImageMenuItemTitle(v214, v215 = "") {
  const v216 =
    v214?.["querySelector"]?.(".fmi-title") ||
    v214?.["querySelector"]?.(".floating-menu-label");
  return v216 ? v216["textContent"] : v215;
}
function clearImageModelMenuActive(v217) {
  v217?.["querySelectorAll"]?.(".floating-menu-item")?.["forEach"]((v218) =>
    v218["classList"]["remove"]("active"),
  );
}
export function bindImageModelMenuSubmenu({
  modelMenu: v219,
  modelTrigger: v220,
  modelLabel: v221,
  nodeId: v222,
  store: v223,
  fallbackNodeData: fallbackNodeData = {},
  toggleSelector: toggleSelector = "",
  submenuSelector: submenuSelector = "",
  defaultProvider: defaultProvider = "",
  buildModelPatch: v224,
  resolveSelection: v225,
  beforeSelect: v226,
  onDisabled: v227,
  afterSelect: v228,
} = {}) {
  if (!v219 || !v221 || !v222 || !v223) return null;
  const v229 = v219["querySelector"](toggleSelector),
    v230 = v219["querySelector"](submenuSelector);
  if (!v229 || !v230) return null;
  let v231 = null;
  const v232 = () => {
      (v231 && (clearTimeout(v231), (v231 = null)),
        (v230["style"]["display"] = "flex"));
    },
    v233 = (v234 = 120) => {
      if (v231) clearTimeout(v231);
      v231 = setTimeout(() => {
        v230["style"]["display"] = "none";
      }, v234);
    };
  return (
    v229["addEventListener"]("mouseenter", v232),
    v229["addEventListener"]("mouseleave", () => v233()),
    v230["addEventListener"]("mouseenter", v232),
    v230["addEventListener"]("mouseleave", () => v233()),
    v230["querySelectorAll"](".floating-menu-item")["forEach"]((v235) => {
      v235["addEventListener"]("click", () => {
        if (v235["dataset"]["disabled"] === "true") {
          v227?.({
            item: v235,
            modelMenu: v219,
            submenu: v230,
            modelTrigger: v220,
          });
          return;
        }
        const v236 = getLatestImageMenuNodeData(v223, v222, fallbackNodeData),
          v237 = (typeof v225 === "function"
            ? v225({
                item: v235,
                latestNode: v236,
                defaultProvider: defaultProvider,
              })
            : null) || {
            model: v235["dataset"]["value"],
            provider: v235["dataset"]["provider"] || defaultProvider,
          },
          v238 = String(v237["model"] || "")["trim"](),
          v239 = String(v237["provider"] || defaultProvider)["trim"]();
        if (!v238 || !v239) return;
        if (
          typeof v226 === "function" &&
          v226({
            item: v235,
            model: v238,
            provider: v239,
            latestNode: v236,
            selection: v237,
          }) === false
        )
          return;
        ((v221["textContent"] =
          v237["label"] || getImageMenuItemTitle(v235, v238)),
          clearImageModelMenuActive(v219),
          v235["classList"]["add"]("active"),
          v219["classList"]["remove"]("show"),
          (v230["style"]["display"] = "none"));
        const v240 =
            v237["patch"] && typeof v237["patch"] === "object"
              ? v237["patch"]
              : { model: v238, provider: v239 },
          v241 =
            typeof v224 === "function"
              ? v224(v236, v238, v239, v240)
              : { ...v240, model: v238, provider: v239 };
        (v223["updateNodeData"](v222, v241),
          v228?.({
            item: v235,
            model: v238,
            provider: v239,
            latestNode: v236,
            selection: v237,
            modelMenu: v219,
            submenu: v230,
            modelTrigger: v220,
          }));
      });
    }),
    { header: v229, submenu: v230 }
  );
}
export function resolveGrsaiImageMenuSelection({
  item: v242,
  latestNode: v243,
} = {}) {
  const v244 = "grsai",
    v245 = String(v242?.["dataset"]?.["value"] || "")["trim"]();
  let v246 = v245,
    v247 = { model: v246, provider: v244 };
  if (isGrsaiGptImage2ModelToken(v246))
    ((v246 = GRSAI_GPT_IMAGE_2_MODEL),
      (v247 = { model: v246, provider: v244, imageSize: "1K" }));
  else {
    if (!v246) {
      const v248 = String(v242?.["dataset"]?.["nbFamily"] || "")["trim"]();
      if (!v248) return null;
      const v249 =
          getPlainSchemaParams(v243?.["generationParams"])["imageSize"] || "2K",
        v250 = getDefaultModeForNanoBananaFamily(v248, v244);
      ((v246 = resolveNanoBananaModelBySelection({
        family: v248,
        mode: v250,
        imageSize: v249,
        provider: v244,
      })),
        (v247 = { model: v246, provider: v244 }));
    }
  }
  return { model: v246, provider: v244, patch: v247 };
}
export function resolveApimartImageMenuSelection({
  item: v251,
  latestNode: v252,
} = {}) {
  const v253 = String(v251?.["dataset"]?.["value"] || "")["trim"](),
    v254 = String(v251?.["dataset"]?.["provider"] || "apimart")["trim"](),
    v255 = { model: v253, provider: v254 };
  if (
    v253 === "apimart/seedream-4.5" ||
    v253 === "apimart/seedream-5.0-lite" ||
    v253 === APIMART_GPT_IMAGE_2_MODEL ||
    v253 === APIMART_QWEN_IMAGE_MODEL ||
    v253 === APIMART_Z_IMAGE_TURBO_MODEL ||
    v253 === APIMART_WAN_IMAGE_MODEL
  ) {
    const v256 =
      getPlainSchemaParams(v252?.["generationParams"])["imageSize"] ||
      v252?.["imageSize"] ||
      "2K";
    ((v253 === "apimart/seedream-4.5" ||
      v253 === "apimart/seedream-5.0-lite") &&
      v256 === "1K" &&
      (v255["imageSize"] = "2K"),
      v253 === "apimart/seedream-5.0-lite" &&
        v256 === "4K" &&
        (v255["imageSize"] = "3K"),
      v253 === APIMART_GPT_IMAGE_2_MODEL &&
        v256 === "3K" &&
        (v255["imageSize"] = "2K"),
      (v253 === APIMART_QWEN_IMAGE_MODEL ||
        v253 === APIMART_Z_IMAGE_TURBO_MODEL) &&
        v256 !== "1K" &&
        v256 !== "2K" &&
        (v255["imageSize"] = "1K"),
      v253 === APIMART_WAN_IMAGE_MODEL &&
        v256 !== "1K" &&
        v256 !== "2K" &&
        (v255["imageSize"] = "2K"));
  }
  return { model: v253, provider: v254, patch: v255 };
}
export function resolveVolcengineImageMenuSelection({
  item: v257,
  latestNode: v258,
} = {}) {
  const v259 = String(v257?.["dataset"]?.["value"] || "")["trim"](),
    v260 = String(v257?.["dataset"]?.["provider"] || "volcengine")["trim"](),
    v261 = { model: v259, provider: v260 },
    v262 =
      getPlainSchemaParams(v258?.["generationParams"])["imageSize"] ||
      v258?.["imageSize"] ||
      "2K";
  return (
    (v259 === VOLCENGINE_SEEDREAM_5_MODEL ||
      v259 === VOLCENGINE_SEEDREAM_4_5_MODEL) &&
      v262 === "1K" &&
      (v261["imageSize"] = "2K"),
    v259 === VOLCENGINE_SEEDREAM_5_MODEL &&
      v262 === "4K" &&
      (v261["imageSize"] = "3K"),
    (v259 === VOLCENGINE_SEEDREAM_4_5_MODEL ||
      v259 === VOLCENGINE_SEEDREAM_4_MODEL) &&
      v262 === "3K" &&
      (v261["imageSize"] = "2K"),
    { model: v259, provider: v260, patch: v261 }
  );
}
export function resolveRunningHubWorkflowImageMenuSelection({
  item: v263,
} = {}) {
  return {
    model: v263?.["dataset"]?.["value"],
    provider: v263?.["dataset"]?.["provider"] || "runninghubwf",
  };
}
export function resolveComfyuiImageMenuSelection({ item: v263a } = {}) {
  const model = String(v263a?.["dataset"]?.["value"] || "")["trim"]();
  const workflowName = parseComfyuiModelId(model);
  if (!workflowName) return null;
  return {
    model,
    provider: "comfyui",
    label: getImageMenuItemTitle(v263a, model),
    patch: {
      imageEngine: "comfyui",
      comfyWorkflow: workflowName,
      comfyWorkflowTitle: getImageMenuItemTitle(v263a, model),
      comfyParams: {},
    },
  };
}
export function resolveRunningHubModelImageMenuSelection({
  item: v264,
  latestNode: v265,
} = {}) {
  const v266 = String(v264?.["dataset"]?.["nbFamily"] || "")["trim"]();
  let v267 = v264?.["dataset"]?.["value"],
    v268 = v264?.["dataset"]?.["provider"] || "runninghubwf";
  const v269 = {};
  if (v266) {
    v268 = "runninghub";
    const v270 =
        getPlainSchemaParams(v265?.["generationParams"])["imageSize"] || "2K",
      v271 = getDefaultModeForNanoBananaFamily(v266, v268);
    v267 = resolveNanoBananaModelBySelection({
      family: v266,
      mode: v271,
      imageSize: v270,
      provider: v268,
    });
  }
  if (!v267 || !v268) return null;
  return { model: v267, provider: v268, patch: v269 };
}
function createImageTriggerIcon(v272, v273 = "img") {
  const v274 =
    v272?.["ownerDocument"] ||
    (typeof document !== "undefined" ? document : null);
  return v274?.["createElement"]?.(v273) || null;
}
function replaceImageModelTriggerFirstIcon(v275, v276) {
  const v277 = v275?.["firstElementChild"];
  if (!v277 || !v276) return;
  v277["replaceWith"](v276);
}
function setSimpleImageModelTriggerIcon(v278, v279 = {}) {
  const v280 = createImageTriggerIcon(v278, "img");
  if (!v280) return;
  v280["src"] = v279["src"] || "";
  if (v279["alt"]) v280["alt"] = v279["alt"];
  ((v280["className"] = ["image-model-trigger-icon", v279["className"] || ""]
    ["filter"](Boolean)
    ["join"]("\x20")),
    replaceImageModelTriggerFirstIcon(v278, v280));
}
function setApimartImageModelTriggerIcon(v281) {
  const v282 = createImageTriggerIcon(v281, "div");
  if (!v282) return;
  ((v282["className"] = "image-model-trigger-icon image-model-trigger-badge"),
    (v282["innerText"] = "AM"),
    replaceImageModelTriggerFirstIcon(v281, v282));
}
export function setImageModelTriggerIcon(v283, v284, v285 = null) {
  const v286 = String(v284 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v286 === "apimart") {
    setApimartImageModelTriggerIcon(v283, v285);
    return;
  }
  if (v286 === "aicanvas") {
    setSimpleImageModelTriggerIcon(v283, {
      src: "images/favicon.svg",
      alt: "aicanvas",
      className: "image-model-trigger-icon-large",
    });
    return;
  }
  if (v286 === "runninghub" || v286 === "runninghubwf") {
    setSimpleImageModelTriggerIcon(v283, {
      src: "images/RH.png",
      alt: "runninghub",
      className: "image-model-trigger-icon-soft",
    });
    return;
  }
  if (v286 === "ppio") {
    setSimpleImageModelTriggerIcon(v283, {
      src: "images/gemini.svg",
      alt: "ppio",
    });
    return;
  }
  if (v286 === "volcengine") {
    setSimpleImageModelTriggerIcon(v283, {
      src: "images/volcengine.svg",
      alt: "volcengine",
    });
    return;
  }
  if (v286 === "comfyui") {
    const v286b = createImageTriggerIcon(v283, "div");
    if (!v286b) return;
    ((v286b["className"] = "image-model-trigger-icon image-model-trigger-badge"),
      (v286b["innerText"] = "CU"),
      replaceImageModelTriggerFirstIcon(v283, v286b));
    return;
  }
  setSimpleImageModelTriggerIcon(v283, {
    src: "images/grsai.png",
    alt: "grsai",
    className: "image-model-trigger-icon-padded",
  });
}
export function renderImageModelTriggerIconHTML({
  model: model = "",
  provider: provider = "",
} = {}) {
  const v287 = String(model || "")["trim"](),
    v288 = String(resolveModelProvider(v287, provider) || provider || "")
      ["trim"]()
      ["toLowerCase"]();
  if (v288 === "apimart")
    return "<div\x20class=\x22image-model-trigger-icon\x20image-model-trigger-badge\x22>AM</div>";
  if (v288 === "aicanvas" || v287["startsWith"]("aicanvas/"))
    return '<img src="images/favicon.svg" class="image-model-trigger-icon image-model-trigger-icon-large" alt="aicanvas">';
  if (v288 === "dreamina") return getDreaminaImageTriggerIconHTML();
  if (v288 === "runninghub" || v288 === "runninghubwf")
    return '<img src="images/RH.png" class="image-model-trigger-icon image-model-trigger-icon-soft" alt="runninghub">';
  if (v288 === "ppio")
    return '<img src="images/gemini.svg" class="image-model-trigger-icon" alt="ppio">';
  if (v288 === "volcengine")
    return '<img src="images/volcengine.svg" class="image-model-trigger-icon" alt="volcengine">';
  if (v288 === "comfyui")
    return '<div class="image-model-trigger-icon image-model-trigger-badge">CU</div>';
  return "<img\x20src=\x22images/grsai.png\x22\x20class=\x22image-model-trigger-icon\x20image-model-trigger-icon-padded\x22\x20alt=\x22grsai\x22>";
}
export function buildNanoBananaFamilyMenuHTML(v289, v290 = "") {
  const v291 = v289?.["provider"] === "grsai" ? v289?.["family"] || "" : "",
    v292 = normalizeGrsaiModelToken(v290);
  return getImageModelMenuManifests("grsaiModel")
    ["map"]((v293) => {
      const v294 = getImageMenuMeta(v293) || {};
      if (v294["role"] === "directModel")
        return renderNodeMenuItem({
          modelId: v293["modelId"] || GRSAI_GPT_IMAGE_2_MODEL,
          provider: "grsai",
          label: v294["title"] || v293["displayName"] || "GPT image 2",
          description: v294["subtitle"] || v293["description"] || "",
          iconHtml: GRSAI_IMAGE_MENU_ICON_HTML,
          active: isGrsaiGptImage2ModelToken(v292),
        });
      const v295 = String(v294["family"] || "")["trim"](),
        v296 = v294["disabled"] === true,
        v297 = v291 === v295;
      return renderNodeMenuItem({
        label: v294["title"] || v293["displayName"] || v295,
        description: v294["subtitle"] || "",
        iconHtml: GRSAI_IMAGE_MENU_ICON_HTML,
        active: v297,
        disabled: v296,
        attrs: { "data-nb-family": v295 || undefined },
      });
    })
    ["join"]("");
}
export function buildRunningHubNanoBananaFamilyMenuHTML(v298, v299 = "") {
  const v300 =
    v298?.["provider"] === "runninghub" ? v298?.["family"] || "" : "";
  return getImageModelMenuManifests("runninghubModel")
    ["map"]((v301) => {
      const v302 = getImageMenuMeta(v301) || {};
      if (v302["role"] === "directModel")
        return renderImageManifestMenuItemHTML(v301, v299);
      const v303 = String(v302["family"] || "")["trim"]();
      return renderNodeMenuItem({
        provider: "runninghub",
        label: v302["title"] || v301["displayName"] || v303,
        description: v302["subtitle"] || v301["description"] || "",
        icon: v302["icon"] || v301["icon"] || "images/gemini.svg",
        iconAlt: v302["alt"] || v303,
        active: v300 === v303,
        attrs: { "data-nb-family": v303 || undefined },
      });
    })
    ["join"]("");
}
export function shouldShowNanoBananaModeSelector({
  family: v304,
  provider: provider = "",
  isModelApiManifest: isModelApiManifest = false,
} = {}) {
  if (!isNanoBananaFamily(v304)) return false;
  return String(provider || "")
    ["trim"]()
    ["toLowerCase"]() === "runninghub"
    ? true
    : !isModelApiManifest;
}
export function buildNanoBananaModeMenuHTML(v305, v306, v307 = "") {
  if (!isNanoBananaFamily(v305)) return "";
  const v308 = getNanoBananaModeOptions(v305, v307);
  return v308["map"]((v309) => {
    const v310 = v309["tooltip"]
        ? ' title="' +
          escapeHtmlAttr(v309["tooltip"]) +
          "\x22\x20data-tooltip=\x22" +
          escapeHtmlAttr(v309["tooltip"]) +
          "\x22"
        : "",
      v311 = v309["mode"] === v306;
    return (
      '<div class="floating-menu-item ' +
      (v311 ? "active" : "") +
      '" data-nb-mode="' +
      v309["mode"] +
      "\x22" +
      v310 +
      "><span\x20class=\x22floating-menu-label\x22>" +
      v309["label"] +
      "</span></div>"
    );
  })["join"]("");
}
export function buildQwenImageEditModeMenuHTML(v312) {
  const v313 = normalizeQwenImageEditMode(v312),
    v314 = getQwenUiFieldOptions("rhQwenEditMode"),
    v315 = v314["length"]
      ? v314
      : [
          { value: "qwen2511", label: "2511" },
          { value: "qwen2509", label: "2509" },
        ];
  return v315["map"]((v316) => {
    const v317 = escapeHtmlAttr(getQwenImageEditModeTooltip(v316["value"]));
    return (
      '<div class="floating-menu-item ' +
      (v313 === v316["value"] ? "active" : "") +
      '" data-qwen-mode="' +
      v316["value"] +
      '" title="' +
      v317 +
      '" data-tooltip="' +
      v317 +
      "\x22><span\x20class=\x22floating-menu-label\x22>" +
      v316["label"] +
      "</span></div>"
    );
  })["join"]("");
}
export function buildQwenImageEditModelMenuItemHTML(v318) {
  return buildManifestModelMenuItemHTML(QWEN_IMAGE_EDIT_MODEL_ID, v318, {
    title: "Qwen-图像编辑",
    description: "多图指令编辑，适合人物/产品一致性、文字修改与姿势/深度控制",
  });
}
export function buildAnimeRealModelMenuItemHTML(v319) {
  return buildManifestModelMenuItemHTML(ANIME_REAL_MODEL_ID, v319, {
    title: "漫画转真人",
    description: "基于工作流把二次元角色转写实人像",
  });
}
export function buildPersonReplaceV21ModelMenuItemHTML(v320) {
  return buildManifestModelMenuItemHTML(PERSON_REPLACE_V21_MODEL_ID, v320, {
    title: "人物替换人物替换V2.1",
    description: "双图人物替换，支持目标/被替换图遮罩",
  });
}
export function buildPersonReplaceV3ModelMenuItemHTML(v321) {
  return buildManifestModelMenuItemHTML(PERSON_REPLACE_V3_MODEL_ID, v321, {
    title: "人物替换图片编辑V3",
    description: "保持构图与光影，快速替换人物/服饰/物品",
  });
}
function buildManifestModelMenuItemHTML(v322, v323, v324 = {}) {
  const v325 = getModelManifest(v322),
    v326 = v325?.["modelId"] || v322,
    v327 = v325?.["provider"] || "runninghubwf",
    v328 = v325?.["icon"] || "images/RH.png",
    v329 = v325?.["displayName"] || v324["title"] || v326,
    v330 = v325?.["description"] || v324["description"] || "",
    v331 = v325?.["vip"] === true || v324["vip"] === true,
    v332 = getModelManifest(v323),
    v333 = v323 === v322 || v323 === v326 || v332?.["modelId"] === v326;
  return renderNodeMenuItem(
    {
      modelId: v326,
      provider: v327,
      label: v329,
      description: v330,
      icon: v328,
      iconAlt: "runninghub",
      vip: v331,
      active: v333,
    },
    { activeModel: v323 },
  );
}
export function buildQwenFirstImageModeControlsHTML(v334) {
  const v335 = normalizeQwenFirstImageMode(v334);
  return getQwenFirstImageModeOptions()
    ["map"]((v336) => {
      const v337 = normalizeQwenFirstImageMode(v336["value"]);
      return (
        '<button type="button" class="img-rp-quality-item qwen-first-image-mode-opt ' +
        (v335 === v337 ? "active" : "") +
        '" data-value="' +
        escapeHtmlAttr(v337) +
        "\x22>" +
        escapeHtmlAttr(v336["label"]) +
        "</button>"
      );
    })
    ["join"]("");
}

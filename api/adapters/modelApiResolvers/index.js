import {
  normalizeRatioLabelText,
  parseRatioLabel,
  resolveProviderRatioPayload,
} from "../../imageRatioPolicy.js";
import {
  applyApimartPrivateAvatarAssetsToUrls,
  supportsApimartPrivateAvatarAssets,
} from "../apimartPrivateAvatarAssetResolver.js";
import {
  isRunningHubModelWithoutImageSizeParam,
  normalizeImageSizeForProviderModel,
  shouldOmitImageSizeParam,
} from "../../../src/modules/imageModelCapabilities.js";
import {
  NANO_BANANA_FAMILIES,
  getNanoBananaAllowedRatioLabels,
  normalizeNanoBananaRatioForFamily,
  resolveNanoBananaSelectionFromModel,
} from "../../../src/modules/nanoBananaModeRules.js";
import { resolveModelExecution } from "../../../src/manifests/index.js";
const PPIO_MIN_PIXELS = 2560 * 1440,
  PPIO_MAX_PIXELS = 10404496,
  PPIO_MIN_RATIO = 1 / 16,
  PPIO_MAX_RATIO = 16,
  PPIO_ALIGN_STEP = 64,
  PPIO_DEFAULT_SIZE = "2048x2048",
  PPIO_DEFAULT_QUALITY = "2K",
  PPIO_DEFAULT_RATIO = "1:1",
  PPIO_QUALITY_PIXEL_MAP = Object["freeze"]({
    "1K": 1024 * 1024,
    "2K": 2048 * 2048,
    "3K": 2560 * 2560,
    "4K": 2880 * 2880,
  }),
  PPIO_RATIO_OPTIONS = Object["freeze"]([
    Object["freeze"]({ label: "1:1", w: 1, h: 1 }),
    Object["freeze"]({ label: "9:16", w: 9, h: 16 }),
    Object["freeze"]({ label: "16:9", w: 16, h: 9 }),
    Object["freeze"]({ label: "3:4", w: 3, h: 4 }),
    Object["freeze"]({ label: "4:3", w: 4, h: 3 }),
    Object["freeze"]({ label: "3:2", w: 3, h: 2 }),
    Object["freeze"]({ label: "2:3", w: 2, h: 3 }),
    Object["freeze"]({ label: "5:4", w: 5, h: 4 }),
    Object["freeze"]({ label: "4:5", w: 4, h: 5 }),
    Object["freeze"]({ label: "21:9", w: 21, h: 9 }),
  ]),
  PPIO_RATIO_LABEL_SET = new Set(
    PPIO_RATIO_OPTIONS["map"]((v0) => v0["label"]),
  ),
  RUNNINGHUB_MODEL_DIMENSION_MIN = 512,
  RUNNINGHUB_MODEL_DIMENSION_MAX = 8192,
  RUNNINGHUB_MODEL_DIMENSION_ALIGN = 8,
  RUNNINGHUB_MODEL_DEFAULT_QUALITY = "2K",
  RUNNINGHUB_MODEL_DEFAULT_RATIO = "1:1",
  RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP = Object["freeze"]({
    "1K": 1024 * 1024,
    "2K": 2048 * 2048,
    "3K": 2560 * 2560,
    "4K": 2880 * 2880,
  }),
  RUNNINGHUB_MODEL_RATIO_LIST = Object["freeze"]([
    "1:1",
    "9:16",
    "16:9",
    "3:4",
    "4:3",
    "3:2",
    "2:3",
    "5:4",
    "4:5",
    "21:9",
  ]),
  RUNNINGHUB_MODEL_RATIO_SET = new Set(RUNNINGHUB_MODEL_RATIO_LIST);
function stripPrefix(v1, v2) {
  const v3 = String(v1 || "")["trim"]();
  return v3["startsWith"](v2) ? v3["slice"](v2["length"]) : v3;
}
function isPresentValue(v4) {
  return v4 !== undefined && v4 !== null && String(v4)["trim"]() !== "";
}
const VEO3_MODEL_CHOICES = new Set(["fast", "quality"]),
  VEO3_IMAGE_GENERATION_TYPES = new Set(["frame", "reference"]),
  VIDU_Q3_VIDEO_MODELS = new Set(["viduq3-turbo", "viduq3-pro"]),
  VIDU_Q3_REFERENCE_MODELS = new Set(["viduq3", "viduq3-mix"]);
export function normalizeApimartGptImage2Resolution(v5) {
  const v6 = String(v5 || "")
    ["trim"]()
    ["toUpperCase"]();
  if (v6 === "1K" || v6 === "2K" || v6 === "4K") return v6["toLowerCase"]();
  return "2k";
}
export function normalizeApimartNanoBanana2Resolution(v7) {
  const v8 = String(v7 || "")
    ["trim"]()
    ["toUpperCase"]();
  if (v8 === "1K" || v8 === "2K" || v8 === "4K") return v8;
  return "2K";
}
function apimartGptImage2Image({ currentBody: v9, payload: v10 }) {
  return {
    ...v9,
    resolution: normalizeApimartGptImage2Resolution(
      v9["resolution"] || v10["imageSize"],
    ),
  };
}
function pickClosestPpioRatio(v11, v12) {
  const v13 = Number(v11 || 1) / Number(v12 || 1);
  let v14 = PPIO_RATIO_OPTIONS[0],
    v15 = Number["POSITIVE_INFINITY"];
  for (const v16 of PPIO_RATIO_OPTIONS) {
    const v17 = Math["abs"](v16["w"] / v16["h"] - v13);
    v17 < v15 && ((v15 = v17), (v14 = v16));
  }
  return v14["label"];
}
function normalizePpioQuality(v18) {
  const v19 = String(v18 || "")
    ["trim"]()
    ["toUpperCase"]();
  return PPIO_QUALITY_PIXEL_MAP[v19] ? v19 : PPIO_DEFAULT_QUALITY;
}
function normalizePpioAspectRatioLabel(v20) {
  const v21 = String(v20 || "")["trim"]();
  if (!v21) return PPIO_DEFAULT_RATIO;
  const v22 = normalizeRatioLabelText(v21),
    v23 = v22["toLowerCase"]();
  if (
    v23 === "auto" ||
    v23 === "adaptive" ||
    v22 === "自适应" ||
    v22 === "默认"
  )
    return PPIO_DEFAULT_RATIO;
  if (!v22["includes"](":")) return PPIO_DEFAULT_RATIO;
  const [v24, v25] = v22["split"](":"),
    v26 = Number["parseFloat"](v24),
    v27 = Number["parseFloat"](v25);
  if (!(v26 > 0 && v27 > 0)) return PPIO_DEFAULT_RATIO;
  const v28 = pickClosestPpioRatio(v26, v27);
  return PPIO_RATIO_LABEL_SET["has"](v28) ? v28 : PPIO_DEFAULT_RATIO;
}
function calculatePpioSizeFromTargetPixels(v29, v30) {
  const [v31, v32] = String(v30 || PPIO_DEFAULT_RATIO)["split"](":"),
    v33 = Number["parseFloat"](v31) || 1,
    v34 = Number["parseFloat"](v32) || 1,
    v35 = Math["max"](PPIO_MIN_RATIO, Math["min"](PPIO_MAX_RATIO, v33 / v34)),
    v36 = Math["max"](
      PPIO_MIN_PIXELS,
      Math["min"](Number(v29) || PPIO_QUALITY_PIXEL_MAP["2K"], PPIO_MAX_PIXELS),
    );
  let v37 = Math["round"](Math["sqrt"](v36 / v35)),
    v38 = Math["round"](v37 * v35);
  return (
    (v38 = Math["max"](
      PPIO_ALIGN_STEP,
      Math["round"](v38 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP,
    )),
    (v37 = Math["max"](
      PPIO_ALIGN_STEP,
      Math["round"](v37 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP,
    )),
    v38 + "x" + v37
  );
}
function resolvePpioSize(v39, v40) {
  const v41 = normalizePpioQuality(v39),
    v42 = normalizePpioAspectRatioLabel(v40),
    v43 = PPIO_QUALITY_PIXEL_MAP[v41] || PPIO_QUALITY_PIXEL_MAP["2K"];
  return calculatePpioSizeFromTargetPixels(v43, v42) || PPIO_DEFAULT_SIZE;
}
function ppioImageSize({
  currentBody: v44,
  payload: v45,
  modelToken: v46,
  finalUrls: v47,
  executionManifest: v48,
  modelManifest: v49,
}) {
  const v50 = v46 || stripPrefix(v45["model"], "ppio/"),
    v51 = { ...v44 },
    v52 =
      v48?.["extensions"]?.["ppioImage"] ||
      v49?.["extensions"]?.["ppioImage"] ||
      {};
  return (
    !v45["suppressImageSize"] &&
      (v51["size"] = resolvePpioSize(
        v45["imageSize"],
        v45["resolvedRatioLabel"] || v45["aspectRatio"],
      )),
    v52["optimizePromptOptions"] &&
      (v51["optimize_prompt_options"] = { ...v52["optimizePromptOptions"] }),
    v52["batchSizeField"] &&
      v45["batchSize"] &&
      v45["batchSize"] > 1 &&
      (v51[v52["batchSizeField"]] = v45["batchSize"]),
    v47["length"] > 0 && (v51[v52["imageInputField"] || "image"] = v47),
    v51
  );
}
function normalizeGrsaiImageModel(v53) {
  const v54 = String(v53 || "")["trim"]();
  if (!v54) return "nano-banana-pro-vt";
  return v54["replace"](/^grsai\//i, "");
}
const GRSAI_NANO_BANANA_IMAGE_SIZE_SET = new Set(["1K", "2K"]);
function getGrsaiNanoBananaSelection(v55) {
  const v56 = resolveNanoBananaSelectionFromModel(v55, "2K", "grsai");
  if (!v56 || v56["family"] === NANO_BANANA_FAMILIES["GPT_IMAGE_2"])
    return null;
  return v56;
}
function getGrsaiImageSizePolicy(v57) {
  const v58 = resolveModelExecution(v57, { providerHint: "grsai" }),
    v59 = v58?.["modelManifest"]?.["extensions"]?.["imageSizePolicy"];
  return v59 && typeof v59 === "object" ? v59 : null;
}
function normalizeGrsaiNanoBananaImageSize(v60, v61 = "") {
  const v62 = String(getGrsaiImageSizePolicy(v61)?.["fixedSize"] || "")
    ["trim"]()
    ["toUpperCase"]();
  if (v62) return v62;
  const v63 = String(v60 || "")
    ["trim"]()
    ["toUpperCase"]();
  return GRSAI_NANO_BANANA_IMAGE_SIZE_SET["has"](v63) ? v63 : "2K";
}
function getGrsaiGptImage2Policy(v64) {
  const v65 = resolveModelExecution(v64, { providerHint: "grsai" }),
    v66 = v65?.["modelManifest"]?.["extensions"]?.["gptImage2"];
  return v66 && typeof v66 === "object" && !Array["isArray"](v66) ? v66 : null;
}
function getGrsaiGptImage2PixelSizesByRatio(v67) {
  const v68 = getGrsaiGptImage2Policy(v67)?.["pixelSizesByRatio"];
  return v68 && typeof v68 === "object" && !Array["isArray"](v68) ? v68 : {};
}
function normalizeGrsaiNanoBananaAspectRatio(v69, v70) {
  const v71 = normalizeRatioLabelText(v69),
    v72 = v71["toLowerCase"]();
  if (
    !v71 ||
    v72 === "auto" ||
    v72 === "adaptive" ||
    v72 === "default" ||
    v71 === "自适应" ||
    v71 === "默认"
  )
    return "auto";
  const v73 = parseRatioLabel(v71);
  if (!v73) return "auto";
  const v74 = v73["label"],
    v75 = new Set(getNanoBananaAllowedRatioLabels(v70));
  return v75["has"](v74) ? v74 : normalizeNanoBananaRatioForFamily(v74, v70);
}
function normalizeGrsaiGptImage2ImageSize(v76, v77) {
  const v78 = getGrsaiGptImage2Policy(v77),
    v79 = new Set(
      (Array["isArray"](v78?.["allowedSizes"]) ? v78["allowedSizes"] : ["1K"])[
        "map"
      ]((v80) =>
        String(v80 || "")
          ["trim"]()
          ["toUpperCase"](),
      ),
    ),
    v81 = String(v78?.["defaultSize"] || "1K")
      ["trim"]()
      ["toUpperCase"](),
    v82 = String(v76 || "")
      ["trim"]()
      ["toUpperCase"]();
  if (v79["has"](v82)) return v82;
  return v79["has"](v81) ? v81 : "1K";
}
function normalizePixelSize(v83) {
  const v84 = String(v83 || "")
    ["trim"]()
    ["match"](/^(\d{2,5})\s*[xX]\s*(\d{2,5})$/);
  if (!v84) return "";
  return v84[1] + "x" + v84[2];
}
function getGrsaiGptImage2RatioOptionsForSize(v85, v86) {
  const v87 = getGrsaiGptImage2PixelSizesByRatio(v86);
  return Object["keys"](v87)
    ["filter"]((v88) => v87[v88]?.[v85])
    ["map"]((v89) => {
      const v90 = parseRatioLabel(v89) || { w: 1, h: 1 };
      return Object["freeze"]({ label: v89, value: v90["w"] / v90["h"] });
    });
}
function getDefaultGrsaiGptImage2PixelSize(v91, v92) {
  return v91["1:1"]?.[v92] || v91["1:1"]?.["1K"] || "1024x1024";
}
function pickClosestGrsaiGptImage2RatioLabel(v93, v94, v95) {
  const v96 = parseRatioLabel(v93),
    v97 = v96 ? v96["w"] / v96["h"] : 1,
    v98 = getGrsaiGptImage2RatioOptionsForSize(v94, v95);
  let v99 = v98[0] || { label: "1:1", value: 1 },
    v100 = Number["POSITIVE_INFINITY"];
  for (const v101 of v98) {
    const v102 = Math["abs"](v97 - v101["value"]);
    v102 < v100 && ((v99 = v101), (v100 = v102));
  }
  return v99?.["label"] || "1:1";
}
function normalizeGrsaiGptImage2AspectRatio(v103, v104, v105) {
  const v106 = getGrsaiGptImage2PixelSizesByRatio(v105),
    v107 = normalizePixelSize(v103);
  if (v107) return v107;
  const v108 = normalizeRatioLabelText(v103),
    v109 = v108["toLowerCase"]();
  if (
    !v108 ||
    v109 === "auto" ||
    v109 === "adaptive" ||
    v109 === "default" ||
    v108 === "自适应" ||
    v108 === "默认"
  )
    return getDefaultGrsaiGptImage2PixelSize(v106, v104);
  const v110 = parseRatioLabel(v108),
    v111 = v110?.["label"] || "1:1",
    v112 = v106[v111]?.[v104];
  if (v112) return v112;
  const v113 = pickClosestGrsaiGptImage2RatioLabel(v111, v104, v105);
  return v106[v113]?.[v104] || getDefaultGrsaiGptImage2PixelSize(v106, v104);
}
function grsaiImage({
  payload: v114,
  finalPrompt: v115,
  modelToken: v116,
  finalUrls: v117,
}) {
  const v118 = normalizeGrsaiImageModel(
      v116 || v114["model"] || "nano-banana-pro-vt",
    ),
    v119 = getGrsaiNanoBananaSelection(v118),
    v120 = v114["resolvedRatioLabel"] || v114["aspectRatio"],
    v121 = v119
      ? normalizeGrsaiNanoBananaAspectRatio(v120, v119["family"])
      : v120,
    v122 = v119
      ? normalizeGrsaiNanoBananaImageSize(v114["imageSize"], v118)
      : v114["imageSize"] || "2K";
  return {
    model: v118,
    prompt: v115,
    images: v117,
    replyType: "json",
    ...(!v114["suppressImageSize"] &&
      !shouldOmitImageSizeParam(v118) && { imageSize: v122 }),
    ...(!v114["suppressAspectRatio"] && v121 && { aspectRatio: v121 }),
  };
}
function grsaiGptImage2Image({
  payload: v123,
  finalPrompt: v124,
  modelToken: v125,
  finalUrls: v126,
}) {
  const v127 = normalizeGrsaiImageModel(v125 || v123["model"] || "gpt-image-2"),
    v128 = normalizeGrsaiGptImage2ImageSize(v123["imageSize"], v127),
    v129 = normalizeGrsaiGptImage2AspectRatio(
      v123["resolvedRatioLabel"] || v123["aspectRatio"],
      v128,
      v127,
    );
  return {
    model: v127,
    prompt: v124,
    images: v126,
    replyType: "json",
    ...(!v123["suppressAspectRatio"] && v129 && { aspectRatio: v129 }),
  };
}
function normalizeRunningHubModelId(v130) {
  return stripPrefix(v130, "runninghub-model/");
}
function getRunningHubImageExecutionPolicy({
  executionManifest: v131,
  modelManifest: v132,
} = {}) {
  const v133 =
    v131?.["extensions"]?.["runningHubImage"] ||
    v132?.["extensions"]?.["runningHubImage"];
  return v133 && typeof v133 === "object" && !Array["isArray"](v133)
    ? v133
    : {};
}
function resolveRunningHubModelEndpoint({
  hasInputImages: v134,
  executionManifest: v135,
  modelManifest: v136,
}) {
  const v137 = getRunningHubImageExecutionPolicy({
    executionManifest: v135,
    modelManifest: v136,
  });
  if (!v134) return v137["textEndpoint"] || "text-to-image";
  return v137["inputEndpoint"] || "image-to-image";
}
function normalizeRunningHubInputUrlsBySlot(v138) {
  if (!v138 || typeof v138 !== "object" || Array["isArray"](v138)) return {};
  return Object["fromEntries"](
    Object["entries"](v138)
      ["map"](([v139, v140]) => [
        String(v139 || "")["trim"](),
        String(v140 || "")["trim"](),
      ])
      ["filter"](([v141, v142]) => v141 && v142),
  );
}
function normalizeRunningHubBodyParamValue(v143, v144) {
  const v145 = String(v144 || "string")
    ["trim"]()
    ["toLowerCase"]();
  if (v145 === "boolean") {
    if (v143 === true || v143 === false) return v143;
    const v146 = String(v143 ?? "")
      ["trim"]()
      ["toLowerCase"]();
    if (["true", "1", "yes", "on"]["includes"](v146)) return true;
    if (["false", "0", "no", "off", ""]["includes"](v146)) return false;
    return Boolean(v143);
  }
  if (v145 === "integer") {
    const v147 = Number["parseInt"](String(v143 ?? "")["trim"](), 10);
    return Number["isFinite"](v147) ? v147 : null;
  }
  if (v145 === "number") {
    const v148 = Number(v143);
    return Number["isFinite"](v148) ? v148 : null;
  }
  return String(v143 ?? "")["trim"]();
}
function assignRunningHubInputSlotFields(v149, v150, v151) {
  const v152 =
    v150?.["inputSlotBodyFields"] &&
    typeof v150["inputSlotBodyFields"] === "object" &&
    !Array["isArray"](v150["inputSlotBodyFields"])
      ? v150["inputSlotBodyFields"]
      : null;
  if (!v152) return {};
  const v153 = normalizeRunningHubInputUrlsBySlot(v151);
  return (
    Object["entries"](v152)["forEach"](([v154, v155]) => {
      const v156 = String(v155 || "")["trim"](),
        v157 = v153[String(v154 || "")["trim"]()];
      if (v156 && v157) v149[v156] = v157;
    }),
    v153
  );
}
function shouldIncludeRunningHubPolicyParam(v158, v159, v160) {
  const v161 =
      v159?.["conditionalParams"] &&
      typeof v159["conditionalParams"] === "object" &&
      !Array["isArray"](v159["conditionalParams"])
        ? v159["conditionalParams"]
        : {},
    v162 = String(v161[v158] || "")["trim"]();
  if (!v162) return true;
  return !!v160?.[v162];
}
function assignRunningHubPolicyParams(v163, v164, v165, v166) {
  const v167 =
    v165?.["constantParams"] &&
    typeof v165["constantParams"] === "object" &&
    !Array["isArray"](v165["constantParams"])
      ? v165["constantParams"]
      : {};
  Object["entries"](v167)["forEach"](([v168, v169]) => {
    if (!shouldIncludeRunningHubPolicyParam(v168, v165, v166)) return;
    v163[v168] = v169;
  });
  const v170 =
    v165?.["bodyParamTypes"] &&
    typeof v165["bodyParamTypes"] === "object" &&
    !Array["isArray"](v165["bodyParamTypes"])
      ? v165["bodyParamTypes"]
      : {};
  Object["entries"](v170)["forEach"](([v171, v172]) => {
    if (Object["prototype"]["hasOwnProperty"]["call"](v163, v171)) return;
    if (!Object["prototype"]["hasOwnProperty"]["call"](v164 || {}, v171))
      return;
    if (!shouldIncludeRunningHubPolicyParam(v171, v165, v166)) return;
    const v173 = v164[v171];
    if (v173 === undefined || v173 === null) return;
    if (typeof v173 === "string" && v173["trim"]() === "") return;
    const v174 = normalizeRunningHubBodyParamValue(v173, v172);
    if (v174 === null || v174 === "") return;
    v163[v171] = v174;
  });
  const v175 =
    v165?.["defaultParams"] &&
    typeof v165["defaultParams"] === "object" &&
    !Array["isArray"](v165["defaultParams"])
      ? v165["defaultParams"]
      : {};
  Object["entries"](v175)["forEach"](([v176, v177]) => {
    if (Object["prototype"]["hasOwnProperty"]["call"](v163, v176)) return;
    if (!shouldIncludeRunningHubPolicyParam(v176, v165, v166)) return;
    v163[v176] = v177;
  });
}
function normalizeRunningHubModelQuality(v178) {
  const v179 = String(v178 || "")
    ["trim"]()
    ["toUpperCase"]();
  return RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[v179]
    ? v179
    : RUNNINGHUB_MODEL_DEFAULT_QUALITY;
}
function normalizeRunningHubModelRatio(v180) {
  const v181 = String(v180 || "")["trim"]();
  if (!v181) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const v182 = normalizeRatioLabelText(v181),
    v183 = v182["toLowerCase"]();
  if (
    v183 === "auto" ||
    v183 === "default" ||
    v183 === "original" ||
    v183 === "adaptive"
  )
    return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  if (!v182["includes"](":")) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const [v184, v185] = v182["split"](":"),
    v186 = Number["parseFloat"](v184),
    v187 = Number["parseFloat"](v185);
  if (!(v186 > 0 && v187 > 0)) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const v188 = v186 + ":" + v187;
  return RUNNINGHUB_MODEL_RATIO_SET["has"](v188)
    ? v188
    : RUNNINGHUB_MODEL_DEFAULT_RATIO;
}
function alignRunningHubDimension(v189) {
  const v190 =
    Math["round"](Number(v189 || 0) / RUNNINGHUB_MODEL_DIMENSION_ALIGN) *
    RUNNINGHUB_MODEL_DIMENSION_ALIGN;
  return Math["max"](
    RUNNINGHUB_MODEL_DIMENSION_MIN,
    Math["min"](RUNNINGHUB_MODEL_DIMENSION_MAX, v190),
  );
}
function resolveRunningHubModelDimensions(v191, v192) {
  const v193 = normalizeRunningHubModelQuality(v191),
    v194 = normalizeRunningHubModelRatio(v192),
    [v195, v196] = v194["split"](":"),
    v197 = Number["parseFloat"](v195) || 1,
    v198 = Number["parseFloat"](v196) || 1,
    v199 =
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[v193] ||
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[RUNNINGHUB_MODEL_DEFAULT_QUALITY],
    v200 = v197 / v198,
    v201 = Math["sqrt"](v199 / v200),
    v202 = v201 * v200;
  return {
    width: alignRunningHubDimension(v202),
    height: alignRunningHubDimension(v201),
  };
}
function isAdaptiveRatioInput(v203) {
  const v204 = String(v203 || "")["trim"]();
  if (!v204) return true;
  const v205 = normalizeRatioLabelText(v204),
    v206 = v205["toLowerCase"]();
  return (
    v206 === "auto" ||
    v206 === "default" ||
    v206 === "adaptive" ||
    v206 === "original" ||
    !v205["includes"](":")
  );
}
function runninghubImage({
  payload: v207,
  finalPrompt: v208,
  modelToken: v209,
  finalUrls: v210,
  finalUrlsBySlot: finalUrlsBySlot = {},
  executionManifest: v211,
  modelManifest: v212,
}) {
  const v213 = normalizeRunningHubModelId(v209),
    v214 = getRunningHubImageExecutionPolicy({
      executionManifest: v211,
      modelManifest: v212,
    }),
    v215 = v212?.["modelId"] || "runninghub-model/" + v213,
    v216 =
      v214["omitResolution"] === true ||
      isRunningHubModelWithoutImageSizeParam(v207["model"]),
    v217 =
      normalizeImageSizeForProviderModel({
        model: v215,
        provider: "runninghub",
        imageSize: v207["imageSize"],
      }) || v207["imageSize"],
    v218 = { "1K": "1k", "2K": "2k", "4K": "4k" },
    v219 = v218[v217] || "2k",
    v220 = resolveProviderRatioPayload({
      provider: "runninghub",
      model: "runninghub-model/" + v213,
      ratioLabel: v207["resolvedRatioLabel"] || v207["aspectRatio"],
      imageSize: v217,
      suppressAspectRatio: v207["suppressAspectRatio"],
    }),
    v221 = String(v220?.["params"]?.["aspectRatio"] || "")["trim"](),
    v222 = v221["toLowerCase"](),
    v223 = v207["resolvedRatioLabel"] || v207["aspectRatio"],
    v224 =
      v214["aspectRatioMode"] === "dimensions" ||
      v212?.["extensions"]?.["ratioPolicy"]?.["capability"] === "dimensions",
    v225 = v224
      ? v220?.["ratioCapability"] === "dimensions"
        ? {
            width: Number(v220?.["params"]?.["width"]) || 2048,
            height: Number(v220?.["params"]?.["height"]) || 2048,
          }
        : resolveRunningHubModelDimensions(v217, v207["aspectRatio"])
      : null,
    v226 =
      v224 ||
      v207["suppressAspectRatio"] ||
      isAdaptiveRatioInput(v223) ||
      !v221 ||
      v222 === "auto" ||
      v222 === "default" ||
      v222 === "adaptive" ||
      v222 === "original",
    v227 = {
      prompt: v208 || "",
      ...(v224
        ? { width: v225?.["width"] || 2048, height: v225?.["height"] || 2048 }
        : !v216
          ? { resolution: v219 }
          : {}),
      ...(v214["quality"] ? { quality: v214["quality"] } : {}),
      ...(!v226 && { aspectRatio: v221 }),
      ...(v207["negativePrompt"] && { negativePrompt: v207["negativePrompt"] }),
      ...(v207["seed"] && { seed: v207["seed"] }),
    },
    v228 = assignRunningHubInputSlotFields(v227, v214, finalUrlsBySlot);
  return (
    assignRunningHubPolicyParams(v227, v207, v214, v228),
    v210["length"] > 0 &&
      !v214["inputSlotBodyFields"] &&
      (v227["imageUrls"] = v210),
    v227
  );
}
function normalizeSeedanceVideoSize(v229) {
  const v230 = String(v229 || "")["trim"]();
  if (!v230 || v230 === "auto" || v230 === "default") return "16:9";
  return normalizeRatioLabelText(v230);
}
function normalizeSeedanceAspectRatio(v231) {
  return normalizeSeedanceVideoSize(v231 || "16:9");
}
function getApimartSeedanceVideoPolicy(v232) {
  const v233 = v232?.["extensions"]?.["seedanceVideo"];
  return v233 && typeof v233 === "object" && !Array["isArray"](v233)
    ? v233
    : {};
}
function normalizePositiveInteger(v234, v235) {
  const v236 = Number["parseInt"](String(v234 ?? "")["trim"](), 10);
  return Number["isFinite"](v236) && v236 >= 0 ? v236 : v235;
}
function normalizeInputList(v237) {
  return Array["isArray"](v237)
    ? v237["map"]((v238) => String(v238 || "")["trim"]())["filter"](Boolean)
    : [];
}
function normalizeApimartVeo3ModelChoice(v239) {
  const v240 = String(v239 || "")
    ["trim"]()
    ["toLowerCase"]();
  return VEO3_MODEL_CHOICES["has"](v240) ? v240 : "fast";
}
function getApimartVeo3ModelChoice(v241 = {}) {
  return normalizeApimartVeo3ModelChoice(
    v241?.["generationParams"]?.["mode"] ?? v241?.["mode"],
  );
}
function normalizeApimartVeo3GenerationType(
  v242,
  { modelChoice: modelChoice = "fast" } = {},
) {
  const v243 = String(v242 || "")
      ["trim"]()
      ["toLowerCase"](),
    v244 = VEO3_IMAGE_GENERATION_TYPES["has"](v243) ? v243 : "frame";
  if (normalizeApimartVeo3ModelChoice(modelChoice) === "quality")
    return "frame";
  return v244;
}
function getApimartVeo3GenerationType(v245 = {}) {
  const v246 = getApimartVeo3ModelChoice(v245);
  return normalizeApimartVeo3GenerationType(
    v245?.["generationParams"]?.["generation_type"] ??
      v245?.["generation_type"],
    { modelChoice: v246 },
  );
}
function validateApimartVeo3ImageCount(
  v247 = {},
  v248 = 0,
  { allowTextOnly: allowTextOnly = false } = {},
) {
  const v249 = Math["max"](0, Math["trunc"](Number(v248) || 0));
  if (allowTextOnly && v249 === 0)
    return Object["freeze"]({ ok: true, message: "" });
  const v250 = getApimartVeo3GenerationType(v247);
  if (v250 === "reference")
    return Object["freeze"]({
      ok: v249 <= 3,
      message: v249 <= 3 ? "" : "VEO3\x20参考图模式最多接入\x203\x20张图片",
    });
  return Object["freeze"]({
    ok: v249 <= 2,
    message: v249 <= 2 ? "" : "VEO3 首尾帧模式最多接入 2 张图片",
  });
}
function collectVideoInputUrls(v251) {
  return Array["from"](
    new Set(
      [
        String(v251["videoUrl"] || "")["trim"](),
        ...normalizeInputList(v251["videos"]),
        ...normalizeInputList(v251["videoUrls"]),
      ]["filter"](Boolean),
    ),
  );
}
function collectAudioInputUrls(v252) {
  return Array["from"](
    new Set(
      [
        String(v252["audioUrl"] || "")["trim"](),
        ...normalizeInputList(v252["audios"]),
        ...normalizeInputList(v252["audioUrls"]),
      ]["filter"](Boolean),
    ),
  );
}
async function resolveInputVideos(v253, v254, v255) {
  const v256 = collectVideoInputUrls(v253);
  if (v256["length"] === 0) return [];
  if (typeof v255["processInputVideos"] !== "function")
    throw new Error("APIMART video input upload is not available");
  const v257 = await v255["processInputVideos"](v256, v254, {
    provider: "apimart",
    strictUpload: true,
  });
  if (!Array["isArray"](v257) || v257["length"] === 0)
    throw new Error("APIMART video upload failed");
  return v257["map"]((v258) => String(v258 || "")["trim"]())["filter"](Boolean);
}
async function resolveInputAudios(v259, v260, v261) {
  const v262 = collectAudioInputUrls(v259);
  if (v262["length"] === 0) return [];
  if (typeof v261["processInputAudios"] !== "function")
    throw new Error("APIMART audio input upload is not available");
  const v263 = await v261["processInputAudios"](v262, v260, {
    provider: "apimart",
    strictUpload: true,
  });
  if (!Array["isArray"](v263) || v263["length"] === 0)
    throw new Error("APIMART audio upload failed");
  return v263["map"]((v264) => String(v264 || "")["trim"]())["filter"](Boolean);
}
async function apimartSeedanceVideo({
  payload: v265,
  finalPrompt: v266,
  modelToken: v267,
  apiKey: v268,
  ctx: v269,
  executionManifest: v270,
}) {
  const v271 = v267 || stripPrefix(v265["model"], "apimart/"),
    v272 = getApimartSeedanceVideoPolicy(v270),
    v273 = supportsApimartPrivateAvatarAssets(v271, v272),
    v274 = v272["supportsVideoReferences"] === true,
    v275 = v272["supportsAudioReferences"] === true,
    v276 = applyApimartPrivateAvatarAssetsToUrls(
      collectVideoInputUrls(v265),
      v265,
      { sourceKind: "video", enabled: v273 },
    );
  if (!v274 && v276["length"] > 0)
    throw new Error(
      "APIMart\x20Seedance\x20model\x20does\x20not\x20support\x20video\x20references",
    );
  const v277 =
      v276["length"] > 0 && v274
        ? await resolveInputVideos(v265, v268, v269)
        : [],
    v278 = applyApimartPrivateAvatarAssetsToUrls(
      [
        String(v265["first"] || v265["firstFrameUrl"] || "")["trim"](),
        String(v265["last"] || v265["lastFrameUrl"] || "")["trim"](),
      ]["filter"](Boolean),
      v265,
      { sourceKind: "image", enabled: v273 },
    ),
    v279 = normalizePositiveInteger(v272["maxRoleImageCount"], 2);
  if (v278["length"] > v279)
    throw new Error(
      v272["roleImageLimitError"] ||
        "APIMart Seedance model does not support this many role images",
    );
  let v280 = [];
  if (v278["length"] > 0) {
    const v281 = await v269["processInputImages"](v278, v268, {
      applyInputQualityProfile: true,
      provider: "apimart",
      strictUpload: true,
    });
    v280 = [
      v281?.[0]
        ? { url: String(v281[0])["trim"](), role: "first_frame" }
        : null,
      v281?.[1] ? { url: String(v281[1])["trim"](), role: "last_frame" } : null,
    ]["filter"](Boolean);
  }
  const v282 = Array["isArray"](v265["images"])
      ? v265["images"]
      : Array["isArray"](v265["inputUrls"])
        ? v265["inputUrls"]
        : [],
    v283 = applyApimartPrivateAvatarAssetsToUrls(v282, v265, {
      sourceKind: "image",
      enabled: v273,
    }),
    v284 =
      v283["length"] > 0 && v280["length"] <= 0
        ? await v269["processInputImages"](v283, v268, {
            applyInputQualityProfile: true,
            provider: "apimart",
            strictUpload: true,
          })
        : [],
    v285 = applyApimartPrivateAvatarAssetsToUrls(
      collectAudioInputUrls(v265),
      v265,
      { sourceKind: "audio", enabled: v273 },
    );
  if (!v275 && v285["length"] > 0)
    throw new Error(
      "APIMart\x20Seedance\x20model\x20does\x20not\x20support\x20audio\x20references",
    );
  const v286 =
      v275 && v285["length"] > 0
        ? await resolveInputAudios(v265, v268, v269)
        : [],
    v287 = {
      model: v271,
      prompt: v266,
      duration: v265["duration"] || 5,
      resolution: v265["resolution"] || v272["defaultResolution"] || "720p",
    };
  v272["ratioField"] === "size"
    ? (v287["size"] = normalizeSeedanceVideoSize(
        v265["resolvedRatioLabel"] || v265["aspectRatio"] || v265["size"],
      ))
    : (v287["aspect_ratio"] = normalizeSeedanceAspectRatio(
        v265["resolvedRatioLabel"] ||
          v265["aspectRatio"] ||
          v265["aspect_ratio"],
      ));
  if (isPresentValue(v265["seed"])) v287["seed"] = v265["seed"];
  v272["supportsGenerateAudioParam"] === true &&
    (v265["audio"] === true || v265["generateAudio"] === true) &&
    (v287["audio"] = true);
  v272["supportsCameraFixedParam"] === true &&
    v265["camerafixed"] === true &&
    (v287["camerafixed"] = true);
  if (v280["length"] > 0) v287["image_with_roles"] = v280;
  else {
    if (v284["length"] > 0) {
      const v288 = normalizePositiveInteger(v272["maxImageCount"], 1);
      v287["image_urls"] = v284["slice"](0, v288);
    }
  }
  return (
    v274 &&
      v280["length"] <= 0 &&
      v277["length"] > 0 &&
      (v287["video_urls"] = v277["slice"](
        0,
        normalizePositiveInteger(v272["maxVideoReferenceCount"], 3),
      )),
    v275 &&
      v280["length"] <= 0 &&
      v286["length"] > 0 &&
      (v287["audio_urls"] = v286["slice"](
        0,
        normalizePositiveInteger(v272["maxAudioReferenceCount"], 3),
      )),
    v287
  );
}
function apimartVeo3Video({
  currentBody: v289,
  inputImages: inputImages = [],
  payload: payload = {},
}) {
  const v290 = { ...v289 },
    v291 = normalizeInputList(inputImages),
    v292 = getApimartVeo3ModelChoice(payload),
    v293 = getApimartVeo3GenerationType(payload);
  ((v290["duration"] = 8), delete v290["official_fallback"]);
  const v294 = String(v290["resolution"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v290["enable_gif"] === true && (v294 === "1080p" || v294 === "4k"))
    throw new Error("APIMart VEO3 GIF output only supports 720p resolution");
  const v295 = validateApimartVeo3ImageCount(
    { generationParams: { mode: v292, generation_type: v293 } },
    v291["length"],
    { allowTextOnly: true },
  );
  if (!v295["ok"]) throw new Error(v295["message"]);
  if (v291["length"] === 0)
    return (delete v290["generation_type"], delete v290["image_urls"], v290);
  return (
    (v290["generation_type"] = v293 === "reference" ? "reference" : "frame"),
    (v290["image_urls"] =
      v290["generation_type"] === "reference"
        ? v291["slice"](0, 3)
        : v291["slice"](0, 2)),
    v290
  );
}
function apimartHappyHorseVideo({
  currentBody: v296,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = "",
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v297 = { ...v296 },
    v298 = String(v297["prompt"] || finalPrompt || payload?.["prompt"] || "")[
      "trim"
    ]();
  if (!v298) throw new Error("HappyHorse 1.0 prompt is required");
  const v299 = normalizeInputList(inputImages),
    v300 = normalizeInputList(inputVideos),
    v301 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    v302 = (v303 = [], v304 = []) => {
      const v305 = [],
        v306 = (v307) => {
          const v308 = String(v307 || "")["trim"]();
          if (v308 && !v305["includes"](v308)) v305["push"](v308);
        };
      return (
        v303["forEach"]((v309) => v306(v301[v309])),
        normalizeInputList(v304)["forEach"](v306),
        v305
      );
    };
  let v310 = String(
    payload?.["generationParams"]?.["happyhorse_mode"] ||
      payload?.["happyhorse_mode"] ||
      "auto",
  )["trim"]();
  const v311 =
    v299["length"] > 0 ||
    v300["length"] > 0 ||
    Object["keys"](v301)["length"] > 0;
  (v310 === "image" || v310 === "reference" || v310 === "edit") &&
    !v311 &&
    (v310 = "auto");
  delete v297["happyhorse_mode"];
  if (v310 === "edit") {
    if (!v300[0])
      throw new Error("HappyHorse 1.0 video edit requires video_url input");
    const v312 = v302(["editRefImage"], v299);
    v297["video_url"] = v300[0];
    if (v312["length"] > 0) v297["image_urls"] = v312["slice"](0, 5);
    const v313 = String(
      payload?.["generationParams"]?.["audio_setting"] ||
        payload?.["audio_setting"] ||
        "",
    )["trim"]();
    return (
      (v313 === "auto" || v313 === "origin") && (v297["audio_setting"] = v313),
      delete v297["first_frame_image"],
      delete v297["size"],
      delete v297["duration"],
      v297
    );
  }
  delete v297["audio_setting"];
  if (v310 === "image") {
    const v314 = v302(["firstFrame"], v299);
    if (!v314[0])
      throw new Error(
        "HappyHorse 1.0 image-to-video requires first_frame_image input",
      );
    return (
      (v297["first_frame_image"] = v314[0]),
      delete v297["image_urls"],
      delete v297["video_url"],
      delete v297["size"],
      v297
    );
  }
  if (v310 === "reference") {
    const v315 = v302(["referenceImage"], v299);
    if (v315["length"] <= 0)
      throw new Error(
        "HappyHorse 1.0 reference mode requires image_urls input",
      );
    return (
      (v297["image_urls"] = v315["slice"](0, 9)),
      delete v297["first_frame_image"],
      delete v297["video_url"],
      v297
    );
  }
  if (v310 !== "auto")
    throw new Error("Unsupported HappyHorse 1.0 mode: " + v310);
  if (v299["length"] > 0 || v300["length"] > 0)
    throw new Error(
      "HappyHorse\x201.0\x20media\x20inputs\x20require\x20an\x20explicit\x20mode\x20selection",
    );
  return (
    delete v297["first_frame_image"],
    delete v297["image_urls"],
    delete v297["video_url"],
    v297
  );
}
const RUNNINGHUB_HAPPYHORSE_ENDPOINTS = Object["freeze"]({
  text: "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video",
  image:
    "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video",
  reference:
    "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/reference-to-video",
  edit: "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/video-edit",
});
function normalizeHappyHorseGenerationMode(v316) {
  const v317 = String(v316 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v317 === "image" || v317 === "reference" || v317 === "edit"
    ? v317
    : "auto";
}
function getRunningHubHappyHorseMode(v318 = {}, v319 = {}) {
  return normalizeHappyHorseGenerationMode(
    v319["happyhorse_mode"] ||
      v318?.["generationParams"]?.["happyhorse_mode"] ||
      v318?.["happyhorse_mode"],
  );
}
function normalizeRunningHubHappyHorseAudioSettingValue(v320) {
  const v321 = String(v320 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v321 === "origin" ? "origin" : "auto";
}
function runninghubHappyHorseVideo({
  currentBody: v322,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalPrompt: finalPrompt = "",
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v323 = { ...v322 },
    v324 = String(v323["prompt"] || finalPrompt || payload?.["prompt"] || "")[
      "trim"
    ]();
  if (!v324) throw new Error("RunningHub HappyHorse 1.0 prompt is required");
  const v325 = normalizeInputList(inputImages),
    v326 = normalizeInputList(inputVideos),
    v327 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    v328 = (v329 = [], v330 = []) => {
      const v331 = [],
        v332 = (v333) => {
          const v334 = String(v333 || "")["trim"]();
          if (v334 && !v331["includes"](v334)) v331["push"](v334);
        };
      return (
        v329["forEach"]((v335) => v332(v327[v335])),
        normalizeInputList(v330)["forEach"](v332),
        v331
      );
    };
  let v336 = getRunningHubHappyHorseMode(payload, v323);
  const v337 =
    v325["length"] > 0 ||
    v326["length"] > 0 ||
    Object["keys"](v327)["length"] > 0;
  v336 !== "auto" && !v337 && (v336 = "auto");
  ((v323["prompt"] = v324),
    delete v323["happyhorse_mode"],
    delete v323["imageUrl"],
    delete v323["imageUrls"],
    delete v323["videoUrl"]);
  if (v336 === "edit") {
    if (!v326[0])
      throw new Error(
        "RunningHub HappyHorse 1.0 video edit requires videoUrl input",
      );
    const v338 = v328(["editRefImage"], v325);
    v323["videoUrl"] = v326[0];
    if (v338["length"] > 0) v323["imageUrls"] = v338["slice"](0, 5);
    return (
      (v323["audioSetting"] = normalizeRunningHubHappyHorseAudioSettingValue(
        v323["audioSetting"] ??
          payload?.["generationParams"]?.["audioSetting"] ??
          payload?.["generationParams"]?.["audio_setting"] ??
          payload?.["audioSetting"] ??
          payload?.["audio_setting"],
      )),
      delete v323["aspectRatio"],
      delete v323["duration"],
      delete v323["imageUrl"],
      v323
    );
  }
  delete v323["audioSetting"];
  if (v336 === "image") {
    const v339 = v328(["firstFrame"], v325);
    if (!v339[0])
      throw new Error(
        "RunningHub HappyHorse 1.0 image-to-video requires imageUrl input",
      );
    return (
      (v323["imageUrl"] = v339[0]),
      delete v323["imageUrls"],
      delete v323["videoUrl"],
      delete v323["aspectRatio"],
      v323
    );
  }
  if (v336 === "reference") {
    const v340 = v328(["referenceImage"], v325);
    if (v340["length"] <= 0)
      throw new Error(
        "RunningHub HappyHorse 1.0 reference mode requires imageUrls input",
      );
    return (
      (v323["imageUrls"] = v340["slice"](0, 9)),
      delete v323["imageUrl"],
      delete v323["videoUrl"],
      v323
    );
  }
  if (v325["length"] > 0 || v326["length"] > 0)
    throw new Error(
      "RunningHub\x20HappyHorse\x201.0\x20media\x20inputs\x20require\x20an\x20explicit\x20mode\x20selection",
    );
  return (
    delete v323["imageUrl"],
    delete v323["imageUrls"],
    delete v323["videoUrl"],
    v323
  );
}
function hasRunningHubHappyHorseEndpointMedia({
  currentBody: currentBody = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
} = {}) {
  return (
    normalizeInputList(inputImages)["length"] > 0 ||
    normalizeInputList(inputVideos)["length"] > 0 ||
    Object["keys"](normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot))[
      "length"
    ] > 0 ||
    Boolean(
      String(currentBody?.["imageUrl"] || currentBody?.["videoUrl"] || "")[
        "trim"
      ](),
    ) ||
    normalizeInputList(currentBody?.["imageUrls"])["length"] > 0
  );
}
function runninghubHappyHorseVideoEndpoint(v341 = {}) {
  const { payload: payload = {}, currentBody: currentBody = {} } = v341;
  let v342 = getRunningHubHappyHorseMode(payload, currentBody);
  return (
    v342 !== "auto" &&
      !hasRunningHubHappyHorseEndpointMedia(v341) &&
      (v342 = "auto"),
    RUNNINGHUB_HAPPYHORSE_ENDPOINTS[v342] ||
      RUNNINGHUB_HAPPYHORSE_ENDPOINTS["text"]
  );
}
const RUNNINGHUB_SEEDANCE_2_ENDPOINTS = Object["freeze"]({
  fast: Object["freeze"]({
    text: "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video",
    image:
      "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video",
    reference:
      "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/multimodal-video",
  }),
  standard: Object["freeze"]({
    text: "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/text-to-video",
    image:
      "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/image-to-video",
    reference:
      "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/multimodal-video",
  }),
});
function normalizeRunningHubSeedance2Model(v343) {
  const v344 = String(v343 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v344 === "standard" || v344 === "std" ? "standard" : "fast";
}
function normalizeRunningHubSeedance2Mode(v345) {
  const v346 = String(v345 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v346 === "multimodal2video" || v346 === "reference")
    return "multimodal2video";
  if (v346 === "frames2video" || v346 === "frames") return "frames2video";
  if (v346 === "image2video" || v346 === "image" || v346 === "frame")
    return "image2video";
  return "text2video";
}
function getRunningHubSeedance2Model(v347 = {}, v348 = {}) {
  return normalizeRunningHubSeedance2Model(
    v348["rh_seedance_2_model"] ||
      v347?.["generationParams"]?.["rh_seedance_2_model"] ||
      v347?.["rh_seedance_2_model"],
  );
}
function getRunningHubSeedance2Mode(v349 = {}, v350 = {}) {
  return normalizeRunningHubSeedance2Mode(
    v350["rh_seedance_2_mode"] ||
      v349?.["generationParams"]?.["rh_seedance_2_mode"] ||
      v349?.["rh_seedance_2_mode"],
  );
}
function collectRunningHubSeedance2SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const v351 = [],
    v352 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    v353 = new Set(normalizeInputList(Object["values"](v352)));
  return (
    slotIds["forEach"]((v354) => appendUniqueUrl(v351, v352[v354])),
    normalizeInputList(inputImages)["forEach"]((v355) => {
      if (!v353["has"](v355)) appendUniqueUrl(v351, v355);
    }),
    v351
  );
}
function collectRunningHubSeedance2FrameImages(v356 = {}) {
  return collectRunningHubSeedance2SlotImages({
    ...v356,
    slotIds: ["firstFrame", "lastFrame"],
  });
}
function collectRunningHubSeedance2ReferenceImages(v357 = {}) {
  return collectRunningHubSeedance2SlotImages({
    ...v357,
    slotIds: ["referenceImage"],
  });
}
function resolveRunningHubSeedance2Route({
  payload: payload = {},
  currentBody: currentBody = {},
} = {}) {
  const v358 = getRunningHubSeedance2Model(payload, currentBody),
    v359 = getRunningHubSeedance2Mode(payload, currentBody);
  if (v359 === "multimodal2video")
    return Object["freeze"]({ model: v358, route: "reference" });
  if (v359 === "image2video" || v359 === "frames2video")
    return Object["freeze"]({ model: v358, route: "image" });
  return Object["freeze"]({ model: v358, route: "text" });
}
function removeRunningHubSeedance2TransientFields(v360) {
  (delete v360["rh_seedance_2_model"],
    delete v360["rh_seedance_2_mode"],
    delete v360["firstFrameUrl"],
    delete v360["lastFrameUrl"],
    delete v360["imageUrls"],
    delete v360["videoUrls"],
    delete v360["audioUrls"]);
}
function normalizeRunningHubSeedance2ConversionSlots(v361) {
  const v362 = Array["isArray"](v361) ? v361 : ["all"],
    v363 = v362["map"]((v364) => String(v364 || "")["trim"]())["filter"](
      Boolean,
    );
  return v363["length"] > 0 ? v363 : ["all"];
}
function runninghubSeedance2Video({
  currentBody: v365,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = "",
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v366 = { ...v365 },
    v367 = String(v366["prompt"] || finalPrompt || payload?.["prompt"] || "")[
      "trim"
    ]();
  if (!v367) throw new Error("RunningHub Seedance 2.0 prompt is required");
  const v368 = getRunningHubSeedance2Mode(payload, v366),
    v369 = collectRunningHubSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    v370 = collectRunningHubSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    v371 = normalizeInputList(inputVideos),
    v372 = normalizeInputList(inputAudios),
    v373 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, "video"),
    v374 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, "audio");
  ((v366["prompt"] = v367), removeRunningHubSeedance2TransientFields(v366));
  if (v368 === "multimodal2video") {
    if (v370["length"] + v371["length"] <= 0)
      throw new Error(
        "RunningHub Seedance 2.0 multimodal mode requires image or video input",
      );
    if (v370["length"] > 9)
      throw new Error(
        "RunningHub Seedance 2.0 multimodal mode supports at most 9 image inputs",
      );
    if (v373 > 3)
      throw new Error(
        "RunningHub Seedance 2.0 multimodal mode supports at most 3 video inputs",
      );
    if (v374 > 3)
      throw new Error(
        "RunningHub Seedance 2.0 multimodal mode supports at most 3 audio inputs",
      );
    if (v372["length"] > 0 && v370["length"] + v371["length"] <= 0)
      throw new Error(
        "RunningHub Seedance 2.0 audio input requires image or video input",
      );
    if (v370["length"] > 0) v366["imageUrls"] = v370["slice"](0, 9);
    if (v371["length"] > 0) v366["videoUrls"] = v371["slice"](0, 3);
    if (v372["length"] > 0) v366["audioUrls"] = v372["slice"](0, 3);
    return (
      v366["realPersonMode"] === true
        ? (v366["conversionSlots"] =
            normalizeRunningHubSeedance2ConversionSlots(
              v366["conversionSlots"],
            ))
        : delete v366["conversionSlots"],
      delete v366["webSearch"],
      v366
    );
  }
  if (v373 > 0)
    throw new Error(
      "RunningHub Seedance 2.0 text/image/frame modes do not accept video input; use multimodal mode",
    );
  if (v374 > 0)
    throw new Error(
      "RunningHub Seedance 2.0 text/image/frame modes do not accept audio input; use multimodal mode",
    );
  if (v368 === "text2video") {
    if (v369["length"] > 0)
      throw new Error(
        "RunningHub Seedance 2.0 text-to-video mode does not accept image input",
      );
    return (
      delete v366["realPersonMode"],
      delete v366["conversionSlots"],
      v366
    );
  }
  if (v368 === "image2video" && v369["length"] !== 1)
    throw new Error(
      "RunningHub Seedance 2.0 image-to-video mode requires exactly 1 image input",
    );
  if (v368 === "frames2video" && v369["length"] !== 2)
    throw new Error(
      "RunningHub Seedance 2.0 first-last-frame mode requires exactly 2 image inputs",
    );
  v366["firstFrameUrl"] = v369[0];
  if (v369[1]) v366["lastFrameUrl"] = v369[1];
  return (
    delete v366["webSearch"],
    v366["realPersonMode"] === true
      ? (v366["conversionSlots"] = normalizeRunningHubSeedance2ConversionSlots(
          v366["conversionSlots"],
        ))
      : delete v366["conversionSlots"],
    v366
  );
}
function runninghubSeedance2VideoEndpoint({ payload: payload = {} }) {
  const { model: v375, route: v376 } = resolveRunningHubSeedance2Route({
    payload: payload,
  });
  return (
    RUNNINGHUB_SEEDANCE_2_ENDPOINTS[v375]?.[v376] ||
    RUNNINGHUB_SEEDANCE_2_ENDPOINTS["fast"]["text"]
  );
}
function normalizeVolcengineSeedance2Mode(v377) {
  return normalizeRunningHubSeedance2Mode(v377);
}
function getVolcengineSeedance2Mode(v378 = {}, v379 = {}) {
  return normalizeVolcengineSeedance2Mode(
    v378?.["dreaminaRouteMode"] ||
      v378?.["dreaminaTaskType"] ||
      v378?.["generationParams"]?.["dreaminaRouteMode"] ||
      v379["volcengine_seedance_2_mode"] ||
      v378?.["generationParams"]?.["volcengine_seedance_2_mode"] ||
      v378?.["volcengine_seedance_2_mode"],
  );
}
function resolveVolcengineSeedance2TaskType({
  routeMode: routeMode = "",
  frameImageCount: frameImageCount = 0,
  referenceImageCount: referenceImageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const v380 = normalizeVolcengineSeedance2Mode(routeMode),
    v381 = normalizePositiveInteger(frameImageCount, 0),
    v382 = normalizePositiveInteger(referenceImageCount, 0),
    v383 = normalizePositiveInteger(videoCount, 0),
    v384 = normalizePositiveInteger(audioCount, 0);
  if (v380 === "frames2video") {
    if (v381 >= 2) return "frames2video";
    if (v381 === 1) return "image2video";
    return "text2video";
  }
  if (v380 === "image2video") return "image2video";
  if (v380 === "text2video") return "text2video";
  if (v382 > 0 || v383 > 0 || v384 > 0) return "multimodal2video";
  return "text2video";
}
function normalizeVolcengineSeedance2Resolution(v385, v386 = {}, v387 = "") {
  const v388 = String(v385 || v386["defaultResolution"] || "720p")
      ["trim"]()
      ["toLowerCase"](),
    v389 = /fast/i["test"](String(v387 || ""));
  if (v388 === "1080p" && !v389) return "1080p";
  if (v388 === "480p") return "480p";
  return "720p";
}
function normalizeVolcengineSeedance2Ratio(v390, v391 = {}) {
  const v392 = String(v390 || "")["trim"]();
  if (!v392 || v392 === "auto" || v392 === "default" || v392 === "自适应")
    return v391["defaultRatio"] || "adaptive";
  const v393 = normalizeRatioLabelText(v392);
  return ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"]["includes"](v393)
    ? v393
    : v391["defaultRatio"] || "adaptive";
}
function normalizeVolcengineSeedance2Duration(v394, v395 = {}) {
  const v396 = Number(v394);
  if (v396 === -1) return -1;
  const v397 = normalizePositiveInteger(v395["minDuration"], 4),
    v398 = normalizePositiveInteger(v395["maxDuration"], 15);
  if (!Number["isFinite"](v396)) return 5;
  return Math["max"](v397, Math["min"](v398, Math["trunc"](v396)));
}
function normalizeVolcengineSeedance2Seed(v399) {
  if (!isPresentValue(v399)) return null;
  const v400 = Number["parseInt"](String(v399)["trim"](), 10);
  return Number["isFinite"](v400) ? v400 : null;
}
function getVolcengineSeedance2Policy(v401) {
  const v402 = v401?.["extensions"]?.["seedanceVideo"];
  return v402 && typeof v402 === "object" && !Array["isArray"](v402)
    ? v402
    : {};
}
function getVolcengineSlotMedia(v403 = {}, v404) {
  return String(normalizeRunningHubInputUrlsBySlot(v403)[v404] || "")["trim"]();
}
function collectVolcengineSeedance2FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v405 = [];
  return (
    appendUniqueUrl(
      v405,
      getVolcengineSlotMedia(finalUrlsBySlot, "firstFrame"),
    ),
    appendUniqueUrl(v405, getVolcengineSlotMedia(finalUrlsBySlot, "lastFrame")),
    normalizeInputList(inputImages)["forEach"]((v406) =>
      appendUniqueUrl(v405, v406),
    ),
    v405
  );
}
function collectVolcengineSeedance2ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v407 = [];
  appendUniqueUrl(
    v407,
    getVolcengineSlotMedia(finalUrlsBySlot, "referenceImage"),
  );
  const v408 = new Set(
    normalizeInputList(
      Object["values"](normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot)),
    ),
  );
  return (
    normalizeInputList(inputImages)["forEach"]((v409) => {
      if (!v408["has"](v409)) appendUniqueUrl(v407, v409);
    }),
    v407
  );
}
function pushVolcengineContentItem(v410, v411, v412, v413) {
  const v414 = String(v412 || "")["trim"]();
  if (!v414) return;
  const v415 = { type: v411 };
  if (v411 === "image_url") v415["image_url"] = { url: v414 };
  else {
    if (v411 === "video_url") v415["video_url"] = { url: v414 };
    else {
      if (v411 === "audio_url") v415["audio_url"] = { url: v414 };
    }
  }
  if (v413) v415["role"] = v413;
  v410["push"](v415);
}
function volcengineSeedance2Video({
  currentBody: v416,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = "",
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = "",
  executionManifest: v417,
}) {
  const v418 = { ...v416 },
    v419 = getVolcengineSeedance2Policy(v417),
    v420 = String(v418["prompt"] || finalPrompt || payload?.["prompt"] || "")[
      "trim"
    ](),
    v421 = getVolcengineSeedance2Mode(payload, v418),
    v422 = collectVolcengineSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    v423 = collectVolcengineSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    v424 = normalizeInputList(inputVideos),
    v425 = normalizeInputList(inputAudios),
    v426 = resolveVolcengineSeedance2TaskType({
      routeMode: v421,
      frameImageCount: v422["length"],
      referenceImageCount: v423["length"],
      videoCount: v424["length"],
      audioCount: v425["length"],
    }),
    v427 = [];
  if (v420) v427["push"]({ type: "text", text: v420 });
  if (v426 === "text2video") {
    if (!v420) throw new Error("Volcengine Seedance 2.0 prompt is required");
    if (v422["length"] > 0 || v424["length"] > 0 || v425["length"] > 0)
      throw new Error(
        "Volcengine Seedance 2.0 text mode does not accept media input",
      );
  } else {
    if (v426 === "image2video") {
      if (v424["length"] > 0 || v425["length"] > 0)
        throw new Error(
          "Volcengine Seedance 2.0 image mode does not accept video or audio input",
        );
      if (v422["length"] < 1)
        throw new Error(
          "Volcengine Seedance 2.0 image mode requires 1 image input",
        );
      pushVolcengineContentItem(v427, "image_url", v422[0], "first_frame");
    } else {
      if (v426 === "frames2video") {
        if (v424["length"] > 0 || v425["length"] > 0)
          throw new Error(
            "Volcengine Seedance 2.0 first-last-frame mode only accepts images",
          );
        if (v422["length"] < 2)
          throw new Error(
            "Volcengine Seedance 2.0 first-last-frame mode requires 2 image inputs",
          );
        (pushVolcengineContentItem(v427, "image_url", v422[0], "first_frame"),
          pushVolcengineContentItem(v427, "image_url", v422[1], "last_frame"));
      } else {
        const v428 = normalizePositiveInteger(v419["maxImageCount"], 9),
          v429 = normalizePositiveInteger(v419["maxVideoReferenceCount"], 3),
          v430 = normalizePositiveInteger(v419["maxAudioReferenceCount"], 3);
        if (v423["length"] + v424["length"] <= 0)
          throw new Error(
            "Volcengine\x20Seedance\x202.0\x20multimodal\x20mode\x20requires\x20image\x20or\x20video\x20input",
          );
        if (v423["length"] > v428)
          throw new Error(
            "Volcengine Seedance 2.0 multimodal mode supports at most 9 image inputs",
          );
        if (v424["length"] > v429)
          throw new Error(
            "Volcengine Seedance 2.0 multimodal mode supports at most 3 video inputs",
          );
        if (v425["length"] > v430)
          throw new Error(
            "Volcengine\x20Seedance\x202.0\x20multimodal\x20mode\x20supports\x20at\x20most\x203\x20audio\x20inputs",
          );
        (v423["slice"](0, v428)["forEach"]((v431) =>
          pushVolcengineContentItem(v427, "image_url", v431, "reference_image"),
        ),
          v424["slice"](0, v429)["forEach"]((v432) =>
            pushVolcengineContentItem(
              v427,
              "video_url",
              v432,
              "reference_video",
            ),
          ),
          v425["slice"](0, v430)["forEach"]((v433) =>
            pushVolcengineContentItem(
              v427,
              "audio_url",
              v433,
              "reference_audio",
            ),
          ));
      }
    }
  }
  if (v427["length"] === 0)
    throw new Error(
      "Volcengine\x20Seedance\x202.0\x20request\x20content\x20is\x20empty",
    );
  const v434 = normalizeVolcengineSeedance2Seed(v418["seed"]),
    v435 = {
      model:
        modelToken ||
        v418["model"] ||
        stripPrefix(payload["model"], "volcengine/"),
      content: v427,
      resolution: normalizeVolcengineSeedance2Resolution(
        v418["resolution"],
        v419,
        modelToken,
      ),
      ratio: normalizeVolcengineSeedance2Ratio(v418["ratio"], v419),
      duration: normalizeVolcengineSeedance2Duration(v418["duration"], v419),
      generate_audio: v418["generate_audio"] !== false,
    };
  if (v434 !== null) v435["seed"] = v434;
  return v435;
}
function apimartHailuo02Video({
  currentBody: v436,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v437 = { ...v436 },
    v438 = normalizeInputList(inputImages),
    v439 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    v440 = Object["keys"](v439)["length"] > 0;
  if (v440) {
    (delete v437["first_frame_image"], delete v437["last_frame_image"]);
    if (v439["firstFrame"]) v437["first_frame_image"] = v439["firstFrame"];
    if (v439["lastFrame"]) v437["last_frame_image"] = v439["lastFrame"];
    return v437;
  }
  if (v438[0]) v437["first_frame_image"] = v438[0];
  if (v438[1]) v437["last_frame_image"] = v438[1];
  return v437;
}
function apimartHailuo23Video({
  currentBody: v441,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = "",
}) {
  const v442 = { ...v441 };
  delete v442["last_frame_image"];
  const v443 = normalizeInputList(inputImages),
    v444 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    v445 = Object["keys"](v444)["length"] > 0;
  if (v445) {
    delete v442["first_frame_image"];
    if (v444["firstFrame"]) v442["first_frame_image"] = v444["firstFrame"];
  } else v443[0] && (v442["first_frame_image"] = v443[0]);
  const v446 = String(modelToken || v442["model"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    v446 === "minimax-hailuo-2.3-fast" &&
    !String(v442["first_frame_image"] || "")["trim"]()
  )
    throw new Error("APIMart Hailuo 2.3 Fast requires first_frame_image input");
  return v442;
}
function apimartViduQ3Video({
  currentBody: v447,
  inputImages: inputImages = [],
  payload: payload = {},
  finalPrompt: finalPrompt = "",
  modelToken: modelToken = "",
}) {
  const v448 = { ...v447 },
    v449 = String(v448["prompt"] || finalPrompt || payload?.["prompt"] || "")[
      "trim"
    ]();
  if (!v449)
    throw new Error("APIMart\x20Vidu\x20Q3\x20prompt\x20is\x20required");
  v448["prompt"] = v449;
  const v450 = String(
      payload?.["generationParams"]?.["vidu_q3_generation_mode"] ||
        payload?.["vidu_q3_generation_mode"] ||
        "video",
    )
      ["trim"]()
      ["toLowerCase"](),
    v451 = String(modelToken || v448["model"] || "viduq3-turbo")
      ["trim"]()
      ["toLowerCase"](),
    v452 = normalizeInputList(inputImages),
    v453 = normalizeRunningHubInputUrlsBySlot(payload?.["inputUrlsBySlot"]),
    v454 = Math["max"](
      v452["length"],
      normalizeInputList(payload?.["inputUrls"])["length"],
      normalizeInputList(payload?.["images"])["length"],
      Object["keys"](v453)["length"],
    );
  if (v450 === "reference") {
    if (!VIDU_Q3_REFERENCE_MODELS["has"](v451))
      throw new Error(
        "APIMart\x20Vidu\x20Q3\x20reference\x20mode\x20only\x20supports\x20viduq3\x20or\x20viduq3-mix",
      );
    if (v452["length"] < 1 || v454 > 7)
      throw new Error(
        "APIMart Vidu Q3 reference mode requires 1-7 image inputs",
      );
    return (
      (v448["model"] = v451),
      (v448["image_urls"] = v452["slice"](0, 7)),
      delete v448["audio"],
      v448
    );
  }
  if (!VIDU_Q3_VIDEO_MODELS["has"](v451))
    throw new Error(
      "APIMart\x20Vidu\x20Q3\x20video\x20generation\x20mode\x20only\x20supports\x20viduq3-turbo\x20or\x20viduq3-pro",
    );
  if (v454 > 2)
    throw new Error(
      "APIMart\x20Vidu\x20Q3\x20video\x20generation\x20mode\x20supports\x20at\x20most\x202\x20image\x20inputs",
    );
  return (
    (v448["model"] = v451),
    v452["length"] > 0
      ? ((v448["image_urls"] = v452["slice"](0, 2)),
        delete v448["aspect_ratio"])
      : delete v448["image_urls"],
    v448
  );
}
function normalizeKlingV3OmniMode(v455) {
  const v456 = String(v455 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v456 === "reference" || v456 === "edit" ? v456 : "image";
}
function appendUniqueUrl(v457, v458) {
  const v459 = String(v458 || "")["trim"]();
  if (v459 && !v457["includes"](v459)) v457["push"](v459);
}
function normalizeKlingKeepOriginalSound(v460) {
  if (v460 === true || v460 === false) return v460;
  const v461 = String(v460 ?? "")
    ["trim"]()
    ["toLowerCase"]();
  return v461 === "true" || v461 === "1" || v461 === "yes";
}
function buildKlingV3OmniVideoItem(v462, v463, v464 = false) {
  return {
    video_url: v462,
    refer_type: v463,
    keep_original_sound: normalizeKlingKeepOriginalSound(v464) ? "yes" : "no",
  };
}
function normalizeKlingO1VideoRole(v465) {
  const v466 = String(v465 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v466 === "feature" || v466 === "feature_reference") return "feature";
  return v466 === "base" || v466 === "edit" ? "base" : "";
}
function replaceKlingO1PromptImageReferences(v467, v468) {
  const v469 = Math["max"](0, Math["trunc"](Number(v468) || 0));
  if (v469 <= 0) return String(v467 || "");
  return String(v467 || "")["replace"](/@?图片\s*([1-9]\d*)/g, (v470, v471) => {
    const v472 = Number["parseInt"](String(v471 || ""), 10);
    if (!Number["isFinite"](v472) || v472 < 1 || v472 > v469) return v470;
    return "<<<image_" + v472 + ">>>";
  });
}
function apimartKlingO1Video({
  currentBody: v473,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
}) {
  const v474 = { ...v473 },
    v475 = normalizeInputList(inputImages)["slice"](0, 2),
    v476 = normalizeInputList(inputVideos)["slice"](0, 1),
    v477 = normalizeKlingO1VideoRole(
      payload?.["klingO1VideoRole"] ||
        payload?.["kling_o1_video_role"] ||
        payload?.["generationParams"]?.["kling_o1_video_role"],
    ),
    v478 = normalizeKlingKeepOriginalSound(
      v474["keep_original_sound"] ??
        payload?.["generationParams"]?.["keep_original_sound"] ??
        payload?.["keep_original_sound"],
    );
  (delete v474["kling_o1_video_role"],
    delete v474["klingO1VideoRole"],
    delete v474["keep_original_sound"],
    delete v474["video_list"]);
  if (v476["length"] > 0) {
    const v479 = v477 || "base";
    v474["video_list"] = [buildKlingV3OmniVideoItem(v476[0], v479, v478)];
    if (v479 === "base") {
      if (v475["length"] > 0)
        throw new Error(
          "APIMart Kling O1 base video cannot be used with image_urls",
        );
      return (
        delete v474["image_urls"],
        delete v474["duration"],
        delete v474["aspect_ratio"],
        (v474["prompt"] = replaceKlingO1PromptImageReferences(
          v474["prompt"],
          0,
        )),
        v474
      );
    }
    if (v475["length"] > 1)
      throw new Error(
        "APIMart Kling O1 feature video supports at most one image_url",
      );
    return (
      v475["length"] > 0
        ? (v474["image_urls"] = v475["slice"](0, 1))
        : delete v474["image_urls"],
      (v474["prompt"] = replaceKlingO1PromptImageReferences(
        v474["prompt"],
        v474["image_urls"]?.["length"] || 0,
      )),
      v474
    );
  }
  return (
    v475["length"] > 0
      ? (v474["image_urls"] = v475)
      : delete v474["image_urls"],
    (v474["prompt"] = replaceKlingO1PromptImageReferences(
      v474["prompt"],
      v474["image_urls"]?.["length"] || 0,
    )),
    v474
  );
}
const RUNNINGHUB_KLING_O1_ENDPOINTS = Object["freeze"]({
  text: "https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video",
  image: "https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video",
  frames: "https://www.runninghub.cn/openapi/v2/kling-video-o1/start-to-end",
  reference:
    "https://www.runninghub.cn/openapi/v2/kling-video-o1-std/refrence-to-video",
  edit: "https://www.runninghub.cn/openapi/v2/kling-video-o1-std/edit-video",
});
function normalizeRunningHubKlingO1GenerationMode(v480) {
  const v481 = String(v480 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v481 === "reference" || v481 === "edit") return v481;
  return "frame";
}
function normalizeRunningHubKlingO1QualityMode(v482) {
  const v483 = String(v482 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v483 === "pro" ? "pro" : "std";
}
function normalizeRunningHubKlingO1AspectRatio(v484) {
  const v485 = String(v484 || "9:16")["trim"]();
  return ["16:9", "9:16", "1:1"]["includes"](v485) ? v485 : "9:16";
}
function normalizeRunningHubKlingO1Duration(v486) {
  const v487 = Number(v486);
  return Number["isFinite"](v487) && Math["trunc"](v487) === 10 ? "10" : "5";
}
function getRunningHubKlingO1GenerationMode(v488 = {}, v489 = {}) {
  return normalizeRunningHubKlingO1GenerationMode(
    v489["rh_kling_o1_generation_mode"] ||
      v488?.["generationParams"]?.["rh_kling_o1_generation_mode"] ||
      v488?.["rh_kling_o1_generation_mode"],
  );
}
function collectRunningHubKlingO1FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v490 = [],
    v491 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(v490, v491["firstFrame"]),
    appendUniqueUrl(v490, v491["lastFrame"]),
    normalizeInputList(inputImages)["forEach"]((v492) =>
      appendUniqueUrl(v490, v492),
    ),
    v490
  );
}
function collectRunningHubKlingO1ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v493 = [],
    v494 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(v493, v494["referenceImage"]),
    normalizeInputList(inputImages)["forEach"]((v495) =>
      appendUniqueUrl(v493, v495),
    ),
    v493
  );
}
function resolveRunningHubKlingO1Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const v496 = getRunningHubKlingO1GenerationMode(payload, currentBody);
  if (v496 === "reference") return "reference";
  if (v496 === "edit") return "edit";
  const v497 = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  })["length"];
  if (v497 >= 2) return "frames";
  if (v497 === 1) return "image";
  const v498 = normalizeInputList(inputVideos)["length"];
  return v498 > 0 ? "reference" : "text";
}
function runninghubKlingO1Video({
  currentBody: v499,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v500 = { ...v499 },
    v501 = getRunningHubKlingO1GenerationMode(payload, v500),
    v502 = normalizeKlingKeepOriginalSound(
      payload?.["generationParams"]?.["keepOriginalSound"] ??
        payload?.["generationParams"]?.["keep_original_sound"] ??
        payload?.["keepOriginalSound"] ??
        payload?.["keep_original_sound"] ??
        v500["keepOriginalSound"] ??
        v500["keep_original_sound"],
    ),
    v503 = String(v500["prompt"] || payload?.["prompt"] || "")["trim"]();
  if (!v503) throw new Error("RunningHub Kling O1 prompt is required");
  ((v500["prompt"] = v503),
    (v500["mode"] = normalizeRunningHubKlingO1QualityMode(v500["mode"])),
    (v500["aspectRatio"] = normalizeRunningHubKlingO1AspectRatio(
      v500["aspectRatio"],
    )),
    (v500["duration"] = normalizeRunningHubKlingO1Duration(v500["duration"])),
    delete v500["rh_kling_o1_generation_mode"],
    delete v500["keep_original_sound"],
    delete v500["keepOriginalSound"],
    delete v500["firstImageUrl"],
    delete v500["lastImageUrl"],
    delete v500["imageUrls"],
    delete v500["videoUrl"]);
  const v504 = normalizeInputList(inputVideos),
    v505 = Math["max"](
      v504["length"],
      normalizeInputList(payload?.["videos"])["length"],
      normalizeInputList(payload?.["videoUrls"])["length"],
      String(payload?.["videoUrl"] || "")["trim"]() ? 1 : 0,
    );
  if (v501 === "edit") {
    const v506 = [];
    (collectRunningHubKlingO1FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    })["forEach"]((v507) => appendUniqueUrl(v506, v507)),
      collectRunningHubKlingO1ReferenceImages({
        inputImages: inputImages,
        finalUrlsBySlot: finalUrlsBySlot,
      })["forEach"]((v508) => appendUniqueUrl(v506, v508)));
    if (v506["length"] > 0)
      throw new Error(
        "RunningHub\x20Kling\x20O1\x20edit\x20mode\x20does\x20not\x20accept\x20image\x20input",
      );
    if (v505 < 1 || !v504[0])
      throw new Error("RunningHub Kling O1 edit mode requires 1 video input");
    if (v505 > 1)
      throw new Error(
        "RunningHub\x20Kling\x20O1\x20edit\x20mode\x20supports\x20at\x20most\x201\x20video\x20input",
      );
    return (
      (v500["mode"] = "std"),
      (v500["videoUrl"] = v504[0]),
      (v500["keepOriginalSound"] = v502),
      delete v500["aspectRatio"],
      delete v500["duration"],
      v500
    );
  }
  if (v501 === "reference") {
    const v509 = collectRunningHubKlingO1ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (v509["length"] < 1)
      throw new Error(
        "RunningHub\x20Kling\x20O1\x20reference\x20mode\x20requires\x20at\x20least\x201\x20image\x20input",
      );
    if (v509["length"] > 7)
      throw new Error(
        "RunningHub\x20Kling\x20O1\x20reference\x20mode\x20supports\x20at\x20most\x207\x20image\x20inputs",
      );
    if (v505 < 1 || !v504[0])
      throw new Error(
        "RunningHub Kling O1 reference mode requires 1 video input",
      );
    if (v505 > 1)
      throw new Error(
        "RunningHub Kling O1 reference mode supports at most 1 video input",
      );
    return (
      (v500["imageUrls"] = v509),
      (v500["videoUrl"] = v504[0]),
      (v500["keepOriginalSound"] = v502),
      (v500["prompt"] = replaceKlingO1PromptImageReferences(
        v500["prompt"],
        v509["length"],
      )),
      v500
    );
  }
  const v510 = collectRunningHubKlingO1FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (v504["length"] > 0)
    throw new Error(
      "RunningHub Kling O1 frame mode does not accept video input; use reference mode",
    );
  if (v510["length"] > 2)
    throw new Error(
      "RunningHub Kling O1 frame mode supports at most 2 image inputs",
    );
  if (v510[0]) v500["firstImageUrl"] = v510[0];
  if (v510[1]) v500["lastImageUrl"] = v510[1];
  return (
    (v500["prompt"] = replaceKlingO1PromptImageReferences(
      v500["prompt"],
      v510["length"],
    )),
    v500
  );
}
function runninghubKlingO1VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v511 = resolveRunningHubKlingO1Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_KLING_O1_ENDPOINTS[v511] || RUNNINGHUB_KLING_O1_ENDPOINTS["text"]
  );
}
const RUNNINGHUB_KLING_V3_ENDPOINTS = Object["freeze"]({
  std: Object["freeze"]({
    text: "https://www.runninghub.cn/openapi/v2/kling-v3.0-std/text-to-video",
    image: "https://www.runninghub.cn/openapi/v2/kling-v3.0-std/image-to-video",
  }),
  pro: Object["freeze"]({
    text: "https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/text-to-video",
    image: "https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/image-to-video",
  }),
  "4k": Object["freeze"]({
    text: "https://www.runninghub.cn/openapi/v2/kling-v3-4k/text-to-video",
    image: "https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video",
  }),
});
function normalizeRunningHubKlingV3Model(v512) {
  const v513 = String(v512 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v513 === "4k") return "4k";
  if (v513 === "pro") return "pro";
  return "std";
}
function getRunningHubKlingV3Model(v514 = {}, v515 = {}) {
  return normalizeRunningHubKlingV3Model(
    v515["rh_kling_v3_model"] ||
      v514?.["generationParams"]?.["resolution"] ||
      v514?.["resolution"],
  );
}
function collectRunningHubKlingV3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v516 = [],
    v517 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(v516, v517["firstFrame"]),
    appendUniqueUrl(v516, v517["lastFrame"]),
    normalizeInputList(inputImages)["forEach"]((v518) =>
      appendUniqueUrl(v516, v518),
    ),
    v516
  );
}
function getRunningHubKlingV3RawMediaCount(v519 = {}, v520 = [], v521 = "") {
  const v522 = v521 === "audio" ? "audioUrl" : v521 + "Url",
    v523 = v521 + "s",
    v524 = v521 + "Urls";
  return Math["max"](
    normalizeInputList(v520)["length"],
    normalizeInputList(v519?.[v523])["length"],
    normalizeInputList(v519?.[v524])["length"],
    String(v519?.[v522] || "")["trim"]() ? 1 : 0,
  );
}
function resolveRunningHubKlingV3Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const v525 = getRunningHubKlingV3Model(payload, currentBody),
    v526 = collectRunningHubKlingV3FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    })["length"];
  return { model: v525, route: v526 > 0 ? "image" : "text" };
}
function runninghubKlingV3Video({
  currentBody: v527,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v528 = { ...v527 },
    v529 = getRunningHubKlingV3Model(payload, v528),
    v530 = String(v528["prompt"] || payload?.["prompt"] || "")["trim"]();
  if (!v530) throw new Error("RunningHub Kling V3.0 prompt is required");
  const v531 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, "video");
  if (v531 > 0)
    throw new Error("RunningHub Kling V3.0 does not accept video input");
  const v532 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, "audio");
  if (v532 > 0)
    throw new Error("RunningHub Kling V3.0 does not accept audio input");
  ((v528["prompt"] = v530),
    delete v528["rh_kling_v3_model"],
    delete v528["imageUrl"],
    delete v528["firstImageUrl"],
    delete v528["lastImageUrl"],
    delete v528["imageUrls"]);
  const v533 = collectRunningHubKlingV3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (v533["length"] > 2)
    throw new Error("RunningHub Kling V3.0 supports at most 2 image inputs");
  if (v533["length"] > 0) {
    delete v528["aspectRatio"];
    if (v529 === "4k") {
      if (v533["length"] > 1)
        throw new Error(
          "RunningHub Kling V3.0 4K image-to-video supports only one imageUrl",
        );
      return ((v528["imageUrl"] = v533[0]), v528);
    }
    v528["firstImageUrl"] = v533[0];
    if (v533[1]) v528["lastImageUrl"] = v533[1];
  }
  return v528;
}
function runninghubKlingV3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const { model: v534, route: v535 } = resolveRunningHubKlingV3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_KLING_V3_ENDPOINTS[v534]?.[v535] ||
    RUNNINGHUB_KLING_V3_ENDPOINTS["std"]["text"]
  );
}
const RUNNINGHUB_KLING_O3_ENDPOINTS = Object["freeze"]({
  std: Object["freeze"]({
    text: "https://www.runninghub.cn/openapi/v2/kling-video-o3-std/text-to-video",
    image:
      "https://www.runninghub.cn/openapi/v2/kling-video-o3-std/image-to-video",
    reference:
      "https://www.runninghub.cn/openapi/v2/kling-video-o3-std/reference-to-video",
    edit: "https://www.runninghub.cn/openapi/v2/kling-video-o3-std/video-edit",
  }),
  pro: Object["freeze"]({
    text: "https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/text-to-video",
    image:
      "https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/image-to-video",
    reference:
      "https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/reference-to-video",
    edit: "https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/video-edit",
  }),
  "4k": Object["freeze"]({
    text: "https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/text-to-video",
    image:
      "https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video",
    reference:
      "https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/reference-to-video",
  }),
});
function normalizeRunningHubKlingO3GenerationMode(v536) {
  const v537 = String(v536 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v537 === "reference" || v537 === "edit") return v537;
  return "frame";
}
function normalizeRunningHubKlingO3Model(v538) {
  const v539 = String(v538 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v539 === "4k") return "4k";
  if (v539 === "pro") return "pro";
  return "std";
}
function getRunningHubKlingO3GenerationMode(v540 = {}, v541 = {}) {
  return normalizeRunningHubKlingO3GenerationMode(
    v541["kling_v3_omni_mode"] ||
      v540?.["generationParams"]?.["kling_v3_omni_mode"] ||
      v540?.["kling_v3_omni_mode"],
  );
}
function getRunningHubKlingO3Model(v542 = {}, v543 = {}) {
  return normalizeRunningHubKlingO3Model(
    v543["rh_kling_o3_model"] ||
      v542?.["generationParams"]?.["resolution"] ||
      v542?.["resolution"],
  );
}
function collectRunningHubKlingO3SlotImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
} = {}) {
  const v544 = [],
    v545 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    v546 = new Set(normalizeInputList(Object["values"](v545)));
  return (
    slotIds["forEach"]((v547) => appendUniqueUrl(v544, v545[v547])),
    normalizeInputList(inputImages)["forEach"]((v548) => {
      if (!v546["has"](v548)) appendUniqueUrl(v544, v548);
    }),
    v544
  );
}
function collectRunningHubKlingO3FrameImages(v549 = {}) {
  return collectRunningHubKlingO3SlotImages({
    ...v549,
    slotIds: ["firstFrame", "lastFrame"],
  });
}
function collectRunningHubKlingO3ReferenceImages(v550 = {}) {
  return collectRunningHubKlingO3SlotImages({
    ...v550,
    slotIds: ["referenceImage"],
  });
}
function collectRunningHubKlingO3EditImages(v551 = {}) {
  return collectRunningHubKlingO3SlotImages({
    ...v551,
    slotIds: ["editRefImage"],
  });
}
function resolveRunningHubKlingO3Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const v552 = getRunningHubKlingO3Model(payload, currentBody),
    v553 = getRunningHubKlingO3GenerationMode(payload, currentBody);
  if (v553 === "reference") return { model: v552, route: "reference" };
  if (v553 === "edit") return { model: v552, route: "edit" };
  const v554 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  })["length"];
  return { model: v552, route: v554 > 0 ? "image" : "text" };
}
function runninghubKlingO3Video({
  currentBody: v555,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v556 = { ...v555 },
    v557 = getRunningHubKlingO3Model(payload, v556),
    v558 = getRunningHubKlingO3GenerationMode(payload, v556),
    v559 = String(v556["prompt"] || payload?.["prompt"] || "")["trim"]();
  if (!v559) throw new Error("RunningHub Kling O3 prompt is required");
  const v560 = getRunningHubKlingV3RawMediaCount(payload, inputAudios, "audio");
  if (v560 > 0)
    throw new Error(
      "RunningHub\x20Kling\x20O3\x20does\x20not\x20accept\x20direct\x20audio\x20input",
    );
  const v561 = normalizeInputList(inputVideos),
    v562 = getRunningHubKlingV3RawMediaCount(payload, inputVideos, "video"),
    v563 = normalizeKlingKeepOriginalSound(
      v556["keepOriginalSound"] ??
        v556["keep_original_sound"] ??
        payload?.["generationParams"]?.["keepOriginalSound"] ??
        payload?.["generationParams"]?.["keep_original_sound"] ??
        payload?.["keepOriginalSound"] ??
        payload?.["keep_original_sound"],
    );
  ((v556["prompt"] = v559),
    delete v556["kling_v3_omni_mode"],
    delete v556["rh_kling_o3_model"],
    delete v556["keep_original_sound"],
    delete v556["keepOriginalSound"],
    delete v556["firstImageUrl"],
    delete v556["lastImageUrl"],
    delete v556["imageUrl"],
    delete v556["imageUrls"],
    delete v556["videoUrl"]);
  if (v558 === "edit") {
    if (v557 === "4k")
      throw new Error("RunningHub Kling O3 4K does not support video edit");
    if (v562 < 1 || !v561[0])
      throw new Error("RunningHub Kling O3 edit mode requires 1 video input");
    if (v562 > 1)
      throw new Error(
        "RunningHub\x20Kling\x20O3\x20edit\x20mode\x20supports\x20at\x20most\x201\x20video\x20input",
      );
    const v564 = collectRunningHubKlingO3EditImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (v564["length"] > 7)
      throw new Error(
        "RunningHub\x20Kling\x20O3\x20edit\x20mode\x20supports\x20at\x20most\x207\x20image\x20inputs",
      );
    v556["videoUrl"] = v561[0];
    if (v564["length"] > 0) v556["imageUrls"] = v564;
    return (
      (v556["keepOriginalSound"] = v563),
      delete v556["aspectRatio"],
      delete v556["duration"],
      delete v556["sound"],
      delete v556["multiShot"],
      delete v556["shotType"],
      v556
    );
  }
  if (v558 === "reference") {
    const v565 = collectRunningHubKlingO3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (v565["length"] < 1)
      throw new Error(
        "RunningHub\x20Kling\x20O3\x20reference\x20mode\x20requires\x20at\x20least\x201\x20image\x20input",
      );
    if (v562 > 1)
      throw new Error(
        "RunningHub Kling O3 reference mode supports at most 1 video input",
      );
    if (v561[0] && v565["length"] > 4)
      throw new Error(
        "RunningHub Kling O3 reference mode supports at most 4 image inputs with video input",
      );
    if (v565["length"] > 7)
      throw new Error(
        "RunningHub Kling O3 reference mode supports at most 7 image inputs",
      );
    v556["imageUrls"] = v565;
    if (v561[0]) v556["videoUrl"] = v561[0];
    v556["keepOriginalSound"] = v563;
    if (v557 !== "4k") delete v556["shotType"];
    return v556;
  }
  if (v562 > 0)
    throw new Error(
      "RunningHub\x20Kling\x20O3\x20frame\x20mode\x20does\x20not\x20accept\x20video\x20input;\x20use\x20reference\x20or\x20edit\x20mode",
    );
  const v566 = collectRunningHubKlingO3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (v566["length"] > 2)
    throw new Error(
      "RunningHub Kling O3 frame mode supports at most 2 image inputs",
    );
  if (v557 === "4k" && v566["length"] > 1)
    throw new Error(
      "RunningHub Kling O3 4K image-to-video supports only one firstImageUrl",
    );
  if (v566["length"] > 0) {
    (delete v556["aspectRatio"], (v556["firstImageUrl"] = v566[0]));
    if (v566[1]) v556["lastImageUrl"] = v566[1];
  }
  return v556;
}
function runninghubKlingO3VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const { model: v567, route: v568 } = resolveRunningHubKlingO3Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_KLING_O3_ENDPOINTS[v567]?.[v568] ||
    RUNNINGHUB_KLING_O3_ENDPOINTS["std"]["text"]
  );
}
const RUNNINGHUB_HAILUO_02_ENDPOINTS = Object["freeze"]({
  t2vStandard:
    "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-standard",
  t2vPro: "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-pro",
  i2vStandard:
    "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-standard",
  i2vPro: "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-pro",
  i2vFast: "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/fast",
});
function normalizeRunningHubHailuo02Quality(v569) {
  const v570 = String(v569 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v570 === "pro") return "pro";
  if (v570 === "fast") return "fast";
  return "standard";
}
function normalizeRunningHubHailuo02Duration(v571) {
  const v572 = Number(v571);
  return Number["isFinite"](v572) && Math["trunc"](v572) === 10 ? "10" : "6";
}
function getRunningHubHailuo02Quality(v573 = {}, v574 = {}) {
  return normalizeRunningHubHailuo02Quality(
    v574["rh_hailuo_02_quality"] ||
      v573?.["generationParams"]?.["rh_hailuo_02_quality"] ||
      v573?.["rh_hailuo_02_quality"],
  );
}
function collectRunningHubHailuo02FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v575 = [],
    v576 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(v575, v576["firstFrame"]),
    appendUniqueUrl(v575, v576["lastFrame"]),
    normalizeInputList(inputImages)["forEach"]((v577) =>
      appendUniqueUrl(v575, v577),
    ),
    v575
  );
}
function getRunningHubHailuo02RawVideoCount(v578 = {}, v579 = []) {
  return Math["max"](
    normalizeInputList(v579)["length"],
    normalizeInputList(v578?.["videos"])["length"],
    normalizeInputList(v578?.["videoUrls"])["length"],
    String(v578?.["videoUrl"] || "")["trim"]() ? 1 : 0,
  );
}
function resolveRunningHubHailuo02Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const v580 = getRunningHubHailuo02Quality(payload, currentBody),
    v581 = collectRunningHubHailuo02FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    })["length"];
  if (v580 === "fast") return "i2vFast";
  if (v580 === "pro") return v581 > 0 ? "i2vPro" : "t2vPro";
  return v581 > 0 ? "i2vStandard" : "t2vStandard";
}
function runninghubHailuo02Video({
  currentBody: v582,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v583 = { ...v582 },
    v584 = String(v583["prompt"] || payload?.["prompt"] || "")["trim"]();
  if (!v584)
    throw new Error("RunningHub\x20Hailuo\x2002\x20prompt\x20is\x20required");
  const v585 = getRunningHubHailuo02Quality(payload, v583),
    v586 = collectRunningHubHailuo02FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    v587 = getRunningHubHailuo02RawVideoCount(payload, inputVideos);
  if (v587 > 0)
    throw new Error("RunningHub Hailuo 02 does not accept video input");
  ((v583["prompt"] = v584),
    (v583["duration"] = normalizeRunningHubHailuo02Duration(v583["duration"])),
    delete v583["rh_hailuo_02_quality"],
    delete v583["firstImageUrl"],
    delete v583["lastImageUrl"],
    delete v583["imageUrl"],
    delete v583["imageUrls"],
    delete v583["videoUrl"]);
  if (v585 === "fast") {
    if (v586["length"] < 1)
      throw new Error("RunningHub Hailuo 02 Fast requires imageUrl input");
    if (v586["length"] > 1)
      throw new Error(
        "RunningHub\x20Hailuo\x2002\x20Fast\x20supports\x20only\x20imageUrl\x20input",
      );
    return ((v583["imageUrl"] = v586[0]), v583);
  }
  if (v585 === "pro") {
    delete v583["duration"];
    if (v586["length"] > 1)
      throw new Error(
        "RunningHub\x20Hailuo\x2002\x20Pro\x20supports\x20only\x20firstImageUrl\x20input",
      );
    if (v586[0]) v583["firstImageUrl"] = v586[0];
    return v583;
  }
  if (v586["length"] > 2)
    throw new Error(
      "RunningHub\x20Hailuo\x2002\x20Standard\x20supports\x20at\x20most\x202\x20image\x20inputs",
    );
  if (v586[0]) v583["firstImageUrl"] = v586[0];
  if (v586[1]) v583["lastImageUrl"] = v586[1];
  return v583;
}
function runninghubHailuo02VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v588 = resolveRunningHubHailuo02Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_HAILUO_02_ENDPOINTS[v588] ||
    RUNNINGHUB_HAILUO_02_ENDPOINTS["t2vStandard"]
  );
}
const RUNNINGHUB_HAILUO_23_ENDPOINTS = Object["freeze"]({
  t2vStandard:
    "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-standard",
  t2vPro: "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-pro",
  i2vStandard:
    "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard",
  i2vPro:
    "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/image-to-video-pro",
  i2vFast:
    "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast/image-to-video",
  i2vFastPro:
    "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast-pro/image-to-video",
});
function normalizeRunningHubHailuo23Quality(v589) {
  const v590 = String(v589 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v590 === "pro") return "pro";
  if (v590 === "fast") return "fast";
  if (v590 === "fastpro" || v590 === "fast-pro" || v590 === "fast_pro")
    return "fastPro";
  return "standard";
}
function normalizeRunningHubHailuo23Duration(v591) {
  const v592 = Number(v591);
  return Number["isFinite"](v592) && Math["trunc"](v592) === 10 ? "10" : "6";
}
function getRunningHubHailuo23Quality(v593 = {}, v594 = {}) {
  return normalizeRunningHubHailuo23Quality(
    v594["rh_hailuo_23_quality"] ||
      v593?.["generationParams"]?.["rh_hailuo_23_quality"] ||
      v593?.["rh_hailuo_23_quality"],
  );
}
function collectRunningHubHailuo23FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v595 = [],
    v596 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(v595, v596["firstFrame"]),
    normalizeInputList(inputImages)["forEach"]((v597) =>
      appendUniqueUrl(v595, v597),
    ),
    v595
  );
}
function getRunningHubHailuo23RawVideoCount(v598 = {}, v599 = []) {
  return Math["max"](
    normalizeInputList(v599)["length"],
    normalizeInputList(v598?.["videos"])["length"],
    normalizeInputList(v598?.["videoUrls"])["length"],
    String(v598?.["videoUrl"] || "")["trim"]() ? 1 : 0,
  );
}
function resolveRunningHubHailuo23Route({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const v600 = getRunningHubHailuo23Quality(payload, currentBody),
    v601 = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    })["length"];
  if (v600 === "fast") return "i2vFast";
  if (v600 === "fastPro") return "i2vFastPro";
  if (v600 === "pro") return v601 > 0 ? "i2vPro" : "t2vPro";
  return v601 > 0 ? "i2vStandard" : "t2vStandard";
}
function runninghubHailuo23Video({
  currentBody: v602,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v603 = { ...v602 },
    v604 = String(v603["prompt"] || payload?.["prompt"] || "")["trim"]();
  if (!v604) throw new Error("RunningHub Hailuo 2.3 prompt is required");
  const v605 = getRunningHubHailuo23Quality(payload, v603),
    v606 = collectRunningHubHailuo23FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    v607 = getRunningHubHailuo23RawVideoCount(payload, inputVideos);
  if (v607 > 0)
    throw new Error("RunningHub Hailuo 2.3 does not accept video input");
  if (v606["length"] > 1)
    throw new Error("RunningHub Hailuo 2.3 supports only imageUrl input");
  ((v603["prompt"] = v604),
    (v603["duration"] = normalizeRunningHubHailuo23Duration(v603["duration"])),
    delete v603["rh_hailuo_23_quality"],
    delete v603["firstImageUrl"],
    delete v603["lastImageUrl"],
    delete v603["imageUrl"],
    delete v603["imageUrls"],
    delete v603["videoUrl"]);
  if (v605 === "fast" || v605 === "fastPro") {
    if (!v606[0])
      throw new Error(
        "RunningHub\x20Hailuo\x202.3\x20Fast\x20requires\x20imageUrl\x20input",
      );
    return (
      (v603["imageUrl"] = v606[0]),
      v605 === "fastPro" && (v603["duration"] = "6"),
      v603
    );
  }
  v605 === "pro" && delete v603["duration"];
  if (v606[0]) v603["imageUrl"] = v606[0];
  return v603;
}
function runninghubHailuo23VideoEndpoint({
  inputImages: inputImages = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v608 = resolveRunningHubHailuo23Route({
    inputImages: inputImages,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_HAILUO_23_ENDPOINTS[v608] ||
    RUNNINGHUB_HAILUO_23_ENDPOINTS["t2vStandard"]
  );
}
const RUNNINGHUB_VEO3_ENDPOINTS = Object["freeze"]({
  lowCost: Object["freeze"]({
    text: Object["freeze"]({
      fast: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/text-to-video",
      pro: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/text-to-video",
    }),
    image: Object["freeze"]({
      fast: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video",
    }),
    frames: Object["freeze"]({
      fast: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/start-end-to-video",
      pro: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/start-end-to-video",
    }),
  }),
  official: Object["freeze"]({
    text: Object["freeze"]({
      fast: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/text-to-video",
      pro: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/text-to-video",
      lite: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/text-to-video",
    }),
    image: Object["freeze"]({
      fast: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/image-to-video",
      pro: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/image-to-video",
      lite: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/image-to-video",
    }),
    frames: Object["freeze"]({
      lite: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/start-end-to-video",
    }),
    reference: Object["freeze"]({
      fast: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/reference-to-video",
      pro: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/reference-to-video",
    }),
    extend: Object["freeze"]({
      fast: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/video-extend",
      pro: "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/video-extend",
    }),
  }),
});
function normalizeRunningHubVeo3Channel(v609) {
  const v610 = String(v609 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v610 === "official" || v610 === "stable" || v610 === "officialstable")
    return "official";
  return "lowCost";
}
function normalizeRunningHubVeo3Mode(
  v611,
  { channel: channel = "lowCost" } = {},
) {
  const v612 = String(v611 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v612 === "quality" || v612 === "pro") return "pro";
  if (v612 === "lite" && channel === "official") return "lite";
  return "fast";
}
function getRunningHubVeo3Channel(v613 = {}, v614 = {}) {
  return normalizeRunningHubVeo3Channel(
    v614["rh_veo3_channel"] ||
      v613?.["generationParams"]?.["rh_veo3_channel"] ||
      v613?.["rh_veo3_channel"],
  );
}
function getRunningHubVeo3Mode(v615 = {}, v616 = {}) {
  const v617 = getRunningHubVeo3Channel(v615, v616);
  return normalizeRunningHubVeo3Mode(
    v616["mode"] || v615?.["generationParams"]?.["mode"] || v615?.["mode"],
    { channel: v617 },
  );
}
function getRunningHubVeo3GenerationType(v618 = {}, v619 = {}) {
  const v620 = String(
    v619["generation_type"] ||
      v618?.["generationParams"]?.["generation_type"] ||
      v618?.["generation_type"] ||
      "frame",
  )
    ["trim"]()
    ["toLowerCase"]();
  if (v620 === "reference" || v620 === "extend") return v620;
  return "frame";
}
function collectRunningHubVeo3FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v621 = [],
    v622 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(v621, v622["firstFrame"]),
    appendUniqueUrl(v621, v622["lastFrame"]),
    normalizeInputList(inputImages)["forEach"]((v623) =>
      appendUniqueUrl(v621, v623),
    ),
    v621
  );
}
function collectRunningHubVeo3ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v624 = [],
    v625 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  return (
    appendUniqueUrl(v624, v625["referenceImage"]),
    normalizeInputList(inputImages)["forEach"]((v626) =>
      appendUniqueUrl(v624, v626),
    ),
    v624
  );
}
function getRunningHubVeo3RawVideoCount(v627 = {}, v628 = []) {
  return Math["max"](
    normalizeInputList(v628)["length"],
    normalizeInputList(v627?.["videos"])["length"],
    normalizeInputList(v627?.["videoUrls"])["length"],
    String(v627?.["videoUrl"] || "")["trim"]() ? 1 : 0,
  );
}
function resolveRunningHubVeo3Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const v629 = getRunningHubVeo3Channel(payload, currentBody),
    v630 = getRunningHubVeo3Mode(payload, currentBody),
    v631 = getRunningHubVeo3GenerationType(payload, currentBody);
  if (v631 === "extend" || normalizeInputList(inputVideos)["length"] > 0)
    return Object["freeze"]({ channel: v629, mode: v630, route: "extend" });
  if (v631 === "reference")
    return Object["freeze"]({ channel: v629, mode: v630, route: "reference" });
  const v632 = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (v632["length"] >= 2)
    return Object["freeze"]({ channel: v629, mode: v630, route: "frames" });
  if (v632["length"] === 1)
    return Object["freeze"]({
      channel: v629,
      mode: v630,
      route: v629 === "lowCost" && v630 === "pro" ? "frames" : "image",
    });
  return Object["freeze"]({ channel: v629, mode: v630, route: "text" });
}
function normalizeRunningHubVeo3BodyResolution(
  v633,
  { channel: v634, mode: v635 },
) {
  const v636 = String(v633 || "720p")
    ["trim"]()
    ["toLowerCase"]();
  if (v634 === "lowCost") return "720p";
  if (v635 === "lite" && v636 === "4k") return "1080p";
  if (v636 === "4k" || v636 === "1080p") return v636;
  return "720p";
}
function normalizeRunningHubVeo3BodyDuration(
  v637,
  { channel: v638, mode: v639 },
) {
  if (v638 === "lowCost") return "8";
  const v640 = Math["trunc"](Number(v637));
  if (v639 === "lite") return v640 === 8 ? "8" : "6";
  return [4, 6, 8]["includes"](v640) ? String(v640) : "8";
}
function removeRunningHubVeo3TransientFields(v641) {
  (delete v641["rh_veo3_channel"],
    delete v641["mode"],
    delete v641["generation_type"],
    delete v641["imageUrl"],
    delete v641["imageUrls"],
    delete v641["firstFrameUrl"],
    delete v641["lastFrameUrl"],
    delete v641["firstImageUrl"],
    delete v641["lastImageUrl"],
    delete v641["videoUrl"],
    delete v641["video"]);
}
function runninghubVeo3Video({
  currentBody: v642,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v643 = { ...v642 },
    v644 = resolveRunningHubVeo3Route({
      inputImages: inputImages,
      inputVideos: inputVideos,
      payload: payload,
      finalUrlsBySlot: finalUrlsBySlot,
      currentBody: v643,
    }),
    { channel: v645, mode: v646, route: v647 } = v644,
    v648 = getRunningHubVeo3GenerationType(payload, v643),
    v649 = getRunningHubVeo3RawVideoCount(payload, inputVideos);
  if (v649 > 0 && v647 !== "extend")
    throw new Error("RunningHub Veo3 does not accept video input");
  const v650 = String(v643["prompt"] || payload?.["prompt"] || "")["trim"]();
  if (v647 !== "extend") {
    if (!v650)
      throw new Error("RunningHub\x20Veo3\x20prompt\x20is\x20required");
    v643["prompt"] = v650;
  }
  ((v643["resolution"] = normalizeRunningHubVeo3BodyResolution(
    v643["resolution"],
    { channel: v645, mode: v646 },
  )),
    (v643["duration"] = normalizeRunningHubVeo3BodyDuration(v643["duration"], {
      channel: v645,
      mode: v646,
    })),
    removeRunningHubVeo3TransientFields(v643));
  if (v647 === "extend") {
    if (v645 !== "official" || v646 === "lite")
      throw new Error(
        "RunningHub Veo3 video extend only supports official Fast or Pro",
      );
    const v651 = normalizeInputList(inputVideos);
    if (v649 < 1 || !v651[0])
      throw new Error("RunningHub Veo3 video extend requires 1 video input");
    if (v649 > 1)
      throw new Error(
        "RunningHub Veo3 video extend supports at most 1 video input",
      );
    const v652 = [];
    (collectRunningHubVeo3FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    })["forEach"]((v653) => appendUniqueUrl(v652, v653)),
      collectRunningHubVeo3ReferenceImages({
        inputImages: inputImages,
        finalUrlsBySlot: finalUrlsBySlot,
      })["forEach"]((v654) => appendUniqueUrl(v652, v654)));
    if (v652["length"] > 0)
      throw new Error(
        "RunningHub\x20Veo3\x20video\x20extend\x20does\x20not\x20accept\x20image\x20input",
      );
    return (
      (v643["video"] = v651[0]),
      delete v643["prompt"],
      delete v643["duration"],
      delete v643["aspectRatio"],
      delete v643["generateAudio"],
      v643
    );
  }
  if (v648 === "reference") {
    if (v645 !== "official" || v646 === "lite")
      throw new Error(
        "RunningHub Veo3 reference mode only supports official Fast or Pro",
      );
    const v655 = collectRunningHubVeo3ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    });
    if (v655["length"] < 1)
      throw new Error(
        "RunningHub\x20Veo3\x20reference\x20mode\x20requires\x201-3\x20image\x20inputs",
      );
    if (v655["length"] > 3)
      throw new Error(
        "RunningHub\x20Veo3\x20reference\x20mode\x20supports\x20at\x20most\x203\x20image\x20inputs",
      );
    ((v643["imageUrls"] = v655), delete v643["duration"]);
    if (v646 === "pro") delete v643["aspectRatio"];
    return v643;
  }
  const v656 = collectRunningHubVeo3FrameImages({
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (v656["length"] > 2)
    throw new Error(
      "RunningHub Veo3 frame mode supports at most 2 image inputs",
    );
  if (v656["length"] >= 2 && v645 === "official" && v646 !== "lite")
    throw new Error(
      "RunningHub Veo3 official Fast/Pro start-end endpoint is not published; use official Lite or low-cost channel",
    );
  if (v656["length"] === 1) {
    if (v645 === "official") v643["imageUrl"] = v656[0];
    else
      v646 === "pro"
        ? (v643["firstFrameUrl"] = v656[0])
        : (v643["imageUrls"] = [v656[0]]);
  } else
    v656["length"] === 2 &&
      (v645 === "official"
        ? ((v643["firstImageUrl"] = v656[0]),
          (v643["lastImageUrl"] = v656[1]),
          delete v643["duration"])
        : ((v643["firstFrameUrl"] = v656[0]),
          (v643["lastFrameUrl"] = v656[1])));
  return (
    (v645 === "lowCost" || v646 === "lite") && delete v643["generateAudio"],
    v643
  );
}
function runninghubVeo3VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const {
    channel: v657,
    mode: v658,
    route: v659,
  } = resolveRunningHubVeo3Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return (
    RUNNINGHUB_VEO3_ENDPOINTS[v657]?.[v659]?.[v658] ||
    RUNNINGHUB_VEO3_ENDPOINTS["lowCost"]["text"]["fast"]
  );
}
const RUNNINGHUB_WAN27_ENDPOINTS = Object["freeze"]({
  text: "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/text-to-video",
  image: "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video",
  video: "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-extend",
  reference:
    "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/reference-to-video",
  edit: "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-edit",
});
function normalizeRunningHubWan27Mode(v660) {
  const v661 = String(v660 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v661 === "video" || v661 === "reference" || v661 === "edit"
    ? v661
    : "image";
}
function getRunningHubWan27Mode(v662 = {}, v663 = {}) {
  return normalizeRunningHubWan27Mode(
    v663["wan27_mode"] ||
      v662?.["generationParams"]?.["wan27_mode"] ||
      v662?.["wan27_mode"],
  );
}
function collectRunningHubWan27Images({
  mode: v664,
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const v665 = [],
    v666 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot);
  if (v664 === "image")
    (appendUniqueUrl(v665, v666["firstFrame"]),
      appendUniqueUrl(v665, v666["lastFrame"]));
  else {
    if (v664 === "reference") appendUniqueUrl(v665, v666["referenceImage"]);
    else v664 === "edit" && appendUniqueUrl(v665, v666["editRefImage"]);
  }
  return (
    normalizeInputList(inputImages)["forEach"]((v667) =>
      appendUniqueUrl(v665, v667),
    ),
    v665
  );
}
function removeRunningHubWan27TransientFields(v668) {
  (delete v668["wan27_mode"],
    delete v668["firstImageUrl"],
    delete v668["lastImageUrl"],
    delete v668["imageUrl"],
    delete v668["imageUrls"],
    delete v668["videoUrl"],
    delete v668["videoUrls"]);
  if (!v668["aspectRatio"]) delete v668["aspectRatio"];
}
function resolveRunningHubWan27Route({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
  currentBody: currentBody = {},
} = {}) {
  const v669 = getRunningHubWan27Mode(payload, currentBody);
  if (v669 === "reference" || v669 === "edit") return v669;
  const v670 = normalizeInputList(inputVideos);
  if (v669 === "video" && v670["length"] > 0) return "video";
  const v671 = collectRunningHubWan27Images({
    mode: v669,
    inputImages: inputImages,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  if (v671["length"] > 0) return "image";
  return "text";
}
function runninghubWan27Video({
  currentBody: v672,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v673 = { ...v672 },
    v674 = String(v673["prompt"] || payload?.["prompt"] || "")["trim"]();
  if (!v674) throw new Error("RunningHub Wan2.7 prompt is required");
  const v675 = getRunningHubWan27Mode(payload, v673),
    v676 = collectRunningHubWan27Images({
      mode: v675,
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    v677 = normalizeInputList(inputVideos),
    v678 =
      String(v673["audioUrl"] || "")["trim"]() ||
      normalizeInputList(inputAudios)[0] ||
      "";
  v673["prompt"] = v674;
  if (v678) v673["audioUrl"] = v678;
  removeRunningHubWan27TransientFields(v673);
  if (v675 === "reference") {
    const v679 = v676["length"] + v677["length"];
    if (v679 <= 0)
      throw new Error(
        "RunningHub\x20Wan2.7\x20reference\x20mode\x20requires\x20image\x20or\x20video\x20input",
      );
    if (v679 > 5)
      throw new Error(
        "RunningHub Wan2.7 reference mode supports at most 5 inputs",
      );
    if (v678)
      throw new Error(
        "RunningHub Wan2.7 reference mode does not accept audio input",
      );
    if (v676["length"] > 0) v673["imageUrls"] = v676;
    if (v677["length"] > 0) v673["videoUrls"] = v677;
    return v673;
  }
  if (v675 === "edit") {
    if (!v677[0])
      throw new Error(
        "RunningHub Wan2.7 video edit requires original video input",
      );
    if (v677["length"] > 1)
      throw new Error(
        "RunningHub\x20Wan2.7\x20video\x20edit\x20accepts\x20only\x20one\x20original\x20video",
      );
    if (v676["length"] > 3)
      throw new Error(
        "RunningHub Wan2.7 video edit supports at most 3 image inputs",
      );
    if (v678)
      throw new Error(
        "RunningHub Wan2.7 video edit does not accept audio input",
      );
    v673["videoUrl"] = v677[0];
    if (v676["length"] > 0) v673["imageUrls"] = v676["slice"](0, 3);
    return v673;
  }
  if (v675 === "video") {
    if (v676["length"] > 0)
      throw new Error(
        "RunningHub Wan2.7 video extend does not accept image input",
      );
    if (v677["length"] > 1)
      throw new Error(
        "RunningHub Wan2.7 video extend accepts only one video input",
      );
    if (v677[0]) v673["videoUrl"] = v677[0];
    return v673;
  }
  if (v677["length"] > 0)
    throw new Error(
      "RunningHub\x20Wan2.7\x20image\x20mode\x20does\x20not\x20accept\x20video\x20input",
    );
  if (v676["length"] > 2)
    throw new Error(
      "RunningHub Wan2.7 image mode supports at most 2 image inputs",
    );
  v676[0] && (delete v673["aspectRatio"], (v673["firstImageUrl"] = v676[0]));
  if (v676[1]) v673["lastImageUrl"] = v676[1];
  return v673;
}
function runninghubWan27VideoEndpoint({
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v680 = resolveRunningHubWan27Route({
    inputImages: inputImages,
    inputVideos: inputVideos,
    payload: payload,
    finalUrlsBySlot: finalUrlsBySlot,
  });
  return RUNNINGHUB_WAN27_ENDPOINTS[v680] || RUNNINGHUB_WAN27_ENDPOINTS["text"];
}
function apimartKlingV3OmniVideo({
  currentBody: v681,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  payload: payload = {},
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const v682 = { ...v681 },
    v683 = normalizeInputList(inputImages),
    v684 = normalizeInputList(inputVideos),
    v685 = normalizeRunningHubInputUrlsBySlot(finalUrlsBySlot),
    v686 = normalizeKlingV3OmniMode(
      payload?.["generationParams"]?.["kling_v3_omni_mode"] ||
        payload?.["kling_v3_omni_mode"] ||
        "image",
    );
  (delete v682["kling_v3_omni_mode"],
    delete v682["image_with_roles"],
    delete v682["video_list"]);
  if (v686 === "edit") {
    if (!v684[0])
      throw new Error(
        "APIMart\x20Kling\x20V3\x20Omni\x20video\x20edit\x20requires\x20video_list\x20input",
      );
    return (
      (v682["video_list"] = [buildKlingV3OmniVideoItem(v684[0], "base")]),
      delete v682["image_urls"],
      delete v682["image_with_roles"],
      delete v682["audio"],
      delete v682["duration"],
      delete v682["aspect_ratio"],
      v682
    );
  }
  if (v686 === "reference") {
    const v687 = [];
    (appendUniqueUrl(v687, v685["referenceImage"]),
      v683["forEach"]((v688) => appendUniqueUrl(v687, v688)));
    const v689 = v687["slice"](0, 1),
      v690 = v684[0] || "";
    if (v689["length"] <= 0 && !v690)
      throw new Error(
        "APIMart Kling V3 Omni reference mode requires image or video input",
      );
    return (
      v689["length"] > 0
        ? (v682["image_with_roles"] = v689["map"]((v691) => ({
            url: v691,
            role: "reference",
          })))
        : delete v682["image_with_roles"],
      v690
        ? ((v682["video_list"] = [buildKlingV3OmniVideoItem(v690, "feature")]),
          delete v682["audio"])
        : delete v682["video_list"],
      delete v682["image_urls"],
      v682
    );
  }
  if (v684["length"] > 0)
    throw new Error(
      "APIMart Kling V3 Omni image mode does not support video_list input",
    );
  const v692 =
      Object["prototype"]["hasOwnProperty"]["call"](v685, "firstFrame") ||
      Object["prototype"]["hasOwnProperty"]["call"](v685, "lastFrame"),
    v693 = v692 ? v685["firstFrame"] || "" : v683[0] || "",
    v694 = v692
      ? v685["lastFrame"] || ""
      : v683["find"]((v695) => v695 && v695 !== v693) || "";
  if (!v693 && v694)
    throw new Error(
      "APIMart Kling V3 Omni last_frame requires first_frame input",
    );
  const v696 = [];
  return (
    v693 && v696["push"]({ url: v693, role: "first_frame" }),
    v694 && v696["push"]({ url: v694, role: "last_frame" }),
    v696["length"] > 0
      ? ((v682["image_with_roles"] = v696), delete v682["image_urls"])
      : delete v682["image_urls"],
    v682
  );
}
function apimartWan27Video({ currentBody: v697, payload: payload = {} }) {
  const v698 = { ...v697 },
    v699 = normalizeInputList(v698["image_urls"]),
    v700 = normalizeInputList(v698["video_urls"]),
    v701 = isPresentValue(v698["audio_url"])
      ? String(v698["audio_url"] || "")["trim"]()
      : "",
    v702 = !!v701,
    v703 = String(
      payload?.["generationParams"]?.["wan27_mode"] ||
        payload?.["wan27_mode"] ||
        "image",
    )
      ["trim"]()
      ["toLowerCase"]();
  (delete v698["wan27_mode"],
    delete v698["wan27_reference_input"],
    delete v698["wan27_edit_input"]);
  if (v703 === "reference") {
    v698["model"] = "wan2.7-r2v";
    const v704 = v699["slice"](0, 1),
      v705 = v700["slice"](0, Math["max"](0, 5 - v704["length"]));
    if (v704["length"] <= 0 && v705["length"] <= 0)
      throw new Error(
        "APIMart Wan2.7-R2V requires image_with_roles or video_urls input",
      );
    return (
      v704["length"] > 0
        ? (v698["image_with_roles"] = v704["map"]((v706, v707) => ({
            url: v706,
            role: "reference_image",
            ...(v707 === 0 && v701 ? { reference_voice: v701 } : {}),
          })))
        : delete v698["image_with_roles"],
      v705["length"] > 0
        ? (v698["video_urls"] = v705)
        : delete v698["video_urls"],
      delete v698["image_urls"],
      delete v698["audio_url"],
      v698
    );
  }
  if (v703 === "edit") {
    v698["model"] = "wan2.7-videoedit";
    if (!v700[0])
      throw new Error("APIMart Wan2.7-VideoEdit requires video_urls input");
    v698["video_urls"] = v700["slice"](0, 2);
    if (v699["length"] > 0) v698["image_urls"] = v699["slice"](0, 4);
    else delete v698["image_urls"];
    return (delete v698["audio_url"], v698);
  }
  v698["model"] = "wan2.7";
  if (v699["length"] > 0 && v700["length"] > 0)
    throw new Error("APIMart Wan2.7 image_urls cannot be used with video_urls");
  if (v700["length"] > 0 && v702)
    throw new Error("APIMart Wan2.7 video_urls cannot be used with audio_url");
  return (
    (v699["length"] > 0 || v700["length"] > 0) && delete v698["size"],
    v698
  );
}
function runninghubImageEndpoint({
  modelToken: v708,
  finalUrls: v709,
  executionManifest: v710,
  modelManifest: v711,
}) {
  const v712 = normalizeRunningHubModelId(v708),
    v713 = resolveRunningHubModelEndpoint({
      hasInputImages: v709["length"] > 0,
      executionManifest: v710,
      modelManifest: v711,
    });
  return "https://www.runninghub.cn/openapi/v2/" + v712 + "/" + v713;
}
function runninghubLlmChatEndpoint() {
  return "https://llm.runninghub.cn/v1/chat/completions";
}
const BODY_RESOLVERS = Object["freeze"]({
    apimartGptImage2Image: apimartGptImage2Image,
    ppioImageSize: ppioImageSize,
    grsaiImage: grsaiImage,
    grsaiGptImage2Image: grsaiGptImage2Image,
    runninghubImage: runninghubImage,
    apimartSeedanceVideo: apimartSeedanceVideo,
    apimartVeo3Video: apimartVeo3Video,
    apimartHappyHorseVideo: apimartHappyHorseVideo,
    runninghubHappyHorseVideo: runninghubHappyHorseVideo,
    runninghubSeedance2Video: runninghubSeedance2Video,
    volcengineSeedance2Video: volcengineSeedance2Video,
    apimartHailuo02Video: apimartHailuo02Video,
    apimartHailuo23Video: apimartHailuo23Video,
    apimartViduQ3Video: apimartViduQ3Video,
    apimartKlingO1Video: apimartKlingO1Video,
    runninghubKlingO1Video: runninghubKlingO1Video,
    runninghubKlingV3Video: runninghubKlingV3Video,
    runninghubKlingO3Video: runninghubKlingO3Video,
    runninghubHailuo02Video: runninghubHailuo02Video,
    runninghubHailuo23Video: runninghubHailuo23Video,
    runninghubVeo3Video: runninghubVeo3Video,
    runninghubWan27Video: runninghubWan27Video,
    apimartKlingV3OmniVideo: apimartKlingV3OmniVideo,
    apimartWan27Video: apimartWan27Video,
  }),
  ENDPOINT_RESOLVERS = Object["freeze"]({
    runninghubImageEndpoint: runninghubImageEndpoint,
    runninghubKlingO1VideoEndpoint: runninghubKlingO1VideoEndpoint,
    runninghubHappyHorseVideoEndpoint: runninghubHappyHorseVideoEndpoint,
    runninghubSeedance2VideoEndpoint: runninghubSeedance2VideoEndpoint,
    runninghubKlingV3VideoEndpoint: runninghubKlingV3VideoEndpoint,
    runninghubKlingO3VideoEndpoint: runninghubKlingO3VideoEndpoint,
    runninghubHailuo02VideoEndpoint: runninghubHailuo02VideoEndpoint,
    runninghubHailuo23VideoEndpoint: runninghubHailuo23VideoEndpoint,
    runninghubVeo3VideoEndpoint: runninghubVeo3VideoEndpoint,
    runninghubWan27VideoEndpoint: runninghubWan27VideoEndpoint,
    runninghubLlmChatEndpoint: runninghubLlmChatEndpoint,
  });
export function getModelApiBodyResolver(v714) {
  return BODY_RESOLVERS[String(v714 || "")["trim"]()] || null;
}
export function getModelApiEndpointResolver(v715) {
  return ENDPOINT_RESOLVERS[String(v715 || "")["trim"]()] || null;
}

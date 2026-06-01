import {
  NANO_BANANA_FAMILIES,
  getNanoBananaAllowedRatioOptions,
  isNanoBananaFamily,
  resolveNanoBananaSelectionFromModel,
} from "../src/modules/nanoBananaModeRules.js";
import { resolveModelExecution } from "../src/manifests/index.js";
const DEFAULT_RATIO_LABEL = "1:1",
  DEFAULT_RATIO_OPTIONS = Object["freeze"]([
    Object["freeze"]({ label: "1:1", w: 1, h: 1, value: 1 }),
    Object["freeze"]({ label: "9:16", w: 9, h: 16, value: 9 / 16 }),
    Object["freeze"]({ label: "16:9", w: 16, h: 9, value: 16 / 9 }),
    Object["freeze"]({ label: "3:4", w: 3, h: 4, value: 3 / 4 }),
    Object["freeze"]({ label: "4:3", w: 4, h: 3, value: 4 / 3 }),
    Object["freeze"]({ label: "3:2", w: 3, h: 2, value: 3 / 2 }),
    Object["freeze"]({ label: "2:3", w: 2, h: 3, value: 2 / 3 }),
    Object["freeze"]({ label: "5:4", w: 5, h: 4, value: 5 / 4 }),
    Object["freeze"]({ label: "4:5", w: 4, h: 5, value: 4 / 5 }),
    Object["freeze"]({ label: "21:9", w: 21, h: 9, value: 21 / 9 }),
  ]),
  DREAMINA_RATIO_OPTIONS = Object["freeze"](
    DEFAULT_RATIO_OPTIONS["filter"](
      (v0) => v0["label"] !== "5:4" && v0["label"] !== "4:5",
    ),
  ),
  DIMENSION_QUALITY_PIXEL_MAP = Object["freeze"]({
    "1K": 1024 * 1024,
    "2K": 2048 * 2048,
    "3K": 2560 * 2560,
    "4K": 2880 * 2880,
  }),
  DIMENSION_DEFAULT_QUALITY = "2K",
  DIMENSION_ALIGN = 8,
  DIMENSION_MIN = 512,
  DIMENSION_MAX = 8192;
function isFinitePositive(v1) {
  const v2 = Number(v1);
  return Number["isFinite"](v2) && v2 > 0;
}
function normalizeImageSizeLabel(v3) {
  return String(v3 || "")
    ["trim"]()
    ["toUpperCase"]();
}
function resolveManifestRatioContext(v4, v5) {
  try {
    return resolveModelExecution(v5, { providerHint: v4 }) || null;
  } catch {
    return null;
  }
}
function getManifestRatioPolicy(v6, v7) {
  const v8 = resolveManifestRatioContext(v6, v7),
    v9 =
      v8?.["modelManifest"]?.["extensions"]?.["ratioPolicy"] ||
      v8?.["executionManifest"]?.["extensions"]?.["ratioPolicy"] ||
      null;
  return v9 && typeof v9 === "object"
    ? { policy: v9, resolved: v8 }
    : { policy: null, resolved: v8 };
}
function normalizeCompareValue(v10) {
  return String(v10 ?? "")
    ["trim"]()
    ["toLowerCase"]();
}
function getNodeFieldValue(v11, v12, v13 = "") {
  if (!v11 || typeof v11 !== "object") return v13;
  return v11[v12] ?? v11?.["generationParams"]?.[v12] ?? v13;
}
function getOptionDisableWhen(v14) {
  if (!v14 || typeof v14 !== "object" || Array["isArray"](v14)) return null;
  const v15 = v14["disableWhen"] || v14["disabledWhen"];
  return v15 &&
    (Array["isArray"](v15) ||
      (typeof v15 === "object" && !Array["isArray"](v15)))
    ? v15
    : null;
}
function optionDisableWhenMatches(v16, v17 = {}) {
  if (Array["isArray"](v16))
    return v16["some"]((v18) => optionDisableWhenMatches(v18, v17));
  if (!v16 || typeof v16 !== "object") return false;
  if (Array["isArray"](v16["any"]))
    return v16["any"]["some"]((v19) => optionDisableWhenMatches(v19, v17));
  if (Array["isArray"](v16["all"]))
    return v16["all"]["every"]((v20) => optionDisableWhenMatches(v20, v17));
  const v21 = String(v16?.["field"] || v16?.["param"] || "")["trim"]();
  if (!v21) return false;
  const v22 = v16["values"] !== undefined ? v16["values"] : v16["value"],
    v23 = Array["isArray"](v22) ? v22 : [v22],
    v24 = v23["map"](normalizeCompareValue);
  return v24["includes"](
    normalizeCompareValue(getNodeFieldValue(v17, v21, "")),
  );
}
function isOptionDisabled(v25, v26 = {}) {
  return (
    v25 &&
    typeof v25 === "object" &&
    !Array["isArray"](v25) &&
    (v25["disabled"] === true ||
      optionDisableWhenMatches(getOptionDisableWhen(v25), v26))
  );
}
function findUiSchemaField(v27, v28) {
  return (
    Array["isArray"](v27?.["uiSchema"]?.["fields"])
      ? v27["uiSchema"]["fields"]
      : []
  )["find"]((v29) => String(v29?.["id"] || "")["trim"]() === v28);
}
function toRatioOption(v30) {
  const v31 = parseRatioLabel(v30);
  if (!v31) return null;
  return Object["freeze"]({
    label: v31["label"],
    w: v31["w"],
    h: v31["h"],
    value: v31["w"] / v31["h"],
  });
}
function labelsToRatioOptions(v32) {
  return Object["freeze"](
    (Array["isArray"](v32) ? v32 : [])
      ["map"]((v33) => toRatioOption(v33))
      ["filter"](Boolean),
  );
}
function getPolicyRatiosForImageSize(v34, v35) {
  const v36 = normalizeImageSizeLabel(v35),
    v37 = v34?.["ratiosByImageSize"];
  if (v36 && v37 && typeof v37 === "object" && v37[v36])
    return labelsToRatioOptions(v37[v36]);
  if (Array["isArray"](v34?.["ratios"]))
    return labelsToRatioOptions(v34["ratios"]);
  return null;
}
function getUiSchemaRatioOptions(v38, v39) {
  const v40 = findUiSchemaField(v38?.["modelManifest"], "aspectRatio"),
    v41 = Array["isArray"](v40?.["options"]) ? v40["options"] : [];
  if (v41["length"] === 0) return null;
  const v42 = { imageSize: normalizeImageSizeLabel(v39) },
    v43 = v41["filter"]((v44) => !isOptionDisabled(v44, v42))
      ["map"]((v45) => String(v45?.["value"] ?? v45)["trim"]())
      ["filter"]((v46) => v46 && !isAdaptiveRatioLabel(v46))
      ["map"]((v47) => toRatioOption(v47))
      ["filter"](Boolean);
  return v43["length"] > 0 ? Object["freeze"](v43) : null;
}
function getManifestAllowedRatios(v48, v49, v50) {
  const { policy: v51, resolved: v52 } = getManifestRatioPolicy(v48, v49);
  if (!v52?.["modelManifest"]) return null;
  const v53 = getPolicyRatiosForImageSize(v51, v50);
  if (v53?.["length"] > 0) return v53;
  return getUiSchemaRatioOptions(v52, v50);
}
function getManifestRatioCapability(v54, v55) {
  const { policy: v56, resolved: v57 } = getManifestRatioPolicy(v54, v55),
    v58 = String(v56?.["capability"] || "")["trim"]();
  if (v58) return v58;
  if (!v57?.["modelManifest"]) return "";
  if (v57["modelManifest"]["adapterType"] === "workflow") return "none";
  if (findUiSchemaField(v57["modelManifest"], "aspectRatio"))
    return "aspectRatio";
  return "";
}
function getRatioFallbackStrategy(v59, v60, v61) {
  const { policy: v62 } = getManifestRatioPolicy(v59, v60),
    v63 = normalizeImageSizeLabel(v61);
  if (
    v63 &&
    v62?.["fallbackStrategyByImageSize"] &&
    typeof v62["fallbackStrategyByImageSize"] === "object"
  )
    return String(v62["fallbackStrategyByImageSize"][v63] || "")["trim"]();
  return String(v62?.["fallbackStrategy"] || "")["trim"]();
}
export function isAdaptiveRatioLabel(v64) {
  const v65 = String(v64 || "")["trim"](),
    v66 = v65["toLowerCase"]();
  return (
    !v65 ||
    v66 === "auto" ||
    v66 === "default" ||
    v66 === "adaptive" ||
    v65 === "自适应" ||
    v65 === "默认"
  );
}
export function normalizeRatioLabelText(v67) {
  return String(v67 || "")
    ["trim"]()
    ["replace"](/[：∶﹕]/g, ":")
    ["replace"](/\s+/g, "");
}
export function parseRatioLabel(v68) {
  const v69 = normalizeRatioLabelText(v68);
  if (!v69["includes"](":")) return null;
  const [v70, v71] = v69["split"](":"),
    v72 = Number["parseFloat"](v70),
    v73 = Number["parseFloat"](v71);
  if (!(v72 > 0 && v73 > 0)) return null;
  return { w: v72, h: v73, label: v72 + ":" + v73 };
}
function getRatioOptionValue(v74) {
  if (!v74 || typeof v74 !== "object") return null;
  const v75 = Number(v74["value"]);
  if (Number["isFinite"](v75) && v75 > 0) return v75;
  const v76 = Number(v74["w"]),
    v77 = Number(v74["h"]);
  if (Number["isFinite"](v76) && v76 > 0 && Number["isFinite"](v77) && v77 > 0)
    return v76 / v77;
  const v78 = parseRatioLabel(v74["label"]);
  if (v78) return v78["w"] / v78["h"];
  return null;
}
export function pickClosestRatio(v79, v80, v81 = DEFAULT_RATIO_OPTIONS) {
  const v82 =
      Array["isArray"](v81) && v81["length"] > 0 ? v81 : DEFAULT_RATIO_OPTIONS,
    v83 = typeof v79 === "string" ? parseRatioLabel(v79) : null;
  let v84 = 1;
  if (v83) v84 = v83["w"] / v83["h"];
  else {
    const v85 = Number(v79),
      v86 = Number(v80);
    isFinitePositive(v85) && isFinitePositive(v86) && (v84 = v85 / v86);
  }
  let v87 = v82[0],
    v88 = getRatioOptionValue(v87) || 1,
    v89 = Math["abs"](v84 - v88);
  for (let v90 = 1; v90 < v82["length"]; v90 += 1) {
    const v91 = v82[v90],
      v92 = getRatioOptionValue(v91);
    if (!(v92 > 0)) continue;
    const v93 = Math["abs"](v84 - v92);
    v93 < v89 && ((v89 = v93), (v87 = v91), (v88 = v92));
  }
  return v87["label"];
}
function pickClosestDirectionalRatio(v94, v95, v96 = DEFAULT_RATIO_OPTIONS) {
  const v97 =
      Array["isArray"](v96) && v96["length"] > 0 ? v96 : DEFAULT_RATIO_OPTIONS,
    v98 = typeof v94 === "string" ? parseRatioLabel(v94) : null;
  let v99 = 1;
  if (v98) v99 = v98["w"] / v98["h"];
  else {
    const v100 = Number(v94),
      v101 = Number(v95);
    isFinitePositive(v100) && isFinitePositive(v101) && (v99 = v100 / v101);
  }
  if (Math["abs"](v99 - 1) < 0.000001) {
    const v102 = v97["find"]((v103) => v103["label"] === "16:9");
    if (v102) return v102["label"];
  }
  const v104 = v97["filter"]((v105) => {
    const v106 = getRatioOptionValue(v105);
    if (!(v106 > 0)) return false;
    return v99 > 1 ? v106 > 1 : v106 < 1;
  });
  return pickClosestRatio(v94, v95, v104["length"] > 0 ? v104 : v97);
}
export function pickClosestRatioForProviderModel({
  provider: v107,
  model: v108,
  ratioLabel: v109,
  width: v110,
  height: v111,
  imageSize: v112,
} = {}) {
  const v113 = getAllowedRatiosForProviderModel(v107, v108, v112),
    v114 = isFinitePositive(v110) && isFinitePositive(v111),
    v115 = v114 ? Number(v110) : v109 || DEFAULT_RATIO_LABEL,
    v116 = v114 ? Number(v111) : undefined;
  if (getRatioFallbackStrategy(v107, v108, v112) === "directional")
    return pickClosestDirectionalRatio(v115, v116, v113);
  return pickClosestRatio(v115, v116, v113);
}
export function resolveAdaptiveSourceSize({
  displayWidth: v117,
  displayHeight: v118,
  inputWidth: v119,
  inputHeight: v120,
} = {}) {
  if (isFinitePositive(v117) && isFinitePositive(v118))
    return { width: Number(v117), height: Number(v118), source: "display" };
  if (isFinitePositive(v119) && isFinitePositive(v120))
    return { width: Number(v119), height: Number(v120), source: "input-media" };
  return { width: 1, height: 1, source: "fallback" };
}
export function getAllowedRatiosForProviderModel(v121, v122, v123 = "") {
  const v124 = getManifestAllowedRatios(v121, v122, v123);
  if (v124?.["length"] > 0) return v124;
  const v125 = String(v121 || "")
      ["trim"]()
      ["toLowerCase"](),
    v126 = String(v122 || "")
      ["trim"]()
      ["toLowerCase"](),
    v127 = v125 === "grsai",
    v128 = resolveNanoBananaSelectionFromModel(v126);
  if (
    v127 &&
    v128 &&
    isNanoBananaFamily(v128["family"]) &&
    v128["family"] !== NANO_BANANA_FAMILIES["GPT_IMAGE_2"]
  )
    return getNanoBananaAllowedRatioOptions(v128["family"]);
  if (v125 === "runninghub" && v128 && isNanoBananaFamily(v128["family"]))
    return getNanoBananaAllowedRatioOptions(v128["family"]);
  if (v125 === "dreamina") return DREAMINA_RATIO_OPTIONS;
  return DEFAULT_RATIO_OPTIONS;
}
export function getRatioCapability(v129, v130) {
  const v131 = getManifestRatioCapability(v129, v130);
  if (v131) return v131;
  const v132 = String(v129 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v132 === "runninghubwf") return "none";
  if (v132 === "runninghub" || v132 === "grsai") return "aspectRatio";
  if (v132 === "ppio" || v132 === "apimart") return "size";
  if (v132 === "dreamina") return "aspectRatio";
  return "aspectRatio";
}
function alignAndClampDimension(v133) {
  const v134 =
    Math["round"](Number(v133 || 0) / DIMENSION_ALIGN) * DIMENSION_ALIGN;
  return Math["max"](DIMENSION_MIN, Math["min"](DIMENSION_MAX, v134));
}
export function calculateDimensionsByQualityAndRatio(v135, v136) {
  const v137 = String(v135 || "")
      ["trim"]()
      ["toUpperCase"](),
    v138 =
      DIMENSION_QUALITY_PIXEL_MAP[v137] ||
      DIMENSION_QUALITY_PIXEL_MAP[DIMENSION_DEFAULT_QUALITY],
    v139 = parseRatioLabel(v136) || { w: 1, h: 1 },
    v140 = v139["w"] / v139["h"],
    v141 = Math["sqrt"](v138 / v140),
    v142 = v141 * v140;
  return {
    width: alignAndClampDimension(v142),
    height: alignAndClampDimension(v141),
  };
}
export function resolveProviderRatioPayload({
  provider: v143,
  model: v144,
  ratioLabel: v145,
  imageSize: v146,
  suppressAspectRatio: suppressAspectRatio = false,
} = {}) {
  const v147 = getRatioCapability(v143, v144),
    v148 = pickClosestRatioForProviderModel({
      provider: v143,
      model: v144,
      ratioLabel: v145 || DEFAULT_RATIO_LABEL,
      imageSize: v146,
    });
  if (v147 === "none" || suppressAspectRatio === true)
    return {
      ratioCapability: v147,
      resolvedRatioLabel: v148,
      params: {},
      suppressAspectRatio: true,
      notice:
        v147 === "none"
          ? "Model does not support ratio params; falling back to model default."
          : "",
    };
  if (v147 === "aspectRatio")
    return {
      ratioCapability: v147,
      resolvedRatioLabel: v148,
      params: { aspectRatio: v148 },
      suppressAspectRatio: false,
      notice: "",
    };
  if (v147 === "size")
    return {
      ratioCapability: v147,
      resolvedRatioLabel: v148,
      params: { size: v148 },
      suppressAspectRatio: false,
      notice: "",
    };
  if (v147 === "dimensions") {
    const v149 = calculateDimensionsByQualityAndRatio(v146, v148);
    return {
      ratioCapability: v147,
      resolvedRatioLabel: v148,
      params: v149,
      suppressAspectRatio: false,
      notice: "",
    };
  }
  return {
    ratioCapability: "none",
    resolvedRatioLabel: v148,
    params: {},
    suppressAspectRatio: true,
    notice: "Unsupported ratio capability; skipping ratio params.",
  };
}
export const IMAGE_RATIO_OPTIONS = DEFAULT_RATIO_OPTIONS;
export const IMAGE_RATIO_DEFAULT_LABEL = DEFAULT_RATIO_LABEL;

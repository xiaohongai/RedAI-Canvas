import {
  QWEN_IMAGE_EDIT_MODEL_ID,
  getModelsByKind,
  isWorkflowModel,
  normalizeProviderId as normalizeProviderIdImpl,
  resolveModelExecution,
} from "../manifests/index.js";
import {
  NANO_BANANA_FAMILIES,
  resolveNanoBananaSelectionFromModel,
} from "./nanoBananaModeRules.js";
const RH_QWEN_IMAGE_EDIT_MODEL = QWEN_IMAGE_EDIT_MODEL_ID;
function normalizeModelId(v0) {
  return String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function normalizeProviderId(v1) {
  return normalizeProviderIdImpl(v1);
}
function inferProviderHintFromModelId(v2) {
  const v3 = normalizeModelId(v2);
  if (!v3["includes"]("/")) return "";
  return normalizeProviderId(v3["split"]("/")[0]);
}
function normalizeImageSizeValue(v4) {
  return String(v4 || "")
    ["trim"]()
    ["toUpperCase"]();
}
function collectStringValues(v5, v6 = []) {
  if (typeof v5 === "string") {
    const v7 = normalizeModelId(v5);
    if (v7) v6["push"](v7);
    return v6;
  }
  if (Array["isArray"](v5))
    return (v5["forEach"]((v8) => collectStringValues(v8, v6)), v6);
  return (
    v5 &&
      typeof v5 === "object" &&
      Object["values"](v5)["forEach"]((v9) => collectStringValues(v9, v6)),
    v6
  );
}
function getExecutionModelTokens(v10) {
  return collectStringValues([
    v10?.["model"],
    v10?.["routeModels"],
    v10?.["modeModels"],
    v10?.["imageSizeModels"],
  ]);
}
function resolveImageModelFromExecutionToken(v11, v12 = "") {
  const v13 = normalizeModelId(v11);
  if (!v13 || v13["includes"]("/")) return null;
  const v14 = normalizeProviderId(v12),
    v15 = getModelsByKind("image")["filter"]((v16) => {
      return !v14 || normalizeProviderId(v16?.["provider"]) === v14;
    }),
    v17 = v15["map"]((v18) => ({
      modelManifest: v18,
      executionManifest: resolveModelExecution(v18?.["modelId"])?.[
        "executionManifest"
      ],
    }))["filter"]((v19) => v19["executionManifest"]),
    v20 = v17["find"](
      ({ executionManifest: v21 }) => normalizeModelId(v21?.["model"]) === v13,
    ),
    v22 =
      v20 ||
      v17["find"](({ executionManifest: v23 }) =>
        getExecutionModelTokens(v23)["includes"](v13),
      );
  if (!v22) return null;
  return {
    modelManifest: v22["modelManifest"],
    executionManifest: v22["executionManifest"],
    canonicalModelId: v22["modelManifest"]["modelId"],
    source: "execution-model-token",
  };
}
function resolveImageModelContext(v24, v25 = "") {
  const v26 = normalizeProviderId(v25) || inferProviderHintFromModelId(v24),
    v27 =
      resolveModelExecution(v24, { providerHint: v26 }) ||
      resolveImageModelFromExecutionToken(v24, v26) ||
      (v26 ? null : resolveModelExecution(v24)),
    v28 = v27?.["modelManifest"] || null,
    v29 = v27?.["executionManifest"] || null;
  return {
    modelManifest: v28,
    executionManifest: v29,
    provider: normalizeProviderId(v28?.["provider"] || v26),
    modelId: normalizeModelId(
      v27?.["canonicalModelId"] || v28?.["modelId"] || v24,
    ),
  };
}
function getImageSizePolicy(v30, v31 = "") {
  const v32 = resolveImageModelContext(v30, v31),
    v33 = v32["modelManifest"]?.["extensions"]?.["imageSizePolicy"];
  return v33 && typeof v33 === "object"
    ? { context: v32, policy: v33 }
    : { context: v32, policy: null };
}
function normalizePolicySizes(v34) {
  return Array["isArray"](v34)
    ? v34["map"](normalizeImageSizeValue)["filter"](Boolean)
    : [];
}
function getGrsaiNanoBananaSelection(v35, v36 = "", v37 = "2K") {
  const v38 = resolveNanoBananaSelectionFromModel(v35, v37, v36);
  if (!v38 || v38["provider"] !== "grsai") return null;
  if (v38["family"] === NANO_BANANA_FAMILIES["GPT_IMAGE_2"]) return null;
  return v38;
}
export function isRunningHubModelWithoutImageSizeParam(v39) {
  const { context: v40, policy: v41 } = getImageSizePolicy(v39);
  return v40["provider"] === "runninghub" && v41?.["omitRequestParam"] === true;
}
export function isRunningHubGptImage2OfficialModel(v42, v43 = "") {
  const { context: v44, policy: v45 } = getImageSizePolicy(v42, v43);
  return v44["provider"] === "runninghub" && v45?.["officialVariant"] === true;
}
export function isRhQwenImageEditModel(v46) {
  return normalizeModelId(v46) === normalizeModelId(RH_QWEN_IMAGE_EDIT_MODEL);
}
export function normalizeImageSizeForProviderModel({
  model: v47,
  provider: provider = "",
  imageSize: imageSize = "",
} = {}) {
  const v48 = normalizeImageSizeValue(imageSize),
    { policy: v49 } = getImageSizePolicy(v47, provider),
    v50 = getGrsaiNanoBananaSelection(v47, provider, v48 || "2K");
  if (v50) {
    const v51 = normalizeImageSizeValue(v49?.["fixedSize"]);
    if (v51) return v51;
    if (v48 === "4K" && v49?.["allow4KSelection"] === true) return "4K";
    return v48 === "1K" ? "1K" : "2K";
  }
  if (isRunningHubGptImage2OfficialModel(v47, provider)) {
    const v52 = normalizePolicySizes(v49?.["allowedSizes"]);
    if (v52["includes"](v48)) return v48;
    return normalizeImageSizeValue(v49?.["defaultSize"]) || "2K";
  }
  return "";
}
export function isImageSizeOptionDisabledForProviderModel({
  model: v53,
  provider: provider = "",
  imageSize: imageSize = "",
} = {}) {
  const v54 = normalizeImageSizeValue(imageSize),
    { policy: v55 } = getImageSizePolicy(v53, provider),
    v56 = getGrsaiNanoBananaSelection(v53, provider, v54 || "2K");
  if (v56) {
    const v57 = normalizeImageSizeValue(v55?.["fixedSize"]);
    if (v57) return v54 !== v57;
    return v54 === "4K" && v55?.["allow4KSelection"] !== true;
  }
  if (isRhQwenImageEditModel(v53) && v54 === "4K") return true;
  const v58 = normalizePolicySizes(v55?.["disabledSizes"]);
  return v58["includes"](v54);
}
export function isGrsaiModelWithoutImageSizeParam(v59) {
  const { context: v60, policy: v61 } = getImageSizePolicy(v59);
  return v60["provider"] === "grsai" && v61?.["omitRequestParam"] === true;
}
export function shouldOmitImageSizeParam(v62) {
  return getImageSizePolicy(v62)["policy"]?.["omitRequestParam"] === true;
}
export function shouldDisableImageSizeControl(v63, v64 = "") {
  const v65 = normalizeProviderId(v64);
  if (v65 === "grsai" && isGrsaiModelWithoutImageSizeParam(v63)) return false;
  return shouldOmitImageSizeParam(v63);
}
export function shouldHideImageSizeInMainRatioLabel(v66, v67 = "") {
  if (isRhQwenImageEditModel(v66)) return false;
  const v68 = normalizeProviderId(v67),
    { context: v69, policy: v70 } = getImageSizePolicy(v66, v67),
    v71 =
      v68 === "runninghubwf" ||
      v69["executionManifest"]?.["adapterType"] === "workflow" ||
      isWorkflowModel(v66, v68),
    v72 =
      v68 === "grsai" &&
      v69["provider"] === "grsai" &&
      v70?.["omitRequestParam"] === true;
  if (v71) return true;
  if (v72) return false;
  return (
    v70?.["hideInMainRatioLabel"] === true || v70?.["omitRequestParam"] === true
  );
}
export function buildMainImageRatioLabel({
  model: v73,
  provider: provider = "",
  aspectRatio: aspectRatio = "自适应",
  imageSize: imageSize = "",
} = {}) {
  const v74 = String(aspectRatio || "自适应")["trim"]() || "自适应",
    { context: v75, policy: v76 } = getImageSizePolicy(v73, provider),
    v77 =
      v75["provider"] === "grsai" && v76?.["omitRequestParam"] === true
        ? normalizeImageSizeValue(v76?.["defaultLabelSize"]) || "1K"
        : "2K",
    v78 = normalizeImageSizeForProviderModel({
      model: v73,
      provider: provider,
      imageSize: imageSize,
    }),
    v79 =
      v78 ||
      String(imageSize || v77)
        ["trim"]()
        ["toUpperCase"]() ||
      v77;
  if (shouldHideImageSizeInMainRatioLabel(v73, provider)) return v74;
  return v74 + " · " + v79;
}

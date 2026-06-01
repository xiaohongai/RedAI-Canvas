import {
  fieldKind,
  findComfyDimensionFields,
  shouldInjectComfyDimensions,
  inferComfyFieldBindRole,
} from "./comfyWorkflowParser.js";
import {
  calculateDimensionsByQualityAndRatio,
  IMAGE_RATIO_DEFAULT_LABEL,
} from "../../../api/imageRatioPolicy.js";
import {
  DEFAULT_IMAGE_NODE_MODEL,
} from "../../components/aigenImage/defaults.js";

function readGenerationParam(nodeData, key, fallback = "") {
  if (!nodeData || typeof nodeData !== "object") return fallback;
  const params =
    nodeData.generationParams && typeof nodeData.generationParams === "object"
      ? nodeData.generationParams
      : {};
  if (Object.prototype.hasOwnProperty.call(params, key)) {
    const fromParams = params[key];
    if (fromParams !== undefined && fromParams !== null && fromParams !== "") {
      return fromParams;
    }
  }
  const byModel =
    nodeData.generationParamsByModel &&
    typeof nodeData.generationParamsByModel === "object"
      ? nodeData.generationParamsByModel
      : {};
  const modelKeys = [
    String(nodeData.model || "").trim(),
    DEFAULT_IMAGE_NODE_MODEL,
  ].filter(Boolean);
  for (const modelKey of modelKeys) {
    const bucket = byModel[modelKey];
    if (
      bucket &&
      typeof bucket === "object" &&
      bucket[key] !== undefined &&
      bucket[key] !== null &&
      bucket[key] !== ""
    ) {
      return bucket[key];
    }
  }
  if (Object.prototype.hasOwnProperty.call(nodeData, key)) {
    const direct = nodeData[key];
    if (direct !== undefined && direct !== null && direct !== "") return direct;
  }
  return fallback;
}

function readComfyAspectRatio(nodeData = {}) {
  const candidates = [
    readGenerationParam(nodeData, "aspectRatio", ""),
    readGenerationParam(nodeData, "resolvedRatioLabel", ""),
    readGenerationParam(nodeData, "ratio", ""),
  ];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value && value !== "auto" && value !== "自适应") return value;
  }
  return IMAGE_RATIO_DEFAULT_LABEL;
}

export function resolveComfyGenerateDimensions(nodeData = {}) {
  const imageSize = String(readGenerationParam(nodeData, "imageSize", "2K") || "2K")
    .trim()
    .toUpperCase();
  const aspectRatio = readComfyAspectRatio(nodeData);
  return {
    ...calculateDimensionsByQualityAndRatio(imageSize, aspectRatio),
    imageSize,
    aspectRatio,
  };
}

export function stripComfyAutoDimensionParams(comfyParams = {}, config, workflow = null) {
  const next =
    comfyParams && typeof comfyParams === "object" && !Array.isArray(comfyParams)
      ? { ...comfyParams }
      : {};
  const { widthField, heightField } = findComfyDimensionFields(config, workflow);
  if (widthField?.id) delete next[widthField.id];
  if (heightField?.id) delete next[heightField.id];
  return next;
}

export function applyComfyQualityRatioToParams({
  config,
  comfyParams = {},
  nodeData = {},
  workflow = null,
  persistInComfyParams = false,
} = {}) {
  if (!persistInComfyParams) {
    return { ...comfyParams };
  }
  if (!shouldInjectComfyDimensions(config, workflow)) {
    return { ...comfyParams };
  }
  const { widthField, heightField } = findComfyDimensionFields(config, workflow);
  if (!widthField && !heightField) return { ...comfyParams };
  const dimensions = resolveComfyGenerateDimensions(nodeData);
  const next = { ...comfyParams };
  if (widthField?.id) next[widthField.id] = dimensions.width;
  if (heightField?.id) next[heightField.id] = dimensions.height;
  return next;
}

export function applyComfyDimensionsToWorkflowParams({
  config,
  workflow = null,
  nodeData = {},
  params = {},
} = {}) {
  if (!shouldInjectComfyDimensions(config, workflow)) return params;
  const { widthField, heightField } = findComfyDimensionFields(config, workflow);
  if (!widthField && !heightField) return params;
  const dimensions = resolveComfyGenerateDimensions(nodeData);
  const next = { ...params };
  if (widthField?.node && widthField?.input) {
    next[widthField.node] = { ...(next[widthField.node] || {}), [widthField.input]: dimensions.width };
  }
  if (heightField?.node && heightField?.input) {
    next[heightField.node] = { ...(next[heightField.node] || {}), [heightField.input]: dimensions.height };
  }
  return next;
}

function coerceFieldValue(field, rawValue) {
  const fieldType = String(field?.type || "text");
  if (fieldType === "boolean") return Boolean(rawValue);
  if (fieldType === "number" || fieldType === "slider") {
    const step = field?.step;
    const num = Number(rawValue);
    if (!Number.isFinite(num)) return rawValue;
    if (step && Number(step) < 1) return num;
    return Math.trunc(num);
  }
  if (fieldType === "dropdown" && typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (/^-?\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
    if (/^-?\d+\.\d+$/.test(trimmed)) return Number.parseFloat(trimmed);
  }
  return rawValue;
}

export function buildComfyParams({
  config,
  comfyParams = {},
  promptText = "",
  imageBindings = [],
  nodeData = null,
  workflow = null,
} = {}) {
  const params = {};
  const imageInputs = {};
  const fields = Array.isArray(config?.fields) ? config.fields : [];
  const dimensionTargets = findComfyDimensionFields(config, workflow);
  const autoDimensions = shouldInjectComfyDimensions(config, workflow);
  const skipDimensionField = (field) => {
    if (!autoDimensions || !field) return false;
    const role = inferComfyFieldBindRole(field);
    if (role === "width" || role === "height") return true;
    return (
      field.id === dimensionTargets.widthField?.id ||
      field.id === dimensionTargets.heightField?.id
    );
  };
  for (const field of fields) {
    if (!field?.node || !field?.input) continue;
    if (field.exposed !== true) continue;
    if (skipDimensionField(field)) continue;
    const kind = fieldKind(field);
    let value;
    if (kind === "prompt") {
      value = promptText;
    } else if (kind === "image") {
      const binding = (imageBindings || []).find(
        (item) => item?.fieldId === field.id || item?.node === field.node,
      );
      if (binding?.url) {
        imageInputs[field.id || `${field.node}:${field.input}`] = {
          node: field.node,
          input: field.input,
          url: binding.url,
        };
      }
      continue;
    } else if (Object.prototype.hasOwnProperty.call(comfyParams, field.id)) {
      value = comfyParams[field.id];
    } else if (field.default !== undefined && field.default !== null) {
      value = field.default;
    } else {
      continue;
    }
    if (value === undefined || value === null || value === "") continue;
    params[field.node] = params[field.node] || {};
    params[field.node][field.input] = coerceFieldValue(field, value);
  }
  if (nodeData) {
    return {
      params: applyComfyDimensionsToWorkflowParams({
        config,
        workflow,
        nodeData,
        params,
      }),
      imageInputs,
    };
  }
  return { params, imageInputs };
}

export function buildComfyPreviewValues(config, comfyParams = {}) {
  const values = {};
  for (const field of config?.fields || []) {
    if (!field?.id) continue;
    if (Object.prototype.hasOwnProperty.call(comfyParams, field.id)) {
      values[field.id] = comfyParams[field.id];
    } else if (field.default !== undefined) {
      values[field.id] = field.default;
    }
  }
  return values;
}

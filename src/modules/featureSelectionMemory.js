import { RH_VIDEO_BASIC_MODEL_ID } from "../manifests/index.js";
import {
  STORYBOARD_SCRIPT_TEXT_MODEL,
  STORYBOARD_SCRIPT_TEXT_PROVIDER,
} from "../core/storyboardScriptFactory.js";
export const FEATURE_SELECTIONS_STORAGE_KEY = "v2-feature-selections";
const NODE_MODULE_KEY_MAP = {
    "ai-text": "ai-text",
    "ai-image": "ai-image",
    "ai-video": "ai-video",
    "ai-audio": "ai-audio",
    "source-video": "source-video",
    "storyboard-script": "storyboard-script",
  },
  NODE_DEFAULT_SELECTIONS = {
    "ai-text": { model: "apimart/kimi-k2-instruct", provider: "apimart" },
    "ai-image": {
      model: "apimart/nano-banana-2",
      provider: "apimart",
      imageEngine: "default",
      comfyWorkflow: "",
      comfyParams: {},
      rhInstanceType: "default",
    },
    "ai-video": {
      model: RH_VIDEO_BASIC_MODEL_ID,
      provider: "runninghubwf",
      resolution: "720p",
      duration: 5,
      rhInstanceType: "default",
    },
    "ai-audio": {
      model: "indextts2_clone",
      provider: "runninghubwf",
      audioWorkflowKey: "indextts2_clone",
      rhInstanceType: "default",
    },
    "storyboard-script": {
      model: STORYBOARD_SCRIPT_TEXT_MODEL,
      provider: STORYBOARD_SCRIPT_TEXT_PROVIDER,
    },
  },
  NODE_MEMORY_SELECTION_FIELDS = {
    "ai-text": ["model", "provider"],
    "ai-image": [
      "model",
      "provider",
      "imageEngine",
      "comfyWorkflow",
      "comfyParams",
      "imageSize",
      "aspectRatio",
      "batchSize",
      "rhResolution",
      "rhInstanceType",
    ],
    "ai-video": [
      "model",
      "provider",
      "aspectRatio",
      "resolution",
      "duration",
      "mode",
      "dreaminaRouteMode",
      "rhInstanceType",
      "rhVideoFps",
      "rhVideoFrames",
      "rhVideoSeconds",
      "rhVideoResolution",
      "rhLtxMode",
    ],
    "ai-audio": ["model", "provider", "audioWorkflowKey", "rhInstanceType"],
    "source-video": [
      "rhInstanceType",
      "rhVideoFps",
      "rhVideoResolution",
      "rhMaskMode",
    ],
    "storyboard-script": ["model", "provider"],
  };
function isPlainObject(v0) {
  return !!v0 && typeof v0 === "object" && !Array["isArray"](v0);
}
function hasUsableValue(v1) {
  if (v1 === null || v1 === undefined) return false;
  if (typeof v1 === "string") return v1["trim"]()["length"] > 0;
  if (typeof v1 === "number") return Number["isFinite"](v1);
  if (typeof v1 === "boolean") return true;
  return false;
}
function toModuleKey(v2) {
  return NODE_MODULE_KEY_MAP[String(v2 || "")["trim"]()] || "";
}
function ensureModuleRecord(v3, v4) {
  return (!isPlainObject(v3[v4]) && (v3[v4] = {}), v3[v4]);
}
function hasOwnField(v5, v6) {
  return !!v5 && Object["prototype"]["hasOwnProperty"]["call"](v5, v6);
}
export function sanitizeFeatureSelectionsRecord(v7) {
  if (!isPlainObject(v7)) return {};
  const v8 = {};
  for (const [v9, v10] of Object["entries"](v7)) {
    if (!isPlainObject(v10)) continue;
    const v11 = {};
    for (const [v12, v13] of Object["entries"](v10)) {
      if (!hasUsableValue(v13)) continue;
      v11[String(v12)] = v13;
    }
    if (Object["keys"](v11)["length"] > 0) v8[String(v9)] = v11;
  }
  return v8;
}
export function applyFeatureSelectionsToNodeData(v14, v15) {
  if (!isPlainObject(v14)) return v14;
  const v16 = String(v14["type"] || "")["trim"](),
    v17 = toModuleKey(v16);
  if (!v17) return v14;
  const v18 = NODE_DEFAULT_SELECTIONS[v16] || {},
    v19 = NODE_MEMORY_SELECTION_FIELDS[v16] || [],
    v20 = isPlainObject(v15?.[v17]) ? v15[v17] : {},
    v21 = { ...v14 };
  for (const v22 of v19) {
    if (hasOwnField(v14, v22)) continue;
    if (!hasUsableValue(v20[v22])) continue;
    v21[v22] = v20[v22];
  }
  for (const [v23, v24] of Object["entries"](v18)) {
    if (hasOwnField(v14, v23)) continue;
    if (hasUsableValue(v21[v23])) continue;
    v21[v23] = v24;
  }
  const v25 = hasOwnField(v14, "model"),
    v26 = hasOwnField(v14, "audioWorkflowKey");
  if (v16 === "ai-audio" && v25 && !v26 && hasUsableValue(v21["model"])) {
    const v27 = String(v21["model"])["trim"]();
    (v27 === "indextts2_clone" || v27 === "voice_convert") &&
      (v21["audioWorkflowKey"] = v27);
  }
  v16 === "ai-audio" &&
    v26 &&
    !v25 &&
    hasUsableValue(v21["audioWorkflowKey"]) &&
    (v21["model"] = String(v21["audioWorkflowKey"])["trim"]());
  if (
    !hasUsableValue(v21["audioWorkflowKey"]) &&
    hasUsableValue(v21["model"])
  ) {
    const v28 = String(v21["model"])["trim"]();
    (v28 === "indextts2_clone" || v28 === "voice_convert") &&
      (v21["audioWorkflowKey"] = v28);
  }
  return (
    !hasUsableValue(v21["model"]) &&
      hasUsableValue(v21["audioWorkflowKey"]) &&
      (v21["model"] = String(v21["audioWorkflowKey"])["trim"]()),
    v21
  );
}
export function captureFeatureSelectionsFromNodePatch(v29, v30, v31) {
  const v32 = String(v29?.["type"] || "")["trim"](),
    v33 = toModuleKey(v32);
  if (!v33 || !isPlainObject(v30) || !isPlainObject(v31)) return false;
  const v34 = NODE_MEMORY_SELECTION_FIELDS[v32] || [];
  if (!v34["length"]) return false;
  const v35 = ensureModuleRecord(v31, v33);
  let v36 = false;
  for (const v37 of v34) {
    if (!Object["prototype"]["hasOwnProperty"]["call"](v30, v37)) continue;
    const v38 = v30[v37];
    if (!hasUsableValue(v38)) continue;
    if (v35[v37] === v38) continue;
    ((v35[v37] = v38), (v36 = true));
  }
  if (
    Object["prototype"]["hasOwnProperty"]["call"](v30, "model") &&
    !Object["prototype"]["hasOwnProperty"]["call"](v30, "audioWorkflowKey") &&
    v32 === "ai-audio" &&
    hasUsableValue(v30["model"])
  ) {
    const v39 = String(v30["model"])["trim"]();
    (v39 === "indextts2_clone" || v39 === "voice_convert") &&
      v35["audioWorkflowKey"] !== v39 &&
      ((v35["audioWorkflowKey"] = v39), (v36 = true));
  }
  return v36;
}

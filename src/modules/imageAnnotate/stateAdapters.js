import { IMAGE_MODELS } from "../../config/modelConfig.js";
import {
  buildImageFunctionModelCatalog,
  findImageFunctionProviderByModel,
  getDefaultImageFunctionModelState,
} from "../imageFunctionModelMenu.js";
export const ERASE_SELECTION_STATE_KEY = "eraseSelectionState";
const ERASE_SELECTION_TOOLS = new Set(["brush", "eraser"]),
  clampPersistedEraseBrushSize = (v0) =>
    Math["max"](1, Math["min"](120, Number(v0) || 40)),
  normalizePersistedEraseTool = (v1) => {
    const v2 = String(v1 || "")["trim"]();
    return ERASE_SELECTION_TOOLS["has"](v2) ? v2 : "brush";
  };
export const buildGenerationModelCatalog = (v3 = IMAGE_MODELS) => {
  return buildImageFunctionModelCatalog(v3);
};
export const findProviderKeyByModel = (v4, v5) => {
  const v6 = String(v5 || "")["trim"]();
  if (!v6) return null;
  for (const [v7, v8] of Object["entries"](v4 || {})) {
    const v9 = Array["isArray"](v8?.["models"]) ? v8["models"] : [];
    if (v9["some"]((v10) => v10?.["id"] === v6)) return v7;
  }
  return findImageFunctionProviderByModel(v4, v6);
};
export const buildSeedreamMigrationPatch = (v11) => {
  return (void v11, null);
};
export const normalizePersistedEraseCommand = (v12) => {
  if (!v12 || typeof v12 !== "object") return null;
  const v13 = String(v12["type"] || "")["trim"]();
  if (v13 === "brush" || v13 === "eraser") {
    const v14 = Array["isArray"](v12["points"]) ? v12["points"] : [],
      v15 = v14["map"]((v16) => ({
        x: Number(v16?.["x"]),
        y: Number(v16?.["y"]),
      }))["filter"](
        (v17) => Number["isFinite"](v17["x"]) && Number["isFinite"](v17["y"]),
      ),
      v18 = Number(v12["sizeWorld"]);
    if (!v15["length"] || !Number["isFinite"](v18)) return null;
    return { type: v13, sizeWorld: v18, points: v15 };
  }
  if (v13 === "rect") {
    const v19 = Number(v12["x1"]),
      v20 = Number(v12["y1"]),
      v21 = Number(v12["x2"]),
      v22 = Number(v12["y2"]),
      v23 = Number(v12["sizeWorld"]);
    if (
      !Number["isFinite"](v19) ||
      !Number["isFinite"](v20) ||
      !Number["isFinite"](v21) ||
      !Number["isFinite"](v22) ||
      !Number["isFinite"](v23)
    )
      return null;
    return {
      type: v13,
      color: String(v12["color"] || ""),
      sizeWorld: v23,
      x1: v19,
      y1: v20,
      x2: v21,
      y2: v22,
    };
  }
  if (v13 === "fill") {
    const v24 = Number(v12["x"]),
      v25 = Number(v12["y"]);
    if (!Number["isFinite"](v24) || !Number["isFinite"](v25)) return null;
    return { type: v13, x: v24, y: v25, color: String(v12["color"] || "") };
  }
  return null;
};
export const readPersistedEraseSelectionState = (v26) => {
  const v27 = v26?.[ERASE_SELECTION_STATE_KEY];
  if (!v27 || typeof v27 !== "object") return null;
  const v28 = Array["isArray"](v27["commands"])
      ? v27["commands"]
          ["map"]((v29) => normalizePersistedEraseCommand(v29))
          ["filter"](Boolean)
      : [],
    v30 = String(v27["tool"] || "")["trim"]();
  return {
    commands: v28,
    tool: normalizePersistedEraseTool(v30),
    brushSizePx: clampPersistedEraseBrushSize(v27["brushSizePx"]),
  };
};
export const buildPersistedEraseSelectionState = ({
  commands: v31,
  tool: v32,
  brushSizePx: v33,
} = {}) => ({
  commands: Array["isArray"](v31)
    ? v31["map"]((v34) => normalizePersistedEraseCommand(v34))["filter"](
        Boolean,
      )
    : [],
  tool: normalizePersistedEraseTool(v32),
  brushSizePx: clampPersistedEraseBrushSize(v33),
});
export const getDefaultGenerationModelState = (
  v35 = buildGenerationModelCatalog(),
) => {
  return getDefaultImageFunctionModelState(v35);
};

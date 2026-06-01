import { getGenerationRatioMediaSize } from "../../modules/generationRatioSource.js";
import {
  getTargetInputPolicy,
  isInputKindAllowed,
  resolveEffectiveInputKind,
} from "../../modules/modelInputPolicy.js";
function isAdaptiveRatioValue(v0) {
  const v1 = String(v0 || "")["trim"](),
    v2 = v1["toLowerCase"]();
  return !v1 || v1 === "自适应" || v2 === "auto" || v2 === "adaptive";
}
function getNodeAspectRatioValue(v3 = {}) {
  const v4 = v3?.["generationParams"];
  return v4 &&
    typeof v4 === "object" &&
    !Array["isArray"](v4) &&
    Object["prototype"]["hasOwnProperty"]["call"](v4, "aspectRatio")
    ? v4["aspectRatio"]
    : v3?.["aspectRatio"];
}
function buildAdaptiveImageInputSignature(v5 = [], v6 = {}, v7 = {}) {
  return v5["map"]((v8) => {
    const v9 = String(v8?.["refSlot"] || "")["toLowerCase"]();
    if (v9["includes"]("mask")) return "";
    const v10 = v6?.[v8?.["sourceId"]] || null,
      v11 = resolveEffectiveInputKind(v10, v8);
    if (v11 !== "image" || !isInputKindAllowed(v7, v11)) return "";
    const v12 = getGenerationRatioMediaSize(v10, v8, {
      includeNodeFrame: true,
    });
    return [
      v8?.["id"],
      v8?.["sourceId"],
      v8?.["refSlot"],
      v10?.["_bizRev"],
      v10?.["thumbId"],
      v12?.["width"],
      v12?.["height"],
      v10?.["localPath"],
      v10?.["imageUrl"],
      v10?.["sourceUrl"],
    ]
      ["map"]((v13) => v13 || "")
      ["join"](":");
  })
    ["filter"](Boolean)
    ["join"]("|");
}
export function syncAdaptiveImageInputRatio(
  v14,
  {
    store: v15,
    nodeId: v16,
    inEdges: v17,
    nodes: v18,
    targetNodeData: v19,
  } = {},
) {
  if (!v14 || !v15 || !v16) return;
  const v20 = getTargetInputPolicy(v19 || {}),
    v21 = buildAdaptiveImageInputSignature(v17 || [], v18 || {}, v20),
    v22 =
      (v14["_lastAdaptiveInputSig"] !== undefined
        ? v14["_lastAdaptiveInputSig"] !== v21
        : Boolean(v21)) &&
      isAdaptiveRatioValue(getNodeAspectRatioValue(v19) || "自适应");
  v14["_lastAdaptiveInputSig"] = v21;
  if (!v22 || typeof v14["runAdaptiveRatio"] !== "function") return;
  setTimeout(() => {
    if (v15["getState"]()["nodes"][v16]) v14["runAdaptiveRatio"]();
  }, 50);
}

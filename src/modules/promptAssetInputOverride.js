import appStore from "../core/stores/appStore.js";
import {
  buildFixedInputAssetSlotMapFromRefs,
  getExclusiveSlotsForFixedSlot,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from "./fixedInputAssetRefs.js";
import {
  getAssetInputRefsFromNodeData,
  isRunningHubWorkflowNode,
  removeAssetInputRefFromNodeData,
} from "./nodePromptShared.js";
import {
  getTargetInputPolicy,
  normalizeInputKind,
  resolveEffectiveInputKind,
  isRhPersonReplaceWorkflowModel,
} from "./modelInputPolicy.js";
import { getModelManifest } from "../manifests/index.js";
const RH_PERSON_REPLACE_ASSET_SLOT_ORDER = Object["freeze"]({
  image: Object["freeze"](["replaceTarget", "replacedImage"]),
});
function getAudioWorkflowKey(v0 = {}) {
  const v1 = String(v0?.["audioWorkflowKey"] || "")["trim"]();
  if (v1) return v1;
  const v2 = String(v0?.["model"] || "")["trim"]();
  return v2;
}
function getSlotsFromOrder(v3 = {}) {
  return Array["from"](
    new Set(
      Object["values"](v3)
        ["flat"]()
        ["map"]((v4) => String(v4 || ""))
        ["filter"](Boolean),
    ),
  );
}
function getFixedAssetSlotConfig(v5 = {}) {
  const v6 = String(v5?.["type"] || "")["trim"](),
    v7 = String(v5?.["model"] || "")["trim"]();
  if (v6 === "ai-video" || v6 === "ai-image") {
    const v8 = getFixedInputSlotConfigFromManifest(v5);
    if (v8)
      return {
        slotOrderByType: v8["slotOrderByType"],
        visibleSlots: v8["visibleSlots"],
        slotKindById: v8["slotKindById"],
        exclusiveGroups: v8["exclusiveGroups"],
      };
  }
  if (v6 === "ai-image" && isRhPersonReplaceWorkflowModel(v7))
    return {
      slotOrderByType: RH_PERSON_REPLACE_ASSET_SLOT_ORDER,
      visibleSlots: ["replaceTarget", "replacedImage"],
    };
  if (v6 === "ai-audio") {
    const v9 = getAudioWorkflowKey(v5),
      v10 = getFixedInputSlotConfigFromManifest({
        ...v5,
        audioWorkflowKey: v9,
        model: v9,
      });
    if (v10)
      return {
        slotOrderByType: v10["slotOrderByType"],
        visibleSlots: v10["visibleSlots"],
        slotKindById: v10["slotKindById"],
        exclusiveGroups: v10["exclusiveGroups"],
      };
    const v11 = getModelManifest(v9)?.["inputSlots"]?.["fixedSlots"],
      v12 =
        Array["isArray"](v11) && v11["length"]
          ? v11["map"]((v13) => String(v13?.["id"] || "")["trim"]())["filter"](
              Boolean,
            )
          : ["audioRef"];
    return { slotOrderByType: { audio: v12 }, visibleSlots: v12 };
  }
  return null;
}
function getIncomingEdges(v14 = "", v15 = null) {
  if (Array["isArray"](v15)) return v15;
  if (!v14) return [];
  return appStore["getIncomingEdges"]?.(v14) || [];
}
function assignOccupiedFixedSlots({
  incomingEdges: incomingEdges = [],
  nodes: nodes = {},
  slotOrderByType: slotOrderByType = {},
  visibleSlots: visibleSlots = null,
  slotKindById: slotKindById = {},
  exclusiveGroups: exclusiveGroups = [],
} = {}) {
  const v16 = new Set(
      Array["isArray"](visibleSlots) && visibleSlots["length"]
        ? visibleSlots["map"](String)
        : getSlotsFromOrder(slotOrderByType),
    ),
    v17 = {};
  return (
    (Array["isArray"](incomingEdges) ? incomingEdges : [])["forEach"]((v18) => {
      const v19 = resolveEffectiveInputKind(nodes?.[v18?.["sourceId"]], v18),
        { slot: v20 } = resolveFixedInputSlotForRef({
          fixedInputConfig: {
            slotOrderByType: slotOrderByType,
            visibleSlots: Array["from"](v16),
            slotKindById: slotKindById,
            exclusiveGroups: exclusiveGroups,
          },
          refSlot: v18?.["refSlot"],
          kind: v19,
          occupiedSlots: v17,
        });
      if (v20) v17[v20] = v18;
    }),
    new Set(Object["keys"](v17))
  );
}
function removeGenericOverflowAssetRefs({
  targetId: v21,
  targetNode: v22,
  sourceKind: v23,
  incomingEdges: v24,
  nodes: v25,
} = {}) {
  const v26 = getTargetInputPolicy(v22),
    v27 = Number(v26?.["maxByKind"]?.[v23]);
  if (!Number["isFinite"](v27) || v27 <= 0) return false;
  const v28 = (Array["isArray"](v24) ? v24 : [])["filter"](
    (v29) => resolveEffectiveInputKind(v25?.[v29?.["sourceId"]], v29) === v23,
  )["length"];
  let v30 =
      v28 +
      getAssetInputRefsFromNodeData(v22, { allowedTypes: [v23] })["length"] +
      1 -
      v27,
    v31 = false;
  while (v30 > 0) {
    const v32 = appStore["getState"]?.()?.["nodes"]?.[v21] || v22,
      v33 = getAssetInputRefsFromNodeData(v32, { allowedTypes: [v23] })[0];
    if (!v33) break;
    ((v31 = removeAssetInputRefFromNodeData(v21, v33) || v31), (v30 -= 1));
  }
  return v31;
}
export function removeCoveredAssetInputRefForConnection({
  targetId: targetId = "",
  targetNode: targetNode = null,
  sourceNode: sourceNode = null,
  sourceKind: sourceKind = "",
  refSlot: refSlot = "",
  incomingEdges: incomingEdges = null,
  nodes: nodes = null,
} = {}) {
  const v34 = String(targetId || targetNode?.["id"] || "")["trim"]();
  if (!v34) return false;
  const v35 = appStore["getState"]?.() || {},
    v36 = nodes || v35["nodes"] || {},
    v37 = v35["nodes"]?.[v34] || targetNode || {},
    v38 = getFixedAssetSlotConfig(v37);
  if (!isRunningHubWorkflowNode(v37) && !v38) return false;
  const v39 =
    resolveEffectiveInputKind(sourceNode) ||
    normalizeInputKind(sourceKind || "");
  if (v39 !== "image" && v39 !== "video" && v39 !== "audio") return false;
  const v40 = getIncomingEdges(v34, incomingEdges),
    v41 = String(refSlot || "")["trim"]();
  if (v38 && v41) {
    const v42 = v38["slotOrderByType"]?.[v39];
    if (Array["isArray"](v42) && v42["includes"](v41)) {
      const v43 = assignOccupiedFixedSlots({
          incomingEdges: v40,
          nodes: v36,
          slotOrderByType: v38["slotOrderByType"],
          visibleSlots: v38["visibleSlots"],
          slotKindById: v38["slotKindById"],
          exclusiveGroups: v38["exclusiveGroups"],
        }),
        v44 = getAssetInputRefsFromNodeData(v37, {
          allowedTypes: Object["keys"](v38["slotOrderByType"] || {}),
        }),
        v45 = buildFixedInputAssetSlotMapFromRefs(v44, {
          slotOrderByType: v38["slotOrderByType"],
          visibleSlots: v38["visibleSlots"],
          exclusiveGroups: v38["exclusiveGroups"],
          occupiedSlots: v43,
        }),
        v46 = getExclusiveSlotsForFixedSlot(v38["exclusiveGroups"], v41);
      for (const v47 of v46) {
        const v48 = v45[v47],
          v49 = v38["slotKindById"]?.[v47] || v48?.["type"] || "";
        if (v48 && v48["type"] === v49)
          return removeAssetInputRefFromNodeData(v34, v48);
      }
    }
  }
  return removeGenericOverflowAssetRefs({
    targetId: v34,
    targetNode: v37,
    sourceKind: v39,
    incomingEdges: v40,
    nodes: v36,
  });
}

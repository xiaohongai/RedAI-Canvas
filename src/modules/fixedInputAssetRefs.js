import { getAssetInputRefsFromPromptAndNode } from "./nodePromptShared.js";
import { getModelManifest, resolveModelExecution } from "../manifests/index.js";
const FIXED_ASSET_INPUT_KINDS = new Set(["image", "video", "audio"]);
export const RH_V54_ASSET_SLOT_ORDER = Object["freeze"]({
  video: Object["freeze"](["sourceVideo", "videoMask"]),
  image: Object["freeze"](["refImage", "firstFrame"]),
});
export const RH_BASIC_ASSET_SLOT_ORDER = Object["freeze"]({
  video: Object["freeze"](["sourceVideo"]),
  image: Object["freeze"](["refImage"]),
});
export const RH_LTX_ASSET_SLOT_ORDER = Object["freeze"]({
  image: Object["freeze"](["refImage"]),
  audio: Object["freeze"](["audio"]),
});
export const RH_LIPSYNC_ASSET_SLOT_ORDER = Object["freeze"]({
  video: Object["freeze"](["sourceVideo"]),
  image: Object["freeze"](["refImage"]),
  audio: Object["freeze"](["audio"]),
});
export const RH_LIPSYNC_VISUAL_EXCLUSIVE_GROUPS = Object["freeze"]([
  Object["freeze"]({
    id: "lipsyncVisualInput",
    slots: Object["freeze"](["sourceVideo", "refImage"]),
    min: 1,
    max: 1,
  }),
]);
export function getRhV54VisibleSlots({
  hideExtraSlots: hideExtraSlots = false,
} = {}) {
  return hideExtraSlots
    ? ["sourceVideo", "refImage"]
    : ["sourceVideo", "refImage", "firstFrame", "videoMask"];
}
function normalizeFixedSlotId(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (v1 === "maskVideo") return "videoMask";
  return v1;
}
export function normalizeFixedInputExclusiveGroups(v2 = [], v3 = null) {
  const v4 =
    Array["isArray"](v3) && v3["length"]
      ? new Set(v3["map"]((v5) => normalizeFixedSlotId(v5)))
      : null;
  return (Array["isArray"](v2) ? v2 : [])
    ["map"]((v6, v7) => {
      const v8 = Array["isArray"](v6?.["slots"])
          ? v6["slots"]
          : Array["isArray"](v6)
            ? v6
            : [],
        v9 = Array["from"](
          new Set(
            v8["map"]((v10) => normalizeFixedSlotId(v10))["filter"](
              (v11) => v11 && (!v4 || v4["has"](v11)),
            ),
          ),
        );
      if (v9["length"] < 2) return null;
      return {
        id:
          String(v6?.["id"] || "exclusive:" + v7)["trim"]() ||
          "exclusive:" + v7,
        slots: v9,
        min: Number["isFinite"](Number(v6?.["min"])) ? Number(v6["min"]) : 0,
        max: Number["isFinite"](Number(v6?.["max"])) ? Number(v6["max"]) : 1,
        required: v6?.["required"] === true,
      };
    })
    ["filter"](Boolean);
}
export function getExclusiveSlotsForFixedSlot(v12 = [], v13 = "") {
  const v14 = normalizeFixedSlotId(v13);
  if (!v14) return [];
  const v15 = normalizeFixedInputExclusiveGroups(v12),
    v16 = v15["find"]((v17) => v17["slots"]["includes"](v14));
  return v16 ? v16["slots"]["slice"]() : [v14];
}
function resolveManifestForFixedInputNode(v18 = {}) {
  const v19 = [v18?.["audioWorkflowKey"], v18?.["workflowKey"], v18?.["model"]]
    ["map"]((v20) => String(v20 || "")["trim"]())
    ["filter"](Boolean);
  for (const v21 of v19) {
    const v22 =
      getModelManifest(v21) ||
      resolveModelExecution(v21, { providerHint: v18?.["provider"] })?.[
        "modelManifest"
      ] ||
      resolveModelExecution(v21)?.["modelManifest"];
    if (v22) return v22;
  }
  return null;
}
function getNodeFieldValue(v23 = {}, v24 = "") {
  const v25 = String(v24 || "")["trim"]();
  if (!v25) return undefined;
  const v26 =
    v23?.["generationParams"] && typeof v23["generationParams"] === "object"
      ? v23["generationParams"]
      : {};
  if (Object["prototype"]["hasOwnProperty"]["call"](v26, v25)) return v26[v25];
  if (Object["prototype"]["hasOwnProperty"]["call"](v23 || {}, v25))
    return v23[v25];
  const v27 = v25["split"](".")["filter"](Boolean);
  if (v27["length"] <= 1) return undefined;
  let v28 = v23;
  for (const v29 of v27) {
    if (!v28 || typeof v28 !== "object") return undefined;
    v28 = v28[v29];
  }
  return v28;
}
function fixedSlotConditionMatches(v30, v31 = {}) {
  if (Array["isArray"](v30))
    return v30["some"]((v32) => fixedSlotConditionMatches(v32, v31));
  if (!v30 || typeof v30 !== "object") return false;
  if (Array["isArray"](v30["any"]))
    return v30["any"]["some"]((v33) => fixedSlotConditionMatches(v33, v31));
  if (Array["isArray"](v30["all"]))
    return v30["all"]["every"]((v34) => fixedSlotConditionMatches(v34, v31));
  const v35 = String(v30["field"] || "")["trim"]();
  if (!v35) return false;
  const v36 = getNodeFieldValue(v31, v35),
    v37 = Array["isArray"](v30["values"])
      ? v30["values"]
      : Object["prototype"]["hasOwnProperty"]["call"](v30, "value")
        ? [v30["value"]]
        : [];
  if (v37["length"] === 0) return Boolean(v36);
  return v37["some"](
    (v38) => v36 === v38 || String(v36 ?? "") === String(v38 ?? ""),
  );
}
function shouldHideFixedSlotForNode(
  v39,
  v40 = {},
  v41 = null,
  { useRhVisibilityFlags: useRhVisibilityFlags = false } = {},
) {
  if (useRhVisibilityFlags && v40?.["rhSpecialMode"] === "cameraMove")
    return v39 === "firstFrame" || v39 === "videoMask";
  if (useRhVisibilityFlags && v40?.["rhSubtractSubject"] === true)
    return v39 === "firstFrame" || v39 === "videoMask";
  if (v41?.["showWhen"] && !fixedSlotConditionMatches(v41["showWhen"], v40))
    return true;
  if (v41?.["hideWhen"] && fixedSlotConditionMatches(v41["hideWhen"], v40))
    return true;
  return false;
}
export function getFixedInputSlotConfigFromManifest(
  v42 = {},
  { manifest: manifest = null } = {},
) {
  const v43 = manifest || resolveManifestForFixedInputNode(v42),
    v44 = v43?.["inputSlots"]?.["fixedSlots"];
  if (!Array["isArray"](v44) || v44["length"] === 0) return null;
  const v45 = {},
    v46 = {},
    v47 = {},
    v48 = [];
  let v49 = false;
  const v50 = new Set(
      v44["map"]((v51) => normalizeFixedSlotId(v51?.["id"]))["filter"](Boolean),
    ),
    v52 =
      v50["has"]("sourceVideo") &&
      v50["has"]("refImage") &&
      v50["has"]("videoMask");
  v44["forEach"]((v53, v54) => {
    const v55 = normalizeFixedSlotId(v53?.["id"]),
      v56 = String(v53?.["kind"] || "")["trim"]();
    if (!v55 || !FIXED_ASSET_INPUT_KINDS["has"](v56)) return;
    if (v53?.["showWhen"] || v53?.["hideWhen"]) v49 = true;
    if (!Array["isArray"](v45[v56])) v45[v56] = [];
    (v45[v56]["push"](v55), (v46[v55] = v56));
    const v57 = Number(v53?.["displayOrder"]);
    ((v47[v55] = {
      ...v53,
      id: v55,
      kind: v56,
      displayOrder: Number["isFinite"](v57) ? v57 : v54,
    }),
      !shouldHideFixedSlotForNode(v55, v42, v53, {
        useRhVisibilityFlags: v52,
      }) && v48["push"](v55));
  });
  if (v48["length"] === 0) return null;
  const v58 = (v59, v60) =>
    Number(v47[v59]?.["displayOrder"] ?? 0) -
    Number(v47[v60]?.["displayOrder"] ?? 0);
  (v48["sort"](v58),
    Object["keys"](v45)["forEach"]((v61) => {
      v45[v61]["sort"](v58);
    }));
  const v62 = normalizeFixedInputExclusiveGroups(
    v43?.["inputSlots"]?.["exclusiveGroups"],
    v48,
  );
  return {
    manifest: v43,
    fixedSlots: Object["values"](v47),
    slotById: v47,
    slotKindById: v46,
    slotOrderByType: v45,
    visibleSlots: v48,
    visibilityLayoutKey: v49 ? v48["join"]("|") : "",
    exclusiveGroups: v62,
  };
}
function getSlotsFromOrder(v63 = {}) {
  return Array["from"](
    new Set(
      Object["values"](v63)
        ["flat"]()
        ["map"]((v64) => String(v64 || ""))
        ["filter"](Boolean),
    ),
  );
}
function normalizeOccupiedSlots(v65 = null) {
  const v66 = (v67 = []) =>
    new Set(v67["map"]((v68) => normalizeFixedSlotId(v68))["filter"](Boolean));
  if (v65 instanceof Set) return v66(Array["from"](v65));
  if (Array["isArray"](v65)) return v66(v65);
  if (v65 && typeof v65 === "object")
    return v66(
      Object["entries"](v65)
        ["filter"](([, v69]) => !!v69)
        ["map"](([v70]) => v70),
    );
  return new Set();
}
export function createFixedSlotOccupancyTracker({
  exclusiveGroups: exclusiveGroups = [],
  occupiedSlots: occupiedSlots = null,
} = {}) {
  const v71 = new Set(normalizeOccupiedSlots(occupiedSlots)),
    v72 = normalizeFixedInputExclusiveGroups(exclusiveGroups),
    v73 = new Map();
  v72["forEach"]((v74) => {
    v74["slots"]["forEach"]((v75) => {
      v73["set"](v75, v74);
    });
  });
  const v76 = new Set();
  return (
    v71["forEach"]((v77) => {
      const v78 = v73["get"](v77);
      if (v78) v76["add"](v78["id"]);
    }),
    {
      isSlotAvailable(v79) {
        const v80 = normalizeFixedSlotId(v79);
        if (!v80 || v71["has"](v80)) return false;
        const v81 = v73["get"](v80);
        return !v81 || !v76["has"](v81["id"]);
      },
      occupySlot(v82) {
        const v83 = normalizeFixedSlotId(v82);
        if (!v83) return;
        v71["add"](v83);
        const v84 = v73["get"](v83);
        if (v84) v76["add"](v84["id"]);
      },
      getExclusiveSlots(v85) {
        const v86 = normalizeFixedSlotId(v85),
          v87 = v73["get"](v86);
        return v87 ? v87["slots"]["slice"]() : v86 ? [v86] : [];
      },
    }
  );
}
function getFixedInputSlotKind(v88 = {}, v89 = "") {
  const v90 = normalizeFixedSlotId(v89);
  if (!v90) return "";
  const v91 = String(v88?.["slotKindById"]?.[v90] || "")["trim"]();
  if (v91) return v91;
  const v92 =
    v88?.["slotOrderByType"] && typeof v88["slotOrderByType"] === "object"
      ? v88["slotOrderByType"]
      : {};
  for (const [v93, v94] of Object["entries"](v92)) {
    if ((Array["isArray"](v94) ? v94 : [])["includes"](v90))
      return String(v93 || "")["trim"]();
  }
  return "";
}
function isKnownFixedInputSlot(v95 = {}, v96 = "") {
  const v97 = normalizeFixedSlotId(v96);
  if (!v97) return false;
  if (v95?.["slotById"]?.[v97]) return true;
  return !!getFixedInputSlotKind(v95, v97);
}
export function resolveFixedInputSlotForRef({
  fixedInputConfig: fixedInputConfig = null,
  refSlot: refSlot = "",
  kind: kind = "",
  occupiedSlots: occupiedSlots = null,
} = {}) {
  const v98 = fixedInputConfig || {},
    v99 = String(kind || "")["trim"]();
  if (!v99 || v99 === "text") return { slot: "", reason: "unsupported" };
  const v100 = new Set(
    Array["isArray"](v98["visibleSlots"]) && v98["visibleSlots"]["length"]
      ? v98["visibleSlots"]
          ["map"]((v101) => normalizeFixedSlotId(v101))
          ["filter"](Boolean)
      : getSlotsFromOrder(v98["slotOrderByType"])["map"]((v102) =>
          normalizeFixedSlotId(v102),
        ),
  );
  if (v100["size"] === 0) return { slot: "", reason: "noVisibleSlots" };
  const v103 = createFixedSlotOccupancyTracker({
      exclusiveGroups: v98["exclusiveGroups"],
      occupiedSlots: occupiedSlots,
    }),
    v104 = normalizeFixedSlotId(refSlot);
  if (v104 && v100["has"](v104)) {
    const v105 = getFixedInputSlotKind(v98, v104);
    if (v105 !== v99)
      return { slot: "", reason: "kindMismatch", explicitSlot: v104 };
    if (!v103["isSlotAvailable"](v104))
      return { slot: "", reason: "occupied", explicitSlot: v104 };
    return { slot: v104, reason: "explicit", explicitSlot: v104 };
  }
  if (v104 && isKnownFixedInputSlot(v98, v104))
    return {
      slot: "",
      reason: "hidden",
      explicitSlot: v104,
      hidden: true,
      knownSlot: true,
    };
  const v106 = Array["isArray"](v98["slotOrderByType"]?.[v99])
      ? v98["slotOrderByType"][v99]["map"]((v107) => normalizeFixedSlotId(v107))
      : [],
    v108 =
      v106["find"](
        (v109) => v100["has"](v109) && v103["isSlotAvailable"](v109),
      ) || "";
  return {
    slot: v108,
    reason: v108 ? (v104 ? "stale" : "auto") : "overflow",
    explicitSlot: v104,
  };
}
export function buildFixedInputAssetSlotMapFromRefs(
  v110 = [],
  {
    slotOrderByType: slotOrderByType = {},
    visibleSlots: visibleSlots = null,
    occupiedSlots: occupiedSlots = null,
    exclusiveGroups: exclusiveGroups = [],
  } = {},
) {
  const v111 = new Set(
      Array["isArray"](visibleSlots) && visibleSlots["length"]
        ? visibleSlots["map"](String)
        : getSlotsFromOrder(slotOrderByType),
    ),
    v112 = normalizeOccupiedSlots(occupiedSlots),
    v113 = {};
  return (
    v111["forEach"]((v114) => {
      v113[v114] = null;
    }),
    (Array["isArray"](v110) ? v110 : [])["forEach"]((v115) => {
      const v116 = String(v115?.["type"] || "")["trim"](),
        v117 = new Set(v112);
      Object["entries"](v113)["forEach"](([v118, v119]) => {
        if (v119) v117["add"](v118);
      });
      const v120 = resolveFixedInputSlotForRef({
          fixedInputConfig: {
            slotOrderByType: slotOrderByType,
            visibleSlots: Array["from"](v111),
            exclusiveGroups: exclusiveGroups,
          },
          refSlot: v115?.["refSlot"],
          kind: v116,
          occupiedSlots: v117,
        }),
        v121 = v120["slot"];
      if (!v121) return;
      v113[v121] = { ...v115, refSlot: v121, virtual: true };
    }),
    v113
  );
}
export function buildFixedInputAssetSlotMap(
  v122 = null,
  {
    slotOrderByType: slotOrderByType = {},
    visibleSlots: visibleSlots = null,
    occupiedSlots: occupiedSlots = null,
    exclusiveGroups: exclusiveGroups = [],
    nodeData: nodeData = null,
  } = {},
) {
  const v123 = getAssetInputRefsFromPromptAndNode(v122, {
    nodeData: nodeData,
    allowedTypes: Object["keys"](slotOrderByType),
  });
  return buildFixedInputAssetSlotMapFromRefs(v123, {
    slotOrderByType: slotOrderByType,
    visibleSlots: visibleSlots,
    occupiedSlots: occupiedSlots,
    exclusiveGroups: exclusiveGroups,
  });
}
export function buildRhV54AssetSlotMapFromRefs(
  v124 = [],
  {
    hideExtraSlots: hideExtraSlots = false,
    occupiedSlots: occupiedSlots = null,
  } = {},
) {
  return buildFixedInputAssetSlotMapFromRefs(v124, {
    slotOrderByType: RH_V54_ASSET_SLOT_ORDER,
    visibleSlots: getRhV54VisibleSlots({ hideExtraSlots: hideExtraSlots }),
    occupiedSlots: occupiedSlots,
  });
}
export function buildRhV54AssetSlotMap(
  v125 = null,
  {
    hideExtraSlots: hideExtraSlots = false,
    occupiedSlots: occupiedSlots = null,
    nodeData: nodeData = null,
  } = {},
) {
  return buildFixedInputAssetSlotMap(v125, {
    slotOrderByType: RH_V54_ASSET_SLOT_ORDER,
    visibleSlots: getRhV54VisibleSlots({ hideExtraSlots: hideExtraSlots }),
    occupiedSlots: occupiedSlots,
    nodeData: nodeData,
  });
}
export function buildRhBasicAssetSlotMap(v126 = null, v127 = {}) {
  return buildFixedInputAssetSlotMap(v126, {
    slotOrderByType: RH_BASIC_ASSET_SLOT_ORDER,
    visibleSlots: ["sourceVideo", "refImage"],
    occupiedSlots: v127["occupiedSlots"],
    nodeData: v127["nodeData"],
  });
}
export function buildRhLtxAssetSlotMap(v128 = null, v129 = {}) {
  return buildFixedInputAssetSlotMap(v128, {
    slotOrderByType: RH_LTX_ASSET_SLOT_ORDER,
    visibleSlots: ["refImage", "audio"],
    occupiedSlots: v129["occupiedSlots"],
    nodeData: v129["nodeData"],
  });
}
export function buildRhLipSyncAssetSlotMap(v130 = null, v131 = {}) {
  return buildFixedInputAssetSlotMap(v130, {
    slotOrderByType: RH_LIPSYNC_ASSET_SLOT_ORDER,
    visibleSlots: ["sourceVideo", "refImage", "audio"],
    occupiedSlots: v131["occupiedSlots"],
    exclusiveGroups: RH_LIPSYNC_VISUAL_EXCLUSIVE_GROUPS,
    nodeData: v131["nodeData"],
  });
}

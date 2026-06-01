import { isSameStringOrder } from "../utils/arrayOrder.js";
import { resolveGroupOutputSourceOrder } from "./groupDynamicOutput.js";
const THUMB_CONTAINER_SELECTOR = ".ref-thumb-container",
  THUMB_ITEM_SELECTOR = ".ref-thumb-wrap",
  orderDragStateByContainer = new WeakMap();
function matchesSelector(v0, v1) {
  return typeof v0?.["matches"] === "function" && v0["matches"](v1);
}
function resolveThumbContainer(v2) {
  if (!v2) return null;
  if (matchesSelector(v2, THUMB_CONTAINER_SELECTOR)) return v2;
  return v2["querySelector"]?.(THUMB_CONTAINER_SELECTOR) || null;
}
function queryThumbItems(v3) {
  return Array["from"](v3?.["querySelectorAll"]?.(THUMB_ITEM_SELECTOR) || []);
}
function getDataset(v4) {
  return v4?.["dataset"] || {};
}
function isAssetRef(v5) {
  const v6 = getDataset(v5);
  return (
    v6["refOrigin"] === "asset" ||
    !!v6["assetId"] ||
    String(v6["refKey"] || "")["startsWith"]("asset:")
  );
}
function getEdgeId(v7) {
  return String(getDataset(v7)["edgeId"] || "")["trim"]();
}
function isNodeEdgeThumb(v8) {
  return !!getEdgeId(v8) && !isAssetRef(v8);
}
function isGroupOutputEdge(v9) {
  return !!(v9?.["isGroupOutput"] && v9?.["groupOutputEdgeId"]);
}
function isReadOnlyDerivedGroupEdge(v10) {
  if (!v10) return false;
  if (isGroupOutputEdge(v10)) return false;
  if (v10["isGroupShared"]) return false;
  return !!v10["effectiveTargetId"] && !isGroupOutputEdge(v10);
}
function findIncomingEdge(v11, v12, v13) {
  const v14 = String(v13 || "")["trim"]();
  if (!v14 || typeof v11?.["getIncomingEdges"] !== "function") return null;
  return (
    (v11["getIncomingEdges"](v12) || [])["find"](
      (v15) => String(v15?.["id"] || "")["trim"]() === v14,
    ) || null
  );
}
function isMutableNodeEdgeThumb(v16, v17, v18) {
  if (!isNodeEdgeThumb(v16)) return false;
  const v19 = findIncomingEdge(v17, v18, getEdgeId(v16));
  return !isReadOnlyDerivedGroupEdge(v19);
}
function getFixedSlotEdgeContext(v20, v21, v22) {
  if (!v21) return null;
  const v23 = v20?.["getState"]?.() || {},
    v24 = String(v22 || "");
  if (isGroupOutputEdge(v21)) {
    if (String(v21["effectiveTargetId"] || "") !== v24) return null;
    const v25 = String(v21["groupOutputEdgeId"] || "")["trim"](),
      v26 = v23["edges"]?.[v25] || null;
    if (!v26?.["id"]) return null;
    return {
      kind: "groupOutput",
      incomingEdge: v21,
      rawEdge: v26,
      dragEdgeId: String(v21["id"] || "")["trim"](),
    };
  }
  const v27 = v23["edges"]?.[String(v21["id"] || "")["trim"]()] || null;
  if (!v27?.["id"]) return null;
  if (String(v27["targetId"] || "") === v24)
    return {
      kind: "edge",
      incomingEdge: v21,
      rawEdge: v27,
      dragEdgeId: v27["id"],
    };
  if (v21["isGroupShared"] && String(v21["effectiveTargetId"] || "") === v24)
    return {
      kind: "edge",
      incomingEdge: v21,
      rawEdge: v27,
      dragEdgeId: v27["id"],
    };
  return null;
}
function resolveMutableFixedSlotThumb(v28, v29, v30) {
  if (!isMutableNodeEdgeThumb(v28, v29, v30)) return null;
  const v31 = findIncomingEdge(v29, v30, getEdgeId(v28));
  return getFixedSlotEdgeContext(v29, v31, v30);
}
function resolveMutableFixedSlotEdgeById(v32, v33, v34) {
  const v35 = findIncomingEdge(v32, v33, v34);
  return getFixedSlotEdgeContext(v32, v35, v33);
}
function isFixedSlotThumb(v36, v37 = null) {
  const v38 = getDataset(v36);
  return !!(
    String(v38["slot"] || "")["trim"]() ||
    String(v38["refSlot"] || "")["trim"]() ||
    String(v37?.["refSlot"] || "")["trim"]()
  );
}
function isOrderableNodeEdgeThumb(v39, v40, v41) {
  if (!isNodeEdgeThumb(v39)) return false;
  const v42 = findIncomingEdge(v40, v41, getEdgeId(v39));
  if (isReadOnlyDerivedGroupEdge(v42)) return false;
  return !isFixedSlotThumb(v39, v42);
}
function setDragData(v43, v44) {
  if (!v43?.["dataTransfer"]) return;
  ((v43["dataTransfer"]["effectAllowed"] = "move"),
    v43["dataTransfer"]["setData"]?.("text/plain", v44));
}
function setDropMove(v45) {
  if (!v45?.["dataTransfer"]) return;
  v45["dataTransfer"]["dropEffect"] = "move";
}
function setOwnerDragging(v46, v47) {
  if (!v46) return;
  v46["_isDraggingSorting"] = v47;
}
function getOrderDragState(v48) {
  if (!v48 || typeof v48 !== "object") return { dragEl: null };
  let v49 = orderDragStateByContainer["get"](v48);
  return (
    !v49 &&
      ((v49 = { dragEl: null }), orderDragStateByContainer["set"](v48, v49)),
    v49
  );
}
function animateReorder(v50, v51) {
  const v52 = queryThumbItems(v50),
    v53 = v52["map"]((v54) => v54["getBoundingClientRect"]?.() || {});
  v51();
  const v55 = v52["map"]((v56) => v56["getBoundingClientRect"]?.() || {});
  v52["forEach"]((v57, v58) => {
    const v59 =
        Number(v53[v58]?.["left"] || 0) - Number(v55[v58]?.["left"] || 0),
      v60 = Number(v53[v58]?.["top"] || 0) - Number(v55[v58]?.["top"] || 0);
    if (v59 === 0 && v60 === 0) return;
    ((v57["style"]["transform"] = "translate(" + v59 + "px, " + v60 + "px)"),
      (v57["style"]["transition"] = "none"));
    const v61 =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (v62) => setTimeout(v62, 0);
    v61(() => {
      ((v57["style"]["transform"] = ""),
        (v57["style"]["transition"] =
          "transform\x200.2s\x20cubic-bezier(0.2,\x200.8,\x200.2,\x201)"));
    });
  });
}
function getTargetIncomingEdges(v63, v64) {
  return (v63?.["getIncomingEdges"]?.(v64) || [])["filter"]((v65) => {
    if (!v65 || !String(v65["id"] || "")["trim"]()) return false;
    const v66 = String(v64 || "");
    if (String(v65["targetId"] || "") === v66) return true;
    return (
      (v65["isGroupShared"] &&
        String(v65["effectiveTargetId"] || "") === v66) ||
      (isGroupOutputEdge(v65) && String(v65["effectiveTargetId"] || "") === v66)
    );
  });
}
function resolveEdge(v67, v68, v69) {
  const v70 = v67?.["getState"]?.() || {};
  return v70["edges"]?.[v68] || v69["find"]((v71) => v71["id"] === v68) || null;
}
function uniqueSourceIds(v72) {
  const v73 = new Set(),
    v74 = [];
  return (
    v72["forEach"]((v75) => {
      const v76 = String(v75?.["sourceId"] || "")["trim"]();
      if (!v76 || v73["has"](v76)) return;
      (v73["add"](v76), v74["push"](v76));
    }),
    v74
  );
}
function mergeVisibleSourceOrder(v77, v78) {
  const v79 = [...v78],
    v80 = new Set(v79);
  return (
    (Array["isArray"](v77) ? v77 : [])["forEach"]((v81) => {
      const v82 = String(v81 || "")["trim"]();
      if (!v82 || v80["has"](v82)) return;
      (v80["add"](v82), v79["push"](v82));
    }),
    v79
  );
}
function getGroupOutputOrderTargetId(v83) {
  const v84 = new Set();
  for (const v85 of v83 || []) {
    if (!v85?.["isGroupShared"]) return "";
    const v86 = String(v85["effectiveTargetId"] || "")["trim"]();
    if (!v86) return "";
    v84["add"](v86);
  }
  return v84["size"] === 1 ? Array["from"](v84)[0] : "";
}
function applyGroupOutputSourceOrder(v87, v88, v89) {
  if (!v88) return { ...v87, groupOutputSourceOrder: v89 };
  const v90 = v87["groupOutputSourceOrderByTarget"],
    v91 =
      v90 && typeof v90 === "object" && !Array["isArray"](v90)
        ? { ...v90 }
        : {};
  return ((v91[v88] = v89), { ...v87, groupOutputSourceOrderByTarget: v91 });
}
function collectGroupOutputEdgeUpdates(v92, v93) {
  const v94 = v92?.["getState"]?.() || {},
    v95 = new Map();
  v93["forEach"]((v96) => {
    if (!isGroupOutputEdge(v96)) return;
    const v97 = String(v96["groupOutputEdgeId"] || "")["trim"]();
    if (!v97) return;
    if (!v95["has"](v97)) v95["set"](v97, []);
    v95["get"](v97)["push"](v96);
  });
  const v98 = [];
  return (
    v95["forEach"]((v99, v100) => {
      const v101 = v94["edges"]?.[v100];
      if (!v101?.["id"]) return;
      const v102 = uniqueSourceIds(v99);
      if (v102["length"] <= 1) return;
      const v103 = getGroupOutputOrderTargetId(v99),
        v104 = resolveGroupOutputSourceOrder(v101, v103),
        v105 = mergeVisibleSourceOrder(v104, v102);
      if (isSameStringOrder(v105, v104 || [])) return;
      v98["push"]({
        removeId: v100,
        edge: applyGroupOutputSourceOrder(v101, v103, v105),
      });
    }),
    v98
  );
}
function collectOrderedEdgeIds(v106, v107, v108) {
  return queryThumbItems(v106)
    ["filter"]((v109) => isOrderableNodeEdgeThumb(v109, v107, v108))
    ["map"]((v110) => getEdgeId(v110))
    ["filter"](Boolean);
}
function commitOrder(v111, v112, v113) {
  const v114 = collectOrderedEdgeIds(v111, v112, v113);
  if (v114["length"] === 0) return;
  const v115 = new Set(v114),
    v116 = getTargetIncomingEdges(v112, v113)["filter"]((v117) =>
      v115["has"](v117["id"]),
    ),
    v118 = v116["map"]((v119) => v119["id"]);
  if (v118["length"] !== v114["length"]) return;
  if (isSameStringOrder(v114, v118)) return;
  const v120 = v114["map"]((v121) => resolveEdge(v112, v121, v116))["filter"](
    Boolean,
  );
  if (v120["length"] !== v118["length"]) return;
  const v122 = collectGroupOutputEdgeUpdates(v112, v120),
    v123 = v120["filter"]((v124) => !isGroupOutputEdge(v124)),
    v125 = v116["filter"]((v126) => !isGroupOutputEdge(v126))["map"](
      (v127) => v127["id"],
    ),
    v128 = v123["map"]((v129) => v129["id"]),
    v130 = [],
    v131 = [];
  v125["length"] > 1 &&
    !isSameStringOrder(v128, v125) &&
    (v130["push"](...v125), v131["push"](...v123));
  v122["forEach"]((v132) => {
    (v130["push"](v132["removeId"]), v131["push"](v132["edge"]));
  });
  if (v130["length"] === 0) return;
  v112["updateEdgesBatch"]?.(v130, v131);
}
export function bindRefThumbOrderDrag({
  owner: v133,
  container: v134,
  store: v135,
  nodeId: v136,
} = {}) {
  const v137 = resolveThumbContainer(v134);
  if (!v137 || !v135 || !v136) return;
  const v138 = getOrderDragState(v137);
  (queryThumbItems(v137)["forEach"]((v139) => {
    if (!isOrderableNodeEdgeThumb(v139, v135, v136)) {
      const v140 = findIncomingEdge(v135, v136, getEdgeId(v139));
      isNodeEdgeThumb(v139) &&
        isReadOnlyDerivedGroupEdge(v140) &&
        v139["setAttribute"]?.("draggable", "false");
      return;
    }
    if (v139["dataset"]["dragBound"] === "1") return;
    ((v139["dataset"]["dragBound"] = "1"),
      v139["setAttribute"]?.("draggable", "true"),
      v139["addEventListener"]("dragstart", (v141) => {
        if (!isOrderableNodeEdgeThumb(v139, v135, v136)) return;
        ((v138["dragEl"] = v139),
          setOwnerDragging(v133, true),
          setDragData(v141, getEdgeId(v139) || "dragging"),
          v139["classList"]?.["add"]("dragging-capture"),
          setTimeout(() => {
            (v139["classList"]?.["add"]("dragging"),
              (v139["style"]["opacity"] = "0.1"));
          }, 0));
      }),
      v139["addEventListener"]("dragend", () => {
        if (v138["dragEl"]) v138["dragEl"]["style"]["opacity"] = "1";
        (v139["classList"]?.["remove"]("dragging"),
          v139["classList"]?.["remove"]("dragging-capture"));
        try {
          commitOrder(v137, v135, v136);
        } finally {
          ((v138["dragEl"] = null), setOwnerDragging(v133, false));
        }
      }),
      v139["addEventListener"]("dragover", (v142) => {
        const v143 = v138["dragEl"];
        if (!v143 || v143 === v139) return;
        if (
          !isOrderableNodeEdgeThumb(v143, v135, v136) ||
          !isOrderableNodeEdgeThumb(v139, v135, v136)
        )
          return;
        (v142["preventDefault"]?.(), setDropMove(v142));
        const v144 = v139["getBoundingClientRect"]?.() || {},
          v145 = Number(v144["left"] || 0) + Number(v144["width"] || 0) / 2;
        animateReorder(v137, () => {
          Number(v142["clientX"] || 0) < v145
            ? v139["parentNode"]?.["insertBefore"](v143, v139)
            : v139["parentNode"]?.["insertBefore"](v143, v139["nextSibling"]);
        });
      }));
  }),
    v137["dataset"]["dragContainerBound"] !== "1" &&
      ((v137["dataset"]["dragContainerBound"] = "1"),
      v137["addEventListener"]("dragover", (v146) =>
        v146["preventDefault"]?.(),
      ),
      v137["addEventListener"]("drop", (v147) => v147["preventDefault"]?.())));
}
function defaultGetKindByNode(v148) {
  const v149 = String(v148?.["type"] || "");
  if (v149["includes"]("text")) return "text";
  if (v149["includes"]("video")) return "video";
  if (v149["includes"]("audio")) return "audio";
  return v149 ? "image" : "";
}
function clearDropState(v150) {
  queryThumbItems(v150)
    ["filter"]((v151) => v151["classList"]?.["contains"]?.("is-drop-allow"))
    ["forEach"]((v152) => v152["classList"]?.["remove"]("is-drop-allow"));
}
function getSlot(v153) {
  return String(getDataset(v153)["slot"] || "")["trim"]();
}
function getSlotKind(v154, v155, v156, v157) {
  const v158 = getSlot(v154),
    v159 = String(getDataset(v154)["kind"] || "")["trim"]();
  if (v159) return v159;
  const v160 = String(getDataset(v154)["sourceId"] || "")["trim"](),
    v161 = v160 ? v157?.["getState"]?.()?.["nodes"]?.[v160] : null;
  return v156(v161) || String(v155?.[v158] || "")["trim"]();
}
function findSlotTarget(v162) {
  return v162?.["target"]?.["closest"]?.("[data-slot]") || null;
}
function resolveFixedSlotTargetEdgeContext(v163, v164, v165, v166) {
  const v167 = getEdgeId(v163);
  if (v167) return resolveMutableFixedSlotEdgeById(v164, v165, v167);
  return (
    getTargetIncomingEdges(v164, v165)
      ["map"]((v168) => getFixedSlotEdgeContext(v164, v168, v165))
      ["filter"](Boolean)
      ["find"](
        ({ incomingEdge: v169, rawEdge: v170 }) =>
          v170 &&
          String(v169?.["refSlot"] || "")["trim"]() === String(v166 || ""),
      ) || null
  );
}
function getFixedSlotAcceptMap(v171, v172) {
  return v171?.["_refThumbFixedSlotAcceptMap"] || v172 || {};
}
function getContextSourceKind(v173, v174, v175) {
  const v176 = String(v173?.["incomingEdge"]?.["sourceId"] || "")["trim"]();
  if (!v176) return "";
  return v175(v174?.["nodes"]?.[v176] || null);
}
function collectFixedSlotGroupOutputUpdates({
  store: v177,
  nodeId: v178,
  slotOrder: v179,
  contextA: v180,
  contextB: v181,
  fromSlot: v182,
  toSlot: v183,
}) {
  if (v180?.["kind"] !== "groupOutput" && v181?.["kind"] !== "groupOutput")
    return [];
  const v184 = new Map();
  getTargetIncomingEdges(v177, v178)
    ["filter"](isGroupOutputEdge)
    ["forEach"]((v185) => {
      const v186 = String(v185?.["refSlot"] || "")["trim"]();
      if (v186) v184["set"](v186, v185);
    });
  v180?.["kind"] === "groupOutput" && v184["delete"](v182);
  v181?.["kind"] === "groupOutput" && v184["delete"](v183);
  v180?.["kind"] === "groupOutput" && v184["set"](v183, v180["incomingEdge"]);
  v181?.["kind"] === "groupOutput" && v184["set"](v182, v181["incomingEdge"]);
  const v187 = v179["map"]((v188) => v184["get"](v188))["filter"](Boolean);
  return collectGroupOutputEdgeUpdates(v177, v187);
}
export function bindRefThumbFixedSlotDrag({
  owner: v189,
  container: v190,
  store: v191,
  nodeId: v192,
  acceptMap: v193,
  getKindByNode: getKindByNode = defaultGetKindByNode,
} = {}) {
  if (!v190 || !v191 || !v192 || !v193) return;
  if (v189) v189["_refThumbFixedSlotAcceptMap"] = v193 || null;
  if (v190["dataset"]["fixedSlotDragBound"] === "1") return;
  ((v190["dataset"]["fixedSlotDragBound"] = "1"),
    v190["addEventListener"]("dragstart", (v194) => {
      const v195 = v194["target"]?.["closest"]?.(THUMB_ITEM_SELECTOR),
        v196 = v195 ? resolveMutableFixedSlotThumb(v195, v191, v192) : null;
      if (!v195 || !v196) return;
      const v197 = String(v196["dragEdgeId"] || v196["rawEdge"]["id"] || "")[
          "trim"
        ](),
        v198 = getSlot(v195);
      if (!v197 || !v198) return;
      const v199 = getFixedSlotAcceptMap(v189, v193),
        v200 = getSlotKind(v195, v199, getKindByNode, v191);
      if (!v200 || v199[v198] !== v200) return;
      if (!v189) return;
      ((v189["_fixedSlotDrag"] = { edgeId: v197, fromSlot: v198, kind: v200 }),
        clearDropState(v190),
        v195["classList"]?.["add"]("is-dragging"),
        setDragData(v194, v197),
        v194["stopPropagation"]?.());
    }),
    v190["addEventListener"]("dragend", (v201) => {
      const v202 = v201["target"]?.["closest"]?.(THUMB_ITEM_SELECTOR);
      (v202?.["classList"]?.["remove"]("is-dragging"), clearDropState(v190));
      if (v189) v189["_fixedSlotDrag"] = null;
      v201["stopPropagation"]?.();
    }),
    v190["addEventListener"]("dragover", (v203) => {
      const v204 = v189?.["_fixedSlotDrag"];
      if (!v204) return;
      const v205 = findSlotTarget(v203),
        v206 = getSlot(v205),
        v207 = getFixedSlotAcceptMap(v189, v193);
      if (!v206 || v207[v206] !== v204["kind"]) return;
      (v203["preventDefault"]?.(),
        setDropMove(v203),
        clearDropState(v190),
        v205["classList"]?.["add"]("is-drop-allow"),
        v203["stopPropagation"]?.());
    }),
    v190["addEventListener"]("drop", (v208) => {
      const v209 = v189?.["_fixedSlotDrag"];
      if (!v209) return;
      const v210 = findSlotTarget(v208),
        v211 = getSlot(v210),
        v212 = getFixedSlotAcceptMap(v189, v193);
      if (!v211 || v212[v211] !== v209["kind"]) return;
      (v208["preventDefault"]?.(), clearDropState(v190));
      if (v211 === v209["fromSlot"]) return;
      const v213 = v191["getState"]?.() || {},
        v214 = resolveMutableFixedSlotEdgeById(v191, v192, v209["edgeId"]),
        v215 = v214?.["rawEdge"] || null;
      if (!v215) return;
      const v216 = resolveFixedSlotTargetEdgeContext(v210, v191, v192, v211),
        v217 = v216?.["rawEdge"] || null,
        v218 = Object["keys"](v212 || {})["filter"](
          (v219) => v212[v219] === v209["kind"],
        ),
        v220 = collectFixedSlotGroupOutputUpdates({
          store: v191,
          nodeId: v192,
          slotOrder: v218,
          contextA: v214,
          contextB: v216,
          fromSlot: v209["fromSlot"],
          toSlot: v211,
        }),
        v221 = [],
        v222 = [];
      if (v217?.["id"] && v217["id"] !== v215["id"]) {
        const v223 = getContextSourceKind(v216, v213, getKindByNode);
        if (!v223 || v212[v209["fromSlot"]] !== v223) return;
        (v214["kind"] === "edge" &&
          (v221["push"](v215["id"]), v222["push"]({ ...v215, refSlot: v211 })),
          v216["kind"] === "edge" &&
            (v221["push"](v217["id"]),
            v222["push"]({ ...v217, refSlot: v209["fromSlot"] })));
      } else
        v214["kind"] === "edge" &&
          (v221["push"](v215["id"]), v222["push"]({ ...v215, refSlot: v211 }));
      v220["forEach"]((v224) => {
        (v221["push"](v224["removeId"]), v222["push"](v224["edge"]));
      });
      if (v221["length"] === 0) return;
      v191["updateEdgesBatch"]?.(v221, v222);
      if (v189) v189["_fixedSlotDrag"] = null;
      v208["stopPropagation"]?.();
    }));
}

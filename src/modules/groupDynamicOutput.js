export function isGroupNodeData(v0) {
  return String(v0?.["type"] || "")["trim"]() === "group";
}
export function wouldCreateGroupOutputCycle({
  sourceId: v1,
  targetId: v2,
  nodes: v3,
  edges: v4,
} = {}) {
  const v5 = String(v1 || "")["trim"](),
    v6 = String(v2 || "")["trim"]();
  if (!v5 || !v6) return false;
  if (v5 === v6) return true;
  if (!isGroupNodeData(v3?.[v5])) return false;
  if (!isGroupNodeData(v3?.[v6])) return false;
  const v7 = [v6],
    v8 = new Set();
  while (v7["length"] > 0) {
    const v9 = v7["shift"]();
    if (!v9 || v8["has"](v9)) continue;
    v8["add"](v9);
    if (v9 === v5) return true;
    for (const v10 of Object["values"](v4 || {})) {
      if (!v10 || String(v10["sourceId"] || "") !== v9) continue;
      const v11 = String(v10["targetId"] || "")["trim"]();
      if (!isGroupNodeData(v3?.[v11])) continue;
      if (v11 === v5) return true;
      if (!v8["has"](v11)) v7["push"](v11);
    }
  }
  return false;
}
export function getDirectGroupChildNodes(v12, v13) {
  const v14 = String(v13 || "");
  if (!v14) return [];
  return Object["values"](v12 || {})["filter"]((v15) => {
    if (!v15 || String(v15["id"] || "") === v14) return false;
    if (String(v15["parentId"] || "") !== v14) return false;
    return !isGroupNodeData(v15);
  });
}
export function buildGroupOutputMembershipSignature(v16, v17) {
  if (!isGroupNodeData(v16)) return "";
  return getDirectGroupChildNodes(v17, v16["id"])
    ["map"]((v18) => {
      const v19 = typeof v18?.["_bizRev"] === "number" ? v18["_bizRev"] : 0;
      return (v18["id"] || "") + ":" + v19;
    })
    ["join"]("|");
}
function sortGroupChildrenBySavedOutputOrder(v20, v21) {
  if (!Array["isArray"](v21) || v21["length"] === 0) return v20;
  const v22 = new Map();
  v21["forEach"]((v23, v24) => {
    const v25 = String(v23 || "")["trim"]();
    v25 && !v22["has"](v25) && v22["set"](v25, v24);
  });
  if (v22["size"] === 0) return v20;
  return v20["map"]((v26, v27) => ({ node: v26, index: v27 }))
    ["sort"]((v28, v29) => {
      const v30 = v22["has"](v28["node"]?.["id"])
          ? v22["get"](v28["node"]["id"])
          : Infinity,
        v31 = v22["has"](v29["node"]?.["id"])
          ? v22["get"](v29["node"]["id"])
          : Infinity;
      if (v30 !== v31) return v30 - v31;
      return v28["index"] - v29["index"];
    })
    ["map"]((v32) => v32["node"]);
}
export function resolveGroupOutputSourceOrder(v33, v34) {
  const v35 = String(v34 || "")["trim"](),
    v36 = v33?.["groupOutputSourceOrderByTarget"];
  if (
    v35 &&
    v36 &&
    typeof v36 === "object" &&
    !Array["isArray"](v36) &&
    Array["isArray"](v36[v35])
  )
    return v36[v35];
  const v37 = String(v33?.["targetId"] || "")["trim"]();
  if (v35 && v37 && v37 !== v35) return [];
  return v33?.["groupOutputSourceOrder"];
}
export function collectGroupOutputIncomingEdges({
  edge: v38,
  groupNode: v39,
  nodes: v40,
  targetId: v41,
  policy: v42,
  counts: v43,
  directSourceIds: v44,
  acceptSource: v45,
  canAppendInputKindWithinLimit: v46,
  reserveInputSlot: reserveInputSlot = null,
}) {
  const v47 = String(v39?.["id"] || v38?.["sourceId"] || ""),
    v48 = [],
    v49 = sortGroupChildrenBySavedOutputOrder(
      getDirectGroupChildNodes(v40, v47),
      resolveGroupOutputSourceOrder(v38, v41),
    );
  for (const v50 of v49) {
    if (!v50?.["id"] || v50["id"] === v41) continue;
    const v51 = v45(v50, v38);
    if (!v51 || v44["has"](v50["id"])) continue;
    if (!v46(v42, v51, v43)) continue;
    let v52 = "";
    if (typeof reserveInputSlot === "function") {
      const v53 = { ...v38, refSlot: "", sourceId: v50["id"] },
        v54 = reserveInputSlot(v51, v53);
      if (!v54) continue;
      if (typeof v54 === "string") v52 = v54;
    }
    (v48["push"]({
      ...v38,
      id: v38["id"] + "::group-output::" + v50["id"],
      sourceId: v50["id"],
      ...(v52 ? { refSlot: v52 } : null),
      isGroupOutput: true,
      outputGroupId: v47,
      groupOutputEdgeId: v38["id"],
      effectiveTargetId: v41,
    }),
      v44["add"](v50["id"]),
      (v43[v51] = (v43[v51] || 0) + 1));
  }
  return v48;
}

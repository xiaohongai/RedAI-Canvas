import { generateId } from "../../core/math.js";
export const WORKFLOW_LIMITS = {
  nameMax: 50,
  tagMax: 5,
  tagLengthMax: 12,
  noteMax: 300,
};
function deepClone(v0) {
  if (typeof structuredClone === "function")
    try {
      return structuredClone(v0);
    } catch {}
  return JSON["parse"](JSON["stringify"](v0));
}
function cleanText(v1, v2 = Infinity) {
  const v3 = String(v1 ?? "")["trim"]();
  if (!Number["isFinite"](v2)) return v3;
  return v3["slice"](0, v2);
}
export function normalizeWorkflowTags(v4) {
  const v5 = Array["isArray"](v4) ? v4 : [],
    v6 = new Set(),
    v7 = [];
  for (const v8 of v5) {
    const v9 = cleanText(v8, WORKFLOW_LIMITS["tagLengthMax"]);
    if (!v9) continue;
    const v10 = v9["toLowerCase"]();
    if (v6["has"](v10)) continue;
    (v6["add"](v10), v7["push"](v9));
    if (v7["length"] >= WORKFLOW_LIMITS["tagMax"]) break;
  }
  return v7;
}
export function normalizeWorkflowMeta(v11 = {}, v12 = {}) {
  const v13 = cleanText(v11["name"] ?? v12["name"], WORKFLOW_LIMITS["nameMax"]),
    v14 = cleanText(v11["note"] ?? v12["note"], WORKFLOW_LIMITS["noteMax"]);
  return {
    name: v13,
    cover: cleanText(v11["cover"] ?? v12["cover"]),
    tags: normalizeWorkflowTags(v11["tags"] ?? v12["tags"]),
    note: v14,
  };
}
function requireWorkflowName(v15) {
  if (!cleanText(v15)) throw new Error("工作流名称不能为空");
}
function normalizeCanvasState(v16) {
  const v17 = v16 && typeof v16 === "object" ? v16 : {};
  return {
    nodes: Array["isArray"](v17["nodes"]) ? deepClone(v17["nodes"]) : [],
    edges: Array["isArray"](v17["edges"]) ? deepClone(v17["edges"]) : [],
    viewport:
      v17["viewport"] && typeof v17["viewport"] === "object"
        ? { ...v17["viewport"] }
        : undefined,
  };
}
function isGroupNode(v18) {
  return cleanText(v18?.["type"])["toLowerCase"]() === "group";
}
function isRootNode(v19) {
  return !cleanText(v19?.["parentId"]);
}
function syncSingleRootGroupName(v20, v21) {
  const v22 = cleanText(v21, WORKFLOW_LIMITS["nameMax"]);
  if (!v22 || !Array["isArray"](v20?.["nodes"])) return v20;
  const v23 = v20["nodes"]["filter"](
    (v24) => isGroupNode(v24) && isRootNode(v24),
  );
  if (v23["length"] !== 1) return v20;
  return {
    ...v20,
    nodes: v20["nodes"]["map"]((v25) =>
      v25 === v23[0] ? { ...v25, name: v22 } : v25,
    ),
  };
}
function edgeSourceId(v26) {
  return String(v26?.["sourceId"] ?? v26?.["source"] ?? "")["trim"]();
}
function edgeTargetId(v27) {
  return String(v27?.["targetId"] ?? v27?.["target"] ?? "")["trim"]();
}
function normalizeNodeRecord(v28) {
  if (!v28 || typeof v28 !== "object") return {};
  if (Array["isArray"](v28))
    return v28["reduce"]((v29, v30) => {
      const v31 = cleanText(v30?.["id"]);
      if (v31) v29[v31] = v30;
      return v29;
    }, {});
  return v28;
}
export function collectWorkflowGroupNodeIds(v32, v33) {
  const v34 = cleanText(v33);
  if (!v34) return new Set();
  const v35 = normalizeNodeRecord(v32);
  if (!v35[v34]) return new Set();
  const v36 = new Set([v34]),
    v37 = [v34];
  while (v37["length"] > 0) {
    const v38 = v37["pop"]();
    for (const v39 of Object["values"](v35)) {
      const v40 = cleanText(v39?.["id"]);
      if (!v40 || v36["has"](v40)) continue;
      if (cleanText(v39?.["parentId"]) !== v38) continue;
      (v36["add"](v40), v37["push"](v40));
    }
  }
  return v36;
}
export function sliceCanvasStateForWorkflow(v41, v42, v43) {
  const v44 = normalizeCanvasState(v41),
    v45 = cleanText(v43);
  if (!v45) return v44;
  const v46 = collectWorkflowGroupNodeIds(v42, v45);
  if (v46["size"] === 0) return { ...v44, nodes: [], edges: [] };
  const v47 = v44["nodes"]["filter"]((v48) =>
      v46["has"](cleanText(v48?.["id"])),
    ),
    v49 = new Set(
      v47["map"]((v50) => cleanText(v50?.["id"]))["filter"](Boolean),
    ),
    v51 = v44["edges"]["filter"]((v52) => {
      const v53 = edgeSourceId(v52),
        v54 = edgeTargetId(v52);
      return v49["has"](v53) && v49["has"](v54);
    });
  return { ...v44, nodes: v47, edges: v51 };
}
export function createWorkflowFromCanvas(v55, v56 = {}) {
  const v57 = Date["now"](),
    v58 = normalizeWorkflowMeta(v56);
  requireWorkflowName(v58["name"]);
  const v59 = syncSingleRootGroupName(normalizeCanvasState(v55), v58["name"]);
  return {
    id: cleanText(v56["id"]) || generateId("workflow"),
    name: v58["name"],
    cover: v58["cover"],
    tags: v58["tags"],
    note: v58["note"],
    createdAt: Number["isFinite"](Number(v56["createdAt"]))
      ? Number(v56["createdAt"])
      : v57,
    updatedAt: v57,
    lastUsedAt:
      v56["lastUsedAt"] == null ||
      !Number["isFinite"](Number(v56["lastUsedAt"]))
        ? undefined
        : Number(v56["lastUsedAt"]),
    nodeCount: v59["nodes"]["length"],
    edgeCount: v59["edges"]["length"],
    version: 1,
    workflowData: v59,
  };
}
export function updateWorkflowFromCanvas(v60, v61, v62 = {}) {
  const v63 = v62["existingWorkflow"] || {},
    v64 = cleanText(v60 || v63["id"] || v62["id"]);
  if (!v64) throw new Error("缺少要更新的工作流 ID");
  const v65 = normalizeWorkflowMeta(v62, v63);
  requireWorkflowName(v65["name"]);
  const v66 = syncSingleRootGroupName(normalizeCanvasState(v61), v65["name"]);
  return {
    ...v63,
    id: v64,
    name: v65["name"],
    cover: v65["cover"],
    tags: v65["tags"],
    note: v65["note"],
    createdAt: Number["isFinite"](Number(v63["createdAt"]))
      ? Number(v63["createdAt"])
      : Date["now"](),
    updatedAt: Date["now"](),
    lastUsedAt: v63["lastUsedAt"],
    nodeCount: v66["nodes"]["length"],
    edgeCount: v66["edges"]["length"],
    version: Number["isFinite"](Number(v63["version"]))
      ? Number(v63["version"])
      : 1,
    workflowData: v66,
  };
}
export function calcWorkflowBounds(v67) {
  const v68 = Array["isArray"](v67) ? v67 : [];
  let v69 = Infinity,
    v70 = Infinity,
    v71 = -Infinity,
    v72 = -Infinity;
  for (const v73 of v68) {
    if (!v73) continue;
    const v74 = Number(v73["x"]) || 0,
      v75 = Number(v73["y"]) || 0,
      v76 = Number(v73["width"] ?? v73["w"]) || 100,
      v77 = Number(v73["height"] ?? v73["h"]) || 100;
    ((v69 = Math["min"](v69, v74)),
      (v70 = Math["min"](v70, v75)),
      (v71 = Math["max"](v71, v74 + v76)),
      (v72 = Math["max"](v72, v75 + v77)));
  }
  if (!Number["isFinite"](v69) || !Number["isFinite"](v70))
    return {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
      cx: 0,
      cy: 0,
    };
  const v78 = Math["max"](0, v71 - v69),
    v79 = Math["max"](0, v72 - v70);
  return {
    minX: v69,
    minY: v70,
    maxX: v71,
    maxY: v72,
    width: v78,
    height: v79,
    cx: v69 + v78 / 2,
    cy: v70 + v79 / 2,
  };
}
export function calcWorkflowCenterOffset(v80, v81) {
  const v82 = { x: Number(v81?.["x"]) || 0, y: Number(v81?.["y"]) || 0 },
    v83 = calcWorkflowBounds(v80);
  return { dx: v82["x"] - v83["cx"], dy: v82["y"] - v83["cy"] };
}
export function remapWorkflowNodeIds(v84, v85) {
  const v86 = Array["isArray"](v84) ? v84 : [],
    v87 = Array["isArray"](v85) ? v85 : [],
    v88 = {},
    v89 = v86["filter"](
      (v90) => v90 && typeof v90 === "object" && cleanText(v90["id"]),
    )["map"]((v91) => {
      const v92 = deepClone(v91),
        v93 = cleanText(v92["id"]),
        v94 = generateId(cleanText(v92["type"]) || "node");
      return ((v88[v93] = v94), (v92["id"] = v94), v92);
    });
  for (const v95 of v89) {
    const v96 = cleanText(v95["parentId"]);
    if (!v96) {
      v95["parentId"] = v95["parentId"] == null ? null : v95["parentId"];
      continue;
    }
    v95["parentId"] = v88[v96] || null;
  }
  const v97 = [];
  for (const v98 of v87) {
    if (!v98 || typeof v98 !== "object") continue;
    const v99 = edgeSourceId(v98),
      v100 = edgeTargetId(v98),
      v101 = v88[v99],
      v102 = v88[v100];
    if (!v101 || !v102) continue;
    const v103 = deepClone(v98);
    ((v103["id"] = generateId("edge")),
      (v103["sourceId"] = v101),
      (v103["targetId"] = v102),
      Object["prototype"]["hasOwnProperty"]["call"](v103, "source") &&
        (v103["source"] = v101),
      Object["prototype"]["hasOwnProperty"]["call"](v103, "target") &&
        (v103["target"] = v102),
      v97["push"](v103));
  }
  return { nodes: v89, edges: v97, idMap: v88 };
}
export function applyWorkflowToCanvas(v104, v105) {
  const v106 =
      v104?.["workflowData"] && typeof v104["workflowData"] === "object"
        ? v104["workflowData"]
        : {},
    v107 = syncSingleRootGroupName(v106, v104?.["name"]),
    {
      nodes: v108,
      edges: v109,
      idMap: v110,
    } = remapWorkflowNodeIds(v107["nodes"], v107["edges"]),
    v111 = v105?.["center"] || v105 || { x: 0, y: 0 },
    { dx: v112, dy: v113 } = calcWorkflowCenterOffset(v108, v111),
    v114 = v108["map"]((v115) => ({
      ...v115,
      x: (Number(v115["x"]) || 0) + v112,
      y: (Number(v115["y"]) || 0) + v113,
    }));
  return { nodes: v114, edges: v109, idMap: v110, dx: v112, dy: v113 };
}

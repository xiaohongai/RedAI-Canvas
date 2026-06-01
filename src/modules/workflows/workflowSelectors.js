function text(v0) {
  return String(v0 ?? "")["trim"]();
}
function timestamp(v1) {
  const v2 = Number(v1);
  return Number["isFinite"](v2) ? v2 : 0;
}
export function normalizeWorkflowEntity(v3) {
  if (!v3 || typeof v3 !== "object") return null;
  const { scope: v4, ...v5 } = v3,
    v6 = text(v3["id"]);
  if (!v6) return null;
  const v7 =
      v3["workflowData"] && typeof v3["workflowData"] === "object"
        ? v3["workflowData"]
        : {},
    v8 = Array["isArray"](v7["nodes"]) ? v7["nodes"] : [],
    v9 = Array["isArray"](v7["edges"]) ? v7["edges"] : [];
  return {
    ...v5,
    id: v6,
    name: text(v3["name"]) || "未命名工作流",
    cover: text(v3["cover"] || v3["coverUrl"]),
    tags: Array["isArray"](v3["tags"])
      ? v3["tags"]["map"](text)["filter"](Boolean)
      : [],
    note: text(v3["note"]),
    createdAt: timestamp(v3["createdAt"] || v3["updatedAt"] || Date["now"]()),
    updatedAt: timestamp(v3["updatedAt"] || v3["createdAt"] || Date["now"]()),
    lastUsedAt:
      v3["lastUsedAt"] == null ? undefined : timestamp(v3["lastUsedAt"]),
    nodeCount: Number["isFinite"](Number(v3["nodeCount"]))
      ? Number(v3["nodeCount"])
      : v8["length"],
    edgeCount: Number["isFinite"](Number(v3["edgeCount"]))
      ? Number(v3["edgeCount"])
      : v9["length"],
    version: Number["isFinite"](Number(v3["version"]))
      ? Number(v3["version"])
      : 1,
    workflowData: {
      nodes: v8,
      edges: v9,
      viewport:
        v7["viewport"] && typeof v7["viewport"] === "object"
          ? { ...v7["viewport"] }
          : undefined,
    },
  };
}
export function normalizeWorkflowList(v10) {
  if (!Array["isArray"](v10)) return [];
  return v10["map"](normalizeWorkflowEntity)["filter"](Boolean);
}
export function sortWorkflows(v11) {
  const v12 = normalizeWorkflowList(v11);
  return (
    v12["sort"]((v13, v14) => {
      return timestamp(v14?.["updatedAt"]) - timestamp(v13?.["updatedAt"]);
    }),
    v12
  );
}
export function filterWorkflows(v15, v16 = "") {
  const v17 = text(v16)["toLowerCase"](),
    v18 = normalizeWorkflowList(v15),
    v19 = v17
      ? v18["filter"]((v20) => {
          const v21 = [
            v20["name"],
            v20["note"],
            ...(Array["isArray"](v20["tags"]) ? v20["tags"] : []),
          ]
            ["map"]((v22) => String(v22 || "")["toLowerCase"]())
            ["join"]("\x20");
          return v21["includes"](v17);
        })
      : v18;
  return sortWorkflows(v19);
}
export function findWorkflowById(v23, v24) {
  const v25 = text(v24);
  if (!v25) return null;
  return normalizeWorkflowList(v23)["find"]((v26) => v26["id"] === v25) || null;
}

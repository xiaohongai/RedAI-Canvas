function cleanText(v0) {
  return String(v0 ?? "")["trim"]();
}
function normalizeNodeList(v1) {
  return Array["isArray"](v1)
    ? v1
    : v1 && typeof v1 === "object"
      ? Object["values"](v1)
      : [];
}
function isGroupNode(v2) {
  return cleanText(v2?.["type"])["toLowerCase"]() === "group";
}
function nodeSize(v3) {
  const v4 = isGroupNode(v3);
  return {
    width: Number(v3?.["width"] ?? v3?.["w"]) || (v4 ? 400 : 260),
    height: Number(v3?.["height"] ?? v3?.["h"]) || (v4 ? 300 : 100),
  };
}
function isNodeContainedInGroup(v5, v6) {
  if (!v5 || !v6) return false;
  const v7 = nodeSize(v5),
    v8 = nodeSize(v6),
    v9 = Number(v5["x"]) || 0,
    v10 = Number(v5["y"]) || 0,
    v11 = Number(v6["x"]) || 0,
    v12 = Number(v6["y"]) || 0;
  return (
    v9 >= v11 &&
    v10 >= v12 &&
    v9 + v7["width"] <= v11 + v8["width"] &&
    v10 + v7["height"] <= v12 + v8["height"]
  );
}
function findContainingGroup(v13, v14) {
  for (const v15 of v14) {
    if (isNodeContainedInGroup(v13, v15)) return cleanText(v15["id"]);
  }
  return null;
}
export function collectGroupContainmentReparentOps(v16, v17) {
  const v18 = normalizeNodeList(v16)["filter"](Boolean),
    v19 = new Map(
      v18["map"]((v20) => [cleanText(v20?.["id"]), v20])["filter"](
        ([v21]) => v21,
      ),
    ),
    v22 = Array["isArray"](v17) ? v17["map"](cleanText)["filter"](Boolean) : [],
    v23 = v18["filter"](isGroupNode),
    v24 = [];
  for (const v25 of v22) {
    const v26 = v19["get"](v25);
    if (!v26) continue;
    if (!isGroupNode(v26)) {
      const v27 = findContainingGroup(v26, v23);
      (v26["parentId"] || null) !== (v27 || null) &&
        v24["push"]({ nodeId: v25, parentId: v27 });
      continue;
    }
    for (const v28 of v18) {
      if (isGroupNode(v28)) continue;
      const v29 = cleanText(v28?.["id"]);
      if (!v29) continue;
      const v30 = isNodeContainedInGroup(v28, v26);
      if (v30 && v28["parentId"] !== v25)
        v24["push"]({ nodeId: v29, parentId: v25 });
      else
        !v30 &&
          v28["parentId"] === v25 &&
          v24["push"]({ nodeId: v29, parentId: null });
    }
  }
  return v24;
}

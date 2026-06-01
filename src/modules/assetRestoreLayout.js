const FLAT_MEDIA_TYPES = new Set([
  "source-image",
  "image",
  "ai-image",
  "source-video",
  "video",
  "ai-video",
]);
function toNumber(v0, v1 = 0) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) ? v2 : v1;
}
function getNodeWidth(v3) {
  return Math["max"](1, toNumber(v3?.["width"] ?? v3?.["w"], 240));
}
function getNodeHeight(v4) {
  return Math["max"](1, toNumber(v4?.["height"] ?? v4?.["h"], 240));
}
function isFlatMediaNode(v5) {
  return FLAT_MEDIA_TYPES["has"](String(v5?.["type"] || ""));
}
export function shouldTopAlignRestoredAsset(v6, v7) {
  const v8 = Array["isArray"](v6) ? v6["filter"](Boolean) : [];
  if (v8["length"] <= 1) return false;
  if (!v8["every"](isFlatMediaNode)) return false;
  return !Array["isArray"](v7) || v7["length"] === 0;
}
export function createTopAlignedAssetNodes(v9, v10 = 24) {
  const v11 = Array["isArray"](v9) ? v9["filter"](Boolean) : [],
    v12 = v11["map"]((v13, v14) => ({ node: v13, index: v14 }))["sort"](
      (v15, v16) => {
        const v17 = toNumber(v15["node"]?.["x"], 0),
          v18 = toNumber(v16["node"]?.["x"], 0);
        if (v17 !== v18) return v17 - v18;
        const v19 = toNumber(v15["node"]?.["y"], 0),
          v20 = toNumber(v16["node"]?.["y"], 0);
        if (v19 !== v20) return v19 - v20;
        return v15["index"] - v16["index"];
      },
    );
  let v21 = 0;
  return v12["map"](({ node: v22 }) => {
    const v23 = getNodeWidth(v22),
      v24 = getNodeHeight(v22),
      v25 = { ...v22, x: v21, y: 0, width: v23, height: v24 };
    return ((v21 += v23 + v10), v25);
  });
}

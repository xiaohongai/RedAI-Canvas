function toFiniteNumber(v0) {
  const v1 = Number(v0);
  return Number["isFinite"](v1) ? v1 : null;
}
function normalizeEdgeIds(v2) {
  if (v2 instanceof Set) return new Set(v2);
  if (Array["isArray"](v2)) return new Set(v2);
  return new Set();
}
export function previewNodeResizeGeometry(
  { nodeId: v3, width: v4, height: v5 } = {},
  {
    snapshot: v6,
    ensureEdgeIndex: v7,
    nodeToEdgeIds: v8,
    renderEdgesByIds: v9,
  } = {},
) {
  if (!v3 || !v6?.["nodes"]?.[v3]) return false;
  const v10 = toFiniteNumber(v4),
    v11 = toFiniteNumber(v5);
  if (v10 === null || v11 === null) return false;
  const v12 = v6["edges"] || {},
    v13 = Number["isFinite"](v6["_edgesRev"]) ? v6["_edgesRev"] : 0;
  v7?.(v12, v13);
  const v14 = normalizeEdgeIds(v8?.["get"]?.(v3));
  if (v14["size"] === 0) return true;
  return (
    v9?.(
      v14,
      { ...v6["nodes"], [v3]: { ...v6["nodes"][v3], width: v10, height: v11 } },
      v6,
    ),
    true
  );
}
export function installNodeResizeGeometryPreviewer(v15, v16, v17, v18, v19) {
  if (!v15) return false;
  return (
    (v15["v2Renderer"] = v15["v2Renderer"] || {}),
    (v15["v2Renderer"]["previewNodeResizeGeometry"] = (v20) =>
      previewNodeResizeGeometry(v20, {
        snapshot: typeof v16 === "function" ? v16() : null,
        ensureEdgeIndex: v17,
        nodeToEdgeIds: v18,
        renderEdgesByIds: v19,
      })),
    true
  );
}

import { startNodeResizePreview } from "../../modules/interaction/nodeResizePreview.js";
const MIN_NODE_WIDTH = 220,
  MIN_NODE_HEIGHT = 260,
  DEFAULT_NODE_WIDTH = 300,
  DEFAULT_NODE_HEIGHT = 300;
function normalizeMinDimension(v0, v1) {
  const v2 = Number(v0);
  return Number["isFinite"](v2) && v2 > 0 ? v2 : v1;
}
function resolveResizeMinSize({
  ctx: v3,
  startNode: v4,
  minWidth: v5,
  minHeight: v6,
  resolveMinSize: v7,
}) {
  const v8 = typeof v7 === "function" ? v7(v4, v3) : null;
  return {
    width: normalizeMinDimension(v8?.["width"], v5),
    height: normalizeMinDimension(v8?.["height"], v6),
  };
}
export function createNodeResizeHandle(
  v9,
  {
    store: v10,
    getStateSnapshot: v11,
    commit: v12,
    minWidth: minWidth = MIN_NODE_WIDTH,
    minHeight: minHeight = MIN_NODE_HEIGHT,
    resolveMinSize: v13,
  },
) {
  const v14 = document["createElement"]("div");
  return (
    (v14["className"] = "group-resizer"),
    v14["classList"]["add"]("v2-resize-move"),
    (v14["style"]["pointerEvents"] = "auto"),
    v14["addEventListener"]("pointerdown", (v15) => {
      startNodeResizePreview({
        event: v15,
        nodeId: v9["nodeId"],
        getNode: () => v11()["nodes"]?.[v9["nodeId"]] || v9["_data"],
        getViewport: () => v11()["viewport"],
        resolveSize: ({
          startNode: v16,
          startWidth: v17,
          startHeight: v18,
          dx: v19,
          dy: v20,
        }) => {
          const v21 = resolveResizeMinSize({
            ctx: v9,
            startNode: v16,
            minWidth: minWidth,
            minHeight: minHeight,
            resolveMinSize: v13,
          });
          return {
            width: Math["max"](v21["width"], v17 + v19),
            height: Math["max"](v21["height"], v18 + v20),
          };
        },
        applyPatch: (v22) => v10["updateNodeData"](v9["nodeId"], v22),
        commit: v12,
      });
    }),
    v14
  );
}

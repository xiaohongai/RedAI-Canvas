export const RENDERER_VIRTUALIZATION_CONFIG = Object["freeze"]({
  mountPadding: 600,
  parkPadding: 900,
  denseLowZoomMountPadding: 420,
  denseLowZoomParkPadding: 650,
  veryDenseLowZoomMountPadding: 320,
  veryDenseLowZoomParkPadding: 520,
  denseLowZoomThreshold: 0.45,
  veryDenseLowZoomThreshold: 0.32,
  denseNodeCount: 80,
  veryDenseNodeCount: 120,
  settleDelayMs: 120,
  batchSize: 24,
  recentPinMs: 2000,
});
function addNodeAndChildren(v0, v1, v2) {
  if (!v1 || v0["has"](v1)) return;
  const v3 = [v1];
  for (let v4 = 0; v4 < v3["length"]; v4 += 1) {
    const v5 = v3[v4];
    if (!v5 || v0["has"](v5)) continue;
    v0["add"](v5);
    const v6 = v2?.[v5];
    if (!v6) continue;
    const v7 =
      v6 instanceof Set
        ? v6
        : Array["isArray"](v6)
          ? v6
          : typeof v6[Symbol["iterator"]] === "function"
            ? v6
            : [];
    for (const v8 of v7) {
      if (!v0["has"](v8)) v3["push"](v8);
    }
  }
}
export function isNodeInsideViewportPadding(
  v9,
  v10,
  v11,
  v12,
  v13 = 0,
  v14 = 0,
  v15 = 0,
) {
  if (!v9 || !v10) return false;
  const v16 = Number["isFinite"](v10["zoom"]) ? v10["zoom"] : 1,
    v17 = Number["isFinite"](v9["x"]) ? v9["x"] : 0,
    v18 = Number["isFinite"](v9["y"]) ? v9["y"] : 0,
    v19 = Number["isFinite"](v9["width"]) ? v9["width"] : 0,
    v20 = Number["isFinite"](v9["height"]) ? v9["height"] : 0,
    v21 = Number["isFinite"](v14) ? v14 : 0,
    v22 = Number["isFinite"](v15) ? v15 : 0,
    v23 = (v17 + v21) * v16 + (Number["isFinite"](v10["x"]) ? v10["x"] : 0),
    v24 = (v18 + v22) * v16 + (Number["isFinite"](v10["y"]) ? v10["y"] : 0),
    v25 = v19 * v16,
    v26 = v20 * v16;
  return (
    v23 + v25 > -v13 && v23 < v11 + v13 && v24 + v26 > -v13 && v24 < v12 + v13
  );
}
export function collectVirtualKeepAliveNodeIds({
  selectedNodeIds: v27,
  connOverlay: v28,
  pickConnectMode: v29,
  dragContext: v30,
  parentToChildren: v31,
  pinnedNodeIds: v32,
} = {}) {
  const v33 = new Set(),
    v34 =
      v27 instanceof Set
        ? Array["from"](v27)
        : Array["isArray"](v27)
          ? v27
          : [];
  v34["forEach"]((v35) => addNodeAndChildren(v33, v35, v31));
  if (v30?.["isDragging"] && v30?.["targetNodeId"]) {
    const v36 = v34["includes"](v30["targetNodeId"])
      ? v34
      : [v30["targetNodeId"]];
    v36["forEach"]((v37) => addNodeAndChildren(v33, v37, v31));
  }
  v28?.["srcId"] && v33["add"](v28["srcId"]);
  v28?.["hoverId"] && v33["add"](v28["hoverId"]);
  v29?.["sourceNodeId"] && v33["add"](v29["sourceNodeId"]);
  v29?.["hoverNodeId"] && v33["add"](v29["hoverNodeId"]);
  const v38 = v32 instanceof Set ? v32 : Array["isArray"](v32) ? v32 : [];
  for (const v39 of v38) {
    v33["add"](v39);
  }
  return v33;
}
export function resolveRendererVirtualizationPadding({
  viewport: v40,
  nodeCount: nodeCount = 0,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG["mountPadding"],
  parkPadding: parkPadding = RENDERER_VIRTUALIZATION_CONFIG["parkPadding"],
} = {}) {
  const v41 = Number["isFinite"](v40?.["zoom"]) ? v40["zoom"] : 1,
    v42 = Number["isFinite"](nodeCount) ? nodeCount : 0;
  if (
    v41 <= RENDERER_VIRTUALIZATION_CONFIG["veryDenseLowZoomThreshold"] &&
    v42 >= RENDERER_VIRTUALIZATION_CONFIG["veryDenseNodeCount"]
  )
    return {
      mountPadding:
        RENDERER_VIRTUALIZATION_CONFIG["veryDenseLowZoomMountPadding"],
      parkPadding:
        RENDERER_VIRTUALIZATION_CONFIG["veryDenseLowZoomParkPadding"],
    };
  if (
    v41 <= RENDERER_VIRTUALIZATION_CONFIG["denseLowZoomThreshold"] &&
    v42 >= RENDERER_VIRTUALIZATION_CONFIG["denseNodeCount"]
  )
    return {
      mountPadding: RENDERER_VIRTUALIZATION_CONFIG["denseLowZoomMountPadding"],
      parkPadding: RENDERER_VIRTUALIZATION_CONFIG["denseLowZoomParkPadding"],
    };
  return { mountPadding: mountPadding, parkPadding: parkPadding };
}
export function buildVirtualizationCandidateSets({
  nodes: v43,
  viewport: v44,
  containerWidth: v45,
  containerHeight: v46,
  selectedNodeIds: v47,
  connOverlay: v48,
  pickConnectMode: v49,
  dragContext: v50,
  parentToChildren: v51,
  pinnedNodeIds: v52,
  mountPadding: mountPadding = RENDERER_VIRTUALIZATION_CONFIG["mountPadding"],
  parkPadding: parkPadding = RENDERER_VIRTUALIZATION_CONFIG["parkPadding"],
} = {}) {
  const v53 = Object["values"](v43 || {}),
    v54 = resolveRendererVirtualizationPadding({
      viewport: v44,
      nodeCount: v53["length"],
      mountPadding: mountPadding,
      parkPadding: parkPadding,
    }),
    v55 = collectVirtualKeepAliveNodeIds({
      selectedNodeIds: v47,
      connOverlay: v48,
      pickConnectMode: v49,
      dragContext: v50,
      parentToChildren: v51,
      pinnedNodeIds: v52,
    }),
    v56 = new Set(),
    v57 = new Set();
  for (const v58 of v53) {
    if (!v58?.["id"]) continue;
    const v59 = v58["id"];
    if (v55["has"](v59)) {
      v56["add"](v59);
      continue;
    }
    const v60 = isNodeInsideViewportPadding(
      v58,
      v44,
      v45,
      v46,
      v54["mountPadding"],
    );
    if (v60) {
      v56["add"](v59);
      continue;
    }
    const v61 = isNodeInsideViewportPadding(
      v58,
      v44,
      v45,
      v46,
      v54["parkPadding"],
    );
    !v61 && v57["add"](v59);
  }
  return {
    keepAliveNodeIds: v55,
    mountCandidateIds: v56,
    parkCandidateIds: v57,
  };
}

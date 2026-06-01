const GRAPH_STATE_KEYS = Object["freeze"]([
    "viewport",
    "nodes",
    "_nodeCount",
    "_persistRev",
    "_edgesRev",
    "_parentToChildren",
    "edges",
    "selectionBox",
    "selectionMeta",
    "selectedNodeIds",
    "connOverlay",
  ]),
  UI_STATE_KEYS = Object["freeze"]([
    "isServerConnected",
    "picker",
    "contextMenu",
    "pickConnectMode",
    "annotate",
    "matting",
    "videoKeying",
    "videoClip",
    "theme",
    "ui",
  ]),
  WORKSPACE_STATE_KEYS = Object["freeze"]([
    "subscription",
    "assets",
    "workflows",
    "workflowUi",
  ]);
function pickStateKeys(v0, v1) {
  if (!v0 || typeof v0 !== "object") return {};
  const v2 = {};
  for (const v3 of v1) {
    Object["prototype"]["hasOwnProperty"]["call"](v0, v3) && (v2[v3] = v0[v3]);
  }
  return v2;
}
function selectGraphState(v4) {
  return pickStateKeys(v4, GRAPH_STATE_KEYS);
}
function selectUiState(v5) {
  return pickStateKeys(v5, UI_STATE_KEYS);
}
function selectWorkspaceState(v6) {
  return pickStateKeys(v6, WORKSPACE_STATE_KEYS);
}
export {
  GRAPH_STATE_KEYS,
  UI_STATE_KEYS,
  WORKSPACE_STATE_KEYS,
  selectGraphState,
  selectUiState,
  selectWorkspaceState,
};

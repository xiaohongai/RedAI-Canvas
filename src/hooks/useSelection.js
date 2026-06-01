import appStore from "../core/stores/appStore.js";
import { screenToWorld, isPointInRect, isRectIntersect } from "../core/math.js";
export function getSelectedNodeIds() {
  return appStore["getState"]()["selectedNodeIds"];
}
export function getSelectedNodes() {
  const { nodes: v0, selectedNodeIds: v1 } = appStore["getState"]();
  return v1["map"]((v2) => v0[v2])["filter"](Boolean);
}
export function getSelectionCount() {
  return appStore["getState"]()["selectedNodeIds"]["length"];
}
export function isNodeSelected(v3) {
  return appStore["getState"]()["selectedNodeIds"]["includes"](v3);
}
export function selectNode(v4) {
  appStore["setSelectedNodes"]([v4]);
}
export function selectNodes(v5) {
  appStore["setSelectedNodes"](v5);
}
export function addToSelection(v6) {
  const v7 = getSelectedNodeIds();
  !v7["includes"](v6) && appStore["setSelectedNodes"]([...v7, v6]);
}
export function removeFromSelection(v8) {
  const v9 = getSelectedNodeIds();
  appStore["setSelectedNodes"](v9["filter"]((v10) => v10 !== v8));
}
export function toggleNodeSelection(v11) {
  isNodeSelected(v11) ? removeFromSelection(v11) : addToSelection(v11);
}
export function clearSelection() {
  appStore["clearSelection"]();
}
export function selectAll() {
  const { nodes: v12 } = appStore["getState"]();
  appStore["setSelectedNodes"](Object["keys"](v12));
}
export function invertSelection() {
  const { nodes: v13, selectedNodeIds: v14 } = appStore["getState"](),
    v15 = Object["keys"](v13),
    v16 = v15["filter"]((v17) => !v14["includes"](v17));
  appStore["setSelectedNodes"](v16);
}
export function selectByType(v18) {
  const { nodes: v19 } = appStore["getState"](),
    v20 = Object["values"](v19)
      ["filter"]((v21) => v21["type"] === v18)
      ["map"]((v22) => v22["id"]);
  appStore["setSelectedNodes"](v20);
}
export function startSelectionBox(v23, v24) {
  const { viewport: v25 } = appStore["getState"](),
    v26 = screenToWorld(v23, v24, v25);
  appStore["setSelectionBox"]({
    active: true,
    x1: v26["x"],
    y1: v26["y"],
    x2: v26["x"],
    y2: v26["y"],
  });
}
export function updateSelectionBox(v27, v28) {
  const { viewport: v29 } = appStore["getState"](),
    v30 = screenToWorld(v27, v28, v29);
  appStore["setSelectionBox"]({ x2: v30["x"], y2: v30["y"] });
}
export function endSelectionBox(v31 = false) {
  const {
    nodes: v32,
    selectionBox: v33,
    selectedNodeIds: v34,
  } = appStore["getState"]();
  if (!v33["active"]) return;
  const v35 = Math["min"](v33["x1"], v33["x2"]),
    v36 = Math["max"](v33["x1"], v33["x2"]),
    v37 = Math["min"](v33["y1"], v33["y2"]),
    v38 = Math["max"](v33["y1"], v33["y2"]),
    v39 = v36 - v35,
    v40 = v38 - v37,
    v41 = [];
  for (const v42 of Object["values"](v32)) {
    const v43 = v42["width"] || 100,
      v44 = v42["height"] || 100;
    isRectIntersect(v35, v37, v39, v40, v42["x"], v42["y"], v43, v44) &&
      v41["push"](v42["id"]);
  }
  if (v31) {
    const v45 = [...new Set([...v34, ...v41])];
    appStore["setSelectedNodes"](v45);
  } else appStore["setSelectedNodes"](v41);
  appStore["setSelectionBox"]({ active: false });
}
export function getSelectionBox() {
  const { selectionBox: v46 } = appStore["getState"]();
  return v46["active"] ? v46 : null;
}
export function isSelecting() {
  return appStore["getState"]()["selectionBox"]["active"];
}
export function deleteSelectedNodes() {
  const { selectedNodeIds: v47 } = appStore["getState"]();
  v47["forEach"]((v48) => appStore["deleteNode"](v48));
}
export function copySelectedNodes() {
  const v49 = getSelectedNodes();
  return v49["map"]((v50) => ({ ...v50, id: undefined, parentId: null }));
}
export function moveSelectedNodes(v51, v52) {
  const { selectedNodeIds: v53 } = appStore["getState"]();
  appStore["moveNodes"](v53, v51, v52);
}
export function subscribeToSelection(v54) {
  return appStore["subscribeSelector"](
    (v55) => v55["selectedNodeIds"],
    (v56) => v54(v56),
  );
}
export function getSelectionCenter() {
  const v57 = getSelectedNodes();
  if (v57["length"] === 0) return null;
  let v58 = 0,
    v59 = 0;
  for (const v60 of v57) {
    ((v58 += v60["x"] + (v60["width"] || 0) / 2),
      (v59 += v60["y"] + (v60["height"] || 0) / 2));
  }
  return { x: v58 / v57["length"], y: v59 / v57["length"] };
}
export function getSelectionBounds() {
  const v61 = getSelectedNodes();
  if (v61["length"] === 0) return null;
  let v62 = Infinity,
    v63 = Infinity,
    v64 = -Infinity,
    v65 = -Infinity;
  for (const v66 of v61) {
    ((v62 = Math["min"](v62, v66["x"])),
      (v63 = Math["min"](v63, v66["y"])),
      (v64 = Math["max"](v64, v66["x"] + (v66["width"] || 0))),
      (v65 = Math["max"](v65, v66["y"] + (v66["height"] || 0))));
  }
  return {
    left: v62,
    top: v63,
    right: v64,
    bottom: v65,
    width: v64 - v62,
    height: v65 - v63,
  };
}

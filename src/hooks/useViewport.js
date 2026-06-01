import appStore from "../core/stores/appStore.js";
import {
  computeNodesWorldBounds,
  computeViewportForWorldBounds,
} from "../core/math.js";
import { getBrowserViewportRect } from "../core/viewportFocus.js";
import { jumpZoomPercentToViewportZoom } from "../modules/commentNoteJumpShortcut.js";
let _isAnimating = false;
function _getStateSnapshot() {
  return typeof appStore["getStateRaw"] === "function"
    ? appStore["getStateRaw"]()
    : appStore["getState"]();
}
function _getCurrentViewportRect() {
  const v0 =
    typeof document !== "undefined"
      ? document["getElementById"]("v2-wrap")
      : null;
  return getBrowserViewportRect({ containerEl: v0 });
}
function _resolveFocusTarget({
  nodes: v1,
  nodeIds: v2,
  padding: padding = 0,
  fixedZoom: fixedZoom = undefined,
  maxZoom: maxZoom = 2,
}) {
  const v3 = computeNodesWorldBounds(v1, v2);
  if (!v3) return null;
  return computeViewportForWorldBounds(v3, _getCurrentViewportRect(), {
    padding: padding,
    fixedZoom: fixedZoom,
    maxZoom: maxZoom,
    minZoom: 0.2,
  });
}
export function getViewport() {
  return { ...(_getStateSnapshot()["viewport"] || {}) };
}
export function setViewport(v4, v5, v6) {
  appStore["updateViewport"](v4, v5, v6);
}
export function zoomAt(v7, v8, v9) {
  const { viewport: v10 } = _getStateSnapshot(),
    v11 = v10["zoom"],
    v12 = (v7 - v10["x"]) / v11,
    v13 = (v8 - v10["y"]) / v11,
    v14 = v7 - v12 * v9,
    v15 = v8 - v13 * v9;
  appStore["updateViewport"](v14, v15, v9);
}
export function zoomBy(v16, v17, v18) {
  const { viewport: v19 } = _getStateSnapshot(),
    v20 = Math["max"](0.1, Math["min"](3, v19["zoom"] + v18));
  zoomAt(v16, v17, v20);
}
export function zoomIn(v21 = 0.1) {
  const v22 = _getCurrentViewportRect();
  zoomBy(v22["centerX"], v22["centerY"], v21);
}
export function zoomOut(v23 = 0.1) {
  const v24 = _getCurrentViewportRect();
  zoomBy(v24["centerX"], v24["centerY"], -v23);
}
export function fitToCanvas(v25 = 120, v26 = 800) {
  const { nodes: v27, viewport: v28 } = _getStateSnapshot(),
    v29 = Object["keys"](v27 || {});
  if (v29["length"] === 0) {
    animateViewport(v28["x"], v28["y"], v28["zoom"], 0, 0, 1.1, v26);
    return;
  }
  const v30 = _resolveFocusTarget({
    nodes: v27,
    nodeIds: v29,
    padding: v25,
    maxZoom: 2,
  });
  if (!v30) return;
  animateViewport(
    v28["x"],
    v28["y"],
    v28["zoom"],
    v30["x"],
    v30["y"],
    v30["zoom"],
    v26,
  );
}
export function focusOnNode(v31, v32 = 120, v33 = 800, v34) {
  const { nodes: v35, viewport: v36 } = _getStateSnapshot(),
    v37 = _resolveFocusTarget({
      nodes: v35,
      nodeIds: [v31],
      padding: v32,
      maxZoom:
        typeof v34 === "number"
          ? v34
          : Number["isFinite"](Number(v34?.["maxZoom"]))
            ? Number(v34["maxZoom"])
            : 2,
    });
  if (!v37) {
    console["warn"]("[useViewport] 节点 " + v31 + " 不存在");
    return;
  }
  animateViewport(
    v36["x"],
    v36["y"],
    v36["zoom"],
    v37["x"],
    v37["y"],
    v37["zoom"],
    v33,
  );
}
export function focusOnNodeAtZoom(v38, v39 = 60, v40 = 800) {
  const { nodes: v41, viewport: v42 } = _getStateSnapshot(),
    v43 = _resolveFocusTarget({
      nodes: v41,
      nodeIds: [v38],
      fixedZoom: jumpZoomPercentToViewportZoom(v39),
      maxZoom: 2,
    });
  if (!v43) return;
  animateViewport(
    v42["x"],
    v42["y"],
    v42["zoom"],
    v43["x"],
    v43["y"],
    v43["zoom"],
    v40,
  );
}
export function animateViewport(v44, v45, v46, v47, v48, v49, v50 = 800) {
  if (_isAnimating) return;
  _isAnimating = true;
  const v51 = performance["now"](),
    v52 = (v53) => 1 - Math["pow"](1 - v53, 3);
  function v54(v55) {
    const v56 = v55 - v51,
      v57 = Math["min"](v56 / v50, 1),
      v58 = v52(v57),
      v59 = v44 + (v47 - v44) * v58,
      v60 = v45 + (v48 - v45) * v58,
      v61 = v46 + (v49 - v46) * v58;
    (appStore["updateViewport"](v59, v60, v61),
      v57 < 1 ? requestAnimationFrame(v54) : (_isAnimating = false));
  }
  requestAnimationFrame(v54);
}
export function isAnimating() {
  return _isAnimating;
}
export function subscribeToViewport(v62) {
  return appStore["subscribeSelector"](
    (v63) => v63["viewport"],
    (v64) => v62(v64),
  );
}
export function initViewportHook() {
  ((window["v2AnimateViewport"] = animateViewport),
    (window["v2FocusOnNode"] = focusOnNode),
    (window["v2FocusOnNodeAtZoom"] = focusOnNodeAtZoom));
}

import {
  computeNodesWorldBounds,
  computeViewportForWorldBounds,
} from "./math.js";
import { jumpZoomPercentToViewportZoom } from "../modules/commentNoteJumpShortcut.js";
function _getWindowObject(v0) {
  if (v0) return v0;
  if (typeof window !== "undefined") return window;
  return null;
}
function _getRaf() {
  return typeof globalThis["requestAnimationFrame"] === "function"
    ? globalThis["requestAnimationFrame"]["bind"](globalThis)
    : (v1) => setTimeout(() => v1(Date["now"]()), 16);
}
function _getCaf() {
  return typeof globalThis["cancelAnimationFrame"] === "function"
    ? globalThis["cancelAnimationFrame"]["bind"](globalThis)
    : (v2) => clearTimeout(v2);
}
function _getDefaultViewport() {
  return { x: 0, y: 0, zoom: 1 };
}
function _normalizeViewportRect(v3, v4, v5, v6) {
  const v7 = Number["isFinite"](Number(v3)) ? Number(v3) : 0,
    v8 = Number["isFinite"](Number(v4)) ? Number(v4) : 0,
    v9 = Number["isFinite"](Number(v5)) ? Number(v5) : 0,
    v10 = Number["isFinite"](Number(v6)) ? Number(v6) : 0;
  return {
    left: v7,
    top: v8,
    width: v9,
    height: v10,
    right: v7 + v9,
    bottom: v8 + v10,
    centerX: v7 + v9 / 2,
    centerY: v8 + v10 / 2,
  };
}
export function getBrowserViewportRect({
  windowObject: windowObject = undefined,
  containerEl: containerEl = null,
} = {}) {
  const v11 = _getWindowObject(windowObject),
    v12 = v11?.["visualViewport"] || null;
  if (
    v12 &&
    Number["isFinite"](Number(v12["width"])) &&
    Number["isFinite"](Number(v12["height"])) &&
    Number(v12["width"]) > 0 &&
    Number(v12["height"]) > 0
  )
    return _normalizeViewportRect(
      v12["offsetLeft"],
      v12["offsetTop"],
      v12["width"],
      v12["height"],
    );
  if (
    containerEl &&
    typeof containerEl["getBoundingClientRect"] === "function"
  ) {
    const v13 = containerEl["getBoundingClientRect"]();
    if (
      Number["isFinite"](Number(v13?.["width"])) &&
      Number["isFinite"](Number(v13?.["height"])) &&
      Number(v13["width"]) > 0 &&
      Number(v13["height"]) > 0
    )
      return _normalizeViewportRect(
        v13["left"],
        v13["top"],
        v13["width"],
        v13["height"],
      );
  }
  return _normalizeViewportRect(
    0,
    0,
    Number(v11?.["innerWidth"]) || 0,
    Number(v11?.["innerHeight"]) || 0,
  );
}
function _resolveMaxZoom(v14, v15) {
  if (typeof v14 === "number" && Number["isFinite"](v14)) return v14;
  if (
    v14 &&
    typeof v14 === "object" &&
    Number["isFinite"](Number(v14["maxZoom"]))
  )
    return Number(v14["maxZoom"]);
  return v15;
}
export function createViewportFocusController({
  store: v16,
  animateViewport: v17,
  cancelAnimation: v18,
  containerEl: containerEl = null,
  windowObject: windowObject = undefined,
  minZoom: minZoom = 0.2,
  maxZoom: maxZoom = 2,
  resolveZoomPercent: resolveZoomPercent = jumpZoomPercentToViewportZoom,
} = {}) {
  const v19 = _getWindowObject(windowObject),
    v20 = _getRaf(),
    v21 = _getCaf();
  let v22 = null,
    v23 = null;
  const v24 = () => {
      if (typeof v16?.["getStateRaw"] === "function")
        return v16["getStateRaw"]();
      if (typeof v16?.["getState"] === "function") return v16["getState"]();
      return {};
    },
    v25 = (v26, v27, v28) => {
      v16?.["updateViewport"]?.(v26, v27, v28);
    },
    v29 = () => {
      v16?.["markViewportPersist"]?.();
    },
    v30 = () => {
      const v31 =
        typeof v19?.["_v2UpdateSidePlusNow"] === "function"
          ? v19["_v2UpdateSidePlusNow"]
          : v19?.["_v2UpdateSidePlus"];
      if (typeof v31 === "function") {
        const v32 = Number(v19["_lastMx"]),
          v33 = Number(v19["_lastMy"]);
        v31(
          Number["isFinite"](v32) ? v32 : undefined,
          Number["isFinite"](v33) ? v33 : undefined,
        );
      }
    };
  function v34() {
    if (v22) v18?.();
    ((v22 = null), v23 !== null && (v21(v23), (v23 = null)));
  }
  function v35() {
    return v22 ? { ...v22 } : null;
  }
  function v36(v37) {
    if (!v37) return null;
    const v38 = v24(),
      v39 = v38?.["nodes"] || {},
      v40 = getBrowserViewportRect({
        windowObject: v19,
        containerEl: containerEl,
      });
    let v41 = null,
      v42 = { minZoom: minZoom, maxZoom: maxZoom };
    v37["type"] === "node-zoom-percent"
      ? ((v41 = computeNodesWorldBounds(v39, [v37["nodeId"]])),
        (v42["fixedZoom"] = resolveZoomPercent(v37["zoomPercent"])))
      : ((v41 = computeNodesWorldBounds(v39, v37["nodeIds"])),
        (v42["padding"] = v37["padding"]),
        (v42["maxZoom"] = _resolveMaxZoom(v37["options"], maxZoom)));
    if (!v41) return null;
    const v43 = computeViewportForWorldBounds(v41, v40, v42);
    if (!v43) return null;
    return {
      target: v43,
      viewport: v38?.["viewport"] || _getDefaultViewport(),
    };
  }
  function v44() {
    v23 = null;
    if (!v22) return false;
    const v45 = v36(v22);
    if (!v45) return (v34(), false);
    const { target: v46, viewport: v47 } = v45;
    if (
      v47["x"] === v46["x"] &&
      v47["y"] === v46["y"] &&
      v47["zoom"] === v46["zoom"]
    )
      return true;
    return (v18?.(), v25(v46["x"], v46["y"], v46["zoom"]), v29(), v30(), true);
  }
  function v48() {
    if (!v22 || v23 !== null) return;
    v23 = v20(() => {
      v44();
    });
  }
  function v49(v50) {
    const v51 = v36(v50);
    if (!v51) return (v34(), false);
    v22 = { ...v50 };
    const { viewport: v52, target: v53 } = v51;
    return (
      v17?.(
        v52["x"],
        v52["y"],
        v52["zoom"],
        v53["x"],
        v53["y"],
        v53["zoom"],
        v50["durationMs"],
      ),
      true
    );
  }
  function v54(v55, v56 = 120, v57 = 1500, v58 = null) {
    return v49({
      type: "nodes-fit",
      nodeIds: [v55],
      padding: v56,
      durationMs: v57,
      options: v58,
    });
  }
  function v59(v60, v61 = 80, v62 = 800, v63 = null) {
    if (!Array["isArray"](v60) || v60["length"] === 0) return (v34(), false);
    return v49({
      type: "nodes-fit",
      nodeIds: [...v60],
      padding: v61,
      durationMs: v62,
      options: v63,
    });
  }
  function v64(v65, v66 = 60, v67 = 800) {
    return v49({
      type: "node-zoom-percent",
      nodeId: v65,
      zoomPercent: v66,
      durationMs: v67,
    });
  }
  const v68 = () => v48();
  (v19?.["addEventListener"]?.("resize", v68),
    v19?.["visualViewport"]?.["addEventListener"]?.("resize", v68),
    v19?.["visualViewport"]?.["addEventListener"]?.("scroll", v68));
  function v69() {
    (v34(),
      v19?.["removeEventListener"]?.("resize", v68),
      v19?.["visualViewport"]?.["removeEventListener"]?.("resize", v68),
      v19?.["visualViewport"]?.["removeEventListener"]?.("scroll", v68));
  }
  return {
    focusNode: v54,
    focusNodes: v59,
    focusNodeAtZoomPercent: v64,
    clearTrackedFocus: v34,
    getTrackedFocusRequest: v35,
    reapplyTrackedFocusNow: v44,
    getBrowserViewportRect() {
      return getBrowserViewportRect({
        windowObject: v19,
        containerEl: containerEl,
      });
    },
    destroy: v69,
  };
}

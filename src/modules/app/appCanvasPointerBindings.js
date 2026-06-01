import {
  findClosestNode,
  hitTestNode,
  worldToScreen,
} from "../../core/math.js";
const CANVAS_UI_EXCLUSION_SELECTOR =
    ".header,\x20.sidebar-floating,\x20.canvas-controls-floating,\x20.empty-hint,\x20.fab-btn,\x20.mascot-wrap,\x20.node-add-menu,\x20.minimap-wrapper",
  PANEL_SCROLL_SELECTOR =
    ".canvas-proj-dropdown, .v2-asset-sidebar-panel, .v2-workflow-sidebar-panel, .v2-file-history-panel";
function selectVideoInteractionLockState(v0 = {}) {
  const v1 = v0["videoKeying"] || null,
    v2 = v0["videoClip"] || null,
    v3 = v1?.["active"] ? v1 : v2?.["active"] ? v2 : null;
  return { active: !!v3?.["active"], nodeId: v3?.["nodeId"] || null };
}
function getInitialState(v4) {
  if (typeof v4?.["getState"] === "function") return v4["getState"]() || {};
  return {};
}
function subscribeSelectorOrPrime(v5, v6, v7) {
  if (typeof v5?.["subscribeSelector"] === "function")
    return v5["subscribeSelector"](v6, v7);
  return (v7(v6(getInitialState(v5))), () => {});
}
function subscribeRawOrPrime(v8, v9) {
  if (typeof v8?.["subscribeRaw"] === "function") return v8["subscribeRaw"](v9);
  return (v9(getInitialState(v8)), () => {});
}
function getRequiredInteractionFunction(v10, v11) {
  const v12 = v10?.[v11];
  if (typeof v12 !== "function")
    throw new TypeError(
      "[appCanvasPointerBindings] missing interaction." + v11,
    );
  return v12;
}
export function createCanvasPointerStateCache({
  graphStore: v13,
  uiStore: v14,
} = {}) {
  const v15 = {
      nodes: {},
      videoInteractionLock: null,
      pickerVisible: false,
      annotateActive: false,
    },
    v16 = [
      subscribeRawOrPrime(v13, (v17) => {
        v15["nodes"] = v17?.["nodes"] || {};
      }),
      subscribeSelectorOrPrime(v14, selectVideoInteractionLockState, (v18) => {
        v15["videoInteractionLock"] = v18?.["active"] ? v18 : null;
      }),
      subscribeSelectorOrPrime(
        v14,
        (v19) => !!v19["picker"]?.["visible"],
        (v20) => {
          v15["pickerVisible"] = !!v20;
        },
      ),
      subscribeSelectorOrPrime(
        v14,
        (v21) => !!v21["annotate"]?.["active"],
        (v22) => {
          v15["annotateActive"] = !!v22;
        },
      ),
    ];
  return {
    cache: v15,
    dispose() {
      v16["forEach"]((v23) => v23?.());
    },
  };
}
function isVideoInteractionLocked(v24) {
  return !!v24["videoInteractionLock"]?.["active"];
}
function isPanoramaEditing(v25) {
  const v26 =
    v25?.["type"] === "panorama-360"
      ? v25?.["panorama360Node"]
      : v25?.["sceneNode"];
  return (
    (v25?.["type"] === "panorama-scene" || v25?.["type"] === "panorama-360") &&
    v25?.["isCollapsed"] !== true &&
    v26?.["ui"]?.["isEditing"] === true
  );
}
function blurActiveEditableForCanvasPointer(v27, v28) {
  if (!v27) return;
  if (v27["closest"]?.("input, textarea, [contenteditable='true']")) return;
  const v29 = v28?.["activeElement"];
  if (!v29) return;
  const v30 =
    v29["tagName"] === "INPUT" ||
    v29["tagName"] === "TEXTAREA" ||
    v29["contentEditable"] === "true";
  v30 && typeof v29["blur"] === "function" && v29["blur"]();
}
function isScrollableTextEditWheel(v31, v32) {
  const v33 = v31?.["closest"]?.(".source-text-content");
  if (!v33 || v32?.["activeElement"] !== v33) return false;
  return v33["scrollHeight"] > v33["clientHeight"];
}
function createLastPointerTracker(v34) {
  const v35 = {
    x: Number(v34?.["innerWidth"]) / 2 || 0,
    y: Number(v34?.["innerHeight"]) / 2 || 0,
  };
  function v36() {
    if (!v34) return;
    ((v34["_lastMx"] = v35["x"]), (v34["_lastMy"] = v35["y"]));
  }
  function v37(v38) {
    ((v35["x"] = v38["clientX"]), (v35["y"] = v38["clientY"]), v36());
  }
  return (
    v36(),
    {
      updateFromEvent: v37,
      getCursorScreenPosition() {
        return { x: v35["x"], y: v35["y"] };
      },
    }
  );
}
export function installAppCanvasPointerBindings({
  graphStore: v39,
  uiStore: v40,
  wrap: v41,
  appViewport: v42,
  interaction: v43,
  targetWindow: targetWindow = typeof window === "undefined" ? null : window,
  targetDocument: targetDocument = typeof document === "undefined"
    ? null
    : document,
} = {}) {
  const v44 = getRequiredInteractionFunction(v43, "getDragContext"),
    v45 = getRequiredInteractionFunction(v43, "handleContextMenu"),
    v46 = getRequiredInteractionFunction(v43, "handlePointerDown"),
    v47 = getRequiredInteractionFunction(v43, "handlePointerMove"),
    v48 = getRequiredInteractionFunction(v43, "handlePointerUp"),
    v49 = getRequiredInteractionFunction(v43, "handleWheel"),
    v50 = getRequiredInteractionFunction(v43, "initConnectionHandles"),
    v51 = getRequiredInteractionFunction(v43, "initPickConnect"),
    v52 = createCanvasPointerStateCache({ graphStore: v39, uiStore: v40 }),
    { cache: v53 } = v52,
    v54 = createLastPointerTracker(targetWindow),
    v55 = [];
  let v56 = null;
  function v57() {
    return targetDocument?.["getElementById"]?.("v2-wrap") || v41 || null;
  }
  function v58(v59, v60, v61, v62) {
    if (!v59 || typeof v59["addEventListener"] !== "function") return;
    (v59["addEventListener"](v60, v61, v62),
      v55["push"](() => v59["removeEventListener"]?.(v60, v61, v62)));
  }
  targetWindow &&
    (targetWindow["_mathImports"] = {
      findClosestNode: findClosestNode,
      worldToScreen: worldToScreen,
      hitTestNode: hitTestNode,
    });
  const v63 = v57();
  return (
    v51(v63),
    v50(v63),
    v58(
      targetWindow,
      "pointerdown",
      (v64) => {
        const v65 = v57();
        if (!v65 || !v65["contains"](v64["target"])) return;
        const v66 = v64["target"]?.["closest"]?.(".panorama-scene-viewport");
        if (v66) {
          const v67 = v66["closest"](".v2-node"),
            v68 = v67?.["id"] || "",
            v69 = v68 ? v53["nodes"]?.[v68] : null;
          if (isPanoramaEditing(v69)) return;
        }
        const v70 = v53["videoInteractionLock"];
        if (v70?.["active"]) {
          const v71 = v70["nodeId"]
            ? targetDocument?.["getElementById"]?.(v70["nodeId"])
            : null;
          if (v71 && v71["contains"](v64["target"])) return;
          (v64["preventDefault"](), v64["stopPropagation"]());
          return;
        }
        const v72 =
          v64["button"] === 1 ||
          (targetWindow?.["_spaceHeld"] && v64["button"] === 0);
        if (!v72) return;
        (v64["preventDefault"](),
          v64["stopPropagation"](),
          v42?.["clearTrackedFocus"]?.("pan-start"));
        if (targetWindow?.["_spaceHeld"])
          v65["style"]["cursor"] = "var(--grab-cursor)";
        const v73 = v44(),
          v74 = !!v73?.["isDragging"];
        try {
          (v65["setPointerCapture"](v64["pointerId"]),
            (v56 = v64["pointerId"]));
        } catch {}
        !v74 && v46(v64["clientX"], v64["clientY"], true, false, v64);
      },
      { capture: true },
    ),
    v58(v41, "pointerdown", (v75) => {
      v54["updateFromEvent"](v75);
      const v76 = v75["target"]?.["closest"]?.(CANVAS_UI_EXCLUSION_SELECTOR);
      if (v76) return;
      (blurActiveEditableForCanvasPointer(v75["target"], targetDocument),
        v40?.["hideContextMenu"]?.());
      const v77 = v53["videoInteractionLock"];
      if (v77?.["active"]) {
        const v78 = v77["nodeId"]
          ? targetDocument?.["getElementById"]?.(v77["nodeId"])
          : null;
        if (!v78 || !v78["contains"](v75["target"])) return;
        return;
      }
      const v79 = v75["altKey"] && !targetWindow?.["_spaceHeld"];
      if (v53["pickerVisible"]) {
        v40?.["hidePicker"]?.();
        return;
      }
      v46(v75["clientX"], v75["clientY"], false, v79, v75);
      if (v56 != null) return;
      const v80 = v44();
      v80["isPanning"] && v42?.["clearTrackedFocus"]?.("pan-start");
      if (
        v80["isPanning"] ||
        v80["isConnecting"] ||
        v80["isBoxSelecting"] ||
        v80["isDraggingCell"]
      )
        try {
          (v41["setPointerCapture"](v75["pointerId"]),
            (v56 = v75["pointerId"]));
        } catch {}
    }),
    v58(v41, "dblclick", () => {}),
    v58(v41, "contextmenu", (v81) => {
      if (v81["__aiCanvasGroupedEditableContextMenu"]) return;
      (v81["preventDefault"](),
        v81["target"]?.["closest"]?.(".v2-node") &&
          v45(v81["clientX"], v81["clientY"]));
    }),
    v58(v41, "pointermove", (v82) => {
      v54["updateFromEvent"](v82);
      if (isVideoInteractionLocked(v53)) return;
      v47(v82["clientX"], v82["clientY"], v82);
      if (v56 != null) return;
      const v83 = v44();
      if (v83["isDragging"] && v83["hasMoved"])
        try {
          (v41["setPointerCapture"](v82["pointerId"]),
            (v56 = v82["pointerId"]));
        } catch {}
    }),
    v58(v41, "pointerup", (v84) => {
      if (isVideoInteractionLocked(v53)) return;
      const v85 = v44(),
        v86 =
          !!v85?.["isDragging"] &&
          v84["button"] !== 0 &&
          (v84["buttons"] & 1) !== 0;
      if (v86) {
        if (targetWindow?.["_spaceHeld"])
          v41["style"]["cursor"] = "var(--grab-cursor)";
        return;
      }
      ((v56 = null), v48(v84["clientX"], v84["clientY"]));
      if (targetWindow?.["_spaceHeld"])
        v41["style"]["cursor"] = "var(--grab-cursor)";
    }),
    v58(v41, "pointercancel", (v87) => {
      v56 = null;
      if (isVideoInteractionLocked(v53)) return;
      v48(v87["clientX"], v87["clientY"]);
      if (targetWindow?.["_spaceHeld"])
        v41["style"]["cursor"] = "var(--grab-cursor)";
    }),
    v58(targetDocument, "pointerup", (v88) => {
      const v89 = v57(),
        v90 = v44(),
        v91 =
          !!v90?.["isDragging"] &&
          v88["button"] !== 0 &&
          (v88["buttons"] & 1) !== 0;
      if (v56 != null) {
        if (v91) return;
        v56 = null;
        return;
      }
      if (v89 && v89["contains"](v88["target"])) return;
      if (v91) return;
      (v48(),
        targetWindow?.["_spaceHeld"] &&
          v89 &&
          (v89["style"]["cursor"] = "var(--grab-cursor)"));
    }),
    v58(
      v41,
      "wheel",
      (v92) => {
        v54["updateFromEvent"](v92);
        const v93 = v92["target"];
        if (v93?.["closest"]?.(PANEL_SCROLL_SELECTOR)) return;
        const v94 = v93?.["tagName"],
          v95 =
            v94 === "INPUT" ||
            v94 === "TEXTAREA" ||
            v93?.["contentEditable"] === "true" ||
            v93?.["closest"]?.('[contenteditable="true"]');
        if (v95 || isScrollableTextEditWheel(v93, targetDocument)) return;
        v92["preventDefault"]();
        if (isVideoInteractionLocked(v53)) return;
        (v42?.["clearTrackedFocus"]?.("wheel-zoom"),
          v49(v92["clientX"], v92["clientY"], v92["deltaY"]));
      },
      { passive: false },
    ),
    v58(
      targetDocument,
      "wheel",
      (v96) => {
        const v97 = v96["target"];
        if (!v97) return;
        v54["updateFromEvent"](v96);
        const v98 = v97["closest"]?.(".side-plus-btn"),
          v99 =
            v97["closest"]?.("#v2-conn-scissor-btn") ||
            v97["closest"]?.(".conn-scissor-btn");
        if (!v98 && !v99) return;
        if (v53["annotateActive"]) return;
        (v96["preventDefault"](),
          v49(v96["clientX"], v96["clientY"], v96["deltaY"]));
      },
      { passive: false, capture: true },
    ),
    v58(v41, "mousedown", (v100) => {
      if (v100["button"] === 1) v100["preventDefault"]();
    }),
    {
      getCursorScreenPosition: v54["getCursorScreenPosition"],
      dispose() {
        (v55["splice"](0)["forEach"]((v101) => v101()), v52["dispose"]());
      },
    }
  );
}

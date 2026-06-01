import { normalizeWebPreviewUrl } from "../modules/webPreviewUrl.js";
const OCCLUSION_SELECTOR =
    ".header, .sidebar-floating, .canvas-controls-floating, .minimap-wrapper, .node-add-menu, .v2-node-picker, .canvas-proj-dropdown, .v2-asset-sidebar-panel, .v2-workflow-sidebar-panel",
  BACKGROUND_SYNC_INTERVAL_MS = 50,
  FINAL_INTERACTION_SYNC_DELAY_MS = 80,
  registeredSlotsByNodeId = new Map();
function normalizeNodeId(v0) {
  return String(v0 || "")["trim"]();
}
function getNowMs() {
  return globalThis["performance"]?.["now"]?.() || Date["now"]();
}
function getRequestAnimationFrame() {
  return (
    globalThis["window"]?.["requestAnimationFrame"]?.["bind"](
      globalThis["window"],
    ) || ((v1) => setTimeout(v1, 16))
  );
}
function getCancelAnimationFrame() {
  return (
    globalThis["window"]?.["cancelAnimationFrame"]?.["bind"](
      globalThis["window"],
    ) || clearTimeout
  );
}
function rectIntersects(v2, v3) {
  return (
    v2["left"] < v3["right"] &&
    v2["right"] > v3["left"] &&
    v2["top"] < v3["bottom"] &&
    v2["bottom"] > v3["top"]
  );
}
function isVisibleRect(v4) {
  const v5 = Number(v4?.["width"]) || 0,
    v6 = Number(v4?.["height"]) || 0;
  if (v5 < 16 || v6 < 16) return false;
  const v7 = globalThis["window"] || {},
    v8 = Number(v7["innerWidth"]) || 0,
    v9 = Number(v7["innerHeight"]) || 0;
  return (
    v4["left"] >= 0 && v4["top"] >= 0 && v4["right"] <= v8 && v4["bottom"] <= v9
  );
}
function collectOcclusionRects(v10 = document) {
  const v11 = v10["querySelectorAll"]?.(OCCLUSION_SELECTOR) || [],
    v12 = [];
  for (const v13 of v11) {
    if (!v13 || v13["hidden"]) continue;
    const v14 = globalThis["window"]?.["getComputedStyle"]?.(v13);
    if (v14?.["display"] === "none" || v14?.["visibility"] === "hidden")
      continue;
    const v15 = v13["getBoundingClientRect"]?.();
    if (v15) v12["push"](v15);
  }
  return v12;
}
function isOccludedByRects(v16, v17 = []) {
  return v17["some"]((v18) => rectIntersects(v16, v18));
}
function appendSlotToIndex(v19, v20) {
  const v21 = v20?.["dataset"]?.["nodeId"];
  if (!v21) return;
  const v22 = v19["get"](v21);
  if (v20["dataset"]["webPreviewFullscreen"] === "true") {
    v19["set"](v21, v20);
    return;
  }
  if (!v22) v19["set"](v21, v20);
}
function buildSlotIndex(v23 = document, v24 = []) {
  const v25 = new Map(),
    v26 = new Set();
  for (const v27 of registeredSlotsByNodeId["values"]()) {
    for (const v28 of v27) {
      if (!v28 || v28["isConnected"] === false || v26["has"](v28)) continue;
      (v26["add"](v28), appendSlotToIndex(v25, v28));
    }
  }
  if (v24["length"] > 0 && v24["every"]((v29) => v25["has"](v29))) return v25;
  const v30 =
    v23["querySelectorAll"]?.("[data-web-preview-slot=\x27true\x27]") || [];
  for (const v31 of v30) {
    if (!v31 || v26["has"](v31)) continue;
    (v26["add"](v31), appendSlotToIndex(v25, v31));
  }
  return v25;
}
export function registerWebPreviewSlot(v32, v33) {
  const v34 = normalizeNodeId(v32);
  if (!v34 || !v33) return () => {};
  let v35 = registeredSlotsByNodeId["get"](v34);
  return (
    !v35 && ((v35 = new Set()), registeredSlotsByNodeId["set"](v34, v35)),
    v35["add"](v33),
    () => {
      const v36 = registeredSlotsByNodeId["get"](v34);
      if (!v36) return;
      v36["delete"](v33);
      if (v36["size"] === 0) registeredSlotsByNodeId["delete"](v34);
    }
  );
}
export function _clearWebPreviewSlotRegistryForTest() {
  registeredSlotsByNodeId["clear"]();
}
function hasActiveWebPreviewNodes(v37) {
  const v38 =
    typeof v37?.["getStateRaw"] === "function"
      ? v37["getStateRaw"]()
      : v37?.["getState"]?.() || {};
  return Object["values"](v38["nodes"] || {})["some"](
    (v39) =>
      v39?.["type"] === "web-preview" && normalizeWebPreviewUrl(v39["webUrl"]),
  );
}
function normalizeCanvasZoom(v40) {
  const v41 = Number(v40);
  if (!Number["isFinite"](v41) || v41 <= 0) return 1;
  return Math["min"](5, Math["max"](0.25, v41));
}
function getCanvasInteractionState() {
  const v42 = globalThis["document"]?.["body"]?.["classList"],
    v43 = Boolean(v42?.["contains"]?.("is-zooming")),
    v44 = Boolean(v42?.["contains"]?.("is-panning")),
    v45 = Boolean(v42?.["contains"]?.("is-viewport-animating"));
  return { frozen: v43 || v44 || v45, deferZoomFactor: v43 || v45 };
}
function getSlotFullscreen(v46) {
  return v46?.["dataset"]?.["webPreviewFullscreen"] === "true";
}
function buildViewPayload({
  node: v47,
  webUrl: v48,
  slot: v49,
  selected: v50,
  canvasZoom: v51,
  blockerRects: v52,
  interactionState: v53,
  freezeToken: v54,
}) {
  let v55 = false,
    v56 = null;
  const v57 = getSlotFullscreen(v49);
  if (v49?.["isConnected"] !== false) {
    const v58 = v49?.["getBoundingClientRect"]?.();
    v58 &&
      isVisibleRect(v58) &&
      (v57 || !isOccludedByRects(v58, v52)) &&
      ((v55 = true),
      (v56 = {
        x: Math["round"](v58["left"]),
        y: Math["round"](v58["top"]),
        width: Math["round"](v58["width"]),
        height: Math["round"](v58["height"]),
      }));
  }
  const v59 = Boolean(v53["frozen"] && !v57 && v55);
  return {
    nodeId: v47["id"],
    webUrl: v48,
    visible: v55,
    bounds: v56,
    zoomFactor: v57 ? 1 : v51,
    deferZoomFactor: v57 ? false : v53["deferZoomFactor"],
    frozen: v59,
    freezeToken: v59 ? String(v54 || "0") : "",
    fullscreen: v57,
    selected: v50,
  };
}
function syncCachedViewsForBudget(v60, v61) {
  if (!v61) return v60;
  const v62 = getNowMs(),
    v63 = v60["some"]((v64) => v64?.["frozen"] || v64?.["deferZoomFactor"]),
    v65 = new Set(v60["map"]((v66) => v66["nodeId"]));
  for (const v67 of [...v61["cachedViewsByNodeId"]["keys"]()]) {
    if (!v65["has"](v67)) v61["cachedViewsByNodeId"]["delete"](v67);
  }
  if (!v63) {
    v61["lastBackgroundSyncAt"] = v62;
    for (const v68 of v60)
      v61["cachedViewsByNodeId"]["set"](v68["nodeId"], v68);
    return v60;
  }
  const v69 = v62 - v61["lastBackgroundSyncAt"] >= BACKGROUND_SYNC_INTERVAL_MS;
  if (v69) v61["lastBackgroundSyncAt"] = v62;
  return v60["map"]((v70) => {
    const v71 = v61["cachedViewsByNodeId"]["get"](v70["nodeId"]),
      v72 =
        v70["selected"] ||
        v70["fullscreen"] ||
        v69 ||
        !v71 ||
        v71["webUrl"] !== v70["webUrl"] ||
        v71["visible"] !== v70["visible"] ||
        v71["frozen"] !== v70["frozen"];
    if (v72)
      return (v61["cachedViewsByNodeId"]["set"](v70["nodeId"], v70), v70);
    return {
      ...v71,
      webUrl: v70["webUrl"],
      selected: v70["selected"],
      zoomFactor: v70["zoomFactor"],
      deferZoomFactor: v70["deferZoomFactor"],
      frozen: v70["frozen"],
      freezeToken: v70["freezeToken"],
      syncPriority: "background-throttled",
    };
  });
}
function clearFinalSyncTimer(v73) {
  if (!v73?.["finalSyncTimer"]) return;
  (clearTimeout(v73["finalSyncTimer"]), (v73["finalSyncTimer"] = null));
}
function createSyncBudgetState(v74) {
  const v75 = {
    cachedViewsByNodeId: new Map(),
    finalSyncTimer: null,
    freezeActive: false,
    freezeToken: 0,
    lastBackgroundSyncAt: 0,
    scheduleFinalSync() {
      (clearFinalSyncTimer(v75),
        (v75["finalSyncTimer"] = setTimeout(() => {
          ((v75["finalSyncTimer"] = null), v74());
        }, FINAL_INTERACTION_SYNC_DELAY_MS)));
    },
  };
  return v75;
}
function markInteractionTransition(v76, v77) {
  if (!v76) return;
  if (v77 && !v76["freezeActive"])
    ((v76["freezeToken"] += 1), (v76["lastBackgroundSyncAt"] = 0));
  else
    !v77 &&
      v76["freezeActive"] &&
      ((v76["lastBackgroundSyncAt"] = 0), v76["scheduleFinalSync"]());
  v76["freezeActive"] = v77;
}
function collectWebPreviewViews({
  graphStore: v78,
  root: root = document,
  freezeToken: freezeToken = 0,
} = {}) {
  const v79 =
      typeof v78?.["getStateRaw"] === "function"
        ? v78["getStateRaw"]()
        : v78?.["getState"]?.() || {},
    v80 = new Set(v79["selectedNodeIds"] || []),
    v81 = Object["values"](v79["nodes"] || {})
      ["filter"]((v82) => v82?.["type"] === "web-preview")
      ["map"]((v83) => ({
        node: v83,
        webUrl: normalizeWebPreviewUrl(v83["webUrl"]),
      }))
      ["filter"]((v84) => v84["webUrl"]),
    v85 = normalizeCanvasZoom(v79["viewport"]?.["zoom"]),
    v86 = buildSlotIndex(
      root,
      v81["map"]((v87) => v87["node"]["id"]),
    ),
    v88 = collectOcclusionRects(root),
    v89 = getCanvasInteractionState(),
    v90 = [];
  for (const { node: v91, webUrl: v92 } of v81) {
    const v93 = v86["get"](v91["id"]);
    v90["push"](
      buildViewPayload({
        node: v91,
        webUrl: v92,
        slot: v93,
        selected: v80["has"](v91["id"]),
        canvasZoom: v85,
        blockerRects: v88,
        interactionState: v89,
        freezeToken: freezeToken,
      }),
    );
  }
  return (
    v90["sort"](
      (v94, v95) => Number(v94["selected"]) - Number(v95["selected"]),
    ),
    v90
  );
}
export function initWebPreviewViewSyncService({
  graphStore: v96,
  root: root = document,
} = {}) {
  const v97 = globalThis["window"]?.["electronAPI"]?.["webPreview"];
  if (!v97 || typeof v97["syncViews"] !== "function") return { dispose() {} };
  const v98 = getRequestAnimationFrame(),
    v99 = getCancelAnimationFrame(),
    v100 =
      typeof v97["syncViewsFast"] === "function"
        ? v97["syncViewsFast"]
        : v97["syncViews"];
  let v101 = null,
    v102 = false,
    v103 = hasActiveWebPreviewNodes(v96),
    v104 = null;
  const v105 = () => {
      v101 = null;
      if (v102) return;
      const v106 = getCanvasInteractionState();
      markInteractionTransition(v104, v106["frozen"]);
      const v107 = syncCachedViewsForBudget(
        collectWebPreviewViews({
          graphStore: v96,
          root: root,
          freezeToken: v104?.["freezeToken"] || 0,
        }),
        v104,
      );
      try {
        const v108 = v100({ views: v107 });
        v108 &&
          typeof v108["catch"] === "function" &&
          void v108["catch"](() => {});
      } catch {}
    },
    v109 = () => {
      if (v102 || v101 !== null) return;
      v101 = v98(v105);
    };
  v104 = createSyncBudgetState(v109);
  const v110 = () => {
      if (!v103) return;
      v109();
    },
    v111 = () => {
      ((v103 = hasActiveWebPreviewNodes(v96)), v109());
    },
    v112 =
      typeof v96?.["subscribeRaw"] === "function"
        ? v96["subscribeRaw"](v111)
        : () => {},
    v113 =
      typeof v97["onEvent"] === "function"
        ? v97["onEvent"]((v114) => {
            globalThis["window"]?.["dispatchEvent"]?.(
              new CustomEvent("web-preview:native-event", { detail: v114 }),
            );
          })
        : () => {};
  return (
    globalThis["window"]?.["addEventListener"]?.("resize", v109),
    globalThis["window"]?.["addEventListener"]?.("scroll", v109, true),
    globalThis["window"]?.["addEventListener"]?.("pointermove", v110),
    globalThis["window"]?.["addEventListener"]?.("pointerup", v110),
    globalThis["window"]?.["addEventListener"]?.("pointercancel", v110),
    globalThis["window"]?.["addEventListener"]?.("wheel", v110, {
      passive: true,
    }),
    globalThis["window"]?.["addEventListener"]?.(
      "web-preview:force-sync",
      v109,
    ),
    v109(),
    {
      dispose() {
        ((v102 = true), clearFinalSyncTimer(v104));
        if (v101 !== null) v99(v101);
        ((v101 = null),
          v112?.(),
          v113?.(),
          globalThis["window"]?.["removeEventListener"]?.("resize", v109),
          globalThis["window"]?.["removeEventListener"]?.("scroll", v109, true),
          globalThis["window"]?.["removeEventListener"]?.("pointermove", v110),
          globalThis["window"]?.["removeEventListener"]?.("pointerup", v110),
          globalThis["window"]?.["removeEventListener"]?.(
            "pointercancel",
            v110,
          ),
          globalThis["window"]?.["removeEventListener"]?.("wheel", v110, {
            passive: true,
          }),
          globalThis["window"]?.["removeEventListener"]?.(
            "web-preview:force-sync",
            v109,
          ),
          void v97["disposeViews"]?.());
      },
    }
  );
}
export { collectWebPreviewViews };

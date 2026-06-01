import { getNodeClass, isNodeType } from "../modules/registry.js";
import {
  getRefKindByNodeType,
  getNodeWrapperExtraClasses,
  normalizeNodeType,
} from "../modules/nodeMeta.js";
import { getDragContext } from "./interaction.js";
import { getViewportPanPreview } from "./viewportPanPreview.js";
import { getAlignableSelectionNodes, computeSelectionBounds } from "./math.js";
import {
  isPerfProbeEnabled,
  recordEdgeRedrawSample,
  recordRenderFrameSample,
} from "../modules/perf/perfProbe.js";
import {
  buildVirtualizationCandidateSets,
  isNodeInsideViewportPadding,
  RENDERER_VIRTUALIZATION_CONFIG,
} from "./rendererVirtualization.js";
import { installNodeResizeGeometryPreviewer } from "./rendererResizePreview.js";
import { getAIGenerationDefaultSizeByType } from "../services/fileService.js";
import { buildGroupOutputMembershipSignature } from "../modules/groupDynamicOutput.js";
import {
  getMediaComposeButtonLabel,
  getSelectedMediaComposeKind,
} from "../modules/mediaComposeSelection.js";
import {
  createContextMenuEl as createContextMenuEl,
  createPickConnectBannerEl as createPickConnectBannerEl,
  renderContextMenu as renderContextMenu,
  renderPickConnectBanner as renderPickConnectBanner,
} from "./rendererOverlays.js";
import { createNodeDetailHydrationController } from "./rendererNodeDetailHydration.js";
import { resolveModelProvider } from "../manifests/index.js";
import { syncNodeMediaLodMode } from "./rendererNodeMediaLod.js";
import { buildRendererNodeSignature } from "./rendererNodeSignature.js";
import { syncNodeResultClass } from "./rendererNodeResultState.js";
import { syncNodeMediaMetricsDataset } from "../modules/nodeMediaMetrics.js";
const _componentMap = new Map(),
  _nodeDataSnapshotMap = new Map(),
  _wrapperMap = new Map();
let _msHiddenNodeIds = new Set();
const _multiSelectRenderCache = {
    geometrySig: "",
    runBtnDisabled: null,
    resetBtnVisible: null,
    composeBtnVisible: null,
    composeBtnKind: "",
  },
  _alignPanelRenderCache = { centerSig: "", buttonStateSig: "" },
  _mountedNodeIds = new Set(),
  _parkedNodeIds = new Set(),
  _parkedWrapperMap = new Map(),
  _pendingNodeDataMap = new Map(),
  _nodeTypeSnapshotMap = new Map(),
  _nodePinReasons = new Map();
function _isRendererInteractionBusy() {
  const v0 = getDragContext?.() || {};
  if (
    v0["isPanning"] ||
    v0["isDragging"] ||
    v0["isConnecting"] ||
    v0["isBoxSelecting"] ||
    v0["isDraggingCell"]
  )
    return true;
  const v1 =
    typeof document !== "undefined" ? document["body"]?.["classList"] : null;
  return !!(
    v1?.["contains"]?.("is-panning") ||
    v1?.["contains"]?.("is-zooming") ||
    v1?.["contains"]?.("is-viewport-animating")
  );
}
const _nodeDetailHydration = createNodeDetailHydrationController({
    getWrapper: (v2) => _wrapperMap["get"](v2),
    getParkedWrapper: (v3) => _parkedWrapperMap["get"](v3),
    getWrappers: () => _wrapperMap["values"](),
    getParkedWrappers: () => _parkedWrapperMap["values"](),
    isMounted: (v4) => _mountedNodeIds["has"](v4),
    isInteractionBusy: _isRendererInteractionBusy,
  }),
  _edgeDomCache = new Map(),
  _edgeEndpointSignatureCache = new Map(),
  _nodeToEdgeIds = new Map(),
  _incomingEdgeIdsByTarget = new Map(),
  SELECTION_RELATED_HIGHLIGHT_COLORS = Object["freeze"]([
    "white",
    "blue",
    "green",
    "cyan",
    "purple",
    "red",
    "yellow",
  ]);
let _edgeIndexRev = -1,
  _edgeEntriesRev = -1,
  _edgeEntriesSource = null,
  _edgeEntriesCache = [],
  _cachedContainerWidth = null,
  _cachedContainerHeight = null,
  _lastFullEdgeRenderSignature = "",
  _edgeDomClearedSinceLastFull = false,
  _lastVirtualCandidateSignature = "",
  _lastVirtualCandidateResult = null,
  _containerSizeSourceEl = null,
  _containerResizeObserver = null,
  _containerResizeHandler = null,
  _timerRafId = null,
  _currentSnapshot = null,
  _runningTimers = new Set(),
  _lastTimerSyncRev = -1;
function _hideTimer(v5) {
  const v6 = _wrapperMap["get"](v5),
    v7 = v6?.["__v2_timer_el"];
  if (!v7) return;
  v7["textContent"] = "";
  if (v7["style"]["display"] !== "none") v7["style"]["display"] = "none";
}
function _cancelTimerLoopIfNeeded() {
  (_timerRafId !== null &&
    typeof cancelAnimationFrame === "function" &&
    cancelAnimationFrame(_timerRafId),
    (_timerRafId = null));
}
function _ensureTimerLoopActive() {
  if (_runningTimers["size"] === 0) return;
  _timerRafId === null &&
    typeof requestAnimationFrame === "function" &&
    (_timerRafId = requestAnimationFrame(_updateTimers));
}
function _hasResolvedMediaValue(v8, v9) {
  return (
    !!v8 &&
    typeof v8 === "object" &&
    v9["some"]((v10) => !!String(v8?.[v10] || "")["trim"]())
  );
}
function _isResolvedSourceMediaNode(v11) {
  if (isNodeType(v11, "source-audio"))
    return _hasResolvedMediaValue(v11, [
      "src",
      "audioUrl",
      "localPath",
      "resultUrl",
    ]);
  if (
    !isNodeType(v11, "source-video") ||
    !!String(
      v11?.["rhTaskId"] ||
        v11?.["asyncTaskId"] ||
        v11?.["dreaminaSubmitId"] ||
        "",
    )["trim"]() ||
    v11?.["rhTaskRecovering"] === true ||
    v11?.["asyncTaskRecovering"] === true ||
    v11?.["dreaminaTaskRecovering"] === true
  )
    return false;
  const v12 = Array["isArray"](v11?.["videos"]) ? v11["videos"] : [];
  return (
    _hasResolvedMediaValue(v11, [
      "src",
      "videoUrl",
      "localPath",
      "displayLocalPath",
      "originalLocalPath",
      "resultUrl",
      "capturePreviewUrl",
    ]) ||
    v12["some"]((v13) =>
      _hasResolvedMediaValue(v13, [
        "url",
        "videoUrl",
        "localPath",
        "displayLocalPath",
        "originalLocalPath",
        "resultUrl",
        "sourceUrl",
      ]),
    )
  );
}
function _isRunningTimerNode(v14) {
  return !!(
    v14?.["generationStartTime"] &&
    v14["generationDuration"] == null &&
    !_isResolvedSourceMediaNode(v14)
  );
}
function _syncRunningTimerForNode(v15, v16, { hide: hide = false } = {}) {
  if (_isRunningTimerNode(v16)) {
    (_runningTimers["add"](v15), _ensureTimerLoopActive());
    return;
  }
  if (_runningTimers["delete"](v15) && hide) _hideTimer(v15);
  else hide && _hideTimer(v15);
  _runningTimers["size"] === 0 && _cancelTimerLoopIfNeeded();
}
function _updateTimers() {
  if (!_currentSnapshot || _runningTimers["size"] === 0) {
    _timerRafId = null;
    return;
  }
  const v17 = [];
  for (const v18 of _runningTimers) {
    const v19 = _currentSnapshot["nodes"]?.[v18];
    if (
      !v19 ||
      !v19["generationStartTime"] ||
      v19["generationDuration"] != null ||
      _isResolvedSourceMediaNode(v19)
    ) {
      v17["push"](v18);
      continue;
    }
    const v20 = _wrapperMap["get"](v18),
      v21 = v20?.["__v2_timer_el"];
    if (v21) {
      const v22 = Date["now"]() - v19["generationStartTime"];
      v21["textContent"] = _formatNodeTimerText(v19, v22);
      if (v21["style"]["display"] === "none") v21["style"]["display"] = "";
    }
  }
  v17["length"] > 0 &&
    v17["forEach"]((v23) => {
      (_runningTimers["delete"](v23), _hideTimer(v23));
    });
  if (_runningTimers["size"] === 0) {
    _timerRafId = null;
    return;
  }
  _timerRafId = requestAnimationFrame(_updateTimers);
}
function _syncRunningTimers(v24) {
  const v25 = Number["isFinite"](v24?.["_persistRev"])
    ? v24["_persistRev"]
    : Number["isFinite"](v24?.["_nodeCount"])
      ? v24["_nodeCount"]
      : 0;
  if (v25 === _lastTimerSyncRev) return;
  _lastTimerSyncRev = v25;
  const v26 = v24?.["nodes"] || {};
  for (const v27 of Array["from"](_runningTimers)) {
    _syncRunningTimerForNode(v27, v26[v27], { hide: true });
  }
  for (const [v28, v29] of Object["entries"](v26)) {
    if (!_isRunningTimerNode(v29)) continue;
    const v30 = String(v29?.["id"] || v28 || "")["trim"]();
    if (!v30) continue;
    _syncRunningTimerForNode(v30, v29);
  }
  _ensureTimerLoopActive();
}
function _clearRunningTimerState() {
  (_cancelTimerLoopIfNeeded(),
    _runningTimers["clear"](),
    (_lastTimerSyncRev = -1),
    (_currentSnapshot = null));
}
function _getNodePinSet(v31, v32 = false) {
  let v33 = _nodePinReasons["get"](v31);
  return (
    !v33 && v32 && ((v33 = new Set()), _nodePinReasons["set"](v31, v33)),
    v33 || null
  );
}
function _getPinnedNodeIds() {
  const v34 = new Set();
  for (const [v35, v36] of _nodePinReasons["entries"]()) {
    v36 && v36["size"] > 0 && v34["add"](v35);
  }
  return v34;
}
function _clearNodePin(v37) {
  _nodePinReasons["delete"](v37);
}
function _clearAnchoredUiForNode(v38) {
  if (!v38) return;
  const v39 = _componentMap["get"](v38);
  v39 && typeof v39["highlightCell"] === "function" && v39["highlightCell"](-1);
}
function _parkNode(v40) {
  const v41 = _wrapperMap["get"](v40);
  if (!v41) return null;
  return (
    _nodeDetailHydration["forgetNodeDetailHydration"](v40),
    _syncRunningTimerForNode(v40, null, { hide: true }),
    v41["isConnected"] && v41["remove"](),
    _mountedNodeIds["delete"](v40),
    _parkedNodeIds["add"](v40),
    _parkedWrapperMap["set"](v40, v41),
    _clearAnchoredUiForNode(v40),
    v41
  );
}
function _mountNode(v42, v43) {
  const v44 = _wrapperMap["get"](v42);
  if (!v44) return null;
  return (
    !v44["isConnected"] && v43["appendChild"](v44),
    _parkedWrapperMap["delete"](v42),
    _parkedNodeIds["delete"](v42),
    _mountedNodeIds["add"](v42),
    v44
  );
}
function _flushMountBatch(v45, v46) {
  if (!v45 || !v46) return;
  if (v46["childNodes"] && v46["childNodes"]["length"] === 0) return;
  v45["appendChild"](v46);
}
function _destroyNode(v47) {
  (_nodeDetailHydration["forgetNodeDetailHydration"](v47),
    _syncRunningTimerForNode(v47, null, { hide: true }));
  const v48 = _componentMap["get"](v47);
  try {
    v48 && typeof v48["unmount"] === "function" && v48["unmount"]();
  } catch {}
  const v49 = _wrapperMap["get"](v47) || _parkedWrapperMap["get"](v47);
  (v49 && v49["isConnected"] && v49["remove"](),
    _componentMap["delete"](v47),
    _nodeDataSnapshotMap["delete"](v47),
    _wrapperMap["delete"](v47),
    _mountedNodeIds["delete"](v47),
    _parkedNodeIds["delete"](v47),
    _parkedWrapperMap["delete"](v47),
    _pendingNodeDataMap["delete"](v47),
    _nodeTypeSnapshotMap["delete"](v47),
    _clearNodePin(v47));
}
function _syncRendererBridge() {
  if (typeof window === "undefined") return;
  ((window["v2Renderer"] = window["v2Renderer"] || {}),
    Object["assign"](window["v2Renderer"], {
      nodeInstances: _componentMap,
      wrapperMap: _wrapperMap,
      isNodeMounted(v50) {
        return !!(
          v50 &&
          _mountedNodeIds["has"](v50) &&
          _wrapperMap["get"](v50)?.["isConnected"]
        );
      },
      getMountedWrapper(v51) {
        if (!v51 || !_mountedNodeIds["has"](v51)) return null;
        const v52 = _wrapperMap["get"](v51);
        return v52?.["isConnected"] ? v52 : null;
      },
      getEdgeIdsForNode(v53) {
        if (!v53) return [];
        const v54 = _nodeToEdgeIds["get"](v53);
        return v54 ? Array["from"](v54) : [];
      },
      pinNode(v55, v56 = "src/ui/") {
        if (!v55) return;
        const v57 = _getNodePinSet(v55, true);
        v57["add"](String(v56 || "src/ui/"));
      },
      unpinNode(v58, v59 = "src/ui/") {
        if (!v58) return;
        const v60 = _getNodePinSet(v58, false);
        if (!v60) return;
        (v60["delete"](String(v59 || "src/ui/")),
          v60["size"] === 0 && _nodePinReasons["delete"](v58));
      },
    }));
}
function _rebuildEdgeIndex(v61) {
  (_nodeToEdgeIds["clear"](), _incomingEdgeIdsByTarget["clear"]());
  for (const v62 of Object["values"](v61 || {})) {
    if (!v62) continue;
    const v63 = v62["sourceId"],
      v64 = v62["targetId"];
    if (v63) {
      let v65 = _nodeToEdgeIds["get"](v63);
      (!v65 && ((v65 = new Set()), _nodeToEdgeIds["set"](v63, v65)),
        v65["add"](v62["id"]));
    }
    if (v64) {
      let v66 = _nodeToEdgeIds["get"](v64);
      !v66 && ((v66 = new Set()), _nodeToEdgeIds["set"](v64, v66));
      v66["add"](v62["id"]);
      let v67 = _incomingEdgeIdsByTarget["get"](v64);
      (!v67 && ((v67 = []), _incomingEdgeIdsByTarget["set"](v64, v67)),
        v67["push"](v62["id"]));
    }
  }
}
function _ensureEdgeIndex(v68, v69) {
  const v70 = typeof v69 === "number" ? v69 : 0;
  if (v70 === _edgeIndexRev) return;
  (_rebuildEdgeIndex(v68), (_edgeIndexRev = v70));
}
function _getEdgeEntries(v71, v72) {
  const v73 = typeof v72 === "number",
    v74 = v73 ? v72 : 0,
    v75 = v73
      ? v74 === _edgeEntriesRev
      : v74 === _edgeEntriesRev && v71 === _edgeEntriesSource;
  if (v75) return _edgeEntriesCache;
  return (
    (_edgeEntriesCache = Object["values"](v71 || {})),
    (_edgeEntriesRev = v74),
    (_edgeEntriesSource = v71 || null),
    _edgeEntriesCache
  );
}
function _buildSelectionRelatedSets(v76, v77) {
  const v78 =
      v76 instanceof Set ? v76 : new Set(Array["isArray"](v76) ? v76 : []),
    v79 = new Set(),
    v80 = new Set();
  if (v78["size"] === 0) return { relatedNodeIds: v79, relatedEdgeIds: v80 };
  for (const v81 of v78) {
    const v82 = _nodeToEdgeIds["get"](v81);
    if (!v82) continue;
    for (const v83 of v82) {
      if (!v83 || v80["has"](v83)) continue;
      const v84 = v77?.[v83];
      if (!v84?.["id"]) continue;
      const v85 = v84["sourceId"],
        v86 = v84["targetId"],
        v87 = v78["has"](v85),
        v88 = v78["has"](v86);
      if (!v87 && !v88) continue;
      v80["add"](v84["id"]);
      if (v85 && !v87) v79["add"](v85);
      if (v86 && !v88) v79["add"](v86);
    }
  }
  return { relatedNodeIds: v79, relatedEdgeIds: v80 };
}
function _normalizeSelectionRelatedHighlightColor(v89) {
  const v90 = String(v89 || "")["trim"]();
  return SELECTION_RELATED_HIGHLIGHT_COLORS["includes"](v90) ? v90 : "white";
}
function _syncContainerSizeCache(v91 = _containerSizeSourceEl) {
  const v92 = v91 || _containerSizeSourceEl || null,
    v93 = v92 ? Number(v92["clientWidth"]) : Number(window["innerWidth"]),
    v94 = v92 ? Number(v92["clientHeight"]) : Number(window["innerHeight"]);
  return (
    (_cachedContainerWidth = Number["isFinite"](v93)
      ? v93
      : Number(window["innerWidth"])),
    (_cachedContainerHeight = Number["isFinite"](v94)
      ? v94
      : Number(window["innerHeight"])),
    { width: _cachedContainerWidth, height: _cachedContainerHeight }
  );
}
function _nowMs() {
  return typeof performance !== "undefined" &&
    typeof performance["now"] === "function"
    ? performance["now"]()
    : Date["now"]();
}
function _hasCachedContainerSize() {
  return (
    Number["isFinite"](_cachedContainerWidth) &&
    Number["isFinite"](_cachedContainerHeight)
  );
}
function _getCachedContainerSize(v95 = _containerSizeSourceEl, v96 = {}) {
  const v97 = v95 || _containerSizeSourceEl || null,
    v98 = typeof ResizeObserver === "function" && !!_containerResizeObserver,
    v99 =
      v96?.["refresh"] === true ||
      !_hasCachedContainerSize() ||
      !v98 ||
      (v97 && _containerSizeSourceEl && v97 !== _containerSizeSourceEl);
  if (v99) return _syncContainerSizeCache(v97);
  return { width: _cachedContainerWidth, height: _cachedContainerHeight };
}
function _getEdgeContainerSize(v100) {
  const v101 = _nowMs(),
    v102 = _getCachedContainerSize(v100 || _containerSizeSourceEl),
    v103 = _nowMs();
  return {
    containerW: Number["isFinite"](v102["width"]) ? v102["width"] : 0,
    containerH: Number["isFinite"](v102["height"]) ? v102["height"] : 0,
    layoutReadMs: Math["max"](0, v103 - v101),
  };
}
function _invalidateFullEdgeRenderSignature({
  clearedDom: clearedDom = false,
} = {}) {
  ((_lastFullEdgeRenderSignature = ""),
    clearedDom && (_edgeDomClearedSinceLastFull = true));
}
function _syncEdgeHighlightClass(v104, v105, v106) {
  if (!v104?.["groupEl"]?.["classList"] || !v105) return;
  const v107 = !!v106?.["has"]?.(v105);
  if (v104["highlighted"] === v107) return;
  (v107
    ? v104["groupEl"]["classList"]["add"]("connection-highlighted")
    : v104["groupEl"]["classList"]["remove"]("connection-highlighted"),
    (v104["highlighted"] = v107));
}
function _formatEdgeSignatureNumber(v108) {
  const v109 = Number(v108);
  return Number["isFinite"](v109) ? v109["toFixed"](1) : "0.0";
}
function _appendSortedSetSignature(v110, v111, v112) {
  if (!(v112 instanceof Set) || v112["size"] === 0) {
    v110["push"](v111 + ":");
    return;
  }
  v110["push"](v111 + ":" + Array["from"](v112)["sort"]()["join"](","));
}
function _buildFullEdgeRenderSignature({
  edgeEntries: v113,
  nodes: v114,
  viewport: v115,
  dragOffsetCtx: v116,
  relatedEdgeIds: v117,
  containerW: v118,
  containerH: v119,
}) {
  const v120 = v115 || { x: 0, y: 0, zoom: 1 },
    v121 = v116?.["movedNodeIds"] instanceof Set ? v116["movedNodeIds"] : null,
    v122 = Number["isFinite"](v116?.["dx"]) ? v116["dx"] : 0,
    v123 = Number["isFinite"](v116?.["dy"]) ? v116["dy"] : 0,
    v124 = [
      "edge-full",
      "vp:" +
        _formatEdgeSignatureNumber(v120["x"]) +
        ":" +
        _formatEdgeSignatureNumber(v120["y"]) +
        ":" +
        _formatEdgeSignatureNumber(v120["zoom"] || 1),
      "box:" +
        _formatEdgeSignatureNumber(v118) +
        ":" +
        _formatEdgeSignatureNumber(v119),
      "drag:" +
        _formatEdgeSignatureNumber(v122) +
        ":" +
        _formatEdgeSignatureNumber(v123),
    ];
  (_appendSortedSetSignature(v124, "dragIds", v121),
    _appendSortedSetSignature(v124, "highlight", v117));
  for (const v125 of v113 || []) {
    if (!v125?.["id"]) continue;
    const v126 = v114?.[v125["sourceId"]],
      v127 = v114?.[v125["targetId"]];
    if (!v126 || !v127) {
      v124["push"](
        "e:" +
          v125["id"] +
          ":" +
          (v125["sourceId"] || "") +
          ":" +
          (v125["targetId"] || "") +
          ":missing",
      );
      continue;
    }
    const v128 = v121 && v121["has"](v125["sourceId"]) ? v122 : 0,
      v129 = v121 && v121["has"](v125["sourceId"]) ? v123 : 0,
      v130 = v121 && v121["has"](v125["targetId"]) ? v122 : 0,
      v131 = v121 && v121["has"](v125["targetId"]) ? v123 : 0,
      v132 = Number(v126["x"] || 0) + v128,
      v133 = Number(v126["y"] || 0) + v129,
      v134 = Number(v127["x"] || 0) + v130,
      v135 = Number(v127["y"] || 0) + v131,
      v136 = v132 + Number(v126["width"] ?? 0),
      v137 = v133 + Number(v126["height"] ?? 0) / 2,
      v138 = v134,
      v139 = v135 + Number(v127["height"] ?? 0) / 2;
    v124["push"](
      "e:" +
        v125["id"] +
        ":" +
        (v125["sourceId"] || "") +
        ":" +
        (v125["targetId"] || "") +
        ":" +
        _formatEdgeSignatureNumber(v136) +
        ":" +
        _formatEdgeSignatureNumber(v137) +
        ":" +
        _formatEdgeSignatureNumber(v138) +
        ":" +
        _formatEdgeSignatureNumber(v139),
    );
  }
  return v124["join"]("|");
}
function _normalizeSignaturePart(v140) {
  if (v140 === null || v140 === undefined) return null;
  if (typeof v140 === "number") return Number["isFinite"](v140) ? v140 : null;
  if (typeof v140 === "boolean") return v140;
  if (typeof v140 === "string") return v140;
  if (Array["isArray"](v140))
    return v140["map"]((v141) => _normalizeSignaturePart(v141));
  if (typeof v140 === "object") {
    const v142 = {};
    for (const v143 of Object["keys"](v140)["sort"]()) {
      v142[v143] = _normalizeSignaturePart(v140[v143]);
    }
    return v142;
  }
  return String(v140);
}
function _buildVirtualizationCandidateSignature({
  snapshotRev: v144,
  nodeCount: v145,
  viewport: v146,
  selectedNodeIds: v147,
  connOverlay: v148,
  pickConnectMode: v149,
  dragContext: v150,
  pinnedNodeIds: v151,
  containerW: v152,
  containerH: v153,
} = {}) {
  const v154 = Array["from"](
      v147 instanceof Set ? v147 : Array["isArray"](v147) ? v147 : [],
    )
      ["map"]((v155) => String(v155))
      ["sort"](),
    v156 = Array["from"](
      v151 instanceof Set ? v151 : Array["isArray"](v151) ? v151 : [],
    )
      ["map"]((v157) => String(v157))
      ["sort"]();
  return JSON["stringify"](
    _normalizeSignaturePart({
      snapshotRev: v144,
      nodeCount: v145,
      viewport: {
        x: Number["isFinite"](v146?.["x"]) ? v146["x"] : 0,
        y: Number["isFinite"](v146?.["y"]) ? v146["y"] : 0,
        zoom: Number["isFinite"](v146?.["zoom"]) ? v146["zoom"] : 1,
      },
      selectedNodeIds: v154,
      connOverlay: {
        srcId: v148?.["srcId"] ?? null,
        hoverId: v148?.["hoverId"] ?? null,
      },
      pickConnectMode: {
        active: !!v149?.["active"],
        sourceNodeId: v149?.["sourceNodeId"] ?? null,
        hoverNodeId: v149?.["hoverNodeId"] ?? null,
        handleDirection: v149?.["handleDirection"] ?? null,
      },
      dragContext: {
        isDragging: !!v150?.["isDragging"],
        targetNodeId: v150?.["targetNodeId"] ?? null,
        pendingDx: Number["isFinite"](v150?.["pendingDx"])
          ? v150["pendingDx"]
          : 0,
        pendingDy: Number["isFinite"](v150?.["pendingDy"])
          ? v150["pendingDy"]
          : 0,
      },
      pinnedNodeIds: v156,
      containerW: Number["isFinite"](v152) ? v152 : 0,
      containerH: Number["isFinite"](v153) ? v153 : 0,
    }),
  );
}
export function buildRendererVirtualizationSignature(v158 = {}) {
  return _buildVirtualizationCandidateSignature(v158);
}
function _notifyVirtualizationProbe(v159) {
  const v160 =
    typeof window !== "undefined"
      ? window["__rendererVirtualizationProbe"]
      : null;
  if (!v160 || typeof v160["onCandidateSignatureEvaluated"] !== "function")
    return;
  try {
    v160["onCandidateSignatureEvaluated"](v159);
  } catch {}
}
function _collectMovedNodeIds(v161, v162) {
  const v163 = new Set(v161["selectedNodeIds"] || []),
    v164 = v162?.["targetNodeId"] || null;
  if (v164) v163["add"](v164);
  const v165 = v161["_parentToChildren"] || {},
    v166 = Array["from"](v163);
  for (let v167 = 0; v167 < v166["length"]; v167++) {
    const v168 = v166[v167],
      v169 = v165[v168];
    if (!v169 || v169["size"] === 0) continue;
    for (const v170 of v169) {
      !v163["has"](v170) && (v163["add"](v170), v166["push"](v170));
    }
  }
  return v163;
}
function _resolveDragRenderOffset(v171, v172) {
  if (!v172?.["isDragging"]) return null;
  const v173 = _collectMovedNodeIds(v171, v172);
  if (!v173 || v173["size"] === 0) return null;
  return {
    movedNodeIds: v173,
    dx: Number["isFinite"](v172["pendingDx"]) ? v172["pendingDx"] : 0,
    dy: Number["isFinite"](v172["pendingDy"]) ? v172["pendingDy"] : 0,
  };
}
function _v2FormatNodeLabelText(v174) {
  const v175 = String(v174 || "")["trim"]();
  if (!v175) return "";
  const v176 = /^[\x00-\x7F]*$/["test"](v175);
  if (v176 && v175["length"] > 20) return v175["slice"](0, 20) + "...";
  return v175;
}
function _v2GetNodeLabelKind(v177) {
  const v178 = getRefKindByNodeType(v177);
  if (
    v178 === "text" ||
    v178 === "image" ||
    v178 === "video" ||
    v178 === "audio"
  )
    return v178;
  return "";
}
function _v2ClearNodeLabelTooltip(v179) {
  if (!v179) return;
  const v180 = (v181, v182 = "") => {
    if (typeof v179["removeAttribute"] === "function")
      v179["removeAttribute"](v181);
    else
      v179["attributes"] &&
        typeof v179["attributes"]["delete"] === "function" &&
        v179["attributes"]["delete"](v181);
    v182 &&
      v179["dataset"] &&
      v182 in v179["dataset"] &&
      delete v179["dataset"][v182];
  };
  v180("title");
  if ("title" in v179) v179["title"] = "";
  (v180("data-tooltip", "tooltip"),
    v180("data-tooltip-right", "tooltipRight"),
    v180("data-tooltip-source", "tooltipSource"),
    v180("data-native-title", "nativeTitle"));
}
function _v2SetNodeLabelContent(
  v183,
  {
    labelKind: v184,
    displayLabelText: v185,
    defaultName: v186,
    isBeta: v187,
    fullLabelText: v188,
  },
) {
  if (!v183) return;
  _v2ClearNodeLabelTooltip(v183);
  const v189 = [];
  if (v184) {
    const v190 = document["createElement"]("span");
    ((v190["className"] = "node-label-icon"),
      v190["setAttribute"]("aria-hidden", "true"),
      (v190["dataset"]["labelKind"] = v184),
      (v190["textContent"] = v184 === "text" ? "T" : ""),
      v189["push"](v190));
  }
  const v191 = document["createElement"]("span");
  ((v191["className"] = "node-label-text"),
    (v191["textContent"] = v185 || v186),
    v189["push"](v191));
  if (v187) {
    const v192 = document["createElement"]("span");
    ((v192["className"] = "v2-node-beta-pill"),
      (v192["textContent"] = "Beta"),
      v189["push"](v192),
      (v183["dataset"]["betaLabel"] = v188));
  } else {
    if ("betaLabel" in v183["dataset"]) delete v183["dataset"]["betaLabel"];
  }
  v183["replaceChildren"](...v189);
}
function _v2EscapeHtml(v193) {
  return String(v193 || "")["replace"](/[&<>"']/g, (v194) => {
    if (v194 === "&") return "&amp;";
    if (v194 === "<") return "&lt;";
    if (v194 === ">") return "&gt;";
    if (v194 === "\x22") return "&quot;";
    return "&#39;";
  });
}
function _getDreaminaTimerPhaseTitle(v195) {
  if (!v195 || !isNodeType(v195, "ai-video")) return "";
  const v196 =
    resolveModelProvider(v195["model"], v195["provider"], {
      allowPrefixInference: false,
    }) === "dreamina";
  if (!v196) return "";
  const v197 = String(v195["dreaminaTaskPhase"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v198 = String(v195["dreaminaTaskStatus"] || "")
      ["trim"]()
      ["toLowerCase"]();
  if (v197 === "failed" || v198 === "failed") return "查询失败";
  if (v197 === "syncing") return "同步结果中";
  if (v197 === "queued") return "排队中";
  if (v197 === "generating") return "生成中";
  if (v197 === "done") return "已完成";
  const v199 = String(v195["dreaminaTaskLabel"] || "")["trim"]();
  return v199 || "";
}
function _formatNodeTimerText(v200, v201) {
  const v202 = Math["max"](0, Number(v201) || 0),
    v203 = Math["floor"](v202 / 1000),
    v204 = Math["floor"]((v202 % 1000) / 100),
    v205 = v203 + "." + v204 + "s",
    v206 = _getDreaminaTimerPhaseTitle(v200);
  return v206 ? v206 + "\x20·\x20" + v205 : v205;
}
export function formatVideoMetaText({
  fps: v207,
  frames: v208,
  width: v209,
  height: v210,
} = {}) {
  const v211 = Number(v207),
    v212 = Number(v208);
  if (
    !Number["isFinite"](v211) ||
    v211 <= 0 ||
    !Number["isFinite"](v212) ||
    v212 <= 0
  )
    return "";
  const v213 =
      Math["abs"](v211 - Math["round"](v211)) < 0.01
        ? String(Math["round"](v211))
        : String(Number(v211["toFixed"](2))),
    v214 = Number(v209),
    v215 = Number(v210),
    v216 =
      Number["isFinite"](v214) &&
      v214 > 0 &&
      Number["isFinite"](v215) &&
      v215 > 0,
    v217 = Math["round"](v212) + "帧·" + v213 + "fps";
  if (!v216) return v217;
  return Math["round"](v214) + "×" + Math["round"](v215) + " · " + v217;
}
function _getGroupColorWithOpacity(v218, v219) {
  const v220 = v218["match"](/var\(--([^)]+)\)/);
  if (!v220) return v218;
  const v221 = v220[1];
  return "var(--" + v221 + "-" + v219 + ")";
}
export function clearRendererCache() {
  console["log"]("[Renderer]\x20执行全盘物理清盘...");
  const v222 = new Set([
    ..._componentMap["keys"](),
    ..._wrapperMap["keys"](),
    ..._parkedWrapperMap["keys"](),
    ..._mountedNodeIds,
    ..._parkedNodeIds,
  ]);
  for (const v223 of v222) {
    _destroyNode(v223);
  }
  (_clearRenderedEdgesFromDocument(),
    _msHiddenNodeIds["clear"](),
    (_multiSelectRenderCache["geometrySig"] = ""),
    (_multiSelectRenderCache["resetBtnVisible"] = null),
    (_multiSelectRenderCache["composeBtnVisible"] = null),
    (_multiSelectRenderCache["composeBtnKind"] = ""),
    (_alignPanelRenderCache["centerSig"] = ""),
    (_alignPanelRenderCache["buttonStateSig"] = ""),
    _edgeDomCache["clear"](),
    _edgeEndpointSignatureCache["clear"](),
    _nodeToEdgeIds["clear"](),
    _incomingEdgeIdsByTarget["clear"](),
    (_edgeIndexRev = -1),
    (_edgeEntriesRev = -1),
    (_edgeEntriesSource = null),
    (_edgeEntriesCache = []),
    (_cachedContainerWidth = null),
    (_cachedContainerHeight = null),
    (_lastFullEdgeRenderSignature = ""),
    (_edgeDomClearedSinceLastFull = false),
    (_lastVirtualCandidateSignature = ""),
    (_lastVirtualCandidateResult = null),
    (_containerSizeSourceEl = null),
    _nodePinReasons["clear"](),
    _pendingNodeDataMap["clear"](),
    _nodeTypeSnapshotMap["clear"](),
    _nodeDetailHydration["clearNodeDetailHydrationState"](),
    _clearRunningTimerState());
}
((window["_edgeDomCache"] = _edgeDomCache), _syncRendererBridge());
function _isNodeVisible(v224, v225, v226, v227, v228 = 0, v229 = 0) {
  return isNodeInsideViewportPadding(v224, v225, v226, v227, 200, v228, v229);
}
function _renderCullingOnly(v230, v231, v232) {
  const { width: v233, height: v234 } = _getCachedContainerSize(
    v230["parentElement"] || v230,
  );
  for (const v235 of Object["values"](v231 || {})) {
    const v236 = _wrapperMap["get"](v235["id"]);
    if (!v236 || !v236["isConnected"]) continue;
    const v237 = _isNodeVisible(v235, v232, v233, v234);
    if (!v237) {
      _syncRunningTimerForNode(v235["id"], null, { hide: true });
      if (v236["style"]["display"] !== "none")
        v236["style"]["display"] = "none";
    } else {
      _syncRunningTimerForNode(v235["id"], v235);
      if (v236["style"]["display"] === "none") v236["style"]["display"] = "";
    }
  }
}
export function initRenderer(v238, v239, v240) {
  ((v239["style"]["transformOrigin"] = "0 0"),
    (v239["style"]["position"] = "absolute"),
    (v239["style"]["top"] = "0"),
    (v239["style"]["left"] = "0"));
  const v241 = _createSvgLayer();
  v239["prepend"](v241);
  const v242 = v241["querySelector"]("svg");
  ((_containerSizeSourceEl = v239["parentElement"] || v238),
    _syncContainerSizeCache(_containerSizeSourceEl));
  typeof ResizeObserver === "function" &&
    _containerSizeSourceEl &&
    ((_containerResizeObserver = new ResizeObserver(() => {
      _syncContainerSizeCache(_containerSizeSourceEl);
    })),
    _containerResizeObserver["observe"](_containerSizeSourceEl));
  const v243 = _createPickerEl();
  v238["appendChild"](v243);
  const v244 = createPickConnectBannerEl();
  v238["appendChild"](v244);
  const v245 = _createMultiSelectBoxEl(v240);
  v239["appendChild"](v245);
  const v246 = _createAlignCenterPanelEl();
  v239["appendChild"](v246);
  const v247 = _createSelectionRectEl();
  v238["appendChild"](v247);
  const v248 = createContextMenuEl();
  (v238["appendChild"](v248), _syncRendererBridge());
  let v249 = null,
    v250 = null,
    v251 = -1,
    v252 = -1,
    v253 = 0,
    v254 = 0,
    v255 = 0,
    v256 = null,
    v257 = null;
  function v258() {
    (v256 !== null && (clearTimeout(v256), (v256 = null)),
      v257 !== null && (cancelAnimationFrame(v257), (v257 = null)));
  }
  function v259(v260 = RENDERER_VIRTUALIZATION_CONFIG["settleDelayMs"]) {
    (v258(),
      (v256 = setTimeout(
        () => {
          v256 = null;
          if (v257 !== null) return;
          v257 = requestAnimationFrame(() => {
            v257 = null;
            if (v249 !== null) return;
            if (!_currentSnapshot) return;
            if (_isRendererInteractionBusy()) {
              v259(v260);
              return;
            }
            v261(_currentSnapshot);
          });
        },
        Math["max"](0, v260),
      )));
  }
  installNodeResizeGeometryPreviewer(
    typeof window === "undefined" ? null : window,
    () => _currentSnapshot,
    _ensureEdgeIndex,
    _nodeToEdgeIds,
    (v262, v263, v264) =>
      _renderEdgesByIds(
        v242,
        v262,
        v264["edges"] || {},
        v263,
        v264["viewport"],
        v238,
      ),
  );
  function v265(v266) {
    const v267 =
        typeof v266["_nodeCount"] === "number"
          ? v266["_nodeCount"]
          : Object["keys"](v266["nodes"] || {})["length"],
      v268 = typeof v266["_edgesRev"] === "number" ? v266["_edgesRev"] : 0,
      v269 = v268 !== v252;
    (v267 !== v251 || v269) &&
      ((v251 = v267),
      (v252 = v268),
      _cleanupNodes(v239, v266["nodes"]),
      _cleanupEdges(v242, v266["edges"]));
    _ensureEdgeIndex(v266["edges"], v268);
    const v270 =
        v266["ui"]?.["selectionRelatedHighlightEnabled"] === false
          ? { relatedNodeIds: new Set(), relatedEdgeIds: new Set() }
          : _buildSelectionRelatedSets(v266["selectedNodeIds"], v266["edges"]),
      v271 = _normalizeSelectionRelatedHighlightColor(
        v266["ui"]?.["selectionRelatedHighlightColor"],
      ),
      v272 = _renderNodes(
        v239,
        v266["nodes"],
        v266["selectedNodeIds"],
        v270["relatedNodeIds"],
        v271,
        v266["connOverlay"],
        v266["pickConnectMode"],
        v266["viewport"],
        v266["edges"],
        v266["_parentToChildren"],
        v266["ui"] && typeof v266["ui"]["showVideoMeta"] === "boolean"
          ? v266["ui"]["showVideoMeta"]
          : false,
        v266,
      ),
      v273 = v266["edges"] || {},
      v274 = _getEdgeEntries(v273, v268),
      v275 = v274["length"],
      v276 = document["documentElement"],
      v277 = v275 >= 400;
    if (v277)
      !v276["classList"]["contains"]("has-many-edges") &&
        v276["classList"]["add"]("has-many-edges");
    else
      v276["classList"]["contains"]("has-many-edges") &&
        v276["classList"]["remove"]("has-many-edges");
    const v278 = getDragContext(),
      v279 = _resolveDragRenderOffset(v266, v278),
      v280 = v266["ui"]?.["connectionLinesVisible"] !== false;
    let v281 = null;
    function v282(v283 = false) {
      !v281 && (v281 = _getEdgeContainerSize(v238));
      const v284 = _buildFullEdgeRenderSignature({
        edgeEntries: v274,
        nodes: v266["nodes"],
        viewport: v266["viewport"],
        dragOffsetCtx: v279,
        relatedEdgeIds: v270["relatedEdgeIds"],
        containerW: v281["containerW"],
        containerH: v281["containerH"],
      });
      if (!v283 && v284 === _lastFullEdgeRenderSignature) return null;
      return { containerSize: v281, renderSignature: v284 };
    }
    if (!v280) _clearRenderedEdges(v242);
    else {
      if (v269) {
        if (v269) _ensureEdgeIndex(v266["edges"], v268);
        const v285 = v282(true);
        _renderEdges(
          v242,
          v273,
          v266["nodes"],
          v266["viewport"],
          v238,
          v279,
          v270["relatedEdgeIds"],
          v274,
          "edges-rev-changed",
          v285,
        );
      } else {
        if (v278["isDragging"]) {
          _ensureEdgeIndex(v266["edges"], v268);
          const v286 =
              v279?.["movedNodeIds"] || _collectMovedNodeIds(v266, v278),
            v287 = new Set();
          for (const v288 of v286) {
            const v289 = _nodeToEdgeIds["get"](v288);
            if (!v289) continue;
            for (const v290 of v289) v287["add"](v290);
          }
          if (v287["size"] > 0)
            _renderEdgesByIds(
              v242,
              v287,
              v273,
              v266["nodes"],
              v266["viewport"],
              v238,
              v279,
              v270["relatedEdgeIds"],
              { containerSize: v281 || null },
            );
          else {
            if (!v286 || v286["size"] === 0) {
              const v291 = v282(false);
              v291 &&
                _renderEdges(
                  v242,
                  v273,
                  v266["nodes"],
                  v266["viewport"],
                  v238,
                  v279,
                  v270["relatedEdgeIds"],
                  v274,
                  "drag-related-edges-unavailable",
                  v291,
                );
            }
          }
        } else {
          const v292 = v282(false);
          v292 &&
            _renderEdges(
              v242,
              v273,
              v266["nodes"],
              v266["viewport"],
              v238,
              v279,
              v270["relatedEdgeIds"],
              v274,
              "steady",
              v292,
            );
        }
      }
    }
    (_renderPicker(v243, v266["picker"], v240),
      _renderSelectionRect(v247, v266["selectionBox"]),
      _renderMultiSelectBox(
        v245,
        v266["selectedNodeIds"],
        v266["nodes"],
        v266["viewport"],
        v266["ui"]?.["imageVideoNodeResizeEnabled"] === true,
      ),
      _renderAlignCenterPanel(
        v246,
        v266["selectedNodeIds"],
        v266["nodes"],
        v266["ui"],
      ),
      renderContextMenu(v248, v266["contextMenu"]),
      renderPickConnectBanner(v244, v266["pickConnectMode"]),
      v272 && v259(0));
  }
  function v261(v293) {
    if (!v293) return;
    const v294 = isPerfProbeEnabled(),
      v295 =
        v294 &&
        typeof performance !== "undefined" &&
        typeof performance["now"] === "function"
          ? performance["now"]()
          : 0;
    let v296 = "steady";
    try {
      const v297 = getDragContext(),
        v298 = v297["isPanning"]
          ? getViewportPanPreview() || v293["viewport"]
          : v293["viewport"];
      _renderViewport(
        v239,
        v298,
        v293["ui"]?.["titleFollowsCanvasZoom"] === true,
      );
      if (document["body"]["classList"]["contains"]("is-viewport-animating")) {
        v296 = "viewport-animating";
        const v299 = performance["now"]();
        v299 - v254 > 120 &&
          ((v254 = v299),
          _renderCullingOnly(v239, v293["nodes"], v293["viewport"]));
        if (v241["style"]["display"] === "none") v241["style"]["display"] = "";
        v259();
        return;
      }
      if (v297["isPanning"]) {
        v296 = "panning";
        const v300 = performance["now"]();
        v300 - v253 > 80 &&
          ((v253 = v300), _renderCullingOnly(v239, v293["nodes"], v298));
        if (v241["style"]["display"] === "none") v241["style"]["display"] = "";
        v259();
        return;
      }
      if (document["body"]["classList"]["contains"]("is-zooming")) {
        v296 = "zooming";
        const v301 = performance["now"]();
        v301 - v255 > 120 &&
          ((v255 = v301),
          _renderCullingOnly(v239, v293["nodes"], v293["viewport"]));
        if (v241["style"]["display"] === "none") v241["style"]["display"] = "";
        v259();
        return;
      }
      v258();
      if (v241["style"]["display"] === "none") v241["style"]["display"] = "";
      (v265(v293), _nodeDetailHydration["resumeNodeDetailHydration"]());
    } finally {
      if (
        v294 &&
        typeof performance !== "undefined" &&
        typeof performance["now"] === "function"
      ) {
        const v302 =
          typeof v293["_nodeCount"] === "number"
            ? v293["_nodeCount"]
            : Object["keys"](v293["nodes"] || {})["length"];
        recordRenderFrameSample({
          mode: v296,
          durationMs: performance["now"]() - v295,
          nodeCount: v302,
          edgeCount: Object["keys"](v293["edges"] || {})["length"],
          mountedNodeCount: _mountedNodeIds["size"],
          parkedNodeCount: _parkedNodeIds["size"],
        });
      }
    }
  }
  function v303(v304) {
    if (!v304) return false;
    const v305 = _currentSnapshot,
      v306 = v305?.["nodes"]?.[v304];
    if (!v306) return false;
    const v307 = _componentMap["get"](v304),
      v308 = _wrapperMap["get"](v304);
    if (!v307 || typeof v307["update"] !== "function") return false;
    if (!_mountedNodeIds["has"](v304) || !v308?.["isConnected"]) return false;
    const v309 = new Set(v305["selectedNodeIds"] || []),
      v310 = v309["has"](v304),
      v311 = _buildSelectionRelatedSets(v309, v305["edges"] || {})[
        "relatedNodeIds"
      ],
      v312 = !v310 && v311["has"](v304),
      v313 = _getIncomingEdgeSignature(
        v304,
        v305["edges"] || {},
        v305["nodes"] || {},
      );
    syncNodeMediaLodMode(v308, v306, v305["viewport"]);
    const v314 = buildRendererNodeSignature({
      node: v306,
      inEdgeSig: v313,
      pickMode: v305["pickConnectMode"],
      isSelected: v310,
      isSelectionRelated: v312,
      showVideoMeta: v305["ui"]?.["showVideoMeta"] === true,
      viewport: v305["viewport"],
    });
    return (
      _pendingNodeDataMap["delete"](v304),
      _nodeDataSnapshotMap["set"](v304, v314),
      v307["update"](v306),
      true
    );
  }
  function v315(v316) {
    const v317 = Array["isArray"](v316) ? v316 : [v316];
    let v318 = false;
    for (const v319 of new Set(v317["filter"](Boolean))) {
      v318 = v303(v319) || v318;
    }
    return v318;
  }
  typeof window !== "undefined" &&
    ((window["v2Renderer"] = window["v2Renderer"] || {}),
    Object["assign"](window["v2Renderer"], {
      flushNode: v303,
      flushNodes: v315,
    }));
  const v320 = v240["subscribeRaw"]((v321) => {
      ((_currentSnapshot = v321), (v250 = v321));
      if (v249 !== null) return;
      v249 = requestAnimationFrame(() => {
        v249 = null;
        const v322 = v250;
        ((v250 = null), _syncRunningTimers(v322), v261(v322));
      });
    }),
    v323 = () => {
      (v320(),
        v258(),
        _containerResizeObserver &&
          (_containerResizeObserver["disconnect"](),
          (_containerResizeObserver = null)),
        (_containerResizeHandler = null),
        (_containerSizeSourceEl = null),
        _nodeDetailHydration["clearNodeDetailHydrationState"](),
        _clearRunningTimerState(),
        v249 !== null && (cancelAnimationFrame(v249), (v249 = null)),
        (v250 = null),
        v241?.["remove"]?.(),
        v243?.["remove"]?.(),
        v244?.["remove"]?.(),
        v245?.["remove"]?.(),
        v246?.["remove"]?.(),
        v247?.["remove"]?.(),
        v248?.["remove"]?.());
    };
  return v323;
}
function _renderViewport(v324, v325, v326 = false) {
  !v324["_willChangeSet"] &&
    ((v324["style"]["willChange"] = "transform"),
    (v324["_willChangeSet"] = true));
  const v327 = "0 0";
  v324["style"]["transformOrigin"] !== v327 &&
    (v324["style"]["transformOrigin"] = v327);
  const v328 =
    "translate3d(" +
    v325["x"] +
    "px, " +
    v325["y"] +
    "px, 0) scale(" +
    v325["zoom"] +
    ")";
  (v324["_lastTransform"] !== v328 &&
    ((v324["style"]["transform"] = v328), (v324["_lastTransform"] = v328)),
    _syncZoomCssVars(v325["zoom"], v326));
}
let _lastZoomInv = null,
  _lastZoomInvRaw = null,
  _lastNodeLabelComp = null,
  _lastNodeLabelCompAt = 0;
function _syncZoomCssVars(v329, v330 = false) {
  const v331 =
    typeof document !== "undefined" ? document["documentElement"] : null;
  if (!v331) return;
  const v332 =
      typeof document !== "undefined" && document && document["body"]
        ? document["body"]
        : null,
    v333 =
      typeof performance !== "undefined" &&
      performance &&
      typeof performance["now"] === "function"
        ? performance["now"]()
        : Date["now"](),
    v334 = 0.2 + 0.05 * 1.8,
    v335 = typeof v329 === "number" && isFinite(v329) ? v329 : 1,
    v336 = v335 > 0 ? v335 : 1,
    v337 = Math["min"](1 / v336, 1 / v334),
    v338 = 1 / v336,
    v339 = v335 > 0 ? Math["pow"](1 / v335, 0.35) : 1,
    v340 = v330 === true ? Math["min"](v339, 1.6) : 1;
  _lastZoomInv !== v337 &&
    ((_lastZoomInv = v337), v331["style"]["setProperty"]("--zoom-inv", v337));
  _lastZoomInvRaw !== v338 &&
    ((_lastZoomInvRaw = v338),
    v331["style"]["setProperty"]("--zoom-inv-raw", v338));
  const v341 =
    v330 === true && !!(v332 && v332["classList"]["contains"]("is-zooming"));
  if (v341 && v333 - _lastNodeLabelCompAt < 120 && _lastNodeLabelComp !== null)
    return;
  (_lastNodeLabelComp !== v340 &&
    ((_lastNodeLabelComp = v340),
    v331["style"]["setProperty"]("--node-label-comp", v340)),
    (_lastNodeLabelCompAt = v333));
}
function _buildGroupOutputOrderSignature(v342, v343) {
  const v344 = [],
    v345 = Array["isArray"](v342?.["groupOutputSourceOrder"])
      ? v342["groupOutputSourceOrder"]
          ["map"]((v346) => String(v346 || "")["trim"]())
          ["join"](">")
      : "";
  if (v345) v344["push"]("global:" + v345);
  const v347 = String(v343 || "")["trim"](),
    v348 = v342?.["groupOutputSourceOrderByTarget"],
    v349 =
      v347 &&
      v348 &&
      typeof v348 === "object" &&
      !Array["isArray"](v348) &&
      Array["isArray"](v348[v347])
        ? v348[v347]["map"]((v350) => String(v350 || "")["trim"]())["join"](">")
        : "";
  if (v349) v344["push"]("target:" + v349);
  return v344["join"]("|");
}
function _getIncomingEdgeSignature(v351, v352, v353) {
  const v354 = [],
    v355 = String(v353?.[v351]?.["parentId"] || "")["trim"](),
    v356 = [["direct", v351]];
  if (v355 && isNodeType(v353?.[v355], "group"))
    v356["push"](["shared:" + v355, v355]);
  for (const [v357, v358] of v356) {
    for (const v359 of _incomingEdgeIdsByTarget["get"](v358) || []) {
      const v360 = v352?.[v359];
      if (!v360 || v360["targetId"] !== v358) continue;
      const v361 = v353?.[v360["sourceId"]],
        v362 = typeof v361?.["_bizRev"] === "number" ? v361["_bizRev"] : 0,
        v363 = String(v360["refSlot"] || ""),
        v364 = _buildGroupOutputOrderSignature(v360, v351);
      v354["push"](
        v357 +
          ":" +
          v360["id"] +
          ":" +
          v360["sourceId"] +
          ":" +
          v363 +
          ":" +
          v362 +
          ":" +
          buildGroupOutputMembershipSignature(v361, v353) +
          ":" +
          v364,
      );
    }
  }
  return v354["join"](",");
}
function _getDefaultNodeLabel(v365) {
  let v366 = "节点";
  if (v365["type"]["includes"]("image")) v366 = "图片";
  else {
    if (v365["type"]["includes"]("video")) v366 = "视频";
    else {
      if (v365["type"]["includes"]("audio")) v366 = "音频";
      else {
        if (v365["type"]["includes"]("text")) v366 = "文本";
      }
    }
  }
  return v366;
}
function _getNodeRenderZIndex(v367, v368) {
  if (isNodeType(v367, "group")) return "auto";
  if (isNodeType(v367, "debug")) return "1200";
  if (
    isNodeType(v367, "media-clip") &&
    v367?.["mediaClip"]?.["expanded"] === true
  )
    return "12000";
  if (v367?.["isImagesExpanded"] || v367?.["isVideosExpanded"]) return "140";
  return v368 ? "100" : "10";
}
function _createNodeRuntime(v369, v370, v371, v372) {
  const v373 = v369["id"],
    v374 = document["getElementById"](v373);
  v374 && !_wrapperMap["has"](v373) && v374["remove"]();
  const v375 = document["createElement"]("div");
  ((v375["id"] = v373),
    (v375["dataset"]["nodeId"] = v373),
    syncNodeMediaMetricsDataset(v375, v369));
  let v376 = "v2-node node";
  const v377 = normalizeNodeType(v369["type"]),
    v378 = getNodeWrapperExtraClasses(v377);
  if (v378) v376 += "\x20" + v378;
  v375["className"] = v376;
  const v379 = v370["has"](v373);
  v379 && v375["classList"]["add"]("selected", "v2-selected");
  (Object["assign"](v375["style"], {
    position: "absolute",
    top: "0",
    left: "0",
    width: v369["width"] + "px",
    height: v369["height"] + "px",
    transform: "translate(" + v369["x"] + "px, " + v369["y"] + "px)",
    zIndex: _getNodeRenderZIndex(v369, v379),
    display: "flex",
    flexDirection: "column",
  }),
    (v375["_posKey"] =
      v369["x"] +
      "," +
      v369["y"] +
      "," +
      v369["width"] +
      "," +
      v369["height"]));
  v371["isDragging"] &&
    v372 &&
    v372["has"](v373) &&
    (v371["hasMoved"] || !v371["wasSelectedOnDown"]) &&
    v375["classList"]["add"]("is-ui-hidden");
  if (isNodeType(v369, "group")) {
    const v380 = v369["color"] || "var(--indigo)";
    ((v375["style"]["borderColor"] = _getGroupColorWithOpacity(v380, "60")),
      (v375["style"]["backgroundColor"] = _getGroupColorWithOpacity(
        v380,
        "05",
      )),
      v375["style"]["setProperty"]("--current-group-color", v380));
  }
  if (!isNodeType(v369, ["group", "comment-note"])) {
    const v381 = document["createElement"]("div");
    ((v381["className"] = "node-label"), (v381["dataset"]["nodeId"] = v373));
    const v382 = _v2GetNodeLabelKind(v377);
    if (v382) v381["dataset"]["labelKind"] = v382;
    const v383 = _getDefaultNodeLabel(v369),
      v384 = false,
      v385 =
        v369["name"] ||
        (v384
          ? isNodeType(v369, "ai-video")
            ? "生成视频"
            : "生成音频"
          : v383),
      v386 = _v2FormatNodeLabelText(v385);
    ((v381["dataset"]["fullName"] = v385),
      (v381["dataset"]["defaultName"] = v383),
      (v381["dataset"]["isBeta"] = v384 ? "1" : "0"),
      _v2SetNodeLabelContent(v381, {
        labelKind: v382,
        displayLabelText: v386,
        defaultName: v383,
        isBeta: v384,
        fullLabelText: v385,
      }),
      v375["appendChild"](v381),
      (v375["__v2_name_el"] = v381));
    const v387 = document["createElement"]("div");
    ((v387["className"] = "node-timer"),
      (v387["dataset"]["nodeId"] = v373),
      (v387["style"]["position"] = "absolute"),
      (v387["style"]["bottom"] = "calc(100% + 8px)"),
      (v387["style"]["right"] = "0"),
      (v387["style"]["fontSize"] = "13px"),
      (v387["style"]["fontWeight"] = "600"),
      (v387["style"]["color"] = "var(--text-primary)"),
      (v387["style"]["padding"] = "2px\x208px"),
      (v387["style"]["whiteSpace"] = "nowrap"),
      (v387["style"]["userSelect"] = "none"),
      (v387["style"]["pointerEvents"] = "none"),
      (v387["style"]["zIndex"] = "10"),
      (v387["style"]["maxWidth"] = "100%"),
      (v387["style"]["borderRadius"] = "6px"),
      (v387["style"]["transition"] = "all 0.2s"),
      (v387["style"]["background"] = "transparent"),
      (v387["style"]["border"] = "1px solid transparent"),
      (v387["style"]["display"] = "none"),
      (v387["textContent"] = ""),
      v375["appendChild"](v387),
      (v375["__v2_timer_el"] = v387));
    if (isNodeType(v369, ["source-video", "ai-video"])) {
      const v388 = document["createElement"]("div");
      ((v388["className"] = "node-video-meta"),
        (v388["dataset"]["nodeId"] = v373),
        (v388["dataset"]["visible"] = "0"),
        (v388["textContent"] = ""),
        v375["appendChild"](v388),
        (v375["__v2_video_meta_el"] = v388));
    }
  }
  const v389 = getNodeClass(v369["type"]),
    v390 = new v389(v369),
    v391 = v390["mount"]();
  return (
    v391 &&
      (v391["classList"]["add"]("v2-node-component"),
      (v391["style"]["flex"] = "1"),
      (v391["style"]["width"] = "100%"),
      (v391["style"]["minHeight"] = "0"),
      (v391["style"]["minWidth"] = "0"),
      (v391["style"]["display"] = "flex"),
      (v391["style"]["flexDirection"] = "column"),
      (v391["style"]["overflow"] =
        v377 === "storyboard" ||
        v377 === "storyboard-script" ||
        v377 === "collage" ||
        v377 === "media-clip" ||
        v377 === "panorama-scene" ||
        v377 === "panorama-360"
          ? "visible"
          : "hidden"),
      v375["appendChild"](v391)),
    _componentMap["set"](v373, v390),
    _wrapperMap["set"](v373, v375),
    _nodeTypeSnapshotMap["set"](v373, v377),
    { wrapperEl: v375, instance: v390 }
  );
}
function _ensureVideoMetaEl(v392, v393) {
  if (!v392["__v2_video_meta_el"]) {
    const v394 = document["createElement"]("div");
    ((v394["className"] = "node-video-meta"),
      (v394["dataset"]["nodeId"] = v393),
      (v394["dataset"]["visible"] = "0"),
      (v394["textContent"] = ""),
      v392["appendChild"](v394),
      (v392["__v2_video_meta_el"] = v394));
  }
}
function _syncMountedNodePresentation({
  wrapperEl: v395,
  node: v396,
  nodeId: v397,
  selectedNodeSet: v398,
  connOverlay: v399,
  pickMode: v400,
  viewport: v401,
  containerW: v402,
  containerH: v403,
  dragContext: v404,
  dragTargets: v405,
  showVideoMeta: v406,
  relatedNodeIds: v407,
  relatedHighlightColor: v408,
  inEdgeSig: v409,
  signature: v410,
}) {
  const v411 =
      v396["x"] + "," + v396["y"] + "," + v396["width"] + "," + v396["height"],
    v412 = v395["_posKey"] !== v411,
    v413 = v404?.["isDragging"] && v405 && v405["has"](v397),
    v414 = v413
      ? Number["isFinite"](v404["pendingDx"])
        ? v404["pendingDx"]
        : 0
      : 0,
    v415 = v413
      ? Number["isFinite"](v404["pendingDy"])
        ? v404["pendingDy"]
        : 0
      : 0,
    v416 = _isNodeVisible(v396, v401, v402, v403, v414, v415),
    v417 = _componentMap["get"](v397);
  (syncNodeMediaLodMode(v395, v396, v401),
    syncNodeMediaMetricsDataset(v395, v396));
  v412 &&
    ((v395["_posKey"] = v411),
    (!v405 || !v405["has"](v397)) &&
      (v395["style"]["transform"] =
        "translate(" + v396["x"] + "px, " + v396["y"] + "px)"),
    (v395["style"]["width"] = v396["width"] + "px"),
    (v395["style"]["height"] = v396["height"] + "px"));
  isNodeType(v396, ["source-video", "ai-video"]) &&
    _ensureVideoMetaEl(v395, v397);
  v404["isDragging"]
    ? v405 &&
      v405["has"](v397) &&
      (v404["hasMoved"] || !v404["wasSelectedOnDown"]) &&
      v395["classList"]["add"]("is-ui-hidden")
    : v395["classList"]["remove"]("is-ui-hidden");
  if (!v416) {
    v417 &&
      typeof v417["syncSelectionState"] === "function" &&
      v417["syncSelectionState"]({
        selected: false,
        singleSelected: false,
        visible: false,
      });
    _syncRunningTimerForNode(v397, null, { hide: true });
    v395["style"]["display"] !== "none" && (v395["style"]["display"] = "none");
    v417 &&
      v417["update"] &&
      v410 !== _nodeDataSnapshotMap["get"](v397) &&
      (_nodeDataSnapshotMap["set"](v397, v410), v417["update"](v396));
    return;
  }
  v395["style"]["display"] === "none" && (v395["style"]["display"] = "");
  const v418 = v398["has"](v397),
    v419 = !v418 && v407?.["has"](v397),
    v420 = v395["classList"]["contains"]("selected");
  v418 !== v420 &&
    (v418
      ? v395["classList"]["add"]("selected", "v2-selected")
      : (v395["classList"]["remove"]("selected", "v2-selected"),
        (v395["style"]["outline"] = "")));
  if (v419) {
    v395["classList"]["add"]("selection-related");
    const v421 =
      "selection-related-color-" +
      _normalizeSelectionRelatedHighlightColor(v408);
    for (const v422 of SELECTION_RELATED_HIGHLIGHT_COLORS) {
      const v423 = "selection-related-color-" + v422;
      if (v423 !== v421) v395["classList"]["remove"](v423);
    }
    v395["classList"]["add"](v421);
  } else {
    v395["classList"]["remove"]("selection-related");
    for (const v424 of SELECTION_RELATED_HIGHLIGHT_COLORS) {
      v395["classList"]["remove"]("selection-related-color-" + v424);
    }
  }
  _nodeDetailHydration["isNodeDetailActive"]({
    node: v396,
    nodeId: v397,
    isSelected: v418,
    connOverlay: v399,
    pickMode: v400,
    relatedNodeIds: v407,
  }) && _nodeDetailHydration["hydrateNodeDetails"](v397, v395);
  v417 &&
    typeof v417["syncSelectionState"] === "function" &&
    v417["syncSelectionState"]({
      selected: v418,
      singleSelected: v398["size"] === 1,
      visible: true,
    });
  const v425 = _getNodeRenderZIndex(v396, v418);
  v395["style"]["zIndex"] !== v425 && (v395["style"]["zIndex"] = v425);
  if (isNodeType(v396, "group")) {
    const v426 = v396["color"] || "var(--indigo)",
      v427 = _getGroupColorWithOpacity(v426, "60"),
      v428 = _getGroupColorWithOpacity(v426, "05");
    (v395["style"]["borderColor"] !== v427 &&
      (v395["style"]["borderColor"] = v427),
      v395["style"]["backgroundColor"] !== v428 &&
        (v395["style"]["backgroundColor"] = v428),
      v395["style"]["getPropertyValue"]("--current-group-color") !== v426 &&
        v395["style"]["setProperty"]("--current-group-color", v426));
  }
  const v429 = v395["__v2_name_el"],
    v430 = v429 ? _v2GetNodeLabelKind(normalizeNodeType(v396["type"])) : "";
  if (v429) {
    if (v430) {
      if (v429["dataset"]["labelKind"] !== v430)
        v429["dataset"]["labelKind"] = v430;
    } else
      "labelKind" in v429["dataset"] && delete v429["dataset"]["labelKind"];
  }
  if (v429 && v429["contentEditable"] !== "true") {
    const v431 = _getDefaultNodeLabel(v396),
      v432 = false,
      v433 =
        v396["name"] ||
        (v432
          ? isNodeType(v396, "ai-video")
            ? "生成视频"
            : "生成音频"
          : v431),
      v434 = _v2FormatNodeLabelText(v433);
    ((v429["dataset"]["fullName"] = v433), _v2ClearNodeLabelTooltip(v429));
    const v435 = v429["querySelector"](".node-label-icon"),
      v436 = v429["querySelector"](".node-label-text"),
      v437 = v434 || v431,
      v438 = v435?.["dataset"]["labelKind"] || "";
    (v438 !== v430 ||
      v436?.["textContent"] !== v437 ||
      (v432
        ? v429["dataset"]["betaLabel"] !== v433
        : "betaLabel" in v429["dataset"])) &&
      _v2SetNodeLabelContent(v429, {
        labelKind: v430,
        displayLabelText: v434,
        defaultName: v431,
        isBeta: v432,
        fullLabelText: v433,
      });
  }
  const v439 = v395["__v2_timer_el"];
  if (v439) {
    let v440 = "",
      v441 = false;
    const v442 = _isResolvedSourceMediaNode(v396);
    if (
      !v442 &&
      v396["generationStartTime"] &&
      v396["generationDuration"] == null
    ) {
      const v443 = Date["now"]() - v396["generationStartTime"];
      ((v440 = _formatNodeTimerText(v396, v443)), (v441 = true));
    } else
      !v442 &&
        typeof v396["generationDuration"] === "number" &&
        ((v440 = _formatNodeTimerText(v396, v396["generationDuration"])),
        (v441 = true));
    v441
      ? (v439["textContent"] !== v440 && (v439["textContent"] = v440),
        (v439["style"]["color"] = v418
          ? "var(--text-primary)"
          : "var(--white-40)"),
        v439["style"]["display"] === "none" && (v439["style"]["display"] = ""))
      : (v439["textContent"] && (v439["textContent"] = ""),
        v439["style"]["display"] !== "none" &&
          (v439["style"]["display"] = "none"));
  }
  _syncRunningTimerForNode(v397, v396);
  const v444 = v395["__v2_video_meta_el"];
  if (v444) {
    if (!v406) {
      if (v444["dataset"]["visible"] !== "0") v444["dataset"]["visible"] = "0";
    } else {
      const v445 = Number(v396["videoFps"]),
        v446 = Number(v396["videoFrameCount"]),
        v447 = Number(v396["videoWidth"]),
        v448 = Number(v396["videoHeight"]),
        v449 =
          Number["isFinite"](v445) &&
          v445 > 0 &&
          Number["isFinite"](v446) &&
          v446 > 0,
        v450 = v449 ? "1" : "0";
      v444["dataset"]["visible"] !== v450 &&
        (v444["dataset"]["visible"] = v450);
      if (v449) {
        const v451 = formatVideoMetaText({
          fps: v445,
          frames: v446,
          width: v447,
          height: v448,
        });
        v444["textContent"] !== v451 && (v444["textContent"] = v451);
      }
    }
  }
  v417 &&
    v417["update"] &&
    v410 !== _nodeDataSnapshotMap["get"](v397) &&
    (_nodeDataSnapshotMap["set"](v397, v410), v417["update"](v396));
  const v452 = v400 && v400["active"] && v397 === v400["sourceNodeId"],
    v453 = isNodeType(v396, "storyboard") && v396["isEditing"];
  if ((v399 && v399["srcId"]) || v452 || v453) {
    if (v397 === v399?.["srcId"] || v452 || v453)
      (v395["classList"]["add"]("conn-src"),
        v395["classList"]["remove"]("conn-invalid"));
    else
      v399?.["invalidNodeIds"]?.["includes"](v397)
        ? (v395["classList"]["add"]("conn-invalid"),
          v395["classList"]["remove"]("conn-src"))
        : v395["classList"]["remove"]("conn-invalid", "conn-src");
  } else v395["classList"]["remove"]("conn-invalid", "conn-src");
  if (v452 || v453)
    (v395["style"]["setProperty"](
      "box-shadow",
      "0 0 0 2px var(--white-70), 0 0 20px 0 var(--white-40)",
      "important",
    ),
      v395["style"]["setProperty"]("border-radius", "16px", "important"));
  else
    v395["style"]["getPropertyPriority"]("box-shadow") === "important" &&
      (v395["style"]["removeProperty"]("box-shadow"),
      v395["style"]["removeProperty"]("border-radius"));
  const v454 = v400 && v400["active"] && v400["hoverNodeId"] === v397;
  if ((v399 && v399["hoverId"] === v397) || v454) {
    if (!v395["classList"]["contains"]("conn-hoverTarget")) {
      v395["classList"]["add"]("conn-hoverTarget");
      const v455 = window["getComputedStyle"](v395)["borderRadius"];
      let v456 = parseFloat(v455);
      if (isNaN(v456) || v456 <= 0) v456 = 16;
      v395["style"]["setProperty"]("--hover-br", v456 + 4 + "px");
    }
    let v457 = false;
    if (v399 && v399["side"] === "left") v457 = true;
    else v454 && v400 && v400["handleDirection"] === "left" && (v457 = true);
    v457
      ? (v395["classList"]["add"]("conn-hover-output"),
        v395["classList"]["remove"]("conn-hover-input"))
      : (v395["classList"]["add"]("conn-hover-input"),
        v395["classList"]["remove"]("conn-hover-output"));
  } else
    v395["classList"]["contains"]("conn-hoverTarget") &&
      (v395["classList"]["remove"](
        "conn-hoverTarget",
        "conn-hover-input",
        "conn-hover-output",
      ),
      v395["style"]["removeProperty"]("--hover-br"));
  syncNodeResultClass(v395, v396, isNodeType);
}
function _renderNodes(
  v458,
  v459,
  v460,
  v461,
  v462,
  v463,
  v464,
  v465,
  v466,
  v467,
  v468,
  v469 = null,
) {
  const v470 = v464,
    v471 = v465 || { x: 0, y: 0, zoom: 1 },
    v472 = v466 || {},
    v473 = v467 || {},
    v474 = v468 !== false,
    v475 = getDragContext(),
    v476 = v460 instanceof Set ? v460 : new Set(v460 || []);
  let v477 = null;
  if (v475["isDragging"] && v475["targetNodeId"]) {
    const v478 = v476["has"](v475["targetNodeId"])
        ? Array["from"](v476)
        : [v475["targetNodeId"]],
      v479 = new Set(v478),
      v480 = [...v478];
    while (v480["length"] > 0) {
      const v481 = v480["pop"](),
        v482 = v473[v481];
      if (!v482) continue;
      for (const v483 of v482) {
        if (v479["has"](v483)) continue;
        (v479["add"](v483), v480["push"](v483));
      }
    }
    v477 = v479;
  }
  const { width: v484, height: v485 } = _getCachedContainerSize(
      v458["parentElement"] || v458,
    ),
    v486 = Number["isFinite"](v469?.["_persistRev"])
      ? v469["_persistRev"]
      : Number["isFinite"](v469?.["_nodeCount"])
        ? v469["_nodeCount"]
        : Object["keys"](v459 || {})["length"],
    v487 = _getPinnedNodeIds(),
    v488 = _buildVirtualizationCandidateSignature({
      snapshotRev: v486,
      nodeCount: Object["keys"](v459 || {})["length"],
      viewport: v471,
      selectedNodeIds: v460,
      connOverlay: v463,
      pickConnectMode: v470,
      dragContext: v475,
      pinnedNodeIds: v487,
      containerW: v484,
      containerH: v485,
    });
  let v489 = _lastVirtualCandidateResult;
  const v490 = v488 === _lastVirtualCandidateSignature && !!v489;
  !v490 &&
    ((v489 = buildVirtualizationCandidateSets({
      nodes: v459,
      viewport: v471,
      containerWidth: v484,
      containerHeight: v485,
      selectedNodeIds: v460,
      connOverlay: v463,
      pickConnectMode: v470,
      dragContext: v475,
      parentToChildren: v473,
      pinnedNodeIds: v487,
    })),
    (_lastVirtualCandidateSignature = v488),
    (_lastVirtualCandidateResult = v489));
  _notifyVirtualizationProbe({
    signature: v488,
    cacheHit: v490,
    snapshotRev: v486,
    containerW: v484,
    containerH: v485,
  });
  const { mountCandidateIds: v491, parkCandidateIds: v492 } = v489;
  let v493 = RENDERER_VIRTUALIZATION_CONFIG["batchSize"],
    v494 = false,
    v495 = null;
  for (const v496 of Object["values"](v459 || {})) {
    if (!v496?.["id"]) continue;
    const v497 = v496["id"];
    let v498 = _wrapperMap["get"](v497),
      v499 = _componentMap["get"](v497);
    const v500 = normalizeNodeType(v496["type"]),
      v501 = _nodeTypeSnapshotMap["get"](v497);
    v498 &&
      v499 &&
      v501 &&
      v501 !== v500 &&
      (_destroyNode(v497), (v498 = null), (v499 = null));
    const v502 = _mountedNodeIds["has"](v497) && !!v498?.["isConnected"],
      v503 = v491["has"](v497) || (v502 && !v492["has"](v497));
    let v504 = false;
    if (!v503) {
      if (v498 && v499) {
        const v505 = _pendingNodeDataMap["get"](v497);
        (!v505 || v505["node"] !== v496) &&
          _pendingNodeDataMap["set"](v497, { node: v496, signature: null });
      }
      v502 &&
        v492["has"](v497) &&
        (v493 > 0 ? (_parkNode(v497), (v493 -= 1)) : (v494 = true));
      continue;
    }
    const v506 = v476["has"](v497),
      v507 = !v506 && v461?.["has"]?.(v497);
    if (!v499 || !v498) {
      if (v493 <= 0) {
        v494 = true;
        continue;
      }
      (({ wrapperEl: v498, instance: v499 } = _createNodeRuntime(
        v496,
        v476,
        v475,
        v477,
      )),
        !v495 && (v495 = document["createDocumentFragment"]()),
        _mountNode(v497, v495),
        (v504 = true),
        (v493 -= 1));
    } else {
      if (!v502) {
        if (v493 <= 0) {
          v494 = true;
          continue;
        }
        (!v495 && (v495 = document["createDocumentFragment"]()),
          _mountNode(v497, v495),
          (v504 = true),
          (v493 -= 1));
      }
    }
    v504 &&
      _nodeDetailHydration["syncNodeDetailMountStage"]({
        wrapperEl: v498,
        node: v496,
        nodeId: v497,
        isSelected: v506,
        connOverlay: v463,
        pickMode: v470,
        relatedNodeIds: v461,
        viewport: v471,
        mountCandidateCount: v491["size"],
      });
    const v508 = _pendingNodeDataMap["get"](v497),
      v509 = v508?.["node"] || v496,
      v510 = _getIncomingEdgeSignature(v497, v472, v459),
      v511 = buildRendererNodeSignature({
        node: v509,
        inEdgeSig: v510,
        pickMode: v470,
        isSelected: v506,
        isSelectionRelated: v507,
        showVideoMeta: v474,
        viewport: v471,
      });
    (_syncMountedNodePresentation({
      wrapperEl: v498,
      node: v509,
      nodeId: v497,
      selectedNodeSet: v476,
      connOverlay: v463,
      pickMode: v470,
      viewport: v471,
      containerW: v484,
      containerH: v485,
      dragContext: v475,
      dragTargets: v477,
      showVideoMeta: v474,
      relatedNodeIds: v461,
      relatedHighlightColor: v462,
      inEdgeSig: v510,
      signature: v511,
    }),
      v508 && _pendingNodeDataMap["delete"](v497));
  }
  return (_flushMountBatch(v458, v495), v494);
}
function _cleanupNodes(v512, v513) {
  let v514 = false;
  const v515 = new Set(Object["keys"](v513 || {})),
    v516 = new Set([
      ..._componentMap["keys"](),
      ..._wrapperMap["keys"](),
      ..._parkedWrapperMap["keys"](),
      ..._mountedNodeIds,
      ..._parkedNodeIds,
    ]);
  for (const v517 of v516) {
    !v515["has"](v517) && (_destroyNode(v517), (v514 = true));
  }
  v512["querySelectorAll"](".v2-node")["forEach"]((v518) => {
    const v519 = v518["id"] || v518["dataset"]["nodeId"];
    v519 && !v515["has"](v519) && (v518["remove"](), (v514 = true));
  });
  if (v514) {
    const v520 = document["getElementById"]("v2-side-plus-holder");
    v520 && v520["children"]["length"] > 0 && v520["replaceChildren"]();
  }
}
const _EDGE_SVG_NS = "http://www.w3.org/2000/svg";
function _cubicBezierPoint(v520a, v520b, v520c, v520d, v520e, v520f, v520g, v520h, v520i = 0.5) {
  const v520j = 1 - v520i,
    v520k = v520i * v520i,
    v520l = v520j * v520j;
  return {
    x:
      v520l * v520j * v520a +
      3 * v520l * v520i * v520c +
      3 * v520j * v520k * v520e +
      v520k * v520i * v520g,
    y:
      v520l * v520j * v520b +
      3 * v520l * v520i * v520d +
      3 * v520j * v520k * v520f +
      v520k * v520i * v520h,
  };
}
function _createConnectionDeleteButton() {
  const v520m = document["createElementNS"](_EDGE_SVG_NS, "g");
  (v520m["setAttribute"]("class", "connection-delete-btn"),
    v520m["setAttribute"]("data-ui-stop", "1"));
  const v520n = document["createElementNS"](_EDGE_SVG_NS, "circle");
  (v520n["setAttribute"]("class", "scissor-bg"),
    v520n["setAttribute"]("r", "14"),
    v520n["setAttribute"]("cx", "0"),
    v520n["setAttribute"]("cy", "0"),
    v520n["setAttribute"]("fill", "var(--bg-elevated, #16181c)"),
    v520n["setAttribute"]("stroke", "var(--white-10)"),
    v520n["setAttribute"]("stroke-width", "1"));
  const v520o = document["createElementNS"](_EDGE_SVG_NS, "g");
  v520o["setAttribute"]("transform", "translate(-8,-8)");
  const v520p = (v520q, v520r) => {
    const v520s = document["createElementNS"](_EDGE_SVG_NS, v520q);
    for (const [v520t, v520u] of Object["entries"](v520r))
      v520s["setAttribute"](v520t, v520u);
    return v520s;
  };
  (v520o["appendChild"](
    v520p("circle", { cx: "6", cy: "6", r: "3", fill: "none", stroke: "#fff", "stroke-width": "2.5" }),
  ),
    v520o["appendChild"](
      v520p("circle", { cx: "6", cy: "18", r: "3", fill: "none", stroke: "#fff", "stroke-width": "2.5" }),
    ),
    v520o["appendChild"](
      v520p("line", {
        x1: "20",
        y1: "4",
        x2: "8.12",
        y2: "15.88",
        stroke: "#fff",
        "stroke-width": "2.5",
        "stroke-linecap": "round",
      }),
    ),
    v520o["appendChild"](
      v520p("line", {
        x1: "14.47",
        y1: "14.48",
        x2: "20",
        y2: "20",
        stroke: "#fff",
        "stroke-width": "2.5",
        "stroke-linecap": "round",
      }),
    ),
    v520o["appendChild"](
      v520p("line", {
        x1: "8.12",
        y1: "8.12",
        x2: "12",
        y2: "12",
        stroke: "#fff",
        "stroke-width": "2.5",
        "stroke-linecap": "round",
      }),
    ),
    v520m["appendChild"](v520n),
    v520m["appendChild"](v520o));
  return v520m;
}
function _ensureConnectionDeleteButton(v520v, v520w) {
  if (v520v["deleteBtnEl"]?.["isConnected"]) return v520v["deleteBtnEl"];
  const v520x = _createConnectionDeleteButton();
  return (
    v520w["appendChild"](v520x),
    (v520v["deleteBtnEl"] = v520x),
    v520x
  );
}
function _positionConnectionDeleteButton(v520y, v520z, v521a) {
  v520y &&
    v520y["setAttribute"](
      "transform",
      "translate(" + v520z + "," + v521a + ")",
    );
}
function _createSvgLayer() {
  const v521 = document["createElement"]("div");
  ((v521["id"] = "v2-edges-wrapper"),
    (v521["style"]["position"] = "absolute"),
    (v521["style"]["top"] = "0"),
    (v521["style"]["left"] = "0"),
    (v521["style"]["width"] = "100%"),
    (v521["style"]["height"] = "100%"),
    (v521["style"]["pointerEvents"] = "none"),
    (v521["style"]["zIndex"] = "11"));
  const v522 = document["createElementNS"]("http://www.w3.org/2000/svg", "svg");
  return (
    (v522["id"] = "v2-edges"),
    (v522["style"]["overflow"] = "visible"),
    (v522["style"]["pointerEvents"] = "none"),
    v521["appendChild"](v522),
    v521
  );
}
function _renderEdgesByIds(
  v523,
  v524,
  v525,
  v526,
  v527,
  v528,
  v529 = null,
  v530 = null,
  v531 = {},
) {
  const v532 = _nowMs(),
    v533 = v527 || { x: 0, y: 0, zoom: 1 },
    v534 = v531?.["containerSize"] || _getEdgeContainerSize(v528),
    v535 = v534["containerW"],
    v536 = v534["containerH"],
    v537 = _nowMs(),
    v538 = 200,
    v539 = v529?.["movedNodeIds"] instanceof Set ? v529["movedNodeIds"] : null,
    v540 = Number["isFinite"](v529?.["dx"]) ? v529["dx"] : 0,
    v541 = Number["isFinite"](v529?.["dy"]) ? v529["dy"] : 0;
  function v542(v543, v544, v545, v546) {
    const { x: v547, y: v548, zoom: v549 } = v533,
      v550 = v543 * v549 + v547,
      v551 = v544 * v549 + v548,
      v552 = v545 * v549 + v547,
      v553 = v546 * v549 + v548,
      v554 = Math["min"](v550, v552),
      v555 = Math["min"](v551, v553),
      v556 = Math["max"](v550, v552),
      v557 = Math["max"](v551, v553);
    return (
      v556 > -v538 && v554 < v535 + v538 && v557 > -v538 && v555 < v536 + v538
    );
  }
  const v558 = [];
  let v559 = 0,
    v560 = 0,
    v561 = 0,
    v562 = 0,
    v563 = 0;
  for (const v564 of v524) {
    const v565 = v525[v564];
    if (!v565) continue;
    const v566 = v526[v565["sourceId"]],
      v567 = v526[v565["targetId"]];
    if (!v566 || !v567) continue;
    const v568 = v539 && v539["has"](v565["sourceId"]) ? v540 : 0,
      v569 = v539 && v539["has"](v565["sourceId"]) ? v541 : 0,
      v570 = v539 && v539["has"](v565["targetId"]) ? v540 : 0,
      v571 = v539 && v539["has"](v565["targetId"]) ? v541 : 0,
      v572 = v566["x"] + v568,
      v573 = v566["y"] + v569,
      v574 = v567["x"] + v570,
      v575 = v567["y"] + v571,
      v576 = v572 + (v566["width"] ?? 0),
      v577 = v573 + (v566["height"] ?? 0) / 2,
      v578 = v574,
      v579 = v575 + (v567["height"] ?? 0) / 2,
      v580 = v542(v576, v577, v578, v579),
      v581 =
        v576["toFixed"](1) +
        "," +
        v577["toFixed"](1) +
        "," +
        v578["toFixed"](1) +
        "," +
        v579["toFixed"](1),
      v582 = _edgeEndpointSignatureCache["get"](v565["id"]);
    let v583 = _edgeDomCache["get"](v565["id"]);
    const v584 = !v583 || v582 !== v581;
    if (!v580) {
      v563 += 1;
      v583?.["groupEl"]?.["isConnected"] &&
        (v583["groupEl"]["remove"](), (v561 += 1));
      (_edgeDomCache["delete"](v565["id"]),
        _edgeEndpointSignatureCache["delete"](v565["id"]));
      continue;
    }
    v559 += 1;
    if (!v583) {
      const v585 = document["createElementNS"](
        "http://www.w3.org/2000/svg",
        "g",
      );
      ((v585["id"] = "edge-group-" + v565["id"]),
        v585["setAttribute"]("class", "connection-group"),
        v585["setAttribute"]("data-conn-id", v565["id"]),
        v523["appendChild"](v585));
      const v586 = document["createElementNS"](
        "http://www.w3.org/2000/svg",
        "path",
      );
      (v586["setAttribute"]("class", "connection-bg"),
        v585["appendChild"](v586));
      const v587 = document["createElementNS"](
        "http://www.w3.org/2000/svg",
        "path",
      );
      (v587["setAttribute"]("class", "connection-main"),
        v585["appendChild"](v587));
      const v587a = _createConnectionDeleteButton();
      (v585["appendChild"](v587a),
        (v583 = {
          groupEl: v585,
          hoverPath: v586,
          pathEl: v587,
          deleteBtnEl: v587a,
          highlighted: null,
        }),
        _edgeDomCache["set"](v565["id"], v583),
        (v560 += 1));
    } else {
      v562 += 1;
      _ensureConnectionDeleteButton(v583, v583["groupEl"]);
    }
    _syncEdgeHighlightClass(v583, v565["id"], v530);
    if (v584) {
      const v588 = Math["max"](Math["abs"](v578 - v576) * 0.5, 60),
        v589 =
          "M\x20" +
          v576 +
          "\x20" +
          v577 +
          " C " +
          (v576 + v588) +
          "\x20" +
          v577 +
          ",\x20" +
          (v578 - v588) +
          "\x20" +
          v579 +
          ",\x20" +
          v578 +
          "\x20" +
          v579;
      const v589a = _cubicBezierPoint(
        v576,
        v577,
        v576 + v588,
        v577,
        v578 - v588,
        v579,
        v578,
        v579,
      );
      v558["push"]({
        domCache: v583,
        d: v589,
        endpointSignature: v581,
        edgeId: v565["id"],
        midX: v589a["x"],
        midY: v589a["y"],
      });
    }
  }
  const v590 = _nowMs();
  for (const v591 of v558) {
    (v591["domCache"]["hoverPath"]["setAttribute"]("d", v591["d"]),
      v591["domCache"]["pathEl"]["setAttribute"]("d", v591["d"]),
      _positionConnectionDeleteButton(
        v591["domCache"]["deleteBtnEl"],
        v591["midX"],
        v591["midY"],
      ),
      _edgeEndpointSignatureCache["set"](
        v591["edgeId"],
        v591["endpointSignature"],
      ));
  }
  const v592 = _nowMs();
  (v558["length"] > 0 || v560 > 0 || v561 > 0) &&
    _invalidateFullEdgeRenderSignature();
  const v593 = _nowMs(),
    v594 = v524 instanceof Set ? v524["size"] : v558["length"];
  recordEdgeRedrawSample("partial", v593 - v532, {
    reason: "drag-related-edges",
    edgeCount: v594,
    visibleEdgeCount: v559,
    updatedCount: v558["length"],
    createdCount: v560,
    removedCount: v561,
    reusedCount: v562,
    skippedInvisibleCount: v563,
    cacheSize: _edgeDomCache["size"],
    layoutReadMs: v534["layoutReadMs"],
    pathBuildMs: Math["max"](0, v590 - v537),
    domWriteMs: Math["max"](0, v592 - v590),
    clearedDom: false,
  });
}
function _renderEdges(
  v595,
  v596,
  v597,
  v598,
  v599,
  v600 = null,
  v601 = null,
  v602 = null,
  v603 = "steady",
  v604 = {},
) {
  const v605 = _nowMs(),
    v606 = v598 || { x: 0, y: 0, zoom: 1 },
    v607 = v604?.["containerSize"] || _getEdgeContainerSize(v599),
    v608 = v607["containerW"],
    v609 = v607["containerH"],
    v610 = _edgeDomClearedSinceLastFull === true,
    v611 = _nowMs(),
    v612 = 200,
    v613 = v600?.["movedNodeIds"] instanceof Set ? v600["movedNodeIds"] : null,
    v614 = Number["isFinite"](v600?.["dx"]) ? v600["dx"] : 0,
    v615 = Number["isFinite"](v600?.["dy"]) ? v600["dy"] : 0;
  function v616(v617, v618, v619, v620) {
    const { x: v621, y: v622, zoom: v623 } = v606,
      v624 = v617 * v623 + v621,
      v625 = v618 * v623 + v622,
      v626 = v619 * v623 + v621,
      v627 = v620 * v623 + v622,
      v628 = Math["min"](v624, v626),
      v629 = Math["min"](v625, v627),
      v630 = Math["max"](v624, v626),
      v631 = Math["max"](v625, v627);
    return (
      v630 > -v612 && v628 < v608 + v612 && v631 > -v612 && v629 < v609 + v612
    );
  }
  const v632 = [];
  let v633 = 0,
    v634 = 0,
    v635 = 0,
    v636 = 0,
    v637 = 0;
  const v638 = Array["isArray"](v602) ? v602 : Object["values"](v596 || {});
  for (const v639 of v638) {
    const v640 = v597[v639["sourceId"]],
      v641 = v597[v639["targetId"]];
    if (!v640 || !v641) continue;
    const v642 = v613 && v613["has"](v639["sourceId"]) ? v614 : 0,
      v643 = v613 && v613["has"](v639["sourceId"]) ? v615 : 0,
      v644 = v613 && v613["has"](v639["targetId"]) ? v614 : 0,
      v645 = v613 && v613["has"](v639["targetId"]) ? v615 : 0,
      v646 = v640["x"] + v642,
      v647 = v640["y"] + v643,
      v648 = v641["x"] + v644,
      v649 = v641["y"] + v645,
      v650 = v646 + (v640["width"] ?? 0),
      v651 = v647 + (v640["height"] ?? 0) / 2,
      v652 = v648,
      v653 = v649 + (v641["height"] ?? 0) / 2,
      v654 = v616(v650, v651, v652, v653),
      v655 =
        v650["toFixed"](1) +
        "," +
        v651["toFixed"](1) +
        "," +
        v652["toFixed"](1) +
        "," +
        v653["toFixed"](1),
      v656 = _edgeEndpointSignatureCache["get"](v639["id"]);
    let v657 = _edgeDomCache["get"](v639["id"]);
    const v658 = !v657 || v656 !== v655;
    if (!v654) {
      v637 += 1;
      v657?.["groupEl"]?.["isConnected"] &&
        (v657["groupEl"]["remove"](), (v635 += 1));
      (_edgeDomCache["delete"](v639["id"]),
        _edgeEndpointSignatureCache["delete"](v639["id"]));
      continue;
    }
    v633 += 1;
    if (!v657) {
      const v659 = document["createElementNS"](
        "http://www.w3.org/2000/svg",
        "g",
      );
      ((v659["id"] = "edge-group-" + v639["id"]),
        v659["setAttribute"]("class", "connection-group"),
        v659["setAttribute"]("data-conn-id", v639["id"]),
        v595["appendChild"](v659));
      const v660 = document["createElementNS"](
        "http://www.w3.org/2000/svg",
        "path",
      );
      (v660["setAttribute"]("class", "connection-bg"),
        v659["appendChild"](v660));
      const v661 = document["createElementNS"](
        "http://www.w3.org/2000/svg",
        "path",
      );
      (v661["setAttribute"]("class", "connection-main"),
        v659["appendChild"](v661));
      const v661a = _createConnectionDeleteButton();
      (v659["appendChild"](v661a),
        (v657 = {
          groupEl: v659,
          hoverPath: v660,
          pathEl: v661,
          deleteBtnEl: v661a,
          highlighted: null,
        }),
        _edgeDomCache["set"](v639["id"], v657),
        (v634 += 1));
    } else {
      v636 += 1;
      _ensureConnectionDeleteButton(v657, v657["groupEl"]);
    }
    _syncEdgeHighlightClass(v657, v639["id"], v601);
    if (v658) {
      const v662 = Math["max"](Math["abs"](v652 - v650) * 0.5, 60),
        v663 =
          "M\x20" +
          v650 +
          "\x20" +
          v651 +
          " C " +
          (v650 + v662) +
          "\x20" +
          v651 +
          ",\x20" +
          (v652 - v662) +
          "\x20" +
          v653 +
          ",\x20" +
          v652 +
          "\x20" +
          v653;
      const v663a = _cubicBezierPoint(
        v650,
        v651,
        v650 + v662,
        v651,
        v652 - v662,
        v653,
        v652,
        v653,
      );
      v632["push"]({
        domCache: v657,
        d: v663,
        endpointSignature: v655,
        edgeId: v639["id"],
        midX: v663a["x"],
        midY: v663a["y"],
      });
    }
  }
  const v664 = _nowMs();
  for (const v665 of v632) {
    (v665["domCache"]["hoverPath"]["setAttribute"]("d", v665["d"]),
      v665["domCache"]["pathEl"]["setAttribute"]("d", v665["d"]),
      _positionConnectionDeleteButton(
        v665["domCache"]["deleteBtnEl"],
        v665["midX"],
        v665["midY"],
      ),
      _edgeEndpointSignatureCache["set"](
        v665["edgeId"],
        v665["endpointSignature"],
      ));
  }
  const v666 = _nowMs();
  v604?.["renderSignature"] &&
    (_lastFullEdgeRenderSignature = v604["renderSignature"]);
  _edgeDomClearedSinceLastFull = false;
  const v667 = _nowMs();
  recordEdgeRedrawSample("full", v667 - v605, {
    reason: v603,
    edgeCount: v638["length"],
    visibleEdgeCount: v633,
    updatedCount: v632["length"],
    createdCount: v634,
    removedCount: v635,
    reusedCount: v636,
    skippedInvisibleCount: v637,
    cacheSize: _edgeDomCache["size"],
    layoutReadMs: v607["layoutReadMs"],
    pathBuildMs: Math["max"](0, v664 - v611),
    domWriteMs: Math["max"](0, v666 - v664),
    clearedDom: v610,
  });
}
function _clearRenderedEdges(v668) {
  if (!v668) return;
  let v669 = 0;
  (v668["querySelectorAll"](".connection-group")["forEach"]((v670) => {
    const v671 = v670["getAttribute"]("data-conn-id");
    (v671 &&
      (_edgeDomCache["delete"](v671),
      _edgeEndpointSignatureCache["delete"](v671)),
      v670["remove"](),
      (v669 += 1));
  }),
    v668["querySelectorAll"]("path")["forEach"]((v672) => {
      if (v672["id"] === "v2-draft-edge") return;
      if (
        !v672["id"]["startsWith"]("edge-") &&
        !v672["id"]["startsWith"]("hover-edge-")
      )
        return;
      const v673 = v672["id"]
        ["replace"]("hover-edge-", "")
        ["replace"]("edge-", "");
      (_edgeDomCache["delete"](v673),
        _edgeEndpointSignatureCache["delete"](v673),
        v672["remove"](),
        (v669 += 1));
    }),
    v669 > 0 && _invalidateFullEdgeRenderSignature({ clearedDom: true }));
}
function _clearRenderedEdgesFromDocument() {
  if (typeof document === "undefined") return;
  const v674 = document["getElementById"]?.("v2-edges");
  (v674 && _clearRenderedEdges(v674),
    document["getElementById"]?.("v2-draft-edge")?.["remove"]?.(),
    document["querySelectorAll"]?.(".v2-edge-thumbnail")["forEach"]((v675) =>
      v675["remove"](),
    ),
    document["querySelectorAll"]?.("[id^=\x22v2-thumb-\x22]")["forEach"](
      (v676) => v676["remove"](),
    ));
}
function _cleanupEdges(v677, v678) {
  let v679 = 0;
  const v680 = v677["querySelectorAll"]("g.connection-group");
  for (const v681 of v680) {
    const v682 = v681["getAttribute"]("data-conn-id");
    !v678[v682] &&
      (v681["remove"](),
      (v679 += 1),
      _edgeDomCache["delete"](v682),
      _edgeEndpointSignatureCache["delete"](v682));
  }
  const v683 = v677["querySelectorAll"]("path");
  for (const v684 of v683) {
    if (v684["id"] === "v2-draft-edge") continue;
    if (
      v684["id"]["startsWith"]("edge-") ||
      v684["id"]["startsWith"]("hover-edge-")
    ) {
      const v685 = v684["id"]
        ["replace"]("hover-edge-", "")
        ["replace"]("edge-", "");
      !v678[v685] &&
        (v684["remove"](),
        (v679 += 1),
        _edgeDomCache["delete"](v685),
        _edgeEndpointSignatureCache["delete"](v685));
    }
  }
  (document["querySelectorAll"](".v2-edge-thumbnail")["forEach"]((v686) =>
    v686["remove"](),
  ),
    document["querySelectorAll"]('[id^="v2-thumb-"]')["forEach"]((v687) =>
      v687["remove"](),
    ),
    v679 > 0 && _invalidateFullEdgeRenderSignature({ clearedDom: true }));
}
function _renderEdgeThumbnails_REMOVED(v688, v689, v690) {
  for (const v691 of Object["values"](v689)) {
  }
}
function _createPickerEl() {
  const v692 = document["createElement"]("div");
  return (
    (v692["id"] = "v2-picker"),
    (v692["dataset"]["uiStop"] = "1"),
    Object["assign"](v692["style"], {
      position: "fixed",
      display: "none",
      flexDirection: "column",
      gap: "4px",
      background: "var(--bg-panel-card)",
      border: "1px solid var(--blue-30)",
      borderRadius: "10px",
      padding: "8px",
      minWidth: "160px",
      boxShadow: "0 8px 32px var(--black-50)",
      backdropFilter: "blur(12px)",
      zIndex: "1000",
      fontFamily: "inherit",
    }),
    v692
  );
}
function _renderPicker(v693, v694, v695) {
  if (!v694["visible"]) {
    ((v693["style"]["display"] = "none"), v693["replaceChildren"]());
    return;
  }
  ((v693["style"]["display"] = "flex"),
    (v693["style"]["left"] = v694["screenX"] + "px"),
    (v693["style"]["top"] = v694["screenY"] + "px"));
  if (v693["children"]["length"] > 0) return;
  const v696 = document["createElement"]("div");
  ((v696["textContent"] = "添加节点"),
    Object["assign"](v696["style"], {
      fontSize: "11px",
      color: "var(--text-muted)",
      padding: "2px 4px 6px",
      borderBottom: "1px solid var(--white-08)",
      marginBottom: "4px",
      userSelect: "none",
    }),
    v693["appendChild"](v696));
  const v697 = getAIGenerationDefaultSizeByType("ai-text"),
    v698 = getAIGenerationDefaultSizeByType("ai-image"),
    v699 = getAIGenerationDefaultSizeByType("ai-video"),
    v700 = [
      {
        type: "ai-text",
        label: "✨  生成文本",
        defaultLabel: "New AI Text",
        width: v697["width"],
        height: v697["height"],
      },
      {
        type: "ai-image",
        label: "✨\x20\x20生成图像",
        defaultLabel: "New AI Image",
        width: v698["width"],
        height: v698["height"],
      },
      {
        type: "ai-video",
        label: "✨  生成视频",
        defaultLabel: "New AI Video",
        width: v699["width"],
        height: v699["height"],
      },
      {
        type: "ai-audio",
        label: "✨  生成音频",
        defaultLabel: "New AI Audio",
        width: getAIGenerationDefaultSizeByType("ai-audio")["width"],
        height: getAIGenerationDefaultSizeByType("ai-audio")["height"],
      },
    ];
  for (const {
    type: v701,
    label: v702,
    defaultLabel: v703,
    width: v704,
    height: v705,
  } of v700) {
    const v706 = document["createElement"]("button");
    ((v706["textContent"] = v702),
      (v706["dataset"]["nodeType"] = v701),
      (v706["dataset"]["defaultLabel"] = v703),
      (v706["dataset"]["width"] = String(v704)),
      (v706["dataset"]["height"] = String(v705)),
      Object["assign"](v706["style"], {
        background: "var(--blue-10)",
        border: "1px\x20solid\x20var(--blue-25)",
        borderRadius: "6px",
        color: "var(--blue)",
        fontSize: "13px",
        padding: "7px 12px",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
      }),
      v693["appendChild"](v706));
  }
}
function _createSelectionRectEl() {
  const v707 = document["createElement"]("div");
  return (
    (v707["id"] = "v2-selection-rect"),
    Object["assign"](v707["style"], {
      position: "absolute",
      border: "1px\x20dashed\x20var(--white-50)",
      backgroundColor: "var(--white-02)",
      pointerEvents: "none",
      display: "none",
      zIndex: "1000",
    }),
    v707
  );
}
function _renderSelectionRect(v708, v709) {
  if (!v709 || !v709["active"]) {
    v708["style"]["display"] = "none";
    return;
  }
  v708["style"]["display"] = "block";
  const v710 = Math["min"](v709["x1"], v709["x2"]),
    v711 = Math["min"](v709["y1"], v709["y2"]),
    v712 = Math["abs"](v709["x2"] - v709["x1"]),
    v713 = Math["abs"](v709["y2"] - v709["y1"]);
  ((v708["style"]["left"] = v710 + "px"),
    (v708["style"]["top"] = v711 + "px"),
    (v708["style"]["width"] = v712 + "px"),
    (v708["style"]["height"] = v713 + "px"));
}
function _createMultiSelectBoxEl(v714) {
  const v715 = document["createElement"]("div");
  ((v715["id"] = "v2-multi-select-box"),
    (v715["className"] = "v2-multi-select-box"));
  const v716 = document["createElement"]("div");
  ((v716["className"] = "v2-multi-select-tab"),
    (v716["dataset"]["uiStop"] = "1"));
  const v717 = "http://www.w3.org/2000/svg",
    v718 = (v719 = "2") => {
      const v720 = document["createElementNS"](v717, "svg");
      return (
        v720["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
        v720["setAttribute"]("fill", "none"),
        v720["setAttribute"]("stroke", "currentColor"),
        v720["setAttribute"]("stroke-width", v719),
        v720["setAttribute"]("stroke-linecap", "round"),
        v720["setAttribute"]("stroke-linejoin", "round"),
        v720
      );
    },
    v721 = (v722, v723, v724) => {
      const v725 = document["createElement"]("button");
      return (
        (v725["type"] = "button"),
        (v725["className"] = "v2-multi-select-btn"),
        (v725["dataset"]["uiAction"] = v722),
        (v725["title"] = v723),
        v725["setAttribute"]("aria-label", v723),
        v725["replaceChildren"](v724),
        v725
      );
    },
    v726 = (v727, v728) => {
      const v729 = document["createElementNS"](v717, "path");
      return (v729["setAttribute"]("d", v728), v727["appendChild"](v729), v729);
    },
    v730 = v718("2.5"),
    v731 = document["createElementNS"](v717, "polygon");
  (v731["setAttribute"]("points", "5 3 19 12 5 21 5 3"),
    v730["appendChild"](v731));
  const v732 = v721("ms-run-selected", "执行选中节点", v730),
    v733 = v718("1.8"),
    v734 = document["createElementNS"](v717, "polygon");
  (v734["setAttribute"]("points", "12 2 20 12 16 12 16 22 8 22 8 12 4 12 12 2"),
    v733["appendChild"](v734));
  const v735 = v721("ms-asset", "创建资产", v733),
    v736 = v718("2");
  for (const [v737, v738] of [
    [3, 3],
    [14, 3],
    [14, 14],
    [3, 14],
  ]) {
    const v739 = document["createElementNS"](v717, "rect");
    (v739["setAttribute"]("x", String(v737)),
      v739["setAttribute"]("y", String(v738)),
      v739["setAttribute"]("width", "7"),
      v739["setAttribute"]("height", "7"),
      v736["appendChild"](v739));
  }
  const v740 = v721("ms-group", "打组", v736),
    v741 = v718("2"),
    v742 = document["createElementNS"](v717, "path");
  v742["setAttribute"]("d", "M3 12a9 9 0 0 1 15.36-6.36");
  const v743 = document["createElementNS"](v717, "path");
  v743["setAttribute"]("d", "M21 12a9 9 0 0 1-15.36 6.36");
  const v744 = document["createElementNS"](v717, "polyline");
  v744["setAttribute"]("points", "21 3 21 9 15 9");
  const v745 = document["createElementNS"](v717, "polyline");
  (v745["setAttribute"]("points", "3 21 3 15 9 15"),
    v741["appendChild"](v742),
    v741["appendChild"](v743),
    v741["appendChild"](v744),
    v741["appendChild"](v745));
  const v746 = v721("ms-reset-image-size", "恢复默认大小", v741);
  v746["style"]["display"] = "none";
  const v747 = v718("2"),
    v748 = document["createElementNS"](v717, "rect");
  (v748["setAttribute"]("x", "3"),
    v748["setAttribute"]("y", "5"),
    v748["setAttribute"]("width", "18"),
    v748["setAttribute"]("height", "14"),
    v748["setAttribute"]("rx", "2"),
    v747["appendChild"](v748),
    v726(v747, "M3 9h18"),
    v726(v747, "M7 5l4 4"),
    v726(v747, "M13\x205l4\x204"));
  const v749 = v721("ms-compose-video", "合成视频", v747);
  v749["style"]["display"] = "none";
  const v750 = v718("2");
  [
    "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    "M3 10h18",
    "M12 10v10",
  ]["forEach"]((v751) => v726(v750, v751));
  const v752 = v721("ms-create-collage", "创建拼图", v750);
  return (
    (v752["style"]["display"] = "none"),
    v716["appendChild"](v732),
    v716["appendChild"](v735),
    v716["appendChild"](v740),
    v716["appendChild"](v746),
    v716["appendChild"](v752),
    v716["appendChild"](v749),
    v715["appendChild"](v716),
    v715
  );
}
function _createAlignCenterPanelEl() {
  const v753 = document["createElement"]("div");
  ((v753["id"] = "v2-align-center-panel"),
    (v753["className"] = "v2-align-center-panel"),
    (v753["dataset"]["uiStop"] = "1"),
    (v753["style"]["display"] = "none"));
  const v754 = "http://www.w3.org/2000/svg",
    v755 = {
      "ms-align-left": ["M4 4v16", "M8\x207h10", "M8\x2012h7", "M8 17h9"],
      "ms-align-h-center": ["M12 4v16", "M7 7h10", "M9 12h6", "M8\x2017h8"],
      "ms-align-right": ["M20 4v16", "M6 7h10", "M9 12h7", "M7\x2017h9"],
      "ms-align-top": ["M4 4h16", "M7\x208v10", "M12 8v7", "M17 8v9"],
      "ms-align-v-center": ["M4 12h16", "M7 7v10", "M12 9v6", "M17\x208v8"],
      "ms-align-bottom": ["M4 20h16", "M7 6v10", "M12 9v7", "M17 7v9"],
      "ms-distribute-h": [
        "M3 20h18",
        "M5 8h3v8H5z",
        "M11 5h3v11h-3z",
        "M17\x2010h3v6h-3z",
      ],
      "ms-distribute-v": [
        "M20 3v18",
        "M8 5h8v3H8z",
        "M5 11h11v3H5z",
        "M10 17h6v3h-6z",
      ],
    },
    v756 = [
      { action: "ms-align-left", tooltip: "左对齐", slot: "slot-1" },
      { action: "ms-align-h-center", tooltip: "水平居中", slot: "slot-2" },
      { action: "ms-align-right", tooltip: "右对齐", slot: "slot-3" },
      { action: "ms-align-top", tooltip: "顶部对齐", slot: "slot-4" },
      { action: "ms-align-bottom", tooltip: "底部对齐", slot: "slot-6" },
      { action: "ms-distribute-h", tooltip: "水平均匀分布", slot: "slot-7" },
      { action: "ms-align-v-center", tooltip: "垂直居中", slot: "slot-8" },
      { action: "ms-distribute-v", tooltip: "垂直均匀分布", slot: "slot-9" },
    ];
  return (
    v756["forEach"]((v757) => {
      const v758 = document["createElement"]("button");
      ((v758["type"] = "button"),
        (v758["className"] = "v2-align-center-btn\x20" + v757["slot"]),
        (v758["dataset"]["uiAction"] = v757["action"]),
        (v758["dataset"]["tooltip"] = v757["tooltip"]),
        v758["setAttribute"]("aria-label", v757["tooltip"]));
      const v759 = document["createElementNS"](v754, "svg");
      (v759["setAttribute"]("width", "16"),
        v759["setAttribute"]("height", "16"),
        v759["setAttribute"]("viewBox", "0 0 24 24"),
        v759["setAttribute"]("fill", "none"),
        v759["setAttribute"]("stroke", "currentColor"),
        v759["setAttribute"]("stroke-width", "2"),
        v759["setAttribute"]("stroke-linecap", "round"),
        v759["setAttribute"]("stroke-linejoin", "round"));
      const v760 = v755[v757["action"]] || [];
      (v760["forEach"]((v761) => {
        const v762 = document["createElementNS"](v754, "path");
        (v762["setAttribute"]("d", v761), v759["appendChild"](v762));
      }),
        v758["appendChild"](v759),
        v753["appendChild"](v758));
    }),
    v753
  );
}
function _renderAlignCenterPanel(v763, v764, v765, v766 = {}) {
  if (!v763) return;
  const v767 = String(v766?.["alignFeatureTriggerMode"] || "click"),
    v768 = v766?.["alignFeatureEnabled"] !== false && v767 !== "off",
    v769 = v766?.["alignPanelVisible"] === true,
    v770 = Array["isArray"](v764) ? v764 : [],
    v771 = getAlignableSelectionNodes(v765 || {}, v770),
    v772 = v768 && v769 && v770["length"] >= 2 && v771["length"] >= 2;
  if (!v772) {
    if (v763["style"]["display"] !== "none") v763["style"]["display"] = "none";
    ((_alignPanelRenderCache["centerSig"] = ""),
      (_alignPanelRenderCache["buttonStateSig"] = ""));
    return;
  }
  const v773 = v766?.["alignPanelAnchorWorld"],
    v774 =
      !!v773 && Number["isFinite"](v773["x"]) && Number["isFinite"](v773["y"]);
  let v775 = 0,
    v776 = 0;
  if (v774) ((v775 = Number(v773["x"])), (v776 = Number(v773["y"])));
  else {
    const v777 = computeSelectionBounds(v771);
    if (!v777) {
      if (v763["style"]["display"] !== "none")
        v763["style"]["display"] = "none";
      ((_alignPanelRenderCache["centerSig"] = ""),
        (_alignPanelRenderCache["buttonStateSig"] = ""));
      return;
    }
    ((v775 = v777["centerX"]), (v776 = v777["centerY"]));
  }
  if (v763["style"]["display"] !== "block") v763["style"]["display"] = "block";
  const v778 = v775["toFixed"](2) + "|" + v776["toFixed"](2);
  _alignPanelRenderCache["centerSig"] !== v778 &&
    ((_alignPanelRenderCache["centerSig"] = v778),
    (v763["style"]["left"] = v775 + "px"),
    (v763["style"]["top"] = v776 + "px"));
  const v779 = v771["length"] >= 2,
    v780 = v779 ? "1" : "0";
  if (_alignPanelRenderCache["buttonStateSig"] !== v780) {
    _alignPanelRenderCache["buttonStateSig"] = v780;
    const v781 =
      v763["_actionButtons"] ||
      Array["from"](v763["querySelectorAll"]("button[data-ui-action]"));
    ((v763["_actionButtons"] = v781),
      v781["forEach"]((v782) => {
        const v783 = v782["dataset"]["uiAction"],
          v784 = v783 === "ms-distribute-h" || v783 === "ms-distribute-v",
          v785 = v784 ? !v779 : false;
        ((v782["disabled"] = v785),
          v782["classList"]["toggle"]("is-disabled", v785));
      }));
  }
}
function _renderMultiSelectBox(v786, v787, v788, v789, v790 = false) {
  const v791 = v787 && v787["length"] >= 2,
    v792 = (v793, { mountedOnly: mountedOnly = false } = {}) => {
      if (!v793) return null;
      if (mountedOnly && !_mountedNodeIds["has"](v793)) return null;
      return _wrapperMap["get"](v793) || _parkedWrapperMap["get"](v793) || null;
    },
    v794 = (v795) => {
      if (!v795) return;
      const v796 = v795["querySelector"](".node-floating-toolbar"),
        v797 = v795["querySelector"](".group-toolbar"),
        v798 = v795["querySelector"](".text-prompt-panel");
      if (v796) v796["style"]["display"] = "";
      if (v797) v797["style"]["display"] = "";
      if (v798) v798["style"]["display"] = "";
    },
    v799 = (v800) => {
      if (!v800) return;
      const v801 = v800["querySelector"](".node-floating-toolbar"),
        v802 = v800["querySelector"](".group-toolbar"),
        v803 = v800["querySelector"](".text-prompt-panel");
      if (v801) v801["style"]["display"] = "none";
      if (v802) v802["style"]["display"] = "none";
      if (v803) v803["style"]["display"] = "none";
    };
  if (!v791) {
    for (const v804 of _msHiddenNodeIds) {
      v794(v792(v804));
    }
    _msHiddenNodeIds = new Set();
  } else {
    const v805 = new Set(v787 || []),
      v806 = new Set();
    for (const v807 of _msHiddenNodeIds) {
      if (v805["has"](v807)) continue;
      v794(v792(v807));
    }
    for (const v808 of v805) {
      const v809 = v792(v808, { mountedOnly: true });
      if (!v809) continue;
      (v799(v809), v806["add"](v808));
    }
    _msHiddenNodeIds = v806;
  }
  if (!v791) {
    if (v786["style"]["display"] !== "none") v786["style"]["display"] = "none";
    ((_multiSelectRenderCache["geometrySig"] = ""),
      (_multiSelectRenderCache["runBtnDisabled"] = null),
      (_multiSelectRenderCache["resetBtnVisible"] = null),
      (_multiSelectRenderCache["composeBtnVisible"] = null),
      (_multiSelectRenderCache["composeBtnKind"] = ""));
    return;
  }
  const v810 = v786["querySelector"](
      ".v2-multi-select-tab\x20button[data-ui-action=\x22ms-run-selected\x22]",
    ),
    v811 = v786["querySelector"](
      '.v2-multi-select-tab button[data-ui-action="ms-compose-video"]',
    ),
    v812 = v786["querySelector"](
      '.v2-multi-select-tab button[data-ui-action="ms-reset-image-size"]',
    ),
    v813 = v786["querySelector"](
      ".v2-multi-select-tab\x20button[data-ui-action=\x22ms-create-collage\x22]",
    );
  if (v810) {
    let v814 = false;
    for (const v815 of v787) {
      if (
        isNodeType(v788[v815], ["ai-text", "ai-image", "ai-video", "ai-audio"])
      ) {
        v814 = true;
        break;
      }
    }
    const v816 = !v814;
    _multiSelectRenderCache["runBtnDisabled"] !== v816 &&
      ((_multiSelectRenderCache["runBtnDisabled"] = v816),
      (v810["disabled"] = v816),
      v810["classList"]["toggle"]("is-disabled", v816));
  }
  if (v812) {
    let v817 = false;
    for (const v818 of v787) {
      const v819 = v788[v818],
        v820 =
          !!v819 &&
          isNodeType(v819, [
            "source-image",
            "source-video",
            "ai-image",
            "ai-video",
          ]);
      if (v820) {
        v817 = true;
        break;
      }
    }
    const v821 = v790 && v817;
    _multiSelectRenderCache["resetBtnVisible"] !== v821 &&
      ((_multiSelectRenderCache["resetBtnVisible"] = v821),
      (v812["style"]["display"] = v821 ? "" : "none"));
  }
  if (v813) {
    const v822 = v787["filter"]((v823) =>
      isNodeType(v788[v823], ["source-image", "ai-image", "storyboard"]),
    )["length"];
    v813["style"]["display"] = v822 >= 2 ? "" : "none";
  }
  if (v811) {
    const v824 = getSelectedMediaComposeKind(v788, v787),
      v825 = !!v824;
    _multiSelectRenderCache["composeBtnVisible"] !== v825 &&
      ((_multiSelectRenderCache["composeBtnVisible"] = v825),
      (v811["style"]["display"] = v825 ? "" : "none"));
    if (_multiSelectRenderCache["composeBtnKind"] !== v824) {
      _multiSelectRenderCache["composeBtnKind"] = v824;
      const v826 = getMediaComposeButtonLabel(v824);
      ((v811["dataset"]["composeKind"] = v824),
        (v811["dataset"]["tooltip"] = v826),
        v811["setAttribute"]("aria-label", v826));
    }
  }
  let v827 = Infinity,
    v828 = Infinity,
    v829 = -Infinity,
    v830 = -Infinity,
    v831 = 0;
  v787["forEach"]((v832) => {
    const v833 = v788[v832];
    if (!v833) return;
    v831++;
    const v834 = v833["width"] || 260,
      v835 = v833["height"] || 100;
    let v836 = v833["x"],
      v837 = v833["y"],
      v838 = v833["x"] + v834,
      v839 = v833["y"] + v835;
    (v833["type"] !== "group" && (v837 -= 30),
      (v827 = Math["min"](v827, v836)),
      (v828 = Math["min"](v828, v837)),
      (v829 = Math["max"](v829, v838)),
      (v830 = Math["max"](v830, v839)));
  });
  if (v831 < 2) {
    if (v786["style"]["display"] !== "none") v786["style"]["display"] = "none";
    _multiSelectRenderCache["geometrySig"] = "";
    return;
  }
  if (v786["style"]["display"] !== "block") v786["style"]["display"] = "block";
  const v840 = 18,
    v841 = v827 - v840,
    v842 = v828 - v840,
    v843 = v829 - v827 + v840 * 2,
    v844 = v830 - v828 + v840 * 2,
    v845 =
      v841["toFixed"](2) +
      "|" +
      v842["toFixed"](2) +
      "|" +
      v843["toFixed"](2) +
      "|" +
      v844["toFixed"](2);
  _multiSelectRenderCache["geometrySig"] !== v845 &&
    ((_multiSelectRenderCache["geometrySig"] = v845),
    (v786["style"]["left"] = v841 + "px"),
    (v786["style"]["top"] = v842 + "px"),
    (v786["style"]["width"] = v843 + "px"),
    (v786["style"]["height"] = v844 + "px"));
}

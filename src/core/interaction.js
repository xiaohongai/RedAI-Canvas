import appStore, {
  graphStore as graphStoreImport,
  uiStore as uiStoreImport,
  workspaceStore as workspaceStoreImport,
} from "./stores/appStore.js";
import { isNodeType } from "../modules/registry.js";
import { getShortcuts } from "../modules/shortcuts.js";
import {
  screenToWorld,
  isPointInRect,
  isRectIntersect,
  checkLineIntersection,
  checkBBoxIntersection,
  hitTestNode,
  findAvailablePosition,
  generateId,
  getAlignableSelectionNodes,
  computeSelectionBounds,
  computeAlignTargets,
  computeDistributeTargets,
  buildNodeOffsetPlan,
} from "./math.js";
import { commit, redo, undo } from "../modules/history.js";
import {
  setClipboard,
  getClipboard,
  markSystemClipboardWrite,
} from "../modules/clipboard.js";
import {
  captureEditableSelection,
  getEditableTextTarget,
  isEditableTextTargetInGroupedNode,
  pasteTextIntoEditableFromClipboard,
  showTextInputContextMenu,
} from "../modules/textInputContextMenu.js";
import { calcSafeSpawnPosNearNode } from "../modules/nodeSpawn.js";
import { rafSampleLatest } from "../utils/dom.js";
import {
  stripImageGenerationResultStateForDerivedNode,
  stripImageGenerationRuntimeState,
} from "./imageTaskRuntimeState.js";
import {
  buildQuickCreateStoryboardCells,
  buildStoryboardNodePayload,
  computeQuickCreateStoryboardSize,
  resolveNearestStoryboardAspect,
  resolveStoryboardSourceImageRef,
} from "./storyboardFactory.js";
import {
  buildCollageNodeDataFromSelection,
  createEmptyCollageNodeData,
  isCollageImageNode,
} from "../modules/collage/collageFactory.js";
import { createDragController } from "../modules/interaction/DragController.js";
import {
  beginDragFpsSession,
  beginPanFpsSession,
  endDragFpsSession,
  endPanFpsSession,
  recordCanvasPanSample,
} from "../modules/perf/perfProbe.js";
import {
  createEdgeController,
  initConnectionHandles as initConnectionHandlesImpl,
  initPickConnect as initPickConnectImpl,
  isValidConnection as isValidConnectionImpl,
  addEdgeWithPolicies,
  setDragContextGetter,
} from "../modules/interaction/EdgeController.js";
import { createSelectionController } from "../modules/interaction/SelectionController.js";
import { createZoomController } from "../modules/interaction/ZoomController.js";
import {
  removeContextMenus,
  showContextMenu,
} from "../modules/interaction/contextMenuPresenter.js";
import {
  CONTEXT_NODE_CREATION_SECTION_IDS,
  NODE_CREATION_UPLOAD_ITEM,
  PICKER_NODE_CREATION_SECTION_IDS,
  getNodeCreationMenuSections,
} from "../modules/nodeCreationMenuCatalog.js";
import {
  beginViewportPanPreview,
  cancelViewportPanPreview,
  flushViewportPanPreview,
  updateViewportPanPreview,
} from "./viewportPanPreview.js";
import {
  createPanorama360NodeData,
  createPanoramaSceneNodeData,
  PANORAMA_SCENE_DEFAULT_SIZE,
} from "../modules/panoramaSceneNode/sceneNode.js";
import {
  createStoryboardScriptNodeData,
  STORYBOARD_SCRIPT_DEFAULT_SIZE,
} from "./storyboardScriptFactory.js";
import {
  buildSourceMediaNodePayload,
  getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize,
  getAutoMediaSizeByShortSide,
  getNodeDefaultSize,
} from "../services/fileService.js";
import {
  canOpenKnownFolder,
  canShowItemInFolder,
  openKnownFolder,
  resolveNodeLocalPathForNativeAction,
  showItemInFolder,
} from "../services/nativeFileActionService.js";
const graphStore = appStore?.["graphStore"] || graphStoreImport || appStore,
  uiStore = appStore?.["uiStore"] || uiStoreImport || appStore,
  workspaceStore =
    appStore?.["workspaceStore"] || workspaceStoreImport || appStore,
  EDGE_INTERACTION_LITE_CLASS = "is-edge-interaction-lite",
  EDGE_INTERACTION_LITE_MIN_ZOOM = 0.24,
  EDGE_INTERACTION_LITE_MAX_ZOOM = 0.48,
  EDGE_INTERACTION_LITE_MIN_EDGES = 3;
function isDevModeOn() {
  return (
    window["DEV_MODE"] === true ||
    document["body"]?.["classList"]?.["contains"]("dev-mode")
  );
}
function _shouldUseEdgeInteractionLite(v0) {
  const v1 = Number(v0?.["viewport"]?.["zoom"]) || 1,
    v2 = Object["keys"](v0?.["edges"] || {})["length"],
    v3 = typeof window !== "undefined" ? window["_edgeDomCache"] : null;
  return (
    v1 >= EDGE_INTERACTION_LITE_MIN_ZOOM &&
    v1 <= EDGE_INTERACTION_LITE_MAX_ZOOM &&
    v2 >= EDGE_INTERACTION_LITE_MIN_EDGES &&
    v3 &&
    v3["size"] > 0
  );
}
function _setEdgeInteractionLite(v4) {
  if (typeof document === "undefined" || !document?.["body"]?.["classList"])
    return;
  document["body"]["classList"]["toggle"](EDGE_INTERACTION_LITE_CLASS, !!v4);
}
function getStateRaw() {
  return {
    ...graphStore["getStateRaw"](),
    ...uiStore["getStateRaw"](),
    ...workspaceStore["getStateRaw"](),
  };
}
function getState() {
  return {
    ...graphStore["getState"](),
    ...uiStore["getState"](),
    ...workspaceStore["getState"](),
  };
}
function nowMs() {
  return typeof performance !== "undefined" &&
    performance &&
    typeof performance["now"] === "function"
    ? performance["now"]()
    : Date["now"]();
}
function getMountedNodeCountForPerf() {
  const v5 =
    typeof window !== "undefined" ? window["v2Renderer"]?.["wrapperMap"] : null;
  return v5 && typeof v5["size"] === "number" ? v5["size"] : 0;
}
let isCuttingMode = false,
  lastCutPos = null,
  _cuttingCtrlHeldCount = 0,
  _cuttingModeTimer = null;
function _setCuttingMode(v6a) {
  const v6b = !!v6a;
  if (isCuttingMode === v6b) return;
  ((isCuttingMode = v6b),
    document["documentElement"]["classList"]["toggle"](
      "is-cutting-mode",
      v6b,
    ),
    v6b || (lastCutPos = null));
}
function _clearCuttingModeTimer() {
  _cuttingModeTimer &&
    (clearTimeout(_cuttingModeTimer), (_cuttingModeTimer = null));
}
function _scheduleCuttingMode() {
  (_clearCuttingModeTimer(),
    (_cuttingModeTimer = setTimeout(() => {
      ((_cuttingModeTimer = null),
        _cuttingCtrlHeldCount > 0 && _setCuttingMode(true));
    }, 150)));
}
function _cancelCuttingModeFromShortcut() {
  (_clearCuttingModeTimer(), _setCuttingMode(false));
}
function _isControlLikeKey(v6c) {
  return v6c === "Control" || v6c === "Meta";
}
function _installCuttingModeListeners() {
  if (typeof window === "undefined") return;
  (window["addEventListener"]("keydown", (v6d) => {
    if (_isControlLikeKey(v6d["key"])) {
      v6d["repeat"] || (_cuttingCtrlHeldCount += 1);
      _scheduleCuttingMode();
      return;
    }
    _cuttingCtrlHeldCount > 0 && _cancelCuttingModeFromShortcut();
  }),
    window["addEventListener"]("keyup", (v6e) => {
      if (_isControlLikeKey(v6e["key"])) {
        _cuttingCtrlHeldCount = Math["max"](0, _cuttingCtrlHeldCount - 1);
        (_clearCuttingModeTimer(), _setCuttingMode(false));
      }
    }),
    window["addEventListener"](
      "pointermove",
      (v6f) => {
        isCuttingMode &&
          !v6f["ctrlKey"] &&
          !v6f["metaKey"] &&
          ((_cuttingCtrlHeldCount = 0),
          _clearCuttingModeTimer(),
          _setCuttingMode(false));
      },
      { passive: true },
    ),
    window["addEventListener"]("blur", () => {
      ((_cuttingCtrlHeldCount = 0),
        _clearCuttingModeTimer(),
        _setCuttingMode(false));
    }),
    document["addEventListener"]("visibilitychange", () => {
      document["hidden"] &&
        ((_cuttingCtrlHeldCount = 0),
        _clearCuttingModeTimer(),
        _setCuttingMode(false));
    }));
}
_installCuttingModeListeners();
function _createIdleDragContext() {
  return {
    isDragging: false,
    targetNodeId: null,
    lastWorldX: 0,
    lastWorldY: 0,
    pendingDx: 0,
    pendingDy: 0,
    hasMoved: false,
    wasSelectedOnDown: false,
    dragSource: null,
    titleDragPendingSelectNodeId: null,
    titleDragActivated: false,
    titleDragStartScreenX: 0,
    titleDragStartScreenY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    panStartViewportX: 0,
    panStartViewportY: 0,
    panStartZoom: 1,
    panStartPerf: 0,
    panMoveCount: 0,
    panMinimapPreviewCount: 0,
    isConnecting: false,
    connectSourceId: null,
    isBoxSelecting: false,
    boxStartX: 0,
    boxStartY: 0,
    isDraggingCell: false,
    sourceCellIndex: -1,
    draggedCellData: null,
    ghostEl: null,
    sourceCellEl: null,
    lastHoverNodeId: null,
    lastHoverCellIndex: -1,
  };
}
let dragContext = _createIdleDragContext();
const RESETTABLE_MEDIA_NODE_TYPES = [
  "source-image",
  "source-video",
  "ai-image",
  "ai-video",
];
function _asPositiveNumber(v8) {
  const v9 = Number(v8);
  return Number["isFinite"](v9) && v9 > 0 ? v9 : 0;
}
function _pickMainResultItem(v10, v11) {
  if (!Array["isArray"](v10) || v10["length"] === 0) return null;
  const v12 = Number(v11),
    v13 = Number["isFinite"](v12) ? Math["max"](0, Math["trunc"](v12)) : 0;
  return v10[v13] || v10[0] || null;
}
function _parseAspectRatio(v14) {
  const v15 = String(v14 || "")["trim"]();
  if (!v15) return { w: 0, h: 0 };
  const v16 = v15["match"](/(\d+(?:\.\d+)?)\s*[:：xX/]\s*(\d+(?:\.\d+)?)/);
  if (!v16) return { w: 0, h: 0 };
  const v17 = _asPositiveNumber(v16[1]),
    v18 = _asPositiveNumber(v16[2]);
  return { w: v17, h: v18 };
}
function _resolveMediaResultSize(v19) {
  if (!v19 || typeof v19 !== "object") return { w: 0, h: 0 };
  if (isNodeType(v19, "source-image"))
    return {
      w: _asPositiveNumber(v19["imageWidth"]),
      h: _asPositiveNumber(v19["imageHeight"]),
    };
  if (isNodeType(v19, "source-video"))
    return {
      w:
        _asPositiveNumber(v19["selectedVideoWidth"]) ||
        _asPositiveNumber(v19["videoWidth"]),
      h:
        _asPositiveNumber(v19["selectedVideoHeight"]) ||
        _asPositiveNumber(v19["videoHeight"]),
    };
  if (isNodeType(v19, "ai-image")) {
    const v20 = _pickMainResultItem(v19["images"], v19["mainImageIndex"]);
    let v21 =
        _asPositiveNumber(v20?.["imageWidth"]) ||
        _asPositiveNumber(v20?.["width"]) ||
        _asPositiveNumber(v19["imageWidth"]),
      v22 =
        _asPositiveNumber(v20?.["imageHeight"]) ||
        _asPositiveNumber(v20?.["height"]) ||
        _asPositiveNumber(v19["imageHeight"]);
    if (!(v21 > 0 && v22 > 0)) {
      const v23 = _parseAspectRatio(v19["aspectRatio"]);
      ((v21 = v23["w"]), (v22 = v23["h"]));
    }
    return (
      !(v21 > 0 && v22 > 0) &&
        ((v21 = _asPositiveNumber(v19["width"])),
        (v22 = _asPositiveNumber(v19["height"]))),
      { w: v21, h: v22 }
    );
  }
  if (isNodeType(v19, "ai-video")) {
    const v24 = _pickMainResultItem(v19["videos"], v19["mainVideoIndex"]);
    let v25 =
        _asPositiveNumber(v19["selectedVideoWidth"]) ||
        _asPositiveNumber(v24?.["videoWidth"]) ||
        _asPositiveNumber(v19["videoWidth"]),
      v26 =
        _asPositiveNumber(v19["selectedVideoHeight"]) ||
        _asPositiveNumber(v24?.["videoHeight"]) ||
        _asPositiveNumber(v19["videoHeight"]);
    if (!(v25 > 0 && v26 > 0)) {
      const v27 = _parseAspectRatio(v19["aspectRatio"]);
      ((v25 = v27["w"]), (v26 = v27["h"]));
    }
    return (
      !(v25 > 0 && v26 > 0) &&
        ((v25 = _asPositiveNumber(v19["width"])),
        (v26 = _asPositiveNumber(v19["height"]))),
      { w: v25, h: v26 }
    );
  }
  return { w: 0, h: 0 };
}
function _resolveSourceMediaResetSize(v28) {
  if (!v28 || typeof v28 !== "object")
    return getNodeDefaultSize("source-image");
  const { w: v29, h: v30 } = _resolveMediaResultSize(v28);
  if (v29 > 0 && v30 > 0) {
    if (isNodeType(v28, ["ai-image", "ai-video"]))
      return getAIGenerationNodeSize(v29, v30);
    return getAutoMediaSizeByShortSide(v29, v30);
  }
  if (isNodeType(v28, ["ai-image", "ai-video"]))
    return getAIGenerationNodeSize();
  if (isNodeType(v28, "source-video"))
    return getNodeDefaultSize("source-video");
  if (isNodeType(v28, "source-image"))
    return getNodeDefaultSize("source-image");
  return getNodeDefaultSize("source-image");
}
function _getAiGenerationMenuItem(v31, v32) {
  const v33 = getAIGenerationDefaultSizeByType(v31);
  return { label: v32, type: v31, w: v33["width"], h: v33["height"] };
}
const STORYBOARD_QUICK_CREATE_PRESETS = Object["freeze"]([
  { label: "4宫格", name: "4宫格", cols: 2, rows: 2, baseShortSide: 400 },
  { label: "9宫格", name: "9宫格", cols: 3, rows: 3, baseShortSide: 450 },
  { label: "16宫格", name: "16宫格", cols: 4, rows: 4, baseShortSide: 500 },
  { label: "25宫格", name: "25宫格", cols: 5, rows: 5, baseShortSide: 550 },
]);
function _createQuickStoryboardNodeFromPrimary(v34, v35, v36) {
  if (!v35 || !v36) return;
  const v37 = resolveStoryboardSourceImageRef(v35);
  if (!v37) return;
  const v38 = generateId("storyboard"),
    { nodes: v39 } = getStateRaw(),
    v40 = computeQuickCreateStoryboardSize({
      sourceWidth: v35["width"],
      sourceHeight: v35["height"],
      baseShortSide: v36["baseShortSide"],
    }),
    v41 = calcSafeSpawnPosNearNode(v39, v35, v40["width"], v40["height"]),
    v42 = buildStoryboardNodePayload({
      id: v38,
      name: v36["name"],
      x: v41["x"],
      y: v41["y"],
      width: v40["width"],
      height: v40["height"],
      cols: v36["cols"],
      rows: v36["rows"],
      aspectRatio: resolveNearestStoryboardAspect(v35["width"], v35["height"]),
      cells: buildQuickCreateStoryboardCells({
        cols: v36["cols"],
        rows: v36["rows"],
        imageRef: v37,
      }),
    });
  (graphStore["addNode"](v42),
    graphStore["setSelectedNodes"]([v38]),
    commit(),
    window["v2FocusOnNodes"] &&
      requestAnimationFrame(() => window["v2FocusOnNodes"]([v34, v38])));
}
function _createCollageNodeFromSelection(v43) {
  const v44 = Array["isArray"](v43) ? v43 : [],
    { nodes: v45 } = getStateRaw(),
    v46 = v44["map"]((v47) => v45[v47])["filter"](Boolean),
    v48 = v46["filter"](isCollageImageNode);
  if (v48["length"] === 0)
    return (
      window["showToast"]?.("选区里没有可拼图的图片节点", "warning"),
      null
    );
  const v49 = generateId("collage"),
    v50 = buildCollageNodeDataFromSelection({
      id: v49,
      nodes: v48,
      name: "拼图",
    });
  if (!v50) return (window["showToast"]?.("无法计算拼图边界", "error"), null);
  const v51 = calcSafeSpawnPosNearNode(v45, v50, v50["width"], v50["height"]);
  return (
    graphStore["addNode"]({ ...v50, x: v51["x"], y: v51["y"] }),
    graphStore["setSelectedNodes"]([v49]),
    commit(),
    window["v2FocusOnNodes"] &&
      requestAnimationFrame(() =>
        window["v2FocusOnNodes"]([...v48["map"]((v52) => v52["id"]), v49]),
      ),
    window["showToast"]?.("已创建拼图节点", "success"),
    v49
  );
}
function _clearStoryboardHighlight(v53) {
  if (!v53) return;
  const v54 = window["v2Renderer"]?.["nodeInstances"]?.["get"](v53);
  if (v54 && typeof v54["highlightCell"] === "function")
    v54["highlightCell"](-1);
}
function _resetDragContext() {
  dragContext?.["isDragging"] && endDragFpsSession("node-drag");
  dragContext?.["isPanning"] && endPanFpsSession("canvas-pan");
  const v55 = dragContext?.["lastHoverNodeId"] || null;
  if (v55) _clearStoryboardHighlight(v55);
  ((dragContext = _createIdleDragContext()),
    document["body"]["classList"]["remove"](
      "is-panning",
      "is-dragging",
      "is-edge-interaction-lite",
      "is-dragging-heavy-edges",
    ),
    document["querySelectorAll"](".is-ui-hidden")["forEach"]((v56) =>
      v56["classList"]["remove"]("is-ui-hidden"),
    ),
    stopAutoPan(),
    _sampledPointerMove?.["cancel"]?.(),
    cancelPendingViewportUpdate(),
    cancelViewportPanPreview());
}
function _resetCellDragContext() {
  const v57 = dragContext?.["lastHoverNodeId"] || null;
  if (v57) _clearStoryboardHighlight(v57);
  (dragContext?.["sourceCellEl"] &&
    dragContext["sourceCellEl"]["classList"]["remove"]("is-drag-source"),
    dragContext?.["ghostEl"]?.["remove"]?.(),
    (dragContext = _createIdleDragContext()),
    document["body"]["classList"]["remove"](
      "is-panning",
      "is-dragging",
      "is-edge-interaction-lite",
      "is-dragging-heavy-edges",
    ),
    stopAutoPan(),
    _sampledPointerMove?.["cancel"]?.(),
    cancelPendingViewportUpdate(),
    cancelViewportPanPreview());
}
function _deferCommit() {
  requestAnimationFrame(() => {
    setTimeout(() => commit(), 0);
  });
}
const dragController = createDragController({
    store: appStore,
    isNodeType: isNodeType,
    getShortcuts: getShortcuts,
    hitTestNode: hitTestNode,
    screenToWorld: screenToWorld,
    generateId: generateId,
    cloneNodesWithEdges: cloneNodesWithEdges,
    commit: commit,
  }),
  edgeController = createEdgeController(),
  selectionController = createSelectionController({
    store: appStore,
    screenToWorld: screenToWorld,
    isNodeType: isNodeType,
    isValidConnection: isValidConnectionImpl,
  }),
  zoomController = createZoomController({ store: appStore });
setDragContextGetter(() => dragContext);
let viewportRafId = null,
  pendingViewportUpdate = null;
function syncSidePlusToLastPointer(v58 = {}) {
  const v59 =
    typeof window !== "undefined" &&
    typeof window["_v2UpdateSidePlusNow"] === "function"
      ? window["_v2UpdateSidePlusNow"]
      : typeof window !== "undefined"
        ? window["_v2UpdateSidePlus"]
        : null;
  typeof v59 === "function" && v59(lastMouseScreenX, lastMouseScreenY, v58);
}
function updateViewportBatched(v60, v61, v62) {
  ((pendingViewportUpdate = { x: v60, y: v61, zoom: v62 }),
    !viewportRafId &&
      (viewportRafId = requestAnimationFrame(flushViewportUpdate)));
}
function flushViewportUpdate() {
  viewportRafId = null;
  if (pendingViewportUpdate) {
    const { x: v63, y: v64, zoom: v65 } = pendingViewportUpdate;
    ((pendingViewportUpdate = null),
      graphStore["updateViewport"](v63, v64, v65),
      syncSidePlusToLastPointer());
  }
}
function cancelPendingViewportUpdate() {
  (viewportRafId &&
    (cancelAnimationFrame(viewportRafId), (viewportRafId = null)),
    (pendingViewportUpdate = null));
}
let autoPanReqId = null,
  autoPanState = { dx: 0, dy: 0 },
  lastMouseScreenX = 0,
  lastMouseScreenY = 0,
  _autoPanPendingDx = 0,
  _autoPanPendingDy = 0;
export function stopAutoPan() {
  autoPanReqId && (cancelAnimationFrame(autoPanReqId), (autoPanReqId = null));
}
function autoPanLoop() {
  if (!autoPanReqId) return;
  const { viewport: v66 } = getStateRaw(),
    v67 = _autoPanPendingDx || autoPanState["dx"],
    v68 = _autoPanPendingDy || autoPanState["dy"];
  (v67 !== autoPanState["dx"] || v68 !== autoPanState["dy"]) &&
    ((autoPanState["dx"] = v67), (autoPanState["dy"] = v68));
  ((_autoPanPendingDx = 0), (_autoPanPendingDy = 0));
  const v69 = v66["x"] - autoPanState["dx"],
    v70 = v66["y"] - autoPanState["dy"];
  updateViewportBatched(v69, v70, v66["zoom"]);
  if (dragContext["isDragging"]) {
    const v71 = getStateRaw(),
      { nodes: v72 } = v71,
      { x: v73, y: v74 } = screenToWorld(lastMouseScreenX, lastMouseScreenY, {
        x: v69,
        y: v70,
        zoom: v66["zoom"],
      });
    dragController["updateDraggingNodes"](
      dragContext,
      lastMouseScreenX,
      lastMouseScreenY,
      v73,
      v74,
      v73,
      v74,
      v71,
    );
  }
  autoPanReqId = requestAnimationFrame(autoPanLoop);
}
function checkAutoPan(v75, v76) {
  ((lastMouseScreenX = v75), (lastMouseScreenY = v76));
  if (
    !dragContext["isDragging"] &&
    !dragContext["isBoxSelecting"] &&
    !dragContext["isConnecting"]
  ) {
    stopAutoPan();
    return;
  }
  const v77 = 60,
    v78 = 15;
  let v79 = 0,
    v80 = 0;
  if (v75 < v77) v79 = -v78;
  else {
    if (v75 > window["innerWidth"] - v77) v79 = v78;
  }
  if (v76 < v77) v80 = -v78;
  else {
    if (v76 > window["innerHeight"] - v77) v80 = v78;
  }
  v79 !== 0 || v80 !== 0
    ? ((_autoPanPendingDx = v79),
      (_autoPanPendingDy = v80),
      !autoPanReqId && (autoPanReqId = requestAnimationFrame(autoPanLoop)))
    : stopAutoPan();
}
export function handlePointerDown(
  v81,
  v82,
  v83 = false,
  v84 = false,
  v85 = null,
) {
  ((lastMouseScreenX = v81), (lastMouseScreenY = v82));
  const v86 = getStateRaw(),
    { viewport: v87 } = v86,
    { x: v88, y: v89 } = screenToWorld(v81, v82, v87),
    v90 = v86["pickConnectMode"];
  if (v90 && v90["active"]) {
    if (v85?.["button"] === 2) {
      (v85["stopPropagation"]?.(), v85["stopImmediatePropagation"]?.());
      return;
    }
    const v91 = v85 && v85["target"] && v85["target"]["closest"](".v2-node");
    if (v91) return;
  }
  if (!v83 && dragController["tryStartTitleDrag"](dragContext, v85, v88, v89)) {
    beginDragFpsSession("node-drag");
    return;
  }
  if (
    !v83 &&
    edgeController["tryStartHandleConnect"](dragContext, v85, v88, v89, v87)
  )
    return;
  if (v83) {
    ((dragContext["isPanning"] = true),
      (dragContext["panStartX"] = v81),
      (dragContext["panStartY"] = v82),
      (dragContext["panStartViewportX"] = v87["x"]),
      (dragContext["panStartViewportY"] = v87["y"]),
      (dragContext["panStartZoom"] = v87["zoom"]),
      (dragContext["panStartPerf"] = nowMs()),
      (dragContext["panMoveCount"] = 0),
      (dragContext["panMinimapPreviewCount"] =
        Number(window["_v2GetMinimapPreviewFlushCount"]?.()) || 0),
      beginPanFpsSession("canvas-pan"),
      beginViewportPanPreview(v87),
      window["_v2ScheduleMinimapViewportPreview"]?.(v87, { force: true }),
      document["body"]["classList"]["add"]("is-panning"),
      _setEdgeInteractionLite(_shouldUseEdgeInteractionLite(v86)));
    return;
  }
  if (
    dragController["tryStartNodeDrag"](
      dragContext,
      v81,
      v82,
      v88,
      v89,
      v84,
      v85,
    )
  ) {
    dragContext["isDragging"] && beginDragFpsSession("node-drag");
    return;
  }
  if (!v83 && !v85?.["ctrlKey"]) {
    selectionController["startBoxSelecting"](dragContext, v81, v82);
    return;
  }
}
function _handlePointerMoveImpl(v92, v93, v94 = false, v95 = null) {
  const v96 = lastMouseScreenX,
    v97 = lastMouseScreenY;
  ((lastMouseScreenX = v92), (lastMouseScreenY = v93));
  if (dragContext["isPanning"]) {
    const v98 = v92 - dragContext["panStartX"],
      v99 = v93 - dragContext["panStartY"],
      v100 = {
        x: dragContext["panStartViewportX"] + v98,
        y: dragContext["panStartViewportY"] + v99,
        zoom: dragContext["panStartZoom"],
      };
    ((dragContext["panMoveCount"] = (dragContext["panMoveCount"] || 0) + 1),
      updateViewportPanPreview(v100["x"], v100["y"], v100["zoom"]),
      window["_v2ScheduleMinimapViewportPreview"]?.(v100));
    return;
  }
  const v101 = getStateRaw(),
    { viewport: v102, nodes: v103 } = v101;
  if ((dragContext["isDragging"] || dragContext["isConnecting"]) && v94) {
    stopAutoPan();
    const v104 = v92 - v96,
      v105 = v93 - v97,
      v106 = { x: v102["x"] + v104, y: v102["y"] + v105, zoom: v102["zoom"] };
    updateViewportBatched(v106["x"], v106["y"], v106["zoom"]);
    const { x: v107, y: v108 } = screenToWorld(v92, v93, v106);
    if (dragContext["isConnecting"]) {
      edgeController["updateHandleConnect"](
        dragContext,
        v92,
        v93,
        v107,
        v108,
        v106,
        v103,
        v101["connOverlay"],
      );
      return;
    }
    const v109 = { ...v101, viewport: v106 };
    dragController["updateDraggingNodes"](
      dragContext,
      v92,
      v93,
      v107,
      v108,
      v107,
      v108,
      v109,
    );
    return;
  }
  let { x: v110, y: v111 } = screenToWorld(v92, v93, v102);
  const v112 = v110,
    v113 = v111;
  if (isCuttingMode && v95 && v95["buttons"] === 1) {
    if (lastCutPos) {
      const v114 = getStateRaw(),
        v115 = [];
      for (const [v116, v117] of Object["entries"](v114["edges"])) {
        const v118 = v114["nodes"][v117["sourceId"]],
          v119 = v114["nodes"][v117["targetId"]];
        if (!v118 || !v119) continue;
        const v120 = v118["x"] + (v118["width"] || 260),
          v121 = v118["y"] + (v118["height"] || 100) / 2,
          v122 = v119["x"],
          v123 = v119["y"] + (v119["height"] || 100) / 2,
          v124 = checkBBoxIntersection(
            lastCutPos["x"],
            lastCutPos["y"],
            v110,
            v111,
            v120,
            v121,
            v122,
            v123,
          );
        if (!v124) continue;
        const v125 = checkLineIntersection(
          lastCutPos["x"],
          lastCutPos["y"],
          v110,
          v111,
          v120,
          v121,
          v122,
          v123,
        );
        v125 && v115["push"](v116);
      }
      v115["length"] > 0 && graphStore["updateEdgesBatch"](v115, []);
    }
    lastCutPos = { x: v110, y: v111 };
    return;
  } else lastCutPos = null;
  if (dragContext["isConnecting"]) {
    edgeController["updateHandleConnect"](
      dragContext,
      v92,
      v93,
      v110,
      v111,
      v102,
      v103,
      v101["connOverlay"],
    );
    return;
  }
  if (dragContext["isBoxSelecting"]) {
    selectionController["updateBoxSelecting"](dragContext, v92, v93);
    return;
  }
  if (dragContext["isDraggingCell"]) {
    dragController["updateDraggingCell"](
      dragContext,
      v92,
      v93,
      v110,
      v111,
      v103,
    );
    return;
  }
  if (!dragContext["isDragging"]) return;
  (dragController["updateDraggingNodes"](
    dragContext,
    v92,
    v93,
    v110,
    v111,
    v112,
    v113,
    v101,
  ),
    checkAutoPan(v92, v93));
}
const _sampledPointerMove = rafSampleLatest(_handlePointerMoveImpl);
export function handlePointerMove(v126, v127, v128 = null) {
  if (v128 && v128["buttons"] === 0) {
    if (
      dragContext["isDragging"] ||
      dragContext["isPanning"] ||
      dragContext["isConnecting"] ||
      dragContext["isBoxSelecting"] ||
      dragContext["isDraggingCell"]
    ) {
      handlePointerUp(v126, v127);
      return;
    }
  }
  const v129 = !!(v128 && (v128["buttons"] & 4) !== 0),
    v130 =
      (dragContext["isDragging"] || dragContext["isConnecting"]) &&
      (v129 || window["_spaceHeld"] === true);
  _sampledPointerMove(v126, v127, v130, v128);
}
export function handlePointerUp(v131 = 0, v132 = 0) {
  if (
    !dragContext["isDragging"] &&
    !dragContext["isPanning"] &&
    !dragContext["isConnecting"] &&
    !dragContext["isBoxSelecting"] &&
    !dragContext["isDraggingCell"]
  )
    return;
  let v133 = false;
  const v134 = !!dragContext["isPanning"],
    v135 = dragContext["panStartPerf"] || nowMs(),
    v136 = dragContext["panMoveCount"] || 0,
    v137 = dragContext["panMinimapPreviewCount"] || 0;
  stopAutoPan();
  if (v134) {
    const v138 = flushViewportPanPreview(),
      v139 =
        Number(window["_v2FlushMinimapViewportPreview"]?.(v138)) ||
        Number(window["_v2GetMinimapPreviewFlushCount"]?.()) ||
        v137;
    (endPanFpsSession("canvas-pan"), cancelPendingViewportUpdate());
    const v140 = () => {
      (v138 && graphStore["updateViewport"](v138["x"], v138["y"], v138["zoom"]),
        graphStore["markViewportPersist"]());
    };
    typeof graphStore["batch"] === "function"
      ? graphStore["batch"](v140)
      : v140();
    const v141 =
        (typeof graphStore["getStateRaw"] === "function" &&
          graphStore["getStateRaw"]()) ||
        getStateRaw(),
      v142 = v138 || v141?.["viewport"] || {};
    recordCanvasPanSample({
      durationMs: nowMs() - v135,
      moveCount: v136,
      committed: !!v138,
      nodeCount: Number["isFinite"](v141?.["_nodeCount"])
        ? v141["_nodeCount"]
        : Object["keys"](v141?.["nodes"] || {})["length"],
      edgeCount: Object["keys"](v141?.["edges"] || {})["length"],
      mountedNodeCount: getMountedNodeCountForPerf(),
      minimapPreviewCount: Math["max"](0, v139 - v137),
      finalX: v142["x"],
      finalY: v142["y"],
      finalZoom: v142["zoom"],
    });
  } else flushViewportUpdate();
  if (dragContext["isDraggingCell"]) {
    const v143 = dragController["finishDraggingCell"](dragContext, v131, v132);
    _resetCellDragContext();
    if (v143["didAct"]) _deferCommit();
    return;
  }
  if (dragContext["isConnecting"])
    v133 =
      edgeController["finishHandleConnect"](dragContext, v131, v132) || v133;
  else {
    if (dragContext["isBoxSelecting"]) {
      const v144 = selectionController["finishBoxSelecting"](
        dragContext,
        v131,
        v132,
      );
      v133 = v144["didAct"] || v133;
    } else {
      if (dragContext["isDragging"]) {
        const v145 = dragController["finishDraggingNodes"](
          dragContext,
          v131,
          v132,
        );
        if (v145["earlyCommit"]) {
          (window["_clearSnapGuideLines"]?.(), _resetDragContext());
          return;
        }
        v133 = v145["didAct"] || v133;
      }
    }
  }
  (window["_clearSnapGuideLines"]?.(), _resetDragContext());
  v134 && syncSidePlusToLastPointer();
  if (v133) commit();
}
export function handleWheel(v146, v147, v148) {
  zoomController["handleWheel"](v146, v147, v148);
}
export function getDragContext() {
  return { ...dragContext };
}
export function handleDoubleClick(v149, v150) {
  const { viewport: v151, nodes: v152 } = getStateRaw(),
    { x: v153, y: v154 } = screenToWorld(v149, v150, v151);
  for (const v155 of Object["values"](v152)) {
    const v156 = isPointInRect(
      v153,
      v154,
      v155["x"],
      v155["y"],
      v155["width"],
      v155["height"],
    );
    if (v156) return;
  }
  uiStore["showPicker"](v149, v150, v153, v154);
}
export function handleContextMenu(v157, v158) {
  const v159 = getStateRaw(),
    v160 = hitTestNode(v157, v158, v159["nodes"], v159["viewport"]);
  if (!v160) return;
  const v161 = v159["selectedNodeIds"] || [];
  !v161["includes"](v160) && graphStore["setSelectedNodes"]([v160]);
  const v162 = getStateRaw();
  showNodesContextMenu(v157, v158, {
    primaryNodeId: v160,
    targetNodeIds: v162["selectedNodeIds"],
  });
}
function calcNodesBBox(v163, v164) {
  let v165 = Infinity,
    v166 = Infinity,
    v167 = -Infinity,
    v168 = -Infinity;
  for (const v169 of v164) {
    const v170 = v163[v169];
    if (!v170) continue;
    const v171 = v170["width"] || 260,
      v172 = v170["height"] || 100;
    ((v165 = Math["min"](v165, v170["x"])),
      (v166 = Math["min"](v166, v170["y"])),
      (v167 = Math["max"](v167, v170["x"] + v171)),
      (v168 = Math["max"](v168, v170["y"] + v172)));
  }
  if (v165 === Infinity) return null;
  return { x: v165, y: v166, width: v167 - v165, height: v168 - v166 };
}
function showNodesContextMenu(v173, v174, v175) {
  removeContextMenus();
  const v176 = getStateRaw(),
    { nodes: v177 } = v176,
    v178 = Array["isArray"](v175?.["targetNodeIds"])
      ? v175["targetNodeIds"]
      : [],
    v179 = v178["filter"]((v180) => !!v177[v180]);
  if (v179["length"] === 0) return;
  const v181 =
      v175?.["primaryNodeId"] && v177[v175["primaryNodeId"]]
        ? v175["primaryNodeId"]
        : v179[0],
    v182 = v181 ? v177[v181] : null,
    v183 = calcNodesBBox(v177, v179),
    v184 = [],
    v185 = (v186, v187, v188) => {
      v184["push"]({ label: v186, kbd: v187, action: v188 });
    },
    v189 = () => {
      v184["push"]("sep");
    },
    v190 = (v191, v192) => {
      v184["push"]({ label: v191, subItems: v192 });
    };
  (v185("复制节点", "Ctrl C", () => {
    (executeCommand("copy", { ids: [...v179] }),
      window["showToast"]?.("节点已复制", "success"));
  }),
    v185("剪切节点", "Ctrl X", () => {
      const v193 = [...v179];
      (executeCommand("copy", { ids: v193 }),
        executeCommand("delete_nodes", { ids: v193 }),
        window["showToast"]?.("节点已剪切", "success"));
    }),
    v185("粘贴", "Ctrl V", () => {
      window["dispatchEvent"](
        new CustomEvent("v2:canvas-paste-request", {
          detail: { screenX: v173, screenY: v174 },
        }),
      );
    }));
  const v194 = v179["filter"]((v195) => isCollageImageNode(v177[v195]));
  v194["length"] >= 2 &&
    v185("创建拼图", "", () => {
      _createCollageNodeFromSelection(v194);
    });
  if (v182 && v179["length"] === 1) {
    const v196 =
      v182["type"] === "ai-image" ||
      v182["type"] === "source-image" ||
      v182["type"] === "storyboard";
    if (v196) {
      const v197 =
        v182["imageUrl"] ||
        v182["sourceUrl"] ||
        v182["src"] ||
        v182["localPath"];
      v197 &&
        v185("复制图像", "Ctrl+Shift+C", () => {
          (v182["id"] && graphStore["setSelectedNodes"]([v182["id"]]),
            window["dispatchEvent"](
              new CustomEvent("shortcut-action", { detail: "copy-media" }),
            ));
        });
    }
  }
  const v198 = (v199) => {
    if (!v181 || !v179["length"]) return;
    const v200 = {
      x: Number["isFinite"](Number(v199?.["clientX"]))
        ? Number(v199["clientX"])
        : v173,
      y: Number["isFinite"](Number(v199?.["clientY"]))
        ? Number(v199["clientY"])
        : v174,
    };
    (graphStore["setSelectedNodes"]([...v179]),
      import("../modules/AssetManager.js")
        ["then"](({ assetManager: v201 }) => {
          v201["showCreatePanel"]([...v179], null, {
            placement: "center",
            point: v200,
          });
        })
        ["catch"](() => window["showToast"]?.("无法打开资源面板", "error")));
  };
  let v202 = "",
    v203 = false,
    v204 = false;
  v182 &&
    v179["length"] === 1 &&
    ((v202 = resolveNodeLocalPathForNativeAction(v182)),
    (v203 = canShowItemInFolder(v202)),
    (v204 = canOpenKnownFolder("output")));
  (v182 || v203) &&
    (v189(),
    v182 && v185("添加资产", "", v198),
    v203 &&
      v185("在资源管理器中显示素材", "", () => {
        showItemInFolder(v202)["catch"](() =>
          window["showToast"]?.("无法定位该素材", "error"),
        );
      }),
    v189());
  v204 &&
    (v185("打开输出文件夹", "", () => {
      openKnownFolder("output")["catch"](() =>
        window["showToast"]?.("无法打开输出文件夹", "error"),
      );
    }),
    v189());
  v185("创建副本", "", () => {
    const v205 = getStateRaw(),
      v206 = v205["nodes"],
      v207 = (v205["selectedNodeIds"] || [])["filter"]((v208) => !!v206[v208]),
      v209 = v207["length"] > 0 ? v207 : [...v179],
      v210 = calcNodesBBox(v206, v209),
      v211 = Math["max"](280, v210?.["width"] || 0),
      v212 = Math["max"](300, v210?.["height"] || 0),
      v213 = (v181 && v206[v181]) || v210;
    if (!v213) return;
    const v214 = calcSafeSpawnPosNearNode(v206, v213, v211, v212),
      v215 = v214["x"] - v213["x"],
      v216 = v214["y"] - v213["y"],
      v217 = cloneNodesWithEdges(v209, v215, v216);
    (graphStore["setSelectedNodes"](Object["values"](v217)),
      window["showToast"]?.("包含连线的副本已创建", "success"));
  });
  v182 &&
    v179["length"] === 1 &&
    (v182["type"] === "ai-text" || v182["type"] === "source-text") &&
    v185("复制文本", "", () => {
      const v218 = v182["outputText"] || v182["content"] || "";
      v218
        ? navigator["clipboard"]
            ["writeText"](v218)
            ["then"](() => {
              (markSystemClipboardWrite({ text: v218 }),
                window["showToast"]?.("文本已复制到剪贴板", "success"));
            })
            ["catch"](() => {
              window["showToast"]?.("复制失败，请检查浏览器权限", "error");
            })
        : window["showToast"]?.("节点暂无文本", "warn");
    });
  v185("删除节点", "Del", () => {
    executeCommand("delete_nodes", { ids: [...v179] });
  });
  if (v182 && v179["length"] === 1) {
    v189();
    const v219 = [
        _getAiGenerationMenuItem("ai-text", "生成文本"),
        _getAiGenerationMenuItem("ai-image", "生成图像"),
        _getAiGenerationMenuItem("ai-video", "生成视频"),
        _getAiGenerationMenuItem("ai-audio", "生成音频"),
      ],
      v220 = v219["filter"]((v221) =>
        isValidConnection(v182, {
          id: "__fake_" + v221["type"],
          type: v221["type"],
        }),
      );
    v220["length"] > 0 &&
      v220["forEach"]((v222) => {
        v185(v222["label"], "", () => {
          const v223 = generateId(v222["type"]);
          let v224 = v222["w"],
            v225 = v222["h"];
          if (
            (v222["type"] === "ai-image" || v222["type"] === "ai-video") &&
            v182["width"] &&
            v182["height"]
          ) {
            const v226 = getAIGenerationNodeSize(v182["width"], v182["height"]);
            ((v224 = v226["width"]), (v225 = v226["height"]));
          }
          const { nodes: v227 } = getStateRaw(),
            v228 = calcSafeSpawnPosNearNode(v227, v182, v224, v225);
          let v229 = {
            id: v223,
            type: v222["type"],
            x: v228["x"],
            y: v228["y"],
            width: v224,
            height: v225,
            name: v222["label"],
          };
          (v222["type"] === "ai-image" || v222["type"] === "ai-video") &&
            !Object["prototype"]["hasOwnProperty"]["call"](
              v229,
              "aspectRatio",
            ) &&
            (v229["aspectRatio"] = "自适应");
          if (v182["type"] === v222["type"]) {
            const v230 = { ...v182 };
            (delete v230["id"],
              delete v230["x"],
              delete v230["y"],
              delete v230["width"],
              delete v230["height"],
              delete v230["name"],
              delete v230["prompt"],
              delete v230["outputText"],
              stripImageGenerationResultStateForDerivedNode(v230),
              (v229 = { ...v230, ...v229 }));
          }
          graphStore["addNode"](v229);
          const v231 = addEdgeWithPolicies({ sourceId: v181, targetId: v223 });
          if (!v231) {
            const v232 = "edge-" + v181 + "-" + v223 + "-" + Date["now"]();
            graphStore["addEdge"]({
              id: v232,
              sourceId: v181,
              targetId: v223,
              createdAt: Date["now"](),
            });
          }
          (graphStore["setSelectedNodes"]([v223]), commit());
        });
      });
    if (v182 && v179["length"] === 1) {
      const v233 =
        v182["type"] === "ai-image" ||
        v182["type"] === "source-image" ||
        v182["type"] === "storyboard";
      if (v233) {
        const v234 = resolveStoryboardSourceImageRef(v182);
        if (v234) {
          v189();
          const v235 = STORYBOARD_QUICK_CREATE_PRESETS["map"]((v236) => ({
            label: v236["label"],
            action: () =>
              _createQuickStoryboardNodeFromPrimary(v181, v182, v236),
          }));
          v190("创建宫格", v235);
        }
      }
    }
  }
  showContextMenu(v173, v174, v184);
}
export function cloneNodesWithEdges(v237, v238 = 16, v239 = 16) {
  const v240 = getStateRaw(),
    { nodes: v241, edges: v242 } = v240,
    v243 = {};
  v237["forEach"]((v244) => {
    const v245 = v241[v244];
    if (!v245) return;
    const v246 =
      "node_" +
      Date["now"]() +
      "_" +
      Math["random"]()["toString"](36)["slice"](2, 7);
    v243[v244] = v246;
    const v247 = JSON["parse"](JSON["stringify"](v245));
    (stripImageGenerationRuntimeState(v247),
      graphStore["addNode"]({
        ...v247,
        id: v246,
        x: v245["x"] + v238,
        y: v245["y"] + v239,
      }));
  });
  const v248 = [];
  return (
    Object["values"](v242)["forEach"]((v249) => {
      const v250 = v237["includes"](v249["sourceId"]),
        v251 = v237["includes"](v249["targetId"]);
      if (v250 && v251)
        v248["push"]({
          ...v249,
          id:
            "edge_" +
            Date["now"]() +
            "_" +
            Math["random"]()["toString"](36)["slice"](2, 7),
          sourceId: v243[v249["sourceId"]],
          targetId: v243[v249["targetId"]],
        });
      else {
        if (v250)
          v248["push"]({
            ...v249,
            id:
              "edge_" +
              Date["now"]() +
              "_" +
              Math["random"]()["toString"](36)["slice"](2, 7),
            sourceId: v243[v249["sourceId"]],
          });
        else
          v251 &&
            v248["push"]({
              ...v249,
              id:
                "edge_" +
                Date["now"]() +
                "_" +
                Math["random"]()["toString"](36)["slice"](2, 7),
              targetId: v243[v249["targetId"]],
            });
      }
    }),
    v248["length"] > 0 && graphStore["updateEdgesBatch"]([], v248),
    commit(),
    v243
  );
}
export function executeCommand(v252, v253 = {}) {
  const v254 = getStateRaw();
  switch (v252) {
    case "delete_edge":
      v253["id"] && (graphStore["removeEdge"](v253["id"]), commit());
      break;
    case "delete_nodes":
      v253["ids"] &&
        v253["ids"]["length"] > 0 &&
        (graphStore["deleteNodes"](v253["ids"]),
        graphStore["clearSelection"](),
        commit());
      break;
    case "hide_picker":
      uiStore["hidePicker"]();
      break;
    case "rename_node":
      v253["id"] &&
        typeof v253["name"] === "string" &&
        graphStore["renameNode"](v253["id"], v253["name"]);
      break;
    case "set_pick_connect_mode":
      uiStore["setPickConnectMode"]({
        active: !!v253["active"],
        sourceNodeId:
          v253["sourceNodeId"] !== undefined ? v253["sourceNodeId"] : null,
        handleDirection:
          v253["handleDirection"] !== undefined
            ? v253["handleDirection"]
            : null,
        hoverNodeId:
          v253["hoverNodeId"] !== undefined ? v253["hoverNodeId"] : null,
      });
      break;
    case "group":
      if (v253["ids"] && v253["ids"]["length"] > 1) {
        let v255 = Infinity,
          v256 = Infinity,
          v257 = -Infinity,
          v258 = -Infinity;
        v253["ids"]["forEach"]((v259) => {
          const v260 = v254["nodes"][v259];
          if (!v260) return;
          const v261 = v260["x"],
            v262 = v260["y"],
            v263 = v260["width"] || 260,
            v264 = v260["height"] || 100;
          ((v255 = Math["min"](v255, v261)),
            (v256 = Math["min"](v256, v262)),
            (v257 = Math["max"](v257, v261 + v263)),
            (v258 = Math["max"](v258, v262 + v264)));
        });
        const v265 = 32,
          v266 = generateId("group");
        (graphStore["addNode"]({
          id: v266,
          type: "group",
          x: v255 - v265,
          y: v256 - v265 * 1.5,
          width: v257 - v255 + v265 * 2,
          height: v258 - v256 + v265 * 2.5,
          title: "新建组",
          color: "var(--indigo)",
        }),
          graphStore["groupNodes"](v253["ids"], v266),
          graphStore["setSelectedNodes"]([v266]),
          commit());
      }
      break;
    case "ungroup":
      v253["ids"] &&
        v253["ids"]["length"] > 0 &&
        (v253["ids"]["forEach"]((v267) => {
          const v268 = v254["nodes"][v267];
          v268 &&
            isNodeType(v268, "group") &&
            (Object["values"](v254["nodes"])["forEach"]((v269) => {
              if (v269["parentId"] === v267)
                graphStore["updateNodeData"](v269["id"], {
                  parentId: undefined,
                });
            }),
            graphStore["deleteNodes"]([v267]));
        }),
        graphStore["clearSelection"](),
        commit());
      break;
    case "create_node":
      if (v253["type"]) {
        const v270 = generateId(v253["type"]);
        (graphStore["addNode"]({ id: v270, ...v253 }),
          graphStore["setSelectedNodes"]([v270]),
          commit());
      }
      break;
    case "create_collage_from_selection": {
      const v271 = Array["isArray"](v253["ids"])
        ? v253["ids"]
        : v254["selectedNodeIds"] || [];
      _createCollageNodeFromSelection(v271);
      break;
    }
    case "reset_source_media_size":
    case "reset_source_image_size": {
      const v272 =
          Array["isArray"](v253["ids"]) && v253["ids"]["length"] > 0
            ? v253["ids"]
            : v254["selectedNodeIds"] || [],
        v273 = v272["filter"]((v274) => {
          const v275 = v254["nodes"][v274];
          return !!v275 && isNodeType(v275, RESETTABLE_MEDIA_NODE_TYPES);
        });
      if (v273["length"] === 0) break;
      (graphStore["batch"](() => {
        v273["forEach"]((v276) => {
          const v277 = v254["nodes"][v276],
            v278 = _resolveSourceMediaResetSize(v277);
          graphStore["updateNodeData"](v276, {
            width: v278["width"],
            height: v278["height"],
            needsAutoResize: false,
          });
        });
      }),
        commit());
      break;
    }
    case "align_nodes": {
      if (v254["ui"]?.["alignFeatureEnabled"] === false) break;
      const v279 = String(v253["mode"] || "")["trim"](),
        v280 = Array["isArray"](v254["selectedNodeIds"])
          ? v254["selectedNodeIds"]
          : [];
      if (v280["length"] < 2) break;
      const v281 = getAlignableSelectionNodes(v254["nodes"], v280);
      if (v281["length"] < 2) break;
      let v282 = {};
      if (v279 === "distribute-h") {
        const v283 = Number(v254["ui"]?.["alignDistributeGap"]);
        v282 = computeDistributeTargets(
          v281,
          "horizontal",
          Number["isFinite"](v283) ? v283 : 40,
        );
      } else {
        if (v279 === "distribute-v") {
          const v284 = Number(v254["ui"]?.["alignDistributeGap"]);
          v282 = computeDistributeTargets(
            v281,
            "vertical",
            Number["isFinite"](v284) ? v284 : 40,
          );
        } else {
          if (
            v279 === "left" ||
            v279 === "h-center" ||
            v279 === "right" ||
            v279 === "top" ||
            v279 === "v-center" ||
            v279 === "bottom"
          ) {
            const v285 = computeSelectionBounds(v281);
            v282 = computeAlignTargets(v281, v279, v285);
          } else break;
        }
      }
      const v286 = buildNodeOffsetPlan(v254["nodes"], v282);
      if (Object["keys"](v286)["length"] === 0) break;
      (graphStore["batch"](() => {
        graphStore["moveNodesByOffsets"](v286);
      }),
        commit());
      break;
    }
    case "select_all":
      graphStore["setSelectedNodes"](Object["keys"](v254["nodes"]));
      break;
    case "copy":
      if (v253["ids"] && v253["ids"]["length"] > 0) {
        const v287 = v253["ids"]
            ["map"]((v288) => v254["nodes"][v288])
            ["filter"](Boolean),
          v289 = v287["map"]((v290) => {
            const v291 = { ...v290 };
            return (stripImageGenerationRuntimeState(v291), v291);
          });
        setClipboard(v289);
      } else {
        if (v254["selectedNodeIds"]["length"] > 0) {
          const v292 = v254["selectedNodeIds"]
              ["map"]((v293) => v254["nodes"][v293])
              ["filter"](Boolean),
            v294 = v292["map"]((v295) => {
              const v296 = { ...v295 };
              return (stripImageGenerationRuntimeState(v296), v296);
            });
          setClipboard(v294);
        }
      }
      break;
    case "export_image":
      console["log"]("执行导出节点图片", v253["id"]);
      break;
    case "paste":
      const v297 = getClipboard();
      if (v297 && v297["length"] > 0) {
        let v298 = Infinity,
          v299 = Infinity;
        v297["forEach"]((v300) => {
          if (v300["x"] < v298) v298 = v300["x"];
          if (v300["y"] < v299) v299 = v300["y"];
        });
        const v301 = [],
          v302 = Date["now"](),
          v303 = Math["random"]()["toString"](36)["slice"](2, 5);
        (v297["forEach"]((v304, v305) => {
          stripImageGenerationRuntimeState(v304);
          const v306 =
              v304["id"]["split"]("_copy_")[0] +
              "_copy_" +
              v302 +
              "_" +
              v303 +
              v305,
            v307 = v304["x"] - v298,
            v308 = v304["y"] - v299;
          ((v304["id"] = v306),
            (v304["x"] = (v253["x"] || 0) + v307),
            (v304["y"] = (v253["y"] || 0) + v308),
            graphStore["addNode"](v304),
            v301["push"](v306));
        }),
          graphStore["setSelectedNodes"](v301),
          commit());
      }
      break;
    case "create_group":
      const v309 = v253["ids"] || v254["selectedNodeIds"];
      if (v309 && v309["length"] > 0) {
        let v310 = Infinity,
          v311 = Infinity,
          v312 = -Infinity,
          v313 = -Infinity;
        const v314 = v309["map"]((v315) => v254["nodes"][v315])["filter"](
          Boolean,
        );
        if (v314["length"] === 0) break;
        v314["forEach"]((v316) => {
          ((v310 = Math["min"](v310, v316["x"])),
            (v311 = Math["min"](v311, v316["y"])),
            (v312 = Math["max"](v312, v316["x"] + (v316["width"] || 0))),
            (v313 = Math["max"](v313, v316["y"] + (v316["height"] || 0))));
        });
        const v317 = 30,
          v318 = v310 - v317,
          v319 = v311 - (v317 + 20),
          v320 = v312 - v310 + v317 * 2,
          v321 = v313 - v311 + v317 * 2 + 20,
          v322 = generateId("group");
        (graphStore["addNode"]({
          id: v322,
          type: "group",
          x: v318,
          y: v319,
          width: v320,
          height: v321,
          label: "New Group",
        }),
          graphStore["groupNodes"](v309, v322),
          graphStore["setSelectedNodes"]([v322]),
          commit());
      }
      break;
    default:
      console["warn"]("Unknown command: ", v252);
      break;
  }
  uiStore["hideContextMenu"]();
}
export function isValidConnection(v323, v324) {
  return isValidConnectionImpl(v323, v324);
}
export function initConnectionHandles(v325) {
  return initConnectionHandlesImpl(v325);
}
export function initPickConnect(v326) {
  return initPickConnectImpl(v326);
}
export function initCanvasContextMenu(v327) {
  if (!v327) return;
  v327["addEventListener"](
    "contextmenu",
    (v328) => {
      if (
        !isEditableTextTargetInGroupedNode(
          v328["target"],
          getStateRaw()["nodes"],
        )
      )
        return;
      v328["__aiCanvasGroupedEditableContextMenu"] = true;
    },
    { capture: true },
  );
  function v329({
    key: v330,
    id: v331,
    x: v332,
    y: v333,
    width: v334,
    height: v335,
    name: v336,
    extra: extra = {},
  }) {
    if (v330 === "panorama-scene")
      return createPanoramaSceneNodeData({
        id: v331,
        x: v332,
        y: v333,
        width: v334,
        height: v335,
        name: v336,
      });
    if (v330 === "panorama-360")
      return createPanorama360NodeData({
        id: v331,
        x: v332,
        y: v333,
        width: v334,
        height: v335,
        name: v336,
      });
    if (v330 === "storyboard-script")
      return createStoryboardScriptNodeData({
        id: v331,
        x: v332,
        y: v333,
        width: v334,
        height: v335,
        name: v336,
      });
    if (v330 === "collage")
      return createEmptyCollageNodeData({
        id: v331,
        x: v332,
        y: v333,
        width: v334,
        height: v335,
        name: v336 || "拼图",
      });
    const v337 = {
      id: v331,
      type: v330,
      x: v332,
      y: v333,
      width: v334,
      height: v335,
      name: v336,
      ...extra,
    };
    (v330 === "ai-image" || v330 === "ai-video") &&
      !Object["prototype"]["hasOwnProperty"]["call"](v337, "aspectRatio") &&
      (v337["aspectRatio"] = "自适应");
    if (v330 === "ai-image" || v330 === "ai-video") {
      const v338 = getAIGenerationNodeSize(v334, v335);
      ((v337["width"] = v338["width"]), (v337["height"] = v338["height"]));
    }
    if (v330 === "source-image" || v330 === "source-video")
      return buildSourceMediaNodePayload(v337);
    return v337;
  }
  function v339(v340) {
    if (
      v340 === "ai-text" ||
      v340 === "ai-image" ||
      v340 === "ai-video" ||
      v340 === "ai-audio"
    )
      return getAIGenerationDefaultSizeByType(v340);
    if (v340 === "panorama-scene" || v340 === "panorama-360")
      return PANORAMA_SCENE_DEFAULT_SIZE;
    if (v340 === "storyboard-script") return STORYBOARD_SCRIPT_DEFAULT_SIZE;
    if (v340 === "debug") return { width: 260, height: 180 };
    return getNodeDefaultSize(v340);
  }
  function v341(v342, v343, v344) {
    const v345 = v339(v342["type"]),
      v346 = generateId(v342["type"]),
      v347 =
        v342["type"] === "source-image" || v342["type"] === "source-video"
          ? { needsAutoResize: true }
          : {};
    (graphStore["addNode"](
      v329({
        id: v346,
        key: v342["type"],
        x: v343 - v345["width"] / 2,
        y: v344 - v345["height"] / 2,
        width: v345["width"],
        height: v345["height"],
        name: v342["defaultName"] || v342["label"],
        extra: v347,
      }),
    ),
      graphStore["setSelectedNodes"]([v346]),
      commit());
  }
  function v348(v349, v350, v351 = false) {
    (document["querySelector"]("#v2PickerOverlay")?.["remove"](),
      removeContextMenus());
    const { viewport: v352 } = getStateRaw();
    let v353, v354;
    if (v351) {
      const v355 = window["innerWidth"] / 2,
        v356 = window["innerHeight"] / 2,
        v357 = screenToWorld(v355, v356, v352);
      ((v353 = v357["x"]), (v354 = v357["y"]));
    } else {
      const v358 = screenToWorld(v349, v350, v352);
      ((v353 = v358["x"]), (v354 = v358["y"]));
    }
    const v359 = document["createElement"]("div");
    v359["id"] = "v2PickerOverlay";
    const v360 = 272,
      v361 = Math["min"](v349, window["innerWidth"] - v360 - 20),
      v362 = Math["max"](12, Math["min"](v350, window["innerHeight"] - 500)),
      v363 = document["createElement"]("div");
    ((v363["className"] = "v2-node-picker"),
      (v363["style"]["left"] = v361 + "px"),
      (v363["style"]["top"] = v362 + "px"),
      (v363["style"]["width"] = v360 + "px"));
    const v364 = (v365) => {
        const v366 = document["createElement"]("div");
        v366["className"] = "v2-menu-section";
        const v367 = document["createElement"]("div");
        v367["className"] = "v2-menu-rule";
        const v368 = document["createElement"]("span");
        return (
          (v368["className"] = "v2-menu-title"),
          (v368["textContent"] = v365),
          v366["appendChild"](v368),
          v366["appendChild"](v367),
          v366
        );
      },
      v369 = (v370, v371) => {
        const v372 = document["createElement"]("button");
        v372["className"] = "v2-menu-row" + (v370["desc"] ? " has-desc" : "");
        const v373 = document["createElement"]("div");
        ((v373["className"] = "v2-menu-ico"), v373["replaceChildren"]());
        if (v370["iconEl"])
          v373["appendChild"](v370["iconEl"]["cloneNode"](true));
        v372["appendChild"](v373);
        const v374 = document["createElement"]("div");
        v374["className"] = "v2-menu-txt-wrap";
        const v375 = document["createElement"]("span");
        ((v375["className"] = "v2-menu-lbl"),
          (v375["textContent"] = v370["label"]));
        if (v370["badge"]) {
          const v376 = document["createElement"]("span");
          ((v376["textContent"] = v370["badge"]),
            (v376["className"] = "v2-badge-beta"),
            v375["appendChild"](v376));
        }
        v374["appendChild"](v375);
        if (v370["desc"]) {
          const v377 = document["createElement"]("span");
          ((v377["className"] = "v2-menu-sub"),
            (v377["textContent"] = v370["desc"]),
            v374["appendChild"](v377));
        }
        return (
          v372["appendChild"](v374),
          v372["addEventListener"]("click", (v378) => {
            (v378["stopPropagation"](), v371(v378));
          }),
          v372
        );
      },
      v379 = "var(--white-50)",
      v380 = "http://www.w3.org/2000/svg",
      v381 = (v382, v383) => {
        const v384 = document["createElementNS"](v380, "svg");
        return (
          v384["setAttribute"]("width", "18"),
          v384["setAttribute"]("height", "18"),
          v384["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
          v384["setAttribute"]("fill", "none"),
          v384["setAttribute"]("stroke", v382),
          v384["setAttribute"]("stroke-width", String(v383)),
          v384
        );
      },
      v385 = (v386) => {
        const v387 = v381(v386, 1.8),
          v388 = document["createElementNS"](v380, "path");
        v388["setAttribute"]("d", "M12 20h9");
        const v389 = document["createElementNS"](v380, "path");
        return (
          v389["setAttribute"](
            "d",
            "M16.5\x203.5a2.121\x202.121\x200\x200\x201\x203\x203L7\x2019l-4\x201\x201-4L16.5\x203.5z",
          ),
          v387["appendChild"](v388),
          v387["appendChild"](v389),
          v387
        );
      },
      v390 = (v391) => {
        const v392 = v381(v391, 1.8),
          v393 = document["createElementNS"](v380, "rect");
        (v393["setAttribute"]("x", "3"),
          v393["setAttribute"]("y", "3"),
          v393["setAttribute"]("width", "18"),
          v393["setAttribute"]("height", "18"),
          v393["setAttribute"]("rx", "3"));
        const v394 = document["createElementNS"](v380, "circle");
        (v394["setAttribute"]("cx", "8.5"),
          v394["setAttribute"]("cy", "8.5"),
          v394["setAttribute"]("r", "1.5"),
          v394["setAttribute"]("fill", v391));
        const v395 = document["createElementNS"](v380, "polyline");
        return (
          v395["setAttribute"]("points", "21 15 16 10 5 21"),
          v392["appendChild"](v393),
          v392["appendChild"](v394),
          v392["appendChild"](v395),
          v392
        );
      },
      v396 = (v397) => {
        const v398 = v381(v397, 1.8),
          v399 = document["createElementNS"](v380, "rect");
        (v399["setAttribute"]("x", "2"),
          v399["setAttribute"]("y", "6"),
          v399["setAttribute"]("width", "15"),
          v399["setAttribute"]("height", "12"),
          v399["setAttribute"]("rx", "2"));
        const v400 = document["createElementNS"](v380, "path");
        return (
          v400["setAttribute"]("d", "M17 9l5-3v12l-5-3V9z"),
          v398["appendChild"](v399),
          v398["appendChild"](v400),
          v398
        );
      },
      v401 = (v402) => {
        const v403 = v381(v402, 1.8),
          v404 = document["createElementNS"](v380, "path");
        v404["setAttribute"]("d", "M9 18V5l12-2v13");
        const v405 = document["createElementNS"](v380, "circle");
        (v405["setAttribute"]("cx", "6"),
          v405["setAttribute"]("cy", "18"),
          v405["setAttribute"]("r", "3"));
        const v406 = document["createElementNS"](v380, "circle");
        return (
          v406["setAttribute"]("cx", "18"),
          v406["setAttribute"]("cy", "16"),
          v406["setAttribute"]("r", "3"),
          v403["appendChild"](v404),
          v403["appendChild"](v405),
          v403["appendChild"](v406),
          v403
        );
      },
      v407 = (v408) => {
        const v409 = v381(v408, 1.8),
          v410 = document["createElementNS"](v380, "circle");
        (v410["setAttribute"]("cx", "12"),
          v410["setAttribute"]("cy", "12"),
          v410["setAttribute"]("r", "8.5"));
        const v411 = document["createElementNS"](v380, "path");
        v411["setAttribute"]("d", "M3.5\x2012h17");
        const v412 = document["createElementNS"](v380, "path");
        v412["setAttribute"](
          "d",
          "M12\x203.5c2.4\x202.6\x203.5\x205.4\x203.5\x208.5S14.4\x2017.9\x2012\x2020.5",
        );
        const v413 = document["createElementNS"](v380, "path");
        v413["setAttribute"](
          "d",
          "M12 3.5C9.6 6.1 8.5 8.9 8.5 12s1.1 5.9 3.5 8.5",
        );
        const v414 = document["createElementNS"](v380, "path");
        v414["setAttribute"]("d", "M6.1 6.1c3.4 1.8 8.4 1.8 11.8 0");
        const v415 = document["createElementNS"](v380, "path");
        return (
          v415["setAttribute"]("d", "M6.1 17.9c3.4-1.8 8.4-1.8 11.8 0"),
          v409["appendChild"](v410),
          v409["appendChild"](v411),
          v409["appendChild"](v412),
          v409["appendChild"](v413),
          v409["appendChild"](v414),
          v409["appendChild"](v415),
          v409
        );
      },
      v416 = (v417) => {
        const v418 = v381(v417, 1.8),
          v419 = document["createElementNS"](v380, "rect");
        (v419["setAttribute"]("x", "3"),
          v419["setAttribute"]("y", "4"),
          v419["setAttribute"]("width", "18"),
          v419["setAttribute"]("height", "16"),
          v419["setAttribute"]("rx", "2"),
          v418["appendChild"](v419),
          ["9", "14"]["forEach"]((v420) => {
            const v421 = document["createElementNS"](v380, "line");
            (v421["setAttribute"]("x1", "3"),
              v421["setAttribute"]("y1", v420),
              v421["setAttribute"]("x2", "21"),
              v421["setAttribute"]("y2", v420),
              v418["appendChild"](v421));
          }));
        const v422 = document["createElementNS"](v380, "line");
        return (
          v422["setAttribute"]("x1", "8"),
          v422["setAttribute"]("y1", "4"),
          v422["setAttribute"]("x2", "8"),
          v422["setAttribute"]("y2", "20"),
          v418["appendChild"](v422),
          v418
        );
      },
      v423 = () => {
        const v424 = v381("var(--gold)", 1.8),
          v425 = document["createElementNS"](v380, "path");
        return (
          v425["setAttribute"](
            "d",
            "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
          ),
          v424["appendChild"](v425),
          v424
        );
      },
      v426 = () => {
        const v427 = v381("var(--white-50)", 1.8),
          v428 = document["createElementNS"](v380, "path");
        v428["setAttribute"]("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");
        const v429 = document["createElementNS"](v380, "polyline");
        v429["setAttribute"]("points", "17 8 12 3 7 8");
        const v430 = document["createElementNS"](v380, "line");
        return (
          v430["setAttribute"]("x1", "12"),
          v430["setAttribute"]("y1", "3"),
          v430["setAttribute"]("x2", "12"),
          v430["setAttribute"]("y2", "15"),
          v427["appendChild"](v428),
          v427["appendChild"](v429),
          v427["appendChild"](v430),
          v427
        );
      },
      v431 = (v432) => {
        const v433 = v381(v432, 1.8),
          v434 = document["createElementNS"](v380, "path");
        v434["setAttribute"]("d", "M6 3v12a3 3 0 0 0 3 3h12");
        const v435 = document["createElementNS"](v380, "path");
        v435["setAttribute"]("d", "M3 6h12a3 3 0 0 1 3 3v12");
        const v436 = document["createElementNS"](v380, "path");
        return (
          v436["setAttribute"]("d", "M3 3l18 18"),
          v433["appendChild"](v434),
          v433["appendChild"](v435),
          v433["appendChild"](v436),
          v433
        );
      },
      v437 = (v438) => {
        const v439 = v381(v438, 1.8),
          v440 = document["createElementNS"](v380, "rect");
        (v440["setAttribute"]("x", "3"),
          v440["setAttribute"]("y", "4"),
          v440["setAttribute"]("width", "18"),
          v440["setAttribute"]("height", "16"),
          v440["setAttribute"]("rx", "2"));
        const v441 = document["createElementNS"](v380, "path");
        v441["setAttribute"]("d", "M3 10h18");
        const v442 = document["createElementNS"](v380, "path");
        return (
          v442["setAttribute"]("d", "M12\x2010v10"),
          v439["appendChild"](v440),
          v439["appendChild"](v441),
          v439["appendChild"](v442),
          v439
        );
      },
      v443 = (v444) => {
        const v445 = v381(v444, 1.8),
          v446 = document["createElementNS"](v380, "circle");
        (v446["setAttribute"]("cx", "12"),
          v446["setAttribute"]("cy", "12"),
          v446["setAttribute"]("r", "9"));
        const v447 = document["createElementNS"](v380, "path");
        v447["setAttribute"]("d", "M3 12h18");
        const v448 = document["createElementNS"](v380, "path");
        v448["setAttribute"](
          "d",
          "M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21",
        );
        const v449 = document["createElementNS"](v380, "path");
        return (
          v449["setAttribute"](
            "d",
            "M12 3C9.7 5.5 8.5 8.5 8.5 12S9.7 18.5 12 21",
          ),
          v445["appendChild"](v446),
          v445["appendChild"](v447),
          v445["appendChild"](v448),
          v445["appendChild"](v449),
          v445
        );
      },
      v450 = {
        "ai-text": () => v385(v379),
        "ai-image": () => v390(v379),
        "ai-video": () => v396(v379),
        "ai-audio": () => v401(v379),
        "panorama-scene": () => v407(v379),
        "panorama-360": () => v407(v379),
        "storyboard-script": () => v416(v379),
        collage: () => v437(v379),
        "web-preview": () => v443(v379),
        "media-clip": () => v431(v379),
        debug: () => v423(),
      },
      v451 = getNodeCreationMenuSections(PICKER_NODE_CREATION_SECTION_IDS, {
        includeDevOnly: isDevModeOn(),
      });
    (v451["forEach"]((v452) => {
      (v363["appendChild"](v364(v452["label"])),
        v452["items"]["forEach"]((v453) => {
          const v454 = v339(v453["type"]);
          v363["appendChild"](
            v369(
              {
                key: v453["type"],
                label: v453["label"],
                w: v454["width"],
                h: v454["height"],
                badge: v453["badge"],
                desc: v453["subtitle"],
                iconEl: v450[v453["type"]]?.(),
              },
              () => {
                (v359["remove"](), v341(v453, v353, v354));
              },
            ),
          );
        }));
    }),
      v363["appendChild"](v364("添加资源")),
      v363["appendChild"](
        v369(
          {
            label: NODE_CREATION_UPLOAD_ITEM["label"],
            desc: NODE_CREATION_UPLOAD_ITEM["subtitle"],
            iconBg: "var(--white-05)",
            iconEl: v426(),
          },
          () => {
            v359["remove"]();
            const v455 = document["createElement"]("input");
            ((v455["type"] = "file"),
              (v455["accept"] = "image/*,video/*,audio/*"),
              (v455["style"]["position"] = "fixed"),
              (v455["style"]["left"] = "-9999px"),
              (v455["style"]["top"] = "-9999px"),
              (v455["style"]["opacity"] = "0"));
            const v456 = () => {
              ((v455["onchange"] = null), v455["remove"]());
            };
            (v455["addEventListener"]("cancel", v456, { once: true }),
              (v455["onchange"] = (v457) => {
                const v458 = v457["target"]["files"]?.[0];
                v456();
                if (!v458) return;
                const v459 = String(v458["type"] || "")["toLowerCase"](),
                  v460 = v459["startsWith"]("image/"),
                  v461 = v459["startsWith"]("video/"),
                  v462 = v459["startsWith"]("audio/");
                if (!v460 && !v461 && !v462) {
                  window["showToast"]?.(
                    "仅支持上传图片、视频或音频文件",
                    "warning",
                  );
                  return;
                }
                let v463 = "source-image";
                if (v461) v463 = "source-video";
                else v462 && (v463 = "source-audio");
                const { width: v464, height: v465 } = getNodeDefaultSize(v463),
                  v466 = (() => {
                    const v467 = String(v458["name"] || "")["trim"]();
                    if (!v467) return "";
                    const v468 = v467["split"](/[\\/]/)["pop"]() || "",
                      v469 = v468["lastIndexOf"](".");
                    if (v469 <= 0) return v468;
                    return v468["slice"](0, v469);
                  })(),
                  v470 = generateId(v463),
                  v471 = {
                    id: v470,
                    type: v463,
                    x: v353 - v464 / 2,
                    y: v354 - v465 / 2,
                    width: v464,
                    height: v465,
                    fileName: v458["name"],
                    name:
                      v466 ||
                      (v463 === "source-video"
                        ? "视频"
                        : v463 === "source-audio"
                          ? "音频"
                          : "图片"),
                    needsAutoResize:
                      v463 === "source-image" || v463 === "source-video",
                  };
                (graphStore["addNode"](
                  v463 === "source-image" || v463 === "source-video"
                    ? buildSourceMediaNodePayload(v471)
                    : v471,
                ),
                  graphStore["setSelectedNodes"]([v470]),
                  commit(),
                  window["dispatchEvent"](
                    new CustomEvent("v2:resource-upload", {
                      detail: { id: v470, file: v458 },
                    }),
                  ));
              }),
              document["body"]["appendChild"](v455),
              v455["click"]());
          },
        ),
      ),
      v359["appendChild"](v363),
      document["body"]["appendChild"](v359));
    const v472 = v363["getBoundingClientRect"](),
      v473 = Math["max"](12, window["innerHeight"] - v472["height"] - 12),
      v474 = Number["parseFloat"](v363["style"]["top"]) || v350;
    ((v363["style"]["top"] = Math["min"](Math["max"](12, v474), v473) + "px"),
      v359["addEventListener"]("click", () => v359["remove"]()));
  }
  function v475(v476, v477) {
    const { viewport: v478 } = getStateRaw(),
      v479 = screenToWorld(v476, v477, v478),
      v480 = v479["x"],
      v481 = v479["y"],
      v482 = [],
      v483 = (v484, v485, v486) => {
        v482["push"]({ label: v484, kbd: v485, action: v486 });
      },
      v487 = () => {
        v482["push"]("sep");
      },
      v488 = (v489, v490) => {
        v482["push"]({ label: v489, subItems: v490 });
      },
      v491 = (v492, v493, v494, v495) => () => {
        const v496 = generateId(v492);
        (graphStore["addNode"](
          v329({
            id: v496,
            key: v492,
            x: v480 - v493 / 2,
            y: v481 - v494 / 2,
            width: v493,
            height: v494,
            name: v495,
            extra: {
              needsAutoResize:
                v492 === "source-image" || v492 === "source-video",
            },
          }),
        ),
          graphStore["setSelectedNodes"]([v496]),
          commit());
      },
      v497 = getNodeCreationMenuSections(CONTEXT_NODE_CREATION_SECTION_IDS, {
        includeDevOnly: isDevModeOn(),
      })["map"]((v498) => ({
        label: v498["label"],
        subItems: v498["items"]["map"]((v499) => {
          const v500 = v339(v499["type"]);
          return {
            label: v499["label"],
            desc: v499["subtitle"],
            badge: v499["badge"],
            action: v491(
              v499["type"],
              v500["width"],
              v500["height"],
              v499["defaultName"] || v499["label"],
            ),
          };
        }),
      }));
    (v488("添加节点", [...v497]),
      v487(),
      v483("粘贴", "Ctrl V", () => {
        window["dispatchEvent"](
          new CustomEvent("v2:canvas-paste-request", {
            detail: { screenX: v476, screenY: v477 },
          }),
        );
      }),
      v483("撤销", "Ctrl Z", () => undo()),
      v483("重做", "Ctrl Y", () => redo()),
      showContextMenu(v476, v477, v482));
  }
  (v327["addEventListener"]("dblclick", (v501) => {
    if (v501["target"]["closest"](".v2-node")) return;
    (v501["preventDefault"](),
      v501["stopPropagation"](),
      v348(v501["clientX"], v501["clientY"]));
  }),
    v327["addEventListener"]("contextmenu", (v502) => {
      v502["preventDefault"]();
      const v503 = v502["target"]["closest"](".v2-node"),
        v504 = getEditableTextTarget(v502["target"]),
        v505 = window["getSelection"]();
      if (!v503 && v505 && !v505["isCollapsed"])
        try {
          v505["removeAllRanges"]();
        } catch {}
      const v506 = v505 ? v505["toString"]()["trim"]() : "";
      let v507 = false;
      if (v505 && v506 && v505["rangeCount"] > 0 && !v505["isCollapsed"]) {
        const v508 = v502["target"];
        for (let v509 = 0; v509 < v505["rangeCount"]; v509++) {
          const v510 = v505["getRangeAt"](v509);
          try {
            if (v510["intersectsNode"](v508)) {
              v507 = true;
              break;
            }
          } catch {}
        }
      }
      if (v506 && v507) {
        handleTextContextMenu(v502["clientX"], v502["clientY"], v506, {
          anchorNodeId: v503?.["dataset"]?.["nodeId"] || v503?.["id"] || null,
          pasteTarget: v504,
          pasteSelection: v504 ? captureEditableSelection(v504) : null,
        });
        return;
      }
      if (v504) {
        showTextInputContextMenu({
          target: v504,
          screenX: v502["clientX"],
          screenY: v502["clientY"],
          snapshot: captureEditableSelection(v504),
        });
        return;
      }
      if (v503) {
        handleContextMenu(v502["clientX"], v502["clientY"]);
        return;
      }
      const { selectedNodeIds: v511 } = getStateRaw();
      if (v511 && v511["length"] > 0) {
        showNodesContextMenu(v502["clientX"], v502["clientY"], {
          primaryNodeId: v511[v511["length"] - 1],
          targetNodeIds: v511,
        });
        return;
      }
      v475(v502["clientX"], v502["clientY"]);
    }),
    (initCanvasContextMenu["_showPicker"] = v348));
}
export function handleTextContextMenu(v512, v513, v514, v515 = {}) {
  const v516 = [],
    v517 = (v518, v519, v520) => {
      v516["push"]({ label: v518, kbd: v519, action: v520 });
    },
    v521 = () => {
      v516["push"]("sep");
    },
    v522 = getStateRaw(),
    { viewport: v523, nodes: v524 } = v522,
    { x: v525, y: v526 } = screenToWorld(v512, v513, v523),
    v527 = String(v515["anchorNodeId"] || "")["trim"]();
  let v528 = v527 && v524?.[v527] ? v527 : hitTestNode(v512, v513, v524, v523),
    v529 = v528 ? v524[v528] : null;
  v529 &&
    (graphStore["setSelectedNodes"]([v528]),
    v517("复制节点", "Ctrl C", () => {
      (executeCommand("copy"), window["showToast"]?.("节点已复制", "success"));
    }),
    v517("剪切节点", "Ctrl\x20X", () => {
      (executeCommand("copy", { ids: [v528] }),
        executeCommand("delete_nodes", { ids: [v528] }),
        window["showToast"]?.("节点已剪切", "success"));
    }),
    v517("创建副本", "", () => {
      const v530 = getStateRaw()["selectedNodeIds"],
        v531 = v530["includes"](v528) ? [...v530] : [v528],
        v532 = v531["length"] === 1 ? v529["height"] || 280 : 300,
        v533 = calcSafeSpawnPosNearNode(v524, v529, 280, v532),
        v534 = v533["x"] - v529["x"],
        v535 = v533["y"] - v529["y"],
        v536 = cloneNodesWithEdges(v531, v534, v535);
      (graphStore["setSelectedNodes"](Object["values"](v536)),
        window["showToast"]?.("包含连线的副本已创建", "success"));
    }));
  v517("复制文本", "Ctrl\x20C", () => {
    navigator["clipboard"]
      ["writeText"](v514)
      ["then"](() => {
        (markSystemClipboardWrite({ text: v514 }),
          window["showToast"]?.("已复制选中文本", "success"));
      })
      ["catch"](() => {
        window["showToast"]?.("复制失败，请检查浏览器权限", "error");
      });
  });
  v515["pasteTarget"] &&
    v517("粘贴文本", "Ctrl\x20V", () => {
      pasteTextIntoEditableFromClipboard(
        v515["pasteTarget"],
        v515["pasteSelection"] || null,
      );
    });
  v529 &&
    v517("删除节点", "Del", () => {
      (graphStore["deleteNodes"]([v528]),
        graphStore["clearSelection"](),
        commit());
    });
  v521();
  const v537 = (v538, v539, v540, v541) => () => {
    const v542 =
        v538 === "ai-image" || v538 === "ai-video"
          ? getAIGenerationNodeSize(v539, v540)
          : { width: v539, height: v540 },
      v543 = generateId(v538);
    let v544 = v525 - v542["width"] / 2,
      v545 = v526 - v542["height"] / 2;
    if (v529) {
      const v546 = calcSafeSpawnPosNearNode(
        v524,
        v529,
        v542["width"],
        v542["height"],
      );
      ((v544 = v546["x"]), (v545 = v546["y"]));
    }
    (graphStore["addNode"]({
      id: v543,
      type: v538,
      x: v544,
      y: v545,
      width: v542["width"],
      height: v542["height"],
      name: v541,
      prompt: v514,
      needsAutoResize: v538 === "ai-image" || v538 === "ai-video",
      ...(v538 === "ai-image" || v538 === "ai-video"
        ? { aspectRatio: "自适应" }
        : {}),
    }),
      graphStore["setSelectedNodes"]([v543]),
      commit());
  };
  {
    const v547 = getAIGenerationDefaultSizeByType("ai-text");
    v517(
      "生成文本",
      "",
      v537("ai-text", v547["width"], v547["height"], "生成文本"),
    );
  }
  {
    const v548 = getAIGenerationDefaultSizeByType("ai-image");
    v517(
      "生成图像",
      "",
      v537("ai-image", v548["width"], v548["height"], "生成图像"),
    );
  }
  {
    const v549 = getAIGenerationDefaultSizeByType("ai-video");
    v517(
      "生成视频",
      "",
      v537("ai-video", v549["width"], v549["height"], "生成视频"),
    );
  }
  {
    const v550 = getAIGenerationDefaultSizeByType("ai-audio");
    v517(
      "生成音频",
      "",
      v537("ai-audio", v550["width"], v550["height"], "生成音频"),
    );
  }
  showContextMenu(v512, v513, v516);
}

import appStore, {
  graphStore as graphStoreImport,
  uiStore as uiStoreImport,
  workspaceStore as workspaceStoreImport,
} from "../../core/stores/appStore.js";
import { isNodeType } from "../registry.js";
import { commit } from "../history.js";
import {
  screenToWorld,
  worldToScreen,
  isPointInRect,
  hitTestNode,
  findClosestNode,
  generateId,
  getNodeScreenRect,
  createNodeSpatialIndex,
  queryNodeSpatialIndexAtWorldPoint,
} from "../../core/math.js";
import { createLinkCursor, getCursorSize } from "../cursorUtils.js";
import {
  rafSampleLatest,
  getDisplayedMediaSizeFromNode,
  getDisplayedVideoMetaFromNode,
} from "../../utils/dom.js";
import {
  buildSourceMediaNodePayload,
  getAIGenerationDefaultSizeByType,
  getAIGenerationNodeSize,
  getNodeDefaultSize,
} from "../../services/fileService.js";
import {
  createPanorama360NodeData,
  PANORAMA_SCENE_DEFAULT_SIZE,
} from "../panoramaSceneNode/sceneNode.js";
import {
  createStoryboardScriptNodeData,
  STORYBOARD_SCRIPT_DEFAULT_SIZE,
} from "../../core/storyboardScriptFactory.js";
import {
  isDreaminaStyleVideoModel,
  normalizeDreaminaVideoRouteMode,
} from "../dreaminaVideoModelHelper.js";
import {
  getTargetInputPolicy,
  hasUsableInputNodeSource,
  isInputKindAllowed,
  isRhPersonReplaceWorkflowModel,
  normalizeInputKind,
  resolveEffectiveInputKind,
} from "../modelInputPolicy.js";
import {
  getMediaClipInputKind,
  isMediaClipNodeType,
  isSupportedMediaClipInput,
} from "../../components/media-clip/mediaClipState.js";
import { removeCoveredAssetInputRefForConnection } from "../promptAssetInputOverride.js";
import { getNodeCreationMenuItem } from "../nodeCreationMenuCatalog.js";
import {
  getExclusiveSlotsForFixedSlot,
  getFixedInputSlotConfigFromManifest,
} from "../fixedInputAssetRefs.js";
import { stripImageGenerationResultStateForDerivedNode } from "../../core/imageTaskRuntimeState.js";
import { wouldCreateGroupOutputCycle } from "../groupDynamicOutput.js";
import { ANIME_REAL_MODEL_ID } from "../../manifests/index.js";
const graphStore = appStore?.["graphStore"] || graphStoreImport || appStore,
  uiStore = appStore?.["uiStore"] || uiStoreImport || appStore,
  workspaceStore =
    appStore?.["workspaceStore"] || workspaceStoreImport || appStore;
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
function _buildOutEdgeMap(v0) {
  const v1 = new Map();
  for (const v2 of v0) {
    if (!v2) continue;
    const v3 = v2["sourceId"],
      v4 = v2["targetId"];
    if (!v3 || !v4) continue;
    let v5 = v1["get"](v3);
    (!v5 && ((v5 = new Set()), v1["set"](v3, v5)), v5["add"](v4));
  }
  return v1;
}
const _edgeIndexCache = {
  edges: null,
  edgesRev: -1,
  outMap: new Map(),
  incomingByTarget: new Map(),
};
function _applyNodeCreationMenuMeta(v6) {
  const v7 = getNodeCreationMenuItem(v6?.["type"]);
  if (!v7) return v6;
  return {
    ...v6,
    label: v7["label"] || v6["label"],
    desc: v7["subtitle"] || v6["desc"],
    badge: v7["badge"] ?? v6["badge"],
    defaultName: v7["defaultName"] || v7["label"] || v6["label"],
  };
}
function _buildEdgeIndexes(v8) {
  const v9 = new Map(),
    v10 = new Map();
  for (const v11 of Object["values"](v8 || {})) {
    if (!v11) continue;
    const v12 = v11["sourceId"],
      v13 = v11["targetId"];
    if (v12 && v13) {
      let v14 = v9["get"](v12);
      (!v14 && ((v14 = new Set()), v9["set"](v12, v14)), v14["add"](v13));
    }
    if (v13) {
      let v15 = v10["get"](v13);
      (!v15 && ((v15 = []), v10["set"](v13, v15)), v15["push"](v11));
    }
  }
  return { outMap: v9, incomingByTarget: v10 };
}
function _getEdgeIndexes(v16, v17) {
  if (!v16 || typeof v16 !== "object")
    return (
      (_edgeIndexCache["edges"] = null),
      (_edgeIndexCache["edgesRev"] = -1),
      (_edgeIndexCache["outMap"] = new Map()),
      (_edgeIndexCache["incomingByTarget"] = new Map()),
      _edgeIndexCache
    );
  const v18 = Number["isFinite"](v17) ? v17 : -1;
  if (_edgeIndexCache["edges"] === v16 && _edgeIndexCache["edgesRev"] === v18)
    return _edgeIndexCache;
  const { outMap: v19, incomingByTarget: v20 } = _buildEdgeIndexes(v16);
  return (
    (_edgeIndexCache["edges"] = v16),
    (_edgeIndexCache["edgesRev"] = v18),
    (_edgeIndexCache["outMap"] = v19),
    (_edgeIndexCache["incomingByTarget"] = v20),
    _edgeIndexCache
  );
}
function _getOutEdgeMap(v21, v22) {
  return _getEdgeIndexes(v21, v22)["outMap"];
}
function _getIncomingEdgesByTarget(v23, v24, v25) {
  if (!v25) return [];
  return _getEdgeIndexes(v23, v24)["incomingByTarget"]["get"](v25) || [];
}
let _getDragContext = () => ({});
const _SVG_NS = "http://www.w3.org/2000/svg",
  _AI_TEXT_DEFAULT_SIZE = getAIGenerationDefaultSizeByType("ai-text"),
  _AI_IMAGE_DEFAULT_SIZE = getAIGenerationDefaultSizeByType("ai-image"),
  _AI_VIDEO_DEFAULT_SIZE = getAIGenerationDefaultSizeByType("ai-video"),
  _AI_AUDIO_DEFAULT_SIZE = getAIGenerationDefaultSizeByType("ai-audio"),
  _PANORAMA_360_TARGET_TYPES = new Set([
    "panorama-360",
    "panorama_360",
    "panorama360",
  ]),
  _PANORAMA_SOURCE_BLOCKED_TYPES = new Set([
    "panorama-scene",
    "panorama_scene",
    "panorama-360",
    "panorama_360",
    "panorama360",
  ]),
  _PANORAMA_360_IMAGE_SOURCE_TYPES = new Set([
    "source-image",
    "ai-image",
    "image",
  ]),
  _NODE_SPATIAL_INDEX_DEFAULT_KEY = "default",
  _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY = "edge-hover",
  _nodeSpatialIndexCache = new Map();
function _resolveEdgeHoverNodeRect(v26) {
  if (!v26 || typeof v26 !== "object") return null;
  return {
    x: v26["x"],
    y: v26["y"],
    width: v26["width"] || (isNodeType(v26, "group") ? 400 : 260),
    height: v26["height"] || (isNodeType(v26, "group") ? 300 : 80),
  };
}
function _getNodeSpatialIndex(v27, v28, v29 = _NODE_SPATIAL_INDEX_DEFAULT_KEY) {
  if (!v27 || typeof v27 !== "object") return null;
  const v30 = Number["isFinite"](v28) ? v28 : -1,
    v31 = _nodeSpatialIndexCache["get"](v29);
  if (v31 && v31["nodes"] === v27 && v31["persistRev"] === v30)
    return v31["index"];
  const v32 =
    v29 === _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY
      ? createNodeSpatialIndex(v27, { resolveRect: _resolveEdgeHoverNodeRect })
      : createNodeSpatialIndex(v27);
  return (
    _nodeSpatialIndexCache["set"](v29, {
      nodes: v27,
      persistRev: v30,
      index: v32,
    }),
    v32
  );
}
function _svgEl(v33, v34, v35, v36) {
  const v37 = document["createElementNS"](_SVG_NS, "svg");
  return (
    v37["setAttribute"]("width", String(v33)),
    v37["setAttribute"]("height", String(v34)),
    v37["setAttribute"]("viewBox", "0 0 24 24"),
    v37["setAttribute"]("fill", "none"),
    v37["setAttribute"]("stroke", v35),
    v37["setAttribute"]("stroke-width", String(v36)),
    v37
  );
}
function _iconAiText(v38) {
  const v39 = _svgEl(18, 18, v38, 1.8),
    v40 = document["createElementNS"](_SVG_NS, "path");
  v40["setAttribute"]("d", "M12 20h9");
  const v41 = document["createElementNS"](_SVG_NS, "path");
  return (
    v41["setAttribute"](
      "d",
      "M16.5\x203.5a2.121\x202.121\x200\x200\x201\x203\x203L7\x2019l-4\x201\x201-4L16.5\x203.5z",
    ),
    v39["appendChild"](v40),
    v39["appendChild"](v41),
    v39
  );
}
function _iconAiImage(v42) {
  const v43 = _svgEl(18, 18, v42, 1.8),
    v44 = document["createElementNS"](_SVG_NS, "rect");
  (v44["setAttribute"]("x", "3"),
    v44["setAttribute"]("y", "3"),
    v44["setAttribute"]("width", "18"),
    v44["setAttribute"]("height", "18"),
    v44["setAttribute"]("rx", "3"));
  const v45 = document["createElementNS"](_SVG_NS, "circle");
  (v45["setAttribute"]("cx", "8.5"),
    v45["setAttribute"]("cy", "8.5"),
    v45["setAttribute"]("r", "1.5"),
    v45["setAttribute"]("fill", v42));
  const v46 = document["createElementNS"](_SVG_NS, "polyline");
  return (
    v46["setAttribute"]("points", "21 15 16 10 5 21"),
    v43["appendChild"](v44),
    v43["appendChild"](v45),
    v43["appendChild"](v46),
    v43
  );
}
function _iconAiVideo(v47) {
  const v48 = _svgEl(18, 18, v47, 1.8),
    v49 = document["createElementNS"](_SVG_NS, "rect");
  (v49["setAttribute"]("x", "2"),
    v49["setAttribute"]("y", "6"),
    v49["setAttribute"]("width", "15"),
    v49["setAttribute"]("height", "12"),
    v49["setAttribute"]("rx", "2"));
  const v50 = document["createElementNS"](_SVG_NS, "path");
  return (
    v50["setAttribute"]("d", "M17 9l5-3v12l-5-3V9z"),
    v48["appendChild"](v49),
    v48["appendChild"](v50),
    v48
  );
}
function _iconAiAudio(v51) {
  const v52 = _svgEl(18, 18, v51, 1.8),
    v53 = document["createElementNS"](_SVG_NS, "path");
  v53["setAttribute"]("d", "M9\x2018V5l12-2v13");
  const v54 = document["createElementNS"](_SVG_NS, "circle");
  (v54["setAttribute"]("cx", "6"),
    v54["setAttribute"]("cy", "18"),
    v54["setAttribute"]("r", "3"));
  const v55 = document["createElementNS"](_SVG_NS, "circle");
  return (
    v55["setAttribute"]("cx", "18"),
    v55["setAttribute"]("cy", "16"),
    v55["setAttribute"]("r", "3"),
    v52["appendChild"](v53),
    v52["appendChild"](v54),
    v52["appendChild"](v55),
    v52
  );
}
function _iconStoryboardScript(v56) {
  const v57 = _svgEl(18, 18, v56, 1.8),
    v58 = document["createElementNS"](_SVG_NS, "rect");
  (v58["setAttribute"]("x", "3"),
    v58["setAttribute"]("y", "4"),
    v58["setAttribute"]("width", "18"),
    v58["setAttribute"]("height", "16"),
    v58["setAttribute"]("rx", "2"));
  const v59 = document["createElementNS"](_SVG_NS, "line");
  (v59["setAttribute"]("x1", "3"),
    v59["setAttribute"]("y1", "9"),
    v59["setAttribute"]("x2", "21"),
    v59["setAttribute"]("y2", "9"));
  const v60 = document["createElementNS"](_SVG_NS, "line");
  (v60["setAttribute"]("x1", "3"),
    v60["setAttribute"]("y1", "14"),
    v60["setAttribute"]("x2", "21"),
    v60["setAttribute"]("y2", "14"));
  const v61 = document["createElementNS"](_SVG_NS, "line");
  return (
    v61["setAttribute"]("x1", "8"),
    v61["setAttribute"]("y1", "4"),
    v61["setAttribute"]("x2", "8"),
    v61["setAttribute"]("y2", "20"),
    v57["appendChild"](v58),
    v57["appendChild"](v59),
    v57["appendChild"](v60),
    v57["appendChild"](v61),
    v57
  );
}
function _iconSourceText(v62) {
  const v63 = _svgEl(18, 18, v62, 1.8),
    v64 = document["createElementNS"](_SVG_NS, "polyline");
  v64["setAttribute"]("points", "4 7 4 4 20 4 20 7");
  const v65 = document["createElementNS"](_SVG_NS, "line");
  (v65["setAttribute"]("x1", "9"),
    v65["setAttribute"]("y1", "20"),
    v65["setAttribute"]("x2", "15"),
    v65["setAttribute"]("y2", "20"));
  const v66 = document["createElementNS"](_SVG_NS, "line");
  return (
    v66["setAttribute"]("x1", "12"),
    v66["setAttribute"]("y1", "4"),
    v66["setAttribute"]("x2", "12"),
    v66["setAttribute"]("y2", "20"),
    v63["appendChild"](v64),
    v63["appendChild"](v65),
    v63["appendChild"](v66),
    v63
  );
}
function _isPanorama360TargetType(v67) {
  return _PANORAMA_360_TARGET_TYPES["has"](String(v67 || "")["trim"]());
}
function _isBlockedOutputNodeType(v68) {
  return _PANORAMA_SOURCE_BLOCKED_TYPES["has"](String(v68 || "")["trim"]());
}
function _isPanorama360ImageSourceType(v69) {
  return _PANORAMA_360_IMAGE_SOURCE_TYPES["has"](String(v69 || "")["trim"]());
}
function _isStoryboardInputTargetType(v70) {
  const v71 = String(v70 || "")["trim"]();
  return v71 === "storyboard" || v71 === "storyboard-script";
}
function _isModelPolicyTargetType(v72) {
  const v73 = String(v72 || "")["trim"]();
  return (
    v73 === "ai-image" ||
    v73 === "ai-text" ||
    v73 === "ai-video" ||
    v73 === "ai-audio"
  );
}
function _isSharedInputPolicyTargetType(v74) {
  return _isModelPolicyTargetType(v74) || _isStoryboardInputTargetType(v74);
}
export function getAllowedInputNodeTypesForSidePlus(v75) {
  const v76 = String(v75 || "")["trim"](),
    v77 = {
      "source-image": ["source-image", "ai-image"],
      "ai-image": ["source-image", "ai-image"],
      "ai-audio": [
        "source-text",
        "ai-text",
        "source-audio",
        "source-video",
        "ai-audio",
        "ai-video",
      ],
      "ai-video": [
        "source-text",
        "source-video",
        "ai-image",
        "ai-audio",
        "ai-video",
      ],
      "ai-text": ["source-text", "ai-image", "ai-video", "ai-audio"],
      "media-clip": [
        "source-image",
        "ai-image",
        "source-video",
        "ai-video",
        "source-audio",
        "ai-audio",
      ],
      storyboard: [
        "source-text",
        "source-image",
        "source-video",
        "ai-text",
        "ai-image",
        "ai-video",
      ],
      "storyboard-script": [
        "source-text",
        "source-image",
        "source-video",
        "ai-text",
        "ai-image",
        "ai-video",
      ],
      "panorama-360": ["source-image", "ai-image"],
      panorama_360: ["source-image", "ai-image"],
      panorama360: ["source-image", "ai-image"],
    };
  return v77[v76] || ["source-text"];
}
export function getAllowedGenerationNodeTypesForQuoteMenu(v78 = []) {
  const v79 = [
      "ai-text",
      "ai-image",
      "ai-video",
      "ai-audio",
      "storyboard-script",
      "panorama-360",
    ],
    v80 = Array["isArray"](v78) ? v78["filter"](Boolean) : [];
  return v79["filter"]((v81) =>
    v80["some"]((v82) =>
      isValidConnection(v82, { id: "__fake_" + v81, type: v81 }),
    ),
  );
}
export function setDragContextGetter(v83) {
  _getDragContext = typeof v83 === "function" ? v83 : () => ({});
}
export function isValidConnection(v84, v85) {
  if (!v84 || !v85) return false;
  if (v84["id"] === v85["id"]) return false;
  const v86 = v84["type"] || "",
    v87 = v85["type"] || "";
  if (v86 === "debug" || _isBlockedOutputNodeType(v86)) return false;
  const v88 = (v89) =>
    v89 === "ai-image" ||
    v89 === "ai-text" ||
    v89 === "ai-video" ||
    v89 === "ai-audio" ||
    v89 === "media-clip" ||
    _isStoryboardInputTargetType(v89) ||
    v89 === "group" ||
    _isPanorama360TargetType(v89);
  if (!v88(v87)) return false;
  if (v86 === "group")
    return v87 === "group" || _isSharedInputPolicyTargetType(v87);
  if (_isPanorama360TargetType(v87)) {
    if (!_isPanorama360ImageSourceType(v86)) return false;
  }
  if (isMediaClipNodeType(v87)) return isSupportedMediaClipInput(v84);
  if (v87 === "ai-image") {
    const v90 = [
      "source-image",
      "image",
      "ai-image",
      "source-text",
      "text",
      "ai-text",
    ];
    if (!v90["includes"](v86)) return false;
  }
  if (v87 === "ai-audio") {
    if (v86 === "source-image" || v86 === "image" || v86 === "ai-image")
      return false;
  }
  if (_isSharedInputPolicyTargetType(v87)) {
    const v91 = resolveEffectiveInputKind(v84);
    if (v91 && !isInputKindAllowed(getTargetInputPolicy(v85), v91))
      return false;
  }
  if (
    resolveEffectiveInputKind(v84) === "video" &&
    !hasUsableInputNodeSource(v84)
  )
    return false;
  return true;
}
function _videoSourceKey(v92) {
  if (!v92 || typeof v92 !== "object") return "";
  return (
    String(v92["localPath"] || "")["trim"]() ||
    String(v92["displayLocalPath"] || "")["trim"]() ||
    String(v92["originalLocalPath"] || "")["trim"]() ||
    String(v92["videoLocalPath"] || "")["trim"]() ||
    String(v92["videoUrl"] || "")["trim"]() ||
    String(v92["src"] || "")["trim"]() ||
    String(v92["url"] || "")["trim"]() ||
    String(v92["resultUrl"] || "")["trim"]() ||
    String(v92["sourceUrl"] || "")["trim"]() ||
    String(v92["thumbId"] || "")["trim"]()
  );
}
function _isUnavailableVideoRecord(v93) {
  const v94 = _videoSourceKey(v93);
  if (!v94) return false;
  return (
    v93?.["mediaUnavailable"] === true &&
    String(v93?.["mediaUnavailableSource"] || "")["trim"]() === v94
  );
}
const SIDE_PLUS_POINTER_BLOCKER_SELECTOR = [
  ".text-prompt-panel",
  ".prompt-input-wrapper",
  ".prompt-textarea",
  ".prompt-panel-footer",
  ".floating-menu",
  ".img-model-menu",
  ".model-menu",
  ".fa-model-menu",
  ".img-ratio-popup",
  ".rh-res-popup",
  ".rh-adv-panel",
  ".rh-vram-adv-panel",
  ".node-floating-toolbar",
  "[data-ui-stop=\x221\x22]",
]["join"](",");
export function isSidePlusPointerBlockedByElement(v95) {
  const v96 =
    v95 && typeof v95["closest"] === "function"
      ? v95
      : v95?.["parentElement"] || null;
  if (!v96) return false;
  if (v96["closest"](".side-plus-btn,\x20#v2-side-plus-holder")) return false;
  return !!v96["closest"](SIDE_PLUS_POINTER_BLOCKER_SELECTOR);
}
function _isSidePlusPointerBlockedAt(v97, v98) {
  if (typeof document === "undefined") return false;
  if (!Number["isFinite"](v97) || !Number["isFinite"](v98)) return false;
  const v99 = document["elementFromPoint"]?.(v97, v98);
  return isSidePlusPointerBlockedByElement(v99);
}
export function resolveSidePlusRenderState({
  isDraggingPlus: isDraggingPlus = false,
  isNodeDragging: isNodeDragging = false,
  isBoxSelecting: isBoxSelecting = false,
  isConnecting: isConnecting = false,
  isPanning: isPanning = false,
  isZooming: isZooming = false,
  isViewportAnimating: isViewportAnimating = false,
  isSpaceHeld: isSpaceHeld = false,
  selectedCount: selectedCount = 0,
  requestedSelectionOnly: requestedSelectionOnly = false,
} = {}) {
  const v100 = Number(selectedCount) || 0,
    v101 = v100 > 0,
    v102 = v100 >= 2;
  if (isDraggingPlus) return { shouldClear: true, selectionOnly: false };
  if (isNodeDragging) return { shouldClear: true, selectionOnly: false };
  if (v101 && (isBoxSelecting || isConnecting || isSpaceHeld))
    return { shouldClear: false, selectionOnly: true };
  if (isBoxSelecting || isConnecting)
    return { shouldClear: true, selectionOnly: false };
  const v103 = requestedSelectionOnly || v102;
  if (isSpaceHeld && !isPanning && !v103)
    return { shouldClear: true, selectionOnly: false };
  return { shouldClear: false, selectionOnly: v103 };
}
export function shouldShowSidePlusForNode({
  sideDistance: v104,
  threshold: v105,
  isSelected: isSelected = false,
  isHovered: isHovered = false,
  isInside: isInside = false,
  nodeType: nodeType = "",
} = {}) {
  if (isSelected) return true;
  if (!isHovered) return false;
  const v106 = Number(v104),
    v107 = Number(v105);
  if (Number["isFinite"](v106) && Number["isFinite"](v107) && v106 < v107)
    return true;
  return !!isInside && String(nodeType || "")["trim"]() !== "group";
}
export function shouldUseInlineMediaClipAddSlot(v108 = "") {
  return isMediaClipNodeType(v108);
}
export function shouldShowRightSidePlusForNodeType(v109 = "") {
  const v110 = String(v109 || "")["trim"]();
  if (v110 === "storyboard") return false;
  if (v110 === "collage") return false;
  return (
    !_isBlockedOutputNodeType(v110) && !shouldUseInlineMediaClipAddSlot(v110)
  );
}
export function getGroupSidePlusAnchorCandidateIds({
  nodes: v111,
  viewport: v112,
  mx: v113,
  my: v114,
  threshold: v115,
  gap: gap = 36,
} = {}) {
  if (!Number["isFinite"](v113) || !Number["isFinite"](v114)) return [];
  const v116 = Number(v112?.["zoom"]) || 1,
    v117 = Number(v115);
  if (!Number["isFinite"](v117)) return [];
  const v118 = [];
  for (const [v119, v120] of Object["entries"](v111 || {})) {
    if (!isNodeType(v120, "group")) continue;
    const v121 = String(v120?.["id"] || v119 || "")["trim"]();
    if (!v121) continue;
    const v122 = v120["width"] || 400,
      v123 = v120["height"] || 300,
      v124 = getNodeScreenRect(
        { x: v120["x"], y: v120["y"], width: v122, height: v123 },
        v112,
      ),
      v125 = v124["right"] + gap * v116,
      v126 = v124["top"] + v124["height"] / 2;
    if (Math["hypot"](v113 - v125, v114 - v126) < v117) v118["push"](v121);
  }
  return v118;
}
export function resolveSidePlusCandidateIds({
  selectedIds: selectedIds = [],
  isMultiSelection: isMultiSelection = false,
  selectionOnly: selectionOnly = false,
  hoverNodeId: hoverNodeId = null,
  groupAnchorIds: groupAnchorIds = [],
} = {}) {
  const v127 = Array["isArray"](groupAnchorIds)
      ? groupAnchorIds["filter"](Boolean)
      : [],
    v128 = Array["isArray"](selectedIds) ? selectedIds["filter"](Boolean) : [],
    v129 = isMultiSelection ? new Set() : new Set(v128),
    v130 = new Set(),
    v131 = !isMultiSelection && !selectionOnly && v127["length"] > 0;
  !isMultiSelection &&
    !selectionOnly &&
    hoverNodeId &&
    !v131 &&
    v129["add"](hoverNodeId);
  if (!isMultiSelection && !selectionOnly)
    for (const v132 of v127) {
      (v129["add"](v132), v130["add"](v132));
    }
  return { candidateIds: v129, sideAnchorHoverIds: v130 };
}
export function computeMultiSelectionBoundsForSidePlus(v133, v134, v135 = {}) {
  const v136 = Array["isArray"](v133) ? v133 : [];
  if (v136["length"] < 2) return null;
  const v137 =
      v135?.["movedNodeIds"] &&
      typeof v135["movedNodeIds"][Symbol["iterator"]] === "function"
        ? new Set(v135["movedNodeIds"])
        : null,
    v138 = Number["isFinite"](v135?.["offsetX"]) ? v135["offsetX"] : 0,
    v139 = Number["isFinite"](v135?.["offsetY"]) ? v135["offsetY"] : 0;
  let v140 = Infinity,
    v141 = Infinity,
    v142 = -Infinity,
    v143 = -Infinity,
    v144 = 0;
  for (const v145 of v136) {
    const v146 = v134?.[v145];
    if (!v146) continue;
    const v147 = v137?.["has"](v145) === true,
      v148 = v146["x"] + (v147 ? v138 : 0),
      v149 = v146["y"] + (v147 ? v139 : 0);
    v144 += 1;
    const v150 = v146["width"] || 260,
      v151 = v146["height"] || 100,
      v152 = v148,
      v153 = v146["type"] !== "group" ? v149 - 30 : v149,
      v154 = v148 + v150,
      v155 = v149 + v151;
    ((v140 = Math["min"](v140, v152)),
      (v141 = Math["min"](v141, v153)),
      (v142 = Math["max"](v142, v154)),
      (v143 = Math["max"](v143, v155)));
  }
  if (v144 < 2 || !Number["isFinite"](v140) || !Number["isFinite"](v141))
    return null;
  return { minX: v140, minY: v141, maxX: v142, maxY: v143 };
}
let _draftEdgeCache = {
  pathEl: null,
  lastStartX: 0,
  lastStartY: 0,
  lastEndX: 0,
  lastEndY: 0,
  lastSide: "",
  lastZoom: 0,
};
function _resetDraftEdgeCache(v156 = null) {
  _draftEdgeCache = {
    pathEl: v156,
    lastStartX: 0,
    lastStartY: 0,
    lastEndX: 0,
    lastEndY: 0,
    lastSide: "",
    lastZoom: 0,
  };
}
function _getDraftEdgePath() {
  if (typeof document === "undefined") return (_resetDraftEdgeCache(), null);
  const v157 = document["getElementById"]("v2-edges");
  if (!v157) return (_resetDraftEdgeCache(), null);
  let v158 = _draftEdgeCache["pathEl"];
  return (
    v158 &&
      (v158["parentNode"] !== v157 || v158["isConnected"] === false) &&
      (v158["remove"]?.(), (v158 = null)),
    !v158 &&
      ((v158 = v157["querySelector"]?.("#v2-draft-edge") || null),
      v158 &&
        (v158["parentNode"] !== v157 || v158["isConnected"] === false) &&
        (v158 = null)),
    !v158 &&
      ((v158 = document["createElementNS"](
        "http://www.w3.org/2000/svg",
        "path",
      )),
      (v158["id"] = "v2-draft-edge"),
      v158["setAttribute"]("class", "conn-drag-path"),
      v158["setAttribute"]("fill", "none"),
      v158["setAttribute"]("stroke", "var(--indigo-70)"),
      v158["setAttribute"]("stroke-linecap", "round"),
      v157["appendChild"](v158)),
    _draftEdgeCache["pathEl"] !== v158 && _resetDraftEdgeCache(v158),
    v158
  );
}
function _renderDraftEdgeDirectly(v159, v160, v161, v162, v163, v164) {
  const v165 = _getDraftEdgePath();
  if (!v165) return;
  const v166 = Math["hypot"](v161 - v159, v162 - v160);
  if (v166 < 5) {
    v165["style"]["display"] = "none";
    return;
  }
  const v167 =
      v159 !== _draftEdgeCache["lastStartX"] ||
      v160 !== _draftEdgeCache["lastStartY"] ||
      v161 !== _draftEdgeCache["lastEndX"] ||
      v162 !== _draftEdgeCache["lastEndY"] ||
      v163 !== _draftEdgeCache["lastSide"],
    v168 = v164["zoom"] !== _draftEdgeCache["lastZoom"];
  if (v167) {
    const v169 = v163 === "left",
      v170 = Math["abs"](v161 - v159),
      v171 = Math["min"](v170 * 0.75, 80),
      v172 = v169 ? v159 - v171 : v159 + v171,
      v173 = v169 ? v161 + v171 : v161 - v171,
      v174 =
        "M\x20" +
        v159 +
        "\x20" +
        v160 +
        " C " +
        v172 +
        "\x20" +
        v160 +
        ",\x20" +
        v173 +
        "\x20" +
        v162 +
        ",\x20" +
        v161 +
        "\x20" +
        v162;
    (v165["setAttribute"]("d", v174),
      (_draftEdgeCache["lastStartX"] = v159),
      (_draftEdgeCache["lastStartY"] = v160),
      (_draftEdgeCache["lastEndX"] = v161),
      (_draftEdgeCache["lastEndY"] = v162),
      (_draftEdgeCache["lastSide"] = v163));
  }
  (v168 &&
    (v165["setAttribute"]("stroke-width", "" + 2 / v164["zoom"]),
    (v165["style"]["strokeDasharray"] =
      6 / v164["zoom"] + "\x20" + 4 / v164["zoom"]),
    (_draftEdgeCache["lastZoom"] = v164["zoom"])),
    (v165["style"]["display"] = "block"));
}
function _clearDraftEdgeDirectly() {
  const v175 = document["getElementById"]("v2-draft-edge");
  if (v175) v175["style"]["display"] = "none";
}
export function createEdgeController() {
  function v176(v177, v178, v179, v180, v181) {
    if (!v178 || !v178["target"]) return false;
    const v182 = v178["target"]["closest"](".v2-handle");
    if (!v182) return false;
    return (
      v178["preventDefault"](),
      v178["stopPropagation"](),
      (v177["isConnecting"] = true),
      (v177["connectSourceId"] = v182["dataset"]["nodeId"]),
      (v177["connectStartX"] = v179),
      (v177["connectStartY"] = v180),
      (v177["connectSide"] = "left"),
      _renderDraftEdgeDirectly(v179, v180, v179, v180, "left", v181),
      true
    );
  }
  function v183(v184, v185, v186, v187, v188, v189, v190, v191) {
    _renderDraftEdgeDirectly(
      v184["connectStartX"] || v187,
      v184["connectStartY"] || v188,
      v187,
      v188,
      v184["connectSide"] || "left",
      v189,
    );
    const v192 = _getNodeSpatialIndex(
      v190,
      getStateRaw()["_persistRev"],
      _NODE_SPATIAL_INDEX_DEFAULT_KEY,
    );
    let v193 = hitTestNode(
      v185,
      v186,
      v190,
      v189,
      v184["connectSourceId"],
      false,
      { spatialIndex: v192 },
    );
    if (v193 && v191?.["invalidNodeIds"]?.["includes"](v193)) v193 = null;
    return (
      (v191?.["hoverId"] || null) !== v193 &&
        graphStore["setConnOverlay"]({
          hoverId: v193,
          side: v184["connectSide"],
        }),
      true
    );
  }
  function v194(v195, v196, v197) {
    const v198 = getStateRaw(),
      { viewport: v199, nodes: v200 } = v198,
      v201 = _getNodeSpatialIndex(
        v200,
        v198["_persistRev"],
        _NODE_SPATIAL_INDEX_DEFAULT_KEY,
      ),
      v202 = hitTestNode(
        v196,
        v197,
        v200,
        v199,
        v195["connectSourceId"],
        false,
        { spatialIndex: v201 },
      ),
      v203 = v202 ? v200[v202] : null;
    let v204 = false;
    return (
      v203 &&
        (v204 = addEdgeWithPolicies({
          sourceId: v195["connectSourceId"],
          targetId: v203["id"],
        })),
      _clearDraftEdgeDirectly(),
      graphStore["clearConnOverlay"](),
      v204
    );
  }
  return {
    tryStartHandleConnect: v176,
    updateHandleConnect: v183,
    finishHandleConnect: v194,
  };
}
export function initConnectionHandles(v205) {
  const v206 = document["createElement"]("div");
  ((v206["id"] = "v2-side-plus-holder"),
    Object["assign"](v206["style"], {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "95",
      overflow: "visible",
    }),
    document["body"]["appendChild"](v206));
  const v207 = new Map(),
    v208 = new Map();
  let v209 = {
    dragging: false,
    srcId: null,
    sourceNodeIds: [],
    plusKind: "node",
    side: "right",
    ax: 0,
    ay: 0,
    sx: 0,
    sy: 0,
    lastX: 0,
    lastY: 0,
    anchorWorldX: null,
    anchorWorldY: null,
    didAssistPan: false,
  };
  function v210(v211, v212 = null) {
    const v213 = [],
      v214 = new Set(),
      v215 = Array["isArray"](v211) ? v211 : [];
    for (const v216 of v215) {
      const v217 = String(v216 || "")["trim"]();
      if (!v217 || v214["has"](v217)) continue;
      (v214["add"](v217), v213["push"](v217));
    }
    const v218 = String(v212 || "")["trim"]();
    if (v213["length"] === 0 && v218) v213["push"](v218);
    return v213;
  }
  function v219({
    sourceNodeId: v220,
    targetNodeId: v221,
    side: v222,
    nodes: v223,
    edges: v224,
    outMap: v225,
  }) {
    if (!v220 || !v221 || v220 === v221) return false;
    const v226 = v223?.[v220],
      v227 = v223?.[v221];
    if (!v226 || !v227) return false;
    const v228 = v222 === "right" ? v226 : v227,
      v229 = v222 === "right" ? v227 : v226;
    if (!v228?.["id"] || !v229?.["id"]) return false;
    const v230 = !!v225["get"](v228["id"])?.["has"](v229["id"]);
    if (v230) return false;
    if (
      String(v228["type"] || "")["trim"]() === "group" &&
      String(v229["type"] || "")["trim"]() === "group" &&
      wouldCreateGroupOutputCycle({
        sourceId: v228["id"],
        targetId: v229["id"],
        nodes: v223,
        edges: v224,
      })
    )
      return false;
    return isValidConnection(v228, v229);
  }
  function v231(v232, v233, v234, v235, v236) {
    if (v236 !== "right") return;
    if (String(v234?.["type"] || "") !== "ai-video") return;
    if (String(v235?.["type"] || "") !== "ai-video") return;
    const v237 = getFixedInputSlotConfigFromManifest(v235);
    if (
      v237?.["slotKindById"]?.["sourceVideo"] === "video" &&
      v237?.["slotKindById"]?.["refImage"] === "image"
    )
      return;
    const v238 = Number(v235["width"] || 0),
      v239 = Number(v235["height"] || 0),
      v240 =
        (Array["isArray"](v235["videos"]) && v235["videos"]["length"] > 0) ||
        String(v235["videoUrl"] || "")["trim"]() ||
        String(v235["localPath"] || "")["trim"]() ||
        String(v235["thumbId"] || "")["trim"]();
    if (v238 !== 300 || v239 !== 300 || v240) return;
    const v241 = getStateRaw(),
      v242 = v241["nodes"]?.[v233];
    if (!v242) return;
    const v243 = Number(v242["x"] || 0) + Number(v242["width"] || 0) / 2,
      v244 = Number(v242["y"] || 0) + Number(v242["height"] || 0) / 2,
      v245 = Date["now"](),
      v246 = () => {
        const v247 = getDisplayedMediaSizeFromNode(v232, "video"),
          v248 = Number(v247?.["w"] || 0),
          v249 = Number(v247?.["h"] || 0);
        let v250 = v248,
          v251 = v249;
        if (!(v250 > 0 && v251 > 0)) {
          const v252 = getStateRaw(),
            v253 = v252["nodes"]?.[v232];
          if (v253) {
            const v254 = Number(v253["mainVideoIndex"]),
              v255 = Number["isFinite"](v254)
                ? Math["max"](0, Math["trunc"](v254))
                : 0,
              v256 = Array["isArray"](v253["videos"]) ? v253["videos"] : [],
              v257 = v256[v255],
              v258 = Number(v257?.["videoWidth"] || 0),
              v259 = Number(v257?.["videoHeight"] || 0),
              v260 = Number(v253["selectedVideoWidth"] || 0),
              v261 = Number(v253["selectedVideoHeight"] || 0),
              v262 = Number(v253["videoWidth"] || 0),
              v263 = Number(v253["videoHeight"] || 0);
            if (v258 > 0 && v259 > 0) ((v250 = v258), (v251 = v259));
            else {
              if (v260 > 0 && v261 > 0) ((v250 = v260), (v251 = v261));
              else v262 > 0 && v263 > 0 && ((v250 = v262), (v251 = v263));
            }
          }
        }
        if (v250 > 0 && v251 > 0) {
          const v264 = v250 / v251;
          if (Number["isFinite"](v264) && v264 > 0) {
            const v265 = getAIGenerationNodeSize(v250, v251),
              v266 = v265["width"],
              v267 = v265["height"];
            (graphStore["updateNodeData"](v233, {
              width: v266,
              height: v267,
              x: v243 - v266 / 2,
              y: v244 - v267 / 2,
            }),
              commit());
          }
          return;
        }
        if (Date["now"]() - v245 < 1200) requestAnimationFrame(v246);
      };
    requestAnimationFrame(v246);
  }
  function v268() {
    const { nodes: v269, edges: v270, _edgesRev: v271 } = getStateRaw(),
      v272 = _getOutEdgeMap(v270, v271),
      v273 = v210(v209["sourceNodeIds"], v209["srcId"]),
      v274 = new Set(v273),
      v275 = [];
    for (const [v276, v277] of Object["entries"](v269)) {
      if (v274["has"](v276)) {
        v275["push"](v276);
        continue;
      }
      let v278 = false;
      for (const v279 of v273) {
        if (
          !v219({
            sourceNodeId: v279,
            targetNodeId: v276,
            side: v209["side"],
            nodes: v269,
            edges: v270,
            outMap: v272,
          })
        )
          continue;
        v278 = true;
        break;
      }
      if (!v278) v275["push"](v276);
    }
    graphStore["setConnOverlay"]({
      srcId: v209["srcId"],
      invalidNodeIds: v275,
      side: v209["side"],
    });
  }
  function v280() {
    graphStore["clearConnOverlay"]();
  }
  function v281() {
    for (const v282 of v207["values"]()) v282["remove"]();
    (v207["clear"](),
      v208["clear"](),
      v206["classList"]["remove"]("is-selection-plus-visible"));
  }
  function v283(v284, v285, v286) {
    const v287 = v207["get"](v284);
    if (v287) return v287;
    const v288 = document["createElement"]("button");
    return (
      (v288["type"] = "button"),
      (v288["className"] = "side-plus-btn"),
      (v288["textContent"] = ""),
      (v288["dataset"]["plusKind"] = "node"),
      v288["setAttribute"]("aria-label", "添加连接"),
      v288["addEventListener"]("pointerdown", (v289) => {
        if (v289["button"] === 1 || window["_spaceHeld"]) return;
        if (v289["button"] !== 0) return;
        const v290 = v208["get"](v284);
        if (!v290) return;
        const v291 = v210(v290["sourceNodeIds"], v290["nodeId"]),
          v292 = getStateRaw(),
          v293 =
            v290["plusKind"] === "multi"
              ? screenToWorld(v290["ax"], v290["ay"], v292["viewport"])
              : null;
        (v289["stopPropagation"](),
          v289["preventDefault"](),
          (v209 = {
            dragging: true,
            srcId: v290["nodeId"],
            sourceNodeIds: v291,
            plusKind: v290["plusKind"] === "multi" ? "multi" : "node",
            side: v290["side"],
            ax: v290["ax"],
            ay: v290["ay"],
            sx: v289["clientX"],
            sy: v289["clientY"],
            lastX: v289["clientX"],
            lastY: v289["clientY"],
            anchorWorldX: v293?.["x"] ?? null,
            anchorWorldY: v293?.["y"] ?? null,
            didAssistPan: false,
          }),
          v268(),
          v281());
      }),
      v206["appendChild"](v288),
      v207["set"](v284, v288),
      v208["set"](v284, {
        nodeId: v285,
        side: v286,
        sourceNodeIds: v285 ? [v285] : [],
        plusKind: "node",
        ax: 0,
        ay: 0,
      }),
      v288
    );
  }
  function v294(
    v295,
    v296,
    v297,
    v298,
    v299,
    v300,
    v301,
    v302,
    v303,
    v304 = {},
  ) {
    const v305 = Number(v304?.["sizeMultiplier"]),
      v306 = Number["isFinite"](v305) && v305 > 0 ? v305 : 1,
      v307 = 20 * v300 * v306,
      v308 = v307 / 2,
      v309 = String(v304?.["key"] || v296 + ":" + v297),
      v310 = v304?.["plusKind"] === "multi" ? "multi" : "node",
      v311 = v210(v304?.["sourceNodeIds"], v296),
      v312 = v283(v309, v296, v297);
    ((v312["dataset"]["plusKind"] = v310),
      v312["classList"]["toggle"]("side-plus-btn--multi", v310 === "multi"),
      (v312["style"]["width"] = v307 + "px"),
      (v312["style"]["height"] = v307 + "px"),
      (v312["style"]["fontSize"] = v307 + "px"),
      (v312["style"]["display"] = "flex"),
      (v312["style"]["alignItems"] = "center"),
      (v312["style"]["justifyContent"] = "center"));
    let v313 = v298,
      v314 = v299,
      v315 = false;
    if (v301 !== undefined && v302 !== undefined) {
      const v316 = v301 - v298,
        v317 = v302 - v299,
        v318 = Math["hypot"](v316, v317),
        v319 = 100 * v300;
      if (v318 < v319 && !v303) {
        const v320 = Math["min"](v318, 45 * v300),
          v321 = Math["atan2"](v317, v316);
        ((v313 += Math["cos"](v321) * v320),
          (v314 += Math["sin"](v321) * v320),
          (v312["style"]["background"] = "var(--white-10)"),
          (v315 = true));
      }
    }
    if (!v315) v312["style"]["background"] = "";
    ((v312["style"]["left"] = v313 - v308 + "px"),
      (v312["style"]["top"] = v314 - v308 + "px"));
    const v322 = v208["get"](v309);
    (v322 &&
      ((v322["nodeId"] = v296),
      (v322["side"] = v297),
      (v322["sourceNodeIds"] = v311),
      (v322["plusKind"] = v310),
      (v322["ax"] = v313),
      (v322["ay"] = v314)),
      v295["add"](v309));
  }
  function v323(v324, v325, v326 = {}) {
    const v327 = _getDragContext(),
      v328 = v326 && typeof v326 === "object" ? v326 : {},
      v329 = ["settingsModal", "aboutModal", "historyModal"];
    if (
      v329["some"]((v330) => {
        const v331 = document["getElementById"](v330);
        return v331 && v331["style"]["display"] === "flex";
      })
    ) {
      v281();
      return;
    }
    if (!v209["dragging"] && _isSidePlusPointerBlockedAt(v324, v325)) {
      v281();
      return;
    }
    const v332 = getStateRaw(),
      {
        nodes: v333,
        viewport: v334,
        selectedNodeIds: v335,
        _persistRev: v336,
      } = v332;
    if (!Object["keys"](v333)["length"]) {
      v281();
      return;
    }
    let v337 = v333;
    const v338 =
      v328["nodeSizeOverrides"] && typeof v328["nodeSizeOverrides"] === "object"
        ? v328["nodeSizeOverrides"]
        : null;
    if (v338)
      for (const [v339, v340] of Object["entries"](v338)) {
        const v341 = v333[v339];
        if (!v341) continue;
        const v342 = Number(v340?.["width"]),
          v343 = Number(v340?.["height"]);
        if (!(Number["isFinite"](v342) && Number["isFinite"](v343))) continue;
        if (v337 === v333) v337 = { ...v333 };
        v337[v339] = { ...v341, width: v342, height: v343 };
      }
    const v344 = v337 !== v333,
      v345 = Array["isArray"](v335) ? v335 : [],
      v346 = new Set(v345),
      v347 = typeof document !== "undefined" ? document["body"] : null,
      v348 = resolveSidePlusRenderState({
        isDraggingPlus: v209["dragging"],
        isNodeDragging: !!v327["isDragging"],
        isBoxSelecting: !!v327["isBoxSelecting"],
        isConnecting: !!v327["isConnecting"],
        isPanning: !!v327["isPanning"],
        isZooming: !!v347?.["classList"]?.["contains"]("is-zooming"),
        isViewportAnimating: !!v347?.["classList"]?.["contains"](
          "is-viewport-animating",
        ),
        isSpaceHeld: !!window["_spaceHeld"],
        selectedCount: v346["size"],
        requestedSelectionOnly: v328["selectionOnly"] === true,
      });
    v206["classList"]["toggle"](
      "is-selection-plus-visible",
      v348["selectionOnly"] && v346["size"] > 0,
    );
    if (v348["shouldClear"]) {
      v281();
      return;
    }
    const v349 = v348["selectionOnly"];
    let v350 = null,
      v351 = false;
    if (v349) ((v350 = null), (v351 = false));
    else {
      if (v327["isDragging"] && v327["targetNodeId"])
        ((v350 = v327["targetNodeId"]), (v351 = true));
      else {
        const v352 = v344
            ? null
            : _getNodeSpatialIndex(v333, v336, _NODE_SPATIAL_INDEX_DEFAULT_KEY),
          v353 = findClosestNode(v324, v325, v337, v334, true, {
            spatialIndex: v352,
          });
        v353 && ((v350 = v353["nodeId"]), (v351 = v353["isInside"]));
      }
    }
    const v354 = v334["zoom"] || 1,
      v355 = 36,
      v356 = 70 * v354;
    let v357 = Number["isFinite"](v324) ? v324 : undefined,
      v358 = Number["isFinite"](v325) ? v325 : undefined;
    v349 && ((v357 = undefined), (v358 = undefined));
    const v359 = v346["size"] >= 2,
      v360 =
        !v359 && !v349
          ? getGroupSidePlusAnchorCandidateIds({
              nodes: v337,
              viewport: v334,
              mx: v324,
              my: v325,
              threshold: v356,
              gap: v355,
            })
          : [],
      { candidateIds: v361, sideAnchorHoverIds: v362 } =
        resolveSidePlusCandidateIds({
          selectedIds: v345,
          isMultiSelection: v359,
          selectionOnly: v349,
          hoverNodeId: v350,
          groupAnchorIds: v360,
        }),
      v363 = new Set(),
      v364 = shouldShowRightSidePlusForNodeType;
    for (const v365 of v361) {
      const v366 = v337[v365];
      if (!v366) continue;
      if (shouldUseInlineMediaClipAddSlot(v366["type"])) continue;
      const v367 =
          v327["isDragging"] &&
          (v346["has"](v365) || v327["targetNodeId"] === v365),
        v368 =
          v367 && Number["isFinite"](v327["pendingDx"]) ? v327["pendingDx"] : 0,
        v369 =
          v367 && Number["isFinite"](v327["pendingDy"]) ? v327["pendingDy"] : 0,
        v370 = v366["width"] || (isNodeType(v366, "group") ? 400 : 260),
        v371 = v366["height"] || (isNodeType(v366, "group") ? 300 : 80),
        v372 = getNodeScreenRect(
          {
            x: v366["x"] + v368,
            y: v366["y"] + v369,
            width: v370,
            height: v371,
          },
          v334,
        ),
        v373 = v372["top"] + v372["height"] / 2,
        v374 = v372["left"] - v355 * v354,
        v375 = v372["right"] + v355 * v354,
        v376 = Math["hypot"](v324 - v374, v325 - v373),
        v377 = Math["hypot"](v324 - v375, v325 - v373),
        v378 = v365 === v350 || v362["has"](v365),
        v379 = v346["has"](v365),
        v380 = v365 === v350 ? v351 : false,
        v381 = v380 || (v327["isDragging"] && v365 === v327["targetNodeId"]),
        v382 = shouldShowSidePlusForNode({
          sideDistance: v376,
          threshold: v356,
          isSelected: v379,
          isHovered: v378,
          isInside: v380,
          nodeType: v366["type"],
        }),
        v383 = shouldShowSidePlusForNode({
          sideDistance: v377,
          threshold: v356,
          isSelected: v379,
          isHovered: v378,
          isInside: v380,
          nodeType: v366["type"],
        }),
        v384 = (v385) =>
          v385 === "ai-image" ||
          v385 === "ai-text" ||
          v385 === "ai-video" ||
          v385 === "ai-audio" ||
          _isPanorama360TargetType(v385);
      (v384(v366["type"]) &&
        v382 &&
        v294(v363, v365, "left", v374, v373, v354, v357, v358, v381),
        v364(v366["type"]) &&
          v383 &&
          v294(v363, v365, "right", v375, v373, v354, v357, v358, v381));
    }
    const v386 = v345["filter"]((v387) => {
      const v388 = v337[v387];
      return !!v388 && v364(v388["type"]);
    });
    if (v345["length"] >= 2 && v386["length"] > 0) {
      const v389 = v327["isDragging"] && v346["has"](v327["targetNodeId"]),
        v390 = computeMultiSelectionBoundsForSidePlus(
          v345,
          v337,
          v389
            ? {
                movedNodeIds: v345,
                offsetX: Number["isFinite"](v327["pendingDx"])
                  ? v327["pendingDx"]
                  : 0,
                offsetY: Number["isFinite"](v327["pendingDy"])
                  ? v327["pendingDy"]
                  : 0,
              }
            : undefined,
        );
      if (v390) {
        const v391 = 18,
          v392 = getNodeScreenRect(
            {
              x: v390["minX"] - v391,
              y: v390["minY"] - v391,
              width: v390["maxX"] - v390["minX"] + v391 * 2,
              height: v390["maxY"] - v390["minY"] + v391 * 2,
            },
            v334,
          ),
          v393 = v392["right"] + v355 * v354,
          v394 = v392["top"] + v392["height"] / 2,
          v395 =
            Number["isFinite"](v324) &&
            Number["isFinite"](v325) &&
            v324 >= v392["left"] &&
            v324 <= v392["right"] &&
            v325 >= v392["top"] &&
            v325 <= v392["bottom"];
        v294(v363, v386[0], "right", v393, v394, v354, v357, v358, v395, {
          key: "multi:right",
          plusKind: "multi",
          sourceNodeIds: v386,
          sizeMultiplier: 1.5,
        });
      }
    }
    for (const [v396, v397] of v207["entries"]()) {
      if (v363["has"](v396)) continue;
      (v397["remove"](), v207["delete"](v396), v208["delete"](v396));
    }
  }
  const v398 = rafSampleLatest(v323);
  ((window["_v2UpdateSidePlus"] = v398),
    (window["_v2UpdateSidePlusNow"] = v323),
    window["addEventListener"]("pointermove", (v399) => {
      if (v209["dragging"]) {
        let {
          viewport: v400,
          nodes: v401,
          connOverlay: v402,
          _persistRev: v403,
        } = getStateRaw();
        if (window["_spaceHeld"] === true) {
          const v404 = v399["clientX"] - v209["lastX"],
            v405 = v399["clientY"] - v209["lastY"];
          if (v404 || v405) {
            ((v400 = {
              x: (Number(v400?.["x"]) || 0) + v404,
              y: (Number(v400?.["y"]) || 0) + v405,
              zoom: Number(v400?.["zoom"]) || 1,
            }),
              graphStore["updateViewport"](v400["x"], v400["y"], v400["zoom"]),
              (v209["didAssistPan"] = true));
            const v406 = getStateRaw();
            ((v400 = v406["viewport"]),
              (v401 = v406["nodes"]),
              (v402 = v406["connOverlay"]),
              (v403 = v406["_persistRev"]));
          }
        }
        ((v209["lastX"] = v399["clientX"]), (v209["lastY"] = v399["clientY"]));
        const v407 = new Set(v402?.["invalidNodeIds"] || []),
          v408 = v210(v209["sourceNodeIds"], v209["srcId"]),
          v409 = new Set(v408),
          v410 = v401[v209["srcId"]];
        let v411 = 0,
          v412 = 0;
        if (v209["plusKind"] === "multi") {
          if (
            Number["isFinite"](v209["anchorWorldX"]) &&
            Number["isFinite"](v209["anchorWorldY"])
          )
            ((v411 = v209["anchorWorldX"]), (v412 = v209["anchorWorldY"]));
          else {
            const v413 = screenToWorld(v209["ax"], v209["ay"], v400);
            ((v411 = v413["x"]), (v412 = v413["y"]));
          }
        } else
          v410 &&
            ((v411 =
              v209["side"] === "right"
                ? v410["x"] + (v410["width"] || 0)
                : v410["x"]),
            (v412 = v410["y"] + (v410["height"] || 0) / 2));
        const { x: v414, y: v415 } = screenToWorld(
          v399["clientX"],
          v399["clientY"],
          v400,
        );
        _renderDraftEdgeDirectly(v411, v412, v414, v415, v209["side"], v400);
        const v416 = _getNodeSpatialIndex(
            v401,
            v403,
            _NODE_SPATIAL_INDEX_EDGE_HOVER_KEY,
          ),
          v417 = queryNodeSpatialIndexAtWorldPoint(v416, v414, v415);
        let v418 = null;
        for (const v419 of v417) {
          const v420 = v401[v419];
          if (!v420) continue;
          if (v409["has"](v419)) continue;
          if (v407["has"](v419)) continue;
          const v421 = _resolveEdgeHoverNodeRect(v420);
          if (!v421) continue;
          if (
            isPointInRect(
              v414,
              v415,
              v421["x"],
              v421["y"],
              v421["width"],
              v421["height"],
            )
          ) {
            v418 = v419;
            break;
          }
        }
        (v402?.["hoverId"] || null) !== v418 &&
          graphStore["setConnOverlay"]({ hoverId: v418, side: v209["side"] });
      } else v398(v399["clientX"], v399["clientY"]);
    }),
    window["addEventListener"](
      "pointerup",
      (v422) => {
        if (!v209["dragging"]) return;
        v209["dragging"] = false;
        const {
            srcId: v423,
            sourceNodeIds: v424,
            plusKind: v425,
            side: v426,
            sx: v427,
            sy: v428,
            didAssistPan: v429,
          } = v209,
          v430 = v210(v424, v423),
          v431 = new Set(v430);
        ((v209["srcId"] = null),
          (v209["sourceNodeIds"] = []),
          (v209["plusKind"] = "node"),
          (v209["anchorWorldX"] = null),
          (v209["anchorWorldY"] = null),
          (v209["didAssistPan"] = false),
          v280());
        const v432 = () => {
          (_clearDraftEdgeDirectly(), graphStore["clearConnOverlay"]());
        };
        if (
          !v429 &&
          Math["abs"](v422["clientX"] - v427) < 5 &&
          Math["abs"](v422["clientY"] - v428) < 5
        )
          return v432();
        const {
            viewport: v433,
            nodes: v434,
            edges: v435,
            _persistRev: v436,
            _edgesRev: v437,
          } = getStateRaw(),
          v438 = _getNodeSpatialIndex(
            v434,
            v436,
            _NODE_SPATIAL_INDEX_DEFAULT_KEY,
          );
        let v439 = hitTestNode(
          v422["clientX"],
          v422["clientY"],
          v434,
          v433,
          v423,
          false,
          { spatialIndex: v438 },
        );
        if (v439 && v431["has"](v439)) v439 = null;
        if (v439) {
          v432();
          if (v425 === "multi") {
            if (v426 !== "right") return;
            let v440 = false;
            for (const v441 of v430) {
              if (!v441 || v441 === v439) continue;
              const v442 = getStateRaw(),
                v443 = v442["nodes"]?.[v441],
                v444 = v442["nodes"]?.[v439];
              if (!v443 || !v444) continue;
              if (!isValidConnection(v443, v444)) continue;
              const v445 = addEdgeWithPolicies({
                sourceId: v441,
                targetId: v439,
              });
              if (!v445) continue;
              ((v440 = true), v231(v441, v439, v443, v444, v426));
            }
            if (!v440) return;
            return;
          }
          const v446 = v426 === "right" ? v423 : v439,
            v447 = v426 === "right" ? v439 : v423,
            v448 = v434[v446],
            v449 = v434[v447],
            v450 = _getOutEdgeMap(v435, v437),
            v451 = _getIncomingEdgesByTarget(v435, v437, v447),
            v452 = !!v450["get"](v446)?.["has"](v447);
          if (!isValidConnection(v448, v449) || v452) return;
          const v453 = String(v448?.["type"] || "")["trim"]() === "group";
          if (v453) {
            const v454 = addEdgeWithPolicies({
              sourceId: v446,
              targetId: v447,
            });
            if (!v454) return;
            v231(v446, v447, v448, v449, v426);
            return;
          }
          if (_isAnimeRealTarget(v449)) {
            if (!_isAnimeRealImageSrc(v448)) return;
            for (const v455 of v451) graphStore["removeEdge"](v455["id"]);
            v449["rhAnimeRealRefUrl"] &&
              graphStore["updateNodeData"](v447, {
                rhAnimeRealRefUrl: "",
                rhAnimeRealRefLocalPath: "",
                rhAnimeRealRefFileName: "",
              });
          }
          const v456 = _applyRhPersonReplaceV3FixedInputs({
            srcData: v448,
            tgtData: v449,
            incomingEdges: v451,
            nodes: v434,
            targetId: v447,
          });
          if (!v456["ok"]) return;
          const v457 = addEdgeWithPolicies({ sourceId: v446, targetId: v447 });
          if (!v457) return;
          v231(v446, v447, v448, v449, v426);
          return;
        }
        if (v426 === "left") {
          _showLeftQuoteMenu(
            v422["clientX"],
            v422["clientY"],
            v423,
            v433,
            v432,
          );
          return;
        }
        if (v426 !== "right") {
          v432();
          return;
        }
        if (v425 === "multi") {
          const v458 = v430["filter"]((v459) => !!v434[v459]);
          if (v458["length"] === 0) {
            v432();
            return;
          }
          _showQuoteMenu(
            v422["clientX"],
            v422["clientY"],
            v458[0],
            v433,
            v432,
            { sourceIds: v458 },
          );
          return;
        }
        const v460 = v434[v423];
        if (!v460) {
          v432();
          return;
        }
        _showQuoteMenu(v422["clientX"], v422["clientY"], v423, v433, v432);
      },
      { capture: true },
    ));
}
const _RH_ANIME_REAL_MODEL = ANIME_REAL_MODEL_ID,
  _isAnimeRealTarget = (v461) =>
    !!v461 &&
    v461["type"] === "ai-image" &&
    String(v461["model"] || "") === _RH_ANIME_REAL_MODEL,
  _isAnimeRealImageSrc = (v462) => {
    const v463 = String(v462?.["type"] || "");
    return v463 === "source-image" || v463 === "image" || v463 === "ai-image";
  },
  _isRhPersonReplaceV3Target = (v464) =>
    !!v464 &&
    v464["type"] === "ai-image" &&
    isRhPersonReplaceWorkflowModel(v464["model"]),
  _getRhV54RefKind = (v465) => {
    return resolveEffectiveInputKind(v465) || "image";
  },
  _getAiAudioWorkflowKey = (v466) => {
    if (!v466 || String(v466["type"] || "") !== "ai-audio") return "";
    const v467 = String(v466["audioWorkflowKey"] || "")["trim"]();
    if (v467) return v467;
    const v468 = String(v466["model"] || "")["trim"]();
    return v468;
  },
  _getManifestFixedInputConfig = (v469) => {
    const v470 = String(v469?.["type"] || "")["trim"]();
    if (v470 === "ai-audio") {
      const v471 = _getAiAudioWorkflowKey(v469);
      return getFixedInputSlotConfigFromManifest({
        ...v469,
        audioWorkflowKey: v471,
        model: v471,
      });
    }
    return getFixedInputSlotConfigFromManifest(v469);
  },
  _edgeTimeKey = (v472) => {
    const v473 = Number(v472?.["createdAt"]);
    if (Number["isFinite"](v473)) return v473;
    const v474 = String(v472?.["id"] || ""),
      v475 = v474["match"](/(\d{10,})/g);
    if (v475 && v475["length"]) return Number(v475[v475["length"] - 1]) || 0;
    return 0;
  };
function _finishManifestFixedInputResult(v476, v477, v478) {
  const v479 = String(v478 || "")["trim"]();
  if (!v479) return { ok: true, refSlot: "" };
  const v480 = getExclusiveSlotsForFixedSlot(v476?.["exclusiveGroups"], v479);
  if (v480["length"] > 1) {
    const v481 = new Set(v480);
    for (const v482 of Array["isArray"](v477) ? v477 : []) {
      const v483 = String(v482?.["refSlot"] || "")["trim"]();
      v482?.["id"] &&
        v483 !== v479 &&
        v481["has"](v483) &&
        graphStore["removeEdge"](v482["id"]);
    }
  }
  return { ok: true, refSlot: v479 };
}
function _canUseManifestFixedInputOverflow({
  config: v484,
  srcKind: v485,
  tgtData: v486,
  incomingEdges: v487,
  nodes: v488,
}) {
  const v489 = String(v485 || "")["trim"]();
  if (!v489 || v489 === "text") return false;
  const v490 = new Set(v484?.["visibleSlots"] || []),
    v491 = (v484?.["slotOrderByType"]?.[v489] || [])["filter"]((v492) =>
      v490["has"](v492),
    )["length"],
    v493 = getTargetInputPolicy(v486),
    v494 = Number(v493?.["maxByKind"]?.[v489]);
  if (!Number["isFinite"](v494) || v494 <= v491) return false;
  const v495 = (Array["isArray"](v487) ? v487 : [])["filter"](
    (v496) => _getRhV54RefKind(v488?.[v496?.["sourceId"]]) === v489,
  )["length"];
  return v495 < v494;
}
function _allowsManifestFixedInputOverflow({
  config: v497,
  srcKind: v498,
  tgtData: v499,
}) {
  const v500 = String(v498 || "")["trim"]();
  if (!v500 || v500 === "text") return false;
  const v501 = new Set(v497?.["visibleSlots"] || []),
    v502 = (v497?.["slotOrderByType"]?.[v500] || [])["filter"]((v503) =>
      v501["has"](v503),
    )["length"],
    v504 = getTargetInputPolicy(v499),
    v505 = Number(v504?.["maxByKind"]?.[v500]);
  return Number["isFinite"](v505) && v505 > v502;
}
function _cycleManifestFixedInputWhenFull({
  config: v506,
  srcKind: v507,
  tgtData: v508,
  incomingEdges: v509,
  nodes: v510,
  slotOrder: v511,
}) {
  const v512 = String(v507 || "")["trim"]();
  if (!v512 || v512 === "text") return null;
  if (v506?.["manifest"]?.["inputSlots"]?.["cycleFixedInputWhenFull"] !== true)
    return null;
  const v513 = getTargetInputPolicy(v508),
    v514 = Number(v513?.["maxByKind"]?.[v512]);
  if (!Number["isFinite"](v514) || v514 <= 0) return null;
  const v515 = new Set(v506?.["visibleSlots"] || []),
    v516 = (v506?.["slotOrderByType"]?.[v512] || [])["filter"]((v517) =>
      v515["has"](v517),
    )["length"],
    v518 = (Array["isArray"](v509) ? v509 : [])
      [
        "filter"
      ]((v519) => _getRhV54RefKind(v510?.[v519?.["sourceId"]]) === v512)
      ["sort"]((v520, v521) => _edgeTimeKey(v520) - _edgeTimeKey(v521));
  if (v518["length"] < v514) return null;
  const v522 = v518[0];
  if (!v522?.["id"]) return null;
  const v523 = String(v522["refSlot"] || "");
  graphStore["removeEdge"](v522["id"]);
  const v524 =
    v514 <= v516 && Array["isArray"](v511) && v511["includes"](v523)
      ? v523
      : "";
  return { ok: true, refSlot: v524 };
}
function _applyRhPersonReplaceV3FixedInputs({
  srcData: v525,
  tgtData: v526,
  incomingEdges: v527,
  nodes: v528,
  targetId: v529,
}) {
  if (!_isRhPersonReplaceV3Target(v526)) return { ok: true, refSlot: "" };
  if (!_isAnimeRealImageSrc(v525)) return { ok: false, refSlot: "" };
  const v530 = ["replaceTarget", "replacedImage"],
    v531 = Array["isArray"](v527) ? v527 : [],
    v532 = v531["filter"]((v533) => {
      const v534 = v528?.[v533["sourceId"]];
      return _isAnimeRealImageSrc(v534);
    }),
    v535 = new Set(
      v532["map"]((v536) => String(v536["refSlot"] || ""))["filter"]((v537) =>
        v530["includes"](v537),
      ),
    ),
    v538 = v530["find"]((v539) => !v535["has"](v539)) || "";
  if (v538) return { ok: true, refSlot: v538 };
  let v540 = null;
  for (const v541 of v532) {
    if (v530["includes"](String(v541["refSlot"] || ""))) {
      if (!v540 || _edgeTimeKey(v541) < _edgeTimeKey(v540)) v540 = v541;
    }
  }
  if (!v540)
    for (const v542 of v532) {
      if (!v540 || _edgeTimeKey(v542) < _edgeTimeKey(v540)) v540 = v542;
    }
  if (v540) graphStore["removeEdge"](v540["id"]);
  const v543 =
    v540 && v530["includes"](String(v540["refSlot"] || ""))
      ? String(v540["refSlot"])
      : v530[0];
  return { ok: true, refSlot: v543 };
}
function _applyManifestFixedInputs({
  srcData: v544,
  tgtData: v545,
  incomingEdges: v546,
  nodes: v547,
  targetId: v548,
  preferredRefSlot: v549,
}) {
  const v550 = String(v545?.["type"] || "")["trim"]();
  if (v550 !== "ai-video" && v550 !== "ai-audio" && v550 !== "ai-image")
    return { ok: true, refSlot: "" };
  if (v550 === "ai-image" && _isRhPersonReplaceV3Target(v545))
    return { ok: true, refSlot: "" };
  const v551 = _getManifestFixedInputConfig(v545);
  if (!v551) return { ok: true, refSlot: "" };
  const v552 = _getRhV54RefKind(v544);
  if (v552 === "text") return { ok: true, refSlot: "" };
  const v553 = new Set(v551["visibleSlots"] || []),
    v554 = (v551["slotOrderByType"]?.[v552] || [])["filter"]((v555) =>
      v553["has"](v555),
    );
  if (v554["length"] === 0) {
    if (
      _canUseManifestFixedInputOverflow({
        config: v551,
        srcKind: v552,
        tgtData: v545,
        incomingEdges: v546,
        nodes: v547,
      })
    )
      return { ok: true, refSlot: "" };
    return { ok: false, refSlot: "" };
  }
  const v556 = v554["includes"](String(v549 || "")) ? String(v549 || "") : "",
    v557 = Array["isArray"](v546) ? v546 : [],
    v558 = v557["filter"]((v559) => {
      const v560 = v547?.[v559["sourceId"]];
      return _getRhV54RefKind(v560) === v552;
    }),
    v561 = _allowsManifestFixedInputOverflow({
      config: v551,
      srcKind: v552,
      tgtData: v545,
    });
  for (const v562 of v558) {
    const v563 = String(v562?.["refSlot"] || "");
    if (v561 && !v563) continue;
    if (!v554["includes"](v563)) graphStore["removeEdge"](v562["id"]);
  }
  const v564 = v558["filter"]((v565) =>
      v554["includes"](String(v565?.["refSlot"] || "")),
    ),
    v566 = new Set(
      v564["map"]((v567) => String(v567["refSlot"] || ""))["filter"]((v568) =>
        v554["includes"](v568),
      ),
    ),
    v569 = v554["find"]((v570) => !v566["has"](v570)) || "";
  if (v556 && !v566["has"](v556))
    return _finishManifestFixedInputResult(v551, v557, v556);
  if (v569) return _finishManifestFixedInputResult(v551, v557, v569);
  if (
    _canUseManifestFixedInputOverflow({
      config: v551,
      srcKind: v552,
      tgtData: v545,
      incomingEdges: v557,
      nodes: v547,
    })
  )
    return { ok: true, refSlot: "" };
  const v571 = _cycleManifestFixedInputWhenFull({
    config: v551,
    srcKind: v552,
    tgtData: v545,
    incomingEdges: v557,
    nodes: v547,
    slotOrder: v554,
  });
  if (v571) return _finishManifestFixedInputResult(v551, v557, v571["refSlot"]);
  if (v554["length"] === 1)
    return (
      v564["forEach"]((v572) => graphStore["removeEdge"](v572["id"])),
      _finishManifestFixedInputResult(v551, v557, v554[0])
    );
  if (v556) {
    const v573 = v564["find"]((v574) => String(v574["refSlot"] || "") === v556);
    if (v573) graphStore["removeEdge"](v573["id"]);
    return _finishManifestFixedInputResult(v551, v557, v556);
  }
  const v575 = v564["reduce"](
      (v576, v577) =>
        !_edgeTimeKey(v576) || _edgeTimeKey(v577) > _edgeTimeKey(v576)
          ? v577
          : v576,
      null,
    ),
    v578 = String(v575?.["refSlot"] || ""),
    v579 = v554["indexOf"](v578),
    v580 = v579 >= 0 ? v554[(v579 + 1) % v554["length"]] : v554[0];
  let v581 = null;
  for (const v582 of v564) {
    if (String(v582["refSlot"] || "") !== v580) continue;
    if (!v581 || _edgeTimeKey(v582) < _edgeTimeKey(v581)) v581 = v582;
  }
  if (!v581)
    for (const v583 of v564) {
      if (!v581 || _edgeTimeKey(v583) < _edgeTimeKey(v581)) v581 = v583;
    }
  if (v581) graphStore["removeEdge"](v581["id"]);
  const v584 =
    v581 && v554["includes"](String(v581["refSlot"] || ""))
      ? String(v581["refSlot"])
      : v580;
  return _finishManifestFixedInputResult(v551, v557, v584);
}
function _isDreaminaVideoTarget(v585) {
  return (
    !!v585 &&
    String(v585["type"] || "") === "ai-video" &&
    isDreaminaStyleVideoModel(v585["model"], v585["provider"])
  );
}
function _applyDreaminaVideoFixedInputs({
  srcData: v586,
  tgtData: v587,
  incomingEdges: v588,
  nodes: v589,
  targetId: v590,
}) {
  if (!_isDreaminaVideoTarget(v587)) return { ok: true, refSlot: "" };
  const v591 = normalizeDreaminaVideoRouteMode(
      v587?.["dreaminaRouteMode"],
      v587?.["mode"],
    ),
    v592 = _getRhV54RefKind(v586),
    v593 = Array["isArray"](v588) ? v588 : [];
  if (v591 === "frames2video") {
    if (v592 !== "image") return { ok: false, refSlot: "" };
    for (const v594 of v593) {
      const v595 = v589?.[v594["sourceId"]];
      _getRhV54RefKind(v595) !== "image" &&
        graphStore["removeEdge"](v594["id"]);
    }
    const v596 = v593["filter"](
      (v597) => _getRhV54RefKind(v589?.[v597["sourceId"]]) === "image",
    )["sort"]((v598, v599) => _edgeTimeKey(v598) - _edgeTimeKey(v599));
    while (v596["length"] >= 2) {
      const v600 = v596["shift"]();
      if (v600?.["id"]) graphStore["removeEdge"](v600["id"]);
    }
    return { ok: true, refSlot: "" };
  }
  if (v591 === "multiframe2video") {
    if (v592 !== "image") return { ok: false, refSlot: "" };
    const v601 = v593["filter"](
      (v602) => _getRhV54RefKind(v589?.[v602["sourceId"]]) === "image",
    )["sort"]((v603, v604) => _edgeTimeKey(v603) - _edgeTimeKey(v604));
    while (v601["length"] >= 20) {
      const v605 = v601["shift"]();
      if (v605?.["id"]) graphStore["removeEdge"](v605["id"]);
    }
    return { ok: true, refSlot: "" };
  }
  if (!["image", "video", "audio", "text"]["includes"](v592))
    return { ok: false, refSlot: "" };
  if (v592 === "text") return { ok: true, refSlot: "" };
  const v606 = v592 === "image" ? 9 : 3,
    v607 = v593["filter"](
      (v608) => _getRhV54RefKind(v589?.[v608["sourceId"]]) === v592,
    )["sort"]((v609, v610) => _edgeTimeKey(v609) - _edgeTimeKey(v610));
  while (v607["length"] >= v606) {
    const v611 = v607["shift"]();
    if (v611?.["id"]) graphStore["removeEdge"](v611["id"]);
  }
  return { ok: true, refSlot: "" };
}
function _applyGenericInputKindLimit({
  srcData: v612,
  tgtData: v613,
  incomingEdges: v614,
  nodes: v615,
  sourceId: v616,
}) {
  if (!_isModelPolicyTargetType(v613?.["type"])) return { ok: true };
  if (_getManifestFixedInputConfig(v613)) return { ok: true };
  if (_isDreaminaVideoTarget(v613)) return { ok: true };
  const v617 = resolveEffectiveInputKind(v612);
  if (!v617 || v617 === "text") return { ok: true };
  const v618 = getTargetInputPolicy(v613);
  if (!isInputKindAllowed(v618, v617)) return { ok: false };
  const v619 = Number(v618?.["maxByKind"]?.[v617]);
  if (!Number["isFinite"](v619)) return { ok: true };
  if (v619 <= 0) return { ok: false };
  const v620 = (Array["isArray"](v614) ? v614 : [])["some"](
    (v621) => v621?.["sourceId"] === v616,
  );
  if (v620) return { ok: true };
  const v622 = (Array["isArray"](v614) ? v614 : [])
    ["filter"]((v623) => _getRhV54RefKind(v615?.[v623?.["sourceId"]]) === v617)
    ["sort"]((v624, v625) => _edgeTimeKey(v624) - _edgeTimeKey(v625));
  while (v622["length"] >= v619) {
    const v626 = v622["shift"]();
    if (v626?.["id"]) graphStore["removeEdge"](v626["id"]);
  }
  return { ok: true };
}
function _applyMediaClipInputLimit({ srcData: v627, tgtData: v628 }) {
  if (!isMediaClipNodeType(v628?.["type"])) return { ok: true };
  const v629 = getMediaClipInputKind(v627);
  if (v629 !== "video" && v629 !== "image" && v629 !== "audio")
    return { ok: false };
  if (!isSupportedMediaClipInput(v627)) return { ok: false };
  return { ok: true };
}
function _replacePanorama360IncomingEdges({
  tgtData: v630,
  incomingEdges: v631,
}) {
  if (!_isPanorama360TargetType(v630?.["type"])) return;
  const v632 = Array["isArray"](v631) ? v631 : [];
  for (const v633 of v632) {
    if (v633?.["id"]) graphStore["removeEdge"](v633["id"]);
  }
}
export function addEdgeWithPolicies({
  sourceId: v634,
  targetId: v635,
  preferredRefSlot: v636,
}) {
  const v637 = getStateRaw(),
    v638 = v637["nodes"] || {},
    v639 = v638[v634],
    v640 = v638[v635];
  if (!v639 || !v640) return false;
  if (!isValidConnection(v639, v640)) return false;
  const v641 = String(v639["type"] || "")["trim"]() === "group";
  if (v641) {
    if (
      String(v640["type"] || "")["trim"]() === "group" &&
      wouldCreateGroupOutputCycle({
        sourceId: v634,
        targetId: v635,
        nodes: v638,
        edges: v637["edges"] || {},
      })
    )
      return false;
    const v642 = getStateRaw(),
      v643 = !!_getOutEdgeMap(v642["edges"], v642["_edgesRev"])
        ["get"](v634)
        ?.["has"](v635);
    if (v643) return false;
    return (
      graphStore["addEdge"]({
        id:
          "edge-" +
          Date["now"]() +
          "-" +
          Math["random"]()["toString"](36)["slice"](2, 6),
        sourceId: v634,
        targetId: v635,
        isGroupOutputLink: true,
        createdAt: Date["now"](),
      }),
      true
    );
  }
  const v644 = _getIncomingEdgesByTarget(
    v637["edges"],
    v637["_edgesRev"],
    v635,
  );
  _replacePanorama360IncomingEdges({ tgtData: v640, incomingEdges: v644 });
  if (_isAnimeRealTarget(v640)) {
    if (!_isAnimeRealImageSrc(v639)) return false;
    for (const v645 of v644) graphStore["removeEdge"](v645["id"]);
    v640["rhAnimeRealRefUrl"] &&
      graphStore["updateNodeData"](v635, {
        rhAnimeRealRefUrl: "",
        rhAnimeRealRefLocalPath: "",
        rhAnimeRealRefFileName: "",
      });
  }
  const v646 = _applyRhPersonReplaceV3FixedInputs({
    srcData: v639,
    tgtData: v640,
    incomingEdges: v644,
    nodes: v638,
    targetId: v635,
  });
  if (!v646["ok"]) return false;
  const v647 = _applyManifestFixedInputs({
    srcData: v639,
    tgtData: v640,
    incomingEdges: v644,
    nodes: v638,
    targetId: v635,
    preferredRefSlot: v636,
  });
  if (!v647["ok"]) return false;
  const v648 = _applyDreaminaVideoFixedInputs({
    srcData: v639,
    tgtData: v640,
    incomingEdges: v644,
    nodes: v638,
    targetId: v635,
  });
  if (!v648["ok"]) return false;
  const v649 = _applyMediaClipInputLimit({
    srcData: v639,
    tgtData: v640,
    incomingEdges: v644,
    nodes: v638,
    sourceId: v634,
  });
  if (!v649["ok"]) return false;
  const v650 = _applyGenericInputKindLimit({
    srcData: v639,
    tgtData: v640,
    incomingEdges: v644,
    nodes: v638,
    sourceId: v634,
  });
  if (!v650["ok"]) return false;
  const v651 = getStateRaw(),
    v652 = !!_getOutEdgeMap(v651["edges"], v651["_edgesRev"])
      ["get"](v634)
      ?.["has"](v635);
  if (v652) return false;
  let v653 = "",
    v654 = 0,
    v655 = 0;
  if (String(v639["type"] || "")["includes"]("video")) {
    const v656 = Array["isArray"](v639["videos"]) ? v639["videos"] : [],
      v657 = Number(v639["mainVideoIndex"]),
      v658 = Number["isFinite"](v657) ? Math["max"](0, Math["trunc"](v657)) : 0,
      v659 = v656[v658] || null,
      v660 = v656["find"](
        (v661) => _videoSourceKey(v661) && !_isUnavailableVideoRecord(v661),
      ),
      v662 = v659 && !_isUnavailableVideoRecord(v659) ? v659 : v660,
      v663 =
        String(v662?.["localPath"] || "")["trim"]() ||
        String(v662?.["displayLocalPath"] || "")["trim"]() ||
        String(v662?.["originalLocalPath"] || "")["trim"]() ||
        String(v662?.["videoLocalPath"] || "")["trim"]() ||
        String(v662?.["videoUrl"] || "")["trim"]() ||
        (!_isUnavailableVideoRecord(v639)
          ? String(v639["localPath"] || "")["trim"]() ||
            String(v639["displayLocalPath"] || "")["trim"]() ||
            String(v639["originalLocalPath"] || "")["trim"]() ||
            String(v639["videoLocalPath"] || "")["trim"]() ||
            String(v639["videoUrl"] || "")["trim"]() ||
            String(v639["src"] || "")["trim"]() ||
            String(v639["url"] || "")["trim"]() ||
            String(v639["resultUrl"] || "")["trim"]() ||
            String(v639["sourceUrl"] || "")["trim"]()
          : "");
    if (v663) v653 = v663;
    const v664 = Number(v659?.["videoWidth"] || 0),
      v665 = Number(v659?.["videoHeight"] || 0),
      v666 = Number(v639["selectedVideoWidth"] || 0),
      v667 = Number(v639["selectedVideoHeight"] || 0),
      v668 = Number(v639["videoWidth"] || 0),
      v669 = Number(v639["videoHeight"] || 0);
    if (v664 > 0 && v665 > 0) ((v654 = v664), (v655 = v665));
    else {
      if (v666 > 0 && v667 > 0) ((v654 = v666), (v655 = v667));
      else v668 > 0 && v669 > 0 && ((v654 = v668), (v655 = v669));
    }
    if (!(v654 > 0 && v655 > 0 && v653))
      try {
        const v670 = getDisplayedVideoMetaFromNode(v634),
          v671 = String(v670?.["src"] || "")["trim"](),
          v672 = Number(v670?.["w"] || 0),
          v673 = Number(v670?.["h"] || 0);
        v672 > 0 && v673 > 0 && ((v654 = v672), (v655 = v673));
        if (v671)
          try {
            const v674 = new URL(v671, window["location"]["origin"]),
              v675 = String(v674["pathname"] || "");
            if (v675["startsWith"]("/output/"))
              v653 = v675["replace"](/^\/+/, "");
            else {
              if (v675["startsWith"]("/data/"))
                v653 = v675["replace"](/^\/+/, "");
              else {
                if (v675["startsWith"]("/")) v653 = v675["replace"](/^\/+/, "");
              }
            }
          } catch {
            if (v671["startsWith"]("/")) v653 = v671["replace"](/^\/+/, "");
          }
      } catch {}
  }
  const v676 = v646["refSlot"] || v647["refSlot"] || v648["refSlot"] || "";
  (removeCoveredAssetInputRefForConnection({
    targetId: v635,
    targetNode: v651["nodes"]?.[v635] || v640,
    sourceNode: v639,
    sourceKind: resolveEffectiveInputKind(v639),
    refSlot: v676,
    incomingEdges: _getIncomingEdgesByTarget(
      v651["edges"],
      v651["_edgesRev"],
      v635,
    ),
    nodes: v651["nodes"] || v638,
  }),
    graphStore["addEdge"]({
      id:
        "edge-" +
        Date["now"]() +
        "-" +
        Math["random"]()["toString"](36)["slice"](2, 6),
      sourceId: v634,
      targetId: v635,
      ...(v676 ? { refSlot: v676 } : null),
      ...(v653 ? { sourceMediaKey: v653 } : null),
      ...(v654 > 0 && v655 > 0
        ? { sourceMediaW: v654, sourceMediaH: v655 }
        : null),
      createdAt: Date["now"](),
    }));
  try {
    const v677 = _getManifestFixedInputConfig(v640),
      v678 =
        String(v640?.["type"] || "") === "ai-video" &&
        (v677?.["slotOrderByType"]?.["video"] || [])["includes"]("sourceVideo");
    if (v678 && v654 > 0 && v655 > 0) {
      const v679 =
          (Array["isArray"](v640["videos"]) && v640["videos"]["length"] > 0) ||
          String(v640["videoUrl"] || "")["trim"]() ||
          String(v640["localPath"] || "")["trim"]() ||
          String(v640["thumbId"] || "")["trim"](),
        v680 = String(v640["aspectRatio"] || "自适应");
      if (!v679 && v680 === "自适应") {
        const v681 = getStateRaw(),
          v682 = v681["nodes"]?.[v635];
        if (v682) {
          const v683 = v654 / v655;
          if (Number["isFinite"](v683) && v683 > 0) {
            const v684 = getAIGenerationNodeSize(v654, v655),
              v685 = v684["width"],
              v686 = v684["height"],
              v687 = Number(v682["x"] || 0) + Number(v682["width"] || 0) / 2,
              v688 = Number(v682["y"] || 0) + Number(v682["height"] || 0) / 2;
            graphStore["updateNodeData"](v635, {
              width: v685,
              height: v686,
              x: v687 - v685 / 2,
              y: v688 - v686 / 2,
            });
          }
        }
      }
    }
  } catch {}
  return true;
}
export function initPickConnect(v689) {
  function v690(v691, v692, v693, v694, v695) {
    const v696 = _getOutEdgeMap(v694, v695),
      v697 = v693[v691],
      v698 = [],
      v699 = v692 === "left",
      v700 = v692 === "left" && _isAnimeRealTarget(v697),
      v701 = v692 === "left" && _isRhPersonReplaceV3Target(v697),
      v702 = v692 === "left" ? _getManifestFixedInputConfig(v697) : null,
      v703 = new Set(v702?.["visibleSlots"] || []);
    for (const [v704, v705] of Object["entries"](v693)) {
      if (v704 === v691) continue;
      const v706 = String(v705?.["type"] || "")["trim"]() === "group";
      if (v700) {
        if (!v706 && !_isAnimeRealImageSrc(v705)) {
          v698["push"](v704);
          continue;
        }
      }
      if (v701) {
        if (!v706 && !_isAnimeRealImageSrc(v705)) {
          v698["push"](v704);
          continue;
        }
      }
      if (v702 && !v706) {
        const v707 = _getRhV54RefKind(v705),
          v708 = (v702["slotOrderByType"]?.[v707] || [])["filter"]((v709) =>
            v703["has"](v709),
          );
        if (v707 !== "text" && v708["length"] === 0) {
          v698["push"](v704);
          continue;
        }
      }
      const v710 = v699 ? v705 : v697,
        v711 = v699 ? v697 : v705,
        v712 = !!(
          v710?.["id"] &&
          v711?.["id"] &&
          v696["get"](v710["id"])?.["has"](v711["id"])
        );
      (!isValidConnection(v710, v711) || v712) && v698["push"](v704);
    }
    return v698;
  }
  function v713(v714, v715) {
    const { pickConnectMode: v716 } = getStateRaw(),
      v717 = String(v716?.["preferredRefSlot"] || "")["trim"](),
      v718 = addEdgeWithPolicies({
        sourceId: v714,
        targetId: v715,
        preferredRefSlot: v717,
      });
    if (!v718) return false;
    const {
      pickConnectMode: v719,
      nodes: v720,
      edges: v721,
      _edgesRev: v722,
    } = getStateRaw();
    if (v719 && v719["active"]) {
      const v723 = v690(
        v719["sourceNodeId"],
        v719["handleDirection"],
        v720,
        v721,
        v722,
      );
      graphStore["setConnOverlay"]({
        srcId: v719["sourceNodeId"],
        invalidNodeIds: v723,
      });
    }
    return true;
  }
  (v689["addEventListener"](
    "contextmenu",
    (v724) => {
      const { pickConnectMode: v725 } = getStateRaw();
      if (!v725 || !v725["active"]) return;
      (v724["preventDefault"]?.(),
        v724["stopPropagation"]?.(),
        v724["stopImmediatePropagation"]?.(),
        (v724["_pickConnectHandled"] = true),
        uiStore["setPickConnectMode"]({ active: false }));
    },
    true,
  ),
    v689["addEventListener"](
      "click",
      (v726) => {
        const { pickConnectMode: v727 } = getStateRaw();
        if (!v727 || !v727["active"]) return;
        const v728 = v726["target"]["closest"](".prompt-attachment-btn");
        if (v728) {
          const v729 = v728["closest"](".v2-node");
          if (v729 && v729["id"] === v727["sourceNodeId"]) {
            ((v726["_pickConnectHandled"] = true),
              v726["stopImmediatePropagation"](),
              uiStore["setPickConnectMode"]({ active: false }));
            return;
          }
        }
        const v730 = v726["target"]["closest"](".v2-node");
        if (!v730 || v730["id"] === v727["sourceNodeId"]) return;
        const v731 = getStateRaw(),
          v732 = v731["nodes"][v730["id"]];
        if (!v732) return;
        const v733 = v727["handleDirection"] === "left",
          v734 = v733 ? v732["id"] : v727["sourceNodeId"],
          v735 = v733 ? v727["sourceNodeId"] : v732["id"],
          v736 = v731["nodes"][v734],
          v737 = v731["nodes"][v735];
        if (!isValidConnection(v736, v737)) return;
        v713(v734, v735) &&
          ((v726["_pickConnectHandled"] = true),
          v726["stopImmediatePropagation"]());
      },
      true,
    ),
    v689["addEventListener"]("pointermove", (v738) => {
      const {
        pickConnectMode: v739,
        nodes: v740,
        viewport: v741,
        connOverlay: v742,
        _persistRev: v743,
      } = getStateRaw();
      if (!v739 || !v739["active"]) return;
      const v744 = _getNodeSpatialIndex(
        v740,
        v743,
        _NODE_SPATIAL_INDEX_DEFAULT_KEY,
      );
      let v745 = hitTestNode(
        v738["clientX"],
        v738["clientY"],
        v740,
        v741,
        v739["sourceNodeId"],
        false,
        { spatialIndex: v744 },
      );
      (v745 &&
        v742 &&
        v742["invalidNodeIds"] &&
        v742["invalidNodeIds"]["includes"](v745) &&
        (v745 = null),
        v739["hoverNodeId"] !== v745 && uiStore["setPickConnectHover"](v745));
    }));
  const v746 = (v747) => {
    v747["target"]["closest"]('[contenteditable="true"]') &&
      v747["target"]["blur"]();
  };
  let v748 = false,
    v749 = null,
    v750 = null;
  uiStore["subscribeSelector"](
    (v751) => ({
      active: !!v751["pickConnectMode"]?.["active"],
      sourceNodeId: v751["pickConnectMode"]?.["sourceNodeId"] || null,
      handleDirection: v751["pickConnectMode"]?.["handleDirection"] || null,
    }),
    ({ active: v752, sourceNodeId: v753, handleDirection: v754 }) => {
      if (v752) {
        (v689["classList"]["add"]("is-connecting"),
          document["addEventListener"]("focusin", v746, true));
        const v755 = getCursorSize(),
          v756 = createLinkCursor({ size: v755 });
        (document["documentElement"]["classList"]["add"]("is-connecting-mode"),
          document["documentElement"]["style"]["setProperty"](
            "--connect-cursor",
            v756,
          ));
        if (!v748 || v749 !== v753 || v750 !== v754) {
          ((v748 = true), (v749 = v753), (v750 = v754));
          const { nodes: v757, edges: v758, _edgesRev: v759 } = getStateRaw(),
            v760 = v690(v753, v754, v757, v758, v759);
          graphStore["setConnOverlay"]({ srcId: v753, invalidNodeIds: v760 });
        }
      } else
        (v689["classList"]["remove"]("is-connecting"),
          document["removeEventListener"]("focusin", v746, true),
          document["documentElement"]["classList"]["remove"](
            "is-connecting-mode",
          ),
          document["documentElement"]["style"]["removeProperty"](
            "--connect-cursor",
          ),
          v748 &&
            ((v748 = false),
            (v749 = null),
            graphStore["setSelectionBox"]({ active: false }),
            uiStore["setPickConnectHover"](null),
            graphStore["clearConnOverlay"]()));
    },
  );
}
function _showQuoteMenu(v761, v762, v763, v764, v765, v766 = {}) {
  document["querySelector"](".v2-quote-menu")?.["remove"]();
  const { nodes: v767 } = getStateRaw(),
    v768 = (v769, v770 = null) => {
      const v771 = [],
        v772 = new Set(),
        v773 = Array["isArray"](v769) ? v769 : [];
      for (const v774 of v773) {
        const v775 = String(v774 || "")["trim"]();
        if (!v775 || v772["has"](v775)) continue;
        (v772["add"](v775), v771["push"](v775));
      }
      const v776 = String(v770 || "")["trim"]();
      if (v771["length"] === 0 && v776) v771["push"](v776);
      return v771;
    },
    v777 = v768(v766?.["sourceIds"], v763)["filter"]((v778) => !!v767[v778]),
    v779 = v777["includes"](v763) ? v763 : v777[0],
    v780 = v779 ? v767[v779] : null;
  if (!v780) {
    v765?.();
    return;
  }
  const v781 = v777["map"]((v782) => v767[v782])["filter"](Boolean),
    v783 = (v784, v785) => {
      const v786 = getDisplayedMediaSizeFromNode(v784, v785),
        v787 = Number(v786?.["w"] || 0),
        v788 = Number(v786?.["h"] || 0),
        v789 = v787 > 0 && v788 > 0 ? v787 / v788 : 0;
      return Number["isFinite"](v789) && v789 > 0 ? v789 : 0;
    },
    v790 = (v791, v792, v793, v794) => {
      const v795 = Number(v794);
      if (!(Number["isFinite"](v795) && v795 > 0)) return false;
      const v796 = getAIGenerationNodeSize(
          v795 >= 1 ? v795 : 1,
          v795 >= 1 ? 1 : 1 / v795,
        ),
        v797 = v796["width"],
        v798 = v796["height"],
        v799 = getStateRaw(),
        v800 = v799["nodes"]?.[v791];
      if (!v800) return false;
      return (
        graphStore["updateNodeData"](v791, {
          width: v797,
          height: v798,
          x: v792 - v797 / 2,
          y: v793 - v798 / 2,
        }),
        commit(),
        true
      );
    },
    v801 = (v802, v803) => {
      const v804 = getStateRaw(),
        v805 = v804["nodes"] || {},
        v806 = v805[v802],
        v807 = v805[v803];
      if (!v806 || !v807) return;
      if (String(v806["type"] || "") !== "ai-video") return;
      if (String(v807["type"] || "") !== "ai-video") return;
      const v808 = Number(v807["width"] || 0),
        v809 = Number(v807["height"] || 0);
      if (
        !(
          v808 === _AI_VIDEO_DEFAULT_SIZE["width"] &&
          v809 === _AI_VIDEO_DEFAULT_SIZE["height"]
        )
      )
        return;
      const v810 =
        (Array["isArray"](v807["videos"]) && v807["videos"]["length"] > 0) ||
        String(v807["videoUrl"] || "")["trim"]() ||
        String(v807["localPath"] || "")["trim"]() ||
        String(v807["thumbId"] || "")["trim"]();
      if (v810) return;
      const v811 = Number(v807["x"] || 0) + v808 / 2,
        v812 = Number(v807["y"] || 0) + v809 / 2,
        v813 = Date["now"](),
        v814 = () => {
          const v815 = getDisplayedMediaSizeFromNode(v802, "video"),
            v816 = Number(v815?.["w"] || 0),
            v817 = Number(v815?.["h"] || 0);
          let v818 = v816,
            v819 = v817;
          if (!(v818 > 0 && v819 > 0)) {
            const v820 = getStateRaw(),
              v821 = v820["nodes"]?.[v802];
            if (v821) {
              const v822 = Number(v821["mainVideoIndex"]),
                v823 = Number["isFinite"](v822)
                  ? Math["max"](0, Math["trunc"](v822))
                  : 0,
                v824 = Array["isArray"](v821["videos"]) ? v821["videos"] : [],
                v825 = v824[v823],
                v826 = Number(v825?.["videoWidth"] || 0),
                v827 = Number(v825?.["videoHeight"] || 0),
                v828 = Number(v821["selectedVideoWidth"] || 0),
                v829 = Number(v821["selectedVideoHeight"] || 0),
                v830 = Number(v821["videoWidth"] || 0),
                v831 = Number(v821["videoHeight"] || 0);
              if (v826 > 0 && v827 > 0) ((v818 = v826), (v819 = v827));
              else {
                if (v828 > 0 && v829 > 0) ((v818 = v828), (v819 = v829));
                else v830 > 0 && v831 > 0 && ((v818 = v830), (v819 = v831));
              }
            }
          }
          if (v818 > 0 && v819 > 0) {
            v790(v803, v811, v812, v818 / v819);
            return;
          }
          if (Date["now"]() - v813 < 1200) requestAnimationFrame(v814);
        };
      requestAnimationFrame(v814);
    },
    v832 = screenToWorld(v761, v762, v764),
    v833 = document["createElement"]("div");
  v833["className"] = "v2-quote-menu";
  const v834 = document["createElement"]("div");
  ((v834["className"] = "v2-quote-title"),
    (v834["textContent"] = "引用该节点生成"),
    v833["appendChild"](v834));
  const v835 = "var(--white-50)",
    v836 = "var(--white-02)",
    v837 = [
      {
        iconEl: _iconAiText(v835),
        iconBg: v836,
        label: "文本",
        desc: "文案、脚本、提示词",
        type: "ai-text",
        w: _AI_TEXT_DEFAULT_SIZE["width"],
        h: _AI_TEXT_DEFAULT_SIZE["height"],
      },
      {
        iconEl: _iconAiImage(v835),
        iconBg: v836,
        label: "图像",
        desc: "图片、海报、角色素材",
        type: "ai-image",
        w: _AI_IMAGE_DEFAULT_SIZE["width"],
        h: _AI_IMAGE_DEFAULT_SIZE["height"],
      },
      {
        iconEl: _iconAiVideo(v835),
        iconBg: v836,
        label: "视频",
        desc: "短片、转场、动态镜头",
        type: "ai-video",
        w: _AI_VIDEO_DEFAULT_SIZE["width"],
        h: _AI_VIDEO_DEFAULT_SIZE["height"],
      },
      {
        iconEl: _iconAiAudio(v835),
        iconBg: v836,
        label: "音频",
        desc: "配音、音效、音乐",
        type: "ai-audio",
        w: _AI_AUDIO_DEFAULT_SIZE["width"],
        h: _AI_AUDIO_DEFAULT_SIZE["height"],
      },
      {
        iconEl: _iconStoryboardScript(v835),
        iconBg: v836,
        label: "分镜脚本",
        desc: "镜头表、提示词、节奏",
        type: "storyboard-script",
        w: STORYBOARD_SCRIPT_DEFAULT_SIZE["width"],
        h: STORYBOARD_SCRIPT_DEFAULT_SIZE["height"],
        badge: "BETA",
      },
      {
        iconEl: _iconAiImage(v835),
        iconBg: v836,
        label: "360全景图",
        desc: "全景画面与空间关系",
        type: "panorama-360",
        w: PANORAMA_SCENE_DEFAULT_SIZE["width"],
        h: PANORAMA_SCENE_DEFAULT_SIZE["height"],
      },
    ]["map"](_applyNodeCreationMenuMeta),
    v838 = new Set(getAllowedGenerationNodeTypesForQuoteMenu(v781)),
    v839 = v837["filter"]((v840) => v838["has"](v840["type"]));
  (v839["forEach"]((v841) => {
    const v842 = document["createElement"]("button");
    v842["className"] = "v2-menu-row" + (v841["desc"] ? " has-desc" : "");
    const v843 = document["createElement"]("div");
    ((v843["className"] = "v2-menu-ico"), v843["replaceChildren"]());
    if (v841["iconEl"]) v843["appendChild"](v841["iconEl"]["cloneNode"](true));
    if (v841["iconBg"]) v843["style"]["background"] = v841["iconBg"];
    const v844 = document["createElement"]("div");
    v844["className"] = "v2-menu-txt-wrap";
    const v845 = document["createElement"]("span");
    ((v845["className"] = "v2-menu-lbl"),
      (v845["textContent"] = v841["label"]));
    if (v841["badge"]) {
      const v846 = document["createElement"]("span");
      ((v846["textContent"] = v841["badge"]),
        (v846["className"] = "v2-badge-beta"),
        v845["appendChild"](v846));
    }
    v844["appendChild"](v845);
    if (v841["desc"]) {
      const v847 = document["createElement"]("span");
      ((v847["className"] = "v2-menu-sub"),
        (v847["textContent"] = v841["desc"]),
        v844["appendChild"](v847));
    }
    (v842["appendChild"](v843),
      v842["appendChild"](v844),
      v842["addEventListener"]("click", (v848) => {
        v848["stopPropagation"]();
        const v849 = generateId(v841["type"]);
        let v850 = v841["w"],
          v851 = v841["h"];
        if (
          (v841["type"] === "ai-image" || v841["type"] === "ai-video") &&
          ((v780["width"] && v780["height"]) ||
            (v780["videoWidth"] && v780["videoHeight"]))
        ) {
          let v852 = 0;
          if (
            v841["type"] === "ai-video" &&
            String(v780["type"] || "") !== "ai-video"
          ) {
            const v853 = Number(v780["mainVideoIndex"]) || 0,
              v854 = Math["max"](0, Math["trunc"](v853)),
              v855 = Array["isArray"](v780["videos"]) ? v780["videos"] : [],
              v856 = String(v780["localPath"] || "")["trim"](),
              v857 = String(v780["videoUrl"] || "")["trim"](),
              v858 = Number(v780["selectedVideoWidth"] || 0),
              v859 = Number(v780["selectedVideoHeight"] || 0);
            let v860 = v854;
            if (v855["length"]) {
              let v861 = -1;
              v856 &&
                (v861 = v855["findIndex"](
                  (v862) =>
                    String(v862?.["localPath"] || "")["trim"]() === v856,
                ));
              v861 < 0 &&
                v857 &&
                (v861 = v855["findIndex"](
                  (v863) => String(v863?.["videoUrl"] || "")["trim"]() === v857,
                ));
              if (v861 >= 0) v860 = v861;
              else {
                if (v854 >= v855["length"]) v860 = 0;
              }
            } else v860 = 0;
            const v864 = v855[v860] || v855[0] || null,
              v865 = v864
                ? Number(v864["videoWidth"] || v864["width"] || 0)
                : 0,
              v866 = v864
                ? Number(v864["videoHeight"] || v864["height"] || 0)
                : 0;
            v852 =
              (v858 > 0 && v859 > 0 ? v858 / v859 : 0) ||
              v783(v779, "video") ||
              (v865 > 0 && v866 > 0 ? v865 / v866 : 0) ||
              (v780["videoWidth"] && v780["videoHeight"]
                ? v780["videoWidth"] / v780["videoHeight"]
                : 0) ||
              (v780["width"] && v780["height"]
                ? v780["width"] / v780["height"]
                : 0);
          } else
            v852 =
              v783(v779, "image") ||
              (v780["width"] && v780["height"]
                ? v780["width"] / v780["height"]
                : 0);
          if (!(Number["isFinite"](v852) && v852 > 0)) v852 = 1;
          const v867 = getAIGenerationNodeSize(
            v852 >= 1 ? v852 : 1,
            v852 >= 1 ? 1 : 1 / v852,
          );
          ((v850 = v867["width"]), (v851 = v867["height"]));
        }
        let v868 = {
          id: v849,
          type: v841["type"],
          x: v832["x"] - v850 / 2,
          y: v832["y"] - v851 / 2,
          width: v850,
          height: v851,
          name: v841["defaultName"] || v841["label"],
        };
        (v841["type"] === "ai-image" || v841["type"] === "ai-video") &&
          !Object["prototype"]["hasOwnProperty"]["call"](v868, "aspectRatio") &&
          (v868["aspectRatio"] = "自适应");
        if (v780["type"] === v841["type"]) {
          const v869 = { ...v780 };
          (delete v869["id"],
            delete v869["x"],
            delete v869["y"],
            delete v869["width"],
            delete v869["height"],
            delete v869["name"],
            delete v869["prompt"],
            delete v869["outputText"],
            stripImageGenerationResultStateForDerivedNode(v869),
            delete v869["batchSize"],
            (v868 = { ...v869, ...v868 }));
        }
        _isPanorama360TargetType(v868["type"]) &&
          (v868 = createPanorama360NodeData({
            id: v868["id"],
            x: v868["x"],
            y: v868["y"],
            width: v868["width"],
            height: v868["height"],
            name: v868["name"],
          }));
        v868["type"] === "storyboard-script" &&
          (v868 = createStoryboardScriptNodeData({
            id: v868["id"],
            x: v868["x"],
            y: v868["y"],
            width: v868["width"],
            height: v868["height"],
            name: v868["name"],
          }));
        graphStore["addNode"](v868);
        let v870 = false,
          v871 = "";
        for (const v872 of v777) {
          const v873 = getStateRaw(),
            v874 = v873["nodes"]?.[v872],
            v875 = v873["nodes"]?.[v849];
          if (!v874 || !v875) continue;
          if (!isValidConnection(v874, v875)) continue;
          const v876 = addEdgeWithPolicies({ sourceId: v872, targetId: v849 });
          if (!v876) continue;
          v870 = true;
          if (!v871) v871 = v872;
        }
        if (!v870 && v777["length"] === 1) {
          const v877 = generateId("edge");
          (graphStore["addEdge"]({
            id: v877,
            sourceId: v777[0],
            targetId: v849,
            createdAt: Date["now"](),
          }),
            (v870 = true),
            (v871 = v777[0]));
        }
        (graphStore["setSelectedNodes"]([v849]),
          commit(),
          v841["type"] === "ai-video" && v871 && v801(v871, v849),
          v878?.(),
          v833["remove"](),
          v765?.());
      }),
      v833["appendChild"](v842));
  }),
    document["body"]["appendChild"](v833));
  const v879 = () => {
    const v880 = getStateRaw()["viewport"] || v764,
      v881 = worldToScreen(v832["x"], v832["y"], v880);
    ((v833["style"]["left"] = v881["x"] + "px"),
      (v833["style"]["top"] = v881["y"] + "px"));
  };
  v879();
  const v878 = graphStore["subscribeSelector"](
      (v882) => v882["viewport"],
      () => v879(),
    ),
    v883 = (v884) => {
      if (v833["contains"](v884["target"])) return;
      (v878?.(),
        v833["remove"](),
        document["removeEventListener"]("mousedown", v883, true),
        v765?.());
    };
  requestAnimationFrame(() =>
    document["addEventListener"]("mousedown", v883, true),
  );
}
function _showLeftQuoteMenu(v885, v886, v887, v888, v889) {
  document["querySelector"](".v2-quote-menu")?.["remove"]();
  const { nodes: v890 } = getState(),
    v891 = v890[v887];
  if (!v891) {
    v889?.();
    return;
  }
  const v892 = screenToWorld(v885, v886, v888),
    v893 = document["createElement"]("div");
  v893["className"] = "v2-quote-menu";
  const v894 = document["createElement"]("div");
  ((v894["className"] = "v2-quote-title"),
    (v894["textContent"] = "创建输入节点"),
    v893["appendChild"](v894));
  const v895 = [
      {
        iconEl: _iconSourceText("var(--white-50)"),
        iconBg: "var(--white-05)",
        label: "源文本",
        desc: "纯文本片段",
        type: "source-text",
        ...getNodeDefaultSize("source-text"),
      },
      {
        iconEl: _iconAiImage("var(--white-50)"),
        iconBg: "var(--white-05)",
        label: "源图像",
        desc: "参考图、首帧、素材",
        type: "source-image",
        ...getNodeDefaultSize("source-image"),
      },
      {
        iconEl: _iconAiAudio("var(--white-50)"),
        iconBg: "var(--white-05)",
        label: "源音频",
        desc: "本地或上传音频",
        type: "source-audio",
        ...getNodeDefaultSize("source-audio"),
      },
      {
        iconEl: _iconAiVideo("var(--white-50)"),
        iconBg: "var(--white-05)",
        label: "源视频",
        desc: "本地或上传视频",
        type: "source-video",
        ...getNodeDefaultSize("source-video"),
      },
      {
        iconEl: _iconAiText("var(--white-50)"),
        iconBg: "var(--white-05)",
        label: "文本",
        desc: "文案、脚本、提示词",
        type: "ai-text",
        w: _AI_TEXT_DEFAULT_SIZE["width"],
        h: _AI_TEXT_DEFAULT_SIZE["height"],
      },
      {
        iconEl: _iconAiImage("var(--white-50)"),
        iconBg: "var(--white-05)",
        label: "图像",
        desc: "图片、海报、角色素材",
        type: "ai-image",
        w: _AI_IMAGE_DEFAULT_SIZE["width"],
        h: _AI_IMAGE_DEFAULT_SIZE["height"],
      },
      {
        iconEl: _iconAiVideo("var(--white-50)"),
        iconBg: "var(--white-05)",
        label: "视频",
        desc: "短片、转场、动态镜头",
        type: "ai-video",
        w: _AI_VIDEO_DEFAULT_SIZE["width"],
        h: _AI_VIDEO_DEFAULT_SIZE["height"],
      },
      {
        iconEl: _iconAiAudio("var(--white-50)"),
        iconBg: "var(--white-05)",
        label: "音频",
        desc: "配音、音效、音乐",
        type: "ai-audio",
        w: _AI_AUDIO_DEFAULT_SIZE["width"],
        h: _AI_AUDIO_DEFAULT_SIZE["height"],
      },
    ]["map"](_applyNodeCreationMenuMeta),
    v896 = getAllowedInputNodeTypesForSidePlus(v891["type"]),
    v897 = v895["filter"]((v898) => v896["includes"](v898["type"]));
  (v897["forEach"]((v899) => {
    const v900 = document["createElement"]("button");
    ((v900["className"] = "v2-menu-row" + (v899["desc"] ? " has-desc" : "")),
      (v900["style"]["marginBottom"] = "2px"));
    const v901 = document["createElement"]("div");
    ((v901["className"] = "v2-menu-ico"), v901["replaceChildren"]());
    if (v899["iconEl"]) v901["appendChild"](v899["iconEl"]["cloneNode"](true));
    if (v899["iconBg"]) v901["style"]["background"] = v899["iconBg"];
    const v902 = document["createElement"]("div");
    ((v902["className"] = "v2-menu-txt-wrap"),
      Object["assign"](v902["style"], {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        flex: "1",
        minWidth: "0",
      }));
    const v903 = document["createElement"]("span");
    ((v903["className"] = "v2-menu-lbl"),
      Object["assign"](v903["style"], {
        fontSize: "16px",
        fontWeight: "500",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }),
      (v903["textContent"] = v899["label"]));
    if (v899["badge"]) {
      const v904 = document["createElement"]("span");
      ((v904["textContent"] = v899["badge"]),
        Object["assign"](v904["style"], {
          fontSize: "10px",
          padding: "1px 6px",
          borderRadius: "10px",
          border: "1px solid var(--stroke-danger)",
          color: "var(--text-danger)",
          background: "var(--fill-danger-soft)",
          fontWeight: "700",
          letterSpacing: "0.3px",
        }),
        v903["appendChild"](v904));
    }
    v902["appendChild"](v903);
    if (v899["desc"]) {
      const v905 = document["createElement"]("span");
      ((v905["className"] = "v2-menu-sub"),
        (v905["textContent"] = v899["desc"]),
        v902["appendChild"](v905));
    }
    (v900["appendChild"](v901),
      v900["appendChild"](v902),
      v900["addEventListener"]("click", (v906) => {
        v906["stopPropagation"]();
        const v907 = generateId(v899["type"]);
        let v908 = {
          id: v907,
          type: v899["type"],
          x: v892["x"] - 150,
          y: v892["y"],
          width: v899["width"] ?? v899["w"],
          height: v899["height"] ?? v899["h"],
          name: v899["defaultName"] || v899["label"],
        };
        (v899["type"] === "ai-image" || v899["type"] === "ai-video") &&
          !Object["prototype"]["hasOwnProperty"]["call"](v908, "aspectRatio") &&
          (v908["aspectRatio"] = "自适应");
        if (v891["type"] === v899["type"]) {
          const v909 = { ...v891 };
          (delete v909["id"],
            delete v909["x"],
            delete v909["y"],
            delete v909["width"],
            delete v909["height"],
            delete v909["name"],
            delete v909["prompt"],
            delete v909["outputText"],
            stripImageGenerationResultStateForDerivedNode(v909),
            delete v909["batchSize"],
            (v908 = { ...v909, ...v908 }));
        }
        if (v908["type"] === "source-image" || v908["type"] === "source-video")
          v908 = buildSourceMediaNodePayload(v908);
        else
          _isPanorama360TargetType(v908["type"]) &&
            (v908 = createPanorama360NodeData({
              id: v908["id"],
              x: v908["x"],
              y: v908["y"],
              width: v908["width"],
              height: v908["height"],
            }));
        graphStore["addNode"](v908);
        const v910 = addEdgeWithPolicies({ sourceId: v907, targetId: v887 });
        if (!v910) {
          const v911 = generateId("edge");
          graphStore["addEdge"]({
            id: v911,
            sourceId: v907,
            targetId: v887,
            createdAt: Date["now"](),
          });
        }
        (graphStore["setSelectedNodes"]([v907]),
          commit(),
          v912?.(),
          v893["remove"](),
          v889?.());
      }),
      v893["appendChild"](v900));
  }),
    document["body"]["appendChild"](v893));
  const v913 = () => {
    const v914 = getStateRaw()["viewport"] || v888,
      v915 = worldToScreen(v892["x"], v892["y"], v914);
    ((v893["style"]["left"] = v915["x"] + "px"),
      (v893["style"]["top"] = v915["y"] + "px"));
  };
  v913();
  const v912 = graphStore["subscribeSelector"](
      (v916) => v916["viewport"],
      () => v913(),
    ),
    v917 = (v918) => {
      if (v893["contains"](v918["target"])) return;
      (v912?.(),
        v893["remove"](),
        document["removeEventListener"]("mousedown", v917, true),
        v889?.());
    };
  requestAnimationFrame(() =>
    document["addEventListener"]("mousedown", v917, true),
  );
}

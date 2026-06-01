import appStore from "../core/stores/appStore.js";
import {
  addPanoramaSceneCamera,
  addPanoramaSceneCube,
  addPanoramaSceneMannequin,
  addPanoramaSceneMannequinGrid,
  capturePanoramaSceneViewport,
  clearPanoramaSceneSelection,
  deletePanoramaSceneCamera,
  deleteSelectedPanoramaSceneObject,
  focusPanoramaSceneSelection,
  resetPanoramaSceneView,
  setPanoramaSceneCollapsed,
  setPanoramaSceneCaptureMode,
  setPanoramaSceneEditing,
  setPanoramaSceneEnvironmentMode,
  setPanoramaSceneGridPlacement,
  setPanoramaSceneMode,
  setPanoramaSceneSelection,
  setPanoramaSceneSelectionBatch,
  setPanoramaSceneSelectionObjects,
  setPanoramaSceneTool,
  updatePanoramaSceneLoadState,
  updatePanoramaSceneObjectTransform,
  uploadPanoramaSceneImage,
  applyPanoramaSceneViewCommit,
  syncPanorama360FromIncomingImageEdge,
  upsertPanoramaSceneCameraAtSlot,
} from "../modules/panoramaSceneNode/sceneNodeActions.js";
import { getPanoramaSceneState } from "../modules/panoramaSceneNode/sceneNodeSelectors.js";
import { PanoramaScene3DBridge } from "../modules/panoramaSceneNode/scene3dBridge.js";
import { preloadPanoramaCharacterModels } from "../modules/panoramaSceneNode/characterModelRegistry.js";
import { PanoramaSceneInteraction } from "../modules/interaction/PanoramaSceneInteraction.js";
import { PANORAMA_SCENE_TOOLBAR_HTML } from "./panoramaScene/PanoramaSceneToolbar.js";
import {
  PANORAMA_360_MODE_TOOLBAR_HTML,
  PANORAMA_SCENE_MODE_TOOLBAR_HTML,
} from "./panoramaScene/PanoramaModeToolbar.js";
import { PANORAMA_SCENE_CORNER_TOOLBAR_HTML } from "./panoramaScene/PanoramaSceneCornerToolbar.js";
import { PANORAMA_SCENE_BOTTOM_TOOLBAR_HTML } from "./panoramaScene/PanoramaSceneBottomToolbar.js";
import {
  createCameraPresetList,
  renderCameraPresetList,
} from "./panoramaScene/CameraPresetList.js";
import {
  createMannequinQuickMenu,
  PANORAMA_MANNEQUIN_COLOR_OPTIONS,
  PANORAMA_MANNEQUIN_GENDER_OPTIONS,
  resolvePanoramaSceneColorToken,
  renderMannequinQuickMenu,
} from "./panoramaScene/MannequinQuickMenu.js";
import { getShortcuts } from "../modules/shortcuts.js";
import * as threeRuntime from "../modules/panoramaSceneNode/threeRuntime.js";
import {
  createDefaultSceneView,
  PANORAMA_360_NODE_TYPE,
} from "../modules/panoramaSceneNode/sceneNode.js";
import {
  SCENE_DEFAULT_FOCAL_LENGTH_MM,
  SCENE_FOCAL_LENGTH_MAX_MM,
  SCENE_FOCAL_LENGTH_MIN_MM,
  cameraPoseToSceneViewFromReference,
  focalLengthToFov,
} from "../core/panoramaSceneMath.js";
const POINTER_TOOL_ICON =
    "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22><path\x20d=\x22m5\x203\x2010\x208-6\x201\x202\x207-3\x201-2-7-4\x203z\x22/></svg>",
  BOX_SELECT_TOOL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8v6H8z" stroke-dasharray="2 2"/></svg>',
  PANORAMA_360_IMAGE_SOURCE_TYPES = new Set([
    "source-image",
    "ai-image",
    "image",
  ]);
function isPanorama360ImageSourceType(v0) {
  return PANORAMA_360_IMAGE_SOURCE_TYPES["has"](String(v0 || "")["trim"]());
}
function createElementFromHtml(v1) {
  const v2 = document["createElement"]("template");
  return ((v2["innerHTML"] = v1["trim"]()), v2["content"]["firstElementChild"]);
}
function attachUiStop(v3, { wheel: wheel = false } = {}) {
  if (!v3) return;
  ((v3["dataset"]["uiStop"] = "1"),
    v3["addEventListener"]("pointerdown", (v4) => v4["stopPropagation"]()),
    wheel &&
      v3["addEventListener"](
        "wheel",
        (v5) => {
          v5["stopPropagation"]();
        },
        { passive: false },
      ));
}
function getShortcutLabel(v6) {
  const v7 = getShortcuts()?.[v6],
    v8 = Array["isArray"](v7?.["keys"]) ? v7["keys"]["filter"](Boolean) : [];
  return v8["length"] > 0 ? "[" + v8["join"]("+") + "]" : "";
}
function buildTooltipText(v9, v10) {
  const v11 = getShortcutLabel(v10);
  return v11 ? v9 + "\x20" + v11 : v9;
}
function normalizeCameraSlot(v12) {
  const v13 = Number(v12);
  if (!Number["isInteger"](v13)) return null;
  if (v13 < 1 || v13 > 10) return null;
  return v13;
}
function resolveCameraSlotEntries(v14 = []) {
  const v15 = Array["isArray"](v14) ? v14 : [],
    v16 = new Set(),
    v17 = [];
  return (
    v15["forEach"]((v18) => {
      const v19 = normalizeCameraSlot(v18?.["slot"]);
      if (!v19 || v16["has"](v19)) return;
      (v16["add"](v19), v17["push"]({ camera: v18, slot: v19 }));
    }),
    v15["forEach"]((v20) => {
      if (v17["some"]((v21) => v21["camera"]?.["id"] === v20?.["id"])) return;
      for (let v22 = 1; v22 <= 10; v22 += 1) {
        if (v16["has"](v22)) continue;
        (v16["add"](v22), v17["push"]({ camera: v20, slot: v22 }));
        break;
      }
    }),
    v17["sort"]((v23, v24) => v23["slot"] - v24["slot"])
  );
}
function lerp(v25, v26, v27) {
  return v25 + (v26 - v25) * v27;
}
function smootherstep(v28) {
  const v29 = Math["max"](0, Math["min"](1, Number(v28) || 0));
  return v29 * v29 * v29 * (v29 * (v29 * 6 - 15) + 10);
}
function interpolateVector3(v30, v31, v32) {
  return {
    x: lerp(Number(v30?.["x"]) || 0, Number(v31?.["x"]) || 0, v32),
    y: lerp(Number(v30?.["y"]) || 0, Number(v31?.["y"]) || 0, v32),
    z: lerp(Number(v30?.["z"]) || 0, Number(v31?.["z"]) || 0, v32),
  };
}
function cloneVector3(v33) {
  return interpolateVector3(v33, v33, 1);
}
function quaternionToRotation(v34) {
  const v35 = v34?.["clone"]?.() || new threeRuntime["Quaternion"](),
    v36 = new threeRuntime["Euler"](0, 0, 0, "YXZ")["setFromQuaternion"](
      v35,
      "YXZ",
    );
  return { x: v36["x"], y: v36["y"], z: v36["z"] };
}
function areSceneViewsEquivalent(v37, v38, v39 = 0.00001) {
  if (!v37 || !v38) return false;
  return (
    Math["abs"](
      (Number(v37?.["target"]?.["x"]) || 0) -
        (Number(v38?.["target"]?.["x"]) || 0),
    ) <= v39 &&
    Math["abs"](
      (Number(v37?.["target"]?.["y"]) || 0) -
        (Number(v38?.["target"]?.["y"]) || 0),
    ) <= v39 &&
    Math["abs"](
      (Number(v37?.["target"]?.["z"]) || 0) -
        (Number(v38?.["target"]?.["z"]) || 0),
    ) <= v39 &&
    Math["abs"](
      (Number(v37?.["orbitYaw"]) || 0) - (Number(v38?.["orbitYaw"]) || 0),
    ) <= v39 &&
    Math["abs"](
      (Number(v37?.["orbitPitch"]) || 0) - (Number(v38?.["orbitPitch"]) || 0),
    ) <= v39 &&
    Math["abs"](
      (Number(v37?.["orbitDistance"]) || 0) -
        (Number(v38?.["orbitDistance"]) || 0),
    ) <= v39
  );
}
const PANORAMA_CAPTURE_MODE_OPTIONS = [
  { key: "adaptive", label: "自适应", iconClass: "is-adaptive" },
  { key: "9:16", label: "9:16", ratio: 9 / 16, iconClass: "is-9-16" },
  { key: "2.35:1", label: "2.35:1", ratio: 2.35, iconClass: "is-2-35-1" },
];
function normalizeCaptureMode(v40) {
  return PANORAMA_CAPTURE_MODE_OPTIONS["some"]((v41) => v41["key"] === v40)
    ? v40
    : "adaptive";
}
function getCaptureModeMeta(v42) {
  const v43 = normalizeCaptureMode(v42);
  return (
    PANORAMA_CAPTURE_MODE_OPTIONS["find"]((v44) => v44["key"] === v43) ||
    PANORAMA_CAPTURE_MODE_OPTIONS[0]
  );
}
function computeCaptureFrameRect(v45, v46, v47) {
  const v48 = Math["max"](0, Number(v45) || 0),
    v49 = Math["max"](0, Number(v46) || 0);
  if (v48 <= 0 || v49 <= 0) return { x: 0, y: 0, width: 0, height: 0 };
  const v50 = normalizeCaptureMode(v47);
  if (v50 === "adaptive") return { x: 0, y: 0, width: v48, height: v49 };
  const v51 = getCaptureModeMeta(v50)["ratio"];
  if (!(v51 > 0)) return { x: 0, y: 0, width: v48, height: v49 };
  const v52 = v48 / v49;
  if (v52 >= v51) {
    const v53 = v49 * v51;
    return { x: (v48 - v53) / 2, y: 0, width: v53, height: v49 };
  }
  const v54 = v48 / v51;
  return { x: 0, y: (v49 - v54) / 2, width: v48, height: v54 };
}
export function resolveNextPanoramaMouseTool(v55) {
  return String(v55 || "")["trim"]() === "box-select"
    ? "navigate"
    : "box-select";
}
function resolvePanoramaSceneHistoryShortcutAction(v56) {
  const v57 = v56?.["ctrlKey"] === true || v56?.["metaKey"] === true;
  if (!v57 || v56?.["altKey"] === true) return null;
  const v58 = String(v56?.["key"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v58 === "z") return v56?.["shiftKey"] === true ? "redo" : "undo";
  return null;
}
async function decodeImageBlob(v59) {
  if (typeof createImageBitmap === "function") return createImageBitmap(v59);
  const v60 = await new Promise((v61, v62) => {
    const v63 = URL["createObjectURL"](v59),
      v64 = new Image();
    ((v64["onload"] = () => {
      (URL["revokeObjectURL"](v63), v61(v64));
    }),
      (v64["onerror"] = (v65) => {
        (URL["revokeObjectURL"](v63), v62(v65));
      }),
      (v64["src"] = v63));
  });
  return v60;
}
function closeDecodedImage(v66) {
  v66 && typeof v66["close"] === "function" && v66["close"]();
}
async function canvasToPngBlob(v67) {
  return new Promise((v68, v69) => {
    v67["toBlob"]((v70) => {
      if (v70) {
        v68(v70);
        return;
      }
      v69(new Error("截图裁切失败"));
    }, "image/png");
  });
}
async function cropCaptureBlobToFrame({
  blob: v71,
  viewportWidth: v72,
  viewportHeight: v73,
  mode: v74,
}) {
  if (!(v71 instanceof Blob)) return null;
  const v75 = normalizeCaptureMode(v74);
  if (v75 === "adaptive") return v71;
  const v76 = computeCaptureFrameRect(v72, v73, v75);
  if (v76["width"] <= 0 || v76["height"] <= 0) return v71;
  const v77 = await decodeImageBlob(v71);
  try {
    const v78 = Number(v77["width"]) || Number(v77["videoWidth"]) || 0,
      v79 = Number(v77["height"]) || Number(v77["videoHeight"]) || 0;
    if (v78 <= 0 || v79 <= 0) return v71;
    const v80 = v78 / Math["max"](1, v72),
      v81 = v79 / Math["max"](1, v73),
      v82 = Math["max"](0, Math["round"](v76["x"] * v80)),
      v83 = Math["max"](0, Math["round"](v76["y"] * v81)),
      v84 = Math["min"](
        v78 - v82,
        Math["max"](1, Math["round"](v76["width"] * v80)),
      ),
      v85 = Math["min"](
        v79 - v83,
        Math["max"](1, Math["round"](v76["height"] * v81)),
      ),
      v86 = document["createElement"]("canvas");
    ((v86["width"] = v84), (v86["height"] = v85));
    const v87 = v86["getContext"]("2d");
    if (!v87) throw new Error("截图裁切失败");
    return (
      v87["drawImage"](v77, v82, v83, v84, v85, 0, 0, v84, v85),
      canvasToPngBlob(v86)
    );
  } finally {
    closeDecodedImage(v77);
  }
}
export class PanoramaSceneNode {
  constructor(v88) {
    ((this["_data"] = v88),
      (this["id"] = v88["id"]),
      (this["_isPanorama360"] =
        String(v88?.["type"] || "")["trim"]() === PANORAMA_360_NODE_TYPE),
      (this["el"] = document["createElement"]("div")),
      (this["el"]["className"] =
        "v2-node-component\x20panorama-scene-component"),
      this["el"]["classList"]["toggle"](
        "is-panorama-360",
        this["_isPanorama360"],
      ),
      (this["_sceneState"] = getPanoramaSceneState(v88)),
      (this["_openMenuKey"] = null),
      (this["_menuHideTimer"] = null),
      (this["_resizeObserver"] = null),
      (this["_bridge"] = null),
      (this["_interaction"] = null),
      (this["_unsubscribeViewport"] = null),
      (this["_unsubscribeSelection"] = null),
      (this["_unsubscribePanoramaIncomingSync"] = null),
      (this["_isSelected"] = false),
      (this["_isNodeHovered"] = false),
      (this["_isUnmounted"] = false),
      (this["_contextMenuTarget"] = null),
      (this["_cameraJumpRaf"] = 0),
      (this["_cameraJumpToken"] = 0),
      (this["_pendingCameraJumpCommit"] = null),
      (this["_pendingCameraJumpReleaseRaf"] = 0),
      (this["_hasRequestedCharacterPreload"] = false),
      (this["_defaultSceneFocalLength"] = SCENE_DEFAULT_FOCAL_LENGTH_MM),
      (this["_browserFullscreenOverlayEl"] = null),
      (this["_browserFullscreenAnchorEl"] = null),
      (this["_handleToolbarClick"] = this["_handleToolbarClick"]["bind"](this)),
      (this["_handleFileInputChange"] =
        this["_handleFileInputChange"]["bind"](this)),
      (this["_handleViewportPointerDown"] =
        this["_handleViewportPointerDown"]["bind"](this)),
      (this["_handleViewportContextMenu"] =
        this["_handleViewportContextMenu"]["bind"](this)),
      (this["_handleGlobalPointerDown"] =
        this["_handleGlobalPointerDown"]["bind"](this)),
      (this["_handleViewportDoubleClick"] =
        this["_handleViewportDoubleClick"]["bind"](this)),
      (this["_handleKeyDown"] = this["_handleKeyDown"]["bind"](this)),
      (this["_handleNodePointerEnter"] =
        this["_handleNodePointerEnter"]["bind"](this)),
      (this["_handleNodePointerLeave"] =
        this["_handleNodePointerLeave"]["bind"](this)),
      (this["_handleBottomToolbarPointerEnter"] =
        this["_handleBottomToolbarPointerEnter"]["bind"](this)),
      (this["_handleBottomToolbarPointerLeave"] =
        this["_handleBottomToolbarPointerLeave"]["bind"](this)),
      (this["_handleCaptureMenuClick"] =
        this["_handleCaptureMenuClick"]["bind"](this)),
      (this["_handleWindowResize"] = this["_handleWindowResize"]["bind"](this)),
      (this["_handleShortcutsUpdated"] =
        this["_handleShortcutsUpdated"]["bind"](this)),
      (this["_handleCameraShortcutEvent"] =
        this["_handleCameraShortcutEvent"]["bind"](this)),
      (this["_handleCaptureShortcutEvent"] =
        this["_handleCaptureShortcutEvent"]["bind"](this)),
      (this["_handleWindowKeyDown"] =
        this["_handleWindowKeyDown"]["bind"](this)));
  }
  ["mount"]() {
    ((this["_isUnmounted"] = false),
      Object["assign"](this["el"]["style"], {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "visible",
        pointerEvents: "auto",
        cursor: "default",
        position: "relative",
      }),
      (this["_shellEl"] = document["createElement"]("div")),
      (this["_shellEl"]["className"] = "panorama-scene-shell"),
      (this["_viewportEl"] = document["createElement"]("div")),
      (this["_viewportEl"]["className"] = "panorama-scene-viewport"),
      (this["_viewportEl"]["dataset"]["sceneInteraction"] = "panorama"),
      (this["_viewportEl"]["tabIndex"] = 0),
      this["_viewportEl"]["addEventListener"](
        "pointerdown",
        this["_handleViewportPointerDown"],
      ),
      this["_viewportEl"]["addEventListener"](
        "contextmenu",
        this["_handleViewportContextMenu"],
      ),
      this["_viewportEl"]["addEventListener"](
        "dblclick",
        this["_handleViewportDoubleClick"],
      ),
      this["_viewportEl"]["addEventListener"](
        "keydown",
        this["_handleKeyDown"],
      ),
      (this["_overlayEl"] = document["createElement"]("div")),
      (this["_overlayEl"]["className"] = "panorama-scene-overlay"),
      (this["_infoDockEl"] = document["createElement"]("div")),
      (this["_infoDockEl"]["className"] = "panorama-scene-fixed-info-dock"),
      (this["_infoDockEl"]["style"]["transform"] = "none"),
      (this["_sceneToolbarEl"] = createElementFromHtml(
        PANORAMA_SCENE_TOOLBAR_HTML,
      )),
      this["_sceneToolbarEl"]["addEventListener"](
        "click",
        this["_handleToolbarClick"],
      ),
      attachUiStop(this["_sceneToolbarEl"]));
    const v89 = this["_isPanorama360"]
      ? PANORAMA_360_MODE_TOOLBAR_HTML
      : PANORAMA_SCENE_MODE_TOOLBAR_HTML;
    return (
      (this["_editToolbarEl"] = createElementFromHtml(v89)),
      this["_editToolbarEl"]["addEventListener"](
        "click",
        this["_handleToolbarClick"],
      ),
      attachUiStop(this["_editToolbarEl"]),
      (this["_cornerToolbarEl"] = createElementFromHtml(
        PANORAMA_SCENE_CORNER_TOOLBAR_HTML,
      )),
      this["_cornerToolbarEl"]["addEventListener"](
        "click",
        this["_handleToolbarClick"],
      ),
      attachUiStop(this["_cornerToolbarEl"]),
      (this["_bottomToolbarEl"] = createElementFromHtml(
        PANORAMA_SCENE_BOTTOM_TOOLBAR_HTML,
      )),
      this["_bottomToolbarEl"]["addEventListener"](
        "click",
        this["_handleToolbarClick"],
      ),
      this["_bottomToolbarEl"]["addEventListener"](
        "pointerover",
        this["_handleBottomToolbarPointerEnter"],
      ),
      this["_bottomToolbarEl"]["addEventListener"](
        "pointerout",
        this["_handleBottomToolbarPointerLeave"],
      ),
      attachUiStop(this["_bottomToolbarEl"]),
      (this["_bottomToolbarAnchorEl"] = document["createElement"]("div")),
      (this["_bottomToolbarAnchorEl"]["className"] =
        "panorama-scene-bottom-toolbar-anchor"),
      this["_bottomToolbarAnchorEl"]["appendChild"](this["_bottomToolbarEl"]),
      (this["_bottomToolbarPopoverLayerEl"] = document["createElement"]("div")),
      (this["_bottomToolbarPopoverLayerEl"]["className"] =
        "panorama-scene-bottom-toolbar-popovers"),
      this["_bottomToolbarEl"]["appendChild"](
        this["_bottomToolbarPopoverLayerEl"],
      ),
      (this["_cameraListEl"] = createCameraPresetList()),
      attachUiStop(this["_cameraListEl"]),
      this["_cameraListEl"]["addEventListener"]("mouseenter", () =>
        this["_openMenu"]("camera"),
      ),
      this["_cameraListEl"]["addEventListener"]("mouseleave", () =>
        this["_scheduleMenuHide"]("camera"),
      ),
      (this["_mannequinMenuEl"] = createMannequinQuickMenu({
        onSelectGender: ({ gender: v90 }) => {
          setPanoramaSceneGridPlacement({
            nodeId: this["id"],
            patch: { gender: v90 === "female" ? "female" : "male" },
          });
        },
        onSelectColor: ({ colorKey: v91, gender: v92 }) => {
          const v93 = v92 === "female" ? "female" : "male";
          (this["_selectNodeOnCanvas"](),
            setPanoramaSceneGridPlacement({
              nodeId: this["id"],
              patch: { colorKey: v91, gender: v93 },
            }),
            addPanoramaSceneMannequin({
              nodeId: this["id"],
              gender: v93,
              colorKey: v91,
              viewPose: this["_bridge"]?.["readCurrentViewPose"]?.(),
            }),
            this["_closeMenus"]());
        },
      })),
      attachUiStop(this["_mannequinMenuEl"]),
      this["_mannequinMenuEl"]["addEventListener"]("mouseenter", () =>
        this["_openMenu"]("mannequin"),
      ),
      this["_mannequinMenuEl"]["addEventListener"]("mouseleave", () =>
        this["_scheduleMenuHide"]("mannequin"),
      ),
      (this["_gridPanelEl"] = this["_createGridPanel"]()),
      attachUiStop(this["_gridPanelEl"], { wheel: true }),
      this["_gridPanelEl"]["addEventListener"]("mouseenter", () =>
        this["_openMenu"]("grid"),
      ),
      this["_gridPanelEl"]["addEventListener"]("mouseleave", () =>
        this["_scheduleMenuHide"]("grid"),
      ),
      (this["_captureMenuEl"] = this["_createCaptureMenu"]()),
      attachUiStop(this["_captureMenuEl"]),
      this["_captureMenuEl"]["addEventListener"]("mouseenter", () =>
        this["_openMenu"]("capture"),
      ),
      this["_captureMenuEl"]["addEventListener"]("mouseleave", () =>
        this["_scheduleMenuHide"]("capture"),
      ),
      this["_captureMenuEl"]["addEventListener"](
        "click",
        this["_handleCaptureMenuClick"],
      ),
      (this["_focusMenuEl"] = this["_createFocusMenu"]()),
      attachUiStop(this["_focusMenuEl"], { wheel: true }),
      this["_focusMenuEl"]["addEventListener"]("mouseenter", () =>
        this["_openMenu"]("focus"),
      ),
      this["_focusMenuEl"]["addEventListener"]("mouseleave", () =>
        this["_scheduleMenuHide"]("focus"),
      ),
      (this["_statusEl"] = document["createElement"]("div")),
      (this["_statusEl"]["className"] = "panorama-scene-fixed-status"),
      (this["_statusEl"]["style"]["transform"] = "none"),
      (this["_statusContentEl"] = document["createElement"]("div")),
      (this["_statusContentEl"]["className"] =
        "panorama-scene-fixed-status__content"),
      this["_statusEl"]["appendChild"](this["_statusContentEl"]),
      attachUiStop(this["_statusEl"]),
      (this["_errorEl"] = document["createElement"]("div")),
      (this["_errorEl"]["className"] = "panorama-scene-error"),
      attachUiStop(this["_errorEl"]),
      (this["_hintEl"] = document["createElement"]("div")),
      (this["_hintEl"]["className"] = "panorama-scene-fixed-hint"),
      (this["_hintEl"]["style"]["transform"] = "none"),
      (this["_hintContentEl"] = document["createElement"]("div")),
      (this["_hintContentEl"]["className"] =
        "panorama-scene-fixed-hint__content"),
      this["_hintEl"]["appendChild"](this["_hintContentEl"]),
      attachUiStop(this["_hintEl"]),
      (this["_contextMenuEl"] = document["createElement"]("div")),
      (this["_contextMenuEl"]["className"] = "panorama-scene-object-menu"),
      (this["_contextMenuEl"]["hidden"] = true),
      (this["_contextMenuEl"]["innerHTML"] =
        '\n      <button type="button" class="panorama-scene-object-menu__item act-delete-selected">删除对象</button>\n    '),
      attachUiStop(this["_contextMenuEl"]),
      this["_contextMenuEl"]
        ["querySelector"](".act-delete-selected")
        ?.["addEventListener"]("click", () => {
          (this["_contextMenuTarget"]?.["type"] === "camera" &&
          this["_contextMenuTarget"]?.["cameraId"]
            ? deletePanoramaSceneCamera({
                nodeId: this["id"],
                cameraId: this["_contextMenuTarget"]["cameraId"],
              })
            : deleteSelectedPanoramaSceneObject({ nodeId: this["id"] }),
            this["_closeObjectContextMenu"]());
        }),
      (this["_captureSafeFrameEl"] = document["createElement"]("div")),
      (this["_captureSafeFrameEl"]["className"] =
        "panorama-scene-capture-safe-frame"),
      (this["_captureSafeFrameEl"]["hidden"] = true),
      (this["_captureSafeFrameLabelEl"] = document["createElement"]("div")),
      (this["_captureSafeFrameLabelEl"]["className"] =
        "panorama-scene-capture-safe-frame__label"),
      this["_captureSafeFrameEl"]["appendChild"](
        this["_captureSafeFrameLabelEl"],
      ),
      this["_bottomToolbarPopoverLayerEl"]["appendChild"](
        this["_captureMenuEl"],
      ),
      this["_bottomToolbarPopoverLayerEl"]["appendChild"](
        this["_cameraListEl"],
      ),
      this["_bottomToolbarPopoverLayerEl"]["appendChild"](this["_focusMenuEl"]),
      this["_bottomToolbarPopoverLayerEl"]["appendChild"](
        this["_mannequinMenuEl"],
      ),
      this["_bottomToolbarPopoverLayerEl"]["appendChild"](this["_gridPanelEl"]),
      this["_overlayEl"]["appendChild"](this["_captureSafeFrameEl"]),
      this["_overlayEl"]["appendChild"](this["_contextMenuEl"]),
      this["_overlayEl"]["appendChild"](this["_errorEl"]),
      this["_infoDockEl"]["appendChild"](this["_hintEl"]),
      this["_infoDockEl"]["appendChild"](this["_statusEl"]),
      this["_shellEl"]["appendChild"](this["_viewportEl"]),
      this["_shellEl"]["appendChild"](this["_overlayEl"]),
      this["_shellEl"]["appendChild"](this["_cornerToolbarEl"]),
      this["_shellEl"]["appendChild"](this["_infoDockEl"]),
      this["_shellEl"]["appendChild"](this["_bottomToolbarAnchorEl"]),
      this["el"]["appendChild"](this["_sceneToolbarEl"]),
      this["el"]["appendChild"](this["_editToolbarEl"]),
      (this["_browserFullscreenAnchorEl"] = document["createElement"]("div")),
      (this["_browserFullscreenAnchorEl"]["className"] =
        "panorama-scene-browser-fullscreen-anchor"),
      (this["_browserFullscreenAnchorEl"]["hidden"] = true),
      this["el"]["appendChild"](this["_browserFullscreenAnchorEl"]),
      this["el"]["appendChild"](this["_shellEl"]),
      this["el"]["addEventListener"](
        "pointerenter",
        this["_handleNodePointerEnter"],
      ),
      this["el"]["addEventListener"](
        "pointerleave",
        this["_handleNodePointerLeave"],
      ),
      (this["_fileInput"] = document["createElement"]("input")),
      (this["_fileInput"]["className"] = "panorama-scene-file-input"),
      (this["_fileInput"]["type"] = "file"),
      (this["_fileInput"]["accept"] = "image/*"),
      (this["_fileInput"]["style"]["display"] = "none"),
      this["_fileInput"]["addEventListener"](
        "change",
        this["_handleFileInputChange"],
      ),
      this["el"]["appendChild"](this["_fileInput"]),
      (this["_bridge"] = new PanoramaScene3DBridge({
        container: this["_viewportEl"],
        onPanoramaStatusChange: ({ isLoaded: v94, error: v95 }) => {
          updatePanoramaSceneLoadState({
            nodeId: this["id"],
            isLoaded: v94,
            error: v95,
          });
        },
      })),
      this["_bridge"]["setDefaultSceneFocalLength"]?.(
        this["_defaultSceneFocalLength"],
      ),
      (this["_interaction"] = new PanoramaSceneInteraction({
        viewportEl: this["_viewportEl"],
        overlayEl: this["_overlayEl"],
        bridge: this["_bridge"],
        getSceneState: () =>
          getPanoramaSceneState(appStore["getStateRaw"]()["nodes"][this["id"]]),
        onViewCommit: (v96) => {
          applyPanoramaSceneViewCommit({ nodeId: this["id"], ...v96 });
        },
        onObjectCommit: ({ objectType: v97, objectId: v98, pose: v99 }) => {
          updatePanoramaSceneObjectTransform({
            nodeId: this["id"],
            objectType: v97,
            objectId: v98,
            pose: v99,
          });
        },
        onSelectionChange: (v100, v101) => {
          (this["_selectNodeOnCanvas"](),
            setPanoramaSceneSelection({
              nodeId: this["id"],
              objectType: v100,
              objectId: v101,
            }));
        },
        onSelectionBatchChange: (v102, v103, v104 = null) => {
          (this["_selectNodeOnCanvas"](),
            setPanoramaSceneSelectionBatch({
              nodeId: this["id"],
              objectType: v102,
              objectIds: v103,
              groupId: v104,
            }));
        },
        onSelectionObjectsChange: (v105, v106 = {}) => {
          (this["_selectNodeOnCanvas"](),
            setPanoramaSceneSelectionObjects({
              nodeId: this["id"],
              objects: v105,
              activeObjectType: v106["activeObjectType"] || null,
              activeObjectId: v106["activeObjectId"] || null,
              groupId: v106["groupId"] || null,
            }));
        },
        onSelectionClear: () => {
          clearPanoramaSceneSelection({ nodeId: this["id"] });
        },
        onObjectBatchCommit: ({ targets: v107 }) => {
          updatePanoramaSceneObjectTransform({
            nodeId: this["id"],
            targets: v107,
          });
        },
      })),
      this["_interaction"]["attach"](),
      (this["_resizeObserver"] = new ResizeObserver((v108) => {
        const v109 = v108?.[0]?.["contentRect"];
        (this["_bridge"]?.["resize"](v109?.["width"], v109?.["height"]),
          this["_positionMenus"]());
      })),
      this["_resizeObserver"]["observe"](this["_viewportEl"]),
      (this["_unsubscribeSelection"] = appStore["subscribeSelector"](
        (v110) => {
          const v111 = Array["isArray"](v110["selectedNodeIds"])
            ? v110["selectedNodeIds"]
            : [];
          return v111["includes"](this["id"]);
        },
        (v112) => {
          const v113 = this["_isSelected"] === true,
            v114 = v112 === true;
          ((this["_isSelected"] = v114),
            v113 &&
              !v114 &&
              this["_sceneState"]?.["ui"]?.["isEditing"] === true &&
              this["_exitEditing"](),
            this["_syncAttachedUiVisibility"](
              this["_shouldShowBottomToolbar"](),
            ));
        },
      )),
      (this["_unsubscribeViewport"] = appStore["subscribeSelector"](
        (v115) => {
          const v116 = v115["viewport"] || { x: 0, y: 0, zoom: 1 };
          return (
            (v116["x"] || 0) +
            "|" +
            (v116["y"] || 0) +
            "|" +
            (v116["zoom"] || 1)
          );
        },
        () => {
          this["_positionMenus"]();
        },
      )),
      this["_isPanorama360"] &&
        (this["_unsubscribePanoramaIncomingSync"] = appStore[
          "subscribeSelector"
        ](
          (v117) => this["_buildPanorama360IncomingImageSignature"](v117),
          () => {
            syncPanorama360FromIncomingImageEdge({ nodeId: this["id"] });
          },
        )),
      window["addEventListener"]("resize", this["_handleWindowResize"]),
      window["addEventListener"](
        "pointerdown",
        this["_handleGlobalPointerDown"],
        true,
      ),
      window["addEventListener"]("keydown", this["_handleWindowKeyDown"], true),
      window["addEventListener"](
        "shortcuts-updated",
        this["_handleShortcutsUpdated"],
      ),
      window["addEventListener"](
        "panorama-scene:camera-shortcut",
        this["_handleCameraShortcutEvent"],
      ),
      window["addEventListener"](
        "panorama-scene:capture-shortcut",
        this["_handleCaptureShortcutEvent"],
      ),
      this["update"](this["_data"]),
      this["_isPanorama360"] &&
        syncPanorama360FromIncomingImageEdge({ nodeId: this["id"] }),
      this["el"]
    );
  }
  ["_handleShortcutsUpdated"]() {
    this["_syncToolbarState"]();
  }
  ["_resolveCameraBySlot"](v118) {
    const v119 = normalizeCameraSlot(v118);
    if (!v119) return null;
    const v120 = resolveCameraSlotEntries(
        this["_sceneState"]?.["cameras"] || [],
      ),
      v121 = v120["find"]((v122) => v122["slot"] === v119);
    return v121 ? { ...v121 } : null;
  }
  ["_cancelCameraJumpAnimation"]({ clearDraft: clearDraft = true } = {}) {
    ((this["_cameraJumpToken"] += 1),
      this["_cameraJumpRaf"] &&
        (cancelAnimationFrame(this["_cameraJumpRaf"]),
        (this["_cameraJumpRaf"] = 0)),
      this["_pendingCameraJumpReleaseRaf"] &&
        (cancelAnimationFrame(this["_pendingCameraJumpReleaseRaf"]),
        (this["_pendingCameraJumpReleaseRaf"] = 0)),
      (this["_pendingCameraJumpCommit"] = null),
      clearDraft && this["_bridge"]?.["clearDraftView"]?.());
  }
  ["_setDefaultSceneFocalLength"](v123) {
    const v124 = Math["max"](
      SCENE_FOCAL_LENGTH_MIN_MM,
      Math["min"](
        SCENE_FOCAL_LENGTH_MAX_MM,
        Number(v123) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
      ),
    );
    ((this["_defaultSceneFocalLength"] = v124),
      this["_bridge"]?.["setDefaultSceneFocalLength"]?.(v124));
  }
  ["_getDefaultSceneFocalLength"]() {
    return (
      this["_bridge"]?.["getDefaultSceneFocalLength"]?.() ||
      this["_defaultSceneFocalLength"] ||
      SCENE_DEFAULT_FOCAL_LENGTH_MM
    );
  }
  ["_isDefaultSceneView"](v125) {
    const v126 = createDefaultSceneView();
    return (
      Math["abs"](
        (Number(v125?.["target"]?.["x"]) || 0) - v126["target"]["x"],
      ) < 1e-9 &&
      Math["abs"](
        (Number(v125?.["target"]?.["y"]) || 0) - v126["target"]["y"],
      ) < 1e-9 &&
      Math["abs"](
        (Number(v125?.["target"]?.["z"]) || 0) - v126["target"]["z"],
      ) < 1e-9 &&
      Math["abs"]((Number(v125?.["orbitYaw"]) || 0) - v126["orbitYaw"]) <
        1e-9 &&
      Math["abs"]((Number(v125?.["orbitPitch"]) || 0) - v126["orbitPitch"]) <
        1e-9 &&
      Math["abs"](
        (Number(v125?.["orbitDistance"]) || 0) - v126["orbitDistance"],
      ) < 1e-9
    );
  }
  ["_maybeReleasePendingCameraJumpDraft"]() {
    const v127 = this["_pendingCameraJumpCommit"];
    if (!v127 || this["_pendingCameraJumpReleaseRaf"]) return;
    const v128 = this["_sceneState"]?.["viewport"]?.["sceneView"] || null,
      v129 = this["_getDefaultSceneFocalLength"]();
    if (!areSceneViewsEquivalent(v128, v127["targetSceneView"])) return;
    if (Math["abs"](v129 - v127["targetFocalLength"]) > 0.000001) return;
    const v130 = v127["token"];
    this["_pendingCameraJumpReleaseRaf"] = requestAnimationFrame(() => {
      this["_pendingCameraJumpReleaseRaf"] = 0;
      const v131 = this["_pendingCameraJumpCommit"];
      if (!v131 || v131["token"] !== v130) return;
      const v132 = this["_sceneState"]?.["viewport"]?.["sceneView"] || null,
        v133 = this["_getDefaultSceneFocalLength"]();
      if (!areSceneViewsEquivalent(v132, v131["targetSceneView"])) return;
      if (Math["abs"](v133 - v131["targetFocalLength"]) > 0.000001) return;
      ((this["_pendingCameraJumpCommit"] = null),
        this["_bridge"]?.["clearDraftView"]?.());
    });
  }
  ["_maybePreloadCharacterModels"](v134 = null) {
    if (this["_isPanorama360"]) return;
    if (this["_hasRequestedCharacterPreload"]) return;
    const v135 = this["_sceneState"]?.["ui"]?.["isEditing"] === true,
      v136 = v134?.["ui"]?.["isEditing"] === true;
    if (!v135 || v136) return;
    ((this["_hasRequestedCharacterPreload"] = true),
      void preloadPanoramaCharacterModels()["catch"](() => {}));
  }
  ["_commitCameraJumpTarget"]({
    targetPose: v137,
    referenceSceneView: v138,
    targetFocalLength: v139,
  }) {
    const v140 = cameraPoseToSceneViewFromReference(v137, v138);
    return (
      (this["_pendingCameraJumpCommit"] = {
        token: this["_cameraJumpToken"],
        targetSceneView: v140,
        targetFocalLength: v139,
      }),
      this["_setDefaultSceneFocalLength"](v139),
      applyPanoramaSceneViewCommit({
        nodeId: this["id"],
        sceneView: v140,
        activeView: "default",
        activeCameraId: null,
      }),
      v140
    );
  }
  ["_animateCameraActivation"](v141) {
    if (!this["_supportsCameraFeatures"]()) return;
    const v142 =
      (this["_sceneState"]?.["cameras"] || [])["find"](
        (v143) => v143["id"] === v141,
      ) || null;
    if (!v142 || this["_sceneState"]?.["mode"] !== "scene") return;
    const v144 = (v145) => {
        const v146 = v145?.["quaternion"];
        if (
          Number["isFinite"](Number(v146?.["x"])) &&
          Number["isFinite"](Number(v146?.["y"])) &&
          Number["isFinite"](Number(v146?.["z"])) &&
          Number["isFinite"](Number(v146?.["w"]))
        )
          return new threeRuntime["Quaternion"](
            Number(v146["x"]),
            Number(v146["y"]),
            Number(v146["z"]),
            Number(v146["w"]),
          )["normalize"]();
        const v147 = v145?.["rotation"] || { x: 0, y: 0, z: 0 };
        return new threeRuntime["Quaternion"]()["setFromEuler"](
          new threeRuntime["Euler"](
            Number(v147["x"]) || 0,
            Number(v147["y"]) || 0,
            Number(v147["z"]) || 0,
            "YXZ",
          ),
        );
      },
      v148 = v144(v142),
      v149 =
        this["_sceneState"]?.["viewport"]?.["sceneView"] ||
        createDefaultSceneView(),
      v150 = {
        kind: "camera",
        position: cloneVector3(v142["position"]),
        quaternion: { x: v148["x"], y: v148["y"], z: v148["z"], w: v148["w"] },
        rotation: v142["rotation"] || quaternionToRotation(v148),
      },
      v151 = Number["isFinite"](Number(v142?.["focalLength"]))
        ? Number(v142["focalLength"])
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
      v152 = focalLengthToFov(v151);
    ((v150["fov"] = v152),
      this["_cancelCameraJumpAnimation"]({ clearDraft: false }));
    const v153 = this["_bridge"]?.["readCurrentViewPose"]?.();
    if (!v153?.["position"]) {
      this["_commitCameraJumpTarget"]({
        targetPose: v150,
        referenceSceneView: v149,
        targetFocalLength: v151,
      });
      return;
    }
    const v154 = this["_cameraJumpToken"],
      v155 = v144(v153),
      v156 = {
        kind: "camera",
        position: cloneVector3(v153["position"]),
        quaternion: { x: v155["x"], y: v155["y"], z: v155["z"], w: v155["w"] },
        rotation: v153["rotation"] || quaternionToRotation(v155),
        fov: Number["isFinite"](Number(v153["fov"])) ? Number(v153["fov"]) : 58,
      },
      v157 = 450,
      v158 = performance["now"](),
      v159 = (v160) => {
        const v161 = interpolateVector3(
            v156["position"],
            v150["position"],
            v160,
          ),
          v162 = new threeRuntime["Quaternion"](
            v156["quaternion"]["x"],
            v156["quaternion"]["y"],
            v156["quaternion"]["z"],
            v156["quaternion"]["w"],
          )["slerp"](
            new threeRuntime["Quaternion"](
              v150["quaternion"]["x"],
              v150["quaternion"]["y"],
              v150["quaternion"]["z"],
              v150["quaternion"]["w"],
            ),
            v160,
          ),
          v163 = lerp(v156["fov"], v150["fov"], v160);
        this["_bridge"]?.["setDraftView"]?.({
          kind: "camera",
          position: v161,
          quaternion: {
            x: v162["x"],
            y: v162["y"],
            z: v162["z"],
            w: v162["w"],
          },
          rotation: quaternionToRotation(v162),
          fov: v163,
          disableSmoothing: true,
        });
      };
    v159(0);
    const v164 = (v165) => {
      if (v154 !== this["_cameraJumpToken"]) return;
      const v166 = Math["max"](0, v165 - v158),
        v167 = Math["min"](1, v166 / v157),
        v168 = smootherstep(v167);
      v159(v168);
      if (v167 < 1) {
        this["_cameraJumpRaf"] = requestAnimationFrame(v164);
        return;
      }
      ((this["_cameraJumpRaf"] = 0),
        this["_commitCameraJumpTarget"]({
          targetPose: v150,
          referenceSceneView: v149,
          targetFocalLength: v151,
        }),
        this["_maybeReleasePendingCameraJumpDraft"]());
    };
    this["_cameraJumpRaf"] = requestAnimationFrame(v164);
  }
  ["_saveCurrentViewToCameraSlot"](v169) {
    if (!this["_supportsCameraFeatures"]()) return;
    const v170 = this["_bridge"]?.["readCurrentViewPose"]?.();
    if (!v170) return;
    upsertPanoramaSceneCameraAtSlot({
      nodeId: this["id"],
      slot: v169,
      viewPose: v170,
    });
  }
  ["_handleCameraShortcutEvent"](v171) {
    if (!this["_supportsCameraFeatures"]()) return;
    const v172 = v171?.["detail"] || {};
    if (v172["nodeId"] !== this["id"]) return;
    if (!this["_isEditing"]()) return;
    const v173 = normalizeCameraSlot(v172["slot"]);
    if (!v173) return;
    if (v172["mode"] === "save") {
      this["_saveCurrentViewToCameraSlot"](v173);
      return;
    }
    const v174 = this["_resolveCameraBySlot"](v173);
    if (!v174?.["camera"]?.["id"]) return;
    this["_animateCameraActivation"](v174["camera"]["id"]);
  }
  ["_handleCaptureShortcutEvent"](v175) {
    const v176 = v175?.["detail"] || {};
    if (v176["nodeId"] !== this["id"]) return;
    if (!this["_isEditing"]()) return;
    void this["_handleToolbarAction"]("capture");
  }
  ["_createCaptureMenu"]() {
    const v177 = document["createElement"]("div");
    return (
      (v177["className"] = "panorama-capture-menu"),
      (v177["hidden"] = true),
      (v177["innerHTML"] =
        "\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22panorama-capture-menu__grid\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20" +
        PANORAMA_CAPTURE_MODE_OPTIONS["map"](
          (v178) =>
            '\n            <button\n              type="button"\n              class="panorama-capture-menu__item"\n              data-capture-mode="' +
            v178["key"] +
            '"\n              aria-label="截图比例 ' +
            v178["label"] +
            '"\n            >\n              <span class="panorama-capture-menu__icon ' +
            v178["iconClass"] +
            '" aria-hidden="true">\n                <span class="panorama-capture-menu__icon-shape"></span>\n              </span>\n              <span class="panorama-capture-menu__label">' +
            v178["label"] +
            "</span>\n            </button>\n          ",
        )["join"]("") +
        "\n      </div>\n    "),
      v177
    );
  }
  ["_handleCaptureMenuClick"](v179) {
    const v180 = v179["target"]?.["closest"]?.("[data-capture-mode]");
    if (!(v180 instanceof HTMLButtonElement)) return;
    const v181 = v180["dataset"]["captureMode"] || "adaptive";
    (this["_selectNodeOnCanvas"](),
      setPanoramaSceneCaptureMode({
        nodeId: this["id"],
        mode: v181,
        showSafeFrame: v181 !== "adaptive",
      }));
  }
  ["_createFocusMenu"]() {
    const v182 = document["createElement"]("div");
    ((v182["className"] = "panorama-scene-focus-menu"),
      (v182["hidden"] = true));
    const v183 = document["createElement"]("div");
    ((v183["className"] = "panorama-scene-focus-menu__header"),
      (v183["textContent"] = "焦距"));
    const v184 = document["createElement"]("span");
    ((v184["className"] = "panorama-scene-focus-menu__value"),
      v183["appendChild"](v184));
    const v185 = document["createElement"]("input");
    ((v185["className"] = "panorama-scene-focus-menu__slider"),
      (v185["type"] = "range"),
      (v185["min"] = String(SCENE_FOCAL_LENGTH_MIN_MM)),
      (v185["max"] = String(SCENE_FOCAL_LENGTH_MAX_MM)),
      (v185["step"] = "1"),
      v185["setAttribute"]("aria-label", "当前镜头焦距"));
    const v186 = () => {
      const v187 = Math["max"](
        SCENE_FOCAL_LENGTH_MIN_MM,
        Math["min"](
          SCENE_FOCAL_LENGTH_MAX_MM,
          Number(this["_getDefaultSceneFocalLength"]()) ||
            SCENE_DEFAULT_FOCAL_LENGTH_MM,
        ),
      );
      ((v185["value"] = String(v187)),
        (v184["textContent"] = String(Math["round"](v187))));
    };
    return (
      v185["addEventListener"]("input", (v188) => {
        const v189 = Math["max"](
          SCENE_FOCAL_LENGTH_MIN_MM,
          Math["min"](
            SCENE_FOCAL_LENGTH_MAX_MM,
            Number(v188["currentTarget"]?.["value"]) ||
              SCENE_DEFAULT_FOCAL_LENGTH_MM,
          ),
        );
        ((v184["textContent"] = String(Math["round"](v189))),
          this["_setDefaultSceneFocalLength"](v189));
      }),
      v182["appendChild"](v183),
      v182["appendChild"](v185),
      (v182["_syncValue"] = v186),
      v186(),
      v182
    );
  }
  ["_resolveCaptureMode"]() {
    return normalizeCaptureMode(this["_sceneState"]?.["capture"]?.["mode"]);
  }
  ["_resolveCaptureFrameRect"]() {
    const v190 = this["_viewportEl"]?.["clientWidth"] || 0,
      v191 = this["_viewportEl"]?.["clientHeight"] || 0;
    return computeCaptureFrameRect(v190, v191, this["_resolveCaptureMode"]());
  }
  ["_syncCaptureMenuState"]() {
    if (!this["_captureMenuEl"]) return;
    const v192 = this["_resolveCaptureMode"]();
    this["_captureMenuEl"]
      ["querySelectorAll"]("[data-capture-mode]")
      ["forEach"]((v193) => {
        const v194 = v193["dataset"]["captureMode"] === v192;
        (v193["classList"]["toggle"]("is-active", v194),
          v193["setAttribute"]("aria-pressed", v194 ? "true" : "false"));
      });
  }
  ["_syncCaptureSafeFrame"]() {
    if (!this["_captureSafeFrameEl"] || !this["_captureSafeFrameLabelEl"])
      return;
    const v195 = this["_resolveCaptureMode"](),
      v196 =
        this["_isEditing"]() &&
        this["_isNodeSelected"]() &&
        v195 !== "adaptive" &&
        this["_sceneState"]?.["capture"]?.["showSafeFrame"] === true;
    ((this["_captureSafeFrameEl"]["hidden"] = !v196),
      this["_captureSafeFrameEl"]["classList"]["toggle"]("is-visible", v196),
      this["_captureSafeFrameEl"]["classList"]["toggle"](
        "is-adaptive",
        v195 === "adaptive",
      ));
    if (!v196) return;
    const v197 = this["_resolveCaptureFrameRect"]();
    ((this["_captureSafeFrameEl"]["style"]["left"] = v197["x"] + "px"),
      (this["_captureSafeFrameEl"]["style"]["top"] = v197["y"] + "px"),
      (this["_captureSafeFrameEl"]["style"]["width"] = v197["width"] + "px"),
      (this["_captureSafeFrameEl"]["style"]["height"] = v197["height"] + "px"),
      (this["_captureSafeFrameLabelEl"]["textContent"] =
        getCaptureModeMeta(v195)["label"]));
  }
  async ["_captureViewportByCurrentMode"]() {
    const v198 = await this["_bridge"]?.["captureBlob"]?.({
      includeEditorOverlays: false,
    });
    if (!v198) return null;
    return cropCaptureBlobToFrame({
      blob: v198,
      viewportWidth: this["_viewportEl"]?.["clientWidth"] || 0,
      viewportHeight: this["_viewportEl"]?.["clientHeight"] || 0,
      mode: this["_resolveCaptureMode"](),
    });
  }
  ["_createGridPanel"]() {
    const v199 = document["createElement"]("div");
    ((v199["className"] = "panorama-grid-panel"),
      (v199["innerHTML"] =
        '\n      <div class="panorama-grid-panel__title">矩形排列</div>\n      <div class="panorama-grid-panel__metrics-row">\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label">行</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="rows" role="spinbutton" aria-label="行数" aria-valuenow="1" tabindex="0">1</div>\n          </div>\n        </label>\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label">列</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="cols" role="spinbutton" aria-label="列数" aria-valuenow="1" tabindex="0">1</div>\n          </div>\n        </label>\n      </div>\n      <div class="panorama-grid-panel__metrics-row">\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label">间距X</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="spacingX" role="spinbutton" aria-label="间距X（米）" aria-valuenow="1.0" tabindex="0">1.0</div>\n          </div>\n        </label>\n        <label class="panorama-grid-panel__metric-item">\n          <span class="panorama-grid-panel__metric-label">间距Z</span>\n          <div class="panorama-grid-panel__metric-control rh-stepper">\n            <div class="rh-stepper-value panorama-grid-panel__metric-stepper" data-grid-field="spacingZ" role="spinbutton" aria-label="间距Z（米）" aria-valuenow="1.0" tabindex="0">1.0</div>\n          </div>\n        </label>\n      </div>\n      <div class="panorama-grid-panel__appearance-row">\n        <div class="panorama-grid-panel__appearance-group panorama-grid-panel__appearance-group--gender">\n          <span class="panorama-grid-panel__appearance-label">性别</span>\n          <div class="panorama-grid-panel__appearance-options panorama-grid-panel__appearance-options--gender">\n            ' +
        PANORAMA_MANNEQUIN_GENDER_OPTIONS["map"](
          ([v200, v201, v202]) =>
            '<button type="button" class="panorama-mannequin-menu__gender-btn" data-grid-gender="' +
            v200 +
            '" aria-label="设置' +
            v201 +
            "性别\x22>" +
            v202 +
            "</button>",
        )["join"]("") +
        '\n          </div>\n        </div>\n        <div class="panorama-grid-panel__appearance-group panorama-grid-panel__appearance-group--color">\n          <span class="panorama-grid-panel__appearance-label">颜色</span>\n          <div class="panorama-grid-panel__appearance-options panorama-grid-panel__appearance-options--color">\n            ' +
        PANORAMA_MANNEQUIN_COLOR_OPTIONS["map"](
          ([v203, v204]) =>
            '<button type="button" class="panorama-mannequin-menu__color-btn" data-grid-color="' +
            v203 +
            '" aria-label="设置' +
            v204 +
            '色"></button>',
        )["join"]("") +
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22panorama-grid-panel__apply\x22>创建排列</button>\x0a\x20\x20\x20\x20"));
    const v205 = {
        rows: { min: 1, max: 12, step: 1, precision: 0 },
        cols: { min: 1, max: 12, step: 1, precision: 0 },
        spacingX: { min: 0.5, max: 8, step: 0.1, precision: 1 },
        spacingZ: { min: 0.5, max: 8, step: 0.1, precision: 1 },
      },
      v206 = (v207, v208) => {
        const v209 = v205[v207];
        if (!v209) return null;
        const v210 = Number(v208);
        if (!Number["isFinite"](v210)) return null;
        const v211 = Math["min"](v209["max"], Math["max"](v209["min"], v210));
        if (v209["precision"] === 0) return Math["round"](v211);
        return Number(v211["toFixed"](v209["precision"]));
      },
      v212 = (v213, v214) => {
        const v215 = v205[v213];
        if (!v215 || !Number["isFinite"](Number(v214))) return "";
        return v215["precision"] === 0
          ? String(Math["round"](Number(v214)))
          : Number(v214)["toFixed"](v215["precision"]);
      },
      v216 = (v217, v218, v219) => {
        if (!v217) return;
        const v220 = v212(v218, v219);
        v217["tagName"] === "INPUT"
          ? (v217["value"] = v220)
          : ((v217["textContent"] = v220),
            v217["setAttribute"]("aria-valuenow", String(v219)));
      },
      v221 = (v222, v223) => {
        const v224 = v206(v222, v223);
        if (!Number["isFinite"](v224)) return;
        setPanoramaSceneGridPlacement({
          nodeId: this["id"],
          patch: { [v222]: v224 },
        });
        const v225 = v199["querySelector"](
          "[data-grid-field=\x22" + v222 + "\x22]",
        );
        v216(v225, v222, v224);
      };
    return (
      Object["keys"](v205)["forEach"]((v226) => {
        const v227 = v205[v226],
          v228 = v199["querySelector"](
            "[data-grid-field=\x22" + v226 + "\x22]",
          );
        if (!v228) return;
        let v229 = null,
          v230 = false;
        const v231 = () => {
            const v232 = v206(
              v226,
              this["_sceneState"]?.["gridPlacement"]?.[v226],
            );
            if (Number["isFinite"](v232)) return v232;
            const v233 = v206(v226, v228["getAttribute"]("aria-valuenow"));
            if (Number["isFinite"](v233)) return v233;
            return v227["min"];
          },
          v234 = (v235) => {
            if (!v229) return;
            const v236 = v235["clientX"] - v229["x"];
            if (!v229["moved"] && Math["abs"](v236) >= 3) v229["moved"] = true;
            const v237 = Math["trunc"](v236 / 6),
              v238 = v229["v"] + v237 * v227["step"];
            if (v238 === v229["last"]) return;
            ((v229["last"] = v238), v221(v226, v238));
          },
          v239 = () => {
            if (!v229) return;
            const v240 = v229["moved"];
            (v229["el"]["classList"]["remove"]("is-dragging"),
              document["removeEventListener"]("mousemove", v234),
              document["removeEventListener"]("mouseup", v239),
              v240 && ((v230 = true), (this["_suppressDocClickOnce"] = true)),
              (v229 = null));
          },
          v241 = (v242) => {
            const v243 = v231(),
              v244 = document["createElement"]("input");
            ((v244["className"] =
              "rh-stepper-input panorama-grid-panel__metric-stepper-input"),
              (v244["type"] = "number"),
              (v244["step"] = String(v227["step"])),
              (v244["min"] = String(v227["min"])),
              (v244["max"] = String(v227["max"])),
              (v244["value"] = v212(v226, v243)),
              v242["replaceWith"](v244),
              v244["focus"](),
              v244["select"]());
            const v245 = (v246) => {
              const v247 = v246 ? v244["value"] : v243,
                v248 = v206(v226, v247),
                v249 = Number["isFinite"](v248) ? v248 : v243,
                v250 = document["createElement"]("div");
              ((v250["className"] =
                "rh-stepper-value panorama-grid-panel__metric-stepper"),
                (v250["dataset"]["gridField"] = v226),
                v250["setAttribute"]("role", "spinbutton"),
                v250["setAttribute"]("tabindex", "0"));
              const v251 = v242["getAttribute"]("aria-label") || v226;
              (v250["setAttribute"]("aria-label", v251),
                v250["setAttribute"]("aria-valuenow", String(v249)),
                (v250["textContent"] = v212(v226, v249)),
                v244["replaceWith"](v250),
                v246 ? v221(v226, v249) : v216(v250, v226, v249),
                v252(v250));
            };
            ((v244["onkeydown"] = (v253) => {
              if (v253["key"] === "Enter") v245(true);
              if (v253["key"] === "Escape") v245(false);
            }),
              (v244["onblur"] = () => v245(true)));
          },
          v252 = (v254) => {
            ((v254["onclick"] = (v255) => {
              v255["stopPropagation"]();
              if (v230) {
                v230 = false;
                return;
              }
              v241(v254);
            }),
              (v254["onkeydown"] = (v256) => {
                const v257 =
                  v256["key"] === "ArrowRight"
                    ? 1
                    : v256["key"] === "ArrowLeft"
                      ? -1
                      : 0;
                if (v257) {
                  (v256["preventDefault"](), v256["stopPropagation"]());
                  const v258 = v231();
                  v221(v226, v258 + v257 * v227["step"]);
                  return;
                }
                (v256["key"] === "Enter" || v256["key"] === "\x20") &&
                  (v256["preventDefault"](),
                  v256["stopPropagation"](),
                  v241(v254));
              }),
              (v254["onmousedown"] = (v259) => {
                if (v259["button"] !== 0) return;
                (v259["preventDefault"](), (v230 = false));
                const v260 = v231();
                ((v229 = {
                  x: v259["clientX"],
                  v: v260,
                  moved: false,
                  last: v260,
                  el: v254,
                }),
                  v254["classList"]["add"]("is-dragging"),
                  document["addEventListener"]("mousemove", v234),
                  document["addEventListener"]("mouseup", v239));
              }));
          };
        v252(v228);
      }),
      v199["querySelectorAll"]("[data-grid-gender]")["forEach"]((v261) => {
        v261["addEventListener"]("click", () => {
          const v262 =
            v261["dataset"]["gridGender"] === "female" ? "female" : "male";
          setPanoramaSceneGridPlacement({
            nodeId: this["id"],
            patch: { gender: v262 },
          });
        });
      }),
      v199["querySelectorAll"]("[data-grid-color]")["forEach"]((v263) => {
        v263["addEventListener"]("click", () => {
          const v264 = v263["dataset"]["gridColor"] || "blue";
          setPanoramaSceneGridPlacement({
            nodeId: this["id"],
            patch: { colorKey: v264 },
          });
        });
      }),
      v199["querySelector"](".panorama-grid-panel__apply")?.[
        "addEventListener"
      ]("click", () => {
        (this["_selectNodeOnCanvas"](),
          addPanoramaSceneMannequinGrid({
            nodeId: this["id"],
            viewPose: this["_bridge"]?.["readCurrentViewPose"]?.(),
          }),
          (this["_openMenuKey"] = null),
          this["_syncOverlayState"]());
      }),
      v199
    );
  }
  ["_isNodeSelected"]() {
    return this["_isSelected"] === true;
  }
  ["_handleWindowResize"]() {
    (this["_positionMenus"](), this["_syncCaptureSafeFrame"]());
  }
  ["_isBrowserFullscreen"]() {
    return !!this["_browserFullscreenOverlayEl"];
  }
  async ["_enterBrowserFullscreen"]() {
    if (this["_isBrowserFullscreen"]() || !this["_shellEl"]) return;
    const v265 = document["createElement"]("div");
    v265["className"] = "panorama-scene-browser-fullscreen";
    const v266 = document["createElement"]("button");
    ((v266["type"] = "button"),
      (v266["className"] = "panorama-scene-browser-fullscreen__exit"),
      (v266["textContent"] = "退出全屏"),
      v266["addEventListener"]("click", () => {
        void this["_exitBrowserFullscreen"]();
      }),
      v265["appendChild"](v266),
      v265["appendChild"](this["_shellEl"]),
      document["body"]["appendChild"](v265),
      (this["_browserFullscreenOverlayEl"] = v265),
      this["_syncToolbarState"](),
      this["_syncOverlayState"](),
      this["_positionMenus"](),
      this["_bridge"]?.["resize"]());
  }
  async ["_exitBrowserFullscreen"]({ skipSync: skipSync = false } = {}) {
    if (!this["_isBrowserFullscreen"]()) return;
    const v267 = this["_browserFullscreenOverlayEl"];
    this["_browserFullscreenOverlayEl"] = null;
    this["_shellEl"] &&
      this["el"]?.["isConnected"] &&
      (this["_browserFullscreenAnchorEl"]?.["parentElement"] === this["el"]
        ? this["el"]["insertBefore"](
            this["_shellEl"],
            this["_browserFullscreenAnchorEl"]["nextSibling"],
          )
        : this["el"]["appendChild"](this["_shellEl"]));
    v267?.["remove"]?.();
    if (skipSync) return;
    (this["_syncToolbarState"](),
      this["_syncOverlayState"](),
      this["_positionMenus"](),
      this["_bridge"]?.["resize"]());
  }
  ["_handleWindowKeyDown"](v268) {
    if (v268["defaultPrevented"]) return;
    if (v268["key"] === "Escape" && this["_isBrowserFullscreen"]()) {
      (v268["preventDefault"](),
        v268["stopPropagation"](),
        v268["stopImmediatePropagation"]?.(),
        void this["_exitBrowserFullscreen"]());
      return;
    }
    if (!this["_isEditing"]()) return;
    const v269 = v268["target"],
      v270 = resolvePanoramaSceneHistoryShortcutAction(v268);
    if (
      v270 &&
      v269 instanceof HTMLElement &&
      (this["el"]?.["contains"]?.(v269) ||
        this["_browserFullscreenOverlayEl"]?.["contains"]?.(v269))
    ) {
      (v268["preventDefault"](),
        v268["stopPropagation"](),
        v268["stopImmediatePropagation"]?.(),
        window["dispatchEvent"](
          new CustomEvent("shortcut-action", { detail: v270 }),
        ));
      return;
    }
    if (
      v269 instanceof HTMLElement &&
      (v269["isContentEditable"] ||
        v269["tagName"] === "INPUT" ||
        v269["tagName"] === "TEXTAREA" ||
        v269["tagName"] === "SELECT")
    )
      return;
    if (v268["key"] === "Delete" || v268["key"] === "Backspace") {
      (v268["preventDefault"](),
        v268["stopPropagation"](),
        v268["stopImmediatePropagation"]?.(),
        deleteSelectedPanoramaSceneObject({ nodeId: this["id"] }));
      return;
    }
    if (
      !v268["repeat"] &&
      !v268["ctrlKey"] &&
      !v268["metaKey"] &&
      !v268["altKey"] &&
      (v268["key"] === "v" || v268["key"] === "V")
    ) {
      (v268["preventDefault"](),
        v268["stopPropagation"](),
        v268["stopImmediatePropagation"]?.(),
        this["_toggleMouseTool"]());
      return;
    }
  }
  ["_syncAttachedUiVisibility"](v271) {
    this["_bottomToolbarAnchorEl"] &&
      (this["_bottomToolbarAnchorEl"]["hidden"] = !v271);
    const v272 = this["_isNodeSelected"]() || this["_isNodeHovered"];
    this["_infoDockEl"] && (this["_infoDockEl"]["hidden"] = !v272);
  }
  ["_handleNodePointerEnter"]() {
    ((this["_isNodeHovered"] = true),
      this["_syncAttachedUiVisibility"](this["_shouldShowBottomToolbar"]()));
  }
  ["_handleNodePointerLeave"](v273) {
    const v274 = v273["relatedTarget"];
    if (v274 && this["el"]["contains"](v274)) return;
    ((this["_isNodeHovered"] = false),
      this["_closeObjectContextMenu"](),
      this["_syncAttachedUiVisibility"](this["_shouldShowBottomToolbar"]()));
  }
  ["_selectNodeOnCanvas"]({
    preserveExistingSelection: preserveExistingSelection = false,
  } = {}) {
    const v275 = appStore["getStateRaw"]()["selectedNodeIds"] || [];
    if (preserveExistingSelection && v275["includes"](this["id"])) return;
    if (v275["length"] === 1 && v275[0] === this["id"]) return;
    appStore["setSelectedNodes"]([this["id"]]);
  }
  ["_isEditing"]() {
    return (
      this["_sceneState"]?.["ui"]?.["isEditing"] === true &&
      this["_data"]?.["isCollapsed"] !== true
    );
  }
  ["_shouldShowBottomToolbar"]() {
    const v276 = this["_isNodeSelected"]();
    return this["_isEditing"]() && v276;
  }
  ["_resolveMouseTool"]() {
    return (
      this["_sceneState"]?.["ui"]?.["mouseTool"] ||
      (this["_sceneState"]?.["ui"]?.["activeTool"] === "box-select"
        ? "box-select"
        : "navigate")
    );
  }
  ["_toggleMouseTool"]() {
    const v277 = String(
        this["_sceneState"]?.["ui"]?.["mouseTool"] ||
          this["_sceneState"]?.["ui"]?.["activeTool"] ||
          "",
      )["trim"](),
      v278 = resolveNextPanoramaMouseTool(v277);
    setPanoramaSceneTool({ nodeId: this["id"], tool: v278 });
  }
  ["_resolveTransformTool"]() {
    return (
      this["_sceneState"]?.["ui"]?.["transformTool"] ||
      (this["_sceneState"]?.["ui"]?.["activeTool"] === "move" ||
      this["_sceneState"]?.["ui"]?.["activeTool"] === "rotate" ||
      this["_sceneState"]?.["ui"]?.["activeTool"] === "scale"
        ? this["_sceneState"]["ui"]["activeTool"]
        : "move")
    );
  }
  ["_supportsPanoramaUpload"]() {
    return this["_isPanorama360"] === true;
  }
  ["_supportsCubeCreation"]() {
    return this["_isPanorama360"] !== true;
  }
  ["_supportsCameraFeatures"]() {
    return this["_isPanorama360"] !== true;
  }
  ["_buildPanorama360IncomingImageSignature"](v279) {
    if (!this["_isPanorama360"]) return "";
    const v280 = v279?.["nodes"] || {},
      v281 = v280[this["id"]];
    if (!v281) return "";
    const v282 = String(v281["parentId"] || "")["trim"](),
      v283 = Object["values"](v279?.["edges"] || {}),
      v284 = [];
    return (
      v283["forEach"]((v285) => {
        if (!v285) return;
        const v286 = v285["targetId"] === this["id"],
          v287 = !!v282 && v285["targetId"] === v282;
        if (!v286 && !v287) return;
        const v288 = v280[v285["sourceId"]];
        if (!v288 || !isPanorama360ImageSourceType(v288["type"])) return;
        const v289 =
            typeof v288["_bizRev"] === "number" ||
            typeof v288["_bizRev"] === "string"
              ? String(v288["_bizRev"])
              : "",
          v290 = [
            String(v288["localPath"] || "")["trim"](),
            String(v288["imageUrl"] || "")["trim"](),
            String(v288["src"] || "")["trim"](),
            String(v288["fileName"] || "")["trim"](),
          ]["join"](":");
        v284["push"](
          v285["id"] +
            ":" +
            v285["sourceId"] +
            ":" +
            Number(v285["createdAt"] || 0) +
            ":" +
            v289 +
            ":" +
            v290,
        );
      }),
      v284["sort"]((v291, v292) => v291["localeCompare"](v292)),
      v284["join"]("|")
    );
  }
  ["_enterEditing"]() {
    (this["_selectNodeOnCanvas"](),
      this["_data"]?.["isCollapsed"] &&
        setPanoramaSceneCollapsed({ nodeId: this["id"], isCollapsed: false }),
      setPanoramaSceneEditing({ nodeId: this["id"], isEditing: true }),
      requestAnimationFrame(() => this["_viewportEl"]?.["focus"]()));
  }
  ["_exitEditing"]() {
    (this["_closeMenus"](),
      setPanoramaSceneEditing({ nodeId: this["id"], isEditing: false }));
  }
  async ["_handleFileInputChange"](v293) {
    if (!this["_supportsPanoramaUpload"]()) {
      v293["target"]["value"] = "";
      return;
    }
    const v294 = v293["target"]["files"]?.[0];
    if (!v294) return;
    this["_selectNodeOnCanvas"]();
    const v295 = await uploadPanoramaSceneImage({
      nodeId: this["id"],
      file: v294,
    });
    (v295 && this["_isPanorama360"] && this["_enterEditing"](),
      (v293["target"]["value"] = ""));
  }
  ["_handleViewportPointerDown"](v296) {
    const v297 = this["_isEditing"]();
    (this["_selectNodeOnCanvas"]({ preserveExistingSelection: !v297 }),
      this["_closeObjectContextMenu"]());
    if (!v297) return;
    (this["_openMenuKey"] &&
      ((this["_openMenuKey"] = null), this["_syncOverlayState"]()),
      this["_viewportEl"]["focus"]?.(),
      v296["stopPropagation"]());
  }
  ["_handleViewportContextMenu"](v298) {
    if (!this["_isEditing"]()) return;
    (v298["preventDefault"](),
      v298["stopPropagation"](),
      this["_selectNodeOnCanvas"]());
    const v299 = this["_bridge"]?.["pick"]?.(v298["clientX"], v298["clientY"]);
    if (v299?.["objectType"] && v299?.["objectId"])
      setPanoramaSceneSelection({
        nodeId: this["id"],
        objectType: v299["objectType"],
        objectId: v299["objectId"],
      });
    else {
      if (!this["_sceneState"]?.["selection"]?.["selectedObjectId"]) {
        this["_closeObjectContextMenu"]();
        return;
      }
    }
    this["_openObjectContextMenu"](v298["clientX"], v298["clientY"], {
      type: "selection",
    });
  }
  ["_handleGlobalPointerDown"](v300) {
    if (!this["_contextMenuEl"] || this["_contextMenuEl"]["hidden"]) return;
    if (this["_contextMenuEl"]["contains"](v300["target"])) return;
    this["_closeObjectContextMenu"]();
  }
  ["_openObjectContextMenu"](v301, v302, v303 = { type: "selection" }) {
    if (!this["_contextMenuEl"] || !this["_overlayEl"]) return;
    const v304 = this["_overlayEl"]["getBoundingClientRect"]();
    if (!v304["width"] || !v304["height"]) return;
    const v305 = this["_contextMenuEl"]["offsetWidth"] || 132,
      v306 = this["_contextMenuEl"]["offsetHeight"] || 44,
      v307 = Math["max"](
        0,
        Math["min"](v301 - v304["left"], v304["width"] - v305),
      ),
      v308 = Math["max"](
        0,
        Math["min"](v302 - v304["top"], v304["height"] - v306),
      );
    ((this["_contextMenuEl"]["style"]["left"] = v307 + "px"),
      (this["_contextMenuEl"]["style"]["top"] = v308 + "px"),
      (this["_contextMenuTarget"] = v303),
      (this["_contextMenuEl"]["hidden"] = false),
      this["_contextMenuEl"]["classList"]["add"]("is-visible"));
  }
  ["_closeObjectContextMenu"]() {
    if (!this["_contextMenuEl"]) return;
    ((this["_contextMenuTarget"] = null),
      this["_contextMenuEl"]["classList"]["remove"]("is-visible"),
      (this["_contextMenuEl"]["hidden"] = true));
  }
  ["_handleViewportDoubleClick"](v309) {
    (v309["preventDefault"](), v309["stopPropagation"]());
    if (this["_isEditing"]() && this["_sceneState"]?.["mode"] === "scene") {
      const v310 = this["_bridge"]?.["pick"]?.(
        v309["clientX"],
        v309["clientY"],
      );
      if (v310?.["objectType"] && v310?.["objectId"]) {
        (this["_selectNodeOnCanvas"](),
          setPanoramaSceneSelection({
            nodeId: this["id"],
            objectType: v310["objectType"],
            objectId: v310["objectId"],
          }),
          focusPanoramaSceneSelection({ nodeId: this["id"] }));
        return;
      }
    }
    this["_enterEditing"]();
  }
  ["_handleKeyDown"](v311) {
    if (v311["key"] !== "Delete" && v311["key"] !== "Backspace") return;
    if (!this["_isEditing"]()) return;
    (v311["preventDefault"](),
      v311["stopPropagation"](),
      deleteSelectedPanoramaSceneObject({ nodeId: this["id"] }));
  }
  ["_openPanoramaFilePicker"]() {
    if (!this["_supportsPanoramaUpload"]()) return;
    this["_fileInput"]?.["click"]();
  }
  ["_openMenu"](v312) {
    if (!v312) return;
    (clearTimeout(this["_menuHideTimer"]),
      (this["_openMenuKey"] = v312),
      this["_positionMenus"](),
      this["_syncOverlayState"]());
  }
  ["_closeMenus"]() {
    (clearTimeout(this["_menuHideTimer"]),
      (this["_openMenuKey"] = null),
      this["_syncOverlayState"]());
  }
  ["_scheduleMenuHide"](v313) {
    (clearTimeout(this["_menuHideTimer"]),
      this["_openMenuKey"] === v313 &&
        ((this["_openMenuKey"] = null), this["_syncOverlayState"]()));
  }
  ["_handleBottomToolbarPointerEnter"](v314) {
    const v315 = v314["target"]?.["closest"]?.("button");
    if (!v315) return;
    if (v315["classList"]["contains"]("act-capture")) {
      this["_openMenu"]("capture");
      return;
    }
    if (!this["_isPanorama360"] && v315["classList"]["contains"]("act-focus")) {
      this["_openMenu"]("focus");
      return;
    }
    if (v315["classList"]["contains"]("act-mannequin-entry")) {
      if (!this["_supportsCubeCreation"]()) return;
      this["_openMenu"]("mannequin");
      return;
    }
    if (v315["classList"]["contains"]("act-grid")) {
      if (!this["_supportsCubeCreation"]()) return;
      this["_openMenu"]("grid");
      return;
    }
    if (
      this["_supportsCameraFeatures"]() &&
      v315["classList"]["contains"]("act-camera")
    ) {
      this["_openMenu"]("camera");
      return;
    }
  }
  ["_handleBottomToolbarPointerLeave"](v316) {
    const v317 = v316["relatedTarget"];
    if (
      v317 &&
      (this["_bottomToolbarEl"]?.["contains"](v317) ||
        this["_captureMenuEl"]?.["contains"](v317) ||
        this["_cameraListEl"]?.["contains"](v317) ||
        this["_focusMenuEl"]?.["contains"](v317) ||
        this["_mannequinMenuEl"]?.["contains"](v317) ||
        this["_gridPanelEl"]?.["contains"](v317))
    )
      return;
    const v318 = v316["target"]?.["closest"]?.("button");
    if (!v318) return;
    if (v318["classList"]["contains"]("act-capture")) {
      this["_scheduleMenuHide"]("capture");
      return;
    }
    if (!this["_isPanorama360"] && v318["classList"]["contains"]("act-focus")) {
      this["_scheduleMenuHide"]("focus");
      return;
    }
    if (v318["classList"]["contains"]("act-mannequin-entry")) {
      if (!this["_supportsCubeCreation"]()) return;
      this["_scheduleMenuHide"]("mannequin");
      return;
    }
    if (v318["classList"]["contains"]("act-grid")) {
      if (!this["_supportsCubeCreation"]()) return;
      this["_scheduleMenuHide"]("grid");
      return;
    }
    this["_supportsCameraFeatures"]() &&
      v318["classList"]["contains"]("act-camera") &&
      this["_scheduleMenuHide"]("camera");
  }
  async ["_handleToolbarAction"](v319) {
    const v320 = this["_sceneState"];
    switch (v319) {
      case "enter-edit":
        this["_enterEditing"]();
        return;
      case "exit-edit":
        this["_exitEditing"]();
        return;
      case "upload-panorama":
        if (!this["_supportsPanoramaUpload"]()) return;
        this["_openPanoramaFilePicker"]();
        return;
      case "fullscreen":
        !this["_isEditing"]() && this["_enterEditing"]();
        this["_isBrowserFullscreen"]()
          ? await this["_exitBrowserFullscreen"]()
          : await this["_enterBrowserFullscreen"]();
        return;
      case "navigate":
        {
          this["_toggleMouseTool"]();
        }
        return;
      case "move":
      case "rotate":
      case "scale":
        (this["_closeMenus"](),
          setPanoramaSceneTool({ nodeId: this["id"], tool: v319 }));
        return;
      case "environment-toggle":
        setPanoramaSceneEnvironmentMode({
          nodeId: this["id"],
          environmentMode: v320["environmentMode"] === "day" ? "night" : "day",
        });
        return;
      case "collapse-node":
        {
          const v321 = this["_data"]?.["isCollapsed"] === true;
          (setPanoramaSceneCollapsed({
            nodeId: this["id"],
            isCollapsed: !v321,
            enterEditingOnExpand: v321,
          }),
            v321 &&
              requestAnimationFrame(() => this["_viewportEl"]?.["focus"]()));
        }
        return;
      case "cube":
        if (!this["_supportsCubeCreation"]()) return;
        addPanoramaSceneCube({
          nodeId: this["id"],
          viewPose: this["_bridge"]?.["readCurrentViewPose"]?.(),
        });
        return;
      case "mannequin-entry":
        if (!this["_supportsCubeCreation"]()) return;
        this["_openMenu"]("mannequin");
        return;
      case "camera":
        if (!this["_supportsCameraFeatures"]()) return;
        {
          addPanoramaSceneCamera({
            nodeId: this["id"],
            viewPose: this["_bridge"]?.["readCurrentViewPose"]?.(),
          });
        }
        ((this["_openMenuKey"] = "camera"), this["_syncOverlayState"]());
        return;
      case "focus":
        if (this["_isPanorama360"] || this["_sceneState"]?.["mode"] !== "scene")
          return;
        if (this["_openMenuKey"] === "focus") {
          (this["_setDefaultSceneFocalLength"](SCENE_DEFAULT_FOCAL_LENGTH_MM),
            this["_focusMenuEl"]?.["_syncValue"]?.());
          return;
        }
        this["_openMenu"]("focus");
        return;
      case "capture":
        await capturePanoramaSceneViewport({
          nodeId: this["id"],
          captureBlob: () => this["_captureViewportByCurrentMode"](),
        });
        return;
      case "reset-view":
        (this["_setDefaultSceneFocalLength"](SCENE_DEFAULT_FOCAL_LENGTH_MM),
          resetPanoramaSceneView({ nodeId: this["id"] }));
        return;
      case "grid":
        if (!this["_supportsCubeCreation"]()) return;
        this["_openMenu"]("grid");
        return;
      case "toggle-panorama-mode":
        (this["_closeMenus"](),
          setPanoramaSceneMode({
            nodeId: this["id"],
            mode: this["_supportsPanoramaUpload"]() ? "panorama" : "scene",
          }));
        return;
      default:
        return;
    }
  }
  ["_handleToolbarClick"](v322) {
    const v323 = v322["target"]["closest"]("button");
    if (!v323) return;
    const v324 = Array["from"](v323["classList"])["find"]((v325) =>
      v325["startsWith"]("act-"),
    );
    if (!v324) return;
    (v322["preventDefault"](),
      v322["stopPropagation"](),
      this["_selectNodeOnCanvas"]());
    const v326 = v324["slice"](4);
    void this["_handleToolbarAction"](v326);
  }
  ["_syncGridPanelValues"]() {
    if (!this["_gridPanelEl"]) return;
    const v327 = this["_sceneState"]["gridPlacement"],
      v328 = (v329, v330, v331 = 0) => {
        const v332 = this["_gridPanelEl"]["querySelector"](
          '[data-grid-field="' + v329 + "\x22]",
        );
        if (!v332) return;
        if (!Number["isFinite"](Number(v330))) return;
        const v333 =
          v331 > 0
            ? Number(v330)["toFixed"](v331)
            : String(Math["round"](Number(v330)));
        v332["tagName"] === "INPUT"
          ? (v332["value"] = v333)
          : ((v332["textContent"] = v333),
            v332["setAttribute"]("aria-valuenow", String(v330)));
      };
    (v328("rows", v327["rows"], 0),
      v328("cols", v327["cols"], 0),
      v328("spacingX", v327["spacingX"], 1),
      v328("spacingZ", v327["spacingZ"], 1));
    const v334 = v327["gender"] === "female" ? "female" : "male";
    this["_gridPanelEl"]
      ["querySelectorAll"]("[data-grid-gender]")
      ["forEach"]((v335) => {
        v335["classList"]["toggle"](
          "is-active",
          v335["dataset"]["gridGender"] === v334,
        );
      });
    const v336 = new Set(
        PANORAMA_MANNEQUIN_COLOR_OPTIONS["map"](([v337]) => v337),
      ),
      v338 = v336["has"](v327["colorKey"]) ? v327["colorKey"] : "blue";
    this["_gridPanelEl"]
      ["querySelectorAll"]("[data-grid-color]")
      ["forEach"]((v339) => {
        const v340 = v339["dataset"]["gridColor"];
        (v339["classList"]["toggle"]("is-active", v340 === v338),
          v339["style"]["setProperty"](
            "--panorama-scene-swatch-token",
            "var(--" + resolvePanoramaSceneColorToken(v340) + ")",
          ));
      });
  }
  ["_syncToolbarState"]() {
    const v341 = this["_resolveMouseTool"](),
      v342 = this["_resolveTransformTool"]();
    this["_editToolbarEl"]
      ["querySelectorAll"](".act-navigate, .act-move, .act-rotate, .act-scale")
      ["forEach"]((v343) => {
        const v344 = Array["from"](v343["classList"])["find"]((v345) =>
            v345["startsWith"]("act-"),
          ),
          v346 = v344?.["slice"](4),
          v347 = v346 === "navigate",
          v348 = v347
            ? v341 === "navigate" || v341 === "box-select"
            : v346 === v342;
        v343["classList"]["toggle"]("active", v348);
      });
    const v349 = this["_editToolbarEl"]["querySelector"](".act-navigate");
    if (v349) {
      const v350 = v341 === "box-select";
      v349["classList"]["toggle"]("is-box-select", v350);
      const v351 = buildTooltipText(
        v350 ? "框选鼠标" : "鼠标模式",
        "panorama-scene-tool-toggle-mouse",
      );
      ((v349["dataset"]["tooltip"] = v351),
        v349["setAttribute"]("aria-label", v351));
      const v352 = v350 ? BOX_SELECT_TOOL_ICON : POINTER_TOOL_ICON;
      v349["innerHTML"] !== v352 && (v349["innerHTML"] = v352);
    }
    const v353 = this["_editToolbarEl"]["querySelector"](".act-move");
    if (v353) {
      const v354 = buildTooltipText("移动", "panorama-scene-tool-move");
      ((v353["dataset"]["tooltip"] = v354),
        v353["setAttribute"]("aria-label", v354));
    }
    const v355 = this["_editToolbarEl"]["querySelector"](".act-rotate");
    if (v355) {
      const v356 = buildTooltipText("旋转", "panorama-scene-tool-rotate");
      ((v355["dataset"]["tooltip"] = v356),
        v355["setAttribute"]("aria-label", v356));
    }
    const v357 = this["_editToolbarEl"]["querySelector"](".act-scale");
    if (v357) {
      const v358 = buildTooltipText("缩放", "panorama-scene-tool-scale");
      ((v357["dataset"]["tooltip"] = v358),
        v357["setAttribute"]("aria-label", v358));
    }
    const v359 = this["_cornerToolbarEl"]["querySelector"](
      ".act-environment-toggle",
    );
    if (v359) {
      const v360 =
        this["_sceneState"]["environmentMode"] === "day"
          ? "切换到夜景"
          : "切换到日景";
      ((v359["dataset"]["tooltip"] = v360),
        v359["setAttribute"]("aria-label", v360),
        (v359["hidden"] = false),
        v359["setAttribute"]("aria-hidden", "false"));
    }
    const v361 = this["_sceneToolbarEl"]["querySelector"](
      ".act-upload-panorama",
    );
    if (v361) {
      const v362 = this["_supportsPanoramaUpload"]();
      ((v361["hidden"] = !v362),
        v361["setAttribute"]("aria-hidden", v362 ? "false" : "true"));
    }
    const v363 = this["_bottomToolbarEl"]["querySelector"](".act-cube");
    if (v363) {
      const v364 = this["_supportsCubeCreation"]();
      ((v363["hidden"] = !v364),
        v363["setAttribute"]("aria-hidden", v364 ? "false" : "true"));
    }
    const v365 = this["_bottomToolbarEl"]["querySelector"](
      ".act-mannequin-entry",
    );
    if (v365) {
      const v366 = this["_supportsCubeCreation"]();
      ((v365["hidden"] = !v366),
        v365["setAttribute"]("aria-hidden", v366 ? "false" : "true"),
        (v365["disabled"] = !v366),
        !v366 &&
          this["_openMenuKey"] === "mannequin" &&
          (this["_openMenuKey"] = null));
    }
    const v367 = this["_bottomToolbarEl"]["querySelector"](".act-grid");
    if (v367) {
      const v368 = this["_supportsCubeCreation"]();
      ((v367["hidden"] = !v368),
        v367["setAttribute"]("aria-hidden", v368 ? "false" : "true"),
        (v367["disabled"] = !v368));
      const v369 = "矩形排列";
      ((v367["dataset"]["tooltip"] = v369),
        v367["setAttribute"]("aria-label", v369),
        !v368 &&
          this["_openMenuKey"] === "grid" &&
          (this["_openMenuKey"] = null));
    }
    const v370 = this["_bottomToolbarEl"]["querySelector"](".act-camera");
    if (v370) {
      const v371 = this["_supportsCameraFeatures"](),
        v372 = this["_sceneState"]["cameras"]["length"] >= 10;
      ((v370["hidden"] = !v371),
        v370["setAttribute"]("aria-hidden", v371 ? "false" : "true"),
        (v370["disabled"] = !v371),
        v370["classList"]["toggle"]("is-limit-reached", v371 && v372),
        v370["setAttribute"](
          "aria-disabled",
          !v371 || v372 ? "true" : "false",
        ));
      const v373 = buildTooltipText(
        "创建机位书签",
        "panorama-scene-camera-create",
      );
      ((v370["dataset"]["tooltip"] = v373),
        v370["setAttribute"]("aria-label", v373),
        !v371 &&
          this["_openMenuKey"] === "camera" &&
          (this["_openMenuKey"] = null));
    }
    const v374 = this["_bottomToolbarEl"]["querySelector"](".act-focus");
    if (v374) {
      const v375 =
        !this["_isPanorama360"] && this["_sceneState"]?.["mode"] === "scene";
      ((v374["hidden"] = !v375),
        v374["setAttribute"]("aria-hidden", v375 ? "false" : "true"),
        (v374["disabled"] = !v375));
      const v376 = "焦距";
      ((v374["dataset"]["tooltip"] = v376),
        v374["setAttribute"]("aria-label", v376),
        !v375 &&
          this["_openMenuKey"] === "focus" &&
          (this["_openMenuKey"] = null));
    }
    const v377 = this["_bottomToolbarEl"]["querySelector"](".act-reset-view");
    if (v377) {
      const v378 = buildTooltipText("重置视角", "panorama-scene-reset-view");
      ((v377["dataset"]["tooltip"] = v378),
        v377["setAttribute"]("aria-label", v378));
    }
    const v379 = this["_bottomToolbarEl"]["querySelector"](".act-capture");
    if (v379) {
      const v380 = getCaptureModeMeta(this["_resolveCaptureMode"]()),
        v381 = buildTooltipText(
          "截图 · " + v380["label"],
          "panorama-scene-capture",
        );
      ((v379["dataset"]["tooltip"] = v381),
        v379["setAttribute"]("aria-label", v381));
    }
    this["_syncCaptureMenuState"]();
    const v382 = [
      this["_sceneToolbarEl"]?.["querySelector"](".act-collapse-node"),
      this["_editToolbarEl"]?.["querySelector"](".act-collapse-node"),
    ]["filter"](Boolean);
    v382["forEach"]((v383) => {
      const v384 = this["_data"]?.["isCollapsed"] === true,
        v385 = v384 ? "展开" : "折叠";
      ((v383["dataset"]["tooltip"] = v385),
        v383["setAttribute"]("aria-label", v385),
        v383["classList"]["toggle"]("is-collapsed", v384));
    });
    const v386 = this["el"]?.["querySelectorAll"]?.(".act-fullscreen") || [];
    if (v386["length"] > 0) {
      const v387 = this["_isBrowserFullscreen"](),
        v388 = v387 ? "退出全屏" : "全屏显示";
      v386["forEach"]((v389) => {
        ((v389["dataset"]["tooltip"] = v388),
          v389["setAttribute"]("aria-label", v388),
          v389["classList"]["toggle"]("active", v387));
      });
    }
  }
  ["_syncHintAndStatus"]() {
    const v390 = this["_isEditing"](),
      v391 = this["_sceneState"]["selection"],
      v392 = this["_resolveMouseTool"]();
    if (v390) {
      const v393 = v391["selectedObjectId"]
          ? v391["selectedObjectType"] === "camera"
            ? "已选机位书签"
            : "已选对象"
          : "未选对象",
        v394 = this["_supportsPanoramaUpload"]() ? "全景模式" : "场景模式";
      this["_statusContentEl"]["textContent"] =
        "编辑中 · " + v394 + "\x20·\x20" + v393;
    } else
      this["_data"]?.["isCollapsed"]
        ? (this["_statusContentEl"]["textContent"] = "已折叠")
        : (this["_statusContentEl"]["textContent"] = "普通节点");
    const v395 =
      this["_sceneState"]["panorama"]["error"] ||
      this["_sceneState"]["capture"]["error"] ||
      "";
    ((this["_errorEl"]["textContent"] = v395),
      this["_errorEl"]["classList"]["toggle"]("is-visible", !!v395));
    if (this["_data"]?.["isCollapsed"])
      this["_hintContentEl"]["textContent"] = "双击进入编辑";
    else {
      if (!v390)
        this["_hintContentEl"]["textContent"] = this[
          "_supportsPanoramaUpload"
        ]()
          ? "点击编辑进入全景"
          : "点击编辑进入场景";
      else {
        if (
          this["_supportsPanoramaUpload"]() ||
          this["_sceneState"]["mode"] === "panorama"
        )
          this["_hintContentEl"]["textContent"] = "拖拽旋转视角，滚轮缩放";
        else
          v392 === "box-select"
            ? (this["_hintContentEl"]["textContent"] = "框选模式：拖拽框选对象")
            : (this["_hintContentEl"]["textContent"] =
                "默认鼠标：左键空白环绕，左键对象拖动XZ");
      }
    }
  }
  ["_positionMenus"]() {
    if (!this["_bottomToolbarPopoverLayerEl"] || !this["_bottomToolbarEl"])
      return;
    if (
      this["_bottomToolbarEl"]["offsetWidth"] <= 0 ||
      this["_bottomToolbarEl"]["offsetHeight"] <= 0
    )
      return;
    const v396 = (v397) => {
        if (!(v397 instanceof HTMLElement)) return null;
        const v398 = v397["offsetWidth"] || 0,
          v399 = v397["offsetHeight"] || 0;
        if (v398 <= 0 || v399 <= 0) return null;
        return {
          x: (v397["offsetLeft"] || 0) + v398 / 2,
          y: v397["offsetTop"] || 0,
        };
      },
      v400 = v396(
        this["_bottomToolbarEl"]["querySelector"](".act-mannequin-entry"),
      );
    v400 &&
      ((this["_mannequinMenuEl"]["style"]["left"] = v400["x"] + "px"),
      (this["_mannequinMenuEl"]["style"]["top"] = v400["y"] + "px"));
    const v401 = v396(this["_bottomToolbarEl"]["querySelector"](".act-grid"));
    v401 &&
      ((this["_gridPanelEl"]["style"]["left"] = v401["x"] + "px"),
      (this["_gridPanelEl"]["style"]["top"] = v401["y"] + "px"));
    const v402 = v396(
      this["_bottomToolbarEl"]["querySelector"](".act-capture"),
    );
    v402 &&
      ((this["_captureMenuEl"]["style"]["left"] = v402["x"] + "px"),
      (this["_captureMenuEl"]["style"]["top"] = v402["y"] + "px"));
    const v403 = v396(this["_bottomToolbarEl"]["querySelector"](".act-focus"));
    v403 &&
      ((this["_focusMenuEl"]["style"]["left"] = v403["x"] + "px"),
      (this["_focusMenuEl"]["style"]["top"] = v403["y"] + "px"));
    const v404 = v396(this["_bottomToolbarEl"]["querySelector"](".act-camera"));
    v404 &&
      ((this["_cameraListEl"]["style"]["left"] = v404["x"] + "px"),
      (this["_cameraListEl"]["style"]["top"] = v404["y"] + "px"));
  }
  ["_syncOverlayState"]() {
    const v405 = this["_isEditing"](),
      v406 = this["_data"]?.["isCollapsed"] === true,
      v407 = this["_isNodeSelected"](),
      v408 = !v405,
      v409 = v405 && !v406 && v407,
      v410 = v409,
      v411 = v409;
    (this["el"]["classList"]["toggle"]("is-editing", v405),
      this["el"]["classList"]["toggle"]("is-collapsed", v406),
      this["el"]["classList"]["toggle"](
        "is-panorama-mode",
        this["_sceneState"]["mode"] === "panorama",
      ));
    const v412 =
      this["_sceneState"]?.["environmentMode"] === "day" ? "day" : "night";
    ((this["el"]["dataset"]["panoramaEnv"] = v412),
      (this["_viewportEl"]["dataset"]["envMode"] = v412),
      (this["_viewportEl"]["dataset"]["sceneType"] =
        this["_sceneState"]?.["type"] || ""),
      this["_sceneToolbarEl"]["classList"]["toggle"]("is-hidden", !v408),
      this["_sceneToolbarEl"]["classList"]["remove"]("is-node-collapsed"),
      this["_editToolbarEl"]["classList"]["toggle"]("is-hidden", !v409),
      this["_editToolbarEl"]["classList"]["remove"]("is-node-collapsed"),
      this["_cornerToolbarEl"]["classList"]["toggle"]("is-hidden", !v411),
      this["_cornerToolbarEl"]["classList"]["toggle"](
        "is-collapsed-state",
        v406,
      ),
      this["_bottomToolbarEl"]["classList"]["toggle"]("is-hidden", !v410),
      (this["_statusEl"]["style"]["transform"] = "none"),
      (this["_hintEl"]["style"]["transform"] = "none"));
    !v409 && this["_closeObjectContextMenu"]();
    const v413 =
        v409 &&
        this["_supportsCameraFeatures"]() &&
        this["_sceneState"]["cameras"]["length"] > 0 &&
        this["_openMenuKey"] === "camera",
      v414 =
        v409 &&
        !this["_isPanorama360"] &&
        this["_sceneState"]?.["mode"] === "scene" &&
        this["_openMenuKey"] === "focus",
      v415 = v409 && this["_openMenuKey"] === "capture",
      v416 =
        v409 &&
        this["_supportsCubeCreation"]() &&
        this["_openMenuKey"] === "grid",
      v417 =
        v409 &&
        this["_supportsCubeCreation"]() &&
        this["_openMenuKey"] === "mannequin";
    (this["_captureMenuEl"]["classList"]["toggle"]("is-visible", v415),
      this["_cameraListEl"]["classList"]["toggle"]("is-visible", v413),
      this["_focusMenuEl"]["classList"]["toggle"]("is-visible", v414),
      this["_gridPanelEl"]["classList"]["toggle"]("is-visible", v416),
      this["_mannequinMenuEl"]["classList"]["toggle"]("is-visible", v417),
      (this["_captureMenuEl"]["hidden"] = !v415),
      (this["_cameraListEl"]["hidden"] = !v413),
      (this["_focusMenuEl"]["hidden"] = !v414),
      (this["_gridPanelEl"]["hidden"] = !v416),
      (this["_mannequinMenuEl"]["hidden"] = !v417));
    v414 && this["_focusMenuEl"]?.["_syncValue"]?.();
    (this["_statusEl"]["classList"]["toggle"]("is-visible", true),
      this["_hintEl"]["classList"]["toggle"]("is-visible", true),
      this["_syncAttachedUiVisibility"](v410),
      this["_syncCaptureSafeFrame"]());
    const v418 = this["_bottomToolbarEl"]?.["querySelector"](".act-focus");
    if (v418) {
      const v419 = v414 ? "" : "焦距";
      (v419
        ? (v418["dataset"]["tooltip"] = v419)
        : v418["removeAttribute"]("data-tooltip"),
        v418["setAttribute"]("aria-label", "焦距"));
    }
    this["_positionMenus"]();
  }
  ["update"](v420) {
    const v421 = this["_sceneState"];
    ((this["_data"] = v420),
      (this["_isPanorama360"] =
        String(v420?.["type"] || "")["trim"]() === PANORAMA_360_NODE_TYPE),
      this["el"]["classList"]["toggle"](
        "is-panorama-360",
        this["_isPanorama360"],
      ),
      (this["_sceneState"] = getPanoramaSceneState(v420)),
      !this["_sceneState"]["ui"]["isEditing"] && (this["_openMenuKey"] = null),
      this["_maybePreloadCharacterModels"](v421),
      !this["_isPanorama360"] &&
      this["_sceneState"]?.["mode"] === "scene" &&
      (!v421 ||
        (!this["_isDefaultSceneView"](v421?.["viewport"]?.["sceneView"]) &&
          this["_isDefaultSceneView"](
            this["_sceneState"]?.["viewport"]?.["sceneView"],
          )))
        ? this["_setDefaultSceneFocalLength"](SCENE_DEFAULT_FOCAL_LENGTH_MM)
        : this["_bridge"]?.["setDefaultSceneFocalLength"]?.(
            this["_defaultSceneFocalLength"],
          ),
      this["_syncToolbarState"](),
      this["_syncGridPanelValues"](),
      renderMannequinQuickMenu(this["_mannequinMenuEl"], this["_sceneState"]),
      renderCameraPresetList(this["_cameraListEl"], this["_sceneState"], {
        onActivate: (v422) => {
          (this["_animateCameraActivation"](v422),
            (this["_openMenuKey"] = null),
            this["_syncOverlayState"]());
        },
        onDelete: (v423) => {
          deletePanoramaSceneCamera({ nodeId: this["id"], cameraId: v423 });
        },
        onContextMenu: ({ cameraId: v424, clientX: v425, clientY: v426 }) => {
          this["_openObjectContextMenu"](v425, v426, {
            type: "camera",
            cameraId: v424,
          });
        },
      }),
      this["_syncHintAndStatus"](),
      this["_syncCaptureMenuState"](),
      this["_syncOverlayState"](),
      this["_bridge"]?.["sync"]?.(this["_sceneState"]),
      this["_maybeReleasePendingCameraJumpDraft"]());
  }
  ["unmount"]() {
    ((this["_isUnmounted"] = true),
      clearTimeout(this["_menuHideTimer"]),
      this["_fileInput"]?.["removeEventListener"](
        "change",
        this["_handleFileInputChange"],
      ),
      this["_viewportEl"]?.["removeEventListener"](
        "pointerdown",
        this["_handleViewportPointerDown"],
      ),
      this["_viewportEl"]?.["removeEventListener"](
        "contextmenu",
        this["_handleViewportContextMenu"],
      ),
      this["_viewportEl"]?.["removeEventListener"](
        "dblclick",
        this["_handleViewportDoubleClick"],
      ),
      this["_viewportEl"]?.["removeEventListener"](
        "keydown",
        this["_handleKeyDown"],
      ),
      this["el"]?.["removeEventListener"](
        "pointerenter",
        this["_handleNodePointerEnter"],
      ),
      this["el"]?.["removeEventListener"](
        "pointerleave",
        this["_handleNodePointerLeave"],
      ),
      this["_sceneToolbarEl"]?.["removeEventListener"](
        "click",
        this["_handleToolbarClick"],
      ),
      this["_editToolbarEl"]?.["removeEventListener"](
        "click",
        this["_handleToolbarClick"],
      ),
      this["_cornerToolbarEl"]?.["removeEventListener"](
        "click",
        this["_handleToolbarClick"],
      ),
      this["_bottomToolbarEl"]?.["removeEventListener"](
        "click",
        this["_handleToolbarClick"],
      ),
      this["_bottomToolbarEl"]?.["removeEventListener"](
        "pointerover",
        this["_handleBottomToolbarPointerEnter"],
      ),
      this["_bottomToolbarEl"]?.["removeEventListener"](
        "pointerout",
        this["_handleBottomToolbarPointerLeave"],
      ),
      this["_captureMenuEl"]?.["removeEventListener"](
        "click",
        this["_handleCaptureMenuClick"],
      ),
      this["_unsubscribeSelection"]?.(),
      (this["_unsubscribeSelection"] = null),
      this["_unsubscribeViewport"]?.(),
      (this["_unsubscribeViewport"] = null),
      this["_unsubscribePanoramaIncomingSync"]?.(),
      (this["_unsubscribePanoramaIncomingSync"] = null),
      window["removeEventListener"]("resize", this["_handleWindowResize"]),
      window["removeEventListener"](
        "pointerdown",
        this["_handleGlobalPointerDown"],
        true,
      ),
      window["removeEventListener"](
        "keydown",
        this["_handleWindowKeyDown"],
        true,
      ),
      window["removeEventListener"](
        "shortcuts-updated",
        this["_handleShortcutsUpdated"],
      ),
      window["removeEventListener"](
        "panorama-scene:camera-shortcut",
        this["_handleCameraShortcutEvent"],
      ),
      window["removeEventListener"](
        "panorama-scene:capture-shortcut",
        this["_handleCaptureShortcutEvent"],
      ),
      void this["_exitBrowserFullscreen"]({ skipSync: true }),
      this["_cameraJumpRaf"] &&
        (cancelAnimationFrame(this["_cameraJumpRaf"]),
        (this["_cameraJumpRaf"] = 0)),
      this["_pendingCameraJumpReleaseRaf"] &&
        (cancelAnimationFrame(this["_pendingCameraJumpReleaseRaf"]),
        (this["_pendingCameraJumpReleaseRaf"] = 0)),
      (this["_pendingCameraJumpCommit"] = null),
      this["_resizeObserver"]?.["disconnect"](),
      this["_interaction"]?.["detach"]?.(),
      this["_bridge"]?.["dispose"]?.());
  }
}

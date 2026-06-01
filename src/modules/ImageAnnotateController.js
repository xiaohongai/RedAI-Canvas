import appStore from "../core/stores/appStore.js";
import { buildGenerateImageRequest } from "../../api/aiImageApi.js";
import {
  generateId,
  screenToWorld,
  worldToScreen,
  isPointInRect,
} from "../core/math.js";
import { setStaticInnerHTML } from "../utils/dom.js";
import { IMAGE_MODELS, getModelProvider } from "../config/modelConfig.js";
import {
  bindImageFunctionModeMenu,
  bindImageFunctionModelMenu,
  closeImageFunctionModelSubmenus,
  getImageFunctionNanoSelection,
  getImageFunctionModelDisplayName,
  getImageFunctionModelTriggerIconHTML,
  resolveImageFunctionModelByMode,
  syncImageFunctionModeControl,
  syncImageFunctionModelMenuActive,
} from "./imageFunctionModelMenu.js";
import { bindToolbarUpMenus } from "./imageToolbarUpMenu.js";
import { shouldDisableImageSizeControl } from "./imageModelCapabilities.js";
import {
  ANNOTATE_TOOLBAR_TEMPLATE_ID,
  createGenerationToolbarMarkup,
  getAnnotateToolbarToolsForScene,
} from "./imageAnnotate/annotateToolbarMarkup.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
import {
  buildCopiedTextCommand,
  clampTextScale,
  createTextTransformState,
  findTextHit,
  getTextGeometry,
  getTextLayout,
  getTextScalePair,
  resolveAxisTextScale,
  rotateTextLocalPoint,
  TEXT_CONTROL_HIT_RADIUS,
  TEXT_CONTROL_MAX_SCALE,
  TEXT_CONTROL_MIN_SCALE,
  toTextLocalTransformSpace,
} from "./imageAnnotate/textControls.js";
import {
  renderCommands,
  renderEraseSceneCommands,
} from "./imageAnnotate/rendering.js";
import { createEraseCheckerboardPattern } from "./eraseBrushRenderer.js";
import { buildGenerationPayload } from "./imageAnnotate/generationPayload.js";
import { exportAnnotateCanvasBlob } from "./imageAnnotate/exportCanvas.js";
import { runGenerationResultFlow } from "./imageAnnotate/generationResultFlow.js";
import { saveAnnotateExportResult } from "./imageAnnotate/saveResultNode.js";
import {
  buildGenerationModelCatalog,
  buildPersistedEraseSelectionState,
  buildSeedreamMigrationPatch,
  ERASE_SELECTION_STATE_KEY,
  findProviderKeyByModel,
  getDefaultGenerationModelState,
  readPersistedEraseSelectionState,
} from "./imageAnnotate/stateAdapters.js";
import { buildSelectionMaskCanvas } from "./imageAnnotate/selectionMask.js";
import {
  IMAGE_BRUSH_DEFAULT_SIZE_PX,
  clampImageBrushSize,
  syncCircularBrushCursor,
} from "./imageEditorBrushStyle.js";
import { formatFinalApiDebugRequest } from "../utils/debugRequestPreview.js";
const COLOR_VAR_MAP = {
    black: "--black",
    red: "--annotate-red",
    orange: "--annotate-orange",
    yellow: "--annotate-yellow",
    green: "--annotate-green",
    blue: "--annotate-blue",
    purple: "--annotate-purple",
    white: "--canvas-white",
  },
  getCssVar = (v0) =>
    getComputedStyle(document["documentElement"])
      ["getPropertyValue"](v0)
      ["trim"](),
  COLOR_NAME_BY_VAR = Object["fromEntries"](
    Object["entries"](COLOR_VAR_MAP)["map"](([v1, v2]) => [v2, v1]),
  ),
  normalizeColorName = (v3) => {
    const v4 = String(v3 || "")["trim"]();
    if (!v4) return "red";
    if (COLOR_VAR_MAP[v4]) return v4;
    const v5 = v4["match"](/^var\(\s*(--[^)]+)\s*\)$/);
    if (v5 && COLOR_NAME_BY_VAR[v5[1]]) return COLOR_NAME_BY_VAR[v5[1]];
    return "red";
  },
  getColorCss = (v6) => {
    const v7 = COLOR_VAR_MAP[v6];
    return v7 ? "var(" + v7 + ")" : v6;
  },
  getColorCanvas = (v8) => {
    const v9 = COLOR_VAR_MAP[v8];
    if (!v9) return v8;
    return getCssVar(v9) || v8;
  },
  isFiniteCommandPoint = (v10) =>
    Number["isFinite"](Number(v10?.["x"])) &&
    Number["isFinite"](Number(v10?.["y"])),
  hasDrawableStrokePoints = (v11) =>
    Array["isArray"](v11?.["points"]) &&
    v11["points"]["some"](isFiniteCommandPoint),
  shouldDiscardStrokeCommand = (v12) =>
    (v12?.["type"] === "brush" || v12?.["type"] === "eraser") &&
    !hasDrawableStrokePoints(v12);
export const __textControlTestUtils = {
  clampTextScale: clampTextScale,
  getTextScalePair: getTextScalePair,
};
export const __strokeCommandTestUtils = {
  hasDrawableStrokePoints: hasDrawableStrokePoints,
  shouldDiscardStrokeCommand: shouldDiscardStrokeCommand,
};
const ERASE_GENERATE_PROMPT = "擦除绿色的区域 并且填充背景",
  ROTATE_CURSOR_CSS =
    "url(\x22data:image/svg+xml,%3Csvg\x20xmlns=\x27http://www.w3.org/2000/svg\x27\x20width=\x2728\x27\x20height=\x2728\x27\x20viewBox=\x270\x200\x2028\x2028\x27%3E%3Cg\x20transform=\x27rotate(35\x2014\x2014)\x27%3E%3Cpath\x20d=\x27M10.2\x2022.7a8.6\x208.6\x200\x201\x200\x200-17.4\x206.8\x206.8\x200\x201\x201\x200\x2017.4Z\x27\x20fill=\x27%23ffffff\x27\x20stroke=\x27%23ffffff\x27\x20stroke-width=\x271.6\x27\x20stroke-linejoin=\x27round\x27/%3E%3Cpath\x20d=\x27M5.3\x2022.1h4.8v-4.8\x27\x20fill=\x27none\x27\x20stroke=\x27%23ffffff\x27\x20stroke-width=\x271.7\x27\x20stroke-linecap=\x27round\x27\x20stroke-linejoin=\x27round\x27/%3E%3Cpath\x20d=\x27M5.3\x2022.1l3.9-3.9\x27\x20fill=\x27none\x27\x20stroke=\x27%23ffffff\x27\x20stroke-width=\x271.7\x27\x20stroke-linecap=\x27round\x27/%3E%3C/g%3E%3C/svg%3E\x22)\x2014\x2014",
  ImageAnnotateController = {
    active: false,
    nodeId: null,
    nodeData: null,
    overlayEl: null,
    containerEl: null,
    stageEl: null,
    imgEl: null,
    canvasEl: null,
    toolbarEl: null,
    generationToolbarEl: null,
    sizeValueEl: null,
    sizeRangeEl: null,
    colorWrapEl: null,
    colorDotEl: null,
    colorMenuEl: null,
    colorButtons: null,
    toolButtons: null,
    cursorEl: null,
    _cursorHover: false,
    _cursorLast: { x: 0, y: 0 },
    _cursorRaf: 0,
    _temporaryTool: null,
    _textInputEl: null,
    _selectedTextCommandIndex: null,
    _unsubscribe: null,
    _commands: [],
    _redoStack: [],
    _draft: null,
    _dirty: false,
    _view: null,
    _mode: null,
    imageSize: "1K",
    model: null,
    provider: null,
    promptText: "",
    _checkerPattern: null,
    _eraseMaskCanvasEl: null,
    _useWhiteboardBase: false,
    _generationModelCatalog: null,
    _fillRegionCache: null,
    _unbindGenerationToolbarUpMenus: null,
    _unbindGenerationFunctionMenus: null,
    init(v13, v14 = {}) {
      if (this["active"]) return;
      const v15 = appStore["getStateRaw"](),
        v16 = v15["nodes"]?.[v13];
      if (!v16) return;
      const v17 = this["_resolveNodeImageUrl"](v16);
      if (!v17) {
        window["showToast"]?.("没有可标注的图像", "warn");
        return;
      }
      const v18 = String(v14["scene"] || "annotate"),
        v19 = v18 === "erase" ? readPersistedEraseSelectionState(v16) : null,
        v20 =
          v18 === "erase"
            ? v19?.["tool"] || "brush"
            : v18 === "repaint"
              ? "brush"
              : v15["annotate"]?.["tool"] === "bucket"
                ? "brush"
                : v15["annotate"]?.["tool"] || "brush",
        v21 = normalizeColorName(v15["annotate"]?.["color"]),
        v22 =
          v18 === "erase"
            ? clampImageBrushSize(v19?.["brushSizePx"], 40)
            : clampImageBrushSize(
                v15["annotate"]?.["brushSizePx"],
                IMAGE_BRUSH_DEFAULT_SIZE_PX,
              );
      ((this["active"] = true),
        (this["nodeId"] = v13),
        (this["_generationModelCatalog"] = buildGenerationModelCatalog()));
      const v23 = this["_normalizeLegacySeedreamNode"](v16);
      ((this["nodeData"] = v23),
        (this["_commands"] = v19?.["commands"] || []),
        (this["_redoStack"] = []),
        (this["_draft"] = null),
        (this["_selectedTextCommandIndex"] = null),
        (this["_dirty"] = false),
        (this["_useWhiteboardBase"] = false),
        (this["_fillRegionCache"] = new Map()));
      const v24 = String(v14["submitLabel"] || "保存")["trim"](),
        v25 = v24 || "保存";
      this["_mode"] = {
        scene: v18,
        submitLabel: v25,
        submitBusyLabel:
          String(v14["submitBusyLabel"] || "")["trim"]() ||
          (v25 === "生成" ? "生成中..." : "保存中..."),
        submitNoop: Boolean(v14["submitNoop"]),
      };
      const v26 = this["_getGenerationModelCatalog"](),
        v27 = getDefaultGenerationModelState(v26);
      this["imageSize"] = "1K";
      const v28 = String(v23?.["model"] || "")["trim"](),
        v29 = String(v23?.["provider"] || "")["trim"](),
        v30 = findProviderKeyByModel(v26, v28);
      (v30
        ? ((this["model"] = v28), (this["provider"] = v30))
        : ((this["model"] = v27["model"] || v28 || null),
          (this["provider"] =
            v27["provider"] || v29 || getModelProvider(this["model"]) || null)),
        (this["promptText"] =
          v18 === "repaint" ? String(v14["promptText"] || "")["trim"]() : ""),
        (this["_view"] = {
          tool: v20,
          color: v21,
          brushSizePx: v22,
          viewport: v15["viewport"],
          node: v23,
        }),
        appStore["setAnnotateState"]({
          active: true,
          nodeId: v13,
          tool: v20,
          color: v21,
          brushSizePx: v22,
        }),
        this["_createUI"](v17, { tool: v20, color: v21, brushSizePx: v22 }),
        this["_bindEvents"](),
        (this["_unsubscribe"] = appStore["subscribeSelector"](
          (v31) => {
            const v32 = v31["nodes"]?.[v13],
              v33 = v31["viewport"] || { x: 0, y: 0, zoom: 1 },
              v34 = v31["annotate"] || {};
            return {
              hasNode: !!v32,
              nx: v32 ? v32["x"] : 0,
              ny: v32 ? v32["y"] : 0,
              nw: v32 ? v32["width"] : 0,
              nh: v32 ? v32["height"] : 0,
              vx: v33["x"],
              vy: v33["y"],
              vz: v33["zoom"] || 1,
              tool: v34["tool"] || "brush",
              color: normalizeColorName(v34["color"]),
              brushSizePx: clampImageBrushSize(
                v34["brushSizePx"],
                IMAGE_BRUSH_DEFAULT_SIZE_PX,
              ),
            };
          },
          (v35) => {
            if (!v35?.["hasNode"]) return;
            const v36 = appStore["getStateRaw"]()["nodes"]?.[v13],
              v37 = this["_normalizeLegacySeedreamNode"](v36);
            ((this["nodeData"] = v37 || null),
              (this["_view"] = {
                tool: v35["tool"],
                color: v35["color"],
                brushSizePx: v35["brushSizePx"],
                viewport: { x: v35["vx"], y: v35["vy"], zoom: v35["vz"] },
                node: {
                  x: Number(v37?.["x"] ?? v35["nx"]),
                  y: Number(v37?.["y"] ?? v35["ny"]),
                  width: Number(v37?.["width"] ?? v35["nw"]),
                  height: Number(v37?.["height"] ?? v35["nh"]),
                },
              }),
              this["_updateView"](this["_view"]));
          },
        )),
        this["_waitForImageAndShow"]());
    },
    _waitForImageAndShow() {
      const v38 = () => {
        if (
          this["imgEl"] &&
          this["imgEl"]["complete"] &&
          this["imgEl"]["naturalWidth"] > 0
        ) {
          if (this["_view"]) this["_updateView"](this["_view"]);
          requestAnimationFrame(() => {
            if (this["overlayEl"])
              this["overlayEl"]["classList"]["add"]("visible");
          });
        } else requestAnimationFrame(v38);
      };
      v38();
    },
    _getGenerationModelCatalog() {
      return (
        !this["_generationModelCatalog"] &&
          (this["_generationModelCatalog"] = buildGenerationModelCatalog()),
        this["_generationModelCatalog"]
      );
    },
    _normalizeLegacySeedreamNode(v39) {
      const v40 = buildSeedreamMigrationPatch(v39);
      if (!v40) return v39;
      const v41 = { ...(v39 || {}), ...v40 },
        v42 = appStore["getStateRaw"]()["nodes"]?.[this["nodeId"]];
      return (v42 && appStore["updateNodeData"](this["nodeId"], v40), v41);
    },
    exit({ silent: silent = false } = {}) {
      if (!this["active"]) return;
      !silent && this["_dirty"] && window["showToast"]?.("已取消标注", "ok");
      ((this["active"] = false),
        (this["nodeId"] = null),
        (this["nodeData"] = null),
        (this["_commands"] = []),
        (this["_redoStack"] = []),
        (this["_draft"] = null),
        this["_removeTextInput"](false),
        (this["_dirty"] = false),
        appStore["setAnnotateState"]({ active: false, nodeId: null }));
      this["_unsubscribe"] &&
        (this["_unsubscribe"](), (this["_unsubscribe"] = null));
      (this["_unbindGenerationToolbarUpMenus"]?.(),
        (this["_unbindGenerationToolbarUpMenus"] = null),
        this["_unbindGenerationFunctionMenus"]?.(),
        (this["_unbindGenerationFunctionMenus"] = null));
      if (this["overlayEl"]) this["overlayEl"]["remove"]();
      if (this["toolbarEl"]) this["toolbarEl"]["remove"]();
      if (this["generationToolbarEl"]) this["generationToolbarEl"]["remove"]();
      ((this["overlayEl"] = null),
        (this["containerEl"] = null),
        (this["stageEl"] = null),
        (this["imgEl"] = null),
        (this["canvasEl"] = null),
        (this["toolbarEl"] = null),
        (this["generationToolbarEl"] = null),
        (this["sizeValueEl"] = null),
        (this["sizeRangeEl"] = null),
        (this["colorWrapEl"] = null),
        (this["colorDotEl"] = null),
        (this["colorMenuEl"] = null),
        (this["colorButtons"] = null),
        (this["toolButtons"] = null),
        (this["cursorEl"] = null),
        (this["_cursorHover"] = false),
        (this["_cursorLast"] = { x: 0, y: 0 }),
        (this["_cursorRaf"] = 0),
        (this["_temporaryTool"] = null),
        (this["_textInputEl"] = null),
        (this["_selectedTextCommandIndex"] = null),
        (this["_view"] = null),
        (this["_mode"] = null),
        (this["imageSize"] = "1K"),
        (this["model"] = null),
        (this["provider"] = null),
        (this["promptText"] = ""),
        (this["_checkerPattern"] = null),
        (this["_eraseMaskCanvasEl"] = null),
        (this["_useWhiteboardBase"] = false),
        (this["_generationModelCatalog"] = null),
        (this["_fillRegionCache"] = null),
        (this["_unbindGenerationToolbarUpMenus"] = null),
        (this["_unbindGenerationFunctionMenus"] = null));
    },
    _isGenerationScene() {
      return (
        this["_mode"]?.["scene"] === "repaint" ||
        this["_mode"]?.["scene"] === "erase"
      );
    },
    _isEraseScene() {
      return this["_mode"]?.["scene"] === "erase";
    },
    _isRepaintScene() {
      return this["_mode"]?.["scene"] === "repaint";
    },
    _isAnnotateScene() {
      return this["_mode"]?.["scene"] === "annotate";
    },
    _getFlipState(v43 = this["_commands"]) {
      const v44 = { horizontal: false, vertical: false };
      return (
        (Array["isArray"](v43) ? v43 : [])["forEach"]((v45) => {
          if (v45?.["type"] === "flip-horizontal")
            v44["horizontal"] = !v44["horizontal"];
          else
            v45?.["type"] === "flip-vertical" &&
              (v44["vertical"] = !v44["vertical"]);
        }),
        v44
      );
    },
    _getCurrentFlipState() {
      if (!this["_isAnnotateScene"]())
        return { horizontal: false, vertical: false };
      return this["_getFlipState"](this["_commands"]);
    },
    _applyFlipToLocalPoint(v46, v47, v48 = this["_getCurrentFlipState"]()) {
      const v49 = { x: Number(v46?.["x"]) || 0, y: Number(v46?.["y"]) || 0 },
        v50 = Math["max"](1, Number(v47?.["width"]) || 1),
        v51 = Math["max"](1, Number(v47?.["height"]) || 1);
      if (v48?.["horizontal"]) v49["x"] = v50 - v49["x"];
      if (v48?.["vertical"]) v49["y"] = v51 - v49["y"];
      return v49;
    },
    _getLocalFromClient(v52, v53, v54, v55) {
      const v56 = screenToWorld(v52, v53, v54["viewport"]),
        v57 = { x: v56["x"] - v55["x"], y: v56["y"] - v55["y"] };
      if (!this["_isAnnotateScene"]()) return v57;
      return this["_applyFlipToLocalPoint"](
        v57,
        v55,
        this["_getCurrentFlipState"](),
      );
    },
    _applyStageFlip(v58 = this["_getCurrentFlipState"]()) {
      if (!this["stageEl"]) return;
      if (!this["_isAnnotateScene"]()) {
        this["stageEl"]["style"]["transform"] = "none";
        return;
      }
      const v59 = v58?.["horizontal"] ? -1 : 1,
        v60 = v58?.["vertical"] ? -1 : 1;
      ((this["stageEl"]["style"]["transformOrigin"] = "50% 50%"),
        (this["stageEl"]["style"]["transform"] =
          "scale(" + v59 + ",\x20" + v60 + ")"));
    },
    _applyFlipTransformToContext(
      v61,
      v62,
      v63,
      v64 = this["_getCurrentFlipState"](),
    ) {
      if (!v61) return;
      (v64?.["horizontal"] && (v61["translate"](v62, 0), v61["scale"](-1, 1)),
        v64?.["vertical"] && (v61["translate"](0, v63), v61["scale"](1, -1)));
    },
    _closeGenerationMenus() {
      if (!this["generationToolbarEl"]) return;
      (this["generationToolbarEl"]
        ["querySelectorAll"]("[data-toolbar-up-menu-menu]")
        ["forEach"]((v65) => {
          const v66 =
            String(v65?.["dataset"]?.["toolbarUpMenuOpenClass"] || "open")[
              "trim"
            ]() || "open";
          (v65["classList"]["remove"](v66),
            v65["classList"]["remove"]("open"),
            v65["classList"]["remove"]("show"));
        }),
        this["generationToolbarEl"]
          ["querySelector"](".model-menu")
          ?.["classList"]["remove"]("show"),
        this["generationToolbarEl"]
          ["querySelector"](".image-function-mode-menu")
          ?.["classList"]["remove"]("show"),
        closeImageFunctionModelSubmenus(
          this["generationToolbarEl"]["querySelector"](".model-menu"),
        ));
    },
    _createUI(v67, v68 = {}) {
      const v69 = document["createElement"]("div");
      v69["className"] = "v2-annotate-overlay";
      const v70 = document["createElement"]("div");
      v70["className"] = "v2-annotate-container";
      const v71 = document["createElement"]("div");
      v71["className"] = "v2-annotate-stage";
      const v72 = document["createElement"]("img");
      ((v72["className"] = "v2-annotate-img"),
        (v72["src"] = v67),
        (v72["draggable"] = false));
      const v73 = document["createElement"]("canvas");
      ((v73["className"] = "v2-annotate-canvas"),
        v71["appendChild"](v72),
        v71["appendChild"](v73),
        v70["appendChild"](v71));
      const v74 = document["createElement"]("div");
      ((v74["className"] = "v2-annotate-cursor"),
        (v74["style"]["display"] = "none"),
        v69["appendChild"](v74),
        v69["appendChild"](v70),
        document["body"]["appendChild"](v69),
        (this["overlayEl"] = v69),
        (this["containerEl"] = v70),
        (this["stageEl"] = v71),
        (this["imgEl"] = v72),
        (this["canvasEl"] = v73),
        (this["cursorEl"] = v74),
        this["_applyBaseSurface"]());
      const v75 = document["createElement"]("div");
      ((v75["className"] = "v2-annotate-toolbar"),
        setStaticInnerHTML(v75, ANNOTATE_TOOLBAR_TEMPLATE_ID),
        document["body"]["appendChild"](v75),
        (this["toolbarEl"] = v75));
      if (this["_isGenerationScene"]()) {
        const v76 = document["createElement"]("div");
        ((v76["className"] =
          "v2-annotate-toolbar v2-annotate-generation-toolbar"),
          (v76["innerHTML"] = createGenerationToolbarMarkup({
            scene: this["_mode"]?.["scene"] || "annotate",
            promptText: this["promptText"],
            imageSize: this["imageSize"],
            model: this["model"],
            provider: this["provider"],
            modelCatalog: this["_getGenerationModelCatalog"](),
            submitTooltip: this["_mode"]?.["submitLabel"] || "生成",
          })),
          document["body"]["appendChild"](v76),
          (this["generationToolbarEl"] = v76));
      }
      ((this["sizeValueEl"] = v75["querySelector"](".v2-annotate-size-value")),
        (this["sizeRangeEl"] = v75["querySelector"](".v2-annotate-size-range")),
        (this["colorWrapEl"] = v75["querySelector"](".v2-annotate-colorwrap")),
        (this["colorDotEl"] = v75["querySelector"](".v2-annotate-color-dot")),
        (this["colorMenuEl"] = v75["querySelector"](".v2-annotate-color-menu")),
        (this["colorButtons"] = Array["from"](
          v75["querySelectorAll"](".v2-annotate-swatch"),
        )));
      const v77 = getAnnotateToolbarToolsForScene(
        this["_mode"]?.["scene"] || "annotate",
      );
      (v75["querySelectorAll"](".tool-btn")["forEach"]((v78) => {
        if (!v77["includes"](v78["dataset"]["tool"])) v78["remove"]();
      }),
        (this["toolButtons"] = Array["from"](
          v75["querySelectorAll"](".tool-btn"),
        )));
      this["_isGenerationScene"]() &&
        (this["colorWrapEl"]?.["remove"](),
        (this["colorWrapEl"] = null),
        (this["colorDotEl"] = null),
        (this["colorMenuEl"] = null),
        (this["colorButtons"] = []));
      !this["_isAnnotateScene"]() &&
        (v75["querySelector"](".act-flip-horizontal")?.["remove"](),
        v75["querySelector"](".act-flip-vertical")?.["remove"]());
      const v79 = v75["querySelector"](".act-save"),
        v80 = v75["querySelector"](".act-new-board"),
        v81 = v79?.["querySelector"]("span"),
        v82 = this["_mode"]?.["submitLabel"] || "保存";
      if (v81) v81["textContent"] = v82;
      if (v79) v79["setAttribute"]("data-tooltip", v82);
      v79 && this["_isGenerationScene"]() && (v79["style"]["display"] = "none");
      v80 && this["_isGenerationScene"]() && (v80["style"]["display"] = "none");
      const v83 = clampImageBrushSize(
          v68["brushSizePx"],
          IMAGE_BRUSH_DEFAULT_SIZE_PX,
        ),
        v84 = v68["tool"] || "brush",
        v85 = v77["includes"](v84) ? v84 : "brush",
        v86 = normalizeColorName(v68["color"]);
      ((this["sizeRangeEl"]["value"] = String(v83)),
        (this["sizeValueEl"]["textContent"] = String(v83)),
        this["_updateToolActive"](v85, v83),
        this["_syncPaletteActive"](v86));
      if (this["_view"]) this["_updateView"](this["_view"]);
    },
    _bindEvents() {
      const v87 = (v88) => {
        const v89 =
          this["canvasEl"] &&
          (v88["target"] === this["canvasEl"] ||
            this["canvasEl"]["contains"](v88["target"]));
        if (v89) {
          this["_onCanvasWheel"](v88);
          return;
        }
        (v88["preventDefault"](), v88["stopPropagation"]());
      };
      this["overlayEl"]["addEventListener"]("wheel", v87, { passive: false });
      const v90 = () => {
        if (this["_view"]) this["_updateView"](this["_view"]);
      };
      window["addEventListener"]("resize", v90);
      const v91 = (v92) => {
        if (!this["active"]) return;
        const v93 = v92["target"],
          v94 = v93?.["tagName"]?.["toLowerCase"]?.() || "",
          v95 =
            v94 === "input" ||
            v94 === "textarea" ||
            v93?.["isContentEditable"] === true;
        if (v95) return;
        if (v92["altKey"] || v92["ctrlKey"] || v92["metaKey"]) return;
        const v96 = String(v92["key"] || "")["toLowerCase"]();
        if (v96 === "t" && !this["_isGenerationScene"]()) {
          (v92["preventDefault"](), this["_setTool"]("text"));
          return;
        }
        const v97 = v92["key"] === "Delete" || v92["key"] === "Backspace";
        if (!v97) return;
        const v98 = Number(this["_selectedTextCommandIndex"]);
        if (
          !Number["isInteger"](v98) ||
          v98 < 0 ||
          v98 >= this["_commands"]["length"]
        )
          return;
        if (this["_commands"][v98]?.["type"] !== "text") return;
        (v92["preventDefault"](), this["_deleteTextCommand"](v98));
      };
      window["addEventListener"]("keydown", v91);
      const v99 = () => {
          (window["removeEventListener"]("resize", v90),
            window["removeEventListener"]("keydown", v91),
            this["overlayEl"]?.["removeEventListener"]("wheel", v87),
            document["removeEventListener"]("pointerdown", v100, true));
        },
        v101 = this["exit"]["bind"](this);
      ((this["exit"] = (v102 = {}) => {
        (v99(), v101(v102));
      }),
        this["toolbarEl"]["addEventListener"]("pointerdown", (v103) =>
          v103["stopPropagation"](),
        ),
        this["toolbarEl"]
          ["querySelector"](".act-cancel")
          ["addEventListener"]("click", (v104) => {
            (v104["stopPropagation"](), this["exit"]());
          }),
        this["toolButtons"]["forEach"]((v105) => {
          v105["addEventListener"]("click", (v106) => {
            v106["stopPropagation"]();
            const v107 = v105["dataset"]["tool"];
            this["_setTool"](v107);
          });
        }));
      const v108 = () => {
          if (!this["colorWrapEl"]) return;
          this["colorWrapEl"]["classList"]["remove"]("open");
        },
        v100 = (v109) => {
          (this["colorWrapEl"] &&
            this["colorWrapEl"]["classList"]["contains"]("open") &&
            !this["colorWrapEl"]["contains"](v109["target"]) &&
            v108(),
            this["generationToolbarEl"] &&
              !this["generationToolbarEl"]["contains"](v109["target"]) &&
              this["_closeGenerationMenus"]());
        };
      (document["addEventListener"]("pointerdown", v100, true),
        this["colorWrapEl"]?.["addEventListener"]("pointerdown", (v110) =>
          v110["stopPropagation"](),
        ),
        this["colorWrapEl"]
          ?.["querySelector"](".v2-annotate-color-toggle")
          ?.["addEventListener"]("click", (v111) => {
            v111["stopPropagation"]();
            if (!this["colorWrapEl"]) return;
            this["colorWrapEl"]["classList"]["toggle"]("open");
          }),
        this["colorButtons"]["forEach"]((v112) => {
          v112["addEventListener"]("click", (v113) => {
            v113["stopPropagation"]();
            const v114 = v112["dataset"]["color"];
            (appStore["setAnnotateState"]({ color: v114 }), v108());
          });
        }),
        this["sizeRangeEl"]["addEventListener"]("input", (v115) => {
          const v116 = clampImageBrushSize(v115["target"]["value"], 1);
          (appStore["setAnnotateState"]({ brushSizePx: v116 }),
            (this["sizeValueEl"]["textContent"] = String(v116)),
            this["_syncCursor"](),
            this["_persistEraseSelectionState"]());
        }),
        this["toolbarEl"]
          ["querySelector"](".act-undo")
          ["addEventListener"]("click", (v117) => {
            (v117["stopPropagation"](), this["_undo"]());
          }),
        this["toolbarEl"]
          ["querySelector"](".act-flip-horizontal")
          ?.["addEventListener"]("click", (v118) => {
            (v118["stopPropagation"](), this["_flipHorizontal"]());
          }),
        this["toolbarEl"]
          ["querySelector"](".act-flip-vertical")
          ?.["addEventListener"]("click", (v119) => {
            (v119["stopPropagation"](), this["_flipVertical"]());
          }),
        this["toolbarEl"]
          ["querySelector"](".act-redo")
          ["addEventListener"]("click", (v120) => {
            (v120["stopPropagation"](), this["_redo"]());
          }),
        this["toolbarEl"]
          ["querySelector"](".act-clear")
          ["addEventListener"]("click", (v121) => {
            (v121["stopPropagation"](), this["_clear"]());
          }),
        this["toolbarEl"]
          ["querySelector"](".act-new-board")
          ?.["addEventListener"]("click", (v122) => {
            (v122["stopPropagation"](), this["_createNewWhiteboard"]());
          }),
        this["toolbarEl"]
          ["querySelector"](".act-save")
          ["addEventListener"]("click", async (v123) => {
            v123["stopPropagation"]();
            if (this["_mode"]?.["submitNoop"]) return;
            await this["_save"]();
          }));
      if (this["generationToolbarEl"]) {
        this["generationToolbarEl"]["addEventListener"]("pointerdown", (v124) =>
          v124["stopPropagation"](),
        );
        const v125 = this["generationToolbarEl"]["querySelector"](
            ".v2-annotate-gen-prompt-input",
          ),
          v126 = this["generationToolbarEl"]["querySelector"](".size-menu"),
          v127 = this["generationToolbarEl"]["querySelector"](".model-menu"),
          v128 = this["generationToolbarEl"]["querySelector"](".model-text"),
          v129 = this["generationToolbarEl"]["querySelector"](
            ".image-function-model-trigger-icon-slot",
          ),
          v130 = this["generationToolbarEl"]["querySelector"](".size-toggle"),
          v131 = this["generationToolbarEl"]["querySelector"](
            ".image-function-mode-toggle",
          ),
          v132 = this["generationToolbarEl"]["querySelector"](
            ".image-function-mode-menu",
          ),
          v133 = () => {
            const v134 = shouldDisableImageSizeControl(
              this["model"],
              this["provider"],
            );
            (v130 &&
              ((v130["disabled"] = v134),
              v130["classList"]["toggle"]("is-disabled", v134),
              v130["setAttribute"]("aria-disabled", v134 ? "true" : "false")),
              v126?.["querySelectorAll"]('[data-toolbar-up-menu-field="size"]')[
                "forEach"
              ]((v135) => {
                (v135["classList"]["toggle"]("disabled", v134),
                  (v135["dataset"]["disabled"] = v134 ? "true" : "false"));
              }),
              v134 && v126?.["classList"]["remove"]("open"));
          },
          v136 = () =>
            syncImageFunctionModeControl({
              root: this["generationToolbarEl"],
              model: this["model"],
              provider: this["provider"],
              imageSize: this["imageSize"],
            }),
          v137 = (v138, v139, { syncStore: syncStore = true } = {}) => {
            const v140 = String(v138 || "")["trim"](),
              v141 = String(v139 || getModelProvider(v140) || "")["trim"]();
            if (!v140 || !v141) return;
            const v142 = this["model"] !== v140 || this["provider"] !== v141;
            ((this["model"] = v140),
              (this["provider"] = v141),
              v128 &&
                (v128["textContent"] = getImageFunctionModelDisplayName(
                  v140,
                  this["_getGenerationModelCatalog"](),
                )),
              v129 &&
                (v129["innerHTML"] = getImageFunctionModelTriggerIconHTML(
                  v140,
                  v141,
                )),
              syncImageFunctionModelMenuActive({
                modelMenu: v127,
                model: v140,
                provider: v141,
              }),
              v136(),
              v133(),
              syncStore &&
                v142 &&
                this["nodeId"] &&
                appStore["updateNodeData"](this["nodeId"], {
                  model: v140,
                  provider: v141,
                }));
          },
          v143 = (v144 = null) => {
            this["generationToolbarEl"]
              ?.["querySelectorAll"]("[data-toolbar-up-menu-menu]")
              ["forEach"]((v145) => {
                if (v145 === v144) return;
                const v146 =
                  String(
                    v145?.["dataset"]?.["toolbarUpMenuOpenClass"] || "open",
                  )["trim"]() || "open";
                (v145["classList"]["remove"](v146),
                  v145["classList"]["remove"]("open"),
                  v145["classList"]["remove"]("show"));
              });
          },
          v147 = () => {
            (v143(),
              v127?.["classList"]["remove"]("show"),
              v132?.["classList"]["remove"]("show"),
              closeImageFunctionModelSubmenus(v127));
          };
        (v125?.["addEventListener"]("input", (v148) => {
          this["promptText"] = String(v148["target"]["value"] || "");
        }),
          (this["_unbindGenerationToolbarUpMenus"] = bindToolbarUpMenus(
            this["generationToolbarEl"],
            {
              onBeforeOpen: () => {
                (v127?.["classList"]["remove"]("show"),
                  v132?.["classList"]["remove"]("show"),
                  closeImageFunctionModelSubmenus(v127));
              },
              onSelect: ({ fieldId: v149, value: v150 }) => {
                if (v149 !== "size") return;
                if (
                  shouldDisableImageSizeControl(this["model"], this["provider"])
                )
                  return;
                this["imageSize"] = String(v150 || "1K")["trim"]() || "1K";
                const v151 = getImageFunctionNanoSelection(
                  this["model"],
                  this["provider"],
                  this["imageSize"],
                );
                if (v151) {
                  const v152 = resolveImageFunctionModelByMode({
                    model: this["model"],
                    provider: this["provider"],
                    imageSize: this["imageSize"],
                    mode: v151["mode"],
                  });
                  v152?.["model"] && v137(v152["model"], v152["provider"]);
                }
                (v136(), v133());
              },
            },
          )),
          this["generationToolbarEl"]
            ["querySelector"](".model-toggle")
            ?.["addEventListener"]("click", (v153) => {
              (v153["stopPropagation"](),
                v127?.["classList"]["toggle"]("show"),
                v143(),
                v132?.["classList"]["remove"]("show"));
            }));
        const v154 = bindImageFunctionModelMenu({
            modelMenu: v127,
            onSelect: ({ model: v155, provider: v156 }) => {
              v137(v155, v156);
            },
            closeMenu: () => {
              v127?.["classList"]["remove"]("show");
            },
          }),
          v157 = bindImageFunctionModeMenu({
            modeMenu: v132,
            onSelect: ({ mode: v158 }) => {
              const v159 = resolveImageFunctionModelByMode({
                model: this["model"],
                provider: this["provider"],
                imageSize: this["imageSize"],
                mode: v158,
              });
              if (!v159?.["model"]) return;
              (v137(v159["model"], v159["provider"]),
                v132?.["classList"]["remove"]("show"));
            },
          });
        ((this["_unbindGenerationFunctionMenus"] = () => {
          (v154?.(), v157?.());
        }),
          v131?.["addEventListener"]("click", (v160) => {
            v160["stopPropagation"]();
            if (
              v131["closest"](".image-function-mode-wrap")?.["classList"][
                "contains"
              ]("is-hidden")
            )
              return;
            (v132?.["classList"]["toggle"]("show"),
              v143(v132),
              v127?.["classList"]["remove"]("show"),
              closeImageFunctionModelSubmenus(v127));
          }),
          v136(),
          v133(),
          this["generationToolbarEl"]
            ["querySelector"](".go")
            ?.["addEventListener"]("click", async (v161) => {
              (v161["stopPropagation"](), await this["_save"]());
            }),
          this["generationToolbarEl"]
            ["querySelector"](".debug-wrench-btn")
            ?.["addEventListener"]("click", async (v162) => {
              (v162["stopPropagation"](), await this["_handleDebugRequest"]());
            }));
      }
      const v163 = this["canvasEl"]["getContext"]("2d");
      ((v163["lineCap"] = "round"),
        (v163["lineJoin"] = "round"),
        (this["_checkerPattern"] = createEraseCheckerboardPattern(v163, 1)));
      const v164 = {
          down: false,
          pointerId: null,
          previousTool: null,
          temporaryTool: null,
          textTransform: null,
        },
        v165 = (v166, v167) => {
          this["_cursorLast"] = { x: v166, y: v167 };
          if (this["_cursorRaf"]) return;
          this["_cursorRaf"] = requestAnimationFrame(() => {
            ((this["_cursorRaf"] = 0), this["_syncCursor"]());
          });
        },
        v168 = (v169, v170, v171, v172 = 0) => {
          const v173 = appStore["getStateRaw"](),
            v174 = v173["nodes"]?.[this["nodeId"]];
          if (!v174) return false;
          const v175 = screenToWorld(v169, v170, v173["viewport"]);
          if (
            !isPointInRect(
              v175["x"],
              v175["y"],
              v174["x"],
              v174["y"],
              v174["width"],
              v174["height"],
            )
          )
            return false;
          const v176 = this["_getLocalFromClient"](v169, v170, v173, v174),
            v177 = v173["annotate"]?.["tool"] || "brush",
            v178 = v172 === 1 || v172 === 2,
            v179 = v178 ? "eraser" : v177;
          if (v179 !== "text") this["_selectedTextCommandIndex"] = null;
          const v180 = clampImageBrushSize(
              v173["annotate"]?.["brushSizePx"],
              IMAGE_BRUSH_DEFAULT_SIZE_PX,
            ),
            v181 = v180 / (v173["viewport"]["zoom"] || 1);
          v178
            ? ((v164["previousTool"] = v177),
              (v164["temporaryTool"] = "eraser"),
              (this["_temporaryTool"] = "eraser"),
              this["_syncCursor"]("eraser", v180))
            : ((v164["previousTool"] = null),
              (v164["temporaryTool"] = null),
              (this["_temporaryTool"] = null));
          if (v179 === "bucket" && !this["_isEraseScene"]())
            return (this["_fillArea"](v176, v181), true);
          if (v179 === "text") {
            const v182 = this["_findTextHit"](v176, v173["viewport"]);
            if (v182) {
              (this["_removeTextInput"](true),
                (this["_selectedTextCommandIndex"] = v182["index"]));
              if (v182["mode"] === "delete")
                return (this["_deleteTextCommand"](v182["index"]), true);
              if (v182["mode"] === "copy")
                return (
                  this["_copyTextCommand"](v182["index"], v173["viewport"]),
                  true
                );
              return (
                (v164["down"] = true),
                (v164["pointerId"] = v171),
                (v164["textTransform"] = this["_createTextTransformState"](
                  v182,
                  v176,
                  v173["viewport"],
                )),
                this["canvasEl"]["setPointerCapture"](v171),
                this["_render"](),
                true
              );
            }
            return (
              (this["_selectedTextCommandIndex"] = null),
              this["_openTextInput"](v176, v173, v181, v169, v170),
              true
            );
          }
          if (v179 === "rect")
            this["_draft"] = {
              type: "rect",
              color: getColorCanvas(v173["annotate"]?.["color"] || "red"),
              sizeWorld: v181,
              x1: v176["x"],
              y1: v176["y"],
              x2: v176["x"],
              y2: v176["y"],
            };
          else
            v179 === "eraser"
              ? (this["_draft"] = {
                  type: "eraser",
                  sizeWorld: v181,
                  points: [v176],
                })
              : (this["_draft"] = {
                  type: "brush",
                  color: getColorCanvas(v173["annotate"]?.["color"] || "red"),
                  sizeWorld: v181,
                  points: [v176],
                });
          return (
            (v164["down"] = true),
            (v164["pointerId"] = v171),
            this["canvasEl"]["setPointerCapture"](v171),
            this["_render"](),
            true
          );
        },
        v183 = (v184, v185) => {
          const v186 = appStore["getStateRaw"](),
            v187 = v186["nodes"]?.[this["nodeId"]];
          if (!v187) return;
          const v188 = this["_getLocalFromClient"](v184, v185, v186, v187);
          if (v164["down"] && v164["textTransform"]) {
            const v189 = v164["textTransform"],
              v190 = this["_commands"][v189["index"]];
            if (v190?.["type"] === "text") {
              const v191 = v186["viewport"]?.["zoom"] || 1,
                v192 = {
                  x: Number(v188["x"] || 0) * v191,
                  y: Number(v188["y"] || 0) * v191,
                };
              if (v189["mode"] === "move")
                ((v190["x"] = v188["x"] - v189["offsetWorldX"]),
                  (v190["y"] = v188["y"] - v189["offsetWorldY"]));
              else {
                if (v189["mode"] === "scale-x" || v189["mode"] === "scale-y") {
                  const v193 = this["_resolveAxisTextScale"](v189, v192);
                  ((v190["scale"] = undefined),
                    (v190["scaleX"] = v193["scaleX"]),
                    (v190["scaleY"] = v193["scaleY"]),
                    (v190["x"] = v193["originPx"]["x"] / v191),
                    (v190["y"] = v193["originPx"]["y"] / v191));
                } else {
                  if (v189["mode"] === "scale-uniform") {
                    const v194 = this["_toTextLocalTransformSpace"](
                        v192,
                        v189["originPx"],
                        v189["rotation"],
                      ),
                      v195 = v194["x"] / v189["baseWidthPx"],
                      v196 = v194["y"] / v189["baseHeightPx"],
                      v197 = Math["max"](v195, v196),
                      v198 = Number["isFinite"](v197) && v197 > 0 ? v197 : 1;
                    ((v190["scale"] = undefined),
                      (v190["scaleX"] = clampTextScale(
                        v189["baseScaleX"] * v198,
                      )),
                      (v190["scaleY"] = clampTextScale(
                        v189["baseScaleY"] * v198,
                      )),
                      (v190["x"] = v189["originPx"]["x"] / v191),
                      (v190["y"] = v189["originPx"]["y"] / v191));
                  } else {
                    if (v189["mode"] === "rotate") {
                      const v199 = Math["atan2"](
                          v192["y"] - v189["centerPx"]["y"],
                          v192["x"] - v189["centerPx"]["x"],
                        ),
                        v200 =
                          v189["baseRotation"] + (v199 - v189["baseAngle"]);
                      v190["rotation"] = v200;
                      const { scaleX: v201, scaleY: v202 } =
                          getTextScalePair(v190),
                        v203 = {
                          x: (v189["layoutWidth"] * v201) / 2,
                          y: (v189["layoutHeight"] * v202) / 2,
                        },
                        v204 = Math["cos"](v200),
                        v205 = Math["sin"](v200),
                        v206 = v203["x"] * v204 - v203["y"] * v205,
                        v207 = v203["x"] * v205 + v203["y"] * v204,
                        v208 = {
                          x: v189["centerPx"]["x"] - v206,
                          y: v189["centerPx"]["y"] - v207,
                        };
                      ((v190["x"] = v208["x"] / v191),
                        (v190["y"] = v208["y"] / v191));
                    }
                  }
                }
              }
              ((this["_selectedTextCommandIndex"] = v189["index"]),
                this["_render"]());
            }
            return;
          }
          if (!v164["down"] || !this["_draft"]) return;
          (this["_draft"]["type"] === "rect"
            ? ((this["_draft"]["x2"] = v188["x"]),
              (this["_draft"]["y2"] = v188["y"]))
            : this["_draft"]["points"]["push"](v188),
            this["_render"]());
        },
        v209 = () => {
          if (v164["down"] && v164["textTransform"]) {
            ((v164["down"] = false),
              (v164["pointerId"] = null),
              (v164["textTransform"] = null),
              (v164["previousTool"] = null),
              (v164["temporaryTool"] = null),
              (this["_temporaryTool"] = null),
              (this["_redoStack"] = []),
              (this["_dirty"] = true),
              this["_persistEraseSelectionState"](),
              this["_render"]());
            return;
          }
          if (!v164["down"] || !this["_draft"]) return;
          const v210 = this["_draft"];
          ((this["_draft"] = null),
            (v164["down"] = false),
            (v164["pointerId"] = null));
          const v211 = v164["previousTool"];
          ((v164["previousTool"] = null),
            (v164["temporaryTool"] = null),
            (v164["textTransform"] = null),
            (this["_temporaryTool"] = null));
          if (shouldDiscardStrokeCommand(v210)) {
            v211
              ? this["_syncCursor"](v211, this["_view"]?.["brushSizePx"])
              : this["_syncCursor"]();
            this["_render"]();
            return;
          }
          if (v210["type"] === "rect") {
            const v212 = Math["abs"](v210["x2"] - v210["x1"]),
              v213 = Math["abs"](v210["y2"] - v210["y1"]);
            if (v212 < 0.5 && v213 < 0.5) {
              v211
                ? this["_syncCursor"](v211, this["_view"]?.["brushSizePx"])
                : this["_syncCursor"]();
              this["_render"]();
              return;
            }
          }
          (this["_commands"]["push"](v210),
            (this["_redoStack"] = []),
            (this["_dirty"] = true),
            this["_persistEraseSelectionState"](),
            v211 && this["_syncCursor"](v211, this["_view"]?.["brushSizePx"]),
            this["_render"]());
        };
      (this["canvasEl"]["addEventListener"]("pointerdown", (v214) => {
        (v214["preventDefault"](),
          v214["stopPropagation"](),
          v165(v214["clientX"], v214["clientY"]),
          v168(
            v214["clientX"],
            v214["clientY"],
            v214["pointerId"],
            v214["button"],
          ));
      }),
        this["canvasEl"]["addEventListener"]("contextmenu", (v215) => {
          (v215["preventDefault"](), v215["stopPropagation"]());
        }),
        this["canvasEl"]["addEventListener"]("pointermove", (v216) => {
          (v216["preventDefault"](),
            v216["stopPropagation"](),
            v165(v216["clientX"], v216["clientY"]),
            v183(v216["clientX"], v216["clientY"]));
        }),
        this["canvasEl"]["addEventListener"]("pointerup", (v217) => {
          (v217["preventDefault"](),
            v217["stopPropagation"](),
            v165(v217["clientX"], v217["clientY"]),
            v209());
        }),
        this["canvasEl"]["addEventListener"]("pointercancel", (v218) => {
          (v218["preventDefault"](),
            v218["stopPropagation"](),
            v165(v218["clientX"], v218["clientY"]),
            v209());
        }),
        this["canvasEl"]["addEventListener"]("pointerenter", (v219) => {
          ((this["_cursorHover"] = true),
            v165(v219["clientX"], v219["clientY"]));
        }),
        this["canvasEl"]["addEventListener"]("pointerleave", () => {
          ((this["_cursorHover"] = false), this["_syncCursor"]());
        }));
    },
    _syncPaletteActive() {
      if (!this["colorButtons"]) return;
      const v220 = normalizeColorName(this["_view"]?.["color"]) || "red",
        v221 = getColorCss(v220);
      (this["colorDotEl"] &&
        ((this["colorDotEl"]["style"]["background"] = v221),
        (this["colorDotEl"]["style"]["borderColor"] =
          v220 === "black"
            ? "var(--white-35)"
            : v220 === "white"
              ? "var(--white-25)"
              : "var(--black-20)")),
        this["colorButtons"]["forEach"]((v222) => {
          if (v222["dataset"]["color"] === v220)
            v222["classList"]["add"]("active");
          else v222["classList"]["remove"]("active");
        }));
    },
    _onCanvasWheel(v223) {
      (v223["preventDefault"](), v223["stopPropagation"]());
      if (!this["active"]) return;
      if (!this["_cursorHover"]) return;
      const v224 = this["_view"]?.["tool"] || "brush";
      if (
        v224 !== "brush" &&
        v224 !== "eraser" &&
        v224 !== "bucket" &&
        v224 !== "text"
      )
        return;
      const v225 = v223["deltaY"] || 0,
        v226 = v225 < 0 ? 1 : -1,
        v227 = clampImageBrushSize(
          this["_view"]?.["brushSizePx"],
          IMAGE_BRUSH_DEFAULT_SIZE_PX,
        ),
        v228 = clampImageBrushSize(
          v227 + v226 * 2,
          IMAGE_BRUSH_DEFAULT_SIZE_PX,
        );
      if (v228 === v227) return;
      appStore["setAnnotateState"]({ brushSizePx: v228 });
      if (this["sizeRangeEl"]) this["sizeRangeEl"]["value"] = String(v228);
      if (this["sizeValueEl"])
        this["sizeValueEl"]["textContent"] = String(v228);
      this["_syncCursor"]();
    },
    _syncCursor(
      v229 = this["_temporaryTool"] || this["_view"]?.["tool"] || "brush",
      v230 = this["_view"]?.["brushSizePx"] || IMAGE_BRUSH_DEFAULT_SIZE_PX,
    ) {
      if (!this["cursorEl"]) return;
      if (v229 === "text") {
        ((this["cursorEl"]["style"]["display"] = "none"),
          this["cursorEl"]["classList"]["remove"]("is-erase-brush"),
          this["_syncTextToolCursor"]());
        return;
      }
      syncCircularBrushCursor({
        cursorEl: this["cursorEl"],
        canvasEl: this["canvasEl"],
        visible: this["_cursorHover"],
        tool: v229,
        allowedTools: ["brush", "eraser", "bucket"],
        sizePx: v230,
        cursorLast: this["_cursorLast"],
        isEraseBrush: this["_isGenerationScene"]() || v229 === "eraser",
      });
    },
    _getTextScaleCursor(v231) {
      const v232 =
        document["querySelector"]("#v2-wrap .group-resizer.v2-resize-move") ||
        document["querySelector"]("#v2-wrap .v2-resize-move");
      if (v232) {
        const v233 = getComputedStyle(v232)["cursor"];
        if (v233 && v233 !== "auto") return v233;
      }
      return "move";
    },
    _getCanvasPointerCursor() {
      return getCssVar("--pointer-cursor") || "default";
    },
    _syncTextToolCursor() {
      if (!this["canvasEl"]) return;
      const v234 = this["_getCanvasPointerCursor"]();
      if (!this["_cursorHover"]) {
        this["canvasEl"]["style"]["cursor"] = v234;
        return;
      }
      const v235 = appStore["getStateRaw"](),
        v236 = v235["nodes"]?.[this["nodeId"]];
      if (!v236) {
        this["canvasEl"]["style"]["cursor"] = v234;
        return;
      }
      const v237 = this["_getLocalFromClient"](
          this["_cursorLast"]["x"],
          this["_cursorLast"]["y"],
          v235,
          v236,
        ),
        v238 = this["_findTextHit"](v237, v235["viewport"]);
      if (!v238) {
        this["canvasEl"]["style"]["cursor"] = v234;
        return;
      }
      if (v238["mode"] === "delete" || v238["mode"] === "copy") {
        this["canvasEl"]["style"]["cursor"] = "var(--link-cursor)";
        return;
      }
      if (v238["mode"] === "rotate") {
        this["canvasEl"]["style"]["cursor"] =
          ROTATE_CURSOR_CSS + ",\x20" + v234;
        return;
      }
      if (v238["mode"] === "scale-uniform") {
        this["canvasEl"]["style"]["cursor"] = this["_getTextScaleCursor"](v238);
        return;
      }
      if (v238["mode"] === "scale-x") {
        this["canvasEl"]["style"]["cursor"] = "var(--resize-ew-cursor)";
        return;
      }
      if (v238["mode"] === "scale-y") {
        this["canvasEl"]["style"]["cursor"] = "var(--resize-ns-cursor)";
        return;
      }
      this["canvasEl"]["style"]["cursor"] = v234;
    },
    _updateToolActive(
      v239 = this["_view"]?.["tool"] || "brush",
      v240 = this["_view"]?.["brushSizePx"] || IMAGE_BRUSH_DEFAULT_SIZE_PX,
    ) {
      (this["toolButtons"]["forEach"]((v241) => {
        if (v241["dataset"]["tool"] === v239)
          v241["classList"]["add"]("active");
        else v241["classList"]["remove"]("active");
      }),
        this["_syncCursor"](v239, v240));
    },
    _setTool(v242) {
      if (v242 !== "text") this["_removeTextInput"](true);
      if (v242 !== "text") this["_selectedTextCommandIndex"] = null;
      const v243 = getAnnotateToolbarToolsForScene(
          this["_mode"]?.["scene"] || "annotate",
        ),
        v244 = v243["includes"](v242) ? v242 : "brush";
      (appStore["setAnnotateState"]({ tool: v244 }),
        this["_persistEraseSelectionState"]());
    },
    _removeTextInput(v245 = true, v246 = null) {
      const v247 = v246 || this["_textInputEl"];
      if (!v247) return;
      const v248 = this["_textInputEl"] === v247,
        v249 = String(v247["value"] || "")["trim"](),
        v250 = Number(v247["dataset"]["localX"]),
        v251 = Number(v247["dataset"]["localY"]),
        v252 = Number(v247["dataset"]["sizeWorld"]),
        v253 = String(v247["dataset"]["color"] || "");
      v247["parentElement"] && v247["parentElement"]["removeChild"](v247);
      v248 && (this["_textInputEl"] = null);
      if (!v248) return;
      if (
        !v245 ||
        !v249 ||
        !Number["isFinite"](v250) ||
        !Number["isFinite"](v251) ||
        !Number["isFinite"](v252)
      )
        return;
      (this["_commands"]["push"]({
        type: "text",
        text: v249["slice"](0, 200),
        color: v253 || getColorCanvas("red"),
        sizeWorld: v252,
        x: v250,
        y: v251,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      }),
        (this["_selectedTextCommandIndex"] = this["_commands"]["length"] - 1),
        (this["_redoStack"] = []),
        (this["_dirty"] = true),
        this["_persistEraseSelectionState"](),
        this["_render"]());
    },
    _openTextInput(v254, v255, v256, v257, v258) {
      this["_removeTextInput"](true);
      const v259 = document["createElement"]("input");
      ((v259["type"] = "text"),
        (v259["maxLength"] = 200),
        (v259["className"] = "v2-annotate-text-input"),
        (v259["dataset"]["localX"] = String(v254["x"])),
        (v259["dataset"]["localY"] = String(v254["y"])),
        (v259["dataset"]["sizeWorld"] = String(v256)),
        (v259["dataset"]["color"] = getColorCanvas(
          v255["annotate"]?.["color"] || "red",
        )),
        (v259["style"]["left"] = v257 + "px"),
        (v259["style"]["top"] = v258 + "px"),
        v259["style"]["setProperty"](
          "--annotate-text-input-size",
          clampImageBrushSize(
            v255["annotate"]?.["brushSizePx"],
            IMAGE_BRUSH_DEFAULT_SIZE_PX,
          ) + "px",
        ),
        v259["style"]["setProperty"](
          "--annotate-text-input-color",
          v259["dataset"]["color"] || getColorCanvas("red"),
        ));
      let v260 = false;
      const v261 = (v262) => {
        if (v260) return;
        ((v260 = true), this["_removeTextInput"](v262, v259));
      };
      (v259["addEventListener"]("pointerdown", (v263) =>
        v263["stopPropagation"](),
      ),
        v259["addEventListener"]("keydown", (v264) => {
          if (v264["key"] === "Enter" && !v264["isComposing"])
            (v264["preventDefault"](), v261(true));
          else
            v264["key"] === "Escape" && (v264["preventDefault"](), v261(false));
        }),
        v259["addEventListener"]("blur", () => v261(true)),
        this["overlayEl"]?.["appendChild"](v259),
        (this["_textInputEl"] = v259),
        requestAnimationFrame(() => {
          if (this["_textInputEl"] === v259) v259["focus"]();
        }));
    },
    _getTextLayout(v265, v266) {
      return getTextLayout({
        canvasEl: this["canvasEl"],
        cmd: v265,
        viewport: v266,
      });
    },
    _getTextGeometry(v267, v268) {
      return getTextGeometry({
        canvasEl: this["canvasEl"],
        cmd: v267,
        viewport: v268,
      });
    },
    _toTextLocalTransformSpace(v269, v270, v271) {
      return toTextLocalTransformSpace(v269, v270, v271);
    },
    _rotateTextLocalPoint(v272, v273) {
      return rotateTextLocalPoint(v272, v273);
    },
    _resolveAxisTextScale(v274, v275) {
      return resolveAxisTextScale(v274, v275);
    },
    _deleteTextCommand(v276) {
      const v277 = Number(v276);
      if (
        !Number["isInteger"](v277) ||
        this["_commands"][v277]?.["type"] !== "text"
      )
        return false;
      return (
        this["_commands"]["splice"](v277, 1),
        (this["_selectedTextCommandIndex"] = null),
        (this["_redoStack"] = []),
        (this["_dirty"] = true),
        this["_persistEraseSelectionState"](),
        this["_render"](),
        true
      );
    },
    _copyTextCommand(v278, v279 = this["_view"]?.["viewport"]) {
      const v280 = Number(v278),
        v281 = this["_commands"][v280];
      if (!Number["isInteger"](v280) || v281?.["type"] !== "text") return false;
      const v282 = buildCopiedTextCommand(v281, v279);
      return (
        this["_commands"]["splice"](v280 + 1, 0, v282),
        (this["_selectedTextCommandIndex"] = v280 + 1),
        (this["_redoStack"] = []),
        (this["_dirty"] = true),
        this["_persistEraseSelectionState"](),
        this["_render"](),
        true
      );
    },
    deleteSelectedTextCommand() {
      const v283 = Number(this["_selectedTextCommandIndex"]);
      if (!Number["isInteger"](v283)) return false;
      return this["_deleteTextCommand"](v283);
    },
    _findTextHit(v284, v285) {
      return findTextHit({
        commands: this["_commands"],
        selectedTextCommandIndex: this["_selectedTextCommandIndex"],
        local: v284,
        viewport: v285,
        canvasEl: this["canvasEl"],
      });
    },
    _createTextTransformState(v286, v287, v288) {
      return createTextTransformState({
        commands: this["_commands"],
        hit: v286,
        local: v287,
        viewport: v288,
        canvasEl: this["canvasEl"],
      });
    },
    _normalizeSelectedTextCommand() {
      const v289 = Number(this["_selectedTextCommandIndex"]);
      if (
        !Number["isInteger"](v289) ||
        v289 < 0 ||
        v289 >= this["_commands"]["length"]
      ) {
        this["_selectedTextCommandIndex"] = null;
        return;
      }
      this["_commands"][v289]?.["type"] !== "text" &&
        (this["_selectedTextCommandIndex"] = null);
    },
    _updateView(v290) {
      if (!this["active"]) return;
      const v291 = v290?.["node"],
        v292 = v290?.["viewport"];
      if (!v291) return;
      this["nodeData"] = v291;
      const v293 = clampImageBrushSize(
        v290?.["brushSizePx"],
        IMAGE_BRUSH_DEFAULT_SIZE_PX,
      );
      if (this["sizeRangeEl"] && Number(this["sizeRangeEl"]["value"]) !== v293)
        this["sizeRangeEl"]["value"] = String(v293);
      if (
        this["sizeValueEl"] &&
        this["sizeValueEl"]["textContent"] !== String(v293)
      )
        this["sizeValueEl"]["textContent"] = String(v293);
      (this["_updateToolActive"](v290?.["tool"], v293),
        this["_syncPaletteActive"](v290?.["color"]));
      const v294 = worldToScreen(v291["x"], v291["y"], v292),
        v295 = Math["round"](v291["width"] * v292["zoom"]),
        v296 = Math["round"](v291["height"] * v292["zoom"]);
      ((this["containerEl"]["style"]["left"] = Math["round"](v294["x"]) + "px"),
        (this["containerEl"]["style"]["top"] = Math["round"](v294["y"]) + "px"),
        (this["containerEl"]["style"]["width"] = v295 + "px"),
        (this["containerEl"]["style"]["height"] = v296 + "px"));
      const v297 = window["devicePixelRatio"] || 1,
        v298 = Math["max"](1, v295),
        v299 = Math["max"](1, v296);
      if (
        this["canvasEl"]["width"] !== Math["round"](v298 * v297) ||
        this["canvasEl"]["height"] !== Math["round"](v299 * v297)
      ) {
        ((this["canvasEl"]["width"] = Math["round"](v298 * v297)),
          (this["canvasEl"]["height"] = Math["round"](v299 * v297)),
          (this["canvasEl"]["style"]["width"] = v298 + "px"),
          (this["canvasEl"]["style"]["height"] = v299 + "px"));
        const v300 = this["canvasEl"]["getContext"]("2d");
        (v300["setTransform"](v297, 0, 0, v297, 0, 0),
          (v300["lineCap"] = "round"),
          (v300["lineJoin"] = "round"));
      }
      const v301 = Math["max"](12, Math["round"](v294["y"]) - 54);
      ((this["toolbarEl"]["style"]["left"] =
        Math["round"](v294["x"] + v295 / 2) + "px"),
        (this["toolbarEl"]["style"]["top"] = v301 + "px"),
        this["generationToolbarEl"] &&
          ((this["generationToolbarEl"]["style"]["left"] =
            Math["round"](v294["x"] + v295 / 2) + "px"),
          (this["generationToolbarEl"]["style"]["top"] =
            Math["round"](v294["y"] + v296 + 14) + "px"),
          (this["generationToolbarEl"]["style"]["bottom"] = "auto"),
          (this["generationToolbarEl"]["style"]["transform"] =
            "translateX(-50%)")),
        this["_applyStageFlip"](this["_getCurrentFlipState"]()),
        this["_render"](v292));
    },
    _render(v302 = this["_view"]?.["viewport"]) {
      if (!this["active"] || !this["canvasEl"]) return;
      this["_applyStageFlip"](this["_getCurrentFlipState"]());
      const v303 = this["canvasEl"]["getContext"]("2d"),
        v304 =
          Number(this["canvasEl"]["style"]["width"]["replace"]("px", "")) || 1,
        v305 =
          Number(this["canvasEl"]["style"]["height"]["replace"]("px", "")) || 1;
      v303["clearRect"](0, 0, v304, v305);
      if (this["_isGenerationScene"]()) {
        this["_renderEraseSceneCommands"](
          v303,
          v302,
          this["_commands"],
          this["_draft"],
        );
        return;
      }
      this["_renderCommands"](v303, v302, this["_commands"]);
      if (this["_draft"])
        this["_renderCommands"](v303, v302, [this["_draft"]], true);
    },
    _renderEraseSceneCommands(v306, v307, v308 = [], v309 = null) {
      this["_eraseMaskCanvasEl"] = renderEraseSceneCommands({
        documentRef: document,
        canvasEl: this["canvasEl"],
        ctx: v306,
        viewport: v307,
        commands: v308,
        draft: v309,
        checkerPattern: this["_checkerPattern"],
        eraseMaskCanvasEl: this["_eraseMaskCanvasEl"],
      });
    },
    _renderCommands(v310, v311, v312, v313 = false) {
      renderCommands({
        ctx: v310,
        viewport: v311,
        canvasEl: this["canvasEl"],
        commands: v312,
        isDraft: v313,
        isEraseScene: this["_isEraseScene"](),
        checkerPattern: this["_checkerPattern"],
        defaultTextColor: getColorCanvas("red"),
        getTextGeometry: (v314, v315) => this["_getTextGeometry"](v314, v315),
        selectedTextCommandIndex: this["_selectedTextCommandIndex"],
        selectedCommandsRef: this["_commands"],
        resolveCssVar: getCssVar,
        fillRegionCache: this["_fillRegionCache"],
      });
    },
    _fillArea(v316, v317) {
      const v318 = appStore["getStateRaw"](),
        v319 = {
          type: "fill",
          x: Number(v316?.["x"]) || 0,
          y: Number(v316?.["y"]) || 0,
          color: getColorCanvas(v318["annotate"]?.["color"] || "red"),
        };
      (this["_commands"]["push"](v319),
        (this["_redoStack"] = []),
        (this["_dirty"] = true),
        this["_persistEraseSelectionState"](),
        this["_render"]());
    },
    _pushFlipCommand(v320) {
      if (!this["active"] || !this["_isAnnotateScene"]()) return;
      if (v320 !== "flip-horizontal" && v320 !== "flip-vertical") return;
      (this["_removeTextInput"](true),
        this["_commands"]["push"]({ type: v320 }),
        (this["_redoStack"] = []),
        (this["_dirty"] = true),
        this["_normalizeSelectedTextCommand"](),
        this["_render"]());
    },
    _flipHorizontal() {
      this["_pushFlipCommand"]("flip-horizontal");
    },
    _flipVertical() {
      this["_pushFlipCommand"]("flip-vertical");
    },
    _undo() {
      if (this["_commands"]["length"] === 0) return;
      const v321 = this["_commands"]["pop"]();
      (this["_redoStack"]["push"](v321),
        (this["_dirty"] = true),
        this["_normalizeSelectedTextCommand"](),
        this["_persistEraseSelectionState"](),
        this["_render"]());
    },
    _redo() {
      if (this["_redoStack"]["length"] === 0) return;
      const v322 = this["_redoStack"]["pop"]();
      (this["_commands"]["push"](v322),
        (this["_dirty"] = true),
        this["_normalizeSelectedTextCommand"](),
        this["_persistEraseSelectionState"](),
        this["_render"]());
    },
    _clear() {
      if (
        this["_commands"]["length"] === 0 &&
        this["_redoStack"]["length"] === 0
      )
        return;
      ((this["_commands"] = []),
        (this["_redoStack"] = []),
        (this["_draft"] = null),
        (this["_selectedTextCommandIndex"] = null),
        (this["_dirty"] = true),
        this["_persistEraseSelectionState"](),
        this["_render"]());
    },
    _applyBaseSurface() {
      if (!this["stageEl"] || !this["imgEl"]) return;
      const v323 = Boolean(this["_useWhiteboardBase"]);
      (this["stageEl"]["classList"]["toggle"]("is-whiteboard", v323),
        this["overlayEl"]?.["classList"]["toggle"]("is-whiteboard", v323),
        this["imgEl"]["setAttribute"]("aria-hidden", v323 ? "true" : "false"));
    },
    _createNewWhiteboard() {
      if (!this["active"] || this["_isGenerationScene"]()) return;
      (this["_removeTextInput"](false),
        (this["_commands"] = []),
        (this["_redoStack"] = []),
        (this["_draft"] = null),
        (this["_selectedTextCommandIndex"] = null),
        (this["_useWhiteboardBase"] = true),
        (this["_dirty"] = true),
        appStore["setAnnotateState"]({ color: "black" }),
        this["_applyBaseSurface"](),
        this["_render"](),
        window["showToast"]?.("已切换为新画板", "ok"));
    },
    _persistEraseSelectionState() {
      if (!this["_isEraseScene"]() || !this["nodeId"]) return;
      const v324 = appStore["getStateRaw"]()["nodes"]?.[this["nodeId"]];
      if (!v324) return;
      const v325 = appStore["getStateRaw"]()["annotate"] || {},
        v326 = buildPersistedEraseSelectionState({
          commands: this["_commands"],
          tool: v325["tool"],
          brushSizePx: v325["brushSizePx"],
        });
      appStore["updateNodeData"](this["nodeId"], {
        [ERASE_SELECTION_STATE_KEY]: v326,
      });
    },
    _buildSelectionMaskCanvas(v327, v328, v329, v330) {
      return buildSelectionMaskCanvas({
        documentRef: document,
        commands: this["_commands"],
        naturalW: v327,
        naturalH: v328,
        scaleX: v329,
        scaleY: v330,
      });
    },
    async _buildGenerationPayload(v331, v332) {
      return buildGenerationPayload({
        scene: this["_mode"]?.["scene"],
        commands: this["_commands"],
        promptText: this["promptText"],
        node: v331,
        imgUrl: v332,
        model: this["model"],
        provider: this["provider"],
        imageSize: this["imageSize"],
        erasePrompt: ERASE_GENERATE_PROMPT,
        loadImage: (v333) => this["_loadImage"](v333),
        createSelectionMaskCanvas: (v334, v335, v336, v337) =>
          this["_buildSelectionMaskCanvas"](v334, v335, v336, v337),
        getModelProvider: getModelProvider,
        notify: (v338, v339) => window["showToast"]?.(v338, v339),
        documentRef: document,
        urlApi: URL,
      });
    },
    async _handleDebugRequest() {
      if (!this["active"] || !this["_isGenerationScene"]()) return;
      const v340 = appStore["getState"](),
        v341 = v340["nodes"]?.[this["nodeId"]];
      if (!v341) return;
      const v342 = this["_resolveNodeImageUrl"](v341);
      if (!v342) return;
      let v343 = "";
      try {
        const v344 = await this["_buildGenerationPayload"](v341, v342);
        if (!v344?.["payload"]) return;
        v343 = v344["inputUrl"] || "";
        const v345 = await buildGenerateImageRequest(v344["payload"]),
          v346 = formatFinalApiDebugRequest(v345),
          v347 = v341["x"] + (v341["width"] || 380) + 50,
          v348 = v341["y"];
        let v349 = Object["values"](v340["nodes"])["find"](
          (v350) => v350["type"] === "debug",
        );
        (!v349
          ? appStore["addNode"]({
              id: "debug-" + Date["now"](),
              type: "debug",
              x: v347,
              y: v348,
              width: 380,
              height: 300,
              name: "调试节点",
              outputText: v346,
            })
          : appStore["updateNodeData"](v349["id"], {
              outputText: v346,
              x: v347,
              y: v348,
            }),
          window["showToast"]?.("🔧\x20已展示最终\x20API\x20参数", "warn"));
      } catch (v351) {
        window["showToast"]?.("构造请求失败: " + v351["message"], "error");
      } finally {
        if (v343) URL["revokeObjectURL"](v343);
      }
    },
    async _generateEraseResult(v352, v353) {
      const v354 = await this["_buildGenerationPayload"](v352, v353);
      if (!v354?.["payload"]) return;
      await runGenerationResultFlow({
        scene: "erase",
        built: v354,
        sourceNode: v352,
        fallbackModel: this["model"],
        fallbackProvider: this["provider"],
        exitController: (v355) => this["exit"](v355),
        notify: (v356, v357) => window["showToast"]?.(v356, v357),
      });
    },
    async _generateRepaintResult(v358, v359) {
      const v360 = await this["_buildGenerationPayload"](v358, v359);
      if (!v360?.["payload"]) return;
      await runGenerationResultFlow({
        scene: "repaint",
        built: v360,
        sourceNode: v358,
        fallbackModel: this["model"],
        fallbackProvider: this["provider"],
        exitController: (v361) => this["exit"](v361),
        notify: (v362, v363) => window["showToast"]?.(v362, v363),
      });
    },
    async _save() {
      if (!this["active"]) return;
      this["_removeTextInput"](true);
      const v364 = appStore["getState"](),
        v365 = v364["nodes"][this["nodeId"]];
      if (!v365) return;
      const v366 = this["_resolveNodeImageUrl"](v365);
      if (!v366) return;
      const v367 =
          this["generationToolbarEl"]?.["querySelector"](".go") ||
          this["toolbarEl"]["querySelector"](".act-save"),
        v368 = v367?.["querySelector"]("span") || null,
        v369 = v368 ? v368["textContent"] : "";
      if (v368)
        v368["textContent"] = this["_mode"]?.["submitBusyLabel"] || "保存中...";
      if (!v367) return;
      v367["style"]["pointerEvents"] = "none";
      try {
        if (this["_isEraseScene"]()) {
          await this["_generateEraseResult"](v365, v366);
          return;
        }
        if (this["_isRepaintScene"]()) {
          await this["_generateRepaintResult"](v365, v366);
          return;
        }
        const v370 = this["_isEraseScene"](),
          v371 = !v370 && this["_useWhiteboardBase"],
          { blob: v372, exportType: v373 } = await exportAnnotateCanvasBlob({
            documentRef: document,
            node: v365,
            imgEl: this["imgEl"],
            imgUrl: v366,
            commands: this["_commands"],
            useWhiteboardBase: v371,
            isEraseScene: v370,
            loadImage: (v374) => this["_loadImage"](v374),
            getCurrentFlipState: () => this["_getCurrentFlipState"](),
            applyFlipTransformToContext: (v375, v376, v377, v378) =>
              this["_applyFlipTransformToContext"](v375, v376, v377, v378),
            createSelectionMaskCanvas: (v379, v380, v381, v382) =>
              this["_buildSelectionMaskCanvas"](v379, v380, v381, v382),
            canvasWhiteColor: getCssVar("--canvas-white"),
            defaultTextColor: getColorCanvas("red"),
          });
        (await saveAnnotateExportResult({
          blob: v372,
          exportType: v373,
          scene: this["_mode"]?.["scene"],
          sourceNodeId: this["nodeId"],
          baseNode: v365,
          notify: (v383, v384) => window["showToast"]?.(v383, v384),
          triggerLocalCacheSave: () => window["_triggerLocalCacheSave"]?.(),
        }),
          this["exit"]({ silent: true }));
      } catch (v385) {
        (console["error"]("[Annotate] 保存失败:", v385),
          window["showToast"]?.("保存失败", "error"));
      } finally {
        if (v368) v368["textContent"] = v369;
        v367["style"]["pointerEvents"] = "auto";
      }
    },
    _resolveNodeImageUrl(v386) {
      const v387 = v386["mainImageIndex"] || 0,
        v388 = v386["images"] && v386["images"][v387],
        v389 = v386["localPath"] || v388?.["localPath"],
        v390 = localPathToUrl(v389);
      if (v390) return v390;
      return (
        v386["src"] ||
        v386["sourceUrl"] ||
        v386["imageUrl"] ||
        v386["thumbUrl"] ||
        v388?.["imageUrl"] ||
        v388?.["thumbUrl"] ||
        ""
      );
    },
    _loadImage(v391) {
      return new Promise((v392, v393) => {
        const v394 = new Image();
        ((v394["crossOrigin"] = "anonymous"),
          (v394["onload"] = () => v392(v394)),
          (v394["onerror"] = () => v393(new Error("图像加载失败"))),
          (v394["src"] = v391));
      });
    },
  };
export default ImageAnnotateController;

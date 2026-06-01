import appStore from "../core/stores/appStore.js";
import { saveOutputBlob } from "./project.js";
import {
  generateId,
  screenToWorld,
  worldToScreen,
  isPointInRect,
} from "../core/math.js";
import { commit } from "./history.js";
import {
  buildBinaryBoundaryMask,
  floodFillRegion,
  getCachedSealedFillRegion,
  paintFilledRegion,
  sealRegionToBoundary,
} from "./bucketFill.js";
import {
  IMAGE_BRUSH_MAX_SIZE_PX,
  clampImageBrushSize,
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
  syncCircularBrushCursor,
} from "./imageEditorBrushStyle.js";
import { getPixelToolPalette } from "./pixelToolPalette.js";
import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
const getCssVar = (v0) =>
    getComputedStyle(document["documentElement"])
      ["getPropertyValue"](v0)
      ["trim"](),
  DEFAULT_MATTING_BRUSH_SIZE_PX = 40,
  MAX_MATTING_BRUSH_SIZE_PX = IMAGE_BRUSH_MAX_SIZE_PX,
  OPAQUE_MASK_PREVIEW_CLEAR = "black";
function clampMattingBrushSize(v1, v2 = DEFAULT_MATTING_BRUSH_SIZE_PX) {
  return clampImageBrushSize(v1, v2);
}
const isFiniteCommandPoint = (v3) =>
    Number["isFinite"](Number(v3?.["x"])) &&
    Number["isFinite"](Number(v3?.["y"])),
  hasDrawableStrokePoints = (v4) =>
    Array["isArray"](v4?.["points"]) &&
    v4["points"]["some"](isFiniteCommandPoint),
  shouldDiscardStrokeCommand = (v5) =>
    (v5?.["type"] === "brush" || v5?.["type"] === "eraser") &&
    !hasDrawableStrokePoints(v5),
  MATTING_TOOLBAR_HTML =
    '\n      <button class="v2-matting-btn icon-only act-cancel" data-tooltip="取消 (Esc)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>\n      <div class="v2-matting-divider"></div>\n      <button class="v2-matting-btn icon-only tool-btn active" data-tool="brush" data-brush-mode="normal" data-tooltip="画笔 B（再按切换模式）">\n        <svg class="brush-icon-normal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>\n        <svg class="brush-icon-alpha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="display:none"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="M3 3h6v6H3z" fill="currentColor" fill-opacity="0.3"/></svg>\n      </button>\n      <button class="v2-matting-btn icon-only tool-btn" data-tool="eraser" data-tooltip="橡皮擦 E"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg></button>\n      <button class="v2-matting-btn icon-only tool-btn" data-tool="bucket" data-tooltip="油漆桶 G"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 11l-8-8-8.5 8.5a2.12 2.12 0 0 0 0 3l4 4a2.12 2.12 0 0 0 3 0L19 11z"/><path d="M16 14l-3.5 3.5"/><path d="M12 18l-2 2"/><path d="M20 20l-2-2"/></svg></button>\n      <div class="v2-matting-divider"></div>\n      <div class="v2-matting-size"><span class="v2-matting-size-value"></span><input class="v2-matting-size-range" type="range" min="1" max="' +
    MAX_MATTING_BRUSH_SIZE_PX +
    '" step="1"></div>\n      <div class="v2-matting-divider"></div>\n      <button class="v2-matting-btn icon-only act-undo" data-tooltip="撤销 Ctrl+Z"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg></button>\n      <button class="v2-matting-btn icon-only act-redo" data-tooltip="重绘 Ctrl+Y"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M15 14l4-4-4-4"/><path d="M19 10H10a6 6 0 1 0 0 12h3"/></svg></button>\n      <button class="v2-matting-btn icon-only act-clear" data-tooltip="清空 R"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/></svg></button>\n      <button class="v2-matting-btn v2-matting-save act-save" data-tooltip="保存"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v4h8"/></svg><span>保存</span></button>\n    ',
  ImageMattingController = {
    active: false,
    nodeId: null,
    nodeData: null,
    overlayEl: null,
    containerEl: null,
    imgEl: null,
    canvasEl: null,
    toolbarEl: null,
    sizeValueEl: null,
    sizeRangeEl: null,
    toolButtons: null,
    cursorEl: null,
    _cursorHover: false,
    _cursorLast: { x: 0, y: 0 },
    _cursorRaf: 0,
    _unsubscribe: null,
    _commands: [],
    _redoStack: [],
    _draft: null,
    _dirty: false,
    _baseMaskCleared: false,
    _view: null,
    _normalMaskCanvas: null,
    _normalOverlayCanvas: null,
    _alphaMaskCanvas: null,
    _alphaOverlayCanvas: null,
    _fillRegionCache: null,
    init(v6) {
      if (this["active"]) return;
      const v7 = appStore["getStateRaw"](),
        v8 = v7["nodes"]?.[v6];
      if (!v8) return;
      const v9 = this["_resolveNodeImageUrl"](v8);
      if (!v9) {
        window["showToast"]?.("没有可抠图的图像", "warn");
        return;
      }
      const v10 = new Set(["brush", "eraser", "bucket"]),
        v11 = v10["has"](v7["matting"]?.["tool"])
          ? v7["matting"]["tool"]
          : "brush",
        v12 = clampMattingBrushSize(v7["matting"]?.["brushSizePx"]),
        v13 = v7["matting"]?.["brushMode"] || "normal";
      ((this["active"] = true),
        (this["nodeId"] = v6),
        (this["nodeData"] = v8),
        (this["_commands"] = []),
        (this["_redoStack"] = []),
        (this["_draft"] = null),
        (this["_dirty"] = false),
        (this["_baseMaskCleared"] = false),
        (this["_fillRegionCache"] = new Map()),
        (this["_view"] = {
          tool: v11,
          brushSizePx: v12,
          brushMode: v13,
          viewport: v7["viewport"],
          node: v8,
        }),
        appStore["setMattingState"]({
          active: true,
          nodeId: v6,
          tool: v11,
          brushSizePx: v12,
          brushMode: v13,
        }),
        this["_createUI"](v9, { tool: v11, brushSizePx: v12, brushMode: v13 }),
        this["_loadExistingMask"](),
        this["_bindEvents"](),
        (this["_unsubscribe"] = appStore["subscribeSelector"](
          (v14) => {
            const v15 = v14["nodes"]?.[v6],
              v16 = v14["viewport"] || { x: 0, y: 0, zoom: 1 },
              v17 = v14["matting"] || {};
            return {
              hasNode: !!v15,
              nx: v15 ? v15["x"] : 0,
              ny: v15 ? v15["y"] : 0,
              nw: v15 ? v15["width"] : 0,
              nh: v15 ? v15["height"] : 0,
              vx: v16["x"],
              vy: v16["y"],
              vz: v16["zoom"] || 1,
              tool: v17["tool"] || "brush",
              brushSizePx: clampMattingBrushSize(v17["brushSizePx"]),
              brushMode: v17["brushMode"] || "normal",
            };
          },
          (v18) => {
            if (!v18?.["hasNode"]) return;
            ((this["_view"] = {
              tool: v18["tool"],
              brushSizePx: v18["brushSizePx"],
              brushMode: v18["brushMode"],
              viewport: { x: v18["vx"], y: v18["vy"], zoom: v18["vz"] },
              node: {
                x: v18["nx"],
                y: v18["ny"],
                width: v18["nw"],
                height: v18["nh"],
              },
            }),
              this["_updateView"](this["_view"]));
          },
        )),
        this["_waitForImageAndShow"]());
    },
    _waitForImageAndShow() {
      const v19 = () => {
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
        } else requestAnimationFrame(v19);
      };
      v19();
    },
    exit({ silent: silent = false } = {}) {
      if (!this["active"]) return;
      !silent && this["_dirty"] && window["showToast"]?.("已取消抠图", "ok");
      ((this["active"] = false),
        (this["nodeId"] = null),
        (this["nodeData"] = null),
        (this["_commands"] = []),
        (this["_redoStack"] = []),
        (this["_draft"] = null),
        (this["_dirty"] = false),
        (this["_normalMaskCanvas"] = null),
        (this["_normalOverlayCanvas"] = null),
        (this["_alphaMaskCanvas"] = null),
        (this["_alphaOverlayCanvas"] = null),
        (this["_fillRegionCache"] = null),
        appStore["setMattingState"]({ active: false, nodeId: null }));
      this["_unsubscribe"] &&
        (this["_unsubscribe"](), (this["_unsubscribe"] = null));
      if (this["overlayEl"]) this["overlayEl"]["remove"]();
      if (this["toolbarEl"]) this["toolbarEl"]["remove"]();
      ((this["overlayEl"] = null),
        (this["containerEl"] = null),
        (this["imgEl"] = null),
        (this["canvasEl"] = null),
        (this["toolbarEl"] = null),
        (this["sizeValueEl"] = null),
        (this["sizeRangeEl"] = null),
        (this["toolButtons"] = null),
        (this["cursorEl"] = null),
        (this["_cursorHover"] = false),
        (this["_cursorLast"] = { x: 0, y: 0 }),
        (this["_cursorRaf"] = 0),
        (this["_view"] = null));
    },
    _createUI(v20, v21 = {}) {
      const v22 = document["createElement"]("div");
      v22["className"] = "v2-matting-overlay";
      const v23 = document["createElement"]("div");
      v23["className"] = "v2-matting-container";
      const v24 = document["createElement"]("img");
      ((v24["className"] = "v2-matting-img"),
        (v24["src"] = v20),
        (v24["draggable"] = false));
      const v25 = document["createElement"]("canvas");
      v25["className"] = "v2-matting-canvas";
      const v26 = document["createElement"]("div");
      ((v26["className"] = "v2-matting-cursor"),
        (v26["style"]["display"] = "none"),
        v23["appendChild"](v24),
        v23["appendChild"](v25),
        v22["appendChild"](v26),
        v22["appendChild"](v23),
        document["body"]["appendChild"](v22),
        (this["overlayEl"] = v22),
        (this["containerEl"] = v23),
        (this["imgEl"] = v24),
        (this["canvasEl"] = v25),
        (this["cursorEl"] = v26));
      const v27 = document["createElement"]("div");
      ((v27["className"] = "v2-matting-toolbar"),
        (v27["innerHTML"] = MATTING_TOOLBAR_HTML),
        document["body"]["appendChild"](v27),
        (this["toolbarEl"] = v27),
        (this["sizeValueEl"] = v27["querySelector"](".v2-matting-size-value")),
        (this["sizeRangeEl"] = v27["querySelector"](".v2-matting-size-range")),
        (this["toolButtons"] = Array["from"](
          v27["querySelectorAll"](".tool-btn"),
        )));
      const v28 = clampMattingBrushSize(v21["brushSizePx"]),
        v29 = v21["tool"] || "brush";
      ((this["sizeRangeEl"]["value"] = String(v28)),
        (this["sizeValueEl"]["textContent"] = String(v28)),
        this["_updateToolActive"](v29, v28));
      if (this["_view"]) this["_updateView"](this["_view"]);
    },
    _bindEvents() {
      const v30 = (v31) => {
        const v32 =
          this["canvasEl"] &&
          (v31["target"] === this["canvasEl"] ||
            this["canvasEl"]["contains"](v31["target"]));
        if (v32) {
          this["_onCanvasWheel"](v31);
          return;
        }
        (v31["preventDefault"](), v31["stopPropagation"]());
      };
      this["overlayEl"]["addEventListener"]("wheel", v30, { passive: false });
      const v33 = () => {
        if (this["_view"]) this["_updateView"](this["_view"]);
      };
      window["addEventListener"]("resize", v33);
      const v34 = () => {
          (window["removeEventListener"]("resize", v33),
            this["overlayEl"]?.["removeEventListener"]("wheel", v30));
        },
        v35 = this["exit"]["bind"](this);
      ((this["exit"] = (v36 = {}) => {
        (v34(), v35(v36));
      }),
        this["toolbarEl"]["addEventListener"]("pointerdown", (v37) =>
          v37["stopPropagation"](),
        ),
        this["toolbarEl"]
          ["querySelector"](".act-cancel")
          ["addEventListener"]("click", (v38) => {
            (v38["stopPropagation"](), this["exit"]());
          }),
        this["toolButtons"]["forEach"]((v39) => {
          v39["addEventListener"]("click", (v40) => {
            v40["stopPropagation"]();
            const v41 = v39["dataset"]["tool"];
            this["_switchTool"](v41);
          });
        }),
        this["sizeRangeEl"]["addEventListener"]("input", (v42) => {
          const v43 = clampMattingBrushSize(v42["target"]["value"], 1);
          (appStore["setMattingState"]({ brushSizePx: v43 }),
            (this["sizeValueEl"]["textContent"] = String(v43)),
            this["_syncCursor"]());
        }),
        this["toolbarEl"]
          ["querySelector"](".act-undo")
          ["addEventListener"]("click", (v44) => {
            (v44["stopPropagation"](), this["_undo"]());
          }),
        this["toolbarEl"]
          ["querySelector"](".act-redo")
          ["addEventListener"]("click", (v45) => {
            (v45["stopPropagation"](), this["_redo"]());
          }),
        this["toolbarEl"]
          ["querySelector"](".act-clear")
          ["addEventListener"]("click", (v46) => {
            (v46["stopPropagation"](), this["_clear"]());
          }),
        this["toolbarEl"]
          ["querySelector"](".act-save")
          ["addEventListener"]("click", async (v47) => {
            (v47["stopPropagation"](), await this["_save"]());
          }));
      const v48 = this["canvasEl"]["getContext"]("2d");
      ((v48["lineCap"] = "round"), (v48["lineJoin"] = "round"));
      const v49 = { down: false, pointerId: null },
        v50 = (v51, v52) => {
          this["_cursorLast"] = { x: v51, y: v52 };
          if (this["_cursorRaf"]) return;
          this["_cursorRaf"] = requestAnimationFrame(() => {
            ((this["_cursorRaf"] = 0), this["_syncCursor"]());
          });
        },
        v53 = (v54, v55, v56, v57 = 0) => {
          const v58 = appStore["getStateRaw"](),
            v59 = v58["nodes"]?.[this["nodeId"]];
          if (!v59) return false;
          const v60 = screenToWorld(v54, v55, v58["viewport"]);
          if (
            !isPointInRect(
              v60["x"],
              v60["y"],
              v59["x"],
              v59["y"],
              v59["width"],
              v59["height"],
            )
          )
            return false;
          const v61 = { x: v60["x"] - v59["x"], y: v60["y"] - v59["y"] },
            v62 = v58["matting"]?.["tool"] || "brush";
          if (v62 === "bucket") {
            const v63 = clampMattingBrushSize(v58["matting"]?.["brushSizePx"]),
              v64 = v63 / (v58["viewport"]["zoom"] || 1);
            return (this["_fillArea"](v61, v64), true);
          }
          const v65 = clampMattingBrushSize(v58["matting"]?.["brushSizePx"]),
            v66 = v65 / (v58["viewport"]["zoom"] || 1),
            v67 = v58["matting"]?.["brushMode"] || "normal";
          return (
            v62 === "eraser"
              ? (this["_draft"] = {
                  type: "eraser",
                  sizeWorld: v66,
                  points: [v61],
                })
              : (this["_draft"] = {
                  type: "brush",
                  sizeWorld: v66,
                  points: [v61],
                  mode: v67,
                }),
            (v49["down"] = true),
            (v49["pointerId"] = v56),
            this["canvasEl"]["setPointerCapture"](v56),
            this["_render"](),
            true
          );
        },
        v68 = (v69, v70) => {
          if (!v49["down"] || !this["_draft"]) return;
          const v71 = appStore["getStateRaw"](),
            v72 = v71["nodes"]?.[this["nodeId"]];
          if (!v72) return;
          const v73 = screenToWorld(v69, v70, v71["viewport"]),
            v74 = { x: v73["x"] - v72["x"], y: v73["y"] - v72["y"] };
          (this["_draft"]["points"]["push"](v74), this["_render"]());
        },
        v75 = () => {
          if (!v49["down"] || !this["_draft"]) return;
          const v76 = this["_draft"];
          ((this["_draft"] = null),
            (v49["down"] = false),
            (v49["pointerId"] = null));
          if (shouldDiscardStrokeCommand(v76)) {
            this["_render"]();
            return;
          }
          (this["_commands"]["push"](v76),
            (this["_redoStack"] = []),
            (this["_dirty"] = true),
            this["_render"]());
        };
      (this["canvasEl"]["addEventListener"]("pointerdown", (v77) => {
        (v77["preventDefault"](),
          v77["stopPropagation"](),
          v50(v77["clientX"], v77["clientY"]),
          v53(v77["clientX"], v77["clientY"], v77["pointerId"], v77["button"]));
      }),
        this["canvasEl"]["addEventListener"]("pointermove", (v78) => {
          (v78["preventDefault"](),
            v78["stopPropagation"](),
            v50(v78["clientX"], v78["clientY"]),
            v68(v78["clientX"], v78["clientY"]));
        }),
        this["canvasEl"]["addEventListener"]("pointerup", (v79) => {
          (v79["preventDefault"](),
            v79["stopPropagation"](),
            v50(v79["clientX"], v79["clientY"]),
            v75());
        }),
        this["canvasEl"]["addEventListener"]("pointercancel", (v80) => {
          (v80["preventDefault"](),
            v80["stopPropagation"](),
            v50(v80["clientX"], v80["clientY"]),
            v75());
        }),
        this["canvasEl"]["addEventListener"]("pointerenter", (v81) => {
          ((this["_cursorHover"] = true), v50(v81["clientX"], v81["clientY"]));
        }),
        this["canvasEl"]["addEventListener"]("pointerleave", () => {
          ((this["_cursorHover"] = false), this["_syncCursor"]());
        }));
    },
    _onCanvasWheel(v82) {
      (v82["preventDefault"](), v82["stopPropagation"]());
      if (!this["active"]) return;
      if (!this["_cursorHover"]) return;
      const v83 = this["_view"]?.["tool"] || "brush";
      if (v83 !== "brush" && v83 !== "eraser" && v83 !== "bucket") return;
      const v84 = v82["deltaY"] || 0,
        v85 = v84 < 0 ? 1 : -1,
        v86 = clampMattingBrushSize(this["_view"]?.["brushSizePx"]),
        v87 = clampMattingBrushSize(v86 + v85 * 2);
      if (v87 === v86) return;
      appStore["setMattingState"]({ brushSizePx: v87 });
      if (this["sizeRangeEl"]) this["sizeRangeEl"]["value"] = String(v87);
      if (this["sizeValueEl"]) this["sizeValueEl"]["textContent"] = String(v87);
      this["_syncCursor"]();
    },
    _syncCursor(
      v88 = this["_view"]?.["tool"] || "brush",
      v89 = this["_view"]?.["brushSizePx"] || DEFAULT_MATTING_BRUSH_SIZE_PX,
    ) {
      if (!this["cursorEl"]) return;
      syncCircularBrushCursor({
        cursorEl: this["cursorEl"],
        canvasEl: this["canvasEl"],
        visible: this["_cursorHover"],
        tool: v88,
        allowedTools: ["brush", "eraser", "bucket"],
        sizePx: v89,
        cursorLast: this["_cursorLast"],
      });
    },
    _switchTool(v90) {
      const v91 = this["toolButtons"]["find"](
        (v92) => v92["dataset"]["tool"] === v90,
      );
      if (!v91) return;
      if (v91["disabled"]) return;
      const v93 = appStore["getState"](),
        v94 = v93["matting"]?.["tool"];
      if (v90 === "brush") {
        if (v94 === "brush") {
          const v95 = v91["dataset"]["brushMode"] || "normal",
            v96 = v95 === "normal" ? "alpha" : "normal";
          ((v91["dataset"]["brushMode"] = v96),
            appStore["setMattingState"]({ tool: v90, brushMode: v96 }),
            (v91["dataset"]["tooltip"] =
              v96 === "normal"
                ? "画笔（点击切换模式）"
                : "Alpha遮罩画笔（点击切换模式）"));
          const v97 = v91["querySelector"](".brush-icon-normal"),
            v98 = v91["querySelector"](".brush-icon-alpha");
          v97 &&
            v98 &&
            ((v97["style"]["display"] = v96 === "normal" ? "block" : "none"),
            (v98["style"]["display"] = v96 === "alpha" ? "block" : "none"));
        } else appStore["setMattingState"]({ tool: v90 });
      } else appStore["setMattingState"]({ tool: v90 });
      this["_updateToolActive"]();
    },
    _changeBrushSize(v99) {
      const v100 = clampMattingBrushSize(this["_view"]?.["brushSizePx"]),
        v101 = clampMattingBrushSize(v100 + v99);
      if (v101 !== v100) {
        appStore["setMattingState"]({ brushSizePx: v101 });
        if (this["sizeRangeEl"]) this["sizeRangeEl"]["value"] = String(v101);
        if (this["sizeValueEl"])
          this["sizeValueEl"]["textContent"] = String(v101);
        this["_syncCursor"]();
      }
    },
    _updateToolActive(
      v102 = this["_view"]?.["tool"] || "brush",
      v103 = this["_view"]?.["brushSizePx"] || DEFAULT_MATTING_BRUSH_SIZE_PX,
    ) {
      (this["toolButtons"]["forEach"]((v104) => {
        if (v104["dataset"]["tool"] === v102)
          v104["classList"]["add"]("active");
        else v104["classList"]["remove"]("active");
      }),
        this["_syncCursor"](v102, v103));
    },
    _updateView(v105) {
      if (!this["active"]) return;
      const v106 = v105?.["node"],
        v107 = v105?.["viewport"];
      if (!v106) return;
      this["nodeData"] = v106;
      const v108 = clampMattingBrushSize(v105?.["brushSizePx"]);
      if (this["sizeRangeEl"] && Number(this["sizeRangeEl"]["value"]) !== v108)
        this["sizeRangeEl"]["value"] = String(v108);
      if (
        this["sizeValueEl"] &&
        this["sizeValueEl"]["textContent"] !== String(v108)
      )
        this["sizeValueEl"]["textContent"] = String(v108);
      this["_updateToolActive"](v105?.["tool"], v108);
      const v109 = worldToScreen(v106["x"], v106["y"], v107),
        v110 = Math["round"](v106["width"] * v107["zoom"]),
        v111 = Math["round"](v106["height"] * v107["zoom"]);
      ((this["containerEl"]["style"]["left"] = Math["round"](v109["x"]) + "px"),
        (this["containerEl"]["style"]["top"] = Math["round"](v109["y"]) + "px"),
        (this["containerEl"]["style"]["width"] = v110 + "px"),
        (this["containerEl"]["style"]["height"] = v111 + "px"));
      const v112 = window["devicePixelRatio"] || 1,
        v113 = Math["max"](1, v110),
        v114 = Math["max"](1, v111);
      if (
        this["canvasEl"]["width"] !== Math["round"](v113 * v112) ||
        this["canvasEl"]["height"] !== Math["round"](v114 * v112)
      ) {
        ((this["canvasEl"]["width"] = Math["round"](v113 * v112)),
          (this["canvasEl"]["height"] = Math["round"](v114 * v112)),
          (this["canvasEl"]["style"]["width"] = v113 + "px"),
          (this["canvasEl"]["style"]["height"] = v114 + "px"));
        const v115 = this["canvasEl"]["getContext"]("2d");
        (v115["setTransform"](v112, 0, 0, v112, 0, 0),
          (v115["lineCap"] = "round"),
          (v115["lineJoin"] = "round"));
      }
      const v116 = Math["max"](12, Math["round"](v109["y"]) - 54);
      ((this["toolbarEl"]["style"]["left"] =
        Math["round"](v109["x"] + v110 / 2) + "px"),
        (this["toolbarEl"]["style"]["top"] = v116 + "px"),
        this["_render"](v107));
    },
    _render(v117 = this["_view"]?.["viewport"]) {
      if (!this["active"] || !this["canvasEl"]) return;
      const v118 = this["canvasEl"]["getContext"]("2d"),
        v119 =
          Number(this["canvasEl"]["style"]["width"]["replace"]("px", "")) || 1,
        v120 =
          Number(this["canvasEl"]["style"]["height"]["replace"]("px", "")) || 1;
      v118["clearRect"](0, 0, v119, v120);
      const v121 = this["_commands"],
        v122 = this["_prepareNormalMaskCanvas"](v119, v120),
        v123 = this["_prepareAlphaMaskCanvas"](v119, v120);
      this["_renderCommands"](v118, v117, v121, false, {
        normalMaskCtx: v122,
        alphaMaskCtx: v123,
        boundarySource: v121,
      });
      if (this["_draft"]) {
        const v124 = v121["concat"]([this["_draft"]]);
        this["_renderCommands"](v118, v117, [this["_draft"]], true, {
          normalMaskCtx: v122,
          alphaMaskCtx: v123,
          boundarySource: v124,
        });
      }
      (this["_compositeNormalMask"](v118, v119, v120),
        this["_compositeAlphaMask"](v118, v117, v119, v120));
    },
    _prepareNormalMaskCanvas(v125, v126) {
      const v127 = Math["max"](1, Math["round"](v125 || 1)),
        v128 = Math["max"](1, Math["round"](v126 || 1));
      if (
        !this["_normalMaskCanvas"] ||
        this["_normalMaskCanvas"]["width"] !== v127 ||
        this["_normalMaskCanvas"]["height"] !== v128
      ) {
        const v129 = document["createElement"]("canvas");
        ((v129["width"] = v127),
          (v129["height"] = v128),
          (this["_normalMaskCanvas"] = v129));
      }
      if (
        !this["_normalOverlayCanvas"] ||
        this["_normalOverlayCanvas"]["width"] !== v127 ||
        this["_normalOverlayCanvas"]["height"] !== v128
      ) {
        const v130 = document["createElement"]("canvas");
        ((v130["width"] = v127),
          (v130["height"] = v128),
          (this["_normalOverlayCanvas"] = v130));
      }
      const v131 = this["_normalMaskCanvas"]["getContext"]("2d");
      if (!v131) return null;
      return (
        v131["clearRect"](0, 0, v127, v128),
        (v131["lineCap"] = "round"),
        (v131["lineJoin"] = "round"),
        v131
      );
    },
    _prepareAlphaMaskCanvas(v132, v133) {
      const v134 = Math["max"](1, Math["round"](v132 || 1)),
        v135 = Math["max"](1, Math["round"](v133 || 1));
      if (
        !this["_alphaMaskCanvas"] ||
        this["_alphaMaskCanvas"]["width"] !== v134 ||
        this["_alphaMaskCanvas"]["height"] !== v135
      ) {
        const v136 = document["createElement"]("canvas");
        ((v136["width"] = v134),
          (v136["height"] = v135),
          (this["_alphaMaskCanvas"] = v136));
      }
      if (
        !this["_alphaOverlayCanvas"] ||
        this["_alphaOverlayCanvas"]["width"] !== v134 ||
        this["_alphaOverlayCanvas"]["height"] !== v135
      ) {
        const v137 = document["createElement"]("canvas");
        ((v137["width"] = v134),
          (v137["height"] = v135),
          (this["_alphaOverlayCanvas"] = v137));
      }
      const v138 = this["_alphaMaskCanvas"]["getContext"]("2d");
      if (!v138) return null;
      return (
        v138["clearRect"](0, 0, v134, v135),
        (v138["lineCap"] = "round"),
        (v138["lineJoin"] = "round"),
        v138
      );
    },
    _compositeNormalMask(v139, v140, v141) {
      if (!v139 || !this["_normalMaskCanvas"] || !this["_normalOverlayCanvas"])
        return;
      const v142 = Math["max"](1, Number(v140) || 1),
        v143 = Math["max"](1, Number(v141) || 1),
        v144 = this["_normalOverlayCanvas"]["getContext"]("2d");
      if (!v144) return;
      const v145 = getPixelToolPalette();
      (v144["clearRect"](0, 0, v142, v143),
        v144["save"](),
        (v144["globalCompositeOperation"] = "source-over"),
        (v144["globalAlpha"] = 1),
        (v144["fillStyle"] = v145["maskPreviewFill"]),
        v144["fillRect"](0, 0, v142, v143),
        (v144["globalCompositeOperation"] = "destination-in"),
        v144["drawImage"](this["_normalMaskCanvas"], 0, 0, v142, v143),
        v144["restore"](),
        v139["save"](),
        (v139["globalCompositeOperation"] = "source-over"),
        (v139["globalAlpha"] = 1),
        v139["drawImage"](this["_normalOverlayCanvas"], 0, 0, v142, v143),
        v139["restore"]());
    },
    _compositeAlphaMask(v146, v147, v148, v149) {
      if (!v146 || !this["_alphaMaskCanvas"] || !this["_alphaOverlayCanvas"])
        return;
      const v150 = Math["max"](1, Number(v148) || 1),
        v151 = Math["max"](1, Number(v149) || 1),
        v152 = this["_alphaOverlayCanvas"]["getContext"]("2d");
      if (!v152) return;
      v152["clearRect"](0, 0, v150, v151);
      const v153 = v147?.["zoom"] || 1,
        v154 = this["_createCheckerboardPattern"](v152, v153);
      (v152["save"](),
        (v152["globalCompositeOperation"] = "source-over"),
        (v152["globalAlpha"] = 0.8),
        (v152["fillStyle"] = v154),
        v152["fillRect"](0, 0, v150, v151),
        (v152["globalCompositeOperation"] = "destination-in"),
        (v152["globalAlpha"] = 1),
        v152["drawImage"](this["_alphaMaskCanvas"], 0, 0, v150, v151),
        v152["restore"](),
        v146["save"](),
        (v146["globalCompositeOperation"] = "source-over"),
        (v146["globalAlpha"] = 1),
        v146["drawImage"](this["_alphaOverlayCanvas"], 0, 0, v150, v151),
        v146["restore"]());
    },
    _renderCommands(v155, v156, v157, v158 = false, v159 = {}) {
      const v160 = v156["zoom"] || 1,
        v161 =
          Number(
            this["canvasEl"]?.["style"]?.["width"]?.["replace"]("px", ""),
          ) || 1,
        v162 =
          Number(
            this["canvasEl"]?.["style"]?.["height"]?.["replace"]("px", ""),
          ) || 1,
        v163 = getPixelToolPalette(),
        v164 = v159["normalMaskCtx"] || null,
        v165 = v159["alphaMaskCtx"] || null,
        v166 = Array["isArray"](v159["boundarySource"])
          ? v159["boundarySource"]
          : v157;
      v157["forEach"]((v167, v168) => {
        if (v167["type"] === "mask-preview") {
          if (!v167["img"]) return;
          const v169 =
              Number(
                this["canvasEl"]?.["style"]?.["width"]?.["replace"]("px", ""),
              ) || 1,
            v170 =
              Number(
                this["canvasEl"]?.["style"]?.["height"]?.["replace"]("px", ""),
              ) || 1;
          (v155["save"](),
            (v155["globalCompositeOperation"] = "source-over"),
            v155["drawImage"](v167["img"], 0, 0, v169, v170),
            v155["restore"]());
          return;
        }
        if (v167["type"] === "mask-base") {
          if (!v167["canvas"] || !v164) return;
          const v171 =
              Number(
                this["canvasEl"]?.["style"]?.["width"]?.["replace"]("px", ""),
              ) || 1,
            v172 =
              Number(
                this["canvasEl"]?.["style"]?.["height"]?.["replace"]("px", ""),
              ) || 1;
          (v164["save"](),
            (v164["globalCompositeOperation"] = "source-over"),
            v164["drawImage"](v167["canvas"], 0, 0, v171, v172),
            v164["restore"]());
          return;
        }
        if (v167["type"] === "brush") {
          v155["save"]();
          const v173 = v167["mode"] === "alpha",
            v174 = mapBrushPoints(v167["points"], v160, v160),
            v175 = getBrushLineWidth(v167["sizeWorld"], v160, "brush");
          if (v173) {
            if (v165)
              (v165["save"](),
                drawRoundBrushStroke(v165, {
                  points: v174,
                  lineWidth: v175,
                  strokeStyle: "#fff",
                  fillStyle: "#fff",
                  globalCompositeOperation: "source-over",
                }),
                v165["restore"]());
            else {
              const v176 = this["_createCheckerboardPattern"](v155, v160);
              drawRoundBrushStroke(v155, {
                points: v174,
                lineWidth: v175,
                strokeStyle: v176,
                fillStyle: v176,
                globalCompositeOperation: "source-over",
                globalAlpha: 0.8,
              });
            }
          } else
            v164
              ? (v164["save"](),
                drawRoundBrushStroke(v164, {
                  points: v174,
                  lineWidth: v175,
                  strokeStyle: "#fff",
                  fillStyle: "#fff",
                  globalCompositeOperation: "source-over",
                }),
                v164["restore"]())
              : (drawRoundBrushStroke(v155, {
                  points: v174,
                  lineWidth: getEraserClearLineWidth(v175),
                  strokeStyle: OPAQUE_MASK_PREVIEW_CLEAR,
                  fillStyle: OPAQUE_MASK_PREVIEW_CLEAR,
                  globalCompositeOperation: "destination-out",
                }),
                drawRoundBrushStroke(v155, {
                  points: v174,
                  lineWidth: v175,
                  strokeStyle: v163["maskPreviewFill"],
                  fillStyle: v163["maskPreviewFill"],
                  globalCompositeOperation: "source-over",
                  globalAlpha: 1,
                }));
          v155["restore"]();
          return;
        }
        if (v167["type"] === "eraser") {
          const v177 = mapBrushPoints(v167["points"], v160, v160),
            v178 = getEraserClearLineWidth(
              getBrushLineWidth(v167["sizeWorld"], v160, "eraser"),
            );
          (v155["save"](),
            drawRoundBrushStroke(v155, {
              points: v177,
              lineWidth: v178,
              strokeStyle: "#000",
              fillStyle: "#000",
              globalCompositeOperation: "destination-out",
            }),
            v155["restore"]());
          v164 &&
            (v164["save"](),
            drawRoundBrushStroke(v164, {
              points: v177,
              lineWidth: v178,
              strokeStyle: "#000",
              fillStyle: "#000",
              globalCompositeOperation: "destination-out",
            }),
            v164["restore"]());
          v165 &&
            (v165["save"](),
            drawRoundBrushStroke(v165, {
              points: v177,
              lineWidth: v178,
              strokeStyle: "#000",
              fillStyle: "#000",
              globalCompositeOperation: "destination-out",
            }),
            v165["restore"]());
          return;
        }
        if (v167["type"] === "fill") {
          const v179 = v167["mode"] === "alpha",
            v180 = Number(v167["x"] ?? v167["startPoint"]?.["x"]) || 0,
            v181 = Number(v167["y"] ?? v167["startPoint"]?.["y"]) || 0,
            v182 = v166["indexOf"](v167),
            v183 = v182 >= 0 ? v166["slice"](0, v182) : v157["slice"](0, v168),
            v184 = v183["filter"](
              (v185) =>
                v185?.["type"] === "brush" || v185?.["type"] === "eraser",
            ),
            v186 = Math["floor"](v180 * v160),
            v187 = Math["floor"](v181 * v160),
            v188 = getCachedSealedFillRegion({
              cache: v159["fillRegionCache"] || this["_fillRegionCache"],
              width: v161,
              height: v162,
              zoom: v160,
              fillCommand: v167,
              boundaryCommands: v184,
              seedX: v186,
              seedY: v187,
              extraKey: "mode:" + (v167["mode"] || ""),
              pointToPixel: (v189) => ({
                x: Number(v189?.["x"] || 0) * v160,
                y: Number(v189?.["y"] || 0) * v160,
              }),
              getStrokeWidth: (v190) =>
                getBrushLineWidth(v190?.["sizeWorld"], v160, v190?.["type"]),
            });
          if (v179) {
            if (v165)
              paintFilledRegion(v165, v188, v161, v162, {
                fillStyle: "#fff",
                globalCompositeOperation: "source-over",
                globalAlpha: 1,
              });
            else {
              const v191 = this["_createCheckerboardPattern"](v155, v160);
              paintFilledRegion(v155, v188, v161, v162, {
                fillStyle: v191,
                globalCompositeOperation: "source-over",
                globalAlpha: 0.8,
              });
            }
          } else
            v164
              ? paintFilledRegion(v164, v188, v161, v162, {
                  fillStyle: "#fff",
                  globalCompositeOperation: "source-over",
                })
              : (paintFilledRegion(v155, v188, v161, v162, {
                  fillStyle: OPAQUE_MASK_PREVIEW_CLEAR,
                  globalCompositeOperation: "destination-out",
                }),
                paintFilledRegion(v155, v188, v161, v162, {
                  fillStyle: v163["selectionOverlay"],
                  globalCompositeOperation: "source-over",
                }));
          return;
        }
      });
    },
    _createCheckerboardPattern(v192, v193) {
      const v194 = 8 * v193,
        v195 = document["createElement"]("canvas");
      ((v195["width"] = v194 * 2), (v195["height"] = v194 * 2));
      const v196 = v195["getContext"]("2d"),
        v197 = getPixelToolPalette();
      return (
        (v196["fillStyle"] = v197["checkerLight"]),
        v196["fillRect"](0, 0, v194 * 2, v194 * 2),
        (v196["fillStyle"] = v197["checkerDark"]),
        v196["fillRect"](0, 0, v194, v194),
        v196["fillRect"](v194, v194, v194, v194),
        v192["createPattern"](v195, "repeat")
      );
    },
    _fillArea(v198, v199) {
      const v200 = appStore["getState"](),
        v201 = v200["matting"]?.["brushMode"] || "normal",
        v202 = {
          type: "fill",
          x: Number(v198?.["x"]) || 0,
          y: Number(v198?.["y"]) || 0,
          mode: v201,
        };
      (this["_commands"]["push"](v202),
        (this["_redoStack"] = []),
        (this["_dirty"] = true),
        this["_render"]());
    },
    _undo() {
      if (this["_commands"]["length"] === 0) return;
      const v203 = this["_commands"]["pop"]();
      (this["_redoStack"]["push"](v203),
        (this["_dirty"] = true),
        this["_render"]());
    },
    _redo() {
      if (this["_redoStack"]["length"] === 0) return;
      const v204 = this["_redoStack"]["pop"]();
      (this["_commands"]["push"](v204),
        (this["_dirty"] = true),
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
        (this["_dirty"] = true),
        (this["_baseMaskCleared"] = true),
        this["_render"]());
    },
    async _save() {
      if (!this["active"]) return;
      const v205 = appStore["getState"](),
        v206 = v205["nodes"][this["nodeId"]];
      if (!v206) return;
      const v207 = this["_resolveNodeImageUrl"](v206);
      if (!v207) return;
      const v208 = this["toolbarEl"]["querySelector"](".act-save"),
        v209 = v208["querySelector"]("span"),
        v210 = v209 ? v209["textContent"] : "";
      if (v209) v209["textContent"] = "保存中...";
      v208["style"]["pointerEvents"] = "none";
      try {
        const v211 = this["nodeId"],
          v212 = Math["max"](1, Number(v206["width"]) || 1),
          v213 = Math["max"](1, Number(v206["height"]) || 1),
          v214 = generateId("mask_save"),
          v215 = this["_commands"]
            ["filter"](
              (v216) =>
                v216 &&
                (v216["type"] === "brush" ||
                  v216["type"] === "eraser" ||
                  v216["type"] === "fill"),
            )
            ["map"]((v217) => {
              if (v217["type"] === "fill")
                return {
                  type: "fill",
                  x: Number(v217["x"] ?? v217["startPoint"]?.["x"]) || 0,
                  y: Number(v217["y"] ?? v217["startPoint"]?.["y"]) || 0,
                  mode: v217["mode"],
                };
              return {
                type: v217["type"],
                sizeWorld: Number(v217["sizeWorld"]) || 0,
                mode: v217["mode"],
                points: Array["isArray"](v217["points"])
                  ? v217["points"]["map"]((v218) => ({
                      x: Number(v218["x"]),
                      y: Number(v218["y"]),
                    }))
                  : [],
              };
            });
        if (this["_baseMaskCleared"] && v215["length"] === 0) {
          (appStore["updateNodeData"](v211, {
            mask: "",
            maskPreview: "",
            maskPolarity: "",
            maskPreviewUrl: null,
            maskSaveToken: null,
          }),
            window["_triggerLocalCacheSave"]?.(),
            this["exit"]({ silent: true }));
          return;
        }
        const v219 = this["_baseMaskCleared"]
            ? ""
            : normalizeLocalPath(v206?.["mask"]),
          v220 = await new Promise((v221) =>
            this["canvasEl"]["toBlob"](v221, "image/png"),
          );
        if (!v220) throw new Error("Canvas\x20导出失败");
        const v222 = URL["createObjectURL"](v220);
        (appStore["updateNodeData"](v211, {
          maskPreviewUrl: v222,
          maskSaveToken: v214,
        }),
          window["_triggerLocalCacheSave"]?.(),
          this["exit"]({ silent: true }),
          (async () => {
            const v223 = await this["_loadImage"](v207),
              v224 = v223["naturalWidth"] || v223["width"],
              v225 = v223["naturalHeight"] || v223["height"],
              v226 = Math["max"](v212 / v224, v213 / v225) || 1,
              v227 = v224 * v226,
              v228 = v225 * v226,
              v229 = (v212 - v227) / 2,
              v230 = (v213 - v228) / 2,
              v231 = (v232) => {
                const v233 = (Number(v232?.["x"]) - v229) / v226,
                  v234 = (Number(v232?.["y"]) - v230) / v226;
                return {
                  x: Math["max"](0, Math["min"](v224 - 1, v233)),
                  y: Math["max"](0, Math["min"](v225 - 1, v234)),
                };
              },
              v235 = document["createElement"]("canvas");
            ((v235["width"] = v224), (v235["height"] = v225));
            const v236 = v235["getContext"]("2d");
            v236["imageSmoothingEnabled"] = false;
            const v237 = getCssVar("--canvas-white"),
              v238 = getCssVar("--canvas-black");
            ((v236["fillStyle"] = v238), v236["fillRect"](0, 0, v224, v225));
            if (v219)
              try {
                const v239 = await this["_loadImage"](localPathToUrl(v219));
                v236["drawImage"](v239, 0, 0, v224, v225);
                const v240 = appStore["getState"]()["nodes"]?.[v211],
                  v241 = String(v240?.["maskPolarity"] || "")["trim"]();
                v241 !== "paint-white" && this["_invertCanvasBinary"](v236);
              } catch (v242) {}
            const v243 = (v244, v245, v246 = 1) => {
              const v247 = (
                Array["isArray"](v244["points"]) ? v244["points"] : []
              )["map"]((v248) => v231(v248));
              if (!v247["length"]) return;
              v236["save"]();
              const v249 = v246 >= 6 ? "eraser" : "brush",
                v250 = getBrushLineWidth(v244["sizeWorld"], 1 / v226, v249);
              (drawRoundBrushStroke(v236, {
                points: v247,
                lineWidth:
                  v249 === "eraser" ? getEraserClearLineWidth(v250) : v250,
                strokeStyle: v245,
                fillStyle: v245,
                globalCompositeOperation: "source-over",
              }),
                v236["restore"]());
            };
            v215["forEach"]((v251, v252) => {
              if (!v251) return;
              if (v251["type"] === "brush") {
                v243(v251, v237, 1);
                return;
              }
              if (v251["type"] === "eraser") {
                v243(v251, v238, 6);
                return;
              }
              if (v251["type"] === "fill") {
                const v253 = v215["slice"](0, v252)["filter"](
                    (v254) =>
                      v254?.["type"] === "brush" || v254?.["type"] === "eraser",
                  ),
                  v255 = buildBinaryBoundaryMask({
                    width: v224,
                    height: v225,
                    commands: v253,
                    pointToPixel: (v256) => {
                      const v257 = v231(v256 || {});
                      return { x: v257["x"], y: v257["y"] };
                    },
                    getStrokeWidth: (v258) =>
                      getBrushLineWidth(
                        v258?.["sizeWorld"],
                        1 / v226,
                        v258?.["type"],
                      ),
                  }),
                  v259 = v231({ x: v251["x"], y: v251["y"] }),
                  v260 = floodFillRegion(
                    v255["mask"],
                    v255["width"],
                    v255["height"],
                    Math["floor"](v259["x"]),
                    Math["floor"](v259["y"]),
                  ),
                  v261 = sealRegionToBoundary(
                    v260,
                    v255["mask"],
                    v255["width"],
                    v255["height"],
                  );
                paintFilledRegion(v236, v261, v224, v225, {
                  fillStyle: v237,
                  globalCompositeOperation: "source-over",
                });
                return;
              }
            });
            const v262 = v236["getImageData"](0, 0, v224, v225)["data"],
              v263 = Math["max"](
                1,
                Math["floor"](Math["max"](v224, v225) / 256),
              );
            let v264 = false;
            for (let v265 = 0; v265 < v225 && !v264; v265 += v263) {
              for (let v266 = 0; v266 < v224; v266 += v263) {
                const v267 = (v265 * v224 + v266) * 4,
                  v268 = v262[v267],
                  v269 = v262[v267 + 1],
                  v270 = v262[v267 + 2];
                if (v268 > 5 || v269 > 5 || v270 > 5) {
                  v264 = true;
                  break;
                }
              }
            }
            if (!v264) {
              const v271 = appStore["getState"]()["nodes"]?.[v211];
              if (!v271 || v271["maskSaveToken"] !== v214) {
                URL["revokeObjectURL"](v222);
                return;
              }
              (appStore["updateNodeData"](v211, {
                mask: "",
                maskPreview: "",
                maskPolarity: "",
                maskPreviewUrl: null,
                maskSaveToken: null,
              }),
                appStore["setSelectedNodes"]([v211]),
                commit(),
                URL["revokeObjectURL"](v222),
                window["_triggerLocalCacheSave"]?.());
              return;
            }
            const v272 = await new Promise((v273) =>
              v235["toBlob"](v273, "image/png"),
            );
            if (!v272) throw new Error("Canvas\x20导出失败");
            const v274 = await saveOutputBlob(v272, {
                ext: "png",
                subDir: "mask",
                kind: "mask",
              }),
              v275 = pickResultLocalPath(v274),
              v276 = await saveOutputBlob(v220, {
                ext: "png",
                subDir: "mask_preview",
              }),
              v277 = pickResultLocalPath(v276),
              v278 = appStore["getState"]()["nodes"]?.[v211];
            if (!v278 || v278["maskSaveToken"] !== v214) {
              URL["revokeObjectURL"](v222);
              return;
            }
            (appStore["updateNodeData"](v211, {
              mask: v275,
              maskPreview: v277,
              maskPolarity: "paint-white",
              maskPreviewUrl: null,
              maskSaveToken: null,
            }),
              appStore["setSelectedNodes"]([v211]),
              commit(),
              URL["revokeObjectURL"](v222),
              window["_triggerLocalCacheSave"]?.());
          })()["catch"](() => {
            const v279 = appStore["getState"]()["nodes"]?.[v211];
            if (!v279 || v279["maskSaveToken"] !== v214) {
              try {
                URL["revokeObjectURL"](v222);
              } catch (v280) {}
              return;
            }
            (appStore["updateNodeData"](v211, { maskSaveToken: null }),
              window["showToast"]?.("保存失败", "error"));
          }));
      } catch (v281) {
        (console["error"]("[Matting] 保存失败:", v281),
          window["showToast"]?.("保存失败", "error"));
      } finally {
        if (v209) v209["textContent"] = v210;
        v208["style"]["pointerEvents"] = "auto";
      }
    },
    _resolveNodeImageUrl(v282) {
      const v283 = v282["mainImageIndex"] || 0,
        v284 = v282["images"] && v282["images"][v283],
        v285 = v282["localPath"] || v284?.["localPath"],
        v286 = localPathToUrl(v285);
      if (v286) return v286;
      return (
        v282["src"] ||
        v282["sourceUrl"] ||
        v282["imageUrl"] ||
        v282["thumbUrl"] ||
        v284?.["imageUrl"] ||
        v284?.["thumbUrl"] ||
        ""
      );
    },
    _invertCanvasBinary(v287) {
      const v288 = v287?.["canvas"],
        v289 = v288?.["width"] || 0,
        v290 = v288?.["height"] || 0;
      if (!v289 || !v290) return;
      const v291 = v287["getImageData"](0, 0, v289, v290),
        v292 = v291["data"];
      for (let v293 = 0; v293 < v292["length"]; v293 += 4) {
        ((v292[v293] = 255 - v292[v293]),
          (v292[v293 + 1] = 255 - v292[v293 + 1]),
          (v292[v293 + 2] = 255 - v292[v293 + 2]));
      }
      v287["putImageData"](v291, 0, 0);
    },
    _createMaskBaseCanvas(v294, v295 = "paint-white") {
      const v296 = Math["max"](
          1,
          Number(v294?.["naturalWidth"] || v294?.["width"]) || 1,
        ),
        v297 = Math["max"](
          1,
          Number(v294?.["naturalHeight"] || v294?.["height"]) || 1,
        ),
        v298 = document["createElement"]("canvas");
      ((v298["width"] = v296), (v298["height"] = v297));
      const v299 = v298["getContext"]("2d", { willReadFrequently: true });
      if (!v299) return null;
      v299["drawImage"](v294, 0, 0, v296, v297);
      const v300 = v299["getImageData"](0, 0, v296, v297),
        { data: v301 } = v300,
        v302 = String(v295 || "")["trim"]() === "paint-white";
      for (let v303 = 0; v303 < v301["length"]; v303 += 4) {
        const v304 = Math["max"](v301[v303], v301[v303 + 1], v301[v303 + 2]),
          v305 = v302 ? v304 : 255 - v304,
          v306 = v305 > 5 ? v305 : 0;
        ((v301[v303] = 255),
          (v301[v303 + 1] = 255),
          (v301[v303 + 2] = 255),
          (v301[v303 + 3] = v306));
      }
      return (v299["putImageData"](v300, 0, 0), v298);
    },
    _loadExistingMask() {
      if (!this["active"]) return;
      const v307 = appStore["getStateRaw"](),
        v308 = v307["nodes"]?.[this["nodeId"]],
        v309 = String(v308?.["mask"] || "")["trim"](),
        v310 = String(v308?.["maskPreviewUrl"] || v308?.["maskPreview"] || "")[
          "trim"
        ](),
        v311 = !!v309,
        v312 = v311 ? v309 : v310;
      if (!v312) return;
      const v313 =
        v312["startsWith"]("blob:") || v312["startsWith"]("data:")
          ? v312
          : localPathToUrl(v312);
      if (!v313) return;
      (async () => {
        const v314 = await this["_loadImage"](v313);
        if (!this["active"]) return;
        this["_commands"] = this["_commands"]["filter"](
          (v315) =>
            v315?.["type"] !== "mask-preview" && v315?.["type"] !== "mask-base",
        );
        if (v311) {
          const v316 = this["_createMaskBaseCanvas"](
            v314,
            v308?.["maskPolarity"],
          );
          if (v316)
            this["_commands"]["unshift"]({ type: "mask-base", canvas: v316 });
        } else
          this["_commands"]["unshift"]({ type: "mask-preview", img: v314 });
        ((this["_redoStack"] = []), this["_render"]());
      })()["catch"](() => {});
    },
    _loadImage(v317) {
      return new Promise((v318, v319) => {
        const v320 = new Image();
        ((v320["crossOrigin"] = "anonymous"),
          (v320["onload"] = () => v318(v320)),
          (v320["onerror"] = () => v319(new Error("图像加载失败"))),
          (v320["src"] = v317));
      });
    },
  };
export default ImageMattingController;

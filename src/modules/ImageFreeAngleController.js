import appStore from "../core/stores/appStore.js";
import { generateId } from "../core/math.js";
import { getImage } from "./storage.js";
import {
  buildGenerateImageRequest,
  generateImage,
} from "../../api/aiImageApi.js";
import { cancelRunningHubTask } from "../../api/runninghubTaskApi.js";
import { ensureConfig, getProviderConfig } from "../../api/configApi.js";
import { calcSafeSpawnPosNearNode } from "./nodeSpawn.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import {
  bindImageFunctionModeMenu,
  buildImageFreeAngleModelCatalog,
  bindImageFunctionModelMenu,
  buildImageFunctionModeControlHTML,
  buildImageFunctionModelMenuHTML,
  closeImageFunctionModelSubmenus,
  getDefaultImageFreeAngleModelState,
  getImageFunctionModelDisplayName,
  getImageFunctionModelTriggerIconHTML,
  isImageFreeAngleOnlyModel,
  resolveImageFunctionModelByMode,
  syncImageFunctionModeControl,
  syncImageFunctionModelMenuActive,
} from "./imageFunctionModelMenu.js";
import {
  DEBUG_WRENCH_ICON_HTML,
  formatFinalApiDebugRequest,
} from "../utils/debugRequestPreview.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import { GENERATE_CANCEL_ICON_HTML } from "./previewGenerateButtonUi.js";
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from "../components/aigenImage/imageGenerationResultRenderer.js";
import {
  buildGenerationCancelledPatch,
  buildGenerationStartPatch,
} from "../core/generationTaskLifecycle.js";
import { isTaskCancelled } from "../core/generationTaskUiState.js";
import {
  isDreaminaImageTaskModel,
  isRunningHubImageTaskModel,
  isRunningHubModelApiImageTask,
  resolveImageTaskProvider,
  shouldUseRunningHubOpenapiQuery,
} from "./imageTaskModelResolver.js";
const FREE_ANGLE_DISTANCE_MIN = 0.1,
  FREE_ANGLE_DISTANCE_MAX = 2,
  FREE_ANGLE_VISUAL_SCALE_MIN = 0.7,
  FREE_ANGLE_PREVIOUS_DISTANCE_ONE_VISUAL_SCALE =
    FREE_ANGLE_VISUAL_SCALE_MIN +
    (1 - FREE_ANGLE_DISTANCE_MIN) *
      (2.65 / (FREE_ANGLE_DISTANCE_MAX - FREE_ANGLE_DISTANCE_MIN));
function _computeGenerationDuration(v0) {
  if (!v0) return 0;
  if (typeof v0["generationDuration"] === "number")
    return v0["generationDuration"];
  const v1 = Number(v0["generationStartTime"]);
  if (!Number["isFinite"](v1) || v1 <= 0) return 0;
  return Math["max"](0, Date["now"]() - v1);
}
function _isRunningHubTaskModel(v2, v3) {
  return isRunningHubImageTaskModel(v2, v3);
}
function _isDreaminaTaskModel(v4, v5) {
  return isDreaminaImageTaskModel(v4, v5);
}
function _resolveImageProvider(v6, v7 = "") {
  return resolveImageTaskProvider(v6, v7, "grsai");
}
function _buildRunningHubTaskPatch({
  taskId: taskId = "",
  status: status = "pending",
  startedAt: startedAt = 0,
  recovering: recovering = false,
  useOpenapiQuery: useOpenapiQuery = false,
} = {}) {
  return {
    rhTaskId: String(taskId || "")["trim"](),
    rhTaskStatus: String(status || "pending")["trim"]() || "pending",
    rhTaskStartedAt: Number(startedAt || 0),
    rhTaskRecovering: recovering === true,
    rhTaskUseOpenapiQuery: useOpenapiQuery === true,
  };
}
function _buildDreaminaTaskPatch({
  submitId: submitId = "",
  status: status = "pending",
  phase: phase = "generating",
  label: label = "生成中",
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) {
  return {
    dreaminaSubmitId: String(submitId || "")["trim"](),
    dreaminaTaskStatus: String(status || "pending")["trim"]() || "pending",
    dreaminaTaskPhase: String(phase || "generating")["trim"]() || "generating",
    dreaminaTaskLabel: String(label || "生成中")["trim"]() || "生成中",
    dreaminaTaskStartedAt: Number(startedAt || 0),
    dreaminaTaskLastCheckedAt: Date["now"](),
    dreaminaTaskRecovering: recovering === true,
    dreaminaTaskLastRaw: {},
  };
}
function _buildAsyncTaskPatch({
  provider: provider = "",
  kind: kind = "image",
  taskId: taskId = "",
  status: status = "pending",
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) {
  return {
    asyncTaskProvider: String(provider || "")["trim"](),
    asyncTaskKind: String(kind || "image")["trim"]() || "image",
    asyncTaskId: String(taskId || "")["trim"](),
    asyncTaskStatus: String(status || "pending")["trim"]() || "pending",
    asyncTaskStartedAt: Number(startedAt || 0),
    asyncTaskRecovering: recovering === true,
  };
}
function _persistRunningHubResumeCache() {
  try {
    window["_triggerLocalCacheSave"]?.();
  } catch {}
}
export function createRunningHubTaskStateMachine() {
  const v8 = {
      active: false,
      cancelRequested: false,
      apiKey: "",
      taskId: "",
      abortController: null,
      outNodeId: "",
      originHtml: "",
      originColor: "",
      originTooltip: "",
      originAria: "",
      originTitle: "",
    },
    v9 = (v10) => {
      if (!v10 || v8["originHtml"]) return;
      ((v8["originHtml"] = v10["innerHTML"]),
        (v8["originColor"] = v10["style"]["color"] || ""),
        (v8["originTooltip"] = v10["dataset"]["tooltip"] || ""),
        (v8["originAria"] = v10["getAttribute"]("aria-label") || ""),
        (v8["originTitle"] = v10["title"] || ""));
    },
    v11 = (v12) => {
      if (!v12) return;
      (v9(v12),
        (v12["style"]["color"] = "var(--red)"),
        (v12["dataset"]["tooltip"] = "点击取消"),
        v12["setAttribute"]("aria-label", "取消"),
        (v12["title"] = "点击取消任务"),
        (v12["innerHTML"] = GENERATE_CANCEL_ICON_HTML));
    },
    v13 = (v14) => {
      if (!v14) return;
      if (v8["originHtml"]) v14["innerHTML"] = v8["originHtml"];
      v14["style"]["color"] = v8["originColor"] || "";
      if (v8["originTooltip"]) v14["dataset"]["tooltip"] = v8["originTooltip"];
      else delete v14["dataset"]["tooltip"];
      if (v8["originAria"]) v14["setAttribute"]("aria-label", v8["originAria"]);
      else v14["removeAttribute"]("aria-label");
      v14["title"] = v8["originTitle"] || "";
    },
    v15 = ({
      button: v16,
      apiKey: v17,
      abortController: v18,
      outNodeId: v19,
    }) => {
      ((v8["active"] = true),
        (v8["cancelRequested"] = false),
        (v8["apiKey"] = v17 || ""),
        (v8["taskId"] = ""),
        (v8["abortController"] = v18 || null),
        (v8["outNodeId"] = v19 || ""),
        v11(v16));
    },
    v20 = (v21) => {
      v8["taskId"] = v21 ? String(v21) : "";
    },
    v22 = () =>
      !!v8["cancelRequested"] ||
      !!v8["abortController"]?.["signal"]?.["aborted"],
    v23 = async () => {
      v8["cancelRequested"] = true;
      try {
        v8["abortController"]?.["abort"]?.();
      } catch {}
      v8["apiKey"] &&
        v8["taskId"] &&
        (await cancelRunningHubTask({
          apiKey: v8["apiKey"],
          taskId: v8["taskId"],
        }));
    },
    v24 = ({ nodeId: v25, name: v26, outputText: v27 }) => {
      const v28 = v25 || v8["outNodeId"];
      if (!v28) return;
      const v29 = appStore["getState"]()["nodes"]?.[v28];
      if (!v29) return;
      const v30 = _computeGenerationDuration(v29);
      appStore["updateNodeData"](v28, {
        ...buildGenerationCancelledPatch({ duration: v30 }),
        name: v26,
        outputText: v27,
        jobStatus: null,
      });
    },
    v31 = (v32) => {
      ((v8["active"] = false),
        (v8["cancelRequested"] = false),
        (v8["apiKey"] = ""),
        (v8["taskId"] = ""),
        (v8["abortController"] = null),
        (v8["outNodeId"] = ""),
        v13(v32));
    };
  return {
    state: v8,
    bindButton: v9,
    activate: v15,
    setTaskId: v20,
    isCancelled: v22,
    cancel: v23,
    finalizeCancelledNode: v24,
    reset: v31,
  };
}
const ImageFreeAngleController = {
  active: false,
  nodeId: null,
  nodeData: null,
  state: { rotation: 35, pitch: 20, scale: 0.5, pan: { x: 0, y: 0 } },
  containerEl: null,
  cubeEl: null,
  imageWrapEl: null,
  onDone: null,
  async render(v33, v34, v35, v36, v37) {
    const v38 = appStore["getStateRaw"](),
      v39 = v38["nodes"]?.[v33];
    if (!v39) return;
    if (this["active"] && this["nodeId"] === v33) return;
    this["active"] && this["nodeId"] !== v33 && this["_exit"]();
    ((this["active"] = true),
      (this["nodeId"] = v33),
      (this["nodeData"] = v39),
      (this["containerEl"] = v34),
      (this["onDone"] = v35),
      (this["onGenerate"] = v36),
      (this["triggerBtn"] = v37));
    this["triggerBtn"] &&
      ((this["_oldTriggerContent"] = this["triggerBtn"]["innerHTML"]),
      (this["_oldTriggerTooltip"] =
        this["triggerBtn"]["getAttribute"]("data-tooltip")),
      (this["_oldTriggerAriaLabel"] =
        this["triggerBtn"]["getAttribute"]("aria-label")),
      (this["_oldTriggerTitle"] = this["triggerBtn"]["getAttribute"]("title")),
      (this["triggerBtn"]["innerHTML"] =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'),
      this["triggerBtn"]["setAttribute"]("data-tooltip", "退出"),
      this["triggerBtn"]["setAttribute"]("aria-label", "退出控制角度"),
      this["triggerBtn"]["setAttribute"]("title", "退出控制角度"),
      this["triggerBtn"]["classList"]["add"]("ftb-btn-exit"));
    ((this["state"] = {
      rotation: 35,
      pitch: 20,
      scale: 0.5,
      pan: { x: 0, y: 0 },
    }),
      (this["_modelCatalog"] = buildImageFreeAngleModelCatalog()));
    const v40 = getDefaultImageFreeAngleModelState(this["_modelCatalog"]);
    ((this["_currentModel"] = v40["model"] || "nano-banana"),
      (this["_currentProvider"] = v40["provider"] || "grsai"),
      await this["_createUI"](),
      this["_bindEvents"](),
      this["_updateView"]());
  },
  async _createUI() {
    const v41 = this["containerEl"];
    v41["innerHTML"] = "";
    const v42 = document["createElement"]("div");
    v42["className"] = "v2-free-angle-embedded";
    let v43 =
      this["nodeData"]["imageUrl"] ||
      this["nodeData"]["sourceUrl"] ||
      this["nodeData"]["thumbUrl"] ||
      this["nodeData"]["src"] ||
      localPathToUrl(this["nodeData"]["localPath"]);
    if (this["nodeData"]["thumbId"])
      try {
        const v44 = await getImage(this["nodeData"]["thumbId"]);
        if (v44) v43 = URL["createObjectURL"](v44);
      } catch (v45) {
        console["error"]("FA\x20load\x20blob\x20failed", v45);
      }
    const v46 = this["_modelCatalog"] || buildImageFreeAngleModelCatalog();
    this["_modelCatalog"] = v46;
    const v47 = buildImageFunctionModelMenuHTML({
      activeModel: this["_currentModel"],
      activeProvider: this["_currentProvider"],
      modelCatalog: v46,
    });
    ((v42["innerHTML"] =
      '\n      <div class="fa-header">\n        <span class="fa-title">拖拽正方体改变角度</span>\n        <button class="fa-close-btn">×</button>\n      </div>\n      <div class="fa-content">\n        <div class="fa-preview-area">\n          <button class="fa-reset-btn">重置</button>\n          <div class="fa-cube-container">\n            <div class="fa-cube">\n              <div class="fa-cube-face face-front">\n                <img src="' +
      v43 +
      '" class="fa-face-img" />\n              </div>\n              <div class="fa-cube-face face-back">后</div>\n              <div class="fa-cube-face face-right">右</div>\n              <div class="fa-cube-face face-left">左</div>\n              <div class="fa-cube-face face-top">上</div>\n              <div class="fa-cube-face face-bottom">下</div>\n            </div>\n          </div>\n        </div>\n        <div class="fa-controls">\n          <div class="fa-control-item">\n            <div class="fa-control-label-row" style="display:flex;justify-content:space-between;">\n              <span class="fa-label">水平角度</span>\n              <span class="fa-value" id="val-rotation">35.0°</span>\n            </div>\n            <input type="range" class="fa-slider" id="sld-rotation" min="0" max="360" step="0.5" value="35">\n          </div>\n          <div class="fa-control-item">\n            <div class="fa-control-label-row" style="display:flex;justify-content:space-between;">\n              <span class="fa-label">垂直角度</span>\n              <span class="fa-value" id="val-pitch">20.0°</span>\n            </div>\n            <input type="range" class="fa-slider" id="sld-pitch" min="-30" max="60" step="0.5" value="20">\n          </div>\n          <div class="fa-control-item">\n             <div class="fa-control-label-row" style="display:flex;justify-content:space-between;">\n              <span class="fa-label">距离</span>\n              <span class="fa-value" id="val-scale">0.50</span>\n            </div>\n            <input type="range" class="fa-slider" id="sld-scale" min="0.1" max="2" step="0.05" value="0.5">\n          </div>\n          <div class="fa-footer">\n            <div class="fa-model-select image-function-model-select">\n              <button type="button" class="fa-model-btn img-pill-btn image-function-model-trigger">\n                ' +
      this["_getModelIconHtml"](
        this["_currentModel"],
        this["_currentProvider"],
      ) +
      '\n                <span class="fa-model-label">' +
      getImageFunctionModelDisplayName(this["_currentModel"], v46) +
      '</span>\n                <svg class="fa-model-chevron image-function-model-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>\n              </button>\n              <div class="fa-model-menu floating-menu image-function-model-menu">\n                ' +
      v47 +
      "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
      buildImageFunctionModeControlHTML({
        model: this["_currentModel"],
        provider: this["_currentProvider"],
        imageSize: this["nodeData"]?.["imageSize"] || "2K",
        wrapClass: "fa-mode-select",
        buttonClass: "fa-mode-btn img-pill-btn",
      }) +
      '\n            <div class="fa-footer-actions">\n              <button type="button" class="fa-debug-btn debug-wrench-btn" title="调试 API 参数">\n                ' +
      DEBUG_WRENCH_ICON_HTML +
      "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20class=\x22fa-gen-btn\x20img-gen-btn\x22\x20title=\x22生成\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2214\x22\x20height=\x2214\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><line\x20x1=\x2212\x22\x20y1=\x2219\x22\x20x2=\x2212\x22\x20y2=\x225\x22/><polyline\x20points=\x225\x2012\x2012\x205\x2019\x2012\x22/></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20"),
      (v42["querySelector"](".fa-close-btn")["onclick"] = () =>
        this["_exit"]()),
      v42["addEventListener"]("click", (v48) => {
        v48["stopPropagation"]();
      }),
      v42["addEventListener"]("mousedown", (v49) => {
        v49["stopPropagation"]();
      }),
      v41["appendChild"](v42),
      (this["cubeEl"] = v42["querySelector"](".fa-cube")),
      (this["wrapperEl"] = v42));
  },
  _updateView() {
    if (!this["active"]) return;
    const { rotation: v50, pitch: v51, scale: v52 } = this["state"],
      v53 = ((v50 % 360) + 360) % 360;
    ((this["wrapperEl"]["querySelector"]("#val-rotation")["textContent"] =
      v53["toFixed"](1) + "°"),
      (this["wrapperEl"]["querySelector"]("#val-pitch")["textContent"] =
        v51["toFixed"](1) + "°"),
      (this["wrapperEl"]["querySelector"]("#val-scale")["textContent"] =
        "" + v52["toFixed"](2)),
      (this["wrapperEl"]["querySelector"]("#sld-rotation")["value"] = v53),
      (this["wrapperEl"]["querySelector"]("#sld-pitch")["value"] = v51),
      (this["wrapperEl"]["querySelector"]("#sld-scale")["value"] = v52),
      (this["cubeEl"]["style"]["transform"] =
        "rotateX(" + -v51 + "deg) rotateY(" + (v53 - 360) + "deg)"));
    const v54 =
      FREE_ANGLE_VISUAL_SCALE_MIN +
      (v52 - FREE_ANGLE_DISTANCE_MIN) *
        ((FREE_ANGLE_PREVIOUS_DISTANCE_ONE_VISUAL_SCALE -
          FREE_ANGLE_VISUAL_SCALE_MIN) /
          (FREE_ANGLE_DISTANCE_MAX - FREE_ANGLE_DISTANCE_MIN));
    this["cubeEl"]["parentElement"]["style"]["transform"] =
      "scale(" + v54 + ")";
  },
  _bindEvents() {
    const v55 = this["wrapperEl"];
    ((v55["querySelector"]("#sld-rotation")["oninput"] = (v56) => {
      ((this["state"]["rotation"] = parseFloat(v56["target"]["value"])),
        this["_updateView"]());
    }),
      (v55["querySelector"]("#sld-pitch")["oninput"] = (v57) => {
        ((this["state"]["pitch"] = parseFloat(v57["target"]["value"])),
          this["_updateView"]());
      }),
      (v55["querySelector"]("#sld-scale")["oninput"] = (v58) => {
        ((this["state"]["scale"] = parseFloat(v58["target"]["value"])),
          this["_updateView"]());
      }),
      (v55["querySelector"](".fa-reset-btn")["onclick"] = () => {
        ((this["state"] = {
          rotation: 35,
          pitch: 20,
          scale: 0.5,
          pan: { x: 0, y: 0 },
        }),
          this["_updateView"]());
      }));
    const v59 = v55["querySelector"](".fa-preview-area");
    let v60 = false,
      v61 = false,
      v62 = { x: 0, y: 0 };
    v59["onmousedown"] = (v63) => {
      v60 = true;
      if (v63["button"] === 2) v61 = true;
      ((v62 = { x: v63["clientX"], y: v63["clientY"] }),
        v63["preventDefault"](),
        v63["stopPropagation"]());
    };
    const v64 = (v65) => {
        if (!v60) return;
        const v66 = v65["clientX"] - v62["x"],
          v67 = v65["clientY"] - v62["y"];
        ((v62 = { x: v65["clientX"], y: v65["clientY"] }),
          v61 &&
            ((this["state"]["pan"]["x"] += v66),
            (this["state"]["pan"]["y"] += v67)),
          !v61 &&
            ((this["state"]["rotation"] += v66 * 0.5),
            (this["state"]["pitch"] += v67 * 0.5),
            (this["state"]["pitch"] = Math["max"](
              -30,
              Math["min"](60, this["state"]["pitch"]),
            ))),
          this["_updateView"]());
      },
      v68 = () => {
        ((v60 = false), (v61 = false));
      };
    (window["addEventListener"]("mousemove", v64),
      window["addEventListener"]("mouseup", v68),
      (this["_cleanupHandlers"] = () => {
        (window["removeEventListener"]("mousemove", v64),
          window["removeEventListener"]("mouseup", v68));
      }),
      (v59["onwheel"] = (v69) => {
        (v69["preventDefault"](), v69["stopPropagation"]());
        const v70 = v69["deltaY"] > 0 ? -0.05 : 0.05;
        ((this["state"]["scale"] = Math["max"](
          0.1,
          Math["min"](2, this["state"]["scale"] + v70),
        )),
          this["_updateView"]());
      }),
      (v59["oncontextmenu"] = (v71) => v71["preventDefault"]()),
      (v55["querySelector"](".fa-gen-btn")["onclick"] = () =>
        this["_handleGenerate"]()),
      (v55["querySelector"](".fa-debug-btn")["onclick"] = (v72) => {
        (v72["stopPropagation"](), this["_handleDebug"]());
      }));
    const v73 = v55["querySelector"](".fa-model-btn"),
      v74 = v55["querySelector"](".fa-model-menu"),
      v75 = v55["querySelector"](".fa-mode-btn"),
      v76 = v55["querySelector"](".image-function-mode-menu"),
      v77 = this["_modelCatalog"] || buildImageFreeAngleModelCatalog(),
      v78 = () => this["nodeData"]?.["imageSize"] || "2K";
    v73["onclick"] = (v79) => {
      v79["stopPropagation"]();
      const v80 =
        v74["style"]["display"] === "block" ||
        v74["style"]["display"] === "flex";
      v80
        ? ((v74["style"]["display"] = "none"),
          closeImageFunctionModelSubmenus(v74))
        : ((v74["style"]["display"] = "block"),
          v76?.["classList"]["remove"]("show"));
    };
    const v81 = () =>
        syncImageFunctionModeControl({
          root: v55,
          model: this["_currentModel"],
          provider: this["_currentProvider"],
          imageSize: v78(),
        }),
      v82 = (v83, v84) => {
        const v85 = String(v83 || "")["trim"](),
          v86 = _resolveImageProvider(v85, v84);
        if (!v85 || !v86) return;
        ((this["_currentModel"] = v85), (this["_currentProvider"] = v86));
        const v87 = this["_getModelIconHtml"](v85, v86),
          v88 = getImageFunctionModelDisplayName(v85, v77);
        ((v73["innerHTML"] =
          "\x0a\x20\x20\x20\x20\x20\x20\x20\x20" +
          v87 +
          '\n        <span class="fa-model-label">' +
          v88 +
          "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2210\x22\x20height=\x2210\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20style=\x22opacity:0.5;margin-left:2px;\x22><polyline\x20points=\x226\x209\x2012\x2015\x2018\x209\x22/></svg>\x0a\x20\x20\x20\x20\x20\x20"),
          syncImageFunctionModelMenuActive({
            modelMenu: v74,
            model: v85,
            provider: v86,
          }),
          v81(),
          (v74["style"]["display"] = "none"),
          closeImageFunctionModelSubmenus(v74),
          this["nodeId"] &&
            !isImageFreeAngleOnlyModel(v85) &&
            appStore["updateNodeData"](this["nodeId"], {
              model: v85,
              provider: v86,
            }));
      },
      v89 = bindImageFunctionModelMenu({
        modelMenu: v74,
        onSelect: ({ model: v90, provider: v91 }) => v82(v90, v91),
        closeMenu: () => {
          v74["style"]["display"] = "none";
        },
      }),
      v92 = bindImageFunctionModeMenu({
        modeMenu: v76,
        onSelect: ({ mode: v93 }) => {
          const v94 = resolveImageFunctionModelByMode({
            model: this["_currentModel"],
            provider: this["_currentProvider"],
            imageSize: v78(),
            mode: v93,
          });
          if (!v94?.["model"]) return;
          (v82(v94["model"], v94["provider"]),
            v76?.["classList"]["remove"]("show"));
        },
      });
    ((this["_cleanupSubmenuClick"] = () => {
      (v89?.(), v92?.());
    }),
      v75?.["addEventListener"]("click", (v95) => {
        v95["stopPropagation"]();
        if (
          v75["closest"](".image-function-mode-wrap")?.["classList"][
            "contains"
          ]("is-hidden")
        )
          return;
        (v76?.["classList"]["toggle"]("show"),
          (v74["style"]["display"] = "none"),
          closeImageFunctionModelSubmenus(v74));
      }),
      v81());
    const v96 = (v97) => {
      !v73["contains"](v97["target"]) &&
        !v74["contains"](v97["target"]) &&
        !v75?.["contains"](v97["target"]) &&
        !v76?.["contains"](v97["target"]) &&
        ((v74["style"]["display"] = "none"),
        v76?.["classList"]["remove"]("show"),
        closeImageFunctionModelSubmenus(v74));
    };
    (document["addEventListener"]("mousedown", v96),
      (this["_cleanupModelMenu"] = () => {
        document["removeEventListener"]("mousedown", v96);
      }));
  },
  _getModelIconHtml(v98, v99 = "") {
    return getImageFunctionModelTriggerIconHTML(
      v98,
      _resolveImageProvider(v98, v99),
      this["_modelCatalog"] || buildImageFreeAngleModelCatalog(),
    );
  },
  _exit() {
    if (!this["active"]) return;
    ((this["active"] = false), (this["nodeId"] = null));
    if (this["_cleanupHandlers"]) this["_cleanupHandlers"]();
    if (this["_cleanupModelMenu"]) this["_cleanupModelMenu"]();
    if (this["_cleanupSubmenuClick"]) this["_cleanupSubmenuClick"]();
    if (this["containerEl"]) this["containerEl"]["innerHTML"] = "";
    this["triggerBtn"] &&
      ((this["triggerBtn"]["innerHTML"] = this["_oldTriggerContent"]),
      this["_oldTriggerTooltip"] != null
        ? this["triggerBtn"]["setAttribute"](
            "data-tooltip",
            this["_oldTriggerTooltip"],
          )
        : this["triggerBtn"]["removeAttribute"]("data-tooltip"),
      this["_oldTriggerAriaLabel"] != null
        ? this["triggerBtn"]["setAttribute"](
            "aria-label",
            this["_oldTriggerAriaLabel"],
          )
        : this["triggerBtn"]["removeAttribute"]("aria-label"),
      this["_oldTriggerTitle"] != null
        ? this["triggerBtn"]["setAttribute"]("title", this["_oldTriggerTitle"])
        : this["triggerBtn"]["removeAttribute"]("title"),
      this["triggerBtn"]["classList"]["remove"]("ftb-btn-exit"));
    ((this["_oldTriggerContent"] = null),
      (this["_oldTriggerTooltip"] = null),
      (this["_oldTriggerAriaLabel"] = null),
      (this["_oldTriggerTitle"] = null),
      (this["_modelCatalog"] = null));
    if (this["onDone"]) this["onDone"]();
  },
  async _handleGenerate() {
    if (!this["nodeId"]) return;
    const { rotation: v100, pitch: v101, scale: v102 } = this["state"];
    appStore["updateNodeData"](this["nodeId"], {
      cameraAngle: { rotation: v100, pitch: v101, scale: v102 },
    });
    const v103 = appStore["getStateRaw"](),
      v104 = v103["nodes"]?.[this["nodeId"]];
    if (!v104) return;
    let v105 = this["_currentModel"] || "nano-banana-2";
    const v106 = _resolveImageProvider(
      v105,
      this["_currentProvider"] || v104["provider"],
    );
    let v107 = null;
    const v108 = document["getElementById"](this["nodeId"]);
    if (v108) {
      const v109 = v108["querySelector"]("img");
      v109 && (v107 = v109["src"]);
    }
    !v107 && v104["imageUrl"] && (v107 = v104["imageUrl"]);
    !v107 && v104["outputImage"] && (v107 = v104["outputImage"]);
    let v110 = v104["aspectRatio"] || "1:1";
    if (v110 === "自适应" || v110 === "auto" || v110 === "1:1") {
      if (v107) {
        let v111 = v104["imgWidth"] || v104["naturalWidth"] || 0,
          v112 = v104["imgHeight"] || v104["naturalHeight"] || 0;
        !v111 &&
          v104["src"] &&
          v104["type"] === "source-image" &&
          ((v111 = v104["originalWidth"] || 0),
          (v112 = v104["originalHeight"] || 0));
        if (!v111 || !v112) {
          const v113 = document["getElementById"](this["nodeId"]);
          if (v113) {
            const v114 = v113["querySelector"]("img");
            v114 &&
              v114["naturalWidth"] &&
              v114["naturalHeight"] &&
              ((v111 = v114["naturalWidth"]), (v112 = v114["naturalHeight"]));
          }
        }
        if (v111 && v112) {
          const v115 = v111 / v112,
            v116 = [
              { label: "1:1", calc: 1 / 1 },
              { label: "9:16", calc: 9 / 16 },
              { label: "16:9", calc: 16 / 9 },
              { label: "3:4", calc: 3 / 4 },
              { label: "4:3", calc: 4 / 3 },
              { label: "3:2", calc: 3 / 2 },
              { label: "2:3", calc: 2 / 3 },
              { label: "5:4", calc: 5 / 4 },
              { label: "4:5", calc: 4 / 5 },
              { label: "21:9", calc: 21 / 9 },
            ];
          let v117 = v116[0],
            v118 = Math["abs"](v115 - v117["calc"]);
          for (let v119 = 1; v119 < v116["length"]; v119++) {
            const v120 = Math["abs"](v115 - v116[v119]["calc"]);
            v120 < v118 && ((v118 = v120), (v117 = v116[v119]));
          }
          v110 = v117["label"];
        }
      }
    }
    await ensureConfig();
    const v121 = getProviderConfig(v106);
    let v122 = "";
    if (v106 === "runninghub")
      v122 = isRunningHubModelApiImageTask(v105, v106)
        ? v121["modelApiKey"] || ""
        : v121["apiKey"] || "";
    else
      v106 === "runninghubwf"
        ? (v122 = v121["apiKey"] || "")
        : (v122 = v121["apiKey"] || window["_appApiKey"] || "");
    const v123 = {
        prompt: "",
        model: v105,
        aspectRatio: v110,
        imageSize: v104["imageSize"] || "2K",
        batchSize: 1,
        inputUrls: v107 ? [v107] : [],
        apiKey: v122,
        provider: v106,
        cameraAngle: { rotation: v100, pitch: v101, scale: v102 },
      },
      v124 = Date["now"](),
      v125 = _isRunningHubTaskModel(v105, v106),
      v126 = _isDreaminaTaskModel(v105, v106),
      v127 = !v125 && !v126,
      v128 = String(v106 || "")
        ["trim"]()
        ["toLowerCase"](),
      v129 = shouldUseRunningHubOpenapiQuery(v105, v106);
    let v130 = 288,
      v131 = 288;
    const v132 = v110["split"](":");
    if (v132["length"] === 2) {
      const v133 = parseFloat(v132[0]),
        v134 = parseFloat(v132[1]);
      if (v133 && v134) {
        const v135 = getAutoMediaSizeByShortSide(v133, v134);
        ((v130 = v135["width"]), (v131 = v135["height"]));
      }
    }
    const { x: v136, y: v137 } = calcSafeSpawnPosNearNode(
        v103["nodes"],
        v104,
        v130,
        v131,
      ),
      v138 = generateId("source-image-rotate"),
      v139 = () => {
        return isTaskCancelled(appStore["getState"]()["nodes"]?.[v138]);
      },
      v140 = getImageFunctionModelDisplayName(
        v105,
        this["_modelCatalog"] || buildImageFreeAngleModelCatalog(),
      );
    appStore["addNode"](
      buildSourceMediaNodePayload({
        id: v138,
        type: "source-image",
        x: v136,
        y: v137,
        width: v130,
        height: v131,
        name: "旋转中...",
        src: "",
        ...buildGenerationStartPatch({ startedAt: v124 }),
        ...(v125 || v126 || v127 ? { provider: v106, model: v105 } : {}),
        ...(v125
          ? {
              rhSourceNodeId: v104["id"],
              rhToolbarTaskType: "image-free-angle",
            }
          : {}),
        ...(v125
          ? _buildRunningHubTaskPatch({
              taskId: "",
              status: "pending",
              startedAt: v124,
              recovering: false,
              useOpenapiQuery: v129,
            })
          : {}),
        ...(v126
          ? _buildDreaminaTaskPatch({
              submitId: "",
              status: "pending",
              phase: "generating",
              label: "提交中",
              startedAt: v124,
              recovering: false,
            })
          : {}),
        ...(v127
          ? _buildAsyncTaskPatch({
              provider: v128,
              kind: "image",
              taskId: "",
              status: "pending",
              startedAt: v124,
              recovering: false,
            })
          : {}),
        outputText:
          "模型:\x20" +
          v140 +
          "\n相机角度: 旋转" +
          v100 +
          "° 俯仰" +
          v101 +
          "°\x20缩放" +
          v102,
      }),
    );
    (v125 || v126 || v127) && _persistRunningHubResumeCache();
    appStore["setSelectedNodes"]([v138]);
    typeof window["v2FocusOnNodes"] === "function"
      ? window["v2FocusOnNodes"]([v104["id"], v138])
      : window["v2FocusOnNode"]?.(v138);
    try {
      const v141 = await generateImage(v123, {
        onTaskMeta: ({
          taskId: v142,
          useOpenapiQuery: v143,
          provider: v144,
        }) => {
          const v145 = String(v142 || "")["trim"]();
          if (!v145) return;
          const v146 = appStore["getState"]()["nodes"]?.[v138];
          if (!v146) return;
          if (v139()) return;
          if (v125) {
            (appStore["updateNodeData"](v138, {
              ..._buildRunningHubTaskPatch({
                taskId: v145,
                status: "running",
                startedAt: v124,
                recovering: false,
                useOpenapiQuery: v143 === true,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          if (v126) {
            (appStore["updateNodeData"](v138, {
              ..._buildDreaminaTaskPatch({
                submitId: v145,
                status: "pending",
                phase: "generating",
                label: "生成中",
                startedAt: v124,
                recovering: false,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          v127 &&
            (appStore["updateNodeData"](v138, {
              ..._buildAsyncTaskPatch({
                provider: String(v144 || v146?.["asyncTaskProvider"] || v128)[
                  "trim"
                ](),
                kind: "image",
                taskId: v145,
                status: "running",
                startedAt: v124,
                recovering: false,
              }),
            }),
            _persistRunningHubResumeCache());
        },
        onTaskId: (v147) => {
          const v148 = String(v147 || "")["trim"]();
          if (!v148) return;
          const v149 = appStore["getState"]()["nodes"]?.[v138];
          if (!v149) return;
          if (v139()) return;
          if (v125) {
            (appStore["updateNodeData"](v138, {
              ..._buildRunningHubTaskPatch({
                taskId: v148,
                status: "running",
                startedAt: v124,
                recovering: false,
                useOpenapiQuery:
                  v149?.["rhTaskUseOpenapiQuery"] === true || v129,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          if (v126) {
            (appStore["updateNodeData"](v138, {
              ..._buildDreaminaTaskPatch({
                submitId: v148,
                status: "pending",
                phase: "generating",
                label: "生成中",
                startedAt: v124,
                recovering: false,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          v127 &&
            (appStore["updateNodeData"](v138, {
              ..._buildAsyncTaskPatch({
                provider: String(v149?.["asyncTaskProvider"] || v128)["trim"](),
                kind: "image",
                taskId: v148,
                status: "running",
                startedAt: v124,
                recovering: false,
              }),
            }),
            _persistRunningHubResumeCache());
        },
      });
      if (v139()) return;
      const v150 =
        v141 &&
        v141["isBatch"] &&
        Array["isArray"](v141["images"]) &&
        v141["images"][0]
          ? v141["images"][0]
          : v141;
      if (v150?.["error"]) throw new Error(String(v150["error"]));
      const v151 = pickResultLocalPath(v150),
        v152 =
          localPathToUrl(v151) ||
          v150?.["sourceUrl"] ||
          v150?.["imageUrl"] ||
          v150?.["url"] ||
          "";
      if (!v152) throw new Error("无法获取生成的图像 URL");
      const v153 = (v154) => {
          const v155 = String(v154 || ""),
            v156 = v155["split"]("/")["pop"]() || "";
          return v156;
        },
        v157 = appStore["getState"]()["nodes"]?.[v138],
        v158 = v157?.["generationStartTime"]
          ? Date["now"]() - v157["generationStartTime"]
          : 0,
        v159 = buildImageGenerationResultPatch(
          {
            ...v150,
            localPath: v151,
            sourceUrl: v150?.["sourceUrl"] || v150?.["imageUrl"] || v152,
            imageUrl: v150?.["imageUrl"] || v150?.["sourceUrl"] || v152,
            thumbUrl:
              v150?.["thumbUrl"] ||
              v150?.["sourceUrl"] ||
              v150?.["imageUrl"] ||
              "",
          },
          { startedAt: v124, duration: v158 },
        );
      (appStore["updateNodeData"](v138, {
        ...v159,
        name: "旋转结果",
        src: v152,
        fileName: v151 ? v153(v151) : "",
        ...(v125
          ? _buildRunningHubTaskPatch({
              taskId: v157?.["rhTaskId"] || "",
              status: "success",
              startedAt: v124,
              recovering: false,
              useOpenapiQuery: v157?.["rhTaskUseOpenapiQuery"] === true || v129,
            })
          : {}),
        ...(v126
          ? _buildDreaminaTaskPatch({
              submitId: v157?.["dreaminaSubmitId"] || "",
              status: "success",
              phase: "done",
              label: "已完成",
              startedAt: v124,
              recovering: false,
            })
          : {}),
        ...(v127
          ? _buildAsyncTaskPatch({
              provider: v157?.["asyncTaskProvider"] || v128,
              kind: "image",
              taskId: v157?.["asyncTaskId"] || "",
              status: "success",
              startedAt: v124,
              recovering: false,
            })
          : {}),
      }),
        (v125 || v126 || v127) && _persistRunningHubResumeCache(),
        window["showToast"]?.("图像生成成功！", "success"));
    } catch (v160) {
      if (v139()) return;
      const v161 = appStore["getState"]()["nodes"]?.[v138];
      if (v161) {
        const v162 = v161?.["generationStartTime"]
            ? Date["now"]() - v161["generationStartTime"]
            : 0,
          v163 = v160?.["message"] || "未知错误";
        (appStore["updateNodeData"](v138, {
          ...buildImageGenerationFailurePatch({
            error: v163,
            startedAt: v124,
            duration: v162,
          }),
          name: "生成失败",
          src: "",
          ...(v125
            ? _buildRunningHubTaskPatch({
                taskId: v161?.["rhTaskId"] || "",
                status: "failed",
                startedAt: v124,
                recovering: false,
                useOpenapiQuery:
                  v161?.["rhTaskUseOpenapiQuery"] === true || v129,
              })
            : {}),
          ...(v126
            ? _buildDreaminaTaskPatch({
                submitId: v161?.["dreaminaSubmitId"] || "",
                status: "failed",
                phase: "failed",
                label: v163 || "生成失败",
                startedAt: v124,
                recovering: false,
              })
            : {}),
          ...(v127
            ? _buildAsyncTaskPatch({
                provider: v161?.["asyncTaskProvider"] || v128,
                kind: "image",
                taskId: v161?.["asyncTaskId"] || "",
                status: "failed",
                startedAt: v124,
                recovering: false,
              })
            : {}),
          outputText: "失败原因: " + v163,
        }),
          (v125 || v126 || v127) && _persistRunningHubResumeCache());
      }
      window["showToast"]?.("生成失败: " + v160["message"], "error");
    }
  },
  async _handleDebug() {
    if (!this["nodeId"]) return;
    const v164 = appStore["getStateRaw"](),
      v165 = v164["nodes"]?.[this["nodeId"]];
    if (!v165) return;
    let v166 = this["_currentModel"] || "nano-banana-2";
    const v167 = _resolveImageProvider(
        v166,
        this["_currentProvider"] || v165["provider"],
      ),
      { rotation: v168, pitch: v169, scale: v170 } = this["state"];
    let v171 = null;
    const v172 = document["getElementById"](this["nodeId"]);
    if (v172) {
      const v173 = v172["querySelector"]("img");
      v173 && (v171 = v173["src"]);
    }
    !v171 && v165["imageUrl"] && (v171 = v165["imageUrl"]);
    !v171 && v165["outputImage"] && (v171 = v165["outputImage"]);
    let v174 = v165["aspectRatio"] || "1:1";
    if (v174 === "自适应" || v174 === "auto" || v174 === "1:1") {
      if (v171) {
        let v175 = v165["imgWidth"] || v165["naturalWidth"] || 0,
          v176 = v165["imgHeight"] || v165["naturalHeight"] || 0;
        !v175 &&
          v165["src"] &&
          v165["type"] === "source-image" &&
          ((v175 = v165["originalWidth"] || 0),
          (v176 = v165["originalHeight"] || 0));
        if (!v175 || !v176) {
          if (v172) {
            const v177 = v172["querySelector"]("img");
            v177 &&
              v177["naturalWidth"] &&
              v177["naturalHeight"] &&
              ((v175 = v177["naturalWidth"]), (v176 = v177["naturalHeight"]));
          }
        }
        if (v175 && v176) {
          const v178 = v175 / v176,
            v179 = [
              { label: "1:1", calc: 1 / 1 },
              { label: "9:16", calc: 9 / 16 },
              { label: "16:9", calc: 16 / 9 },
              { label: "3:4", calc: 3 / 4 },
              { label: "4:3", calc: 4 / 3 },
              { label: "3:2", calc: 3 / 2 },
              { label: "2:3", calc: 2 / 3 },
              { label: "5:4", calc: 5 / 4 },
              { label: "4:5", calc: 4 / 5 },
              { label: "21:9", calc: 21 / 9 },
            ];
          let v180 = v179[0],
            v181 = Math["abs"](v178 - v180["calc"]);
          for (let v182 = 1; v182 < v179["length"]; v182++) {
            const v183 = Math["abs"](v178 - v179[v182]["calc"]);
            v183 < v181 && ((v181 = v183), (v180 = v179[v182]));
          }
          v174 = v180["label"];
        }
      }
    }
    await ensureConfig();
    const v184 = getProviderConfig(v167);
    let v185 = "";
    if (v167 === "runninghub")
      v185 = isRunningHubModelApiImageTask(v166, v167)
        ? v184["modelApiKey"] || ""
        : v184["apiKey"] || "";
    else
      v167 === "runninghubwf"
        ? (v185 = v184["apiKey"] || "")
        : (v185 = v184["apiKey"] || window["_appApiKey"] || "");
    const v186 = {
      prompt: "",
      model: v166,
      aspectRatio: v174,
      imageSize: v165["imageSize"] || "2K",
      batchSize: 1,
      inputUrls: v171 ? [v171] : [],
      apiKey: v185,
      provider: v167,
      cameraAngle: { rotation: v168, pitch: v169, scale: v170 },
    };
    try {
      const v187 = await buildGenerateImageRequest(v186),
        v188 = formatFinalApiDebugRequest(v187),
        { x: v189, y: v190 } = calcSafeSpawnPosNearNode(
          v164["nodes"],
          v165,
          380,
          300,
        );
      let v191 = Object["values"](v164["nodes"])["find"](
        (v192) => v192["type"] === "debug",
      );
      !v191
        ? appStore["addNode"]({
            id: "debug-" + Date["now"](),
            type: "debug",
            x: v189,
            y: v190,
            width: 380,
            height: 300,
            name: "调试节点",
            outputText: v188,
          })
        : appStore["updateNodeData"](v191["id"], {
            outputText: v188,
            x: v189,
            y: v190,
          });
    } catch (v193) {
      (console["error"]("[ImageFreeAngleController] 调试请求构建失败:", v193),
        window["showToast"]?.(
          "调试参数构建失败:\x20" + v193["message"],
          "error",
        ));
    }
  },
};
export default ImageFreeAngleController;

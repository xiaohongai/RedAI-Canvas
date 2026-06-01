import appStore from "../core/stores/appStore.js";
import { worldToScreen, generateId } from "../core/math.js";
import { getDisplayModelName } from "./providers.js";
import { IMAGE_MODELS } from "../config/modelConfig.js";
import {
  buildGenerateImageRequest,
  generateImage,
} from "../../api/aiImageApi.js";
import { calcSafeSpawnPosNearNode } from "./nodeSpawn.js";
import { buildSourceMediaNodePayload } from "../services/fileService.js";
import {
  OUTPUT_RATIO_SWITCH_THRESHOLD,
  calcDisplaySizeByMedia,
  resolveInputRatioBasis,
  resolveOutputMediaSize,
  shouldSwitchToOutputRatio,
} from "../services/mediaRatioService.js";
import {
  bindImageFunctionModeMenu,
  bindImageFunctionModelMenu,
  buildImageFunctionModeControlHTML,
  buildImageFunctionModelCatalog,
  buildImageFunctionModelMenuHTML,
  closeImageFunctionModelSubmenus,
  findImageFunctionProviderByModel,
  getDefaultImageFunctionModelState,
  getImageFunctionNanoSelection,
  getImageFunctionModelDisplayName,
  getImageFunctionModelTriggerIconHTML,
  resolveImageFunctionModelByMode,
  syncImageFunctionModeControl,
  syncImageFunctionModelMenuActive,
} from "./imageFunctionModelMenu.js";
import { shouldDisableImageSizeControl } from "./imageModelCapabilities.js";
import {
  DEBUG_WRENCH_ICON_HTML,
  formatFinalApiDebugRequest,
} from "../utils/debugRequestPreview.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
import {
  bindToolbarUpMenus,
  renderToolbarUpMenu,
} from "./imageToolbarUpMenu.js";
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from "../components/aigenImage/imageGenerationResultRenderer.js";
import { buildGenerationStartPatch } from "../core/generationTaskLifecycle.js";
import { isTaskCancelled } from "../core/generationTaskUiState.js";
import {
  isDreaminaImageTaskModel,
  isRunningHubImageTaskModel,
  resolveImageTaskProvider,
  shouldUseRunningHubOpenapiQuery,
} from "./imageTaskModelResolver.js";
const EXPAND_RATIO_OPTIONS = [
    { value: "original", label: "原图比例" },
    { value: "21:9", label: "21:9" },
    { value: "16:9", label: "16:9" },
    { value: "9:16", label: "9:16" },
    { value: "4:3", label: "4:3" },
    { value: "3:4", label: "3:4" },
    { value: "1:1", label: "1:1" },
  ],
  EXPAND_IMAGE_SIZE_OPTIONS = [
    { value: "1K", label: "1K" },
    { value: "2K", label: "2K" },
    { value: "4K", label: "4K" },
  ];
function getExpandRatioOptions() {
  return EXPAND_RATIO_OPTIONS["map"]((v0) => ({
    ...v0,
    selectedLabel: v0["value"] === "original" ? "比例" : v0["label"],
  }));
}
function getExpandImageSizeOptions({ disabled: disabled = false } = {}) {
  return EXPAND_IMAGE_SIZE_OPTIONS["map"]((v1) => ({
    ...v1,
    disabled: disabled,
  }));
}
function isRunningHubTaskModel(v2, v3) {
  return isRunningHubImageTaskModel(v2, v3);
}
function isDreaminaTaskModel(v4, v5) {
  return isDreaminaImageTaskModel(v4, v5);
}
function buildRunningHubTaskPatch({
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
function buildDreaminaTaskPatch({
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
function buildAsyncTaskPatch({
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
function persistRunningHubResumeCache() {
  try {
    window["_triggerLocalCacheSave"]?.();
  } catch {}
}
function buildExpandModelCatalog() {
  return buildImageFunctionModelCatalog(IMAGE_MODELS);
}
function findProviderKeyByModel(v6, v7) {
  const v8 = String(v7 || "")["trim"]();
  if (!v8) return null;
  for (const [v9, v10] of Object["entries"](v6 || {})) {
    const v11 = Array["isArray"](v10?.["models"]) ? v10["models"] : [];
    if (v11["some"]((v12) => v12?.["id"] === v8)) return v9;
  }
  return findImageFunctionProviderByModel(v6, v8);
}
function buildSeedreamMigrationPatch(v13) {
  return (void v13, null);
}
const ImageExpandController = {
  active: false,
  nodeId: null,
  nodeData: null,
  ratioStr: "original",
  imageSize: "1K",
  model: null,
  provider: null,
  overlayEl: null,
  frameEl: null,
  frameRect: null,
  _pointerState: null,
  imgEl: null,
  toolbarEl: null,
  ratioMenuEl: null,
  sizeMenuEl: null,
  modelMenuEl: null,
  _unsubscribe: null,
  _view: null,
  _expandModelCatalog: null,
  _unbindToolbarUpMenus: null,
  cleanup: null,
  init(v14) {
    if (this["active"]) return;
    const v15 = appStore["getStateRaw"](),
      v16 = v15["nodes"]?.[v14];
    if (!v16) return;
    ((this["active"] = true),
      (this["nodeId"] = v14),
      (this["_expandModelCatalog"] = buildExpandModelCatalog()));
    const v17 = this["_normalizeLegacySeedreamNode"](v16);
    ((this["nodeData"] = v17),
      (this["_view"] = { viewport: v15["viewport"], node: v17 }),
      (this["ratioStr"] = "original"),
      (this["imageSize"] = "1K"));
    const v18 = this["_getExpandModelCatalog"](),
      v19 = getDefaultImageFunctionModelState(v18),
      v20 = String(v17?.["model"] || "")["trim"](),
      v21 = String(v17?.["provider"] || "")["trim"](),
      v22 = findProviderKeyByModel(v18, v20);
    if (v22) ((this["model"] = v20), (this["provider"] = v22));
    else
      v19["model"]
        ? ((this["model"] = v19["model"]), (this["provider"] = v19["provider"]))
        : ((this["model"] = v20 || ""),
          (this["provider"] = resolveImageTaskProvider(
            v20,
            v21,
            v19["provider"] || "",
          )));
    (this["_createUI"](),
      this["_bindEvents"](),
      (this["_unsubscribe"] = appStore["subscribeSelector"](
        (v23) => {
          const v24 = v23["nodes"]?.[v14],
            v25 = v23["viewport"] || { x: 0, y: 0, zoom: 1 };
          return {
            hasNode: !!v24,
            vx: v25["x"],
            vy: v25["y"],
            vz: v25["zoom"] || 1,
            nx: v24 ? v24["x"] : 0,
            ny: v24 ? v24["y"] : 0,
            nw: v24 ? v24["width"] : 0,
            nh: v24 ? v24["height"] : 0,
          };
        },
        (v26) => {
          if (!v26?.["hasNode"]) return;
          const v27 = appStore["getStateRaw"]()["nodes"]?.[v14];
          if (!v27) return;
          const v28 = this["_normalizeLegacySeedreamNode"](v27);
          ((this["nodeData"] = v28),
            (this["_view"] = {
              viewport: { x: v26["vx"], y: v26["vy"], zoom: v26["vz"] },
              node: v28,
            }),
            this["_updateView"](this["_view"]));
        },
      )),
      this["_waitForImageAndShow"]());
  },
  _waitForImageAndShow() {
    const v29 = () => {
      this["imgEl"] &&
      this["imgEl"]["complete"] &&
      this["imgEl"]["naturalWidth"] > 0
        ? (this["_updateView"](this["_view"]),
          requestAnimationFrame(() => {
            if (this["overlayEl"])
              this["overlayEl"]["classList"]["add"]("visible");
          }))
        : requestAnimationFrame(v29);
    };
    v29();
  },
  _getExpandModelCatalog() {
    return (
      !this["_expandModelCatalog"] &&
        (this["_expandModelCatalog"] = buildExpandModelCatalog()),
      this["_expandModelCatalog"]
    );
  },
  _normalizeLegacySeedreamNode(v30) {
    const v31 = buildSeedreamMigrationPatch(v30);
    if (!v31) return v30;
    const v32 = { ...(v30 || {}), ...v31 },
      v33 = appStore["getStateRaw"]()["nodes"]?.[this["nodeId"]];
    return (v33 && appStore["updateNodeData"](this["nodeId"], v31), v32);
  },
  _getImageUrl() {
    const v34 = this["nodeData"] || {};
    return (
      localPathToUrl(v34["localPath"]) ||
      v34["src"] ||
      v34["imageUrl"] ||
      v34["sourceUrl"]
    );
  },
  _createExpandedImage(v35, v36) {
    return new Promise((v37, v38) => {
      const v39 = new Image();
      ((v39["crossOrigin"] = "anonymous"),
        (v39["onload"] = async () => {
          try {
            const v40 = document["createElement"]("canvas"),
              v41 = v40["getContext"]("2d"),
              v42 = v39["naturalWidth"],
              v43 = v39["naturalHeight"],
              v44 = v35,
              v45 = {
                x: v36["x"] || 0,
                y: v36["y"] || 0,
                w: v36["width"] || 1,
                h: v36["height"] || 1,
              },
              v46 = v42 / v45["w"],
              v47 = v43 / v45["h"],
              v48 = Math["round"](v44["w"] * v46),
              v49 = Math["round"](v44["h"] * v47);
            ((v40["width"] = v48),
              (v40["height"] = v49),
              (v41["fillStyle"] = "#00FF00"),
              v41["fillRect"](0, 0, v48, v49));
            const v50 = Math["round"]((v45["x"] - v44["x"]) * v46),
              v51 = Math["round"]((v45["y"] - v44["y"]) * v47);
            (v41["drawImage"](v39, v50, v51, v42, v43),
              v40["toBlob"]((v52) => {
                if (v52) {
                  const v53 = URL["createObjectURL"](v52);
                  v37({ url: v53, width: v48, height: v49 });
                } else v38(new Error("无法创建扩展图像"));
              }, "image/png"));
          } catch (v54) {
            v38(v54);
          }
        }),
        (v39["onerror"] = () => {
          v38(new Error("无法加载原始图像"));
        }));
      const v55 =
        localPathToUrl(v36["localPath"]) ||
        v36["src"] ||
        v36["imageUrl"] ||
        v36["sourceUrl"];
      v39["src"] = v55;
    });
  },
  _buildGenerationPayload(v56, v57, v58) {
    const v59 = this["ratioStr"] === "original";
    return {
      prompt: "移除绿区域，并在绿色区域内生成符合画面的场景",
      model: v56,
      provider: v57,
      ...(v59
        ? { suppressAspectRatio: true }
        : { aspectRatio: this["ratioStr"] }),
      imageSize: this["imageSize"],
      inputUrls: [v58],
      batchSize: 1,
    };
  },
  _formatDebugRequest(v60) {
    return formatFinalApiDebugRequest(v60);
  },
  _upsertDebugNode(v61, v62) {
    const v63 = appStore["getStateRaw"](),
      v64 = v62 || v63["nodes"]?.[this["nodeId"]] || this["nodeData"] || {},
      { x: v65, y: v66 } = calcSafeSpawnPosNearNode(
        v63["nodes"],
        v64,
        380,
        300,
      ),
      v67 = Object["values"](v63["nodes"])["find"](
        (v68) => v68["type"] === "debug",
      );
    !v67
      ? appStore["addNode"]({
          id: "debug-" + Date["now"](),
          type: "debug",
          x: v65,
          y: v66,
          width: 380,
          height: 300,
          name: "调试节点",
          outputText: v61,
        })
      : appStore["updateNodeData"](v67["id"], {
          outputText: v61,
          x: v65,
          y: v66,
        });
  },
  async _handleDebug() {
    let v69 = null;
    try {
      const v70 = appStore["getStateRaw"](),
        v71 = v70["nodes"]?.[this["nodeId"]];
      if (!v71) {
        window["showToast"]?.("找不到原节点，无法构造调试参数", "warn");
        return;
      }
      if (!this["frameRect"]) this["frameRect"] = this["_calcFrameWorldRect"]();
      const v72 = String(this["model"] || "")["trim"](),
        v73 = resolveImageTaskProvider(v72, this["provider"], "");
      v69 = await this["_createExpandedImage"](
        { ...this["frameRect"] },
        { ...v71 },
      );
      const v74 = this["_buildGenerationPayload"](v72, v73, v69["url"]),
        v75 = await buildGenerateImageRequest(v74);
      (this["_upsertDebugNode"](this["_formatDebugRequest"](v75), v71),
        window["showToast"]?.("🔧 已展示扩图 API 参数", "warn"));
    } catch (v76) {
      (console["error"]("[ImageExpandController] 调试请求构建失败:", v76),
        window["showToast"]?.(
          "调试参数构建失败: " + (v76?.["message"] || "未知错误"),
          "error",
        ));
    } finally {
      v69?.["url"] && URL["revokeObjectURL"](v69["url"]);
    }
  },
  _parseRatio() {
    if (this["ratioStr"] === "original")
      return (
        (this["nodeData"]["width"] || 1) / (this["nodeData"]["height"] || 1)
      );
    const v77 = this["ratioStr"]["split"](":")["map"]((v78) => Number(v78));
    if (v77["length"] !== 2 || !v77[0] || !v77[1])
      return (
        (this["nodeData"]["width"] || 1) / (this["nodeData"]["height"] || 1)
      );
    return v77[0] / v77[1];
  },
  _calcFrameWorldRect() {
    const v79 = this["nodeData"],
      v80 = v79["width"] || 1,
      v81 = v79["height"] || 1,
      v82 = v79["x"] + v80 / 2,
      v83 = v79["y"] + v81 / 2,
      v84 = v80 / v81,
      v85 = this["_parseRatio"]();
    let v86, v87;
    v85 >= v84
      ? ((v87 = v81), (v86 = v81 * v85))
      : ((v86 = v80), (v87 = v80 / v85));
    const v88 = 1.35,
      v89 = Math["max"](v80, v86) * v88,
      v90 = Math["max"](v81, v87) * v88;
    return { x: v82 - v89 / 2, y: v83 - v90 / 2, w: v89, h: v90 };
  },
  _getNodeWorldRect() {
    const v91 = this["nodeData"] || {},
      v92 = v91["width"] || 1,
      v93 = v91["height"] || 1;
    return { x: v91["x"] || 0, y: v91["y"] || 0, w: v92, h: v93 };
  },
  _clampFrameRect(v94) {
    const v95 = this["_getNodeWorldRect"](),
      v96 = (v97, v98, v99) => Math["min"](v99, Math["max"](v98, v97)),
      v100 = {
        x: Number(v94?.["x"]) || 0,
        y: Number(v94?.["y"]) || 0,
        w: Number(v94?.["w"]) || 1,
        h: Number(v94?.["h"]) || 1,
      },
      v101 = Math["max"](v95["w"], 24),
      v102 = Math["max"](v95["h"], 24);
    ((v100["w"] = Math["max"](v100["w"], v101)),
      (v100["h"] = Math["max"](v100["h"], v102)));
    if (this["ratioStr"] !== "original") {
      const v103 = this["_parseRatio"](),
        v104 = v100["x"] + v100["w"] / 2,
        v105 = v100["y"] + v100["h"] / 2;
      let v106 = v100["w"],
        v107 = v100["h"];
      (v106 / v107 > v103 ? (v107 = v106 / v103) : (v106 = v107 * v103),
        v106 < v101 && ((v106 = v101), (v107 = v106 / v103)),
        v107 < v102 && ((v107 = v102), (v106 = v107 * v103)),
        (v100["w"] = v106),
        (v100["h"] = v107),
        (v100["x"] = v104 - v100["w"] / 2),
        (v100["y"] = v105 - v100["h"] / 2));
    }
    const v108 = v95["x"] + v95["w"] - v100["w"],
      v109 = v95["x"],
      v110 = v95["y"] + v95["h"] - v100["h"],
      v111 = v95["y"];
    return (
      (v100["x"] = v96(v100["x"], v108, v109)),
      (v100["y"] = v96(v100["y"], v110, v111)),
      v100
    );
  },
  _closeToolbarUpMenus(v112 = null) {
    this["toolbarEl"]
      ?.["querySelectorAll"]("[data-toolbar-up-menu-menu]")
      ["forEach"]((v113) => {
        if (v113 === v112) return;
        const v114 =
          String(v113?.["dataset"]?.["toolbarUpMenuOpenClass"] || "open")[
            "trim"
          ]() || "open";
        (v113["classList"]["remove"](v114),
          v113["classList"]["remove"]("open"),
          v113["classList"]["remove"]("show"));
      });
  },
  _createUI() {
    const v115 = document["createElement"]("div");
    v115["className"] = "v2-expand-overlay";
    const v116 = document["createElement"]("div");
    ((v116["className"] = "v2-expand-frame"),
      ["tl", "tr", "bl", "br", "tm", "bm", "lm", "rm"]["forEach"]((v117) => {
        const v118 = document["createElement"]("div");
        ((v118["className"] = "v2-expand-handle " + v117),
          (v118["dataset"]["handle"] = v117),
          v116["appendChild"](v118));
      }));
    const v119 = document["createElement"]("img");
    ((v119["className"] = "v2-expand-img"),
      (v119["draggable"] = false),
      (v119["src"] = this["_getImageUrl"]()),
      v115["appendChild"](v116),
      v115["appendChild"](v119),
      document["body"]["appendChild"](v115),
      (this["overlayEl"] = v115),
      (this["frameEl"] = v116),
      (this["imgEl"] = v119),
      (this["frameRect"] = this["_calcFrameWorldRect"]()));
    const v120 = document["createElement"]("div");
    v120["className"] = "v2-expand-toolbar";
    const v121 = this["_getExpandModelCatalog"](),
      v122 = getImageFunctionModelDisplayName(this["model"], v121),
      v123 = getImageFunctionModelTriggerIconHTML(
        this["model"],
        this["provider"],
      ),
      v124 = shouldDisableImageSizeControl(this["model"], this["provider"]),
      v125 = buildImageFunctionModelMenuHTML({
        activeModel: this["model"],
        activeProvider: this["provider"],
        modelCatalog: v121,
      });
    ((v120["innerHTML"] =
      "\x0a\x20\x20\x20\x20\x20\x20<button\x20class=\x22v2-expand-toolbar-btn\x20exit\x22\x20title=\x22退出\x20(Esc)\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2218\x22\x20height=\x2218\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><path\x20d=\x22M18\x206L6\x2018M6\x206l12\x2012\x22/></svg>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-expand-divider\x22></div>\x0a\x20\x20\x20\x20\x20\x20" +
      renderToolbarUpMenu({
        fieldId: "ratio",
        value: this["ratioStr"],
        options: getExpandRatioOptions(),
        triggerClass: "ratio-toggle",
        labelClass: "ratio-text",
        menuClass: "v2-expand-menu ratio-menu",
        itemClass: "v2-expand-menu-item",
      }) +
      "\n      " +
      renderToolbarUpMenu({
        fieldId: "size",
        value: this["imageSize"],
        options: getExpandImageSizeOptions({ disabled: v124 }),
        triggerClass: "size-toggle",
        labelClass: "size-text",
        menuClass: "v2-expand-menu size-menu",
        itemClass: "v2-expand-menu-item",
        disabled: v124,
      }) +
      '\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn model-toggle">\n          <span class="image-function-model-trigger-icon-slot">' +
      v123 +
      '</span>\n          <span class="model-text">' +
      v122 +
      "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2210\x22\x20height=\x2210\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20style=\x22opacity:0.5;margin-left:2px;\x22><polyline\x20points=\x226\x209\x2012\x2015\x2018\x209\x22></polyline></svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22floating-menu\x20img-model-menu\x20model-menu\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
      v125 +
      "\n        </div>\n      </div>\n      " +
      buildImageFunctionModeControlHTML({
        model: this["model"],
        provider: this["provider"],
        imageSize: this["imageSize"],
        wrapClass: "v2-expand-wrap",
        buttonClass: "v2-expand-toolbar-btn",
      }) +
      '\n      <button class="v2-expand-toolbar-btn debug-wrench-btn" type="button" title="调试 API 参数" aria-label="调试 API 参数">\n        ' +
      DEBUG_WRENCH_ICON_HTML +
      "\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20<button\x20class=\x22v2-expand-toolbar-btn\x20go\x20img-gen-btn\x22\x20title=\x22生成扩图\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2214\x22\x20height=\x2214\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><path\x20d=\x22M12\x2019V5\x22/><path\x20d=\x22M5\x2012l7-7\x207\x207\x22/></svg>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20"),
      document["body"]["appendChild"](v120),
      (this["toolbarEl"] = v120),
      (this["ratioMenuEl"] = v120["querySelector"](".ratio-menu")),
      (this["sizeMenuEl"] = v120["querySelector"](".size-menu")),
      (this["modelMenuEl"] = v120["querySelector"](".model-menu")),
      this["_updateView"](this["_view"]));
  },
  _updateView(v126 = this["_view"]) {
    if (!this["active"]) return;
    const v127 = v126?.["node"],
      v128 = v126?.["viewport"];
    if (!v127) return;
    this["nodeData"] = v127;
    if (!this["frameRect"]) this["frameRect"] = this["_calcFrameWorldRect"]();
    this["frameRect"] = this["_clampFrameRect"](this["frameRect"]);
    const v129 = this["frameRect"],
      v130 = worldToScreen(v129["x"], v129["y"], v128),
      v131 = Math["round"](v129["w"] * v128["zoom"]),
      v132 = Math["round"](v129["h"] * v128["zoom"]);
    ((this["frameEl"]["style"]["left"] = Math["round"](v130["x"]) + "px"),
      (this["frameEl"]["style"]["top"] = Math["round"](v130["y"]) + "px"),
      (this["frameEl"]["style"]["width"] = v131 + "px"),
      (this["frameEl"]["style"]["height"] = v132 + "px"));
    const v133 = worldToScreen(v127["x"], v127["y"], v128),
      v134 = Math["round"](v127["width"] * v128["zoom"]),
      v135 = Math["round"](v127["height"] * v128["zoom"]);
    ((this["imgEl"]["style"]["left"] = Math["round"](v133["x"]) + "px"),
      (this["imgEl"]["style"]["top"] = Math["round"](v133["y"]) + "px"),
      (this["imgEl"]["style"]["width"] = v134 + "px"),
      (this["imgEl"]["style"]["height"] = v135 + "px"));
    if (this["toolbarEl"]) {
      const v136 = v133["y"] + v135 + 14;
      ((this["toolbarEl"]["style"]["top"] = v136 + "px"),
        (this["toolbarEl"]["style"]["left"] = v133["x"] + v134 / 2 + "px"),
        (this["toolbarEl"]["style"]["transform"] = "translateX(-50%)"),
        (this["toolbarEl"]["style"]["bottom"] = "auto"));
    }
  },
  _bindEvents() {
    const v137 = () => this["_updateView"](this["_view"]);
    window["addEventListener"]("resize", v137);
    const v138 = (v139) => {
      if (v139["key"] === "Escape") this["exit"]();
    };
    window["addEventListener"]("keydown", v138);
    const v140 = (v141) => v141["stopPropagation"]();
    this["overlayEl"]["addEventListener"]("wheel", v140, { passive: false });
    const v142 = this["modelMenuEl"],
      v143 = this["toolbarEl"]["querySelector"](".model-text"),
      v144 = this["toolbarEl"]["querySelector"](
        ".image-function-model-trigger-icon-slot",
      ),
      v145 = this["toolbarEl"]["querySelector"](".model-toggle"),
      v146 = this["toolbarEl"]["querySelector"](".image-function-mode-toggle"),
      v147 = this["toolbarEl"]["querySelector"](".image-function-mode-menu"),
      v148 = this["_getExpandModelCatalog"](),
      v149 = () => {
        const v150 = shouldDisableImageSizeControl(
            this["model"],
            this["provider"],
          ),
          v151 = this["toolbarEl"]["querySelector"](".size-toggle");
        (v151 &&
          ((v151["disabled"] = v150),
          v151["classList"]["toggle"]("is-disabled", v150),
          v151["setAttribute"]("aria-disabled", v150 ? "true" : "false")),
          this["sizeMenuEl"]
            ?.["querySelectorAll"]('[data-toolbar-up-menu-field="size"]')
            ["forEach"]((v152) => {
              (v152["classList"]["toggle"]("disabled", v150),
                (v152["dataset"]["disabled"] = v150 ? "true" : "false"));
            }),
          v150 && this["sizeMenuEl"]?.["classList"]["remove"]("open"));
      },
      v153 = () =>
        syncImageFunctionModeControl({
          root: this["toolbarEl"],
          model: this["model"],
          provider: this["provider"],
          imageSize: this["imageSize"],
        }),
      v154 = (v155, v156, { syncStore: syncStore = true } = {}) => {
        const v157 = String(v155 || "")["trim"](),
          v158 = String(resolveImageTaskProvider(v157, v156, ""))["trim"]();
        if (!v157 || !v158) return;
        const v159 = this["model"] !== v157 || this["provider"] !== v158;
        ((this["model"] = v157),
          (this["provider"] = v158),
          v143 &&
            (v143["textContent"] = getImageFunctionModelDisplayName(
              v157,
              v148,
            )),
          v144 &&
            (v144["innerHTML"] = getImageFunctionModelTriggerIconHTML(
              v157,
              v158,
            )),
          syncImageFunctionModelMenuActive({
            modelMenu: v142,
            model: v157,
            provider: v158,
          }),
          v153(),
          v149(),
          syncStore &&
            v159 &&
            appStore["updateNodeData"](this["nodeId"], {
              model: v157,
              provider: v158,
            }));
      },
      v160 = () => {
        (this["_closeToolbarUpMenus"](),
          this["modelMenuEl"]?.["classList"]["remove"]("show"),
          v147?.["classList"]["remove"]("show"),
          closeImageFunctionModelSubmenus(this["modelMenuEl"]));
      };
    ((this["toolbarEl"]["querySelector"](".exit")["onclick"] = () =>
      this["exit"]()),
      (this["_unbindToolbarUpMenus"] = bindToolbarUpMenus(this["toolbarEl"], {
        onBeforeOpen: () => {
          (this["modelMenuEl"]?.["classList"]["remove"]("show"),
            v147?.["classList"]["remove"]("show"),
            closeImageFunctionModelSubmenus(this["modelMenuEl"]));
        },
        onSelect: ({ fieldId: v161, value: v162 }) => {
          if (v161 === "ratio") {
            ((this["ratioStr"] =
              String(v162 || "original")["trim"]() || "original"),
              (this["frameRect"] = this["_calcFrameWorldRect"]()),
              this["_updateView"](this["_view"]));
            return;
          }
          if (v161 === "size") {
            if (shouldDisableImageSizeControl(this["model"], this["provider"]))
              return;
            this["imageSize"] = String(v162 || "1K")["trim"]() || "1K";
            const v163 = getImageFunctionNanoSelection(
              this["model"],
              this["provider"],
              this["imageSize"],
            );
            if (v163) {
              const v164 = resolveImageFunctionModelByMode({
                model: this["model"],
                provider: this["provider"],
                imageSize: this["imageSize"],
                mode: v163["mode"],
              });
              v164?.["model"] && v154(v164["model"], v164["provider"]);
            }
            (v153(), v149());
          }
        },
      })));
    if (v145 && v142 && v143) {
      v145["addEventListener"]("click", (v165) => {
        (v165["stopPropagation"](),
          v142["classList"]["toggle"]("show"),
          this["_closeToolbarUpMenus"](),
          v147?.["classList"]["remove"]("show"));
      });
      const v166 = bindImageFunctionModelMenu({
          modelMenu: v142,
          onSelect: ({ model: v167, provider: v168 }) => {
            v154(v167, v168);
          },
          closeMenu: () => {
            v142["classList"]["remove"]("show");
          },
        }),
        v169 = bindImageFunctionModeMenu({
          modeMenu: v147,
          onSelect: ({ mode: v170 }) => {
            const v171 = resolveImageFunctionModelByMode({
              model: this["model"],
              provider: this["provider"],
              imageSize: this["imageSize"],
              mode: v170,
            });
            if (!v171?.["model"]) return;
            (v154(v171["model"], v171["provider"]),
              v147?.["classList"]["remove"]("show"));
          },
        });
      (v146 &&
        v147 &&
        v146["addEventListener"]("click", (v172) => {
          v172["stopPropagation"]();
          if (
            v146["closest"](".image-function-mode-wrap")?.["classList"][
              "contains"
            ]("is-hidden")
          )
            return;
          (v147["classList"]["toggle"]("show"),
            this["_closeToolbarUpMenus"](v147),
            v142["classList"]["remove"]("show"),
            closeImageFunctionModelSubmenus(v142));
        }),
        (this["_unbindImageFunctionMenus"] = () => {
          (v166?.(), v169?.());
        }));
    }
    (v153(), v149());
    const v173 = this["toolbarEl"]["querySelector"](".debug-wrench-btn");
    ((v173["onclick"] = (v174) => {
      (v174["stopPropagation"](),
        v174["preventDefault"](),
        v160(),
        void this["_handleDebug"]());
    }),
      (this["toolbarEl"]["querySelector"](".go")["onclick"] = async () => {
        let v175 = null,
          v176 = null,
          v177 = resolveInputRatioBasis();
        const v178 = String(this["model"] || "")["trim"](),
          v179 = resolveImageTaskProvider(v178, this["provider"], ""),
          v180 = isRunningHubTaskModel(v178, v179),
          v181 = isDreaminaTaskModel(v178, v179),
          v182 = !v180 && !v181,
          v183 = String(v179 || "")
            ["trim"]()
            ["toLowerCase"](),
          v184 = shouldUseRunningHubOpenapiQuery(v178, v179),
          v185 = Date["now"]();
        try {
          window["showToast"]?.("正在生成扩图...", "loading");
          const v186 = appStore["getStateRaw"](),
            v187 = v186["nodes"]?.[this["nodeId"]];
          if (!v187) return;
          const v188 = { ...this["frameRect"] },
            v189 = { ...v187 };
          ((v176 = await this["_createExpandedImage"](v188, v189)),
            (v177 = resolveInputRatioBasis(
              { width: v176?.["width"], height: v176?.["height"] },
              { width: v187["width"], height: v187["height"] },
            )));
          const { width: v190, height: v191 } = calcDisplaySizeByMedia(
              v177["width"],
              v177["height"],
            ),
            { x: v192, y: v193 } = calcSafeSpawnPosNearNode(
              v186["nodes"],
              v187,
              v190,
              v191,
            );
          v175 = generateId("source-image-expand");
          const v194 = () => {
            return isTaskCancelled(appStore["getState"]()["nodes"]?.[v175]);
          };
          appStore["addNode"](
            buildSourceMediaNodePayload({
              id: v175,
              type: "source-image",
              x: v192,
              y: v193,
              width: v190,
              height: v191,
              needsAutoResize: false,
              name: "扩图中...",
              src: "",
              ...buildGenerationStartPatch({ startedAt: v185 }),
              ...(v180 || v181 || v182 ? { provider: v179, model: v178 } : {}),
              ...(v180
                ? {
                    rhSourceNodeId: v187["id"],
                    rhToolbarTaskType: "image-expand",
                  }
                : {}),
              ...(v180
                ? buildRunningHubTaskPatch({
                    taskId: "",
                    status: "pending",
                    startedAt: v185,
                    recovering: false,
                    useOpenapiQuery: v184,
                  })
                : {}),
              ...(v181
                ? buildDreaminaTaskPatch({
                    submitId: "",
                    status: "pending",
                    phase: "generating",
                    label: "提交中",
                    startedAt: v185,
                    recovering: false,
                  })
                : {}),
              ...(v182
                ? buildAsyncTaskPatch({
                    provider: v183,
                    kind: "image",
                    taskId: "",
                    status: "pending",
                    startedAt: v185,
                    recovering: false,
                  })
                : {}),
              outputText:
                "模型: " +
                getDisplayModelName(this["model"]) +
                "\x0a提示词:\x20移除绿区域，并在绿色区域内生成符合画面的场景",
            }),
          );
          (v180 || v181 || v182) && persistRunningHubResumeCache();
          appStore["setSelectedNodes"]([v175]);
          typeof window["v2FocusOnNodes"] === "function"
            ? window["v2FocusOnNodes"]([v187["id"], v175])
            : window["v2FocusOnNode"]?.(v175);
          this["exit"]();
          const v195 = this["_buildGenerationPayload"](v178, v179, v176["url"]),
            v196 = await generateImage(v195, {
              onTaskMeta: ({
                taskId: v197,
                useOpenapiQuery: v198,
                provider: v199,
              }) => {
                const v200 = String(v197 || "")["trim"]();
                if (!v200) return;
                const v201 = appStore["getState"]()["nodes"]?.[v175];
                if (!v201) return;
                if (v194()) return;
                if (v180) {
                  (appStore["updateNodeData"](v175, {
                    ...buildRunningHubTaskPatch({
                      taskId: v200,
                      status: "running",
                      startedAt: v185,
                      recovering: false,
                      useOpenapiQuery: v198 === true,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                if (v181) {
                  (appStore["updateNodeData"](v175, {
                    ...buildDreaminaTaskPatch({
                      submitId: v200,
                      status: "pending",
                      phase: "generating",
                      label: "生成中",
                      startedAt: v185,
                      recovering: false,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                v182 &&
                  (appStore["updateNodeData"](v175, {
                    ...buildAsyncTaskPatch({
                      provider: String(
                        v199 || v201?.["asyncTaskProvider"] || v183,
                      )["trim"](),
                      kind: "image",
                      taskId: v200,
                      status: "running",
                      startedAt: v185,
                      recovering: false,
                    }),
                  }),
                  persistRunningHubResumeCache());
              },
              onTaskId: (v202) => {
                const v203 = String(v202 || "")["trim"]();
                if (!v203) return;
                const v204 = appStore["getState"]()["nodes"]?.[v175];
                if (!v204) return;
                if (v194()) return;
                if (v180) {
                  (appStore["updateNodeData"](v175, {
                    ...buildRunningHubTaskPatch({
                      taskId: v203,
                      status: "running",
                      startedAt: v185,
                      recovering: false,
                      useOpenapiQuery:
                        v204?.["rhTaskUseOpenapiQuery"] === true || v184,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                if (v181) {
                  (appStore["updateNodeData"](v175, {
                    ...buildDreaminaTaskPatch({
                      submitId: v203,
                      status: "pending",
                      phase: "generating",
                      label: "生成中",
                      startedAt: v185,
                      recovering: false,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                v182 &&
                  (appStore["updateNodeData"](v175, {
                    ...buildAsyncTaskPatch({
                      provider: String(v204?.["asyncTaskProvider"] || v183)[
                        "trim"
                      ](),
                      kind: "image",
                      taskId: v203,
                      status: "running",
                      startedAt: v185,
                      recovering: false,
                    }),
                  }),
                  persistRunningHubResumeCache());
              },
            });
          if (v194()) return;
          if (v196["error"]) {
            const v205 = appStore["getState"]()["nodes"]?.[v175],
              v206 = v205?.["generationStartTime"]
                ? Date["now"]() - v205["generationStartTime"]
                : 0;
            appStore["updateNodeData"](v175, {
              ...buildImageGenerationFailurePatch({
                error: v196["error"],
                startedAt: v185,
                duration: v206,
              }),
              name: "扩图生成失败",
              ...(v180
                ? buildRunningHubTaskPatch({
                    taskId: v205?.["rhTaskId"] || "",
                    status: "failed",
                    startedAt: v185,
                    recovering: false,
                    useOpenapiQuery:
                      v205?.["rhTaskUseOpenapiQuery"] === true || v184,
                  })
                : {}),
              ...(v181
                ? buildDreaminaTaskPatch({
                    submitId: v205?.["dreaminaSubmitId"] || "",
                    status: "failed",
                    phase: "failed",
                    label: v196["error"] || "生成失败",
                    startedAt: v185,
                    recovering: false,
                  })
                : {}),
              ...(v182
                ? buildAsyncTaskPatch({
                    provider: v205?.["asyncTaskProvider"] || v183,
                    kind: "image",
                    taskId: v205?.["asyncTaskId"] || "",
                    status: "failed",
                    startedAt: v185,
                    recovering: false,
                  })
                : {}),
              outputText:
                "模型: " +
                getDisplayModelName(this["model"]) +
                "\n提示词: 移除绿区域，并在绿色区域内生成符合画面的场景\n错误: " +
                v196["error"],
            });
            (v180 || v181 || v182) && persistRunningHubResumeCache();
            return;
          }
          const v207 = appStore["getState"]()["nodes"]?.[v175],
            v208 = v207?.["generationStartTime"]
              ? Date["now"]() - v207["generationStartTime"]
              : 0,
            v209 = await resolveOutputMediaSize({
              localPath: v196["localPath"],
              imageUrl: v196["imageUrl"],
              sourceUrl: v196["sourceUrl"],
              thumbUrl: v196["thumbUrl"],
              src:
                v196["imageUrl"] || v196["sourceUrl"] || v196["thumbUrl"] || "",
            }),
            v210 =
              v209 &&
              shouldSwitchToOutputRatio(
                v177["width"],
                v177["height"],
                v209["width"],
                v209["height"],
                OUTPUT_RATIO_SWITCH_THRESHOLD,
              )
                ? calcDisplaySizeByMedia(v209["width"], v209["height"])
                : calcDisplaySizeByMedia(v177["width"], v177["height"]);
          (appStore["updateNodeData"](v175, {
            ...buildImageGenerationResultPatch(v196, {
              startedAt: v185,
              duration: v208,
            }),
            name: "扩图结果",
            width: v210["width"],
            height: v210["height"],
            ...(v180
              ? buildRunningHubTaskPatch({
                  taskId: v207?.["rhTaskId"] || "",
                  status: "success",
                  startedAt: v185,
                  recovering: false,
                  useOpenapiQuery:
                    v207?.["rhTaskUseOpenapiQuery"] === true || v184,
                })
              : {}),
            ...(v181
              ? buildDreaminaTaskPatch({
                  submitId: v207?.["dreaminaSubmitId"] || "",
                  status: "success",
                  phase: "done",
                  label: "已完成",
                  startedAt: v185,
                  recovering: false,
                })
              : {}),
            ...(v182
              ? buildAsyncTaskPatch({
                  provider: v207?.["asyncTaskProvider"] || v183,
                  kind: "image",
                  taskId: v207?.["asyncTaskId"] || "",
                  status: "success",
                  startedAt: v185,
                  recovering: false,
                })
              : {}),
            outputText:
              "模型: " +
              getDisplayModelName(this["model"]) +
              "\n提示词: 移除绿区域，并在绿色区域内生成符合画面的场景",
          }),
            (v180 || v181 || v182) && persistRunningHubResumeCache(),
            window["showToast"]?.("扩图生成成功", "success"));
        } catch (v211) {
          console["error"]("扩图生成失败:", v211);
          if (v175) {
            const v212 = appStore["getState"]()["nodes"]?.[v175];
            if (isTaskCancelled(v212)) return;
            const v213 = v212?.["generationStartTime"]
                ? Date["now"]() - v212["generationStartTime"]
                : 0,
              v214 = v211["message"] || "未知错误";
            (appStore["updateNodeData"](v175, {
              ...buildImageGenerationFailurePatch({
                error: v214,
                startedAt: v185,
                duration: v213,
              }),
              name: "扩图生成失败",
              ...(v180
                ? buildRunningHubTaskPatch({
                    taskId: v212?.["rhTaskId"] || "",
                    status: "failed",
                    startedAt: v185,
                    recovering: false,
                    useOpenapiQuery:
                      v212?.["rhTaskUseOpenapiQuery"] === true || v184,
                  })
                : {}),
              ...(v181
                ? buildDreaminaTaskPatch({
                    submitId: v212?.["dreaminaSubmitId"] || "",
                    status: "failed",
                    phase: "failed",
                    label: v214 || "生成失败",
                    startedAt: v185,
                    recovering: false,
                  })
                : {}),
              ...(v182
                ? buildAsyncTaskPatch({
                    provider: v212?.["asyncTaskProvider"] || v183,
                    kind: "image",
                    taskId: v212?.["asyncTaskId"] || "",
                    status: "failed",
                    startedAt: v185,
                    recovering: false,
                  })
                : {}),
              outputText:
                "模型:\x20" +
                getDisplayModelName(this["model"]) +
                "\n提示词: 移除绿区域，并在绿色区域内生成符合画面的场景\n错误: " +
                v214,
            }),
              (v180 || v181 || v182) && persistRunningHubResumeCache());
          } else
            window["showToast"]?.(
              "扩图生成失败: " + (v211["message"] || "未知错误"),
              "error",
            );
        } finally {
          v176?.["url"] && URL["revokeObjectURL"](v176["url"]);
        }
      }));
    const v215 = (v216) => {
      if (!this["toolbarEl"]["contains"](v216["target"])) v160();
    };
    document["addEventListener"]("pointerdown", v215, true);
    const v217 = () => {
        if (!this["_pointerState"]) return;
        (window["removeEventListener"]("pointermove", v218, true),
          window["removeEventListener"]("pointerup", v219, true),
          window["removeEventListener"]("pointercancel", v219, true),
          (this["_pointerState"] = null));
      },
      v220 = () => this["ratioStr"] !== "original",
      v218 = (v221) => {
        const v222 = this["_pointerState"];
        if (!v222 || v221["pointerId"] !== v222["pointerId"]) return;
        v221["preventDefault"]();
        const v223 = v222["zoom"] || this["_view"]?.["viewport"]?.["zoom"] || 1,
          v224 = (v221["clientX"] - v222["startX"]) / v223,
          v225 = (v221["clientY"] - v222["startY"]) / v223,
          v226 = this["_getNodeWorldRect"](),
          v227 = (v228, v229, v230) =>
            Math["min"](v230, Math["max"](v229, v228));
        if (v222["mode"] === "drag") {
          const v231 = v222["startRect"]["w"],
            v232 = v222["startRect"]["h"];
          let v233 = v222["startRect"]["x"] + v224,
            v234 = v222["startRect"]["y"] + v225;
          ((v233 = v227(v233, v226["x"] + v226["w"] - v231, v226["x"])),
            (v234 = v227(v234, v226["y"] + v226["h"] - v232, v226["y"])),
            (this["frameRect"] = { x: v233, y: v234, w: v231, h: v232 }),
            this["_updateView"](this["_view"]));
          return;
        }
        const v235 = v222["handle"],
          v236 = Math["max"](v226["w"], 24),
          v237 = Math["max"](v226["h"], 24),
          v238 = (v239) => {
            const v240 = { ...v239 },
              v241 = v226["x"] + v226["w"] - v240["w"],
              v242 = v226["x"],
              v243 = v226["y"] + v226["h"] - v240["h"],
              v244 = v226["y"];
            return (
              (v240["x"] = v227(v240["x"], v241, v242)),
              (v240["y"] = v227(v240["y"], v243, v244)),
              v240
            );
          },
          v245 = (v246, v247) => {
            const v248 = { ...v246 };
            if (v248["w"] < v236) v248["w"] = v236;
            if (v248["h"] < v237) v248["h"] = v237;
            if (v247 === "tl")
              ((v248["x"] =
                v222["startRect"]["x"] + v222["startRect"]["w"] - v248["w"]),
                (v248["y"] =
                  v222["startRect"]["y"] + v222["startRect"]["h"] - v248["h"]));
            else {
              if (v247 === "tr")
                ((v248["x"] = v222["startRect"]["x"]),
                  (v248["y"] =
                    v222["startRect"]["y"] +
                    v222["startRect"]["h"] -
                    v248["h"]));
              else {
                if (v247 === "bl")
                  ((v248["x"] =
                    v222["startRect"]["x"] +
                    v222["startRect"]["w"] -
                    v248["w"]),
                    (v248["y"] = v222["startRect"]["y"]));
                else {
                  if (v247 === "br")
                    ((v248["x"] = v222["startRect"]["x"]),
                      (v248["y"] = v222["startRect"]["y"]));
                  else {
                    if (v247 === "lm")
                      ((v248["x"] =
                        v222["startRect"]["x"] +
                        v222["startRect"]["w"] -
                        v248["w"]),
                        (v248["y"] = v222["startRect"]["y"]));
                    else {
                      if (v247 === "rm")
                        ((v248["x"] = v222["startRect"]["x"]),
                          (v248["y"] = v222["startRect"]["y"]));
                      else {
                        if (v247 === "tm")
                          ((v248["x"] = v222["startRect"]["x"]),
                            (v248["y"] =
                              v222["startRect"]["y"] +
                              v222["startRect"]["h"] -
                              v248["h"]));
                        else
                          v247 === "bm" &&
                            ((v248["x"] = v222["startRect"]["x"]),
                            (v248["y"] = v222["startRect"]["y"]));
                      }
                    }
                  }
                }
              }
            }
            return v248;
          };
        if (!v220()) {
          let v249 = { ...v222["startRect"] };
          if (v235 === "tl")
            ((v249["x"] = v222["startRect"]["x"] + v224),
              (v249["y"] = v222["startRect"]["y"] + v225),
              (v249["w"] = v222["startRect"]["w"] - v224),
              (v249["h"] = v222["startRect"]["h"] - v225),
              (v249 = v245(v249, "tl")));
          else {
            if (v235 === "tr")
              ((v249["y"] = v222["startRect"]["y"] + v225),
                (v249["w"] = v222["startRect"]["w"] + v224),
                (v249["h"] = v222["startRect"]["h"] - v225),
                (v249 = v245(v249, "tr")));
            else {
              if (v235 === "bl")
                ((v249["x"] = v222["startRect"]["x"] + v224),
                  (v249["w"] = v222["startRect"]["w"] - v224),
                  (v249["h"] = v222["startRect"]["h"] + v225),
                  (v249 = v245(v249, "bl")));
              else {
                if (v235 === "br")
                  ((v249["w"] = v222["startRect"]["w"] + v224),
                    (v249["h"] = v222["startRect"]["h"] + v225),
                    (v249 = v245(v249, "br")));
                else {
                  if (v235 === "tm")
                    ((v249["y"] = v222["startRect"]["y"] + v225),
                      (v249["h"] = v222["startRect"]["h"] - v225),
                      (v249 = v245(v249, "tm")));
                  else {
                    if (v235 === "bm")
                      ((v249["h"] = v222["startRect"]["h"] + v225),
                        (v249 = v245(v249, "bm")));
                    else {
                      if (v235 === "lm")
                        ((v249["x"] = v222["startRect"]["x"] + v224),
                          (v249["w"] = v222["startRect"]["w"] - v224),
                          (v249 = v245(v249, "lm")));
                      else
                        v235 === "rm" &&
                          ((v249["w"] = v222["startRect"]["w"] + v224),
                          (v249 = v245(v249, "rm")));
                    }
                  }
                }
              }
            }
          }
          ((this["frameRect"] = v238(v249)),
            this["_updateView"](this["_view"]));
          return;
        }
        const v250 = this["_parseRatio"](),
          v251 = v222["startRect"]["x"] + v222["startRect"]["w"] / 2,
          v252 = v222["startRect"]["y"] + v222["startRect"]["h"] / 2;
        let v253 = { ...v222["startRect"] };
        if (v235 === "lm" || v235 === "rm") {
          let v254 = v222["startRect"]["w"] + (v235 === "rm" ? v224 : -v224);
          v254 = Math["max"](v254, v236);
          let v255 = v254 / v250;
          (v255 < v237 && ((v255 = v237), (v254 = v255 * v250)),
            (v253["w"] = v254),
            (v253["h"] = v255),
            (v253["x"] =
              v235 === "rm"
                ? v222["startRect"]["x"]
                : v222["startRect"]["x"] + v222["startRect"]["w"] - v253["w"]),
            (v253["y"] = v252 - v253["h"] / 2));
        } else {
          if (v235 === "tm" || v235 === "bm") {
            let v256 = v222["startRect"]["h"] + (v235 === "bm" ? v225 : -v225);
            v256 = Math["max"](v256, v237);
            let v257 = v256 * v250;
            (v257 < v236 && ((v257 = v236), (v256 = v257 / v250)),
              (v253["w"] = v257),
              (v253["h"] = v256),
              (v253["y"] =
                v235 === "bm"
                  ? v222["startRect"]["y"]
                  : v222["startRect"]["y"] +
                    v222["startRect"]["h"] -
                    v253["h"]),
              (v253["x"] = v251 - v253["w"] / 2));
          } else {
            const v258 = v235 === "tr" || v235 === "br" ? 1 : -1,
              v259 = v235 === "bl" || v235 === "br" ? 1 : -1;
            let v260 = v222["startRect"]["w"] + v224 * v258,
              v261 = v222["startRect"]["h"] + v225 * v259;
            ((v260 = Math["max"](v260, 1)), (v261 = Math["max"](v261, 1)));
            v260 / v261 > v250 ? (v261 = v260 / v250) : (v260 = v261 * v250);
            v260 < v236 && ((v260 = v236), (v261 = v260 / v250));
            v261 < v237 && ((v261 = v237), (v260 = v261 * v250));
            ((v253["w"] = v260), (v253["h"] = v261));
            if (v235 === "br")
              ((v253["x"] = v222["startRect"]["x"]),
                (v253["y"] = v222["startRect"]["y"]));
            else {
              if (v235 === "bl")
                ((v253["x"] =
                  v222["startRect"]["x"] + v222["startRect"]["w"] - v253["w"]),
                  (v253["y"] = v222["startRect"]["y"]));
              else
                v235 === "tr"
                  ? ((v253["x"] = v222["startRect"]["x"]),
                    (v253["y"] =
                      v222["startRect"]["y"] +
                      v222["startRect"]["h"] -
                      v253["h"]))
                  : ((v253["x"] =
                      v222["startRect"]["x"] +
                      v222["startRect"]["w"] -
                      v253["w"]),
                    (v253["y"] =
                      v222["startRect"]["y"] +
                      v222["startRect"]["h"] -
                      v253["h"]));
            }
          }
        }
        ((this["frameRect"] = v238(v253)), this["_updateView"](this["_view"]));
      },
      v219 = (v262) => {
        const v263 = this["_pointerState"];
        if (!v263 || v262["pointerId"] !== v263["pointerId"]) return;
        (v262["preventDefault"](), v217());
      },
      v264 = (v265) => {
        if (v265["button"] !== 0) return;
        (v265["stopPropagation"](), v265["preventDefault"]());
        if (!this["frameRect"])
          this["frameRect"] = this["_calcFrameWorldRect"]();
        this["frameRect"] = this["_clampFrameRect"](this["frameRect"]);
        const v266 = v265["target"]["closest"](".v2-expand-handle"),
          v267 = v266?.["dataset"]?.["handle"] || null,
          v268 = v267 ? "resize" : "drag";
        ((this["_pointerState"] = {
          pointerId: v265["pointerId"],
          mode: v268,
          handle: v267,
          startX: v265["clientX"],
          startY: v265["clientY"],
          startRect: { ...this["frameRect"] },
          zoom: this["_view"]?.["viewport"]?.["zoom"] || 1,
        }),
          this["frameEl"]["setPointerCapture"]?.(v265["pointerId"]),
          window["addEventListener"]("pointermove", v218, true),
          window["addEventListener"]("pointerup", v219, true),
          window["addEventListener"]("pointercancel", v219, true));
      };
    (this["frameEl"]["addEventListener"]("pointerdown", v264),
      (this["cleanup"] = () => {
        (v217(),
          window["removeEventListener"]("resize", v137),
          window["removeEventListener"]("keydown", v138),
          document["removeEventListener"]("pointerdown", v215, true),
          this["overlayEl"]?.["removeEventListener"]("wheel", v140),
          this["frameEl"]?.["removeEventListener"]("pointerdown", v264),
          this["_unbindToolbarUpMenus"]?.(),
          (this["_unbindToolbarUpMenus"] = null),
          this["_unbindImageFunctionMenus"]?.(),
          (this["_unbindImageFunctionMenus"] = null));
      }));
  },
  exit() {
    if (!this["active"]) return;
    this["active"] = false;
    this["_unsubscribe"] &&
      (this["_unsubscribe"](), (this["_unsubscribe"] = null));
    if (this["overlayEl"]) this["overlayEl"]["classList"]["remove"]("visible");
    setTimeout(() => {
      (this["overlayEl"]?.["remove"](),
        this["toolbarEl"]?.["remove"](),
        this["cleanup"]?.(),
        (this["nodeId"] = null),
        (this["nodeData"] = null),
        (this["frameRect"] = null),
        (this["_view"] = null),
        (this["_expandModelCatalog"] = null),
        (this["ratioMenuEl"] = null),
        (this["sizeMenuEl"] = null));
    }, 200);
  },
};
export default ImageExpandController;

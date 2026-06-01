import {
  buildSourceMediaNodePayload,
  getAIGenerationNodeSize,
  getAutoMediaSizeByShortSide,
} from "../../services/fileService.js";
import {
  buildImageNodeStorageFields,
  pickCanvasImageLocalPath,
  pickCanvasThumbLocalPath,
  toLocalPathUrl,
} from "../../services/imageDerivativeService.js";
import {
  isCanvasLowZoomActive,
  pickImageLodUrl,
  shouldUseLowZoomImageThumbnail,
} from "../../modules/canvasImageLod.js";
import { commit } from "../../modules/history.js";
import { startNodeResizePreview } from "../../modules/interaction/nodeResizePreview.js";
import {
  applyPromptBoxHeight,
  getPromptBoxHeightBounds,
  normalizePromptBoxHeight,
} from "../promptBoxResize.js";
import {
  buildDreaminaImageNodeNormalizationPatch,
  bindDreaminaImageMenu,
  normalizeDreaminaImageModel,
} from "./dreaminaModelMenuHelper.js";
import {
  getNanoBananaModeLabel,
  getNanoBananaModeOptions,
  getNanoBananaSelectionFromModel,
  getNanoBananaAllowedRatioLabels,
  isNanoBananaFamily,
  normalizeNanoBananaRatioForFamily,
} from "../../modules/nanoBananaModeRules.js";
import {
  buildMainImageRatioLabel,
  isImageSizeOptionDisabledForProviderModel,
  isRunningHubGptImage2OfficialModel,
  normalizeImageSizeForProviderModel,
  shouldDisableImageSizeControl,
} from "../../modules/imageModelCapabilities.js";
import { syncPreviewNodeLoading } from "../../modules/previewMode.js";
import { subscribeAssetMentionRegistry } from "../../modules/assetMentionRegistry.js";
import { removeCoveredAssetInputRefForConnection } from "../../modules/promptAssetInputOverride.js";
import {
  getExclusiveSlotsForFixedSlot,
  getFixedInputSlotConfigFromManifest,
} from "../../modules/fixedInputAssetRefs.js";
import {
  cancelPromptHtmlCommit,
  flushPromptHtmlCommit,
  getPromptAssetInputRefsFromNode,
  handlePromptPaste,
  handlePromptSelectAll,
  removeAssetMentionPillFromPrompt,
  removePromptAssetInputRefFromNode,
  resolvePromptTextWithTextRefs,
  schedulePromptHtmlCommit,
} from "../../modules/nodePromptShared.js";
import {
  beginComfyPromptGuard,
  endComfyPromptGuard,
  isComfyPromptGuardActive,
} from "../../modules/comfyui/comfyPromptGuard.js";
import {
  getTargetInputPolicy,
  isInputKindAllowed,
  isRhPersonReplaceV3Model,
  isRhPersonReplaceWorkflowModel,
  isRhQwenImageEditModel,
  resolveEffectiveInputKind,
  RH_QWEN_IMAGE_EDIT_MODEL,
} from "../../modules/modelInputPolicy.js";
import { isImageFreeAngleOnlyModel } from "../../modules/imageFunctionModelMenu.js";
import { sanitizePromptHtml } from "../../utils/dom.js";
import {
  DEBUG_WRENCH_ICON_HTML,
  formatFinalApiDebugRequest,
} from "../../utils/debugRequestPreview.js";
import { createPromptAttachmentButtonHTML } from "../refAttachmentButton.js";
import { attachGenerationNodeHelpTip } from "../generationNodeHelpTip.js";
import { isVipModel as isVipModel } from "../../modules/subscriptionAccess.js";
import {
  AI_IMAGE_MIN_SIZE,
  bindImageModelMenuSubmenu,
  buildImageModelMenuHTML,
  buildNanoBananaModeMenuHTML,
  buildImageSchemaAspectRatioDisplayPatch,
  applyImageSchemaRatioResizeAnimation,
  buildRunningHubGptImage2OfficialPatch,
  escapeHtmlAttr,
  getImagePromptPlaceholderForModel,
  getImageSizeCapabilityProvider,
  isApimartGptImage2Selection,
  isGrsaiGptImage2Selection,
  isRunningHubGptImage2Selection,
  resolveApimartImageMenuSelection,
  resolveGrsaiImageMenuSelection,
  resolveRunningHubModelImageMenuSelection,
  resolveRunningHubWorkflowImageMenuSelection,
  resolveComfyuiImageMenuSelection,
  resolveVolcengineImageMenuSelection,
  renderImageModelTriggerIconHTML,
  setImageModelTriggerIcon,
  shouldShowNanoBananaModeSelector,
} from "./uiModuleModelHelpers.js";
import {
  buildImageInputGateClearPatch,
  getImageInputGateUploadedUrl,
  getImageNodeInputGate,
  getImageNodeRootClass,
  shouldUseImageWorkflowBusyButton,
} from "./imageNodeManifestPolicies.js";
import {
  bindModelUiSchemaControls,
  buildModelUiSchemaDefaultParams,
  hasModelUiSchema,
  renderModelUiSchemaControls,
  sanitizeModelUiSchemaParams,
  syncModelUiSchemaControls,
} from "./uiSchemaRenderer.js";
import {
  bindNodeFooterController,
  closeNodeFooterMenus,
} from "../shared/nodeFooterControls.js";
import { bindResultImageDragOutGesture } from "./resultImageDragOut.js";
import {
  MULTI_RESULT_BACKPLATE_CLASS,
  MULTI_RESULT_STACK_WRAP_CLASS,
  buildMultiResultBackplateItems,
  clearMultiResultStackClasses,
  createMultiResultBackplates,
  getMultiResultBackplateCount,
  getMultiResultBackplateKey,
  shouldRefreshMultiResultStackDom,
  syncMultiResultStackClasses,
} from "./multiResultStackBackplates.js";
import { getModelManifest, isWorkflowModel } from "../../manifests/index.js";
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from "../../modules/previewGenerateButtonUi.js";
import {
  getTaskMessage,
  resolveGenerationButtonMode,
} from "../../core/generationTaskUiState.js";
import {
  DEFAULT_IMAGE_NODE_MODEL,
  DEFAULT_IMAGE_NODE_PROVIDER,
} from "./defaults.js";
import { mountComfyEngineUi, isComfyuiEngine, readComfyFooterParams, ensureComfyWorkflowConfig, toComfyuiModelId, invalidateComfyWorkflowCache, parseComfyuiModelId, resolveComfyWorkflowDisplayTitle, getComfyWorkflowConfigFromCache, getComfyWorkflowBundleFromCache, loadComfyWorkflowBundle } from "../../modules/comfyui/comfyEngineUi.js";
import { isComfyGenerateWorkflow, resolveComfyWorkflowKind } from "../../modules/comfyui/comfyWorkflowParser.js";
import { fetchComfyuiWorkflows, generateComfyuiImage } from "../../../api/comfyuiApi.js";
import { buildComfyParams } from "../../modules/comfyui/comfyParamMapper.js";
import { getImageFields } from "../../modules/comfyui/comfyWorkflowParser.js";
export function hasImageInputForUiSchemaNodeData({
  nodeId: nodeId = "",
  nodeData: nodeData = {},
  state: state = {},
} = {}) {
  if (!nodeData || typeof nodeData !== "object") return false;
  if (nodeData["hasInputImages"] === true) return true;
  const v0 = [
    nodeData["inputUrls"],
    nodeData["image_urls"],
    nodeData["inputImageUrls"],
    nodeData["referenceImageUrls"],
  ];
  if (
    v0["some"]((v1) =>
      Array["isArray"](v1)
        ? v1["some"]((v2) => String(v2 || "")["trim"]())
        : String(v1 || "")["trim"](),
    )
  )
    return true;
  if (
    getPromptAssetInputRefsFromNode(nodeData, { allowedTypes: ["image"] })[
      "some"
    ]((v3) => String(v3?.["url"] || "")["trim"]())
  )
    return true;
  const v4 = state?.["nodes"] || {},
    v5 = getTargetInputPolicy({
      ...nodeData,
      type: nodeData["type"] || "ai-image",
    });
  return Object["values"](state?.["edges"] || {})["some"]((v6) => {
    if (!v6 || String(v6["targetId"] || "") !== String(nodeId || ""))
      return false;
    const v7 = v4[v6["sourceId"]];
    if (!v7) return false;
    const v8 = resolveEffectiveInputKind(v7, v6);
    return v8 === "image" && isInputKindAllowed(v5, v8);
  });
}
export function createAIGenerateNodeUiModule(v9) {
  const {
    store: v10,
    api: v11,
    getDisplayModelName: v12,
    _handlePillHover: v13,
    _handlePillOut: v14,
    _syncEdgesOrderFromPills: v15,
    _syncPillLabels: v16,
    _checkAtTrigger: v17,
    _populateMentionMenu: v18,
    _insertMentionPill: v19,
    _handlePillKeyboard: v20,
    _rehydratePromptPills: v21,
    _handleMentionMenuKeyboard: v22,
    TEXT_TOOLBAR_HTML: v23,
    bindTextToolbarEvents: v24,
    IMAGE_TOOLBAR_HTML: v25,
    bindImageToolbarEvents: v26,
    showDevToast: v27,
    getImage: v28,
    openNodeImagePreview: v29,
    getPromptPresets: v30,
    openCustomPresetsManager: v31,
    startLoading: v32,
    stopLoading: v33,
    bindRefThumbHoverPreview: v34,
    ensureThumbDecoded: v35,
    revealRefThumbMedia: v36,
    getRefKindByNodeType: v37,
    uploadFile: v38,
    ensureConfig: v39,
    getProviderConfig: v40,
    generateId: v41,
    checkSlashTrigger: v42,
    handleSlashKeyboardNavigation: v43,
    closeSlashMenu: v44,
    activateMenuKeyboard: v45,
    ImageFreeAngleController: v46,
  } = v9;
  class v47 {
    ["_getUiSchemaRenderNodeData"](v48 = this["_data"]) {
      return {
        ...(v48 || {}),
        hasInputImages: hasImageInputForUiSchemaNodeData({
          nodeId: this["nodeId"],
          nodeData: v48 || {},
          state: v10["getState"]?.() || {},
        }),
      };
    }
    ["_shouldUseLowZoomThumbnail"]() {
      return shouldUseLowZoomImageThumbnail({
        nodeId: this["nodeId"],
        rootEl: this["_root"],
        store: v10,
      });
    }
    ["_pickImageDisplayUrl"](v49 = "", v50 = "", v51 = {}) {
      const v52 =
        v51 &&
        Object["prototype"]["hasOwnProperty"]["call"](v51, "lowZoomThumbnail");
      return pickImageLodUrl({
        mainUrl: v49,
        thumbUrl: v50,
        lowZoomThumbnail: v52
          ? !!v51["lowZoomThumbnail"]
          : this["_shouldUseLowZoomThumbnail"](),
      });
    }
    ["_applyImageElementLod"](v53, v54 = "full") {
      if (!v53) return;
      v53["dataset"]["lodSrc"] = v54 === "thumb" ? "thumb" : "full";
    }
    ["_setLazyImageDisplaySource"](v55, v56 = {}) {
      if (!v55?.["dataset"]) return;
      const v57 = String(v56?.["url"] || "")["trim"](),
        v58 = v56?.["lod"] === "thumb" ? "thumb" : "full";
      if (v57) v55["dataset"]["lazySrc"] = v57;
      else delete v55["dataset"]["lazySrc"];
      ((v55["dataset"]["lazyLodSrc"] = v58),
        this["_applyImageElementLod"](v55, v58));
    }
    ["_cancelLazyImageDisplayClear"](v59) {
      if (!v59?.["_lazyImageDisplayClearTimer"]) return;
      (clearTimeout(v59["_lazyImageDisplayClearTimer"]),
        (v59["_lazyImageDisplayClearTimer"] = null));
    }
    ["_loadLazyImageDisplaySource"](v60) {
      if (!v60?.["dataset"]) return;
      const v61 = String(v60["dataset"]["lazySrc"] || "")["trim"]();
      if (!v61) {
        this["_clearLazyImageDisplaySource"](v60);
        return;
      }
      (this["_cancelLazyImageDisplayClear"](v60),
        this["_applyImageElementLod"](
          v60,
          v60["dataset"]["lazyLodSrc"] || "full",
        ),
        v60["getAttribute"]?.("src") !== v61 && (v60["src"] = v61));
    }
    ["_clearLazyImageDisplaySource"](v62) {
      if (!v62) return;
      (this["_cancelLazyImageDisplayClear"](v62),
        typeof v62["removeAttribute"] === "function" &&
          v62["removeAttribute"]("src"));
    }
    ["_scheduleClearLazyImageDisplaySource"](v63, v64 = 0) {
      if (!v63) return;
      this["_cancelLazyImageDisplayClear"](v63);
      const v65 = Math["max"](0, Number(v64) || 0);
      v63["_lazyImageDisplayClearTimer"] = setTimeout(() => {
        ((v63["_lazyImageDisplayClearTimer"] = null),
          this["_clearLazyImageDisplaySource"](v63));
      }, v65);
    }
    ["_getResultImageDragOutNodeData"]() {
      const v66 =
        typeof v10["getStateRaw"] === "function"
          ? v10["getStateRaw"]()
          : typeof v10["getState"] === "function"
            ? v10["getState"]()
            : {};
      return v66?.["nodes"]?.[this["nodeId"]] || this["_data"] || {};
    }
    ["_removeCurrentNodeFromSelection"]() {
      const v67 =
          typeof v10["getStateRaw"] === "function"
            ? v10["getStateRaw"]()
            : typeof v10["getState"] === "function"
              ? v10["getState"]()
              : {},
        v68 = Array["isArray"](v67?.["selectedNodeIds"])
          ? v67["selectedNodeIds"]
          : [];
      if (!v68["includes"](this["nodeId"])) return;
      v10["setSelectedNodes"]?.(v68["filter"]((v69) => v69 !== this["nodeId"]));
    }
    ["_bindResultImageDragOut"](v70, v71 = {}) {
      if (!v70) return () => false;
      let v72 = false;
      const v73 = () => {
          ((v72 = true),
            setTimeout(() => {
              v72 = false;
            }, 450));
        },
        v74 = () => {
          const v75 = this["_getResultImageDragOutNodeData"](),
            v76 = Array["isArray"](v75?.["images"]) ? v75["images"] : [];
          return v76[v71["imageIndex"]] || null;
        },
        v77 = () => {
          const v78 =
            typeof v71["getFallbackSize"] === "function"
              ? v71["getFallbackSize"]()
              : null;
          return {
            width:
              Number(v78?.["width"]) ||
              Number(this["previewEl"]?.["offsetWidth"]) ||
              Number(this["_data"]?.["width"]) ||
              320,
            height:
              Number(v78?.["height"]) ||
              Number(this["previewEl"]?.["offsetHeight"]) ||
              Number(this["_data"]?.["height"]) ||
              320,
          };
        };
      return (
        bindResultImageDragOutGesture(v70, {
          image: v74,
          isEnabled: () => {
            const v79 = this["_getResultImageDragOutNodeData"]();
            return (
              !!v79?.["isImagesExpanded"] &&
              Array["isArray"](v79["images"]) &&
              v79["images"]["length"] > 1
            );
          },
          getViewport: () => {
            const v80 =
              typeof v10["getStateRaw"] === "function"
                ? v10["getStateRaw"]()
                : typeof v10["getState"] === "function"
                  ? v10["getState"]()
                  : {};
            return v80?.["viewport"] || { x: 0, y: 0, zoom: 1 };
          },
          getGhostSourceElement: v71["getGhostSourceElement"],
          getFallbackSrc: v71["getFallbackSrc"],
          getGhostSize: () => {
            const v81 = v71["getGhostSourceElement"]?.() || v70;
            if (v81 && typeof v81["getBoundingClientRect"] === "function") {
              const v82 = v81["getBoundingClientRect"]();
              if (v82["width"] > 0 && v82["height"] > 0)
                return { width: v82["width"], height: v82["height"] };
            }
            return v77();
          },
          getNodeFallbackSize: v77,
          createId: () => v41("source-image"),
          addNode: (v83) => v10["addNode"]?.(v83),
          setSelectedNodes: (v84) => v10["setSelectedNodes"]?.(v84),
          commit: commit,
          showToast: (v85, v86) => {
            if (typeof globalThis["window"]?.["showToast"] === "function")
              globalThis["window"]["showToast"](v85, v86);
            else typeof v27 === "function" && v27(v85);
          },
          markClickSuppressed: v73,
          onDragStart: () => {
            v70["classList"]?.["add"]("is-result-drag-source");
          },
          onDragEnd: () => {
            v70["classList"]?.["remove"]("is-result-drag-source");
          },
        }),
        () => v72
      );
    }
    ["_runVipRetryOnce"](v87) {
      let v88 = false;
      return () => {
        if (v88) return;
        ((v88 = true), (this["_vipSelectionRetryInProgress"] = true));
        try {
          v87();
        } finally {
          this["_vipSelectionRetryInProgress"] = false;
        }
      };
    }
    ["_guardVipSelection"](v89, v90 = "", v91 = null) {
      const v92 = String(v89 || "")["trim"](),
        v93 = String(v90 || "")["trim"]();
      if (!isVipModel(v92, v93)) return true;
      const v94 = window["isModelAllowedBySubscription"],
        v95 = typeof v94 === "function" ? v94(v92, v93) : true;
      if (v95) return true;
      if (this["_vipSelectionRetryInProgress"]) return false;
      return (
        typeof window["openSubscriptionDialog"] === "function"
          ? window["openSubscriptionDialog"]({
              modelId: v92,
              provider: v93,
              onSuccess: v91,
            })
          : window["showToast"]?.("需要VIP授权，请先激活CDKEY", "warn"),
        false
      );
    }
    ["mount"]() {
      ((this["_data"] = this["_normalizeLegacySeedreamModel"](this["_data"])),
        (this["_data"] = this["_normalizeDreaminaNodeData"](this["_data"], {
          syncStore: false,
        })));
      const v96 = document["createElement"]("div");
      v96["className"] = "aigen-node-root aigen-image-node-root";
      if (this["isNoResult"]) v96["classList"]["add"]("no-result");
      ((this["_root"] = v96),
        (v96["innerHTML"] = v25),
        (this["previewEl"] = document["createElement"]("div")),
        (this["previewEl"]["className"] =
          "img-node-preview aigen-node-preview-fill aigen-image-preview"),
        (this["imgEl"] = document["createElement"]("img")),
        (this["imgEl"]["draggable"] = false),
        (this["imgEl"]["className"] = "v2-media-preview aigen-image-media"));
      const v97 = document["createElement"]("div");
      ((v97["className"] = "img-node-placeholder aigen-media-placeholder"),
        (v97["innerHTML"] =
          "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20class=\x22placeholder-icon-svg\x22\x20width=\x2240\x22\x20height=\x2240\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.2\x22\x20style=\x22transition:all\x200.2s;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<rect\x20x=\x223\x22\x20y=\x223\x22\x20width=\x2218\x22\x20height=\x2218\x22\x20rx=\x222\x22/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<circle\x20cx=\x228.5\x22\x20cy=\x228.5\x22\x20r=\x221.5\x22/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<polyline\x20points=\x2221\x2015\x2016\x2010\x205\x2021\x22/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</svg>"),
        (this["_maskOverlay"] = document["createElement"]("img")),
        (this["_maskOverlay"]["className"] =
          "node-img-mask-overlay aigen-image-mask-overlay"),
        this["previewEl"]["appendChild"](this["imgEl"]),
        this["previewEl"]["appendChild"](this["_maskOverlay"]),
        this["previewEl"]["appendChild"](v97),
        (this["_placeholderEl"] = v97),
        syncPreviewNodeLoading(
          this["nodeId"],
          this["previewEl"],
          this["_getPreviewGenerateButtonLoadingOptions"]?.(),
        ),
        v96["appendChild"](this["previewEl"]));
      const v98 = document["createElement"]("div");
      ((v98["className"] = "node-resizer"),
        v96["appendChild"](v98),
        this["_applyMaskPreview"](
          this["_data"]?.["maskPreviewUrl"] || this["_data"]?.["maskPreview"],
        ),
        this["imgEl"]["addEventListener"]("load", () => {
          if (this["imgEl"]?.["dataset"]?.["lodSrc"] === "thumb") return;
          const v99 = Number(this["imgEl"]?.["naturalWidth"] || 0),
            v100 = Number(this["imgEl"]?.["naturalHeight"] || 0);
          if (!(v99 > 0 && v100 > 0)) return;
          const v101 = v10["getState"]()["nodes"]?.[this["nodeId"]];
          if (!v101) return;
          if (
            Number(v101["imageWidth"] || 0) === v99 &&
            Number(v101["imageHeight"] || 0) === v100
          )
            return;
          v10["updateNodeData"](this["nodeId"], {
            imageWidth: v99,
            imageHeight: v100,
          });
        }),
        this["_loadAndDisplayImage"]());
      const v102 = () => {
        const v103 = Array["isArray"](this["_data"]?.["images"])
          ? this["_data"]["images"]
          : [];
        v103["length"] > 1 &&
          void this["_loadAndDisplayImage"]({ force: true });
      };
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(v102)
        : setTimeout(v102, 0);
      const v104 = () => {
        if (
          !isCanvasLowZoomActive() &&
          this["imgEl"]?.["dataset"]?.["lodSrc"] !== "thumb"
        )
          return;
        void this["_loadAndDisplayImage"]({ force: true });
      };
      (v96["addEventListener"]("pointerenter", v104),
        v96["addEventListener"]("pointerleave", v104),
        this["imgEl"]["addEventListener"]("dblclick", async (v105) => {
          (v105["stopPropagation"](), await v29(this["_data"]));
        }));
      const v106 = document["createElement"]("div");
      ((v106["className"] = "text-prompt-panel"),
        v106["addEventListener"]("pointerdown", (v107) => {
          v107["stopPropagation"]();
        }),
        (this["_promptPanel"] = v106),
        v96["addEventListener"]("v2-node:free-angle", (v108) => {
          (v108["stopPropagation"](), this["_switchToFreeAngle"]());
        }),
        v106["addEventListener"]("dblclick", (v109) => {
          !v109["target"]["closest"](".prompt-textarea") &&
            (v109["preventDefault"](), v109["stopPropagation"]());
        }),
        (this["refBarEl"] = document["createElement"]("div")),
        (this["refBarEl"]["className"] = "node-ref-bar"),
        (this["refBarEl"]["innerHTML"] = createPromptAttachmentButtonHTML({
          stroke: "var(--white-90)",
        })),
        v106["appendChild"](this["refBarEl"]),
        this["refBarEl"]["addEventListener"]("click", (v110) => {
          const v111 = v110["target"]["closest"](".prompt-attachment-btn");
          if (!v111) return;
          if (v110["_pickConnectHandled"]) return;
          (v110["stopPropagation"](), v110["preventDefault"]());
          const v112 = v10["getState"]()["pickConnectMode"];
          v112 && v112["active"] && v112["sourceNodeId"] === this["nodeId"]
            ? v10["setPickConnectMode"]({ active: false })
            : v10["setPickConnectMode"]({
                active: true,
                sourceNodeId: this["nodeId"],
                handleDirection: "left",
              });
        }),
        this["refBarEl"]["addEventListener"]("pointerdown", (v113) => {
          const v114 = v113["target"]["closest"](".prompt-attachment-btn");
          v114 && v113["stopPropagation"]();
        }),
        (this["_unbindRefThumbHoverPreview"] = v34(this["refBarEl"])),
        (this["_refUploadInput"] = document["createElement"]("input")),
        (this["_refUploadInput"]["type"] = "file"),
        (this["_refUploadInput"]["accept"] = "image/*"),
        (this["_refUploadInput"]["style"]["display"] = "none"),
        v106["appendChild"](this["_refUploadInput"]),
        this["_refUploadInput"]["addEventListener"]("change", async (v115) => {
          const v116 = v115["target"]["files"]?.[0];
          if (!v116) return;
          try {
            const v117 = window["currentProjectId"] || "default_v2_project",
              v118 = await v38(v116, v117),
              v119 = v118?.["url"] || "";
            if (!v119) throw new Error("上传失败：未返回文件地址");
            const v120 = v10["getState"]()["nodes"]?.[this["nodeId"]],
              v121 = getImageNodeInputGate(v120?.["model"]),
              v122 = String(v121["kind"] || "") === "image",
              v123 = isRhPersonReplaceWorkflowModel(v120?.["model"]),
              v124 = isRhQwenImageEditModel(v120?.["model"]),
              v125 = getFixedInputSlotConfigFromManifest(v120 || {}),
              v126 = Number(v120?.["x"]) || 0,
              v127 = Number(v120?.["y"]) || 0,
              v128 = Number(v120?.["width"]) || 360,
              v129 = Number(v120?.["height"]) || 360,
              v130 =
                v118["localPath"] || String(v119 || "")["replace"](/^\//, ""),
              v131 = buildImageNodeStorageFields(v118),
              v132 = v41("source-image"),
              v133 = 260,
              v134 = 260,
              v135 = 24,
              v136 = v126 - v135 - v133,
              v137 = v127 + Math["round"]((v129 - v134) / 2);
            let v138 = v137;
            const v139 = String(this["_pendingRefSlot"] || "")["trim"]();
            let v140 = v139;
            const v141 = (v125?.["visibleSlots"] || [])["filter"](
                (v142) => v125?.["slotKindById"]?.[v142] === "image",
              ),
              v143 = !!v139 && v141["includes"](v139);
            if (v123) {
              const v144 = v139 === "replacedImage" ? 1 : 0,
                v145 =
                  v144 === 0
                    ? -Math["round"](v134 / 2) - 12
                    : Math["round"](v134 / 2) + 12;
              v138 = v137 + v145;
            } else {
              if (v143) {
                const v146 = Math["max"](0, v141["indexOf"](v139)),
                  v147 = (v141["length"] - 1) / 2;
                v138 = v137 + Math["round"]((v146 - v147) * (v134 + 24));
              }
            }
            (v10["batch"](() => {
              const v148 = v10["getIncomingEdges"](this["nodeId"]);
              if (v122) {
                for (const v149 of v148) v10["removeEdge"](v149["id"]);
              } else {
                if (v123) {
                  const v150 = ["replaceTarget", "replacedImage"];
                  let v151 = v150["includes"](v139) ? v139 : "";
                  if (!v151) {
                    const v152 = new Set(
                      v148["map"]((v153) => String(v153["refSlot"] || ""))[
                        "filter"
                      ]((v154) => v150["includes"](v154)),
                    );
                    v151 = v150["find"]((v155) => !v152["has"](v155)) || "";
                    if (!v151) {
                      let v156 = null;
                      for (const v157 of v148) {
                        const v158 = String(v157["refSlot"] || "");
                        if (!v150["includes"](v158)) continue;
                        const v159 = Number(v157["createdAt"]) || 0;
                        if (!v156 || v159 < (Number(v156["createdAt"]) || 0))
                          v156 = v157;
                      }
                      if (!v156 && v148["length"] > 0) v156 = v148[0];
                      v156
                        ? ((v151 = String(v156["refSlot"] || "") || v150[0]),
                          v10["removeEdge"](v156["id"]))
                        : (v151 = v150[0]);
                    }
                  } else
                    for (const v160 of v148) {
                      if (String(v160["refSlot"] || "") === v151)
                        v10["removeEdge"](v160["id"]);
                    }
                  v140 = v151;
                } else {
                  if (v143) {
                    const v161 = getExclusiveSlotsForFixedSlot(
                        v125?.["exclusiveGroups"],
                        v140,
                      ),
                      v162 = new Set(v161["length"] ? v161 : [v140]);
                    for (const v163 of v148) {
                      if (v162["has"](String(v163["refSlot"] || "")))
                        v10["removeEdge"](v163["id"]);
                    }
                  } else {
                    if (v124) {
                      const v164 = v148["filter"]((v165) => {
                        const v166 =
                          v10["getState"]()["nodes"]?.[v165["sourceId"]];
                        return v37(v166?.["type"] || "") === "image";
                      });
                      if (v164["length"] >= 3) {
                        const v167 = v164["reduce"]((v168, v169) =>
                          (Number(v169["createdAt"]) || 0) <
                          (Number(v168["createdAt"]) || 0)
                            ? v169
                            : v168,
                        );
                        if (v167?.["id"]) v10["removeEdge"](v167["id"]);
                      }
                    } else {
                      for (const v170 of v148) v10["removeEdge"](v170["id"]);
                    }
                  }
                }
              }
              (v122 &&
                v10["updateNodeData"](
                  this["nodeId"],
                  buildImageInputGateClearPatch(v121),
                ),
                removeCoveredAssetInputRefForConnection({
                  targetId: this["nodeId"],
                  sourceKind: "image",
                  refSlot: v123 || v143 ? v140 : "",
                }),
                v10["addNode"](
                  buildSourceMediaNodePayload({
                    id: v132,
                    type: "source-image",
                    x: v136,
                    y: v138,
                    width: v133,
                    height: v134,
                    src: v119,
                    localPath: v130,
                    assetId: v118["assetId"] || "",
                    derivativeStatus:
                      v118["derivativeStatus"] || v118["status"] || "",
                    ...v131,
                    fileName: v118["filename"] || v116["name"] || "",
                    thumbUrl: null,
                    needsAutoResize: true,
                  }),
                ),
                v10["addEdge"]({
                  id: v41("edge"),
                  sourceId: v132,
                  targetId: this["nodeId"],
                  ...((v123 || v143) && v140
                    ? { refSlot: v140, createdAt: Date["now"]() }
                    : { createdAt: Date["now"]() }),
                }),
                v10["setSelectedNodes"]([this["nodeId"]]));
            }),
              await new Promise((v171) => {
                const v172 = new Image();
                ((v172["onload"] = () => {
                  const v173 = v172["naturalWidth"] || 1000,
                    v174 = v172["naturalHeight"] || 1000,
                    { width: v175, height: v176 } = getAutoMediaSizeByShortSide(
                      v173,
                      v174,
                    );
                  (v10["getState"]()["nodes"]?.[v132] &&
                    v10["updateNodeData"](v132, {
                      width: v175,
                      height: v176,
                      needsAutoResize: false,
                      x: v126 - v135 - v175,
                      y:
                        (v123 || v143) && v140
                          ? v138 + Math["round"]((v134 - v176) / 2)
                          : v127 + Math["round"]((v129 - v176) / 2),
                    }),
                    v171());
                }),
                  (v172["onerror"] = () => v171()),
                  (v172["src"] = v119));
              }));
          } catch (v177) {
            window["showToast"]?.(
              v177?.["message"] || "上传失败，请重试",
              "error",
            );
          } finally {
            ((this["_pendingRefSlot"] = ""),
              (this["_refUploadInput"]["value"] = ""));
          }
        }),
        this["refBarEl"]["addEventListener"]("click", (v178) => {
          const v179 = v178["target"]["closest"](".ref-thumb-delete");
          if (v179) {
            (v178["stopPropagation"](), v178["preventDefault"]());
            const v180 = v179["closest"](".ref-thumb-wrap");
            if (v180?.["dataset"]?.["refOrigin"] === "asset") {
              const v181 = {
                  assetId: v180["dataset"]["assetId"],
                  assetIndex: v180["dataset"]["assetIndex"],
                  type:
                    v180["dataset"]["refType"] ||
                    v180["dataset"]["type"] ||
                    v180["dataset"]["kind"],
                  occurrence: v180["dataset"]["assetOccurrence"],
                },
                v182 = String(v180["dataset"]["assetRefSource"] || "")[
                  "trim"
                ](),
                v183 =
                  v182 === "hidden"
                    ? removePromptAssetInputRefFromNode(this, v181)
                    : removeAssetMentionPillFromPrompt(this, v181) ||
                      removePromptAssetInputRefFromNode(this, v181);
              if (v183) return;
            }
            const v184 = v180?.["dataset"]["edgeId"];
            if (v184) v10["removeEdge"](v184);
            return;
          }
          const v185 = v178["target"]["closest"](".ref-upload-delete");
          if (v185) {
            (v178["stopPropagation"](),
              v178["preventDefault"](),
              v10["updateNodeData"](
                this["nodeId"],
                buildImageInputGateClearPatch(
                  getImageNodeInputGate(this["_data"]?.["model"]),
                ),
              ));
            return;
          }
          const v186 = v178["target"]["closest"](".ref-upload-slot");
          if (v186) {
            (v178["stopPropagation"](), v178["preventDefault"]());
            const v187 = v10["getState"]()["nodes"]?.[this["nodeId"]],
              v188 =
                String(getImageNodeInputGate(v187?.["model"])["kind"] || "") ===
                "image",
              v189 = isRhPersonReplaceWorkflowModel(v187?.["model"]),
              v190 = getFixedInputSlotConfigFromManifest(v187 || {}),
              v191 = String(
                v186["dataset"]["refSlot"] || v186["dataset"]["slot"] || "",
              )["trim"](),
              v192 =
                !!v191 &&
                v190?.["visibleSlots"]?.["includes"](v191) &&
                v190?.["slotKindById"]?.[v191] === "image";
            (v188 || v189 || v192) &&
              ((this["_pendingRefSlot"] = v191),
              this["_refUploadInput"]?.["click"]());
          }
        }),
        this["refBarEl"]["addEventListener"]("pointerdown", (v193) => {
          v193["target"]["closest"](
            ".ref-thumb-wrap, .ref-upload-slot, .ref-upload-delete, .ref-thumb-delete",
          ) && v193["stopPropagation"]();
        }));
      const v194 = document["createElement"]("div");
      ((v194["className"] = "prompt-input-wrapper"),
        v194["classList"]["add"]("is-resizable"),
        (this["_promptInputWrap"] = v194),
        (this["promptEl"] = document["createElement"]("div")),
        (this["promptEl"]["className"] = "prompt-textarea custom-textarea"),
        (this["promptEl"]["contentEditable"] = "true"),
        (this["promptEl"]["spellcheck"] = false),
        this["_syncPromptPlaceholder"](this["_data"]));
      if (!document["head"]["querySelector"]("#v2-gen-node-css")) {
        const v195 = document["createElement"]("style");
        ((v195["id"] = "v2-gen-node-css"),
          (v195["textContent"] =
            "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.prompt-textarea:empty::before\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20content:\x20attr(data-placeholder);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20var(--text-placeholder);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20pointer-events:\x20none;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.ref-pill\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20inline-flex;\x20align-items:\x20center;\x20gap:\x203px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20transparent;\x20border:\x20none;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x204px;\x20padding:\x201px\x206px;\x20font-size:\x2014px;\x20/*\x20原\x2012px\x20->\x2014px\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20var(--text-secondary);\x20cursor:\x20var(--pointer-cursor);\x20user-select:\x20text;\x20-webkit-user-select:\x20text;\x20font-weight:\x20500;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20vertical-align:\x20middle;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.ref-pill\x20.pill-del\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2016px;\x20/*\x20原\x2014px\x20->\x2016px\x20*/\x20color:\x20var(--text-muted);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20cursor:\x20var(--link-cursor);\x20margin-left:\x202px;\x20line-height:\x201;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.ref-pill\x20.pill-del:hover\x20{\x20color:\x20var(--red);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.ref-thumb-wrap.dragging\x20{\x20opacity:\x200.3;\x20}\x0a\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x20flex-direction:\x20column;\x20justify-content:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2010px\x2012px;\x20border-radius:\x2012px;\x20cursor:\x20var(--link-cursor);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20transparent;\x20border:\x20none;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transition:\x20all\x200.2s;\x20position:\x20relative;\x20height:\x2054px;\x20overflow:\x20hidden;\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item:hover,\x20.v2-slash-item.active\x20{\x20background:\x20var(--white-05);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-title\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20var(--text-primary);\x20font-size:\x2013px;\x20font-weight:\x20600;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transition:\x20transform\x200.25s\x20cubic-bezier(0.34,\x201.56,\x200.64,\x201);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transform:\x20translateY(10px);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-desc\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20var(--text-muted);\x20font-size:\x2011px;\x20white-space:\x20nowrap;\x20overflow:\x20hidden;\x20text-overflow:\x20ellipsis;\x20font-family:\x20monospace;\x20margin-top:\x204px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transition:\x20transform\x200.25s\x20cubic-bezier(0.34,\x201.56,\x200.64,\x201),\x20opacity\x200.2s;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transform:\x20translateY(16px);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20opacity:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item:hover\x20>\x20.v2-slash-title,\x20.v2-slash-item.active\x20>\x20.v2-slash-title,\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item:hover\x20>\x20.v2-slash-desc,\x20.v2-slash-item.active\x20>\x20.v2-slash-desc\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transform:\x20translateY(0);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item:hover\x20>\x20.v2-slash-desc,\x20.v2-slash-item.active\x20>\x20.v2-slash-desc\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20opacity:\x201;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20"),
          document["head"]["appendChild"](v195));
      }
      ((this["_flushPromptHtmlCommit"] = () => flushPromptHtmlCommit(this)),
        this["promptEl"]["addEventListener"]("input", (v196) => {
          if (isComfyPromptGuardActive(this)) return;
          (schedulePromptHtmlCommit(this),
            this["_checkAtTrigger"](v196),
            v42(v196, {
              promptEl: this["promptEl"],
              nodeType: this["_data"]["type"],
              nodeId: this["nodeId"],
              onGenerate: (v197, v198) => this["_onGenerate"](v197, v198),
            }),
            v15(this),
            this["_updateSubmitButtonState"]());
        }),
        this["promptEl"]["addEventListener"]("blur", (v196b) => {
          if (isComfyPromptGuardActive(this)) return;
          const v196c = v196b?.relatedTarget;
          if (v196c instanceof Node && this["footerEl"]?.contains(v196c)) {
            return;
          }
          flushPromptHtmlCommit(this);
        }),
        this["promptEl"]["addEventListener"]("mouseover", (v199) => {
          v13(v199, this);
        }),
        this["promptEl"]["addEventListener"]("mouseout", (v200) => {
          v14(v200, this);
        }),
        this["promptEl"]["addEventListener"]("keydown", (v201) => {
          if (handlePromptSelectAll(this, v201)) return;
          if (v22(v201)) return;
          if (v43(v201)) return;
          if (v201["key"] === "Enter" && !v201["shiftKey"]) {
            (v201["preventDefault"](),
              flushPromptHtmlCommit(this),
              this["btnEl"]?.["click"]());
            return;
          }
          v20(this, v201);
        }),
        this["promptEl"]["addEventListener"]("paste", (v202) => {
          handlePromptPaste(this, v202);
        }),
        v194["appendChild"](this["promptEl"]),
        this["_syncPromptBoxSizeFromData"](this["_data"]),
        this["_setupPromptBoxResize"]());
      this["_data"]["prompt"] &&
        ((this["promptEl"]["innerHTML"] = sanitizePromptHtml(
          this["_data"]["prompt"],
        )),
        v21(this));
      v106["appendChild"](v194);
      if (isImageFreeAngleOnlyModel(this["_data"]?.["model"])) {
        const v203 = {
          model: DEFAULT_IMAGE_NODE_MODEL,
          provider: DEFAULT_IMAGE_NODE_PROVIDER,
        };
        ((this["_data"] = { ...this["_data"], ...v203 }),
          v10["updateNodeData"](this["nodeId"], v203));
      }
      attachGenerationNodeHelpTip(this, {
        panel: v106,
        kind: "image",
        getKey: () => this["_data"]?.["model"],
        getLabel: () => v12(this["_data"]?.["model"]),
      });
      const v204 = document["createElement"]("div");
      ((v204["className"] = "prompt-panel-footer"), (this["footerEl"] = v204));
      const v205 = isComfyuiEngine(this["_data"])
          ? toComfyuiModelId(this["_data"]?.["comfyWorkflow"])
          : normalizeDreaminaImageModel(
              this["_data"]["model"] || DEFAULT_IMAGE_NODE_MODEL,
              this["_data"]?.["provider"],
            ),
        v205a = isComfyuiEngine(this["_data"])
          ? resolveComfyWorkflowDisplayTitle(this["_data"])
          : v12(v205),
        v206 = isRhQwenImageEditModel(v205),
        v207 =
          this["_data"]?.["generationParams"] &&
          typeof this["_data"]["generationParams"] === "object" &&
          !Array["isArray"](this["_data"]["generationParams"])
            ? this["_data"]["generationParams"]
            : {},
        v208 = v207["imageSize"],
        v209 =
          getNanoBananaSelectionFromModel(
            v205,
            v208 || "2K",
            this["_data"]?.["provider"],
          ) || null,
        v210 = this["_getUiSchemaRenderNodeData"](this["_data"]),
        v211 = renderModelUiSchemaControls(v205, v210, {
          placement: "mode",
          variant: "pillMenu",
        }),
        v212 = renderModelUiSchemaControls(v205, v210, {
          placement: "resolution",
          variant: "resolutionPill",
        }),
        v213 = renderModelUiSchemaControls(v205, v210, {
          placement: "advanced",
          variant: "advancedRow",
        }),
        v214 = renderModelUiSchemaControls(v205, v210, {
          placement: "instance",
          variant: "instanceToggle",
        }),
        v215 = renderModelUiSchemaControls(v205, v210, {
          placement: "batch",
          variant: "pillMenu",
        }),
        v216 = hasModelUiSchema(v205, { placement: "advanced" });
      ((v204["innerHTML"] =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap" style="position:relative;">\n              <button type="button" class="img-pill-btn img-model-btn-trigger">\n                ' +
        renderImageModelTriggerIconHTML({
          model: v205,
          provider: isComfyuiEngine(this["_data"])
            ? "comfyui"
            : this["_data"]?.["provider"],
        }) +
        '\n                <span class="img-model-label">' +
        v205a +
        "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22img-model-menu-lazy-anchor\x22\x20data-lazy-model-menu=\x22image\x22></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22ui-schema-placement\x20ui-schema-mode-slot\x22\x20style=\x22" +
        (v211 ? "" : "display:none;") +
        '">\n              ' +
        v211 +
        '\n            </div>\n            <div class="ui-schema-placement ui-schema-resolution-slot" style="' +
        (v212 ? "" : "display:none;") +
        '">\n              ' +
        v212 +
        '\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <div class="rh-adv-wrap" style="position:relative;' +
        (v216 ? "" : "display:none;") +
        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-pill-btn\x20rh-adv-btn\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22rh-adv-btn-label\x22>高级设置</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22ui-schema-placement\x20ui-schema-batch-slot\x22\x20style=\x22" +
        (v215 ? "" : "display:none;") +
        '">\n              ' +
        v215 +
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22prompt-submit\x20debug-wrench-btn\x22\x20title=\x22调试\x20API\x20参数\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
        DEBUG_WRENCH_ICON_HTML +
        "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22ui-schema-placement\x20ui-schema-instance-slot\x22\x20style=\x22" +
        (v214 ? "" : "display:none;") +
        "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20" +
        v214 +
        '\n            </div>\n            <button type="button" class="prompt-submit img-gen-btn" title="生成">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>'),
        v204["insertAdjacentHTML"](
          "beforeend",
          '\n            <div class="rh-adv-panel">\n              ' +
            v213 +
            "\n            </div>\n      ",
        ));
      const v217 = v204["querySelector"](".rh-adv-panel");
      ((this["rhAdvPanelEl"] = v217),
        (this["modelWrap"] = v204["querySelector"](".img-model-wrap")),
        (this["rhAdvWrap"] = v204["querySelector"](".rh-adv-wrap")),
        (this["uiSchemaModeSlot"] = v204["querySelector"](
          ".ui-schema-mode-slot",
        )),
        (this["uiSchemaResolutionSlot"] = v204["querySelector"](
          ".ui-schema-resolution-slot",
        )),
        (this["uiSchemaInstanceSlot"] = v204["querySelector"](
          ".ui-schema-instance-slot",
        )),
        (this["uiSchemaBatchSlot"] = v204["querySelector"](
          ".ui-schema-batch-slot",
        )),
        (this["btnEl"] = v204["querySelector"](".img-gen-btn")));
      const v218 = v204["querySelector"](".debug-wrench-btn");
      (this["_uiSchemaCleanup"]?.(),
        (this["_uiSchemaCleanup"] = bindModelUiSchemaControls(v204, {
          nodeId: this["nodeId"],
          nodeData: this["_data"],
          store: v10,
          buildPatch: (v219, v220, v221) => {
            if (v220 !== "aspectRatio") return {};
            if (isComfyuiEngine(v219)) {
              const v219wf = String(v219?.["comfyWorkflow"] || "")["trim"]();
              const v219a = getComfyWorkflowConfigFromCache(v219wf);
              const v219b = getComfyWorkflowBundleFromCache(v219wf);
              const v219w = v219b?.workflow || null;
              if (v219a && resolveComfyWorkflowKind(v219a, v219w) === "edit") return {};
              if (v219a && !isComfyGenerateWorkflow(v219a, v219w)) return {};
            }
            return this["_buildSchemaAspectRatioDisplayPatch"](v219, v221);
          },
          decorateNodeData: (v222) => {
            const v222a = this["_getUiSchemaRenderNodeData"](v222);
            if (!isComfyuiEngine(v222a)) return v222a;
            return {
              ...v222a,
              model: DEFAULT_IMAGE_NODE_MODEL,
              provider: DEFAULT_IMAGE_NODE_PROVIDER,
            };
          },
        })),
        this["_footerControllerCleanup"]?.(),
        (this["_footerControllerCleanup"] = bindNodeFooterController(v204)),
        (this["_comfyUiCtx"] = {
          nodeRef: this,
          getNodeData: () => this["_data"],
          updateNodeData: (patch) => {
            this["_data"] = { ...this["_data"], ...patch };
            v10["updateNodeData"](this["nodeId"], patch);
          },
          cancelPromptHtmlCommit: () => cancelPromptHtmlCommit(this),
          updateModelLabel: (label) => {
            const el = v204["querySelector"](".img-model-label");
            if (!el || !label) return;
            el["textContent"] = label;
            el["title"] = label;
          },
          applyModelParamVisibility: () => {
            void this["_syncComfyUiSchemaControls"](this["_data"]);
          },
        }),
        mountComfyEngineUi(v204, this["_comfyUiCtx"]),
        (this["refreshComfyEngineUi"] = this["_comfyUiCtx"]["refreshComfyEngineUi"]),
        (this["_uiSchemaModel"] = v205),
        this["_applyModelParamVisibility"](),
        v218?.["addEventListener"]("click", async (v223) => {
          (v223["stopPropagation"](), flushPromptHtmlCommit(this));
          const v224 = await this["_buildPayload"]();
          if (!v224) {
            window["showToast"]?.("缺少提示词或引用媒体，无法生成", "warn");
            return;
          }
          try {
            const v225 = await v11["buildGenerateImageRequest"](v224),
              v226 = formatFinalApiDebugRequest(v225),
              v227 = v10["getState"](),
              v228 = this["_data"]["x"] + (this["_data"]["width"] || 380) + 50,
              v229 = this["_data"]["y"];
            let v230 = Object["values"](v227["nodes"])["find"](
              (v231) => v231["type"] === "debug",
            );
            (!v230
              ? v10["addNode"]({
                  id: "debug-" + Date["now"](),
                  type: "debug",
                  x: v228,
                  y: v229,
                  width: 380,
                  height: 300,
                  name: "调试节点",
                  outputText: v226,
                })
              : v10["updateNodeData"](v230["id"], {
                  outputText: v226,
                  x: v228,
                  y: v229,
                }),
              window["showToast"]?.("🔧 已展示最终 API 参数", "warn"));
          } catch (v232) {
            window["showToast"]?.(
              "构造请求失败:\x20" + v232["message"],
              "error",
            );
          }
        }));
      const v233 = v204["querySelector"](".img-model-btn-trigger");
      let v234 = null;
      const v235 = v204["querySelector"](".img-model-label"),
        v236 = v204["querySelector"](".rh-res-popup"),
        v237 = v204["querySelector"](".rh-adv-btn"),
        v238 = () => {
          (v204["querySelectorAll"](".ui-schema-floating-menu")["forEach"](
            (v239) => v239["classList"]["remove"]("show"),
          ),
            v204["querySelectorAll"](".ui-schema-popup")["forEach"]((v240) => {
              v240["style"]["display"] = "none";
            }));
        },
        v241 = () => (v234 && v234["isConnected"] ? v234 : null),
        v242 = ({ keepModelMenu: keepModelMenu = false } = {}) => {
          if (!keepModelMenu) v241()?.["classList"]["remove"]("show");
          if (v236) v236["style"]["display"] = "none";
          if (v217) v217["classList"]["remove"]("show");
        },
        v243 = (v244) =>
          v244 && typeof v244 === "object" && !Array["isArray"](v244)
            ? { ...v244 }
            : {},
        v245 = (v246, v247, v248, v249 = {}) => {
          const v248a = String(v248 || "")["trim"]();
          if (v248a === "comfyui") {
            const v248b = String(v247 || "")["trim"]();
            const v248c = parseComfyuiModelId(v248b);
            return {
              ...(v249 && typeof v249 === "object" ? v249 : {}),
              model: v248b,
              provider: "comfyui",
              imageEngine: "comfyui",
              comfyWorkflow:
                v249?.["comfyWorkflow"] ||
                v248c ||
                String(v246?.["comfyWorkflow"] || "")["trim"](),
              comfyWorkflowTitle:
                v249?.["comfyWorkflowTitle"] ||
                String(v246?.["comfyWorkflowTitle"] || "")["trim"](),
              comfyParams:
                v249?.["comfyParams"] && typeof v249["comfyParams"] === "object"
                  ? v249["comfyParams"]
                  : {},
            };
          }
          const v250 = String(v246?.["model"] || "")["trim"](),
            v251 = String(v247 || "")["trim"](),
            v252 = v243(v246?.["generationParamsByModel"]);
          v250 && (v252[v250] = v243(v246?.["generationParams"]));
          const v253 = Object["prototype"]["hasOwnProperty"]["call"](
              v249,
              "generationParams",
            ),
            v254 = v253 ? v243(v249["generationParams"]) : {},
            v255 = v251 ? v252[v251] : undefined,
            v256 = buildModelUiSchemaDefaultParams(v251),
            v257 = getModelManifest(v251),
            v258 = new Set(
              (v257?.["uiSchema"]?.["fields"] || [])["map"]((v259) =>
                String(v259?.["id"] || "")["trim"](),
              ),
            ),
            v260 = {};
          ["imageSize", "aspectRatio", "mode", "batchSize"]["forEach"](
            (v261) => {
              v258["has"](v261) &&
                Object["prototype"]["hasOwnProperty"]["call"](v249, v261) &&
                (v260[v261] = v249[v261]);
            },
          );
          const v262 = {
              ...v256,
              ...v243(v255),
              ...(v253 ? v254 : {}),
              ...v260,
            },
            v263 = sanitizeModelUiSchemaParams(
              v251,
              Object["fromEntries"](
                Object["entries"](v262)["filter"](([v264]) =>
                  v258["has"](v264),
                ),
              ),
            ),
            { generationParams: v265, ...v266 } = v249,
            v267 = { ...v266 };
          return (
            v258["forEach"]((v268) => {
              delete v267[v268];
            }),
            {
              ...v267,
              model: v251,
              provider: v248,
              imageEngine: "default",
              generationParams: v263,
              generationParamsByModel: v252,
            }
          );
        };
      v204["addEventListener"]("ui-schema-menu-before-open", () => {
        v242();
      });
      const v269 = (v270) => {
          (bindImageModelMenuSubmenu({
            modelMenu: v270,
            modelTrigger: v233,
            modelLabel: v235,
            nodeId: this["nodeId"],
            store: v10,
            fallbackNodeData: this["_data"],
            toggleSelector: "[data-grsai-toggle]",
            submenuSelector: ".grsai-submenu",
            defaultProvider: "grsai",
            buildModelPatch: v245,
            resolveSelection: resolveGrsaiImageMenuSelection,
            afterSelect: ({ item: v271 }) =>
              setImageModelTriggerIcon(v233, "grsai", v271),
          }),
            bindImageModelMenuSubmenu({
              modelMenu: v270,
              modelTrigger: v233,
              modelLabel: v235,
              nodeId: this["nodeId"],
              store: v10,
              fallbackNodeData: this["_data"],
              toggleSelector: "[data-ppio-toggle]",
              submenuSelector: ".ppio-submenu",
              defaultProvider: "ppio",
              buildModelPatch: v245,
              afterSelect: ({ item: v272 }) =>
                setImageModelTriggerIcon(v233, "ppio", v272),
            }),
            bindDreaminaImageMenu({
              modelMenu: v270,
              modelTrigger: v233,
              modelLabel: v235,
              nodeId: this["nodeId"],
              store: v10,
              buildModelPatch: v245,
            }),
            bindImageModelMenuSubmenu({
              modelMenu: v270,
              modelTrigger: v233,
              modelLabel: v235,
              nodeId: this["nodeId"],
              store: v10,
              fallbackNodeData: this["_data"],
              toggleSelector: "[data-apimart-toggle]",
              submenuSelector: ".apimart-submenu",
              defaultProvider: "apimart",
              buildModelPatch: v245,
              resolveSelection: resolveApimartImageMenuSelection,
              afterSelect: ({ item: v273 }) =>
                setImageModelTriggerIcon(v233, "apimart", v273),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: v270,
              modelTrigger: v233,
              modelLabel: v235,
              nodeId: this["nodeId"],
              store: v10,
              fallbackNodeData: this["_data"],
              toggleSelector: "[data-volcengine-toggle]",
              submenuSelector: ".volcengine-submenu",
              defaultProvider: "volcengine",
              buildModelPatch: v245,
              resolveSelection: resolveVolcengineImageMenuSelection,
              afterSelect: ({ item: v274 }) =>
                setImageModelTriggerIcon(v233, "volcengine", v274),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: v270,
              modelTrigger: v233,
              modelLabel: v235,
              nodeId: this["nodeId"],
              store: v10,
              fallbackNodeData: this["_data"],
              toggleSelector: "[data-runninghubwf-toggle]",
              submenuSelector: ".runninghubwf-submenu",
              defaultProvider: "runninghubwf",
              buildModelPatch: v245,
              resolveSelection: resolveRunningHubWorkflowImageMenuSelection,
              onDisabled: () =>
                window["showToast"]?.("人物替换图片编辑V3 目前不可用", "warn"),
              beforeSelect: ({ item: v275, model: v276, provider: v277 }) => {
                const v278 = this["_runVipRetryOnce"](() => v275["click"]());
                return this["_guardVipSelection"](v276, v277, v278);
              },
              afterSelect: ({ item: v279 }) =>
                setImageModelTriggerIcon(v233, "runninghubwf", v279),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: v270,
              modelTrigger: v233,
              modelLabel: v235,
              nodeId: this["nodeId"],
              store: v10,
              fallbackNodeData: this["_data"],
              toggleSelector: "[data-comfyui-toggle]",
              submenuSelector: ".comfyui-submenu",
              defaultProvider: "comfyui",
              buildModelPatch: v245,
              resolveSelection: resolveComfyuiImageMenuSelection,
              onDisabled: () =>
                window["showToast"]?.("请先在设置 → ComfyUI 中导入工作流", "warn"),
              afterSelect: ({ item: v279a }) => {
                invalidateComfyWorkflowCache();
                setImageModelTriggerIcon(v233, "comfyui", v279a);
                void this["refreshComfyEngineUi"]?.();
              },
            }),
            bindImageModelMenuSubmenu({
              modelMenu: v270,
              modelTrigger: v233,
              modelLabel: v235,
              nodeId: this["nodeId"],
              store: v10,
              fallbackNodeData: this["_data"],
              toggleSelector: "[data-runninghub-toggle]",
              submenuSelector: ".runninghub-submenu",
              defaultProvider: "runninghubwf",
              buildModelPatch: v245,
              resolveSelection: resolveRunningHubModelImageMenuSelection,
              afterSelect: ({ item: v280, provider: v281 }) =>
                setImageModelTriggerIcon(v233, v281, v280),
            }));
        },
        v282 = async () => {
          const v283 = v241();
          if (v283?.["classList"]?.["contains"]("show")) return v283;
          if (!this["modelWrap"]) return null;
          const v284 =
              (v10["getState"]?.() || {})["nodes"]?.[this["nodeId"]] ||
              this["_data"] ||
              {},
            v285 = isComfyuiEngine(v284)
              ? toComfyuiModelId(v284["comfyWorkflow"])
              : normalizeDreaminaImageModel(
                  v284["model"] || DEFAULT_IMAGE_NODE_MODEL,
                  v284["provider"],
                ),
            v286 =
              v284?.["generationParams"] &&
              typeof v284["generationParams"] === "object" &&
              !Array["isArray"](v284["generationParams"])
                ? v284["generationParams"]
                : {},
            v287 =
              getNanoBananaSelectionFromModel(
                v285,
                v286["imageSize"] || "2K",
                v284?.["provider"],
              ) || null,
            v287a = await fetchComfyuiWorkflows()["catch"](() => ({
              workflows: [],
            })),
            v287b = Array["isArray"](v287a?.["workflows"])
              ? v287a["workflows"]
              : [],
            v288 = document["createElement"]("template");
          v288["innerHTML"] = buildImageModelMenuHTML({
            activeModel: v285,
            nanoSelection: v287,
            comfyWorkflows: v287b,
            activeComfyWorkflow: String(v284["comfyWorkflow"] || "")["trim"](),
          })["trim"]();
          const v289 = v288["content"]["firstElementChild"];
          if (!v289) return null;
          const v290 = this["modelWrap"]["querySelector"](
            "[data-lazy-model-menu='image']",
          );
          return (
            v290
              ? v290["replaceWith"](v289)
              : this["modelWrap"]["appendChild"](v289),
            (v234 = v289),
            v269(v289),
            v289
          );
        };
      v233?.["addEventListener"]("click", async (v291) => {
        v291["stopPropagation"]();
        const v292 = await v282();
        if (!v292) return;
        const v293 = !v292["classList"]["contains"]("show");
        (closeNodeFooterMenus(v204, v292),
          v242({ keepModelMenu: true }),
          v238(),
          v292["classList"]["toggle"]("show", v293),
          v293 && typeof v45 === "function" && v45(v292));
      });
      v237 &&
        v217 &&
        (v237["addEventListener"]("click", (v294) => {
          (v294["stopPropagation"](),
            v217["classList"]["toggle"]("show"),
            v241()?.["classList"]["remove"]("show"));
          if (v236) v236["style"]["display"] = "none";
          v238();
        }),
        v217["addEventListener"]("click", (v295) => v295["stopPropagation"]()));
      (this["btnEl"]["addEventListener"]("click", () => {
        (flushPromptHtmlCommit(this), this["_handleGenerateOrCancel"]());
      }),
        document["addEventListener"]("click", () => {
          v241()?.["classList"]["remove"]("show");
          if (v236) v236["style"]["display"] = "none";
          v238();
        }),
        v204["appendChild"](document["createTextNode"]("")),
        v106["appendChild"](v204),
        v96["appendChild"](v106),
        this["_renderRefBar"](),
        this["_assetMentionRegistryUnsubscribe"]?.(),
        (this["_assetMentionRegistryUnsubscribe"] =
          subscribeAssetMentionRegistry(() => {
            if (this["_assetMentionRegistryRefreshPending"]) return;
            ((this["_assetMentionRegistryRefreshPending"] = true),
              queueMicrotask(() => {
                this["_assetMentionRegistryRefreshPending"] = false;
                if (!v10["getState"]()["nodes"]?.[this["nodeId"]]) return;
                (v21(this),
                  this["_renderRefBar"](),
                  this["_updateSubmitButtonState"]());
              }));
          })));
      const v296 = getImageNodeRootClass(this["_data"]?.["model"]);
      if (v296) v96["classList"]["add"](v296);
      isRhPersonReplaceWorkflowModel(this["_data"]?.["model"]) &&
        v96["classList"]["add"]("rh-person-replace-v3-node");
      const v297 = v96["querySelector"](".node-floating-toolbar");
      (v26(v297, this["nodeId"]),
        (this["_qualityBtns"] = v96
          ? Array["from"](v96["querySelectorAll"](".img-rp-quality-item"))
          : []));
      const v298 = this["refBarEl"]?.["querySelector"](
        ".prompt-attachment-btn",
      );
      return (
        (this["_attachBtnIcon"] = v298
          ? v298["querySelector"](".btn-icon")
          : null),
        v98 &&
          v98["addEventListener"]("pointerdown", (v299) => {
            const v300 =
                v10["getStateRaw"]()["ui"]?.["imageVideoNodeResizeEnabled"] ===
                true,
              v301 = document["getElementById"]("v2-wrap")?.["classList"][
                "contains"
              ]("v2-media-node-resize-enabled");
            if (!(v300 && v301)) return;
            if (v299["button"] !== 0) return;
            (v299["preventDefault"](),
              v299["stopPropagation"](),
              startNodeResizePreview({
                event: v299,
                nodeId: this["nodeId"],
                getNode: () =>
                  v10["getStateRaw"]()["nodes"]?.[this["nodeId"]] ||
                  this["_data"],
                getViewport: () => v10["getStateRaw"]()["viewport"],
                resolveSize: ({
                  startWidth: v302,
                  startHeight: v303,
                  dx: v304,
                  dy: v305,
                }) => {
                  const v306 = v302 / v303,
                    v307 = Math["max"](v304 / v302, v305 / v303),
                    v308 = Math["max"](
                      AI_IMAGE_MIN_SIZE / v302,
                      AI_IMAGE_MIN_SIZE / v303,
                    ),
                    v309 = Math["max"](v308, 1 + v307),
                    v310 = Math["max"](
                      AI_IMAGE_MIN_SIZE,
                      Math["round"](v302 * v309),
                    ),
                    v311 = Math["max"](
                      AI_IMAGE_MIN_SIZE,
                      Math["round"](v310 / v306),
                    );
                  return { width: v310, height: v311 };
                },
                buildFinalPatch: ({ startNode: v312 }) =>
                  v312?.["needsAutoResize"] ? { needsAutoResize: false } : {},
                applyPatch: (v313) =>
                  v10["updateNodeData"](this["nodeId"], v313),
                commit: commit,
              }));
          }),
        this["_updateSubmitButtonState"](),
        typeof this["_maybeResumeDreaminaTaskImpl"] === "function" &&
          queueMicrotask(() => {
            v10["getState"]()["nodes"]?.[this["nodeId"]] &&
              this["_maybeResumeDreaminaTaskImpl"]();
          }),
        typeof this["_maybeResumeAsyncTaskImpl"] === "function" &&
          queueMicrotask(() => {
            v10["getState"]()["nodes"]?.[this["nodeId"]] &&
              this["_maybeResumeAsyncTaskImpl"]();
          }),
        typeof this["_maybeResumeRunningHubTaskImpl"] === "function" &&
          queueMicrotask(() => {
            v10["getState"]()["nodes"]?.[this["nodeId"]] &&
              this["_maybeResumeRunningHubTaskImpl"]();
          }),
        v96
      );
    }
    async ["_switchToFreeAngle"]() {
      if (!this["_promptPanel"]) return;
      if (v46["active"] && v46["nodeId"] === this["nodeId"]) {
        v46["_exit"]();
        return;
      }
      if (window["v2FocusOnNodeAtZoomPercent"])
        window["v2FocusOnNodeAtZoomPercent"](this["nodeId"], 60);
      const v314 = this["_root"]["querySelector"](".act-multiangle");
      await v46["render"](
        this["nodeId"],
        this["_promptPanel"],
        () => this["_switchToPrompt"](),
        () => this["_onGenerate"](),
        v314,
      );
    }
    ["_switchToPrompt"]() {
      if (!this["_promptPanel"]) return;
      this["_promptPanel"]["innerHTML"] = "";
      const v315 = this["modelWrap"]?.["closest"](".prompt-panel-footer"),
        v316 = this["promptEl"]?.["closest"](".prompt-input-wrapper");
      if (this["refBarEl"])
        this["_promptPanel"]["appendChild"](this["refBarEl"]);
      if (v316) this["_promptPanel"]["appendChild"](v316);
      if (v315) this["_promptPanel"]["appendChild"](v315);
      this["_renderRefBar"]();
    }
    ["_updateSubmitButtonState"]() {
      if (!this["btnEl"]) return;
      const v317 =
          typeof v10["getState"] === "function" ? v10["getState"]() : {},
        v318 = v317?.["nodes"] || {},
        v319 =
          typeof v10["getIncomingEdges"] === "function"
            ? v10["getIncomingEdges"](this["nodeId"])
            : [],
        v320 = resolvePromptTextWithTextRefs({
          promptEl: this["promptEl"],
          inEdges: v319,
          nodes: v318,
        }),
        v321 = Array["from"](v320)["length"],
        v322 = String(this["_data"]?.["model"] || "")["trim"](),
        v323 =
          v322 === "runninghub-model/seedream-v4" ||
          v322 === "runninghub-model/seedream-v4.5" ||
          v322 === "runninghub-model/seedream-v5-lite",
        v324 = this["_isRunninghubWorkflowModel"](
          this["_data"]?.["model"],
          this["_data"]?.["provider"],
        ),
        v325 = getImageNodeInputGate(this["_data"]?.["model"]),
        v326 = String(v325["kind"] || "") === "image",
        v327 = shouldUseImageWorkflowBusyButton(this["_data"]?.["model"]),
        v328 = resolveGenerationButtonMode(this["_data"], {
          cancellable: v324,
          cancelInFlight: this["_rhCancelInFlight"] === true,
        });
      if (v328["busy"]) {
        v324
          ? setGenerateButtonCancellableUi(this["btnEl"], {
              title: "点击取消任务",
              tooltip: "点击取消任务",
              ariaLabel: "取消生成",
              busy: v327,
            })
          : setGenerateButtonLoadingUi(this["btnEl"], {
              title: "生成",
              disabled: true,
              ariaLabel: "生成",
            });
        ((this["btnEl"]["disabled"] = v328["disabled"]),
          (this["btnEl"]["style"]["cursor"] = v328["cursor"]));
        return;
      }
      resetGenerateButtonIdleUi(this["btnEl"], "生成");
      if (v324) {
        if (v326) {
          const v329 = !!getImageInputGateUploadedUrl(this["_data"], v325),
            v330 = v319["some"](
              (v331) => v37(v318[v331["sourceId"]]?.["type"] || "") === "image",
            ),
            v332 = v329 || v330;
          ((this["btnEl"]["disabled"] = !v332),
            (this["btnEl"]["style"]["cursor"] = v332
              ? ""
              : "var(--unavailable-cursor)"));
          return;
        }
        ((this["btnEl"]["disabled"] = false),
          (this["btnEl"]["style"]["cursor"] = ""));
        return;
      }
      if (v323) {
        const v333 = v321 >= 5;
        ((this["btnEl"]["disabled"] = !v333),
          (this["btnEl"]["style"]["cursor"] = v333
            ? ""
            : "var(--unavailable-cursor)"));
        return;
      }
      !v320
        ? ((this["btnEl"]["disabled"] = true),
          (this["btnEl"]["style"]["cursor"] = "var(--unavailable-cursor)"))
        : ((this["btnEl"]["disabled"] = false),
          (this["btnEl"]["style"]["cursor"] = ""));
    }
    async ["_loadAndDisplayImage"](v334 = {}) {
      const v335 = v334?.["force"] === true,
        v336 = this["_data"]["images"] || [];
      v336["length"] === 0 &&
        (this["_data"]["imageUrl"] ||
          this["_data"]["localPath"] ||
          this["_data"]["thumbUrl"] ||
          this["_data"]["thumbId"]) &&
        v336["push"]({
          imageUrl: this["_data"]["imageUrl"],
          sourceUrl: this["_data"]["sourceUrl"],
          thumbUrl: this["_data"]["thumbUrl"],
          sourceId: this["_data"]["sourceId"],
          thumbId: this["_data"]["thumbId"],
          localPath: this["_data"]["localPath"],
          originalLocalPath: this["_data"]["originalLocalPath"],
          displayLocalPath: this["_data"]["displayLocalPath"],
          thumbLocalPath: this["_data"]["thumbLocalPath"],
        });
      const v337 =
          String(this["_data"]["rhStatusMessage"] || "")["trim"]() ||
          (String(this["_data"]["jobStatus"] || "")["toLowerCase"]() === "error"
            ? getTaskMessage(this["_data"])
            : ""),
        v338 = this["_data"]["rhStatusCode"];
      if (v337 && v336["length"] === 0) {
        ((this["imgEl"]["style"]["display"] = "none"),
          delete this["imgEl"]["dataset"]["lodSrc"],
          (this["imgEl"]["src"] = ""));
        this["_multiImagesContainer"] &&
          (this["_multiImagesContainer"]["remove"](),
          (this["_multiImagesContainer"] = null));
        (clearMultiResultStackClasses({
          previewEl: this["previewEl"],
          stackWrap: this["_multiStackWrap"],
        }),
          (this["_multiStackWrap"] = null),
          (this["_multiBackdropWrap"] = null),
          (this["_multiBackplateKeyStr"] = ""));
        !this["_statusOverlayEl"] &&
          ((this["_statusOverlayEl"] = document["createElement"]("div")),
          Object["assign"](this["_statusOverlayEl"]["style"], {
            position: "absolute",
            inset: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }),
          this["previewEl"]["appendChild"](this["_statusOverlayEl"]));
        ((this["_statusOverlayEl"]["innerHTML"] = ""),
          this["_statusOverlayEl"]["appendChild"](
            this["_createStatusCard"](v337, v338),
          ));
        return;
      }
      this["_statusOverlayEl"] &&
        (this["_statusOverlayEl"]["remove"](),
        (this["_statusOverlayEl"] = null));
      const v339 = this["_data"]["isImagesExpanded"] || false;
      let v340 = this["_data"]["mainImageIndex"] || 0;
      if (v340 >= v336["length"]) v340 = 0;
      const v341 = v336["map"](
          (v342) =>
            v342["thumbId"] +
            "|" +
            v342["localPath"] +
            "|" +
            v342["originalLocalPath"] +
            "|" +
            v342["displayLocalPath"] +
            "|" +
            v342["thumbLocalPath"] +
            "|" +
            v342["thumbUrl"] +
            "|" +
            v342["imageUrl"],
        )["join"](","),
        v343 = v341 !== this["_lastImagesKeyStr"],
        v344 = v340 !== this["_lastMainIdx"],
        v345 = v339 !== this["_lastIsExpanded"],
        v346 = this["_shouldUseLowZoomThumbnail"]() ? "thumb" : "full",
        v347 = v346 !== this["_lastImageLodMode"],
        v348 = shouldRefreshMultiResultStackDom({
          imageCount: v336["length"],
          previewEl: this["previewEl"],
          containerEl: this["_multiImagesContainer"],
          stackWrap: this["_multiStackWrap"],
          backdropWrap: this["_multiBackdropWrap"],
        });
      if (!v335 && !v343 && !v344 && !v345 && !v347 && !v348) return;
      ((this["_lastImagesKeyStr"] = v341),
        (this["_lastMainIdx"] = v340),
        (this["_lastIsExpanded"] = v339),
        (this["_lastImageLodMode"] = v346));
      (this["_currentSourceId"] !== this["_data"]["sourceId"] ||
        this["_currentLocalPath"] !==
          pickCanvasImageLocalPath(this["_data"])) &&
        (this["_cachedSourceUrl"] &&
          this["_cachedSourceUrl"]["startsWith"]("blob:") &&
          URL["revokeObjectURL"](this["_cachedSourceUrl"]),
        (this["_cachedSourceUrl"] = null),
        (this["_currentSourceId"] = this["_data"]["sourceId"]),
        (this["_currentLocalPath"] = pickCanvasImageLocalPath(this["_data"])));
      if (v336["length"] === 0) {
        ((this["imgEl"]["style"]["display"] = "none"),
          delete this["imgEl"]["dataset"]["lodSrc"],
          (this["imgEl"]["src"] = ""));
        if (this["_placeholderEl"])
          this["_placeholderEl"]["style"]["display"] = "flex";
        this["_multiImagesContainer"] &&
          (this["_multiImagesContainer"]["remove"](),
          (this["_multiImagesContainer"] = null));
        (clearMultiResultStackClasses({
          previewEl: this["previewEl"],
          stackWrap: this["_multiStackWrap"],
        }),
          (this["_multiStackWrap"] = null),
          (this["_multiBackdropWrap"] = null),
          (this["_multiBackplateKeyStr"] = ""));
        return;
      }
      if (this["_placeholderEl"])
        this["_placeholderEl"]["style"]["display"] = "none";
      if (
        v341 !== this["_resolvedUrlsKey"] ||
        !this["_resolvedMainUrls"] ||
        !this["_resolvedAuxUrls"]
      ) {
        const v349 = new Set(
          v336["map"]((v350) => v350["thumbId"])["filter"](Boolean),
        );
        for (const [v351, v352] of this["_thumbObjectUrls"]["entries"]()) {
          !v349["has"](v351) &&
            (v352 &&
              String(v352)["startsWith"]("blob:") &&
              URL["revokeObjectURL"](v352),
            this["_thumbObjectUrls"]["delete"](v351));
        }
        const v353 = [],
          v354 = [];
        for (const v355 of v336) {
          const v356 = toLocalPathUrl(pickCanvasImageLocalPath(v355)),
            v357 = toLocalPathUrl(pickCanvasThumbLocalPath(v355));
          let v358 = "";
          if (v355["thumbId"]) {
            if (this["_thumbObjectUrls"]["has"](v355["thumbId"]))
              v358 = this["_thumbObjectUrls"]["get"](v355["thumbId"]);
            else {
              const v359 = await v28(v355["thumbId"]);
              if (v359) {
                const v360 = URL["createObjectURL"](v359);
                (this["_thumbObjectUrls"]["set"](v355["thumbId"], v360),
                  (v358 = v360));
              }
            }
          }
          const v361 =
              v356 ||
              v358 ||
              String(
                v355["imageUrl"] || v355["sourceUrl"] || v355["thumbUrl"] || "",
              )["trim"](),
            v362 =
              v357 ||
              v358 ||
              v361 ||
              String(
                v355["thumbUrl"] || v355["imageUrl"] || v355["sourceUrl"] || "",
              )["trim"]();
          (v353["push"](v361), v354["push"](v362));
        }
        ((this["_resolvedUrlsKey"] = v341),
          (this["_resolvedMainUrls"] = v353),
          (this["_resolvedAuxUrls"] = v354));
      }
      const v363 = this["_resolvedMainUrls"] || [],
        v364 = this["_resolvedAuxUrls"] || v363;
      if (v336["length"] === 1) {
        this["_multiImagesContainer"] &&
          (this["_multiImagesContainer"]["remove"](),
          (this["_multiImagesContainer"] = null));
        (clearMultiResultStackClasses({
          previewEl: this["previewEl"],
          stackWrap: this["_multiStackWrap"],
        }),
          (this["_multiStackWrap"] = null),
          (this["_multiBackdropWrap"] = null),
          (this["_multiBackplateKeyStr"] = ""));
        const v365 = v336[0];
        if (v365["error"])
          ((this["imgEl"]["style"]["display"] = "none"),
            delete this["imgEl"]["dataset"]["lodSrc"],
            (this["imgEl"]["src"] = ""),
            (this["_multiImagesContainer"] = document["createElement"]("div")),
            Object["assign"](this["_multiImagesContainer"]["style"], {
              position: "absolute",
              inset: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }),
            this["_multiImagesContainer"]["appendChild"](
              this["_createErrorCard"](v365["error"]),
            ),
            this["previewEl"]["appendChild"](this["_multiImagesContainer"]));
        else {
          const v366 = this["_pickImageDisplayUrl"](v363[0], v364[0]);
          (this["_applyImageElementLod"](this["imgEl"], v366["lod"]),
            (this["imgEl"]["src"] = v366["url"] || ""),
            (this["imgEl"]["style"]["display"] = "block"));
        }
        return;
      }
      ((this["imgEl"]["style"]["display"] = "none"),
        this["_root"]?.["style"]["setProperty"]("overflow", "visible"));
      const v367 = this["_pickImageDisplayUrl"](v363[v340], v364[v340]);
      (this["_applyImageElementLod"](this["imgEl"], v367["lod"]),
        (this["imgEl"]["src"] = v367["url"] || ""));
      !this["_multiImagesContainer"] &&
        ((this["_multiImagesContainer"] = document["createElement"]("div")),
        (this["_multiImagesContainer"]["className"] = "multi-images-container"),
        (this["_multiImagesContainer"]["style"]["width"] = "100%"),
        (this["_multiImagesContainer"]["style"]["height"] = "100%"),
        (this["_multiImagesContainer"]["style"]["position"] = "absolute"),
        (this["_multiImagesContainer"]["style"]["top"] = "0"),
        (this["_multiImagesContainer"]["style"]["left"] = "0"),
        this["previewEl"]["appendChild"](this["_multiImagesContainer"]));
      ((this["_multiImagesContainer"]["style"]["width"] = "100%"),
        (this["_multiImagesContainer"]["style"]["height"] = "100%"),
        (this["_multiImagesContainer"]["style"]["display"] = "block"));
      const v368 = v336["length"],
        v369 = 500;
      let v370 = () => {};
      const v371 = buildMultiResultBackplateItems({
          imageCount: v368,
          mainIndex: v340,
        }),
        v372 = getMultiResultBackplateKey(v371),
        v373 = this["_data"]["width"] || this["_root"]["clientWidth"] || 320,
        v374 =
          this["_data"]["height"] ||
          this["_root"]["clientHeight"] ||
          Math["round"]((v373 * 9) / 16),
        v375 = (v376) => {
          for (let v377 = 0; v377 < v368; v377 += 1) {
            const v378 = v377 === v376,
              v379 = this["_multiLayerEls"][v377],
              v380 = this["_multiErrorEls"][v377];
            if (v379) {
              if (v378) this["_loadLazyImageDisplaySource"](v379);
              else this["_clearLazyImageDisplaySource"](v379);
              ((v379["style"]["display"] = v378 ? "block" : "none"),
                (v379["style"]["pointerEvents"] = v378 ? "" : "none"),
                v378 &&
                  ((v379["style"]["transform"] = "rotate(0deg)\x20scale(1)"),
                  (v379["style"]["opacity"] = "1"),
                  (v379["style"]["zIndex"] = v368 + 1),
                  (v379["style"]["boxShadow"] = "0 4px 12px var(--black-40)")));
            }
            v380 &&
              ((v380["style"]["display"] = v378 ? "flex" : "none"),
              (v380["style"]["zIndex"] = v378 ? v368 + 1 : v377));
          }
          this["_lastMainIdx"] = v376;
        },
        v381 = (v382) => {
          const v383 = v10["getState"]()["nodes"][this["nodeId"]],
            v384 = v383["images"] || [];
          if (v384["length"] === 0) return;
          const v385 = v384[v382] ? v382 : 0,
            v386 = v384[v385] || v384[0];
          (v375(v385),
            syncMultiResultStackClasses({
              previewEl: this["previewEl"],
              stackWrap: this["_multiStackWrap"],
              isActive: v368 > 1,
              isExpanded: false,
            }),
            v387(this["_multiToggleBtn"], false),
            v370(false),
            setTimeout(() => {
              v10["updateNodeData"](this["nodeId"], {
                mainImageIndex: v385,
                isImagesExpanded: false,
                imageUrl: v386["imageUrl"],
                sourceUrl: v386["sourceUrl"],
                thumbUrl: v386["thumbUrl"],
                sourceId: v386["sourceId"],
                thumbId: v386["thumbId"],
                localPath: v386["localPath"],
              });
            }, v369));
        },
        v387 = (v388, v389) => {
          if (!v388) return;
          const v390 = {
              bg: "var(--black-45)",
              color: "var(--white-90)",
              border: "1px solid var(--white-15)",
            },
            v391 = {
              bg: "var(--black-70)",
              color: "var(--white-80)",
              border: "1px solid transparent",
            },
            v392 = v389 ? v391 : v390;
          ((v388["innerHTML"] = v389
            ? "<span>" +
              v368 +
              "\x20张</span><svg\x20width=\x2216\x22\x20height=\x2216\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><polyline\x20points=\x229\x2018\x2015\x2012\x209\x206\x22></polyline></svg>"
            : "<span>" +
              v368 +
              "\x20张</span><svg\x20width=\x2216\x22\x20height=\x2216\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><polyline\x20points=\x226\x209\x2012\x2015\x2018\x209\x22></polyline></svg>"),
            (v388["style"]["background"] = v392["bg"]),
            (v388["style"]["color"] = v392["color"]),
            (v388["style"]["border"] = v392["border"]));
        },
        v393 = getMultiResultBackplateCount(v368),
        v394 =
          this["_multiStackWrap"]?.["parentNode"] ===
          this["_multiImagesContainer"],
        v395 =
          Number(this["_multiBackdropWrap"]?.["children"]?.["length"]) || 0,
        v396 =
          v343 ||
          v344 ||
          v347 ||
          !v394 ||
          v395 !== v393 ||
          this["_multiBackplateKeyStr"] !== v372;
      if (v396) {
        ((this["_multiImagesContainer"]["innerHTML"] = ""),
          (this["_multiLayerEls"] = []),
          (this["_multiErrorEls"] = []),
          (this["_multiBackplateEls"] = []),
          (this["_multiToggleBtn"] = null),
          (this["_multiBackdropWrap"] = null),
          (this["_multiStackCardsLaidOut"] = false),
          (this["_multiStackWrap"] = document["createElement"]("div")),
          (this["_multiStackWrap"]["className"] =
            MULTI_RESULT_STACK_WRAP_CLASS),
          Object["assign"](this["_multiStackWrap"]["style"], {
            position: "relative",
            width: "100%",
            height: "100%",
          }),
          (this["_multiBackdropWrap"] = createMultiResultBackplates(
            document,
            v368,
            { items: v371 },
          )));
        this["_multiBackdropWrap"] &&
          (this["_multiStackWrap"]["appendChild"](this["_multiBackdropWrap"]),
          this["_multiBackdropWrap"]
            ["querySelectorAll"]("." + MULTI_RESULT_BACKPLATE_CLASS)
            ["forEach"]((v397) => {
              const v398 = Number(v397["dataset"]?.["imageIndex"]);
              if (!Number["isFinite"](v398)) return;
              this["_multiBackplateEls"][v398] = v397;
              const v399 = this["_pickImageDisplayUrl"](
                  v363[v398],
                  v364[v398],
                  { lowZoomThumbnail: false },
                ),
                v400 = v336[v398];
              if (!v400?.["error"]) {
                const v401 = document["createElement"]("img");
                ((v401["className"] = "multi-stack-backplate-media"),
                  this["_setLazyImageDisplaySource"](v401, v399),
                  (v401["decoding"] = "async"),
                  (v401["draggable"] = false),
                  v401["addEventListener"]("dragstart", (v402) =>
                    v402["preventDefault"](),
                  ),
                  v397["appendChild"](v401));
              }
              const v403 = this["_bindResultImageDragOut"](v397, {
                imageIndex: v398,
                getGhostSourceElement: () =>
                  v397["querySelector"]("img") || v397,
                getFallbackSrc: () =>
                  v397["querySelector"]("img")?.["currentSrc"] ||
                  v397["querySelector"]("img")?.["src"] ||
                  v399["url"] ||
                  "",
                getFallbackSize: () => ({
                  width:
                    this["previewEl"]?.["offsetWidth"] ||
                    this["_data"]?.["width"] ||
                    320,
                  height:
                    this["previewEl"]?.["offsetHeight"] ||
                    this["_data"]?.["height"] ||
                    320,
                }),
              });
              (v397["addEventListener"]("pointerdown", (v404) => {
                const v405 = v10["getState"]()["nodes"][this["nodeId"]];
                v405?.["isImagesExpanded"] && v404["stopPropagation"]();
              }),
                v397["addEventListener"]("click", (v406) => {
                  if (v403()) {
                    (v406["preventDefault"](), v406["stopPropagation"]());
                    return;
                  }
                  const v407 = v10["getState"]()["nodes"][this["nodeId"]];
                  if (!v407?.["isImagesExpanded"]) return;
                  (v406["stopPropagation"](), v381(v398));
                }));
            }));
        this["_multiBackplateKeyStr"] = v372;
        for (let v408 = v368 - 1; v408 >= 0; v408--) {
          const v409 = document["createElement"]("img"),
            v410 = this["_pickImageDisplayUrl"](v363[v408], v364[v408]);
          (this["_setLazyImageDisplaySource"](v409, v410),
            this["_applyImageElementLod"](v409, v410["lod"]),
            (v409["decoding"] = "async"),
            (v409["draggable"] = false),
            v409["addEventListener"]("dragstart", (v411) =>
              v411["preventDefault"](),
            ),
            (v409["style"]["position"] = "absolute"),
            (v409["style"]["top"] = "0"),
            (v409["style"]["left"] = "0"),
            (v409["style"]["width"] = "100%"),
            (v409["style"]["height"] = "100%"),
            (v409["style"]["objectFit"] = "contain"),
            (v409["style"]["borderRadius"] = "18px"),
            (v409["style"]["transition"] =
              "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)"),
            (v409["style"]["transformOrigin"] = "top left"),
            v409["classList"]["add"]("v2-media-preview"));
          const v412 = this["_bindResultImageDragOut"](v409, {
            imageIndex: v408,
            getGhostSourceElement: () => v409,
            getFallbackSrc: () => v409["currentSrc"] || v409["src"] || "",
            getFallbackSize: () => ({
              width:
                this["previewEl"]?.["offsetWidth"] ||
                this["_data"]?.["width"] ||
                320,
              height:
                this["previewEl"]?.["offsetHeight"] ||
                this["_data"]?.["height"] ||
                320,
            }),
          });
          (v409["addEventListener"]("click", (v413) => {
            if (v412()) {
              (v413["preventDefault"](), v413["stopPropagation"]());
              return;
            }
            const v414 = v10["getState"]()["nodes"][this["nodeId"]];
            v414["isImagesExpanded"] &&
              (v413["stopPropagation"](), v381(this["_lastMainIdx"] || 0));
          }),
            v409["addEventListener"]("dblclick", async (v415) => {
              v415["stopPropagation"]();
              const v416 = this["_lastMainIdx"] || 0,
                v417 = v10["getState"]()["nodes"][this["nodeId"]],
                v418 = v417["images"] || [],
                v419 = v418[v416] || v418[0];
              await v29(v419);
            }));
          if (v336[v408]["error"]) {
            const v420 = this["_createErrorCard"](v336[v408]["error"]);
            ((v420["style"]["position"] = "absolute"),
              (v420["style"]["inset"] = "0"),
              (this["_multiErrorEls"][v408] = v420),
              this["_multiStackWrap"]["appendChild"](v420));
          } else
            ((this["_multiLayerEls"][v408] = v409),
              this["_multiStackWrap"]["appendChild"](v409));
        }
        ((this["_multiToggleBtn"] = document["createElement"]("div")),
          (this["_multiToggleBtn"]["className"] = "multi-toggle-btn"),
          Object["assign"](this["_multiToggleBtn"]["style"], {
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 1005,
            padding: "6px 12px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            userSelect: "none",
            fontSize: "15px",
            fontWeight: "500",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
          }),
          this["_multiToggleBtn"]["addEventListener"]("pointerdown", (v421) => {
            if (v421["button"] !== 0) return;
            (v421["preventDefault"](), v421["stopPropagation"]());
            const v422 = v10["getState"]()["nodes"][this["nodeId"]],
              v423 = !!v422["isImagesExpanded"];
            v423
              ? v381(v422["mainImageIndex"] ?? this["_lastMainIdx"] ?? 0)
              : (this["_removeCurrentNodeFromSelection"](),
                v10["updateNodeData"](this["nodeId"], {
                  isImagesExpanded: true,
                }));
          }),
          this["_multiToggleBtn"]["addEventListener"]("mouseenter", () =>
            v387(this["_multiToggleBtn"], true),
          ),
          this["_multiToggleBtn"]["addEventListener"]("mouseleave", () => {
            const v424 = v10["getState"]()["nodes"][this["nodeId"]];
            v387(this["_multiToggleBtn"], !!v424["isImagesExpanded"]);
          }),
          this["_multiToggleBtn"]["addEventListener"]("click", (v425) => {
            (v425["preventDefault"](), v425["stopPropagation"]());
          }),
          this["_multiStackWrap"]["appendChild"](this["_multiToggleBtn"]),
          this["_multiImagesContainer"]["appendChild"](
            this["_multiStackWrap"],
          ));
      }
      (syncMultiResultStackClasses({
        previewEl: this["previewEl"],
        stackWrap: this["_multiStackWrap"],
        isActive: v368 > 1,
        isExpanded: v339,
      }),
        v387(this["_multiToggleBtn"], v339));
      for (let v426 = 0; v426 < v368; v426++) {
        const v427 = v426 === v340,
          v428 = this["_multiLayerEls"][v426],
          v429 = this["_multiErrorEls"][v426];
        if (v428) {
          if (v427) this["_loadLazyImageDisplaySource"](v428);
          else this["_clearLazyImageDisplaySource"](v428);
          ((v428["style"]["display"] = v427 ? "block" : "none"),
            (v428["style"]["pointerEvents"] = v427 ? "" : "none"),
            v427 &&
              ((v428["style"]["transform"] = "rotate(0deg) scale(1)"),
              (v428["style"]["opacity"] = "1"),
              (v428["style"]["zIndex"] = v368 + 1),
              (v428["style"]["boxShadow"] =
                "0\x204px\x2012px\x20var(--black-40)")));
        }
        v429 &&
          ((v429["style"]["display"] = v427 ? "flex" : "none"),
          (v429["style"]["zIndex"] = v427 ? v368 + 1 : v426));
      }
      const v430 = this["previewEl"]["offsetWidth"] || v373,
        v431 = this["previewEl"]["offsetHeight"] || v374,
        v432 = 12,
        v433 = 38,
        v434 = 18,
        v435 = Math["max"](1, v430 - v433 - 4),
        v436 = Math["max"](1, v431 - v434 * 2),
        v437 = [
          { x: 10, y: 0, rotate: 4, scale: 0.99, opacity: 0.86 },
          { x: 22, y: 6, rotate: 8, scale: 0.975, opacity: 0.72 },
          { x: 34, y: 12, rotate: 12, scale: 0.955, opacity: 0.58 },
        ],
        v438 = (v439, v440) => {
          const v441 = Number["parseFloat"](v439);
          return Number["isFinite"](v441) ? v441 : v440;
        },
        v442 = (v443) =>
          "translate(" +
          v443["x"] +
          "px, " +
          v443["y"] +
          "px) rotate(" +
          v443["rotate"] +
          "deg)\x20scale(" +
          v443["scale"] +
          ")",
        v444 =
          "all\x200.46s\x20cubic-bezier(0.175,\x200.885,\x200.32,\x201.27),\x20filter\x200.4s\x20ease-out",
        v445 = (v446, v447) => {
          Object["assign"](v446["style"], {
            top: v447["top"] + "px",
            left: v447["left"] + "px",
            width: v447["width"] + "px",
            height: v447["height"] + "px",
            opacity: String(v447["opacity"]),
            pointerEvents: v447["pointerEvents"],
            zIndex: String(v447["zIndex"]),
            borderRadius: v447["borderRadius"],
            transform: v447["transform"],
            filter: v447["filter"],
            transformOrigin: v447["transformOrigin"],
          });
        },
        v448 = ({ plate: v449, fromFrame: v450, toFrame: v451 }) => {
          if (!v449) return;
          ((v449["style"]["transition"] = "none"),
            v445(v449, v450),
            v449["getBoundingClientRect"]?.(),
            requestAnimationFrame(() => {
              ((v449["style"]["transition"] = v444), v445(v449, v451));
            }));
        },
        v452 = () => {
          const v453 = v368 <= 2 ? v368 : 2,
            v454 = Math["ceil"](v368 / v453),
            v455 = v454 - 1,
            v456 = 0,
            v457 = [];
          for (let v458 = 0; v458 < v454; v458 += 1) {
            for (let v459 = 0; v459 < v453; v459 += 1) {
              if (v458 === v455 && v459 === v456) continue;
              v457["push"]({ r: v458, c: v459 });
            }
          }
          v454 === 2 &&
            v453 === 2 &&
            ((v457["length"] = 0),
            v457["push"]({ r: 1, c: 1 }),
            v457["push"]({ r: 0, c: 0 }),
            v457["push"]({ r: 0, c: 1 }));
          const v460 = new Map();
          let v461 = 0;
          for (let v462 = 0; v462 < v368; v462 += 1) {
            if (v462 === v340) continue;
            const v463 = v457[v461];
            if (!v463) break;
            (v460["set"](v462, {
              order: v461,
              top: (v463["r"] - v455) * (v431 + v432),
              left: v463["c"] * (v430 + v432),
            }),
              (v461 += 1));
          }
          return v460;
        };
      ((v370 = (v464) => {
        const v465 = v452(),
          v466 = this["_multiBackdropWrap"]?.["querySelectorAll"]?.(
            "." + MULTI_RESULT_BACKPLATE_CLASS,
          );
        (v466?.["forEach"]((v467) => {
          const v468 = Number(v467["dataset"]?.["imageIndex"]),
            v469 = Math["max"](1, Number(v467["dataset"]?.["stackIndex"]) || 1),
            v470 = v437[v469 - 1] || v437[0],
            v471 = v465["get"](v468),
            v472 = !!v464 && !!v471,
            v473 = v467["querySelector"](".multi-stack-backplate-media"),
            v474 = v467["classList"]["contains"]("is-expanded-card"),
            v475 = {
              top: v438(v467["style"]["top"], v434),
              left: v438(v467["style"]["left"], v433),
              width: v438(v467["style"]["width"], v435),
              height: v438(v467["style"]["height"], v436),
            },
            v476 = v442(v470),
            v477 = {
              top: v434,
              left: v433,
              width: v435,
              height: v436,
              opacity: v470["opacity"],
              pointerEvents: "none",
              zIndex: v469,
              borderRadius: "0 var(--radius-16) var(--radius-16) 0",
              transform: v476,
              filter: "brightness(0.86) saturate(0.92)",
              transformOrigin: "center\x20right",
            },
            v478 = {
              top: v472 ? v471["top"] : v475["top"],
              left: v472 ? v471["left"] : v475["left"],
              width: v430,
              height: v431,
              opacity: 1,
              pointerEvents: "auto",
              zIndex: v472 ? 2 + v471["order"] : v469,
              borderRadius: "18px",
              transform: "translate(0px, 0px) rotate(0deg) scale(1)",
              filter: "brightness(1) saturate(1)",
              transformOrigin: "bottom left",
            },
            v479 = v474 ? v478 : v477,
            v480 = v472 ? v478 : v477,
            v481 = !!this["_multiStackCardsLaidOut"] && v474 !== v472;
          (v467["classList"]["toggle"]("is-expanded-card", v472),
            (v467["style"]["display"] = "block"));
          if (v473) {
            if (v472) this["_loadLazyImageDisplaySource"](v473);
            else
              v474 && this["_multiStackCardsLaidOut"]
                ? this["_scheduleClearLazyImageDisplaySource"](v473, v369)
                : this["_clearLazyImageDisplaySource"](v473);
            ((v473["style"]["opacity"] = v472 ? "1" : "0"),
              (v473["style"]["transform"] = v472 ? "scale(1)" : "scale(1.02)"));
          }
          v481
            ? v448({ plate: v467, fromFrame: v479, toFrame: v480 })
            : ((v467["style"]["transition"] = v444), v445(v467, v480));
        }),
          (this["_multiStackCardsLaidOut"] = true));
      }),
        this["_expandPanel"] &&
          this["_expandPanel"]["parentNode"] &&
          this["_expandPanel"]["parentNode"]["removeChild"](
            this["_expandPanel"],
          ),
        (this["_expandPanel"] = null),
        v339 &&
          ((this["_root"]["style"]["position"] = "relative"),
          this["_root"]["style"]["setProperty"]("overflow", "visible")),
        v370(v339));
    }
    ["_createErrorCard"](v482) {
      const v483 = document["createElement"]("div");
      return (
        (v483["className"] = "gen-error-card"),
        Object["assign"](v483["style"], {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          gap: "8px",
          padding: "16px",
          boxSizing: "border-box",
          background: "var(--bg-panel-card)",
          textAlign: "center",
        }),
        (v483["innerHTML"] =
          "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2224\x22\x20height=\x2224\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22var(--red)\x22\x20stroke-width=\x222\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<circle\x20cx=\x2212\x22\x20cy=\x2212\x22\x20r=\x2210\x22/><line\x20x1=\x2212\x22\x20y1=\x228\x22\x20x2=\x2212\x22\x20y2=\x2212\x22/><line\x20x1=\x2212\x22\x20y1=\x2216\x22\x20x2=\x2212.01\x22\x20y2=\x2216\x22/>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</svg>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22color:var(--red);font-size:12px;font-weight:600;line-height:1.4;\x22>生成受限/失败</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20style=\x22color:var(--white-50);font-size:11px;line-height:1.5;word-break:break-all;\x22>" +
          v482 +
          "</span>\n        "),
        v483
      );
    }
    ["_createStatusCard"](v484, v485) {
      const v486 = document["createElement"]("div");
      ((v486["className"] = "gen-status-card"),
        Object["assign"](v486["style"], {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          gap: "8px",
          padding: "16px",
          boxSizing: "border-box",
          background: "var(--bg-panel-card)",
          textAlign: "center",
        }));
      const v487 = Number(v485) === 0,
        v488 = v487 ? "var(--green)" : "var(--white-80)",
        v489 = v484;
      return (
        (v486["innerHTML"] =
          "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<svg\x20width=\x2224\x22\x20height=\x2224\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22" +
          v488 +
          '" stroke-width="2">\n                <circle cx="12" cy="12" r="10"/><path d="' +
          (v487 ? "M8\x2012l2.5\x202.5L16\x209" : "M12 8v5") +
          '" />' +
          (v487
            ? ""
            : "<line\x20x1=\x2212\x22\x20y1=\x2216\x22\x20x2=\x2212.01\x22\x20y2=\x2216\x22\x20/>") +
          '\n            </svg>\n            <span style="color:' +
          v488 +
          ';font-size:12px;font-weight:600;line-height:1.4;">' +
          v489 +
          "</span>\n        "),
        v486
      );
    }
    ["_syncPromptPlaceholder"](v490 = this["_data"]) {
      if (!this["promptEl"]) return;
      this["promptEl"]["dataset"]["placeholder"] =
        getImagePromptPlaceholderForModel(v490?.["model"]);
    }
    ["_syncPromptBoxSizeFromData"](v491 = this["_data"]) {
      if (!this["promptEl"] || this["_isPromptBoxResizing"]) return;
      const v492 = getPromptBoxHeightBounds(this["_promptPanel"]),
        v493 = normalizePromptBoxHeight(v491?.["promptBoxHeight"], v492);
      applyPromptBoxHeight(this["promptEl"], v493);
    }
    ["_setupPromptBoxResize"]() {
      if (!this["_promptPanel"] || this["_promptResizeHandle"]) return;
      this["_promptResizeHandle"] = true;
      const v494 = 20,
        v495 = 10,
        v496 = () =>
          v10["getStateRaw"]()["ui"]?.["promptBoxResizeEnabled"] !== false,
        v497 = (v498) =>
          !!v498?.["closest"](".floating-menu,\x20.img-model-menu"),
        v499 = (v500) => {
          const v501 = this["_promptPanel"]["getBoundingClientRect"]();
          return v500 >= v501["bottom"] - v494 && v500 <= v501["bottom"] + v495;
        },
        v502 = (v503) => {
          if (!this["_promptPanel"]) return;
          if (!v496()) {
            this["_promptPanel"]["classList"]["remove"]("is-resize-hover");
            return;
          }
          if (this["_isPromptBoxResizing"]) {
            this["_promptPanel"]["classList"]["add"]("is-resize-hover");
            return;
          }
          const v504 = !v497(v503?.["target"]) && v499(v503["clientY"]);
          this["_promptPanel"]["classList"]["toggle"]("is-resize-hover", v504);
        };
      (this["_promptPanel"]["addEventListener"]("pointermove", v502),
        this["_promptPanel"]["addEventListener"]("pointerleave", () => {
          !this["_isPromptBoxResizing"] &&
            this["_promptPanel"]?.["classList"]["remove"]("is-resize-hover");
        }));
      const v505 = (v506) => {
        if (!this["_promptInputWrap"] || !this["promptEl"]) return;
        if (!v496()) return;
        if (v506["button"] !== 0) return;
        if (!v499(v506["clientY"])) return;
        if (
          v506["target"]?.["closest"](".prompt-submit") ||
          v497(v506["target"])
        )
          return;
        (v506["stopPropagation"](), v506["preventDefault"]());
        const v507 = getPromptBoxHeightBounds(this["_promptPanel"]),
          v508 = v506["clientY"],
          v509 = this["promptEl"]["getBoundingClientRect"]()["height"];
        ((this["_isPromptBoxResizing"] = true),
          this["_promptInputWrap"]["classList"]["add"]("is-resizing"),
          this["_promptPanel"]["classList"]["add"]("is-resize-hover"));
        const v510 = (v511) => {
            v511["preventDefault"]();
            const v512 = normalizePromptBoxHeight(
              v509 + (v511["clientY"] - v508),
              v507,
            );
            applyPromptBoxHeight(this["promptEl"], v512);
          },
          v513 = (v514) => {
            (v514["preventDefault"](),
              window["removeEventListener"]("pointermove", v510),
              window["removeEventListener"]("pointerup", v513),
              window["removeEventListener"]("pointercancel", v513));
            const v515 = normalizePromptBoxHeight(
              this["promptEl"]?.["getBoundingClientRect"]()["height"],
              v507,
            );
            (applyPromptBoxHeight(this["promptEl"], v515),
              this["_promptInputWrap"]["classList"]["remove"]("is-resizing"),
              (this["_isPromptBoxResizing"] = false),
              this["_promptPanel"]["classList"]["remove"]("is-resize-hover"),
              v502(v514),
              v10["updateNodeData"](this["nodeId"], { promptBoxHeight: v515 }));
          };
        (window["addEventListener"]("pointermove", v510),
          window["addEventListener"]("pointerup", v513),
          window["addEventListener"]("pointercancel", v513));
      };
      this["_promptPanel"]["addEventListener"]("pointerdown", v505);
    }
    ["_isRunninghubWorkflowModel"](v516, v517) {
      return isWorkflowModel(v516, v517 || "runninghubwf");
    }
    ["_normalizeLegacySeedreamModel"](v518, v519 = {}) {
      const v520 = v519?.["syncStore"] !== false,
        v521 = v518 || {},
        v522 = String(v521["model"] || "")["trim"](),
        v523 = v522["toLowerCase"]();
      let v524 = "",
        v525 = "";
      if (v523["startsWith"]("apimart/seedream-")) return v518;
      else {
        if (v523["startsWith"]("runninghub-model/seedream-"))
          ((v524 = "runninghub-model/rhart-image-v1"), (v525 = "runninghub"));
        else {
          if (v523["startsWith"]("ppio/seedream-"))
            ((v524 = "nano-banana-2"), (v525 = "grsai"));
          else return v518;
        }
      }
      const v526 = {};
      v522 !== v524 && (v526["model"] = v524);
      String(v521["provider"] || "")["trim"]() !== v525 &&
        (v526["provider"] = v525);
      String(v521["imageSize"] || "")
        ["trim"]()
        ["toUpperCase"]() === "3K" && (v526["imageSize"] = "2K");
      if (Object["keys"](v526)["length"] === 0) return v521;
      const v527 = { ...v521, ...v526 },
        v528 = v10["getState"]()["nodes"]?.[this["nodeId"]];
      return (
        v520 && v528 && v10["updateNodeData"](this["nodeId"], v526),
        v527
      );
    }
    ["_normalizeDreaminaNodeData"](v529, v530 = {}) {
      const v531 = v530?.["syncStore"] !== false,
        v532 = this["_normalizeLegacySeedreamModel"](v529, { syncStore: v531 }),
        v533 = buildDreaminaImageNodeNormalizationPatch(v532);
      if (!v533) return v532;
      const v534 = { ...(v532 || {}), ...v533 },
        v535 = v10["getState"]()["nodes"]?.[this["nodeId"]];
      return (
        v531 && v535 && v10["updateNodeData"](this["nodeId"], v533),
        v534
      );
    }
    ["_buildSchemaAspectRatioDisplayPatch"](v536, v537) {
      const v538 =
          v536 ||
          (v10["getState"]?.() || {})["nodes"]?.[this["nodeId"]] ||
          this["_data"] ||
          {},
        v539 = buildImageSchemaAspectRatioDisplayPatch({
          store: v10,
          nodeId: this["nodeId"],
          nodeData: v538,
          ratioValue: v537,
          minSide: getAIGenerationNodeSize()["width"],
          getRefKindByNodeType: v37,
          resultMediaElement: this["imgEl"],
        });
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this["nodeId"],
          previewEl: this["previewEl"],
          nodeData: v538,
          patch: v539,
        }),
        v539
      );
    }
    ["runAdaptiveRatio"]() {
      const v540 =
          (v10["getState"]?.() || {})["nodes"]?.[this["nodeId"]] ||
          this["_data"] ||
          {},
        v541 = this["_buildSchemaAspectRatioDisplayPatch"](v540, "自适应");
      Object["keys"](v541)["length"] > 0 &&
        v10["updateNodeData"](this["nodeId"], v541);
    }
    ["_applyModelParamVisibility"](v542 = this["_data"]) {
      if (!v542) return;
      if (isComfyuiEngine(v542)) {
        void this["_syncComfyUiSchemaControls"](v542);
        return;
      }
      [
        this["uiSchemaModeSlot"],
        this["uiSchemaResolutionSlot"],
        this["uiSchemaBatchSlot"],
        this["uiSchemaInstanceSlot"],
        this["rhAdvWrap"],
        this["rhAdvPanelEl"],
      ].forEach((slot) => slot?.["classList"]?.["remove"]("hidden"));
      const v543 = this["_getUiSchemaRenderNodeData"](v542),
        v544 = (v545, v546) => {
          if (!v545) return;
          v545["classList"]["remove"]("hidden");
          const v547 = renderModelUiSchemaControls(v542["model"], v543, {
            placement: v546,
            variant:
              v546 === "mode"
                ? "pillMenu"
                : v546 === "resolution"
                  ? "resolutionPill"
                  : v546 === "advanced"
                    ? "advancedRow"
                    : v546 === "instance"
                      ? "instanceToggle"
                      : v546 === "batch"
                        ? "pillMenu"
                        : undefined,
          });
          ((v545["innerHTML"] = v547),
            (v545["style"]["display"] = v547 ? "" : "none"));
        };
      this["_uiSchemaModel"] !== v542["model"] &&
        (v544(this["uiSchemaModeSlot"], "mode"),
        v544(this["uiSchemaResolutionSlot"], "resolution"),
        v544(this["rhAdvPanelEl"], "advanced"),
        v544(this["uiSchemaInstanceSlot"], "instance"),
        v544(this["uiSchemaBatchSlot"], "batch"),
        (this["_uiSchemaModel"] = v542["model"]),
        (this["_qwenFirstImageModeBtns"] = []));
      syncModelUiSchemaControls(
        this["modelWrap"]?.["closest"](".prompt-panel-footer"),
        v543,
      );
      const v548 = hasModelUiSchema(v542["model"], { placement: "advanced" });
      if (this["rhAdvWrap"])
        this["rhAdvWrap"]["style"]["display"] = v548 ? "" : "none";
      if (this["rhAdvPanelEl"] && !v548)
        this["rhAdvPanelEl"]["classList"]["remove"]("show");
    }
    async ["_syncComfyUiSchemaControls"](v542 = this["_data"]) {
      if (!v542 || !isComfyuiEngine(v542)) return;
      const v542a = String(v542["comfyWorkflow"] || "")["trim"]();
      if (!v542a) return;
      beginComfyPromptGuard(this);
      cancelPromptHtmlCommit(this);
      try {
      const v542b = await ensureComfyWorkflowConfig(v542a);
      const v542bBundle = await loadComfyWorkflowBundle(v542a);
      const v542c = isComfyGenerateWorkflow(v542b, v542bBundle?.workflow);
      const v542d = {
        ...this["_getUiSchemaRenderNodeData"](v542),
        model: DEFAULT_IMAGE_NODE_MODEL,
        provider: DEFAULT_IMAGE_NODE_PROVIDER,
      };
      if (this["uiSchemaResolutionSlot"]) {
        if (v542c) {
          const v542e = renderModelUiSchemaControls(
            DEFAULT_IMAGE_NODE_MODEL,
            v542d,
            { placement: "resolution", variant: "resolutionPill" },
          );
          this["uiSchemaResolutionSlot"]["innerHTML"] = v542e || "";
          this["uiSchemaResolutionSlot"]["style"]["display"] = v542e ? "" : "none";
          this["uiSchemaResolutionSlot"]["classList"]["toggle"]("hidden", !v542e);
        } else {
          this["uiSchemaResolutionSlot"]["innerHTML"] = "";
          this["uiSchemaResolutionSlot"]["classList"]["add"]("hidden");
        }
      }
      syncModelUiSchemaControls(this["footerEl"], v542d);
      if (v542c) {
        const v542f =
          v542d?.["generationParams"]?.["aspectRatio"] ||
          v542?.["generationParams"]?.["aspectRatio"] ||
          v542?.["aspectRatio"] ||
          "1:1",
          v542g = this["_buildSchemaAspectRatioDisplayPatch"](
            { ...v542, ...v542d },
            v542f,
          );
        Object["keys"](v542g)["length"] > 0 &&
          v10["updateNodeData"](this["nodeId"], v542g);
      }
      } finally {
        endComfyPromptGuard(this);
      }
    }
  }
  return v47["prototype"];
}

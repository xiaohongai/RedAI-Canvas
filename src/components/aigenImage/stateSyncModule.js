import { sanitizePromptHtml } from "../../utils/dom.js";
import { cancelPromptHtmlCommit } from "../../modules/nodePromptShared.js";
import { createReferenceFallbackThumbHtml } from "../../modules/referenceThumbnailFallback.js";
import {
  getAssetInputRefsFromPromptAndNode,
  isRunningHubWorkflowNode,
} from "../../modules/nodePromptShared.js";
import { getFixedInputSlotConfigFromManifest } from "../../modules/fixedInputAssetRefs.js";
import { stopPreviewNodeLoading } from "../../modules/previewMode.js";
import { resolveCanvasImageDisplayUrl } from "../../services/canvasMediaLocalService.js";
import { shouldShowGenerationBusyUi } from "../../core/generationTaskUiState.js";
import {
  getTargetInputPolicy,
  isRhPersonReplaceWorkflowModel,
  isInputKindAllowed,
  resolveEffectiveInputKind,
} from "../../modules/modelInputPolicy.js";
import {
  collectRefThumbIds,
  resolveRefImageCandidateUrls,
  resolveRefImageRenderSources,
} from "./referenceImageSources.js";
import {
  isDreaminaTerminalGenerationState,
  isFailureGenerationUiState,
  isTerminalGenerationUiState,
  resetGenerateButtonIdleUi,
} from "./generationUiState.js";
import {
  bindRefThumbFixedSlotDrag,
  bindRefThumbOrderDrag,
} from "../../modules/refThumbDragController.js";
import { createPromptAttachmentButtonHTML } from "../refAttachmentButton.js";
import { syncAdaptiveImageInputRatio } from "./adaptiveImageInputRatio.js";
import {
  getImageInputGateUploadedUrl,
  getImageNodeInputGate,
  getImageNodeRootClass,
  shouldAlwaysShowImageRefBar,
} from "./imageNodeManifestPolicies.js";
import {
  getComfyWorkflowConfigFromCache,
  isComfyuiEngine,
  resolveComfyWorkflowDisplayTitle,
} from "../../modules/comfyui/comfyEngineUi.js";
import {
  buildComfyUiRefreshSignature,
  stripComfyPromptPollution,
} from "../../modules/comfyui/comfyPromptGuard.js";
import { renderManifestFixedImageRefBar } from "./fixedImageRefBar.js";
export {
  resolveRefImageCandidateUrls,
  resolveRefImageRenderSources,
} from "./referenceImageSources.js";
export function createAIGenerateNodeStateSyncModule(v0) {
  const {
    store: v1,
    api: v2,
    getDisplayModelName: v3,
    _handlePillHover: v4,
    _handlePillOut: v5,
    _syncEdgesOrderFromPills: v6,
    _syncPillLabels: v7,
    _checkAtTrigger: v8,
    _populateMentionMenu: v9,
    _insertMentionPill: v10,
    _handlePillKeyboard: v11,
    _rehydratePromptPills: v12,
    _handleMentionMenuKeyboard: v13,
    TEXT_TOOLBAR_HTML: v14,
    bindTextToolbarEvents: v15,
    IMAGE_TOOLBAR_HTML: v16,
    bindImageToolbarEvents: v17,
    showDevToast: v18,
    getImage: v19,
    openNodeImagePreview: v20,
    getPromptPresets: v21,
    openCustomPresetsManager: v22,
    startLoading: v23,
    stopLoading: v24,
    bindRefThumbHoverPreview: v25,
    ensureThumbDecoded: v26,
    revealRefThumbMedia: v27,
    getRefKindByNodeType: v28,
    uploadFile: v29,
    ensureConfig: v30,
    getProviderConfig: v31,
    generateId: v32,
    checkSlashTrigger: v33,
    handleSlashKeyboardNavigation: v34,
    closeSlashMenu: v35,
    activateMenuKeyboard: v36,
    ImageFreeAngleController: v37,
  } = v0;
  class v38 {
    ["_getStoreStateForRead"]() {
      return typeof v1["getStateRaw"] === "function"
        ? v1["getStateRaw"]()
        : v1["getState"]();
    }
    async ["_resolveRefThumbObjectUrl"](v39) {
      const v40 = String(v39 || "")["trim"]();
      if (!v40) return "";
      if (this["_refThumbObjectUrls"]["has"](v40))
        return this["_refThumbObjectUrls"]["get"](v40) || "";
      const v41 = await v19(v40);
      if (!v41) return "";
      const v42 = URL["createObjectURL"](v41);
      return (this["_refThumbObjectUrls"]["set"](v40, v42), v42);
    }
    ["_shouldRenderRefBarNow"](v43, v44) {
      const v45 = Array["isArray"](v43?.["selectedNodeIds"])
        ? v43["selectedNodeIds"]
        : [];
      if (v45["includes"](this["nodeId"])) return true;
      if (v44?.["active"] && v44?.["sourceNodeId"] === this["nodeId"])
        return true;
      return shouldAlwaysShowImageRefBar(this["_data"]?.["model"]);
    }
    ["update"](v46) {
      const v47 = this["_normalizeDreaminaNodeData"](v46),
        v48 = this["_data"]?.["model"],
        v49 = this["_data"]?.["rhAnimeRealRefUrl"];
      ((v46 = v47), (this["_data"] = v46));
      if (isComfyuiEngine(v46)) {
        cancelPromptHtmlCommit(this);
      }
      const v50 = v48 !== v46?.["model"],
        v51 = v49 !== v46?.["rhAnimeRealRefUrl"],
        v52 = shouldShowGenerationBusyUi(v46),
        v53 = isTerminalGenerationUiState(v46),
        v54 = isFailureGenerationUiState(v46);
      if (v52)
        ((this["_isGenerating"] = true),
          this["previewEl"] &&
            typeof v23 === "function" &&
            v23(this["previewEl"]));
      else {
        if (v53) {
          this["_isGenerating"] = false;
          isDreaminaTerminalGenerationState(v46) &&
            ((this["_dreaminaActiveSubmitId"] = ""),
            this["_stopDreaminaRecovery"]?.(false));
          stopPreviewNodeLoading(this["nodeId"]);
          if (this["previewEl"]) v24(this["previewEl"]);
          resetGenerateButtonIdleUi(this["btnEl"]);
        }
      }
      (this["_loadAndDisplayImage"](),
        this["_applyMaskPreview"](v46["maskPreviewUrl"] || v46["maskPreview"]));
      const v55 = this["_getStoreStateForRead"](),
        v56 = v55["pickConnectMode"] || {};
      if (this["_placeholderEl"]) {
        const v57 = this["_placeholderEl"]["querySelector"](
          ".placeholder-icon-svg",
        );
        v57 &&
          (v56["active"] && v56["sourceNodeId"] === this["nodeId"]
            ? v57["classList"]["add"]("is-pick-connecting")
            : v57["classList"]["remove"]("is-pick-connecting"));
      }
      const v58 = this["_attachBtnIcon"];
      if (v58) {
        const v59 = v56["active"] && v56["sourceNodeId"] === this["nodeId"];
        ((v58["style"]["transition"] =
          "opacity\x200.2s\x20ease,\x20transform\x200.2s\x20ease"),
          (v58["style"]["opacity"] = v59 ? "0" : ""),
          (v58["style"]["transform"] = v59 ? "scale(0.4)" : ""),
          (v58["style"]["pointerEvents"] = v59 ? "none" : ""));
      }
      if (
        document["activeElement"] !== this["promptEl"] &&
        v46["prompt"] !== undefined
      ) {
        cancelPromptHtmlCommit(this);
        let v60a = String(v46["prompt"] || "");
        if (isComfyuiEngine(v46)) {
          const v60b = stripComfyPromptPollution(v60a);
          if (v60b !== v60a) {
            v60a = v60b;
            v1["updateNodeData"]?.(this["nodeId"], { prompt: v60b });
          }
        }
        const v60 = sanitizePromptHtml(v60a);
        this["promptEl"]["innerHTML"] !== v60 &&
          ((this["promptEl"]["innerHTML"] = v60), v12(this));
      }
      (this["_syncPromptPlaceholder"]?.(v46),
        this["_syncPromptBoxSizeFromData"]?.(v46),
        this["_generationNodeHelpTip"]?.["sync"]());
      const v61 = this["modelWrap"]?.["querySelector"](".img-model-label");
      if (v61) {
        if (isComfyuiEngine(v46)) {
          const v61a = String(v46["comfyWorkflow"] || "")["trim"]();
          if (v61a) {
            const v61b = resolveComfyWorkflowDisplayTitle(
              v46,
              getComfyWorkflowConfigFromCache(v61a),
            );
            v61["textContent"] !== v61b && (v61["textContent"] = v61b);
            v61["title"] = v61b;
          }
        } else if (v46["model"]) {
          v61["textContent"] = v3(v46["model"]);
          v61["removeAttribute"]("title");
        }
      }
      this["_applyModelParamVisibility"](v46);
      const v62 = getImageNodeRootClass(v46["model"]),
        v63 = isRhPersonReplaceWorkflowModel(v46["model"]);
      this["_root"] &&
        (this["_root"]["classList"]["toggle"](
          "rh-anime-real-node",
          v62 === "rh-anime-real-node",
        ),
        v62 &&
          v62 !== "rh-anime-real-node" &&
          this["_root"]["classList"]["add"](v62),
        v63
          ? this["_root"]["classList"]["add"]("rh-person-replace-v3-node")
          : this["_root"]["classList"]["remove"]("rh-person-replace-v3-node"));
      const v64 = this["_shouldRenderRefBarNow"](v55, v56),
        v65 = v1["getIncomingEdges"](this["nodeId"]),
        v66 = v55["nodes"] || {};
      syncAdaptiveImageInputRatio(this, {
        store: v1,
        nodeId: this["nodeId"],
        inEdges: v65,
        nodes: v66,
        targetNodeData: v66?.[this["nodeId"]] || v46 || {},
      });
      if (!v64) this["_renderRefBarPendingWhenVisible"] = true;
      else {
        const v67 = [...v65],
          v68 = v67["map"]((v69) => {
            const v70 = v66[v69["sourceId"]] || null,
              v71 =
                v70 &&
                (typeof v70["_bizRev"] === "number" ||
                  typeof v70["_bizRev"] === "string")
                  ? String(v70["_bizRev"])
                  : "",
              v72 = v70?.["thumbId"] ? String(v70["thumbId"]) : "",
              v73 = String(v70?.["mask"] || "")["trim"]() ? "m1" : "m0",
              v74 = String(v69?.["refSlot"] || ""),
              v75 = String(v69?.["sourceMediaKey"] || "");
            return (
              v69["id"] +
              ":" +
              v69["sourceId"] +
              ":" +
              v74 +
              ":" +
              v75 +
              ":" +
              v71 +
              ":" +
              v72 +
              ":" +
              v73
            );
          })["join"]("|");
        (v50 ||
          v51 ||
          this["_renderRefBarPendingWhenVisible"] ||
          v68 !== this["_lastEdgeSig"]) &&
          ((this["_renderRefBarPendingWhenVisible"] = false),
          (this["_lastEdgeSig"] = v68),
          this["_renderRefBar"]());
      }
      (!v54 &&
        typeof this["_maybeResumeRunningHubTaskImpl"] === "function" &&
        this["_maybeResumeRunningHubTaskImpl"](),
        !v54 &&
          typeof this["_maybeResumeDreaminaTaskImpl"] === "function" &&
          this["_maybeResumeDreaminaTaskImpl"](),
        !v54 &&
          typeof this["_maybeResumeAsyncTaskImpl"] === "function" &&
          this["_maybeResumeAsyncTaskImpl"](),
        this["_updateSubmitButtonState"](),
        (() => {
          const v69a = isComfyuiEngine(v46)
            ? buildComfyUiRefreshSignature(v46)
            : "default-api";
          if (v69a === this["_lastComfyUiRefreshSig"]) return;
          this["_lastComfyUiRefreshSig"] = v69a;
          void this["refreshComfyEngineUi"]?.();
        })());
    }
    async ["_renderRefBar"]() {
      if (!this["refBarEl"]) return;
      const v76 = this["_getStoreStateForRead"](),
        v77 = v76?.["pickConnectMode"] || {};
      if (!this["_shouldRenderRefBarNow"](v76, v77)) {
        this["_renderRefBarPendingWhenVisible"] = true;
        return;
      }
      if (this["_renderRefBarLock"]) {
        this["_renderRefBarPending"] = true;
        return;
      }
      ((this["_renderRefBarLock"] = true),
        (this["_renderRefBarPending"] = false));
      try {
        await this["_renderRefBarImpl"]();
      } finally {
        ((this["_renderRefBarLock"] = false),
          this["_renderRefBarPending"] &&
            ((this["_renderRefBarPending"] = false), this["_renderRefBar"]()));
      }
    }
    async ["_renderRefBarImpl"]() {
      if (!this["refBarEl"]) return;
      const v78 = this["_getStoreStateForRead"](),
        v79 = Object["values"](v78["edges"] || {}),
        v80 = v78["nodes"] || {},
        v81 = v1["getIncomingEdges"](this["nodeId"]),
        v82 = new Set();
      for (const v83 of v81) {
        const v84 = v80[v83["sourceId"]];
        for (const v85 of collectRefThumbIds(v84)) {
          v82["add"](v85);
        }
      }
      for (const [v86, v87] of this["_refThumbObjectUrls"]["entries"]()) {
        !v82["has"](v86) &&
          (v87 &&
            String(v87)["startsWith"]("blob:") &&
            URL["revokeObjectURL"](v87),
          this["_refThumbObjectUrls"]["delete"](v86));
      }
      const v88 = getImageNodeInputGate(this["_data"]?.["model"]),
        v89 = String(v88["kind"] || "")["trim"](),
        v90 = Number(v88["max"]),
        v91 = isRhPersonReplaceWorkflowModel(this["_data"]?.["model"]),
        v92 = getImageInputGateUploadedUrl(this["_data"], v88),
        v93 = v80?.[this["nodeId"]] || this["_data"] || {},
        v94 = getTargetInputPolicy(v93),
        v95 = getFixedInputSlotConfigFromManifest(v93);
      syncAdaptiveImageInputRatio(this, {
        store: v1,
        nodeId: this["nodeId"],
        inEdges: v81,
        nodes: v80,
        targetNodeData: v93,
      });
      const v96 = createPromptAttachmentButtonHTML({
          stroke: "var(--white-80)",
        }),
        v97 = () => {
          let v98 = this["refBarEl"]["querySelector"](".prompt-attachment-btn"),
            v99 = this["refBarEl"]["querySelector"](".ref-thumb-container");
          return (
            (!v98 || !v99) &&
              ((this["refBarEl"]["innerHTML"] =
                v96 + "\x20<div\x20class=\x22ref-thumb-container\x22></div>"),
              (v98 = this["refBarEl"]["querySelector"](
                ".prompt-attachment-btn",
              )),
              (v99 = this["refBarEl"]["querySelector"](".ref-thumb-container")),
              (this["_attachBtnIcon"] = v98
                ? v98["querySelector"](".btn-icon")
                : null)),
            { attachBtn: v98, thumbContainer: v99 }
          );
        };
      let v100 = [];
      const v101 = { text: 0, image: 0, video: 0, audio: 0 },
        v102 = {};
      for (const v103 of v81) {
        const v104 = v80[v103["sourceId"]];
        if (!v104) continue;
        const v105 = resolveEffectiveInputKind(v104, v103);
        if (!v105) continue;
        if (!isInputKindAllowed(v94, v105)) continue;
        if (v89 && v105 !== v89) continue;
        if (v89 && Number["isFinite"](v90) && v101[v89] >= v90) continue;
        if (v91 && v105 !== "image") continue;
        if (v91 && v101["image"] >= 2) continue;
        v101[v105]++;
        const v106 = {
            text: "文本",
            image: "图片",
            video: "视频",
            audio: "音频",
          },
          v107 = "@" + v106[v105] + v101[v105];
        v102[v103["sourceId"]] = v107;
        let v108 = "",
          v109 = "",
          v110 = "";
        if (v105 === "image") {
          let v111 = "";
          for (const v112 of collectRefThumbIds(v104)) {
            v111 = await this["_resolveRefThumbObjectUrl"](v112);
            if (v111) break;
          }
          ({ thumbSrc: v109, previewSrc: v110 } = resolveRefImageRenderSources(
            v104,
            { thumbBlobUrl: v111 },
          ));
        }
        let v113 = resolveCanvasImageDisplayUrl(v104);
        if (!v113 && v104["thumbId"]) {
          if (this["_refThumbObjectUrls"]["has"](v104["thumbId"]))
            v113 = this["_refThumbObjectUrls"]["get"](v104["thumbId"]);
          else {
            const v114 = await v19(v104["thumbId"]);
            if (v114) {
              const v115 = URL["createObjectURL"](v114);
              (this["_refThumbObjectUrls"]["set"](v104["thumbId"], v115),
                (v113 = v115));
            }
          }
        }
        if (!v113) {
          const v116 = resolveRefImageCandidateUrls(v104);
          v113 = v116[0] || "";
        }
        v105 === "image" && (v113 = v109 || v113);
        if (v105 === "image" && v113) {
          v26(v113);
          v110 && v110 !== v113 && v26(v110);
          const v117 = !!String(v104["mask"] || "")["trim"]();
          v108 =
            "<img\x20src=\x22" +
            v113 +
            '" class="ref-thumb-media is-pending" draggable="false">' +
            (v117 ? '<span class="ref-thumb-mask-badge">遮罩</span>' : "");
        } else {
          if (v105 === "text") {
            const v118 = v104["type"] === "ai-text";
            if (v118 && !v104["outputText"]) continue;
            v108 = createReferenceFallbackThumbHtml("text");
          } else {
            if (v105 === "video")
              v108 =
                '<div class="ref-thumb-media" style="background:var(--bg);display:flex;align-items:center;justify-content:center;">\n    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>\n                </div>';
            else
              v105 === "audio" &&
                (v108 = createReferenceFallbackThumbHtml("audio"));
          }
        }
        if (v108) {
          const v119 = String(v104["mask"] || "")["trim"]() ? "m1" : "m0",
            v120 =
              v105 +
              "|" +
              v103["id"] +
              "|" +
              v103["sourceId"] +
              "|" +
              (v113 || "") +
              "|" +
              v119;
          v100["push"]({
            key: "edge:" + v103["id"],
            edgeId: v103["id"],
            sourceId: v103["sourceId"],
            refSlot: v103["refSlot"] || "",
            type: v105,
            label: v107,
            sig: v120,
            thumbHTML: v108,
            thumbSrc: v109 || v113 || "",
            previewSrc: v110 || v113 || "",
          });
        }
      }
      (isRunningHubWorkflowNode(v93) || v95) &&
        getAssetInputRefsFromPromptAndNode(this["promptEl"], {
          nodeData: v93,
          allowedTypes: ["image"],
        })["forEach"]((v121, v122) => {
          const v123 = resolveEffectiveInputKind(v121);
          if (v123 !== "image" || !isInputKindAllowed(v94, v123)) return;
          const v124 = String(v121["thumbUrl"] || v121["url"] || "")["trim"]();
          if (!v124) return;
          v26(v124);
          const v125 = String(v121["assetId"] || ""),
            v126 = String(v121["itemIndex"] ?? ""),
            v127 = String(v121["assetMentionOccurrence"] ?? ""),
            v128 = String(v121["assetRefSource"] || "prompt"),
            v129 = "asset:" + v125 + ":" + v126,
            v130 = "asset:" + v128 + ":" + v125 + ":" + v126 + ":image:" + v122;
          v100["push"]({
            key: v130,
            edgeId: "",
            sourceId: v129,
            refSlot: "",
            type: "image",
            label: v121["label"] || v121["name"] || "参考图",
            sig: v130 + "|" + String(v121["url"] || "") + "|" + v124,
            thumbHTML:
              '<img src="' +
              v124 +
              '" class="ref-thumb-media is-pending" draggable="false">',
            thumbSrc: v124,
            previewSrc: String(v121["url"] || v124),
            virtual: true,
            assetId: v125,
            assetIndex: v126,
            assetOccurrence: v127,
            assetRefSource: v128,
            refType: "image",
          });
        });
      if (v91) {
        const v131 = ["replaceTarget", "replacedImage"],
          v132 = () => {
            const v133 = !!this["refBarEl"]["querySelector"](
                '[data-ref-slot="replaceTarget"]',
              ),
              v134 = !!this["refBarEl"]["querySelector"](
                '[data-ref-slot="replacedImage"]',
              );
            let v135 = this["refBarEl"]["querySelector"](
                ".prompt-attachment-btn",
              ),
              v136 = this["refBarEl"]["querySelector"](".ref-thumb-container");
            (!v135 || !v136 || !v133 || !v134) &&
              ((this["refBarEl"]["innerHTML"] =
                v96 +
                ' <div class="ref-thumb-container"><div class="ref-thumb-wrap ref-upload-slot" data-ref-slot="replaceTarget" data-slot="replaceTarget" data-kind="image" draggable="false" title="替换目标"><span class="ref-upload-label">替换<br>目标</span></div><div class="ref-thumb-wrap ref-upload-slot" data-ref-slot="replacedImage" data-slot="replacedImage" data-kind="image" draggable="false" title="被替换图"><span class="ref-upload-label">被替换<br>图</span></div></div>'),
              (v135 = this["refBarEl"]["querySelector"](
                ".prompt-attachment-btn",
              )),
              (v136 = this["refBarEl"]["querySelector"](
                ".ref-thumb-container",
              )),
              (this["_attachBtnIcon"] = v135
                ? v135["querySelector"](".btn-icon")
                : null));
            const v137 = this["refBarEl"]["querySelector"](
                '[data-ref-slot="replaceTarget"]',
              ),
              v138 = this["refBarEl"]["querySelector"](
                "[data-ref-slot=\x22replacedImage\x22]",
              );
            return { targetEl: v137, sourceEl: v138, container: v136 };
          },
          { targetEl: v139, sourceEl: v140, container: v141 } = v132();
        ((this["_lastRefHTML"] = "__rh-person-replace-v3__"),
          this["refBarEl"]["classList"]["add"]("active"));
        const v142 = (v143) => String(v143?.["key"] || v143?.["edgeId"] || ""),
          v144 = new Set(),
          v145 = new Map(),
          v146 = [
            {
              key: v131[0],
              el: v139,
              title: "替换目标",
              emptyHtml: "替换<br>目标",
            },
            {
              key: v131[1],
              el: v140,
              title: "被替换图",
              emptyHtml: "被替换<br>图",
            },
          ];
        for (const v147 of v100) {
          const v148 = v142(v147);
          if (!v148 || v144["has"](v148)) continue;
          const v149 = String(v147["refSlot"] || "");
          if (!v131["includes"](v149)) continue;
          if (v145["has"](v149)) continue;
          (v145["set"](v149, v147), v144["add"](v148));
        }
        for (const v150 of v100) {
          const v151 = v142(v150);
          if (!v151 || v144["has"](v151)) continue;
          for (const v152 of v131) {
            if (!v145["has"](v152)) {
              (v145["set"](v152, v150), v144["add"](v151));
              break;
            }
          }
        }
        const v153 = (v154, v155, v156) => {
            const v157 = document["createElement"]("div");
            return (
              (v157["className"] = "ref-thumb-wrap\x20ref-upload-slot"),
              (v157["dataset"]["refSlot"] = v154),
              (v157["dataset"]["slot"] = v154),
              (v157["dataset"]["kind"] = "image"),
              (v157["title"] = v155),
              v157["setAttribute"]("draggable", "false"),
              (v157["innerHTML"] =
                '<span class="ref-upload-label">' + v156 + "</span>"),
              v157
            );
          },
          v158 = (v159, v160, v161) => {
            const v162 = document["createElement"]("div");
            return (
              (v162["className"] =
                "ref-thumb-wrap" +
                (v161["virtual"] ? " ref-thumb-wrap--asset" : "")),
              (v162["dataset"]["refSlot"] = v159),
              (v162["dataset"]["slot"] = v159),
              (v162["dataset"]["kind"] = "image"),
              (v162["title"] = v160),
              v162["setAttribute"](
                "draggable",
                v161["virtual"] ? "false" : "true",
              ),
              v162
            );
          };
        for (const v163 of v146) {
          const v164 = v145["get"](v163["key"]) || null;
          let v165 = v163["el"];
          if (!v165) continue;
          if (v164 && v165["classList"]?.["contains"]?.("ref-upload-slot")) {
            const v166 = v158(v163["key"], v163["title"], v164);
            (v165["replaceWith"](v166), (v165 = v166), (v163["el"] = v166));
          } else {
            if (
              !v164 &&
              !v165["classList"]?.["contains"]?.("ref-upload-slot")
            ) {
              const v167 = v153(v163["key"], v163["title"], v163["emptyHtml"]);
              (v165["replaceWith"](v167), (v165 = v167), (v163["el"] = v167));
            }
          }
          ((v165["dataset"]["refSlot"] = v163["key"]),
            (v165["dataset"]["slot"] = v163["key"]),
            (v165["dataset"]["kind"] = "image"),
            (v165["title"] = v163["title"]));
          if (v164) {
            ((v165["className"] =
              "ref-thumb-wrap" +
              (v164["virtual"] ? " ref-thumb-wrap--asset" : "")),
              v165["classList"]?.["remove"]?.("ref-upload-slot"),
              v165["setAttribute"](
                "draggable",
                v164["virtual"] ? "false" : "true",
              ),
              (v165["dataset"]["refKey"] = v142(v164)),
              (v165["dataset"]["edgeId"] = v164["edgeId"] || ""),
              (v165["dataset"]["sourceId"] = v164["sourceId"] || ""),
              (v165["dataset"]["refOrigin"] = v164["virtual"]
                ? "asset"
                : "node"));
            v164["virtual"]
              ? ((v165["dataset"]["assetId"] = v164["assetId"] || ""),
                (v165["dataset"]["assetIndex"] = v164["assetIndex"] || ""),
                (v165["dataset"]["assetOccurrence"] =
                  v164["assetOccurrence"] || ""),
                (v165["dataset"]["assetRefSource"] =
                  v164["assetRefSource"] || "prompt"),
                (v165["dataset"]["refType"] =
                  v164["refType"] || v164["type"] || ""))
              : (delete v165["dataset"]["assetId"],
                delete v165["dataset"]["assetIndex"],
                delete v165["dataset"]["assetOccurrence"],
                delete v165["dataset"]["assetRefSource"],
                delete v165["dataset"]["refType"]);
            v165["dataset"]["sig"] !== v164["sig"] &&
              ((v165["innerHTML"] =
                v164["thumbHTML"] +
                '<button type="button" class="ref-thumb-delete" title="移除参考">&times;</button>'),
              (v165["dataset"]["sig"] = v164["sig"]),
              v27(v165, v164["sig"]));
            if (v164["thumbSrc"])
              v165["dataset"]["thumbSrc"] = v164["thumbSrc"];
            else delete v165["dataset"]["thumbSrc"];
            if (v164["previewSrc"])
              v165["dataset"]["previewSrc"] = v164["previewSrc"];
            else delete v165["dataset"]["previewSrc"];
          } else {
            ((v165["className"] = "ref-thumb-wrap ref-upload-slot"),
              v165["setAttribute"]("draggable", "false"));
            if (v165["dataset"]["refKey"]) delete v165["dataset"]["refKey"];
            if (v165["dataset"]["edgeId"]) delete v165["dataset"]["edgeId"];
            if (v165["dataset"]["sourceId"]) delete v165["dataset"]["sourceId"];
            if (v165["dataset"]["refOrigin"])
              delete v165["dataset"]["refOrigin"];
            if (v165["dataset"]["assetId"]) delete v165["dataset"]["assetId"];
            if (v165["dataset"]["assetIndex"])
              delete v165["dataset"]["assetIndex"];
            if (v165["dataset"]["assetOccurrence"])
              delete v165["dataset"]["assetOccurrence"];
            if (v165["dataset"]["assetRefSource"])
              delete v165["dataset"]["assetRefSource"];
            if (v165["dataset"]["refType"]) delete v165["dataset"]["refType"];
            if (v165["dataset"]["sig"]) delete v165["dataset"]["sig"];
            if (v165["dataset"]["thumbSrc"]) delete v165["dataset"]["thumbSrc"];
            if (v165["dataset"]["previewSrc"])
              delete v165["dataset"]["previewSrc"];
            const v168 =
              '<span class="ref-upload-label">' + v163["emptyHtml"] + "</span>";
            if (v165["innerHTML"] !== v168) v165["innerHTML"] = v168;
          }
        }
        (bindRefThumbFixedSlotDrag({
          owner: this,
          container: v141,
          store: v1,
          nodeId: this["nodeId"],
          acceptMap: { replaceTarget: "image", replacedImage: "image" },
        }),
          this["_syncBtnIconState"](),
          v7(this, {}));
        return;
      }
      if (
        v95 &&
        renderManifestFixedImageRefBar({
          owner: this,
          refBarEl: this["refBarEl"],
          promptEl: this["promptEl"],
          attachBtnHTML: v96,
          fixedInputConfig: v95,
          items: v100,
          targetNodeData: v93,
          sourceIdToLabel: v102,
          store: v1,
          nodeId: this["nodeId"],
          ensureThumbDecoded: v26,
          revealRefThumbMedia: v27,
          syncPillLabels: v7,
        })
      )
        return;
      if (this["_isDraggingSorting"]) {
        (this["_syncBtnIconState"](), v7(this, v102));
        return;
      }
      if (v100["length"] > 0) {
        (this["refBarEl"]["classList"]["add"]("active"),
          this["refBarEl"]["classList"]["remove"]("rh-v5-refbar"));
        const v169 = this["_lastRefHTML"];
        this["_lastRefHTML"] = "__has-items__";
        const { thumbContainer: v170 } = v97();
        String(v169 || "")["startsWith"]("__rh-") &&
          v170["querySelectorAll"](".ref-thumb-wrap")["forEach"]((v171) =>
            v171["remove"](),
          );
        (v170["querySelectorAll"](".ref-upload-slot")["forEach"]((v172) =>
          v172["remove"](),
        ),
          v170["querySelectorAll"](".ref-thumb-wrap")["forEach"]((v173) => {
            const v174 =
              String(v173?.["dataset"]?.["refKey"] || "")["trim"]() ||
              (String(v173?.["dataset"]?.["edgeId"] || "")["trim"]()
                ? "edge:" + String(v173["dataset"]["edgeId"])["trim"]()
                : "");
            if (!v174) v173["remove"]();
          }));
        const v175 = new Map();
        v170["querySelectorAll"](".ref-thumb-wrap")["forEach"]((v176) => {
          const v177 = String(v176?.["dataset"]?.["edgeId"] || "")["trim"](),
            v178 =
              String(v176?.["dataset"]?.["refKey"] || "")["trim"]() ||
              (v177 ? "edge:" + v177 : "");
          if (!v178) return;
          v175["set"](v178, v176);
        });
        const v179 = new Set();
        for (let v180 = 0; v180 < v100["length"]; v180++) {
          const v181 = v100[v180],
            v182 = String(v181["key"] || v181["edgeId"] || "");
          if (!v182) continue;
          let v183 = v175["get"](v182);
          !v183 &&
            ((v183 = document["createElement"]("div")),
            (v183["className"] =
              "ref-thumb-wrap" +
              (v181["virtual"] ? "\x20ref-thumb-wrap--asset" : "")));
          v183["setAttribute"]("draggable", v181["virtual"] ? "false" : "true");
          v183["dataset"]["sig"] !== v181["sig"] &&
            ((v183["innerHTML"] =
              v181["thumbHTML"] +
              '<button type="button" class="ref-thumb-delete" title="移除参考">&times;</button>'),
            (v183["dataset"]["sig"] = v181["sig"]),
            v27(v183, v181["sig"]));
          ((v183["dataset"]["refKey"] = v182),
            (v183["dataset"]["edgeId"] = v181["edgeId"] || ""),
            (v183["dataset"]["sourceId"] = v181["sourceId"]),
            (v183["dataset"]["refOrigin"] = v181["virtual"]
              ? "asset"
              : "node"));
          v181["virtual"]
            ? ((v183["dataset"]["assetId"] = v181["assetId"] || ""),
              (v183["dataset"]["assetIndex"] = v181["assetIndex"] || ""),
              (v183["dataset"]["assetOccurrence"] =
                v181["assetOccurrence"] || ""),
              (v183["dataset"]["assetRefSource"] =
                v181["assetRefSource"] || "prompt"),
              (v183["dataset"]["refType"] =
                v181["refType"] || v181["type"] || ""))
            : (delete v183["dataset"]["assetId"],
              delete v183["dataset"]["assetIndex"],
              delete v183["dataset"]["assetOccurrence"],
              delete v183["dataset"]["assetRefSource"],
              delete v183["dataset"]["refType"]);
          ((v183["dataset"]["type"] = v181["type"]),
            (v183["dataset"]["label"] = v181["label"]),
            (v183["dataset"]["index"] = String(v180)));
          if (v181["thumbSrc"]) v183["dataset"]["thumbSrc"] = v181["thumbSrc"];
          else delete v183["dataset"]["thumbSrc"];
          if (v181["previewSrc"])
            v183["dataset"]["previewSrc"] = v181["previewSrc"];
          else delete v183["dataset"]["previewSrc"];
          (v170["appendChild"](v183), v179["add"](v182));
        }
        for (const [v184, v185] of v175["entries"]()) {
          if (!v179["has"](v184)) v185["remove"]();
        }
        this["_bindDragSort"](this["refBarEl"]);
      } else {
        if (v89 === "image") {
          this["refBarEl"]["classList"]["remove"]("rh-v5-refbar");
          const v186 =
            v96 +
            ' <div class="ref-thumb-container">' +
            (v92
              ? '<div class="ref-thumb-wrap ref-upload-slot" data-ref-src="upload"><img src="' +
                v92 +
                '" class="ref-thumb-media" draggable="false"><button type="button" class="ref-upload-delete" title="移除参考">&times;</button></div>'
              : '<button type="button" class="ref-thumb-wrap ref-upload-slot" title="上传参考"><span class="ref-upload-label">上传<br>参考</span></button>') +
            "</div>";
          if (this["_lastRefHTML"] !== v186) {
            ((this["_lastRefHTML"] = v186),
              this["refBarEl"]["classList"]["add"]("active"),
              (this["refBarEl"]["innerHTML"] = v186));
            const v187 = this["refBarEl"]["querySelector"](
              ".prompt-attachment-btn",
            );
            this["_attachBtnIcon"] = v187
              ? v187["querySelector"](".btn-icon")
              : null;
          }
        } else {
          (this["refBarEl"]["classList"]["remove"]("active"),
            this["refBarEl"]["classList"]["remove"]("rh-v5-refbar"),
            (this["_lastRefHTML"] = "__empty__"));
          const { thumbContainer: v188 } = v97();
          v188["querySelectorAll"](".ref-thumb-wrap")["forEach"]((v189) =>
            v189["remove"](),
          );
        }
      }
      (this["_syncBtnIconState"](), v7(this, v102));
    }
    ["_syncBtnIconState"]() {
      const v190 = v1["getState"]()["pickConnectMode"],
        v191 = this["refBarEl"]?.["querySelector"](".btn-icon");
      if (!v191) return;
      v190 && v190["active"] && v190["sourceNodeId"] === this["nodeId"]
        ? ((v191["style"]["opacity"] = "0"),
          (v191["style"]["transform"] = "scale(0.4)"),
          (v191["style"]["transition"] =
            "opacity 0.2s ease, transform 0.2s ease"))
        : ((v191["style"]["opacity"] = ""), (v191["style"]["transform"] = ""));
    }
    ["_bindDragSort"](v192) {
      bindRefThumbOrderDrag({
        owner: this,
        container: v192,
        store: v1,
        nodeId: this["nodeId"],
      });
    }
  }
  return v38["prototype"];
}

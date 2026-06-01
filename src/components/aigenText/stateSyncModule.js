import { sanitizePromptHtml } from "../../utils/dom.js";
import { createReferenceFallbackThumbHtml } from "../../modules/referenceThumbnailFallback.js";
import { resolveEffectiveInputKind } from "../../modules/modelInputPolicy.js";
import { createPromptAttachmentButtonHTML } from "../refAttachmentButton.js";
import { bindRefThumbOrderDrag } from "../../modules/refThumbDragController.js";
import { resolvePromptTextWithTextRefs } from "../../modules/nodePromptShared.js";
import {
  isTaskTerminal,
  resolveGenerationButtonMode,
  shouldShowGenerationBusyUi,
} from "../../core/generationTaskUiState.js";
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonLoadingUi,
} from "../../modules/previewGenerateButtonUi.js";
export function createAIGenTextNodeStateSyncModule(v0) {
  const {
    store: v1,
    api: v2,
    getDisplayModelName: v3,
    ensureThumbDecoded: v4,
    revealRefThumbMedia: v5,
    commit: v6,
    TEXT_TOOLBAR_HTML: v7,
    bindTextToolbarEvents: v8,
    getPromptPresets: v9,
    openCustomPresetsManager: v10,
    startLoading: v11,
    stopLoading: v12,
    bindRefThumbHoverPreview: v13,
    checkSlashTrigger: v14,
    handleSlashKeyboardNavigation: v15,
    closeSlashMenu: v16,
    activateMenuKeyboard: v17,
    _checkAtTrigger: v18,
    _populateMentionMenu: v19,
    _handleMentionMenuKeyboard: v20,
    _handlePillKeyboard: v21,
    _rehydratePromptPills: v22,
    _handlePillHover: v23,
    _handlePillOut: v24,
    _syncEdgesOrderFromPills: v25,
    _syncPillLabels: v26,
    getCustomTextModels: v27,
    saveCustomTextModels: v28,
  } = v0;
  class v29 {
    ["_getEffectiveSubmitPromptText"]() {
      const v30 = typeof v1["getState"] === "function" ? v1["getState"]() : {};
      return resolvePromptTextWithTextRefs({
        promptEl: this["promptEl"],
        inEdges:
          typeof v1["getIncomingEdges"] === "function"
            ? v1["getIncomingEdges"](this["nodeId"])
            : [],
        nodes: v30?.["nodes"] || {},
      });
    }
    ["_updateSubmitButtonState"]() {
      if (!this["btnEl"]) return;
      const v31 = this["_getEffectiveSubmitPromptText"](),
        v32 =
          v1["getState"]?.()["nodes"]?.[this["nodeId"]] || this["_data"] || {},
        v33 = resolveGenerationButtonMode(
          this["_isGenerating"] && v32?.["jobStatus"] !== "error"
            ? {
                ...v32,
                isGenerating: true,
                jobStatus: v32["jobStatus"] || "running",
              }
            : v32,
          { cancellable: v32?.["taskCancellable"] === true },
        );
      if (v33["busy"]) {
        (setGenerateButtonLoadingUi(this["btnEl"], {
          title: "生成",
          disabled: v33["disabled"],
          ariaLabel: "生成",
        }),
          (this["btnEl"]["disabled"] = v33["disabled"]),
          (this["btnEl"]["style"]["cursor"] = v33["cursor"]));
        return;
      }
      (resetGenerateButtonIdleUi(this["btnEl"], "生成"),
        !v31
          ? ((this["btnEl"]["disabled"] = true),
            (this["btnEl"]["style"]["cursor"] = "var(--unavailable-cursor)"))
          : ((this["btnEl"]["disabled"] = false),
            (this["btnEl"]["style"]["cursor"] = "")));
    }
    ["update"](v34) {
      this["_data"] = v34;
      if (shouldShowGenerationBusyUi(v34))
        ((this["_isGenerating"] = true),
          this["previewEl"] &&
            typeof v11 === "function" &&
            v11(this["previewEl"]));
      else
        isTaskTerminal(v34) &&
          ((this["_isGenerating"] = false),
          this["previewEl"] &&
            typeof v12 === "function" &&
            v12(this["previewEl"]));
      const v35 =
          this["outputEl"]?.["classList"]?.["contains"]?.(
            "is-text-selection-active",
          ) === true,
        v36 = this["_outputScrollTopDirty"] === true,
        v37 = String(v34["outputText"] || ""),
        v38 = v37 !== this["_lastRenderedOutputText"];
      !v35 &&
        !v36 &&
        Number["isFinite"](v34["outputScrollTop"]) &&
        (this["_outputScrollTop"] = Math["max"](0, v34["outputScrollTop"]));
      const v39 =
        this["outputEl"] &&
        document["activeElement"] === this["outputEl"] &&
        this["outputEl"]["getAttribute"]?.("contenteditable") === "true";
      !v39 &&
        !v35 &&
        v38 &&
        this["outputEl"] &&
        this["_renderOutputText"]?.(v37);
      this["outputEl"] &&
        document["activeElement"] !== this["outputEl"] &&
        !v35 &&
        !v36 &&
        (this["outputEl"]["scrollTop"] = this["_outputScrollTop"]);
      const v40 = v1["getState"]()["pickConnectMode"];
      if (this["_placeholderEl"]) {
        const v41 = this["_placeholderEl"]["querySelector"](
          ".placeholder-icon-svg",
        );
        v41 &&
          (v40["active"] && v40["sourceNodeId"] === this["nodeId"]
            ? v41["classList"]["add"]("is-pick-connecting")
            : v41["classList"]["remove"]("is-pick-connecting"));
      }
      const v42 = this["refBarEl"]?.["querySelector"](".prompt-attachment-btn");
      if (v42) {
        const v43 = v42["querySelector"](".btn-icon");
        if (v43) {
          const v44 = v40["active"] && v40["sourceNodeId"] === this["nodeId"];
          ((v43["style"]["transition"] =
            "opacity\x200.2s\x20ease,\x20transform\x200.2s\x20ease"),
            (v43["style"]["opacity"] = v44 ? "0" : ""),
            (v43["style"]["transform"] = v44 ? "scale(0.4)" : ""));
        }
      }
      if (
        document["activeElement"] !== this["promptEl"] &&
        v34["prompt"] !== undefined
      ) {
        const v45 = sanitizePromptHtml(v34["prompt"] || "");
        this["promptEl"]?.["innerHTML"] !== v45 &&
          ((this["promptEl"]["innerHTML"] = v45), v22(this));
      }
      this["_syncPromptBoxSizeFromData"]?.(v34);
      const v46 = this["modelWrap"]?.["querySelector"](".img-model-label");
      if (v46 && v34["model"]) v46["textContent"] = v3(v34["model"]);
      const v47 = v1["getState"](),
        v48 = v47["nodes"] || {},
        v49 = v1["getIncomingEdges"](this["nodeId"]),
        v50 = (v51, v52) => {
          if (!v51) return "0";
          const v53 = resolveEffectiveInputKind(v51, v52),
            v54 = v51["_bizRev"] ?? "",
            v55 = !!String(v51["mask"] || "")["trim"](),
            v56 = !!String(
              v51["outputText"] ||
                v51["text"] ||
                v51["content"] ||
                v51["prompt"] ||
                "",
            )["trim"](),
            v57 =
              !!v51["thumbId"] ||
              !!v51["thumbUrl"] ||
              !!v51["imageUrl"] ||
              !!v51["src"] ||
              !!v51["localPath"],
            v58 =
              (Array["isArray"](v51["videos"]) &&
                v51["videos"]["length"] > 0) ||
              !!v51["thumbId"] ||
              !!v51["thumbUrl"] ||
              !!v51["videoUrl"] ||
              !!v51["src"] ||
              !!v51["localPath"],
            v59 = !!v51["audioUrl"] || !!v51["src"] || !!v51["localPath"];
          if (v53 === "text") return "t:" + v54 + ":" + (v56 ? 1 : 0);
          if (v53 === "video") return "v:" + v54 + ":" + (v58 ? 1 : 0);
          if (v53 === "audio") return "a:" + v54 + ":" + (v59 ? 1 : 0);
          return "i:" + v54 + ":" + (v57 ? 1 : 0) + ":" + (v55 ? 1 : 0);
        },
        v60 = [...v49],
        v61 = v60["map"](
          (v62) =>
            v62["id"] +
            ":" +
            v62["sourceId"] +
            ":" +
            String(v62?.["refSlot"] || "") +
            ":" +
            String(v62?.["sourceMediaKey"] || "") +
            ":" +
            v50(v48[v62["sourceId"]], v62),
        )["join"]("|");
      (v61 !== this["_lastEdgeSig"] &&
        ((this["_lastEdgeSig"] = v61), this["_renderRefBar"]()),
        this["_updateSubmitButtonState"]());
    }
    ["_renderRefBar"]() {
      if (!this["refBarEl"]) return;
      const v63 = v1["getState"](),
        v64 = v63["nodes"] || {},
        v65 = v1["getIncomingEdges"](this["nodeId"]);
      this["_lastInEdgeCount"] = v65["length"];
      const v66 = createPromptAttachmentButtonHTML();
      if (v65["length"] === 0) {
        const v67 = v66;
        this["_lastRefHTML"] !== v67 &&
          ((this["_lastRefHTML"] = v67),
          this["refBarEl"]["classList"]["remove"]("active"),
          (this["refBarEl"]["innerHTML"] = v67));
        this["_syncBtnIconState"]();
        return;
      }
      const v68 = { text: 0, image: 0, video: 0, audio: 0 },
        v69 = [],
        v70 = {};
      v65["forEach"]((v71) => {
        const v72 = v64[v71["sourceId"]];
        if (!v72) return;
        const v73 = resolveEffectiveInputKind(v72, v71) || "other";
        v68[v73] = (v68[v73] || 0) + 1;
        const v74 = {
            text: "文本",
            image: "图片",
            video: "视频",
            audio: "音频",
            group: "编组",
            other: "节点",
          },
          v75 = "@" + v74[v73] + v68[v73];
        v70[v71["sourceId"]] = v75;
        let v76 = "";
        if (v73 === "image" && v72["src"])
          v76 =
            '<img src="' +
            v72["src"] +
            '" class="ref-thumb-media" draggable="false">';
        else {
          if (v73 === "image" && v72["imageUrl"])
            v76 =
              '<img src="' +
              v72["imageUrl"] +
              '" class="ref-thumb-media" draggable="false">';
          else {
            if (v73 === "text") {
              const v77 = String(
                v72["outputText"] ||
                  v72["text"] ||
                  v72["content"] ||
                  v72["prompt"] ||
                  "",
              )["trim"]();
              if (!v77) return;
              v76 = createReferenceFallbackThumbHtml("text");
            } else {
              if (v73 === "video") {
                const v78 =
                  (Array["isArray"](v72["videos"]) &&
                    v72["videos"]["length"] > 0) ||
                  !!v72["thumbId"] ||
                  !!v72["thumbUrl"] ||
                  !!v72["videoUrl"] ||
                  !!v72["src"] ||
                  !!v72["localPath"];
                if (!v78) return;
                v76 =
                  '<div class="ref-thumb-media" style="background:var(--bg-node);display:flex;align-items:center;justify-content:center;">\n                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n                </div>';
              } else {
                if (v73 === "audio") {
                  const v79 =
                    !!v72["audioUrl"] || !!v72["src"] || !!v72["localPath"];
                  if (!v79) return;
                  v76 = createReferenceFallbackThumbHtml("audio");
                } else {
                  if (v73 === "group" || v73 === "other") {
                    const v80 = v73 === "group",
                      v81 = v80
                        ? v72["color"] || "var(--indigo)"
                        : "var(--text-muted)",
                      v82 = (v72["name"] || (v80 ? "组" : "节点"))
                        ["substring"](0, 2)
                        ["toUpperCase"]();
                    v76 =
                      '<div class="ref-thumb-media" style="display:flex;align-items:center;justify-content:center;background:' +
                      v81 +
                      "33;border:1px solid " +
                      v81 +
                      '80;box-sizing:border-box;">\n                    <span style="color:' +
                      v81 +
                      ';font-size:12px;font-weight:bold;letter-spacing:1px;user-select:none;">' +
                      v82 +
                      "</span>\n                </div>";
                  }
                }
              }
            }
          }
        }
        v76 &&
          v69["push"]({
            edgeId: v71["id"],
            sourceId: v71["sourceId"],
            type: v73,
            label: v75,
            index: v69["length"],
            sig: v73 + "|" + v71["id"] + "|" + v71["sourceId"] + "|" + v76,
            thumbHTML: v76,
          });
      });
      if (v69["length"] === 0) {
        const v83 = v66;
        this["_lastRefHTML"] !== v83 &&
          ((this["_lastRefHTML"] = v83),
          this["refBarEl"]["classList"]["remove"]("active"),
          (this["refBarEl"]["innerHTML"] = v83));
        (this["_syncBtnIconState"](), v26(this, v70));
        return;
      }
      if (this["_isDraggingSorting"]) {
        (this["_syncBtnIconState"](), v26(this, v70));
        return;
      }
      ((this["_lastRefHTML"] = "__has-items__"),
        this["refBarEl"]["classList"]["add"]("active"));
      let v84 = this["refBarEl"]["querySelector"](".prompt-attachment-btn"),
        v85 = this["refBarEl"]["querySelector"](".ref-thumb-container");
      (!v84 || !v85) &&
        ((this["refBarEl"]["innerHTML"] =
          v66 + ' <div class="ref-thumb-container"></div>'),
        (v84 = this["refBarEl"]["querySelector"](".prompt-attachment-btn")),
        (v85 = this["refBarEl"]["querySelector"](".ref-thumb-container")));
      const v86 = new Map();
      v85["querySelectorAll"](".ref-thumb-wrap")["forEach"]((v87) =>
        v86["set"](String(v87?.["dataset"]?.["edgeId"] || ""), v87),
      );
      const v88 = new Set();
      for (const v89 of v69) {
        const v90 = String(v89["edgeId"] || "");
        if (!v90) continue;
        let v91 = v86["get"](v90);
        (!v91 &&
          ((v91 = document["createElement"]("div")),
          (v91["className"] = "ref-thumb-wrap")),
          v91["setAttribute"]("draggable", "true"),
          v91["dataset"]["sig"] !== v89["sig"] &&
            ((v91["innerHTML"] =
              v89["thumbHTML"] +
              '<button type="button" class="ref-thumb-delete" title="移除参考">&times;</button>'),
            (v91["dataset"]["sig"] = v89["sig"]),
            v5(v91, v89["sig"])),
          (v91["dataset"]["edgeId"] = v90),
          (v91["dataset"]["sourceId"] = v89["sourceId"] || ""),
          (v91["dataset"]["type"] = v89["type"] || ""),
          (v91["dataset"]["label"] = v89["label"] || ""),
          (v91["dataset"]["index"] = String(v89["index"] ?? "")),
          v85["appendChild"](v91),
          v88["add"](v90));
      }
      for (const [v92, v93] of v86["entries"]()) {
        if (!v88["has"](v92)) v93["remove"]();
      }
      (this["_bindDragSort"](this["refBarEl"]),
        this["_syncBtnIconState"](),
        v26(this, v70));
    }
    ["_syncBtnIconState"]() {
      const v94 = v1["getState"]()["pickConnectMode"],
        v95 = this["refBarEl"]?.["querySelector"](".btn-icon");
      if (!v95) return;
      v94 && v94["active"] && v94["sourceNodeId"] === this["nodeId"]
        ? ((v95["style"]["opacity"] = "0"),
          (v95["style"]["transform"] = "scale(0.4)"),
          (v95["style"]["transition"] =
            "opacity 0.2s ease, transform 0.2s ease"))
        : ((v95["style"]["opacity"] = ""), (v95["style"]["transform"] = ""));
    }
    ["_bindDragSort"](v96) {
      bindRefThumbOrderDrag({
        owner: this,
        container: v96,
        store: v1,
        nodeId: this["nodeId"],
      });
    }
  }
  return v29["prototype"];
}

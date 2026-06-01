import appStore from "../core/stores/appStore.js";
import { getDisplayModelName } from "../modules/providers.js";
import {
  ensureThumbDecoded,
  revealRefThumbMedia,
} from "../modules/refThumbMediaReveal.js";
import { commit } from "../modules/history.js";
import {
  TEXT_TOOLBAR_HTML,
  bindTextToolbarEvents,
} from "./NodeToolbarConfig.js";
import {
  getPromptPresets,
  openCustomPresetsManager,
} from "../modules/promptPresets.js";
import { startLoading, stopLoading } from "../modules/loadingOverlay.js";
import { buildGenerateTextRequest, generateText } from "../../api/aiTextApi.js";
import {
  getCustomTextModels,
  saveCustomTextModels,
} from "./aigenText/customTextModels.js";
import { bindRefThumbHoverPreview } from "../modules/refThumbHoverPreview.js";
import { createReferenceFallbackThumbHtml } from "../modules/referenceThumbnailFallback.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
import {
  checkSlashTrigger,
  handleSlashKeyboardNavigation,
  closeSlashMenu,
} from "../modules/slashMenu.js";
import { activateMenuKeyboard } from "../modules/floatingMenuKeyboard.js";
import { createPromptAttachmentButtonHTML } from "./refAttachmentButton.js";
import {
  _checkAtTrigger,
  _populateMentionMenu,
  _handleMentionMenuKeyboard,
  _handlePillKeyboard,
  _rehydratePromptPills,
  _handlePillHover,
  _handlePillOut,
  _syncEdgesOrderFromPills,
  _syncPillLabels,
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  schedulePromptHtmlCommit,
} from "../modules/nodePromptShared.js";
import { createAIGenTextNodeUiModule } from "./aigenText/uiModule.js";
import { createAIGenTextNodeStateSyncModule } from "./aigenText/stateSyncModule.js";
import { createAIGenTextNodeTaskOrchestrationModule } from "./aigenText/taskOrchestrationModule.js";
const api = {
    buildGenerateTextRequest: buildGenerateTextRequest,
    generateText: generateText,
  },
  AI_GEN_TEXT_NODE_MODULE_DEPS = {
    store: appStore,
    api: api,
    getDisplayModelName: getDisplayModelName,
    ensureThumbDecoded: ensureThumbDecoded,
    revealRefThumbMedia: revealRefThumbMedia,
    commit: commit,
    TEXT_TOOLBAR_HTML: TEXT_TOOLBAR_HTML,
    bindTextToolbarEvents: bindTextToolbarEvents,
    getPromptPresets: getPromptPresets,
    openCustomPresetsManager: openCustomPresetsManager,
    startLoading: startLoading,
    stopLoading: stopLoading,
    bindRefThumbHoverPreview: bindRefThumbHoverPreview,
    checkSlashTrigger: checkSlashTrigger,
    handleSlashKeyboardNavigation: handleSlashKeyboardNavigation,
    closeSlashMenu: closeSlashMenu,
    activateMenuKeyboard: activateMenuKeyboard,
    _checkAtTrigger: _checkAtTrigger,
    _populateMentionMenu: _populateMentionMenu,
    _handleMentionMenuKeyboard: _handleMentionMenuKeyboard,
    _handlePillKeyboard: _handlePillKeyboard,
    _rehydratePromptPills: _rehydratePromptPills,
    _handlePillHover: _handlePillHover,
    _handlePillOut: _handlePillOut,
    _syncEdgesOrderFromPills: _syncEdgesOrderFromPills,
    _syncPillLabels: _syncPillLabels,
    handlePromptPaste: handlePromptPaste,
    handlePromptSelectAll: handlePromptSelectAll,
    getCustomTextModels: getCustomTextModels,
    saveCustomTextModels: saveCustomTextModels,
  };
export class AIGenTextNode {
  constructor(v0) {
    ((this["_data"] = v0),
      (this["nodeId"] = v0["id"]),
      (this["previewEl"] = null),
      (this["outputEl"] = null),
      (this["refBarEl"] = null),
      (this["promptEl"] = null),
      (this["btnEl"] = null),
      (this["modelWrap"] = null),
      (this["_dragSrcIdx"] = null),
      (this["_dragBounds"] = []),
      (this["_lastEdgeSig"] = null),
      (this["_outputScrollTop"] = Number["isFinite"](v0?.["outputScrollTop"])
        ? Math["max"](0, v0["outputScrollTop"])
        : 0),
      (this["_outputScrollTopDirty"] = false),
      (this["_outputScrollTopCommitTimer"] = null),
      (this["_lastRenderedOutputText"] = ""),
      (this["_footerControllerCleanup"] = null));
  }
  ["_checkAtTrigger"](v1) {
    return _checkAtTrigger(this, v1);
  }
  ["_populateMentionMenu"](v2, v3, v4, v5 = "", v6 = -1, v7 = null) {
    return _populateMentionMenu(this, {
      x: v2,
      y: v3,
      triggerRange: v4,
      query: v5,
      atIndex: v6,
      pillToEdit: v7,
    });
  }
  ["_handlePillKeyboard"](v8) {
    return _handlePillKeyboard(this, v8);
  }
  ["unmount"]() {
    (this["_commitOutputScrollTop"]?.(),
      this["_flushPromptHtmlCommit"]?.(),
      this["_unbindOutputTextSelection"]?.(),
      (this["_unbindOutputTextSelection"] = null),
      this["_footerControllerCleanup"]?.(),
      (this["_footerControllerCleanup"] = null));
  }
}
const aiGenTextNodeUiModule = createAIGenTextNodeUiModule(
    AI_GEN_TEXT_NODE_MODULE_DEPS,
  ),
  aiGenTextNodeStateSyncModule = createAIGenTextNodeStateSyncModule(
    AI_GEN_TEXT_NODE_MODULE_DEPS,
  ),
  aiGenTextNodeTaskOrchestrationModule =
    createAIGenTextNodeTaskOrchestrationModule(AI_GEN_TEXT_NODE_MODULE_DEPS);
function applyClassPrototypeMethods(v9, v10) {
  if (!v10) return;
  const v11 = Object["getOwnPropertyDescriptors"](v10);
  (delete v11["constructor"], Object["defineProperties"](v9, v11));
}
(applyClassPrototypeMethods(AIGenTextNode["prototype"], aiGenTextNodeUiModule),
  applyClassPrototypeMethods(
    AIGenTextNode["prototype"],
    aiGenTextNodeStateSyncModule,
  ),
  applyClassPrototypeMethods(
    AIGenTextNode["prototype"],
    aiGenTextNodeTaskOrchestrationModule,
  ));
export function _renderSharedRefBar(v12) {
  if (!v12["refBarEl"]) return;
  const v13 = appStore["getState"](),
    v14 = v13["nodes"] || {},
    v15 = appStore["getIncomingEdges"](v12["nodeId"]);
  let v16 = { text: 0, image: 0, video: 0, audio: 0 };
  const v17 = {},
    v18 = createPromptAttachmentButtonHTML();
  if (v12["_isDraggingSorting"]) {
    _syncPillLabels(v12, v17);
    return;
  }
  const v19 = (v20) => {
      return localPathToUrl(v20);
    },
    v21 = (v22) => {
      const v23 = String(v22 || "")
        ["trim"]()
        ["toLowerCase"]();
      if (!v23) return false;
      if (v23["startsWith"]("data:image/")) return true;
      return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i["test"](v23);
    },
    v24 = (v25) => {
      return (
        String(v25?.["src"] || "")["trim"]() ||
        v19(v25?.["localPath"]) ||
        String(v25?.["imageUrl"] || "")["trim"]() ||
        String(v25?.["thumbUrl"] || "")["trim"]()
      );
    },
    v26 = (v27) => {
      const v28 = Number["isFinite"](Number(v27?.["mainVideoIndex"]))
          ? Math["max"](0, Math["trunc"](Number(v27["mainVideoIndex"])))
          : 0,
        v29 = Array["isArray"](v27?.["videos"])
          ? v27["videos"][v28] || v27["videos"][0]
          : null,
        v30 = [
          String(v29?.["thumbUrl"] || "")["trim"](),
          String(v27?.["thumbUrl"] || "")["trim"](),
          String(v27?.["firstFrameUrl"] || "")["trim"](),
          String(v27?.["firstFrameThumbUrl"] || "")["trim"](),
          String(v27?.["imageUrl"] || "")["trim"](),
          String(v27?.["src"] || "")["trim"](),
          v19(v29?.["localPath"]),
          v19(v27?.["localPath"]),
          String(v29?.["videoUrl"] || "")["trim"](),
          String(v27?.["videoUrl"] || "")["trim"](),
        ]["filter"](Boolean);
      return v30["find"]((v31) => v21(v31)) || "";
    },
    v32 = (v33) => {
      const v34 = [
        String(v33?.["thumbUrl"] || "")["trim"](),
        String(v33?.["imageUrl"] || "")["trim"](),
        String(v33?.["src"] || "")["trim"](),
        v19(v33?.["localPath"]),
        String(v33?.["audioUrl"] || "")["trim"](),
      ]["filter"](Boolean);
      return v34["find"]((v35) => v21(v35)) || "";
    },
    v36 = [];
  for (const v37 of v15) {
    const v38 = v14[v37["sourceId"]];
    if (!v38) continue;
    const v39 = v38["type"] || "";
    let v40 = "";
    if (v39 === "text" || v39 === "source-text" || v39 === "ai-text")
      (v16["text"]++, (v40 = "text"));
    else {
      if (v39 === "source-image" || v39 === "ai-image")
        (v16["image"]++, (v40 = "image"));
      else {
        if (v39 === "source-video" || v39 === "video" || v39 === "ai-video")
          (v16["video"]++, (v40 = "video"));
        else
          (v39 === "source-audio" || v39 === "audio" || v39 === "ai-audio") &&
            (v16["audio"]++, (v40 = "audio"));
      }
    }
    if (v40) {
      const v41 = { text: "文本", image: "图片", video: "视频", audio: "音频" },
        v42 = "@" + (v41[v40] || v40) + v16[v40];
      v17[v37["sourceId"]] = v42;
    }
    let v43 = "";
    if (v39 === "source-image") {
      const v44 = v24(v38);
      if (v44) ensureThumbDecoded(v44);
      const v45 = !!String(v38["mask"] || "")["trim"]();
      v43 = v44
        ? "<img\x20src=\x22" +
          v44 +
          '" class="ref-thumb-media is-pending" draggable="false">' +
          (v45 ? "<span\x20class=\x22ref-thumb-mask-badge\x22>遮罩</span>" : "")
        : '<div class="ref-thumb-media ref-thumb-text"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div>';
    } else {
      if (v39 === "ai-image") {
        const v46 = v24(v38),
          v47 = !!String(v38["mask"] || "")["trim"]();
        if (v46) ensureThumbDecoded(v46);
        v43 = v46
          ? "<img\x20src=\x22" +
            v46 +
            '" class="ref-thumb-media is-pending" draggable="false">' +
            (v47 ? '<span class="ref-thumb-mask-badge">遮罩</span>' : "")
          : '<div class="ref-thumb-media ref-thumb-text"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></div>';
      } else {
        if (v39 === "source-text" || v39 === "text")
          v43 = createReferenceFallbackThumbHtml("text");
        else {
          if (v39 === "ai-text") {
            const v48 = String(
              v38["outputText"] ||
                v38["text"] ||
                v38["content"] ||
                v38["prompt"] ||
                "",
            )["trim"]();
            if (!v48) continue;
            v43 = createReferenceFallbackThumbHtml("text");
          } else {
            if (
              v39 === "source-video" ||
              v39 === "video" ||
              v39 === "ai-video"
            ) {
              const v49 = v26(v38);
              if (v49) ensureThumbDecoded(v49);
              v43 = v49
                ? '<img src="' +
                  v49 +
                  '" class="ref-thumb-media is-pending" draggable="false">'
                : '<div class="ref-thumb-media ref-thumb-text"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="4" fill="var(--bg-node-dark)" /><polygon points="8,6 19,12 8,18" fill="var(--text-secondary)" /></svg></div>';
            } else {
              if (
                v39 === "source-audio" ||
                v39 === "audio" ||
                v39 === "ai-audio"
              ) {
                const v50 = v32(v38);
                if (v50) ensureThumbDecoded(v50);
                v43 = v50
                  ? "<img\x20src=\x22" +
                    v50 +
                    "\x22\x20class=\x22ref-thumb-media\x20is-pending\x22\x20draggable=\x22false\x22>"
                  : createReferenceFallbackThumbHtml("audio");
              }
            }
          }
        }
      }
    }
    if (!v43) continue;
    const v51 = String(v38["mask"] || "")["trim"]() ? "m1" : "m0",
      v52 = Number["isFinite"](Number(v38["mainVideoIndex"]))
        ? Math["max"](0, Math["trunc"](Number(v38["mainVideoIndex"])))
        : 0,
      v53 = Array["isArray"](v38["videos"])
        ? v38["videos"][v52] || v38["videos"][0]
        : null,
      v54 =
        v39 +
        "|" +
        v37["id"] +
        "|" +
        v37["sourceId"] +
        "|" +
        (v38["src"] ||
          v38["imageUrl"] ||
          v38["thumbUrl"] ||
          v38["videoUrl"] ||
          v38["audioUrl"] ||
          "") +
        "|" +
        (v38["localPath"] || "") +
        "|" +
        (v38["thumbId"] || "") +
        "|" +
        (v53?.["thumbUrl"] || "") +
        "|" +
        (v53?.["localPath"] || "") +
        "|" +
        (v53?.["videoUrl"] || "") +
        "|" +
        v51;
    v36["push"]({
      edgeId: v37["id"],
      sourceId: v37["sourceId"],
      sig: v54,
      thumb: v43,
    });
  }
  if (v36["length"] === 0) {
    const v55 = !!v12["refBarEl"]["querySelector"](".ref-thumb-wrap"),
      v56 = !!v12["refBarEl"]["querySelector"](".ref-thumb-container");
    (v12["_lastRefHTML"] !== v18 || v55 || v56) &&
      ((v12["_lastRefHTML"] = v18),
      v12["refBarEl"]["classList"]["remove"]("active"),
      (v12["refBarEl"]["innerHTML"] = v18));
    _syncPillLabels(v12, v17);
    return;
  }
  ((v12["_lastRefHTML"] = "__has-items__"),
    v12["refBarEl"]["classList"]["add"]("active"));
  let v57 = v12["refBarEl"]["querySelector"](".prompt-attachment-btn"),
    v58 = v12["refBarEl"]["querySelector"](".ref-thumb-container");
  (!v57 || !v58) &&
    ((v12["refBarEl"]["innerHTML"] =
      v18 + ' <div class="ref-thumb-container"></div>'),
    (v57 = v12["refBarEl"]["querySelector"](".prompt-attachment-btn")),
    (v58 = v12["refBarEl"]["querySelector"](".ref-thumb-container")));
  const v59 = new Map();
  v58["querySelectorAll"](".ref-thumb-wrap")["forEach"]((v60) =>
    v59["set"](v60["dataset"]["edgeId"], v60),
  );
  const v61 = new Set();
  for (const v62 of v36) {
    let v63 = v59["get"](v62["edgeId"]);
    (!v63 &&
      ((v63 = document["createElement"]("div")),
      (v63["className"] = "ref-thumb-wrap")),
      v63["dataset"]["sig"] !== v62["sig"] &&
        ((v63["innerHTML"] =
          v62["thumb"] +
          '<button type="button" class="ref-thumb-delete" title="移除">×</button>'),
        (v63["dataset"]["sig"] = v62["sig"]),
        revealRefThumbMedia(v63, v62["sig"])),
      (v63["dataset"]["edgeId"] = v62["edgeId"]),
      (v63["dataset"]["sourceId"] = v62["sourceId"]),
      v58["appendChild"](v63),
      v61["add"](v62["edgeId"]));
  }
  for (const [v64, v65] of v59["entries"]()) {
    if (!v61["has"](v64)) v65["remove"]();
  }
  _syncPillLabels(v12, v17);
}

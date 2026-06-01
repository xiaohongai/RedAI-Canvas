import { sanitizePromptHtml } from "../../utils/dom.js";
import {
  isPreviewModeEnabled,
  syncPreviewNodeLoading,
} from "../../modules/previewMode.js";
import {
  setupPromptBoxResize,
  syncPromptBoxSizeFromData,
} from "./promptBoxResizeUi.js";
import { createNodeResizeHandle } from "./nodeResizeUi.js";
import {
  DEBUG_WRENCH_ICON_HTML,
  formatFinalApiDebugRequest,
} from "../../utils/debugRequestPreview.js";
import {
  bindNodeFooterController,
  bindNodeModelMenuTrigger,
  closeNodeFooterMenus,
} from "../shared/nodeFooterControls.js";
import {
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  schedulePromptHtmlCommit,
} from "../../modules/nodePromptShared.js";
import {
  buildTextModelSmallIconHTML,
  buildTextProviderMenuGroupsHTML,
} from "./apimartTextModelMenu.js";
import { renderMarkdownToHtml } from "./markdownRenderer.js";
import { bindReadonlyTextSelection } from "./readonlyTextSelection.js";
export function createAIGenTextNodeUiModule(v0) {
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
    } = v0,
    v29 = () =>
      typeof v1["getStateRaw"] === "function"
        ? v1["getStateRaw"]()
        : v1["getState"](),
    v30 = 120;
  class v31 {
    ["mount"]() {
      const v32 = document["createElement"]("div");
      ((v32["className"] = "aigen-node-root aigen-text-node-root"),
        (this["_root"] = v32),
        (v32["innerHTML"] = v7),
        (this["previewEl"] = document["createElement"]("div")),
        (this["previewEl"]["className"] =
          "img-node-preview\x20aigen-node-preview-fill\x20aigen-text-preview"),
        (this["outputEl"] = document["createElement"]("div")),
        (this["outputEl"]["className"] =
          "text-output-content aigen-text-output"),
        this["outputEl"]["setAttribute"]("contenteditable", "false"));
      const v33 = document["createElement"]("div");
      ((v33["className"] =
        "img-node-placeholder aigen-media-placeholder aigen-text-placeholder"),
        (v33["textContent"] = "输入提示词开始创作"),
        (this["_placeholderEl"] = v33),
        this["previewEl"]["appendChild"](this["outputEl"]),
        this["previewEl"]["appendChild"](v33),
        syncPreviewNodeLoading(
          this["nodeId"],
          this["previewEl"],
          this["_getPreviewGenerateButtonLoadingOptions"]?.(),
        ),
        (this["_unbindOutputTextSelection"] = bindReadonlyTextSelection(
          this["outputEl"],
          {
            onActivate: () => this["_enterOutputEditMode"](),
            onDeactivate: () => this["_commitOutputScrollTop"](),
          },
        )),
        this["outputEl"]["addEventListener"]("blur", () => {
          (this["outputEl"]["setAttribute"]("contenteditable", "false"),
            (this["outputEl"]["style"]["cursor"] = ""),
            this["_commitOutputScrollTop"]());
        }),
        this["outputEl"]["addEventListener"](
          "wheel",
          (v34) => {
            v34["stopPropagation"]();
          },
          { passive: false },
        ),
        this["outputEl"]["addEventListener"]("scroll", () => {
          this["_markOutputScrollTopDirty"]();
        }));
      if (this["_data"]["outputText"])
        this["_renderOutputText"](this["_data"]["outputText"]);
      ((this["outputEl"]["scrollTop"] = this["_outputScrollTop"]),
        v32["appendChild"](this["previewEl"]));
      const v35 = document["createElement"]("div");
      ((v35["className"] = "text-prompt-panel"),
        (this["_promptPanel"] = v35),
        v35["addEventListener"]("pointerdown", (v36) => {
          v36["stopPropagation"]();
        }),
        v35["addEventListener"]("dblclick", (v37) => {
          !v37["target"]["closest"](".prompt-textarea") &&
            !v37["target"]["closest"](".text-output-content") &&
            (v37["preventDefault"](), v37["stopPropagation"]());
        }),
        (this["refBarEl"] = document["createElement"]("div")),
        (this["refBarEl"]["className"] = "node-ref-bar"),
        v35["appendChild"](this["refBarEl"]),
        this["refBarEl"]["addEventListener"]("click", (v38) => {
          const v39 = v38["target"]["closest"](".ref-thumb-delete");
          if (v39) {
            (v38["stopPropagation"](), v38["preventDefault"]());
            const v40 =
              v39["closest"](".ref-thumb-wrap")?.["dataset"]["edgeId"];
            if (v40) v1["removeEdge"](v40);
            return;
          }
          const v41 = v38["target"]["closest"](".prompt-attachment-btn");
          if (!v41) return;
          if (v38["_pickConnectHandled"]) return;
          (v38["stopPropagation"](), v38["preventDefault"]());
          const v42 = v1["getState"]()["pickConnectMode"];
          v42 && v42["active"] && v42["sourceNodeId"] === this["nodeId"]
            ? v1["setPickConnectMode"]({ active: false })
            : v1["setPickConnectMode"]({
                active: true,
                sourceNodeId: this["nodeId"],
                handleDirection: "left",
              });
        }),
        this["refBarEl"]["addEventListener"]("pointerdown", (v43) => {
          if (
            v43["target"]["closest"](
              ".prompt-attachment-btn, .ref-thumb-delete",
            )
          )
            v43["stopPropagation"]();
        }),
        (this["_unbindRefThumbHoverPreview"] = v13(this["refBarEl"])));
      const v44 = document["createElement"]("div");
      ((v44["className"] = "prompt-input-wrapper"),
        v44["classList"]["add"]("is-resizable"),
        (this["_promptInputWrap"] = v44),
        (this["promptEl"] = document["createElement"]("div")),
        (this["promptEl"]["className"] = "prompt-textarea\x20custom-textarea"),
        (this["promptEl"]["contentEditable"] = "true"),
        (this["promptEl"]["spellcheck"] = false),
        (this["promptEl"]["dataset"]["placeholder"] =
          "输入提示词开始创作   (Enter 生成，Shift+Enter 换行)"));
      if (!document["head"]["querySelector"]("#v2-gen-node-css")) {
        const v45 = document["createElement"]("style");
        ((v45["id"] = "v2-gen-node-css"),
          (v45["textContent"] =
            "\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.prompt-textarea:empty::before\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20content:\x20attr(data-placeholder);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20var(--text-placeholder);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20pointer-events:\x20none;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.ref-pill\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20inline-flex;\x20align-items:\x20center;\x20gap:\x203px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20transparent;\x20border:\x20none;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x204px;\x20padding:\x201px\x206px;\x20font-size:\x2014px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20var(--text-secondary);\x20cursor:\x20var(--pointer-cursor);\x20user-select:\x20text;\x20-webkit-user-select:\x20text;\x20font-weight:\x20500;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20vertical-align:\x20middle;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.ref-pill\x20.pill-del\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2016px;\x20color:\x20var(--text-muted);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20cursor:\x20var(--link-cursor);\x20margin-left:\x202px;\x20line-height:\x201;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.ref-pill\x20.pill-del:hover\x20{\x20color:\x20var(--red);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.ref-thumb-wrap.dragging\x20{\x20opacity:\x200.3;\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x20flex-direction:\x20column;\x20justify-content:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2010px\x2012px;\x20border-radius:\x2012px;\x20cursor:\x20var(--link-cursor);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20transparent;\x20border:\x20none;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transition:\x20all\x200.2s;\x20position:\x20relative;\x20height:\x2054px;\x20overflow:\x20hidden;\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item:hover,\x20.v2-slash-item.active\x20{\x20background:\x20var(--white-05);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-title\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20var(--text-primary);\x20font-size:\x2013px;\x20font-weight:\x20600;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transition:\x20transform\x200.25s\x20cubic-bezier(0.34,\x201.56,\x200.64,\x201);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transform:\x20translateY(10px);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-desc\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20var(--text-muted);\x20font-size:\x2011px;\x20white-space:\x20nowrap;\x20overflow:\x20hidden;\x20text-overflow:\x20ellipsis;\x20font-family:\x20monospace;\x20margin-top:\x204px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transition:\x20transform\x200.25s\x20cubic-bezier(0.34,\x201.56,\x200.64,\x201),\x20opacity\x200.2s;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transform:\x20translateY(16px);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20opacity:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item:hover\x20>\x20.v2-slash-title,\x20.v2-slash-item.active\x20>\x20.v2-slash-title,\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item:hover\x20>\x20.v2-slash-desc,\x20.v2-slash-item.active\x20>\x20.v2-slash-desc\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20transform:\x20translateY(0);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.v2-slash-item:hover\x20>\x20.v2-slash-desc,\x20.v2-slash-item.active\x20>\x20.v2-slash-desc\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20opacity:\x201;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20"),
          document["head"]["appendChild"](v45));
      }
      ((this["_flushPromptHtmlCommit"] = () => flushPromptHtmlCommit(this)),
        this["promptEl"]["addEventListener"]("input", (v46) => {
          (schedulePromptHtmlCommit(this),
            this["_checkAtTrigger"](v46),
            v14(v46, {
              promptEl: this["promptEl"],
              nodeType: this["_data"]["type"],
              nodeId: this["nodeId"],
              onGenerate: (v47, v48) => this["_onGenerate"](v47, v48),
            }),
            v25(this),
            this["_updateSubmitButtonState"]());
        }),
        this["promptEl"]["addEventListener"]("blur", () => {
          flushPromptHtmlCommit(this);
        }),
        this["promptEl"]["addEventListener"]("mouseover", (v49) =>
          v23(v49, this),
        ),
        this["promptEl"]["addEventListener"]("mouseout", (v50) =>
          v24(v50, this),
        ),
        this["promptEl"]["addEventListener"]("keydown", (v51) => {
          if (handlePromptSelectAll(this, v51)) return;
          if (v20(v51)) return;
          if (v15(v51)) return;
          if (v51["key"] === "Enter" && !v51["shiftKey"]) {
            (v51["preventDefault"](),
              flushPromptHtmlCommit(this),
              this["btnEl"]?.["click"]());
            return;
          }
          v21(this, v51);
        }),
        this["promptEl"]["addEventListener"]("paste", (v52) => {
          handlePromptPaste(this, v52);
        }));
      this["_data"]["prompt"] &&
        ((this["promptEl"]["innerHTML"] = sanitizePromptHtml(
          this["_data"]["prompt"],
        )),
        v22(this));
      (v44["appendChild"](this["promptEl"]),
        this["_syncPromptBoxSizeFromData"](this["_data"]),
        this["_setupPromptBoxResize"](),
        v35["appendChild"](v44));
      const v53 = document["createElement"]("div");
      v53["className"] = "prompt-panel-footer";
      const v54 = String(this["_data"]["provider"] || "")
          ["trim"]()
          ["toLowerCase"](),
        v55 = this["_data"]["model"] || "apimart/kimi-k2-instruct",
        v56 = () => {
          const v57 = buildTextModelSmallIconHTML(v55);
          if (v57) return v57;
          if (v54 === "custom" || v54 === "openai")
            return "<div\x20class=\x22text-model-icon-small\x20text-model-icon-badge\x22>OA</div>";
          return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        },
        v58 = buildTextProviderMenuGroupsHTML(v55);
      ((v53["innerHTML"] =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap">\n              <button type="button" class="img-pill-btn img-model-btn-trigger">\n                ' +
        v56() +
        '\n                <span class="img-model-label">' +
        v3(v55) +
        '</span>\n                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-menu-caret"><polyline points="6 9 12 15 18 9"></polyline></svg>\n              </button>\n              <div class="floating-menu img-model-menu node-model-menu">\n                <div class="custom-group-header floating-menu-item node-menu-group-header" data-custom-toggle data-node-menu-submenu=".custom-submenu">\n                  <div class="text-model-icon text-model-icon-badge">OA</div>\n                  <div class="fmi-content">\n                    <div class="fmi-title">自定义模型</div>\n                    <div class="fmi-sub">OpenAI 兼容文本/图文接口</div>\n                  </div>\n                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="node-menu-caret"><polyline points="9 18 15 12 9 6"></polyline></svg>\n                </div>\n                <div class="custom-submenu node-model-submenu node-menu-submenu"></div>\n                ' +
        v58 +
        '\n              </div>\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <button type="button" class="prompt-submit debug-wrench-btn" title="调试 API 参数">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n            <button type="button" class="prompt-submit img-gen-btn" title="生成">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>'),
        (this["modelWrap"] = v53["querySelector"](".img-model-wrap")),
        (this["btnEl"] = v53["querySelector"](".img-gen-btn")));
      const v59 = v53["querySelector"](".debug-wrench-btn"),
        v60 = v53["querySelector"](".img-model-btn-trigger"),
        v61 = v53["querySelector"](".img-model-menu"),
        v62 = v53["querySelector"](".img-model-label"),
        v63 = v61?.["querySelector"](".grsai-submenu"),
        v64 = v61?.["querySelector"](".ppio-submenu"),
        v65 = v61?.["querySelector"](".apimart-submenu"),
        v66 = v61?.["querySelector"](".runninghub-submenu"),
        v67 = v61?.["querySelector"](".volcengine-submenu"),
        v68a = v61?.["querySelector"](".nvidia-submenu"),
        v68 = Object["freeze"]({
          grsai: v63,
          ppio: v64,
          apimart: v65,
          runninghub: v66,
          volcengine: v67,
          nvidia: v68a,
        }),
        v69 = (v70) => {
          const v71 = v70?.["querySelector"]("img, svg, div"),
            v72 = v60?.["firstElementChild"];
          if (!v72 || !v71 || v71["classList"]["contains"]("fmi-content"))
            return;
          const v73 = v71["cloneNode"](true);
          (v73["removeAttribute"]?.("style"),
            v73["classList"]?.["remove"]("text-model-icon", "node-menu-icon"),
            v73["classList"]?.["add"]("text-model-icon-small"),
            v73["tagName"]?.["toLowerCase"]() === "svg" &&
              (v73["setAttribute"]("width", "12"),
              v73["setAttribute"]("height", "12"),
              v73["classList"]["add"]("node-menu-icon-small")),
            v72["replaceWith"](v73));
        },
        v74 = (v75, v76, v77) => {
          const v78 = v75?.["dataset"]?.["value"];
          if (!v78) return;
          const v79 = v75["dataset"]["provider"] || v76,
            v80 =
              v75["querySelector"](".fmi-title") ||
              v75["querySelector"](".floating-menu-label");
          ((v62["textContent"] = v80 ? v80["textContent"] : v78),
            v61["querySelectorAll"](".floating-menu-item")["forEach"]((v81) =>
              v81["classList"]["remove"]("active"),
            ),
            v75["classList"]["add"]("active"),
            v61["classList"]["remove"]("show"));
          if (v77) v77["style"]["display"] = "none";
          (v1["updateNodeData"](this["nodeId"], { model: v78, provider: v79 }),
            v69(v75));
        };
      (v61?.["addEventListener"]("click", (v82) => {
        const v83 = v82["target"]?.["closest"]?.(".floating-menu-item");
        if (!v83 || !v61["contains"](v83)) return;
        const v84 = Object["entries"](v68),
          v85 = v84["find"](([, v86]) => v86?.["contains"](v83));
        if (!v85) return;
        (v82["stopPropagation"](), v74(v83, v85[0], v85[1]));
      }),
        v59?.["addEventListener"]("click", async (v87) => {
          (v87["stopPropagation"](), flushPromptHtmlCommit(this));
          let v88;
          if (typeof this["_buildPayload"] === "function")
            v88 = await this["_buildPayload"]();
          else {
            const v89 = this["promptEl"]?.["innerText"]?.["trim"]() || "";
            v88 = { prompt: v89, nodeType: this["_data"]["type"] };
          }
          if (!v88) return;
          try {
            const v90 = await v2["buildGenerateTextRequest"](v88),
              v91 = formatFinalApiDebugRequest(v90),
              v92 = v1["getState"](),
              v93 = this["_data"]["x"] + (this["_data"]["width"] || 380) + 50,
              v94 = this["_data"]["y"];
            let v95 = Object["values"](v92["nodes"])["find"](
              (v96) => v96["type"] === "debug",
            );
            if (!v95) {
              const v97 = "debug-" + Date["now"]();
              v1["addNode"]({
                id: v97,
                type: "debug",
                x: v93,
                y: v94,
                width: 350,
                height: 260,
                name: "调试节点",
                outputText: v91,
              });
            } else
              v1["updateNodeData"](v95["id"], {
                outputText: v91,
                x: v93,
                y: v94,
              });
            window["showToast"]?.("🔧 已展示最终 API 请求（未发送）", "warn");
          } catch (v98) {
            window["showToast"]?.("构造请求失败: " + v98["message"], "error");
          }
        }),
        this["_footerControllerCleanup"]?.(),
        (this["_footerControllerCleanup"] = bindNodeFooterController(v53)),
        bindNodeModelMenuTrigger({
          root: v53,
          trigger: v60,
          menu: v61,
          closeOthers: () => closeNodeFooterMenus(v53, v61),
          activateMenuKeyboard: v17,
        }));
      const v99 = v61["querySelector"]("[data-custom-toggle]"),
        v100 = v61["querySelector"](".custom-submenu");
      let v101 = null;
      const v102 = () => {
          clearTimeout(v101);
          if (v100) v100["style"]["display"] = "flex";
        },
        v103 = (v104 = 120) => {
          v101 = setTimeout(() => {
            if (v100 && v100["querySelector"]("input:focus")) return;
            if (v100) v100["style"]["display"] = "none";
          }, v104);
        };
      v99 &&
        (v99["addEventListener"]("mouseenter", v102),
        v99["addEventListener"]("mouseleave", () => v103()));
      v100 &&
        (v100["addEventListener"]("mouseenter", v102),
        v100["addEventListener"]("mouseleave", () => v103()),
        v100["addEventListener"]("click", (v105) => v105["stopPropagation"]()),
        v100["addEventListener"]("pointerdown", (v106) =>
          v106["stopPropagation"](),
        ));
      const v107 = () => {
        if (!v100) return;
        const v108 = v27(),
          v109 = this["_data"]["model"] || "";
        ((v100["innerHTML"] = ""),
          v108["forEach"]((v110, v111) => {
            const v112 = document["createElement"]("div");
            ((v112["className"] =
              "floating-menu-item\x20custom-model-item" +
              (v109 === v110 ? " active" : "")),
              (v112["dataset"]["value"] = v110),
              (v112["innerHTML"] =
                '\n                    <div class="text-model-icon text-model-icon-badge custom-model-icon">OA</div>\n                    <span class="custom-model-label">' +
                v110 +
                '</span>\n                    <span class="custom-model-del">×</span>\n                '));
            const v113 = v112["querySelector"](".custom-model-del");
            (v112["addEventListener"]("mouseenter", () => {
              if (v113) v113["classList"]["add"]("show");
            }),
              v112["addEventListener"]("mouseleave", () => {
                if (v113) v113["classList"]["remove"]("show");
              }),
              v112["addEventListener"]("click", (v114) => {
                if (v114["target"]["closest"](".custom-model-del")) return;
                ((v62["textContent"] = v110),
                  v61["querySelectorAll"](".floating-menu-item")["forEach"](
                    (v115) => v115["classList"]["remove"]("active"),
                  ),
                  v63?.["querySelectorAll"](".floating-menu-item")["forEach"](
                    (v116) => v116["classList"]["remove"]("active"),
                  ),
                  v64?.["querySelectorAll"](".floating-menu-item")["forEach"](
                    (v117) => v117["classList"]["remove"]("active"),
                  ),
                  v100["querySelectorAll"](".floating-menu-item")["forEach"](
                    (v118) => v118["classList"]["remove"]("active"),
                  ),
                  v112["classList"]["add"]("active"),
                  v61["classList"]["remove"]("show"),
                  (v100["style"]["display"] = "none"),
                  v1["updateNodeData"](this["nodeId"], {
                    model: v110,
                    provider: "custom",
                  }));
                const v119 = v60["firstElementChild"];
                if (v119) {
                  const v120 = document["createElementNS"](
                    "http://www.w3.org/2000/svg",
                    "svg",
                  );
                  (v120["setAttribute"]("width", "12"),
                    v120["setAttribute"]("height", "12"),
                    v120["setAttribute"]("viewBox", "0 0 24 24"),
                    v120["setAttribute"]("fill", "none"),
                    v120["setAttribute"]("stroke", "currentColor"),
                    v120["setAttribute"]("stroke-width", "2"),
                    (v120["innerHTML"] =
                      '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>'),
                    v119["replaceWith"](v120));
                }
              }),
              v113?.["addEventListener"]("click", (v121) => {
                v121["stopPropagation"]();
                const v122 = v27()["filter"]((v123, v124) => v124 !== v111);
                (v28(v122), v107());
              }),
              v100["appendChild"](v112));
          }));
        if (v108["length"] > 0) {
          const v125 = document["createElement"]("div");
          ((v125["className"] = "custom-model-separator"),
            v100["appendChild"](v125));
        }
        const v126 = document["createElement"]("div");
        ((v126["className"] = "floating-menu-item custom-model-add"),
          (v126["innerHTML"] =
            '\n                <svg class="custom-model-add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\n                <span class="custom-model-add-label">添加模型</span>\n            '),
          v126["addEventListener"]("click", (v127) => {
            (v127["stopPropagation"](),
              (v126["innerHTML"] = ""),
              v126["classList"]["add"]("editing"));
            const v128 = document["createElement"]("input");
            ((v128["type"] = "text"),
              (v128["placeholder"] = "输入模型名称"),
              (v128["className"] = "custom-model-input"));
            const v129 = document["createElement"]("button");
            ((v129["type"] = "button"),
              (v129["textContent"] = "确定"),
              (v129["className"] = "custom-model-confirm"));
            const v130 = () => {
              const v131 = v128["value"]["trim"]();
              if (!v131) return;
              const v132 = v27();
              (!v132["includes"](v131) && (v132["push"](v131), v28(v132)),
                v107());
            };
            (v128["addEventListener"]("keydown", (v133) => {
              v133["stopPropagation"]();
              if (v133["key"] === "Enter") v130();
            }),
              v128["addEventListener"]("keyup", (v134) =>
                v134["stopPropagation"](),
              ),
              v128["addEventListener"]("keypress", (v135) =>
                v135["stopPropagation"](),
              ),
              v128["addEventListener"]("click", (v136) =>
                v136["stopPropagation"](),
              ),
              v129["addEventListener"]("click", (v137) => {
                (v137["stopPropagation"](), v130());
              }),
              v126["appendChild"](v128),
              v126["appendChild"](v129),
              v128["focus"]());
          }),
          v100["appendChild"](v126));
      };
      (v107(),
        this["btnEl"]["addEventListener"]("click", () => {
          (flushPromptHtmlCommit(this), this["_onGenerate"]());
        }),
        v35["appendChild"](v53),
        v32["appendChild"](v35),
        this["_renderRefBar"]());
      const v138 = v32["querySelector"](".node-floating-toolbar");
      v8(v138, this["_data"], () => this["_getOutputRawText"]?.() || "");
      const v139 = createNodeResizeHandle(this, {
        store: v1,
        getStateSnapshot: v29,
        commit: v6,
      });
      return (
        v32["appendChild"](v139),
        this["_updateSubmitButtonState"](),
        v32
      );
    }
    ["_enterOutputEditMode"]() {
      this["outputEl"] &&
        this["outputEl"]["setAttribute"]("contenteditable", "false");
      this["_commitOutputScrollTop"]();
      const v140 = v1["getState"]()["selectedNodeIds"];
      if (!v140["includes"](this["nodeId"]))
        v1["setSelectedNodes"]([this["nodeId"]]);
    }
    ["_captureOutputScrollTop"]() {
      return (
        (this["_outputScrollTop"] = Math["max"](
          0,
          Number(this["outputEl"]?.["scrollTop"] || 0),
        )),
        this["_outputScrollTop"]
      );
    }
    ["_markOutputScrollTopDirty"]() {
      (this["_captureOutputScrollTop"](),
        (this["_outputScrollTopDirty"] = true),
        this["_scheduleOutputScrollTopCommit"]());
    }
    ["_scheduleOutputScrollTopCommit"]() {
      (this["_outputScrollTopCommitTimer"] &&
        clearTimeout(this["_outputScrollTopCommitTimer"]),
        (this["_outputScrollTopCommitTimer"] = setTimeout(() => {
          ((this["_outputScrollTopCommitTimer"] = null),
            this["_commitOutputScrollTop"]());
        }, v30)));
    }
    ["_commitOutputScrollTop"]() {
      if (!this["outputEl"] || !this["nodeId"]) return 0;
      this["_outputScrollTopCommitTimer"] &&
        (clearTimeout(this["_outputScrollTopCommitTimer"]),
        (this["_outputScrollTopCommitTimer"] = null));
      const v141 = this["_captureOutputScrollTop"]();
      this["_outputScrollTopDirty"] = false;
      const v142 =
        typeof v1["getStateRaw"] === "function"
          ? v1["getStateRaw"]()?.["nodes"]?.[this["nodeId"]]
          : v1["getState"]?.()?.["nodes"]?.[this["nodeId"]];
      if (Number(v142?.["outputScrollTop"]) === v141) return v141;
      return (
        typeof v1["updateNodeData"] === "function" &&
          v1["updateNodeData"](this["nodeId"], { outputScrollTop: v141 }),
        v141
      );
    }
    ["_getOutputRawText"](v143 = this["_data"]) {
      const v144 = typeof this["nodeId"] === "string" ? this["nodeId"] : "",
        v145 =
          v144 && typeof v1["getStateRaw"] === "function"
            ? v1["getStateRaw"]()?.["nodes"]?.[v144]
            : null;
      return String(v145?.["outputText"] ?? v143?.["outputText"] ?? "");
    }
    ["_renderOutputText"](v146 = this["_getOutputRawText"]()) {
      if (!this["outputEl"]) return;
      const v147 = String(v146 ?? "");
      this["_lastRenderedOutputText"] = v147;
      if (!v147) {
        (this["outputEl"]["replaceChildren"](),
          (this["outputEl"]["style"]["display"] = "none"));
        if (this["_placeholderEl"])
          this["_placeholderEl"]["style"]["display"] = "flex";
        return;
      }
      ((this["outputEl"]["innerHTML"] = renderMarkdownToHtml(v147)),
        (this["outputEl"]["style"]["display"] = "block"));
      if (this["_placeholderEl"])
        this["_placeholderEl"]["style"]["display"] = "none";
    }
    ["_handlePreviewDblclick"](v148) {
      if (!isPreviewModeEnabled()) return;
      v148?.["stopPropagation"]?.();
    }
    ["_syncPromptBoxSizeFromData"](v149 = this["_data"]) {
      syncPromptBoxSizeFromData(this, v149);
    }
    ["_setupPromptBoxResize"]() {
      setupPromptBoxResize(this, { store: v1, getStateSnapshot: v29 });
    }
  }
  return v31["prototype"];
}

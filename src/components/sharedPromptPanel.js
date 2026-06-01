import { buildGenerateTextRequest } from "../../api/aiTextApi.js";
import appStore from "../core/stores/appStore.js";
import { getDisplayModelName } from "../modules/providers.js";
import { bindRefThumbHoverPreview } from "../modules/refThumbHoverPreview.js";
import {
  checkSlashTrigger,
  handleSlashKeyboardNavigation,
} from "../modules/slashMenu.js";
import { activateMenuKeyboard } from "../modules/floatingMenuKeyboard.js";
import {
  _checkAtTrigger,
  _handleMentionMenuKeyboard,
  _handlePillHover,
  _handlePillKeyboard,
  _handlePillOut,
  _rehydratePromptPills,
  _syncEdgesOrderFromPills,
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  schedulePromptHtmlCommit,
} from "../modules/nodePromptShared.js";
import { sanitizePromptHtml } from "../utils/dom.js";
import {
  DEBUG_WRENCH_ICON_HTML,
  formatFinalApiDebugRequest,
} from "../utils/debugRequestPreview.js";
import {
  buildTextModelSmallIconHTML,
  buildTextProviderMenuGroupsHTML,
} from "./aigenText/apimartTextModelMenu.js";
import {
  getCustomTextModels,
  saveCustomTextModels,
} from "./aigenText/customTextModels.js";
import {
  setupPromptBoxResize,
  syncPromptBoxSizeFromData,
} from "./aigenText/promptBoxResizeUi.js";
import { createPromptAttachmentButtonHTML } from "./refAttachmentButton.js";
import {
  bindNodeFooterController,
  bindNodeModelMenuTrigger,
  closeNodeFooterMenus,
} from "./shared/nodeFooterControls.js";
export function buildSharedPromptPanel(v0, v1 = {}) {
  const v2 = document["createElement"]("div");
  ((v2["className"] = "text-prompt-panel"), (v0["_promptPanel"] = v2));
  const v3 = () =>
    typeof appStore["getStateRaw"] === "function"
      ? appStore["getStateRaw"]()
      : appStore["getState"]();
  (v2["addEventListener"]("pointerdown", (v4) => {
    v4["stopPropagation"]();
  }),
    v2["addEventListener"]("dblclick", (v5) => {
      !v5["target"]["closest"](".prompt-textarea") &&
        (v5["preventDefault"](), v5["stopPropagation"]());
    }),
    (v0["refBarEl"] = document["createElement"]("div")),
    (v0["refBarEl"]["className"] = "node-ref-bar"),
    v2["appendChild"](v0["refBarEl"]),
    v0["refBarEl"]["addEventListener"]("click", (v6) => {
      const v7 = v6["target"]["closest"](".ref-thumb-delete");
      if (v7) {
        (v6["stopPropagation"](), v6["preventDefault"]());
        const v8 = v7["closest"](".ref-thumb-wrap")?.["dataset"]["edgeId"];
        if (v8) appStore["removeEdge"](v8);
        return;
      }
      const v9 = v6["target"]["closest"](".prompt-attachment-btn");
      if (!v9) return;
      if (v6["_pickConnectHandled"]) return;
      (v6["stopPropagation"](), v6["preventDefault"]());
      const v10 = appStore["getState"]()["pickConnectMode"];
      v10 && v10["active"] && v10["sourceNodeId"] === v0["nodeId"]
        ? appStore["setPickConnectMode"]({ active: false })
        : appStore["setPickConnectMode"]({
            active: true,
            sourceNodeId: v0["nodeId"],
            handleDirection: "left",
          });
    }),
    v0["refBarEl"]["addEventListener"]("pointerdown", (v11) => {
      if (
        v11["target"]["closest"](".prompt-attachment-btn,\x20.ref-thumb-delete")
      )
        v11["stopPropagation"]();
    }),
    v0["_unbindRefThumbHoverPreview"]?.(),
    (v0["_unbindRefThumbHoverPreview"] = bindRefThumbHoverPreview(
      v0["refBarEl"],
    )));
  const v12 = document["createElement"]("div");
  ((v12["className"] = "prompt-input-wrapper"),
    v12["classList"]["add"]("is-resizable"),
    (v0["_promptInputWrap"] = v12),
    (v0["promptEl"] = document["createElement"]("div")),
    (v0["promptEl"]["className"] = "prompt-textarea custom-textarea"),
    (v0["promptEl"]["contentEditable"] = "true"),
    (v0["promptEl"]["spellcheck"] = false),
    (v0["promptEl"]["dataset"]["placeholder"] =
      v1["placeholder"] || "输入提示词..."),
    (v0["_flushPromptHtmlCommit"] = () => flushPromptHtmlCommit(v0)),
    v0["promptEl"]["addEventListener"]("input", (v13) => {
      (schedulePromptHtmlCommit(v0),
        _checkAtTrigger(v0, v13),
        checkSlashTrigger(v13, {
          promptEl: v0["promptEl"],
          nodeType: v0["_data"]?.["type"],
          nodeId: v0["nodeId"],
          onGenerate: (v14, v15) => v0["_onGenerate"]?.(v14, v15),
        }),
        _syncEdgesOrderFromPills(v0),
        v0["_updateSubmitButtonState"]?.());
    }),
    v0["promptEl"]["addEventListener"]("blur", () => {
      flushPromptHtmlCommit(v0);
    }),
    v0["promptEl"]["addEventListener"]("mouseover", (v16) =>
      _handlePillHover(v16, v0),
    ),
    v0["promptEl"]["addEventListener"]("mouseout", (v17) =>
      _handlePillOut(v17, v0),
    ),
    v0["promptEl"]["addEventListener"]("keydown", (v18) => {
      if (handlePromptSelectAll(v0, v18)) return;
      if (_handleMentionMenuKeyboard(v18)) return;
      if (handleSlashKeyboardNavigation(v18)) return;
      if (v18["key"] === "Enter" && !v18["shiftKey"]) {
        (v18["preventDefault"](),
          flushPromptHtmlCommit(v0),
          v0["btnEl"]?.["click"]());
        return;
      }
      _handlePillKeyboard(v0, v18);
    }),
    v0["promptEl"]["addEventListener"]("paste", (v19) => {
      handlePromptPaste(v0, v19);
    }));
  v0["_data"]["prompt"] &&
    ((v0["promptEl"]["innerHTML"] = sanitizePromptHtml(v0["_data"]["prompt"])),
    _rehydratePromptPills(v0));
  (v12["appendChild"](v0["promptEl"]),
    (v0["_syncPromptBoxSizeFromData"] = (v20 = v0["_data"]) =>
      syncPromptBoxSizeFromData(v0, v20)),
    v0["_syncPromptBoxSizeFromData"](v0["_data"]),
    setupPromptBoxResize(v0, { store: appStore, getStateSnapshot: v3 }),
    v2["appendChild"](v12));
  const v21 = document["createElement"]("div");
  v21["className"] = "prompt-panel-footer text-prompt-actions";
  const v22 = [];
  if (v1?.["modelMenu"]) {
    const v23 = v1["modelMenu"],
      v24 = String(v23["provider"] || "volcengine")["trim"](),
      v25 = Array["isArray"](v23["providers"])
        ? v23["providers"]["map"]((v26) => String(v26)["toLowerCase"]())
        : null,
      v27 = v23["allowCustomModels"] !== false,
      v28 = String(
        v23["model"] ||
          v0["_data"]?.["model"] ||
          v0["_data"]?.["storyboardScript"]?.["model"] ||
          v23["defaultModel"] ||
          "",
      )["trim"](),
      v29 = () => {
        const v30 = buildTextModelSmallIconHTML(v28);
        if (v30) return v30;
        if (v24 === "custom" || v24 === "openai")
          return '<div class="text-model-icon-small text-model-icon-badge">OA</div>';
        return '<div class="text-model-icon-small text-model-icon-badge">AI</div>';
      },
      v31 = document["createElement"]("div");
    ((v31["className"] = "img-model-pills"),
      (v31["innerHTML"] =
        '\n      <div class="img-model-wrap">\n        <button type="button" class="img-pill-btn img-model-btn-trigger">\n          ' +
        v29() +
        '\n          <span class="img-model-label">' +
        getDisplayModelName(v28) +
        '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-menu-caret"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="floating-menu img-model-menu node-model-menu">\n          ' +
        (v27
          ? '<div class="custom-group-header floating-menu-item node-menu-group-header" data-custom-toggle data-node-menu-submenu=".custom-submenu">\n            <div class="text-model-icon text-model-icon-badge">OA</div>\n            <div class="fmi-content">\n              <div class="fmi-title">自定义模型</div>\n              <div class="fmi-sub">OpenAI 兼容文本接口</div>\n            </div>\n            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="node-menu-caret"><polyline points="9 18 15 12 9 6"></polyline></svg>\n          </div>\n          <div class="custom-submenu node-model-submenu node-menu-submenu"></div>'
          : "") +
        "\n          " +
        buildTextProviderMenuGroupsHTML(v28, { providers: v25 }) +
        "\n        </div>\n      </div>"),
      v21["appendChild"](v31));
    const v32 = v31["querySelector"](".img-model-wrap"),
      v33 = v31["querySelector"](".img-model-btn-trigger"),
      v34 = v31["querySelector"](".img-model-menu"),
      v35 = v31["querySelector"](".img-model-label"),
      v36 = Object["freeze"]({
        grsai: v34?.["querySelector"](".grsai-submenu"),
        ppio: v34?.["querySelector"](".ppio-submenu"),
        apimart: v34?.["querySelector"](".apimart-submenu"),
        runninghub: v34?.["querySelector"](".runninghub-submenu"),
        volcengine: v34?.["querySelector"](".volcengine-submenu"),
        nvidia: v34?.["querySelector"](".nvidia-submenu"),
      }),
      v37 = (v38) => {
        const v39 = v38?.["querySelector"]("img,\x20svg,\x20div"),
          v40 = v33?.["firstElementChild"];
        if (!v40 || !v39 || v39["classList"]?.["contains"]("fmi-content"))
          return;
        const v41 = v39["cloneNode"](true);
        (v41["removeAttribute"]?.("style"),
          v41["classList"]?.["remove"]("text-model-icon", "node-menu-icon"),
          v41["classList"]?.["add"]("text-model-icon-small"),
          v41["tagName"]?.["toLowerCase"]() === "svg" &&
            (v41["setAttribute"]("width", "12"),
            v41["setAttribute"]("height", "12"),
            v41["classList"]["add"]("node-menu-icon-small")),
          v40["replaceWith"](v41));
      },
      v42 = (v43, v44, v45) => {
        const v46 = String(v43?.["dataset"]?.["value"] || "")["trim"]();
        if (!v46) return;
        const v47 = String(v43["dataset"]["provider"] || v44 || v24)["trim"](),
          v48 =
            v43["querySelector"](".fmi-title") ||
            v43["querySelector"](".floating-menu-label") ||
            v43["querySelector"](".custom-model-label");
        if (v35) v35["textContent"] = v48?.["textContent"] || v46;
        (v34?.["querySelectorAll"](".floating-menu-item")["forEach"]((v49) =>
          v49["classList"]["remove"]("active"),
        ),
          v43["classList"]["add"]("active"),
          v34?.["classList"]["remove"]("show"));
        if (v45) v45["style"]["display"] = "none";
        (v37(v43),
          typeof v23["onSelect"] === "function"
            ? v23["onSelect"]({
                modelId: v46,
                provider: v47,
                item: v43,
                self: v0,
              })
            : appStore["updateNodeData"](v0["nodeId"], {
                model: v46,
                provider: v47,
              }));
      };
    v34?.["addEventListener"]("click", (v50) => {
      const v51 = v50["target"]?.["closest"]?.(".floating-menu-item");
      if (!v51 || !v34["contains"](v51)) return;
      if (!v51["dataset"]["value"]) return;
      const v52 = Object["entries"](v36)["find"](([, v53]) =>
        v53?.["contains"](v51),
      );
      if (v52) {
        (v50["stopPropagation"](), v42(v51, v52[0], v52[1]));
        return;
      }
      if (!v27) return;
      const v54 = v34["querySelector"](".custom-submenu");
      v54?.["contains"](v51) &&
        (v50["stopPropagation"](), v42(v51, "custom", v54));
    });
    const v55 = v34?.["querySelector"](".custom-submenu");
    v27 &&
      v55?.["addEventListener"]("pointerdown", (v56) => {
        v56["stopPropagation"]();
      });
    const v57 = () => {
      if (!v27 || !v55) return;
      const v58 = getCustomTextModels(),
        v59 = String(
          v0["_data"]?.["model"] ||
            v0["_data"]?.["storyboardScript"]?.["model"] ||
            "",
        )["trim"]();
      (v55["replaceChildren"](),
        v58["forEach"]((v60, v61) => {
          const v62 = document["createElement"]("div");
          ((v62["className"] =
            "floating-menu-item custom-model-item" +
            (v59 === v60 ? " active" : "")),
            (v62["dataset"]["value"] = v60));
          const v63 = document["createElement"]("div");
          ((v63["className"] =
            "text-model-icon text-model-icon-badge custom-model-icon"),
            (v63["textContent"] = "OA"));
          const v64 = document["createElement"]("span");
          ((v64["className"] = "custom-model-label"),
            (v64["textContent"] = v60));
          const v65 = document["createElement"]("span");
          ((v65["className"] = "custom-model-del"),
            (v65["textContent"] = "×"),
            v62["appendChild"](v63),
            v62["appendChild"](v64),
            v62["appendChild"](v65),
            v62["addEventListener"]("mouseenter", () => {
              v65["classList"]["add"]("show");
            }),
            v62["addEventListener"]("mouseleave", () => {
              v65["classList"]["remove"]("show");
            }),
            v65["addEventListener"]("click", (v66) => {
              (v66["stopPropagation"](),
                saveCustomTextModels(
                  getCustomTextModels()["filter"]((v67, v68) => v68 !== v61),
                ),
                v57());
            }),
            v55["appendChild"](v62));
        }));
      if (v58["length"] > 0) {
        const v69 = document["createElement"]("div");
        ((v69["className"] = "custom-model-separator"),
          v55["appendChild"](v69));
      }
      const v70 = document["createElement"]("div");
      ((v70["className"] = "floating-menu-item custom-model-add"),
        (v70["innerHTML"] =
          '\n        <svg class="custom-model-add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\n        <span class="custom-model-add-label">添加模型</span>'),
        v70["addEventListener"]("click", (v71) => {
          (v71["stopPropagation"](),
            v70["replaceChildren"](),
            v70["classList"]["add"]("editing"));
          const v72 = document["createElement"]("input");
          ((v72["type"] = "text"),
            (v72["placeholder"] = "输入模型名称"),
            (v72["className"] = "custom-model-input"));
          const v73 = document["createElement"]("button");
          ((v73["type"] = "button"),
            (v73["textContent"] = "确定"),
            (v73["className"] = "custom-model-confirm"));
          const v74 = () => {
            const v75 = v72["value"]["trim"]();
            if (!v75) return;
            const v76 = getCustomTextModels();
            (!v76["includes"](v75) &&
              (v76["push"](v75), saveCustomTextModels(v76)),
              v57());
          };
          (v72["addEventListener"]("keydown", (v77) => {
            v77["stopPropagation"]();
            if (v77["key"] === "Enter") v74();
          }),
            v72["addEventListener"]("keyup", (v78) => v78["stopPropagation"]()),
            v72["addEventListener"]("keypress", (v79) =>
              v79["stopPropagation"](),
            ),
            v72["addEventListener"]("click", (v80) => v80["stopPropagation"]()),
            v73["addEventListener"]("click", (v81) => {
              (v81["stopPropagation"](), v74());
            }),
            v70["appendChild"](v72),
            v70["appendChild"](v73),
            v72["focus"]());
        }),
        v55["appendChild"](v70));
    };
    if (v27) v57();
    const v82 = bindNodeModelMenuTrigger({
        root: v21,
        trigger: v33,
        menu: v34,
        closeOthers: () => closeNodeFooterMenus(v21, v34),
        activateMenuKeyboard: activateMenuKeyboard,
      }),
      v83 = bindNodeFooterController(v21);
    (v22["push"](v82, v83), (v0["modelWrap"] = v32));
  }
  const v84 = document["createElement"]("div");
  v84["className"] = "prompt-actions";
  const v85 = document["createElement"]("button");
  return (
    (v85["type"] = "button"),
    (v85["className"] = "prompt-submit debug-wrench-btn"),
    (v85["title"] = "调试 API 参数"),
    (v85["innerHTML"] = DEBUG_WRENCH_ICON_HTML),
    v85["addEventListener"]("click", async (v86) => {
      (v86["stopPropagation"](), flushPromptHtmlCommit(v0));
      let v87;
      if (typeof v0["_buildPayload"] === "function")
        v87 = await v0["_buildPayload"]();
      else {
        const v88 = v0["promptEl"]?.["innerText"]?.["trim"]() || "";
        v87 = { prompt: v88, nodeType: v0["_data"]["type"] };
      }
      if (!v87) return;
      try {
        const v89 = await buildGenerateTextRequest(v87),
          v90 = formatFinalApiDebugRequest(v89),
          v91 = appStore["getState"](),
          v92 = v0["_data"]["x"] + (v0["_data"]["width"] || 380) + 50,
          v93 = v0["_data"]["y"];
        let v94 = Object["values"](v91["nodes"])["find"](
          (v95) => v95["type"] === "debug",
        );
        (!v94
          ? appStore["addNode"]({
              id: "debug-" + Date["now"](),
              type: "debug",
              x: v92,
              y: v93,
              width: 380,
              height: 300,
              name: "调试节点",
              outputText: v90,
            })
          : appStore["updateNodeData"](v94["id"], {
              outputText: v90,
              x: v92,
              y: v93,
            }),
          window["showToast"]?.("🔧\x20已展示最终\x20API\x20参数", "warn"));
      } catch (v96) {
        window["showToast"]?.("构造请求失败:\x20" + v96["message"], "error");
      }
    }),
    (v0["btnEl"] = document["createElement"]("button")),
    (v0["btnEl"]["type"] = "button"),
    (v0["btnEl"]["className"] = "prompt-submit img-gen-btn"),
    (v0["btnEl"]["title"] = v1["btnTitle"] || "生成"),
    (v0["btnEl"]["innerHTML"] =
      "<svg\x20width=\x2214\x22\x20height=\x2214\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><line\x20x1=\x2212\x22\x20y1=\x2219\x22\x20x2=\x2212\x22\x20y2=\x225\x22/><polyline\x20points=\x225\x2012\x2012\x205\x2019\x2012\x22/></svg>"),
    v0["btnEl"]["addEventListener"]("click", (v97) => {
      (v97["stopPropagation"](),
        flushPromptHtmlCommit(v0),
        v0["_onGenerate"]?.());
    }),
    v84["appendChild"](v85),
    v84["appendChild"](v0["btnEl"]),
    v21["appendChild"](v84),
    v2["appendChild"](v21),
    (v0["_sharedPanelCleanup"] = () => {
      v22["forEach"]((v98) => v98?.());
    }),
    v0["_updateSubmitButtonState"]?.(),
    v2
  );
}

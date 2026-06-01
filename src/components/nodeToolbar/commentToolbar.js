import appStore from "../../core/stores/appStore.js";
import { commit } from "../../modules/history.js";
import { setClipboard } from "../../modules/clipboard.js";
import {
  getShortcuts,
  detectShortcutConflict,
} from "../../modules/shortcuts.js";
import {
  buildJumpShortcutBinding,
  formatJumpShortcutLabel,
  normalizeCommentNoteJumpShortcut,
  normalizeJumpShortcutZoomPercent,
  parseJumpShortcutFromKeydown,
} from "../../modules/commentNoteJumpShortcut.js";
import { registerStaticInnerHTML } from "../../utils/dom.js";
import { normalizeCommentNoteStyle } from "../commentNoteStyle.js";
const I18N = {
    edit: "编辑",
    fontDec: "减小字号",
    fontInc: "增大字号",
    textColor: "文字颜色",
    bgColor: "背景颜色",
    copyNode: "复制节点",
    copiedNode: "已复制节点",
    deleteNode: "删除节点",
    jumpShortcut: "跳转快捷键",
    jumpShortcutRow: "快捷键",
    jumpClear: "清空快捷键",
    jumpClearAria: "清空跳转快捷键",
    jumpHintRecording: "按下组合键，Esc 取消",
    jumpEmpty: "未设置",
    jumpUpdated: "跳转快捷键已更新",
    jumpCleared: "已清空跳转快捷键",
    jumpZoom: "缩放",
    jumpShortcutConflict: "快捷键冲突",
    jumpConflictOtherComment: "已被其他注释节点占用",
    textColorLabel: {
      white: "白色文字",
      red: "红色文字",
      orange: "橙色文字",
      yellow: "黄色文字",
      green: "绿色文字",
      blue: "蓝色文字",
      purple: "紫色文字",
      cyan: "青色文字",
      pink: "粉色文字",
      gray: "灰色文字",
    },
    bgColorLabel: {
      transparent: "取消背景",
      white: "白色背景",
      red: "红色背景",
      orange: "橙色背景",
      yellow: "黄色背景",
      green: "绿色背景",
      blue: "蓝色背景",
      purple: "紫色背景",
      cyan: "青色背景",
      gray: "灰色背景",
    },
  },
  TEXT_COLOR_OPTIONS = [
    "white",
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "cyan",
    "pink",
    "gray",
  ],
  BACKGROUND_COLOR_OPTIONS = [
    "transparent",
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "cyan",
    "gray",
    "white",
  ],
  SVG_KEYBOARD =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h0M10 9h0M13 9h0M16 9h0M7 12h0M10 12h0M13 12h0M16 12h0M8 15h8"/></svg>',
  SVG_EDIT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  SVG_FONT_DEC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 20 9 7h6l5 13"/><path d="M7.5 13h9"/><path d="M4 5h6"/></svg>',
  SVG_FONT_INC =
    "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22><path\x20d=\x22M4\x2020\x209\x207h6l5\x2013\x22/><path\x20d=\x22M7.5\x2013h9\x22/><path\x20d=\x22M19\x203v6\x22/><path\x20d=\x22M16\x206h6\x22/></svg>",
  SVG_TEXT_COLOR =
    "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22><path\x20d=\x22m4\x2020\x205-13h6l5\x2013\x22/><path\x20d=\x22M7.5\x2013h9\x22/><path\x20d=\x22M4\x2021h16\x22/></svg>",
  SVG_BG_COLOR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="4" y="5" width="16" height="12" rx="2"/><path d="M4 20h16"/></svg>',
  SVG_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  SVG_DELETE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
  COLOR_SWATCH_TOKEN_MAP = {
    red: "var(--red)",
    orange: "var(--gold)",
    yellow: "var(--warning-text)",
    green: "var(--green)",
    blue: "var(--blue)",
    purple: "var(--purple)",
    cyan: "var(--cyan)",
    pink: "var(--group-pink)",
    gray: "var(--group-slate)",
    white: "var(--canvas-white)",
    transparent: "transparent",
  };
function createColorPopupHtml(v0, v1, v2, v3) {
  return (
    "\x0a\x20\x20\x20\x20<div\x20class=\x22comment-toolbar-color-popup\x22\x20data-popup=\x22" +
    v0 +
    "\x22\x20aria-label=\x22" +
    v2 +
    '">\n      ' +
    v1["map"](
      (v4) =>
        '<button\n              class="ftb-btn comment-toolbar-color-item"\n              data-action="' +
        v0 +
        '"\n              data-value="' +
        v4 +
        '"\n              data-tooltip="' +
        (v3[v4] || v4) +
        '"\n              aria-label="' +
        (v3[v4] || v4) +
        '"\n            ></button>',
    )["join"]("") +
    "\n    </div>\n  "
  );
}
function createJumpPopupHtml() {
  return (
    "\x0a\x20\x20\x20\x20<div\x20class=\x22comment-toolbar-jump-popup\x22\x20data-popup=\x22jump-shortcut\x22\x20aria-label=\x22" +
    I18N["jumpShortcut"] +
    "\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22comment-toolbar-jump-binding-row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22comment-toolbar-jump-binding-label\x22>" +
    I18N["jumpShortcutRow"] +
    "</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22comment-toolbar-jump-binding-anchor\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20class=\x22comment-toolbar-jump-binding\x22\x20data-action=\x22jump-toggle-record\x22\x20data-role=\x22jump-binding\x22\x20type=\x22button\x22>" +
    I18N["jumpEmpty"] +
    '</button>\n          <button class="comment-toolbar-jump-clear-btn" data-action="jump-clear-keys" data-tooltip="' +
    I18N["jumpClear"] +
    '" aria-label="' +
    I18N["jumpClearAria"] +
    '" type="button">&times;</button>\n        </div>\n      </div>\n      <label class="comment-toolbar-jump-zoom-field">\n        <span class="comment-toolbar-jump-zoom-label">' +
    I18N["jumpZoom"] +
    '</span>\n        <input\n          class="comment-toolbar-jump-zoom-input"\n          data-role="jump-zoom-range"\n          type="range"\n          min="0"\n          max="100"\n          step="1"\n        />\n        <span class="comment-toolbar-jump-zoom-unit" data-role="jump-zoom-value">50%</span>\n      </label>\n    </div>\n  '
  );
}
export const COMMENT_NOTE_TOOLBAR_HTML =
  '\n<div class="node-floating-toolbar v2-comment-toolbar">\n  <div class="comment-toolbar-jump-wrap" data-role="jump-shortcut">\n    <button class="ftb-btn icon-only act-jump-shortcut comment-toolbar-jump-trigger" data-tooltip="' +
  I18N["jumpShortcut"] +
  " | " +
  I18N["jumpEmpty"] +
  "\x22\x20aria-label=\x22" +
  I18N["jumpShortcut"] +
  "\x22>" +
  SVG_KEYBOARD +
  "</button>\n    " +
  createJumpPopupHtml() +
  "\x0a\x20\x20</div>\x0a\x20\x20<span\x20class=\x22comment-toolbar-divider\x22\x20aria-hidden=\x22true\x22>|</span>\x0a\x20\x20<button\x20class=\x22ftb-btn\x20icon-only\x20act-edit\x22\x20data-tooltip=\x22" +
  I18N["edit"] +
  '" aria-label="' +
  I18N["edit"] +
  "\x22>" +
  SVG_EDIT +
  '</button>\n  <button class="ftb-btn icon-only act-font-dec" data-tooltip="' +
  I18N["fontDec"] +
  "\x22\x20aria-label=\x22" +
  I18N["fontDec"] +
  "\x22>" +
  SVG_FONT_DEC +
  '</button>\n  <button class="ftb-btn icon-only act-font-inc" data-tooltip="' +
  I18N["fontInc"] +
  '" aria-label="' +
  I18N["fontInc"] +
  "\x22>" +
  SVG_FONT_INC +
  '</button>\n\n  <div class="comment-toolbar-color-wrap" data-role="text-color">\n    <button class="ftb-btn icon-only act-text-color comment-toolbar-color-trigger" data-tooltip="' +
  I18N["textColor"] +
  "\x22\x20aria-label=\x22" +
  I18N["textColor"] +
  '">\n      ' +
  SVG_TEXT_COLOR +
  '\n      <span class="comment-toolbar-color-dot" data-dot="text-color"></span>\n    </button>\n    ' +
  createColorPopupHtml(
    "text-color",
    TEXT_COLOR_OPTIONS,
    I18N["textColor"],
    I18N["textColorLabel"],
  ) +
  '\n  </div>\n\n  <div class="comment-toolbar-color-wrap" data-role="background-color">\n    <button class="ftb-btn icon-only act-bg-color comment-toolbar-color-trigger" data-tooltip="' +
  I18N["bgColor"] +
  '" aria-label="' +
  I18N["bgColor"] +
  '">\n      ' +
  SVG_BG_COLOR +
  "\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22comment-toolbar-color-dot\x22\x20data-dot=\x22background-color\x22></span>\x0a\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20" +
  createColorPopupHtml(
    "background-color",
    BACKGROUND_COLOR_OPTIONS,
    I18N["bgColor"],
    I18N["bgColorLabel"],
  ) +
  '\n  </div>\n\n  <button class="ftb-btn icon-only act-copy-node" data-tooltip="' +
  I18N["copyNode"] +
  "\x22\x20aria-label=\x22" +
  I18N["copyNode"] +
  "\x22>" +
  SVG_COPY +
  '</button>\n  <button class="ftb-btn icon-only act-delete-node comment-toolbar-danger" data-tooltip="' +
  I18N["deleteNode"] +
  '" aria-label="' +
  I18N["deleteNode"] +
  "\x22>" +
  SVG_DELETE +
  "</button>\x0a</div>\x0a";
registerStaticInnerHTML("toolbar:comment-note", COMMENT_NOTE_TOOLBAR_HTML);
function normalizeArgs(v5) {
  if (v5 && typeof v5 === "object" && !v5["nodeType"] && v5["toolbarEl"])
    return v5;
  return {
    toolbarEl: v5?.[0],
    nodeId: v5?.[1],
    getCurrentStyle: v5?.[2],
    enterEditMode: v5?.[3],
    getNodeSnapshot: v5?.[4],
  };
}
function setColorDot(v6, v7) {
  if (!v6) return;
  const v8 = COLOR_SWATCH_TOKEN_MAP[v7] || "var(--white-20)";
  (v6["style"]["setProperty"]("--comment-toolbar-dot-color", v8),
    v6["classList"]["toggle"]("is-transparent", v7 === "transparent"));
}
function getJumpShortcutTooltipText(v9) {
  return (
    I18N["jumpShortcut"] +
    "\x20|\x20" +
    formatJumpShortcutLabel(v9, I18N["jumpEmpty"])
  );
}
export function bindCommentNoteToolbarEvents(...v10) {
  const {
    toolbarEl: v11,
    nodeId: v12,
    getCurrentStyle: v13,
    enterEditMode: v14,
    getNodeSnapshot: v15,
  } = normalizeArgs(v10["length"] === 1 ? v10[0] : v10);
  if (!v11 || !v12 || typeof v13 !== "function") return null;
  (v11["addEventListener"]("pointerdown", (v16) => v16["stopPropagation"]()),
    v11["addEventListener"]("dblclick", (v17) => {
      (v17["preventDefault"](), v17["stopPropagation"]());
    }),
    (v11["tabIndex"] = -1));
  const v18 = 2;
  let v19 = null,
    v20 = false,
    v21 = 0,
    v22 = null;
  const v23 = v11["querySelector"]('[data-dot="text-color"]'),
    v24 = v11["querySelector"]("[data-dot=\x22background-color\x22]"),
    v25 = v11["querySelector"](".comment-toolbar-jump-wrap"),
    v26 = v11["querySelector"](".act-jump-shortcut"),
    v27 = v11["querySelector"]('[data-role="jump-binding"]'),
    v28 = v11["querySelector"]('[data-role="jump-zoom-range"]'),
    v29 = v11["querySelector"]("[data-role=\x22jump-zoom-value\x22]"),
    v30 = () => appStore["getStateRaw"]()["nodes"]?.[v12] || null,
    v31 = () => normalizeCommentNoteJumpShortcut(v30()?.["jumpShortcut"]),
    v32 = () => {
      if (!v21) return;
      (clearTimeout(v21), (v21 = 0));
    },
    v33 = (v34) => {
      if (!v26) return;
      v26["setAttribute"]("data-tooltip", getJumpShortcutTooltipText(v34));
    },
    v35 = (v36, v37 = 1800) => {
      if (!v26) return;
      (v32(),
        v26["classList"]["add"]("is-tooltip-pinned"),
        v26["setAttribute"]("data-tooltip", v36),
        (v21 = window["setTimeout"](() => {
          (v26["classList"]["remove"]("is-tooltip-pinned"),
            v33(v31()["keys"]),
            v32());
        }, v37)));
    },
    v38 = () => {
      const v39 = v31(),
        v40 = formatJumpShortcutLabel(v39["keys"], I18N["jumpEmpty"]);
      (v27 &&
        ((v27["textContent"] = v20 ? I18N["jumpHintRecording"] : v40),
        v27["classList"]["toggle"]("is-recording", v20),
        v27["setAttribute"](
          "aria-label",
          v20 ? I18N["jumpHintRecording"] : v40,
        )),
        v26 &&
          !v26["classList"]["contains"]("is-tooltip-pinned") &&
          v33(v39["keys"]),
        v28 &&
          document["activeElement"] !== v28 &&
          (v28["value"] = String(v39["zoomPercent"])),
        v29 && (v29["textContent"] = v39["zoomPercent"] + "%"),
        v25 && v25["classList"]["toggle"]("is-recording", v20));
    },
    v41 = (v42) => {
      ((v20 = v42 === true),
        (window["__commentNoteShortcutRecording"] = v20),
        v38());
    },
    v43 = (v44) => {
      const v45 = getShortcuts?.(),
        v46 = detectShortcutConflict(v45, "__comment-note-jump__", v44);
      if (v46)
        return (
          I18N["jumpShortcutConflict"] + " | 已被「" + v46["label"] + "」占用"
        );
      const v47 = buildJumpShortcutBinding(v44);
      if (!v47) return null;
      const v48 = appStore["getStateRaw"]()["nodes"] || {};
      for (const [v49, v50] of Object["entries"](v48)) {
        if (!v50 || v49 === v12 || v50["type"] !== "comment-note") continue;
        const v51 = normalizeCommentNoteJumpShortcut(v50["jumpShortcut"]),
          v52 = buildJumpShortcutBinding(v51["keys"]);
        if (v52 && v52 === v47)
          return (
            I18N["jumpShortcutConflict"] +
            " | " +
            I18N["jumpConflictOtherComment"]
          );
      }
      return null;
    },
    v53 = (v54, { commitHistory: commitHistory = true } = {}) => {
      const v55 = v31(),
        v56 = normalizeCommentNoteJumpShortcut({ ...v55, ...(v54 || {}) });
      if (
        buildJumpShortcutBinding(v55["keys"]) ===
          buildJumpShortcutBinding(v56["keys"]) &&
        v55["zoomPercent"] === v56["zoomPercent"]
      ) {
        v38();
        return;
      }
      (appStore["updateNodeData"](v12, { jumpShortcut: v56 }),
        commitHistory && commit(),
        v38());
    },
    v57 = () => {
      (v22 &&
        (document["removeEventListener"]("keydown", v22, true), (v22 = null)),
        v41(false));
    },
    v58 = () => {
      if (v20) return;
      (v41(true),
        (v22 = (v59) => {
          if (!v20) return;
          (v59["preventDefault"](), v59["stopImmediatePropagation"]());
          if (v59["key"] === "Escape") {
            (v57(), v38());
            return;
          }
          const v60 = parseJumpShortcutFromKeydown(v59);
          if (!v60["length"]) return;
          const v61 = v43(v60);
          if (v61) {
            (v35(v61), v57());
            return;
          }
          (v53({ keys: v60 }),
            window["showToast"]?.(I18N["jumpUpdated"], "success"),
            v57());
        }),
        document["addEventListener"]("keydown", v22, true));
    },
    v62 = () => {
      v11["querySelectorAll"](".comment-toolbar-color-wrap")["forEach"]((v63) =>
        v63["classList"]["remove"]("is-open"),
      );
    },
    v64 = () => {
      if (v25) v25["classList"]["remove"]("is-open");
      v57();
    },
    v65 = () => {
      ((v19 = null),
        v11["classList"]["remove"]("comment-toolbar-popup-open"),
        v62(),
        v64());
    },
    v66 = (v67) => {
      ((v19 = v67),
        v11["classList"]["add"]("comment-toolbar-popup-open"),
        v11["querySelectorAll"](".comment-toolbar-color-wrap")["forEach"](
          (v68) => {
            v68["classList"]["toggle"](
              "is-open",
              v68["dataset"]["role"] === v67,
            );
          },
        ),
        v25 && v25["classList"]["toggle"]("is-open", v67 === "jump-shortcut"),
        v67 !== "jump-shortcut" && v57(),
        v67 === "jump-shortcut" && (v27?.["focus"](), v38()));
    };
  v11["addEventListener"]("focusout", (v69) => {
    if (!v11["contains"](v69["relatedTarget"])) v65();
  });
  const v70 = (v71) => {
      const v72 = normalizeCommentNoteStyle(v71 || v13());
      (v11["querySelectorAll"]('[data-action="text-color"]')["forEach"]((v73) =>
        v73["classList"]["toggle"](
          "is-active",
          v73["dataset"]["value"] === v72["textColor"],
        ),
      ),
        v11["querySelectorAll"]('[data-action="background-color"]')["forEach"](
          (v74) =>
            v74["classList"]["toggle"](
              "is-active",
              v74["dataset"]["value"] === v72["backgroundColor"],
            ),
        ),
        setColorDot(v23, v72["textColor"]),
        setColorDot(v24, v72["backgroundColor"]),
        v38());
    },
    v75 = (v76) => {
      const v77 = normalizeCommentNoteStyle(v13()),
        v78 = normalizeCommentNoteStyle({ ...v77, ...v76 });
      (appStore["updateNodeData"](v12, { style: v78 }), commit());
    },
    v79 = ({ commitHistory: commitHistory = true } = {}) => {
      if (!v28) return;
      const v80 = normalizeJumpShortcutZoomPercent(v28["value"]);
      v53({ zoomPercent: v80 }, { commitHistory: commitHistory });
    };
  return (
    v28?.["addEventListener"]("input", () => v79({ commitHistory: false })),
    v28?.["addEventListener"]("change", () => v79({ commitHistory: true })),
    v11["addEventListener"]("click", (v81) => {
      const v82 = v81["target"]["closest"]("button");
      if (!v82) return;
      v81["stopPropagation"]();
      const v83 = v82["dataset"]["action"];
      if (v83 === "jump-toggle-record") {
        v20 ? v57() : v58();
        return;
      }
      if (v83 === "jump-clear-keys") {
        (v57(),
          v53({ keys: [] }),
          window["showToast"]?.(I18N["jumpCleared"], "success"));
        return;
      }
      if (v82["classList"]["contains"]("act-jump-shortcut")) {
        if (v19 === "jump-shortcut") v65();
        else v66("jump-shortcut");
        return;
      }
      if (v82["classList"]["contains"]("act-edit")) {
        (v65(), v14?.());
        return;
      }
      if (v82["classList"]["contains"]("act-font-dec")) {
        const v84 = normalizeCommentNoteStyle(v13());
        (v75({ fontSize: v84["fontSize"] - v18 }), v65());
        return;
      }
      if (v82["classList"]["contains"]("act-font-inc")) {
        const v85 = normalizeCommentNoteStyle(v13());
        (v75({ fontSize: v85["fontSize"] + v18 }), v65());
        return;
      }
      if (v82["classList"]["contains"]("act-copy-node")) {
        const v86 = (typeof v15 === "function" && v15()) || v30();
        if (!v86) return;
        const v87 = { ...v86 };
        (delete v87["generationStartTime"],
          delete v87["generationDuration"],
          setClipboard([v87]),
          v82["classList"]["add"]("is-copied"));
        const v88 = v82["getAttribute"]("data-tooltip");
        (v82["setAttribute"]("data-tooltip", I18N["copiedNode"]),
          window["setTimeout"](() => {
            (v82["classList"]["remove"]("is-copied"),
              v82["setAttribute"]("data-tooltip", v88 || I18N["copyNode"]));
          }, 1200),
          v65());
        return;
      }
      if (v82["classList"]["contains"]("act-delete-node")) {
        (appStore["deleteNodes"]([v12]), commit(), v65());
        return;
      }
      if (v82["classList"]["contains"]("act-text-color")) {
        if (v19 === "text-color") v65();
        else v66("text-color");
        return;
      }
      if (v82["classList"]["contains"]("act-bg-color")) {
        if (v19 === "background-color") v65();
        else v66("background-color");
        return;
      }
      const v89 = v82["dataset"]["value"];
      if (v83 === "text-color" && v89) {
        (v75({ textColor: v89 }), v65());
        return;
      }
      v83 === "background-color" &&
        v89 &&
        (v75({ backgroundColor: v89 }), v65());
    }),
    v70(v13()),
    v70
  );
}

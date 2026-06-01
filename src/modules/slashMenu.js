import {
  getSlashPromptPresetEntries,
  openCustomPresetsManager,
  shouldInsertPromptForPreset,
} from "./promptPresets.js";
import appStore from "../core/stores/appStore.js";
import { createSafeSvg, sanitizePromptHtml } from "../utils/dom.js";
let _slashMenuEl = null;
export function getSlashMenu() {
  return (
    !_slashMenuEl &&
      ((_slashMenuEl = document["getElementById"]("v2-slash-menu")),
      !_slashMenuEl &&
        ((_slashMenuEl = document["createElement"]("div")),
        (_slashMenuEl["id"] = "v2-slash-menu"),
        (_slashMenuEl["className"] = "preset-slash-menu"),
        document["body"]["appendChild"](_slashMenuEl))),
    _slashMenuEl
  );
}
let _subMenuState = {
    activeSubmenu: null,
    parentItem: null,
    subItems: [],
    subIndex: -1,
  },
  _slashViewportUnsubscribe = null,
  _slashOutsideDocClick = null,
  _slashOutsideDocClickTimer = 0,
  _slashPositionState = null;
function resetSubMenuState() {
  _subMenuState = {
    activeSubmenu: null,
    parentItem: null,
    subItems: [],
    subIndex: -1,
  };
}
function _appendPresetIcon(v0, v1) {
  if (!v0 || !v1) return;
  const v2 = String(v1)["trim"]();
  if (v2["startsWith"]("<svg")) {
    const v3 = createSafeSvg(v2);
    if (v3) {
      (v0["appendChild"](v3),
        v0["appendChild"](document["createTextNode"]("\x20")));
      return;
    }
  }
  v0["appendChild"](document["createTextNode"](String(v1) + "\x20"));
}
function _getSlashPresetTriggerModeLabel(v4 = {}) {
  return shouldInsertPromptForPreset(v4) ? "加入提示词" : "直接触发";
}
function _isSelectableSlashPreset(v5 = {}) {
  return v5 && Object["prototype"]["hasOwnProperty"]["call"](v5, "template");
}
function _appendSlashPresetTriggerBadge(v6, v7 = {}) {
  if (!v6) return;
  const v8 = document["createElement"]("span");
  ((v8["className"] = "preset-slash-trigger-badge"),
    (v8["textContent"] = _getSlashPresetTriggerModeLabel(v7)),
    v6["appendChild"](v8));
}
function _isSlashNodeConnected(v9) {
  if (!v9) return false;
  if (v9["isConnected"] === true) return true;
  if (typeof document === "undefined") return true;
  return typeof document["body"]?.["contains"] === "function"
    ? document["body"]["contains"](v9)
    : true;
}
function _clearSlashOutsideDocClick() {
  (_slashOutsideDocClickTimer &&
    (clearTimeout(_slashOutsideDocClickTimer),
    (_slashOutsideDocClickTimer = 0)),
    _slashOutsideDocClick &&
      typeof document !== "undefined" &&
      document["removeEventListener"]?.("mousedown", _slashOutsideDocClick),
    (_slashOutsideDocClick = null));
}
function _cleanupSlashMenuLifecycle() {
  (_clearSlashOutsideDocClick(),
    _slashViewportUnsubscribe &&
      (_slashViewportUnsubscribe(), (_slashViewportUnsubscribe = null)),
    (_slashPositionState = null));
}
function _getSlashAnchorRect(v10) {
  if (
    !v10 ||
    typeof v10["getBoundingClientRect"] !== "function" ||
    !_isSlashNodeConnected(v10)
  )
    return null;
  return v10["getBoundingClientRect"]();
}
function _positionSlashSubmenu(v11, v12) {
  if (!v11 || !v12 || typeof v11["getBoundingClientRect"] !== "function")
    return;
  const v13 = v11["getBoundingClientRect"]();
  ((v12["style"]["left"] = v13["right"] + 6 + "px"),
    (v12["style"]["top"] = v13["top"] + "px"));
}
function _syncOpenSlashSubmenus() {
  const v14 = _slashPositionState?.["menu"] || _slashMenuEl;
  if (!v14) return;
  document["querySelectorAll"]?.(".preset-slash-submenu")["forEach"]((v15) => {
    if (!v15["classList"]?.["contains"]("open")) return;
    const v16 = v15["dataset"]?.["parentItem"] || "";
    if (!v16) return;
    const v17 = Array["from"](v14["children"] || [])["find"](
      (v18) => v18["dataset"]?.["itemId"] === v16,
    );
    _positionSlashSubmenu(v17, v15);
  });
}
function _positionSlashMenu() {
  const v19 = _slashPositionState,
    v20 = v19?.["menu"];
  if (!v19 || !v20 || !v20["classList"]?.["contains"]("open")) return;
  const v21 = _getSlashAnchorRect(v19["anchorEl"]);
  if (!v21) {
    closeSlashMenu();
    return;
  }
  const v22 = v20["offsetHeight"] || v19["menuHeight"] || 280;
  ((v19["menuHeight"] = v22),
    (v20["style"]["left"] = v21["left"] + "px"),
    (v20["style"]["visibility"] = "visible"),
    v21["top"] - v22 < 0
      ? ((v20["style"]["transformOrigin"] = "top left"),
        (v20["style"]["top"] = v21["bottom"] + 8 + "px"))
      : ((v20["style"]["transformOrigin"] = "bottom left"),
        (v20["style"]["top"] = v21["top"] - v22 - 8 + "px")),
    _syncOpenSlashSubmenus());
}
function _watchSlashViewport() {
  if (typeof appStore["subscribeSelector"] !== "function") return;
  if (_slashViewportUnsubscribe) _slashViewportUnsubscribe();
  _slashViewportUnsubscribe = appStore["subscribeSelector"](
    (v23) => v23["viewport"],
    () => _positionSlashMenu(),
  );
}
function _bindSlashOutsideDocClick(v24) {
  (_clearSlashOutsideDocClick(),
    (_slashOutsideDocClick = (v25) => {
      const v26 = Array["from"](
        document["querySelectorAll"]?.(".preset-slash-submenu") || [],
      )["some"]((v27) => v27["contains"]?.(v25["target"]));
      !v24["contains"](v25["target"]) && !v26 && closeSlashMenu();
    }),
    (_slashOutsideDocClickTimer = setTimeout(() => {
      ((_slashOutsideDocClickTimer = 0),
        _slashOutsideDocClick &&
          document["addEventListener"]?.("mousedown", _slashOutsideDocClick));
    }, 10)));
}
export function closeSlashMenu() {
  _cleanupSlashMenuLifecycle();
  if (typeof document === "undefined") {
    resetSubMenuState();
    return;
  }
  const v28 = getSlashMenu();
  (v28["classList"]["remove"]("open"),
    document["querySelectorAll"](".preset-slash-submenu")["forEach"]((v29) =>
      v29["remove"](),
    ),
    v28["replaceChildren"](),
    resetSubMenuState());
}
function _removeSlashTriggerText(v30, v31) {
  const v32 = v30?.["startContainer"];
  if (!v32 || v32["nodeType"] !== Node["TEXT_NODE"]) return;
  const v33 = v32["textContent"],
    v34 = v30["startOffset"],
    v35 = v33["lastIndexOf"]("/", v34 - 1);
  if (v35 === -1) return;
  ((v32["textContent"] = v33["substring"](0, v35) + v33["substring"](v34)),
    v30["setStart"](v32, v35),
    v30["setEnd"](v32, v35),
    v31["removeAllRanges"](),
    v31["addRange"](v30));
}
function _selectPromptPreset({
  promptEl: v36,
  nodeId: v37,
  preset: v38,
  range: v39,
  selection: v40,
  onGenerate: v41,
}) {
  (closeSlashMenu(),
    _removeSlashTriggerText(v39, v40),
    v36["querySelectorAll"](".preset-pill")["forEach"]((v42) =>
      v42["remove"](),
    ),
    appStore["updateNodeData"](v37, {
      prompt: sanitizePromptHtml(v36["innerHTML"]),
    }),
    setTimeout(() => {
      v41?.(v38?.["template"], {
        insertPrompt: shouldInsertPromptForPreset(v38),
      });
    }, 50));
}
export function checkSlashTrigger(
  v43,
  { promptEl: v44, nodeType: v45, nodeId: v46, onGenerate: v47 },
) {
  if (v43["inputType"] === "insertCompositionText") return;
  const v48 = window["getSelection"]();
  if (!v48["rangeCount"]) return;
  const v49 = v48["getRangeAt"](0);
  if (v49["startContainer"]["nodeType"] !== Node["TEXT_NODE"]) {
    closeSlashMenu();
    return;
  }
  const v50 = v49["startContainer"]["textContent"]["slice"](
      0,
      v49["startOffset"],
    ),
    v51 = v50["lastIndexOf"]("/");
  if (v51 === -1 || v51 !== v50["length"] - 1) {
    closeSlashMenu();
    return;
  }
  const v52 = getSlashPromptPresetEntries(v45),
    v53 = getSlashMenu();
  (_cleanupSlashMenuLifecycle(),
    document["querySelectorAll"](".preset-slash-submenu")["forEach"]((v54) =>
      v54["remove"](),
    ),
    v53["replaceChildren"]());
  if (v52["length"] > 0) {
    const v55 = document["createElement"]("div");
    ((v55["className"] = "preset-slash-header"),
      (v55["textContent"] = "选择预设生成"),
      v53["appendChild"](v55));
  }
  v52["forEach"]((v56, v57) => {
    const v58 = document["createElement"]("div");
    v58["className"] =
      "preset-slash-item has-desc" + (v57 === 0 ? " active" : "");
    const v59 = "slash-item-" + v57;
    v58["dataset"]["itemId"] = v59;
    const v60 = document["createElement"]("div");
    v60["className"] = "preset-slash-title-wrap";
    const v61 = document["createElement"]("div");
    v61["className"] = "preset-slash-title";
    v56["icon"] && _appendPresetIcon(v61, v56["icon"]);
    v61["appendChild"](document["createTextNode"](v56["title"] || ""));
    if (v56["subItems"]) {
      const v62 = document["createElement"]("span");
      ((v62["className"] = "preset-slash-title-arrow"),
        (v62["textContent"] = ">"),
        v61["appendChild"](v62));
    }
    const v63 = document["createElement"]("div");
    ((v63["className"] = "preset-slash-desc"),
      (v63["textContent"] = v56["desc"] || v56["template"] || "包含多个子选项"),
      v60["appendChild"](v61),
      v60["appendChild"](v63),
      v58["appendChild"](v60));
    if (v56["subItems"] && v56["subItems"]["length"] > 0) {
      v58["style"]["overflow"] = "visible";
      const v64 = document["createElement"]("div");
      ((v64["className"] = "preset-slash-submenu"),
        (v64["dataset"]["parentItem"] = v59),
        v56["subItems"]["forEach"]((v65, v66) => {
          const v67 = document["createElement"]("div");
          v67["className"] = "preset-slash-item has-desc";
          _isSelectableSlashPreset(v65) &&
            v67["classList"]["add"]("has-trigger-badge");
          const v68 = document["createElement"]("div");
          v68["className"] = "preset-slash-title-wrap";
          const v69 = document["createElement"]("div");
          v69["className"] = "preset-slash-title";
          v65["icon"] && _appendPresetIcon(v69, v65["icon"]);
          v69["appendChild"](document["createTextNode"](v65["title"] || ""));
          const v70 = document["createElement"]("div");
          ((v70["className"] = "preset-slash-desc"),
            (v70["textContent"] = v65["desc"] || v65["template"] || ""),
            v68["appendChild"](v69),
            v68["appendChild"](v70),
            v67["appendChild"](v68),
            _isSelectableSlashPreset(v65) &&
              _appendSlashPresetTriggerBadge(v67, v65),
            v67["addEventListener"]("mouseenter", () => {
              (Array["from"](v64["children"])["forEach"]((v71) =>
                v71["classList"]["remove"]("active"),
              ),
                v67["classList"]["add"]("active"));
            }),
            v67["addEventListener"]("mousedown", (v72) => {
              (v72["preventDefault"](),
                v72["stopPropagation"](),
                _selectPromptPreset({
                  promptEl: v44,
                  nodeId: v46,
                  preset: v65,
                  range: v49,
                  selection: v48,
                  onGenerate: v47,
                }));
            }),
            v64["appendChild"](v67));
        }),
        document["body"]["appendChild"](v64));
      let v73;
      (v58["addEventListener"]("mouseenter", () => {
        (Array["from"](v53["children"])["forEach"]((v74) =>
          v74["classList"]["remove"]("active"),
        ),
          v58["classList"]["add"]("active"),
          clearTimeout(v73),
          _positionSlashSubmenu(v58, v64),
          v64["classList"]["add"]("open"));
      }),
        v58["addEventListener"]("mouseleave", () => {
          v73 = setTimeout(() => {
            v64["classList"]["remove"]("open");
          }, 100);
        }),
        v64["addEventListener"]("mouseenter", () => {
          clearTimeout(v73);
        }),
        v64["addEventListener"]("mouseleave", () => {
          v73 = setTimeout(() => {
            v64["classList"]["remove"]("open");
          }, 100);
        }),
        v58["addEventListener"]("mousedown", (v75) => {
          (v75["preventDefault"](), v75["stopPropagation"]());
        }));
    } else
      (_isSelectableSlashPreset(v56) &&
        (v58["classList"]["add"]("has-trigger-badge"),
        _appendSlashPresetTriggerBadge(v58, v56)),
        v58["addEventListener"]("mouseenter", () => {
          (Array["from"](v53["children"])["forEach"]((v76) =>
            v76["classList"]?.["remove"]("active"),
          ),
            v58["classList"]["add"]("active"));
        }),
        v58["addEventListener"]("mousedown", (v77) => {
          (v77["preventDefault"](),
            _selectPromptPreset({
              promptEl: v44,
              nodeId: v46,
              preset: v56,
              range: v49,
              selection: v48,
              onGenerate: v47,
            }));
        }));
    v53["appendChild"](v58);
  });
  if (["ai-image", "ai-text", "ai-video", "ai-audio"]["includes"](v45)) {
    const v78 = document["createElement"]("div");
    v78["className"] = "preset-slash-item preset-slash-custom has-desc";
    v52["length"] === 0 && v78["classList"]["add"]("preset-slash-custom-first");
    const v79 = document["createElement"]("div");
    v79["className"] = "preset-slash-title-wrap";
    const v80 = document["createElement"]("div");
    v80["className"] = "preset-slash-title preset-slash-custom-header";
    const v81 = document["createElement"]("span");
    ((v81["className"] = "preset-slash-custom-title"),
      (v81["textContent"] = "自定义预设"));
    const v82 = document["createElement"]("span");
    ((v82["className"] = "preset-slash-badge"),
      (v82["textContent"] = "管理"),
      v80["appendChild"](v81),
      v80["appendChild"](v82));
    const v83 = document["createElement"]("div");
    ((v83["className"] = "preset-slash-desc"),
      (v83["textContent"] = "点击编辑或新建当前专属配置"),
      v79["appendChild"](v80),
      v79["appendChild"](v83),
      v78["appendChild"](v79),
      v78["addEventListener"]("mousedown", (v84) => {
        (v84["preventDefault"](),
          closeSlashMenu(),
          openCustomPresetsManager({ nodeType: v45 }));
      }),
      v53["appendChild"](v78));
  }
  ((v53["style"]["left"] = "-9999px"),
    (v53["style"]["top"] = "-9999px"),
    v53["classList"]["add"]("open"),
    (v53["style"]["visibility"] = "hidden"),
    (_slashPositionState = {
      menu: v53,
      anchorEl: v44["parentNode"] || v44,
      menuHeight: v53["offsetHeight"] || 280,
    }),
    _positionSlashMenu(),
    _watchSlashViewport(),
    _bindSlashOutsideDocClick(v53));
}
function activateSubMenu(v85, v86) {
  const v87 = document["querySelectorAll"](".preset-slash-submenu");
  (v87["forEach"]((v88) => {
    if (v88 !== v86) v88["classList"]["remove"]("open");
  }),
    _positionSlashSubmenu(v85, v86),
    v86["classList"]["add"]("open"));
  const v89 = Array["from"](v86["children"])["filter"](
    (v90) =>
      v90["classList"] && v90["classList"]["contains"]("preset-slash-item"),
  );
  ((_subMenuState["activeSubmenu"] = v86),
    (_subMenuState["parentItem"] = v85),
    (_subMenuState["subItems"] = v89),
    (_subMenuState["subIndex"] = 0),
    v89["forEach"]((v91, v92) =>
      v91["classList"]["toggle"]("active", v92 === 0),
    ));
  if (v89[0]) v89[0]["scrollIntoView"]({ block: "nearest" });
}
function deactivateSubMenu() {
  if (_subMenuState["activeSubmenu"]) {
    _subMenuState["activeSubmenu"]["classList"]["remove"]("open");
    if (_subMenuState["parentItem"]) {
      const v93 = Array["from"](
        _subMenuState["parentItem"]["parentNode"]["children"],
      )["filter"](
        (v94) =>
          v94["classList"] && v94["classList"]["contains"]("preset-slash-item"),
      );
      (v93["forEach"]((v95) => v95["classList"]["remove"]("active")),
        _subMenuState["parentItem"]["classList"]["add"]("active"));
    }
    resetSubMenuState();
  }
}
export function handleSlashKeyboardNavigation(v96) {
  const v97 = getSlashMenu();
  if (!v97["classList"]["contains"]("open")) return false;
  if (_subMenuState["activeSubmenu"]) {
    const { subItems: v98, subIndex: v99 } = _subMenuState;
    if (v96["key"] === "ArrowLeft")
      return (v96["preventDefault"](), deactivateSubMenu(), true);
    if (v96["key"] === "ArrowDown") {
      v96["preventDefault"]();
      const v100 = v99 < v98["length"] - 1 ? v99 + 1 : 0;
      ((_subMenuState["subIndex"] = v100),
        v98["forEach"]((v101, v102) =>
          v101["classList"]["toggle"]("active", v102 === v100),
        ));
      if (v98[v100]) v98[v100]["scrollIntoView"]({ block: "nearest" });
      return true;
    }
    if (v96["key"] === "ArrowUp") {
      v96["preventDefault"]();
      const v103 = v99 > 0 ? v99 - 1 : v98["length"] - 1;
      ((_subMenuState["subIndex"] = v103),
        v98["forEach"]((v104, v105) =>
          v104["classList"]["toggle"]("active", v105 === v103),
        ));
      if (v98[v103]) v98[v103]["scrollIntoView"]({ block: "nearest" });
      return true;
    }
    if (v96["key"] === "Enter")
      return (
        v96["preventDefault"](),
        v99 >= 0 &&
          v98[v99] &&
          v98[v99]["dispatchEvent"](new MouseEvent("mousedown")),
        resetSubMenuState(),
        true
      );
    if (v96["key"] === "Escape")
      return (v96["preventDefault"](), deactivateSubMenu(), true);
    return false;
  }
  const v106 = Array["from"](v97["children"])["filter"](
    (v107) =>
      v107["classList"] && v107["classList"]["contains"]("preset-slash-item"),
  );
  let v108 = v106["findIndex"]((v109) =>
    v109["classList"]["contains"]("active"),
  );
  if (v96["key"] === "ArrowDown") {
    (v96["preventDefault"](),
      (v108 = v108 < v106["length"] - 1 ? v108 + 1 : 0),
      v106["forEach"]((v110, v111) =>
        v110["classList"]["toggle"]("active", v111 === v108),
      ));
    if (v106[v108]) v106[v108]["scrollIntoView"]({ block: "nearest" });
    return true;
  }
  if (v96["key"] === "ArrowUp") {
    (v96["preventDefault"](),
      (v108 = v108 > 0 ? v108 - 1 : v106["length"] - 1),
      v106["forEach"]((v112, v113) =>
        v112["classList"]["toggle"]("active", v113 === v108),
      ));
    if (v106[v108]) v106[v108]["scrollIntoView"]({ block: "nearest" });
    return true;
  }
  if (v96["key"] === "ArrowRight") {
    v96["preventDefault"]();
    if (v108 >= 0 && v106[v108]) {
      const v114 = document["querySelector"](
        '.preset-slash-submenu[data-parent-item="' +
          v106[v108]["dataset"]["itemId"] +
          "\x22]",
      );
      if (v114) activateSubMenu(v106[v108], v114);
    }
    return true;
  }
  if (v96["key"] === "Enter") {
    v96["preventDefault"]();
    if (v108 >= 0) {
      const v115 = document["querySelector"](
        '.preset-slash-submenu[data-parent-item="' +
          v106[v108]["dataset"]["itemId"] +
          "\x22]",
      );
      if (v115) activateSubMenu(v106[v108], v115);
      else v106[v108]["dispatchEvent"](new MouseEvent("mousedown"));
    }
    return true;
  }
  if (v96["key"] === "Escape")
    return (v96["preventDefault"](), closeSlashMenu(), true);
  return false;
}

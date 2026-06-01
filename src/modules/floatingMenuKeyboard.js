let _activeMenuState = {
  menu: null,
  items: [],
  activeIndex: -1,
  submenu: null,
  parentItem: null,
  isSubmenu: false,
};
function _resetState() {
  _activeMenuState = {
    menu: null,
    items: [],
    activeIndex: -1,
    submenu: null,
    parentItem: null,
    isSubmenu: false,
  };
}
function _isActiveMenuUsable(v0) {
  return !!(
    v0 &&
    v0["isConnected"] !== false &&
    v0["classList"]?.["contains"]?.("show")
  );
}
function _isEditableEventTarget(v1) {
  let v2 = v1;
  while (v2) {
    const v3 = String(v2["tagName"] || v2["nodeName"] || "")["toLowerCase"]();
    if (v3 === "input" || v3 === "textarea" || v3 === "select") return true;
    if (v2["isContentEditable"] === true) return true;
    const v4 =
      typeof v2["getAttribute"] === "function"
        ? v2["getAttribute"]("contenteditable")
        : null;
    if (v4 !== null && v4 !== undefined) {
      const v5 = String(v4)["trim"]()["toLowerCase"]();
      if (v5 === "" || v5 === "true" || v5 === "plaintext-only") return true;
    }
    if (typeof v2["closest"] === "function") {
      const v6 = v2["closest"](
        'input, textarea, select, [data-ui-schema-input], .rh-stepper-input, [contenteditable]:not([contenteditable="false"])',
      );
      if (v6) return true;
    }
    v2 = v2["parentElement"] || v2["parentNode"];
  }
  return false;
}
function _getSelectableItems(v7) {
  if (!v7) return [];
  return Array["from"](
    v7["querySelectorAll"](
      ".floating-menu-item, [data-value], [data-grsai-toggle], [data-ppio-toggle], [data-apimart-toggle], [data-custom-toggle]",
    ),
  )["filter"]((v8) => {
    if (
      v8["classList"]["contains"]("grsai-submenu") ||
      v8["classList"]["contains"]("ppio-submenu") ||
      v8["classList"]["contains"]("apimart-submenu") ||
      v8["classList"]["contains"]("custom-submenu")
    )
      return false;
    if (v8["offsetParent"] === null) return false;
    return true;
  });
}
function _updateActiveIndex(v9) {
  const { items: v10 } = _activeMenuState;
  if (v10["length"] === 0) return;
  if (v9 < 0) v9 = v10["length"] - 1;
  if (v9 >= v10["length"]) v9 = 0;
  ((_activeMenuState["activeIndex"] = v9),
    v10["forEach"]((v11, v12) => {
      v11["classList"]["toggle"]("active", v12 === v9);
    }),
    v10[v9] &&
      v10[v9]["scrollIntoView"]({ block: "nearest", behavior: "smooth" }));
}
function _openSubmenu(v13) {
  if (!v13) return false;
  let v14 = null;
  const v15 = v13["closest"](".floating-menu, .img-model-menu");
  if (
    v13["classList"]["contains"]("custom-group-header") ||
    v13["hasAttribute"]("data-custom-toggle")
  )
    v14 = v15?.["querySelector"](".custom-submenu");
  else {
    if (
      v13["classList"]["contains"]("grsai-group-header") ||
      v13["hasAttribute"]("data-grsai-toggle")
    )
      v14 = v15?.["querySelector"](".grsai-submenu");
    else {
      if (
        v13["classList"]["contains"]("ppio-group-header") ||
        v13["hasAttribute"]("data-ppio-toggle")
      )
        v14 = v15?.["querySelector"](".ppio-submenu");
      else
        (v13["classList"]["contains"]("apimart-group-header") ||
          v13["hasAttribute"]("data-apimart-toggle")) &&
          (v14 = v15?.["querySelector"](".apimart-submenu"));
    }
  }
  if (!v14 || v14["style"]["display"] === "flex") return false;
  v14["style"]["display"] = "flex";
  const v16 = _getSelectableItems(v14);
  if (v16["length"] === 0) return ((v14["style"]["display"] = "none"), false);
  return (
    (_activeMenuState["parentItem"] = v13),
    (_activeMenuState["submenu"] = v14),
    (_activeMenuState["isSubmenu"] = true),
    (_activeMenuState["items"] = v16),
    (_activeMenuState["activeIndex"] = 0),
    v16["forEach"]((v17, v18) =>
      v17["classList"]["toggle"]("active", v18 === 0),
    ),
    true
  );
}
function _closeSubmenu() {
  const { submenu: v19, parentItem: v20, menu: v21 } = _activeMenuState;
  if (!v19) return false;
  return (
    (v19["style"]["display"] = "none"),
    (_activeMenuState["isSubmenu"] = false),
    (_activeMenuState["submenu"] = null),
    (_activeMenuState["items"] = _getSelectableItems(v21)),
    v20 &&
      ((_activeMenuState["activeIndex"] =
        _activeMenuState["items"]["indexOf"](v20)),
      _activeMenuState["items"]["forEach"]((v22, v23) => {
        v22["classList"]["toggle"](
          "active",
          v23 === _activeMenuState["activeIndex"],
        );
      })),
    (_activeMenuState["parentItem"] = null),
    true
  );
}
function _selectActiveItem() {
  const { items: v24, activeIndex: v25, isSubmenu: v26 } = _activeMenuState;
  if (v25 < 0 || v25 >= v24["length"]) return false;
  const v27 = v24[v25],
    v28 =
      v27["classList"]["contains"]("custom-group-header") ||
      v27["classList"]["contains"]("grsai-group-header") ||
      v27["classList"]["contains"]("ppio-group-header") ||
      v27["classList"]["contains"]("apimart-group-header") ||
      v27["hasAttribute"]("data-custom-toggle") ||
      v27["hasAttribute"]("data-grsai-toggle") ||
      v27["hasAttribute"]("data-ppio-toggle") ||
      v27["hasAttribute"]("data-apimart-toggle");
  return v28 && !v26 ? _openSubmenu(v27) : (v27["click"](), true);
}
function _closeMenu() {
  const { menu: v29 } = _activeMenuState;
  (v29 &&
    (v29["classList"]["remove"]("show"),
    v29["querySelectorAll"](
      ".custom-submenu,\x20.grsai-submenu,\x20.ppio-submenu,\x20.apimart-submenu",
    )["forEach"]((v30) => {
      v30["style"]["display"] = "none";
    })),
    _resetState());
}
export function activateMenuKeyboard(v31) {
  if (!v31) return;
  (_resetState(),
    (_activeMenuState["menu"] = v31),
    (_activeMenuState["items"] = _getSelectableItems(v31)),
    (_activeMenuState["activeIndex"] = _activeMenuState["items"]["findIndex"](
      (v32) => v32["classList"]["contains"]("active"),
    )),
    _activeMenuState["activeIndex"] < 0 &&
      _activeMenuState["items"]["length"] > 0 &&
      ((_activeMenuState["activeIndex"] = 0),
      _activeMenuState["items"][0]["classList"]["add"]("active")));
}
function _getVisibleSubmenu(v33) {
  if (!v33) return null;
  const v34 = v33["querySelectorAll"](
    ".custom-submenu, .grsai-submenu, .ppio-submenu, .apimart-submenu",
  );
  for (const v35 of v34) {
    if (
      v35["style"]["display"] === "flex" ||
      v35["style"]["display"] === "block"
    )
      return v35;
  }
  return null;
}
export function handleFloatingMenuKeyboard(v36) {
  const { menu: v37, items: v38, activeIndex: v39 } = _activeMenuState;
  if (!_isActiveMenuUsable(v37)) return (_resetState(), false);
  if (_isEditableEventTarget(v36?.["target"])) return false;
  const v40 = _getVisibleSubmenu(v37),
    v41 = !!v40;
  v41 &&
    v40 !== _activeMenuState["submenu"] &&
    ((_activeMenuState["submenu"] = v40),
    (_activeMenuState["isSubmenu"] = true),
    (_activeMenuState["items"] = _getSelectableItems(v40)),
    (_activeMenuState["activeIndex"] = 0),
    _activeMenuState["items"]["forEach"]((v42, v43) => {
      v42["classList"]["toggle"]("active", v43 === 0);
    }));
  switch (v36["key"]) {
    case "ArrowDown":
      (v36["preventDefault"](),
        _updateActiveIndex(_activeMenuState["activeIndex"] + 1));
      return true;
    case "ArrowUp":
      (v36["preventDefault"](),
        _updateActiveIndex(_activeMenuState["activeIndex"] - 1));
      return true;
    case "ArrowRight":
      v36["preventDefault"]();
      !_activeMenuState["isSubmenu"] &&
        _activeMenuState["activeIndex"] >= 0 &&
        _openSubmenu(
          _activeMenuState["items"][_activeMenuState["activeIndex"]],
        );
      return true;
    case "ArrowLeft":
      v36["preventDefault"]();
      _activeMenuState["isSubmenu"] ? _closeSubmenu() : _closeMenu();
      return true;
    case "Enter":
      (v36["preventDefault"](), _selectActiveItem());
      return true;
    case "Escape":
      v36["preventDefault"]();
      isSubmenu ? _closeSubmenu() : _closeMenu();
      return true;
    default:
      return false;
  }
}
export function hasActiveFloatingMenu() {
  if (!_isActiveMenuUsable(_activeMenuState["menu"]))
    return (_resetState(), false);
  return true;
}
export function initFloatingMenuKeyboard() {
  document["addEventListener"](
    "keydown",
    (v44) => {
      hasActiveFloatingMenu() && handleFloatingMenuKeyboard(v44);
    },
    true,
  );
}

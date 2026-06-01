function escapeHtmlAttr(v0) {
  return String(v0 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/"/g, "&quot;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;");
}
function escapeHtmlText(v1) {
  return String(v1 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;");
}
function normalizeOptions(v2) {
  return (Array["isArray"](v2) ? v2 : [])["map"]((v3) => {
    if (v3 && typeof v3 === "object" && !Array["isArray"](v3)) {
      const v4 = String(v3["value"] ?? "");
      return {
        value: v4,
        label: String(v3["label"] ?? v4),
        selectedLabel: String(
          v3["selectedLabel"] ?? v3["displayLabel"] ?? v3["label"] ?? v4,
        ),
        tooltip: String(v3["tooltip"] || "")["trim"](),
        disabled: v3["disabled"] === true,
        attrs:
          v3["attrs"] && typeof v3["attrs"] === "object" ? v3["attrs"] : {},
      };
    }
    const v5 = String(v3 ?? "");
    return {
      value: v5,
      label: v5,
      selectedLabel: v5,
      tooltip: "",
      disabled: false,
      attrs: {},
    };
  });
}
function getSelectedOption(v6, v7) {
  const v8 = String(v7 ?? "");
  return v6["find"]((v9) => v9["value"] === v8) || v6[0] || null;
}
function renderExtraAttrs(v10 = {}) {
  return Object["entries"](v10)
    ["map"](([v11, v12]) => {
      const v13 = String(v11 || "")["trim"]();
      if (!v13) return "";
      if (v12 === false || v12 === null || v12 === undefined) return "";
      if (v12 === true) return "\x20" + escapeHtmlAttr(v13);
      return (
        "\x20" + escapeHtmlAttr(v13) + "=\x22" + escapeHtmlAttr(v12) + "\x22"
      );
    })
    ["join"]("");
}
function renderCaret() {
  return '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
}
export function renderToolbarUpMenu({
  fieldId: fieldId = "",
  value: value = "",
  options: options = [],
  wrapClass: wrapClass = "v2-expand-wrap",
  buttonClass: buttonClass = "v2-expand-toolbar-btn",
  triggerClass: triggerClass = "",
  labelClass: labelClass = "",
  menuClass: menuClass = "v2-expand-menu",
  itemClass: itemClass = "v2-expand-menu-item",
  openClass: openClass = "open",
  title: title = "",
  iconHtml: iconHtml = "",
  selectedLabel: selectedLabel = "",
  disabled: disabled = false,
  itemsOnly: itemsOnly = false,
  itemValueAttrs: itemValueAttrs = [],
} = {}) {
  const v14 = String(fieldId || "")["trim"](),
    v15 = normalizeOptions(options),
    v16 = getSelectedOption(v15, value),
    v17 = String(
      selectedLabel || v16?.["selectedLabel"] || v16?.["label"] || value || "",
    ),
    v18 = Array["isArray"](itemValueAttrs) ? itemValueAttrs : [],
    v19 = v15["map"]((v20) => {
      const v21 = v20["value"] === String(value ?? ""),
        v22 = disabled || v20["disabled"],
        v23 = v20["tooltip"]
          ? ' title="' +
            escapeHtmlAttr(v20["tooltip"]) +
            "\x22\x20data-tooltip=\x22" +
            escapeHtmlAttr(v20["tooltip"]) +
            "\x22"
          : "",
        v24 = v18["map"]((v25) => {
          const v26 = String(v25 || "")["trim"]();
          return v26
            ? "\x20" +
                escapeHtmlAttr(v26) +
                "=\x22" +
                escapeHtmlAttr(v20["value"]) +
                "\x22"
            : "";
        })["join"]("");
      return (
        '<div class="floating-menu-item image-toolbar-up-menu-item ' +
        escapeHtmlAttr(itemClass) +
        "\x20" +
        (v21 ? "active" : "") +
        "\x20" +
        (v22 ? "disabled" : "") +
        '" data-toolbar-up-menu-item data-toolbar-up-menu-field="' +
        escapeHtmlAttr(v14) +
        '" data-toolbar-up-menu-value="' +
        escapeHtmlAttr(v20["value"]) +
        '" data-toolbar-up-menu-label="' +
        escapeHtmlAttr(v20["selectedLabel"]) +
        "\x22\x20data-disabled=\x22" +
        (v22 ? "true" : "false") +
        "\x22" +
        v24 +
        v23 +
        renderExtraAttrs(v20["attrs"]) +
        '><span class="floating-menu-label">' +
        escapeHtmlText(v20["label"]) +
        "</span></div>"
      );
    })["join"]("");
  if (itemsOnly) return v19;
  const v27 = disabled ? ' disabled aria-disabled="true"' : "",
    v28 = title ? "\x20title=\x22" + escapeHtmlAttr(title) + "\x22" : "";
  return (
    '\n    <div class="' +
    escapeHtmlAttr(wrapClass) +
    "\x20image-toolbar-up-menu\x22\x20data-toolbar-up-menu=\x22" +
    escapeHtmlAttr(v14) +
    "\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22" +
    escapeHtmlAttr(buttonClass) +
    "\x20" +
    escapeHtmlAttr(triggerClass) +
    "\x20image-toolbar-up-menu-toggle\x20" +
    (disabled ? "is-disabled" : "") +
    '" data-toolbar-up-menu-toggle="' +
    escapeHtmlAttr(v14) +
    "\x22" +
    v28 +
    v27 +
    ">\n        " +
    iconHtml +
    '\n        <span class="' +
    escapeHtmlAttr(labelClass) +
    ' image-toolbar-up-menu-label" data-toolbar-up-menu-label>' +
    escapeHtmlText(v17) +
    "</span>\n        " +
    renderCaret() +
    '\n      </button>\n      <div class="floating-menu image-toolbar-up-menu-menu ' +
    escapeHtmlAttr(menuClass) +
    '" data-toolbar-up-menu-menu="' +
    escapeHtmlAttr(v14) +
    '" data-toolbar-up-menu-open-class="' +
    escapeHtmlAttr(openClass) +
    '">\n        ' +
    v19 +
    "\n      </div>\n    </div>"
  );
}
function getMenuOpenClass(v29) {
  return (
    String(v29?.["dataset"]?.["toolbarUpMenuOpenClass"] || "open")["trim"]() ||
    "open"
  );
}
function closeMenu(v30) {
  if (!v30?.["classList"]) return;
  (v30["classList"]["remove"](getMenuOpenClass(v30)),
    v30["classList"]["remove"]("open"),
    v30["classList"]["remove"]("show"));
}
function closeSiblingMenus(v31, v32 = null) {
  v31?.["querySelectorAll"]?.("[data-toolbar-up-menu-menu]")?.["forEach"](
    (v33) => {
      if (v33 !== v32) closeMenu(v33);
    },
  );
}
function syncMenuSelection({ menu: v34, item: v35, value: v36 }) {
  if (!v34 || !v35) return;
  v34["querySelectorAll"]?.("[data-toolbar-up-menu-item]")?.["forEach"](
    (v37) => {
      v37["classList"]?.["toggle"]?.(
        "active",
        String(v37["dataset"]?.["toolbarUpMenuValue"] ?? "") ===
          String(v36 ?? ""),
      );
    },
  );
  const v38 = v35["closest"]?.("[data-toolbar-up-menu]"),
    v39 = v38?.["querySelector"]?.("[data-toolbar-up-menu-label]");
  v39 &&
    (v39["textContent"] = String(
      v35["dataset"]?.["toolbarUpMenuLabel"] || v35["textContent"] || v36 || "",
    )["trim"]());
}
export function bindToolbarUpMenus(
  v40,
  { onSelect: v41, onBeforeOpen: v42 } = {},
) {
  if (!v40?.["addEventListener"]) return () => {};
  const v43 = (v44) => {
    const v45 = v44["target"]?.["closest"]?.("[data-toolbar-up-menu-toggle]");
    if (v45 && v40["contains"]?.(v45)) {
      if (v45["disabled"] === true) return;
      v44["stopPropagation"]?.();
      const v46 = v45["closest"]?.("[data-toolbar-up-menu]"),
        v47 = v46?.["querySelector"]?.("[data-toolbar-up-menu-menu]");
      if (!v47) return;
      const v48 = getMenuOpenClass(v47),
        v49 = !v47["classList"]?.["contains"]?.(v48);
      (v42?.({
        fieldId: v45["dataset"]?.["toolbarUpMenuToggle"] || "",
        trigger: v45,
        menu: v47,
        shouldOpen: v49,
      }),
        closeSiblingMenus(v40, v47),
        v47["classList"]?.["toggle"]?.(v48, v49));
      return;
    }
    const v50 = v44["target"]?.["closest"]?.("[data-toolbar-up-menu-item]");
    if (!v50 || !v40["contains"]?.(v50)) return;
    if (v50["dataset"]?.["disabled"] === "true") return;
    v44["stopPropagation"]?.();
    const v51 = v50["closest"]?.("[data-toolbar-up-menu-menu]"),
      v52 = v50["dataset"]?.["toolbarUpMenuValue"] || "";
    (syncMenuSelection({ menu: v51, item: v50, value: v52 }),
      closeMenu(v51),
      v41?.({
        fieldId: v50["dataset"]?.["toolbarUpMenuField"] || "",
        value: v52,
        item: v50,
        menu: v51,
        event: v44,
      }));
  };
  return (
    v40["addEventListener"]("click", v43),
    () => v40["removeEventListener"]("click", v43)
  );
}

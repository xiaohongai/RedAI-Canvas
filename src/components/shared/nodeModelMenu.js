const RIGHT_CHEVRON_HTML =
  "<svg\x20class=\x22node-menu-caret\x22\x20width=\x2210\x22\x20height=\x2210\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222.5\x22\x20aria-hidden=\x22true\x22><polyline\x20points=\x229\x2018\x2015\x2012\x209\x206\x22></polyline></svg>";
export function escapeNodeMenuHtml(v0) {
  return String(v0 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;")
    ["replace"](/"/g, "&quot;")
    ["replace"](/'/g, "&#39;");
}
function renderBadge(v1 = {}) {
  if (v1["badgeHtml"]) return v1["badgeHtml"];
  if (v1["vip"])
    return "<span\x20class=\x22floating-menu-badge\x20floating-menu-badge-warning\x22>VIP</span>";
  if (v1["disabled"])
    return '<span class="floating-menu-badge floating-menu-badge-danger">不可用</span>';
  return "";
}
function renderIcon(v2 = {}, v3 = 20) {
  if (v2["iconHtml"]) return v2["iconHtml"];
  if (!v2["icon"]) return "";
  const v4 = Number(v3) || 20,
    v5 = v4 <= 12 ? "node-menu-icon-small" : "node-menu-icon";
  return (
    '<img src="' +
    escapeNodeMenuHtml(v2["icon"]) +
    '" class="' +
    v5 +
    '" alt="' +
    escapeNodeMenuHtml(v2["iconAlt"] || v2["label"] || "") +
    "\x22>"
  );
}
function attrsFromObject(v6 = {}) {
  return Object["entries"](v6)
    ["filter"](([, v7]) => v7 !== undefined && v7 !== null && v7 !== false)
    ["map"](([v8, v9]) =>
      v9 === true
        ? "\x20" + escapeNodeMenuHtml(v8)
        : "\x20" +
          escapeNodeMenuHtml(v8) +
          "=\x22" +
          escapeNodeMenuHtml(v9) +
          "\x22",
    )
    ["join"]("");
}
export function renderNodeMenuItem(v10 = {}, v11 = {}) {
  const v12 = String(v11["activeModel"] || ""),
    v13 = String(v10["modelId"] ?? v10["value"] ?? ""),
    v14 = String(v10["provider"] ?? ""),
    v15 =
      v10["active"] === true ||
      (!!v13 && v12 === v13) ||
      (Array["isArray"](v10["aliases"]) && v10["aliases"]["includes"](v12)),
    v16 = [
      "floating-menu-item",
      "node-menu-item",
      v10["className"] || "",
      v15 ? "active" : "",
      v10["disabled"] ? "disabled" : "",
    ]
      ["filter"](Boolean)
      ["join"]("\x20"),
    v17 = {
      "data-value": v13 || undefined,
      "data-provider": v14 || undefined,
      "data-disabled":
        v10["disabledValue"] || (v10["disabled"] ? "true" : undefined),
      ...v10["attrs"],
    },
    v18 = escapeNodeMenuHtml(v10["label"] ?? v13),
    v19 = v10["subtitle"] || v10["description"];
  return (
    '<div class="' +
    v16 +
    "\x22" +
    attrsFromObject(v17) +
    ">\x0a\x20\x20\x20\x20" +
    renderIcon(v10) +
    '\n    <div class="fmi-content">\n      <div class="fmi-title">' +
    v18 +
    "</div>\x0a\x20\x20\x20\x20\x20\x20" +
    (v19
      ? "<div\x20class=\x22fmi-sub\x22>" + escapeNodeMenuHtml(v19) + "</div>"
      : "") +
    "\n    </div>\n    " +
    renderBadge(v10) +
    "\n  </div>"
  );
}
export function renderNodeMenuGroup(v20 = {}, v21 = {}) {
  const v22 = String(v20["id"] || "")["trim"](),
    v23 = v20["submenuClass"] || v22 + "-submenu",
    v24 = v20["headerClass"] || v22 + "-group-header",
    v25 = v20["toggleAttr"] || "data-" + v22 + "-toggle",
    v26 = [
      v24,
      "floating-menu-item",
      "node-menu-group-header",
      v20["className"] || "",
    ]
      ["filter"](Boolean)
      ["join"]("\x20"),
    v27 = { [v25]: true, "data-node-menu-submenu": "." + v23, ...v20["attrs"] },
    v28 =
      v20["itemsHtml"] ||
      (Array["isArray"](v20["items"])
        ? v20["items"]["map"]((v29) => renderNodeMenuItem(v29, v21))["join"]("")
        : "");
  return (
    "\x0a\x20\x20\x20\x20<div\x20class=\x22" +
    v26 +
    "\x22" +
    attrsFromObject(v27) +
    ">\x0a\x20\x20\x20\x20\x20\x20" +
    renderIcon(v20) +
    "\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22fmi-content\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22fmi-title\x22>" +
    escapeNodeMenuHtml(v20["label"] || v22) +
    "</div>\n        " +
    (v20["subtitle"]
      ? "<div\x20class=\x22fmi-sub\x22>" +
        escapeNodeMenuHtml(v20["subtitle"]) +
        "</div>"
      : "") +
    "\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20" +
    renderBadge(v20) +
    "\x0a\x20\x20\x20\x20\x20\x20" +
    (v20["chevron"] === false ? "" : RIGHT_CHEVRON_HTML) +
    '\n    </div>\n    <div class="node-model-submenu node-menu-submenu ' +
    escapeNodeMenuHtml(v23) +
    '">\n      ' +
    v28 +
    "\n    </div>"
  );
}
export function renderNodeModelMenu(v30 = {}) {
  const v31 = String(v30["activeModel"] || ""),
    v32 = Array["isArray"](v30["groups"]) ? v30["groups"] : [],
    v33 = Array["isArray"](v30["items"]) ? v30["items"] : [],
    v34 = [
      ...v33["map"]((v35) => renderNodeMenuItem(v35, { activeModel: v31 })),
      ...v32["map"]((v36) => renderNodeMenuGroup(v36, { activeModel: v31 })),
    ]["join"](""),
    v37 = [
      "floating-menu",
      "img-model-menu",
      "node-model-menu",
      v30["className"] || "",
    ]
      ["filter"](Boolean)
      ["join"]("\x20");
  return (
    '<div class="' +
    v37 +
    '" data-node-menu-kind="' +
    escapeNodeMenuHtml(v30["kind"] || "") +
    "\x22>" +
    v34 +
    "</div>"
  );
}
export function renderNodeModelTrigger({
  iconHtml: iconHtml = "",
  label: label = "",
  className: className = "",
  caretHtml: caretHtml = "",
} = {}) {
  const v38 = [
    "img-pill-btn",
    "img-model-btn-trigger",
    "node-model-trigger",
    className,
  ]
    ["filter"](Boolean)
    ["join"]("\x20");
  return (
    '<button type="button" class="' +
    v38 +
    "\x22>\x0a\x20\x20\x20\x20" +
    iconHtml +
    '\n    <span class="img-model-label">' +
    escapeNodeMenuHtml(label) +
    "</span>\n    " +
    caretHtml +
    "\n  </button>"
  );
}

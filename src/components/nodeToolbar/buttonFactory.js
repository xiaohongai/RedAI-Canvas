export function createToolbarIconButton({
  action: v0,
  tooltip: v1,
  label: v2,
  iconSvg: v3,
  extraClass: extraClass = "",
}) {
  const v4 = ["ftb-btn", "icon-only", extraClass, "act-" + v0]
    ["filter"](Boolean)
    ["join"]("\x20");
  return (
    '<button class="' +
    v4 +
    '" data-tooltip="' +
    v1 +
    "\x22\x20aria-label=\x22" +
    v2 +
    "\x22>" +
    v3 +
    "</button>"
  );
}
export function createToolbarDivider() {
  return "<div\x20class=\x22ftb-divider\x22></div>";
}
export function createToolbarHtml({ toolbarClass: v5, items: v6 }) {
  return (
    '<div class="node-floating-toolbar ' +
    v5 +
    '">\n    ' +
    v6["join"]("\n    ") +
    "\n</div>"
  );
}

export function appendToolbarActionMenuTitle(v0, v1) {
  const v2 = document["createElement"]("div");
  return (
    (v2["className"] = "node-toolbar-action-menu-title"),
    (v2["textContent"] = v1),
    v0["appendChild"](v2),
    v2
  );
}
export function createToolbarActionMenuItem(v3 = "") {
  const v4 = document["createElement"]("div");
  return (
    (v4["className"] = ["node-toolbar-action-menu-item", v3]
      ["filter"](Boolean)
      ["join"]("\x20")),
    v4
  );
}
export function createToolbarActionMenuIcon() {
  const v5 = document["createElement"]("div");
  return ((v5["className"] = "node-toolbar-action-menu-icon"), v5);
}
export function createRunningHubActionIcon() {
  const v6 = createToolbarActionMenuIcon(),
    v7 = document["createElement"]("img");
  return (
    (v7["className"] = "node-toolbar-action-provider-logo"),
    (v7["src"] = "images/RH.png"),
    (v7["alt"] = "runninghub"),
    v6["appendChild"](v7),
    v6
  );
}
export function createToolbarActionMenuBody() {
  const v8 = document["createElement"]("div");
  return ((v8["className"] = "node-toolbar-action-menu-body"), v8);
}
export function createToolbarActionTitleRow() {
  const v9 = document["createElement"]("div");
  return ((v9["className"] = "node-toolbar-action-title-row"), v9);
}
export function createToolbarActionTitle(v10) {
  const v11 = document["createElement"]("span");
  return (
    (v11["className"] = "node-toolbar-action-menu-item-title"),
    (v11["textContent"] = v10),
    v11
  );
}
export function createToolbarActionDescription(v12) {
  const v13 = document["createElement"]("span");
  return (
    (v13["className"] = "node-toolbar-action-menu-item-desc"),
    (v13["textContent"] = v12),
    v13
  );
}
export function createToolbarActionVipBadge(v14 = "VIP") {
  const v15 = document["createElement"]("span");
  return (
    (v15["className"] = "node-toolbar-action-vip-badge"),
    (v15["textContent"] = v14),
    v15
  );
}

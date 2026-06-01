const sidebarSubmenus = new Map();
let activeKey = "",
  globalsInstalled = false;
function containsTarget(v0, v1) {
  return !!v0 && (v0 === v1 || v0["contains"]?.(v1));
}
function shouldIgnorePointerDown(v2, v3) {
  if (typeof v2?.["ignorePointerDown"] !== "function") return false;
  return v2["ignorePointerDown"](v3) === true;
}
function isEntryOpen(v4) {
  if (!v4) return false;
  if (typeof v4["isOpen"] === "function") return v4["isOpen"]();
  return v4["panel"]?.["classList"]?.["contains"](v4["openClass"]) === true;
}
function applyDefaultOpen(v5) {
  (v5["panel"]?.["classList"]?.["add"](v5["openClass"]),
    v5["button"]?.["classList"]?.["add"](v5["activeClass"]),
    v5["button"]?.["setAttribute"]?.("aria-expanded", "true"));
}
function applyDefaultClose(v6) {
  (v6["panel"]?.["classList"]?.["remove"](v6["openClass"]),
    v6["button"]?.["classList"]?.["remove"](v6["activeClass"]),
    v6["button"]?.["setAttribute"]?.("aria-expanded", "false"));
}
function closeEntry(v7) {
  if (!v7) return;
  if (typeof v7["close"] === "function") v7["close"]();
  else applyDefaultClose(v7);
  (v7["button"]?.["classList"]?.["remove"](v7["activeClass"]),
    v7["button"]?.["setAttribute"]?.("aria-expanded", "false"));
  if (activeKey === v7["key"]) activeKey = "";
}
function installGlobals() {
  if (globalsInstalled) return;
  ((globalsInstalled = true),
    document["addEventListener"](
      "pointerdown",
      (v8) => {
        const v9 = sidebarSubmenus["get"](activeKey);
        if (!v9) return;
        if (containsTarget(v9["button"], v8["target"])) return;
        if (containsTarget(v9["panel"], v8["target"])) return;
        if (shouldIgnorePointerDown(v9, v8)) return;
        closeEntry(v9);
      },
      true,
    ),
    document["addEventListener"]("keydown", (v10) => {
      if (v10["key"] !== "Escape") return;
      const v11 = sidebarSubmenus["get"](activeKey);
      if (!v11) return;
      closeEntry(v11);
    }));
}
export function closeSidebarSubmenu(v12) {
  closeEntry(sidebarSubmenus["get"](v12));
}
export function closeAllSidebarSubmenus(v13 = "") {
  for (const [v14, v15] of sidebarSubmenus["entries"]()) {
    if (v14 !== v13) closeEntry(v15);
  }
}
export function openSidebarSubmenu(v16) {
  const v17 = sidebarSubmenus["get"](v16);
  if (!v17) return;
  (closeAllSidebarSubmenus(v16), (activeKey = v16));
  if (typeof v17["open"] === "function") v17["open"]();
  else applyDefaultOpen(v17);
  (v17["button"]?.["classList"]?.["add"](v17["activeClass"]),
    v17["button"]?.["setAttribute"]?.("aria-expanded", "true"));
}
export function toggleSidebarSubmenu(v18) {
  const v19 = sidebarSubmenus["get"](v18);
  if (!v19) return;
  if (activeKey === v18 && isEntryOpen(v19)) {
    closeEntry(v19);
    return;
  }
  openSidebarSubmenu(v18);
}
export function registerSidebarSubmenu({
  key: v20,
  button: v21,
  panel: v22,
  open: v23,
  close: v24,
  isOpen: v25,
  ignorePointerDown: v26,
  openClass: openClass = "show",
  activeClass: activeClass = "active",
} = {}) {
  if (!v20 || !v21 || !v22) return;
  installGlobals();
  const v27 = sidebarSubmenus["get"](v20);
  v27?.["button"] &&
    v27["clickHandler"] &&
    v27["button"]["removeEventListener"]?.("click", v27["clickHandler"]);
  v27?.["button"] &&
    v27["dblClickHandler"] &&
    v27["button"]["removeEventListener"]?.("dblclick", v27["dblClickHandler"]);
  const v28 = {
    key: v20,
    button: v21,
    panel: v22,
    open: v23,
    close: v24,
    isOpen: v25,
    ignorePointerDown: v26,
    openClass: openClass,
    activeClass: activeClass,
    clickHandler: null,
    dblClickHandler: null,
  };
  ((v28["clickHandler"] = (v29) => {
    (v29["preventDefault"](), v29["stopPropagation"]());
    if (Number(v29["detail"] || 0) > 1) return;
    toggleSidebarSubmenu(v20);
  }),
    (v28["dblClickHandler"] = (v30) => {
      (v30["preventDefault"](), v30["stopPropagation"](), closeEntry(v28));
    }),
    sidebarSubmenus["set"](v20, v28),
    v21["setAttribute"]?.("aria-haspopup", "menu"),
    v21["setAttribute"]?.("aria-expanded", isEntryOpen(v28) ? "true" : "false"),
    v21["addEventListener"]("click", v28["clickHandler"]),
    v21["addEventListener"]("dblclick", v28["dblClickHandler"]));
}

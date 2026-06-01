function hidePopup(v0) {
  if (!v0) return;
  if (v0["classList"]?.["contains"]("floating-menu")) {
    v0["classList"]["remove"]("show");
    return;
  }
  if (
    v0["classList"]?.["contains"]("rh-adv-panel") ||
    v0["classList"]?.["contains"]("rh-vram-adv-panel")
  ) {
    (v0["classList"]["remove"]("show"), (v0["style"]["display"] = ""));
    return;
  }
  v0["style"]["display"] = "none";
}
function showPopup(v1, v2 = "block") {
  if (!v1) return;
  if (v1["classList"]?.["contains"]("floating-menu")) {
    v1["classList"]["add"]("show");
    return;
  }
  v1["style"]["display"] = v2;
}
export function closeNodeFooterMenus(v3, v4 = null) {
  if (!v3) return;
  (v3["querySelectorAll"](
    ".node-model-menu, .img-model-menu, .floating-menu.show, .ui-schema-floating-menu.show",
  )["forEach"]((v5) => {
    if (v5 !== v4) v5["classList"]["remove"]("show");
  }),
    v3["querySelectorAll"](
      ".node-menu-submenu, .node-model-submenu, .ui-schema-popup, .img-ratio-popup, .rh-res-popup, .vid-duration-pop, .rh-adv-panel, .rh-vram-adv-panel",
    )["forEach"]((v6) => {
      if (v6 !== v4) hidePopup(v6);
    }));
}
export function positionNodeSubmenu(v7, v8) {
  if (!v7 || !v8) return;
  (showPopup(v8, "flex"), (v8["style"]["top"] = "0px"));
  const v9 = v7["closest"](".node-model-menu,\x20.img-model-menu");
  if (!v9) return;
  const v10 = v7["offsetTop"] || 0,
    v11 = Math["max"](0, v9["clientHeight"] - v8["offsetHeight"]);
  v8["style"]["top"] = Math["min"](v10, v11) + "px";
}
export function bindNodeModelMenuTrigger({
  root: v12,
  trigger: v13,
  menu: v14,
  closeOthers: v15,
  activateMenuKeyboard: v16,
} = {}) {
  if (!v12 || !v13 || !v14) return () => {};
  const v17 = (v18) => {
    v18["stopPropagation"]();
    const v19 = !v14["classList"]["contains"]("show");
    if (typeof v15 === "function") v15(v14);
    else closeNodeFooterMenus(v12, v14);
    (v14["classList"]["toggle"]("show", v19),
      v19 && typeof v16 === "function" && v16(v14));
  };
  return (
    v13["addEventListener"]("click", v17),
    () => v13["removeEventListener"]("click", v17)
  );
}
export function bindNodeSubmenus(v20, { delay: delay = 120 } = {}) {
  if (!v20) return () => {};
  const v21 = [],
    v22 = new Map(),
    v23 = v20["querySelectorAll"]("[data-node-menu-submenu]");
  return (
    v23["forEach"]((v24) => {
      const v25 = v24["dataset"]["nodeMenuSubmenu"] || "",
        v26 = v25 ? v20["querySelector"](v25) : null;
      if (!v26) return;
      const v27 = () => {
          (clearTimeout(v22["get"](v26)), positionNodeSubmenu(v24, v26));
        },
        v28 = () => {
          (clearTimeout(v22["get"](v26)),
            v22["set"](
              v26,
              setTimeout(() => {
                (hidePopup(v26), v22["delete"](v26));
              }, delay),
            ));
        };
      (v24["addEventListener"]("mouseenter", v27),
        v24["addEventListener"]("mouseleave", v28),
        v24["addEventListener"]("click", v27),
        v26["addEventListener"]("mouseenter", v27),
        v26["addEventListener"]("mouseleave", v28),
        v21["push"](() => {
          (clearTimeout(v22["get"](v26)),
            v24["removeEventListener"]("mouseenter", v27),
            v24["removeEventListener"]("mouseleave", v28),
            v24["removeEventListener"]("click", v27),
            v26["removeEventListener"]("mouseenter", v27),
            v26["removeEventListener"]("mouseleave", v28));
        }));
    }),
    () => v21["forEach"]((v29) => v29())
  );
}
export function bindNodeFooterController(v30, v31 = {}) {
  if (!v30) return () => {};
  const v32 = [];
  v32["push"](bindNodeSubmenus(v30));
  const v33 = () => closeNodeFooterMenus(v30);
  (v30["addEventListener"]("ui-schema-menu-before-open", v33),
    v32["push"](() =>
      v30["removeEventListener"]("ui-schema-menu-before-open", v33),
    ));
  const v34 = (v35) => {
    if (v30["contains"](v35["target"])) return;
    closeNodeFooterMenus(v30);
    if (typeof v31["onOutsideClose"] === "function") v31["onOutsideClose"]();
  };
  return (
    document?.["addEventListener"]?.("click", v34),
    v32["push"](() => document?.["removeEventListener"]?.("click", v34)),
    () => v32["forEach"]((v36) => v36())
  );
}

export function removeContextMenus({
  includeNodePicker: includeNodePicker = true,
} = {}) {
  (document["querySelectorAll"](".v2-canvas-ctx-menu")["forEach"]((v0) =>
    v0["remove"](),
  ),
    includeNodePicker &&
      document["querySelector"](".v2-node-picker")?.["remove"]());
}
function placeMenu(v1, v2, v3) {
  document["body"]["appendChild"](v1);
  const v4 = v1["offsetWidth"] || 240,
    v5 = v1["offsetHeight"] || 200,
    v6 = v2 + v4 > window["innerWidth"] ? v2 - v4 : v2,
    v7 = v3 + v5 > window["innerHeight"] ? v3 - v5 : v3;
  ((v1["style"]["left"] = v6 + "px"), (v1["style"]["top"] = v7 + "px"));
}
function placeSubmenu(v8, v9) {
  const v10 = v9["getBoundingClientRect"](),
    v11 = 214,
    v12 =
      v10["right"] + 4 + v11 > window["innerWidth"]
        ? v10["left"] - v11 - 4
        : v10["right"] + 4,
    v13 = Math["min"](
      v10["top"],
      window["innerHeight"] - v8["offsetHeight"] - 8,
    );
  ((v8["style"]["left"] = v12 + "px"), (v8["style"]["top"] = v13 + "px"));
}
function createSeparator(v14) {
  const v15 = document["createElement"]("div");
  return (
    (v15["className"] = "v2-menu-sep"),
    v15["addEventListener"]("mouseenter", v14),
    v15
  );
}
function createMenuRow(v16, { onActivate: v17, onEnter: v18 }) {
  const v19 =
      Array["isArray"](v16["subItems"]) && v16["subItems"]["length"] > 0,
    v20 = !!v16["kbd"],
    v21 = String(v16["desc"] || v16["subtitle"] || "")["trim"](),
    v22 = document["createElement"]("div");
  v22["className"] = [
    "v2-menu-row",
    v20 || v19 ? "v2-menu-row-split" : "",
    v21 ? "has-desc" : "",
  ]
    ["filter"](Boolean)
    ["join"]("\x20");
  const v23 = document["createElement"]("span");
  ((v23["className"] = [v19 ? "v2-menu-rowlabel" : "", v21 ? "v2-menu-lbl" : ""]
    ["filter"](Boolean)
    ["join"]("\x20")),
    (v23["textContent"] = v16["label"] || ""));
  if (v16["badge"]) {
    const v24 = document["createElement"]("span");
    ((v24["textContent"] = v16["badge"]),
      (v24["className"] = "v2-badge-beta"),
      v23["appendChild"](v24));
  }
  if (v21) {
    const v25 = document["createElement"]("span");
    v25["className"] = "v2-menu-txt-wrap";
    const v26 = document["createElement"]("span");
    ((v26["className"] = "v2-menu-sub"),
      (v26["textContent"] = v21),
      v25["appendChild"](v23),
      v25["appendChild"](v26),
      v22["appendChild"](v25));
  } else v22["appendChild"](v23);
  if (v19) {
    const v27 = document["createElement"]("span");
    ((v27["textContent"] = "▶"),
      (v27["className"] = "v2-menu-arrow v2-menu-arrow-ml8"),
      v22["appendChild"](v27));
  } else {
    if (v20) {
      const v28 = document["createElement"]("span");
      ((v28["className"] = "v2-menu-kbd"),
        (v28["textContent"] = v16["kbd"]),
        v22["appendChild"](v28));
    }
  }
  return (
    v22["addEventListener"]("mouseenter", () => v18(v22, v16)),
    !v19 &&
      v22["addEventListener"]("pointerdown", (v29) => {
        (v29["stopPropagation"](), v17(v16, v29));
      }),
    v22
  );
}
function markSidebarSubmenuOwner(v30, v31) {
  const v32 = String(v31 || "")["trim"]();
  if (v32) v30["dataset"]["sidebarSubmenuOwner"] = v32;
}
export function showContextMenu(v33, v34, v35, v36 = {}) {
  removeContextMenus({ includeNodePicker: v36["includeNodePicker"] !== false });
  const v37 = document["createElement"]("div");
  ((v37["className"] = v36["className"] || "v2-canvas-ctx-menu"),
    markSidebarSubmenuOwner(v37, v36["sidebarSubmenuOwner"]));
  const v38 = [],
    v39 = (v40 = 0) => {
      for (let v41 = v38["length"] - 1; v41 >= v40; v41--) {
        v38[v41]?.["remove"]();
      }
      v38["splice"](v40);
    },
    v42 = () => {
      (v39(0), v37["remove"]());
    },
    v43 = (v44, v45, v46) => {
      v39(v46);
      const v47 = document["createElement"]("div");
      ((v47["className"] = "v2-canvas-ctx-menu v2-submenu"),
        markSidebarSubmenuOwner(v47, v36["sidebarSubmenuOwner"]),
        v44["forEach"]((v48) => {
          if (v48 === "sep" || v48?.["type"] === "separator") {
            v47["appendChild"](createSeparator(() => v39(v46 + 1)));
            return;
          }
          v47["appendChild"](
            createMenuRow(v48, {
              onEnter: (v49, v50) => {
                Array["isArray"](v50["subItems"]) &&
                v50["subItems"]["length"] > 0
                  ? v43(v50["subItems"], v49, v46 + 1)
                  : v39(v46 + 1);
              },
              onActivate: (v51, v52) => {
                (v42(), v51["action"]?.(v52));
              },
            }),
          );
        }),
        document["body"]["appendChild"](v47),
        (v38[v46] = v47),
        placeSubmenu(v47, v45));
    };
  (v35["forEach"]((v53) => {
    if (v53 === "sep" || v53?.["type"] === "separator") {
      v37["appendChild"](createSeparator(() => v39(0)));
      return;
    }
    v37["appendChild"](
      createMenuRow(v53, {
        onEnter: (v54, v55) => {
          Array["isArray"](v55["subItems"]) && v55["subItems"]["length"] > 0
            ? v43(v55["subItems"], v54, 0)
            : v39(0);
        },
        onActivate: (v56, v57) => {
          (v42(), v56["action"]?.(v57));
        },
      }),
    );
  }),
    v37["addEventListener"]("mouseleave", (v58) => {
      !v38["some"]((v59) => v59?.["contains"](v58["relatedTarget"])) && v39(0);
    }),
    placeMenu(v37, v33, v34));
  const v60 = (v61) => {
    const v62 =
      v37["contains"](v61["target"]) ||
      v38["some"]((v63) => v63?.["contains"](v61["target"]));
    !v62 && (v42(), document["removeEventListener"]("pointerdown", v60, true));
  };
  return (
    requestAnimationFrame(() =>
      document["addEventListener"]("pointerdown", v60, true),
    ),
    { menu: v37, close: v42 }
  );
}

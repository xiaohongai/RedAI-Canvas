const IMAGE_TOOLBAR_ZONE_MAP = Object["freeze"]({
  "outside-primary": "outsidePrimary",
  "outside-secondary": "outsideSecondary",
  more: "more",
});
function getToolbarZones(v0) {
  return {
    outsidePrimary: v0["querySelector"]("[data-zone=\x22outside-primary\x22]"),
    outsideSecondary: v0["querySelector"](
      "[data-zone=\x22outside-secondary\x22]",
    ),
    more: v0["querySelector"]('[data-zone="more"]'),
  };
}
function collectToolbarActionButtons(v1, v2) {
  const v3 = new Map();
  return (
    v1["querySelectorAll"](".ftb-btn")["forEach"]((v4) => {
      if (v4["dataset"]["fixedToolbarButton"] === "1") return;
      const v5 = v2(v4);
      if (!v5 || v3["has"](v5)) return;
      v3["set"](v5, v4);
    }),
    v3
  );
}
function applyToolbarLayoutToDom({
  toolbarEl: v6,
  layoutInput: v7,
  imageToolbarActions: v8,
  normalizeImageToolbarLayout: v9,
  getToolbarActionFromButton: v10,
}) {
  const v11 = getToolbarZones(v6);
  if (!v11["outsidePrimary"] || !v11["outsideSecondary"] || !v11["more"])
    return;
  const v12 = v9(v7),
    v13 = collectToolbarActionButtons(v6, v10),
    v14 = new Set();
  for (const [v15, v16] of Object["entries"](v12)) {
    const v17 = v11[v15];
    if (!v17) continue;
    v16["forEach"]((v18) => {
      const v19 = v13["get"](v18);
      if (!v19) return;
      (v17["appendChild"](v19), v14["add"](v18));
    });
  }
  for (const v20 of v8) {
    if (v14["has"](v20)) continue;
    const v21 = v13["get"](v20);
    if (!v21) continue;
    v11["more"]["appendChild"](v21);
  }
  const v22 = v6["querySelector"](".v2-img-toolbar-main-divider");
  if (v22) {
    const v23 =
      v11["outsideSecondary"]["querySelectorAll"](".ftb-btn")["length"] > 0;
    v22["hidden"] = !v23;
  }
}
function readToolbarLayoutFromDom(v24, v25, v26, v27 = null) {
  const v28 = { outsidePrimary: [], outsideSecondary: [], more: [] },
    v29 = v27 && typeof v27 === "object" ? Object["entries"](v27) : [];
  if (v29["length"] > 0)
    return (
      v29["forEach"](([v30, v31]) => {
        if (!v28[v30] || !v31) return;
        v31["querySelectorAll"](".ftb-btn")["forEach"]((v32) => {
          const v33 = v25(v32);
          if (!v33) return;
          v28[v30]["push"](v33);
        });
      }),
      v26(v28)
    );
  return (
    v24["querySelectorAll"]("[data-zone]")["forEach"]((v34) => {
      const v35 = String(v34["getAttribute"]("data-zone") || "")["trim"](),
        v36 = IMAGE_TOOLBAR_ZONE_MAP[v35];
      if (!v36) return;
      v34["querySelectorAll"](".ftb-btn")["forEach"]((v37) => {
        const v38 = v25(v37);
        if (!v38) return;
        v28[v36]["push"](v38);
      });
    }),
    v26(v28)
  );
}
export function bindImageToolbarLayoutUi(v39, v40 = {}) {
  const {
      store: v41,
      getStateSnapshot: v42,
      getToolbarActionFromButton: v43,
    } = v40,
    v44 = v40["toolbarActions"] || v40["imageToolbarActions"] || [],
    v45 = v40["normalizeToolbarLayout"] || v40["normalizeImageToolbarLayout"],
    v46 = v40["serializeToolbarLayout"] || v40["serializeImageToolbarLayout"],
    v47 =
      typeof v40["getToolbarLayout"] === "function"
        ? v40["getToolbarLayout"]
        : (v48) => v48?.["ui"]?.["imageToolbarLayout"],
    v49 =
      typeof v40["setToolbarLayout"] === "function"
        ? v40["setToolbarLayout"]
        : (v50) => v41?.["setImageToolbarLayout"]?.(v50),
    v51 = new Set(
      Array["isArray"](v40["moreMenuStickyActions"])
        ? v40["moreMenuStickyActions"]
        : ["hd", "auto-subject", "multigrid"],
    ),
    v52 = getToolbarZones(v39),
    v53 = v39["querySelector"](".act-more-tools"),
    v54 = v39["querySelector"]("[data-role=\x22more-menu\x22]"),
    v55 = v39["querySelector"](".act-customize-tools");
  if (
    !v52["outsidePrimary"] ||
    !v52["outsideSecondary"] ||
    !v52["more"] ||
    !v53 ||
    !v54 ||
    !v55
  )
    return { closeMoreMenu() {} };
  applyToolbarLayoutToDom({
    toolbarEl: v39,
    layoutInput: v47(v42()),
    imageToolbarActions: v44,
    normalizeImageToolbarLayout: v45,
    getToolbarActionFromButton: v43,
  });
  let v56 = false,
    v57 = false,
    v58 = false,
    v59 = null,
    v60 = null,
    v61 = null,
    v62 = 0;
  const v63 = v54["parentNode"],
    v64 = v54["nextSibling"],
    v65 = () => {
      if (v62) cancelAnimationFrame(v62);
      ((v62 = 0),
        v54["classList"]["remove"]("is-portaled"),
        v54["removeAttribute"]("style"));
      if (v63 && v54["parentNode"] !== v63) {
        const v66 = v64 && v64["parentNode"] === v63 ? v64 : null;
        v63["insertBefore"](v54, v66);
      }
    },
    v67 = () => {
      if (!v56 || v54["hidden"] || !v39["isConnected"]) {
        v65();
        return;
      }
      const v68 = v39["getBoundingClientRect"]();
      (v68["width"] > 0 &&
        v68["height"] > 0 &&
        Object["assign"](v54["style"], {
          left: v68["left"] + v68["width"] / 2 + "px",
          top: v68["top"] - 10 + "px",
        }),
        (v62 = requestAnimationFrame(v67)));
    },
    v69 = () => {
      v54["parentNode"] !== document["body"] &&
        document["body"]["appendChild"](v54);
      v54["classList"]["add"]("is-portaled");
      if (v62) cancelAnimationFrame(v62);
      v62 = 0;
    },
    v70 = () => {
      const v71 = collectToolbarActionButtons(v39, v43);
      return (
        collectToolbarActionButtons(v54, v43)["forEach"]((v72, v73) =>
          v71["set"](v73, v72),
        ),
        v71
      );
    },
    v74 = (v75, v76) => {
      v75["classList"]["toggle"]("is-drop-target", !!v76);
    },
    v77 = (v78) => {
      if (v60 === v78) return;
      if (v60) v74(v60, false);
      v60 = v78 || null;
      if (v60) v74(v60, true);
    },
    v79 = () => {
      (v77(null), Object["values"](v52)["forEach"]((v80) => v74(v80, false)));
    },
    v81 = (v82) => {
      (v39["classList"]["toggle"]("is-toolbar-drag-active", !!v82),
        v54["classList"]["toggle"]("is-toolbar-drag-active", !!v82));
    },
    v83 = () =>
      Object["values"](v52)["flatMap"]((v84) =>
        Array["from"](v84?.["querySelectorAll"]?.(".ftb-btn") || [])["filter"](
          (v85) => v43(v85),
        ),
      ),
    v86 = (v87) => {
      const v88 = v83(),
        v89 = new Map(
          v88["map"]((v90) => [v90, v90["getBoundingClientRect"]?.() || {}]),
        ),
        v91 = v87();
      if (!v91) return false;
      return (
        v83()["forEach"]((v92) => {
          const v93 = v89["get"](v92);
          if (!v93) return;
          const v94 = v92["getBoundingClientRect"]?.() || {},
            v95 = Number(v93["left"] || 0) - Number(v94["left"] || 0),
            v96 = Number(v93["top"] || 0) - Number(v94["top"] || 0);
          if (v95 === 0 && v96 === 0) return;
          ((v92["style"]["transform"] =
            "translate(" + v95 + "px, " + v96 + "px)"),
            (v92["style"]["transition"] = "none"));
          const v97 =
            typeof requestAnimationFrame === "function"
              ? requestAnimationFrame
              : (v98) => setTimeout(v98, 0);
          v97(() => {
            ((v92["style"]["transform"] = ""),
              (v92["style"]["transition"] =
                "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)"));
          });
        }),
        true
      );
    },
    v99 = () => {
      const v100 = readToolbarLayoutFromDom(v39, v43, v45, v52),
        v101 = v46(v47(v42())),
        v102 = v46(v100);
      if (v101 === v102) return;
      v49(v100);
    },
    v103 = (v104, v105) => {
      const v106 = Array["from"](v104["querySelectorAll"](".ftb-btn"))[
        "filter"
      ]((v107) => v107 !== v59);
      for (const v108 of v106) {
        const v109 = v108["getBoundingClientRect"](),
          v110 = v109["left"] + v109["width"] / 2;
        if (v105 < v110) return v108;
      }
      return null;
    },
    v111 = (v112, v113) => {
      const v114 = v113["target"]?.["closest"]?.(".ftb-btn");
      if (v114 === v59) return v59;
      if (v114 && v112["contains"](v114) && v43(v114)) {
        const v115 = v114["getBoundingClientRect"](),
          v116 = v115["left"] + v115["width"] / 2;
        return Number(v113["clientX"] || 0) < v116
          ? v114
          : v114["nextElementSibling"];
      }
      return v103(v112, v113["clientX"]);
    },
    v117 = (v118, v119) => {
      if (!v59 || !v118) return false;
      if (v119 === v59) return false;
      const v120 = v119 || null;
      if (v59["parentNode"] === v118) {
        const v121 = v59["nextElementSibling"];
        if (v120 && v121 === v120) return false;
        if (!v120 && v59 === v118["lastElementChild"]) return false;
      }
      return v86(() => {
        return (
          v120 ? v118["insertBefore"](v59, v120) : v118["appendChild"](v59),
          true
        );
      });
    },
    v122 = (v123) => {
      ((v58 = !!v123), v55["classList"]["toggle"]("is-tooltip-pinned", v58));
    },
    v124 = (v125) => {
      ((v57 = !!v125),
        v39["classList"]["toggle"]("is-toolbar-customizing", v57),
        v54["classList"]["toggle"]("is-toolbar-customizing", v57),
        v122(v57),
        (v55["hidden"] = false),
        v55["classList"]["toggle"]("is-active", v57),
        (v55["textContent"] = v57 ? "完成" : "自定义工具"),
        v55["setAttribute"]("aria-label", v57 ? "完成自定义" : "自定义工具"),
        v70()["forEach"]((v126) => {
          ((v126["draggable"] = v57),
            v126["classList"]["toggle"]("is-toolbar-draggable", v57));
        }),
        !v57 &&
          ((v59 = null),
          v81(false),
          v79(),
          v70()["forEach"]((v127) => {
            (v127["classList"]["remove"]("is-toolbar-dragging"),
              v127["classList"]["remove"]("is-toolbar-dragging-capture"));
          })));
    },
    v128 = () => {
      if (!v56) return;
      ((v56 = false),
        v57 && (v65(), v99()),
        v124(false),
        v53["classList"]["remove"]("is-active"),
        (v54["hidden"] = true),
        v65(),
        v61 &&
          (document["removeEventListener"]("pointerdown", v61, true),
          (v61 = null)));
    },
    v129 = () => {
      if (v56) return;
      ((v56 = true),
        v53["classList"]["add"]("is-active"),
        v69(),
        (v54["hidden"] = false),
        v67(),
        !v61 &&
          ((v61 = (v130) => {
            !v39["contains"](v130["target"]) &&
              !v54["contains"](v130["target"]) &&
              v128();
          }),
          document["addEventListener"]("pointerdown", v61, true)));
    };
  (v53["addEventListener"]("click", (v131) => {
    (v131["preventDefault"](),
      v131["stopPropagation"](),
      v56 ? v128() : v129());
  }),
    v55["addEventListener"]("click", (v132) => {
      (v132["preventDefault"](), v132["stopPropagation"](), v129());
      if (v57) {
        (v124(false), v99());
        return;
      }
      v124(true);
    }));
  const v133 = (v134) => {
    const v135 = v134["target"]?.["closest"]?.(".ftb-btn");
    if (!v135) return;
    const v136 = v43(v135);
    if (!v136) return;
    if (v57) {
      (v134["preventDefault"](), v134["stopPropagation"]());
      return;
    }
    if (v52["more"]["contains"](v135)) {
      if (v51["has"](v136)) return;
      queueMicrotask(() => {
        if (!v39["isConnected"]) return;
        if (v57) return;
        v128();
      });
    }
  };
  return (
    v39["addEventListener"]("click", v133, true),
    v54["addEventListener"]("click", v133, true),
    collectToolbarActionButtons(v39, v43)["forEach"]((v137) => {
      if (v137["dataset"]["toolbarDnDBound"] === "1") return;
      ((v137["dataset"]["toolbarDnDBound"] = "1"),
        v137["addEventListener"]("dragstart", (v138) => {
          if (!v57) {
            v138["preventDefault"]();
            return;
          }
          ((v59 = v137),
            v81(true),
            v137["classList"]["add"]("is-toolbar-dragging-capture"),
            setTimeout(() => {
              if (v59 === v137) v137["classList"]["add"]("is-toolbar-dragging");
            }, 0),
            v138["dataTransfer"] &&
              ((v138["dataTransfer"]["effectAllowed"] = "move"),
              v138["dataTransfer"]["setData"](
                "text/plain",
                "image-toolbar-button",
              )));
        }),
        v137["addEventListener"]("dragend", () => {
          (v137["classList"]["remove"]("is-toolbar-dragging-capture"),
            v137["classList"]["remove"]("is-toolbar-dragging"),
            (v59 = null),
            v81(false),
            v79());
        }));
    }),
    Object["values"](v52)["forEach"]((v139) => {
      if (v139["dataset"]["toolbarDropBound"] === "1") return;
      ((v139["dataset"]["toolbarDropBound"] = "1"),
        v139["addEventListener"]("dragover", (v140) => {
          if (!v57 || !v59) return;
          (v140["preventDefault"](), v77(v139));
          const v141 = v111(v139, v140);
          v117(v139, v141);
        }),
        v139["addEventListener"]("dragleave", (v142) => {
          if (v59) {
            const v143 = v142["relatedTarget"] || null;
            if (!v143 || v139["contains"](v143)) return;
          }
          if (v60 === v139) v77(null);
        }),
        v139["addEventListener"]("drop", (v144) => {
          if (!v57 || !v59) return;
          (v144["preventDefault"](), v77(null), v99());
        }));
    }),
    { closeMoreMenu: v128 }
  );
}

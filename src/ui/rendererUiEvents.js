import { executeCommand } from "../core/interaction.js";
import { RENDERER_VIRTUALIZATION_CONFIG } from "../core/rendererVirtualization.js";
import { getAlignableSelectionNodes } from "../core/math.js";
import { executeSelectedGenerateButtons } from "../modules/groupExecution.js";
import { getSelectedMediaComposeKind } from "../modules/mediaComposeSelection.js";
let _inited = false,
  _guardInstalled = false;
const LABEL_RENAME_CLICK_THRESHOLD_PX = 5,
  NODE_LABEL_RENAMING_CLASS = "is-renaming-label";
function _formatNodeLabelText(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (!v1) return "";
  const v2 = /^[\x00-\x7F]*$/["test"](v1);
  if (v2 && v1["length"] > 20) return v1["slice"](0, 20) + "...";
  return v1;
}
function _escapeHtml(v3) {
  return String(v3 || "")["replace"](/[&<>"']/g, (v4) => {
    if (v4 === "&") return "&amp;";
    if (v4 === "<") return "&lt;";
    if (v4 === ">") return "&gt;";
    if (v4 === "\x22") return "&quot;";
    return "&#39;";
  });
}
function _stackHasRendererJs(v5) {
  const v6 = _getGuardCallsite(v5);
  if (!v6) return false;
  return (
    v6["includes"]("renderer.js") ||
    v6["includes"]("/renderer.js") ||
    v6["includes"]("\x5crenderer.js")
  );
}
function _getGuardCallsite(v7) {
  const v8 = String(v7 || "")["split"]("\x0a");
  for (const v9 of v8) {
    if (!v9["includes"]("at\x20")) continue;
    const v10 = v9["match"](/\(([^)]+)\)/),
      v11 = (v10 ? v10[1] : v9["replace"](/^\s*at\s+/, ""))["trim"]();
    if (!v11["includes"](".js")) continue;
    const v12 = v11["replace"](/:\d+:\d+$/, "");
    if (
      v12["includes"]("rendererUiEvents.js") ||
      v12["includes"]("/rendererUiEvents.js") ||
      v12["includes"]("\x5crendererUiEvents.js")
    )
      continue;
    return v12;
  }
  return "";
}
function _createGuardError() {
  return new Error(
    "[架构守卫] 禁止在 renderer.js 中绑定 DOM 事件，请迁移到 UI 层",
  );
}
export function installRendererEventBindingGuard() {
  if (_guardInstalled) return;
  _guardInstalled = true;
  const v13 = EventTarget["prototype"]["addEventListener"];
  EventTarget["prototype"]["addEventListener"] = function (...v14) {
    const v15 = new Error()["stack"];
    if (_stackHasRendererJs(v15)) throw _createGuardError();
    return v13["apply"](this, v14);
  };
  const v16 = (v17, v18) => {
      if (!v17) return;
      const v19 = Object["getOwnPropertyDescriptor"](v17, v18);
      if (!v19 || typeof v19["set"] !== "function") return;
      Object["defineProperty"](v17, v18, {
        configurable: v19["configurable"],
        enumerable: v19["enumerable"],
        get: v19["get"],
        set(v20) {
          const v21 = new Error()["stack"];
          if (_stackHasRendererJs(v21)) throw _createGuardError();
          return v19["set"]["call"](this, v20);
        },
      });
    },
    v22 = [
      "onclick",
      "onmouseenter",
      "onmouseleave",
      "onpointerdown",
      "onpointerup",
      "onpointermove",
    ];
  for (const v23 of v22) {
    (v16(globalThis["HTMLElement"]?.["prototype"], v23),
      v16(globalThis["SVGElement"]?.["prototype"], v23));
  }
}
export function initRendererUiEvents({ wrap: v24, store: v25 }) {
  if (_inited) return;
  _inited = true;
  const v26 = new WeakMap(),
    v27 = new Map(),
    v28 = {
      "ms-align-left": "left",
      "ms-align-h-center": "h-center",
      "ms-align-right": "right",
      "ms-align-top": "top",
      "ms-align-v-center": "v-center",
      "ms-align-bottom": "bottom",
      "ms-distribute-h": "distribute-h",
      "ms-distribute-v": "distribute-v",
    };
  let v29 = null,
    v30 = null,
    v31 = null,
    v32 = null,
    v33 = null,
    v34 = { x: 0, y: 0 };
  const v35 = () => {
      v25?.["setAlignPanelVisible"]?.(false);
    },
    v36 = (v37) => {
      const v38 = v37?.["closest"]?.(".v2-node");
      if (!v38) return "";
      return v38["dataset"]["nodeId"] || v38["id"] || "";
    },
    v39 = (v40) => {
      if (!v40) return;
      window["v2Renderer"]?.["pinNode"]?.(v40, "recent-ui");
      const v41 = v27["get"](v40);
      if (v41) clearTimeout(v41);
      const v42 = setTimeout(() => {
        (v27["delete"](v40),
          window["v2Renderer"]?.["unpinNode"]?.(v40, "recent-ui"));
      }, RENDERER_VIRTUALIZATION_CONFIG["recentPinMs"]);
      v27["set"](v40, v42);
    },
    v43 = (v44) => {
      if (!v44) return;
      window["v2Renderer"]?.["pinNode"]?.(v44, "focus");
    },
    v45 = (v46, v47) => {
      if (!v47) return;
      setTimeout(() => {
        const v48 = document["activeElement"];
        if (v46 && v48 && v46["contains"](v48)) return;
        window["v2Renderer"]?.["unpinNode"]?.(v47, "focus");
      }, 0);
    },
    v49 = (v50, v51) => {
      const v52 = document["querySelector"](
        'g.connection-group[data-conn-id="' + v50 + "\x22]",
      );
      if (!v52) return;
      (v51
        ? v52["classList"]["add"]("connection-highlighted")
        : v52["classList"]["remove"]("connection-highlighted"),
        v52["querySelectorAll"](".connection-delete-btn")["forEach"]((v52a) =>
          v52a["classList"]["toggle"]("show-scissor", !!v51),
        ));
    },
    v53 = () => {
      (clearTimeout(v32), clearTimeout(v33), (v32 = null), (v33 = null));
      v31 && v49(v31, false);
      ((v30 = null), (v31 = null));
      if (v29) v29["style"]["display"] = "none";
    },
    v54 = () => {
      if (v29) return v29;
      ((v29 = document["createElement"]("div")),
        (v29["id"] = "v2-conn-scissor-btn"),
        (v29["className"] = "conn-scissor-btn"));
      const v55 = "http://www.w3.org/2000/svg",
        v56 = document["createElementNS"](v55, "svg");
      (v56["setAttribute"]("width", "16"),
        v56["setAttribute"]("height", "16"),
        v56["setAttribute"]("viewBox", "0 0 24 24"),
        v56["setAttribute"]("fill", "none"),
        v56["setAttribute"]("stroke", "currentColor"),
        v56["setAttribute"]("stroke-width", "2.5"),
        v56["setAttribute"]("stroke-linecap", "round"),
        v56["setAttribute"]("stroke-linejoin", "round"));
      const v57 = document["createElementNS"](v55, "circle");
      (v57["setAttribute"]("cx", "6"),
        v57["setAttribute"]("cy", "6"),
        v57["setAttribute"]("r", "3"));
      const v58 = document["createElementNS"](v55, "circle");
      (v58["setAttribute"]("cx", "6"),
        v58["setAttribute"]("cy", "18"),
        v58["setAttribute"]("r", "3"));
      const v59 = document["createElementNS"](v55, "line");
      (v59["setAttribute"]("x1", "20"),
        v59["setAttribute"]("y1", "4"),
        v59["setAttribute"]("x2", "8.12"),
        v59["setAttribute"]("y2", "15.88"));
      const v60 = document["createElementNS"](v55, "line");
      (v60["setAttribute"]("x1", "14.47"),
        v60["setAttribute"]("y1", "14.48"),
        v60["setAttribute"]("x2", "20"),
        v60["setAttribute"]("y2", "20"));
      const v61 = document["createElementNS"](v55, "line");
      return (
        v61["setAttribute"]("x1", "8.12"),
        v61["setAttribute"]("y1", "8.12"),
        v61["setAttribute"]("x2", "12"),
        v61["setAttribute"]("y2", "12"),
        v56["appendChild"](v57),
        v56["appendChild"](v58),
        v56["appendChild"](v59),
        v56["appendChild"](v60),
        v56["appendChild"](v61),
        v29["appendChild"](v56),
        (v29["style"]["position"] = "fixed"),
        (v29["style"]["display"] = "none"),
        (v29["style"]["zIndex"] = "99999"),
        (v29["style"]["transform"] = "translate(-50%, -50%)"),
        (v29["style"]["pointerEvents"] = "auto"),
        document["body"]["appendChild"](v29),
        v29["addEventListener"]("pointerdown", (v62) =>
          v62["stopPropagation"](),
        ),
        v29["addEventListener"]("click", (v63) => {
          (v63["stopPropagation"](),
            v31 && (executeCommand("delete_edge", { id: v31 }), v53()));
        }),
        v29["addEventListener"]("mouseenter", () => {
          (clearTimeout(v33), (v33 = null));
        }),
        v29["addEventListener"]("mouseleave", () => {
          v53();
        }),
        v29
      );
    },
    v64 = (v65, v66) => {
      const v67 = v54();
      ((v67["style"]["left"] = v65 + "px"), (v67["style"]["top"] = v66 + "px"));
    },
    v68 = (v69) => {
      ((v30 = v69),
        clearTimeout(v32),
        clearTimeout(v33),
        (v33 = null),
        v54(),
        (v32 = setTimeout(() => {
          v30 === v69 &&
            ((v31 = v69),
            v49(v69, true),
            v64(v34["x"], v34["y"]),
            (v29["style"]["display"] = "flex"));
        }, 300)));
    },
    v70a = (v70b) =>
      v70b?.["closest"]?.("g.connection-group[data-conn-id]")?.[
        "getAttribute"
      ]?.("data-conn-id") || "",
    v70 = (v71, v72) => {
      const v73 = v54();
      if (v72 && (v72 === v73 || v73["contains"](v72))) return;
      if (v30 === v71) v30 = null;
      (clearTimeout(v32),
        (v32 = null),
        (v33 = setTimeout(() => {
          if (v31 === v71) v53();
        }, 100)));
    };
  (v25?.["subscribeRaw"] &&
    v25["subscribeRaw"]((v74) => {
      if (!v31) return;
      if (!v74?.["edges"]?.[v31]) v53();
    }),
    document["addEventListener"](
      "pointerdown",
      (v75) => {
        const v76 = v36(v75["target"]);
        if (v76) v39(v76);
        const v77 =
          v75["target"]?.["closest"]?.('[data-ui-stop="1"]') ||
          v75["target"]?.["closest"]?.('.node-label[contenteditable="true"]');
        if (v77) v75["stopPropagation"]();
      },
      true,
    ),
    document["addEventListener"](
      "focusin",
      (v78) => {
        const v79 = v78["target"]?.["closest"]?.(".v2-node"),
          v80 = v79?.["dataset"]?.["nodeId"] || v79?.["id"] || "";
        if (v80) v43(v80);
      },
      true,
    ),
    document["addEventListener"](
      "focusout",
      (v81) => {
        const v82 = v81["target"]?.["closest"]?.(".v2-node"),
          v83 = v82?.["dataset"]?.["nodeId"] || v82?.["id"] || "";
        if (v83) v45(v82, v83);
      },
      true,
    ),
    document["addEventListener"]("pointerdown", (v84) => {
      const v85 = v84["target"]?.["closest"]?.(".node-label[data-node-id]");
      if (!v85) return;
      if (v85["getAttribute"]("contenteditable") === "true") {
        v84["stopPropagation"]();
        return;
      }
      v26["set"](v85, { x: v84["clientX"], y: v84["clientY"] });
    }),
    document["addEventListener"]("keyup", (v86) => {
      if (v86["key"] === "Control") v53();
    }),
    document["addEventListener"]("click", (v87) => {
      const v87a = v87["target"]?.["closest"]?.(".connection-delete-btn");
      if (v87a) {
        const v87b =
          v87a["closest"]("g.connection-group[data-conn-id]")?.[
            "getAttribute"
          ]?.("data-conn-id") || "";
        if (v87b) {
          (v87["stopPropagation"](),
            executeCommand("delete_edge", { id: v87b }),
            v53());
        }
        return;
      }
      const v88 = v87["target"]?.["closest"]?.(
        '.v2-pick-connect-banner [data-ui-action="exit-pick-connect"]',
      );
      if (v88) {
        (v87["stopPropagation"](),
          executeCommand("set_pick_connect_mode", { active: false }));
        return;
      }
      const v89 = v87["target"]?.["closest"]?.(
        "#v2-picker\x20button[data-node-type]",
      );
      if (v89) {
        v87["stopPropagation"]();
        const v90 = v25?.["getState"]?.(),
          v91 = v90?.["picker"],
          v92 = v89["dataset"]["nodeType"],
          v93 = Number(v89["dataset"]["width"]) || 300,
          v94 = Number(v89["dataset"]["height"]) || 300,
          v95 = v89["dataset"]["defaultLabel"] || "New Node";
        v91 &&
          v91["visible"] &&
          (executeCommand("create_node", {
            type: v92,
            x: v91["x"],
            y: v91["y"],
            width: v93,
            height: v94,
            label: v95,
            content: "",
          }),
          executeCommand("hide_picker"));
        return;
      }
      const v96 = v87["target"]?.["closest"]?.(
        "#v2-align-center-panel button[data-ui-action]",
      );
      if (v96) {
        v87["stopPropagation"]();
        if (v96["disabled"]) return;
        const v97 = v28[v96["dataset"]["uiAction"]];
        if (!v97) return;
        const v98 = v25?.["getState"]?.();
        if (v98?.["ui"]?.["alignFeatureEnabled"] === false) {
          v35();
          return;
        }
        executeCommand("align_nodes", { mode: v97 });
        return;
      }
      const v99 = v87["target"]?.["closest"]?.(
        ".v2-multi-select-tab button[data-ui-action]",
      );
      if (v99) {
        v87["stopPropagation"]();
        if (v99["disabled"]) return;
        const v100 = v99["dataset"]["uiAction"];
        if (v100 === "ms-run-selected") {
          const v101 = v25?.["getState"]?.(),
            v102 = v101?.["selectedNodeIds"] || [];
          v102["length"] > 0 &&
            executeSelectedGenerateButtons({ selectedIds: v102, state: v101 });
          return;
        }
        if (v100 === "ms-asset") {
          const v103 = v25?.["getState"]?.()?.["selectedNodeIds"] || [];
          v103["length"] > 0 &&
            import("../modules/AssetManager.js")["then"](
              ({ assetManager: v104 }) => {
                v104["showCreatePanel"](v103, v99);
              },
            );
          return;
        }
        if (v100 === "ms-group") {
          const v105 = v25?.["getState"]?.()?.["selectedNodeIds"] || [];
          v105["length"] >= 2 && executeCommand("group", { ids: v105 });
          return;
        }
        if (v100 === "ms-create-collage") {
          const v106 = v25?.["getState"]?.()?.["selectedNodeIds"] || [];
          v106["length"] >= 2 &&
            executeCommand("create_collage_from_selection", { ids: v106 });
          return;
        }
        if (v100 === "ms-compose-video") {
          const v107 = v25?.["getState"]?.(),
            v108 = v107?.["selectedNodeIds"] || [];
          v108["length"] >= 2 &&
            import("../modules/VideoComposeController.js")["then"](
              ({
                composeSelectedAudios: v109,
                composeSelectedVideos: v110,
              }) => {
                const v111 =
                  getSelectedMediaComposeKind(v107?.["nodes"] || {}, v108) ||
                  v99["dataset"]["composeKind"];
                v111 === "audio" ? v109(v108, v99) : v110(v108, v99);
              },
            );
          return;
        }
        if (v100 === "ms-reset-image-size") {
          const v112 = v25?.["getState"]?.()?.["selectedNodeIds"] || [];
          v112["length"] > 0 &&
            executeCommand("reset_source_media_size", { ids: v112 });
          return;
        }
        return;
      }
      !v87["target"]?.["closest"]?.("#v2-align-center-panel") && v35();
      const v113 = v87["target"]?.["closest"]?.(
        "#v2-context-menu button[data-cmd]",
      );
      if (v113) {
        v87["stopPropagation"]();
        const v114 = v113["dataset"]["cmd"],
          v115 = v113["dataset"]["cmdData"];
        let v116 = undefined;
        if (v115)
          try {
            v116 = JSON["parse"](v115);
          } catch {}
        v114 && (executeCommand(v114, v116), v25?.["hideContextMenu"]?.());
        return;
      }
      const v117 = v87["target"]?.["closest"]?.(".node-label[data-node-id]");
      if (v117) {
        if (v117["getAttribute"]("contenteditable") === "true") return;
        const v118 = v26["get"](v117) || {
            x: v87["clientX"],
            y: v87["clientY"],
          },
          v119 = v87["clientX"] - v118["x"],
          v120 = v87["clientY"] - v118["y"];
        if (
          Math["sqrt"](v119 * v119 + v120 * v120) >
          LABEL_RENAME_CLICK_THRESHOLD_PX
        )
          return;
        v87["stopPropagation"]();
        const v121 = v117["dataset"]["defaultName"] || "节点",
          v122 = v117["dataset"]["fullName"] || "",
          v123 = v117["closest"](".v2-node");
        ((v117["textContent"] = v122 || v121),
          (v117["contentEditable"] = "true"));
        if (v123) v123["classList"]["add"](NODE_LABEL_RENAMING_CLASS);
        v117["focus"]();
      }
    }),
    document["addEventListener"]("keydown", (v124) => {
      const v125 = v124["target"]?.["closest"]?.(".node-label[data-node-id]");
      if (!v125) return;
      if (v125["getAttribute"]("contenteditable") !== "true") return;
      v124["key"] === "Enter" && (v124["preventDefault"](), v125["blur"]());
    }),
    document["addEventListener"]("focusout", (v126) => {
      const v127 = v126["target"]?.["closest"]?.(".node-label[data-node-id]");
      if (!v127) return;
      if (v127["getAttribute"]("contenteditable") !== "true") return;
      const v128 = v127["dataset"]["defaultName"] || "节点",
        v129 = v127["dataset"]["nodeId"],
        v130 = v127["dataset"]["isBeta"] === "1",
        v131 = v127["closest"](".v2-node"),
        v132 =
          v127["innerText"]
            ["trim"]()
            ["replace"](/Beta\s*$/i, "")
            ["trim"]() || v128;
      v127["contentEditable"] = "false";
      if (v131) v131["classList"]["remove"](NODE_LABEL_RENAMING_CLASS);
      if (v129) executeCommand("rename_node", { id: v129, name: v132 });
      const v133 = _formatNodeLabelText(v132);
      ((v127["dataset"]["fullName"] = v132),
        (v127["title"] = v132 || "点击重命名"));
      if (v130) {
        (v127["replaceChildren"](),
          v127["appendChild"](document["createTextNode"](v133 || v128)));
        const v134 = document["createElement"]("span");
        (Object["assign"](v134["style"], {
          fontSize: "10px",
          fontWeight: "700",
          color: "var(--red)",
          background: "var(--red-10)",
          border: "1px solid var(--red-30)",
          borderRadius: "10px",
          padding: "1px 6px",
          marginLeft: "5px",
          verticalAlign: "middle",
          letterSpacing: "0.4px",
        }),
          (v134["textContent"] = "Beta"),
          v127["appendChild"](v134));
      } else v127["textContent"] = v133 || v128;
    }),
    document["addEventListener"]("pointerover", (v135) => {
      const v136 = v70a(v135["target"]);
      if (v136) {
        const v136a = v135["target"]?.["closest"]?.(
          "g.connection-group[data-conn-id]",
        );
        if (
          v136a &&
          v135["relatedTarget"] &&
          v136a["contains"](v135["relatedTarget"])
        )
          return;
        v68(v136);
        return;
      }
      const v137 = v135["target"]?.["closest"]?.(
        "#v2-picker button[data-node-type]",
      );
      if (v137) {
        v137["style"]["background"] = "var(--blue-25)";
        return;
      }
      const v138 = v135["target"]?.["closest"]?.("#v2-context-menu\x20button");
      if (v138) {
        v138["style"]["background"] = "var(--blue-20)";
        return;
      }
      const v139 = v135["target"]?.["closest"]?.(
        ".v2-multi-select-tab\x20button[data-ui-action]",
      );
      if (v139) {
        v139["style"]["background"] = "var(--white-10)";
        return;
      }
    }),
    document["addEventListener"]("pointerout", (v140) => {
      const v141 = v70a(v140["target"]);
      if (v141) {
        const v141a = v140["target"]?.["closest"]?.(
          "g.connection-group[data-conn-id]",
        );
        if (
          v141a &&
          v140["relatedTarget"] &&
          v141a["contains"](v140["relatedTarget"])
        )
          return;
        v70(v141, v140["relatedTarget"]);
        return;
      }
      const v142 = v140["target"]?.["closest"]?.(
        "#v2-picker button[data-node-type]",
      );
      if (v142) {
        v142["style"]["background"] = "var(--blue-10)";
        return;
      }
      const v143 = v140["target"]?.["closest"]?.("#v2-context-menu button");
      if (v143) {
        v143["style"]["background"] = "transparent";
        return;
      }
      const v144 = v140["target"]?.["closest"]?.(
        ".v2-multi-select-tab button[data-ui-action]",
      );
      if (v144) {
        v144["style"]["background"] = "transparent";
        return;
      }
    }),
    document["addEventListener"]("pointermove", (v145) => {
      ((v34["x"] = v145["clientX"]), (v34["y"] = v145["clientY"]));
      if (!v31 || !v29 || v29["style"]["display"] === "none") return;
      v64(v145["clientX"], v145["clientY"]);
    }),
    v24?.["addEventListener"]?.("pointerdown", (v146) => {
      const v147 = v146["target"]?.["closest"]?.('[data-ui-stop="1"]');
      if (v147) v146["stopPropagation"]();
    }),
    window["addEventListener"]("v2-align-feature-changed", () => {
      v35();
    }),
    v25?.["subscribeSelector"]?.(
      (v148) => ({
        enabled: v148?.["ui"]?.["alignFeatureEnabled"] !== false,
        alignableCount: getAlignableSelectionNodes(
          v148?.["nodes"] || {},
          Array["isArray"](v148?.["selectedNodeIds"])
            ? v148["selectedNodeIds"]
            : [],
        )["length"],
      }),
      ({ enabled: v149, alignableCount: v150 }) => {
        (!v149 || v150 < 2) && v35();
      },
    ));
}

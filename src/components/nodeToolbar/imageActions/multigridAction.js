export function bindImageMultigridAction(v0) {
  const {
      toolbarEl: v1,
      nodeId: v2,
      getStateSnapshot: v3,
      store: v4,
      generateId: v5,
      buildStoryboardNodePayload: v6,
      computePreparedStoryboardSize: v7,
      resolveNearestStoryboardAspect: v8,
      calcSafeSpawnPosNearNode: v9,
      executeGridCrop: v10,
      prepareGridCells: v11,
      createViewportSnapshotTracker: v12,
    } = v0,
    v13 = v1["querySelector"](".act-multigrid");
  if (v13) {
    const v14 = (v15) => {
      const v16 = v15?.["closest"]?.(".v2-img-toolbar-more-menu"),
        v17 = v16?.["getBoundingClientRect"]?.(),
        v18 = v15["getBoundingClientRect"]();
      if (v17 && v17["width"] > 0 && v17["height"] > 0) {
        const v19 = {
            left: v18["left"] + v18["width"] / 2,
            top: v17["top"] - 12,
          },
          v20 = () => v19;
        return ((v20["isFixed"] = true), v20);
      }
      const v21 = () => {
        const v22 = v15["getBoundingClientRect"]();
        return { left: v22["left"] + v22["width"] / 2, top: v22["top"] - 12 };
      };
      return ((v21["isFixed"] = false), v21);
    };
    v13["addEventListener"]("click", (v23) => {
      (v23["stopPropagation"](), v23["preventDefault"]());
      const v24 = document["querySelector"](".v2-multigrid-popup");
      if (v24) {
        const v25 =
            v24["__v2MultigridAnchorBtn"] &&
            v24["__v2MultigridAnchorBtn"] === v13,
          v26 =
            typeof v24["__v2MultigridClose"] === "function"
              ? v24["__v2MultigridClose"]
              : () => v24["remove"]();
        v26();
        if (v25) return;
      }
      const v27 = document["createElement"]("div");
      ((v27["className"] =
        "v2-multigrid-popup node-toolbar-action-menu node-toolbar-action-menu--fit"),
        (v27["__v2MultigridAnchorBtn"] = v13));
      const v28 = v14(v13),
        v29 = v28();
      Object["assign"](v27["style"], {
        position: "fixed",
        left: v29["left"] + "px",
        top: v29["top"] + "px",
        transform: "translate(-50%, calc(-100% + 10px))",
        opacity: "0",
        pointerEvents: "none",
      });
      const v30 = document["createElement"]("div");
      ((v30["className"] = "node-toolbar-action-menu-title"),
        (v30["textContent"] = "选择宫格"),
        v27["appendChild"](v30));
      const v31 = [
          {
            id: "grid-4",
            title: "4宫格",
            desc: "2×2 网格",
            cols: 2,
            rows: 2,
            svgElements: [
              {
                tag: "rect",
                attrs: { x: "3", y: "3", width: "7", height: "7" },
              },
              {
                tag: "rect",
                attrs: { x: "14", y: "3", width: "7", height: "7" },
              },
              {
                tag: "rect",
                attrs: { x: "14", y: "14", width: "7", height: "7" },
              },
              {
                tag: "rect",
                attrs: { x: "3", y: "14", width: "7", height: "7" },
              },
            ],
          },
          {
            id: "grid-9",
            title: "9宫格",
            desc: "3×3 网格",
            cols: 3,
            rows: 3,
            svgElements: [
              {
                tag: "rect",
                attrs: { x: "3", y: "3", width: "4", height: "4" },
              },
              {
                tag: "rect",
                attrs: { x: "10", y: "3", width: "4", height: "4" },
              },
              {
                tag: "rect",
                attrs: { x: "17", y: "3", width: "4", height: "4" },
              },
              {
                tag: "rect",
                attrs: { x: "3", y: "10", width: "4", height: "4" },
              },
              {
                tag: "rect",
                attrs: { x: "10", y: "10", width: "4", height: "4" },
              },
              {
                tag: "rect",
                attrs: { x: "17", y: "10", width: "4", height: "4" },
              },
              {
                tag: "rect",
                attrs: { x: "3", y: "17", width: "4", height: "4" },
              },
              {
                tag: "rect",
                attrs: { x: "10", y: "17", width: "4", height: "4" },
              },
              {
                tag: "rect",
                attrs: { x: "17", y: "17", width: "4", height: "4" },
              },
            ],
          },
          {
            id: "grid-16",
            title: "16宫格",
            desc: "4×4\x20网格",
            cols: 4,
            rows: 4,
            svgElements: [
              { tag: "path", attrs: { d: "M3 3h18v18H3z" } },
              { tag: "path", attrs: { d: "M7.5\x203v18" } },
              { tag: "path", attrs: { d: "M12 3v18" } },
              { tag: "path", attrs: { d: "M16.5\x203v18" } },
              { tag: "path", attrs: { d: "M3 7.5h18" } },
              { tag: "path", attrs: { d: "M3 12h18" } },
              { tag: "path", attrs: { d: "M3 16.5h18" } },
            ],
          },
          {
            id: "grid-25",
            title: "25宫格",
            desc: "5×5 网格",
            cols: 5,
            rows: 5,
            svgElements: [
              { tag: "path", attrs: { d: "M3 3h18v18H3z" } },
              { tag: "path", attrs: { d: "M6.6 3v18" } },
              { tag: "path", attrs: { d: "M10.2\x203v18" } },
              { tag: "path", attrs: { d: "M13.8 3v18" } },
              { tag: "path", attrs: { d: "M17.4 3v18" } },
              { tag: "path", attrs: { d: "M3 6.6h18" } },
              { tag: "path", attrs: { d: "M3 10.2h18" } },
              { tag: "path", attrs: { d: "M3 13.8h18" } },
              { tag: "path", attrs: { d: "M3 17.4h18" } },
            ],
          },
        ],
        v32 = "http://www.w3.org/2000/svg",
        v33 = 5,
        v34 = (v35, v36, v37) => {
          const v38 = document["createElementNS"](v32, "svg");
          return (
            v38["setAttribute"]("viewBox", "0 0 24 24"),
            v38["setAttribute"]("fill", "none"),
            v38["setAttribute"]("stroke", "currentColor"),
            v38["setAttribute"]("stroke-width", String(v35)),
            v38["setAttribute"]("width", String(v36)),
            v38["setAttribute"]("height", String(v37)),
            v38
          );
        },
        v39 = (v40, v41) => {
          for (const v42 of v41 || []) {
            if (!v42 || !v42["tag"] || !v42["attrs"]) continue;
            const v43 = document["createElementNS"](v32, v42["tag"]);
            for (const [v44, v45] of Object["entries"](v42["attrs"])) {
              v43["setAttribute"](v44, String(v45));
            }
            v40["appendChild"](v43);
          }
        },
        v46 = (v47) => {
          v47["replaceChildren"]();
          const v48 = v34(2, 16, 16),
            v49 = document["createElementNS"](v32, "path");
          (v49["setAttribute"](
            "d",
            "M6\x202v14a2\x202\x200\x200\x200\x202\x202h14M18\x2022V8a2\x202\x200\x200\x200-2-2H2",
          ),
            v48["appendChild"](v49));
          const v50 = document["createElement"]("span");
          ((v50["textContent"] = "裁剪"),
            v47["appendChild"](v48),
            v47["appendChild"](v50));
        },
        v51 = (v52) => {
          v52["replaceChildren"]();
          const v53 = v34(2, 16, 16),
            v54 = document["createElementNS"](v32, "path");
          (v54["setAttribute"]("d", "M12\x205v14M5\x2012h14"),
            v53["appendChild"](v54));
          const v55 = document["createElement"]("span");
          ((v55["textContent"] = "创建"),
            v52["appendChild"](v53),
            v52["appendChild"](v55));
        },
        v56 = (v57, v58) => {
          const v59 = Number(v57),
            v60 = Number(v58);
          if (
            !Number["isFinite"](v59) ||
            !Number["isFinite"](v60) ||
            v59 <= 0 ||
            v60 <= 0
          )
            return null;
          return { width: v59, height: v60 };
        },
        v61 = ({ nodeData: v62, cells: v63 }) => {
          const v64 = Number(v62?.["mainImageIndex"]) || 0,
            v65 = Array["isArray"](v62?.["images"]) ? v62["images"][v64] : null,
            v66 = [
              v56(v62?.["originalWidth"], v62?.["originalHeight"]),
              v56(v62?.["imageWidth"], v62?.["imageHeight"]),
              v56(v62?.["imgWidth"], v62?.["imgHeight"]),
              v56(v62?.["naturalWidth"], v62?.["naturalHeight"]),
              v56(v65?.["originalWidth"], v65?.["originalHeight"]),
              v56(v65?.["imageWidth"], v65?.["imageHeight"]),
              v56(v65?.["width"], v65?.["height"]),
              v56(v63?.[0]?.["sourceWidth"], v63?.[0]?.["sourceHeight"]),
              v56(v62?.["width"], v62?.["height"]),
            ];
          return v66["find"](Boolean) || { width: 1, height: 1 };
        },
        v67 = async ({ cols: v68, rows: v69 }) => {
          const v70 = v3()["nodes"][v2];
          if (!v70) throw new Error("节点数据已丢失");
          const v71 = await v11({ nodeData: v70, cols: v68, rows: v69 });
          v72();
          const v73 = v3(),
            v74 = v73["nodes"][v2];
          if (!v74) return;
          const v75 = v5("storyboard"),
            v76 = v61({ nodeData: v74, cells: v71 }),
            v77 = v8(v76["width"], v76["height"]),
            v78 = v7({
              aspectLabel: v77,
              cols: v68,
              rows: v69,
              sourceWidth: v76["width"],
              sourceHeight: v76["height"],
            }),
            v79 = v9(v73["nodes"], v74, v78["width"], v78["height"]);
          (v4["addNode"](
            v6({
              id: v75,
              name: "宫格分镜",
              x: v79["x"],
              y: v79["y"],
              width: v78["width"],
              height: v78["height"],
              cells: v71,
              cols: v68,
              rows: v69,
              aspectRatio: v77,
              isEditing: false,
            }),
          ),
            v4["setSelectedNodes"]([v75]),
            window["v2FocusOnNodes"] && window["v2FocusOnNodes"]([v2, v75]),
            window["_triggerLocalCacheSave"]?.(),
            window["showToast"]?.("分镜节点已创建", "success"));
        },
        v80 = async ({ cols: v81, rows: v82, onBusy: v83, onRestore: v84 }) => {
          const v85 = v13?.["querySelector"]("svg");
          (v85?.["classList"]["add"]("v2-spinning"), v83?.());
          try {
            await v67({ cols: v81, rows: v82 });
          } catch (v86) {
            console["error"]("[Storyboard] Create failed:", v86);
            const v87 =
              v86 instanceof Error ? v86["message"] : String(v86 || "未知错误");
            (window["showToast"]?.("创建分镜失败: " + v87, "error"), v84?.());
          } finally {
            v85?.["classList"]["remove"]("v2-spinning");
          }
        };
      let v88 = null,
        v89 = () => {};
      const v90 = (v91) => {
          const v92 = document["createElement"]("div");
          v92["className"] =
            "node-toolbar-action-menu-item\x20node-toolbar-action-grid-item";
          const v93 = document["createElement"]("div");
          v93["className"] = "node-toolbar-action-menu-icon";
          const v94 = v34(1.5, 24, 24);
          (v39(v94, v91["svgElements"]),
            v93["appendChild"](v94),
            v92["appendChild"](v93));
          const v95 = document["createElement"]("div");
          ((v95["className"] = "node-toolbar-action-menu-body"),
            (v95["style"]["flex"] = "0 0 auto"),
            (v95["style"]["minWidth"] = "64px"));
          const v96 = document["createElement"]("span");
          ((v96["className"] = "node-toolbar-action-menu-item-title"),
            (v96["textContent"] = v91["title"]),
            v95["appendChild"](v96));
          const v97 = document["createElement"]("span");
          ((v97["className"] = "node-toolbar-action-menu-item-desc"),
            (v97["textContent"] = v91["desc"]),
            v95["appendChild"](v97),
            v92["appendChild"](v95));
          const v98 = document["createElement"]("div");
          v98["className"] = "node-toolbar-action-inline-actions";
          const v99 = document["createElement"]("button"),
            v100 = v91["cols"] * v91["rows"],
            v101 = "裁剪成\x20" + v100 + "\x20张";
          ((v99["type"] = "button"),
            v99["setAttribute"]("aria-label", v101),
            v99["setAttribute"]("title", v101),
            v99["setAttribute"]("data-tooltip", v101),
            (v99["className"] = "node-toolbar-action-mini-button"),
            v46(v99),
            (v99["onclick"] = async (v102) => {
              (v102["stopPropagation"](), v72());
              const v103 = v3()["nodes"][v2];
              if (!v103) {
                window["showToast"]?.("节点数据已丢失", "error");
                return;
              }
              const v104 = v99["textContent"],
                v105 = v13?.["querySelector"]("svg");
              ((v99["textContent"] = "读取中..."),
                (v99["style"]["pointerEvents"] = "none"),
                v105?.["classList"]["add"]("v2-spinning"));
              try {
                const { newIds: v106 } = await v10({
                  nodeData: v103,
                  cols: v91["cols"],
                  rows: v91["rows"],
                });
                v106["length"] > 0
                  ? window["showToast"]?.(
                      "✅ 已创建 " + v106["length"] + " 个裁剪节点",
                      "success",
                    )
                  : window["showToast"]?.("裁剪失败，未生成任何节点", "error");
              } catch (v107) {
                console["error"]("[GridCrop] Execute failed:", v107);
                const v108 =
                  v107 instanceof Error
                    ? v107["message"]
                    : String(v107 || "未知错误");
                window["showToast"]?.(v108, "error");
              } finally {
                ((v99["textContent"] = v104),
                  (v99["style"]["pointerEvents"] = "auto"),
                  v105?.["classList"]["remove"]("v2-spinning"));
              }
            }));
          const v109 = document["createElement"]("button"),
            v110 = "创建 " + v91["cols"] + "×" + v91["rows"] + " 分镜";
          return (
            (v109["type"] = "button"),
            v109["setAttribute"]("aria-label", v110),
            v109["setAttribute"]("title", v110),
            v109["setAttribute"]("data-tooltip", v110),
            (v109["className"] =
              "node-toolbar-action-mini-button node-toolbar-action-mini-button--primary"),
            v51(v109),
            (v109["onclick"] = async (v111) => {
              v111["stopPropagation"]();
              if (v109["disabled"]) return;
              await v80({
                cols: v91["cols"],
                rows: v91["rows"],
                onBusy: () => {
                  ((v109["disabled"] = true),
                    (v109["textContent"] = "处理中..."));
                },
                onRestore: () => {
                  ((v109["disabled"] = false), v51(v109));
                },
              });
            }),
            v98["appendChild"](v99),
            v98["appendChild"](v109),
            v92["appendChild"](v98),
            v92["addEventListener"]("click", (v112) => {
              v112["stopPropagation"]();
            }),
            v92
          );
        },
        v113 = () => {
          const v114 = document["createElement"]("div");
          v114["className"] =
            "node-toolbar-action-menu-item node-toolbar-action-grid-item node-toolbar-action-grid-custom";
          const v115 = document["createElement"]("div");
          v115["className"] = "node-toolbar-action-menu-icon";
          const v116 = v34(1.5, 24, 24);
          (v39(v116, [
            { tag: "path", attrs: { d: "M3 3h18v18H3z" } },
            { tag: "path", attrs: { d: "M6.6 3v18" } },
            { tag: "path", attrs: { d: "M10.2 3v18" } },
            { tag: "path", attrs: { d: "M13.8 3v18" } },
            { tag: "path", attrs: { d: "M17.4 3v18" } },
            { tag: "path", attrs: { d: "M3\x206.6h18" } },
            { tag: "path", attrs: { d: "M3 10.2h18" } },
            { tag: "path", attrs: { d: "M3 13.8h18" } },
            { tag: "path", attrs: { d: "M3 17.4h18" } },
          ]),
            v115["appendChild"](v116),
            v114["appendChild"](v115));
          const v117 = document["createElement"]("div");
          v117["className"] =
            "node-toolbar-action-menu-body node-toolbar-action-grid-custom-body";
          const v118 = document["createElement"]("span");
          ((v118["className"] = "node-toolbar-action-menu-item-title"),
            (v118["textContent"] = "自定义"),
            v117["appendChild"](v118));
          const v119 = document["createElement"]("span");
          ((v119["className"] = "node-toolbar-action-menu-item-desc"),
            (v119["textContent"] = "1×1-5×5\x20任意规格"),
            v117["appendChild"](v119),
            v114["appendChild"](v117));
          const v120 = document["createElement"]("div");
          ((v120["className"] = "node-toolbar-action-caret"),
            (v120["innerHTML"] = "&gt;"),
            v114["appendChild"](v120));
          let v121 = null,
            v122 = 0,
            v123 = 0,
            v124 = 0,
            v125 = null;
          const v126 = () => {
              if (!v121) return;
              v121["querySelectorAll"](".node-toolbar-action-grid-picker-cell")[
                "forEach"
              ]((v127) => v127["classList"]["remove"]("is-preview"));
              const v128 = v121["querySelector"](
                ".node-toolbar-action-grid-submenu-preview",
              );
              if (v128) v128["textContent"] = "选择规格";
            },
            v129 = ({ cols: v130, rows: v131, busy: busy = false }) => {
              if (!v121) return;
              v121["querySelectorAll"](".node-toolbar-action-grid-picker-cell")[
                "forEach"
              ]((v132) => {
                const v133 = Number(v132["dataset"]["gridCols"]) || 0,
                  v134 = Number(v132["dataset"]["gridRows"]) || 0;
                v132["classList"]["toggle"](
                  "is-preview",
                  v133 <= v130 && v134 <= v131,
                );
              });
              const v135 = v121["querySelector"](
                ".node-toolbar-action-grid-submenu-preview",
              );
              v135 &&
                (v135["textContent"] = busy
                  ? "正在创建\x20" + v130 + "×" + v131
                  : "点击创建 " + v130 + "×" + v131 + " 分镜");
            },
            v136 = () => {
              if (v122) clearTimeout(v122);
              v122 = 0;
              if (v123) clearTimeout(v123);
              v123 = 0;
              if (v124) cancelAnimationFrame(v124);
              ((v124 = 0),
                v125 &&
                  (document["removeEventListener"]("pointerdown", v125),
                  (v125 = null)));
            },
            v137 = () => {
              if (!v121) return;
              const v138 = v121;
              ((v121 = null), (v88 = null));
              v27["__v2MultigridSubmenuEl"] === v138 &&
                (v27["__v2MultigridSubmenuEl"] = null);
              (v114["classList"]["remove"]("is-open"), v136());
              if (document["body"]["contains"](v138)) v138["remove"]();
            };
          v89 = v137;
          const v139 = () => {
              if (v123) clearTimeout(v123);
              v123 = 0;
            },
            v140 = () => {
              (v139(), (v123 = setTimeout(() => v137(), 160)));
            },
            v141 = () => {
              if (v121 && document["body"]["contains"](v121)) return v121;
              const v142 = document["querySelector"](
                ".v2-multigrid-custom-submenu",
              );
              if (v142) v142["remove"]();
              ((v121 = document["createElement"]("div")),
                (v121["className"] =
                  "v2-multigrid-custom-submenu node-toolbar-action-submenu node-toolbar-action-grid-submenu"),
                (v88 = v121),
                (v27["__v2MultigridSubmenuEl"] = v121),
                v114["classList"]["add"]("is-open"),
                Object["assign"](v121["style"], {
                  position: "fixed",
                  opacity: "0",
                  pointerEvents: "none",
                }));
              const v143 = document["createElement"]("div");
              ((v143["className"] = "node-toolbar-action-menu-title"),
                (v143["textContent"] = "自定义宫格"),
                v121["appendChild"](v143));
              const v144 = document["createElement"]("div");
              ((v144["className"] = "node-toolbar-action-grid-submenu-preview"),
                (v144["textContent"] = "选择规格"),
                v121["appendChild"](v144));
              const v145 = document["createElement"]("div");
              ((v145["className"] = "node-toolbar-action-grid-picker"),
                v145["setAttribute"]("role", "grid"),
                v145["setAttribute"]("aria-label", "自定义宫格规格"));
              for (let v146 = 1; v146 <= v33; v146 += 1) {
                for (let v147 = 1; v147 <= v33; v147 += 1) {
                  const v148 = document["createElement"]("button");
                  ((v148["type"] = "button"),
                    (v148["className"] =
                      "node-toolbar-action-grid-picker-cell"),
                    (v148["dataset"]["gridCols"] = String(v147)),
                    (v148["dataset"]["gridRows"] = String(v146)),
                    v148["setAttribute"]("role", "gridcell"),
                    v148["setAttribute"](
                      "aria-label",
                      "创建 " + v147 + "×" + v146 + " 分镜",
                    ),
                    v148["setAttribute"]("title", v147 + "×" + v146),
                    v148["addEventListener"]("pointerenter", () =>
                      v129({ cols: v147, rows: v146 }),
                    ),
                    v148["addEventListener"]("focus", () =>
                      v129({ cols: v147, rows: v146 }),
                    ),
                    v148["addEventListener"]("click", async (v149) => {
                      v149["stopPropagation"]();
                      if (v114["classList"]["contains"]("is-busy")) return;
                      await v80({
                        cols: v147,
                        rows: v146,
                        onBusy: () => {
                          (v114["classList"]["add"]("is-busy"),
                            v145["setAttribute"]("aria-busy", "true"),
                            v129({ cols: v147, rows: v146, busy: true }));
                        },
                        onRestore: () => {
                          (v114["classList"]["remove"]("is-busy"),
                            v145["removeAttribute"]("aria-busy"),
                            v129({ cols: v147, rows: v146 }));
                        },
                      });
                    }),
                    v145["appendChild"](v148));
                }
              }
              (v145["addEventListener"]("pointerleave", () => {
                if (!v114["classList"]["contains"]("is-busy")) v126();
              }),
                v121["appendChild"](v145));
              const v150 = () => {
                if (
                  !v121 ||
                  !document["body"]["contains"](v121) ||
                  !document["body"]["contains"](v27)
                ) {
                  if (v124) cancelAnimationFrame(v124);
                  v124 = 0;
                  return;
                }
                const v151 = v27["getBoundingClientRect"]();
                if (v151["width"] <= 0 || v151["height"] <= 0) {
                  v124 = requestAnimationFrame(v150);
                  return;
                }
                const v152 = 12,
                  v153 = 8,
                  v154 = Math["min"](
                    v151["width"],
                    window["innerWidth"] - v153 * 2,
                  );
                v121["style"]["width"] = v154 + "px";
                const v155 = Math["min"](
                  v151["height"],
                  window["innerHeight"] - v153 * 2,
                );
                ((v121["style"]["height"] = "auto"),
                  (v121["style"]["maxHeight"] = v155 + "px"));
                const v156 = v121["getBoundingClientRect"]()["height"],
                  v157 = Math["min"](
                    v156 > 0 ? v156 : v121["scrollHeight"],
                    v155,
                  ),
                  v158 = v151["right"] + v152,
                  v159 = v151["left"] - v154 - v152,
                  v160 = window["innerWidth"] - v154 - v153,
                  v161 = window["innerHeight"] - v157 - v153,
                  v162 = v158 <= v160 ? v158 : Math["max"](v153, v159),
                  v163 = Math["max"](
                    v153,
                    Math["min"](v151["top"], Math["max"](v153, v161)),
                  );
                ((v121["style"]["left"] = v162 + "px"),
                  (v121["style"]["top"] = v163 + "px"),
                  (v124 = requestAnimationFrame(v150)));
              };
              return (
                (v124 = requestAnimationFrame(v150)),
                v121["addEventListener"]("pointerenter", (v164) => {
                  if (v164["pointerType"] !== "mouse") return;
                  v139();
                }),
                v121["addEventListener"]("pointerleave", (v165) => {
                  if (v165["pointerType"] !== "mouse") return;
                  v140();
                }),
                document["body"]["appendChild"](v121),
                v121["offsetHeight"],
                (v121["style"]["opacity"] = "1"),
                (v121["style"]["pointerEvents"] = "auto"),
                (v125 = (v166) => {
                  if (!v121) return;
                  !v121["contains"](v166["target"]) &&
                    !v114["contains"](v166["target"]) &&
                    v137();
                }),
                document["addEventListener"]("pointerdown", v125),
                v121
              );
            };
          ((v114["__v2LastPointerType"] = "mouse"),
            v114["addEventListener"]("pointerdown", (v167) => {
              v114["__v2LastPointerType"] = v167["pointerType"] || "mouse";
            }));
          const v168 = () => {
            v139();
            if (v122) clearTimeout(v122);
            v122 = setTimeout(() => v141(), 60);
          };
          return (
            v114["addEventListener"]("pointerenter", (v169) => {
              if (v169["pointerType"] !== "mouse") return;
              v168();
            }),
            v114["addEventListener"]("pointerleave", (v170) => {
              if (v170["pointerType"] !== "mouse") return;
              v140();
            }),
            v114["addEventListener"]("click", (v171) => {
              v171["stopPropagation"]();
              if (v114["__v2LastPointerType"] === "touch") {
                if (v121 && document["body"]["contains"](v121)) v137();
                else v141();
                return;
              }
              v141();
            }),
            v114
          );
        };
      (v31["forEach"]((v172) => v27["appendChild"](v90(v172))),
        v27["appendChild"](v113()),
        document["body"]["appendChild"](v27),
        v27["offsetHeight"],
        (v27["style"]["pointerEvents"] = "auto"),
        (v27["style"]["opacity"] = "1"),
        (v27["style"]["transform"] = "translate(-50%, -100%)"));
      const v173 = v12(),
        { openedViewport: v174 } = v173;
      let v175 = 0,
        v176 = null;
      const v177 = () => {
          if (v175) cancelAnimationFrame(v175);
          ((v175 = 0),
            v173["dispose"](),
            v89(),
            v176 &&
              (document["removeEventListener"]("pointerdown", v176),
              (v176 = null)));
        },
        v72 = () => {
          if (v27["__v2MultigridClosing"]) return;
          ((v27["__v2MultigridClosing"] = true),
            v177(),
            (v27["style"]["opacity"] = "0"),
            (v27["style"]["pointerEvents"] = "none"),
            (v27["style"]["transform"] = "translate(-50%, calc(-100% + 10px))"),
            setTimeout(() => v27["remove"](), 250));
        };
      v27["__v2MultigridClose"] = v72;
      const v178 = () => {
        if (
          !document["body"]["contains"](v27) ||
          !document["body"]["contains"](v13)
        ) {
          v177();
          return;
        }
        const v179 = v173["getViewport"]();
        if (
          v179["x"] !== v174["x"] ||
          v179["y"] !== v174["y"] ||
          v179["zoom"] !== v174["zoom"]
        ) {
          v72();
          return;
        }
        if (!v28["isFixed"]) {
          const v180 = v13["getBoundingClientRect"]();
          if (v180["width"] <= 0 || v180["height"] <= 0) {
            v175 = requestAnimationFrame(v178);
            return;
          }
        }
        const v181 = v28();
        ((v27["style"]["left"] = v181["left"] + "px"),
          (v27["style"]["top"] = v181["top"] + "px"),
          (v175 = requestAnimationFrame(v178)));
      };
      ((v175 = requestAnimationFrame(v178)),
        (v176 = (v182) => {
          if (v27["__v2MultigridClosing"]) return;
          const v183 = v88 || v27["__v2MultigridSubmenuEl"],
            v184 = v27["contains"](v182["target"]),
            v185 = v183 && v183["contains"](v182["target"]);
          if (!v184 && !v185 && v182["target"] !== v13) v72();
        }),
        setTimeout(
          () => document["addEventListener"]("pointerdown", v176),
          10,
        ));
    });
  }
}

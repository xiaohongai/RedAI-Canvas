import { showError, showWarning } from "../../services/index.js";
import { markSystemClipboardWrite } from "../../modules/clipboard.js";
import appStore from "../../core/stores/appStore.js";
import {
  registerStaticInnerHTML,
  sanitizeRichTextHtml,
} from "../../utils/dom.js";
import { TEXT_TOOLBAR_HTML } from "./textToolbarHtml.js";
import { bindStoryboardScriptToolbarAction } from "./storyboardScriptAction.js";
export { TEXT_TOOLBAR_HTML };
registerStaticInnerHTML("toolbar:text", TEXT_TOOLBAR_HTML);
export function bindTextToolbarEvents(v0, v1, v2) {
  if (!v0) return;
  (v0["addEventListener"]("pointerdown", (v3) => v3["stopPropagation"]()),
    v0["addEventListener"]("dblclick", (v4) => {
      (v4["preventDefault"](), v4["stopPropagation"]());
    }));
  const v5 = (...v6) => {
      for (const v7 of v6) {
        if (typeof v7 === "string") return v7;
      }
      return "";
    },
    v8 = () => {
      const v9 = typeof v1?.["id"] === "string" ? v1["id"] : "";
      if (!v9) return v1 || {};
      const v10 =
        typeof appStore["getStateRaw"] === "function"
          ? appStore["getStateRaw"]()
          : appStore["getState"]();
      return v10?.["nodes"]?.[v9] || v1 || {};
    },
    v11 = (v12) => String(v12 ?? "")["replace"](/\r\n?/g, "\x0a"),
    v13 = (v14) => v11(v14)["replace"](/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ""),
    v15 = (v16) => {
      const v17 = v13(v16);
      return v17["split"]("\x0a")
        ["filter"]((v18) => v18["trim"]() !== "")
        ["join"]("\x0a");
    },
    v19 = (v20) => {
      const v21 = sanitizeRichTextHtml(typeof v20 === "string" ? v20 : "");
      if (!v21["trim"]()) return "";
      const v22 = document["createElement"]("div");
      v22["innerHTML"] = v21;
      const v23 = (v24) =>
          v24?.["nodeType"] === Node["ELEMENT_NODE"] &&
          String(v24["tagName"] || "")["toLowerCase"]() === "br",
        v25 = (v26) => {
          const v27 = String(v26?.["tagName"] || "")["toLowerCase"](),
            v28 =
              v27 === "hr" ||
              !!v26["querySelector"]?.(
                "img, video, audio, canvas, svg, iframe, hr",
              ),
            v29 = v13(v26["innerText"] || v26["textContent"] || "")["trim"]();
          return !!v29 || v28;
        },
        v30 = [];
      let v31 = false,
        v32 = false;
      return (
        Array["from"](v22["childNodes"])["forEach"]((v33) => {
          if (v33["nodeType"] === Node["TEXT_NODE"]) {
            if (!v13(v33["textContent"] || "")["trim"]()) return;
            v32 &&
              (v30["push"](document["createElement"]("br")), (v32 = false));
            (v30["push"](v33), (v31 = true));
            return;
          }
          if (v33["nodeType"] !== Node["ELEMENT_NODE"]) return;
          if (v23(v33)) {
            if (v31) v32 = true;
            return;
          }
          const v34 = v33;
          if (!v25(v34)) return;
          (v32 && (v30["push"](document["createElement"]("br")), (v32 = false)),
            v30["push"](v34),
            (v31 = true));
        }),
        v22["replaceChildren"](...v30),
        v22["innerHTML"] || ""
      );
    },
    v35 = (v36) => {
      const v37 = document["createElement"]("div");
      return v11(v36)
        ["split"]("\x0a")
        ["map"]((v38) => {
          return ((v37["textContent"] = v38), v37["innerHTML"]);
        })
        ["join"]("<br>");
    },
    v39 = ({ rawText: v40, richHtml: v41 } = {}) => {
      const v42 = typeof v40 === "string" ? v40 : "",
        v43 = sanitizeRichTextHtml(typeof v41 === "string" ? v41 : ""),
        v44 = typeof v1?.["id"] === "string" ? v1["id"] : "";
      if (!v44) {
        window["_triggerLocalCacheSave"]?.();
        return;
      }
      const v45 = v8(),
        v46 = String(v45?.["type"] || v1?.["type"] || ""),
        v47 = {};
      (v46 === "ai-text" ||
        Object["prototype"]["hasOwnProperty"]["call"](
          v45 || {},
          "outputText",
        ) ||
        Object["prototype"]["hasOwnProperty"]["call"](
          v1 || {},
          "outputText",
        )) &&
        (v47["outputText"] = v42);
      (v46 === "source-text" ||
        v46 === "text" ||
        Object["prototype"]["hasOwnProperty"]["call"](v45 || {}, "content") ||
        Object["prototype"]["hasOwnProperty"]["call"](v1 || {}, "content")) &&
        ((v47["content"] = v42), (v47["contentHtml"] = v43));
      if (!Object["keys"](v47)["length"]) v47["content"] = v42;
      try {
        (appStore["updateNodeData"](v44, v47), Object["assign"](v1, v47));
      } catch (v48) {
        console["warn"](
          "[TextToolbar]\x20Persist\x20fullscreen\x20text\x20failed:",
          v48,
        );
      }
      window["_triggerLocalCacheSave"]?.();
    },
    v49 = v0["querySelector"](".act-copy");
  if (v49) {
    const v50 = Array["from"](v49["childNodes"])["map"]((v51) =>
        v51["cloneNode"](true),
      ),
      v52 = v49["getAttribute"]("data-tooltip") || "复制",
      v53 = v49["getAttribute"]("aria-label") || "";
    let v54 = null;
    v49["addEventListener"]("click", (v55) => {
      v55["stopPropagation"]();
      const v56 = v2 ? v2() : v1["content"] || v1["resultText"] || "";
      if (!v56) {
        showWarning("没有可复制的文本");
        return;
      }
      navigator["clipboard"]
        ["writeText"](v56)
        ["then"](() => {
          markSystemClipboardWrite({ text: v56 });
          v54 && (clearTimeout(v54), (v54 = null));
          v49["replaceChildren"]();
          const v57 = "http://www.w3.org/2000/svg",
            v58 = document["createElementNS"](v57, "svg");
          (v58["setAttribute"]("viewBox", "0 0 24 24"),
            v58["setAttribute"]("fill", "none"),
            v58["setAttribute"]("stroke", "currentColor"),
            v58["setAttribute"]("stroke-width", "2"),
            v58["setAttribute"]("width", "16"),
            v58["setAttribute"]("height", "16"));
          const v59 = document["createElementNS"](v57, "polyline");
          (v59["setAttribute"]("points", "20\x206\x209\x2017\x204\x2012"),
            v58["appendChild"](v59),
            v49["appendChild"](v58),
            v49["classList"]["add"]("is-copied"),
            v49["setAttribute"]("data-tooltip", "已复制"),
            v49["setAttribute"]("aria-label", "已复制"),
            (v54 = setTimeout(() => {
              (v49["replaceChildren"](
                ...v50["map"]((v60) => v60["cloneNode"](true)),
              ),
                v49["setAttribute"]("data-tooltip", v52));
              if (v53) v49["setAttribute"]("aria-label", v53);
              else v49["removeAttribute"]("aria-label");
              (v49["classList"]["remove"]("is-copied"), (v54 = null));
            }, 2000)));
        })
        ["catch"]((v61) => {
          (console["error"]("复制失败:", v61), showError("复制失败"));
        });
    });
  }
  const v62 = v0["querySelector"](".act-clear-empty-lines");
  v62 &&
    v62["addEventListener"]("click", (v63) => {
      v63["stopPropagation"]();
      const v64 = v8(),
        v65 = v5(
          v2 ? v2() : undefined,
          v64?.["content"],
          v64?.["outputText"],
          v1?.["content"],
          v1?.["outputText"],
          v1?.["resultText"],
        ),
        v66 = v11(v65);
      if (!v66["trim"]()) {
        showWarning("没有可清理的文本");
        return;
      }
      const v67 = v15(v66);
      if (v13(v67) === v13(v66)) {
        window["showToast"]?.("未检测到空行", "info");
        return;
      }
      const v68 = v5(v64?.["contentHtml"], v1?.["contentHtml"]);
      let v69 = v19(v68);
      if (v68["trim"]()) {
        const v70 = v11(v68)["trim"](),
          v71 = v11(v69)["trim"]();
        v70 === v71 && (v69 = v35(v67));
      }
      (v39({ rawText: v67, richHtml: v69 }),
        window["showToast"]?.("已清除空行", "success"));
    });
  bindStoryboardScriptToolbarAction({
    toolbarEl: v0,
    nodeData: v1,
    store: appStore,
    getStateSnapshot: () =>
      typeof appStore["getStateRaw"] === "function"
        ? appStore["getStateRaw"]()
        : appStore["getState"](),
  });
  const v72 = v0["querySelector"](".act-fullscreen");
  v72 &&
    v72["addEventListener"]("click", (v73) => {
      v73["stopPropagation"]();
      const v74 = v8(),
        v75 = v5(
          v74?.["content"],
          v74?.["outputText"],
          v2 ? v2() : undefined,
          v1?.["content"],
          v1?.["resultText"],
        ),
        v76 = v5(v74?.["contentHtml"], v1?.["contentHtml"]),
        v77 = sanitizeRichTextHtml(v76),
        v78 = document["createElement"]("div");
      Object["assign"](v78["style"], {
        position: "fixed",
        inset: "0",
        background: "var(--overlay-dim)",
        zIndex: "99999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      });
      const v79 = document["createElement"]("div");
      Object["assign"](v79["style"], {
        background: "var(--bg-2)",
        border: "1px solid var(--stroke-08)",
        borderRadius: "12px",
        width: "90%",
        maxWidth: "1000px",
        height: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-dialog)",
      });
      const v80 = document["createElement"]("div");
      Object["assign"](v80["style"], {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid var(--stroke-05)",
      });
      const v81 = document["createElement"]("div"),
        v82 = document["createElement"]("button");
      (v82["setAttribute"]("data-tooltip", "复制"),
        v82["setAttribute"]("aria-label", "复制"),
        Object["assign"](v82["style"], {
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          padding: "6px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          transition: "background\x200.2s",
        }));
      const v83 = "http://www.w3.org/2000/svg",
        v84 = document["createElementNS"](v83, "svg");
      (v84["setAttribute"]("viewBox", "0 0 24 24"),
        v84["setAttribute"]("fill", "none"),
        v84["setAttribute"]("stroke", "currentColor"),
        v84["setAttribute"]("stroke-width", "2"),
        v84["setAttribute"]("width", "16"),
        v84["setAttribute"]("height", "16"));
      const v85 = document["createElementNS"](v83, "rect");
      (v85["setAttribute"]("x", "9"),
        v85["setAttribute"]("y", "9"),
        v85["setAttribute"]("width", "13"),
        v85["setAttribute"]("height", "13"),
        v85["setAttribute"]("rx", "2"),
        v85["setAttribute"]("ry", "2"));
      const v86 = document["createElementNS"](v83, "path");
      (v86["setAttribute"](
        "d",
        "M5\x2015H4a2\x202\x200\x200\x201-2-2V4a2\x202\x200\x200\x201\x202-2h9a2\x202\x200\x200\x201\x202\x202v1",
      ),
        v84["appendChild"](v85),
        v84["appendChild"](v86),
        v82["appendChild"](v84),
        v81["appendChild"](v82),
        (v82["onmouseenter"] = () =>
          (v82["style"]["background"] = "var(--white-10)")),
        (v82["onmouseleave"] = () =>
          (v82["style"]["background"] = "transparent")));
      const v87 = document["createElement"]("div");
      Object["assign"](v87["style"], {
        display: "flex",
        alignItems: "center",
        gap: "4px",
      });
      const v88 = (v89, v90, v91 = null, v92 = "") => {
          if (v89 === "|") {
            const v93 = document["createElement"]("div");
            return (
              Object["assign"](v93["style"], {
                width: "1px",
                height: "14px",
                background: "var(--stroke-10)",
                margin: "0 4px",
              }),
              v93
            );
          }
          const v94 = document["createElement"]("button");
          v92 &&
            (v94["setAttribute"]("data-tooltip", v92),
            v94["setAttribute"]("aria-label", v92));
          v94["replaceChildren"]();
          if (v89 && typeof v89 === "object" && v89["kind"] === "svg") {
            const v95 = document["createElementNS"](v83, "svg");
            (v95["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
              v95["setAttribute"]("fill", "none"),
              v95["setAttribute"]("stroke", "currentColor"),
              v95["setAttribute"]("stroke-width", "2"),
              v95["setAttribute"]("width", "14"),
              v95["setAttribute"]("height", "14"));
            if (v89["name"] === "ul") {
              const v96 = document["createElementNS"](v83, "line");
              (v96["setAttribute"]("x1", "8"),
                v96["setAttribute"]("y1", "6"),
                v96["setAttribute"]("x2", "21"),
                v96["setAttribute"]("y2", "6"));
              const v97 = document["createElementNS"](v83, "line");
              (v97["setAttribute"]("x1", "8"),
                v97["setAttribute"]("y1", "12"),
                v97["setAttribute"]("x2", "21"),
                v97["setAttribute"]("y2", "12"));
              const v98 = document["createElementNS"](v83, "line");
              (v98["setAttribute"]("x1", "8"),
                v98["setAttribute"]("y1", "18"),
                v98["setAttribute"]("x2", "21"),
                v98["setAttribute"]("y2", "18"));
              const v99 = document["createElementNS"](v83, "line");
              (v99["setAttribute"]("x1", "3"),
                v99["setAttribute"]("y1", "6"),
                v99["setAttribute"]("x2", "3.01"),
                v99["setAttribute"]("y2", "6"));
              const v100 = document["createElementNS"](v83, "line");
              (v100["setAttribute"]("x1", "3"),
                v100["setAttribute"]("y1", "12"),
                v100["setAttribute"]("x2", "3.01"),
                v100["setAttribute"]("y2", "12"));
              const v101 = document["createElementNS"](v83, "line");
              (v101["setAttribute"]("x1", "3"),
                v101["setAttribute"]("y1", "18"),
                v101["setAttribute"]("x2", "3.01"),
                v101["setAttribute"]("y2", "18"),
                v95["appendChild"](v96),
                v95["appendChild"](v97),
                v95["appendChild"](v98),
                v95["appendChild"](v99),
                v95["appendChild"](v100),
                v95["appendChild"](v101));
            } else {
              if (v89["name"] === "ol") {
                const v102 = document["createElementNS"](v83, "line");
                (v102["setAttribute"]("x1", "10"),
                  v102["setAttribute"]("y1", "6"),
                  v102["setAttribute"]("x2", "21"),
                  v102["setAttribute"]("y2", "6"));
                const v103 = document["createElementNS"](v83, "line");
                (v103["setAttribute"]("x1", "10"),
                  v103["setAttribute"]("y1", "12"),
                  v103["setAttribute"]("x2", "21"),
                  v103["setAttribute"]("y2", "12"));
                const v104 = document["createElementNS"](v83, "line");
                (v104["setAttribute"]("x1", "10"),
                  v104["setAttribute"]("y1", "18"),
                  v104["setAttribute"]("x2", "21"),
                  v104["setAttribute"]("y2", "18"));
                const v105 = document["createElementNS"](v83, "path");
                v105["setAttribute"]("d", "M4 6h1v4");
                const v106 = document["createElementNS"](v83, "path");
                v106["setAttribute"]("d", "M4 10h2");
                const v107 = document["createElementNS"](v83, "path");
                (v107["setAttribute"](
                  "d",
                  "M6\x2018H4c0-1\x202-2\x202-3s-1-1.5-2-1",
                ),
                  v95["appendChild"](v102),
                  v95["appendChild"](v103),
                  v95["appendChild"](v104),
                  v95["appendChild"](v105),
                  v95["appendChild"](v106),
                  v95["appendChild"](v107));
              }
            }
            v94["appendChild"](v95);
          } else {
            v94["textContent"] = String(v89 ?? "");
            if (v89 === "B") v94["style"]["fontWeight"] = "700";
            if (v89 === "I") v94["style"]["fontStyle"] = "italic";
            ((v89 === "H₁" || v89 === "H₂" || v89 === "H₃") &&
              ((v94["style"]["fontSize"] = "12px"),
              (v94["style"]["fontWeight"] = "700")),
              v89 === "¶" &&
                ((v94["style"]["fontSize"] = "14px"),
                (v94["style"]["fontWeight"] = "700")));
          }
          return (
            Object["assign"](v94["style"], {
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontFamily: "serif",
              transition: "all 0.2s",
            }),
            (v94["onmouseenter"] = () =>
              (v94["style"]["background"] = "var(--white-10)")),
            (v94["onmouseleave"] = () =>
              (v94["style"]["background"] = "transparent")),
            (v94["onclick"] = (v108) => {
              (v108["preventDefault"](),
                document["execCommand"](v90, false, v91));
            }),
            v94
          );
        },
        v109 = [
          { l: "H₁", c: "formatBlock", v: "H1", tooltip: "一级标题" },
          { l: "H₂", c: "formatBlock", v: "H2", tooltip: "二级标题" },
          { l: "H₃", c: "formatBlock", v: "H3", tooltip: "三级标题" },
          { l: "¶", c: "formatBlock", v: "P", tooltip: "正文" },
          { l: "|" },
          { l: "B", c: "bold", tooltip: "加粗" },
          { l: "I", c: "italic", tooltip: "斜体" },
          { l: "|" },
          {
            l: { kind: "svg", name: "ul" },
            c: "insertUnorderedList",
            tooltip: "无序列表",
          },
          {
            l: { kind: "svg", name: "ol" },
            c: "insertOrderedList",
            tooltip: "有序列表",
          },
          { l: "|" },
          { l: "—", c: "insertHorizontalRule", tooltip: "分割线" },
        ];
      v109["forEach"]((v110) =>
        v87["appendChild"](
          v88(v110["l"], v110["c"], v110["v"], v110["tooltip"]),
        ),
      );
      const v111 = document["createElement"]("div"),
        v112 = document["createElement"]("button");
      (v112["setAttribute"]("data-tooltip", "关闭"),
        v112["setAttribute"]("aria-label", "关闭"),
        Object["assign"](v112["style"], {
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          padding: "6px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          transition: "background 0.2s",
        }));
      const v113 = document["createElementNS"](v83, "svg");
      (v113["setAttribute"]("viewBox", "0\x200\x2024\x2024"),
        v113["setAttribute"]("fill", "none"),
        v113["setAttribute"]("stroke", "currentColor"),
        v113["setAttribute"]("stroke-width", "2"),
        v113["setAttribute"]("width", "16"),
        v113["setAttribute"]("height", "16"));
      const v114 = document["createElementNS"](v83, "path");
      v114["setAttribute"]("d", "M18 6L6 18");
      const v115 = document["createElementNS"](v83, "path");
      (v115["setAttribute"]("d", "M6 6l12 12"),
        v113["appendChild"](v114),
        v113["appendChild"](v115),
        v112["appendChild"](v113),
        v111["appendChild"](v112),
        (v112["onmouseenter"] = () =>
          (v112["style"]["background"] = "var(--white-10)")),
        (v112["onmouseleave"] = () =>
          (v112["style"]["background"] = "transparent")),
        v80["appendChild"](v81),
        v80["appendChild"](v87),
        v80["appendChild"](v111));
      const v116 = document["createElement"]("div");
      (Object["assign"](v116["style"], {
        flex: "1",
        padding: "40px 60px",
        overflowY: "auto",
        color: "var(--text-secondary)",
        fontSize: "16px",
        lineHeight: "1.8",
        outline: "none",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      }),
        (v116["contentEditable"] = "true"),
        (v116["spellcheck"] = false));
      v77 ? (v116["innerHTML"] = v77) : (v116["textContent"] = v75);
      ((v116["className"] = "v2-rt-editor"),
        v79["appendChild"](v80),
        v79["appendChild"](v116),
        (v82["onclick"] = () => {
          const v117 = v116["innerText"] || "";
          navigator["clipboard"]["writeText"](v117)["then"](() => {
            markSystemClipboardWrite({ text: v117 });
            const v118 = Array["from"](v82["childNodes"])["map"]((v119) =>
              v119["cloneNode"](true),
            );
            v82["replaceChildren"]();
            const v120 = document["createElementNS"](v83, "svg");
            (v120["setAttribute"]("viewBox", "0 0 24 24"),
              v120["setAttribute"]("fill", "none"),
              v120["setAttribute"]("stroke", "currentColor"),
              v120["setAttribute"]("stroke-width", "2"),
              v120["setAttribute"]("width", "16"),
              v120["setAttribute"]("height", "16"));
            const v121 = document["createElementNS"](v83, "polyline");
            (v121["setAttribute"]("points", "20 6 9 17 4 12"),
              v120["appendChild"](v121),
              v82["appendChild"](v120),
              setTimeout(() => {
                v82["replaceChildren"](
                  ...v118["map"]((v122) => v122["cloneNode"](true)),
                );
              }, 2000));
          });
        }),
        v79["addEventListener"]("click", (v123) => v123["stopPropagation"]()));
      const v124 = () => {
        (v39({
          rawText: v116["innerText"] || "",
          richHtml: sanitizeRichTextHtml(v116["innerHTML"] || ""),
        }),
          v78["remove"]());
      };
      ((v112["onclick"] = v124),
        v78["addEventListener"]("click", (v125) => {
          if (v125["target"] === v78) v124();
        }),
        v78["appendChild"](v79),
        document["body"]["appendChild"](v78),
        window["_triggerLocalCacheSave"]?.(),
        setTimeout(() => v116["focus"](), 50));
    });
}

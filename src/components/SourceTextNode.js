import appStore from "../core/stores/appStore.js";
import { commit } from "../modules/history.js";
import { startNodeResizePreview } from "../modules/interaction/nodeResizePreview.js";
import { bindTextToolbarEvents } from "./NodeToolbarConfig.js";
import { sanitizeRichTextHtml, setStaticInnerHTML } from "../utils/dom.js";
export class SourceTextNode {
  constructor(v0) {
    ((this["_data"] = v0),
      (this["el"] = document["createElement"]("div")),
      (this["id"] = v0["id"]),
      (this["el"]["className"] = "v2-node-component"),
      (this["_lastScrollTop"] = Number["isFinite"](v0?.["contentScrollTop"])
        ? Math["max"](0, v0["contentScrollTop"])
        : 0));
  }
  ["mount"]() {
    const v1 = this["el"];
    setStaticInnerHTML(v1, "toolbar:text");
    const v2 = document["createElement"]("div");
    v2["className"] = "node-card source-text-card";
    const v3 = document["createElement"]("div");
    ((v3["className"] = "source-text-content"),
      v3["setAttribute"]("contenteditable", "false"),
      (v3["spellcheck"] = false),
      (v3["dataset"]["placeholder"] = "输入提示词开始创作"));
    const v4 = document["createElement"]("div");
    v4["className"] = "source-text-footer";
    const v5 = document["createElement"]("div");
    v5["className"] = "source-text-info";
    const v6 = "http://www.w3.org/2000/svg",
      v7 = document["createElementNS"](v6, "svg");
    (v7["setAttribute"]("width", "12"),
      v7["setAttribute"]("height", "12"),
      v7["setAttribute"]("viewBox", "0 0 24 24"),
      v7["setAttribute"]("fill", "none"),
      v7["setAttribute"]("stroke", "currentColor"),
      v7["setAttribute"]("stroke-width", "2"),
      (v7["style"]["opacity"] = "0.4"));
    const v8 = document["createElementNS"](v6, "path");
    v8["setAttribute"](
      "d",
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    );
    const v9 = document["createElementNS"](v6, "polyline");
    v9["setAttribute"]("points", "14 2 14 8 20 8");
    const v10 = document["createElementNS"](v6, "line");
    (v10["setAttribute"]("x1", "16"),
      v10["setAttribute"]("y1", "13"),
      v10["setAttribute"]("x2", "8"),
      v10["setAttribute"]("y2", "13"));
    const v11 = document["createElementNS"](v6, "line");
    (v11["setAttribute"]("x1", "16"),
      v11["setAttribute"]("y1", "17"),
      v11["setAttribute"]("x2", "8"),
      v11["setAttribute"]("y2", "17"),
      v7["appendChild"](v8),
      v7["appendChild"](v9),
      v7["appendChild"](v10),
      v7["appendChild"](v11));
    const v12 = document["createElement"]("span");
    ((v12["className"] = "source-text-char-count"),
      (v12["textContent"] = "0 字"),
      v5["appendChild"](v7),
      v5["appendChild"](v12),
      v4["appendChild"](v5));
    const v13 = document["createElement"]("div");
    v13["className"] = "node-port\x20out-port";
    const v14 = document["createElement"]("div");
    ((v14["className"] = "group-resizer"),
      v14["classList"]["add"]("v2-resize-move"),
      v2["appendChild"](v3),
      v2["appendChild"](v4),
      v2["appendChild"](v13),
      v2["appendChild"](v14),
      v1["appendChild"](v2),
      (this["_card"] = v2),
      (this["_content"] = v3),
      (this["_countEl"] = v12),
      this["_card"]["addEventListener"]("dblclick", (v15) => {
        v15["stopPropagation"]();
      }));
    const v16 =
        typeof this["_data"]["content"] === "string"
          ? this["_data"]["content"]
          : "",
      v17 =
        typeof this["_data"]["contentHtml"] === "string"
          ? this["_data"]["contentHtml"]
          : "",
      v18 = sanitizeRichTextHtml(v17);
    v18["trim"]()
      ? (this["_content"]["innerHTML"] = v18)
      : (this["_content"]["innerText"] = v16);
    const v19 = this["_content"]["innerText"] || "";
    !v19
      ? (this["_content"]["dataset"]["placeholder"] = "输入提示词开始创作")
      : delete this["_content"]["dataset"]["placeholder"];
    ((this["_countEl"]["textContent"] = v19["length"] + "\x20字"),
      (this["_content"]["scrollTop"] = this["_lastScrollTop"]),
      this["_content"]["addEventListener"]("blur", () => {
        ((this["_lastScrollTop"] = Math["max"](
          0,
          this["_content"]["scrollTop"] || 0,
        )),
          this["_content"]["setAttribute"]("contenteditable", "false"),
          this["el"]["classList"]["remove"]("source-text-editing"));
        const v20 = this["_content"]["innerText"] || "",
          v21 =
            v20["trim"]()["length"] > 0
              ? sanitizeRichTextHtml(this["_content"]["innerHTML"] || "")
              : "";
        if (v21["trim"]()) this["_content"]["innerHTML"] = v21;
        else v20 && (this["_content"]["innerText"] = v20);
        (appStore["updateNodeData"](this["id"], {
          content: v20,
          contentHtml: v21,
          contentScrollTop: this["_lastScrollTop"],
        }),
          this["_updateSizeByLength"](v20["length"], true));
      }),
      this["_content"]["addEventListener"]("input", () => {
        const v22 = this["_content"]["innerText"] || "";
        ((this["_countEl"]["textContent"] = v22["length"] + "\x20字"),
          v22["length"] > 0
            ? delete this["_content"]["dataset"]["placeholder"]
            : (this["_content"]["dataset"]["placeholder"] =
                "双击进入输入模式开始创作"));
      }));
    let v23 = 0,
      v24 = 0;
    (this["_content"]["addEventListener"]("pointerdown", (v25) => {
      if (this["_content"]["getAttribute"]("contenteditable") === "true") {
        v25["stopPropagation"]();
        return;
      }
      ((v23 = v25["clientX"]), (v24 = v25["clientY"]));
    }),
      this["_content"]["addEventListener"]("pointerup", (v26) => {
        if (this["_content"]["getAttribute"]("contenteditable") === "true")
          return;
        const v27 = Math["hypot"](v26["clientX"] - v23, v26["clientY"] - v24);
        if (v27 < 5) {
          const v28 = this["_content"]["innerText"]["trim"]();
          if (v28["length"] === 0) {
            this["_enterEditMode"]();
            return;
          }
          const v29 = document["caretRangeFromPoint"](
            v26["clientX"],
            v26["clientY"],
          );
          if (v29 && this["_content"]["contains"](v29["startContainer"])) {
            const v30 =
              v29["startContainer"]["nodeType"] === Node["TEXT_NODE"]
                ? v29["startContainer"]
                : null;
            v30 && this["_enterEditMode"]();
          }
        }
      }),
      this["_content"]["addEventListener"]("wheel", (v31) => {
        this["_content"]["scrollHeight"] > this["_content"]["clientHeight"] &&
          v31["stopPropagation"]();
      }),
      this["_content"]["addEventListener"]("scroll", () => {
        this["_lastScrollTop"] = Math["max"](
          0,
          this["_content"]["scrollTop"] || 0,
        );
      }));
    v14 &&
      v14["addEventListener"]("pointerdown", (v32) => {
        startNodeResizePreview({
          event: v32,
          nodeId: this["id"],
          getNode: () =>
            appStore["getStateRaw"]()["nodes"]?.[this["id"]] || this["_data"],
          getViewport: () => appStore["getStateRaw"]()["viewport"],
          resolveSize: ({
            startWidth: v33,
            startHeight: v34,
            dx: v35,
            dy: v36,
          }) => ({
            width: Math["max"](150, v33 + v35),
            height: Math["max"](150, v34 + v36),
          }),
          applyPatch: (v37) => appStore["updateNodeData"](this["id"], v37),
          commit: commit,
        });
      });
    const v38 = v1["querySelector"](".node-floating-toolbar");
    return (
      bindTextToolbarEvents(
        v38,
        this["_data"],
        () => this["_content"]["innerText"],
      ),
      this["_updateSizeByLength"](v19["length"], false),
      v1
    );
  }
  ["_enterEditMode"]() {
    (this["_content"]["setAttribute"]("contenteditable", "true"),
      this["el"]["classList"]["add"]("source-text-editing"),
      this["_content"]["focus"](),
      (this["_content"]["scrollTop"] = this["_lastScrollTop"]),
      requestAnimationFrame(() => {
        this["_content"]["scrollTop"] = this["_lastScrollTop"];
      }));
    const v39 = appStore["getState"]()["selectedNodeIds"];
    if (!v39["includes"](this["id"]))
      appStore["setSelectedNodes"]([this["id"]]);
  }
  ["_updateSizeByLength"](v40, v41 = false) {
    if (!this["_data"]["width"] || this["_data"]["width"] < 100) {
      let v42 = 260;
      if (v40 > 300) v42 = 520;
      v41
        ? appStore["updateNodeData"](this["id"], { width: v42, height: v42 })
        : ((this["_data"]["width"] = v42), (this["_data"]["height"] = v42));
    }
  }
  ["update"](v43) {
    this["_data"] = v43;
    if (!this["_content"]) return;
    Number["isFinite"](v43["contentScrollTop"]) &&
      (this["_lastScrollTop"] = Math["max"](0, v43["contentScrollTop"]));
    const v44 =
      v43["content"] !== undefined || v43["contentHtml"] !== undefined;
    if (v44 && document["activeElement"] !== this["_content"]) {
      const v45 = sanitizeRichTextHtml(
          typeof v43["contentHtml"] === "string" ? v43["contentHtml"] : "",
        ),
        v46 = typeof v43["content"] === "string" ? v43["content"] : "";
      v45["trim"]()
        ? (this["_content"]["innerHTML"] = v45)
        : (this["_content"]["innerText"] = v46);
      const v47 = this["_content"]["innerText"] || "";
      (!v47
        ? (this["_content"]["dataset"]["placeholder"] =
            "双击进入输入模式开始创作")
        : delete this["_content"]["dataset"]["placeholder"],
        this["_countEl"] &&
          (this["_countEl"]["textContent"] = v47["length"] + "\x20字"),
        (this["_content"]["scrollTop"] = this["_lastScrollTop"]));
    }
  }
  ["unmount"]() {}
}

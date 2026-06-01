import appStore from "../core/stores/appStore.js";
export class DebugNode {
  constructor(v0) {
    ((this["_data"] = v0),
      (this["nodeId"] = v0["id"]),
      (this["contentEl"] = null));
  }
  ["mount"]() {
    const v1 = document["createElement"]("div");
    (Object["assign"](v1["style"], {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      pointerEvents: "auto",
    }),
      (this["_root"] = v1));
    const v2 = document["createElement"]("div");
    (Object["assign"](v2["style"], {
      padding: "8px 12px",
      background: "var(--debug-header-bg)",
      borderBottom: "1px solid var(--debug-header-border)",
      color: "var(--debug-header-text)",
      fontSize: "13px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      borderTopLeftRadius: "8px",
      borderTopRightRadius: "8px",
      cursor: "move",
    }),
      v2["replaceChildren"]());
    const v3 = "http://www.w3.org/2000/svg",
      v4 = document["createElementNS"](v3, "svg");
    (v4["setAttribute"]("width", "14"),
      v4["setAttribute"]("height", "14"),
      v4["setAttribute"]("viewBox", "0 0 24 24"),
      v4["setAttribute"]("fill", "none"),
      v4["setAttribute"]("stroke", "currentColor"),
      v4["setAttribute"]("stroke-width", "2"));
    const v5 = document["createElementNS"](v3, "path");
    (v5["setAttribute"](
      "d",
      "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
    ),
      v4["appendChild"](v5),
      v2["appendChild"](v4),
      v2["appendChild"](document["createTextNode"]("API 调试接收器")),
      v1["appendChild"](v2),
      (this["contentEl"] = document["createElement"]("div")),
      (this["contentEl"]["className"] =
        "debug-output-content custom-scrollbar"),
      Object["assign"](this["contentEl"]["style"], {
        flex: "1",
        margin: "0",
        padding: "12px",
        background: "var(--debug-body-bg)",
        border: "none",
        outline: "none",
        color: "var(--debug-body-text)",
        fontFamily: "monospace",
        fontSize: "12px",
        overflow: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        borderBottomLeftRadius: "8px",
        borderBottomRightRadius: "8px",
        pointerEvents: "auto",
        userSelect: "text",
        WebkitUserSelect: "text",
        cursor: "text",
      }),
      this["contentEl"]["setAttribute"]("contenteditable", "true"),
      this["contentEl"]["style"]["setProperty"](
        "user-select",
        "text",
        "important",
      ),
      this["contentEl"]["style"]["setProperty"](
        "-webkit-user-select",
        "text",
        "important",
      ),
      this["contentEl"]["addEventListener"]("keydown", (v6) => {
        if (
          (v6["ctrlKey"] || v6["metaKey"]) &&
          (v6["key"] === "c" || v6["key"] === "a")
        )
          return;
        v6["preventDefault"]();
      }),
      this["contentEl"]["addEventListener"]("input", (v7) => {
        v7["preventDefault"]();
      }));
    this["_data"]["outputText"]
      ? (this["contentEl"]["textContent"] = this["_data"]["outputText"])
      : ((this["contentEl"]["textContent"] =
          "// 等待接收请求 Payload... \n// (请在其他生成节点点击 🔧 发送)\n// 这里内容可选择复制。"),
        (this["contentEl"]["style"]["color"] = "var(--text-muted)"));
    (this["contentEl"]["addEventListener"](
      "wheel",
      (v8) => {
        v8["stopPropagation"]();
      },
      { passive: true },
    ),
      this["contentEl"]["addEventListener"]("mousedown", (v9) => {
        v9["stopPropagation"]();
      }),
      this["contentEl"]["addEventListener"]("pointerdown", (v10) => {
        v10["stopPropagation"]();
      }),
      v1["appendChild"](this["contentEl"]));
    const v11 = document["createElement"]("div");
    return (
      (v11["className"] = "group-resizer"),
      (v11["style"]["pointerEvents"] = "auto"),
      v11["addEventListener"]("pointerdown", (v12) => {
        (v12["stopPropagation"](), v12["preventDefault"]());
        const v13 = v12["clientX"],
          v14 = v12["clientY"],
          v15 = this["_data"]["width"] || 300,
          v16 = this["_data"]["height"] || 200,
          v17 = (v18) => {
            const { viewport: v19 } = appStore["getState"](),
              v20 = (v18["clientX"] - v13) / v19["zoom"],
              v21 = (v18["clientY"] - v14) / v19["zoom"];
            appStore["updateNodeData"](this["nodeId"], {
              width: Math["max"](200, v15 + v20),
              height: Math["max"](120, v16 + v21),
            });
          },
          v22 = () => {
            (window["removeEventListener"]("pointermove", v17),
              window["removeEventListener"]("pointerup", v22));
          };
        (window["addEventListener"]("pointermove", v17),
          window["addEventListener"]("pointerup", v22));
      }),
      v1["appendChild"](v11),
      v1
    );
  }
  ["update"](v23) {
    ((this["_data"] = v23),
      this["contentEl"] &&
        document["activeElement"] !== this["contentEl"] &&
        (v23["outputText"]
          ? ((this["contentEl"]["textContent"] = v23["outputText"]),
            (this["contentEl"]["style"]["color"] = "var(--debug-body-text)"))
          : ((this["contentEl"]["textContent"] = ""),
            (this["contentEl"]["style"]["color"] = "var(--text-muted)"))));
  }
  ["unmount"]() {}
}

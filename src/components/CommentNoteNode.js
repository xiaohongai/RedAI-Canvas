import appStore from "../core/stores/appStore.js";
import { commit } from "../modules/history.js";
import { startNodeResizePreview } from "../modules/interaction/nodeResizePreview.js";
import { bindCommentNoteToolbarEvents } from "./NodeToolbarConfig.js";
import { setStaticInnerHTML } from "../utils/dom.js";
import {
  COMMENT_NOTE_BACKGROUND_COLOR_MAP,
  COMMENT_NOTE_TEXT_COLOR_MAP,
  normalizeCommentNoteStyle,
} from "./commentNoteStyle.js";
const COMMENT_NOTE_MIN_HEIGHT = 90,
  COMMENT_NOTE_MAX_HEIGHT = 720,
  COMMENT_NOTE_PLACEHOLDER = "双击写下注释";
export class CommentNoteNode {
  constructor(v0) {
    ((this["_data"] = v0),
      (this["id"] = v0["id"]),
      (this["el"] = document["createElement"]("div")),
      (this["el"]["className"] = "v2-node-component"));
  }
  ["mount"]() {
    const v1 = this["el"];
    setStaticInnerHTML(v1, "toolbar:comment-note");
    const v2 = document["createElement"]("div");
    v2["className"] = "node-card comment-note-card";
    const v3 = document["createElement"]("div");
    ((v3["className"] = "comment-note-content"),
      v3["setAttribute"]("contenteditable", "false"),
      (v3["spellcheck"] = false),
      (v3["dataset"]["placeholder"] = COMMENT_NOTE_PLACEHOLDER));
    const v4 = document["createElement"]("div");
    ((v4["className"] = "group-resizer"),
      v4["classList"]["add"]("v2-resize-move"),
      v2["appendChild"](v3),
      v2["appendChild"](v4),
      v1["appendChild"](v2),
      (this["_card"] = v2),
      (this["_content"] = v3),
      this["_card"]["addEventListener"]("dblclick", (v5) => {
        v5["stopPropagation"]();
      }));
    const v6 =
      this["_data"]["content"] !== undefined ? this["_data"]["content"] : "";
    this["_content"]["innerText"] = v6;
    !v6
      ? (this["_content"]["dataset"]["placeholder"] = COMMENT_NOTE_PLACEHOLDER)
      : delete this["_content"]["dataset"]["placeholder"];
    (this["_content"]["addEventListener"]("blur", () => {
      (this["_content"]["setAttribute"]("contenteditable", "false"),
        this["el"]["classList"]["remove"]("comment-note-editing"));
      const v7 = this["_content"]["innerText"] || "",
        v8 = this["_measureAutoHeight"]();
      (appStore["updateNodeData"](this["id"], { content: v7, height: v8 }),
        commit());
    }),
      this["_content"]["addEventListener"]("input", () => {
        const v9 = this["_content"]["innerText"] || "";
        (v9["length"] > 0
          ? delete this["_content"]["dataset"]["placeholder"]
          : (this["_content"]["dataset"]["placeholder"] =
              COMMENT_NOTE_PLACEHOLDER),
          this["_syncAutoHeightToStore"]());
      }));
    let v10 = 0,
      v11 = 0;
    (this["_content"]["addEventListener"]("pointerdown", (v12) => {
      if (this["_content"]["getAttribute"]("contenteditable") === "true") {
        v12["stopPropagation"]();
        return;
      }
      ((v10 = v12["clientX"]), (v11 = v12["clientY"]));
    }),
      this["_content"]["addEventListener"]("pointerup", (v13) => {
        if (this["_content"]["getAttribute"]("contenteditable") === "true")
          return;
        const v14 = Math["hypot"](v13["clientX"] - v10, v13["clientY"] - v11);
        if (v14 >= 5) return;
        const v15 = this["_content"]["innerText"]["trim"]();
        if (!v15) {
          this["_enterEditMode"]();
          return;
        }
        const v16 = document["caretRangeFromPoint"]?.(
          v13["clientX"],
          v13["clientY"],
        );
        v16 &&
          this["_content"]["contains"](v16["startContainer"]) &&
          this["_enterEditMode"]();
      }),
      this["_content"]["addEventListener"]("wheel", (v17) => {
        this["_content"]["scrollHeight"] > this["_content"]["clientHeight"] &&
          v17["stopPropagation"]();
      }),
      v4["addEventListener"]("pointerdown", (v18) => {
        startNodeResizePreview({
          event: v18,
          nodeId: this["id"],
          getNode: () =>
            appStore["getStateRaw"]()["nodes"]?.[this["id"]] || this["_data"],
          getViewport: () => appStore["getStateRaw"]()["viewport"],
          resolveSize: ({
            startWidth: v19,
            startHeight: v20,
            dx: v21,
            dy: v22,
          }) => ({
            width: Math["max"](160, v19 + v21),
            height: Math["max"](COMMENT_NOTE_MIN_HEIGHT, v20 + v22),
          }),
          applyPatch: (v23) => appStore["updateNodeData"](this["id"], v23),
          commit: commit,
        });
      }));
    const v24 = v1["querySelector"](".node-floating-toolbar");
    return (
      (this["_syncToolbarState"] = bindCommentNoteToolbarEvents({
        toolbarEl: v24,
        nodeId: this["id"],
        getCurrentStyle: () =>
          normalizeCommentNoteStyle(this["_data"]["style"]),
        enterEditMode: () => this["_enterEditMode"](),
        getNodeSnapshot: () => ({
          ...this["_data"],
          content:
            this["_content"]?.["innerText"] ?? this["_data"]?.["content"] ?? "",
        }),
      })),
      this["_applyNodeState"](this["_data"]),
      v1
    );
  }
  ["_enterEditMode"]() {
    (this["_content"]["setAttribute"]("contenteditable", "true"),
      this["el"]["classList"]["add"]("comment-note-editing"),
      this["_syncAutoHeightToStore"](),
      this["_content"]["focus"]());
    const v25 = appStore["getState"]()["selectedNodeIds"];
    if (!v25["includes"](this["id"]))
      appStore["setSelectedNodes"]([this["id"]]);
  }
  ["_measureAutoHeight"]() {
    if (!this["_content"]) return COMMENT_NOTE_MIN_HEIGHT;
    const v26 = this["_content"]["style"]["height"];
    this["_content"]["style"]["height"] = "auto";
    const v27 = Math["ceil"](this["_content"]["scrollHeight"]);
    return (
      (this["_content"]["style"]["height"] = v26),
      Math["min"](
        COMMENT_NOTE_MAX_HEIGHT,
        Math["max"](COMMENT_NOTE_MIN_HEIGHT, v27),
      )
    );
  }
  ["_syncAutoHeightToStore"]() {
    const v28 = appStore["getStateRaw"]()["nodes"]?.[this["id"]];
    if (!v28) return;
    const v29 = this["_measureAutoHeight"](),
      v30 = Number(v28["height"]) || COMMENT_NOTE_MIN_HEIGHT;
    if (Math["abs"](v29 - v30) < 1) return;
    appStore["updateNodeData"](this["id"], { height: v29 });
  }
  ["_applyNodeState"](v31) {
    const v32 = normalizeCommentNoteStyle(v31["style"]);
    (this["_card"]["style"]["setProperty"](
      "--comment-note-font-size",
      v32["fontSize"] + "px",
    ),
      this["_card"]["style"]["setProperty"](
        "--comment-note-text-color",
        COMMENT_NOTE_TEXT_COLOR_MAP[v32["textColor"]],
      ),
      this["_card"]["style"]["setProperty"](
        "--comment-note-bg-color",
        COMMENT_NOTE_BACKGROUND_COLOR_MAP[v32["backgroundColor"]],
      ),
      this["_card"]["classList"]["toggle"](
        "comment-note-card--transparent",
        v32["backgroundColor"] === "transparent",
      ),
      this["_syncToolbarState"]?.(v32));
  }
  ["update"](v33) {
    this["_data"] = v33;
    if (!this["_content"] || !this["_card"]) return;
    (v33["content"] !== undefined &&
      document["activeElement"] !== this["_content"] &&
      ((this["_content"]["innerText"] = v33["content"] || ""),
      !this["_content"]["innerText"]
        ? (this["_content"]["dataset"]["placeholder"] =
            COMMENT_NOTE_PLACEHOLDER)
        : delete this["_content"]["dataset"]["placeholder"]),
      this["_applyNodeState"](v33));
  }
  ["unmount"]() {}
}

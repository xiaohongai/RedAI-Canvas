import appStore from "../core/stores/appStore.js";
import { commit } from "../modules/history.js";
import { executeGroupGenerateButtons } from "../modules/groupExecution.js";
import { collectGroupContainmentReparentOps } from "../modules/groupMembership.js";
import { startNodeResizePreview } from "../modules/interaction/nodeResizePreview.js";
const getStateSnapshot = () =>
  typeof appStore["getStateRaw"] === "function"
    ? appStore["getStateRaw"]()
    : appStore["getState"]();
export class GroupNode {
  constructor(v0) {
    ((this["_data"] = v0),
      (this["_rootEl"] = null),
      (this["_titleEl"] = null),
      (this["_toolbarEl"] = null),
      (this["_detachedToolbarEl"] = null),
      (this["_colorMenuOutsidePointerDown"] = null),
      (this["_toolbarInteractivityRaf"] = null),
      (this["_toolbarPreviewOffsetX"] = 0),
      (this["_toolbarPreviewOffsetY"] = 0));
  }
  ["mount"]() {
    ((this["_rootEl"] = document["createElement"]("div")),
      (this["_rootEl"]["style"]["width"] = "100%"),
      (this["_rootEl"]["style"]["height"] = "100%"),
      (this["_titleEl"] = document["createElement"]("div")),
      (this["_titleEl"]["className"] = "node-group-title"),
      (this["_titleEl"]["contentEditable"] = "true"),
      (this["_titleEl"]["spellcheck"] = false),
      (this["_titleEl"]["title"] = "点击重命名"),
      (this["_titleEl"]["textContent"] = this["_data"]["name"] || "新建组"),
      this["_titleEl"]["addEventListener"]("pointerdown", (v1) =>
        v1["stopPropagation"](),
      ),
      this["_titleEl"]["addEventListener"]("keydown", (v2) => {
        v2["key"] === "Enter" &&
          (v2["preventDefault"](), this["_titleEl"]["blur"]());
      }),
      this["_titleEl"]["addEventListener"]("blur", () => {
        (appStore["updateNodeData"](this["_data"]["id"], {
          name: this["_titleEl"]["textContent"],
        }),
          commit());
      }),
      this["_rootEl"]["appendChild"](this["_titleEl"]));
    const v3 = document["createElement"]("div");
    ((v3["className"] = "group-toolbar"),
      (v3["dataset"]["groupToolbarFor"] = this["_data"]["id"]),
      (v3["onpointerdown"] = (v4) => v4["stopPropagation"]()),
      (this["_toolbarEl"] = v3));
    const v5 = "http://www.w3.org/2000/svg",
      v6 = () => {
        const v7 = document["createElementNS"](v5, "svg");
        return (
          v7["setAttribute"]("viewBox", "0 0 24 24"),
          v7["setAttribute"]("fill", "none"),
          v7["setAttribute"]("stroke", "currentColor"),
          v7["setAttribute"]("stroke-linecap", "round"),
          v7["setAttribute"]("stroke-linejoin", "round"),
          v7
        );
      },
      v8 = (v9, v10) => {
        ((v9["type"] = "button"),
          (v9["title"] = v10),
          v9["setAttribute"]("aria-label", v10));
      },
      v11 = document["createElement"]("button");
    ((v11["className"] = "gt-btn\x20gt-btn-run"),
      v8(v11, "整组执行"),
      v11["replaceChildren"]());
    const v12 = v6();
    v12["setAttribute"]("stroke-width", "2.5");
    const v13 = document["createElementNS"](v5, "polygon");
    (v13["setAttribute"]("points", "5 3 19 12 5 21 5 3"),
      v12["appendChild"](v13),
      v11["appendChild"](v12),
      (v11["onclick"] = (v14) => {
        (v14["stopPropagation"](), this["_runGroup"]());
      }),
      v3["appendChild"](v11));
    const v15 = document["createElement"]("div");
    v15["className"] = "gt-color-wrap";
    const v16 = document["createElement"]("button");
    ((v16["className"] = "gt-btn gt-btn-color"),
      v8(v16, "颜色"),
      v16["replaceChildren"]());
    const v17 = document["createElement"]("div");
    ((v17["className"] = "color-dot"),
      (v17["style"]["background"] = this["_data"]["color"] || "var(--indigo)"),
      v16["appendChild"](v17));
    const v18 = document["createElement"]("div");
    v18["className"] = "gt-color-menu";
    const v19 = [
      "var(--indigo)",
      "var(--green)",
      "var(--gold)",
      "var(--red)",
      "var(--purple)",
      "var(--group-pink)",
      "var(--group-slate)",
      "var(--cyan)",
    ];
    ((v16["onclick"] = (v20) => {
      v20["stopPropagation"]();
      const v21 = v18["classList"]["contains"]("show");
      document["querySelectorAll"](".gt-color-menu.show")["forEach"]((v22) =>
        v22["classList"]["remove"]("show"),
      );
      if (!v21) v18["classList"]["add"]("show");
    }),
      v19["forEach"]((v23) => {
        const v24 = document["createElement"]("div");
        ((v24["className"] = "color-option"),
          (v24["dataset"]["groupColor"] = v23),
          (v24["style"]["background"] = v23),
          (v24["onclick"] = (v25) => {
            (v25["stopPropagation"](), this["_setColor"](v23));
          }),
          v18["appendChild"](v24));
      }),
      (this["_colorMenuOutsidePointerDown"] = () =>
        v18["classList"]["remove"]("show")),
      window["addEventListener"](
        "pointerdown",
        this["_colorMenuOutsidePointerDown"],
      ),
      v15["appendChild"](v16),
      v15["appendChild"](v18),
      v3["appendChild"](v15));
    const v26 = document["createElement"]("button");
    ((v26["className"] = "gt-btn gt-btn-workflow"),
      v8(v26, "创建工作流"),
      v26["replaceChildren"]());
    const v27 = v6();
    v27["setAttribute"]("stroke-width", "1.8");
    const v28 = document["createElementNS"](v5, "rect");
    (v28["setAttribute"]("x", "3"),
      v28["setAttribute"]("y", "3"),
      v28["setAttribute"]("width", "18"),
      v28["setAttribute"]("height", "18"),
      v28["setAttribute"]("rx", "2"),
      v28["setAttribute"]("ry", "2"));
    const v29 = document["createElementNS"](v5, "line");
    (v29["setAttribute"]("x1", "3"),
      v29["setAttribute"]("y1", "9"),
      v29["setAttribute"]("x2", "21"),
      v29["setAttribute"]("y2", "9"));
    const v30 = document["createElementNS"](v5, "line");
    (v30["setAttribute"]("x1", "9"),
      v30["setAttribute"]("y1", "21"),
      v30["setAttribute"]("x2", "9"),
      v30["setAttribute"]("y2", "9"),
      v27["appendChild"](v28),
      v27["appendChild"](v29),
      v27["appendChild"](v30),
      v26["appendChild"](v27),
      (v26["onclick"] = (v31) => {
        (v31["stopPropagation"](), this["_requestWorkflow"]());
      }),
      v3["appendChild"](v26));
    const v32 = document["createElement"]("button");
    ((v32["className"] = "gt-btn gt-btn-ungroup"),
      v8(v32, "解组"),
      v32["replaceChildren"]());
    const v33 = v6();
    v33["setAttribute"]("stroke-width", "2");
    const v34 = document["createElementNS"](v5, "path");
    v34["setAttribute"]("d", "M3 6h18");
    const v35 = document["createElementNS"](v5, "path");
    v35["setAttribute"]("d", "M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2");
    const v36 = document["createElementNS"](v5, "path");
    v36["setAttribute"]("d", "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6");
    const v37 = document["createElementNS"](v5, "line");
    (v37["setAttribute"]("x1", "10"),
      v37["setAttribute"]("y1", "11"),
      v37["setAttribute"]("x2", "10"),
      v37["setAttribute"]("y2", "17"));
    const v38 = document["createElementNS"](v5, "line");
    (v38["setAttribute"]("x1", "14"),
      v38["setAttribute"]("y1", "11"),
      v38["setAttribute"]("x2", "14"),
      v38["setAttribute"]("y2", "17"),
      v33["appendChild"](v34),
      v33["appendChild"](v35),
      v33["appendChild"](v36),
      v33["appendChild"](v37),
      v33["appendChild"](v38),
      v32["appendChild"](v33),
      (v32["onclick"] = (v39) => {
        (v39["stopPropagation"](), this["_ungroup"]());
      }),
      v3["appendChild"](v32),
      this["_rootEl"]["appendChild"](v3),
      this["_mountDetachedToolbar"](v3));
    const v40 = document["createElement"]("div");
    return (
      (v40["className"] = "group-resizer"),
      (v40["style"]["pointerEvents"] = "auto"),
      v40["addEventListener"]("pointerdown", (v41) => {
        startNodeResizePreview({
          event: v41,
          nodeId: this["_data"]["id"],
          getNode: () =>
            getStateSnapshot()["nodes"]?.[this["_data"]["id"]] || this["_data"],
          getViewport: () => getStateSnapshot()["viewport"],
          resolveSize: ({
            startWidth: v42,
            startHeight: v43,
            dx: v44,
            dy: v45,
          }) => ({
            width: Math["max"](150, v42 + v44),
            height: Math["max"](100, v43 + v45),
          }),
          applyPatch: (v46) =>
            appStore["updateNodeData"](this["_data"]["id"], v46),
          onPreview: (v47) => this["_syncToolbarPosition"](v47["width"]),
          afterApply: () => this["_syncContainedChildren"](),
          commit: commit,
          label: "group-resize",
        });
      }),
      this["_rootEl"]["appendChild"](v40),
      this["_syncColor"](this["_data"]["color"] || "var(--indigo)"),
      this["_rootEl"]
    );
  }
  ["_mountDetachedToolbar"](v48) {
    const v49 = document["getElementById"]("v2-canvas");
    if (!v49) return;
    const v50 = v48["cloneNode"](true);
    (v50["classList"]["add"]("group-toolbar--detached"),
      (v50["onpointerdown"] = (v51) => v51["stopPropagation"]()),
      v50["addEventListener"]("click", (v52) =>
        this["_handleDetachedToolbarClick"](v52),
      ),
      v49["appendChild"](v50),
      (this["_detachedToolbarEl"] = v50),
      this["_syncToolbarPosition"]());
  }
  ["_syncToolbarPosition"](v53 = null) {
    if (!this["_detachedToolbarEl"]) return;
    const v54 = Number["isFinite"](this["_data"]["x"]) ? this["_data"]["x"] : 0,
      v55 = Number["isFinite"](this["_data"]["y"]) ? this["_data"]["y"] : 0,
      v56 = Number["isFinite"](v53)
        ? v53
        : Number["isFinite"](this["_data"]["width"])
          ? this["_data"]["width"]
          : 0,
      v57 = v54 + this["_toolbarPreviewOffsetX"] + v56 / 2;
    ((this["_detachedToolbarEl"]["style"]["left"] = v57 + "px"),
      (this["_detachedToolbarEl"]["style"]["top"] =
        v55 + this["_toolbarPreviewOffsetY"] + "px"));
  }
  ["syncDragPreview"]({ dx: dx = 0, dy: dy = 0, active: active = false } = {}) {
    const v58 = active && Number["isFinite"](dx) ? dx : 0,
      v59 = active && Number["isFinite"](dy) ? dy : 0;
    if (
      v58 === this["_toolbarPreviewOffsetX"] &&
      v59 === this["_toolbarPreviewOffsetY"]
    )
      return;
    ((this["_toolbarPreviewOffsetX"] = v58),
      (this["_toolbarPreviewOffsetY"] = v59),
      this["_syncToolbarPosition"]());
  }
  ["syncSelectionState"]({
    selected: selected = false,
    singleSelected: singleSelected = false,
    visible: visible = true,
  } = {}) {
    if (!this["_detachedToolbarEl"]) return;
    const v60 = visible && selected && singleSelected;
    this["_detachedToolbarEl"]["classList"]["toggle"]("is-visible", v60);
    if (!v60) {
      this["_toolbarInteractivityRaf"] !== null &&
        (cancelAnimationFrame(this["_toolbarInteractivityRaf"]),
        (this["_toolbarInteractivityRaf"] = null));
      this["_syncDetachedToolbarInteractivity"](false);
      return;
    }
    this["_scheduleDetachedToolbarInteractivitySync"](v60);
  }
  ["_syncColor"](v61) {
    [this["_toolbarEl"], this["_detachedToolbarEl"]]["forEach"]((v62) => {
      const v63 = v62?.["querySelector"](".color-dot");
      if (v63) v63["style"]["background"] = v61;
    });
  }
  ["_closeColorMenus"]() {
    document["querySelectorAll"](".gt-color-menu.show")["forEach"]((v64) =>
      v64["classList"]["remove"]("show"),
    );
  }
  ["_runGroup"]() {
    executeGroupGenerateButtons({ groupId: this["_data"]["id"] });
  }
  ["_setColor"](v65) {
    (appStore["updateNodeData"](this["_data"]["id"], { color: v65 }),
      this["_closeColorMenus"](),
      commit());
  }
  ["_syncContainedChildren"]() {
    const { nodes: v66 } = getStateSnapshot(),
      v67 = collectGroupContainmentReparentOps(v66, [this["_data"]["id"]]);
    if (v67["length"] === 0) return false;
    const v68 = () => {
      v67["forEach"](({ nodeId: v69, parentId: v70 }) => {
        appStore["groupNodes"]([v69], v70);
      });
    };
    if (typeof appStore["batch"] === "function")
      return (appStore["batch"](v68), true);
    return (v68(), true);
  }
  ["_requestWorkflow"]() {
    window["dispatchEvent"](
      new CustomEvent("workflow:create-request", {
        detail: { source: "group-toolbar", groupId: this["_data"]["id"] },
      }),
    );
  }
  ["_ungroup"]() {
    const { nodes: v71 } = appStore["getState"]();
    (Object["values"](v71)["forEach"]((v72) => {
      v72["parentId"] === this["_data"]["id"] &&
        appStore["updateNodeData"](v72["id"], { parentId: undefined });
    }),
      appStore["deleteNodes"]([this["_data"]["id"]]),
      commit());
  }
  ["_handleDetachedToolbarClick"](v73) {
    const v74 = v73["target"];
    if (!(v74 instanceof Element)) return;
    const v75 = v74["closest"](
      ".gt-btn-run, .gt-btn-color, .gt-btn-workflow, .gt-btn-ungroup, .color-option",
    );
    if (!v75 || !this["_detachedToolbarEl"]?.["contains"](v75)) return;
    v73["stopPropagation"]();
    if (v75["classList"]["contains"]("color-option")) {
      const v76 = v75["dataset"]["groupColor"] || v75["style"]["background"];
      if (v76) this["_setColor"](v76);
      return;
    }
    if (v75["classList"]["contains"]("gt-btn-run")) {
      this["_runGroup"]();
      return;
    }
    if (v75["classList"]["contains"]("gt-btn-workflow")) {
      this["_requestWorkflow"]();
      return;
    }
    if (v75["classList"]["contains"]("gt-btn-ungroup")) {
      this["_ungroup"]();
      return;
    }
    if (v75["classList"]["contains"]("gt-btn-color")) {
      const v77 = this["_detachedToolbarEl"]["querySelector"](".gt-color-menu"),
        v78 = v77?.["classList"]["contains"]("show");
      this["_closeColorMenus"]();
      if (v77 && !v78) v77["classList"]["add"]("show");
    }
  }
  ["_syncDetachedToolbarInteractivity"](v79) {
    if (!this["_detachedToolbarEl"]) return;
    this["_detachedToolbarEl"]["classList"]["remove"]("is-interactive");
    if (!v79 || !this["_toolbarEl"]) return;
    const v80 = Array["from"](this["_toolbarEl"]["querySelectorAll"](".gt-btn"))
        ["map"]((v81) => v81["getBoundingClientRect"]())
        ["filter"]((v82) => v82["width"] > 0 && v82["height"] > 0),
      v83 = this["_toolbarEl"]["getBoundingClientRect"]();
    v83["width"] > 0 && v83["height"] > 0 && v80["push"](v83);
    const v84 = v80["some"]((v85) => {
      const v86 = v85["left"] + v85["width"] / 2,
        v87 = v85["top"] + v85["height"] / 2,
        v88 = document["elementFromPoint"](v86, v87);
      return v88 && !this["_toolbarEl"]["contains"](v88);
    });
    this["_detachedToolbarEl"]["classList"]["toggle"]("is-interactive", v84);
  }
  ["_scheduleDetachedToolbarInteractivitySync"](v89) {
    this["_syncDetachedToolbarInteractivity"](v89);
    this["_toolbarInteractivityRaf"] !== null &&
      (cancelAnimationFrame(this["_toolbarInteractivityRaf"]),
      (this["_toolbarInteractivityRaf"] = null));
    if (typeof requestAnimationFrame !== "function") return;
    this["_toolbarInteractivityRaf"] = requestAnimationFrame(() => {
      ((this["_toolbarInteractivityRaf"] = null),
        this["_syncDetachedToolbarInteractivity"](v89));
    });
  }
  ["update"](v90) {
    (v90["name"] !== this["_data"]["name"] &&
      document["activeElement"] !== this["_titleEl"] &&
      (this["_titleEl"]["textContent"] = v90["name"] || "新建组"),
      v90["color"] !== this["_data"]["color"] &&
        this["_syncColor"](v90["color"] || "var(--indigo)"),
      (this["_toolbarPreviewOffsetX"] = 0),
      (this["_toolbarPreviewOffsetY"] = 0),
      (this["_data"] = v90),
      this["_syncToolbarPosition"]());
  }
  ["unmount"]() {
    (this["_toolbarInteractivityRaf"] !== null &&
      (cancelAnimationFrame(this["_toolbarInteractivityRaf"]),
      (this["_toolbarInteractivityRaf"] = null)),
      this["_colorMenuOutsidePointerDown"] &&
        (window["removeEventListener"](
          "pointerdown",
          this["_colorMenuOutsidePointerDown"],
        ),
        (this["_colorMenuOutsidePointerDown"] = null)),
      this["_toolbarEl"]?.["isConnected"] && this["_toolbarEl"]["remove"](),
      this["_detachedToolbarEl"]?.["isConnected"] &&
        this["_detachedToolbarEl"]["remove"](),
      (this["_detachedToolbarEl"] = null),
      (this["_toolbarEl"] = null),
      (this["_titleEl"] = null),
      (this["_rootEl"] = null));
  }
}

import { test } from "node:test";
import strict from "node:assert/strict";
import appStore from "../core/stores/appStore.js";
import { normalizeEmptyStoryboardCell } from "../core/storyboardCellUtils.js";
import { StoryboardNode } from "./StoryboardNode.js";
class FakeClassList {
  constructor() {
    this["_items"] = new Set();
  }
  ["add"](...v0) {
    v0["forEach"]((v1) => {
      if (v1) this["_items"]["add"](String(v1));
    });
  }
  ["remove"](...v2) {
    v2["forEach"]((v3) => this["_items"]["delete"](String(v3)));
  }
  ["contains"](v4) {
    return this["_items"]["has"](String(v4));
  }
  ["toggle"](v5, v6) {
    const v7 = String(v5);
    if (v6 === true) return (this["_items"]["add"](v7), true);
    if (v6 === false) return (this["_items"]["delete"](v7), false);
    if (this["_items"]["has"](v7)) return (this["_items"]["delete"](v7), false);
    return (this["_items"]["add"](v7), true);
  }
}
class FakeStyle {
  constructor() {
    ((this["_props"] = {}), (this["_priorities"] = {}));
  }
  ["setProperty"](v8, v9, v10 = "") {
    const v11 = String(v8),
      v12 = String(v9);
    ((this["_props"][v11] = v12),
      (this["_priorities"][v11] = String(v10 || "")),
      (this[v11] = v12));
  }
  ["getPropertyPriority"](v13) {
    return this["_priorities"][String(v13)] ?? "";
  }
  ["removeProperty"](v14) {
    const v15 = String(v14);
    (delete this["_props"][v15],
      delete this["_priorities"][v15],
      delete this[v15]);
  }
}
class FakeNode {
  constructor(v16 = 1) {
    ((this["nodeType"] = v16), (this["parentNode"] = null));
  }
  get ["parentElement"]() {
    return this["parentNode"] instanceof FakeElement
      ? this["parentNode"]
      : null;
  }
}
class FakeTextNode extends FakeNode {
  constructor(v17 = "") {
    (super(3), (this["textContent"] = String(v17)));
  }
  ["cloneNode"]() {
    return new FakeTextNode(this["textContent"]);
  }
}
class FakeDocumentFragment extends FakeNode {
  constructor() {
    (super(11), (this["children"] = []), (this["childNodes"] = []));
  }
  ["appendChild"](v18) {
    if (!v18) return v18;
    v18["parentNode"] &&
      v18["parentNode"] !== this &&
      v18["parentNode"]["removeChild"]?.(v18);
    ((v18["parentNode"] = this), this["childNodes"]["push"](v18));
    if (v18 instanceof FakeElement) this["children"]["push"](v18);
    return v18;
  }
}
function matchesSimpleSelector(v19, v20) {
  if (!(v19 instanceof FakeElement)) return false;
  if (v20["startsWith"]("."))
    return v19["classList"]["contains"](v20["slice"](1));
  if (v20["startsWith"]("#")) return v19["id"] === v20["slice"](1);
  return v19["tagName"]["toLowerCase"]() === v20["toLowerCase"]();
}
function matchesSelectorChain(v21, v22) {
  const v23 = String(v22 || "")
    ["trim"]()
    ["split"](/\s+/)
    ["filter"](Boolean);
  if (v23["length"] === 0) return false;
  if (!matchesSimpleSelector(v21, v23[v23["length"] - 1])) return false;
  let v24 = v21["parentElement"];
  for (let v25 = v23["length"] - 2; v25 >= 0; v25--) {
    while (v24 && !matchesSimpleSelector(v24, v23[v25])) {
      v24 = v24["parentElement"];
    }
    if (!v24) return false;
    v24 = v24["parentElement"];
  }
  return true;
}
class FakeElement extends FakeNode {
  constructor(v26 = "div", v27 = null) {
    (super(1),
      (this["tagName"] = String(v26)["toUpperCase"]()),
      (this["ownerDocument"] = v27),
      (this["children"] = []),
      (this["childNodes"] = []),
      (this["dataset"] = {}),
      (this["style"] = new FakeStyle()),
      (this["classList"] = new FakeClassList()),
      (this["attributes"] = new Map()),
      (this["eventListeners"] = new Map()),
      (this["textContent"] = ""),
      (this["id"] = ""),
      (this["_className"] = ""));
  }
  get ["className"]() {
    return this["_className"];
  }
  set ["className"](v28) {
    ((this["_className"] = String(v28 || "")),
      (this["classList"] = new FakeClassList()),
      this["_className"]
        ["split"](/\s+/)
        ["filter"](Boolean)
        ["forEach"]((v29) => this["classList"]["add"](v29)));
  }
  get ["firstElementChild"]() {
    return this["children"][0] || null;
  }
  ["_appendSingleChild"](v30) {
    if (!v30) return v30;
    v30["parentNode"] &&
      v30["parentNode"] !== this &&
      v30["parentNode"]["removeChild"]?.(v30);
    ((v30["parentNode"] = this), this["childNodes"]["push"](v30));
    if (v30 instanceof FakeElement) this["children"]["push"](v30);
    return v30;
  }
  ["appendChild"](v31) {
    if (!v31) return v31;
    if (v31["nodeType"] === 11) {
      const v32 = [...v31["childNodes"]];
      return (
        (v31["childNodes"]["length"] = 0),
        (v31["children"]["length"] = 0),
        v32["forEach"]((v33) => this["_appendSingleChild"](v33)),
        v31
      );
    }
    return this["_appendSingleChild"](v31);
  }
  ["insertBefore"](v34, v35) {
    if (!v34) return v34;
    if (!v35 || v35["parentNode"] !== this) return this["appendChild"](v34);
    if (v34["nodeType"] === 11) {
      const v36 = [...v34["childNodes"]];
      return (
        (v34["childNodes"]["length"] = 0),
        (v34["children"]["length"] = 0),
        v36["forEach"]((v37) => this["insertBefore"](v37, v35)),
        v34
      );
    }
    v34["parentNode"] && v34["parentNode"]["removeChild"]?.(v34);
    const v38 = this["childNodes"]["indexOf"](v35),
      v39 = this["children"]["indexOf"](v35);
    return (
      (v34["parentNode"] = this),
      this["childNodes"]["splice"](v38, 0, v34),
      v34 instanceof FakeElement && this["children"]["splice"](v39, 0, v34),
      v34
    );
  }
  ["removeChild"](v40) {
    const v41 = this["childNodes"]["indexOf"](v40);
    if (v41 >= 0) this["childNodes"]["splice"](v41, 1);
    const v42 = this["children"]["indexOf"](v40);
    if (v42 >= 0) this["children"]["splice"](v42, 1);
    return ((v40["parentNode"] = null), v40);
  }
  ["replaceChildren"](...v43) {
    ([...this["childNodes"]]["forEach"]((v44) => this["removeChild"](v44)),
      v43["forEach"]((v45) => this["appendChild"](v45)));
  }
  ["remove"]() {
    this["parentNode"]?.["removeChild"]?.(this);
  }
  ["setAttribute"](v46, v47) {
    const v48 = String(v46),
      v49 = String(v47);
    this["attributes"]["set"](v48, v49);
    if (v48 === "id") this["id"] = v49;
    if (v48 === "class") this["className"] = v49;
  }
  ["getAttribute"](v50) {
    return this["attributes"]["get"](String(v50)) ?? null;
  }
  ["addEventListener"](v51, v52) {
    const v53 = this["eventListeners"]["get"](v51) || [];
    (v53["push"](v52), this["eventListeners"]["set"](v51, v53));
  }
  ["removeEventListener"](v54, v55) {
    const v56 = this["eventListeners"]["get"](v54) || [];
    this["eventListeners"]["set"](
      v54,
      v56["filter"]((v57) => v57 !== v55),
    );
  }
  ["closest"](v58) {
    let v59 = this;
    while (v59) {
      if (matchesSimpleSelector(v59, v58)) return v59;
      v59 = v59["parentElement"];
    }
    return null;
  }
  ["contains"](v60) {
    let v61 = v60;
    while (v61) {
      if (v61 === this) return true;
      v61 = v61["parentNode"];
    }
    return false;
  }
  ["querySelector"](v62) {
    return this["querySelectorAll"](v62)[0] || null;
  }
  ["querySelectorAll"](v63) {
    const v64 = [],
      v65 = (v66) => {
        for (const v67 of v66["children"] || []) {
          if (matchesSelectorChain(v67, v63)) v64["push"](v67);
          v65(v67);
        }
      };
    return (v65(this), v64);
  }
  ["cloneNode"](v68 = false) {
    const v69 = new FakeElement(
      this["tagName"]["toLowerCase"](),
      this["ownerDocument"],
    );
    ((v69["id"] = this["id"]),
      (v69["className"] = this["className"]),
      (v69["textContent"] = this["textContent"]),
      (v69["dataset"] = { ...this["dataset"] }),
      (v69["style"] = Object["assign"](new FakeStyle(), this["style"])));
    for (const [v70, v71] of this["attributes"]["entries"]()) {
      v69["attributes"]["set"](v70, v71);
    }
    return (
      v68 &&
        this["childNodes"]["forEach"]((v72) =>
          v69["appendChild"](v72["cloneNode"](true)),
        ),
      v69
    );
  }
  ["blur"]() {}
  ["setPointerCapture"]() {}
  ["getBoundingClientRect"]() {
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
}
function createFakeDocument() {
  const v73 = new Map(),
    v74 = {
      body: null,
      createElement(v75) {
        return new FakeElement(v75, v74);
      },
      createElementNS(v76, v77) {
        return new FakeElement(v77, v74);
      },
      createTextNode(v78) {
        return new FakeTextNode(v78);
      },
      createDocumentFragment() {
        return new FakeDocumentFragment();
      },
      addEventListener(v79, v80) {
        const v81 = String(v79),
          v82 = v73["get"](v81) || [];
        (v82["push"](v80), v73["set"](v81, v82));
      },
      removeEventListener(v83, v84) {
        const v85 = String(v83),
          v86 = v73["get"](v85) || [];
        v73["set"](
          v85,
          v86["filter"]((v87) => v87 !== v84),
        );
      },
      dispatchEvent(v88) {
        const v89 = String(v88?.["type"] || ""),
          v90 = [...(v73["get"](v89) || [])];
        return (v90["forEach"]((v91) => v91(v88)), true);
      },
      importNode(v92) {
        return v92["cloneNode"](true);
      },
      getElementById(v93) {
        return v74["body"]?.["querySelector"]("#" + v93) || null;
      },
    };
  return ((v74["body"] = new FakeElement("body", v74)), v74);
}
function createButtonEvent(v94) {
  return { stopPropagation() {}, target: v94 };
}
(test("StoryboardNode: 自定义分割线按钮位于编辑左侧并且确定后才提交", async () => {
  const v95 = globalThis["document"],
    v96 = appStore["updateNodeData"],
    v97 = createFakeDocument(),
    v98 = [];
  ((globalThis["document"] = v97),
    (appStore["updateNodeData"] = (v99, v100) => {
      v98["push"]({ id: v99, patch: v100 });
    }));
  try {
    const v101 = new StoryboardNode({
        id: "sb-custom-grid",
        type: "storyboard",
        cols: 2,
        rows: 2,
        width: 200,
        height: 100,
        gridGap: 20,
        cells: [
          { id: "cell-1", isEmpty: true, url: "" },
          { id: "cell-2", isEmpty: true, url: "" },
          { id: "cell-3", isEmpty: true, url: "" },
          { id: "cell-4", isEmpty: true, url: "" },
        ],
      }),
      v102 = v101["mount"]();
    v97["body"]["appendChild"](v102);
    const v103 = v102["querySelectorAll"](".sb-cell"),
      v104 = (v105) => ({
        left: v105["style"]["left"],
        top: v105["style"]["top"],
        width: v105["style"]["width"],
        height: v105["style"]["height"],
      }),
      v106 = v104(v103[0]),
      v107 = v104(v103[1]),
      v108 = v102["querySelector"](".act-split-lines"),
      v109 = v102["querySelector"](".act-edit"),
      v110 = v102["querySelectorAll"](".storyboard-toolbar .ftb-btn");
    (strict["equal"](v110["indexOf"](v108), v110["indexOf"](v109) - 1),
      strict["equal"](v108["classList"]["contains"]("icon-only"), true),
      strict["equal"](
        v108["querySelector"](".storyboard-split-lines-label"),
        null,
      ),
      strict["equal"](
        v108["querySelector"](".storyboard-split-lines-menu-trigger"),
        null,
      ),
      strict["equal"](v108["querySelectorAll"]("circle")["length"], 2),
      v108["onclick"](createButtonEvent(v108)),
      strict["equal"](v108["classList"]["contains"]("active"), true),
      strict["equal"](v108["classList"]["contains"]("is-confirm"), false),
      strict["equal"](v108["querySelectorAll"]("circle")["length"], 2),
      strict["equal"](v108["dataset"]["tooltip"], "完成调整"),
      strict["equal"](
        v102["classList"]["contains"]("is-custom-grid-mode"),
        true,
      ),
      strict["equal"](v98["length"], 0),
      strict["notEqual"](
        v102["querySelector"](".storyboard-split-lines-menu"),
        null,
      ),
      strict["deepEqual"](v104(v103[0]), v106),
      strict["deepEqual"](v104(v103[1]), v107),
      (v101["_grid"]["getBoundingClientRect"] = () => ({
        left: 0,
        top: 0,
        right: 200,
        bottom: 100,
        width: 200,
        height: 100,
      })));
    const v111 = v102["querySelector"](
        ".storyboard-custom-grid-handle-vertical",
      ),
      v112 = v111["eventListeners"]["get"]("pointerdown")[0];
    (v112({
      type: "pointerdown",
      clientX: 100,
      clientY: 0,
      pointerId: 1,
      currentTarget: v111,
      preventDefault() {},
      stopPropagation() {},
    }),
      v97["dispatchEvent"]({ type: "pointermove", clientX: 150, clientY: 0 }),
      v97["dispatchEvent"]({ type: "pointerup" }),
      strict["equal"](v98["length"], 0),
      strict["equal"](
        v101["_grid"]["style"]["gridTemplateColumns"],
        "1fr\x201fr",
      ),
      strict["equal"](v101["_grid"]["style"]["gridTemplateRows"], "1fr\x201fr"),
      strict["equal"](v101["_grid"]["style"]["gap"], "0px"),
      strict["deepEqual"](v104(v103[0]), v106),
      strict["deepEqual"](v104(v103[1]), v107),
      strict["equal"](
        v102["querySelector"](".storyboard-custom-grid-handle-vertical")[
          "style"
        ]["left"],
        "75%",
      ),
      v97["dispatchEvent"]({ type: "pointerdown", target: v97["body"] }),
      strict["notEqual"](
        v102["querySelector"](".storyboard-split-lines-menu"),
        null,
      ),
      strict["equal"](v108["classList"]["contains"]("active"), true));
    const v113 = v102["querySelector"](".act-aspect");
    (v113["onclick"](createButtonEvent(v113)),
      strict["notEqual"](
        v102["querySelector"](".storyboard-split-lines-menu"),
        null,
      ),
      await v108["onclick"](createButtonEvent(v108)),
      strict["equal"](v98["length"], 1),
      strict["equal"](v98[0]["id"], "sb-custom-grid"),
      strict["deepEqual"](v98[0]["patch"]["gridLayout"], {
        columns: [1.5, 0.5],
        rows: [1, 1],
      }),
      strict["equal"](v108["classList"]["contains"]("active"), false),
      strict["equal"](v108["classList"]["contains"]("is-confirm"), false),
      strict["equal"](v108["querySelectorAll"]("circle")["length"], 2),
      strict["equal"](v108["dataset"]["tooltip"], "调整分割线"),
      strict["equal"](
        v102["classList"]["contains"]("is-custom-grid-mode"),
        false,
      ),
      strict["equal"](
        v102["querySelector"](".storyboard-split-lines-menu"),
        null,
      ),
      strict["equal"](v103[0]["style"]["left"], "0px"),
      strict["equal"](v103[0]["style"]["width"], "140px"),
      strict["equal"](v103[1]["style"]["left"], "160px"),
      strict["equal"](v103[1]["style"]["width"], "40px"),
      strict["notEqual"](
        v102["querySelector"](".storyboard-custom-grid-line-vertical"),
        null,
      ));
  } finally {
    ((globalThis["document"] = v95), (appStore["updateNodeData"] = v96));
  }
}),
  test("StoryboardNode:\x20拖动分割线预览只移动线不移动内容块", async () => {
    const v114 = globalThis["document"],
      v115 = appStore["updateNodeData"],
      v116 = createFakeDocument(),
      v117 = [],
      v118 = (v119) =>
        Array["from"](v119)["map"]((v120) => ({
          display: v120["style"]["display"],
          left: v120["style"]["left"],
          top: v120["style"]["top"],
          width: v120["style"]["width"],
          height: v120["style"]["height"],
        }));
    ((globalThis["document"] = v116),
      (appStore["updateNodeData"] = (v121, v122) => {
        v117["push"]({ id: v121, patch: v122 });
      }));
    try {
      const v123 = [
        {
          axis: "columns",
          gap: 0,
          selector: ".storyboard-custom-grid-handle-vertical",
          down: { clientX: 150, clientY: 0 },
          move: { type: "pointermove", clientX: 210, clientY: 0 },
          expectedLine: "70%",
          expectedHitSize: "18px",
        },
        {
          axis: "columns",
          gap: 20,
          selector: ".storyboard-custom-grid-handle-vertical",
          down: { clientX: 150, clientY: 0 },
          move: { type: "pointermove", clientX: 210, clientY: 0 },
          expectedLine: "70%",
          expectedHitSize: "20px",
        },
        {
          axis: "columns",
          gap: 80,
          selector: ".storyboard-custom-grid-handle-vertical",
          down: { clientX: 150, clientY: 0 },
          move: { type: "pointermove", clientX: 210, clientY: 0 },
          expectedLine: "70%",
          expectedHitSize: "80px",
        },
        {
          axis: "rows",
          gap: 0,
          selector: ".storyboard-custom-grid-handle-horizontal",
          down: { clientX: 0, clientY: 100 },
          move: { type: "pointermove", clientX: 0, clientY: 140 },
          expectedLine: "70%",
          expectedHitSize: "18px",
        },
        {
          axis: "rows",
          gap: 20,
          selector: ".storyboard-custom-grid-handle-horizontal",
          down: { clientX: 0, clientY: 100 },
          move: { type: "pointermove", clientX: 0, clientY: 140 },
          expectedLine: "70%",
          expectedHitSize: "20px",
        },
        {
          axis: "rows",
          gap: 80,
          selector: ".storyboard-custom-grid-handle-horizontal",
          down: { clientX: 0, clientY: 100 },
          move: { type: "pointermove", clientX: 0, clientY: 140 },
          expectedLine: "70%",
          expectedHitSize: "80px",
        },
      ];
      for (const v124 of v123) {
        v117["length"] = 0;
        const v125 = new StoryboardNode({
            id: "sb-preview-" + v124["axis"] + "-" + v124["gap"],
            type: "storyboard",
            cols: 2,
            rows: 2,
            width: 300,
            height: 200,
            gridGap: v124["gap"],
            cells: [
              { id: "cell-1", isEmpty: true, url: "" },
              { id: "cell-2", isEmpty: true, url: "" },
              { id: "cell-3", isEmpty: true, url: "" },
              { id: "cell-4", isEmpty: true, url: "" },
            ],
          }),
          v126 = v125["mount"]();
        v116["body"]["appendChild"](v126);
        const v127 = v126["querySelectorAll"](".sb-cell"),
          v128 = v118(v127);
        v125["_grid"]["getBoundingClientRect"] = () => ({
          left: 0,
          top: 0,
          right: 300,
          bottom: 200,
          width: 300,
          height: 200,
        });
        const v129 = v126["querySelector"](".act-split-lines");
        (v129["onclick"](createButtonEvent(v129)),
          strict["deepEqual"](v118(v127), v128));
        const v130 = v126["querySelector"](v124["selector"]);
        v124["axis"] === "columns"
          ? strict["equal"](v130["style"]["width"], v124["expectedHitSize"])
          : strict["equal"](v130["style"]["height"], v124["expectedHitSize"]);
        (v130["eventListeners"]["get"]("pointerdown")[0]({
          type: "pointerdown",
          ...v124["down"],
          pointerId: 1,
          currentTarget: v130,
          preventDefault() {},
          stopPropagation() {},
        }),
          v116["dispatchEvent"](v124["move"]),
          v116["dispatchEvent"]({ type: "pointerup" }),
          strict["equal"](v117["length"], 0),
          strict["deepEqual"](v118(v127), v128));
        const v131 = v126["querySelector"](v124["selector"]);
        (v124["axis"] === "columns"
          ? (strict["equal"](v131["style"]["left"], v124["expectedLine"]),
            strict["equal"](v131["style"]["width"], v124["expectedHitSize"]))
          : (strict["equal"](v131["style"]["top"], v124["expectedLine"]),
            strict["equal"](v131["style"]["height"], v124["expectedHitSize"])),
          await v129["onclick"](createButtonEvent(v129)),
          strict["equal"](v117["length"], 1),
          strict["notDeepEqual"](v118(v127), v128),
          v126["remove"]());
      }
    } finally {
      ((globalThis["document"] = v114), (appStore["updateNodeData"] = v115));
    }
  }),
  test("StoryboardNode:\x20外部刷新不会把编辑中的草稿线位套到内容块", () => {
    const v132 = globalThis["document"],
      v133 = appStore["updateNodeData"],
      v134 = createFakeDocument();
    ((globalThis["document"] = v134), (appStore["updateNodeData"] = () => {}));
    try {
      const v135 = new StoryboardNode({
          id: "sb-draft-refresh",
          type: "storyboard",
          cols: 2,
          rows: 2,
          width: 300,
          height: 200,
          gridGap: 80,
          cells: [
            { id: "cell-1", isEmpty: true, url: "" },
            { id: "cell-2", isEmpty: true, url: "" },
            { id: "cell-3", isEmpty: true, url: "" },
            { id: "cell-4", isEmpty: true, url: "" },
          ],
        }),
        v136 = v135["mount"]();
      v134["body"]["appendChild"](v136);
      const v137 = v136["querySelectorAll"](".sb-cell"),
        v138 = () =>
          Array["from"](v137)["map"]((v139) => ({
            left: v139["style"]["left"],
            top: v139["style"]["top"],
            width: v139["style"]["width"],
            height: v139["style"]["height"],
          })),
        v140 = v138();
      v135["_grid"]["getBoundingClientRect"] = () => ({
        left: 0,
        top: 0,
        right: 300,
        bottom: 200,
        width: 300,
        height: 200,
      });
      const v141 = v136["querySelector"](".act-split-lines");
      v141["onclick"](createButtonEvent(v141));
      const v142 = v136["querySelector"](
        ".storyboard-custom-grid-handle-vertical",
      );
      (v142["eventListeners"]["get"]("pointerdown")[0]({
        type: "pointerdown",
        clientX: 150,
        clientY: 0,
        pointerId: 1,
        currentTarget: v142,
        preventDefault() {},
        stopPropagation() {},
      }),
        v134["dispatchEvent"]({
          type: "pointermove",
          clientX: 210,
          clientY: 0,
        }),
        v135["update"]({ ...v135["_data"], _bizRev: 2 }),
        strict["deepEqual"](v138(), v140),
        strict["equal"](
          v136["querySelector"](".storyboard-custom-grid-handle-vertical")[
            "style"
          ]["left"],
          "70%",
        ));
    } finally {
      ((globalThis["document"] = v132), (appStore["updateNodeData"] = v133));
    }
  }),
  test("StoryboardNode: node-level puzzle source refreshes detached pieces", async () => {
    const v143 = globalThis["document"],
      v144 = appStore["updateNodeData"],
      v145 = createFakeDocument(),
      v146 = [];
    let v147 = 0;
    ((globalThis["document"] = v145),
      (appStore["updateNodeData"] = (v148, v149) => {
        v146["push"]({ id: v148, patch: v149 });
      }));
    try {
      const v150 = new StoryboardNode({
        id: "sb-node-source-refresh",
        type: "storyboard",
        cols: 2,
        rows: 1,
        width: 200,
        height: 100,
        storyboardSourceUrl: "/output/full-source.png",
        storyboardSourceWidth: 200,
        storyboardSourceHeight: 100,
        cells: [
          {
            id: "cell-piece",
            localPath: "output/tile-0.png",
            sourceLocalPath: null,
            sourceUrl: "",
            storyboardSourceCrop: false,
            storyboardPiece: true,
            isEmpty: false,
          },
          { id: "cell-empty", url: "", isEmpty: true },
        ],
      });
      ((v150["_refreshSourceBackedCellsForLayout"] = () => {
        return ((v147 += 1), Promise["resolve"](null));
      }),
        (v150["_materializeCellsForConfirmedGrid"] = async (
          v151,
          v152,
          v153,
        ) => ({
          ok: true,
          cells: v153 || v150["_data"]["cells"] || [],
          failedIndices: [],
        })));
      const v154 = v150["mount"]();
      v145["body"]["appendChild"](v154);
      const v155 = v154["querySelector"](".act-split-lines");
      (v155["onclick"](createButtonEvent(v155)),
        (v150["_customGridDraft"] = { columns: [1.5, 0.5], rows: [1] }),
        await v150["_confirmCustomGridEdit"](),
        strict["equal"](v147, 0),
        strict["deepEqual"](v146[0], {
          id: "sb-node-source-refresh",
          patch: { gridGap: 0, gridLayout: { columns: [1.5, 0.5], rows: [1] } },
        }));
      const v156 = v154["querySelector"](".storyboard-cell-img");
      (strict["equal"](v156["getAttribute"]("src"), "/output/full-source.png"),
        strict["equal"](
          v156["classList"]["contains"]("storyboard-cell-img--source-crop"),
          true,
        ),
        strict["notEqual"](
          v154["querySelector"](".storyboard-cell-source-cache"),
          null,
        ));
    } finally {
      ((globalThis["document"] = v143), (appStore["updateNodeData"] = v144));
    }
  }),
  test("StoryboardNode: 完成调整时不因来源缺失阻塞线位提交", async () => {
    const v157 = globalThis["document"],
      v158 = appStore["updateNodeData"],
      v159 = createFakeDocument(),
      v160 = [];
    ((globalThis["document"] = v159),
      (appStore["updateNodeData"] = (v161, v162) => {
        v160["push"]({ id: v161, patch: v162 });
      }));
    try {
      const v163 = new StoryboardNode({
          id: "sb-confirm-missing-source",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: "cell-piece",
              capturePreviewUrl: "data:image/jpeg;base64,piece",
              storyboardPiece: true,
              storyboardLockedCell: true,
              sourceLocalPath: null,
              sourceUrl: "",
              isEmpty: false,
            },
            { id: "cell-empty", url: "", isEmpty: true },
          ],
        }),
        v164 = v163["mount"]();
      v159["body"]["appendChild"](v164);
      const v165 = v164["querySelector"](".act-split-lines");
      (v165["onclick"](createButtonEvent(v165)),
        (v163["_customGridDraft"] = { columns: [1.4, 0.6], rows: [1] }),
        await v163["_confirmCustomGridEdit"](),
        strict["deepEqual"](v160, [
          {
            id: "sb-confirm-missing-source",
            patch: {
              gridGap: 0,
              gridLayout: { columns: [1.4, 0.6], rows: [1] },
            },
          },
        ]),
        strict["equal"](v163["_isCustomGridEditing"], false),
        strict["equal"](v163["_isCustomGridConfirming"], false),
        strict["equal"](v165["classList"]["contains"]("active"), false),
        strict["equal"](
          v164["querySelector"](".storyboard-custom-grid-handle-vertical"),
          null,
        ),
        strict["notEqual"](
          v164["querySelector"](".storyboard-custom-grid-line-vertical"),
          null,
        ));
    } finally {
      ((globalThis["document"] = v157), (appStore["updateNodeData"] = v158));
    }
  }),
  test("StoryboardNode:\x20locked\x20storyboard\x20cell\x20renders\x20baked\x20crop\x20full\x20size", () => {
    const v166 = globalThis["document"],
      v167 = createFakeDocument();
    globalThis["document"] = v167;
    try {
      const v168 = new StoryboardNode({
          id: "sb-locked-cutout",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          gridGap: 20,
          cells: [
            {
              id: "cell-locked",
              capturePreviewUrl: "data:image/jpeg;base64,locked",
              storyboardLockedCell: true,
              isEmpty: false,
            },
            { id: "cell-1", url: "", isEmpty: true },
          ],
        }),
        v169 = v168["mount"]();
      v167["body"]["appendChild"](v169);
      const v170 =
        v169["querySelectorAll"](".sb-cell")[0]["querySelector"]("img");
      (strict["equal"](
        v170["getAttribute"]("src"),
        "data:image/jpeg;base64,locked",
      ),
        strict["equal"](v170["style"]["position"], ""),
        strict["equal"](v170["style"]["left"], ""),
        strict["equal"](v170["style"]["top"], ""),
        strict["equal"](v170["style"]["width"], "100%"),
        strict["equal"](v170["style"]["height"], "100%"),
        strict["equal"](v170["style"]["objectFit"], "fill"));
    } finally {
      globalThis["document"] = v166;
    }
  }),
  test("StoryboardNode: 自定义分割线按 Esc 会取消且不提交", () => {
    const v171 = globalThis["document"],
      v172 = appStore["updateNodeData"],
      v173 = createFakeDocument(),
      v174 = [];
    ((globalThis["document"] = v173),
      (appStore["updateNodeData"] = (v175, v176) => {
        v174["push"]({ id: v175, patch: v176 });
      }));
    try {
      const v177 = new StoryboardNode({
          id: "sb-custom-grid-cancel",
          type: "storyboard",
          cols: 2,
          rows: 2,
          width: 200,
          height: 100,
          cells: [
            { id: "cell-1", isEmpty: true, url: "" },
            { id: "cell-2", isEmpty: true, url: "" },
            { id: "cell-3", isEmpty: true, url: "" },
            { id: "cell-4", isEmpty: true, url: "" },
          ],
        }),
        v178 = v177["mount"]();
      v173["body"]["appendChild"](v178);
      const v179 = v178["querySelector"](".act-split-lines");
      (v179["onclick"](createButtonEvent(v179)),
        strict["notEqual"](
          v178["querySelector"](".storyboard-custom-grid-overlay"),
          null,
        ),
        strict["notEqual"](
          v178["querySelector"](".storyboard-split-lines-menu"),
          null,
        ),
        v173["dispatchEvent"]({
          type: "keydown",
          key: "Escape",
          preventDefault() {},
          stopPropagation() {},
        }),
        strict["equal"](v174["length"], 0),
        strict["equal"](v179["classList"]["contains"]("active"), false),
        strict["notEqual"](
          v178["querySelector"](".storyboard-custom-grid-overlay"),
          null,
        ),
        strict["equal"](
          v178["querySelector"](".storyboard-custom-grid-handle-vertical"),
          null,
        ),
        strict["notEqual"](
          v178["querySelector"](".storyboard-custom-grid-line-vertical"),
          null,
        ),
        strict["equal"](
          v178["querySelector"](".storyboard-split-lines-menu"),
          null,
        ),
        strict["equal"](
          v177["_grid"]["style"]["gridTemplateColumns"],
          "1fr\x201fr",
        ),
        strict["equal"](v177["_grid"]["style"]["gap"], "0px"));
    } finally {
      ((globalThis["document"] = v171), (appStore["updateNodeData"] = v172));
    }
  }),
  test("StoryboardNode: 完成调整会立即退出而不等待源图刷新", async () => {
    const v180 = globalThis["document"],
      v181 = appStore["updateNodeData"],
      v182 = createFakeDocument(),
      v183 = [];
    ((globalThis["document"] = v182),
      (appStore["updateNodeData"] = (v184, v185) => {
        v183["push"]({ id: v184, patch: v185 });
      }));
    try {
      const v186 = new StoryboardNode({
          id: "sb-custom-grid-refresh-pending",
          type: "storyboard",
          cols: 2,
          rows: 2,
          width: 200,
          height: 100,
          cells: [
            {
              id: "cell-1",
              localPath: "output/tile-0.png",
              sourceLocalPath: "output/source.png",
              isEmpty: false,
            },
            { id: "cell-2", isEmpty: true, url: "" },
            { id: "cell-3", isEmpty: true, url: "" },
            { id: "cell-4", isEmpty: true, url: "" },
          ],
        }),
        v187 = v186["mount"]();
      (v182["body"]["appendChild"](v187),
        (v186["_materializeCellsForConfirmedGrid"] = async () => ({
          ok: false,
          cells: v186["_data"]["cells"] || [],
          failedIndices: [0],
        })));
      const v188 = v187["querySelector"](".act-split-lines");
      (v188["onclick"](createButtonEvent(v188)),
        strict["equal"](v188["classList"]["contains"]("active"), true),
        strict["notEqual"](
          v187["querySelector"](".storyboard-split-lines-menu"),
          null,
        ),
        (v186["_customGridDraft"] = { columns: [1.2, 0.8], rows: [1, 1] }),
        await v188["onclick"](createButtonEvent(v188)),
        strict["equal"](v188["classList"]["contains"]("active"), false),
        strict["equal"](v188["dataset"]["tooltip"], "调整分割线"),
        strict["equal"](
          v187["querySelector"](".storyboard-split-lines-menu"),
          null,
        ),
        strict["equal"](
          v187["classList"]["contains"]("is-custom-grid-mode"),
          false,
        ),
        strict["equal"](
          v187["querySelector"](".storyboard-custom-grid-handle-vertical"),
          null,
        ),
        strict["notEqual"](
          v187["querySelector"](".storyboard-custom-grid-line-vertical"),
          null,
        ),
        strict["deepEqual"](v183, [
          {
            id: "sb-custom-grid-refresh-pending",
            patch: {
              gridGap: 0,
              gridLayout: { columns: [1.2, 0.8], rows: [1, 1] },
            },
          },
        ]));
    } finally {
      ((globalThis["document"] = v180), (appStore["updateNodeData"] = v181));
    }
  }),
  test("StoryboardNode: 清空源裁剪格会立即显示空态", () => {
    const v189 = globalThis["document"],
      v190 = createFakeDocument();
    globalThis["document"] = v190;
    try {
      const v191 = new StoryboardNode({
          id: "sb-source-crop-empty",
          type: "storyboard",
          cols: 1,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: "cell-1",
              localPath: "output/tile-0.png",
              sourceLocalPath: "output/source.png",
              sourceUrl: "/output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
          ],
        }),
        v192 = v191["mount"]();
      (v190["body"]["appendChild"](v192),
        strict["notEqual"](
          v192["querySelector"](".storyboard-cell-img"),
          null,
        ));
      const v193 = normalizeEmptyStoryboardCell(v191["_data"]["cells"][0]);
      v191["update"]({ ...v191["_data"], cells: [v193], _bizRev: 1 });
      const v194 = v192["querySelector"](".storyboard-empty-residual"),
        v195 = v192["querySelector"](".storyboard-empty-cutout"),
        v196 = v192["querySelector"](".storyboard-empty-residual-img");
      (strict["notEqual"](v194, null),
        strict["notEqual"](v195, null),
        strict["notEqual"](v196, null),
        strict["equal"](v196["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](
          v192["querySelector"](".storyboard-cell-source-cache"),
          null,
        ));
    } finally {
      globalThis["document"] = v189;
    }
  }),
  test("StoryboardNode:\x20源裁剪格刷新后直接按源图裁剪显示", () => {
    const v197 = globalThis["document"],
      v198 = createFakeDocument();
    globalThis["document"] = v198;
    try {
      const v199 = new StoryboardNode({
          id: "sb-source-crop-wait",
          type: "storyboard",
          cols: 1,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: "cell-source",
              localPath: "output/tile.png",
              sourceLocalPath: "output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
          ],
        }),
        v200 = v199["mount"]();
      v198["body"]["appendChild"](v200);
      const v201 = v200["querySelector"](".sb-cell"),
        v202 = v201["querySelector"](".storyboard-cell-img"),
        v203 = v201["querySelector"](".storyboard-cell-source-cache"),
        v204 = v200["querySelector"](".storyboard-source-backdrop");
      (strict["notEqual"](v203, null),
        v202["setAttribute"]("src", "/output/tile.png"),
        v202["classList"]["remove"]("storyboard-cell-img--source-crop"),
        (v203["complete"] = false),
        (v203["naturalWidth"] = 0),
        (v203["naturalHeight"] = 0),
        (v204["complete"] = false),
        (v204["naturalWidth"] = 0),
        (v204["naturalHeight"] = 0),
        v199["_applyCellCropStyles"](v201, v199["_data"]["cells"][0], 0),
        strict["equal"](v202["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](
          v202["classList"]["contains"]("storyboard-cell-img--source-crop"),
          true,
        ),
        strict["equal"](v202["style"]["left"], "0%"),
        strict["equal"](v202["style"]["top"], "0%"),
        strict["equal"](v202["style"]["width"], "100%"),
        strict["equal"](v202["style"]["height"], "100%"),
        (v203["complete"] = true),
        (v203["naturalWidth"] = 200),
        (v203["naturalHeight"] = 100),
        v199["_applyCellCropStyles"](v201, v199["_data"]["cells"][0], 0),
        strict["equal"](v202["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](
          v202["classList"]["contains"]("storyboard-cell-img--source-crop"),
          true,
        ));
    } finally {
      globalThis["document"] = v197;
    }
  }),
  test("StoryboardNode:\x20F5\x20重建时源裁剪格不使用旧预览图", () => {
    const v205 = globalThis["document"],
      v206 = createFakeDocument();
    globalThis["document"] = v206;
    try {
      const v207 = new StoryboardNode({
          id: "sb-source-crop-reload-preview",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: "cell-stale-preview",
              capturePreviewUrl: "data:image/jpeg;base64,stale-preview",
              sourceLocalPath: "output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              storyboardSourceCrop: true,
              storyboardSourceIndex: 1,
              isEmpty: false,
            },
            { id: "cell-empty", url: "", isEmpty: true },
          ],
        }),
        v208 = v207["mount"]();
      v206["body"]["appendChild"](v208);
      const v209 = v208["querySelector"](".storyboard-cell-img");
      (strict["equal"](v209["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](
          v209["classList"]["contains"]("storyboard-cell-img--source-crop"),
          true,
        ),
        strict["equal"](v209["style"]["left"], "-100%"),
        strict["equal"](v209["style"]["width"], "200%"));
    } finally {
      globalThis["document"] = v205;
    }
  }),
  test("StoryboardNode: 冻结实际图优先于残留源裁剪字段", () => {
    const v210 = globalThis["document"],
      v211 = createFakeDocument();
    globalThis["document"] = v211;
    try {
      const v212 = new StoryboardNode({
        id: "sb-frozen-display-priority",
        type: "storyboard",
        cols: 2,
        rows: 1,
        width: 200,
        height: 100,
        storyboardSourceLocalPath: "output/full-source.png",
        cells: [],
      });
      (strict["equal"](
        v212["_getCellDisplayImageUrl"]({
          id: "cell-frozen",
          localPath: "output/extracted.jpg",
          sourceLocalPath: "output/full-source.png",
          storyboardSourceCrop: true,
          storyboardPiece: true,
          storyboardExtractedCell: true,
          isEmpty: false,
        }),
        "/output/extracted.jpg",
      ),
        strict["equal"](
          v212["_getCellDisplayImageUrl"]({
            id: "cell-live",
            localPath: "output/stale.jpg",
            sourceLocalPath: "output/full-source.png",
            storyboardSourceCrop: true,
            isEmpty: false,
          }),
          "/output/full-source.png",
        ));
    } finally {
      globalThis["document"] = v210;
    }
  }),
  test("StoryboardNode:\x20合成按当前显示样式裁切", async () => {
    const v213 = globalThis["document"],
      v214 = createFakeDocument();
    globalThis["document"] = v214;
    try {
      const v215 = new StoryboardNode({
          id: "sb-compose-source-first",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: "cell-source",
              localPath: "output/tile-0.png",
              sourceLocalPath: "output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              storyboardSourceCrop: true,
              storyboardSourceIndex: 0,
              isEmpty: false,
            },
          ],
        }),
        v216 = [],
        v217 = [],
        v218 = {
          drawImage(...v219) {
            v217["push"](v219);
          },
        },
        v220 = async (v221) => {
          return (
            v216["push"](v221),
            { src: v221, naturalWidth: 200, naturalHeight: 100 }
          );
        },
        v222 = v214["createElement"]("img");
      (v222["classList"]["add"](
        "storyboard-cell-img",
        "storyboard-cell-img--source-crop",
      ),
        v222["setAttribute"]("src", "/output/source.png"),
        (v222["style"]["left"] = "-100%"),
        (v222["style"]["top"] = "0%"),
        (v222["style"]["width"] = "200%"),
        (v222["style"]["height"] = "100%"),
        (v222["style"]["objectFit"] = "fill"));
      const v223 = await v215["_drawComposeCell"](v218, {
        cell: v215["_data"]["cells"][0],
        cellIndex: 0,
        displayUrl: "/output/source.png",
        imageEl: v222,
        target: { x0: 0, y0: 0, drawW: 50, drawH: 100 },
        loadImage: v220,
      });
      (strict["equal"](v223, true),
        strict["deepEqual"](v216, ["/output/source.png"]),
        strict["equal"](v217["length"], 1),
        strict["equal"](v217[0][0]["src"], "/output/source.png"),
        strict["deepEqual"](
          v217[0]["slice"](1),
          [100, 0, 100, 100, 0, 0, 50, 100],
        ));
    } finally {
      globalThis["document"] = v213;
    }
  }),
  test("StoryboardNode:\x20合成当前显示图加载失败不画旧图", async () => {
    const v224 = globalThis["document"],
      v225 = createFakeDocument();
    globalThis["document"] = v225;
    try {
      const v226 = new StoryboardNode({
          id: "sb-compose-source-no-fallback",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: "cell-source",
              localPath: "output/tile-0.png",
              sourceLocalPath: "output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              storyboardSourceCrop: true,
              storyboardSourceIndex: 1,
              isEmpty: false,
            },
          ],
        }),
        v227 = [],
        v228 = [],
        v229 = {
          drawImage(...v230) {
            v228["push"](v230);
          },
        },
        v231 = async (v232) => {
          return (v227["push"](v232), null);
        },
        v233 = v225["createElement"]("img");
      (v233["classList"]["add"](
        "storyboard-cell-img",
        "storyboard-cell-img--source-crop",
      ),
        v233["setAttribute"]("src", "/output/source.png"),
        (v233["style"]["left"] = "-100%"),
        (v233["style"]["top"] = "0%"),
        (v233["style"]["width"] = "200%"),
        (v233["style"]["height"] = "100%"),
        (v233["style"]["objectFit"] = "fill"));
      const v234 = await v226["_drawComposeCell"](v229, {
        cell: v226["_data"]["cells"][0],
        cellIndex: 0,
        displayUrl: "/output/source.png",
        imageEl: v233,
        target: { x0: 0, y0: 0, drawW: 50, drawH: 100 },
        loadImage: v231,
      });
      (strict["equal"](v234, false),
        strict["deepEqual"](v227, ["/output/source.png"]),
        strict["equal"](v228["length"], 0));
    } finally {
      globalThis["document"] = v224;
    }
  }),
  test("StoryboardNode: 拖出源裁剪格后清空格子内容", () => {
    const v235 = globalThis["document"],
      v236 = createFakeDocument();
    globalThis["document"] = v236;
    try {
      const v237 = new StoryboardNode({
          id: "sb-source-crop-empty-slot",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          gridGap: 20,
          cells: [
            {
              id: "cell-1",
              localPath: "output/tile-0.png",
              sourceLocalPath: "output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
            {
              id: "cell-2",
              localPath: "output/tile-1.png",
              sourceLocalPath: "output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
          ],
        }),
        v238 = v237["mount"]();
      v236["body"]["appendChild"](v238);
      const v239 = {
        ...normalizeEmptyStoryboardCell(v237["_data"]["cells"][0]),
      };
      v237["update"]({
        ...v237["_data"],
        cells: [v239, v237["_data"]["cells"][1]],
        _bizRev: 1,
      });
      const v240 = v238["querySelectorAll"](".sb-cell")[0],
        v241 = v240["querySelector"](".storyboard-empty-residual-img"),
        v242 = v240["querySelector"](".storyboard-empty-cutout");
      (strict["notEqual"](v241, null),
        strict["notEqual"](v242, null),
        strict["equal"](v241["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](
          v241["classList"]["contains"]("storyboard-cell-img"),
          false,
        ),
        strict["equal"](v241["style"]["left"], "0%"),
        strict["equal"](v241["style"]["width"], "222.22222222222223%"),
        strict["equal"](v241["style"]["height"], "100%"),
        strict["equal"](v242["style"]["left"], "0"),
        strict["equal"](v242["style"]["width"], "100%"),
        strict["equal"](v240["style"]["left"], "0px"),
        strict["equal"](v240["style"]["width"], "90px"));
    } finally {
      globalThis["document"] = v235;
    }
  }),
  test("StoryboardNode: 放回已提取分镜只填充真实空洞区域", () => {
    const v243 = globalThis["document"],
      v244 = createFakeDocument();
    globalThis["document"] = v244;
    try {
      const v245 = new StoryboardNode({
          id: "sb-extracted-cutout-fill",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          gridGap: 20,
          cells: [
            {
              id: "cell-1",
              localPath: "output/extracted.png",
              residualImageLocalPath: "output/source.png",
              residualImageWidth: 200,
              residualImageHeight: 100,
              residualImageMode: "source",
              storyboardExtractedCell: true,
              isEmpty: false,
            },
            { id: "cell-2", localPath: "output/tile-1.png", isEmpty: false },
          ],
        }),
        v246 = v245["mount"]();
      v244["body"]["appendChild"](v246);
      const v247 = v246["querySelectorAll"](".sb-cell")[0],
        v248 = v247["querySelector"](".storyboard-empty-residual-img"),
        v249 = v247["querySelector"](".storyboard-cell-img");
      (strict["notEqual"](v248, null),
        strict["notEqual"](v249, null),
        strict["equal"](v249["getAttribute"]("src"), "/output/extracted.png"),
        strict["equal"](v247["style"]["left"], "0px"),
        strict["equal"](v247["style"]["width"], "90px"),
        strict["equal"](v249["style"]["position"], ""),
        strict["equal"](v249["style"]["left"], ""),
        strict["equal"](v249["style"]["top"], ""),
        strict["equal"](v249["style"]["width"], "100%"),
        strict["equal"](v249["style"]["height"], "100%"),
        strict["equal"](v248["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](v248["style"]["left"], "0%"),
        strict["equal"](v248["style"]["width"], "222.22222222222223%"));
    } finally {
      globalThis["document"] = v243;
    }
  }),
  test("StoryboardNode:\x20空洞残留源图按当前线位和间距对齐", () => {
    const v250 = globalThis["document"],
      v251 = createFakeDocument();
    globalThis["document"] = v251;
    try {
      const v252 = new StoryboardNode({
          id: "sb-empty-custom-slot",
          type: "storyboard",
          cols: 2,
          rows: 2,
          width: 300,
          height: 200,
          gridGap: 20,
          gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
          cells: [
            { id: "cell-0", localPath: "output/a.png", isEmpty: false },
            { id: "cell-1", localPath: "output/b.png", isEmpty: false },
            { id: "cell-2", localPath: "output/c.png", isEmpty: false },
            {
              id: "cell-3",
              isEmpty: true,
              residualImageLocalPath: "output/source.png",
              residualImageWidth: 300,
              residualImageHeight: 200,
              residualImageMode: "source",
            },
          ],
        }),
        v253 = v252["mount"]();
      v251["body"]["appendChild"](v253);
      const v254 = v253["querySelectorAll"](".sb-cell")[3],
        v255 = v254["querySelector"](".storyboard-empty-residual-img"),
        v256 = v254["querySelector"](".storyboard-empty-cutout");
      (strict["equal"](v254["style"]["left"], "235px"),
        strict["equal"](v254["style"]["top"], "60px"),
        strict["equal"](v254["style"]["width"], "65px"),
        strict["equal"](v254["style"]["height"], "140px"),
        strict["notEqual"](v255, null),
        strict["notEqual"](v256, null),
        strict["equal"](v255["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](v255["style"]["left"], "-361.53846153846155%"),
        strict["equal"](v255["style"]["top"], "-42.857142857142854%"),
        strict["equal"](v255["style"]["width"], "461.5384615384615%"),
        strict["equal"](v255["style"]["height"], "142.85714285714286%"),
        strict["equal"](v256["style"]["left"], "0"),
        strict["equal"](v256["style"]["top"], "0"),
        strict["equal"](v256["style"]["width"], "100%"),
        strict["equal"](v256["style"]["height"], "100%"));
    } finally {
      globalThis["document"] = v250;
    }
  }),
  test("StoryboardNode: actual cropped extracted cell without residual fills cell", () => {
    const v257 = globalThis["document"],
      v258 = createFakeDocument();
    globalThis["document"] = v258;
    try {
      const v259 = new StoryboardNode({
          id: "sb-extracted-actual-crop",
          type: "storyboard",
          cols: 3,
          rows: 3,
          width: 300,
          height: 300,
          gridGap: 80,
          cells: [
            { id: "cell-0", url: "", isEmpty: true },
            { id: "cell-1", url: "", isEmpty: true },
            { id: "cell-2", url: "", isEmpty: true },
            { id: "cell-3", url: "", isEmpty: true },
            {
              id: "cell-4",
              localPath: "output/real-crop.png",
              storyboardExtractedCell: true,
              isEmpty: false,
            },
            { id: "cell-5", url: "", isEmpty: true },
            { id: "cell-6", url: "", isEmpty: true },
            { id: "cell-7", url: "", isEmpty: true },
            { id: "cell-8", url: "", isEmpty: true },
          ],
        }),
        v260 = v259["mount"]();
      v258["body"]["appendChild"](v260);
      const v261 =
        v260["querySelectorAll"](".sb-cell")[4]["querySelector"]("img");
      (strict["equal"](v261["getAttribute"]("src"), "/output/real-crop.png"),
        strict["equal"](v261["style"]["position"], ""),
        strict["equal"](v261["style"]["left"], ""),
        strict["equal"](v261["style"]["top"], ""),
        strict["equal"](v261["style"]["width"], "100%"),
        strict["equal"](v261["style"]["height"], "100%"),
        strict["equal"](v261["style"]["objectFit"], "fill"));
    } finally {
      globalThis["document"] = v257;
    }
  }),
  test("StoryboardNode: 调整分割线时空格保持空态", async () => {
    const v262 = globalThis["document"],
      v263 = appStore["updateNodeData"],
      v264 = createFakeDocument(),
      v265 = [];
    let v266 = 0;
    ((globalThis["document"] = v264),
      (appStore["updateNodeData"] = (v267, v268) => {
        v265["push"]({ id: v267, patch: v268 });
      }));
    try {
      const v269 = new StoryboardNode({
        id: "sb-source-crop-empty-edit",
        type: "storyboard",
        cols: 2,
        rows: 1,
        width: 200,
        height: 100,
        gridGap: 80,
        cells: [
          { id: "cell-empty", url: "", isEmpty: true },
          {
            id: "cell-filled",
            localPath: "output/tile-1.png",
            sourceLocalPath: "output/source.png",
            sourceWidth: 200,
            sourceHeight: 100,
            isEmpty: false,
          },
        ],
      });
      ((v269["_refreshSourceBackedCellsForLayout"] = () => {
        return ((v266 += 1), Promise["resolve"](null));
      }),
        (v269["_materializeCellsForConfirmedGrid"] = async (
          v270,
          v271,
          v272,
        ) => ({
          ok: true,
          cells: v272 || v269["_data"]["cells"] || [],
          failedIndices: [],
        })));
      const v273 = v269["mount"]();
      v264["body"]["appendChild"](v273);
      const v274 =
        v273["querySelectorAll"](".sb-cell")[1]["querySelector"]("img");
      (strict["equal"](v274["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](
          v274["classList"]["contains"]("storyboard-cell-img--source-crop"),
          true,
        ));
      const v275 = v273["querySelector"](".act-split-lines");
      (v275["onclick"](createButtonEvent(v275)),
        (v269["_customGridDraft"] = { columns: [1.5, 0.5], rows: [1] }),
        await v269["_confirmCustomGridEdit"](),
        strict["equal"](v265["length"], 1),
        strict["deepEqual"](v265[0]["patch"], {
          gridGap: 80,
          gridLayout: { columns: [1.5, 0.5], rows: [1] },
        }),
        strict["equal"](v266, 0));
    } finally {
      ((globalThis["document"] = v262), (appStore["updateNodeData"] = v263));
    }
  }),
  test("StoryboardNode: 空格残留源图字段时也不进入源图裁剪渲染", () => {
    const v276 = globalThis["document"],
      v277 = createFakeDocument();
    globalThis["document"] = v277;
    try {
      const v278 = new StoryboardNode({
          id: "sb-empty-stale-source",
          type: "storyboard",
          cols: 1,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: "cell-empty-stale-source",
              url: "",
              isEmpty: true,
              sourceLocalPath: "output/source.png",
              sourceUrl: "/output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              storyboardSourceCrop: true,
            },
          ],
        }),
        v279 = v278["mount"]();
      (v277["body"]["appendChild"](v279),
        strict["equal"](v279["querySelector"](".storyboard-cell-img"), null),
        strict["ok"](v279["querySelector"](".empty-placeholder")));
    } finally {
      globalThis["document"] = v276;
    }
  }),
  test("StoryboardNode: 编辑分镜和调整分割线互斥", () => {
    const v280 = globalThis["document"],
      v281 = appStore["updateNodeData"],
      v282 = createFakeDocument(),
      v283 = [];
    ((globalThis["document"] = v282),
      (appStore["updateNodeData"] = (v284, v285) => {
        v283["push"]({ id: v284, patch: v285 });
      }));
    try {
      const v286 = new StoryboardNode({
          id: "sb-custom-grid-exclusive",
          type: "storyboard",
          cols: 2,
          rows: 2,
          width: 200,
          height: 100,
          isEditing: true,
          cells: [
            { id: "cell-1", isEmpty: true, url: "" },
            { id: "cell-2", isEmpty: true, url: "" },
            { id: "cell-3", isEmpty: true, url: "" },
            { id: "cell-4", isEmpty: true, url: "" },
          ],
        }),
        v287 = v286["mount"]();
      v282["body"]["appendChild"](v287);
      const v288 = v287["querySelector"](".act-split-lines"),
        v289 = v287["querySelector"](".act-edit");
      (strict["equal"](v289["classList"]["contains"]("active"), true),
        strict["equal"](v289["dataset"]["tooltip"], "退出编辑分镜"),
        strict["equal"](v288["dataset"]["tooltip"], "调整分割线"),
        v288["onclick"](createButtonEvent(v288)),
        strict["equal"](v289["classList"]["contains"]("active"), false),
        strict["equal"](v289["dataset"]["tooltip"], "编辑分镜"),
        strict["equal"](v288["classList"]["contains"]("active"), true),
        strict["equal"](v288["dataset"]["tooltip"], "完成调整"),
        strict["deepEqual"](v283[0]["patch"], { isEditing: false }),
        v289["onclick"](createButtonEvent(v289)),
        strict["equal"](v288["classList"]["contains"]("active"), false),
        strict["equal"](v288["dataset"]["tooltip"], "调整分割线"),
        strict["equal"](
          v287["querySelector"](".storyboard-custom-grid-handle-vertical"),
          null,
        ),
        strict["notEqual"](
          v287["querySelector"](".storyboard-custom-grid-line-vertical"),
          null,
        ),
        strict["equal"](v289["classList"]["contains"]("active"), true),
        strict["equal"](v289["dataset"]["tooltip"], "退出编辑分镜"),
        strict["deepEqual"](v283[1]["patch"], { isEditing: true }));
    } finally {
      ((globalThis["document"] = v280), (appStore["updateNodeData"] = v281));
    }
  }),
  test("StoryboardNode:\x20自定义线显示层按当前线位裁切源图", () => {
    const v290 = globalThis["document"],
      v291 = createFakeDocument();
    globalThis["document"] = v291;
    try {
      const v292 = new StoryboardNode({
          id: "sb-source-crop",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          gridLayout: { columns: [1.5, 0.5], rows: [1] },
          cells: [
            {
              id: "cell-1",
              localPath: "output/tile-0.png",
              sourceLocalPath: "output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
            {
              id: "cell-2",
              localPath: "output/tile-1.png",
              sourceLocalPath: "output/source.png",
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
          ],
        }),
        v293 = v292["mount"]();
      v291["body"]["appendChild"](v293);
      const v294 = v293["querySelectorAll"](".sb-cell"),
        v295 = v294[1]["querySelector"]("img");
      (strict["equal"](
        v292["_grid"]["style"]["gridTemplateColumns"],
        "1fr 1fr",
      ),
        strict["equal"](v294[0]["style"]["left"], "0px"),
        strict["equal"](v294[0]["style"]["width"], "150px"),
        strict["equal"](v294[1]["style"]["left"], "150px"),
        strict["equal"](v294[1]["style"]["width"], "50px"),
        strict["equal"](v295["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](
          v295["classList"]["contains"]("storyboard-cell-img--source-crop"),
          true,
        ),
        strict["equal"](v295["style"]["width"], "400%"),
        strict["equal"](v295["style"]["left"], "-300%"));
    } finally {
      globalThis["document"] = v290;
    }
  }),
  test("StoryboardNode: 宫格间距控件只调整子宫格区域", async () => {
    const v296 = globalThis["document"],
      v297 = globalThis["setTimeout"],
      v298 = appStore["updateNodeData"],
      v299 = createFakeDocument(),
      v300 = [];
    let v301 = null;
    ((globalThis["document"] = v299),
      (globalThis["setTimeout"] = (v302) => {
        return (v302(), 1);
      }),
      (appStore["updateNodeData"] = (v303, v304) => {
        v300["push"]({ id: v303, patch: v304 });
      }));
    try {
      const v305 = Array["from"]({ length: 9 }, (v306, v307) => ({
        id: "cell-" + v307,
        isEmpty: true,
        url: "",
      }));
      ((v305[4] = {
        id: "cell-center",
        localPath: "output/tile-4.png",
        sourceLocalPath: "output/source.png",
        sourceWidth: 300,
        sourceHeight: 300,
        isEmpty: false,
      }),
        (v301 = new StoryboardNode({
          id: "sb-line-gap",
          type: "storyboard",
          cols: 3,
          rows: 3,
          width: 300,
          height: 300,
          cells: v305,
        })));
      const v308 = v301["mount"]();
      v299["body"]["appendChild"](v308);
      const v309 = v308["querySelector"](".storyboard-container"),
        v310 = v309["querySelector"](".storyboard-source-backdrop");
      (strict["notEqual"](v310, null),
        strict["equal"](v310["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](v310["style"]["objectFit"], "fill"),
        strict["equal"](v310["style"]["opacity"], "1"),
        strict["equal"](v310["style"]["zIndex"], "0"),
        strict["equal"](v301["_grid"]["style"]["zIndex"], "1"),
        strict["equal"](v309["childNodes"][0], v310),
        strict["equal"](v309["childNodes"][1], v301["_grid"]));
      const v311 = v308["querySelector"](".act-split-lines");
      (strict["equal"](
        v301["_container"]["style"]["background"],
        "var(--bg-node)",
      ),
        strict["equal"](v301["_grid"]["style"]["background"], "transparent"),
        strict["equal"](v311["classList"]["contains"]("icon-only"), true),
        strict["equal"](
          v311["querySelector"](".storyboard-split-lines-label"),
          null,
        ),
        strict["equal"](
          v311["querySelector"](".storyboard-split-lines-menu-trigger"),
          null,
        ),
        strict["equal"](v301["_grid"]["style"]["gap"], "0px"));
      const v312 = v308["querySelectorAll"](".sb-cell")[4],
        v313 = v312["querySelector"]("img");
      (strict["equal"](v312["style"]["left"], "100px"),
        strict["equal"](v312["style"]["top"], "100px"),
        strict["equal"](v312["style"]["width"], "100px"),
        strict["equal"](v312["style"]["height"], "100px"),
        strict["equal"](v313["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](v313["style"]["width"], "300%"),
        strict["equal"](v313["style"]["left"], "-100%"),
        v311["onclick"](createButtonEvent(v311)));
      const v314 = v308["querySelector"](".storyboard-split-lines-menu");
      (strict["notEqual"](v314, null),
        strict["equal"](
          v314["parentElement"],
          v308["querySelector"](".storyboard-toolbar"),
        ),
        strict["equal"](
          v314["classList"]["contains"]("storyboard-toolbar-menu"),
          true,
        ));
      const v315 = v314["querySelector"]("input"),
        v316 = v314["querySelector"](".storyboard-grid-gap-readout");
      (strict["notEqual"](v315, null),
        strict["equal"](v315["value"], "0"),
        (v315["value"] = "80"),
        v315["eventListeners"]["get"]("input")[0]({
          target: v315,
          stopPropagation() {},
        }),
        strict["equal"](v316["textContent"], "80px"),
        strict["equal"](v300["length"], 0),
        strict["equal"](v301["_grid"]["style"]["gap"], "0px"),
        strict["equal"](v312["style"]["left"], "100px"),
        strict["equal"](v312["style"]["top"], "100px"),
        strict["equal"](v312["style"]["width"], "100px"),
        strict["equal"](v312["style"]["height"], "100px"),
        strict["equal"](v313["style"]["width"], "300%"),
        strict["equal"](v313["style"]["left"], "-100%"),
        strict["equal"](v310["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](
          v308["querySelector"](".storyboard-grid-gap-band-vertical"),
          null,
        ),
        strict["equal"](
          v308["querySelector"](".storyboard-grid-gap-band-horizontal"),
          null,
        ));
      const v317 = v308["querySelectorAll"](
          ".storyboard-custom-grid-handle-vertical",
        ),
        v318 = v308["querySelectorAll"](
          ".storyboard-custom-grid-handle-horizontal",
        );
      (strict["equal"](v317["length"], 2),
        strict["equal"](v318["length"], 2),
        strict["equal"](v317[0]["style"]["left"], "33.33333333333333%"),
        strict["equal"](
          v317[0]["style"]["--storyboard-grid-line-size"],
          "80px",
        ),
        strict["equal"](
          v317[0]["style"]["--storyboard-grid-line-half-size"],
          "40px",
        ),
        strict["equal"](v317[0]["style"]["width"], "80px"),
        strict["equal"](v318[0]["style"]["top"], "33.33333333333333%"),
        strict["equal"](
          v318[0]["style"]["--storyboard-grid-line-size"],
          "80px",
        ),
        strict["equal"](
          v318[0]["style"]["--storyboard-grid-line-half-size"],
          "40px",
        ),
        strict["equal"](v318[0]["style"]["height"], "80px"),
        strict["equal"](v301["hitTestCell"](30, 150), 3),
        strict["equal"](v301["hitTestCell"](100, 150), 3),
        strict["equal"](v301["hitTestCell"](110, 150), 4),
        strict["equal"](v301["hitTestCell"](150, 150), 4));
      let v319 = 0;
      ((v301["_refreshSourceBackedCellsForLayoutInBackground"] = () => {
        v319 += 1;
      }),
        (v301["_materializeCellsForConfirmedGrid"] = async (
          v320,
          v321,
          v322,
        ) => ({
          ok: true,
          cells: v322 || v301["_data"]["cells"] || [],
          failedIndices: [],
        })),
        await v301["_confirmCustomGridEdit"](),
        strict["equal"](v300["length"], 1),
        strict["equal"](v300[0]["id"], "sb-line-gap"),
        strict["deepEqual"](v300[0]["patch"], {
          gridGap: 80,
          gridLayout: { columns: [1, 1, 1], rows: [1, 1, 1] },
        }),
        strict["equal"](v312["style"]["left"], "140px"),
        strict["equal"](v312["style"]["top"], "140px"),
        strict["equal"](v312["style"]["width"], "20px"),
        strict["equal"](v312["style"]["height"], "20px"),
        strict["equal"](v313["style"]["width"], "1500%"),
        strict["equal"](v313["style"]["left"], "-700%"),
        strict["equal"](v319, 0),
        strict["equal"](
          v308["querySelectorAll"](".storyboard-custom-grid-line-vertical")[
            "length"
          ],
          2,
        ),
        strict["equal"](
          v308["querySelectorAll"](".storyboard-custom-grid-handle-vertical")[
            "length"
          ],
          0,
        ));
    } finally {
      (v301?.["_closeMenu"](),
        (globalThis["document"] = v296),
        (globalThis["setTimeout"] = v297),
        (appStore["updateNodeData"] = v298));
    }
  }),
  test("StoryboardNode: edit-only update keeps spaced grid pixels untouched", () => {
    const v323 = globalThis["document"],
      v324 = createFakeDocument();
    globalThis["document"] = v324;
    try {
      const v325 = Array["from"]({ length: 9 }, (v326, v327) => ({
        id: "cell-" + v327,
        isEmpty: true,
        url: "",
      }));
      v325[4] = {
        id: "cell-center",
        localPath: "output/tile-4.png",
        sourceLocalPath: "output/source.png",
        sourceWidth: 300,
        sourceHeight: 300,
        isEmpty: false,
      };
      const v328 = new StoryboardNode({
          id: "sb-edit-spaced-grid",
          type: "storyboard",
          cols: 3,
          rows: 3,
          width: 300,
          height: 300,
          gridGap: 80,
          isEditing: false,
          cells: v325,
        }),
        v329 = v328["mount"]();
      v324["body"]["appendChild"](v329);
      const v330 = v329["querySelectorAll"](".sb-cell")[4],
        v331 = v330["querySelector"]("img");
      (strict["equal"](v328["_grid"]["style"]["gap"], "0px"),
        strict["equal"](v330["style"]["left"], "140px"),
        strict["equal"](v330["style"]["top"], "140px"),
        strict["equal"](v330["style"]["width"], "20px"),
        strict["equal"](v330["style"]["height"], "20px"),
        strict["equal"](v331["getAttribute"]("src"), "/output/source.png"),
        strict["equal"](v331["style"]["width"], "1500%"),
        strict["equal"](v331["style"]["left"], "-700%"));
      let v332 = 0;
      ((v328["_syncCustomGridOverlay"] = () => {
        v332 += 1;
      }),
        v328["update"]({ ...v328["_data"], isEditing: true }),
        strict["equal"](v332, 0),
        strict["equal"](v329["classList"]["contains"]("is-editing-mode"), true),
        strict["equal"](v328["_grid"]["style"]["gap"], "0px"),
        strict["equal"](v330["style"]["left"], "140px"),
        strict["equal"](v330["style"]["top"], "140px"),
        strict["equal"](v330["style"]["width"], "20px"),
        strict["equal"](v330["style"]["height"], "20px"),
        strict["equal"](v331["style"]["width"], "1500%"),
        strict["equal"](v331["style"]["left"], "-700%"));
    } finally {
      globalThis["document"] = v323;
    }
  }),
  test("StoryboardNode:\x20entering\x20edit\x20materializes\x20source-backed\x20cells\x20as\x20pieces", () => {
    const v333 = globalThis["document"],
      v334 = appStore["updateNodeData"],
      v335 = createFakeDocument(),
      v336 = [];
    ((globalThis["document"] = v335),
      (appStore["updateNodeData"] = (v337, v338) => {
        v336["push"]({ id: v337, patch: v338 });
      }));
    try {
      const v339 = new StoryboardNode({
          id: "sb-edit-materialize",
          type: "storyboard",
          cols: 1,
          rows: 1,
          width: 100,
          height: 100,
          cells: [
            {
              id: "cell-source",
              capturePreviewUrl: "data:image/jpeg;base64,current-piece",
              sourceLocalPath: "output/source.png",
              sourceUrl: "/output/source.png",
              sourceWidth: 300,
              sourceHeight: 300,
              storyboardSourceCrop: true,
              isEmpty: false,
            },
          ],
        }),
        v340 = v339["mount"]();
      v335["body"]["appendChild"](v340);
      const v341 = v340["querySelector"](".act-edit");
      (v341["onclick"](createButtonEvent(v341)),
        strict["equal"](v336["length"], 1),
        strict["equal"](v336[0]["id"], "sb-edit-materialize"),
        strict["equal"](v336[0]["patch"]["isEditing"], true),
        strict["equal"](
          v336[0]["patch"]["storyboardBackdropUrl"],
          "/output/source.png",
        ),
        strict["equal"](v336[0]["patch"]["cells"]["length"], 1));
      const v342 = v336[0]["patch"]["cells"][0];
      (strict["equal"](
        v342["capturePreviewUrl"],
        "data:image/jpeg;base64,current-piece",
      ),
        strict["equal"](v342["sourceLocalPath"], null),
        strict["equal"](v342["sourceUrl"], ""),
        strict["equal"](v342["sourceWidth"], null),
        strict["equal"](v342["sourceHeight"], null),
        strict["equal"](v342["storyboardSourceCrop"], false),
        strict["equal"](v342["storyboardLockedCell"], true),
        strict["equal"](v342["storyboardSourceIndex"], 0),
        strict["equal"](v342["pieceId"], "cell-source"),
        strict["equal"](
          v340["querySelector"](".storyboard-cell-source-cache"),
          null,
        ));
    } finally {
      ((globalThis["document"] = v333), (appStore["updateNodeData"] = v334));
    }
  }),
  test("StoryboardNode:\x20clearing\x20source\x20context\x20removes\x20stale\x20source\x20cache", () => {
    const v343 = globalThis["document"],
      v344 = createFakeDocument();
    globalThis["document"] = v344;
    try {
      const v345 = new StoryboardNode({
          id: "sb-source-cache-clear",
          type: "storyboard",
          cols: 1,
          rows: 1,
          width: 100,
          height: 100,
          cells: [
            {
              id: "cell-source",
              capturePreviewUrl: "data:image/jpeg;base64,current-piece",
              sourceLocalPath: "output/source.png",
              sourceUrl: "/output/source.png",
              sourceWidth: 300,
              sourceHeight: 300,
              storyboardSourceCrop: true,
              isEmpty: false,
            },
          ],
        }),
        v346 = v345["mount"]();
      (v344["body"]["appendChild"](v346),
        strict["notEqual"](
          v346["querySelector"](".storyboard-cell-source-cache"),
          null,
        ),
        v345["update"]({
          ...v345["_data"],
          cells: [
            {
              ...v345["_data"]["cells"][0],
              sourceLocalPath: null,
              sourceUrl: "",
              sourceWidth: null,
              sourceHeight: null,
              storyboardSourceCrop: false,
            },
          ],
          _bizRev: 1,
        }),
        strict["equal"](
          v346["querySelector"](".storyboard-cell-source-cache"),
          null,
        ),
        strict["equal"](
          v346["querySelector"](".storyboard-cell-img")["getAttribute"]("src"),
          "data:image/jpeg;base64,current-piece",
        ));
    } finally {
      globalThis["document"] = v343;
    }
  }),
  test("StoryboardNode: 子菜单挂在工具栏内跟随触发按钮", () => {
    const v347 = globalThis["document"],
      v348 = globalThis["setTimeout"],
      v349 = createFakeDocument();
    ((globalThis["document"] = v349),
      (globalThis["setTimeout"] = (v350) => {
        return (v350(), 1);
      }));
    try {
      const v351 = new StoryboardNode({
          id: "sb-menu-anchor",
          type: "storyboard",
          cols: 2,
          rows: 2,
          width: 200,
          height: 100,
          cells: [
            { id: "cell-1", isEmpty: true, url: "" },
            { id: "cell-2", isEmpty: true, url: "" },
            { id: "cell-3", isEmpty: true, url: "" },
            { id: "cell-4", isEmpty: true, url: "" },
          ],
        }),
        v352 = v351["mount"]();
      v349["body"]["appendChild"](v352);
      const v353 = v352["querySelector"](".storyboard-toolbar"),
        v354 = v352["querySelector"](".act-grid");
      v354["onclick"](createButtonEvent(v354));
      const v355 = v352["querySelector"](".v2-sb-dropdown");
      (strict["equal"](v355["parentElement"], v353),
        strict["equal"](
          v355["classList"]["contains"]("storyboard-toolbar-menu"),
          true,
        ),
        strict["equal"](v354["classList"]["contains"]("active"), true),
        v351["_closeMenu"](),
        strict["equal"](v352["querySelector"](".v2-sb-dropdown"), null),
        strict["equal"](v354["classList"]["contains"]("active"), false));
      const v356 = v352["querySelector"](".act-split-lines");
      v356["onclick"](createButtonEvent(v356));
      const v357 = v352["querySelector"](".storyboard-split-lines-menu");
      (strict["notEqual"](v357, null),
        strict["equal"](v357["parentElement"], v353),
        strict["equal"](
          v357["classList"]["contains"]("storyboard-toolbar-menu"),
          true,
        ),
        strict["equal"](v356["classList"]["contains"]("active"), true));
    } finally {
      ((globalThis["document"] = v347), (globalThis["setTimeout"] = v348));
    }
  }),
  test("StoryboardNode:\x20清空会把\x20cell\x20归一为空态", () => {
    const v358 = globalThis["document"],
      v359 = appStore["updateNodeData"],
      v360 = createFakeDocument(),
      v361 = [];
    ((globalThis["document"] = v360),
      (appStore["updateNodeData"] = (v362, v363) => {
        v361["push"]({ id: v362, patch: v363 });
      }));
    try {
      const v364 = new StoryboardNode({
          id: "sb-clear",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: "cell-1",
              row: 0,
              col: 0,
              localPath: "output/main.png",
              thumbLocalPath: "output/thumb.webp",
              thumbUrl: "https://example.com/thumb.png",
              thumbId: "thumb-1",
              sourceId: "source-1",
              isEmpty: false,
            },
          ],
        }),
        v365 = v364["mount"]();
      v360["body"]["appendChild"](v365);
      const v366 = v365["querySelector"](".act-clear");
      (v366["onclick"](createButtonEvent(v366)),
        strict["equal"](v361["length"], 1),
        strict["equal"](v361[0]["id"], "sb-clear"),
        strict["deepEqual"](v361[0]["patch"]["cells"][0], {
          id: "cell-1",
          row: 0,
          col: 0,
          localPath: null,
          originalLocalPath: null,
          displayLocalPath: null,
          thumbLocalPath: null,
          thumbUrl: "",
          thumbId: null,
          sourceId: null,
          sourceLocalPath: null,
          sourceUrl: "",
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          storyboardPiece: false,
          storyboardLockedCell: false,
          residualImageLocalPath: "output/main.png",
          residualImageUrl: "https://example.com/thumb.png",
          residualImageWidth: null,
          residualImageHeight: null,
          residualImageMode: "cell",
          isEmpty: true,
          url: "",
        }));
    } finally {
      ((globalThis["document"] = v358), (appStore["updateNodeData"] = v359));
    }
  }),
  test("StoryboardNode:\x20同图填充新格子时不会挪走已有格子的\x20DOM", () => {
    const v367 = globalThis["document"],
      v368 = createFakeDocument();
    globalThis["document"] = v368;
    try {
      const v369 = {
          id: "sb-same-src",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          aspectRatio: "1:1",
          cells: [
            { id: "cell-1", isEmpty: true, url: "" },
            { id: "cell-2", localPath: "output/shared.png", isEmpty: false },
          ],
        },
        v370 = new StoryboardNode(v369),
        v371 = v370["mount"]();
      v368["body"]["appendChild"](v371);
      const v372 = v371["querySelectorAll"](".sb-cell");
      (strict["equal"](v372[0]["querySelector"]("img"), null),
        strict["notEqual"](v372[1]["querySelector"]("img"), null),
        v370["update"]({
          ...v369,
          cells: [
            { id: "cell-1", localPath: "output/shared.png", isEmpty: false },
            { id: "cell-2", localPath: "output/shared.png", isEmpty: false },
          ],
        }));
      const v373 = v371["querySelectorAll"](".sb-cell"),
        v374 = v373[0]["querySelector"]("img"),
        v375 = v373[1]["querySelector"]("img");
      (strict["notEqual"](v374, null),
        strict["notEqual"](v375, null),
        strict["notEqual"](v374, v375),
        strict["equal"](v374["getAttribute"]("src"), "/output/shared.png"),
        strict["equal"](v375["getAttribute"]("src"), "/output/shared.png"));
    } finally {
      globalThis["document"] = v367;
    }
  }),
  test("StoryboardNode: applyImmediateCellSwap 会即时交换 DOM 且不改数据", () => {
    const v376 = globalThis["document"],
      v377 = createFakeDocument();
    globalThis["document"] = v377;
    try {
      const v378 = {
          id: "sb-immediate-swap",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          aspectRatio: "1:1",
          cells: [
            { id: "cell-1", localPath: "output/a.png", isEmpty: false },
            { id: "cell-2", localPath: "output/b.png", isEmpty: false },
          ],
        },
        v379 = new StoryboardNode(v378),
        v380 = v379["mount"]();
      v377["body"]["appendChild"](v380);
      const v381 = v380["querySelectorAll"](".sb-cell");
      (strict["equal"](
        v381[0]["querySelector"]("img")["getAttribute"]("src"),
        "/output/a.png",
      ),
        strict["equal"](
          v381[1]["querySelector"]("img")["getAttribute"]("src"),
          "/output/b.png",
        ));
      const v382 = v379["applyImmediateCellSwap"](0, 1);
      (strict["equal"](v382["ok"], true),
        strict["equal"](
          v381[0]["querySelector"]("img")["getAttribute"]("src"),
          "/output/b.png",
        ),
        strict["equal"](
          v381[1]["querySelector"]("img")["getAttribute"]("src"),
          "/output/a.png",
        ),
        strict["equal"](v379["_data"]["cells"][0]["localPath"], "output/a.png"),
        strict["equal"](v379["_data"]["cells"][1]["localPath"], "output/b.png"),
        v382["revert"](),
        strict["equal"](
          v381[0]["querySelector"]("img")["getAttribute"]("src"),
          "/output/a.png",
        ),
        strict["equal"](
          v381[1]["querySelector"]("img")["getAttribute"]("src"),
          "/output/b.png",
        ),
        strict["equal"](v379["_data"]["cells"][0]["localPath"], "output/a.png"),
        strict["equal"](
          v379["_data"]["cells"][1]["localPath"],
          "output/b.png",
        ));
    } finally {
      globalThis["document"] = v376;
    }
  }),
  test("StoryboardNode: applyImmediateCellSwap 会拒绝非法目标", () => {
    const v383 = globalThis["document"],
      v384 = createFakeDocument();
    globalThis["document"] = v384;
    try {
      const v385 = new StoryboardNode({
          id: "sb-immediate-invalid",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            { id: "cell-1", localPath: "output/a.png", isEmpty: false },
            { id: "cell-2", localPath: "output/b.png", isEmpty: false },
          ],
        }),
        v386 = v385["mount"]();
      (v384["body"]["appendChild"](v386),
        strict["equal"](v385["applyImmediateCellSwap"](0, 0)["ok"], false),
        strict["equal"](v385["applyImmediateCellSwap"](-1, 1)["ok"], false),
        strict["equal"](v385["applyImmediateCellSwap"](0, 99)["ok"], false));
      const v387 =
        v386["querySelectorAll"](".sb-cell")[0]["querySelector"](
          ".cell-content-wrap",
        );
      (v387["remove"](),
        strict["equal"](v385["applyImmediateCellSwap"](0, 1)["ok"], false));
    } finally {
      globalThis["document"] = v383;
    }
  }),
  test("StoryboardNode: 互换已显示图片时直接复用现有图片不等待 load", () => {
    const v388 = globalThis["document"],
      v389 = createFakeDocument();
    globalThis["document"] = v389;
    try {
      const v390 = {
          id: "sb-swap-visible",
          type: "storyboard",
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          aspectRatio: "1:1",
          cells: [
            { id: "cell-1", localPath: "output/a.png", isEmpty: false },
            { id: "cell-2", localPath: "output/b.png", isEmpty: false },
          ],
        },
        v391 = new StoryboardNode(v390),
        v392 = v391["mount"]();
      (v389["body"]["appendChild"](v392),
        v391["update"]({
          ...v390,
          cells: [
            { id: "cell-1", localPath: "output/b.png", isEmpty: false },
            { id: "cell-2", localPath: "output/a.png", isEmpty: false },
          ],
        }));
      const v393 = v392["querySelectorAll"](".sb-cell"),
        v394 = v393[0]["querySelector"](".cell-content-wrap"),
        v395 = v393[1]["querySelector"](".cell-content-wrap"),
        v396 = v394["querySelector"]("img"),
        v397 = v395["querySelector"]("img");
      (strict["equal"](v394["children"]["length"], 1),
        strict["equal"](v395["children"]["length"], 1),
        strict["equal"](v396["getAttribute"]("src"), "/output/b.png"),
        strict["equal"](v397["getAttribute"]("src"), "/output/a.png"),
        strict["equal"](
          v396["classList"]["contains"]("is-cell-preloading"),
          false,
        ),
        strict["equal"](
          v397["classList"]["contains"]("is-cell-preloading"),
          false,
        ));
    } finally {
      globalThis["document"] = v388;
    }
  }));

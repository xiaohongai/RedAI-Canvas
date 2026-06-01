import test from "node:test";
import strict from "node:assert/strict";
import {
  bindRefThumbFixedSlotDrag,
  bindRefThumbOrderDrag,
} from "./refThumbDragController.js";
class FakeClassList {
  constructor(v0) {
    this["owner"] = v0;
  }
  ["_tokens"]() {
    return String(this["owner"]["className"] || "")
      ["split"](/\s+/)
      ["filter"](Boolean);
  }
  ["contains"](v1) {
    return this["_tokens"]()["includes"](String(v1 || ""));
  }
  ["add"](...v2) {
    const v3 = new Set(this["_tokens"]());
    (v2["forEach"]((v4) => v3["add"](String(v4 || ""))),
      (this["owner"]["className"] = Array["from"](v3)["join"]("\x20")));
  }
  ["remove"](...v5) {
    const v6 = new Set(v5["map"]((v7) => String(v7 || "")));
    this["owner"]["className"] = this["_tokens"]()
      ["filter"]((v8) => !v6["has"](v8))
      ["join"]("\x20");
  }
}
class FakeElement {
  constructor({
    className: className = "",
    dataset: dataset = {},
    tagName: tagName = "div",
  } = {}) {
    ((this["tagName"] = String(tagName || "div")["toUpperCase"]()),
      (this["className"] = className),
      (this["dataset"] = { ...dataset }),
      (this["style"] = {}),
      (this["attributes"] = {}),
      (this["children"] = []),
      (this["parentNode"] = null),
      (this["parentElement"] = null),
      (this["listeners"] = new Map()),
      (this["classList"] = new FakeClassList(this)));
  }
  get ["nextSibling"]() {
    if (!this["parentNode"]) return null;
    const v9 = this["parentNode"]["children"],
      v10 = v9["indexOf"](this);
    return v10 >= 0 ? v9[v10 + 1] || null : null;
  }
  ["appendChild"](v11) {
    if (v11["parentNode"]) v11["remove"]();
    return (
      this["children"]["push"](v11),
      (v11["parentNode"] = this),
      (v11["parentElement"] = this),
      v11
    );
  }
  ["insertBefore"](v12, v13) {
    if (v12["parentNode"]) v12["remove"]();
    const v14 = v13 ? this["children"]["indexOf"](v13) : -1;
    if (v14 >= 0) this["children"]["splice"](v14, 0, v12);
    else this["children"]["push"](v12);
    return ((v12["parentNode"] = this), (v12["parentElement"] = this), v12);
  }
  ["remove"]() {
    if (!this["parentNode"]) return;
    const v15 = this["parentNode"]["children"],
      v16 = v15["indexOf"](this);
    if (v16 >= 0) v15["splice"](v16, 1);
    ((this["parentNode"] = null), (this["parentElement"] = null));
  }
  ["setAttribute"](v17, v18) {
    this["attributes"][String(v17)] = String(v18);
  }
  ["getAttribute"](v19) {
    return this["attributes"][String(v19)];
  }
  ["addEventListener"](v20, v21) {
    if (!this["listeners"]["has"](v20)) this["listeners"]["set"](v20, []);
    this["listeners"]["get"](v20)["push"](v21);
  }
  ["dispatch"](v22, v23) {
    for (const v24 of this["listeners"]["get"](v22) || []) {
      v24(v23);
    }
  }
  ["matches"](v25) {
    if (v25 === ".ref-thumb-container")
      return this["classList"]["contains"]("ref-thumb-container");
    if (v25 === ".ref-thumb-wrap")
      return this["classList"]["contains"]("ref-thumb-wrap");
    if (v25 === "[data-slot]") return !!this["dataset"]["slot"];
    return false;
  }
  ["closest"](v26) {
    let v27 = this;
    while (v27) {
      if (v27["matches"](v26)) return v27;
      v27 = v27["parentElement"];
    }
    return null;
  }
  ["querySelector"](v28) {
    return this["querySelectorAll"](v28)[0] || null;
  }
  ["querySelectorAll"](v29) {
    const v30 = [],
      v31 = (v32) => {
        if (matchesFakeSelector(v32, v29)) v30["push"](v32);
        v32["children"]["forEach"](v31);
      };
    return (this["children"]["forEach"](v31), v30);
  }
  ["getBoundingClientRect"]() {
    const v33 = this["parentNode"]
      ? this["parentNode"]["children"]["indexOf"](this)
      : 0;
    return { left: Math["max"](0, v33) * 100, top: 0, width: 100, height: 40 };
  }
}
function matchesFakeSelector(v34, v35) {
  if (v35 === ".ref-thumb-wrap")
    return v34["classList"]["contains"]("ref-thumb-wrap");
  if (v35 === ".ref-thumb-container")
    return v34["classList"]["contains"]("ref-thumb-container");
  if (v35 === ".ref-thumb-wrap.is-drop-allow")
    return (
      v34["classList"]["contains"]("ref-thumb-wrap") &&
      v34["classList"]["contains"]("is-drop-allow")
    );
  if (v35 === "[data-slot]") return !!v34["dataset"]["slot"];
  return false;
}
function createThumb(v36, v37 = {}) {
  return new FakeElement({
    className: v37["className"] || "ref-thumb-wrap",
    dataset: {
      edgeId: v36,
      sourceId: v37["sourceId"] || "src-" + v36,
      slot: v37["slot"] || "",
      kind: v37["kind"] || "",
      refOrigin: v37["refOrigin"] || "",
      refKey: v37["refKey"] || "",
      assetId: v37["assetId"] || "",
    },
    tagName: v37["tagName"] || "div",
  });
}
function createEvent(v38, v39 = 0) {
  return {
    target: v38,
    clientX: v39,
    dataTransfer: {
      effectAllowed: "",
      dropEffect: "",
      data: {},
      setData(v40, v41) {
        this["data"][v40] = v41;
      },
    },
    defaultPrevented: false,
    stopped: false,
    preventDefault() {
      this["defaultPrevented"] = true;
    },
    stopPropagation() {
      this["stopped"] = true;
    },
  };
}
function createStore({ edges: v42, nodes: nodes = {}, incoming: v43 }) {
  const v44 = [];
  return {
    calls: v44,
    getState() {
      return { edges: v42, nodes: nodes };
    },
    getIncomingEdges() {
      return v43 || Object["values"](v42);
    },
    updateEdgesBatch(v45, v46) {
      v44["push"]({ removeIds: v45, addedEdges: v46 });
    },
  };
}
(test("refThumbDragController: order drag commits DOM order once", () => {
  const v47 = new FakeElement({ className: "ref-thumb-container" }),
    v48 = createThumb("e1"),
    v49 = createThumb("e2"),
    v50 = createThumb("e3");
  (v47["appendChild"](v48), v47["appendChild"](v49), v47["appendChild"](v50));
  const v51 = {
      e1: { id: "e1", sourceId: "s1", targetId: "target" },
      e2: { id: "e2", sourceId: "s2", targetId: "target" },
      e3: { id: "e3", sourceId: "s3", targetId: "target" },
    },
    v52 = createStore({ edges: v51 }),
    v53 = {};
  (bindRefThumbOrderDrag({
    owner: v53,
    container: v47,
    store: v52,
    nodeId: "target",
  }),
    v50["dispatch"]("dragstart", createEvent(v50)),
    v48["dispatch"]("dragover", createEvent(v48, 0)),
    v50["dispatch"]("dragend", createEvent(v50)),
    strict["equal"](v52["calls"]["length"], 1),
    strict["deepEqual"](v52["calls"][0]["removeIds"], ["e1", "e2", "e3"]),
    strict["deepEqual"](
      v52["calls"][0]["addedEdges"]["map"]((v54) => v54["id"]),
      ["e3", "e1", "e2"],
    ),
    strict["equal"](v53["_isDraggingSorting"], false));
}),
  test("refThumbDragController: unchanged order does not commit", () => {
    const v55 = new FakeElement({ className: "ref-thumb-container" }),
      v56 = createThumb("e1"),
      v57 = createThumb("e2");
    (v55["appendChild"](v56), v55["appendChild"](v57));
    const v58 = {
        e1: { id: "e1", sourceId: "s1", targetId: "target" },
        e2: { id: "e2", sourceId: "s2", targetId: "target" },
      },
      v59 = createStore({ edges: v58 });
    (bindRefThumbOrderDrag({
      owner: {},
      container: v55,
      store: v59,
      nodeId: "target",
    }),
      v56["dispatch"]("dragstart", createEvent(v56)),
      v56["dispatch"]("dragend", createEvent(v56)),
      strict["equal"](v59["calls"]["length"], 0));
  }),
  test("refThumbDragController: incrementally bound thumbs share drag state", () => {
    const v60 = new FakeElement({ className: "ref-thumb-container" }),
      v61 = createThumb("e1");
    v60["appendChild"](v61);
    const v62 = {
        e1: { id: "e1", sourceId: "s1", targetId: "target" },
        e2: { id: "e2", sourceId: "s2", targetId: "target" },
      },
      v63 = createStore({ edges: v62 });
    bindRefThumbOrderDrag({
      owner: {},
      container: v60,
      store: v63,
      nodeId: "target",
    });
    const v64 = createThumb("e2");
    (v60["appendChild"](v64),
      bindRefThumbOrderDrag({
        owner: {},
        container: v60,
        store: v63,
        nodeId: "target",
      }),
      v61["dispatch"]("dragstart", createEvent(v61)),
      v64["dispatch"]("dragover", createEvent(v64, 999)),
      v61["dispatch"]("dragend", createEvent(v61)),
      strict["deepEqual"](
        v60["children"]["map"]((v65) => v65["dataset"]["edgeId"]),
        ["e2", "e1"],
      ),
      strict["equal"](v63["calls"]["length"], 1),
      strict["deepEqual"](
        v63["calls"][0]["addedEdges"]["map"]((v66) => v66["id"]),
        ["e2", "e1"],
      ));
  }),
  test("refThumbDragController: asset and empty refs do not participate in order", () => {
    const v67 = new FakeElement({ className: "ref-thumb-container" }),
      v68 = createThumb("e1"),
      v69 = createThumb("", { refOrigin: "asset", assetId: "asset-1" }),
      v70 = createThumb(""),
      v71 = createThumb("e2");
    (v67["appendChild"](v68),
      v67["appendChild"](v69),
      v67["appendChild"](v70),
      v67["appendChild"](v71));
    const v72 = {
        e1: { id: "e1", sourceId: "s1", targetId: "target" },
        e2: { id: "e2", sourceId: "s2", targetId: "target" },
      },
      v73 = createStore({ edges: v72 });
    (bindRefThumbOrderDrag({
      owner: {},
      container: v67,
      store: v73,
      nodeId: "target",
    }),
      strict["equal"](v69["dataset"]["dragBound"], undefined),
      strict["equal"](v70["dataset"]["dragBound"], undefined),
      v71["dispatch"]("dragstart", createEvent(v71)),
      v68["dispatch"]("dragover", createEvent(v68, 0)),
      v71["dispatch"]("dragend", createEvent(v71)),
      strict["equal"](v73["calls"]["length"], 1),
      strict["deepEqual"](v73["calls"][0]["removeIds"], ["e1", "e2"]),
      strict["deepEqual"](
        v73["calls"][0]["addedEdges"]["map"]((v74) => v74["id"]),
        ["e2", "e1"],
      ));
  }),
  test("refThumbDragController: group shared refs reorder backing group input edges", () => {
    const v75 = new FakeElement({ className: "ref-thumb-container" }),
      v76 = createThumb("groupEdgeA", { sourceId: "s1" }),
      v77 = createThumb("groupEdgeB", { sourceId: "s2" });
    (v75["appendChild"](v76), v75["appendChild"](v77));
    const v78 = {
        groupEdgeA: { id: "groupEdgeA", sourceId: "s1", targetId: "group" },
        groupEdgeB: { id: "groupEdgeB", sourceId: "s2", targetId: "group" },
      },
      v79 = [
        {
          ...v78["groupEdgeA"],
          isGroupShared: true,
          sharedGroupId: "group",
          effectiveTargetId: "target",
        },
        {
          ...v78["groupEdgeB"],
          isGroupShared: true,
          sharedGroupId: "group",
          effectiveTargetId: "target",
        },
      ],
      v80 = createStore({ edges: v78, incoming: v79 });
    (bindRefThumbOrderDrag({
      owner: {},
      container: v75,
      store: v80,
      nodeId: "target",
    }),
      strict["equal"](v76["getAttribute"]("draggable"), "true"),
      strict["equal"](v77["getAttribute"]("draggable"), "true"),
      v77["dispatch"]("dragstart", createEvent(v77)),
      v76["dispatch"]("dragover", createEvent(v76, 0)),
      v77["dispatch"]("dragend", createEvent(v77)),
      strict["equal"](v80["calls"]["length"], 1),
      strict["deepEqual"](v80["calls"][0]["removeIds"], [
        "groupEdgeA",
        "groupEdgeB",
      ]),
      strict["deepEqual"](
        v80["calls"][0]["addedEdges"]["map"]((v81) => [
          v81["id"],
          v81["targetId"],
        ]),
        [
          ["groupEdgeB", "group"],
          ["groupEdgeA", "group"],
        ],
      ));
  }),
  test("refThumbDragController: fixed slot refs do not participate in free order", () => {
    const v82 = new FakeElement({ className: "ref-thumb-container" }),
      v83 = createThumb("e1", { slot: "sourceVideo", sourceId: "videoA" }),
      v84 = createThumb("e2", { slot: "refImage", sourceId: "imageB" });
    (v83["setAttribute"]("draggable", "true"),
      v84["setAttribute"]("draggable", "true"),
      v82["appendChild"](v83),
      v82["appendChild"](v84));
    const v85 = {
        e1: {
          id: "e1",
          sourceId: "videoA",
          targetId: "target",
          refSlot: "sourceVideo",
        },
        e2: {
          id: "e2",
          sourceId: "imageB",
          targetId: "target",
          refSlot: "refImage",
        },
      },
      v86 = createStore({ edges: v85 });
    (bindRefThumbOrderDrag({
      owner: {},
      container: v82,
      store: v86,
      nodeId: "target",
    }),
      strict["equal"](v83["dataset"]["dragBound"], undefined),
      strict["equal"](v84["dataset"]["dragBound"], undefined),
      strict["equal"](v83["getAttribute"]("draggable"), "true"),
      strict["equal"](v84["getAttribute"]("draggable"), "true"),
      v84["dispatch"]("dragstart", createEvent(v84)),
      v83["dispatch"]("dragover", createEvent(v83, 0)),
      v84["dispatch"]("dragend", createEvent(v84)),
      strict["deepEqual"](
        v82["children"]["map"]((v87) => v87["dataset"]["edgeId"]),
        ["e1", "e2"],
      ),
      strict["equal"](v86["calls"]["length"], 0));
  }),
  test("refThumbDragController: group output refs persist source order on base edge", () => {
    const v88 = new FakeElement({ className: "ref-thumb-container" }),
      v89 = "groupEdge::group-output::image-1",
      v90 = "groupEdge::group-output::image-2",
      v91 = createThumb(v89, { sourceId: "image-1" }),
      v92 = createThumb(v90, { sourceId: "image-2" });
    (v88["appendChild"](v91), v88["appendChild"](v92));
    const v93 = {
        groupEdge: {
          id: "groupEdge",
          sourceId: "group",
          targetId: "target",
          isGroupOutputLink: true,
        },
      },
      v94 = [
        {
          ...v93["groupEdge"],
          id: v89,
          sourceId: "image-1",
          isGroupOutput: true,
          outputGroupId: "group",
          groupOutputEdgeId: "groupEdge",
          effectiveTargetId: "target",
        },
        {
          ...v93["groupEdge"],
          id: v90,
          sourceId: "image-2",
          isGroupOutput: true,
          outputGroupId: "group",
          groupOutputEdgeId: "groupEdge",
          effectiveTargetId: "target",
        },
      ],
      v95 = createStore({ edges: v93, incoming: v94 });
    (bindRefThumbOrderDrag({
      owner: {},
      container: v88,
      store: v95,
      nodeId: "target",
    }),
      strict["equal"](v91["getAttribute"]("draggable"), "true"),
      strict["equal"](v92["getAttribute"]("draggable"), "true"),
      v92["dispatch"]("dragstart", createEvent(v92)),
      v91["dispatch"]("dragover", createEvent(v91, 0)),
      v92["dispatch"]("dragend", createEvent(v92)),
      strict["deepEqual"](
        v88["children"]["map"]((v96) => v96["dataset"]["edgeId"]),
        [v90, v89],
      ),
      strict["equal"](v95["calls"]["length"], 1),
      strict["deepEqual"](v95["calls"][0]["removeIds"], ["groupEdge"]),
      strict["deepEqual"](
        v95["calls"][0]["addedEdges"]["map"]((v97) => v97["id"]),
        ["groupEdge"],
      ),
      strict["deepEqual"](
        v95["calls"][0]["addedEdges"][0]["groupOutputSourceOrder"],
        ["image-2", "image-1"],
      ));
  }),
  test("refThumbDragController: shared group output refs persist source order per target", () => {
    const v98 = new FakeElement({ className: "ref-thumb-container" }),
      v99 = "groupEdge::group-output::image-1",
      v100 = "groupEdge::group-output::image-2",
      v101 = createThumb(v99, { sourceId: "image-1" }),
      v102 = createThumb(v100, { sourceId: "image-2" });
    (v98["appendChild"](v101), v98["appendChild"](v102));
    const v103 = {
        groupEdge: {
          id: "groupEdge",
          sourceId: "groupA",
          targetId: "groupB",
          isGroupOutputLink: true,
        },
      },
      v104 = [
        {
          ...v103["groupEdge"],
          id: v99,
          sourceId: "image-1",
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: "groupB",
          outputGroupId: "groupA",
          groupOutputEdgeId: "groupEdge",
          effectiveTargetId: "target",
        },
        {
          ...v103["groupEdge"],
          id: v100,
          sourceId: "image-2",
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: "groupB",
          outputGroupId: "groupA",
          groupOutputEdgeId: "groupEdge",
          effectiveTargetId: "target",
        },
      ],
      v105 = createStore({ edges: v103, incoming: v104 });
    (bindRefThumbOrderDrag({
      owner: {},
      container: v98,
      store: v105,
      nodeId: "target",
    }),
      strict["equal"](v101["getAttribute"]("draggable"), "true"),
      strict["equal"](v102["getAttribute"]("draggable"), "true"),
      v102["dispatch"]("dragstart", createEvent(v102)),
      v101["dispatch"]("dragover", createEvent(v101, 0)),
      v102["dispatch"]("dragend", createEvent(v102)),
      strict["deepEqual"](
        v98["children"]["map"]((v106) => v106["dataset"]["edgeId"]),
        [v100, v99],
      ),
      strict["equal"](v105["calls"]["length"], 1),
      strict["deepEqual"](v105["calls"][0]["removeIds"], ["groupEdge"]),
      strict["deepEqual"](
        v105["calls"][0]["addedEdges"]["map"]((v107) => v107["id"]),
        ["groupEdge"],
      ),
      strict["equal"](
        v105["calls"][0]["addedEdges"][0]["groupOutputSourceOrder"],
        undefined,
      ),
      strict["deepEqual"](
        v105["calls"][0]["addedEdges"][0]["groupOutputSourceOrderByTarget"],
        { target: ["image-2", "image-1"] },
      ));
  }),
  test("refThumbDragController:\x20shared\x20group\x20output\x20order\x20keeps\x20sibling\x20targets\x20isolated", () => {
    const v108 = new FakeElement({ className: "ref-thumb-container" }),
      v109 = "groupEdge::group-output::image-1",
      v110 = "groupEdge::group-output::image-2",
      v111 = createThumb(v109, { sourceId: "image-1" }),
      v112 = createThumb(v110, { sourceId: "image-2" });
    (v108["appendChild"](v111), v108["appendChild"](v112));
    const v113 = {
        groupEdge: {
          id: "groupEdge",
          sourceId: "groupA",
          targetId: "groupB",
          isGroupOutputLink: true,
          groupOutputSourceOrderByTarget: { nodeB: ["image-1", "image-2"] },
        },
      },
      v114 = [
        {
          ...v113["groupEdge"],
          id: v109,
          sourceId: "image-1",
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: "groupB",
          outputGroupId: "groupA",
          groupOutputEdgeId: "groupEdge",
          effectiveTargetId: "nodeA",
        },
        {
          ...v113["groupEdge"],
          id: v110,
          sourceId: "image-2",
          isGroupOutput: true,
          isGroupShared: true,
          sharedGroupId: "groupB",
          outputGroupId: "groupA",
          groupOutputEdgeId: "groupEdge",
          effectiveTargetId: "nodeA",
        },
      ],
      v115 = createStore({ edges: v113, incoming: v114 });
    (bindRefThumbOrderDrag({
      owner: {},
      container: v108,
      store: v115,
      nodeId: "nodeA",
    }),
      v112["dispatch"]("dragstart", createEvent(v112)),
      v111["dispatch"]("dragover", createEvent(v111, 0)),
      v112["dispatch"]("dragend", createEvent(v112)),
      strict["equal"](v115["calls"]["length"], 1),
      strict["deepEqual"](
        v115["calls"][0]["addedEdges"][0]["groupOutputSourceOrderByTarget"],
        { nodeA: ["image-2", "image-1"], nodeB: ["image-1", "image-2"] },
      ));
  }),
  test("refThumbDragController:\x20fixed\x20slot\x20swap\x20exchanges\x20refSlot", () => {
    const v116 = new FakeElement({ className: "ref-thumb-container" }),
      v117 = createThumb("e1", { slot: "slotA", sourceId: "audioA" }),
      v118 = createThumb("e2", { slot: "slotB", sourceId: "audioB" });
    (v116["appendChild"](v117), v116["appendChild"](v118));
    const v119 = {
        e1: {
          id: "e1",
          sourceId: "audioA",
          targetId: "target",
          refSlot: "slotA",
        },
        e2: {
          id: "e2",
          sourceId: "audioB",
          targetId: "target",
          refSlot: "slotB",
        },
      },
      v120 = { audioA: { type: "source-audio" }, audioB: { type: "ai-audio" } },
      v121 = createStore({ edges: v119, nodes: v120 }),
      v122 = {};
    (bindRefThumbFixedSlotDrag({
      owner: v122,
      container: v116,
      store: v121,
      nodeId: "target",
      acceptMap: { slotA: "audio", slotB: "audio" },
    }),
      v116["dispatch"]("dragstart", createEvent(v117)),
      v116["dispatch"]("drop", createEvent(v118)),
      strict["equal"](v121["calls"]["length"], 1),
      strict["deepEqual"](v121["calls"][0]["removeIds"], ["e1", "e2"]),
      strict["deepEqual"](
        v121["calls"][0]["addedEdges"]["map"]((v123) => [
          v123["id"],
          v123["refSlot"],
        ]),
        [
          ["e1", "slotB"],
          ["e2", "slotA"],
        ],
      ),
      strict["equal"](v122["_fixedSlotDrag"], null));
  }),
  test("refThumbDragController: fixed slot drag still works when order binding also runs", () => {
    const v124 = new FakeElement({ className: "ref-thumb-container" }),
      v125 = createThumb("e1", { slot: "slotA", sourceId: "audioA" }),
      v126 = createThumb("e2", { slot: "slotB", sourceId: "audioB" });
    (v124["appendChild"](v125), v124["appendChild"](v126));
    const v127 = {
        e1: {
          id: "e1",
          sourceId: "audioA",
          targetId: "target",
          refSlot: "slotA",
        },
        e2: {
          id: "e2",
          sourceId: "audioB",
          targetId: "target",
          refSlot: "slotB",
        },
      },
      v128 = { audioA: { type: "source-audio" }, audioB: { type: "ai-audio" } },
      v129 = createStore({ edges: v127, nodes: v128 }),
      v130 = {};
    (bindRefThumbOrderDrag({
      owner: v130,
      container: v124,
      store: v129,
      nodeId: "target",
    }),
      bindRefThumbFixedSlotDrag({
        owner: v130,
        container: v124,
        store: v129,
        nodeId: "target",
        acceptMap: { slotA: "audio", slotB: "audio" },
      }),
      v124["dispatch"]("dragstart", createEvent(v125)),
      v124["dispatch"]("drop", createEvent(v126)),
      strict["equal"](v129["calls"]["length"], 1),
      strict["deepEqual"](v129["calls"][0]["removeIds"], ["e1", "e2"]),
      strict["deepEqual"](
        v129["calls"][0]["addedEdges"]["map"]((v131) => [
          v131["id"],
          v131["refSlot"],
        ]),
        [
          ["e1", "slotB"],
          ["e2", "slotA"],
        ],
      ));
  }),
  test("refThumbDragController: fixed image slots swap refSlot", () => {
    const v132 = new FakeElement({ className: "ref-thumb-container" }),
      v133 = createThumb("e1", {
        slot: "replaceTarget",
        kind: "image",
        sourceId: "imageA",
      }),
      v134 = createThumb("e2", {
        slot: "replacedImage",
        kind: "image",
        sourceId: "imageB",
      });
    (v132["appendChild"](v133), v132["appendChild"](v134));
    const v135 = {
        e1: {
          id: "e1",
          sourceId: "imageA",
          targetId: "target",
          refSlot: "replaceTarget",
        },
        e2: {
          id: "e2",
          sourceId: "imageB",
          targetId: "target",
          refSlot: "replacedImage",
        },
      },
      v136 = { imageA: { type: "source-image" }, imageB: { type: "ai-image" } },
      v137 = createStore({ edges: v135, nodes: v136 });
    (bindRefThumbFixedSlotDrag({
      owner: {},
      container: v132,
      store: v137,
      nodeId: "target",
      acceptMap: { replaceTarget: "image", replacedImage: "image" },
    }),
      v132["dispatch"]("dragstart", createEvent(v133)),
      v132["dispatch"]("dragover", createEvent(v134)),
      strict["deepEqual"](
        v132["children"]["map"]((v138) => v138["dataset"]["edgeId"]),
        ["e1", "e2"],
      ),
      strict["equal"](String(v133["style"]["transform"] || ""), ""),
      strict["equal"](String(v134["style"]["transform"] || ""), ""),
      v132["dispatch"]("drop", createEvent(v134)),
      strict["equal"](v137["calls"]["length"], 1),
      strict["deepEqual"](
        v137["calls"][0]["addedEdges"]["map"]((v139) => [
          v139["id"],
          v139["refSlot"],
        ]),
        [
          ["e1", "replacedImage"],
          ["e2", "replaceTarget"],
        ],
      ));
  }),
  test("refThumbDragController: fixed slot drop to empty slot moves one edge", () => {
    const v140 = new FakeElement({ className: "ref-thumb-container" }),
      v141 = createThumb("e1", { slot: "slotA", sourceId: "audioA" }),
      v142 = createThumb("", { slot: "slotB", tagName: "button" });
    (v140["appendChild"](v141), v140["appendChild"](v142));
    const v143 = {
        e1: {
          id: "e1",
          sourceId: "audioA",
          targetId: "target",
          refSlot: "slotA",
        },
      },
      v144 = { audioA: { type: "source-audio" } },
      v145 = createStore({ edges: v143, nodes: v144 });
    (bindRefThumbFixedSlotDrag({
      owner: {},
      container: v140,
      store: v145,
      nodeId: "target",
      acceptMap: { slotA: "audio", slotB: "audio" },
    }),
      v140["dispatch"]("dragstart", createEvent(v141)),
      v140["dispatch"]("dragover", createEvent(v142)),
      strict["deepEqual"](
        v140["children"]["map"]((v146) => v146["dataset"]["edgeId"] || ""),
        ["e1", ""],
      ),
      v140["dispatch"]("drop", createEvent(v142)),
      strict["equal"](v145["calls"]["length"], 1),
      strict["deepEqual"](v145["calls"][0]["removeIds"], ["e1"]),
      strict["deepEqual"](
        v145["calls"][0]["addedEdges"]["map"]((v147) => [
          v147["id"],
          v147["refSlot"],
        ]),
        [["e1", "slotB"]],
      ));
  }),
  test("refThumbDragController:\x20fixed\x20slot\x20rejects\x20type\x20mismatch\x20and\x20invalid\x20edges", () => {
    const v148 = new FakeElement({ className: "ref-thumb-container" }),
      v149 = createThumb("imageEdge", { slot: "imageSlot", sourceId: "img" }),
      v150 = createThumb("", { slot: "audioSlot", tagName: "button" }),
      v151 = createThumb("otherEdge", { slot: "imageSlot", sourceId: "img2" }),
      v152 = createThumb("groupEdge", { slot: "imageSlot", sourceId: "img3" });
    (v148["appendChild"](v149),
      v148["appendChild"](v150),
      v148["appendChild"](v151),
      v148["appendChild"](v152));
    const v153 = {
        imageEdge: {
          id: "imageEdge",
          sourceId: "img",
          targetId: "target",
          refSlot: "imageSlot",
        },
        otherEdge: {
          id: "otherEdge",
          sourceId: "img2",
          targetId: "other",
          refSlot: "imageSlot",
        },
        groupEdge: {
          id: "groupEdge",
          sourceId: "img3",
          targetId: "target",
          refSlot: "imageSlot",
          isGroupShared: true,
        },
      },
      v154 = {
        img: { type: "source-image" },
        img2: { type: "source-image" },
        img3: { type: "source-image" },
      },
      v155 = createStore({ edges: v153, nodes: v154 });
    (bindRefThumbFixedSlotDrag({
      owner: {},
      container: v148,
      store: v155,
      nodeId: "target",
      acceptMap: { imageSlot: "image", audioSlot: "audio" },
    }),
      v148["dispatch"]("dragstart", createEvent(v149)),
      v148["dispatch"]("drop", createEvent(v150)),
      v148["dispatch"]("dragstart", createEvent(v151)),
      v148["dispatch"]("drop", createEvent(v150)),
      v148["dispatch"]("dragstart", createEvent(v152)),
      v148["dispatch"]("drop", createEvent(v150)),
      strict["equal"](v155["calls"]["length"], 0));
  }),
  test("refThumbDragController: fixed slot group shared edge moves backing group input ref", () => {
    const v156 = new FakeElement({ className: "ref-thumb-container" }),
      v157 = createThumb("groupEdge", { slot: "imageSlot", sourceId: "img" }),
      v158 = createThumb("", { slot: "otherImageSlot", tagName: "button" });
    (v156["appendChild"](v157), v156["appendChild"](v158));
    const v159 = {
        groupEdge: {
          id: "groupEdge",
          sourceId: "img",
          targetId: "group",
          refSlot: "imageSlot",
        },
      },
      v160 = [
        {
          ...v159["groupEdge"],
          isGroupShared: true,
          effectiveTargetId: "target",
        },
      ],
      v161 = {},
      v162 = createStore({
        edges: v159,
        incoming: v160,
        nodes: { img: { type: "source-image" } },
      });
    (bindRefThumbFixedSlotDrag({
      owner: v161,
      container: v156,
      store: v162,
      nodeId: "target",
      acceptMap: { imageSlot: "image", otherImageSlot: "image" },
    }),
      v156["dispatch"]("dragstart", createEvent(v157)),
      v156["dispatch"]("drop", createEvent(v158)),
      strict["equal"](v161["_fixedSlotDrag"], null),
      strict["equal"](v162["calls"]["length"], 1),
      strict["deepEqual"](v162["calls"][0]["removeIds"], ["groupEdge"]),
      strict["deepEqual"](
        v162["calls"][0]["addedEdges"]["map"]((v163) => [
          v163["id"],
          v163["targetId"],
          v163["refSlot"],
          v163["isGroupShared"],
        ]),
        [["groupEdge", "group", "otherImageSlot", undefined]],
      ));
  }),
  test("refThumbDragController:\x20fixed\x20slot\x20group\x20shared\x20refs\x20swap\x20backing\x20group\x20input\x20refs", () => {
    const v164 = new FakeElement({ className: "ref-thumb-container" }),
      v165 = createThumb("groupEdgeA", {
        slot: "replaceTarget",
        sourceId: "imageA",
      }),
      v166 = createThumb("groupEdgeB", {
        slot: "replacedImage",
        sourceId: "imageB",
      });
    (v164["appendChild"](v165), v164["appendChild"](v166));
    const v167 = {
        groupEdgeA: { id: "groupEdgeA", sourceId: "imageA", targetId: "group" },
        groupEdgeB: { id: "groupEdgeB", sourceId: "imageB", targetId: "group" },
      },
      v168 = [
        {
          ...v167["groupEdgeA"],
          isGroupShared: true,
          sharedGroupId: "group",
          effectiveTargetId: "target",
        },
        {
          ...v167["groupEdgeB"],
          isGroupShared: true,
          sharedGroupId: "group",
          effectiveTargetId: "target",
        },
      ],
      v169 = {},
      v170 = createStore({
        edges: v167,
        incoming: v168,
        nodes: {
          imageA: { type: "source-image" },
          imageB: { type: "ai-image" },
        },
      });
    (bindRefThumbFixedSlotDrag({
      owner: v169,
      container: v164,
      store: v170,
      nodeId: "target",
      acceptMap: { replaceTarget: "image", replacedImage: "image" },
    }),
      v164["dispatch"]("dragstart", createEvent(v165)),
      v164["dispatch"]("drop", createEvent(v166)),
      strict["equal"](v170["calls"]["length"], 1),
      strict["deepEqual"](v170["calls"][0]["removeIds"], [
        "groupEdgeA",
        "groupEdgeB",
      ]),
      strict["deepEqual"](
        v170["calls"][0]["addedEdges"]["map"]((v171) => [
          v171["id"],
          v171["targetId"],
          v171["refSlot"],
        ]),
        [
          ["groupEdgeA", "group", "replacedImage"],
          ["groupEdgeB", "group", "replaceTarget"],
        ],
      ));
  }),
  test("refThumbDragController: fixed slot group output refs swap by source order", () => {
    const v172 = new FakeElement({ className: "ref-thumb-container" }),
      v173 = "groupEdge::group-output::imageA",
      v174 = "groupEdge::group-output::imageB",
      v175 = createThumb(v173, { slot: "replaceTarget", sourceId: "imageA" }),
      v176 = createThumb(v174, { slot: "replacedImage", sourceId: "imageB" });
    (v172["appendChild"](v175), v172["appendChild"](v176));
    const v177 = {
        groupEdge: {
          id: "groupEdge",
          sourceId: "group",
          targetId: "target",
          isGroupOutputLink: true,
        },
      },
      v178 = [
        {
          ...v177["groupEdge"],
          id: v173,
          sourceId: "imageA",
          refSlot: "replaceTarget",
          isGroupOutput: true,
          outputGroupId: "group",
          groupOutputEdgeId: "groupEdge",
          effectiveTargetId: "target",
        },
        {
          ...v177["groupEdge"],
          id: v174,
          sourceId: "imageB",
          refSlot: "replacedImage",
          isGroupOutput: true,
          outputGroupId: "group",
          groupOutputEdgeId: "groupEdge",
          effectiveTargetId: "target",
        },
      ],
      v179 = {},
      v180 = createStore({
        edges: v177,
        incoming: v178,
        nodes: {
          imageA: { type: "source-image" },
          imageB: { type: "ai-image" },
        },
      });
    (bindRefThumbFixedSlotDrag({
      owner: v179,
      container: v172,
      store: v180,
      nodeId: "target",
      acceptMap: { replaceTarget: "image", replacedImage: "image" },
    }),
      v172["dispatch"]("dragstart", createEvent(v175)),
      v172["dispatch"]("drop", createEvent(v176)),
      strict["equal"](v180["calls"]["length"], 1),
      strict["deepEqual"](v180["calls"][0]["removeIds"], ["groupEdge"]),
      strict["deepEqual"](
        v180["calls"][0]["addedEdges"]["map"]((v181) => [
          v181["id"],
          v181["groupOutputSourceOrder"],
        ]),
        [["groupEdge", ["imageB", "imageA"]]],
      ));
  }),
  test("refThumbDragController: fixed slot binding refreshes accept map", () => {
    const v182 = new FakeElement({ className: "ref-thumb-container" }),
      v183 = createThumb("e1", { slot: "slotA", sourceId: "audioA" }),
      v184 = createThumb("", { slot: "slotB", tagName: "button" });
    (v182["appendChild"](v183), v182["appendChild"](v184));
    const v185 = {
        e1: {
          id: "e1",
          sourceId: "audioA",
          targetId: "target",
          refSlot: "slotA",
        },
      },
      v186 = { audioA: { type: "source-audio" } },
      v187 = createStore({ edges: v185, nodes: v186 }),
      v188 = {};
    (bindRefThumbFixedSlotDrag({
      owner: v188,
      container: v182,
      store: v187,
      nodeId: "target",
      acceptMap: { slotA: "audio", slotB: "image" },
    }),
      bindRefThumbFixedSlotDrag({
        owner: v188,
        container: v182,
        store: v187,
        nodeId: "target",
        acceptMap: { slotA: "audio", slotB: "audio" },
      }),
      v182["dispatch"]("dragstart", createEvent(v183)),
      v182["dispatch"]("drop", createEvent(v184)),
      strict["equal"](v187["calls"]["length"], 1),
      strict["deepEqual"](
        v187["calls"][0]["addedEdges"]["map"]((v189) => [
          v189["id"],
          v189["refSlot"],
        ]),
        [["e1", "slotB"]],
      ));
  }));

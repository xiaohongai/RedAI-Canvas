import { test } from "node:test";
import strict from "node:assert/strict";
import { createDragController } from "./DragController.js";
import {
  getPerfProbeSnapshot,
  resetPerfProbeData,
  setPerfProbeEnabled,
} from "../perf/perfProbe.js";
function isNodeType(v0, v1) {
  if (!v0) return false;
  if (Array["isArray"](v1)) return v1["includes"](v0["type"]);
  return v0["type"] === v1;
}
function identityScreenToWorld(v2, v3) {
  return { x: v2, y: v3 };
}
(test("DragController: 提取分镜会使用统一资源取图并把源格清为空态", () => {
  const v4 = {
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: {
      "sb-1": {
        id: "sb-1",
        type: "storyboard",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        cols: 1,
        rows: 1,
        cells: [
          {
            id: "cell-1",
            thumbLocalPath: "output/thumb.webp",
            thumbUrl: "data:image/png;base64,abc",
            thumbId: "thumb-1",
            sourceId: "source-1",
            isEmpty: false,
            extra: "keep",
          },
        ],
      },
    },
  };
  let v5 = null,
    v6 = null,
    v7 = null;
  const v8 = {
      getStateRaw() {
        return v4;
      },
      batch(v9) {
        v9();
      },
      addNode(v10) {
        v5 = v10;
      },
      setSelectedNodes(v11) {
        v6 = v11;
      },
      updateNodeData(v12, v13) {
        v7 = { nodeId: v12, patch: v13 };
      },
    },
    v14 = createDragController({
      store: v8,
      isNodeType: isNodeType,
      getShortcuts() {
        return {};
      },
      hitTestNode() {
        return null;
      },
      screenToWorld: identityScreenToWorld,
      generateId(v15) {
        return v15 + "-generated";
      },
      cloneNodesWithEdges() {
        return {};
      },
      commit() {},
    }),
    v16 = v14["finishDraggingCell"](
      {
        targetNodeId: "sb-1",
        sourceCellIndex: 0,
        draggedCellData: v4["nodes"]["sb-1"]["cells"][0],
        ghostEl: null,
        sourceCellEl: null,
        lastHoverNodeId: null,
      },
      180,
      180,
    );
  (strict["deepEqual"](v16, { didAct: true, committed: true }),
    strict["equal"](v5?.["src"], "/output/thumb.webp"),
    strict["equal"](v5?.["localPath"], "output/thumb.webp"),
    strict["deepEqual"](v6, ["source-image-generated"]),
    strict["deepEqual"](v7, {
      nodeId: "sb-1",
      patch: {
        cells: [
          {
            id: "cell-1",
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
            residualImageLocalPath: "output/thumb.webp",
            residualImageUrl: "data:image/png;base64,abc",
            residualImageWidth: null,
            residualImageHeight: null,
            residualImageMode: "cell",
            isEmpty: true,
            extra: "keep",
            col: 0,
            row: 0,
            url: "",
            localPath: null,
            originalLocalPath: null,
            displayLocalPath: null,
          },
        ],
      },
    }));
}),
  test("DragController:\x20自定义分割线和宫格间距拖出时按真实宫格区域裁切源图", () => {
    const v17 = globalThis["document"],
      v18 = globalThis["window"],
      v19 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [1] },
            cells: [
              {
                id: "cell-1",
                localPath: "output/old-unadjusted.jpg",
                sourceLocalPath: "output/source.jpg",
                sourceUrl: "/output/source.jpg",
                sourceWidth: 400,
                sourceHeight: 800,
                isEmpty: false,
              },
              { id: "cell-2", isEmpty: true },
            ],
          },
        },
      };
    let v20 = null,
      v21 = null,
      v22 = null,
      v23 = null;
    const v24 = { complete: true, naturalWidth: 400, naturalHeight: 800 },
      v25 = {
        width: 0,
        height: 0,
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: "",
            drawImage(...v26) {
              v23 = v26;
            },
          };
        },
        toDataURL(v27, v28) {
          return (
            strict["equal"](v27, "image/jpeg"),
            strict["equal"](v28, 0.9),
            "data:image/jpeg;base64,current-crop"
          );
        },
      };
    try {
      (delete globalThis["window"],
        (globalThis["document"] = {
          getElementById(v29) {
            return (
              strict["equal"](v29, "cell-sb-1-0"),
              {
                querySelector(v30) {
                  return (
                    strict["equal"](
                      v30,
                      "img.storyboard-cell-img--source-crop",
                    ),
                    v24
                  );
                },
              }
            );
          },
          createElement(v31) {
            return (strict["equal"](v31, "canvas"), v25);
          },
        }));
      const v32 = {
          getStateRaw() {
            return v19;
          },
          batch(v33) {
            v33();
          },
          addNode(v34) {
            v20 = v34;
          },
          setSelectedNodes(v35) {
            v21 = v35;
          },
          updateNodeData(v36, v37) {
            v22 = { nodeId: v36, patch: v37 };
          },
        },
        v38 = createDragController({
          store: v32,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v39) {
            return v39 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v40 = v38["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v19["nodes"]["sb-1"]["cells"][0],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          500,
          500,
        );
      (strict["deepEqual"](v40, { didAct: true, committed: true }),
        strict["deepEqual"](
          v23?.["slice"](1),
          [0, 0, 280, 800, 0, 0, 280, 800],
        ),
        strict["equal"](v25["width"], 280),
        strict["equal"](v25["height"], 800),
        strict["equal"](v20?.["src"], "data:image/jpeg;base64,current-crop"),
        strict["equal"](
          v20?.["capturePreviewUrl"],
          "data:image/jpeg;base64,current-crop",
        ),
        strict["equal"](v20?.["localPath"], ""),
        strict["equal"](v20?.["width"], 288),
        strict["equal"](v20?.["height"], 823),
        strict["equal"](v20?.["originalWidth"], 280),
        strict["equal"](v20?.["originalHeight"], 800),
        strict["equal"](v20?.["sourceLocalPath"], null),
        strict["equal"](v20?.["sourceUrl"], ""),
        strict["equal"](v20?.["sourceWidth"], null),
        strict["equal"](v20?.["sourceHeight"], null),
        strict["equal"](v20?.["storyboardSourceCrop"], false),
        strict["equal"](v20?.["storyboardExtractedCell"], true),
        strict["equal"](v20?.["storyboardSourceIndex"], 0),
        strict["equal"](v20?.["storyboardSourceNodeId"], "sb-1"),
        strict["equal"](
          v20?.["storyboardSourceLocalPath"],
          "output/source.jpg",
        ),
        strict["equal"](v20?.["storyboardSourceUrl"], ""),
        strict["deepEqual"](v21, ["source-image-generated"]),
        strict["equal"](v22?.["nodeId"], "sb-1"),
        strict["equal"](v22?.["patch"]?.["cells"]?.[0]?.["isEmpty"], true),
        strict["equal"](
          v22?.["patch"]?.["cells"]?.[0]?.["sourceLocalPath"],
          null,
        ),
        strict["equal"](v22?.["patch"]?.["cells"]?.[0]?.["sourceUrl"], ""),
        (v20 = null),
        (v23 = null),
        (globalThis["document"]["getElementById"] = () => null));
      const v41 = v38["finishDraggingCell"](
        {
          targetNodeId: "sb-1",
          sourceCellIndex: 0,
          draggedCellData: v19["nodes"]["sb-1"]["cells"][0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        520,
        520,
      );
      (strict["deepEqual"](v41, { didAct: true, committed: true }),
        strict["deepEqual"](
          v23?.["slice"](1),
          [0, 0, 280, 800, 0, 0, 280, 800],
        ),
        strict["equal"](v20?.["src"], "data:image/jpeg;base64,current-crop"),
        strict["equal"](
          v20?.["capturePreviewUrl"],
          "data:image/jpeg;base64,current-crop",
        ),
        strict["equal"](v20?.["localPath"], ""),
        strict["equal"](v20?.["storyboardExtractedCell"], true),
        strict["equal"](v20?.["storyboardSourceIndex"], 0),
        strict["equal"](v20?.["storyboardSourceNodeId"], "sb-1"));
    } finally {
      (v17 === undefined
        ? delete globalThis["document"]
        : (globalThis["document"] = v17),
        v18 === undefined
          ? delete globalThis["window"]
          : (globalThis["window"] = v18));
    }
  }),
  test("DragController: 已锁定宫格源图未就绪时拖出会回退到当前预览", () => {
    const v42 = globalThis["document"],
      v43 = globalThis["window"],
      v44 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            storyboardSourceLocalPath: "output/full-source.jpg",
            cells: [
              { id: "cell-empty", isEmpty: true, url: "" },
              {
                id: "cell-locked",
                capturePreviewUrl: "data:image/jpeg;base64,locked-current",
                storyboardPiece: true,
                storyboardLockedCell: true,
                storyboardSourceIndex: 0,
                isEmpty: false,
              },
            ],
          },
        },
      };
    let v45 = null,
      v46 = null,
      v47 = null;
    try {
      (delete globalThis["document"], delete globalThis["window"]);
      const v48 = {
          getStateRaw() {
            return v44;
          },
          batch(v49) {
            v49();
          },
          addNode(v50) {
            v45 = v50;
          },
          setSelectedNodes(v51) {
            v47 = v51;
          },
          updateNodeData(v52, v53) {
            v46 = { nodeId: v52, patch: v53 };
          },
        },
        v54 = createDragController({
          store: v48,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v55) {
            return v55 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v56 = v54["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 1,
            draggedCellData: v44["nodes"]["sb-1"]["cells"][1],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          500,
          500,
        );
      (strict["deepEqual"](v56, { didAct: true, committed: true }),
        strict["equal"](v45?.["src"], "data:image/jpeg;base64,locked-current"),
        strict["equal"](
          v45?.["capturePreviewUrl"],
          "data:image/jpeg;base64,locked-current",
        ),
        strict["equal"](v45?.["localPath"], ""),
        strict["equal"](v45?.["storyboardExtractedCell"], true),
        strict["equal"](v45?.["storyboardSourceIndex"], 0),
        strict["equal"](v45?.["storyboardSourceNodeId"], "sb-1"),
        strict["equal"](
          v45?.["storyboardSourceLocalPath"],
          "output/full-source.jpg",
        ),
        strict["deepEqual"](v47, ["source-image-generated"]),
        strict["equal"](v46?.["nodeId"], "sb-1"),
        strict["equal"](v46?.["patch"]?.["cells"]?.[1]?.["isEmpty"], true));
    } finally {
      if (v42 === undefined) delete globalThis["document"];
      else globalThis["document"] = v42;
      if (v43 === undefined) delete globalThis["window"];
      else globalThis["window"] = v43;
    }
  }),
  test("DragController: 宫格内交换后再拖出仍使用交换后的格子预览", () => {
    const v57 = globalThis["document"],
      v58 = globalThis["window"],
      v59 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            storyboardSourceLocalPath: "output/full-source.jpg",
            cells: [
              {
                id: "cell-a",
                capturePreviewUrl: "data:image/jpeg;base64,cell-a",
                storyboardPiece: true,
                storyboardLockedCell: true,
                storyboardSourceIndex: 0,
                isEmpty: false,
              },
              { id: "cell-empty", isEmpty: true, url: "" },
            ],
          },
        },
      },
      v60 = [],
      v61 = [];
    try {
      (delete globalThis["document"],
        (globalThis["window"] = {
          v2Renderer: {
            nodeInstances: new Map([
              [
                "sb-1",
                {
                  applyImmediateCellSwap() {
                    return { ok: false, revert() {} };
                  },
                  highlightCell() {},
                },
              ],
            ]),
            flushNodes() {
              return true;
            },
          },
        }));
      const v62 = {
          getStateRaw() {
            return v59;
          },
          updateNodeData(v63, v64) {
            (v61["push"]({ nodeId: v63, patch: v64 }),
              (v59["nodes"][v63] = { ...v59["nodes"][v63], ...v64 }));
          },
          batch(v65) {
            v65();
          },
          addNode(v66) {
            v60["push"](v66);
          },
          setSelectedNodes() {},
        },
        v67 = createDragController({
          store: v62,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v68) {
            return v68 + "-generated-" + v60["length"];
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v69 = v67["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v59["nodes"]["sb-1"]["cells"][0],
            ghostEl: { remove() {} },
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          50,
        );
      (strict["deepEqual"](v69, { didAct: true, committed: true }),
        strict["equal"](v59["nodes"]["sb-1"]["cells"][1]["id"], "cell-a"),
        strict["equal"](
          v59["nodes"]["sb-1"]["cells"][1]["capturePreviewUrl"],
          "data:image/jpeg;base64,cell-a",
        ));
      const v70 = v67["finishDraggingCell"](
        {
          targetNodeId: "sb-1",
          sourceCellIndex: 1,
          draggedCellData: v59["nodes"]["sb-1"]["cells"][1],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        500,
        500,
      );
      (strict["deepEqual"](v70, { didAct: true, committed: true }),
        strict["equal"](v60["length"], 1),
        strict["equal"](v60[0]["src"], "data:image/jpeg;base64,cell-a"),
        strict["equal"](
          v60[0]["capturePreviewUrl"],
          "data:image/jpeg;base64,cell-a",
        ),
        strict["equal"](v59["nodes"]["sb-1"]["cells"][1]["isEmpty"], true),
        strict["equal"](v61["length"], 2));
    } finally {
      if (v57 === undefined) delete globalThis["document"];
      else globalThis["document"] = v57;
      if (v58 === undefined) delete globalThis["window"];
      else globalThis["window"] = v58;
    }
  }),
  test("DragController:\x20拖出分镜时\x20ghost\x20预览按真实宫格区域裁切", () => {
    const v71 = globalThis["document"],
      v72 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            gridGap: 20,
            isEditing: true,
            gridLayout: { columns: [1.5, 0.5], rows: [1] },
            cells: [
              {
                id: "cell-1",
                sourceLocalPath: "output/source.jpg",
                sourceUrl: "/output/source.jpg",
                isEmpty: false,
              },
              { id: "cell-2", isEmpty: true },
            ],
          },
        },
      };
    let v73 = null,
      v74 = null;
    const v75 = {
        complete: true,
        naturalWidth: 400,
        naturalHeight: 800,
        currentSrc: "/output/source.jpg",
        src: "/output/source.jpg",
        classList: {
          contains(v76) {
            return v76 === "storyboard-cell-img--source-crop";
          },
        },
        getAttribute(v77) {
          return v77 === "src" ? "/output/source.jpg" : "";
        },
        cloneNode() {
          throw new Error(
            "ghost should use real crop instead of cloning preview img",
          );
        },
      },
      v78 = {
        width: 0,
        height: 0,
        style: {},
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: "",
            drawImage(...v79) {
              v74 = v79;
            },
          };
        },
        toDataURL() {
          return "data:image/jpeg;base64,ghost-crop";
        },
      },
      v80 = (v81) => {
        if (v81 === "canvas") return v78;
        return {
          tagName: String(v81)["toUpperCase"](),
          className: "",
          style: {},
          children: [],
          attrs: {},
          classList: {
            add() {},
            remove() {},
            contains() {
              return false;
            },
          },
          setAttribute(v82, v83) {
            this["attrs"][v82] = v83;
            if (v82 === "src") this["src"] = v83;
          },
          getAttribute(v84) {
            return this["attrs"][v84] || "";
          },
          appendChild(v85) {
            return (this["children"]["push"](v85), v85);
          },
          remove() {},
        };
      };
    try {
      globalThis["document"] = {
        body: {
          appendChild(v86) {
            return ((v73 = v86), v86);
          },
          classList: { add() {}, remove() {} },
        },
        getElementById(v87) {
          return (
            strict["equal"](v87, "cell-sb-1-0"),
            {
              querySelector(v88) {
                return (
                  strict["equal"](
                    [
                      ".storyboard-cell-img",
                      "img.storyboard-cell-img--source-crop",
                    ]["includes"](v88),
                    true,
                  ),
                  v75
                );
              },
            }
          );
        },
        createElement: v80,
      };
      const v89 = createDragController({
          store: {
            getStateRaw() {
              return v72;
            },
          },
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return "sb-1";
          },
          screenToWorld: identityScreenToWorld,
          generateId(v90) {
            return v90 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v91 = { classList: { add() {}, remove() {} } },
        v92 = {},
        v93 = v89["tryStartNodeDrag"](v92, 50, 50, 50, 50, false, {
          target: {
            closest(v94) {
              return v94 === ".sb-cell" ? v91 : null;
            },
          },
        });
      (strict["equal"](v93, true),
        strict["equal"](v92["ghostEl"], v73),
        strict["equal"](v73["style"]["width"], "288px"),
        strict["equal"](v73["style"]["height"], "823px"),
        strict["equal"](
          v73["style"]["transform"],
          "translate(50px, 50px) translate(-50%, -50%)",
        ),
        strict["deepEqual"](
          v74?.["slice"](1),
          [0, 0, 280, 800, 0, 0, 280, 800],
        ),
        strict["equal"](v78["width"], 280),
        strict["equal"](v78["height"], 800),
        strict["equal"](
          v73["children"][0]["attrs"]["src"],
          "data:image/jpeg;base64,ghost-crop",
        ),
        strict["equal"](v73["children"][0]["style"]["objectFit"], "contain"));
    } finally {
      v71 === undefined
        ? delete globalThis["document"]
        : (globalThis["document"] = v71);
    }
  }),
  test("DragController: 提取图片放回宫格使用已裁好的图，不再保留源图裁切上下文", () => {
    const v95 = globalThis["document"],
      v96 = globalThis["window"],
      v97 = globalThis["requestAnimationFrame"],
      v98 = globalThis["setTimeout"],
      v99 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ["n1"],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: "n1",
            type: "source-image",
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            src: "/output/extracted.jpg",
            localPath: "output/extracted.jpg",
            sourceLocalPath: "output/full-source.jpg",
            sourceUrl: "/output/full-source.jpg",
            sourceWidth: 400,
            sourceHeight: 800,
            storyboardSourceCrop: true,
            storyboardExtractedCell: true,
          },
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 100,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            isEditing: true,
            cells: [
              {
                id: "cell-empty",
                isEmpty: true,
                url: "",
                residualImageLocalPath: "output/full-source.jpg",
                residualImageUrl: "/output/full-source.jpg",
                residualImageWidth: 400,
                residualImageHeight: 800,
                residualImageMode: "source",
              },
              { id: "cell-right", isEmpty: true, url: "" },
            ],
          },
        },
      },
      v100 = [];
    let v101 = null,
      v102 = null,
      v103 = null,
      v104 = 0;
    function v105(v106) {
      const v107 = {
        tagName: String(v106)["toUpperCase"](),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        naturalHeight: 100,
        className: "",
        appendChild(v108) {
          return (this["children"]["push"](v108), v108);
        },
        setAttribute(v109, v110) {
          this[v109] = String(v110);
        },
        getAttribute(v111) {
          return this[v111] || "";
        },
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: "",
            drawImage() {},
          };
        },
        remove() {},
      };
      return (v100["push"](v107), v107);
    }
    try {
      ((globalThis["window"] = globalThis),
        (globalThis["v2Renderer"] = {
          getMountedWrapper(v112) {
            if (v112 !== "n1") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: "/output/extracted.jpg",
                  src: "/output/extracted.jpg",
                };
              },
            };
          },
        }),
        (globalThis["document"] = {
          body: {
            classList: createClassList(),
            appendChild(v113) {
              return (v100["push"](v113), v113);
            },
          },
          createElement: v105,
          getElementById(v114) {
            if (v114 !== "cell-sb-1-0") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 400,
                  getAttribute(v115) {
                    return v115 === "src" ? "/output/extracted.jpg" : "";
                  },
                };
              },
            };
          },
        }),
        (globalThis["requestAnimationFrame"] = (v116) => {
          return (v116(), 1);
        }),
        (globalThis["setTimeout"] = (v117) => {
          return (v117(), 1);
        }));
      const v118 = {
          getStateRaw() {
            return v99;
          },
          updateNodeData(v119, v120) {
            ((v101 = { nodeId: v119, patch: v120 }),
              (v99["nodes"][v119] = { ...v99["nodes"][v119], ...v120 }));
          },
          setSelectedNodes(v121) {
            ((v102 = v121), (v99["selectedNodeIds"] = [...v121]));
          },
          deleteNodes(v122) {
            v103 = v122;
          },
          moveNodes() {},
          batch(v123) {
            v123();
          },
          groupNodes() {},
        },
        v124 = createDragController({
          store: v118,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v125) {
            return v125 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            v104 += 1;
          },
        }),
        v126 = v124["finishDraggingNodes"](createNodeDragContext(), 125, 50);
      (strict["deepEqual"](v126, { earlyCommit: true, didAct: true }),
        strict["equal"](v101?.["nodeId"], "sb-1"),
        strict["deepEqual"](v101?.["patch"]?.["cells"]?.[0], {
          id: "cell-generated",
          url: "",
          localPath: "output/extracted.jpg",
          originalLocalPath: null,
          displayLocalPath: "",
          thumbUrl: "",
          thumbLocalPath: null,
          thumbId: null,
          capturePreviewUrl: "",
          fileName: "",
          originalWidth: null,
          originalHeight: null,
          imageWidth: null,
          imageHeight: null,
          w: null,
          h: null,
          sourceId: null,
          storyboardExtractedCell: true,
          storyboardLockedCell: false,
          storyboardPiece: false,
          storyboardSourceIndex: 0,
          residualImageLocalPath: "output/full-source.jpg",
          residualImageUrl: "/output/full-source.jpg",
          residualImageWidth: 400,
          residualImageHeight: 800,
          residualImageMode: "source",
          sourceLocalPath: null,
          sourceUrl: "",
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          isEmpty: false,
          col: 0,
          row: 0,
        }),
        strict["deepEqual"](v102, []),
        strict["deepEqual"](v103, ["n1"]),
        strict["equal"](v104, 1));
    } finally {
      if (v95 === undefined) delete globalThis["document"];
      else globalThis["document"] = v95;
      if (v96 === undefined) delete globalThis["window"];
      else globalThis["window"] = v96;
      if (v97 === undefined) delete globalThis["requestAnimationFrame"];
      else globalThis["requestAnimationFrame"] = v97;
      if (v98 === undefined) delete globalThis["setTimeout"];
      else globalThis["setTimeout"] = v98;
      delete globalThis["v2Renderer"];
    }
  }),
  test("DragController: source-only image drop into storyboard does not write source fallback", () => {
    const v127 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: ["n1"],
      edges: {},
      ui: { snapGuidesEnabled: false },
      _parentToChildren: {},
      nodes: {
        n1: {
          id: "n1",
          type: "source-image",
          x: 0,
          y: 0,
          width: 120,
          height: 240,
          src: "",
          localPath: null,
          sourceLocalPath: "output/full-source.jpg",
          sourceUrl: "/output/full-source.jpg",
          storyboardSourceCrop: true,
          storyboardExtractedCell: true,
        },
        "sb-1": {
          id: "sb-1",
          type: "storyboard",
          x: 100,
          y: 0,
          width: 100,
          height: 100,
          cols: 1,
          rows: 1,
          isEditing: true,
          cells: [{ id: "cell-empty", isEmpty: true, url: "" }],
        },
      },
    };
    let v128 = false,
      v129 = false,
      v130 = false,
      v131 = false;
    const v132 = {
        getStateRaw() {
          return v127;
        },
        updateNodeData() {
          v128 = true;
        },
        setSelectedNodes() {
          v130 = true;
        },
        deleteNodes() {
          v129 = true;
        },
        moveNodes() {},
        batch(v133) {
          v133();
        },
        groupNodes() {},
      },
      v134 = createDragController({
        store: v132,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(v135) {
          return v135 + "-generated";
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {
          v131 = true;
        },
      }),
      v136 = v134["finishDraggingNodes"](createNodeDragContext(), 125, 50);
    (strict["deepEqual"](v136, { earlyCommit: false, didAct: false }),
      strict["equal"](v128, false),
      strict["equal"](v129, false),
      strict["equal"](v130, false),
      strict["equal"](v131, false));
  }),
  test("DragController:\x20放入宫格时使用拖拽节点当前可见图，不用源图兜底", () => {
    const v137 = globalThis["document"],
      v138 = globalThis["window"],
      v139 = globalThis["requestAnimationFrame"],
      v140 = globalThis["setTimeout"],
      v141 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ["n1"],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: "n1",
            type: "source-image",
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            src: "",
            localPath: null,
            sourceLocalPath: "output/full-source.jpg",
            sourceUrl: "/output/full-source.jpg",
            sourceWidth: 400,
            sourceHeight: 800,
            storyboardSourceCrop: true,
            storyboardExtractedCell: true,
            storyboardSourceIndex: 2,
            storyboardSourceNodeId: "sb-old",
            storyboardSourceLocalPath: "output/full-source.jpg",
            storyboardSourceUrl: "",
          },
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 100,
            y: 0,
            width: 100,
            height: 100,
            cols: 1,
            rows: 1,
            isEditing: true,
            cells: [{ id: "cell-empty", isEmpty: true, url: "" }],
          },
        },
      };
    let v142 = null,
      v143 = null,
      v144 = null,
      v145 = 0;
    function v146(v147) {
      const v148 = {
        tagName: String(v147)["toUpperCase"](),
        style: {},
        children: [],
        className: "",
        appendChild(v149) {
          return (this["children"]["push"](v149), v149);
        },
        setAttribute(v150, v151) {
          this[v150] = String(v151);
        },
        getAttribute(v152) {
          return this[v152] || "";
        },
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: "",
            drawImage() {},
          };
        },
        remove() {},
      };
      return v148;
    }
    try {
      ((globalThis["window"] = globalThis),
        (globalThis["v2Renderer"] = {
          getMountedWrapper(v153) {
            if (v153 !== "n1") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: "/output/current-visible.jpg",
                  src: "/output/current-visible.jpg",
                };
              },
            };
          },
        }),
        (globalThis["document"] = {
          body: {
            classList: createClassList(),
            appendChild(v154) {
              return v154;
            },
          },
          createElement: v146,
          getElementById(v155) {
            if (v155 !== "cell-sb-1-0") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  getAttribute(v156) {
                    return v156 === "src" ? "/output/current-visible.jpg" : "";
                  },
                };
              },
            };
          },
        }),
        (globalThis["requestAnimationFrame"] = (v157) => {
          return (v157(), 1);
        }),
        (globalThis["setTimeout"] = (v158) => {
          return (v158(), 1);
        }));
      const v159 = {
          getStateRaw() {
            return v141;
          },
          updateNodeData(v160, v161) {
            ((v142 = { nodeId: v160, patch: v161 }),
              (v141["nodes"][v160] = { ...v141["nodes"][v160], ...v161 }));
          },
          setSelectedNodes(v162) {
            ((v143 = v162), (v141["selectedNodeIds"] = [...v162]));
          },
          deleteNodes(v163) {
            v144 = v163;
          },
          moveNodes() {},
          batch(v164) {
            v164();
          },
          groupNodes() {},
        },
        v165 = createDragController({
          store: v159,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v166) {
            return v166 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            v145 += 1;
          },
        }),
        v167 = v165["finishDraggingNodes"](createNodeDragContext(), 125, 50);
      strict["deepEqual"](v167, { earlyCommit: true, didAct: true });
      const v168 = v142?.["patch"]?.["cells"]?.[0];
      (strict["equal"](v142?.["nodeId"], "sb-1"),
        strict["equal"](v168?.["localPath"], "output/current-visible.jpg"),
        strict["equal"](v168?.["sourceLocalPath"], null),
        strict["equal"](v168?.["sourceUrl"], ""),
        strict["equal"](v168?.["storyboardSourceCrop"], false),
        strict["equal"](v168?.["storyboardPiece"], false),
        strict["equal"](v168?.["storyboardSourceIndex"], 2),
        strict["equal"](v168?.["storyboardExtractedCell"], true),
        strict["deepEqual"](v143, []),
        strict["deepEqual"](v144, ["n1"]),
        strict["equal"](v145, 1));
    } finally {
      if (v137 === undefined) delete globalThis["document"];
      else globalThis["document"] = v137;
      if (v138 === undefined) delete globalThis["window"];
      else globalThis["window"] = v138;
      if (v139 === undefined) delete globalThis["requestAnimationFrame"];
      else globalThis["requestAnimationFrame"] = v139;
      if (v140 === undefined) delete globalThis["setTimeout"];
      else globalThis["setTimeout"] = v140;
      delete globalThis["v2Renderer"];
    }
  }),
  test("DragController:\x20临时预览格拖出会落盘回填图片节点", async () => {
    const v169 = "data:image/png,storyboard-preview",
      v170 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: [],
        edges: {},
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            cols: 1,
            rows: 1,
            cells: [
              {
                id: "cell-preview",
                capturePreviewUrl: v169,
                imageWidth: 80,
                imageHeight: 40,
                isEmpty: false,
              },
            ],
          },
        },
      },
      v171 = [];
    let v172 = null,
      v173 = 0;
    const v174 = {
        getStateRaw() {
          return v170;
        },
        batch(v175) {
          v175();
        },
        addNode(v176) {
          ((v172 = v176), (v170["nodes"][v176["id"]] = v176));
        },
        setSelectedNodes(v177) {
          v170["selectedNodeIds"] = v177;
        },
        updateNodeData(v178, v179) {
          (v171["push"]({ nodeId: v178, patch: v179 }),
            (v170["nodes"][v178] = { ...v170["nodes"][v178], ...v179 }));
        },
      },
      v180 = createDragController({
        store: v174,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(v181) {
          return v181 + "-generated";
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
        async saveOutputBlobImpl() {
          return (
            (v173 += 1),
            {
              localPath: "output/persisted-preview.png",
              url: "/output/persisted-preview.png",
              originalWidth: 80,
              originalHeight: 40,
              filename: "persisted-preview.png",
            }
          );
        },
      }),
      v182 = v180["finishDraggingCell"](
        {
          targetNodeId: "sb-1",
          sourceCellIndex: 0,
          draggedCellData: v170["nodes"]["sb-1"]["cells"][0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        300,
        50,
      );
    (await flushAsyncWork(),
      strict["deepEqual"](v182, { didAct: true, committed: true }),
      strict["equal"](v172?.["id"], "source-image-generated"),
      strict["equal"](v172?.["capturePreviewUrl"], v169),
      strict["equal"](v173, 1),
      strict["equal"](
        v170["nodes"]["source-image-generated"]["src"],
        "/output/persisted-preview.png",
      ),
      strict["equal"](
        v170["nodes"]["source-image-generated"]["localPath"],
        "output/persisted-preview.png",
      ),
      strict["equal"](
        v170["nodes"]["source-image-generated"]["capturePreviewUrl"],
        "",
      ),
      strict["equal"](
        v170["nodes"]["source-image-generated"]["imageWidth"],
        80,
      ),
      strict["equal"](v170["nodes"]["sb-1"]["cells"][0]["isEmpty"], true),
      strict["equal"](
        v171["some"]((v183) => v183["nodeId"] === "source-image-generated"),
        true,
      ));
  }),
  test("DragController: 临时预览图放回宫格会落盘回填 cell", async () => {
    const v184 = globalThis["document"],
      v185 = globalThis["window"],
      v186 = globalThis["requestAnimationFrame"],
      v187 = globalThis["setTimeout"],
      v188 = "data:image/png,returned-preview",
      v189 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ["n1"],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: "n1",
            type: "source-image",
            x: 0,
            y: 0,
            width: 120,
            height: 60,
            src: "",
            localPath: null,
            capturePreviewUrl: v188,
            imageWidth: 80,
            imageHeight: 40,
            storyboardExtractedCell: true,
          },
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 100,
            y: 0,
            width: 100,
            height: 100,
            cols: 1,
            rows: 1,
            isEditing: true,
            cells: [{ id: "cell-empty", isEmpty: true, url: "" }],
          },
        },
      };
    let v190 = 0;
    function v191(v192) {
      return {
        tagName: String(v192)["toUpperCase"](),
        style: {},
        children: [],
        className: "",
        appendChild(v193) {
          return (this["children"]["push"](v193), v193);
        },
        setAttribute(v194, v195) {
          this[v194] = String(v195);
        },
        getAttribute(v196) {
          return this[v196] || "";
        },
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: "",
            drawImage() {},
          };
        },
        remove() {},
      };
    }
    try {
      ((globalThis["window"] = globalThis),
        (globalThis["v2Renderer"] = {
          getMountedWrapper(v197) {
            if (v197 !== "n1") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 80,
                  naturalHeight: 40,
                  currentSrc: v188,
                  src: v188,
                };
              },
            };
          },
        }),
        (globalThis["document"] = {
          body: {
            classList: createClassList(),
            appendChild(v198) {
              return v198;
            },
          },
          createElement: v191,
          getElementById(v199) {
            if (v199 !== "cell-sb-1-0") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 80,
                  getAttribute(v200) {
                    return v200 === "src" ? v188 : "";
                  },
                };
              },
            };
          },
        }),
        (globalThis["requestAnimationFrame"] = (v201) => {
          return (v201(), 1);
        }),
        (globalThis["setTimeout"] = (v202) => {
          return (v202(), 1);
        }));
      const v203 = {
          getStateRaw() {
            return v189;
          },
          updateNodeData(v204, v205) {
            v189["nodes"][v204] = { ...v189["nodes"][v204], ...v205 };
          },
          setSelectedNodes(v206) {
            v189["selectedNodeIds"] = [...v206];
          },
          deleteNodes(v207) {
            for (const v208 of v207) delete v189["nodes"][v208];
          },
          moveNodes() {},
          batch(v209) {
            v209();
          },
          groupNodes() {},
        },
        v210 = createDragController({
          store: v203,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v211) {
            return v211 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
          async saveOutputBlobImpl() {
            return (
              (v190 += 1),
              {
                localPath: "output/returned-preview.png",
                url: "/output/returned-preview.png",
                originalWidth: 80,
                originalHeight: 40,
                filename: "returned-preview.png",
              }
            );
          },
        }),
        v212 = v210["finishDraggingNodes"](createNodeDragContext(), 125, 50);
      (await flushAsyncWork(),
        strict["deepEqual"](v212, { earlyCommit: true, didAct: true }),
        strict["equal"](v190, 1));
      const v213 = v189["nodes"]["sb-1"]["cells"][0];
      (strict["equal"](v213["localPath"], "output/returned-preview.png"),
        strict["equal"](v213["capturePreviewUrl"], ""),
        strict["equal"](v213["sourceLocalPath"], null),
        strict["equal"](v213["sourceUrl"], ""),
        strict["equal"](v213["storyboardSourceCrop"], false),
        strict["equal"](v213["storyboardPiece"], false),
        strict["equal"](v213["imageWidth"], 80));
    } finally {
      if (v184 === undefined) delete globalThis["document"];
      else globalThis["document"] = v184;
      if (v185 === undefined) delete globalThis["window"];
      else globalThis["window"] = v185;
      if (v186 === undefined) delete globalThis["requestAnimationFrame"];
      else globalThis["requestAnimationFrame"] = v186;
      if (v187 === undefined) delete globalThis["setTimeout"];
      else globalThis["setTimeout"] = v187;
      delete globalThis["v2Renderer"];
    }
  }),
  test("DragController: 提取图片放回自定义槽位使用当前线位命中", () => {
    const v214 = globalThis["document"],
      v215 = globalThis["window"],
      v216 = globalThis["requestAnimationFrame"],
      v217 = globalThis["setTimeout"],
      v218 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ["n1"],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: "n1",
            type: "source-image",
            x: 0,
            y: 0,
            width: 65,
            height: 140,
            src: "/output/extracted-custom.jpg",
            localPath: "output/extracted-custom.jpg",
            sourceLocalPath: "output/full-source.jpg",
            sourceUrl: "/output/full-source.jpg",
            sourceWidth: 300,
            sourceHeight: 200,
            storyboardSourceCrop: true,
            storyboardExtractedCell: true,
          },
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 100,
            y: 0,
            width: 300,
            height: 200,
            cols: 2,
            rows: 2,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
            isEditing: true,
            cells: [
              { id: "cell-0", localPath: "output/a.png", isEmpty: false },
              { id: "cell-1", localPath: "output/b.png", isEmpty: false },
              { id: "cell-2", localPath: "output/c.png", isEmpty: false },
              {
                id: "cell-empty",
                isEmpty: true,
                url: "",
                residualImageLocalPath: "output/full-source.jpg",
                residualImageUrl: "/output/full-source.jpg",
                residualImageWidth: 300,
                residualImageHeight: 200,
                residualImageMode: "source",
              },
            ],
          },
        },
      },
      v219 = [];
    let v220 = null,
      v221 = null,
      v222 = null,
      v223 = 0;
    function v224(v225) {
      const v226 = {
        tagName: String(v225)["toUpperCase"](),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        className: "",
        appendChild(v227) {
          return (this["children"]["push"](v227), v227);
        },
        setAttribute(v228, v229) {
          this[v228] = String(v229);
        },
        getAttribute(v230) {
          return this[v230] || "";
        },
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: "",
            drawImage() {},
          };
        },
        remove() {},
      };
      return (v219["push"](v226), v226);
    }
    try {
      ((globalThis["window"] = globalThis),
        (globalThis["v2Renderer"] = {
          getMountedWrapper(v231) {
            if (v231 !== "n1") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 65,
                  naturalHeight: 140,
                  currentSrc: "/output/extracted-custom.jpg",
                  src: "/output/extracted-custom.jpg",
                };
              },
            };
          },
        }),
        (globalThis["document"] = {
          body: {
            classList: createClassList(),
            appendChild(v232) {
              return (v219["push"](v232), v232);
            },
          },
          createElement: v224,
          getElementById(v233) {
            if (v233 !== "cell-sb-1-3") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 65,
                  getAttribute(v234) {
                    return v234 === "src" ? "/output/extracted-custom.jpg" : "";
                  },
                };
              },
            };
          },
        }),
        (globalThis["requestAnimationFrame"] = (v235) => {
          return (v235(), 1);
        }),
        (globalThis["setTimeout"] = (v236) => {
          return (v236(), 1);
        }));
      const v237 = {
          getStateRaw() {
            return v218;
          },
          updateNodeData(v238, v239) {
            ((v220 = { nodeId: v238, patch: v239 }),
              (v218["nodes"][v238] = { ...v218["nodes"][v238], ...v239 }));
          },
          setSelectedNodes(v240) {
            ((v221 = v240), (v218["selectedNodeIds"] = [...v240]));
          },
          deleteNodes(v241) {
            v222 = v241;
          },
          moveNodes() {},
          batch(v242) {
            v242();
          },
          groupNodes() {},
        },
        v243 = createDragController({
          store: v237,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v244) {
            return v244 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            v223 += 1;
          },
        }),
        v245 = v243["finishDraggingNodes"](createNodeDragContext(), 350, 80);
      (strict["deepEqual"](v245, { earlyCommit: true, didAct: true }),
        strict["equal"](v220?.["nodeId"], "sb-1"),
        strict["equal"](v220?.["patch"]?.["cells"]?.[1]?.["id"], "cell-1"),
        strict["deepEqual"](v220?.["patch"]?.["cells"]?.[3], {
          id: "cell-generated",
          url: "",
          localPath: "output/extracted-custom.jpg",
          originalLocalPath: null,
          displayLocalPath: "",
          thumbUrl: "",
          thumbLocalPath: null,
          thumbId: null,
          capturePreviewUrl: "",
          fileName: "",
          originalWidth: null,
          originalHeight: null,
          imageWidth: null,
          imageHeight: null,
          w: null,
          h: null,
          sourceId: null,
          storyboardExtractedCell: true,
          storyboardLockedCell: false,
          storyboardPiece: false,
          storyboardSourceIndex: 0,
          residualImageLocalPath: "output/full-source.jpg",
          residualImageUrl: "/output/full-source.jpg",
          residualImageWidth: 300,
          residualImageHeight: 200,
          residualImageMode: "source",
          sourceLocalPath: null,
          sourceUrl: "",
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          isEmpty: false,
          col: 1,
          row: 1,
        }),
        strict["deepEqual"](v221, []),
        strict["deepEqual"](v222, ["n1"]),
        strict["equal"](v223, 1));
    } finally {
      if (v214 === undefined) delete globalThis["document"];
      else globalThis["document"] = v214;
      if (v215 === undefined) delete globalThis["window"];
      else globalThis["window"] = v215;
      if (v216 === undefined) delete globalThis["requestAnimationFrame"];
      else globalThis["requestAnimationFrame"] = v216;
      if (v217 === undefined) delete globalThis["setTimeout"];
      else globalThis["setTimeout"] = v217;
      delete globalThis["v2Renderer"];
    }
  }),
  test("DragController:\x20临时裁切图未落盘时放回宫格保留当前裁切预览", () => {
    const v246 = globalThis["document"],
      v247 = globalThis["window"],
      v248 = globalThis["requestAnimationFrame"],
      v249 = globalThis["setTimeout"],
      v250 = "data:image/jpeg;base64/current-crop",
      v251 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ["n1"],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: "n1",
            type: "source-image",
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            src: v250,
            localPath: "",
            capturePreviewUrl: v250,
            sourceLocalPath: "output/full-source.jpg",
            sourceUrl: "/output/full-source.jpg",
            sourceWidth: 400,
            sourceHeight: 800,
            storyboardSourceCrop: true,
            storyboardExtractedCell: true,
          },
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 100,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            isEditing: true,
            cells: [
              { id: "cell-empty", isEmpty: true, url: "" },
              { id: "cell-right", isEmpty: true, url: "" },
            ],
          },
        },
      },
      v252 = [];
    let v253 = null,
      v254 = null;
    function v255(v256) {
      const v257 = {
        tagName: String(v256)["toUpperCase"](),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        className: "",
        appendChild(v258) {
          return (this["children"]["push"](v258), v258);
        },
        setAttribute(v259, v260) {
          this[v259] = String(v260);
        },
        getAttribute(v261) {
          return this[v261] || "";
        },
        getContext() {
          return {
            imageSmoothingEnabled: false,
            imageSmoothingQuality: "",
            drawImage() {},
          };
        },
        remove() {},
      };
      return (v252["push"](v257), v257);
    }
    try {
      ((globalThis["window"] = globalThis),
        (globalThis["v2Renderer"] = {
          getMountedWrapper(v262) {
            if (v262 !== "n1") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: v250,
                  src: v250,
                };
              },
            };
          },
        }),
        (globalThis["document"] = {
          body: {
            classList: createClassList(),
            appendChild(v263) {
              return (v252["push"](v263), v263);
            },
          },
          createElement: v255,
          getElementById(v264) {
            if (v264 !== "cell-sb-1-0") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  getAttribute(v265) {
                    return v265 === "src" ? v250 : "";
                  },
                };
              },
            };
          },
        }),
        (globalThis["requestAnimationFrame"] = (v266) => {
          return (v266(), 1);
        }),
        (globalThis["setTimeout"] = (v267) => {
          return (v267(), 1);
        }));
      const v268 = {
          getStateRaw() {
            return v251;
          },
          updateNodeData(v269, v270) {
            ((v253 = { nodeId: v269, patch: v270 }),
              (v251["nodes"][v269] = { ...v251["nodes"][v269], ...v270 }));
          },
          setSelectedNodes(v271) {
            v251["selectedNodeIds"] = [...v271];
          },
          deleteNodes(v272) {
            v254 = v272;
          },
          moveNodes() {},
          batch(v273) {
            v273();
          },
          groupNodes() {},
        },
        v274 = createDragController({
          store: v268,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v275) {
            return v275 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v276 = v274["finishDraggingNodes"](createNodeDragContext(), 125, 50);
      (strict["deepEqual"](v276, { earlyCommit: true, didAct: true }),
        strict["equal"](v253?.["nodeId"], "sb-1"),
        strict["deepEqual"](v253?.["patch"]?.["cells"]?.[0], {
          id: "cell-generated",
          url: "",
          localPath: null,
          originalLocalPath: null,
          displayLocalPath: "",
          capturePreviewUrl: v250,
          fileName: "",
          originalWidth: null,
          originalHeight: null,
          imageWidth: null,
          imageHeight: null,
          w: null,
          h: null,
          storyboardExtractedCell: true,
          storyboardLockedCell: false,
          storyboardPiece: false,
          storyboardSourceIndex: 0,
          thumbUrl: "",
          thumbLocalPath: null,
          thumbId: null,
          sourceId: null,
          sourceLocalPath: null,
          sourceUrl: "",
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          isEmpty: false,
          col: 0,
          row: 0,
        }),
        strict["deepEqual"](v254, ["n1"]));
    } finally {
      if (v246 === undefined) delete globalThis["document"];
      else globalThis["document"] = v246;
      if (v247 === undefined) delete globalThis["window"];
      else globalThis["window"] = v247;
      if (v248 === undefined) delete globalThis["requestAnimationFrame"];
      else globalThis["requestAnimationFrame"] = v248;
      if (v249 === undefined) delete globalThis["setTimeout"];
      else globalThis["setTimeout"] = v249;
      delete globalThis["v2Renderer"];
    }
  }));
function createClassList() {
  const v277 = new Set();
  return {
    add(...v278) {
      v278["forEach"]((v279) => v277["add"](String(v279)));
    },
    remove(...v280) {
      v280["forEach"]((v281) => v277["delete"](String(v281)));
    },
    toggle(v282, v283) {
      if (v283 === true) return (v277["add"](String(v282)), true);
      if (v283 === false) return (v277["delete"](String(v282)), false);
      if (v277["has"](String(v282)))
        return (v277["delete"](String(v282)), false);
      return (v277["add"](String(v282)), true);
    },
    contains(v284) {
      return v277["has"](String(v284));
    },
  };
}
function createPathRecorder(v285, v286, v287) {
  return {
    setAttribute(v288, v289) {
      v285["push"]({ id: v286, kind: v287, name: v288, value: v289 });
    },
  };
}
function createAttrRecorder() {
  const v290 = new Map();
  return {
    setAttribute(v291, v292) {
      v290["set"](v291, v292);
    },
    getAttribute(v293) {
      return v290["has"](v293) ? v290["get"](v293) : null;
    },
    removeAttribute(v294) {
      v290["delete"](v294);
    },
  };
}
test("DragController: 多选拖拽从全景、注释、宫格节点发起时保留整组选区", () => {
  const v295 = globalThis["window"],
    v296 = globalThis["document"],
    v297 = [
      { nodeId: "scene-1", type: "panorama-scene" },
      { nodeId: "pano-1", type: "panorama-360" },
      { nodeId: "comment-1", type: "comment-note" },
      { nodeId: "storyboard-1", type: "storyboard" },
    ];
  try {
    ((globalThis["document"] = {
      body: { classList: createClassList() },
      getElementById() {
        return null;
      },
    }),
      (globalThis["window"] = {
        v2Renderer: {
          getMountedWrapper() {
            return null;
          },
        },
        _clearSnapGuideLines() {},
      }));
    for (const v298 of v297) {
      const v299 = ["source-1", v298["nodeId"], "ai-1"],
        v300 = {
          viewport: { x: 0, y: 0, zoom: 1 },
          nodes: {
            "source-1": {
              id: "source-1",
              type: "source-image",
              x: 0,
              y: 0,
              width: 100,
              height: 100,
            },
            [v298["nodeId"]]: {
              id: v298["nodeId"],
              type: v298["type"],
              x: 200,
              y: 0,
              width: 120,
              height: 90,
            },
            "ai-1": {
              id: "ai-1",
              type: "ai-text",
              x: 400,
              y: 0,
              width: 100,
              height: 100,
            },
          },
          edges: {},
          selectedNodeIds: v299,
          ui: { snapGuidesEnabled: false },
          _parentToChildren: {},
        },
        v301 = [],
        v302 = [],
        v303 = {
          getStateRaw() {
            return v300;
          },
          setSelectedNodes(v304) {
            (v301["push"]([...v304]), (v300["selectedNodeIds"] = [...v304]));
          },
          moveNodes(v305, v306, v307) {
            v302["push"]({ ids: [...v305], dx: v306, dy: v307 });
          },
          updateNodePosition() {
            throw new Error("multi-selected drag should move the selected set");
          },
          batch(v308) {
            v308();
          },
          groupNodes() {},
        },
        v309 = createDragController({
          store: v303,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return v298["nodeId"];
          },
          screenToWorld: identityScreenToWorld,
          generateId(v310) {
            return v310 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v311 = {
          isDragging: false,
          pendingDx: 0,
          pendingDy: 0,
          hasMoved: false,
        };
      (strict["equal"](
        v309["tryStartNodeDrag"](v311, 200, 0, 200, 0, false, {}),
        true,
      ),
        strict["deepEqual"](v301, []),
        v309["updateDraggingNodes"](v311, 215, 12, 215, 12, 215, 12, v300));
      const v312 = v309["finishDraggingNodes"](v311, 215, 12);
      (strict["deepEqual"](v312, { earlyCommit: false, didAct: true }),
        strict["deepEqual"](v302, [{ ids: v299, dx: 15, dy: 12 }]),
        strict["deepEqual"](v300["selectedNodeIds"], v299));
    }
  } finally {
    if (typeof v295 === "undefined") delete globalThis["window"];
    else globalThis["window"] = v295;
    if (typeof v296 === "undefined") delete globalThis["document"];
    else globalThis["document"] = v296;
  }
});
function createDragEdgeState({
  zoom: zoom = 0.3,
  edgeCount: edgeCount = 6,
} = {}) {
  const v313 = {
      n1: { id: "n1", type: "ai-image", x: 0, y: 0, width: 260, height: 100 },
    },
    v314 = {};
  for (let v315 = 1; v315 <= edgeCount; v315 += 1) {
    const v316 = "n" + (v315 + 1);
    ((v313[v316] = {
      id: v316,
      type: "ai-text",
      x: 500 + v315 * 20,
      y: v315 * 120,
      width: 260,
      height: 100,
    }),
      (v314["e" + v315] = { id: "e" + v315, sourceId: "n1", targetId: v316 }));
  }
  return {
    viewport: { x: 0, y: 0, zoom: zoom },
    nodes: v313,
    edges: v314,
    selectedNodeIds: ["n1"],
    ui: { snapGuidesEnabled: false },
    _parentToChildren: {},
  };
}
function createDragEdgeHarness(v317) {
  const v318 = globalThis["window"],
    v319 = globalThis["document"],
    v320 = globalThis["requestAnimationFrame"],
    v321 = globalThis["cancelAnimationFrame"],
    v322 = globalThis["innerWidth"],
    v323 = globalThis["innerHeight"],
    v324 = [],
    v325 = new Map();
  Object["keys"](v317["nodes"])["forEach"]((v326) => {
    v325["set"](v326, {
      style: {},
      classList: createClassList(),
      isConnected: true,
    });
  });
  const v327 = new Map();
  Object["keys"](v317["edges"])["forEach"]((v328) => {
    v327["set"](v328, {
      groupEl: createAttrRecorder(),
      hoverPath: createPathRecorder(v324, v328, "hover"),
      pathEl: createPathRecorder(v324, v328, "main"),
    });
  });
  const v329 = [];
  let v330 = 0;
  return (
    (globalThis["window"] = globalThis),
    (globalThis["innerWidth"] = 1600),
    (globalThis["innerHeight"] = 1200),
    (globalThis["document"] = {
      body: { classList: createClassList() },
      getElementById() {
        return null;
      },
    }),
    (globalThis["requestAnimationFrame"] = (v331) => {
      return (
        (v330 += 1),
        v329["push"]({ id: v330, callback: v331, canceled: false }),
        v330
      );
    }),
    (globalThis["cancelAnimationFrame"] = (v332) => {
      const v333 = v329["find"]((v334) => v334["id"] === v332);
      if (v333) v333["canceled"] = true;
    }),
    (globalThis["v2Renderer"] = {
      getMountedWrapper(v335) {
        return v325["get"](v335) || null;
      },
      getEdgeIdsForNode(v336) {
        return Object["values"](v317["edges"])
          ["filter"](
            (v337) => v337["sourceId"] === v336 || v337["targetId"] === v336,
          )
          ["map"]((v338) => v338["id"]);
      },
    }),
    (globalThis["_edgeDomCache"] = v327),
    (globalThis["_v2MinimapDotMap"] = new Map()),
    (globalThis["_v2MinimapScale"] = 0),
    (globalThis["_clearSnapGuideLines"] = () => {}),
    {
      records: v324,
      wrappers: v325,
      edgeDomCache: v327,
      pendingRafCount() {
        return v329["filter"]((v339) => !v339["canceled"])["length"];
      },
      runRaf() {
        const v340 = v329["splice"](0);
        v340["forEach"]((v341) => {
          if (!v341["canceled"]) v341["callback"]();
        });
      },
      restore() {
        if (typeof v318 === "undefined") delete globalThis["window"];
        else globalThis["window"] = v318;
        if (typeof v319 === "undefined") delete globalThis["document"];
        else globalThis["document"] = v319;
        typeof v320 === "undefined"
          ? delete globalThis["requestAnimationFrame"]
          : (globalThis["requestAnimationFrame"] = v320);
        typeof v321 === "undefined"
          ? delete globalThis["cancelAnimationFrame"]
          : (globalThis["cancelAnimationFrame"] = v321);
        if (typeof v322 === "undefined") delete globalThis["innerWidth"];
        else globalThis["innerWidth"] = v322;
        if (typeof v323 === "undefined") delete globalThis["innerHeight"];
        else globalThis["innerHeight"] = v323;
        (delete globalThis["v2Renderer"],
          delete globalThis["_edgeDomCache"],
          delete globalThis["_v2MinimapDotMap"],
          delete globalThis["_v2MinimapScale"],
          delete globalThis["_clearSnapGuideLines"]);
      },
    }
  );
}
function createNodeDragController(v342) {
  const v343 = {
    getStateRaw() {
      return v342;
    },
    updateNodePosition(v344, v345, v346) {
      ((v342["nodes"][v344]["x"] += v345), (v342["nodes"][v344]["y"] += v346));
    },
    moveNodes(v347, v348, v349) {
      v347["forEach"]((v350) => {
        ((v342["nodes"][v350]["x"] += v348),
          (v342["nodes"][v350]["y"] += v349));
      });
    },
    batch(v351) {
      v351();
    },
    groupNodes() {},
  };
  return createDragController({
    store: v343,
    isNodeType: isNodeType,
    getShortcuts() {
      return {};
    },
    hitTestNode() {
      return null;
    },
    screenToWorld: identityScreenToWorld,
    generateId(v352) {
      return v352 + "-generated";
    },
    cloneNodesWithEdges() {
      return {};
    },
    commit() {},
  });
}
function createNodeDragContext() {
  return {
    dragSource: "node",
    targetNodeId: "n1",
    lastWorldX: 0,
    lastWorldY: 0,
    pendingDx: 0,
    pendingDy: 0,
    hasMoved: false,
    wasSelectedOnDown: true,
    titleDragActivated: false,
  };
}
async function flushAsyncWork(v353 = 8) {
  for (let v354 = 0; v354 < v353; v354 += 1) {
    await Promise["resolve"]();
  }
}
(test("DragController: grid snap aligns the dragged node origin to the canvas grid", () => {
  const v355 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: {
        n1: {
          id: "n1",
          type: "ai-image",
          x: 13,
          y: 17,
          width: 100,
          height: 80,
        },
      },
      edges: {},
      selectedNodeIds: ["n1"],
      ui: { snapGuidesEnabled: false },
      _parentToChildren: {},
    },
    v356 = createDragEdgeHarness(v355),
    v357 = globalThis["v2SnapToGrid"];
  try {
    globalThis["v2SnapToGrid"] = true;
    const v358 = createNodeDragController(v355),
      v359 = createNodeDragContext();
    (v358["updateDraggingNodes"](v359, 21, 22, 21, 22, 21, 22, v355),
      strict["equal"](v359["pendingDx"], 27),
      strict["equal"](v359["pendingDy"], 23),
      strict["equal"](
        v356["wrappers"]["get"]("n1")["style"]["transform"],
        "translate(40px, 40px)",
      ));
    const v360 = v358["finishDraggingNodes"](v359, 21, 22);
    (strict["deepEqual"](v360, { earlyCommit: false, didAct: true }),
      strict["equal"](v355["nodes"]["n1"]["x"], 40),
      strict["equal"](v355["nodes"]["n1"]["y"], 40));
  } finally {
    if (typeof v357 === "undefined") delete globalThis["v2SnapToGrid"];
    else globalThis["v2SnapToGrid"] = v357;
    v356["restore"]();
  }
}),
  test("DragController: grid snap aligns the multi-select bounds to the canvas grid", () => {
    const v361 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          n1: {
            id: "n1",
            type: "ai-image",
            x: 13,
            y: 17,
            width: 100,
            height: 80,
          },
          n2: {
            id: "n2",
            type: "ai-text",
            x: 55,
            y: 70,
            width: 100,
            height: 80,
          },
        },
        edges: {},
        selectedNodeIds: ["n1", "n2"],
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
      },
      v362 = createDragEdgeHarness(v361),
      v363 = globalThis["v2SnapToGrid"];
    try {
      globalThis["v2SnapToGrid"] = true;
      const v364 = createNodeDragController(v361),
        v365 = createNodeDragContext();
      (v364["updateDraggingNodes"](v365, 21, 22, 21, 22, 21, 22, v361),
        strict["equal"](v365["pendingDx"], 27),
        strict["equal"](v365["pendingDy"], 23),
        strict["equal"](
          v362["wrappers"]["get"]("n1")["style"]["transform"],
          "translate(40px,\x2040px)",
        ),
        strict["equal"](
          v362["wrappers"]["get"]("n2")["style"]["transform"],
          "translate(82px,\x2093px)",
        ));
      const v366 = v364["finishDraggingNodes"](v365, 21, 22);
      (strict["deepEqual"](v366, { earlyCommit: false, didAct: true }),
        strict["equal"](v361["nodes"]["n1"]["x"], 40),
        strict["equal"](v361["nodes"]["n1"]["y"], 40),
        strict["equal"](v361["nodes"]["n2"]["x"], 82),
        strict["equal"](v361["nodes"]["n2"]["y"], 93));
    } finally {
      if (typeof v363 === "undefined") delete globalThis["v2SnapToGrid"];
      else globalThis["v2SnapToGrid"] = v363;
      v362["restore"]();
    }
  }),
  test("DragController: 目标缩放区间内 3 条叠线拖拽会合并连线重绘到 RAF", () => {
    const v367 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      v368 = createDragEdgeHarness(v367);
    try {
      const v369 = createNodeDragController(v367),
        v370 = createNodeDragContext();
      (v369["updateDraggingNodes"](v370, 10, 0, 10, 0, 10, 0, v367),
        v369["updateDraggingNodes"](v370, 20, 0, 20, 0, 20, 0, v367),
        strict["equal"](v368["records"]["length"], 0),
        strict["equal"](v368["pendingRafCount"](), 1),
        strict["equal"](
          document["body"]["classList"]["contains"]("is-edge-interaction-lite"),
          true,
        ),
        v368["runRaf"](),
        strict["equal"](v368["records"]["length"], 3),
        strict["equal"](
          v368["records"]["every"]((v371) => v371["kind"] === "main"),
          true,
        ),
        strict["match"](v368["records"][0]["value"], /^M 280 50 C /));
    } finally {
      v368["restore"]();
    }
  }),
  test("DragController: records partial edge redraw samples during connected node drag", () => {
    const v372 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      v373 = createDragEdgeHarness(v372);
    try {
      (resetPerfProbeData(), setPerfProbeEnabled(true));
      const v374 = createNodeDragController(v372),
        v375 = createNodeDragContext();
      (v374["updateDraggingNodes"](v375, 10, 0, 10, 0, 10, 0, v372),
        v373["runRaf"]());
      const v376 = getPerfProbeSnapshot()["edgeRedrawSamples"],
        v377 = v376[v376["length"] - 1];
      (strict["equal"](v377["mode"], "partial"),
        strict["equal"](v377["reason"], "drag-controller"),
        strict["equal"](v377["edgeCount"], 3),
        strict["equal"](v377["visibleEdgeCount"], 3),
        strict["equal"](v377["updatedCount"], 3),
        strict["equal"](v377["cacheSize"], 3));
    } finally {
      (setPerfProbeEnabled(false), resetPerfProbeData(), v373["restore"]());
    }
  }),
  test("DragController: 目标缩放区间内 3 条叠线拖拽会跳过小于 1px 的边重绘", () => {
    const v378 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      v379 = createDragEdgeHarness(v378);
    try {
      const v380 = createNodeDragController(v378),
        v381 = createNodeDragContext();
      (v380["updateDraggingNodes"](v381, 20, 0, 20, 0, 20, 0, v378),
        v379["runRaf"](),
        strict["equal"](v379["records"]["length"], 3),
        v380["updateDraggingNodes"](v381, 21, 0, 21, 0, 21, 0, v378),
        strict["equal"](
          v379["wrappers"]["get"]("n1")["style"]["transform"],
          "translate(21px, 0px)",
        ),
        v379["runRaf"](),
        strict["equal"](v379["records"]["length"], 3));
    } finally {
      v379["restore"]();
    }
  }),
  test("DragController: 叠线拖拽结束会 flush 最后一帧并移除轻量化 class", () => {
    const v382 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 }),
      v383 = createDragEdgeHarness(v382);
    try {
      const v384 = createNodeDragController(v382),
        v385 = createNodeDragContext();
      (v384["updateDraggingNodes"](v385, 10, 0, 10, 0, 10, 0, v382),
        strict["equal"](v383["records"]["length"], 0),
        strict["equal"](
          document["body"]["classList"]["contains"]("is-edge-interaction-lite"),
          true,
        ));
      const v386 = v384["finishDraggingNodes"](v385, 10, 0);
      (strict["deepEqual"](v386, { earlyCommit: false, didAct: true }),
        strict["equal"](v383["records"]["length"], 6),
        strict["equal"](
          document["body"]["classList"]["contains"]("is-edge-interaction-lite"),
          false,
        ),
        v383["runRaf"](),
        strict["equal"](v383["records"]["length"], 6));
    } finally {
      v383["restore"]();
    }
  }),
  test("DragController:\x20非目标缩放区间或低于\x203\x20条线时保持同步边更新", () => {
    const v387 = [
      createDragEdgeState({ zoom: 0.5, edgeCount: 6 }),
      createDragEdgeState({ zoom: 0.2, edgeCount: 6 }),
      createDragEdgeState({ zoom: 0.3, edgeCount: 2 }),
    ];
    v387["forEach"]((v388) => {
      const v389 = createDragEdgeHarness(v388);
      try {
        const v390 = createNodeDragController(v388),
          v391 = createNodeDragContext();
        (v390["updateDraggingNodes"](v391, 10, 0, 10, 0, 10, 0, v388),
          strict["equal"](
            v389["records"]["length"],
            Object["keys"](v388["edges"])["length"] * 2,
          ),
          strict["equal"](v389["pendingRafCount"](), 0),
          strict["equal"](
            document["body"]["classList"]["contains"](
              "is-edge-interaction-lite",
            ),
            false,
          ));
      } finally {
        v389["restore"]();
      }
    });
  }),
  test("DragController: 全局总边数达到阈值时单条受影响边也进入轻量模式", () => {
    const v392 = createDragEdgeState({ zoom: 0.3, edgeCount: 3 });
    ((v392["edges"]["e2"] = { id: "e2", sourceId: "n3", targetId: "n4" }),
      (v392["edges"]["e3"] = { id: "e3", sourceId: "n4", targetId: "n3" }));
    const v393 = createDragEdgeHarness(v392);
    try {
      const v394 = createNodeDragController(v392),
        v395 = createNodeDragContext();
      (v394["updateDraggingNodes"](v395, 10, 0, 10, 0, 10, 0, v392),
        strict["equal"](v393["records"]["length"], 0),
        strict["equal"](v393["pendingRafCount"](), 1),
        strict["equal"](
          document["body"]["classList"]["contains"]("is-edge-interaction-lite"),
          true,
        ),
        v393["runRaf"](),
        strict["equal"](v393["records"]["length"], 1),
        strict["equal"](v393["records"][0]["id"], "e1"),
        strict["equal"](v393["records"][0]["kind"], "main"));
    } finally {
      v393["restore"]();
    }
  }),
  test("DragController: group drag translates internal edges without path recalculation", () => {
    const v396 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          group: {
            id: "group",
            type: "group",
            x: 0,
            y: 0,
            width: 240,
            height: 160,
          },
          n1: {
            id: "n1",
            type: "ai-image",
            parentId: "group",
            x: 10,
            y: 20,
            width: 80,
            height: 60,
          },
          n2: {
            id: "n2",
            type: "ai-text",
            parentId: "group",
            x: 120,
            y: 20,
            width: 80,
            height: 60,
          },
        },
        edges: { e1: { id: "e1", sourceId: "n1", targetId: "n2" } },
        selectedNodeIds: ["group"],
        ui: { snapGuidesEnabled: true },
        _parentToChildren: { group: new Set(["n1", "n2"]) },
      },
      v397 = createDragEdgeHarness(v396),
      v398 = {
        getStateRaw() {
          return v396;
        },
        moveNodes(v399, v400, v401) {
          const v402 = new Set(v399);
          for (const v403 of v399) {
            const v404 = v396["_parentToChildren"][v403];
            if (!v404) continue;
            for (const v405 of v404) v402["add"](v405);
          }
          v402["forEach"]((v406) => {
            ((v396["nodes"][v406]["x"] += v400),
              (v396["nodes"][v406]["y"] += v401));
          });
        },
        updateNodePosition() {
          throw new Error("group drag should use moveNodes");
        },
        batch(v407) {
          v407();
        },
        groupNodes() {},
      };
    try {
      const v408 = createDragController({
          store: v398,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v409) {
            return v409 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v410 = { ...createNodeDragContext(), targetNodeId: "group" };
      (v408["updateDraggingNodes"](v410, 20, 0, 20, 0, 20, 0, v396),
        strict["equal"](v397["records"]["length"], 0),
        strict["equal"](
          v397["edgeDomCache"]
            ["get"]("e1")
            ["groupEl"]["getAttribute"]("transform"),
          "translate(20\x200)",
        ));
      const v411 = v408["finishDraggingNodes"](v410, 20, 0);
      (strict["deepEqual"](v411, { earlyCommit: false, didAct: true }),
        strict["equal"](
          v397["edgeDomCache"]
            ["get"]("e1")
            ["groupEl"]["getAttribute"]("transform"),
          null,
        ),
        strict["equal"](v396["nodes"]["group"]["x"], 20),
        strict["equal"](v396["nodes"]["n1"]["x"], 30),
        strict["equal"](v396["nodes"]["n2"]["x"], 140));
    } finally {
      v397["restore"]();
    }
  }),
  test("DragController: 宫格间拖拽在分隔线位置会沿用统一命中规则", () => {
    const v412 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: {
        "sb-source": {
          id: "sb-source",
          type: "storyboard",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          cols: 1,
          rows: 1,
          cells: [
            {
              id: "cell-src",
              localPath: "output/source.png",
              thumbLocalPath: "output/source-thumb.webp",
              thumbId: "thumb-1",
              sourceId: "source-1",
              isEmpty: false,
            },
          ],
        },
        "sb-target": {
          id: "sb-target",
          type: "storyboard",
          x: 200,
          y: 0,
          width: 100,
          height: 100,
          cols: 2,
          rows: 1,
          cells: [
            { id: "cell-left", isEmpty: true, url: "" },
            { id: "cell-right", isEmpty: true, url: "" },
          ],
        },
      },
    };
    let v413 = null;
    const v414 = {
        getStateRaw() {
          return v412;
        },
        updateNodesData(v415) {
          v413 = v415;
        },
        updateNodeData() {
          throw new Error(
            "updateNodeData should not be called in cross-storyboard move",
          );
        },
      },
      v416 = createDragController({
        store: v414,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(v417) {
          return v417 + "-generated";
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
      }),
      v418 = v416["finishDraggingCell"](
        {
          targetNodeId: "sb-source",
          sourceCellIndex: 0,
          draggedCellData: v412["nodes"]["sb-source"]["cells"][0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        250,
        25,
      );
    (strict["deepEqual"](v418, { didAct: true, committed: true }),
      strict["equal"](v413["sb-target"]["cells"][0]["id"], "cell-src"),
      strict["equal"](
        v413["sb-target"]["cells"][0]["localPath"],
        "output/source.png",
      ),
      strict["equal"](v413["sb-target"]["cells"][1]["id"], "cell-right"),
      strict["deepEqual"](v413["sb-source"]["cells"][0], {
        id: "cell-src",
        localPath: null,
        originalLocalPath: null,
        displayLocalPath: null,
        thumbLocalPath: null,
        thumbId: null,
        sourceId: null,
        sourceLocalPath: null,
        sourceUrl: "",
        sourceWidth: null,
        sourceHeight: null,
        storyboardSourceCrop: false,
        storyboardPiece: false,
        storyboardLockedCell: false,
        residualImageLocalPath: "output/source.png",
        residualImageUrl: "",
        residualImageWidth: null,
        residualImageHeight: null,
        residualImageMode: "cell",
        isEmpty: true,
        col: 0,
        row: 0,
        url: "",
        thumbUrl: "",
      }));
  }),
  test("DragController:\x20子宫格互换使用显示快照写入\x20Store", () => {
    const v419 = globalThis["window"],
      v420 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-source": {
            id: "sb-source",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            cols: 1,
            rows: 1,
            cells: [
              {
                id: "cell-src",
                localPath: "output/source.png",
                thumbLocalPath: "output/source-thumb.webp",
                isEmpty: false,
              },
            ],
          },
          "sb-target": {
            id: "sb-target",
            type: "storyboard",
            x: 200,
            y: 0,
            width: 100,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              { id: "cell-left", isEmpty: true, url: "" },
              { id: "cell-right", isEmpty: true, url: "" },
            ],
          },
        },
      };
    let v421 = null,
      v422 = null;
    const v423 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    globalThis["window"] = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            "sb-source",
            {
              applyImmediateCellSwap() {
                throw new Error(
                  "cross-storyboard\x20move\x20should\x20not\x20preview\x20swap",
                );
              },
            },
          ],
        ]),
        flushNodes(v424) {
          return ((v422 = v424), true);
        },
      },
    };
    const v425 = {
      getStateRaw() {
        return v420;
      },
      updateNodesData(v426) {
        v421 = v426;
      },
      updateNodeData() {
        throw new Error(
          "updateNodeData should not be called for cross-storyboard move",
        );
      },
    };
    try {
      const v427 = createDragController({
          store: v425,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v428) {
            return v428 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v429 = v427["finishDraggingCell"](
          {
            targetNodeId: "sb-source",
            sourceCellIndex: 0,
            draggedCellData: v420["nodes"]["sb-source"]["cells"][0],
            ghostEl: v423,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          25,
        );
      (strict["deepEqual"](v429, { didAct: true, committed: true }),
        strict["equal"](v421["sb-target"]["cells"][0]["id"], "cell-src"),
        strict["equal"](
          v421["sb-target"]["cells"][0]["localPath"],
          "output/source.png",
        ),
        strict["equal"](v421["sb-target"]["cells"][0]["sourceLocalPath"], null),
        strict["equal"](v421["sb-target"]["cells"][0]["sourceUrl"], ""),
        strict["equal"](v421["sb-source"]["cells"][0]["isEmpty"], true),
        strict["deepEqual"](v422, ["sb-source", "sb-target"]),
        strict["equal"](v423["removed"], true));
    } finally {
      if (typeof v419 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v419;
    }
  }),
  test("DragController: 源图像拖入拼图空槽会填充槽位", () => {
    const v430 = globalThis["window"],
      v431 = globalThis["document"],
      v432 = globalThis["requestAnimationFrame"],
      v433 = globalThis["setTimeout"],
      v434 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ["img-1"],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          "img-1": {
            id: "img-1",
            type: "source-image",
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            localPath: "output/a.jpg",
            name: "A",
          },
          "collage-1": {
            id: "collage-1",
            type: "collage",
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            items: [
              { id: "slot-0", x: 0, y: 0, width: 50, height: 100 },
              {
                id: "slot-1",
                x: 50,
                y: 0,
                width: 50,
                height: 100,
                url: "/b.jpg",
              },
            ],
          },
        },
      };
    let v435 = null,
      v436 = null,
      v437 = null,
      v438 = 0,
      v439 = null;
    const v440 = {
      getStateRaw() {
        return v434;
      },
      updateNodeData(v441, v442) {
        ((v435 = { nodeId: v441, patch: v442 }),
          (v434["nodes"][v441] = { ...v434["nodes"][v441], ...v442 }));
      },
      setSelectedNodes(v443) {
        ((v436 = v443), (v434["selectedNodeIds"] = v443));
      },
      deleteNodes(v444) {
        v437 = v444;
      },
      batch(v445) {
        v445();
      },
      groupNodes() {},
    };
    try {
      const v446 = {
          complete: true,
          naturalWidth: 120,
          naturalHeight: 240,
          currentSrc: "/output/a.jpg",
          src: "/output/a.jpg",
        },
        v447 = {
          complete: true,
          naturalWidth: 120,
          naturalHeight: 240,
          getAttribute(v448) {
            return v448 === "src" ? "/output/a.jpg" : "";
          },
        };
      function v449(v450) {
        return {
          tagName: String(v450)["toUpperCase"](),
          style: {},
          children: [],
          appendChild(v451) {
            return (this["children"]["push"](v451), v451);
          },
          remove() {
            this["removed"] = true;
          },
          setAttribute(v452, v453) {
            this[v452] = String(v453);
          },
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: "",
              drawImage(...v454) {
                v439 = v454;
              },
            };
          },
        };
      }
      ((globalThis["window"] = {
        v2Renderer: {
          nodeInstances: new Map(),
          getMountedWrapper(v455) {
            if (v455 !== "img-1") return null;
            return {
              querySelector(v456) {
                return v456 === "img" ? v446 : null;
              },
            };
          },
        },
      }),
        (globalThis["document"] = {
          body: {
            appendChild(v457) {
              return v457;
            },
          },
          createElement: v449,
          querySelector(v458) {
            if (v458["includes"]("collage-item"))
              return {
                querySelector() {
                  return v447;
                },
              };
            return null;
          },
          getElementById(v459) {
            if (v459 !== "collage-1") return null;
            return {
              querySelector(v460) {
                if (!v460["includes"]("collage-item")) return null;
                return {
                  querySelector() {
                    return v447;
                  },
                };
              },
            };
          },
        }),
        (globalThis["requestAnimationFrame"] = (v461) => {
          return (v461(), 1);
        }),
        (globalThis["setTimeout"] = (v462) => {
          return (v462(), 1);
        }));
      const v463 = createDragController({
          store: v440,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return "img-1";
          },
          screenToWorld: identityScreenToWorld,
          generateId(v464) {
            return v464 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            v438 += 1;
          },
        }),
        v465 = v463["finishDraggingNodes"](
          { targetNodeId: "img-1", pendingDx: 0, pendingDy: 0 },
          125,
          125,
        );
      (strict["deepEqual"](v465, { earlyCommit: true, didAct: true }),
        strict["equal"](v435["nodeId"], "collage-1"),
        strict["equal"](
          v435["patch"]["items"][0]["id"],
          "collage-item-generated",
        ),
        strict["equal"](v435["patch"]["items"][0]["url"], "/output/a.jpg"),
        strict["equal"](v435["patch"]["items"][0]["localPath"], "output/a.jpg"),
        strict["equal"](v435["patch"]["items"][0]["sourceNodeId"], "img-1"),
        strict["equal"](v435["patch"]["items"][0]["sourceDisplayWidth"], 120),
        strict["equal"](v435["patch"]["items"][0]["sourceDisplayHeight"], 240),
        strict["equal"](v439["length"], 9),
        strict["equal"](v439[0], v446),
        strict["equal"](v439[5], 0),
        strict["equal"](v439[6], 0),
        strict["equal"](v439[7] > 0, true),
        strict["equal"](v439[8] > 0, true),
        strict["notEqual"](v439[3], v446["naturalWidth"]),
        strict["deepEqual"](v436, ["collage-1"]),
        strict["deepEqual"](v437, ["img-1"]),
        strict["equal"](v438, 1));
    } finally {
      if (typeof v430 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v430;
      if (typeof v431 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v431;
      if (typeof v432 === "undefined")
        delete globalThis["requestAnimationFrame"];
      else globalThis["requestAnimationFrame"] = v432;
      if (typeof v433 === "undefined") delete globalThis["setTimeout"];
      else globalThis["setTimeout"] = v433;
    }
  }),
  test("DragController:\x20source-only\x20image\x20drop\x20into\x20collage\x20does\x20not\x20write\x20source\x20fallback", () => {
    const v466 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: ["img-1"],
      edges: {},
      ui: { snapGuidesEnabled: false },
      _parentToChildren: {},
      nodes: {
        "img-1": {
          id: "img-1",
          type: "source-image",
          x: 0,
          y: 0,
          width: 120,
          height: 240,
          src: "",
          localPath: null,
          sourceLocalPath: "output/full-source.jpg",
          sourceUrl: "/output/full-source.jpg",
        },
        "collage-1": {
          id: "collage-1",
          type: "collage",
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          items: [{ id: "slot-0", x: 0, y: 0, width: 100, height: 100 }],
        },
      },
    };
    let v467 = false,
      v468 = false,
      v469 = false,
      v470 = false;
    const v471 = {
        getStateRaw() {
          return v466;
        },
        updateNodeData() {
          v467 = true;
        },
        setSelectedNodes() {
          v469 = true;
        },
        deleteNodes() {
          v468 = true;
        },
        batch(v472) {
          v472();
        },
        groupNodes() {},
      },
      v473 = createDragController({
        store: v471,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return "img-1";
        },
        screenToWorld: identityScreenToWorld,
        generateId(v474) {
          return v474 + "-generated";
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {
          v470 = true;
        },
      }),
      v475 = v473["finishDraggingNodes"](
        { targetNodeId: "img-1", pendingDx: 0, pendingDy: 0 },
        125,
        125,
      );
    (strict["deepEqual"](v475, { earlyCommit: false, didAct: false }),
      strict["equal"](v467, false),
      strict["equal"](v468, false),
      strict["equal"](v469, false),
      strict["equal"](v470, false));
  }),
  test("DragController: collage drop uses current visible image and clears source context", () => {
    const v476 = globalThis["window"],
      v477 = globalThis["requestAnimationFrame"],
      v478 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ["img-1"],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          "img-1": {
            id: "img-1",
            type: "source-image",
            x: 0,
            y: 0,
            width: 120,
            height: 60,
            src: "",
            localPath: null,
            sourceLocalPath: "output/full-source.jpg",
            sourceUrl: "/output/full-source.jpg",
            sourceWidth: 400,
            sourceHeight: 300,
            imageWidth: 80,
            imageHeight: 40,
            name: "Visible",
          },
          "collage-1": {
            id: "collage-1",
            type: "collage",
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            items: [{ id: "slot-0", x: 0, y: 0, width: 100, height: 100 }],
          },
        },
      };
    let v479 = null,
      v480 = null,
      v481 = null,
      v482 = 0;
    const v483 = {
      getStateRaw() {
        return v478;
      },
      updateNodeData(v484, v485) {
        ((v479 = { nodeId: v484, patch: v485 }),
          (v478["nodes"][v484] = { ...v478["nodes"][v484], ...v485 }));
      },
      setSelectedNodes(v486) {
        ((v480 = v486), (v478["selectedNodeIds"] = v486));
      },
      deleteNodes(v487) {
        v481 = v487;
      },
      batch(v488) {
        v488();
      },
      groupNodes() {},
    };
    try {
      ((globalThis["window"] = {
        v2Renderer: {
          nodeInstances: new Map(),
          getMountedWrapper(v489) {
            if (v489 !== "img-1") return null;
            return {
              querySelector(v490) {
                if (v490 !== "img") return null;
                return {
                  complete: true,
                  naturalWidth: 80,
                  naturalHeight: 40,
                  currentSrc: "/output/current-visible.jpg",
                  src: "/output/current-visible.jpg",
                };
              },
            };
          },
        },
      }),
        (globalThis["requestAnimationFrame"] = (v491) => {
          return (v491(), 1);
        }));
      const v492 = createDragController({
          store: v483,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return "img-1";
          },
          screenToWorld: identityScreenToWorld,
          generateId(v493) {
            return v493 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            v482 += 1;
          },
        }),
        v494 = v492["finishDraggingNodes"](
          { targetNodeId: "img-1", pendingDx: 0, pendingDy: 0 },
          125,
          125,
        );
      strict["deepEqual"](v494, { earlyCommit: true, didAct: true });
      const v495 = v479?.["patch"]?.["items"]?.[0];
      (strict["equal"](v479?.["nodeId"], "collage-1"),
        strict["equal"](v495?.["url"], "/output/current-visible.jpg"),
        strict["equal"](v495?.["localPath"], "output/current-visible.jpg"),
        strict["equal"](v495?.["sourceLocalPath"], ""),
        strict["equal"](v495?.["sourceUrl"], ""),
        strict["equal"](v495?.["sourceWidth"], null),
        strict["equal"](v495?.["sourceHeight"], null),
        strict["equal"](v495?.["imageWidth"], 80),
        strict["equal"](v495?.["imageHeight"], 40),
        strict["deepEqual"](v480, ["collage-1"]),
        strict["deepEqual"](v481, ["img-1"]),
        strict["equal"](v482, 1));
    } finally {
      if (typeof v476 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v476;
      if (typeof v477 === "undefined")
        delete globalThis["requestAnimationFrame"];
      else globalThis["requestAnimationFrame"] = v477;
    }
  }),
  test("DragController: 拼图编辑态允许源图像替换已占用槽位", () => {
    const v496 = globalThis["window"],
      v497 = globalThis["requestAnimationFrame"],
      v498 = globalThis["setTimeout"],
      v499 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ["img-1"],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          "img-1": {
            id: "img-1",
            type: "source-image",
            x: 0,
            y: 0,
            width: 80,
            height: 80,
            localPath: "output/a.jpg",
            name: "A",
          },
          "collage-1": {
            id: "collage-1",
            type: "collage",
            isEditing: true,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            items: [
              { id: "slot-0", x: 0, y: 0, width: 50, height: 100 },
              {
                id: "slot-1",
                x: 50,
                y: 0,
                width: 50,
                height: 100,
                url: "/b.jpg",
              },
            ],
          },
        },
      };
    let v500 = null,
      v501 = null,
      v502 = null,
      v503 = 0;
    const v504 = {
      getStateRaw() {
        return v499;
      },
      updateNodeData(v505, v506) {
        ((v500 = { nodeId: v505, patch: v506 }),
          (v499["nodes"][v505] = { ...v499["nodes"][v505], ...v506 }));
      },
      setSelectedNodes(v507) {
        ((v501 = v507), (v499["selectedNodeIds"] = v507));
      },
      deleteNodes(v508) {
        v502 = v508;
      },
      batch(v509) {
        v509();
      },
      groupNodes() {},
    };
    try {
      ((globalThis["window"] = { v2Renderer: { nodeInstances: new Map() } }),
        (globalThis["requestAnimationFrame"] = (v510) => {
          return (v510(), 1);
        }),
        (globalThis["setTimeout"] = (v511) => {
          return (v511(), 1);
        }));
      const v512 = createDragController({
          store: v504,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return "img-1";
          },
          screenToWorld: identityScreenToWorld,
          generateId(v513) {
            return v513 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            v503 += 1;
          },
        }),
        v514 = v512["finishDraggingNodes"](
          { targetNodeId: "img-1", pendingDx: 0, pendingDy: 0 },
          175,
          125,
        );
      (strict["deepEqual"](v514, { earlyCommit: true, didAct: true }),
        strict["equal"](v500["nodeId"], "collage-1"),
        strict["equal"](
          v500["patch"]["items"][1]["id"],
          "collage-item-generated",
        ),
        strict["equal"](v500["patch"]["items"][1]["url"], "/output/a.jpg"),
        strict["equal"](v500["patch"]["items"][1]["localPath"], "output/a.jpg"),
        strict["equal"](v500["patch"]["items"][1]["sourceNodeId"], "img-1"),
        strict["equal"](v500["patch"]["items"][1]["sourceDisplayWidth"], 80),
        strict["equal"](v500["patch"]["items"][1]["sourceDisplayHeight"], 80),
        strict["deepEqual"](v501, ["collage-1"]),
        strict["deepEqual"](v502, ["img-1"]),
        strict["equal"](v503, 1));
    } finally {
      if (typeof v496 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v496;
      if (typeof v497 === "undefined")
        delete globalThis["requestAnimationFrame"];
      else globalThis["requestAnimationFrame"] = v497;
      if (typeof v498 === "undefined") delete globalThis["setTimeout"];
      else globalThis["setTimeout"] = v498;
    }
  }),
  test("DragController: 同一宫格互换会先视觉交换再提交 Store", () => {
    const v515 = globalThis["window"],
      v516 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              { id: "cell-a", localPath: "output/a.png", isEmpty: false },
              { id: "cell-b", localPath: "output/b.png", isEmpty: false },
            ],
          },
        },
      },
      v517 = [];
    let v518 = null,
      v519 = null,
      v520 = false;
    const v521 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    globalThis["window"] = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            "sb-1",
            {
              applyImmediateCellSwap(v522, v523) {
                return (
                  v517["push"]("visual"),
                  strict["equal"](v522, 0),
                  strict["equal"](v523, 1),
                  {
                    ok: true,
                    revert() {
                      v520 = true;
                    },
                  }
                );
              },
            },
          ],
        ]),
        flushNodes(v524) {
          return (v517["push"]("flush"), (v519 = v524), true);
        },
      },
    };
    const v525 = {
      getStateRaw() {
        return v516;
      },
      updateNodeData(v526, v527) {
        (v517["push"]("store"),
          strict["equal"](v521["removed"], true),
          (v518 = { nodeId: v526, patch: v527 }));
      },
      updateNodesData() {
        throw new Error(
          "updateNodesData should not be called for same-storyboard move",
        );
      },
    };
    try {
      const v528 = createDragController({
          store: v525,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v529) {
            return v529 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v530 = v528["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v516["nodes"]["sb-1"]["cells"][0],
            ghostEl: v521,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          25,
        );
      (strict["deepEqual"](v530, { didAct: true, committed: true }),
        strict["deepEqual"](v517, ["visual", "store", "flush"]),
        strict["equal"](v518["nodeId"], "sb-1"),
        strict["equal"](v518["patch"]["cells"][0]["id"], "cell-b"),
        strict["equal"](v518["patch"]["cells"][1]["id"], "cell-a"),
        strict["deepEqual"](v519, ["sb-1"]),
        strict["equal"](v521["removed"], true),
        strict["equal"](v520, false));
    } finally {
      if (typeof v515 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v515;
    }
  }),
  test("DragController:\x20storyboard\x20cell\x20drop\x20in\x20transparent\x20gap\x20swaps\x20nearest\x20cell", () => {
    const v531 = globalThis["window"],
      v532 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [1] },
            cells: [
              { id: "cell-a", localPath: "output/a.png", isEmpty: false },
              { id: "cell-b", localPath: "output/b.png", isEmpty: false },
            ],
          },
        },
      };
    let v533 = null,
      v534 = null,
      v535 = null;
    const v536 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    globalThis["window"] = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            "sb-1",
            {
              applyImmediateCellSwap(v537, v538) {
                return (
                  (v533 = [v537, v538]),
                  {
                    ok: true,
                    revert() {
                      throw new Error(
                        "gap swap preview should not be reverted",
                      );
                    },
                  }
                );
              },
            },
          ],
        ]),
        flushNodes(v539) {
          return ((v535 = v539), true);
        },
      },
    };
    const v540 = {
      getStateRaw() {
        return v532;
      },
      updateNodeData(v541, v542) {
        v534 = { nodeId: v541, patch: v542 };
      },
      batch() {
        throw new Error(
          "gap\x20drop\x20should\x20resolve\x20to\x20a\x20storyboard\x20cell",
        );
      },
    };
    try {
      const v543 = createDragController({
          store: v540,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v544) {
            return v544 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v545 = v543["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v532["nodes"]["sb-1"]["cells"][0],
            ghostEl: v536,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          155,
          50,
        );
      (strict["deepEqual"](v545, { didAct: true, committed: true }),
        strict["deepEqual"](v533, [0, 1]),
        strict["equal"](v534["nodeId"], "sb-1"),
        strict["equal"](v534["patch"]["cells"][0]["id"], "cell-b"),
        strict["equal"](v534["patch"]["cells"][1]["id"], "cell-a"),
        strict["deepEqual"](v535, ["sb-1"]),
        strict["equal"](v536["removed"], true));
    } finally {
      if (typeof v531 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v531;
    }
  }),
  test("DragController: storyboard cell pointerup miss reuses last hovered cell", () => {
    const v546 = globalThis["window"],
      v547 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              { id: "cell-a", localPath: "output/a.png", isEmpty: false },
              { id: "cell-b", localPath: "output/b.png", isEmpty: false },
            ],
          },
        },
      };
    let v548 = null,
      v549 = null,
      v550 = null;
    const v551 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    globalThis["window"] = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            "sb-1",
            {
              applyImmediateCellSwap(v552, v553) {
                return ((v548 = [v552, v553]), { ok: true, revert() {} });
              },
            },
          ],
        ]),
        flushNodes(v554) {
          return ((v550 = v554), true);
        },
      },
    };
    const v555 = {
      getStateRaw() {
        return v547;
      },
      updateNodeData(v556, v557) {
        v549 = { nodeId: v556, patch: v557 };
      },
      batch() {
        throw new Error("near miss should recover to hovered storyboard cell");
      },
    };
    try {
      const v558 = createDragController({
          store: v555,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v559) {
            return v559 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v560 = v558["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v547["nodes"]["sb-1"]["cells"][0],
            ghostEl: v551,
            sourceCellEl: null,
            lastHoverNodeId: "sb-1",
            lastHoverCellIndex: 1,
            lastHoverKind: "storyboard",
          },
          206,
          50,
        );
      (strict["deepEqual"](v560, { didAct: true, committed: true }),
        strict["deepEqual"](v548, [0, 1]),
        strict["equal"](v549["nodeId"], "sb-1"),
        strict["equal"](v549["patch"]["cells"][0]["id"], "cell-b"),
        strict["equal"](v549["patch"]["cells"][1]["id"], "cell-a"),
        strict["deepEqual"](v550, ["sb-1"]),
        strict["equal"](v551["removed"], true));
    } finally {
      if (typeof v546 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v546;
    }
  }),
  test("DragController:\x20storyboard\x20cell\x20swap\x20locks\x20current\x20grid\x20pixels", () => {
    const v561 = globalThis["window"],
      v562 = globalThis["document"],
      v563 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            gridGap: 20,
            cells: [
              {
                id: "cell-a",
                localPath: "output/a-stale.png",
                sourceUrl: "/output/full.png",
                sourceWidth: 200,
                sourceHeight: 100,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: "cell-b",
                localPath: "output/b-stale.png",
                sourceUrl: "/output/full.png",
                sourceWidth: 200,
                sourceHeight: 100,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
            ],
          },
        },
      },
      v564 = [],
      v565 = {
        complete: true,
        naturalWidth: 200,
        naturalHeight: 100,
        currentSrc: "/output/full.png",
        src: "/output/full.png",
        getAttribute(v566) {
          return v566 === "src" ? "/output/full.png" : "";
        },
      };
    globalThis["document"] = {
      getElementById(v567) {
        if (v567 !== "cell-sb-1-0" && v567 !== "cell-sb-1-1") return null;
        return {
          querySelector(v568) {
            return v568 === "img.storyboard-cell-img--source-crop"
              ? v565
              : null;
          },
        };
      },
      createElement(v569) {
        if (v569 !== "canvas") return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: "",
              drawImage(...v570) {
                v564["push"](v570);
              },
            };
          },
          toDataURL() {
            return (
              "data:image/jpeg;base64," + this["width"] + "x" + this["height"]
            );
          },
        };
      },
    };
    let v571 = null,
      v572 = false,
      v573 = null;
    const v574 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    globalThis["window"] = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            "sb-1",
            {
              applyImmediateCellSwap() {
                return { ok: true, revert() {} };
              },
            },
          ],
        ]),
        flushNodes(v575) {
          return ((v573 = v575), true);
        },
      },
    };
    const v576 = {
      getStateRaw() {
        return v563;
      },
      updateNodeData(v577, v578) {
        ((v571 = { nodeId: v577, patch: v578 }),
          (v563["nodes"][v577] = { ...v563["nodes"][v577], ...v578 }));
      },
      swapStoryboardCells() {
        return ((v572 = true), true);
      },
    };
    try {
      const v579 = createDragController({
          store: v576,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v580) {
            return v580 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v581 = v579["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v563["nodes"]["sb-1"]["cells"][0],
            ghostEl: v574,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          50,
        );
      (strict["deepEqual"](v581, { didAct: true, committed: true }),
        strict["equal"](v572, false),
        strict["deepEqual"](v573, ["sb-1"]),
        strict["equal"](v574["removed"], true),
        strict["equal"](v571["nodeId"], "sb-1"),
        strict["equal"](v571["patch"]["cells"][0]["id"], "cell-b"),
        strict["equal"](v571["patch"]["cells"][1]["id"], "cell-a"),
        strict["equal"](v571["patch"]["cells"][0]["localPath"], null),
        strict["equal"](v571["patch"]["cells"][1]["localPath"], null),
        strict["equal"](
          v571["patch"]["cells"][0]["storyboardLockedCell"],
          true,
        ),
        strict["equal"](
          v571["patch"]["cells"][1]["storyboardLockedCell"],
          true,
        ),
        strict["equal"](v571["patch"]["cells"][0]["sourceLocalPath"], null),
        strict["equal"](v571["patch"]["cells"][1]["sourceLocalPath"], null),
        strict["equal"](v571["patch"]["cells"][0]["sourceUrl"], ""),
        strict["equal"](v571["patch"]["cells"][1]["sourceUrl"], ""),
        strict["equal"](
          v571["patch"]["cells"][0]["storyboardSourceCrop"],
          false,
        ),
        strict["equal"](
          v571["patch"]["cells"][1]["storyboardSourceCrop"],
          false,
        ),
        strict["equal"](
          v571["patch"]["cells"][0]["storyboardExtractedCell"],
          false,
        ),
        strict["equal"](
          v571["patch"]["cells"][1]["storyboardExtractedCell"],
          false,
        ),
        strict["equal"](
          v571["patch"]["cells"][0]["capturePreviewUrl"],
          "data:image/jpeg;base64,90x100",
        ),
        strict["equal"](
          v571["patch"]["cells"][1]["capturePreviewUrl"],
          "data:image/jpeg;base64,90x100",
        ),
        strict["equal"](v564["length"], 2),
        strict["deepEqual"](v564[0]["slice"](1, 5), [0, 0, 90, 100]),
        strict["deepEqual"](v564[1]["slice"](1, 5), [110, 0, 90, 100]));
    } finally {
      if (typeof v561 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v561;
      if (typeof v562 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v562;
    }
  }),
  test("DragController: storyboard cell swap locks custom grid and gap pixels", () => {
    const v582 = globalThis["window"],
      v583 = globalThis["document"],
      v584 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            cols: 2,
            rows: 2,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
            cells: [
              {
                id: "cell-a",
                localPath: "output/a-stale.png",
                sourceUrl: "/output/full.png",
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: "cell-b",
                localPath: "output/b-stale.png",
                sourceUrl: "/output/full.png",
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: "cell-c",
                localPath: "output/c-stale.png",
                sourceUrl: "/output/full.png",
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: "cell-d",
                localPath: "output/d-stale.png",
                sourceUrl: "/output/full.png",
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
            ],
          },
        },
      },
      v585 = [],
      v586 = {
        complete: true,
        naturalWidth: 300,
        naturalHeight: 200,
        currentSrc: "/output/full.png",
        src: "/output/full.png",
        getAttribute(v587) {
          return v587 === "src" ? "/output/full.png" : "";
        },
      };
    globalThis["document"] = {
      getElementById(v588) {
        if (!/^cell-sb-1-[0-3]$/["test"](v588)) return null;
        return {
          querySelector(v589) {
            return v589 === "img.storyboard-cell-img--source-crop"
              ? v586
              : null;
          },
        };
      },
      createElement(v590) {
        if (v590 !== "canvas") return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: "",
              drawImage(...v591) {
                v585["push"](v591);
              },
            };
          },
          toDataURL() {
            return (
              "data:image/jpeg;base64," + this["width"] + "x" + this["height"]
            );
          },
        };
      },
    };
    let v592 = null,
      v593 = false;
    const v594 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    globalThis["window"] = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            "sb-1",
            {
              applyImmediateCellSwap() {
                return { ok: true, revert() {} };
              },
            },
          ],
        ]),
        flushNodes() {
          return true;
        },
      },
    };
    const v595 = {
      getStateRaw() {
        return v584;
      },
      updateNodeData(v596, v597) {
        ((v592 = { nodeId: v596, patch: v597 }),
          (v584["nodes"][v596] = { ...v584["nodes"][v596], ...v597 }));
      },
      swapStoryboardCells() {
        return ((v593 = true), true);
      },
    };
    try {
      const v598 = createDragController({
          store: v595,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v599) {
            return v599 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v600 = v598["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v584["nodes"]["sb-1"]["cells"][0],
            ghostEl: v594,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          100,
        );
      (strict["deepEqual"](v600, { didAct: true, committed: true }),
        strict["equal"](v593, false),
        strict["equal"](v594["removed"], true),
        strict["equal"](v592["nodeId"], "sb-1"),
        strict["equal"](v592["patch"]["cells"][0]["id"], "cell-d"),
        strict["equal"](v592["patch"]["cells"][3]["id"], "cell-a"),
        strict["equal"](
          v592["patch"]["cells"][0]["capturePreviewUrl"],
          "data:image/jpeg;base64,65x140",
        ),
        strict["equal"](
          v592["patch"]["cells"][3]["capturePreviewUrl"],
          "data:image/jpeg;base64,215x40",
        ),
        strict["deepEqual"](v585[0]["slice"](1, 5), [0, 0, 215, 40]),
        strict["deepEqual"](v585[1]["slice"](1, 5), [235, 60, 65, 140]));
    } finally {
      if (typeof v582 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v582;
      if (typeof v583 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v583;
    }
  }),
  test("DragController:\x20storyboard\x20swap\x20locks\x20node-level\x20puzzle\x20source\x20pieces", () => {
    const v601 = globalThis["window"],
      v602 = globalThis["document"],
      v603 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-node-source": {
            id: "sb-node-source",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            cols: 2,
            rows: 2,
            gridGap: 20,
            storyboardSourceLocalPath: "output/full-node.png",
            storyboardSourceWidth: 300,
            storyboardSourceHeight: 200,
            gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
            cells: [
              {
                id: "piece-a",
                localPath: "output/a-old.png",
                storyboardPiece: true,
                storyboardLockedCell: true,
                isEmpty: false,
              },
              {
                id: "piece-b",
                localPath: "output/b-old.png",
                storyboardPiece: true,
                storyboardLockedCell: true,
                isEmpty: false,
              },
              {
                id: "piece-c",
                localPath: "output/c-old.png",
                storyboardPiece: true,
                storyboardLockedCell: true,
                isEmpty: false,
              },
              {
                id: "piece-d",
                localPath: "output/d-old.png",
                storyboardPiece: true,
                storyboardLockedCell: true,
                isEmpty: false,
              },
            ],
          },
        },
      },
      v604 = [],
      v605 = {
        complete: true,
        naturalWidth: 300,
        naturalHeight: 200,
        currentSrc: "/output/full-node.png",
        src: "/output/full-node.png",
        getAttribute(v606) {
          return v606 === "src" ? "/output/full-node.png" : "";
        },
      };
    globalThis["document"] = {
      getElementById(v607) {
        if (/^cell-sb-node-source-[0-3]$/["test"](v607))
          return {
            querySelector() {
              return null;
            },
          };
        if (v607 === "sb-node-sb-node-source")
          return {
            querySelector(v608) {
              return v608 === ".storyboard-source-backdrop" ? v605 : null;
            },
          };
        return null;
      },
      createElement(v609) {
        if (v609 !== "canvas") return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return {
              imageSmoothingEnabled: false,
              imageSmoothingQuality: "",
              drawImage(...v610) {
                v604["push"](v610);
              },
            };
          },
          toDataURL() {
            return (
              "data:image/jpeg;base64," + this["width"] + "x" + this["height"]
            );
          },
        };
      },
    };
    let v611 = null,
      v612 = false;
    const v613 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    globalThis["window"] = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            "sb-node-source",
            {
              applyImmediateCellSwap() {
                return { ok: true, revert() {} };
              },
            },
          ],
        ]),
        flushNodes() {
          return true;
        },
      },
    };
    const v614 = {
      getStateRaw() {
        return v603;
      },
      updateNodeData(v615, v616) {
        ((v611 = { nodeId: v615, patch: v616 }),
          (v603["nodes"][v615] = { ...v603["nodes"][v615], ...v616 }));
      },
      swapStoryboardCells() {
        return ((v612 = true), true);
      },
    };
    try {
      const v617 = createDragController({
          store: v614,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v618) {
            return v618 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v619 = v617["finishDraggingCell"](
          {
            targetNodeId: "sb-node-source",
            sourceCellIndex: 0,
            draggedCellData: v603["nodes"]["sb-node-source"]["cells"][0],
            ghostEl: v613,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          100,
        );
      (strict["deepEqual"](v619, { didAct: true, committed: true }),
        strict["equal"](v612, false),
        strict["equal"](v613["removed"], true),
        strict["equal"](v611["nodeId"], "sb-node-source"),
        strict["equal"](v611["patch"]["cells"][0]["id"], "piece-d"),
        strict["equal"](v611["patch"]["cells"][3]["id"], "piece-a"),
        strict["equal"](
          v611["patch"]["cells"][0]["capturePreviewUrl"],
          "data:image/jpeg;base64,65x140",
        ),
        strict["equal"](
          v611["patch"]["cells"][3]["capturePreviewUrl"],
          "data:image/jpeg;base64,215x40",
        ),
        strict["deepEqual"](v604[0]["slice"](1, 5), [0, 0, 215, 40]),
        strict["deepEqual"](v604[1]["slice"](1, 5), [235, 60, 65, 140]));
    } finally {
      if (typeof v601 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v601;
      if (typeof v602 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v602;
    }
  }),
  test("DragController: source-backed storyboard source missing uses actual visible asset", () => {
    const v620 = globalThis["window"],
      v621 = globalThis["document"],
      v622 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 300,
            height: 200,
            cols: 2,
            rows: 2,
            gridGap: 20,
            gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
            cells: [
              {
                id: "cell-a",
                localPath: "output/a-stale-original-grid.png",
                sourceUrl: "/output/full.png",
                sourceWidth: 300,
                sourceHeight: 200,
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              { id: "cell-b", localPath: "output/b.png", isEmpty: false },
              { id: "cell-c", localPath: "output/c.png", isEmpty: false },
              { id: "cell-d", localPath: "output/d.png", isEmpty: false },
            ],
          },
        },
      };
    let v623 = false,
      v624 = false,
      v625 = false,
      v626 = false;
    const v627 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    ((globalThis["document"] = {
      getElementById() {
        return null;
      },
      createElement(v628) {
        if (v628 !== "canvas") return { style: {} };
        return {
          width: 0,
          height: 0,
          getContext() {
            return null;
          },
        };
      },
    }),
      (globalThis["window"] = {
        v2Renderer: {
          nodeInstances: new Map([
            [
              "sb-1",
              {
                applyImmediateCellSwap() {
                  return {
                    ok: true,
                    revert() {
                      v623 = true;
                    },
                  };
                },
              },
            ],
          ]),
          flushNodes() {
            return ((v626 = true), true);
          },
        },
      }));
    const v629 = {
      getStateRaw() {
        return v622;
      },
      updateNodeData() {
        v625 = true;
      },
      swapStoryboardCells() {
        return ((v624 = true), true);
      },
    };
    try {
      const v630 = createDragController({
          store: v629,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v631) {
            return v631 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v632 = v630["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v622["nodes"]["sb-1"]["cells"][0],
            ghostEl: v627,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          100,
        );
      (strict["deepEqual"](v632, { didAct: true, committed: true }),
        strict["equal"](v624, false),
        strict["equal"](v625, true),
        strict["equal"](v626, true),
        strict["equal"](v623, false),
        strict["equal"](v627["removed"], true));
    } finally {
      if (typeof v620 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v620;
      if (typeof v621 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v621;
    }
  }),
  test("DragController:\x20同一宫格视觉互换后\x20Store\x20失败会回滚", () => {
    const v633 = globalThis["window"],
      v634 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              { id: "cell-a", localPath: "output/a.png", isEmpty: false },
              { id: "cell-b", localPath: "output/b.png", isEmpty: false },
            ],
          },
        },
      };
    let v635 = false,
      v636 = false;
    const v637 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    globalThis["window"] = {
      v2Renderer: {
        nodeInstances: new Map([
          [
            "sb-1",
            {
              applyImmediateCellSwap() {
                return {
                  ok: true,
                  revert() {
                    v635 = true;
                  },
                };
              },
            },
          ],
        ]),
        flushNodes() {
          return ((v636 = true), true);
        },
      },
    };
    const v638 = {
      getStateRaw() {
        return v634;
      },
      swapStoryboardCells() {
        return false;
      },
    };
    try {
      const v639 = createDragController({
          store: v638,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v640) {
            return v640 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v641 = v639["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v634["nodes"]["sb-1"]["cells"][0],
            ghostEl: v637,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          25,
        );
      (strict["deepEqual"](v641, { didAct: false, committed: false }),
        strict["equal"](v637["removed"], true),
        strict["equal"](v635, true),
        strict["equal"](v636, false));
    } finally {
      if (typeof v633 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v633;
    }
  }),
  test("DragController: 同源提取图放回宫格优先保留实际显示图", () => {
    const v642 = globalThis["document"],
      v643 = globalThis["window"],
      v644 = globalThis["requestAnimationFrame"],
      v645 = globalThis["setTimeout"],
      v646 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodeIds: ["n1"],
        edges: {},
        ui: { snapGuidesEnabled: false },
        _parentToChildren: {},
        nodes: {
          n1: {
            id: "n1",
            type: "source-image",
            x: 0,
            y: 0,
            width: 120,
            height: 240,
            src: "/output/extracted.jpg",
            localPath: "output/extracted.jpg",
            storyboardExtractedCell: true,
            storyboardSourceIndex: 1,
            storyboardSourceNodeId: "sb-1",
            storyboardSourceLocalPath: "output/full-source.jpg",
            storyboardSourceUrl: "",
          },
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 100,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            isEditing: true,
            storyboardSourceLocalPath: "output/full-source.jpg",
            storyboardSourceWidth: 400,
            storyboardSourceHeight: 800,
            cells: [
              {
                id: "cell-empty",
                isEmpty: true,
                url: "",
                residualImageLocalPath: "output/full-source.jpg",
                residualImageUrl: "/output/full-source.jpg",
                residualImageWidth: 400,
                residualImageHeight: 800,
                residualImageMode: "source",
              },
              { id: "cell-right", isEmpty: true, url: "" },
            ],
          },
        },
      },
      v647 = [];
    let v648 = null,
      v649 = null,
      v650 = null,
      v651 = 0;
    function v652(v653) {
      const v654 = {
        tagName: String(v653)["toUpperCase"](),
        style: {},
        children: [],
        complete: true,
        naturalWidth: 100,
        className: "",
        appendChild(v655) {
          return (this["children"]["push"](v655), v655);
        },
        setAttribute(v656, v657) {
          this[v656] = String(v657);
        },
        getAttribute(v658) {
          return this[v658] || "";
        },
        getContext() {
          return { drawImage() {} };
        },
        toDataURL() {
          return "data:image/png;base64,ghost";
        },
        remove() {
          this["removed"] = true;
        },
      };
      return (v647["push"](v654), v654);
    }
    try {
      ((globalThis["window"] = globalThis),
        (globalThis["v2Renderer"] = {
          getMountedWrapper(v659) {
            if (v659 !== "n1") return null;
            return {
              querySelector() {
                return {
                  complete: true,
                  naturalWidth: 120,
                  naturalHeight: 240,
                  currentSrc: "/output/extracted.jpg",
                  src: "/output/extracted.jpg",
                };
              },
            };
          },
        }),
        (globalThis["document"] = {
          body: {
            classList: createClassList(),
            appendChild(v660) {
              return (v647["push"](v660), v660);
            },
          },
          createElement: v652,
          getElementById(v661) {
            if (v661 !== "cell-sb-1-0") return null;
            return {
              querySelector() {
                return {
                  complete: false,
                  naturalWidth: 0,
                  getAttribute(v662) {
                    return v662 === "src" ? "/output/extracted.jpg" : "";
                  },
                };
              },
            };
          },
        }),
        (globalThis["requestAnimationFrame"] = (v663) => {
          return (v663(), 1);
        }),
        (globalThis["setTimeout"] = (v664) => {
          return (v664(), 1);
        }));
      const v665 = {
          getStateRaw() {
            return v646;
          },
          updateNodeData(v666, v667) {
            ((v648 = { nodeId: v666, patch: v667 }),
              (v646["nodes"][v666] = { ...v646["nodes"][v666], ...v667 }));
          },
          setSelectedNodes(v668) {
            ((v649 = v668), (v646["selectedNodeIds"] = [...v668]));
          },
          deleteNodes(v669) {
            v650 = v669;
          },
          moveNodes() {},
          batch(v670) {
            v670();
          },
          groupNodes() {},
        },
        v671 = createDragController({
          store: v665,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v672) {
            return v672 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {
            v651 += 1;
          },
        }),
        v673 = v671["finishDraggingNodes"](createNodeDragContext(), 125, 50);
      (strict["deepEqual"](v673, { earlyCommit: true, didAct: true }),
        strict["equal"](v648?.["nodeId"], "sb-1"),
        strict["deepEqual"](v648?.["patch"]?.["cells"]?.[0], {
          id: "cell-generated",
          url: "",
          localPath: "output/extracted.jpg",
          originalLocalPath: null,
          displayLocalPath: "",
          thumbUrl: "",
          thumbLocalPath: null,
          thumbId: null,
          capturePreviewUrl: "",
          fileName: "",
          originalWidth: null,
          originalHeight: null,
          imageWidth: null,
          imageHeight: null,
          w: null,
          h: null,
          sourceId: null,
          residualImageLocalPath: "output/full-source.jpg",
          residualImageUrl: "/output/full-source.jpg",
          residualImageWidth: 400,
          residualImageHeight: 800,
          residualImageMode: "source",
          storyboardExtractedCell: true,
          storyboardLockedCell: false,
          storyboardPiece: false,
          storyboardSourceIndex: 1,
          sourceLocalPath: null,
          sourceUrl: "",
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          isEmpty: false,
          col: 0,
          row: 0,
        }),
        strict["deepEqual"](v649, []),
        strict["deepEqual"](v650, ["n1"]),
        strict["equal"](v651, 1));
      const v674 = v647["find"](
        (v675) => v675["className"] === "v2-ghost-image",
      );
      strict["equal"](v674?.["removed"], true);
    } finally {
      if (v642 === undefined) delete globalThis["document"];
      else globalThis["document"] = v642;
      if (v643 === undefined) delete globalThis["window"];
      else globalThis["window"] = v643;
      if (v644 === undefined) delete globalThis["requestAnimationFrame"];
      else globalThis["requestAnimationFrame"] = v644;
      if (v645 === undefined) delete globalThis["setTimeout"];
      else globalThis["setTimeout"] = v645;
      delete globalThis["v2Renderer"];
    }
  }),
  test("DragController: 放回的提取图再次移格会冻结实际图快照", () => {
    const v676 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: [],
      edges: {},
      nodes: {
        "sb-1": {
          id: "sb-1",
          type: "storyboard",
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          cols: 2,
          rows: 1,
          cells: [
            {
              id: "cell-returned",
              url: "",
              localPath: "output/extracted.jpg",
              storyboardExtractedCell: true,
              storyboardSourceIndex: 1,
              sourceLocalPath: null,
              sourceUrl: "",
              storyboardSourceCrop: false,
              isEmpty: false,
              col: 0,
              row: 0,
            },
            { id: "cell-empty", url: "", isEmpty: true, col: 1, row: 0 },
          ],
        },
      },
    };
    let v677 = null;
    const v678 = {
        remove() {
          this["removed"] = true;
        },
      },
      v679 = {
        getStateRaw() {
          return v676;
        },
        updateNodeData(v680, v681) {
          ((v677 = { nodeId: v680, patch: v681 }),
            (v676["nodes"][v680] = { ...v676["nodes"][v680], ...v681 }));
        },
      },
      v682 = createDragController({
        store: v679,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(v683) {
          return v683 + "-generated";
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
      }),
      v684 = v682["finishDraggingCell"](
        {
          targetNodeId: "sb-1",
          sourceCellIndex: 0,
          draggedCellData: v676["nodes"]["sb-1"]["cells"][0],
          ghostEl: v678,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        150,
        50,
      );
    (strict["deepEqual"](v684, { didAct: true, committed: true }),
      strict["equal"](v677["nodeId"], "sb-1"),
      strict["equal"](
        v676["nodes"]["sb-1"]["cells"][1]["localPath"],
        "output/extracted.jpg",
      ),
      strict["equal"](
        v676["nodes"]["sb-1"]["cells"][1]["sourceLocalPath"],
        null,
      ),
      strict["equal"](v676["nodes"]["sb-1"]["cells"][1]["sourceUrl"], ""),
      strict["equal"](
        v676["nodes"]["sb-1"]["cells"][1]["storyboardSourceCrop"],
        false,
      ),
      strict["equal"](
        v676["nodes"]["sb-1"]["cells"][1]["storyboardPiece"],
        false,
      ),
      strict["equal"](v678["removed"], true));
  }),
  test("DragController: 多轮交换后拖出仍使用当前显示图", () => {
    const v685 = {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: [],
      edges: {},
      nodes: {
        "sb-1": {
          id: "sb-1",
          type: "storyboard",
          x: 0,
          y: 0,
          width: 300,
          height: 100,
          cols: 3,
          rows: 1,
          cells: [
            { id: "cell-a", localPath: "output/a.png", isEmpty: false },
            { id: "cell-b", localPath: "output/b.png", isEmpty: false },
            { id: "cell-c", url: "", isEmpty: true },
          ],
        },
      },
    };
    let v686 = null;
    const v687 = {
        getStateRaw() {
          return v685;
        },
        updateNodeData(v688, v689) {
          v685["nodes"][v688] = { ...v685["nodes"][v688], ...v689 };
        },
        batch(v690) {
          v690();
        },
        addNode(v691) {
          ((v686 = v691), (v685["nodes"][v691["id"]] = v691));
        },
        setSelectedNodes(v692) {
          v685["selectedNodeIds"] = v692;
        },
      },
      v693 = createDragController({
        store: v687,
        isNodeType: isNodeType,
        getShortcuts() {
          return {};
        },
        hitTestNode() {
          return null;
        },
        screenToWorld: identityScreenToWorld,
        generateId(v694) {
          return v694 + "-generated";
        },
        cloneNodesWithEdges() {
          return {};
        },
        commit() {},
      });
    (strict["deepEqual"](
      v693["finishDraggingCell"](
        {
          targetNodeId: "sb-1",
          sourceCellIndex: 0,
          draggedCellData: v685["nodes"]["sb-1"]["cells"][0],
          ghostEl: null,
          sourceCellEl: null,
          lastHoverNodeId: null,
        },
        150,
        50,
      ),
      { didAct: true, committed: true },
    ),
      strict["equal"](
        v685["nodes"]["sb-1"]["cells"][1]["localPath"],
        "output/a.png",
      ),
      strict["deepEqual"](
        v693["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 1,
            draggedCellData: v685["nodes"]["sb-1"]["cells"][1],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          250,
          50,
        ),
        { didAct: true, committed: true },
      ),
      strict["equal"](
        v685["nodes"]["sb-1"]["cells"][2]["localPath"],
        "output/a.png",
      ),
      strict["equal"](
        v685["nodes"]["sb-1"]["cells"][2]["sourceLocalPath"],
        null,
      ),
      strict["equal"](
        v685["nodes"]["sb-1"]["cells"][2]["storyboardPiece"],
        false,
      ),
      strict["deepEqual"](
        v693["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 2,
            draggedCellData: v685["nodes"]["sb-1"]["cells"][2],
            ghostEl: null,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          500,
          50,
        ),
        { didAct: true, committed: true },
      ),
      strict["equal"](v686?.["src"], "/output/a.png"),
      strict["equal"](v686?.["localPath"], "output/a.png"),
      strict["equal"](v685["nodes"]["sb-1"]["cells"][2]["isEmpty"], true));
  }),
  test("DragController: source crop without visible image no-ops before visual swap", () => {
    const v695 = globalThis["window"],
      v696 = globalThis["document"],
      v697 = {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: {
          "sb-1": {
            id: "sb-1",
            type: "storyboard",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            cols: 2,
            rows: 1,
            cells: [
              {
                id: "cell-live",
                sourceUrl: "/output/full.png",
                storyboardSourceCrop: true,
                isEmpty: false,
              },
              {
                id: "cell-target",
                localPath: "output/target.png",
                isEmpty: false,
              },
            ],
          },
        },
      };
    let v698 = false,
      v699 = false;
    const v700 = {
      removed: false,
      remove() {
        this["removed"] = true;
      },
    };
    ((globalThis["document"] = {
      getElementById() {
        return null;
      },
    }),
      (globalThis["window"] = {
        v2Renderer: {
          nodeInstances: new Map([
            [
              "sb-1",
              {
                applyImmediateCellSwap() {
                  return ((v698 = true), { ok: true, revert() {} });
                },
              },
            ],
          ]),
        },
      }));
    const v701 = {
      getStateRaw() {
        return v697;
      },
      updateNodeData() {
        v699 = true;
      },
    };
    try {
      const v702 = createDragController({
          store: v701,
          isNodeType: isNodeType,
          getShortcuts() {
            return {};
          },
          hitTestNode() {
            return null;
          },
          screenToWorld: identityScreenToWorld,
          generateId(v703) {
            return v703 + "-generated";
          },
          cloneNodesWithEdges() {
            return {};
          },
          commit() {},
        }),
        v704 = v702["finishDraggingCell"](
          {
            targetNodeId: "sb-1",
            sourceCellIndex: 0,
            draggedCellData: v697["nodes"]["sb-1"]["cells"][0],
            ghostEl: v700,
            sourceCellEl: null,
            lastHoverNodeId: null,
          },
          150,
          50,
        );
      (strict["deepEqual"](v704, { didAct: false, committed: false }),
        strict["equal"](v698, false),
        strict["equal"](v699, false),
        strict["equal"](v700["removed"], true));
    } finally {
      if (typeof v695 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v695;
      if (typeof v696 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v696;
    }
  }));

import test from "node:test";
import strict from "node:assert/strict";
import {
  installNodeResizeGeometryPreviewer,
  previewNodeResizeGeometry,
} from "./rendererResizePreview.js";
(test("previewNodeResizeGeometry rerenders affected edges with preview size", () => {
  const v0 = {
      _edgesRev: 7,
      viewport: { zoom: 1 },
      nodes: {
        "node-1": { id: "node-1", width: 200, height: 120 },
        "node-2": { id: "node-2", width: 100, height: 80 },
      },
      edges: {
        "edge-1": { id: "edge-1", sourceId: "node-1", targetId: "node-2" },
      },
    },
    v1 = new Map([["node-1", new Set(["edge-1"])]]),
    v2 = [],
    v3 = [],
    v4 = previewNodeResizeGeometry(
      { nodeId: "node-1", width: 240, height: 150 },
      {
        snapshot: v0,
        nodeToEdgeIds: v1,
        ensureEdgeIndex: (v5, v6) => v2["push"]({ edges: v5, rev: v6 }),
        renderEdgesByIds: (v7, v8, v9) =>
          v3["push"]({ edgeIds: v7, nodes: v8, usedSnapshot: v9 }),
      },
    );
  (strict["equal"](v4, true),
    strict["deepEqual"](v2, [{ edges: v0["edges"], rev: 7 }]),
    strict["equal"](v3["length"], 1),
    strict["deepEqual"]([...v3[0]["edgeIds"]], ["edge-1"]),
    strict["equal"](v3[0]["nodes"]["node-1"]["width"], 240),
    strict["equal"](v3[0]["nodes"]["node-1"]["height"], 150),
    strict["equal"](v3[0]["nodes"]["node-2"], v0["nodes"]["node-2"]),
    strict["equal"](v3[0]["usedSnapshot"], v0),
    strict["equal"](v0["nodes"]["node-1"]["width"], 200));
}),
  test("installNodeResizeGeometryPreviewer exposes renderer bridge", () => {
    const v10 = {},
      v11 = {
        nodes: { "node-1": { id: "node-1", width: 100, height: 100 } },
        edges: {},
      },
      v12 = installNodeResizeGeometryPreviewer(
        v10,
        () => v11,
        () => {},
        new Map(),
        () => {},
      );
    (strict["equal"](v12, true),
      strict["equal"](
        v10["v2Renderer"]["previewNodeResizeGeometry"]({
          nodeId: "node-1",
          width: 120,
          height: 130,
        }),
        true,
      ));
  }));

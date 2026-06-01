import test from "node:test";
import strict from "node:assert/strict";
import { startNodeResizePreview } from "./nodeResizePreview.js";
import {
  getPerfProbeSnapshot,
  resetPerfProbeData,
  setPerfProbeEnabled,
} from "../perf/perfProbe.js";
function createClassList() {
  const v0 = new Set();
  return {
    add(...v1) {
      v1["forEach"]((v2) => v0["add"](String(v2)));
    },
    remove(...v3) {
      v3["forEach"]((v4) => v0["delete"](String(v4)));
    },
    contains(v5) {
      return v0["has"](String(v5));
    },
  };
}
function withFakeBrowser(v6) {
  const v7 = {
      window: globalThis["window"],
      document: globalThis["document"],
      requestAnimationFrame: globalThis["requestAnimationFrame"],
      cancelAnimationFrame: globalThis["cancelAnimationFrame"],
    },
    v8 = {
      window: Object["prototype"]["hasOwnProperty"]["call"](
        globalThis,
        "window",
      ),
      document: Object["prototype"]["hasOwnProperty"]["call"](
        globalThis,
        "document",
      ),
      requestAnimationFrame: Object["prototype"]["hasOwnProperty"]["call"](
        globalThis,
        "requestAnimationFrame",
      ),
      cancelAnimationFrame: Object["prototype"]["hasOwnProperty"]["call"](
        globalThis,
        "cancelAnimationFrame",
      ),
    },
    v9 = createClassList(),
    v10 = createClassList(),
    v11 = { style: {}, classList: v10 },
    v12 = {},
    v13 = [],
    v14 = [],
    v15 = [];
  let v16 = 1,
    v17 = 0;
  ((globalThis["document"] = {
    body: { classList: v9 },
    getElementById(v18) {
      return v18 === "node-1" ? v11 : null;
    },
    querySelectorAll() {
      return [];
    },
  }),
    (globalThis["window"] = {
      __perfProbeEnabled: false,
      location: { href: "http://127.0.0.1/" },
      document: globalThis["document"],
      performance: { getEntriesByType: () => [] },
      _lastMx: 333,
      _lastMy: 444,
      v2Renderer: {
        previewNodeResizeGeometry(v19) {
          v14["push"](v19);
        },
      },
      _v2UpdateSidePlusNow(v20, v21, v22) {
        v15["push"]({ x: v20, y: v21, options: v22 });
      },
      addEventListener(v23, v24) {
        v12[v23] = v24;
      },
      removeEventListener(v25, v26) {
        if (v12[v25] === v26) delete v12[v25];
      },
    }),
    (globalThis["requestAnimationFrame"] = (v27) => {
      const v28 = v16;
      return (
        (v16 += 1),
        v13["push"]({ id: v28, callback: v27, cancelled: false }),
        v28
      );
    }),
    (globalThis["cancelAnimationFrame"] = (v29) => {
      const v30 = v13["find"]((v31) => v31["id"] === v29);
      if (v30) v30["cancelled"] = true;
    }));
  const v32 = {
    bodyClassList: v9,
    nodeClassList: v10,
    nodeEl: v11,
    listeners: v12,
    rendererCalls: v14,
    sidePlusCalls: v15,
    flushRaf() {
      const v33 = v13["splice"](0);
      for (const v34 of v33) {
        if (v34["cancelled"]) continue;
        ((v17 += 16), v34["callback"](v17));
      }
    },
  };
  try {
    return v6(v32);
  } finally {
    for (const v35 of Object["keys"](v7)) {
      if (v8[v35]) globalThis[v35] = v7[v35];
      else delete globalThis[v35];
    }
  }
}
(test("node resize preview updates DOM per frame and commits once", () => {
  withFakeBrowser(
    ({
      bodyClassList: v36,
      nodeClassList: v37,
      nodeEl: v38,
      listeners: v39,
      rendererCalls: v40,
      sidePlusCalls: v41,
      flushRaf: v42,
    }) => {
      const v43 = [];
      let v44 = 0,
        v45 = 0;
      const v46 = startNodeResizePreview({
        event: {
          clientX: 100,
          clientY: 100,
          preventDefault() {},
          stopPropagation() {},
        },
        nodeId: "node-1",
        getNode: () => ({ id: "node-1", width: 200, height: 120 }),
        getViewport: () => ({ zoom: 2 }),
        resolveSize: ({
          startWidth: v47,
          startHeight: v48,
          dx: v49,
          dy: v50,
        }) => ({ width: v47 + v49, height: v48 + v50 }),
        applyPatch: (v51) => v43["push"](v51),
        onPreview: () => {
          v45 += 1;
        },
        commit: () => {
          v44 += 1;
        },
      });
      (strict["equal"](v46, true),
        strict["equal"](v36["contains"]("is-node-resizing"), true),
        strict["equal"](v37["contains"]("is-resizing"), true),
        v39["pointermove"]({ clientX: 120, clientY: 110 }),
        v39["pointermove"]({ clientX: 160, clientY: 140 }),
        strict["deepEqual"](v43, []),
        strict["deepEqual"](v38["style"], {}),
        v42(),
        strict["equal"](v38["style"]["width"], "230px"),
        strict["equal"](v38["style"]["height"], "140px"),
        strict["equal"](v45, 1),
        strict["deepEqual"](v40, [
          { nodeId: "node-1", width: 230, height: 140 },
        ]),
        strict["equal"](v41["length"], 1),
        strict["equal"](v41[0]["x"], 333),
        strict["equal"](v41[0]["y"], 444),
        strict["deepEqual"](v41[0]["options"]["nodeSizeOverrides"], {
          "node-1": { width: 230, height: 140 },
        }),
        v39["pointerup"](),
        strict["deepEqual"](v43, [{ width: 230, height: 140 }]),
        strict["equal"](v44, 1),
        strict["equal"](v40["length"], 2),
        strict["deepEqual"](v40["at"](-1), {
          nodeId: "node-1",
          width: 230,
          height: 140,
        }),
        strict["equal"](v41["length"], 2),
        strict["deepEqual"](v41["at"](-1)["options"]["nodeSizeOverrides"], {
          "node-1": { width: 230, height: 140 },
        }),
        strict["equal"](v36["contains"]("is-node-resizing"), false),
        strict["equal"](v37["contains"]("is-resizing"), false),
        strict["equal"](v39["pointermove"], undefined));
    },
  );
}),
  test("node\x20resize\x20preview\x20records\x20resize\x20fps\x20sessions", () => {
    withFakeBrowser(({ listeners: v52, flushRaf: v53 }) => {
      (setPerfProbeEnabled(true),
        resetPerfProbeData(),
        startNodeResizePreview({
          event: {
            clientX: 0,
            clientY: 0,
            preventDefault() {},
            stopPropagation() {},
          },
          nodeId: "node-1",
          getNode: () => ({ id: "node-1", width: 100, height: 100 }),
          getViewport: () => ({ zoom: 1 }),
          resolveSize: ({
            startWidth: v54,
            startHeight: v55,
            dx: v56,
            dy: v57,
          }) => ({ width: v54 + v56, height: v55 + v57 }),
          applyPatch() {},
          commit() {},
          label: "test-resize",
        }),
        v52["pointermove"]({ clientX: 10, clientY: 10 }),
        v53(),
        v53(),
        v52["pointerup"]());
      const v58 = getPerfProbeSnapshot();
      (strict["equal"](v58["resizeFpsSessions"]["length"], 1),
        strict["equal"](v58["resizeFpsSessions"][0]["label"], "test-resize"),
        resetPerfProbeData(),
        setPerfProbeEnabled(false));
    });
  }));

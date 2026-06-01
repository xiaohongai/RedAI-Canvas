import test from "node:test";
import strict from "node:assert/strict";
import { createNodeResizeHandle } from "./nodeResizeUi.js";
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
function createElement() {
  const v6 = {};
  return {
    style: {},
    className: "",
    classList: createClassList(),
    addEventListener(v7, v8) {
      v6[v7] = v8;
    },
    _listeners: v6,
  };
}
function withFakeBrowser(v9) {
  const v10 = {
      window: globalThis["window"],
      document: globalThis["document"],
      requestAnimationFrame: globalThis["requestAnimationFrame"],
      cancelAnimationFrame: globalThis["cancelAnimationFrame"],
    },
    v11 = Object["fromEntries"](
      Object["keys"](v10)["map"]((v12) => [
        v12,
        Object["prototype"]["hasOwnProperty"]["call"](globalThis, v12),
      ]),
    ),
    v13 = {},
    v14 = [],
    v15 = createElement();
  let v16 = 1;
  ((globalThis["document"] = {
    body: { classList: createClassList() },
    createElement: createElement,
    getElementById(v17) {
      return v17 === "node-1" ? v15 : null;
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
      addEventListener(v18, v19) {
        v13[v18] = v19;
      },
      removeEventListener(v20, v21) {
        if (v13[v20] === v21) delete v13[v20];
      },
    }),
    (globalThis["requestAnimationFrame"] = (v22) => {
      const v23 = v16;
      return (
        (v16 += 1),
        v14["push"]({ id: v23, callback: v22, cancelled: false }),
        v23
      );
    }),
    (globalThis["cancelAnimationFrame"] = (v24) => {
      const v25 = v14["find"]((v26) => v26["id"] === v24);
      if (v25) v25["cancelled"] = true;
    }));
  const v27 = {
    listeners: v13,
    previewEl: v15,
    flushRaf() {
      const v28 = v14["splice"](0);
      v28["forEach"]((v29) => {
        if (!v29["cancelled"]) v29["callback"](16);
      });
    },
  };
  try {
    return v9(v27);
  } finally {
    Object["keys"](v10)["forEach"]((v30) => {
      if (v11[v30]) globalThis[v30] = v10[v30];
      else delete globalThis[v30];
    });
  }
}
test("createNodeResizeHandle: honors custom minimum size", () => {
  withFakeBrowser(({ listeners: v31, flushRaf: v32, previewEl: v33 }) => {
    const v34 = {
        id: "node-1",
        width: 1200,
        height: 700,
        resizeMinWidth: 1024,
        resizeMinHeight: 576,
      },
      v35 = [];
    let v36 = 0;
    const v37 = createNodeResizeHandle(
      { nodeId: "node-1", _data: v34 },
      {
        store: {
          updateNodeData(v38, v39) {
            (v35["push"]({ id: v38, patch: v39 }), Object["assign"](v34, v39));
          },
        },
        getStateSnapshot: () => ({
          viewport: { zoom: 1 },
          nodes: { "node-1": v34 },
        }),
        commit: () => {
          v36 += 1;
        },
        resolveMinSize: (v40) => ({
          width: v40["resizeMinWidth"],
          height: v40["resizeMinHeight"],
        }),
      },
    );
    (v37["_listeners"]["pointerdown"]({
      clientX: 0,
      clientY: 0,
      preventDefault() {},
      stopPropagation() {},
    }),
      v31["pointermove"]({ clientX: -500, clientY: -500 }),
      v32(),
      v31["pointerup"](),
      strict["equal"](v33["style"]["width"], "1024px"),
      strict["equal"](v33["style"]["height"], "576px"),
      strict["deepEqual"](v35, [
        { id: "node-1", patch: { width: 1024, height: 576 } },
      ]),
      strict["equal"](v36, 1));
  });
});

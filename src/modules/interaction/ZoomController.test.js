import test from "node:test";
import strict from "node:assert/strict";
import { createZoomController } from "./ZoomController.js";
function createClassList() {
  const v0 = new Set();
  return {
    add(...v1) {
      v1["forEach"]((v2) => v0["add"](String(v2)));
    },
    remove(...v3) {
      v3["forEach"]((v4) => v0["delete"](String(v4)));
    },
    toggle(v5, v6) {
      const v7 = String(v5),
        v8 = v6 === undefined ? !v0["has"](v7) : !!v6;
      if (v8) v0["add"](v7);
      else v0["delete"](v7);
      return v8;
    },
    contains(v9) {
      return v0["has"](String(v9));
    },
  };
}
function withFakeBrowser(v10) {
  const v11 = Object["prototype"]["hasOwnProperty"]["call"](
      globalThis,
      "window",
    ),
    v12 = Object["prototype"]["hasOwnProperty"]["call"](globalThis, "document"),
    v13 = Object["prototype"]["hasOwnProperty"]["call"](
      globalThis,
      "requestAnimationFrame",
    ),
    v14 = Object["prototype"]["hasOwnProperty"]["call"](
      globalThis,
      "cancelAnimationFrame",
    ),
    v15 = Object["prototype"]["hasOwnProperty"]["call"](
      globalThis,
      "setTimeout",
    ),
    v16 = Object["prototype"]["hasOwnProperty"]["call"](
      globalThis,
      "clearTimeout",
    ),
    v17 = globalThis["window"],
    v18 = globalThis["document"],
    v19 = globalThis["requestAnimationFrame"],
    v20 = globalThis["cancelAnimationFrame"],
    v21 = globalThis["setTimeout"],
    v22 = globalThis["clearTimeout"],
    v23 = createClassList(),
    v24 = [],
    v25 = [],
    v26 = [];
  let v27 = 0,
    v28 = 1,
    v29 = 1;
  ((globalThis["document"] = { body: { classList: v23 } }),
    (globalThis["window"] = {
      _lastMx: 150,
      _lastMy: 160,
      __perfProbeEnabled: false,
      location: { href: "http://127.0.0.1/" },
      document: { querySelectorAll: () => [] },
      performance: { getEntriesByType: () => [] },
      _v2UpdateSidePlusNow(v30, v31) {
        v24["push"]({ x: v30, y: v31 });
      },
    }),
    (globalThis["requestAnimationFrame"] = (v32) => {
      const v33 = v28;
      return (
        (v28 += 1),
        v25["push"]({ id: v33, callback: v32, cancelled: false }),
        v33
      );
    }),
    (globalThis["cancelAnimationFrame"] = (v34) => {
      const v35 = v25["find"]((v36) => v36["id"] === v34);
      if (v35) v35["cancelled"] = true;
    }),
    (globalThis["setTimeout"] = (v37, v38) => {
      const v39 = v29;
      return (
        (v29 += 1),
        v26["push"]({ id: v39, callback: v37, ms: v38, cancelled: false }),
        v39
      );
    }),
    (globalThis["clearTimeout"] = (v40) => {
      const v41 = v26["find"]((v42) => v42["id"] === v40);
      if (v41) v41["cancelled"] = true;
    }));
  const v43 = {
    classList: v23,
    plusCalls: v24,
    flushRaf() {
      const v44 = v25["splice"](0);
      for (const v45 of v44) {
        if (v45["cancelled"]) continue;
        ((v27 += 16), v45["callback"](v27));
      }
    },
    runTimers() {
      const v46 = v26["splice"](0);
      for (const v47 of v46) {
        if (!v47["cancelled"]) v47["callback"]();
      }
    },
  };
  try {
    return v10(v43);
  } finally {
    if (v11) globalThis["window"] = v17;
    else delete globalThis["window"];
    if (v12) globalThis["document"] = v18;
    else delete globalThis["document"];
    if (v13) globalThis["requestAnimationFrame"] = v19;
    else delete globalThis["requestAnimationFrame"];
    if (v14) globalThis["cancelAnimationFrame"] = v20;
    else delete globalThis["cancelAnimationFrame"];
    if (v15) globalThis["setTimeout"] = v21;
    else delete globalThis["setTimeout"];
    if (v16) globalThis["clearTimeout"] = v22;
    else delete globalThis["clearTimeout"];
  }
}
function createStore(v48 = { x: 0, y: 0, zoom: 1 }) {
  const v49 = { viewport: { ...v48 }, edges: {} },
    v50 = [],
    v51 = [];
  return {
    state: v49,
    updates: v50,
    order: v51,
    persistCount: 0,
    store: {
      getStateRaw() {
        return v49;
      },
      updateViewport(v52, v53, v54) {
        (v50["push"]({ x: v52, y: v53, zoom: v54 }),
          v51["push"]("update"),
          (v49["viewport"] = { x: v52, y: v53, zoom: v54 }));
      },
      markViewportPersist() {
        (v51["push"]("persist"), (this["persistCount"] += 1));
      },
    },
  };
}
(test("ZoomController batches wheel viewport updates into one frame", () => {
  withFakeBrowser(
    ({ classList: v55, plusCalls: v56, flushRaf: v57, runTimers: v58 }) => {
      const v59 = createStore(),
        v60 = createZoomController({ store: v59["store"] });
      (v60["handleWheel"](100, 100, -1),
        v60["handleWheel"](100, 100, -1),
        strict["equal"](v59["updates"]["length"], 0),
        strict["equal"](v55["contains"]("is-zooming"), true),
        v57(),
        strict["equal"](v59["updates"]["length"], 1),
        strict["equal"](Math["round"](v59["updates"][0]["zoom"] * 100), 121),
        strict["equal"](Math["round"](v59["updates"][0]["x"]), -21),
        strict["equal"](Math["round"](v59["updates"][0]["y"]), -21),
        strict["deepEqual"](v56, [{ x: 150, y: 160 }]),
        v58(),
        strict["equal"](v55["contains"]("is-zooming"), false),
        strict["deepEqual"](v59["order"], ["update", "persist"]));
    },
  );
}),
  test("ZoomController\x20flushes\x20pending\x20viewport\x20before\x20zoom-end\x20persist", () => {
    withFakeBrowser(({ classList: v61, flushRaf: v62, runTimers: v63 }) => {
      const v64 = createStore(),
        v65 = createZoomController({ store: v64["store"] });
      (v65["handleWheel"](100, 100, -1),
        v63(),
        strict["equal"](v64["updates"]["length"], 1),
        strict["deepEqual"](v64["order"], ["update", "persist"]),
        strict["equal"](v61["contains"]("is-zooming"), false),
        v62(),
        strict["equal"](v64["updates"]["length"], 1));
    });
  }));

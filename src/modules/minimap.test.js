import test from "node:test";
import strict from "node:assert/strict";
import { initMinimap } from "./minimap.js";
import { calcWorldBounds } from "../core/math.js";
function createStyle() {
  return {
    removeProperty(v0) {
      delete this[String(v0 || "")];
    },
  };
}
function createFakeElement({
  id: id = "",
  width: width = 0,
  height: height = 0,
  left: left = 0,
  top: top = 0,
} = {}) {
  const v1 = new Map();
  return {
    id: id,
    style: createStyle(),
    className: "",
    children: [],
    clientWidth: width,
    clientHeight: height,
    parentNode: null,
    appendChild(v2) {
      return (this["children"]["push"](v2), (v2["parentNode"] = this), v2);
    },
    removeChild(v3) {
      const v4 = this["children"]["indexOf"](v3);
      if (v4 >= 0) this["children"]["splice"](v4, 1);
      v3["parentNode"] = null;
    },
    remove() {
      this["parentNode"]?.["removeChild"]?.(this);
    },
    addEventListener(v5, v6) {
      const v7 = String(v5 || ""),
        v8 = v1["get"](v7) || [];
      (v8["push"](v6), v1["set"](v7, v8));
    },
    dispatch(v9, v10 = {}) {
      const v11 = v1["get"](String(v9 || "")) || [];
      for (const v12 of v11) v12(v10);
    },
    setPointerCapture() {},
    releasePointerCapture() {},
    getBoundingClientRect() {
      return {
        left: left,
        top: top,
        width: width,
        height: height,
        right: left + width,
        bottom: top + height,
      };
    },
  };
}
function computeExpectedViewportBox({
  viewport: v13,
  mapW: v14,
  mapH: v15,
  innerWidth: v16,
  innerHeight: v17,
}) {
  const v18 = calcWorldBounds({}, v13),
    v19 = Math["max"](v18["width"], 1000),
    v20 = Math["max"](v18["height"], 1000),
    v21 = Math["min"](v14 / v19, v15 / v20),
    v22 = (v14 - v19 * v21) / 2,
    v23 = (v15 - v20 * v21) / 2,
    v24 = v16 / v13["zoom"],
    v25 = v17 / v13["zoom"],
    v26 = -v13["x"] / v13["zoom"],
    v27 = -v13["y"] / v13["zoom"];
  return {
    bounds: v18,
    scale: v21,
    offsetX: v22,
    offsetY: v23,
    left: v22 + (v26 - v18["minX"]) * v21,
    top: v23 + (v27 - v18["minY"]) * v21,
    width: v24 * v21,
    height: v25 * v21,
  };
}
function createStore(v28) {
  let v29 = v28;
  const v30 = [],
    v31 = [],
    v32 = () => {
      v30["forEach"]((v33) => {
        const v34 = v33["selector"](v29);
        if (Object["is"](v33["lastValue"], v34)) return;
        ((v33["lastValue"] = v34), v33["callback"](v34));
      });
    };
  return {
    getStateRaw() {
      return v29;
    },
    subscribeSelector(v35, v36) {
      const v37 = { selector: v35, callback: v36, lastValue: v35(v29) };
      return (
        v30["push"](v37),
        () => {
          const v38 = v30["indexOf"](v37);
          if (v38 >= 0) v30["splice"](v38, 1);
        }
      );
    },
    setState(v39 = {}) {
      ((v29 = { ...v29, ...v39 }), v32());
    },
    updateViewport(v40, v41, v42) {
      (v31["push"]({ x: v40, y: v41, zoom: v42 }),
        (v29 = { ...v29, viewport: { x: v40, y: v41, zoom: v42 } }),
        v32());
    },
    getViewportUpdates() {
      return v31["slice"]();
    },
  };
}
function installMinimapDomStubs() {
  const v43 = globalThis["window"],
    v44 = globalThis["document"],
    v45 = globalThis["requestAnimationFrame"],
    v46 = globalThis["cancelAnimationFrame"],
    v47 = createFakeElement({
      id: "minimap",
      width: 200,
      height: 140,
      left: 10,
      top: 20,
    }),
    v48 = createFakeElement({ id: "minimapViewport" }),
    v49 = createFakeElement({ id: "minimapWrapper" }),
    v50 = createFakeElement({ id: "v2-wrap" }),
    v51 = new Map([
      ["minimapViewport", v48],
      ["minimapWrapper", v49],
      ["v2-wrap", v50],
    ]);
  return (
    (globalThis["window"] = {
      innerWidth: 1200,
      innerHeight: 800,
      _v2MinimapScale: 0,
    }),
    (globalThis["document"] = {
      createElement() {
        return createFakeElement();
      },
      getElementById(v52) {
        return v51["get"](String(v52 || "")) || null;
      },
    }),
    (globalThis["requestAnimationFrame"] = (v53) => {
      return (v53(), 1);
    }),
    (globalThis["cancelAnimationFrame"] = () => {}),
    {
      minimap: v47,
      minimapViewport: v48,
      minimapWrapper: v49,
      restore() {
        if (typeof v43 === "undefined") delete globalThis["window"];
        else globalThis["window"] = v43;
        if (typeof v44 === "undefined") delete globalThis["document"];
        else globalThis["document"] = v44;
        (typeof v45 === "undefined"
          ? delete globalThis["requestAnimationFrame"]
          : (globalThis["requestAnimationFrame"] = v45),
          typeof v46 === "undefined"
            ? delete globalThis["cancelAnimationFrame"]
            : (globalThis["cancelAnimationFrame"] = v46));
      },
    }
  );
}
(test("minimap: 空画布平移会刷新 viewport 框投影", () => {
  const v54 = installMinimapDomStubs(),
    v55 = createStore({
      nodes: {},
      viewport: { x: 0, y: 0, zoom: 1 },
      _persistRev: 0,
      _nodeCount: 0,
    });
  let v56 = null;
  try {
    v56 = initMinimap(v54["minimap"], v55);
    const v57 = computeExpectedViewportBox({
      viewport: v55["getStateRaw"]()["viewport"],
      mapW: v54["minimap"]["clientWidth"],
      mapH: v54["minimap"]["clientHeight"],
      innerWidth: globalThis["window"]["innerWidth"],
      innerHeight: globalThis["window"]["innerHeight"],
    });
    (strict["equal"](
      v54["minimapViewport"]["style"]["left"],
      v57["left"] + "px",
    ),
      strict["equal"](
        v54["minimapViewport"]["style"]["top"],
        v57["top"] + "px",
      ),
      v55["setState"]({ viewport: { x: 240, y: -120, zoom: 1 } }));
    const v58 = computeExpectedViewportBox({
      viewport: v55["getStateRaw"]()["viewport"],
      mapW: v54["minimap"]["clientWidth"],
      mapH: v54["minimap"]["clientHeight"],
      innerWidth: globalThis["window"]["innerWidth"],
      innerHeight: globalThis["window"]["innerHeight"],
    });
    (strict["equal"](
      v54["minimapViewport"]["style"]["left"],
      v58["left"] + "px",
    ),
      strict["equal"](
        v54["minimapViewport"]["style"]["top"],
        v58["top"] + "px",
      ));
  } finally {
    (v56?.(), v54["restore"]());
  }
}),
  test("minimap: canvas pan preview throttles viewport box updates", () => {
    const v59 = globalThis["setTimeout"],
      v60 = globalThis["clearTimeout"],
      v61 = Object["prototype"]["hasOwnProperty"]["call"](
        globalThis,
        "performance",
      ),
      v62 = globalThis["performance"],
      v63 = [];
    let v64 = 1000;
    ((globalThis["setTimeout"] = (v65, v66) => {
      const v67 = { callback: v65, delay: v66, cancelled: false };
      return (v63["push"](v67), v67);
    }),
      (globalThis["clearTimeout"] = (v68) => {
        if (v68) v68["cancelled"] = true;
      }),
      Object["defineProperty"](globalThis, "performance", {
        configurable: true,
        value: { now: () => v64 },
      }));
    const v69 = installMinimapDomStubs(),
      v70 = createStore({
        nodes: {},
        viewport: { x: 0, y: 0, zoom: 1 },
        _persistRev: 0,
        _nodeCount: 0,
      });
    let v71 = null;
    try {
      v71 = initMinimap(v69["minimap"], v70);
      const v72 = { x: 120, y: -60, zoom: 1 };
      globalThis["window"]["_v2ScheduleMinimapViewportPreview"](v72, {
        force: true,
      });
      const v73 = v69["minimapViewport"]["style"]["left"],
        v74 = v69["minimapViewport"]["style"]["top"];
      v64 = 1020;
      const v75 = { x: 260, y: -90, zoom: 1 };
      (globalThis["window"]["_v2ScheduleMinimapViewportPreview"](v75),
        strict["equal"](v69["minimapViewport"]["style"]["left"], v73),
        strict["equal"](v69["minimapViewport"]["style"]["top"], v74),
        strict["equal"](v63["length"], 1),
        strict["ok"](v63[0]["delay"] > 0),
        strict["ok"](v63[0]["delay"] <= 96),
        (v64 = 1100),
        v63[0]["callback"]());
      const v76 = computeExpectedViewportBox({
        viewport: v75,
        mapW: v69["minimap"]["clientWidth"],
        mapH: v69["minimap"]["clientHeight"],
        innerWidth: globalThis["window"]["innerWidth"],
        innerHeight: globalThis["window"]["innerHeight"],
      });
      (strict["equal"](
        v69["minimapViewport"]["style"]["left"],
        v76["left"] + "px",
      ),
        strict["equal"](
          v69["minimapViewport"]["style"]["top"],
          v76["top"] + "px",
        ),
        strict["deepEqual"](v70["getViewportUpdates"](), []));
    } finally {
      (v71?.(),
        v69["restore"](),
        (globalThis["setTimeout"] = v59),
        (globalThis["clearTimeout"] = v60),
        v61
          ? Object["defineProperty"](globalThis, "performance", {
              configurable: true,
              value: v62,
            })
          : delete globalThis["performance"]);
    }
  }),
  test("minimap: 空画布平移后点击小地图使用最新 bounds", () => {
    const v77 = installMinimapDomStubs(),
      v78 = createStore({
        nodes: {},
        viewport: { x: 180, y: -60, zoom: 1.25 },
        _persistRev: 0,
        _nodeCount: 0,
      });
    let v79 = null;
    try {
      v79 = initMinimap(v77["minimap"], v78);
      const v80 = {
        clientX: 128,
        clientY: 104,
        pointerId: 7,
        stopPropagation() {},
      };
      v77["minimapWrapper"]["dispatch"]("pointerdown", v80);
      const v81 = computeExpectedViewportBox({
          viewport: { x: 180, y: -60, zoom: 1.25 },
          mapW: v77["minimap"]["clientWidth"],
          mapH: v77["minimap"]["clientHeight"],
          innerWidth: globalThis["window"]["innerWidth"],
          innerHeight: globalThis["window"]["innerHeight"],
        }),
        v82 = v77["minimap"]["getBoundingClientRect"](),
        v83 = v80["clientX"] - v82["left"] - v81["offsetX"],
        v84 = v80["clientY"] - v82["top"] - v81["offsetY"],
        v85 = v81["bounds"]["minX"] + v83 / v81["scale"],
        v86 = v81["bounds"]["minY"] + v84 / v81["scale"],
        v87 = {
          x: globalThis["window"]["innerWidth"] / 2 - v85 * 1.25,
          y: globalThis["window"]["innerHeight"] / 2 - v86 * 1.25,
          zoom: 1.25,
        },
        [v88] = v78["getViewportUpdates"]();
      strict["deepEqual"](v88, v87);
    } finally {
      (v79?.(), v77["restore"]());
    }
  }));

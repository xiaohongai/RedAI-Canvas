import test from "node:test";
import strict from "node:assert/strict";
import {
  __desktopMediaWakeServiceForTest,
  initDesktopMediaWakeService,
} from "./desktopMediaWakeService.js";
class FakeCustomEvent {
  constructor(v0, v1 = {}) {
    ((this["type"] = v0), (this["detail"] = v1["detail"]));
  }
}
(test("desktop media wake: init emits wake notifications without media source resets", () => {
  const v2 = globalThis["window"],
    v3 = globalThis["document"],
    v4 = globalThis["CustomEvent"],
    v5 = new Map(),
    v6 = new Map(),
    v7 = [];
  try {
    ((globalThis["CustomEvent"] = FakeCustomEvent),
      (globalThis["window"] = {
        electronAPI: {},
        addEventListener(v8, v9) {
          v5["set"](v8, v9);
        },
        dispatchEvent(v10) {
          v7["push"](v10);
        },
      }),
      (globalThis["document"] = {
        visibilityState: "visible",
        addEventListener(v11, v12) {
          v6["set"](v11, v12);
        },
      }),
      initDesktopMediaWakeService(),
      strict["deepEqual"]([...v5["keys"]()]["sort"](), ["focus", "pageshow"]),
      strict["deepEqual"]([...v6["keys"]()], ["visibilitychange"]),
      strict["equal"](v5["has"]("pause"), false),
      strict["equal"](v5["has"]("pointerover"), false),
      strict["equal"](v6["has"]("pause"), false),
      strict["equal"](v6["has"]("pointerover"), false),
      v5["get"]("focus")(),
      v5["get"]("pageshow")(),
      v6["get"]("visibilitychange")(),
      strict["deepEqual"](
        v7["map"]((v13) => [v13["type"], v13["detail"]["reason"]]),
        [
          ["aicanvas:desktop-media-wake", "focus"],
          ["aicanvas:desktop-media-wake", "pageshow"],
          ["aicanvas:desktop-media-wake", "visibilitychange"],
        ],
      ));
  } finally {
    if (typeof v2 === "undefined") delete globalThis["window"];
    else globalThis["window"] = v2;
    if (typeof v3 === "undefined") delete globalThis["document"];
    else globalThis["document"] = v3;
    if (typeof v4 === "undefined") delete globalThis["CustomEvent"];
    else globalThis["CustomEvent"] = v4;
  }
}),
  test("desktop media wake: direct notification carries reason", () => {
    const v14 = globalThis["window"],
      v15 = globalThis["CustomEvent"],
      v16 = [];
    try {
      ((globalThis["CustomEvent"] = FakeCustomEvent),
        (globalThis["window"] = {
          dispatchEvent(v17) {
            v16["push"](v17);
          },
        }),
        __desktopMediaWakeServiceForTest["dispatchRendererWake"]("manual"),
        strict["equal"](v16["length"], 1),
        strict["equal"](v16[0]["type"], "aicanvas:desktop-media-wake"),
        strict["equal"](v16[0]["detail"]["reason"], "manual"));
    } finally {
      if (typeof v14 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v14;
      if (typeof v15 === "undefined") delete globalThis["CustomEvent"];
      else globalThis["CustomEvent"] = v15;
    }
  }));

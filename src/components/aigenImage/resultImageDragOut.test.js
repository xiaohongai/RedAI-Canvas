import test from "node:test";
import strict from "node:assert/strict";
import {
  buildResultImageDragOutNodePayload,
  hasUsableResultImageForDragOut,
  startResultImageDragOutPointer,
} from "./resultImageDragOut.js";
function createFakeDocument() {
  const v0 = new Map(),
    v1 = {
      body: {
        appended: [],
        appendChild(v2) {
          return (this["appended"]["push"](v2), (v2["parentNode"] = this), v2);
        },
      },
      addEventListener(v3, v4) {
        if (!v0["has"](v3)) v0["set"](v3, new Set());
        v0["get"](v3)["add"](v4);
      },
      removeEventListener(v5, v6) {
        v0["get"](v5)?.["delete"](v6);
      },
      dispatch(v7, v8) {
        for (const v9 of Array["from"](v0["get"](v7) || [])) {
          v9(v8);
        }
      },
      createElement(v10) {
        return {
          tagName: String(v10 || "div")["toUpperCase"](),
          className: "",
          style: {},
          children: [],
          parentNode: null,
          appendChild(v11) {
            return (
              this["children"]["push"](v11),
              (v11["parentNode"] = this),
              v11
            );
          },
          setAttribute(v12, v13) {
            this[v12] = String(v13);
          },
          remove() {
            this["removed"] = true;
          },
        };
      },
    };
  return v1;
}
function createTarget(v14, v15 = { width: 100, height: 80 }) {
  return {
    ownerDocument: v14,
    offsetWidth: v15["width"],
    offsetHeight: v15["height"],
    setPointerCapture() {},
    releasePointerCapture() {},
    getBoundingClientRect() {
      return { ...v15 };
    },
  };
}
function pointerEvent(v16, v17, v18, v19 = {}) {
  return {
    button: v19["button"] ?? 0,
    pointerId: v19["pointerId"] ?? 1,
    clientX: v17,
    clientY: v18,
    currentTarget: v16,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this["defaultPrevented"] = true;
    },
    stopPropagation() {
      this["propagationStopped"] = true;
    },
  };
}
(test("result image drag out: builds source-image payload from local derivative fields", () => {
  const v20 = {
      localPath: "output/original.png",
      originalLocalPath: "output/original.png",
      displayLocalPath: "output/display.webp",
      thumbLocalPath: "output/thumb.webp",
      sourceId: "source-db-id",
      thumbId: "thumb-db-id",
      originalWidth: 1600,
      originalHeight: 900,
    },
    v21 = structuredClone(v20),
    v22 = buildResultImageDragOutNodePayload({
      image: v20,
      viewport: { x: 100, y: 50, zoom: 2 },
      screenX: 500,
      screenY: 250,
      createId: () => "source-image-test",
    });
  (strict["deepEqual"](v20, v21),
    strict["equal"](v22["id"], "source-image-test"),
    strict["equal"](v22["type"], "source-image"),
    strict["equal"](v22["src"], "/output/display.webp"),
    strict["equal"](v22["imageUrl"], "/output/display.webp"),
    strict["equal"](v22["sourceUrl"], "/output/original.png"),
    strict["equal"](v22["thumbUrl"], "/output/thumb.webp"),
    strict["equal"](v22["localPath"], "output/original.png"),
    strict["equal"](v22["originalLocalPath"], "output/original.png"),
    strict["equal"](v22["displayLocalPath"], "output/display.webp"),
    strict["equal"](v22["thumbLocalPath"], "output/thumb.webp"),
    strict["equal"](v22["sourceId"], "source-db-id"),
    strict["equal"](v22["thumbId"], "thumb-db-id"),
    strict["equal"](v22["imageWidth"], 1600),
    strict["equal"](v22["imageHeight"], 900),
    strict["equal"](v22["width"], 512),
    strict["equal"](v22["height"], 288),
    strict["equal"](v22["x"], -56),
    strict["equal"](v22["y"], -44),
    strict["equal"](v22["needsAutoResize"], false));
}),
  test("result image drag out: uses fallback card size when result dimensions are missing", () => {
    const v23 = buildResultImageDragOutNodePayload({
      image: { displayLocalPath: "output/display.webp" },
      viewport: { x: 0, y: 0, zoom: 1 },
      screenX: 160,
      screenY: 90,
      fallbackWidth: 320,
      fallbackHeight: 180,
      createId: () => "source-image-fallback",
    });
    (strict["equal"](v23["id"], "source-image-fallback"),
      strict["equal"](v23["width"], 320),
      strict["equal"](v23["height"], 180),
      strict["equal"](v23["x"], 0),
      strict["equal"](v23["y"], 0),
      strict["equal"](v23["fixedSize"], true),
      strict["equal"](v23["needsAutoResize"], false));
  }),
  test("result image drag out: rejects error, empty, and remote-only results", () => {
    (strict["equal"](
      hasUsableResultImageForDragOut({ error: "failed" }),
      false,
    ),
      strict["equal"](hasUsableResultImageForDragOut({}), false),
      strict["equal"](
        hasUsableResultImageForDragOut({
          imageUrl: "https://example.com/not-local.png",
        }),
        false,
      ),
      strict["equal"](
        buildResultImageDragOutNodePayload({
          image: { imageUrl: "https://example.com/not-local.png" },
        }),
        null,
      ));
  }),
  test("result\x20image\x20drag\x20out\x20gesture:\x20below\x20threshold\x20preserves\x20click\x20behavior", () => {
    const v24 = createFakeDocument(),
      v25 = createTarget(v24);
    let v26 = 0,
      v27 = 0,
      v28 = 0;
    (startResultImageDragOutPointer(pointerEvent(v25, 10, 10), {
      image: { displayLocalPath: "output/result.png" },
      getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
      addNode: () => {
        v26 += 1;
      },
      markClickSuppressed: () => {
        v27 += 1;
      },
      commit: () => {
        v28 += 1;
      },
    }),
      v24["dispatch"]("pointermove", pointerEvent(v25, 13, 14)),
      v24["dispatch"]("pointerup", pointerEvent(v25, 13, 14)),
      strict["equal"](v26, 0),
      strict["equal"](v27, 0),
      strict["equal"](v28, 0));
  }),
  test("result image drag out gesture: over threshold creates source-image without mutating original node", () => {
    const v29 = createFakeDocument(),
      v30 = createTarget(v29, { width: 100, height: 80 }),
      v31 = {
        images: [{ displayLocalPath: "output/result.png" }],
        mainImageIndex: 0,
        isImagesExpanded: true,
      },
      v32 = structuredClone(v31);
    let v33 = null,
      v34 = null,
      v35 = 0,
      v36 = 0;
    (startResultImageDragOutPointer(pointerEvent(v30, 10, 10), {
      image: () => v31["images"][0],
      getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
      getNodeFallbackSize: () => ({ width: 100, height: 80 }),
      createId: () => "source-image-drag",
      createGhost: () => null,
      addNode: (v37) => {
        v33 = v37;
      },
      setSelectedNodes: (v38) => {
        v34 = v38;
      },
      markClickSuppressed: () => {
        v35 += 1;
      },
      commit: () => {
        v36 += 1;
      },
    }),
      v29["dispatch"]("pointermove", pointerEvent(v30, 20, 20)),
      v29["dispatch"]("pointerup", pointerEvent(v30, 30, 30)),
      strict["deepEqual"](v31, v32),
      strict["equal"](v33["id"], "source-image-drag"),
      strict["equal"](v33["type"], "source-image"),
      strict["equal"](v33["x"], -20),
      strict["equal"](v33["y"], -10),
      strict["deepEqual"](v34, ["source-image-drag"]),
      strict["equal"](v35, 1),
      strict["equal"](v36, 1));
  }));

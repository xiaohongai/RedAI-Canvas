import test from "node:test";
import strict from "node:assert/strict";
import { resolveFixedInputSlotForRef } from "./fixedInputAssetRefs.js";
function createConfig() {
  return {
    slotById: {
      firstFrame: { id: "firstFrame", kind: "image" },
      lastFrame: { id: "lastFrame", kind: "image" },
      referenceVideo: { id: "referenceVideo", kind: "video" },
    },
    slotKindById: {
      firstFrame: "image",
      lastFrame: "image",
      referenceVideo: "video",
    },
    slotOrderByType: {
      image: ["firstFrame", "lastFrame"],
      video: ["referenceVideo"],
    },
    visibleSlots: ["firstFrame", "referenceVideo"],
  };
}
(test("fixed input slot resolver keeps visible explicit slots", () => {
  const v0 = resolveFixedInputSlotForRef({
    fixedInputConfig: createConfig(),
    refSlot: "firstFrame",
    kind: "image",
  });
  strict["deepEqual"](v0, {
    slot: "firstFrame",
    reason: "explicit",
    explicitSlot: "firstFrame",
  });
}),
  test("fixed input slot resolver ignores current hidden slots", () => {
    const v1 = resolveFixedInputSlotForRef({
      fixedInputConfig: createConfig(),
      refSlot: "lastFrame",
      kind: "image",
    });
    (strict["equal"](v1["slot"], ""),
      strict["equal"](v1["reason"], "hidden"),
      strict["equal"](v1["knownSlot"], true));
  }),
  test("fixed input slot resolver migrates stale unknown slots by kind", () => {
    const v2 = resolveFixedInputSlotForRef({
      fixedInputConfig: createConfig(),
      refSlot: "refImage",
      kind: "image",
    });
    (strict["equal"](v2["slot"], "firstFrame"),
      strict["equal"](v2["reason"], "stale"));
  }),
  test("fixed\x20input\x20slot\x20resolver\x20respects\x20occupied\x20slots", () => {
    const v3 = resolveFixedInputSlotForRef({
      fixedInputConfig: createConfig(),
      refSlot: "refImage",
      kind: "image",
      occupiedSlots: { firstFrame: true },
    });
    (strict["equal"](v3["slot"], ""),
      strict["equal"](v3["reason"], "overflow"));
  }));

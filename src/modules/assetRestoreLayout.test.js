import test from "node:test";
import strict from "node:assert/strict";
import {
  createTopAlignedAssetNodes,
  shouldTopAlignRestoredAsset,
} from "./assetRestoreLayout.js";
(test("assetRestoreLayout: top-aligns flat media asset nodes", () => {
  const v0 = [
    { id: "b", type: "source-image", x: 300, y: 80, width: 160, height: 240 },
    { id: "a", type: "source-video", x: 10, y: 20, width: 120, height: 200 },
    { id: "c", type: "ai-image", x: 500, y: 140, width: 180, height: 220 },
  ];
  strict["equal"](shouldTopAlignRestoredAsset(v0, []), true);
  const v1 = createTopAlignedAssetNodes(v0, 24);
  strict["deepEqual"](
    v1["map"]((v2) => [v2["id"], v2["x"], v2["y"], v2["width"], v2["height"]]),
    [
      ["a", 0, 0, 120, 200],
      ["b", 144, 0, 160, 240],
      ["c", 328, 0, 180, 220],
    ],
  );
}),
  test("assetRestoreLayout: preserves graph assets and non-media layouts", () => {
    (strict["equal"](
      shouldTopAlignRestoredAsset(
        [
          { id: "a", type: "source-image" },
          { id: "b", type: "ai-image" },
        ],
        [{ id: "e1", sourceId: "a", targetId: "b" }],
      ),
      false,
    ),
      strict["equal"](
        shouldTopAlignRestoredAsset([
          { id: "a", type: "source-image" },
          { id: "t", type: "source-text" },
        ]),
        false,
      ));
  }));

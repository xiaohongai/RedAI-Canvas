import test from "node:test";
import strict from "node:assert/strict";
import {
  IMAGE_CROP_MIN_SIZE,
  buildImageCropDragRect,
} from "./ImageCropController.js";
const NODE = { x: 100, y: 50, width: 400, height: 300 };
(test("ImageCropController:\x20Ctrl\x20drag\x20builds\x20a\x20normal\x20crop\x20rect", () => {
  const v0 = buildImageCropDragRect({
    startPoint: { x: 120, y: 70 },
    currentPoint: { x: 260, y: 170 },
    node: NODE,
  });
  strict["deepEqual"](v0, {
    rect: { x: 120, y: 70, w: 140, h: 100 },
    isValid: true,
  });
}),
  test("ImageCropController:\x20Ctrl\x20drag\x20normalizes\x20reverse\x20direction", () => {
    const v1 = buildImageCropDragRect({
      startPoint: { x: 300, y: 250 },
      currentPoint: { x: 180, y: 140 },
      node: NODE,
    });
    strict["deepEqual"](v1, {
      rect: { x: 180, y: 140, w: 120, h: 110 },
      isValid: true,
    });
  }),
  test("ImageCropController: Ctrl drag clamps the rect inside image bounds", () => {
    const v2 = buildImageCropDragRect({
      startPoint: { x: 120, y: 70 },
      currentPoint: { x: 600, y: 500 },
      node: NODE,
    });
    strict["deepEqual"](v2, {
      rect: { x: 120, y: 70, w: 380, h: 280 },
      isValid: true,
    });
  }),
  test("ImageCropController: Ctrl drag obeys the active aspect ratio", () => {
    const v3 = buildImageCropDragRect({
      startPoint: { x: 120, y: 70 },
      currentPoint: { x: 440, y: 370 },
      node: NODE,
      aspectRatio: 16 / 9,
    });
    (strict["equal"](v3["isValid"], true),
      strict["equal"](v3["rect"]["x"], 120),
      strict["equal"](v3["rect"]["y"], 70),
      strict["equal"](v3["rect"]["w"], 320),
      strict["equal"](v3["rect"]["h"], 180));
  }),
  test("ImageCropController: Ctrl drag marks tiny selections invalid", () => {
    const v4 = buildImageCropDragRect({
      startPoint: { x: 120, y: 70 },
      currentPoint: {
        x: 120 + IMAGE_CROP_MIN_SIZE - 1,
        y: 70 + IMAGE_CROP_MIN_SIZE - 1,
      },
      node: NODE,
    });
    (strict["equal"](v4["isValid"], false),
      strict["deepEqual"](v4["rect"], { x: 120, y: 70, w: 19, h: 19 }));
  }));

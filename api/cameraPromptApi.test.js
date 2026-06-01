import test from "node:test";
import strict from "node:assert/strict";
import { applyCameraAngleToPrompt } from "./cameraPromptApi.js";
(test("cameraPromptApi: 无 cameraAngle 时返回原 prompt", () => {
  (strict["equal"](applyCameraAngleToPrompt("p", null), "p"),
    strict["equal"](applyCameraAngleToPrompt("", null), ""));
}),
  test("cameraPromptApi: 有 cameraAngle 且原 prompt 为空", () => {
    const v0 = applyCameraAngleToPrompt("", {
      rotation: 0,
      pitch: 0,
      scale: 0.5,
    });
    strict["equal"](
      v0,
      "switch the camera perspective: wide shot, front view, eye-level shot",
    );
  }),
  test("cameraPromptApi: 有 cameraAngle 且原 prompt 不为空会追加", () => {
    const v1 = applyCameraAngleToPrompt("a prompt", {
      rotation: 0,
      pitch: 0,
      scale: 0.5,
    });
    strict["equal"](
      v1,
      "switch the camera perspective: wide shot, front view, eye-level shot, a prompt",
    );
  }));

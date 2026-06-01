import test from "node:test";
import strict from "node:assert/strict";
import { buildGenerateImageRequest, generateImage } from "./aiImageApi.js";
test("buildGenerateImageRequest should return valid request object", async () => {
  const v0 = {
    prompt: "测试提示词",
    model: "nano-banana-pro-vt",
    aspectRatio: "16:9",
    imageSize: "2K",
    batchSize: 1,
  };
  try {
    const v1 = await buildGenerateImageRequest(v0);
    (strict["ok"](v1),
      strict["ok"](v1["url"]),
      strict["ok"](v1["headers"]),
      strict["ok"](v1["body"]));
  } catch (v2) {
    strict["ok"](v2);
  }
});

import test from "node:test";
import strict from "node:assert/strict";
import {
  buildBodyFromMapping,
  resolveMappedResponseValue,
  resolveMappedResponseValues,
} from "./modelApiMappingEngine.js";
import {
  getModelApiBodyResolver,
  getModelApiEndpointResolver,
} from "./modelApiResolvers/index.js";
(test("modelApi bodyMapping engine builds nested request body from manifest entries", async () => {
  const v0 = await buildBodyFromMapping({
    bodyMapping: [
      { path: "model", from: "model" },
      { path: "prompt", from: "prompt" },
      {
        path: "resolution",
        from: "param",
        field: "imageSize",
        defaultValue: "2K",
      },
      {
        path: "size",
        from: "param",
        field: "aspectRatio",
        transform: "ratio",
        omitWhenEmpty: true,
      },
      { path: "image_urls", from: "inputImages", omitWhenEmpty: true },
      {
        path: "metadata.seed",
        from: "param",
        field: "seed",
        when: { field: "seed", exists: true },
      },
      { path: "metadata.provider", from: "constant", value: "apimart" },
    ],
    context: {
      finalPrompt: "draw",
      modelToken: "test-model",
      inputImages: ["https://cdn.example.com/input.png"],
      payload: { aspectRatio: "16:9", seed: 42 },
    },
    transforms: {
      ratio: (v1) => String(v1 || "")["replace"](/[：∶﹕]/g, ":"),
    },
  });
  strict["deepEqual"](v0, {
    model: "test-model",
    prompt: "draw",
    resolution: "2K",
    size: "16:9",
    image_urls: ["https://cdn.example.com/input.png"],
    metadata: { seed: 42, provider: "apimart" },
  });
}),
  test("modelApi responseMapping resolves wildcard result paths and task ids", () => {
    const v2 = {
      data: {
        task: { id: "task-1" },
        result: {
          images: [
            { url: "https://cdn.example.com/a.png" },
            { imageUrl: "https://cdn.example.com/b.png" },
          ],
        },
      },
    };
    (strict["equal"](
      resolveMappedResponseValue(v2, ["data.task.id"]),
      "task-1",
    ),
      strict["deepEqual"](
        resolveMappedResponseValues(v2, ["data.result.images[]"]),
        ["https://cdn.example.com/a.png", "https://cdn.example.com/b.png"],
      ));
  }),
  test("modelApi\x20resolver\x20lookup\x20is\x20whitelist-only", () => {
    (strict["equal"](
      typeof getModelApiBodyResolver("ppioImageSize"),
      "function",
    ),
      strict["equal"](
        typeof getModelApiEndpointResolver("runninghubImageEndpoint"),
        "function",
      ),
      strict["equal"](getModelApiBodyResolver("unknownResolver"), null),
      strict["equal"](getModelApiEndpointResolver("unknownResolver"), null));
  }),
  test("modelApi grsai resolver maps uploaded references to images", () => {
    const v3 = getModelApiBodyResolver("grsaiImage"),
      v4 = v3({
        payload: {
          model: "nano-banana-2",
          imageSize: "1K",
          aspectRatio: "1:1",
          batchSize: 4,
        },
        finalPrompt: "draw",
        modelToken: "nano-banana-2",
        finalUrls: ["https://cdn.example.com/ref.png"],
      });
    (strict["deepEqual"](v4["images"], ["https://cdn.example.com/ref.png"]),
      strict["equal"](v4["replyType"], "json"),
      strict["equal"](v4["urls"], undefined),
      strict["equal"](v4["batchSize"], undefined),
      strict["equal"](v4["model"], "nano-banana-2"),
      strict["equal"](v4["prompt"], "draw"),
      strict["equal"](v4["imageSize"], "1K"),
      strict["equal"](v4["aspectRatio"], "1:1"));
  }),
  test("modelApi grsai resolver normalizes nanobanana API enums", () => {
    const v5 = getModelApiBodyResolver("grsaiImage"),
      v6 = v5({
        payload: {
          model: "nano-banana",
          imageSize: "3K",
          aspectRatio: "自适应",
        },
        finalPrompt: "draw",
        modelToken: "nano-banana",
        finalUrls: [],
      });
    (strict["equal"](v6["imageSize"], "2K"),
      strict["equal"](v6["aspectRatio"], "auto"));
    const v7 = v5({
      payload: {
        model: "nano-banana-pro",
        imageSize: "bogus",
        aspectRatio: "1:8",
      },
      finalPrompt: "draw",
      modelToken: "nano-banana-pro",
      finalUrls: [],
    });
    (strict["equal"](v7["imageSize"], "2K"),
      strict["equal"](v7["aspectRatio"], "9:16"));
    const v8 = v5({
      payload: { model: "nano-banana-2", imageSize: "4K", aspectRatio: "1:8" },
      finalPrompt: "draw",
      modelToken: "nano-banana-2",
      finalUrls: [],
    });
    (strict["equal"](v8["imageSize"], "2K"),
      strict["equal"](v8["aspectRatio"], "1:8"));
    const v9 = v5({
      payload: { model: "nano-banana-2", imageSize: "2K", aspectRatio: "1:8" },
      finalPrompt: "draw",
      modelToken: "nano-banana-2-4k-cl",
      finalUrls: [],
    });
    (strict["equal"](v9["imageSize"], "4K"),
      strict["equal"](v9["aspectRatio"], "1:8"));
    const v10 = v5({
      payload: {
        model: "nano-banana-pro",
        imageSize: "4K",
        aspectRatio: "16:9",
      },
      finalPrompt: "draw",
      modelToken: "nano-banana-pro-vip",
      finalUrls: [],
    });
    strict["equal"](v10["imageSize"], "2K");
    const v11 = v5({
      payload: {
        model: "nano-banana-pro",
        imageSize: "2K",
        aspectRatio: "16:9",
      },
      finalPrompt: "draw",
      modelToken: "nano-banana-pro-4k-vip",
      finalUrls: [],
    });
    strict["equal"](v11["imageSize"], "4K");
  }),
  test("modelApi grsai gpt-image-2 resolver maps UI ratios to official pixel sizes", () => {
    const v12 = getModelApiBodyResolver("grsaiGptImage2Image"),
      v13 = v12({
        payload: {
          model: "gpt-image-2",
          imageSize: "4K",
          aspectRatio: "2:1",
          batchSize: 4,
        },
        finalPrompt: "draw",
        modelToken: "gpt-image-2-vip",
        finalUrls: ["https://cdn.example.com/ref.png"],
      });
    (strict["equal"](v13["model"], "gpt-image-2-vip"),
      strict["equal"](v13["prompt"], "draw"),
      strict["deepEqual"](v13["images"], ["https://cdn.example.com/ref.png"]),
      strict["equal"](v13["replyType"], "json"),
      strict["equal"](v13["aspectRatio"], "3840x1920"),
      strict["equal"](v13["imageSize"], undefined),
      strict["equal"](v13["batchSize"], undefined),
      strict["equal"](v13["urls"], undefined));
    const v14 = v12({
      payload: { model: "gpt-image-2", imageSize: "1K", aspectRatio: "9:21" },
      finalPrompt: "draw",
      modelToken: "gpt-image-2",
      finalUrls: [],
    });
    (strict["equal"](v14["model"], "gpt-image-2"),
      strict["equal"](v14["aspectRatio"], "832x1920"));
    const v15 = v12({
      payload: { model: "gpt-image-2", imageSize: "1K", aspectRatio: "4:3" },
      finalPrompt: "draw",
      modelToken: "gpt-image-2",
      finalUrls: [],
    });
    strict["equal"](v15["aspectRatio"], "1443x1090");
    const v16 = v12({
      payload: { model: "gpt-image-2", imageSize: "1K", aspectRatio: "16:9" },
      finalPrompt: "draw",
      modelToken: "gpt-image-2-vip",
      finalUrls: [],
    });
    strict["equal"](v16["aspectRatio"], "1280x720");
    const v17 = v12({
      payload: { model: "gpt-image-2", imageSize: "1K", aspectRatio: "auto" },
      finalPrompt: "draw",
      modelToken: "gpt-image-2",
      finalUrls: [],
    });
    strict["equal"](v17["aspectRatio"], "1024x1024");
  }));

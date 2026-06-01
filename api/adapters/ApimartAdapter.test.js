import test from "node:test";
import strict from "node:assert/strict";
import { buildImageRequest, buildVideoRequest } from "./ApimartAdapter.js";
function createCtx({
  apiUrl: apiUrl = "https://api.apimart.example.com",
} = {}) {
  const v0 = [];
  return {
    calls: v0,
    getProviderConfig(v1) {
      if (v1 === "apimart") return { apiUrl: apiUrl, apiKey: "k" };
      return {};
    },
    async processInputImages(v2 = [], v3, v4 = {}) {
      return (
        v0["push"]({ type: "images", inputUrls: v2, apiKey: v3, options: v4 }),
        v2["map"](
          (v5) =>
            "https://uploaded.example/" + String(v5)["split"]("/")["pop"](),
        )
      );
    },
    async processInputVideos(v6 = [], v7, v8 = {}) {
      return (
        v0["push"]({ type: "videos", videoUrls: v6, apiKey: v7, options: v8 }),
        v6["map"](
          (v9) =>
            "https://uploaded.example/" + String(v9)["split"]("/")["pop"](),
        )
      );
    },
    async processInputAudios(v10 = [], v11, v12 = {}) {
      return (
        v0["push"]({
          type: "audios",
          audioUrls: v10,
          apiKey: v11,
          options: v12,
        }),
        v10["map"](
          (v13) =>
            "https://uploaded.example/" + String(v13)["split"]("/")["pop"](),
        )
      );
    },
  };
}
(test("ApimartAdapter:\x20多图输入按上传处理后的顺序写入\x20image_urls", async () => {
  const v14 = createCtx(),
    v15 = await buildImageRequest(
      {
        model: "apimart/nano-banana-pro",
        prompt: "p",
        imageSize: "2K",
        aspectRatio: "1:1",
        inputUrls: [
          "https://local.example/target.png",
          "https://local.example/source.png",
          "https://local.example/style.png",
        ],
      },
      "p",
      v14,
    );
  (strict["deepEqual"](v15["body"]["image_urls"], [
    "https://uploaded.example/target.png",
    "https://uploaded.example/source.png",
    "https://uploaded.example/style.png",
  ]),
    strict["equal"](v14["calls"][0]["options"]["provider"], "apimart"));
}),
  test("ApimartAdapter: APIMart /v1 base URL is not duplicated", async () => {
    const v16 = createCtx({ apiUrl: "https://api.apimart.example.com/v1" }),
      v17 = await buildVideoRequest(
        {
          model: "apimart/doubao-seedance-2.0",
          prompt: "p",
          aspectRatio: "16:9",
          duration: 5,
        },
        "p",
        v16,
      );
    strict["equal"](
      v17["body"]["apiUrl"],
      "https://api.apimart.example.com/v1/videos/generations",
    );
  }),
  test("ApimartAdapter:\x20GPT\x20image\x202\x20使用官方模型名并透传小写\x20resolution/size", async () => {
    const v18 = createCtx(),
      v19 = await buildImageRequest(
        {
          model: "apimart/gpt-image-2",
          prompt: "p",
          imageSize: "2K",
          aspectRatio: "16:9",
          resolvedRatioLabel: "16:9",
          inputUrls: [
            "https://local.example/target.png",
            "https://local.example/source.png",
          ],
        },
        "p",
        v18,
      );
    (strict["equal"](v19["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v19["body"]["apiUrl"],
        "https://api.apimart.example.com/v1/images/generations",
      ),
      strict["equal"](v19["body"]["model"], "gpt-image-2"),
      strict["equal"](v19["body"]["resolution"], "2k"),
      strict["equal"](v19["body"]["size"], "16:9"),
      strict["deepEqual"](v19["body"]["image_urls"], [
        "https://uploaded.example/target.png",
        "https://uploaded.example/source.png",
      ]),
      strict["equal"](v18["calls"][0]["options"]["provider"], "apimart"));
  }),
  test("ApimartAdapter:\x20GPT\x20image\x202\x20支持\x204K\x20可用横竖比例", async () => {
    const v20 = await buildImageRequest(
      {
        model: "apimart/gpt-image-2",
        prompt: "p",
        imageSize: "4K",
        aspectRatio: "16:9",
        resolvedRatioLabel: "16:9",
        inputUrls: [],
      },
      "p",
      createCtx(),
    );
    (strict["equal"](v20["body"]["resolution"], "4k"),
      strict["equal"](v20["body"]["size"], "16:9"));
    const v21 = await buildImageRequest(
      {
        model: "apimart/gpt-image-2",
        prompt: "p",
        imageSize: "4K",
        aspectRatio: "9:21",
        resolvedRatioLabel: "9:21",
        inputUrls: [],
      },
      "p",
      createCtx(),
    );
    (strict["equal"](v21["body"]["resolution"], "4k"),
      strict["equal"](v21["body"]["size"], "9:21"));
  }),
  test("ApimartAdapter:\x20GPT\x20image\x202\x204K\x20不支持比例回退到可用比例", async () => {
    const v22 = createCtx(),
      v23 = await buildImageRequest(
        {
          model: "apimart/gpt-image-2",
          prompt: "p",
          imageSize: "4K",
          aspectRatio: "1:1",
          resolvedRatioLabel: "1:1",
          inputUrls: [],
        },
        "p",
        v22,
      );
    (strict["equal"](v23["body"]["model"], "gpt-image-2"),
      strict["equal"](v23["body"]["resolution"], "4k"),
      strict["equal"](v23["body"]["size"], "16:9"));
  }),
  test("ApimartAdapter: GPT image 2 历史 3K 画质回退到 2k", async () => {
    const v24 = createCtx(),
      v25 = await buildImageRequest(
        {
          model: "apimart/gpt-image-2",
          prompt: "p",
          imageSize: "3K",
          aspectRatio: "1:1",
          resolvedRatioLabel: "1:1",
          inputUrls: [],
        },
        "p",
        v24,
      );
    (strict["equal"](v25["body"]["model"], "gpt-image-2"),
      strict["equal"](v25["body"]["resolution"], "2k"),
      strict["equal"](v25["body"]["size"], "1:1"));
  }),
  test("ApimartAdapter: 视频源和参考图使用 APIMART 上传后写入请求", async () => {
    const v26 = createCtx(),
      v27 = await buildVideoRequest(
        {
          model: "apimart/happyhorse-1.0",
          prompt: "p",
          aspectRatio: "16:9",
          duration: 5,
          videoUrl: "/data/uploads/source.mp4",
          inputUrls: ["/data/uploads/style.png"],
        },
        "p",
        v26,
      );
    (strict["equal"](v27["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v27["body"]["apiUrl"],
        "https://api.apimart.example.com/v1/videos/generations",
      ),
      strict["equal"](v27["body"]["model"], "happyhorse-1.0"),
      strict["equal"](
        v27["body"]["video_url"],
        "https://uploaded.example/source.mp4",
      ),
      strict["deepEqual"](v27["body"]["image_urls"], [
        "https://uploaded.example/style.png",
      ]),
      strict["equal"](v26["calls"][0]["type"], "videos"),
      strict["equal"](v26["calls"][0]["options"]["provider"], "apimart"),
      strict["equal"](v26["calls"][1]["type"], "images"),
      strict["equal"](v26["calls"][1]["options"]["provider"], "apimart"));
  }),
  test("ApimartAdapter: Seedance 文生视频映射到 APIMart 官方字段", async () => {
    const v28 = createCtx(),
      v29 = await buildVideoRequest(
        {
          model: "apimart/doubao-seedance-2.0-fast",
          prompt: "p",
          aspectRatio: "21:9",
          resolution: "720p",
          duration: 8,
        },
        "p",
        v28,
      );
    (strict["equal"](
      v29["body"]["apiUrl"],
      "https://api.apimart.example.com/v1/videos/generations",
    ),
      strict["equal"](v29["body"]["model"], "doubao-seedance-2.0-fast"),
      strict["equal"](v29["body"]["prompt"], "p"),
      strict["equal"](v29["body"]["size"], "21:9"),
      strict["equal"](v29["body"]["resolution"], "720p"),
      strict["equal"](v29["body"]["duration"], 8),
      strict["equal"]("quality" in v29["body"], false),
      strict["deepEqual"](v28["calls"], []));
  }),
  test("ApimartAdapter: Seedance 首尾帧写入 image_with_roles", async () => {
    const v30 = createCtx(),
      v31 = await buildVideoRequest(
        {
          model: "apimart/doubao-seedance-2.0",
          prompt: "transition",
          aspectRatio: "adaptive",
          resolution: "1080p",
          duration: 5,
          first: "/data/uploads/first.png",
          last: "/data/uploads/last.png",
          inputUrls: ["/data/uploads/first.png", "/data/uploads/last.png"],
        },
        "transition",
        v30,
      );
    (strict["equal"](v31["body"]["model"], "doubao-seedance-2.0"),
      strict["deepEqual"](v31["body"]["image_with_roles"], [
        { url: "https://uploaded.example/first.png", role: "first_frame" },
        { url: "https://uploaded.example/last.png", role: "last_frame" },
      ]),
      strict["equal"]("image_urls" in v31["body"], false),
      strict["equal"]("video_urls" in v31["body"], false),
      strict["equal"](v30["calls"]["length"], 1),
      strict["equal"](v30["calls"][0]["type"], "images"));
  }),
  test("ApimartAdapter: Seedance 2.0 使用通过人脸检测的 asset URL", async () => {
    const v32 = createCtx();
    v32["processInputImages"] = async (v33 = [], v34, v35 = {}) => {
      return (
        v32["calls"]["push"]({
          type: "images",
          inputUrls: v33,
          apiKey: v34,
          options: v35,
        }),
        v33["map"]((v36) =>
          String(v36)["startsWith"]("asset://")
            ? v36
            : "https://uploaded.example/" + String(v36)["split"]("/")["pop"](),
        )
      );
    };
    const v37 = await buildVideoRequest(
      {
        model: "apimart/doubao-seedance-2.0-fast",
        prompt: "transition",
        first: "/data/uploads/first.png",
        last: "/data/uploads/last.png",
        inputUrls: ["/data/uploads/first.png", "/data/uploads/last.png"],
        providerAssetRefs: [
          {
            provider: "apimart",
            capability: "seedance2PrivateAvatar",
            status: "passed",
            sourceKind: "image",
            sourceUrl: "/data/uploads/first.png",
            assetUrl: "asset://private-first",
          },
          {
            provider: "apimart",
            capability: "seedance2PrivateAvatar",
            status: "passed",
            sourceKind: "image",
            sourceUrl: "/data/uploads/last.png",
            assetUrl: "asset://private-last",
          },
        ],
      },
      "transition",
      v32,
    );
    (strict["deepEqual"](v32["calls"][0]["inputUrls"], [
      "asset://private-first",
      "asset://private-last",
    ]),
      strict["deepEqual"](v37["body"]["image_with_roles"], [
        { url: "asset://private-first", role: "first_frame" },
        { url: "asset://private-last", role: "last_frame" },
      ]));
  }),
  test("ApimartAdapter:\x20非\x20Seedance\x202.0\x20不使用人脸检测\x20asset\x20URL", async () => {
    const v38 = createCtx(),
      v39 = await buildVideoRequest(
        {
          model: "apimart/doubao-seedance-1-5-pro",
          prompt: "transition",
          first: "/data/uploads/first.png",
          last: "/data/uploads/last.png",
          providerAssetRefs: [
            {
              provider: "apimart",
              capability: "seedance2PrivateAvatar",
              status: "passed",
              sourceKind: "image",
              sourceUrl: "/data/uploads/first.png",
              assetUrl: "asset://private-first",
            },
          ],
        },
        "transition",
        v38,
      );
    (strict["deepEqual"](v38["calls"][0]["inputUrls"], [
      "/data/uploads/first.png",
      "/data/uploads/last.png",
    ]),
      strict["deepEqual"](v39["body"]["image_with_roles"], [
        { url: "https://uploaded.example/first.png", role: "first_frame" },
        { url: "https://uploaded.example/last.png", role: "last_frame" },
      ]));
  }),
  test("ApimartAdapter: Seedance 多模态参考映射图片视频音频数组", async () => {
    const v40 = createCtx(),
      v41 = await buildVideoRequest(
        {
          model: "apimart/doubao-seedance-2.0-fast-face",
          prompt: "product\x20ad",
          aspectRatio: "自适应",
          resolution: "720p",
          duration: 11,
          images: ["/data/uploads/a.png", "/data/uploads/b.png"],
          videos: ["/data/uploads/ref.mp4"],
          audios: ["/data/uploads/ref.mp3"],
        },
        "product\x20ad",
        v40,
      );
    (strict["equal"](v41["body"]["model"], "doubao-seedance-2.0-fast-face"),
      strict["equal"](v41["body"]["size"], "adaptive"),
      strict["deepEqual"](v41["body"]["image_urls"], [
        "https://uploaded.example/a.png",
        "https://uploaded.example/b.png",
      ]),
      strict["deepEqual"](v41["body"]["video_urls"], [
        "https://uploaded.example/ref.mp4",
      ]),
      strict["deepEqual"](v41["body"]["audio_urls"], [
        "https://uploaded.example/ref.mp3",
      ]),
      strict["deepEqual"](
        v40["calls"]["map"]((v42) => v42["type"]),
        ["videos", "images", "audios"],
      ));
  }),
  test("ApimartAdapter:\x20Seedance\x201.5\x20Pro\x20使用\x20aspect_ratio\x20和生成音频字段", async () => {
    const v43 = createCtx(),
      v44 = await buildVideoRequest(
        {
          model: "apimart/doubao-seedance-1-5-pro",
          prompt: "p",
          aspectRatio: "9:16",
          resolution: "1080p",
          duration: 12,
          audio: true,
          first: "/data/uploads/start.png",
          last: "/data/uploads/end.png",
        },
        "p",
        v43,
      );
    (strict["equal"](v44["body"]["model"], "doubao-seedance-1-5-pro"),
      strict["equal"](v44["body"]["aspect_ratio"], "9:16"),
      strict["equal"]("size" in v44["body"], false),
      strict["equal"](v44["body"]["audio"], true),
      strict["deepEqual"](v44["body"]["image_with_roles"], [
        { url: "https://uploaded.example/start.png", role: "first_frame" },
        { url: "https://uploaded.example/end.png", role: "last_frame" },
      ]));
  }),
  test("ApimartAdapter: Seedance 1.0 Pro Quality 使用 aspect_ratio 和首尾帧", async () => {
    const v45 = createCtx(),
      v46 = await buildVideoRequest(
        {
          model: "apimart/doubao-seedance-1-0-pro-quality",
          prompt: "p",
          aspectRatio: "4:3",
          duration: 2,
          first: "/data/uploads/day.png",
          last: "/data/uploads/night.png",
        },
        "p",
        v45,
      );
    (strict["equal"](v46["body"]["model"], "doubao-seedance-1-0-pro-quality"),
      strict["equal"](v46["body"]["aspect_ratio"], "4:3"),
      strict["equal"](v46["body"]["resolution"], "1080p"),
      strict["deepEqual"](v46["body"]["image_with_roles"], [
        { url: "https://uploaded.example/day.png", role: "first_frame" },
        { url: "https://uploaded.example/night.png", role: "last_frame" },
      ]));
  }),
  test("ApimartAdapter: Seedance 1.0 Pro Fast 不接收尾帧", async () => {
    const v47 = createCtx();
    await strict["rejects"](
      () =>
        buildVideoRequest(
          {
            model: "apimart/doubao-seedance-1-0-pro-fast",
            prompt: "p",
            first: "/data/uploads/day.png",
            last: "/data/uploads/night.png",
          },
          "p",
          v47,
        ),
      /Fast 不支持尾帧图/,
    );
  }));

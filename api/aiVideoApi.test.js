import test from "node:test";
import strict from "node:assert/strict";
import {
  __test__,
  buildGenerateVideoRequest,
  generateVideo,
  resumeAsyncVideoTask,
} from "./aiVideoApi.js";
(test("processVideoTaskResult should parse RunningHub array url into multi videos", () => {
  const v0 = {
      code: 0,
      data: [
        {
          url: [
            "https://cdn.example.com/a.mp4",
            "https://cdn.example.com/b.mp4",
          ],
        },
      ],
    },
    v1 = __test__["processVideoTaskResult"](v0, "runninghubwf");
  (strict["equal"](v1["isBatch"], true),
    strict["ok"](Array["isArray"](v1["videos"])),
    strict["equal"](v1["videos"]["length"], 2),
    strict["equal"](
      v1["videos"][0]["videoUrl"],
      "https://cdn.example.com/a.mp4",
    ),
    strict["equal"](
      v1["videos"][1]["videoUrl"],
      "https://cdn.example.com/b.mp4",
    ));
}),
  test("processVideoTaskResult\x20should\x20prefer\x20manifest\x20responseMapping\x20result\x20paths", () => {
    const v2 = {
        vendorEnvelope: {
          assets: [{ href: "https://cdn.example.com/manifest-path.mp4" }],
        },
      },
      v3 = __test__["processVideoTaskResult"](v2, "apimart", {
        responseMapping: { resultPaths: ["vendorEnvelope.assets[].href"] },
      });
    strict["equal"](
      v3["videoUrl"],
      "https://cdn.example.com/manifest-path.mp4",
    );
  }),
  test("processVideoTaskResult\x20should\x20parse\x20RunningHub\x20snake_case\x20video\x20result\x20fields", () => {
    const v4 = {
        code: 0,
        data: [
          {
            file_url: "https://cdn.example.com/rh-video-file?id=abc",
            thumbnail_url: "https://cdn.example.com/rh-video-file.jpg",
          },
        ],
      },
      v5 = __test__["processVideoTaskResult"](v4, "runninghubwf");
    (strict["equal"](
      v5["videoUrl"],
      "https://cdn.example.com/rh-video-file?id=abc",
    ),
      strict["equal"](
        v5["thumbUrl"],
        "https://cdn.example.com/rh-video-file.jpg",
      ));
  }),
  test("processVideoTaskResult should parse RunningHub download_url video result fields", () => {
    const v6 = {
        code: 0,
        data: {
          outputs: [
            {
              download_url: "https://cdn.example.com/rh-download-video?id=xyz",
            },
          ],
        },
      },
      v7 = __test__["processVideoTaskResult"](v6, "runninghubwf");
    strict["equal"](
      v7["videoUrl"],
      "https://cdn.example.com/rh-download-video?id=xyz",
    );
  }),
  test("processVideoTaskResult should prefer typed RunningHub video over audio url", () => {
    const v8 = {
        code: 0,
        data: [
          {
            type: "audio",
            url: "https://cdn.example.com/rh-lipsync-audio?id=abc",
          },
          {
            type: "video",
            url: "https://cdn.example.com/rh-lipsync-video?id=xyz",
          },
        ],
      },
      v9 = __test__["processVideoTaskResult"](v8, "runninghubwf");
    (strict["equal"](
      v9["videoUrl"],
      "https://cdn.example.com/rh-lipsync-video?id=xyz",
    ),
      strict["equal"](v9["videos"]["length"], 1));
  }),
  test("extractVideoUrls\x20should\x20ignore\x20thumbnail-only\x20objects\x20when\x20a\x20video\x20url\x20exists", () => {
    const v10 = __test__["extractVideoUrls"]({
      result: {
        videos: [
          {
            url: "https://cdn.example.com/result-video.mp4",
            thumbnail_url: "https://cdn.example.com/result-video.jpg",
          },
        ],
      },
    });
    strict["deepEqual"](v10, ["https://cdn.example.com/result-video.mp4"]);
  }),
  test("buildGenerateVideoRequest should build Dreamina route-specific request", async () => {
    const v11 = await buildGenerateVideoRequest({
      provider: "dreamina",
      model: "dreamina/3.5pro",
      prompt: "season changes",
      dreaminaRouteMode: "frames2video",
      inputUrls: ["/a.png", "/b.png"],
      duration: 6,
      resolution: "1080p",
    });
    (strict["equal"](v11["url"], "/api/v2/dreamina/frames2video"),
      strict["equal"](v11["body"]["first"], "/a.png"),
      strict["equal"](v11["body"]["last"], "/b.png"),
      strict["equal"](v11["body"]["modelVersion"], "3.5pro"));
  }),
  test("buildGenerateVideoRequest should normalize legacy seedance model to Dreamina", async () => {
    const v12 = await buildGenerateVideoRequest({
      model: "seedance-2.0-fast",
      prompt: "two people talking",
      duration: 4,
    });
    (strict["equal"](v12["url"], "/api/v2/dreamina/text2video"),
      strict["equal"](v12["body"]["modelVersion"], "seedance2.0fast"));
  }),
  test("buildGenerateVideoRequest\x20should\x20fail\x20unregistered\x20prefixed\x20model\x20without\x20provider\x20inference", async () => {
    await strict["rejects"](
      () =>
        buildGenerateVideoRequest({
          model: "apimart/unregistered-video-model",
          prompt: "city\x20lights",
        }),
      /Video model API manifest missing: apimart\/unregistered-video-model/,
    );
  }),
  test("buildGenerateVideoRequest should use APIMart video modelApi manifest", async () => {
    const { clearApiConfig: v13 } = await import("./configApi.js");
    v13();
    const v14 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v15) => {
        if (String(v15) === "/api/config")
          return makeJsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + String(v15));
      };
      const v16 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/doubao-seedance-2.0-fast",
        prompt: "city\x20lights",
        aspectRatio: "9:16",
        duration: 5,
      });
      (strict["equal"](v16["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v16["adapterTrace"]?.["executionId"],
          "apimart.model-api.video.doubao-seedance-2-fast.v1",
        ),
        strict["equal"](
          v16["body"]["apiUrl"],
          "https://api.apimart.ai/v1/videos/generations",
        ),
        strict["equal"](v16["body"]["model"], "doubao-seedance-2.0-fast"),
        strict["equal"](v16["body"]["size"], "9:16"),
        strict["equal"](
          v16["taskPolling"]?.["urlTemplate"],
          "https://api.apimart.ai/v1/tasks/{taskId}?language=zh",
        ));
    } finally {
      globalThis["fetch"] = v14;
    }
  }),
  test("buildGenerateVideoRequest should pass APIMart Seedance 2.0 private avatar asset URLs", async () => {
    const { clearApiConfig: v17 } = await import("./configApi.js");
    v17();
    const v18 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v19) => {
        if (String(v19) === "/api/config")
          return makeJsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        throw new Error("unexpected fetch url: " + String(v19));
      };
      const v20 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/doubao-seedance-2.0-fast",
        prompt: "make a smooth transition",
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
      });
      strict["deepEqual"](v20["body"]["image_with_roles"], [
        { url: "asset://private-first", role: "first_frame" },
        { url: "asset://private-last", role: "last_frame" },
      ]);
    } finally {
      globalThis["fetch"] = v18;
    }
  }),
  test("buildGenerateVideoRequest should use Volcengine Seedance 2.0 official task body", async () => {
    const { clearApiConfig: v21 } = await import("./configApi.js");
    v21();
    const v22 = globalThis["fetch"],
      v23 = [];
    try {
      globalThis["fetch"] = async (v24, v25 = {}) => {
        const v26 = String(v24);
        if (v26 === "/api/config")
          return makeJsonResponse({
            providers: {
              volcengine: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_volcengine",
              },
            },
          });
        if (v26 === "/local/first.png")
          return makeBlobResponse(
            new Blob(["first"], { type: "image/png" }),
            200,
            "image/png",
          );
        if (v26 === "/local/last.png")
          return makeBlobResponse(
            new Blob(["last"], { type: "image/png" }),
            200,
            "image/png",
          );
        if (v26["startsWith"]("/api/v2/proxy/upload?")) {
          strict["equal"](
            v25["headers"]?.["Authorization"],
            "Bearer\x20k_volcengine",
          );
          const v27 = new URL("http://local" + v26)["searchParams"]["get"](
            "apiUrl",
          );
          strict["equal"](
            v27,
            "https://ark.cn-beijing.volces.com/api/v3/files",
          );
          const v28 = Object["fromEntries"](v25["body"]["entries"]());
          strict["equal"](v28["purpose"], "user_data");
          const v29 = await v28["file"]["text"]();
          return (
            v23["push"](v29),
            makeJsonResponse({
              object: "file",
              id: v29 === "first" ? "file-first" : "file-last",
              status: "active",
              purpose: "user_data",
            })
          );
        }
        throw new Error("unexpected fetch url: " + v26);
      };
      const v30 = await buildGenerateVideoRequest({
        provider: "volcengine",
        model: "volcengine/seedance-2.0",
        prompt: "camera transition",
        inputUrlsBySlot: {
          firstFrame: "/local/first.png",
          lastFrame: "/local/last.png",
        },
        generationParams: {
          volcengine_seedance_2_mode: "frames2video",
          aspectRatio: "16:9",
          resolution: "1080p",
          duration: 7,
          generateAudio: false,
          seed: "42",
        },
      });
      (strict["deepEqual"](v23, ["first", "last"]),
        strict["equal"](v30["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v30["adapterTrace"]?.["executionId"],
          "volcengine.model-api.video.seedance-2.v1",
        ),
        strict["equal"](
          v30["body"]["apiUrl"],
          "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks",
        ),
        strict["equal"](v30["body"]["apiKey"], "k_volcengine"),
        strict["equal"](v30["body"]["model"], "doubao-seedance-2-0-260128"),
        strict["deepEqual"](v30["body"]["content"], [
          { type: "text", text: "camera\x20transition" },
          {
            type: "image_url",
            image_url: { url: "file-first" },
            role: "first_frame",
          },
          {
            type: "image_url",
            image_url: { url: "file-last" },
            role: "last_frame",
          },
        ]),
        strict["equal"](v30["body"]["resolution"], "1080p"),
        strict["equal"](v30["body"]["ratio"], "16:9"),
        strict["equal"](v30["body"]["duration"], 7),
        strict["equal"](v30["body"]["generate_audio"], false),
        strict["equal"](v30["body"]["seed"], 42),
        strict["equal"](
          v30["taskPolling"]?.["urlTemplate"],
          "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{taskId}",
        ));
    } finally {
      globalThis["fetch"] = v22;
    }
  }),
  test("buildGenerateVideoRequest should infer Volcengine Seedance text from empty inputs", async () => {
    const { clearApiConfig: v31 } = await import("./configApi.js");
    v31();
    const v32 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v33) => {
        if (String(v33) === "/api/config")
          return makeJsonResponse({
            providers: {
              volcengine: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_volcengine",
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + String(v33));
      };
      const v34 = await buildGenerateVideoRequest({
        provider: "volcengine",
        model: "volcengine/seedance-2.0-fast",
        prompt: "a quiet lake at sunrise",
      });
      (strict["equal"](v34["body"]["model"], "doubao-seedance-2-0-fast-260128"),
        strict["deepEqual"](v34["body"]["content"], [
          { type: "text", text: "a quiet lake at sunrise" },
        ]),
        strict["equal"](v34["body"]["resolution"], "720p"),
        strict["equal"](v34["body"]["ratio"], "adaptive"));
    } finally {
      globalThis["fetch"] = v32;
    }
  }),
  test("buildGenerateVideoRequest should infer Volcengine Seedance image from one first frame", async () => {
    const { clearApiConfig: v35 } = await import("./configApi.js");
    v35();
    const v36 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v37, v38 = {}) => {
        const v39 = String(v37);
        if (v39 === "/api/config")
          return makeJsonResponse({
            providers: {
              volcengine: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_volcengine",
              },
            },
          });
        if (v39 === "/local/first.png")
          return makeBlobResponse(
            new Blob(["first"], { type: "image/png" }),
            200,
            "image/png",
          );
        if (v39["startsWith"]("/api/v2/proxy/upload?")) {
          const v40 = Object["fromEntries"](v38["body"]["entries"]()),
            v41 = await v40["file"]["text"]();
          return makeJsonResponse({
            object: "file",
            id: "file-" + v41,
            status: "active",
            purpose: "user_data",
          });
        }
        throw new Error("unexpected fetch url: " + v39);
      };
      const v42 = await buildGenerateVideoRequest({
        provider: "volcengine",
        model: "volcengine/seedance-2.0",
        prompt: "make the subject smile",
        dreaminaRouteMode: "frames2video",
        images: ["/local/first.png"],
        inputUrls: ["/local/first.png"],
      });
      strict["deepEqual"](v42["body"]["content"], [
        { type: "text", text: "make the subject smile" },
        {
          type: "image_url",
          image_url: { url: "file-first" },
          role: "first_frame",
        },
      ]);
    } finally {
      globalThis["fetch"] = v36;
    }
  }),
  test("buildGenerateVideoRequest should map Volcengine Seedance multimodal references", async () => {
    const { clearApiConfig: v43 } = await import("./configApi.js");
    v43();
    const v44 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v45, v46 = {}) => {
        const v47 = String(v45);
        if (v47 === "/api/config")
          return makeJsonResponse({
            providers: {
              volcengine: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_volcengine",
              },
            },
          });
        if (v47 === "/local/ref.png")
          return makeBlobResponse(
            new Blob(["image"], { type: "image/png" }),
            200,
            "image/png",
          );
        if (v47 === "/local/ref.mp4")
          return makeBlobResponse(
            new Blob(["video"], { type: "video/mp4" }),
            200,
            "video/mp4",
          );
        if (v47 === "/local/ref.mp3")
          return makeBlobResponse(
            new Blob(["audio"], { type: "audio/mpeg" }),
            200,
            "audio/mpeg",
          );
        if (v47["startsWith"]("/api/v2/proxy/upload?")) {
          const v48 = Object["fromEntries"](v46["body"]["entries"]()),
            v49 = await v48["file"]["text"]();
          return (
            v49 === "video" &&
              (strict["equal"](v48["preprocess_configs[video][fps]"], "0.3"),
              strict["equal"](
                v48["preprocess_configs[video][model]"],
                "doubao-seedance-2-0-fast-260128",
              )),
            makeJsonResponse({
              object: "file",
              id: "file-" + v49,
              status: "active",
              purpose: "user_data",
            })
          );
        }
        throw new Error("unexpected\x20fetch\x20url:\x20" + v47);
      };
      const v50 = await buildGenerateVideoRequest({
        provider: "volcengine",
        model: "volcengine/seedance-2.0-fast",
        prompt: "mix references",
        inputUrls: ["/local/ref.png"],
        videos: ["/local/ref.mp4"],
        audios: ["/local/ref.mp3"],
        generationParams: {
          volcengine_seedance_2_mode: "multimodal2video",
          aspectRatio: "adaptive",
          resolution: "1080p",
          duration: 6,
        },
      });
      (strict["equal"](v50["body"]["model"], "doubao-seedance-2-0-fast-260128"),
        strict["equal"](v50["body"]["resolution"], "720p"),
        strict["equal"](v50["body"]["ratio"], "adaptive"),
        strict["deepEqual"](v50["body"]["content"], [
          { type: "text", text: "mix references" },
          {
            type: "image_url",
            image_url: { url: "file-image" },
            role: "reference_image",
          },
          {
            type: "video_url",
            video_url: { url: "file-video" },
            role: "reference_video",
          },
          {
            type: "audio_url",
            audio_url: { url: "file-audio" },
            role: "reference_audio",
          },
        ]));
    } finally {
      globalThis["fetch"] = v44;
    }
  }),
  test("buildGenerateVideoRequest should map APIMart video API body fields per manifest", async () => {
    const { clearApiConfig: v51 } = await import("./configApi.js");
    v51();
    const v52 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v53) => {
        if (String(v53) === "/api/config")
          return makeJsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        throw new Error("unexpected fetch url: " + String(v53));
      };
      const v54 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/grok-imagine-1.0",
        prompt: "a dog running on a sunny beach",
      });
      (strict["equal"](v54["body"]["model"], "grok-imagine-1.0-video-apimart"),
        strict["equal"](v54["body"]["size"], "16:9"),
        strict["equal"](v54["body"]["duration"], 6),
        strict["equal"](v54["body"]["quality"], "480p"),
        strict["equal"]("image_urls" in v54["body"], false),
        strict["equal"]("generation_type" in v54["body"], false));
      const v55 = Array["from"](
          { length: 8 },
          (v56, v57) => "https://cdn.apimart.ai/grok-ref-" + (v57 + 1) + ".png",
        ),
        v58 = await buildGenerateVideoRequest({
          provider: "apimart",
          model: "apimart/grok-imagine-1.0",
          prompt: "turn these references into a natural video",
          inputUrls: v55,
          generationParams: {
            aspectRatio: "2:3",
            duration: 45,
            quality: "720p",
          },
        });
      (strict["equal"](v58["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v58["adapterTrace"]?.["executionId"],
          "apimart.model-api.video.grok-imagine-1.v1",
        ),
        strict["equal"](v58["body"]["model"], "grok-imagine-1.0-video-apimart"),
        strict["equal"](v58["body"]["size"], "2:3"),
        strict["equal"](v58["body"]["duration"], 30),
        strict["equal"](v58["body"]["quality"], "720p"),
        strict["deepEqual"](v58["body"]["image_urls"], v55["slice"](0, 7)));
      const v59 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/omni-flash-ext",
        prompt:
          "a\x20cinematic\x20product\x20video\x20with\x20smooth\x20camera\x20movement",
        inputUrls: [
          "https://cdn.apimart.ai/omni-scene.png",
          "https://cdn.apimart.ai/omni-character.png",
          "https://cdn.apimart.ai/omni-product.png",
        ],
        generationParams: {
          aspectRatio: "9:16",
          duration: 10,
          resolution: "4k",
        },
      });
      (strict["equal"](v59["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v59["adapterTrace"]?.["executionId"],
          "apimart.model-api.video.omni-flash-ext.v1",
        ),
        strict["equal"](v59["body"]["model"], "Omni-Flash-Ext"),
        strict["equal"](v59["body"]["duration"], 10),
        strict["equal"](v59["body"]["resolution"], "4k"),
        strict["equal"](v59["body"]["aspect_ratio"], "9:16"),
        strict["deepEqual"](v59["body"]["image_urls"], [
          "https://cdn.apimart.ai/omni-scene.png",
          "https://cdn.apimart.ai/omni-character.png",
          "https://cdn.apimart.ai/omni-product.png",
        ]));
      const v60 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/omni-flash-ext",
        prompt:
          "a\x20girl\x20is\x20dancing\x20happily\x20in\x20a\x20sunny\x20garden",
        generationParams: { duration: 7, resolution: "1080p" },
      });
      (strict["equal"](v60["body"]["model"], "Omni-Flash-Ext"),
        strict["equal"](v60["body"]["duration"], 6),
        strict["equal"](v60["body"]["resolution"], "1080p"),
        strict["equal"](v60["body"]["aspect_ratio"], "16:9"),
        strict["equal"]("image_urls" in v60["body"], false),
        await strict["rejects"](
          () =>
            buildGenerateVideoRequest({
              provider: "apimart",
              model: "apimart/omni-flash-ext",
              prompt: "blend\x20two\x20references",
              inputUrls: [
                "https://cdn.apimart.ai/omni-a.png",
                "https://cdn.apimart.ai/omni-b.png",
              ],
            }),
          /Gemini Omni Flash supports only 1 or 3 reference images/,
        ));
      const v61 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/veo3-fast",
        prompt: "city lights",
        inputUrls: [
          "https://cdn.apimart.ai/veo-first.png",
          "https://cdn.apimart.ai/veo-last.png",
        ],
        generationParams: {
          mode: "quality",
          generation_type: "reference",
          aspectRatio: "9:16",
          resolution: "1080p",
          duration: 6,
          official_fallback: true,
        },
      });
      (strict["equal"](v61["body"]["model"], "veo3.1-quality"),
        strict["equal"](v61["body"]["aspect_ratio"], "9:16"),
        strict["equal"](v61["body"]["generation_type"], "frame"),
        strict["deepEqual"](v61["body"]["image_urls"], [
          "https://cdn.apimart.ai/veo-first.png",
          "https://cdn.apimart.ai/veo-last.png",
        ]),
        strict["equal"](v61["body"]["resolution"], "1080p"),
        strict["equal"](v61["body"]["duration"], 8),
        strict["equal"](v61["body"]["enable_gif"], false),
        strict["equal"]("official_fallback" in v61["body"], false),
        strict["equal"]("quality" in v61["body"], false));
      const v62 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/veo3-fast",
        prompt: "city lights",
        generationParams: {
          aspectRatio: "自适应",
          resolution: "720p",
          duration: 8,
        },
      });
      (strict["equal"](v62["body"]["aspect_ratio"], "16:9"),
        strict["equal"](v62["body"]["model"], "veo3.1-fast"),
        strict["equal"]("generation_type" in v62["body"], false));
      const v63 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/veo3-fast",
        prompt: "city lights",
        generationParams: { mode: "bad-mode", generation_type: "frame" },
      });
      (strict["equal"](v63["body"]["model"], "veo3.1-fast"),
        strict["equal"]("generation_type" in v63["body"], false),
        strict["equal"]("image_urls" in v63["body"], false));
      const v64 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/veo3-fast",
        prompt: "single image video",
        inputUrls: ["https://cdn.apimart.ai/veo-single.png"],
        generationParams: { mode: "fast", generation_type: "frame" },
      });
      (strict["equal"](v64["body"]["model"], "veo3.1-fast"),
        strict["equal"](v64["body"]["generation_type"], "frame"),
        strict["deepEqual"](v64["body"]["image_urls"], [
          "https://cdn.apimart.ai/veo-single.png",
        ]));
      const v65 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/veo3-fast",
        prompt: "reference mode without image",
        generationParams: { mode: "fast", generation_type: "reference" },
      });
      (strict["equal"](v65["body"]["model"], "veo3.1-fast"),
        strict["equal"]("generation_type" in v65["body"], false),
        strict["equal"]("image_urls" in v65["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/veo3-fast",
            prompt: "too many frames",
            inputUrls: [
              "https://cdn.apimart.ai/veo-first.png",
              "https://cdn.apimart.ai/veo-middle.png",
              "https://cdn.apimart.ai/veo-last.png",
            ],
            generationParams: { mode: "fast", generation_type: "frame" },
          }),
          /VEO3 首尾帧模式最多接入 2 张图片/,
        ));
      const v66 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/veo3-fast",
        prompt: "fixed slots",
        inputUrlsBySlot: {
          firstFrame: "https://cdn.apimart.ai/veo-first-slot.png",
          lastFrame: "https://cdn.apimart.ai/veo-last-slot.png",
        },
        generationParams: {
          mode: "fast",
          generation_type: "frame",
          aspectRatio: "16:9",
        },
      });
      (strict["equal"](v66["body"]["model"], "veo3.1-fast"),
        strict["equal"](v66["body"]["generation_type"], "frame"),
        strict["deepEqual"](v66["body"]["image_urls"], [
          "https://cdn.apimart.ai/veo-first-slot.png",
          "https://cdn.apimart.ai/veo-last-slot.png",
        ]));
      const v67 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/veo3-fast",
        prompt: "gif high resolution",
        generationParams: { resolution: "1080p", enable_gif: true },
      });
      (strict["equal"](v67["body"]["resolution"], "720p"),
        strict["equal"](v67["body"]["enable_gif"], true));
      const v68 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/minimax-hailuo",
        prompt: "[推进]一只猫咪在花园中奔跑，镜头缓缓推进特写",
        inputUrlsBySlot: {
          firstFrame: "https://cdn.apimart.ai/hailuo-first.png",
          lastFrame: "https://cdn.apimart.ai/hailuo-last.png",
        },
        generationParams: {
          duration: 10,
          resolution: "1080p",
          prompt_optimizer: false,
          fast_pretreatment: true,
          watermark: true,
        },
      });
      (strict["equal"](v68["body"]["model"], "MiniMax-Hailuo-02"),
        strict["equal"](v68["body"]["resolution"], "1080p"),
        strict["equal"](v68["body"]["duration"], 5),
        strict["equal"](v68["body"]["prompt_optimizer"], false),
        strict["equal"](v68["body"]["fast_pretreatment"], true),
        strict["equal"](v68["body"]["watermark"], true),
        strict["equal"](
          v68["body"]["first_frame_image"],
          "https://cdn.apimart.ai/hailuo-first.png",
        ),
        strict["equal"](
          v68["body"]["last_frame_image"],
          "https://cdn.apimart.ai/hailuo-last.png",
        ));
      const v69 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/hailuo-02",
        prompt: "一只可爱的猫咪在草地上奔跑",
        generationParams: { duration: 10, resolution: "768p" },
      });
      (strict["equal"](v69["body"]["model"], "MiniMax-Hailuo-02"),
        strict["equal"](v69["body"]["duration"], 10),
        strict["equal"](v69["body"]["prompt_optimizer"], true),
        strict["equal"](v69["body"]["fast_pretreatment"], false),
        strict["equal"](v69["body"]["watermark"], false),
        strict["equal"]("first_frame_image" in v69["body"], false));
      const v70 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/minimax-hailuo-2.3",
        prompt: "[推进]一只猫咪在花园中奔跑，镜头缓缓推进特写",
        inputUrlsBySlot: {
          firstFrame: "https://cdn.apimart.ai/hailuo-23-first.png",
          lastFrame: "https://cdn.apimart.ai/hailuo-23-stale-last.png",
        },
        generationParams: {
          mode: "standard",
          duration: 10,
          resolution: "1080p",
          prompt_optimizer: false,
          fast_pretreatment: true,
          watermark: true,
        },
      });
      (strict["equal"](v70["body"]["model"], "MiniMax-Hailuo-2.3"),
        strict["equal"](v70["body"]["resolution"], "1080p"),
        strict["equal"](v70["body"]["duration"], 6),
        strict["equal"](v70["body"]["prompt_optimizer"], false),
        strict["equal"](v70["body"]["fast_pretreatment"], true),
        strict["equal"](v70["body"]["watermark"], true),
        strict["equal"](
          v70["body"]["first_frame_image"],
          "https://cdn.apimart.ai/hailuo-23-first.png",
        ),
        strict["equal"]("last_frame_image" in v70["body"], false));
      const v71 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/minimax-hailuo-2.3",
        prompt: "首帧中的小猫向镜头跑来",
        inputUrls: ["https://cdn.apimart.ai/hailuo-23-fast-first.png"],
        generationParams: { mode: "fast", duration: 10, resolution: "768p" },
      });
      (strict["equal"](v71["body"]["model"], "MiniMax-Hailuo-2.3-Fast"),
        strict["equal"](v71["body"]["duration"], 10),
        strict["equal"](
          v71["body"]["first_frame_image"],
          "https://cdn.apimart.ai/hailuo-23-fast-first.png",
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/minimax-hailuo-2.3",
            prompt: "fast requires a first frame",
            generationParams: { mode: "fast" },
          }),
          /Hailuo 2\.3 Fast requires first_frame_image/,
        ));
      const v72 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/happyhorse-1.0",
        prompt: "running horse",
        inputUrls: ["https://cdn.apimart.ai/ref-1.png"],
        generationParams: {
          happyhorse_mode: "image",
          aspectRatio: "16:9",
          resolution: "720P",
          duration: 5,
          seed: "42",
          watermark: true,
        },
      });
      (strict["equal"](v72["body"]["model"], "happyhorse-1.0"),
        strict["equal"]("size" in v72["body"], false),
        strict["equal"](v72["body"]["seed"], 42),
        strict["equal"](v72["body"]["watermark"], true),
        strict["equal"](
          v72["body"]["first_frame_image"],
          "https://cdn.apimart.ai/ref-1.png",
        ),
        strict["equal"]("image_urls" in v72["body"], false),
        strict["equal"]("video_url" in v72["body"], false));
      const v73 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/happyhorse-1.0",
        prompt: "slotted horse",
        inputUrlsBySlot: { firstFrame: "https://cdn.apimart.ai/head.png" },
        generationParams: { happyhorse_mode: "image" },
      });
      (strict["equal"](
        v73["body"]["first_frame_image"],
        "https://cdn.apimart.ai/head.png",
      ),
        strict["equal"]("image_urls" in v73["body"], false));
      const v74 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/happyhorse-1.0",
        prompt: "reference horse",
        inputUrls: [
          "https://cdn.apimart.ai/ref-1.png",
          "https://cdn.apimart.ai/ref-2.png",
        ],
        generationParams: {
          happyhorse_mode: "reference",
          aspectRatio: "16:9",
          resolution: "1080P",
          duration: 5,
        },
      });
      (strict["deepEqual"](v74["body"]["image_urls"], [
        "https://cdn.apimart.ai/ref-1.png",
        "https://cdn.apimart.ai/ref-2.png",
      ]),
        strict["equal"](v74["body"]["size"], "16:9"),
        strict["equal"]("first_frame_image" in v74["body"], false));
      const v75 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/happyhorse-1.0",
        prompt: "running\x20horse",
        inputUrls: ["https://cdn.apimart.ai/ref-1.png"],
        generationParams: {
          happyhorse_mode: "image",
          aspectRatio: "自适应",
          resolution: "1080P",
          duration: 5,
        },
      });
      (strict["equal"]("size" in v75["body"], false),
        strict["equal"](
          v75["body"]["first_frame_image"],
          "https://cdn.apimart.ai/ref-1.png",
        ));
      const v76 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/happyhorse-1.0",
        prompt: "edit video",
        inputUrls: ["https://cdn.apimart.ai/style-ref.png"],
        videos: ["https://cdn.apimart.ai/source.mp4"],
        generationParams: {
          happyhorse_mode: "edit",
          audio_setting: "origin",
          aspectRatio: "16:9",
          resolution: "1080P",
          duration: 5,
        },
      });
      (strict["equal"](
        v76["body"]["video_url"],
        "https://cdn.apimart.ai/source.mp4",
      ),
        strict["deepEqual"](v76["body"]["image_urls"], [
          "https://cdn.apimart.ai/style-ref.png",
        ]),
        strict["equal"](v76["body"]["audio_setting"], "origin"),
        strict["equal"]("duration" in v76["body"], false),
        strict["equal"]("size" in v76["body"], false));
      const v77 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/happyhorse-1.0",
        prompt: "default image mode",
        inputUrls: ["https://cdn.apimart.ai/default-ref.png"],
      });
      strict["equal"](
        v77["body"]["first_frame_image"],
        "https://cdn.apimart.ai/default-ref.png",
      );
      const v78 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/happyhorse-1.0",
        prompt: "text only horse",
      });
      (strict["equal"]("first_frame_image" in v78["body"], false),
        strict["equal"]("image_urls" in v78["body"], false),
        strict["equal"]("video_url" in v78["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/happyhorse-1.0",
            prompt: "",
            generationParams: { happyhorse_mode: "auto" },
          }),
          /prompt is required/,
        ));
      const v79 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/wan2.7",
        prompt: "sync to reference",
        inputUrls: ["https://cdn.apimart.ai/ref-image.png"],
        audios: ["https://cdn.apimart.ai/ref-audio.mp3"],
        generationParams: {
          aspectRatio: "1:1",
          resolution: "1080P",
          duration: 6,
          negative_prompt: "low\x20quality",
          prompt_extend: false,
          watermark: true,
          seed: "7",
        },
      });
      (strict["deepEqual"](v79["body"]["image_urls"], [
        "https://cdn.apimart.ai/ref-image.png",
      ]),
        strict["equal"](
          v79["body"]["audio_url"],
          "https://cdn.apimart.ai/ref-audio.mp3",
        ),
        strict["equal"]("size" in v79["body"], false),
        strict["equal"](v79["body"]["negative_prompt"], "low quality"),
        strict["equal"](v79["body"]["prompt_extend"], false),
        strict["equal"](v79["body"]["watermark"], true),
        strict["equal"](v79["body"]["seed"], 7));
      const v80 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/wan2.7",
        prompt: "slot ordered frames",
        inputUrlsBySlot: {
          lastFrame: "https://cdn.apimart.ai/wan-last.png",
          firstFrame: "https://cdn.apimart.ai/wan-first.png",
        },
        generationParams: { resolution: "1080P", duration: 6 },
      });
      (strict["deepEqual"](v80["body"]["image_urls"], [
        "https://cdn.apimart.ai/wan-first.png",
        "https://cdn.apimart.ai/wan-last.png",
      ]),
        strict["equal"]("size" in v80["body"], false));
      const v81 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/wan2.7",
        prompt: "reference character and motion",
        inputUrls: ["https://cdn.apimart.ai/ref-character.png"],
        videos: ["https://cdn.apimart.ai/ref-motion.mp4"],
        audios: ["https://cdn.apimart.ai/ref-voice.mp3"],
        generationParams: {
          wan27_mode: "reference",
          resolution: "1080P",
          duration: 8,
        },
      });
      (strict["equal"](v81["body"]["model"], "wan2.7-r2v"),
        strict["deepEqual"](v81["body"]["image_with_roles"], [
          {
            url: "https://cdn.apimart.ai/ref-character.png",
            role: "reference_image",
            reference_voice: "https://cdn.apimart.ai/ref-voice.mp3",
          },
        ]),
        strict["deepEqual"](v81["body"]["video_urls"], [
          "https://cdn.apimart.ai/ref-motion.mp4",
        ]),
        strict["equal"]("image_urls" in v81["body"], false),
        strict["equal"]("audio_url" in v81["body"], false));
      const v82 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/wan2.7",
        prompt: "reference motion",
        videos: ["https://cdn.apimart.ai/ref-motion.mp4"],
        generationParams: {
          wan27_mode: "reference",
          resolution: "1080P",
          duration: 8,
        },
      });
      (strict["equal"](v82["body"]["model"], "wan2.7-r2v"),
        strict["deepEqual"](v82["body"]["video_urls"], [
          "https://cdn.apimart.ai/ref-motion.mp4",
        ]),
        strict["equal"]("image_with_roles" in v82["body"], false),
        strict["equal"]("audio_url" in v82["body"], false));
      const v83 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/wan2.7",
        prompt: "change the outfit",
        videos: [
          "https://cdn.apimart.ai/original.mp4",
          "https://cdn.apimart.ai/reference.mp4",
        ],
        generationParams: {
          wan27_mode: "edit",
          resolution: "1080P",
          duration: 0,
        },
      });
      (strict["equal"](v83["body"]["model"], "wan2.7-videoedit"),
        strict["deepEqual"](v83["body"]["video_urls"], [
          "https://cdn.apimart.ai/original.mp4",
          "https://cdn.apimart.ai/reference.mp4",
        ]),
        strict["equal"]("image_urls" in v83["body"], false));
      const v84 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/wan2.7",
        prompt: "text\x20only",
        generationParams: {
          aspectRatio: "1:1",
          resolution: "1080P",
          duration: 6,
        },
      });
      (strict["equal"](v84["body"]["size"], "1:1"),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/wan2.7",
            prompt: "bad\x20media\x20mix",
            inputUrls: ["https://cdn.apimart.ai/ref-image.png"],
            videos: ["https://cdn.apimart.ai/ref-video.mp4"],
          }),
          /image_urls cannot be used with video_urls/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/wan2.7",
            prompt: "bad\x20media\x20mix",
            videos: ["https://cdn.apimart.ai/ref-video.mp4"],
            audios: ["https://cdn.apimart.ai/ref-audio.mp3"],
          }),
          /video_urls cannot be used with audio_url/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/wan2.6",
            prompt: "removed model",
          }),
          /Video model API manifest missing/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/kling-v2-6",
            prompt: "removed\x20model",
          }),
          /Video model API manifest missing/,
        ));
      const v85 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/kling-v3",
        prompt: "cinematic motion",
        inputUrls: ["https://cdn.apimart.ai/kling-ref.png"],
        generationParams: {
          resolution: "4k",
          aspectRatio: "9:16",
          duration: 10,
          audio: true,
          watermark: true,
          seed: "42",
          negative_prompt: "blur",
        },
      });
      (strict["equal"](v85["body"]["mode"], "4k"),
        strict["equal"](v85["body"]["aspect_ratio"], "9:16"),
        strict["equal"](v85["body"]["audio"], true),
        strict["equal"](v85["body"]["watermark"], true),
        strict["equal"]("seed" in v85["body"], false),
        strict["equal"](v85["body"]["negative_prompt"], "blur"),
        strict["deepEqual"](v85["body"]["image_urls"], [
          "https://cdn.apimart.ai/kling-ref.png",
        ]),
        strict["equal"]("multi_shot" in v85["body"], false));
      const v86 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/kling-v3",
        prompt: "transition from start to end",
        inputUrlsBySlot: {
          lastFrame: "https://cdn.apimart.ai/kling-last.png",
          firstFrame: "https://cdn.apimart.ai/kling-first.png",
        },
        generationParams: {
          resolution: "std",
          aspectRatio: "16:9",
          duration: 5,
          audio: true,
          multi_shot: true,
        },
      });
      (strict["deepEqual"](v86["body"]["image_urls"], [
        "https://cdn.apimart.ai/kling-first.png",
        "https://cdn.apimart.ai/kling-last.png",
      ]),
        strict["equal"](v86["body"]["audio"], true),
        strict["equal"]("multi_shot" in v86["body"], false));
      const v87 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/kling-v3-omni",
        prompt: "start and end frame transition",
        inputUrlsBySlot: {
          lastFrame: "https://cdn.apimart.ai/omni-last.png",
          firstFrame: "https://cdn.apimart.ai/omni-first.png",
        },
        generationParams: {
          kling_v3_omni_mode: "image",
          resolution: "pro",
          aspectRatio: "9:16",
          duration: 6,
          audio: true,
          multi_shot: true,
        },
      });
      (strict["equal"](v87["body"]["model"], "kling-v3-omni"),
        strict["equal"](v87["body"]["mode"], "pro"),
        strict["equal"](v87["body"]["aspect_ratio"], "9:16"),
        strict["equal"](v87["body"]["audio"], true),
        strict["deepEqual"](v87["body"]["image_with_roles"], [
          { url: "https://cdn.apimart.ai/omni-first.png", role: "first_frame" },
          { url: "https://cdn.apimart.ai/omni-last.png", role: "last_frame" },
        ]),
        strict["equal"]("image_urls" in v87["body"], false),
        strict["equal"]("multi_shot" in v87["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/kling-v3-omni",
            prompt: "end frame only",
            inputUrlsBySlot: {
              lastFrame: "https://cdn.apimart.ai/omni-last.png",
            },
            generationParams: {
              kling_v3_omni_mode: "image",
              resolution: "pro",
            },
          }),
          /Kling V3 Omni last_frame requires first_frame input/,
        ));
      const v88 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/kling-v3-omni",
        prompt: "reference subject and motion",
        inputUrlsBySlot: {
          referenceImage: "https://cdn.apimart.ai/omni-ref.png",
        },
        videos: ["https://cdn.apimart.ai/omni-feature.mov"],
        generationParams: {
          kling_v3_omni_mode: "reference",
          resolution: "4k",
          aspectRatio: "16:9",
          duration: 5,
          audio: true,
        },
      });
      (strict["equal"](v88["body"]["mode"], "4k"),
        strict["deepEqual"](v88["body"]["image_with_roles"], [
          { url: "https://cdn.apimart.ai/omni-ref.png", role: "reference" },
        ]),
        strict["deepEqual"](v88["body"]["video_list"], [
          {
            video_url: "https://cdn.apimart.ai/omni-feature.mov",
            refer_type: "feature",
            keep_original_sound: "no",
          },
        ]),
        strict["equal"]("audio" in v88["body"], false),
        strict["equal"]("image_urls" in v88["body"], false));
      const v89 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/kling-v3-omni",
        prompt: "change\x20the\x20scene",
        videos: ["https://cdn.apimart.ai/omni-base.mp4"],
        generationParams: {
          kling_v3_omni_mode: "edit",
          resolution: "std",
          aspectRatio: "1:1",
          duration: 10,
          audio: true,
        },
      });
      (strict["deepEqual"](v89["body"]["video_list"], [
        {
          video_url: "https://cdn.apimart.ai/omni-base.mp4",
          refer_type: "base",
          keep_original_sound: "no",
        },
      ]),
        strict["equal"](v89["body"]["mode"], "std"),
        strict["equal"]("image_urls" in v89["body"], false),
        strict["equal"]("image_with_roles" in v89["body"], false),
        strict["equal"]("audio" in v89["body"], false),
        strict["equal"]("duration" in v89["body"], false),
        strict["equal"]("aspect_ratio" in v89["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/kling-v3-omni",
            prompt: "missing reference",
            generationParams: { kling_v3_omni_mode: "reference" },
          }),
          /Kling V3 Omni reference mode requires image or video input/,
        ));
      const v90 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/kling-video-o1",
        prompt: "让@图片1走向@图片2",
        inputUrls: [
          "https://cdn.apimart.ai/o1-ref-1.png",
          "https://cdn.apimart.ai/o1-ref-2.png",
        ],
        generationParams: {
          resolution: "pro",
          aspectRatio: "16:9",
          duration: 5,
        },
      });
      (strict["equal"](v90["body"]["model"], "kling-video-o1"),
        strict["equal"](v90["body"]["mode"], "pro"),
        strict["equal"](
          v90["body"]["prompt"],
          "让<<<image_1>>>走向<<<image_2>>>",
        ),
        strict["deepEqual"](v90["body"]["image_urls"], [
          "https://cdn.apimart.ai/o1-ref-1.png",
          "https://cdn.apimart.ai/o1-ref-2.png",
        ]),
        strict["equal"]("video_list" in v90["body"], false));
      const v91 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/kling-video-o1",
        prompt: "use @图片1 as subject reference",
        inputUrls: ["https://cdn.apimart.ai/o1-feature-ref.png"],
        videos: ["https://cdn.apimart.ai/o1-feature.mp4"],
        klingO1VideoRole: "feature",
        generationParams: {
          resolution: "std",
          aspectRatio: "9:16",
          duration: 10,
        },
      });
      (strict["equal"](
        v91["body"]["prompt"],
        "use <<<image_1>>> as subject reference",
      ),
        strict["deepEqual"](v91["body"]["image_urls"], [
          "https://cdn.apimart.ai/o1-feature-ref.png",
        ]),
        strict["deepEqual"](v91["body"]["video_list"], [
          {
            video_url: "https://cdn.apimart.ai/o1-feature.mp4",
            refer_type: "feature",
            keep_original_sound: "no",
          },
        ]),
        strict["equal"](v91["body"]["duration"], 10),
        strict["equal"](v91["body"]["aspect_ratio"], "9:16"));
      const v92 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/kling-video-o1",
        prompt: "edit\x20source\x20video",
        videos: ["https://cdn.apimart.ai/o1-base.mp4"],
        klingO1VideoRole: "base",
        generationParams: {
          resolution: "pro",
          aspectRatio: "1:1",
          duration: 10,
          keep_original_sound: true,
        },
      });
      (strict["deepEqual"](v92["body"]["video_list"], [
        {
          video_url: "https://cdn.apimart.ai/o1-base.mp4",
          refer_type: "base",
          keep_original_sound: "yes",
        },
      ]),
        strict["equal"]("image_urls" in v92["body"], false),
        strict["equal"]("duration" in v92["body"], false),
        strict["equal"]("aspect_ratio" in v92["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/kling-video-o1",
            prompt: "invalid edit video with image",
            inputUrls: ["https://cdn.apimart.ai/o1-invalid-ref.png"],
            videos: ["https://cdn.apimart.ai/o1-base.mp4"],
            klingO1VideoRole: "base",
          }),
          /Kling O1 base video cannot be used with image_urls/,
        ));
      const v93 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/viduq3",
        prompt: "reference motion",
        inputUrls: ["https://cdn.apimart.ai/vidu-ref-a.png"],
        generationParams: {
          vidu_q3_generation_mode: "reference",
          mode: "viduq3",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 8,
        },
      });
      (strict["equal"](v93["body"]["model"], "viduq3"),
        strict["equal"](v93["body"]["aspect_ratio"], "16:9"),
        strict["equal"]("audio" in v93["body"], false),
        strict["deepEqual"](v93["body"]["image_urls"], [
          "https://cdn.apimart.ai/vidu-ref-a.png",
        ]));
      const v94 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/viduq3",
        prompt: "reference mix",
        inputUrls: ["https://cdn.apimart.ai/vidu-mix-ref.png"],
        generationParams: {
          vidu_q3_generation_mode: "reference",
          mode: "viduq3-mix",
          resolution: "540p",
          duration: 1,
        },
      });
      (strict["equal"](v94["body"]["model"], "viduq3-mix"),
        strict["equal"](v94["body"]["resolution"], "720p"),
        strict["equal"](v94["body"]["duration"], 1));
      const v95 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/viduq3",
        prompt: "animated product shot",
        inputUrls: ["https://cdn.apimart.ai/vidu-ref.png"],
        generationParams: {
          vidu_q3_generation_mode: "video",
          mode: "viduq3-pro",
          aspectRatio: "16:9",
          resolution: "1080P",
          duration: 12,
        },
      });
      (strict["equal"](v95["body"]["model"], "viduq3-pro"),
        strict["equal"](v95["body"]["resolution"], "1080p"),
        strict["equal"](v95["body"]["audio"], true),
        strict["equal"]("aspect_ratio" in v95["body"], false),
        strict["deepEqual"](v95["body"]["image_urls"], [
          "https://cdn.apimart.ai/vidu-ref.png",
        ]));
      const v96 = await buildGenerateVideoRequest({
        provider: "apimart",
        model: "apimart/viduq3",
        prompt: "text only default",
      });
      (strict["equal"](v96["body"]["model"], "viduq3-turbo"),
        strict["equal"](v96["body"]["duration"], 5),
        strict["equal"](v96["body"]["resolution"], "720p"),
        strict["equal"](v96["body"]["audio"], true),
        strict["equal"]("image_urls" in v96["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/viduq3",
            prompt: "missing required image",
            generationParams: {
              vidu_q3_generation_mode: "reference",
              mode: "viduq3",
            },
          }),
          /reference mode requires 1-7 image inputs/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/viduq3",
            prompt: "too many video generation frames",
            inputUrls: [
              "https://cdn.apimart.ai/vidu-a.png",
              "https://cdn.apimart.ai/vidu-b.png",
              "https://cdn.apimart.ai/vidu-c.png",
            ],
          }),
          /video generation mode supports at most 2 image inputs/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "apimart",
            model: "apimart/viduq3",
            prompt: "",
          }),
          /Vidu Q3 prompt is required/,
        ));
    } finally {
      globalThis["fetch"] = v52;
    }
  }));
function makeJsonResponse(v97, v98 = 200) {
  return {
    ok: v98 >= 200 && v98 < 300,
    status: v98,
    headers: {
      get(v99) {
        return String(v99 || "")["toLowerCase"]() === "content-type"
          ? "application/json"
          : null;
      },
    },
    json: async () => v97,
    text: async () => JSON["stringify"](v97),
  };
}
function makeTextResponse(v100, v101 = 200, v102 = "text/plain") {
  return {
    ok: v101 >= 200 && v101 < 300,
    status: v101,
    headers: {
      get(v103) {
        return String(v103 || "")["toLowerCase"]() === "content-type"
          ? v102
          : null;
      },
    },
    json: async () => JSON["parse"](v100),
    text: async () => v100,
  };
}
function makeBlobResponse(v104, v105 = 200, v106 = "video/mp4") {
  return {
    ok: v105 >= 200 && v105 < 300,
    status: v105,
    headers: {
      get(v107) {
        return String(v107 || "")["toLowerCase"]() === "content-type"
          ? v106
          : null;
      },
    },
    blob: async () => v104,
    json: async () => ({}),
    text: async () => "",
  };
}
(test("buildGenerateVideoRequest should map RunningHub Kling O1 mixed endpoints", async () => {
  const { clearApiConfig: v108 } = await import("./configApi.js");
  v108();
  const v109 = globalThis["fetch"];
  try {
    globalThis["fetch"] = async (v110) => {
      if (String(v110) === "/api/config")
        return makeJsonResponse({
          providers: {
            runninghub: {
              apiUrl: "https://www.runninghub.cn",
              modelApiKey: "k_runninghub_model",
            },
          },
        });
      throw new Error("unexpected\x20fetch\x20url:\x20" + String(v110));
    };
    const v111 = await buildGenerateVideoRequest({
      provider: "runninghub",
      model: "runninghub-model/kling-video-o1",
      prompt: "city\x20lights",
      generationParams: { resolution: "std", aspectRatio: "16:9", duration: 5 },
    });
    (strict["equal"](v111["body"]["apiKey"], "k_runninghub_model"),
      strict["equal"](
        v111["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video",
      ),
      strict["equal"](v111["body"]["prompt"], "city lights"),
      strict["equal"](v111["body"]["mode"], "std"),
      strict["equal"](v111["body"]["aspectRatio"], "16:9"),
      strict["equal"](v111["body"]["duration"], "5"),
      strict["equal"]("model" in v111["body"], false),
      strict["equal"](v111["useOpenapiQuery"], true));
    const v112 = await buildGenerateVideoRequest({
      provider: "runninghub",
      model: "runninghub-model/kling-video-o1",
      prompt: "adaptive ratio",
      generationParams: { aspectRatio: "自适应" },
    });
    strict["equal"](v112["body"]["aspectRatio"], "16:9");
    const v113 = await buildGenerateVideoRequest({
      provider: "runninghub",
      model: "runninghub-model/kling-video-o1",
      prompt: "让 @图片1 慢慢转身",
      inputUrls: ["https://www.runninghub.cn/assets/o1-first.png"],
      generationParams: { aspectRatio: "9:16", duration: 10 },
    });
    (strict["equal"](
      v113["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video",
    ),
      strict["equal"](v113["body"]["prompt"], "让 <<<image_1>>> 慢慢转身"),
      strict["equal"](
        v113["body"]["firstImageUrl"],
        "https://www.runninghub.cn/assets/o1-first.png",
      ),
      strict["equal"](v113["body"]["duration"], "10"),
      strict["equal"]("lastImageUrl" in v113["body"], false));
    const v114 = await buildGenerateVideoRequest({
      provider: "runninghub",
      model: "runninghub-model/kling-video-o1",
      prompt: "从 @图片1 过渡到 @图片2",
      inputUrlsBySlot: {
        firstFrame: "https://www.runninghub.cn/assets/o1-first.png",
        lastFrame: "https://www.runninghub.cn/assets/o1-last.png",
      },
      generationParams: { aspectRatio: "1:1" },
    });
    (strict["equal"](
      v114["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/kling-video-o1/start-to-end",
    ),
      strict["equal"](
        v114["body"]["prompt"],
        "从 <<<image_1>>> 过渡到 <<<image_2>>>",
      ),
      strict["equal"](
        v114["body"]["firstImageUrl"],
        "https://www.runninghub.cn/assets/o1-first.png",
      ),
      strict["equal"](
        v114["body"]["lastImageUrl"],
        "https://www.runninghub.cn/assets/o1-last.png",
      ));
    const v115 = await buildGenerateVideoRequest({
      provider: "runninghub",
      model: "runninghub-model/kling-video-o1",
      prompt: "参考 @图片1 和 @视频1 的动作",
      inputUrlsBySlot: {
        referenceImage: "https://www.runninghub.cn/assets/o1-ref.png",
      },
      videos: ["https://www.runninghub.cn/assets/o1-ref.mp4"],
      generationParams: {
        rh_kling_o1_generation_mode: "reference",
        keep_original_sound: true,
      },
    });
    (strict["equal"](
      v115["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/kling-video-o1-std/refrence-to-video",
    ),
      strict["deepEqual"](v115["body"]["imageUrls"], [
        "https://www.runninghub.cn/assets/o1-ref.png",
      ]),
      strict["equal"](
        v115["body"]["videoUrl"],
        "https://www.runninghub.cn/assets/o1-ref.mp4",
      ),
      strict["equal"](v115["body"]["keepOriginalSound"], true),
      strict["equal"]("firstImageUrl" in v115["body"], false));
    const v116 = await buildGenerateVideoRequest({
      provider: "runninghub",
      model: "runninghub-model/kling-video-o1",
      prompt: "remove background people",
      videos: ["https://www.runninghub.cn/assets/o1-edit.mp4"],
      generationParams: {
        rh_kling_o1_generation_mode: "edit",
        mode: "pro",
        aspectRatio: "1:1",
        duration: 10,
        keep_original_sound: true,
      },
    });
    (strict["equal"](
      v116["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/kling-video-o1-std/edit-video",
    ),
      strict["equal"](v116["body"]["mode"], "std"),
      strict["equal"](v116["body"]["prompt"], "remove background people"),
      strict["equal"](
        v116["body"]["videoUrl"],
        "https://www.runninghub.cn/assets/o1-edit.mp4",
      ),
      strict["equal"](v116["body"]["keepOriginalSound"], true),
      strict["equal"]("aspectRatio" in v116["body"], false),
      strict["equal"]("duration" in v116["body"], false),
      strict["equal"]("imageUrls" in v116["body"], false),
      await strict["rejects"](
        buildGenerateVideoRequest({
          provider: "runninghub",
          model: "runninghub-model/kling-video-o1",
          prompt: "missing\x20video",
          inputUrls: ["https://www.runninghub.cn/assets/o1-ref.png"],
          generationParams: { rh_kling_o1_generation_mode: "reference" },
        }),
        /reference mode requires 1 video input/,
      ));
  } finally {
    globalThis["fetch"] = v109;
  }
}),
  test("buildGenerateVideoRequest should map RunningHub Hailuo 02 mixed endpoints", async () => {
    const { clearApiConfig: v117 } = await import("./configApi.js");
    v117();
    const v118 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v119) => {
        if (String(v119) === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected fetch url: " + String(v119));
      };
      const v120 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo-02",
        prompt: "city lights",
        generationParams: {
          rh_hailuo_02_quality: "standard",
          duration: 10,
          enablePromptExpansion: false,
        },
      });
      (strict["equal"](v120["body"]["apiKey"], "k_runninghub_model"),
        strict["equal"](
          v120["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-standard",
        ),
        strict["equal"](v120["body"]["prompt"], "city lights"),
        strict["equal"](v120["body"]["duration"], "10"),
        strict["equal"](v120["body"]["enablePromptExpansion"], false),
        strict["equal"]("model" in v120["body"], false),
        strict["equal"](v120["useOpenapiQuery"], true));
      const v121 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo-02",
        prompt: "首帧过渡到尾帧",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/hailuo-first.png",
          lastFrame: "https://www.runninghub.cn/assets/hailuo-last.png",
        },
        generationParams: { rh_hailuo_02_quality: "standard", duration: 6 },
      });
      (strict["equal"](
        v121["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-standard",
      ),
        strict["equal"](
          v121["body"]["firstImageUrl"],
          "https://www.runninghub.cn/assets/hailuo-first.png",
        ),
        strict["equal"](
          v121["body"]["lastImageUrl"],
          "https://www.runninghub.cn/assets/hailuo-last.png",
        ),
        strict["equal"](v121["body"]["duration"], "6"));
      const v122 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo-02",
        prompt: "pro text video",
        generationParams: { rh_hailuo_02_quality: "pro", duration: 10 },
      });
      (strict["equal"](
        v122["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/t2v-pro",
      ),
        strict["equal"]("duration" in v122["body"], false));
      const v123 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo02",
        prompt: "pro image video",
        inputUrls: ["https://www.runninghub.cn/assets/hailuo-pro-first.png"],
        generationParams: { rh_hailuo_02_quality: "pro" },
      });
      (strict["equal"](
        v123["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-pro",
      ),
        strict["equal"](
          v123["body"]["firstImageUrl"],
          "https://www.runninghub.cn/assets/hailuo-pro-first.png",
        ),
        strict["equal"]("lastImageUrl" in v123["body"], false),
        strict["equal"]("duration" in v123["body"], false));
      const v124 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo-02",
        prompt: "fast image video",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/hailuo-fast-first.png",
        },
        generationParams: { rh_hailuo_02_quality: "fast", duration: 10 },
      });
      (strict["equal"](
        v124["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/fast",
      ),
        strict["equal"](
          v124["body"]["imageUrl"],
          "https://www.runninghub.cn/assets/hailuo-fast-first.png",
        ),
        strict["equal"]("firstImageUrl" in v124["body"], false),
        strict["equal"](v124["body"]["duration"], "10"),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/hailuo-02",
            prompt: "fast\x20requires\x20first\x20image",
            generationParams: { rh_hailuo_02_quality: "fast" },
          }),
          /Hailuo 02 Fast requires imageUrl/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/hailuo-02",
            prompt: "pro cannot use tail frame",
            inputUrlsBySlot: {
              firstFrame:
                "https://www.runninghub.cn/assets/hailuo-pro-first.png",
              lastFrame: "https://www.runninghub.cn/assets/hailuo-pro-last.png",
            },
            generationParams: { rh_hailuo_02_quality: "pro" },
          }),
          /Hailuo 02 Pro supports only firstImageUrl/,
        ));
    } finally {
      globalThis["fetch"] = v118;
    }
  }),
  test("buildGenerateVideoRequest should map RunningHub Hailuo 2.3 mixed endpoints", async () => {
    const { clearApiConfig: v125 } = await import("./configApi.js");
    v125();
    const v126 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v127) => {
        if (String(v127) === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + String(v127));
      };
      const v128 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo-2.3",
        prompt: "city\x20lights",
        generationParams: {
          rh_hailuo_23_quality: "standard",
          duration: 10,
          enablePromptExpansion: false,
        },
      });
      (strict["equal"](v128["body"]["apiKey"], "k_runninghub_model"),
        strict["equal"](
          v128["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-standard",
        ),
        strict["equal"](v128["body"]["duration"], "10"),
        strict["equal"](v128["body"]["enablePromptExpansion"], false),
        strict["equal"]("model" in v128["body"], false),
        strict["equal"]("aspectRatio" in v128["body"], false),
        strict["equal"](v128["useOpenapiQuery"], true));
      const v129 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo-2.3",
        prompt: "让首帧动起来",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/hailuo-23-first.png",
        },
        generationParams: { rh_hailuo_23_quality: "standard", duration: 6 },
      });
      (strict["equal"](
        v129["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard",
      ),
        strict["equal"](
          v129["body"]["imageUrl"],
          "https://www.runninghub.cn/assets/hailuo-23-first.png",
        ),
        strict["equal"](v129["body"]["duration"], "6"),
        strict["equal"]("firstImageUrl" in v129["body"], false),
        strict["equal"]("lastImageUrl" in v129["body"], false));
      const v130 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo-2.3",
        prompt: "pro text video",
        generationParams: { rh_hailuo_23_quality: "pro", duration: 10 },
      });
      (strict["equal"](
        v130["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-pro",
      ),
        strict["equal"]("duration" in v130["body"], false));
      const v131 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo23",
        prompt: "pro\x20image\x20video",
        inputUrls: ["https://www.runninghub.cn/assets/hailuo-23-pro-first.png"],
        generationParams: { rh_hailuo_23_quality: "pro" },
      });
      (strict["equal"](
        v131["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/image-to-video-pro",
      ),
        strict["equal"](
          v131["body"]["imageUrl"],
          "https://www.runninghub.cn/assets/hailuo-23-pro-first.png",
        ),
        strict["equal"]("firstImageUrl" in v131["body"], false),
        strict["equal"]("duration" in v131["body"], false));
      const v132 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo-2.3",
        prompt: "fast image video",
        inputUrlsBySlot: {
          firstFrame:
            "https://www.runninghub.cn/assets/hailuo-23-fast-first.png",
        },
        generationParams: { rh_hailuo_23_quality: "fast", duration: 10 },
      });
      (strict["equal"](
        v132["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast/image-to-video",
      ),
        strict["equal"](v132["body"]["duration"], "10"),
        strict["equal"](
          v132["body"]["imageUrl"],
          "https://www.runninghub.cn/assets/hailuo-23-fast-first.png",
        ),
        strict["equal"]("firstImageUrl" in v132["body"], false));
      const v133 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/hailuo-2.3",
        prompt: "fast pro image video",
        inputUrlsBySlot: {
          firstFrame:
            "https://www.runninghub.cn/assets/hailuo-23-fast-pro-first.png",
        },
        generationParams: { rh_hailuo_23_quality: "fastPro", duration: 10 },
      });
      (strict["equal"](
        v133["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast-pro/image-to-video",
      ),
        strict["equal"](v133["body"]["duration"], "6"),
        strict["equal"](
          v133["body"]["imageUrl"],
          "https://www.runninghub.cn/assets/hailuo-23-fast-pro-first.png",
        ),
        strict["equal"]("firstImageUrl" in v133["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/hailuo-2.3",
            prompt: "fast requires first image",
            generationParams: { rh_hailuo_23_quality: "fast" },
          }),
          /Hailuo 2\.3 Fast requires imageUrl/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/hailuo-2.3",
            prompt: "only one image",
            inputUrls: [
              "https://www.runninghub.cn/assets/hailuo-23-a.png",
              "https://www.runninghub.cn/assets/hailuo-23-b.png",
            ],
          }),
          /Hailuo 2\.3 supports only imageUrl/,
        ));
    } finally {
      globalThis["fetch"] = v126;
    }
  }),
  test("buildGenerateVideoRequest should map RunningHub Veo3 mixed endpoints", async () => {
    const { clearApiConfig: v134 } = await import("./configApi.js");
    v134();
    const v135 = globalThis["fetch"];
    let v136 = 0;
    try {
      globalThis["fetch"] = async (v137) => {
        if (String(v137) === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (String(v137) === "https://source.local/veo3-dup.png")
          return {
            ok: true,
            status: 200,
            headers: { get: () => "image/png" },
            blob: async () => new Blob(["veo3-dup"], { type: "image/png" }),
            text: async () => "",
          };
        if (String(v137)["includes"]("/api/v2/proxy/upload"))
          return (
            (v136 += 1),
            makeJsonResponse({
              data: {
                download_url:
                  "https://www.runninghub.cn/uploaded/veo3-dup-" +
                  v136 +
                  ".png",
              },
            })
          );
        throw new Error("unexpected fetch url: " + String(v137));
      };
      const v138 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/veo3",
        prompt: "low fast text",
        generationParams: {
          rh_veo3_channel: "lowCost",
          mode: "fast",
          aspectRatio: "自适应",
          duration: 6,
          resolution: "4k",
          generateAudio: true,
        },
      });
      (strict["equal"](v138["body"]["apiKey"], "k_runninghub_model"),
        strict["equal"](
          v138["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/text-to-video",
        ),
        strict["equal"](v138["body"]["prompt"], "low fast text"),
        strict["equal"](v138["body"]["resolution"], "720p"),
        strict["equal"](v138["body"]["duration"], "8"),
        strict["equal"](v138["body"]["aspectRatio"], "16:9"),
        strict["equal"]("model" in v138["body"], false),
        strict["equal"]("generateAudio" in v138["body"], false),
        strict["equal"](v138["useOpenapiQuery"], true));
      const v139 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/veo3.1",
        prompt: "low image",
        inputUrls: ["https://www.runninghub.cn/assets/veo3-first.png"],
        generationParams: { rh_veo3_channel: "lowCost", mode: "fast" },
      });
      (strict["equal"](
        v139["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video",
      ),
        strict["deepEqual"](v139["body"]["imageUrls"], [
          "https://www.runninghub.cn/assets/veo3-first.png",
        ]));
      const v140 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/veo3.1",
        prompt: "low image duplicate slot",
        inputUrls: ["https://source.local/veo3-dup.png"],
        inputUrlsBySlot: { firstFrame: "https://source.local/veo3-dup.png" },
        generationParams: { rh_veo3_channel: "lowCost", mode: "fast" },
      });
      (strict["equal"](
        v140["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video",
      ),
        strict["deepEqual"](v140["body"]["imageUrls"], [
          "https://www.runninghub.cn/uploaded/veo3-dup-1.png",
        ]),
        strict["equal"](v136, 1),
        strict["equal"]("firstFrameUrl" in v140["body"], false),
        strict["equal"]("lastFrameUrl" in v140["body"], false));
      const v141 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/veo3",
        prompt: "low\x20pro\x20frames",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/veo3-first.png",
          lastFrame: "https://www.runninghub.cn/assets/veo3-last.png",
        },
        generationParams: {
          rh_veo3_channel: "lowCost",
          mode: "pro",
          aspectRatio: "9:16",
        },
      });
      (strict["equal"](
        v141["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/start-end-to-video",
      ),
        strict["equal"](
          v141["body"]["firstFrameUrl"],
          "https://www.runninghub.cn/assets/veo3-first.png",
        ),
        strict["equal"](
          v141["body"]["lastFrameUrl"],
          "https://www.runninghub.cn/assets/veo3-last.png",
        ),
        strict["equal"](v141["body"]["aspectRatio"], "9:16"));
      const v142 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/veo3",
        prompt: "official pro text",
        generationParams: {
          rh_veo3_channel: "official",
          mode: "pro",
          aspectRatio: "9:16",
          duration: 6,
          resolution: "4k",
          generateAudio: true,
        },
      });
      (strict["equal"](
        v142["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/text-to-video",
      ),
        strict["equal"](v142["body"]["resolution"], "4k"),
        strict["equal"](v142["body"]["duration"], "6"),
        strict["equal"](v142["body"]["generateAudio"], true));
      const v143 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/veo3",
        prompt: "official reference",
        inputUrlsBySlot: {
          referenceImage: "https://www.runninghub.cn/assets/veo3-ref-a.png",
        },
        inputUrls: ["https://www.runninghub.cn/assets/veo3-ref-b.png"],
        generationParams: {
          rh_veo3_channel: "official",
          mode: "fast",
          generation_type: "reference",
          aspectRatio: "16:9",
        },
      });
      (strict["equal"](
        v143["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/reference-to-video",
      ),
        strict["deepEqual"](v143["body"]["imageUrls"], [
          "https://www.runninghub.cn/assets/veo3-ref-a.png",
          "https://www.runninghub.cn/assets/veo3-ref-b.png",
        ]),
        strict["equal"]("duration" in v143["body"], false),
        strict["equal"](v143["body"]["aspectRatio"], "16:9"));
      const v144 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/veo3",
        videos: ["https://www.runninghub.cn/assets/veo3-extend.mp4"],
        generationParams: {
          rh_veo3_channel: "official",
          mode: "fast",
          generation_type: "extend",
          resolution: "1080p",
          aspectRatio: "9:16",
          duration: 8,
          generateAudio: true,
        },
      });
      (strict["equal"](
        v144["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast-official/video-extend",
      ),
        strict["equal"](
          v144["body"]["video"],
          "https://www.runninghub.cn/assets/veo3-extend.mp4",
        ),
        strict["equal"](v144["body"]["resolution"], "1080p"),
        strict["equal"]("prompt" in v144["body"], false),
        strict["equal"]("duration" in v144["body"], false),
        strict["equal"]("aspectRatio" in v144["body"], false),
        strict["equal"]("generateAudio" in v144["body"], false));
      const v145 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/veo3",
        prompt: "official lite frames",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/veo3-lite-first.png",
          lastFrame: "https://www.runninghub.cn/assets/veo3-lite-last.png",
        },
        generationParams: {
          rh_veo3_channel: "official",
          mode: "lite",
          duration: 8,
          generateAudio: true,
        },
      });
      (strict["equal"](
        v145["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-lite-official/start-end-to-video",
      ),
        strict["equal"](
          v145["body"]["firstImageUrl"],
          "https://www.runninghub.cn/assets/veo3-lite-first.png",
        ),
        strict["equal"](
          v145["body"]["lastImageUrl"],
          "https://www.runninghub.cn/assets/veo3-lite-last.png",
        ),
        strict["equal"]("duration" in v145["body"], false),
        strict["equal"]("generateAudio" in v145["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/veo3",
            prompt: "official\x20fast\x20start-end\x20is\x20not\x20published",
            inputUrlsBySlot: {
              firstFrame:
                "https://www.runninghub.cn/assets/veo3-fast-first.png",
              lastFrame: "https://www.runninghub.cn/assets/veo3-fast-last.png",
            },
            generationParams: { rh_veo3_channel: "official", mode: "fast" },
          }),
          /official Fast\/Pro start-end endpoint is not published/,
        ));
    } finally {
      globalThis["fetch"] = v135;
    }
  }),
  test("buildGenerateVideoRequest\x20should\x20map\x20RunningHub\x20Kling\x20V3.0\x20mixed\x20endpoints", async () => {
    const { clearApiConfig: v146 } = await import("./configApi.js");
    v146();
    const v147 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v148) => {
        if (String(v148) === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected fetch url: " + String(v148));
      };
      const v149 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-v3",
        prompt: "kling v3 text",
        generationParams: {
          resolution: "std",
          aspectRatio: "自适应",
          duration: 2,
          audio: true,
          cfgScale: 0.83,
          shotType: "intelligence",
          negative_prompt: "blur",
        },
      });
      (strict["equal"](v149["body"]["apiKey"], "k_runninghub_model"),
        strict["equal"](
          v149["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/kling-v3.0-std/text-to-video",
        ),
        strict["equal"](v149["body"]["prompt"], "kling v3 text"),
        strict["equal"](v149["body"]["aspectRatio"], "16:9"),
        strict["equal"](v149["body"]["duration"], "3"),
        strict["equal"](v149["body"]["sound"], true),
        strict["equal"](v149["body"]["cfgScale"], 0.8),
        strict["equal"](v149["body"]["multiShot"], false),
        strict["equal"](v149["body"]["shotType"], "intelligence"),
        strict["equal"](v149["body"]["negativePrompt"], "blur"),
        strict["equal"]("model" in v149["body"], false),
        strict["equal"](v149["useOpenapiQuery"], true));
      const v150 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-v3.0",
        prompt: "start to end",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/kling-first.png",
          lastFrame: "https://www.runninghub.cn/assets/kling-last.png",
        },
        generationParams: {
          resolution: "pro",
          aspectRatio: "1:1",
          duration: 15,
        },
      });
      (strict["equal"](
        v150["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-v3.0-pro/image-to-video",
      ),
        strict["equal"](
          v150["body"]["firstImageUrl"],
          "https://www.runninghub.cn/assets/kling-first.png",
        ),
        strict["equal"](
          v150["body"]["lastImageUrl"],
          "https://www.runninghub.cn/assets/kling-last.png",
        ),
        strict["equal"]("aspectRatio" in v150["body"], false));
      const v151 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-v30",
        prompt: "kling v3 4k text",
        generationParams: {
          resolution: "4k",
          aspectRatio: "9:16",
          duration: 15,
        },
      });
      (strict["equal"](
        v151["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-v3-4k/text-to-video",
      ),
        strict["equal"](v151["body"]["duration"], "15"),
        strict["equal"](v151["body"]["aspectRatio"], "9:16"));
      const v152 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-v3",
        prompt: "kling v3 4k image",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/kling-4k.png",
        },
        generationParams: { resolution: "4k", aspectRatio: "自适应" },
      });
      (strict["equal"](
        v152["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video",
      ),
        strict["equal"](
          v152["body"]["imageUrl"],
          "https://www.runninghub.cn/assets/kling-4k.png",
        ),
        strict["equal"]("firstImageUrl" in v152["body"], false),
        strict["equal"]("aspectRatio" in v152["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/kling-v3",
            prompt: "4k frames",
            inputUrlsBySlot: {
              firstFrame: "https://www.runninghub.cn/assets/kling-4k-first.png",
              lastFrame: "https://www.runninghub.cn/assets/kling-4k-last.png",
            },
            generationParams: { resolution: "4k" },
          }),
          /4K image-to-video supports only one imageUrl/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/kling-v3",
            prompt: "video unsupported",
            videos: ["https://www.runninghub.cn/assets/kling-source.mp4"],
          }),
          /does not accept video input/,
        ));
    } finally {
      globalThis["fetch"] = v147;
    }
  }),
  test("buildGenerateVideoRequest\x20should\x20map\x20RunningHub\x20Kling\x20O3\x20mixed\x20endpoints", async () => {
    const { clearApiConfig: v153 } = await import("./configApi.js");
    v153();
    const v154 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v155) => {
        if (String(v155) === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected fetch url: " + String(v155));
      };
      const v156 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-o3",
        prompt: "kling o3 text",
        generationParams: {
          resolution: "std",
          aspectRatio: "自适应",
          duration: 2,
          audio: true,
          shotType: "customize",
        },
      });
      (strict["equal"](v156["body"]["apiKey"], "k_runninghub_model"),
        strict["equal"](
          v156["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/kling-video-o3-std/text-to-video",
        ),
        strict["equal"](v156["body"]["prompt"], "kling o3 text"),
        strict["equal"](v156["body"]["aspectRatio"], "16:9"),
        strict["equal"](v156["body"]["duration"], "3"),
        strict["equal"](v156["body"]["sound"], true),
        strict["equal"](v156["body"]["multiShot"], false),
        strict["equal"](v156["body"]["shotType"], "customize"),
        strict["equal"]("model" in v156["body"], false),
        strict["equal"](v156["useOpenapiQuery"], true));
      const v157 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-video-o3",
        prompt: "o3 start to end",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/o3-first.png",
          lastFrame: "https://www.runninghub.cn/assets/o3-last.png",
        },
        generationParams: {
          resolution: "pro",
          aspectRatio: "1:1",
          duration: 15,
        },
      });
      (strict["equal"](
        v157["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/image-to-video",
      ),
        strict["equal"](
          v157["body"]["firstImageUrl"],
          "https://www.runninghub.cn/assets/o3-first.png",
        ),
        strict["equal"](
          v157["body"]["lastImageUrl"],
          "https://www.runninghub.cn/assets/o3-last.png",
        ),
        strict["equal"]("aspectRatio" in v157["body"], false));
      const v158 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-o3",
        prompt: "kling o3 4k text",
        generationParams: {
          resolution: "4k",
          aspectRatio: "9:16",
          duration: 15,
        },
      });
      (strict["equal"](
        v158["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/text-to-video",
      ),
        strict["equal"](v158["body"]["duration"], "15"),
        strict["equal"](v158["body"]["aspectRatio"], "9:16"));
      const v159 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-o3",
        prompt: "kling\x20o3\x204k\x20image",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/o3-4k.png",
        },
        generationParams: { resolution: "4k", aspectRatio: "自适应" },
      });
      (strict["equal"](
        v159["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video",
      ),
        strict["equal"](
          v159["body"]["firstImageUrl"],
          "https://www.runninghub.cn/assets/o3-4k.png",
        ),
        strict["equal"]("aspectRatio" in v159["body"], false));
      const v160 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-o3",
        prompt: "参考 @图片1 和 @视频1 的动作",
        inputUrlsBySlot: {
          referenceImage: "https://www.runninghub.cn/assets/o3-ref.png",
        },
        videos: ["https://www.runninghub.cn/assets/o3-ref.mp4"],
        generationParams: {
          resolution: "pro",
          kling_v3_omni_mode: "reference",
          aspectRatio: "16:9",
          duration: 5,
          keep_original_sound: true,
          audio: false,
          shotType: "customize",
        },
      });
      (strict["equal"](
        v160["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/reference-to-video",
      ),
        strict["deepEqual"](v160["body"]["imageUrls"], [
          "https://www.runninghub.cn/assets/o3-ref.png",
        ]),
        strict["equal"](
          v160["body"]["videoUrl"],
          "https://www.runninghub.cn/assets/o3-ref.mp4",
        ),
        strict["equal"](v160["body"]["keepOriginalSound"], true),
        strict["equal"](v160["body"]["aspectRatio"], "16:9"),
        strict["equal"](v160["body"]["duration"], "5"),
        strict["equal"](v160["body"]["sound"], false),
        strict["equal"]("shotType" in v160["body"], false));
      const v161 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-o3",
        prompt: "o3 4k reference",
        inputUrlsBySlot: {
          referenceImage: "https://www.runninghub.cn/assets/o3-4k-ref.png",
        },
        generationParams: {
          resolution: "4k",
          kling_v3_omni_mode: "reference",
          shotType: "customize",
        },
      });
      (strict["equal"](
        v161["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/reference-to-video",
      ),
        strict["equal"](v161["body"]["shotType"], "customize"));
      const v162 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/kling-o3",
        prompt: "Change\x20the\x20time\x20to\x20night",
        inputUrlsBySlot: {
          editRefImage: "https://www.runninghub.cn/assets/o3-edit-ref.png",
        },
        videos: ["https://www.runninghub.cn/assets/o3-edit.mp4"],
        generationParams: {
          resolution: "std",
          kling_v3_omni_mode: "edit",
          keep_original_sound: true,
          audio: true,
          duration: 9,
        },
      });
      (strict["equal"](
        v162["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/kling-video-o3-std/video-edit",
      ),
        strict["equal"](
          v162["body"]["videoUrl"],
          "https://www.runninghub.cn/assets/o3-edit.mp4",
        ),
        strict["deepEqual"](v162["body"]["imageUrls"], [
          "https://www.runninghub.cn/assets/o3-edit-ref.png",
        ]),
        strict["equal"](v162["body"]["keepOriginalSound"], true),
        strict["equal"]("duration" in v162["body"], false),
        strict["equal"]("sound" in v162["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/kling-o3",
            prompt: "4k frames",
            inputUrlsBySlot: {
              firstFrame: "https://www.runninghub.cn/assets/o3-4k-first.png",
              lastFrame: "https://www.runninghub.cn/assets/o3-4k-last.png",
            },
            generationParams: { resolution: "4k" },
          }),
          /4K image-to-video supports only one firstImageUrl/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/kling-o3",
            prompt: "4k edit",
            videos: ["https://www.runninghub.cn/assets/o3-edit.mp4"],
            generationParams: { resolution: "4k", kling_v3_omni_mode: "edit" },
          }),
          /4K does not support video edit/,
        ));
    } finally {
      globalThis["fetch"] = v154;
    }
  }),
  test("buildGenerateVideoRequest should map RunningHub Seedance 2.0 mixed endpoints", async () => {
    const { clearApiConfig: v163 } = await import("./configApi.js");
    v163();
    const v164 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v165) => {
        if (String(v165) === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected fetch url: " + String(v165));
      };
      const v166 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/seedance-2.0",
        prompt: "seedance text",
        generationParams: {
          rh_seedance_2_mode: "text2video",
          resolution: "4k",
          aspectRatio: "自适应",
          duration: 15,
          generateAudio: true,
          webSearch: true,
          seed: "42",
        },
      });
      (strict["equal"](v166["body"]["apiKey"], "k_runninghub_model"),
        strict["equal"](
          v166["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video",
        ),
        strict["equal"](v166["body"]["prompt"], "seedance text"),
        strict["equal"](v166["body"]["resolution"], "4k"),
        strict["equal"](v166["body"]["duration"], "15"),
        strict["equal"](v166["body"]["ratio"], "16:9"),
        strict["equal"](v166["body"]["generateAudio"], true),
        strict["equal"](v166["body"]["webSearch"], true),
        strict["equal"](v166["body"]["returnLastFrame"], false),
        strict["equal"](v166["body"]["seed"], 42),
        strict["equal"]("model" in v166["body"], false),
        strict["equal"]("firstFrameUrl" in v166["body"], false),
        strict["equal"]("imageUrls" in v166["body"], false),
        strict["equal"]("conversionSlots" in v166["body"], false),
        strict["equal"](v166["useOpenapiQuery"], true));
      const v167 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/seedance2.0",
        prompt: "seedance frames",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/seedance-first.png",
          lastFrame: "https://www.runninghub.cn/assets/seedance-last.png",
        },
        generationParams: {
          rh_seedance_2_model: "standard",
          rh_seedance_2_mode: "frames2video",
          resolution: "native1080p",
          aspectRatio: "21:9",
          duration: 4,
          generateAudio: false,
          webSearch: true,
          realPersonMode: true,
        },
      });
      (strict["equal"](
        v167["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/image-to-video",
      ),
        strict["equal"](v167["body"]["resolution"], "native1080p"),
        strict["equal"](v167["body"]["duration"], "4"),
        strict["equal"](v167["body"]["ratio"], "21:9"),
        strict["equal"](v167["body"]["generateAudio"], false),
        strict["equal"](
          v167["body"]["firstFrameUrl"],
          "https://www.runninghub.cn/assets/seedance-first.png",
        ),
        strict["equal"](
          v167["body"]["lastFrameUrl"],
          "https://www.runninghub.cn/assets/seedance-last.png",
        ),
        strict["equal"](v167["body"]["realPersonMode"], true),
        strict["equal"](v167["body"]["returnLastFrame"], false),
        strict["deepEqual"](v167["body"]["conversionSlots"], ["all"]),
        strict["equal"]("webSearch" in v167["body"], false),
        strict["equal"]("imageUrls" in v167["body"], false));
      const v168 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/seedance-2.0",
        prompt: "seedance reference",
        inputUrlsBySlot: {
          referenceImage: "https://www.runninghub.cn/assets/seedance-ref.png",
        },
        inputUrls: ["https://www.runninghub.cn/assets/seedance-ref-2.png"],
        videos: ["https://www.runninghub.cn/assets/seedance-ref.mp4"],
        audios: ["https://www.runninghub.cn/assets/seedance-ref.mp3"],
        generationParams: {
          rh_seedance_2_model: "fast",
          rh_seedance_2_mode: "multimodal2video",
          aspectRatio: "3:4",
          generateAudio: false,
        },
      });
      (strict["equal"](
        v168["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/multimodal-video",
      ),
        strict["deepEqual"](v168["body"]["imageUrls"], [
          "https://www.runninghub.cn/assets/seedance-ref.png",
          "https://www.runninghub.cn/assets/seedance-ref-2.png",
        ]),
        strict["deepEqual"](v168["body"]["videoUrls"], [
          "https://www.runninghub.cn/assets/seedance-ref.mp4",
        ]),
        strict["deepEqual"](v168["body"]["audioUrls"], [
          "https://www.runninghub.cn/assets/seedance-ref.mp3",
        ]),
        strict["equal"](v168["body"]["ratio"], "3:4"),
        strict["equal"](v168["body"]["generateAudio"], false),
        strict["equal"]("firstFrameUrl" in v168["body"], false),
        strict["equal"]("webSearch" in v168["body"], false),
        strict["equal"]("conversionSlots" in v168["body"], false),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/seedance-2.0",
            prompt: "audio\x20only",
            audios: ["https://www.runninghub.cn/assets/seedance-ref.mp3"],
            generationParams: { rh_seedance_2_mode: "multimodal2video" },
          }),
          /multimodal mode requires image or video input/,
        ));
    } finally {
      globalThis["fetch"] = v164;
    }
  }),
  test("buildGenerateVideoRequest should map RunningHub HappyHorse 1.0 mixed endpoints", async () => {
    const { clearApiConfig: v169 } = await import("./configApi.js");
    v169();
    const v170 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v171) => {
        if (String(v171) === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected fetch url: " + String(v171));
      };
      const v172 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/happyhorse-1.0",
        prompt: "happyhorse text",
        generationParams: {
          resolution: "1080P",
          aspectRatio: "自适应",
          duration: 16,
          seed: "42",
        },
      });
      (strict["equal"](v172["body"]["apiKey"], "k_runninghub_model"),
        strict["equal"](
          v172["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video",
        ),
        strict["equal"](v172["body"]["prompt"], "happyhorse text"),
        strict["equal"](v172["body"]["resolution"], "1080p"),
        strict["equal"](v172["body"]["duration"], "15"),
        strict["equal"](v172["body"]["aspectRatio"], "16:9"),
        strict["equal"](v172["body"]["seed"], 42),
        strict["equal"]("model" in v172["body"], false),
        strict["equal"]("audioSetting" in v172["body"], false),
        strict["equal"](v172["useOpenapiQuery"], true));
      const v173 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/happyhorse",
        prompt: "happyhorse image",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/happyhorse-first.png",
        },
        generationParams: {
          happyhorse_mode: "image",
          resolution: "720P",
          aspectRatio: "1:1",
          duration: 3,
        },
      });
      (strict["equal"](
        v173["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video",
      ),
        strict["equal"](
          v173["body"]["imageUrl"],
          "https://www.runninghub.cn/assets/happyhorse-first.png",
        ),
        strict["equal"](v173["body"]["resolution"], "720p"),
        strict["equal"](v173["body"]["duration"], "3"),
        strict["equal"]("aspectRatio" in v173["body"], false),
        strict["equal"]("imageUrls" in v173["body"], false));
      const v174 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/happyhorse-1.0",
        prompt: "happyhorse reference",
        inputUrlsBySlot: {
          referenceImage: "https://www.runninghub.cn/assets/happyhorse-ref.png",
        },
        inputUrls: ["https://www.runninghub.cn/assets/happyhorse-ref-2.png"],
        generationParams: {
          happyhorse_mode: "reference",
          aspectRatio: "3:4",
          resolution: "1080P",
          duration: 5,
        },
      });
      (strict["equal"](
        v174["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/reference-to-video",
      ),
        strict["deepEqual"](v174["body"]["imageUrls"], [
          "https://www.runninghub.cn/assets/happyhorse-ref.png",
          "https://www.runninghub.cn/assets/happyhorse-ref-2.png",
        ]),
        strict["equal"](v174["body"]["aspectRatio"], "3:4"),
        strict["equal"]("imageUrl" in v174["body"], false));
      const v175 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/happyhorse-1.0",
        prompt: "happyhorse edit",
        inputUrlsBySlot: {
          editRefImage:
            "https://www.runninghub.cn/assets/happyhorse-edit-ref.png",
        },
        videos: ["https://www.runninghub.cn/assets/happyhorse-source.mp4"],
        generationParams: {
          happyhorse_mode: "edit",
          audio_setting: "origin",
          resolution: "1080P",
          duration: 9,
        },
      });
      (strict["equal"](
        v175["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/video-edit",
      ),
        strict["equal"](
          v175["body"]["videoUrl"],
          "https://www.runninghub.cn/assets/happyhorse-source.mp4",
        ),
        strict["deepEqual"](v175["body"]["imageUrls"], [
          "https://www.runninghub.cn/assets/happyhorse-edit-ref.png",
        ]),
        strict["equal"](v175["body"]["audioSetting"], "origin"),
        strict["equal"]("duration" in v175["body"], false),
        strict["equal"]("aspectRatio" in v175["body"], false));
      const v176 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/happyhorse-1.0",
        prompt: "default image mode",
        inputUrls: ["https://www.runninghub.cn/assets/happyhorse-default.png"],
      });
      (strict["equal"](
        v176["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video",
      ),
        strict["equal"](
          v176["body"]["imageUrl"],
          "https://www.runninghub.cn/assets/happyhorse-default.png",
        ));
      const v177 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/happyhorse-1.0",
        prompt: "text\x20only\x20happyhorse",
      });
      (strict["equal"](
        v177["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/text-to-video",
      ),
        strict["equal"]("imageUrl" in v177["body"], false),
        strict["equal"]("imageUrls" in v177["body"], false),
        strict["equal"]("videoUrl" in v177["body"], false));
    } finally {
      globalThis["fetch"] = v170;
    }
  }),
  test("buildGenerateVideoRequest\x20should\x20map\x20RunningHub\x20Wan2.7\x20mixed\x20endpoints", async () => {
    const { clearApiConfig: v178 } = await import("./configApi.js");
    v178();
    const v179 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v180) => {
        if (String(v180) === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected fetch url: " + String(v180));
      };
      const v181 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/wan2.7",
        prompt: "wan\x20text",
        generationParams: {
          wan27_mode: "image",
          aspectRatio: "自适应",
          duration: 4,
          resolution: "1080P",
          prompt_extend: false,
          negative_prompt: "blur",
        },
      });
      (strict["equal"](v181["body"]["apiKey"], "k_runninghub_model"),
        strict["equal"](
          v181["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/text-to-video",
        ),
        strict["equal"](v181["body"]["prompt"], "wan text"),
        strict["equal"](v181["body"]["resolution"], "1080P"),
        strict["equal"](v181["body"]["duration"], "5"),
        strict["equal"](v181["body"]["aspectRatio"], "16:9"),
        strict["equal"](v181["body"]["promptExtend"], false),
        strict["equal"](v181["body"]["negativePrompt"], "blur"),
        strict["equal"]("model" in v181["body"], false),
        strict["equal"](v181["useOpenapiQuery"], true));
      const v182 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/wan27",
        prompt: "wan\x20frames",
        inputUrlsBySlot: {
          firstFrame: "https://www.runninghub.cn/assets/wan-first.png",
          lastFrame: "https://www.runninghub.cn/assets/wan-last.png",
        },
        generationParams: { wan27_mode: "image", duration: 8 },
      });
      (strict["equal"](
        v182["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video",
      ),
        strict["equal"](
          v182["body"]["firstImageUrl"],
          "https://www.runninghub.cn/assets/wan-first.png",
        ),
        strict["equal"](
          v182["body"]["lastImageUrl"],
          "https://www.runninghub.cn/assets/wan-last.png",
        ),
        strict["equal"]("aspectRatio" in v182["body"], false));
      const v183 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/wan2.7",
        prompt: "continue video",
        videos: ["https://www.runninghub.cn/assets/wan-source.mp4"],
        audios: ["https://www.runninghub.cn/assets/wan-audio.mp3"],
        generationParams: {
          wan27_mode: "video",
          duration: 15,
          negative_prompt: "low quality",
        },
      });
      (strict["equal"](
        v183["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-extend",
      ),
        strict["equal"](
          v183["body"]["videoUrl"],
          "https://www.runninghub.cn/assets/wan-source.mp4",
        ),
        strict["equal"](
          v183["body"]["audioUrl"],
          "https://www.runninghub.cn/assets/wan-audio.mp3",
        ),
        strict["equal"](v183["body"]["negativePrompt"], "low\x20quality"));
      const v184 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/wan2.7",
        prompt: "reference video",
        inputUrlsBySlot: {
          referenceImage: "https://www.runninghub.cn/assets/wan-ref.png",
        },
        videos: ["https://www.runninghub.cn/assets/wan-ref.mp4"],
        generationParams: { wan27_mode: "reference", aspectRatio: "9:16" },
      });
      (strict["equal"](
        v184["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/reference-to-video",
      ),
        strict["deepEqual"](v184["body"]["imageUrls"], [
          "https://www.runninghub.cn/assets/wan-ref.png",
        ]),
        strict["deepEqual"](v184["body"]["videoUrls"], [
          "https://www.runninghub.cn/assets/wan-ref.mp4",
        ]),
        strict["equal"](v184["body"]["aspectRatio"], "9:16"));
      const v185 = await buildGenerateVideoRequest({
        provider: "runninghub",
        model: "runninghub-model/wan2.7",
        prompt: "edit video",
        inputUrlsBySlot: {
          editRefImage: "https://www.runninghub.cn/assets/wan-edit-ref.png",
        },
        videos: ["https://www.runninghub.cn/assets/wan-original.mp4"],
        generationParams: { wan27_mode: "edit", duration: 0 },
      });
      (strict["equal"](
        v185["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/video-edit",
      ),
        strict["equal"](
          v185["body"]["videoUrl"],
          "https://www.runninghub.cn/assets/wan-original.mp4",
        ),
        strict["deepEqual"](v185["body"]["imageUrls"], [
          "https://www.runninghub.cn/assets/wan-edit-ref.png",
        ]),
        strict["equal"](v185["body"]["duration"], "0"),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/wan2.7",
            prompt: "reference audio unsupported",
            inputUrls: ["https://www.runninghub.cn/assets/wan-ref.png"],
            audios: ["https://www.runninghub.cn/assets/wan-audio.mp3"],
            generationParams: { wan27_mode: "reference" },
          }),
          /reference mode does not accept audio input/,
        ),
        await strict["rejects"](
          buildGenerateVideoRequest({
            provider: "runninghub",
            model: "runninghub-model/wan2.7",
            prompt: "edit two videos unsupported",
            videos: [
              "https://www.runninghub.cn/assets/wan-original.mp4",
              "https://www.runninghub.cn/assets/wan-reference.mp4",
            ],
            generationParams: { wan27_mode: "edit" },
          }),
          /video edit accepts only one original video/,
        ));
    } finally {
      globalThis["fetch"] = v179;
    }
  }),
  test("buildGenerateVideoRequest should not duplicate RunningHub slot images into generic inputs", async () => {
    const { clearApiConfig: v186 } = await import("./configApi.js");
    v186();
    const v187 = globalThis["fetch"];
    let v188 = 0;
    try {
      globalThis["fetch"] = async (v189) => {
        const v190 = String(v189);
        if (v190 === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (v190["startsWith"]("https://source.local/rh-slot-dup-"))
          return {
            ok: true,
            status: 200,
            headers: { get: () => "image/png" },
            blob: async () => new Blob([v190], { type: "image/png" }),
            text: async () => "",
          };
        if (v190["includes"]("/api/v2/proxy/upload"))
          return (
            (v188 += 1),
            makeJsonResponse({
              data: {
                download_url:
                  "https://www.runninghub.cn/uploaded/rh-slot-dup-" +
                  v188 +
                  ".png",
              },
            })
          );
        throw new Error("unexpected fetch url: " + v190);
      };
      const v191 = [
        {
          name: "kling-o1",
          payload: {
            model: "runninghub-model/kling-video-o1",
            generationParams: { aspectRatio: "9:16" },
          },
          expect: (v192, v193) => {
            (strict["equal"](
              v192["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/kling-video-o1/image-to-video",
            ),
              strict["equal"](v192["firstImageUrl"], v193),
              strict["equal"]("lastImageUrl" in v192, false));
          },
        },
        {
          name: "hailuo-02",
          payload: {
            model: "runninghub-model/hailuo-02",
            generationParams: { rh_hailuo_02_quality: "standard" },
          },
          expect: (v194, v195) => {
            (strict["equal"](
              v194["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/minimax/hailuo-02/i2v-standard",
            ),
              strict["equal"](v194["firstImageUrl"], v195),
              strict["equal"]("lastImageUrl" in v194, false));
          },
        },
        {
          name: "hailuo-23",
          payload: {
            model: "runninghub-model/hailuo-2.3",
            generationParams: { rh_hailuo_23_quality: "standard" },
          },
          expect: (v196, v197) => {
            (strict["equal"](
              v196["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/i2v-standard",
            ),
              strict["equal"](v196["imageUrl"], v197),
              strict["equal"]("firstImageUrl" in v196, false),
              strict["equal"]("lastImageUrl" in v196, false));
          },
        },
        {
          name: "kling-v3-4k",
          payload: {
            model: "runninghub-model/kling-v3",
            generationParams: { resolution: "4k" },
          },
          expect: (v198, v199) => {
            (strict["equal"](
              v198["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video",
            ),
              strict["equal"](v198["imageUrl"], v199),
              strict["equal"]("firstImageUrl" in v198, false),
              strict["equal"]("lastImageUrl" in v198, false));
          },
        },
        {
          name: "kling-o3-4k",
          payload: {
            model: "runninghub-model/kling-o3",
            generationParams: { resolution: "4k" },
          },
          expect: (v200, v201) => {
            (strict["equal"](
              v200["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/kling-video-o3-4k/image-to-video",
            ),
              strict["equal"](v200["firstImageUrl"], v201),
              strict["equal"]("lastImageUrl" in v200, false));
          },
        },
        {
          name: "seedance-2",
          payload: {
            model: "runninghub-model/seedance-2.0",
            generationParams: { rh_seedance_2_mode: "image2video" },
          },
          expect: (v202, v203) => {
            (strict["equal"](
              v202["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video",
            ),
              strict["equal"](v202["firstFrameUrl"], v203),
              strict["equal"]("lastFrameUrl" in v202, false));
          },
        },
        {
          name: "happyhorse",
          payload: {
            model: "runninghub-model/happyhorse-1.0",
            generationParams: { happyhorse_mode: "image" },
          },
          expect: (v204, v205) => {
            (strict["equal"](
              v204["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video",
            ),
              strict["equal"](v204["imageUrl"], v205),
              strict["equal"]("imageUrls" in v204, false));
          },
        },
        {
          name: "wan-27",
          payload: {
            model: "runninghub-model/wan2.7",
            generationParams: { wan27_mode: "image" },
          },
          expect: (v206, v207) => {
            (strict["equal"](
              v206["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/image-to-video",
            ),
              strict["equal"](v206["firstImageUrl"], v207),
              strict["equal"]("lastImageUrl" in v206, false));
          },
        },
      ];
      for (const v208 of v191) {
        const v209 =
            "https://source.local/rh-slot-dup-" + v208["name"] + ".png",
          v210 = v188,
          v211 = await buildGenerateVideoRequest({
            provider: "runninghub",
            prompt: v208["name"] + "\x20duplicate\x20slot",
            ...v208["payload"],
            inputUrls: [v209],
            inputUrlsBySlot: { firstFrame: v209 },
          });
        (strict["equal"](
          v188,
          v210 + 1,
          v208["name"] + " should upload the slotted source only once",
        ),
          v208["expect"](
            v211["body"],
            "https://www.runninghub.cn/uploaded/rh-slot-dup-" + v188 + ".png",
          ));
      }
    } finally {
      globalThis["fetch"] = v187;
    }
  }),
  test("aiVideoApi: RunningHub model API video polls openapi query", async () => {
    const v212 = globalThis["fetch"],
      v213 = globalThis["setTimeout"],
      v214 = [],
      v215 = [],
      v216 = [];
    try {
      globalThis["setTimeout"] = (v217, v218, ...v219) =>
        v213(v217, Number(v218) > 5000 ? Number(v218) : 0, ...v219);
      const { clearApiConfig: v220 } = await import("./configApi.js");
      (v220(),
        (globalThis["fetch"] = async (v221, v222 = {}) => {
          const v223 = String(v221);
          if (v223 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: {
                  apiUrl: "https://www.runninghub.cn",
                  modelApiKey: "k_runninghub_model",
                },
              },
            });
          if (v223 === "/api/v2/proxy/image") {
            const v224 = JSON["parse"](String(v222["body"] || "{}"));
            if (v224["apiUrl"] === "https://www.runninghub.cn/openapi/v2/query")
              return (
                v216["push"](v224),
                makeJsonResponse({
                  code: 0,
                  status: "SUCCESS",
                  results: [
                    {
                      url: "https://www.runninghub.cn/result/o1-final.mp4",
                      outputType: "video",
                    },
                  ],
                })
              );
            return (
              v215["push"](v224),
              makeJsonResponse({
                taskId: "rh-o1-task-1",
                status: "SUBMITTED",
                errorCode: 0,
                errorMessage: "",
                results: null,
              })
            );
          }
          if (v223 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-o1-final.mp4" });
          throw new Error("unexpected fetch url: " + v223);
        }));
      const v225 = await generateVideo(
        {
          provider: "runninghub",
          model: "runninghub-model/kling-video-o1",
          prompt: "city lights",
          generationParams: { aspectRatio: "16:9", duration: 5 },
        },
        { onTaskMeta: (v226) => v214["push"](v226) },
      );
      (strict["equal"](v215["length"], 1),
        strict["equal"](
          v215[0]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/kling-video-o1/text-to-video",
        ),
        strict["equal"](v216["length"], 1),
        strict["equal"](v216[0]["apiKey"], "k_runninghub_model"),
        strict["equal"](v216[0]["taskId"], "rh-o1-task-1"),
        strict["equal"](v214[0]?.["taskId"], "rh-o1-task-1"),
        strict["equal"](v214[0]?.["useOpenapiQuery"], true),
        strict["equal"](v225["videoUrl"], "/output/rh-o1-final.mp4"),
        strict["equal"](
          v225["sourceUrl"],
          "https://www.runninghub.cn/result/o1-final.mp4",
        ));
    } finally {
      ((globalThis["fetch"] = v212), (globalThis["setTimeout"] = v213));
    }
  }),
  test("aiVideoApi: apimart 异步视频会回调 onTaskMeta 且支持 resumeAsyncVideoTask", async () => {
    const v227 = globalThis["fetch"],
      v228 = globalThis["setTimeout"],
      v229 = [],
      v230 = [];
    try {
      globalThis["setTimeout"] = (v231, v232, ...v233) =>
        v228(v231, Number(v232) > 5000 ? Number(v232) : 0, ...v233);
      const { clearApiConfig: v234 } = await import("./configApi.js");
      (v234(),
        (globalThis["fetch"] = async (v235, v236 = {}) => {
          const v237 = String(v235);
          if (v237 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
              },
            });
          if (v237 === "/api/v2/proxy/image")
            return makeJsonResponse({
              data: [{ task_id: "task-video-1", status: "submitted" }],
            });
          if (v237["startsWith"]("/api/v2/proxy/task?"))
            return (
              v230["push"](v237),
              strict["equal"](
                v236["headers"]?.["Authorization"],
                "Bearer k_apimart",
              ),
              makeJsonResponse({
                status: "success",
                result: {
                  video_url: "https://cdn.example.com/final-video.mp4",
                },
              })
            );
          if (v237 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/final-video.mp4" });
          throw new Error("unexpected fetch url: " + v237);
        }));
      const v238 = {
          provider: "apimart",
          model: "apimart/luma-ray-v2",
          prompt: "sunset city",
          aspectRatio: "16:9",
          videoSize: "standard",
        },
        v239 = await generateVideo(v238, {
          onTaskMeta: (v240) => v229["push"](v240),
        });
      (strict["equal"](v229["length"], 1),
        strict["equal"](v229[0]["taskId"], "task-video-1"),
        strict["equal"](v229[0]["provider"], "apimart"),
        strict["equal"](v229[0]["kind"], "video"),
        strict["equal"](v239["videoUrl"], "/output/final-video.mp4"),
        strict["equal"](
          v239["sourceUrl"],
          "https://cdn.example.com/final-video.mp4",
        ),
        strict["equal"](v239["localPath"], "output/final-video.mp4"),
        strict["equal"](
          v239["videos"][0]["localPath"],
          "output/final-video.mp4",
        ));
      const v241 = await resumeAsyncVideoTask("task-video-2", {
        provider: "apimart",
        model: "apimart/luma-ray-v2",
      });
      (strict["equal"](v241["videoUrl"], "/output/final-video.mp4"),
        strict["equal"](
          v241["sourceUrl"],
          "https://cdn.example.com/final-video.mp4",
        ),
        strict["equal"](v241["localPath"], "output/final-video.mp4"),
        strict["equal"](
          v241["videos"][0]["localPath"],
          "output/final-video.mp4",
        ),
        strict["ok"](
          v230["every"]((v242) => v242["includes"]("%3Flanguage%3Dzh")),
        ));
    } finally {
      ((globalThis["fetch"] = v227), (globalThis["setTimeout"] = v228));
    }
  }),
  test("aiVideoApi: apimart result.videos 轮询结果保留缩略图并保存本地", async () => {
    const v243 = globalThis["fetch"],
      v244 = globalThis["setTimeout"];
    try {
      globalThis["setTimeout"] = (v245, v246, ...v247) =>
        v244(v245, Number(v246) > 5000 ? Number(v246) : 0, ...v247);
      const { clearApiConfig: v248 } = await import("./configApi.js");
      (v248(),
        (globalThis["fetch"] = async (v249, v250 = {}) => {
          const v251 = String(v249);
          if (v251 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
              },
            });
          if (v251 === "/api/v2/proxy/image")
            return makeJsonResponse({
              data: [{ task_id: "task-seedance-video-1", status: "submitted" }],
            });
          if (v251["startsWith"]("/api/v2/proxy/task?"))
            return (
              strict["equal"](
                v250["headers"]?.["Authorization"],
                "Bearer\x20k_apimart",
              ),
              makeJsonResponse({
                status: "completed",
                result: {
                  videos: [
                    {
                      url: "https://cdn.example.com/seedance-final.mp4",
                      thumbnail_url:
                        "https://cdn.example.com/seedance-final.jpg",
                    },
                  ],
                },
              })
            );
          if (v251 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/seedance-final.mp4" });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v251);
        }));
      const v252 = await generateVideo({
        provider: "apimart",
        model: "apimart/doubao-seedance-2.0-fast",
        prompt: "sunset city",
        aspectRatio: "16:9",
        resolution: "720p",
        duration: 5,
      });
      (strict["equal"](v252["videoUrl"], "/output/seedance-final.mp4"),
        strict["equal"](
          v252["sourceUrl"],
          "https://cdn.example.com/seedance-final.mp4",
        ),
        strict["equal"](
          v252["thumbUrl"],
          "https://cdn.example.com/seedance-final.jpg",
        ),
        strict["equal"](v252["localPath"], "output/seedance-final.mp4"),
        strict["equal"](
          v252["videos"][0]["localPath"],
          "output/seedance-final.mp4",
        ));
    } finally {
      ((globalThis["fetch"] = v243), (globalThis["setTimeout"] = v244));
    }
  }),
  test("aiVideoApi: apimart seedance 失败任务立即抛出轮询错误信息", async () => {
    const v253 = globalThis["fetch"],
      v254 = globalThis["setTimeout"];
    let v255 = 0;
    try {
      globalThis["setTimeout"] = (v256, v257, ...v258) =>
        v254(v256, Number(v257) > 5000 ? Number(v257) : 0, ...v258);
      const { clearApiConfig: v259 } = await import("./configApi.js");
      (v259(),
        (globalThis["fetch"] = async (v260, v261 = {}) => {
          const v262 = String(v260);
          if (v262 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
              },
            });
          if (v262 === "/api/v2/proxy/image")
            return makeJsonResponse({
              code: 200,
              data: [{ task_id: "task-seedance-failed", status: "submitted" }],
            });
          if (v262["startsWith"]("/api/v2/proxy/task?"))
            return (
              (v255 += 1),
              strict["equal"](
                v261["headers"]?.["Authorization"],
                "Bearer\x20k_apimart",
              ),
              makeJsonResponse({
                code: 200,
                data: {
                  id: "task-seedance-failed",
                  status: "failed",
                  progress: 100,
                  error: {
                    code: 400,
                    message: "Seedance upstream failed",
                    type: "invalid_request",
                  },
                },
              })
            );
          throw new Error("unexpected fetch url: " + v262);
        }),
        await strict["rejects"](
          generateVideo({
            provider: "apimart",
            model: "apimart/doubao-seedance-2.0-fast",
            prompt: "sunset\x20city",
            aspectRatio: "16:9",
            resolution: "720p",
            duration: 5,
          }),
          (v263) =>
            String(v263?.["message"] || "")["includes"](
              "Seedance\x20upstream\x20failed",
            ),
        ),
        strict["equal"](v255, 1));
    } finally {
      ((globalThis["fetch"] = v253), (globalThis["setTimeout"] = v254));
    }
  }),
  test("aiVideoApi:\x20RunningHub\x20工作流视频顶层\x20task_id\x20必须继续走\x20openapi\x20查询", async () => {
    const v264 = globalThis["fetch"],
      v265 = globalThis["setTimeout"],
      v266 = [],
      v267 = [];
    try {
      globalThis["setTimeout"] = (v268, v269, ...v270) =>
        v265(v268, Number(v269) > 5000 ? Number(v269) : 0, ...v270);
      const { clearApiConfig: v271 } = await import("./configApi.js");
      (v271(),
        (globalThis["fetch"] = async (v272, v273 = {}) => {
          const v274 = String(v272);
          let v275 = null;
          if (v273["body"] && typeof v273["body"] === "string")
            try {
              v275 = JSON["parse"](v273["body"]);
            } catch {
              v275 = null;
            }
          v267["push"]({
            url: v274,
            method: String(v273["method"] || "GET"),
            body: v275,
          });
          if (v274 === "/api/config")
            return makeJsonResponse({
              providers: { runninghub: { apiKey: "k_runninghub" } },
            });
          if (v274 === "/api/v2/proxy/image") {
            const v276 = String(v275?.["apiUrl"] || "");
            if (v276["includes"]("/openapi/v2/run/ai-app/2041741496667348994"))
              return makeJsonResponse({
                task_id: "task-rh-v54-top-level",
                status: "submitted",
              });
            if (v276["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                status: "COMPLETED",
                results: [{ url: "https://cdn.example.com/rh-v54.mp4" }],
              });
          }
          if (v274 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-v54.mp4" });
          if (v274["startsWith"]("/api/v2/proxy/task?"))
            throw new Error("unexpected fallback to /api/v2/proxy/task");
          throw new Error("unexpected\x20fetch\x20url:\x20" + v274);
        }));
      const v277 = await generateVideo(
        {
          provider: "runninghubwf",
          model: "runninghub/2041741496667348994",
          prompt: "sunset city",
          aspectRatio: "16:9",
          resolution: "1080p",
          videoSize: "1080p",
          duration: 5,
          apiKey: "k_runninghub",
          videoUrl: "https://www.runninghub.cn/mock-input-video.mp4",
          inputUrls: ["https://www.runninghub.cn/mock-input-image.png"],
        },
        { onTaskMeta: (v278) => v266["push"](v278) },
      );
      (strict["equal"](v266["length"], 1),
        strict["equal"](v266[0]["taskId"], "task-rh-v54-top-level"),
        strict["equal"](v266[0]["useOpenapiQuery"], true),
        strict["equal"](v277["videoUrl"], "/output/rh-v54.mp4"),
        strict["equal"](
          v277["sourceUrl"],
          "https://cdn.example.com/rh-v54.mp4",
        ),
        strict["equal"](v277["localPath"], "output/rh-v54.mp4"),
        strict["equal"](v277["videos"][0]["localPath"], "output/rh-v54.mp4"),
        strict["ok"](
          v267["some"](
            (v279) =>
              v279["url"] === "/api/v2/proxy/image" &&
              String(v279["body"]?.["apiUrl"] || "")["includes"](
                "/openapi/v2/query",
              ),
          ),
        ),
        strict["ok"](
          !v267["some"]((v280) =>
            v280["url"]["startsWith"]("/api/v2/proxy/task?"),
          ),
        ));
    } finally {
      ((globalThis["fetch"] = v264), (globalThis["setTimeout"] = v265));
    }
  }),
  test("aiVideoApi:\x20RunningHub\x20ai-app\x20查询仅返回\x20fileUrl\x20时也应结束轮询", async () => {
    const v281 = globalThis["fetch"],
      v282 = globalThis["setTimeout"],
      v283 = [];
    try {
      globalThis["setTimeout"] = (v284, v285, ...v286) =>
        v282(v284, Number(v285) > 5000 ? Number(v285) : 0, ...v286);
      const { clearApiConfig: v287 } = await import("./configApi.js");
      (v287(),
        (globalThis["fetch"] = async (v288, v289 = {}) => {
          const v290 = String(v288);
          let v291 = null;
          if (v289["body"] && typeof v289["body"] === "string")
            try {
              v291 = JSON["parse"](v289["body"]);
            } catch {
              v291 = null;
            }
          v283["push"]({ url: v290, body: v291 });
          if (v290 === "/api/config")
            return makeJsonResponse({
              providers: { runninghub: { apiKey: "k_runninghub" } },
            });
          if (v290 === "/api/v2/proxy/image") {
            const v292 = String(v291?.["apiUrl"] || "");
            if (v292["includes"]("/openapi/v2/run/ai-app/2054101324521844738"))
              return makeJsonResponse({
                data: { id: "task-rh-lipsync-fileurl" },
                status: "submitted",
              });
            if (v292["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: [
                  {
                    file_url:
                      "https://cdn.example.com/rh-lipsync-fileurl?id=123",
                  },
                ],
              });
          }
          if (v290 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-lipsync-fileurl.mp4" });
          throw new Error("unexpected fetch url: " + v290);
        }));
      const v293 = await generateVideo({
        provider: "runninghubwf",
        model: "runninghub/2054101324521844738",
        prompt: "talk",
        apiKey: "k_runninghub",
        videoUrl: "https://www.runninghub.cn/mock-input-video.mp4",
        audioUrl: "https://www.runninghub.cn/mock-input-audio.mp3",
        rhLipSyncInputIndex: 1,
        rhVideoFrames: 20,
        rhVideoResolution: 1024,
      });
      (strict["equal"](v293["videoUrl"], "/output/rh-lipsync-fileurl.mp4"),
        strict["equal"](
          v293["sourceUrl"],
          "https://cdn.example.com/rh-lipsync-fileurl?id=123",
        ),
        strict["equal"](v293["localPath"], "output/rh-lipsync-fileurl.mp4"),
        strict["equal"](
          v293["videos"][0]["localPath"],
          "output/rh-lipsync-fileurl.mp4",
        ),
        strict["equal"](
          v283["filter"]((v294) =>
            String(v294["body"]?.["apiUrl"] || "")["includes"](
              "/openapi/v2/query",
            ),
          )["length"],
          1,
        ));
    } finally {
      ((globalThis["fetch"] = v281), (globalThis["setTimeout"] = v282));
    }
  }),
  test("aiVideoApi: RunningHub ai-app 保存接口失败时仍用本地兜底结果回填 videos", async () => {
    const v295 = globalThis["fetch"],
      v296 = globalThis["setTimeout"],
      v297 = [],
      v298 = "https://cdn.example.com/口型结果.mp4?token=abc";
    try {
      globalThis["setTimeout"] = (v299, v300, ...v301) =>
        v296(v299, Number(v300) > 5000 ? Number(v300) : 0, ...v301);
      const { clearApiConfig: v302 } = await import("./configApi.js");
      (v302(),
        (globalThis["fetch"] = async (v303, v304 = {}) => {
          const v305 = String(v303);
          let v306 = null;
          if (v304["body"] && typeof v304["body"] === "string")
            try {
              v306 = JSON["parse"](v304["body"]);
            } catch {
              v306 = null;
            }
          v297["push"]({ url: v305, body: v306 });
          if (v305 === "/api/config")
            return makeJsonResponse({
              providers: { runninghub: { apiKey: "k_runninghub" } },
            });
          if (v305 === "/api/v2/proxy/image") {
            const v307 = String(v306?.["apiUrl"] || "");
            if (v307["includes"]("/openapi/v2/run/ai-app/2054101324521844738"))
              return makeJsonResponse({
                data: { id: "task-rh-lipsync-client-fallback" },
                status: "submitted",
              });
            if (v307["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: [{ type: "video", fileUrl: v298 }],
              });
          }
          if (v305 === "/api/v2/save_output_from_url")
            return makeJsonResponse(
              {
                error:
                  "Download failed: 'ascii' codec can't encode characters in position 45-47",
              },
              502,
            );
          if (v305 === v298)
            return makeBlobResponse(new Blob([new Uint8Array([1, 2, 3])]));
          if (v305 === "/api/v2/save_output?ext=mp4")
            return makeJsonResponse({ path: "output/rh-lipsync-fallback.mp4" });
          throw new Error("unexpected fetch url: " + v305);
        }));
      const v308 = await generateVideo({
        provider: "runninghubwf",
        model: "runninghub/2054101324521844738",
        prompt: "talk",
        apiKey: "k_runninghub",
        videoUrl: "https://www.runninghub.cn/mock-input-video.mp4",
        audioUrl: "https://www.runninghub.cn/mock-input-audio.mp3",
        rhLipSyncInputIndex: 1,
        rhVideoFrames: 20,
        rhVideoResolution: 1024,
      });
      (strict["equal"](v308["videoUrl"], "/output/rh-lipsync-fallback.mp4"),
        strict["equal"](v308["sourceUrl"], v298),
        strict["equal"](v308["localPath"], "output/rh-lipsync-fallback.mp4"),
        strict["equal"](
          v308["videos"][0]["videoUrl"],
          "/output/rh-lipsync-fallback.mp4",
        ),
        strict["equal"](
          v308["videos"][0]["localPath"],
          "output/rh-lipsync-fallback.mp4",
        ),
        strict["ok"](
          v297["some"]((v309) => v309["url"] === "/api/v2/save_output?ext=mp4"),
        ));
    } finally {
      ((globalThis["fetch"] = v295), (globalThis["setTimeout"] = v296));
    }
  }),
  test("aiVideoApi: RunningHub ai-app 创建响应 data 字符串也应作为 taskId 轮询", async () => {
    const v310 = globalThis["fetch"],
      v311 = globalThis["setTimeout"],
      v312 = [];
    try {
      globalThis["setTimeout"] = (v313, v314, ...v315) =>
        v311(v313, Number(v314) > 5000 ? Number(v314) : 0, ...v315);
      const { clearApiConfig: v316 } = await import("./configApi.js");
      (v316(),
        (globalThis["fetch"] = async (v317, v318 = {}) => {
          const v319 = String(v317);
          let v320 = null;
          if (v318["body"] && typeof v318["body"] === "string")
            try {
              v320 = JSON["parse"](v318["body"]);
            } catch {
              v320 = null;
            }
          if (v319 === "/api/config")
            return makeJsonResponse({
              providers: { runninghub: { apiKey: "k_runninghub" } },
            });
          if (v319 === "/api/v2/proxy/image") {
            const v321 = String(v320?.["apiUrl"] || "");
            if (v321["includes"]("/openapi/v2/run/ai-app/2054101324521844738"))
              return makeJsonResponse({
                code: 0,
                data: "task-rh-lipsync-string",
              });
            if (v321["includes"]("/openapi/v2/query"))
              return (
                strict["equal"](v320?.["taskId"], "task-rh-lipsync-string"),
                makeJsonResponse({
                  taskId: "task-rh-lipsync-string",
                  status: "SUCCESS",
                  results: [
                    {
                      url: "https://cdn.example.com/rh-lipsync-string.mp4",
                      outputType: "mp4",
                    },
                  ],
                })
              );
          }
          if (v319 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-lipsync-string.mp4" });
          throw new Error("unexpected fetch url: " + v319);
        }));
      const v322 = await generateVideo(
        {
          provider: "runninghubwf",
          model: "runninghub/2054101324521844738",
          prompt: "talk",
          apiKey: "k_runninghub",
          videoUrl: "https://www.runninghub.cn/mock-input-video.mp4",
          audioUrl: "https://www.runninghub.cn/mock-input-audio.mp3",
          rhLipSyncInputIndex: 1,
          rhVideoFrames: 20,
          rhVideoResolution: 1024,
        },
        { onTaskMeta: (v323) => v312["push"](v323) },
      );
      (strict["equal"](v312[0]?.["taskId"], "task-rh-lipsync-string"),
        strict["equal"](v312[0]?.["useOpenapiQuery"], true),
        strict["equal"](v322["videoUrl"], "/output/rh-lipsync-string.mp4"),
        strict["equal"](
          v322["sourceUrl"],
          "https://cdn.example.com/rh-lipsync-string.mp4",
        ),
        strict["equal"](v322["localPath"], "output/rh-lipsync-string.mp4"),
        strict["equal"](
          v322["videos"][0]["localPath"],
          "output/rh-lipsync-string.mp4",
        ));
    } finally {
      ((globalThis["fetch"] = v310), (globalThis["setTimeout"] = v311));
    }
  }),
  test("aiVideoApi: RunningHub ai-app 创建响应 SSE data 行也应解析 taskId", async () => {
    const v324 = globalThis["fetch"],
      v325 = globalThis["setTimeout"];
    try {
      globalThis["setTimeout"] = (v326, v327, ...v328) =>
        v325(v326, Number(v327) > 5000 ? Number(v327) : 0, ...v328);
      const { clearApiConfig: v329 } = await import("./configApi.js");
      (v329(),
        (globalThis["fetch"] = async (v330, v331 = {}) => {
          const v332 = String(v330);
          let v333 = null;
          if (v331["body"] && typeof v331["body"] === "string")
            try {
              v333 = JSON["parse"](v331["body"]);
            } catch {
              v333 = null;
            }
          if (v332 === "/api/config")
            return makeJsonResponse({
              providers: { runninghub: { apiKey: "k_runninghub" } },
            });
          if (v332 === "/api/v2/proxy/image") {
            const v334 = String(v333?.["apiUrl"] || "");
            if (v334["includes"]("/openapi/v2/run/ai-app/2054101324521844738"))
              return makeTextResponse(
                'data: {"code":0,"data":{"taskId":"task-rh-lipsync-sse"},"status":"submitted"}\n\n',
                200,
                "text/event-stream",
              );
            if (v334["includes"]("/openapi/v2/query"))
              return (
                strict["equal"](v333?.["taskId"], "task-rh-lipsync-sse"),
                makeJsonResponse({
                  code: 0,
                  data: {
                    status: "SUCCESS",
                    outputs: [
                      { fileUrl: "https://cdn.example.com/rh-lipsync-sse.mp4" },
                    ],
                  },
                })
              );
          }
          if (v332 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-lipsync-sse.mp4" });
          throw new Error("unexpected fetch url: " + v332);
        }));
      const v335 = await generateVideo({
        provider: "runninghubwf",
        model: "runninghub/2054101324521844738",
        prompt: "talk",
        apiKey: "k_runninghub",
        videoUrl: "https://www.runninghub.cn/mock-input-video.mp4",
        audioUrl: "https://www.runninghub.cn/mock-input-audio.mp3",
        rhLipSyncInputIndex: 1,
        rhVideoFrames: 20,
        rhVideoResolution: 1024,
      });
      (strict["equal"](v335["videoUrl"], "/output/rh-lipsync-sse.mp4"),
        strict["equal"](
          v335["sourceUrl"],
          "https://cdn.example.com/rh-lipsync-sse.mp4",
        ),
        strict["equal"](v335["localPath"], "output/rh-lipsync-sse.mp4"),
        strict["equal"](
          v335["videos"][0]["localPath"],
          "output/rh-lipsync-sse.mp4",
        ));
    } finally {
      ((globalThis["fetch"] = v324), (globalThis["setTimeout"] = v325));
    }
  }));

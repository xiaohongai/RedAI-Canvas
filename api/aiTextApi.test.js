import test from "node:test";
import strict from "node:assert/strict";
import { buildGenerateTextRequest, generateText } from "./aiTextApi.js";
import { clearApiConfig } from "./configApi.js";
function jsonResponse(v0, v1 = 200) {
  return new Response(JSON["stringify"](v0), {
    status: v1,
    headers: { "Content-Type": "application/json" },
  });
}
function imageResponse(v2, v3 = "image/png") {
  return new Response(new Blob([v2], { type: v3 }), {
    status: 200,
    headers: { "Content-Type": v3 },
  });
}
async function readUploadMarker(v4) {
  if (!v4 || typeof v4["entries"] !== "function") return "";
  for (const [v5, v6] of v4["entries"]()) {
    if (v5 !== "file") continue;
    if (v6 && typeof v6["text"] === "function") return await v6["text"]();
  }
  return "";
}
async function withMockFetch(v7, v8) {
  const v9 = globalThis["fetch"];
  (clearApiConfig(), (globalThis["fetch"] = v7));
  try {
    return await v8();
  } finally {
    ((globalThis["fetch"] = v9), clearApiConfig());
  }
}
async function withImmediateTimers(v10) {
  const v11 = globalThis["setTimeout"];
  globalThis["setTimeout"] = (v12, v13, ...v14) => {
    if (typeof v12 === "function") v12(...v14);
    return 0;
  };
  try {
    return await v10();
  } finally {
    globalThis["setTimeout"] = v11;
  }
}
async function withMockCanvasComposition(v15) {
  const v16 = globalThis["createImageBitmap"],
    v17 = globalThis["OffscreenCanvas"];
  ((globalThis["createImageBitmap"] = async () => ({
    width: 640,
    height: 480,
    close() {},
  })),
    (globalThis["OffscreenCanvas"] = class v18 {
      constructor(v19, v20) {
        ((this["width"] = v19),
          (this["height"] = v20),
          (this["_ctx"] = {
            fillStyle: "",
            strokeStyle: "",
            lineWidth: 1,
            font: "",
            textAlign: "",
            textBaseline: "",
            fillRect() {},
            drawImage() {},
            strokeRect() {},
            fillText() {},
          }));
      }
      ["getContext"]() {
        return this["_ctx"];
      }
      async ["convertToBlob"]() {
        return new Blob(["merged-runninghub-image"], { type: "image/png" });
      }
    }));
  try {
    return await v15();
  } finally {
    ((globalThis["createImageBitmap"] = v16),
      (globalThis["OffscreenCanvas"] = v17));
  }
}
const RUNNINGHUB_FLASH_MODEL =
    "runninghub-model/rhart-text-g-3-flash-preview-cv/image-to-text",
  RUNNINGHUB_PRO_MODEL =
    "runninghub-model/rhart-text-g-3-pro-preview-cv/image-to-text",
  RUNNINGHUB_QWEN36_PLUS_MODEL = "qwen/qwen3.6-plus",
  RUNNINGHUB_QWEN3_VL_MODEL = "qwen/qwen3-vl-235b-a22b-instruct",
  RUNNINGHUB_IMAGE_URL = "https://www.runninghub.cn/example/input.png";
(test("aiTextApi: OpenAI 兼容请求会把 @图片 映射为 image_url，并保留前后文本", async () => {
  await withMockFetch(
    async (v21) => {
      const v22 = String(v21 || "");
      if (v22 === "/api/config")
        return jsonResponse({
          providers: {
            openai: { apiUrl: "https://api.openai.com", apiKey: "k_openai" },
          },
        });
      if (v22 === "/local/ref.png") return imageResponse("openai-image");
      if (v22 === "https://telegra.ph/upload")
        return jsonResponse([{ src: "/uploaded-openai-ref.png" }]);
      throw new Error("unexpected fetch url: " + v22);
    },
    async () => {
      const v23 = await buildGenerateTextRequest({
        provider: "openai",
        model: "gpt-4.1-mini",
        prompt: "请详细分析 @图片1 ，并保留这句文字。",
        inputUrls: ["/local/ref.png"],
      });
      (strict["equal"](v23["url"], "/api/v2/proxy/completions"),
        strict["equal"](v23["body"]["apiUrl"], "https://api.openai.com/v1"),
        strict["equal"](v23["body"]["model"], "gpt-4.1-mini"));
      const v24 = v23["body"]["messages"][1]["content"];
      (strict["ok"](Array["isArray"](v24)),
        strict["deepEqual"](v24, [
          { type: "text", text: "请详细分析\x20" },
          {
            type: "image_url",
            image_url: { url: "https://telegra.ph/uploaded-openai-ref.png" },
          },
          { type: "text", text: " ，并保留这句文字。" },
        ]));
    },
  );
}),
  test("aiTextApi: Volcengine Doubao Seed text models use Ark Responses API", async () => {
    await withMockFetch(
      async (v25) => {
        const v26 = String(v25 || "");
        if (v26 === "/api/config")
          return jsonResponse({
            providers: {
              volcengine: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_volcengine",
              },
            },
          });
        throw new Error("unexpected fetch url: " + v26);
      },
      async () => {
        const v27 = [
          [
            "volcengine/doubao-seed-2-0-pro-260215",
            "doubao-seed-2-0-pro-260215",
          ],
          ["doubao-seed-2-0-mini-260428", "doubao-seed-2-0-mini-260428"],
          ["doubao-seed-2-0-lite-260428", "doubao-seed-2-0-lite-260428"],
        ];
        for (const [v28, v29] of v27) {
          const v30 = await buildGenerateTextRequest({
            provider: "volcengine",
            model: v28,
            prompt: "plain text prompt",
          });
          (strict["equal"](v30["url"], "/api/v2/proxy/completions"),
            strict["equal"](
              v30["body"]["apiUrl"],
              "https://ark.cn-beijing.volces.com/api/v3/responses",
            ),
            strict["equal"](v30["body"]["apiKey"], "k_volcengine"),
            strict["equal"](v30["body"]["model"], v29),
            strict["deepEqual"](v30["body"]["input"], [
              {
                role: "user",
                content: [{ type: "input_text", text: "plain text prompt" }],
              },
            ]));
        }
      },
    );
  }),
  test("aiTextApi: Volcengine media inputs upload through Ark Files API", async () => {
    const v31 =
        "https://ark-project.tos-cn-beijing.volces.com/doc_video/ark_vlm_video_input.mp4",
      v32 = "/local/ref.png",
      v33 = [];
    await withMockFetch(
      async (v34, v35 = {}) => {
        const v36 = String(v34 || "");
        if (v36 === "/api/config")
          return jsonResponse({
            providers: {
              volcengine: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_volcengine",
              },
            },
          });
        if (v36 === v32) return imageResponse("volcengine-image");
        if (v36 === v31) return imageResponse("volcengine-video", "video/mp4");
        if (v36["startsWith"]("/api/v2/proxy/upload?")) {
          strict["equal"](
            v35["headers"]?.["Authorization"],
            "Bearer\x20k_volcengine",
          );
          const v37 = new URL("http://local" + v36)["searchParams"]["get"](
            "apiUrl",
          );
          strict["equal"](
            v37,
            "https://ark.cn-beijing.volces.com/api/v3/files",
          );
          const v38 = Object["fromEntries"](v35["body"]["entries"]());
          (strict["equal"](v38["purpose"], "user_data"),
            v33["push"](v38["file"]?.["name"] || ""));
          const v39 = await v38["file"]["text"]();
          if (v39 === "volcengine-image")
            return jsonResponse({
              object: "file",
              id: "file-image-1",
              status: "active",
              purpose: "user_data",
            });
          if (v39 === "volcengine-video")
            return (
              strict["equal"](v38["preprocess_configs[video][fps]"], "0.3"),
              jsonResponse({
                object: "file",
                id: "file-video-1",
                status: "processing",
                purpose: "user_data",
              })
            );
        }
        if (v36["startsWith"]("/api/v2/proxy/task?")) {
          strict["equal"](
            v35["headers"]?.["Authorization"],
            "Bearer k_volcengine",
          );
          const v40 = new URL("http://local" + v36)["searchParams"]["get"](
            "apiUrl",
          );
          return (
            strict["equal"](
              v40,
              "https://ark.cn-beijing.volces.com/api/v3/files/file-video-1",
            ),
            jsonResponse({
              object: "file",
              id: "file-video-1",
              status: "active",
              purpose: "user_data",
            })
          );
        }
        throw new Error("unexpected fetch url: " + v36);
      },
      async () => {
        const v41 =
            "https://ark-project.tos-cn-beijing.volces.com/doc_video/ark_vlm_video_input.mp4",
          v42 = await buildGenerateTextRequest({
            provider: "volcengine",
            model: "volcengine/doubao-seed-2-0-pro-260215",
            prompt: "先看 @图片1 再总结 @视频1 的内容。",
            inputUrls: [v32, v41],
            inputImageUrls: [v32],
            inputVideoUrls: [v41],
          });
        (strict["equal"](v42["body"]["model"], "doubao-seed-2-0-pro-260215"),
          strict["deepEqual"](v42["body"]["input"][0]["content"], [
            { type: "input_text", text: "先看 " },
            { type: "input_image", file_id: "file-image-1" },
            { type: "input_text", text: " 再总结 " },
            { type: "input_video", file_id: "file-video-1" },
            { type: "input_text", text: " 的内容。" },
          ]),
          strict["deepEqual"](
            v33["sort"](),
            ["ref.png", "ark_vlm_video_input.mp4"]["sort"](),
          ));
      },
    );
  }),
  test("aiTextApi:\x20Volcengine\x20local\x20video\x20inputs\x20upload\x20through\x20Ark\x20Files\x20API", async () => {
    await withMockFetch(
      async (v43, v44 = {}) => {
        const v45 = String(v43 || "");
        if (v45 === "/api/config")
          return jsonResponse({
            providers: {
              volcengine: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_volcengine",
              },
            },
          });
        if (v45["endsWith"]("/local/ref.mp4"))
          return imageResponse("local-volcengine-video", "video/mp4");
        if (v45["startsWith"]("/api/v2/proxy/upload?")) {
          const v46 = Object["fromEntries"](v44["body"]["entries"]());
          return (
            strict["equal"](
              await v46["file"]["text"](),
              "local-volcengine-video",
            ),
            jsonResponse({
              object: "file",
              id: "file-local-video",
              status: "active",
            })
          );
        }
        throw new Error("unexpected\x20fetch\x20url:\x20" + v45);
      },
      async () => {
        const v47 = await buildGenerateTextRequest({
          provider: "volcengine",
          model: "volcengine/doubao-seed-2-0-pro-260215",
          prompt: "请总结\x20@视频1",
          inputUrls: ["/local/ref.mp4"],
          inputVideoUrls: ["/local/ref.mp4"],
        });
        strict["deepEqual"](v47["body"]["input"][0]["content"], [
          { type: "input_text", text: "请总结 " },
          { type: "input_video", file_id: "file-local-video" },
        ]);
      },
    );
  }),
  test("aiTextApi: custom provider 多图请求会按顺序映射为多个 image_url", async () => {
    await withMockFetch(
      async (v48, v49 = {}) => {
        const v50 = String(v48 || "");
        if (v50 === "/api/config")
          return jsonResponse({
            providers: {
              openai: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_custom_openai_compatible",
              },
            },
          });
        if (v50 === "/local/first.png") return imageResponse("custom-image-1");
        if (v50 === "/local/second.png") return imageResponse("custom-image-2");
        if (v50 === "https://telegra.ph/upload") {
          const v51 = await readUploadMarker(v49["body"]);
          if (v51 === "custom-image-1")
            return jsonResponse([{ src: "/uploaded-custom-first.png" }]);
          if (v51 === "custom-image-2")
            return jsonResponse([{ src: "/uploaded-custom-second.png" }]);
        }
        throw new Error("unexpected fetch url: " + v50);
      },
      async () => {
        const v52 = await buildGenerateTextRequest({
          provider: "custom",
          model: "doubao-seed-2-0-pro",
          prompt: "compare @图片1 with @图片2",
          inputUrls: ["/local/first.png", "/local/second.png"],
        });
        (strict["equal"](v52["url"], "/api/v2/proxy/completions"),
          strict["equal"](
            v52["body"]["apiUrl"],
            "https://ark.cn-beijing.volces.com/api/v3",
          ),
          strict["equal"](v52["body"]["apiKey"], "k_custom_openai_compatible"),
          strict["equal"](v52["body"]["model"], "doubao-seed-2-0-pro"),
          strict["deepEqual"](v52["body"]["messages"][1]["content"], [
            { type: "text", text: "compare " },
            {
              type: "image_url",
              image_url: {
                url: "https://telegra.ph/uploaded-custom-first.png",
              },
            },
            { type: "text", text: " with " },
            {
              type: "image_url",
              image_url: {
                url: "https://telegra.ph/uploaded-custom-second.png",
              },
            },
          ]));
      },
    );
  }),
  test("aiTextApi:\x20custom\x20provider\x20纯文本请求保持字符串\x20content", async () => {
    await withMockFetch(
      async (v53) => {
        const v54 = String(v53 || "");
        if (v54 === "/api/config")
          return jsonResponse({
            providers: {
              openai: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_custom_openai_compatible",
              },
            },
          });
        throw new Error("unexpected fetch url: " + v54);
      },
      async () => {
        const v55 = await buildGenerateTextRequest({
          provider: "custom",
          model: "doubao-seed-2-0-pro",
          prompt: "only text prompt",
        });
        (strict["equal"](v55["url"], "/api/v2/proxy/completions"),
          strict["equal"](
            v55["body"]["apiUrl"],
            "https://ark.cn-beijing.volces.com/api/v3",
          ),
          strict["equal"](
            v55["body"]["messages"][1]["content"],
            "only text prompt",
          ));
      },
    );
  }),
  test("aiTextApi: OpenAI 兼容文本请求会透传 systemPrompt", async () => {
    await withMockFetch(
      async (v56) => {
        const v57 = String(v56 || "");
        if (v57 === "/api/config")
          return jsonResponse({
            providers: {
              openai: {
                apiUrl: "https://api.openai-compatible.local",
                apiKey: "k_custom_openai_compatible",
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + v57);
      },
      async () => {
        const v58 = await buildGenerateTextRequest({
          provider: "custom",
          model: "gpt-compatible",
          prompt: "用户剧情",
          systemPrompt: "只输出合法 JSON。",
        });
        (strict["equal"](v58["url"], "/api/v2/proxy/completions"),
          strict["equal"](v58["body"]["messages"][0]["role"], "system"),
          strict["equal"](
            v58["body"]["messages"][0]["content"],
            "只输出合法 JSON。",
          ),
          strict["equal"](v58["body"]["messages"][1]["content"], "用户剧情"));
      },
    );
  }),
  test("aiTextApi: unregistered provider model fails without legacy routing fallback", async () => {
    await withMockFetch(
      async (v59) => {
        const v60 = String(v59 || "");
        if (v60 === "/api/config")
          return jsonResponse({
            providers: {
              grsai: {
                apiUrl: "https://grsai.dakka.com.cn",
                apiKey: "k_grsai",
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + v60);
      },
      async () => {
        await strict["rejects"](
          () =>
            buildGenerateTextRequest({
              provider: "grsai",
              model: "grsai/unregistered-text-model",
              prompt: "hello",
            }),
          /GRSAI text model API manifest missing: grsai\/unregistered-text-model/,
        );
      },
    );
  }),
  test("aiTextApi: bare unknown model no longer defaults to GRSAI", async () => {
    await withMockFetch(
      async (v61) => {
        const v62 = String(v61 || "");
        if (v62 === "/api/config") return jsonResponse({ providers: {} });
        throw new Error("unexpected fetch url: " + v62);
      },
      async () => {
        await strict["rejects"](
          () =>
            buildGenerateTextRequest({
              model: "gemini-future-unregistered",
              prompt: "hello",
            }),
          /Text model API manifest missing: gemini-future-unregistered/,
        );
      },
    );
  }),
  test("aiTextApi: APIMart new text models strip provider prefix for wire model", async () => {
    const v63 = [
      ["apimart/kimi-k2-instruct", "kimi-k2-instruct"],
      ["apimart/gpt-5.5", "gpt-5.5"],
      ["apimart/gpt-5.4-mini", "gpt-5.4-mini"],
    ];
    await withMockFetch(
      async (v64) => {
        const v65 = String(v64 || "");
        if (v65 === "/api/config")
          return jsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + v65);
      },
      async () => {
        for (const [v66, v67] of v63) {
          const v68 = await buildGenerateTextRequest({
            provider: "apimart",
            model: v66,
            prompt: "plain text prompt",
          });
          (strict["equal"](v68["url"], "/api/v2/proxy/completions"),
            strict["equal"](
              v68["body"]["apiUrl"],
              "https://api.apimart.ai/v1/chat/completions",
            ),
            strict["equal"](v68["body"]["model"], v67),
            strict["equal"](
              v68["body"]["messages"][1]["content"],
              "plain text prompt",
            ));
        }
      },
    );
  }),
  test("aiTextApi:\x20APIMart\x20Gemini\x20图片请求统一使用\x20GPT\x20image_url\x20格式", async () => {
    await withMockFetch(
      async (v69, v70 = {}) => {
        const v71 = String(v69 || "");
        if (v71 === "/api/config")
          return jsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        if (v71 === "/local/ref.png") return imageResponse("gemini-image");
        if (v71 === "/api/v2/proxy/apimart-upload") {
          const v72 = Object["fromEntries"](v70["body"]["entries"]());
          return (
            strict["equal"](v72["contentType"], "image/png"),
            strict["equal"](v72["fileExtension"], "png"),
            strict["equal"](await v72["file"]["text"](), "gemini-image"),
            jsonResponse({
              cdnUrl: "https://cdn.apimart.ai/files/gemini-ref.png",
            })
          );
        }
        throw new Error("unexpected fetch url: " + v71);
      },
      async () => {
        const v73 = await buildGenerateTextRequest({
          provider: "apimart",
          model: "apimart/gemini-3.1-pro-preview",
          prompt: "分析 @图片1 的细节。",
          inputUrls: ["/local/ref.png"],
        });
        (strict["equal"](v73["url"], "/api/v2/proxy/completions"),
          strict["equal"](
            v73["body"]["apiUrl"],
            "https://api.apimart.ai/v1/chat/completions",
          ),
          strict["equal"](v73["body"]["model"], "gemini-3.1-pro-preview"));
        const v74 = v73["body"]["messages"][1]["content"];
        (strict["deepEqual"](v74[0], { type: "text", text: "分析\x20" }),
          strict["deepEqual"](v74[1], {
            type: "image_url",
            image_url: { url: "https://cdn.apimart.ai/files/gemini-ref.png" },
          }),
          strict["deepEqual"](v74[2], { type: "text", text: " 的细节。" }));
      },
    );
  }),
  test("aiTextApi: APIMart Gemini 菜单裸模型名会归一化并使用 GPT 格式", async () => {
    await withMockFetch(
      async (v75, v76 = {}) => {
        const v77 = String(v75 || "");
        if (v77 === "/api/config")
          return jsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        if (v77 === "/local/ref.png") return imageResponse("gemini-image");
        if (v77 === "/api/v2/proxy/apimart-upload") {
          const v78 = Object["fromEntries"](v76["body"]["entries"]());
          return (
            strict["equal"](await v78["file"]["text"](), "gemini-image"),
            jsonResponse({
              cdnUrl: "https://cdn.apimart.ai/files/gemini-ref.png",
            })
          );
        }
        throw new Error("unexpected fetch url: " + v77);
      },
      async () => {
        const v79 = await buildGenerateTextRequest({
          provider: "apimart",
          model: "gemini-3.1-pro-preview",
          prompt: "分析 @图片1",
          inputUrls: ["/local/ref.png"],
          inputImageUrls: ["/local/ref.png"],
        });
        (strict["equal"](
          v79["body"]["apiUrl"],
          "https://api.apimart.ai/v1/chat/completions",
        ),
          strict["equal"](v79["body"]["model"], "gemini-3.1-pro-preview"),
          strict["deepEqual"](v79["body"]["messages"][1]["content"][1], {
            type: "image_url",
            image_url: { url: "https://cdn.apimart.ai/files/gemini-ref.png" },
          }));
      },
    );
  }),
  test("aiTextApi: APIMart 已上传 CDN 图片使用 GPT image_url 且不会重复上传", async () => {
    await withMockFetch(
      async (v80) => {
        const v81 = String(v80 || "");
        if (v81 === "/api/config")
          return jsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        throw new Error("unexpected fetch url: " + v81);
      },
      async () => {
        const v82 = await buildGenerateTextRequest({
          provider: "apimart",
          model: "apimart/gemini-3-flash-preview-nothinking",
          prompt: "分析 @图片1",
          inputUrls: ["https://upload.apimart.ai/files/existing.webp"],
          inputImageUrls: ["https://upload.apimart.ai/files/existing.webp"],
        });
        (strict["equal"](
          v82["body"]["apiUrl"],
          "https://api.apimart.ai/v1/chat/completions",
        ),
          strict["deepEqual"](v82["body"]["messages"][1]["content"], [
            { type: "text", text: "分析 " },
            {
              type: "image_url",
              image_url: {
                url: "https://upload.apimart.ai/files/existing.webp",
              },
            },
          ]));
      },
    );
  }),
  test("aiTextApi: APIMart GPT 格式多图上传按 @图片编号映射", async () => {
    await withMockFetch(
      async (v83, v84 = {}) => {
        const v85 = String(v83 || "");
        if (v85 === "/api/config")
          return jsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        if (v85 === "/local/first.png") return imageResponse("apimart-first");
        if (v85 === "/local/second.png") return imageResponse("apimart-second");
        if (v85 === "/api/v2/proxy/apimart-upload") {
          const v86 = Object["fromEntries"](v84["body"]["entries"]()),
            v87 = await v86["file"]["text"]();
          if (v87 === "apimart-first")
            return jsonResponse({
              cdnUrl: "https://cdn.apimart.ai/files/first.png",
            });
          if (v87 === "apimart-second")
            return jsonResponse({
              cdnUrl: "https://cdn.apimart.ai/files/second.png",
            });
        }
        throw new Error("unexpected fetch url: " + v85);
      },
      async () => {
        const v88 = await buildGenerateTextRequest({
          provider: "apimart",
          model: "apimart/gemini-3-flash-preview-nothinking",
          prompt: "先看 @图片2 再看 @图片1",
          inputUrls: ["/local/first.png", "/local/second.png"],
          inputImageUrls: ["/local/first.png", "/local/second.png"],
        });
        (strict["equal"](
          v88["body"]["apiUrl"],
          "https://api.apimart.ai/v1/chat/completions",
        ),
          strict["deepEqual"](v88["body"]["messages"][1]["content"], [
            { type: "text", text: "先看 " },
            {
              type: "image_url",
              image_url: { url: "https://cdn.apimart.ai/files/second.png" },
            },
            { type: "text", text: "\x20再看\x20" },
            {
              type: "image_url",
              image_url: { url: "https://cdn.apimart.ai/files/first.png" },
            },
          ]));
      },
    );
  }),
  test("aiTextApi: APIMart GPT 文本格式遇到视频参考会明确报错", async () => {
    await withMockFetch(
      async (v89) => {
        const v90 = String(v89 || "");
        if (v90 === "/api/config")
          return jsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        throw new Error("unexpected fetch url: " + v90);
      },
      async () => {
        await strict["rejects"](
          () =>
            buildGenerateTextRequest({
              provider: "apimart",
              model: "apimart/gemini-3-flash-preview-nothinking",
              prompt: "分析\x20@视频1\x20的内容。",
              inputUrls: ["/local/ref.mp4"],
              inputVideoUrls: ["/local/ref.mp4"],
            }),
          /APIMart 文本模型已统一使用 GPT 图文格式/,
        );
      },
    );
  }),
  test("aiTextApi:\x20APIMart\x20GPT\x20文本格式遇到已上传视频参考也会明确报错", async () => {
    await withMockFetch(
      async (v91) => {
        const v92 = String(v91 || "");
        if (v92 === "/api/config")
          return jsonResponse({
            providers: {
              apimart: {
                apiUrl: "https://api.apimart.ai",
                apiKey: "k_apimart",
              },
            },
          });
        throw new Error("unexpected fetch url: " + v92);
      },
      async () => {
        await strict["rejects"](
          () =>
            buildGenerateTextRequest({
              provider: "apimart",
              model: "apimart/gemini-3-flash-preview-nothinking",
              prompt: "分析 @视频1",
              inputUrls: ["https://upload.apimart.ai/files/existing.mp4"],
              inputVideoUrls: ["https://upload.apimart.ai/files/existing.mp4"],
            }),
          /APIMart 文本模型已统一使用 GPT 图文格式/,
        );
      },
    );
  }),
  test("aiTextApi: RunningHUB 单图文本请求会走图片代理并优先使用 modelApiKey", async () => {
    await withMockFetch(
      async (v93) => {
        const v94 = String(v93 || "");
        if (v94 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected fetch url: " + v94);
      },
      async () => {
        const v95 = await buildGenerateTextRequest({
          provider: "runninghub",
          model: RUNNINGHUB_FLASH_MODEL,
          apiKey: "payload_key_should_not_win",
          prompt: "请描述图片内容",
          inputImageUrls: [RUNNINGHUB_IMAGE_URL],
        });
        (strict["equal"](v95["url"], "/api/v2/proxy/image"),
          strict["equal"](
            v95["body"]["apiUrl"],
            "https://www.runninghub.cn/openapi/v2/rhart-text-g-3-flash-preview-cv/image-to-text",
          ),
          strict["equal"](v95["body"]["apiKey"], "k_runninghub_model"),
          strict["equal"](v95["body"]["prompt"], "请描述图片内容"),
          strict["equal"](v95["body"]["imageUrl"], RUNNINGHUB_IMAGE_URL),
          strict["equal"](v95["adapterTrace"]?.["source"], "manifest"),
          strict["equal"](
            v95["adapterTrace"]?.["executionId"],
            "runninghub.model-api.rhart-text-g-3-flash-cv.v1",
          ),
          strict["deepEqual"](Object["keys"](v95["body"])["sort"](), [
            "apiKey",
            "apiUrl",
            "imageUrl",
            "prompt",
          ]));
      },
    );
  }),
  test("aiTextApi: RunningHUB LLM 文本模型走官方 chat completions 端点", async () => {
    await withMockFetch(
      async (v96) => {
        const v97 = String(v96 || "");
        if (v97 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected fetch url: " + v97);
      },
      async () => {
        const v98 = await buildGenerateTextRequest({
          provider: "runninghub",
          model: RUNNINGHUB_QWEN36_PLUS_MODEL,
          apiKey: "payload_key_should_not_win",
          prompt: "plain\x20text\x20prompt",
        });
        (strict["equal"](v98["url"], "/api/v2/proxy/completions"),
          strict["equal"](
            v98["body"]["apiUrl"],
            "https://llm.runninghub.cn/v1/chat/completions",
          ),
          strict["equal"](v98["body"]["apiKey"], "k_runninghub_model"),
          strict["equal"](v98["body"]["model"], RUNNINGHUB_QWEN36_PLUS_MODEL),
          strict["equal"](
            v98["body"]["messages"][1]["content"],
            "plain\x20text\x20prompt",
          ),
          strict["equal"](v98["adapterTrace"]?.["source"], "manifest"),
          strict["equal"](
            v98["adapterTrace"]?.["executionId"],
            "runninghub.model-api.text.qwen3-6-plus.v1",
          ));
      },
    );
  }),
  test("aiTextApi:\x20RunningHUB\x20LLM\x20直接返回\x20choices\x20时不会把\x20chat\x20id\x20当\x20taskId\x20轮询", async () => {
    const v99 = [];
    (await withMockFetch(
      async (v100, v101 = {}) => {
        const v102 = String(v100 || "");
        v99["push"]({ target: v102, options: v101 });
        if (v102 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (v102 === "/api/v2/proxy/completions")
          return jsonResponse({
            id: "chatcmpl-qwen-direct",
            object: "chat.completion",
            choices: [
              {
                message: { role: "assistant", content: "Qwen 直接文本结果" },
                finish_reason: "stop",
              },
            ],
          });
        if (v102 === "/api/v2/proxy/image")
          throw new Error(
            "Qwen\x20chat\x20completion\x20result\x20should\x20not\x20poll\x20task\x20query",
          );
        throw new Error("unexpected fetch url: " + v102);
      },
      async () => {
        const v103 = await generateText({
          provider: "runninghub",
          model: RUNNINGHUB_QWEN36_PLUS_MODEL,
          prompt: "plain text prompt",
        });
        strict["equal"](v103["text"], "Qwen 直接文本结果");
      },
    ),
      strict["equal"](
        v99["filter"]((v104) => v104["target"] === "/api/v2/proxy/completions")[
          "length"
        ],
        1,
      ),
      strict["equal"](
        v99["filter"]((v105) => v105["target"] === "/api/v2/proxy/image")[
          "length"
        ],
        0,
      ));
  }),
  test("aiTextApi: RunningHUB LLM 原始 SSE 会合并 delta 文本后直接返回", async () => {
    await withMockFetch(
      async (v106) => {
        const v107 = String(v106 || "");
        if (v107 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (v107 === "/api/v2/proxy/completions")
          return new Response(
            [
              'data: {"id":"chatcmpl-qwen-sse","choices":[{"delta":{"role":"assistant"}}]}',
              'data: {"choices":[{"delta":{"content":"Qwen "}}]}',
              'data: {"choices":[{"delta":{"content":"SSE 文本"},"finish_reason":"stop"}]}',
              "data: [DONE]",
              "",
            ]["join"]("\x0a\x0a"),
            { status: 200, headers: { "Content-Type": "text/event-stream" } },
          );
        if (v107 === "/api/v2/proxy/image")
          throw new Error(
            "Qwen\x20SSE\x20result\x20should\x20not\x20poll\x20task\x20query",
          );
        throw new Error("unexpected fetch url: " + v107);
      },
      async () => {
        const v108 = await generateText({
          provider: "runninghub",
          model: RUNNINGHUB_QWEN36_PLUS_MODEL,
          prompt: "plain text prompt",
        });
        strict["equal"](v108["text"], "Qwen SSE 文本");
      },
    );
  }),
  test("aiTextApi:\x20RunningHUB\x20Qwen3-VL\x20文本节点支持图像入参", async () => {
    await withMockFetch(
      async (v109, v110 = {}) => {
        const v111 = String(v109 || "");
        if (v111 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (v111 === "/local/qwen-vl.png")
          return imageResponse("qwen-vl-image");
        if (v111["startsWith"]("/api/v2/proxy/upload?"))
          return (
            strict["equal"](
              v110["headers"]?.["Authorization"],
              "Bearer k_runninghub_model",
            ),
            jsonResponse({
              code: 0,
              data: {
                download_url: "https://www.runninghub.cn/uploaded/qwen-vl.png",
              },
            })
          );
        throw new Error("unexpected fetch url: " + v111);
      },
      async () => {
        const v112 = await buildGenerateTextRequest({
          provider: "runninghub",
          model: RUNNINGHUB_QWEN3_VL_MODEL,
          prompt: "识别 @图片1 中的文字",
          inputUrls: ["/local/qwen-vl.png"],
          inputImageUrls: ["/local/qwen-vl.png"],
        });
        (strict["equal"](v112["url"], "/api/v2/proxy/completions"),
          strict["equal"](
            v112["body"]["apiUrl"],
            "https://llm.runninghub.cn/v1/chat/completions",
          ),
          strict["equal"](v112["body"]["model"], RUNNINGHUB_QWEN3_VL_MODEL),
          strict["deepEqual"](v112["body"]["messages"][1]["content"], [
            { type: "text", text: "识别 " },
            {
              type: "image_url",
              image_url: {
                url: "https://www.runninghub.cn/uploaded/qwen-vl.png",
              },
            },
            { type: "text", text: " 中的文字" },
          ]));
      },
    );
  }),
  test("aiTextApi: RunningHUB local single image uses shared upload helper", async () => {
    await withMockFetch(
      async (v113, v114 = {}) => {
        const v115 = String(v113 || "");
        if (v115 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (v115 === "/local/rh-upload.png")
          return imageResponse("rh-upload-image");
        if (v115["startsWith"]("/api/v2/proxy/upload?"))
          return (
            strict["equal"](
              v114["headers"]?.["Authorization"],
              "Bearer k_runninghub_model",
            ),
            jsonResponse({
              code: 0,
              data: {
                download_url:
                  "https://www.runninghub.cn/uploaded/download-url-image.png",
              },
            })
          );
        throw new Error("unexpected\x20fetch\x20url:\x20" + v115);
      },
      async () => {
        const v116 = await buildGenerateTextRequest({
          provider: "runninghub",
          model: RUNNINGHUB_FLASH_MODEL,
          prompt: "describe",
          inputImageUrls: ["/local/rh-upload.png"],
        });
        strict["equal"](
          v116["body"]["imageUrl"],
          "https://www.runninghub.cn/uploaded/download-url-image.png",
        );
      },
    );
  }),
  test("aiTextApi: RunningHUB local single image upload failure reports provider error", async () => {
    await withMockFetch(
      async (v117, v118 = {}) => {
        const v119 = String(v117 || "");
        if (v119 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (v119 === "/local/rh-bad-key.png")
          return imageResponse("rh-bad-key-image");
        if (v119["startsWith"]("/api/v2/proxy/upload?"))
          return (
            strict["equal"](
              v118["headers"]?.["Authorization"],
              "Bearer k_runninghub_model",
            ),
            jsonResponse({ code: 401, errorMessage: "invalid model api key" })
          );
        throw new Error("unexpected fetch url: " + v119);
      },
      async () => {
        await strict["rejects"](
          () =>
            buildGenerateTextRequest({
              provider: "runninghub",
              model: RUNNINGHUB_FLASH_MODEL,
              prompt: "describe",
              inputImageUrls: ["/local/rh-bad-key.png"],
            }),
          /RunningHUB .*invalid model api key.*401/,
        );
      },
    );
  }),
  test("aiTextApi: RunningHUB model API does not fall back to workflow apiKey", async () => {
    await withMockFetch(
      async (v120) => {
        const v121 = String(v120 || "");
        if (v121 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub_workflow_only",
              },
            },
          });
        throw new Error("unexpected fetch url: " + v121);
      },
      async () => {
        await strict["rejects"](
          () =>
            buildGenerateTextRequest({
              provider: "runninghub",
              model: RUNNINGHUB_FLASH_MODEL,
              prompt: "describe",
              inputImageUrls: [RUNNINGHUB_IMAGE_URL],
            }),
          /API Key/,
        );
      },
    );
  }),
  test("aiTextApi: RunningHUB 多图文本请求会先合成再上传为单个 imageUrl", async () => {
    const v122 = [];
    await withMockFetch(
      async (v123, v124 = {}) => {
        const v125 = String(v123 || "");
        v122["push"]({ target: v125, options: v124 });
        if (v125 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (v125 === "/local/first.png" || v125 === "/local/second.png")
          return imageResponse(v125);
        if (v125["startsWith"]("/api/v2/proxy/upload?"))
          return (
            strict["equal"](
              v124["headers"]?.["Authorization"],
              "Bearer k_runninghub_model",
            ),
            jsonResponse({
              code: 0,
              data: {
                download_url:
                  "https://www.runninghub.cn/uploaded/merged-sheet.png",
              },
            })
          );
        throw new Error("unexpected fetch url: " + v125);
      },
      async () => {
        await withMockCanvasComposition(async () => {
          const v126 = await buildGenerateTextRequest({
            provider: "runninghub",
            model: RUNNINGHUB_PRO_MODEL,
            prompt: "请综合分析这些图片",
            inputImageUrls: ["/local/first.png", "/local/second.png"],
          });
          (strict["equal"](v126["url"], "/api/v2/proxy/image"),
            strict["equal"](
              v126["body"]["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/rhart-text-g-3-pro-preview-cv/image-to-text",
            ),
            strict["equal"](v126["body"]["apiKey"], "k_runninghub_model"),
            strict["equal"](v126["body"]["prompt"], "请综合分析这些图片"),
            strict["equal"](
              v126["body"]["imageUrl"],
              "https://www.runninghub.cn/uploaded/merged-sheet.png",
            ),
            strict["equal"](v126["body"]["imageUrls"], undefined));
        });
      },
    );
    const v127 = v122["filter"](
      (v128) =>
        v128["target"] === "/local/first.png" ||
        v128["target"] === "/local/second.png",
    );
    strict["equal"](v127["length"], 2);
    const v129 = v122["filter"]((v130) =>
      v130["target"]["startsWith"]("/api/v2/proxy/upload?"),
    );
    strict["equal"](v129["length"], 1);
  }),
  test("aiTextApi: RunningHUB 文本请求缺图时会直接报错", async () => {
    await withMockFetch(
      async (v131) => {
        const v132 = String(v131 || "");
        if (v132 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        throw new Error("unexpected fetch url: " + v132);
      },
      async () => {
        await strict["rejects"](
          () =>
            buildGenerateTextRequest({
              provider: "runninghub",
              model: RUNNINGHUB_FLASH_MODEL,
              prompt: "请描述图片内容",
            }),
          (v133) => {
            return (
              strict["ok"](v133 instanceof Error),
              strict["ok"](
                String(v133["message"] || "")["trim"]()["length"] > 0,
              ),
              true
            );
          },
        );
      },
    );
  }),
  test("aiTextApi: RunningHUB 文本生成会在任务成功后返回 results[0].text", async () => {
    const v134 = [];
    await withMockFetch(
      async (v135, v136 = {}) => {
        const v137 = String(v135 || "");
        v134["push"]({ target: v137, options: v136 });
        if (v137 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (v137 === "/api/v2/proxy/image") {
          const v138 = JSON["parse"](String(v136["body"] || "{}"));
          if (
            v138["apiUrl"] ===
            "https://www.runninghub.cn/openapi/v2/rhart-text-g-3-pro-preview-cv/image-to-text"
          )
            return jsonResponse({
              taskId: "task_text_1",
              status: "RUNNING",
              errorCode: "",
              errorMessage: "",
            });
          if (v138["apiUrl"] === "https://www.runninghub.cn/openapi/v2/query")
            return (
              strict["equal"](v138["taskId"], "task_text_1"),
              strict["equal"](v138["apiKey"], "k_runninghub_model"),
              jsonResponse({
                taskId: "task_text_1",
                status: "SUCCESS",
                errorCode: "",
                errorMessage: "",
                results: [
                  {
                    url: null,
                    outputType: "text",
                    text: "RunningHUB 文本结果",
                  },
                ],
              })
            );
        }
        throw new Error("unexpected\x20fetch\x20url:\x20" + v137);
      },
      async () => {
        await withImmediateTimers(async () => {
          const v139 = await generateText({
            provider: "runninghub",
            model: RUNNINGHUB_PRO_MODEL,
            prompt: "请详细描述图片",
            inputImageUrls: [RUNNINGHUB_IMAGE_URL],
          });
          strict["equal"](v139["text"], "RunningHUB 文本结果");
        });
      },
    );
    const v140 = v134["filter"](
      (v141) => v141["target"] === "/api/v2/proxy/image",
    );
    strict["equal"](v140["length"], 2);
  }),
  test("aiTextApi: RunningHUB 任务失败时会抛出轮询错误", async () => {
    await withMockFetch(
      async (v142, v143 = {}) => {
        const v144 = String(v142 || "");
        if (v144 === "/api/config")
          return jsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://www.runninghub.cn",
                apiKey: "k_runninghub",
                modelApiKey: "k_runninghub_model",
              },
            },
          });
        if (v144 === "/api/v2/proxy/image") {
          const v145 = JSON["parse"](String(v143["body"] || "{}"));
          if (
            v145["apiUrl"] ===
            "https://www.runninghub.cn/openapi/v2/rhart-text-g-3-flash-preview-cv/image-to-text"
          )
            return jsonResponse({
              taskId: "task_text_failed",
              status: "RUNNING",
              errorCode: "",
              errorMessage: "",
            });
          if (v145["apiUrl"] === "https://www.runninghub.cn/openapi/v2/query")
            return jsonResponse({
              taskId: "task_text_failed",
              status: "FAILED",
              errorCode: "bad_task",
              errorMessage: "task\x20failed",
            });
        }
        throw new Error("unexpected fetch url: " + v144);
      },
      async () => {
        await withImmediateTimers(async () => {
          await strict["rejects"](
            () =>
              generateText({
                provider: "runninghub",
                model: RUNNINGHUB_FLASH_MODEL,
                prompt: "请描述图片",
                inputImageUrls: [RUNNINGHUB_IMAGE_URL],
              }),
            /task failed/,
          );
        });
      },
    );
  }),
  test("aiTextApi: grsai OpenAI-compatible multimodal text requests use proxy/completions", async () => {
    let v146 = false;
    await withMockFetch(
      async (v147) => {
        const v148 = String(v147 || "");
        if (v148 === "/api/config")
          return jsonResponse({
            providers: {
              grsai: {
                apiUrl: "https://grsai.dakka.com.cn",
                apiKey: "k_grsai",
              },
            },
          });
        if (v148 === "/local/ref.png") return imageResponse("grsai-image");
        if (v148 === "https://telegra.ph/upload")
          return (
            (v146 = true),
            jsonResponse([{ src: "/unexpected-telegraph-ref.png" }])
          );
        if (
          v148 === "https://grsai.dakka.com.cn/client/resource/newUploadTokenZH"
        )
          return jsonResponse({
            data: {
              token: "token_grsai",
              key: "uploaded/grsai-ref.png",
              url: "https://upload.grsai.example.com",
              domain: "https://cdn.grsai.example.com",
            },
          });
        if (v148 === "https://upload.grsai.example.com")
          return jsonResponse({ ok: true });
        throw new Error("unexpected fetch url: " + v148);
      },
      async () => {
        const v149 = await buildGenerateTextRequest({
          provider: "grsai",
          model: "gemini-3.1-pro",
          prompt:
            "Please\x20inspect\x20@图片1\x20and\x20keep\x20the\x20trailing\x20text.",
          inputUrls: ["/local/ref.png"],
        });
        (strict["equal"](v149["url"], "/api/v2/proxy/completions"),
          strict["equal"](
            v149["body"]["apiUrl"],
            "https://grsai.dakka.com.cn/v1",
          ),
          strict["equal"](v149["body"]["apiKey"], "k_grsai"),
          strict["equal"](v149["body"]["model"], "gemini-3.1-pro"));
        const v150 = v149["body"]["messages"][1]["content"];
        (strict["ok"](Array["isArray"](v150)),
          strict["deepEqual"](v150, [
            { type: "text", text: "Please inspect " },
            {
              type: "image_url",
              image_url: {
                url: "https://cdn.grsai.example.com/uploaded/grsai-ref.png",
              },
            },
            { type: "text", text: " and keep the trailing text." },
          ]),
          strict["equal"](v146, false));
      },
    );
  }),
  test("aiTextApi: ppio text manifest uses OpenAI-compatible endpoint", async () => {
    await withMockFetch(
      async (v151) => {
        const v152 = String(v151 || "");
        if (v152 === "/api/config")
          return jsonResponse({
            providers: {
              ppio: { apiUrl: "https://api.ppinfra.com", apiKey: "k_ppio" },
            },
          });
        throw new Error("unexpected fetch url: " + v152);
      },
      async () => {
        const v153 = await buildGenerateTextRequest({
          provider: "ppio",
          model: "qwen/qwen3.5-397b-a17b",
          prompt: "plain text prompt",
        });
        (strict["equal"](v153["url"], "/api/v2/proxy/completions"),
          strict["equal"](
            v153["body"]["apiUrl"],
            "https://api.ppinfra.com/openai/v1",
          ),
          strict["equal"](v153["body"]["apiKey"], "k_ppio"),
          strict["equal"](v153["body"]["model"], "qwen/qwen3.5-397b-a17b"),
          strict["equal"](
            v153["body"]["messages"][1]["content"],
            "plain text prompt",
          ));
      },
    );
  }),
  test("aiTextApi:\x20generateText\x20via\x20grsai\x20proxy\x20strips\x20think\x20tags\x20from\x20multimodal\x20responses", async () => {
    let v154 = null;
    await withMockFetch(
      async (v155, v156 = {}) => {
        const v157 = String(v155 || "");
        if (v157 === "/api/config")
          return jsonResponse({
            providers: {
              grsai: {
                apiUrl: "https://grsai.dakka.com.cn",
                apiKey: "k_grsai",
              },
            },
          });
        if (v157 === "/local/ref.png") return imageResponse("grsai-image");
        if (
          v157 === "https://grsai.dakka.com.cn/client/resource/newUploadTokenZH"
        )
          return jsonResponse({
            data: {
              token: "token_grsai",
              key: "uploaded/grsai-ref.png",
              url: "https://upload.grsai.example.com",
              domain: "https://cdn.grsai.example.com",
            },
          });
        if (v157 === "https://upload.grsai.example.com")
          return jsonResponse({ ok: true });
        if (v157 === "/api/v2/proxy/completions")
          return (
            (v154 = JSON["parse"](String(v156["body"] || "{}"))),
            jsonResponse({
              choices: [
                {
                  message: {
                    content: "<think>internal\x20reasoning</think>\x0a红色",
                  },
                },
              ],
            })
          );
        throw new Error("unexpected fetch url: " + v157);
      },
      async () => {
        const v158 = await generateText({
          provider: "grsai",
          model: "gemini-3-pro",
          prompt: "这张图的主颜色是什么？只回答颜色。",
          inputUrls: ["/local/ref.png"],
        });
        (strict["equal"](v158["text"], "红色"),
          strict["equal"](v154?.["apiUrl"], "https://grsai.dakka.com.cn/v1"),
          strict["equal"](v154?.["model"], "gemini-3-pro"),
          strict["ok"](Array["isArray"](v154?.["messages"]?.[1]?.["content"])));
      },
    );
  }),
  test("aiTextApi: grsai partial image upload failure keeps mention slots from shifting", async () => {
    await withMockFetch(
      async (v159) => {
        const v160 = String(v159 || "");
        if (v160 === "/api/config")
          return jsonResponse({
            providers: {
              grsai: {
                apiUrl: "https://grsai.dakka.com.cn",
                apiKey: "k_grsai",
              },
            },
          });
        if (v160 === "/local/first-failed.png") throw new Error("fetch failed");
        if (v160 === "/local/second-ok.png")
          return imageResponse("grsai-image-2");
        if (
          v160 === "https://grsai.dakka.com.cn/client/resource/newUploadTokenZH"
        )
          return jsonResponse({
            data: {
              token: "token_grsai",
              key: "uploaded/grsai-ref-2.png",
              url: "https://upload.grsai.example.com",
              domain: "https://cdn.grsai.example.com",
            },
          });
        if (v160 === "https://upload.grsai.example.com")
          return jsonResponse({ ok: true });
        throw new Error("unexpected\x20fetch\x20url:\x20" + v160);
      },
      async () => {
        const v161 = await buildGenerateTextRequest({
          provider: "grsai",
          model: "gemini-3.1-pro",
          prompt: "A @图片1 B @图片2 C",
          inputUrls: ["/local/first-failed.png", "/local/second-ok.png"],
        });
        strict["deepEqual"](v161["body"]["messages"][1]["content"], [
          { type: "text", text: "A @图片1 B " },
          {
            type: "image_url",
            image_url: {
              url: "https://cdn.grsai.example.com/uploaded/grsai-ref-2.png",
            },
          },
          { type: "text", text: "\x20C" },
        ]);
      },
    );
  }));

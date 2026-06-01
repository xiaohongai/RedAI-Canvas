import test from "node:test";
import strict from "node:assert/strict";
function installFetchMockForConfig(v0) {
  globalThis["fetch"] = async (v1) => {
    const v2 = String(v1);
    if (v2 !== "/api/config") throw new Error("unexpected fetch url: " + v2);
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => v0,
      text: async () => JSON["stringify"](v0),
    };
  };
}
(test("aiImageApi: grsai 无 apiKey 时抛出 AUTH_ERROR", async () => {
  const v3 = globalThis["fetch"];
  try {
    installFetchMockForConfig({
      providers: {
        grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
      },
    });
    const { clearApiConfig: v4 } = await import("./configApi.js");
    v4();
    const { buildGenerateImageRequest: v5 } = await import("./aiImageApi.js");
    try {
      (await v5({ prompt: "p", model: "nano-banana-pro-vt" }),
        strict["fail"]("should throw"));
    } catch (v6) {
      (strict["equal"](v6?.["name"], "ApiError"),
        strict["equal"](v6?.["type"], "AUTH_ERROR"),
        strict["equal"](v6?.["provider"], "grsai"));
    }
  } finally {
    globalThis["fetch"] = v3;
  }
}),
  test("aiImageApi: ppio seedream branch uses proxy/image without requiring inputUrls", async () => {
    const v7 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          ppio: { apiUrl: "https://ppio.example.com/", apiKey: "k_ppio" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v8 } = await import("./configApi.js");
      v8();
      const { buildGenerateImageRequest: v9 } = await import("./aiImageApi.js"),
        v10 = await v9({
          prompt: "p",
          model: "ppio/seedream-5.0-lite",
          aspectRatio: "16：9",
        });
      (strict["equal"](v10["url"], "/api/v2/proxy/image"),
        strict["ok"](
          String(v10["body"]["apiUrl"])["includes"]("/v3/seedream-5.0-lite"),
        ),
        strict["equal"](v10["body"]["size"], "2752x1536"),
        strict["equal"](v10["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v10["adapterTrace"]?.["executionId"],
          "ppio.model-api.seedream-5-lite.v1",
        ));
    } finally {
      globalThis["fetch"] = v7;
    }
  }),
  test("aiImageApi: volcengine seedream models use Ark images endpoint", async () => {
    const v11 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          volcengine: {
            apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
            apiKey: "k_ark",
          },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v12 } = await import("./configApi.js");
      v12();
      const { buildGenerateImageRequest: v13 } =
          await import("./aiImageApi.js"),
        v14 = await v13({
          prompt: "p",
          provider: "volcengine",
          model: "volcengine/seedream-5.0",
          aspectRatio: "16:9",
          imageSize: "2K",
          inputUrls: [],
        });
      (strict["equal"](v14["url"], "/api/v2/proxy/image"),
        strict["equal"](
          v14["body"]["apiUrl"],
          "https://ark.cn-beijing.volces.com/api/v3/images/generations",
        ),
        strict["equal"](v14["body"]["apiKey"], "k_ark"),
        strict["equal"](v14["body"]["model"], "doubao-seedream-5-0-260128"),
        strict["equal"](v14["body"]["size"], "2848x1600"),
        strict["equal"](v14["body"]["response_format"], "url"),
        strict["equal"](v14["body"]["watermark"], false),
        strict["equal"](v14["body"]["sequential_image_generation"], "disabled"),
        strict["equal"](
          v14["body"]["sequential_image_generation_options"],
          undefined,
        ),
        strict["equal"](
          v14["adapterTrace"]?.["executionId"],
          "volcengine.model-api.seedream-5.v1",
        ));
      const v15 = await v13({
        prompt: "p",
        provider: "volcengine",
        model: "volcengine/seedream-4.5",
        aspectRatio: "1:1",
        imageSize: "4K",
        batchSize: 4,
        inputUrls: [],
      });
      (strict["equal"](v15["body"]["model"], "doubao-seedream-4-5-251128"),
        strict["equal"](v15["body"]["size"], "2880x2880"),
        strict["equal"](v15["body"]["sequential_image_generation"], "auto"),
        strict["equal"](
          v15["body"]["sequential_image_generation_options"]?.["max_images"],
          4,
        ));
      const v16 = await v13({
        prompt: "p",
        provider: "volcengine",
        model: "volcengine/seedream-4.0",
        aspectRatio: "3:2",
        imageSize: "1K",
        inputUrls: [],
      });
      (strict["equal"](v16["body"]["model"], "doubao-seedream-4-0-250828"),
        strict["equal"](v16["body"]["size"], "1256x840"));
    } finally {
      globalThis["fetch"] = v11;
    }
  }),
  test("aiImageApi: volcengine seedream reference images upload through Ark Files API", async () => {
    const v17 = globalThis["fetch"],
      v18 = [];
    try {
      globalThis["fetch"] = async (v19, v20 = {}) => {
        const v21 = String(v19);
        if (v21 === "/api/config")
          return makeJsonResponse({
            providers: {
              volcengine: {
                apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                apiKey: "k_ark",
              },
            },
          });
        if (v21 === "/local/ref.png")
          return makeBlobResponse("seedream-ref-image", "image/png");
        if (v21["startsWith"]("/api/v2/proxy/upload?")) {
          strict["equal"](v20["headers"]?.["Authorization"], "Bearer k_ark");
          const v22 = new URL("http://local" + v21)["searchParams"]["get"](
            "apiUrl",
          );
          strict["equal"](
            v22,
            "https://ark.cn-beijing.volces.com/api/v3/files",
          );
          const v23 = Object["fromEntries"](v20["body"]["entries"]());
          return (
            strict["equal"](v23["purpose"], "user_data"),
            strict["equal"](v23["preprocess_configs[video][fps]"], undefined),
            v18["push"](v23["file"]?.["name"] || ""),
            strict["equal"](await v23["file"]["text"](), "seedream-ref-image"),
            makeJsonResponse({
              object: "file",
              id: "file-seedream-ref-1",
              status: "active",
              purpose: "user_data",
            })
          );
        }
        throw new Error("unexpected fetch url: " + v21);
      };
      const { clearApiConfig: v24 } = await import("./configApi.js");
      v24();
      const { buildGenerateImageRequest: v25 } =
          await import("./aiImageApi.js"),
        v26 = await v25({
          prompt: "p",
          provider: "volcengine",
          model: "volcengine/seedream-4.0",
          aspectRatio: "1:1",
          imageSize: "2K",
          inputUrls: ["/local/ref.png"],
        });
      (strict["equal"](v26["url"], "/api/v2/proxy/image"),
        strict["equal"](
          v26["body"]["apiUrl"],
          "https://ark.cn-beijing.volces.com/api/v3/images/generations",
        ),
        strict["deepEqual"](v26["body"]["image"], ["file-seedream-ref-1"]),
        strict["deepEqual"](v18, ["ref.png"]));
    } finally {
      globalThis["fetch"] = v17;
    }
  }),
  test("aiImageApi: volcengine direct image response with id does not poll", async () => {
    const v27 = globalThis["fetch"],
      v28 = globalThis["window"];
    let v29 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v30) => {
          const v31 = String(v30);
          if (v31 === "/api/config")
            return makeJsonResponse({
              providers: {
                volcengine: {
                  apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
                  apiKey: "k_ark",
                },
                grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
              },
            });
          if (v31 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                id: "ark-direct-response-1",
                created: 1780000000,
                data: [{ url: "https://ark.example.com/seedream.png" }],
              }),
            );
          if (v31["startsWith"]("/api/v2/proxy/task?")) {
            v29 += 1;
            throw new Error("unexpected\x20task\x20poll:\x20" + v31);
          }
          if (v31 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/volcengine-direct.png" });
          throw new Error("unexpected fetch url: " + v31);
        }));
      const { clearApiConfig: v32 } = await import("./configApi.js");
      v32();
      const { generateImage: v33 } = await import("./aiImageApi.js"),
        v34 = await v33({
          prompt: "cat",
          provider: "volcengine",
          model: "volcengine/seedream-4.0",
          inputUrls: [],
          aspectRatio: "1:1",
          imageSize: "2K",
        });
      (strict["equal"](v29, 0),
        strict["equal"](v34["localPath"], "output/volcengine-direct.png"),
        strict["equal"](v34["imageUrl"], "/output/volcengine-direct.png"));
    } finally {
      ((globalThis["fetch"] = v27), (globalThis["window"] = v28));
    }
  }),
  test("aiImageApi: dreamina versioned model forwards modelVersion", async () => {
    const v35 = globalThis["fetch"];
    try {
      installFetchMockForConfig({ providers: {} });
      const { clearApiConfig: v36 } = await import("./configApi.js");
      v36();
      const { buildGenerateImageRequest: v37 } =
          await import("./aiImageApi.js"),
        v38 = await v37({
          prompt: "p",
          provider: "dreamina",
          model: "dreamina/4.5",
          aspectRatio: "1:1",
          imageSize: "2K",
          inputUrls: [],
        });
      (strict["equal"](v38["url"], "/api/v2/dreamina/text2image"),
        strict["equal"](v38["body"]["modelVersion"], "4.5"),
        strict["equal"](v38["body"]["ratio"], "1:1"),
        strict["equal"](v38["body"]["resolutionType"], "2k"));
    } finally {
      globalThis["fetch"] = v35;
    }
  }));
function makeJsonResponse(v39, v40 = 200) {
  return {
    ok: v40 >= 200 && v40 < 300,
    status: v40,
    headers: {
      get(v41) {
        return String(v41 || "")["toLowerCase"]() === "content-type"
          ? "application/json"
          : null;
      },
    },
    json: async () => v39,
    text: async () => JSON["stringify"](v39),
  };
}
function makeTextResponse(v42, v43 = 200) {
  const v44 = String(v42 || "");
  return {
    ok: v43 >= 200 && v43 < 300,
    status: v43,
    headers: {
      get(v45) {
        return String(v45 || "")["toLowerCase"]() === "content-type"
          ? "text/plain"
          : null;
      },
    },
    json: async () => JSON["parse"](v44),
    text: async () => v44,
  };
}
function makeBlobResponse(v46, v47 = "image/png", v48 = 200) {
  return new Response(new Blob([String(v46 || "")], { type: v47 }), {
    status: v48,
    headers: { "Content-Type": v47 },
  });
}
function makeTextResponseWithHeaders(v49, v50 = {}, v51 = 200) {
  const v52 = String(v49 || ""),
    v53 = Object["fromEntries"](
      Object["entries"](v50 || {})["map"](([v54, v55]) => [
        String(v54 || "")["toLowerCase"](),
        String(v55 || ""),
      ]),
    );
  return {
    ok: v51 >= 200 && v51 < 300,
    status: v51,
    headers: {
      get(v56) {
        const v57 = String(v56 || "")["toLowerCase"]();
        if (v57 === "content-type") return "text/plain";
        return v53[v57] || null;
      },
    },
    json: async () => JSON["parse"](v52),
    text: async () => v52,
  };
}
function getProxyTaskApiUrl(v58) {
  const v59 = new URL(String(v58 || ""), "http://localhost");
  return v59["searchParams"]["get"]("apiUrl") || "";
}
(test("aiImageApi: dreamina image2image with auto ratio does not forward ratio", async () => {
  const v60 = globalThis["fetch"];
  try {
    installFetchMockForConfig({ providers: {} });
    const { clearApiConfig: v61 } = await import("./configApi.js");
    v61();
    const { buildGenerateImageRequest: v62 } = await import("./aiImageApi.js"),
      v63 = await v62({
        prompt: "p",
        provider: "dreamina",
        model: "dreamina/5.0",
        aspectRatio: "auto",
        imageSize: "4K",
        inputUrls: ["/data/uploads/a.png"],
      });
    (strict["equal"](v63["url"], "/api/v2/dreamina/image2image"),
      strict["ok"](
        !Object["prototype"]["hasOwnProperty"]["call"](v63["body"], "ratio"),
      ),
      strict["equal"](v63["body"]["modelVersion"], "5.0"),
      strict["equal"](v63["body"]["resolutionType"], "4k"));
  } finally {
    globalThis["fetch"] = v60;
  }
}),
  test("aiImageApi: dreamina text2image with auto ratio forwards 1:1", async () => {
    const v64 = globalThis["fetch"];
    try {
      installFetchMockForConfig({ providers: {} });
      const { clearApiConfig: v65 } = await import("./configApi.js");
      v65();
      const { buildGenerateImageRequest: v66 } =
          await import("./aiImageApi.js"),
        v67 = await v66({
          prompt: "p",
          provider: "dreamina",
          model: "dreamina/4.1",
          aspectRatio: "auto",
          inputUrls: [],
        });
      (strict["equal"](v67["url"], "/api/v2/dreamina/text2image"),
        strict["equal"](v67["body"]["ratio"], "1:1"),
        strict["equal"](v67["body"]["modelVersion"], "4.1"));
    } finally {
      globalThis["fetch"] = v64;
    }
  }),
  test("aiImageApi: grsai suppressAspectRatio=true 时不透传 aspectRatio", async () => {
    const v68 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          grsai: {
            apiUrl: "https://api.grsai.example.com/",
            apiKey: "k_grsai",
          },
        },
      });
      const { clearApiConfig: v69 } = await import("./configApi.js");
      v69();
      const { buildGenerateImageRequest: v70 } =
          await import("./aiImageApi.js"),
        v71 = await v70({
          prompt: "p",
          provider: "grsai",
          model: "nano-banana-pro-vt",
          aspectRatio: "16:9",
          suppressAspectRatio: true,
          inputUrls: [],
        });
      (strict["equal"](v71["url"], "/api/v2/proxy/image"),
        strict["equal"](v71["body"]["aspectRatio"], undefined),
        strict["deepEqual"](v71["body"]["images"], []),
        strict["equal"](v71["body"]["replyType"], "json"));
    } finally {
      globalThis["fetch"] = v68;
    }
  }),
  test("aiImageApi: grsai gpt-image-2 uses official /v1/api/generate body shape", async () => {
    const v72 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          grsai: {
            apiUrl: "https://api.grsai.example.com/",
            apiKey: "k_grsai",
          },
        },
      });
      const { clearApiConfig: v73 } = await import("./configApi.js");
      v73();
      const { buildGenerateImageRequest: v74 } =
          await import("./aiImageApi.js"),
        v75 = await v74({
          prompt: "p",
          provider: "grsai",
          model: "gpt-image-2",
          mode: "normal",
          aspectRatio: "9:21",
          imageSize: "4K",
          inputUrls: [],
        });
      (strict["equal"](v75["url"], "/api/v2/proxy/image"),
        strict["equal"](
          v75["body"]["apiUrl"],
          "https://api.grsai.example.com/v1/api/generate",
        ),
        strict["equal"](v75["body"]["model"], "gpt-image-2"),
        strict["deepEqual"](v75["body"]["images"], []),
        strict["equal"](v75["body"]["replyType"], "json"),
        strict["equal"](v75["body"]["imageSize"], undefined),
        strict["equal"](v75["body"]["aspectRatio"], "832x1920"));
      const v76 = await v74({
        prompt: "p",
        provider: "grsai",
        model: "gpt-image-2",
        mode: "vip",
        aspectRatio: "2:1",
        imageSize: "4K",
        inputUrls: [],
      });
      (strict["equal"](
        v76["body"]["apiUrl"],
        "https://api.grsai.example.com/v1/api/generate",
      ),
        strict["equal"](v76["body"]["model"], "gpt-image-2-vip"),
        strict["deepEqual"](v76["body"]["images"], []),
        strict["equal"](v76["body"]["replyType"], "json"),
        strict["equal"](v76["body"]["imageSize"], undefined),
        strict["equal"](v76["body"]["aspectRatio"], "3840x1920"));
    } finally {
      globalThis["fetch"] = v72;
    }
  }),
  test("aiImageApi: grsai missing manifest rejects instead of manual request fallback", async () => {
    const v77 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          grsai: {
            apiUrl: "https://api.grsai.example.com/",
            apiKey: "k_grsai",
          },
        },
      });
      const { clearApiConfig: v78 } = await import("./configApi.js");
      v78();
      const { buildGenerateImageRequest: v79 } =
        await import("./aiImageApi.js");
      await strict["rejects"](
        () =>
          v79({
            prompt: "p",
            provider: "grsai",
            model: "grsai/unregistered-model",
            inputUrls: [],
          }),
        /GRSAI image model API manifest missing: grsai\/unregistered-model/,
      );
    } finally {
      globalThis["fetch"] = v77;
    }
  }),
  test("aiImageApi: grsai nano-banana manifest builds request", async () => {
    const v80 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          grsai: {
            apiUrl: "https://api.grsai.example.com/",
            apiKey: "k_grsai",
          },
        },
      });
      const { clearApiConfig: v81 } = await import("./configApi.js");
      v81();
      const { buildGenerateImageRequest: v82 } =
          await import("./aiImageApi.js"),
        v83 = await v82({
          prompt: "p",
          provider: "grsai",
          model: "nano-banana-2",
          aspectRatio: "16:9",
          imageSize: "4K",
          batchSize: 2,
          inputUrls: [],
        });
      (strict["equal"](v83["url"], "/api/v2/proxy/image"),
        strict["equal"](
          v83["body"]["apiUrl"],
          "https://api.grsai.example.com/v1/api/generate",
        ),
        strict["equal"](v83["body"]["apiKey"], "k_grsai"),
        strict["equal"](v83["body"]["model"], "nano-banana-2"),
        strict["equal"](v83["body"]["prompt"], "p"),
        strict["deepEqual"](v83["body"]["images"], []),
        strict["equal"](v83["body"]["replyType"], "json"),
        strict["equal"](v83["body"]["imageSize"], "2K"),
        strict["equal"](v83["body"]["aspectRatio"], "16:9"),
        strict["equal"](v83["body"]["batchSize"], undefined),
        strict["equal"](v83["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v83["adapterTrace"]?.["executionId"],
          "grsai.model-api.nano-banana-2.v1",
        ));
    } finally {
      globalThis["fetch"] = v80;
    }
  }),
  test("aiImageApi:\x20grsai\x20nano-banana\x20request\x20uses\x20documented\x20size\x20and\x20ratio\x20enums", async () => {
    const v84 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          grsai: {
            apiUrl: "https://api.grsai.example.com/",
            apiKey: "k_grsai",
          },
        },
      });
      const { clearApiConfig: v85 } = await import("./configApi.js");
      v85();
      const { buildGenerateImageRequest: v86 } =
          await import("./aiImageApi.js"),
        v87 = await v86({
          prompt: "p",
          provider: "grsai",
          model: "nano-banana",
          aspectRatio: "自适应",
          imageSize: "3K",
          inputUrls: [],
        });
      (strict["equal"](v87["body"]["imageSize"], "2K"),
        strict["equal"](v87["body"]["aspectRatio"], "auto"));
      const v88 = await v86({
        prompt: "p",
        provider: "grsai",
        model: "nano-banana-pro",
        aspectRatio: "1:8",
        imageSize: "bogus",
        inputUrls: [],
      });
      (strict["equal"](v88["body"]["imageSize"], "2K"),
        strict["equal"](v88["body"]["aspectRatio"], "9:16"));
      const v89 = await v86({
        prompt: "p",
        provider: "grsai",
        model: "nano-banana-pro",
        mode: "vip",
        aspectRatio: "16:9",
        imageSize: "4K",
        inputUrls: [],
      });
      (strict["equal"](v89["body"]["model"], "nano-banana-pro-4k-vip"),
        strict["equal"](v89["body"]["imageSize"], "4K"),
        strict["equal"](v89["body"]["aspectRatio"], "16:9"));
      const v90 = await v86({
        prompt: "p",
        provider: "grsai",
        model: "nano-banana-2",
        aspectRatio: "1:8",
        imageSize: "4K",
        inputUrls: [],
      });
      (strict["equal"](v90["body"]["imageSize"], "2K"),
        strict["equal"](v90["body"]["aspectRatio"], "1:8"));
      const v91 = await v86({
        prompt: "p",
        provider: "grsai",
        model: "nano-banana-2",
        mode: "cl",
        aspectRatio: "1:8",
        imageSize: "4K",
        inputUrls: [],
      });
      (strict["equal"](v91["body"]["model"], "nano-banana-2-4k-cl"),
        strict["equal"](v91["body"]["imageSize"], "4K"),
        strict["equal"](v91["body"]["aspectRatio"], "1:8"));
    } finally {
      globalThis["fetch"] = v84;
    }
  }),
  test("aiImageApi:\x20apimart\x20suppressAspectRatio=true\x20时不透传\x20size", async () => {
    const v92 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: "https://api.apimart.ai", apiKey: "k_apimart" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v93 } = await import("./configApi.js");
      v93();
      const { buildGenerateImageRequest: v94 } =
          await import("./aiImageApi.js"),
        v95 = await v94({
          prompt: "p",
          provider: "apimart",
          model: "apimart/nano-banana-pro",
          aspectRatio: "16:9",
          suppressAspectRatio: true,
          inputUrls: [],
        });
      (strict["equal"](v95["url"], "/api/v2/proxy/image"),
        strict["equal"](v95["body"]["size"], undefined));
    } finally {
      globalThis["fetch"] = v92;
    }
  }),
  test("aiImageApi:\x20apimart\x20gpt-image-2\x204K\x20uses\x20supported\x20size\x20values", async () => {
    const v96 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: "https://api.apimart.ai", apiKey: "k_apimart" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v97 } = await import("./configApi.js");
      v97();
      const { buildGenerateImageRequest: v98 } =
          await import("./aiImageApi.js"),
        v99 = await v98({
          prompt: "p",
          provider: "apimart",
          model: "apimart/gpt-image-2",
          aspectRatio: "9:21",
          imageSize: "4K",
          inputUrls: [],
        });
      (strict["equal"](v99["body"]["model"], "gpt-image-2"),
        strict["equal"](v99["body"]["resolution"], "4k"),
        strict["equal"](v99["body"]["size"], "9:21"),
        strict["equal"](v99["body"]["n"], 1),
        strict["equal"](v99["body"]["official_fallback"], undefined));
      const v100 = await v98({
        prompt: "p",
        provider: "apimart",
        model: "apimart/gpt-image-2",
        aspectRatio: "1:1",
        imageSize: "4K",
        inputUrls: [],
      });
      (strict["equal"](v100["body"]["resolution"], "4k"),
        strict["equal"](v100["body"]["size"], "16:9"),
        strict["equal"](v100["body"]["n"], 1));
      const v101 = await v98({
        prompt: "p",
        provider: "apimart",
        model: "apimart/gpt-image-2",
        mode: "official",
        aspectRatio: "2:1",
        imageSize: "4K",
        batchSize: 4,
        inputUrls: [],
      });
      (strict["equal"](v101["body"]["model"], "gpt-image-2-official"),
        strict["equal"](v101["body"]["resolution"], "4k"),
        strict["equal"](v101["body"]["size"], "2:1"),
        strict["equal"](v101["body"]["n"], 1),
        strict["equal"](v101["body"]["official_fallback"], undefined));
    } finally {
      globalThis["fetch"] = v96;
    }
  }),
  test("aiImageApi: apimart qwen-image-2.0 uses documented model, size, resolution, and n", async () => {
    const v102 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: "https://api.apimart.ai", apiKey: "k_apimart" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v103 } = await import("./configApi.js");
      v103();
      const { buildGenerateImageRequest: v104 } =
          await import("./aiImageApi.js"),
        v105 = await v104({
          prompt: "p",
          provider: "apimart",
          model: "apimart/qwen-image-2.0",
          mode: "standard",
          aspectRatio: "16:9",
          imageSize: "2K",
          inputUrls: [],
        });
      (strict["equal"](v105["body"]["model"], "qwen-image-2.0"),
        strict["equal"](v105["body"]["resolution"], "2K"),
        strict["equal"](v105["body"]["size"], "16:9"),
        strict["equal"](v105["body"]["n"], 1),
        strict["equal"](v105["body"]["official_fallback"], undefined),
        strict["equal"](
          v105["adapterTrace"]?.["executionId"],
          "apimart.model-api.qwen-image-2.v1",
        ));
      const v106 = await v104({
        prompt: "p",
        provider: "apimart",
        model: "apimart/qwen-image-2.0",
        mode: "pro",
        aspectRatio: "5:4",
        imageSize: "4K",
        batchSize: 9,
        inputUrls: [],
      });
      (strict["equal"](v106["body"]["model"], "qwen-image-2.0-pro"),
        strict["equal"](v106["body"]["resolution"], "1K"),
        strict["equal"](v106["body"]["size"], "4:3"),
        strict["equal"](v106["body"]["n"], 6));
      const v107 = await v104({
        prompt: "p",
        provider: "apimart",
        model: "apimart/qwen-image-2.0",
        mode: "standard",
        aspectRatio: "自适应",
        resolvedRatioLabel: "16:9",
        imageSize: "2K",
        batchSize: 2,
        inputUrls: [],
      });
      (strict["equal"](v107["body"]["model"], "qwen-image-2.0"),
        strict["equal"](v107["body"]["resolution"], "2K"),
        strict["equal"](v107["body"]["size"], "16:9"),
        strict["notEqual"](v107["body"]["size"], "自适应"),
        strict["notEqual"](v107["body"]["size"], "auto"),
        strict["equal"](v107["body"]["n"], 2));
    } finally {
      globalThis["fetch"] = v102;
    }
  }),
  test("aiImageApi:\x20apimart\x20z-image-turbo\x20uses\x20documented\x20body\x20without\x20n", async () => {
    const v108 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: "https://api.apimart.ai", apiKey: "k_apimart" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v109 } = await import("./configApi.js");
      v109();
      const { buildGenerateImageRequest: v110 } =
          await import("./aiImageApi.js"),
        v111 = await v110({
          prompt: "p",
          provider: "apimart",
          model: "apimart/z-image-turbo",
          aspectRatio: "16:9",
          imageSize: "2K",
          inputUrls: [],
        });
      (strict["equal"](v111["body"]["model"], "z-image-turbo"),
        strict["equal"](v111["body"]["resolution"], "2K"),
        strict["equal"](v111["body"]["size"], "16:9"),
        strict["equal"](v111["body"]["prompt_extend"], false),
        strict["equal"](v111["body"]["n"], undefined),
        strict["equal"](v111["body"]["image_urls"], undefined),
        strict["equal"](
          v111["adapterTrace"]?.["executionId"],
          "apimart.model-api.z-image-turbo.v1",
        ));
      const v112 = await v110({
        prompt: "p",
        provider: "apimart",
        model: "apimart/z-image-turbo",
        aspectRatio: "5:4",
        imageSize: "4K",
        batchSize: 4,
        prompt_extend: "true",
        inputUrls: ["https://img.example.com/ref.png"],
      });
      (strict["equal"](v112["body"]["model"], "z-image-turbo"),
        strict["equal"](v112["body"]["resolution"], "1K"),
        strict["equal"](v112["body"]["size"], "4:3"),
        strict["equal"](v112["body"]["prompt_extend"], true),
        strict["equal"](v112["body"]["n"], undefined),
        strict["equal"](v112["body"]["image_urls"], undefined));
      const v113 = await v110({
        prompt: "p",
        provider: "apimart",
        model: "apimart/z-image-turbo",
        aspectRatio: "自适应",
        resolvedRatioLabel: "16:9",
        imageSize: "2K",
        batchSize: 4,
        inputUrls: [],
      });
      (strict["equal"](v113["body"]["size"], "16:9"),
        strict["notEqual"](v113["body"]["size"], "自适应"),
        strict["notEqual"](v113["body"]["size"], "auto"),
        strict["equal"](v113["body"]["n"], undefined));
    } finally {
      globalThis["fetch"] = v108;
    }
  }),
  test("aiImageApi:\x20apimart\x20wan2.7-image\x20uses\x20documented\x20model,\x20inputs,\x20and\x20n", async () => {
    const v114 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: "https://api.apimart.ai", apiKey: "k_apimart" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v115 } = await import("./configApi.js");
      v115();
      const { buildGenerateImageRequest: v116 } =
          await import("./aiImageApi.js"),
        v117 = await v116({
          prompt: "p",
          provider: "apimart",
          model: "apimart/wan2.7-image",
          mode: "standard",
          aspectRatio: "16:9",
          imageSize: "4K",
          batchSize: 4,
          inputUrls: [],
        });
      (strict["equal"](v117["body"]["model"], "wan2.7-image"),
        strict["equal"](v117["body"]["resolution"], "2K"),
        strict["equal"](v117["body"]["size"], "16:9"),
        strict["equal"](v117["body"]["n"], 4),
        strict["equal"](v117["body"]["thinking_mode"], true),
        strict["equal"](v117["body"]["image_urls"], undefined),
        strict["equal"](
          v117["adapterTrace"]?.["executionId"],
          "apimart.model-api.wan2-7-image.v1",
        ));
      const v118 = await v116({
        prompt: "p",
        provider: "apimart",
        model: "apimart/wan2.7-image",
        mode: "pro",
        aspectRatio: "5:4",
        imageSize: "4K",
        thinking_mode: false,
        batchSize: 9,
        inputUrls: [],
      });
      (strict["equal"](v118["body"]["model"], "wan2.7-image-pro"),
        strict["equal"](v118["body"]["resolution"], "4K"),
        strict["equal"](v118["body"]["size"], "4:3"),
        strict["equal"](v118["body"]["n"], 4),
        strict["equal"](v118["body"]["thinking_mode"], false));
      const v119 = await v116({
        prompt: "p",
        provider: "apimart",
        model: "apimart/wan2.7-image",
        mode: "pro",
        aspectRatio: "自适应",
        resolvedRatioLabel: "9:16",
        imageSize: "4K",
        batchSize: 2,
        inputUrls: [
          "https://cdn.apimart.ai/ref-a.png",
          "https://cdn.apimart.ai/ref-b.png",
        ],
      });
      (strict["equal"](v119["body"]["model"], "wan2.7-image-pro"),
        strict["equal"](v119["body"]["resolution"], "2K"),
        strict["equal"](v119["body"]["size"], "9:16"),
        strict["equal"](v119["body"]["n"], 2),
        strict["equal"](v119["body"]["thinking_mode"], true),
        strict["deepEqual"](v119["body"]["image_urls"], [
          "https://cdn.apimart.ai/ref-a.png",
          "https://cdn.apimart.ai/ref-b.png",
        ]),
        strict["notEqual"](v119["body"]["size"], "自适应"),
        strict["notEqual"](v119["body"]["size"], "auto"));
    } finally {
      globalThis["fetch"] = v114;
    }
  }),
  test("aiImageApi: apimart nano-banana-2 supports extra size ratios", async () => {
    const v120 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: "https://api.apimart.ai", apiKey: "k_apimart" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v121 } = await import("./configApi.js");
      v121();
      const { buildGenerateImageRequest: v122 } =
          await import("./aiImageApi.js"),
        v123 = await v122({
          prompt: "p",
          provider: "apimart",
          model: "apimart/nano-banana-2",
          aspectRatio: "1:8",
          imageSize: "2K",
          inputUrls: [],
        });
      (strict["equal"](v123["body"]["model"], "gemini-3.1-flash-image-preview"),
        strict["equal"](v123["body"]["resolution"], "2K"),
        strict["equal"](v123["body"]["size"], "1:8"),
        strict["equal"](v123["body"]["n"], 1),
        strict["equal"](v123["body"]["google_search"], false),
        strict["equal"](v123["body"]["google_image_search"], false),
        strict["equal"](v123["body"]["official_fallback"], undefined),
        strict["equal"](v123["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v123["adapterTrace"]?.["executionId"],
          "apimart.model-api.nano-banana-2.v1",
        ));
      const v124 = await v122({
        prompt: "p",
        provider: "apimart",
        model: "apimart/nano-banana-2",
        mode: "official",
        aspectRatio: "16:9",
        imageSize: "4K",
        batchSize: 4,
        google_search: true,
        google_image_search: true,
        inputUrls: [],
      });
      (strict["equal"](
        v124["body"]["model"],
        "gemini-3.1-flash-image-preview-official",
      ),
        strict["equal"](v124["body"]["resolution"], "4K"),
        strict["equal"](v124["body"]["size"], "16:9"),
        strict["equal"](v124["body"]["n"], 1),
        strict["equal"](v124["body"]["google_search"], true),
        strict["equal"](v124["body"]["google_image_search"], true),
        strict["equal"](v124["body"]["official_fallback"], undefined));
      const v125 = await v122({
        prompt: "p",
        provider: "apimart",
        model: "apimart/nano-banana-2",
        aspectRatio: "1:1",
        imageSize: "2K",
        google_search: false,
        google_image_search: true,
        inputUrls: [],
      });
      (strict["equal"](v125["body"]["google_search"], true),
        strict["equal"](v125["body"]["google_image_search"], true));
      const v126 = await v122({
        prompt: "p",
        provider: "apimart",
        model: "apimart/nano-banana-2",
        aspectRatio: "1:1",
        imageSize: "0.5K",
        inputUrls: [],
      });
      (strict["equal"](v126["body"]["resolution"], "2K"),
        strict["equal"](v126["body"]["size"], "1:1"));
      const v127 = await v122({
        prompt: "p",
        provider: "apimart",
        model: "apimart/nano-banana-2",
        aspectRatio: "1:1",
        imageSize: "3K",
        inputUrls: [],
      });
      strict["equal"](v127["body"]["resolution"], "2K");
    } finally {
      globalThis["fetch"] = v120;
    }
  }),
  test("aiImageApi: apimart nano-banana-pro supports mode and fixed n=1", async () => {
    const v128 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: "https://api.apimart.ai", apiKey: "k_apimart" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v129 } = await import("./configApi.js");
      v129();
      const { buildGenerateImageRequest: v130 } =
          await import("./aiImageApi.js"),
        v131 = await v130({
          prompt: "p",
          provider: "apimart",
          model: "apimart/nano-banana-pro",
          mode: "official",
          aspectRatio: "21:9",
          imageSize: "4K",
          batchSize: 4,
          inputUrls: [],
        });
      (strict["equal"](
        v131["body"]["model"],
        "gemini-3-pro-image-preview-official",
      ),
        strict["equal"](v131["body"]["resolution"], "4K"),
        strict["equal"](v131["body"]["size"], "21:9"),
        strict["equal"](v131["body"]["n"], 1),
        strict["equal"](v131["body"]["official_fallback"], undefined),
        strict["equal"](
          v131["adapterTrace"]?.["executionId"],
          "apimart.model-api.nano-banana-pro.v1",
        ));
      const v132 = await v130({
        prompt: "p",
        provider: "apimart",
        model: "apimart/nano-banana-pro",
        aspectRatio: "1:1",
        imageSize: "3K",
        batchSize: 9,
        inputUrls: [],
      });
      (strict["equal"](v132["body"]["model"], "gemini-3-pro-image-preview"),
        strict["equal"](v132["body"]["resolution"], "2K"),
        strict["equal"](v132["body"]["n"], 1));
    } finally {
      globalThis["fetch"] = v128;
    }
  }),
  test("aiImageApi: apimart nano-banana supports official mode and 1K-only resolution", async () => {
    const v133 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: "https://api.apimart.ai", apiKey: "k_apimart" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v134 } = await import("./configApi.js");
      v134();
      const { buildGenerateImageRequest: v135 } =
          await import("./aiImageApi.js"),
        v136 = await v135({
          prompt: "p",
          provider: "apimart",
          model: "apimart/nano-banana-dot",
          mode: "official",
          aspectRatio: "21:9",
          imageSize: "4K",
          batchSize: 4,
          inputUrls: [],
        });
      (strict["equal"](
        v136["body"]["model"],
        "gemini-2.5-flash-image-preview-official",
      ),
        strict["equal"](v136["body"]["resolution"], "1K"),
        strict["equal"](v136["body"]["size"], "21:9"),
        strict["equal"](v136["body"]["n"], 1),
        strict["equal"](v136["body"]["official_fallback"], undefined),
        strict["equal"](
          v136["adapterTrace"]?.["executionId"],
          "apimart.model-api.nano-banana-dot.v1",
        ));
      const v137 = await v135({
        prompt: "p",
        provider: "apimart",
        model: "apimart/nano-banana-dot",
        aspectRatio: "1:1",
        imageSize: "3K",
        batchSize: 9,
        inputUrls: [],
      });
      (strict["equal"](v137["body"]["model"], "gemini-2.5-flash-image-preview"),
        strict["equal"](v137["body"]["resolution"], "1K"),
        strict["equal"](v137["body"]["n"], 1));
    } finally {
      globalThis["fetch"] = v133;
    }
  }),
  test("aiImageApi: apimart seedream request uses documented size/resolution", async () => {
    const v138 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          apimart: { apiUrl: "https://api.apimart.ai", apiKey: "k_apimart" },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v139 } = await import("./configApi.js");
      v139();
      const { buildGenerateImageRequest: v140 } =
          await import("./aiImageApi.js"),
        v141 = await v140({
          prompt: "p",
          provider: "apimart",
          model: "apimart/seedream-4.5",
          aspectRatio: "16:9",
          imageSize: "2K",
          batchSize: 4,
          inputUrls: [],
        });
      (strict["equal"](v141["url"], "/api/v2/proxy/image"),
        strict["equal"](v141["body"]["model"], "doubao-seedream-4.5"),
        strict["equal"](v141["body"]["size"], "16:9"),
        strict["equal"](v141["body"]["resolution"], "2K"),
        strict["equal"](v141["body"]["n"], 1),
        strict["equal"](v141["body"]["width"], undefined),
        strict["equal"](v141["body"]["height"], undefined));
      const v142 = await v140({
        prompt: "p",
        provider: "apimart",
        model: "apimart/seedream-4.0",
        aspectRatio: "9:21",
        imageSize: "1K",
        batchSize: 4,
        inputUrls: [],
      });
      (strict["equal"](v142["body"]["model"], "doubao-seedream-4.0"),
        strict["equal"](v142["body"]["size"], "9:21"),
        strict["equal"](v142["body"]["resolution"], "1K"),
        strict["equal"](v142["body"]["n"], 1));
      const v143 = await v140({
        prompt: "p",
        provider: "apimart",
        model: "apimart/seedream-5.0-lite",
        aspectRatio: "21:9",
        imageSize: "3K",
        batchSize: 4,
        inputUrls: [],
      });
      (strict["equal"](v143["body"]["model"], "doubao-seedream-5.0-lite"),
        strict["equal"](v143["body"]["size"], "21:9"),
        strict["equal"](v143["body"]["resolution"], "3K"),
        strict["equal"](v143["body"]["n"], 1));
    } finally {
      globalThis["fetch"] = v138;
    }
  }),
  test("aiImageApi: runninghub-model branch uses proxy/image", async () => {
    const v144 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: {
            apiUrl: "https://x/",
            apiKey: "k_rh",
            modelApiKey: "k_rhm",
          },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v145 } = await import("./configApi.js");
      v145();
      const { buildGenerateImageRequest: v146 } =
          await import("./aiImageApi.js"),
        v147 = await v146({
          prompt: "p",
          model: "runninghub-model/rhart-image-v1",
          inputUrls: [],
        });
      (strict["equal"](v147["url"], "/api/v2/proxy/image"),
        strict["ok"](
          String(v147["body"]["apiUrl"])["includes"](
            "/openapi/v2/rhart-image-v1/",
          ),
        ),
        strict["equal"](v147["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v147["adapterTrace"]?.["executionId"],
          "runninghub.model-api.rhart-image-v1.v1",
        ));
    } finally {
      globalThis["fetch"] = v144;
    }
  }),
  test("aiImageApi: runninghub-model gpt-image-2 无参考图走 text-to-image 且透传 resolution", async () => {
    const v148 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: {
            apiUrl: "https://x/",
            apiKey: "k_rh",
            modelApiKey: "k_rhm",
          },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v149 } = await import("./configApi.js");
      v149();
      const { buildGenerateImageRequest: v150 } =
          await import("./aiImageApi.js"),
        v151 = await v150({
          prompt: "p",
          model: "runninghub-model/rhart-image-g-2",
          imageSize: "1K",
          inputUrls: [],
        });
      (strict["equal"](v151["url"], "/api/v2/proxy/image"),
        strict["equal"](
          v151["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/rhart-image-g-2/text-to-image",
        ),
        strict["equal"](v151["body"]["resolution"], "1k"),
        strict["equal"](v151["body"]["imageUrls"], undefined),
        strict["equal"](v151["adapterTrace"]?.["source"], "manifest"));
    } finally {
      globalThis["fetch"] = v148;
    }
  }),
  test("aiImageApi: runninghub-model manifest image-to-image attaches uploaded URLs", async () => {
    const v152 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: {
            apiUrl: "https://x/",
            apiKey: "k_rh",
            modelApiKey: "k_rhm",
          },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v153 } = await import("./configApi.js");
      v153();
      const { buildGenerateImageRequest: v154 } =
          await import("./aiImageApi.js"),
        v155 = await v154({
          prompt: "p",
          model: "runninghub-model/rhart-image-n-g31-flash",
          inputUrls: ["https://www.runninghub.cn/input.png"],
          imageSize: "2K",
          aspectRatio: "1:4",
        });
      (strict["equal"](v155["url"], "/api/v2/proxy/image"),
        strict["equal"](
          v155["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/rhart-image-n-g31-flash/image-to-image",
        ),
        strict["deepEqual"](v155["body"]["imageUrls"], [
          "https://www.runninghub.cn/input.png",
        ]),
        strict["equal"](v155["body"]["apiKey"], "k_rhm"),
        strict["equal"](v155["body"]["resolution"], "2k"),
        strict["equal"](v155["body"]["aspectRatio"], "1:4"),
        strict["equal"](v155["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v155["adapterTrace"]?.["executionId"],
          "runninghub.model-api.rhart-image-n-g31-flash.v1",
        ));
    } finally {
      globalThis["fetch"] = v152;
    }
  }),
  test("aiImageApi:\x20runninghub-model\x20youchuan\x20uses\x20named\x20slot\x20request\x20body", async () => {
    const v156 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: {
            apiUrl: "https://x/",
            apiKey: "k_rh",
            modelApiKey: "k_rhm",
          },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v157 } = await import("./configApi.js");
      v157();
      const { buildGenerateImageRequest: v158 } =
          await import("./aiImageApi.js"),
        v159 = await v158({
          prompt: "p",
          model: "runninghub-model/youchuan-v81",
          inputUrlsBySlot: {
            imageUrl: "https://www.runninghub.cn/main.png",
            sref: "https://www.runninghub.cn/style.png",
          },
          aspectRatio: "3:4",
          quality: "4",
          iw: "2",
          sw: "300",
          hd: "true",
        });
      (strict["equal"](v159["url"], "/api/v2/proxy/image"),
        strict["equal"](
          v159["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81",
        ),
        strict["equal"](v159["body"]["apiKey"], "k_rhm"),
        strict["equal"](v159["body"]["resolution"], undefined),
        strict["equal"](v159["body"]["imageUrls"], undefined),
        strict["equal"](
          v159["body"]["imageUrl"],
          "https://www.runninghub.cn/main.png",
        ),
        strict["equal"](
          v159["body"]["sref"],
          "https://www.runninghub.cn/style.png",
        ),
        strict["equal"](v159["body"]["quality"], "4"),
        strict["equal"](v159["body"]["iw"], 2),
        strict["equal"](v159["body"]["sw"], 300),
        strict["equal"](v159["body"]["hd"], true));
      const v160 = await v158({
        prompt: "p",
        model: "runninghub-model/youchuan-v7",
        inputUrlsBySlot: {
          imageUrl: "https://www.runninghub.cn/v7-main.png",
          sref: "https://www.runninghub.cn/v7-style.png",
        },
        aspectRatio: "16:9",
        quality: "2",
        iw: "2",
        sw: "250",
        sv: "4",
        ow: "150",
        stop: "90",
        cw: "80",
        hd: "true",
        raw: "true",
        tile: "false",
      });
      (strict["equal"](
        v160["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7",
      ),
        strict["equal"](v160["body"]["resolution"], undefined),
        strict["equal"](v160["body"]["imageUrls"], undefined),
        strict["equal"](
          v160["body"]["imageUrl"],
          "https://www.runninghub.cn/v7-main.png",
        ),
        strict["equal"](
          v160["body"]["sref"],
          "https://www.runninghub.cn/v7-style.png",
        ),
        strict["equal"](v160["body"]["cref"], undefined),
        strict["equal"](v160["body"]["cw"], undefined),
        strict["equal"](v160["body"]["stop"], undefined),
        strict["equal"](v160["body"]["hd"], undefined),
        strict["equal"](v160["body"]["quality"], "2"),
        strict["equal"](v160["body"]["iw"], 2),
        strict["equal"](v160["body"]["sw"], 250),
        strict["equal"](v160["body"]["sv"], 4),
        strict["equal"](v160["body"]["ow"], 150),
        strict["equal"](v160["body"]["raw"], true),
        strict["equal"](v160["body"]["tile"], false));
    } finally {
      globalThis["fetch"] = v156;
    }
  }),
  test("aiImageApi: runninghub-model local input upload uses modelApiKey", async () => {
    const v161 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v162, v163 = {}) => {
        const v164 = String(v162);
        if (v164 === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://x/",
                apiKey: "k_rh",
                modelApiKey: "k_rhm",
              },
            },
          });
        if (v164 === "/local/rh-input.png")
          return makeBlobResponse("rh-local-image");
        if (v164["startsWith"]("/api/v2/proxy/upload?"))
          return (
            strict["equal"](
              v163["headers"]?.["Authorization"],
              "Bearer\x20k_rhm",
            ),
            makeJsonResponse({
              code: 0,
              data: {
                download_url: "https://www.runninghub.cn/uploaded/rh-input.png",
              },
            })
          );
        throw new Error("unexpected fetch url: " + v164);
      };
      const { clearApiConfig: v165 } = await import("./configApi.js");
      v165();
      const { buildGenerateImageRequest: v166 } =
          await import("./aiImageApi.js"),
        v167 = await v166({
          prompt: "p",
          model: "runninghub-model/rhart-image-n-g31-flash",
          inputUrls: ["/local/rh-input.png"],
          imageSize: "2K",
          aspectRatio: "1:1",
        });
      (strict["equal"](v167["body"]["apiKey"], "k_rhm"),
        strict["deepEqual"](v167["body"]["imageUrls"], [
          "https://www.runninghub.cn/uploaded/rh-input.png",
        ]));
    } finally {
      globalThis["fetch"] = v161;
    }
  }),
  test("aiImageApi:\x20runninghub-model\x20local\x20input\x20upload\x20failure\x20reports\x20provider\x20error", async () => {
    const v168 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v169, v170 = {}) => {
        const v171 = String(v169);
        if (v171 === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://x/",
                apiKey: "k_rh",
                modelApiKey: "k_rhm",
              },
            },
          });
        if (v171 === "/local/rh-bad-key.png")
          return makeBlobResponse("rh-local-image");
        if (v171["startsWith"]("/api/v2/proxy/upload?"))
          return (
            strict["equal"](v170["headers"]?.["Authorization"], "Bearer k_rhm"),
            makeJsonResponse({
              code: 401,
              errorMessage: "invalid model api key",
            })
          );
        throw new Error("unexpected\x20fetch\x20url:\x20" + v171);
      };
      const { clearApiConfig: v172 } = await import("./configApi.js");
      v172();
      const { buildGenerateImageRequest: v173 } =
        await import("./aiImageApi.js");
      await strict["rejects"](
        () =>
          v173({
            prompt: "p",
            model: "runninghub-model/rhart-image-n-g31-flash",
            inputUrls: ["/local/rh-bad-key.png"],
            imageSize: "2K",
            aspectRatio: "1:1",
          }),
        /RunningHUB .*invalid model api key.*401/,
      );
    } finally {
      globalThis["fetch"] = v168;
    }
  }),
  test("aiImageApi: runninghub-model does not fall back to workflow apiKey", async () => {
    const v174 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v175) => {
        const v176 = String(v175);
        if (v176 === "/api/config")
          return makeJsonResponse({
            providers: {
              runninghub: {
                apiUrl: "https://x/",
                apiKey: "k_rh_workflow_only",
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + v176);
      };
      const { clearApiConfig: v177 } = await import("./configApi.js");
      v177();
      const { buildGenerateImageRequest: v178 } =
        await import("./aiImageApi.js");
      await strict["rejects"](
        () =>
          v178({
            prompt: "p",
            model: "runninghub-model/rhart-image-n-g31-flash",
            inputUrls: ["https://www.runninghub.cn/input.png"],
            imageSize: "2K",
            aspectRatio: "1:1",
          }),
        /API Key/,
      );
    } finally {
      globalThis["fetch"] = v174;
    }
  }),
  test("aiImageApi:\x20runninghub-model\x20gpt-image-2\x20official\x20无参考图走官方\x20text-to-image", async () => {
    const v179 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: {
            apiUrl: "https://x/",
            apiKey: "k_rh",
            modelApiKey: "k_rhm",
          },
          grsai: { apiUrl: "https://api.grsai.example.com/", apiKey: "" },
        },
      });
      const { clearApiConfig: v180 } = await import("./configApi.js");
      v180();
      const { buildGenerateImageRequest: v181 } =
          await import("./aiImageApi.js"),
        v182 = await v181({
          prompt: "p",
          model: "runninghub-model/rhart-image-g-2-official",
          aspectRatio: "2：1",
          imageSize: "4K",
          inputUrls: [],
        });
      (strict["equal"](v182["url"], "/api/v2/proxy/image"),
        strict["equal"](
          v182["body"]["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image",
        ),
        strict["equal"](v182["body"]["aspectRatio"], "2:1"),
        strict["equal"](v182["body"]["resolution"], "4k"),
        strict["equal"](v182["body"]["quality"], "medium"),
        strict["equal"](v182["body"]["imageUrls"], undefined),
        strict["equal"](v182["adapterTrace"]?.["source"], "manifest"));
    } finally {
      globalThis["fetch"] = v179;
    }
  }),
  test("aiImageApi: runninghub-model suppressAspectRatio=true 时不透传 aspectRatio", async () => {
    const v183 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: {
            apiUrl: "https://x/",
            apiKey: "k_rh",
            modelApiKey: "k_rhm",
          },
        },
      });
      const { clearApiConfig: v184 } = await import("./configApi.js");
      v184();
      const { buildGenerateImageRequest: v185 } =
          await import("./aiImageApi.js"),
        v186 = await v185({
          prompt: "p",
          model: "runninghub-model/rhart-image-v1",
          aspectRatio: "16:9",
          suppressAspectRatio: true,
          inputUrls: [],
        });
      (strict["equal"](v186["url"], "/api/v2/proxy/image"),
        strict["equal"](v186["body"]["aspectRatio"], undefined),
        strict["equal"](v186["adapterTrace"]?.["source"], "manifest"));
    } finally {
      globalThis["fetch"] = v183;
    }
  }),
  test("aiImageApi: runninghub-model missing manifest rejects instead of legacy fallback", async () => {
    const v187 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: {
            apiUrl: "https://x/",
            apiKey: "k_rh",
            modelApiKey: "k_rhm",
          },
        },
      });
      const { clearApiConfig: v188 } = await import("./configApi.js");
      v188();
      const { buildGenerateImageRequest: v189 } =
        await import("./aiImageApi.js");
      await strict["rejects"](
        () =>
          v189({
            prompt: "p",
            model: "runninghub-model/unregistered-model",
            inputUrls: [],
          }),
        /RunningHub model API manifest missing/,
      );
    } finally {
      globalThis["fetch"] = v187;
    }
  }),
  test("aiImageApi: runninghubwf image workflow without manifest rejects", async () => {
    const v190 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: {
            apiUrl: "https://x/",
            apiKey: "k_rh",
            modelApiKey: "k_rhm",
          },
        },
      });
      const { clearApiConfig: v191 } = await import("./configApi.js");
      v191();
      const { buildGenerateImageRequest: v192 } =
        await import("./aiImageApi.js");
      await strict["rejects"](
        () =>
          v192({
            prompt: "p",
            model: "runninghub/123",
            inputUrls: [],
            rhInstanceType: "default",
            cameraAngle: { rotation: 0, pitch: 0, scale: 0.5 },
          }),
        /workflow manifest missing/,
      );
    } finally {
      globalThis["fetch"] = v190;
    }
  }),
  test("aiImageApi: RunningHub ai-app 请求用 header 携带 installId 且不污染远端 body", async () => {
    const v193 = globalThis["fetch"],
      v194 = globalThis["window"],
      v195 = [];
    try {
      ((globalThis["window"] = {
        __aicInstallId: "install-image-vip",
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v196, v197 = {}) => {
          const v198 = String(v196);
          if (v198 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: {
                  apiUrl: "https://www.runninghub.cn",
                  apiKey: "k_wf",
                  modelApiKey: "k_model",
                },
              },
            });
          if (v198 === "/api/v2/proxy/image") {
            const v199 = JSON["parse"](String(v197["body"] || "{}"));
            v195["push"]({ headers: v197["headers"] || {}, body: v199 });
            if (
              String(v199["apiUrl"] || "")["includes"](
                "/openapi/v2/run/ai-app/",
              )
            )
              return makeJsonResponse({
                code: 0,
                data: { taskId: "rh-image-vip-1" },
              });
            return makeJsonResponse({
              code: 0,
              data: {
                status: "SUCCESS",
                results: [{ url: "https://img.example.com/rh-image-vip.png" }],
              },
            });
          }
          if (v198 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-image-vip.png" });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v198);
        }));
      const { clearApiConfig: v200 } = await import("./configApi.js");
      v200();
      const { generateImage: v201 } = await import("./aiImageApi.js"),
        v202 = await v201({
          provider: "runninghubwf",
          model: "runninghub/1994718111704158209",
          prompt: "portrait",
          inputUrls: ["https://www.runninghub.cn/ref.png"],
          installId: "install-image-vip",
        });
      (strict["equal"](v202["localPath"], "output/rh-image-vip.png"),
        strict["equal"](
          v195[0]?.["headers"]?.["X-AIC-Install-Id"],
          "install-image-vip",
        ),
        strict["equal"](v195[0]?.["body"]?.["installId"], undefined),
        strict["equal"](
          v195[0]?.["body"]?.["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/run/ai-app/1994718111704158209",
        ));
    } finally {
      ((globalThis["fetch"] = v193), (globalThis["window"] = v194));
    }
  }),
  test("aiImageApi:\x20RunningHub\x20modelApi\x20请求用\x20header\x20携带\x20installId\x20且不污染厂商\x20body", async () => {
    const v203 = globalThis["fetch"],
      v204 = globalThis["window"],
      v205 = [];
    try {
      ((globalThis["window"] = {
        __aicInstallId: "install-model-api",
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v206, v207 = {}) => {
          const v208 = String(v206);
          if (v208 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: {
                  apiUrl: "https://www.runninghub.cn",
                  apiKey: "k_wf",
                  modelApiKey: "k_model",
                },
              },
            });
          if (v208 === "/api/v2/proxy/image") {
            const v209 = JSON["parse"](String(v207["body"] || "{}"));
            return (
              v205["push"]({ headers: v207["headers"] || {}, body: v209 }),
              makeJsonResponse({
                taskId: "rh-model-api-1",
                status: "SUCCESS",
                results: [{ url: "https://img.example.com/rh-model-api.png" }],
              })
            );
          }
          if (v208 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-model-api.png" });
          throw new Error("unexpected fetch url: " + v208);
        }));
      const { clearApiConfig: v210 } = await import("./configApi.js");
      v210();
      const { generateImage: v211 } = await import("./aiImageApi.js"),
        v212 = await v211({
          provider: "runninghub",
          model: "runninghub-model/youchuan-v81",
          prompt: "portrait",
          aspectRatio: "16:9",
          quality: "1",
        });
      (strict["equal"](v212["localPath"], "output/rh-model-api.png"),
        strict["equal"](
          v205[0]?.["headers"]?.["X-AIC-Install-Id"],
          "install-model-api",
        ),
        strict["equal"](v205[0]?.["body"]?.["installId"], undefined),
        strict["equal"](
          v205[0]?.["body"]?.["apiUrl"],
          "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81",
        ));
    } finally {
      ((globalThis["fetch"] = v203), (globalThis["window"] = v204));
    }
  }),
  test("aiImageApi:\x20RunningHub\x20ai-app\x20preserves\x2019-digit\x20numeric\x20taskId\x20for\x20persistence\x20and\x20query", async () => {
    const v213 = globalThis["fetch"],
      v214 = globalThis["setTimeout"],
      v215 = globalThis["window"],
      v216 = [],
      v217 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v218, v219, ...v220) =>
          v214(v218, Number(v219) > 5000 ? Number(v219) : 0, ...v220)),
        (globalThis["fetch"] = async (v221, v222 = {}) => {
          const v223 = String(v221);
          if (v223 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: {
                  apiUrl: "https://www.runninghub.cn",
                  apiKey: "k_wf",
                  modelApiKey: "k_model",
                },
              },
            });
          if (v223 === "/api/v2/proxy/image") {
            const v224 = JSON["parse"](String(v222["body"] || "{}")),
              v225 = String(v224["apiUrl"] || "");
            if (v225["includes"]("/openapi/v2/run/ai-app/2050306122774532097"))
              return makeTextResponse(
                '{"code":0,"data":{"taskId":2050557211150823426}}',
              );
            if (v225["includes"]("/openapi/v2/query"))
              return (
                v217["push"](String(v224["taskId"] || "")),
                makeJsonResponse({
                  code: 0,
                  data: {
                    status: "SUCCESS",
                    results: [
                      { url: "https://img.example.com/rh-qwen-final.png" },
                    ],
                  },
                })
              );
          }
          if (v223 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-qwen-final.png" });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v223);
        }));
      const { clearApiConfig: v226 } = await import("./configApi.js");
      v226();
      const { generateImage: v227 } = await import("./aiImageApi.js"),
        v228 = await v227(
          {
            provider: "runninghubwf",
            model: "runninghub/2050306122774532097",
            prompt: "edit",
            inputUrls: ["https://www.runninghub.cn/input.png"],
            imageSize: "1K",
            aspectRatio: "1:1",
          },
          { onTaskMeta: (v229) => v216["push"](v229) },
        );
      (strict["equal"](v216["length"], 1),
        strict["equal"](v216[0]["taskId"], "2050557211150823426"),
        strict["equal"](v217[0], "2050557211150823426"),
        strict["equal"](v228["localPath"], "output/rh-qwen-final.png"));
    } finally {
      ((globalThis["fetch"] = v213),
        (globalThis["setTimeout"] = v214),
        (globalThis["window"] = v215));
    }
  }),
  test("aiImageApi: runninghub-model async task calls onTaskMeta and supports resume", async () => {
    const v230 = globalThis["fetch"],
      v231 = globalThis["setTimeout"],
      v232 = globalThis["window"],
      v233 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v234, v235, ...v236) =>
          v231(v234, Number(v235) > 5000 ? Number(v235) : 0, ...v236)),
        (globalThis["fetch"] = async (v237, v238 = {}) => {
          const v239 = String(v237);
          if (v239 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: {
                  apiUrl: "https://x/",
                  apiKey: "k_rh",
                  modelApiKey: "k_rhm",
                },
              },
            });
          if (v239 === "/api/v2/proxy/image") {
            const v240 = JSON["parse"](String(v238["body"] || "{}")),
              v241 = String(v240["apiUrl"] || "");
            if (v241["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  results: [{ url: "https://img.example.com/final.png" }],
                },
              });
            return makeTextResponse(
              JSON["stringify"]({ status: "RUNNING", taskId: "task-image-1" }),
            );
          }
          if (v239 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/final.png" });
          throw new Error("unexpected fetch url: " + v239);
        }));
      const { clearApiConfig: v242 } = await import("./configApi.js");
      v242();
      const { generateImage: v243, resumeRunningHubImageTask: v244 } =
          await import("./aiImageApi.js"),
        v245 = {
          prompt: "p",
          model: "runninghub-model/rhart-image-v1",
          inputUrls: [],
        },
        v246 = await v243(v245, { onTaskMeta: (v247) => v233["push"](v247) });
      (strict["equal"](v233["length"], 1),
        strict["equal"](v233[0]["taskId"], "task-image-1"),
        strict["equal"](v233[0]["useOpenapiQuery"], true),
        strict["equal"](v246["localPath"], "output/final.png"),
        strict["equal"](v246["imageUrl"], "/output/final.png"));
      const v248 = await v244("task-image-2", v245);
      (strict["equal"](v248["localPath"], "output/final.png"),
        strict["equal"](v248["imageUrl"], "/output/final.png"));
    } finally {
      ((globalThis["fetch"] = v230),
        (globalThis["setTimeout"] = v231),
        (globalThis["window"] = v232));
    }
  }),
  test("aiImageApi:\x20runninghub-model\x20poll\x20timeout\x20keeps\x20polling\x20task\x20instead\x20of\x20failing", async () => {
    const v249 = globalThis["fetch"],
      v250 = globalThis["setTimeout"],
      v251 = globalThis["window"];
    let v252 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v253, v254, ...v255) =>
          v250(v253, Number(v254) > 5000 ? Number(v254) : 0, ...v255)),
        (globalThis["fetch"] = async (v256, v257 = {}) => {
          const v258 = String(v256);
          if (v258 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: {
                  apiUrl: "https://x/",
                  apiKey: "k_rh",
                  modelApiKey: "k_rhm",
                },
              },
            });
          if (v258 === "/api/v2/proxy/image") {
            const v259 = JSON["parse"](String(v257["body"] || "{}")),
              v260 = String(v259["apiUrl"] || "");
            if (v260["includes"]("/openapi/v2/query")) {
              v252 += 1;
              if (v252 === 1) {
                const v261 = new Error("The operation was aborted.");
                v261["name"] = "AbortError";
                throw v261;
              }
              return makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  results: [
                    { url: "https://img.example.com/final-after-timeout.png" },
                  ],
                },
              });
            }
            return makeTextResponse(
              JSON["stringify"]({
                status: "RUNNING",
                taskId: "task-image-timeout-1",
              }),
            );
          }
          if (v258 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/final-after-timeout.png" });
          throw new Error("unexpected fetch url: " + v258);
        }));
      const { clearApiConfig: v262 } = await import("./configApi.js");
      v262();
      const { generateImage: v263 } = await import("./aiImageApi.js"),
        v264 = await v263({
          prompt: "p",
          model: "runninghub-model/rhart-image-v1",
          inputUrls: [],
        });
      (strict["equal"](v252, 2),
        strict["equal"](v264["localPath"], "output/final-after-timeout.png"));
    } finally {
      ((globalThis["fetch"] = v249),
        (globalThis["setTimeout"] = v250),
        (globalThis["window"] = v251));
    }
  }),
  test("aiImageApi: runninghub-model polls when create response has task_id and submitted", async () => {
    const v265 = globalThis["fetch"],
      v266 = globalThis["setTimeout"],
      v267 = globalThis["window"],
      v268 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v269, v270, ...v271) =>
          v266(v269, Number(v270) > 5000 ? Number(v270) : 0, ...v271)),
        (globalThis["fetch"] = async (v272, v273 = {}) => {
          const v274 = String(v272);
          if (v274 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: {
                  apiUrl: "https://www.runninghub.cn",
                  apiKey: "k_wf",
                  modelApiKey: "k_model",
                },
              },
            });
          if (v274 === "/api/v2/proxy/image") {
            const v275 = JSON["parse"](String(v273["body"] || "{}")),
              v276 = String(v275["apiUrl"] || "");
            if (v276["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  results: [
                    { url: "https://img.example.com/rh-submitted-final.png" },
                  ],
                },
              });
            return makeTextResponse(
              JSON["stringify"]({
                task_id: "2044473210820767746",
                status: "submitted",
                source: "body-probe",
              }),
            );
          }
          if (v274 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-submitted-final.png" });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v274);
        }));
      const { clearApiConfig: v277 } = await import("./configApi.js");
      v277();
      const { generateImage: v278 } = await import("./aiImageApi.js"),
        v279 = await v278(
          {
            provider: "runninghub",
            model: "runninghub-model/rhart-image-v1",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v280) => v268["push"](v280) },
        );
      (strict["equal"](v268["length"], 1),
        strict["equal"](v268[0]["taskId"], "2044473210820767746"),
        strict["equal"](v279["localPath"], "output/rh-submitted-final.png"),
        strict["equal"](v279["imageUrl"], "/output/rh-submitted-final.png"));
    } finally {
      ((globalThis["fetch"] = v265),
        (globalThis["setTimeout"] = v266),
        (globalThis["window"] = v267));
    }
  }),
  test("aiImageApi: runninghubwf resume keeps polling submitted array snapshots until success", async () => {
    const v281 = globalThis["fetch"],
      v282 = globalThis["setTimeout"],
      v283 = globalThis["window"];
    let v284 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v285, v286, ...v287) =>
          v282(v285, Number(v286) > 5000 ? Number(v286) : 0, ...v287)),
        (globalThis["fetch"] = async (v288, v289 = {}) => {
          const v290 = String(v288);
          if (v290 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: {
                  apiUrl: "https://www.runninghub.cn",
                  apiKey: "k_wf",
                  modelApiKey: "k_model",
                },
              },
            });
          if (v290 === "/api/v2/runninghubwf/query") {
            v284 += 1;
            if (v284 === 1)
              return makeJsonResponse({
                code: 0,
                data: [{ taskId: "wf-task-submitted-1", status: "submitted" }],
              });
            return makeJsonResponse({
              code: 0,
              data: [
                {
                  taskId: "wf-task-submitted-1",
                  status: "succeeded",
                  url: "https://img.example.com/wf-submitted-final.png",
                },
              ],
            });
          }
          if (v290 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/wf-submitted-final.png" });
          throw new Error("unexpected fetch url: " + v290);
        }));
      const { clearApiConfig: v291 } = await import("./configApi.js");
      v291();
      const { resumeRunningHubImageTask: v292 } =
          await import("./aiImageApi.js"),
        v293 = await v292(
          "wf-task-submitted-1",
          {
            provider: "runninghubwf",
            model: "runninghub-query-snapshot-test",
            prompt: "cat",
            inputUrls: [],
          },
          { useOpenapiQuery: false, maxPolls: 2, pollIntervalMs: 0 },
        );
      (strict["equal"](v284, 2),
        strict["equal"](v293["localPath"], "output/wf-submitted-final.png"),
        strict["equal"](v293["imageUrl"], "/output/wf-submitted-final.png"));
    } finally {
      ((globalThis["fetch"] = v281),
        (globalThis["setTimeout"] = v282),
        (globalThis["window"] = v283));
    }
  }),
  test("aiImageApi: runninghubwf 查询数组快照仅含 fileUrl 时也应识别为已出图", async () => {
    const v294 = globalThis["fetch"],
      v295 = globalThis["setTimeout"],
      v296 = globalThis["window"];
    let v297 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v298, v299, ...v300) =>
          v295(v298, Number(v299) > 5000 ? Number(v299) : 0, ...v300)),
        (globalThis["fetch"] = async (v301, v302 = {}) => {
          const v303 = String(v301);
          if (v303 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: {
                  apiUrl: "https://www.runninghub.cn",
                  apiKey: "k_wf",
                  modelApiKey: "k_model",
                },
              },
            });
          if (v303 === "/api/v2/runninghubwf/query") {
            v297 += 1;
            if (v297 === 1)
              return makeJsonResponse({
                code: 0,
                data: [
                  {
                    fileUrl: "https://img.example.com/wf-fileurl-final.png",
                    fileType: "png",
                    nodeId: "521",
                  },
                ],
              });
          }
          if (v303 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/wf-fileurl-final.png" });
          throw new Error("unexpected fetch url: " + v303);
        }));
      const { clearApiConfig: v304 } = await import("./configApi.js");
      v304();
      const { resumeRunningHubImageTask: v305 } =
          await import("./aiImageApi.js"),
        v306 = await v305("wf-task-fileurl-1", {
          provider: "runninghubwf",
          model: "runninghub-query-fileurl-test",
        });
      (strict["equal"](v297, 1),
        strict["equal"](v306["localPath"], "output/wf-fileurl-final.png"),
        strict["equal"](v306["imageUrl"], "/output/wf-fileurl-final.png"));
    } finally {
      ((globalThis["fetch"] = v294),
        (globalThis["setTimeout"] = v295),
        (globalThis["window"] = v296));
    }
  }),
  test("aiImageApi: resumeRunningHubImageTask returns CANCELLED when aborted", async () => {
    const v307 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          runninghub: {
            apiUrl: "https://x/",
            apiKey: "k_rh",
            modelApiKey: "k_rhm",
          },
        },
      });
      const { clearApiConfig: v308 } = await import("./configApi.js");
      v308();
      const { resumeRunningHubImageTask: v309 } =
          await import("./aiImageApi.js"),
        v310 = new AbortController();
      (v310["abort"](),
        await strict["rejects"](
          () =>
            v309(
              "task-image-abort",
              { model: "runninghub-model/rhart-image-v1" },
              { signal: v310["signal"] },
            ),
          (v311) => v311?.["message"] === "CANCELLED",
        ));
    } finally {
      globalThis["fetch"] = v307;
    }
  }),
  test("aiImageApi:\x20RunningHub\x20OpenAPI\x20softTimeout\x20返回\x20pending\x20而不是失败", async () => {
    const v312 = globalThis["fetch"];
    let v313 = 0;
    try {
      globalThis["fetch"] = async (v314, v315 = {}) => {
        const v316 = String(v314);
        if (v316 === "/api/v2/proxy/image") {
          const v317 = JSON["parse"](String(v315["body"] || "{}"));
          return (
            strict["ok"](
              String(v317["apiUrl"] || "")["includes"]("/openapi/v2/query"),
            ),
            (v313 += 1),
            makeJsonResponse({
              code: 0,
              data: { taskId: "rh-pending-1", status: "RUNNING" },
            })
          );
        }
        throw new Error("unexpected fetch url: " + v316);
      };
      const { clearApiConfig: v318 } = await import("./configApi.js");
      v318();
      const { resumeRunningHubImageTask: v319 } =
          await import("./aiImageApi.js"),
        v320 = await v319(
          "rh-pending-1",
          {
            provider: "runninghubwf",
            model: "runninghub/2044874075721441281",
            apiKey: "k_rh",
          },
          {
            useOpenapiQuery: true,
            softTimeout: true,
            maxPolls: 2,
            pollIntervalMs: 0,
          },
        );
      (strict["equal"](v313, 2),
        strict["deepEqual"](v320, {
          pending: true,
          taskId: "rh-pending-1",
          status: "running",
          message: "任务仍在 RunningHub 生成中",
        }));
    } finally {
      globalThis["fetch"] = v312;
    }
  }),
  test("aiImageApi: RunningHub OpenAPI 804/813 继续轮询直到成功", async () => {
    const v321 = globalThis["fetch"],
      v322 = globalThis["window"];
    let v323 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v324, v325 = {}) => {
          const v326 = String(v324);
          if (v326 === "/api/v2/proxy/image") {
            const v327 = JSON["parse"](String(v325["body"] || "{}"));
            (strict["ok"](
              String(v327["apiUrl"] || "")["includes"]("/openapi/v2/query"),
            ),
              (v323 += 1));
            if (v323 === 1)
              return makeJsonResponse({ code: 804, msg: "运行中" });
            if (v323 === 2)
              return makeJsonResponse({ code: 813, msg: "排队中" });
            return makeJsonResponse({
              code: 0,
              data: {
                status: "SUCCESS",
                results: [
                  { url: "https://img.example.com/rh-openapi-final.png" },
                ],
              },
            });
          }
          if (v326 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/rh-openapi-final.png" });
          throw new Error("unexpected fetch url: " + v326);
        }));
      const { clearApiConfig: v328 } = await import("./configApi.js");
      v328();
      const { resumeRunningHubImageTask: v329 } =
          await import("./aiImageApi.js"),
        v330 = await v329(
          "rh-openapi-code-1",
          {
            provider: "runninghubwf",
            model: "runninghub/2044874075721441281",
            apiKey: "k_rh",
          },
          { useOpenapiQuery: true, maxPolls: 3, pollIntervalMs: 0 },
        );
      (strict["equal"](v323, 3),
        strict["equal"](v330["localPath"], "output/rh-openapi-final.png"),
        strict["equal"](v330["imageUrl"], "/output/rh-openapi-final.png"));
    } finally {
      ((globalThis["fetch"] = v321), (globalThis["window"] = v322));
    }
  }),
  test("aiImageApi:\x20RunningHub\x20OpenAPI\x20SUCCESS\x20无图时继续轮询下一轮", async () => {
    const v331 = globalThis["fetch"],
      v332 = globalThis["window"];
    let v333 = 0,
      v334 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v335, v336 = {}) => {
          const v337 = String(v335);
          if (v337 === "/api/v2/proxy/image") {
            v333 += 1;
            if (v333 === 1)
              return makeJsonResponse({
                code: 0,
                data: { status: "SUCCESS", results: [] },
              });
            return makeJsonResponse({
              code: 0,
              data: {
                status: "SUCCESS",
                results: [
                  { url: "https://img.example.com/rh-delayed-url.png" },
                ],
              },
            });
          }
          if (v337 === "/api/v2/save_output_from_url")
            return (
              (v334 += 1),
              makeJsonResponse({ path: "output/rh-delayed-url.png" })
            );
          throw new Error("unexpected fetch url: " + v337);
        }));
      const { clearApiConfig: v338 } = await import("./configApi.js");
      v338();
      const { resumeRunningHubImageTask: v339 } =
          await import("./aiImageApi.js"),
        v340 = await v339(
          "rh-delayed-url-1",
          {
            provider: "runninghubwf",
            model: "runninghub/2044874075721441281",
            apiKey: "k_rh",
          },
          { useOpenapiQuery: true, maxPolls: 2, pollIntervalMs: 0 },
        );
      (strict["equal"](v333, 2),
        strict["equal"](v334, 1),
        strict["equal"](v340["localPath"], "output/rh-delayed-url.png"));
    } finally {
      ((globalThis["fetch"] = v331), (globalThis["window"] = v332));
    }
  }),
  test("aiImageApi:\x20same\x20RunningHub\x20image\x20resume\x20is\x20single-flight", async () => {
    const v341 = globalThis["fetch"],
      v342 = globalThis["window"];
    let v343 = 0,
      v344 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v345, v346 = {}) => {
          const v347 = String(v345);
          if (v347 === "/api/v2/proxy/image")
            return (
              (v343 += 1),
              await Promise["resolve"](),
              makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  results: [
                    { url: "https://img.example.com/rh-single-flight.png" },
                  ],
                },
              })
            );
          if (v347 === "/api/v2/save_output_from_url")
            return (
              (v344 += 1),
              await Promise["resolve"](),
              makeJsonResponse({ path: "output/rh-single-flight.png" })
            );
          throw new Error("unexpected fetch url: " + v347);
        }));
      const { clearApiConfig: v348 } = await import("./configApi.js");
      v348();
      const { resumeRunningHubImageTask: v349 } =
          await import("./aiImageApi.js"),
        v350 = {
          provider: "runninghubwf",
          model: "runninghub/2044874075721441281",
          apiKey: "k_rh",
        },
        v351 = { useOpenapiQuery: true, maxPolls: 1, pollIntervalMs: 0 },
        [v352, v353] = await Promise["all"]([
          v349("rh-single-flight-1", v350, v351),
          v349("rh-single-flight-1", v350, v351),
        ]);
      (strict["equal"](v343, 1),
        strict["equal"](v344, 1),
        strict["equal"](v352["localPath"], "output/rh-single-flight.png"),
        strict["equal"](v353["localPath"], "output/rh-single-flight.png"));
    } finally {
      ((globalThis["fetch"] = v341), (globalThis["window"] = v342));
    }
  }),
  test("aiImageApi: RunningHub OpenAPI 明确失败时 softTimeout 也应抛错", async () => {
    const v354 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v355) => {
        const v356 = String(v355);
        if (v356 === "/api/v2/proxy/image")
          return makeJsonResponse({
            code: 0,
            data: {
              taskId: "rh-failed-1",
              status: "FAILED",
              message: "执行失败",
            },
          });
        throw new Error("unexpected fetch url: " + v356);
      };
      const { clearApiConfig: v357 } = await import("./configApi.js");
      v357();
      const { resumeRunningHubImageTask: v358 } =
        await import("./aiImageApi.js");
      await strict["rejects"](
        () =>
          v358(
            "rh-failed-1",
            {
              provider: "runninghubwf",
              model: "runninghub/2044874075721441281",
              apiKey: "k_rh",
            },
            {
              useOpenapiQuery: true,
              softTimeout: true,
              maxPolls: 2,
              pollIntervalMs: 0,
            },
          ),
        (v359) => String(v359?.["message"] || "")["includes"]("执行失败"),
      );
    } finally {
      globalThis["fetch"] = v354;
    }
  }),
  test("aiImageApi:\x20dreamina\x20image\x20submit\x20calls\x20onTaskMeta\x20and\x20supports\x20resumeDreaminaImageTask", async () => {
    const v360 = globalThis["fetch"],
      v361 = globalThis["setTimeout"],
      v362 = [];
    let v363 = 0;
    try {
      ((globalThis["setTimeout"] = (v364, v365, ...v366) =>
        v361(v364, Number(v365) > 5000 ? Number(v365) : 0, ...v366)),
        (globalThis["fetch"] = async (v367, v368 = {}) => {
          const v369 = String(v367);
          if (v369 === "/api/config")
            return makeJsonResponse({ providers: {} });
          if (v369 === "/api/v2/dreamina/text2image")
            return makeJsonResponse({ success: true, submitId: "sid-dm-1" });
          if (
            v369["startsWith"]("/api/v2/dreamina/query_result?") &&
            v369["includes"]("submitId=sid-dm-1")
          )
            return makeJsonResponse({
              success: true,
              submitId: "sid-dm-1",
              status: "success",
              outputs: [{ localPath: "output/dreamina/img-1.png" }],
            });
          if (
            v369["startsWith"]("/api/v2/dreamina/query_result?") &&
            v369["includes"]("submitId=sid-dm-2")
          )
            return (
              (v363 += 1),
              await Promise["resolve"](),
              makeJsonResponse({
                success: true,
                submitId: "sid-dm-2",
                status: "success",
                outputs: [{ localPath: "output/dreamina/img-2.png" }],
              })
            );
          throw new Error("unexpected fetch url: " + v369);
        }));
      const { clearApiConfig: v370 } = await import("./configApi.js");
      v370();
      const { generateImage: v371, resumeDreaminaImageTask: v372 } =
          await import("./aiImageApi.js"),
        v373 = {
          provider: "dreamina",
          model: "dreamina/4.5",
          prompt: "cat",
          inputUrls: [],
          aspectRatio: "1:1",
          imageSize: "2K",
        },
        v374 = await v371(v373, { onTaskMeta: (v375) => v362["push"](v375) });
      (strict["equal"](v362["length"], 1),
        strict["equal"](v362[0]["taskId"], "sid-dm-1"),
        strict["equal"](v362[0]["provider"], "dreamina"),
        strict["equal"](v362[0]["kind"], "image"),
        strict["equal"](v374["localPath"], "output/dreamina/img-1.png"),
        strict["equal"](v374["imageUrl"], "/output/dreamina/img-1.png"));
      const [v376, v377] = await Promise["all"]([
        v372("sid-dm-2", v373),
        v372("sid-dm-2", v373),
      ]);
      (strict["equal"](v363, 1),
        strict["equal"](v376["localPath"], "output/dreamina/img-2.png"),
        strict["equal"](v376["imageUrl"], "/output/dreamina/img-2.png"),
        strict["equal"](v377["localPath"], "output/dreamina/img-2.png"));
    } finally {
      ((globalThis["fetch"] = v360), (globalThis["setTimeout"] = v361));
    }
  }),
  test("aiImageApi: apimart async task calls onTaskMeta and supports resumeAsyncImageTask", async () => {
    const v378 = globalThis["fetch"],
      v379 = globalThis["setTimeout"],
      v380 = globalThis["window"],
      v381 = [],
      v382 = [];
    let v383 = false,
      v384 = 0,
      v385 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v386, v387, ...v388) =>
          v379(v386, Number(v387) > 5000 ? Number(v387) : 0, ...v388)),
        (globalThis["fetch"] = async (v389, v390 = {}) => {
          const v391 = String(v389);
          if (v391 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: { apiUrl: "https://api.grsai.example.com", apiKey: "" },
              },
            });
          if (v391 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                data: [{ task_id: "task-apimart-1", status: "submitted" }],
              }),
            );
          if (v391["startsWith"]("/api/v2/proxy/task?"))
            return (
              v382["push"](v391),
              v383 && ((v384 += 1), await Promise["resolve"]()),
              makeJsonResponse({
                status: "success",
                results: [{ url: "https://img.example.com/apimart-final.png" }],
              })
            );
          if (v391 === "/api/v2/save_output_from_url")
            return (
              v383 && ((v385 += 1), await Promise["resolve"]()),
              makeJsonResponse({ path: "output/apimart-final.png" })
            );
          throw new Error("unexpected fetch url: " + v391);
        }));
      const { clearApiConfig: v392 } = await import("./configApi.js");
      v392();
      const { generateImage: v393, resumeAsyncImageTask: v394 } =
          await import("./aiImageApi.js"),
        v395 = {
          provider: "apimart",
          model: "apimart/nano-banana-2",
          prompt: "cat",
          inputUrls: [],
        },
        v396 = await v393(v395, { onTaskMeta: (v397) => v381["push"](v397) });
      (strict["equal"](v381["length"], 1),
        strict["equal"](v381[0]["taskId"], "task-apimart-1"),
        strict["equal"](v381[0]["provider"], "apimart"),
        strict["equal"](v381[0]["kind"], "image"),
        strict["equal"](v396["localPath"], "output/apimart-final.png"),
        strict["equal"](v396["imageUrl"], "/output/apimart-final.png"),
        (v383 = true));
      const [v398, v399] = await Promise["all"]([
        v394("task-apimart-2", v395),
        v394("task-apimart-2", v395),
      ]);
      (strict["equal"](v384, 1),
        strict["equal"](v385, 1),
        strict["equal"](v398["localPath"], "output/apimart-final.png"),
        strict["equal"](v398["imageUrl"], "/output/apimart-final.png"),
        strict["equal"](v399["localPath"], "output/apimart-final.png"),
        strict["ok"](
          v382["every"]((v400) => v400["includes"]("%3Flanguage%3Dzh")),
        ));
    } finally {
      ((globalThis["fetch"] = v378),
        (globalThis["setTimeout"] = v379),
        (globalThis["window"] = v380));
    }
  }),
  test("aiImageApi: apimart Nano banana repeats batchSize with fixed request n=1", async () => {
    const v401 = globalThis["fetch"],
      v402 = globalThis["setTimeout"],
      v403 = globalThis["window"],
      v404 = [];
    let v405 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v406, v407, ...v408) =>
          v402(v406, Number(v407) > 5000 ? Number(v407) : 0, ...v408)),
        (globalThis["fetch"] = async (v409, v410 = {}) => {
          const v411 = String(v409);
          if (v411 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: { apiUrl: "https://api.grsai.example.com", apiKey: "" },
              },
            });
          if (v411 === "/api/v2/proxy/image") {
            const v412 = JSON["parse"](String(v410["body"] || "{}"));
            v404["push"](v412);
            const v413 = "task-apimart-pro-n4-" + v404["length"];
            return makeTextResponse(
              JSON["stringify"]({
                data: [{ task_id: v413, status: "submitted" }],
              }),
            );
          }
          if (v411["startsWith"]("/api/v2/proxy/task?")) {
            const v414 = getProxyTaskApiUrl(v411),
              v415 = v414["match"](
                /^https:\/\/api\.apimart\.ai\/v1\/tasks\/task-apimart-pro-n4-(\d+)\?language=zh$/,
              );
            strict["ok"](v415);
            const v416 = v415[1];
            return makeJsonResponse({
              status: "success",
              results: [
                {
                  url:
                    "https://img.example.com/apimart-pro-n4-" + v416 + ".png",
                },
              ],
            });
          }
          if (v411 === "/api/v2/save_output_from_url")
            return (
              (v405 += 1),
              makeJsonResponse({
                path: "output/apimart-pro-n4-" + v405 + ".png",
              })
            );
          throw new Error("unexpected fetch url: " + v411);
        }));
      const { clearApiConfig: v417 } = await import("./configApi.js");
      v417();
      const { generateImage: v418 } = await import("./aiImageApi.js"),
        v419 = await v418({
          provider: "apimart",
          model: "apimart/nano-banana-pro",
          prompt: "dog",
          mode: "standard",
          imageSize: "2K",
          aspectRatio: "1:1",
          batchSize: 4,
          inputUrls: [],
        });
      (strict["equal"](v404["length"], 4),
        strict["deepEqual"](
          v404["map"]((v420) => v420["model"]),
          [
            "gemini-3-pro-image-preview",
            "gemini-3-pro-image-preview",
            "gemini-3-pro-image-preview",
            "gemini-3-pro-image-preview",
          ],
        ),
        strict["deepEqual"](
          v404["map"]((v421) => v421["n"]),
          [1, 1, 1, 1],
        ),
        strict["equal"](v419?.["isBatch"], true),
        strict["equal"](v419?.["images"]?.["length"], 4),
        strict["equal"](v405, 4));
    } finally {
      ((globalThis["fetch"] = v401),
        (globalThis["setTimeout"] = v402),
        (globalThis["window"] = v403));
    }
  }),
  test("aiImageApi: apimart gpt-image-2 repeats batchSize with fixed request n=1", async () => {
    const v422 = globalThis["fetch"],
      v423 = globalThis["window"],
      v424 = [];
    let v425 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v426, v427 = {}) => {
          const v428 = String(v426);
          if (v428 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: { apiUrl: "https://api.grsai.example.com", apiKey: "" },
              },
            });
          if (v428 === "/api/v2/proxy/image") {
            const v429 = JSON["parse"](String(v427["body"] || "{}"));
            return (
              v424["push"](v429),
              makeTextResponse(
                JSON["stringify"]({
                  results: Array["from"]({ length: 1 }, (v430, v431) => ({
                    url:
                      "https://img.example.com/apimart-" +
                      v429["model"] +
                      "-" +
                      v424["length"] +
                      "-" +
                      (v431 + 1) +
                      ".png",
                  })),
                }),
              )
            );
          }
          if (v428 === "/api/v2/save_output_from_url")
            return (
              (v425 += 1),
              makeJsonResponse({
                path: "output/apimart-gpt-image-2-" + v425 + ".png",
              })
            );
          throw new Error("unexpected\x20fetch\x20url:\x20" + v428);
        }));
      const { clearApiConfig: v432 } = await import("./configApi.js");
      v432();
      const { generateImage: v433 } = await import("./aiImageApi.js"),
        v434 = await v433({
          provider: "apimart",
          model: "apimart/gpt-image-2",
          prompt: "dog",
          mode: "standard",
          imageSize: "2K",
          aspectRatio: "1:1",
          batchSize: 4,
          inputUrls: [],
        });
      (strict["equal"](v424["length"], 4),
        strict["deepEqual"](
          v424["map"]((v435) => v435["model"]),
          ["gpt-image-2", "gpt-image-2", "gpt-image-2", "gpt-image-2"],
        ),
        strict["deepEqual"](
          v424["map"]((v436) => v436["n"]),
          [1, 1, 1, 1],
        ),
        strict["equal"](v434?.["isBatch"], true),
        strict["equal"](v434?.["images"]?.["length"], 4),
        strict["equal"](v425, 4),
        (v424["length"] = 0),
        (v425 = 0));
      const v437 = await v433({
        provider: "apimart",
        model: "apimart/gpt-image-2",
        prompt: "dog",
        mode: "official",
        imageSize: "2K",
        aspectRatio: "1:1",
        batchSize: 4,
        inputUrls: [],
      });
      (strict["equal"](v424["length"], 4),
        strict["deepEqual"](
          v424["map"]((v438) => v438["model"]),
          [
            "gpt-image-2-official",
            "gpt-image-2-official",
            "gpt-image-2-official",
            "gpt-image-2-official",
          ],
        ),
        strict["deepEqual"](
          v424["map"]((v439) => v439["n"]),
          [1, 1, 1, 1],
        ),
        strict["equal"](v437?.["isBatch"], true),
        strict["equal"](v437?.["images"]?.["length"], 4),
        strict["equal"](v425, 4));
    } finally {
      ((globalThis["fetch"] = v422), (globalThis["window"] = v423));
    }
  }),
  test("aiImageApi: apimart qwen-image-2.0 submits provider n once", async () => {
    const v440 = globalThis["fetch"],
      v441 = globalThis["window"],
      v442 = [];
    let v443 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v444, v445 = {}) => {
          const v446 = String(v444);
          if (v446 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: { apiUrl: "https://api.grsai.example.com", apiKey: "" },
              },
            });
          if (v446 === "/api/v2/proxy/image") {
            const v447 = JSON["parse"](String(v445["body"] || "{}"));
            return (
              v442["push"](v447),
              makeTextResponse(
                JSON["stringify"]({
                  results: Array["from"](
                    { length: v447["n"] },
                    (v448, v449) => ({
                      url:
                        "https://img.example.com/apimart-qwen-" +
                        (v449 + 1) +
                        ".png",
                    }),
                  ),
                }),
              )
            );
          }
          if (v446 === "/api/v2/save_output_from_url")
            return (
              (v443 += 1),
              makeJsonResponse({ path: "output/apimart-qwen-" + v443 + ".png" })
            );
          throw new Error("unexpected fetch url: " + v446);
        }));
      const { clearApiConfig: v450 } = await import("./configApi.js");
      v450();
      const { generateImage: v451 } = await import("./aiImageApi.js"),
        v452 = await v451({
          provider: "apimart",
          model: "apimart/qwen-image-2.0",
          prompt: "dog",
          mode: "pro",
          imageSize: "2K",
          aspectRatio: "16:9",
          batchSize: 4,
          inputUrls: [],
        });
      (strict["equal"](v442["length"], 1),
        strict["equal"](v442[0]?.["model"], "qwen-image-2.0-pro"),
        strict["equal"](v442[0]?.["resolution"], "2K"),
        strict["equal"](v442[0]?.["size"], "16:9"),
        strict["equal"](v442[0]?.["n"], 4),
        strict["equal"](v452?.["isBatch"], true),
        strict["equal"](v452?.["images"]?.["length"], 4),
        strict["equal"](v443, 4));
    } finally {
      ((globalThis["fetch"] = v440), (globalThis["window"] = v441));
    }
  }),
  test("aiImageApi:\x20apimart\x20z-image-turbo\x20repeats\x20batchSize\x20without\x20n", async () => {
    const v453 = globalThis["fetch"],
      v454 = globalThis["window"],
      v455 = [];
    let v456 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v457, v458 = {}) => {
          const v459 = String(v457);
          if (v459 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: { apiUrl: "https://api.grsai.example.com", apiKey: "" },
              },
            });
          if (v459 === "/api/v2/proxy/image") {
            const v460 = JSON["parse"](String(v458["body"] || "{}"));
            return (
              v455["push"](v460),
              makeTextResponse(
                JSON["stringify"]({
                  results: [
                    {
                      url:
                        "https://img.example.com/apimart-z-image-" +
                        v455["length"] +
                        ".png",
                    },
                  ],
                }),
              )
            );
          }
          if (v459 === "/api/v2/save_output_from_url")
            return (
              (v456 += 1),
              makeJsonResponse({
                path: "output/apimart-z-image-" + v456 + ".png",
              })
            );
          throw new Error("unexpected fetch url: " + v459);
        }));
      const { clearApiConfig: v461 } = await import("./configApi.js");
      v461();
      const { generateImage: v462 } = await import("./aiImageApi.js"),
        v463 = await v462({
          provider: "apimart",
          model: "apimart/z-image-turbo",
          prompt: "dog",
          imageSize: "2K",
          aspectRatio: "16:9",
          prompt_extend: true,
          batchSize: 4,
          inputUrls: [],
        });
      (strict["equal"](v455["length"], 4),
        strict["deepEqual"](
          v455["map"]((v464) => v464["model"]),
          ["z-image-turbo", "z-image-turbo", "z-image-turbo", "z-image-turbo"],
        ),
        strict["deepEqual"](
          v455["map"]((v465) => v465["n"]),
          [undefined, undefined, undefined, undefined],
        ),
        strict["deepEqual"](
          v455["map"]((v466) => v466["prompt_extend"]),
          [true, true, true, true],
        ),
        strict["equal"](v463?.["isBatch"], true),
        strict["equal"](v463?.["images"]?.["length"], 4),
        strict["equal"](v456, 4));
    } finally {
      ((globalThis["fetch"] = v453), (globalThis["window"] = v454));
    }
  }),
  test("aiImageApi:\x20apimart\x20wan2.7-image\x20submits\x20provider\x20n\x20once\x20with\x20image\x20inputs", async () => {
    const v467 = globalThis["fetch"],
      v468 = globalThis["window"],
      v469 = [];
    let v470 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v471, v472 = {}) => {
          const v473 = String(v471);
          if (v473 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: { apiUrl: "https://api.grsai.example.com", apiKey: "" },
              },
            });
          if (v473 === "/api/v2/proxy/image") {
            const v474 = JSON["parse"](String(v472["body"] || "{}"));
            return (
              v469["push"](v474),
              makeTextResponse(
                JSON["stringify"]({
                  results: Array["from"](
                    { length: v474["n"] },
                    (v475, v476) => ({
                      url:
                        "https://img.example.com/apimart-wan-" +
                        (v476 + 1) +
                        ".png",
                    }),
                  ),
                }),
              )
            );
          }
          if (v473 === "/api/v2/save_output_from_url")
            return (
              (v470 += 1),
              makeJsonResponse({ path: "output/apimart-wan-" + v470 + ".png" })
            );
          throw new Error("unexpected fetch url: " + v473);
        }));
      const { clearApiConfig: v477 } = await import("./configApi.js");
      v477();
      const { generateImage: v478 } = await import("./aiImageApi.js"),
        v479 = await v478({
          provider: "apimart",
          model: "apimart/wan2.7-image",
          prompt: "dog",
          mode: "pro",
          imageSize: "4K",
          aspectRatio: "自适应",
          resolvedRatioLabel: "16:9",
          batchSize: 4,
          inputUrls: ["https://cdn.apimart.ai/ref.png"],
        });
      (strict["equal"](v469["length"], 1),
        strict["equal"](v469[0]?.["model"], "wan2.7-image-pro"),
        strict["equal"](v469[0]?.["resolution"], "2K"),
        strict["equal"](v469[0]?.["size"], "16:9"),
        strict["equal"](v469[0]?.["n"], 4),
        strict["equal"](v469[0]?.["thinking_mode"], true),
        strict["deepEqual"](v469[0]?.["image_urls"], [
          "https://cdn.apimart.ai/ref.png",
        ]),
        strict["equal"](v479?.["isBatch"], true),
        strict["equal"](v479?.["images"]?.["length"], 4),
        strict["equal"](v470, 4));
    } finally {
      ((globalThis["fetch"] = v467), (globalThis["window"] = v468));
    }
  }),
  test("aiImageApi: apimart seedream repeats batchSize with fixed request n=1", async () => {
    const v480 = globalThis["fetch"],
      v481 = globalThis["window"],
      v482 = [];
    let v483 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v484, v485 = {}) => {
          const v486 = String(v484);
          if (v486 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: { apiUrl: "https://api.grsai.example.com", apiKey: "" },
              },
            });
          if (v486 === "/api/v2/proxy/image") {
            const v487 = JSON["parse"](String(v485["body"] || "{}"));
            return (
              v482["push"](v487),
              makeTextResponse(
                JSON["stringify"]({
                  results: Array["from"]({ length: 1 }, (v488, v489) => ({
                    url:
                      "https://img.example.com/apimart-" +
                      v487["model"] +
                      "-" +
                      v482["length"] +
                      "-" +
                      (v489 + 1) +
                      ".png",
                  })),
                }),
              )
            );
          }
          if (v486 === "/api/v2/save_output_from_url")
            return (
              (v483 += 1),
              makeJsonResponse({
                path: "output/apimart-seedream-" + v483 + ".png",
              })
            );
          throw new Error("unexpected\x20fetch\x20url:\x20" + v486);
        }));
      const { clearApiConfig: v490 } = await import("./configApi.js");
      v490();
      const { generateImage: v491 } = await import("./aiImageApi.js"),
        v492 = await v491({
          provider: "apimart",
          model: "apimart/seedream-4.5",
          prompt: "dog",
          imageSize: "2K",
          aspectRatio: "16:9",
          batchSize: 4,
          inputUrls: [],
        });
      (strict["equal"](v482["length"], 4),
        strict["deepEqual"](
          v482["map"]((v493) => v493["model"]),
          [
            "doubao-seedream-4.5",
            "doubao-seedream-4.5",
            "doubao-seedream-4.5",
            "doubao-seedream-4.5",
          ],
        ),
        strict["deepEqual"](
          v482["map"]((v494) => v494["n"]),
          [1, 1, 1, 1],
        ),
        strict["equal"](v492?.["isBatch"], true),
        strict["equal"](v492?.["images"]?.["length"], 4),
        strict["equal"](v483, 4),
        (v482["length"] = 0),
        (v483 = 0));
      const v495 = await v491({
        provider: "apimart",
        model: "apimart/seedream-5.0-lite",
        prompt: "dog",
        imageSize: "3K",
        aspectRatio: "21:9",
        batchSize: 4,
        inputUrls: [],
      });
      (strict["equal"](v482["length"], 4),
        strict["deepEqual"](
          v482["map"]((v496) => v496["model"]),
          [
            "doubao-seedream-5.0-lite",
            "doubao-seedream-5.0-lite",
            "doubao-seedream-5.0-lite",
            "doubao-seedream-5.0-lite",
          ],
        ),
        strict["deepEqual"](
          v482["map"]((v497) => v497["n"]),
          [1, 1, 1, 1],
        ),
        strict["equal"](v482[0]?.["resolution"], "3K"),
        strict["equal"](v482[0]?.["size"], "21:9"),
        strict["equal"](v495?.["isBatch"], true),
        strict["equal"](v495?.["images"]?.["length"], 4),
        strict["equal"](v483, 4));
    } finally {
      ((globalThis["fetch"] = v480), (globalThis["window"] = v481));
    }
  }),
  test("aiImageApi: apimart gpt-image-2 创建与轮询兼容官方 result.images 结构", async () => {
    const v498 = globalThis["fetch"],
      v499 = globalThis["setTimeout"],
      v500 = globalThis["window"],
      v501 = [];
    let v502 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v503, v504, ...v505) =>
          v499(v503, Number(v504) > 5000 ? Number(v504) : 0, ...v505)),
        (globalThis["fetch"] = async (v506, v507 = {}) => {
          const v508 = String(v506);
          if (v508 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: {
                  apiUrl: "https://api.grsai.example.com/v1/",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v508 === "/api/v2/proxy/image") {
            const v509 = JSON["parse"](String(v507["body"] || "{}"));
            return (
              strict["equal"](
                v509["apiUrl"],
                "https://api.apimart.ai/v1/images/generations",
              ),
              strict["equal"](v509["model"], "gpt-image-2"),
              strict["equal"](v509["resolution"], "2k"),
              strict["equal"](v509["size"], "16:9"),
              makeTextResponse(
                JSON["stringify"]({
                  data: [
                    {
                      task_id: "task-apimart-gpt-image-2",
                      status: "submitted",
                    },
                  ],
                }),
              )
            );
          }
          if (v508["startsWith"]("/api/v2/proxy/task?"))
            return (
              (v502 += 1),
              strict["ok"](
                v508["includes"](
                  encodeURIComponent(
                    "https://api.apimart.ai/v1/tasks/task-apimart-gpt-image-2?language=zh",
                  ),
                ),
              ),
              makeJsonResponse({
                status: "success",
                data: {
                  result: {
                    images: [
                      {
                        url: [
                          "https://img.example.com/apimart-gpt-image-2.png",
                        ],
                      },
                    ],
                  },
                },
              })
            );
          if (v508 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/apimart-gpt-image-2.png" });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v508);
        }));
      const { clearApiConfig: v510 } = await import("./configApi.js");
      v510();
      const { generateImage: v511 } = await import("./aiImageApi.js"),
        v512 = await v511(
          {
            provider: "apimart",
            model: "apimart/gpt-image-2",
            prompt: "cat",
            aspectRatio: "16:9",
            imageSize: "2K",
            inputUrls: [],
          },
          { onTaskMeta: (v513) => v501["push"](v513) },
        );
      (strict["equal"](v501["length"], 1),
        strict["equal"](v501[0]["taskId"], "task-apimart-gpt-image-2"),
        strict["equal"](v501[0]["provider"], "apimart"),
        strict["ok"](v502 >= 1),
        strict["equal"](v512["localPath"], "output/apimart-gpt-image-2.png"),
        strict["equal"](v512["imageUrl"], "/output/apimart-gpt-image-2.png"));
    } finally {
      ((globalThis["fetch"] = v498),
        (globalThis["setTimeout"] = v499),
        (globalThis["window"] = v500));
    }
  }),
  test("aiImageApi: apimart model without explicit provider still resumes as apimart async task", async () => {
    const v514 = globalThis["fetch"],
      v515 = globalThis["setTimeout"],
      v516 = globalThis["window"],
      v517 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v518, v519, ...v520) =>
          v515(v518, Number(v519) > 5000 ? Number(v519) : 0, ...v520)),
        (globalThis["fetch"] = async (v521, v522 = {}) => {
          const v523 = String(v521);
          if (v523 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v523 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                data: [
                  { task_id: "task-apimart-model-only", status: "submitted" },
                ],
              }),
            );
          if (v523["startsWith"]("/api/v2/proxy/task?"))
            return (
              strict["ok"](
                v523["includes"](
                  encodeURIComponent(
                    "https://api.apimart.ai/v1/tasks/task-apimart-model-only?language=zh",
                  ),
                ),
              ),
              makeJsonResponse({
                status: "success",
                results: [
                  {
                    url: "https://img.example.com/apimart-model-only-final.png",
                  },
                ],
              })
            );
          if (v523 === "/api/v2/save_output_from_url")
            return makeJsonResponse({
              path: "output/apimart-model-only-final.png",
            });
          throw new Error("unexpected fetch url: " + v523);
        }));
      const { clearApiConfig: v524 } = await import("./configApi.js");
      v524();
      const { generateImage: v525 } = await import("./aiImageApi.js"),
        v526 = { model: "apimart/nano-banana-2", prompt: "cat", inputUrls: [] },
        v527 = await v525(v526, { onTaskMeta: (v528) => v517["push"](v528) });
      (strict["equal"](v517["length"], 1),
        strict["equal"](v517[0]["taskId"], "task-apimart-model-only"),
        strict["equal"](v517[0]["provider"], "apimart"),
        strict["equal"](v517[0]["kind"], "image"),
        strict["equal"](
          v527["localPath"],
          "output/apimart-model-only-final.png",
        ),
        strict["equal"](
          v527["imageUrl"],
          "/output/apimart-model-only-final.png",
        ));
    } finally {
      ((globalThis["fetch"] = v514),
        (globalThis["setTimeout"] = v515),
        (globalThis["window"] = v516));
    }
  }),
  test("aiImageApi: provider=apimart + 裸模型时优先走 apimart", async () => {
    const v529 = globalThis["fetch"],
      v530 = globalThis["setTimeout"],
      v531 = globalThis["window"];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v532, v533, ...v534) =>
          v530(v532, Number(v533) > 5000 ? Number(v533) : 0, ...v534)),
        (globalThis["fetch"] = async (v535, v536 = {}) => {
          const v537 = String(v535);
          if (v537 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v537 === "/api/v2/proxy/image") {
            const v538 = JSON["parse"](String(v536["body"] || "{}"));
            return (
              strict["ok"](
                String(v538["apiUrl"] || "")["includes"]("api.apimart.ai"),
              ),
              makeTextResponse(
                JSON["stringify"]({
                  data: [
                    {
                      task_id: "task-apimart-provider-priority",
                      status: "submitted",
                    },
                  ],
                }),
              )
            );
          }
          if (v537["startsWith"]("/api/v2/proxy/task?"))
            return (
              strict["ok"](
                v537["includes"](
                  encodeURIComponent(
                    "https://api.apimart.ai/v1/tasks/task-apimart-provider-priority?language=zh",
                  ),
                ),
              ),
              makeJsonResponse({
                status: "success",
                results: [
                  {
                    url: "https://img.example.com/apimart-provider-priority.png",
                  },
                ],
              })
            );
          if (v537 === "/api/v2/save_output_from_url")
            return makeJsonResponse({
              path: "output/apimart-provider-priority.png",
            });
          throw new Error("unexpected fetch url: " + v537);
        }));
      const { clearApiConfig: v539 } = await import("./configApi.js");
      v539();
      const { generateImage: v540 } = await import("./aiImageApi.js"),
        v541 = await v540({
          provider: "apimart",
          model: "nano-banana-2",
          prompt: "cat",
          inputUrls: [],
        });
      strict["equal"](
        v541["localPath"],
        "output/apimart-provider-priority.png",
      );
    } finally {
      ((globalThis["fetch"] = v529),
        (globalThis["setTimeout"] = v530),
        (globalThis["window"] = v531));
    }
  }),
  test("aiImageApi: provider=ppio + 裸模型时优先走 ppio", async () => {
    const v542 = globalThis["fetch"],
      v543 = globalThis["setTimeout"],
      v544 = globalThis["window"];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v545, v546, ...v547) =>
          v543(v545, Number(v546) > 5000 ? Number(v546) : 0, ...v547)),
        (globalThis["fetch"] = async (v548) => {
          const v549 = String(v548);
          if (v549 === "/api/config")
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: "https://api.ppinfra.com", apiKey: "k_ppio" },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          throw new Error("unexpected fetch url: " + v549);
        }));
      const { clearApiConfig: v550 } = await import("./configApi.js");
      v550();
      const { buildGenerateImageRequest: v551 } =
          await import("./aiImageApi.js"),
        v552 = await v551({
          provider: "ppio",
          model: "seedream-5.0-lite",
          prompt: "cat",
          inputUrls: [],
        });
      (strict["equal"](v552["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v552["body"]["apiUrl"],
          "https://api.ppinfra.com/v3/seedream-5.0-lite",
        ),
        strict["equal"](v552["body"]["prompt"], "cat"));
    } finally {
      ((globalThis["fetch"] = v542),
        (globalThis["setTimeout"] = v543),
        (globalThis["window"] = v544));
    }
  }),
  test("aiImageApi: unregistered bare model rejects without default GRSAI routing", async () => {
    const v553 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          grsai: { apiUrl: "https://api.grsai.example.com", apiKey: "k_grsai" },
        },
      });
      const { clearApiConfig: v554 } = await import("./configApi.js");
      v554();
      const { buildGenerateImageRequest: v555 } =
        await import("./aiImageApi.js");
      await strict["rejects"](
        () =>
          v555({
            model: "unregistered-bare-model",
            prompt: "cat",
            inputUrls: [],
          }),
        /Image model API manifest missing: unregistered-bare-model/,
      );
    } finally {
      globalThis["fetch"] = v553;
    }
  }),
  test("aiImageApi: grsai async task can render image even when create response has no status", async () => {
    const v556 = globalThis["fetch"],
      v557 = globalThis["setTimeout"],
      v558 = globalThis["window"],
      v559 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v560, v561, ...v562) =>
          v557(v560, Number(v561) > 5000 ? Number(v561) : 0, ...v562)),
        (globalThis["fetch"] = async (v563, v564 = {}) => {
          const v565 = String(v563);
          if (v565 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v565 === "/api/v2/proxy/image") {
            const v566 = JSON["parse"](String(v564["body"] || "{}")),
              v567 = String(v566["apiUrl"] || "");
            if (v567["endsWith"]("/v1/api/generate"))
              return makeTextResponse(
                JSON["stringify"]({ data: { task_id: "task-grsai-1" } }),
              );
            throw new Error("unexpected apiUrl: " + v567);
          }
          if (v565["startsWith"]("/api/v2/proxy/task?")) {
            const v568 = getProxyTaskApiUrl(v565);
            return (
              strict["equal"](
                v568,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-1",
              ),
              makeJsonResponse({
                id: "task-grsai-1",
                status: "succeeded",
                results: [{ url: "https://img.example.com/grsai-final.png" }],
              })
            );
          }
          if (v565 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-final.png" });
          throw new Error("unexpected fetch url: " + v565);
        }));
      const { clearApiConfig: v569 } = await import("./configApi.js");
      v569();
      const { generateImage: v570 } = await import("./aiImageApi.js"),
        v571 = {
          provider: "grsai",
          model: "nano-banana-pro-vt",
          prompt: "cat",
          inputUrls: [],
        },
        v572 = await v570(v571, { onTaskMeta: (v573) => v559["push"](v573) });
      (strict["equal"](v559["length"], 1),
        strict["equal"](v559[0]["taskId"], "task-grsai-1"),
        strict["equal"](v559[0]["provider"], "grsai"),
        strict["equal"](v559[0]["kind"], "image"),
        strict["equal"](v572["localPath"], "output/grsai-final.png"),
        strict["equal"](v572["imageUrl"], "/output/grsai-final.png"));
    } finally {
      ((globalThis["fetch"] = v556),
        (globalThis["setTimeout"] = v557),
        (globalThis["window"] = v558));
    }
  }),
  test("aiImageApi: grsai generate succeeded results render without polling", async () => {
    const v574 = globalThis["fetch"],
      v575 = globalThis["window"],
      v576 = [];
    let v577 = false;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["fetch"] = async (v578, v579 = {}) => {
          const v580 = String(v578);
          if (v580 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com/v1/",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v580 === "/api/v2/proxy/image") {
            const v581 = JSON["parse"](String(v579["body"] || "{}"));
            return (
              strict["equal"](
                v581["apiUrl"],
                "https://api.grsai.example.com/v1/api/generate",
              ),
              strict["deepEqual"](v581["images"], []),
              strict["equal"](v581["replyType"], "json"),
              makeTextResponse(
                JSON["stringify"]({
                  id: "7-d28fb618-a9a8-4931-9a02-6b8ecfafd493",
                  status: "succeeded",
                  results: [
                    {
                      url: "https://file5.aitohumanize.com/file/64e00628c80e4d339eb2fbc085bb3966.png",
                    },
                  ],
                }),
              )
            );
          }
          if (v580["startsWith"]("/api/v2/proxy/task?")) {
            v577 = true;
            throw new Error("unexpected polling url: " + v580);
          }
          if (v580 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-direct-final.png" });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v580);
        }));
      const { clearApiConfig: v582 } = await import("./configApi.js");
      v582();
      const { generateImage: v583 } = await import("./aiImageApi.js"),
        v584 = await v583(
          {
            provider: "grsai",
            model: "nano-banana-2",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v585) => v576["push"](v585) },
        );
      (strict["equal"](v577, false),
        strict["equal"](v576["length"], 0),
        strict["equal"](v584["localPath"], "output/grsai-direct-final.png"),
        strict["equal"](v584["imageUrl"], "/output/grsai-direct-final.png"));
    } finally {
      ((globalThis["fetch"] = v574), (globalThis["window"] = v575));
    }
  }),
  test("aiImageApi:\x20grsai\x20polling\x20uses\x20GET\x20/v1/api/result", async () => {
    const v586 = globalThis["fetch"],
      v587 = globalThis["setTimeout"],
      v588 = globalThis["window"],
      v589 = [];
    let v590 = false;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v591, v592, ...v593) =>
          v587(v591, Number(v592) > 5000 ? Number(v592) : 0, ...v593)),
        (globalThis["fetch"] = async (v594, v595 = {}) => {
          const v596 = String(v594);
          if (v596 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v596 === "/api/v2/proxy/image") {
            const v597 = JSON["parse"](String(v595["body"] || "{}")),
              v598 = String(v597["apiUrl"] || "");
            if (v598["endsWith"]("/v1/api/generate"))
              return makeTextResponse(
                'data: {"result":{"task_id":"task-grsai-fallback-1"}}\n\n',
              );
            throw new Error("unexpected apiUrl: " + v598);
          }
          if (v596["startsWith"]("/api/v2/proxy/task?")) {
            const v599 = getProxyTaskApiUrl(v596);
            return (
              (v590 = true),
              strict["equal"](
                v599,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-fallback-1",
              ),
              makeJsonResponse({
                id: "task-grsai-fallback-1",
                status: "finished",
                output: {
                  images: [
                    { url: "https://img.example.com/grsai-fallback-final.png" },
                  ],
                },
              })
            );
          }
          if (v596 === "/api/v2/save_output_from_url")
            return makeJsonResponse({
              path: "output/grsai-fallback-final.png",
            });
          throw new Error("unexpected fetch url: " + v596);
        }));
      const { clearApiConfig: v600 } = await import("./configApi.js");
      v600();
      const { generateImage: v601 } = await import("./aiImageApi.js"),
        v602 = {
          provider: "grsai",
          model: "nano-banana-pro-vt",
          prompt: "cat",
          inputUrls: [],
        },
        v603 = await v601(v602, { onTaskMeta: (v604) => v589["push"](v604) });
      (strict["equal"](v589["length"], 1),
        strict["equal"](v589[0]["taskId"], "task-grsai-fallback-1"),
        strict["equal"](v589[0]["provider"], "grsai"),
        strict["equal"](v589[0]["kind"], "image"),
        strict["equal"](v590, true),
        strict["equal"](v603["localPath"], "output/grsai-fallback-final.png"),
        strict["equal"](v603["imageUrl"], "/output/grsai-fallback-final.png"));
    } finally {
      ((globalThis["fetch"] = v586),
        (globalThis["setTimeout"] = v587),
        (globalThis["window"] = v588));
    }
  }),
  test("aiImageApi: resumeAsyncImageTask 支持 grsai 恢复", async () => {
    const v605 = globalThis["fetch"],
      v606 = globalThis["setTimeout"],
      v607 = globalThis["window"];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v608) => {
          if (typeof v608 === "function") v608();
          return 0;
        }),
        (globalThis["fetch"] = async (v609, v610 = {}) => {
          const v611 = String(v609);
          if (v611 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com/v1/",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v611["startsWith"]("/api/v2/proxy/task?")) {
            const v612 = getProxyTaskApiUrl(v611);
            return (
              strict["equal"](
                v612,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-resume-1",
              ),
              makeJsonResponse({
                id: "task-grsai-resume-1",
                status: "succeeded",
                results: [
                  { url: "https://img.example.com/grsai-resume-final.png" },
                ],
              })
            );
          }
          if (v611 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-resume-final.png" });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v611);
        }));
      const { clearApiConfig: v613 } = await import("./configApi.js");
      v613();
      const { resumeAsyncImageTask: v614 } = await import("./aiImageApi.js"),
        v615 = await v614("task-grsai-resume-1", {
          provider: "grsai",
          model: "nano-banana-2",
        });
      (strict["equal"](v615["localPath"], "output/grsai-resume-final.png"),
        strict["equal"](v615["imageUrl"], "/output/grsai-resume-final.png"));
    } finally {
      ((globalThis["fetch"] = v605),
        (globalThis["setTimeout"] = v606),
        (globalThis["window"] = v607));
    }
  }),
  test("aiImageApi: grsai SSE renders directly when task_id arrives before results", async () => {
    const v616 = globalThis["fetch"],
      v617 = globalThis["setTimeout"],
      v618 = globalThis["window"],
      v619 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v620, v621, ...v622) =>
          v617(v620, Number(v621) > 5000 ? Number(v621) : 0, ...v622)),
        (globalThis["fetch"] = async (v623, v624 = {}) => {
          const v625 = String(v623);
          if (v625 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v625 === "/api/v2/proxy/image") {
            const v626 = JSON["parse"](String(v624["body"] || "{}")),
              v627 = String(v626["apiUrl"] || "");
            if (v627["endsWith"]("/v1/api/generate"))
              return makeTextResponse(
                'data: {"data":{"task_id":"task-grsai-sse-direct-1"},"status":"pending"}\n\ndata: {"status":"succeeded","results":[{"url":"https://img.example.com/grsai-sse-direct-1.png"}]}\n\n',
              );
          }
          if (v625 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-sse-direct-1.png" });
          if (v625["startsWith"]("/api/v2/proxy/task?"))
            return makeJsonResponse({ message: "should-not-poll" }, 500);
          throw new Error("unexpected fetch url: " + v625);
        }));
      const { clearApiConfig: v628 } = await import("./configApi.js");
      v628();
      const { generateImage: v629 } = await import("./aiImageApi.js"),
        v630 = await v629(
          {
            provider: "grsai",
            model: "nano-banana-pro-vt",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v631) => v619["push"](v631) },
        );
      (strict["equal"](v619["length"], 0),
        strict["equal"](v630["localPath"], "output/grsai-sse-direct-1.png"),
        strict["equal"](v630["imageUrl"], "/output/grsai-sse-direct-1.png"));
    } finally {
      ((globalThis["fetch"] = v616),
        (globalThis["setTimeout"] = v617),
        (globalThis["window"] = v618));
    }
  }),
  test("aiImageApi: grsai polls create response id through /v1/api/result", async () => {
    const v632 = globalThis["fetch"],
      v633 = globalThis["setTimeout"],
      v634 = globalThis["window"],
      v635 = [];
    let v636 = false;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v637, v638, ...v639) =>
          v633(v637, Number(v638) > 5000 ? Number(v638) : 0, ...v639)),
        (globalThis["fetch"] = async (v640, v641 = {}) => {
          const v642 = String(v640);
          if (v642 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v642 === "/api/v2/proxy/image") {
            const v643 = JSON["parse"](String(v641["body"] || "{}")),
              v644 = String(v643["apiUrl"] || "");
            return (
              strict["equal"](
                v644,
                "https://api.grsai.example.com/v1/api/generate",
              ),
              makeTextResponse(
                JSON["stringify"]({
                  status: "pending",
                  data: { id: "task-grsai-result-1" },
                }),
              )
            );
          }
          if (v642["startsWith"]("/api/v2/proxy/task?")) {
            const v645 = getProxyTaskApiUrl(v642);
            return (
              (v636 = true),
              strict["equal"](
                v645,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-result-1",
              ),
              makeJsonResponse({
                id: "task-grsai-result-1",
                status: "succeeded",
                results: [
                  { url: "https://img.example.com/grsai-result-1.png" },
                ],
              })
            );
          }
          if (v642 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-result-1.png" });
          throw new Error("unexpected fetch url: " + v642);
        }));
      const { clearApiConfig: v646 } = await import("./configApi.js");
      v646();
      const { generateImage: v647 } = await import("./aiImageApi.js"),
        v648 = await v647(
          {
            provider: "grsai",
            model: "nano-banana-pro-vt",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v649) => v635["push"](v649) },
        );
      (strict["equal"](v635["length"], 1),
        strict["equal"](v635[0]["taskId"], "task-grsai-result-1"),
        strict["equal"](v635[0]["provider"], "grsai"),
        strict["equal"](v636, true),
        strict["equal"](v648["localPath"], "output/grsai-result-1.png"),
        strict["equal"](v648["imageUrl"], "/output/grsai-result-1.png"));
    } finally {
      ((globalThis["fetch"] = v632),
        (globalThis["setTimeout"] = v633),
        (globalThis["window"] = v634));
    }
  }),
  test("aiImageApi:\x20ppio\x20async\x20task\x20calls\x20onTaskMeta\x20and\x20supports\x20resumeAsyncImageTask\x20even\x20without\x20create\x20status", async () => {
    const v650 = globalThis["fetch"],
      v651 = globalThis["setTimeout"],
      v652 = globalThis["window"],
      v653 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v654, v655, ...v656) =>
          v651(v654, Number(v655) > 5000 ? Number(v655) : 0, ...v656)),
        (globalThis["fetch"] = async (v657, v658 = {}) => {
          const v659 = String(v657);
          if (v659 === "/api/config")
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: "https://api.ppio.com", apiKey: "k_ppio" },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v659 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({ task_id: "task-ppio-1" }),
            );
          if (v659["startsWith"]("/api/v2/proxy/task?"))
            return makeJsonResponse({
              status: "SUCCEEDED",
              results: [{ url: "https://img.example.com/ppio-final.png" }],
            });
          if (v659 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/ppio-final.png" });
          throw new Error("unexpected fetch url: " + v659);
        }));
      const { clearApiConfig: v660 } = await import("./configApi.js");
      v660();
      const { generateImage: v661, resumeAsyncImageTask: v662 } =
          await import("./aiImageApi.js"),
        v663 = {
          provider: "ppio",
          model: "ppio/seedream-5.0-lite",
          prompt: "cat",
          inputUrls: [],
        },
        v664 = await v661(v663, { onTaskMeta: (v665) => v653["push"](v665) });
      (strict["equal"](v653["length"], 1),
        strict["equal"](v653[0]["taskId"], "task-ppio-1"),
        strict["equal"](v653[0]["provider"], "ppio"),
        strict["equal"](v653[0]["kind"], "image"),
        strict["equal"](v664["localPath"], "output/ppio-final.png"),
        strict["equal"](v664["imageUrl"], "/output/ppio-final.png"));
      const v666 = await v662("task-ppio-2", v663);
      (strict["equal"](v666["localPath"], "output/ppio-final.png"),
        strict["equal"](v666["imageUrl"], "/output/ppio-final.png"));
    } finally {
      ((globalThis["fetch"] = v650),
        (globalThis["setTimeout"] = v651),
        (globalThis["window"] = v652));
    }
  }),
  test("aiImageApi:\x20ppio\x20extracts\x20task\x20ID\x20from\x20multiline\x20data\x20even\x20when\x20the\x20final\x20frame\x20has\x20no\x20task_id", async () => {
    const v667 = globalThis["fetch"],
      v668 = globalThis["setTimeout"],
      v669 = globalThis["window"],
      v670 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v671, v672, ...v673) =>
          v668(v671, Number(v672) > 5000 ? Number(v672) : 0, ...v673)),
        (globalThis["fetch"] = async (v674, v675 = {}) => {
          const v676 = String(v674);
          if (v676 === "/api/config")
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: "https://api.ppio.com", apiKey: "k_ppio" },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v676 === "/api/v2/proxy/image")
            return makeTextResponse(
              'data: {"task_id":"task-ppio-sse-1","status":"submitted"}\n\ndata: {"status":"pending"}\n\n',
            );
          if (v676["startsWith"]("/api/v2/proxy/task?"))
            return makeJsonResponse({
              status: "success",
              results: [{ url: "https://img.example.com/ppio-sse-1.png" }],
            });
          if (v676 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/ppio-sse-1.png" });
          throw new Error("unexpected fetch url: " + v676);
        }));
      const { clearApiConfig: v677 } = await import("./configApi.js");
      v677();
      const { generateImage: v678 } = await import("./aiImageApi.js"),
        v679 = await v678(
          {
            provider: "ppio",
            model: "ppio/seedream-5.0-lite",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v680) => v670["push"](v680) },
        );
      (strict["equal"](v670["length"], 1),
        strict["equal"](v670[0]["taskId"], "task-ppio-sse-1"),
        strict["equal"](v670[0]["provider"], "ppio"),
        strict["equal"](v679["localPath"], "output/ppio-sse-1.png"));
    } finally {
      ((globalThis["fetch"] = v667),
        (globalThis["setTimeout"] = v668),
        (globalThis["window"] = v669));
    }
  }),
  test("aiImageApi: ppio polls when create response data is a string task ID", async () => {
    const v681 = globalThis["fetch"],
      v682 = globalThis["setTimeout"],
      v683 = globalThis["window"],
      v684 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v685, v686, ...v687) =>
          v682(v685, Number(v686) > 5000 ? Number(v686) : 0, ...v687)),
        (globalThis["fetch"] = async (v688, v689 = {}) => {
          const v690 = String(v688);
          if (v690 === "/api/config")
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: "https://api.ppio.com", apiKey: "k_ppio" },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v690 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({ data: "task-ppio-data-string-1" }),
            );
          if (v690["startsWith"]("/api/v2/proxy/task?"))
            return makeJsonResponse({
              status: "success",
              results: [
                { url: "https://img.example.com/ppio-data-string-1.png" },
              ],
            });
          if (v690 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/ppio-data-string-1.png" });
          throw new Error("unexpected fetch url: " + v690);
        }));
      const { clearApiConfig: v691 } = await import("./configApi.js");
      v691();
      const { generateImage: v692 } = await import("./aiImageApi.js"),
        v693 = await v692(
          {
            provider: "ppio",
            model: "ppio/seedream-5.0-lite",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v694) => v684["push"](v694) },
        );
      (strict["equal"](v684["length"], 1),
        strict["equal"](v684[0]["taskId"], "task-ppio-data-string-1"),
        strict["equal"](v684[0]["provider"], "ppio"),
        strict["equal"](v693["localPath"], "output/ppio-data-string-1.png"));
    } finally {
      ((globalThis["fetch"] = v681),
        (globalThis["setTimeout"] = v682),
        (globalThis["window"] = v683));
    }
  }),
  test("aiImageApi: grsai polls when create response body lacks task_id but header has x-task-id", async () => {
    const v695 = globalThis["fetch"],
      v696 = globalThis["setTimeout"],
      v697 = globalThis["window"],
      v698 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v699, v700, ...v701) =>
          v696(v699, Number(v700) > 5000 ? Number(v700) : 0, ...v701)),
        (globalThis["fetch"] = async (v702, v703 = {}) => {
          const v704 = String(v702);
          if (v704 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v704 === "/api/v2/proxy/image") {
            const v705 = JSON["parse"](String(v703["body"] || "{}")),
              v706 = String(v705["apiUrl"] || "");
            if (v706["endsWith"]("/v1/api/generate"))
              return makeTextResponseWithHeaders(
                JSON["stringify"]({ status: "pending" }),
                { "x-task-id": "task-grsai-header-1" },
              );
            throw new Error("unexpected apiUrl: " + v706);
          }
          if (v704["startsWith"]("/api/v2/proxy/task?")) {
            const v707 = getProxyTaskApiUrl(v704);
            return (
              strict["equal"](
                v707,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-header-1",
              ),
              makeJsonResponse({
                id: "task-grsai-header-1",
                status: "succeeded",
                results: [
                  { url: "https://img.example.com/grsai-header-1.png" },
                ],
              })
            );
          }
          if (v704 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-header-1.png" });
          throw new Error("unexpected fetch url: " + v704);
        }));
      const { clearApiConfig: v708 } = await import("./configApi.js");
      v708();
      const { generateImage: v709 } = await import("./aiImageApi.js"),
        v710 = await v709(
          {
            provider: "grsai",
            model: "nano-banana-pro-vt",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v711) => v698["push"](v711) },
        );
      (strict["equal"](v698["length"], 1),
        strict["equal"](v698[0]["taskId"], "task-grsai-header-1"),
        strict["equal"](v698[0]["provider"], "grsai"),
        strict["equal"](v710["localPath"], "output/grsai-header-1.png"));
    } finally {
      ((globalThis["fetch"] = v695),
        (globalThis["setTimeout"] = v696),
        (globalThis["window"] = v697));
    }
  }),
  test("aiImageApi: grsai polls when create response task field is the task ID", async () => {
    const v712 = globalThis["fetch"],
      v713 = globalThis["setTimeout"],
      v714 = globalThis["window"],
      v715 = [];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v716, v717, ...v718) =>
          v713(v716, Number(v717) > 5000 ? Number(v717) : 0, ...v718)),
        (globalThis["fetch"] = async (v719, v720 = {}) => {
          const v721 = String(v719);
          if (v721 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v721 === "/api/v2/proxy/image") {
            const v722 = JSON["parse"](String(v720["body"] || "{}")),
              v723 = String(v722["apiUrl"] || "");
            if (v723["endsWith"]("/v1/api/generate"))
              return makeTextResponse(
                JSON["stringify"]({
                  status: "pending",
                  task: "task-grsai-task-key-1",
                }),
              );
            throw new Error("unexpected apiUrl: " + v723);
          }
          if (v721["startsWith"]("/api/v2/proxy/task?")) {
            const v724 = getProxyTaskApiUrl(v721);
            return (
              strict["equal"](
                v724,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-task-key-1",
              ),
              makeJsonResponse({
                id: "task-grsai-task-key-1",
                status: "succeeded",
                results: [
                  { url: "https://img.example.com/grsai-task-key-1.png" },
                ],
              })
            );
          }
          if (v721 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-task-key-1.png" });
          throw new Error("unexpected fetch url: " + v721);
        }));
      const { clearApiConfig: v725 } = await import("./configApi.js");
      v725();
      const { generateImage: v726 } = await import("./aiImageApi.js"),
        v727 = await v726(
          {
            provider: "grsai",
            model: "nano-banana-pro-vt",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v728) => v715["push"](v728) },
        );
      (strict["equal"](v715["length"], 1),
        strict["equal"](v715[0]["taskId"], "task-grsai-task-key-1"),
        strict["equal"](v715[0]["provider"], "grsai"),
        strict["equal"](v727["localPath"], "output/grsai-task-key-1.png"));
    } finally {
      ((globalThis["fetch"] = v712),
        (globalThis["setTimeout"] = v713),
        (globalThis["window"] = v714));
    }
  }),
  test("aiImageApi: grsai polls when create response has success and task_id", async () => {
    const v729 = globalThis["fetch"],
      v730 = globalThis["setTimeout"],
      v731 = globalThis["window"],
      v732 = [];
    let v733 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v734, v735, ...v736) =>
          v730(v734, Number(v735) > 5000 ? Number(v735) : 0, ...v736)),
        (globalThis["fetch"] = async (v737, v738 = {}) => {
          const v739 = String(v737);
          if (v739 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v739 === "/api/v2/proxy/image") {
            const v740 = JSON["parse"](String(v738["body"] || "{}")),
              v741 = String(v740["apiUrl"] || "");
            if (v741["endsWith"]("/v1/api/generate"))
              return makeTextResponse(
                JSON["stringify"]({
                  status: "success",
                  data: { task_id: "task-grsai-success-ack" },
                }),
              );
            throw new Error("unexpected\x20apiUrl:\x20" + v741);
          }
          if (v739["startsWith"]("/api/v2/proxy/task?")) {
            const v742 = getProxyTaskApiUrl(v739);
            return (
              (v733 += 1),
              strict["equal"](
                v742,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-success-ack",
              ),
              makeJsonResponse({
                id: "task-grsai-success-ack",
                status: "succeeded",
                results: [
                  { url: "https://img.example.com/grsai-success-ack.png" },
                ],
              })
            );
          }
          if (v739 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-success-ack.png" });
          throw new Error("unexpected fetch url: " + v739);
        }));
      const { clearApiConfig: v743 } = await import("./configApi.js");
      v743();
      const { generateImage: v744 } = await import("./aiImageApi.js"),
        v745 = await v744(
          {
            provider: "grsai",
            model: "nano-banana-pro-vt",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v746) => v732["push"](v746) },
        );
      (strict["equal"](v732["length"], 1),
        strict["equal"](v732[0]["taskId"], "task-grsai-success-ack"),
        strict["ok"](v733 >= 1),
        strict["equal"](v745["localPath"], "output/grsai-success-ack.png"));
    } finally {
      ((globalThis["fetch"] = v729),
        (globalThis["setTimeout"] = v730),
        (globalThis["window"] = v731));
    }
  }),
  test("aiImageApi: grsai polls when non-JSON create response text contains task_id", async () => {
    const v747 = globalThis["fetch"],
      v748 = globalThis["setTimeout"],
      v749 = globalThis["window"],
      v750 = [];
    let v751 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v752, v753, ...v754) =>
          v748(v752, Number(v753) > 5000 ? Number(v753) : 0, ...v754)),
        (globalThis["fetch"] = async (v755, v756 = {}) => {
          const v757 = String(v755);
          if (v757 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v757 === "/api/v2/proxy/image") {
            const v758 = JSON["parse"](String(v756["body"] || "{}")),
              v759 = String(v758["apiUrl"] || "");
            if (v759["endsWith"]("/v1/api/generate"))
              return makeTextResponse(
                "status=success,\x20task_id=task-grsai-plain-text",
              );
            throw new Error("unexpected\x20apiUrl:\x20" + v759);
          }
          if (v757["startsWith"]("/api/v2/proxy/task?")) {
            const v760 = getProxyTaskApiUrl(v757);
            return (
              (v751 += 1),
              strict["equal"](
                v760,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-plain-text",
              ),
              makeJsonResponse({
                id: "task-grsai-plain-text",
                status: "succeeded",
                results: [
                  { url: "https://img.example.com/grsai-plain-text.png" },
                ],
              })
            );
          }
          if (v757 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-plain-text.png" });
          throw new Error("unexpected fetch url: " + v757);
        }));
      const { clearApiConfig: v761 } = await import("./configApi.js");
      v761();
      const { generateImage: v762 } = await import("./aiImageApi.js"),
        v763 = await v762(
          {
            provider: "grsai",
            model: "nano-banana-pro-vt",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v764) => v750["push"](v764) },
        );
      (strict["equal"](v750["length"], 1),
        strict["equal"](v750[0]["taskId"], "task-grsai-plain-text"),
        strict["ok"](v751 >= 1),
        strict["equal"](v763["localPath"], "output/grsai-plain-text.png"));
    } finally {
      ((globalThis["fetch"] = v747),
        (globalThis["setTimeout"] = v748),
        (globalThis["window"] = v749));
    }
  }),
  test("aiImageApi:\x20ppio\x20polls\x20when\x20create\x20response\x20has\x20success\x20and\x20task_id", async () => {
    const v765 = globalThis["fetch"],
      v766 = globalThis["setTimeout"],
      v767 = globalThis["window"],
      v768 = [];
    let v769 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v770, v771, ...v772) =>
          v766(v770, Number(v771) > 5000 ? Number(v771) : 0, ...v772)),
        (globalThis["fetch"] = async (v773, v774 = {}) => {
          const v775 = String(v773);
          if (v775 === "/api/config")
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: "https://api.ppio.com", apiKey: "k_ppio" },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v775 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                status: "success",
                task_id: "task-ppio-success-ack",
              }),
            );
          if (v775["startsWith"]("/api/v2/proxy/task?"))
            return (
              (v769 += 1),
              makeJsonResponse({
                status: "succeeded",
                results: [
                  { url: "https://img.example.com/ppio-success-ack.png" },
                ],
              })
            );
          if (v775 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/ppio-success-ack.png" });
          throw new Error("unexpected fetch url: " + v775);
        }));
      const { clearApiConfig: v776 } = await import("./configApi.js");
      v776();
      const { generateImage: v777 } = await import("./aiImageApi.js"),
        v778 = await v777(
          {
            provider: "ppio",
            model: "ppio/seedream-5.0-lite",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v779) => v768["push"](v779) },
        );
      (strict["equal"](v768["length"], 1),
        strict["equal"](v768[0]["taskId"], "task-ppio-success-ack"),
        strict["ok"](v769 >= 1),
        strict["equal"](v778["localPath"], "output/ppio-success-ack.png"));
    } finally {
      ((globalThis["fetch"] = v765),
        (globalThis["setTimeout"] = v766),
        (globalThis["window"] = v767));
    }
  }),
  test("aiImageApi: provider/model mismatch rejects instead of GRSAI routing", async () => {
    const v780 = globalThis["fetch"];
    try {
      installFetchMockForConfig({
        providers: {
          ppio: { apiUrl: "https://api.ppio.com", apiKey: "k_ppio" },
          grsai: { apiUrl: "https://api.grsai.example.com", apiKey: "k_grsai" },
        },
      });
      const { clearApiConfig: v781 } = await import("./configApi.js");
      v781();
      const { buildGenerateImageRequest: v782 } =
        await import("./aiImageApi.js");
      await strict["rejects"](
        () =>
          v782({
            provider: "grsai",
            model: "ppio/seedream-5.0-lite",
            prompt: "cat",
            inputUrls: [],
          }),
        /GRSAI image model API manifest missing: ppio\/seedream-5.0-lite/,
      );
    } finally {
      globalThis["fetch"] = v780;
    }
  }),
  test("aiImageApi: grsai 裸模型 + provider=runninghubwf 时按 provider 优先走 runninghubwf", async () => {
    const v783 = globalThis["fetch"],
      v784 = globalThis["setTimeout"],
      v785 = globalThis["window"];
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v786, v787, ...v788) =>
          v784(v786, Number(v787) > 5000 ? Number(v787) : 0, ...v788)),
        (globalThis["fetch"] = async (v789, v790 = {}) => {
          const v791 = String(v789);
          if (v791 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v791);
        }));
      const { clearApiConfig: v792 } = await import("./configApi.js");
      v792();
      const { generateImage: v793 } = await import("./aiImageApi.js");
      await strict["rejects"](
        () =>
          v793({
            provider: "runninghubwf",
            model: "nano-banana-pro-vt",
            prompt: "cat",
            inputUrls: [],
          }),
        /RunningHUB 请求|RunningHUB/,
      );
    } finally {
      ((globalThis["fetch"] = v783),
        (globalThis["setTimeout"] = v784),
        (globalThis["window"] = v785));
    }
  }),
  test("aiImageApi:\x20calls\x20onTaskMeta\x20first\x20when\x20create\x20response\x20has\x20task_id\x20and\x20immediate\x20results", async () => {
    const v794 = globalThis["fetch"],
      v795 = globalThis["setTimeout"],
      v796 = globalThis["window"],
      v797 = [];
    let v798 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v799, v800, ...v801) =>
          v795(v799, Number(v800) > 5000 ? Number(v800) : 0, ...v801)),
        (globalThis["fetch"] = async (v802) => {
          const v803 = String(v802);
          if (v803 === "/api/config")
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: "https://api.ppio.com", apiKey: "k_ppio" },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v803 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                status: "success",
                task_id: "task-ppio-direct-result",
                results: [
                  { url: "https://img.example.com/ppio-direct-result.png" },
                ],
              }),
            );
          if (v803["startsWith"]("/api/v2/proxy/task?"))
            return (
              (v798 += 1),
              makeJsonResponse({
                status: "success",
                results: [
                  { url: "https://img.example.com/ppio-direct-result.png" },
                ],
              })
            );
          if (v803 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/ppio-direct-result.png" });
          throw new Error("unexpected fetch url: " + v803);
        }));
      const { clearApiConfig: v804 } = await import("./configApi.js");
      v804();
      const { generateImage: v805 } = await import("./aiImageApi.js"),
        v806 = await v805(
          {
            provider: "ppio",
            model: "ppio/seedream-5.0-lite",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v807) => v797["push"](v807) },
        );
      (strict["equal"](v797["length"], 1),
        strict["equal"](v797[0]["taskId"], "task-ppio-direct-result"),
        strict["equal"](v797[0]["provider"], "ppio"),
        strict["equal"](v798, 0),
        strict["equal"](v806["localPath"], "output/ppio-direct-result.png"),
        strict["equal"](v806["imageUrl"], "/output/ppio-direct-result.png"));
    } finally {
      ((globalThis["fetch"] = v794),
        (globalThis["setTimeout"] = v795),
        (globalThis["window"] = v796));
    }
  }),
  test("aiImageApi:\x20ppio\x20extracts\x20nested\x20task\x20field\x20as\x20task\x20ID\x20and\x20polls", async () => {
    const v808 = globalThis["fetch"],
      v809 = globalThis["setTimeout"],
      v810 = globalThis["window"],
      v811 = [];
    let v812 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v813, v814, ...v815) =>
          v809(v813, Number(v814) > 5000 ? Number(v814) : 0, ...v815)),
        (globalThis["fetch"] = async (v816) => {
          const v817 = String(v816);
          if (v817 === "/api/config")
            return makeJsonResponse({
              providers: {
                ppio: { apiUrl: "https://api.ppio.com", apiKey: "k_ppio" },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v817 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                data: { task: { id: "task-ppio-nested-1", status: "pending" } },
              }),
            );
          if (v817["startsWith"]("/api/v2/proxy/task?"))
            return (
              (v812 += 1),
              makeJsonResponse({
                status: "succeeded",
                results: [{ url: "https://img.example.com/ppio-nested-1.png" }],
              })
            );
          if (v817 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/ppio-nested-1.png" });
          throw new Error("unexpected fetch url: " + v817);
        }));
      const { clearApiConfig: v818 } = await import("./configApi.js");
      v818();
      const { generateImage: v819 } = await import("./aiImageApi.js"),
        v820 = await v819(
          {
            provider: "ppio",
            model: "ppio/seedream-5.0-lite",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v821) => v811["push"](v821) },
        );
      (strict["equal"](v811["length"], 1),
        strict["equal"](v811[0]["taskId"], "task-ppio-nested-1"),
        strict["equal"](v811[0]["provider"], "ppio"),
        strict["ok"](v812 >= 1),
        strict["equal"](v820["localPath"], "output/ppio-nested-1.png"),
        strict["equal"](v820["imageUrl"], "/output/ppio-nested-1.png"));
    } finally {
      ((globalThis["fetch"] = v808),
        (globalThis["setTimeout"] = v809),
        (globalThis["window"] = v810));
    }
  }),
  test("aiImageApi:\x20apimart\x20polls\x20when\x20create\x20response\x20has\x20success\x20and\x20task_id", async () => {
    const v822 = globalThis["fetch"],
      v823 = globalThis["setTimeout"],
      v824 = globalThis["window"],
      v825 = [];
    let v826 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v827, v828, ...v829) =>
          v823(v827, Number(v828) > 5000 ? Number(v828) : 0, ...v829)),
        (globalThis["fetch"] = async (v830, v831 = {}) => {
          const v832 = String(v830);
          if (v832 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v832 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                status: "success",
                data: { task_id: "task-apimart-success-ack" },
              }),
            );
          if (v832["startsWith"]("/api/v2/proxy/task?"))
            return (
              (v826 += 1),
              makeJsonResponse({
                status: "success",
                results: [
                  { url: "https://img.example.com/apimart-success-ack.png" },
                ],
              })
            );
          if (v832 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/apimart-success-ack.png" });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v832);
        }));
      const { clearApiConfig: v833 } = await import("./configApi.js");
      v833();
      const { generateImage: v834 } = await import("./aiImageApi.js"),
        v835 = await v834(
          {
            provider: "apimart",
            model: "apimart/nano-banana-2",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v836) => v825["push"](v836) },
        );
      (strict["equal"](v825["length"], 1),
        strict["equal"](v825[0]["taskId"], "task-apimart-success-ack"),
        strict["ok"](v826 >= 1),
        strict["equal"](v835["localPath"], "output/apimart-success-ack.png"));
    } finally {
      ((globalThis["fetch"] = v822),
        (globalThis["setTimeout"] = v823),
        (globalThis["window"] = v824));
    }
  }),
  test("aiImageApi: apimart create response with invalid only id should not be accepted", async () => {
    const v837 = globalThis["fetch"],
      v838 = globalThis["setTimeout"],
      v839 = globalThis["window"],
      v840 = [];
    let v841 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v842, v843, ...v844) =>
          v838(v842, Number(v843) > 5000 ? Number(v843) : 0, ...v844)),
        (globalThis["fetch"] = async (v845, v846 = {}) => {
          const v847 = String(v845);
          if (v847 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v847 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                status: "success",
                data: { id: "resp-apimart-only-id-1", status: "submitted" },
              }),
            );
          if (v847["startsWith"]("/api/v2/proxy/task?"))
            return (
              (v841 += 1),
              makeJsonResponse(
                { code: 400, message: "invalid task id" },
                { status: 400 },
              )
            );
          if (v847 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/apimart-only-id.png" });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v847);
        }));
      const { clearApiConfig: v848 } = await import("./configApi.js");
      v848();
      const { generateImage: v849 } = await import("./aiImageApi.js");
      (await strict["rejects"](
        () =>
          v849(
            {
              provider: "apimart",
              model: "apimart/nano-banana-2",
              prompt: "cat",
              inputUrls: [],
            },
            { onTaskMeta: (v850) => v840["push"](v850) },
          ),
        /APIMart|task|id|提取|解析/i,
      ),
        strict["equal"](v840["length"], 0),
        strict["ok"](v841 >= 1));
    } finally {
      ((globalThis["fetch"] = v837),
        (globalThis["setTimeout"] = v838),
        (globalThis["window"] = v839));
    }
  }),
  test("aiImageApi: grsai gpt-image-2 创建走 /v1/api/generate 且查询走 /v1/api/result", async () => {
    const v851 = globalThis["fetch"],
      v852 = globalThis["setTimeout"],
      v853 = globalThis["window"],
      v854 = [];
    let v855 = false,
      v856 = false;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v857, v858, ...v859) =>
          v852(v857, Number(v858) > 5000 ? Number(v858) : 0, ...v859)),
        (globalThis["fetch"] = async (v860, v861 = {}) => {
          const v862 = String(v860);
          if (v862 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com/v1/",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v862 === "/api/v2/proxy/image") {
            const v863 = JSON["parse"](String(v861["body"] || "{}")),
              v864 = String(v863["apiUrl"] || "");
            if (v864["endsWith"]("/v1/api/generate"))
              return (
                (v855 = true),
                strict["equal"](v863["model"], "gpt-image-2-vip"),
                strict["deepEqual"](v863["images"], []),
                strict["equal"](v863["replyType"], "json"),
                strict["equal"](v863["aspectRatio"], "2880x2880"),
                strict["equal"](v863["imageSize"], undefined),
                makeTextResponse(
                  JSON["stringify"]({
                    status: "pending",
                    data: { task_id: "task-grsai-gpt-image-2-1" },
                  }),
                )
              );
            throw new Error("unexpected apiUrl: " + v864);
          }
          if (v862["startsWith"]("/api/v2/proxy/task?")) {
            const v865 = getProxyTaskApiUrl(v862);
            return (
              (v856 = true),
              strict["equal"](
                v865,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-gpt-image-2-1",
              ),
              makeJsonResponse({
                id: "task-grsai-gpt-image-2-1",
                status: "succeeded",
                results: [
                  {
                    url: "https://img.example.com/grsai-gpt-image-2-final.png",
                  },
                ],
              })
            );
          }
          if (v862 === "/api/v2/save_output_from_url")
            return makeJsonResponse({
              path: "output/grsai-gpt-image-2-final.png",
            });
          throw new Error("unexpected fetch url: " + v862);
        }));
      const { clearApiConfig: v866 } = await import("./configApi.js");
      v866();
      const { generateImage: v867 } = await import("./aiImageApi.js"),
        v868 = await v867(
          {
            provider: "grsai",
            model: "gpt-image-2",
            mode: "vip",
            prompt: "cat",
            imageSize: "4K",
            inputUrls: [],
          },
          { onTaskMeta: (v869) => v854["push"](v869) },
        );
      (strict["equal"](v855, true),
        strict["equal"](v856, true),
        strict["equal"](v854["length"], 1),
        strict["equal"](v854[0]["taskId"], "task-grsai-gpt-image-2-1"),
        strict["equal"](v854[0]["provider"], "grsai"),
        strict["equal"](
          v868["localPath"],
          "output/grsai-gpt-image-2-final.png",
        ),
        strict["equal"](
          v868["imageUrl"],
          "/output/grsai-gpt-image-2-final.png",
        ));
    } finally {
      ((globalThis["fetch"] = v851),
        (globalThis["setTimeout"] = v852),
        (globalThis["window"] = v853));
    }
  }),
  test("aiImageApi: apimart request_id should be probed and rejected when it is not a task id", async () => {
    const v870 = globalThis["fetch"],
      v871 = globalThis["setTimeout"],
      v872 = globalThis["window"],
      v873 = [];
    let v874 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v875, v876, ...v877) =>
          v871(v875, Number(v876) > 5000 ? Number(v876) : 0, ...v877)),
        (globalThis["fetch"] = async (v878, v879 = {}) => {
          const v880 = String(v878);
          if (v880 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v880 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                status: "success",
                data: {
                  request_id: "req-apimart-not-task",
                  status: "submitted",
                },
              }),
            );
          if (v880["startsWith"]("/api/v2/proxy/task?"))
            return (
              (v874 += 1),
              makeJsonResponse(
                { code: 400, message: "Invalid task ID" },
                { status: 400 },
              )
            );
          if (v880 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/should-not-save.png" });
          throw new Error("unexpected fetch url: " + v880);
        }));
      const { clearApiConfig: v881 } = await import("./configApi.js");
      v881();
      const { generateImage: v882 } = await import("./aiImageApi.js");
      (await strict["rejects"](
        () =>
          v882(
            {
              provider: "apimart",
              model: "apimart/nano-banana-2",
              prompt: "cat",
              inputUrls: [],
            },
            { onTaskMeta: (v883) => v873["push"](v883) },
          ),
        /APIMart|task|id|提取|解析|图片地址/i,
      ),
        strict["equal"](v873["length"], 0),
        strict["equal"](v874, 0));
    } finally {
      ((globalThis["fetch"] = v870),
        (globalThis["setTimeout"] = v871),
        (globalThis["window"] = v872));
    }
  }),
  test("aiImageApi: apimart create response with only id probes task endpoint before polling", async () => {
    const v884 = globalThis["fetch"],
      v885 = globalThis["setTimeout"],
      v886 = globalThis["window"],
      v887 = [];
    let v888 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v889, v890, ...v891) =>
          v885(v889, Number(v890) > 5000 ? Number(v890) : 0, ...v891)),
        (globalThis["fetch"] = async (v892, v893 = {}) => {
          const v894 = String(v892);
          if (v894 === "/api/config")
            return makeJsonResponse({
              providers: {
                apimart: {
                  apiUrl: "https://api.apimart.ai",
                  apiKey: "k_apimart",
                },
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v894 === "/api/v2/proxy/image")
            return makeTextResponse(
              JSON["stringify"]({
                status: "success",
                data: { id: "task-apimart-only-id-valid", status: "submitted" },
              }),
            );
          if (v894["startsWith"]("/api/v2/proxy/task?"))
            return (
              (v888 += 1),
              strict["ok"](
                v894["includes"](
                  encodeURIComponent(
                    "https://api.apimart.ai/v1/tasks/task-apimart-only-id-valid?language=zh",
                  ),
                ),
              ),
              makeJsonResponse(
                v888 === 1
                  ? { status: "running" }
                  : {
                      status: "success",
                      results: [
                        {
                          url: "https://img.example.com/apimart-only-id-valid.png",
                        },
                      ],
                    },
              )
            );
          if (v894 === "/api/v2/save_output_from_url")
            return makeJsonResponse({
              path: "output/apimart-only-id-valid.png",
            });
          throw new Error("unexpected\x20fetch\x20url:\x20" + v894);
        }));
      const { clearApiConfig: v895 } = await import("./configApi.js");
      v895();
      const { generateImage: v896 } = await import("./aiImageApi.js"),
        v897 = await v896(
          {
            provider: "apimart",
            model: "apimart/nano-banana-2",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v898) => v887["push"](v898) },
        );
      (strict["equal"](v887["length"], 1),
        strict["equal"](v887[0]["taskId"], "task-apimart-only-id-valid"),
        strict["ok"](v888 >= 2),
        strict["equal"](v897["localPath"], "output/apimart-only-id-valid.png"));
    } finally {
      ((globalThis["fetch"] = v884),
        (globalThis["setTimeout"] = v885),
        (globalThis["window"] = v886));
    }
  }),
  test("aiImageApi:\x20grsai\x20stops\x20immediately\x20when\x20polling\x20returns\x20sensitive\x20content\x20violation", async () => {
    const v899 = globalThis["fetch"],
      v900 = globalThis["setTimeout"],
      v901 = globalThis["window"],
      v902 = [];
    let v903 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v904, v905, ...v906) =>
          v900(v904, Number(v905) > 5000 ? Number(v905) : 0, ...v906)),
        (globalThis["fetch"] = async (v907, v908 = {}) => {
          const v909 = String(v907);
          if (v909 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v909 === "/api/v2/proxy/image") {
            const v910 = JSON["parse"](String(v908["body"] || "{}")),
              v911 = String(v910["apiUrl"] || "");
            if (v911["endsWith"]("/v1/api/generate"))
              return makeTextResponse(
                JSON["stringify"]({
                  status: "pending",
                  data: { task_id: "task-grsai-sensitive-1" },
                }),
              );
            throw new Error("unexpected apiUrl: " + v911);
          }
          if (v909["startsWith"]("/api/v2/proxy/task?")) {
            const v912 = getProxyTaskApiUrl(v909);
            return (
              (v903 += 1),
              strict["equal"](
                v912,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-sensitive-1",
              ),
              makeJsonResponse({
                status: "pending",
                message:
                  "The input or output was flagged as sensitive. Please try again with different inputs.",
                data: { id: "task-grsai-sensitive-1" },
              })
            );
          }
          if (v909 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/should-not-save.png" });
          throw new Error("unexpected fetch url: " + v909);
        }));
      const { clearApiConfig: v913 } = await import("./configApi.js");
      v913();
      const { generateImage: v914 } = await import("./aiImageApi.js");
      (await strict["rejects"](
        () =>
          v914(
            {
              provider: "grsai",
              model: "nano-banana-pro-vt",
              prompt: "cat",
              inputUrls: [],
            },
            { onTaskMeta: (v915) => v902["push"](v915) },
          ),
        /过滤|违规|sensitive/i,
      ),
        strict["equal"](v902["length"], 1),
        strict["equal"](v902[0]["taskId"], "task-grsai-sensitive-1"),
        strict["equal"](v903, 1));
    } finally {
      ((globalThis["fetch"] = v899),
        (globalThis["setTimeout"] = v900),
        (globalThis["window"] = v901));
    }
  }),
  test("aiImageApi:\x20grsai\x20轮询只走\x20/v1/api/result\x20并最终落盘", async () => {
    const v916 = globalThis["fetch"],
      v917 = globalThis["setTimeout"],
      v918 = globalThis["window"],
      v919 = [];
    let v920 = 0;
    try {
      ((globalThis["window"] = {
        currentProjectId: "proj-test",
        location: { href: "http://localhost/" },
      }),
        (globalThis["setTimeout"] = (v921, v922, ...v923) =>
          v917(v921, Number(v922) > 5000 ? Number(v922) : 0, ...v923)),
        (globalThis["fetch"] = async (v924, v925 = {}) => {
          const v926 = String(v924);
          if (v926 === "/api/config")
            return makeJsonResponse({
              providers: {
                grsai: {
                  apiUrl: "https://api.grsai.example.com",
                  apiKey: "k_grsai",
                },
              },
            });
          if (v926 === "/api/v2/proxy/image") {
            const v927 = JSON["parse"](String(v925["body"] || "{}")),
              v928 = String(v927["apiUrl"] || "");
            if (v928["endsWith"]("/v1/api/generate"))
              return makeTextResponse(
                JSON["stringify"]({
                  status: "pending",
                  data: { task_id: "task-grsai-probe-1" },
                }),
              );
            throw new Error("unexpected apiUrl: " + v928);
          }
          if (v926["startsWith"]("/api/v2/proxy/task?")) {
            const v929 = getProxyTaskApiUrl(v926);
            return (
              (v920 += 1),
              strict["equal"](
                v929,
                "https://api.grsai.example.com/v1/api/result?id=task-grsai-probe-1",
              ),
              makeJsonResponse({
                id: "task-grsai-probe-1",
                status: "succeeded",
                results: [
                  { url: "https://img.example.com/grsai-probe-final.png" },
                ],
              })
            );
          }
          if (v926 === "/api/v2/save_output_from_url")
            return makeJsonResponse({ path: "output/grsai-probe-final.png" });
          throw new Error("unexpected fetch url: " + v926);
        }));
      const { clearApiConfig: v930 } = await import("./configApi.js");
      v930();
      const { generateImage: v931 } = await import("./aiImageApi.js"),
        v932 = await v931(
          {
            provider: "grsai",
            model: "nano-banana-pro-vt",
            prompt: "cat",
            inputUrls: [],
          },
          { onTaskMeta: (v933) => v919["push"](v933) },
        );
      (strict["equal"](v919["length"], 1),
        strict["equal"](v919[0]["taskId"], "task-grsai-probe-1"),
        strict["equal"](v920, 1),
        strict["equal"](v932["localPath"], "output/grsai-probe-final.png"),
        strict["equal"](v932["imageUrl"], "/output/grsai-probe-final.png"));
    } finally {
      ((globalThis["fetch"] = v916),
        (globalThis["setTimeout"] = v917),
        (globalThis["window"] = v918));
    }
  }));

import test from "node:test";
import strict from "node:assert/strict";
import { resolveModelExecution } from "../src/manifests/index.js";
function makeJsonResponse(v0, v1 = 200) {
  return {
    ok: v1 >= 200 && v1 < 300,
    status: v1,
    headers: {
      get(v2) {
        return String(v2 || "")["toLowerCase"]() === "content-type"
          ? "application/json"
          : null;
      },
    },
    json: async () => v0,
    text: async () => JSON["stringify"](v0),
  };
}
async function readUploadedAudioMarker(v3) {
  if (!v3 || typeof v3["entries"] !== "function") return "";
  for (const [v4, v5] of v3["entries"]()) {
    if (v4 === "file" && v5 && typeof v5["text"] === "function")
      return await v5["text"]();
  }
  return "";
}
function buildPayload() {
  return {
    provider: "runninghubwf",
    audioWorkflowKey: "indextts2_clone",
    prompt: "test audio",
    audioRefs: [
      { refSlot: "audioRef", url: "https://www.runninghub.cn/assets/ref.mp3" },
    ],
    textInputs: [],
  };
}
(test("aiAudioApi: 音频上传失败不会压缩槽位导致参考音色错位", async () => {
  const v6 = globalThis["fetch"];
  try {
    globalThis["fetch"] = async (v7, v8 = {}) => {
      const v9 = String(v7);
      if (v9 === "/api/config")
        return makeJsonResponse({
          providers: { runninghub: { apiUrl: "https://x/", apiKey: "k_rh" } },
        });
      if (v9 === "https://audio.example/ref.mp3")
        return new Response(new Blob(["ref"]), { status: 200 });
      if (v9 === "https://audio.example/target.mp3")
        return new Response(new Blob(["target"]), { status: 200 });
      if (v9["startsWith"]("/api/v2/proxy/upload?")) {
        strict["equal"](v8["headers"]?.["Authorization"], "Bearer k_rh");
        const v10 = await readUploadedAudioMarker(v8["body"]);
        if (v10 === "ref")
          return makeJsonResponse({ code: 500, message: "upload failed" });
        return makeJsonResponse({
          code: 0,
          data: { download_url: "https://www.runninghub.cn/" + v10 + ".mp3" },
        });
      }
      if (v9 === "/api/v2/proxy/image")
        throw new Error("不应在参考音色上传失败后继续创建音频任务");
      throw new Error("unexpected fetch url: " + v9);
    };
    const { clearApiConfig: v11 } = await import("./configApi.js");
    v11();
    const { buildGenerateAudioRequest: v12 } = await import("./aiAudioApi.js");
    await strict["rejects"](
      () =>
        v12({
          provider: "runninghubwf",
          audioWorkflowKey: "indextts2_clone",
          prompt: "test\x20audio",
          audioRefs: [
            { refSlot: "audioRef", url: "https://audio.example/ref.mp3" },
            { refSlot: "audioTarget", url: "https://audio.example/target.mp3" },
          ],
        }),
      /indextts2音色克隆需要参考音色/,
    );
  } finally {
    globalThis["fetch"] = v6;
  }
}),
  test("aiAudioApi: 进阶声音克隆无音频时只提交 prompt 和 index=0", async () => {
    const v13 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v14) => {
        const v15 = String(v14);
        if (v15 === "/api/config")
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: "https://x/", apiKey: "k_rh" } },
          });
        throw new Error("unexpected fetch url: " + v15);
      };
      const { clearApiConfig: v16 } = await import("./configApi.js");
      v16();
      const { buildGenerateAudioRequest: v17 } =
          await import("./aiAudioApi.js"),
        v18 = await v17({
          provider: "runninghubwf",
          audioWorkflowKey: "advanced_voice_clone",
          prompt: "@音频1 你好 @音频2 回答",
          installId: "install-audio-1",
          audioRefs: [],
        });
      (strict["equal"](
        v18["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2050165249344585729",
      ),
        strict["equal"](v18["headers"]["X-AIC-Install-Id"], "install-audio-1"),
        strict["deepEqual"](v18["body"]["nodeInfoList"], [
          {
            nodeId: "33",
            fieldName: "prompt",
            fieldValue: "[speaker_1]: 你好\n[speaker_2]: 回答",
            description: "prompt",
          },
          {
            nodeId: "37",
            fieldName: "index",
            fieldValue: "0",
            description: "index",
          },
        ]));
    } finally {
      globalThis["fetch"] = v13;
    }
  }),
  test("aiAudioApi:\x20音频工作流请求从\x20manifest\x20mapping\x20生成\x20nodeInfoList", async () => {
    const v19 = resolveModelExecution("indextts2_clone"),
      v20 = resolveModelExecution("voice_convert"),
      v21 = resolveModelExecution("advanced_voice_clone");
    (strict["equal"](
      v19?.["executionManifest"]?.["mapping"]?.["promptNode"]?.["nodeId"],
      "87",
    ),
      strict["equal"](
        v20?.["executionManifest"]?.["mapping"]?.["targetAudioNode"]?.[
          "nodeId"
        ],
        "5",
      ),
      strict["equal"](
        v21?.["executionManifest"]?.["mapping"]?.["indexNode"]?.["nodeId"],
        "37",
      ));
  }),
  test("aiAudioApi:\x20进阶声音克隆兼容不带\x20@\x20的音频说话人标签", async () => {
    const v22 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v23) => {
        const v24 = String(v23);
        if (v24 === "/api/config")
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: "https://x/", apiKey: "k_rh" } },
          });
        throw new Error("unexpected fetch url: " + v24);
      };
      const { clearApiConfig: v25 } = await import("./configApi.js");
      v25();
      const { buildGenerateAudioRequest: v26 } =
          await import("./aiAudioApi.js"),
        v27 = await v26({
          provider: "runninghubwf",
          audioWorkflowKey: "advanced_voice_clone",
          prompt: "音频1 你今晚回不回家睡觉阿？ 音频2 不会了你自己睡吧",
          audioRefs: [],
        });
      strict["equal"](
        v27["body"]["nodeInfoList"]["find"]((v28) => v28["nodeId"] === "33")?.[
          "fieldValue"
        ],
        "[speaker_1]: 你今晚回不回家睡觉阿？\n[speaker_2]: 不会了你自己睡吧",
      );
    } finally {
      globalThis["fetch"] = v22;
    }
  }),
  test("aiAudioApi: 进阶声音克隆映射两个音频槽位和 index=2", async () => {
    const v29 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v30) => {
        const v31 = String(v30);
        if (v31 === "/api/config")
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: "https://x/", apiKey: "k_rh" } },
          });
        throw new Error("unexpected fetch url: " + v31);
      };
      const { clearApiConfig: v32 } = await import("./configApi.js");
      v32();
      const { buildGenerateAudioRequest: v33 } =
          await import("./aiAudioApi.js"),
        v34 = await v33({
          provider: "runninghubwf",
          audioWorkflowKey: "advanced_voice_clone",
          prompt: "对白",
          audioRefs: [
            {
              refSlot: "audio1",
              url: "https://www.runninghub.cn/assets/a1.mp3",
            },
            {
              refSlot: "audio2",
              url: "https://www.runninghub.cn/assets/a2.mp3",
            },
          ],
        });
      strict["deepEqual"](v34["body"]["nodeInfoList"], [
        {
          nodeId: "1",
          fieldName: "audio",
          fieldValue: "https://www.runninghub.cn/assets/a1.mp3",
          description: "audio",
        },
        {
          nodeId: "25",
          fieldName: "audio",
          fieldValue: "https://www.runninghub.cn/assets/a2.mp3",
          description: "audio",
        },
        {
          nodeId: "33",
          fieldName: "prompt",
          fieldValue: "对白",
          description: "prompt",
        },
        {
          nodeId: "37",
          fieldName: "index",
          fieldValue: "2",
          description: "index",
        },
      ]);
    } finally {
      globalThis["fetch"] = v29;
    }
  }),
  test("aiAudioApi: generateAudio 在创建任务后回调 onTaskMeta", async () => {
    const v35 = globalThis["fetch"],
      v36 = globalThis["setTimeout"],
      v37 = [];
    try {
      ((globalThis["setTimeout"] = (v38, v39, ...v40) =>
        v36(v38, Number(v39) > 5000 ? Number(v39) : 0, ...v40)),
        (globalThis["fetch"] = async (v41, v42 = {}) => {
          const v43 = String(v41);
          if (v43 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: "https://x/", apiKey: "k_rh" },
              },
            });
          if (v43 === "/api/v2/proxy/image") {
            const v44 = JSON["parse"](String(v42["body"] || "{}")),
              v45 = String(v44["apiUrl"] || "");
            if (v45["includes"]("/openapi/v2/run/ai-app/"))
              return makeJsonResponse({
                code: 0,
                data: { taskId: "audio-task-1" },
              });
            if (v45["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  result: { audioUrl: "https://cdn.example.com/final.mp3" },
                },
              });
          }
          throw new Error("unexpected fetch url: " + v43);
        }));
      const { clearApiConfig: v46 } = await import("./configApi.js");
      v46();
      const { generateAudio: v47 } = await import("./aiAudioApi.js"),
        v48 = await v47(buildPayload(), {
          onTaskMeta: (v49) => v37["push"](v49),
        });
      (strict["equal"](v37["length"], 1),
        strict["equal"](v37[0]["taskId"], "audio-task-1"),
        strict["equal"](v37[0]["useOpenapiQuery"], true),
        strict["equal"](v37[0]["apiKey"], "k_rh"),
        strict["equal"](v48["taskId"], "audio-task-1"),
        strict["equal"](v48["audioUrl"], "https://cdn.example.com/final.mp3"));
    } finally {
      ((globalThis["fetch"] = v35), (globalThis["setTimeout"] = v36));
    }
  }),
  test("aiAudioApi: generateAudio 支持 RunningHub 顶层 task_id", async () => {
    const v50 = globalThis["fetch"],
      v51 = globalThis["setTimeout"],
      v52 = [];
    try {
      ((globalThis["setTimeout"] = (v53, v54, ...v55) =>
        v51(v53, Number(v54) > 5000 ? Number(v54) : 0, ...v55)),
        (globalThis["fetch"] = async (v56, v57 = {}) => {
          const v58 = String(v56);
          if (v58 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: "https://x/", apiKey: "k_rh" },
              },
            });
          if (v58 === "/api/v2/proxy/image") {
            const v59 = JSON["parse"](String(v57["body"] || "{}")),
              v60 = String(v59["apiUrl"] || "");
            if (v60["includes"]("/openapi/v2/run/ai-app/"))
              return makeJsonResponse({ task_id: "audio-task-top-level-1" });
            if (v60["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  result: {
                    audioUrl: "https://cdn.example.com/final-top-level.mp3",
                  },
                },
              });
          }
          throw new Error("unexpected\x20fetch\x20url:\x20" + v58);
        }));
      const { clearApiConfig: v61 } = await import("./configApi.js");
      v61();
      const { generateAudio: v62 } = await import("./aiAudioApi.js"),
        v63 = await v62(buildPayload(), {
          onTaskMeta: (v64) => v52["push"](v64),
        });
      (strict["equal"](v52["length"], 1),
        strict["equal"](v52[0]["taskId"], "audio-task-top-level-1"),
        strict["equal"](v63["taskId"], "audio-task-top-level-1"),
        strict["equal"](
          v63["audioUrl"],
          "https://cdn.example.com/final-top-level.mp3",
        ));
    } finally {
      ((globalThis["fetch"] = v50), (globalThis["setTimeout"] = v51));
    }
  }),
  test("aiAudioApi:\x20generateAudio\x20将音频\x20VIP\x20拦截转换为订阅错误", async () => {
    const v65 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v66, v67 = {}) => {
        const v68 = String(v66);
        if (v68 === "/api/config")
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: "https://x/", apiKey: "k_rh" } },
          });
        if (v68 === "/api/v2/proxy/image") {
          const v69 = JSON["parse"](String(v67["body"] || "{}"));
          return (
            strict["equal"](
              v69["apiUrl"],
              "https://www.runninghub.cn/openapi/v2/run/ai-app/2050165249344585729",
            ),
            strict["equal"](
              v67["headers"]?.["X-AIC-Install-Id"],
              "install-audio-vip",
            ),
            makeJsonResponse({
              code: "SUBSCRIPTION_REQUIRED",
              message: "该模型为 VIP 模型，请先激活 CDKEY/订阅",
              requiredModelId: "runninghub/2050165249344585729",
              subscriptionStatus: "none",
              reasonCode: "MISSING_INSTALL_ID",
            })
          );
        }
        throw new Error("unexpected fetch url: " + v68);
      };
      const { clearApiConfig: v70 } = await import("./configApi.js");
      v70();
      const { generateAudio: v71 } = await import("./aiAudioApi.js");
      await strict["rejects"](
        () =>
          v71({
            provider: "runninghubwf",
            audioWorkflowKey: "advanced_voice_clone",
            prompt: "对白",
            installId: "install-audio-vip",
            audioRefs: [],
          }),
        (v72) => {
          return (
            strict["equal"](v72["code"], "SUBSCRIPTION_REQUIRED"),
            strict["equal"](
              v72["requiredModelId"],
              "runninghub/2050165249344585729",
            ),
            strict["equal"](v72["subscriptionStatus"], "none"),
            true
          );
        },
      );
    } finally {
      globalThis["fetch"] = v65;
    }
  }),
  test("aiAudioApi:\x20resumeRunningHubAudioTask\x20可从\x20query\x20落地结果", async () => {
    const v73 = globalThis["fetch"],
      v74 = globalThis["setTimeout"];
    try {
      ((globalThis["setTimeout"] = (v75, v76, ...v77) =>
        v74(v75, Number(v76) > 5000 ? Number(v76) : 0, ...v77)),
        (globalThis["fetch"] = async (v78, v79 = {}) => {
          const v80 = String(v78);
          if (v80 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: "https://x/", apiKey: "k_rh" },
              },
            });
          if (v80 === "/api/v2/proxy/image") {
            const v81 = JSON["parse"](String(v79["body"] || "{}"));
            if (String(v81["apiUrl"] || "")["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  results: [{ url: "https://cdn.example.com/resume.mp3" }],
                },
              });
          }
          throw new Error("unexpected fetch url: " + v80);
        }));
      const { clearApiConfig: v82 } = await import("./configApi.js");
      v82();
      const { resumeRunningHubAudioTask: v83 } =
          await import("./aiAudioApi.js"),
        v84 = await v83("audio-task-2", { apiKey: "k_rh" });
      (strict["equal"](v84["taskId"], "audio-task-2"),
        strict["equal"](v84["audioUrl"], "https://cdn.example.com/resume.mp3"));
    } finally {
      ((globalThis["fetch"] = v73), (globalThis["setTimeout"] = v74));
    }
  }),
  test("aiAudioApi:\x20RH\x20失败时保留错误文案并追加节点详情", async () => {
    const v85 = globalThis["fetch"],
      v86 = globalThis["setTimeout"];
    try {
      ((globalThis["setTimeout"] = (v87, v88, ...v89) =>
        v86(v87, Number(v88) > 5000 ? Number(v88) : 0, ...v89)),
        (globalThis["fetch"] = async (v90, v91 = {}) => {
          const v92 = String(v90);
          if (v92 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: "https://x/", apiKey: "k_rh" },
              },
            });
          if (v92 === "/api/v2/proxy/image") {
            const v93 = JSON["parse"](String(v91["body"] || "{}"));
            if (String(v93["apiUrl"] || "")["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                taskId: "audio-task-failed-1",
                status: "FAILED",
                errorCode: "805",
                errorMessage: "工作流运行失败",
                failedReason: { node_id: "992", exception_message: "Porn" },
              });
          }
          throw new Error("unexpected fetch url: " + v92);
        }));
      const { clearApiConfig: v94 } = await import("./configApi.js");
      v94();
      const { resumeRunningHubAudioTask: v95 } =
        await import("./aiAudioApi.js");
      await strict["rejects"](
        () => v95("audio-task-failed-1", { apiKey: "k_rh" }),
        (v96) => {
          const v97 = String(v96?.["message"] || "");
          return (
            strict["match"](v97, /工作流运行失败/),
            strict["match"](v97, /node_id: 992/),
            strict["match"](v97, /exception_message: Porn/),
            true
          );
        },
      );
    } finally {
      ((globalThis["fetch"] = v85), (globalThis["setTimeout"] = v86));
    }
  }),
  test("aiAudioApi: buildAudioSeparationRequest 会先上传本地音频并映射到 4/audio", async () => {
    const v98 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v99, v100 = {}) => {
        const v101 = String(v99);
        if (v101 === "/api/config")
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: "https://x/", apiKey: "k_rh" } },
          });
        if (v101 === "/output/input.wav")
          return new Response(
            new Blob(["local-split"], { type: "audio/wav" }),
            { status: 200 },
          );
        if (v101["startsWith"]("/api/v2/proxy/upload?")) {
          strict["equal"](v100["headers"]?.["Authorization"], "Bearer k_rh");
          const v102 = await readUploadedAudioMarker(v100["body"]);
          return (
            strict["equal"](v102, "local-split"),
            makeJsonResponse({
              code: 0,
              data: {
                download_url:
                  "https://www.runninghub.cn/uploaded/local-split.wav",
              },
            })
          );
        }
        throw new Error("unexpected\x20fetch\x20url:\x20" + v101);
      };
      const { clearApiConfig: v103 } = await import("./configApi.js");
      v103();
      const { buildAudioSeparationRequest: v104 } =
          await import("./aiAudioApi.js"),
        v105 = await v104({
          nodeId: "source-audio-1",
          audioUrl: "/output/input.wav",
          rhInstanceType: "plus",
        });
      (strict["equal"](
        v105["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2047408096384917505",
      ),
        strict["equal"](v105["body"]["instanceType"], "plus"),
        strict["equal"](v105["body"]["usePersonalQueue"], "false"),
        strict["equal"](v105["meta"]?.["adapterTrace"]?.["source"], "manifest"),
        strict["equal"](
          v105["meta"]?.["adapterTrace"]?.["executionId"],
          "runninghub.workflow.audio-separation.v1",
        ),
        strict["deepEqual"](v105["body"]["nodeInfoList"], [
          {
            nodeId: "4",
            fieldName: "audio",
            fieldValue: "https://www.runninghub.cn/uploaded/local-split.wav",
            description: "audio",
          },
        ]));
    } finally {
      globalThis["fetch"] = v98;
    }
  }),
  test("aiAudioApi:\x20buildAudioSeparationRequest\x20对远端音频也会先走\x20RH\x20上传", async () => {
    const v106 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v107, v108 = {}) => {
        const v109 = String(v107);
        if (v109 === "/api/config")
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: "https://x/", apiKey: "k_rh" } },
          });
        if (v109 === "https://audio.example.com/input.mp3")
          return new Response(
            new Blob(["remote-split"], { type: "audio/mpeg" }),
            { status: 200 },
          );
        if (v109["startsWith"]("/api/v2/proxy/upload?")) {
          strict["equal"](v108["headers"]?.["Authorization"], "Bearer k_rh");
          const v110 = await readUploadedAudioMarker(v108["body"]);
          return (
            strict["equal"](v110, "remote-split"),
            makeJsonResponse({
              code: 0,
              data: {
                download_url:
                  "https://www.runninghub.cn/uploaded/remote-split.mp3",
              },
            })
          );
        }
        throw new Error("unexpected fetch url: " + v109);
      };
      const { clearApiConfig: v111 } = await import("./configApi.js");
      v111();
      const { buildAudioSeparationRequest: v112 } =
          await import("./aiAudioApi.js"),
        v113 = await v112({ audioUrl: "https://audio.example.com/input.mp3" });
      strict["equal"](
        v113["body"]["nodeInfoList"][0]?.["fieldValue"],
        "https://www.runninghub.cn/uploaded/remote-split.mp3",
      );
    } finally {
      globalThis["fetch"] = v106;
    }
  }),
  test("aiAudioApi: runAudioSeparation 会按 nodeId 映射人声与背景声", async () => {
    const v114 = globalThis["fetch"],
      v115 = globalThis["setTimeout"];
    try {
      ((globalThis["setTimeout"] = (v116, v117, ...v118) =>
        v115(v116, Number(v117) > 5000 ? Number(v117) : 0, ...v118)),
        (globalThis["fetch"] = async (v119, v120 = {}) => {
          const v121 = String(v119);
          if (v121 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: "https://x/", apiKey: "k_rh" },
              },
            });
          if (v121 === "/output/source.mp3")
            return new Response(
              new Blob(["split-order"], { type: "audio/mpeg" }),
              { status: 200 },
            );
          if (v121["startsWith"]("/api/v2/proxy/upload?"))
            return makeJsonResponse({
              code: 0,
              data: {
                download_url: "https://www.runninghub.cn/uploaded/source.mp3",
              },
            });
          if (v121 === "/api/v2/proxy/image") {
            const v122 = JSON["parse"](String(v120["body"] || "{}")),
              v123 = String(v122["apiUrl"] || "");
            if (v123["includes"]("/openapi/v2/run/ai-app/"))
              return makeJsonResponse({
                code: 0,
                data: { taskId: "split-task-1" },
              });
            if (v123["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  results: [
                    {
                      nodeId: "7",
                      url: "https://cdn.example.com/background.mp3",
                    },
                    { nodeId: "5", url: "https://cdn.example.com/vocals.mp3" },
                  ],
                },
              });
          }
          throw new Error("unexpected fetch url: " + v121);
        }));
      const { clearApiConfig: v124 } = await import("./configApi.js");
      v124();
      const { runAudioSeparation: v125 } = await import("./aiAudioApi.js"),
        v126 = await v125({ audioUrl: "/output/source.mp3" });
      (strict["equal"](v126["taskId"], "split-task-1"),
        strict["equal"](
          v126["audios"][0]["audioUrl"],
          "https://cdn.example.com/vocals.mp3",
        ),
        strict["equal"](v126["audios"][0]["nodeId"], "5"),
        strict["equal"](v126["audios"][0]["role"], "vocals"),
        strict["equal"](
          v126["audios"][1]["audioUrl"],
          "https://cdn.example.com/background.mp3",
        ),
        strict["equal"](v126["audios"][1]["nodeId"], "7"),
        strict["equal"](v126["audios"][1]["role"], "background"),
        strict["equal"](v126["audioUrl"], "https://cdn.example.com/vocals.mp3"),
        strict["equal"](
          v126["vocalsAudioUrl"],
          "https://cdn.example.com/vocals.mp3",
        ),
        strict["equal"](
          v126["backgroundAudioUrl"],
          "https://cdn.example.com/background.mp3",
        ));
    } finally {
      ((globalThis["fetch"] = v114), (globalThis["setTimeout"] = v115));
    }
  }),
  test("aiAudioApi: resumeAudioSeparationTask 会按 nodeId 映射人声与背景声", async () => {
    const v127 = globalThis["fetch"],
      v128 = globalThis["setTimeout"];
    try {
      ((globalThis["setTimeout"] = (v129, v130, ...v131) =>
        v128(v129, Number(v130) > 5000 ? Number(v130) : 0, ...v131)),
        (globalThis["fetch"] = async (v132, v133 = {}) => {
          const v134 = String(v132);
          if (v134 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: "https://x/", apiKey: "k_rh" },
              },
            });
          if (v134 === "/api/v2/proxy/image") {
            const v135 = JSON["parse"](String(v133["body"] || "{}"));
            if (String(v135["apiUrl"] || "")["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  results: [
                    {
                      nodeId: "7",
                      url: "https://cdn.example.com/resume-background.mp3",
                    },
                    {
                      nodeId: "5",
                      url: "https://cdn.example.com/resume-vocals.mp3",
                    },
                  ],
                },
              });
          }
          throw new Error("unexpected fetch url: " + v134);
        }));
      const { clearApiConfig: v136 } = await import("./configApi.js");
      v136();
      const { resumeAudioSeparationTask: v137 } =
          await import("./aiAudioApi.js"),
        v138 = await v137("split-task-2", { apiKey: "k_rh" });
      (strict["equal"](
        v138["audios"][0]["audioUrl"],
        "https://cdn.example.com/resume-vocals.mp3",
      ),
        strict["equal"](v138["audios"][0]["nodeId"], "5"),
        strict["equal"](
          v138["audios"][1]["audioUrl"],
          "https://cdn.example.com/resume-background.mp3",
        ),
        strict["equal"](v138["audios"][1]["nodeId"], "7"),
        strict["equal"](
          v138["vocalsAudioUrl"],
          "https://cdn.example.com/resume-vocals.mp3",
        ),
        strict["equal"](
          v138["backgroundAudioUrl"],
          "https://cdn.example.com/resume-background.mp3",
        ));
    } finally {
      ((globalThis["fetch"] = v127), (globalThis["setTimeout"] = v128));
    }
  }),
  test("aiAudioApi: resumeAudioSeparationTask 少于两条结果会报错", async () => {
    const v139 = globalThis["fetch"],
      v140 = globalThis["setTimeout"];
    try {
      ((globalThis["setTimeout"] = (v141, v142, ...v143) =>
        v140(v141, Number(v142) > 5000 ? Number(v142) : 0, ...v143)),
        (globalThis["fetch"] = async (v144, v145 = {}) => {
          const v146 = String(v144);
          if (v146 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: "https://x/", apiKey: "k_rh" },
              },
            });
          if (v146 === "/api/v2/proxy/image") {
            const v147 = JSON["parse"](String(v145["body"] || "{}"));
            if (String(v147["apiUrl"] || "")["includes"]("/openapi/v2/query"))
              return makeJsonResponse({
                code: 0,
                data: {
                  status: "SUCCESS",
                  results: [{ url: "https://cdn.example.com/only-one.mp3" }],
                },
              });
          }
          throw new Error("unexpected fetch url: " + v146);
        }));
      const { clearApiConfig: v148 } = await import("./configApi.js");
      v148();
      const { resumeAudioSeparationTask: v149 } =
        await import("./aiAudioApi.js");
      await strict["rejects"](
        () => v149("split-task-2", { apiKey: "k_rh" }),
        /未提取到人声和背景声音频地址/,
      );
    } finally {
      ((globalThis["fetch"] = v139), (globalThis["setTimeout"] = v140));
    }
  }),
  test("aiAudioApi: generateAudio signal abort 不会误判为失败", async () => {
    const v150 = globalThis["fetch"];
    try {
      globalThis["fetch"] = async (v151, v152 = {}) => {
        const v153 = String(v151);
        if (v153 === "/api/config")
          return makeJsonResponse({
            providers: { runninghub: { apiUrl: "https://x/", apiKey: "k_rh" } },
          });
        if (v153 === "/api/v2/proxy/image") {
          const v154 = JSON["parse"](String(v152["body"] || "{}"));
          if (
            String(v154["apiUrl"] || "")["includes"]("/openapi/v2/run/ai-app/")
          )
            return makeJsonResponse({
              code: 0,
              data: { taskId: "audio-task-3" },
            });
        }
        throw new Error("unexpected\x20fetch\x20url:\x20" + v153);
      };
      const { clearApiConfig: v155 } = await import("./configApi.js");
      v155();
      const { generateAudio: v156 } = await import("./aiAudioApi.js"),
        v157 = new AbortController();
      await strict["rejects"](
        () =>
          v156(buildPayload(), {
            signal: v157["signal"],
            onTaskMeta: () => v157["abort"](),
          }),
        (v158) => v158?.["message"] === "CANCELLED",
      );
    } finally {
      globalThis["fetch"] = v150;
    }
  }),
  test("aiAudioApi: resumeRunningHubAudioTask 支持 signal abort", async () => {
    const v159 = globalThis["fetch"],
      v160 = globalThis["setTimeout"];
    try {
      ((globalThis["setTimeout"] = (v161, v162, ...v163) =>
        v160(v161, Number(v162) > 5000 ? Number(v162) : 0, ...v163)),
        (globalThis["fetch"] = async (v164, v165 = {}) => {
          const v166 = String(v164);
          if (v166 === "/api/config")
            return makeJsonResponse({
              providers: {
                runninghub: { apiUrl: "https://x/", apiKey: "k_rh" },
              },
            });
          if (v166 === "/api/v2/proxy/image") {
            const v167 = JSON["parse"](String(v165["body"] || "{}"));
            if (String(v167["apiUrl"] || "")["includes"]("/openapi/v2/query"))
              return makeJsonResponse({ code: 0, data: { status: "RUNNING" } });
          }
          throw new Error("unexpected\x20fetch\x20url:\x20" + v166);
        }));
      const { clearApiConfig: v168 } = await import("./configApi.js");
      v168();
      const { resumeRunningHubAudioTask: v169 } =
          await import("./aiAudioApi.js"),
        v170 = new AbortController();
      (setTimeout(() => v170["abort"](), 0),
        await strict["rejects"](
          () =>
            v169(
              "audio-task-4",
              { apiKey: "k_rh" },
              { signal: v170["signal"] },
            ),
          (v171) => v171?.["message"] === "CANCELLED",
        ));
    } finally {
      ((globalThis["fetch"] = v159), (globalThis["setTimeout"] = v160));
    }
  }));

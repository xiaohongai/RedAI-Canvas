import test from "node:test";
import strict from "node:assert/strict";
const originalFetch = globalThis["fetch"];
function jsonResponse(v0) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => v0,
    text: async () => JSON["stringify"](v0),
  };
}
(test("dreaminaGenApi: submit text2image", async () => {
  try {
    globalThis["fetch"] = async (v1, v2 = {}) => {
      (strict["equal"](String(v1), "/api/v2/dreamina/text2image"),
        strict["equal"](String(v2["method"] || "GET"), "POST"));
      const v3 = JSON["parse"](String(v2["body"] || "{}"));
      return (
        strict["equal"](v3["prompt"], "cat"),
        jsonResponse({ success: true, submitId: "sid1", genStatus: "querying" })
      );
    };
    const { submitDreaminaText2Image: v4 } =
        await import("./dreaminaGenApi.js"),
      v5 = await v4({ prompt: "cat" });
    strict["equal"](v5["submitId"], "sid1");
  } finally {
    globalThis["fetch"] = originalFetch;
  }
}),
  test("dreaminaGenApi:\x20query_result\x20url\x20includes\x20submitId", async () => {
    try {
      globalThis["fetch"] = async (v6, v7 = {}) => {
        return (
          strict["match"](
            String(v6),
            /\/api\/v2\/dreamina\/query_result\?submitId=sid2&autoDownload=1$/,
          ),
          strict["equal"](String(v7["method"] || "GET"), "GET"),
          jsonResponse({
            success: true,
            submitId: "sid2",
            status: "pending",
            outputs: [],
          })
        );
      };
      const { queryDreaminaResult: v8 } = await import("./dreaminaGenApi.js"),
        v9 = await v8("sid2", { autoDownload: true });
      strict["equal"](v9["status"], "pending");
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi:\x20normalizeDreaminaErrorMessage\x20explains\x20CLI\x20request\x20timeout", async () => {
    const { normalizeDreaminaErrorMessage: v10 } =
        await import("./dreaminaGenApi.js"),
      v11 =
        'do request: Post "https://jimeng.jianying.com/dreamina/cli/v1/image_generate?cli_version=fa7ede2&from=dreamina_cli": context deadline exceeded (Client.Timeout exceeded while awaiting headers)';
    strict["equal"](
      v10(v11),
      "即梦官方生成接口响应超时，本次没有拿到任务ID。网页可用不代表\x20CLI\x20生成接口稳定，请稍后重试；如果连续出现，请切换网络/代理或重新登录即梦后再试。",
    );
  }),
  test("dreaminaGenApi: normalizeDreaminaTaskSnapshot pending + waiting => queued", async () => {
    const { normalizeDreaminaTaskSnapshot: v12 } =
        await import("./dreaminaGenApi.js"),
      v13 = v12({
        submitId: "sid-q1",
        status: "pending",
        outputs: [],
        raw: { queue_status: "waiting", queue_idx: 3, queue_length: 12 },
      });
    (strict["equal"](v13["status"], "pending"),
      strict["equal"](v13["phase"], "queued"),
      strict["equal"](v13["label"], "排队中"),
      strict["equal"](v13["queueIndex"], 3),
      strict["equal"](v13["queueLength"], 12));
  }),
  test("dreaminaGenApi: normalizeDreaminaTaskSnapshot success + empty outputs => syncing", async () => {
    const { normalizeDreaminaTaskSnapshot: v14 } =
        await import("./dreaminaGenApi.js"),
      v15 = v14({
        submitId: "sid-s1",
        status: "success",
        outputs: [],
        raw: { queue_status: "Finish" },
      });
    (strict["equal"](v15["status"], "pending"),
      strict["equal"](v15["phase"], "syncing"),
      strict["equal"](v15["label"], "正在同步结果"),
      strict["equal"](v15["hasOutputs"], false));
  }),
  test("dreaminaGenApi:\x20normalizeDreaminaTaskSnapshot\x20success\x20+\x20outputs\x20=>\x20done", async () => {
    const { normalizeDreaminaTaskSnapshot: v16 } =
        await import("./dreaminaGenApi.js"),
      v17 = v16({
        submitId: "sid-s2",
        status: "success",
        outputs: [{ localPath: "output/dreamina/text2video/c.mp4" }],
      });
    (strict["equal"](v17["status"], "success"),
      strict["equal"](v17["phase"], "done"),
      strict["equal"](v17["label"], "已完成"),
      strict["equal"](v17["hasOutputs"], true));
  }),
  test("dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes nested Dreamina image outputs", async () => {
    const { normalizeDreaminaTaskSnapshot: v18 } =
        await import("./dreaminaGenApi.js"),
      v19 = v18({
        submitId: "sid-nested-output",
        status: "success",
        outputs: [],
        raw: {
          queryResult: {
            gen_status: "success",
            data: {
              image_list: [
                { image_url: "https://example.com/dreamina-result.png" },
              ],
            },
          },
        },
      });
    (strict["equal"](v19["status"], "success"),
      strict["equal"](v19["phase"], "done"),
      strict["equal"](v19["hasOutputs"], true),
      strict["equal"](
        v19["outputs"][0]["url"],
        "https://example.com/dreamina-result.png",
      ));
  }),
  test("dreaminaGenApi: normalizeDreaminaTaskSnapshot raw fail overrides success empty outputs", async () => {
    const { normalizeDreaminaTaskSnapshot: v20 } =
        await import("./dreaminaGenApi.js"),
      v21 = v20({
        submitId: "sid-raw-fail",
        status: "success",
        outputs: [],
        raw: {
          queryResult: {
            gen_status: "fail",
            fail_reason: "generation failed: final generation failed",
            queue_info: { queue_status: "Finish" },
          },
        },
      });
    (strict["equal"](v21["status"], "failed"),
      strict["equal"](v21["phase"], "failed"),
      strict["equal"](
        v21["failReason"],
        "generation failed: final generation failed",
      ),
      strict["equal"](
        v21["label"],
        "generation failed: final generation failed",
      ));
  }),
  test("dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes top-level fail aliases", async () => {
    const { normalizeDreaminaTaskSnapshot: v22 } =
        await import("./dreaminaGenApi.js"),
      v23 = v22({
        submitId: "sid-top-fail",
        status: "fail",
        outputs: [],
        message: "内容安全审核未通过",
      });
    (strict["equal"](v23["status"], "failed"),
      strict["equal"](v23["phase"], "failed"),
      strict["equal"](v23["failReason"], "内容安全审核未通过"));
  }),
  test("dreaminaGenApi: normalizeDreaminaTaskSnapshot treats terminal raw message as failed", async () => {
    const { normalizeDreaminaTaskSnapshot: v24 } =
        await import("./dreaminaGenApi.js"),
      v25 = v24({
        submitId: "sid-raw-message-fail",
        status: "pending",
        outputs: [],
        raw: {
          queryResult: {
            gen_status: "querying",
            message: "平台返回：不符合平台规则，不予生成",
          },
        },
      });
    (strict["equal"](v25["status"], "failed"),
      strict["equal"](v25["phase"], "failed"),
      strict["equal"](v25["failReason"], "平台返回：不符合平台规则，不予生成"));
  }),
  test("dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes nested raw data failure", async () => {
    const { normalizeDreaminaTaskSnapshot: v26 } =
        await import("./dreaminaGenApi.js"),
      v27 = v26({
        submitId: "sid-nested-raw-fail",
        status: "success",
        outputs: [],
        raw: {
          data: {
            gen_status: "failed",
            message: "generation\x20failed:\x20final\x20generation\x20failed",
          },
        },
      });
    (strict["equal"](v27["status"], "failed"),
      strict["equal"](v27["phase"], "failed"),
      strict["equal"](
        v27["failReason"],
        "generation failed: final generation failed",
      ));
  }),
  test("dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes raw listTask array failure", async () => {
    const { normalizeDreaminaTaskSnapshot: v28 } =
        await import("./dreaminaGenApi.js"),
      v29 = v28({
        submitId: "sid-list-task-array-fail",
        status: "success",
        outputs: [],
        raw: {
          listTask: [
            {
              submit_id: "sid-list-task-array-fail",
              gen_status: "fail",
              fail_reason: "generation failed: final generation failed",
            },
          ],
        },
      });
    (strict["equal"](v29["status"], "failed"),
      strict["equal"](v29["phase"], "failed"),
      strict["equal"](
        v29["failReason"],
        "generation failed: final generation failed",
      ));
  }),
  test("dreaminaGenApi: normalizeDreaminaTaskSnapshot keeps non-terminal message pending", async () => {
    const { normalizeDreaminaTaskSnapshot: v30 } =
        await import("./dreaminaGenApi.js"),
      v31 = v30({
        submitId: "sid-raw-message-pending",
        status: "pending",
        outputs: [],
        raw: { queryResult: { gen_status: "querying", message: "任务排队中" } },
      });
    (strict["equal"](v31["status"], "pending"),
      strict["equal"](v31["phase"], "generating"),
      strict["equal"](v31["failReason"], ""));
  }),
  test("dreaminaGenApi: image generation raw fail throws fail_reason", async () => {
    try {
      globalThis["fetch"] = async (v32, v33 = {}) => {
        const v34 = String(v32);
        if (v34 === "/api/v2/dreamina/text2image")
          return (
            strict["equal"](String(v33["method"] || "GET"), "POST"),
            jsonResponse({ success: true, submitId: "sid-image-raw-fail" })
          );
        if (
          v34["startsWith"]("/api/v2/dreamina/query_result?") &&
          v34["includes"]("submitId=sid-image-raw-fail")
        )
          return jsonResponse({
            success: true,
            submitId: "sid-image-raw-fail",
            status: "success",
            outputs: [],
            raw: {
              queryResult: {
                gen_status: "fail",
                fail_reason: "generation failed: final generation failed",
                queue_info: { queue_status: "Finish" },
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + v34);
      };
      const { runDreaminaImageGeneration: v35 } =
        await import("./dreaminaGenApi.js");
      await strict["rejects"](
        () => v35({ prompt: "blocked", model: "dreamina/4.1" }),
        /generation failed: final generation failed/,
      );
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi: image generation nested raw data failure throws message", async () => {
    try {
      globalThis["fetch"] = async (v36, v37 = {}) => {
        const v38 = String(v36);
        if (v38 === "/api/v2/dreamina/text2image")
          return (
            strict["equal"](String(v37["method"] || "GET"), "POST"),
            jsonResponse({ success: true, submitId: "sid-image-nested-fail" })
          );
        if (
          v38["startsWith"]("/api/v2/dreamina/query_result?") &&
          v38["includes"]("submitId=sid-image-nested-fail")
        )
          return jsonResponse({
            success: true,
            submitId: "sid-image-nested-fail",
            status: "success",
            outputs: [],
            raw: {
              data: {
                status: "failed",
                message: "generation failed: final generation failed",
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + v38);
      };
      const { runDreaminaImageGeneration: v39 } =
        await import("./dreaminaGenApi.js");
      await strict["rejects"](
        () => v39({ prompt: "blocked", model: "dreamina/4.1" }),
        /generation failed: final generation failed/,
      );
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi:\x20video\x20generation\x20raw\x20fail\x20throws\x20fail_reason", async () => {
    try {
      globalThis["fetch"] = async (v40, v41 = {}) => {
        const v42 = String(v40);
        if (v42 === "/api/v2/dreamina/text2video")
          return (
            strict["equal"](String(v41["method"] || "GET"), "POST"),
            jsonResponse({ success: true, submitId: "sid-video-raw-fail" })
          );
        if (
          v42["startsWith"]("/api/v2/dreamina/query_result?") &&
          v42["includes"]("submitId=sid-video-raw-fail")
        )
          return jsonResponse({
            success: true,
            submitId: "sid-video-raw-fail",
            status: "success",
            outputs: [],
            raw: {
              queryResult: {
                gen_status: "fail",
                fail_reason: "generation failed: final generation failed",
                queue_info: { queue_status: "Finish" },
              },
            },
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + v42);
      };
      const { runDreaminaVideoGeneration: v43 } =
        await import("./dreaminaGenApi.js");
      await strict["rejects"](
        () =>
          v43({
            prompt: "blocked",
            model: "dreamina/seedance2.0fast",
            provider: "dreamina",
            dreaminaTaskType: "text2video",
          }),
        /generation failed: final generation failed/,
      );
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi: image2image + 自适应不会提交 ratio", async () => {
    try {
      globalThis["fetch"] = async (v44, v45 = {}) => {
        const v46 = String(v44);
        if (v46 === "/api/v2/dreamina/image2image") {
          const v47 = JSON["parse"](String(v45["body"] || "{}"));
          return (
            strict["equal"](v47["prompt"], "edit"),
            strict["deepEqual"](v47["images"], ["/data/uploads/demo.png"]),
            strict["ok"](
              !Object["prototype"]["hasOwnProperty"]["call"](v47, "ratio"),
            ),
            strict["equal"](v47["resolutionType"], "4k"),
            strict["equal"](v47["modelVersion"], "5.0"),
            jsonResponse({
              success: true,
              submitId: "sid-run-1",
              genStatus: "querying",
            })
          );
        }
        if (
          v46["startsWith"]("/api/v2/dreamina/query_result?") &&
          v46["includes"]("submitId=sid-run-1")
        )
          return jsonResponse({
            success: true,
            submitId: "sid-run-1",
            status: "success",
            outputs: [{ localPath: "output/dreamina/text2image/a.png" }],
          });
        throw new Error("unexpected\x20fetch\x20url:\x20" + v46);
      };
      const { runDreaminaImageGeneration: v48 } =
          await import("./dreaminaGenApi.js"),
        v49 = await v48({
          prompt: "edit",
          aspectRatio: "自适应",
          imageSize: "4K",
          model: "dreamina/5.0",
          inputUrls: ["/data/uploads/demo.png"],
        });
      (strict["equal"](Array["isArray"](v49), true),
        strict["equal"](v49["length"], 1),
        strict["equal"](
          v49[0]["localPath"],
          "output/dreamina/text2image/a.png",
        ));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi:\x20text2image\x20+\x20自适应会提交\x201:1", async () => {
    try {
      globalThis["fetch"] = async (v50, v51 = {}) => {
        const v52 = String(v50);
        if (v52 === "/api/v2/dreamina/text2image") {
          const v53 = JSON["parse"](String(v51["body"] || "{}"));
          return (
            strict["equal"](v53["prompt"], "cat"),
            strict["equal"](v53["ratio"], "1:1"),
            strict["equal"](v53["modelVersion"], "4.1"),
            jsonResponse({
              success: true,
              submitId: "sid-run-2",
              genStatus: "querying",
            })
          );
        }
        if (
          v52["startsWith"]("/api/v2/dreamina/query_result?") &&
          v52["includes"]("submitId=sid-run-2")
        )
          return jsonResponse({
            success: true,
            submitId: "sid-run-2",
            status: "success",
            outputs: [{ url: "https://example.com/a.png" }],
          });
        throw new Error("unexpected fetch url: " + v52);
      };
      const { runDreaminaImageGeneration: v54 } =
          await import("./dreaminaGenApi.js"),
        v55 = await v54({
          prompt: "cat",
          aspectRatio: "自适应",
          model: "dreamina/4.1",
          inputUrls: [],
        });
      (strict["equal"](Array["isArray"](v55), true),
        strict["equal"](v55["length"], 1),
        strict["equal"](v55[0]["sourceUrl"], "https://example.com/a.png"));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi:\x20buildDreaminaVideoSubmitRequest\x20在首尾帧模式下路由到\x20frames2video", async () => {
    const { buildDreaminaVideoSubmitRequest: v56 } =
        await import("./dreaminaGenApi.js"),
      v57 = v56({
        prompt: "season\x20changes",
        dreaminaRouteMode: "frames2video",
        model: "dreamina/3.5pro",
        inputUrls: ["/a.png", "/b.png"],
        duration: 6,
        resolution: "1080p",
      });
    (strict["equal"](v57["taskType"], "frames2video"),
      strict["equal"](v57["url"], "/api/v2/dreamina/frames2video"),
      strict["equal"](v57["body"]["first"], "/a.png"),
      strict["equal"](v57["body"]["last"], "/b.png"),
      strict["equal"](v57["body"]["modelVersion"], "3.5pro"),
      strict["equal"](v57["body"]["videoResolution"], "1080p"));
  }),
  test("dreaminaGenApi: 首尾帧单图回退 image2video 时保留 3.0 模型", async () => {
    const { buildDreaminaVideoSubmitRequest: v58 } =
        await import("./dreaminaGenApi.js"),
      v59 = v58({
        prompt: "camera push in",
        dreaminaRouteMode: "frames2video",
        model: "dreamina/3.0",
        inputUrls: ["/a.png"],
        duration: 5,
        resolution: "720p",
      });
    (strict["equal"](v59["taskType"], "image2video"),
      strict["equal"](v59["url"], "/api/v2/dreamina/image2video"),
      strict["equal"](v59["body"]["image"], "/a.png"),
      strict["equal"](v59["body"]["modelVersion"], "3.0"),
      strict["equal"](v59["body"]["videoResolution"], "720p"));
  }),
  test("dreaminaGenApi:\x20首尾帧单图回退\x20image2video\x20时保留\x20seedance\x20模型", async () => {
    const { buildDreaminaVideoSubmitRequest: v60 } =
        await import("./dreaminaGenApi.js"),
      v61 = v60({
        prompt: "camera\x20push\x20in",
        dreaminaRouteMode: "frames2video",
        model: "dreamina/seedance2.0fast",
        inputUrls: ["/a.png"],
        duration: 5,
        resolution: "720p",
      });
    (strict["equal"](v61["taskType"], "image2video"),
      strict["equal"](v61["url"], "/api/v2/dreamina/image2video"),
      strict["equal"](v61["body"]["image"], "/a.png"),
      strict["equal"](v61["body"]["modelVersion"], "seedance2.0fast"),
      strict["equal"](v61["body"]["videoResolution"], "720p"));
  }),
  test("dreaminaGenApi: Seedance 2.0 VIP 支持 1080p 视频分辨率", async () => {
    const { buildDreaminaVideoSubmitRequest: v62 } =
        await import("./dreaminaGenApi.js"),
      v63 = v62({
        prompt: "cinematic city sunrise",
        dreaminaRouteMode: "multimodal2video",
        model: "dreamina/seedance2.0_vip",
        inputUrls: ["/cover.png"],
        duration: 5,
        resolution: "1080p",
      });
    (strict["equal"](v63["taskType"], "multimodal2video"),
      strict["equal"](v63["url"], "/api/v2/dreamina/multimodal2video"),
      strict["equal"](v63["body"]["modelVersion"], "seedance2.0_vip"),
      strict["equal"](v63["body"]["videoResolution"], "1080p"));
  }),
  test("dreaminaGenApi: buildDreaminaVideoSubmitRequest 全能参考无参考时回退 text2video", async () => {
    const { buildDreaminaVideoSubmitRequest: v64 } =
        await import("./dreaminaGenApi.js"),
      v65 = v64({
        dreaminaRouteMode: "multimodal2video",
        prompt: "a boy rides a skateboard in the park",
      });
    (strict["equal"](v65["taskType"], "text2video"),
      strict["equal"](v65["url"], "/api/v2/dreamina/text2video"),
      strict["equal"](v65["body"]["modelVersion"], "seedance2.0fast"));
  }),
  test("dreaminaGenApi: buildDreaminaVideoSubmitRequest 全能参考音频单独使用会报错", async () => {
    const { buildDreaminaVideoSubmitRequest: v66 } =
      await import("./dreaminaGenApi.js");
    strict["throws"](
      () =>
        v66({ dreaminaRouteMode: "multimodal2video", audios: ["/music.mp3"] }),
      /音频不能单独使用/,
    );
  }),
  test("dreaminaGenApi: 即梦视频上传时长错误会转成中文", async () => {
    const { normalizeDreaminaErrorMessage: v67 } =
        await import("./dreaminaGenApi.js"),
      v68 = v67(
        "upload\x20resource\x20\x22C:\x5cUsers\x5cHASEE\x5cDesktop\x5c2.14\x5cdata\x5cuploads\x5cdreamina_video_0004\x20(1).mp4\x22:\x20upload\x20video:\x20duration\x2015.070\x20seconds\x20is\x20out\x20of\x20allowed\x20range\x20[2,\x2015]",
      );
    strict["equal"](
      v68,
      "上传源视频失败：“dreamina_video_0004 (1).mp4”时长 15.070 秒，超出即梦允许范围（2-15 秒）。请将视频裁剪到 15 秒以内，建议裁到 14.9 秒后再上传。",
    );
  }),
  test("dreaminaGenApi: 即梦视频上传时长错误支持不同秒数和无文件路径格式", async () => {
    const { normalizeDreaminaErrorMessage: v69 } =
        await import("./dreaminaGenApi.js"),
      v70 = v69(
        "upload video: duration 15.4 seconds is out of allowed range [2, 15]",
      );
    strict["equal"](
      v70,
      "上传源视频失败：源视频时长\x2015.4\x20秒，超出即梦允许范围（2-15\x20秒）。请将视频裁剪到\x2015\x20秒以内，建议裁到\x2014.9\x20秒后再上传。",
    );
  }),
  test("dreaminaGenApi: 即梦音频上传时长错误会转成中文", async () => {
    const { normalizeDreaminaErrorMessage: v71 } =
        await import("./dreaminaGenApi.js"),
      v72 = v71(
        'upload resource "H:\\AI\\Al_Canvas_code\\data\\uploads\\恋人.mp3": upload audio: duration 77.832 seconds is out of allowed range [2, 15]',
      );
    strict["equal"](
      v72,
      "上传源音频失败：“恋人.mp3”时长\x2077.832\x20秒，超出即梦允许范围（2-15\x20秒）。请将音频裁剪到\x2015\x20秒以内后再上传。",
    );
  }),
  test("dreaminaGenApi: runDreaminaVideoGeneration 提交 multimodal2video", async () => {
    try {
      globalThis["fetch"] = async (v73, v74 = {}) => {
        const v75 = String(v73);
        if (v75 === "/api/v2/dreamina/multimodal2video") {
          const v76 = JSON["parse"](String(v74["body"] || "{}"));
          return (
            strict["deepEqual"](v76["images"], ["/cover.png"]),
            strict["deepEqual"](v76["videos"], ["/ref.mp4"]),
            strict["deepEqual"](v76["audios"], ["/music.mp3"]),
            strict["equal"](v76["modelVersion"], "seedance2.0fast"),
            strict["equal"](v76["videoResolution"], "720p"),
            jsonResponse({ success: true, submitId: "sid-video-1" })
          );
        }
        if (
          v75["startsWith"]("/api/v2/dreamina/query_result?") &&
          v75["includes"]("submitId=sid-video-1")
        )
          return jsonResponse({
            success: true,
            submitId: "sid-video-1",
            status: "success",
            outputs: [{ localPath: "output/dreamina/multimodal2video/a.mp4" }],
          });
        throw new Error("unexpected fetch url: " + v75);
      };
      const { runDreaminaVideoGeneration: v77 } =
          await import("./dreaminaGenApi.js"),
        v78 = await v77({
          model: "dreamina/seedance2.0fast",
          images: ["/cover.png"],
          videos: ["/ref.mp4"],
          audios: ["/music.mp3"],
          aspectRatio: "16:9",
          duration: 5,
        });
      (strict["equal"](
        v78["videoUrl"],
        "/output/dreamina/multimodal2video/a.mp4",
      ),
        strict["equal"](
          v78["localPath"],
          "output/dreamina/multimodal2video/a.mp4",
        ));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi: runDreaminaVideoGeneration 首次 success 无 outputs 时会继续轮询", async () => {
    try {
      let v79 = 0;
      globalThis["fetch"] = async (v80, v81 = {}) => {
        const v82 = String(v80);
        if (v82 === "/api/v2/dreamina/text2video") {
          const v83 = JSON["parse"](String(v81["body"] || "{}"));
          return (
            strict["equal"](v83["prompt"], "two\x20people\x20talking"),
            strict["equal"](v83["modelVersion"], "seedance2.0fast"),
            jsonResponse({ success: true, submitId: "sid-video-2" })
          );
        }
        if (
          v82["startsWith"]("/api/v2/dreamina/query_result?") &&
          v82["includes"]("submitId=sid-video-2")
        ) {
          v79 += 1;
          if (v79 === 1)
            return jsonResponse({
              success: true,
              submitId: "sid-video-2",
              status: "success",
              outputs: [],
            });
          return jsonResponse({
            success: true,
            submitId: "sid-video-2",
            status: "success",
            outputs: [{ localPath: "output/dreamina/text2video/b.mp4" }],
          });
        }
        throw new Error("unexpected fetch url: " + v82);
      };
      const { runDreaminaVideoGeneration: v84 } =
          await import("./dreaminaGenApi.js"),
        v85 = await v84({
          model: "dreamina/seedance2.0fast",
          prompt: "two\x20people\x20talking",
          aspectRatio: "16:9",
          duration: 4,
        });
      (strict["equal"](v79, 2),
        strict["equal"](v85["videoUrl"], "/output/dreamina/text2video/b.mp4"),
        strict["equal"](v85["localPath"], "output/dreamina/text2video/b.mp4"));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi: pollDreaminaUntilDone 会持续回调 onProgress", async () => {
    try {
      const v86 = [];
      globalThis["fetch"] = async (v87) => {
        const v88 = String(v87);
        if (
          v88["startsWith"]("/api/v2/dreamina/query_result?") &&
          v88["includes"]("submitId=sid-progress-1")
        ) {
          if (v86["length"] === 0)
            return jsonResponse({
              success: true,
              submitId: "sid-progress-1",
              status: "pending",
              outputs: [],
              raw: { queue_status: "waiting", queue_idx: 2, queue_length: 9 },
            });
          return jsonResponse({
            success: true,
            submitId: "sid-progress-1",
            status: "success",
            outputs: [{ localPath: "output/dreamina/text2video/d.mp4" }],
          });
        }
        throw new Error("unexpected fetch url: " + v88);
      };
      const { pollDreaminaUntilDone: v89 } =
          await import("./dreaminaGenApi.js"),
        v90 = await v89("sid-progress-1", {
          intervalMs: 1,
          onProgress: (v91) => {
            v86["push"](v91["phase"] + ":" + v91["label"]);
          },
        });
      (strict["equal"](v90["submitId"], "sid-progress-1"),
        strict["deepEqual"](v86, ["queued:排队中", "done:已完成"]));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi: pollDreaminaUntilDone 单次查询错误会直接失败", async () => {
    try {
      let v92 = 0;
      globalThis["fetch"] = async (v93) => {
        const v94 = String(v93);
        if (
          v94["startsWith"]("/api/v2/dreamina/query_result?") &&
          v94["includes"]("submitId=sid-transient-1")
        )
          return (
            (v92 += 1),
            jsonResponse({ success: false, message: "查询超时，请稍后重试" })
          );
        throw new Error("unexpected fetch url: " + v94);
      };
      const { pollDreaminaUntilDone: v95 } =
        await import("./dreaminaGenApi.js");
      (await strict["rejects"](
        v95("sid-transient-1", { intervalMs: 1, maxWaitMs: 5000 }),
        /查询超时，请稍后重试/,
      ),
        strict["equal"](v92, 1));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi: status failed + 超时原因会直接失败", async () => {
    try {
      let v96 = 0;
      const v97 = [];
      globalThis["fetch"] = async (v98) => {
        const v99 = String(v98);
        if (
          v99["startsWith"]("/api/v2/dreamina/query_result?") &&
          v99["includes"]("submitId=sid-transient-2")
        ) {
          v96 += 1;
          if (v96 === 1)
            return jsonResponse({
              success: true,
              submitId: "sid-transient-2",
              status: "failed",
              failReason: "即梦组件执行超时",
              outputs: [],
            });
          return jsonResponse({
            success: true,
            submitId: "sid-transient-2",
            status: "success",
            outputs: [{ localPath: "output/dreamina/text2video/f.mp4" }],
          });
        }
        throw new Error("unexpected fetch url: " + v99);
      };
      const { pollDreaminaUntilDone: v100 } =
          await import("./dreaminaGenApi.js"),
        v101 = await v100("sid-transient-2", {
          intervalMs: 1,
          maxWaitMs: 5000,
          onProgress: (v102) => {
            v97["push"](v102["status"] + ":" + v102["phase"]);
          },
        });
      (strict["equal"](v96, 1),
        strict["equal"](v101["submitId"], "sid-transient-2"),
        strict["equal"](v101["status"], "failed"),
        strict["equal"](v101["failReason"], "即梦组件执行超时"),
        strict["deepEqual"](v97, ["failed:failed"]));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi: 查询返回错误会直接失败", async () => {
    try {
      let v103 = 0;
      globalThis["fetch"] = async (v104) => {
        const v105 = String(v104);
        if (
          v105["startsWith"]("/api/v2/dreamina/query_result?") &&
          v105["includes"]("submitId=sid-transient-3")
        )
          return (
            (v103 += 1),
            jsonResponse({ success: false, message: "网络抖动，请稍后重试" })
          );
        throw new Error("unexpected fetch url: " + v105);
      };
      const { pollDreaminaUntilDone: v106 } =
        await import("./dreaminaGenApi.js");
      (await strict["rejects"](
        v106("sid-transient-3", { intervalMs: 1, maxWaitMs: 5000 }),
        (v107) => {
          return (
            strict["match"](
              String(v107?.["message"] || ""),
              /网络抖动，请稍后重试/,
            ),
            true
          );
        },
      ),
        strict["equal"](v103, 1));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }),
  test("dreaminaGenApi:\x20超时前最终查询会返回即梦失败原文", async () => {
    try {
      let v108 = 0;
      globalThis["fetch"] = async (v109) => {
        const v110 = String(v109);
        if (
          v110["startsWith"]("/api/v2/dreamina/query_result?") &&
          v110["includes"]("submitId=sid-final-fail")
        ) {
          v108 += 1;
          if (v108 === 1)
            return jsonResponse({
              success: true,
              submitId: "sid-final-fail",
              status: "pending",
              outputs: [],
            });
          return jsonResponse({
            success: true,
            submitId: "sid-final-fail",
            status: "failed",
            failReason: "平台返回：不符合平台规则，不予生成",
            outputs: [],
          });
        }
        throw new Error("unexpected fetch url: " + v110);
      };
      const { pollDreaminaUntilDone: v111 } =
          await import("./dreaminaGenApi.js"),
        v112 = await v111("sid-final-fail", { intervalMs: 2, maxWaitMs: 1 });
      (strict["equal"](v108, 2),
        strict["equal"](v112["status"], "failed"),
        strict["equal"](
          v112["failReason"],
          "平台返回：不符合平台规则，不予生成",
        ));
    } finally {
      globalThis["fetch"] = originalFetch;
    }
  }));

import test from "node:test";
import strict from "node:assert/strict";
import {
  buildImageRequest,
  buildVideoRequest,
  buildModelRequest,
} from "./RunningHubAdapter.js";
import { getRunningHubWorkflowPayloadResolver } from "./runninghubWorkflowResolvers/index.js";
import { resolveModelExecution } from "../../src/manifests/index.js";
(test("RunningHub workflow payload resolvers are whitelist-only", () => {
  (strict["equal"](
    typeof getRunningHubWorkflowPayloadResolver("runninghubVideoV54"),
    "function",
  ),
    strict["equal"](
      typeof getRunningHubWorkflowPayloadResolver("runninghubVideoMatting"),
      "function",
    ),
    strict["equal"](
      getRunningHubWorkflowPayloadResolver("unknownResolver"),
      null,
    ));
}),
  test("RunningHubAdapter 人物替换图片编辑 V3: nodeInfoList 映射正确", async () => {
    const v0 = resolveModelExecution("runninghub/2041177685895946242");
    strict["equal"](
      v0?.["executionManifest"]?.["mapping"]?.["imageNodes"]?.[0],
      "45",
    );
    const v1 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_target", "u_source"],
        processInputImagesPreserveOrder: async (v2) =>
          Array["isArray"](v2) && v2[0] === "" && v2[1] === ""
            ? ["", ""]
            : Array["isArray"](v2) &&
                v2[0] === "m_target" &&
                v2[1] === "m_source"
              ? ["mask_0", "mask_1"]
              : ["u_target", "u_source"],
      },
      v3 = await buildImageRequest(
        {
          model: "runninghub/2041177685895946242",
          inputUrls: ["local_target", "local_source"],
          rhResolution: 1600,
          rhInstanceType: "plus",
        },
        "a prompt",
        v1,
      );
    (strict["equal"](v3["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v3["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2041177685895946242",
      ),
      strict["equal"](v3["body"]["apiKey"], "k"),
      strict["equal"](v3["body"]["instanceType"], "plus"),
      strict["ok"](Array["isArray"](v3["body"]["nodeInfoList"])));
    const v4 = v3["body"]["nodeInfoList"],
      v5 = (v6, v7) =>
        v4["find"]((v8) => v8["nodeId"] === v6 && v8["fieldName"] === v7);
    (strict["equal"](v5("45", "image")?.["fieldValue"], "u_target"),
      strict["equal"](v5("40", "image")?.["fieldValue"], "u_source"),
      strict["equal"](v5("594", "value")?.["fieldValue"], "a\x20prompt"),
      strict["equal"](v5("400", "value")?.["fieldValue"], "1600"),
      strict["equal"](v5("1180", "image"), undefined),
      strict["equal"](v5("1185", "boolean"), undefined),
      strict["equal"](v5("1177", "image"), undefined),
      strict["equal"](v5("1186", "boolean"), undefined));
  }),
  test("RunningHubAdapter image workflow: missing manifest throws instead of fallback", async () => {
    await strict["rejects"](
      () =>
        buildImageRequest(
          {
            model: "runninghub/2037743729716498433",
            inputUrls: ["local_target", "local_source"],
          },
          "",
          {
            getProviderConfig: () => ({ apiKey: "k" }),
            processInputImages: async () => ["u_target", "u_source"],
            processInputImagesPreserveOrder: async () => [
              "u_target",
              "u_source",
            ],
          },
        ),
      /workflow manifest missing/,
    );
  }),
  test("RunningHubAdapter 控制摄像机: nodeInfoList 映射图片和 <sks> 提示词", async () => {
    const v9 = resolveModelExecution("runninghub/2053902968243671041");
    (strict["equal"](v9?.["modelManifest"]?.["displayName"], "控制摄像机"),
      strict["equal"](
        v9?.["executionManifest"]?.["mapping"]?.["promptNode"]?.["prefix"],
        "<sks> ",
      ));
    const v10 = await buildImageRequest(
      { model: "runninghub/2053902968243671041", inputUrls: ["local_image"] },
      "switch\x20the\x20camera\x20perspective:\x20wide\x20shot,\x20front\x20view,\x20eye-level\x20shot",
      {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["uploaded_image"],
        processInputImagesPreserveOrder: async () => ["uploaded_image"],
      },
    );
    (strict["equal"](v10["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v10["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2053902968243671041",
      ),
      strict["equal"](v10["body"]["apiKey"], "k"),
      strict["equal"](v10["body"]["instanceType"], "default"),
      strict["equal"](v10["body"]["usePersonalQueue"], "false"));
    const v11 = v10["body"]["nodeInfoList"],
      v12 = (v13, v14) =>
        v11["find"]((v15) => v15["nodeId"] === v13 && v15["fieldName"] === v14);
    (strict["deepEqual"](
      v11["map"]((v16) => v16["nodeId"]),
      ["16", "23"],
    ),
      strict["equal"](v12("16", "image")?.["fieldValue"], "uploaded_image"),
      strict["equal"](v12("16", "image")?.["description"], "载入图像"),
      strict["equal"](v12("23", "value")?.["description"], "提示词"),
      strict["equal"](
        v12("23", "value")?.["fieldValue"],
        "<sks> switch the camera perspective: wide shot, front view, eye-level shot",
      ));
  }),
  test("RunningHubAdapter\x20人物替换人物替换\x20V2.1:\x20nodeInfoList\x20映射正确", async () => {
    const v17 = resolveModelExecution("runninghub/2050313968069165058");
    (strict["equal"](
      v17?.["modelManifest"]?.["displayName"],
      "人物替换人物替换V2.1",
    ),
      strict["equal"](
        v17?.["executionManifest"]?.["mapping"]?.["imageNodes"]?.[0],
        "258",
      ));
    const v18 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_target", "u_source"],
        processInputImagesPreserveOrder: async (v19) =>
          Array["isArray"](v19) && v19[0] === "" && v19[1] === ""
            ? ["", ""]
            : ["u_target", "u_source"],
      },
      v20 = await buildImageRequest(
        {
          model: "runninghub/2050313968069165058",
          inputUrls: ["local_target", "local_source"],
          rhResolution: 1600,
          rhInstanceType: "plus",
        },
        "a\x20prompt",
        v18,
      );
    (strict["equal"](v20["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v20["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2050313968069165058",
      ),
      strict["equal"](v20["body"]["apiKey"], "k"),
      strict["equal"](v20["body"]["instanceType"], "plus"),
      strict["deepEqual"](v20["adapterTrace"], {
        source: "manifest",
        executionId: "runninghub.workflow.person-replace-v21.v1",
        modelId: "runninghub/2050313968069165058",
      }));
    const v21 = v20["body"]["nodeInfoList"],
      v22 = (v23, v24) =>
        v21["find"]((v25) => v25["nodeId"] === v23 && v25["fieldName"] === v24);
    (strict["equal"](v22("258", "image")?.["fieldValue"], "u_target"),
      strict["equal"](v22("265", "image")?.["fieldValue"], "u_source"),
      strict["equal"](v22("232", "value")?.["fieldValue"], "a prompt"),
      strict["equal"](v22("233", "value")?.["fieldValue"], "1600"),
      strict["equal"](v22("257", "image"), undefined),
      strict["equal"](v22("259", "boolean"), undefined),
      strict["equal"](v22("255", "image"), undefined),
      strict["equal"](v22("262", "boolean"), undefined));
  }),
  test("RunningHubAdapter\x20漫画转真人：使用新版\x20ai-app\x20并映射节点参数", async () => {
    const v26 = resolveModelExecution("runninghub/1994718111704158209");
    (strict["equal"](v26?.["modelManifest"]?.["displayName"], "漫画转真人"),
      strict["equal"](
        v26?.["executionManifest"]?.["mapping"]?.["imageNodes"]?.[0],
        "851",
      ));
    const v27 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_ref"],
      },
      v28 = await buildImageRequest(
        {
          model: "runninghub/1994718111704158209",
          inputUrls: ["local_ref"],
          rhAnimeRealResolution: 1600,
          rhInstanceType: "plus",
        },
        "realistic portrait",
        v27,
      );
    (strict["equal"](v28["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v28["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/1994718111704158209",
      ),
      strict["equal"](v28["body"]["apiKey"], "k"),
      strict["equal"](v28["body"]["instanceType"], "plus"),
      strict["deepEqual"](v28["adapterTrace"], {
        source: "manifest",
        executionId: "runninghub.workflow.anime-real.v1",
        modelId: "runninghub/1994718111704158209",
      }),
      strict["ok"](Array["isArray"](v28["body"]["nodeInfoList"])));
    const v29 = v28["body"]["nodeInfoList"],
      v30 = (v31, v32) =>
        v29["find"]((v33) => v33["nodeId"] === v31 && v33["fieldName"] === v32);
    (strict["equal"](v30("851", "image")?.["fieldValue"], "u_ref"),
      strict["equal"](v30("945", "value")?.["fieldValue"], "1600"),
      strict["equal"](
        v30("967", "value")?.["fieldValue"],
        "realistic\x20portrait",
      ));
  }),
  test("RunningHubAdapter\x20Qwen\x20image\x20edit:\x20maps\x20one\x20image\x20with\x20default\x20mode\x20values\x20and\x201.5K\x20size", async () => {
    const v34 = resolveModelExecution("runninghub/2050306122774532097");
    (strict["equal"](v34?.["modelManifest"]?.["displayName"], "Qwen-图像编辑"),
      strict["equal"](
        v34?.["executionManifest"]?.["submitMode"],
        "openapi-v2-ai-app",
      ));
    const v35 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_ref_1"],
      },
      v36 = await buildImageRequest(
        {
          model: "runninghub/2050306122774532097",
          inputUrls: ["local_ref_1"],
          aspectRatio: "1:1",
          imageSize: "1.5K",
          rhInstanceType: "default",
        },
        "edit the image",
        v35,
      );
    (strict["equal"](v36["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v36["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2050306122774532097",
      ),
      strict["equal"](v36["body"]["apiKey"], "k"),
      strict["equal"](v36["body"]["instanceType"], "default"),
      strict["deepEqual"](v36["adapterTrace"], {
        source: "manifest",
        executionId: "runninghub.workflow.qwen-image-edit.v1",
        modelId: "runninghub/2050306122774532097",
      }));
    const v37 = v36["body"]["nodeInfoList"],
      v38 = (v39, v40) =>
        v37["find"]((v41) => v41["nodeId"] === v39 && v41["fieldName"] === v40);
    (strict["equal"](v38("151", "image")?.["fieldValue"], "u_ref_1"),
      strict["equal"](v38("152", "image"), undefined),
      strict["equal"](v38("157", "image"), undefined),
      strict["equal"](v38("148", "value")?.["fieldValue"], "edit the image"),
      strict["equal"](v38("112", "width")?.["fieldValue"], "1536"),
      strict["equal"](v38("112", "height")?.["fieldValue"], "1536"),
      strict["equal"](v38("227", "index")?.["fieldValue"], "0"),
      strict["equal"](v38("231", "index")?.["fieldValue"], "1"),
      strict["equal"](v38("265", "value")?.["fieldValue"], "0"));
  }),
  test("RunningHubAdapter Qwen image edit: maps three images, 2509 mode, depth control, and 16:9 2K size", async () => {
    const v42 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => [
          "u_ref_1",
          "u_ref_2",
          "u_ref_3",
          "u_ref_4",
        ],
      },
      v43 = await buildImageRequest(
        {
          model: "runninghub/2050306122774532097",
          inputUrls: [
            "local_ref_1",
            "local_ref_2",
            "local_ref_3",
            "local_ref_4",
          ],
          aspectRatio: "16:9",
          imageSize: "2K",
          rhQwenEditMode: "qwen2509",
          rhQwenFirstImageMode: "depth",
          rhInstanceType: "plus",
        },
        "keep the product consistent",
        v42,
      );
    strict["equal"](v43["body"]["instanceType"], "plus");
    const v44 = v43["body"]["nodeInfoList"],
      v45 = (v46, v47) =>
        v44["find"]((v48) => v48["nodeId"] === v46 && v48["fieldName"] === v47);
    (strict["equal"](v45("151", "image")?.["fieldValue"], "u_ref_1"),
      strict["equal"](v45("152", "image")?.["fieldValue"], "u_ref_2"),
      strict["equal"](v45("157", "image")?.["fieldValue"], "u_ref_3"),
      strict["equal"](
        v44["some"]((v49) => v49["fieldValue"] === "u_ref_4"),
        false,
      ),
      strict["equal"](
        v45("148", "value")?.["fieldValue"],
        "keep the product consistent",
      ),
      strict["equal"](v45("112", "width")?.["fieldValue"], "1920"),
      strict["equal"](v45("112", "height")?.["fieldValue"], "1088"),
      strict["equal"](v45("227", "index")?.["fieldValue"], "2"),
      strict["equal"](v45("231", "index")?.["fieldValue"], "0"),
      strict["equal"](v45("265", "value")?.["fieldValue"], "2"));
  }),
  test("RunningHubAdapter Qwen image edit: requires at least one image", async () => {
    const v50 = {
      getProviderConfig: () => ({ apiKey: "k" }),
      processInputImages: async () => [],
    };
    await strict["rejects"](
      () =>
        buildImageRequest(
          { model: "runninghub/2050306122774532097", inputUrls: [] },
          "edit",
          v50,
        ),
      /请先添加至少一张参考图再生成/,
    );
  }),
  test("RunningHubAdapter 人物替换图片编辑 V3: mask 存在时写入 1180/1185 与 1177/1186", async () => {
    const v51 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_target", "u_source"],
        processInputImagesPreserveOrder: async (v52) =>
          Array["isArray"](v52) && v52[0] === "" && v52[1] === ""
            ? ["", ""]
            : Array["isArray"](v52) &&
                v52[0] === "m_target" &&
                v52[1] === "m_source"
              ? ["mask_0", "mask_1"]
              : ["u_target", "u_source"],
      },
      v53 = await buildImageRequest(
        {
          model: "runninghub/2041177685895946242",
          inputUrls: ["local_target", "local_source"],
          inputMaskUrls: ["m_target", "m_source"],
          rhResolution: 1440,
          rhInstanceType: "default",
        },
        "p",
        v51,
      ),
      v54 = v53["body"]["nodeInfoList"],
      v55 = (v56, v57) =>
        v54["find"]((v58) => v58["nodeId"] === v56 && v58["fieldName"] === v57);
    (strict["equal"](v55("1180", "image")?.["fieldValue"], "mask_0"),
      strict["equal"](v55("1185", "boolean")?.["fieldValue"], "true"),
      strict["equal"](v55("1177", "image")?.["fieldValue"], "mask_1"),
      strict["equal"](v55("1186", "boolean")?.["fieldValue"], "true"));
  }),
  test('RunningHubAdapter 人物替换图片编辑 V3: 提示词为空时 594 使用默认 "4k,高清画质"', async () => {
    const v59 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_target", "u_source"],
        processInputImagesPreserveOrder: async (v60) =>
          Array["isArray"](v60) && v60[0] === "" && v60[1] === ""
            ? ["", ""]
            : ["u_target", "u_source"],
      },
      v61 = await buildImageRequest(
        {
          model: "runninghub/2041177685895946242",
          inputUrls: ["local_target", "local_source"],
          rhResolution: 1440,
          rhInstanceType: "default",
        },
        "   ",
        v59,
      ),
      v62 = v61["body"]["nodeInfoList"],
      v63 = (v64, v65) =>
        v62["find"]((v66) => v66["nodeId"] === v64 && v66["fieldName"] === v65);
    strict["equal"](v63("594", "value")?.["fieldValue"], "4k,高清画质");
  }),
  test("RunningHubAdapter\x20人物替换人物替换\x20V2.1:\x20mask\x20与默认提示词映射正确", async () => {
    const v67 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_target", "u_source"],
        processInputImagesPreserveOrder: async (v68) =>
          Array["isArray"](v68) &&
          v68[0] === "m_target" &&
          v68[1] === "m_source"
            ? ["mask_0", "mask_1"]
            : Array["isArray"](v68) && v68[0] === "" && v68[1] === ""
              ? ["", ""]
              : ["u_target", "u_source"],
      },
      v69 = await buildImageRequest(
        {
          model: "runninghub/2050313968069165058",
          inputUrls: ["local_target", "local_source"],
          inputMaskUrls: ["m_target", "m_source"],
          rhResolution: 1440,
          rhInstanceType: "default",
        },
        "   ",
        v67,
      ),
      v70 = v69["body"]["nodeInfoList"],
      v71 = (v72, v73) =>
        v70["find"]((v74) => v74["nodeId"] === v72 && v74["fieldName"] === v73);
    (strict["equal"](v71("257", "image")?.["fieldValue"], "mask_0"),
      strict["equal"](v71("259", "boolean")?.["fieldValue"], "true"),
      strict["equal"](v71("255", "image")?.["fieldValue"], "mask_1"),
      strict["equal"](v71("262", "boolean")?.["fieldValue"], "true"),
      strict["equal"](v71("232", "value")?.["fieldValue"], "4K"),
      strict["equal"](v71("233", "value")?.["fieldValue"], "1440"));
  }),
  test("RunningHubAdapter\x20人物替换人物替换\x20V2.1:\x20默认模式允许\x201440/1600/1920", async () => {
    const v75 = globalThis["window"];
    globalThis["window"] = { ADVANCED_MODE: false };
    try {
      const v76 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_target", "u_source"],
        processInputImagesPreserveOrder: async (v77) =>
          Array["isArray"](v77) && v77[0] === "" && v77[1] === ""
            ? ["", ""]
            : ["u_target", "u_source"],
      };
      for (const v78 of [1440, 1600, 1920]) {
        const v79 = await buildImageRequest(
            {
              model: "runninghub/2050313968069165058",
              inputUrls: ["local_target", "local_source"],
              rhResolution: v78,
            },
            "prompt",
            v76,
          ),
          v80 = v79["body"]["nodeInfoList"]["find"](
            (v81) => v81["nodeId"] === "233" && v81["fieldName"] === "value",
          );
        strict["equal"](v80?.["fieldValue"], String(v78));
      }
    } finally {
      if (typeof v75 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v75;
    }
  }),
  test("RunningHubAdapter 视频擦除：nodeInfoList 映射正确（117/122/105/63）", async () => {
    const v82 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputVideos: async () => [
          "https://www.runninghub.cn/uploaded-video.mp4",
        ],
        processInputImages: async () => [
          "https://www.runninghub.cn/uploaded-mask.png",
        ],
      },
      { buildVideoRequest: v83 } = await import("./RunningHubAdapter.js"),
      v84 = await v83(
        {
          model: "runninghub/video_matting",
          videoUrl: "https://www.runninghub.cn/test.mp4",
          maskImageDataUrl: "data:image/png;base64,ZmFrZQ==",
          sourceFrameCount: 77,
        },
        "",
        v82,
      );
    (strict["equal"](v84["url"], "/api/v2/video/matting/run"),
      strict["equal"](v84["useOpenapiQuery"], true),
      strict["equal"](v84["body"]["apiKey"], "k"),
      strict["equal"](v84["body"]["appId"], "2042569732972355585"),
      strict["equal"](v84["body"]["instanceType"], "default"),
      strict["equal"](v84["body"]["usePersonalQueue"], "false"),
      strict["ok"](Array["isArray"](v84["body"]["nodeInfoList"])));
    const v85 = v84["body"]["nodeInfoList"],
      v86 = (v87, v88) =>
        v85["find"]((v89) => v89["nodeId"] === v87 && v89["fieldName"] === v88);
    (strict["equal"](
      v86("117", "video")?.["fieldValue"],
      "https://www.runninghub.cn/uploaded-video.mp4",
    ),
      strict["equal"](v86("117", "frame_load_cap")?.["fieldValue"], "77"),
      strict["equal"](v86("122", "value")?.["fieldValue"], "24"),
      strict["equal"](v86("105", "value")?.["fieldValue"], "1024"),
      strict["equal"](
        v86("63", "image")?.["fieldValue"],
        "https://www.runninghub.cn/uploaded-mask.png",
      ),
      strict["equal"](
        v85["some"]((v90) => v90["nodeId"] === "71"),
        false,
      ),
      strict["equal"](
        v85["some"]((v91) => v91["nodeId"] === "72"),
        false,
      ),
      strict["equal"](
        v85["some"]((v92) => v92["nodeId"] === "67"),
        false,
      ),
      strict["equal"](
        v85["some"]((v93) => v93["nodeId"] === "35"),
        false,
      ));
  }),
  test("RunningHubAdapter 视频抠像：默认模式允许 30 帧", async () => {
    const v94 = globalThis["window"];
    globalThis["window"] = { ADVANCED_MODE: false };
    try {
      const v95 = {
          getProviderConfig: () => ({ apiKey: "k" }),
          processInputVideos: async () => [
            "https://www.runninghub.cn/uploaded-video.mp4",
          ],
          processInputImages: async () => [
            "https://www.runninghub.cn/uploaded-mask.png",
          ],
        },
        v96 = await buildVideoRequest(
          {
            model: "runninghub/video_matting",
            videoUrl: "https://www.runninghub.cn/test.mp4",
            maskImageDataUrl: "data:image/png;base64,ZmFrZQ==",
            sourceFrameCount: 77,
            rhVideoFps: 30,
          },
          "",
          v95,
        ),
        v97 = (v98, v99) =>
          v96["body"]["nodeInfoList"]["find"](
            (v100) => v100["nodeId"] === v98 && v100["fieldName"] === v99,
          );
      strict["equal"](v97("122", "value")?.["fieldValue"], "30");
    } finally {
      if (typeof v94 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v94;
    }
  }),
  test("RunningHubAdapter 视频抠像：上传源视频并正确映射抠像模式（55/video + 67/index）", async () => {
    const v101 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputVideos: async () => [
          "https://www.runninghub.cn/uploaded-video.mp4",
        ],
      },
      v102 = [
        { rhMaskMode: "Sec", expected: "0" },
        { rhMaskMode: "Sam3", expected: "1" },
        { rhMaskMode: "MA2", expected: "2" },
        { rhMaskMode: "MatAnyone2", expected: "2" },
        { rhMaskMode: undefined, expected: "0" },
        { rhMaskMode: "unknown", expected: "0" },
      ];
    for (const { rhMaskMode: v103, expected: v104 } of v102) {
      const v105 = await buildVideoRequest(
          {
            model: "runninghub/video_matting",
            videoUrl: "https://www.runninghub.cn/test.mp4",
            pos_points: '[{"x":1,"y":2}]',
            neg_points: "[]",
            frame_index: 12,
            rhMaskMode: v103,
          },
          "",
          v101,
        ),
        v106 = v105["body"]["nodeInfoList"],
        v107 = (v108, v109) =>
          v106["find"](
            (v110) => v110["nodeId"] === v108 && v110["fieldName"] === v109,
          );
      (strict["equal"](
        v107("55", "video")?.["fieldValue"],
        "https://www.runninghub.cn/uploaded-video.mp4",
      ),
        strict["equal"](
          v107("67", "index")?.["fieldValue"],
          v104,
          "rhMaskMode=" + String(v103),
        ));
    }
  }),
  test("RunningHubAdapter 视频抠像: 缺少视频上传能力时抛错", async () => {
    const v111 = { getProviderConfig: () => ({ apiKey: "k" }) };
    await strict["rejects"](
      buildVideoRequest(
        {
          model: "runninghub/video_matting",
          videoUrl: "https://www.runninghub.cn/test.mp4",
          pos_points: '[{"x":1,"y":2}]',
          neg_points: "[]",
          frame_index: 12,
        },
        "",
        v111,
      ),
      /缺少 RunningHUB 视频上传能力/,
    );
  }),
  test("RunningHubAdapter\x20视频抠像:\x20视频上传失败时抛错", async () => {
    const v112 = {
      getProviderConfig: () => ({ apiKey: "k" }),
      processInputVideos: async () => [],
    };
    await strict["rejects"](
      buildVideoRequest(
        {
          model: "runninghub/video_matting",
          videoUrl: "https://www.runninghub.cn/test.mp4",
          pos_points: '[{"x":1,"y":2}]',
          neg_points: "[]",
          frame_index: 12,
        },
        "",
        v112,
      ),
      /源视频上传失败/,
    );
  }),
  test("RunningHubAdapter\x20LTX2.3:\x20nodeInfoList\x20映射正确", async () => {
    const v113 = resolveModelExecution("runninghub/2039336644536442882");
    (strict["equal"](
      v113?.["modelManifest"]?.["displayName"],
      "LTX2.3唱歌数字人",
    ),
      strict["equal"](
        v113?.["executionManifest"]?.["mapping"]?.["preset"],
        undefined,
      ),
      strict["equal"](
        v113?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v114) => v114["nodeId"] === "303",
        )?.["source"],
        "prompt",
      ),
      strict["equal"](
        v113?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v115) => v115["nodeId"] === "332",
        )?.["source"],
        "audioInput",
      ));
    const v116 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_img"],
      },
      { buildVideoRequest: v117 } = await import("./RunningHubAdapter.js"),
      v118 = await v117(
        {
          model: "runninghub/2039336644536442882",
          inputUrls: ["local_img"],
          audioUrl: "https://www.runninghub.cn/test.mp3",
          rhVideoResolution: 1024,
          rhVideoFps: 24,
          rhVideoSeconds: 6,
          rhInstanceType: "default",
        },
        "a prompt",
        v116,
      );
    (strict["equal"](v118["url"], "/api/v2/runninghubwf/run"),
      strict["equal"](v118["body"]["apiKey"], "k"),
      strict["equal"](v118["body"]["workflowId"], "2039336644536442882"),
      strict["equal"](v118["body"]["instanceType"], "default"),
      strict["deepEqual"](v118["adapterTrace"], {
        source: "manifest",
        executionId: "runninghub.workflow.video-ltx23.v1",
        modelId: "runninghub/2039336644536442882",
      }),
      strict["ok"](Array["isArray"](v118["body"]["nodeInfoList"])));
    const v119 = v118["body"]["nodeInfoList"],
      v120 = (v121, v122) =>
        v119["find"](
          (v123) => v123["nodeId"] === v121 && v123["fieldName"] === v122,
        );
    (strict["equal"](v120("303", "value")?.["fieldValue"], "a\x20prompt"),
      strict["equal"](v120("347", "value")?.["fieldValue"], "1024"),
      strict["equal"](v120("346", "value")?.["fieldValue"], "24"),
      strict["equal"](v120("349", "value")?.["fieldValue"], "6"),
      strict["equal"](v120("269", "image")?.["fieldValue"], "u_img"),
      strict["equal"](
        v120("332", "audio")?.["fieldValue"],
        "https://www.runninghub.cn/test.mp3",
      ));
  }),
  test("RunningHubAdapter 商业级数字人：ai-app 节点映射正确", async () => {
    const v124 = resolveModelExecution("runninghub/2055639633148563458");
    (strict["equal"](v124?.["modelManifest"]?.["displayName"], "商业级数字人"),
      strict["equal"](v124?.["modelManifest"]?.["description"], "主攻唱歌音频"),
      strict["equal"](
        v124?.["executionManifest"]?.["mapping"]?.["preset"],
        undefined,
      ),
      strict["equal"](
        v124?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v125) => v125["nodeId"] === "100",
        )?.["source"],
        "imageInput",
      ),
      strict["equal"](
        v124?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v126) => v126["nodeId"] === "119",
        )?.["source"],
        "audioInput",
      ));
    const v127 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_img"],
      },
      v128 = await buildVideoRequest(
        {
          model: "runninghub/2055639633148563458",
          inputUrls: ["local_img"],
          audioUrl: "https://www.runninghub.cn/song.mp3",
          generationParams: {
            rhVideoResolution: 1280,
            rhDigitalHumanMotionAmplitude: "2",
            rhDigitalHumanSceneMotionAmplitude: "1",
          },
          rhInstanceType: "plus",
        },
        "",
        v127,
      );
    (strict["equal"](v128["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v128["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2055639633148563458",
      ),
      strict["equal"](v128["body"]["apiKey"], "k"),
      strict["equal"](v128["body"]["instanceType"], "plus"),
      strict["equal"](v128["body"]["usePersonalQueue"], "false"),
      strict["deepEqual"](v128["adapterTrace"], {
        source: "manifest",
        executionId: "runninghub.workflow.video-commercial-digital-human.v1",
        modelId: "runninghub/2055639633148563458",
      }));
    const v129 = v128["body"]["nodeInfoList"],
      v130 = (v131, v132) =>
        v129["find"](
          (v133) => v133["nodeId"] === v131 && v133["fieldName"] === v132,
        );
    (strict["equal"](v130("100", "image")?.["fieldValue"], "u_img"),
      strict["equal"](
        v130("119", "audio")?.["fieldValue"],
        "https://www.runninghub.cn/song.mp3",
      ),
      strict["equal"](v130("114", "value")?.["fieldValue"], "1280"),
      strict["equal"](v130("118", "value")?.["fieldValue"], "150"),
      strict["equal"](
        v130("117", "value")?.["fieldValue"],
        "女人在唱歌，镜头晃动",
      ),
      strict["equal"](v130("201", "value")?.["fieldValue"], "2"),
      strict["equal"](v130("204", "value")?.["fieldValue"], "1"));
  }),
  test("RunningHubAdapter 视频编辑-基础版：manifest 映射源视频和参考图", async () => {
    const v134 = resolveModelExecution("runninghub/1971148165531475969");
    (strict["equal"](
      v134?.["modelManifest"]?.["displayName"],
      "视频编辑-基础版",
    ),
      strict["equal"](
        v134?.["executionManifest"]?.["mapping"]?.["preset"],
        undefined,
      ),
      strict["equal"](
        v134?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v135) => v135["nodeId"] === "237",
        )?.["source"],
        "videoInput",
      ),
      strict["equal"](
        v134?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v136) => v136["nodeId"] === "234",
        )?.["source"],
        "imageInput",
      ));
    const v137 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_ref"],
      },
      v138 = await buildVideoRequest(
        {
          model: "runninghub/1971148165531475969",
          videoUrl: "https://www.runninghub.cn/source.mp4",
          inputUrls: ["local_ref"],
          rhVideoFps: 16,
          rhVideoResolution: 1024,
          rhVideoFrames: 90,
          rhEnableMask: true,
        },
        "basic prompt",
        v137,
      );
    (strict["equal"](v138["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v138["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/1971148165531475969",
      ),
      strict["deepEqual"](v138["adapterTrace"], {
        source: "manifest",
        executionId: "runninghub.workflow.video-basic.v1",
        modelId: "runninghub/1971148165531475969",
      }));
    const v139 = v138["body"]["nodeInfoList"],
      v140 = (v141, v142) =>
        v139["find"](
          (v143) => v143["nodeId"] === v141 && v143["fieldName"] === v142,
        );
    (strict["equal"](
      v140("237", "video")?.["fieldValue"],
      "https://www.runninghub.cn/source.mp4",
    ),
      strict["equal"](v140("234", "image")?.["fieldValue"], "u_ref"),
      strict["equal"](v140("397", "value")?.["fieldValue"], "16"),
      strict["equal"](v140("222", "value")?.["fieldValue"], "1024"),
      strict["equal"](v140("392", "value")?.["fieldValue"], "90"),
      strict["equal"](v140("235", "value")?.["fieldValue"], "basic prompt"),
      strict["equal"](v140("396", "value")?.["fieldValue"], "true"));
  }),
  test("RunningHubAdapter 视频对口型：ai-app 节点映射正确", async () => {
    const v144 = resolveModelExecution("runninghub/2054101324521844738");
    (strict["equal"](v144?.["modelManifest"]?.["displayName"], "视频对口型"),
      strict["equal"](
        v144?.["executionManifest"]?.["mapping"]?.["preset"],
        undefined,
      ),
      strict["equal"](
        v144?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v145) => v145["nodeId"] === "383",
        )?.["source"],
        "videoInput",
      ),
      strict["equal"](
        v144?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v146) => v146["nodeId"] === "390",
        )?.["source"],
        "imageInput",
      ),
      strict["equal"](
        v144?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v147) => v147["nodeId"] === "367",
        )?.["source"],
        "audioInput",
      ));
    const v148 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => [],
      },
      v149 = await buildVideoRequest(
        {
          model: "runninghub/2054101324521844738",
          videoUrl: "https://www.runninghub.cn/source.mp4",
          audioUrl: "https://www.runninghub.cn/audio.mp3",
          rhVideoFrames: 120,
          rhVideoResolution: 512,
          rhInstanceType: "plus",
          rhLipSyncInputIndex: 1,
          prompt: "lip\x20sync\x20prompt",
        },
        "ignored fallback",
        v148,
      );
    (strict["equal"](v149["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v149["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2054101324521844738",
      ),
      strict["equal"](v149["body"]["apiKey"], "k"),
      strict["equal"](v149["body"]["instanceType"], "plus"),
      strict["equal"](v149["body"]["usePersonalQueue"], "false"),
      strict["deepEqual"](v149["adapterTrace"], {
        source: "manifest",
        executionId: "runninghub.workflow.video-lipsync.v1",
        modelId: "runninghub/2054101324521844738",
      }));
    const v150 = v149["body"]["nodeInfoList"],
      v151 = (v152, v153) =>
        v150["find"](
          (v154) => v154["nodeId"] === v152 && v154["fieldName"] === v153,
        );
    (strict["equal"](
      v151("383", "video")?.["fieldValue"],
      "https://www.runninghub.cn/source.mp4",
    ),
      strict["equal"](v151("390", "image"), undefined),
      strict["equal"](v151("410", "value")?.["fieldValue"], "120"),
      strict["equal"](v151("392", "value")?.["fieldValue"], "832"),
      strict["equal"](
        v151("367", "audio")?.["fieldValue"],
        "https://www.runninghub.cn/audio.mp3",
      ),
      strict["equal"](v151("393", "value")?.["fieldValue"], "lip sync prompt"),
      strict["equal"](v151("409", "index")?.["fieldValue"], "1"));
  }),
  test("RunningHubAdapter\x20视频对口型：图片入参写入参考图节点并切\x20index=0", async () => {
    const v155 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => ["u_ref"],
      },
      v156 = await buildVideoRequest(
        {
          model: "runninghub/2054101324521844738",
          inputUrls: ["local-ref"],
          audioUrl: "https://www.runninghub.cn/audio.mp3",
          rhVideoFrames: 20,
          rhVideoResolution: 1024,
          rhLipSyncInputIndex: 0,
          prompt: "lip sync from image",
        },
        "",
        v155,
      ),
      v157 = v156["body"]["nodeInfoList"],
      v158 = (v159, v160) =>
        v157["find"](
          (v161) => v161["nodeId"] === v159 && v161["fieldName"] === v160,
        );
    (strict["equal"](v158("390", "image")?.["fieldValue"], "u_ref"),
      strict["equal"](v158("383", "video"), undefined),
      strict["equal"](v158("410", "value")?.["fieldValue"], "20"),
      strict["equal"](v158("392", "value")?.["fieldValue"], "1024"),
      strict["equal"](
        v158("367", "audio")?.["fieldValue"],
        "https://www.runninghub.cn/audio.mp3",
      ),
      strict["equal"](
        v158("393", "value")?.["fieldValue"],
        "lip sync from image",
      ),
      strict["equal"](v158("409", "index")?.["fieldValue"], "0"));
  }),
  test("RunningHubAdapter 视频高清 VIP：通用 manifest 映射模式和源视频", async () => {
    const v162 = resolveModelExecution("runninghub/2047787809091620866");
    (strict["equal"](v162?.["modelManifest"]?.["displayName"], "视频高清 VIP"),
      strict["equal"](
        v162?.["executionManifest"]?.["mapping"]?.["preset"],
        undefined,
      ),
      strict["equal"](
        v162?.["executionManifest"]?.["mapping"]?.["nodeInfoList"]?.["find"](
          (v163) => v163["nodeId"] === "10",
        )?.["source"],
        "param",
      ));
    const v164 = { getProviderConfig: () => ({ apiKey: "k" }) },
      v165 = await buildVideoRequest(
        {
          model: "runninghub/2047787809091620866",
          videoUrl: "https://www.runninghub.cn/source.mp4",
          hdMode: "sharp",
          rhInstanceType: "plus",
        },
        "",
        v164,
      );
    (strict["equal"](v165["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v165["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2047787809091620866",
      ),
      strict["equal"](v165["body"]["instanceType"], "plus"),
      strict["deepEqual"](v165["adapterTrace"], {
        source: "manifest",
        executionId: "runninghub.workflow.video-hd-vip.v1",
        modelId: "runninghub/2047787809091620866",
      }));
    const v166 = v165["body"]["nodeInfoList"],
      v167 = (v168, v169) =>
        v166["find"](
          (v170) => v170["nodeId"] === v168 && v170["fieldName"] === v169,
        );
    (strict["equal"](v167("10", "index")?.["fieldValue"], "1"),
      strict["equal"](
        v167("12", "video")?.["fieldValue"],
        "https://www.runninghub.cn/source.mp4",
      ));
  }),
  test("RunningHubAdapter 视频编辑 V5.4 使用 ai-app 并按节点规则映射", async () => {
    const v171 = resolveModelExecution("runninghub/2041741496667348994");
    (strict["equal"](v171?.["modelManifest"]?.["displayName"], "视频编辑V5.4"),
      strict["equal"](
        v171?.["executionManifest"]?.["mapping"]?.["preset"],
        undefined,
      ),
      strict["equal"](
        v171?.["executionManifest"]?.["extensions"]?.["payloadResolver"],
        "runninghubVideoV54",
      ),
      strict["equal"](
        v171?.["executionManifest"]?.["mapping"]?.["sourceVideoNode"]?.[
          "nodeId"
        ],
        "237",
      ),
      strict["equal"](
        v171?.["executionManifest"]?.["mapping"]?.["specialModeNode"]?.[
          "nodeId"
        ],
        "1063",
      ));
    const v172 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async (v173) => {
          const v174 = String(v173?.[0] || "");
          if (v174 === "ref_local") return ["u_ref"];
          if (v174 === "first_local") return ["u_first"];
          return [];
        },
      },
      v175 = await buildVideoRequest(
        {
          model: "runninghub/2041741496667348994",
          videoUrl: "https://www.runninghub.cn/source.mp4",
          inputUrls: ["ref_local"],
          firstFrameUrl: "first_local",
          maskVideoUrl: "https://www.runninghub.cn/mask.mp4",
          characterIntegration: true,
          controlMode: "stable",
          subtractSubject: true,
          maskExpansion: 31,
          maskRect: true,
          frameRate: 30,
          frameCount: 88,
          rhVideoResolution: 1280,
          specialMode: "cameraMove",
          rhInstanceType: "plus",
        },
        "a prompt",
        v172,
      );
    (strict["equal"](v175["url"], "/api/v2/proxy/image"),
      strict["equal"](
        v175["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/run/ai-app/2041741496667348994",
      ),
      strict["equal"](v175["body"]["apiKey"], "k"),
      strict["equal"](v175["body"]["instanceType"], "plus"),
      strict["deepEqual"](v175["adapterTrace"], {
        source: "manifest",
        executionId: "runninghub.workflow.video-v54.v1",
        modelId: "runninghub/2041741496667348994",
      }));
    const v176 = v175["body"]["nodeInfoList"],
      v177 = (v178, v179) =>
        v176["find"](
          (v180) => v180["nodeId"] === v178 && v180["fieldName"] === v179,
        );
    (strict["equal"](v177("235", "value")?.["fieldValue"], "a prompt"),
      strict["equal"](v177("915", "value")?.["fieldValue"], "true"),
      strict["equal"](v177("977", "value")?.["fieldValue"], "1"),
      strict["equal"](v177("222", "value")?.["fieldValue"], "1280"),
      strict["equal"](v177("1077", "value")?.["fieldValue"], "30"),
      strict["equal"](v177("237", "frame_load_cap")?.["fieldValue"], "88"),
      strict["equal"](
        v177("237", "video")?.["fieldValue"],
        "https://www.runninghub.cn/source.mp4",
      ),
      strict["equal"](v177("234", "image")?.["fieldValue"], "u_ref"),
      strict["equal"](
        v177("1021", "video")?.["fieldValue"],
        "https://www.runninghub.cn/mask.mp4",
      ),
      strict["equal"](v177("429", "image")?.["fieldValue"], "u_first"),
      strict["equal"](v177("988", "value")?.["fieldValue"], "1"),
      strict["equal"](v177("1078", "value"), undefined),
      strict["equal"](v177("240", "value"), undefined),
      strict["equal"](v177("979", "index"), undefined),
      strict["equal"](v177("1076", "value"), undefined),
      strict["equal"](v177("1063", "index")?.["fieldValue"], "2"),
      strict["equal"](v177("1081", "index"), undefined),
      strict["equal"](v177("1113", "value"), undefined),
      strict["equal"](v177("1100", "value"), undefined));
  }),
  test("RunningHubAdapter\x20视频编辑V5.4：长视频叠加开启\x201081\x20且抖胸幅度大于\x200\x20时写入节点", async () => {
    const v181 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => [],
      },
      v182 = await buildVideoRequest(
        {
          model: "runninghub/2041741496667348994",
          videoUrl: "https://www.runninghub.cn/source.mp4",
          controlMode: "efficiency",
          frameRate: 24,
          frameCount: 77,
          rhVideoResolution: 832,
          specialMode: "longVideoOverlay",
          rhBreastJiggle: 0.35,
        },
        "overlay prompt",
        v181,
      ),
      v183 = v182["body"]["nodeInfoList"],
      v184 = (v185, v186) =>
        v183["find"](
          (v187) => v187["nodeId"] === v185 && v187["fieldName"] === v186,
        );
    (strict["equal"](v184("1063", "index")?.["fieldValue"], "1"),
      strict["equal"](v184("1081", "index")?.["fieldValue"], "1"),
      strict["equal"](v184("1113", "value")?.["fieldValue"], "0.35"),
      strict["equal"](v184("1113", "value")?.["description"], "抖胸幅度"),
      strict["equal"](v184("1100", "value")?.["fieldValue"], "true"),
      strict["equal"](v184("1100", "value")?.["description"], "是否开抖胸"));
  }),
  test("RunningHubAdapter\x20视频编辑V5.4：仅在满足条件时加入可选节点并回退默认提示词", async () => {
    const v188 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => [],
      },
      v189 = await buildVideoRequest(
        {
          model: "runninghub/2041741496667348994",
          videoUrl: "https://www.runninghub.cn/source.mp4",
          controlMode: "efficiency",
          subtractSubject: false,
          frameRate: 24,
          frameCount: 77,
          rhVideoResolution: 832,
        },
        "   ",
        v188,
      ),
      v190 = v189["body"]["nodeInfoList"],
      v191 = (v192, v193) =>
        v190["find"](
          (v194) => v194["nodeId"] === v192 && v194["fieldName"] === v193,
        );
    (strict["equal"](v191("235", "value")?.["fieldValue"], "4K，高质量"),
      strict["equal"](v191("977", "value")?.["fieldValue"], "0"),
      strict["equal"](v191("1021", "video"), undefined),
      strict["equal"](v191("429", "image"), undefined),
      strict["equal"](v191("988", "value"), undefined),
      strict["equal"](v191("1078", "value"), undefined),
      strict["equal"](v191("240", "value"), undefined),
      strict["equal"](v191("979", "index"), undefined),
      strict["equal"](v191("1076", "value"), undefined),
      strict["equal"](v191("1063", "index"), undefined),
      strict["equal"](v191("1081", "index"), undefined),
      strict["equal"](v191("1113", "value"), undefined),
      strict["equal"](v191("1100", "value"), undefined));
  }),
  test("RunningHubAdapter 视频编辑V5.4：源视频转传失败时给出网络或上传提示", async () => {
    const v195 = globalThis["fetch"],
      v196 = {
        getProviderConfig: () => ({ apiKey: "k" }),
        processInputImages: async () => [],
      };
    try {
      ((globalThis["fetch"] = async (v197) => {
        const v198 = String(v197 || "");
        if (v198 === "https://video.example/fail.mp4")
          return new Response("network timeout", { status: 504 });
        throw new Error("unexpected fetch url: " + v198);
      }),
        await strict["rejects"](
          () =>
            buildVideoRequest(
              {
                model: "runninghub/2041741496667348994",
                videoUrl: "https://video.example/fail.mp4",
                controlMode: "efficiency",
                subtractSubject: false,
                frameRate: 24,
                frameCount: 77,
                rhVideoResolution: 832,
              },
              "a prompt",
              v196,
            ),
          /源视频上传失败，可能是网络延迟/,
        ));
    } finally {
      globalThis["fetch"] = v195;
    }
  }),
  test("RunningHubAdapter 视频工作流旧 ID 缺少 manifest 时直接报错", async () => {
    const v199 = {
      getProviderConfig: () => ({ apiKey: "k" }),
      processInputImages: async () => [],
    };
    await strict["rejects"](
      () =>
        buildVideoRequest(
          {
            model: "runninghub/2037339851183366146",
            videoUrl: "https://www.runninghub.cn/source.mp4",
            frameRate: 24,
            frameCount: 77,
            rhVideoResolution: 832,
            controlMode: "efficiency",
          },
          "legacy prompt",
          v199,
        ),
      /video workflow manifest missing/,
    );
  }),
  test("RunningHubAdapter\x20模型\x20API\x20在自适应比例下不透传\x20aspectRatio（兼容扩图）", async () => {
    const v200 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => ["https://example.com/expand.png"],
      },
      v201 = await buildModelRequest(
        {
          model: "runninghub-model/rhart-image-v1",
          inputUrls: ["blob:expand"],
          resolvedRatioLabel: "16:9",
          aspectRatio: "自适应",
          imageSize: "2K",
        },
        "保持主体不变，扩展黑边区域",
        v200,
      );
    (strict["equal"](
      v201["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/rhart-image-v1/edit",
    ),
      strict["equal"](v201["body"]["apiKey"], "mk"),
      strict["equal"](v201["body"]["aspectRatio"], "16:9"),
      strict["deepEqual"](v201["body"]["imageUrls"], [
        "https://example.com/expand.png",
      ]),
      strict["equal"](v201["adapterTrace"]?.["source"], "manifest"));
  }),
  test("RunningHubAdapter\x20模型\x20API\x20缺少\x20manifest\x20时直接报错", async () => {
    const v202 = {
      getProviderConfig: () => ({ modelApiKey: "mk" }),
      processInputImages: async () => [],
    };
    await strict["rejects"](
      () =>
        buildModelRequest(
          { model: "runninghub-model/unregistered-model", imageSize: "2K" },
          "test",
          v202,
        ),
      /RunningHub model API manifest missing/,
    );
  }),
  test("RunningHubAdapter\x20模型API会规范化全角比例分隔符（非\x20seedream）", async () => {
    const v203 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v204 = await buildModelRequest(
        {
          model: "runninghub-model/rhart-image-n-g31-flash",
          aspectRatio: "16：9",
          imageSize: "4K",
        },
        "test",
        v203,
      );
    (strict["equal"](v204["body"]["aspectRatio"], "16:9"),
      strict["equal"](v204["body"]["resolution"], "4k"));
  }),
  test("RunningHubAdapter\x20GPT\x20image\x202\x20有参考图时走\x20image-to-image\x20且透传\x20resolution", async () => {
    const v205 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [
          "https://example.com/gpt-image-2-ref.png",
        ],
      },
      v206 = await buildModelRequest(
        {
          model: "runninghub-model/rhart-image-g-2",
          inputUrls: ["blob:ref"],
          aspectRatio: "1:1",
          imageSize: "2K",
        },
        "test",
        v205,
      );
    (strict["equal"](
      v206["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/rhart-image-g-2/image-to-image",
    ),
      strict["equal"](v206["body"]["aspectRatio"], "1:1"),
      strict["equal"](v206["body"]["resolution"], "2k"),
      strict["deepEqual"](v206["body"]["imageUrls"], [
        "https://example.com/gpt-image-2-ref.png",
      ]));
  }),
  test("RunningHubAdapter\x20Midjourney\x20V6\x20使用具名图片插槽和条件权重参数", async () => {
    let v207 = [];
    const v208 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async (v209) => {
          return (
            (v207 = v209),
            [
              "https://example.com/main.png",
              "https://example.com/char.png",
              "https://example.com/style.png",
            ]
          );
        },
      },
      v210 = await buildModelRequest(
        {
          model: "runninghub-model/youchuan-v6",
          inputUrlsBySlot: {
            imageUrl: "blob:main",
            cref: "blob:char",
            sref: "blob:style",
          },
          aspectRatio: "16:9",
          quality: "2",
          chaos: "7",
          stylize: "120",
          weird: "3",
          raw: "true",
          iw: "2",
          cw: "80",
          sw: "250",
          sv: "4",
          ow: "150",
          stop: "90",
          tile: "false",
          hd: "true",
        },
        "test",
        v208,
      );
    (strict["deepEqual"](v207, ["blob:main", "blob:char", "blob:style"]),
      strict["equal"](
        v210["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v6",
      ),
      strict["equal"](v210["body"]["resolution"], undefined),
      strict["equal"](v210["body"]["imageUrls"], undefined),
      strict["equal"](v210["body"]["imageUrl"], "https://example.com/main.png"),
      strict["equal"](v210["body"]["cref"], "https://example.com/char.png"),
      strict["equal"](v210["body"]["sref"], "https://example.com/style.png"),
      strict["equal"](v210["body"]["quality"], "2"),
      strict["equal"](v210["body"]["raw"], true),
      strict["equal"](v210["body"]["tile"], false),
      strict["equal"](v210["body"]["iw"], 2),
      strict["equal"](v210["body"]["cw"], 80),
      strict["equal"](v210["body"]["sw"], 250),
      strict["equal"](v210["body"]["sv"], 4),
      strict["equal"](v210["body"]["stop"], 90),
      strict["equal"](v210["body"]["ow"], undefined),
      strict["equal"](v210["body"]["hd"], undefined));
  }),
  test("RunningHubAdapter Midjourney V6 连接参考图时补官方默认数值", async () => {
    let v211 = [];
    const v212 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async (v213) => {
          return (
            (v211 = v213),
            [
              "https://example.com/main.png",
              "https://example.com/char.png",
              "https://example.com/style.png",
            ]
          );
        },
      },
      v214 = await buildModelRequest(
        {
          model: "runninghub-model/youchuan-v6",
          inputUrlsBySlot: {
            imageUrl: "blob:main",
            cref: "blob:char",
            sref: "blob:style",
          },
          aspectRatio: "16:9",
        },
        "test",
        v212,
      );
    (strict["deepEqual"](v211, ["blob:main", "blob:char", "blob:style"]),
      strict["equal"](
        v214["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v6",
      ),
      strict["equal"](v214["body"]["imageUrl"], "https://example.com/main.png"),
      strict["equal"](v214["body"]["cref"], "https://example.com/char.png"),
      strict["equal"](v214["body"]["sref"], "https://example.com/style.png"),
      strict["equal"](v214["body"]["quality"], "1"),
      strict["equal"](v214["body"]["chaos"], 0),
      strict["equal"](v214["body"]["stylize"], 0),
      strict["equal"](v214["body"]["weird"], 0),
      strict["equal"](v214["body"]["raw"], false),
      strict["equal"](v214["body"]["iw"], 1),
      strict["equal"](v214["body"]["cw"], 100),
      strict["equal"](v214["body"]["sw"], 100),
      strict["equal"](v214["body"]["sv"], 4),
      strict["equal"](v214["body"]["stop"], 100),
      strict["equal"](v214["body"]["tile"], false),
      strict["equal"](v214["body"]["ow"], undefined),
      strict["equal"](v214["body"]["hd"], undefined));
  }),
  test("RunningHubAdapter Midjourney V7 使用具名图片插槽和 V7 参数", async () => {
    let v215 = [];
    const v216 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async (v217) => {
          return (
            (v215 = v217),
            [
              "https://example.com/main-v7.png",
              "https://example.com/style-v7.png",
            ]
          );
        },
      },
      v218 = await buildModelRequest(
        {
          model: "runninghub-model/youchuan-v7",
          inputUrlsBySlot: { imageUrl: "blob:main", sref: "blob:style" },
          aspectRatio: "16:9",
          quality: "2",
          chaos: "7",
          stylize: "120",
          weird: "3",
          raw: "true",
          iw: "2",
          sw: "250",
          sv: "4",
          ow: "150",
          stop: "90",
          cw: "80",
          hd: "true",
          tile: "false",
        },
        "test",
        v216,
      );
    (strict["deepEqual"](v215, ["blob:main", "blob:style"]),
      strict["equal"](
        v218["body"]["apiUrl"],
        "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7",
      ),
      strict["equal"](v218["body"]["resolution"], undefined),
      strict["equal"](v218["body"]["imageUrls"], undefined),
      strict["equal"](
        v218["body"]["imageUrl"],
        "https://example.com/main-v7.png",
      ),
      strict["equal"](v218["body"]["sref"], "https://example.com/style-v7.png"),
      strict["equal"](v218["body"]["cref"], undefined),
      strict["equal"](v218["body"]["cw"], undefined),
      strict["equal"](v218["body"]["stop"], undefined),
      strict["equal"](v218["body"]["hd"], undefined),
      strict["equal"](v218["body"]["quality"], "2"),
      strict["equal"](v218["body"]["raw"], true),
      strict["equal"](v218["body"]["tile"], false),
      strict["equal"](v218["body"]["iw"], 2),
      strict["equal"](v218["body"]["sw"], 250),
      strict["equal"](v218["body"]["sv"], 4),
      strict["equal"](v218["body"]["ow"], 150));
  }),
  test("RunningHubAdapter Midjourney V7 未连接风格图时不发送 sw", async () => {
    const v219 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => ["https://example.com/main-v7.png"],
      },
      v220 = await buildModelRequest(
        {
          model: "runninghub-model/youchuan-v7",
          inputUrlsBySlot: { imageUrl: "blob:main" },
          aspectRatio: "9:16",
          iw: "2",
          sw: "999",
        },
        "test",
        v219,
      );
    (strict["equal"](
      v220["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7",
    ),
      strict["equal"](
        v220["body"]["imageUrl"],
        "https://example.com/main-v7.png",
      ),
      strict["equal"](v220["body"]["sref"], undefined),
      strict["equal"](v220["body"]["sw"], undefined),
      strict["equal"](v220["body"]["iw"], 2),
      strict["equal"](v220["body"]["quality"], "1"),
      strict["equal"](v220["body"]["chaos"], 0),
      strict["equal"](v220["body"]["stylize"], 0),
      strict["equal"](v220["body"]["weird"], 0),
      strict["equal"](v220["body"]["raw"], false),
      strict["equal"](v220["body"]["sv"], 4),
      strict["equal"](v220["body"]["ow"], 100),
      strict["equal"](v220["body"]["tile"], false));
  }),
  test("RunningHubAdapter\x20Midjourney\x20V7\x20连接参考图时补官方默认数值", async () => {
    const v221 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [
          "https://example.com/main-v7.png",
          "https://example.com/style-v7.png",
        ],
      },
      v222 = await buildModelRequest(
        {
          model: "runninghub-model/youchuan-v7",
          inputUrlsBySlot: { imageUrl: "blob:main", sref: "blob:style" },
          aspectRatio: "16:9",
        },
        "test",
        v221,
      );
    (strict["equal"](
      v222["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v7",
    ),
      strict["equal"](
        v222["body"]["imageUrl"],
        "https://example.com/main-v7.png",
      ),
      strict["equal"](v222["body"]["sref"], "https://example.com/style-v7.png"),
      strict["equal"](v222["body"]["quality"], "1"),
      strict["equal"](v222["body"]["chaos"], 0),
      strict["equal"](v222["body"]["stylize"], 0),
      strict["equal"](v222["body"]["weird"], 0),
      strict["equal"](v222["body"]["raw"], false),
      strict["equal"](v222["body"]["iw"], 1),
      strict["equal"](v222["body"]["sw"], 100),
      strict["equal"](v222["body"]["sv"], 4),
      strict["equal"](v222["body"]["ow"], 100),
      strict["equal"](v222["body"]["tile"], false));
  }),
  test("RunningHubAdapter Midjourney V8.1 使用官方 iw/sw 参数并过滤其他版本残留", async () => {
    const v223 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => ["https://example.com/main.png"],
      },
      v224 = await buildModelRequest(
        {
          model: "runninghub-model/youchuan-v81",
          inputUrlsBySlot: { imageUrl: "blob:main" },
          aspectRatio: "9:16",
          quality: "4",
          iw: "3",
          sw: "999",
          hd: "true",
          weird: "3",
          stop: "90",
          ow: "150",
          tile: "true",
        },
        "test",
        v223,
      );
    (strict["equal"](
      v224["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81",
    ),
      strict["equal"](v224["body"]["imageUrl"], "https://example.com/main.png"),
      strict["equal"](v224["body"]["sref"], undefined),
      strict["equal"](v224["body"]["sw"], 999),
      strict["equal"](v224["body"]["iw"], 3),
      strict["equal"](v224["body"]["quality"], "4"),
      strict["equal"](v224["body"]["hd"], true),
      strict["equal"](v224["body"]["sv"], 6),
      strict["equal"](v224["body"]["weird"], undefined),
      strict["equal"](v224["body"]["stop"], undefined),
      strict["equal"](v224["body"]["ow"], undefined),
      strict["equal"](v224["body"]["tile"], undefined));
  }),
  test("RunningHubAdapter Midjourney V8.1 纯文生图使用官方默认 iw/sw body", async () => {
    const v225 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v226 = await buildModelRequest(
        { model: "runninghub-model/youchuan-v81" },
        "test",
        v225,
      );
    (strict["equal"](
      v226["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/youchuan/text-to-image-v81",
    ),
      strict["equal"](v226["body"]["imageUrl"], undefined),
      strict["equal"](v226["body"]["sref"], undefined),
      strict["equal"](v226["body"]["iw"], 1),
      strict["equal"](v226["body"]["sw"], 100),
      strict["equal"](v226["body"]["quality"], "1"),
      strict["equal"](v226["body"]["chaos"], 0),
      strict["equal"](v226["body"]["stylize"], 0),
      strict["equal"](v226["body"]["raw"], false),
      strict["equal"](v226["body"]["hd"], false),
      strict["equal"](v226["body"]["sv"], 6));
  }),
  test("RunningHubAdapter\x20Midjourney\x20自适应比例发送解析后的官方比例", async () => {
    const v227 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v228 = await buildModelRequest(
        {
          model: "runninghub-model/youchuan-v81",
          aspectRatio: "自适应",
          resolvedRatioLabel: "3:4",
        },
        "test",
        v227,
      );
    (strict["equal"](v228["body"]["aspectRatio"], "3:4"),
      strict["notEqual"](v228["body"]["aspectRatio"], "自适应"));
  }),
  test("RunningHubAdapter GPT image 2 无参考图时走 text-to-image 且透传 resolution", async () => {
    const v229 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v230 = await buildModelRequest(
        { model: "runninghub-model/rhart-image-g-2", imageSize: "4K" },
        "test",
        v229,
      );
    (strict["equal"](
      v230["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/rhart-image-g-2/text-to-image",
    ),
      strict["equal"](v230["body"]["resolution"], "4k"),
      strict["equal"](v230["body"]["imageUrls"], undefined));
  }),
  test("RunningHubAdapter GPT image 2 official 有参考图时走 official image-to-image", async () => {
    const v231 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [
          "https://example.com/gpt-image-2-ref.png",
        ],
      },
      v232 = await buildModelRequest(
        {
          model: "runninghub-model/rhart-image-g-2-official",
          inputUrls: ["blob:ref"],
          aspectRatio: "2:1",
          imageSize: "4K",
        },
        "test",
        v231,
      );
    (strict["equal"](
      v232["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/image-to-image",
    ),
      strict["equal"](v232["body"]["aspectRatio"], "2:1"),
      strict["equal"](v232["body"]["resolution"], "4k"),
      strict["equal"](v232["body"]["quality"], "medium"),
      strict["deepEqual"](v232["body"]["imageUrls"], [
        "https://example.com/gpt-image-2-ref.png",
      ]));
  }),
  test("RunningHubAdapter GPT image 2 official 无参考图时走 official text-to-image", async () => {
    const v233 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v234 = await buildModelRequest(
        {
          model: "runninghub-model/rhart-image-g-2-official",
          aspectRatio: "9:21",
          imageSize: "2K",
        },
        "test",
        v233,
      );
    (strict["equal"](
      v234["body"]["apiUrl"],
      "https://www.runninghub.cn/openapi/v2/rhart-image-g-2-official/text-to-image",
    ),
      strict["equal"](v234["body"]["aspectRatio"], "9:21"),
      strict["equal"](v234["body"]["resolution"], "2k"),
      strict["equal"](v234["body"]["quality"], "medium"),
      strict["equal"](v234["body"]["imageUrls"], undefined));
  }),
  test("RunningHubAdapter GPT image 2 official 保留 1K resolution", async () => {
    const v235 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v236 = await buildModelRequest(
        {
          model: "runninghub-model/rhart-image-g-2-official",
          aspectRatio: "1:1",
          imageSize: "1K",
        },
        "test",
        v235,
      );
    (strict["equal"](v236["body"]["resolution"], "1k"),
      strict["equal"](v236["body"]["aspectRatio"], "1:1"));
  }),
  test("RunningHubAdapter GPT image 2 official 4K 会回落到支持比例", async () => {
    const v237 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v238 = await buildModelRequest(
        {
          model: "runninghub-model/rhart-image-g-2-official",
          aspectRatio: "1:1",
          imageSize: "4K",
        },
        "test",
        v237,
      );
    (strict["equal"](v238["body"]["resolution"], "4k"),
      strict["equal"](v238["body"]["aspectRatio"], "16:9"));
  }),
  test("RunningHubAdapter seedream 三个模型均不透传 aspectRatio", async () => {
    const v239 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v240 = [
        "runninghub-model/seedream-v4",
        "runninghub-model/seedream-v4.5",
        "runninghub-model/seedream-v5-lite",
      ];
    for (const v241 of v240) {
      const v242 = await buildModelRequest(
        { model: v241, aspectRatio: "16:9", imageSize: "2K" },
        "test",
        v239,
      );
      (strict["equal"](v242["body"]["aspectRatio"], undefined, "model=" + v241),
        strict["equal"](v242["body"]["resolution"], undefined, "model=" + v241),
        strict["equal"](v242["body"]["width"], 2728, "model=" + v241),
        strict["equal"](v242["body"]["height"], 1536, "model=" + v241));
    }
  }),
  test("RunningHubAdapter\x20模型\x20API\x20在默认\x201:1\x20比例下不透传\x20aspectRatio", async () => {
    const v243 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v244 = await buildModelRequest(
        {
          model: "runninghub-model/seedream-v4",
          aspectRatio: "1:1",
          imageSize: "2K",
        },
        "test",
        v243,
      );
    (strict["equal"](v244["body"]["aspectRatio"], undefined),
      strict["equal"](v244["body"]["resolution"], undefined),
      strict["equal"](v244["body"]["width"], 2048),
      strict["equal"](v244["body"]["height"], 2048));
  }),
  test("RunningHubAdapter seedream 宽高满足官方约束：8倍数且在512-8192", async () => {
    const v245 = {
        getProviderConfig: () => ({ modelApiKey: "mk" }),
        processInputImages: async () => [],
      },
      v246 = await buildModelRequest(
        {
          model: "runninghub-model/seedream-v5-lite",
          aspectRatio: "21:9",
          imageSize: "4K",
        },
        "test",
        v245,
      );
    (strict["equal"](v246["body"]["aspectRatio"], undefined),
      strict["equal"](v246["body"]["resolution"], undefined),
      strict["ok"](Number["isInteger"](v246["body"]["width"])),
      strict["ok"](Number["isInteger"](v246["body"]["height"])),
      strict["equal"](v246["body"]["width"] % 8, 0),
      strict["equal"](v246["body"]["height"] % 8, 0),
      strict["ok"](
        v246["body"]["width"] >= 512 && v246["body"]["width"] <= 8192,
      ),
      strict["ok"](
        v246["body"]["height"] >= 512 && v246["body"]["height"] <= 8192,
      ));
  }));

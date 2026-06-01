import test from "node:test";
import strict from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createVideoNodeTaskOrchestrationModule } from "./taskOrchestrationModule.js";
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from "../../modules/previewMode.js";
import {
  createFakePreviewContainer,
  installPreviewDomStubs,
} from "../../../tests/testPreviewDom.js";
import {
  _resetAssetMentionRegistryForTests,
  setAssetMentionAssets,
} from "../../modules/assetMentionRegistry.js";
const originalWindow = globalThis["window"],
  originalDocument = globalThis["document"],
  __dirname = dirname(fileURLToPath(import.meta["url"])),
  taskOrchestrationSource = readFileSync(
    join(__dirname, "taskOrchestrationModule.js"),
    "utf8",
  ),
  restorePreviewDom = installPreviewDomStubs();
if (!globalThis["window"]) globalThis["window"] = {};
typeof globalThis["window"]["showToast"] !== "function" &&
  (globalThis["window"]["showToast"] = () => {});
typeof globalThis["window"]["_triggerLocalCacheSave"] !== "function" &&
  (globalThis["window"]["_triggerLocalCacheSave"] = () => {});
typeof globalThis["window"]["__aicInstallId"] !== "string" &&
  (globalThis["window"]["__aicInstallId"] = "");
async function flushUntil(v0, v1 = 20) {
  for (let v2 = 0; v2 < v1; v2 += 1) {
    if (v0()) return;
    await Promise["resolve"]();
  }
  strict["equal"](v0(), true);
}
(test["after"](() => {
  (_resetPreviewRuntimeForTests(),
    typeof originalWindow === "undefined"
      ? delete globalThis["window"]
      : (globalThis["window"] = originalWindow),
    typeof originalDocument === "undefined"
      ? delete globalThis["document"]
      : (globalThis["document"] = originalDocument),
    restorePreviewDom());
}),
  test("video task orchestration: RunningHub workflow submit logic stays delegated", () => {
    (strict["match"](
      taskOrchestrationSource,
      /buildRunningHubVideoWorkflowSubmitPatch/,
    ),
      strict["doesNotMatch"](
        taskOrchestrationSource,
        /runninghub\/(?:2041741496667348994|1971148165531475969|2039336644536442882|2054101324521844738)/,
      ),
      strict["doesNotMatch"](
        taskOrchestrationSource,
        /normalizeRh(?:StandardFps|V54Fps|VideoResolution)|buildRhV54AssetSlotMapFromRefs/,
      ));
  }));
function createLipSyncPayloadContext({
  rhVideoFrames: rhVideoFrames = 120,
  videoDuration: videoDuration = 5,
  audioDuration: audioDuration = 5,
  includeVideo: includeVideo = true,
  includeAudio: includeAudio = true,
  includeImage: includeImage = false,
  includeText: includeText = false,
  rhInstanceType: rhInstanceType = "default",
  rhVideoResolution: rhVideoResolution = 832,
} = {}) {
  const v3 = "node-lipsync",
    v4 = {},
    v5 = [];
  includeVideo &&
    ((v4["video1"] = {
      id: "video1",
      type: "source-video",
      localPath: "output/source.mp4",
      videoDuration: videoDuration,
    }),
    v5["push"]({
      id: "edge-video",
      sourceId: "video1",
      targetId: v3,
      refSlot: "sourceVideo",
    }));
  includeAudio &&
    ((v4["audio1"] = {
      id: "audio1",
      type: "source-audio",
      localPath: "output/audio.mp3",
      duration: audioDuration,
    }),
    v5["push"]({
      id: "edge-audio",
      sourceId: "audio1",
      targetId: v3,
      refSlot: "audio",
    }));
  includeImage &&
    ((v4["image1"] = {
      id: "image1",
      type: "source-image",
      imageUrl: "/output/ref.png",
    }),
    v5["push"]({
      id: "edge-image",
      sourceId: "image1",
      targetId: v3,
      refSlot: "refImage",
    }));
  includeText &&
    ((v4["text1"] = {
      id: "text1",
      type: "source-text",
      text: "mouth shape prompt",
    }),
    v5["push"]({
      id: "edge-text",
      sourceId: "text1",
      targetId: v3,
      refSlot: "",
    }));
  const v6 = createTestContext({
    targetId: v3,
    nodes: v4,
    incomingEdges: v5,
    nodeData: {
      id: v3,
      model: "runninghub/2054101324521844738",
      provider: "runninghubwf",
      rhVideoFrames: rhVideoFrames,
      rhVideoResolution: rhVideoResolution,
      rhInstanceType: rhInstanceType,
      generationParams: { rhInstanceType: rhInstanceType },
    },
    prompt: "ignored prompt",
  });
  return ((v6["ctx"]["_isRunninghubWorkflowModel"] = () => true), v6);
}
(test("video\x20task\x20orchestration:\x20视频对口型缺少视觉输入或音频时不构建\x20payload", async () => {
  const v7 = globalThis["window"]["showToast"],
    v8 = [];
  globalThis["window"]["showToast"] = (v9) => {
    v8["push"](String(v9 || ""));
  };
  try {
    {
      const { proto: v10, ctx: v11 } = createLipSyncPayloadContext({
        includeVideo: true,
        includeAudio: false,
      });
      (strict["equal"](await v10["_buildPayloadImpl"]["call"](v11), null),
        strict["equal"](v8["at"](-1), "请接入一个音频输入"));
    }
    {
      const { proto: v12, ctx: v13 } = createLipSyncPayloadContext({
        includeVideo: false,
        includeAudio: true,
      });
      (strict["equal"](await v12["_buildPayloadImpl"]["call"](v13), null),
        strict["equal"](v8["at"](-1), "请接入一个视频或参考图输入"));
    }
  } finally {
    globalThis["window"]["showToast"] = v7;
  }
}),
  test("video\x20task\x20orchestration:\x20视频对口型按\x2024fps\x20校验音频时长", async () => {
    const v14 = globalThis["window"]["showToast"],
      v15 = [];
    globalThis["window"]["showToast"] = (v16) => {
      v15["push"](String(v16 || ""));
    };
    try {
      {
        const { proto: v17, ctx: v18 } = createLipSyncPayloadContext({
            rhVideoFrames: 120,
            audioDuration: 5,
            rhInstanceType: "plus",
          }),
          v19 = await v17["_buildPayloadImpl"]["call"](v18);
        (strict["equal"](v19["rhVideoFrames"], 120),
          strict["equal"](v19["frameCount"], 120),
          strict["equal"](v19["rhVideoFps"], 24),
          strict["equal"](v19["rhInstanceType"], "plus"),
          strict["equal"](v19["rhLipSyncInputIndex"], 1),
          strict["deepEqual"](v19["inputUrls"], []),
          strict["equal"](v19["videoUrl"], "/output/source.mp4"),
          strict["equal"](v19["audioUrl"], "/output/audio.mp3"));
      }
      {
        const { proto: v20, ctx: v21 } = createLipSyncPayloadContext({
          rhVideoFrames: 121,
          audioDuration: 5,
        });
        (strict["equal"](await v20["_buildPayloadImpl"]["call"](v21), null),
          strict["equal"](v15["at"](-1), "生成视频时长不能超过音频时长"));
      }
    } finally {
      globalThis["window"]["showToast"] = v14;
    }
  }),
  test("video\x20task\x20orchestration:\x20RunningHub\x20workflow\x20instance\x20reads\x20generationParams\x20only", async () => {
    const { proto: v22, ctx: v23 } = createLipSyncPayloadContext({
      rhInstanceType: "default",
      rhVideoFrames: 120,
      audioDuration: 5,
    });
    ((v23["_data"]["rhInstanceType"] = "plus"),
      (v23["_data"]["generationParams"] = { rhInstanceType: "default" }));
    const v24 = await v22["_buildPayloadImpl"]["call"](v23);
    strict["equal"](v24["rhInstanceType"], "default");
  }),
  test("video task orchestration: generic RunningHub workflow params come from generationParams", async () => {
    const v25 = "node-commercial-digital-human",
      { proto: v26, ctx: v27 } = createTestContext({
        targetId: v25,
        nodes: {
          image1: {
            id: "image1",
            type: "source-image",
            imageUrl: "/output/ref.png",
          },
          audio1: {
            id: "audio1",
            type: "source-audio",
            localPath: "output/audio.mp3",
            duration: 20,
          },
        },
        incomingEdges: [
          {
            id: "edge-image",
            sourceId: "image1",
            targetId: v25,
            refSlot: "refImage",
          },
          {
            id: "edge-audio",
            sourceId: "audio1",
            targetId: v25,
            refSlot: "audio",
          },
        ],
        nodeData: {
          id: v25,
          model: "runninghub/2055639633148563458",
          provider: "runninghubwf",
          generationParams: {
            rhVideoResolution: 1440,
            rhVideoFrames: 321,
            rhDigitalHumanMotionAmplitude: "2",
            rhDigitalHumanSceneMotionAmplitude: "1",
            rhInstanceType: "plus",
          },
        },
        prompt: "commercial singing prompt",
      });
    v27["_isRunninghubWorkflowModel"] = () => true;
    const v28 = await v26["_buildPayloadImpl"]["call"](v27);
    (strict["equal"](v28["rhVideoResolution"], 1440),
      strict["equal"](v28["rhVideoFrames"], 321),
      strict["equal"](
        v28["generationParams"]?.["rhDigitalHumanMotionAmplitude"],
        "2",
      ),
      strict["equal"](
        v28["generationParams"]?.["rhDigitalHumanSceneMotionAmplitude"],
        "1",
      ),
      strict["equal"](v28["rhInstanceType"], "plus"),
      strict["deepEqual"](v28["inputUrls"], ["/output/ref.png"]),
      strict["equal"](v28["audioUrl"], "/output/audio.mp3"));
  }),
  test("video task orchestration: commercial digital human accepts cached audioDuration", async () => {
    const v29 = "node-commercial-digital-human-audio-duration",
      { proto: v30, ctx: v31 } = createTestContext({
        targetId: v29,
        nodes: {
          image1: {
            id: "image1",
            type: "source-image",
            imageUrl: "/output/ref.png",
          },
          audio1: {
            id: "audio1",
            type: "source-audio",
            localPath: "output/audio.mp3",
            audioDuration: 6,
          },
        },
        incomingEdges: [
          {
            id: "edge-image",
            sourceId: "image1",
            targetId: v29,
            refSlot: "refImage",
          },
          {
            id: "edge-audio",
            sourceId: "audio1",
            targetId: v29,
            refSlot: "audio",
          },
        ],
        nodeData: {
          id: v29,
          model: "runninghub/2055639633148563458",
          provider: "runninghubwf",
          generationParams: {
            rhVideoResolution: 1280,
            rhVideoFrames: 150,
            rhInstanceType: "default",
          },
        },
        prompt: "commercial singing prompt",
      });
    v31["_isRunninghubWorkflowModel"] = () => true;
    const v32 = await v30["_buildPayloadImpl"]["call"](v31);
    (strict["equal"](v32["rhVideoFrames"], 150),
      strict["equal"](v32["audioUrl"], "/output/audio.mp3"));
  }),
  test("video task orchestration: commercial digital human blocks when frames exceed audio duration at 25fps", async () => {
    const v33 = globalThis["window"]["showToast"],
      v34 = [];
    globalThis["window"]["showToast"] = (v35) => {
      v34["push"](String(v35 || ""));
    };
    try {
      const v36 = "node-commercial-digital-human-too-long",
        { proto: v37, ctx: v38 } = createTestContext({
          targetId: v36,
          nodes: {
            image1: {
              id: "image1",
              type: "source-image",
              imageUrl: "/output/ref.png",
            },
            audio1: {
              id: "audio1",
              type: "source-audio",
              localPath: "output/audio.mp3",
              duration: 6,
            },
          },
          incomingEdges: [
            {
              id: "edge-image",
              sourceId: "image1",
              targetId: v36,
              refSlot: "refImage",
            },
            {
              id: "edge-audio",
              sourceId: "audio1",
              targetId: v36,
              refSlot: "audio",
            },
          ],
          nodeData: {
            id: v36,
            model: "runninghub/2055639633148563458",
            provider: "runninghubwf",
            generationParams: {
              rhVideoResolution: 1280,
              rhVideoFrames: 151,
              rhInstanceType: "default",
            },
          },
          prompt: "commercial singing prompt",
        });
      ((v38["_isRunninghubWorkflowModel"] = () => true),
        strict["equal"](await v37["_buildPayloadImpl"]["call"](v38), null),
        strict["equal"](
          v34["at"](-1),
          "生成视频时长不能超过音频时长（按25帧/秒计算）",
        ));
    } finally {
      globalThis["window"]["showToast"] = v33;
    }
  }),
  test("video task orchestration: 视频对口型图片入参写入 inputUrls 并切换 index", async () => {
    const { proto: v39, ctx: v40 } = createLipSyncPayloadContext({
        includeVideo: false,
        includeImage: true,
        rhVideoFrames: 120,
        audioDuration: 5,
      }),
      v41 = await v39["_buildPayloadImpl"]["call"](v40);
    (strict["equal"](v41["videoUrl"], undefined),
      strict["equal"](v41["audioUrl"], "/output/audio.mp3"),
      strict["equal"](v41["rhLipSyncInputIndex"], 0),
      strict["deepEqual"](v41["inputUrls"], ["/output/ref.png"]));
  }),
  test("video task orchestration: 视频对口型图片入参不接受全长帧数", async () => {
    const v42 = globalThis["window"]["showToast"],
      v43 = [];
    globalThis["window"]["showToast"] = (v44) => {
      v43["push"](String(v44 || ""));
    };
    try {
      const { proto: v45, ctx: v46 } = createLipSyncPayloadContext({
        includeVideo: false,
        includeImage: true,
        rhVideoFrames: 0,
        audioDuration: 5,
      });
      (strict["equal"](await v45["_buildPayloadImpl"]["call"](v46), null),
        strict["equal"](v43["at"](-1), "参考图入参请设置大于\x200\x20的帧数"));
    } finally {
      globalThis["window"]["showToast"] = v42;
    }
  }),
  test("video task orchestration: 视频对口型接受文本作为提示词输入", async () => {
    const { proto: v47, ctx: v48 } = createLipSyncPayloadContext({
        includeText: true,
        rhVideoFrames: 120,
        audioDuration: 5,
      }),
      v49 = await v47["_buildPayloadImpl"]["call"](v48);
    (strict["equal"](
      v49["prompt"],
      "mouth\x20shape\x20prompt\x0aignored\x20prompt",
    ),
      strict["equal"](v49["videoUrl"], "/output/source.mp4"),
      strict["equal"](v49["audioUrl"], "/output/audio.mp3"),
      strict["deepEqual"](v49["inputUrls"], []));
  }),
  test("video\x20task\x20orchestration:\x20视频对口型帧数\x200\x20按视频全长换算", async () => {
    const v50 = globalThis["window"]["showToast"],
      v51 = [];
    globalThis["window"]["showToast"] = (v52) => {
      v51["push"](String(v52 || ""));
    };
    try {
      {
        const { proto: v53, ctx: v54 } = createLipSyncPayloadContext({
            rhVideoFrames: 0,
            videoDuration: 4,
            audioDuration: 5,
          }),
          v55 = await v53["_buildPayloadImpl"]["call"](v54);
        (strict["equal"](v55["rhVideoFrames"], 96),
          strict["equal"](v55["frameCount"], 96));
      }
      {
        const { proto: v56, ctx: v57 } = createLipSyncPayloadContext({
          rhVideoFrames: 0,
          videoDuration: 6,
          audioDuration: 5,
        });
        (strict["equal"](await v56["_buildPayloadImpl"]["call"](v57), null),
          strict["equal"](v51["at"](-1), "生成视频时长不能超过音频时长"));
      }
    } finally {
      globalThis["window"]["showToast"] = v50;
    }
  }),
  test("video task orchestration: 视频对口型分辨率不低于 832", async () => {
    const { proto: v58, ctx: v59 } = createLipSyncPayloadContext({
        rhVideoFrames: 120,
        audioDuration: 5,
        rhVideoResolution: 512,
      }),
      v60 = await v58["_buildPayloadImpl"]["call"](v59);
    strict["equal"](v60["rhVideoResolution"], 832);
  }),
  test["afterEach"](() => {
    (_resetPreviewRuntimeForTests(), _resetAssetMentionRegistryForTests());
  }));
function createStore(v61, v62 = []) {
  return {
    getState() {
      return v61;
    },
    getIncomingEdges(v63) {
      return v62["filter"]((v64) => v64["targetId"] === v63);
    },
    updateNodeData(v65, v66) {
      const v67 = v61["nodes"]?.[v65] || {};
      v61["nodes"][v65] = { ...v67, ...v66 };
    },
  };
}
function createButtonStub() {
  return {
    disabled: false,
    style: { color: "" },
    title: "",
    innerHTML: "",
    _attrs: new Map(),
    setAttribute(v68, v69) {
      this["_attrs"]["set"](String(v68 || ""), String(v69 || ""));
    },
    removeAttribute(v70) {
      this["_attrs"]["delete"](String(v70 || ""));
    },
  };
}
function createPromptTextNode(v71 = "") {
  return { nodeType: 3, textContent: String(v71 || "") };
}
function createPromptElementNode({
  tagName: tagName = "SPAN",
  className: className = "",
  dataset: dataset = {},
  textContent: textContent = "",
  childNodes: childNodes = [],
} = {}) {
  const v72 = String(className || "")
    ["split"](/\s+/)
    ["filter"](Boolean);
  return {
    nodeType: 1,
    tagName: tagName,
    className: className,
    classList: {
      contains(v73) {
        return v72["includes"](String(v73 || ""));
      },
    },
    dataset: { ...dataset },
    textContent: String(textContent || ""),
    childNodes: Array["isArray"](childNodes) ? childNodes : [],
  };
}
function createPromptPillNode(v74, v75) {
  return createPromptElementNode({
    className: "ref-pill",
    dataset: { label: String(v74 || ""), nodeId: String(v75 || "") },
    textContent: String(v74 || ""),
  });
}
function createAssetPromptPillNode(v76, v77, v78, v79) {
  return createPromptElementNode({
    className: "ref-pill",
    dataset: {
      label: String(v76 || ""),
      refOrigin: "asset",
      assetId: String(v77 || ""),
      assetIndex: String(v78),
      refType: String(v79 || ""),
    },
    textContent: String(v76 || ""),
  });
}
function collectPromptInnerText(v80) {
  return (Array["isArray"](v80) ? v80 : [])
    ["map"]((v81) => {
      const v82 = Number(v81?.["nodeType"]);
      if (v82 === 3) return String(v81?.["textContent"] || "");
      if (v82 !== 1) return "";
      if (String(v81?.["tagName"] || "")["toUpperCase"]() === "BR")
        return "\x0a";
      const v83 = Array["isArray"](v81?.["childNodes"])
        ? v81["childNodes"]
        : [];
      if (v83["length"] > 0) return collectPromptInnerText(v83);
      return String(v81?.["textContent"] || "");
    })
    ["join"]("");
}
function createPromptEl(v84 = "test prompt") {
  if (Array["isArray"](v84)) {
    const v85 = collectPromptInnerText(v84);
    return { innerText: v85, textContent: v85, childNodes: v84 };
  }
  const v86 = String(v84 || "");
  return {
    innerText: v86,
    textContent: v86,
    childNodes: [createPromptTextNode(v86)],
  };
}
function createTestContext({
  targetId: v87,
  nodeData: v88,
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  prompt: prompt = "test\x20prompt",
  promptEl: promptEl = null,
  apiImpl: apiImpl = {},
  startLoadingImpl: startLoadingImpl = () => {},
  stopLoadingImpl: stopLoadingImpl = () => {},
}) {
  const v89 = { nodes: { ...nodes, [v87]: { ...v88 } } },
    v90 = createStore(v89, incomingEdges),
    v91 = createVideoNodeTaskOrchestrationModule({
      store: v90,
      api: apiImpl,
      getImage: async () => null,
      startLoading: startLoadingImpl,
      stopLoading: stopLoadingImpl,
      ensureConfig: async () => {},
      getProviderConfig: () => ({ apiKey: "" }),
      isVideoVipModel: () => false,
      ensureVipSessionRecheck: async () => {},
    }),
    v92 = Object["assign"](Object["create"](v91), {
      nodeId: v87,
      _data: v89["nodes"][v87],
      promptEl: promptEl || createPromptEl(prompt),
      _normalizeDreaminaNodeData(v93) {
        return v93;
      },
      _resolveMediaUrl(v94) {
        return String(v94 || "");
      },
      _isDreaminaVideoNode(v95) {
        const v96 = String(v95?.["provider"] || "")
            ["trim"]()
            ["toLowerCase"](),
          v97 = String(v95?.["model"] || "")["trim"]();
        return v96 === "dreamina" || v97["startsWith"]("dreamina/");
      },
      _isRunninghubWorkflowModel() {
        return false;
      },
    });
  return { ctx: v92, proto: v91, state: v89, store: v90 };
}
(test("video\x20task\x20orchestration:\x20APIMart\x20modelApi\x20payload\x20keeps\x20existing\x20controls\x20and\x20typed\x20media", async () => {
  const v98 = "node-apimart-modelapi",
    { proto: v99, ctx: v100 } = createTestContext({
      targetId: v98,
      nodeData: {
        id: v98,
        model: "apimart/wan2.7",
        provider: "apimart",
        aspectRatio: "1:1",
        resolution: "1080P",
        duration: 6,
        generationParams: { wan27_mode: "image" },
      },
      nodes: {
        image1: {
          id: "image1",
          type: "source-image",
          imageUrl: "https://cdn.apimart.ai/ref-image.png",
        },
        audio1: {
          id: "audio1",
          type: "source-audio",
          audioUrl: "https://cdn.apimart.ai/ref-audio.mp3",
          duration: 8,
          fileSize: 5 * 1024 * 1024,
        },
      },
      incomingEdges: [
        { id: "edge-image", sourceId: "image1", targetId: v98 },
        { id: "edge-audio", sourceId: "audio1", targetId: v98 },
      ],
      prompt: "cinematic horse",
    }),
    v101 = await v99["_buildPayloadImpl"]["call"](v100);
  (strict["equal"](v101["model"], "apimart/wan2.7"),
    strict["equal"](v101["provider"], "apimart"),
    strict["equal"](v101["aspectRatio"], "1:1"),
    strict["equal"](v101["resolution"], "1080P"),
    strict["equal"](v101["duration"], 6),
    strict["deepEqual"](v101["generationParams"], { wan27_mode: "image" }),
    strict["deepEqual"](v101["inputUrls"], [
      "https://cdn.apimart.ai/ref-image.png",
    ]),
    strict["deepEqual"](v101["images"], [
      "https://cdn.apimart.ai/ref-image.png",
    ]),
    strict["deepEqual"](v101["videos"], []),
    strict["deepEqual"](v101["audios"], [
      "https://cdn.apimart.ai/ref-audio.mp3",
    ]));
}),
  test("video task orchestration: modelApi adaptive ratio uses source media size", async () => {
    const v102 = "node-video-runninghub-wan-adaptive-source",
      v103 = "node-image-runninghub-wan-portrait",
      { proto: v104, ctx: v105 } = createTestContext({
        targetId: v102,
        nodeData: {
          id: v102,
          model: "runninghub-model/wan2.7",
          provider: "runninghub",
          aspectRatio: "自适应",
          width: 1600,
          height: 900,
          generationParams: { wan27_mode: "image", aspectRatio: "自适应" },
        },
        nodes: {
          [v103]: {
            id: v103,
            type: "source-image",
            imageUrl: "https://www.runninghub.cn/assets/portrait.png",
            originalWidth: 720,
            originalHeight: 1280,
          },
        },
        incomingEdges: [
          { id: "edge-wan-portrait", sourceId: v103, targetId: v102 },
        ],
        prompt: "make it move",
      }),
      v106 = await v104["_buildPayloadImpl"]["call"](v105);
    (strict["equal"](v106["aspectRatio"], "自适应"),
      strict["equal"](v106["resolvedRatioLabel"], "9:16"));
  }),
  test("video\x20task\x20orchestration:\x20modelApi\x20adaptive\x20ratio\x20falls\x20back\x20to\x20node\x20display\x20size", async () => {
    const v107 = "node-video-runninghub-veo-adaptive-display",
      { proto: v108, ctx: v109 } = createTestContext({
        targetId: v107,
        nodeData: {
          id: v107,
          model: "runninghub-model/veo3",
          provider: "runninghub",
          aspectRatio: "自适应",
          width: 1600,
          height: 900,
          generationParams: {
            rh_veo3_channel: "lowCost",
            mode: "fast",
            aspectRatio: "自适应",
          },
        },
        prompt: "wide city lights",
      }),
      v110 = await v108["_buildPayloadImpl"]["call"](v109);
    (strict["equal"](v110["aspectRatio"], "自适应"),
      strict["equal"](v110["resolvedRatioLabel"], "16:9"));
  }),
  test("video task orchestration: modelApi adaptive ratio falls back to manifest option", async () => {
    const v111 = "node-video-runninghub-happyhorse-adaptive-default",
      { proto: v112, ctx: v113 } = createTestContext({
        targetId: v111,
        nodeData: {
          id: v111,
          model: "runninghub-model/happyhorse-1.0",
          provider: "runninghub",
          aspectRatio: "自适应",
          generationParams: { happyhorse_mode: "image", aspectRatio: "自适应" },
        },
        prompt: "running horse",
      }),
      v114 = await v112["_buildPayloadImpl"]["call"](v113);
    (strict["equal"](v114["aspectRatio"], "自适应"),
      strict["equal"](v114["resolvedRatioLabel"], "16:9"),
      strict["equal"](v114["generationParams"]["happyhorse_mode"], "auto"));
  }),
  test("video task orchestration: Wan2.7 video mode validates continuation input", async () => {
    const v115 = globalThis["window"]["showToast"],
      v116 = [];
    globalThis["window"]["showToast"] = (v117) =>
      v116["push"](String(v117 || ""));
    try {
      const v118 = "node-apimart-wan27-video",
        v119 = createTestContext({
          targetId: v118,
          nodeData: {
            id: v118,
            model: "apimart/wan2.7",
            provider: "apimart",
            generationParams: { wan27_mode: "video" },
          },
          nodes: {
            video1: {
              id: "video1",
              type: "source-video",
              videoUrl: "https://cdn.apimart.ai/ref-video.mp4",
              videoDuration: 8,
            },
          },
          incomingEdges: [
            { id: "edge-video", sourceId: "video1", targetId: v118 },
          ],
          prompt: "continue\x20forward",
        }),
        v120 = await v119["proto"]["_buildPayloadImpl"]["call"](v119["ctx"]);
      (strict["deepEqual"](v120["images"], []),
        strict["deepEqual"](v120["videos"], [
          "https://cdn.apimart.ai/ref-video.mp4",
        ]),
        strict["deepEqual"](v120["audios"], []),
        strict["deepEqual"](v120["inputUrls"], []),
        strict["deepEqual"](v120["generationParams"], { wan27_mode: "video" }));
      const v121 = createTestContext({
          targetId: "node-apimart-wan27-short-id",
          nodeData: {
            id: "node-apimart-wan27-short-id",
            model: "wan2.7",
            provider: "apimart",
            generationParams: { wan27_mode: "video" },
          },
          nodes: {
            video1: {
              id: "video1",
              type: "source-video",
              videoUrl: "https://cdn.apimart.ai/ref-video.mp4",
              videoDuration: 8,
            },
          },
          incomingEdges: [
            {
              id: "edge-short-id-video",
              sourceId: "video1",
              targetId: "node-apimart-wan27-short-id",
            },
          ],
          prompt: "continue forward",
        }),
        v122 = await v121["proto"]["_buildPayloadImpl"]["call"](v121["ctx"]);
      (strict["deepEqual"](v122["videos"], [
        "https://cdn.apimart.ai/ref-video.mp4",
      ]),
        strict["deepEqual"](v122["generationParams"], { wan27_mode: "video" }));
      const v123 = createTestContext({
          targetId: "node-apimart-wan27-stale-provider",
          nodeData: {
            id: "node-apimart-wan27-stale-provider",
            model: "apimart/wan2.7",
            provider: "apimartr",
            generationParams: { wan27_mode: "video" },
          },
          nodes: {
            video1: {
              id: "video1",
              type: "source-video",
              videoUrl: "https://cdn.apimart.ai/ref-video.mp4",
              videoDuration: 8,
            },
          },
          incomingEdges: [
            {
              id: "edge-stale-provider-video",
              sourceId: "video1",
              targetId: "node-apimart-wan27-stale-provider",
            },
          ],
          prompt: "continue forward",
        }),
        v124 = await v123["proto"]["_buildPayloadImpl"]["call"](v123["ctx"]);
      (strict["deepEqual"](v124["videos"], [
        "https://cdn.apimart.ai/ref-video.mp4",
      ]),
        strict["deepEqual"](v124["generationParams"], { wan27_mode: "video" }));
      const v125 = createTestContext({
          targetId: "node-runninghub-wan27-video",
          nodeData: {
            id: "node-runninghub-wan27-video",
            model: "runninghub-model/wan2.7",
            provider: "runninghub",
            generationParams: { wan27_mode: "video" },
          },
          nodes: {
            video1: {
              id: "video1",
              type: "source-video",
              videoUrl: "https://www.runninghub.cn/assets/wan-source.mp4",
              videoDuration: 8,
            },
          },
          incomingEdges: [
            {
              id: "edge-runninghub-wan27-video",
              sourceId: "video1",
              targetId: "node-runninghub-wan27-video",
              refSlot: "sourceVideo",
            },
          ],
          prompt: "continue forward",
        }),
        v126 = await v125["proto"]["_buildPayloadImpl"]["call"](v125["ctx"]);
      (strict["deepEqual"](v126["videos"], [
        "https://www.runninghub.cn/assets/wan-source.mp4",
      ]),
        strict["deepEqual"](v126["generationParams"], { wan27_mode: "video" }));
      const v127 = createTestContext({
        targetId: "node-apimart-wan27-video-long",
        nodeData: {
          id: "node-apimart-wan27-video-long",
          model: "apimart/wan2.7",
          provider: "apimart",
          generationParams: { wan27_mode: "video" },
        },
        nodes: {
          video1: {
            id: "video1",
            type: "source-video",
            videoUrl: "https://cdn.apimart.ai/long-video.mp4",
            videoDuration: 10.5,
          },
        },
        incomingEdges: [
          {
            id: "edge-long-video",
            sourceId: "video1",
            targetId: "node-apimart-wan27-video-long",
          },
        ],
        prompt: "continue forward",
      });
      (strict["equal"](
        await v127["proto"]["_buildPayloadImpl"]["call"](v127["ctx"]),
        null,
      ),
        strict["match"](v116["join"]("\x0a"), /不能超过 10 秒/));
    } finally {
      globalThis["window"]["showToast"] = v115;
    }
  }),
  test("video task orchestration: Wan2.7 image mode validates audio limits", async () => {
    const v128 = globalThis["window"]["showToast"],
      v129 = [];
    globalThis["window"]["showToast"] = (v130) =>
      v129["push"](String(v130 || ""));
    try {
      const v131 = createTestContext({
        targetId: "node-apimart-wan27-audio-short",
        nodeData: {
          id: "node-apimart-wan27-audio-short",
          model: "apimart/wan2.7",
          provider: "apimart",
          generationParams: { wan27_mode: "image" },
        },
        nodes: {
          audio1: {
            id: "audio1",
            type: "source-audio",
            audioUrl: "https://cdn.apimart.ai/short.mp3",
            duration: 1.5,
          },
        },
        incomingEdges: [
          {
            id: "edge-short-audio",
            sourceId: "audio1",
            targetId: "node-apimart-wan27-audio-short",
          },
        ],
        prompt: "music driven motion",
      });
      (strict["equal"](
        await v131["proto"]["_buildPayloadImpl"]["call"](v131["ctx"]),
        null,
      ),
        strict["match"](v129["join"]("\x0a"), /音频必须为 2-30 秒/),
        (v129["length"] = 0));
      const v132 = createTestContext({
        targetId: "node-apimart-wan27-audio-large",
        nodeData: {
          id: "node-apimart-wan27-audio-large",
          model: "apimart/wan2.7",
          provider: "apimart",
          generationParams: { wan27_mode: "image" },
        },
        nodes: {
          audio1: {
            id: "audio1",
            type: "source-audio",
            audioUrl: "https://cdn.apimart.ai/large.mp3",
            duration: 10,
            fileSize: 16 * 1024 * 1024,
          },
        },
        incomingEdges: [
          {
            id: "edge-large-audio",
            sourceId: "audio1",
            targetId: "node-apimart-wan27-audio-large",
          },
        ],
        prompt: "music\x20driven\x20motion",
      });
      (strict["equal"](
        await v132["proto"]["_buildPayloadImpl"]["call"](v132["ctx"]),
        null,
      ),
        strict["match"](v129["join"]("\x0a"), /小于 15MB/));
    } finally {
      globalThis["window"]["showToast"] = v128;
    }
  }),
  test("video task orchestration: Wan2.7 reference and edit modes filter media", async () => {
    const v133 = globalThis["window"]["showToast"],
      v134 = [];
    globalThis["window"]["showToast"] = (v135) =>
      v134["push"](String(v135 || ""));
    try {
      const v136 = "node-apimart-wan27-reference",
        v137 = createTestContext({
          targetId: v136,
          nodeData: {
            id: v136,
            model: "apimart/wan2.7",
            provider: "apimart",
            generationParams: { wan27_mode: "reference" },
          },
          nodes: {
            image1: {
              id: "image1",
              type: "source-image",
              imageUrl: "https://cdn.apimart.ai/ref-image.png",
            },
            audio1: {
              id: "audio1",
              type: "source-audio",
              audioUrl: "https://cdn.apimart.ai/ref-voice.mp3",
              audioDuration: 8,
              audioSizeBytes: 1024 * 1024,
            },
            video1: {
              id: "video1",
              type: "source-video",
              videoUrl: "https://cdn.apimart.ai/ref-video.mp4",
              videoDuration: 12,
            },
          },
          incomingEdges: [
            {
              id: "edge-reference-image",
              sourceId: "image1",
              targetId: v136,
              refSlot: "referenceImage",
            },
            {
              id: "edge-reference-video",
              sourceId: "video1",
              targetId: v136,
              refSlot: "referenceVideo",
            },
            {
              id: "edge-reference-audio",
              sourceId: "audio1",
              targetId: v136,
              refSlot: "referenceAudio",
            },
          ],
          prompt: "use the character and camera style",
        }),
        v138 = await v137["proto"]["_buildPayloadImpl"]["call"](v137["ctx"]);
      (strict["deepEqual"](v138["images"], [
        "https://cdn.apimart.ai/ref-image.png",
      ]),
        strict["deepEqual"](v138["videos"], [
          "https://cdn.apimart.ai/ref-video.mp4",
        ]),
        strict["deepEqual"](v138["audios"], [
          "https://cdn.apimart.ai/ref-voice.mp3",
        ]),
        strict["deepEqual"](v138["inputUrls"], [
          "https://cdn.apimart.ai/ref-image.png",
        ]),
        strict["deepEqual"](v138["generationParams"], {
          wan27_mode: "reference",
        }));
      const v139 = "node-apimart-wan27-edit",
        v140 = createTestContext({
          targetId: v139,
          nodeData: {
            id: v139,
            model: "apimart/wan2.7",
            provider: "apimart",
            generationParams: { wan27_mode: "edit" },
          },
          nodes: {
            original: {
              id: "original",
              type: "source-video",
              videoUrl: "https://cdn.apimart.ai/original.mp4",
              videoDuration: 8,
            },
            reference: {
              id: "reference",
              type: "source-video",
              videoUrl: "https://cdn.apimart.ai/reference.mp4",
              videoDuration: 6,
            },
          },
          incomingEdges: [
            {
              id: "edge-original",
              sourceId: "original",
              targetId: v139,
              refSlot: "originalVideo",
            },
            {
              id: "edge-reference",
              sourceId: "reference",
              targetId: v139,
              refSlot: "referenceVideo",
            },
          ],
          prompt: "change\x20clothes\x20to\x20red\x20dress",
        }),
        v141 = await v140["proto"]["_buildPayloadImpl"]["call"](v140["ctx"]);
      (strict["deepEqual"](v141["images"], []),
        strict["deepEqual"](v141["videos"], [
          "https://cdn.apimart.ai/original.mp4",
          "https://cdn.apimart.ai/reference.mp4",
        ]),
        strict["deepEqual"](v141["audios"], []),
        strict["deepEqual"](v141["inputUrls"], []),
        strict["deepEqual"](v141["generationParams"], { wan27_mode: "edit" }));
      const v142 = createTestContext({
        targetId: "node-apimart-wan27-edit-long",
        nodeData: {
          id: "node-apimart-wan27-edit-long",
          model: "apimart/wan2.7",
          provider: "apimart",
          generationParams: { wan27_mode: "edit" },
        },
        nodes: {
          original: {
            id: "original",
            type: "source-video",
            videoUrl: "https://cdn.apimart.ai/original-long.mp4",
            videoDuration: 12,
          },
        },
        incomingEdges: [
          {
            id: "edge-original-long",
            sourceId: "original",
            targetId: "node-apimart-wan27-edit-long",
          },
        ],
        prompt: "change scene",
      });
      (strict["equal"](
        await v142["proto"]["_buildPayloadImpl"]["call"](v142["ctx"]),
        null,
      ),
        strict["match"](v134["join"]("\x0a"), /2-10 秒/));
    } finally {
      globalThis["window"]["showToast"] = v133;
    }
  }),
  test("video task orchestration: Hailuo 02 fixed frame slots produce inputUrlsBySlot", async () => {
    const v143 = "node-apimart-hailuo-02",
      { proto: v144, ctx: v145 } = createTestContext({
        targetId: v143,
        nodeData: {
          id: v143,
          model: "apimart/minimax-hailuo",
          provider: "apimart",
          generationParams: { duration: 10, resolution: "768p" },
        },
        nodes: {
          first: {
            id: "first",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/first.png",
          },
          last: {
            id: "last",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/last.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-first",
            sourceId: "first",
            targetId: v143,
            refSlot: "firstFrame",
          },
          {
            id: "edge-last",
            sourceId: "last",
            targetId: v143,
            refSlot: "lastFrame",
          },
        ],
        prompt: "cinematic transition",
      }),
      v146 = await v144["_buildPayloadImpl"]["call"](v145);
    (strict["deepEqual"](v146["images"], [
      "https://cdn.apimart.ai/first.png",
      "https://cdn.apimart.ai/last.png",
    ]),
      strict["deepEqual"](v146["inputUrls"], v146["images"]),
      strict["deepEqual"](v146["inputUrlsBySlot"], {
        firstFrame: "https://cdn.apimart.ai/first.png",
        lastFrame: "https://cdn.apimart.ai/last.png",
      }));
  }),
  test("video task orchestration: RunningHub Hailuo 02 fixed frame slots produce inputUrlsBySlot", async () => {
    const v147 = "node-runninghub-hailuo-02",
      { proto: v148, ctx: v149 } = createTestContext({
        targetId: v147,
        nodeData: {
          id: v147,
          model: "runninghub-model/hailuo-02",
          provider: "runninghub",
          generationParams: { rh_hailuo_02_quality: "standard", duration: 6 },
        },
        nodes: {
          first: {
            id: "first",
            type: "source-image",
            imageUrl: "https://www.runninghub.cn/assets/hailuo-first.png",
          },
          last: {
            id: "last",
            type: "source-image",
            imageUrl: "https://www.runninghub.cn/assets/hailuo-last.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-first",
            sourceId: "first",
            targetId: v147,
            refSlot: "firstFrame",
          },
          {
            id: "edge-last",
            sourceId: "last",
            targetId: v147,
            refSlot: "lastFrame",
          },
        ],
        prompt: "cinematic\x20transition",
      }),
      v150 = await v148["_buildPayloadImpl"]["call"](v149);
    (strict["equal"](v150["provider"], "runninghub"),
      strict["deepEqual"](v150["inputUrlsBySlot"], {
        firstFrame: "https://www.runninghub.cn/assets/hailuo-first.png",
        lastFrame: "https://www.runninghub.cn/assets/hailuo-last.png",
      }));
  }),
  test("video task orchestration: RunningHub Hailuo 2.3 fixed first frame slot produces inputUrlsBySlot", async () => {
    const v151 = "node-runninghub-hailuo-23",
      { proto: v152, ctx: v153 } = createTestContext({
        targetId: v151,
        nodeData: {
          id: v151,
          model: "runninghub-model/hailuo-2.3",
          provider: "runninghub",
          generationParams: { rh_hailuo_23_quality: "fast", duration: 6 },
        },
        nodes: {
          first: {
            id: "first",
            type: "source-image",
            imageUrl: "https://www.runninghub.cn/assets/hailuo-23-first.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-first",
            sourceId: "first",
            targetId: v151,
            refSlot: "firstFrame",
          },
        ],
        prompt: "animate\x20the\x20first\x20frame",
      }),
      v154 = await v152["_buildPayloadImpl"]["call"](v153);
    (strict["equal"](v154["provider"], "runninghub"),
      strict["deepEqual"](v154["inputUrlsBySlot"], {
        firstFrame: "https://www.runninghub.cn/assets/hailuo-23-first.png",
      }));
  }),
  test("video task orchestration: Hailuo 2.3 fixed first frame slot produces inputUrlsBySlot", async () => {
    const v155 = "node-apimart-hailuo-23",
      { proto: v156, ctx: v157 } = createTestContext({
        targetId: v155,
        nodeData: {
          id: v155,
          model: "apimart/minimax-hailuo-2.3",
          provider: "apimart",
          generationParams: {
            mode: "standard",
            duration: 10,
            resolution: "768p",
          },
        },
        nodes: {
          first: {
            id: "first",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/hailuo-23-first.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-first",
            sourceId: "first",
            targetId: v155,
            refSlot: "firstFrame",
          },
        ],
        prompt: "cinematic first frame motion",
      }),
      v158 = await v156["_buildPayloadImpl"]["call"](v157);
    (strict["deepEqual"](v158["images"], [
      "https://cdn.apimart.ai/hailuo-23-first.png",
    ]),
      strict["deepEqual"](v158["inputUrls"], v158["images"]),
      strict["deepEqual"](v158["inputUrlsBySlot"], {
        firstFrame: "https://cdn.apimart.ai/hailuo-23-first.png",
      }));
  }),
  test("video task orchestration: VEO3 fixed slots reuse manifest input slot routing", async () => {
    const v159 = "node-apimart-veo3",
      { proto: v160, ctx: v161 } = createTestContext({
        targetId: v159,
        nodeData: {
          id: v159,
          model: "apimart/veo3-fast",
          provider: "apimart",
          generationParams: {
            mode: "fast",
            generation_type: "frame",
            duration: 8,
            resolution: "720p",
          },
        },
        nodes: {
          first: {
            id: "first",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/veo-first.png",
          },
          last: {
            id: "last",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/veo-last.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-first",
            sourceId: "first",
            targetId: v159,
            refSlot: "firstFrame",
          },
          {
            id: "edge-last",
            sourceId: "last",
            targetId: v159,
            refSlot: "lastFrame",
          },
        ],
        prompt: "cinematic transition",
      }),
      v162 = await v160["_buildPayloadImpl"]["call"](v161);
    (strict["deepEqual"](v162["images"], [
      "https://cdn.apimart.ai/veo-first.png",
      "https://cdn.apimart.ai/veo-last.png",
    ]),
      strict["deepEqual"](v162["inputUrlsBySlot"], {
        firstFrame: "https://cdn.apimart.ai/veo-first.png",
        lastFrame: "https://cdn.apimart.ai/veo-last.png",
      }));
  }),
  test("video task orchestration: stale refSlot fills current VEO3 modelApi slot", async () => {
    const v163 = "node-apimart-veo3-stale-refslot",
      { proto: v164, ctx: v165 } = createTestContext({
        targetId: v163,
        nodeData: {
          id: v163,
          model: "apimart/veo3-fast",
          provider: "apimart",
          generationParams: {
            mode: "fast",
            generation_type: "frame",
            duration: 8,
            resolution: "720p",
          },
        },
        nodes: {
          legacyRef: {
            id: "legacyRef",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/legacy-ref.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-legacy-refslot",
            sourceId: "legacyRef",
            targetId: v163,
            refSlot: "refImage",
          },
        ],
        prompt: "cinematic transition",
      }),
      v166 = await v164["_buildPayloadImpl"]["call"](v165);
    (strict["deepEqual"](v166["images"], [
      "https://cdn.apimart.ai/legacy-ref.png",
    ]),
      strict["deepEqual"](v166["inputUrlsBySlot"], {
        firstFrame: "https://cdn.apimart.ai/legacy-ref.png",
      }));
  }),
  test("video task orchestration: Vidu Q3 switches fixed slots by generation mode", async () => {
    const v167 = "node-apimart-vidu-q3-video",
      v168 = createTestContext({
        targetId: v167,
        nodeData: {
          id: v167,
          model: "apimart/viduq3",
          provider: "apimart",
          generationParams: {
            vidu_q3_generation_mode: "video",
            mode: "viduq3-turbo",
            duration: 5,
            resolution: "720p",
          },
        },
        nodes: {
          first: {
            id: "first",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/vidu-first.png",
          },
          last: {
            id: "last",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/vidu-last.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-first",
            sourceId: "first",
            targetId: v167,
            refSlot: "firstFrame",
          },
          {
            id: "edge-last",
            sourceId: "last",
            targetId: v167,
            refSlot: "lastFrame",
          },
        ],
        prompt: "cinematic Vidu transition",
      }),
      v169 = await v168["proto"]["_buildPayloadImpl"]["call"](v168["ctx"]);
    strict["deepEqual"](v169["inputUrlsBySlot"], {
      firstFrame: "https://cdn.apimart.ai/vidu-first.png",
      lastFrame: "https://cdn.apimart.ai/vidu-last.png",
    });
    const v170 = "node-apimart-vidu-q3-reference",
      v171 = createTestContext({
        targetId: v170,
        nodeData: {
          id: v170,
          model: "apimart/viduq3",
          provider: "apimart",
          generationParams: {
            vidu_q3_generation_mode: "reference",
            mode: "viduq3",
            duration: 5,
            resolution: "720p",
          },
        },
        nodes: {
          refA: {
            id: "refA",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/vidu-ref-a.png",
          },
          refB: {
            id: "refB",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/vidu-ref-b.png",
          },
        },
        incomingEdges: [
          { id: "edge-ref-a", sourceId: "refA", targetId: v170 },
          { id: "edge-ref-b", sourceId: "refB", targetId: v170 },
        ],
        prompt: "reference guided Vidu motion",
      }),
      v172 = await v171["proto"]["_buildPayloadImpl"]["call"](v171["ctx"]);
    (strict["deepEqual"](v172["images"], [
      "https://cdn.apimart.ai/vidu-ref-a.png",
      "https://cdn.apimart.ai/vidu-ref-b.png",
    ]),
      strict["equal"](v172["inputUrlsBySlot"], undefined));
  }),
  test("video task orchestration: Kling V3 Omni modes filter media and fixed slots", async () => {
    const v173 = "node-apimart-kling-omni-image",
      v174 = createTestContext({
        targetId: v173,
        nodeData: {
          id: v173,
          model: "apimart/kling-v3-omni",
          provider: "apimart",
          generationParams: {
            kling_v3_omni_mode: "image",
            duration: 6,
            resolution: "pro",
          },
        },
        nodes: {
          first: {
            id: "first",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/omni-first.png",
          },
          last: {
            id: "last",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/omni-last.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-last",
            sourceId: "last",
            targetId: v173,
            refSlot: "lastFrame",
          },
          {
            id: "edge-first",
            sourceId: "first",
            targetId: v173,
            refSlot: "firstFrame",
          },
        ],
        prompt: "omni image mode",
      }),
      v175 = await v174["proto"]["_buildPayloadImpl"]["call"](v174["ctx"]);
    (strict["equal"](v175["generationParams"]["kling_v3_omni_mode"], "image"),
      strict["deepEqual"](v175["images"], [
        "https://cdn.apimart.ai/omni-first.png",
        "https://cdn.apimart.ai/omni-last.png",
      ]),
      strict["deepEqual"](v175["inputUrlsBySlot"], {
        firstFrame: "https://cdn.apimart.ai/omni-first.png",
        lastFrame: "https://cdn.apimart.ai/omni-last.png",
      }));
    const v176 = "node-apimart-kling-omni-reference",
      v177 = createTestContext({
        targetId: v176,
        nodeData: {
          id: v176,
          model: "apimart/kling-v3-omni",
          provider: "apimart",
          generationParams: { kling_v3_omni_mode: "reference" },
        },
        nodes: {
          image1: {
            id: "image1",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/omni-ref.png",
          },
          video1: {
            id: "video1",
            type: "source-video",
            videoUrl: "https://cdn.apimart.ai/omni-feature.mp4",
          },
        },
        incomingEdges: [
          {
            id: "edge-ref-image",
            sourceId: "image1",
            targetId: v176,
            refSlot: "referenceImage",
          },
          {
            id: "edge-ref-video",
            sourceId: "video1",
            targetId: v176,
            refSlot: "referenceVideo",
          },
        ],
        prompt: "omni reference mode",
      }),
      v178 = await v177["proto"]["_buildPayloadImpl"]["call"](v177["ctx"]);
    (strict["deepEqual"](v178["images"], [
      "https://cdn.apimart.ai/omni-ref.png",
    ]),
      strict["deepEqual"](v178["videos"], [
        "https://cdn.apimart.ai/omni-feature.mp4",
      ]),
      strict["deepEqual"](v178["inputUrlsBySlot"], {
        referenceImage: "https://cdn.apimart.ai/omni-ref.png",
      }));
    const v179 = "node-apimart-kling-omni-edit",
      v180 = createTestContext({
        targetId: v179,
        nodeData: {
          id: v179,
          model: "apimart/kling-v3-omni",
          provider: "apimart",
          generationParams: { kling_v3_omni_mode: "edit" },
        },
        nodes: {
          video1: {
            id: "video1",
            type: "source-video",
            videoUrl: "https://cdn.apimart.ai/omni-base.mp4",
            videoDuration: 8,
          },
        },
        incomingEdges: [
          {
            id: "edge-edit-video",
            sourceId: "video1",
            targetId: v179,
            refSlot: "editVideo",
          },
        ],
        prompt: "omni\x20edit\x20mode",
      }),
      v181 = await v180["proto"]["_buildPayloadImpl"]["call"](v180["ctx"]);
    (strict["deepEqual"](v181["images"], []),
      strict["deepEqual"](v181["videos"], [
        "https://cdn.apimart.ai/omni-base.mp4",
      ]),
      strict["equal"](v181["inputUrlsBySlot"], undefined));
  }),
  test("video task orchestration: Kling O1 converts image mentions and validates video slots", async () => {
    const v182 = "node-apimart-kling-o1-image",
      v183 = createTestContext({
        targetId: v182,
        nodeData: {
          id: v182,
          model: "apimart/kling-video-o1",
          provider: "apimart",
          generationParams: { resolution: "pro", duration: 5 },
        },
        nodes: {
          image1: {
            id: "image1",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/o1-ref-1.png",
          },
          image2: {
            id: "image2",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/o1-ref-2.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-reference-image",
            sourceId: "image1",
            targetId: v182,
            refSlot: "referenceImage",
          },
          { id: "edge-extra-image", sourceId: "image2", targetId: v182 },
        ],
        prompt: "让@图片1走向@图片2",
      }),
      v184 = await v183["proto"]["_buildPayloadImpl"]["call"](v183["ctx"]);
    (strict["equal"](v184["prompt"], "让<<<image_1>>>走向<<<image_2>>>"),
      strict["deepEqual"](v184["images"], [
        "https://cdn.apimart.ai/o1-ref-1.png",
        "https://cdn.apimart.ai/o1-ref-2.png",
      ]),
      strict["equal"](v184["klingO1VideoRole"], undefined));
    const v185 = "node-apimart-kling-o1-feature",
      v186 = createTestContext({
        targetId: v185,
        nodeData: {
          id: v185,
          model: "apimart/kling-video-o1",
          provider: "apimart",
        },
        nodes: {
          image1: {
            id: "image1",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/o1-feature-ref.png",
          },
          video1: {
            id: "video1",
            type: "source-video",
            videoUrl: "https://cdn.apimart.ai/o1-feature.mp4",
            videoDuration: 8,
          },
        },
        incomingEdges: [
          {
            id: "edge-ref-image",
            sourceId: "image1",
            targetId: v185,
            refSlot: "referenceImage",
          },
          {
            id: "edge-feature-video",
            sourceId: "video1",
            targetId: v185,
            refSlot: "featureReferenceVideo",
          },
        ],
        prompt: "use\x20@图片1\x20with\x20feature\x20video",
      }),
      v187 = await v186["proto"]["_buildPayloadImpl"]["call"](v186["ctx"]);
    (strict["equal"](v187["prompt"], "use <<<image_1>>> with feature video"),
      strict["deepEqual"](v187["images"], [
        "https://cdn.apimart.ai/o1-feature-ref.png",
      ]),
      strict["deepEqual"](v187["videos"], [
        "https://cdn.apimart.ai/o1-feature.mp4",
      ]),
      strict["equal"](v187["klingO1VideoRole"], "feature"));
    const v188 = globalThis["window"]["showToast"],
      v189 = [];
    globalThis["window"]["showToast"] = (v190) =>
      v189["push"](String(v190 || ""));
    try {
      const v191 = createTestContext({
          targetId: "node-apimart-kling-o1-invalid-video",
          nodeData: {
            id: "node-apimart-kling-o1-invalid-video",
            model: "apimart/kling-video-o1",
            provider: "apimart",
          },
          nodes: {
            video1: {
              id: "video1",
              type: "source-video",
              videoUrl: "https://cdn.apimart.ai/o1-long.mp4",
              videoDuration: 12,
            },
          },
          incomingEdges: [
            {
              id: "edge-feature-video",
              sourceId: "video1",
              targetId: "node-apimart-kling-o1-invalid-video",
              refSlot: "featureReferenceVideo",
            },
          ],
          prompt: "feature video too long",
        }),
        v192 = await v191["proto"]["_buildPayloadImpl"]["call"](v191["ctx"]);
      (strict["equal"](v192, null),
        strict["equal"](
          v189["some"]((v193) => v193["includes"]("3-10")),
          true,
        ));
    } finally {
      globalThis["window"]["showToast"] = v188;
    }
  }),
  test("video task orchestration: HappyHorse mode filters media and requires prompt", async () => {
    const v194 = "node-apimart-happyhorse-image",
      { proto: v195, ctx: v196 } = createTestContext({
        targetId: v194,
        nodeData: {
          id: v194,
          model: "apimart/happyhorse-1.0",
          provider: "apimart",
          generationParams: { happyhorse_mode: "image", duration: 5 },
        },
        nodes: {
          image1: {
            id: "image1",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/ref-1.png",
          },
          image2: {
            id: "image2",
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/ref-2.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-image-1",
            sourceId: "image1",
            targetId: v194,
            refSlot: "lastFrame",
          },
          {
            id: "edge-image-2",
            sourceId: "image2",
            targetId: v194,
            refSlot: "firstFrame",
          },
        ],
        prompt: "running horse",
      }),
      v197 = await v195["_buildPayloadImpl"]["call"](v196);
    (strict["equal"](v197["model"], "apimart/happyhorse-1.0"),
      strict["equal"](v197["generationParams"]["happyhorse_mode"], "image"),
      strict["deepEqual"](v197["images"], ["https://cdn.apimart.ai/ref-2.png"]),
      strict["deepEqual"](v197["videos"], []),
      strict["deepEqual"](v197["inputUrls"], [
        "https://cdn.apimart.ai/ref-2.png",
      ]),
      (v196["promptEl"] = createPromptEl("")));
    const v198 = [],
      v199 = globalThis["window"]["showToast"];
    globalThis["window"]["showToast"] = (v200) =>
      v198["push"](String(v200 || ""));
    try {
      strict["equal"](await v195["_buildPayloadImpl"]["call"](v196), null);
    } finally {
      globalThis["window"]["showToast"] = v199;
    }
    strict["match"](v198["join"]("\x0a"), /必须填写提示词/);
  }),
  test("video task orchestration: HappyHorse blocks incompatible video refs and long edits", async () => {
    const v201 = globalThis["window"]["showToast"],
      v202 = [];
    globalThis["window"]["showToast"] = (v203) =>
      v202["push"](String(v203 || ""));
    try {
      const v204 = "node-apimart-happyhorse-reference",
        v205 = createTestContext({
          targetId: v204,
          nodeData: {
            id: v204,
            model: "apimart/happyhorse-1.0",
            provider: "apimart",
            generationParams: { happyhorse_mode: "reference" },
          },
          nodes: {
            video1: {
              id: "video1",
              type: "source-video",
              videoUrl: "https://cdn.apimart.ai/source.mp4",
              videoDuration: 8,
            },
          },
          incomingEdges: [
            { id: "edge-video", sourceId: "video1", targetId: v204 },
          ],
          prompt: "reference horse",
        });
      (strict["equal"](
        await v205["proto"]["_buildPayloadImpl"]["call"](v205["ctx"]),
        null,
      ),
        strict["match"](
          v202["join"]("\x0a"),
          /参考图生视频模式不接受视频入参/,
        ));
      const v206 = "node-apimart-happyhorse-edit",
        v207 = createTestContext({
          targetId: v206,
          nodeData: {
            id: v206,
            model: "apimart/happyhorse-1.0",
            provider: "apimart",
            generationParams: { happyhorse_mode: "edit" },
          },
          nodes: {
            video1: {
              id: "video1",
              type: "source-video",
              videoUrl: "https://cdn.apimart.ai/long-source.mp4",
              videoDuration: 16,
            },
          },
          incomingEdges: [
            { id: "edge-long-video", sourceId: "video1", targetId: v206 },
          ],
          prompt: "edit horse",
        });
      (strict["equal"](
        await v207["proto"]["_buildPayloadImpl"]["call"](v207["ctx"]),
        null,
      ),
        strict["match"](v202["join"]("\x0a"), /不能超过 15 秒/),
        (v202["length"] = 0));
      const v208 = "node-runninghub-happyhorse-edit",
        v209 = createTestContext({
          targetId: v208,
          nodeData: {
            id: v208,
            model: "runninghub-model/happyhorse-1.0",
            provider: "runninghub",
            generationParams: { happyhorse_mode: "edit" },
          },
          nodes: {
            video1: {
              id: "video1",
              type: "source-video",
              videoUrl: "https://www.runninghub.cn/assets/long-source.mp4",
              videoDuration: 30,
            },
          },
          incomingEdges: [
            { id: "edge-runninghub-video", sourceId: "video1", targetId: v208 },
          ],
          prompt: "edit\x20runninghub\x20horse",
        }),
        v210 = await v209["proto"]["_buildPayloadImpl"]["call"](v209["ctx"]);
      (strict["equal"](v210["model"], "runninghub-model/happyhorse-1.0"),
        strict["equal"](v210["generationParams"]["happyhorse_mode"], "edit"),
        strict["deepEqual"](v210["videos"], [
          "https://www.runninghub.cn/assets/long-source.mp4",
        ]),
        strict["equal"](v202["join"]("\x0a"), ""));
    } finally {
      globalThis["window"]["showToast"] = v201;
    }
  }),
  test("video\x20task\x20orchestration:\x20/预设模板支持用户输入默认值", async () => {
    const v211 = "node-video-template-fallback",
      v212 = { id: v211, model: "grsai-video-basic", provider: "grsai" },
      { proto: v213, ctx: v214 } = createTestContext({
        targetId: v211,
        nodeData: v212,
        prompt: "",
      }),
      v215 = await v213["_buildPayloadImpl"]["call"](
        v214,
        "镜头：{用户输入 || 默认视频描述}",
      );
    (strict["ok"](v215),
      strict["equal"](v215["prompt"], "镜头：默认视频描述"),
      (v214["promptEl"] = createPromptEl("夜景推镜")));
    const v216 = await v213["_buildPayloadImpl"]["call"](
      v214,
      "镜头：{用户输入\x20||\x20默认视频描述}",
    );
    (strict["ok"](v216), strict["equal"](v216["prompt"], "镜头：夜景推镜"));
  }),
  test("video\x20task\x20orchestration:\x20running\x20RH\x20store\x20state\x20cancels\x20even\x20when\x20local\x20flag\x20is\x20stale", async () => {
    const v217 = "node-video-running-store-cancels",
      {
        proto: v218,
        ctx: v219,
        state: v220,
      } = createTestContext({
        targetId: v217,
        nodeData: {
          id: v217,
          model: "runninghub/2041741496667348994",
          provider: "runninghubwf",
          rhTaskId: "rh-running",
          rhTaskStatus: "running",
          jobStatus: "running",
          isGenerating: true,
        },
      });
    let v221 = 0,
      v222 = 0;
    ((v219["_isGenerating"] = false),
      (v219["_isRunninghubWorkflowModel"] = () => true),
      (v219["_cancelRunningHubWorkflowTask"] = async () => {
        v221 += 1;
      }),
      (v219["_onGenerate"] = async () => {
        v222 += 1;
      }),
      (v220["nodes"][v217] = {
        ...v220["nodes"][v217],
        rhTaskId: "rh-running",
        rhTaskStatus: "running",
        jobStatus: "running",
        isGenerating: true,
      }),
      await v218["_handleGenerateOrCancelImpl"]["call"](v219),
      strict["equal"](v221, 1),
      strict["equal"](v222, 0));
  }),
  test("video task orchestration: 预览模式下点击生成只启动假加载不发请求", async () => {
    const v223 = globalThis["window"]["PREVIEW_MODE"];
    globalThis["window"]["PREVIEW_MODE"] = true;
    try {
      const v224 = "node-video-preview-loading";
      let v225 = false;
      const { proto: v226, ctx: v227 } = createTestContext({
        targetId: v224,
        nodeData: {
          id: v224,
          model: "dreamina/seedance2.0fast",
          provider: "dreamina",
        },
      });
      v227["previewEl"] = createFakePreviewContainer();
      const v228 = createVideoNodeTaskOrchestrationModule({
          store: {
            getState: () => ({
              nodes: {
                [v224]: {
                  id: v224,
                  model: "dreamina/seedance2.0fast",
                  provider: "dreamina",
                },
              },
            }),
            getIncomingEdges: () => [],
            updateNodeData() {},
          },
          api: {},
          getImage: async () => null,
          startLoading: () => {},
          stopLoading: () => {},
          ensureConfig: async () => {},
          getProviderConfig: () => ({ apiKey: "" }),
          isVideoVipModel: () => false,
          ensureVipSessionRecheck: async () => {
            v225 = true;
          },
        }),
        v229 = Object["assign"](Object["create"](v228), {
          nodeId: v224,
          _data: {
            id: v224,
            model: "dreamina/seedance2.0fast",
            provider: "dreamina",
          },
          previewEl: createFakePreviewContainer(),
          promptEl: createPromptEl("测试视频"),
          btnEl: createButtonStub(),
          _guardVipSelection() {
            return true;
          },
          _buildPayload: async () => {
            throw new Error("预览模式不应构建真实\x20payload");
          },
        });
      (await v228["_onGenerateImpl"]["call"](v229),
        strict["equal"](v225, false),
        strict["equal"](isPreviewNodeLoading(v224), true),
        strict["equal"](v229["btnEl"]["disabled"], true),
        strict["match"](v229["btnEl"]["innerHTML"], /animation:spin/),
        stopPreviewNodeLoading(v224),
        strict["equal"](v229["btnEl"]["disabled"], false),
        strict["doesNotMatch"](v229["btnEl"]["innerHTML"], /animation:spin/));
    } finally {
      globalThis["window"]["PREVIEW_MODE"] = v223;
    }
  }),
  test("video task orchestration: start patch enters running state over stale terminal fields", async () => {
    const v230 = "node-video-start-running";
    let v231 = 0,
      v232 = 0,
      v233;
    const v234 = new Promise((v235) => {
        v233 = v235;
      }),
      {
        proto: v236,
        ctx: v237,
        state: v238,
      } = createTestContext({
        targetId: v230,
        nodeData: {
          id: v230,
          provider: "apimart",
          model: "apimart/video-model",
          isGenerating: false,
          jobStatus: "success",
          jobError: null,
          generationDuration: 1234,
          asyncTaskStatus: "success",
          rhTaskStatus: "success",
          dreaminaTaskStatus: "success",
          dreaminaTaskPhase: "done",
        },
        apiImpl: { generateVideo: async () => v234 },
        startLoadingImpl: () => {
          v231 += 1;
        },
        stopLoadingImpl: () => {
          v232 += 1;
        },
      });
    ((v237["_isGenerating"] = false),
      (v237["btnEl"] = createButtonStub()),
      (v237["previewEl"] = {}),
      (v237["_guardVipSelection"] = () => true),
      (v237["_buildPayload"] = async () => ({
        provider: "apimart",
        model: "apimart/video-model",
        prompt: "test\x20prompt",
      })),
      (v237["_stopDreaminaRecovery"] = () => {}),
      (v237["_stopRunningHubRecovery"] = () => {}),
      (v237["_stopAsyncRecovery"] = () => {}),
      (v237["_persistAsyncResumeCache"] = () => {}),
      (v237["_persistDreaminaResumeCache"] = () => {}),
      (v237["_persistRunningHubResumeCache"] = () => {}),
      (v237["_updateSubmitButtonState"] = () => {}));
    const v239 = v236["_onGenerateImpl"]["call"](v237);
    await flushUntil(
      () => v238["nodes"][v230]?.["asyncTaskStatus"] === "pending",
    );
    const v240 = v238["nodes"][v230];
    (strict["equal"](v231, 1),
      strict["equal"](v232, 0),
      strict["equal"](v240["isGenerating"], true),
      strict["equal"](v240["jobStatus"], "running"),
      strict["equal"](v240["jobError"], null),
      strict["equal"](v240["generationDuration"], null),
      strict["equal"](v240["asyncTaskStatus"], "pending"),
      v233({
        videoUrl: "/output/generated.mp4",
        localPath: "/output/generated.mp4",
      }),
      await v239);
  }),
  test("video\x20task\x20orchestration:\x20RH\x20pending\x20store\x20state\x20keeps\x20cancel\x20UI\x20after\x20submit\x20returns\x20without\x20result", async () => {
    const v241 = "node-video-rh-pending-keeps-cancel";
    let v242 = 0,
      v243;
    const v244 = new Promise((v245) => {
        v243 = v245;
      }),
      {
        proto: v246,
        ctx: v247,
        state: v248,
      } = createTestContext({
        targetId: v241,
        nodeData: {
          id: v241,
          provider: "runninghubwf",
          model: "runninghub/1971148165531475969",
          isGenerating: false,
        },
        apiImpl: {
          generateVideo: async (v249, v250 = {}) => {
            return (
              v250["onTaskMeta"]?.({
                taskId: "rh-video-pending",
                useOpenapiQuery: true,
              }),
              await v244
            );
          },
        },
        stopLoadingImpl: () => {
          v242 += 1;
        },
      });
    ((v247["btnEl"] = createButtonStub()),
      (v247["previewEl"] = {}),
      (v247["_isRunninghubWorkflowModel"] = () => true),
      (v247["_guardVipSelection"] = () => true),
      (v247["_buildPayload"] = async () => ({
        provider: "runninghubwf",
        model: "runninghub/1971148165531475969",
        prompt: "test\x20prompt",
        apiKey: "rh-key",
      })),
      (v247["_stopDreaminaRecovery"] = () => {}),
      (v247["_stopRunningHubRecovery"] = () => {}),
      (v247["_stopAsyncRecovery"] = () => {}),
      (v247["_persistAsyncResumeCache"] = () => {}),
      (v247["_persistDreaminaResumeCache"] = () => {}),
      (v247["_persistRunningHubResumeCache"] = () => {}));
    const v251 = v246["_onGenerateImpl"]["call"](v247);
    await flushUntil(() => v248["nodes"][v241]?.["rhTaskStatus"] === "running");
    const v252 = v248["nodes"][v241];
    (strict["equal"](v252["rhTaskStatus"], "running"),
      strict["equal"](v247["_isGenerating"], true),
      strict["equal"](v247["_rhTaskId"], "rh-video-pending"),
      strict["equal"](v247["btnEl"]["disabled"], false),
      strict["match"](v247["btnEl"]["innerHTML"], /v2-task-cancel-spin/),
      strict["equal"](v242, 0),
      v243({
        videoUrl: "/output/generated.mp4",
        localPath: "/output/generated.mp4",
      }),
      await v251);
  }),
  test("task orchestration: adaptive multimodal ratio uses node display ratio", async () => {
    const v253 = "node-video-1",
      v254 = "node-image-1",
      { proto: v255, ctx: v256 } = createTestContext({
        targetId: v253,
        nodeData: {
          provider: "dreamina",
          model: "dreamina/seedance2.0fast",
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "自适应",
          width: 1700,
          height: 900,
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v254]: {
            id: v254,
            type: "source-image",
            localPath: "data/uploads/ref.png",
          },
        },
        incomingEdges: [
          { id: "edge-1", sourceId: v254, targetId: v253, refSlot: "" },
        ],
      }),
      v257 = await v255["_buildPayloadImpl"]["call"](v256);
    (strict["equal"](v257["dreaminaTaskType"], "multimodal2video"),
      strict["equal"](v257["aspectRatio"], "16:9"));
  }),
  test("task orchestration: frames fallback to text2video still uses adaptive mapping", async () => {
    const v258 = "node-video-2",
      { proto: v259, ctx: v260 } = createTestContext({
        targetId: v258,
        nodeData: {
          provider: "dreamina",
          model: "dreamina/seedance2.0fast",
          dreaminaRouteMode: "frames2video",
          aspectRatio: "自适应",
          width: 1700,
          height: 900,
          resolution: "720p",
          duration: 5,
        },
        incomingEdges: [],
      }),
      v261 = await v259["_buildPayloadImpl"]["call"](v260);
    (strict["equal"](v261["dreaminaTaskType"], "text2video"),
      strict["equal"](v261["aspectRatio"], "16:9"));
  }),
  test("task orchestration: fixed ratio is preserved with image references", async () => {
    const v262 = "node-video-3",
      v263 = "node-image-3",
      { proto: v264, ctx: v265 } = createTestContext({
        targetId: v262,
        nodeData: {
          provider: "dreamina",
          model: "dreamina/seedance2.0fast",
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "4:3",
          width: 1700,
          height: 900,
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v263]: {
            id: v263,
            type: "source-image",
            localPath: "data/uploads/ref-fixed.png",
          },
        },
        incomingEdges: [
          { id: "edge-3", sourceId: v263, targetId: v262, refSlot: "" },
        ],
      }),
      v266 = await v264["_buildPayloadImpl"]["call"](v265);
    (strict["equal"](v266["dreaminaTaskType"], "multimodal2video"),
      strict["equal"](v266["aspectRatio"], "4:3"));
  }),
  test("task\x20orchestration:\x20text\x20ref-pill\x20is\x20resolved\x20into\x20payload\x20prompt", async () => {
    const v267 = "node-video-text-pill",
      v268 = "node-video-text-ref-pill",
      { proto: v269, ctx: v270 } = createTestContext({
        targetId: v267,
        nodeData: {
          provider: "grsai",
          model: "nano-video-1",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v268]: { id: v268, type: "source-text", text: "来自文本节点的描述" },
        },
        incomingEdges: [
          {
            id: "edge-video-text-pill",
            sourceId: v268,
            targetId: v267,
            refSlot: "",
          },
        ],
        promptEl: createPromptEl([
          createPromptTextNode("镜头 "),
          createPromptPillNode("@文本1", v268),
          createPromptTextNode(" 推进"),
        ]),
      }),
      v271 = await v269["_buildPayloadImpl"]["call"](v270);
    strict["equal"](v271["prompt"], "镜头\x20来自文本节点的描述\x20推进");
  }),
  test("task orchestration: plain-text text mention is resolved into payload prompt", async () => {
    const v272 = "node-video-text-mention",
      v273 = "node-video-text-ref-mention",
      { proto: v274, ctx: v275 } = createTestContext({
        targetId: v272,
        nodeData: {
          provider: "grsai",
          model: "nano-video-1",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v273]: {
            id: v273,
            type: "source-text",
            outputText: "直接替换的文本内容",
          },
        },
        incomingEdges: [
          {
            id: "edge-video-text-mention",
            sourceId: v273,
            targetId: v272,
            refSlot: "",
          },
        ],
        prompt: "镜头 @文本1 推进",
      }),
      v276 = await v274["_buildPayloadImpl"]["call"](v275);
    strict["equal"](v276["prompt"], "镜头 直接替换的文本内容 推进");
  }),
  test("task orchestration: unreferenced text inputs are prepended to payload prompt", async () => {
    const v277 = "node-video-text-prepend",
      v278 = "node-video-text-ref-prepend",
      { proto: v279, ctx: v280 } = createTestContext({
        targetId: v277,
        nodeData: {
          provider: "grsai",
          model: "nano-video-1",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v278]: { id: v278, type: "source-text", content: "前置的文本入参" },
        },
        incomingEdges: [
          {
            id: "edge-video-text-prepend",
            sourceId: v278,
            targetId: v277,
            refSlot: "",
          },
        ],
        prompt: "主体出场",
      }),
      v281 = await v279["_buildPayloadImpl"]["call"](v280);
    strict["equal"](v281["prompt"], "前置的文本入参\n主体出场");
  }),
  test("task\x20orchestration:\x20ai-text\x20input\x20without\x20output\x20uses\x20prompt\x20as\x20text\x20content", async () => {
    const v282 = "node-video-ai-text-prompt",
      v283 = "node-video-ai-text-prompt-ref",
      { proto: v284, ctx: v285 } = createTestContext({
        targetId: v282,
        nodeData: {
          provider: "grsai",
          model: "nano-video-1",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v283]: {
            id: v283,
            type: "ai-text",
            prompt: "来自生成文本节点的提示词",
          },
        },
        incomingEdges: [
          {
            id: "edge-video-ai-text-prompt",
            sourceId: v283,
            targetId: v282,
            refSlot: "",
          },
        ],
        prompt: "主体出场",
      }),
      v286 = await v284["_buildPayloadImpl"]["call"](v285);
    strict["equal"](v286["prompt"], "来自生成文本节点的提示词\n主体出场");
  }),
  test("task orchestration: text inputs do not change existing media inputUrls", async () => {
    const v287 = "node-video-text-media",
      v288 = "node-video-text-ref-media",
      v289 = "node-video-image-ref-media",
      { proto: v290, ctx: v291 } = createTestContext({
        targetId: v287,
        nodeData: {
          provider: "grsai",
          model: "nano-video-1",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v288]: { id: v288, type: "source-text", text: "补充画面描述" },
          [v289]: {
            id: v289,
            type: "source-image",
            originalLocalPath: "data/uploads/video-ref-image.png",
            imageUrl: "https://img.example.com/video-ref-image.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-video-text-media-text",
            sourceId: v288,
            targetId: v287,
            refSlot: "",
          },
          {
            id: "edge-video-text-media-image",
            sourceId: v289,
            targetId: v287,
            refSlot: "",
          },
        ],
        prompt: "主体 @文本1",
      }),
      v292 = await v290["_buildPayloadImpl"]["call"](v291);
    (strict["equal"](v292["prompt"], "主体 补充画面描述"),
      strict["deepEqual"](v292["inputUrls"], [
        "/data/uploads/video-ref-image.png",
      ]));
  }),
  test("task orchestration: video inputUrls prefer original image path", async () => {
    const v293 = "node-video-original-input",
      v294 = "node-image-original-input",
      { proto: v295, ctx: v296 } = createTestContext({
        targetId: v293,
        nodeData: {
          provider: "grsai",
          model: "nano-video-1",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v294]: {
            id: v294,
            type: "source-image",
            originalLocalPath: "data/uploads/video-original.png",
            displayLocalPath: "data/uploads/video-display.webp",
            thumbLocalPath: "data/uploads/video-thumb.webp",
            imageUrl: "https://img.example.com/video-display.png",
            thumbUrl: "https://img.example.com/video-thumb.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-video-original-input",
            sourceId: v294,
            targetId: v293,
            refSlot: "",
          },
        ],
      }),
      v297 = await v295["_buildPayloadImpl"]["call"](v296);
    strict["deepEqual"](v297["inputUrls"], [
      "/data/uploads/video-original.png",
    ]);
  }),
  test("task orchestration: video media inputUrls follow incoming edge order", async () => {
    const v298 = "node-video-ordered-inputs",
      v299 = "node-video-ordered-image-a",
      v300 = "node-video-ordered-image-b",
      { proto: v301, ctx: v302 } = createTestContext({
        targetId: v298,
        nodeData: {
          provider: "grsai",
          model: "nano-video-1",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v299]: {
            id: v299,
            type: "source-image",
            originalLocalPath: "data/uploads/ordered-a.png",
            imageUrl: "https://img.example.com/a.png",
          },
          [v300]: {
            id: v300,
            type: "source-image",
            originalLocalPath: "data/uploads/ordered-b.png",
            imageUrl: "https://img.example.com/b.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-video-ordered-b",
            sourceId: v300,
            targetId: v298,
            refSlot: "",
          },
          {
            id: "edge-video-ordered-a",
            sourceId: v299,
            targetId: v298,
            refSlot: "",
          },
        ],
      }),
      v303 = await v301["_buildPayloadImpl"]["call"](v302);
    strict["deepEqual"](v303["inputUrls"], [
      "/data/uploads/ordered-b.png",
      "/data/uploads/ordered-a.png",
    ]);
  }),
  test("task orchestration: asset image mentions send type placeholders in prompt order", async () => {
    const v304 = "node-video-asset-image-mentions";
    setAssetMentionAssets([
      {
        id: "asset-characters",
        name: "characters",
        items: [
          {
            name: "person1",
            type: "source-image",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/person1.png",
            },
          },
          {
            name: "person2",
            type: "source-image",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/person2.png",
            },
          },
        ],
      },
    ]);
    const { proto: v305, ctx: v306 } = createTestContext({
        targetId: v304,
        nodeData: {
          provider: "grsai",
          model: "nano-video-1",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        promptEl: createPromptEl([
          createPromptTextNode("use "),
          createAssetPromptPillNode("person2", "asset-characters", 1, "image"),
          createPromptTextNode(" then "),
          createAssetPromptPillNode("person1", "asset-characters", 0, "image"),
        ]),
      }),
      v307 = await v305["_buildPayloadImpl"]["call"](v306);
    (strict["equal"](v307["prompt"], "use @图片1 then @图片2"),
      strict["deepEqual"](v307["inputUrls"], [
        "/data/assets/person2.png",
        "/data/assets/person1.png",
      ]));
  }),
  test("task\x20orchestration:\x20asset\x20video\x20and\x20audio\x20mentions\x20satisfy\x20lip-sync\x20fixed\x20inputs", async () => {
    const v308 = "node-video-asset-lipsync";
    setAssetMentionAssets([
      {
        id: "asset-av",
        items: [
          {
            name: "clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/clip.mp4",
              videoDuration: 5,
            },
          },
          {
            name: "voice",
            type: "source-audio",
            nodeData: {
              type: "source-audio",
              localPath: "data/assets/voice.mp3",
              duration: 5,
            },
          },
        ],
      },
    ]);
    const { proto: v309, ctx: v310 } = createTestContext({
      targetId: v308,
      nodeData: {
        provider: "runninghubwf",
        model: "runninghub/2054101324521844738",
        rhVideoFrames: 120,
        rhVideoResolution: 832,
        generationParams: { rhInstanceType: "default" },
      },
      promptEl: createPromptEl([
        createAssetPromptPillNode("clip", "asset-av", 0, "video"),
        createPromptTextNode(" lip sync "),
        createAssetPromptPillNode("voice", "asset-av", 1, "audio"),
      ]),
    });
    v310["_isRunninghubWorkflowModel"] = () => true;
    const v311 = await v309["_buildPayloadImpl"]["call"](v310);
    (strict["equal"](v311["prompt"], "@视频1\x20lip\x20sync\x20@音频1"),
      strict["equal"](v311["videoUrl"], "/data/assets/clip.mp4"),
      strict["equal"](v311["audioUrl"], "/data/assets/voice.mp3"),
      strict["deepEqual"](v311["inputUrls"], []));
  }),
  test("task orchestration: hidden asset video and audio refs satisfy lip-sync fixed inputs", async () => {
    const v312 = "node-video-hidden-asset-lipsync";
    setAssetMentionAssets([
      {
        id: "asset-av-hidden",
        items: [
          {
            name: "clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/hidden-clip.mp4",
              videoDuration: 5,
            },
          },
          {
            name: "voice",
            type: "source-audio",
            nodeData: {
              type: "source-audio",
              localPath: "data/assets/hidden-voice.mp3",
              duration: 5,
            },
          },
        ],
      },
    ]);
    const { proto: v313, ctx: v314 } = createTestContext({
      targetId: v312,
      nodeData: {
        provider: "runninghubwf",
        model: "runninghub/2054101324521844738",
        rhVideoFrames: 120,
        rhVideoResolution: 832,
        generationParams: { rhInstanceType: "default" },
        promptAssetInputRefs: [
          { assetId: "asset-av-hidden", itemIndex: 0, type: "video" },
          { assetId: "asset-av-hidden", itemIndex: 1, type: "audio" },
        ],
      },
      prompt: "lip sync",
    });
    v314["_isRunninghubWorkflowModel"] = () => true;
    const v315 = await v313["_buildPayloadImpl"]["call"](v314);
    (strict["equal"](v315["prompt"], "lip sync"),
      strict["equal"](v315["videoUrl"], "/data/assets/hidden-clip.mp4"),
      strict["equal"](v315["audioUrl"], "/data/assets/hidden-voice.mp3"),
      strict["deepEqual"](v315["inputUrls"], []));
  }),
  test("task orchestration: dreamina frames use incoming edge order for first and last images", async () => {
    const v316 = "node-video-dreamina-ordered-frames",
      v317 = "node-video-dreamina-frame-a",
      v318 = "node-video-dreamina-frame-b",
      { proto: v319, ctx: v320 } = createTestContext({
        targetId: v316,
        nodeData: {
          provider: "dreamina",
          model: "dreamina/seedance2.0fast",
          dreaminaRouteMode: "frames2video",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v317]: {
            id: v317,
            type: "source-image",
            originalLocalPath: "data/uploads/dreamina-frame-first.png",
            imageUrl: "https://img.example.com/first.png",
          },
          [v318]: {
            id: v318,
            type: "source-image",
            originalLocalPath: "data/uploads/dreamina-frame-last.png",
            imageUrl: "https://img.example.com/last.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-video-dreamina-last-first",
            sourceId: v318,
            targetId: v316,
            refSlot: "",
          },
          {
            id: "edge-video-dreamina-first-last",
            sourceId: v317,
            targetId: v316,
            refSlot: "",
          },
        ],
        prompt: "make\x20it\x20move",
      }),
      v321 = await v319["_buildPayloadImpl"]["call"](v320);
    (strict["equal"](v321["dreaminaTaskType"], "frames2video"),
      strict["equal"](v321["first"], "/data/uploads/dreamina-frame-last.png"),
      strict["equal"](v321["last"], "/data/uploads/dreamina-frame-first.png"),
      strict["deepEqual"](v321["inputUrls"], [
        "/data/uploads/dreamina-frame-last.png",
        "/data/uploads/dreamina-frame-first.png",
      ]));
  }),
  test("task\x20orchestration:\x20runninghub\x20fixed\x20slots\x20are\x20resolved\x20by\x20refSlot", async () => {
    const v322 = "node-video-rh-fixed-slots",
      v323 = "node-video-rh-source-video",
      v324 = "node-video-rh-mask-video",
      v325 = "node-video-rh-ref-image",
      v326 = "node-video-rh-first-frame",
      { proto: v327, ctx: v328 } = createTestContext({
        targetId: v322,
        nodeData: {
          provider: "runninghubwf",
          model: "runninghub/2041741496667348994",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
          rhVideoFps: 30,
          rhVideoFrames: 88,
          generationParams: { rhInstanceType: "default" },
        },
        nodes: {
          [v323]: {
            id: v323,
            type: "source-video",
            localPath: "data/uploads/source.mp4",
          },
          [v324]: {
            id: v324,
            type: "source-video",
            localPath: "data/uploads/mask.mp4",
          },
          [v325]: {
            id: v325,
            type: "source-image",
            originalLocalPath: "data/uploads/ref.png",
            imageUrl: "https://img.example.com/ref.png",
          },
          [v326]: {
            id: v326,
            type: "source-image",
            originalLocalPath: "data/uploads/first-frame.png",
            imageUrl: "https://img.example.com/first-frame.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-video-rh-first-frame",
            sourceId: v326,
            targetId: v322,
            refSlot: "firstFrame",
          },
          {
            id: "edge-video-rh-mask",
            sourceId: v324,
            targetId: v322,
            refSlot: "videoMask",
          },
          {
            id: "edge-video-rh-ref-image",
            sourceId: v325,
            targetId: v322,
            refSlot: "refImage",
          },
          {
            id: "edge-video-rh-source",
            sourceId: v323,
            targetId: v322,
            refSlot: "sourceVideo",
          },
        ],
        prompt: "edit video",
      }),
      v329 = await v327["_buildPayloadImpl"]["call"](v328);
    (strict["equal"](v329["videoUrl"], "/data/uploads/source.mp4"),
      strict["deepEqual"](v329["inputUrls"], ["/data/uploads/ref.png"]),
      strict["equal"](v329["firstFrameUrl"], "/data/uploads/first-frame.png"),
      strict["equal"](v329["maskVideoUrl"], "/data/uploads/mask.mp4"),
      strict["equal"](v329["rhVideoFps"], 30),
      strict["equal"](v329["frameRate"], 30),
      strict["equal"](v329["frameCount"], 88));
  }),
  test("task orchestration: V5.4 asset mentions fill fixed input slots", async () => {
    const v330 = "node-video-rh-asset-fixed-slots";
    setAssetMentionAssets([
      {
        id: "asset-v54",
        items: [
          {
            name: "source clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/source.mp4",
              thumbUrl: "/data/assets/source-thumb.jpg",
            },
          },
          {
            name: "mask clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/mask.mp4",
              thumbUrl: "/data/assets/mask-thumb.jpg",
            },
          },
          {
            name: "reference image",
            type: "source-image",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/ref.png",
            },
          },
          {
            name: "first frame",
            type: "source-image",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/first-frame.png",
            },
          },
        ],
      },
    ]);
    const { proto: v331, ctx: v332 } = createTestContext({
        targetId: v330,
        nodeData: {
          provider: "runninghubwf",
          model: "runninghub/2041741496667348994",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
          rhSubtractSubject: false,
          generationParams: { rhInstanceType: "default" },
        },
        promptEl: createPromptEl([
          createAssetPromptPillNode("source clip", "asset-v54", 0, "video"),
          createPromptTextNode(" edit with "),
          createAssetPromptPillNode("mask clip", "asset-v54", 1, "video"),
          createPromptTextNode(" and "),
          createAssetPromptPillNode(
            "reference\x20image",
            "asset-v54",
            2,
            "image",
          ),
          createPromptTextNode("\x20to\x20"),
          createAssetPromptPillNode("first\x20frame", "asset-v54", 3, "image"),
        ]),
      }),
      v333 = await v331["_buildPayloadImpl"]["call"](v332);
    (strict["equal"](v333["videoUrl"], "/data/assets/source.mp4"),
      strict["equal"](v333["maskVideoUrl"], "/data/assets/mask.mp4"),
      strict["deepEqual"](v333["inputUrls"], ["/data/assets/ref.png"]),
      strict["equal"](v333["firstFrameUrl"], "/data/assets/first-frame.png"));
  }),
  test("task orchestration: V5.4 subtract hides mask video and first frame asset mentions", async () => {
    const v334 = "node-video-rh-asset-hidden-fixed-slots";
    setAssetMentionAssets([
      {
        id: "asset-v54-hidden",
        items: [
          {
            name: "source\x20clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/source.mp4",
            },
          },
          {
            name: "mask clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/mask.mp4",
            },
          },
          {
            name: "reference image",
            type: "source-image",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/ref.png",
            },
          },
          {
            name: "first frame",
            type: "source-image",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/first-frame.png",
            },
          },
        ],
      },
    ]);
    const { proto: v335, ctx: v336 } = createTestContext({
        targetId: v334,
        nodeData: {
          provider: "runninghubwf",
          model: "runninghub/2041741496667348994",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
          rhSubtractSubject: true,
          generationParams: { rhInstanceType: "default" },
        },
        promptEl: createPromptEl([
          createAssetPromptPillNode(
            "source\x20clip",
            "asset-v54-hidden",
            0,
            "video",
          ),
          createAssetPromptPillNode(
            "mask clip",
            "asset-v54-hidden",
            1,
            "video",
          ),
          createAssetPromptPillNode(
            "reference image",
            "asset-v54-hidden",
            2,
            "image",
          ),
          createAssetPromptPillNode(
            "first frame",
            "asset-v54-hidden",
            3,
            "image",
          ),
        ]),
      }),
      v337 = await v335["_buildPayloadImpl"]["call"](v336);
    (strict["equal"](v337["videoUrl"], "/data/assets/source.mp4"),
      strict["equal"](v337["maskVideoUrl"], undefined),
      strict["deepEqual"](v337["inputUrls"], ["/data/assets/ref.png"]),
      strict["equal"](v337["firstFrameUrl"], undefined),
      strict["equal"](v337["subtractSubject"], true));
  }),
  test("task orchestration: V5.4 connected inputs take priority and assets fill empty slots", async () => {
    const v338 = "node-video-rh-asset-empty-slot-fill",
      v339 = "node-video-rh-connected-source";
    setAssetMentionAssets([
      {
        id: "asset-v54-fill",
        items: [
          {
            name: "mask clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/mask.mp4",
            },
          },
          {
            name: "reference image",
            type: "source-image",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/ref.png",
            },
          },
        ],
      },
    ]);
    const { proto: v340, ctx: v341 } = createTestContext({
        targetId: v338,
        nodeData: {
          provider: "runninghubwf",
          model: "runninghub/2041741496667348994",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
          rhSubtractSubject: false,
          generationParams: { rhInstanceType: "default" },
        },
        nodes: {
          [v339]: {
            id: v339,
            type: "source-video",
            localPath: "data/uploads/source.mp4",
          },
        },
        incomingEdges: [
          {
            id: "edge-video-rh-connected-source",
            sourceId: v339,
            targetId: v338,
            refSlot: "sourceVideo",
          },
        ],
        promptEl: createPromptEl([
          createAssetPromptPillNode("mask clip", "asset-v54-fill", 0, "video"),
          createAssetPromptPillNode(
            "reference image",
            "asset-v54-fill",
            1,
            "image",
          ),
        ]),
      }),
      v342 = await v340["_buildPayloadImpl"]["call"](v341);
    (strict["equal"](v342["videoUrl"], "/data/uploads/source.mp4"),
      strict["equal"](v342["maskVideoUrl"], "/data/assets/mask.mp4"),
      strict["deepEqual"](v342["inputUrls"], ["/data/assets/ref.png"]));
  }),
  test("task orchestration: V5.4 connected video inputs accept display local paths", async () => {
    const v343 = "node-video-rh-display-local-path",
      v344 = "node-video-rh-display-source",
      v345 = "node-video-rh-display-mask",
      { proto: v346, ctx: v347 } = createTestContext({
        targetId: v343,
        nodeData: {
          provider: "runninghubwf",
          model: "runninghub/2041741496667348994",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
          rhSubtractSubject: false,
          generationParams: { rhInstanceType: "default" },
        },
        nodes: {
          [v344]: {
            id: v344,
            type: "source-video",
            displayLocalPath: "data/uploads/source-display.mp4",
          },
          [v345]: {
            id: v345,
            type: "source-video",
            displayLocalPath: "data/uploads/mask-display.mp4",
          },
        },
        incomingEdges: [
          {
            id: "edge-video-rh-display-source",
            sourceId: v344,
            targetId: v343,
            refSlot: "sourceVideo",
          },
          {
            id: "edge-video-rh-display-mask",
            sourceId: v345,
            targetId: v343,
            refSlot: "videoMask",
          },
        ],
      }),
      v348 = await v346["_buildPayloadImpl"]["call"](v347);
    (strict["equal"](v348["videoUrl"], "/data/uploads/source-display.mp4"),
      strict["equal"](v348["maskVideoUrl"], "/data/uploads/mask-display.mp4"));
  }),
  test("task\x20orchestration:\x20dreamina\x20video\x20images\x20prefer\x20original\x20image\x20path", async () => {
    const v349 = "node-video-dreamina-original-input",
      v350 = "node-image-dreamina-original-input",
      { proto: v351, ctx: v352 } = createTestContext({
        targetId: v349,
        nodeData: {
          provider: "dreamina",
          model: "dreamina/seedance2.0fast",
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "自适应",
          width: 1600,
          height: 900,
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v350]: {
            id: v350,
            type: "source-image",
            originalLocalPath: "data/uploads/dreamina-video-original.png",
            displayLocalPath: "data/uploads/dreamina-video-display.webp",
            thumbLocalPath: "data/uploads/dreamina-video-thumb.webp",
            imageUrl: "https://img.example.com/dreamina-video-display.png",
            thumbUrl: "https://img.example.com/dreamina-video-thumb.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-dreamina-video-original-input",
            sourceId: v350,
            targetId: v349,
            refSlot: "",
          },
        ],
      }),
      v353 = await v351["_buildPayloadImpl"]["call"](v352);
    (strict["deepEqual"](v353["images"], [
      "/data/uploads/dreamina-video-original.png",
    ]),
      strict["deepEqual"](v353["inputUrls"], [
        "/data/uploads/dreamina-video-original.png",
      ]));
  }),
  test("task orchestration: apimart 即梦视频复用首尾帧 payload 且保留 APIMart provider", async () => {
    const v354 = "node-video-apimart-seedance-frames",
      v355 = "node-image-apimart-first",
      v356 = "node-image-apimart-last",
      { proto: v357, ctx: v358 } = createTestContext({
        targetId: v354,
        nodeData: {
          provider: "apimart",
          model: "apimart/doubao-seedance-2.0-fast",
          dreaminaRouteMode: "frames2video",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v355]: {
            id: v355,
            type: "source-image",
            originalLocalPath: "data/uploads/apimart-first.png",
            imageUrl: "https://img.example.com/apimart-first.png",
          },
          [v356]: {
            id: v356,
            type: "source-image",
            originalLocalPath: "data/uploads/apimart-last.png",
            imageUrl: "https://img.example.com/apimart-last.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-apimart-first",
            sourceId: v355,
            targetId: v354,
            refSlot: "",
          },
          {
            id: "edge-apimart-last",
            sourceId: v356,
            targetId: v354,
            refSlot: "",
          },
        ],
        prompt: "make a smooth transition",
      }),
      v359 = await v357["_buildPayloadImpl"]["call"](v358);
    (strict["equal"](v359["provider"], "apimart"),
      strict["equal"](v359["model"], "apimart/doubao-seedance-2.0-fast"),
      strict["equal"](v359["dreaminaTaskType"], "frames2video"),
      strict["equal"](v359["first"], "/data/uploads/apimart-first.png"),
      strict["equal"](v359["last"], "/data/uploads/apimart-last.png"),
      strict["equal"](v359["aspectRatio"], "16:9"),
      strict["equal"](v359["resolution"], "720p"),
      strict["equal"]("modelVersion" in v359, false),
      strict["deepEqual"](v359["images"], [
        "/data/uploads/apimart-first.png",
        "/data/uploads/apimart-last.png",
      ]));
  }),
  test("task\x20orchestration:\x20APIMart\x20人脸检测结果作为\x20providerAssetRefs\x20进入\x20payload", async () => {
    const v360 = "node-video-apimart-private-avatar-payload",
      v361 = "node-image-apimart-private-first",
      v362 = "node-image-apimart-private-last",
      { proto: v363, ctx: v364 } = createTestContext({
        targetId: v360,
        nodeData: {
          provider: "apimart",
          model: "apimart/doubao-seedance-2.0-fast",
          dreaminaRouteMode: "frames2video",
          aspectRatio: "16:9",
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v361]: {
            id: v361,
            type: "source-image",
            originalLocalPath: "data/uploads/private-first.png",
            providerAssetRefs: {
              apimartSeedance2PrivateAvatar: {
                provider: "apimart",
                capability: "seedance2PrivateAvatar",
                status: "passed",
                sourceKind: "image",
                sourceUrl: "/data/uploads/private-first.png",
                assetUrl: "asset://private-first",
              },
            },
          },
          [v362]: {
            id: v362,
            type: "source-image",
            originalLocalPath: "data/uploads/private-last.png",
            providerAssetRefs: {
              apimartSeedance2PrivateAvatar: {
                provider: "apimart",
                capability: "seedance2PrivateAvatar",
                status: "passed",
                sourceKind: "image",
                sourceUrl: "/data/uploads/private-last.png",
                assetUrl: "asset://private-last",
              },
            },
          },
        },
        incomingEdges: [
          { id: "edge-private-first", sourceId: v361, targetId: v360 },
          { id: "edge-private-last", sourceId: v362, targetId: v360 },
        ],
        prompt: "make\x20a\x20smooth\x20transition",
      }),
      v365 = await v363["_buildPayloadImpl"]["call"](v364);
    (strict["deepEqual"](v365["images"], [
      "/data/uploads/private-first.png",
      "/data/uploads/private-last.png",
    ]),
      strict["deepEqual"](
        v365["providerAssetRefs"]["map"]((v366) => ({
          capability: v366["capability"],
          sourceUrl: v366["sourceUrl"],
          assetUrl: v366["assetUrl"],
        })),
        [
          {
            capability: "seedance2PrivateAvatar",
            sourceUrl: "/data/uploads/private-first.png",
            assetUrl: "asset://private-first",
          },
          {
            capability: "seedance2PrivateAvatar",
            sourceUrl: "/data/uploads/private-last.png",
            assetUrl: "asset://private-last",
          },
        ],
      ));
  }),
  test("task orchestration: apimart Seedance 1.5 自适应竖图会提交明确竖屏比例", async () => {
    const v367 = "node-video-apimart-seedance-15-adaptive",
      v368 = "node-image-apimart-portrait",
      { proto: v369, ctx: v370 } = createTestContext({
        targetId: v367,
        nodeData: {
          provider: "apimart",
          model: "apimart/doubao-seedance-1-5-pro",
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "自适应",
          width: 1600,
          height: 900,
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v368]: {
            id: v368,
            type: "source-image",
            originalLocalPath: "data/uploads/portrait.png",
            originalWidth: 720,
            originalHeight: 1280,
          },
        },
        incomingEdges: [
          {
            id: "edge-apimart-portrait",
            sourceId: v368,
            targetId: v367,
            refSlot: "",
          },
        ],
        prompt: "make\x20it\x20move",
      }),
      v371 = await v369["_buildPayloadImpl"]["call"](v370);
    (strict["equal"](v371["provider"], "apimart"),
      strict["equal"](v371["model"], "apimart/doubao-seedance-1-5-pro"),
      strict["equal"](v371["aspectRatio"], "9:16"),
      strict["deepEqual"](v371["images"], ["/data/uploads/portrait.png"]));
  }),
  test("task\x20orchestration:\x20apimart\x20Seedance\x201.0\x20自适应竖图会提交明确竖屏比例", async () => {
    const v372 = "node-video-apimart-seedance-10-adaptive",
      v373 = "node-image-apimart-portrait-10",
      { proto: v374, ctx: v375 } = createTestContext({
        targetId: v372,
        nodeData: {
          provider: "apimart",
          model: "apimart/doubao-seedance-1-0-pro-quality",
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "自适应",
          width: 1600,
          height: 900,
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v373]: {
            id: v373,
            type: "source-image",
            originalLocalPath: "data/uploads/portrait-10.png",
            originalWidth: 720,
            originalHeight: 1280,
          },
        },
        incomingEdges: [
          {
            id: "edge-apimart-portrait-10",
            sourceId: v373,
            targetId: v372,
            refSlot: "",
          },
        ],
        prompt: "make\x20it\x20move",
      }),
      v376 = await v374["_buildPayloadImpl"]["call"](v375);
    (strict["equal"](v376["provider"], "apimart"),
      strict["equal"](v376["model"], "apimart/doubao-seedance-1-0-pro-quality"),
      strict["equal"](v376["aspectRatio"], "9:16"),
      strict["deepEqual"](v376["images"], ["/data/uploads/portrait-10.png"]));
  }),
  test("task orchestration: apimart Seedance 2.0 有入参时自适应按入参比例兜底", async () => {
    const v377 = "node-video-apimart-seedance-20-adaptive",
      v378 = "node-image-apimart-portrait-20",
      { proto: v379, ctx: v380 } = createTestContext({
        targetId: v377,
        nodeData: {
          provider: "apimart",
          model: "apimart/doubao-seedance-2.0-fast",
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "自适应",
          width: 1600,
          height: 900,
          resolution: "720p",
          duration: 5,
        },
        nodes: {
          [v378]: {
            id: v378,
            type: "source-image",
            originalLocalPath: "data/uploads/portrait-20.png",
            originalWidth: 720,
            originalHeight: 1280,
          },
        },
        incomingEdges: [
          {
            id: "edge-apimart-portrait-20",
            sourceId: v378,
            targetId: v377,
            refSlot: "",
          },
        ],
        prompt: "make it move",
      }),
      v381 = await v379["_buildPayloadImpl"]["call"](v380);
    (strict["equal"](v381["provider"], "apimart"),
      strict["equal"](v381["model"], "apimart/doubao-seedance-2.0-fast"),
      strict["equal"](v381["aspectRatio"], "9:16"));
  }),
  test("task orchestration: apimart Seedance 2.0 无入参时按显示比例解析自适应", async () => {
    const v382 = "node-video-apimart-seedance-20-text-adaptive",
      { proto: v383, ctx: v384 } = createTestContext({
        targetId: v382,
        nodeData: {
          provider: "apimart",
          model: "apimart/doubao-seedance-2.0-fast",
          dreaminaRouteMode: "multimodal2video",
          aspectRatio: "自适应",
          width: 1600,
          height: 900,
          resolution: "720p",
          duration: 5,
        },
        prompt: "text only video",
      }),
      v385 = await v383["_buildPayloadImpl"]["call"](v384);
    (strict["equal"](v385["provider"], "apimart"),
      strict["equal"](v385["model"], "apimart/doubao-seedance-2.0-fast"),
      strict["equal"](v385["dreaminaTaskType"], "text2video"),
      strict["equal"](v385["aspectRatio"], "16:9"));
  }),
  test("task orchestration: dreamina VIP 缺少 installId 时阻断提交", async () => {
    const v386 = globalThis["window"]["showToast"],
      v387 = [];
    globalThis["window"]["showToast"] = (v388) => {
      v387["push"](String(v388 || ""));
    };
    const v389 = createVideoNodeTaskOrchestrationModule({
        store: { getState: () => ({ nodes: {} }), updateNodeData: () => {} },
        api: {},
        getImage: async () => null,
        startLoading: () => {},
        stopLoading: () => {},
        ensureConfig: async () => {},
        getProviderConfig: () => ({ apiKey: "" }),
        isVideoVipModel: (v390, v391) =>
          String(v391 || "")["toLowerCase"]() === "dreamina" &&
          String(v390 || "")["startsWith"]("dreamina/"),
        ensureVipSessionRecheck: async () => {},
      }),
      v392 = Object["assign"](Object["create"](v389), {
        _isGenerating: false,
        _data: { model: "dreamina/seedance2.0fast", provider: "dreamina" },
        _guardVipSelection: () => true,
        _buildPayload: async () => ({
          model: "dreamina/seedance2.0fast",
          provider: "dreamina",
          installId: "",
        }),
      });
    try {
      (await v389["_onGenerateImpl"]["call"](v392),
        strict["equal"](
          v387["includes"]("缺少 installId，无法校验订阅，请刷新后重试"),
          true,
        ));
    } finally {
      globalThis["window"]["showToast"] = v386;
    }
  }),
  test("task orchestration: dreamina VIP 有 installId 时会继续执行后续逻辑", async () => {
    const v393 = createVideoNodeTaskOrchestrationModule({
        store: { getState: () => ({ nodes: {} }), updateNodeData: () => {} },
        api: {},
        getImage: async () => null,
        startLoading: () => {},
        stopLoading: () => {},
        ensureConfig: async () => {},
        getProviderConfig: () => ({ apiKey: "" }),
        isVideoVipModel: (v394, v395) =>
          String(v395 || "")["toLowerCase"]() === "dreamina" &&
          String(v394 || "")["startsWith"]("dreamina/"),
        ensureVipSessionRecheck: async () => {},
      }),
      v396 = Object["assign"](Object["create"](v393), {
        _isGenerating: false,
        _data: { model: "dreamina/seedance2.0fast", provider: "dreamina" },
        _guardVipSelection: () => true,
        _buildPayload: async () => ({
          model: "dreamina/seedance2.0fast",
          provider: "dreamina",
          installId: "install-ok",
        }),
        _isRunninghubWorkflowModel: () => {
          throw new Error("FLOW_CONTINUED");
        },
      });
    await strict["rejects"](
      v393["_onGenerateImpl"]["call"](v396),
      /FLOW_CONTINUED/,
    );
  }),
  test("task orchestration: dreamina video submit failure is logged without masking original error", async () => {
    const v397 = "node-video-dreamina-submit-fail",
      {
        proto: v398,
        ctx: v399,
        state: v400,
      } = createTestContext({
        targetId: v397,
        nodeData: {
          id: v397,
          provider: "dreamina",
          model: "dreamina/seedance2.0fast",
        },
        apiImpl: {
          generateVideo: async () => {
            throw new Error("即梦视频任务提交失败：未返回 submitId");
          },
        },
      });
    ((v399["_isGenerating"] = false),
      (v399["btnEl"] = createButtonStub()),
      (v399["previewEl"] = {}),
      (v399["_guardVipSelection"] = () => true),
      (v399["_buildPayload"] = async () => ({
        provider: "dreamina",
        model: "dreamina/seedance2.0fast",
        prompt: "test prompt",
      })),
      (v399["_stopDreaminaRecovery"] = () => {}),
      (v399["_stopRunningHubRecovery"] = () => {}),
      (v399["_stopAsyncRecovery"] = () => {}),
      (v399["_persistDreaminaResumeCache"] = () => {}),
      (v399["_updateSubmitButtonState"] = () => {}),
      await v398["_onGenerateImpl"]["call"](v399));
    const v401 = v400["nodes"][v397];
    (strict["equal"](v401["isGenerating"], false),
      strict["equal"](v401["jobStatus"], "error"),
      strict["equal"](
        v401["jobError"],
        "即梦视频任务提交失败：未返回 submitId",
      ),
      strict["equal"](
        v401["videos"]?.[0]?.["error"],
        "即梦视频任务提交失败：未返回 submitId",
      ),
      strict["equal"](v401["dreaminaTaskStatus"], "failed"),
      strict["equal"](v401["dreaminaTaskPhase"], "failed"),
      strict["equal"](
        v401["dreaminaTaskLabel"],
        "即梦视频任务提交失败：未返回\x20submitId",
      ));
  }),
  test("task\x20orchestration:\x20dreamina\x20video\x20recovery\x20writes\x20terminal\x20state\x20through\x20runtime", async () => {
    const v402 = "node-video-dreamina-recovery-success",
      v403 = Date["now"]() - 60000;
    let v404 = 0,
      v405 = 0;
    const {
      proto: v406,
      ctx: v407,
      state: v408,
    } = createTestContext({
      targetId: v402,
      nodeData: {
        id: v402,
        provider: "dreamina",
        model: "dreamina/seedance2.0fast",
        dreaminaSubmitId: "sid-video-success",
        dreaminaTaskStatus: "pending",
        dreaminaTaskPhase: "generating",
        dreaminaTaskLabel: "生成中",
        dreaminaTaskStartedAt: v403,
        dreaminaTaskLastCheckedAt: Date["now"]() - 30000,
        dreaminaTaskRecovering: false,
        generationStartTime: v403,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeDreaminaVideoTask: async (v409, v410) => {
          return (
            (v404 += 1),
            strict["equal"](v409, "sid-video-success"),
            strict["equal"](v410?.["maxWaitMs"] > 0, true),
            {
              isBatch: false,
              dreaminaSnapshot: {
                submitId: v409,
                status: "success",
                phase: "done",
                label: "已完成",
                outputs: [
                  {
                    localPath: "output/dreamina/video-success.mp4",
                    localUrl: "/output/dreamina/video-success.mp4",
                  },
                ],
                raw: {},
                lastCheckedAt: Date["now"](),
              },
              videos: [
                {
                  videoUrl: "/output/dreamina/video-success.mp4",
                  localPath: "output/dreamina/video-success.mp4",
                },
              ],
              videoUrl: "/output/dreamina/video-success.mp4",
              localPath: "output/dreamina/video-success.mp4",
            }
          );
        },
      },
    });
    ((v407["_isGenerating"] = false),
      (v407["btnEl"] = createButtonStub()),
      (v407["previewEl"] = {}),
      (v407["_updateSubmitButtonState"] = () => {}),
      (v407["_persistDreaminaResumeCache"] = () => {}),
      (v407["_finalizeVideoSuccessSideEffects"] = () => {
        v405 += 1;
      }),
      await v406["_maybeResumeDreaminaTaskImpl"]["call"](v407));
    v407["_dreaminaResumePromise"] && (await v407["_dreaminaResumePromise"]);
    const v411 = v408["nodes"][v402];
    (strict["equal"](v404, 1),
      strict["equal"](v405, 1),
      strict["equal"](v411["isGenerating"], false),
      strict["equal"](v411["jobStatus"], "success"),
      strict["equal"](v411["dreaminaTaskStatus"], "success"),
      strict["equal"](v411["dreaminaTaskPhase"], "done"),
      strict["equal"](v411["dreaminaTaskRecovering"], false),
      strict["equal"](v411["videoUrl"], "/output/dreamina/video-success.mp4"),
      strict["equal"](v411["localPath"], "output/dreamina/video-success.mp4"),
      strict["equal"](v407["_isGenerating"], false));
  }),
  test("task\x20orchestration:\x20dreamina\x20video\x20recovery\x20returns\x20failed\x20reason\x20and\x20clears\x20loading\x20state", async () => {
    const v412 = "node-video-dreamina-recovery-failed",
      v413 = Date["now"]() - 60000,
      {
        proto: v414,
        ctx: v415,
        state: v416,
      } = createTestContext({
        targetId: v412,
        nodeData: {
          id: v412,
          provider: "dreamina",
          model: "dreamina/seedance2.0fast",
          dreaminaSubmitId: "sid-video-fail",
          dreaminaTaskStatus: "pending",
          dreaminaTaskPhase: "generating",
          dreaminaTaskLabel: "生成中",
          dreaminaTaskStartedAt: v413,
          dreaminaTaskLastCheckedAt: Date["now"]() - 30000,
          dreaminaTaskRecovering: false,
          generationStartTime: v413,
          generationDuration: null,
          isGenerating: true,
        },
        apiImpl: {
          resumeDreaminaVideoTask: async (v417) => {
            strict["equal"](v417, "sid-video-fail");
            const v418 = new Error(
              "generation\x20failed:\x20final\x20generation\x20failed",
            );
            v418["dreaminaSnapshot"] = {
              submitId: v417,
              status: "failed",
              phase: "failed",
              label: "generation failed: final generation failed",
              failReason:
                "generation\x20failed:\x20final\x20generation\x20failed",
              outputs: [],
              raw: {},
              lastCheckedAt: Date["now"](),
            };
            throw v418;
          },
        },
      });
    ((v415["_isGenerating"] = true),
      (v415["btnEl"] = createButtonStub()),
      (v415["previewEl"] = {}),
      (v415["_updateSubmitButtonState"] = () => {}),
      (v415["_persistDreaminaResumeCache"] = () => {}),
      await v414["_maybeResumeDreaminaTaskImpl"]["call"](v415));
    v415["_dreaminaResumePromise"] && (await v415["_dreaminaResumePromise"]);
    const v419 = v416["nodes"][v412];
    (strict["equal"](v419["isGenerating"], false),
      strict["equal"](v419["jobStatus"], "error"),
      strict["equal"](
        v419["jobError"],
        "generation failed: final generation failed",
      ),
      strict["equal"](
        v419["videos"]?.[0]?.["error"],
        "generation failed: final generation failed",
      ),
      strict["equal"](v419["dreaminaTaskStatus"], "failed"),
      strict["equal"](v419["dreaminaTaskPhase"], "failed"),
      strict["equal"](
        v419["dreaminaTaskLabel"],
        "generation failed: final generation failed",
      ),
      strict["equal"](v419["dreaminaTaskRecovering"], false));
  }),
  test("task\x20orchestration:\x20RunningHub\x20video\x20recovery\x20writes\x20terminal\x20state\x20through\x20runtime", async () => {
    const v420 = "node-video-rh-recovery-success",
      v421 = Date["now"]() - 60000;
    let v422 = 0,
      v423 = 0;
    const {
      proto: v424,
      ctx: v425,
      state: v426,
    } = createTestContext({
      targetId: v420,
      nodeData: {
        id: v420,
        provider: "runninghubwf",
        model: "runninghub/1971148165531475969",
        rhTaskId: "rh-video-resume-success",
        rhTaskStatus: "running",
        rhTaskStartedAt: v421,
        rhTaskUseOpenapiQuery: true,
        generationStartTime: v421,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeRunningHubVideoTask: async (v427, v428, v429) => {
          return (
            (v422 += 1),
            strict["equal"](v427, "rh-video-resume-success"),
            strict["equal"](v428["provider"], "runninghubwf"),
            strict["equal"](v429?.["useOpenapiQuery"], true),
            {
              videos: [
                {
                  videoUrl: "/output/resumed.mp4",
                  localPath: "/output/resumed.mp4",
                },
              ],
            }
          );
        },
      },
    });
    ((v425["_isGenerating"] = false),
      (v425["btnEl"] = createButtonStub()),
      (v425["previewEl"] = {}),
      (v425["_isRunninghubWorkflowModel"] = () => true),
      (v425["_buildPayload"] = async () => ({
        provider: "runninghubwf",
        model: "runninghub/1971148165531475969",
        apiKey: "k_rh",
      })),
      (v425["_persistRunningHubResumeCache"] = () => {}),
      (v425["_updateSubmitButtonState"] = () => {}),
      (v425["_finalizeVideoSuccessSideEffects"] = () => {
        v423 += 1;
      }),
      await v424["_maybeResumeRunningHubTaskImpl"]["call"](v425));
    v425["_rhResumePromise"] && (await v425["_rhResumePromise"]);
    const v430 = v426["nodes"][v420];
    (strict["equal"](v422, 1),
      strict["equal"](v423, 1),
      strict["equal"](v430["isGenerating"], false),
      strict["equal"](v430["jobStatus"], "success"),
      strict["equal"](v430["rhTaskStatus"], "success"),
      strict["equal"](v430["rhTaskRecovering"], false),
      strict["equal"](v430["videoUrl"], "/output/resumed.mp4"),
      strict["equal"](v430["localPath"], "/output/resumed.mp4"),
      strict["equal"](v425["_isGenerating"], false));
  }),
  test("task orchestration: async video recovery writes terminal state through runtime", async () => {
    const v431 = "node-video-async-recovery-success",
      v432 = Date["now"]() - 60000;
    let v433 = 0,
      v434 = 0;
    const {
      proto: v435,
      ctx: v436,
      state: v437,
    } = createTestContext({
      targetId: v431,
      nodeData: {
        id: v431,
        provider: "grsai",
        model: "grsai-video-basic",
        asyncTaskProvider: "grsai",
        asyncTaskKind: "video",
        asyncTaskId: "async-video-resume-success",
        asyncTaskStatus: "running",
        asyncTaskStartedAt: v432,
        generationStartTime: v432,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeAsyncVideoTask: async (v438, v439, v440) => {
          return (
            (v433 += 1),
            strict["equal"](v438, "async-video-resume-success"),
            strict["equal"](v439["provider"], "grsai"),
            strict["ok"](v440?.["signal"]),
            {
              videos: [
                {
                  videoUrl: "/output/async-resumed.mp4",
                  localPath: "/output/async-resumed.mp4",
                },
              ],
            }
          );
        },
      },
    });
    ((v436["_isGenerating"] = false),
      (v436["btnEl"] = createButtonStub()),
      (v436["previewEl"] = {}),
      (v436["_buildPayload"] = async () => ({
        provider: "grsai",
        model: "grsai-video-basic",
      })),
      (v436["_persistAsyncResumeCache"] = () => {}),
      (v436["_updateSubmitButtonState"] = () => {}),
      (v436["_finalizeVideoSuccessSideEffects"] = () => {
        v434 += 1;
      }),
      await v435["_maybeResumeAsyncTaskImpl"]["call"](v436));
    v436["_asyncResumePromise"] && (await v436["_asyncResumePromise"]);
    const v441 = v437["nodes"][v431];
    (strict["equal"](v433, 1),
      strict["equal"](v434, 1),
      strict["equal"](v441["isGenerating"], false),
      strict["equal"](v441["jobStatus"], "success"),
      strict["equal"](v441["asyncTaskStatus"], "success"),
      strict["equal"](v441["asyncTaskProvider"], "grsai"),
      strict["equal"](v441["asyncTaskKind"], "video"),
      strict["equal"](v441["asyncTaskRecovering"], false),
      strict["equal"](v441["videoUrl"], "/output/async-resumed.mp4"),
      strict["equal"](v441["localPath"], "/output/async-resumed.mp4"),
      strict["equal"](v436["_isGenerating"], false));
  }),
  test("task\x20orchestration:\x20async\x20video\x20recovery\x20rebuilds\x20only\x20the\x20resume\x20payload", async () => {
    const v442 = "node-video-async-recovery-minimal-payload",
      v443 = Date["now"]() - 60000;
    let v444 = 0;
    const {
      proto: v445,
      ctx: v446,
      state: v447,
    } = createTestContext({
      targetId: v442,
      prompt: "",
      nodeData: {
        id: v442,
        provider: "apimart",
        model: "apimart/luma-ray-v2",
        asyncTaskProvider: "apimart",
        asyncTaskKind: "video",
        asyncTaskId: "async-video-resume-minimal",
        asyncTaskStatus: "running",
        asyncTaskStartedAt: v443,
        generationStartTime: v443,
        generationDuration: null,
        isGenerating: true,
        videos: [],
      },
      apiImpl: {
        resumeAsyncVideoTask: async (v448, v449, v450) => {
          return (
            (v444 += 1),
            strict["equal"](v448, "async-video-resume-minimal"),
            strict["equal"](v449["provider"], "apimart"),
            strict["equal"](v449["model"], "apimart/luma-ray-v2"),
            strict["equal"](v449["prompt"], undefined),
            strict["ok"](v450?.["signal"]),
            {
              videos: [
                {
                  videoUrl: "/output/async-minimal-resumed.mp4",
                  localPath: "/output/async-minimal-resumed.mp4",
                },
              ],
            }
          );
        },
      },
    });
    ((v446["_isGenerating"] = false),
      (v446["btnEl"] = createButtonStub()),
      (v446["previewEl"] = {}),
      (v446["_buildPayload"] = async () => {
        throw new Error(
          "resume\x20should\x20not\x20rebuild\x20submit\x20payload",
        );
      }),
      (v446["_persistAsyncResumeCache"] = () => {}),
      (v446["_updateSubmitButtonState"] = () => {}),
      (v446["_finalizeVideoSuccessSideEffects"] = () => {}),
      await v445["_maybeResumeAsyncTaskImpl"]["call"](v446));
    v446["_asyncResumePromise"] && (await v446["_asyncResumePromise"]);
    const v451 = v447["nodes"][v442];
    (strict["equal"](v444, 1),
      strict["equal"](v451["isGenerating"], false),
      strict["equal"](v451["jobStatus"], "success"),
      strict["equal"](v451["asyncTaskStatus"], "success"),
      strict["equal"](v451["asyncTaskRecovering"], false),
      strict["equal"](v451["videoUrl"], "/output/async-minimal-resumed.mp4"));
  }),
  test("task orchestration: apimart 即梦后台恢复使用 APIMart 异步轮询错误", async () => {
    const v452 = "node-video-apimart-dreamina-recovery-failed",
      v453 = Date["now"]() - 60000;
    let v454 = 0;
    const {
      proto: v455,
      ctx: v456,
      state: v457,
    } = createTestContext({
      targetId: v452,
      nodeData: {
        id: v452,
        provider: "apimart",
        model: "apimart/doubao-seedance-2.0-fast",
        dreaminaSubmitId: "task-apimart-fail",
        dreaminaTaskStatus: "pending",
        dreaminaTaskPhase: "generating",
        dreaminaTaskLabel: "生成中",
        dreaminaTaskStartedAt: v453,
        dreaminaTaskLastCheckedAt: Date["now"]() - 30000,
        dreaminaTaskRecovering: false,
        generationStartTime: v453,
        generationDuration: null,
        isGenerating: true,
      },
      apiImpl: {
        resumeAsyncVideoTask: async (v458, v459) => {
          ((v454 += 1),
            strict["equal"](v458, "task-apimart-fail"),
            strict["equal"](v459["provider"], "apimart"));
          throw new Error("Seedance upstream failed");
        },
        resumeDreaminaVideoTask: async () => {
          throw new Error("should not resume official dreamina endpoint");
        },
      },
    });
    ((v456["_isDreaminaVideoNode"] = (v460) =>
      String(v460?.["provider"] || "")["toLowerCase"]() === "apimart" ||
      String(v460?.["provider"] || "")["toLowerCase"]() === "dreamina"),
      (v456["_isGenerating"] = true),
      (v456["btnEl"] = createButtonStub()),
      (v456["previewEl"] = {}),
      (v456["_updateSubmitButtonState"] = () => {}),
      (v456["_persistDreaminaResumeCache"] = () => {}),
      await v455["_maybeResumeDreaminaTaskImpl"]["call"](v456));
    v456["_dreaminaResumePromise"] && (await v456["_dreaminaResumePromise"]);
    const v461 = v457["nodes"][v452];
    (strict["equal"](v454, 1),
      strict["equal"](v461["isGenerating"], false),
      strict["equal"](v461["jobStatus"], "error"),
      strict["equal"](v461["jobError"], "Seedance upstream failed"),
      strict["equal"](
        v461["videos"]?.[0]?.["error"],
        "Seedance\x20upstream\x20failed",
      ),
      strict["equal"](v461["dreaminaTaskStatus"], "failed"),
      strict["equal"](v461["dreaminaTaskPhase"], "failed"),
      strict["equal"](v461["dreaminaTaskLabel"], "Seedance upstream failed"),
      strict["equal"](v461["dreaminaTaskRecovering"], false));
  }),
  test("task orchestration: dreamina video recovery does not abort itself on reentrant state update", async () => {
    const v462 = "node-video-dreamina-reentrant-recovery",
      v463 = Date["now"]() - 60000,
      {
        proto: v464,
        ctx: v465,
        state: v466,
        store: v467,
      } = createTestContext({
        targetId: v462,
        nodeData: {
          id: v462,
          provider: "dreamina",
          model: "dreamina/seedance2.0fast",
          dreaminaSubmitId: "sid-video-reentrant-fail",
          dreaminaTaskStatus: "pending",
          dreaminaTaskPhase: "generating",
          dreaminaTaskLabel: "生成中",
          dreaminaTaskStartedAt: v463,
          dreaminaTaskLastCheckedAt: Date["now"]() - 30000,
          dreaminaTaskRecovering: false,
          generationStartTime: v463,
          generationDuration: null,
          isGenerating: true,
        },
        apiImpl: {
          resumeDreaminaVideoTask: async (v468) => {
            (strict["equal"](v468, "sid-video-reentrant-fail"),
              await Promise["resolve"]());
            throw new Error(
              "generation\x20failed:\x20final\x20generation\x20failed",
            );
          },
        },
      });
    ((v465["_isGenerating"] = true),
      (v465["btnEl"] = createButtonStub()),
      (v465["previewEl"] = {}),
      (v465["_updateSubmitButtonState"] = () => {}),
      (v465["_persistDreaminaResumeCache"] = () => {}));
    const v469 = v467["updateNodeData"]["bind"](v467);
    let v470 = false;
    ((v467["updateNodeData"] = (v471, v472) => {
      (v469(v471, v472),
        !v470 &&
          v472?.["dreaminaTaskRecovering"] === true &&
          ((v470 = true),
          void v464["_maybeResumeDreaminaTaskImpl"]["call"](v465)));
    }),
      await v464["_maybeResumeDreaminaTaskImpl"]["call"](v465),
      await v465["_dreaminaResumePromise"]);
    const v473 = v466["nodes"][v462];
    (strict["equal"](v470, true),
      strict["equal"](v473["isGenerating"], false),
      strict["equal"](v473["jobStatus"], "error"),
      strict["equal"](
        v473["videos"]?.[0]?.["error"],
        "generation failed: final generation failed",
      ),
      strict["equal"](v473["dreaminaTaskStatus"], "failed"),
      strict["equal"](v473["dreaminaTaskRecovering"], false));
  }),
  test("task orchestration: dreamina TIMEOUT 错误会转为后台 pending", async () => {
    const v474 = "node-video-timeout-1",
      v475 = {
        nodes: {
          [v474]: {
            id: v474,
            provider: "dreamina",
            model: "dreamina/seedance2.0fast",
          },
        },
      },
      v476 = createStore(v475),
      v477 = globalThis["window"]["showToast"],
      v478 = [];
    let v479 = 0,
      v480 = 0;
    globalThis["window"]["showToast"] = (v481) => {
      v478["push"](String(v481 || ""));
    };
    try {
      const v482 = createVideoNodeTaskOrchestrationModule({
          store: v476,
          api: {
            generateVideo: async () => {
              const v483 = new Error("请求超时（60秒）");
              v483["code"] = "TIMEOUT";
              throw v483;
            },
          },
          getImage: async () => null,
          startLoading: () => {
            v479 += 1;
          },
          stopLoading: () => {
            v480 += 1;
          },
          ensureConfig: async () => {},
          getProviderConfig: () => ({ apiKey: "" }),
          isVideoVipModel: () => false,
          ensureVipSessionRecheck: async () => {},
        }),
        v484 = Object["assign"](Object["create"](v482), {
          nodeId: v474,
          _data: v475["nodes"][v474],
          _isGenerating: false,
          btnEl: createButtonStub(),
          previewEl: {},
          _updateSubmitButtonState: () => {},
          _guardVipSelection: () => true,
          _buildPayload: async () => ({
            provider: "dreamina",
            model: "dreamina/seedance2.0fast",
            prompt: "test prompt",
          }),
          _isDreaminaVideoNode(v485) {
            return (
              String(v485?.["provider"] || "")
                ["trim"]()
                ["toLowerCase"]() === "dreamina"
            );
          },
          _isRunninghubWorkflowModel: () => false,
        });
      await v482["_onGenerateImpl"]["call"](v484);
      const v486 = v475["nodes"][v474];
      (strict["equal"](v486["dreaminaTaskStatus"], "pending"),
        strict["equal"](v486["dreaminaTaskPhase"], "generating"),
        strict["equal"](v486["dreaminaTaskLabel"], "排队中（后台查询）"),
        strict["equal"](v486["dreaminaTaskStatus"] === "failed", false),
        strict["equal"](v486["isGenerating"], true),
        strict["equal"](v479, 1),
        strict["equal"](v480, 0),
        strict["equal"](
          v478["includes"]("即梦排队较久，已转为后台查询"),
          true,
        ));
    } finally {
      globalThis["window"]["showToast"] = v477;
    }
  }));

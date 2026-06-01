import test from "node:test";
import strict from "node:assert/strict";
import { createAIGenTextNodeTaskOrchestrationModule } from "./taskOrchestrationModule.js";
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from "../../modules/previewMode.js";
import {
  createFakePreviewContainer,
  installPreviewDomStubs,
} from "../../../tests/testPreviewDom.js";
const originalWindow = globalThis["window"],
  originalNodeCtor = globalThis["Node"],
  restorePreviewDom = installPreviewDomStubs();
if (!globalThis["window"]) globalThis["window"] = {};
typeof globalThis["window"]["showToast"] !== "function" &&
  (globalThis["window"]["showToast"] = () => {});
!globalThis["Node"] && (globalThis["Node"] = { TEXT_NODE: 3, ELEMENT_NODE: 1 });
(test["after"](() => {
  (_resetPreviewRuntimeForTests(),
    typeof originalWindow === "undefined"
      ? delete globalThis["window"]
      : (globalThis["window"] = originalWindow),
    typeof originalNodeCtor === "undefined"
      ? delete globalThis["Node"]
      : (globalThis["Node"] = originalNodeCtor),
    restorePreviewDom());
}),
  test("aigenText\x20task\x20orchestration:\x20预览模式下点击生成只启动假加载不发请求", async () => {
    const v0 = globalThis["window"]["PREVIEW_MODE"];
    globalThis["window"]["PREVIEW_MODE"] = true;
    try {
      const v1 = "node-ai-text-preview-loading";
      let v2 = false;
      const v3 = createAIGenTextNodeTaskOrchestrationModule({
          store: {
            getState: () => ({
              nodes: { [v1]: { id: v1, model: "gpt-4o", provider: "openai" } },
            }),
            getIncomingEdges: () => [],
            updateNodeData() {},
          },
          api: {
            generateText: async () => {
              return ((v2 = true), { text: "不会执行" });
            },
          },
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          commit: () => {},
          startLoading: () => {},
          stopLoading: () => {},
          bindRefThumbHoverPreview: () => {},
          getPromptPresets: () => [],
          getCustomTextModels: () => [],
          saveCustomTextModels: () => {},
        }),
        v4 = Object["assign"](Object["create"](v3), {
          nodeId: v1,
          _data: { id: v1, model: "gpt-4o", provider: "openai" },
          previewEl: createFakePreviewContainer(),
          promptEl: createPromptEl("请总结这张图"),
          btnEl: createButtonStub(),
        });
      (await v3["_onGenerate"]["call"](v4),
        strict["equal"](v2, false),
        strict["equal"](isPreviewNodeLoading(v1), true),
        strict["equal"](v4["btnEl"]["disabled"], true),
        strict["match"](v4["btnEl"]["innerHTML"], /animation:spin/),
        stopPreviewNodeLoading(v1),
        strict["equal"](v4["btnEl"]["disabled"], false),
        strict["doesNotMatch"](v4["btnEl"]["innerHTML"], /animation:spin/));
    } finally {
      globalThis["window"]["PREVIEW_MODE"] = v0;
    }
  }),
  test("aigenText task orchestration: 加入提示词模式只回填预设不发请求", async () => {
    const v5 = globalThis["window"]["showToast"],
      v6 = [];
    globalThis["window"]["showToast"] = (...v7) => {
      v6["push"](v7);
    };
    try {
      const v8 = "node-ai-text-insert-prompt-preset";
      let v9 = false;
      const {
        proto: v10,
        ctx: v11,
        state: v12,
      } = createTestContext({
        targetId: v8,
        nodeData: { id: v8, model: "gpt-4o", provider: "openai" },
        promptText: "夜雨追逐",
        apiImpl: {
          generateText: async () => {
            return ((v9 = true), { text: "不应生成" });
          },
        },
      });
      (await v10["_onGenerate"]["call"](v11, "改写成分镜：{用户输入}", {
        insertPrompt: true,
      }),
        strict["equal"](v9, false),
        strict["equal"](v12["nodes"][v8]["prompt"], "改写成分镜：夜雨追逐"),
        strict["equal"](v11["promptEl"]["innerHTML"], "改写成分镜：夜雨追逐"),
        strict["equal"](v6["length"], 0));
    } finally {
      globalThis["window"]["showToast"] = v5;
    }
  }),
  test["afterEach"](() => {
    _resetPreviewRuntimeForTests();
  }),
  test("aigenText task orchestration: start patch enters running and success exits", async () => {
    const v13 = "node-ai-text-start-running";
    let v14 = 0,
      v15 = 0,
      v16;
    const v17 = new Promise((v18) => {
        v16 = v18;
      }),
      {
        proto: v19,
        ctx: v20,
        state: v21,
      } = createTestContext({
        targetId: v13,
        nodeData: {
          id: v13,
          model: "gpt-4o",
          provider: "openai",
          outputText: "old text",
          isGenerating: false,
          jobStatus: "success",
          generationDuration: 1234,
        },
        promptText: "write\x20summary",
        apiImpl: { generateText: async () => v17 },
        startLoadingImpl: () => {
          v14 += 1;
        },
        stopLoadingImpl: () => {
          v15 += 1;
        },
      });
    ((v20["_isGenerating"] = false),
      (v20["btnEl"] = createButtonStub()),
      (v20["previewEl"] = {}),
      (v20["_updateSubmitButtonState"] = () => {}));
    const v22 = v19["_onGenerate"]["call"](v20);
    (await Promise["resolve"](), await Promise["resolve"]());
    const v23 = v21["nodes"][v13];
    (strict["equal"](v14, 1),
      strict["equal"](v15, 0),
      strict["equal"](v23["isGenerating"], true),
      strict["equal"](v23["jobStatus"], "running"),
      strict["equal"](v23["jobError"], null),
      strict["equal"](v23["generationDuration"], null),
      v16({ text: "new text" }),
      await v22);
    const v24 = v21["nodes"][v13];
    (strict["equal"](v24["isGenerating"], false),
      strict["equal"](v24["jobStatus"], "success"),
      strict["equal"](v24["jobError"], null),
      strict["equal"](v24["outputText"], "new text"),
      strict["equal"](v15, 1));
  }),
  test("aigenText\x20task\x20orchestration:\x20timeout\x20failure\x20stays\x20visible\x20in\x20text\x20output", async () => {
    const v25 = globalThis["window"]["showToast"],
      v26 = console["error"],
      v27 = [];
    ((globalThis["window"]["showToast"] = (...v28) => {
      v27["push"](v28);
    }),
      (console["error"] = () => {}));
    try {
      const v29 = "node-ai-text-timeout-output",
        v30 = new Error("请求超时（300秒）");
      v30["type"] = "TIMEOUT";
      let v31 = "",
        v32 = 0;
      const {
        proto: v33,
        ctx: v34,
        state: v35,
      } = createTestContext({
        targetId: v29,
        nodeData: { id: v29, model: "gemini-3.1-pro", provider: "grsai" },
        promptText: "你好",
        apiImpl: {
          generateText: async () => {
            throw v30;
          },
        },
        stopLoadingImpl: () => {
          v32 += 1;
        },
      });
      ((v34["_isGenerating"] = false),
        (v34["btnEl"] = createButtonStub()),
        (v34["previewEl"] = {}),
        (v34["outputEl"] = {}),
        (v34["_updateSubmitButtonState"] = () => {}),
        (v34["_renderOutputText"] = (v36) => {
          v31 = String(v36 || "");
        }));
      const v37 = await v33["_onGenerate"]["call"](v34),
        v38 = v35["nodes"][v29];
      (strict["equal"](v37["status"], "failed"),
        strict["equal"](v38["jobStatus"], "error"),
        strict["equal"](v38["jobError"], "请求超时（300秒）"),
        strict["match"](v38["outputText"], /生成超时/),
        strict["match"](v31, /生成超时/),
        strict["equal"](v27["length"], 0),
        strict["equal"](v32, 1));
    } finally {
      ((globalThis["window"]["showToast"] = v25), (console["error"] = v26));
    }
  }));
function createStore(v39, v40 = []) {
  return {
    getState() {
      return v39;
    },
    getIncomingEdges(v41) {
      return v40["filter"]((v42) => v42["targetId"] === v41);
    },
    updateNodeData(v43, v44) {
      const v45 = v39["nodes"]?.[v43] || {};
      v39["nodes"][v43] = { ...v45, ...v44 };
    },
  };
}
function createPromptEl(v46 = "describe @图片1") {
  return {
    innerText: v46,
    childNodes: [{ nodeType: Node["TEXT_NODE"], textContent: v46 }],
  };
}
function createButtonStub() {
  const v47 = new Set();
  return {
    disabled: false,
    title: "",
    innerHTML: "",
    style: { color: "", cursor: "" },
    _attrs: new Map(),
    classList: {
      add(v48) {
        v47["add"](String(v48 || ""));
      },
      remove(v49) {
        v47["delete"](String(v49 || ""));
      },
      contains(v50) {
        return v47["has"](String(v50 || ""));
      },
    },
    setAttribute(v51, v52) {
      this["_attrs"]["set"](String(v51 || ""), String(v52 || ""));
    },
    removeAttribute(v53) {
      this["_attrs"]["delete"](String(v53 || ""));
    },
  };
}
function createTestContext({
  targetId: v54,
  nodeData: v55,
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  promptText: promptText = "describe @图片1",
  customTextModels: customTextModels = [],
  apiImpl: apiImpl = {},
  startLoadingImpl: startLoadingImpl = () => {},
  stopLoadingImpl: stopLoadingImpl = () => {},
}) {
  const v56 = { nodes: { ...nodes, [v54]: { ...v55 } } },
    v57 = createStore(v56, incomingEdges),
    v58 = createAIGenTextNodeTaskOrchestrationModule({
      store: v57,
      api: apiImpl,
      ensureThumbDecoded: () => {},
      revealRefThumbMedia: () => {},
      commit: () => {},
      startLoading: startLoadingImpl,
      stopLoading: stopLoadingImpl,
      bindRefThumbHoverPreview: () => {},
      getPromptPresets: () => [],
      getCustomTextModels: () => customTextModels,
      saveCustomTextModels: () => {},
    }),
    v59 = Object["assign"](Object["create"](v58), {
      nodeId: v54,
      _data: v56["nodes"][v54],
      promptEl: createPromptEl(promptText),
    });
  return { proto: v58, ctx: v59, state: v56, store: v57 };
}
(test("aigenText\x20task\x20orchestration:\x20图片引用优先使用原图本地路径", async () => {
  const v60 = "node-ai-text-image-original-first",
    v61 = "node-ref-image-text-original-first",
    { proto: v62, ctx: v63 } = createTestContext({
      targetId: v60,
      nodeData: { id: v60, model: "gpt-4o", provider: "openai" },
      nodes: {
        [v61]: {
          id: v61,
          type: "source-image",
          originalLocalPath: "data/uploads/text-original.png",
          displayLocalPath: "data/uploads/text-display.webp",
          thumbLocalPath: "data/uploads/text-thumb.webp",
          thumbUrl: "https://img.example.com/text-thumb.png",
        },
      },
      incomingEdges: [
        { id: "edge-text-original-first", sourceId: v61, targetId: v60 },
      ],
    }),
    v64 = await v62["_buildPayload"]["call"](v63);
  (strict["deepEqual"](v64["inputUrls"], ["/data/uploads/text-original.png"]),
    strict["deepEqual"](v64["inputImageUrls"], [
      "/data/uploads/text-original.png",
    ]));
}),
  test("aigenText task orchestration: 视频引用优先使用原视频本地路径", async () => {
    const v65 = "node-ai-text-video-original-first",
      v66 = "node-ref-video-text-original-first",
      { proto: v67, ctx: v68 } = createTestContext({
        targetId: v65,
        nodeData: {
          id: v65,
          model: "gemini-3-flash-preview-nothinking",
          provider: "apimart",
        },
        nodes: {
          [v66]: {
            id: v66,
            type: "source-video",
            localPath: "data/uploads/text-source-video.mp4",
            thumbUrl: "https://img.example.com/video-thumb.jpg",
            imageUrl: "https://img.example.com/video-poster.jpg",
          },
        },
        incomingEdges: [
          {
            id: "edge-text-video-original-first",
            sourceId: v66,
            targetId: v65,
          },
        ],
        promptText: "分析 @视频1",
      }),
      v69 = await v67["_buildPayload"]["call"](v68);
    (strict["deepEqual"](v69["inputUrls"], [
      "/data/uploads/text-source-video.mp4",
    ]),
      strict["deepEqual"](v69["inputImageUrls"], []),
      strict["deepEqual"](v69["inputVideoUrls"], [
        "/data/uploads/text-source-video.mp4",
      ]));
  }),
  test("aigenText task orchestration: ai-text 入参无输出时使用 prompt 作为文本内容", async () => {
    const v70 = "node-ai-text-text-prompt-ref",
      v71 = "node-ai-text-prompt-source",
      { proto: v72, ctx: v73 } = createTestContext({
        targetId: v70,
        nodeData: { id: v70, model: "gpt-4o", provider: "openai" },
        nodes: {
          [v71]: {
            id: v71,
            type: "ai-text",
            prompt: "来自另一个生成文本节点的提示词",
          },
        },
        incomingEdges: [
          { id: "edge-ai-text-prompt-ref", sourceId: v71, targetId: v70 },
        ],
        promptText: "继续扩写",
      }),
      v74 = await v72["_buildPayload"]["call"](v73);
    (strict["equal"](
      v74["prompt"],
      "来自另一个生成文本节点的提示词\x0a继续扩写",
    ),
      strict["deepEqual"](v74["inputUrls"], []));
  }),
  test("aigenText task orchestration: 自定义模型会按顺序收集多张图片入参", async () => {
    const v75 = "node-ai-text-custom-multimodal",
      v76 = "node-ref-image-custom-first",
      v77 = "node-ref-image-custom-second",
      v78 = "doubao-seed-2-0-pro",
      { proto: v79, ctx: v80 } = createTestContext({
        targetId: v75,
        nodeData: { id: v75, model: v78 },
        customTextModels: [v78],
        nodes: {
          [v76]: {
            id: v76,
            type: "source-image",
            originalLocalPath: "data/uploads/custom-first.png",
          },
          [v77]: {
            id: v77,
            type: "source-image",
            originalLocalPath: "data/uploads/custom-second.png",
          },
        },
        incomingEdges: [
          { id: "edge-custom-first", sourceId: v76, targetId: v75 },
          { id: "edge-custom-second", sourceId: v77, targetId: v75 },
        ],
        promptText: "compare @图片1 with @图片2",
      }),
      v81 = await v79["_buildPayload"]["call"](v80);
    (strict["equal"](v81["provider"], "custom"),
      strict["equal"](v81["model"], v78),
      strict["deepEqual"](v81["inputUrls"], [
        "/data/uploads/custom-first.png",
        "/data/uploads/custom-second.png",
      ]),
      strict["deepEqual"](v81["inputImageUrls"], [
        "/data/uploads/custom-first.png",
        "/data/uploads/custom-second.png",
      ]));
  }),
  test("aigenText task orchestration: 自定义模型即使有图片也需要提示词", async () => {
    const v82 = "node-ai-text-custom-needs-prompt",
      v83 = "node-ref-image-custom-needs-prompt",
      v84 = "doubao-seed-2-0-pro",
      v85 = globalThis["window"]["showToast"],
      v86 = [];
    globalThis["window"]["showToast"] = (...v87) => {
      v86["push"](v87);
    };
    try {
      const { proto: v88, ctx: v89 } = createTestContext({
          targetId: v82,
          nodeData: { id: v82, model: v84 },
          customTextModels: [v84],
          nodes: {
            [v83]: {
              id: v83,
              type: "source-image",
              originalLocalPath: "data/uploads/custom-needs-prompt.png",
            },
          },
          incomingEdges: [
            { id: "edge-custom-needs-prompt", sourceId: v83, targetId: v82 },
          ],
          promptText: "",
        }),
        v90 = await v88["_buildPayload"]["call"](v89);
      (strict["equal"](v90, null),
        strict["deepEqual"](v86, [["请输入提示词后再生成", "warn"]]));
    } finally {
      globalThis["window"]["showToast"] = v85;
    }
  }));

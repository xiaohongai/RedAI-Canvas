import test from "node:test";
import strict from "node:assert/strict";
import { createAIGenerateNodeTaskOrchestrationModule } from "./taskOrchestrationModule.js";
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
import { getModelManifest } from "../../manifests/index.js";
const originalWindow = globalThis["window"],
  originalDocument = globalThis["document"],
  originalNodeCtor = globalThis["Node"],
  restorePreviewDom = installPreviewDomStubs();
if (!globalThis["window"]) globalThis["window"] = {};
typeof globalThis["window"]["showToast"] !== "function" &&
  (globalThis["window"]["showToast"] = () => {});
!globalThis["Node"] && (globalThis["Node"] = { TEXT_NODE: 3, ELEMENT_NODE: 1 });
!globalThis["document"] &&
  (globalThis["document"] = { getElementById: () => null });
(test["after"](() => {
  (_resetPreviewRuntimeForTests(),
    typeof originalWindow === "undefined"
      ? delete globalThis["window"]
      : (globalThis["window"] = originalWindow),
    typeof originalDocument === "undefined"
      ? delete globalThis["document"]
      : (globalThis["document"] = originalDocument),
    typeof originalNodeCtor === "undefined"
      ? delete globalThis["Node"]
      : (globalThis["Node"] = originalNodeCtor),
    restorePreviewDom());
}),
  test["afterEach"](() => {
    (_resetPreviewRuntimeForTests(), _resetAssetMentionRegistryForTests());
  }));
function createStore(v0, v1 = []) {
  return {
    getState() {
      return v0;
    },
    getIncomingEdges(v2) {
      return v1["filter"]((v3) => v3["targetId"] === v2);
    },
    updateNodeData(v4, v5) {
      const v6 = v0["nodes"]?.[v4] || {};
      v0["nodes"][v4] = { ...v6, ...v5 };
    },
  };
}
function createPromptTextNode(v7 = "") {
  return { nodeType: Node["TEXT_NODE"], textContent: String(v7 || "") };
}
function createPromptElementNode({
  tagName: tagName = "SPAN",
  className: className = "",
  dataset: dataset = {},
  textContent: textContent = "",
  childNodes: childNodes = [],
} = {}) {
  const v8 = String(className || "")
    ["split"](/\s+/)
    ["filter"](Boolean);
  return {
    nodeType: Node["ELEMENT_NODE"],
    tagName: tagName,
    className: className,
    classList: {
      contains(v9) {
        return v8["includes"](String(v9 || ""));
      },
    },
    dataset: { ...dataset },
    textContent: String(textContent || ""),
    childNodes: Array["isArray"](childNodes) ? childNodes : [],
  };
}
function createAssetPromptPillNode(v10, v11, v12, v13) {
  return createPromptElementNode({
    className: "ref-pill",
    dataset: {
      label: String(v10 || ""),
      refOrigin: "asset",
      assetId: String(v11 || ""),
      assetIndex: String(v12),
      refType: String(v13 || ""),
    },
    textContent: String(v10 || ""),
  });
}
function createNodePromptPillNode(v14, v15, v16 = "image") {
  return createPromptElementNode({
    className: "ref-pill",
    dataset: {
      label: String(v14 || ""),
      nodeId: String(v15 || ""),
      refType: String(v16 || ""),
    },
    textContent: String(v14 || ""),
  });
}
function collectPromptInnerText(v17) {
  return (Array["isArray"](v17) ? v17 : [])
    ["map"]((v18) => {
      const v19 = Number(v18?.["nodeType"]);
      if (v19 === Node["TEXT_NODE"]) return String(v18?.["textContent"] || "");
      if (v19 !== Node["ELEMENT_NODE"]) return "";
      if (String(v18?.["tagName"] || "")["toUpperCase"]() === "BR")
        return "\x0a";
      const v20 = Array["isArray"](v18?.["childNodes"])
        ? v18["childNodes"]
        : [];
      if (v20["length"] > 0) return collectPromptInnerText(v20);
      return String(v18?.["textContent"] || "");
    })
    ["join"]("");
}
function createPromptEl(v21 = "test prompt") {
  if (Array["isArray"](v21)) {
    const v22 = collectPromptInnerText(v21);
    return { innerText: v22, textContent: v22, childNodes: v21 };
  }
  return {
    innerText: v21,
    textContent: v21,
    childNodes: [createPromptTextNode(v21)],
  };
}
function createButtonStub() {
  const v23 = new Set();
  return {
    disabled: false,
    title: "",
    innerHTML: "",
    style: { color: "", cursor: "" },
    _attrs: new Map(),
    classList: {
      add(v24) {
        v23["add"](String(v24 || ""));
      },
      remove(v25) {
        v23["delete"](String(v25 || ""));
      },
      contains(v26) {
        return v23["has"](String(v26 || ""));
      },
    },
    setAttribute(v27, v28) {
      this["_attrs"]["set"](String(v27 || ""), String(v28 || ""));
    },
    removeAttribute(v29) {
      this["_attrs"]["delete"](String(v29 || ""));
    },
  };
}
function createTestContext({
  targetId: v30,
  nodeData: v31,
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  promptText: promptText = "mountain",
  promptEl: promptEl = null,
  ensureConfigImpl: ensureConfigImpl = async () => {},
  getProviderConfigImpl: getProviderConfigImpl = () => ({ apiKey: "k_test" }),
  isRunninghubWorkflowModelImpl: isRunninghubWorkflowModelImpl = null,
  apiImpl: apiImpl = {
    generateImage: async () => ({ imageUrl: "/output/test.png" }),
  },
  startLoadingImpl: startLoadingImpl = () => {},
  stopLoadingImpl: stopLoadingImpl = () => {},
  storeImpl: storeImpl = null,
  stateOverride: stateOverride = null,
}) {
  const v32 = (v33) => {
      const v34 = getModelManifest(v33?.["model"]),
        v35 = Array["isArray"](v34?.["uiSchema"]?.["fields"])
          ? v34["uiSchema"]["fields"]
          : [];
      if (!v35["length"]) return { ...v33 };
      const v36 =
        v33?.["generationParams"] &&
        typeof v33["generationParams"] === "object" &&
        !Array["isArray"](v33["generationParams"])
          ? { ...v33["generationParams"] }
          : {};
      return (
        v35["forEach"]((v37) => {
          const v38 = String(v37?.["id"] || "")["trim"]();
          v38 &&
            v36[v38] === undefined &&
            Object["prototype"]["hasOwnProperty"]["call"](v33, v38) &&
            (v36[v38] = v33[v38]);
        }),
        { ...v33, generationParams: v36 }
      );
    },
    v39 = stateOverride || { nodes: { ...nodes, [v30]: v32(v31) } };
  if (!v39["nodes"] || typeof v39["nodes"] !== "object") v39["nodes"] = {};
  !v39["nodes"]?.[v30] && (v39["nodes"][v30] = v32(v31));
  const v40 = storeImpl || createStore(v39, incomingEdges),
    v41 = createAIGenerateNodeTaskOrchestrationModule({
      store: v40,
      getRefKindByNodeType: (v42) =>
        v42 === "source-image" || v42 === "image" || v42 === "ai-image"
          ? "image"
          : v42 === "source-text" || v42 === "ai-text"
            ? "text"
            : null,
      getImage: async () => null,
      ensureConfig: ensureConfigImpl,
      getProviderConfig: getProviderConfigImpl,
      api: apiImpl,
      startLoading: startLoadingImpl,
      stopLoading: stopLoadingImpl,
    }),
    v43 = Object["assign"](Object["create"](v41), {
      nodeId: v30,
      _data: v39["nodes"][v30],
      promptEl: promptEl || createPromptEl(promptText),
      _isRunninghubWorkflowModel(v44, v45) {
        if (typeof isRunninghubWorkflowModelImpl === "function")
          return isRunninghubWorkflowModelImpl(v44, v45);
        return false;
      },
    });
  return { ctx: v43, proto: v41, state: v39, store: v40 };
}
(test("aigenImage task orchestration: running RH store state cancels even when local flag is stale", async () => {
  const v46 = "node-image-running-store-cancels",
    {
      proto: v47,
      ctx: v48,
      state: v49,
    } = createTestContext({
      targetId: v46,
      nodeData: {
        id: v46,
        model: "runninghub/2044874075721441281",
        provider: "runninghubwf",
        rhTaskId: "rh-running",
        rhTaskStatus: "running",
        jobStatus: "running",
        isGenerating: true,
      },
      isRunninghubWorkflowModelImpl: () => true,
    });
  let v50 = 0,
    v51 = 0;
  ((v48["_isGenerating"] = false),
    (v48["_cancelRunningHubWorkflowTask"] = async () => {
      v50 += 1;
    }),
    (v48["_onGenerate"] = async () => {
      v51 += 1;
    }),
    (v49["nodes"][v46] = {
      ...v49["nodes"][v46],
      rhTaskId: "rh-running",
      rhTaskStatus: "running",
      jobStatus: "running",
      isGenerating: true,
    }),
    await v47["_handleGenerateOrCancel"]["call"](v48),
    strict["equal"](v50, 1),
    strict["equal"](v51, 0));
}),
  test("aigenImage\x20task\x20orchestration:\x20/预设模板在空输入时回退默认值且不残留占位符", async () => {
    const v52 = "node-ai-image-template-default-fallback",
      { proto: v53, ctx: v54 } = createTestContext({
        targetId: v52,
        nodeData: {
          id: v52,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        promptText: "",
      }),
      v55 = await v53["_buildPayload"]["call"](
        v54,
        "故事/描述：{用户输入 || 一段简短剧情}",
      );
    (strict["ok"](v55),
      strict["equal"](v55["prompt"], "故事/描述：一段简短剧情"),
      strict["equal"](v55["prompt"]["includes"]("{{"), false));
  }),
  test("aigenImage\x20task\x20orchestration:\x20图像内置对象预设无输入时不生成", async () => {
    const v56 = globalThis["window"]["showToast"],
      v57 = [];
    globalThis["window"]["showToast"] = (v58, v59) => {
      v57["push"]({ message: v58, type: v59 });
    };
    try {
      const v60 = "node-ai-image-static-template-empty",
        { proto: v61, ctx: v62 } = createTestContext({
          targetId: v60,
          nodeData: {
            id: v60,
            model: "nano-banana-pro-vt",
            provider: "grsai",
            aspectRatio: "1:1",
            imageSize: "2K",
            batchSize: 1,
          },
          promptText: "",
        }),
        v63 = await v61["_buildPayload"]["call"](v62, {
          type: "static",
          text: "故事/描述：{用户输入 || 一段简短剧情}",
          requireInput: true,
          emptyInputMessage: "请输入提示词或添加参考图片",
        });
      (strict["equal"](v63, null),
        strict["deepEqual"](v57, [
          { message: "请输入提示词或添加参考图片", type: "warn" },
        ]));
    } finally {
      globalThis["window"]["showToast"] = v56;
    }
  }),
  test("aigenImage task orchestration: 图像内置对象预设使用连线文本入参", async () => {
    const v64 = "node-ai-image-static-template-linked-text",
      v65 = "source-text-for-static-template",
      { proto: v66, ctx: v67 } = createTestContext({
        targetId: v64,
        nodeData: {
          id: v64,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          [v65]: { id: v65, type: "ai-text", outputText: "雨夜赛博街区" },
        },
        incomingEdges: [
          {
            id: "edge-linked-text-static-template",
            sourceId: v65,
            targetId: v64,
          },
        ],
        promptText: "",
      }),
      v68 = await v66["_buildPayload"]["call"](v67, {
        type: "static",
        text: "故事/描述：{用户输入 || 一段简短剧情}",
        requireInput: true,
        emptyInputMessage: "请输入提示词或添加参考图片",
      });
    (strict["ok"](v68),
      strict["equal"](v68["prompt"], "故事/描述：雨夜赛博街区"));
  }),
  test("aigenImage task orchestration: /预设模板在有输入时注入用户输入且不残留占位符", async () => {
    const v69 = "node-ai-image-template-use-user-input",
      { proto: v70, ctx: v71 } = createTestContext({
        targetId: v69,
        nodeData: {
          id: v69,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        promptText: "夜雨中的街道追逐",
      }),
      v72 = await v70["_buildPayload"]["call"](
        v71,
        "故事/描述：{用户输入 || 一段简短剧情}",
      );
    (strict["ok"](v72),
      strict["equal"](v72["prompt"], "故事/描述：夜雨中的街道追逐"),
      strict["equal"](v72["prompt"]["includes"]("{{"), false));
  }),
  test("aigenImage\x20task\x20orchestration:\x20开发者模式下\x20/预设\x20仅回填最终提示词不直接生成", async () => {
    const v73 = globalThis["window"]["DEV_MODE"];
    globalThis["window"]["DEV_MODE"] = true;
    try {
      const v74 = "node-ai-image-template-dev-preview";
      let v75 = false;
      const {
        proto: v76,
        ctx: v77,
        state: v78,
      } = createTestContext({
        targetId: v74,
        nodeData: {
          id: v74,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        promptText: "夜雨中的街道追逐",
        apiImpl: {
          generateImage: async () => {
            return ((v75 = true), { imageUrl: "/output/test.png" });
          },
        },
      });
      (await v76["_onGenerate"]["call"](
        v77,
        "故事/描述：{用户输入 || 一段简短剧情}",
      ),
        strict["equal"](v75, false),
        strict["equal"](
          v78["nodes"][v74]["prompt"],
          "故事/描述：夜雨中的街道追逐",
        ),
        strict["equal"](
          v77["promptEl"]["innerHTML"],
          "故事/描述：夜雨中的街道追逐",
        ));
    } finally {
      globalThis["window"]["DEV_MODE"] = v73;
    }
  }),
  test("aigenImage\x20task\x20orchestration:\x20预览模式下点击生成只启动假加载不发请求", async () => {
    const v79 = globalThis["window"]["PREVIEW_MODE"];
    globalThis["window"]["PREVIEW_MODE"] = true;
    try {
      const v80 = "node-ai-image-preview-loading";
      let v81 = false;
      const { proto: v82, ctx: v83 } = createTestContext({
        targetId: v80,
        nodeData: {
          id: v80,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => {
            return ((v81 = true), { imageUrl: "/output/test.png" });
          },
        },
      });
      ((v83["previewEl"] = createFakePreviewContainer()),
        (v83["btnEl"] = createButtonStub()),
        await v82["_onGenerate"]["call"](v83),
        strict["equal"](v81, false),
        strict["equal"](isPreviewNodeLoading(v80), true),
        strict["equal"](v83["btnEl"]["disabled"], true),
        strict["match"](v83["btnEl"]["innerHTML"], /animation:spin/),
        stopPreviewNodeLoading(v80),
        strict["equal"](v83["btnEl"]["disabled"], false),
        strict["doesNotMatch"](v83["btnEl"]["innerHTML"], /animation:spin/));
    } finally {
      globalThis["window"]["PREVIEW_MODE"] = v79;
    }
  }),
  test("aigenImage task orchestration: asset image mentions send type placeholders in prompt order", async () => {
    const v84 = "node-ai-image-asset-mentions";
    setAssetMentionAssets([
      {
        id: "asset-people",
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
    const { proto: v85, ctx: v86 } = createTestContext({
        targetId: v84,
        nodeData: {
          id: v84,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        promptEl: createPromptEl([
          createAssetPromptPillNode("person1", "asset-people", 0, "image"),
          createPromptTextNode("\x20and\x20"),
          createAssetPromptPillNode("person2", "asset-people", 1, "image"),
        ]),
      }),
      v87 = await v85["_buildPayload"]["call"](v86);
    (strict["equal"](v87["prompt"], "@图片1\x20and\x20@图片2"),
      strict["deepEqual"](v87["inputUrls"], [
        "/data/assets/person1.png",
        "/data/assets/person2.png",
      ]));
  }),
  test("aigenImage task orchestration: thumbnail reorder keeps inputUrls aligned with image labels", async () => {
    const v88 = "node-ai-image-reordered-thumb-labels",
      v89 = "node-ref-scene-image",
      v90 = "node-ref-woman-image",
      { proto: v91, ctx: v92 } = createTestContext({
        targetId: v88,
        nodeData: {
          id: v88,
          model: "apimart/gpt-image-2",
          provider: "apimart",
          aspectRatio: "1:1",
          imageSize: "1K",
          batchSize: 1,
          generationParams: {
            mode: "official",
            aspectRatio: "1:1",
            imageSize: "1K",
          },
        },
        nodes: {
          [v89]: {
            id: v89,
            type: "source-image",
            originalLocalPath: "data/uploads/scene.png",
            width: 1600,
            height: 900,
          },
          [v90]: {
            id: v90,
            type: "source-image",
            originalLocalPath: "data/uploads/woman.png",
            width: 900,
            height: 1600,
          },
        },
        incomingEdges: [
          { id: "edge-scene-first-after-drag", sourceId: v89, targetId: v88 },
          { id: "edge-woman-second-after-drag", sourceId: v90, targetId: v88 },
        ],
        promptEl: createPromptEl([
          createNodePromptPillNode("@图片2", v90, "image"),
          createPromptTextNode(" 的女人替换到 "),
          createNodePromptPillNode("@图片1", v89, "image"),
          createPromptTextNode("\x20的场景里面"),
        ]),
      }),
      v93 = await v91["_buildPayload"]["call"](v92);
    (strict["equal"](
      v93["prompt"],
      "@图片2\x20的女人替换到\x20@图片1\x20的场景里面",
    ),
      strict["deepEqual"](v93["inputUrls"], [
        "/data/uploads/scene.png",
        "/data/uploads/woman.png",
      ]));
  }),
  test("aigenImage\x20task\x20orchestration:\x20RunningHub\x20workflow\x20payload\x20reads\x20hidden\x20image\x20asset\x20refs", async () => {
    const v94 = "node-ai-image-hidden-asset";
    setAssetMentionAssets([
      {
        id: "asset-hidden-image",
        items: [
          {
            name: "person",
            type: "source-image",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/hidden-person.png",
            },
          },
        ],
      },
    ]);
    const { proto: v95, ctx: v96 } = createTestContext({
        targetId: v94,
        nodeData: {
          id: v94,
          model: "runninghub/1994718111704158209",
          provider: "runninghubwf",
          aspectRatio: "1:1",
          batchSize: 1,
          generationParams: {
            rhAnimeRealResolution: 1760,
            rhInstanceType: "plus",
          },
          promptAssetInputRefs: [
            { assetId: "asset-hidden-image", itemIndex: 0, type: "image" },
          ],
        },
        promptText: "portrait",
      }),
      v97 = await v95["_buildPayload"]["call"](v96);
    (strict["equal"](v97["prompt"], "portrait"),
      strict["equal"](v97["rhAnimeRealResolution"], 1760),
      strict["equal"](v97["rhResolution"], 1760),
      strict["equal"](v97["rhInstanceType"], "plus"),
      strict["deepEqual"](v97["inputUrls"], [
        "/data/assets/hidden-person.png",
      ]));
  }),
  test("aigenImage task orchestration: person replace payload uses refSlot order for manifest model ids", async () => {
    const v98 = [
      "runninghub/2041177685895946242",
      "runninghub/2050313968069165058",
    ];
    for (const v99 of v98) {
      const v100 = "node-person-replace-" + v99["slice"](-4),
        v101 = v100 + "-target",
        v102 = v100 + "-source",
        { proto: v103, ctx: v104 } = createTestContext({
          targetId: v100,
          nodeData: {
            id: v100,
            model: v99,
            provider: "runninghubwf",
            aspectRatio: "1:1",
            batchSize: 1,
            generationParams: {
              rhResolution: v99["endsWith"]("5058") ? 1280 : 1600,
              rhInstanceType: "plus",
            },
          },
          nodes: {
            [v101]: {
              id: v101,
              type: "source-image",
              originalLocalPath: "data/uploads/target.png",
            },
            [v102]: {
              id: v102,
              type: "source-image",
              originalLocalPath: "data/uploads/source.png",
            },
          },
          incomingEdges: [
            {
              id: v100 + "-edge-source",
              sourceId: v102,
              targetId: v100,
              refSlot: "replacedImage",
            },
            {
              id: v100 + "-edge-target",
              sourceId: v101,
              targetId: v100,
              refSlot: "replaceTarget",
            },
          ],
          promptText: "replace",
        }),
        v105 = await v103["_buildPayload"]["call"](v104);
      (strict["deepEqual"](
        v105["inputUrls"],
        ["/data/uploads/target.png", "/data/uploads/source.png"],
        v99,
      ),
        strict["equal"](
          v105["rhResolution"],
          v99["endsWith"]("5058") ? 1280 : 1600,
        ),
        strict["equal"](v105["rhInstanceType"], "plus"));
    }
  }),
  test("aigenImage task orchestration: modelApi fixed image slots produce inputUrlsBySlot", async () => {
    const v106 = "node-youchuan-v6-slots",
      v107 = "node-youchuan-main",
      v108 = "node-youchuan-cref",
      v109 = "node-youchuan-sref",
      { proto: v110, ctx: v111 } = createTestContext({
        targetId: v106,
        nodeData: {
          id: v106,
          type: "ai-image",
          model: "runninghub-model/youchuan-v6",
          provider: "runninghub",
          generationParams: { aspectRatio: "1:1", quality: "1" },
        },
        nodes: {
          [v107]: {
            id: v107,
            type: "source-image",
            originalLocalPath: "data/uploads/main.png",
          },
          [v108]: {
            id: v108,
            type: "source-image",
            originalLocalPath: "data/uploads/cref.png",
          },
          [v109]: {
            id: v109,
            type: "source-image",
            originalLocalPath: "data/uploads/sref.png",
          },
        },
        incomingEdges: [
          { id: "edge-sref", sourceId: v109, targetId: v106, refSlot: "sref" },
          {
            id: "edge-main",
            sourceId: v107,
            targetId: v106,
            refSlot: "imageUrl",
          },
          { id: "edge-cref", sourceId: v108, targetId: v106, refSlot: "cref" },
        ],
        promptText: "portrait",
        getProviderConfigImpl: () => ({ modelApiKey: "mk" }),
      }),
      v112 = await v110["_buildPayload"]["call"](v111);
    (strict["deepEqual"](v112["inputUrlsBySlot"], {
      imageUrl: "/data/uploads/main.png",
      cref: "/data/uploads/cref.png",
      sref: "/data/uploads/sref.png",
    }),
      strict["deepEqual"](v112["inputUrls"], [
        "/data/uploads/sref.png",
        "/data/uploads/main.png",
        "/data/uploads/cref.png",
      ]));
  }),
  test("aigenImage task orchestration: Midjourney V7 fixed image slots omit missing role slot", async () => {
    const v113 = "node-youchuan-v7-slots",
      v114 = "node-youchuan-v7-main",
      v115 = "node-youchuan-v7-sref",
      { proto: v116, ctx: v117 } = createTestContext({
        targetId: v113,
        nodeData: {
          id: v113,
          type: "ai-image",
          model: "runninghub-model/youchuan-v7",
          provider: "runninghub",
          generationParams: { aspectRatio: "1:1", quality: "1" },
        },
        nodes: {
          [v114]: {
            id: v114,
            type: "source-image",
            originalLocalPath: "data/uploads/v7-main.png",
          },
          [v115]: {
            id: v115,
            type: "source-image",
            originalLocalPath: "data/uploads/v7-sref.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-v7-sref",
            sourceId: v115,
            targetId: v113,
            refSlot: "sref",
          },
          {
            id: "edge-v7-main",
            sourceId: v114,
            targetId: v113,
            refSlot: "imageUrl",
          },
        ],
        promptText: "portrait",
        getProviderConfigImpl: () => ({ modelApiKey: "mk" }),
      }),
      v118 = await v116["_buildPayload"]["call"](v117);
    (strict["deepEqual"](v118["inputUrlsBySlot"], {
      imageUrl: "/data/uploads/v7-main.png",
      sref: "/data/uploads/v7-sref.png",
    }),
      strict["equal"](v118["inputUrlsBySlot"]["cref"], undefined),
      strict["deepEqual"](v118["inputUrls"], [
        "/data/uploads/v7-sref.png",
        "/data/uploads/v7-main.png",
      ]));
  }),
  test("aigenImage task orchestration: person replace adaptive ratio uses manifest source slot", async () => {
    const v119 = [
      "runninghub/2041177685895946242",
      "runninghub/2050313968069165058",
    ];
    for (const v120 of v119) {
      const v121 = "node-person-replace-ratio-" + v120["slice"](-4),
        v122 = v121 + "-target",
        v123 = v121 + "-source",
        { proto: v124, ctx: v125 } = createTestContext({
          targetId: v121,
          nodeData: {
            id: v121,
            model: v120,
            provider: "runninghubwf",
            batchSize: 1,
            generationParams: {
              rhResolution: v120["endsWith"]("5058") ? 1280 : 1600,
            },
          },
          nodes: {
            [v122]: {
              id: v122,
              type: "source-image",
              originalLocalPath: "data/uploads/target.png",
              width: 1600,
              height: 900,
            },
            [v123]: {
              id: v123,
              type: "source-image",
              originalLocalPath: "data/uploads/source.png",
              width: 900,
              height: 1600,
            },
          },
          incomingEdges: [
            {
              id: v121 + "-edge-target",
              sourceId: v122,
              targetId: v121,
              refSlot: "replaceTarget",
            },
            {
              id: v121 + "-edge-source",
              sourceId: v123,
              targetId: v121,
              refSlot: "replacedImage",
            },
          ],
          promptText: "replace",
        }),
        v126 = await v124["_buildPayload"]["call"](v125);
      (strict["deepEqual"](
        v126["inputUrls"],
        ["/data/uploads/target.png", "/data/uploads/source.png"],
        v120,
      ),
        strict["equal"](v126["resolvedRatioLabel"], "9:16", v120),
        strict["equal"](v126["adaptiveSource"], "input-media", v120));
    }
  }),
  test("aigenImage task orchestration: GRSAI 有参考图+自适应时透传 API auto", async () => {
    const v127 = "node-ai-image-1",
      v128 = "node-ref-image-1",
      { proto: v129, ctx: v130 } = createTestContext({
        targetId: v127,
        nodeData: {
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          [v128]: {
            id: v128,
            type: "source-image",
            imageUrl: "https://img.example.com/ref.png",
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [
          { id: "edge-1", sourceId: v128, targetId: v127, refSlot: "" },
        ],
      }),
      v131 = await v129["_buildPayload"]["call"](v130);
    (strict["equal"](v131["aspectRatio"], "auto"),
      strict["equal"](v131["suppressAspectRatio"], undefined),
      strict["equal"](v131["resolvedRatioLabel"], "auto"),
      strict["equal"](v131["adaptiveSource"], "input-media"),
      strict["equal"](v131["ratioCapability"], "aspectRatio"),
      strict["deepEqual"](v131["inputUrls"], [
        "https://img.example.com/ref.png",
      ]));
  }),
  test("aigenImage task orchestration: source-image 生成入参优先使用原图本地路径", async () => {
    const v132 = "node-ai-image-source-original-first",
      v133 = "node-ref-image-source-original-first",
      { proto: v134, ctx: v135 } = createTestContext({
        targetId: v132,
        nodeData: {
          id: v132,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          [v133]: {
            id: v133,
            type: "source-image",
            originalLocalPath: "data/uploads/original.png",
            displayLocalPath: "data/uploads/display.webp",
            thumbLocalPath: "data/uploads/thumb.webp",
            thumbUrl: "https://img.example.com/thumb.png",
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [
          {
            id: "edge-source-original-first",
            sourceId: v133,
            targetId: v132,
            refSlot: "",
          },
        ],
      }),
      v136 = await v134["_buildPayload"]["call"](v135);
    strict["deepEqual"](v136["inputUrls"], ["/data/uploads/original.png"]);
  }),
  test("aigenImage task orchestration: ai-image 生成入参优先使用主图原图本地路径", async () => {
    const v137 = "node-ai-image-ai-original-first",
      v138 = "node-ref-ai-image-original-first",
      { proto: v139, ctx: v140 } = createTestContext({
        targetId: v137,
        nodeData: {
          id: v137,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          [v138]: {
            id: v138,
            type: "ai-image",
            mainImageIndex: 1,
            localPath: "data/uploads/node-local.png",
            sourceUrl: "https://img.example.com/node-source.png",
            thumbUrl: "https://img.example.com/node-thumb.png",
            images: [
              { originalLocalPath: "data/uploads/other-original.png" },
              {
                originalLocalPath: "data/uploads/main-original.png",
                localPath: "data/uploads/main-local.png",
                sourceUrl: "https://img.example.com/main-source.png",
                thumbUrl: "https://img.example.com/main-thumb.png",
              },
            ],
            width: 1200,
            height: 1200,
          },
        },
        incomingEdges: [
          {
            id: "edge-ai-original-first",
            sourceId: v138,
            targetId: v137,
            refSlot: "",
          },
        ],
      }),
      v141 = await v139["_buildPayload"]["call"](v140);
    strict["deepEqual"](v141["inputUrls"], ["/data/uploads/main-original.png"]);
  }),
  test("aigenImage task orchestration: PPIO 有参考图+自适应时不设置 suppressAspectRatio", async () => {
    const v142 = "node-ai-image-2",
      v143 = "node-ref-image-2",
      { proto: v144, ctx: v145 } = createTestContext({
        targetId: v142,
        nodeData: {
          model: "ppio/seedream-5.0-lite",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          [v143]: {
            id: v143,
            type: "source-image",
            imageUrl: "https://img.example.com/ref-ppio.png",
            width: 1080,
            height: 1350,
          },
        },
        incomingEdges: [
          { id: "edge-2", sourceId: v143, targetId: v142, refSlot: "" },
        ],
      }),
      v146 = await v144["_buildPayload"]["call"](v145),
      v147 = await v144["_buildResumePayload"]["call"](v145, v145["_data"]);
    (strict["equal"](v146["aspectRatio"], "4:5"),
      strict["equal"](v146["suppressAspectRatio"], undefined),
      strict["equal"](v146["provider"], "ppio"),
      strict["equal"](v147["provider"], "ppio"),
      strict["deepEqual"](v146["inputUrls"], [
        "https://img.example.com/ref-ppio.png",
      ]));
  }),
  test("aigenImage task orchestration: grsai 有入参时自适应保持 API auto", async () => {
    const v148 = "node-ai-image-grsai-input-first",
      v149 = "node-ref-image-grsai-input-first",
      { proto: v150, ctx: v151 } = createTestContext({
        targetId: v148,
        nodeData: {
          id: v148,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
          width: 900,
          height: 900,
        },
        nodes: {
          [v149]: {
            id: v149,
            type: "source-image",
            imageUrl: "https://img.example.com/ref-grsai-169.png",
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [
          {
            id: "edge-grsai-input-first",
            sourceId: v149,
            targetId: v148,
            refSlot: "",
          },
        ],
      }),
      v152 = await v150["_buildPayload"]["call"](v151);
    (strict["equal"](v152["provider"], "grsai"),
      strict["equal"](v152["aspectRatio"], "auto"),
      strict["equal"](v152["resolvedRatioLabel"], "auto"),
      strict["equal"](v152["adaptiveSource"], "input-media"));
  }),
  test("aigenImage task orchestration: GRSAI 未设置 aspectRatio 时默认 API auto", async () => {
    const v153 = "node-ai-image-default-adaptive",
      { proto: v154, ctx: v155 } = createTestContext({
        targetId: v153,
        nodeData: {
          id: v153,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          imageSize: "2K",
          batchSize: 1,
          width: 1600,
          height: 900,
        },
        incomingEdges: [],
      }),
      v156 = await v154["_buildPayload"]["call"](v155);
    (strict["equal"](v156["aspectRatio"], "auto"),
      strict["equal"](v156["resolvedRatioLabel"], "auto"),
      strict["equal"](v156["adaptiveSource"], "display"));
  }),
  test("aigenImage task orchestration: 自适应无图像入参时使用显示区域比例映射", async () => {
    const v157 = "node-ai-image-3",
      v158 = "node-ref-text-3",
      { proto: v159, ctx: v160 } = createTestContext({
        targetId: v157,
        nodeData: {
          id: v157,
          model: "ppio/seedream-5.0-lite",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
          width: 1700,
          height: 900,
        },
        nodes: {
          [v158]: {
            id: v158,
            type: "source-text",
            text: "hello",
            width: 2100,
            height: 300,
          },
        },
        incomingEdges: [
          { id: "edge-3", sourceId: v158, targetId: v157, refSlot: "" },
        ],
      }),
      v161 = await v159["_buildPayload"]["call"](v160);
    (strict["equal"](v161["aspectRatio"], "16:9"),
      strict["equal"](v161["adaptiveSource"], "display"),
      strict["equal"](v161["resolvedRatioLabel"], "16:9"));
  }),
  test("aigenImage task orchestration: ai-text 入参无输出时使用 prompt 作为文本内容", async () => {
    const v162 = "node-ai-image-text-prompt-ref",
      v163 = "node-ai-text-prompt-ref",
      { proto: v164, ctx: v165 } = createTestContext({
        targetId: v162,
        nodeData: {
          id: v162,
          model: "ppio/seedream-5.0-lite",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          [v163]: {
            id: v163,
            type: "ai-text",
            prompt: "来自生成文本节点的提示词",
          },
        },
        incomingEdges: [
          {
            id: "edge-ai-image-text-prompt",
            sourceId: v163,
            targetId: v162,
            refSlot: "",
          },
        ],
        promptText: "主体画面",
      }),
      v166 = await v164["_buildPayload"]["call"](v165);
    (strict["equal"](v166["prompt"], "来自生成文本节点的提示词\n主体画面"),
      strict["deepEqual"](v166["inputUrls"], []));
  }),
  test("aigenImage task orchestration: Dreamina 自适应 + 16:9 入参图透传 16:9", async () => {
    const v167 = "node-ai-image-dreamina-1",
      v168 = "node-ref-image-dreamina-1",
      { proto: v169, ctx: v170 } = createTestContext({
        targetId: v167,
        nodeData: {
          model: "dreamina/5.0",
          provider: "dreamina",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          [v168]: {
            id: v168,
            type: "source-image",
            imageUrl: "https://img.example.com/dreamina-169.png",
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [
          {
            id: "edge-dreamina-1",
            sourceId: v168,
            targetId: v167,
            refSlot: "",
          },
        ],
      }),
      v171 = await v169["_buildPayload"]["call"](v170);
    (strict["equal"](v171["provider"], "dreamina"),
      strict["equal"](v171["aspectRatio"], "16:9"));
  }),
  test("aigenImage task orchestration: 自适应入参优先使用真实媒体尺寸", async () => {
    const v172 = "node-ai-image-real-media-size",
      v173 = "node-ref-image-real-media-size",
      { proto: v174, ctx: v175 } = createTestContext({
        targetId: v172,
        nodeData: {
          model: "dreamina/5.0",
          provider: "dreamina",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
          width: 1600,
          height: 900,
        },
        nodes: {
          [v173]: {
            id: v173,
            type: "source-image",
            imageUrl: "https://img.example.com/portrait-real.png",
            width: 1600,
            height: 900,
            imageWidth: 900,
            imageHeight: 1600,
          },
        },
        incomingEdges: [
          {
            id: "edge-real-media-size",
            sourceId: v173,
            targetId: v172,
            refSlot: "",
          },
        ],
      }),
      v176 = await v174["_buildPayload"]["call"](v175);
    (strict["equal"](v176["provider"], "dreamina"),
      strict["equal"](v176["aspectRatio"], "9:16"),
      strict["equal"](v176["resolvedRatioLabel"], "9:16"),
      strict["equal"](v176["adaptiveSource"], "input-media"));
  }),
  test("aigenImage\x20task\x20orchestration:\x20Dreamina\x20生成入参保留原图本地路径", async () => {
    const v177 = "node-ai-image-dreamina-original-first",
      v178 = "node-ref-image-dreamina-original-first",
      { proto: v179, ctx: v180 } = createTestContext({
        targetId: v177,
        nodeData: {
          id: v177,
          model: "dreamina/5.0",
          provider: "dreamina",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          [v178]: {
            id: v178,
            type: "source-image",
            originalLocalPath: "data/uploads/dreamina-original.png",
            displayLocalPath: "data/uploads/dreamina-display.webp",
            thumbLocalPath: "data/uploads/dreamina-thumb.webp",
            thumbUrl: "https://img.example.com/dreamina-thumb.png",
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [
          {
            id: "edge-dreamina-original-first",
            sourceId: v178,
            targetId: v177,
            refSlot: "",
          },
        ],
      }),
      v181 = await v179["_buildPayload"]["call"](v180);
    (strict["equal"](v181["provider"], "dreamina"),
      strict["deepEqual"](v181["inputUrls"], [
        "/data/uploads/dreamina-original.png",
      ]));
  }),
  test("aigenImage\x20task\x20orchestration:\x20Dreamina\x20自适应\x20+\x20非标准比例映射最近支持比例", async () => {
    const v182 = "node-ai-image-dreamina-2",
      v183 = "node-ref-image-dreamina-2",
      { proto: v184, ctx: v185 } = createTestContext({
        targetId: v182,
        nodeData: {
          model: "dreamina/4.5",
          provider: "dreamina",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          [v183]: {
            id: v183,
            type: "source-image",
            imageUrl: "https://img.example.com/dreamina-non-standard.png",
            width: 1250,
            height: 1000,
          },
        },
        incomingEdges: [
          {
            id: "edge-dreamina-2",
            sourceId: v183,
            targetId: v182,
            refSlot: "",
          },
        ],
      }),
      v186 = await v184["_buildPayload"]["call"](v185);
    (strict["equal"](v186["provider"], "dreamina"),
      strict["equal"](v186["aspectRatio"], "4:3"));
  }),
  test("aigenImage task orchestration: Dreamina 自适应 + 无图像入参时 fallback 为 1:1", async () => {
    const v187 = "node-ai-image-dreamina-3",
      { proto: v188, ctx: v189 } = createTestContext({
        targetId: v187,
        nodeData: {
          model: "dreamina/4.1",
          provider: "dreamina",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {},
        incomingEdges: [],
      }),
      v190 = await v188["_buildPayload"]["call"](v189);
    (strict["equal"](v190["provider"], "dreamina"),
      strict["equal"](v190["aspectRatio"], "1:1"));
  }),
  test("aigenImage task orchestration: 无入参时自适应优先使用显示区域比例", async () => {
    const v191 = "node-ai-image-display-ratio",
      { proto: v192, ctx: v193 } = createTestContext({
        targetId: v191,
        nodeData: {
          id: v191,
          model: "dreamina/5.0",
          provider: "dreamina",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
          width: 1500,
          height: 900,
        },
        incomingEdges: [],
      }),
      v194 = await v192["_buildPayload"]["call"](v193);
    (strict["equal"](v194["aspectRatio"], "16:9"),
      strict["equal"](v194["adaptiveSource"], "display"),
      strict["equal"](v194["resolvedRatioLabel"], "16:9"));
  }),
  test("aigenImage\x20task\x20orchestration:\x20async\x20pending\x20且无\x20taskId\x20时触发兜底重提", async () => {
    const v195 = "node-ai-image-fallback-1",
      { proto: v196, ctx: v197 } = createTestContext({
        targetId: v195,
        nodeData: {
          model: "ppio/seedream-4.0",
          provider: "ppio",
          asyncTaskProvider: "ppio",
          asyncTaskKind: "image",
          asyncTaskStatus: "pending",
          asyncTaskId: "",
          generationStartTime: Date["now"]() - 800,
          generationDuration: null,
          images: [],
        },
      });
    let v198 = 0;
    ((v197["_onGenerate"] = async () => {
      v198 += 1;
    }),
      (v197["_stopAsyncRecovery"] = () => {}),
      (v197["_isGenerating"] = false),
      await v196["_maybeResumeAsyncTaskImpl"]["call"](v197),
      strict["equal"](v198, 1));
  }),
  test("aigenImage task orchestration: async pending 且无 taskId 但已有结果时不触发重提", async () => {
    const v199 = "node-ai-image-fallback-2",
      { proto: v200, ctx: v201 } = createTestContext({
        targetId: v199,
        nodeData: {
          model: "ppio/seedream-4.0",
          provider: "ppio",
          asyncTaskProvider: "ppio",
          asyncTaskKind: "image",
          asyncTaskStatus: "pending",
          asyncTaskId: "",
          generationStartTime: Date["now"]() - 800,
          generationDuration: null,
          imageUrl: "/output/ok.png",
          images: [{ imageUrl: "/output/ok.png" }],
        },
      });
    let v202 = 0,
      v203 = 0;
    ((v201["_onGenerate"] = async () => {
      v202 += 1;
    }),
      (v201["_stopAsyncRecovery"] = () => {
        v203 += 1;
      }),
      (v201["_isGenerating"] = false),
      await v200["_maybeResumeAsyncTaskImpl"]["call"](v201),
      strict["equal"](v202, 0),
      strict["equal"](v203, 1));
  }),
  test("aigenImage\x20task\x20orchestration:\x20RunningHub\x20recovery\x20writes\x20terminal\x20state\x20through\x20runtime", async () => {
    const v204 = "node-ai-image-rh-runtime-recovery",
      v205 = Date["now"]() - 60000,
      {
        proto: v206,
        ctx: v207,
        state: v208,
      } = createTestContext({
        targetId: v204,
        nodeData: {
          id: v204,
          model: "runninghub/1994718111704158209",
          provider: "runninghubwf",
          rhTaskId: "rh-image-resume-success",
          rhTaskStatus: "running",
          rhTaskStartedAt: v205,
          rhTaskUseOpenapiQuery: true,
          generationStartTime: v205,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        isRunninghubWorkflowModelImpl: () => true,
        apiImpl: {
          resumeRunningHubImageTask: async (v209, v210, v211) => {
            return (
              strict["equal"](v209, "rh-image-resume-success"),
              strict["equal"](v210["provider"], "runninghubwf"),
              strict["equal"](v211["useOpenapiQuery"], true),
              {
                images: [
                  {
                    imageUrl: "/output/resumed.png",
                    thumbUrl: "/output/resumed-thumb.png",
                    localPath: "output/resumed.png",
                  },
                ],
              }
            );
          },
        },
      });
    ((v207["_isGenerating"] = false),
      (v207["_buildResumePayload"] = async () => ({
        model: "runninghub/1994718111704158209",
        provider: "runninghubwf",
        apiKey: "k_rh",
      })),
      (v207["_persistRunningHubResumeCache"] = () => {}),
      (v207["_updateSubmitButtonState"] = () => {}),
      await v206["_maybeResumeRunningHubTaskImpl"]["call"](v207));
    v207["_rhResumePromise"] && (await v207["_rhResumePromise"]);
    const v212 = v208["nodes"][v204];
    (strict["equal"](v212["isGenerating"], false),
      strict["equal"](v212["jobStatus"], "success"),
      strict["equal"](v212["rhTaskId"], "rh-image-resume-success"),
      strict["equal"](v212["rhTaskStatus"], "success"),
      strict["equal"](v212["rhTaskRecovering"], false),
      strict["equal"](v212["imageUrl"], "/output/resumed.png"),
      strict["equal"](v212["thumbUrl"], "/output/resumed-thumb.png"),
      strict["equal"](v212["localPath"], "output/resumed.png"));
  }),
  test("aigenImage task orchestration: async recovery writes terminal state through runtime", async () => {
    const v213 = "node-ai-image-async-runtime-recovery",
      v214 = Date["now"]() - 60000;
    let v215 = 0;
    const {
      proto: v216,
      ctx: v217,
      state: v218,
    } = createTestContext({
      targetId: v213,
      nodeData: {
        id: v213,
        model: "ppio/seedream-4.0",
        provider: "ppio",
        asyncTaskProvider: "ppio",
        asyncTaskKind: "image",
        asyncTaskId: "async-image-resume-success",
        asyncTaskStatus: "running",
        asyncTaskStartedAt: v214,
        generationStartTime: v214,
        generationDuration: null,
        isGenerating: true,
        images: [],
      },
      apiImpl: {
        resumeAsyncImageTask: async (v219, v220, v221) => {
          return (
            (v215 += 1),
            strict["equal"](v219, "async-image-resume-success"),
            strict["equal"](v220["provider"], "ppio"),
            strict["ok"](v221?.["signal"]),
            {
              images: [
                {
                  imageUrl: "/output/async-resumed.png",
                  thumbUrl: "/output/async-resumed-thumb.png",
                  localPath: "output/async-resumed.png",
                },
              ],
            }
          );
        },
      },
    });
    ((v217["_isGenerating"] = false),
      (v217["_buildResumePayload"] = async () => ({
        model: "ppio/seedream-4.0",
        provider: "ppio",
        apiKey: "k_ppio",
      })),
      (v217["_persistAsyncResumeCache"] = () => {}),
      (v217["_updateSubmitButtonState"] = () => {}),
      await v216["_maybeResumeAsyncTaskImpl"]["call"](v217));
    v217["_asyncResumePromise"] && (await v217["_asyncResumePromise"]);
    const v222 = v218["nodes"][v213];
    (strict["equal"](v215, 1),
      strict["equal"](v222["isGenerating"], false),
      strict["equal"](v222["jobStatus"], "success"),
      strict["equal"](v222["asyncTaskId"], "async-image-resume-success"),
      strict["equal"](v222["asyncTaskStatus"], "success"),
      strict["equal"](v222["asyncTaskProvider"], "ppio"),
      strict["equal"](v222["asyncTaskKind"], "image"),
      strict["equal"](v222["asyncTaskRecovering"], false),
      strict["equal"](v222["imageUrl"], "/output/async-resumed.png"),
      strict["equal"](v222["thumbUrl"], "/output/async-resumed-thumb.png"),
      strict["equal"](v222["localPath"], "output/async-resumed.png"));
  }),
  test("aigenImage task orchestration: async recovery local abort keeps timer running", async () => {
    const v223 = "node-ai-image-async-runtime-pause",
      v224 = Date["now"]() - 60000;
    let v225 = null;
    const {
      proto: v226,
      ctx: v227,
      state: v228,
    } = createTestContext({
      targetId: v223,
      nodeData: {
        id: v223,
        model: "ppio/seedream-4.0",
        provider: "ppio",
        asyncTaskProvider: "ppio",
        asyncTaskKind: "image",
        asyncTaskId: "async-image-resume-pause",
        asyncTaskStatus: "running",
        asyncTaskStartedAt: v224,
        generationStartTime: v224,
        generationDuration: null,
        isGenerating: true,
        images: [],
      },
      apiImpl: {
        resumeAsyncImageTask: async (v229, v230, v231) =>
          new Promise((v232, v233) => {
            ((v225 = v231?.["signal"] || null),
              v225?.["addEventListener"]?.("abort", () => {
                const v234 = new Error("CANCELLED");
                ((v234["name"] = "AbortError"), v233(v234));
              }));
          }),
      },
    });
    ((v227["_isGenerating"] = false),
      (v227["_buildResumePayload"] = async () => ({
        model: "ppio/seedream-4.0",
        provider: "ppio",
        apiKey: "k_ppio",
      })),
      (v227["_persistAsyncResumeCache"] = () => {}),
      (v227["_updateSubmitButtonState"] = () => {}),
      await v226["_maybeResumeAsyncTaskImpl"]["call"](v227));
    for (let v235 = 0; v235 < 5 && !v225; v235 += 1) {
      await new Promise((v236) => setImmediate(v236));
    }
    strict["ok"](v225);
    const v237 = v227["_asyncResumePromise"];
    v227["_stopAsyncRecovery"](false);
    if (v237) await v237;
    const v238 = v228["nodes"][v223];
    (strict["equal"](v238["isGenerating"], true),
      strict["equal"](v238["jobStatus"], "running"),
      strict["equal"](v238["generationStartTime"], v224),
      strict["equal"](v238["generationDuration"], null),
      strict["equal"](v238["asyncTaskId"], "async-image-resume-pause"),
      strict["equal"](v238["asyncTaskStatus"], "running"),
      strict["equal"](v238["asyncTaskRecovering"], false));
  }),
  test("aigenImage task orchestration: Dreamina recovery writes terminal state through runtime", async () => {
    const v239 = "node-ai-image-dreamina-runtime-recovery",
      v240 = Date["now"]() - 60000;
    let v241 = 0;
    const {
      proto: v242,
      ctx: v243,
      state: v244,
    } = createTestContext({
      targetId: v239,
      nodeData: {
        id: v239,
        model: "dreamina/4.1",
        provider: "dreamina",
        dreaminaSubmitId: "sid-dreamina-success",
        dreaminaTaskStatus: "pending",
        dreaminaTaskPhase: "generating",
        dreaminaTaskLabel: "生成中",
        dreaminaTaskStartedAt: v240,
        dreaminaTaskLastCheckedAt: Date["now"]() - 30000,
        dreaminaTaskRecovering: false,
        generationStartTime: v240,
        generationDuration: null,
        isGenerating: true,
        images: [],
      },
      apiImpl: {
        resumeDreaminaImageTask: async (v245, v246, v247) => {
          return (
            (v241 += 1),
            strict["equal"](v245, "sid-dreamina-success"),
            strict["equal"](v246["provider"], "dreamina"),
            strict["ok"](v247?.["signal"]),
            {
              imageUrl: "/output/dreamina-resumed.png",
              thumbUrl: "/output/dreamina-resumed-thumb.png",
              localPath: "output/dreamina-resumed.png",
            }
          );
        },
      },
    });
    ((v243["_isGenerating"] = false),
      (v243["_buildResumePayload"] = async () => ({
        model: "dreamina/4.1",
        provider: "dreamina",
      })),
      (v243["_persistDreaminaResumeCache"] = () => {}),
      (v243["_updateSubmitButtonState"] = () => {}),
      await v242["_maybeResumeDreaminaTaskImpl"]["call"](v243));
    v243["_dreaminaResumePromise"] && (await v243["_dreaminaResumePromise"]);
    const v248 = v244["nodes"][v239];
    (strict["equal"](v241, 1),
      strict["equal"](v248["isGenerating"], false),
      strict["equal"](v248["jobStatus"], "success"),
      strict["equal"](v248["dreaminaSubmitId"], "sid-dreamina-success"),
      strict["equal"](v248["dreaminaTaskStatus"], "success"),
      strict["equal"](v248["dreaminaTaskPhase"], "done"),
      strict["equal"](v248["dreaminaTaskLabel"], "已完成"),
      strict["equal"](v248["dreaminaTaskRecovering"], false),
      strict["equal"](v248["imageUrl"], "/output/dreamina-resumed.png"),
      strict["equal"](v248["thumbUrl"], "/output/dreamina-resumed-thumb.png"),
      strict["equal"](v248["localPath"], "output/dreamina-resumed.png"));
  }),
  test("aigenImage task orchestration: stale Dreamina running task resumes and surfaces fail reason", async () => {
    const v249 = "node-ai-image-dreamina-stale-recovery",
      v250 = Date["now"]() - 60000,
      {
        proto: v251,
        ctx: v252,
        state: v253,
      } = createTestContext({
        targetId: v249,
        nodeData: {
          id: v249,
          model: "dreamina/4.1",
          provider: "dreamina",
          dreaminaSubmitId: "sid-dreamina-fail",
          dreaminaTaskStatus: "pending",
          dreaminaTaskPhase: "generating",
          dreaminaTaskLabel: "生成中",
          dreaminaTaskStartedAt: v250,
          dreaminaTaskLastCheckedAt: Date["now"]() - 30000,
          dreaminaTaskRecovering: false,
          generationStartTime: v250,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        apiImpl: {
          resumeDreaminaImageTask: async (v254) => {
            strict["equal"](v254, "sid-dreamina-fail");
            throw new Error("generation failed: final generation failed");
          },
        },
      });
    ((v252["_isGenerating"] = true),
      (v252["_buildResumePayload"] = async () => ({
        model: "dreamina/4.1",
        provider: "dreamina",
      })),
      (v252["_persistDreaminaResumeCache"] = () => {}),
      (v252["_updateSubmitButtonState"] = () => {}),
      await v251["_maybeResumeDreaminaTaskImpl"]["call"](v252),
      strict["ok"](v252["_dreaminaResumePromise"]),
      await v252["_dreaminaResumePromise"]);
    const v255 = v253["nodes"][v249];
    (strict["equal"](v255["isGenerating"], false),
      strict["equal"](v255["jobStatus"], "error"),
      strict["equal"](
        v255["jobError"],
        "generation failed: final generation failed",
      ),
      strict["equal"](v255["dreaminaTaskStatus"], "failed"),
      strict["equal"](v255["dreaminaTaskPhase"], "failed"),
      strict["equal"](
        v255["dreaminaTaskLabel"],
        "generation failed: final generation failed",
      ),
      strict["equal"](v255["dreaminaTaskRecovering"], false));
  }),
  test("aigenImage task orchestration: persisted Dreamina running task resumes even with fresh lastChecked", async () => {
    const v256 = "node-ai-image-dreamina-persisted-recovery",
      v257 = Date["now"]() - 60000,
      {
        proto: v258,
        ctx: v259,
        state: v260,
      } = createTestContext({
        targetId: v256,
        nodeData: {
          id: v256,
          model: "dreamina/4.1",
          provider: "dreamina",
          dreaminaSubmitId: "sid-dreamina-persisted-fail",
          dreaminaTaskStatus: "pending",
          dreaminaTaskPhase: "syncing",
          dreaminaTaskLabel: "正在同步结果",
          dreaminaTaskStartedAt: v257,
          dreaminaTaskLastCheckedAt: Date["now"](),
          dreaminaTaskRecovering: false,
          generationStartTime: v257,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        apiImpl: {
          resumeDreaminaImageTask: async (v261) => {
            strict["equal"](v261, "sid-dreamina-persisted-fail");
            throw new Error("generation failed: final generation failed");
          },
        },
      });
    ((v259["_isGenerating"] = true),
      (v259["_dreaminaActiveSubmitId"] = ""),
      (v259["_buildResumePayload"] = async () => ({
        model: "dreamina/4.1",
        provider: "dreamina",
      })),
      (v259["_persistDreaminaResumeCache"] = () => {}),
      (v259["_updateSubmitButtonState"] = () => {}),
      await v258["_maybeResumeDreaminaTaskImpl"]["call"](v259),
      strict["ok"](v259["_dreaminaResumePromise"]),
      await v259["_dreaminaResumePromise"]);
    const v262 = v260["nodes"][v256];
    (strict["equal"](v262["isGenerating"], false),
      strict["equal"](v262["jobStatus"], "error"),
      strict["equal"](v262["dreaminaTaskStatus"], "failed"),
      strict["equal"](v262["dreaminaTaskPhase"], "failed"));
  }),
  test("aigenImage task orchestration: Dreamina recovery does not abort itself on reentrant state update", async () => {
    const v263 = "node-ai-image-dreamina-reentrant-recovery",
      v264 = Date["now"]() - 60000,
      {
        proto: v265,
        ctx: v266,
        state: v267,
        store: v268,
      } = createTestContext({
        targetId: v263,
        nodeData: {
          id: v263,
          model: "dreamina/4.1",
          provider: "dreamina",
          dreaminaSubmitId: "sid-dreamina-reentrant-fail",
          dreaminaTaskStatus: "pending",
          dreaminaTaskPhase: "generating",
          dreaminaTaskLabel: "生成中",
          dreaminaTaskStartedAt: v264,
          dreaminaTaskLastCheckedAt: Date["now"]() - 30000,
          dreaminaTaskRecovering: false,
          generationStartTime: v264,
          generationDuration: null,
          isGenerating: true,
          images: [],
        },
        apiImpl: {
          resumeDreaminaImageTask: async (v269) => {
            (strict["equal"](v269, "sid-dreamina-reentrant-fail"),
              await Promise["resolve"]());
            throw new Error("generation failed: final generation failed");
          },
        },
      });
    ((v266["_isGenerating"] = true),
      (v266["_buildResumePayload"] = async () => ({
        model: "dreamina/4.1",
        provider: "dreamina",
      })),
      (v266["_persistDreaminaResumeCache"] = () => {}),
      (v266["_updateSubmitButtonState"] = () => {}));
    const v270 = v268["updateNodeData"]["bind"](v268);
    let v271 = false;
    ((v268["updateNodeData"] = (v272, v273) => {
      (v270(v272, v273),
        !v271 &&
          v273?.["dreaminaTaskRecovering"] === true &&
          ((v271 = true),
          void v265["_maybeResumeDreaminaTaskImpl"]["call"](v266)));
    }),
      await v265["_maybeResumeDreaminaTaskImpl"]["call"](v266),
      await v266["_dreaminaResumePromise"]);
    const v274 = v267["nodes"][v263];
    (strict["equal"](v271, true),
      strict["equal"](v274["isGenerating"], false),
      strict["equal"](v274["jobStatus"], "error"),
      strict["equal"](v274["dreaminaTaskStatus"], "failed"),
      strict["equal"](v274["dreaminaTaskRecovering"], false));
  }),
  test("aigenImage task orchestration: Dreamina failed progress finalizes and stops loading", async () => {
    const v275 = "node-ai-image-dreamina-progress-fail",
      v276 = {};
    let v277 = 0,
      v278 = 0;
    const {
      proto: v279,
      ctx: v280,
      state: v281,
    } = createTestContext({
      targetId: v275,
      nodeData: {
        id: v275,
        model: "dreamina/4.1",
        provider: "dreamina",
        aspectRatio: "1:1",
        imageSize: "2K",
        batchSize: 1,
      },
      apiImpl: {
        generateImage: async (v282, v283 = {}) => {
          (v283["onTaskMeta"]?.({ taskId: "sid-dreamina-progress-fail" }),
            v283["onProgress"]?.({
              submitId: "sid-dreamina-progress-fail",
              status: "failed",
              phase: "failed",
              label: "policy rejected",
              failReason: "policy\x20rejected",
              raw: { status: "failed" },
            }));
          const v284 = v281["nodes"][v275];
          (strict["equal"](v284["isGenerating"], false),
            strict["equal"](v284["jobStatus"], "error"),
            strict["equal"](v284["jobError"], "policy rejected"),
            strict["equal"](v284["dreaminaTaskStatus"], "failed"),
            strict["equal"](v284["dreaminaTaskPhase"], "failed"),
            strict["equal"](v278, 1));
          throw new Error("policy rejected");
        },
      },
      startLoadingImpl: (v285) => {
        (strict["equal"](v285, v276), (v277 += 1));
      },
      stopLoadingImpl: (v286) => {
        (strict["equal"](v286, v276), (v278 += 1));
      },
    });
    ((v280["previewEl"] = v276),
      (v280["btnEl"] = createButtonStub()),
      (v280["_updateSubmitButtonState"] = () => {}),
      await v279["_onGenerate"]["call"](v280));
    const v287 = v281["nodes"][v275];
    (strict["equal"](v277, 1),
      strict["ok"](v278 >= 1),
      strict["equal"](v280["_isGenerating"], false),
      strict["equal"](
        v280["btnEl"]["classList"]["contains"]("is-rh-busy"),
        false,
      ),
      strict["doesNotMatch"](v280["btnEl"]["innerHTML"], /animation:spin/),
      strict["equal"](v287["isGenerating"], false),
      strict["equal"](v287["jobStatus"], "error"),
      strict["equal"](v287["jobError"], "policy rejected"),
      strict["equal"](v287["dreaminaTaskRecovering"], false),
      strict["ok"](Number(v287["generationDuration"]) >= 0),
      strict["equal"](v287["images"]?.[0]?.["error"], "policy rejected"),
      strict["equal"](v287["mainImageIndex"], 0),
      strict["equal"](v287["imageUrl"], ""));
  }),
  test("aigenImage task orchestration: APIMart 错误结果会结束加载并标记失败", async () => {
    const v288 = "node-ai-image-apimart-error",
      {
        proto: v289,
        ctx: v290,
        state: v291,
      } = createTestContext({
        targetId: v288,
        nodeData: {
          id: v288,
          model: "apimart/nano-banana-2",
          provider: "apimart",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => [
            {
              error: "APIMart 任务报错：找不到任务 id",
              imageUrl: "",
              thumbUrl: "",
            },
          ],
        },
      });
    await v289["_onGenerate"]["call"](v290);
    const v292 = v291["nodes"][v288];
    (strict["equal"](v292["isGenerating"], false),
      strict["equal"](v292["jobStatus"], "error"),
      strict["equal"](
        v292["jobError"],
        "APIMart\x20任务报错：找不到任务\x20id",
      ),
      strict["equal"](v292["asyncTaskStatus"], "failed"),
      strict["equal"](
        v292["images"]?.[0]?.["error"],
        "APIMart 任务报错：找不到任务 id",
      ));
  }),
  test("aigenImage task orchestration: Volcengine 直连生成不伪装成异步任务", async () => {
    const v293 = "node-ai-image-volcengine-loading",
      v294 = {};
    let v295 = 0;
    const {
      proto: v296,
      ctx: v297,
      state: v298,
    } = createTestContext({
      targetId: v293,
      nodeData: {
        id: v293,
        model: "volcengine/seedream-4.0",
        provider: "volcengine",
        aspectRatio: "1:1",
        imageSize: "2K",
        batchSize: 1,
      },
      apiImpl: {
        generateImage: async (v299, v300 = {}) => {
          strict["equal"](Boolean(v300["signal"]), false);
          const v301 = v298["nodes"][v293];
          return (
            strict["equal"](v301["isGenerating"], true),
            strict["equal"](v301["jobStatus"], "running"),
            strict["equal"](v301["asyncTaskProvider"], ""),
            strict["equal"](v301["asyncTaskStatus"], "idle"),
            v300["onTaskMeta"]?.({
              taskId: "ark-direct-response-1",
              provider: "volcengine",
              kind: "image",
            }),
            {
              imageUrl: "/output/volcengine.png",
              sourceUrl: "https://ark.example.com/volcengine.png",
              thumbUrl: "/output/volcengine.png",
            }
          );
        },
      },
      startLoadingImpl: (v302) => {
        (strict["equal"](v302, v294), (v295 += 1));
      },
    });
    ((v297["previewEl"] = v294),
      (v297["btnEl"] = createButtonStub()),
      (v297["_updateSubmitButtonState"] = () => {}),
      await v296["_onGenerate"]["call"](v297));
    const v303 = v298["nodes"][v293];
    (strict["equal"](v295, 1),
      strict["equal"](v303["isGenerating"], false),
      strict["equal"](v303["jobStatus"], "success"),
      strict["equal"](v303["asyncTaskProvider"], ""),
      strict["equal"](v303["asyncTaskKind"], "image"),
      strict["equal"](v303["asyncTaskStatus"], "idle"),
      strict["equal"](v303["imageUrl"], "/output/volcengine.png"));
  }),
  test("aigenImage task orchestration: Volcengine 缺少 API Key 时生成前拦截", async () => {
    const v304 = "node-ai-image-volcengine-missing-key",
      v305 = {},
      v306 = globalThis["window"]["showToast"],
      v307 = [];
    let v308 = 0,
      v309 = 0;
    try {
      globalThis["window"]["showToast"] = (v310, v311) => {
        v307["push"]({ message: v310, type: v311 });
      };
      const {
        proto: v312,
        ctx: v313,
        state: v314,
      } = createTestContext({
        targetId: v304,
        nodeData: {
          id: v304,
          model: "volcengine/seedream-4.0",
          provider: "volcengine",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        promptText: "cat",
        getProviderConfigImpl: () => ({ apiKey: "" }),
        apiImpl: {
          generateImage: async () => {
            return ((v308 += 1), { imageUrl: "/output/should-not-run.png" });
          },
        },
        startLoadingImpl: (v315) => {
          (strict["equal"](v315, v305), (v309 += 1));
        },
      });
      ((v313["previewEl"] = v305),
        (v313["btnEl"] = createButtonStub()),
        await v312["_onGenerate"]["call"](v313));
      const v316 = v314["nodes"][v304];
      (strict["equal"](v308, 0),
        strict["equal"](v309, 0),
        strict["equal"](v316["isGenerating"], undefined),
        strict["deepEqual"](v307, [
          { message: "请先在设置里填写火山方舟 API Key", type: "warn" },
        ]));
    } finally {
      globalThis["window"]["showToast"] = v306;
    }
  }),
  test("aigenImage task orchestration: manifest modelApi reads ordinary params from generationParams", async () => {
    const v317 = "node-ai-image-apimart-manifest-params",
      { proto: v318, ctx: v319 } = createTestContext({
        targetId: v317,
        nodeData: {
          id: v317,
          model: "apimart/nano-banana-2",
          provider: "apimart",
          aspectRatio: "16:9",
          imageSize: "2K",
          generationParams: {
            mode: "official",
            aspectRatio: "1:8",
            imageSize: "4K",
            google_search: false,
            google_image_search: true,
            batchSize: 2,
          },
          batchSize: 4,
        },
        promptText: "manifest\x20params",
      }),
      v320 = await v318["_buildPayload"]["call"](v319);
    (strict["equal"](v320["model"], "apimart/nano-banana-2"),
      strict["equal"](v320["provider"], "apimart"),
      strict["equal"](v320["mode"], "official"),
      strict["equal"](v320["imageSize"], "4K"),
      strict["equal"](v320["aspectRatio"], "1:8"),
      strict["equal"](v320["google_search"], true),
      strict["equal"](v320["google_image_search"], true),
      strict["equal"](v320["batchSize"], 2));
  }),
  test("aigenImage task orchestration: API throw 会结束加载并标记失败", async () => {
    const v321 = "node-ai-image-throw-error",
      {
        proto: v322,
        ctx: v323,
        state: v324,
      } = createTestContext({
        targetId: v321,
        nodeData: {
          id: v321,
          model: "ppio/seedream-5.0-lite",
          provider: "ppio",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => {
            throw new Error("PPIO 创建任务失败");
          },
        },
      });
    await v322["_onGenerate"]["call"](v323);
    const v325 = v324["nodes"][v321];
    (strict["equal"](v325["isGenerating"], false),
      strict["equal"](v325["jobStatus"], "error"),
      strict["equal"](v325["jobError"], "PPIO 创建任务失败"),
      strict["equal"](v325["asyncTaskStatus"], "failed"),
      strict["equal"](v325["images"]?.[0]?.["error"], "PPIO 创建任务失败"),
      strict["equal"](v325["mainImageIndex"], 0),
      strict["equal"](v325["imageUrl"], ""));
  }),
  test("aigenImage task orchestration: API 返回单个错误对象会结束加载并标记失败", async () => {
    const v326 = "node-ai-image-object-error",
      {
        proto: v327,
        ctx: v328,
        state: v329,
      } = createTestContext({
        targetId: v326,
        nodeData: {
          id: v326,
          model: "nano-banana",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => ({
            error: "GRSAI\x20无法解析图片地址",
            imageUrl: "",
            thumbUrl: "",
          }),
        },
      });
    await v327["_onGenerate"]["call"](v328);
    const v330 = v329["nodes"][v326];
    (strict["equal"](v330["isGenerating"], false),
      strict["equal"](v330["jobStatus"], "error"),
      strict["equal"](v330["jobError"], "GRSAI 无法解析图片地址"),
      strict["equal"](v330["asyncTaskStatus"], "failed"));
  }),
  test("aigenImage\x20task\x20orchestration:\x20缺少\x20taskId\x20错误会结束加载并标记失败", async () => {
    const v331 = "node-ai-image-missing-task-id",
      {
        proto: v332,
        ctx: v333,
        state: v334,
      } = createTestContext({
        targetId: v331,
        nodeData: {
          id: v331,
          model: "apimart/nano-banana-2",
          provider: "apimart",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => {
            throw new Error("缺少异步图片任务ID，无法恢复");
          },
        },
      });
    await v332["_onGenerate"]["call"](v333);
    const v335 = v334["nodes"][v331];
    (strict["equal"](v335["isGenerating"], false),
      strict["equal"](v335["jobStatus"], "error"),
      strict["equal"](v335["jobError"], "缺少异步图片任务ID，无法恢复"),
      strict["equal"](v335["asyncTaskStatus"], "failed"));
  }),
  test("aigenImage task orchestration: 成功结果会结束加载并标记成功", async () => {
    const v336 = "node-ai-image-success",
      {
        proto: v337,
        ctx: v338,
        state: v339,
      } = createTestContext({
        targetId: v336,
        nodeData: {
          id: v336,
          model: "nano-banana-pro-vt",
          provider: "grsai",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        apiImpl: {
          generateImage: async () => ({
            imageUrl: "/output/success.png",
            sourceUrl: "https://img.example.com/success.png",
            thumbUrl: "/output/success.png",
          }),
        },
      });
    await v337["_onGenerate"]["call"](v338);
    const v340 = v339["nodes"][v336];
    (strict["equal"](v340["isGenerating"], false),
      strict["equal"](v340["jobStatus"], "success"),
      strict["equal"](v340["jobError"], null),
      strict["equal"](v340["asyncTaskStatus"], "success"),
      strict["equal"](v340["imageUrl"], "/output/success.png"));
  }),
  test("aigenImage\x20task\x20orchestration:\x20GRSAI\x20direct\x20success\x20unlocks\x20repeated\x20generation", async () => {
    const v341 = "node-ai-image-grsai-repeat-success",
      v342 = {};
    let v343 = 0,
      v344 = 0,
      v345 = 0;
    const {
      proto: v346,
      ctx: v347,
      state: v348,
    } = createTestContext({
      targetId: v341,
      nodeData: {
        id: v341,
        model: "nano-banana-2",
        provider: "grsai",
        aspectRatio: "1:1",
        imageSize: "2K",
        batchSize: 1,
      },
      promptText: "repeatable prompt",
      apiImpl: {
        generateImage: async (v349, v350 = {}) => {
          return (
            (v343 += 1),
            v350["onTaskMeta"]?.({
              taskId: "grsai-direct-" + v343,
              provider: "grsai",
            }),
            {
              imageUrl: "/output/grsai-direct-" + v343 + ".png",
              sourceUrl:
                "https://img.example.com/grsai-direct-" + v343 + ".png",
              thumbUrl: "/output/grsai-direct-" + v343 + ".png",
            }
          );
        },
      },
      startLoadingImpl: (v351) => {
        (strict["equal"](v351, v342), (v344 += 1));
      },
      stopLoadingImpl: (v352) => {
        (strict["equal"](v352, v342), (v345 += 1));
      },
    });
    ((v347["previewEl"] = v342),
      (v347["btnEl"] = createButtonStub()),
      await v346["_onGenerate"]["call"](v347),
      strict["equal"](v347["_isGenerating"], false),
      strict["equal"](v347["btnEl"]["disabled"], false),
      strict["doesNotMatch"](v347["btnEl"]["innerHTML"], /animation:spin/),
      await v346["_onGenerate"]["call"](v347));
    const v353 = v348["nodes"][v341];
    (strict["equal"](v343, 2),
      strict["equal"](v344, 2),
      strict["equal"](v345, 2),
      strict["equal"](v347["_isGenerating"], false),
      strict["equal"](v347["btnEl"]["disabled"], false),
      strict["equal"](v353["isGenerating"], false),
      strict["equal"](v353["jobStatus"], "success"),
      strict["equal"](v353["asyncTaskId"], "grsai-direct-2"),
      strict["equal"](v353["asyncTaskStatus"], "success"),
      strict["equal"](v353["imageUrl"], "/output/grsai-direct-2.png"));
  }),
  test("aigenImage\x20task\x20orchestration:\x20RunningHub\x20cancel\x20writes\x20visible\x20interruption\x20message", async () => {
    const v354 = "node-ai-image-rh-cancel-visible";
    let v355 = 0;
    const v356 = {
        signal: { aborted: false },
        abort() {
          this["signal"]["aborted"] = true;
        },
      },
      {
        proto: v357,
        ctx: v358,
        state: v359,
      } = createTestContext({
        targetId: v354,
        nodeData: {
          id: v354,
          model: "runninghub/2041177685895946242",
          provider: "runninghubwf",
          generationStartTime: 1000,
          rhTaskStartedAt: 1000,
          rhTaskId: "rh-cancel-visible",
          rhTaskStatus: "running",
          rhTaskUseOpenapiQuery: true,
          isGenerating: true,
          jobStatus: "running",
        },
        apiImpl: {
          cancelRunningHubWorkflowTask: async ({
            apiKey: v360,
            taskId: v361,
          }) => {
            return (
              strict["equal"](v360, "k_rh"),
              strict["equal"](v361, "rh-cancel-visible"),
              { code: 0, msg: "cancelled\x20by\x20user" }
            );
          },
        },
        stopLoadingImpl: () => {
          v355 += 1;
        },
      });
    ((v358["_isGenerating"] = true),
      (v358["_rhApiKey"] = "k_rh"),
      (v358["_rhTaskId"] = "rh-cancel-visible"),
      (v358["_rhAbortController"] = v356),
      (v358["btnEl"] = createButtonStub()),
      (v358["_updateSubmitButtonState"] = () => {}),
      await v357["_cancelRunningHubWorkflowTask"]["call"](v358));
    const v362 = v359["nodes"][v354];
    (strict["equal"](v362["isGenerating"], false),
      strict["equal"](v362["jobStatus"], "cancelled"),
      strict["equal"](v362["rhTaskStatus"], "cancelled"),
      strict["equal"](v362["rhStatusMessage"], "cancelled\x20by\x20user"),
      strict["equal"](v362["rhStatusCode"], 0),
      strict["equal"](v362["rhTaskRecovering"], false),
      strict["equal"](v356["signal"]["aborted"], true),
      strict["equal"](v355, 1),
      strict["equal"](v358["_isGenerating"], false),
      strict["doesNotMatch"](v358["btnEl"]["innerHTML"], /animation:spin/));
  }),
  test("aigenImage\x20task\x20orchestration:\x20unmount\x20aborts\x20local\x20generation\x20polling", () => {
    const v363 = "node-ai-image-unmount-preserves-task",
      v364 = {
        signal: { aborted: false },
        abort() {
          this["signal"]["aborted"] = true;
        },
      },
      { proto: v365, ctx: v366 } = createTestContext({
        targetId: v363,
        nodeData: {
          id: v363,
          model: "runninghub/2041177685895946242",
          provider: "runninghubwf",
          isGenerating: true,
          jobStatus: "running",
        },
      });
    ((v366["_rhAbortController"] = v364),
      v365["unmount"]["call"](v366),
      strict["equal"](v364["signal"]["aborted"], true),
      strict["equal"](v366["_rhAbortController"], null));
  }),
  test("aigenImage task orchestration: RunningHub NanoBanana 自适应无参考图时按显示区 1600x900 映射 16:9", async () => {
    const v367 = "node-ai-image-rh-nano-1",
      { proto: v368, ctx: v369 } = createTestContext({
        targetId: v367,
        nodeData: {
          id: v367,
          model: "runninghub-model/rhart-image-v1",
          provider: "runninghub",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
          width: 1600,
          height: 900,
        },
        nodes: {},
        incomingEdges: [],
      }),
      v370 = await v368["_buildPayload"]["call"](v369);
    (strict["equal"](v370["provider"], "runninghub"),
      strict["equal"](v370["aspectRatio"], "16:9"));
  }),
  test("aigenImage task orchestration: RunningHub NanoBanana 自适应无参考图时非标准 1700x900 就近映射 16:9", async () => {
    const v371 = "node-ai-image-rh-nano-2",
      { proto: v372, ctx: v373 } = createTestContext({
        targetId: v371,
        nodeData: {
          id: v371,
          model: "runninghub-model/rhart-image-v1-official",
          provider: "runninghub",
          aspectRatio: "auto",
          imageSize: "2K",
          batchSize: 1,
          width: 1700,
          height: 900,
        },
        nodes: {},
        incomingEdges: [],
      }),
      v374 = await v372["_buildPayload"]["call"](v373);
    (strict["equal"](v374["provider"], "runninghub"),
      strict["equal"](v374["aspectRatio"], "16:9"));
  }),
  test("aigenImage task orchestration: RunningHub GPT image 2 official 使用扩展比例", async () => {
    const v375 = "node-ai-image-rh-gpt2-official",
      { proto: v376, ctx: v377 } = createTestContext({
        targetId: v375,
        nodeData: {
          id: v375,
          model: "runninghub-model/rhart-image-g-2-official",
          provider: "runninghub",
          aspectRatio: "1:8",
          imageSize: "4K",
          batchSize: 1,
          width: 900,
          height: 1700,
        },
        nodes: {},
        incomingEdges: [],
      }),
      v378 = await v376["_buildPayload"]["call"](v377);
    (strict["equal"](v378["provider"], "runninghub"),
      strict["equal"](
        v378["model"],
        "runninghub-model/rhart-image-g-2-official",
      ),
      strict["equal"](v378["aspectRatio"], "9:21"));
  }),
  test("aigenImage\x20task\x20orchestration:\x20RunningHub\x20GPT\x20image\x202\x20official\x20保留\x201K", async () => {
    const v379 = "node-ai-image-rh-gpt2-official-1k",
      { proto: v380, ctx: v381 } = createTestContext({
        targetId: v379,
        nodeData: {
          id: v379,
          model: "runninghub-model/rhart-image-g-2-official",
          provider: "runninghub",
          aspectRatio: "1:1",
          imageSize: "1K",
          batchSize: 1,
          width: 900,
          height: 900,
        },
        nodes: {},
        incomingEdges: [],
      }),
      v382 = await v380["_buildPayload"]["call"](v381);
    (strict["equal"](v382["provider"], "runninghub"),
      strict["equal"](
        v382["model"],
        "runninghub-model/rhart-image-g-2-official",
      ),
      strict["equal"](v382["imageSize"], "1K"),
      strict["equal"](v382["aspectRatio"], "1:1"));
  }),
  test("aigenImage task orchestration: 非 NanoBanana 模型自适应无参考图按显示区域映射", async () => {
    const v383 = "node-ai-image-non-nano-1",
      { proto: v384, ctx: v385 } = createTestContext({
        targetId: v383,
        nodeData: {
          id: v383,
          model: "ppio/seedream-5.0-lite",
          provider: "ppio",
          aspectRatio: "自适应",
          imageSize: "2K",
          batchSize: 1,
          width: 1700,
          height: 900,
        },
        nodes: {},
        incomingEdges: [],
      }),
      v386 = await v384["_buildPayload"]["call"](v385);
    (strict["equal"](v386["provider"], "ppio"),
      strict["equal"](v386["aspectRatio"], "16:9"));
  }),
  test("aigenImage\x20task\x20orchestration:\x20_buildResumePayload\x20按模型前缀推断\x20provider\x20与\x20key", async () => {
    const v387 = {
        runninghub: {
          apiKey: "k_runninghub",
          modelApiKey: "k_runninghub_model",
        },
        runninghubwf: { apiKey: "k_runninghub_wf" },
        dreamina: { apiKey: "k_dreamina" },
        ppio: { apiKey: "k_ppio" },
        apimart: { apiKey: "k_apimart" },
        grsai: { apiKey: "k_grsai" },
      },
      v388 = [
        {
          name: "runninghub-model\x20使用\x20modelApiKey",
          model: "runninghub-model/rhart-image-v1",
          expectedProvider: "runninghub",
          expectedApiKey: "k_runninghub_model",
        },
        {
          name: "runninghub 工作流使用 workflow apiKey",
          model: "runninghub/2041177685895946242",
          expectedProvider: "runninghubwf",
          expectedApiKey: "k_runninghub_wf",
          isWorkflow: true,
        },
        {
          name: "Dreamina\x20manifest\x20模型按\x20provider\x20执行",
          model: "dreamina/4.5",
          expectedProvider: "dreamina",
          expectedApiKey: "k_dreamina",
        },
        {
          name: "PPIO 模型推断为 ppio",
          model: "ppio/seedream-5.0-lite",
          expectedProvider: "ppio",
          expectedApiKey: "k_ppio",
        },
        {
          name: "APImart\x20模型推断为\x20apimart",
          model: "apimart/nano-banana-2",
          expectedProvider: "apimart",
          expectedApiKey: "k_apimart",
        },
        {
          name: "裸模型默认走 grsai",
          model: "nano-banana-pro-vt",
          expectedProvider: "grsai",
          expectedApiKey: "k_grsai",
        },
      ];
    for (const v389 of v388) {
      const { proto: v390, ctx: v391 } = createTestContext({
          targetId: "node-ai-image-model-resume-" + v389["expectedProvider"],
          nodeData: {
            id: "node-ai-image-model-resume-" + v389["expectedProvider"],
            model: v389["model"],
            provider: "",
            imageSize: "2K",
            batchSize: 1,
          },
          getProviderConfigImpl: (v392) => v387[v392] || {},
          isRunninghubWorkflowModelImpl: () => v389["isWorkflow"] === true,
        }),
        v393 = await v390["_buildResumePayload"]["call"](v391, v391["_data"]);
      (strict["equal"](
        v393["provider"],
        v389["expectedProvider"],
        v389["name"],
      ),
        strict["equal"](v393["apiKey"], v389["expectedApiKey"], v389["name"]),
        strict["equal"](
          v393["model"],
          v389["expectedModel"] || v389["model"],
          v389["name"],
        ));
    }
  }),
  test("aigenImage task orchestration: RunningHub model API payload does not use workflow key", async () => {
    const { proto: v394, ctx: v395 } = createTestContext({
        targetId: "node-ai-image-runninghub-model-no-key-fallback",
        nodeData: {
          id: "node-ai-image-runninghub-model-no-key-fallback",
          model: "runninghub-model/rhart-image-v1",
          provider: "runninghub",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        promptText: "prompt",
        getProviderConfigImpl: (v396) =>
          v396 === "runninghub" ? { apiKey: "k_runninghub_workflow_only" } : {},
      }),
      v397 = await v394["_buildPayload"]["call"](v395);
    (strict["equal"](v397["provider"], "runninghub"),
      strict["equal"](v397["apiKey"], ""));
  }),
  test("aigenImage task orchestration: 模型族恢复分类稳定", () => {
    const { proto: v398, ctx: v399 } = createTestContext({
      targetId: "node-ai-image-recovery-matrix",
      nodeData: {
        id: "node-ai-image-recovery-matrix",
        model: "runninghub-model/rhart-image-v1",
        provider: "runninghub",
        imageSize: "2K",
        batchSize: 1,
      },
      isRunninghubWorkflowModelImpl: (v400) =>
        String(v400 || "")["startsWith"]("runninghub/"),
    });
    (strict["equal"](
      v398["_isRunningHubRecoverableRunningTask"]["call"](v399, {
        model: "runninghub-model/rhart-image-v1",
        provider: "runninghub",
        rhTaskId: "rh-task-1",
        rhTaskStatus: "pending",
      }),
      true,
    ),
      strict["equal"](
        v398["_isRunningHubRecoverableRunningTask"]["call"](v399, {
          model: "runninghub/2041177685895946242",
          provider: "",
          rhTaskId: "rh-task-2",
          rhTaskStatus: "RUNNING",
        }),
        true,
      ),
      strict["equal"](
        v398["_isRunningHubRecoverableRunningTask"]["call"](v399, {
          model: "runninghub-model/rhart-image-v1",
          provider: "runninghub",
          rhTaskId: "rh-task-3",
          rhTaskStatus: "success",
        }),
        false,
      ),
      strict["equal"](
        v398["_isDreaminaRecoverableRunningTask"]["call"](v399, {
          model: "dreamina/4.5",
          provider: "dreamina",
          dreaminaSubmitId: "dm-task-1",
          dreaminaTaskStatus: "pending",
          dreaminaTaskPhase: "generating",
        }),
        true,
      ),
      strict["equal"](
        v398["_isDreaminaRecoverableRunningTask"]["call"](v399, {
          model: "dreamina/4.5",
          provider: "dreamina",
          dreaminaSubmitId: "dm-task-2",
          dreaminaTaskStatus: "success",
          dreaminaTaskPhase: "done",
        }),
        false,
      ),
      strict["equal"](
        v398["_isDreaminaRecoverableRunningTask"]["call"](v399, {
          model: "dreamina/4.5",
          provider: "dreamina",
          dreaminaSubmitId: "dm-task-error",
          jobStatus: "error",
          dreaminaTaskStatus: "pending",
          dreaminaTaskPhase: "generating",
        }),
        false,
      ),
      strict["equal"](
        v398["_isDreaminaRecoverableRunningTask"]["call"](v399, {
          model: "dreamina/4.5",
          provider: "dreamina",
          dreaminaSubmitId: "dm-task-status-error",
          dreaminaTaskStatus: "error",
          dreaminaTaskPhase: "generating",
        }),
        false,
      ),
      strict["equal"](
        v398["_isAsyncRecoverableRunningTask"]["call"](v399, {
          model: "ppio/seedream-5.0-lite",
          asyncTaskProvider: "ppio",
          asyncTaskKind: "image",
          asyncTaskId: "async-task-1",
          asyncTaskStatus: "running",
        }),
        true,
      ),
      strict["equal"](
        v398["_isAsyncRecoverableRunningTask"]["call"](v399, {
          model: "apimart/flux-kontext-pro",
          asyncTaskProvider: "apimart",
          asyncTaskKind: "image",
          asyncTaskId: "async-task-2",
          asyncTaskStatus: "submitted",
        }),
        true,
      ),
      strict["equal"](
        v398["_isAsyncRecoverableRunningTask"]["call"](v399, {
          model: "runninghub-model/rhart-image-v1",
          asyncTaskProvider: "runninghub",
          asyncTaskKind: "image",
          asyncTaskId: "async-task-3",
          asyncTaskStatus: "running",
        }),
        false,
      ),
      strict["equal"](
        v398["_isAsyncRecoverableRunningTask"]["call"](v399, {
          model: "grsai/seedream-4.0",
          asyncTaskProvider: "grsai",
          asyncTaskKind: "image",
          asyncTaskId: "async-task-4",
          asyncTaskStatus: "running",
        }),
        true,
      ),
      strict["equal"](
        v398["_isAsyncRecoverableRunningTask"]["call"](v399, {
          model: "ppio/seedream-5.0-lite",
          asyncTaskProvider: "ppio",
          asyncTaskKind: "video",
          asyncTaskId: "async-task-5",
          asyncTaskStatus: "running",
        }),
        false,
      ));
  }),
  test("aigenImage task orchestration: RunningHub 工作流模型可空提示词生成", async () => {
    const v401 = "node-ai-image-rh-workflow-empty-prompt",
      v402 = { runninghubwf: { apiKey: "k_runninghub_wf" } },
      { proto: v403, ctx: v404 } = createTestContext({
        targetId: v401,
        nodeData: {
          id: v401,
          model: "runninghub/2050306122774532097",
          provider: "",
          aspectRatio: "1:1",
          imageSize: "2K",
          batchSize: 1,
        },
        nodes: {
          "node-rh-workflow-ref": {
            id: "node-rh-workflow-ref",
            type: "source-image",
            originalLocalPath: "data/uploads/ref.png",
          },
        },
        incomingEdges: [
          {
            id: "edge-rh-workflow-ref",
            sourceId: "node-rh-workflow-ref",
            targetId: v401,
            refSlot: "",
          },
        ],
        promptText: "",
        getProviderConfigImpl: (v405) => v402[v405] || {},
        isRunninghubWorkflowModelImpl: (v406) =>
          v406 === "runninghub/2050306122774532097",
      }),
      v407 = await v403["_buildPayload"]["call"](v404);
    (strict["ok"](v407),
      strict["equal"](v407["provider"], "runninghubwf"),
      strict["equal"](v407["apiKey"], "k_runninghub_wf"),
      strict["equal"](v407["prompt"], ""));
  }),
  test("aigenImage\x20task\x20orchestration:\x20Qwen\x20image\x20edit\x20requires\x20at\x20least\x20one\x20reference\x20image", async () => {
    const v408 = "node-ai-image-qwen-edit-no-ref",
      v409 = globalThis["window"]["showToast"],
      v410 = [];
    globalThis["window"]["showToast"] = (v411, v412) => {
      v410["push"]({ message: v411, type: v412 });
    };
    try {
      const { proto: v413, ctx: v414 } = createTestContext({
          targetId: v408,
          nodeData: {
            id: v408,
            model: "runninghub/2050306122774532097",
            provider: "runninghubwf",
            aspectRatio: "16:9",
            imageSize: "2K",
            batchSize: 1,
          },
          promptText: "edit",
          incomingEdges: [],
          isRunninghubWorkflowModelImpl: (v415) =>
            String(v415 || "")["startsWith"]("runninghub/"),
        }),
        v416 = await v413["_buildPayload"]["call"](v414);
      (strict["equal"](v416, null),
        strict["deepEqual"](v410, [
          { message: "请先添加至少一张参考图再生成", type: "warn" },
        ]));
    } finally {
      globalThis["window"]["showToast"] = v409;
    }
  }),
  test("aigenImage task orchestration: Qwen image edit reads schema params and normalizes unsupported 4K size", async () => {
    const v417 = "node-ai-image-qwen-edit-defaults",
      v418 = ["qwen-ref-1", "qwen-ref-2", "qwen-ref-3", "qwen-ref-4"],
      v419 = Object["fromEntries"](
        v418["map"]((v420, v421) => [
          v420,
          {
            id: v420,
            type: "source-image",
            originalLocalPath: "data/uploads/qwen-" + (v421 + 1) + ".png",
            width: 1600,
            height: 900,
          },
        ]),
      ),
      v422 = { runninghubwf: { apiKey: "k_runninghub_wf" } },
      { proto: v423, ctx: v424 } = createTestContext({
        targetId: v417,
        nodeData: {
          id: v417,
          model: "runninghub/2050306122774532097",
          provider: "runninghubwf",
          aspectRatio: "16:9",
          batchSize: 4,
          generationParams: {
            batchSize: 4,
            imageSize: "4K",
            rhInstanceType: "plus",
            rhQwenEditMode: "qwen2509",
            rhQwenFirstImageMode: "depth",
          },
        },
        nodes: v419,
        incomingEdges: v418["map"]((v425, v426) => ({
          id: "edge-qwen-" + (v426 + 1),
          sourceId: v425,
          targetId: v417,
        })),
        promptText: "keep identity",
        getProviderConfigImpl: (v427) => v422[v427] || {},
        isRunninghubWorkflowModelImpl: (v428) =>
          String(v428 || "")["startsWith"]("runninghub/"),
      }),
      v429 = await v423["_buildPayload"]["call"](v424);
    (strict["ok"](v429),
      strict["equal"](v429["provider"], "runninghubwf"),
      strict["equal"](v429["model"], "runninghub/2050306122774532097"),
      strict["equal"](v429["apiKey"], "k_runninghub_wf"),
      strict["equal"](v429["prompt"], "keep identity"),
      strict["equal"](v429["imageSize"], "2K"),
      strict["equal"](v429["aspectRatio"], "16:9"),
      strict["equal"](v429["batchSize"], 1),
      strict["equal"](v429["ratioCapability"], "dimensions"),
      strict["equal"](v429["rhInstanceType"], "plus"),
      strict["equal"](v429["rhQwenEditMode"], "qwen2509"),
      strict["equal"](v429["rhQwenFirstImageMode"], "depth"),
      strict["deepEqual"](v429["inputUrls"], [
        "/data/uploads/qwen-1.png",
        "/data/uploads/qwen-2.png",
        "/data/uploads/qwen-3.png",
      ]));
  }),
  test("aigenImage task orchestration: GRSAI NanobananaPRO legacy VIP/4K uses supported payload", async () => {
    const v430 = async ({
      imageSize: v431,
      model: v432,
      expectedModel: expectedModel = v432,
      expectedMode: expectedMode = "vip",
      expectedImageSize: expectedImageSize = "2K",
    }) => {
      const v433 = "node-ai-image-nb-pro-vip-" + v431 + "-" + v432,
        { proto: v434, ctx: v435 } = createTestContext({
          targetId: v433,
          nodeData: {
            id: v433,
            model: v432,
            provider: "grsai",
            aspectRatio: "1:1",
            imageSize: v431,
            batchSize: 1,
          },
        }),
        v436 = await v434["_buildPayload"]["call"](v435),
        v437 = await v434["_buildResumePayload"]["call"](v435, v435["_data"]);
      (strict["equal"](v436["model"], expectedModel),
        strict["equal"](v437["model"], expectedModel),
        strict["equal"](v436["provider"], "grsai"),
        strict["equal"](v437["provider"], "grsai"),
        strict["equal"](v436["mode"], expectedMode),
        strict["equal"](v436["imageSize"], expectedImageSize),
        strict["equal"](
          Object["prototype"]["hasOwnProperty"]["call"](v437, "mode"),
          false,
        ));
    };
    (await v430({ imageSize: "2K", model: "nano-banana-pro-vip" }),
      await v430({ imageSize: "4K", model: "nano-banana-pro-vip" }),
      await v430({
        imageSize: "2K",
        model: "nano-banana-pro-4k-vip",
        expectedImageSize: "4K",
      }));
  }),
  test("aigenImage task orchestration: GRSAI Nanobanana2 CL keeps CL and disables 4K payload", async () => {
    const v438 = async ({
      imageSize: v439,
      model: v440,
      expectedModel: expectedModel = v440,
      expectedMode: expectedMode = "cl",
      expectedImageSize: expectedImageSize = "2K",
    }) => {
      const v441 = "node-ai-image-nb2-cl-" + v439 + "-" + v440,
        { proto: v442, ctx: v443 } = createTestContext({
          targetId: v441,
          nodeData: {
            id: v441,
            model: v440,
            provider: "grsai",
            aspectRatio: "1:1",
            imageSize: v439,
            batchSize: 1,
          },
        }),
        v444 = await v442["_buildPayload"]["call"](v443),
        v445 = await v442["_buildResumePayload"]["call"](v443, v443["_data"]);
      (strict["equal"](v444["model"], expectedModel),
        strict["equal"](v445["model"], expectedModel),
        strict["equal"](v444["provider"], "grsai"),
        strict["equal"](v445["provider"], "grsai"),
        strict["equal"](v444["mode"], expectedMode),
        strict["equal"](v444["imageSize"], expectedImageSize),
        strict["equal"](
          Object["prototype"]["hasOwnProperty"]["call"](v445, "mode"),
          false,
        ));
    };
    (await v438({ imageSize: "2K", model: "nano-banana-2-cl" }),
      await v438({ imageSize: "4K", model: "nano-banana-2-cl" }),
      await v438({
        imageSize: "2K",
        model: "nano-banana-2-4k-cl",
        expectedImageSize: "4K",
      }));
  }),
  test("aigenImage\x20task\x20orchestration:\x20manifest\x20GRSAI\x20nano-banana-2\x20passes\x20mode\x20selector\x20and\x20normalizes\x204K", async () => {
    const v446 = async ({
      imageSize: v447,
      mode: v448,
      expectedMode: expectedMode = v448,
      expectedImageSize: expectedImageSize = v447,
    }) => {
      const v449 = "node-ai-image-grsai-manifest-mode-" + v447 + "-" + v448,
        { proto: v450, ctx: v451 } = createTestContext({
          targetId: v449,
          nodeData: {
            id: v449,
            model: "nano-banana-2",
            provider: "grsai",
            generationParams: {
              imageSize: v447,
              aspectRatio: "1:1",
              mode: v448,
            },
            batchSize: 1,
          },
        }),
        v452 = await v450["_buildPayload"]["call"](v451),
        v453 = await v450["_buildResumePayload"]["call"](v451, v451["_data"]);
      (strict["equal"](v452["model"], "nano-banana-2"),
        strict["equal"](v453["model"], "nano-banana-2"),
        strict["equal"](v452["provider"], "grsai"),
        strict["equal"](v453["provider"], "grsai"),
        strict["equal"](v452["mode"], expectedMode),
        strict["equal"](v452["imageSize"], expectedImageSize),
        strict["equal"](
          Object["prototype"]["hasOwnProperty"]["call"](v453, "mode"),
          false,
        ));
    };
    (await v446({ imageSize: "2K", mode: "normal" }),
      await v446({ imageSize: "2K", mode: "cl" }),
      await v446({ imageSize: "4K", mode: "cl" }),
      await v446({ imageSize: "4K", mode: "normal", expectedImageSize: "2K" }));
  }),
  test("aigenImage\x20task\x20orchestration:\x20manifest\x20GRSAI\x20pro\x20modes\x20keep\x20VT/CL/VIP\x20and\x20normalize\x204K", async () => {
    const v454 = async ({
      imageSize: v455,
      mode: v456,
      expectedMode: expectedMode = v456,
      expectedImageSize: expectedImageSize = v455,
    }) => {
      const v457 = "node-ai-image-grsai-pro-manifest-mode-" + v455 + "-" + v456,
        { proto: v458, ctx: v459 } = createTestContext({
          targetId: v457,
          nodeData: {
            id: v457,
            model: "nano-banana-pro",
            provider: "grsai",
            generationParams: {
              imageSize: v455,
              aspectRatio: "1:1",
              mode: v456,
            },
            batchSize: 1,
          },
        }),
        v460 = await v458["_buildPayload"]["call"](v459),
        v461 = await v458["_buildResumePayload"]["call"](v459, v459["_data"]);
      (strict["equal"](v460["model"], "nano-banana-pro"),
        strict["equal"](v461["model"], "nano-banana-pro"),
        strict["equal"](v460["provider"], "grsai"),
        strict["equal"](v461["provider"], "grsai"),
        strict["equal"](v460["mode"], expectedMode),
        strict["equal"](v460["imageSize"], expectedImageSize),
        strict["equal"](
          Object["prototype"]["hasOwnProperty"]["call"](v461, "mode"),
          false,
        ));
    };
    (await v454({ imageSize: "2K", mode: "normal" }),
      await v454({ imageSize: "2K", mode: "vt" }),
      await v454({ imageSize: "2K", mode: "cl" }),
      await v454({ imageSize: "2K", mode: "vip" }),
      await v454({ imageSize: "4K", mode: "vip" }),
      await v454({ imageSize: "4K", mode: "normal", expectedImageSize: "2K" }),
      await v454({ imageSize: "4K", mode: "vt", expectedImageSize: "2K" }),
      await v454({ imageSize: "4K", mode: "cl", expectedImageSize: "2K" }));
  }),
  test("aigenImage task orchestration: GRSAI nanobanana cleans legacy UI params", async () => {
    const v462 = "node-ai-image-grsai-nano-clean-legacy-params",
      { proto: v463, ctx: v464 } = createTestContext({
        targetId: v462,
        nodeData: {
          id: v462,
          model: "nano-banana",
          provider: "grsai",
          width: 1600,
          height: 900,
          generationParams: {
            imageSize: "3K",
            aspectRatio: "自适应",
            mode: "normal",
            batchSize: 1,
          },
        },
      }),
      v465 = await v463["_buildPayload"]["call"](v464);
    (strict["equal"](v465["imageSize"], "2K"),
      strict["equal"](v465["aspectRatio"], "auto"),
      strict["equal"](v465["resolvedRatioLabel"], "auto"));
  }),
  test("aigenImage task orchestration: GRSAI GPT image 2 常规模式只保留 1K", async () => {
    for (const { storedModel: v466, imageSize: v467 } of [
      { storedModel: "gpt-image-2", imageSize: "1K" },
      { storedModel: "gpt-image-2", imageSize: "2K" },
      { storedModel: "gpt-image-2", imageSize: "4K" },
      { storedModel: "gpt-image-2", imageSize: undefined },
    ]) {
      const v468 =
          "node-ai-image-gpt-image-2-1k-" + v466 + "-" + (v467 || "default"),
        { proto: v469, ctx: v470 } = createTestContext({
          targetId: v468,
          nodeData: {
            id: v468,
            model: v466,
            provider: "grsai",
            generationParams: {
              mode: "normal",
              aspectRatio: "9:21",
              ...(v467 ? { imageSize: v467 } : {}),
              batchSize: 1,
            },
          },
        }),
        v471 = await v469["_buildPayload"]["call"](v470),
        v472 = await v469["_buildResumePayload"]["call"](v470, v470["_data"]);
      (strict["equal"](v471["model"], v466),
        strict["equal"](v472["model"], v466),
        strict["equal"](v471["provider"], "grsai"),
        strict["equal"](v472["provider"], "grsai"),
        strict["equal"](v471["mode"], "normal"),
        strict["equal"](v471["imageSize"], "1K"),
        strict["equal"](v471["aspectRatio"], "9:21"),
        strict["equal"](v471["resolvedRatioLabel"], "9:21"));
    }
  }),
  test("aigenImage task orchestration: GRSAI GPT image 2 VIP 模式保留全部画质", async () => {
    const v473 = async ({
      imageSize: v474,
      storedModel: v475,
      aspectRatio: v476,
    }) => {
      const v477 = "node-ai-image-gpt-image-2-vip-mode-" + v474 + "-" + v475,
        { proto: v478, ctx: v479 } = createTestContext({
          targetId: v477,
          nodeData: {
            id: v477,
            model: v475,
            provider: "grsai",
            generationParams: {
              mode: "vip",
              aspectRatio: v476,
              imageSize: v474,
              batchSize: 1,
            },
          },
        }),
        v480 = await v478["_buildPayload"]["call"](v479),
        v481 = await v478["_buildResumePayload"]["call"](v479, v479["_data"]);
      (strict["equal"](v480["model"], v475),
        strict["equal"](v481["model"], v475),
        strict["equal"](v480["provider"], "grsai"),
        strict["equal"](v480["mode"], "vip"),
        strict["equal"](v480["imageSize"], v474),
        strict["equal"](v480["aspectRatio"], v476),
        strict["equal"](v480["resolvedRatioLabel"], v476));
    };
    (await v473({
      imageSize: "1K",
      storedModel: "gpt-image-2",
      aspectRatio: "9:16",
    }),
      await v473({
        imageSize: "2K",
        storedModel: "gpt-image-2",
        aspectRatio: "9:21",
      }),
      await v473({
        imageSize: "4K",
        storedModel: "gpt-image-2",
        aspectRatio: "2:1",
      }),
      await v473({
        imageSize: "4K",
        storedModel: "gpt-image-2-vip",
        aspectRatio: "9:21",
      }));
  }),
  test("aigenImage task orchestration: GRSAI GPT image 2 4K 保留官方支持比例", async () => {
    const v482 = "node-ai-image-gpt-image-2-4k-fallback",
      { proto: v483, ctx: v484 } = createTestContext({
        targetId: v482,
        nodeData: {
          id: v482,
          model: "gpt-image-2",
          provider: "grsai",
          generationParams: {
            mode: "vip",
            aspectRatio: "1:1",
            imageSize: "4K",
            batchSize: 1,
          },
          width: 500,
          height: 500,
        },
      }),
      v485 = await v483["_buildPayload"]["call"](v484);
    (strict["equal"](v485["model"], "gpt-image-2"),
      strict["equal"](v485["provider"], "grsai"),
      strict["equal"](v485["mode"], "vip"),
      strict["equal"](v485["imageSize"], "4K"),
      strict["equal"](v485["aspectRatio"], "1:1"),
      strict["equal"](v485["resolvedRatioLabel"], "1:1"));
  }),
  test("aigenImage task orchestration: APIMart Seedream 5 lite 保留 3K 和支持比例", async () => {
    const v486 = "node-ai-image-apimart-seedream-5-lite",
      { proto: v487, ctx: v488 } = createTestContext({
        targetId: v486,
        nodeData: {
          id: v486,
          model: "apimart/seedream-5.0-lite",
          provider: "apimart",
          aspectRatio: "21:9",
          imageSize: "3K",
          generationParams: { aspectRatio: "21:9", imageSize: "3K" },
          batchSize: 4,
        },
      }),
      v489 = await v487["_buildPayload"]["call"](v488);
    (strict["equal"](v489["provider"], "apimart"),
      strict["equal"](v489["model"], "apimart/seedream-5.0-lite"),
      strict["equal"](v489["imageSize"], "3K"),
      strict["equal"](v489["aspectRatio"], "21:9"),
      strict["equal"](v489["resolvedRatioLabel"], "21:9"),
      strict["equal"](v489["batchSize"], 4));
  }),
  test("aigenImage task orchestration: APIMart Qwen image 2.0 使用文档比例和生成数量", async () => {
    const v490 = "node-ai-image-apimart-qwen-image",
      { proto: v491, ctx: v492 } = createTestContext({
        targetId: v490,
        nodeData: {
          id: v490,
          model: "apimart/qwen-image-2.0",
          provider: "apimart",
          aspectRatio: "自适应",
          imageSize: "3K",
          generationParams: {
            mode: "pro",
            aspectRatio: "自适应",
            imageSize: "3K",
            batchSize: 6,
          },
          width: 1600,
          height: 900,
          batchSize: 1,
        },
      }),
      v493 = await v491["_buildPayload"]["call"](v492);
    (strict["equal"](v493["provider"], "apimart"),
      strict["equal"](v493["model"], "apimart/qwen-image-2.0"),
      strict["equal"](v493["mode"], "pro"),
      strict["equal"](v493["imageSize"], "1K"),
      strict["equal"](v493["aspectRatio"], "16:9"),
      strict["equal"](v493["resolvedRatioLabel"], "16:9"),
      strict["equal"](v493["batchSize"], 6));
  }),
  test("aigenImage task orchestration: APIMart Z-Image-Turbo 自适应转为真实比例并透传智能改写", async () => {
    const v494 = "node-ai-image-apimart-z-image-turbo",
      { proto: v495, ctx: v496 } = createTestContext({
        targetId: v494,
        nodeData: {
          id: v494,
          model: "apimart/z-image-turbo",
          provider: "apimart",
          aspectRatio: "自适应",
          imageSize: "3K",
          generationParams: {
            aspectRatio: "自适应",
            imageSize: "3K",
            prompt_extend: true,
            batchSize: 4,
          },
          width: 1600,
          height: 900,
          batchSize: 1,
        },
      }),
      v497 = await v495["_buildPayload"]["call"](v496);
    (strict["equal"](v497["provider"], "apimart"),
      strict["equal"](v497["model"], "apimart/z-image-turbo"),
      strict["equal"](v497["imageSize"], "1K"),
      strict["equal"](v497["aspectRatio"], "16:9"),
      strict["equal"](v497["resolvedRatioLabel"], "16:9"),
      strict["equal"](v497["prompt_extend"], true),
      strict["equal"](v497["batchSize"], 4));
  }),
  test("aigenImage task orchestration: APIMart Wan 2.7 收集图片入参并按入参比例自适应", async () => {
    const v498 = "node-ai-image-apimart-wan",
      v499 = "node-ref-apimart-wan",
      { proto: v500, ctx: v501 } = createTestContext({
        targetId: v498,
        nodeData: {
          id: v498,
          model: "apimart/wan2.7-image",
          provider: "apimart",
          aspectRatio: "自适应",
          imageSize: "4K",
          generationParams: {
            mode: "pro",
            aspectRatio: "自适应",
            imageSize: "4K",
            thinking_mode: false,
            batchSize: 4,
          },
          width: 1600,
          height: 900,
          batchSize: 1,
        },
        nodes: {
          [v499]: {
            id: v499,
            type: "source-image",
            imageUrl: "https://cdn.apimart.ai/ref-wan.png",
            width: 900,
            height: 1600,
          },
        },
        incomingEdges: [
          {
            id: "edge-apimart-wan",
            sourceId: v499,
            targetId: v498,
            refSlot: "",
          },
        ],
      }),
      v502 = await v500["_buildPayload"]["call"](v501);
    (strict["equal"](v502["provider"], "apimart"),
      strict["equal"](v502["model"], "apimart/wan2.7-image"),
      strict["equal"](v502["mode"], "pro"),
      strict["equal"](v502["imageSize"], "4K"),
      strict["equal"](v502["aspectRatio"], "9:16"),
      strict["equal"](v502["resolvedRatioLabel"], "9:16"),
      strict["equal"](v502["thinking_mode"], false),
      strict["equal"](v502["batchSize"], 4),
      strict["deepEqual"](v502["inputUrls"], [
        "https://cdn.apimart.ai/ref-wan.png",
      ]));
  }),
  test("aigenImage\x20task\x20orchestration:\x20APIMart\x20Seedream\x20有参考图时自适应透传\x20API\x20auto", async () => {
    const v503 = "node-ai-image-apimart-seedream-auto",
      v504 = "node-ref-apimart-seedream-auto",
      { proto: v505, ctx: v506 } = createTestContext({
        targetId: v503,
        nodeData: {
          id: v503,
          model: "apimart/seedream-4.0",
          provider: "apimart",
          aspectRatio: "auto",
          imageSize: "2K",
          generationParams: { aspectRatio: "auto", imageSize: "2K" },
          batchSize: 1,
        },
        nodes: {
          [v504]: {
            id: v504,
            type: "source-image",
            imageUrl: "https://img.example.com/seedream-ref.png",
            width: 1600,
            height: 900,
          },
        },
        incomingEdges: [
          {
            id: "edge-apimart-seedream-auto",
            sourceId: v504,
            targetId: v503,
            refSlot: "",
          },
        ],
      }),
      v507 = await v505["_buildPayload"]["call"](v506);
    (strict["equal"](v507["provider"], "apimart"),
      strict["equal"](v507["model"], "apimart/seedream-4.0"),
      strict["equal"](v507["aspectRatio"], "auto"),
      strict["equal"](v507["resolvedRatioLabel"], "auto"),
      strict["equal"](v507["ratioCapability"], "size"),
      strict["deepEqual"](v507["inputUrls"], [
        "https://img.example.com/seedream-ref.png",
      ]));
  }),
  test("aigenImage task orchestration: APIMart GPT image 2 透传新增比例", async () => {
    const v508 = "node-ai-image-apimart-gpt-image-2-ratio",
      { proto: v509, ctx: v510 } = createTestContext({
        targetId: v508,
        nodeData: {
          id: v508,
          model: "apimart/gpt-image-2",
          provider: "apimart",
          aspectRatio: "2:1",
          imageSize: "2K",
          generationParams: {
            mode: "official",
            aspectRatio: "2:1",
            imageSize: "2K",
          },
          batchSize: 1,
        },
      }),
      v511 = await v509["_buildPayload"]["call"](v510);
    (strict["equal"](v511["provider"], "apimart"),
      strict["equal"](v511["model"], "apimart/gpt-image-2"),
      strict["equal"](v511["mode"], "official"),
      strict["equal"](v511["imageSize"], "2K"),
      strict["equal"](v511["aspectRatio"], "2:1"),
      strict["equal"](v511["resolvedRatioLabel"], "2:1"));
  }),
  test("aigenImage task orchestration: APIMart GPT image 2 4K 不生成非法比例", async () => {
    const v512 = "node-ai-image-apimart-gpt-image-2-4k",
      { proto: v513, ctx: v514 } = createTestContext({
        targetId: v512,
        nodeData: {
          id: v512,
          model: "apimart/gpt-image-2",
          provider: "apimart",
          aspectRatio: "1:1",
          imageSize: "4K",
          generationParams: { aspectRatio: "1:1", imageSize: "4K" },
          width: 500,
          height: 500,
          batchSize: 1,
        },
      }),
      v515 = await v513["_buildPayload"]["call"](v514);
    (strict["equal"](v515["imageSize"], "4K"),
      strict["equal"](v515["aspectRatio"], "16:9"),
      strict["equal"](v515["resolvedRatioLabel"], "16:9"));
  }),
  test("aigenImage\x20task\x20orchestration:\x20APIMart\x20GPT\x20image\x202\x204K\x20自适应只解析到可用比例", async () => {
    const v516 = "node-ai-image-apimart-gpt-image-2-4k-auto",
      { proto: v517, ctx: v518 } = createTestContext({
        targetId: v516,
        nodeData: {
          id: v516,
          model: "apimart/gpt-image-2",
          provider: "apimart",
          aspectRatio: "自适应",
          imageSize: "4K",
          generationParams: { aspectRatio: "自适应", imageSize: "4K" },
          width: 500,
          height: 500,
          batchSize: 1,
        },
      }),
      v519 = await v517["_buildPayload"]["call"](v518);
    (strict["equal"](v519["imageSize"], "4K"),
      strict["equal"](v519["aspectRatio"], "16:9"),
      strict["equal"](v519["resolvedRatioLabel"], "16:9"));
  }));

import test from "node:test";
import strict from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  stopPreviewNodeLoading,
} from "../modules/previewMode.js";
import {
  createFakePreviewContainer,
  installPreviewDomStubs,
} from "../../tests/testPreviewDom.js";
import {
  _resetAssetMentionRegistryForTests,
  setAssetMentionAssets,
} from "../modules/assetMentionRegistry.js";
import {
  buildUiSchemaParamPatch,
  renderModelUiSchemaControls,
} from "./aigenImage/uiSchemaRenderer.js";
const originalGlobals = {
    window: globalThis["window"],
    document: globalThis["document"],
    Node: globalThis["Node"],
    navigator: globalThis["navigator"],
    requestAnimationFrame: globalThis["requestAnimationFrame"],
    cancelAnimationFrame: globalThis["cancelAnimationFrame"],
  },
  restorePreviewDom = installPreviewDomStubs();
if (!globalThis["window"]) globalThis["window"] = {};
typeof globalThis["window"]["addEventListener"] !== "function" &&
  (globalThis["window"]["addEventListener"] = () => {});
typeof globalThis["window"]["removeEventListener"] !== "function" &&
  (globalThis["window"]["removeEventListener"] = () => {});
typeof globalThis["window"]["showToast"] !== "function" &&
  (globalThis["window"]["showToast"] = () => {});
typeof globalThis["window"]["_triggerLocalCacheSave"] !== "function" &&
  (globalThis["window"]["_triggerLocalCacheSave"] = () => {});
!globalThis["document"] && (globalThis["document"] = {});
!globalThis["document"]["documentElement"] &&
  (globalThis["document"]["documentElement"] = {
    classList: { add() {}, remove() {} },
  });
typeof globalThis["document"]["addEventListener"] !== "function" &&
  (globalThis["document"]["addEventListener"] = () => {});
typeof globalThis["document"]["removeEventListener"] !== "function" &&
  (globalThis["document"]["removeEventListener"] = () => {});
typeof globalThis["document"]["getElementById"] !== "function" &&
  (globalThis["document"]["getElementById"] = () => null);
!globalThis["document"]["body"] &&
  (globalThis["document"]["body"] = { appendChild() {}, removeChild() {} });
!globalThis["Node"] && (globalThis["Node"] = { TEXT_NODE: 3, ELEMENT_NODE: 1 });
!globalThis["navigator"] &&
  (globalThis["navigator"] = { userAgent: "node-test", platform: "node" });
typeof globalThis["requestAnimationFrame"] !== "function" &&
  (globalThis["requestAnimationFrame"] = (v0) =>
    setTimeout(() => v0(Date["now"]()), 0));
typeof globalThis["cancelAnimationFrame"] !== "function" &&
  (globalThis["cancelAnimationFrame"] = (v1) => clearTimeout(v1));
let store,
  AIGenAudioNode,
  originalStoreFns = null;
function restoreStore() {
  if (!store || !originalStoreFns) return;
  ((store["getState"] = originalStoreFns["getState"]),
    (store["getIncomingEdges"] = originalStoreFns["getIncomingEdges"]),
    (store["updateNodeData"] = originalStoreFns["updateNodeData"]));
}
(test["before"](async () => {
  const v2 = await import("../core/stores/appStore.js");
  store = v2["default"];
  const v3 = await import("./AIGenAudioNode.js");
  ((AIGenAudioNode = v3["AIGenAudioNode"]),
    (originalStoreFns = {
      getState: store["getState"],
      getIncomingEdges: store["getIncomingEdges"],
      updateNodeData: store["updateNodeData"],
    }));
}),
  test["afterEach"](() => {
    (_resetPreviewRuntimeForTests(),
      _resetAssetMentionRegistryForTests(),
      restoreStore());
  }),
  test["after"](() => {
    (_resetPreviewRuntimeForTests(), restoreStore());
    if (typeof originalGlobals["window"] === "undefined")
      delete globalThis["window"];
    else globalThis["window"] = originalGlobals["window"];
    if (typeof originalGlobals["document"] === "undefined")
      delete globalThis["document"];
    else globalThis["document"] = originalGlobals["document"];
    if (typeof originalGlobals["Node"] === "undefined")
      delete globalThis["Node"];
    else globalThis["Node"] = originalGlobals["Node"];
    if (typeof originalGlobals["navigator"] === "undefined")
      delete globalThis["navigator"];
    else globalThis["navigator"] = originalGlobals["navigator"];
    (typeof originalGlobals["requestAnimationFrame"] === "undefined"
      ? delete globalThis["requestAnimationFrame"]
      : (globalThis["requestAnimationFrame"] =
          originalGlobals["requestAnimationFrame"]),
      typeof originalGlobals["cancelAnimationFrame"] === "undefined"
        ? delete globalThis["cancelAnimationFrame"]
        : (globalThis["cancelAnimationFrame"] =
            originalGlobals["cancelAnimationFrame"]),
      restorePreviewDom());
  }));
function createPromptTextNode(v4 = "") {
  return { nodeType: 3, textContent: String(v4 || "") };
}
function createPromptElementNode({
  tagName: tagName = "SPAN",
  className: className = "",
  dataset: dataset = {},
  textContent: textContent = "",
  childNodes: childNodes = [],
} = {}) {
  const v5 = String(className || "")
    ["split"](/\s+/)
    ["filter"](Boolean);
  return {
    nodeType: 1,
    tagName: tagName,
    className: className,
    classList: {
      contains(v6) {
        return v5["includes"](String(v6 || ""));
      },
    },
    dataset: { ...dataset },
    textContent: String(textContent || ""),
    childNodes: Array["isArray"](childNodes) ? childNodes : [],
  };
}
function createPromptPillNode(v7, v8) {
  return createPromptElementNode({
    className: "ref-pill",
    dataset: { label: String(v7 || ""), nodeId: String(v8 || "") },
    textContent: String(v7 || ""),
  });
}
function collectPromptInnerText(v9) {
  return (Array["isArray"](v9) ? v9 : [])
    ["map"]((v10) => {
      const v11 = Number(v10?.["nodeType"]);
      if (v11 === 3) return String(v10?.["textContent"] || "");
      if (v11 !== 1) return "";
      if (String(v10?.["tagName"] || "")["toUpperCase"]() === "BR")
        return "\x0a";
      const v12 = Array["isArray"](v10?.["childNodes"])
        ? v10["childNodes"]
        : [];
      if (v12["length"] > 0) return collectPromptInnerText(v12);
      return String(v10?.["textContent"] || "");
    })
    ["join"]("");
}
function createPromptEl(v13 = "test prompt") {
  if (Array["isArray"](v13)) {
    const v14 = collectPromptInnerText(v13);
    return { innerText: v14, textContent: v14, childNodes: v13 };
  }
  const v15 = String(v13 || "");
  return {
    innerText: v15,
    textContent: v15,
    childNodes: [createPromptTextNode(v15)],
  };
}
function createButtonStub() {
  const v16 = new Set();
  return {
    disabled: false,
    title: "",
    innerHTML: "",
    style: { color: "", cursor: "" },
    _attrs: new Map(),
    classList: {
      add(...v17) {
        v17["forEach"]((v18) => v16["add"](String(v18 || "")));
      },
      remove(...v19) {
        v19["forEach"]((v20) => v16["delete"](String(v20 || "")));
      },
      toggle(v21, v22) {
        const v23 = String(v21 || "");
        if (v22 === true) return (v16["add"](v23), true);
        if (v22 === false) return (v16["delete"](v23), false);
        if (v16["has"](v23)) return (v16["delete"](v23), false);
        return (v16["add"](v23), true);
      },
      contains(v24) {
        return v16["has"](String(v24 || ""));
      },
    },
    setAttribute(v25, v26) {
      this["_attrs"]["set"](String(v25 || ""), String(v26 || ""));
    },
    removeAttribute(v27) {
      this["_attrs"]["delete"](String(v27 || ""));
    },
  };
}
function createTestContext({
  targetId: v28,
  nodeData: nodeData = {},
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  prompt: prompt = "test prompt",
} = {}) {
  const v29 = {
    nodes: {
      ...nodes,
      [v28]: {
        id: v28,
        type: "ai-audio",
        audioWorkflowKey: "indextts2_clone",
        audioWorkflowLabel: "indextts2音色克隆",
        provider: "runninghubwf",
        ...nodeData,
      },
    },
  };
  ((store["getState"] = () => v29),
    (store["getIncomingEdges"] = (v30) =>
      incomingEdges["filter"]((v31) => v31["targetId"] === v30)),
    (store["updateNodeData"] = (v32, v33) => {
      const v34 = v29["nodes"]?.[v32] || {};
      v29["nodes"][v32] = { ...v34, ...v33 };
    }));
  const v35 = new AIGenAudioNode(v29["nodes"][v28]);
  return ((v35["promptEl"] = createPromptEl(prompt)), { ctx: v35, state: v29 });
}
(test("aigenAudio:\x20prompt\x20editor\x20wires\x20@\x20mention\x20trigger\x20and\x20keyboard\x20handling", () => {
  const v36 = readFileSync(
    new URL("./AIGenAudioNode.js", import.meta["url"]),
    "utf8",
  );
  (strict["match"](
    v36,
    /from "\.\.\/modules\/nodePromptShared\.js";[\s\S]*this\.promptEl\.addEventListener\("input",[\s\S]*_checkAtTrigger\(this,\s*e\)/,
  ),
    strict["match"](
      v36,
      /this\.promptEl\.addEventListener\("keydown",[\s\S]*_handleMentionMenuKeyboard\(e\)[\s\S]*_handlePillKeyboard\(this,\s*e\)/,
    ));
}),
  test("aigenAudio payload: ref-pill 文本引用会替换为真实文本", () => {
    const v37 = "node-audio-text-pill",
      v38 = "node-audio-text-ref-pill",
      { ctx: v39 } = createTestContext({
        targetId: v37,
        nodes: {
          [v38]: {
            id: v38,
            type: "source-text",
            text: "来自音频文本节点的提示词",
          },
        },
        incomingEdges: [
          {
            id: "edge-audio-text-pill",
            sourceId: v38,
            targetId: v37,
            refSlot: "",
          },
        ],
        prompt: [
          createPromptTextNode("旁白 "),
          createPromptPillNode("@文本1", v38),
          createPromptTextNode(" 开场"),
        ],
      }),
      { payload: v40 } = v39["_buildPayloadSnapshot"]();
    (strict["equal"](v40["prompt"], "旁白 来自音频文本节点的提示词 开场"),
      strict["deepEqual"](v40["textInputs"], ["来自音频文本节点的提示词"]));
  }),
  test("aigenAudio payload: 手打 @文本1 会替换为真实文本", () => {
    const v41 = "node-audio-text-mention",
      v42 = "node-audio-text-ref-mention",
      { ctx: v43 } = createTestContext({
        targetId: v41,
        nodes: {
          [v42]: {
            id: v42,
            type: "source-text",
            outputText: "直接替换的音频文本",
          },
        },
        incomingEdges: [
          {
            id: "edge-audio-text-mention",
            sourceId: v42,
            targetId: v41,
            refSlot: "",
          },
        ],
        prompt: "旁白 @文本1 开场",
      }),
      { payload: v44 } = v43["_buildPayloadSnapshot"]();
    strict["equal"](v44["prompt"], "旁白 直接替换的音频文本 开场");
  }),
  test("aigenAudio payload: 未显式引用的文本入边会前置到 prompt", () => {
    const v45 = "node-audio-text-prepend",
      v46 = "node-audio-text-ref-prepend",
      { ctx: v47 } = createTestContext({
        targetId: v45,
        nodes: {
          [v46]: {
            id: v46,
            type: "source-text",
            content: "前置的音频文本入参",
          },
        },
        incomingEdges: [
          {
            id: "edge-audio-text-prepend",
            sourceId: v46,
            targetId: v45,
            refSlot: "",
          },
        ],
        prompt: "主体音频描述",
      }),
      { payload: v48 } = v47["_buildPayloadSnapshot"]();
    strict["equal"](v48["prompt"], "前置的音频文本入参\n主体音频描述");
  }),
  test("aigenAudio payload: ai-text 入参无输出时使用 prompt 作为文本内容", () => {
    const v49 = "node-audio-ai-text-prompt",
      v50 = "node-audio-ai-text-prompt-ref",
      { ctx: v51 } = createTestContext({
        targetId: v49,
        nodes: {
          [v50]: {
            id: v50,
            type: "ai-text",
            prompt: "来自生成文本节点的音频提示词",
          },
        },
        incomingEdges: [
          {
            id: "edge-audio-ai-text-prompt",
            sourceId: v50,
            targetId: v49,
            refSlot: "",
          },
        ],
        prompt: "主体音频描述",
      }),
      { payload: v52 } = v51["_buildPayloadSnapshot"]();
    strict["equal"](
      v52["prompt"],
      "来自生成文本节点的音频提示词\n主体音频描述",
    );
  }),
  test("aigenAudio\x20payload:\x20模板触发也会解析文本入参且不影响音频引用", () => {
    const v53 = "node-audio-template-text",
      v54 = "node-audio-template-text-ref",
      v55 = "node-audio-template-audio-ref",
      { ctx: v56 } = createTestContext({
        targetId: v53,
        nodes: {
          [v54]: { id: v54, type: "source-text", text: "模板里的文本入参" },
          [v55]: { id: v55, type: "source-audio", localPath: "output/ref.mp3" },
        },
        incomingEdges: [
          {
            id: "edge-audio-template-text",
            sourceId: v54,
            targetId: v53,
            refSlot: "",
          },
          {
            id: "edge-audio-template-audio",
            sourceId: v55,
            targetId: v53,
            refSlot: "audioRef",
          },
        ],
      }),
      { payload: v57 } = v56["_buildPayloadSnapshot"]("生成音频：@文本1");
    (strict["equal"](v57["prompt"], "生成音频： 模板里的文本入参"),
      strict["deepEqual"](v57["audioRefs"], [
        {
          edgeId: "edge-audio-template-audio",
          sourceId: v55,
          sourceType: "source-audio",
          refSlot: "audioRef",
          url: "/output/ref.mp3",
        },
      ]));
  }),
  test("aigenAudio payload: /预设模板支持用户输入默认值", () => {
    const v58 = "node-audio-template-fallback",
      { ctx: v59 } = createTestContext({ targetId: v58, prompt: "" }),
      v60 = v59["_buildPayloadSnapshot"]("生成音频：{用户输入 || 默认音效}");
    (strict["equal"](v60["payload"]["prompt"], "生成音频：默认音效"),
      (v59["promptEl"] = createPromptEl("雨夜脚步声")));
    const v61 = v59["_buildPayloadSnapshot"](
      "生成音频：{用户输入 || 默认音效}",
    );
    strict["equal"](v61["payload"]["prompt"], "生成音频：雨夜脚步声");
  }),
  test("aigenAudio payload: hidden asset audio refs fill RunningHub audio inputs", () => {
    const v62 = "node-audio-hidden-asset";
    setAssetMentionAssets([
      {
        id: "asset-audio-hidden",
        items: [
          {
            name: "voice",
            type: "source-audio",
            nodeData: {
              type: "source-audio",
              localPath: "output/hidden-voice.mp3",
            },
          },
        ],
      },
    ]);
    const { ctx: v63 } = createTestContext({
        targetId: v62,
        nodeData: {
          promptAssetInputRefs: [
            { assetId: "asset-audio-hidden", itemIndex: 0, type: "audio" },
          ],
        },
        prompt: "请克隆这段声音",
      }),
      { payload: v64, validation: v65 } = v63["_buildPayloadSnapshot"]();
    (strict["equal"](v65["ok"], true),
      strict["equal"](v64["prompt"], "请克隆这段声音"),
      strict["deepEqual"](v64["audioRefs"], [
        {
          edgeId: "",
          sourceId: "",
          sourceType: "asset-audio",
          refSlot: "audioRef",
          url: "/output/hidden-voice.mp3",
          assetId: "asset-audio-hidden",
          assetIndex: 0,
        },
      ]));
  }),
  test("aigenAudio ui schema: RunningHub audio workflows render instance controls", () => {
    ["indextts2_clone", "voice_convert", "advanced_voice_clone"]["forEach"](
      (v66) => {
        const v67 = renderModelUiSchemaControls(
          v66,
          { generationParams: { rhInstanceType: "plus" } },
          { placement: "instance", variant: "instanceToggle" },
        );
        (strict["match"](v67, /data-ui-schema-field="rhInstanceType"/),
          strict["match"](v67, /rh-vram-btn/),
          strict["match"](v67, />48G</));
      },
    );
  }),
  test("aigenAudio\x20ui\x20schema:\x20instance\x20control\x20patch\x20writes\x20only\x20generationParams", () => {
    const v68 = buildUiSchemaParamPatch(
      {
        model: "indextts2_clone",
        rhInstanceType: "default",
        generationParams: { rhInstanceType: "default" },
      },
      "rhInstanceType",
      "plus",
    );
    (strict["deepEqual"](v68, {
      generationParams: { rhInstanceType: "plus" },
      generationParamsByModel: { indextts2_clone: { rhInstanceType: "plus" } },
    }),
      strict["equal"](
        Object["prototype"]["hasOwnProperty"]["call"](v68, "rhInstanceType"),
        false,
      ));
  }),
  test("aigenAudio\x20payload:\x20进阶声音克隆使用音频1/音频2槽位且允许无音频", () => {
    const v69 = "node-audio-advanced-no-audio",
      { ctx: v70 } = createTestContext({
        targetId: v69,
        nodeData: {
          audioWorkflowKey: "advanced_voice_clone",
          audioWorkflowLabel: "进阶声音克隆",
          model: "advanced_voice_clone",
        },
        prompt: "音频1 你好 音频2 回答 音频1 再问",
      }),
      { payload: v71, validation: v72 } = v70["_buildPayloadSnapshot"]();
    (strict["equal"](v72["ok"], true),
      strict["equal"](v71["audioWorkflowKey"], "advanced_voice_clone"),
      strict["equal"](
        v71["prompt"],
        "[speaker_1]:\x20你好\x0a[speaker_2]:\x20回答\x0a[speaker_1]:\x20再问",
      ),
      strict["deepEqual"](v71["audioRefs"], []));
  }),
  test("aigenAudio: 进阶声音克隆无音频时允许生成随机音色 TTS", async () => {
    const v73 = "node-audio-advanced-build-no-audio",
      { ctx: v74 } = createTestContext({
        targetId: v73,
        nodeData: {
          audioWorkflowKey: "advanced_voice_clone",
          audioWorkflowLabel: "进阶声音克隆",
          model: "advanced_voice_clone",
        },
        prompt: "用温柔女声说：今晚月色真好。",
      });
    let v75 = false;
    v74["_resolveAudioDurationSec"] = async () => {
      return ((v75 = true), 0);
    };
    const v76 = await v74["_buildPayload"]();
    (strict["ok"](v76),
      strict["equal"](v76["audioWorkflowKey"], "advanced_voice_clone"),
      strict["deepEqual"](v76["audioRefs"], []),
      strict["equal"](v75, false));
  }),
  test("aigenAudio payload: 进阶声音克隆按连接顺序填入两个固定音频槽", () => {
    const v77 = "node-audio-advanced-slots",
      v78 = "node-audio-advanced-ref-1",
      v79 = "node-audio-advanced-ref-2",
      { ctx: v80 } = createTestContext({
        targetId: v77,
        nodeData: {
          audioWorkflowKey: "advanced_voice_clone",
          audioWorkflowLabel: "进阶声音克隆",
          model: "advanced_voice_clone",
        },
        nodes: {
          [v78]: { id: v78, type: "source-audio", localPath: "output/a1.mp3" },
          [v79]: { id: v79, type: "source-audio", localPath: "output/a2.mp3" },
        },
        incomingEdges: [
          {
            id: "edge-audio-advanced-1",
            sourceId: v78,
            targetId: v77,
            refSlot: "audio1",
          },
          {
            id: "edge-audio-advanced-2",
            sourceId: v79,
            targetId: v77,
            refSlot: "audio2",
          },
        ],
        prompt: "双人对话",
      }),
      { payload: v81, validation: v82 } = v80["_buildPayloadSnapshot"]();
    (strict["equal"](v82["ok"], true),
      strict["deepEqual"](v81["audioRefs"], [
        {
          edgeId: "edge-audio-advanced-1",
          sourceId: v78,
          sourceType: "source-audio",
          refSlot: "audio1",
          url: "/output/a1.mp3",
        },
        {
          edgeId: "edge-audio-advanced-2",
          sourceId: v79,
          sourceType: "source-audio",
          refSlot: "audio2",
          url: "/output/a2.mp3",
        },
      ]));
  }),
  test("aigenAudio: 进阶声音克隆生成前拦截超过 15 秒音频", async () => {
    const v83 = "node-audio-advanced-duration",
      v84 = "node-audio-advanced-duration-ref",
      { ctx: v85 } = createTestContext({
        targetId: v83,
        nodeData: {
          audioWorkflowKey: "advanced_voice_clone",
          audioWorkflowLabel: "进阶声音克隆",
          model: "advanced_voice_clone",
        },
        nodes: {
          [v84]: {
            id: v84,
            type: "source-audio",
            localPath: "output/too-long.mp3",
          },
        },
        incomingEdges: [
          {
            id: "edge-audio-advanced-duration",
            sourceId: v84,
            targetId: v83,
            refSlot: "audio1",
          },
        ],
        prompt: "双人对话",
      }),
      v86 = [],
      v87 = globalThis["window"]["showToast"];
    ((globalThis["window"]["showToast"] = (v88, v89) =>
      v86["push"]([v88, v89])),
      (v85["_resolveAudioDurationSec"] = async () => 15.2));
    try {
      const v90 = await v85["_buildPayload"]();
      (strict["equal"](v90, null),
        strict["equal"](v86["length"], 1),
        strict["match"](v86[0][0], /3~15 秒/),
        strict["equal"](v86[0][1], "warn"));
    } finally {
      globalThis["window"]["showToast"] = v87;
    }
  }),
  test("aigenAudio:\x20进阶声音克隆生成前拦截少于\x203\x20秒音频", async () => {
    const v91 = "node-audio-advanced-duration-short",
      v92 = "node-audio-advanced-duration-short-ref",
      { ctx: v93 } = createTestContext({
        targetId: v91,
        nodeData: {
          audioWorkflowKey: "advanced_voice_clone",
          audioWorkflowLabel: "进阶声音克隆",
          model: "advanced_voice_clone",
        },
        nodes: {
          [v92]: {
            id: v92,
            type: "source-audio",
            localPath: "output/too-short.mp3",
          },
        },
        incomingEdges: [
          {
            id: "edge-audio-advanced-duration-short",
            sourceId: v92,
            targetId: v91,
            refSlot: "audio1",
          },
        ],
        prompt: "音频1说：你终于来了。",
      }),
      v94 = [],
      v95 = globalThis["window"]["showToast"];
    ((globalThis["window"]["showToast"] = (v96, v97) =>
      v94["push"]([v96, v97])),
      (v93["_resolveAudioDurationSec"] = async () => 2.9));
    try {
      const v98 = await v93["_buildPayload"]();
      (strict["equal"](v98, null),
        strict["equal"](v94["length"], 1),
        strict["match"](v94[0][0], /3~15 秒/),
        strict["equal"](v94[0][1], "warn"));
    } finally {
      globalThis["window"]["showToast"] = v95;
    }
  }),
  test("aigenAudio: 音频工作流用法提示随 manifest 切换", () => {
    const v99 = "node-audio-advanced-help-tip",
      { ctx: v100, state: v101 } = createTestContext({
        targetId: v99,
        nodeData: {
          audioWorkflowKey: "advanced_voice_clone",
          audioWorkflowLabel: "进阶声音克隆",
          model: "advanced_voice_clone",
        },
      });
    (strict["match"](v100["_getGenerationNodeHelpText"](), /进阶声音克隆用法/),
      (v101["nodes"][v99] = {
        ...v101["nodes"][v99],
        audioWorkflowKey: "indextts2_clone",
        model: "indextts2_clone",
      }),
      (v100["_data"] = v101["nodes"][v99]),
      strict["match"](
        v100["_getGenerationNodeHelpText"](),
        /indextts2音色克隆用法/,
      ),
      (v101["nodes"][v99] = {
        ...v101["nodes"][v99],
        audioWorkflowKey: "voice_convert",
        model: "voice_convert",
      }),
      (v100["_data"] = v101["nodes"][v99]),
      strict["match"](v100["_getGenerationNodeHelpText"](), /音色转换用法/));
  }),
  test("aigenAudio: 旧 RunningHub 模型 ID 不再作为工作流 alias", () => {
    const v102 = "node-audio-advanced-help-tip-model-id",
      { ctx: v103 } = createTestContext({
        targetId: v102,
        nodeData: {
          audioWorkflowKey: "runninghub/2050165249344585729",
          model: "runninghub/2050165249344585729",
        },
      });
    strict["equal"](v103["_getCurrentWorkflow"]()["key"], "indextts2_clone");
  }),
  test("aigenAudio:\x20进阶声音克隆中文标签也会显示用法提示", () => {
    const v104 = "node-audio-advanced-help-tip-label",
      { ctx: v105 } = createTestContext({
        targetId: v104,
        nodeData: {
          audioWorkflowKey: "进阶声音克隆",
          audioWorkflowLabel: "进阶声音克隆",
          model: "进阶声音克隆",
        },
      });
    (strict["equal"](
      v105["_getCurrentWorkflow"]()["key"],
      "advanced_voice_clone",
    ),
      strict["match"](
        v105["_getGenerationNodeHelpText"](),
        /进阶声音克隆用法/,
      ));
  }),
  test("aigenAudio: 进阶声音克隆未授权时打开订阅弹窗且不构建 payload", async () => {
    const v106 = "node-audio-advanced-vip",
      { ctx: v107 } = createTestContext({
        targetId: v106,
        nodeData: {
          audioWorkflowKey: "advanced_voice_clone",
          audioWorkflowLabel: "进阶声音克隆",
          model: "advanced_voice_clone",
        },
        prompt: "双人对话",
      }),
      v108 = globalThis["window"]["isModelAllowedBySubscription"],
      v109 = globalThis["window"]["openSubscriptionDialog"],
      v110 = globalThis["window"]["ensureSubscriptionInstallId"],
      v111 = [];
    let v112 = false;
    ((globalThis["window"]["isModelAllowedBySubscription"] = () => false),
      (globalThis["window"]["openSubscriptionDialog"] = (v113) =>
        v111["push"](v113)),
      (globalThis["window"]["ensureSubscriptionInstallId"] = async () =>
        "install-should-not-run"),
      (v107["_buildPayload"] = async () => {
        return ((v112 = true), { prompt: "不应构建" });
      }),
      (v107["_updateSubmitButtonState"] = () => {}));
    try {
      (await v107["_onGenerate"](),
        strict["equal"](v112, false),
        strict["equal"](v111["length"], 1),
        strict["deepEqual"](v111[0], {
          modelId: "runninghub/2050165249344585729",
          provider: "runninghubwf",
        }));
    } finally {
      ((globalThis["window"]["isModelAllowedBySubscription"] = v108),
        (globalThis["window"]["openSubscriptionDialog"] = v109),
        (globalThis["window"]["ensureSubscriptionInstallId"] = v110));
    }
  }),
  test("aigenAudio:\x20选择进阶声音克隆时未授权会先打开订阅弹窗", () => {
    const v114 = "node-audio-advanced-select-vip",
      { ctx: v115, state: v116 } = createTestContext({
        targetId: v114,
        nodeData: {
          audioWorkflowKey: "indextts2_clone",
          audioWorkflowLabel: "indextts2音色克隆",
          model: "indextts2_clone",
        },
        prompt: "旁白正文",
      }),
      v117 = globalThis["window"]["isModelAllowedBySubscription"],
      v118 = globalThis["window"]["openSubscriptionDialog"],
      v119 = [];
    ((globalThis["window"]["isModelAllowedBySubscription"] = () => false),
      (globalThis["window"]["openSubscriptionDialog"] = (v120) =>
        v119["push"](v120)));
    try {
      (v115["_setSelectedWorkflow"]("advanced_voice_clone"),
        strict["equal"](
          v116["nodes"][v114]["audioWorkflowKey"],
          "indextts2_clone",
        ),
        strict["equal"](v119["length"], 1),
        strict["equal"](v119[0]["modelId"], "runninghub/2050165249344585729"),
        strict["equal"](v119[0]["provider"], "runninghubwf"),
        strict["equal"](typeof v119[0]["onSuccess"], "function"));
    } finally {
      ((globalThis["window"]["isModelAllowedBySubscription"] = v117),
        (globalThis["window"]["openSubscriptionDialog"] = v118));
    }
  }),
  test("aigenAudio: 进阶声音克隆授权成功回调后完成模型选择", () => {
    const v121 = "node-audio-advanced-select-success",
      { ctx: v122, state: v123 } = createTestContext({
        targetId: v121,
        nodeData: {
          audioWorkflowKey: "indextts2_clone",
          audioWorkflowLabel: "indextts2音色克隆",
          model: "indextts2_clone",
        },
        prompt: "旁白正文",
      }),
      v124 = globalThis["window"]["isModelAllowedBySubscription"],
      v125 = globalThis["window"]["openSubscriptionDialog"];
    let v126 = false,
      v127 = null;
    ((globalThis["window"]["isModelAllowedBySubscription"] = () => v126),
      (globalThis["window"]["openSubscriptionDialog"] = (v128) => {
        v127 = v128["onSuccess"];
      }));
    try {
      (v122["_setSelectedWorkflow"]("advanced_voice_clone"),
        strict["equal"](
          v123["nodes"][v121]["audioWorkflowKey"],
          "indextts2_clone",
        ),
        (v126 = true),
        v127(),
        strict["equal"](
          v123["nodes"][v121]["audioWorkflowKey"],
          "advanced_voice_clone",
        ),
        strict["equal"](
          v123["nodes"][v121]["audioWorkflowLabel"],
          "进阶声音克隆",
        ),
        strict["equal"](v123["nodes"][v121]["model"], "advanced_voice_clone"));
    } finally {
      ((globalThis["window"]["isModelAllowedBySubscription"] = v124),
        (globalThis["window"]["openSubscriptionDialog"] = v125));
    }
  }),
  test("aigenAudio\x20payload:\x20manifest\x20instance\x20param\x20is\x20read\x20from\x20generationParams", () => {
    const v129 = "node-audio-instance-generation-params",
      { ctx: v130 } = createTestContext({
        targetId: v129,
        nodeData: {
          audioWorkflowKey: "indextts2_clone",
          audioWorkflowLabel: "indextts2音色克隆",
          model: "indextts2_clone",
          rhInstanceType: "default",
          generationParams: { rhInstanceType: "plus" },
        },
        nodes: {
          "audio-ref-instance": {
            id: "audio-ref-instance",
            type: "source-audio",
            localPath: "output/ref.mp3",
          },
        },
        incomingEdges: [
          {
            id: "edge-audio-instance",
            sourceId: "audio-ref-instance",
            targetId: v129,
            refSlot: "audioRef",
          },
        ],
        prompt: "旁白正文",
      }),
      { payload: v131 } = v130["_buildPayloadSnapshot"]();
    strict["equal"](v131["rhInstanceType"], "plus");
  }),
  test("aigenAudio state sync: refSlot changes trigger ref bar refresh", () => {
    const v132 = globalThis["document"],
      v133 = "node-audio-refslot-refresh",
      v134 = [
        {
          id: "edge-audio-ref",
          sourceId: "audio-ref",
          targetId: v133,
          refSlot: "audioRef",
        },
        {
          id: "edge-text-ref",
          sourceId: "text-ref",
          targetId: v133,
          refSlot: "textRef",
        },
      ];
    try {
      globalThis["document"] = {
        ...globalThis["document"],
        activeElement: null,
      };
      const { ctx: v135, state: v136 } = createTestContext({
        targetId: v133,
        nodes: {
          "audio-ref": {
            id: "audio-ref",
            type: "source-audio",
            localPath: "output/ref.mp3",
            _bizRev: 1,
          },
          "text-ref": {
            id: "text-ref",
            type: "source-text",
            text: "旁白",
            _bizRev: 1,
          },
        },
        incomingEdges: v134,
      });
      let v137 = 0;
      ((v135["_renderRefBar"] = () => {
        v137 += 1;
      }),
        (v135["_refreshWorkflowUi"] = () => {}),
        (v135["_syncPickConnectVisualState"] = () => {}),
        (v135["_maybeResumeRunningHubTask"] = () => {}),
        (v135["_updateSubmitButtonState"] = () => {}),
        (v135["promptEl"] = {
          innerHTML: "",
          style: { removeProperty() {} },
          querySelectorAll: () => [],
        }),
        v135["update"](v136["nodes"][v133]),
        strict["equal"](v137, 1),
        (v134[0] = { ...v134[0], refSlot: "textRef" }),
        (v134[1] = { ...v134[1], refSlot: "audioRef" }),
        v135["update"](v136["nodes"][v133]),
        strict["equal"](v137, 2));
    } finally {
      if (typeof v132 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v132;
    }
  }),
  test("aigenAudio workflow selection initializes schema defaults and preserves memory", () => {
    const v138 = "node-audio-schema-selection-memory",
      { ctx: v139, state: v140 } = createTestContext({
        targetId: v138,
        nodeData: {
          audioWorkflowKey: "indextts2_clone",
          audioWorkflowLabel: "indextts2音色克隆",
          model: "indextts2_clone",
          generationParams: { rhInstanceType: "plus" },
          generationParamsByModel: {
            voice_convert: { rhInstanceType: "plus" },
          },
        },
        prompt: "旁白正文",
      });
    (v139["_setSelectedWorkflow"]("voice_convert"),
      strict["equal"](v140["nodes"][v138]["audioWorkflowKey"], "voice_convert"),
      strict["equal"](
        v140["nodes"][v138]["generationParams"]["rhInstanceType"],
        "plus",
      ),
      strict["deepEqual"](v140["nodes"][v138]["generationParamsByModel"], {
        indextts2_clone: { rhInstanceType: "plus" },
        voice_convert: { rhInstanceType: "plus" },
      }));
  }),
  test("aigenAudio: 开发者模式下 /预设 仅回填最终提示词不直接生成", async () => {
    const v141 = globalThis["window"]["DEV_MODE"];
    globalThis["window"]["DEV_MODE"] = true;
    try {
      const v142 = "node-audio-template-dev-preview",
        { ctx: v143, state: v144 } = createTestContext({
          targetId: v142,
          prompt: "旁白正文",
        });
      let v145 = false;
      ((v143["_buildPayload"] = async () => ({ prompt: "生成音频：旁白正文" })),
        (v143["_updateSubmitButtonState"] = () => {}),
        (v143["_stopRunningHubRecovery"] = () => {}),
        (v143["_setGeneratingUi"] = () => {
          v145 = true;
        }),
        (v143["previewEl"] = {}),
        (v143["btnEl"] = null),
        await v143["_onGenerate"]("生成音频：{用户输入}"),
        strict["equal"](v145, false),
        strict["equal"](v144["nodes"][v142]["prompt"], "生成音频：旁白正文"),
        strict["equal"](v143["promptEl"]["innerHTML"], "生成音频：旁白正文"));
    } finally {
      globalThis["window"]["DEV_MODE"] = v141;
    }
  }),
  test("aigenAudio:\x20预览模式下点击生成只启动假加载不发请求", async () => {
    const v146 = globalThis["window"]["PREVIEW_MODE"];
    globalThis["window"]["PREVIEW_MODE"] = true;
    try {
      const v147 = "node-audio-preview-loading",
        { ctx: v148 } = createTestContext({ targetId: v147 });
      let v149 = false;
      ((v148["previewEl"] = createFakePreviewContainer()),
        (v148["btnEl"] = createButtonStub()),
        (v148["_updateSubmitButtonState"] = () => {}),
        (v148["_buildPayload"] = async () => {
          return ((v149 = true), { prompt: "预览模式不应走到这里" });
        }),
        await v148["_onGenerate"](),
        strict["equal"](v149, false),
        strict["equal"](isPreviewNodeLoading(v147), true),
        strict["equal"](v148["btnEl"]["disabled"], true),
        strict["match"](v148["btnEl"]["innerHTML"], /animation:spin/),
        stopPreviewNodeLoading(v147),
        strict["equal"](v148["btnEl"]["disabled"], false),
        strict["doesNotMatch"](v148["btnEl"]["innerHTML"], /animation:spin/));
    } finally {
      globalThis["window"]["PREVIEW_MODE"] = v146;
    }
  }),
  test("aigenAudio\x20submit\x20button:\x20running\x20task\x20state\x20is\x20read\x20from\x20unified\x20selector", () => {
    const v150 = "node-audio-running-button-state",
      { ctx: v151, state: v152 } = createTestContext({
        targetId: v150,
        nodeData: {
          rhTaskId: "rh-audio-running",
          rhTaskStatus: "running",
          isGenerating: false,
        },
      });
    ((v151["btnEl"] = createButtonStub()),
      (v151["_isGenerating"] = false),
      (v152["nodes"][v150] = {
        ...v152["nodes"][v150],
        rhTaskId: "rh-audio-running",
        rhTaskStatus: "running",
      }),
      v151["_updateSubmitButtonState"](),
      strict["equal"](v151["btnEl"]["disabled"], false),
      strict["equal"](v151["btnEl"]["style"]["cursor"], ""),
      strict["equal"](
        v151["btnEl"]["classList"]["contains"]("is-task-cancel"),
        true,
      ),
      strict["match"](v151["btnEl"]["innerHTML"], /v2-task-cancel-spin/),
      (v151["_rhCancelInFlight"] = true),
      v151["_updateSubmitButtonState"](),
      strict["equal"](v151["btnEl"]["disabled"], true),
      strict["equal"](
        v151["btnEl"]["style"]["cursor"],
        "var(--unavailable-cursor)",
      ));
  }),
  test("aigenAudio task orchestration: running RH store state cancels even when local flag is stale", async () => {
    const v153 = "node-audio-running-store-cancels",
      { ctx: v154, state: v155 } = createTestContext({
        targetId: v153,
        nodeData: {
          rhTaskId: "rh-audio-running",
          rhTaskStatus: "running",
          jobStatus: "running",
          isGenerating: true,
        },
      });
    let v156 = 0,
      v157 = 0;
    ((v154["_isGenerating"] = false),
      (v154["_cancelRunningHubWorkflowTask"] = async () => {
        v156 += 1;
      }),
      (v154["_onGenerate"] = async () => {
        v157 += 1;
      }),
      (v155["nodes"][v153] = {
        ...v155["nodes"][v153],
        rhTaskId: "rh-audio-running",
        rhTaskStatus: "running",
        jobStatus: "running",
        isGenerating: true,
      }),
      await v154["_handleGenerateOrCancel"](),
      strict["equal"](v156, 1),
      strict["equal"](v157, 0));
  }),
  test("aigenAudio submit button: terminal store state overrides stale local busy flag", () => {
    const v158 = "node-audio-terminal-overrides-local-busy",
      { ctx: v159, state: v160 } = createTestContext({
        targetId: v158,
        nodeData: {
          rhTaskId: "rh-audio-failed",
          rhTaskStatus: "failed",
          jobStatus: "error",
          isGenerating: true,
        },
      });
    ((v159["btnEl"] = createButtonStub()),
      v159["btnEl"]["classList"]["add"]("is-task-cancel"),
      (v159["btnEl"]["innerHTML"] =
        '<svg><g class="v2-task-cancel-spin"></g></svg>'),
      (v159["_isGenerating"] = true),
      (v160["nodes"][v158] = {
        ...v160["nodes"][v158],
        rhTaskStatus: "failed",
        jobStatus: "error",
        isGenerating: true,
      }),
      v159["_setGeneratingUi"](true),
      strict["equal"](
        v159["btnEl"]["classList"]["contains"]("is-task-cancel"),
        false,
      ),
      strict["doesNotMatch"](
        v159["btnEl"]["innerHTML"],
        /v2-task-cancel-spin/,
      ));
  }),
  test("aigenAudio state sync: running RH state keeps preview loading over previous result", async () => {
    const v161 = "node-audio-rh-existing-result-loading",
      { ctx: v162, state: v163 } = createTestContext({
        targetId: v161,
        nodeData: {
          audioUrl: "/output/previous.mp3",
          src: "/output/previous.mp3",
          localPath: "output/previous.mp3",
          rhTaskId: "rh-audio-running",
          rhTaskStatus: "running",
          isGenerating: true,
          jobStatus: "running",
        },
      });
    ((v162["previewEl"] = createFakePreviewContainer()),
      (v162["_syncPromptBoxSizeFromData"] = () => {}),
      (v162["_syncWorkflowDefaults"] = () => {}),
      (v162["_enforceWorkflowAudioInputLimit"] = () => {}),
      (v162["_applyResultWideLayout"] = () => {}),
      (v162["_setAudioPreviewResultState"] = () => {}),
      (v162["_syncStatusOverlay"] = () => {}),
      (v162["_refreshWorkflowUi"] = () => {}),
      (v162["_renderRefBar"] = () => {}),
      (v162["_syncPickConnectVisualState"] = () => {}),
      (v162["_maybeResumeRunningHubTask"] = () => {}),
      (v162["_updateSubmitButtonState"] = () => {}),
      v162["update"](v163["nodes"][v161]),
      await new Promise((v164) => setTimeout(v164, 70)),
      strict["equal"](
        v162["previewEl"]["classList"]["contains"]("img-preview-loading"),
        true,
      ),
      strict["equal"](
        !!v162["previewEl"]["querySelector"](".img-loading-overlay"),
        true,
      ));
  }),
  test("aigenAudio result renderer: stores persisted audio patch through unified renderer", async () => {
    const v165 = "node-audio-result-renderer",
      { ctx: v166, state: v167 } = createTestContext({ targetId: v165 }),
      v168 = [];
    let v169 = null,
      v170 = null;
    ((v166["_persistAudioOutput"] = async (v171) => {
      return (v168["push"](v171), { localPath: "output/final.mp3" });
    }),
      (v166["_dispatchGenerationHistoryAudio"] = (v172) => {
        v169 = v172;
      }),
      (v166["_applyResultWideLayout"] = (v173) => {
        v170 = v173;
      }));
    const v174 = await v166["_applyAudioResultAndStore"](
        { audioUrl: "https://cdn.example.com/final.mp3" },
        Date["now"]() - 10,
      ),
      v175 = v167["nodes"][v165];
    (strict["deepEqual"](v168, ["https://cdn.example.com/final.mp3"]),
      strict["equal"](v175["jobStatus"], "success"),
      strict["equal"](v175["jobError"], null),
      strict["equal"](v175["audioUrl"], "/output/final.mp3"),
      strict["equal"](v175["src"], "/output/final.mp3"),
      strict["equal"](v175["localPath"], "output/final.mp3"),
      strict["equal"](v175["rhStatusMessage"], null),
      strict["equal"](v174["finalUrl"], "/output/final.mp3"),
      strict["equal"](v174["finalLocalPath"], "output/final.mp3"),
      strict["equal"](v169["audioUrl"], "/output/final.mp3"),
      strict["equal"](v170["audioUrl"], "/output/final.mp3"));
  }));

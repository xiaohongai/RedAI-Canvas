import test from "node:test";
import strict from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAIGenTextNodeUiModule } from "./uiModule.js";
import { createAIGenTextNodeStateSyncModule } from "./stateSyncModule.js";
import {
  APIMART_TEXT_MODEL_MENU_ITEMS,
  buildApimartTextModelMenuHTML,
  buildRunningHubTextModelMenuHTML,
  buildTextModelMenuHTML,
  buildTextProviderMenuGroupsHTML,
  TEXT_MODEL_MENU_ITEMS_BY_PROVIDER,
} from "./apimartTextModelMenu.js";
import { getDisplayModelName } from "../../modules/providers.js";
import {
  _resetPreviewRuntimeForTests,
  isPreviewNodeLoading,
  setPreviewMode,
  startPreviewNodeLoading,
} from "../../modules/previewMode.js";
import {
  createFakePreviewContainer,
  installPreviewDomStubs,
} from "../../../tests/testPreviewDom.js";
const restorePreviewDom = installPreviewDomStubs(),
  originalRequestAnimationFrame = globalThis["requestAnimationFrame"],
  __dirname = dirname(fileURLToPath(import.meta["url"])),
  uiModuleSource = readFileSync(join(__dirname, "uiModule.js"), "utf8");
function escapeRegExp(v0) {
  return String(v0)["replace"](/[.*+?^${}()|[\]\\]/g, "\\$&");
}
typeof globalThis["requestAnimationFrame"] !== "function" &&
  (globalThis["requestAnimationFrame"] = (v1) => {
    return (v1(), 0);
  });
(test["afterEach"](() => {
  _resetPreviewRuntimeForTests();
}),
  test["after"](() => {
    (_resetPreviewRuntimeForTests(),
      typeof originalRequestAnimationFrame === "undefined"
        ? delete globalThis["requestAnimationFrame"]
        : (globalThis["requestAnimationFrame"] = originalRequestAnimationFrame),
      restorePreviewDom());
  }),
  test("aigenText\x20ui:\x20APIMart\x20menu\x20uses\x20new\x20text\x20model\x20set", () => {
    const v2 = buildApimartTextModelMenuHTML("apimart/kimi-k2-instruct"),
      v3 = buildTextModelMenuHTML("gemini-3.1-pro", "grsai"),
      v4 = buildTextModelMenuHTML("minimax/minimax-m2.5-highspeed", "ppio"),
      v5 = buildRunningHubTextModelMenuHTML(
        "runninghub-model/rhart-text-g-3-flash-preview-cv/image-to-text",
      ),
      v6 = buildTextModelMenuHTML(
        "volcengine/doubao-seed-2-0-pro-260215",
        "volcengine",
      ),
      v7 = buildTextProviderMenuGroupsHTML("gemini-3.1-pro"),
      v8 = APIMART_TEXT_MODEL_MENU_ITEMS["map"]((v9) => [
        v9["modelId"],
        v9["title"],
      ]),
      v10 = [
        [v3, "谷歌最新模型gemini3.1"],
        [v4, "更低延迟、更高性价比的领先模型"],
        [v4, "阿里最强开源模型Qwen2.5"],
        [v4, "面向未来的新一代大模型"],
        [v4, "月之暗面最新版，超长上下文"],
        [v2, "APIMart text model"],
        [v2, "OpenAI-compatible text model"],
        [v2, "极致逻辑与推理性能，OpenAI 巅峰之作"],
        [v2, "旗舰级多模态模型，支持超长文本与深度分析"],
        [v2, "闪电级响应速度，适用于高频率对话与实时任务"],
        [v5, "闪电级响应速度，适用于高频率对话与实时任务"],
        [v5, "旗舰级多模态模型，支持超长文本与深度分析"],
        [v7, "一个 API 搞定一切——节省 30-70%"],
      ];
    (strict["match"](
      uiModuleSource,
      /buildTextProviderMenuGroupsHTML\(_activeModel\)/,
    ),
      strict["doesNotMatch"](
        uiModuleSource,
        /buildApimartTextModelMenuHTML\(_activeModel\)/,
      ),
      strict["doesNotMatch"](
        uiModuleSource,
        /return buildTextModelMenuHTML\(_activeModel/,
      ),
      strict["doesNotMatch"](uiModuleSource, /data-lazy-text-provider=/),
      strict["doesNotMatch"](uiModuleSource, /ensureTextProviderSubmenu/),
      strict["match"](v7, /grsai-submenu/),
      strict["match"](v7, /ppio-submenu/),
      strict["match"](v7, /apimart-submenu/),
      strict["match"](v7, /runninghub-submenu/),
      strict["match"](v7, /volcengine-submenu/),
      strict["match"](v7, /images\/volcengine\.svg/),
      strict["doesNotMatch"](uiModuleSource, /data-value="deepseek-v3\.2"/),
      strict["doesNotMatch"](
        uiModuleSource,
        /data-value="apimart\/deepseek-v3\.2"/,
      ),
      strict["doesNotMatch"](
        uiModuleSource,
        /data-value="(?:minimax\/|qwen\/|deepseek\/|moonshotai\/|runninghub-model\/rhart-text|gemini-3\.1-pro-preview|gemini-3-flash-preview-nothinking|apimart\/gpt-5\.4)/,
      ),
      strict["doesNotMatch"](uiModuleSource, /data-aicanvas-toggle/),
      strict["doesNotMatch"](uiModuleSource, /aicanvas\/text-/),
      strict["doesNotMatch"](uiModuleSource, /AICanvas Text/),
      strict["doesNotMatch"](v2, /data-value="deepseek-v3\.2"/),
      strict["doesNotMatch"](v2, /data-value="apimart\/deepseek-v3\.2"/));
    for (const [v11, v12] of v8) {
      (strict["match"](
        v2,
        new RegExp('data-value="' + escapeRegExp(v11) + "\x22"),
      ),
        strict["ok"](
          v2["includes"]("<div\x20class=\x22fmi-title\x22>" + v12 + "</div>"),
        ));
    }
    (strict["ok"](
      v2["includes"]("<div\x20class=\x22fmi-title\x22>gpt-5.4</div>"),
    ),
      strict["ok"](
        v2["includes"]('<div class="fmi-title">gemini-3.1-pro-preview</div>'),
      ),
      strict["ok"](
        v2["includes"](
          '<div class="fmi-title">gemini-3-flash-preview-nothinking</div>',
        ),
      ));
    for (const [v13, v14] of v10) {
      strict["ok"](
        v13["includes"]("<div\x20class=\x22fmi-sub\x22>" + v14 + "</div>"),
        "text model menu should preserve subtitle: " + v14,
      );
    }
    for (const [v15, v16] of Object["entries"]({
      grsai: v3,
      ppio: v4,
      runninghub: v5,
      volcengine: v6,
    })) {
      for (const v17 of TEXT_MODEL_MENU_ITEMS_BY_PROVIDER[v15]) {
        (strict["match"](
          v16,
          new RegExp('data-value="' + escapeRegExp(v17["modelId"]) + "\x22"),
        ),
          strict["ok"](
            v16["includes"]('data-provider="' + v17["provider"] + "\x22"),
          ),
          strict["ok"](
            v16["includes"](
              '<div class="fmi-title">' + v17["title"] + "</div>",
            ),
          ));
      }
    }
  }),
  test("aigenText\x20model\x20menu:\x20provider\x20filter\x20can\x20expose\x20only\x20Volcengine", () => {
    const v18 = buildTextProviderMenuGroupsHTML(
      "volcengine/doubao-seed-2-0-pro-260215",
      { providers: ["volcengine"] },
    );
    (strict["match"](v18, /volcengine-submenu/),
      strict["match"](v18, /volcengine\/doubao-seed-2-0-pro-260215/),
      strict["doesNotMatch"](v18, /apimart-submenu/),
      strict["doesNotMatch"](v18, /runninghub-submenu/),
      strict["doesNotMatch"](v18, /grsai-submenu/),
      strict["doesNotMatch"](v18, /ppio-submenu/));
  }),
  test("aigenText ui: default APIMart text model displays Kimi K2 Instruct", () => {
    (strict["match"](
      uiModuleSource,
      /this\._data\.model \|\| "apimart\/kimi-k2-instruct"/,
    ),
      strict["match"](
        uiModuleSource,
        /<span class="img-model-label">\$\{getDisplayModelName\(_activeModel\)\}<\/span>/,
      ),
      strict["equal"](
        getDisplayModelName("apimart/kimi-k2-instruct"),
        "Kimi K2 Instruct",
      ));
  }));
function createSubmitButtonStub() {
  const v19 = new Set();
  return {
    disabled: false,
    title: "",
    innerHTML: "",
    style: { color: "", cursor: "" },
    dataset: {},
    classList: {
      add(...v20) {
        v20["forEach"]((v21) => v19["add"](String(v21 || "")));
      },
      remove(...v22) {
        v22["forEach"]((v23) => v19["delete"](String(v23 || "")));
      },
      contains(v24) {
        return v19["has"](String(v24 || ""));
      },
    },
    setAttribute(v25, v26) {
      this["dataset"][String(v25 || "")] = String(v26 || "");
    },
  };
}
(test("aigenText ui: 输出区保持只读，不再进入编辑态", () => {
  let v27 = [];
  const v28 = [],
    v29 = createAIGenTextNodeUiModule({
      store: {
        getState: () => ({
          selectedNodeIds: v27,
          nodes: { "node-text-ui-preview": { outputScrollTop: 0 } },
        }),
        getStateRaw: () => ({
          nodes: { "node-text-ui-preview": { outputScrollTop: 0 } },
        }),
        setSelectedNodes: (v30) => {
          v27 = v30["slice"]();
        },
        updateNodeData: (v31, v32) => {
          v28["push"]([v31, v32]);
        },
      },
    }),
    v33 = {
      _attrs: {},
      style: {},
      scrollTop: 42,
      setAttribute(v34, v35) {
        this["_attrs"][String(v34 || "")] = String(v35 || "");
      },
      focus() {},
    },
    v36 = Object["assign"](Object["create"](v29), {
      nodeId: "node-text-ui-preview",
      outputEl: v33,
      _outputScrollTop: 24,
    });
  (v29["_enterOutputEditMode"]["call"](v36),
    strict["equal"](v33["_attrs"]["contenteditable"], "false"),
    strict["deepEqual"](v27, [v36["nodeId"]]),
    strict["deepEqual"](v28, [[v36["nodeId"], { outputScrollTop: 42 }]]),
    strict["match"](
      uiModuleSource,
      /bindReadonlyTextSelection\(this\.outputEl,\s*\{/,
    ),
    strict["match"](
      uiModuleSource,
      /onActivate: \(\) => this\._enterOutputEditMode\(\)/,
    ),
    strict["match"](
      uiModuleSource,
      /onDeactivate: \(\) => this\._commitOutputScrollTop\(\)/,
    ),
    strict["doesNotMatch"](
      uiModuleSource,
      /outputEl\.style\.userSelect = "none"/,
    ));
}),
  test("aigenText\x20ui:\x20普通滚动也会节流保存\x20outputScrollTop", async () => {
    let v37 = { outputScrollTop: 0 };
    const v38 = [],
      v39 = createAIGenTextNodeUiModule({
        store: {
          getStateRaw: () => ({ nodes: { "node-text-scroll-save": v37 } }),
          updateNodeData: (v40, v41) => {
            (v38["push"]([v40, v41]), (v37 = { ...v37, ...v41 }));
          },
        },
      }),
      v42 = { scrollTop: 63 },
      v43 = Object["assign"](Object["create"](v39), {
        nodeId: "node-text-scroll-save",
        outputEl: v42,
        _outputScrollTop: 0,
      });
    (v39["_markOutputScrollTopDirty"]["call"](v43),
      strict["equal"](v43["_outputScrollTopDirty"], true),
      strict["equal"](v43["_outputScrollTop"], 63),
      await new Promise((v44) => setTimeout(v44, 160)),
      strict["equal"](v43["_outputScrollTopDirty"], false),
      strict["deepEqual"](v38, [[v43["nodeId"], { outputScrollTop: 63 }]]),
      strict["match"](uiModuleSource, /this\._markOutputScrollTopDirty\(\)/));
  }),
  test("aigenText ui: 预览模式双击输出区也不会进入编辑态", () => {
    let v45 = [];
    const v46 = createAIGenTextNodeUiModule({
        store: {
          getState: () => ({ selectedNodeIds: v45 }),
          setSelectedNodes: (v47) => {
            v45 = v47["slice"]();
          },
        },
      }),
      v48 = {
        _attrs: {},
        style: {},
        innerText: "",
        scrollTop: 0,
        setAttribute(v49, v50) {
          this["_attrs"][String(v49 || "")] = String(v50 || "");
        },
        getAttribute(v51) {
          return this["_attrs"][String(v51 || "")] || null;
        },
        focus() {},
      },
      v52 = Object["assign"](Object["create"](v46), {
        nodeId: "node-text-ui-preview-dblclick",
        outputEl: v48,
        _outputScrollTop: 8,
      });
    let v53 = false,
      v54 = false;
    (startPreviewNodeLoading(v52["nodeId"], createFakePreviewContainer()),
      setPreviewMode(true),
      strict["equal"](isPreviewNodeLoading(v52["nodeId"]), true),
      v46["_handlePreviewDblclick"]["call"](v52, {
        preventDefault() {
          v53 = true;
        },
        stopPropagation() {
          v54 = true;
        },
      }),
      strict["equal"](v53, false),
      strict["equal"](v54, true),
      strict["notEqual"](v48["_attrs"]["contenteditable"], "true"),
      strict["equal"](isPreviewNodeLoading(v52["nodeId"]), true),
      strict["deepEqual"](v45, []));
  }),
  test("aigenText state sync: running state shows unified loading instead of prompt validation", () => {
    const v55 = createAIGenTextNodeStateSyncModule({ store: {} }),
      v56 = Object["assign"](Object["create"](v55), {
        _data: { isGenerating: true, jobStatus: "running" },
        promptEl: { innerText: "" },
        btnEl: { disabled: false, style: { cursor: "" } },
      });
    (v55["_updateSubmitButtonState"]["call"](v56),
      strict["equal"](v56["btnEl"]["disabled"], true),
      strict["equal"](
        v56["btnEl"]["style"]["cursor"],
        "var(--unavailable-cursor)",
      ),
      strict["match"](v56["btnEl"]["innerHTML"], /animation:spin/));
  }),
  test("aigenText state sync: 复制模式下不使用旧 outputScrollTop 还原滚动位置", () => {
    const v57 = createAIGenTextNodeStateSyncModule({
        store: {
          getState: () => ({ pickConnectMode: {}, nodes: {} }),
          getIncomingEdges: () => [],
        },
        getDisplayModelName: (v58) => v58,
      }),
      v59 = {
        scrollTop: 88,
        classList: {
          contains(v60) {
            return v60 === "is-text-selection-active";
          },
        },
        getAttribute() {
          return "false";
        },
      };
    let v61 = 0;
    const v62 = Object["assign"](Object["create"](v57), {
      nodeId: "node-text-scroll-active",
      _data: {},
      _outputScrollTop: 88,
      outputEl: v59,
      _renderOutputText: () => {
        v61 += 1;
      },
      _renderRefBar: () => {},
      _syncPromptBoxSizeFromData: () => {},
      _updateSubmitButtonState: () => {},
    });
    (v57["update"]["call"](v62, {
      id: v62["nodeId"],
      type: "ai-text",
      outputText: "next",
      outputScrollTop: 5,
    }),
      strict["equal"](v59["scrollTop"], 88),
      strict["equal"](v62["_outputScrollTop"], 88),
      strict["equal"](v61, 0));
  }),
  test("aigenText state sync: 普通滚动待保存时不使用旧 outputScrollTop 还原滚动位置", () => {
    const v63 = createAIGenTextNodeStateSyncModule({
        store: {
          getState: () => ({ pickConnectMode: {}, nodes: {} }),
          getIncomingEdges: () => [],
        },
        getDisplayModelName: (v64) => v64,
      }),
      v65 = {
        scrollTop: 88,
        classList: {
          contains() {
            return false;
          },
        },
        getAttribute() {
          return "false";
        },
      };
    let v66 = 0;
    const v67 = Object["assign"](Object["create"](v63), {
      nodeId: "node-text-scroll-dirty",
      _data: {},
      _lastRenderedOutputText: "next",
      _outputScrollTop: 88,
      _outputScrollTopDirty: true,
      outputEl: v65,
      _renderOutputText: () => {
        v66 += 1;
      },
      _renderRefBar: () => {},
      _syncPromptBoxSizeFromData: () => {},
      _updateSubmitButtonState: () => {},
    });
    (v63["update"]["call"](v67, {
      id: v67["nodeId"],
      type: "ai-text",
      outputText: "next",
      outputScrollTop: 5,
    }),
      strict["equal"](v65["scrollTop"], 88),
      strict["equal"](v67["_outputScrollTop"], 88),
      strict["equal"](v67["_outputScrollTopDirty"], true),
      strict["equal"](v66, 0));
  }),
  test("aigenText submit button: empty editor can generate from non-empty text input", () => {
    const v68 = "node-text-target",
      v69 = "node-text-source",
      v70 = {
        nodes: {
          [v68]: { id: v68, type: "ai-text" },
          [v69]: {
            id: v69,
            type: "source-text",
            content: "来自文本入参的提示词",
          },
        },
      },
      v71 = [{ id: "edge-text-input", sourceId: v69, targetId: v68 }],
      v72 = createAIGenTextNodeStateSyncModule({
        store: { getState: () => v70, getIncomingEdges: () => v71 },
      }),
      v73 = Object["assign"](Object["create"](v72), {
        nodeId: v68,
        _data: v70["nodes"][v68],
        promptEl: { innerText: "", childNodes: [] },
        btnEl: createSubmitButtonStub(),
      });
    (v73["_updateSubmitButtonState"](),
      strict["equal"](v73["btnEl"]["disabled"], false),
      strict["equal"](v73["btnEl"]["style"]["cursor"], ""));
  }));
function makeTextRefClassList(v74) {
  return {
    contains(v75) {
      return String(v74["className"] || "")
        ["split"](/\s+/)
        ["includes"](v75);
    },
    add(...v76) {
      const v77 = new Set(
        String(v74["className"] || "")
          ["split"](/\s+/)
          ["filter"](Boolean),
      );
      (v76["forEach"]((v78) => v77["add"](String(v78 || ""))),
        (v74["className"] = Array["from"](v77)["join"]("\x20")));
    },
    remove(...v79) {
      const v80 = new Set(v79["map"]((v81) => String(v81 || "")));
      v74["className"] = String(v74["className"] || "")
        ["split"](/\s+/)
        ["filter"]((v82) => v82 && !v80["has"](v82))
        ["join"]("\x20");
    },
  };
}
function createTextRefFakeElement(v83 = "div") {
  const v84 = {
    tagName: String(v83 || "div")["toUpperCase"](),
    className: "",
    dataset: {},
    attributes: {},
    childNodes: [],
    parentElement: null,
    style: {},
    _innerHTML: "",
    _innerHTMLSetCount: 0,
    classList: null,
    set innerHTML(v85) {
      ((v84["_innerHTMLSetCount"] += 1),
        (v84["_innerHTML"] = String(v85 || "")),
        (v84["childNodes"] = []));
      if (v84["_innerHTML"]["includes"]("prompt-attachment-btn")) {
        const v86 = createTextRefFakeElement("div");
        ((v86["className"] = "prompt-attachment-btn"), v84["appendChild"](v86));
      }
      if (v84["_innerHTML"]["includes"]("ref-thumb-container")) {
        const v87 = createTextRefFakeElement("div");
        ((v87["className"] = "ref-thumb-container"), v84["appendChild"](v87));
      }
    },
    get innerHTML() {
      return v84["_innerHTML"];
    },
    appendChild(v88) {
      if (v88["parentElement"]) {
        const v89 = v88["parentElement"]["childNodes"]["indexOf"](v88);
        if (v89 >= 0) v88["parentElement"]["childNodes"]["splice"](v89, 1);
      }
      return (
        (v88["parentElement"] = v84),
        (v88["parentNode"] = v84),
        v84["childNodes"]["push"](v88),
        v88
      );
    },
    remove() {
      const v90 = v84["parentElement"];
      if (!v90) return;
      const v91 = v90["childNodes"]["indexOf"](v84);
      if (v91 >= 0) v90["childNodes"]["splice"](v91, 1);
      ((v84["parentElement"] = null), (v84["parentNode"] = null));
    },
    setAttribute(v92, v93) {
      v84["attributes"][String(v92 || "")] = String(v93 || "");
    },
    addEventListener() {},
    matches(v94) {
      if (v94["startsWith"]("."))
        return v84["classList"]["contains"](v94["slice"](1));
      return false;
    },
    querySelector(v95) {
      return v84["querySelectorAll"](v95)[0] || null;
    },
    querySelectorAll(v96) {
      const v97 = [],
        v98 = (v99) => {
          if (v96["startsWith"]("."))
            return v99["classList"]?.["contains"](v96["slice"](1));
          return false;
        },
        v100 = (v101) => {
          v101["childNodes"]["forEach"]((v102) => {
            if (v98(v102)) v97["push"](v102);
            v100(v102);
          });
        };
      return (v100(v84), v97);
    },
  };
  return ((v84["classList"] = makeTextRefClassList(v84)), v84);
}
test("aigenText state sync: ref bar reuses thumbnails when source signature changes", () => {
  const v103 = globalThis["document"];
  globalThis["document"] = { createElement: createTextRefFakeElement };
  try {
    const v104 = "node-text-refbar",
      v105 = "node-image-ref",
      v106 = { id: "edge-image", sourceId: v105, targetId: v104 },
      v107 = {
        pickConnectMode: {},
        nodes: {
          [v104]: { id: v104, type: "ai-text" },
          [v105]: {
            id: v105,
            type: "source-image",
            src: "data:image/png;base64,a",
          },
        },
        edges: { [v106["id"]]: v106 },
      },
      v108 = createAIGenTextNodeStateSyncModule({
        store: { getState: () => v107, getIncomingEdges: () => [v106] },
        ensureThumbDecoded: () => {},
        revealRefThumbMedia: () => {},
        _syncPillLabels: () => {},
      }),
      v109 = Object["assign"](Object["create"](v108), {
        nodeId: v104,
        refBarEl: createTextRefFakeElement("div"),
        _bindDragSort: () => {},
        _syncBtnIconState: () => {},
      });
    v108["_renderRefBar"]["call"](v109);
    const v110 = v109["refBarEl"]["querySelector"](".ref-thumb-container"),
      v111 = v110["querySelector"](".ref-thumb-wrap"),
      v112 = v109["refBarEl"]["_innerHTMLSetCount"];
    (strict["ok"](v112 >= 1),
      (v107["nodes"][v105] = {
        ...v107["nodes"][v105],
        src: "data:image/png;base64,b",
      }),
      v108["_renderRefBar"]["call"](v109),
      strict["equal"](v109["refBarEl"]["_innerHTMLSetCount"], v112),
      strict["equal"](v110["querySelector"](".ref-thumb-wrap"), v111),
      strict["match"](v111["innerHTML"], /base64,b/));
  } finally {
    globalThis["document"] = v103;
  }
});

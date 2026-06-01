import test from "node:test";
import strict from "node:assert/strict";
import {
  createAIGenerateNodeStateSyncModule,
  resolveRefImageRenderSources,
} from "./stateSyncModule.js";
import { createAIGenerateNodeUiModule } from "./uiModule.js";
function createButtonStub() {
  const v0 = new Set(["is-rh-busy"]);
  return {
    disabled: true,
    title: "busy",
    innerHTML:
      "<svg\x20style=\x22animation:spin\x201s\x20linear\x20infinite\x22></svg>",
    style: { color: "var(--white)", cursor: "" },
    classList: {
      add(v1) {
        v0["add"](String(v1 || ""));
      },
      remove(v2) {
        v0["delete"](String(v2 || ""));
      },
      contains(v3) {
        return v0["has"](String(v3 || ""));
      },
    },
  };
}
function createIdleButtonStub() {
  const v4 = new Set();
  return {
    disabled: false,
    title: "",
    innerHTML: "",
    style: { color: "", cursor: "" },
    dataset: {},
    classList: {
      add(...v5) {
        v5["forEach"]((v6) => v4["add"](String(v6 || "")));
      },
      remove(...v7) {
        v7["forEach"]((v8) => v4["delete"](String(v8 || "")));
      },
      toggle(v9, v10) {
        const v11 = String(v9 || "");
        if (v10 === true) return (v4["add"](v11), true);
        if (v10 === false) return (v4["delete"](v11), false);
        if (v4["has"](v11)) return (v4["delete"](v11), false);
        return (v4["add"](v11), true);
      },
      contains(v12) {
        return v4["has"](String(v12 || ""));
      },
    },
    setAttribute(v13, v14) {
      this["dataset"][String(v13 || "")] = String(v14 || "");
    },
    removeAttribute(v15) {
      delete this["dataset"][String(v15 || "")];
    },
  };
}
class FakeClassList {
  constructor(v16) {
    this["owner"] = v16;
  }
  ["_tokens"]() {
    return String(this["owner"]["className"] || "")
      ["split"](/\s+/)
      ["filter"](Boolean);
  }
  ["contains"](v17) {
    return this["_tokens"]()["includes"](String(v17 || ""));
  }
  ["add"](...v18) {
    const v19 = new Set(this["_tokens"]());
    (v18["forEach"]((v20) => v19["add"](String(v20 || ""))),
      (this["owner"]["className"] = Array["from"](v19)["join"]("\x20")));
  }
  ["remove"](...v21) {
    const v22 = new Set(v21["map"]((v23) => String(v23 || "")));
    this["owner"]["className"] = this["_tokens"]()
      ["filter"]((v24) => !v22["has"](v24))
      ["join"]("\x20");
  }
  ["toggle"](v25, v26) {
    const v27 = String(v25 || ""),
      v28 = this["contains"](v27),
      v29 = v26 === undefined ? !v28 : Boolean(v26);
    if (v29) this["add"](v27);
    else this["remove"](v27);
    return v29;
  }
}
class FakeElement {
  constructor({
    className: className = "",
    dataset: dataset = {},
    tagName: tagName = "div",
  } = {}) {
    ((this["tagName"] = String(tagName || "div")["toUpperCase"]()),
      (this["className"] = className),
      (this["dataset"] = { ...dataset }),
      (this["style"] = {}),
      (this["attributes"] = {}),
      (this["children"] = []),
      (this["parentNode"] = null),
      (this["parentElement"] = null),
      (this["listeners"] = new Map()),
      (this["classList"] = new FakeClassList(this)),
      (this["_innerHTML"] = ""));
  }
  get ["innerHTML"]() {
    return this["_innerHTML"];
  }
  set ["innerHTML"](v30) {
    this["_innerHTML"] = String(v30 || "");
    if (!this["_innerHTML"]["includes"]("ref-thumb-container")) return;
    this["children"] = [];
    const v31 = new FakeElement({ className: "prompt-attachment-btn" }),
      v32 = new FakeElement({ className: "ref-thumb-container" });
    (this["appendChild"](v31),
      this["appendChild"](v32),
      this["_innerHTML"]["includes"]('data-ref-slot="replaceTarget"') &&
        v32["appendChild"](
          new FakeElement({
            className: "ref-thumb-wrap ref-upload-slot",
            dataset: {
              refSlot: "replaceTarget",
              slot: this["_innerHTML"]["includes"]('data-slot="replaceTarget"')
                ? "replaceTarget"
                : "",
              kind: this["_innerHTML"]["includes"]('data-kind="image"')
                ? "image"
                : "",
            },
          }),
        ),
      this["_innerHTML"]["includes"]("data-ref-slot=\x22replacedImage\x22") &&
        v32["appendChild"](
          new FakeElement({
            className: "ref-thumb-wrap ref-upload-slot",
            dataset: {
              refSlot: "replacedImage",
              slot: this["_innerHTML"]["includes"]('data-slot="replacedImage"')
                ? "replacedImage"
                : "",
              kind: this["_innerHTML"]["includes"]('data-kind="image"')
                ? "image"
                : "",
            },
          }),
        ));
  }
  get ["nextSibling"]() {
    if (!this["parentNode"]) return null;
    const v33 = this["parentNode"]["children"],
      v34 = v33["indexOf"](this);
    return v34 >= 0 ? v33[v34 + 1] || null : null;
  }
  ["appendChild"](v35) {
    if (v35["parentNode"]) v35["remove"]();
    return (
      this["children"]["push"](v35),
      (v35["parentNode"] = this),
      (v35["parentElement"] = this),
      v35
    );
  }
  ["insertBefore"](v36, v37) {
    if (v36["parentNode"]) v36["remove"]();
    const v38 = v37 ? this["children"]["indexOf"](v37) : -1;
    if (v38 >= 0) this["children"]["splice"](v38, 0, v36);
    else this["children"]["push"](v36);
    return ((v36["parentNode"] = this), (v36["parentElement"] = this), v36);
  }
  ["remove"]() {
    if (!this["parentNode"]) return;
    const v39 = this["parentNode"]["children"],
      v40 = v39["indexOf"](this);
    if (v40 >= 0) v39["splice"](v40, 1);
    ((this["parentNode"] = null), (this["parentElement"] = null));
  }
  ["replaceWith"](v41) {
    if (!this["parentNode"]) return;
    const v42 = this["parentNode"],
      v43 = v42["children"],
      v44 = v43["indexOf"](this);
    if (v44 < 0) return;
    if (v41["parentNode"]) v41["remove"]();
    ((v43[v44] = v41),
      (v41["parentNode"] = v42),
      (v41["parentElement"] = v42),
      (this["parentNode"] = null),
      (this["parentElement"] = null));
  }
  ["setAttribute"](v45, v46) {
    this["attributes"][String(v45)] = String(v46);
  }
  ["getAttribute"](v47) {
    return this["attributes"][String(v47)];
  }
  ["addEventListener"](v48, v49) {
    if (!this["listeners"]["has"](v48)) this["listeners"]["set"](v48, []);
    this["listeners"]["get"](v48)["push"](v49);
  }
  ["dispatch"](v50, v51) {
    for (const v52 of this["listeners"]["get"](v50) || []) v52(v51);
  }
  ["matches"](v53) {
    if (v53 === ".ref-thumb-wrap")
      return this["classList"]["contains"]("ref-thumb-wrap");
    if (v53 === ".ref-thumb-container")
      return this["classList"]["contains"]("ref-thumb-container");
    if (v53 === "[data-slot]") return !!this["dataset"]["slot"];
    return matchesFakeSelector(this, v53);
  }
  ["closest"](v54) {
    let v55 = this;
    while (v55) {
      if (v55["matches"](v54)) return v55;
      v55 = v55["parentElement"];
    }
    return null;
  }
  ["querySelector"](v56) {
    return this["querySelectorAll"](v56)[0] || null;
  }
  ["querySelectorAll"](v57) {
    const v58 = [],
      v59 = (v60) => {
        if (matchesFakeSelector(v60, v57)) v58["push"](v60);
        v60["children"]["forEach"](v59);
      };
    return (this["children"]["forEach"](v59), v58);
  }
}
function matchesFakeSelector(v61, v62) {
  if (v62 === ".prompt-attachment-btn")
    return v61["classList"]["contains"]("prompt-attachment-btn");
  if (v62 === ".ref-thumb-container")
    return v61["classList"]["contains"]("ref-thumb-container");
  if (v62 === ".ref-thumb-wrap")
    return v61["classList"]["contains"]("ref-thumb-wrap");
  if (v62 === ".ref-thumb-wrap.is-drop-allow")
    return (
      v61["classList"]["contains"]("ref-thumb-wrap") &&
      v61["classList"]["contains"]("is-drop-allow")
    );
  const v63 = v62["match"](/^\.ref-upload-slot\[data-ref-slot="([^"]+)"\]$/);
  if (v63)
    return (
      v61["classList"]["contains"]("ref-upload-slot") &&
      v61["dataset"]["refSlot"] === v63[1]
    );
  const v64 = v62["match"](/^\[data-ref-slot="([^"]+)"\]$/);
  if (v64) return v61["dataset"]["refSlot"] === v64[1];
  const v65 = v62["match"](/^\[data-slot="([^"]+)"\]$/);
  if (v65) return v61["dataset"]["slot"] === v65[1];
  if (v62 === "[data-slot]") return !!v61["dataset"]["slot"];
  return false;
}
function createDragEvent(v66) {
  return {
    target: v66,
    dataTransfer: { effectAllowed: "", dropEffect: "", setData() {} },
    preventDefault() {},
    stopPropagation() {},
  };
}
(test("aigenImage state sync: 列表缩略图优先 thumbLocalPath，hover 预览优先 displayLocalPath", () => {
  const v67 = resolveRefImageRenderSources({
    id: "src-image-1",
    type: "source-image",
    originalLocalPath: "output/original.png",
    displayLocalPath: "output/display.jpg",
    thumbLocalPath: "output/thumb.jpg",
  });
  strict["deepEqual"](v67, {
    thumbSrc: "/output/thumb.jpg",
    previewSrc: "/output/display.jpg",
  });
}),
  test("aigenImage state sync: hover 预览缺少 displayLocalPath 时回退 originalLocalPath", () => {
    const v68 = resolveRefImageRenderSources({
      id: "src-image-2",
      type: "source-image",
      originalLocalPath: "output/original.png",
      thumbLocalPath: "output/thumb.jpg",
    });
    strict["deepEqual"](v68, {
      thumbSrc: "/output/thumb.jpg",
      previewSrc: "/output/original.png",
    });
  }),
  test("aigenImage state sync: ai-image 顶层缺失时回退 main image 的本地派生图", () => {
    const v69 = resolveRefImageRenderSources({
      id: "src-ai-image-1",
      type: "ai-image",
      images: [
        { localPath: "output/first.png" },
        {
          originalLocalPath: "output/final.png",
          displayLocalPath: "output/final-display.jpg",
          thumbLocalPath: "output/final-thumb.jpg",
        },
      ],
      mainImageIndex: 1,
    });
    strict["deepEqual"](v69, {
      thumbSrc: "/output/final-thumb.jpg",
      previewSrc: "/output/final-display.jpg",
    });
  }),
  test("aigenImage state sync: 顶层本地字段仍优先于 main image", () => {
    const v70 = resolveRefImageRenderSources({
      id: "src-ai-image-2",
      type: "ai-image",
      localPath: "output/top-level.png",
      displayLocalPath: "output/top-level-display.jpg",
      thumbLocalPath: "output/top-level-thumb.jpg",
      images: [
        {
          originalLocalPath: "output/nested.png",
          displayLocalPath: "output/nested-display.jpg",
          thumbLocalPath: "output/nested-thumb.jpg",
        },
      ],
      mainImageIndex: 0,
    });
    strict["deepEqual"](v70, {
      thumbSrc: "/output/top-level-thumb.jpg",
      previewSrc: "/output/top-level-display.jpg",
    });
  }),
  test("aigenImage state sync: 旧节点只有 blob 缩略图时 hover 预览回退到同一张图", () => {
    const v71 = resolveRefImageRenderSources(
      { id: "src-image-legacy-blob", type: "source-image" },
      { thumbBlobUrl: "blob:legacy-thumb" },
    );
    strict["deepEqual"](v71, {
      thumbSrc: "blob:legacy-thumb",
      previewSrc: "blob:legacy-thumb",
    });
  }),
  test("aigenImage state sync: terminal Dreamina state clears loading UI", () => {
    const v72 = globalThis["document"];
    globalThis["document"] = { activeElement: null };
    try {
      const v73 = "node-state-sync-dreamina-terminal",
        v74 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [v73]: { id: v73, model: "dreamina/4.1", provider: "dreamina" },
          },
          edges: {},
        };
      let v75 = 0,
        v76 = 0,
        v77 = 0,
        v78 = 0;
      const v79 = createAIGenerateNodeStateSyncModule({
          store: { getState: () => v74, getIncomingEdges: () => [] },
          getImage: async () => null,
          getDisplayModelName: (v80) => v80,
          stopLoading: () => {
            v75 += 1;
          },
        }),
        v81 = Object["assign"](Object["create"](v79), {
          nodeId: v73,
          _data: v74["nodes"][v73],
          _isGenerating: true,
          _dreaminaActiveSubmitId: "sid-terminal",
          _refThumbObjectUrls: new Map(),
          previewEl: {},
          btnEl: createButtonStub(),
          promptEl: { innerHTML: "", innerText: "prompt" },
          _normalizeDreaminaNodeData: (v82) => v82,
          _loadAndDisplayImage: () => {},
          _applyMaskPreview: () => {},
          _applyModelParamVisibility: () => {},
          _stopDreaminaRecovery: () => {
            v76 += 1;
          },
          _maybeResumeDreaminaTaskImpl: () => {
            v77 += 1;
          },
          _updateSubmitButtonState: () => {
            v78 += 1;
          },
        });
      (v79["update"]["call"](v81, {
        id: v73,
        model: "dreamina/4.1",
        provider: "dreamina",
        jobStatus: "error",
        dreaminaTaskStatus: "error",
        dreaminaTaskPhase: "generating",
        isGenerating: false,
      }),
        strict["equal"](v81["_isGenerating"], false),
        strict["equal"](v81["_dreaminaActiveSubmitId"], ""),
        strict["equal"](v75, 1),
        strict["equal"](v76, 1),
        strict["equal"](v77, 0),
        strict["equal"](v78, 1),
        strict["equal"](
          v81["btnEl"]["classList"]["contains"]("is-rh-busy"),
          false,
        ),
        strict["equal"](v81["btnEl"]["title"], "生成"),
        strict["doesNotMatch"](v81["btnEl"]["innerHTML"], /animation:spin/));
    } finally {
      typeof v72 === "undefined"
        ? delete globalThis["document"]
        : (globalThis["document"] = v72);
    }
  }),
  test("aigenImage\x20state\x20sync:\x20running\x20RH\x20task\x20keeps\x20loading\x20when\x20inactive\x20Dreamina\x20fields\x20are\x20done", () => {
    const v83 = globalThis["document"];
    globalThis["document"] = { activeElement: null };
    try {
      const v84 = "node-state-sync-rh-running",
        v85 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [v84]: {
              id: v84,
              model: "runninghub/2044874075721441281",
              provider: "runninghubwf",
            },
          },
          edges: {},
        };
      let v86 = 0,
        v87 = 0,
        v88 = 0;
      const v89 = createAIGenerateNodeStateSyncModule({
          store: { getState: () => v85, getIncomingEdges: () => [] },
          getImage: async () => null,
          getDisplayModelName: (v90) => v90,
          startLoading: () => {
            v86 += 1;
          },
          stopLoading: () => {
            v87 += 1;
          },
        }),
        v91 = Object["assign"](Object["create"](v89), {
          nodeId: v84,
          _data: v85["nodes"][v84],
          _isGenerating: true,
          _refThumbObjectUrls: new Map(),
          previewEl: {},
          btnEl: createButtonStub(),
          promptEl: { innerHTML: "", innerText: "prompt" },
          _normalizeDreaminaNodeData: (v92) => v92,
          _loadAndDisplayImage: () => {},
          _applyMaskPreview: () => {},
          _applyModelParamVisibility: () => {},
          _maybeResumeRunningHubTaskImpl: () => {
            v88 += 1;
          },
          _maybeResumeDreaminaTaskImpl: () => {},
          _maybeResumeAsyncTaskImpl: () => {},
          _updateSubmitButtonState: () => {},
        });
      (v89["update"]["call"](v91, {
        id: v84,
        model: "runninghub/2044874075721441281",
        provider: "runninghubwf",
        imageUrl: "/output/previous.png",
        isGenerating: true,
        jobStatus: "running",
        rhTaskStatus: "pending",
        dreaminaTaskStatus: "idle",
        dreaminaTaskPhase: "done",
        asyncTaskStatus: "idle",
      }),
        strict["equal"](v91["_isGenerating"], true),
        strict["equal"](v86, 1),
        strict["equal"](v87, 0),
        strict["equal"](v88, 1),
        strict["equal"](
          v91["btnEl"]["classList"]["contains"]("is-rh-busy"),
          true,
        ),
        strict["match"](v91["btnEl"]["innerHTML"], /animation:spin/));
    } finally {
      typeof v83 === "undefined"
        ? delete globalThis["document"]
        : (globalThis["document"] = v83);
    }
  }),
  test("aigenImage\x20state\x20sync:\x20live\x20running\x20state\x20restarts\x20loading\x20after\x20remount", () => {
    const v93 = globalThis["document"];
    globalThis["document"] = { activeElement: null };
    try {
      const v94 = "node-state-sync-live-running",
        v95 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [v94]: {
              id: v94,
              model: "volcengine/seedream-4.0",
              provider: "volcengine",
            },
          },
          edges: {},
        };
      let v96 = 0,
        v97 = 0;
      const v98 = createAIGenerateNodeStateSyncModule({
          store: { getState: () => v95, getIncomingEdges: () => [] },
          getImage: async () => null,
          getDisplayModelName: (v99) => v99,
          startLoading: () => {
            v96 += 1;
          },
          stopLoading: () => {
            v97 += 1;
          },
        }),
        v100 = Object["assign"](Object["create"](v98), {
          nodeId: v94,
          _data: v95["nodes"][v94],
          _isGenerating: false,
          _refThumbObjectUrls: new Map(),
          previewEl: {},
          btnEl: createIdleButtonStub(),
          promptEl: { innerHTML: "", innerText: "prompt" },
          _normalizeDreaminaNodeData: (v101) => v101,
          _loadAndDisplayImage: () => {},
          _applyMaskPreview: () => {},
          _applyModelParamVisibility: () => {},
          _maybeResumeRunningHubTaskImpl: () => {},
          _maybeResumeDreaminaTaskImpl: () => {},
          _maybeResumeAsyncTaskImpl: () => {},
          _updateSubmitButtonState: () => {},
        });
      (v98["update"]["call"](v100, {
        id: v94,
        model: "volcengine/seedream-4.0",
        provider: "volcengine",
        isGenerating: true,
        jobStatus: "running",
        generationStartTime: 1000,
        generationDuration: null,
      }),
        strict["equal"](v100["_isGenerating"], true),
        strict["equal"](v96, 1),
        strict["equal"](v97, 0));
    } finally {
      typeof v93 === "undefined"
        ? delete globalThis["document"]
        : (globalThis["document"] = v93);
    }
  }),
  test("aigenImage submit button: running RH state renders cancel button from unified state", () => {
    const v102 = "node-image-rh-running-button-state",
      v103 = {
        nodes: {
          [v102]: {
            id: v102,
            model: "runninghub/2044874075721441281",
            provider: "runninghubwf",
            rhTaskId: "rh-image-running",
            rhTaskStatus: "running",
            jobStatus: "running",
            isGenerating: true,
          },
        },
      },
      v104 = createAIGenerateNodeUiModule({
        store: { getState: () => v103, getIncomingEdges: () => [] },
      }),
      v105 = Object["assign"](Object["create"](v104), {
        nodeId: v102,
        _data: v103["nodes"][v102],
        _rhCancelInFlight: false,
        promptEl: { innerText: "prompt" },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => true,
      });
    (v104["_updateSubmitButtonState"]["call"](v105),
      strict["equal"](v105["btnEl"]["disabled"], false),
      strict["equal"](v105["btnEl"]["style"]["cursor"], ""),
      strict["equal"](
        v105["btnEl"]["classList"]["contains"]("is-task-cancel"),
        true,
      ),
      strict["match"](v105["btnEl"]["innerHTML"], /v2-task-cancel-spin/),
      (v105["_rhCancelInFlight"] = true),
      v104["_updateSubmitButtonState"]["call"](v105),
      strict["equal"](v105["btnEl"]["disabled"], true),
      strict["equal"](
        v105["btnEl"]["style"]["cursor"],
        "var(--unavailable-cursor)",
      ),
      strict["equal"](
        v105["btnEl"]["classList"]["contains"]("is-task-cancel"),
        true,
      ),
      (v103["nodes"][v102] = {
        ...v103["nodes"][v102],
        rhTaskStatus: "failed",
        jobStatus: "error",
        isGenerating: true,
      }),
      (v105["_data"] = v103["nodes"][v102]),
      (v105["_rhCancelInFlight"] = false),
      v104["_updateSubmitButtonState"]["call"](v105),
      strict["equal"](
        v105["btnEl"]["classList"]["contains"]("is-task-cancel"),
        false,
      ),
      strict["doesNotMatch"](
        v105["btnEl"]["innerHTML"],
        /v2-task-cancel-spin/,
      ));
  }),
  test("aigenImage submit button: finished async status is terminal and unlocks generation", () => {
    const v106 = "node-image-grsai-finished-button-state",
      v107 = {
        nodes: {
          [v106]: {
            id: v106,
            type: "ai-image",
            model: "nano-banana-2",
            provider: "grsai",
            asyncTaskProvider: "grsai",
            asyncTaskKind: "image",
            asyncTaskId: "task-finished",
            asyncTaskStatus: "finished",
            jobStatus: "running",
            isGenerating: true,
          },
        },
      },
      v108 = createAIGenerateNodeUiModule({
        store: { getState: () => v107, getIncomingEdges: () => [] },
      }),
      v109 = Object["assign"](Object["create"](v108), {
        nodeId: v106,
        _data: v107["nodes"][v106],
        promptEl: { innerText: "prompt" },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => false,
      });
    (v108["_updateSubmitButtonState"]["call"](v109),
      strict["equal"](v109["btnEl"]["disabled"], false),
      strict["equal"](v109["btnEl"]["style"]["cursor"], ""),
      strict["doesNotMatch"](v109["btnEl"]["innerHTML"], /animation:spin/));
  }),
  test("aigenImage submit button: empty editor can generate from non-empty text input", () => {
    const v110 = "node-image-text-input-button",
      v111 = "node-image-text-input-source",
      v112 = {
        nodes: {
          [v110]: {
            id: v110,
            type: "ai-image",
            model: "gpt-image-2",
            provider: "grsai",
          },
          [v111]: {
            id: v111,
            type: "source-text",
            text: "用文本入参生成一张海报",
          },
        },
      },
      v113 = [{ id: "edge-image-text-input", sourceId: v111, targetId: v110 }],
      v114 = createAIGenerateNodeUiModule({
        store: { getState: () => v112, getIncomingEdges: () => v113 },
      }),
      v115 = Object["assign"](Object["create"](v114), {
        nodeId: v110,
        _data: v112["nodes"][v110],
        promptEl: { innerText: "", childNodes: [] },
        btnEl: createIdleButtonStub(),
        _isRunninghubWorkflowModel: () => false,
      });
    (v114["_updateSubmitButtonState"]["call"](v115),
      strict["equal"](v115["btnEl"]["disabled"], false),
      strict["equal"](v115["btnEl"]["style"]["cursor"], ""));
  }),
  test("aigenImage ui normalize: APIMart Seedream manifest models are preserved", () => {
    const v116 = "node-apimart-seedream-preserve",
      v117 = {
        nodes: {
          [v116]: {
            id: v116,
            model: "apimart/seedream-4.0",
            provider: "apimart",
            imageSize: "4K",
          },
        },
      },
      v118 = [],
      v119 = createAIGenerateNodeUiModule({
        store: {
          getState: () => v117,
          updateNodeData: (v120, v121) =>
            v118["push"]({ id: v120, patch: v121 }),
        },
      }),
      v122 = Object["assign"](Object["create"](v119), { nodeId: v116 }),
      v123 = v119["_normalizeLegacySeedreamModel"]["call"](
        v122,
        v117["nodes"][v116],
      );
    (strict["equal"](v123["model"], "apimart/seedream-4.0"),
      strict["equal"](v123["provider"], "apimart"),
      strict["equal"](v123["imageSize"], "4K"),
      strict["deepEqual"](v118, []));
  }),
  test("aigenImage state sync: person replace V3 fixed image slots can swap", async () => {
    const v124 = globalThis["document"];
    globalThis["document"] = {
      createElement: (v125) => new FakeElement({ tagName: v125 }),
    };
    const v126 = "node-person-replace-v3";
    try {
      const v127 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [v126]: {
              id: v126,
              type: "ai-image",
              model: "runninghub/2041177685895946242",
              provider: "runninghubwf",
            },
            imageA: {
              id: "imageA",
              type: "source-image",
              thumbLocalPath: "output/a-thumb.png",
              displayLocalPath: "output/a-display.png",
              originalLocalPath: "output/a.png",
            },
            imageB: {
              id: "imageB",
              type: "source-image",
              thumbLocalPath: "output/b-thumb.png",
              displayLocalPath: "output/b-display.png",
              originalLocalPath: "output/b.png",
            },
          },
          edges: {
            edgeA: {
              id: "edgeA",
              sourceId: "imageA",
              targetId: v126,
              refSlot: "replaceTarget",
            },
            edgeB: {
              id: "edgeB",
              sourceId: "imageB",
              targetId: v126,
              refSlot: "replacedImage",
            },
          },
        },
        v128 = [],
        v129 = {
          getState: () => v127,
          getIncomingEdges: (v130) =>
            Object["values"](v127["edges"])["filter"](
              (v131) => v131["targetId"] === v130,
            ),
          updateEdgesBatch(v132, v133) {
            v128["push"]({ removeIds: v132, addedEdges: v133 });
          },
        },
        v134 = createAIGenerateNodeStateSyncModule({
          store: v129,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        v135 = new FakeElement({ className: "node-ref-bar" }),
        v136 = Object["assign"](Object["create"](v134), {
          nodeId: v126,
          _data: v127["nodes"][v126],
          _refThumbObjectUrls: new Map(),
          refBarEl: v135,
          promptEl: { innerText: "", querySelectorAll: () => [] },
        });
      await v134["_renderRefBarImpl"]["call"](v136);
      const v137 = v135["querySelector"]('[data-ref-slot="replaceTarget"]'),
        v138 = v135["querySelector"]('[data-ref-slot="replacedImage"]'),
        v139 = v135["querySelector"](".ref-thumb-container");
      (strict["equal"](v137["dataset"]["slot"], "replaceTarget"),
        strict["equal"](v138["dataset"]["slot"], "replacedImage"),
        strict["equal"](v137["dataset"]["kind"], "image"),
        strict["equal"](v138["dataset"]["kind"], "image"),
        strict["equal"](v137["getAttribute"]("draggable"), "true"),
        strict["equal"](v138["getAttribute"]("draggable"), "true"),
        strict["equal"](
          v137["classList"]["contains"]("ref-upload-slot"),
          false,
        ),
        strict["equal"](
          v138["classList"]["contains"]("ref-upload-slot"),
          false,
        ),
        v139["dispatch"]("dragstart", createDragEvent(v137)),
        strict["equal"](v137["classList"]["contains"]("is-dragging"), true),
        v139["dispatch"]("dragover", createDragEvent(v138)),
        strict["equal"](v138["classList"]["contains"]("is-drop-allow"), true),
        strict["deepEqual"](
          v139["children"]["map"]((v140) => v140["dataset"]["edgeId"] || ""),
          ["edgeA", "edgeB"],
        ),
        v139["dispatch"]("drop", createDragEvent(v138)),
        strict["equal"](v138["classList"]["contains"]("is-drop-allow"), false),
        v139["dispatch"]("dragend", createDragEvent(v137)),
        strict["equal"](v137["classList"]["contains"]("is-dragging"), false),
        strict["equal"](v128["length"], 1),
        strict["deepEqual"](v128[0]["removeIds"], ["edgeA", "edgeB"]),
        strict["deepEqual"](
          v128[0]["addedEdges"]["map"]((v141) => [v141["id"], v141["refSlot"]]),
          [
            ["edgeA", "replacedImage"],
            ["edgeB", "replaceTarget"],
          ],
        ));
      for (const v142 of v128[0]["removeIds"]) {
        delete v127["edges"][v142];
      }
      for (const v143 of v128[0]["addedEdges"]) {
        v127["edges"][v143["id"]] = v143;
      }
      await v134["_renderRefBarImpl"]["call"](v136);
      const v144 = v135["querySelector"]('[data-ref-slot="replaceTarget"]'),
        v145 = v135["querySelector"]('[data-ref-slot="replacedImage"]');
      (strict["equal"](v144["dataset"]["edgeId"], "edgeB"),
        strict["equal"](v144["dataset"]["sourceId"], "imageB"),
        strict["equal"](v145["dataset"]["edgeId"], "edgeA"),
        strict["equal"](v145["dataset"]["sourceId"], "imageA"));
    } finally {
      if (typeof v124 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v124;
    }
  }),
  test("aigenImage state sync: modelApi fixed image slots render from manifest", async () => {
    const v146 = globalThis["document"];
    globalThis["document"] = {
      createElement: (v147) => new FakeElement({ tagName: v147 }),
    };
    const v148 = "node-youchuan-fixed-slots";
    try {
      const v149 = {
          selectedNodeIds: [v148],
          pickConnectMode: {},
          nodes: {
            [v148]: {
              id: v148,
              type: "ai-image",
              model: "runninghub-model/youchuan-v6",
              provider: "runninghub",
            },
            mainImage: {
              id: "mainImage",
              type: "source-image",
              thumbLocalPath: "output/main-thumb.png",
              displayLocalPath: "output/main-display.png",
              originalLocalPath: "output/main.png",
            },
            styleImage: {
              id: "styleImage",
              type: "source-image",
              thumbLocalPath: "output/style-thumb.png",
              displayLocalPath: "output/style-display.png",
              originalLocalPath: "output/style.png",
            },
          },
          edges: {
            edgeMain: {
              id: "edgeMain",
              sourceId: "mainImage",
              targetId: v148,
              refSlot: "imageUrl",
            },
            edgeStyle: {
              id: "edgeStyle",
              sourceId: "styleImage",
              targetId: v148,
              refSlot: "sref",
            },
          },
        },
        v150 = {
          getState: () => v149,
          getStateRaw: () => v149,
          getIncomingEdges: (v151) =>
            Object["values"](v149["edges"])["filter"](
              (v152) => v152["targetId"] === v151,
            ),
          updateEdgesBatch() {},
        },
        v153 = createAIGenerateNodeStateSyncModule({
          store: v150,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        v154 = new FakeElement({ className: "node-ref-bar" }),
        v155 = Object["assign"](Object["create"](v153), {
          nodeId: v148,
          _data: v149["nodes"][v148],
          _refThumbObjectUrls: new Map(),
          refBarEl: v154,
          promptEl: { innerText: "", querySelectorAll: () => [] },
        });
      await v153["_renderRefBarImpl"]["call"](v155);
      const v156 = v154["querySelector"]('[data-ref-slot="imageUrl"]'),
        v157 = v154["querySelector"]("[data-ref-slot=\x22cref\x22]"),
        v158 = v154["querySelector"]('[data-ref-slot="sref"]');
      (strict["equal"](v156["dataset"]["edgeId"], "edgeMain"),
        strict["equal"](v156["dataset"]["kind"], "image"),
        strict["equal"](v157["classList"]["contains"]("ref-upload-slot"), true),
        strict["equal"](v158["dataset"]["edgeId"], "edgeStyle"),
        strict["equal"](v158["dataset"]["sourceId"], "styleImage"));
    } finally {
      if (typeof v146 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v146;
    }
  }),
  test("aigenImage state sync: Midjourney V7 renders only main and style fixed slots", async () => {
    const v159 = globalThis["document"];
    globalThis["document"] = {
      createElement: (v160) => new FakeElement({ tagName: v160 }),
    };
    const v161 = "node-youchuan-v7-fixed-slots";
    try {
      const v162 = {
          selectedNodeIds: [v161],
          pickConnectMode: {},
          nodes: {
            [v161]: {
              id: v161,
              type: "ai-image",
              model: "runninghub-model/youchuan-v7",
              provider: "runninghub",
            },
            mainImage: {
              id: "mainImage",
              type: "source-image",
              thumbLocalPath: "output/main-thumb.png",
              displayLocalPath: "output/main-display.png",
              originalLocalPath: "output/main.png",
            },
            styleImage: {
              id: "styleImage",
              type: "source-image",
              thumbLocalPath: "output/style-thumb.png",
              displayLocalPath: "output/style-display.png",
              originalLocalPath: "output/style.png",
            },
          },
          edges: {
            edgeMain: {
              id: "edgeMain",
              sourceId: "mainImage",
              targetId: v161,
              refSlot: "imageUrl",
            },
            edgeStyle: {
              id: "edgeStyle",
              sourceId: "styleImage",
              targetId: v161,
              refSlot: "sref",
            },
          },
        },
        v163 = {
          getState: () => v162,
          getStateRaw: () => v162,
          getIncomingEdges: (v164) =>
            Object["values"](v162["edges"])["filter"](
              (v165) => v165["targetId"] === v164,
            ),
          updateEdgesBatch() {},
        },
        v166 = createAIGenerateNodeStateSyncModule({
          store: v163,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        v167 = new FakeElement({ className: "node-ref-bar" }),
        v168 = Object["assign"](Object["create"](v166), {
          nodeId: v161,
          _data: v162["nodes"][v161],
          _refThumbObjectUrls: new Map(),
          refBarEl: v167,
          promptEl: { innerText: "", querySelectorAll: () => [] },
        });
      await v166["_renderRefBarImpl"]["call"](v168);
      const v169 = v167["querySelector"]('[data-ref-slot="imageUrl"]'),
        v170 = v167["querySelector"]('[data-ref-slot="cref"]'),
        v171 = v167["querySelector"]('[data-ref-slot="sref"]');
      (strict["equal"](v169["dataset"]["edgeId"], "edgeMain"),
        strict["equal"](v169["dataset"]["kind"], "image"),
        strict["equal"](v170, null),
        strict["equal"](v171["dataset"]["edgeId"], "edgeStyle"),
        strict["equal"](v171["dataset"]["sourceId"], "styleImage"));
    } finally {
      if (typeof v159 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v159;
    }
  }),
  test("aigenImage state sync: refSlot changes trigger immediate ref bar refresh", () => {
    const v172 = globalThis["document"],
      v173 = "node-person-replace-v3-refresh",
      v174 = {
        selectedNodeIds: [v173],
        pickConnectMode: {},
        nodes: {
          [v173]: {
            id: v173,
            type: "ai-image",
            model: "runninghub/2041177685895946242",
            provider: "runninghubwf",
          },
          imageA: { id: "imageA", type: "source-image", _bizRev: 1 },
          imageB: { id: "imageB", type: "source-image", _bizRev: 1 },
        },
        edges: {
          edgeA: {
            id: "edgeA",
            sourceId: "imageA",
            targetId: v173,
            refSlot: "replaceTarget",
          },
          edgeB: {
            id: "edgeB",
            sourceId: "imageB",
            targetId: v173,
            refSlot: "replacedImage",
          },
        },
      };
    try {
      globalThis["document"] = { activeElement: null };
      const v175 = {
          getState: () => v174,
          getStateRaw: () => v174,
          getIncomingEdges: (v176) =>
            Object["values"](v174["edges"])["filter"](
              (v177) => v177["targetId"] === v176,
            ),
        },
        v178 = createAIGenerateNodeStateSyncModule({
          store: v175,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let v179 = 0;
      const v180 = Object["assign"](Object["create"](v178), {
        nodeId: v173,
        _data: v174["nodes"][v173],
        promptEl: { innerHTML: "", querySelectorAll: () => [] },
        _normalizeDreaminaNodeData: (v181) => v181,
        _loadAndDisplayImage: () => {},
        _applyMaskPreview: () => {},
        _applyModelParamVisibility: () => {},
        _updateSubmitButtonState: () => {},
        _renderRefBar: () => {
          v179 += 1;
        },
      });
      (v178["update"]["call"](v180, v174["nodes"][v173]),
        strict["equal"](v179, 1),
        (v174["edges"]["edgeA"] = {
          ...v174["edges"]["edgeA"],
          refSlot: "replacedImage",
        }),
        (v174["edges"]["edgeB"] = {
          ...v174["edges"]["edgeB"],
          refSlot: "replaceTarget",
        }),
        v178["update"]["call"](v180, v174["nodes"][v173]),
        strict["equal"](v179, 2));
    } finally {
      if (typeof v172 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v172;
    }
  }),
  test("aigenImage\x20state\x20sync:\x20thumbnail\x20order\x20changes\x20trigger\x20immediate\x20ref\x20bar\x20refresh", () => {
    const v182 = globalThis["document"],
      v183 = "node-image-order-refresh",
      v184 = {
        selectedNodeIds: [v183],
        pickConnectMode: {},
        nodes: {
          [v183]: {
            id: v183,
            type: "ai-image",
            model: "apimart/nano-banana-2",
            provider: "apimart",
          },
          imageA: { id: "imageA", type: "source-image", _bizRev: 1 },
          imageB: { id: "imageB", type: "source-image", _bizRev: 1 },
        },
        edges: {
          edgeA: { id: "edgeA", sourceId: "imageA", targetId: v183 },
          edgeB: { id: "edgeB", sourceId: "imageB", targetId: v183 },
        },
      };
    try {
      globalThis["document"] = { activeElement: null };
      const v185 = {
          getState: () => v184,
          getStateRaw: () => v184,
          getIncomingEdges: (v186) =>
            Object["values"](v184["edges"])["filter"](
              (v187) => v187["targetId"] === v186,
            ),
        },
        v188 = createAIGenerateNodeStateSyncModule({
          store: v185,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let v189 = 0;
      const v190 = Object["assign"](Object["create"](v188), {
        nodeId: v183,
        _data: v184["nodes"][v183],
        promptEl: { innerHTML: "", querySelectorAll: () => [] },
        _normalizeDreaminaNodeData: (v191) => v191,
        _loadAndDisplayImage: () => {},
        _applyMaskPreview: () => {},
        _applyModelParamVisibility: () => {},
        _updateSubmitButtonState: () => {},
        _renderRefBar: () => {
          v189 += 1;
        },
      });
      (v188["update"]["call"](v190, v184["nodes"][v183]),
        strict["equal"](v189, 1),
        (v184["edges"] = {
          edgeB: v184["edges"]["edgeB"],
          edgeA: v184["edges"]["edgeA"],
        }),
        v188["update"]["call"](v190, v184["nodes"][v183]),
        strict["equal"](v189, 2));
    } finally {
      if (typeof v182 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v182;
    }
  }),
  test("aigenImage\x20state\x20sync:\x20person\x20replace\x20V2.1\x20model\x20keeps\x20empty\x20upload\x20slot", async () => {
    const v192 = globalThis["document"];
    globalThis["document"] = {
      createElement: (v193) => new FakeElement({ tagName: v193 }),
    };
    const v194 = "node-person-replace-v21";
    try {
      const v195 = {
          selectedNodeIds: [],
          pickConnectMode: {},
          nodes: {
            [v194]: {
              id: v194,
              type: "ai-image",
              model: "runninghub/2050313968069165058",
              provider: "runninghubwf",
            },
            imageA: {
              id: "imageA",
              type: "source-image",
              thumbLocalPath: "output/a-thumb.png",
              displayLocalPath: "output/a-display.png",
              originalLocalPath: "output/a.png",
            },
          },
          edges: {
            edgeA: {
              id: "edgeA",
              sourceId: "imageA",
              targetId: v194,
              refSlot: "replaceTarget",
            },
          },
        },
        v196 = {
          getState: () => v195,
          getIncomingEdges: (v197) =>
            Object["values"](v195["edges"])["filter"](
              (v198) => v198["targetId"] === v197,
            ),
          updateEdgesBatch() {},
        },
        v199 = createAIGenerateNodeStateSyncModule({
          store: v196,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        }),
        v200 = new FakeElement({ className: "node-ref-bar" }),
        v201 = Object["assign"](Object["create"](v199), {
          nodeId: v194,
          _data: v195["nodes"][v194],
          _refThumbObjectUrls: new Map(),
          refBarEl: v200,
          promptEl: { innerText: "", querySelectorAll: () => [] },
        });
      await v199["_renderRefBarImpl"]["call"](v201);
      const v202 = v200["querySelector"]('[data-ref-slot="replaceTarget"]'),
        v203 = v200["querySelector"]('[data-ref-slot="replacedImage"]');
      (strict["equal"](v202["classList"]["contains"]("ref-upload-slot"), false),
        strict["equal"](v202["getAttribute"]("draggable"), "true"),
        strict["equal"](v203["classList"]["contains"]("ref-upload-slot"), true),
        strict["equal"](v203["dataset"]["refSlot"], "replacedImage"),
        strict["equal"](v203["dataset"]["slot"], "replacedImage"),
        strict["equal"](v203["dataset"]["kind"], "image"),
        strict["equal"](v203["getAttribute"]("draggable"), "false"));
    } finally {
      if (typeof v192 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v192;
    }
  }),
  test("aigenImage\x20state\x20sync:\x20anime\x20real\x20image\x20input\x20changes\x20trigger\x20adaptive\x20ratio", async () => {
    const v204 = globalThis["document"],
      v205 = "anime-real-node",
      v206 = {
        pickConnectMode: {},
        nodes: {
          [v205]: {
            id: v205,
            type: "ai-image",
            model: "runninghub/1994718111704158209",
            provider: "runninghubwf",
            aspectRatio: "自适应",
          },
          imageA: {
            id: "imageA",
            type: "source-image",
            width: 900,
            height: 1600,
            _bizRev: 1,
          },
          imageB: {
            id: "imageB",
            type: "source-image",
            width: 1600,
            height: 900,
            _bizRev: 1,
          },
        },
        edges: { edgeA: { id: "edgeA", sourceId: "imageA", targetId: v205 } },
      };
    try {
      globalThis["document"] = {
        activeElement: null,
        createElement: (v207) => new FakeElement({ tagName: v207 }),
      };
      const v208 = {
          getState: () => v206,
          getIncomingEdges: (v209) =>
            Object["values"](v206["edges"])["filter"](
              (v210) => v210["targetId"] === v209,
            ),
        },
        v211 = createAIGenerateNodeStateSyncModule({
          store: v208,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let v212 = 0;
      const v213 = Object["assign"](Object["create"](v211), {
        nodeId: v205,
        _data: v206["nodes"][v205],
        refBarEl: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        runAdaptiveRatio: () => {
          v212 += 1;
        },
        promptEl: { innerText: "", querySelectorAll: () => [] },
      });
      (await v211["_renderRefBarImpl"]["call"](v213),
        await new Promise((v214) => setTimeout(v214, 70)),
        strict["equal"](v212, 1),
        (v206["edges"]["edgeA"] = {
          ...v206["edges"]["edgeA"],
          sourceId: "imageB",
        }),
        await v211["_renderRefBarImpl"]["call"](v213),
        await new Promise((v215) => setTimeout(v215, 70)),
        strict["equal"](v212, 2));
    } finally {
      if (typeof v204 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v204;
    }
  }),
  test("aigenImage\x20state\x20sync:\x20group\x20output\x20order\x20changes\x20trigger\x20adaptive\x20ratio", async () => {
    const v216 = globalThis["document"],
      v217 = "schema-image-node",
      v218 = {
        pickConnectMode: {},
        nodes: {
          [v217]: {
            id: v217,
            type: "ai-image",
            model: "apimart/nano-banana-2",
            provider: "apimart",
            generationParams: { aspectRatio: "自适应" },
          },
          group: { id: "group", type: "group" },
          imageA: {
            id: "imageA",
            type: "source-image",
            parentId: "group",
            width: 900,
            height: 1600,
            _bizRev: 1,
          },
          imageB: {
            id: "imageB",
            type: "source-image",
            parentId: "group",
            width: 1600,
            height: 900,
            _bizRev: 1,
          },
        },
        edges: {
          groupEdge: {
            id: "groupEdge",
            sourceId: "group",
            targetId: v217,
            groupOutputSourceOrder: ["imageA", "imageB"],
          },
        },
      },
      v219 = () =>
        v218["edges"]["groupEdge"]["groupOutputSourceOrder"]["map"]((v220) => ({
          ...v218["edges"]["groupEdge"],
          id: "groupEdge::group-output::" + v220,
          sourceId: v220,
          isGroupOutput: true,
          outputGroupId: "group",
          groupOutputEdgeId: "groupEdge",
          effectiveTargetId: v217,
        }));
    try {
      globalThis["document"] = {
        activeElement: null,
        createElement: (v221) => new FakeElement({ tagName: v221 }),
      };
      const v222 = {
          getState: () => v218,
          getIncomingEdges: (v223) => (v223 === v217 ? v219() : []),
        },
        v224 = createAIGenerateNodeStateSyncModule({
          store: v222,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let v225 = 0;
      const v226 = Object["assign"](Object["create"](v224), {
        nodeId: v217,
        _data: v218["nodes"][v217],
        refBarEl: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        runAdaptiveRatio: () => {
          v225 += 1;
        },
        promptEl: { innerText: "", querySelectorAll: () => [] },
      });
      (await v224["_renderRefBarImpl"]["call"](v226),
        await new Promise((v227) => setTimeout(v227, 70)),
        strict["equal"](v225, 1),
        (v218["edges"]["groupEdge"] = {
          ...v218["edges"]["groupEdge"],
          groupOutputSourceOrder: ["imageB", "imageA"],
        }),
        await v224["_renderRefBarImpl"]["call"](v226),
        await new Promise((v228) => setTimeout(v228, 70)),
        strict["equal"](v225, 2));
    } finally {
      if (typeof v216 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v216;
    }
  }),
  test("aigenImage state sync: group first output removal triggers adaptive ratio while ref bar hidden", async () => {
    const v229 = globalThis["document"],
      v230 = "schema-image-node",
      v231 = {
        pickConnectMode: {},
        selectedNodeIds: [],
        nodes: {
          [v230]: {
            id: v230,
            type: "ai-image",
            model: "apimart/nano-banana-2",
            provider: "apimart",
            generationParams: { aspectRatio: "自适应" },
          },
          group: { id: "group", type: "group" },
          imageA: {
            id: "imageA",
            type: "source-image",
            parentId: "group",
            width: 900,
            height: 1600,
            _bizRev: 1,
          },
          imageB: {
            id: "imageB",
            type: "source-image",
            parentId: "group",
            width: 1600,
            height: 900,
            _bizRev: 1,
          },
        },
        edges: {
          groupEdge: {
            id: "groupEdge",
            sourceId: "group",
            targetId: v230,
            groupOutputSourceOrder: ["imageA", "imageB"],
          },
        },
      },
      v232 = () =>
        v231["edges"]["groupEdge"]["groupOutputSourceOrder"]
          ["filter"]((v233) => v231["nodes"][v233]?.["parentId"] === "group")
          [
            "map"
          ]((v234) => ({ ...v231["edges"]["groupEdge"], id: "groupEdge::group-output::" + v234, sourceId: v234, isGroupOutput: true, outputGroupId: "group", groupOutputEdgeId: "groupEdge", effectiveTargetId: v230 }));
    try {
      globalThis["document"] = {
        activeElement: null,
        createElement: (v235) => new FakeElement({ tagName: v235 }),
      };
      const v236 = {
          getState: () => v231,
          getIncomingEdges: (v237) => (v237 === v230 ? v232() : []),
        },
        v238 = createAIGenerateNodeStateSyncModule({
          store: v236,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
          getDisplayModelName: (v239) => v239,
        });
      let v240 = 0,
        v241 = 0;
      const v242 = Object["assign"](Object["create"](v238), {
        nodeId: v230,
        _data: v231["nodes"][v230],
        _root: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        _normalizeDreaminaNodeData: (v243) => v243,
        _loadAndDisplayImage: () => {},
        _applyMaskPreview: () => {},
        _applyModelParamVisibility: () => {},
        _updateSubmitButtonState: () => {},
        _renderRefBar: () => {
          v241 += 1;
        },
        runAdaptiveRatio: () => {
          v240 += 1;
        },
        promptEl: { innerHTML: "", innerText: "", querySelectorAll: () => [] },
      });
      (v238["update"]["call"](v242, v231["nodes"][v230]),
        await new Promise((v244) => setTimeout(v244, 70)),
        strict["equal"](v240, 1),
        strict["equal"](v241, 0),
        (v231["nodes"]["imageA"] = {
          ...v231["nodes"]["imageA"],
          parentId: "",
        }),
        v238["update"]["call"](v242, v231["nodes"][v230]),
        await new Promise((v245) => setTimeout(v245, 70)),
        strict["equal"](v240, 2),
        strict["equal"](v241, 0));
    } finally {
      if (typeof v229 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v229;
    }
  }),
  test("aigenImage state sync: schema adaptive ratio triggers display resize on input change", async () => {
    const v246 = globalThis["document"],
      v247 = "schema-image-node",
      v248 = {
        pickConnectMode: {},
        nodes: {
          [v247]: {
            id: v247,
            type: "ai-image",
            model: "apimart/nano-banana-2",
            provider: "apimart",
            generationParams: { aspectRatio: "自适应" },
          },
          imageA: {
            id: "imageA",
            type: "source-image",
            width: 900,
            height: 1600,
            _bizRev: 1,
          },
          imageB: {
            id: "imageB",
            type: "source-image",
            width: 1600,
            height: 900,
            _bizRev: 1,
          },
        },
        edges: { edgeA: { id: "edgeA", sourceId: "imageA", targetId: v247 } },
      };
    try {
      globalThis["document"] = {
        activeElement: null,
        createElement: (v249) => new FakeElement({ tagName: v249 }),
      };
      const v250 = {
          getState: () => v248,
          getIncomingEdges: (v251) =>
            Object["values"](v248["edges"])["filter"](
              (v252) => v252["targetId"] === v251,
            ),
        },
        v253 = createAIGenerateNodeStateSyncModule({
          store: v250,
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
          _syncPillLabels: () => {},
        });
      let v254 = 0;
      const v255 = Object["assign"](Object["create"](v253), {
        nodeId: v247,
        _data: v248["nodes"][v247],
        refBarEl: new FakeElement(),
        _refThumbObjectUrls: new Map(),
        runAdaptiveRatio: () => {
          v254 += 1;
        },
        promptEl: { innerText: "", querySelectorAll: () => [] },
      });
      (await v253["_renderRefBarImpl"]["call"](v255),
        await new Promise((v256) => setTimeout(v256, 70)),
        strict["equal"](v254, 1),
        (v248["nodes"][v247]["generationParams"]["aspectRatio"] = "16:9"),
        (v248["edges"]["edgeA"] = {
          ...v248["edges"]["edgeA"],
          sourceId: "imageB",
        }),
        await v253["_renderRefBarImpl"]["call"](v255),
        await new Promise((v257) => setTimeout(v257, 70)),
        strict["equal"](v254, 1));
    } finally {
      if (typeof v246 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v246;
    }
  }));

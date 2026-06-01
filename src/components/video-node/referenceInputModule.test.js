import test from "node:test";
import strict from "node:assert/strict";
import {
  __videoReferenceInputTest,
  createVideoNodeReferenceInputModule,
} from "./referenceInputModule.js";
import { createVideoNodeParameterPanelModule } from "./parameterPanelModule.js";
import { createReferenceFallbackThumbHtml } from "../../modules/referenceThumbnailFallback.js";
import { getFixedInputSlotConfigFromManifest } from "../../modules/fixedInputAssetRefs.js";
import { hasUsableInputNodeSource } from "../../modules/modelInputPolicy.js";
import {
  _resetAssetMentionRegistryForTests,
  setAssetMentionAssets,
} from "../../modules/assetMentionRegistry.js";
test["afterEach"](() => {
  _resetAssetMentionRegistryForTests();
});
function createProto() {
  return createVideoNodeReferenceInputModule({
    store: { getState: () => ({ nodes: {} }), getIncomingEdges: () => [] },
    api: {},
    _syncPillLabels: () => {},
    getImage: async () => null,
    ensureThumbDecoded: () => {},
    revealRefThumbMedia: () => {},
  });
}
(test("video reference input: ai-video 可从 videos 主项读取缩略图", () => {
  const v0 = {
      type: "ai-video",
      mainVideoIndex: 0,
      videos: [
        {
          localPath: "output/dreamina-video.mp4",
          thumbUrl: "/output/VideoThumbs/dreamina-video.jpg",
        },
      ],
    },
    v1 = __videoReferenceInputTest["getVideoThumbCandidate"](v0, {
      sourceMediaKey: "output/dreamina-video.mp4",
    });
  strict["equal"](v1["thumbUrl"], "/output/VideoThumbs/dreamina-video.jpg");
}),
  test("video\x20reference\x20input:\x20sourceMediaKey\x20指向多视频非主项时不误用顶层缩略图", () => {
    const v2 = {
        type: "ai-video",
        mainVideoIndex: 0,
        thumbUrl: "/output/VideoThumbs/main.jpg",
        videos: [
          {
            localPath: "output/main.mp4",
            thumbUrl: "/output/VideoThumbs/main.jpg",
          },
          {
            localPath: "output/second.mp4",
            thumbUrl: "/output/VideoThumbs/second.jpg",
          },
        ],
      },
      v3 = __videoReferenceInputTest["getVideoThumbCandidate"](v2, {
        sourceMediaKey: "output/second.mp4",
      });
    strict["equal"](v3["thumbUrl"], "/output/VideoThumbs/second.jpg");
  }),
  test("video\x20reference\x20input:\x20缩略图缺失时按选中视频项返回可回填路径", () => {
    const v4 = {
        type: "ai-video",
        mainVideoIndex: 0,
        videos: [
          {
            localPath: "output/main.mp4",
            thumbUrl: "/output/VideoThumbs/main.jpg",
          },
          { localPath: "output/second.mp4" },
        ],
      },
      v5 = __videoReferenceInputTest["getVideoThumbCandidate"](v4, {
        sourceMediaKey: "output/second.mp4",
      }),
      v6 = __videoReferenceInputTest["getVideoSourcePathForThumb"](v4, {
        sourceMediaKey: "output/second.mp4",
      });
    (strict["equal"](v5["thumbUrl"], ""),
      strict["equal"](v6, "/output/second.mp4"));
  }),
  test("video\x20reference\x20input:\x20display\x20local\x20paths\x20can\x20resolve\x20fallback\x20video\x20refs", () => {
    const v7 = {
      type: "source-video",
      displayLocalPath: "data/assets/display.mp4",
    };
    (strict["equal"](
      __videoReferenceInputTest["getVideoSourcePathForThumb"](v7, {}),
      "/data/assets/display.mp4",
    ),
      strict["equal"](
        __videoReferenceInputTest["getVideoRefMediaSignature"](v7, {}),
        "data/assets/display.mp4",
      ));
  }),
  test("video reference input: 来源状态签名随 videos 缩略图变化", () => {
    const v8 = createProto(),
      v9 = {
        type: "ai-video",
        mainVideoIndex: 0,
        videos: [{ localPath: "output/dreamina-video.mp4" }],
      },
      v10 = {
        type: "ai-video",
        mainVideoIndex: 0,
        videos: [
          {
            localPath: "output/dreamina-video.mp4",
            thumbUrl: "/output/VideoThumbs/dreamina-video.jpg",
          },
        ],
      };
    strict["notEqual"](
      v8["_getRefSourceStateKey"](v9),
      v8["_getRefSourceStateKey"](v10),
    );
  }),
  test("video\x20reference\x20input:\x20来源状态签名随视频元数据变化", () => {
    const v11 = createProto(),
      v12 = { type: "source-video", localPath: "output/CutVideo/cut.mp4" },
      v13 = { ...v12, videoFrameCount: 59, videoDuration: 2.46, videoFps: 24 };
    strict["notEqual"](
      v11["_getRefSourceStateKey"](v12),
      v11["_getRefSourceStateKey"](v13),
    );
  }),
  test("video reference input: 来源状态签名忽略任务轮询状态", () => {
    const v14 = createProto(),
      v15 = {
        type: "ai-video",
        _bizRev: 12,
        mainVideoIndex: 0,
        rhTaskStatus: "running",
        dreaminaTaskLastCheckedAt: 1710000000000,
        videos: [
          {
            localPath: "output/dreamina-video.mp4",
            thumbUrl: "/output/VideoThumbs/dreamina-video.jpg",
          },
        ],
      },
      v16 = {
        ...v15,
        _bizRev: 19,
        rhTaskStatus: "pending",
        dreaminaTaskLastCheckedAt: 1710000020000,
      },
      v17 = {
        ...v16,
        videos: [
          {
            localPath: "output/dreamina-video.mp4",
            thumbUrl: "/output/VideoThumbs/dreamina-video-new.jpg",
          },
        ],
      };
    (strict["equal"](
      v14["_getRefSourceStateKey"](v15),
      v14["_getRefSourceStateKey"](v16),
    ),
      strict["notEqual"](
        v14["_getRefSourceStateKey"](v15),
        v14["_getRefSourceStateKey"](v17),
      ));
  }),
  test("video reference input: text/audio fallback thumbnails use shared blue labels", () => {
    const v18 = createReferenceFallbackThumbHtml("text"),
      v19 = createReferenceFallbackThumbHtml("audio"),
      v20 =
        __videoReferenceInputTest["createRunningHubAudioFallbackThumbHtml"]();
    (strict["match"](
      v18,
      /class="[^"]*\bref-thumb-media\b[^"]*\bref-thumb-fallback\b[^"]*"/,
    ),
      strict["match"](v18, />TEXT<\/div>/),
      strict["doesNotMatch"](v18, /<svg|style=/),
      strict["match"](
        v19,
        /class="[^"]*\bref-thumb-media\b[^"]*\bref-thumb-fallback\b[^"]*"/,
      ),
      strict["match"](v19, />AUDIO<\/div>/),
      strict["doesNotMatch"](v19, /<svg|style=/),
      strict["match"](
        v20,
        /class="[^"]*\bref-thumb-media\b[^"]*\brh-v5-ref-media-fallback\b[^"]*\bref-thumb-fallback\b[^"]*"/,
      ),
      strict["match"](v20, />AUDIO<\/div>/),
      strict["doesNotMatch"](v20, /<svg|style=/));
  }));
function makeAssetPill({
  assetId: v21,
  assetIndex: v22,
  type: v23,
  label: label = "@asset",
}) {
  return {
    dataset: {
      refOrigin: "asset",
      assetId: v21,
      assetIndex: String(v22),
      refType: v23,
      label: label,
    },
    classList: {
      contains(v24) {
        return v24 === "ref-pill";
      },
    },
    textContent: label,
  };
}
function makePromptEl(v25 = []) {
  return {
    innerText: v25["map"]((v26) => v26["textContent"] || "")["join"]("\x20"),
    querySelectorAll(v27) {
      return v27 === ".ref-pill" ? v25 : [];
    },
  };
}
(test("video\x20reference\x20input:\x20V5\x20源视频帧数优先显示真实\x20videoFrameCount", () => {
  const v28 = __videoReferenceInputTest["getRhV5SourceVideoFrameCount"]({
    inEdges: [
      { id: "e-source", sourceId: "source-video", refSlot: "sourceVideo" },
    ],
    nodes: {
      "source-video": {
        type: "source-video",
        videoFrameCount: 96,
        videoDuration: 10,
      },
    },
    targetFps: 24,
  });
  strict["equal"](v28, 96);
}),
  test("video reference input: V5 源视频缺少真实帧数时按时长兜底估算", () => {
    const v29 = __videoReferenceInputTest["getRhV5SourceVideoFrameCount"]({
      inEdges: [
        { id: "e-source", sourceId: "source-video", refSlot: "sourceVideo" },
      ],
      nodes: { "source-video": { type: "source-video", videoDuration: 3.5 } },
      targetFps: 24,
    });
    strict["equal"](v29, 84);
  }),
  test("video reference input: V5 无连线时从隐藏资产源视频读取真实帧数", () => {
    setAssetMentionAssets([
      {
        id: "asset-source-video",
        items: [
          {
            name: "source clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/source.mp4",
              videoFrameCount: 72,
            },
          },
        ],
      },
    ]);
    const v30 = __videoReferenceInputTest["getRhV5SourceVideoFrameCount"]({
      nodeData: {
        promptAssetInputRefs: [
          { assetId: "asset-source-video", itemIndex: 0, type: "video" },
        ],
      },
      targetFps: 24,
    });
    strict["equal"](v30, 72);
  }),
  test("video reference input: V5 无连线时从提示词资产源视频读取真实帧数", () => {
    setAssetMentionAssets([
      {
        id: "asset-prompt-video",
        items: [
          {
            name: "prompt source clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/prompt-source.mp4",
              videoFrameCount: 88,
            },
          },
        ],
      },
    ]);
    const v31 = __videoReferenceInputTest["getRhV5SourceVideoFrameCount"]({
      promptEl: makePromptEl([
        makeAssetPill({
          assetId: "asset-prompt-video",
          assetIndex: 0,
          type: "video",
          label: "prompt\x20source\x20clip",
        }),
      ]),
      targetFps: 24,
    });
    strict["equal"](v31, 88);
  }),
  test("video\x20reference\x20input:\x20V5\x20源视频没有有效帧数或时长时返回空", () => {
    const v32 = __videoReferenceInputTest["getRhV5SourceVideoFrameCount"]({
      inEdges: [
        { id: "e-source", sourceId: "source-video", refSlot: "sourceVideo" },
      ],
      nodes: {
        "source-video": {
          type: "source-video",
          localPath: "data/assets/source.mp4",
        },
      },
      targetFps: 24,
    });
    strict["equal"](v32, null);
  }));
function makeClassList(v33) {
  return {
    contains(v34) {
      return String(v33["className"] || "")
        ["split"](/\s+/)
        ["filter"](Boolean)
        ["includes"](String(v34 || ""));
    },
    add(...v35) {
      const v36 = new Set(
        String(v33["className"] || "")
          ["split"](/\s+/)
          ["filter"](Boolean),
      );
      (v35["forEach"]((v37) => v36["add"](String(v37 || ""))),
        (v33["className"] = Array["from"](v36)["join"]("\x20")));
    },
    remove(...v38) {
      const v39 = new Set(v38["map"]((v40) => String(v40 || "")));
      v33["className"] = String(v33["className"] || "")
        ["split"](/\s+/)
        ["filter"]((v41) => v41 && !v39["has"](v41))
        ["join"]("\x20");
    },
  };
}
function createFakeElement(v42 = "div") {
  const v43 = {
    tagName: String(v42 || "div")["toUpperCase"](),
    className: "",
    dataset: {},
    attributes: {},
    childNodes: [],
    parentElement: null,
    style: {},
    _innerHTML: "",
    _innerHTMLSetCount: 0,
    classList: null,
    set innerHTML(v44) {
      ((v43["_innerHTMLSetCount"] += 1),
        (v43["_innerHTML"] = String(v44 || "")),
        (v43["childNodes"] = []));
      if (v43["_innerHTML"]["includes"]("rh-v5-ref-container")) {
        const v45 = createFakeElement("div");
        ((v45["className"] = "prompt-attachment-btn"), v43["appendChild"](v45));
        const v46 = createFakeElement("div");
        v46["className"] = "ref-thumb-container\x20rh-v5-ref-container";
        const v47 = Array["from"](
          v43["_innerHTML"]["matchAll"](/data-slot="([^"]+)"/g),
        )["map"]((v48) => v48[1]);
        (v47["forEach"]((v49) => {
          const v50 = createFakeElement("button");
          ((v50["className"] = "ref-thumb-wrap ref-upload-slot rh-v5-ref-box"),
            (v50["dataset"]["slot"] = v49),
            v46["appendChild"](v50));
        }),
          v43["appendChild"](v46));
      } else {
        if (v43["_innerHTML"]["includes"]("ref-thumb-container")) {
          const v51 = createFakeElement("div");
          ((v51["className"] = "prompt-attachment-btn"),
            v43["appendChild"](v51));
          const v52 = createFakeElement("div");
          ((v52["className"] = "ref-thumb-container"), v43["appendChild"](v52));
        }
      }
    },
    get innerHTML() {
      return v43["_innerHTML"];
    },
    appendChild(v53) {
      if (v53["parentElement"]) {
        const v54 = v53["parentElement"]["childNodes"]["indexOf"](v53);
        if (v54 >= 0) v53["parentElement"]["childNodes"]["splice"](v54, 1);
      }
      return (
        (v53["parentElement"] = v43),
        v43["childNodes"]["push"](v53),
        v53
      );
    },
    insertBefore(v55, v56) {
      if (!v56) return v43["appendChild"](v55);
      if (v55["parentElement"]) {
        const v57 = v55["parentElement"]["childNodes"]["indexOf"](v55);
        if (v57 >= 0) v55["parentElement"]["childNodes"]["splice"](v57, 1);
      }
      const v58 = v43["childNodes"]["indexOf"](v56);
      v55["parentElement"] = v43;
      if (v58 < 0) v43["childNodes"]["push"](v55);
      else v43["childNodes"]["splice"](v58, 0, v55);
      return v55;
    },
    remove() {
      const v59 = v43["parentElement"];
      if (!v59) return;
      const v60 = v59["childNodes"]["indexOf"](v43);
      if (v60 >= 0) v59["childNodes"]["splice"](v60, 1);
      v43["parentElement"] = null;
    },
    replaceWith(v61) {
      const v62 = v43["parentElement"];
      if (!v62) return;
      const v63 = v62["childNodes"]["indexOf"](v43);
      if (v63 < 0) return;
      ((v61["parentElement"] = v62), (v62["childNodes"][v63] = v61));
    },
    setAttribute(v64, v65) {
      v43["attributes"][v64] = String(v65 || "");
    },
    addEventListener() {},
    querySelector(v66) {
      return v43["querySelectorAll"](v66)[0] || null;
    },
    querySelectorAll(v67) {
      const v68 = [],
        v69 = (v70) => {
          if (v67["startsWith"]("."))
            return v70["classList"]?.["contains"](v67["slice"](1));
          const v71 = v67["match"](/^\[data-slot(?:="([^"]+)")?\]$/);
          if (v71) {
            if (!("slot" in v70["dataset"])) return false;
            return v71[1] ? v70["dataset"]["slot"] === v71[1] : true;
          }
          return false;
        },
        v72 = (v73) => {
          v73["childNodes"]["forEach"]((v74) => {
            if (v69(v74)) v68["push"](v74);
            v72(v74);
          });
        };
      return (v72(v43), v68);
    },
  };
  return ((v43["classList"] = makeClassList(v43)), v43);
}
(test("video reference input: HappyHorse mode change refreshes visible fixed slots", async () => {
  const v75 = globalThis["document"];
  globalThis["document"] = { createElement: createFakeElement };
  try {
    const v76 = "node-happyhorse",
      v77 = {
        nodes: {
          [v76]: {
            id: v76,
            type: "ai-video",
            model: "apimart/happyhorse-1.0",
            provider: "apimart",
            generationParams: { happyhorse_mode: "image" },
          },
        },
      },
      v78 = createVideoNodeReferenceInputModule({
        store: { getState: () => v77, getIncomingEdges: () => [] },
        api: {},
        _syncPillLabels: () => {},
        getImage: async () => null,
        ensureThumbDecoded: () => {},
        revealRefThumbMedia: () => {},
      }),
      v79 = Object["assign"](Object["create"](v78), {
        nodeId: v76,
        _data: v77["nodes"][v76],
        refBarEl: createFakeElement("div"),
        promptEl: makePromptEl(),
        _fixedSlotRefThumbObjectUrls: new Map(),
        _videoThumbPending: new Set(),
        _isRunninghubWorkflowModel: () => false,
        _resolveMediaUrl: (v80) => String(v80 || ""),
        _syncBtnIconState: () => {},
      });
    await v78["_renderRefBarImpl"]["call"](v79);
    let v81 = v79["refBarEl"]["querySelector"](".rh-v5-ref-container");
    (strict["ok"](v81["querySelector"]('[data-slot="firstFrame"]')),
      strict["equal"](v81["querySelector"]('[data-slot="lastFrame"]'), null),
      strict["equal"](
        v81["querySelector"]('[data-slot="referenceImage"]'),
        null,
      ),
      (v77["nodes"][v76] = {
        ...v77["nodes"][v76],
        generationParams: { happyhorse_mode: "reference" },
      }),
      await v78["_renderRefBarImpl"]["call"](v79),
      (v81 = v79["refBarEl"]["querySelector"](".rh-v5-ref-container")),
      strict["equal"](
        v81["querySelector"]("[data-slot=\x22firstFrame\x22]"),
        null,
      ),
      strict["ok"](v81["querySelector"]("[data-slot=\x22referenceImage\x22]")));
  } finally {
    if (typeof v75 === "undefined") delete globalThis["document"];
    else globalThis["document"] = v75;
  }
}),
  test("video\x20reference\x20input:\x20Hailuo\x202.3\x20refreshes\x20stale\x20last-frame\x20refbar\x20slot", async () => {
    const v82 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v83 = "node-hailuo-23",
        v84 = {
          nodes: {
            [v83]: {
              id: v83,
              type: "ai-video",
              model: "apimart/minimax-hailuo-2.3",
              provider: "apimart",
              generationParams: { mode: "fast" },
            },
          },
        },
        v85 = createVideoNodeReferenceInputModule({
          store: { getState: () => v84, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v86 = Object["assign"](Object["create"](v85), {
          nodeId: v83,
          _data: v84["nodes"][v83],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (v87) => String(v87 || ""),
          _syncBtnIconState: () => {},
        });
      v86["refBarEl"]["innerHTML"] = [
        '<div class="prompt-attachment-btn"></div>',
        '<div class="ref-thumb-container rh-v5-ref-container">',
        '<button data-slot="firstFrame"></button>',
        '<button data-slot="lastFrame"></button>',
        "</div>",
      ]["join"]("");
      const v88 = v86["refBarEl"]["_innerHTMLSetCount"];
      await v85["_renderRefBarImpl"]["call"](v86);
      const v89 = v86["refBarEl"]["querySelector"](".rh-v5-ref-container");
      (strict["ok"](v86["refBarEl"]["_innerHTMLSetCount"] > v88),
        strict["deepEqual"](
          Array["from"](v89["querySelectorAll"]("[data-slot]"))["map"](
            (v90) => v90["dataset"]["slot"],
          ),
          ["firstFrame"],
        ),
        strict["ok"](v89["querySelector"]('[data-slot="firstFrame"]')),
        strict["equal"](
          v89["querySelector"]("[data-slot=\x22lastFrame\x22]"),
          null,
        ));
    } finally {
      if (typeof v82 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v82;
    }
  }),
  test("video\x20reference\x20input:\x20Wan2.7\x20mode\x20change\x20refreshes\x20fixed\x20slots", async () => {
    const v91 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v92 = "node-wan27",
        v93 = {
          nodes: {
            [v92]: {
              id: v92,
              type: "ai-video",
              model: "apimart/wan2.7",
              provider: "apimart",
              generationParams: { wan27_mode: "image" },
            },
          },
        },
        v94 = createVideoNodeReferenceInputModule({
          store: { getState: () => v93, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v95 = Object["assign"](Object["create"](v94), {
          nodeId: v92,
          _data: v93["nodes"][v92],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (v96) => String(v96 || ""),
          _syncBtnIconState: () => {},
        });
      await v94["_renderRefBarImpl"]["call"](v95);
      let v97 = v95["refBarEl"]["querySelector"](".rh-v5-ref-container");
      const v98 = v95["refBarEl"]["_innerHTMLSetCount"];
      (strict["deepEqual"](
        Array["from"](v97["querySelectorAll"]("[data-slot]"))["map"](
          (v99) => v99["dataset"]["slot"],
        ),
        ["firstFrame", "lastFrame", "audio"],
      ),
        strict["ok"](v97["querySelector"]("[data-slot=\x22firstFrame\x22]")),
        strict["ok"](v97["querySelector"]("[data-slot=\x22lastFrame\x22]")),
        strict["ok"](v97["querySelector"]("[data-slot=\x22audio\x22]")),
        strict["equal"](
          v97["querySelector"]('[data-slot="sourceVideo"]'),
          null,
        ),
        (v93["nodes"][v92] = {
          ...v93["nodes"][v92],
          generationParams: { wan27_mode: "video" },
        }),
        await v94["_renderRefBarImpl"]["call"](v95),
        (v97 = v95["refBarEl"]["querySelector"](".rh-v5-ref-container")),
        strict["ok"](v95["refBarEl"]["_innerHTMLSetCount"] > v98),
        strict["deepEqual"](
          Array["from"](v97["querySelectorAll"]("[data-slot]"))["map"](
            (v100) => v100["dataset"]["slot"],
          ),
          ["sourceVideo"],
        ),
        strict["equal"](v97["querySelector"]('[data-slot="firstFrame"]'), null),
        strict["equal"](v97["querySelector"]('[data-slot="audio"]'), null),
        strict["ok"](v97["querySelector"]('[data-slot="sourceVideo"]')),
        (v95["refBarEl"]["innerHTML"] = [
          "<div\x20class=\x22prompt-attachment-btn\x22></div>",
          '<div class="ref-thumb-container rh-v5-ref-container">',
          '<button data-slot="lastFrame"></button>',
          "<button\x20data-slot=\x22sourceVideo\x22></button>",
          "<button\x20data-slot=\x22referenceImage\x22></button>",
          '<button data-slot="originalVideo"></button>',
          '<button data-slot="referenceVideo"></button>',
          '<button data-slot="audio"></button>',
          '<button data-slot="referenceAudio"></button>',
          "</div>",
        ]["join"]("")));
      const v101 = v95["refBarEl"]["_innerHTMLSetCount"];
      (await v94["_renderRefBarImpl"]["call"](v95),
        (v97 = v95["refBarEl"]["querySelector"](".rh-v5-ref-container")),
        strict["ok"](v95["refBarEl"]["_innerHTMLSetCount"] > v101),
        strict["deepEqual"](
          Array["from"](v97["querySelectorAll"]("[data-slot]"))["map"](
            (v102) => v102["dataset"]["slot"],
          ),
          ["sourceVideo"],
        ),
        strict["equal"](
          v97["querySelector"]("[data-slot=\x22lastFrame\x22]"),
          null,
        ),
        strict["equal"](
          v97["querySelector"]("[data-slot=\x22referenceImage\x22]"),
          null,
        ),
        strict["equal"](
          v97["querySelector"]('[data-slot="originalVideo"]'),
          null,
        ),
        strict["equal"](
          v97["querySelector"]('[data-slot="referenceVideo"]'),
          null,
        ),
        strict["equal"](v97["querySelector"]('[data-slot="audio"]'), null),
        strict["equal"](
          v97["querySelector"]('[data-slot="referenceAudio"]'),
          null,
        ));
      const v103 = v95["refBarEl"]["_innerHTMLSetCount"];
      ((v93["nodes"][v92] = {
        ...v93["nodes"][v92],
        generationParams: { wan27_mode: "reference" },
      }),
        (v95["_data"] = v93["nodes"][v92]));
      const v104 = getFixedInputSlotConfigFromManifest(v93["nodes"][v92]);
      (strict["deepEqual"](v104?.["visibleSlots"], [
        "referenceImage",
        "referenceVideo",
        "referenceAudio",
      ]),
        strict["ok"](
          v104?.["fixedSlots"]?.["some"]((v105) => v105["id"] === "firstFrame"),
        ),
        strict["ok"](v104?.["slotById"]?.["firstFrame"]),
        await v94["_renderRefBarImpl"]["call"](v95),
        (v97 = v95["refBarEl"]["querySelector"](".rh-v5-ref-container")),
        strict["ok"](v95["refBarEl"]["_innerHTMLSetCount"] > v103),
        strict["deepEqual"](
          Array["from"](v97["querySelectorAll"]("[data-slot]"))["map"](
            (v106) => v106["dataset"]["slot"],
          ),
          ["referenceImage", "referenceVideo", "referenceAudio"],
        ),
        strict["equal"](v97["querySelector"]('[data-slot="firstFrame"]'), null),
        strict["equal"](v97["querySelector"]('[data-slot="lastFrame"]'), null),
        strict["ok"](v97["querySelector"]('[data-slot="referenceAudio"]')),
        strict["equal"](
          v97["querySelector"]('[data-slot="sourceVideo"]'),
          null,
        ),
        strict["ok"](v97["querySelector"]('[data-slot="referenceVideo"]')),
        strict["equal"](
          v97["querySelector"]('[data-slot="originalVideo"]'),
          null,
        ),
        strict["ok"](
          v97["querySelector"]("[data-slot=\x22referenceImage\x22]"),
        ));
      const v107 = v95["refBarEl"]["_innerHTMLSetCount"];
      ((v93["nodes"][v92] = {
        ...v93["nodes"][v92],
        generationParams: { wan27_mode: "edit" },
      }),
        (v95["_data"] = v93["nodes"][v92]),
        await v94["_renderRefBarImpl"]["call"](v95),
        (v97 = v95["refBarEl"]["querySelector"](".rh-v5-ref-container")),
        strict["ok"](v95["refBarEl"]["_innerHTMLSetCount"] > v107),
        strict["deepEqual"](
          Array["from"](v97["querySelectorAll"]("[data-slot]"))["map"](
            (v108) => v108["dataset"]["slot"],
          ),
          ["originalVideo", "referenceVideo"],
        ),
        strict["equal"](
          v97["querySelector"]('[data-slot="referenceImage"]'),
          null,
        ),
        strict["ok"](v97["querySelector"]('[data-slot="originalVideo"]')),
        strict["ok"](v97["querySelector"]('[data-slot="referenceVideo"]')),
        (v93["nodes"][v92] = {
          ...v93["nodes"][v92],
          model: "wan2.7",
          generationParams: { wan27_mode: "image" },
        }),
        (v95["_data"] = v93["nodes"][v92]),
        await v94["_renderRefBarImpl"]["call"](v95),
        (v97 = v95["refBarEl"]["querySelector"](".rh-v5-ref-container")),
        strict["ok"](v97["querySelector"]("[data-slot=\x22firstFrame\x22]")),
        strict["ok"](v97["querySelector"]('[data-slot="lastFrame"]')),
        strict["ok"](v97["querySelector"]("[data-slot=\x22audio\x22]")),
        strict["equal"](
          v97["querySelector"]('[data-slot="sourceVideo"]'),
          null,
        ),
        (v93["nodes"][v92] = {
          ...v93["nodes"][v92],
          model: "apimart/wan2.7",
          provider: "apimartr",
          generationParams: { wan27_mode: "video" },
        }),
        (v95["_data"] = v93["nodes"][v92]),
        await v94["_renderRefBarImpl"]["call"](v95),
        (v97 = v95["refBarEl"]["querySelector"](".rh-v5-ref-container")),
        strict["equal"](v97["querySelector"]('[data-slot="firstFrame"]'), null),
        strict["ok"](v97["querySelector"]('[data-slot="sourceVideo"]')));
    } finally {
      if (typeof v91 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v91;
    }
  }),
  test("video reference input: Kling V3 Omni mode change refreshes fixed slots", async () => {
    const v109 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v110 = "node-kling-v3-omni",
        v111 = {
          nodes: {
            [v110]: {
              id: v110,
              type: "ai-video",
              model: "apimart/kling-v3-omni",
              provider: "apimart",
              generationParams: { kling_v3_omni_mode: "image" },
            },
          },
        },
        v112 = createVideoNodeReferenceInputModule({
          store: { getState: () => v111, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v113 = Object["assign"](Object["create"](v112), {
          nodeId: v110,
          _data: v111["nodes"][v110],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (v114) => String(v114 || ""),
          _syncBtnIconState: () => {},
        });
      await v112["_renderRefBarImpl"]["call"](v113);
      let v115 = v113["refBarEl"]["querySelector"](".rh-v5-ref-container");
      (strict["deepEqual"](
        Array["from"](v115["querySelectorAll"]("[data-slot]"))["map"](
          (v116) => v116["dataset"]["slot"],
        ),
        ["firstFrame", "lastFrame"],
      ),
        strict["ok"](v115["querySelector"]('[data-slot="firstFrame"]')),
        strict["ok"](v115["querySelector"]('[data-slot="lastFrame"]')));
      const v117 = v113["refBarEl"]["_innerHTMLSetCount"];
      ((v111["nodes"][v110] = {
        ...v111["nodes"][v110],
        generationParams: { kling_v3_omni_mode: "reference" },
      }),
        (v113["_data"] = v111["nodes"][v110]),
        await v112["_renderRefBarImpl"]["call"](v113),
        (v115 = v113["refBarEl"]["querySelector"](".rh-v5-ref-container")),
        strict["ok"](v113["refBarEl"]["_innerHTMLSetCount"] > v117),
        strict["deepEqual"](
          Array["from"](v115["querySelectorAll"]("[data-slot]"))["map"](
            (v118) => v118["dataset"]["slot"],
          ),
          ["referenceImage", "referenceVideo"],
        ),
        strict["equal"](
          v115["querySelector"]('[data-slot="firstFrame"]'),
          null,
        ),
        strict["equal"](v115["querySelector"]('[data-slot="lastFrame"]'), null),
        strict["ok"](v115["querySelector"]('[data-slot="referenceImage"]')),
        strict["ok"](
          v115["querySelector"]("[data-slot=\x22referenceVideo\x22]"),
        ));
      const v119 = v113["refBarEl"]["_innerHTMLSetCount"];
      ((v111["nodes"][v110] = {
        ...v111["nodes"][v110],
        generationParams: { kling_v3_omni_mode: "edit" },
      }),
        (v113["_data"] = v111["nodes"][v110]),
        await v112["_renderRefBarImpl"]["call"](v113),
        (v115 = v113["refBarEl"]["querySelector"](".rh-v5-ref-container")),
        strict["ok"](v113["refBarEl"]["_innerHTMLSetCount"] > v119),
        strict["deepEqual"](
          Array["from"](v115["querySelectorAll"]("[data-slot]"))["map"](
            (v120) => v120["dataset"]["slot"],
          ),
          ["editVideo"],
        ),
        strict["equal"](
          v115["querySelector"]('[data-slot="referenceImage"]'),
          null,
        ),
        strict["equal"](
          v115["querySelector"]("[data-slot=\x22referenceVideo\x22]"),
          null,
        ),
        strict["ok"](v115["querySelector"]('[data-slot="editVideo"]')));
    } finally {
      if (typeof v109 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v109;
    }
  }),
  test("video reference input: Kling O1 renders fixed reference slots", async () => {
    const v121 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v122 = "node-kling-o1",
        v123 = {
          nodes: {
            [v122]: {
              id: v122,
              type: "ai-video",
              model: "apimart/kling-video-o1",
              provider: "apimart",
            },
          },
        },
        v124 = createVideoNodeReferenceInputModule({
          store: { getState: () => v123, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v125 = Object["assign"](Object["create"](v124), {
          nodeId: v122,
          _data: v123["nodes"][v122],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (v126) => String(v126 || ""),
          _syncBtnIconState: () => {},
        });
      await v124["_renderRefBarImpl"]["call"](v125);
      const v127 = v125["refBarEl"]["querySelector"](".rh-v5-ref-container");
      (strict["deepEqual"](
        Array["from"](v127["querySelectorAll"]("[data-slot]"))["map"](
          (v128) => v128["dataset"]["slot"],
        ),
        ["editVideo", "featureReferenceVideo", "referenceImage"],
      ),
        strict["ok"](v127["querySelector"]('[data-slot="editVideo"]')),
        strict["ok"](
          v127["querySelector"]('[data-slot="featureReferenceVideo"]'),
        ),
        strict["ok"](v127["querySelector"]('[data-slot="referenceImage"]')));
    } finally {
      if (typeof v121 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v121;
    }
  }),
  test("video reference input: RunningHub Kling O1 reference mode puts video slot first", async () => {
    const v129 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v130 = "node-runninghub-kling-o1",
        v131 = {
          nodes: {
            [v130]: {
              id: v130,
              type: "ai-video",
              model: "runninghub-model/kling-video-o1",
              provider: "runninghub",
              generationParams: { rh_kling_o1_generation_mode: "reference" },
            },
          },
        },
        v132 = createVideoNodeReferenceInputModule({
          store: { getState: () => v131, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v133 = Object["assign"](Object["create"](v132), {
          nodeId: v130,
          _data: v131["nodes"][v130],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (v134) => String(v134 || ""),
          _syncBtnIconState: () => {},
        });
      await v132["_renderRefBarImpl"]["call"](v133);
      const v135 = v133["refBarEl"]["querySelector"](".rh-v5-ref-container");
      (strict["deepEqual"](
        Array["from"](v135["querySelectorAll"]("[data-slot]"))["map"](
          (v136) => v136["dataset"]["slot"],
        ),
        ["referenceVideo", "referenceImage"],
      ),
        strict["ok"](v135["querySelector"]('[data-slot="referenceVideo"]')),
        strict["ok"](v135["querySelector"]('[data-slot="referenceImage"]')));
    } finally {
      if (typeof v129 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v129;
    }
  }),
  test("video reference input: RunningHub Kling O3 reference mode puts video slot first", async () => {
    const v137 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v138 = "node-runninghub-kling-o3",
        v139 = {
          nodes: {
            [v138]: {
              id: v138,
              type: "ai-video",
              model: "runninghub-model/kling-o3",
              provider: "runninghub",
              generationParams: { kling_v3_omni_mode: "reference" },
            },
          },
        },
        v140 = createVideoNodeReferenceInputModule({
          store: { getState: () => v139, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v141 = Object["assign"](Object["create"](v140), {
          nodeId: v138,
          _data: v139["nodes"][v138],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (v142) => String(v142 || ""),
          _syncBtnIconState: () => {},
        });
      await v140["_renderRefBarImpl"]["call"](v141);
      const v143 = v141["refBarEl"]["querySelector"](".rh-v5-ref-container");
      (strict["deepEqual"](
        Array["from"](v143["querySelectorAll"]("[data-slot]"))["map"](
          (v144) => v144["dataset"]["slot"],
        ),
        ["referenceVideo", "referenceImage"],
      ),
        strict["ok"](v143["querySelector"]('[data-slot="referenceVideo"]')),
        strict["ok"](v143["querySelector"]('[data-slot="referenceImage"]')));
    } finally {
      if (typeof v137 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v137;
    }
  }),
  test("video\x20reference\x20input:\x20RunningHub\x20Seedance\x202.0\x20switches\x20route\x20slots", () => {
    const v145 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "runninghub-model/seedance-2.0",
      provider: "runninghub",
      generationParams: { rh_seedance_2_mode: "text2video" },
    });
    strict["deepEqual"](v145?.["visibleSlots"] || [], []);
    const v146 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "runninghub-model/seedance-2.0",
      provider: "runninghub",
      generationParams: { rh_seedance_2_mode: "image2video" },
    });
    strict["deepEqual"](v146?.["visibleSlots"], ["firstFrame"]);
    const v147 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "runninghub-model/seedance-2.0",
      provider: "runninghub",
      generationParams: { rh_seedance_2_mode: "frames2video" },
    });
    strict["deepEqual"](v147?.["visibleSlots"], ["firstFrame", "lastFrame"]);
    const v148 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "runninghub-model/seedance-2.0",
      provider: "runninghub",
      generationParams: { rh_seedance_2_mode: "multimodal2video" },
    });
    (strict["deepEqual"](v148?.["visibleSlots"], [
      "referenceVideo",
      "referenceImage",
      "referenceAudio",
    ]),
      strict["equal"](
        v148?.["slotById"]?.["referenceVideo"]?.["kind"],
        "video",
      ),
      strict["equal"](
        v148?.["slotById"]?.["referenceImage"]?.["kind"],
        "image",
      ),
      strict["equal"](
        v148?.["slotById"]?.["referenceAudio"]?.["kind"],
        "audio",
      ));
  }),
  test("video\x20reference\x20input:\x20Volcengine\x20Seedance\x202.0\x20reuses\x20Dreamina\x20generic\x20refbar", () => {
    const v149 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "volcengine/seedance-2.0-fast",
      provider: "volcengine",
      generationParams: { dreaminaRouteMode: "multimodal2video" },
    });
    strict["equal"](v149, null);
    const v150 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "volcengine/seedance-2.0-fast",
      provider: "volcengine",
      generationParams: { dreaminaRouteMode: "frames2video" },
    });
    strict["equal"](v150, null);
  }),
  test("video reference input: APIMart fixed slots ignore stale RunningHub visibility flags", () => {
    const v151 = [{ rhSpecialMode: "cameraMove" }, { rhSubtractSubject: true }];
    for (const v152 of v151) {
      const v153 = getFixedInputSlotConfigFromManifest({
        type: "ai-video",
        model: "apimart/veo3-fast",
        provider: "apimart",
        generationParams: { mode: "fast", generation_type: "frame" },
        ...v152,
      });
      strict["deepEqual"](v153?.["visibleSlots"], ["firstFrame", "lastFrame"]);
      const v154 = getFixedInputSlotConfigFromManifest({
        type: "ai-video",
        model: "apimart/minimax-hailuo",
        provider: "apimart",
        generationParams: {},
        ...v152,
      });
      strict["deepEqual"](v154?.["visibleSlots"], ["firstFrame", "lastFrame"]);
      const v155 = getFixedInputSlotConfigFromManifest({
        type: "ai-video",
        model: "apimart/minimax-hailuo-2.3",
        provider: "apimart",
        generationParams: { mode: "fast" },
        ...v152,
      });
      strict["deepEqual"](v155?.["visibleSlots"], ["firstFrame"]);
    }
  }),
  test("video reference input: RunningHub Hailuo 02 hides tail frame outside standard mode", () => {
    const v156 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "runninghub-model/hailuo-02",
      provider: "runninghub",
      generationParams: { rh_hailuo_02_quality: "standard" },
    });
    strict["deepEqual"](v156?.["visibleSlots"], ["firstFrame", "lastFrame"]);
    const v157 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "runninghub-model/hailuo-02",
      provider: "runninghub",
      generationParams: { rh_hailuo_02_quality: "pro" },
    });
    strict["deepEqual"](v157?.["visibleSlots"], ["firstFrame"]);
    const v158 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "runninghub-model/hailuo-02",
      provider: "runninghub",
      generationParams: { rh_hailuo_02_quality: "fast" },
    });
    strict["deepEqual"](v158?.["visibleSlots"], ["firstFrame"]);
  }),
  test("video reference input: RunningHub Hailuo 2.3 only exposes first-frame slot", () => {
    for (const v159 of ["standard", "pro", "fast", "fastPro"]) {
      const v160 = getFixedInputSlotConfigFromManifest({
        type: "ai-video",
        model: "runninghub-model/hailuo-2.3",
        provider: "runninghub",
        generationParams: { rh_hailuo_23_quality: v159 },
      });
      strict["deepEqual"](v160?.["visibleSlots"], ["firstFrame"]);
    }
  }),
  test("video\x20reference\x20input:\x20VEO3\x20reference\x20mode\x20does\x20not\x20use\x20fixed\x20slots", () => {
    const v161 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "apimart/veo3-fast",
      provider: "apimart",
      generationParams: { mode: "fast", generation_type: "frame" },
    });
    strict["deepEqual"](v161?.["visibleSlots"], ["firstFrame", "lastFrame"]);
    const v162 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "apimart/veo3-fast",
      provider: "apimart",
      generationParams: { mode: "fast", generation_type: "reference" },
    });
    strict["equal"](v162, null);
  }),
  test("video reference input: Vidu Q3 hides fixed slots in reference mode", () => {
    const v163 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "apimart/viduq3",
      provider: "apimart",
      generationParams: {
        vidu_q3_generation_mode: "video",
        mode: "viduq3-turbo",
      },
    });
    strict["deepEqual"](v163?.["visibleSlots"], ["firstFrame", "lastFrame"]);
    const v164 = getFixedInputSlotConfigFromManifest({
      type: "ai-video",
      model: "apimart/viduq3",
      provider: "apimart",
      generationParams: {
        vidu_q3_generation_mode: "reference",
        mode: "viduq3",
      },
    });
    strict["equal"](v164, null);
  }),
  test("video\x20reference\x20input:\x20manifest\x20fixed-slot\x20overflow\x20media\x20shows\x20in\x20refbar", async () => {
    const v165 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v166 = "node-happyhorse-reference",
        v167 = {
          nodes: {
            [v166]: {
              id: v166,
              type: "ai-video",
              model: "apimart/happyhorse-1.0",
              provider: "apimart",
              generationParams: { happyhorse_mode: "reference" },
            },
            img1: {
              id: "img1",
              type: "source-image",
              localPath: "data/assets/hh-ref-1.png",
            },
            img2: {
              id: "img2",
              type: "source-image",
              localPath: "data/assets/hh-ref-2.png",
            },
          },
        },
        v168 = [
          {
            id: "edge-img1",
            sourceId: "img1",
            targetId: v166,
            refSlot: "referenceImage",
          },
          { id: "edge-img2", sourceId: "img2", targetId: v166 },
        ],
        v169 = createVideoNodeReferenceInputModule({
          store: { getState: () => v167, getIncomingEdges: () => v168 },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v170 = Object["assign"](Object["create"](v169), {
          nodeId: v166,
          _data: v167["nodes"][v166],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (v171) => String(v171 || ""),
          _syncBtnIconState: () => {},
        });
      await v169["_renderRefBarImpl"]["call"](v170);
      const v172 = v170["refBarEl"]["querySelector"](".rh-v5-ref-container"),
        v173 = v172["querySelector"]('[data-slot="referenceImage"]'),
        v174 = v172["querySelectorAll"](".rh-fixed-extra-ref");
      (strict["equal"](v173["dataset"]["sourceId"], "img1"),
        strict["ok"](
          v174["some"]((v175) => v175["dataset"]["sourceId"] === "img2"),
          "second reference image should render as an extra thumbnail",
        ));
    } finally {
      if (typeof v165 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v165;
    }
  }),
  test("video reference input: stale refSlot from previous model fills current modelApi slot", async () => {
    const v176 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v177 = "node-veo3-stale-refslot",
        v178 = {
          nodes: {
            [v177]: {
              id: v177,
              type: "ai-video",
              model: "apimart/veo3-fast",
              provider: "apimart",
              generationParams: { mode: "fast", generation_type: "frame" },
            },
            img1: {
              id: "img1",
              type: "source-image",
              localPath: "data/assets/old-ref.png",
            },
          },
        },
        v179 = [
          {
            id: "edge-stale-ref",
            sourceId: "img1",
            targetId: v177,
            refSlot: "refImage",
          },
        ],
        v180 = createVideoNodeReferenceInputModule({
          store: { getState: () => v178, getIncomingEdges: () => v179 },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v181 = Object["assign"](Object["create"](v180), {
          nodeId: v177,
          _data: v178["nodes"][v177],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (v182) => String(v182 || ""),
          _syncBtnIconState: () => {},
        });
      await v180["_renderRefBarImpl"]["call"](v181);
      const v183 = v181["refBarEl"]["querySelector"](".rh-v5-ref-container"),
        v184 = v183["querySelector"]('[data-slot="firstFrame"]'),
        v185 = v183["querySelector"]("[data-slot=\x22lastFrame\x22]");
      (strict["equal"](v184["dataset"]["edgeId"], "edge-stale-ref"),
        strict["equal"](v184["dataset"]["sourceId"], "img1"),
        strict["equal"](v185["dataset"]["refOrigin"], ""));
    } finally {
      if (typeof v176 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v176;
    }
  }),
  test("video reference input: V5.4 asset mentions render as virtual fixed-slot thumbnails", async () => {
    const v186 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v187 = "node-v54-assets",
        v188 = {
          nodes: {
            [v187]: {
              id: v187,
              type: "ai-video",
              model: "runninghub/2041741496667348994",
              provider: "runninghubwf",
              rhSubtractSubject: false,
            },
          },
        };
      setAssetMentionAssets([
        {
          id: "asset-v54",
          items: [
            {
              name: "source\x20clip",
              type: "source-video",
              thumbSrc: "data/assets/source-thumb.jpg",
              nodeData: {
                type: "source-video",
                localPath: "data/assets/source.mp4",
              },
            },
            {
              name: "mask clip",
              type: "source-video",
              thumbSrc: "data/assets/mask-thumb.jpg",
              nodeData: {
                type: "source-video",
                localPath: "data/assets/mask.mp4",
              },
            },
            {
              name: "reference\x20image",
              type: "source-image",
              thumbSrc: "data/assets/ref-thumb.jpg",
              nodeData: {
                type: "source-image",
                originalLocalPath: "data/assets/ref.png",
              },
            },
            {
              name: "first\x20frame",
              type: "source-image",
              thumbSrc: "data/assets/first-thumb.jpg",
              nodeData: {
                type: "source-image",
                originalLocalPath: "data/assets/first.png",
              },
            },
          ],
        },
      ]);
      const v189 = createVideoNodeReferenceInputModule({
          store: { getState: () => v188, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v190 = Object["assign"](Object["create"](v189), {
          nodeId: v187,
          _data: v188["nodes"][v187],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl([
            makeAssetPill({
              assetId: "asset-v54",
              assetIndex: 0,
              type: "video",
              label: "source clip",
            }),
            makeAssetPill({
              assetId: "asset-v54",
              assetIndex: 1,
              type: "video",
              label: "mask clip",
            }),
            makeAssetPill({
              assetId: "asset-v54",
              assetIndex: 2,
              type: "image",
              label: "reference image",
            }),
            makeAssetPill({
              assetId: "asset-v54",
              assetIndex: 3,
              type: "image",
              label: "first\x20frame",
            }),
          ]),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => true,
          _resolveMediaUrl: (v191) => String(v191 || ""),
          _syncBtnIconState: () => {},
        });
      await v189["_renderRefBarImpl"]["call"](v190);
      const v192 = v190["refBarEl"]["querySelector"](".rh-v5-ref-container"),
        v193 = v192["querySelector"]('[data-slot="sourceVideo"]'),
        v194 = v192["querySelector"]('[data-slot="videoMask"]'),
        v195 = v192["querySelector"]('[data-slot="refImage"]'),
        v196 = v192["querySelector"]('[data-slot="firstFrame"]');
      (strict["equal"](v193["dataset"]["refOrigin"], "asset"),
        strict["equal"](v194["dataset"]["refOrigin"], "asset"),
        strict["equal"](v195["dataset"]["refOrigin"], "asset"),
        strict["equal"](v196["dataset"]["refOrigin"], "asset"),
        strict["equal"](v193["dataset"]["assetId"], "asset-v54"),
        strict["equal"](v193["dataset"]["assetIndex"], "0"),
        strict["equal"](v193["dataset"]["assetOccurrence"], "0"),
        strict["equal"](v193["dataset"]["refType"], "video"),
        strict["match"](v193["innerHTML"], /source-thumb/),
        strict["match"](v194["innerHTML"], /mask-thumb/),
        strict["match"](v195["innerHTML"], /ref-thumb/),
        strict["match"](v196["innerHTML"], /first-thumb/),
        strict["match"](v193["innerHTML"], /ref-thumb-delete/));
    } finally {
      if (typeof v186 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v186;
    }
  }),
  test("video reference input: V5.4 hidden asset refs render as virtual fixed-slot thumbnails", async () => {
    const v197 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v198 = "node-v54-hidden-assets",
        v199 = {
          nodes: {
            [v198]: {
              id: v198,
              type: "ai-video",
              model: "runninghub/2041741496667348994",
              provider: "runninghubwf",
              promptAssetInputRefs: [
                { assetId: "asset-v54-hidden", itemIndex: 0, type: "video" },
                { assetId: "asset-v54-hidden", itemIndex: 1, type: "image" },
              ],
            },
          },
        };
      setAssetMentionAssets([
        {
          id: "asset-v54-hidden",
          items: [
            {
              name: "source clip",
              type: "source-video",
              thumbSrc: "data/assets/source-thumb.jpg",
              nodeData: {
                type: "source-video",
                localPath: "data/assets/source.mp4",
              },
            },
            {
              name: "reference\x20image",
              type: "source-image",
              thumbSrc: "data/assets/ref-thumb.jpg",
              nodeData: {
                type: "source-image",
                originalLocalPath: "data/assets/ref.png",
              },
            },
          ],
        },
      ]);
      const v200 = createVideoNodeReferenceInputModule({
          store: { getState: () => v199, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v201 = Object["assign"](Object["create"](v200), {
          nodeId: v198,
          _data: v199["nodes"][v198],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl(),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => true,
          _resolveMediaUrl: (v202) => String(v202 || ""),
          _syncBtnIconState: () => {},
        });
      await v200["_renderRefBarImpl"]["call"](v201);
      const v203 = v201["refBarEl"]["querySelector"](".rh-v5-ref-container"),
        v204 = v203["querySelector"]('[data-slot="sourceVideo"]'),
        v205 = v203["querySelector"]('[data-slot="refImage"]');
      (strict["equal"](v204["dataset"]["refOrigin"], "asset"),
        strict["equal"](v204["dataset"]["assetRefSource"], "hidden"),
        strict["equal"](v204["dataset"]["assetId"], "asset-v54-hidden"),
        strict["equal"](v204["dataset"]["refType"], "video"),
        strict["equal"](v205["dataset"]["refOrigin"], "asset"),
        strict["equal"](v205["dataset"]["assetRefSource"], "hidden"),
        strict["equal"](v205["dataset"]["refType"], "image"),
        strict["match"](v204["innerHTML"], /source-thumb/),
        strict["match"](v205["innerHTML"], /ref-thumb/));
    } finally {
      if (typeof v197 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v197;
    }
  }),
  test("video reference input: asset mentions render as generic thumbnails with delete", async () => {
    const v206 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v207 = "node-generic-assets",
        v208 = {
          nodes: {
            [v207]: {
              id: v207,
              type: "ai-video",
              model: "generic/video",
              provider: "grsai",
            },
          },
        };
      setAssetMentionAssets([
        {
          id: "asset-generic",
          items: [
            {
              name: "reference\x20image",
              type: "source-image",
              thumbSrc: "data/assets/ref-thumb.jpg",
              nodeData: {
                type: "source-image",
                originalLocalPath: "data/assets/ref.png",
              },
            },
          ],
        },
      ]);
      const v209 = createVideoNodeReferenceInputModule({
          store: { getState: () => v208, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v210 = Object["assign"](Object["create"](v209), {
          nodeId: v207,
          _data: v208["nodes"][v207],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl([
            makeAssetPill({
              assetId: "asset-generic",
              assetIndex: 0,
              type: "image",
              label: "reference\x20image",
            }),
          ]),
          _refThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => false,
          _resolveMediaUrl: (v211) => String(v211 || ""),
          _syncBtnIconState: () => {},
        });
      await v209["_renderRefBarImpl"]["call"](v210);
      const v212 = v210["refBarEl"]["querySelector"](".ref-thumb-container"),
        v213 = v212["childNodes"]["find"](
          (v214) => v214["dataset"]?.["refOrigin"] === "asset",
        );
      (strict["equal"](v213["dataset"]["refOrigin"], "asset"),
        strict["equal"](v213["dataset"]["assetId"], "asset-generic"),
        strict["equal"](v213["dataset"]["assetIndex"], "0"),
        strict["equal"](v213["dataset"]["assetOccurrence"], "0"),
        strict["equal"](v213["dataset"]["refType"], "image"),
        strict["match"](v213["innerHTML"], /ref-thumb-delete/),
        strict["match"](v213["innerHTML"], /ref-thumb/));
    } finally {
      if (typeof v206 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v206;
    }
  }),
  test("video reference input: fixed-slot asset mentions fill other RH models and trail text", async () => {
    const v215 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v216 = "node-ltx-assets",
        v217 = {
          nodes: {
            [v216]: {
              id: v216,
              type: "ai-video",
              model: "runninghub/2039336644536442882",
              provider: "runninghubwf",
            },
          },
        };
      setAssetMentionAssets([
        {
          id: "asset-ltx",
          items: [
            {
              name: "reference image",
              type: "source-image",
              thumbSrc: "data/assets/ref-thumb.jpg",
              nodeData: {
                type: "source-image",
                originalLocalPath: "data/assets/ref.png",
              },
            },
            {
              name: "voice",
              type: "source-audio",
              nodeData: {
                type: "source-audio",
                localPath: "data/assets/voice.mp3",
              },
            },
            {
              name: "lyrics",
              type: "source-text",
              nodeData: { type: "source-text", text: "hello" },
            },
          ],
        },
      ]);
      const v218 = createVideoNodeReferenceInputModule({
          store: { getState: () => v217, getIncomingEdges: () => [] },
          api: {},
          _syncPillLabels: () => {},
          getImage: async () => null,
          ensureThumbDecoded: () => {},
          revealRefThumbMedia: () => {},
        }),
        v219 = Object["assign"](Object["create"](v218), {
          nodeId: v216,
          _data: v217["nodes"][v216],
          refBarEl: createFakeElement("div"),
          promptEl: makePromptEl([
            makeAssetPill({
              assetId: "asset-ltx",
              assetIndex: 0,
              type: "image",
              label: "reference image",
            }),
            makeAssetPill({
              assetId: "asset-ltx",
              assetIndex: 1,
              type: "audio",
              label: "voice",
            }),
            makeAssetPill({
              assetId: "asset-ltx",
              assetIndex: 2,
              type: "text",
              label: "lyrics",
            }),
          ]),
          _fixedSlotRefThumbObjectUrls: new Map(),
          _videoThumbPending: new Set(),
          _isRunninghubWorkflowModel: () => true,
          _resolveMediaUrl: (v220) => String(v220 || ""),
          _syncBtnIconState: () => {},
        });
      await v218["_renderRefBarImpl"]["call"](v219);
      const v221 = v219["refBarEl"]["querySelector"](".rh-v5-ref-container"),
        v222 = v221["querySelector"]("[data-slot=\x22refImage\x22]"),
        v223 = v221["querySelector"]('[data-slot="audio"]'),
        v224 = v221["querySelector"](".rh-fixed-extra-ref");
      (strict["equal"](v222["dataset"]["refOrigin"], "asset"),
        strict["equal"](v222["dataset"]["refType"], "image"),
        strict["equal"](v223["dataset"]["refOrigin"], "asset"),
        strict["equal"](v223["dataset"]["refType"], "audio"),
        strict["equal"](v224["dataset"]["refOrigin"], "asset"),
        strict["equal"](v224["dataset"]["refType"], "text"),
        strict["ok"](
          v221["childNodes"]["indexOf"](v224) >
            v221["childNodes"]["indexOf"](v223),
        ),
        strict["match"](v224["innerHTML"], /ref-thumb-delete/));
    } finally {
      if (typeof v215 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v215;
    }
  }),
  test("video reference input: LTX display area follows manifest refImage ratio", async () => {
    const v225 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v226 = "node-ltx-ref-ratio",
        { state: v227 } = await renderFixedRefBarForTest({
          targetId: v226,
          model: "runninghub/2039336644536442882",
          nodeData: { width: 300, height: 300, x: 100, y: 200 },
          nodes: {
            "source-ref-image": {
              id: "source-ref-image",
              type: "source-image",
              width: 600,
              height: 1000,
              localPath: "data/assets/ref.png",
            },
            "source-audio": {
              id: "source-audio",
              type: "source-audio",
              localPath: "data/assets/voice.mp3",
            },
          },
          incomingEdges: [
            {
              id: "edge-ref",
              sourceId: "source-ref-image",
              targetId: v226,
              refSlot: "refImage",
            },
            {
              id: "edge-audio",
              sourceId: "source-audio",
              targetId: v226,
              refSlot: "audio",
            },
          ],
        });
      (strict["equal"](v227["nodes"][v226]["width"], 300),
        strict["equal"](v227["nodes"][v226]["height"], 500),
        strict["equal"](v227["nodes"][v226]["x"], 100),
        strict["equal"](v227["nodes"][v226]["y"], 0),
        strict["equal"](v227["nodes"][v226]["aspectRatio"], "自适应"));
    } finally {
      if (typeof v225 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v225;
    }
  }),
  test("video reference input: LipSync display area follows source video ratio", async () => {
    const v228 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v229 = "node-lipsync-video-ratio",
        { state: v230 } = await renderFixedRefBarForTest({
          targetId: v229,
          model: "runninghub/2054101324521844738",
          nodeData: { width: 300, height: 300, x: 100, y: 200 },
          nodes: {
            "source-video": {
              id: "source-video",
              type: "source-video",
              width: 1280,
              height: 720,
              localPath: "data/assets/source.mp4",
              thumbUrl: "data/assets/source-thumb.jpg",
            },
            "source-audio": {
              id: "source-audio",
              type: "source-audio",
              localPath: "data/assets/voice.mp3",
            },
          },
          incomingEdges: [
            {
              id: "edge-video",
              sourceId: "source-video",
              targetId: v229,
              refSlot: "sourceVideo",
            },
            {
              id: "edge-audio",
              sourceId: "source-audio",
              targetId: v229,
              refSlot: "audio",
            },
          ],
        });
      (strict["equal"](v230["nodes"][v229]["width"], 533),
        strict["equal"](v230["nodes"][v229]["height"], 300),
        strict["equal"](v230["nodes"][v229]["x"], -16),
        strict["equal"](v230["nodes"][v229]["y"], 200),
        strict["equal"](v230["nodes"][v229]["aspectRatio"], "自适应"));
    } finally {
      if (typeof v228 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v228;
    }
  }),
  test("video reference input: LipSync display area follows ref image ratio", async () => {
    const v231 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v232 = "node-lipsync-image-ratio",
        { state: v233 } = await renderFixedRefBarForTest({
          targetId: v232,
          model: "runninghub/2054101324521844738",
          nodeData: { width: 300, height: 300, x: 100, y: 200 },
          nodes: {
            "source-ref-image": {
              id: "source-ref-image",
              type: "source-image",
              width: 600,
              height: 1000,
              localPath: "data/assets/ref.png",
            },
            "source-audio": {
              id: "source-audio",
              type: "source-audio",
              localPath: "data/assets/voice.mp3",
            },
          },
          incomingEdges: [
            {
              id: "edge-ref",
              sourceId: "source-ref-image",
              targetId: v232,
              refSlot: "refImage",
            },
            {
              id: "edge-audio",
              sourceId: "source-audio",
              targetId: v232,
              refSlot: "audio",
            },
          ],
        });
      (strict["equal"](v233["nodes"][v232]["width"], 300),
        strict["equal"](v233["nodes"][v232]["height"], 500),
        strict["equal"](v233["nodes"][v232]["x"], 100),
        strict["equal"](v233["nodes"][v232]["y"], 0),
        strict["equal"](v233["nodes"][v232]["aspectRatio"], "自适应"));
    } finally {
      if (typeof v231 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v231;
    }
  }));
async function renderFixedRefBarForTest({
  targetId: targetId = "node-fixed-refbar",
  model: v234,
  nodeData: nodeData = {},
  nodes: nodes = {},
  incomingEdges: incomingEdges = [],
  assetId: assetId = "",
  assetItems: assetItems = [],
  pills: pills = [],
  api: api = {},
} = {}) {
  assetId &&
    assetItems["length"] &&
    setAssetMentionAssets([{ id: assetId, items: assetItems }]);
  const v235 = {
      nodes: {
        ...nodes,
        [targetId]: {
          id: targetId,
          type: "ai-video",
          model: v234,
          provider: "runninghubwf",
          ...nodeData,
        },
      },
    },
    v236 = createVideoNodeReferenceInputModule({
      store: {
        getState: () => v235,
        getIncomingEdges: () => incomingEdges,
        removeEdge: (v237) => {
          const v238 = incomingEdges["findIndex"](
            (v239) => v239["id"] === v237,
          );
          if (v238 >= 0) incomingEdges["splice"](v238, 1);
        },
        updateNodeData: (v240, v241) => {
          v235["nodes"][v240] = {
            ...(v235["nodes"][v240] || {}),
            ...(v241 || {}),
          };
        },
        batch: (v242) => v242(),
      },
      api: api,
      _syncPillLabels: () => {},
      getImage: async () => null,
      ensureThumbDecoded: () => {},
      revealRefThumbMedia: () => {},
    }),
    v243 = Object["assign"](Object["create"](v236), {
      nodeId: targetId,
      _data: v235["nodes"][targetId],
      refBarEl: createFakeElement("div"),
      promptEl: makePromptEl(
        pills["map"]((v244) =>
          makeAssetPill({
            assetId: assetId,
            assetIndex: v244["assetIndex"],
            type: v244["type"],
            label: v244["label"],
          }),
        ),
      ),
      _fixedSlotRefThumbObjectUrls: new Map(),
      _videoThumbPending: new Set(),
      _resolveMediaUrl: (v245) => String(v245 || ""),
      _syncBtnIconState: () => {},
    });
  return (
    await v236["_renderRefBarImpl"]["call"](v243),
    {
      ctx: v243,
      container: v243["refBarEl"]["querySelector"](".rh-v5-ref-container"),
      state: v235,
    }
  );
}
(test("video\x20reference\x20input:\x20Basic\x20and\x20LipSync\x20fixed\x20slots\x20are\x20manifest-rendered\x20from\x20asset\x20pills", async () => {
  const v246 = globalThis["document"];
  globalThis["document"] = { createElement: createFakeElement };
  try {
    const v247 = [
      {
        label: "basic",
        model: "runninghub/1971148165531475969",
        assetId: "asset-basic-refbar",
        items: [
          {
            name: "source clip",
            type: "source-video",
            thumbSrc: "data/assets/source-thumb.jpg",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/source.mp4",
            },
          },
          {
            name: "reference image",
            type: "source-image",
            thumbSrc: "data/assets/ref-thumb.jpg",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/ref.png",
            },
          },
        ],
        pills: [
          { assetIndex: 0, type: "video", label: "source clip" },
          { assetIndex: 1, type: "image", label: "reference image" },
        ],
        slots: [
          ["sourceVideo", "video"],
          ["refImage", "image"],
        ],
      },
      {
        label: "lipsync",
        model: "runninghub/2054101324521844738",
        assetId: "asset-lipsync-refbar",
        items: [
          {
            name: "source\x20clip",
            type: "source-video",
            thumbSrc: "data/assets/source-thumb.jpg",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/source.mp4",
            },
          },
          {
            name: "voice",
            type: "source-audio",
            nodeData: {
              type: "source-audio",
              localPath: "data/assets/voice.mp3",
            },
          },
        ],
        pills: [
          { assetIndex: 0, type: "video", label: "source clip" },
          { assetIndex: 1, type: "audio", label: "voice" },
        ],
        slots: [
          ["sourceVideo", "video"],
          ["audio", "audio"],
        ],
      },
    ];
    for (const v248 of v247) {
      _resetAssetMentionRegistryForTests();
      const { container: v249 } = await renderFixedRefBarForTest({
        targetId: "node-" + v248["label"] + "-refbar-assets",
        model: v248["model"],
        assetId: v248["assetId"],
        assetItems: v248["items"],
        pills: v248["pills"],
      });
      strict["ok"](v249, v248["label"]);
      for (const [v250, v251] of v248["slots"]) {
        const v252 = v249["querySelector"]('[data-slot="' + v250 + "\x22]");
        (strict["equal"](
          v252["dataset"]["refOrigin"],
          "asset",
          v248["label"] + ":" + v250,
        ),
          strict["equal"](
            v252["dataset"]["kind"],
            v251,
            v248["label"] + ":" + v250,
          ),
          strict["equal"](
            v252["dataset"]["refType"],
            v251,
            v248["label"] + ":" + v250,
          ),
          strict["equal"](
            v252["dataset"]["assetId"],
            v248["assetId"],
            v248["label"] + ":" + v250,
          ));
      }
    }
  } finally {
    if (typeof v246 === "undefined") delete globalThis["document"];
    else globalThis["document"] = v246;
  }
}),
  test("video\x20reference\x20input:\x20HD\x20VIP\x20and\x20Matting\x20render\x20fixed\x20slots\x20from\x20manifest", async () => {
    const v253 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      {
        const { container: v254 } = await renderFixedRefBarForTest({
            targetId: "node-hd-vip-refbar",
            model: "runninghub/2047787809091620866",
          }),
          v255 = Array["from"](v254["querySelectorAll"]("[data-slot]"))["map"](
            (v256) => v256["dataset"]["slot"],
          );
        (strict["deepEqual"](v255, ["sourceVideo"]),
          strict["equal"](
            v254["querySelector"]('[data-slot="sourceVideo"]')["dataset"][
              "kind"
            ],
            "video",
          ));
      }
      {
        const { container: v257 } = await renderFixedRefBarForTest({
            targetId: "node-matting-refbar",
            model: "runninghub/video_matting",
          }),
          v258 = Array["from"](v257["querySelectorAll"]("[data-slot]"))["map"](
            (v259) => v259["dataset"]["slot"],
          );
        (strict["deepEqual"](v258, ["sourceVideo", "maskImage"]),
          strict["equal"](
            v257["querySelector"]('[data-slot="sourceVideo"]')["dataset"][
              "kind"
            ],
            "video",
          ),
          strict["equal"](
            v257["querySelector"]('[data-slot="maskImage"]')["dataset"]["kind"],
            "image",
          ));
      }
    } finally {
      if (typeof v253 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v253;
    }
  }),
  test("video reference input: V5.4 cameraMove renders only required slots", async () => {
    const v260 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const { container: v261 } = await renderFixedRefBarForTest({
          targetId: "node-v54-camera",
          model: "runninghub/2041741496667348994",
          nodeData: { rhSpecialMode: "cameraMove" },
        }),
        v262 = Array["from"](v261["querySelectorAll"]("[data-slot]"))["map"](
          (v263) => v263["dataset"]["slot"],
        );
      (strict["deepEqual"](v262, ["sourceVideo", "refImage"]),
        strict["equal"](
          v261["querySelector"]('[data-slot="firstFrame"]'),
          null,
        ),
        strict["equal"](
          v261["querySelector"]('[data-slot="videoMask"]'),
          null,
        ));
    } finally {
      if (typeof v260 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v260;
    }
  }),
  test("video reference input: V5.4 subtract hides mask video and first frame slots", async () => {
    const v264 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const { container: v265 } = await renderFixedRefBarForTest({
          targetId: "node-v54-subtract",
          model: "runninghub/2041741496667348994",
          nodeData: { rhSubtractSubject: true },
        }),
        v266 = Array["from"](v265["querySelectorAll"]("[data-slot]"))["map"](
          (v267) => v267["dataset"]["slot"],
        );
      (strict["deepEqual"](v266, ["sourceVideo", "refImage"]),
        strict["equal"](
          v265["querySelector"]('[data-slot="firstFrame"]'),
          null,
        ),
        strict["equal"](
          v265["querySelector"]('[data-slot="videoMask"]'),
          null,
        ));
    } finally {
      if (typeof v264 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v264;
    }
  }),
  test("video\x20reference\x20input:\x20V5.4\x20subtract\x20toggle\x20reuses\x20visible\x20fixed\x20slots", async () => {
    const v268 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v269 = "node-v54-subtract-toggle",
        { ctx: v270, state: v271 } = await renderFixedRefBarForTest({
          targetId: v269,
          model: "runninghub/2041741496667348994",
          nodeData: { rhSubtractSubject: false },
        }),
        v272 = v270["refBarEl"],
        v273 = v272["querySelector"](".rh-v5-ref-container"),
        v274 = v273["querySelector"]('[data-slot="sourceVideo"]'),
        v275 = v273["querySelector"]('[data-slot="refImage"]'),
        v276 = v272["_innerHTMLSetCount"];
      (strict["ok"](v276 >= 1),
        (v271["nodes"][v269]["rhSubtractSubject"] = true),
        (v270["_data"] = v271["nodes"][v269]),
        await v270["_renderRefBarImpl"](),
        strict["equal"](v272["_innerHTMLSetCount"], v276),
        strict["deepEqual"](
          Array["from"](v273["querySelectorAll"]("[data-slot]"))["map"](
            (v277) => v277["dataset"]["slot"],
          ),
          ["sourceVideo", "refImage"],
        ),
        strict["equal"](
          v273["querySelector"]("[data-slot=\x22sourceVideo\x22]"),
          v274,
        ),
        strict["equal"](v273["querySelector"]('[data-slot="refImage"]'), v275),
        (v271["nodes"][v269]["rhSubtractSubject"] = false),
        (v270["_data"] = v271["nodes"][v269]),
        await v270["_renderRefBarImpl"](),
        strict["equal"](v272["_innerHTMLSetCount"], v276),
        strict["deepEqual"](
          Array["from"](v273["querySelectorAll"]("[data-slot]"))["map"](
            (v278) => v278["dataset"]["slot"],
          ),
          ["sourceVideo", "refImage", "firstFrame", "videoMask"],
        ),
        strict["equal"](
          v273["querySelector"]('[data-slot="sourceVideo"]'),
          v274,
        ),
        strict["equal"](v273["querySelector"]('[data-slot="refImage"]'), v275));
    } finally {
      if (typeof v268 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v268;
    }
  }),
  test("video\x20reference\x20input:\x20同构固定入参模型切换不清空缩略图\x20DOM", async () => {
    const v279 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v280 = "node-fixed-model-switch",
        {
          ctx: v281,
          state: v282,
          container: v283,
        } = await renderFixedRefBarForTest({
          targetId: v280,
          model: "runninghub/1971148165531475969",
          nodes: {
            sourceVideo: {
              id: "sourceVideo",
              type: "source-video",
              localPath: "data/source.mp4",
              thumbUrl: "data/source-thumb.jpg",
            },
            refImage: {
              id: "refImage",
              type: "source-image",
              localPath: "data/ref.png",
              thumbUrl: "data/ref-thumb.jpg",
            },
          },
          incomingEdges: [
            {
              id: "edge-source",
              sourceId: "sourceVideo",
              targetId: v280,
              refSlot: "sourceVideo",
            },
            {
              id: "edge-ref",
              sourceId: "refImage",
              targetId: v280,
              refSlot: "refImage",
            },
          ],
        }),
        v284 = v281["refBarEl"],
        v285 = v283["querySelector"]('[data-slot="sourceVideo"]'),
        v286 = v283["querySelector"]('[data-slot="refImage"]'),
        v287 = v284["_innerHTMLSetCount"];
      ((v282["nodes"][v280] = {
        ...v282["nodes"][v280],
        model: "runninghub/2041741496667348994",
        rhSubtractSubject: true,
      }),
        (v281["_data"] = v282["nodes"][v280]),
        await v281["_renderRefBarImpl"](),
        strict["equal"](v284["_innerHTMLSetCount"], v287),
        strict["equal"](
          v283["querySelector"]("[data-slot=\x22sourceVideo\x22]"),
          v285,
        ),
        strict["equal"](v283["querySelector"]('[data-slot="refImage"]'), v286));
    } finally {
      if (typeof v279 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v279;
    }
  }),
  test("video reference input: failed video thumb backfill keeps source video usable", async () => {
    const v288 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v289 = "node-v54-thumb-failure-target",
        v290 = "node-v54-keyed-source",
        { state: v291 } = await renderFixedRefBarForTest({
          targetId: v289,
          model: "runninghub/2041741496667348994",
          nodes: {
            [v290]: {
              id: v290,
              type: "source-video",
              localPath: "output/keyed.mp4",
              videoUrl: "/output/keyed.mp4",
              thumbUrl: "",
              model: "runninghub/video_matting",
              provider: "runninghubwf",
              rhToolbarTaskType: "video-keying",
              jobStatus: "success",
              isGenerating: false,
            },
          },
          incomingEdges: [
            {
              id: "edge-v54-keyed-source",
              sourceId: v290,
              targetId: v289,
              refSlot: "videoMask",
              sourceMediaKey: "output/keyed.mp4",
            },
          ],
          api: {
            fetchVideoFirstFrameThumbFromServer() {
              return Promise["reject"](new Error("thumb unavailable"));
            },
          },
        });
      (await Promise["resolve"](), await Promise["resolve"]());
      const v292 = v291["nodes"][v290];
      (strict["notEqual"](v292["mediaUnavailable"], true),
        strict["equal"](v292["mediaUnavailableSource"], undefined),
        strict["equal"](
          v292["videoThumbUnavailableSource"],
          "/output/keyed.mp4",
        ),
        strict["equal"](hasUsableInputNodeSource(v292), true));
    } finally {
      if (typeof v288 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v288;
    }
  }),
  test("video\x20reference\x20input:\x20fixed-slot\x20edges\x20win\x20over\x20asset\x20refs\x20and\x20text\x20stays\x20trailing", async () => {
    const v293 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const v294 = "asset-fixed-priority",
        { container: v295 } = await renderFixedRefBarForTest({
          targetId: "node-fixed-priority",
          model: "runninghub/1971148165531475969",
          nodes: {
            video1: {
              id: "video1",
              type: "source-video",
              localPath: "data/edge-source.mp4",
              thumbUrl: "data/edge-source-thumb.jpg",
            },
          },
          incomingEdges: [
            {
              id: "edge-source",
              sourceId: "video1",
              targetId: "node-fixed-priority",
              refSlot: "sourceVideo",
            },
          ],
          assetId: v294,
          assetItems: [
            {
              name: "asset source",
              type: "source-video",
              thumbSrc: "data/assets/asset-source-thumb.jpg",
              nodeData: {
                type: "source-video",
                localPath: "data/assets/source.mp4",
              },
            },
            {
              name: "asset ref",
              type: "source-image",
              thumbSrc: "data/assets/asset-ref-thumb.jpg",
              nodeData: {
                type: "source-image",
                originalLocalPath: "data/assets/ref.png",
              },
            },
            {
              name: "asset\x20text",
              type: "source-text",
              nodeData: { type: "source-text", text: "trailing\x20prompt" },
            },
          ],
          pills: [
            { assetIndex: 0, type: "video", label: "asset\x20source" },
            { assetIndex: 1, type: "image", label: "asset ref" },
            { assetIndex: 2, type: "text", label: "asset\x20text" },
          ],
        }),
        v296 = v295["querySelector"]('[data-slot="sourceVideo"]'),
        v297 = v295["querySelector"]("[data-slot=\x22refImage\x22]"),
        v298 = v295["querySelector"](".rh-fixed-extra-ref");
      (strict["equal"](v296["dataset"]["refOrigin"], "node"),
        strict["equal"](v296["dataset"]["edgeId"], "edge-source"),
        strict["equal"](v297["dataset"]["refOrigin"], "asset"),
        strict["equal"](v297["dataset"]["assetId"], v294),
        strict["equal"](v297["dataset"]["refType"], "image"),
        strict["equal"](v298["dataset"]["refOrigin"], "asset"),
        strict["equal"](v298["dataset"]["refType"], "text"),
        strict["ok"](
          v295["childNodes"]["indexOf"](v298) >
            v295["childNodes"]["indexOf"](v297),
        ));
    } finally {
      if (typeof v293 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v293;
    }
  }),
  test("video reference input: fixed-slot explicit refSlot wins before same-kind empty slots", async () => {
    const v299 = globalThis["document"];
    globalThis["document"] = { createElement: createFakeElement };
    try {
      const { container: v300 } = await renderFixedRefBarForTest({
        targetId: "node-v54-edge-slots",
        model: "runninghub/2041741496667348994",
        nodes: {
          maskVideo: {
            id: "maskVideo",
            type: "source-video",
            localPath: "data/mask.mp4",
            thumbUrl: "data/mask-thumb.jpg",
          },
          sourceVideo: {
            id: "sourceVideo",
            type: "source-video",
            localPath: "data/source.mp4",
            thumbUrl: "data/source-thumb.jpg",
          },
        },
        incomingEdges: [
          {
            id: "edge-mask",
            sourceId: "maskVideo",
            targetId: "node-v54-edge-slots",
            refSlot: "videoMask",
          },
          {
            id: "edge-source",
            sourceId: "sourceVideo",
            targetId: "node-v54-edge-slots",
            refSlot: "",
          },
        ],
      });
      (strict["equal"](
        v300["querySelector"]("[data-slot=\x22videoMask\x22]")["dataset"][
          "edgeId"
        ],
        "edge-mask",
      ),
        strict["equal"](
          v300["querySelector"]('[data-slot="sourceVideo"]')["dataset"][
            "edgeId"
          ],
          "edge-source",
        ));
    } finally {
      if (typeof v299 === "undefined") delete globalThis["document"];
      else globalThis["document"] = v299;
    }
  }),
  test("video\x20submit\x20button:\x20V5.4\x20asset\x20mentions\x20satisfy\x20required\x20fixed\x20inputs", () => {
    const v301 = "node-v54-submit-assets",
      v302 = {
        nodes: {
          [v301]: {
            id: v301,
            type: "ai-video",
            model: "runninghub/2041741496667348994",
            provider: "runninghubwf",
          },
        },
      };
    setAssetMentionAssets([
      {
        id: "asset-submit",
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
    const v303 = createVideoNodeParameterPanelModule({
        store: { getState: () => v302, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => "",
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      v304 = Object["assign"](Object["create"](v303), {
        nodeId: v301,
        _data: v302["nodes"][v301],
        promptEl: makePromptEl([
          makeAssetPill({
            assetId: "asset-submit",
            assetIndex: 0,
            type: "video",
            label: "source clip",
          }),
          makeAssetPill({
            assetId: "asset-submit",
            assetIndex: 1,
            type: "image",
            label: "reference image",
          }),
        ]),
        btnEl: { disabled: true, style: {} },
        _isGenerating: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => true,
      });
    (v303["_updateSubmitButtonState"]["call"](v304),
      strict["equal"](v304["btnEl"]["disabled"], false));
  }),
  test("video submit button: other fixed-slot models accept asset mentions", () => {
    const v305 = [
      {
        label: "basic",
        model: "runninghub/1971148165531475969",
        items: [
          {
            name: "source clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/source.mp4",
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
        pills: [
          { assetIndex: 0, type: "video", label: "source clip" },
          { assetIndex: 1, type: "image", label: "reference image" },
        ],
      },
      {
        label: "ltx",
        model: "runninghub/2039336644536442882",
        items: [
          {
            name: "reference\x20image",
            type: "source-image",
            nodeData: {
              type: "source-image",
              originalLocalPath: "data/assets/ref.png",
            },
          },
          {
            name: "voice",
            type: "source-audio",
            nodeData: {
              type: "source-audio",
              localPath: "data/assets/voice.mp3",
            },
          },
        ],
        pills: [
          { assetIndex: 0, type: "image", label: "reference image" },
          { assetIndex: 1, type: "audio", label: "voice" },
        ],
      },
      {
        label: "lipsync",
        model: "runninghub/2054101324521844738",
        items: [
          {
            name: "source clip",
            type: "source-video",
            nodeData: {
              type: "source-video",
              localPath: "data/assets/source.mp4",
            },
          },
          {
            name: "voice",
            type: "source-audio",
            nodeData: {
              type: "source-audio",
              localPath: "data/assets/voice.mp3",
            },
          },
        ],
        pills: [
          { assetIndex: 0, type: "video", label: "source clip" },
          { assetIndex: 1, type: "audio", label: "voice" },
        ],
      },
    ];
    for (const v306 of v305) {
      _resetAssetMentionRegistryForTests();
      const v307 = "node-" + v306["label"] + "-submit-assets",
        v308 = {
          nodes: {
            [v307]: {
              id: v307,
              type: "ai-video",
              model: v306["model"],
              provider: "runninghubwf",
            },
          },
        };
      setAssetMentionAssets([
        { id: "asset-" + v306["label"], items: v306["items"] },
      ]);
      const v309 = createVideoNodeParameterPanelModule({
          store: { getState: () => v308, getIncomingEdges: () => [] },
          api: {},
          getDisplayModelName: () => "",
          PROVIDERS_META: {},
          getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
          getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
          activateMenuKeyboard: () => {},
          isVideoVipModel: () => false,
        }),
        v310 = Object["assign"](Object["create"](v309), {
          nodeId: v307,
          _data: v308["nodes"][v307],
          promptEl: makePromptEl(
            v306["pills"]["map"]((v311) =>
              makeAssetPill({
                assetId: "asset-" + v306["label"],
                assetIndex: v311["assetIndex"],
                type: v311["type"],
                label: v311["label"],
              }),
            ),
          ),
          btnEl: { disabled: true, style: {} },
          _isGenerating: false,
          _isDreaminaVideoNode: () => false,
          _isRunninghubWorkflowModel: () => true,
        });
      (v309["_updateSubmitButtonState"]["call"](v310),
        strict["equal"](v310["btnEl"]["disabled"], false, v306["label"]));
    }
  }),
  test("video submit button: empty editor can generate from non-empty text input", () => {
    const v312 = "node-video-text-input-submit",
      v313 = "node-video-text-input-source",
      v314 = {
        nodes: {
          [v312]: {
            id: v312,
            type: "ai-video",
            model: "apimart/seedance-1.0",
            provider: "apimart",
          },
          [v313]: {
            id: v313,
            type: "source-text",
            content: "用文本入参生成视频",
          },
        },
      },
      v315 = [{ id: "edge-video-text-input", sourceId: v313, targetId: v312 }],
      v316 = createVideoNodeParameterPanelModule({
        store: { getState: () => v314, getIncomingEdges: () => v315 },
        api: {},
        getDisplayModelName: () => "",
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      v317 = Object["assign"](Object["create"](v316), {
        nodeId: v312,
        _data: v314["nodes"][v312],
        promptEl: makePromptEl([]),
        btnEl: { disabled: true, style: {} },
        _isGenerating: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => false,
      });
    (v316["_updateSubmitButtonState"]["call"](v317),
      strict["equal"](v317["btnEl"]["disabled"], false),
      strict["equal"](v317["btnEl"]["style"]["cursor"], ""));
  }),
  test("video submit button: running task state is read from unified selector", () => {
    const v318 = "node-video-running-button-state",
      v319 = {
        nodes: {
          [v318]: {
            id: v318,
            type: "ai-video",
            model: "runninghub/1971148165531475969",
            provider: "runninghubwf",
            rhTaskStatus: "running",
            rhTaskId: "rh-video-running",
          },
        },
      },
      v320 = createVideoNodeParameterPanelModule({
        store: { getState: () => v319, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => "",
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      v321 = Object["assign"](Object["create"](v320), {
        nodeId: v318,
        _data: v319["nodes"][v318],
        promptEl: makePromptEl([]),
        btnEl: { disabled: true, style: {} },
        _isGenerating: false,
        _rhCancelInFlight: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => true,
      });
    (v320["_updateSubmitButtonState"]["call"](v321),
      strict["equal"](v321["btnEl"]["disabled"], false),
      strict["equal"](v321["btnEl"]["style"]["cursor"], ""));
  }),
  test("video submit button: non-cancellable async running state stays disabled", () => {
    const v322 = "node-video-async-running-button-state",
      v323 = {
        nodes: {
          [v322]: {
            id: v322,
            type: "ai-video",
            model: "apimart/seedance-1.0",
            provider: "apimart",
            asyncTaskStatus: "running",
            asyncTaskId: "async-video-running",
          },
        },
      },
      v324 = createVideoNodeParameterPanelModule({
        store: { getState: () => v323, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => "",
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      v325 = Object["assign"](Object["create"](v324), {
        nodeId: v322,
        _data: v323["nodes"][v322],
        promptEl: { innerText: "prompt", querySelectorAll: () => [] },
        btnEl: { disabled: false, style: {} },
        _isGenerating: false,
        _isDreaminaVideoNode: () => false,
        _isRunninghubWorkflowModel: () => false,
      });
    (v324["_updateSubmitButtonState"]["call"](v325),
      strict["equal"](v325["btnEl"]["disabled"], true),
      strict["equal"](
        v325["btnEl"]["style"]["cursor"],
        "var(--unavailable-cursor)",
      ));
  }),
  test("video submit button: Dreamina-style API running state stays disabled", () => {
    const v326 = "node-video-seedance-api-running-button-state",
      v327 = {
        nodes: {
          [v326]: {
            id: v326,
            type: "ai-video",
            model: "apimart/doubao-seedance-2.0-fast",
            provider: "apimart",
            asyncTaskStatus: "running",
            asyncTaskId: "async-seedance-running",
            isGenerating: true,
            jobStatus: "running",
          },
        },
      },
      v328 = createVideoNodeParameterPanelModule({
        store: { getState: () => v327, getIncomingEdges: () => [] },
        api: {},
        getDisplayModelName: () => "",
        PROVIDERS_META: {},
        getAIGenerationNodeSize: () => ({ width: 300, height: 300 }),
        getDisplayedMediaSizeFromNode: () => ({ width: 0, height: 0 }),
        activateMenuKeyboard: () => {},
        isVideoVipModel: () => false,
      }),
      v329 = {
        disabled: false,
        className: "",
        dataset: {},
        innerHTML: "",
        style: {},
        title: "",
        setAttribute(v330, v331) {
          this["attributes"] = {
            ...(this["attributes"] || {}),
            [v330]: String(v331 || ""),
          };
        },
        removeAttribute(v332) {
          delete this["attributes"]?.[v332];
        },
      };
    v329["classList"] = makeClassList(v329);
    const v333 = Object["assign"](Object["create"](v328), {
      nodeId: v326,
      _data: v327["nodes"][v326],
      promptEl: { innerText: "prompt", querySelectorAll: () => [] },
      btnEl: v329,
      _isGenerating: false,
      _rhCancelInFlight: false,
      _isDreaminaVideoNode: () => true,
      _isRunninghubWorkflowModel: () => false,
      _syncDreaminaTaskState: () => ({
        nodeData: v327["nodes"][v326],
        summary: { imageCount: 1, videoCount: 0, audioCount: 0 },
        resolvedTaskType: "multimodal2video",
        routeMode: "multimodal2video",
      }),
    });
    (v328["_updateSubmitButtonState"]["call"](v333),
      strict["equal"](v333["btnEl"]["disabled"], true),
      strict["equal"](
        v333["btnEl"]["style"]["cursor"],
        "var(--unavailable-cursor)",
      ),
      strict["equal"](
        v333["btnEl"]["classList"]["contains"]("is-task-cancel"),
        false,
      ));
  }));

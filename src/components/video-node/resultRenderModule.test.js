import test from "node:test";
import strict from "node:assert/strict";
import { createVideoNodeResultRenderModule } from "./resultRenderModule.js";
const previousDocument = globalThis["document"],
  previousRequestAnimationFrame = globalThis["requestAnimationFrame"];
function createStyleStub() {
  return {
    setProperty(v0, v1) {
      this[v0] = String(v1);
    },
    removeProperty(v2) {
      delete this[v2];
    },
  };
}
class FakeClassList {
  constructor(v3) {
    ((this["_owner"] = v3), (this["_set"] = new Set()));
  }
  ["add"](...v4) {
    for (const v5 of v4) {
      if (v5) this["_set"]["add"](String(v5));
    }
    this["_sync"]();
  }
  ["remove"](...v6) {
    for (const v7 of v6) {
      this["_set"]["delete"](String(v7));
    }
    this["_sync"]();
  }
  ["contains"](v8) {
    return this["_set"]["has"](String(v8));
  }
  ["_sync"]() {
    this["_owner"]["className"] = Array["from"](this["_set"])["join"]("\x20");
  }
}
class FakeElement {
  constructor(v9) {
    ((this["tagName"] = String(v9 || "div")["toUpperCase"]()),
      (this["children"] = []),
      (this["parentNode"] = null),
      (this["style"] = createStyleStub()),
      (this["dataset"] = {}),
      (this["className"] = ""),
      (this["classList"] = new FakeClassList(this)),
      (this["innerHTML"] = ""),
      (this["offsetWidth"] = 320),
      (this["offsetHeight"] = 180),
      (this["offsetTop"] = 0),
      (this["textContent"] = ""));
  }
  ["appendChild"](v10) {
    if (!v10) return v10;
    if (v10["parentNode"]) v10["parentNode"]["removeChild"](v10);
    return ((v10["parentNode"] = this), this["children"]["push"](v10), v10);
  }
  ["removeChild"](v11) {
    const v12 = this["children"]["indexOf"](v11);
    return (
      v12 >= 0 &&
        (this["children"]["splice"](v12, 1), (v11["parentNode"] = null)),
      v11
    );
  }
  ["remove"]() {
    if (this["parentNode"]) this["parentNode"]["removeChild"](this);
  }
  ["addEventListener"]() {}
  ["querySelectorAll"](v13) {
    if (v13 === "video") {
      const v14 = [],
        v15 = (v16) => {
          for (const v17 of v16["children"] || []) {
            if (v17["tagName"] === "VIDEO") v14["push"](v17);
            v15(v17);
          }
        };
      return (v15(this), v14);
    }
    return [];
  }
}
class FakeVideoElement extends FakeElement {
  constructor() {
    (super("video"),
      (this["_attrs"] = new Map()),
      (this["autoplay"] = false),
      (this["loop"] = false),
      (this["muted"] = true),
      (this["playsInline"] = true),
      (this["preload"] = ""),
      (this["draggable"] = false),
      (this["paused"] = true),
      (this["readyState"] = 0),
      (this["videoWidth"] = 0),
      (this["videoHeight"] = 0),
      (this["duration"] = NaN),
      (this["loadCount"] = 0));
  }
  get ["src"]() {
    return this["getAttribute"]("src") || "";
  }
  set ["src"](v18) {
    this["setAttribute"]("src", v18);
  }
  get ["poster"]() {
    return this["getAttribute"]("poster") || "";
  }
  set ["poster"](v19) {
    this["setAttribute"]("poster", v19);
  }
  ["getAttribute"](v20) {
    return this["_attrs"]["get"](String(v20)) || "";
  }
  ["setAttribute"](v21, v22) {
    this["_attrs"]["set"](String(v21), String(v22));
  }
  ["removeAttribute"](v23) {
    this["_attrs"]["delete"](String(v23));
  }
  ["load"]() {
    this["loadCount"] += 1;
  }
  ["play"]() {
    return ((this["paused"] = false), Promise["resolve"]());
  }
  ["pause"]() {
    this["paused"] = true;
  }
}
function createDocumentStub() {
  return {
    createElement(v24) {
      if (String(v24)["toLowerCase"]() === "video")
        return new FakeVideoElement();
      return new FakeElement(v24);
    },
  };
}
function createStore(v25) {
  const v26 = { nodes: { [v25["id"]]: { ...v25 } } };
  return {
    state: v26,
    getState() {
      return v26;
    },
    getIncomingEdges() {
      return [];
    },
    updateNodeData(v27, v28) {
      const v29 = v26["nodes"][v27] || {};
      v26["nodes"][v27] = { ...v29, ...v28 };
    },
  };
}
function createContext(v30, v31 = {}) {
  const v32 = createStore(v30);
  v32["state"]["ui"] = { showVideoMeta: v31["showVideoMeta"] === true };
  let v33 = 0,
    v34 = [];
  const v35 = createVideoNodeResultRenderModule({
      store: v32,
      api: {
        async fetchVideoMetaFromServer() {
          v33 += 1;
          if (typeof v31["fetchVideoMetaFromServer"] === "function")
            return v31["fetchVideoMetaFromServer"]();
          return { success: false };
        },
        fetchVideoFirstFrameThumbFromServer(v36, v37) {
          v34["push"]({ src: v36, context: v37 });
          if (typeof v31["fetchVideoFirstFrameThumbFromServer"] === "function")
            return v31["fetchVideoFirstFrameThumbFromServer"](v36, v37);
          return Promise["resolve"]({ url: "" });
        },
      },
      getImage: async () => null,
      ensureThumbDecoded: () => {},
      buildApiUrl: (v38) => "http://local" + String(v38 || ""),
      VideoKeyingController: {
        isActiveFor() {
          return false;
        },
      },
    }),
    v39 = new FakeElement("div"),
    v40 = new FakeElement("div"),
    v41 = new FakeElement("div"),
    v42 = Object["assign"](Object["create"](v35), {
      nodeId: v30["id"],
      _data: v32["state"]["nodes"][v30["id"]],
      _root: v40,
      previewEl: v39,
      _placeholderEl: v41,
      _multiVideosContainer: null,
      _multiStackWrap: null,
      _multiLayerEls: [],
      _multiErrorEls: [],
      _multiToggleBtn: null,
      _cachedVideoUrls: new Map(),
      _videoThumbPending: new Set(),
      _lastVideosKeyStr: null,
      _lastMainIdx: null,
      _lastIsExpanded: null,
      _blobResolveToken: 0,
      _isHovered: false,
      _isManualControl: false,
      _showPausedCenterIndicator() {},
      _hideCenterIndicator() {},
      _syncVideoControlsFromVideo() {},
      _applyMuteStateToPreviewVideos() {},
      _setVideoOverlaysVisible() {},
      _clearStatusOverlay() {},
      _ensureStatusOverlayEl() {
        return new FakeElement("div");
      },
    });
  return {
    ctx: v42,
    store: v32,
    getFetchVideoMetaCallCount: () => v33,
    getFetchVideoThumbCalls: () => v34["slice"](),
  };
}
(test["before"](() => {
  ((globalThis["document"] = createDocumentStub()),
    (globalThis["requestAnimationFrame"] = (v43) => {
      return (v43(), 1);
    }));
}),
  test["after"](() => {
    (typeof previousDocument === "undefined"
      ? delete globalThis["document"]
      : (globalThis["document"] = previousDocument),
      typeof previousRequestAnimationFrame === "undefined"
        ? delete globalThis["requestAnimationFrame"]
        : (globalThis["requestAnimationFrame"] =
            previousRequestAnimationFrame));
  }),
  test("video result render: 有 poster 的主预览首次渲染保持视频源懒加载", async () => {
    const { ctx: v44 } = createContext({
      id: "ai-video-main-preload",
      type: "ai-video",
      mainVideoIndex: 0,
      videos: [{ localPath: "output/main.mp4", thumbUrl: "/output/main.jpg" }],
    });
    (await v44["_loadAndDisplayVideo"](),
      strict["equal"](v44["_multiLayerEls"]["length"], 1),
      strict["equal"](v44["_multiLayerEls"][0]["preload"], "none"),
      strict["equal"](v44["_multiLayerEls"][0]["getAttribute"]("src"), ""),
      strict["equal"](
        v44["_multiLayerEls"][0]["poster"],
        "http://local/output/main.jpg",
      ));
  }),
  test("video\x20result\x20render:\x20无\x20poster\x20的主预览仍加载视频源生成首帧", async () => {
    const { ctx: v45 } = createContext({
      id: "ai-video-main-no-poster",
      type: "ai-video",
      mainVideoIndex: 0,
      videos: [{ localPath: "output/main.mp4" }],
    });
    (await v45["_loadAndDisplayVideo"](),
      strict["equal"](v45["_multiLayerEls"]["length"], 1),
      strict["equal"](v45["_multiLayerEls"][0]["preload"], "auto"),
      strict["equal"](
        v45["_multiLayerEls"][0]["getAttribute"]("src"),
        "http://local/output/main.mp4",
      ));
  }),
  test("video result render: 主预览交互时才接入视频源", async () => {
    const { ctx: v46 } = createContext({
      id: "ai-video-main-ensure-src",
      type: "ai-video",
      mainVideoIndex: 0,
      videos: [{ localPath: "output/main.mp4", thumbUrl: "/output/main.jpg" }],
    });
    await v46["_loadAndDisplayVideo"]();
    const v47 = v46["_multiLayerEls"][0];
    (strict["equal"](v47["preload"], "none"),
      strict["equal"](v47["getAttribute"]("src"), ""),
      strict["equal"](await v46["_ensureVideoSrcFor"](v47), true),
      strict["equal"](v47["preload"], "auto"),
      strict["equal"](
        v47["getAttribute"]("src"),
        "http://local/output/main.mp4",
      ),
      strict["equal"](v47["loadCount"], 0));
  }),
  test("video result render: poster main preview does not fetch video before interaction", async () => {
    const v48 = globalThis["window"],
      v49 = globalThis["location"],
      v50 = globalThis["fetch"],
      v51 = globalThis["URL"]["createObjectURL"];
    ((globalThis["window"] = { electronAPI: {} }),
      (globalThis["location"] = {
        href: "http://local/",
        origin: "http://local",
      }));
    const v52 = [];
    ((globalThis["fetch"] = async (v53) => {
      return (
        v52["push"](v53),
        {
          ok: true,
          async blob() {
            return new Blob(["media"], { type: "video/mp4" });
          },
        }
      );
    }),
      (globalThis["URL"]["createObjectURL"] = () => "blob:poster-main-warm"));
    try {
      const { ctx: v54 } = createContext({
        id: "ai-video-main-poster-warm",
        type: "ai-video",
        mainVideoIndex: 0,
        videos: [
          { localPath: "output/main.mp4", thumbUrl: "/output/main.jpg" },
        ],
      });
      (await v54["_loadAndDisplayVideo"](),
        await new Promise((v55) => setTimeout(v55, 0)),
        strict["equal"](v54["_multiLayerEls"][0]["preload"], "none"),
        strict["equal"](v54["_multiLayerEls"][0]["getAttribute"]("src"), ""),
        strict["deepEqual"](v52, []));
    } finally {
      if (typeof v48 === "undefined") delete globalThis["window"];
      else globalThis["window"] = v48;
      if (typeof v49 === "undefined") delete globalThis["location"];
      else globalThis["location"] = v49;
      ((globalThis["fetch"] = v50),
        (globalThis["URL"]["createObjectURL"] = v51));
    }
  }),
  test("video result render: 视频节点信息关闭时不请求后端元信息", async () => {
    const { ctx: v56, getFetchVideoMetaCallCount: v57 } = createContext(
      {
        id: "ai-video-meta-off",
        type: "ai-video",
        videos: [{ localPath: "output/main.mp4" }],
      },
      { showVideoMeta: false },
    );
    (await v56["_maybeFetchVideoMeta"]("/output/main.mp4"),
      strict["equal"](v57(), 0));
  }),
  test("video\x20result\x20render:\x20视频节点信息开启时才请求后端元信息", async () => {
    const { ctx: v58, getFetchVideoMetaCallCount: v59 } = createContext(
      {
        id: "ai-video-meta-on",
        type: "ai-video",
        videos: [{ localPath: "output/main.mp4" }],
      },
      { showVideoMeta: true },
    );
    (await v58["_maybeFetchVideoMeta"]("/output/main.mp4"),
      strict["equal"](v59(), 1));
  }),
  test("video result render: failed thumbnail backfill keeps result video usable", async () => {
    const {
      ctx: v60,
      store: v61,
      getFetchVideoThumbCalls: v62,
    } = createContext(
      {
        id: "ai-video-missing-result",
        type: "ai-video",
        mainVideoIndex: 0,
        thumbUrl: "",
        videos: [
          {
            localPath: "output/missing.mp4",
            videoUrl: "/output/missing.mp4",
            thumbUrl: "",
            assetId: "asset-1",
          },
        ],
      },
      {
        fetchVideoFirstFrameThumbFromServer() {
          return Promise["reject"](
            new Error("Invalid\x20media\x20source\x20path"),
          );
        },
      },
    );
    (await v60["_loadAndDisplayVideo"](),
      await Promise["resolve"](),
      await Promise["resolve"]());
    const v63 = v61["state"]["nodes"][v60["nodeId"]];
    (strict["notEqual"](v63["mediaUnavailable"], true),
      strict["equal"](v63["mediaUnavailableSource"], undefined),
      strict["notEqual"](v63["videos"][0]["mediaUnavailable"], true),
      strict["equal"](v63["videos"][0]["mediaUnavailableSource"], undefined),
      strict["equal"](
        v63["videoThumbUnavailableSource"],
        "/output/missing.mp4",
      ),
      strict["equal"](
        v63["videos"][0]["videoThumbUnavailableSource"],
        "/output/missing.mp4",
      ),
      strict["equal"](v63["videos"][0]["thumbUrl"], ""),
      strict["equal"](v62()[0]["context"]["nodeId"], v60["nodeId"]),
      strict["equal"](v62()[0]["context"]["assetId"], "asset-1"));
  }),
  test("video result render: 失败视频结果直接显示错误卡片", async () => {
    const { ctx: v64 } = createContext({
      id: "ai-video-error-result",
      type: "ai-video",
      mainVideoIndex: 0,
      videos: [{ error: "Seedance upstream failed" }],
    });
    (await v64["_loadAndDisplayVideo"](),
      strict["equal"](v64["_placeholderEl"]["style"]["display"], "none"),
      strict["equal"](v64["_multiErrorEls"]["length"], 1),
      strict["equal"](v64["_multiErrorEls"][0]["className"], "gen-error-card"),
      strict["equal"](
        v64["_multiErrorEls"][0]["children"][1]["textContent"],
        "生成失败",
      ),
      strict["equal"](
        v64["_multiErrorEls"][0]["children"][2]["textContent"],
        "Seedance upstream failed",
      ));
  }),
  test("video result render: 仅有任务失败状态时也在节点内显示错误", async () => {
    const { ctx: v65 } = createContext({
        id: "ai-video-job-error",
        type: "ai-video",
        jobStatus: "error",
        jobError: "Seedance\x20upstream\x20failed",
        videos: [],
      }),
      v66 = new FakeElement("div");
    ((v65["_ensureStatusOverlayEl"] = () => v66),
      await v65["_loadAndDisplayVideo"](),
      strict["equal"](v65["_placeholderEl"]["style"]["display"], "none"),
      strict["equal"](v66["children"]["length"], 1),
      strict["equal"](v66["children"][0]["className"], "gen-error-card"),
      strict["equal"](
        v66["children"][0]["children"][2]["textContent"],
        "Seedance\x20upstream\x20failed",
      ));
  }),
  test("video result render: failure message uses unified task state", () => {
    const { ctx: v67 } = createContext({
      id: "ai-video-unified-failure",
      type: "ai-video",
      videos: [],
    });
    (strict["equal"](
      v67["_getGenerationFailureMessage"]({
        asyncTaskStatus: "failed",
        asyncTaskError: "Async provider failed",
      }),
      "Async provider failed",
    ),
      strict["equal"](
        v67["_getGenerationFailureMessage"]({
          isGenerating: true,
          rhTaskStatus: "failed",
          rhStatusMessage: "RunningHub\x20failed",
        }),
        "RunningHub\x20failed",
      ),
      strict["equal"](
        v67["_getGenerationFailureMessage"]({
          provider: "dreamina",
          isGenerating: true,
          jobStatus: "running",
        }),
        "",
      ));
  }),
  test("video result render: 切换主视频后新的 poster 主预览仍保持懒加载", async () => {
    const { ctx: v68, store: v69 } = createContext({
      id: "ai-video-switch-main",
      type: "ai-video",
      mainVideoIndex: 0,
      videos: [
        { localPath: "output/a.mp4", thumbUrl: "/output/a.jpg" },
        { localPath: "output/b.mp4", thumbUrl: "/output/b.jpg" },
      ],
    });
    (await v68["_loadAndDisplayVideo"](),
      strict["equal"](v68["_multiLayerEls"][0]["preload"], "none"),
      strict["equal"](v68["_multiLayerEls"][1]["preload"], "none"),
      strict["equal"](v68["_multiLayerEls"][0]["getAttribute"]("src"), ""),
      strict["equal"](v68["_multiLayerEls"][1]["getAttribute"]("src"), ""),
      (v69["state"]["nodes"][v68["nodeId"]] = {
        ...v69["state"]["nodes"][v68["nodeId"]],
        mainVideoIndex: 1,
      }),
      (v68["_data"] = v69["state"]["nodes"][v68["nodeId"]]),
      await v68["_loadAndDisplayVideo"](),
      strict["equal"](v68["_multiLayerEls"][0]["preload"], "none"),
      strict["equal"](v68["_multiLayerEls"][1]["preload"], "none"),
      strict["equal"](v68["_multiLayerEls"][0]["getAttribute"]("src"), ""),
      strict["equal"](v68["_multiLayerEls"][1]["getAttribute"]("src"), ""));
  }),
  test("video\x20result\x20render:\x20expanded\x20result\x20cells\x20with\x20posters\x20stay\x20lazy", async () => {
    const { ctx: v70 } = createContext({
      id: "ai-video-expanded-lazy",
      type: "ai-video",
      mainVideoIndex: 0,
      isVideosExpanded: true,
      videos: [
        { localPath: "output/a.mp4", thumbUrl: "/output/a.jpg" },
        { localPath: "output/b.mp4", thumbUrl: "/output/b.jpg" },
        { localPath: "output/c.mp4", thumbUrl: "/output/c.jpg" },
      ],
    });
    (await v70["_loadAndDisplayVideo"](),
      strict["equal"](v70["_multiLayerEls"]["length"], 3));
    for (const v71 of v70["_multiLayerEls"]) {
      (strict["equal"](v71["preload"], "none"),
        strict["equal"](v71["getAttribute"]("src"), ""));
    }
    const v72 = v70["_expandPanel"]["querySelectorAll"]("video");
    strict["equal"](v72["length"], 2);
    for (const v73 of v72) {
      (strict["equal"](v73["autoplay"], false),
        strict["equal"](v73["loop"], false),
        strict["equal"](v73["preload"], "none"),
        strict["equal"](v73["getAttribute"]("src"), ""),
        strict["match"](v73["poster"], /^http:\/\/local\/output\//));
    }
    (strict["equal"](await v70["_ensureVideoSrcFor"](v72[0]), true),
      strict["equal"](v72[0]["preload"], "auto"),
      strict["match"](
        v72[0]["getAttribute"]("src"),
        /^http:\/\/local\/output\/[bc]\.mp4$/,
      ),
      strict["equal"](v72[0]["loadCount"], 0));
  }));

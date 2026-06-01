import { test } from "node:test";
import strict from "node:assert/strict";
import {
  captureVideoFrameBlob,
  captureVideoFrameDataUrl,
  captureVideoFrameSnapshot,
  isVideoFrameReady,
  saveVideoFrameCapture,
  waitForVideoFrame,
} from "./videoFrameCapture.js";
class FakeVideo {
  constructor() {
    ((this["currentSrc"] = ""),
      (this["src"] = "video.mp4"),
      (this["readyState"] = 0),
      (this["videoWidth"] = 0),
      (this["videoHeight"] = 0),
      (this["loadCount"] = 0),
      (this["_listeners"] = new Map()));
  }
  ["addEventListener"](v0, v1) {
    if (!this["_listeners"]["has"](v0))
      this["_listeners"]["set"](v0, new Set());
    this["_listeners"]["get"](v0)["add"](v1);
  }
  ["removeEventListener"](v2, v3) {
    this["_listeners"]["get"](v2)?.["delete"](v3);
  }
  ["load"]() {
    this["loadCount"] += 1;
  }
  ["dispatch"](v4) {
    for (const v5 of this["_listeners"]["get"](v4) || []) {
      v5({ type: v4, target: this });
    }
  }
}
(test("videoFrameCapture: 已有可读帧时直接判定 ready", () => {
  const v6 = new FakeVideo();
  ((v6["readyState"] = 2),
    (v6["videoWidth"] = 640),
    (v6["videoHeight"] = 360),
    strict["equal"](isVideoFrameReady(v6), true));
}),
  test("videoFrameCapture: 等待 loadeddata 后再判定可截帧", async () => {
    const v7 = new FakeVideo(),
      v8 = waitForVideoFrame(v7, { timeoutMs: 1000 });
    (strict["equal"](v7["loadCount"], 1),
      (v7["readyState"] = 2),
      (v7["videoWidth"] = 640),
      (v7["videoHeight"] = 360),
      v7["dispatch"]("loadeddata"),
      strict["equal"](await v8, true));
  }),
  test("videoFrameCapture: captureVideoFrameDataUrl 使用当前视频尺寸绘制", () => {
    const v9 = globalThis["document"],
      v10 = [];
    globalThis["document"] = {
      createElement(v11) {
        return (
          strict["equal"](v11, "canvas"),
          {
            width: 0,
            height: 0,
            getContext(v12) {
              return (
                strict["equal"](v12, "2d"),
                {
                  drawImage(...v13) {
                    v10["push"](v13);
                  },
                }
              );
            },
            toDataURL(v14) {
              return "data:" + v14 + ";base64,ok";
            },
          }
        );
      },
    };
    try {
      const v15 = new FakeVideo();
      ((v15["readyState"] = 2),
        (v15["videoWidth"] = 320),
        (v15["videoHeight"] = 180),
        strict["equal"](
          captureVideoFrameDataUrl(v15),
          "data:image/png;base64,ok",
        ),
        strict["equal"](v10["length"], 1),
        strict["deepEqual"](v10[0], [v15, 0, 0, 320, 180]));
    } finally {
      typeof v9 === "undefined"
        ? delete globalThis["document"]
        : (globalThis["document"] = v9);
    }
  }),
  test("videoFrameCapture: captureVideoFrameBlob 导出当前帧 Blob", async () => {
    const v16 = globalThis["document"],
      v17 = [];
    globalThis["document"] = {
      createElement(v18) {
        return (
          strict["equal"](v18, "canvas"),
          {
            width: 0,
            height: 0,
            getContext(v19) {
              return (
                strict["equal"](v19, "2d"),
                {
                  drawImage(...v20) {
                    v17["push"](v20);
                  },
                }
              );
            },
            toBlob(v21, v22) {
              v21(new Blob(["frame"], { type: v22 }));
            },
          }
        );
      },
    };
    try {
      const v23 = new FakeVideo();
      ((v23["readyState"] = 2),
        (v23["videoWidth"] = 640),
        (v23["videoHeight"] = 360));
      const v24 = await captureVideoFrameBlob(v23);
      (strict["equal"](v24["type"], "image/png"),
        strict["equal"](await v24["text"](), "frame"),
        strict["deepEqual"](v17[0], [v23, 0, 0, 640, 360]));
    } finally {
      typeof v16 === "undefined"
        ? delete globalThis["document"]
        : (globalThis["document"] = v16);
    }
  }),
  test("videoFrameCapture: captureVideoFrameSnapshot 只返回 Blob 与元数据", async () => {
    const v25 = globalThis["document"];
    let v26 = 0;
    globalThis["document"] = {
      createElement(v27) {
        return (
          strict["equal"](v27, "canvas"),
          {
            width: 0,
            height: 0,
            getContext(v28) {
              return (strict["equal"](v28, "2d"), { drawImage() {} });
            },
            toBlob(v29, v30) {
              ((v26 += 1), v29(new Blob(["frame"], { type: v30 })));
            },
          }
        );
      },
    };
    try {
      const v31 = new FakeVideo();
      ((v31["readyState"] = 2),
        (v31["videoWidth"] = 800),
        (v31["videoHeight"] = 450));
      const v32 = await captureVideoFrameSnapshot(v31, {
        fileNamePrefix: "snap",
      });
      (strict["equal"](v32["width"], 800),
        strict["equal"](v32["height"], 450),
        strict["equal"](v32["originalWidth"], 800),
        strict["equal"](v32["originalHeight"], 450),
        strict["equal"](v32["ext"], "png"),
        strict["match"](v32["fileName"], /^snap_\d+\.png$/),
        strict["equal"](v32["blob"]["type"], "image/png"),
        strict["equal"](await v32["blob"]["text"](), "frame"),
        strict["equal"](v26, 1));
    } finally {
      typeof v25 === "undefined"
        ? delete globalThis["document"]
        : (globalThis["document"] = v25);
    }
  }),
  test("videoFrameCapture:\x20saveVideoFrameCapture\x20保存后返回本地图片字段", async () => {
    const v33 = globalThis["document"];
    globalThis["document"] = {
      createElement(v34) {
        return (
          strict["equal"](v34, "canvas"),
          {
            width: 0,
            height: 0,
            getContext(v35) {
              return (strict["equal"](v35, "2d"), { drawImage() {} });
            },
            toBlob(v36, v37) {
              v36(new Blob(["frame"], { type: v37 }));
            },
          }
        );
      },
    };
    try {
      const v38 = new FakeVideo();
      ((v38["readyState"] = 2),
        (v38["videoWidth"] = 640),
        (v38["videoHeight"] = 360));
      const v39 = await saveVideoFrameCapture(v38, async (v40, v41) => {
        return (
          strict["equal"](v41["ext"], "png"),
          strict["equal"](v40["type"], "image/png"),
          {
            url: "/output/frame.png",
            localPath: "output/frame.png",
            filename: "frame.png",
          }
        );
      });
      strict["deepEqual"](v39, {
        src: "/output/frame.png",
        localPath: "output/frame.png",
        originalLocalPath: "output/frame.png",
        displayLocalPath: "",
        thumbLocalPath: "",
        originalWidth: 640,
        originalHeight: 360,
        fileName: "frame.png",
      });
    } finally {
      typeof v33 === "undefined"
        ? delete globalThis["document"]
        : (globalThis["document"] = v33);
    }
  }));

import test from "node:test";
import strict from "node:assert/strict";
import {
  __resetVideoPlaybackRecoveryForTest,
  getVideoBufferedAhead,
  playVideoWithRecovery,
} from "./mediaPlaybackRecovery.js";
class FakeVideoElement {
  constructor() {
    ((this["_attrs"] = new Map()),
      (this["_listeners"] = new Map()),
      (this["currentTime"] = 0),
      (this["duration"] = 10),
      (this["readyState"] = 0),
      (this["networkState"] = 1),
      (this["paused"] = true),
      (this["preload"] = ""),
      (this["loadCount"] = 0),
      (this["playCount"] = 0),
      (this["pauseCount"] = 0),
      (this["buffered"] = {
        length: 0,
        start() {
          return 0;
        },
        end() {
          return 0;
        },
      }));
  }
  get ["currentSrc"]() {
    return "";
  }
  get ["src"]() {
    return this["getAttribute"]("src");
  }
  set ["src"](v0) {
    this["setAttribute"]("src", v0);
  }
  ["getAttribute"](v1) {
    return this["_attrs"]["get"](String(v1)) || "";
  }
  ["setAttribute"](v2, v3) {
    this["_attrs"]["set"](String(v2), String(v3));
  }
  ["addEventListener"](v4, v5) {
    const v6 = String(v4),
      v7 = this["_listeners"]["get"](v6) || [];
    (v7["push"](v5), this["_listeners"]["set"](v6, v7));
  }
  ["removeEventListener"](v8, v9) {
    const v10 = String(v8),
      v11 = this["_listeners"]["get"](v10) || [];
    this["_listeners"]["set"](
      v10,
      v11["filter"]((v12) => v12 !== v9),
    );
  }
  ["dispatchEventName"](v13) {
    for (const v14 of this["_listeners"]["get"](String(v13)) || []) {
      v14({ type: v13 });
    }
  }
  ["load"]() {
    ((this["loadCount"] += 1),
      (this["readyState"] = 2),
      this["dispatchEventName"]("loadeddata"));
  }
  ["play"]() {
    return (
      (this["playCount"] += 1),
      (this["paused"] = false),
      Promise["resolve"]()
    );
  }
  ["pause"]() {
    ((this["pauseCount"] += 1), (this["paused"] = true));
  }
}
(test["afterEach"](() => {
  __resetVideoPlaybackRecoveryForTest();
}),
  test("getVideoBufferedAhead returns buffered seconds at current time", () => {
    const v15 = new FakeVideoElement();
    ((v15["currentTime"] = 3),
      (v15["buffered"] = {
        length: 2,
        start(v16) {
          return v16 === 0 ? 0 : 2.5;
        },
        end(v17) {
          return v17 === 0 ? 1 : 6;
        },
      }),
      strict["equal"](getVideoBufferedAhead(v15), 3));
  }),
  test("playVideoWithRecovery\x20ensures\x20source,\x20sets\x20preload,\x20then\x20plays", async () => {
    const v18 = new FakeVideoElement(),
      v19 = await playVideoWithRecovery(v18, {
        ensureSrc() {
          v18["src"] = "/output/sample.mp4";
        },
      });
    (strict["equal"](v19, true),
      strict["equal"](v18["preload"], "auto"),
      strict["equal"](v18["loadCount"], 0),
      strict["equal"](v18["playCount"], 1),
      strict["equal"](v18["paused"], false));
  }),
  test("playVideoWithRecovery requests play during an active media load without restarting it", async () => {
    const v20 = new FakeVideoElement();
    ((v20["src"] = "/output/sample.mp4"),
      (v20["readyState"] = 0),
      (v20["networkState"] = 2));
    const v21 = playVideoWithRecovery(v20, { readyTimeoutMs: 1000 });
    (await Promise["resolve"](),
      await Promise["resolve"](),
      strict["equal"](v20["playCount"], 1),
      (v20["readyState"] = 2),
      (v20["networkState"] = 1),
      v20["dispatchEventName"]("loadeddata"));
    const v22 = await v21;
    (strict["equal"](v22, true),
      strict["equal"](v20["preload"], "auto"),
      strict["equal"](v20["loadCount"], 0),
      strict["equal"](v20["playCount"], 1),
      strict["equal"](v20["paused"], false));
  }),
  test("playVideoWithRecovery does not reload an idle metadata-ready video", async () => {
    const v23 = new FakeVideoElement();
    ((v23["src"] = "/output/sample.mp4"),
      (v23["readyState"] = 1),
      (v23["networkState"] = 1),
      setTimeout(() => {
        ((v23["readyState"] = 2), v23["dispatchEventName"]("loadeddata"));
      }, 0));
    const v24 = await playVideoWithRecovery(v23, { readyTimeoutMs: 1000 });
    (strict["equal"](v24, true),
      strict["equal"](v23["preload"], "auto"),
      strict["equal"](v23["loadCount"], 0),
      strict["equal"](v23["playCount"], 1),
      strict["equal"](v23["paused"], false));
  }),
  test("playVideoWithRecovery pauses the previous active video before playing another", async () => {
    const v25 = new FakeVideoElement();
    ((v25["readyState"] = 2), (v25["src"] = "/output/first.mp4"));
    const v26 = new FakeVideoElement();
    ((v26["readyState"] = 2),
      (v26["src"] = "/output/second.mp4"),
      strict["equal"](await playVideoWithRecovery(v25), true),
      strict["equal"](v25["paused"], false),
      strict["equal"](await playVideoWithRecovery(v26), true),
      strict["equal"](v25["paused"], true),
      strict["equal"](v25["pauseCount"], 1),
      strict["equal"](v26["paused"], false));
  }));

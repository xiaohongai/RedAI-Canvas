import test from "node:test";
import strict from "node:assert/strict";
import {
  __desktopMediaBlobSourceForTest,
  attachDesktopMediaPlaybackSource,
  attachMediaElementPlaybackSource,
} from "./desktopMediaBlobSource.js";
const previousWindow = globalThis["window"],
  previousLocation = globalThis["location"];
(test["afterEach"](() => {
  __desktopMediaBlobSourceForTest["clearBlobCacheForTest"]();
  if (typeof previousWindow === "undefined") delete globalThis["window"];
  else globalThis["window"] = previousWindow;
  if (typeof previousLocation === "undefined") delete globalThis["location"];
  else globalThis["location"] = previousLocation;
}),
  test("desktop media playback source: Electron local media resolves as local preview candidate", () => {
    ((globalThis["window"] = { electronAPI: {} }),
      (globalThis["location"] = {
        href: "http://127.0.0.1:8777/",
        origin: "http://127.0.0.1:8777",
      }),
      strict["equal"](
        __desktopMediaBlobSourceForTest["isDesktopBlobCandidate"](
          "/output/a.mp4",
        ),
        false,
      ),
      strict["equal"](
        __desktopMediaBlobSourceForTest["isDesktopBlobCandidate"](
          "https://example.com/a.mp4",
        ),
        false,
      ),
      strict["equal"](
        __desktopMediaBlobSourceForTest["isDesktopBlobCandidate"](
          "blob:http://127.0.0.1/x",
        ),
        false,
      ),
      strict["equal"](
        __desktopMediaBlobSourceForTest["normalizeDesktopLocalMediaPath"](
          "/output/a.mp4",
        ),
        "/output/a.mp4",
      ),
      strict["equal"](
        __desktopMediaBlobSourceForTest["normalizeDesktopLocalMediaPath"](
          "http://127.0.0.1:8777/output/a.mp4",
        ),
        "/output/a.mp4",
      ));
  }),
  test("desktop media playback source: audio attaches Electron local preview", async () => {
    const v0 = [];
    ((globalThis["window"] = {
      electronAPI: {
        getLocalPreviewUrl(v1) {
          return (
            v0["push"](v1),
            { url: "aic-local-preview://preview/audio-token/a.mp3" }
          );
        },
      },
    }),
      (globalThis["location"] = {
        href: "http://127.0.0.1:8777/",
        origin: "http://127.0.0.1:8777",
      }));
    const v2 = {
        dataset: {},
        preload: "none",
        loadCount: 0,
        getAttribute() {
          return "";
        },
        set src(v3) {
          this["_src"] = v3;
        },
        get src() {
          return this["_src"] || "";
        },
        load() {
          this["loadCount"] += 1;
        },
      },
      v4 = await attachDesktopMediaPlaybackSource(v2, "/output/a.mp3", {
        preload: "auto",
      });
    (strict["equal"](v4, "aic-local-preview://preview/audio-token/a.mp3"),
      strict["equal"](
        v2["src"],
        "aic-local-preview://preview/audio-token/a.mp3",
      ),
      strict["equal"](v2["preload"], "auto"),
      strict["equal"](v2["loadCount"], 1),
      strict["equal"](
        v2["dataset"]["desktopMediaSourceUrl"],
        "http://127.0.0.1:8777/output/a.mp3",
      ),
      strict["deepEqual"](v0, [
        { localPath: "/output/a.mp3", type: "audio/mpeg" },
      ]));
  }),
  test("desktop\x20media\x20playback\x20source:\x20video\x20attaches\x20Electron\x20local\x20preview", async () => {
    const v5 = [];
    ((globalThis["window"] = {
      electronAPI: {
        getLocalPreviewUrl(v6) {
          return (
            v5["push"](v6),
            { url: "aic-local-preview://preview/video-token/a.mp4" }
          );
        },
      },
    }),
      (globalThis["location"] = {
        href: "http://127.0.0.1:8777/",
        origin: "http://127.0.0.1:8777",
      }));
    const v7 = {
        dataset: {},
        preload: "none",
        loadCount: 0,
        getAttribute() {
          return "";
        },
        set src(v8) {
          this["_src"] = v8;
        },
        get src() {
          return this["_src"] || "";
        },
        load() {
          this["loadCount"] += 1;
        },
      },
      v9 = await attachDesktopMediaPlaybackSource(v7, "/output/a.mp4", {
        preload: "auto",
      });
    (strict["equal"](v9, "aic-local-preview://preview/video-token/a.mp4"),
      strict["equal"](
        v7["src"],
        "aic-local-preview://preview/video-token/a.mp4",
      ),
      strict["equal"](v7["preload"], "auto"),
      strict["equal"](v7["loadCount"], 1),
      strict["equal"](
        v7["dataset"]["desktopMediaSourceUrl"],
        "http://127.0.0.1:8777/output/a.mp4",
      ),
      strict["deepEqual"](v5, [
        { localPath: "/output/a.mp4", type: "video/mp4" },
      ]));
  }),
  test("desktop media playback source: generic attach keeps web direct source synchronous", async () => {
    ((globalThis["window"] = {}),
      (globalThis["location"] = {
        href: "http://127.0.0.1:8777/",
        origin: "http://127.0.0.1:8777",
      }));
    const v10 = {
        preload: "metadata",
        loadCount: 0,
        getAttribute() {
          return "";
        },
        set src(v11) {
          this["_src"] = v11;
        },
        get src() {
          return this["_src"] || "";
        },
        load() {
          this["loadCount"] += 1;
        },
      },
      v12 = attachMediaElementPlaybackSource(v10, "/output/web.mp3");
    (await v12,
      strict["equal"](v10["src"], "/output/web.mp3"),
      strict["equal"](v10["preload"], "metadata"),
      strict["equal"](v10["loadCount"], 1),
      strict["equal"](await v12, "/output/web.mp3"));
  }));

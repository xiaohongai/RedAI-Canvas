import test from "node:test";
import strict from "node:assert/strict";
import {
  resolveAudioDownloadTarget,
  triggerAudioDownload,
} from "./downloadAction.js";
(test("audio download action: uses local audio path and preserves real extension", () => {
  const v0 = resolveAudioDownloadTarget({
    nodeData: {
      name: "剪辑自 音频",
      localPath: "output/CutAudio/audio_fixed.wav",
    },
    audioElement: {
      src: "http://127.0.0.1:8777/output/CutAudio/audio_fixed.wav",
    },
  });
  strict["deepEqual"](v0, {
    url: "/output/CutAudio/audio_fixed.wav",
    filename: "audio_fixed.wav",
  });
}),
  test("audio download action: appends audio extension when fileName has no suffix", () => {
    const v1 = resolveAudioDownloadTarget({
      nodeData: {
        fileName: "旁白成片",
        audioUrl: "/output/final_voice.m4a?cache=1",
      },
    });
    strict["deepEqual"](v1, {
      url: "/output/final_voice.m4a?cache=1",
      filename: "旁白成片.m4a",
    });
  }),
  test("audio download action: falls back to node name with mp3 suffix", () => {
    const v2 = resolveAudioDownloadTarget({
      nodeData: { name: "AI 音频结果" },
      audioElement: { currentSrc: "blob:http://localhost/audio-preview" },
    });
    strict["deepEqual"](v2, {
      url: "blob:http://localhost/audio-preview",
      filename: "AI\x20音频结果.mp3",
    });
  }),
  test("audio download action: creates a safe anchor download", () => {
    const v3 = [],
      v4 = {
        children: [],
        appendChild(v5) {
          ((v5["parentNode"] = this), this["children"]["push"](v5));
        },
        removeChild(v6) {
          ((this["children"] = this["children"]["filter"]((v7) => v7 !== v6)),
            (v6["parentNode"] = null));
        },
      },
      v8 = {
        body: v4,
        createElement(v9) {
          return (
            strict["equal"](v9, "a"),
            {
              href: "",
              download: "",
              rel: "",
              parentNode: null,
              click() {
                v3["push"]({
                  href: this["href"],
                  download: this["download"],
                  rel: this["rel"],
                });
              },
              remove() {
                if (this["parentNode"]) this["parentNode"]["removeChild"](this);
              },
            }
          );
        },
      },
      v10 = triggerAudioDownload(
        { url: "/output/final.wav", filename: "final.wav" },
        v8,
      );
    (strict["equal"](v10, true),
      strict["deepEqual"](v3, [
        { href: "/output/final.wav", download: "final.wav", rel: "noopener" },
      ]),
      strict["equal"](v4["children"]["length"], 0));
  }));

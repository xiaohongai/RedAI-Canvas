import test from "node:test";
import strict from "node:assert/strict";
import {
  buildAudioGenerationResultPatch,
  buildLocalAudioGenerationResultPatch,
  getAudioGenerationResultError,
  getSuccessfulAudioGenerationItems,
  normalizeAudioGenerationResult,
} from "./audioGenerationResultRenderer.js";
(test("audio\x20generation\x20result\x20renderer:\x20normalizes\x20single\x20and\x20batch\x20audio\x20results", () => {
  const v0 = normalizeAudioGenerationResult({
      url: "https://cdn.example.com/final.mp3",
      localPath: "output/final.mp3",
    }),
    v1 = normalizeAudioGenerationResult({
      audios: [
        { audioUrl: "https://cdn.example.com/vocals.mp3", role: "vocals" },
        { audioUrl: "https://cdn.example.com/bg.mp3", role: "background" },
      ],
    });
  (strict["equal"](v0["outputType"], "audio"),
    strict["equal"](
      v0["items"][0]["audioUrl"],
      "https://cdn.example.com/final.mp3",
    ),
    strict["equal"](v0["items"][0]["localPath"], "output/final.mp3"),
    strict["equal"](v1["items"]["length"], 2),
    strict["equal"](v1["items"][0]["role"], "vocals"));
}),
  test("audio generation result renderer: builds success patch and persists remote result", async () => {
    const v2 = [],
      v3 = await buildAudioGenerationResultPatch(
        { audioUrl: "https://cdn.example.com/final.mp3" },
        {
          startedAt: Date["now"]() - 10,
          persistAudioOutput: async (v4) => {
            return (v2["push"](v4), { localPath: "output/final.mp3" });
          },
        },
      );
    (strict["deepEqual"](v2, ["https://cdn.example.com/final.mp3"]),
      strict["equal"](v3["jobStatus"], "success"),
      strict["equal"](v3["jobError"], null),
      strict["equal"](v3["audioUrl"], "/output/final.mp3"),
      strict["equal"](v3["src"], "/output/final.mp3"),
      strict["equal"](v3["localPath"], "output/final.mp3"),
      strict["equal"](v3["rhStatusMessage"], null));
  }),
  test("audio generation result renderer: builds failure patch from error item", async () => {
    const v5 = await buildAudioGenerationResultPatch({
      error: "provider rejected",
    });
    (strict["equal"](v5["jobStatus"], "error"),
      strict["equal"](v5["jobError"], "provider rejected"),
      strict["equal"](
        getAudioGenerationResultError({ error: "provider\x20rejected" }),
        "provider rejected",
      ),
      strict["deepEqual"](
        getSuccessfulAudioGenerationItems({ error: "provider rejected" }),
        [],
      ));
  }),
  test("audio generation result renderer: builds local audio patch without persistence", () => {
    const v6 = buildLocalAudioGenerationResultPatch(
      {
        audioUrl: "/output/local.mp3",
        localPath: "output/local.mp3",
        fileName: "local.mp3",
      },
      { duration: 0 },
    );
    (strict["equal"](v6["jobStatus"], "success"),
      strict["equal"](v6["generationDuration"], 0),
      strict["equal"](v6["audioUrl"], "/output/local.mp3"),
      strict["equal"](v6["src"], "/output/local.mp3"),
      strict["equal"](v6["localPath"], "output/local.mp3"),
      strict["equal"](v6["fileName"], "local.mp3"));
  }));

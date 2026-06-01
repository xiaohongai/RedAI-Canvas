import test from "node:test";
import strict from "node:assert/strict";
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
  getImageGenerationResultError,
  getSuccessfulImageGenerationItems,
  normalizeImageGenerationResult,
} from "./imageGenerationResultRenderer.js";
(test("image generation result renderer: legacy single image builds node patch", () => {
  const v0 = Date["now"]() - 25,
    v1 = buildImageGenerationResultPatch(
      {
        imageUrl: "/output/final.png",
        sourceUrl: "https://img.example.com/final.png",
        thumbUrl: "/output/final-thumb.png",
        localPath: "output/final.png",
        originalWidth: 1280,
        originalHeight: 720,
      },
      { startedAt: v0 },
    );
  (strict["equal"](v1["jobStatus"], "success"),
    strict["equal"](v1["jobError"], null),
    strict["equal"](v1["images"]["length"], 1),
    strict["equal"](v1["imageUrl"], "/output/final.png"),
    strict["equal"](v1["sourceUrl"], "https://img.example.com/final.png"),
    strict["equal"](v1["thumbUrl"], "/output/final-thumb.png"),
    strict["equal"](v1["localPath"], "output/final.png"),
    strict["equal"](v1["originalWidth"], 1280),
    strict["equal"](v1["originalHeight"], 720),
    strict["equal"](v1["mainImageIndex"], 0),
    strict["equal"](v1["isImagesExpanded"], false));
}),
  test("image\x20generation\x20result\x20renderer:\x20legacy\x20batch\x20result\x20writes\x20images\x20and\x20first\x20item", () => {
    const v2 = buildImageGenerationResultPatch(
      {
        isBatch: true,
        images: [
          { imageUrl: "/output/a.png", localPath: "output/a.png" },
          { imageUrl: "/output/b.png", localPath: "output/b.png" },
        ],
      },
      { startedAt: Date["now"]() - 10 },
    );
    (strict["equal"](v2["jobStatus"], "success"),
      strict["equal"](v2["images"]["length"], 2),
      strict["equal"](v2["imageUrl"], "/output/a.png"),
      strict["equal"](v2["localPath"], "output/a.png"),
      strict["equal"](v2["images"][1]["imageUrl"], "/output/b.png"));
  }),
  test("image generation result renderer: canonical image result is accepted", () => {
    const v3 = normalizeImageGenerationResult({
        outputType: "image",
        items: [
          {
            url: "https://img.example.com/a.png",
            localPath: "output/a.png",
            metadata: { provider: "apimart" },
          },
        ],
      }),
      v4 = buildImageGenerationResultPatch(v3, {
        startedAt: Date["now"]() - 10,
      });
    (strict["equal"](v3["outputType"], "image"),
      strict["equal"](v3["items"][0]["url"], "https://img.example.com/a.png"),
      strict["deepEqual"](v3["items"][0]["metadata"], { provider: "apimart" }),
      strict["equal"](v4["imageUrl"], "https://img.example.com/a.png"),
      strict["equal"](v4["sourceUrl"], "https://img.example.com/a.png"),
      strict["equal"](v4["localPath"], "output/a.png"));
  }),
  test("image generation result renderer: error item writes failure patch", () => {
    const v5 = buildImageGenerationResultPatch(
      { error: "provider\x20rejected" },
      { startedAt: Date["now"]() - 10 },
    );
    (strict["equal"](v5["jobStatus"], "error"),
      strict["equal"](v5["jobError"], "provider rejected"),
      strict["equal"](v5["images"]["length"], 1),
      strict["equal"](
        getImageGenerationResultError({ error: "provider rejected" }),
        "provider rejected",
      ),
      strict["deepEqual"](
        getSuccessfulImageGenerationItems({ error: "provider\x20rejected" }),
        [],
      ));
  }),
  test("image generation result renderer: explicit failure helper builds image failure patch", () => {
    const v6 = buildImageGenerationFailurePatch({
      error: "provider rejected",
      duration: 1200,
    });
    (strict["equal"](v6["jobStatus"], "error"),
      strict["equal"](v6["jobError"], "provider rejected"),
      strict["equal"](v6["generationDuration"], 1200),
      strict["equal"](v6["images"]["length"], 1),
      strict["equal"](v6["images"][0]["error"], "provider rejected"),
      strict["equal"](v6["mainImageIndex"], 0),
      strict["equal"](v6["imageUrl"], ""),
      strict["equal"](v6["thumbUrl"], ""));
  }),
  test("image generation result renderer: failure helper can preserve media fields", () => {
    const v7 = buildImageGenerationFailurePatch({
      error: "resume failed",
      duration: 1200,
      clearMediaFields: false,
    });
    (strict["equal"](v7["jobStatus"], "error"),
      strict["equal"](v7["jobError"], "resume failed"),
      strict["equal"](v7["images"][0]["error"], "resume\x20failed"),
      strict["equal"](
        Object["prototype"]["hasOwnProperty"]["call"](v7, "imageUrl"),
        false,
      ),
      strict["equal"](
        Object["prototype"]["hasOwnProperty"]["call"](v7, "localPath"),
        false,
      ));
  }),
  test("image generation result renderer: empty result returns empty normalized result and no patch", () => {
    const v8 = normalizeImageGenerationResult({});
    (strict["deepEqual"](v8, { outputType: "image", items: [] }),
      strict["equal"](buildImageGenerationResultPatch(v8), null));
  }));

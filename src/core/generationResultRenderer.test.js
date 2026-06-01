import test from "node:test";
import strict from "node:assert/strict";
import {
  buildGenerationCollectionResultPatch,
  buildGenerationSingleResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from "./generationResultRenderer.js";
(test("generationResultRenderer: normalizes canonical, collection, array, and single results", () => {
  (strict["deepEqual"](
    normalizeGenerationResultItems({
      outputType: "image",
      items: [{ url: "/a.png" }],
    }),
    [{ url: "/a.png" }],
  ),
    strict["deepEqual"](
      normalizeGenerationResultItems(
        { videos: [{ videoUrl: "/a.mp4" }] },
        { collectionField: "videos" },
      ),
      [{ videoUrl: "/a.mp4" }],
    ),
    strict["deepEqual"](
      normalizeGenerationResultItems([{ audioUrl: "/a.mp3" }]),
      [{ audioUrl: "/a.mp3" }],
    ),
    strict["deepEqual"](
      normalizeGenerationResultItems(
        { audioUrl: "/a.mp3" },
        { singleItemFields: ["audioUrl"] },
      ),
      [{ audioUrl: "/a.mp3" }],
    ));
}),
  test("generationResultRenderer: result error is read from normalized items", () => {
    (strict["equal"](
      getFirstGenerationResultError(
        { videos: [{ error: "provider failed" }] },
        { collectionField: "videos" },
      ),
      "provider failed",
    ),
      strict["equal"](firstNonEmptyString("", null, " ok "), "ok"));
  }),
  test("generationResultRenderer:\x20builds\x20success\x20and\x20failure\x20collection\x20patches", () => {
    const v0 = buildGenerationCollectionResultPatch(
      { videos: [{ videoUrl: "/out.mp4", localPath: "output/out.mp4" }] },
      {
        collectionField: "videos",
        mainIndexField: "mainVideoIndex",
        expandedField: "isVideosExpanded",
        startedAt: Date["now"]() - 10,
        buildFirstItemPatch: (v1) => ({
          videoUrl: v1["videoUrl"],
          localPath: v1["localPath"],
        }),
        extraPatch: { rhStatusMessage: null },
      },
    );
    (strict["equal"](v0["jobStatus"], "success"),
      strict["equal"](v0["mainVideoIndex"], 0),
      strict["equal"](v0["isVideosExpanded"], false),
      strict["equal"](v0["videoUrl"], "/out.mp4"),
      strict["equal"](v0["localPath"], "output/out.mp4"),
      strict["equal"](v0["rhStatusMessage"], null));
    const v2 = buildGenerationCollectionResultPatch(
      { error: "provider failed" },
      {
        collectionField: "videos",
        mainIndexField: "mainVideoIndex",
        singleItemFields: ["videoUrl"],
      },
    );
    (strict["equal"](v2["jobStatus"], "error"),
      strict["equal"](v2["jobError"], "provider failed"),
      strict["equal"](v2["videos"]["length"], 1));
  }),
  test("generationResultRenderer: builds single result patch without collection fields", () => {
    const v3 = buildGenerationSingleResultPatch(
      { audioUrl: "/output/final.mp3", localPath: "output/final.mp3" },
      {
        singleItemFields: ["audioUrl", "localPath"],
        buildItemPatch: (v4) => ({
          audioUrl: v4["audioUrl"],
          localPath: v4["localPath"],
        }),
        extraPatch: { rhStatusMessage: null },
      },
    );
    (strict["equal"](v3["jobStatus"], "success"),
      strict["equal"](v3["audioUrl"], "/output/final.mp3"),
      strict["equal"](v3["localPath"], "output/final.mp3"),
      strict["equal"](v3["rhStatusMessage"], null));
    const v5 = buildGenerationSingleResultPatch(
      { error: "provider failed" },
      { singleItemFields: ["audioUrl"] },
    );
    (strict["equal"](v5["jobStatus"], "error"),
      strict["equal"](v5["jobError"], "provider failed"));
  }));

import {
  buildGenerationCollectionResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from "../../core/generationResultRenderer.js";
import {
  localPathToUrl,
  pickResultLocalPath,
} from "../../utils/localMediaPath.js";
function asObject(v0) {
  return v0 && typeof v0 === "object" && !Array["isArray"](v0) ? v0 : null;
}
function normalizeVideoGenerationResultItem(v1) {
  const v2 = asObject(v1);
  if (!v2) throw new Error("[videoGenerationResult] item must be an object");
  const v3 = firstNonEmptyString(v2["localPath"], pickResultLocalPath(v2)),
    v4 = firstNonEmptyString(
      v2["videoUrl"],
      v2["url"],
      v2["localUrl"],
      localPathToUrl(v3),
    ),
    v5 = {
      ...v2,
      outputType: "video",
      videoUrl: v4,
      localPath: v3,
      thumbUrl: firstNonEmptyString(v2["thumbUrl"], v2["posterUrl"]),
      thumbId: firstNonEmptyString(v2["thumbId"], v2["assetId"]),
      metadata:
        v2["metadata"] && typeof v2["metadata"] === "object"
          ? { ...v2["metadata"] }
          : {},
    },
    v6 = firstNonEmptyString(v2["error"]);
  if (v6) v5["error"] = v6;
  return v5;
}
function removeMediaFieldPatch(v7) {
  if (!v7 || typeof v7 !== "object") return v7;
  for (const v8 of ["videoUrl", "localPath", "thumbId", "thumbUrl"]) {
    delete v7[v8];
  }
  return v7;
}
export function normalizeVideoGenerationResult(v9) {
  const v10 = normalizeGenerationResultItems(v9, {
    collectionField: "videos",
    singleItemFields: ["videoUrl", "url", "localUrl", "localPath", "thumbUrl"],
  });
  if (v10["length"] === 0) return { outputType: "video", items: [] };
  return {
    outputType: "video",
    items: v10["map"]((v11) => normalizeVideoGenerationResultItem(v11)),
  };
}
export function getVideoGenerationResultError(v12) {
  return getFirstGenerationResultError(
    v12?.["outputType"] === "video" && Array["isArray"](v12["items"])
      ? v12["items"]
      : v12,
    {
      collectionField: "videos",
      singleItemFields: [
        "videoUrl",
        "url",
        "localUrl",
        "localPath",
        "thumbUrl",
      ],
    },
  );
}
export function getSuccessfulVideoGenerationItems(v13) {
  const v14 =
    v13?.["outputType"] === "video" && Array["isArray"](v13["items"])
      ? v13
      : normalizeVideoGenerationResult(v13);
  return v14["items"]["filter"]((v15) => v15 && !v15["error"]);
}
export function buildVideoGenerationResultPatch(
  v16,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const v17 =
    v16?.["outputType"] === "video" && Array["isArray"](v16["items"])
      ? v16
      : normalizeVideoGenerationResult(v16);
  return buildGenerationCollectionResultPatch(v17, {
    collectionField: "videos",
    mainIndexField: "mainVideoIndex",
    expandedField: "isVideosExpanded",
    startedAt: startedAt,
    duration: duration,
    buildFirstItemPatch: (v18) => ({
      videoUrl: v18["videoUrl"],
      localPath: v18["localPath"],
      displayLocalPath: v18["displayLocalPath"] || "",
      posterLocalPath: v18["posterLocalPath"] || "",
      videoProxyStatus: v18["videoProxyStatus"] || "",
      videoCodec: v18["videoCodec"] || "",
      thumbId: v18["thumbId"],
      thumbUrl: v18["thumbUrl"],
    }),
    extraPatch: { rhStatusMessage: null, rhStatusCode: null },
  });
}
export function buildVideoGenerationFailurePatch({
  error: error = "",
  startedAt: startedAt = 0,
  duration: duration = null,
  clearMediaFields: clearMediaFields = true,
} = {}) {
  const v19 = firstNonEmptyString(error, "生成失败"),
    v20 = buildGenerationCollectionResultPatch(
      {
        outputType: "video",
        items: [{ error: v19, thumbUrl: "", videoUrl: "", localPath: "" }],
      },
      {
        collectionField: "videos",
        mainIndexField: "mainVideoIndex",
        startedAt: startedAt,
        duration: duration,
        buildFirstItemPatch: () => ({
          videoUrl: "",
          localPath: "",
          thumbId: "",
          thumbUrl: "",
        }),
      },
    );
  return clearMediaFields ? v20 : removeMediaFieldPatch(v20);
}

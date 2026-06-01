import {
  buildGenerationSingleResultPatch,
  firstNonEmptyString,
  getFirstGenerationResultError,
  normalizeGenerationResultItems,
} from "../../core/generationResultRenderer.js";
import { buildCanvasLocalAudioFields } from "../../services/canvasMediaLocalService.js";
import {
  normalizeLocalPath,
  pickResultLocalPath,
} from "../../utils/localMediaPath.js";
function asObject(v0) {
  return v0 && typeof v0 === "object" && !Array["isArray"](v0) ? v0 : null;
}
function normalizeAudioGenerationResultItem(v1) {
  const v2 = asObject(v1);
  if (!v2) throw new Error("[audioGenerationResult] item must be an object");
  const v3 = {
      ...v2,
      outputType: "audio",
      audioUrl: firstNonEmptyString(
        v2["audioUrl"],
        v2["url"],
        v2["src"],
        v2["resultUrl"],
      ),
      localPath: firstNonEmptyString(v2["localPath"], pickResultLocalPath(v2)),
      metadata:
        v2["metadata"] && typeof v2["metadata"] === "object"
          ? { ...v2["metadata"] }
          : {},
    },
    v4 = firstNonEmptyString(v2["error"]);
  if (v4) v3["error"] = v4;
  return v3;
}
export function normalizeAudioGenerationResult(v5) {
  const v6 = normalizeGenerationResultItems(v5, {
    collectionField: "audios",
    singleItemFields: ["audioUrl", "url", "src", "resultUrl", "localPath"],
  });
  if (v6["length"] === 0) return { outputType: "audio", items: [] };
  return {
    outputType: "audio",
    items: v6["map"]((v7) => normalizeAudioGenerationResultItem(v7)),
  };
}
export function getAudioGenerationResultError(v8) {
  return getFirstGenerationResultError(
    v8?.["outputType"] === "audio" && Array["isArray"](v8["items"])
      ? v8["items"]
      : v8,
    {
      collectionField: "audios",
      singleItemFields: ["audioUrl", "url", "src", "resultUrl", "localPath"],
    },
  );
}
export function getSuccessfulAudioGenerationItems(v9) {
  const v10 =
    v9?.["outputType"] === "audio" && Array["isArray"](v9["items"])
      ? v9
      : normalizeAudioGenerationResult(v9);
  return v10["items"]["filter"]((v11) => v11 && !v11["error"]);
}
function buildAudioItemPatch(v12) {
  const v13 = {
    audioUrl: v12["audioUrl"],
    src: v12["src"],
    localPath: v12["localPath"],
  };
  for (const v14 of [
    "waveformLocalPath",
    "assetId",
    "derivativeStatus",
    "fileName",
  ]) {
    if (v12[v14] !== undefined) v13[v14] = v12[v14];
  }
  return v13;
}
async function resolvePersistedAudioItem(v15, v16) {
  const v17 = firstNonEmptyString(v15?.["audioUrl"]);
  let v18 = firstNonEmptyString(v15?.["localPath"]);
  if (!v18 && v17) {
    if (typeof v16 !== "function") throw new Error("已生成但本地保存失败");
    const v19 = await v16(v17);
    v18 = normalizeLocalPath(v19?.["localPath"] || "");
  }
  const v20 = buildCanvasLocalAudioFields({
    ...v15,
    localPath: v18,
    audioUrl: v17,
  });
  if (!v20["audioUrl"] || !v20["localPath"])
    throw new Error("已生成但本地保存失败");
  return { ...v15, ...v20 };
}
function resolveLocalAudioItem(v21) {
  if (firstNonEmptyString(v21?.["error"])) return v21;
  const v22 = buildCanvasLocalAudioFields(v21);
  if (!v22["audioUrl"] || !v22["localPath"])
    throw new Error("音频结果无效：缺少本地音频路径");
  return { ...v21, ...v22 };
}
function buildAudioPatchFromItem(
  v23,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  return buildGenerationSingleResultPatch(
    { outputType: "audio", items: [v23] },
    {
      startedAt: startedAt,
      duration: duration,
      buildItemPatch: buildAudioItemPatch,
      extraPatch: { rhStatusMessage: null, rhStatusCode: null },
    },
  );
}
export function buildLocalAudioGenerationResultPatch(
  v24,
  { startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const v25 =
    v24?.["outputType"] === "audio" && Array["isArray"](v24["items"])
      ? v24
      : normalizeAudioGenerationResult(v24);
  if (v25["items"]["length"] === 0) return null;
  return buildAudioPatchFromItem(resolveLocalAudioItem(v25["items"][0]), {
    startedAt: startedAt,
    duration: duration,
  });
}
export async function buildAudioGenerationResultPatch(
  v26,
  {
    startedAt: startedAt = 0,
    duration: duration = null,
    persistAudioOutput: v27,
  } = {},
) {
  const v28 =
    v26?.["outputType"] === "audio" && Array["isArray"](v26["items"])
      ? v26
      : normalizeAudioGenerationResult(v26);
  if (v28["items"]["length"] === 0) return null;
  const v29 = v28["items"][0],
    v30 = firstNonEmptyString(v29?.["error"])
      ? v29
      : await resolvePersistedAudioItem(v29, v27);
  return buildAudioPatchFromItem(v30, {
    startedAt: startedAt,
    duration: duration,
  });
}

import { saveOutputFromUrlToServer } from "../../api/projectsV2Api.js";
import { buildCanvasLocalImageFields } from "../services/canvasMediaLocalService.js";
import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import { saveRemoteImageLocally } from "./project.js";
function isRemoteLikeUrl(v0) {
  const v1 = String(v0 || "")["trim"]();
  return (
    /^https?:\/\//i["test"](v1) ||
    v1["startsWith"]("blob:") ||
    v1["startsWith"]("data:")
  );
}
export function buildToolbarImageFields({
  localPath: localPath = "",
  resultUrl: resultUrl = "",
  thumbUrl: thumbUrl = "",
  includeSrc: includeSrc = false,
}) {
  const v2 = {
    localPath: localPath,
    imageUrl: resultUrl,
    sourceUrl: resultUrl,
    thumbUrl: thumbUrl,
  };
  if (includeSrc) v2["src"] = thumbUrl || resultUrl;
  return buildCanvasLocalImageFields(v2, { includeSrc: includeSrc });
}
export async function saveRemoteImageResultLocally(v3, v4 = {}) {
  const v5 = v4["projectId"] || "default_v2_project",
    v6 = await saveRemoteImageLocally(v3, v5, v4),
    v7 = isRemoteLikeUrl(v6) ? "" : normalizeLocalPath(v6),
    v8 = localPathToUrl(v7) || String(v6 || "")["trim"]() || v3;
  return {
    localPath: v7,
    thumbUrl: v8,
    fields: buildToolbarImageFields({
      localPath: v7,
      resultUrl: v3,
      thumbUrl: v8,
      includeSrc: v4["includeSrc"],
    }),
  };
}
export async function saveOutputImageResult(v9, v10 = {}) {
  const v11 = v10["resumedImage"] || null;
  if (v11) {
    const v12 = buildCanvasLocalImageFields(v11, {
        includeSrc: v10["includeSrc"] ?? true,
      }),
      v13 = String(v12["localPath"] || "")["trim"](),
      v14 = String(v12["thumbUrl"] || v12["imageUrl"] || v12["src"] || "")[
        "trim"
      ]();
    return { localPath: v13, thumbUrl: v14, fields: v12 };
  }
  let v15 = "",
    v16 = v9;
  const v17 = await saveOutputFromUrlToServer({
      url: v9,
      ext: v10["ext"] || "png",
      dedupeKey:
        v10["dedupeKey"] ||
        (v10["taskKey"] ? v10["taskKey"] + ":" + v9 : undefined),
    }),
    v18 = pickResultLocalPath(v17);
  return (
    v18 && ((v15 = v18), (v16 = localPathToUrl(v15))),
    {
      localPath: v15,
      thumbUrl: v16,
      fields: buildToolbarImageFields({
        localPath: v15,
        resultUrl: v9,
        thumbUrl: v16,
        includeSrc: v10["includeSrc"] ?? true,
      }),
    }
  );
}

import { getThumbnailRecord, saveThumbnailRecord } from "../modules/storage.js";
import {
  hasStableThumbnailFallback,
  isInlineImageDataUrl,
} from "../utils/thumbnailPersistence.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
function normalizePathLike(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (!v1) return "";
  const v2 = localPathToUrl(v1);
  if (v2) return v2;
  if (v1["startsWith"]("/")) return v1["replace"](/^\/+/, "/");
  if (/^[a-z]+:\/\//i["test"](v1))
    try {
      const v3 = new URL(v1, window["location"]["href"]);
      if (v3["origin"] === window["location"]["origin"])
        return "" + v3["pathname"] + v3["search"];
      return v3["href"];
    } catch {
      return v1;
    }
  return "";
}
function pickResourceRef(v4) {
  if (!v4) return "";
  if (typeof v4 === "string") return normalizePathLike(v4);
  return (
    normalizePathLike(v4["localPath"]) ||
    normalizePathLike(v4["src"]) ||
    normalizePathLike(v4["imageUrl"]) ||
    normalizePathLike(v4["sourceUrl"])
  );
}
export function buildThumbnailCacheKey(v5) {
  const v6 = pickResourceRef(v5);
  if (!v6) return "";
  return "thumb:" + v6;
}
export async function getThumbnail(v7) {
  const v8 = buildThumbnailCacheKey(v7);
  if (!v8) return "";
  const v9 = await getThumbnailRecord(v8),
    v10 = String(v9?.["dataUrl"] || "")["trim"]();
  return isInlineImageDataUrl(v10) ? v10 : "";
}
export async function setThumbnail(v11, v12) {
  const v13 = buildThumbnailCacheKey(v11),
    v14 = String(v12 || "")["trim"]();
  if (!v13 || !isInlineImageDataUrl(v14)) return false;
  return (
    await saveThumbnailRecord(v13, {
      dataUrl: v14,
      updatedAt: Date["now"](),
      version: 1,
    }),
    true
  );
}
export async function migrateLegacyThumbnail(v15) {
  if (!v15 || !isInlineImageDataUrl(v15["thumbUrl"])) return false;
  if (!hasStableThumbnailFallback(v15)) return false;
  const v16 = await getThumbnail(v15);
  if (v16) return true;
  return await setThumbnail(v15, v15["thumbUrl"]);
}
async function migrateInlineThumbField(v17) {
  if (!v17 || typeof v17 !== "object") return false;
  try {
    if (!(await migrateLegacyThumbnail(v17))) return false;
    return (delete v17["thumbUrl"], true);
  } catch (v18) {
    return (
      console["warn"](
        "[thumbnailCacheService] 旧缩略图迁移失败，已保留原始 thumbUrl",
        v18,
      ),
      false
    );
  }
}
async function migrateNodeLikeInPlace(v19) {
  if (!v19 || typeof v19 !== "object") return false;
  let v20 = false;
  if (await migrateInlineThumbField(v19)) v20 = true;
  if (Array["isArray"](v19["images"]))
    for (const v21 of v19["images"]) {
      if (await migrateInlineThumbField(v21)) v20 = true;
    }
  if (Array["isArray"](v19["videos"]))
    for (const v22 of v19["videos"]) {
      if (await migrateInlineThumbField(v22)) v20 = true;
    }
  if (Array["isArray"](v19["cells"]))
    for (const v23 of v19["cells"]) {
      if (await migrateInlineThumbField(v23)) v20 = true;
    }
  return v20;
}
export async function migrateLegacyThumbnailsInMultiData(v24) {
  if (!v24 || typeof v24 !== "object")
    return { changed: false, multiData: v24 };
  const v25 =
    typeof structuredClone === "function"
      ? structuredClone(v24)
      : JSON["parse"](JSON["stringify"](v24));
  let v26 = false;
  const v27 = Array["isArray"](v25["canvases"]) ? v25["canvases"] : [];
  for (const v28 of v27) {
    const v29 = Array["isArray"](v28?.["nodes"])
      ? v28["nodes"]
      : v28?.["nodes"] && typeof v28["nodes"] === "object"
        ? Object["values"](v28["nodes"])
        : [];
    for (const v30 of v29) {
      if (await migrateNodeLikeInPlace(v30)) v26 = true;
    }
  }
  return { changed: v26, multiData: v25 };
}

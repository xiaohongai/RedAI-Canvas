import path from "node:path";
import {
  isSupportedProjectFileExtension,
  listRecentProjects,
} from "../src/services/desktopProjectFileStore.js";
export function canUseSystemRecentDocuments(v0 = process["platform"]) {
  return v0 === "darwin" || v0 === "win32";
}
export function normalizeSystemRecentDocumentItems(v1 = []) {
  if (!Array["isArray"](v1)) return [];
  return v1["filter"]((v2) => v2 && v2["exists"] !== false)
    ["map"]((v3) => String(v3["path"] || "")["trim"]())
    ["filter"]((v4) => path["isAbsolute"](v4))
    ["filter"]((v5) => isSupportedProjectFileExtension(v5));
}
export function syncSystemRecentDocuments({
  app: v6,
  items: v7,
  platform: platform = process["platform"],
} = {}) {
  if (!canUseSystemRecentDocuments(platform))
    return { ok: true, skipped: "platform", count: 0, paths: [] };
  if (
    typeof v6?.["clearRecentDocuments"] !== "function" ||
    typeof v6?.["addRecentDocument"] !== "function"
  )
    return {
      ok: false,
      error: "Recent\x20document\x20API\x20is\x20unavailable",
      count: 0,
      paths: [],
    };
  const v8 = normalizeSystemRecentDocumentItems(v7),
    v9 = [...v8]["reverse"]();
  return (
    v6["clearRecentDocuments"](),
    v9["forEach"]((v10) => {
      v6["addRecentDocument"](v10);
    }),
    { ok: true, count: v8["length"], paths: v8 }
  );
}
export function syncRecentProjectsToSystemRecentDocuments({
  app: v11,
  recentStorePath: v12,
  listRecentProjectsImpl: listRecentProjectsImpl = listRecentProjects,
  platform: platform = process["platform"],
} = {}) {
  const v13 = listRecentProjectsImpl(v12);
  return syncSystemRecentDocuments({
    app: v11,
    items: v13,
    platform: platform,
  });
}

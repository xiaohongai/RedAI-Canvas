import path from "node:path";
import { buildLocalAssetCleanupRoots } from "./localAssetCleanup.js";
function isSameResolvedPath(v0, v1, v2 = process["platform"]) {
  try {
    const v3 = path["resolve"](String(v0 || "")),
      v4 = path["resolve"](String(v1 || ""));
    return v2 === "win32" || v2 === "darwin"
      ? v3["toLowerCase"]() === v4["toLowerCase"]()
      : v3 === v4;
  } catch {
    return false;
  }
}
function getLegacyDefaultFileSavePaths({
  appIsPackaged: v5,
  legacyFilesRoot: v6,
  storageRoot: v7,
  platform: platform = process["platform"],
}) {
  if (!v5) return {};
  if (!v6 || isSameResolvedPath(v6, v7, platform)) return {};
  return {
    canvasDir: path["join"](v6, "Canvas\x20Project"),
    dataDir: path["join"](v6, "data"),
    outputDir: path["join"](v6, "output"),
  };
}
function buildLegacyDefaults({
  dataDir: v8,
  recentProjectsStorePath: v9,
  recoverySnapshotPath: v10,
}) {
  const v11 = String(v8 || "")["trim"]();
  return {
    canvasDir: "",
    outputDir: "",
    dataDir: "",
    uploadsDir: "",
    assetsDir: v11 ? path["join"](v11, "assets") : "",
    workflowsDir: v11 ? path["join"](v11, "workflows") : "",
    workflowThumbsDir: v11 ? path["join"](v11, "workflows", "thumbs") : "",
    recentProjectsStorePath: v9,
    recoverySnapshotPath: v10,
  };
}
export async function readFileSavePathsForLocalCleanup({
  requestLocalJson: v12,
  logDiagnosticEvent: v13,
}) {
  try {
    const v14 = await v12("/api/v2/user/settings.json");
    return v14?.["fileSavePaths"] && typeof v14["fileSavePaths"] === "object"
      ? v14["fileSavePaths"]
      : {};
  } catch (v15) {
    return (
      v13?.({
        type: "local_asset_cleanup.settings_read_failed",
        level: "warn",
        source: "main",
        message:
          "Failed\x20to\x20read\x20current\x20file\x20save\x20paths\x20for\x20local\x20asset\x20cleanup",
        error: v15,
      }),
      {}
    );
  }
}
export function createLocalAssetCleanupRootsResolver({
  appIsPackaged: v16,
  legacyFilesRoot: v17,
  storageRoot: v18,
  getCurrentDefaults: v19,
  readCurrentFileSavePaths: v20,
  platform: platform = process["platform"],
}) {
  return async function v21(v22 = {}) {
    const v23 = String(v22?.["scope"] || "current")["trim"](),
      v24 = v19?.() || {},
      v25 =
        v23 === "legacy-defaults"
          ? getLegacyDefaultFileSavePaths({
              appIsPackaged: v16,
              legacyFilesRoot: v17,
              storageRoot: v18,
              platform: platform,
            })
          : await v20?.();
    return buildLocalAssetCleanupRoots({
      fileSavePaths: v25,
      defaults:
        v23 === "legacy-defaults"
          ? buildLegacyDefaults({
              dataDir: v25?.["dataDir"],
              recentProjectsStorePath: v24["recentProjectsStorePath"],
              recoverySnapshotPath: v24["recoverySnapshotPath"],
            })
          : v24,
    });
  };
}

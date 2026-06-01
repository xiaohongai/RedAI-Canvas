import path from "node:path";
const WINDOWS_STATE_DIRNAME = "RedAI-Canvas",
  PACKAGED_FILES_DIRNAME = "files";
function trimText(v0) {
  return String(v0 || "")["trim"]();
}
function normalizePathKey(v1, v2 = process["platform"]) {
  const v3 = path["resolve"](String(v1 || ""));
  return v2 === "win32" || v2 === "darwin" ? v3["toLowerCase"]() : v3;
}
function pushUniquePath(v4, v5, v6 = process["platform"]) {
  const v7 = trimText(v5);
  if (!v7) return;
  const v8 = normalizePathKey(v7, v6);
  if (v4["some"]((v9) => normalizePathKey(v9, v6) === v8)) return;
  v4["push"](v7);
}
export function resolvePackagedFilesRoot({
  localAppData: v10,
  userDataRoot: v11,
  platform: platform = process["platform"],
} = {}) {
  const v12 = trimText(v11),
    v13 = trimText(v10);
  if (platform === "win32" && v13)
    return path["join"](v13, WINDOWS_STATE_DIRNAME, PACKAGED_FILES_DIRNAME);
  return path["join"](v12 || v13, PACKAGED_FILES_DIRNAME);
}
export function createStorageRoots({
  appIsPackaged: v14,
  appRoot: v15,
  processExecPath: v16,
  userDataRoot: v17,
  localAppData: v18,
  platform: platform = process["platform"],
} = {}) {
  const v19 = path["resolve"](v15 || "."),
    v20 = v14 ? path["dirname"](path["resolve"](v16 || v19)) : v19,
    v21 = v14 ? path["join"](v20, "Data") : v19,
    v22 = v14
      ? resolvePackagedFilesRoot({
          localAppData: v18,
          userDataRoot: v17,
          platform: platform,
        })
      : path["join"](v19, "user-data"),
    v23 = [];
  return (
    v14
      ? (pushUniquePath(v23, v21, platform),
        pushUniquePath(
          v23,
          path["join"](trimText(v17), PACKAGED_FILES_DIRNAME),
          platform,
        ))
      : pushUniquePath(v23, v19, platform),
    {
      installRoot: v20,
      installDataRoot: v21,
      storageRoot: v22,
      legacyFilesRoots: v23["filter"](
        (v24) =>
          normalizePathKey(v24, platform) !== normalizePathKey(v22, platform),
      ),
    }
  );
}
export function buildLegacyFileSavePathEnv(v25 = []) {
  const v26 = {};
  return (
    v25["forEach"]((v27, v28) => {
      const v29 = trimText(v27);
      if (!v29) return;
      const v30 = v28 === 0 ? "" : "_" + (v28 + 1);
      ((v26["AIC_LEGACY_CANVAS_DIR" + v30] = path["join"](
        v29,
        "Canvas Project",
      )),
        (v26["AIC_LEGACY_DATA_DIR" + v30] = path["join"](v29, "data")),
        (v26["AIC_LEGACY_OUTPUT_DIR" + v30] = path["join"](v29, "output")),
        (v26["AIC_LEGACY_UPLOADS_DIR" + v30] = path["join"](
          v29,
          "data",
          "uploads",
        )));
    }),
    v26
  );
}

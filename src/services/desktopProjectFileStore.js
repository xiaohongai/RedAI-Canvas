import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
export const PROJECT_RECENTS_VERSION = 1;
export const PROJECT_RECENTS_LIMIT = 20;
export const RECOVERY_SNAPSHOT_VERSION = 1;
export const DEFAULT_PROJECT_FILE_EXTENSION = ".aicanvas";
export const SUPPORTED_PROJECT_FILE_EXTENSIONS = Object["freeze"]([
  ".aicanvas",
  ".aicproj",
  ".json",
]);
export const ASSOCIATED_PROJECT_FILE_EXTENSIONS = Object["freeze"]([
  "aicanvas",
  "aicproj",
]);
function isPlainObject(v0) {
  return !!v0 && typeof v0 === "object" && !Array["isArray"](v0);
}
function normalizeComparablePath(v1) {
  const v2 = path["resolve"](String(v1 || ""));
  return process["platform"] === "win32" || process["platform"] === "darwin"
    ? v2["toLowerCase"]()
    : v2;
}
function stripUtf8Bom(v3) {
  return String(v3 || "")["replace"](/^\uFEFF/, "");
}
function normalizeTimestamp(v4, v5 = 0) {
  const v6 = Number(v4);
  return Number["isFinite"](v6) && v6 > 0 ? Math["round"](v6) : v5;
}
export function isSupportedProjectFileExtension(v7) {
  const v8 = path["extname"](String(v7 || ""))["toLowerCase"]();
  return SUPPORTED_PROJECT_FILE_EXTENSIONS["includes"](v8);
}
export function stripProjectFileExtension(v9) {
  const v10 = String(v9 || ""),
    v11 = path["extname"](v10)["toLowerCase"]();
  return SUPPORTED_PROJECT_FILE_EXTENSIONS["includes"](v11)
    ? v10["slice"](0, -v11["length"])
    : v10;
}
export function sanitizeProjectName(v12) {
  const v13 = String(v12 || "")["trim"]() || "未命名画布";
  return (
    v13["replace"](/[\\/:*?"<>|]/g, "_")
      ["replace"](/\s+/g, "\x20")
      ["trim"]() || "未命名画布"
  );
}
export function sanitizeProjectFilename(v14) {
  const v15 = sanitizeProjectName(stripProjectFileExtension(v14));
  return "" + v15 + DEFAULT_PROJECT_FILE_EXTENSION;
}
export function withJsonProjectExtension(v16) {
  const v17 = String(v16 || "")["trim"]();
  if (!v17) return v17;
  return path["extname"](v17) ? v17 : "" + v17 + DEFAULT_PROJECT_FILE_EXTENSION;
}
export function assertJsonProjectPath(
  v18,
  { mustExist: mustExist = false } = {},
) {
  const v19 = String(v18 || "")["trim"]();
  if (!v19) throw new Error("Project\x20path\x20is\x20required");
  if (!path["isAbsolute"](v19))
    throw new Error("Project path must be absolute");
  if (!isSupportedProjectFileExtension(v19))
    throw new Error(
      "Only .aicanvas, .aicproj, or .json project files are supported",
    );
  if (mustExist) {
    const v20 = statSync(v19);
    if (!v20["isFile"]()) throw new Error("Project path is not a file");
  }
  return path["resolve"](v19);
}
export function findFirstSupportedProjectPathFromArgs(
  v21,
  { mustExist: mustExist = true } = {},
) {
  const v22 = Array["isArray"](v21) ? v21 : [];
  for (const v23 of v22) {
    const v24 = String(v23 || "")
      ["trim"]()
      ["replace"](/^"|"$/g, "");
    if (!v24 || !path["isAbsolute"](v24)) continue;
    if (!isSupportedProjectFileExtension(v24)) continue;
    try {
      return assertJsonProjectPath(v24, { mustExist: mustExist });
    } catch {}
  }
  return "";
}
export function readProjectJson(v25) {
  const v26 = assertJsonProjectPath(v25, { mustExist: true }),
    v27 = JSON["parse"](stripUtf8Bom(readFileSync(v26, "utf8")));
  if (!isPlainObject(v27)) throw new Error("Project JSON must be an object");
  return v27;
}
export function buildProjectFilePayload(v28) {
  if (!isPlainObject(v28)) throw new Error("Project data must be an object");
  if (Array["isArray"](v28["canvases"]))
    return {
      canvases: v28["canvases"],
      activeCanvasId: String(
        v28["activeCanvasId"] || v28["canvases"][0]?.["id"] || "canvas_1",
      ),
    };
  return {
    nodes:
      isPlainObject(v28["nodes"]) || Array["isArray"](v28["nodes"])
        ? v28["nodes"]
        : [],
    edges:
      isPlainObject(v28["edges"]) || Array["isArray"](v28["edges"])
        ? v28["edges"]
        : [],
    viewport: isPlainObject(v28["viewport"]) ? v28["viewport"] : {},
  };
}
export function writeProjectJson(v29, v30) {
  const v31 = assertJsonProjectPath(v29),
    v32 = buildProjectFilePayload(v30);
  mkdirSync(path["dirname"](v31), { recursive: true });
  const v33 = v31 + ".tmp-" + process["pid"] + "-" + Date["now"]();
  return (
    writeFileSync(v33, JSON["stringify"](v32, null, 2) + "\x0a", "utf8"),
    renameSync(v33, v31),
    v32
  );
}
export function buildRecoverySnapshotPayload(
  v34 = {},
  { now: now = Date["now"]() } = {},
) {
  const v35 = isPlainObject(v34?.["data"]) ? v34["data"] : v34?.["multiData"],
    v36 = buildProjectFilePayload(v35 || {}),
    v37 = normalizeTimestamp(
      v34?.["savedAt"],
      normalizeTimestamp(now, Date["now"]()),
    ),
    v38 = String(v34?.["filename"] || "")["trim"]();
  return {
    version: RECOVERY_SNAPSHOT_VERSION,
    savedAt: v37,
    reason: String(v34?.["reason"] || "auto")["trim"]() || "auto",
    projectId:
      String(v34?.["projectId"] || "")["trim"]() || "default_v2_project",
    projectName: sanitizeProjectName(
      v34?.["projectName"] || v34?.["projectId"] || "未命名画布",
    ),
    filename: v38 ? path["basename"](v38) : "",
    recentId: String(v34?.["recentId"] || "")["trim"](),
    displayPath: String(v34?.["displayPath"] || "")["trim"](),
    lastKnownProjectLastModified: normalizeTimestamp(
      v34?.["lastKnownProjectLastModified"] ?? v34?.["lastModified"],
      0,
    ),
    data: v36,
  };
}
export function writeRecoverySnapshot(v39, v40, v41 = {}) {
  const v42 = String(v39 || "")["trim"]();
  if (!v42) throw new Error("Recovery path is required");
  const v43 = path["resolve"](v42),
    v44 = buildRecoverySnapshotPayload(v40, v41);
  mkdirSync(path["dirname"](v43), { recursive: true });
  const v45 = v43 + ".tmp-" + process["pid"] + "-" + Date["now"]();
  return (
    writeFileSync(v45, JSON["stringify"](v44, null, 2) + "\x0a", "utf8"),
    renameSync(v45, v43),
    v44
  );
}
export function readRecoverySnapshot(v46) {
  try {
    const v47 = String(v46 || "")["trim"]();
    if (!v47) return null;
    const v48 = path["resolve"](v47),
      v49 = JSON["parse"](stripUtf8Bom(readFileSync(v48, "utf8")));
    if (!isPlainObject(v49)) return null;
    if (Number(v49["version"]) !== RECOVERY_SNAPSHOT_VERSION) return null;
    if (!isPlainObject(v49["data"])) return null;
    const v50 = normalizeTimestamp(v49["savedAt"], 0);
    if (!v50) return null;
    return {
      ...v49,
      savedAt: v50,
      projectId:
        String(v49["projectId"] || "")["trim"]() || "default_v2_project",
      projectName: sanitizeProjectName(
        v49["projectName"] || v49["projectId"] || "未命名画布",
      ),
      filename: String(v49["filename"] || "")["trim"](),
      recentId: String(v49["recentId"] || "")["trim"](),
      displayPath: String(v49["displayPath"] || "")["trim"](),
      lastKnownProjectLastModified: normalizeTimestamp(
        v49["lastKnownProjectLastModified"],
        0,
      ),
    };
  } catch {
    return null;
  }
}
export function removeRecoverySnapshot(v51) {
  try {
    const v52 = String(v51 || "")["trim"]();
    if (!v52) return;
    unlinkSync(path["resolve"](v52));
  } catch (v53) {
    if (v53?.["code"] !== "ENOENT") throw v53;
  }
}
export function getRecoverySnapshotInfo(
  v54,
  { currentLastModified: currentLastModified = 0 } = {},
) {
  const v55 = readRecoverySnapshot(v54);
  if (!v55)
    return {
      exists: false,
      isNewerThanProject: false,
      savedAt: 0,
      currentLastModified: normalizeTimestamp(currentLastModified, 0),
    };
  const v56 = normalizeTimestamp(
    currentLastModified,
    v55["lastKnownProjectLastModified"],
  );
  return {
    exists: true,
    isNewerThanProject: v55["savedAt"] > v56,
    savedAt: v55["savedAt"],
    currentLastModified: v56,
    projectId: v55["projectId"],
    projectName: v55["projectName"],
    filename: v55["filename"],
    recentId: v55["recentId"],
    displayPath: v55["displayPath"],
    lastKnownProjectLastModified: v55["lastKnownProjectLastModified"],
  };
}
export function buildDefaultProjectPath(v57, v58) {
  const v59 = path["resolve"](String(v57 || ""));
  return path["join"](v59, sanitizeProjectFilename(v58));
}
export function getProjectRecentId(v60) {
  const v61 = normalizeComparablePath(v60);
  return createHash("sha256")["update"](v61)["digest"]("hex")["slice"](0, 24);
}
export function readRecentProjects(v62) {
  try {
    const v63 = readFileSync(v62, "utf8"),
      v64 = JSON["parse"](stripUtf8Bom(v63));
    return Array["isArray"](v64?.["items"]) ? v64["items"] : [];
  } catch {
    return [];
  }
}
export function writeRecentProjects(v65, v66) {
  const v67 = {
    version: PROJECT_RECENTS_VERSION,
    updatedAt: Date["now"](),
    items: Array["isArray"](v66) ? v66["slice"](0, PROJECT_RECENTS_LIMIT) : [],
  };
  return (
    mkdirSync(path["dirname"](v65), { recursive: true }),
    writeFileSync(v65, JSON["stringify"](v67, null, 2) + "\x0a", "utf8"),
    v67["items"]
  );
}
export function buildRecentProjectItem(
  v68,
  { name: name = "", now: now = Date["now"]() } = {},
) {
  const v69 = assertJsonProjectPath(v68),
    v70 = existsSync(v69),
    v71 = v70 ? statSync(v69) : null,
    v72 = path["basename"](v69);
  return {
    recentId: getProjectRecentId(v69),
    name: sanitizeProjectName(name || stripProjectFileExtension(v72)),
    filename: v72,
    path: v69,
    displayPath: v69,
    lastModified: v71 ? Math["round"](v71["mtimeMs"]) : 0,
    updatedAt: now,
    exists: v70,
  };
}
export function listRecentProjects(v73) {
  const v74 = readRecentProjects(v73)
    ["filter"]((v75) => v75 && v75["path"])
    ["map"]((v76) => {
      try {
        return {
          ...buildRecentProjectItem(v76["path"], {
            name: v76["name"] || v76["filename"],
            now: Number(v76["updatedAt"] || 0) || Date["now"](),
          }),
          updatedAt: Number(v76["updatedAt"] || 0) || 0,
        };
      } catch {
        return null;
      }
    })
    ["filter"](Boolean);
  return (
    v74["sort"](
      (v77, v78) =>
        Number(v78["updatedAt"] || v78["lastModified"] || 0) -
        Number(v77["updatedAt"] || v77["lastModified"] || 0),
    ),
    v74
  );
}
export function upsertRecentProject(v79, v80, { name: name = "" } = {}) {
  const v81 = buildRecentProjectItem(v80, { name: name, now: Date["now"]() }),
    v82 = readRecentProjects(v79)["filter"](
      (v83) => v83?.["recentId"] !== v81["recentId"],
    );
  return (v82["unshift"](v81), writeRecentProjects(v79, v82), v81);
}
export function removeRecentProject(v84, v85) {
  const v86 = String(v85 || "")["trim"]();
  if (!v86) return listRecentProjects(v84);
  const v87 = readRecentProjects(v84)["filter"](
    (v88) => String(v88?.["recentId"] || "") !== v86,
  );
  return (writeRecentProjects(v84, v87), listRecentProjects(v84));
}
export function findRecentProject(v89, v90) {
  const v91 = String(v90 || "")["trim"]();
  if (!v91) return null;
  return (
    listRecentProjects(v89)["find"]((v92) => v92["recentId"] === v91) || null
  );
}

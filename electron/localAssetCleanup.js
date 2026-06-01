import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
const PROJECT_EXTENSIONS = new Set([".aicanvas", ".aicproj", ".json"]),
  IMAGE_EXTENSIONS = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".bmp",
    ".avif",
    ".svg",
  ]),
  VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv"]),
  AUDIO_EXTENSIONS = new Set([
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".ogg",
    ".flac",
    ".opus",
    ".webm",
  ]),
  MEDIA_EXTENSIONS = new Set([
    ...IMAGE_EXTENSIONS,
    ...VIDEO_EXTENSIONS,
    ...AUDIO_EXTENSIONS,
  ]),
  CLEANABLE_PREFIXES = Object["freeze"]([
    "output/",
    "data/uploads/",
    "data/assets/",
    "data/workflows/thumbs/",
  ]),
  ROOT_DEFINITIONS = Object["freeze"]([
    { key: "output", rootKey: "outputRoot", virtualPrefix: "output/" },
    { key: "uploads", rootKey: "uploadsRoot", virtualPrefix: "data/uploads/" },
    { key: "assets", rootKey: "assetsRoot", virtualPrefix: "data/assets/" },
    {
      key: "workflowThumbs",
      rootKey: "workflowThumbsRoot",
      virtualPrefix: "data/workflows/thumbs/",
    },
  ]);
function isPlainObject(v0) {
  return !!v0 && typeof v0 === "object" && !Array["isArray"](v0);
}
function trimText(v1) {
  return String(v1 || "")["trim"]();
}
function decodePathPart(v2) {
  try {
    return decodeURIComponent(v2);
  } catch {
    return v2;
  }
}
function normalizeComparablePath(v3, v4 = process["platform"]) {
  const v5 = path["resolve"](String(v3 || ""));
  return v4 === "win32" || v4 === "darwin" ? v5["toLowerCase"]() : v5;
}
export function isPathInside(v6, v7, v8 = process["platform"]) {
  try {
    const v9 = normalizeComparablePath(v6, v8),
      v10 = normalizeComparablePath(v7, v8);
    return v9 === v10 || v9["startsWith"]("" + v10 + path["sep"]);
  } catch {
    return false;
  }
}
export function normalizeVirtualLocalPath(v11) {
  let v12 = trimText(v11);
  if (!v12) return "";
  if (/^(?:file|javascript|data|blob):/i["test"](v12)) return "";
  if (/^https?:\/\//i["test"](v12))
    try {
      v12 = new URL(v12)["pathname"] || "";
    } catch {
      return "";
    }
  else {
    if (/^[a-z][a-z0-9+.-]*:/i["test"](v12) && !v12["startsWith"]("/"))
      return "";
  }
  const v13 = v12["split"](/[?#]/, 1)[0],
    v14 = decodePathPart(v13)["replace"](/\\/g, "/")["replace"](/^\/+/, "");
  if (/^[a-zA-Z]:\//["test"](v14) || v14["startsWith"]("//")) return "";
  if (v14["split"]("/")["some"]((v15) => v15 === "..")) return "";
  const v16 = path["posix"]["normalize"](v14);
  if (!v16 || v16 === "." || v16 === ".." || v16["startsWith"]("../"))
    return "";
  return CLEANABLE_PREFIXES["some"]((v17) => v16["startsWith"](v17)) ? v16 : "";
}
export function collectReferencedLocalPaths(
  v18,
  v19 = new Set(),
  v20 = new Set(),
) {
  if (v18 == null) return v19;
  if (typeof v18 === "string") {
    const v21 = normalizeVirtualLocalPath(v18);
    if (v21) v19["add"](v21);
    return v19;
  }
  if (typeof v18 !== "object") return v19;
  if (v20["has"](v18)) return v19;
  v20["add"](v18);
  if (Array["isArray"](v18)) {
    for (const v22 of v18) collectReferencedLocalPaths(v22, v19, v20);
    return v19;
  }
  for (const v23 of Object["values"](v18)) {
    collectReferencedLocalPaths(v23, v19, v20);
  }
  return v19;
}
function stripUtf8Bom(v24) {
  return String(v24 || "")["replace"](/^\uFEFF/, "");
}
function readJsonIfPossible(v25, v26, v27) {
  try {
    return JSON["parse"](stripUtf8Bom(readFileSync(v25, "utf8")));
  } catch (v28) {
    return (
      v26?.["push"]({
        type: "json-read-failed",
        source: v27 || v25,
        message: String(v28?.["message"] || v28),
      }),
      null
    );
  }
}
function listFilesRecursive(v29, v30, v31 = {}) {
  const v32 = trimText(v29);
  if (!v32 || !existsSync(v32)) return [];
  const v33 = [],
    v34 = [path["resolve"](v32)],
    v35 = path["resolve"](v32);
  while (v34["length"] > 0) {
    const v36 = v34["pop"]();
    let v37 = [];
    try {
      v37 = readdirSync(v36, { withFileTypes: true });
    } catch (v38) {
      v30?.["push"]({
        type: "directory-read-failed",
        source: v36,
        message: String(v38?.["message"] || v38),
      });
      continue;
    }
    for (const v39 of v37) {
      const v40 = path["join"](v36, v39["name"]);
      if (!isPathInside(v40, v35)) continue;
      if (v39["isSymbolicLink"]()) continue;
      if (v39["isDirectory"]()) {
        v34["push"](v40);
        continue;
      }
      if (!v39["isFile"]()) continue;
      if (typeof v31["filter"] === "function" && !v31["filter"](v40)) continue;
      v33["push"](v40);
    }
  }
  return v33;
}
function isSupportedProjectFile(v41) {
  return PROJECT_EXTENSIONS["has"](
    path["extname"](String(v41 || ""))["toLowerCase"](),
  );
}
function readRecentProjectPaths(v42, v43) {
  if (!v42 || !existsSync(v42)) return [];
  const v44 = readJsonIfPossible(v42, v43, "recent-projects"),
    v45 = Array["isArray"](v44?.["items"]) ? v44["items"] : [];
  return v45["map"]((v46) => trimText(v46?.["path"] || v46?.["displayPath"]))[
    "filter"
  ]((v47) => v47 && path["isAbsolute"](v47) && isSupportedProjectFile(v47));
}
function addJsonReferencesFromFiles(v48, v49, v50, v51) {
  const v52 = new Set();
  for (const v53 of v48) {
    const v54 = path["resolve"](v53),
      v55 = normalizeComparablePath(v54);
    if (v52["has"](v55) || !existsSync(v54)) continue;
    v52["add"](v55);
    const v56 = readJsonIfPossible(v54, v50, v51 || v54);
    if (v56 != null) collectReferencedLocalPaths(v56, v49);
  }
}
function listJsonFiles(v57, v58) {
  return listFilesRecursive(v57, v58, {
    filter: (v59) => path["extname"](v59)["toLowerCase"]() === ".json",
  });
}
function listProjectFiles(v60, v61) {
  return listFilesRecursive(v60, v61, { filter: isSupportedProjectFile });
}
function getWorkflowThumbRoot(v62) {
  const v63 = trimText(v62);
  return v63 ? path["join"](v63, "thumbs") : "";
}
export function buildLocalAssetCleanupRoots({
  fileSavePaths: fileSavePaths = {},
  defaults: defaults = {},
} = {}) {
  const v64 = isPlainObject(fileSavePaths) ? fileSavePaths : {},
    v65 = (v66) => {
      const v67 = trimText(v66);
      return v67 ? path["resolve"](v67) : "";
    },
    v68 = v65(trimText(v64["dataDir"]) || trimText(defaults["dataDir"])),
    v69 = v68
      ? path["join"](v68, "uploads")
      : v65(trimText(v64["tempDir"]) || trimText(defaults["uploadsDir"]));
  return {
    canvasRoot: v65(
      trimText(v64["canvasDir"]) || trimText(defaults["canvasDir"]),
    ),
    outputRoot: v65(
      trimText(v64["outputDir"]) || trimText(defaults["outputDir"]),
    ),
    uploadsRoot: v69,
    assetsRoot: v68 ? path["join"](v68, "assets") : v65(defaults["assetsDir"]),
    workflowsRoot: v68
      ? path["join"](v68, "workflows")
      : v65(defaults["workflowsDir"]),
    workflowThumbsRoot: v65(
      trimText(defaults["workflowThumbsDir"]) ||
        getWorkflowThumbRoot(defaults["workflowsDir"]),
    ),
    recentProjectsStorePath: v65(defaults["recentProjectsStorePath"]),
    recoverySnapshotPath: v65(defaults["recoverySnapshotPath"]),
  };
}
function rootsSignature(v70) {
  return [
    v70["canvasRoot"],
    v70["outputRoot"],
    v70["uploadsRoot"],
    v70["assetsRoot"],
    v70["workflowsRoot"],
    v70["workflowThumbsRoot"],
    v70["recentProjectsStorePath"],
    v70["recoverySnapshotPath"],
  ]
    ["map"]((v71) => normalizeComparablePath(v71 || ""))
    ["join"]("|");
}
function publicRoots() {
  return {
    output: "output/",
    uploads: "data/uploads/",
    assets: "data/assets/",
    workflowThumbs: "data/workflows/thumbs/",
  };
}
function buildRootConfigs(v72) {
  return ROOT_DEFINITIONS["map"]((v73) => ({
    ...v73,
    absRoot: trimText(v72?.[v73["rootKey"]]),
  }))["filter"]((v74) => v74["absRoot"]);
}
export function resolveVirtualPathToAbsolute(v75, v76) {
  const v77 = normalizeVirtualLocalPath(v75);
  if (!v77) return "";
  for (const v78 of buildRootConfigs(v76)) {
    if (!v77["startsWith"](v78["virtualPrefix"])) continue;
    const v79 = v77["slice"](v78["virtualPrefix"]["length"]),
      v80 = path["resolve"](
        v78["absRoot"],
        ...v79["split"]("/")["filter"](Boolean),
      );
    return isPathInside(v80, v78["absRoot"]) ? v80 : "";
  }
  return "";
}
function toVirtualPath(v81, v82) {
  const v83 = path["relative"](v82["absRoot"], v81);
  if (!v83 || v83["startsWith"]("..") || path["isAbsolute"](v83)) return "";
  return "" + v82["virtualPrefix"] + v83["replace"](/\\/g, "/");
}
function isCleanableJsonCandidate(v84) {
  return /\.waveform\.json$/i["test"](path["basename"](v84));
}
function isCleanableCandidate(v85, v86) {
  const v87 = path["basename"](v85),
    v88 = path["extname"](v87)["toLowerCase"]();
  if (v87 === "assets.index.json") return false;
  if (v88 === ".json") return isCleanableJsonCandidate(v85);
  if (!MEDIA_EXTENSIONS["has"](v88)) return false;
  if (v86 === "workflowThumbs") return IMAGE_EXTENSIONS["has"](v88);
  return true;
}
function classifyCandidateKind(v89) {
  if (isCleanableJsonCandidate(v89)) return "waveform";
  const v90 = path["extname"](v89)["toLowerCase"]();
  if (IMAGE_EXTENSIONS["has"](v90)) return "image";
  if (VIDEO_EXTENSIONS["has"](v90)) return "video";
  if (AUDIO_EXTENSIONS["has"](v90)) return "audio";
  return "media";
}
function collectCandidateFiles(v91, v92) {
  const v93 = [],
    v94 = new Set();
  for (const v95 of buildRootConfigs(v91)) {
    const v96 = listFilesRecursive(v95["absRoot"], v92, {
      filter: (v97) => isCleanableCandidate(v97, v95["key"]),
    });
    for (const v98 of v96) {
      const v99 = path["resolve"](v98),
        v100 = normalizeComparablePath(v99);
      if (v94["has"](v100)) continue;
      v94["add"](v100);
      const v101 = toVirtualPath(v99, v95);
      if (!v101) continue;
      let v102 = null;
      try {
        v102 = statSync(v99);
      } catch {
        continue;
      }
      if (!v102?.["isFile"]?.()) continue;
      v93["push"]({
        absPath: v99,
        localPath: v101,
        size: Number(v102["size"] || 0),
        kind: classifyCandidateKind(v99),
        modifiedAt: Math["round"](Number(v102["mtimeMs"] || 0)),
        sourceRoot: v95["key"],
      });
    }
  }
  return v93;
}
function collectAllReferences({
  roots: v103,
  currentProjectSnapshot: v104,
  warnings: v105,
}) {
  const v106 = new Set();
  collectReferencedLocalPaths(v104, v106);
  const v107 = listProjectFiles(v103["canvasRoot"], v105);
  addJsonReferencesFromFiles(v107, v106, v105, "project");
  const v108 = readRecentProjectPaths(v103["recentProjectsStorePath"], v105);
  return (
    addJsonReferencesFromFiles(v108, v106, v105, "recent-project"),
    existsSync(v103["recoverySnapshotPath"]) &&
      addJsonReferencesFromFiles(
        [v103["recoverySnapshotPath"]],
        v106,
        v105,
        "recovery-snapshot",
      ),
    addJsonReferencesFromFiles(
      listJsonFiles(v103["assetsRoot"], v105),
      v106,
      v105,
      "assets",
    ),
    addJsonReferencesFromFiles(
      listJsonFiles(v103["workflowsRoot"], v105),
      v106,
      v105,
      "workflows",
    ),
    v106
  );
}
function createScanId(v109 = Date["now"]()) {
  return (
    "asset-cleanup-" +
    v109 +
    "-" +
    Math["random"]()["toString"](36)["slice"](2, 10)
  );
}
function runScan({
  roots: v110,
  currentProjectSnapshot: v111,
  scanId: scanId = createScanId(),
  scannedAt: scannedAt = Date["now"](),
  scope: scope = "current",
}) {
  const v112 = [],
    v113 = collectAllReferences({
      roots: v110,
      currentProjectSnapshot: v111,
      warnings: v112,
    }),
    v114 = collectCandidateFiles(v110, v112),
    v115 = v114["filter"]((v116) => !v113["has"](v116["localPath"]))
      ["map"](({ absPath: v117, ...v118 }) => v118)
      ["sort"](
        (v119, v120) =>
          Number(v120["size"] || 0) - Number(v119["size"] || 0) ||
          v119["localPath"]["localeCompare"](v120["localPath"]),
      ),
    v121 = v115["reduce"]((v122, v123) => v122 + Number(v123["size"] || 0), 0);
  return {
    ok: true,
    scanId: scanId,
    scope: scope,
    scannedAt: scannedAt,
    roots: publicRoots(),
    candidateCount: v114["length"],
    orphanCount: v115["length"],
    orphanBytes: v121,
    items: v115,
    warnings: v112,
    _private: {
      roots: v110,
      rootsSignature: rootsSignature(v110),
      currentProjectSnapshot: v111,
      references: v113,
    },
  };
}
function publicScanResult(v124) {
  const { _private: v125, ...v126 } = v124;
  return v126;
}
function cloneJsonLike(v127) {
  if (v127 == null) return v127;
  if (typeof structuredClone === "function")
    try {
      return structuredClone(v127);
    } catch {}
  try {
    return JSON["parse"](JSON["stringify"](v127));
  } catch {
    return null;
  }
}
export function createLocalAssetCleanupManager({
  getRoots: v128,
  trashItem: v129,
  now: now = () => Date["now"](),
} = {}) {
  const v130 = new Map();
  async function v131(v132 = {}) {
    if (typeof v128 !== "function") throw new Error("缺少清理目录配置");
    const v133 = await v128(v132);
    return v133 && typeof v133 === "object" ? v133 : {};
  }
  return {
    async scan(v134 = {}) {
      const v135 = await v131(v134 || {}),
        v136 = runScan({
          roots: v135,
          currentProjectSnapshot: cloneJsonLike(
            v134?.["currentProjectSnapshot"],
          ),
          scanId: createScanId(now()),
          scannedAt: now(),
          scope: trimText(v134?.["scope"]) || "current",
        });
      v130["set"](v136["scanId"], v136);
      if (v130["size"] > 6) {
        const v137 = v130["keys"]()["next"]()["value"];
        if (v137) v130["delete"](v137);
      }
      return publicScanResult(v136);
    },
    async trash(v138 = {}) {
      if (typeof v129 !== "function")
        throw new Error("当前环境不支持移到回收站");
      const v139 = trimText(v138?.["scanId"]),
        v140 = v130["get"](v139);
      if (!v140) throw new Error("扫描结果已过期，请重新扫描");
      const v141 = await v131(v138 || {});
      if (rootsSignature(v141) !== v140["_private"]["rootsSignature"]) {
        v130["delete"](v139);
        throw new Error("文件保存路径已变化，请重新扫描");
      }
      const v142 = Array["isArray"](v138?.["localPaths"])
          ? v138["localPaths"]
              ["map"](normalizeVirtualLocalPath)
              ["filter"](Boolean)
          : [],
        v143 = new Set(v142);
      if (v143["size"] === 0)
        return {
          ok: true,
          trashedCount: 0,
          trashedBytes: 0,
          skipped: [],
          errors: [],
        };
      const v144 = runScan({
          roots: v140["_private"]["roots"],
          currentProjectSnapshot: cloneJsonLike(
            v138?.["currentProjectSnapshot"] ||
              v140["_private"]["currentProjectSnapshot"],
          ),
          scanId: v139,
          scannedAt: now(),
          scope: v140["scope"] || "current",
        }),
        v145 = new Map(
          v144["items"]["map"]((v146) => [v146["localPath"], v146]),
        ),
        v147 = [],
        v148 = [];
      let v149 = 0,
        v150 = 0;
      for (const v151 of v143) {
        const v152 = v145["get"](v151);
        if (!v152) {
          v147["push"]({ localPath: v151, reason: "referenced-or-missing" });
          continue;
        }
        const v153 = resolveVirtualPathToAbsolute(
          v151,
          v140["_private"]["roots"],
        );
        if (!v153 || !existsSync(v153)) {
          v147["push"]({ localPath: v151, reason: "missing" });
          continue;
        }
        try {
          (await v129(v153), (v149 += 1), (v150 += Number(v152["size"] || 0)));
        } catch (v154) {
          v148["push"]({
            localPath: v151,
            message: String(v154?.["message"] || v154),
          });
        }
      }
      return (
        v130["delete"](v139),
        {
          ok: v148["length"] === 0,
          trashedCount: v149,
          trashedBytes: v150,
          skipped: v147,
          errors: v148,
        }
      );
    },
    _scanForTests(v155 = {}) {
      return runScan(v155);
    },
  };
}
export const localAssetCleanupInternals = {
  CLEANABLE_PREFIXES: CLEANABLE_PREFIXES,
  isCleanableCandidate: isCleanableCandidate,
  collectCandidateFiles: collectCandidateFiles,
  collectAllReferences: collectAllReferences,
  rootsSignature: rootsSignature,
};

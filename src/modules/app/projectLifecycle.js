import { sanitizeSerializedCanvasData } from "../../utils/thumbnailPersistence.js";
import { buildImageNodeStorageFields } from "../../services/imageDerivativeService.js";
import { buildCanvasLocalImageFields } from "../../services/canvasMediaLocalService.js";
import { createStableSignature } from "../../utils/stableSignature.js";
import {
  normalizeLocalPath,
  pickResultLocalPath,
} from "../../utils/localMediaPath.js";
import {
  isModelApiModel,
  isWorkflowModel as isWorkflowModel,
  resolveModelProvider,
} from "../../manifests/index.js";
export { createStableSignature } from "../../utils/stableSignature.js";
const BOOT_PERF_MEASURE_NAMES = [
    "project.loadProject",
    "buildHydrationSafeMultiData",
    "hydrateTrustedSnapshot",
    "CanvasTabManager.init",
    "loader hidden",
    "historicalAiLocalization queued",
  ],
  WORKSPACE_META_KEY = "workspace_meta",
  LEGACY_WORKSPACE_KEY = "current_state",
  WORKSPACE_CANVAS_KEY_PREFIX = "workspace_canvas::",
  DREAMINA_RESUME_BACKUP_KEY = "tapnow_v2_dreamina_resume_backup",
  PAGE_LIFECYCLE_FLUSH_DEDUPE_MS = 2000,
  RECOVERY_SNAPSHOT_DEDUPE_MS = 5000,
  DREAMINA_RESUME_BACKUP_FIELDS = [
    "canvasId",
    "nodeId",
    "generationStartTime",
    "generationDuration",
    "dreaminaSubmitId",
    "dreaminaTaskStatus",
    "dreaminaTaskPhase",
    "dreaminaTaskLabel",
    "dreaminaTaskStartedAt",
    "dreaminaTaskLastCheckedAt",
    "dreaminaTaskRecovering",
  ];
function buildWorkspaceCanvasKey(v0) {
  return "" + WORKSPACE_CANVAS_KEY_PREFIX + String(v0 || "")["trim"]();
}
function inferAsyncProviderByModel(v1, v2 = "") {
  const v3 = resolveModelProvider(v1, "", { allowProviderHint: false });
  if (v3) return v3;
  const v4 = String(v2 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v4) return v4;
  const v5 = String(v1 || "")["trim"]();
  if (v5 && !v5["includes"]("/")) return "grsai";
  return "grsai";
}
function isDreaminaResumeCandidateNode(v6) {
  if (!v6 || typeof v6 !== "object") return false;
  const v7 = String(v6["type"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!["ai-video", "ai-image", "source-image", "source-video"]["includes"](v7))
    return false;
  const v8 = String(v6["provider"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v9 = String(v6["model"] || "")["trim"](),
    v10 = v8 === "dreamina" || resolveModelProvider(v9, v8) === "dreamina";
  if (!v10) return false;
  if (hasDreaminaResultError(v6)) return false;
  const v11 = String(v6["jobStatus"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v11 === "error" || v11 === "failed") return false;
  if (String(v6["jobError"] || "")["trim"]()) return false;
  const v12 = String(v6["dreaminaSubmitId"] || "")["trim"]();
  if (!v12) return false;
  const v13 = String(v6["dreaminaTaskPhase"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v14 = String(v6["dreaminaTaskStatus"] || "")
      ["trim"]()
      ["toLowerCase"]();
  if (v13 === "done" || v13 === "failed") return false;
  if (v14 === "failed") return false;
  return true;
}
function hasDreaminaUsableResult(v15) {
  const v16 = [v15?.["images"], v15?.["videos"]]["filter"](Array["isArray"]);
  return v16["some"]((v17) =>
    v17["some"]((v18) => {
      if (!v18 || typeof v18 !== "object") return false;
      return !!String(
        v18["localPath"] ||
          v18["originalLocalPath"] ||
          v18["displayLocalPath"] ||
          v18["thumbLocalPath"] ||
          v18["imageUrl"] ||
          v18["videoUrl"] ||
          v18["thumbUrl"] ||
          v18["sourceUrl"] ||
          "",
      )["trim"]();
    }),
  );
}
function hasDreaminaResultError(v19) {
  const v20 = [v19?.["images"], v19?.["videos"]]["filter"](Array["isArray"]);
  if (v20["length"] === 0) return false;
  if (hasDreaminaUsableResult(v19)) return false;
  return v20["some"]((v21) =>
    v21["some"](
      (v22) =>
        v22 &&
        typeof v22 === "object" &&
        String(v22["error"] || v22["message"] || "")["trim"](),
    ),
  );
}
function isAsyncResumeCandidateNode(v23) {
  if (!v23 || typeof v23 !== "object") return false;
  const v24 = String(v23["type"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    !["ai-video", "ai-image", "source-video", "source-image"]["includes"](v24)
  )
    return false;
  const v25 = String(v23["asyncTaskId"] || "")["trim"]();
  if (!v25) return false;
  const v26 = inferAsyncProviderByModel(
    v23["model"],
    v23["asyncTaskProvider"] || v23["provider"] || "",
  );
  if (
    !v26 ||
    v26 === "runninghubwf" ||
    v26 === "runninghub" ||
    v26 === "dreamina"
  )
    return false;
  const v27 = String(v23["asyncTaskKind"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v27 === "image" && !["ai-image", "source-image"]["includes"](v24))
    return false;
  if (v27 === "video" && !["ai-video", "source-video"]["includes"](v24))
    return false;
  const v28 = String(v23["asyncTaskStatus"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    v28 === "success" ||
    v28 === "failed" ||
    v28 === "idle" ||
    v28 === "cancelled"
  )
    return false;
  return true;
}
function isRunningHubResumeCandidateNode(v29) {
  if (!v29 || typeof v29 !== "object") return false;
  const v30 = String(v29["type"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    ![
      "ai-video",
      "ai-image",
      "ai-audio",
      "source-video",
      "source-image",
      "source-audio",
    ]["includes"](v30)
  )
    return false;
  const v31 = String(v29["provider"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v32 = String(v29["model"] || "")["trim"](),
    v33 = resolveModelProvider(v32, v31, { allowProviderHint: false }),
    v34 = isWorkflowModel(v32, v31 || "runninghubwf"),
    v35 = v33 === "runninghub" && isModelApiModel(v32, "runninghub"),
    v36 = v30 === "ai-audio" && v31 === "runninghubwf",
    v37 = v30 === "source-video" && (v31 === "runninghubwf" || v34),
    v38 =
      v30 === "source-image" &&
      (v31 === "runninghubwf" || v31 === "runninghub" || v34 || v35),
    v39 = v30 === "source-audio" && v31 === "runninghubwf" && v34,
    v40 =
      v38 ||
      v39 ||
      v37 ||
      v36 ||
      v34 ||
      v35 ||
      v31 === "runninghub" ||
      v31 === "runninghubwf";
  if (!v40) return false;
  const v41 = String(v29["rhTaskId"] || "")["trim"]();
  if (!v41) return false;
  const v42 = String(v29["rhTaskStatus"] || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    v42 === "success" ||
    v42 === "failed" ||
    v42 === "idle" ||
    v42 === "cancelled"
  )
    return false;
  return true;
}
function buildDreaminaResumeBackupPayload({
  projectId: v43,
  projectName: v44,
  multiData: v45,
}) {
  const v46 = Array["isArray"](v45?.["canvases"]) ? v45["canvases"] : [],
    v47 = [];
  return (
    v46["forEach"]((v48) => {
      const v49 = String(v48?.["id"] || "")["trim"]();
      if (!v49) return;
      const v50 = Array["isArray"](v48?.["nodes"]) ? v48["nodes"] : [];
      v50["forEach"]((v51) => {
        const v52 = {
          canvasId: v49,
          nodeId: String(v51["id"] || "")["trim"](),
          generationStartTime: Number(v51["generationStartTime"] || 0),
          generationDuration:
            v51["generationDuration"] == null
              ? null
              : Number(v51["generationDuration"] || 0),
        };
        if (isDreaminaResumeCandidateNode(v51)) {
          const v53 = {
            ...v52,
            kind: "dreamina",
            dreaminaSubmitId: String(v51["dreaminaSubmitId"] || "")["trim"](),
            dreaminaTaskStatus: String(v51["dreaminaTaskStatus"] || "")[
              "trim"
            ](),
            dreaminaTaskPhase: String(v51["dreaminaTaskPhase"] || "")["trim"](),
            dreaminaTaskLabel: String(v51["dreaminaTaskLabel"] || "")["trim"](),
            dreaminaTaskStartedAt: Number(v51["dreaminaTaskStartedAt"] || 0),
            dreaminaTaskLastCheckedAt: Number(
              v51["dreaminaTaskLastCheckedAt"] || 0,
            ),
            dreaminaTaskRecovering: !!v51["dreaminaTaskRecovering"],
          };
          v47["push"](v53);
          return;
        }
        if (isAsyncResumeCandidateNode(v51)) {
          v47["push"]({
            ...v52,
            kind: "async",
            nodeType: String(v51["type"] || "")
              ["trim"]()
              ["toLowerCase"](),
            asyncTaskProvider: inferAsyncProviderByModel(
              v51["model"],
              v51["asyncTaskProvider"] || v51["provider"] || "",
            ),
            asyncTaskKind:
              String(v51["asyncTaskKind"] || "")["trim"]() || "image",
            asyncTaskId: String(v51["asyncTaskId"] || "")["trim"](),
            asyncTaskStatus: String(v51["asyncTaskStatus"] || "")["trim"](),
            asyncTaskStartedAt: Number(v51["asyncTaskStartedAt"] || 0),
            asyncTaskRecovering: !!v51["asyncTaskRecovering"],
          });
          return;
        }
        if (!isRunningHubResumeCandidateNode(v51)) return;
        v47["push"]({
          ...v52,
          kind: "runninghub",
          nodeType: String(v51["type"] || "")
            ["trim"]()
            ["toLowerCase"](),
          rhTaskId: String(v51["rhTaskId"] || "")["trim"](),
          rhTaskStatus: String(v51["rhTaskStatus"] || "")["trim"](),
          rhTaskStartedAt: Number(v51["rhTaskStartedAt"] || 0),
          rhTaskRecovering: !!v51["rhTaskRecovering"],
          rhTaskUseOpenapiQuery: v51["rhTaskUseOpenapiQuery"] === true,
        });
      });
    }),
    {
      projectId: v43 || "default_v2_project",
      projectName: v44 || "未命名项目",
      timestamp: Date["now"](),
      items: v47,
    }
  );
}
function writeDreaminaResumeBackupSync(v54) {
  try {
    const v55 = buildDreaminaResumeBackupPayload(v54);
    if (!Array["isArray"](v55["items"]) || v55["items"]["length"] === 0) {
      window["localStorage"]?.["removeItem"](DREAMINA_RESUME_BACKUP_KEY);
      return;
    }
    window["localStorage"]?.["setItem"](
      DREAMINA_RESUME_BACKUP_KEY,
      JSON["stringify"](v55),
    );
  } catch (v56) {
    console["warn"]("[projectLifecycle] 写入即梦恢复兜底失败:", v56);
  }
}
function readDreaminaResumeBackupSync() {
  try {
    const v57 = window["localStorage"]?.["getItem"](DREAMINA_RESUME_BACKUP_KEY);
    if (!v57) return null;
    const v58 = JSON["parse"](v57);
    if (!v58 || typeof v58 !== "object") return null;
    if (!Array["isArray"](v58["items"]) || v58["items"]["length"] === 0)
      return null;
    return v58;
  } catch (v59) {
    return (
      console["warn"]("[projectLifecycle] 读取即梦恢复兜底失败:", v59),
      null
    );
  }
}
function mergeDreaminaResumeBackupIntoMultiData(v60, v61, v62) {
  if (!v61 || typeof v61 !== "object") return v60;
  if (String(v61["projectId"] || "") !== String(v62 || "")) return v60;
  const v63 = Array["isArray"](v61["items"]) ? v61["items"] : [];
  if (v63["length"] === 0) return v60;
  const v64 = {
      ...(v60 || {}),
      canvases: Array["isArray"](v60?.["canvases"])
        ? v60["canvases"]["map"]((v65) => ({
            ...v65,
            nodes: Array["isArray"](v65?.["nodes"])
              ? v65["nodes"]["map"]((v66) => ({ ...v66 }))
              : [],
          }))
        : [],
    },
    v67 = new Map();
  return (
    v63["forEach"]((v68) => {
      const v69 = String(v68?.["canvasId"] || "")["trim"](),
        v70 = String(v68?.["nodeId"] || "")["trim"]();
      if (!v69 || !v70) return;
      v67["set"](v69 + "::" + v70, v68);
    }),
    v64["canvases"]["forEach"]((v71) => {
      const v72 = String(v71?.["id"] || "")["trim"]();
      if (!v72 || !Array["isArray"](v71["nodes"])) return;
      v71["nodes"] = v71["nodes"]["map"]((v73) => {
        const v74 = String(v73?.["id"] || "")["trim"](),
          v75 = v67["get"](v72 + "::" + v74);
        if (!v75) return v73;
        if (
          String(v75?.["kind"] || "")
            ["trim"]()
            ["toLowerCase"]() === "dreamina"
        ) {
          if (hasDreaminaResultError(v73)) return v73;
          const v76 = String(v73?.["jobStatus"] || "")
            ["trim"]()
            ["toLowerCase"]();
          if (v76 === "error" || v76 === "failed") return v73;
          const v77 = {};
          for (const v78 of DREAMINA_RESUME_BACKUP_FIELDS) {
            Object["hasOwn"](v75, v78) && (v77[v78] = v75[v78]);
          }
          const v79 =
            Object["hasOwn"](v75, "dreaminaTaskLastRaw") &&
            v75["dreaminaTaskLastRaw"] &&
            typeof v75["dreaminaTaskLastRaw"] === "object" &&
            !Array["isArray"](v75["dreaminaTaskLastRaw"])
              ? v75["dreaminaTaskLastRaw"]
              : null;
          return {
            ...v73,
            generationStartTime:
              Number(v77["generationStartTime"]) > 0
                ? Number(v77["generationStartTime"])
                : Number(v73?.["generationStartTime"] || 0),
            generationDuration: null,
            dreaminaSubmitId: String(v77["dreaminaSubmitId"] || "")["trim"](),
            dreaminaTaskStatus: String(v77["dreaminaTaskStatus"] || "")[
              "trim"
            ](),
            dreaminaTaskPhase: String(v77["dreaminaTaskPhase"] || "")["trim"](),
            dreaminaTaskLabel: String(v77["dreaminaTaskLabel"] || "")["trim"](),
            dreaminaTaskStartedAt: Number(v77["dreaminaTaskStartedAt"] || 0),
            dreaminaTaskLastCheckedAt: Number(
              v77["dreaminaTaskLastCheckedAt"] || 0,
            ),
            dreaminaTaskRecovering: true,
            dreaminaTaskLastRaw: v79 || {},
          };
        }
        if (
          String(v75?.["kind"] || "")
            ["trim"]()
            ["toLowerCase"]() !== "runninghub"
        ) {
          if (
            String(v75?.["kind"] || "")
              ["trim"]()
              ["toLowerCase"]() !== "async"
          )
            return v73;
          const v80 = String(v75?.["nodeType"] || "")
              ["trim"]()
              ["toLowerCase"](),
            v81 = String(v73?.["type"] || "")
              ["trim"]()
              ["toLowerCase"]();
          if (v80 && v81 && v80 !== v81) return v73;
          const v82 = inferAsyncProviderByModel(
            v73?.["model"],
            v75["asyncTaskProvider"] ||
              v73?.["asyncTaskProvider"] ||
              v73?.["provider"] ||
              "",
          );
          return {
            ...v73,
            generationStartTime:
              Number(v75["generationStartTime"]) > 0
                ? Number(v75["generationStartTime"])
                : Number(v73?.["generationStartTime"] || 0),
            generationDuration: null,
            asyncTaskProvider: v82,
            asyncTaskKind:
              String(v75["asyncTaskKind"] || "")["trim"]() || "image",
            asyncTaskId: String(v75["asyncTaskId"] || "")["trim"](),
            asyncTaskStatus:
              String(v75["asyncTaskStatus"] || "")["trim"]() || "pending",
            asyncTaskStartedAt: Number(v75["asyncTaskStartedAt"] || 0),
            asyncTaskRecovering: true,
          };
        }
        const v83 = String(v75?.["nodeType"] || "")
            ["trim"]()
            ["toLowerCase"](),
          v84 = String(v73?.["type"] || "")
            ["trim"]()
            ["toLowerCase"]();
        if (v83 && v84 && v83 !== v84) return v73;
        return {
          ...v73,
          generationStartTime:
            Number(v75["generationStartTime"]) > 0
              ? Number(v75["generationStartTime"])
              : Number(v73?.["generationStartTime"] || 0),
          generationDuration: null,
          rhTaskId: String(v75["rhTaskId"] || "")["trim"](),
          rhTaskStatus:
            String(v75["rhTaskStatus"] || "")["trim"]() || "pending",
          rhTaskStartedAt: Number(v75["rhTaskStartedAt"] || 0),
          rhTaskRecovering: true,
          rhTaskUseOpenapiQuery: v75["rhTaskUseOpenapiQuery"] === true,
        };
      });
    }),
    v64
  );
}
function buildCanvasRecordSignature(v85, v86 = v85?.["_persistRevHint"]) {
  const v87 = Number["isFinite"](v86);
  if (v87) {
    const v88 =
      v85?.["viewport"] && typeof v85["viewport"] === "object"
        ? v85["viewport"]
        : {};
    return createStableSignature({
      _persistRevHint: v86,
      viewport: {
        x: Number["isFinite"](v88?.["x"]) ? v88["x"] : 0,
        y: Number["isFinite"](v88?.["y"]) ? v88["y"] : 0,
        zoom: Number["isFinite"](v88?.["zoom"]) ? v88["zoom"] : 1.1,
      },
      nodesLength: Array["isArray"](v85?.["nodes"])
        ? v85["nodes"]["length"]
        : 0,
      edgesLength: Array["isArray"](v85?.["edges"])
        ? v85["edges"]["length"]
        : 0,
      assetsLength: Array["isArray"](v85?.["assets"])
        ? v85["assets"]["length"]
        : 0,
    });
  }
  return createStableSignature({
    id: v85?.["id"] ?? null,
    name: v85?.["name"] ?? "未命名画布",
    nodes: Array["isArray"](v85?.["nodes"]) ? v85["nodes"] : [],
    edges: Array["isArray"](v85?.["edges"]) ? v85["edges"] : [],
    viewport:
      v85?.["viewport"] && typeof v85["viewport"] === "object"
        ? v85["viewport"]
        : { x: 0, y: 0, zoom: 1.1 },
    assets: Array["isArray"](v85?.["assets"]) ? v85["assets"] : [],
  });
}
export function buildWorkspaceShardRecords(v89) {
  const v90 = v89?.["projectId"] || "default_v2_project",
    v91 = v89?.["projectName"] || "未命名项目",
    v92 = Array["isArray"](v89?.["multiData"]?.["canvases"])
      ? v89["multiData"]["canvases"]
      : [],
    v93 = v89?.["multiData"]?.["activeCanvasId"] || v92[0]?.["id"] || null,
    v94 = Date["now"](),
    v95 = {
      cacheVersion: 2,
      projectId: v90,
      projectName: v91,
      activeCanvasId: v93,
      canvasOrder: v92["map"]((v96) => ({
        id: v96?.["id"] ?? null,
        name: v96?.["name"] ?? "未命名画布",
      })),
      _timestamp: v94,
    },
    v97 = v92["map"]((v98) => {
      const v99 = {
          id: v98?.["id"] ?? null,
          name: v98?.["name"] ?? "未命名画布",
          _persistRevHint: Number["isFinite"](v98?.["_persistRevHint"])
            ? v98["_persistRevHint"]
            : undefined,
          nodes: Array["isArray"](v98?.["nodes"]) ? v98["nodes"] : [],
          edges: Array["isArray"](v98?.["edges"]) ? v98["edges"] : [],
          viewport:
            v98?.["viewport"] && typeof v98["viewport"] === "object"
              ? v98["viewport"]
              : { x: 0, y: 0, zoom: 1.1 },
          assets: Array["isArray"](v98?.["assets"]) ? v98["assets"] : [],
          _timestamp: v94,
        },
        v100 = sanitizeSerializedCanvasData(v99),
        v101 = Number["isFinite"](v99["_persistRevHint"])
          ? v99["_persistRevHint"]
          : undefined;
      return {
        key: buildWorkspaceCanvasKey(v99["id"]),
        record: v99,
        persistedRecord: v100,
        signature: buildCanvasRecordSignature(v100, v101),
      };
    });
  return {
    metaRecord: v95,
    metaSignature: createStableSignature({
      cacheVersion: v95["cacheVersion"],
      projectId: v95["projectId"],
      projectName: v95["projectName"],
      activeCanvasId: v95["activeCanvasId"],
      canvasOrder: v95["canvasOrder"],
    }),
    canvasRecords: v97,
  };
}
export function restoreWorkspacePayloadFromShardRecords(v102, v103) {
  if (!v102 || !Array["isArray"](v102["canvasOrder"])) return null;
  const v104 = new Map();
  for (const v105 of v103 || []) {
    if (!v105 || !v105["id"]) continue;
    v104["set"](v105["id"], {
      id: v105["id"],
      name: v105["name"] || "未命名画布",
      _persistRevHint: Number["isFinite"](v105?.["_persistRevHint"])
        ? v105["_persistRevHint"]
        : undefined,
      nodes: Array["isArray"](v105["nodes"]) ? v105["nodes"] : [],
      edges: Array["isArray"](v105["edges"]) ? v105["edges"] : [],
      viewport:
        v105["viewport"] && typeof v105["viewport"] === "object"
          ? v105["viewport"]
          : { x: 0, y: 0, zoom: 1.1 },
      assets: Array["isArray"](v105["assets"]) ? v105["assets"] : [],
    });
  }
  const v106 = [];
  for (const v107 of v102["canvasOrder"]) {
    const v108 = v107?.["id"];
    if (!v108) return null;
    const v109 = v104["get"](v108);
    if (!v109) return null;
    v106["push"]({
      ...v109,
      name: v107?.["name"] || v109["name"] || "未命名画布",
    });
  }
  return {
    projectId: v102["projectId"] || "default_v2_project",
    projectName: v102["projectName"] || "未命名项目",
    multiData: {
      canvases: v106,
      activeCanvasId: v102["activeCanvasId"] || v106[0]?.["id"] || null,
    },
  };
}
export function createProjectLifecycle({
  store: v110,
  CanvasTabManager: v111,
  project: v112,
  loadCustomPresets: v113,
  migrateLegacyThumbnailsInMultiData: v114,
  sanitizeMultiCanvasDataForPersistence: v115,
  commit: v116,
  patchStoreSourceNodeNamesFromFileName: v117,
  applySourceNamesFromFileNameToCanvas: v118,
}) {
  let v119 = "",
    v120 = "";
  const v121 = new Map();
  let v122 = new Set(),
    v123 = false,
    v124 = null,
    v125 = false,
    v126 = null,
    v127 = 0,
    v128 = null,
    v129 = null,
    v130 = "",
    v131 = "",
    v132 = 0,
    v133 = false;
  function v134() {
    ((v119 = ""),
      (v120 = ""),
      v121["clear"](),
      (v122 = new Set()),
      (v123 = false));
  }
  function v135(v136) {
    const v137 = {
        projectId: v136?.["projectId"] || "default_v2_project",
        projectName: v136?.["projectName"] || "未命名项目",
        multiData: v136?.["multiData"] || {
          canvases: [],
          activeCanvasId: null,
        },
      },
      { metaSignature: v138, canvasRecords: v139 } =
        buildWorkspaceShardRecords(v137);
    ((v119 = v137["projectId"]),
      (v120 = v138),
      v121["clear"](),
      (v122 = new Set()),
      v139["forEach"](({ record: v140, signature: v141 }) => {
        if (!v140?.["id"]) return;
        (v121["set"](v140["id"], v141), v122["add"](v140["id"]));
      }),
      (v123 = true));
  }
  const v142 = {
    dbName: "TapNowV2Cache",
    storeName: "workspace",
    version: 1,
    _dbPromise: null,
    async initDB() {
      if (this["_dbPromise"]) return this["_dbPromise"];
      return (
        (this["_dbPromise"] = new Promise((v143, v144) => {
          const v145 = indexedDB["open"](this["dbName"], this["version"]);
          ((v145["onupgradeneeded"] = (v146) => {
            const v147 = v146["target"]["result"];
            !v147["objectStoreNames"]["contains"](this["storeName"]) &&
              v147["createObjectStore"](this["storeName"]);
          }),
            (v145["onsuccess"] = (v148) => {
              const v149 = v148["target"]["result"];
              ((v149["onversionchange"] = () => {
                (v149["close"](), (this["_dbPromise"] = null));
              }),
                v143(v149));
            }),
            (v145["onerror"] = (v150) => {
              ((this["_dbPromise"] = null), v144(v150["target"]["error"]));
            }));
        })),
        this["_dbPromise"]
      );
    },
    async getRecord(v151) {
      const v152 = await this["initDB"]();
      return new Promise((v153, v154) => {
        const v155 = v152["transaction"](this["storeName"], "readonly"),
          v156 = v155["objectStore"](this["storeName"]),
          v157 = v156["get"](v151);
        ((v157["onsuccess"] = (v158) => v153(v158["target"]["result"] ?? null)),
          (v157["onerror"] = (v159) => v154(v159["target"]["error"])));
      });
    },
    async getRecords(v160) {
      const v161 = await this["initDB"]();
      return new Promise((v162, v163) => {
        const v164 = v161["transaction"](this["storeName"], "readonly"),
          v165 = v164["objectStore"](this["storeName"]),
          v166 = v160["map"](
            (v167) =>
              new Promise((v168, v169) => {
                const v170 = v165["get"](v167);
                ((v170["onsuccess"] = (v171) =>
                  v168(v171["target"]["result"] ?? null)),
                  (v170["onerror"] = (v172) => v169(v172["target"]["error"])));
              }),
          );
        Promise["all"](v166)["then"](v162)["catch"](v163);
      });
    },
    async listKeys() {
      const v173 = await this["initDB"]();
      return new Promise((v174, v175) => {
        const v176 = v173["transaction"](this["storeName"], "readonly"),
          v177 = v176["objectStore"](this["storeName"]),
          v178 = v177["getAllKeys"]();
        ((v178["onsuccess"] = (v179) => v174(v179["target"]["result"] || [])),
          (v178["onerror"] = (v180) => v175(v180["target"]["error"])));
      });
    },
    async save(v181) {
      try {
        const v182 = {
            projectId: v181?.["projectId"] || "default_v2_project",
            projectName: v181?.["projectName"] || "未命名项目",
            multiData: v181?.["multiData"] || {
              canvases: [],
              activeCanvasId: null,
            },
          },
          {
            metaRecord: v183,
            metaSignature: v184,
            canvasRecords: v185,
          } = buildWorkspaceShardRecords(v182),
          v186 = await this["initDB"](),
          v187 = v185["map"](({ record: v188 }) =>
            String(v188?.["id"] || "")["trim"](),
          )["filter"](Boolean),
          v189 = new Set(v187),
          v190 = new Set(v187["map"]((v191) => buildWorkspaceCanvasKey(v191))),
          v192 = v119 !== v182["projectId"],
          v193 = v192 || !v123 || (v122["size"] === 0 && v185["length"] > 0);
        let v194 = [];
        if (v192) v193 && (await this["listKeys"]());
        else {
          if (v123)
            v194 = Array["from"](v122)
              ["filter"]((v195) => !v189["has"](v195))
              ["map"]((v196) => buildWorkspaceCanvasKey(v196));
          else {
            if (v193) {
              const v197 = await this["listKeys"](),
                v198 = v197["filter"]((v199) =>
                  String(v199)["startsWith"](WORKSPACE_CANVAS_KEY_PREFIX),
                );
              v194 = v198["filter"]((v200) => !v190["has"](v200));
            }
          }
        }
        const v201 = v185["filter"](
            ({ record: v202, signature: v203 }) =>
              v192 || v121["get"](v202["id"]) !== v203,
          ),
          v204 = v192 || v120 !== v184;
        if (!v204 && v201["length"] === 0 && v194["length"] === 0) return;
        return new Promise((v205, v206) => {
          const v207 = v186["transaction"](this["storeName"], "readwrite"),
            v208 = v207["objectStore"](this["storeName"]);
          (v204 && v208["put"](v183, WORKSPACE_META_KEY),
            v201["forEach"](({ key: v209, persistedRecord: v210 }) => {
              v208["put"](v210, v209);
            }),
            v194["forEach"]((v211) => {
              v208["delete"](v211);
            }),
            (v207["oncomplete"] = () => {
              ((v119 = v182["projectId"]), (v120 = v184));
              const v212 = new Map();
              (v185["forEach"](({ record: v213, signature: v214 }) => {
                if (!v213?.["id"]) return;
                v212["set"](v213["id"], v214);
              }),
                v121["clear"](),
                (v122 = new Set()),
                v212["forEach"]((v215, v216) => {
                  (v121["set"](v216, v215), v122["add"](v216));
                }),
                (v123 = true),
                v205());
            }),
            (v207["onerror"] = (v217) => v206(v217["target"]["error"])),
            (v207["onabort"] = (v218) => v206(v218["target"]["error"])));
        });
      } catch (v219) {
        console["warn"]("[V2LocalCache] Save failed:", v219);
      }
    },
    async load() {
      try {
        const v220 = await this["getRecord"](WORKSPACE_META_KEY);
        if (
          v220?.["cacheVersion"] === 2 &&
          Array["isArray"](v220["canvasOrder"])
        ) {
          const v221 = v220["canvasOrder"]["map"]((v222) =>
              buildWorkspaceCanvasKey(v222?.["id"]),
            ),
            v223 = await this["getRecords"](v221),
            v224 = restoreWorkspacePayloadFromShardRecords(v220, v223);
          if (v224?.["multiData"]?.["canvases"]?.["length"])
            return (v135(v224), v224);
        }
        const v225 = await this["getRecord"](LEGACY_WORKSPACE_KEY);
        if (v225?.["multiData"]?.["canvases"]?.["length"])
          return (v134(), v225);
        return (v134(), null);
      } catch (v226) {
        return (
          console["warn"]("[V2LocalCache] Load failed:", v226),
          v134(),
          null
        );
      }
    },
    async clear() {
      try {
        const v227 = await this["initDB"](),
          v228 = await this["listKeys"](),
          v229 = v228["filter"]((v230) => {
            const v231 = String(v230);
            return (
              v231 === LEGACY_WORKSPACE_KEY ||
              v231 === WORKSPACE_META_KEY ||
              v231["startsWith"](WORKSPACE_CANVAS_KEY_PREFIX)
            );
          });
        return new Promise((v232, v233) => {
          const v234 = v227["transaction"](this["storeName"], "readwrite"),
            v235 = v234["objectStore"](this["storeName"]);
          (v229["forEach"]((v236) => v235["delete"](v236)),
            (v234["oncomplete"] = () => {
              (v134(), v232());
            }),
            (v234["onerror"] = (v237) => v233(v237["target"]["error"])),
            (v234["onabort"] = (v238) => v233(v238["target"]["error"])));
        });
      } catch (v239) {
        console["warn"]("[V2LocalCache] Clear failed:", v239);
      }
    },
  };
  window["V2LocalCache"] = v142;
  function v240(v241) {
    if (typeof performance?.["mark"] !== "function") return;
    performance["mark"](v241);
  }
  function v242(v243, v244, v245) {
    if (typeof performance?.["measure"] !== "function") return;
    try {
      performance["measure"](v243, v244, v245);
    } catch {}
  }
  function v246() {
    if (window["__perfDebug"] !== true) return;
    if (typeof performance?.["getEntriesByName"] !== "function") return;
    BOOT_PERF_MEASURE_NAMES["forEach"]((v247) => {
      const v248 = performance["getEntriesByName"](v247),
        v249 = v248[v248["length"] - 1];
      if (!v249) return;
      console["log"](
        "[perf] " + v247 + ":\x20" + v249["duration"]["toFixed"](1) + "ms",
      );
    });
  }
  function v250({ projectId: v251, projectName: v252, multiData: v253 }) {
    return { projectId: v251, projectName: v252, multiData: v253 || {} };
  }
  function v254({ projectId: v255, projectName: v256, multiData: v257 }) {
    const v258 = v250({ projectId: v255, projectName: v256, multiData: v257 });
    return (writeDreaminaResumeBackupSync(v258), v142["save"](v258));
  }
  function v259(
    v260,
    { sanitizeForPersistence: sanitizeForPersistence = false } = {},
  ) {
    if (!v260) return null;
    if (typeof v260["getMultiDataSnapshot"] === "function")
      return v260["getMultiDataSnapshot"]({
        sanitizeForPersistence: sanitizeForPersistence,
      });
    if (typeof v260["getMultiData"] === "function")
      return v260["getMultiData"]();
    return null;
  }
  function v261() {
    return (
      document["getElementById"]("projectNameText")?.["textContent"] ||
      "未命名项目"
    );
  }
  function v262() {
    const v263 = window["electronAPI"]?.["project"];
    return v263 && typeof v263 === "object" ? v263 : null;
  }
  function v264() {
    const v265 = Number(window["_v2CurrentProjectLastModified"] || 0);
    return Number["isFinite"](v265) && v265 > 0 ? Math["round"](v265) : 0;
  }
  function v266() {
    return {
      projectId: window["currentProjectId"] || "default_v2_project",
      projectName: v261(),
      filename: window["_v2CurrentFile"] || "",
      recentId: window["_v2CurrentRecentProjectId"] || "",
      displayPath: window["_v2CurrentProjectDisplayPath"] || "",
      lastKnownProjectLastModified: v264(),
    };
  }
  function v267() {
    return v111?.["hasDirtyCanvases"]?.() === true;
  }
  async function v268(v269 = "auto") {
    const v270 = v262();
    if (typeof v270?.["writeRecoverySnapshot"] !== "function")
      return { success: false, reason: "api-unavailable" };
    if (!v267()) return { success: false, reason: "clean" };
    const v271 = v259(v111, { sanitizeForPersistence: true });
    if (!v271?.["canvases"]?.["length"])
      return { success: false, reason: "empty-canvas" };
    const v272 = v266(),
      v273 = createStableSignature({ ...v272, multiData: v271 }),
      v274 = Date["now"]();
    if (v273 && v273 === v131 && v274 - v132 < RECOVERY_SNAPSHOT_DEDUPE_MS)
      return { success: true, deduped: true };
    if (v129 && v130 === v273) return v129;
    if (v129) return v129["catch"](() => null)["then"](() => v268(v269));
    return (
      (v129 = v270["writeRecoverySnapshot"]({
        ...v272,
        reason: v269,
        multiData: v271,
      })
        ["then"]((v275) => {
          return (
            v275?.["success"] !== false &&
              ((v131 = v273), (v132 = Date["now"]())),
            v275
          );
        })
        ["finally"](() => {
          ((v129 = null), (v130 = ""));
        })),
      (v130 = v273),
      v129
    );
  }
  function v276(v277 = "dirty-state") {
    const v278 = v262();
    if (typeof v278?.["writeRecoverySnapshot"] !== "function") return;
    (v128 !== null && clearTimeout(v128),
      (v128 = setTimeout(() => {
        ((v128 = null),
          void v268(v277)["catch"]((v279) => {
            console["warn"]("[projectLifecycle] 写入恢复快照失败:", v279);
          }));
      }, 1200)));
  }
  function v280() {
    if (v128 === null) return;
    (clearTimeout(v128), (v128 = null));
  }
  function v281({
    writeRecovery: writeRecovery = false,
    reason: reason = "dirty-state",
  } = {}) {
    const v282 = v262(),
      v283 = v267();
    typeof v282?.["setUnsavedState"] === "function" &&
      v282["setUnsavedState"]({ hasUnsavedChanges: v283, projectName: v261() });
    if (v283 && writeRecovery) {
      v276(reason);
      return;
    }
    !v283 && v280();
  }
  async function v284() {
    const v285 = v262();
    if (
      typeof v285?.["getRecoverySnapshotInfo"] !== "function" ||
      typeof v285?.["readRecoverySnapshot"] !== "function"
    )
      return null;
    try {
      const v286 = await v285["getRecoverySnapshotInfo"](v266());
      if (!v286?.["exists"]) return null;
      if (v286["isNewerThanProject"] !== true)
        return (await v285["clearRecoverySnapshot"]?.(), null);
      const v287 = await v285["readRecoverySnapshot"]();
      if (!v287?.["success"] || !v287["data"]) return null;
      return {
        projectId:
          v287["projectId"] ||
          window["currentProjectId"] ||
          "default_v2_project",
        projectName: v287["projectName"] || "未命名项目",
        multiData: v112["resolveCanvasData"](v287["data"]),
        recovery: true,
        filename: v287["filename"] || "",
        recentId: v287["recentId"] || "",
        displayPath: v287["displayPath"] || "",
        lastModified: Number(v287["lastModified"] || 0) || 0,
      };
    } catch (v288) {
      return (
        console["warn"]("[projectLifecycle] 读取恢复快照失败:", v288),
        null
      );
    }
  }
  function v289(v290) {
    if (!v290?.["recovery"]) return;
    ((window["_v2CurrentFile"] = v290["filename"] || ""),
      (window["_v2CurrentRecentProjectId"] = v290["recentId"] || ""),
      (window["_v2CurrentProjectDisplayPath"] = v290["displayPath"] || ""),
      (window["_v2CurrentProjectLastModified"] =
        Number(v290["lastModified"] || 0) || 0));
  }
  function v291() {
    if (v133) return;
    ((v133 = true),
      (window["__aiCanvasWriteRecoverySnapshotForClose"] = (
        v292 = "window-close",
      ) => v268(v292)),
      window["addEventListener"]("aicanvas:dirty-state-changed", () => {
        v281({ writeRecovery: true, reason: "dirty-state" });
      }));
  }
  function v293() {
    if (v124) return ((v125 = true), v124);
    const v294 = async () => {
      const v295 = v259(v111, { sanitizeForPersistence: true }),
        v296 = window["currentProjectId"],
        v297 = v261();
      if (!v295?.["canvases"]?.["length"]) return;
      await v254({ projectId: v296, projectName: v297, multiData: v295 });
    };
    return (
      (v124 = (async () => {
        try {
          do {
            ((v125 = false), await v294());
          } while (v125);
        } finally {
          v124 = null;
        }
      })()),
      v124
    );
  }
  function v298(v299) {
    return v115(v299 || {});
  }
  function v300(v301, { timeout: timeout = 1500 } = {}) {
    if (typeof v301 !== "function") return;
    if (
      typeof window !== "undefined" &&
      typeof window["requestIdleCallback"] === "function"
    ) {
      window["requestIdleCallback"](
        () => {
          void v301();
        },
        { timeout: timeout },
      );
      return;
    }
    setTimeout(() => {
      void v301();
    }, 0);
  }
  function v302() {
    return new Promise((v303) => setTimeout(v303, 0));
  }
  function v304({
    wrapEl: v305,
    canvasEl: v306,
    animate: animate = false,
    afterHidden: v307,
  } = {}) {
    const v308 = () => {
      if (v306) v306["style"]["transition"] = "";
      v305 &&
        ((v305["style"]["transition"] = animate
          ? "opacity 0.2s ease-in-out"
          : ""),
        (v305["style"]["opacity"] = "1"));
      const v309 = document["getElementById"]("v2-initial-loader");
      v309 &&
        ((v309["style"]["opacity"] = "0"),
        (v309["style"]["visibility"] = "hidden"),
        setTimeout(() => v309["remove"](), 400));
      if (window["hideGlobalLoading"]) window["hideGlobalLoading"]();
      (v240("loader hidden:end"),
        v242("loader\x20hidden", "initApp:start", "loader hidden:end"));
      if (typeof v307 === "function") v307();
      v246();
    };
    if (animate) {
      setTimeout(v308, 80);
      return;
    }
    v308();
  }
  function v310(v311) {
    v300(v311, { timeout: 1500 });
  }
  function v312({ projectId: v313, projectName: v314, multiData: v315 }) {
    if (!v315?.["canvases"]?.["length"]) return;
    v310(async () => {
      try {
        const { changed: v316, multiData: v317 } = await v114(v315);
        if (!v316) return;
        await v254({ projectId: v313, projectName: v314, multiData: v317 });
      } catch (v318) {
        console["warn"]("[main] 缩略图迁移失败", v318);
      }
    });
  }
  function v319(v320) {
    const v321 = String(v320 || "")["trim"]();
    return /^https?:\/\//i["test"](v321) || v321["startsWith"]("//");
  }
  function v322(v323) {
    const v324 = [];
    for (const v325 of Object["values"](v323 || {})) {
      if (!v325 || v325["type"] !== "ai-image") continue;
      const v326 = Array["isArray"](v325["images"]) ? v325["images"] : [];
      for (let v327 = 0; v327 < v326["length"]; v327 += 1) {
        const v328 = v326[v327] || {};
        if (String(v328["localPath"] || "")["trim"]()) continue;
        const v329 = String(
          v328["sourceUrl"] || v328["imageUrl"] || v328["thumbUrl"] || "",
        )["trim"]();
        if (!v329 || !v319(v329)) continue;
        v324["push"]({ nodeId: v325["id"], idx: v327, remote: v329 });
      }
      if (
        v326["length"] === 0 &&
        !String(v325["localPath"] || "")["trim"]() &&
        v319(v325["thumbUrl"] || v325["imageUrl"] || v325["sourceUrl"])
      ) {
        const v330 = String(
          v325["sourceUrl"] || v325["imageUrl"] || v325["thumbUrl"] || "",
        )["trim"]();
        if (v330) v324["push"]({ nodeId: v325["id"], idx: -1, remote: v330 });
      }
    }
    return v324;
  }
  function v331(v332, v333) {
    if (!v332) return false;
    if (v333["idx"] >= 0) {
      const v334 = Array["isArray"](v332["images"]) ? v332["images"] : [],
        v335 = v334[v333["idx"]];
      if (!v335 || String(v335["localPath"] || "")["trim"]()) return false;
      const v336 = String(
        v335["sourceUrl"] || v335["imageUrl"] || v335["thumbUrl"] || "",
      )["trim"]();
      return v336 === v333["remote"];
    }
    if (String(v332["localPath"] || "")["trim"]()) return false;
    const v337 = String(
      v332["sourceUrl"] || v332["imageUrl"] || v332["thumbUrl"] || "",
    )["trim"]();
    return v337 === v333["remote"];
  }
  function v338(v339, v340) {
    const v341 =
        typeof v340 === "string"
          ? String(v340 || "")["trim"]()
          : String(v340?.["localUrl"] || v340?.["url"] || "")["trim"](),
      v342 =
        typeof v340 === "string"
          ? normalizeLocalPath(v340)
          : pickResultLocalPath(v340) || normalizeLocalPath(v341);
    if (!v342) return false;
    const v343 =
        v340 && typeof v340 === "object"
          ? buildImageNodeStorageFields(v340)
          : {},
      v344 = buildCanvasLocalImageFields(
        v340 && typeof v340 === "object" ? v340 : { localPath: v342 },
      ),
      v345 = v110["getStateRaw"]()?.["nodes"]?.[v339["nodeId"]];
    if (!v331(v345, v339)) return false;
    const v346 = {};
    if (v339["idx"] >= 0) {
      const v347 = Array["isArray"](v345["images"])
        ? v345["images"]["slice"]()
        : [];
      if (!v347[v339["idx"]]) return false;
      ((v347[v339["idx"]] = {
        ...(v347[v339["idx"]] || {}),
        ...v344,
        ...v343,
        originalWidth:
          Number(v340?.["originalWidth"] || 0) ||
          v347[v339["idx"]]?.["originalWidth"],
        originalHeight:
          Number(v340?.["originalHeight"] || 0) ||
          v347[v339["idx"]]?.["originalHeight"],
      }),
        (v346["images"] = v347),
        (v345["mainImageIndex"] || 0) === v339["idx"] &&
          (Object["assign"](v346, v344),
          Object["assign"](v346, v343),
          (v346["originalWidth"] =
            Number(v340?.["originalWidth"] || 0) || v345["originalWidth"]),
          (v346["originalHeight"] =
            Number(v340?.["originalHeight"] || 0) || v345["originalHeight"])));
    } else
      (Object["assign"](v346, v344),
        Object["assign"](v346, v343),
        (v346["originalWidth"] =
          Number(v340?.["originalWidth"] || 0) || v345["originalWidth"]),
        (v346["originalHeight"] =
          Number(v340?.["originalHeight"] || 0) || v345["originalHeight"]));
    if (Object["keys"](v346)["length"] === 0) return false;
    return (v110["updateNodeData"](v339["nodeId"], v346), true);
  }
  function v348(v349) {
    return normalizeLocalPath(
      v349?.["originalLocalPath"] || v349?.["localPath"],
    );
  }
  function v350(v351) {
    return {
      displayLocalPath: normalizeLocalPath(v351?.["displayLocalPath"]),
      thumbLocalPath: normalizeLocalPath(v351?.["thumbLocalPath"]),
    };
  }
  function v352(v353) {
    const v354 = v348(v353);
    if (!v354) return false;
    const { displayLocalPath: v355, thumbLocalPath: v356 } = v350(v353),
      v357 = !!v355,
      v358 = !!v356;
    return !(v357 && v358);
  }
  async function v359(v360) {
    if (typeof v112?.["checkLocalMediaExists"] !== "function") return false;
    const v361 = v348(v360);
    if (!v361) return false;
    const { displayLocalPath: v362, thumbLocalPath: v363 } = v350(v360),
      v364 = [v362, v363]["filter"](Boolean);
    if (v364["length"] === 0) return false;
    for (const v365 of v364) {
      try {
        if (!(await v112["checkLocalMediaExists"](v365))) return true;
      } catch {
        return true;
      }
    }
    return false;
  }
  async function v366(v367) {
    if (v352(v367)) return true;
    return await v359(v367);
  }
  async function v368(v369) {
    const v370 = [];
    for (const v371 of Object["values"](v369 || {})) {
      if (!v371) continue;
      const v372 = String(v371["type"] || "")["trim"]();
      if (v372 === "source-image") {
        (await v366(v371)) &&
          v370["push"]({
            nodeId: v371["id"],
            idx: -1,
            nodeType: v372,
            localPath: v348(v371),
          });
        continue;
      }
      if (v372 !== "ai-image") continue;
      const v373 = Array["isArray"](v371["images"]) ? v371["images"] : [];
      if (v373["length"] > 0) {
        for (let v374 = 0; v374 < v373["length"]; v374 += 1) {
          const v375 = v373[v374] || {};
          if (!(await v366(v375))) continue;
          v370["push"]({
            nodeId: v371["id"],
            idx: v374,
            nodeType: v372,
            localPath: v348(v375),
          });
        }
        continue;
      }
      (await v366(v371)) &&
        v370["push"]({
          nodeId: v371["id"],
          idx: -1,
          nodeType: v372,
          localPath: v348(v371),
        });
    }
    return v370;
  }
  function v376(v377, v378) {
    if (!v377) return false;
    if (v378["idx"] >= 0) {
      const v379 = Array["isArray"](v377["images"]) ? v377["images"] : [],
        v380 = v379[v378["idx"]];
      if (!v380) return false;
      return v348(v380) === v378["localPath"];
    }
    return v348(v377) === v378["localPath"];
  }
  function v381(v382, v383) {
    const v384 = buildImageNodeStorageFields(v383);
    if (!v384["displayLocalPath"] && !v384["thumbLocalPath"]) return false;
    const v385 = v110["getStateRaw"]()?.["nodes"]?.[v382["nodeId"]];
    if (!v376(v385, v382)) return false;
    const v386 = {};
    if (v382["idx"] >= 0) {
      const v387 = Array["isArray"](v385["images"])
        ? v385["images"]["slice"]()
        : [];
      if (!v387[v382["idx"]]) return false;
      ((v387[v382["idx"]] = {
        ...(v387[v382["idx"]] || {}),
        ...v384,
        originalWidth:
          Number(v383?.["originalWidth"] || 0) ||
          v387[v382["idx"]]?.["originalWidth"],
        originalHeight:
          Number(v383?.["originalHeight"] || 0) ||
          v387[v382["idx"]]?.["originalHeight"],
      }),
        (v386["images"] = v387),
        (v385["mainImageIndex"] || 0) === v382["idx"] &&
          Object["assign"](v386, {
            ...v384,
            originalWidth:
              Number(v383?.["originalWidth"] || 0) || v385["originalWidth"],
            originalHeight:
              Number(v383?.["originalHeight"] || 0) || v385["originalHeight"],
          }));
    } else
      Object["assign"](v386, {
        ...v384,
        originalWidth:
          Number(v383?.["originalWidth"] || 0) || v385["originalWidth"],
        originalHeight:
          Number(v383?.["originalHeight"] || 0) || v385["originalHeight"],
      });
    if (Object["keys"](v386)["length"] === 0) return false;
    return (v110["updateNodeData"](v382["nodeId"], v386), true);
  }
  async function v388(v389, v390 = 10) {
    if (
      typeof v112?.["saveRemoteImageLocallyDetailed"] !== "function" &&
      typeof v112?.["saveRemoteImageLocally"] !== "function"
    )
      return;
    if (!v389 || window["currentProjectId"] !== v389) return;
    const v391 = v322(v110["getStateRaw"]()?.["nodes"] || {});
    if (v391["length"] === 0) return;
    window["showToast"]?.(
      "检测到\x20" + v391["length"] + " 个历史生成结果未本地化，正在修复…",
      "info",
    );
    let v392 = 0;
    await v302();
    for (let v393 = 0; v393 < v391["length"]; v393 += v390) {
      if (window["currentProjectId"] !== v389) return;
      const v394 = v391["slice"](v393, v393 + v390);
      for (const v395 of v394) {
        if (window["currentProjectId"] !== v389) return;
        try {
          const v396 =
            typeof v112["saveRemoteImageLocallyDetailed"] === "function"
              ? await v112["saveRemoteImageLocallyDetailed"](
                  v395["remote"],
                  v389,
                )
              : await v112["saveRemoteImageLocally"](v395["remote"], v389);
          v338(v395, v396) && (v392 += 1);
        } catch {}
      }
      v393 + v390 < v391["length"] && (await v302());
    }
    if (window["currentProjectId"] !== v389) return;
    v392 > 0 &&
      window["showToast"]?.(
        "已修复\x20" + v392 + " 个生成结果（已落盘到 output）",
        "success",
      );
  }
  async function v397(v398, v399 = 10) {
    if (typeof v112?.["ensureLocalImageDerivatives"] !== "function") return;
    if (!v398 || window["currentProjectId"] !== v398) return;
    const v400 = await v368(v110["getStateRaw"]()?.["nodes"] || {});
    if (v400["length"] === 0) return;
    let v401 = 0;
    await v302();
    for (let v402 = 0; v402 < v400["length"]; v402 += v399) {
      if (window["currentProjectId"] !== v398) return;
      const v403 = v400["slice"](v402, v402 + v399);
      for (const v404 of v403) {
        if (window["currentProjectId"] !== v398) return;
        try {
          const v405 = await v112["ensureLocalImageDerivatives"](
            v404["localPath"],
          );
          v381(v404, v405) && (v401 += 1);
        } catch {}
      }
      v402 + v399 < v400["length"] && (await v302());
    }
    if (window["currentProjectId"] !== v398) return;
    v401 > 0 &&
      (window["_triggerLocalCacheSave"]?.(),
      window["showToast"]?.(
        "已补齐 " + v401 + " 个图片节点的 display/thumb",
        "success",
      ));
  }
  function v406(v407, v408 = 10) {
    if (!v407) return;
    (v240("historicalAiLocalization queued:end"),
      v242(
        "historicalAiLocalization queued",
        "initApp:start",
        "historicalAiLocalization\x20queued:end",
      ),
      v300(() => v388(v407, v408), { timeout: 2500 }));
  }
  function v409(v410, v411 = 10) {
    if (!v410) return;
    v300(() => v397(v410, v411), { timeout: 3200 });
  }
  window["_queueLegacyThumbnailMigration"] = v312;
  function v412() {
    return v293();
  }
  window["_triggerLocalCacheSave"] = v412;
  let v413 = null,
    v414 = null,
    v415 = false;
  function v416() {
    return (
      v414 !== null && clearTimeout(v414),
      (v414 = setTimeout(() => {
        ((v414 = null), v412());
      }, 150)),
      v414
    );
  }
  window["_triggerLocalCacheMetaSave"] = v416;
  function v417({ pageLifecycle: pageLifecycle = false } = {}) {
    v413 !== null && (clearTimeout(v413), (v413 = null));
    v414 !== null && (clearTimeout(v414), (v414 = null));
    if (window["_isAppLoaded"] !== true) return null;
    if (!pageLifecycle) return v412();
    const v418 = Date["now"]();
    if (v126) return v126;
    if (v127 > 0 && v418 - v127 < PAGE_LIFECYCLE_FLUSH_DEDUPE_MS)
      return v124 || Promise["resolve"](null);
    const v419 = v412();
    if (!v419 || typeof v419["finally"] !== "function")
      return ((v127 = Date["now"]()), v419);
    return (
      (v126 = v419),
      v419["finally"](() => {
        v126 === v419 && ((v127 = Date["now"]()), (v126 = null));
      }),
      v419
    );
  }
  function v420() {
    if (v415) return;
    ((v415 = true), v291());
    let v421 = false;
    v110["subscribeSelector"](
      (v422) => v422["_persistRev"],
      () => {
        if (!v421) {
          v421 = true;
          return;
        }
        if (window["_isAppLoaded"] !== true) return;
        (v413 !== null && clearTimeout(v413),
          (v413 = setTimeout(() => {
            ((v413 = null), v412());
          }, 1000)),
          v281({ writeRecovery: true, reason: "persist-rev" }));
      },
    );
  }
  function v423() {
    return (
      v267() && void v268("beforeunload")["catch"](() => {}),
      v417({ pageLifecycle: true })
    );
  }
  function v424() {
    return v417({ pageLifecycle: true });
  }
  function v425() {
    if (document["visibilityState"] !== "hidden") {
      v127 = 0;
      return;
    }
    return v417({ pageLifecycle: true });
  }
  async function v426() {
    const v427 = document["getElementById"]("v2-wrap"),
      v428 =
        document["getElementById"]("v2-canvas") ||
        document["querySelector"](".v2-canvas");
    try {
      (v240("initApp:start"), v113());
      const v429 = readDreaminaResumeBackupSync(),
        v430 = await v284(),
        v431 = v430 || (await v142["load"]());
      if (
        v431 &&
        v431["multiData"] &&
        v431["multiData"]["canvases"] &&
        v431["multiData"]["canvases"]["length"] > 0
      ) {
        (v110["updateViewport"](0, 0, 1),
          v289(v431),
          (window["currentProjectId"] =
            v431["projectId"] || "default_v2_project"));
        const v432 = document["getElementById"]("projectNameText");
        v432 && (v432["textContent"] = v431["projectName"] || "未命名项目");
        const v433 = v112["resolveCanvasData"](
          mergeDreaminaResumeBackupIntoMultiData(
            v431["multiData"],
            v429,
            v431["projectId"] || window["currentProjectId"],
          ),
        );
        v240("buildHydrationSafeMultiData:start");
        const v434 = v298(v433);
        (v240("buildHydrationSafeMultiData:end"),
          v242(
            "buildHydrationSafeMultiData",
            "buildHydrationSafeMultiData:start",
            "buildHydrationSafeMultiData:end",
          ),
          v240("CanvasTabManager.init:start"),
          v111["init"](v434, { markClean: false }),
          v240("CanvasTabManager.init:end"),
          v242(
            "CanvasTabManager.init",
            "CanvasTabManager.init:start",
            "CanvasTabManager.init:end",
          ),
          v312({
            projectId: window["currentProjectId"],
            projectName: v431["projectName"] || "未命名项目",
            multiData: v433,
          }),
          (window["_isAppLoaded"] = true),
          v281({ writeRecovery: v431["recovery"] === true, reason: "startup" }),
          window["_checkEmptyHint"]?.(),
          v116(),
          v304({
            wrapEl: v427,
            canvasEl: v428,
            animate: false,
            afterHidden: () => {
              (v406(window["currentProjectId"]),
                v409(window["currentProjectId"]));
            },
          }));
        return;
      }
      v428 &&
        ((v428["style"]["transition"] = "none"), void v428["offsetHeight"]);
      v110["updateViewport"](0, 0, 1);
      window["showGlobalLoading"] &&
        window["showGlobalLoading"]("加载工作区文件中...");
      const v435 = window["currentProjectId"] || "default_v2_project";
      ((window["currentProjectId"] = v435), v240("project.loadProject:start"));
      const v436 = await v112["loadProject"](v435),
        v437 = mergeDreaminaResumeBackupIntoMultiData(v436, v429, v435);
      (v240("project.loadProject:end"),
        v242(
          "project.loadProject",
          "project.loadProject:start",
          "project.loadProject:end",
        ),
        v240("buildHydrationSafeMultiData:start"));
      const v438 = v298(v437);
      (v240("buildHydrationSafeMultiData:end"),
        v242(
          "buildHydrationSafeMultiData",
          "buildHydrationSafeMultiData:start",
          "buildHydrationSafeMultiData:end",
        ),
        v240("CanvasTabManager.init:start"),
        v111["init"](v438),
        v240("CanvasTabManager.init:end"),
        v242(
          "CanvasTabManager.init",
          "CanvasTabManager.init:start",
          "CanvasTabManager.init:end",
        ),
        v312({
          projectId: v435,
          projectName:
            document["getElementById"]("projectNameText")?.["textContent"] ||
            "默认画布",
          multiData: v437,
        }),
        v117(),
        (window["_isAppLoaded"] = true),
        v281({ writeRecovery: false, reason: "startup" }),
        window["_checkEmptyHint"]?.());
      const v439 = document["getElementById"]("projectNameText");
      (v439 && (v439["textContent"] = "默认画布"),
        v304({
          wrapEl: v427,
          canvasEl: v428,
          animate: true,
          afterHidden: () => {
            (v406(v435), v409(v435));
          },
        }));
    } catch (v440) {
      (console["error"]("Failed to init app:", v440),
        v304({ wrapEl: v427, canvasEl: v428, animate: true }));
    }
  }
  function v441(v442) {
    const v443 = v442?.["dataTransfer"]?.["types"];
    return !!v443 && Array["from"](v443)["includes"]("Files");
  }
  function v444(v445) {
    if (!v441(v445)) return false;
    v445["preventDefault"]();
    if (v445["dataTransfer"]) v445["dataTransfer"]["dropEffect"] = "copy";
    return true;
  }
  function v446(v447) {
    v444(v447);
  }
  function v448(v449) {
    if (v444(v449)) return;
    v449["preventDefault"]();
  }
  function v450(v451) {
    v451["preventDefault"]();
    const v452 = v451["dataTransfer"]["files"][0];
    if (!v452 || !v452["name"]["endsWith"](".json")) return;
    const v453 = new FileReader();
    ((v453["onload"] = (v454) => {
      try {
        const v455 = JSON["parse"](v454["target"]["result"]),
          v456 = v112["resolveCanvasData"](v455),
          v457 = v298(v456),
          v458 =
            v457["canvases"]["find"](
              (v459) => v459["id"] === v457["activeCanvasId"],
            ) || v457["canvases"][0],
          v460 = v452["name"]["replace"](".json", ""),
          v461 = v111["_canvases"]["find"]((v462) => v462["name"] === v460);
        v461
          ? v111["switchTo"](v461["id"])
          : (v111["addCanvas"](),
            v111["renameCanvas"](v111["_activeId"], v460));
        (v118(v458),
          v111["hydrateActiveCanvasSnapshot"](v458),
          v111["markCanvasClean"](v111["_activeId"]),
          v116());
        const v463 = document["getElementById"]("projectNameText");
        if (v463) v463["textContent"] = v460;
        (v111["renderTabs"](),
          (window["_v2CurrentFile"] = v452["name"]),
          (window["currentProjectId"] = v460),
          v312({ projectId: v460, projectName: v460, multiData: v456 }),
          v409(v460),
          window["showToast"]?.("成功加载本地存档: " + v460));
      } catch (v464) {
        (console["error"]("[Drop] 读取本地 JSON 失败:", v464),
          window["showToast"]?.("解析 JSON 存档失败", "error"));
      }
    }),
      v453["readAsText"](v452));
  }
  function v465() {
    const v466 = document["getElementById"]("projectNameText");
    if (!v466) return;
    const v467 = async () => {
      if (!window["currentProjectId"]) return;
      const v468 = v466["textContent"]["trim"]();
      if (!v468) return;
      try {
        v111["_flushCurrentCanvas"]();
        const v469 = v111["getMultiData"](),
          v470 = await v112["saveProject"](v468, v469);
        (v470?.["success"] && v111["markAllCanvasesClean"](), v412());
      } catch (v471) {
        console["error"]("Failed to save project name:", v471);
      }
    };
    (v466["addEventListener"]("blur", v467),
      v466["addEventListener"]("keydown", (v472) => {
        v472["key"] === "Enter" && (v472["preventDefault"](), v466["blur"]());
      }));
  }
  function v473() {
    const v474 = document["getElementById"]("logoLink");
    if (!v474) return;
    v474["addEventListener"]("click", async () => {
      (window["currentProjectId"] &&
        (await window["ProjectManager"]["saveCurrentProject"]()),
        console["log"]("Gallery view disabled by user."));
    });
  }
  return {
    V2LocalCache: v142,
    initApp: v426,
    onBeforeUnload: v423,
    onPageHide: v424,
    onVisibilityChange: v425,
    onDocumentDragEnter: v446,
    onDocumentDragOver: v448,
    onDocumentDrop: v450,
    triggerLocalCacheSave: v412,
    flushPendingLocalCacheSaveNow: v417,
    bindPersistRevisionAutoSave: v420,
    bindHeaderProjectNameAutoSave: v465,
    bindLogoProjectSave: v473,
  };
}

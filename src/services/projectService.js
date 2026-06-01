import {
  cropGridTilesToServer,
  checkLocalMediaExistsOnServer,
  deleteV2ProjectFromServer,
  ensureImageDerivativesToServer,
  fetchRemoteBlob,
  fetchV2ProjectFromServer,
  fetchV2ProjectsFromServer,
  saveV2ProjectToServer,
  saveOutputFromUrlToServer,
  saveOutputToServer,
  uploadFileToServer,
} from "../../api/projectsV2Api.js";
import { sanitizeMultiCanvasDataForPersistence } from "../utils/thumbnailPersistence.js";
import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
import {
  buildImageNodeStorageFields,
  hasImageDerivativeFields,
  toLocalPathUrl,
} from "./imageDerivativeService.js";
import {
  PANORAMA_360_DEFAULT_NAME,
  PANORAMA_360_NODE_TYPE,
  PANORAMA_SCENE_DEFAULT_NAME,
  PANORAMA_SCENE_NODE_TYPE,
  isPanorama360NodeType,
  isPanoramaSceneNodeType,
  normalizePanorama360State,
  normalizeSceneOnlyPanoramaSceneState,
} from "../modules/panoramaSceneNode/sceneNode.js";
const DEFAULT_PROJECT_NAME = "default_v2_project",
  REMOTE_SAVE_CACHE_LIMIT = 500,
  _remoteSaveInflight = new Map(),
  _remoteSaveCache = new Map();
function _buildRemoteSaveCacheKey(v0, v1, v2 = {}) {
  const v3 = String(v1 || "")["trim"](),
    v4 = String(
      v2?.["dedupeKey"] || (v2?.["taskKey"] ? v2["taskKey"] + ":" + v3 : v3),
    )["trim"]();
  return (String(v0 || "media")["trim"]() || "media") + ":" + (v4 || v3);
}
function _rememberRemoteSave(v5, v6) {
  if (!v5 || !v6 || typeof v6 !== "object") return;
  _remoteSaveCache["set"](v5, v6);
  if (_remoteSaveCache["size"] > REMOTE_SAVE_CACHE_LIMIT) {
    const v7 = _remoteSaveCache["keys"]()["next"]()["value"];
    if (v7) _remoteSaveCache["delete"](v7);
  }
}
function _runRemoteSaveOnce(v8, v9) {
  if (_remoteSaveCache["has"](v8))
    return Promise["resolve"](_remoteSaveCache["get"](v8));
  if (_remoteSaveInflight["has"](v8)) return _remoteSaveInflight["get"](v8);
  const v10 = Promise["resolve"]()
    ["then"](v9)
    ["then"]((v11) => {
      return (_rememberRemoteSave(v8, v11), v11);
    });
  return (
    _remoteSaveInflight["set"](v8, v10),
    v10["finally"](() => {
      _remoteSaveInflight["get"](v8) === v10 &&
        _remoteSaveInflight["delete"](v8);
    })["catch"](() => {}),
    v10
  );
}
function _isPlainObject(v12) {
  return !!v12 && typeof v12 === "object" && !Array["isArray"](v12);
}
function _migratePanoramaNodeInPlace(v13) {
  if (!_isPlainObject(v13)) return;
  const v14 = String(v13["type"] || "")["trim"]();
  if (isPanorama360NodeType(v14)) {
    v13["type"] = PANORAMA_360_NODE_TYPE;
    const v15 = _isPlainObject(v13["panorama360Node"])
      ? v13["panorama360Node"]
      : v13["sceneNode"];
    ((v13["panorama360Node"] = normalizePanorama360State(v15)),
      delete v13["sceneNode"]);
    !String(v13["name"] || "")["trim"]() &&
      (v13["name"] = PANORAMA_360_DEFAULT_NAME);
    return;
  }
  if (!isPanoramaSceneNodeType(v14)) return;
  v13["type"] = PANORAMA_SCENE_NODE_TYPE;
  const v16 = _isPlainObject(v13["sceneNode"])
      ? v13["sceneNode"]
      : v13["panorama360Node"],
    v17 = normalizeSceneOnlyPanoramaSceneState(v16),
    v18 = String(v16?.["mode"] || "")
      ["trim"]()
      ["toLowerCase"](),
    v19 = v18 === "panorama";
  if (v19) {
    ((v13["type"] = PANORAMA_360_NODE_TYPE),
      (v13["panorama360Node"] = normalizePanorama360State(v16)),
      delete v13["sceneNode"]);
    const v20 = String(v13["name"] || "")["trim"]();
    (!v20 || v20 === PANORAMA_SCENE_DEFAULT_NAME) &&
      (v13["name"] = PANORAMA_360_DEFAULT_NAME);
    return;
  }
  ((v13["sceneNode"] = v17),
    delete v13["panorama360Node"],
    !String(v13["name"] || "")["trim"]() &&
      (v13["name"] = PANORAMA_SCENE_DEFAULT_NAME));
}
function _migrateCanvasDataInPlace(v21) {
  const v22 = Array["isArray"](v21?.["canvases"]) ? v21["canvases"] : [];
  for (const v23 of v22) {
    if (!v23) continue;
    if (v23["nodes"] && !Array["isArray"](v23["nodes"]))
      v23["nodes"] = Object["values"](v23["nodes"]);
    if (v23["edges"] && !Array["isArray"](v23["edges"]))
      v23["edges"] = Object["values"](v23["edges"]);
    const v24 = Array["isArray"](v23["nodes"]) ? v23["nodes"] : [];
    for (const v25 of v24) {
      _migratePanoramaNodeInPlace(v25);
    }
  }
  return v21;
}
const getCssVar = (v26) =>
  getComputedStyle(document["documentElement"])
    ["getPropertyValue"](v26)
    ["trim"]();
export function resolveCanvasData(v27) {
  if (!v27)
    return _migrateCanvasDataInPlace({
      canvases: [
        {
          id: "canvas_1",
          name: "默认画布",
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1.1 },
        },
      ],
      activeCanvasId: "canvas_1",
    });
  if (Array["isArray"](v27["canvases"]) && v27["canvases"]["length"] > 0) {
    let v28 = v27["activeCanvasId"] || v27["canvases"][0]["id"];
    const v29 = v27["canvases"]["find"]((v30) => v30["id"] === v28);
    if (v29 && (!v29["nodes"] || v29["nodes"]["length"] === 0)) {
      const v31 = v27["canvases"]["find"](
        (v32) => v32["nodes"] && v32["nodes"]["length"] > 0,
      );
      if (v31) v28 = v31["id"];
    }
    return _migrateCanvasDataInPlace({
      canvases: v27["canvases"],
      activeCanvasId: v28,
    });
  }
  let v33 = v27["nodes"] || v27["v2_nodes"] || [],
    v34 = v27["edges"] || v27["v2_edges"] || [];
  if (!Array["isArray"](v33)) v33 = Object["values"](v33);
  if (!Array["isArray"](v34)) v34 = Object["values"](v34);
  const v35 = {
    id: "canvas_1",
    name: "默认画布",
    nodes: v33,
    edges: v34,
    viewport: v27["viewport"] || { x: 0, y: 0, zoom: 1.1 },
  };
  return _migrateCanvasDataInPlace({
    canvases: [v35],
    activeCanvasId: "canvas_1",
  });
}
export async function loadProject(v36) {
  try {
    const v37 = v36["endsWith"](".json") ? v36 : v36 + ".json",
      v38 = await fetchV2ProjectFromServer(v36);
    if (!v38)
      return (
        console["warn"](
          "[projectService]\x20项目文件\x20" +
            v37 +
            " 不存在，以空数据初始化...",
        ),
        resolveCanvasData({})
      );
    const v39 = resolveCanvasData(v38);
    return (
      console["log"](
        "[projectService] 项目 " +
          v36 +
          " 已加载，共 " +
          v39["canvases"]["length"] +
          "\x20个画布页面",
      ),
      v39
    );
  } catch (v40) {
    return (
      console["error"]("[projectService] 加载项目异常:", v40),
      resolveCanvasData({})
    );
  }
}
export async function saveProject(v41, v42) {
  try {
    const v43 = sanitizeMultiCanvasDataForPersistence(v42 || {}),
      v44 = {
        projectName: v41 || DEFAULT_PROJECT_NAME,
        activeCanvasId: v43?.["activeCanvasId"] || "canvas_1",
        canvases: v43?.["canvases"] || [],
      },
      v45 = await saveV2ProjectToServer(v44);
    return (
      v45 &&
        v45["success"] &&
        ((window["_v2CurrentFile"] = v45["filename"]),
        (window["currentProjectId"] = v45["filename"]["replace"](".json", "")),
        _clearElectronRecoverySnapshotAfterSave()),
      console["log"](
        "[projectService] 项目 " +
          v41 +
          " 已持久化（" +
          v44["canvases"]["length"] +
          " 个画布）",
      ),
      v45
    );
  } catch (v46) {
    console["error"]("[projectService] 存档异常:", v46);
    throw v46;
  }
}
export async function getProjects() {
  try {
    return await fetchV2ProjectsFromServer();
  } catch {
    return [];
  }
}
export async function deleteProject(v47) {
  try {
    return await deleteV2ProjectFromServer(v47);
  } catch (v48) {
    return (console["error"]("[projectService] 删除项目失败:", v48), false);
  }
}
function _getElectronImportAsset() {
  const v49 = globalThis["window"]?.["electronAPI"]?.["importAsset"];
  return typeof v49 === "function" ? v49 : null;
}
function _clearElectronRecoverySnapshotAfterSave() {
  const v50 =
    globalThis["window"]?.["electronAPI"]?.["project"]?.[
      "clearRecoverySnapshot"
    ];
  if (typeof v50 !== "function") return;
  void v50()["catch"]((v51) => {
    console["warn"]("[projectService]\x20清理恢复快照失败:", v51);
  });
}
function _getElectronPathForFile(v52) {
  if (!globalThis["window"]?.["electronAPI"]) return "";
  const v53 = String(v52?.["path"] || "")["trim"]();
  if (v53) return v53;
  const v54 = globalThis["window"]["electronAPI"]["getPathForFile"];
  if (typeof v54 !== "function") return "";
  try {
    return String(v54(v52) || "")["trim"]();
  } catch {
    return "";
  }
}
async function _importAssetWithElectron(v55, v56) {
  const v57 = _getElectronImportAsset();
  if (!v57 || !v55) return null;
  const v58 = {
      name: v55["name"] || "asset",
      type: v55["type"] || "",
      projectId: v56,
    },
    v59 = _getElectronPathForFile(v55);
  if (v59) v58["path"] = v59;
  else {
    if (typeof v55["arrayBuffer"] === "function")
      v58["bytes"] = await v55["arrayBuffer"]();
    else return null;
  }
  return _normalizeImageSaveResult(await v57(v58));
}
export async function uploadFile(v60, v61) {
  try {
    try {
      const v62 = await _importAssetWithElectron(v60, v61);
      if (v62?.["success"]) return v62;
    } catch (v63) {
      console["warn"](
        "[projectService] Electron 素材导入失败，回退上传流程:",
        v63,
      );
    }
    return _normalizeImageSaveResult(await uploadFileToServer(v60));
  } catch (v64) {
    console["error"]("[projectService] 文件上传异常:", v64);
    throw v64;
  }
}
export async function saveOutputBlob(v65, v66 = {}) {
  return _normalizeImageSaveResult(await saveOutputToServer(v65, v66));
}
export async function cropGridTiles(v67 = {}) {
  const v68 = await cropGridTilesToServer(v67);
  if (!v68 || typeof v68 !== "object") return v68;
  const v69 = Array["isArray"](v68["tiles"])
    ? v68["tiles"]["map"]((v70) => _normalizeImageSaveResult(v70))
    : [];
  return { ...v68, tiles: v69 };
}
export async function saveOutputFromUrl(v71, v72 = {}) {
  const v73 = String(v71 || "")["trim"]();
  if (v73["startsWith"]("blob:") || v73["startsWith"]("data:"))
    try {
      const v74 = await fetchRemoteBlob(v73);
      return await saveOutputBlob(v74, v72);
    } catch (v75) {
      return (
        console["error"]("[projectService] 本地路径转换 Blob 失败:", v75),
        { error: "本地路径转换失败:\x20" + v75["message"] }
      );
    }
  return _normalizeImageSaveResult(
    await saveOutputFromUrlToServer({ url: v73, ...v72 }),
  );
}
function _guessAudioExtFromUrl(v76) {
  try {
    const v77 = new URL(String(v76 || ""), "http://localhost"),
      v78 = String(v77["pathname"] || "")["match"](/\.([a-z0-9]{1,5})$/i),
      v79 = String(v78?.[1] || "")["toLowerCase"]();
    if (
      ["wav", "mp3", "m4a", "flac", "aac", "ogg", "opus", "wma", "amr", "webm"][
        "includes"
      ](v79)
    )
      return v79;
  } catch {}
  return "";
}
function _guessAudioExtFromMime(v80) {
  const v81 = String(v80 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!v81) return "";
  if (v81 === "audio/mpeg") return "mp3";
  if (v81 === "audio/wav" || v81 === "audio/x-wav") return "wav";
  if (v81 === "audio/mp4" || v81 === "audio/x-m4a") return "m4a";
  if (v81 === "audio/flac" || v81 === "audio/x-flac") return "flac";
  if (v81 === "audio/aac") return "aac";
  if (v81 === "audio/ogg") return "ogg";
  if (v81 === "audio/opus") return "opus";
  if (v81 === "audio/webm") return "webm";
  if (v81 === "audio/amr") return "amr";
  return "";
}
function _toLocalAudioResult(v82) {
  const v83 = normalizeLocalPath(
      v82?.["localPath"] || v82?.["originalLocalPath"] || v82?.["path"],
    ),
    v84 = localPathToUrl(v83);
  return {
    ...(v82 && typeof v82 === "object" ? v82 : {}),
    localPath: v83,
    localUrl: v84,
  };
}
export async function saveRemoteAudioLocallyDetailed(v85, v86 = {}) {
  const v87 = String(v85 || "")["trim"]();
  if (!v87) throw new Error("保存音频失败: 缺少 remoteUrl");
  return _runRemoteSaveOnce(
    _buildRemoteSaveCacheKey("audio", v87, v86),
    async () => {
      if (v87["startsWith"]("blob:") || v87["startsWith"]("data:")) {
        const v88 = await fetchRemoteBlob(v87),
          v89 = _guessAudioExtFromMime(v88?.["type"]) || "mp3";
        return _toLocalAudioResult(
          await saveOutputBlob(v88, { ext: v89, ...v86 }),
        );
      }
      const v90 = _guessAudioExtFromUrl(v87) || "mp3";
      try {
        return _toLocalAudioResult(
          await saveOutputFromUrl(v87, {
            ext: v90,
            maxBytes: 1024 * 1024 * 200,
            ...v86,
          }),
        );
      } catch {}
      const v91 = await fetchRemoteBlob(v87),
        v92 = _guessAudioExtFromMime(v91?.["type"]) || v90;
      return _toLocalAudioResult(
        await saveOutputBlob(v91, { ext: v92, ...v86 }),
      );
    },
  );
}
function _toLocalUrlFromSaveResult(v93) {
  return (
    localPathToUrl(v93?.["originalLocalPath"]) ||
    localPathToUrl(pickResultLocalPath(v93))
  );
}
function _normalizeImageSaveResult(v94) {
  if (!v94 || typeof v94 !== "object") return v94;
  if (!hasImageDerivativeFields(v94)) return v94;
  const v95 = buildImageNodeStorageFields(v94),
    v96 = { ...v94, ...v95 };
  return (
    !String(v96["url"] || "")["trim"]() &&
      v95["localPath"] &&
      (v96["url"] = toLocalPathUrl(v95["localPath"])),
    !String(v96["originalUrl"] || "")["trim"]() &&
      v95["originalLocalPath"] &&
      (v96["originalUrl"] = toLocalPathUrl(v95["originalLocalPath"])),
    !String(v96["displayUrl"] || "")["trim"]() &&
      v95["displayLocalPath"] &&
      (v96["displayUrl"] = toLocalPathUrl(v95["displayLocalPath"])),
    !String(v96["thumbUrl"] || "")["trim"]() &&
      v95["thumbLocalPath"] &&
      (v96["thumbUrl"] = toLocalPathUrl(v95["thumbLocalPath"])),
    v96
  );
}
function _guessImageExtFromUrl(v97) {
  const v98 = String(v97 || "")["trim"]();
  if (!v98) return "";
  try {
    const v99 = new URL(v98, window["location"]["href"]),
      v100 = String(v99["pathname"] || ""),
      v101 = v100["match"](/\.([a-z0-9]{1,5})$/i),
      v102 = (v101?.[1] || "")["toLowerCase"]();
    if (!v102) return "";
    if (v102 === "jpeg") return "jpg";
    if (v102 === "jpg") return "jpg";
    if (v102 === "png") return "png";
    if (v102 === "webp") return "webp";
    if (v102 === "gif") return "gif";
    return "";
  } catch {
    return "";
  }
}
export async function ensureLocalImageDerivatives(v103) {
  return _normalizeImageSaveResult(
    await ensureImageDerivativesToServer({ localPath: v103 }),
  );
}
export async function checkLocalMediaExists(v104) {
  return await checkLocalMediaExistsOnServer({ localPath: v104 });
}
export async function saveRemoteImageLocallyDetailed(v105, v106, v107 = {}) {
  const v108 = String(v105 || "")["trim"]();
  if (!v108) throw new Error("保存到本地失败:\x20缺少\x20remoteUrl");
  return _runRemoteSaveOnce(
    _buildRemoteSaveCacheKey("image", v108, v107),
    async () => {
      if (v108["startsWith"]("blob:") || v108["startsWith"]("data:")) {
        try {
          const v109 = await fetchRemoteBlob(v108);
          let v110 = "png";
          if (v109["type"] === "image/jpeg") v110 = "jpg";
          else {
            if (v109["type"] === "image/webp") v110 = "webp";
            else {
              if (v109["type"] === "image/png") v110 = "png";
              else {
                if (v109["type"] === "image/gif") v110 = "gif";
              }
            }
          }
          const v111 = await saveOutputBlob(v109, { ext: v110, ...v107 }),
            v112 = _toLocalUrlFromSaveResult(v111);
          if (v112) return { ...v111, localUrl: v112 };
        } catch {}
        throw new Error("保存到本地失败");
      }
      try {
        const v113 = _guessImageExtFromUrl(v108) || "png",
          v114 = await saveOutputFromUrl(v108, {
            ext: v113,
            maxBytes: 1024 * 1024 * 60,
            ...v107,
          }),
          v115 = _toLocalUrlFromSaveResult(v114);
        if (v115) return { ...v114, localUrl: v115 };
        throw new Error("保存到本地失败:\x20服务器未返回\x20url");
      } catch {}
      const v116 = await fetchRemoteBlob(v108);
      let v117 = "png";
      if (v116["type"] === "image/jpeg") v117 = "jpg";
      else {
        if (v116["type"] === "image/webp") v117 = "webp";
        else {
          if (v116["type"] === "image/png") v117 = "png";
          else {
            if (v116["type"] === "image/gif") v117 = "gif";
          }
        }
      }
      const v118 = await saveOutputBlob(v116, { ext: v117, ...v107 }),
        v119 = _toLocalUrlFromSaveResult(v118);
      if (v119) return { ...v118, localUrl: v119 };
      throw new Error("保存到本地失败");
    },
  );
}
export async function saveRemoteImageLocally(v120, v121, v122 = {}) {
  const v123 = await saveRemoteImageLocallyDetailed(v120, v121, v122);
  return (
    String(v123?.["localUrl"] || "")["trim"]() ||
    _toLocalUrlFromSaveResult(v123)
  );
}
export function exportProject(v124, v125) {
  const v126 = new Blob([JSON["stringify"](v125, null, 2)], {
      type: "application/json",
    }),
    v127 = URL["createObjectURL"](v126),
    v128 = document["createElement"]("a");
  ((v128["href"] = v127),
    (v128["download"] = v124 + ".json"),
    document["body"]["appendChild"](v128),
    v128["click"](),
    document["body"]["removeChild"](v128),
    URL["revokeObjectURL"](v127));
}
export async function importProject(v129) {
  return new Promise((v130, v131) => {
    const v132 = new FileReader();
    ((v132["onload"] = (v133) => {
      try {
        const v134 = JSON["parse"](v133["target"]["result"]),
          v135 = resolveCanvasData(v134);
        v130(v135);
      } catch (v136) {
        v131(new Error("解析 JSON 存档失败"));
      }
    }),
      (v132["onerror"] = () => v131(new Error("文件读取失败"))),
      v132["readAsText"](v129));
  });
}

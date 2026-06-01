import { buildApiUrl } from "./apiBase.js";
import {
  get as get,
  post as post,
  del as del,
  requester,
} from "./requester.js";
import { normalizeLocalPath } from "../src/utils/localMediaPath.js";
const WORKFLOWS_FALLBACK_USER_FILE = "/api/v2/user/workflows.json",
  ASSET_CATEGORIES_USER_FILE = "/api/v2/user/asset-categories.json",
  _saveOutputFromUrlInflight = new Map(),
  _saveOutputFromUrlCache = new Map(),
  SAVE_OUTPUT_FROM_URL_CACHE_LIMIT = 500;
function _rememberSavedOutput(v0, v1) {
  if (!v0 || !v1 || typeof v1 !== "object") return;
  _saveOutputFromUrlCache["set"](v0, v1);
  if (_saveOutputFromUrlCache["size"] > SAVE_OUTPUT_FROM_URL_CACHE_LIMIT) {
    const v2 = _saveOutputFromUrlCache["keys"]()["next"]()["value"];
    if (v2) _saveOutputFromUrlCache["delete"](v2);
  }
}
function _normalizeProjectFilename(v3) {
  const v4 = String(v3 || "")["trim"]();
  if (!v4) return "default_v2_project.json";
  return v4["endsWith"](".json") ? v4 : v4 + ".json";
}
function _isNotFoundError(v5) {
  return (
    Number(v5?.["status"]) === 404 ||
    /not found/i["test"](String(v5?.["message"] || ""))
  );
}
function _extractWorkflowItems(v6) {
  if (Array["isArray"](v6)) return v6;
  if (v6 && typeof v6 === "object" && Array["isArray"](v6["items"]))
    return v6["items"];
  return [];
}
function _upsertWorkflowItems(v7, v8) {
  const v9 = Array["isArray"](v7) ? [...v7] : [],
    v10 = String(v8?.["id"] || "")["trim"]();
  if (!v10) return v9;
  const v11 = v9["findIndex"](
    (v12) => String(v12?.["id"] || "")["trim"]() === v10,
  );
  return (
    v11 >= 0 ? (v9[v11] = { ...v9[v11], ...(v8 || {}) }) : v9["unshift"](v8),
    v9["sort"](
      (v13, v14) =>
        Number(v14?.["updatedAt"] || 0) - Number(v13?.["updatedAt"] || 0),
    ),
    v9
  );
}
export async function fetchV2ProjectFromServer(v15) {
  const v16 = _normalizeProjectFilename(v15),
    v17 = "/api/v2/projects/" + encodeURIComponent(v16),
    v18 = await get(v17, { allow404Null: true, provider: "local" });
  return v18;
}
export async function saveV2ProjectToServer(v19) {
  const v20 = await post("/api/v2/projects/save", v19 || {}, {
    provider: "local",
  });
  return v20;
}
export async function fetchV2ProjectsFromServer() {
  try {
    const v21 = await get("/api/v2/projects", { provider: "local" });
    return Array["isArray"](v21) ? v21 : [];
  } catch {
    return [];
  }
}
export async function deleteV2ProjectFromServer(v22) {
  const v23 = _normalizeProjectFilename(v22);
  try {
    return (
      await del("/api/v2/projects/" + encodeURIComponent(v23), {
        provider: "local",
      }),
      true
    );
  } catch {
    return false;
  }
}
export async function fetchAssetsFromServer(v24 = {}) {
  try {
    const v25 = new URLSearchParams();
    for (const [v26, v27] of Object["entries"](v24 || {})) {
      if (v27 === undefined || v27 === null || v27 === "") continue;
      v25["set"](v26, String(v27));
    }
    const v28 = v25["toString"]() ? "?" + v25["toString"]() : "",
      v29 = await get("/api/v2/assets" + v28, { provider: "local" });
    if (Array["isArray"](v29)) return v29;
    if (v29 && typeof v29 === "object" && Array["isArray"](v29["items"]))
      return v29;
    return [];
  } catch {
    return v24 && Object["keys"](v24)["length"] > 0
      ? { items: [], total: 0, nextOffset: null, hasMore: false }
      : [];
  }
}
export async function fetchOutputFilesFromServer(v30 = {}) {
  try {
    const v31 = new URLSearchParams();
    for (const [v32, v33] of Object["entries"](v30 || {})) {
      if (v33 === undefined || v33 === null || v33 === "") continue;
      v31["set"](v32, String(v33));
    }
    const v34 = v31["toString"]() ? "?" + v31["toString"]() : "",
      v35 = await get("/api/v2/output-files" + v34, { provider: "local" });
    return v35 && typeof v35 === "object" ? v35 : { items: [] };
  } catch {
    return { items: [] };
  }
}
export async function deleteOutputFilesFromServer(v36 = {}) {
  const v37 = await post("/api/v2/output-files/delete", v36 || {}, {
    provider: "local",
  });
  return v37;
}
export async function saveAssetToServer(v38) {
  const v39 = await post("/api/v2/assets/save", v38 || {}, {
    provider: "local",
  });
  return v39;
}
export async function deleteAssetFromServer(v40) {
  const v41 = v40 + ".json";
  try {
    return (
      await del("/api/v2/assets/" + encodeURIComponent(v41), {
        provider: "local",
      }),
      true
    );
  } catch {
    return false;
  }
}
export async function fetchAssetCategoriesFromServer() {
  try {
    const v42 = await get(ASSET_CATEGORIES_USER_FILE, { provider: "local" });
    if (Array["isArray"](v42)) return v42;
    if (v42 && typeof v42 === "object") {
      if (Array["isArray"](v42["categories"])) return v42["categories"];
      if (Array["isArray"](v42["items"])) return v42["items"];
    }
    return [];
  } catch {
    return [];
  }
}
export async function saveAssetCategoriesToServer(v43 = []) {
  const v44 = Array["isArray"](v43) ? v43 : [],
    v45 = await post(
      ASSET_CATEGORIES_USER_FILE,
      { version: 1, categories: v44 },
      { provider: "local" },
    );
  return v45;
}
export async function saveAssetThumbToServer(v46) {
  const v47 = String(v46?.["assetId"] ?? v46?.["id"] ?? "")["trim"](),
    v48 = String(v46?.["dataUrl"] || "");
  if (!v47) throw new Error("保存资产缩略图失败: 缺少 assetId");
  if (!v48["startsWith"]("data:image/"))
    throw new Error("保存资产缩略图失败: dataUrl 非法");
  const v49 = await post(
    "/api/v2/assets/thumb/save",
    { ...(v46 || {}), assetId: v47 },
    { provider: "local" },
  );
  return v49;
}
export async function fetchWorkflowsFromServer() {
  try {
    const v50 = await get("/api/v2/workflows", { provider: "local" });
    return Array["isArray"](v50) ? v50 : [];
  } catch (v51) {
    if (!_isNotFoundError(v51)) return [];
    try {
      const v52 = await get(WORKFLOWS_FALLBACK_USER_FILE, {
        provider: "local",
      });
      return _extractWorkflowItems(v52);
    } catch {
      return [];
    }
  }
}
async function deleteWorkflowFromFallbackFile(v53) {
  const v54 = await get(WORKFLOWS_FALLBACK_USER_FILE, { provider: "local" })[
      "catch"
    ](() => ({})),
    v55 = String(v53 || "")["trim"](),
    v56 = _extractWorkflowItems(v54)["filter"](
      (v57) => String(v57?.["id"] || "")["trim"]() !== v55,
    );
  return (
    await post(
      WORKFLOWS_FALLBACK_USER_FILE,
      { items: v56 },
      { provider: "local" },
    ),
    true
  );
}
async function saveWorkflowToFallbackFile(v58) {
  const v59 = await get(WORKFLOWS_FALLBACK_USER_FILE, { provider: "local" })[
      "catch"
    ](() => ({})),
    v60 = _upsertWorkflowItems(_extractWorkflowItems(v59), v58 || {});
  return (
    await post(
      WORKFLOWS_FALLBACK_USER_FILE,
      { items: v60 },
      { provider: "local" },
    ),
    { success: true, id: v58?.["id"] }
  );
}
export async function saveWorkflowToServer(v61) {
  try {
    const v62 = await post("/api/v2/workflows/save", v61 || {}, {
      provider: "local",
    });
    return v62;
  } catch (v63) {
    if (!_isNotFoundError(v63)) throw v63;
    return await saveWorkflowToFallbackFile(v61);
  }
}
export async function deleteWorkflowFromServer(v64) {
  const v65 = String(v64 || "")["trim"]();
  if (!v65) return false;
  const v66 = v65 + ".json";
  try {
    return (
      await del("/api/v2/workflows/" + encodeURIComponent(v66), {
        provider: "local",
      }),
      true
    );
  } catch (v67) {
    if (!_isNotFoundError(v67)) return false;
    try {
      return await deleteWorkflowFromFallbackFile(v65);
    } catch {
      return false;
    }
  }
}
export async function saveWorkflowThumbToServer(v68) {
  const v69 = String(v68?.["workflowId"] ?? v68?.["id"] ?? "")["trim"](),
    v70 = String(v68?.["dataUrl"] || "");
  if (!v69) throw new Error("保存工作流封面失败: 缺少 workflowId");
  if (!v70["startsWith"]("data:image/"))
    throw new Error("保存工作流封面失败: dataUrl 非法");
  try {
    const v71 = await post(
      "/api/v2/workflows/thumb/save",
      { ...(v68 || {}), workflowId: v69 },
      { provider: "local" },
    );
    return v71;
  } catch (v72) {
    if (!_isNotFoundError(v72)) throw v72;
    return {
      success: true,
      url: v70,
      localPath: v70,
      filename: v69 + "_cover.inline",
    };
  }
}
export async function uploadFileToServer(v73) {
  const v74 = v73?.["name"] ? String(v73["name"]) : "file",
    v75 = new FormData();
  v75["append"]("file", v73, v74);
  const v76 = await post(
    "/api/upload?filename=" + encodeURIComponent(v74),
    v75,
    { provider: "local" },
  );
  return v76;
}
export async function fetchRemoteBlob(v77, v78 = {}) {
  const v79 = await get(v77, {
    provider: "remote",
    buildUrl: false,
    responseType: "blob",
    signal: v78?.["signal"],
    timeout: v78?.["timeout"],
  });
  return v79;
}
export async function saveOutputToServer(v80, v81 = {}) {
  const v82 =
      String(v81?.["ext"] || "")
        ["trim"]()
        ["toLowerCase"]() || "bin",
    v83 = String(v81?.["subDir"] || "")["trim"](),
    v84 = String(v81?.["kind"] || "")["trim"](),
    v85 = new URLSearchParams({ ext: v82 });
  if (v83) v85["set"]("subDir", v83);
  if (v84) v85["set"]("kind", v84);
  const v86 = await post("/api/v2/save_output?" + v85["toString"](), v80, {
    provider: "local",
    headers: { "Content-Type": "application/octet-stream" },
  });
  return v86;
}
export async function saveOutputFromUrlToServer(v87) {
  const v88 = String(v87?.["url"] || "")["trim"]();
  if (!v88) throw new Error("保存到 output 失败: 缺少 url");
  const v89 = String(
      v87?.["dedupeKey"] ||
        (v87?.["taskKey"] ? v87["taskKey"] + ":" + v88 : v88),
    )["trim"](),
    v90 = v89 || v88;
  if (_saveOutputFromUrlCache["has"](v90))
    return _saveOutputFromUrlCache["get"](v90);
  if (_saveOutputFromUrlInflight["has"](v90))
    return _saveOutputFromUrlInflight["get"](v90);
  const v91 = {
      url: v88,
      ext: v87?.["ext"],
      maxBytes: v87?.["maxBytes"],
      dedupeKey: v89,
    },
    v92 = post("/api/v2/save_output_from_url", v91, { provider: "local" })[
      "then"
    ]((v93) => {
      return (_rememberSavedOutput(v90, v93), v93);
    });
  return (
    _saveOutputFromUrlInflight["set"](v90, v92),
    v92["finally"](() => {
      _saveOutputFromUrlInflight["get"](v90) === v92 &&
        _saveOutputFromUrlInflight["delete"](v90);
    })["catch"](() => {}),
    v92
  );
}
export async function cropGridTilesToServer(v94 = {}) {
  const v95 = String(v94?.["localPath"] || v94?.["path"] || "")["trim"]();
  if (!v95) throw new Error("宫格裁切失败:\x20缺少\x20localPath");
  const v96 = Math["round"](Number(v94?.["cols"]) || 0),
    v97 = Math["round"](Number(v94?.["rows"]) || 0);
  if (v96 <= 0 || v97 <= 0) throw new Error("宫格裁切失败: 网格尺寸非法");
  const v98 = {
      localPath: v95,
      cols: v96,
      rows: v97,
      ext:
        String(v94?.["ext"] || "jpg")
          ["trim"]()
          ["toLowerCase"]() || "jpg",
      quality: Number(v94?.["quality"] || 85),
    },
    v99 = String(v94?.["subDir"] || "")["trim"]();
  if (v99) v98["subDir"] = v99;
  const v100 = await post("/api/v2/grid_tiles/crop", v98, {
    provider: "local",
  });
  return v100;
}
export async function ensureImageDerivativesToServer(v101) {
  const v102 = String(v101?.["localPath"] || v101?.["path"] || "")["trim"]();
  if (!v102) throw new Error("生成图片派生文件失败: 缺少 localPath");
  const v103 = await post(
    "/api/v2/images/derivatives/ensure",
    { localPath: v102 },
    { provider: "local" },
  );
  return v103;
}
function _localPathToStaticRequestPath(v104) {
  const v105 = normalizeLocalPath(v104);
  if (!v105) return "";
  return "/" + v105["split"]("/")["map"](encodeURIComponent)["join"]("/");
}
export async function checkLocalMediaExistsOnServer(v106) {
  const v107 =
      typeof v106 === "string"
        ? v106
        : String(v106?.["localPath"] || v106?.["path"] || "")["trim"](),
    v108 = _localPathToStaticRequestPath(v107);
  if (!v108) return false;
  try {
    const v109 = await requester({
        url: v108,
        method: "HEAD",
        provider: "local",
        responseType: "text",
        allow404Null: true,
        returnMeta: true,
        timeout: 10000,
      }),
      v110 = Number(v109?.["status"] || 0);
    return v110 >= 200 && v110 < 400;
  } catch {
    return false;
  }
}

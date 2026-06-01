import { get as get, post as post } from "./requester.js";
import { processInputImages } from "./imageUploadApi.js";
import { processInputVideos } from "./videoUploadApi.js";
import { processInputAudios } from "./audioUploadApi.js";
import {
  isApimartAssetUrl,
  isApimartUploadedUrl,
  normalizeApimartBaseUrl,
} from "./apimartUploadApi.js";
const DEFAULT_APIMART_BASE_URL = "https://api.apimart.ai",
  DEFAULT_PROJECT_NAME = "default",
  DEFAULT_GROUP_NAME = "aic-seedance2-private-avatar",
  TERMINAL_SUCCESS_STATUSES = new Set([
    "completed",
    "complete",
    "succeeded",
    "success",
    "done",
  ]),
  TERMINAL_FAILED_STATUSES = new Set([
    "failed",
    "failure",
    "error",
    "rejected",
  ]);
function normalizeBaseUrl(v0) {
  return normalizeApimartBaseUrl(v0 || DEFAULT_APIMART_BASE_URL);
}
function normalizeApiKey(v1) {
  return String(v1 || "")
    ["trim"]()
    ["replace"](/^Bearer\s+/i, "");
}
function sleep(v2) {
  return new Promise((v3) => setTimeout(v3, Math["max"](0, v2 || 0)));
}
function asPlainObject(v4) {
  return v4 && typeof v4 === "object" && !Array["isArray"](v4) ? v4 : {};
}
function normalizePrivateAvatarAssetType(v5) {
  const v6 = String(v5 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (v6 === "video") return "Video";
  if (v6 === "audio") return "Audio";
  return "Image";
}
function collectObjects(v7, v8 = []) {
  if (!v7 || typeof v7 !== "object") return v8;
  if (Array["isArray"](v7))
    return (v7["forEach"]((v9) => collectObjects(v9, v8)), v8);
  v8["push"](v7);
  for (const v10 of Object["values"](v7)) {
    if (v10 && typeof v10 === "object") collectObjects(v10, v8);
  }
  return v8;
}
function pickFirstString(v11) {
  for (const v12 of v11) {
    const v13 = String(v12 || "")["trim"]();
    if (v13) return v13;
  }
  return "";
}
export function extractApimartPrivateAvatarAssetUrl(v14) {
  const v15 = asPlainObject(v14),
    v16 = asPlainObject(v15["data"]),
    v17 = asPlainObject(v16["result"] || v15["result"]),
    v18 = pickFirstString([
      v17["asset_url"],
      v17["assetUrl"],
      v16["asset_url"],
      v16["assetUrl"],
      v15["asset_url"],
      v15["assetUrl"],
    ]);
  if (v18) return v18;
  const v19 = [
    v17["usable_assets"],
    v17["usableAssets"],
    v16["usable_assets"],
    v16["usableAssets"],
    v17["assets"],
    v16["assets"],
    v15["usable_assets"],
    v15["assets"],
  ];
  for (const v20 of v19) {
    const v21 = collectObjects(v20, []);
    for (const v22 of v21) {
      const v23 = String(v22["status"] || "")
          ["trim"]()
          ["toLowerCase"](),
        v24 = pickFirstString([v22["asset_url"], v22["assetUrl"], v22["url"]]);
      if (!v24) continue;
      if (!v23 || v23 === "active" || v23 === "passed" || v23 === "success")
        return v24;
    }
  }
  return "";
}
export function extractApimartPrivateAvatarTaskId(v25) {
  const v26 = asPlainObject(v25),
    v27 = asPlainObject(v26["data"]);
  return pickFirstString([
    v27["id"],
    v27["task_id"],
    v27["taskId"],
    v26["id"],
    v26["task_id"],
    v26["taskId"],
  ]);
}
export function extractApimartPrivateAvatarTaskStatus(v28) {
  const v29 = asPlainObject(v28),
    v30 = asPlainObject(v29["data"]);
  return String(v30["status"] || v29["status"] || "")
    ["trim"]()
    ["toLowerCase"]();
}
function extractApimartPrivateAvatarError(v31) {
  const v32 = asPlainObject(v31),
    v33 = asPlainObject(v32["data"]),
    v34 = asPlainObject(v32["error"] || v33["error"]);
  return pickFirstString([
    v34["message"],
    v34["msg"],
    v33["message"],
    v33["msg"],
    v32["message"],
    v32["msg"],
  ]);
}
function assertApimartApiCodeOk(v35, v36) {
  const v37 = Number(v35?.["code"]);
  if (Number["isFinite"](v37) && v37 !== 200 && v37 !== 0)
    throw new Error(extractApimartPrivateAvatarError(v35) || v36);
}
function buildPrivateAvatarPollUrl({ baseUrl: v38, taskId: v39 }) {
  return (
    normalizeBaseUrl(v38) +
    "/v1/tasks/" +
    encodeURIComponent(v39) +
    "?language=zh"
  );
}
async function resolvePrivateAvatarInputUrl(v40, v41, v42, v43 = {}) {
  const v44 = String(v40 || "")["trim"]();
  if (!v44) throw new Error("人脸检测输入地址为空");
  if (isApimartAssetUrl(v44))
    throw new Error("该素材已经是 APIMart asset URL，无需再次人脸检测");
  if (isApimartUploadedUrl(v44)) return v44;
  const v45 = {
    provider: "apimart",
    strictUpload: true,
    compress: v42 === "Image" ? v43["compress"] !== false : false,
    apiKey: v41,
    apiUrl: v43["apiUrl"],
  };
  if (v42 === "Video") {
    const v46 = await processInputVideos([v44], v41, v45);
    return String(v46?.[0] || "")["trim"]();
  }
  if (v42 === "Audio") {
    const v47 = await processInputAudios([v44], v41, v45);
    return String(v47?.[0] || "")["trim"]();
  }
  const v48 = await processInputImages([v44], v41, v45);
  return String(v48?.[0] || "")["trim"]();
}
function sanitizePrivateAvatarAssetName(v49, v50) {
  const v51 = v50 === "Video" ? "video" : v50 === "Audio" ? "audio" : "image",
    v52 = String(v49 || v51)["trim"]();
  return v52["replace"](/[\\/:*?"<>|]/g, "_")["slice"](0, 80) || v51;
}
function assertPrivateAvatarPublicUrl(v53) {
  const v54 = String(v53 || "")["trim"]();
  if (!/^https?:\/\//i["test"](v54))
    throw new Error("APIMart 人脸检测素材未获得公网 URL，已停止提交");
  try {
    const v55 = new URL(v54)["hostname"]["toLowerCase"]();
    if (
      v55 === "localhost" ||
      v55 === "127.0.0.1" ||
      v55 === "::1" ||
      v55["endsWith"](".local")
    )
      throw new Error("APIMart 人脸检测素材仍是本地地址，已停止提交");
  } catch (v56) {
    if (v56 instanceof TypeError)
      throw new Error("APIMart 人脸检测素材 URL 无效，已停止提交");
    throw v56;
  }
}
export async function pollApimartPrivateAvatarTask({
  apiKey: v57,
  apiUrl: v58,
  taskId: v59,
  pollIntervalMs: pollIntervalMs = 2500,
  maxWaitMs: maxWaitMs = 120000,
  signal: v60,
} = {}) {
  const v61 = normalizeApiKey(v57);
  if (!v61) throw new Error("APIMART API Key 未配置");
  const v62 = String(v59 || "")["trim"]();
  if (!v62) throw new Error("APIMART 人脸检测任务 ID 为空");
  const v63 = Date["now"]();
  while (Date["now"]() - v63 <= maxWaitMs) {
    if (v60?.["aborted"]) throw new DOMException("Aborted", "AbortError");
    const v64 = buildPrivateAvatarPollUrl({ baseUrl: v58, taskId: v62 }),
      v65 = await get("/api/v2/proxy/task?apiUrl=" + encodeURIComponent(v64), {
        provider: "apimart",
        headers: { Authorization: "Bearer\x20" + v61 },
        timeout: 60000,
        signal: v60,
      });
    assertApimartApiCodeOk(v65, "APIMART 人脸检测查询失败");
    const v66 = extractApimartPrivateAvatarAssetUrl(v65),
      v67 = extractApimartPrivateAvatarTaskStatus(v65);
    if (
      v66 &&
      (TERMINAL_SUCCESS_STATUSES["has"](v67) ||
        TERMINAL_FAILED_STATUSES["has"](v67))
    )
      return { status: "passed", taskId: v62, assetUrl: v66, raw: v65 };
    if (TERMINAL_FAILED_STATUSES["has"](v67))
      throw new Error(
        extractApimartPrivateAvatarError(v65) || "APIMART\x20人脸检测未通过",
      );
    if (TERMINAL_SUCCESS_STATUSES["has"](v67))
      throw new Error("APIMART 人脸检测已完成但未返回可用 asset URL");
    await sleep(pollIntervalMs);
  }
  throw new Error("APIMART 人脸检测超时，请稍后重试");
}
export async function submitApimartSeedance2PrivateAvatar({
  apiKey: v68,
  apiUrl: v69,
  url: v70,
  name: v71,
  assetType: assetType = "Image",
  group: v72,
  groupId: v73,
  projectName: projectName = DEFAULT_PROJECT_NAME,
  poll: poll = true,
  pollIntervalMs: v74,
  maxWaitMs: v75,
  signal: v76,
} = {}) {
  const v77 = normalizeApiKey(v68);
  if (!v77) throw new Error("APIMART API Key 未配置");
  const v78 = normalizeBaseUrl(v69),
    v79 = normalizePrivateAvatarAssetType(assetType),
    v80 = await resolvePrivateAvatarInputUrl(v70, v77, v79, { apiUrl: v78 });
  if (!v80) throw new Error("APIMART 人脸检测素材上传失败");
  assertPrivateAvatarPublicUrl(v80);
  const v81 = sanitizePrivateAvatarAssetName(v71, v79),
    v82 = {
      project_name: projectName || DEFAULT_PROJECT_NAME,
      asset_type: v79,
      assets: [{ url: v80, name: v81 }],
    },
    v83 = String(v73 || "")["trim"]();
  v83
    ? (v82["group_id"] = v83)
    : (v82["group"] = {
        name:
          String(v72?.["name"] || DEFAULT_GROUP_NAME)["trim"]() ||
          DEFAULT_GROUP_NAME,
        description: String(
          v72?.["description"] ||
            "RedAI-Canvas Seedance 2.0 private avatar assets",
        )["trim"](),
      });
  const v84 = await post(
    "/api/v2/proxy/image",
    { apiUrl: v78 + "/v1/seedance2/private-avatar", apiKey: v77, ...v82 },
    { provider: "apimart", timeout: 120000, signal: v76 },
  );
  assertApimartApiCodeOk(v84, "APIMART 人脸检测提交失败");
  const v85 = extractApimartPrivateAvatarAssetUrl(v84),
    v86 = extractApimartPrivateAvatarTaskId(v84);
  if (v85)
    return {
      status: "passed",
      taskId: v86,
      assetUrl: v85,
      sourceUrl: v80,
      assetType: v79,
      raw: v84,
    };
  if (!v86) throw new Error("APIMART 人脸检测提交失败：未返回任务 ID");
  if (!poll)
    return {
      status: extractApimartPrivateAvatarTaskStatus(v84) || "processing",
      taskId: v86,
      sourceUrl: v80,
      assetType: v79,
      raw: v84,
    };
  const v87 = await pollApimartPrivateAvatarTask({
    apiKey: v77,
    apiUrl: v78,
    taskId: v86,
    pollIntervalMs: v74,
    maxWaitMs: v75,
    signal: v76,
  });
  return { ...v87, sourceUrl: v80, assetType: v79 };
}

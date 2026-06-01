import { buildApiUrl } from "./apiBase.js";
import { post as post, get as get } from "./requester.js";
import {
  isApimartReusableUrl,
  uploadVideoToApimart,
} from "./apimartUploadApi.js";
export async function uploadVideoToRunningHub(v0, v1) {
  if (!v1) throw new Error("RunningHUB API Key 未配置，无法上传视频");
  if (!v0) throw new Error("视频文件不能为空");
  const v2 = "https://www.runninghub.cn/openapi/v2/media/upload/binary",
    v3 = buildApiUrl("/api/v2/proxy/upload?apiUrl=" + encodeURIComponent(v2)),
    v4 = new FormData(),
    v5 = v0["name"] || "video.mp4";
  v4["append"]("file", v0, v5);
  const v6 = await post(v3, v4, {
    headers: { Authorization: "Bearer " + v1 },
    provider: "runninghub",
    buildUrl: false,
  });
  if (v6["code"] !== 0)
    throw new Error(
      "RunningHUB 视频上传失败: " + (v6["message"] || "未知错误"),
    );
  const v7 = v6["data"]?.["download_url"];
  if (!v7) throw new Error("RunningHUB 返回的视频URL为空");
  return v7;
}
export async function uploadVideoToApimartCdn(v8, v9 = {}) {
  if (!v8) throw new Error("视频文件不能为空");
  return await uploadVideoToApimart(v8, v9);
}
async function processInputVideosOrdered(v10, v11, v12 = {}) {
  if (!v10 || v10["length"] === 0) return [];
  const v13 = String(v12["provider"] || "runninghub")["trim"]() || "runninghub",
    v14 = v12["strictUpload"] === true,
    v15 = new Array(v10["length"])["fill"]("");
  for (let v16 = 0; v16 < v10["length"]; v16++) {
    const v17 = String(v10[v16] || "")["trim"]();
    if (!v17) continue;
    try {
      if (v13 === "runninghub" && v17["includes"]("runninghub.cn")) {
        v15[v16] = v17;
        continue;
      }
      if (v13 === "apimart" && isApimartReusableUrl(v17)) {
        v15[v16] = v17;
        continue;
      }
      const v18 = /^https?:\/\//["test"](v17)
          ? v17
          : buildApiUrl(v17["startsWith"]("/") ? v17 : "/" + v17),
        v19 = await get(v18, {
          provider: "remote",
          buildUrl: false,
          responseType: "blob",
        }),
        v20 =
          v13 === "apimart"
            ? await uploadVideoToApimart(v19, { ...v12, apiKey: v11 })
            : await uploadVideoToRunningHub(v19, v11);
      v15[v16] = v20;
    } catch (v21) {
      if (v14) throw v21;
    }
  }
  return v15;
}
export async function processInputVideos(v22, v23, v24 = {}) {
  const v25 = await processInputVideosOrdered(v22, v23, v24);
  return v25["filter"](Boolean);
}
export async function processInputVideosPreserveOrder(v26, v27, v28 = {}) {
  return await processInputVideosOrdered(v26, v27, v28);
}

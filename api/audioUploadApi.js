import { buildApiUrl } from "./apiBase.js";
import { post as post, get as get } from "./requester.js";
import {
  isApimartReusableUrl,
  uploadBlobToApimart,
} from "./apimartUploadApi.js";
export async function uploadAudioToRunningHub(v0, v1) {
  if (!v1) throw new Error("RunningHUB\x20API\x20Key\x20未配置，无法上传音频");
  if (!v0) throw new Error("音频文件不能为空");
  const v2 = "https://www.runninghub.cn/openapi/v2/media/upload/binary",
    v3 = buildApiUrl("/api/v2/proxy/upload?apiUrl=" + encodeURIComponent(v2)),
    v4 = new FormData(),
    v5 = v0["name"] || "audio.mp3";
  v4["append"]("file", v0, v5);
  const v6 = await post(v3, v4, {
    headers: { Authorization: "Bearer " + v1 },
    provider: "runninghub",
    buildUrl: false,
  });
  if (v6["code"] !== 0)
    throw new Error(
      "RunningHUB\x20音频上传失败:\x20" + (v6["message"] || "未知错误"),
    );
  const v7 = v6["data"]?.["download_url"];
  if (!v7) throw new Error("RunningHUB\x20返回的音频URL为空");
  return v7;
}
function guessAudioExtension(v8, v9 = "mp3") {
  try {
    const v10 = new URL(String(v8 || ""), "https://local.invalid"),
      v11 =
        String(v10["pathname"] || "")
          ["split"]("/")
          ["pop"]() || "",
      v12 = v11["includes"](".")
        ? v11["split"](".")["pop"]()["toLowerCase"]()
        : "";
    if (/^(mp3|wav|m4a|aac|ogg|flac|webm|mp4)$/["test"](v12)) return v12;
  } catch {}
  return v9;
}
export async function uploadAudioToApimart(v13, v14 = {}) {
  return await uploadBlobToApimart(v13, {
    ...v14,
    contentType: v14["contentType"] || v13?.["type"] || "audio/mpeg",
    fileExtension: v14["fileExtension"] || "mp3",
  });
}
async function processInputAudiosOrdered(v15, v16, v17 = {}) {
  if (!v15 || v15["length"] === 0) return [];
  const v18 = String(v17["provider"] || "runninghub")
      ["trim"]()
      ["toLowerCase"](),
    v19 = v17["strictUpload"] === true,
    v20 = new Array(v15["length"])["fill"]("");
  for (let v21 = 0; v21 < v15["length"]; v21++) {
    const v22 = String(v15[v21] || "")["trim"]();
    if (!v22) continue;
    try {
      if (v18 === "apimart") {
        if (isApimartReusableUrl(v22)) {
          v20[v21] = v22;
          continue;
        }
        const v23 = /^https?:\/\//["test"](v22)
            ? v22
            : buildApiUrl(v22["startsWith"]("/") ? v22 : "/" + v22),
          v24 = await get(v23, {
            provider: "remote",
            buildUrl: false,
            responseType: "blob",
          }),
          v25 = guessAudioExtension(v22);
        v20[v21] = await uploadAudioToApimart(v24, {
          ...v17,
          apiKey: v16,
          contentType: v24?.["type"] || "audio/mpeg",
          fileExtension: v25,
          filename: "audio." + v25,
        });
        continue;
      }
      if (v22["includes"]("runninghub.cn")) {
        v20[v21] = v22;
        continue;
      }
      const v26 = /^https?:\/\//["test"](v22)
          ? v22
          : buildApiUrl(v22["startsWith"]("/") ? v22 : "/" + v22),
        v27 = await get(v26, {
          provider: "remote",
          buildUrl: false,
          responseType: "blob",
        }),
        v28 = await uploadAudioToRunningHub(v27, v16);
      v20[v21] = v28;
    } catch (v29) {
      if (v19) throw v29;
    }
  }
  return v20;
}
export async function processInputAudios(v30, v31, v32 = {}) {
  const v33 = await processInputAudiosOrdered(v30, v31, v32);
  return v33["filter"](Boolean);
}
export async function processInputAudiosPreserveOrder(v34, v35, v36 = {}) {
  return await processInputAudiosOrdered(v34, v35, v36);
}

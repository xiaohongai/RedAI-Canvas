import { compressImage } from "../src/modules/imageUtils.js";
import { post as post, get as get } from "./requester.js";
import { resolveImageInputUploadQualityOptions } from "../src/services/imageInputUploadQualityService.js";
import {
  isApimartReusableUrl,
  uploadImageToApimart,
} from "./apimartUploadApi.js";
function _createLimiter(v0) {
  let v1 = 0;
  const v2 = [];
  return function v3(v4) {
    return new Promise((v5, v6) => {
      const v7 = () => {
        (v1++,
          Promise["resolve"]()
            ["then"](v4)
            ["then"](
              (v8) => {
                v1--;
                if (v2["length"] && v1 < v0) v2["shift"]()();
                v5(v8);
              },
              (v9) => {
                v1--;
                if (v2["length"] && v1 < v0) v2["shift"]()();
                v6(v9);
              },
            ));
      };
      if (v1 < v0) v7();
      else v2["push"](v7);
    });
  };
}
const _runLimited = _createLimiter(3),
  _inflight = new Map();
function _buildKey(v10, v11, v12) {
  const {
      compress: compress = true,
      maxDim: maxDim = 2048,
      quality: quality = 0.9,
      provider: provider = "grsai",
      preferFree: preferFree = false,
    } = v12 || {},
    v13 = Math["round"](quality * 1000),
    v14 = v11 ? 1 : 0,
    v15 = compress ? 1 : 0,
    v16 = preferFree ? 1 : 0;
  return [v10, provider, v15, maxDim, v13, v14, v16]["join"]("|");
}
function _getUploadPromise(v17, v18, v19) {
  const v20 = _buildKey(v17, v18, v19);
  let v21 = _inflight["get"](v20);
  return (
    !v21 &&
      ((v21 = _runLimited(() => _processSingle(v17, v18, v19))),
      _inflight["set"](v20, v21),
      v21["finally"](() => {
        _inflight["delete"](v20);
      })["catch"](() => {})),
    v21
  );
}
async function _processSingle(v22, v23, v24) {
  const {
    compress: compress = true,
    maxDim: maxDim = 2048,
    quality: quality = 0.9,
    provider: provider = "grsai",
    fallbackCompressOnError: fallbackCompressOnError = false,
    fallbackMaxDim: fallbackMaxDim = 2048,
    fallbackQuality: fallbackQuality = 0.9,
  } = v24 || {};
  if (provider === "runninghub" && v22["includes"]("runninghub.cn")) return v22;
  if (provider === "apimart" && isApimartReusableUrl(v22)) return v22;
  const v25 = async (v26) => {
    if (provider === "runninghub") return await uploadToRunningHub(v26, v23);
    if (provider === "apimart")
      return await uploadImageToApimart(v26, { ...(v24 || {}), apiKey: v23 });
    return await uploadImageToBed(v26, v23, v24 || {});
  };
  if (compress) {
    let v27;
    try {
      v27 = await compressImage(v22, maxDim, quality);
    } catch (v28) {
      v27 = await get(v22, {
        provider: "remote",
        buildUrl: false,
        responseType: "blob",
      });
    }
    return await v25(v27);
  }
  if (fallbackCompressOnError)
    try {
      const v29 = await get(v22, {
        provider: "remote",
        buildUrl: false,
        responseType: "blob",
      });
      return await v25(v29);
    } catch (v30) {
      const v31 = await compressImage(v22, fallbackMaxDim, fallbackQuality);
      return await v25(v31);
    }
  const v32 = await get(v22, {
    provider: "remote",
    buildUrl: false,
    responseType: "blob",
  });
  return await v25(v32);
}
async function uploadToTelegraph(v33) {
  const v34 = new FormData();
  v34["append"]("file", v33, "image.png");
  const v35 = await post("https://telegra.ph/upload", v34, {
    provider: "telegraph",
    buildUrl: false,
  });
  if (Array["isArray"](v35) && v35[0]?.["src"])
    return "https://telegra.ph" + v35[0]["src"];
  throw new Error("Telegraph\x20返回格式异常");
}
async function uploadToQiniu(v36, v37) {
  const v38 = { "Content-Type": "application/json" };
  if (v37) v38["Authorization"] = "Bearer " + v37;
  const v39 = await post(
    "https://grsai.dakka.com.cn/client/resource/newUploadTokenZH",
    { sux: "png" },
    { provider: "grsai", buildUrl: false, headers: v38 },
  );
  if (!v39["data"]) throw new Error("GRSAI 返回了无效的上传凭证");
  const { token: v40, key: v41, url: v42, domain: v43 } = v39["data"],
    v44 = new FormData();
  return (
    v44["append"]("token", v40),
    v44["append"]("key", v41),
    v44["append"]("file", v36, "image.png"),
    await post(v42, v44, { provider: "qiniu", buildUrl: false }),
    v43 + "/" + v41
  );
}
export async function uploadImageToBed(v45, v46, v47 = {}) {
  const { preferFree: preferFree = false } = v47;
  if (preferFree)
    try {
      return await uploadToTelegraph(v45);
    } catch (v48) {
      if (!v46) throw new Error("Telegraph 失败且无 GRSAI API Key 备用");
    }
  if (v46)
    try {
      return await uploadToQiniu(v45, v46);
    } catch (v49) {
      if (!preferFree) return await uploadToTelegraph(v45);
      throw v49;
    }
  return await uploadToTelegraph(v45);
}
export async function uploadToRunningHub(v50, v51) {
  if (!v51) throw new Error("RunningHUB API Key 未配置，无法上传图片");
  const v52 = "https://www.runninghub.cn/openapi/v2/media/upload/binary",
    v53 = "/api/v2/proxy/upload?apiUrl=" + encodeURIComponent(v52),
    v54 = new FormData();
  v54["append"]("file", v50, "image.png");
  const v55 = await post(v53, v54, {
      headers: { Authorization: "Bearer " + v51 },
      provider: "runninghub",
    }),
    v56 = Number(v55?.["code"]);
  if (Number["isFinite"](v56) && v56 !== 0)
    throw new Error(
      "RunningHUB 上传失败: " + getRunningHubUploadErrorMessage(v55),
    );
  const v57 = getRunningHubUploadUrl(v55);
  if (!v57) throw new Error("RunningHUB 上传失败: 未返回可用文件 URL");
  return v57;
}
function pickFirstUploadMessage(v58) {
  for (const v59 of v58) {
    if (typeof v59 === "string" && v59["trim"]()) return v59["trim"]();
  }
  return "";
}
function getRunningHubUploadErrorMessage(v60) {
  const v61 = v60?.["code"],
    v62 = pickFirstUploadMessage([
      v60?.["message"],
      v60?.["msg"],
      v60?.["errorMessage"],
      v60?.["error"],
      v60?.["data"]?.["message"],
      v60?.["data"]?.["msg"],
      v60?.["data"]?.["errorMessage"],
      v60?.["data"]?.["error"],
    ]);
  if (v62) return v61 === undefined ? v62 : v62 + " (code: " + v61 + ")";
  return v61 === undefined ? "未知错误" : "未知错误 (code: " + v61 + ")";
}
function getRunningHubUploadUrl(v63) {
  return String(
    v63?.["data"]?.["download_url"] ||
      v63?.["data"]?.["downloadUrl"] ||
      v63?.["data"]?.["fileUrl"] ||
      v63?.["data"]?.["file_url"] ||
      v63?.["data"]?.["url"] ||
      v63?.["download_url"] ||
      v63?.["downloadUrl"] ||
      v63?.["fileUrl"] ||
      v63?.["file_url"] ||
      v63?.["url"] ||
      "",
  )["trim"]();
}
async function _processInputImagesOrdered(v64, v65, v66 = {}) {
  const v67 =
      v66?.["applyInputQualityProfile"] === true
        ? resolveImageInputUploadQualityOptions(v66)
        : v66 || {},
    {
      compress: compress = true,
      maxDim: maxDim = 2048,
      quality: quality = 0.9,
      provider: provider = "grsai",
    } = v67;
  if (!v64 || v64["length"] === 0) return [];
  const v68 = {
      ...v67,
      compress: compress,
      maxDim: maxDim,
      quality: quality,
      provider: provider,
    },
    v69 = v68["strictUpload"] === true,
    v70 = new Array(v64["length"])["fill"](""),
    v71 = [];
  for (let v72 = 0; v72 < v64["length"]; v72++) {
    const v73 = String(v64[v72] || "")["trim"]();
    if (!v73) continue;
    if (provider === "runninghub" && v73["includes"]("runninghub.cn")) {
      v70[v72] = v73;
      continue;
    }
    if (provider === "apimart" && isApimartReusableUrl(v73)) {
      v70[v72] = v73;
      continue;
    }
    const v74 = _getUploadPromise(v73, v65, v68),
      v75 = v74["then"]((v76) => {
        v70[v72] = String(v76 || "")["trim"]();
      });
    v71["push"](
      v69
        ? v75
        : v75["catch"](() => {
            v70[v72] = "";
          }),
    );
  }
  if (v71["length"] > 0) {
    if (v69) await Promise["all"](v71);
    else await Promise["allSettled"](v71);
  }
  return v70;
}
export async function processInputImages(v77, v78, v79 = {}) {
  const v80 = await _processInputImagesOrdered(v77, v78, v79);
  return v80["filter"](Boolean);
}
export async function processInputImagesPreserveOrder(v81, v82, v83 = {}) {
  return await _processInputImagesOrdered(v81, v82, v83);
}

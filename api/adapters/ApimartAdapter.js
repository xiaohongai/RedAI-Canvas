import { resolveProviderRatioPayload } from "../imageRatioPolicy.js";
import {
  applyApimartPrivateAvatarAssetsToUrls,
  isApimartSeedance2PrivateAvatarModel,
} from "./apimartPrivateAvatarAssetResolver.js";
import { normalizeApimartBaseUrl } from "../apimartUploadApi.js";
const APIMART_DIMENSION_TARGET_PIXELS = Object["freeze"]({
    "1K": 1024 * 1024,
    "2K": 2048 * 2048,
    "3K": 2560 * 2560,
    "4K": 2880 * 2880,
  }),
  APIMART_DIMENSION_DEFAULT_RESOLUTION = "2K",
  APIMART_DIMENSION_ALIGN = 8,
  APIMART_DIMENSION_MIN = 512,
  APIMART_DIMENSION_MAX = 8192;
function parseRatioLabel(v0) {
  const [v1, v2] = String(v0 || "1:1")["split"](":"),
    v3 = Number["parseFloat"](v1),
    v4 = Number["parseFloat"](v2);
  if (!(v3 > 0 && v4 > 0)) return { w: 1, h: 1 };
  return { w: v3, h: v4 };
}
function alignDimension(v5) {
  const v6 =
    Math["round"](Number(v5 || 0) / APIMART_DIMENSION_ALIGN) *
    APIMART_DIMENSION_ALIGN;
  return Math["max"](
    APIMART_DIMENSION_MIN,
    Math["min"](APIMART_DIMENSION_MAX, v6),
  );
}
function resolveDimensionsByResolutionAndRatio(v7, v8) {
  const v9 = String(v7 || "")
      ["trim"]()
      ["toUpperCase"](),
    v10 =
      APIMART_DIMENSION_TARGET_PIXELS[v9] ||
      APIMART_DIMENSION_TARGET_PIXELS[APIMART_DIMENSION_DEFAULT_RESOLUTION],
    { w: v11, h: v12 } = parseRatioLabel(v8),
    v13 = v11 / v12,
    v14 = Math["sqrt"](v10 / v13),
    v15 = v14 * v13;
  return { width: alignDimension(v15), height: alignDimension(v14) };
}
function isApimartGptImage2Model(v16) {
  const v17 = String(v16 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v17 === "apimart/gpt-image-2" || v17 === "gpt-image-2";
}
function isApimartSeedanceVideoModel(v18) {
  return String(v18 || "")
    ["trim"]()
    ["replace"](/^apimart\//, "")
    ["startsWith"]("doubao-seedance-");
}
function normalizeSeedanceVideoSize(v19) {
  const v20 = String(v19 || "")["trim"]();
  if (!v20) return "16:9";
  if (v20 === "自适应" || v20["toLowerCase"]() === "auto") return "adaptive";
  if (
    v20 === "1:1" ||
    v20 === "3:4" ||
    v20 === "16:9" ||
    v20 === "4:3" ||
    v20 === "9:16" ||
    v20 === "21:9" ||
    v20 === "adaptive"
  )
    return v20;
  return "16:9";
}
function normalizeSeedanceAspectRatio(v21) {
  const v22 = String(v21 || "")["trim"]();
  if (
    v22 === "1:1" ||
    v22 === "3:4" ||
    v22 === "16:9" ||
    v22 === "4:3" ||
    v22 === "9:16" ||
    v22 === "21:9"
  )
    return v22;
  return "16:9";
}
function isPresentValue(v23) {
  return v23 !== undefined && v23 !== null && String(v23)["trim"]() !== "";
}
function normalizeGptImage2Resolution(v24) {
  const v25 = String(v24 || "")
    ["trim"]()
    ["toUpperCase"]();
  if (v25 === "1K" || v25 === "2K" || v25 === "4K") return v25["toLowerCase"]();
  return "2k";
}
export function normalizeTextModel(v26) {
  if (v26 === "apimart/gpt-5.4") return "gpt-5.4-apimart";
  if (String(v26 || "")["startsWith"]("apimart/"))
    return String(v26)["replace"](/^apimart\//, "");
  return v26;
}
export function getTextProxyApiUrl(v27) {
  return v27 + "/v1/chat/completions";
}
export async function buildImageRequest(v28, v29, v30) {
  if (!v28["model"]) throw new Error("未指定模型，无法发起图像生成请求");
  const v31 = v30["getProviderConfig"]("apimart"),
    v32 = normalizeApimartBaseUrl(v31["apiUrl"]),
    v33 = v31["apiKey"] || v28["apiKey"];
  if (!v33) throw new Error("API Key 未配置，无法发起图像生成请求");
  const v34 = await v30["processInputImages"](v28["inputUrls"], v33, {
      applyInputQualityProfile: true,
      provider: "apimart",
      strictUpload: true,
    }),
    v35 = {
      "apimart/nano-banana-2": "gemini-3.1-flash-image-preview",
      "apimart/nano-banana-pro": "gemini-3-pro-image-preview",
      "apimart/nano-banana-dot": "gemini-2.5-flash-image-preview",
      "apimart/gpt-image-2": "gpt-image-2",
      "apimart/seedream-5.0-lite": "doubao-seedream-5-0-lite",
      "apimart/seedream-4.5": "doubao-seedance-4-5",
      "apimart/seedream-4.0": "doubao-seedance-4-0",
    },
    v36 = v35[v28["model"]] || v28["model"]["replace"]("apimart/", ""),
    v37 =
      v28["model"] === "apimart/seedream-4.0" ||
      v28["model"] === "apimart/seedream-4.5" ||
      v28["model"] === "apimart/seedream-5.0-lite";
  let v38 = v28["imageSize"] || "2K";
  (v28["model"] === "apimart/seedream-4.5" ||
    v28["model"] === "apimart/seedream-5.0-lite") &&
    v38 === "1K" &&
    (v38 = "2K");
  v28["model"] === "apimart/seedream-5.0-lite" && v38 === "4K" && (v38 = "3K");
  isApimartGptImage2Model(v28["model"]) &&
    (v38 = normalizeGptImage2Resolution(v38));
  const v39 = resolveProviderRatioPayload({
      provider: "apimart",
      model: v28["model"],
      ratioLabel: v28["resolvedRatioLabel"] || v28["aspectRatio"],
      imageSize: v38,
      suppressAspectRatio: v28["suppressAspectRatio"],
    }),
    v40 = { model: v36, prompt: v29, n: 1, ...(!v37 && { resolution: v38 }) };
  if (!v28["suppressAspectRatio"] && v39?.["params"]?.["size"]) {
    if (v37) {
      const v41 = resolveDimensionsByResolutionAndRatio(
        v38,
        v39["params"]["size"],
      );
      ((v40["width"] = v41["width"]), (v40["height"] = v41["height"]));
    } else v40["size"] = v39["params"]["size"];
  }
  return (
    v34["length"] > 0 && (v40["image_urls"] = v34),
    {
      url: "/api/v2/proxy/image",
      headers: { "Content-Type": "application/json" },
      body: { apiUrl: v32 + "/v1/images/generations", apiKey: v33, ...v40 },
    }
  );
}
export async function buildVideoRequest(v42, v43, v44) {
  if (!v42["model"]) throw new Error("未指定视频模型，无法发起视频生成请求");
  const v45 = v44["getProviderConfig"]("apimart"),
    v46 = normalizeApimartBaseUrl(v45["apiUrl"]),
    v47 = v45["apiKey"] || v42["apiKey"];
  if (!v47)
    throw new Error("API Key 未配置（厂商：Apimart），无法发起视频生成请求");
  const v48 = {
      "apimart/luma-ray-v2": "luma-ray-v2",
      "apimart/kling-v1-5": "kling-v1-5-gen-video",
      "apimart/happyhorse-1.0": "happyhorse-1.0",
      "apimart/doubao-seedance-2.0-fast": "doubao-seedance-2.0-fast",
      "apimart/doubao-seedance-2.0": "doubao-seedance-2.0",
      "apimart/doubao-seedance-2.0-fast-face": "doubao-seedance-2.0-fast-face",
      "apimart/doubao-seedance-2.0-face": "doubao-seedance-2.0-face",
      "apimart/doubao-seedance-1-5-pro": "doubao-seedance-1-5-pro",
      "apimart/doubao-seedance-1-0-pro-fast": "doubao-seedance-1-0-pro-fast",
      "apimart/doubao-seedance-1-0-pro-quality":
        "doubao-seedance-1-0-pro-quality",
    },
    v49 = v48[v42["model"]] || v42["model"]["replace"]("apimart/", ""),
    v50 = isApimartSeedanceVideoModel(v49),
    v51 = v49["startsWith"]("doubao-seedance-2.0"),
    v52 = isApimartSeedance2PrivateAvatarModel(v49),
    v53 = v49 === "doubao-seedance-1-5-pro",
    v54 = v49["startsWith"]("doubao-seedance-1-0-pro-"),
    v55 = v49 === "doubao-seedance-1-0-pro-fast",
    v56 = [];
  if (Array["isArray"](v42["videos"])) v56["push"](...v42["videos"]);
  if (Array["isArray"](v42["videoUrls"])) v56["push"](...v42["videoUrls"]);
  const v57 = String(v42["videoUrl"] || "")["trim"]();
  if (v57) v56["unshift"](v57);
  const v58 = applyApimartPrivateAvatarAssetsToUrls(
    Array["from"](
      new Set(
        v56["map"]((v59) => String(v59 || "")["trim"]())["filter"](Boolean),
      ),
    ),
    v42,
    { sourceKind: "video", enabled: v52 },
  );
  if (v50 && !v51 && v58["length"] > 0)
    throw new Error("该 APIMart Seedance 模型暂不支持视频参考");
  const v60 =
    v58["length"] > 0 && (!v50 || v51) && v44["processInputVideos"]
      ? await v44["processInputVideos"](v58, v47, {
          provider: "apimart",
          strictUpload: true,
        })
      : [];
  if (v58["length"] > 0 && v60["length"] <= 0)
    throw new Error("APIMART 源视频上传失败");
  const v61 = applyApimartPrivateAvatarAssetsToUrls(
    [
      String(v42["first"] || v42["firstFrameUrl"] || "")["trim"](),
      String(v42["last"] || v42["lastFrameUrl"] || "")["trim"](),
    ]["filter"](Boolean),
    v42,
    { sourceKind: "image", enabled: v52 },
  );
  let v62 = [];
  if (v55 && v61["length"] > 1)
    throw new Error("Seedance 1.0 Pro Fast 不支持尾帧图，请切换 Quality 模型");
  if (v50 && v61["length"] > 0 && v44["processInputImages"]) {
    const v63 = await v44["processInputImages"](v61, v47, {
        applyInputQualityProfile: true,
        provider: "apimart",
        strictUpload: true,
      }),
      v64 = String(v63?.[0] || "")["trim"](),
      v65 = String(v63?.[1] || "")["trim"]();
    v62 = [
      v64 ? { url: v64, role: "first_frame" } : null,
      v65 ? { url: v65, role: "last_frame" } : null,
    ]["filter"](Boolean);
  }
  const v66 = Array["isArray"](v42["images"])
      ? v42["images"]
      : Array["isArray"](v42["inputUrls"])
        ? v42["inputUrls"]
        : [],
    v67 = applyApimartPrivateAvatarAssetsToUrls(v66, v42, {
      sourceKind: "image",
      enabled: v52,
    }),
    v68 = v50 && v62["length"] <= 0,
    v69 =
      v68 && v67["length"] > 0 && v44["processInputImages"]
        ? await v44["processInputImages"](v67, v47, {
            applyInputQualityProfile: true,
            provider: "apimart",
            strictUpload: true,
          })
        : [],
    v70 = [];
  if (Array["isArray"](v42["audios"])) v70["push"](...v42["audios"]);
  if (Array["isArray"](v42["audioUrls"])) v70["push"](...v42["audioUrls"]);
  const v71 = String(v42["audioUrl"] || "")["trim"]();
  if (v71) v70["unshift"](v71);
  const v72 = applyApimartPrivateAvatarAssetsToUrls(
    Array["from"](
      new Set(
        v70["map"]((v73) => String(v73 || "")["trim"]())["filter"](Boolean),
      ),
    ),
    v42,
    { sourceKind: "audio", enabled: v52 },
  );
  if (v50 && !v51 && v72["length"] > 0)
    throw new Error("该 APIMart Seedance 模型暂不支持音频参考");
  const v74 =
    v51 && v72["length"] > 0 && v44["processInputAudios"]
      ? await v44["processInputAudios"](v72, v47, {
          provider: "apimart",
          strictUpload: true,
        })
      : [];
  if (v50 && v72["length"] > 0 && v74["length"] <= 0)
    throw new Error("APIMART\x20源音频上传失败");
  if (v50) {
    const v75 = {
      model: v49,
      prompt: v43,
      duration: v42["duration"] || 5,
      resolution: v42["resolution"] || (v54 ? "1080p" : "720p"),
    };
    v51
      ? (v75["size"] = normalizeSeedanceVideoSize(
          v42["aspectRatio"] || v42["size"],
        ))
      : (v75["aspect_ratio"] = normalizeSeedanceAspectRatio(
          v42["aspectRatio"] || v42["aspect_ratio"],
        ));
    if (isPresentValue(v42["seed"])) v75["seed"] = v42["seed"];
    v53 &&
      (v42["audio"] === true || v42["generateAudio"] === true) &&
      (v75["audio"] = true);
    v53 && v42["camerafixed"] === true && (v75["camerafixed"] = true);
    if (v62["length"] > 0) v75["image_with_roles"] = v62;
    else {
      if (v69["length"] > 0) {
        const v76 = v51 ? 9 : v53 ? 2 : 1;
        v75["image_urls"] = v69["slice"](0, v76);
      }
    }
    return (
      v51 &&
        v62["length"] <= 0 &&
        v60["length"] > 0 &&
        (v75["video_urls"] = v60["slice"](0, 3)),
      v51 &&
        v62["length"] <= 0 &&
        v74["length"] > 0 &&
        (v75["audio_urls"] = v74["slice"](0, 3)),
      {
        url: "/api/v2/proxy/image",
        headers: { "Content-Type": "application/json" },
        body: { apiUrl: v46 + "/v1/videos/generations", apiKey: v47, ...v75 },
      }
    );
  }
  let v77 = "";
  if (v60["length"] > 0) v77 = String(v60[0] || "")["trim"]();
  else {
    if (v57 && v44["processInputVideos"]) {
      const v78 = await v44["processInputVideos"]([v57], v47, {
        provider: "apimart",
        strictUpload: true,
      });
      v77 = String(v78?.[0] || "")["trim"]();
      if (!v77) throw new Error("APIMART 源视频上传失败");
    }
  }
  const v79 =
      v42["inputUrls"] &&
      v42["inputUrls"]["length"] > 0 &&
      v44["processInputImages"]
        ? await v44["processInputImages"](v42["inputUrls"], v47, {
            applyInputQualityProfile: true,
            provider: "apimart",
            strictUpload: true,
          })
        : [],
    v80 = {
      model: v49,
      prompt: v43,
      size: v42["aspectRatio"] || "16:9",
      quality: v42["videoSize"] || "standard",
    };
  if (v42["duration"]) v80["duration"] = v42["duration"];
  if (v42["resolution"]) v80["resolution"] = v42["resolution"];
  if (v77) v80["video_url"] = v77;
  if (v79["length"] > 0) v80["image_urls"] = v79;
  return {
    url: "/api/v2/proxy/image",
    headers: { "Content-Type": "application/json" },
    body: { apiUrl: v46 + "/v1/videos/generations", apiKey: v47, ...v80 },
  };
}

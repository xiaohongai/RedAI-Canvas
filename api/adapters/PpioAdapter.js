import {
  pickClosestRatio,
  resolveProviderRatioPayload,
} from "../imageRatioPolicy.js";
const PPIO_MIN_PIXELS = 2560 * 1440,
  PPIO_MAX_PIXELS = 10404496,
  PPIO_MIN_RATIO = 1 / 16,
  PPIO_MAX_RATIO = 16,
  PPIO_ALIGN_STEP = 64,
  PPIO_DEFAULT_SIZE = "2048x2048",
  PPIO_DEFAULT_QUALITY = "2K",
  PPIO_DEFAULT_RATIO = "1:1",
  PPIO_QUALITY_PIXEL_MAP = Object["freeze"]({
    "1K": 1024 * 1024,
    "2K": 2048 * 2048,
    "3K": 2560 * 2560,
    "4K": 2880 * 2880,
  }),
  PPIO_RATIO_OPTIONS = Object["freeze"]([
    Object["freeze"]({ label: "1:1", w: 1, h: 1 }),
    Object["freeze"]({ label: "9:16", w: 9, h: 16 }),
    Object["freeze"]({ label: "16:9", w: 16, h: 9 }),
    Object["freeze"]({ label: "3:4", w: 3, h: 4 }),
    Object["freeze"]({ label: "4:3", w: 4, h: 3 }),
    Object["freeze"]({ label: "3:2", w: 3, h: 2 }),
    Object["freeze"]({ label: "2:3", w: 2, h: 3 }),
    Object["freeze"]({ label: "5:4", w: 5, h: 4 }),
    Object["freeze"]({ label: "4:5", w: 4, h: 5 }),
    Object["freeze"]({ label: "21:9", w: 21, h: 9 }),
  ]),
  PPIO_RATIO_LABEL_SET = new Set(
    PPIO_RATIO_OPTIONS["map"]((v0) => v0["label"]),
  );
function normalizePpioQuality(v1) {
  const v2 = String(v1 || "")
    ["trim"]()
    ["toUpperCase"]();
  return PPIO_QUALITY_PIXEL_MAP[v2] ? v2 : PPIO_DEFAULT_QUALITY;
}
function normalizePpioAspectRatioLabel(v3) {
  const v4 = String(v3 || "")["trim"]();
  if (!v4) return PPIO_DEFAULT_RATIO;
  const v5 = v4["replace"](/[：∶]/g, ":")["replace"](/\s+/g, ""),
    v6 = v5["toLowerCase"]();
  if (v6 === "auto" || v6 === "adaptive" || v5 === "自适应" || v5 === "默认")
    return PPIO_DEFAULT_RATIO;
  if (!v5["includes"](":")) return PPIO_DEFAULT_RATIO;
  const [v7, v8] = v5["split"](":"),
    v9 = Number["parseFloat"](v7),
    v10 = Number["parseFloat"](v8);
  if (!(v9 > 0 && v10 > 0)) return PPIO_DEFAULT_RATIO;
  const v11 = pickClosestRatio(v9, v10, PPIO_RATIO_OPTIONS);
  return PPIO_RATIO_LABEL_SET["has"](v11) ? v11 : PPIO_DEFAULT_RATIO;
}
function calculatePpioSizeFromTargetPixels(v12, v13) {
  const [v14, v15] = String(v13 || PPIO_DEFAULT_RATIO)["split"](":"),
    v16 = Number["parseFloat"](v14) || 1,
    v17 = Number["parseFloat"](v15) || 1,
    v18 = Math["max"](PPIO_MIN_RATIO, Math["min"](PPIO_MAX_RATIO, v16 / v17)),
    v19 = Math["max"](
      PPIO_MIN_PIXELS,
      Math["min"](PPIO_MAX_PIXELS, Number(v12) || PPIO_QUALITY_PIXEL_MAP["2K"]),
    );
  let v20 = Math["round"](Math["sqrt"](v19 / v18)),
    v21 = Math["round"](v20 * v18);
  return (
    (v21 = Math["max"](
      PPIO_ALIGN_STEP,
      Math["round"](v21 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP,
    )),
    (v20 = Math["max"](
      PPIO_ALIGN_STEP,
      Math["round"](v20 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP,
    )),
    v21 + "x" + v20
  );
}
function buildPpioSizeTable() {
  const v22 = Object["entries"](PPIO_QUALITY_PIXEL_MAP)["map"](([v23, v24]) => {
    const v25 = PPIO_RATIO_OPTIONS["map"]((v26) => [
      v26["label"],
      calculatePpioSizeFromTargetPixels(v24, v26["label"]),
    ]);
    return [v23, Object["freeze"](Object["fromEntries"](v25))];
  });
  return Object["freeze"](Object["fromEntries"](v22));
}
const PPIO_SIZE_TABLE = buildPpioSizeTable();
function resolvePpioSize(v27, v28) {
  const v29 = normalizePpioQuality(v27),
    v30 = normalizePpioAspectRatioLabel(v28);
  return (
    PPIO_SIZE_TABLE?.[v29]?.[v30] ||
    PPIO_SIZE_TABLE?.[PPIO_DEFAULT_QUALITY]?.[PPIO_DEFAULT_RATIO] ||
    PPIO_DEFAULT_SIZE
  );
}
async function buildPpioSeedreamRequest(v31, v32, v33, v34, v35 = {}) {
  const {
      imageField: imageField = "image",
      supportBatch: supportBatch = false,
    } = v35,
    v36 = v34["getProviderConfig"]("ppio"),
    v37 = v36["apiUrl"]["replace"](/\/+$/, ""),
    v38 = v36["apiKey"] || v32["apiKey"];
  if (!v38)
    throw new Error("PPIO\x20API\x20Key\x20未配置，无法发起图像生成请求");
  const v39 = v34["getProviderConfig"]("grsai"),
    v40 = v39["apiKey"] || v32["apiKey"],
    v41 = await v34["processInputImages"](v32["inputUrls"], v40, {
      applyInputQualityProfile: true,
      provider: "grsai",
    });
  if (v32["inputUrls"]?.["length"] > 0 && v41["length"] === 0)
    throw new Error("参考素材上传云端失败，无法继续生成");
  const v42 = resolveProviderRatioPayload({
      provider: "ppio",
      model: v32["model"],
      ratioLabel: v32["resolvedRatioLabel"] || v32["aspectRatio"],
      imageSize: v32["imageSize"],
      suppressAspectRatio: v32["suppressAspectRatio"],
    }),
    v43 = {
      prompt: v33,
      watermark: false,
      ...(!v32["suppressImageSize"] && {
        size: resolvePpioSize(
          v32["imageSize"],
          v42?.["resolvedRatioLabel"] || v32["aspectRatio"],
        ),
      }),
    };
  return (
    v31 !== "4.0" && (v43["optimize_prompt_options"] = { mode: "standard" }),
    supportBatch &&
      v32["batchSize"] &&
      v32["batchSize"] > 1 &&
      (v43["max_images"] = v32["batchSize"]),
    v41["length"] > 0 && (v43[imageField] = v41),
    {
      url: "/api/v2/proxy/image",
      headers: { "Content-Type": "application/json" },
      body: { apiUrl: v37 + "/v3/seedream-" + v31, apiKey: v38, ...v43 },
    }
  );
}
export async function buildImageRequest(v44, v45, v46) {
  if (v44["model"] === "ppio/seedream-5.0-lite")
    return buildPpioSeedreamRequest("5.0-lite", v44, v45, v46, {
      imageField: "image",
    });
  if (v44["model"] === "ppio/seedream-4.5")
    return buildPpioSeedreamRequest("4.5", v44, v45, v46, {
      imageField: "image",
    });
  if (v44["model"] === "ppio/seedream-4.0")
    return buildPpioSeedreamRequest("4.0", v44, v45, v46, {
      imageField: "images",
      supportBatch: true,
    });
  throw new Error("PPIO 暂不支持模型 " + (v44["model"] || "(未指定)"));
}
export function getTextProxyApiUrl(v47) {
  return v47 + "/openai/v1";
}

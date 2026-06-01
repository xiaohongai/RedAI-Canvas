import { get as get, post as post } from "./requester.js";
const DEFAULT_LONG_TIMEOUT = 300000;
export async function prepareSam3Matting(v0, v1 = {}) {
  return (
    await post("/api/v2/matting/sam3/prepare", v0 || {}, {
      provider: "local",
      signal: v1["signal"],
      timeout: v1["timeout"] ?? DEFAULT_LONG_TIMEOUT,
    }),
    true
  );
}
export async function fetchSam3RuntimeInfo(v2 = {}) {
  return await get("/api/v2/matting/sam3/info", {
    provider: "local",
    signal: v2["signal"],
    timeout: v2["timeout"],
  });
}
export async function segmentSam3Raw(v3, v4 = {}) {
  try {
    const v5 = await post("/api/v2/matting/sam3/segment_raw", v3 || {}, {
      provider: "local",
      signal: v4["signal"],
      timeout: v4["timeout"] ?? DEFAULT_LONG_TIMEOUT,
      responseType: "blob",
      returnMeta: true,
    });
    return {
      blob: v5?.["data"] || null,
      status: Number(v5?.["status"]) || 0,
      headers: v5?.["headers"] || null,
      contentType: String(
        v5?.["headers"]?.["get"]("Content-Type") ||
          v5?.["headers"]?.["get"]("content-type") ||
          "",
      ),
      maskWidth: Number(
        v5?.["headers"]?.["get"]("X-Mask-Width") ||
          v5?.["headers"]?.["get"]("x-mask-width") ||
          NaN,
      ),
      maskHeight: Number(
        v5?.["headers"]?.["get"]("X-Mask-Height") ||
          v5?.["headers"]?.["get"]("x-mask-height") ||
          NaN,
      ),
    };
  } catch (v6) {
    if (Number(v6?.["status"]) === 404) return null;
    throw v6;
  }
}
export async function segmentSam3(v7, v8 = {}) {
  return await post("/api/v2/matting/sam3/segment", v7 || {}, {
    provider: "local",
    signal: v8["signal"],
    timeout: v8["timeout"] ?? DEFAULT_LONG_TIMEOUT,
  });
}

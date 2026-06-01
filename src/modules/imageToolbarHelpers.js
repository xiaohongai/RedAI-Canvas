import {
  OUTPUT_RATIO_SWITCH_THRESHOLD,
  calcDisplaySizeByMedia,
  readImageNaturalSize,
  resolveInputRatioBasis,
  resolveOutputMediaSize,
  shouldSwitchToOutputRatio,
} from "../services/mediaRatioService.js";
import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../utils/localMediaPath.js";
export const RATIO_SWITCH_THRESHOLD = OUTPUT_RATIO_SWITCH_THRESHOLD;
export function normalizeLocalPathText(v0) {
  return normalizeLocalPath(v0);
}
export function resolveGridCropImageRef(v1) {
  const v2 = normalizeLocalPathText(
      v1?.["localPath"] ||
        (v1?.["images"] &&
          v1["images"][v1["mainImageIndex"] || 0]?.["localPath"]),
    ),
    v3 = v2 ? localPathToUrl(v2) : v1?.["src"] || v1?.["sourceUrl"] || "";
  return { localPath: v2, imgUrl: v3 };
}
export function toPositiveInt(v4, v5 = 0) {
  const v6 = Number(v4);
  if (!Number["isFinite"](v6) || v6 <= 0) return v5;
  return Math["max"](1, Math["round"](v6));
}
export function normalizeGridTileResult(v7 = {}, v8 = {}) {
  const v9 = pickResultLocalPath(v7),
    v10 = normalizeLocalPathText(v7["originalLocalPath"] || v9),
    v11 = normalizeLocalPathText(v7["displayLocalPath"]),
    v12 = normalizeLocalPathText(v7["thumbLocalPath"]),
    v13 = localPathToUrl(v9) || String(v7["url"] || "")["trim"](),
    v14 = toPositiveInt(v7["w"] || v7["width"] || v7["originalWidth"], v8["w"]),
    v15 = toPositiveInt(
      v7["h"] || v7["height"] || v7["originalHeight"],
      v8["h"],
    );
  return {
    ...v7,
    url: v13,
    localPath: v9,
    originalLocalPath: v10,
    displayLocalPath: v11,
    thumbLocalPath: v12,
    fileName: v7["filename"] || v7["fileName"] || v8["fileName"] || "",
    w: v14,
    h: v15,
    width: v14,
    height: v15,
    originalWidth: toPositiveInt(v7["originalWidth"], v14),
    originalHeight: toPositiveInt(v7["originalHeight"], v15),
    row: toPositiveInt(v7["row"], v8["row"] || 0),
    col: toPositiveInt(v7["col"], v8["col"] || 0),
    isEmpty: false,
  };
}
export function resolveNodeKnownMediaBasis(v16 = {}) {
  const v17 = Number(v16?.["mainImageIndex"]) || 0,
    v18 = Array["isArray"](v16?.["images"]) ? v16["images"][v17] : null;
  return resolveInputRatioBasis(
    { width: v16?.["imageWidth"], height: v16?.["imageHeight"] },
    { width: v16?.["imgWidth"], height: v16?.["imgHeight"] },
    { width: v16?.["naturalWidth"], height: v16?.["naturalHeight"] },
    { width: v16?.["originalWidth"], height: v16?.["originalHeight"] },
    { width: v18?.["imageWidth"], height: v18?.["imageHeight"] },
    { width: v18?.["width"], height: v18?.["height"] },
  );
}
export async function resolveApiInputRatioBasis(v19, v20) {
  const v21 = resolveNodeKnownMediaBasis(v19);
  if (v21["valid"]) return v21;
  const v22 = await readImageNaturalSize(v20);
  return resolveInputRatioBasis(v22 || {}, {
    width: v19?.["width"],
    height: v19?.["height"],
  });
}
export async function resolveFinalResultDisplaySize(v23, v24 = {}) {
  const v25 = await resolveOutputMediaSize(v24);
  if (
    v25 &&
    shouldSwitchToOutputRatio(
      v23["width"],
      v23["height"],
      v25["width"],
      v25["height"],
      RATIO_SWITCH_THRESHOLD,
    )
  )
    return calcDisplaySizeByMedia(v25["width"], v25["height"]);
  return calcDisplaySizeByMedia(v23["width"], v23["height"]);
}
export const RH_PENDING_CODES = new Set([804, 813]);
export const parseRhTaskId = (v26) =>
  String(
    v26?.["task_id"] ||
      v26?.["taskId"] ||
      v26?.["data"]?.["task_id"] ||
      v26?.["data"]?.["taskId"] ||
      v26?.["data"]?.["id"] ||
      v26?.["id"] ||
      "",
  )["trim"]();
export function parseRhCode(v27) {
  const v28 = Number(v27?.["code"]);
  return Number["isFinite"](v28) ? v28 : null;
}
export function extractFirstImageUrl(v29) {
  const v30 = new Set(),
    v31 = [],
    v32 = (v33) => {
      if (!v33) return;
      if (typeof v33 === "string") {
        const v34 = v33["trim"]();
        if (!v34) return;
        if (v34["startsWith"]("http://") || v34["startsWith"]("https://")) {
          !v30["has"](v34) && (v30["add"](v34), v31["push"](v34));
          return;
        }
        if (
          (v34["startsWith"]("{") && v34["endsWith"]("}")) ||
          (v34["startsWith"]("[") && v34["endsWith"]("]"))
        )
          try {
            v32(JSON["parse"](v34));
          } catch {}
        return;
      }
      if (Array["isArray"](v33)) {
        v33["forEach"](v32);
        return;
      }
      if (typeof v33 !== "object") return;
      ([
        "url",
        "imageUrl",
        "image",
        "fileUrl",
        "output",
        "download_url",
        "sourceUrl",
        "thumbUrl",
      ]["forEach"]((v35) => v32(v33[v35])),
        Object["values"](v33)["forEach"](v32));
    };
  return (v32(v29), v31[0] || "");
}

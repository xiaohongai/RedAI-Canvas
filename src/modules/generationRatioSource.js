import { getModelManifest } from "../manifests/index.js";
function toPositiveDimension(v0) {
  const v1 = Number(v0);
  return Number["isFinite"](v1) && v1 > 0 ? v1 : 0;
}
function pickPositiveDimension(...v2) {
  for (const v3 of v2) {
    const v4 = toPositiveDimension(v3);
    if (v4 > 0) return v4;
  }
  return 0;
}
function pickIndexedItem(v5, v6, v7 = "") {
  const v8 = Array["isArray"](v5) ? v5 : [];
  if (v8["length"] === 0) return null;
  const v9 = String(v7 || "")["trim"]();
  if (v9) {
    const v10 = v8["find"]((v11) => {
      const v12 =
        String(v11?.["originalLocalPath"] || "")["trim"]() ||
        String(v11?.["localPath"] || "")["trim"]() ||
        String(v11?.["videoUrl"] || "")["trim"]() ||
        String(v11?.["imageUrl"] || "")["trim"]() ||
        String(v11?.["sourceUrl"] || "")["trim"]() ||
        String(v11?.["thumbUrl"] || "")["trim"]();
      return v12 === v9;
    });
    if (v10) return v10;
  }
  const v13 = Number(v6),
    v14 = Number["isFinite"](v13) ? Math["max"](0, Math["trunc"](v13)) : 0;
  return v8[Math["min"](v14, v8["length"] - 1)] || null;
}
function normalizeSourceIndex(v15) {
  const v16 = Number(v15);
  return Number["isFinite"](v16) && v16 >= 0 ? Math["trunc"](v16) : null;
}
export function getGenerationDisplayRatioSourceConfig(v17 = {}) {
  const v18 =
      typeof v17 === "string" ? v17 : v17?.["model"] || v17?.["modelId"],
    v19 = getModelManifest(v18),
    v20 = v19?.["inputSlots"]?.["displayAspectRatioSource"];
  if (!v20 || typeof v20 !== "object" || Array["isArray"](v20)) return null;
  const v21 = Array["from"](
      new Set(
        [
          String(v20["slot"] || v20["refSlot"] || "")["trim"](),
          ...(Array["isArray"](v20["slots"]) ? v20["slots"] : []),
        ]
          ["map"]((v22) => String(v22 || "")["trim"]())
          ["filter"](Boolean),
      ),
    ),
    v23 = String(v20["kind"] || "")["trim"](),
    v24 = normalizeSourceIndex(v20["inputIndex"] ?? v20["index"]),
    v25 = normalizeSourceIndex(
      v20["fallbackIndex"] ?? v20["inputIndex"] ?? v20["index"],
    );
  if (v21["length"] === 0 && v24 === null && v25 === null) return null;
  return {
    ...(v23 ? { kind: v23 } : {}),
    ...(v21["length"] ? { slot: v21[0], slots: v21 } : {}),
    ...(v24 !== null ? { inputIndex: v24 } : {}),
    ...(v25 !== null ? { fallbackIndex: v25 } : {}),
  };
}
export function pickGenerationRatioSourceEdge(v26 = [], v27 = {}) {
  const v28 = Array["isArray"](v26) ? v26["filter"](Boolean) : [];
  if (v28["length"] === 0) return null;
  const v29 = getGenerationDisplayRatioSourceConfig(v27);
  if (!v29) return v28[0] || null;
  const v30 = Array["isArray"](v29["slots"])
    ? v29["slots"]
    : v29["slot"]
      ? [v29["slot"]]
      : [];
  for (const v31 of v30) {
    const v32 = v28["find"](
      (v33) => String(v33?.["refSlot"] || "")["trim"]() === v31,
    );
    if (v32) return v32;
  }
  const v34 =
    v29["inputIndex"] !== undefined ? v29["inputIndex"] : v29["fallbackIndex"];
  if (Number["isInteger"](v34) && v34 >= 0 && v34 < v28["length"])
    return v28[v34] || null;
  return v28[0] || null;
}
function getMainImageItem(v35, v36 = null) {
  return pickIndexedItem(
    v35?.["images"],
    v35?.["mainImageIndex"],
    v36?.["sourceMediaKey"],
  );
}
function getMainVideoItem(v37, v38 = null) {
  return pickIndexedItem(
    v37?.["videos"],
    v37?.["mainVideoIndex"],
    v38?.["sourceMediaKey"],
  );
}
function getDomMediaSizeByNodeId(v39, v40 = "img, video") {
  const v41 =
      typeof document !== "undefined" &&
      typeof document["getElementById"] === "function" &&
      v39
        ? document["getElementById"](v39)
        : null,
    v42 = v41?.["querySelector"]?.(v40),
    v43 = pickPositiveDimension(
      v42?.["naturalWidth"],
      v42?.["videoWidth"],
      v42?.["width"],
    ),
    v44 = pickPositiveDimension(
      v42?.["naturalHeight"],
      v42?.["videoHeight"],
      v42?.["height"],
    );
  return v43 > 0 && v44 > 0 ? { width: v43, height: v44 } : null;
}
export function getGenerationRatioMediaSize(
  v45 = {},
  v46 = null,
  { includeNodeFrame: includeNodeFrame = false } = {},
) {
  const v47 = getMainImageItem(v45, v46),
    v48 = getMainVideoItem(v45, v46),
    v49 = pickPositiveDimension(
      v46?.["sourceMediaW"],
      v46?.["sourceWidth"],
      v46?.["mediaWidth"],
      v47?.["originalWidth"],
      v47?.["imageWidth"],
      v47?.["width"],
      v48?.["videoWidth"],
      v48?.["originalWidth"],
      v48?.["width"],
      v45?.["originalWidth"],
      v45?.["naturalWidth"],
      v45?.["imageWidth"],
      v45?.["selectedVideoWidth"],
      v45?.["videoWidth"],
      v45?.["mediaWidth"],
      includeNodeFrame ? v45?.["width"] : 0,
    ),
    v50 = pickPositiveDimension(
      v46?.["sourceMediaH"],
      v46?.["sourceHeight"],
      v46?.["mediaHeight"],
      v47?.["originalHeight"],
      v47?.["imageHeight"],
      v47?.["height"],
      v48?.["videoHeight"],
      v48?.["originalHeight"],
      v48?.["height"],
      v45?.["originalHeight"],
      v45?.["naturalHeight"],
      v45?.["imageHeight"],
      v45?.["selectedVideoHeight"],
      v45?.["videoHeight"],
      v45?.["mediaHeight"],
      includeNodeFrame ? v45?.["height"] : 0,
    );
  return v49 > 0 && v50 > 0 ? { width: v49, height: v50 } : null;
}
export function getGenerationRatioSizeWithDom({
  nodeId: nodeId = "",
  nodeData: nodeData = {},
  edge: edge = null,
  mediaSelector: mediaSelector = "img,\x20video",
  includeNodeFrame: includeNodeFrame = false,
} = {}) {
  return (
    getGenerationRatioMediaSize(nodeData, edge, { includeNodeFrame: false }) ||
    getDomMediaSizeByNodeId(nodeId || nodeData?.["id"], mediaSelector) ||
    getGenerationRatioMediaSize(nodeData, edge, {
      includeNodeFrame: includeNodeFrame,
    })
  );
}

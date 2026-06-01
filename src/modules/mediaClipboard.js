import { fetchRemoteBlob } from "../../api/projectsV2Api.js";
import {
  convertImageBlobToPngBlob,
  convertImageUrlToPngBlob,
  isBlobLike,
  normalizeImageMimeType,
  resolveImageMimeType,
} from "../services/imagePngConversionService.js";
import { localPathToUrl, normalizeLocalPath } from "../utils/localMediaPath.js";
const IMAGE_NODE_TYPES = new Set(["source-image", "ai-image", "storyboard"]);
function pickMainItem(v0, v1) {
  if (!Array["isArray"](v0) || v0["length"] === 0) return null;
  const v2 = Number(v1),
    v3 = Number["isFinite"](v2) ? Math["max"](0, Math["trunc"](v2)) : 0;
  return v0[v3] || v0[0] || null;
}
function normalizeMediaUrl(v4) {
  const v5 = String(v4 || "")["trim"]();
  if (!v5) return "";
  if (/^(https?:|blob:|data:)/i["test"](v5)) return v5;
  const v6 = localPathToUrl(v5);
  if (v6) return v6;
  const v7 = v5["replace"](/\\/g, "/");
  if (
    /^(?:file:|javascript:)/i["test"](v7) ||
    /^[a-zA-Z]:\//["test"](v7) ||
    v7["startsWith"]("//")
  )
    return "";
  const v8 = v7["split"](/[?#]/, 1)[0]["replace"](/^\/+/, ""),
    v9 = v8["split"]("/")["filter"](Boolean);
  if (!v9["length"] || v9["some"]((v10) => v10 === "." || v10 === ".."))
    return "";
  return "/" + v9["join"]("/");
}
function normalizeLocalMediaPath(v11) {
  return normalizeLocalPath(v11);
}
function pickMediaUrl(...v12) {
  for (const v13 of v12) {
    const v14 = normalizeMediaUrl(v13);
    if (v14) return v14;
  }
  return "";
}
function pickLocalMediaPath(...v15) {
  for (const v16 of v15) {
    const v17 = normalizeLocalMediaPath(v16);
    if (v17) return v17;
  }
  return "";
}
function resolveNodeMedia(v18) {
  const v19 = String(v18?.["type"] || "")["trim"]();
  if (!IMAGE_NODE_TYPES["has"](v19))
    return { kind: "", url: "", localPath: "" };
  if (v19 === "storyboard") {
    const v20 = Array["isArray"](v18?.["cells"]) ? v18["cells"][0] : null;
    return {
      kind: "image",
      url: pickMediaUrl(
        v20?.["url"],
        v18?.["sourceUrl"],
        v18?.["imageUrl"],
        v18?.["src"],
        v18?.["localPath"],
      ),
      localPath: pickLocalMediaPath(
        v20?.["localPath"],
        v20?.["url"],
        v18?.["localPath"],
        v18?.["sourceUrl"],
        v18?.["imageUrl"],
        v18?.["src"],
      ),
    };
  }
  if (v19 === "source-image")
    return {
      kind: "image",
      url: pickMediaUrl(
        v18?.["localPath"],
        v18?.["sourceUrl"],
        v18?.["imageUrl"],
        v18?.["src"],
        v18?.["thumbUrl"],
      ),
      localPath: pickLocalMediaPath(
        v18?.["displayLocalPath"],
        v18?.["localPath"],
        v18?.["originalLocalPath"],
        v18?.["sourceUrl"],
        v18?.["imageUrl"],
        v18?.["src"],
        v18?.["thumbUrl"],
      ),
    };
  const v21 = pickMainItem(v18?.["images"], v18?.["mainImageIndex"]);
  return {
    kind: "image",
    url: pickMediaUrl(
      v21?.["localPath"],
      v21?.["sourceUrl"],
      v21?.["imageUrl"],
      v21?.["url"],
      v21?.["thumbUrl"],
      v18?.["localPath"],
      v18?.["sourceUrl"],
      v18?.["imageUrl"],
      v18?.["src"],
      v18?.["thumbUrl"],
    ),
    localPath: pickLocalMediaPath(
      v21?.["displayLocalPath"],
      v21?.["localPath"],
      v21?.["originalLocalPath"],
      v21?.["sourceUrl"],
      v21?.["imageUrl"],
      v21?.["url"],
      v21?.["thumbUrl"],
      v18?.["displayLocalPath"],
      v18?.["localPath"],
      v18?.["originalLocalPath"],
      v18?.["sourceUrl"],
      v18?.["imageUrl"],
      v18?.["src"],
      v18?.["thumbUrl"],
    ),
  };
}
function getElectronClipboardApi() {
  const v22 = globalThis?.["window"]?.["electronAPI"]?.["clipboard"];
  return v22 && typeof v22["writeImage"] === "function" ? v22 : null;
}
async function copyNodeMediaToElectronClipboard({
  url: v23,
  localPath: v24,
} = {}) {
  const v25 = getElectronClipboardApi();
  if (!v25) return null;
  const v26 = v24 || normalizeLocalMediaPath(v23);
  if (!v26) return { ok: false, reason: "no-local-path" };
  try {
    const v27 = await v25["writeImage"]({
      localPath: v26,
      text: String(v23 || v26 || ""),
    });
    if (v27?.["ok"])
      return {
        ok: true,
        kind: "image",
        mimeType: v27["mimeType"] || "image/png",
        sourceUrl: v23,
        localPath: v26,
        copyPath: "electron",
      };
    return {
      ok: false,
      reason: v27?.["reason"] || "copy-failed",
      error: v27?.["error"],
    };
  } catch (v28) {
    return { ok: false, reason: "copy-failed", error: v28 };
  }
}
async function writeImageBlobToClipboard({
  clipboard: v29,
  write: v30,
  ClipboardItemCtor: v31,
  blob: v32,
  mimeType: v33,
} = {}) {
  const v34 = normalizeImageMimeType(v33) || "image/png",
    v35 = new v31({ [v34]: v32 });
  return (await v30["call"](v29, [v35]), v34);
}
export async function copyNodeMediaToSystemClipboard(v36) {
  const { kind: v37, url: v38, localPath: v39 } = resolveNodeMedia(v36);
  if (v37 !== "image" || !v38) return { ok: false, reason: "no-media" };
  const v40 = await copyNodeMediaToElectronClipboard({
    url: v38,
    localPath: v39,
  });
  if (v40?.["ok"]) return v40;
  const v41 = globalThis?.["navigator"]?.["clipboard"],
    v42 = v41?.["write"],
    v43 = globalThis?.["ClipboardItem"];
  if (typeof v42 !== "function" || typeof v43 !== "function")
    return { ok: false, reason: "not-supported" };
  let v44 = null,
    v45 = null;
  try {
    ((v44 = await fetchRemoteBlob(v38, { timeout: 15000 })),
      !isBlobLike(v44) && (v44 = null));
  } catch (v46) {
    v45 = v46;
  }
  if (v44) {
    const v47 = resolveImageMimeType(v44, v38) || "image/png";
    try {
      const v48 = await writeImageBlobToClipboard({
        clipboard: v41,
        write: v42,
        ClipboardItemCtor: v43,
        blob: v44,
        mimeType: v47,
      });
      return {
        ok: true,
        kind: "image",
        mimeType: v48,
        sourceUrl: v38,
        copyPath: "direct",
      };
    } catch (v49) {
      v45 = v49;
    }
  }
  try {
    let v50 = null;
    v44 && (v50 = await convertImageBlobToPngBlob(v44));
    !isBlobLike(v50) && (v50 = await convertImageUrlToPngBlob(v38));
    if (!isBlobLike(v50))
      return { ok: false, reason: "copy-failed", error: v45 };
    const v51 = await writeImageBlobToClipboard({
      clipboard: v41,
      write: v42,
      ClipboardItemCtor: v43,
      blob: v50,
      mimeType: "image/png",
    });
    return {
      ok: true,
      kind: "image",
      mimeType: v51,
      sourceUrl: v38,
      copyPath: "png-fallback",
    };
  } catch (v52) {
    return { ok: false, reason: "copy-failed", error: v52 || v45 };
  }
}

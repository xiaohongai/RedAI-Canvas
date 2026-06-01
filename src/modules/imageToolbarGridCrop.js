import appStore from "../core/stores/appStore.js";
import { findAvailablePosition, generateId } from "../core/math.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../services/fileService.js";
import { cropGridTiles, saveOutputBlob } from "./project.js";
import { getNodeSpawnPrefs } from "./nodeSpawn.js";
import {
  normalizeGridTileResult,
  resolveGridCropImageRef,
  toPositiveInt,
} from "./imageToolbarHelpers.js";
const getCanvasFillColor = () =>
  getComputedStyle(document["documentElement"])
    ["getPropertyValue"]("--canvas-white")
    ["trim"]();
function getStateSnapshot() {
  return typeof appStore["getStateRaw"] === "function"
    ? appStore["getStateRaw"]()
    : appStore["getState"]();
}
function loadImageForGridCrop(v0, v1) {
  return new Promise((v2, v3) => {
    const v4 = new Image();
    ((v4["crossOrigin"] = "anonymous"),
      (v4["onload"] = () => v2(v4)),
      (v4["onerror"] = () => v3(new Error(v1))),
      (v4["src"] = v0));
  });
}
function cropLoadedImageTile({
  loadedImg: v5,
  tileW: v6,
  tileH: v7,
  col: v8,
  row: v9,
  quality: v10,
  idPrefix: v11,
  fileNamePrefix: v12,
  oneBasedFileName: oneBasedFileName = true,
  subDir: v13,
}) {
  return new Promise((v14, v15) => {
    try {
      const v16 = document["createElement"]("canvas");
      ((v16["width"] = v6), (v16["height"] = v7));
      const v17 = v16["getContext"]("2d");
      ((v17["fillStyle"] = getCanvasFillColor()),
        v17["fillRect"](0, 0, v6, v7),
        v17["drawImage"](v5, v8 * v6, v9 * v7, v6, v7, 0, 0, v6, v7),
        v16["toBlob"](
          async (v18) => {
            if (!v18) {
              v15(new Error("Canvas toBlob 失败"));
              return;
            }
            try {
              const v19 = generateId(v11),
                v20 = oneBasedFileName ? v9 + 1 : v9,
                v21 = oneBasedFileName ? v8 + 1 : v8,
                v22 = new File(
                  [v18],
                  v12 + "_" + v19 + "_" + v20 + "_" + v21 + ".jpg",
                  { type: "image/jpeg" },
                ),
                v23 = await saveOutputBlob(v22, {
                  ext: "jpg",
                  ...(v13 ? { subDir: v13 } : {}),
                });
              v14(
                normalizeGridTileResult(v23, {
                  row: v9,
                  col: v8,
                  fileName: v22["name"],
                  w: v6,
                  h: v7,
                }),
              );
            } catch (v24) {
              v15(v24);
            }
          },
          "image/jpeg",
          v10,
        ));
    } catch {
      v15(new Error("Canvas 导出受限 (CORS)"));
    }
  });
}
export async function tryCropGridTilesOnServer(v25, v26, v27, v28 = {}) {
  const { localPath: v29 } = resolveGridCropImageRef(v25);
  if (!v29) return null;
  try {
    const v30 = await cropGridTiles({
        localPath: v29,
        cols: v26,
        rows: v27,
        ext: v28["ext"] || "jpg",
        quality: v28["quality"] || 85,
        subDir: v28["subDir"] || "",
      }),
      v31 = Array["isArray"](v30?.["tiles"]) ? v30["tiles"] : [];
    if (v31["length"] !== v26 * v27) return null;
    return {
      ...v30,
      tiles: v31["map"]((v32, v33) =>
        normalizeGridTileResult(v32, {
          row: Math["floor"](v33 / v26),
          col: v33 % v26,
          w: v30["tileWidth"],
          h: v30["tileHeight"],
        }),
      ),
    };
  } catch (v34) {
    return (
      console["warn"](
        "[GridCrop]\x20server\x20crop\x20failed,\x20falling\x20back\x20to\x20browser\x20crop:",
        v34,
      ),
      null
    );
  }
}
async function cropGridTilesInBrowser({
  nodeData: v35,
  cols: v36,
  rows: v37,
  quality: v38,
  idPrefix: v39,
  fileNamePrefix: v40,
  oneBasedFileName: oneBasedFileName = true,
  subDir: subDir = "",
  fallbackTile: v41,
}) {
  const { imgUrl: v42 } = resolveGridCropImageRef(v35),
    v43 = await loadImageForGridCrop(
      v42,
      v41?.["loadErrorMessage"] || "本地原图加载失败",
    ),
    v44 = Math["floor"](v43["naturalWidth"] / v36),
    v45 = Math["floor"](v43["naturalHeight"] / v37),
    v46 = [];
  for (let v47 = 0; v47 < v37; v47++) {
    for (let v48 = 0; v48 < v36; v48++) {
      const v49 = cropLoadedImageTile({
        loadedImg: v43,
        tileW: v44,
        tileH: v45,
        col: v48,
        row: v47,
        quality: v38,
        idPrefix: v39,
        fileNamePrefix: v40,
        oneBasedFileName: oneBasedFileName,
        subDir: subDir,
      });
      v41?.["onError"]
        ? v46["push"](
            v49["catch"]((v50) =>
              v41["onError"]({
                err: v50,
                row: v47,
                col: v48,
                tileW: v44,
                tileH: v45,
              }),
            ),
          )
        : v46["push"](v49);
    }
  }
  const v51 = await Promise["all"](v46);
  return {
    tiles: v51,
    tileW: v44,
    tileH: v45,
    sourceWidth: v43["naturalWidth"],
    sourceHeight: v43["naturalHeight"],
  };
}
export async function executeGridCrop({ nodeData: v52, cols: v53, rows: v54 }) {
  const { imgUrl: v55 } = resolveGridCropImageRef(v52);
  if (!v55) throw new Error("没有可裁剪的图像");
  let v56 = null,
    v57 = 0,
    v58 = 0;
  const v59 = await tryCropGridTilesOnServer(v52, v53, v54, {
    ext: "jpg",
    quality: 88,
    subDir: "Multiple grids",
  });
  v59 &&
    ((v56 = v59["tiles"]),
    (v57 = toPositiveInt(v59["tileWidth"], v56[0]?.["w"] || 0)),
    (v58 = toPositiveInt(v59["tileHeight"], v56[0]?.["h"] || 0)));
  if (!v56)
    try {
      const v60 = await cropGridTilesInBrowser({
        nodeData: v52,
        cols: v53,
        rows: v54,
        quality: 0.88,
        idPrefix: "crop",
        fileNamePrefix: "crop",
        oneBasedFileName: true,
        subDir: "Multiple grids",
        fallbackTile: {
          loadErrorMessage: "本地文件读取失败，请检查文件是否存在",
          onError: ({
            err: v61,
            row: v62,
            col: v63,
            tileW: v64,
            tileH: v65,
          }) => {
            return (
              console["error"](
                "[GridCrop] tile " + v62 + "-" + v63 + " failed:",
                v61,
              ),
              { row: v62, col: v63, url: null, localPath: "", w: v64, h: v65 }
            );
          },
        },
      });
      ((v56 = v60["tiles"]), (v57 = v60["tileW"]), (v58 = v60["tileH"]));
    } catch (v66) {
      console["error"]("[GridCrop] load local image failed:", v55, v66);
      throw new Error("加载原图失败：本地文件可能已被移除");
    }
  const {
      direction: v67,
      spacing: v68,
      avoidOverlap: v69,
    } = getNodeSpawnPrefs(),
    v70 = getStateSnapshot(),
    v71 = v70["nodes"][v52["id"]];
  if (!v71) throw new Error("找不到原节点");
  const { width: v72, height: v73 } = getAutoMediaSizeByShortSide(v57, v58),
    v74 = 12,
    v75 = v53 * v72 + (v53 - 1) * v74,
    v76 = v54 * v73 + (v54 - 1) * v74;
  let v77, v78;
  v67 === "right"
    ? ((v77 = v71["x"] + (v71["width"] || 260) + v68),
      (v78 = v71["y"] + ((v71["height"] || 260) - v76) / 2))
    : ((v77 = v71["x"] + ((v71["width"] || 260) - v75) / 2),
      (v78 = v71["y"] + (v71["height"] || 260) + v68));
  if (v69) {
    const v79 = findAvailablePosition(
      v70["nodes"],
      v77,
      v78,
      v75,
      v76,
      v68,
      v67,
    );
    ((v77 = v79["x"]), (v78 = v79["y"]));
  }
  const v80 = [];
  return (
    v56["forEach"]((v81) => {
      const {
        row: v82,
        col: v83,
        url: v84,
        localPath: v85,
        fileName: v86,
      } = v81;
      if (!v84 || !v85) return;
      const v87 =
          "source-image-crop-" +
          Date["now"]() +
          "-" +
          v82 +
          "-" +
          v83 +
          "-" +
          Math["random"]()["toString"](36)["slice"](2, 6),
        v88 = v77 + v83 * (v72 + v74),
        v89 = v78 + v82 * (v73 + v74),
        v90 = v85["startsWith"]("/") ? v85["slice"](1) : v85;
      (appStore["addNode"](
        buildSourceMediaNodePayload({
          id: v87,
          type: "source-image",
          x: v88,
          y: v89,
          width: v72,
          height: v73,
          name: "裁剪 " + (v82 + 1) + "-" + (v83 + 1),
          src: "",
          localPath: v90,
          originalLocalPath: v81["originalLocalPath"] || v90,
          displayLocalPath: v81["displayLocalPath"] || "",
          thumbLocalPath: v81["thumbLocalPath"] || "",
          originalWidth: v81["originalWidth"] || v81["w"] || v57,
          originalHeight: v81["originalHeight"] || v81["h"] || v58,
          fileName: v86 || "",
          needsAutoResize: false,
        }),
      ),
        v80["push"](v87));
    }),
    v80["length"] > 0 &&
      (appStore["setSelectedNodes"](v80),
      window["v2FocusOnNodes"]?.([v71["id"], ...v80]),
      window["_triggerLocalCacheSave"]?.()),
    { newIds: v80, srcNode: v71 }
  );
}
export async function prepareGridCells({
  nodeData: v91,
  cols: v92,
  rows: v93,
}) {
  const { localPath: v94, imgUrl: v95 } = resolveGridCropImageRef(v91);
  if (!v95) throw new Error("没有可裁剪的图像");
  const v96 = await tryCropGridTilesOnServer(v91, v92, v93, {
    ext: "jpg",
    quality: 85,
  });
  if (v96)
    return v96["tiles"]["map"]((v97) => ({
      id: generateId("cell"),
      url: "",
      localPath: v97["localPath"],
      originalLocalPath: v97["originalLocalPath"] || v97["localPath"],
      displayLocalPath: v97["displayLocalPath"] || "",
      thumbLocalPath: v97["thumbLocalPath"] || "",
      fileName: v97["fileName"] || "",
      originalWidth: v97["originalWidth"] || v97["w"] || v96["tileWidth"],
      originalHeight: v97["originalHeight"] || v97["h"] || v96["tileHeight"],
      sourceLocalPath: v94 || "",
      sourceUrl: v94 ? "" : v95,
      sourceWidth: v96["sourceWidth"] || v96["tileWidth"] * v92,
      sourceHeight: v96["sourceHeight"] || v96["tileHeight"] * v93,
      w: v97["w"] || v96["tileWidth"],
      h: v97["h"] || v96["tileHeight"],
      row: v97["row"],
      col: v97["col"],
      isEmpty: false,
    }));
  const {
    tiles: v98,
    sourceWidth: v99,
    sourceHeight: v100,
  } = await cropGridTilesInBrowser({
    nodeData: v91,
    cols: v92,
    rows: v93,
    quality: 0.85,
    idPrefix: "tile",
    fileNamePrefix: "sb",
    oneBasedFileName: false,
    fallbackTile: { loadErrorMessage: "本地原图加载失败" },
  });
  return v98["map"]((v101) => ({
    id: generateId("cell"),
    url: "",
    localPath: v101["localPath"],
    originalLocalPath: v101["originalLocalPath"] || v101["localPath"],
    displayLocalPath: v101["displayLocalPath"] || "",
    thumbLocalPath: v101["thumbLocalPath"] || "",
    fileName: v101["fileName"] || "",
    originalWidth: v101["originalWidth"] || v101["w"],
    originalHeight: v101["originalHeight"] || v101["h"],
    sourceLocalPath: v94 || "",
    sourceUrl: v94 ? "" : v95,
    sourceWidth: v99 || v92 * v101["w"],
    sourceHeight: v100 || v93 * v101["h"],
    w: v101["w"],
    h: v101["h"],
    row: v101["row"],
    col: v101["col"],
    isEmpty: false,
  }));
}

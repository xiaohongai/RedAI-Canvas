import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../../services/fileService.js";
import {
  computeSingleNodeSnapGuides,
  computeMultiNodeSnapGuides,
  createNodeSpatialIndex,
  snapToCanvasGrid,
} from "../../core/math.js";
import {
  buildStoryboardCropRect,
  detachStoryboardCellSourceContext,
  getStoryboardCellPixelBounds,
  getStoryboardCellIndexAtWorldPoint,
  getStoryboardCellMetrics,
  getStoryboardNearestCellIndexAtWorldPoint,
  isFrozenStoryboardDisplayCell,
  isStoryboardCellEmpty,
  normalizeEmptyStoryboardCell,
  resolveStoryboardCellSourceIndex,
  resolveStoryboardCellAssetSrc,
  resolveStoryboardCellPreviewSrc,
} from "../../core/storyboardCellUtils.js";
import {
  isPerfProbeEnabled,
  recordEdgeRedrawSample,
} from "../perf/perfProbe.js";
import { collectGroupContainmentReparentOps } from "../groupMembership.js";
import { saveOutputBlob } from "../project.js";
import {
  localPathToUrl,
  normalizeLocalPath,
  pickResultLocalPath,
} from "../../utils/localMediaPath.js";
import {
  getCollageItemIndexAtWorldPoint,
  isCollageItemEmpty,
  resolveCollageItemFrames,
} from "../collage/collageFactory.js";
function _looksLikeImageRef(v0) {
  if (!v0) return false;
  const v1 = String(v0);
  if (v1["startsWith"]("data:image/")) return true;
  const v2 = v1["split"]("#")[0]["split"]("?")[0],
    v3 = v2["toLowerCase"]();
  if (
    v3["endsWith"](".mp4") ||
    v3["endsWith"](".webm") ||
    v3["endsWith"](".mov") ||
    v3["endsWith"](".mkv") ||
    v3["endsWith"](".mp3") ||
    v3["endsWith"](".wav") ||
    v3["endsWith"](".m4a") ||
    v3["endsWith"](".aac") ||
    v3["endsWith"](".ogg")
  )
    return false;
  if (
    v3["endsWith"](".png") ||
    v3["endsWith"](".jpg") ||
    v3["endsWith"](".jpeg") ||
    v3["endsWith"](".webp") ||
    v3["endsWith"](".gif") ||
    v3["endsWith"](".bmp") ||
    v3["endsWith"](".svg")
  )
    return true;
  return (
    v1["startsWith"]("http://") ||
    v1["startsWith"]("https://") ||
    v1["startsWith"]("/") ||
    v1["startsWith"]("aic-local-preview:") ||
    v1["startsWith"]("blob:")
  );
}
function _toPositiveNumber(v4, v5 = null) {
  const v6 = Number(v4);
  return Number["isFinite"](v6) && v6 > 0 ? v6 : v5;
}
function _getImagePayloadFromNode(v7, v8) {
  if (!v8) return null;
  let v9 = "",
    v10 = null,
    v11 = null,
    v12 = "",
    v13 = null,
    v14 = null,
    v15 = null,
    v16 = "",
    v17 = null,
    v18 = null,
    v19 = null,
    v20 = null,
    v21 = false,
    v22 = false,
    v23 = "",
    v24 = null,
    v25 = "",
    v26 = null,
    v27 = "";
  if (Array["isArray"](v8["images"]) && v8["images"]["length"] > 0) {
    let v28 =
      typeof v8["mainImageIndex"] === "number" ? v8["mainImageIndex"] : 0;
    if (v28 < 0 || v28 >= v8["images"]["length"]) v28 = 0;
    const v29 = v8["images"][v28] || {};
    ((v21 =
      v29["storyboardSourceCrop"] === true ||
      !!v29["sourceLocalPath"] ||
      !!v29["sourceUrl"]),
      (v22 =
        v29["storyboardExtractedCell"] === true ||
        v8["storyboardExtractedCell"] === true));
    const v30 = v29["storyboardSourceIndex"] ?? v8["storyboardSourceIndex"],
      v31 = Number(v30);
    (Number["isInteger"](v31) && v31 >= 0 && (v24 = v31),
      (v25 = String(
        v29["storyboardSourceNodeId"] || v8["storyboardSourceNodeId"] || "",
      )["trim"]()),
      (v26 =
        v29["storyboardSourceLocalPath"] ||
        v8["storyboardSourceLocalPath"] ||
        null),
      (v27 = v29["storyboardSourceUrl"] || v8["storyboardSourceUrl"] || ""),
      (v23 = v29["capturePreviewUrl"] || v8["capturePreviewUrl"] || ""),
      (v9 = v29["imageUrl"] || v29["url"] || v23 || ""),
      (v10 = v29["localPath"] || null),
      (v11 = v29["thumbLocalPath"] || null),
      (v12 = v29["thumbUrl"] || ""),
      (v13 = v29["thumbId"] || null),
      (v14 = v29["sourceId"] || null),
      (v19 = v29["imageWidth"] || v29["width"] || v8["imageWidth"] || null),
      (v20 = v29["imageHeight"] || v29["height"] || v8["imageHeight"] || null),
      v21 &&
        ((v15 = v29["sourceLocalPath"] || null),
        (v16 = v29["sourceUrl"] || ""),
        (v17 = v29["sourceWidth"] || null),
        (v18 = v29["sourceHeight"] || null)));
  } else {
    ((v21 =
      v8["storyboardSourceCrop"] === true ||
      !!v8["sourceLocalPath"] ||
      !!v8["sourceUrl"]),
      (v22 = v8["storyboardExtractedCell"] === true));
    const v32 = Number(v8["storyboardSourceIndex"]);
    (Number["isInteger"](v32) && v32 >= 0 && (v24 = v32),
      (v25 = String(v8["storyboardSourceNodeId"] || "")["trim"]()),
      (v26 = v8["storyboardSourceLocalPath"] || null),
      (v27 = v8["storyboardSourceUrl"] || ""),
      (v23 =
        v8["capturePreviewUrl"] ||
        (String(v8["src"] || "")["startsWith"]("data:image/")
          ? v8["src"]
          : "")),
      (v9 = v8["imageUrl"] || v8["src"] || v23 || ""),
      (v10 = v8["localPath"] || null),
      (v11 = v8["thumbLocalPath"] || null),
      (v12 = v8["thumbUrl"] || ""),
      (v13 = v8["thumbId"] || null),
      (v14 = v8["sourceId"] || null),
      (v19 = v8["imageWidth"] || null),
      (v20 = v8["imageHeight"] || null),
      v21 &&
        ((v15 = v8["sourceLocalPath"] || null),
        (v16 = v8["sourceUrl"] || ""),
        (v17 = v8["sourceWidth"] || null),
        (v18 = v8["sourceHeight"] || null)));
  }
  if (!v9 && !v10 && !v11 && !v12 && !v13 && !v14 && !v23 && !v15 && !v16)
    return null;
  if (v7(v8, "source-image")) {
    if (v13 || v14)
      return {
        url: v9,
        localPath: v10,
        thumbLocalPath: v11,
        thumbUrl: v12,
        thumbId: v13,
        sourceId: v14,
        sourceLocalPath: v15,
        sourceUrl: v16,
        sourceWidth: v17,
        sourceHeight: v18,
        imageWidth: v19,
        imageHeight: v20,
        storyboardSourceCrop: v21,
        storyboardExtractedCell: v22,
        capturePreviewUrl: v23,
        storyboardSourceIndex: v24,
        storyboardSourceNodeId: v25,
        storyboardSourceLocalPath: v26,
        storyboardSourceUrl: v27,
      };
  }
  if (
    !_looksLikeImageRef(v12) &&
    !_looksLikeImageRef(v11) &&
    !_looksLikeImageRef(v10) &&
    !_looksLikeImageRef(v9) &&
    !_looksLikeImageRef(v23) &&
    !_looksLikeImageRef(v15) &&
    !_looksLikeImageRef(v16)
  )
    return null;
  return {
    url: v9,
    localPath: v10,
    thumbLocalPath: v11,
    thumbUrl: v12,
    thumbId: v13,
    sourceId: v14,
    sourceLocalPath: v15,
    sourceUrl: v16,
    sourceWidth: v17,
    sourceHeight: v18,
    imageWidth: v19,
    imageHeight: v20,
    storyboardSourceCrop: v21,
    storyboardExtractedCell: v22,
    capturePreviewUrl: v23,
    storyboardSourceIndex: v24,
    storyboardSourceNodeId: v25,
    storyboardSourceLocalPath: v26,
    storyboardSourceUrl: v27,
  };
}
function _isCellEmpty(v33) {
  return isStoryboardCellEmpty(v33);
}
function _getStoryboardCellDisplaySrc(v34) {
  if (isFrozenStoryboardDisplayCell(v34))
    return (
      resolveStoryboardCellPreviewSrc(v34) || resolveStoryboardCellAssetSrc(v34)
    );
  const v35 = _getStoryboardCellSourceImageUrl(v34);
  if (v35) return v35;
  return resolveStoryboardCellPreviewSrc(v34);
}
function _getStoryboardCellExtractFallback(v36, v37 = false) {
  const v38 = resolveStoryboardCellAssetSrc(v36);
  if (!v38) return { src: "", capturePreviewUrl: "", localPath: null };
  const v39 = String(v36?.["capturePreviewUrl"] || "")["trim"]();
  if (v39["startsWith"]("data:image/"))
    return { src: v39, capturePreviewUrl: v39, localPath: null };
  if (
    !v37 ||
    v36?.["storyboardPiece"] === true ||
    v36?.["storyboardLockedCell"] === true ||
    v36?.["storyboardExtractedCell"] === true
  )
    return {
      src: v38,
      capturePreviewUrl: "",
      localPath: v36?.["localPath"] || v36?.["thumbLocalPath"] || null,
    };
  return { src: "", capturePreviewUrl: "", localPath: null };
}
function _normalizeLocalImageUrl(v40) {
  const v41 = String(v40 || "")["trim"]();
  if (!v41) return "";
  if (/^(?:https?:|blob:|data:)/i["test"](v41)) return v41;
  if (v41["startsWith"]("/")) return v41;
  return "/" + v41["replace"](/^\/+/, "");
}
function _isSameImageSrc(v42, v43) {
  const v44 = String(v43 || "")["trim"]();
  if (!v44) return true;
  const v45 = String(v42 || "")["trim"]();
  if (!v45) return false;
  if (v45 === v44) return true;
  return _normalizeLocalImageUrl(v45) === _normalizeLocalImageUrl(v44);
}
function _getStoryboardCellSourceImageUrl(v46) {
  if (!v46 || typeof v46 !== "object") return "";
  if (isStoryboardCellEmpty(v46)) return "";
  const v47 =
    _normalizeLocalImageUrl(v46["sourceLocalPath"]) ||
    _normalizeLocalImageUrl(v46["sourceUrl"]);
  if (v47) return v47;
  return "";
}
function _getStoryboardNodeSourceImageUrl(v48) {
  return (
    _normalizeLocalImageUrl(v48?.["storyboardSourceLocalPath"]) ||
    _normalizeLocalImageUrl(v48?.["storyboardSourceUrl"]) ||
    _normalizeLocalImageUrl(v48?.["storyboardBackdropLocalPath"]) ||
    _normalizeLocalImageUrl(v48?.["storyboardBackdropUrl"]) ||
    _normalizeLocalImageUrl(v48?.["sourceLocalPath"]) ||
    _normalizeLocalImageUrl(v48?.["sourceUrl"])
  );
}
function _getStoryboardNodeSourceContext(v49) {
  let v50 =
      v49?.["storyboardSourceLocalPath"] ||
      v49?.["storyboardBackdropLocalPath"] ||
      v49?.["sourceLocalPath"] ||
      null,
    v51 = v50
      ? ""
      : String(
          v49?.["storyboardSourceUrl"] ||
            v49?.["storyboardBackdropUrl"] ||
            v49?.["sourceUrl"] ||
            "",
        )["trim"]();
  if (!v50 && !v51) {
    const v52 = Array["isArray"](v49?.["cells"]) ? v49["cells"] : [];
    for (const v53 of v52) {
      const v54 = v53?.["sourceLocalPath"] || null,
        v55 = String(v53?.["sourceUrl"] || "")["trim"]();
      if (!v54 && !v55) continue;
      ((v50 = v54), (v51 = v54 ? "" : v55));
      break;
    }
  }
  return { sourceLocalPath: v50 || null, sourceUrl: v51 };
}
function _resolveStoryboardReplayDropContext(v56, v57) {
  if (!v56 || !v57) return { isReplay: false };
  const v58 = Number(v56["storyboardSourceIndex"]);
  if (!Number["isInteger"](v58) || v58 < 0) return { isReplay: false };
  const v59 = String(v56["storyboardSourceNodeId"] || "")["trim"](),
    v60 =
      _normalizeLocalImageUrl(v56["storyboardSourceLocalPath"]) ||
      _normalizeLocalImageUrl(v56["storyboardSourceUrl"]),
    v61 = _getStoryboardNodeSourceImageUrl(v57),
    v62 = !!(v59 && v59 === String(v57["id"])),
    v63 = !!(v60 && v61 && v60 === v61);
  if (!v62 && !v63) return { isReplay: false };
  const v64 = _getStoryboardNodeSourceContext(v57);
  return {
    isReplay: true,
    sourceIndex: v58,
    sourceLocalPath: v64["sourceLocalPath"],
    sourceUrl: v64["sourceUrl"],
    sourceWidth:
      Number(v57["storyboardSourceWidth"] || v57["sourceWidth"]) || null,
    sourceHeight:
      Number(v57["storyboardSourceHeight"] || v57["sourceHeight"]) || null,
  };
}
function _getStoryboardPieceSourceImageUrl(v65, v66) {
  if (isFrozenStoryboardDisplayCell(v65)) return "";
  const v67 = _getStoryboardCellSourceImageUrl(v65);
  if (v67) return v67;
  if (!v65 || typeof v65 !== "object" || isStoryboardCellEmpty(v65)) return "";
  if (v65["storyboardPiece"] === true)
    return _getStoryboardNodeSourceImageUrl(v66);
  return "";
}
function _getStoryboardCellInfoAt(v68, v69, v70, v71 = {}) {
  for (const v72 of Object["values"](v70)) {
    if (v72["type"] !== "storyboard") continue;
    let v73 = getStoryboardCellIndexAtWorldPoint(v72, v68, v69);
    v73 < 0 &&
      v71["nearestInGap"] === true &&
      (v73 = getStoryboardNearestCellIndexAtWorldPoint(v72, v68, v69));
    if (v73 >= 0) return { nodeId: v72["id"], cellIndex: v73 };
  }
  return null;
}
function _getLastHoveredStoryboardCellInfo(v74, v75, v76, v77) {
  const v78 = v74?.["lastHoverNodeId"] || null,
    v79 = Number(v74?.["lastHoverCellIndex"]);
  if (!v78 || !Number["isInteger"](v79) || v79 < 0) return null;
  if (v74?.["lastHoverKind"] && v74["lastHoverKind"] !== "storyboard")
    return null;
  const v80 = v77?.[v78];
  if (!v80 || v80["type"] !== "storyboard") return null;
  const v81 = getStoryboardCellMetrics(v80),
    v82 = v81["cols"] * v81["rows"];
  if (v79 >= v82) return null;
  const v83 = Number(v80["x"]) || 0,
    v84 = Number(v80["y"]) || 0,
    v85 = Math["max"](
      8,
      Math["min"](40, (Number(v80["gridGap"]) || 0) / 2 + 8),
    );
  if (
    v75 < v83 - v85 ||
    v75 > v83 + v81["width"] + v85 ||
    v76 < v84 - v85 ||
    v76 > v84 + v81["height"] + v85
  )
    return null;
  return { nodeId: v78, cellIndex: v79 };
}
function _getCollageSlotInfoAt(v86, v87, v88) {
  for (const v89 of Object["values"](v88)) {
    if (v89["type"] !== "collage") continue;
    const v90 = getCollageItemIndexAtWorldPoint(v89, v86, v87);
    if (v90 >= 0) return { nodeId: v89["id"], itemIndex: v90 };
  }
  return null;
}
function _getCollageItemFrameInfo(v91, v92) {
  return (
    resolveCollageItemFrames(v91)["find"]((v93) => v93["index"] === v92) || null
  );
}
function _getCollageItemCenterWorldPoint(v94, v95) {
  const v96 = _getCollageItemFrameInfo(v94, v95),
    v97 = v96?.["frame"];
  if (!v97)
    return {
      x: (Number(v94?.["x"]) || 0) + (Number(v94?.["width"]) || 1) / 2,
      y: (Number(v94?.["y"]) || 0) + (Number(v94?.["height"]) || 1) / 2,
    };
  return {
    x: (Number(v94?.["x"]) || 0) + v97["x"] + v97["width"] / 2,
    y: (Number(v94?.["y"]) || 0) + v97["y"] + v97["height"] / 2,
  };
}
function _clearStoryboardHighlight(v98) {
  if (!v98) return;
  const v99 = window["v2Renderer"]?.["nodeInstances"]?.["get"](v98);
  if (v99 && typeof v99["highlightCell"] === "function")
    v99["highlightCell"](-1);
}
function _clearDropSlotHighlight(v100) {
  if (!v100) return;
  const v101 = window["v2Renderer"]?.["nodeInstances"]?.["get"](v100);
  if (v101 && typeof v101["highlightCell"] === "function")
    v101["highlightCell"](-1);
  if (v101 && typeof v101["highlightSlot"] === "function")
    v101["highlightSlot"](-1);
}
function _highlightDropSlot(v102, v103, v104) {
  if (!v102) return;
  const v105 = window["v2Renderer"]?.["nodeInstances"]?.["get"](v102);
  if (
    v103 === "storyboard" &&
    v105 &&
    typeof v105["highlightCell"] === "function"
  )
    v105["highlightCell"](v104);
  else
    v103 === "collage" &&
      v105 &&
      typeof v105["highlightSlot"] === "function" &&
      v105["highlightSlot"](v104);
}
function _worldToScreen(v106, v107, v108) {
  const { x: v109, y: v110, zoom: v111 } = v108;
  return { x: v106 * v111 + v109, y: v107 * v111 + v110 };
}
function _getStoryboardCellCenterWorldPoint(v112, v113) {
  const v114 = getStoryboardCellMetrics(v112),
    v115 = getStoryboardCellPixelBounds(v112, v113);
  if (v115)
    return {
      x: (Number(v112?.["x"]) || 0) + v115["x0"] + v115["width"] / 2,
      y: (Number(v112?.["y"]) || 0) + v115["y0"] + v115["height"] / 2,
    };
  const v116 = v113 % v114["cols"],
    v117 = Math["floor"](v113 / v114["cols"]);
  return {
    x:
      (Number(v112?.["x"]) || 0) +
      v114["inset"] +
      v116 * (v114["cellWidth"] + v114["gap"]) +
      v114["cellWidth"] / 2,
    y:
      (Number(v112?.["y"]) || 0) +
      v114["inset"] +
      v117 * (v114["cellHeight"] + v114["gap"]) +
      v114["cellHeight"] / 2,
  };
}
const _storyboardSourceImageCache = new Map();
function _isLoadedImageElement(v118) {
  if (!v118 || v118["complete"] !== true) return false;
  const v119 = Math["trunc"](Number(v118["naturalWidth"]) || 0),
    v120 = Math["trunc"](Number(v118["naturalHeight"]) || 0);
  return v119 > 0 && v120 > 0;
}
function _rememberStoryboardSourceImage(v121, v122) {
  const v123 = String(v121 || "")["trim"]();
  if (!v123 || !_isLoadedImageElement(v122)) return;
  _storyboardSourceImageCache["set"](v123, v122);
}
function _getCachedStoryboardSourceImage(v124) {
  const v125 = String(v124 || "")["trim"]();
  if (!v125) return null;
  const v126 = _storyboardSourceImageCache["get"](v125) || null;
  if (_isLoadedImageElement(v126)) return v126;
  return (_storyboardSourceImageCache["delete"](v125), null);
}
function _getLoadedStoryboardSourceImage(v127, v128, v129 = "") {
  if (typeof document === "undefined") return null;
  const v130 = document["getElementById"]("cell-" + v127 + "-" + v128),
    v131 = v130?.["querySelector"]?.("img.storyboard-cell-img--source-crop"),
    v132 = String(v129 || "")["trim"]();
  if (_isLoadedImageElement(v131)) {
    const v133 = String(
      v131["getAttribute"]?.("src") || v131["currentSrc"] || v131["src"] || "",
    )["trim"]();
    if (!v132 || !v133 || v133 === v132)
      return (_rememberStoryboardSourceImage(v129, v131), v131);
  }
  const v134 = document["getElementById"]("sb-node-" + v127),
    v135 = v134?.["querySelector"]?.(".storyboard-source-backdrop");
  if (!_isLoadedImageElement(v135)) return null;
  if (v132) {
    const v136 = String(
      v135["getAttribute"]?.("src") || v135["currentSrc"] || v135["src"] || "",
    )["trim"]();
    if (v136 && v136 !== v132) return null;
  }
  return (_rememberStoryboardSourceImage(v129, v135), v135);
}
function _buildStoryboardSourceCropExtractFromImage(
  v137,
  v138,
  v139,
  v140,
  v141 = v138,
) {
  if (
    !v139 ||
    typeof document === "undefined" ||
    typeof document["createElement"] !== "function"
  )
    return null;
  const v142 = Math["max"](1, Math["trunc"](Number(v139["naturalWidth"]) || 0)),
    v143 = Math["max"](1, Math["trunc"](Number(v139["naturalHeight"]) || 0)),
    v144 = buildStoryboardCropRect(v137, v141, {
      width: v142,
      height: v143,
      inset: 0,
    });
  if (!v144 || v144["sw"] <= 0 || v144["sh"] <= 0) return null;
  const v145 = v144["sx"],
    v146 = v144["sy"],
    v147 = v144["sw"],
    v148 = v144["sh"],
    v149 = document["createElement"]("canvas");
  ((v149["width"] = v147), (v149["height"] = v148));
  const v150 = v149["getContext"]("2d", { alpha: false });
  if (!v150) return null;
  try {
    ((v150["imageSmoothingEnabled"] = true),
      (v150["imageSmoothingQuality"] = "high"),
      v150["drawImage"](v139, v145, v146, v147, v148, 0, 0, v147, v148));
    const v151 = v149["toDataURL"]("image/jpeg", 0.9);
    if (!String(v151 || "")["startsWith"]("data:image/")) return null;
    return {
      canvas: v149,
      dataUrl: v151,
      fileName: v140,
      width: v147,
      height: v148,
      sourceWidth: v142,
      sourceHeight: v143,
    };
  } catch {
    return null;
  }
}
function _buildStoryboardSourceCropExtract(v152, v153, v154, v155) {
  const v156 = _getStoryboardPieceSourceImageUrl(v154, v152);
  if (!v156) return null;
  const v157 = resolveStoryboardCellSourceIndex(v154, v153, v152),
    v158 =
      _getLoadedStoryboardSourceImage(v152?.["id"], v153, v156) ||
      _getCachedStoryboardSourceImage(v156);
  if (!v158) return null;
  return _buildStoryboardSourceCropExtractFromImage(
    v152,
    v153,
    v158,
    v155,
    v157,
  );
}
function _getStoryboardCellPositionPatch(v159, v160) {
  return {
    col: v160 % Math["max"](1, Number(v159?.["cols"]) || 1),
    row: Math["floor"](v160 / Math["max"](1, Number(v159?.["cols"]) || 1)),
  };
}
function _getStoryboardCellSourceIndexPatch(v161, v162, v163) {
  return {
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(v161, v163, v162),
  };
}
function _cloneStoryboardCellForGridPosition(v164, v165, v166) {
  return {
    ...(v164 && typeof v164 === "object" ? v164 : {}),
    ..._getStoryboardCellSourceIndexPatch(v164, v165, v166),
    ..._getStoryboardCellPositionPatch(v165, v166),
  };
}
function _buildLockedStoryboardCellFromCrop(v167, v168, v169, v170) {
  if (!v170?.["dataUrl"]) return null;
  return detachStoryboardCellSourceContext(
    {
      ...(v167 && typeof v167 === "object" ? v167 : {}),
      ..._getStoryboardCellSourceIndexPatch(v167, v168, v169),
      ..._getStoryboardCellPositionPatch(v168, v169),
      url: "",
      localPath: null,
      originalLocalPath: null,
      displayLocalPath: "",
      thumbLocalPath: "",
      thumbUrl: "",
      thumbId: null,
      capturePreviewUrl: v170["dataUrl"],
      fileName: v170["fileName"] || "",
      originalWidth: v170["width"],
      originalHeight: v170["height"],
      imageWidth: v170["width"],
      imageHeight: v170["height"],
      w: v170["width"],
      h: v170["height"],
      sourceWidth: v170["sourceWidth"] || v167?.["sourceWidth"] || null,
      sourceHeight: v170["sourceHeight"] || v167?.["sourceHeight"] || null,
      storyboardLockedCell: true,
      storyboardExtractedCell: false,
      isEmpty: false,
    },
    { locked: true, extracted: false },
  );
}
function _trimStoryboardImageRef(v171) {
  return String(v171 || "")["trim"]();
}
function _isDataImageRef(v172) {
  return _trimStoryboardImageRef(v172)["startsWith"]("data:image/");
}
function _getDataImageExtension(v173) {
  const v174 =
    String(v173 || "")
      ["match"](/^data:(image\/[a-z0-9.+-]+)[;,]/i)?.[1]
      ?.["toLowerCase"]() || "";
  if (v174["includes"]("png")) return "png";
  if (v174["includes"]("webp")) return "webp";
  if (v174["includes"]("gif")) return "gif";
  return "jpg";
}
function _dataImageUrlToBlob(v175) {
  const v176 = _trimStoryboardImageRef(v175),
    v177 = v176["match"](/^data:([^;,]+)?(;base64)?,(.*)$/i);
  if (!v177 || typeof Blob !== "function") return null;
  const v178 = v177[1] || "image/jpeg",
    v179 = !!v177[2],
    v180 = v177[3] || "";
  if (v179) {
    if (typeof atob !== "function") return null;
    try {
      const v181 = atob(v180),
        v182 = new Uint8Array(v181["length"]);
      for (let v183 = 0; v183 < v181["length"]; v183 += 1) {
        v182[v183] = v181["charCodeAt"](v183);
      }
      return new Blob([v182], { type: v178 });
    } catch {
      return null;
    }
  }
  try {
    return new Blob([decodeURIComponent(v180)], { type: v178 });
  } catch {
    return null;
  }
}
function _isNonLocalImageRef(v184) {
  return /^(?:https?:|blob:|data:|aic-local-preview:)/i["test"](
    _trimStoryboardImageRef(v184),
  );
}
function _toStoredStoryboardLocalPath(v185) {
  const v186 = _trimStoryboardImageRef(v185);
  if (!v186 || _isNonLocalImageRef(v186)) return null;
  return v186["replace"](/^\/+/, "") || null;
}
function _isSameStoryboardImageRef(v187, v188) {
  const v189 = _trimStoryboardImageRef(v187),
    v190 = _trimStoryboardImageRef(v188);
  if (!v189 || !v190) return false;
  if (v189 === v190) return true;
  return _normalizeLocalImageUrl(v189) === _normalizeLocalImageUrl(v190);
}
function _isStoryboardPayloadSourceContextRef(v191, v192) {
  const v193 = _trimStoryboardImageRef(v191);
  if (!v193 || !v192 || typeof v192 !== "object") return false;
  return [
    v192["sourceLocalPath"],
    v192["sourceUrl"],
    v192["storyboardSourceLocalPath"],
    v192["storyboardSourceUrl"],
  ]["some"]((v194) => _isSameStoryboardImageRef(v193, v194));
}
function _getImageElementDisplaySrc(v195) {
  if (!v195) return "";
  return _trimStoryboardImageRef(
    v195["currentSrc"] ||
      v195["src"] ||
      (typeof v195["getAttribute"] === "function"
        ? v195["getAttribute"]("src")
        : ""),
  );
}
function _pickStoryboardCellStoredLocalPath(v196, v197 = "") {
  const v198 = [
    v196?.["localPath"],
    v196?.["displayLocalPath"],
    v196?.["originalLocalPath"],
    v196?.["thumbLocalPath"],
    v197,
  ];
  for (const v199 of v198) {
    const v200 = _toStoredStoryboardLocalPath(v199);
    if (v200) return v200;
  }
  return null;
}
function _buildStoryboardCellAssetSnapshot(v201, v202, v203) {
  const v204 = resolveStoryboardCellAssetSrc(v202);
  if (!v204) return null;
  const v205 = _isDataImageRef(v202?.["capturePreviewUrl"])
      ? _trimStoryboardImageRef(v202["capturePreviewUrl"])
      : _isDataImageRef(v204)
        ? _trimStoryboardImageRef(v204)
        : "",
    v206 = v205 ? null : _pickStoryboardCellStoredLocalPath(v202, v204),
    v207 = !v206 && !v205 ? v204 : "",
    v208 =
      _toPositiveNumber(v202?.["imageWidth"]) ||
      _toPositiveNumber(v202?.["originalWidth"]) ||
      _toPositiveNumber(v202?.["w"]) ||
      null,
    v209 =
      _toPositiveNumber(v202?.["imageHeight"]) ||
      _toPositiveNumber(v202?.["originalHeight"]) ||
      _toPositiveNumber(v202?.["h"]) ||
      null;
  return {
    kind: "asset",
    id: v202?.["id"] || null,
    src: v204,
    localPath: v206,
    originalLocalPath: v205
      ? null
      : _toStoredStoryboardLocalPath(v202?.["originalLocalPath"]),
    displayLocalPath: v205
      ? ""
      : _toStoredStoryboardLocalPath(v202?.["displayLocalPath"]) || "",
    thumbLocalPath: v205
      ? null
      : _toStoredStoryboardLocalPath(v202?.["thumbLocalPath"]),
    capturePreviewUrl: v205,
    externalUrl: v207,
    fileName: _trimStoryboardImageRef(v202?.["fileName"]),
    width: v208,
    height: v209,
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(v202, v203, v201),
    storyboardExtractedCell: v202?.["storyboardExtractedCell"] === true,
    storyboardLockedCell: v202?.["storyboardLockedCell"] === true,
    wasSourceBacked: !!_getStoryboardPieceSourceImageUrl(v202, v201),
  };
}
function _buildStoryboardCellCropSnapshot(v210, v211, v212, v213) {
  if (!v213?.["dataUrl"]) return null;
  return {
    kind: "source-crop",
    id: v211?.["id"] || null,
    src: v213["dataUrl"],
    localPath: null,
    originalLocalPath: null,
    displayLocalPath: "",
    thumbLocalPath: null,
    capturePreviewUrl: v213["dataUrl"],
    externalUrl: "",
    fileName: v213["fileName"] || "",
    width: v213["width"] || null,
    height: v213["height"] || null,
    sourceWidth: v213["sourceWidth"] || v211?.["sourceWidth"] || null,
    sourceHeight: v213["sourceHeight"] || v211?.["sourceHeight"] || null,
    storyboardSourceIndex: resolveStoryboardCellSourceIndex(v211, v212, v210),
    storyboardExtractedCell: false,
    storyboardLockedCell: true,
    crop: v213,
    wasSourceBacked: true,
  };
}
function _resolveStoryboardPayloadDisplaySnapshot(v214, v215 = {}) {
  if (!v214 || typeof v214 !== "object") return null;
  const v216 = _trimStoryboardImageRef(v215["visibleSrc"]),
    v217 = _trimStoryboardImageRef(v214["url"]),
    v218 = _isStoryboardPayloadSourceContextRef(v217, v214) ? "" : v217,
    v219 = _isDataImageRef(v216)
      ? v216
      : _isDataImageRef(v214["capturePreviewUrl"])
        ? _trimStoryboardImageRef(v214["capturePreviewUrl"])
        : _isDataImageRef(v218)
          ? v218
          : "",
    v220 = v219
      ? null
      : _toStoredStoryboardLocalPath(v216) ||
        _toStoredStoryboardLocalPath(v214["localPath"]) ||
        _toStoredStoryboardLocalPath(v214["displayLocalPath"]) ||
        _toStoredStoryboardLocalPath(v214["thumbLocalPath"]) ||
        _toStoredStoryboardLocalPath(v218),
    v221 =
      v219 ||
      _normalizeLocalImageUrl(v220) ||
      _normalizeLocalImageUrl(v216) ||
      _normalizeLocalImageUrl(v214["thumbLocalPath"]) ||
      _normalizeLocalImageUrl(v218);
  if (!v221) return null;
  const v222 = Number(v214["storyboardSourceIndex"]);
  return {
    kind: "asset",
    src: v221,
    localPath: v220,
    originalLocalPath: _toStoredStoryboardLocalPath(v214["originalLocalPath"]),
    displayLocalPath:
      _toStoredStoryboardLocalPath(v214["displayLocalPath"]) || "",
    thumbLocalPath: _toStoredStoryboardLocalPath(v214["thumbLocalPath"]),
    capturePreviewUrl: v219,
    externalUrl: !v220 && !v219 ? v221 : "",
    fileName: _trimStoryboardImageRef(v214["fileName"]),
    width:
      _toPositiveNumber(v214["imageWidth"]) ||
      _toPositiveNumber(v214["originalWidth"]) ||
      null,
    height:
      _toPositiveNumber(v214["imageHeight"]) ||
      _toPositiveNumber(v214["originalHeight"]) ||
      null,
    ...(Number["isInteger"](v222) && v222 >= 0
      ? { storyboardSourceIndex: v222 }
      : {}),
    storyboardExtractedCell: v214["storyboardExtractedCell"] === true,
    storyboardLockedCell: false,
  };
}
function _resolveCollagePayloadDisplaySnapshot(v223, v224 = {}) {
  const v225 = _resolveStoryboardPayloadDisplaySnapshot(v223, v224);
  if (!v225?.["src"]) return null;
  return {
    src: v225["src"],
    localPath: v225["localPath"] || "",
    thumbLocalPath: v225["thumbLocalPath"] || null,
    width: v225["width"] || null,
    height: v225["height"] || null,
  };
}
function resolveStoryboardCellDisplaySnapshot(v226, v227, v228, v229) {
  if (!v227 || typeof v227 !== "object" || _isCellEmpty(v227)) return null;
  const v230 = _buildStoryboardCellAssetSnapshot(v226, v227, v228);
  if (isFrozenStoryboardDisplayCell(v227)) return v230;
  const v231 = _getStoryboardPieceSourceImageUrl(v227, v226);
  if (!v231) return v230;
  const v232 = _buildStoryboardSourceCropExtract(
    v226,
    v228,
    v227,
    v229?.["fileName"] ||
      "storyboard_snapshot_" + (v226?.["id"] || "node") + "_" + v228 + ".jpg",
  );
  return _buildStoryboardCellCropSnapshot(v226, v227, v228, v232) || v230;
}
function buildFrozenStoryboardCellFromSnapshot(v233, v234, v235, v236 = {}) {
  const v237 = _trimStoryboardImageRef(v233?.["src"]);
  if (!v237) return null;
  const v238 = _isDataImageRef(v233["capturePreviewUrl"])
      ? _trimStoryboardImageRef(v233["capturePreviewUrl"])
      : _isDataImageRef(v237)
        ? v237
        : "",
    v239 = v238
      ? null
      : _toStoredStoryboardLocalPath(v233["localPath"]) ||
        _toStoredStoryboardLocalPath(v237),
    v240 =
      !v239 && !v238
        ? _trimStoryboardImageRef(v233["externalUrl"] || v237)
        : "",
    v241 =
      _toPositiveNumber(v233["width"]) ||
      _toPositiveNumber(v233["imageWidth"]) ||
      _toPositiveNumber(v233["originalWidth"]) ||
      null,
    v242 =
      _toPositiveNumber(v233["height"]) ||
      _toPositiveNumber(v233["imageHeight"]) ||
      _toPositiveNumber(v233["originalHeight"]) ||
      null,
    v243 = Number(v233["storyboardSourceIndex"]);
  return {
    ...(v236["id"] ? { id: v236["id"] } : v233["id"] ? { id: v233["id"] } : {}),
    url: v240 || "",
    localPath: v239,
    originalLocalPath: v238
      ? null
      : _toStoredStoryboardLocalPath(v233["originalLocalPath"]),
    displayLocalPath: v238
      ? ""
      : _toStoredStoryboardLocalPath(v233["displayLocalPath"]) || "",
    thumbLocalPath: v238
      ? null
      : _toStoredStoryboardLocalPath(v233["thumbLocalPath"]),
    thumbUrl: "",
    thumbId: null,
    capturePreviewUrl: v238,
    fileName: _trimStoryboardImageRef(v233["fileName"]),
    originalWidth: v241,
    originalHeight: v242,
    imageWidth: v241,
    imageHeight: v242,
    w: v241,
    h: v242,
    sourceId: null,
    sourceLocalPath: null,
    sourceUrl: "",
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardPiece: false,
    storyboardExtractedCell: v233["storyboardExtractedCell"] === true,
    storyboardLockedCell:
      v233["storyboardLockedCell"] === true ||
      v233["kind"] === "source-crop" ||
      v236["locked"] === true,
    ...(Number["isInteger"](v243) && v243 >= 0
      ? { storyboardSourceIndex: v243 }
      : {}),
    isEmpty: false,
    ..._getStoryboardCellPositionPatch(v234, v235),
  };
}
function _buildEmptyStoryboardCellForSlot(v244, v245, v246) {
  return normalizeEmptyStoryboardCell({
    ...(v244 && typeof v244 === "object" ? v244 : {}),
    sourceId: null,
    sourceLocalPath: null,
    sourceUrl: "",
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardPiece: false,
    storyboardLockedCell: false,
    ..._getStoryboardCellPositionPatch(v245, v246),
  });
}
function _updateStoryboardSwapCells(v247, v248, v249, v250, v251) {
  if (v248["id"] === v249["id"]) {
    if (typeof v247["updateNodeData"] !== "function") return false;
    return (v247["updateNodeData"](v248["id"], { cells: v250 }), true);
  }
  if (typeof v247["updateNodesData"] === "function")
    return (
      v247["updateNodesData"]({
        [v248["id"]]: { cells: v250 },
        [v249["id"]]: { cells: v251 },
      }),
      true
    );
  if (typeof v247["updateNodeData"] !== "function") return false;
  return (
    v247["updateNodeData"](v248["id"], { cells: v250 }),
    v247["updateNodeData"](v249["id"], { cells: v251 }),
    true
  );
}
function _swapStoryboardCellsWithDisplaySnapshots({
  store: v252,
  sourceNode: v253,
  sourceCellIndex: v254,
  targetNode: v255,
  targetCellIndex: v256,
  sourceSnapshot: sourceSnapshot = null,
  targetSnapshot: targetSnapshot = null,
}) {
  if (!v253 || !v255) return false;
  const v257 = v253["cells"]?.[v254],
    v258 = v255["cells"]?.[v256];
  !sourceSnapshot &&
    (sourceSnapshot = resolveStoryboardCellDisplaySnapshot(v253, v257, v254));
  if (!sourceSnapshot) return false;
  const v259 = v258 && !_isCellEmpty(v258);
  v259 &&
    !targetSnapshot &&
    (targetSnapshot = resolveStoryboardCellDisplaySnapshot(v255, v258, v256));
  if (v259 && !targetSnapshot) return false;
  const v260 = [...(v253["cells"] || [])],
    v261 = v253["id"] === v255["id"] ? v260 : [...(v255["cells"] || [])];
  ((v261[v256] = buildFrozenStoryboardCellFromSnapshot(
    sourceSnapshot,
    v255,
    v256,
  )),
    (v260[v254] = v259
      ? buildFrozenStoryboardCellFromSnapshot(targetSnapshot, v253, v254)
      : _buildEmptyStoryboardCellForSlot(v257, v253, v254)));
  if (!v261[v256] || (v259 && !v260[v254])) return false;
  return _updateStoryboardSwapCells(v252, v253, v255, v260, v261);
}
function _lockStoryboardCellForCurrentGrid(v262, v263, v264) {
  const v265 = v262?.["cells"]?.[v263];
  if (!v265 || _isCellEmpty(v265))
    return normalizeEmptyStoryboardCell({
      ...(v265 && typeof v265 === "object" ? v265 : {}),
      ..._getStoryboardCellPositionPatch(v262, v263),
    });
  const v266 = _buildStoryboardSourceCropExtract(v262, v263, v265, v264);
  if (v266?.["dataUrl"])
    return _buildLockedStoryboardCellFromCrop(v265, v262, v263, v266);
  if (
    v265["storyboardLockedCell"] === true ||
    v265["storyboardExtractedCell"] === true
  )
    return _cloneStoryboardCellForGridPosition(v265, v262, v263);
  if (_getStoryboardPieceSourceImageUrl(v265, v262)) return null;
  return _cloneStoryboardCellForGridPosition(v265, v262, v263);
}
function _swapStoryboardCellsWithLockedBlocks({
  store: v267,
  sourceNode: v268,
  sourceCellIndex: v269,
  targetNode: v270,
  targetCellIndex: v271,
}) {
  if (!v268 || !v270) return false;
  const v272 = v268["cells"]?.[v269],
    v273 = v270["cells"]?.[v271],
    v274 = !!_getStoryboardPieceSourceImageUrl(v272, v268),
    v275 =
      v273 && !_isCellEmpty(v273)
        ? !!_getStoryboardPieceSourceImageUrl(v273, v270)
        : false;
  if (!v274 && !v275) return false;
  if (v268["id"] === v270["id"] && typeof v267["updateNodeData"] !== "function")
    return false;
  if (
    v268["id"] !== v270["id"] &&
    typeof v267["updateNodesData"] !== "function"
  )
    return false;
  const v276 = _lockStoryboardCellForCurrentGrid(
    v268,
    v269,
    "storyboard_lock_" + v268["id"] + "_" + v269 + ".jpg",
  );
  if (!v276 || _isCellEmpty(v276)) return false;
  const v277 = _lockStoryboardCellForCurrentGrid(
    v270,
    v271,
    "storyboard_lock_" + v270["id"] + "_" + v271 + ".jpg",
  );
  if (v273 && !_isCellEmpty(v273) && !v277) return false;
  if (v268["id"] === v270["id"]) {
    const v278 = [...(v268["cells"] || [])];
    return (
      (v278[v271] = {
        ...v276,
        ..._getStoryboardCellPositionPatch(v268, v271),
      }),
      (v278[v269] =
        v273 && !_isCellEmpty(v273)
          ? { ...v277, ..._getStoryboardCellPositionPatch(v268, v269) }
          : normalizeEmptyStoryboardCell({
              ...v272,
              ..._getStoryboardCellPositionPatch(v268, v269),
            })),
      v267["updateNodeData"](v268["id"], { cells: v278 }),
      true
    );
  }
  const v279 = [...(v268["cells"] || [])],
    v280 = [...(v270["cells"] || [])];
  return (
    (v280[v271] = { ...v276, ..._getStoryboardCellPositionPatch(v270, v271) }),
    (v279[v269] =
      v273 && !_isCellEmpty(v273)
        ? { ...v277, ..._getStoryboardCellPositionPatch(v268, v269) }
        : normalizeEmptyStoryboardCell({
            ...v272,
            ..._getStoryboardCellPositionPatch(v268, v269),
          })),
    v267["updateNodesData"]({
      [v268["id"]]: { cells: v279 },
      [v270["id"]]: { cells: v280 },
    }),
    true
  );
}
function _requiresLockedStoryboardSwap({
  sourceNode: v281,
  sourceCellIndex: v282,
  targetNode: v283,
  targetCellIndex: v284,
}) {
  const v285 = v281?.["cells"]?.[v282],
    v286 = v283?.["cells"]?.[v284];
  return !!(
    _getStoryboardPieceSourceImageUrl(v285, v281) ||
    (v286 &&
      !_isCellEmpty(v286) &&
      _getStoryboardPieceSourceImageUrl(v286, v283))
  );
}
function _loadStoryboardSourceImage(v287) {
  const v288 = _getCachedStoryboardSourceImage(v287);
  if (v288) return Promise["resolve"](v288);
  if (typeof Image !== "function") return Promise["resolve"](null);
  return new Promise((v289) => {
    const v290 = new Image();
    ((v290["crossOrigin"] = "anonymous"),
      (v290["onload"] = () => {
        (_rememberStoryboardSourceImage(v287, v290), v289(v290));
      }),
      (v290["onerror"] = () => v289(null)),
      (v290["src"] = v287));
  });
}
function _canvasToJpegBlob(v291) {
  if (!v291 || typeof v291["toBlob"] !== "function")
    return Promise["resolve"](null);
  return new Promise((v292) => v291["toBlob"](v292, "image/jpeg", 0.9));
}
function _buildExtractNodeCropPatch(v293) {
  if (!v293?.["dataUrl"]) return null;
  return {
    src: v293["dataUrl"],
    capturePreviewUrl: v293["dataUrl"],
    localPath: "",
    fileName: v293["fileName"],
    originalWidth: v293["width"],
    originalHeight: v293["height"],
    imageWidth: v293["width"],
    imageHeight: v293["height"],
    needsAutoResize: false,
    sourceLocalPath: null,
    sourceUrl: "",
    sourceWidth: null,
    sourceHeight: null,
    storyboardSourceCrop: false,
    storyboardExtractedCell: true,
  };
}
async function _saveStoryboardDataImageSnapshot(v294, v295, v296) {
  const v297 = _trimStoryboardImageRef(v294?.["capturePreviewUrl"]);
  if (!_isDataImageRef(v297)) return null;
  const v298 = _dataImageUrlToBlob(v297);
  if (!v298) return null;
  const v299 = _getDataImageExtension(v297),
    v300 = v295 || v294?.["fileName"] || "storyboard_extract." + v299,
    v301 =
      typeof File === "function"
        ? new File([v298], v300, {
            type: v298["type"] || "image/" + (v299 === "jpg" ? "jpeg" : v299),
          })
        : v298,
    v302 = await v296(v301, { ext: v299 }),
    v303 = pickResultLocalPath(v302),
    v304 = String(v302?.["url"] || "")["trim"]() || localPathToUrl(v303);
  if (!v304 || !v303) return null;
  return { saved: v302, localPath: v303, src: v304 };
}
function _buildPersistedStoryboardImagePatch(v305, v306) {
  const v307 = v306?.["saved"] || {},
    v308 = v306?.["localPath"] || "",
    v309 = v306?.["src"] || localPathToUrl(v308),
    v310 =
      _toPositiveNumber(v307["originalWidth"]) ||
      _toPositiveNumber(v305?.["width"]) ||
      null,
    v311 =
      _toPositiveNumber(v307["originalHeight"]) ||
      _toPositiveNumber(v305?.["height"]) ||
      null;
  return {
    src: v309,
    url: "",
    localPath: v308,
    originalLocalPath: normalizeLocalPath(v307["originalLocalPath"] || v308),
    displayLocalPath: normalizeLocalPath(v307["displayLocalPath"]),
    thumbLocalPath: normalizeLocalPath(v307["thumbLocalPath"]),
    capturePreviewUrl: "",
    fileName: v307["filename"] || v305?.["fileName"] || "",
    originalWidth: v310,
    originalHeight: v311,
    imageWidth: v310,
    imageHeight: v311,
  };
}
async function _persistStoryboardSnapshotPreviewToNode(
  v312,
  v313,
  v314,
  v315,
  v316 = saveOutputBlob,
) {
  if (!_isDataImageRef(v314?.["capturePreviewUrl"])) return;
  try {
    const v317 = await _saveStoryboardDataImageSnapshot(v314, v315, v316);
    if (!v317) return;
    if (!v312["getStateRaw"]()["nodes"]?.[v313]) return;
    v312["updateNodeData"](
      v313,
      _buildPersistedStoryboardImagePatch(v314, v317),
    );
  } catch (v318) {
    console["warn"]("[DragController] 分镜临时预览落盘失败:", v318);
  }
}
async function _persistStoryboardSnapshotPreviewToCell(
  v319,
  v320,
  v321,
  v322,
  v323,
  v324,
  v325 = saveOutputBlob,
) {
  const v326 = _trimStoryboardImageRef(v323?.["capturePreviewUrl"]);
  if (!_isDataImageRef(v326)) return;
  try {
    const v327 = await _saveStoryboardDataImageSnapshot(v323, v324, v325);
    if (!v327) return;
    const v328 = v319["getStateRaw"]()["nodes"]?.[v320],
      v329 = Array["isArray"](v328?.["cells"]) ? v328["cells"] : [],
      v330 = v329[v321];
    if (!v330 || _isCellEmpty(v330)) return;
    if (v322 && String(v330["id"] || "") !== String(v322)) return;
    if (_trimStoryboardImageRef(v330["capturePreviewUrl"]) !== v326) return;
    const v331 = [...v329];
    ((v331[v321] = {
      ...v330,
      ..._buildPersistedStoryboardImagePatch(v323, v327),
      sourceLocalPath: null,
      sourceUrl: "",
      sourceWidth: null,
      sourceHeight: null,
      storyboardSourceCrop: false,
      storyboardPiece: false,
      isEmpty: false,
    }),
      v319["updateNodeData"](v320, { cells: v331 }));
  } catch (v332) {
    console["warn"]("[DragController]\x20分镜宫格临时预览落盘失败:", v332);
  }
}
async function _persistStoryboardSourceCropExtract(
  v333,
  v334,
  v335,
  v336 = saveOutputBlob,
) {
  if (typeof window === "undefined") return;
  if (!v335?.["canvas"] || !v335["dataUrl"] || !v334) return;
  try {
    const v337 = await _canvasToJpegBlob(v335["canvas"]);
    if (!v337) return;
    const v338 =
        typeof File === "function"
          ? new File([v337], v335["fileName"], { type: "image/jpeg" })
          : v337,
      v339 = await v336(v338, { ext: "jpg" }),
      v340 = pickResultLocalPath(v339),
      v341 = String(v339?.["url"] || "")["trim"]() || localPathToUrl(v340);
    if (!v341 || !v340) return;
    if (!v333["getStateRaw"]()["nodes"]?.[v334]) return;
    v333["updateNodeData"](v334, {
      src: v341,
      localPath: v340,
      originalLocalPath: normalizeLocalPath(
        v339?.["originalLocalPath"] || v340,
      ),
      displayLocalPath: normalizeLocalPath(v339?.["displayLocalPath"]),
      thumbLocalPath: normalizeLocalPath(v339?.["thumbLocalPath"]),
      fileName: v339?.["filename"] || v335["fileName"],
      originalWidth:
        Number(v339?.["originalWidth"] || v335["width"]) || v335["width"],
      originalHeight:
        Number(v339?.["originalHeight"] || v335["height"]) || v335["height"],
      imageWidth: v335["width"],
      imageHeight: v335["height"],
      needsAutoResize: false,
    });
  } catch (v342) {
    console["warn"]("[DragController] 保存自定义分镜提取结果失败:", v342);
  }
}
function _refreshStoryboardSourceCropExtractInBackground(
  v343,
  v344,
  v345,
  v346,
  v347,
  v348,
) {
  const v349 = _getStoryboardPieceSourceImageUrl(v347, v345);
  if (!v349 || !v344) return;
  const v350 = {
    cols: v345?.["cols"],
    rows: v345?.["rows"],
    width: v345?.["width"],
    height: v345?.["height"],
    gridGap: v345?.["gridGap"],
    gridLayout: v345?.["gridLayout"],
  };
  _loadStoryboardSourceImage(v349)
    ["then"]((v351) => {
      if (!v351 || !v343["getStateRaw"]()["nodes"]?.[v344]) return;
      const v352 = resolveStoryboardCellSourceIndex(v347, v346, v345),
        v353 = _buildStoryboardSourceCropExtractFromImage(
          v350,
          v346,
          v351,
          v348,
          v352,
        ),
        v354 = _buildExtractNodeCropPatch(v353);
      if (!v354 || !v343["getStateRaw"]()["nodes"]?.[v344]) return;
      (v343["updateNodeData"](v344, v354),
        _persistStoryboardSourceCropExtract(v343, v344, v353));
    })
    ["catch"]((v355) => {
      console["warn"]("[DragController] 异步刷新自定义分镜提取预览失败:", v355);
    });
}
let _cachedMultiSelectBoxEl = null;
const TITLE_DRAG_ACTIVATE_THRESHOLD_PX = 5,
  HEAVY_EDGE_DRAG_MIN_ZOOM = 0.24,
  HEAVY_EDGE_DRAG_MAX_ZOOM = 0.48,
  HEAVY_EDGE_DRAG_MIN_EDGES = 3,
  DRAG_EDGE_SCREEN_EPSILON_PX = 1,
  EDGE_INTERACTION_LITE_CLASS = "is-edge-interaction-lite",
  _dragSnapSpatialIndexCache = { nodes: null, persistRev: -1, index: null };
function _resolveDragSnapNodeRect(v356) {
  if (!v356 || typeof v356 !== "object") return null;
  return {
    x: v356["x"],
    y: v356["y"],
    width: v356["width"] || 200,
    height: v356["height"] || 200,
  };
}
function _getDragSnapSpatialIndex(v357) {
  const v358 = v357?.["nodes"];
  if (!v358 || typeof v358 !== "object") return null;
  const v359 = Number["isFinite"](v357?.["_persistRev"])
    ? v357["_persistRev"]
    : -1;
  if (
    _dragSnapSpatialIndexCache["nodes"] === v358 &&
    _dragSnapSpatialIndexCache["persistRev"] === v359
  )
    return _dragSnapSpatialIndexCache["index"];
  const v360 = createNodeSpatialIndex(v358, {
    resolveRect: _resolveDragSnapNodeRect,
  });
  return (
    (_dragSnapSpatialIndexCache["nodes"] = v358),
    (_dragSnapSpatialIndexCache["persistRev"] = v359),
    (_dragSnapSpatialIndexCache["index"] = v360),
    v360
  );
}
function _collectAffectedEdgesForTargets(v361, v362) {
  const v363 = window["v2Renderer"];
  if (v363 && typeof v363["getEdgeIdsForNode"] === "function") {
    const v364 = new Set();
    for (const v365 of v361 || []) {
      const v366 = v363["getEdgeIdsForNode"](v365);
      if (!Array["isArray"](v366) || v366["length"] === 0) continue;
      for (const v367 of v366) v364["add"](v367);
    }
    return Array["from"](v364)
      ["map"]((v368) => v362?.[v368])
      ["filter"](Boolean);
  }
  const v369 = v361 instanceof Set ? v361 : new Set(v361 || []);
  return Object["values"](v362 || {})["filter"](
    (v370) =>
      v369["has"](v370?.["sourceId"]) || v369["has"](v370?.["targetId"]),
  );
}
function _flushStoryboardNodesNow(...v371) {
  const v372 = typeof window !== "undefined" ? window["v2Renderer"] : null;
  if (!v372 || typeof v372["flushNodes"] !== "function") return false;
  return v372["flushNodes"](Array["from"](new Set(v371["filter"](Boolean))));
}
function _applyImmediateCellSwapPreview(v373, v374, v375) {
  const v376 = typeof window !== "undefined" ? window["v2Renderer"] : null,
    v377 = v376?.["nodeInstances"]?.["get"]?.(v373);
  if (!v377 || typeof v377["applyImmediateCellSwap"] !== "function")
    return { ok: false, revert() {} };
  const v378 = v377["applyImmediateCellSwap"](v374, v375);
  if (!v378 || v378["ok"] !== true || typeof v378["revert"] !== "function")
    return { ok: false, revert() {} };
  return v378;
}
function _getDragEdgeScheduler(v379) {
  return (
    !v379["_dragEdgeScheduler"] &&
      (v379["_dragEdgeScheduler"] = {
        rafId: 0,
        pendingPayload: null,
        lastPayload: null,
        lastPaintDx: null,
        lastPaintDy: null,
        liteClassActive: false,
        transformedEdgeIds: new Set(),
      }),
    v379["_dragEdgeScheduler"]
  );
}
function _setEdgeInteractionLiteClass(v380, v381) {
  if (!v380 || v380["liteClassActive"] === v381) return;
  const v382 = typeof document !== "undefined" ? document["body"] : null;
  if (!v382 || !v382["classList"]) {
    v380["liteClassActive"] = v381;
    return;
  }
  (v382["classList"]["toggle"](EDGE_INTERACTION_LITE_CLASS, v381),
    (v380["liteClassActive"] = v381));
}
function _getRafFns() {
  const v383 =
      (typeof requestAnimationFrame === "function" && requestAnimationFrame) ||
      (typeof window !== "undefined" &&
        typeof window["requestAnimationFrame"] === "function" &&
        window["requestAnimationFrame"]["bind"](window)),
    v384 =
      (typeof cancelAnimationFrame === "function" && cancelAnimationFrame) ||
      (typeof window !== "undefined" &&
        typeof window["cancelAnimationFrame"] === "function" &&
        window["cancelAnimationFrame"]["bind"](window));
  return {
    raf: v383 || ((v385) => setTimeout(v385, 0)),
    cancel: v384 || ((v386) => clearTimeout(v386)),
  };
}
function _isDraggedEdgeVisible(v387, v388, v389, v390, v391) {
  const v392 =
      typeof window !== "undefined" && Number["isFinite"](window["innerWidth"])
        ? window["innerWidth"]
        : 0,
    v393 =
      typeof window !== "undefined" && Number["isFinite"](window["innerHeight"])
        ? window["innerHeight"]
        : 0,
    v394 = 200,
    { x: v395, y: v396, zoom: v397 } = v391,
    v398 = v387 * v397 + v395,
    v399 = v388 * v397 + v396,
    v400 = v389 * v397 + v395,
    v401 = v390 * v397 + v396,
    v402 = Math["min"](v398, v400),
    v403 = Math["min"](v399, v401),
    v404 = Math["max"](v398, v400),
    v405 = Math["max"](v399, v401);
  return (
    v404 > -v394 && v402 < v392 + v394 && v405 > -v394 && v403 < v393 + v394
  );
}
function _formatEdgeTranslate(v406, v407) {
  return (
    "translate(" + (Number(v406) || 0) + "\x20" + (Number(v407) || 0) + ")"
  );
}
function _collectDraggedEdgeUpdates(v408) {
  const {
      affectedEdges: v409,
      edgeDomCache: v410,
      nodes: v411,
      targetSet: v412,
      viewport: v413,
      pendingDx: v414,
      pendingDy: v415,
      useEdgeGroupTransform: useEdgeGroupTransform = false,
    } = v408,
    v416 = [],
    v417 = [];
  return (
    v409["forEach"]((v418) => {
      const v419 = v410["get"](v418["id"]);
      if (!v419) return;
      const v420 = v418["sourceId"],
        v421 = v418["targetId"],
        v422 = v411[v420],
        v423 = v411[v421];
      if (!v422 || !v423) return;
      const v424 = v412["has"](v420),
        v425 = v412["has"](v421),
        v426 = v424 ? v422["x"] + v414 : v422["x"],
        v427 = v424 ? v422["y"] + v415 : v422["y"],
        v428 = v425 ? v423["x"] + v414 : v423["x"],
        v429 = v425 ? v423["y"] + v415 : v423["y"],
        v430 = v426 + (v422["width"] || 260),
        v431 = v427 + (v422["height"] || 100) / 2,
        v432 = v428,
        v433 = v429 + (v423["height"] || 100) / 2;
      if (!_isDraggedEdgeVisible(v430, v431, v432, v433, v413)) return;
      if (useEdgeGroupTransform && v424 && v425) {
        v417["push"]({
          edgeId: v418["id"],
          domCache: v419,
          transform: _formatEdgeTranslate(v414, v415),
        });
        return;
      }
      const v434 = Math["abs"](v432 - v430),
        v435 = Math["max"](v434 * 0.5, 60),
        v436 =
          "M\x20" +
          v430 +
          "\x20" +
          v431 +
          " C " +
          (v430 + v435) +
          "\x20" +
          v431 +
          ",\x20" +
          (v432 - v435) +
          "\x20" +
          v433 +
          ",\x20" +
          v432 +
          "\x20" +
          v433;
      v416["push"]({ domCache: v419, d: v436 });
    }),
    { pathsToUpdate: v416, transformsToUpdate: v417 }
  );
}
function _applyDraggedEdgePathUpdates(
  v437,
  { mainOnly: mainOnly = false } = {},
) {
  for (const v438 of v437) {
    if (!mainOnly)
      v438["domCache"]["hoverPath"]?.["setAttribute"]?.("d", v438["d"]);
    v438["domCache"]["pathEl"]?.["setAttribute"]?.("d", v438["d"]);
  }
}
function _applyDraggedEdgeTransformUpdates(v439, v440 = null) {
  for (const v441 of v439) {
    if (!v441?.["domCache"]?.["groupEl"]) continue;
    v441["transform"]
      ? (v441["domCache"]["groupEl"]["setAttribute"]?.(
          "transform",
          v441["transform"],
        ),
        v440?.["transformedEdgeIds"]?.["add"]?.(v441["edgeId"]))
      : (v441["domCache"]["groupEl"]["removeAttribute"]?.("transform"),
        v440?.["transformedEdgeIds"]?.["delete"]?.(v441["edgeId"]));
  }
}
function _clearDragEdgeTransformPreview(v442) {
  const v443 = v442?.["_dragEdgeScheduler"];
  if (!v443?.["transformedEdgeIds"]?.["size"]) return;
  const v444 = typeof window !== "undefined" ? window["_edgeDomCache"] : null;
  if (!v444 || typeof v444["get"] !== "function") {
    v443["transformedEdgeIds"]["clear"]();
    return;
  }
  for (const v445 of v443["transformedEdgeIds"]) {
    v444["get"](v445)?.["groupEl"]?.["removeAttribute"]?.("transform");
  }
  v443["transformedEdgeIds"]["clear"]();
}
function _paintDraggedEdges(
  v446,
  v447,
  { force: force = false, mainOnly: mainOnly = false } = {},
) {
  const v448 = Number(v446?.["viewport"]?.["zoom"]) || 1;
  if (!force && v447) {
    const v449 = v447["lastPaintDx"],
      v450 = v447["lastPaintDy"];
    if (Number["isFinite"](v449) && Number["isFinite"](v450)) {
      const v451 = Math["abs"]((v446["pendingDx"] - v449) * v448),
        v452 = Math["abs"]((v446["pendingDy"] - v450) * v448);
      if (
        v451 < DRAG_EDGE_SCREEN_EPSILON_PX &&
        v452 < DRAG_EDGE_SCREEN_EPSILON_PX
      )
        return false;
    }
  }
  const v453 = isPerfProbeEnabled(),
    v454 =
      v453 &&
      typeof performance !== "undefined" &&
      typeof performance["now"] === "function"
        ? performance["now"]()
        : 0,
    { pathsToUpdate: v455, transformsToUpdate: v456 } =
      _collectDraggedEdgeUpdates(v446);
  (_applyDraggedEdgeTransformUpdates(v456, v447),
    _applyDraggedEdgePathUpdates(v455, { mainOnly: mainOnly }));
  if (v453) {
    const v457 =
        typeof performance !== "undefined" &&
        typeof performance["now"] === "function"
          ? performance["now"]()
          : Date["now"](),
      v458 = Array["isArray"](v446?.["affectedEdges"])
        ? v446["affectedEdges"]["length"]
        : 0,
      v459 = v455["length"] + v456["length"];
    recordEdgeRedrawSample("partial", v457 - v454, {
      reason: "drag-controller",
      edgeCount: v458,
      visibleEdgeCount: v459,
      updatedCount: v459,
      createdCount: 0,
      removedCount: 0,
      reusedCount: v459,
      skippedInvisibleCount: Math["max"](0, v458 - v459),
      cacheSize: Number["isFinite"](v446?.["edgeDomCache"]?.["size"])
        ? v446["edgeDomCache"]["size"]
        : 0,
    });
  }
  return (
    v447 &&
      ((v447["lastPaintDx"] = v446["pendingDx"]),
      (v447["lastPaintDy"] = v446["pendingDy"]),
      (v447["lastPayload"] = v446)),
    true
  );
}
function _flushDragEdgeScheduler(v460) {
  const v461 = v460?.["_dragEdgeScheduler"];
  if (!v461) return;
  const v462 = v461["pendingPayload"] || v461["lastPayload"];
  ((v461["pendingPayload"] = null), (v461["lastPayload"] = null));
  if (v461["rafId"]) {
    const { cancel: v463 } = _getRafFns();
    (v463(v461["rafId"]), (v461["rafId"] = 0));
  }
  (v462 && _paintDraggedEdges(v462, v461, { force: true }),
    (v461["lastPaintDx"] = null),
    (v461["lastPaintDy"] = null),
    _setEdgeInteractionLiteClass(v461, false));
}
function _scheduleDraggedEdges(v464, v465) {
  const v466 = _getDragEdgeScheduler(v464);
  ((v466["pendingPayload"] = v465),
    (v466["lastPayload"] = v465),
    _setEdgeInteractionLiteClass(v466, true));
  if (v466["rafId"]) return;
  const { raf: v467 } = _getRafFns();
  v466["rafId"] = v467(() => {
    v466["rafId"] = 0;
    const v468 = v466["pendingPayload"];
    ((v466["pendingPayload"] = null),
      v468 && _paintDraggedEdges(v468, v466, { mainOnly: true }));
  });
}
function _updateDraggedEdges(v469, v470) {
  const v471 = _getDragEdgeScheduler(v469),
    v472 = Number(v470?.["viewport"]?.["zoom"]) || 1,
    v473 = Number["isFinite"](v470?.["edgeCount"]) ? v470["edgeCount"] : 0,
    v474 = Math["max"](v473, v470["affectedEdges"]["length"]),
    v475 =
      v472 >= HEAVY_EDGE_DRAG_MIN_ZOOM &&
      v472 <= HEAVY_EDGE_DRAG_MAX_ZOOM &&
      v474 >= HEAVY_EDGE_DRAG_MIN_EDGES &&
      v470["edgeDomCache"] &&
      v470["edgeDomCache"]["size"] > 0;
  if (!v475) {
    (v471["pendingPayload"] || v471["rafId"]) && _flushDragEdgeScheduler(v469);
    ((v471["lastPaintDx"] = null),
      (v471["lastPaintDy"] = null),
      _setEdgeInteractionLiteClass(v471, false),
      _paintDraggedEdges(v470, v471, { force: true }));
    return;
  }
  _scheduleDraggedEdges(v469, v470);
}
function _getNodeWrapperEl(v476) {
  if (!v476) return null;
  if (typeof window === "undefined") return null;
  return window["v2Renderer"]?.["getMountedWrapper"]?.(v476) || null;
}
function _syncNodeDragPreview(v477, v478) {
  if (!v477) return;
  const v479 = window["v2Renderer"]?.["nodeInstances"]?.["get"]?.(v477);
  v479 &&
    typeof v479["syncDragPreview"] === "function" &&
    v479["syncDragPreview"](v478);
}
function _getMultiSelectBoxEl() {
  if (_cachedMultiSelectBoxEl && _cachedMultiSelectBoxEl["isConnected"])
    return _cachedMultiSelectBoxEl;
  return (
    (_cachedMultiSelectBoxEl = document["getElementById"](
      "v2-multi-select-box",
    )),
    _cachedMultiSelectBoxEl
  );
}
function _collectDragTargetIds(v480, v481) {
  const v482 = new Set(v481 || []),
    v483 = v480["_parentToChildren"] || {},
    v484 = Array["from"](v482);
  while (v484["length"] > 0) {
    const v485 = v484["pop"](),
      v486 = v483[v485];
    if (v486 && typeof v486[Symbol["iterator"]] === "function") {
      for (const v487 of v486) {
        !v482["has"](v487) && (v482["add"](v487), v484["push"](v487));
      }
      continue;
    }
    for (const v488 of Object["values"](v480["nodes"] || {})) {
      v488?.["parentId"] === v485 &&
        !v482["has"](v488["id"]) &&
        (v482["add"](v488["id"]), v484["push"](v488["id"]));
    }
  }
  return v482;
}
function _waitForStoryboardCellImage(v489, v490, v491, v492) {
  const v493 = performance["now"](),
    v494 = 1800,
    v495 = () => {
      const v496 = document["getElementById"]("cell-" + v489 + "-" + v490),
        v497 = v496
          ? v496["querySelector"](".storyboard-cell-img") ||
            v496["querySelector"]("img")
          : null;
      if (v497) {
        const v498 = v497["getAttribute"]("src") || "";
        if (_isSameImageSrc(v498, v491)) {
          v492();
          return;
        }
        if (!v491 && v497["complete"] && v497["naturalWidth"] > 0) {
          v492();
          return;
        }
      }
      if (performance["now"]() - v493 >= v494) {
        v492();
        return;
      }
      requestAnimationFrame(v495);
    };
  requestAnimationFrame(v495);
}
function _waitForCollageItemImage(v499, v500, v501, v502) {
  if (typeof document === "undefined") {
    v502();
    return;
  }
  const v503 = performance["now"](),
    v504 = 1800,
    v505 = () => {
      const v506 =
          typeof window !== "undefined"
            ? window["v2Renderer"]?.["nodeInstances"]?.["get"](v499)
            : null,
        v507 = v506?.["el"] || document,
        v508 = v507?.["querySelector"]?.(
          '.collage-item[data-collage-slot-index="' + v500 + "\x22]",
        ),
        v509 = v508 ? v508["querySelector"]("img") : null;
      if (v509 && v509["complete"] && v509["naturalWidth"] > 0) {
        const v510 = v509["getAttribute"]("src") || "";
        if (!v501 || v510 === v501) {
          v502();
          return;
        }
      }
      if (performance["now"]() - v503 >= v504) {
        v502();
        return;
      }
      requestAnimationFrame(v505);
    };
  requestAnimationFrame(v505);
}
function _fadeOutGhost(v511, v512 = 160) {
  if (!v511) return;
  ((v511["style"]["transition"] =
    "opacity " + v512 / 1000 + "s\x20cubic-bezier(0.4,\x200,\x200.2,\x201)"),
    (v511["style"]["opacity"] = "0"),
    setTimeout(() => v511["remove"](), v512));
}
function _drawImageCover(v513, v514, v515, v516) {
  const v517 = Math["max"](
      1,
      Number(v514?.["naturalWidth"] || v514?.["width"]) || 1,
    ),
    v518 = Math["max"](
      1,
      Number(v514?.["naturalHeight"] || v514?.["height"]) || 1,
    ),
    v519 = Math["max"](1, Number(v515) || 1),
    v520 = Math["max"](1, Number(v516) || 1),
    v521 = v517 / v518,
    v522 = v519 / v520;
  let v523 = 0,
    v524 = 0,
    v525 = v517,
    v526 = v518;
  if (v521 > v522)
    ((v525 = Math["max"](1, v518 * v522)), (v523 = (v517 - v525) / 2));
  else
    v521 < v522 &&
      ((v526 = Math["max"](1, v517 / v522)), (v524 = (v518 - v526) / 2));
  v513["drawImage"](v514, v523, v524, v525, v526, 0, 0, v519, v520);
}
function _createGhostFromImage(v527, v528, v529, v530) {
  const v531 = document["createElement"]("div");
  ((v531["className"] = "v2-ghost-image"),
    Object["assign"](v531["style"], {
      position: "fixed",
      left: "0",
      top: "0",
      width: v528 + "px",
      height: v529 + "px",
      opacity: "0.92",
      pointerEvents: "none",
      zIndex: "10000",
      borderRadius: "8px",
      border: "none",
      boxShadow:
        "0 0 0 2px var(--white-80), 0 0 30px 0 var(--white-40), 0 12px 40px var(--black-60)",
      overflow: "hidden",
      willChange: "transform, opacity",
      transition: "none",
      background: "var(--bg-node)",
    }));
  if (
    v527 &&
    v527["complete"] &&
    v527["naturalWidth"] > 0 &&
    v527["naturalHeight"] > 0
  ) {
    const v532 = document["createElement"]("canvas");
    ((v532["width"] = Math["max"](1, Math["round"](v528))),
      (v532["height"] = Math["max"](1, Math["round"](v529))),
      Object["assign"](v532["style"], {
        width: "100%",
        height: "100%",
        display: "block",
      }));
    const v533 = v532["getContext"]("2d", { alpha: false });
    if (v533)
      try {
        return (
          (v533["imageSmoothingEnabled"] = true),
          (v533["imageSmoothingQuality"] = "high"),
          _drawImageCover(v533, v527, v532["width"], v532["height"]),
          v531["appendChild"](v532),
          v531
        );
      } catch {}
  }
  const v534 = document["createElement"]("img"),
    v535 = (v527 && (v527["currentSrc"] || v527["src"])) || v530 || "";
  if (v535) v534["setAttribute"]("src", v535);
  return (
    Object["assign"](v534["style"], {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      transition: "none",
    }),
    v531["appendChild"](v534),
    v531
  );
}
export function createDragController({
  store: v536,
  isNodeType: v537,
  getShortcuts: v538,
  hitTestNode: v539,
  screenToWorld: v540,
  generateId: v541,
  cloneNodesWithEdges: v542,
  commit: v543,
  saveOutputBlobImpl: saveOutputBlobImpl = saveOutputBlob,
}) {
  function v544(v545, v546, v547, v548) {
    if (!v546 || !v546["target"]) return false;
    const v549 = v546["target"]["closest"](".node-label");
    if (!v549 || v549["contentEditable"] === "true") return false;
    const v550 =
      v549["dataset"]["nodeId"] ||
      (v549["parentElement"] && v549["parentElement"]["id"]);
    if (!v550) return false;
    const v551 = v536["getStateRaw"]()["selectedNodeIds"] || [],
      v552 = v551["includes"](v550);
    return (
      (v545["isDragging"] = true),
      (v545["dragSource"] = "title"),
      (v545["targetNodeId"] = v550),
      (v545["lastWorldX"] = v547),
      (v545["lastWorldY"] = v548),
      (v545["pendingDx"] = 0),
      (v545["pendingDy"] = 0),
      (v545["hasMoved"] = false),
      (v545["wasSelectedOnDown"] = v552),
      (v545["titleDragStartScreenX"] = Number["isFinite"](v546["clientX"])
        ? v546["clientX"]
        : 0),
      (v545["titleDragStartScreenY"] = Number["isFinite"](v546["clientY"])
        ? v546["clientY"]
        : 0),
      (v545["titleDragActivated"] = false),
      (v545["titleDragPendingSelectNodeId"] = v552 ? null : v550),
      true
    );
  }
  function v553(v554, v555, v556, v557, v558, v559, v560) {
    const { viewport: v561, nodes: v562 } = v536["getStateRaw"](),
      v563 = v539(v555, v556, v562, v561),
      v564 = v563 ? v562[v563] : null;
    if (!v564) return false;
    const v565 = v564;
    if (v559) {
      const v566 = v536["getStateRaw"]()["selectedNodeIds"],
        v567 = v566["includes"](v565["id"]) ? [...v566] : [v565["id"]],
        v568 = v542(v567, 0, 0),
        v569 = Object["values"](v568);
      v536["setSelectedNodes"](v569);
      const v570 = v568[v565["id"]] || v569[0];
      return (
        (v554["isDragging"] = true),
        (v554["dragSource"] = "node"),
        (v554["targetNodeId"] = v570),
        (v554["lastWorldX"] = v557),
        (v554["lastWorldY"] = v558),
        (v554["titleDragPendingSelectNodeId"] = null),
        (v554["titleDragActivated"] = false),
        (v554["titleDragStartScreenX"] = 0),
        (v554["titleDragStartScreenY"] = 0),
        document["body"]["classList"]["add"]("is-dragging"),
        true
      );
    }
    if (v537(v565, "storyboard") && v565["isEditing"]) {
      const v571 = getStoryboardCellMetrics(v565),
        v572 = getStoryboardCellIndexAtWorldPoint(v565, v557, v558),
        v573 = v565["cells"] && v565["cells"][v572];
      if (v572 >= 0 && v573 && !_isCellEmpty(v573)) {
        const v574 = getStoryboardCellPixelBounds(v565, v572),
          v575 = (v574?.["width"] || v571["cellWidth"]) * v561["zoom"],
          v576 = (v574?.["height"] || v571["cellHeight"]) * v561["zoom"],
          v577 = v555 - v575 / 2,
          v578 = v556 - v576 / 2,
          v579 = document["createElement"]("div");
        ((v579["className"] = "v2-ghost-image"),
          Object["assign"](v579["style"], {
            position: "fixed",
            left: "0",
            top: "0",
            width: v575 + "px",
            height: v576 + "px",
            transform: "translate(" + v577 + "px, " + v578 + "px)",
            opacity: "0.85",
            pointerEvents: "none",
            zIndex: "10000",
            borderRadius: "8px",
            border: "none",
            boxShadow:
              "0 0 0 2px var(--white-80), 0 0 30px 0 var(--white-40), 0 12px 40px var(--black-60)",
            overflow: "hidden",
            willChange: "transform",
            transition: "none",
          }));
        const v580 = document["getElementById"](
            "cell-" + v565["id"] + "-" + v572,
          ),
          v581 =
            v580?.["querySelector"]("img.storyboard-cell-img--source-crop") ||
            null,
          v582 = v580?.["querySelector"](".storyboard-cell-img") || null,
          v583 = _getStoryboardCellDisplaySrc(v573),
          v584 = v581
            ? _buildStoryboardSourceCropExtract(
                v565,
                v572,
                v573,
                "storyboard_drag_" + v565["id"] + "_" + v572 + ".jpg",
              )
            : null;
        if (v584?.["dataUrl"]) {
          const v585 = getAutoMediaSizeByShortSide(
              v584["width"],
              v584["height"],
            ),
            v586 = v585["width"] * v561["zoom"],
            v587 = v585["height"] * v561["zoom"];
          Object["assign"](v579["style"], {
            width: v586 + "px",
            height: v587 + "px",
            transform:
              "translate(" + v555 + "px, " + v556 + "px) translate(-50%, -50%)",
          });
          const v588 = document["createElement"]("img");
          (v588["setAttribute"]("src", v584["dataUrl"]),
            Object["assign"](v588["style"], {
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              pointerEvents: "none",
              transition: "none",
            }),
            v579["appendChild"](v588));
        } else {
          if (v582) {
            const v589 = Math["max"](1, Math["round"](v575)),
              v590 = Math["max"](1, Math["round"](v576)),
              v591 = document["createElement"]("canvas");
            ((v591["width"] = v589),
              (v591["height"] = v590),
              Object["assign"](v591["style"], {
                width: "100%",
                height: "100%",
                display: "block",
              }));
            const v592 = v591["getContext"]("2d", { alpha: false });
            if (v592 && v582["complete"] && v582["naturalWidth"] > 0)
              try {
                ((v592["imageSmoothingEnabled"] = true),
                  (v592["imageSmoothingQuality"] = "high"),
                  v592["drawImage"](v582, 0, 0, v589, v590),
                  v579["appendChild"](v591));
              } catch {
                const v593 = document["createElement"]("img"),
                  v594 = v582["currentSrc"] || v582["src"] || v583;
                if (v594) v593["setAttribute"]("src", v594);
                (Object["assign"](v593["style"], {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "none",
                }),
                  v579["appendChild"](v593));
              }
            else {
              const v595 = document["createElement"]("img"),
                v596 = v582["currentSrc"] || v582["src"] || v583;
              if (v596) v595["setAttribute"]("src", v596);
              (Object["assign"](v595["style"], {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "none",
              }),
                v579["appendChild"](v595));
            }
          } else {
            const v597 = document["createElement"]("img");
            if (v583) v597["setAttribute"]("src", v583);
            (Object["assign"](v597["style"], {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "none",
            }),
              v579["appendChild"](v597));
          }
        }
        document["body"]["appendChild"](v579);
        const v598 = v560?.["target"]?.["closest"](".sb-cell") || null;
        if (v598) v598["classList"]["add"]("is-drag-source");
        return (
          (v554["isDraggingCell"] = true),
          (v554["dragSource"] = "cell"),
          (v554["targetNodeId"] = v565["id"]),
          (v554["sourceCellIndex"] = v572),
          (v554["draggedCellData"] = { ...v573 }),
          (v554["ghostEl"] = v579),
          (v554["sourceCellEl"] = v598),
          (v554["lastWorldX"] = v557),
          (v554["lastWorldY"] = v558),
          (v554["titleDragPendingSelectNodeId"] = null),
          (v554["titleDragActivated"] = false),
          (v554["titleDragStartScreenX"] = 0),
          (v554["titleDragStartScreenY"] = 0),
          document["body"]["classList"]["add"]("is-dragging"),
          true
        );
      }
    }
    const v599 = v536["getStateRaw"]()["selectedNodeIds"],
      v600 = v599["includes"](v565["id"]);
    ((v554["isDragging"] = true),
      (v554["dragSource"] = "node"),
      (v554["targetNodeId"] = v565["id"]),
      (v554["lastWorldX"] = v557),
      (v554["lastWorldY"] = v558),
      (v554["titleDragPendingSelectNodeId"] = null),
      (v554["titleDragActivated"] = false),
      (v554["titleDragStartScreenX"] = 0),
      (v554["titleDragStartScreenY"] = 0),
      (v554["wasSelectedOnDown"] = v600),
      document["body"]["classList"]["add"]("is-dragging"));
    const v601 = v538(),
      v602 = v601["multi-select"] ? v601["multi-select"]["keys"][0] : "Shift";
    let v603 = false;
    if (v602 === "Ctrl") v603 = v560?.["ctrlKey"] || v560?.["metaKey"];
    else {
      if (v602 === "Shift") v603 = v560?.["shiftKey"];
      else {
        if (v602 === "Alt") v603 = v560?.["altKey"];
      }
    }
    return (
      v603
        ? v599["includes"](v565["id"])
          ? (v536["setSelectionMeta"]({ source: "shift" }),
            v536["setSelectedNodes"](
              v599["filter"]((v604) => v604 !== v565["id"]),
            ),
            (v554["isDragging"] = false),
            (v554["dragSource"] = null),
            (v554["targetNodeId"] = null))
          : (v536["setSelectionMeta"]({ source: "shift" }),
            v536["setSelectedNodes"]([...v599, v565["id"]]))
        : !v599["includes"](v565["id"]) &&
          (v536["setSelectionMeta"]({ source: "click" }),
          v536["setSelectedNodes"]([v565["id"]])),
      true
    );
  }
  function v605(v606, v607, v608, v609, v610, v611) {
    v606["ghostEl"] &&
      (v606["ghostEl"]["style"]["transform"] =
        "translate(" +
        v607 +
        "px, " +
        v608 +
        "px)\x20translate(-50%,\x20-50%)");
    const v612 = _getStoryboardCellInfoAt(v609, v610, v611, {
        nearestInGap: true,
      }),
      v613 = v612 ? v612["nodeId"] : null,
      v614 = v606["lastHoverNodeId"] || null;
    if (
      v613 !== v614 ||
      (v612 && v612["cellIndex"] !== v606["lastHoverCellIndex"])
    ) {
      if (v614) {
        const v615 = window["v2Renderer"]?.["nodeInstances"]?.["get"](v614);
        if (v615 && typeof v615["highlightCell"] === "function")
          v615["highlightCell"](-1);
      }
      if (v613) {
        const v616 = window["v2Renderer"]?.["nodeInstances"]?.["get"](v613);
        if (v616 && typeof v616["highlightCell"] === "function")
          v616["highlightCell"](v612["cellIndex"]);
      }
      ((v606["lastHoverNodeId"] = v613),
        (v606["lastHoverCellIndex"] = v612 ? v612["cellIndex"] : -1));
    }
    ((v606["lastWorldX"] = v609), (v606["lastWorldY"] = v610));
  }
  function v617(v618, v619, v620, v621, v622, v623, v624, v625) {
    const {
        viewport: v626,
        nodes: v627,
        selectedNodeIds: v628,
        edges: v629,
      } = v625,
      v630 = v628["includes"](v618["targetNodeId"])
        ? v628
        : [v618["targetNodeId"]],
      v631 = new Set(v630),
      v632 = v627[v618["targetNodeId"]],
      v633 = v630["length"] === 1 && v537(v632, "group"),
      v634 = _collectDragTargetIds(v625, v630),
      v635 = Array["from"](v634);
    if (v618["dragSource"] === "title" && v618["titleDragActivated"] !== true) {
      const v636 = Number["isFinite"](v618["titleDragStartScreenX"])
          ? v618["titleDragStartScreenX"]
          : v619,
        v637 = Number["isFinite"](v618["titleDragStartScreenY"])
          ? v618["titleDragStartScreenY"]
          : v620,
        v638 = Math["hypot"](v619 - v636, v620 - v637);
      if (v638 <= TITLE_DRAG_ACTIVATE_THRESHOLD_PX) return;
      ((v618["titleDragActivated"] = true),
        document["body"]["classList"]["add"]("is-dragging"));
      const v639 = v618["titleDragPendingSelectNodeId"];
      (v639 &&
        !v628["includes"](v639) &&
        (typeof v536["setSelectionMeta"] === "function" &&
          v536["setSelectionMeta"]({ source: "click" }),
        v536["setSelectedNodes"]([v639])),
        (v618["titleDragPendingSelectNodeId"] = null));
    }
    if (v630["length"] === 1) {
      const v640 = v632,
        v641 = _getImagePayloadFromNode(v537, v640);
      if (v641) {
        const v642 = _getStoryboardCellInfoAt(v623, v624, v627),
          v643 = v642 ? v627[v642["nodeId"]] : null,
          v644 =
            !!v641 &&
            !!v643 &&
            (!!v643["isEditing"] ||
              _isCellEmpty((v643["cells"] || [])[v642["cellIndex"]]));
        let v645 = v644 ? v642["nodeId"] : null,
          v646 = v644 ? v642["cellIndex"] : -1,
          v647 = v644 ? "storyboard" : "";
        if (!v644) {
          const v648 = _getCollageSlotInfoAt(v623, v624, v627),
            v649 = v648 ? v627[v648["nodeId"]] : null,
            v650 = (v649?.["items"] || [])[v648?.["itemIndex"]],
            v651 =
              !!v641 &&
              !!v649 &&
              (!!v649["isEditing"] || isCollageItemEmpty(v650));
          ((v645 = v651 ? v648["nodeId"] : null),
            (v646 = v651 ? v648["itemIndex"] : -1),
            (v647 = v651 ? "collage" : ""));
        }
        const v652 = v618["lastHoverNodeId"] || null;
        if (
          v645 !== v652 ||
          v646 !== (v618["lastHoverCellIndex"] ?? -1) ||
          v647 !== (v618["lastHoverKind"] || "")
        ) {
          if (v652) _clearDropSlotHighlight(v652);
          if (v645) _highlightDropSlot(v645, v647, v646);
          ((v618["lastHoverNodeId"] = v645),
            (v618["lastHoverCellIndex"] = v646),
            (v618["lastHoverKind"] = v647));
        }
      } else
        v618["lastHoverNodeId"] &&
          (_clearDropSlotHighlight(v618["lastHoverNodeId"]),
          (v618["lastHoverNodeId"] = null),
          (v618["lastHoverCellIndex"] = -1),
          (v618["lastHoverKind"] = ""));
    }
    let v653 = v621,
      v654 = v622;
    if (window["v2SnapToGrid"]) {
      const v655 = v618["pendingDx"] || 0,
        v656 = v618["pendingDy"] || 0,
        v657 = v653 - v618["lastWorldX"],
        v658 = v654 - v618["lastWorldY"];
      if (v630["length"] === 1) {
        const v659 = v627[v618["targetNodeId"]];
        if (v659) {
          const v660 = v659["x"] + v655 + v657,
            v661 = v659["y"] + v656 + v658;
          ((v653 += snapToCanvasGrid(v660) - v660),
            (v654 += snapToCanvasGrid(v661) - v661));
        }
      } else {
        let v662 = Infinity,
          v663 = Infinity;
        v635["forEach"]((v664) => {
          const v665 = v627[v664];
          if (!v665) return;
          ((v662 = Math["min"](v662, (v665["x"] || 0) + v655)),
            (v663 = Math["min"](v663, (v665["y"] || 0) + v656)));
        });
        if (Number["isFinite"](v662) && Number["isFinite"](v663)) {
          const v666 = v662 + v657,
            v667 = v663 + v658;
          ((v653 += snapToCanvasGrid(v666) - v666),
            (v654 += snapToCanvasGrid(v667) - v667));
        }
      }
    }
    const v668 = v625["ui"]?.["snapGuidesEnabled"] !== false && !v633,
      v669 = v668 ? _getDragSnapSpatialIndex(v625) : null;
    if (v668 && v630["length"] === 1) {
      const v670 = v632;
      if (v670) {
        const v671 = v618["pendingDx"] || 0,
          v672 = v618["pendingDy"] || 0,
          v673 = v670["x"] + v671 + (v653 - v618["lastWorldX"]),
          v674 = v670["y"] + v672 + (v654 - v618["lastWorldY"]),
          v675 = computeSingleNodeSnapGuides({
            nodesById: v625["nodes"],
            dragNodeId: v618["targetNodeId"],
            proposedX: v673,
            proposedY: v674,
            width: v670["width"] || 200,
            height: v670["height"] || 200,
            viewport: v626,
            thresholdPx: 8,
            spatialIndex: v669,
          });
        (Number["isFinite"](v675["snappedX"]) &&
          (v653 += v675["snappedX"] - v673),
          Number["isFinite"](v675["snappedY"]) &&
            (v654 += v675["snappedY"] - v674),
          Array["isArray"](v675["guideLines"]) &&
          v675["guideLines"]["length"] > 0
            ? window["_showSnapGuideLines"]?.(v675["guideLines"])
            : window["_clearSnapGuideLines"]?.());
      } else window["_clearSnapGuideLines"]?.();
    } else {
      if (v668 && v630["length"] >= 2) {
        const v676 = v618["pendingDx"] || 0,
          v677 = v618["pendingDy"] || 0,
          v678 = v653 - v618["lastWorldX"],
          v679 = v654 - v618["lastWorldY"];
        let v680 = Infinity,
          v681 = Infinity,
          v682 = -Infinity,
          v683 = -Infinity,
          v684 = 0;
        v635["forEach"]((v685) => {
          const v686 = v627[v685];
          if (!v686) return;
          v684 += 1;
          const v687 = (v686["x"] || 0) + v676,
            v688 = (v686["y"] || 0) + v677,
            v689 = v686["width"] || 200,
            v690 = v686["height"] || 200;
          ((v680 = Math["min"](v680, v687)),
            (v681 = Math["min"](v681, v688)),
            (v682 = Math["max"](v682, v687 + v689)),
            (v683 = Math["max"](v683, v688 + v690)));
        });
        if (v684 > 0 && Number["isFinite"](v680) && Number["isFinite"](v681)) {
          const v691 = v680 + v678,
            v692 = v681 + v679,
            v693 = computeMultiNodeSnapGuides({
              nodesById: v625["nodes"],
              movingNodeIds: v635,
              proposedBounds: {
                minX: v691,
                minY: v692,
                width: v682 - v680,
                height: v683 - v681,
              },
              viewport: v626,
              thresholdPx: 8,
              spatialIndex: v669,
            });
          (Number["isFinite"](v693["snappedX"]) &&
            (v653 += v693["snappedX"] - v691),
            Number["isFinite"](v693["snappedY"]) &&
              (v654 += v693["snappedY"] - v692),
            Array["isArray"](v693["guideLines"]) &&
            v693["guideLines"]["length"] > 0
              ? window["_showSnapGuideLines"]?.(v693["guideLines"])
              : window["_clearSnapGuideLines"]?.());
        } else window["_clearSnapGuideLines"]?.();
      } else window["_clearSnapGuideLines"]?.();
    }
    const v694 = v653 - v618["lastWorldX"],
      v695 = v654 - v618["lastWorldY"];
    if (v694 !== 0 || v695 !== 0) {
      ((v618["pendingDx"] = (v618["pendingDx"] || 0) + v694),
        (v618["pendingDy"] = (v618["pendingDy"] || 0) + v695));
      !v618["hasMoved"] &&
        Math["hypot"](v618["pendingDx"], v618["pendingDy"]) > 3 &&
        (v618["hasMoved"] = true);
      const v696 = [],
        v697 = [];
      (v635["forEach"]((v698) => {
        const v699 = _getNodeWrapperEl(v698);
        if (v699) {
          const v700 = v625["nodes"][v698];
          if (v700) {
            v696["push"]({
              id: v698,
              el: v699,
              origNode: v700,
              pendingDx: v618["pendingDx"],
              pendingDy: v618["pendingDy"],
              hasMoved: v618["hasMoved"],
            });
            const v701 =
              !v633 || v631["has"](v698)
                ? window["_v2MinimapDotMap"]?.["get"](v698) ||
                  document["getElementById"]("minimap-node-" + v698)
                : null;
            v701 &&
              window["_v2MinimapScale"] &&
              v697["push"]({
                minimapDot: v701,
                pendingDx: v618["pendingDx"],
                pendingDy: v618["pendingDy"],
                scale: window["_v2MinimapScale"],
              });
          }
        }
      }),
        v696["forEach"](
          ({
            id: v702,
            el: v703,
            origNode: v704,
            pendingDx: v705,
            pendingDy: v706,
            hasMoved: v707,
          }) => {
            const v708 = v704["x"] + v705,
              v709 = v704["y"] + v706;
            v703["style"]["transform"] =
              "translate(" + v708 + "px, " + v709 + "px)";
            if (v707) v703["classList"]["add"]("is-ui-hidden");
            v537(v704, "group") &&
              _syncNodeDragPreview(v702, { dx: v705, dy: v706, active: v707 });
          },
        ),
        v697["forEach"](
          ({
            minimapDot: v710,
            pendingDx: v711,
            pendingDy: v712,
            scale: v713,
          }) => {
            v710["style"]["transform"] =
              "translate(" + v711 * v713 + "px, " + v712 * v713 + "px)";
          },
        ));
      const v714 = _collectAffectedEdgesForTargets(v634, v629),
        v715 = window["_edgeDomCache"];
      v715 && v715["size"] > 0
        ? _updateDraggedEdges(v618, {
            affectedEdges: v714,
            edgeDomCache: v715,
            nodes: v625["nodes"],
            targetSet: v634,
            viewport: v626,
            edgeCount: Object["keys"](v629 || {})["length"],
            pendingDx: v618["pendingDx"],
            pendingDy: v618["pendingDy"],
            useEdgeGroupTransform: v633,
          })
        : _flushDragEdgeScheduler(v618);
      ((v618["lastWorldX"] = v653), (v618["lastWorldY"] = v654));
      const v716 = _getMultiSelectBoxEl();
      if (v716 && v716["style"]["display"] !== "none") {
        const v717 = v628["length"] > 0 ? v628 : [v618["targetNodeId"]];
        let v718 = Infinity,
          v719 = Infinity,
          v720 = -Infinity,
          v721 = -Infinity,
          v722 = 0;
        v717["forEach"]((v723) => {
          const v724 = v625["nodes"][v723];
          if (!v724) return;
          v722++;
          const v725 = v724["x"] + (v634["has"](v723) ? v618["pendingDx"] : 0),
            v726 = v724["y"] + (v634["has"](v723) ? v618["pendingDy"] : 0),
            v727 = v724["width"] || 260,
            v728 = v724["height"] || 100,
            v729 = v724["type"] !== "group" ? v726 - 30 : v726;
          ((v718 = Math["min"](v718, v725)),
            (v719 = Math["min"](v719, v729)),
            (v720 = Math["max"](v720, v725 + v727)),
            (v721 = Math["max"](v721, v726 + v728)));
        });
        if (v722 >= 2) {
          const v730 = 18;
          ((v716["style"]["left"] = v718 - v730 + "px"),
            (v716["style"]["top"] = v719 - v730 + "px"),
            (v716["style"]["width"] = v720 - v718 + v730 * 2 + "px"),
            (v716["style"]["height"] = v721 - v719 + v730 * 2 + "px"));
        }
      }
    }
  }
  function v731(v732, v733, v734) {
    const v735 = v536["getStateRaw"](),
      { viewport: v736, nodes: v737 } = v735,
      { x: v738, y: v739 } = v540(v733, v734, v736),
      v740 = v732["ghostEl"];
    v732["sourceCellEl"] &&
      (v732["sourceCellEl"]["classList"]["remove"]("is-drag-source"),
      (v732["sourceCellEl"] = null));
    const v741 = v737[v732["targetNodeId"]],
      v742 = v732["sourceCellIndex"],
      v743 = v732["draggedCellData"];
    if (!v741) {
      if (v740) v740["remove"]();
      return ((v732["ghostEl"] = null), { didAct: false, committed: false });
    }
    const v744 =
      _getStoryboardCellInfoAt(v738, v739, v737, { nearestInGap: true }) ||
      _getLastHoveredStoryboardCellInfo(v732, v738, v739, v737);
    let v745 = false;
    if (v744) {
      const v746 = v737[v744["nodeId"]],
        v747 = v744["cellIndex"];
      if (v746["id"] === v741["id"] && v747 === v742) {
        if (v740) v740["remove"]();
        v745 = false;
      } else {
        const v748 = v741["cells"]?.[v742] || v743,
          v749 = v746["cells"]?.[v747],
          v750 = resolveStoryboardCellDisplaySnapshot(v741, v748, v742),
          v751 =
            v749 && !_isCellEmpty(v749)
              ? resolveStoryboardCellDisplaySnapshot(v746, v749, v747)
              : null;
        if (!v750 || (v749 && !_isCellEmpty(v749) && !v751)) {
          if (v740) v740["remove"]();
          v745 = false;
        } else {
          const v752 =
            v746["id"] === v741["id"]
              ? _applyImmediateCellSwapPreview(v741["id"], v742, v747)
              : { ok: false, revert() {} };
          if (v752["ok"] && v740) v740["remove"]();
          v745 = _swapStoryboardCellsWithDisplaySnapshots({
            store: v536,
            sourceNode: v741,
            sourceCellIndex: v742,
            targetNode: v746,
            targetCellIndex: v747,
            sourceSnapshot: v750,
            targetSnapshot: v751,
          });
          !v745 && v752["ok"] && v752["revert"]();
          if (v745) {
            _flushStoryboardNodesNow(v741["id"], v746["id"]);
            if (!v752["ok"] && v740) v740["remove"]();
          } else v740 && v740["remove"]();
        }
      }
    } else {
      const v753 = getStoryboardCellMetrics(v741),
        v754 = v741?.["cells"]?.[v742],
        v755 = v754 && !_isCellEmpty(v754) ? v754 : v743,
        v756 = v755 || {},
        v757 = v541("source-image"),
        v758 = resolveStoryboardCellDisplaySnapshot(v741, v756, v742, {
          fileName: "storyboard_extract_" + v757 + ".jpg",
        });
      if (!v758?.["src"]) {
        if (v740) v740["remove"]();
        v745 = false;
      } else {
        const v759 = Number(v758["storyboardSourceIndex"]),
          v760 =
            Number["isInteger"](v759) && v759 >= 0
              ? v759
              : resolveStoryboardCellSourceIndex(v756, v742, v741),
          v761 = getStoryboardCellPixelBounds(v741, v760),
          v762 = _getStoryboardNodeSourceContext(v741);
        v536["batch"](() => {
          const v763 = (v742 % v741["cols"]) + 1,
            v764 = Math["floor"](v742 / v741["cols"]) + 1,
            v765 = v758["width"] || v761?.["width"] || v753["cellWidth"],
            v766 = v758["height"] || v761?.["height"] || v753["cellHeight"],
            v767 = getAutoMediaSizeByShortSide(v765, v766);
          (v536["addNode"](
            buildSourceMediaNodePayload({
              id: v757,
              type: "source-image",
              src: v758["src"],
              capturePreviewUrl: v758["capturePreviewUrl"] || "",
              localPath: v758["capturePreviewUrl"] ? null : v758["localPath"],
              thumbUrl: null,
              fileName: v758["fileName"] || v756["fileName"] || "",
              originalWidth: v758["width"] || v756["originalWidth"],
              originalHeight: v758["height"] || v756["originalHeight"],
              imageWidth: v758["width"] || v756["imageWidth"],
              imageHeight: v758["height"] || v756["imageHeight"],
              sourceLocalPath: null,
              sourceUrl: "",
              sourceWidth: null,
              sourceHeight: null,
              storyboardSourceCrop: false,
              storyboardExtractedCell: true,
              storyboardSourceIndex: v760,
              storyboardSourceNodeId: v741["id"],
              storyboardSourceLocalPath: v762["sourceLocalPath"],
              storyboardSourceUrl: v762["sourceUrl"],
              naturalWidth: v758["width"],
              naturalHeight: v758["height"],
              x: v738 - v767["width"] / 2,
              y: v739 - v767["height"] / 2,
              width: v767["width"],
              height: v767["height"],
              name: "提取分镜" + v764 + "-" + v763,
              fixedSize: true,
              needsAutoResize: false,
            }),
          ),
            v536["setSelectedNodes"]([v757]));
          const v768 = [...v741["cells"]];
          ((v768[v742] = _buildEmptyStoryboardCellForSlot(
            v768[v742],
            v741,
            v742,
          )),
            v536["updateNodeData"](v741["id"], { cells: v768 }));
        });
        v758["crop"]
          ? _persistStoryboardSourceCropExtract(
              v536,
              v757,
              v758["crop"],
              saveOutputBlobImpl,
            )
          : _persistStoryboardSnapshotPreviewToNode(
              v536,
              v757,
              v758,
              v758["fileName"] || "storyboard_extract_" + v757 + ".jpg",
              saveOutputBlobImpl,
            );
        if (v740 && v757) {
          const v769 = performance["now"](),
            v770 = 1600,
            v771 = () => {
              const v772 = _getNodeWrapperEl(v757),
                v773 = v772 ? v772["querySelector"]("img") : null;
              if (v773 && v773["complete"] && v773["naturalWidth"] > 0) {
                ((v740["style"]["transition"] =
                  "opacity\x200.18s\x20cubic-bezier(0.4,\x200,\x200.2,\x201)"),
                  (v740["style"]["opacity"] = "0"),
                  setTimeout(() => v740["remove"](), 180));
                return;
              }
              if (performance["now"]() - v769 >= v770) {
                v740["remove"]();
                return;
              }
              requestAnimationFrame(v771);
            };
          requestAnimationFrame(v771);
        } else v740 && v740["remove"]();
        v745 = true;
      }
    }
    v732["ghostEl"] = null;
    if (v732["lastHoverNodeId"]) {
      const v774 = window["v2Renderer"]?.["nodeInstances"]?.["get"](
        v732["lastHoverNodeId"],
      );
      if (v774 && typeof v774["highlightCell"] === "function")
        v774["highlightCell"](-1);
    }
    return { didAct: v745, committed: v745 };
  }
  function v775(v776, v777, v778) {
    _flushDragEdgeScheduler(v776);
    if (v776["dragSource"] === "title" && v776["titleDragActivated"] !== true)
      return { earlyCommit: false, didAct: false };
    const v779 = v536["getStateRaw"](),
      { viewport: v780, nodes: v781 } = v779,
      { x: v782, y: v783 } = v540(v777, v778, v780),
      { selectedNodeIds: v784 } = v779,
      v785 = v784["includes"](v776["targetNodeId"])
        ? Array["from"](v784)
        : [v776["targetNodeId"]];
    if (v785["length"] === 1) {
      const v786 = v781[v785[0]],
        v787 = _getImagePayloadFromNode(v537, v786);
      if (v787) {
        const v788 = _getStoryboardCellInfoAt(v782, v783, v781);
        if (v788) {
          const v789 = v781[v788["nodeId"]],
            v790 = (v789?.["cells"] || [])[v788["cellIndex"]],
            v791 =
              !!v787 && !!v789 && (!!v789["isEditing"] || _isCellEmpty(v790));
          if (v791) {
            const v792 = _getNodeWrapperEl(v786["id"]),
              v793 = v792 ? v792["querySelector"]("img") : null,
              v794 = _resolveStoryboardPayloadDisplaySnapshot(v787, {
                visibleSrc: _getImageElementDisplaySrc(v793),
              });
            if (!v794?.["src"]) return { earlyCommit: false, didAct: false };
            const v795 = [...(v789["cells"] || [])],
              v796 = v787["storyboardExtractedCell"] === true,
              v797 = v796 && _isCellEmpty(v790),
              v798 = v797
                ? {
                    ...(v790?.["residualImageLocalPath"]
                      ? {
                          residualImageLocalPath:
                            v790["residualImageLocalPath"],
                        }
                      : {}),
                    ...(v790?.["residualImageUrl"]
                      ? { residualImageUrl: v790["residualImageUrl"] }
                      : {}),
                    ...(v790?.["residualImageWidth"]
                      ? { residualImageWidth: v790["residualImageWidth"] }
                      : {}),
                    ...(v790?.["residualImageHeight"]
                      ? { residualImageHeight: v790["residualImageHeight"] }
                      : {}),
                    ...(v790?.["residualImageMode"]
                      ? { residualImageMode: v790["residualImageMode"] }
                      : {}),
                  }
                : {},
              v799 = getStoryboardCellMetrics(v789),
              v800 = getStoryboardCellPixelBounds(v789, v788["cellIndex"]),
              v801 = Math["max"](
                1,
                Math["round"](
                  (v800?.["width"] || v799["cellWidth"]) * v780["zoom"],
                ),
              ),
              v802 = Math["max"](
                1,
                Math["round"](
                  (v800?.["height"] || v799["cellHeight"]) * v780["zoom"],
                ),
              ),
              v803 = _getStoryboardCellCenterWorldPoint(
                v789,
                v788["cellIndex"],
              ),
              v804 = _worldToScreen(v803["x"], v803["y"], v780),
              v805 = v794["src"],
              v806 = _createGhostFromImage(
                v793,
                v801,
                v802,
                v805 || v787["thumbUrl"] || v787["url"] || "",
              );
            ((v806["style"]["transform"] =
              "translate(" +
              v777 +
              "px, " +
              v778 +
              "px) translate(-50%, -50%)"),
              document["body"]["appendChild"](v806),
              requestAnimationFrame(() => {
                ((v806["style"]["transition"] =
                  "transform 0.18s cubic-bezier(0.4, 0, 0.2, 1)"),
                  (v806["style"]["transform"] =
                    "translate(" +
                    v804["x"] +
                    "px,\x20" +
                    v804["y"] +
                    "px) translate(-50%, -50%)"));
              }));
            const v807 = buildFrozenStoryboardCellFromSnapshot(
              v794,
              v789,
              v788["cellIndex"],
              { id: v541("cell") },
            );
            return (
              (v795[v788["cellIndex"]] = { ...v807, ...v798 }),
              v536["updateNodeData"](v789["id"], { cells: v795 }),
              _persistStoryboardSnapshotPreviewToCell(
                v536,
                v789["id"],
                v788["cellIndex"],
                v807?.["id"],
                v794,
                v794["fileName"] ||
                  "storyboard_cell_" +
                    v789["id"] +
                    "_" +
                    v788["cellIndex"] +
                    ".jpg",
                saveOutputBlobImpl,
              ),
              v536["setSelectedNodes"]([]),
              setTimeout(() => {
                v536["deleteNodes"]([v786["id"]]);
              }, 50),
              requestAnimationFrame(() => {
                setTimeout(() => v543(), 0);
              }),
              _waitForStoryboardCellImage(
                v789["id"],
                v788["cellIndex"],
                v805,
                () => {
                  ((v806["style"]["transition"] =
                    "opacity 0.16s cubic-bezier(0.4, 0, 0.2, 1)"),
                    (v806["style"]["opacity"] = "0"),
                    setTimeout(() => v806["remove"](), 160));
                },
              ),
              { earlyCommit: true, didAct: true }
            );
          }
        }
        const v808 = _getCollageSlotInfoAt(v782, v783, v781);
        if (v808) {
          const v809 = v781[v808["nodeId"]],
            v810 = (v809?.["items"] || [])[v808["itemIndex"]];
          if (v809 && (!!v809["isEditing"] || isCollageItemEmpty(v810))) {
            const v811 = _getNodeWrapperEl(v786["id"]),
              v812 = v811 ? v811["querySelector"]("img") : null,
              v813 = _resolveCollagePayloadDisplaySnapshot(v787, {
                visibleSrc: _getImageElementDisplaySrc(v812),
              });
            if (!v813?.["src"]) return { earlyCommit: false, didAct: false };
            const v814 = v813["localPath"] || "",
              v815 = v813["src"];
            if (v815) {
              let v816 = null;
              const v817 = _getCollageItemFrameInfo(v809, v808["itemIndex"]);
              if (
                typeof document !== "undefined" &&
                document["body"] &&
                v817?.["frame"]
              ) {
                const v818 = Math["max"](
                    1,
                    Math["round"](v817["frame"]["width"] * v780["zoom"]),
                  ),
                  v819 = Math["max"](
                    1,
                    Math["round"](v817["frame"]["height"] * v780["zoom"]),
                  ),
                  v820 = _getCollageItemCenterWorldPoint(
                    v809,
                    v808["itemIndex"],
                  ),
                  v821 = _worldToScreen(v820["x"], v820["y"], v780);
                ((v816 = _createGhostFromImage(v812, v818, v819, v815)),
                  (v816["style"]["transform"] =
                    "translate(" +
                    v777 +
                    "px, " +
                    v778 +
                    "px)\x20translate(-50%,\x20-50%)"),
                  document["body"]["appendChild"](v816),
                  requestAnimationFrame(() => {
                    ((v816["style"]["transition"] =
                      "transform\x200.18s\x20cubic-bezier(0.4,\x200,\x200.2,\x201)"),
                      (v816["style"]["transform"] =
                        "translate(" +
                        v821["x"] +
                        "px, " +
                        v821["y"] +
                        "px)\x20translate(-50%,\x20-50%)"));
                  }));
              }
              const v822 = [...(v809["items"] || [])];
              v822[v808["itemIndex"]] = {
                ...(v810 || {}),
                id: v541("collage-item"),
                sourceNodeId: v786["id"],
                url: v815,
                localPath: normalizeLocalPath(v814),
                thumbLocalPath: normalizeLocalPath(v813["thumbLocalPath"]),
                sourceLocalPath: "",
                sourceUrl: "",
                sourceWidth: null,
                sourceHeight: null,
                imageWidth: v813["width"] || null,
                imageHeight: v813["height"] || null,
                sourceDisplayWidth: _toPositiveNumber(v786["width"]),
                sourceDisplayHeight: _toPositiveNumber(v786["height"]),
                label: v786["name"] || v786["fileName"] || "拼图图片",
                fit: "cover",
                focusX: 0.5,
                focusY: 0.5,
                isEmpty: false,
              };
              const v823 = window["v2Renderer"]?.["nodeInstances"]?.["get"](
                v809["id"],
              );
              v823 &&
                typeof v823["previewItems"] === "function" &&
                v823["previewItems"](v822);
              const v824 = () => {
                (v536["updateNodeData"](v809["id"], { items: v822 }),
                  v536["setSelectedNodes"]([v809["id"]]),
                  v536["deleteNodes"]([v786["id"]]));
              };
              if (typeof v536["batch"] === "function") v536["batch"](v824);
              else v824();
              return (
                requestAnimationFrame(() => {
                  v543();
                }),
                v816 &&
                  _waitForCollageItemImage(
                    v809["id"],
                    v808["itemIndex"],
                    v815,
                    () => _fadeOutGhost(v816),
                  ),
                v823 &&
                  typeof v823["highlightSlot"] === "function" &&
                  v823["highlightSlot"](-1),
                { earlyCommit: true, didAct: true }
              );
            }
          }
        }
      }
    }
    let v825 = false;
    (v776["pendingDx"] || v776["pendingDy"]) &&
      (v784["includes"](v776["targetNodeId"])
        ? v536["moveNodes"](v784, v776["pendingDx"], v776["pendingDy"])
        : v536["updateNodePosition"](
            v776["targetNodeId"],
            v776["pendingDx"],
            v776["pendingDy"],
          ),
      v785["forEach"]((v826) => {
        const v827 = _getNodeWrapperEl(v826);
        v827 &&
          (v827["classList"]["remove"]("is-ui-hidden"),
          delete v827["style"]["transform"],
          delete v827["_posKey"]);
      }),
      (v776["pendingDx"] = 0),
      (v776["pendingDy"] = 0),
      _clearDragEdgeTransformPreview(v776),
      (v825 = true));
    const v828 = v536["getStateRaw"](),
      v829 = collectGroupContainmentReparentOps(v828["nodes"], v785);
    return (
      v829["length"] > 0 &&
        (v536["batch"](() => {
          v829["forEach"](({ nodeId: v830, parentId: v831 }) => {
            v536["groupNodes"]([v830], v831);
          });
        }),
        (v825 = true)),
      { earlyCommit: false, didAct: v825 }
    );
  }
  return {
    tryStartTitleDrag: v544,
    tryStartNodeDrag: v553,
    updateDraggingCell: v605,
    updateDraggingNodes: v617,
    finishDraggingCell: v731,
    finishDraggingNodes: v775,
  };
}

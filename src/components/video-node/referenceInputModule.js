import { createReferenceFallbackThumbHtml } from "../../modules/referenceThumbnailFallback.js";
import {
  bindRefThumbFixedSlotDrag,
  bindRefThumbOrderDrag,
} from "../../modules/refThumbDragController.js";
import {
  buildFixedInputAssetSlotMap,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from "../../modules/fixedInputAssetRefs.js";
import {
  getAssetInputRefsFromPrompt,
  getAssetInputRefsFromPromptAndNode,
} from "../../modules/nodePromptShared.js";
import { getGenerationRatioSizeWithDom } from "../../modules/generationRatioSource.js";
import { resolveEffectiveInputKind } from "../../modules/modelInputPolicy.js";
import { localPathToUrl } from "../../utils/localMediaPath.js";
import { resolveCanvasImageLowZoomUrl } from "../../services/canvasMediaLocalService.js";
import { createPromptAttachmentButtonHTML } from "../refAttachmentButton.js";
const RH_V54_FPS_OPTIONS = Object["freeze"]([16, 24, 30]),
  RH_MIN_VIDEO_RESOLUTION = 832;
function normalizeRhV54Fps(v0) {
  const v1 = Number(v0);
  return RH_V54_FPS_OPTIONS["includes"](v1) ? v1 : 24;
}
function normalizeRhVideoResolution(v2) {
  const v3 = Number(v2);
  return Number["isFinite"](v3)
    ? Math["max"](RH_MIN_VIDEO_RESOLUTION, Math["trunc"](v3))
    : RH_MIN_VIDEO_RESOLUTION;
}
function normalizeVideoMediaKey(v4) {
  return String(v4 || "")
    ["trim"]()
    ["replace"](/^\/+/, "");
}
function normalizeRefSignaturePart(v5) {
  return String(v5 || "")["trim"]();
}
function getFixedRefBarLayoutKey(v6) {
  if (!v6) return "generic";
  const v7 = String(v6["visibilityLayoutKey"] || "")["trim"]();
  return v7 ? "fixed:" + v7 : "fixed";
}
function getManifestFixedContainerSlotOrder(v8, v9) {
  const v10 =
    v9?.["slotById"] && typeof v9["slotById"] === "object"
      ? v9["slotById"]
      : {};
  return Array["from"](v8?.["querySelectorAll"]?.("[data-slot]") || [])
    ["map"]((v11) => String(v11?.["dataset"]?.["slot"] || "")["trim"]())
    ["filter"]((v12) => v12 && v10[v12]);
}
function getVideoItemMediaKey(v13) {
  return (
    normalizeVideoMediaKey(v13?.["localPath"]) ||
    normalizeVideoMediaKey(v13?.["displayLocalPath"]) ||
    normalizeVideoMediaKey(v13?.["originalLocalPath"]) ||
    normalizeVideoMediaKey(v13?.["videoLocalPath"]) ||
    normalizeVideoMediaKey(v13?.["videoUrl"])
  );
}
function getVideoItemByEdge(v14, v15) {
  const v16 = Array["isArray"](v14?.["videos"]) ? v14["videos"] : [];
  if (!v16["length"]) return { item: null, index: -1, matchedByKey: false };
  const v17 = normalizeVideoMediaKey(v15?.["sourceMediaKey"]);
  let v18 = -1;
  v17 && (v18 = v16["findIndex"]((v19) => getVideoItemMediaKey(v19) === v17));
  const v20 = v18 >= 0;
  if (v18 < 0) {
    const v21 = Number(v14?.["mainVideoIndex"]),
      v22 = Number["isFinite"](v21) ? Math["max"](0, Math["trunc"](v21)) : 0;
    v18 = Math["max"](0, Math["min"](v16["length"] - 1, v22));
  }
  return { item: v16[v18] || null, index: v18, matchedByKey: v20 };
}
function getVideoThumbCandidate(v23, v24) {
  const v25 = getVideoItemByEdge(v23, v24),
    v26 = String(v25["item"]?.["thumbUrl"] || "")["trim"]();
  if (v26) return { thumbUrl: v26, selected: v25 };
  const v27 = Array["isArray"](v23?.["videos"]) ? v23["videos"] : [],
    v28 = Number(v23?.["mainVideoIndex"]),
    v29 = Number["isFinite"](v28) ? Math["max"](0, Math["trunc"](v28)) : 0,
    v30 = Math["max"](0, Math["min"](v27["length"] - 1, v29)),
    v31 = String(v27[v30]?.["thumbUrl"] || "")["trim"]();
  if (v31 && !v25["matchedByKey"])
    return {
      thumbUrl: v31,
      selected: { item: v27[v30] || null, index: v30, matchedByKey: false },
    };
  const v32 = String(v23?.["thumbUrl"] || "")["trim"]();
  if (v32 && (!v25["matchedByKey"] || v25["index"] === v30))
    return { thumbUrl: v32, selected: v25 };
  return { thumbUrl: "", selected: v25 };
}
function getVideoSourcePathForThumb(v33, v34) {
  if (String(v33?.["type"] || "") === "ai-video") {
    const { item: v35 } = getVideoItemByEdge(v33, v34),
      v36 = String(v35?.["localPath"] || "")["trim"]();
    if (v36) return localPathToUrl(v36);
    const v37 = String(v35?.["displayLocalPath"] || "")["trim"]();
    if (v37) return localPathToUrl(v37);
    const v38 = String(v35?.["originalLocalPath"] || "")["trim"]();
    if (v38) return localPathToUrl(v38);
    const v39 = String(v35?.["videoLocalPath"] || "")["trim"]();
    if (v39) return localPathToUrl(v39);
    const v40 = String(v35?.["videoUrl"] || "")["trim"](),
      v41 = localPathToUrl(v40);
    if (v41) return v41;
    return "";
  }
  const v42 = String(v33?.["localPath"] || "")["trim"]();
  if (v42) return localPathToUrl(v42);
  const v43 = String(v33?.["displayLocalPath"] || "")["trim"]();
  if (v43) return localPathToUrl(v43);
  const v44 = String(v33?.["originalLocalPath"] || "")["trim"]();
  if (v44) return localPathToUrl(v44);
  const v45 = String(v33?.["videoLocalPath"] || "")["trim"]();
  if (v45) return localPathToUrl(v45);
  const v46 = String(v33?.["videoUrl"] || v33?.["src"] || "")["trim"](),
    v47 = localPathToUrl(v46);
  if (v47) return v47;
  return "";
}
function getVideoRefMediaSignature(v48, v49) {
  const v50 = getVideoItemByEdge(v48, v49);
  return (
    getVideoItemMediaKey(v50["item"]) ||
    normalizeVideoMediaKey(v48?.["localPath"]) ||
    normalizeVideoMediaKey(v48?.["displayLocalPath"]) ||
    normalizeVideoMediaKey(v48?.["originalLocalPath"]) ||
    normalizeVideoMediaKey(v48?.["videoLocalPath"]) ||
    normalizeVideoMediaKey(v48?.["videoUrl"]) ||
    normalizeVideoMediaKey(v48?.["src"])
  );
}
function pickPositiveNumber(...v51) {
  for (const v52 of v51) {
    const v53 = Number(v52);
    if (Number["isFinite"](v53) && v53 > 0) return v53;
  }
  return 0;
}
function getSourceVideoFrameCount(v54, v55) {
  const v56 = getVideoItemByEdge(v54, v55)["item"],
    v57 = pickPositiveNumber(
      v56?.["videoFrameCount"],
      v56?.["frameCount"],
      v54?.["videoFrameCount"],
      v54?.["frameCount"],
    );
  return v57 > 0 ? Math["round"](v57) : 0;
}
function getSourceVideoDuration(v58, v59) {
  const v60 = getVideoItemByEdge(v58, v59)["item"];
  return pickPositiveNumber(
    v60?.["videoDuration"],
    v60?.["duration"],
    v58?.["videoDuration"],
    v58?.["duration"],
  );
}
function getRhV5SourceVideoNode({
  inEdges: inEdges = [],
  nodes: nodes = {},
  promptEl: promptEl = null,
  nodeData: nodeData = null,
}) {
  const v61 = Array["isArray"](inEdges) ? inEdges : [];
  let v62 =
    v61["find"]((v63) => String(v63?.["refSlot"] || "") === "sourceVideo") ||
    null;
  !v62 &&
    (v62 =
      v61["find"]((v64) =>
        String(nodes?.[v64?.["sourceId"]]?.["type"] || "")["includes"]("video"),
      ) || null);
  if (v62 && nodes?.[v62["sourceId"]])
    return { node: nodes[v62["sourceId"]], edge: v62 };
  const v65 = getAssetInputRefsFromPromptAndNode(promptEl, {
    nodeData: nodeData,
    allowedTypes: ["video"],
  })[0];
  return v65?.["nodeData"]
    ? { node: v65["nodeData"], edge: null }
    : { node: null, edge: null };
}
function getRhV5SourceVideoFrameCount({
  inEdges: inEdges = [],
  nodes: nodes = {},
  promptEl: promptEl = null,
  nodeData: nodeData = null,
  targetFps: targetFps = 0,
} = {}) {
  const { node: v66, edge: v67 } = getRhV5SourceVideoNode({
    inEdges: inEdges,
    nodes: nodes,
    promptEl: promptEl,
    nodeData: nodeData,
  });
  if (!v66) return null;
  const v68 = getSourceVideoFrameCount(v66, v67);
  if (v68 > 0) return v68;
  const v69 = Number(targetFps);
  if (!Number["isFinite"](v69) || v69 <= 0) return null;
  let v70 = getSourceVideoDuration(v66, v67);
  if (!(v70 > 0)) {
    const v71 = getVideoItemByEdge(v66, v67)["item"],
      v72 = pickPositiveNumber(
        v71?.["videoFrameCount"],
        v71?.["frameCount"],
        v66?.["videoFrameCount"],
        v66?.["frameCount"],
      ),
      v73 = pickPositiveNumber(
        v71?.["videoFps"],
        v71?.["fps"],
        v66?.["videoFps"],
        v66?.["fps"],
      );
    if (v72 > 0 && v73 > 0) v70 = v72 / v73;
  }
  return v70 > 0 ? Math["round"](v70 * v69) : null;
}
function createRunningHubAudioFallbackThumbHtml() {
  return createReferenceFallbackThumbHtml(
    "audio",
    "ref-thumb-media rh-v5-ref-media-fallback",
  );
}
const FIXED_REF_KIND_LABELS = Object["freeze"]({
    text: "文本",
    image: "图片",
    video: "视频",
    audio: "音频",
  }),
  FIXED_REF_SLOT_FALLBACK_LABELS = Object["freeze"]({
    sourceVideo: "源视频",
    refImage: "参考图",
    firstFrame: "首帧图",
    videoMask: "遮罩视频",
    maskImage: "遮罩",
    audio: "音频",
  });
function escapeHtmlText(v74) {
  return String(v74 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;");
}
function escapeHtmlAttr(v75) {
  return escapeHtmlText(v75)["replace"](/"/g, "&quot;");
}
function getFixedSlotLabelHtml(v76, v77) {
  const v78 = String(v77 || "")["trim"](),
    v79 = v76?.["slotById"]?.[v78] || null,
    v80 =
      String(v79?.["label"] || "")["trim"]() ||
      FIXED_REF_SLOT_FALLBACK_LABELS[v78] ||
      FIXED_REF_KIND_LABELS[v76?.["slotKindById"]?.[v78]] ||
      v78;
  return escapeHtmlText(v80);
}
function getFixedSlotAcceptMap(v81) {
  const v82 = {};
  return (
    (v81?.["visibleSlots"] || [])["forEach"]((v83) => {
      const v84 = String(v81?.["slotKindById"]?.[v83] || "")["trim"]();
      if (v83 && v84) v82[v83] = v84;
    }),
    v82
  );
}
function normalizeDisplayRatioSource(v85) {
  if (!v85 || typeof v85 !== "object" || Array["isArray"](v85)) return null;
  const v86 = Array["from"](
      new Set(
        [
          String(v85["slot"] || v85["refSlot"] || "")["trim"](),
          ...(Array["isArray"](v85["slots"]) ? v85["slots"] : []),
        ]
          ["map"]((v87) => String(v87 || "")["trim"]())
          ["filter"](Boolean),
      ),
    ),
    v88 = String(v85["kind"] || "")["trim"](),
    v89 = Number(v85["fallbackIndex"] ?? v85["inputIndex"] ?? v85["index"]),
    v90 = Number["isFinite"](v89) && v89 >= 0 ? Math["trunc"](v89) : null;
  if (v86["length"] === 0 && v90 === null) return null;
  return {
    ...(v86["length"] ? { slot: v86[0], slots: v86 } : {}),
    ...(v88 ? { kind: v88 } : {}),
    ...(v90 !== null ? { fallbackIndex: v90 } : {}),
  };
}
function resolveConfiguredDisplayRatioSlot(v91, v92 = {}) {
  const v93 = normalizeDisplayRatioSource(
    v91?.["manifest"]?.["inputSlots"]?.["displayAspectRatioSource"],
  );
  if (!v93) return null;
  const v94 = Array["isArray"](v93["slots"])
    ? v93["slots"]
    : v93["slot"]
      ? [v93["slot"]]
      : [];
  for (const v95 of v94) {
    if (!v92?.[v95]) continue;
    if (
      v93["kind"] &&
      String(v91?.["slotKindById"]?.[v95] || "") !== v93["kind"]
    )
      continue;
    return { slot: v95, mode: "configured" };
  }
  const v96 = Array["isArray"](v91?.["visibleSlots"])
      ? v91["visibleSlots"]
      : [],
    v97 = v96["filter"]((v98) => {
      const v99 = v92?.[v98];
      if (!v99) return false;
      if (!v93["kind"]) return true;
      return String(v91?.["slotKindById"]?.[v98] || "") === v93["kind"];
    }),
    v100 = v93["fallbackIndex"];
  if (Number["isInteger"](v100) && v100 >= 0 && v100 < v97["length"])
    return { slot: v97[v100], mode: "configured" };
  return null;
}
function resolveLegacySingleReferenceVideoSlot(v101, v102 = {}) {
  const v103 = v101?.["visibleSlots"] || [],
    v104 =
      v103["length"] === 2 &&
      v103[0] === "sourceVideo" &&
      v103[1] === "refImage" &&
      (v101?.["fixedSlots"] || [])["length"] === 2;
  if (!v104 || !v102?.["sourceVideo"]) return null;
  return { slot: "sourceVideo", mode: "sourceVideoFrames" };
}
function resolveFixedInputDisplayRatioSlot(v105, v106 = {}) {
  return (
    resolveConfiguredDisplayRatioSlot(v105, v106) ||
    resolveLegacySingleReferenceVideoSlot(v105, v106)
  );
}
function getFixedInputRatioMediaSize(v107, v108 = {}) {
  if (!v107) return null;
  const v109 = String(v107["kind"] || v107["refType"] || "")["trim"](),
    v110 =
      v107["node"] || v107["ref"]?.["nodeData"] || v108?.[v107["sourceId"]];
  if (!v110) return null;
  const v111 =
    v109 === "video" ? "video" : v109 === "image" ? "img" : "img, video";
  return getGenerationRatioSizeWithDom({
    nodeId: v107["sourceId"],
    nodeData: v110,
    edge: v107["edge"] || null,
    mediaSelector: v111,
    includeNodeFrame: true,
  });
}
function calcFixedInputDisplaySize(v112, v113, v114 = 300) {
  const v115 = Number(v112),
    v116 = Number(v113);
  if (!(Number["isFinite"](v115) && v115 > 0)) return null;
  if (!(Number["isFinite"](v116) && v116 > 0)) return null;
  const v117 = Math["max"](1, Math["round"](Number(v114) || 300));
  if (v115 >= v116)
    return { width: Math["round"]((v115 / v116) * v117), height: v117 };
  return { width: v117, height: Math["round"]((v116 / v115) * v117) };
}
export const __videoReferenceInputTest = {
  getVideoThumbCandidate: getVideoThumbCandidate,
  getVideoSourcePathForThumb: getVideoSourcePathForThumb,
  getVideoRefMediaSignature: getVideoRefMediaSignature,
  getRhV5SourceVideoFrameCount: getRhV5SourceVideoFrameCount,
  createRunningHubAudioFallbackThumbHtml:
    createRunningHubAudioFallbackThumbHtml,
  calcFixedInputDisplaySize: calcFixedInputDisplaySize,
};
export function createVideoNodeReferenceInputModule(v118) {
  const {
    store: v119,
    api: v120,
    _syncPillLabels: v121,
    getImage: v122,
    ensureThumbDecoded: v123,
    revealRefThumbMedia: v124,
  } = v118;
  class v125 {
    ["_getRefSourceStateKey"](v126) {
      const v127 = String(v126?.["type"] || ""),
        v128 = normalizeRefSignaturePart(v126?.["mask"]),
        v129 = normalizeRefSignaturePart(
          v126?.["outputText"] || v126?.["text"] || v126?.["content"] || "",
        );
      if (v127["includes"]("text")) return "t:" + v129;
      if (v127["includes"]("video")) {
        const v130 = (Array["isArray"](v126?.["videos"]) ? v126["videos"] : [])
          [
            "map"
          ]((v131) => [normalizeVideoMediaKey(v131?.["localPath"]), normalizeVideoMediaKey(v131?.["displayLocalPath"]), normalizeVideoMediaKey(v131?.["originalLocalPath"]), normalizeVideoMediaKey(v131?.["videoLocalPath"]), normalizeVideoMediaKey(v131?.["videoUrl"]), normalizeVideoMediaKey(v131?.["thumbId"]), normalizeVideoMediaKey(v131?.["thumbUrl"]), Number(v131?.["videoFrameCount"] || v131?.["frameCount"] || 0) || 0, Number(v131?.["videoDuration"] || v131?.["duration"] || 0) || 0, Number(v131?.["videoFps"] || v131?.["fps"] || 0) || 0]["join"](","))
          ["join"](";");
        return [
          "v",
          Number["isFinite"](Number(v126?.["mainVideoIndex"]))
            ? Math["max"](0, Math["trunc"](Number(v126["mainVideoIndex"])))
            : 0,
          normalizeVideoMediaKey(v126?.["thumbId"]),
          normalizeVideoMediaKey(v126?.["thumbUrl"]),
          normalizeVideoMediaKey(v126?.["localPath"]),
          normalizeVideoMediaKey(v126?.["displayLocalPath"]),
          normalizeVideoMediaKey(v126?.["originalLocalPath"]),
          normalizeVideoMediaKey(v126?.["videoLocalPath"]),
          normalizeVideoMediaKey(v126?.["videoUrl"]),
          normalizeVideoMediaKey(v126?.["src"]),
          normalizeVideoMediaKey(v126?.["url"]),
          normalizeVideoMediaKey(v126?.["resultUrl"]),
          normalizeVideoMediaKey(v126?.["sourceUrl"]),
          Number(v126?.["videoFrameCount"] || 0) || 0,
          Number(v126?.["videoDuration"] || 0) || 0,
          Number(v126?.["videoFps"] || 0) || 0,
          v130,
        ]["join"](":");
      }
      if (v127["includes"]("audio"))
        return [
          "a",
          normalizeRefSignaturePart(v126?.["audioUrl"]),
          normalizeRefSignaturePart(v126?.["src"]),
          normalizeRefSignaturePart(v126?.["localPath"]),
        ]["join"](":");
      return [
        "i",
        normalizeRefSignaturePart(v126?.["thumbId"]),
        normalizeRefSignaturePart(v126?.["thumbUrl"]),
        normalizeRefSignaturePart(v126?.["imageUrl"]),
        normalizeRefSignaturePart(v126?.["src"]),
        normalizeRefSignaturePart(v126?.["localPath"]),
        v128,
      ]["join"](":");
    }
    ["_getRhV5SourceVideoFrameCount"](v132) {
      const v133 = v119["getIncomingEdges"](this["nodeId"]) || [],
        v134 = v119["getState"]() || {},
        v135 = v134["nodes"] || {};
      return getRhV5SourceVideoFrameCount({
        inEdges: v133,
        nodes: v135,
        promptEl: this["promptEl"],
        nodeData: v135?.[this["nodeId"]] || this["_data"] || null,
        targetFps: v132,
      });
    }
    ["_createAssetRefThumbData"](
      v136,
      { slot: slot = "", key: key = "" } = {},
    ) {
      const v137 = String(v136?.["type"] || "")["trim"]();
      if (!v137) return null;
      let v138 = "",
        v139 = "";
      if (v137 === "image") {
        const v140 = this["_resolveMediaUrl"](
          v136["thumbUrl"] || v136["url"] || "",
        );
        if (!v140) return null;
        (v123(v140),
          (v138 =
            '<img src="' +
            v140 +
            "\x22\x20class=\x22ref-thumb-media\x20is-pending\x22\x20draggable=\x22false\x22>"),
          (v139 = "asset-i|" + v140));
      } else {
        if (v137 === "video") {
          const v141 = this["_resolveMediaUrl"](v136["thumbUrl"] || "");
          v141
            ? (v123(v141),
              (v138 =
                "<img\x20src=\x22" +
                v141 +
                '" class="ref-thumb-media is-pending" draggable="false">'),
              (v139 = "asset-v|" + v141))
            : ((v138 = createReferenceFallbackThumbHtml("video")),
              (v139 = "asset-v|fallback"));
        } else {
          if (v137 === "audio")
            ((v138 = createReferenceFallbackThumbHtml("audio")),
              (v139 = "asset-a|fallback"));
          else {
            if (v137 === "text")
              ((v138 = createReferenceFallbackThumbHtml("text")),
                (v139 =
                  "asset-t|" +
                  String(v136["content"] || v136["label"] || "")["trim"]()));
            else return null;
          }
        }
      }
      const v142 = String(v136["assetId"] || ""),
        v143 = String(v136["itemIndex"] ?? ""),
        v144 = String(v136["assetMentionOccurrence"] ?? ""),
        v145 = String(v136["assetRefSource"] || "prompt"),
        v146 = "asset:" + v142 + ":" + v143;
      return {
        key:
          key ||
          "asset:" + v145 + ":" + v142 + ":" + v143 + ":" + v137 + ":" + v144,
        edgeId: "",
        kind: v137,
        sourceId: v146,
        assetId: v142,
        assetIndex: v143,
        assetOccurrence: v144,
        assetRefSource: v145,
        refType: v137,
        node: v136["nodeData"] || null,
        ref: v136,
        html: v138,
        thumbHTML: v138,
        sig:
          "" +
          (slot ? slot + "|" : "") +
          v146 +
          "|" +
          v137 +
          "|" +
          String(v136["url"] || "") +
          "|" +
          v139,
        virtual: true,
      };
    }
    ["_createTextEdgeRefThumbData"](v147, v148) {
      const v149 = String(
        v148?.["outputText"] ||
          v148?.["text"] ||
          v148?.["content"] ||
          v148?.["prompt"] ||
          "",
      )["trim"]();
      if (!v149) return null;
      return {
        key: "edge:" + v147["id"],
        edgeId: v147["id"],
        kind: "text",
        sourceId: v147["sourceId"],
        html: createReferenceFallbackThumbHtml("text"),
        sig: "text|" + v147["id"] + "|" + v147["sourceId"] + "|" + v149,
      };
    }
    ["_syncFixedTrailingRefItems"](v150, v151 = []) {
      if (!v150) return;
      const v152 = new Map();
      v150["querySelectorAll"](".rh-fixed-extra-ref")["forEach"]((v153) =>
        v152["set"](v153["dataset"]["refKey"], v153),
      );
      const v154 = new Set();
      (Array["isArray"](v151) ? v151 : [])["forEach"]((v155) => {
        if (!v155?.["key"]) return;
        let v156 = v152["get"](v155["key"]);
        (!v156 &&
          ((v156 = document["createElement"]("div")),
          (v156["className"] =
            "ref-thumb-wrap rh-v5-ref-box rh-fixed-extra-ref" +
            (v155["virtual"] ? " ref-thumb-wrap--asset" : ""))),
          v156["setAttribute"](
            "draggable",
            v155["virtual"] || !v155["edgeId"] ? "false" : "true",
          ),
          v156["dataset"]["sig"] !== v155["sig"] &&
            ((v156["innerHTML"] =
              v155["html"] +
              '<button type="button" class="ref-thumb-delete" title="移除参考">&times;</button>'),
            (v156["dataset"]["sig"] = v155["sig"]),
            v124(v156, v155["sig"])),
          (v156["dataset"]["refKey"] = v155["key"]),
          (v156["dataset"]["edgeId"] = v155["edgeId"] || ""),
          (v156["dataset"]["kind"] = v155["kind"] || ""),
          (v156["dataset"]["sourceId"] = v155["sourceId"] || ""),
          (v156["dataset"]["refOrigin"] = v155["virtual"] ? "asset" : "node"),
          v155["virtual"]
            ? ((v156["dataset"]["assetId"] = v155["assetId"] || ""),
              (v156["dataset"]["assetIndex"] = v155["assetIndex"] || ""),
              (v156["dataset"]["assetOccurrence"] =
                v155["assetOccurrence"] || ""),
              (v156["dataset"]["assetRefSource"] =
                v155["assetRefSource"] || "prompt"),
              (v156["dataset"]["refType"] =
                v155["refType"] || v155["kind"] || ""))
            : (delete v156["dataset"]["assetId"],
              delete v156["dataset"]["assetIndex"],
              delete v156["dataset"]["assetOccurrence"],
              delete v156["dataset"]["assetRefSource"],
              delete v156["dataset"]["refType"]),
          v150["appendChild"](v156),
          v154["add"](v155["key"]));
      });
      for (const [v157, v158] of v152["entries"]()) {
        if (!v154["has"](v157)) v158["remove"]();
      }
    }
    ["_getFixedSlotRefThumbObjectUrlMap"]() {
      return (
        !this["_fixedSlotRefThumbObjectUrls"] &&
          (this["_fixedSlotRefThumbObjectUrls"] = new Map()),
        this["_fixedSlotRefThumbObjectUrls"]
      );
    }
    ["_clearObjectUrlMap"](v159) {
      if (!v159 || v159["size"] === 0) return;
      for (const v160 of v159["values"]()) {
        v160 &&
          String(v160)["startsWith"]("blob:") &&
          URL["revokeObjectURL"](v160);
      }
      v159["clear"]();
    }
    ["_pruneFixedSlotRefThumbObjectUrls"](v161 = [], v162 = {}) {
      const v163 = this["_getFixedSlotRefThumbObjectUrlMap"](),
        v164 = new Set();
      for (const v165 of v161 || []) {
        const v166 = v162?.[v165?.["sourceId"]];
        if (v166?.["thumbId"]) v164["add"](v166["thumbId"]);
      }
      for (const [v167, v168] of v163["entries"]()) {
        if (v164["has"](v167)) continue;
        (v168 &&
          String(v168)["startsWith"]("blob:") &&
          URL["revokeObjectURL"](v168),
          v163["delete"](v167));
      }
    }
    ["_resolveFixedMediaUrl"](v169) {
      const v170 = String(v169 || "")["trim"]();
      if (!v170) return "";
      if (typeof this["_resolveMediaUrl"] === "function")
        return this["_resolveMediaUrl"](v170);
      return v170;
    }
    async ["_resolveFixedThumbObjectUrl"](v171) {
      const v172 = String(v171 || "")["trim"]();
      if (!v172) return "";
      const v173 = this["_getFixedSlotRefThumbObjectUrlMap"]();
      if (v173["has"](v172)) return v173["get"](v172);
      const v174 = await v122(v172);
      if (!v174) return "";
      const v175 = URL["createObjectURL"](v174);
      return (v173["set"](v172, v175), v175);
    }
    async ["_createFixedEdgeRefThumbData"](v176, v177, v178, v179) {
      const v180 = String(v178 || "")["trim"]();
      if (!v176 || !v177 || !v180) return null;
      if (v180 === "text")
        return this["_createTextEdgeRefThumbData"](v176, v177);
      let v181 = "",
        v182 = "";
      if (v180 === "image") {
        let v183 = await this["_resolveFixedThumbObjectUrl"](v177["thumbId"]);
        !v183 &&
          (v183 = this["_resolveFixedMediaUrl"](
            resolveCanvasImageLowZoomUrl(v177),
          ));
        !v183 &&
          v177["localPath"] &&
          (v183 = this["_resolveFixedMediaUrl"](
            localPathToUrl(v177["localPath"]),
          ));
        if (!v183) return null;
        (v123(v183),
          (v181 =
            '<img src="' +
            v183 +
            '" class="ref-thumb-media is-pending" draggable="false">'),
          (v182 = "i|" + v183));
      } else {
        if (v180 === "video") {
          const v184 = getVideoRefMediaSignature(v177, v176);
          let v185 = await this["_resolveFixedThumbObjectUrl"](v177["thumbId"]);
          if (!v185) {
            const v186 = getVideoThumbCandidate(v177, v176);
            v185 = this["_resolveFixedMediaUrl"](
              v186["thumbUrl"] || v177["imageUrl"] || "",
            );
          }
          v185
            ? (v123(v185),
              (v181 =
                '<img src="' +
                v185 +
                '" class="ref-thumb-media is-pending" draggable="false">'),
              (v182 = "v|" + (v184 || v185)))
            : (v179?.(v176, v177),
              (v181 = createReferenceFallbackThumbHtml(
                "video",
                "ref-thumb-media rh-v5-ref-media-fallback",
              )),
              (v182 = "v|" + (v184 || "fallback")));
        } else {
          if (v180 === "audio") {
            const v187 = String(
              v177["localPath"] || v177["src"] || v177["audioUrl"] || "",
            );
            if (!v187) return null;
            ((v181 = createRunningHubAudioFallbackThumbHtml()),
              (v182 = "a|" + v187));
          } else return null;
        }
      }
      return {
        key: "edge:" + v176["id"],
        edgeId: v176["id"],
        kind: v180,
        sourceId: v176["sourceId"],
        node: v177,
        edge: v176,
        html: v181,
        thumbHTML: v181,
        sig: v176["id"] + "|" + v176["sourceId"] + "|" + v182,
      };
    }
    ["_syncFixedSlotEl"](v188, v189, v190, v191) {
      if (!v188 || !v189) return;
      const v192 = String(v191?.["slotKindById"]?.[v189] || "")["trim"](),
        v193 = v188["querySelector"]('[data-slot="' + v189 + "\x22]");
      if (!v190) {
        let v194 =
          v193 && v193["classList"]?.["contains"]("ref-upload-slot")
            ? v193
            : document["createElement"]("button");
        ((v194["className"] = "ref-thumb-wrap ref-upload-slot rh-v5-ref-box"),
          (v194["type"] = "button"),
          v194["setAttribute"]("draggable", "false"),
          v194["setAttribute"]("title", "上传参考"),
          (v194["dataset"]["slot"] = v189),
          (v194["dataset"]["kind"] = v192),
          (v194["dataset"]["edgeId"] = ""),
          (v194["dataset"]["sourceId"] = ""),
          (v194["dataset"]["refOrigin"] = ""),
          delete v194["dataset"]["refKey"],
          delete v194["dataset"]["assetId"],
          delete v194["dataset"]["assetIndex"],
          delete v194["dataset"]["assetOccurrence"],
          delete v194["dataset"]["assetRefSource"],
          delete v194["dataset"]["refType"]);
        const v195 = getFixedSlotLabelHtml(v191, v189),
          v196 = "empty|" + v189 + "|" + v192 + "|" + v195;
        v194["dataset"]["sig"] !== v196 &&
          ((v194["innerHTML"] =
            '<span class="ref-upload-label">' + v195 + "</span>"),
          (v194["dataset"]["sig"] = v196));
        if (v193 && v193 !== v194) v193["replaceWith"](v194);
        else {
          if (!v193) v188["appendChild"](v194);
        }
        return;
      }
      let v197 =
        v193 && !v193["classList"]?.["contains"]("ref-upload-slot")
          ? v193
          : document["createElement"]("div");
      ((v197["className"] =
        "ref-thumb-wrap rh-v5-ref-box" +
        (v190["virtual"] ? " ref-thumb-wrap--asset" : "")),
        v197["setAttribute"](
          "draggable",
          v190["virtual"] || !v190["edgeId"] ? "false" : "true",
        ));
      const v198 = v189 + "|" + (v190["sig"] || "");
      v197["dataset"]["sig"] !== v198 &&
        ((v197["innerHTML"] =
          v190["html"] +
          '<button type="button" class="ref-thumb-delete" title="移除参考">&times;</button>'),
        (v197["dataset"]["sig"] = v198),
        v124(v197, v198));
      ((v197["dataset"]["slot"] = v189),
        (v197["dataset"]["kind"] = v190["kind"] || v192),
        (v197["dataset"]["refKey"] =
          v190["key"] || (v190["edgeId"] ? "edge:" + v190["edgeId"] : "")),
        (v197["dataset"]["edgeId"] = v190["edgeId"] || ""),
        (v197["dataset"]["sourceId"] = v190["sourceId"] || ""),
        (v197["dataset"]["refOrigin"] = v190["virtual"] ? "asset" : "node"));
      v190["virtual"]
        ? ((v197["dataset"]["assetId"] = v190["assetId"] || ""),
          (v197["dataset"]["assetIndex"] = v190["assetIndex"] || ""),
          (v197["dataset"]["assetOccurrence"] = v190["assetOccurrence"] || ""),
          (v197["dataset"]["assetRefSource"] =
            v190["assetRefSource"] || "prompt"),
          (v197["dataset"]["refType"] =
            v190["refType"] || v190["kind"] || v192))
        : (delete v197["dataset"]["assetId"],
          delete v197["dataset"]["assetIndex"],
          delete v197["dataset"]["assetOccurrence"],
          delete v197["dataset"]["assetRefSource"],
          delete v197["dataset"]["refType"]);
      if (v193 && v193 !== v197) v193["replaceWith"](v197);
      else {
        if (!v193) v188["appendChild"](v197);
      }
    }
    ["_syncFixedSlotOrder"](v199, v200 = []) {
      if (!v199) return;
      const v201 = v199["querySelector"](".rh-fixed-extra-ref");
      (Array["isArray"](v200) ? v200 : [])["forEach"]((v202) => {
        const v203 = v199["querySelector"]('[data-slot="' + v202 + "\x22]");
        if (!v203) return;
        v201 && typeof v199["insertBefore"] === "function"
          ? v199["insertBefore"](v203, v201)
          : v199["appendChild"](v203);
      });
    }
    ["_syncSingleReferenceEditorRatio"](v204, v205, v206 = {}) {
      const v207 = resolveFixedInputDisplayRatioSlot(v204, v205),
        v208 = v207?.["slot"] || "";
      if (!v208 || !v205?.[v208]) return;
      const v209 = getFixedInputRatioMediaSize(v205[v208], v206),
        v210 = calcFixedInputDisplaySize(v209?.["width"], v209?.["height"]);
      if (!v210) return;
      const v211 = 280,
        v212 = (v213) => {
          const v214 =
            typeof document !== "undefined" &&
            typeof document["getElementById"] === "function"
              ? document["getElementById"](this["nodeId"])
              : null;
          if (!v214) return;
          v214["classList"]["add"]("is-ratio-animating");
          if (this["_ratioAnimTimer"]) clearTimeout(this["_ratioAnimTimer"]);
          this["_ratioAnimTimer"] = setTimeout(() => {
            const v215 =
              typeof document !== "undefined" &&
              typeof document["getElementById"] === "function"
                ? document["getElementById"](this["nodeId"])
                : null;
            if (v215) v215["classList"]["remove"]("is-ratio-animating");
            this["_ratioAnimTimer"] = null;
          }, v213 + 80);
        },
        v216 =
          v119["getState"]?.()["nodes"]?.[this["nodeId"]] ||
          this["_data"] ||
          {},
        v217 = Number(v216["width"]) || 300,
        v218 = Number(v216["height"]) || 300,
        v219 = Number["isFinite"](Number(v216["x"])) ? Number(v216["x"]) : 0,
        v220 = Number["isFinite"](Number(v216["y"])) ? Number(v216["y"]) : 0,
        v221 = v210["width"],
        v222 = v210["height"],
        v223 = v221 - v217,
        v224 = v222 - v218;
      if (v223 !== 0 || v224 !== 0) v212(v211);
      const v225 = {
        width: v221,
        height: v222,
        x: Math["round"](v219 - v223 / 2),
        y: Math["round"](v220 - v224),
        aspectRatio: "自适应",
      };
      (v119["updateNodeData"](this["nodeId"], v225),
        (this["_data"] = { ...v216, ...v225 }));
      const v226 = this["footerEl"]?.["querySelector"](".img-ratio-label"),
        v227 = this["footerEl"]?.["querySelector"](".img-ratio-icon-slot");
      if (v226 && v207["mode"] === "sourceVideoFrames") {
        const v228 = normalizeRhV54Fps(this["_data"]?.["rhVideoFps"]),
          v229 = Number["isFinite"](this["_data"]?.["rhVideoFrames"])
            ? Math["max"](0, Math["trunc"](this["_data"]["rhVideoFrames"]))
            : 77,
          v230 = normalizeRhVideoResolution(
            this["_data"]?.["rhVideoResolution"],
          ),
          v231 = v229 === 0 ? "全长" : String(v229);
        v226["textContent"] = "帧数" + v231 + "·帧率" + v228 + "·分辨率" + v230;
      }
      v227 &&
        typeof this["_getRatioIconHTML"] === "function" &&
        (v227["innerHTML"] = this["_getRatioIconHTML"]("自适应"));
      if (
        this["previewEl"] &&
        typeof this["previewEl"]["animate"] === "function"
      ) {
        ((this["previewEl"]["style"]["transition"] = "none"),
          (this["previewEl"]["style"]["transformOrigin"] = "bottom center"),
          (this["previewEl"]["style"]["transform"] =
            "scaleX(" + v217 / v221 + ") scaleY(" + v218 / v222 + ")"),
          void this["previewEl"]["offsetWidth"]);
        if (this["_ratioFlipAnim"]) this["_ratioFlipAnim"]["cancel"]();
        const v232 =
          "scaleX(" + v217 / v221 + ")\x20scaleY(" + v218 / v222 + ")";
        this["_ratioFlipAnim"] = this["previewEl"]["animate"](
          [{ transform: v232 }, { transform: "none" }],
          {
            duration: v211,
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            fill: "forwards",
          },
        );
        const v233 = () => {
          ((this["_ratioFlipAnim"] = null),
            (this["previewEl"]["style"]["transformOrigin"] = ""),
            (this["previewEl"]["style"]["transform"] = ""));
        };
        ((this["_ratioFlipAnim"]["onfinish"] = v233),
          (this["_ratioFlipAnim"]["oncancel"] = v233));
      }
    }
    async ["_renderManifestFixedRefBar"]({
      fixedInputConfig: v234,
      inEdges: v235,
      nodes: v236,
      nodeData: v237,
      attachBtnHTML: v238,
      ensureVideoThumb: v239,
    }) {
      const v240 = (v234?.["visibleSlots"] || [])
        ["map"]((v241) => String(v241 || "")["trim"]())
        ["filter"](Boolean);
      if (!v240["length"]) return false;
      this["_pruneFixedSlotRefThumbObjectUrls"](v235, v236);
      const v242 = new Set(v240),
        v243 = {};
      v240["forEach"]((v244) => {
        v243[v244] = null;
      });
      const v245 = [],
        v246 = { text: 0, image: 0, video: 0, audio: 0 },
        v247 = {},
        v248 = [];
      for (const v249 of v235 || []) {
        const v250 = v236?.[v249?.["sourceId"]];
        if (!v250) continue;
        const v251 = resolveEffectiveInputKind(v250, v249) || "image";
        ((v246[v251] = Number(v246[v251] || 0) + 1),
          (v247[v249["sourceId"]] =
            "@" + (FIXED_REF_KIND_LABELS[v251] || v251) + v246[v251]));
        if (v251 === "text") {
          const v252 = this["_createTextEdgeRefThumbData"](v249, v250);
          if (v252) v245["push"](v252);
          continue;
        }
        const v253 = resolveFixedInputSlotForRef({
            fixedInputConfig: v234,
            refSlot: v249?.["refSlot"],
            kind: v251,
            occupiedSlots: v243,
          }),
          v254 = v253["slot"];
        if (v253["reason"] === "kindMismatch") continue;
        if (v253["reason"] === "hidden") {
          if (v249?.["id"]) v248["push"](v249["id"]);
          continue;
        }
        if (!v254 || v243[v254]) {
          const v255 = await this["_createFixedEdgeRefThumbData"](
            v249,
            v250,
            v251,
            v239,
          );
          if (v255) v245["push"](v255);
          continue;
        }
        const v256 = await this["_createFixedEdgeRefThumbData"](
          v249,
          v250,
          v251,
          v239,
        );
        if (v256) v243[v254] = v256;
      }
      v248["length"] > 0 &&
        (typeof v119["batch"] === "function"
          ? v119["batch"](() => {
              v248["forEach"]((v257) => v119["removeEdge"](v257));
            })
          : v248["forEach"]((v258) => v119["removeEdge"](v258)));
      const v259 = new Set(
          Object["entries"](v243)
            ["filter"](([, v260]) => !!v260)
            ["map"](([v261]) => v261),
        ),
        v262 = buildFixedInputAssetSlotMap(this["promptEl"], {
          slotOrderByType: v234?.["slotOrderByType"] || {},
          visibleSlots: v240,
          exclusiveGroups: v234?.["exclusiveGroups"] || [],
          occupiedSlots: v259,
          nodeData: v237,
        });
      (v240["forEach"]((v263) => {
        if (v243[v263]) return;
        const v264 = this["_createAssetRefThumbData"](v262[v263], {
          slot: v263,
        });
        if (v264) v243[v263] = v264;
      }),
        getAssetInputRefsFromPrompt(this["promptEl"], {
          allowedTypes: ["text"],
        })["forEach"]((v265, v266) => {
          const v267 = this["_createAssetRefThumbData"](v265, {
            key:
              "asset-text:" +
              String(v265["assetId"] || "") +
              ":" +
              String(v265["itemIndex"] ?? "") +
              ":" +
              v266,
          });
          if (v267) v245["push"](v267);
        }),
        this["refBarEl"]["classList"]["add"]("active", "rh-v5-refbar"));
      let v268 = this["refBarEl"]["querySelector"](".rh-v5-ref-container");
      const v269 = String(v234?.["visibilityLayoutKey"] || "")["trim"]() !== "",
        v270 = v269 ? getManifestFixedContainerSlotOrder(v268, v234) : [],
        v271 =
          !v268 ||
          !this["refBarEl"]["querySelector"](".prompt-attachment-btn") ||
          (v269 && v270["join"]("|") !== v240["join"]("|"));
      if (v271) {
        const v272 =
            String(v234?.["manifest"]?.["displayName"] || "")["trim"]() ||
            String(v234?.["manifest"]?.["label"] || "")["trim"]() ||
            "固定入参",
          v273 = v240["map"]((v274) => {
            const v275 = String(v234?.["slotKindById"]?.[v274] || "");
            return (
              "<button\x20type=\x22button\x22\x20class=\x22ref-thumb-wrap\x20ref-upload-slot\x20rh-v5-ref-box\x22\x20data-slot=\x22" +
              escapeHtmlAttr(v274) +
              '" data-kind="' +
              escapeHtmlAttr(v275) +
              '" title="上传参考"><span class="ref-upload-label">' +
              getFixedSlotLabelHtml(v234, v274) +
              "</span></button>"
            );
          })["join"]("");
        ((this["refBarEl"]["innerHTML"] =
          v238 +
          ' <div class="ref-thumb-container rh-v5-ref-container" aria-label="' +
          escapeHtmlAttr(v272) +
          ' 入参">' +
          v273 +
          "</div>"),
          (v268 = this["refBarEl"]["querySelector"](".rh-v5-ref-container")));
      } else {
        const v276 =
          String(v234?.["manifest"]?.["displayName"] || "")["trim"]() ||
          String(v234?.["manifest"]?.["label"] || "")["trim"]() ||
          "固定入参";
        v268["setAttribute"]("aria-label", v276 + " 入参");
      }
      const v277 = Array["from"](
        v268?.["querySelectorAll"]?.("[data-slot]") || [],
      )["filter"](
        (v278) => !v242["has"](String(v278?.["dataset"]?.["slot"] || "")),
      );
      return (
        v277["forEach"]((v279) => v279["remove"]()),
        v240["forEach"]((v280) => {
          this["_syncFixedSlotEl"](v268, v280, v243[v280], v234);
        }),
        this["_syncFixedSlotOrder"](v268, v240),
        this["_syncFixedTrailingRefItems"](v268, v245),
        this["_bindFixedSlotDragSwap"](v268, getFixedSlotAcceptMap(v234)),
        this["_syncSingleReferenceEditorRatio"](v234, v243, v236),
        this["_syncBtnIconState"](),
        v121(this, v247),
        true
      );
    }
    async ["_renderRefBar"]() {
      if (!this["refBarEl"]) return;
      if (this["_renderRefBarLock"]) {
        this["_renderRefBarPending"] = true;
        return;
      }
      ((this["_renderRefBarLock"] = true),
        (this["_renderRefBarPending"] = false));
      try {
        await this["_renderRefBarImpl"]();
      } finally {
        ((this["_renderRefBarLock"] = false),
          this["_renderRefBarPending"] &&
            ((this["_renderRefBarPending"] = false), this["_renderRefBar"]()));
      }
    }
    async ["_renderRefBarImpl"]() {
      if (!this["refBarEl"]) return;
      const v281 = v119["getIncomingEdges"](this["nodeId"]),
        v282 = v119["getState"]()["nodes"],
        v283 = v282?.[this["nodeId"]] || this["_data"] || null,
        v284 = getFixedInputSlotConfigFromManifest(v283 || {}),
        v285 = createPromptAttachmentButtonHTML({ stroke: "var(--white-90)" }),
        v286 = (v287, v288) => {
          const v289 = String(v287?.["sourceId"] || "");
          if (!v289) return;
          const v290 = String(v287?.["refSlot"] || "sourceVideo"),
            v291 = getVideoSourcePathForThumb(v288, v287);
          if (!v291) return;
          if (!(v291["startsWith"]("/output/") || v291["startsWith"]("/data/")))
            return;
          const v292 = (() => {
            if (String(v288?.["type"] || "") === "ai-video") {
              const v293 = getVideoItemByEdge(v288, v287);
              return String(
                v293?.["item"]?.["videoThumbUnavailableSource"] || "",
              )["trim"]();
            }
            return String(v288?.["videoThumbUnavailableSource"] || "")[
              "trim"
            ]();
          })();
          if (v292 === v291) return;
          const v294 = v290 + "|" + v289 + "|" + v291;
          if (this["_videoThumbPending"]["has"](v294)) return;
          (this["_videoThumbPending"]["add"](v294),
            v120["fetchVideoFirstFrameThumbFromServer"](v291, {
              nodeId: v289,
              assetId: String(v287?.["sourceMediaKey"] || v287?.["id"] || ""),
            })
              ["then"]((v295) => {
                const v296 = String(v295?.["url"] || "")["trim"]();
                if (!v296) return;
                const v297 = v119["getState"](),
                  v298 = v297["nodes"]?.[v289];
                if (!v298) return;
                if (String(v298["type"] || "") === "ai-video") {
                  const v299 = getVideoItemByEdge(v298, v287),
                    v300 = Number(v299["index"]),
                    v301 = Array["isArray"](v298["videos"])
                      ? v298["videos"]
                      : [];
                  if (!(v300 >= 0 && v300 < v301["length"])) return;
                  const v302 = v301[v300] || null;
                  if (!v302 || typeof v302 !== "object") return;
                  if (String(v302["thumbUrl"] || "")["trim"]()) return;
                  const v303 = {
                      ...v302,
                      thumbUrl: v296,
                      videoThumbUnavailableSource: "",
                    },
                    v304 = v301["slice"]();
                  v304[v300] = v303;
                  const v305 = { videos: v304 },
                    v306 = Number(v298["mainVideoIndex"]),
                    v307 = Number["isFinite"](v306)
                      ? Math["max"](0, Math["trunc"](v306))
                      : 0;
                  if (v300 === v307) v305["videoThumbUnavailableSource"] = "";
                  if (
                    v300 === v307 &&
                    !String(v298["thumbUrl"] || "")["trim"]()
                  )
                    v305["thumbUrl"] = v296;
                  v119["updateNodeData"](v289, v305);
                } else {
                  if (String(v298["thumbUrl"] || "")["trim"]()) return;
                  v119["updateNodeData"](v289, {
                    thumbUrl: v296,
                    videoThumbUnavailableSource: "",
                  });
                }
              })
              ["catch"](() => {
                const v308 = v119["getState"](),
                  v309 = v308["nodes"]?.[v289];
                if (!v309) return;
                if (getVideoSourcePathForThumb(v309, v287) !== v291) return;
                if (String(v309["type"] || "") === "ai-video") {
                  const v310 = getVideoItemByEdge(v309, v287),
                    v311 = Number(v310["index"]),
                    v312 = Array["isArray"](v309["videos"])
                      ? v309["videos"]
                      : [];
                  if (!(v311 >= 0 && v311 < v312["length"])) return;
                  const v313 = v312[v311] || null;
                  if (!v313 || typeof v313 !== "object") return;
                  const v314 = v312["slice"]();
                  v314[v311] = {
                    ...v313,
                    videoThumbUnavailableSource: v291,
                    thumbUrl: "",
                  };
                  const v315 = { videos: v314 },
                    v316 = Number(v309["mainVideoIndex"]),
                    v317 = Number["isFinite"](v316)
                      ? Math["max"](0, Math["trunc"](v316))
                      : 0;
                  (v311 === v317 &&
                    ((v315["videoThumbUnavailableSource"] = v291),
                    (v315["thumbUrl"] = "")),
                    v119["updateNodeData"](v289, v315));
                } else
                  v119["updateNodeData"](v289, {
                    videoThumbUnavailableSource: v291,
                    thumbUrl: "",
                  });
              })
              ["finally"](() => {
                this["_videoThumbPending"]["delete"](v294);
              }));
        },
        v318 = getFixedRefBarLayoutKey(v284);
      this["_refBarLayoutKey"] !== v318 &&
        ((this["_refBarLayoutKey"] = v318),
        this["refBarEl"]["classList"]["remove"]("active", "rh-v5-refbar"),
        (this["refBarEl"]["innerHTML"] = ""),
        !v284 &&
          this["_clearObjectUrlMap"](
            this["_getFixedSlotRefThumbObjectUrlMap"](),
          ),
        v318 !== "generic" &&
          this["_clearObjectUrlMap"](this["_refThumbObjectUrls"]));
      if (v284) {
        await this["_renderManifestFixedRefBar"]({
          fixedInputConfig: v284,
          inEdges: v281,
          nodes: v282,
          nodeData: v283,
          attachBtnHTML: v285,
          ensureVideoThumb: v286,
        });
        return;
      }
      const v319 = getAssetInputRefsFromPromptAndNode(this["promptEl"], {
        nodeData: v283,
        allowedTypes: ["text", "image", "video", "audio"],
      });
      if (v281["length"] === 0 && v319["length"] === 0) {
        (this["refBarEl"]["classList"]["remove"]("rh-v5-refbar"),
          this["refBarEl"]["classList"]["remove"]("active"),
          (this["refBarEl"]["innerHTML"] = v285),
          this["_syncBtnIconState"](),
          v121(this, {}));
        return;
      }
      const v320 = new Set();
      for (const v321 of v281) {
        const v322 = v282?.[v321["sourceId"]];
        if (v322?.["thumbId"]) v320["add"](v322["thumbId"]);
      }
      for (const [v323, v324] of this["_refThumbObjectUrls"]["entries"]()) {
        !v320["has"](v323) &&
          (v324 &&
            String(v324)["startsWith"]("blob:") &&
            URL["revokeObjectURL"](v324),
          this["_refThumbObjectUrls"]["delete"](v323));
      }
      let v325 = [];
      const v326 = { text: 0, image: 0, video: 0, audio: 0 },
        v327 = {},
        v328 = { text: "文本", image: "图片", video: "视频", audio: "音频" };
      for (const v329 of v281) {
        const v330 = v282[v329["sourceId"]];
        if (!v330) continue;
        const v331 = resolveEffectiveInputKind(v330, v329) || "image";
        if (v331 === "text") {
          const v332 = String(
            v330["outputText"] ||
              v330["text"] ||
              v330["content"] ||
              v330["prompt"] ||
              "",
          )["trim"]();
          if (!v332) continue;
        } else {
          if (v331 === "image") {
            const v333 =
              !!v330["thumbId"] ||
              !!v330["thumbUrl"] ||
              !!v330["imageUrl"] ||
              !!v330["src"] ||
              !!v330["localPath"];
            if (!v333) continue;
          } else {
            if (v331 === "video") {
              const v334 =
                (Array["isArray"](v330["videos"]) &&
                  v330["videos"]["length"] > 0) ||
                !!v330["thumbId"] ||
                !!v330["thumbUrl"] ||
                !!v330["videoUrl"] ||
                !!v330["displayLocalPath"] ||
                !!v330["originalLocalPath"] ||
                !!v330["videoLocalPath"] ||
                !!v330["src"] ||
                !!v330["localPath"] ||
                !!v330["url"] ||
                !!v330["resultUrl"] ||
                !!v330["sourceUrl"];
              if (!v334) continue;
            } else {
              if (v331 === "audio") {
                const v335 =
                  !!v330["audioUrl"] || !!v330["src"] || !!v330["localPath"];
                if (!v335) continue;
              }
            }
          }
        }
        let v336 = "",
          v337 = "";
        if (v331 === "image") {
          let v338 = "";
          if (v330["thumbId"]) {
            if (this["_refThumbObjectUrls"]["has"](v330["thumbId"]))
              v338 = this["_refThumbObjectUrls"]["get"](v330["thumbId"]);
            else {
              const v339 = await v122(v330["thumbId"]);
              if (v339) {
                const v340 = URL["createObjectURL"](v339);
                (this["_refThumbObjectUrls"]["set"](v330["thumbId"], v340),
                  (v338 = v340));
              }
            }
          }
          !v338 &&
            (v338 = this["_resolveMediaUrl"](
              resolveCanvasImageLowZoomUrl(v330),
            ));
          !v338 &&
            v330["localPath"] &&
            (v338 = this["_resolveMediaUrl"](
              localPathToUrl(v330["localPath"]),
            ));
          if (!v338) continue;
          v123(v338);
          const v341 = !!String(v330["mask"] || "")["trim"]();
          ((v336 =
            "<img\x20src=\x22" +
            v338 +
            "\x22\x20class=\x22ref-thumb-media\x20is-pending\x22\x20draggable=\x22false\x22>" +
            (v341 ? '<span class="ref-thumb-mask-badge">遮罩</span>' : "")),
            (v337 = "i|" + v338 + "|" + (v341 ? 1 : 0)));
        } else {
          if (v331 === "video") {
            const v342 = getVideoThumbCandidate(v330, v329),
              v343 = this["_resolveMediaUrl"](
                v342["thumbUrl"] || v330["imageUrl"] || "",
              );
            v343
              ? (v123(v343),
                (v336 =
                  '<img src="' +
                  v343 +
                  '" class="ref-thumb-media is-pending" draggable="false">'),
                (v337 = "v|" + v343))
              : (v286(v329, v330),
                (v336 =
                  '<div class="ref-thumb-media" style="background:var(--bg-node);display:flex;align-items:center;justify-content:center;">\n                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n                </div>'),
                (v337 = "v|fallback"));
          } else
            ((v336 = createReferenceFallbackThumbHtml(v331)),
              (v337 = v331 + "|fallback"));
        }
        v326[v331]++;
        const v344 = "@" + v328[v331] + v326[v331];
        v327[v329["sourceId"]] = v344;
        const v345 = v329["id"] + "|" + v329["sourceId"] + "|" + v337;
        v325["push"]({
          key: "edge:" + v329["id"],
          edgeId: v329["id"],
          sourceId: v329["sourceId"],
          sig: v345,
          thumbHTML: v336,
        });
      }
      v319["forEach"]((v346, v347) => {
        const v348 = String(v346?.["type"] || "")["trim"]();
        if (!v348) return;
        let v349 = "",
          v350 = "";
        if (v348 === "image") {
          const v351 = this["_resolveMediaUrl"](
            v346["thumbUrl"] || v346["url"] || "",
          );
          if (!v351) return;
          (v123(v351),
            (v349 =
              '<img src="' +
              v351 +
              '" class="ref-thumb-media is-pending" draggable="false">'),
            (v350 = "asset-i|" + v351));
        } else {
          if (v348 === "video") {
            const v352 = this["_resolveMediaUrl"](v346["thumbUrl"] || "");
            v352
              ? (v123(v352),
                (v349 =
                  '<img src="' +
                  v352 +
                  '" class="ref-thumb-media is-pending" draggable="false">'),
                (v350 = "asset-v|" + v352))
              : ((v349 = createReferenceFallbackThumbHtml("video")),
                (v350 = "asset-v|fallback"));
          } else
            ((v349 = createReferenceFallbackThumbHtml(v348)),
              (v350 = "asset-" + v348 + "|fallback"));
        }
        const v353 = String(v346["assetId"] || ""),
          v354 = String(v346["itemIndex"] ?? ""),
          v355 = String(v346["assetMentionOccurrence"] ?? ""),
          v356 = String(v346["assetRefSource"] || "prompt"),
          v357 = "asset:" + v353 + ":" + v354;
        v325["push"]({
          key: "asset:" + v353 + ":" + v354 + ":" + v348 + ":" + v347,
          edgeId: "",
          sourceId: v357,
          sig: v357 + "|" + v348 + "|" + String(v346["url"] || "") + "|" + v350,
          thumbHTML: v349,
          virtual: true,
          assetId: v353,
          assetIndex: v354,
          assetOccurrence: v355,
          assetRefSource: v356,
          refType: v348,
        });
      });
      if (v325["length"] === 0) {
        (this["refBarEl"]["classList"]["remove"]("rh-v5-refbar"),
          this["refBarEl"]["classList"]["remove"]("active"),
          (this["refBarEl"]["innerHTML"] = v285),
          this["_syncBtnIconState"](),
          v121(this, {}));
        return;
      }
      if (this["_isDraggingSorting"]) {
        (this["_syncBtnIconState"](), v121(this, v327));
        return;
      }
      (this["refBarEl"]["classList"]["remove"]("rh-v5-refbar"),
        this["refBarEl"]["classList"]["add"]("active"));
      let v358 = this["refBarEl"]["querySelector"](".ref-thumb-container");
      (!this["refBarEl"]["querySelector"](".prompt-attachment-btn") || !v358) &&
        ((this["refBarEl"]["innerHTML"] =
          v285 + "\x20<div\x20class=\x22ref-thumb-container\x22></div>"),
        (v358 = this["refBarEl"]["querySelector"](".ref-thumb-container")));
      const v359 = new Map();
      v358["querySelectorAll"](".ref-thumb-wrap")["forEach"]((v360) =>
        v359["set"](
          v360["dataset"]["refKey"] || "edge:" + v360["dataset"]["edgeId"],
          v360,
        ),
      );
      const v361 = new Set();
      for (let v362 = 0; v362 < v325["length"]; v362++) {
        const v363 = v325[v362];
        let v364 = v359["get"](v363["key"]);
        (!v364 &&
          ((v364 = document["createElement"]("div")),
          (v364["className"] =
            "ref-thumb-wrap" +
            (v363["virtual"] ? " ref-thumb-wrap--asset" : ""))),
          v364["setAttribute"]("draggable", v363["virtual"] ? "false" : "true"),
          v364["dataset"]["sig"] !== v363["sig"] &&
            ((v364["innerHTML"] =
              v363["thumbHTML"] +
              '<button type="button" class="ref-thumb-delete" title="移除参考">&times;</button>'),
            (v364["dataset"]["sig"] = v363["sig"]),
            v124(v364, v363["sig"])),
          (v364["dataset"]["refKey"] = v363["key"]),
          (v364["dataset"]["edgeId"] = v363["edgeId"]),
          (v364["dataset"]["sourceId"] = v363["sourceId"]),
          (v364["dataset"]["refOrigin"] = v363["virtual"] ? "asset" : "node"),
          v363["virtual"]
            ? ((v364["dataset"]["assetId"] = v363["assetId"] || ""),
              (v364["dataset"]["assetIndex"] = v363["assetIndex"] || ""),
              (v364["dataset"]["assetOccurrence"] =
                v363["assetOccurrence"] || ""),
              (v364["dataset"]["assetRefSource"] =
                v363["assetRefSource"] || "prompt"),
              (v364["dataset"]["refType"] = v363["refType"] || ""))
            : (delete v364["dataset"]["assetId"],
              delete v364["dataset"]["assetIndex"],
              delete v364["dataset"]["assetOccurrence"],
              delete v364["dataset"]["assetRefSource"],
              delete v364["dataset"]["refType"]),
          v358["appendChild"](v364),
          v361["add"](v363["key"]));
      }
      for (const [v365, v366] of v359["entries"]()) {
        if (!v361["has"](v365)) v366["remove"]();
      }
      (this["_bindDragSort"](this["refBarEl"]),
        this["_syncBtnIconState"](),
        v121(this, v327));
    }
    ["_bindFixedSlotDragSwap"](v367, v368) {
      bindRefThumbFixedSlotDrag({
        owner: this,
        container: v367,
        store: v119,
        nodeId: this["nodeId"],
        acceptMap: v368,
      });
    }
    ["_bindDragSort"](v369) {
      bindRefThumbOrderDrag({
        owner: this,
        container: v369,
        store: v119,
        nodeId: this["nodeId"],
      });
    }
  }
  return v125["prototype"];
}

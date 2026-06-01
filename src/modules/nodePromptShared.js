import appStore from "../core/stores/appStore.js";
import {
  getInputLimitReason,
  getTargetInputPolicy,
  isInputKindAllowed,
  normalizeInputKind,
  resolveEffectiveInputKind,
} from "./modelInputPolicy.js";
import { sanitizePromptHtml } from "../utils/dom.js";
import { isComfyPromptGuardActive } from "./comfyui/comfyPromptGuard.js";
import {
  getAssetMentionCandidates,
  resolveAssetMentionRef,
} from "./assetMentionRegistry.js";
import { createReferenceFallbackThumbElement } from "./referenceThumbnailFallback.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
import {
  hasPromptPresetTemplateContent,
  resolvePromptPresetTemplate,
} from "./promptPresetTemplate.js";
import {
  normalizeProviderId,
  resolveModelExecution,
} from "../manifests/index.js";
const AT_TYPE_MAP = {
    text: "文本",
    image: "图片",
    video: "视频",
    audio: "音频",
  },
  MENTION_TYPE_ORDER = ["text", "image", "video", "audio"],
  ASSET_TYPE_MENU_LABELS = {
    text: "文本",
    image: "图像",
    video: "视频",
    audio: "音频",
  };
export const PROMPT_ASSET_INPUT_REFS_FIELD = "promptAssetInputRefs";
const PROMPT_INPUT_REF_UNRESOLVED_ATTR = "data-ref-unresolved",
  PROMPT_HTML_COMMIT_DELAY_MS = 320,
  ADVANCED_VOICE_CLONE_WORKFLOW_KEY = "advanced_voice_clone",
  _pendingPromptHtmlCommitTargets = new Set(),
  AT_TYPE_CANDIDATE_MAP = {
    text: "text",
    "source-text": "text",
    "ai-text": "text",
    image: "image",
    "source-image": "image",
    "ai-image": "image",
    video: "video",
    "source-video": "video",
    "ai-video": "video",
    audio: "audio",
    "source-audio": "audio",
    "ai-audio": "audio",
  };
function _getMentionType(v0) {
  return normalizeInputKind(
    AT_TYPE_CANDIDATE_MAP[String(v0 || "")["trim"]()] || v0,
  );
}
function _normalizeQuery(v1) {
  return String(v1 || "")
    ["trim"]()
    ["replace"](/^@+/, "");
}
function _stripMentionDisplayMarker(v2) {
  return String(v2 || "")
    ["trim"]()
    ["replace"](/^@+/, "")
    ["trim"]();
}
function _normalizePromptWhitespace(v3) {
  return String(v3 || "")
    ["replace"](/[\s\u00A0\u200B-\u200D\uFEFF]+/g, "\x20")
    ["trim"]();
}
function _getAssetTypeMenuLabel(v4) {
  return ASSET_TYPE_MENU_LABELS[v4] || AT_TYPE_MAP[v4] || v4 || "素材";
}
function _escapeRegExp(v5) {
  return String(v5 || "")["replace"](/[.*+?^${}()|[\]\\]/g, "\x5c$&");
}
function _getTextRefContent(v6) {
  return String(
    v6?.["outputText"] ||
      v6?.["text"] ||
      v6?.["content"] ||
      v6?.["prompt"] ||
      v6?.["label"] ||
      "",
  )["trim"]();
}
function _getChildNodes(v7) {
  if (!v7?.["childNodes"]) return [];
  return Array["from"](v7["childNodes"]);
}
function _isRefPillNode(v8) {
  if (!v8) return false;
  if (typeof v8["classList"]?.["contains"] === "function")
    return v8["classList"]["contains"]("ref-pill");
  return String(v8["className"] || "")
    ["split"](/\s+/)
    ["filter"](Boolean)
    ["includes"]("ref-pill");
}
function _getDatasetValue(v9, v10, v11 = "") {
  const v12 = String(v9?.["dataset"]?.[v10] || "")["trim"]();
  if (v12) return v12;
  if (v11 && typeof v9?.["getAttribute"] === "function")
    return String(v9["getAttribute"](v11) || "")["trim"]();
  return "";
}
function _decodeHtmlAttrValue(v13) {
  return String(v13 || "")
    ["replace"](/&quot;/g, "\x22")
    ["replace"](/&#39;/g, "\x27")
    ["replace"](/&apos;/g, "\x27")
    ["replace"](/&lt;/g, "<")
    ["replace"](/&gt;/g, ">")
    ["replace"](/&amp;/g, "&");
}
function _getHtmlAttrValue(v14 = "", v15 = "") {
  const v16 = String(v15 || "")["trim"]();
  if (!v16) return "";
  const v17 = new RegExp(
      _escapeRegExp(v16) + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
      "i",
    ),
    v18 = String(v14 || "")["match"](v17);
  if (!v18) return "";
  return _decodeHtmlAttrValue(v18[1] ?? v18[2] ?? v18[3] ?? "")["trim"]();
}
function _htmlClassAttrContains(v19 = "", v20 = "") {
  const v21 = _getHtmlAttrValue(v19, "class");
  return v21["split"](/\s+/)["filter"](Boolean)["includes"](v20);
}
function _isAssetMentionPill(v22) {
  return _getDatasetValue(v22, "refOrigin", "data-ref-origin") === "asset";
}
function _isUnresolvedInputMentionPill(v23) {
  return (
    !_isAssetMentionPill(v23) &&
    _getDatasetValue(v23, "refUnresolved", PROMPT_INPUT_REF_UNRESOLVED_ATTR) ===
      "true"
  );
}
function _normalizeMentionLabelKey(v24) {
  return _stripMentionDisplayMarker(v24)["replace"](/[\s\u00A0]+/g, "");
}
function _inferMentionTypeFromLabel(v25 = "") {
  const v26 = _normalizeMentionLabelKey(v25);
  if (!v26) return "";
  for (const v27 of MENTION_TYPE_ORDER) {
    const v28 = String(AT_TYPE_MAP[v27] || "")["trim"]();
    if (v28 && v26["startsWith"](v28)) return v27;
  }
  return "";
}
function _getPillMentionType(v29) {
  return (
    _getMentionType(_getDatasetValue(v29, "refType", "data-ref-type")) ||
    _inferMentionTypeFromLabel(
      _getDatasetValue(v29, "label", "data-label") ||
        v29?.["textContent"] ||
        "",
    )
  );
}
function _setInputMentionPillUnresolved(
  v30,
  { label: label = "", type: type = "" } = {},
) {
  if (!_isRefPillNode(v30) || _isAssetMentionPill(v30)) return false;
  const v31 = _stripMentionDisplayMarker(
      label || v30?.["dataset"]?.["label"] || v30?.["textContent"] || "",
    ),
    v32 = _getMentionType(type) || _getPillMentionType(v30);
  ((v30["dataset"]["label"] = v31),
    (v30["dataset"]["refOrigin"] = "node"),
    (v30["dataset"]["refUnresolved"] = "true"));
  if (v32) v30["dataset"]["refType"] = v32;
  return (
    delete v30["dataset"]["nodeId"],
    v30["removeAttribute"]?.("data-node-id"),
    v30["classList"]?.["add"]?.("ref-pill--unresolved"),
    (v30["title"] = "Input reference is not bound in this node."),
    _renderMentionPillContent(v30, v31, _getMentionVisual(null, null, v30)),
    true
  );
}
function _clearInputMentionPillUnresolved(v33) {
  if (!_isRefPillNode(v33)) return false;
  (delete v33["dataset"]["refUnresolved"],
    v33["removeAttribute"]?.(PROMPT_INPUT_REF_UNRESOLVED_ATTR),
    v33["classList"]?.["remove"]?.("ref-pill--unresolved"));
  if (
    v33["title"] ===
    "Input\x20reference\x20is\x20not\x20bound\x20in\x20this\x20node."
  ) {
    v33["removeAttribute"]?.("title");
    if ("title" in v33) v33["title"] = "";
  }
  return true;
}
function _getTargetNodeData(v34 = null) {
  const v35 = String(v34?.["nodeId"] || "")["trim"](),
    v36 = v35 ? appStore["getState"]?.()?.["nodes"]?.[v35] : null;
  return v36 || v34?.["_data"] || {};
}
function _isAdvancedVoiceCloneTarget(v37 = {}) {
  if (String(v37?.["type"] || "")["trim"]() !== "ai-audio") return false;
  return [v37["audioWorkflowKey"], v37["model"], v37["audioWorkflowLabel"]][
    "some"
  ]((v38) => String(v38 || "")["trim"]() === ADVANCED_VOICE_CLONE_WORKFLOW_KEY);
}
function _getMentionAudioInputKey(v39 = {}) {
  if (_getMentionType(v39?.["type"]) !== "audio") return "";
  if (v39?.["origin"] === "asset") {
    const v40 = _getPromptAssetInputRefRecordForMention(v39);
    return v40 ? "asset:" + v40["assetId"] + ":" + v40["itemIndex"] : "";
  }
  const v41 = String(v39?.["nodeId"] || v39?.["sourceId"] || "")["trim"]();
  return v41 ? "node:" + v41 : "";
}
function _getActualAudioInputKeysForTarget(v42 = "", v43 = {}, v44 = null) {
  const v45 = new Set(),
    v46 = v44 || appStore["getState"](),
    v47 = v46["nodes"] || {};
  return (
    appStore["getIncomingEdges"](v42)["forEach"]((v48) => {
      const v49 = v47?.[v48?.["sourceId"]];
      resolveEffectiveInputKind(v49, v48) === "audio" &&
        v48?.["sourceId"] &&
        v45["add"]("node:" + v48["sourceId"]);
    }),
    _getPromptAssetInputRefRecords(v43 || {})["forEach"]((v50) => {
      v50["type"] === "audio" &&
        v45["add"]("asset:" + v50["assetId"] + ":" + v50["itemIndex"]);
    }),
    v45
  );
}
function _getAdvancedVoiceCloneAudioLimitReason(
  v51,
  v52 = {},
  v53 = {},
  v54 = null,
) {
  if (!_isAdvancedVoiceCloneTarget(v53)) return null;
  if (_getMentionType(v52?.["type"]) !== "audio") return null;
  const v55 = getTargetInputPolicy(v53),
    v56 = Number(v55?.["maxByKind"]?.["audio"]);
  if (!Number["isFinite"](v56) || v56 <= 0) return null;
  const v57 = _getActualAudioInputKeysForTarget(v51?.["nodeId"], v53, v54),
    v58 = _getMentionAudioInputKey(v52);
  if (v58 && v57["has"](v58)) return "";
  return v57["size"] >= v56
    ? getInputLimitReason(v55, "audio", { audio: v57["size"] })
    : "";
}
export function isRunningHubWorkflowNode(v59 = {}) {
  const v60 = normalizeProviderId(v59?.["provider"]);
  if (v60 === "runninghubwf") return true;
  const v61 = String(v59?.["model"] || "")["trim"]();
  if (!v61) return false;
  const v62 =
      resolveModelExecution(v61, { providerHint: v60 }) ||
      resolveModelExecution(v61),
    v63 = normalizeProviderId(v62?.["modelManifest"]?.["provider"]),
    v64 = normalizeProviderId(v62?.["executionManifest"]?.["provider"]);
  return (
    v62?.["executionManifest"]?.["adapterType"] === "workflow" &&
    (v63 === "runninghubwf" || v64 === "runninghubwf")
  );
}
function _normalizePromptAssetInputRefRecord(v65 = {}) {
  if (!v65 || typeof v65 !== "object") return null;
  const v66 = String(v65["assetId"] || "")["trim"](),
    v67 =
      v65["itemIndex"] !== undefined && v65["itemIndex"] !== null
        ? v65["itemIndex"]
        : v65["assetIndex"],
    v68 = Number(v67),
    v69 = _getMentionType(v65["type"]);
  if (!v66 || !Number["isFinite"](v68) || !v69 || v69 === "text") return null;
  return {
    assetId: v66,
    itemIndex: Math["max"](0, Math["trunc"](v68)),
    type: v69,
  };
}
function _getPromptAssetInputRefRecords(v70 = {}) {
  const v71 = v70?.[PROMPT_ASSET_INPUT_REFS_FIELD];
  if (!Array["isArray"](v71)) return [];
  return v71["map"]((v72) => _normalizePromptAssetInputRefRecord(v72))[
    "filter"
  ](Boolean);
}
function _toLocalPathUrl(v73) {
  return localPathToUrl(v73);
}
function _isLikelyImageUrl(v74) {
  const v75 = String(v74 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!v75) return false;
  if (v75["startsWith"]("data:image/") || v75["startsWith"]("blob:"))
    return true;
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i["test"](v75);
}
function _firstNonEmpty(v76 = []) {
  return (
    v76["map"]((v77) => String(v77 || "")["trim"]())["find"](Boolean) || ""
  );
}
function _pickIndexedItem(v78, v79) {
  if (!Array["isArray"](v78) || v78["length"] === 0) return null;
  const v80 = Number["isFinite"](Number(v79))
    ? Math["max"](0, Math["trunc"](Number(v79)))
    : 0;
  return v78[v80] || v78[0] || null;
}
function _resolveNodeThumbUrl(v81 = {}, v82 = "") {
  const v83 = _getMentionType(v82 || v81?.["type"]);
  if (v83 === "text" || v83 === "audio") return "";
  if (v83 === "image") {
    const v84 = _pickIndexedItem(
      v81["images"] || v81["outputImages"],
      v81["mainImageIndex"],
    );
    return _firstNonEmpty([
      v84?.["thumbUrl"],
      v84?.["src"],
      v84?.["imageUrl"],
      v84?.["sourceUrl"],
      v84?.["url"],
      _toLocalPathUrl(v84?.["localPath"]),
      v81["thumbUrl"],
      v81["src"],
      v81["imageUrl"],
      v81["sourceUrl"],
      v81["url"],
      _toLocalPathUrl(v81["localPath"]),
    ]);
  }
  if (v83 === "video") {
    const v85 = _pickIndexedItem(v81["videos"], v81["mainVideoIndex"]),
      v86 = [
        v85?.["thumbUrl"],
        v85?.["posterUrl"],
        _toLocalPathUrl(v85?.["posterLocalPath"]),
        v81["thumbUrl"],
        v81["videoThumbSrc"],
        v81["firstFrameThumbUrl"],
        v81["firstFrameUrl"],
        v81["posterUrl"],
        _toLocalPathUrl(v81["posterLocalPath"]),
        v81["imageUrl"],
        v81["src"],
      ];
    return (
      v86["map"]((v87) => String(v87 || "")["trim"]())["find"](
        (v88) => v88 && _isLikelyImageUrl(v88),
      ) || ""
    );
  }
  return "";
}
function _resolveRefBarThumbNode(v89, v90) {
  const v91 = String(v90 || "")["trim"]();
  if (
    !v91 ||
    !v89?.["refBarEl"] ||
    typeof v89["refBarEl"]["querySelector"] !== "function"
  )
    return null;
  const v92 =
      typeof CSS !== "undefined" && typeof CSS["escape"] === "function"
        ? CSS["escape"](v91)
        : v91["replace"](/["\\]/g, "\\$&"),
    v93 = v89["refBarEl"]["querySelector"](
      '.ref-thumb-wrap[data-source-id="' + v92 + "\x22]",
    );
  return v93?.["querySelector"]?.(".ref-thumb-media") || null;
}
function _getThumbNodeUrl(v94) {
  const v95 =
    v94?.["tagName"] && String(v94["tagName"])["toLowerCase"]() === "img"
      ? v94
      : null;
  return String(v95?.["currentSrc"] || v95?.["src"] || "")["trim"]();
}
function _getRenderableMentionThumbUrl(v96, v97 = "") {
  const v98 = String(v96 || "")["trim"]();
  if (!v98) return "";
  const v99 = _getMentionType(v97);
  if (v99 === "text" || v99 === "audio")
    return _isLikelyImageUrl(v98) ? v98 : "";
  return v98;
}
function _getMentionVisual(v100, v101 = null, v102 = null) {
  const v103 = _getMentionType(
      v101?.["type"] || _getDatasetValue(v102, "refType", "data-ref-type"),
    ),
    v104 = v103 || "text";
  if (v101?.["origin"] === "asset" || _isAssetMentionPill(v102)) {
    const v105 =
        v101?.["origin"] === "asset"
          ? null
          : getAssetMentionRefFromPillNode(v102),
      v106 = _getRenderableMentionThumbUrl(
        v101?.["thumbUrl"] || v105?.["thumbUrl"] || "",
        v103,
      );
    return { thumbUrl: v106, iconType: v104 };
  }
  const v107 = String(
      v101?.["nodeId"] ||
        v101?.["sourceId"] ||
        _getDatasetValue(v102, "nodeId", "data-node-id"),
    )["trim"](),
    v108 = appStore["getState"]?.()?.["nodes"]?.[v107] || {},
    v109 = v103 || _getMentionType(v108["type"]),
    v110 = _resolveRefBarThumbNode(v100, v107),
    v111 = _getThumbNodeUrl(v110),
    v112 =
      v111 ||
      _getRenderableMentionThumbUrl(v101?.["thumbUrl"] || "", v109) ||
      _resolveNodeThumbUrl(v108, v109);
  return {
    thumbUrl: v112,
    thumbNode: v112 ? null : v110,
    iconType: v109 || v104,
  };
}
function _createTextAudioMentionThumb(v113, v114) {
  return createReferenceFallbackThumbElement(_getMentionType(v113), v114);
}
function _cloneMentionThumbNode(v115, v116, v117 = "") {
  const v118 = _createTextAudioMentionThumb(v117, v116);
  if (v118) return v118;
  if (!v115) return null;
  if (typeof v115["cloneNode"] !== "function") return null;
  const v119 = v115["cloneNode"](true);
  return (
    (v119["className"] = v116),
    (v119["draggable"] = false),
    (v119["contentEditable"] = "false"),
    v119
  );
}
function _appendMentionVisualNode(
  v120,
  {
    thumbUrl: thumbUrl = "",
    thumbNode: thumbNode = null,
    iconType: iconType = "",
  } = {},
) {
  if (thumbUrl) {
    const v121 = document["createElement"]("img");
    return (
      (v121["className"] = "ref-pill-thumb"),
      (v121["src"] = thumbUrl),
      (v121["alt"] = ""),
      (v121["draggable"] = false),
      (v121["contentEditable"] = "false"),
      v120["appendChild"](v121),
      true
    );
  }
  const v122 = _cloneMentionThumbNode(thumbNode, "ref-pill-thumb", iconType);
  if (!v122) return false;
  return (v120["appendChild"](v122), true);
}
function _renderMentionPillContent(v123, v124, v125 = {}) {
  const v126 = _stripMentionDisplayMarker(v124);
  if (
    typeof document === "undefined" ||
    typeof document["createElement"] !== "function" ||
    typeof v123?.["replaceChildren"] !== "function"
  ) {
    v123["textContent"] = v126;
    return;
  }
  const v127 = document["createElement"]("span");
  ((v127["className"] = "ref-pill-label"),
    (v127["textContent"] = v126),
    v123["replaceChildren"](),
    _appendMentionVisualNode(v123, v125),
    v123["appendChild"](v127));
}
function _isPillVisualCurrent(v128, v129 = {}) {
  if (!v128 || typeof v128["querySelector"] !== "function") return true;
  const v130 = _getMentionType(v129["iconType"]);
  if (v129["thumbUrl"]) {
    const v131 = v128["querySelector"]("img.ref-pill-thumb");
    return (
      String(v131?.["currentSrc"] || v131?.["src"] || "")["trim"]() ===
      v129["thumbUrl"]
    );
  }
  if (v130 === "text" || v130 === "audio") {
    const v132 = v128["querySelector"](".ref-pill-thumb"),
      v133 =
        typeof v132?.["className"] === "string"
          ? v132["className"]
          : String(v132?.["getAttribute"]?.("class") || "");
    return (
      !!v132 &&
      (v132["classList"]?.["contains"]?.("ref-thumb-fallback") ||
        v133["includes"]("ref-thumb-fallback"))
    );
  }
  if (v129["thumbNode"]) return !!v128["querySelector"](".ref-pill-thumb");
  return (
    !v128["querySelector"](".ref-pill-thumb") &&
    !v128["querySelector"](".ref-pill-icon")
  );
}
export function getAssetMentionRefFromPillNode(v134) {
  if (!_isRefPillNode(v134) || !_isAssetMentionPill(v134)) return null;
  const v135 = _getDatasetValue(v134, "assetId", "data-asset-id"),
    v136 = _getDatasetValue(v134, "assetIndex", "data-asset-index"),
    v137 = Number(v136);
  if (!v135 || !Number["isFinite"](v137)) return null;
  return resolveAssetMentionRef({ assetId: v135, itemIndex: v137 });
}
export function getMentionPlaceholderLabel(v138, v139) {
  const v140 = _getMentionType(v138),
    v141 = AT_TYPE_MAP[v140] || v140 || "素材",
    v142 = Math["max"](1, Math["trunc"](Number(v139) || 1));
  return "@" + v141 + v142;
}
export function appendAssetMentionToPrompt({
  domNode: domNode = null,
  rawLabel: rawLabel = "",
  promptParts: promptParts = null,
  inputRefs: inputRefs = null,
  mediaCounts: mediaCounts = null,
  allowedTypes: allowedTypes = null,
} = {}) {
  const v143 = getAssetMentionRefFromPillNode(domNode);
  if (!v143) return false;
  const v144 = resolveEffectiveInputKind(v143) || _getMentionType(v143["type"]);
  if (Array["isArray"](allowedTypes) && !allowedTypes["includes"](v144)) {
    if (Array["isArray"](promptParts))
      promptParts["push"]("\x20" + (rawLabel || v143["label"]) + "\x20");
    return true;
  }
  if (v144 === "text") {
    if (Array["isArray"](promptParts))
      promptParts["push"]("\x20" + (v143["content"] || "") + "\x20");
    return true;
  }
  if (!v143["url"]) {
    if (Array["isArray"](promptParts))
      promptParts["push"]("\x20" + (rawLabel || v143["label"]) + "\x20");
    return true;
  }
  const v145 = mediaCounts || {};
  v145[v144] = Number(v145[v144] || 0) + 1;
  const v146 = getMentionPlaceholderLabel(v144, v145[v144]);
  if (Array["isArray"](promptParts))
    promptParts["push"]("\x20" + v146 + "\x20");
  return (
    Array["isArray"](inputRefs) &&
      inputRefs["push"]({ ...v143, type: v144, placeholder: v146 }),
    true
  );
}
export function getAssetInputRefsFromPrompt(
  v147 = null,
  { allowedTypes: allowedTypes = null } = {},
) {
  if (!v147 || typeof v147["querySelectorAll"] !== "function") return [];
  const v148 =
      Array["isArray"](allowedTypes) && allowedTypes["length"]
        ? new Set(
            allowedTypes["map"]((v149) => _getMentionType(v149))["filter"](
              Boolean,
            ),
          )
        : null,
    v150 = [],
    v151 = new Map();
  return (
    v147["querySelectorAll"](".ref-pill")["forEach"]((v152) => {
      if (!_isAssetMentionPill(v152)) return;
      const v153 = getAssetMentionRefFromPillNode(v152);
      if (!v153) return;
      const v154 =
        resolveEffectiveInputKind(v153) || _getMentionType(v153["type"]);
      if (!v154 || (v148 && !v148["has"](v154))) return;
      if (v154 === "text") {
        if (!String(v153["content"] || "")["trim"]()) return;
      } else {
        if (!String(v153["url"] || "")["trim"]()) return;
      }
      const v155 = v153["assetId"] + ":" + v153["itemIndex"] + ":" + v154,
        v156 = v151["get"](v155) || 0;
      (v151["set"](v155, v156 + 1),
        v150["push"]({
          ...v153,
          type: v154,
          assetMentionOccurrence: v156,
          assetRefSource: "prompt",
        }));
    }),
    v150
  );
}
function _normalizeAllowedMentionTypes(v157 = null) {
  return Array["isArray"](v157) && v157["length"]
    ? new Set(v157["map"]((v158) => _getMentionType(v158))["filter"](Boolean))
    : null;
}
function _appendResolvedAssetInputRefFromRecord(
  v159,
  v160,
  v161,
  {
    allowed: allowed = null,
    assetRefSource: assetRefSource = "prompt",
    promptAssetRefIndex: promptAssetRefIndex = null,
  } = {},
) {
  const v162 = String(v161?.["assetId"] || "")["trim"](),
    v163 =
      v161?.["itemIndex"] !== undefined && v161?.["itemIndex"] !== null
        ? v161["itemIndex"]
        : v161?.["assetIndex"],
    v164 = Number(v163),
    v165 = resolveEffectiveInputKind(v161) || _getMentionType(v161?.["type"]);
  if (
    !v162 ||
    !Number["isFinite"](v164) ||
    !v165 ||
    (allowed && !allowed["has"](v165))
  )
    return false;
  const v166 = Math["max"](0, Math["trunc"](v164)),
    v167 = resolveAssetMentionRef({ assetId: v162, itemIndex: v166 });
  if (!v167) return false;
  const v168 =
    resolveEffectiveInputKind(v167) || _getMentionType(v167["type"] || v165);
  if (!v168 || v168 !== v165) return false;
  if (v165 === "text") {
    if (!String(v167["content"] || "")["trim"]()) return false;
  } else {
    if (!String(v167["url"] || "")["trim"]()) return false;
  }
  const v169 = v162 + ":" + v166 + ":" + v165,
    v170 = v160["get"](v169) || 0;
  v160["set"](v169, v170 + 1);
  const v171 = {
    ...v167,
    type: v165,
    assetMentionOccurrence: v170,
    assetRefSource: assetRefSource,
  };
  return (
    Number["isFinite"](Number(promptAssetRefIndex)) &&
      (v171["promptAssetRefIndex"] = Math["max"](
        0,
        Math["trunc"](Number(promptAssetRefIndex)),
      )),
    v159["push"](v171),
    true
  );
}
export function getAssetInputRefsFromPromptHtml(
  v172 = "",
  { allowedTypes: allowedTypes = null } = {},
) {
  const v173 = _normalizeAllowedMentionTypes(allowedTypes),
    v174 = sanitizePromptHtml(v172);
  if (!v174) return [];
  const v175 = [],
    v176 = new Map(),
    v177 = /<span\b([^>]*)>([\s\S]*?)<\/span>/gi;
  let v178 = null;
  while ((v178 = v177["exec"](v174))) {
    const v179 = v178[1] || "";
    if (!_htmlClassAttrContains(v179, "ref-pill")) continue;
    if (_getHtmlAttrValue(v179, "data-ref-origin") !== "asset") continue;
    _appendResolvedAssetInputRefFromRecord(
      v175,
      v176,
      {
        assetId: _getHtmlAttrValue(v179, "data-asset-id"),
        itemIndex: _getHtmlAttrValue(v179, "data-asset-index"),
        type: _getHtmlAttrValue(v179, "data-ref-type"),
      },
      { allowed: v173, assetRefSource: "prompt" },
    );
  }
  return v175;
}
export function getPromptAssetInputRefsFromNode(
  v180 = {},
  { allowedTypes: allowedTypes = null } = {},
) {
  const v181 = _normalizeAllowedMentionTypes(allowedTypes),
    v182 = [],
    v183 = new Map();
  return (
    _getPromptAssetInputRefRecords(v180)["forEach"]((v184, v185) => {
      const v186 = _getMentionType(v184["type"]);
      if (!v186 || v186 === "text") return;
      _appendResolvedAssetInputRefFromRecord(v182, v183, v184, {
        allowed: v181,
        assetRefSource: "hidden",
        promptAssetRefIndex: v185,
      });
    }),
    v182
  );
}
export function getAssetInputRefsFromNodeData(
  v187 = {},
  { allowedTypes: allowedTypes = null } = {},
) {
  return [
    ...getAssetInputRefsFromPromptHtml(v187?.["prompt"] || "", {
      allowedTypes: allowedTypes,
    }),
    ...getPromptAssetInputRefsFromNode(v187 || {}, {
      allowedTypes: allowedTypes,
    }),
  ];
}
export function getAssetInputRefsFromPromptAndNode(
  v188 = null,
  { nodeData: nodeData = null, allowedTypes: allowedTypes = null } = {},
) {
  return [
    ...getAssetInputRefsFromPrompt(v188, { allowedTypes: allowedTypes }),
    ...getPromptAssetInputRefsFromNode(nodeData || {}, {
      allowedTypes: allowedTypes,
    }),
  ];
}
export function removeAssetMentionPillFromPrompt(
  v189,
  {
    assetId: assetId = "",
    assetIndex: assetIndex = "",
    itemIndex: itemIndex = "",
    type: type = "",
    occurrence: occurrence = null,
  } = {},
) {
  const v190 = v189?.["promptEl"];
  if (!v190 || typeof v190["querySelectorAll"] !== "function") return false;
  const v191 = String(assetId || "")["trim"](),
    v192 =
      assetIndex !== null &&
      assetIndex !== undefined &&
      String(assetIndex) !== ""
        ? assetIndex
        : itemIndex,
    v193 = String(v192 ?? "")["trim"](),
    v194 = _getMentionType(type),
    v195 = Number(occurrence),
    v196 = Number["isFinite"](v195) && v195 >= 0;
  if (!v191 || !v193) return false;
  const v197 = Array["from"](v190["querySelectorAll"](".ref-pill"));
  let v198 = 0;
  const v199 = v197["find"]((v200) => {
    if (!_isAssetMentionPill(v200)) return false;
    const v201 = _getDatasetValue(v200, "assetId", "data-asset-id"),
      v202 = _getDatasetValue(v200, "assetIndex", "data-asset-index"),
      v203 = _getMentionType(
        _getDatasetValue(v200, "refType", "data-ref-type"),
      ),
      v204 = v201 === v191 && v202 === v193 && (!v194 || v203 === v194);
    if (!v204) return false;
    if (!v196) return true;
    const v205 = v198 === v195;
    return ((v198 += 1), v205);
  });
  if (!v199) return false;
  return (v199["remove"]?.(), _updatePromptHtml(v189), true);
}
export function removePromptAssetInputRefFromNode(
  v206,
  {
    assetId: assetId = "",
    assetIndex: assetIndex = "",
    itemIndex: itemIndex = "",
    type: type = "",
    occurrence: occurrence = null,
  } = {},
) {
  const v207 = String(v206?.["nodeId"] || "")["trim"]();
  if (!v207) return false;
  const v208 = String(assetId || "")["trim"](),
    v209 =
      assetIndex !== null &&
      assetIndex !== undefined &&
      String(assetIndex) !== ""
        ? assetIndex
        : itemIndex,
    v210 = Number(v209),
    v211 = _getMentionType(type),
    v212 = Number(occurrence),
    v213 = Number["isFinite"](v212) && v212 >= 0;
  if (!v208 || !Number["isFinite"](v210)) return false;
  const v214 = _getPromptAssetInputRefRecords(_getTargetNodeData(v206));
  let v215 = 0,
    v216 = false;
  const v217 = v214["filter"]((v218) => {
    if (v216) return true;
    const v219 =
      v218["assetId"] === v208 &&
      v218["itemIndex"] === Math["max"](0, Math["trunc"](v210)) &&
      (!v211 || v218["type"] === v211);
    if (!v219) return true;
    if (v213 && v215 !== v212) return ((v215 += 1), true);
    return ((v216 = true), false);
  });
  if (!v216) return false;
  return (
    appStore["updateNodeData"](v207, { [PROMPT_ASSET_INPUT_REFS_FIELD]: v217 }),
    _notifyPromptHtmlUpdated(v206),
    true
  );
}
function _assetInputRefTargetMatches(v220 = {}, v221 = {}) {
  const v222 = String(v221?.["assetId"] || "")["trim"](),
    v223 =
      v221?.["itemIndex"] !== undefined && v221?.["itemIndex"] !== null
        ? v221["itemIndex"]
        : v221?.["assetIndex"],
    v224 = Number(v223),
    v225 = _getMentionType(v221?.["type"] || v221?.["refType"] || "");
  if (!v222 || !Number["isFinite"](v224)) return false;
  return (
    String(v220?.["assetId"] || "")["trim"]() === v222 &&
    Number(v220?.["itemIndex"]) === Math["max"](0, Math["trunc"](v224)) &&
    (!v225 || _getMentionType(v220?.["type"]) === v225)
  );
}
function _removePromptAssetInputRecordFromNodeData(v226 = {}, v227 = {}) {
  const v228 = _getPromptAssetInputRefRecords(v226);
  if (!v228["length"]) return { removed: false, records: v228 };
  const v229 = String(v227?.["assetRefSource"] || "")["trim"]();
  if (v229 && v229 !== "hidden") return { removed: false, records: v228 };
  const v230 = Number(v227?.["promptAssetRefIndex"]);
  if (Number["isFinite"](v230) && v230 >= 0) {
    const v231 = Math["max"](0, Math["trunc"](v230));
    if (_assetInputRefTargetMatches(v228[v231], v227)) {
      const v232 = v228["slice"]();
      return (v232["splice"](v231, 1), { removed: true, records: v232 });
    }
  }
  const v233 = Number(v227?.["assetMentionOccurrence"] ?? v227?.["occurrence"]),
    v234 = Number["isFinite"](v233) && v233 >= 0;
  let v235 = 0,
    v236 = false;
  const v237 = v228["filter"]((v238) => {
    if (v236 || !_assetInputRefTargetMatches(v238, v227)) return true;
    if (v234 && v235 !== Math["trunc"](v233)) return ((v235 += 1), true);
    return ((v236 = true), false);
  });
  return { removed: v236, records: v237 };
}
function _removeAssetMentionPillFromPromptHtml(v239 = "", v240 = {}) {
  const v241 = String(v240?.["assetRefSource"] || "")["trim"]();
  if (v241 && v241 !== "prompt") return { removed: false, prompt: v239 };
  const v242 = sanitizePromptHtml(v239);
  if (!v242) return { removed: false, prompt: v242 };
  const v243 = Number(v240?.["assetMentionOccurrence"] ?? v240?.["occurrence"]),
    v244 = Number["isFinite"](v243) && v243 >= 0;
  let v245 = 0,
    v246 = false;
  const v247 = v242["replace"](
    /<span\b([^>]*)>([\s\S]*?)<\/span>/gi,
    (v248, v249) => {
      if (v246) return v248;
      if (!_htmlClassAttrContains(v249, "ref-pill")) return v248;
      if (_getHtmlAttrValue(v249, "data-ref-origin") !== "asset") return v248;
      const v250 = {
        assetId: _getHtmlAttrValue(v249, "data-asset-id"),
        itemIndex: _getHtmlAttrValue(v249, "data-asset-index"),
        type: _getHtmlAttrValue(v249, "data-ref-type"),
      };
      if (!_assetInputRefTargetMatches(v250, v240)) return v248;
      if (v244 && v245 !== Math["trunc"](v243)) return ((v245 += 1), v248);
      return ((v246 = true), "");
    },
  );
  return { removed: v246, prompt: v246 ? sanitizePromptHtml(v247) : v242 };
}
export function buildRemoveAssetInputRefPatchFromNodeData(
  v251 = {},
  v252 = {},
) {
  const v253 = {},
    v254 = _removePromptAssetInputRecordFromNodeData(v251, v252);
  v254["removed"] && (v253[PROMPT_ASSET_INPUT_REFS_FIELD] = v254["records"]);
  const v255 = _removeAssetMentionPillFromPromptHtml(
    v251?.["prompt"] || "",
    v252,
  );
  return (
    v255["removed"] && (v253["prompt"] = v255["prompt"]),
    Object["keys"](v253)["length"] ? v253 : null
  );
}
export function removeAssetInputRefFromNodeData(v256 = "", v257 = {}) {
  const v258 = String(v256 || "")["trim"]();
  if (!v258) return false;
  const v259 = appStore["getState"]?.()?.["nodes"]?.[v258] || {},
    v260 = buildRemoveAssetInputRefPatchFromNodeData(v259, v257);
  if (!v260) return false;
  return (appStore["updateNodeData"](v258, v260), true);
}
export function handleRefThumbDeleteClick(v261, v262) {
  const v263 = v262?.["target"]?.["closest"]?.(".ref-thumb-delete");
  if (!v263) return false;
  typeof v262["stopImmediatePropagation"] === "function"
    ? v262["stopImmediatePropagation"]()
    : v262["stopPropagation"]?.();
  v262["preventDefault"]?.();
  const v264 = v263["closest"]?.(".ref-thumb-wrap"),
    v265 = v264?.["dataset"]?.["edgeId"] || "";
  if (v265)
    return (
      appStore["removeEdge"](v265),
      v261?.["_updateSubmitButtonState"]?.(),
      true
    );
  if (v264?.["dataset"]?.["refOrigin"] === "asset") {
    const v266 = {
        assetId: v264["dataset"]["assetId"],
        assetIndex: v264["dataset"]["assetIndex"],
        type: v264["dataset"]["refType"] || v264["dataset"]["kind"],
        occurrence: v264["dataset"]["assetOccurrence"],
      },
      v267 = String(v264["dataset"]["assetRefSource"] || "")["trim"](),
      v268 =
        v267 === "hidden"
          ? removePromptAssetInputRefFromNode(v261, v266)
          : removeAssetMentionPillFromPrompt(v261, v266) ||
            removePromptAssetInputRefFromNode(v261, v266);
    !v268 &&
      (v261?.["_renderRefBar"]?.(), v261?.["_updateSubmitButtonState"]?.());
  }
  return true;
}
function _countPromptPillsByType(
  v269,
  v270 = null,
  { nodeData: nodeData = null } = {},
) {
  const v271 = { text: 0, image: 0, video: 0, audio: 0 },
    v272 = appStore["getState"](),
    v273 = v272["nodes"] || {};
  return (
    v269 &&
      typeof v269["querySelectorAll"] === "function" &&
      v269["querySelectorAll"](".ref-pill")["forEach"]((v274) => {
        if (v274 === v270) return;
        let v275 = "";
        if (_isAssetMentionPill(v274)) {
          const v276 = getAssetMentionRefFromPillNode(v274);
          v275 =
            v276?.["type"] ||
            _getDatasetValue(v274, "refType", "data-ref-type");
        } else {
          const v277 = _getDatasetValue(v274, "nodeId", "data-node-id");
          if (_isUnresolvedInputMentionPill(v274)) return;
          v275 =
            _getPillMentionType(v274) ||
            _getMentionType(v273?.[v277]?.["type"] || "");
        }
        if (v271[v275] != null) v271[v275] += 1;
      }),
    _getPromptAssetInputRefRecords(nodeData || {})["forEach"]((v278) => {
      if (v271[v278["type"]] != null) v271[v278["type"]] += 1;
    }),
    v271
  );
}
function _candidateMatchesQuery(
  { label: label = "", type: type = "", assetName: assetName = "" },
  v279 = "",
) {
  const v280 = _normalizeQuery(v279)["toLowerCase"]();
  if (!v280) return true;
  const v281 = AT_TYPE_MAP[type] || type,
    v282 = _getAssetTypeMenuLabel(type);
  return [label, v281, v282, assetName]
    ["join"]("\x20")
    ["toLowerCase"]()
    ["includes"](v280);
}
export function _resolvePromptTextWithTextRefs({
  promptEl: promptEl = null,
  inEdges: inEdges = [],
  nodes: nodes = {},
  assetInputRefs: assetInputRefs = null,
  assetMediaCounts: assetMediaCounts = null,
  allowedAssetTypes: allowedAssetTypes = null,
  prependUnusedTextRefs: prependUnusedTextRefs = true,
} = {}) {
  const v283 = [];
  let v284 = 0;
  for (const v285 of inEdges) {
    const v286 = nodes?.[v285?.["sourceId"]];
    if (!v286) continue;
    if (_getMentionType(v286["type"]) !== "text") continue;
    const v287 = _getTextRefContent(v286);
    if (!v287) continue;
    ((v284 += 1),
      v283["push"]({
        label: "@" + AT_TYPE_MAP["text"] + v284,
        content: v287,
        sourceId: String(v285?.["sourceId"] || ""),
        used: false,
      }));
  }
  if (!promptEl && v283["length"] === 0) return "";
  const v288 = Object["create"](null),
    v289 = Object["create"](null);
  v283["forEach"]((v290) => {
    v288[v290["label"]["replace"](/\s+/g, "")] = v290;
    if (v290["sourceId"]) v289[v290["sourceId"]] = v290;
  });
  const v291 = globalThis["Node"]?.["TEXT_NODE"] ?? 3,
    v292 = globalThis["Node"]?.["ELEMENT_NODE"] ?? 1;
  let v293 = "";
  const v294 = (v295) => {
    for (const v296 of _getChildNodes(v295)) {
      const v297 = Number(v296?.["nodeType"]);
      if (v297 === v291) {
        v293 += String(v296?.["textContent"] || "");
        continue;
      }
      if (v297 !== v292) continue;
      if (_isRefPillNode(v296)) {
        const v298 = [];
        if (
          appendAssetMentionToPrompt({
            domNode: v296,
            rawLabel: String(
              v296?.["dataset"]?.["label"] || v296?.["textContent"] || "",
            )["trim"](),
            promptParts: v298,
            inputRefs: assetInputRefs,
            mediaCounts: assetMediaCounts,
            allowedTypes: allowedAssetTypes,
          })
        ) {
          v293 += v298["join"]("");
          continue;
        }
        const v299 = String(v296?.["dataset"]?.["nodeId"] || ""),
          v300 = String(
            v296?.["dataset"]?.["label"] || v296?.["textContent"] || "",
          )["trim"]();
        if (_isUnresolvedInputMentionPill(v296)) {
          v293 += "\x20" + v300 + "\x20";
          continue;
        }
        const v301 = v300["replace"](/\s+/g, ""),
          v302 = (v299 && v289[v299]) || v288[v301];
        v302
          ? ((v302["used"] = true), (v293 += "\x20" + v302["content"] + "\x20"))
          : (v293 += "\x20" + v300 + "\x20");
        continue;
      }
      if (String(v296?.["tagName"] || "")["toUpperCase"]() === "BR") {
        v293 += "\x0a";
        continue;
      }
      v294(v296);
    }
  };
  _getChildNodes(promptEl)["length"] > 0
    ? v294(promptEl)
    : (v293 = String(
        promptEl?.["innerText"] || promptEl?.["textContent"] || "",
      ));
  let v303 = _normalizePromptWhitespace(v293);
  (v283["forEach"]((v304) => {
    if (v304["used"]) return;
    const v305 = new RegExp(
      _escapeRegExp(v304["label"])["replace"](/\s+/g, "[\x5cs\x5cu00A0]*"),
      "g",
    );
    v305["test"](v303) &&
      ((v304["used"] = true),
      (v303 = v303["replace"](v305, "\x20" + v304["content"] + "\x20")));
  }),
    (v303 = _normalizePromptWhitespace(v303)));
  let v306 = "";
  prependUnusedTextRefs &&
    v283["forEach"]((v307) => {
      !v307["used"] &&
        v307["content"] &&
        ((v306 += v307["content"] + "\x0a"), (v307["used"] = true));
    });
  if (!v306) return v303;
  if (!v303) return v306["replace"](/\n+$/g, "");
  return "" + v306 + v303;
}
export function resolvePromptTextWithTextRefs(v308 = {}) {
  return _resolvePromptTextWithTextRefs(v308);
}
export function resolvePresetPromptTextWithTextRefs({
  template: template = null,
  promptEl: promptEl = null,
  inEdges: inEdges = [],
  nodes: nodes = {},
  assetInputRefs: assetInputRefs = null,
  assetMediaCounts: assetMediaCounts = null,
  allowedAssetTypes: allowedAssetTypes = null,
} = {}) {
  const v309 = _resolvePromptTextWithTextRefs({
    promptEl: promptEl,
    inEdges: inEdges,
    nodes: nodes,
    assetInputRefs: assetInputRefs,
    assetMediaCounts: assetMediaCounts,
    allowedAssetTypes: allowedAssetTypes,
  });
  if (template == null) return v309;
  const v310 = resolvePromptPresetTemplate(template, v309);
  return _resolvePromptTextWithTextRefs({
    promptEl: { innerText: v310, textContent: v310, childNodes: [] },
    inEdges: inEdges,
    nodes: nodes,
    assetInputRefs: assetInputRefs,
    assetMediaCounts: assetMediaCounts,
    allowedAssetTypes: allowedAssetTypes,
    prependUnusedTextRefs: false,
  });
}
function _notifyPromptHtmlUpdated(v311, v312 = {}) {
  const v313 = v312?.["renderRefBar"] !== false;
  if (typeof v311["_handlePromptHtmlUpdated"] === "function") {
    v311["_handlePromptHtmlUpdated"]();
    return;
  }
  (v313 &&
    typeof v311["_renderRefBar"] === "function" &&
    v311["_renderRefBar"](),
    typeof v311["_updateSubmitButtonState"] === "function" &&
      v311["_updateSubmitButtonState"]());
}
function _isEmptyPromptHtml(v314 = "") {
  const v315 = String(v314 || "")
    ["replace"](/<br\b[^>]*\/?>/gi, "")
    ["replace"](/<\/?(?:div|p|section|article|blockquote)\b[^>]*>/gi, "")
    ["replace"](/&nbsp;|\u00a0/g, "")
    ["trim"]();
  return v315 === "";
}
function _sanitizePromptHtmlForCommit(v316 = "") {
  const v317 = sanitizePromptHtml(v316);
  return _isEmptyPromptHtml(v317) ? "" : v317;
}
function _clearPromptHtmlCommitTimer(v318) {
  if (!v318?.["_promptHtmlCommitTimer"]) return;
  (clearTimeout(v318["_promptHtmlCommitTimer"]),
    (v318["_promptHtmlCommitTimer"] = null));
}
export function schedulePromptHtmlCommit(
  v319,
  { delayMs: delayMs = PROMPT_HTML_COMMIT_DELAY_MS } = {},
) {
  if (!v319?.["promptEl"] || !v319?.["nodeId"]) return false;
  if (isComfyPromptGuardActive(v319)) return false;
  (_clearPromptHtmlCommitTimer(v319),
    (v319["_hasPendingPromptHtmlCommit"] = true),
    _pendingPromptHtmlCommitTargets["add"](v319));
  const v320 = Math["max"](0, Number(delayMs) || 0);
  return (
    (v319["_promptHtmlCommitTimer"] = setTimeout(() => {
      flushPromptHtmlCommit(v319);
    }, v320)),
    true
  );
}
export function cancelPromptHtmlCommit(v321) {
  if (!v321) return false;
  return (
    _clearPromptHtmlCommitTimer(v321),
    (v321["_hasPendingPromptHtmlCommit"] = false),
    _pendingPromptHtmlCommitTargets["delete"](v321),
    true
  );
}
export function flushPromptHtmlCommit(v322) {
  if (!v322) return false;
  if (isComfyPromptGuardActive(v322)) return false;
  _clearPromptHtmlCommitTimer(v322);
  const v323 = v322["_hasPendingPromptHtmlCommit"] === true;
  ((v322["_hasPendingPromptHtmlCommit"] = false),
    _pendingPromptHtmlCommitTargets["delete"](v322));
  if (!v322?.["promptEl"] || !v322?.["nodeId"]) return false;
  const v324 = _sanitizePromptHtmlForCommit(v322["promptEl"]["innerHTML"]),
    v325 = appStore["getState"]?.()?.["nodes"]?.[v322["nodeId"]];
  if (!v325) return false;
  const v326 = v325["prompt"];
  if (!v323 && v326 === v324) return false;
  if (v326 === v324) return false;
  return (appStore["updateNodeData"](v322["nodeId"], { prompt: v324 }), true);
}
export function flushAllPendingPromptHtmlCommits() {
  let v327 = false;
  return (
    Array["from"](_pendingPromptHtmlCommitTargets)["forEach"]((v328) => {
      v327 = flushPromptHtmlCommit(v328) || v327;
    }),
    v327
  );
}
function _updatePromptHtml(v329, v330 = {}) {
  if (!v329?.["promptEl"] || !v329?.["nodeId"]) return;
  (cancelPromptHtmlCommit(v329),
    appStore["updateNodeData"](v329["nodeId"], {
      prompt: _sanitizePromptHtmlForCommit(v329["promptEl"]["innerHTML"]),
    }),
    _notifyPromptHtmlUpdated(v329, v330));
}
function _commitPromptAndAssetInputRefs(v331, v332) {
  if (!v331?.["nodeId"]) return false;
  const v333 = {
    [PROMPT_ASSET_INPUT_REFS_FIELD]: Array["isArray"](v332) ? v332 : [],
  };
  return (
    v331?.["promptEl"] &&
      (cancelPromptHtmlCommit(v331),
      (v333["prompt"] = _sanitizePromptHtmlForCommit(
        v331["promptEl"]["innerHTML"],
      ))),
    appStore["updateNodeData"](v331["nodeId"], v333),
    _notifyPromptHtmlUpdated(v331),
    true
  );
}
function _getPromptAssetInputRefRecordForMention(v334 = {}) {
  if (v334?.["origin"] !== "asset") return null;
  return _normalizePromptAssetInputRefRecord({
    assetId: v334["assetId"],
    itemIndex: v334["assetIndex"] ?? v334["itemIndex"],
    type: v334["type"],
  });
}
function _appendPromptAssetInputRefRecords(v335, v336 = []) {
  const v337 = _getPromptAssetInputRefRecords(_getTargetNodeData(v335)),
    v338 = v337["slice"]();
  return (
    (Array["isArray"](v336) ? v336 : [v336])["forEach"]((v339) => {
      const v340 = _getPromptAssetInputRefRecordForMention(v339);
      if (v340) v338["push"](v340);
    }),
    v338
  );
}
function _shouldStoreMentionAsPromptAssetInput(v341, v342 = {}) {
  const v343 = _getMentionType(v342?.["type"]);
  return (
    v342?.["origin"] === "asset" &&
    v343 &&
    v343 !== "text" &&
    isRunningHubWorkflowNode(_getTargetNodeData(v341))
  );
}
function _consumeMentionTriggerText({
  triggerRange: triggerRange = null,
  atIndex: atIndex = -1,
} = {}) {
  if (typeof window === "undefined" || typeof document === "undefined")
    return false;
  const v344 = window["getSelection"]?.(),
    v345 =
      triggerRange ||
      (v344 && v344["rangeCount"] ? v344["getRangeAt"](0) : null);
  if (!v345 || v345["startContainer"]["nodeType"] !== Node["TEXT_NODE"])
    return false;
  const v346 = v345["startContainer"],
    v347 = String(v346["textContent"] || ""),
    v348 = v345["startOffset"],
    v349 =
      Number["isFinite"](atIndex) && atIndex >= 0
        ? atIndex
        : v347["lastIndexOf"]("@", v348 - 1);
  if (v349 < 0) return false;
  const v350 = v346["parentNode"];
  if (!v350) return false;
  const v351 = document["createTextNode"](v347["slice"](0, v349)),
    v352 = document["createTextNode"](v347["slice"](v348));
  (v350["replaceChild"](v352, v346), v350["insertBefore"](v351, v352));
  const v353 = document["createRange"]();
  return (
    v353["setStartAfter"](v351),
    v353["collapse"](true),
    v344?.["removeAllRanges"]?.(),
    v344?.["addRange"]?.(v353),
    true
  );
}
function _insertPromptAssetInputRef(
  v354,
  v355,
  {
    triggerRange: triggerRange = null,
    atIndex: atIndex = -1,
    pillToEdit: pillToEdit = null,
  } = {},
) {
  const v356 = _appendPromptAssetInputRefRecords(v354, [v355]);
  if (pillToEdit)
    return (
      pillToEdit["remove"]?.(),
      _commitPromptAndAssetInputRefs(v354, v356)
    );
  if (
    !_consumeMentionTriggerText({
      triggerRange: triggerRange,
      atIndex: atIndex,
    })
  )
    return false;
  return _commitPromptAndAssetInputRefs(v354, v356);
}
function _escapePromptPreviewHtml(v357) {
  return String(v357 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;")
    ["replace"](/\r\n?/g, "\x0a")
    ["replace"](/\n/g, "<br>");
}
function _moveCaretToPromptEnd(v358) {
  if (!v358) return;
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof document["createRange"] !== "function"
  )
    return;
  try {
    const v359 = window["getSelection"]?.();
    if (!v359) return;
    const v360 = document["createRange"]();
    (v360["selectNodeContents"](v358),
      v360["collapse"](false),
      v359["removeAllRanges"](),
      v359["addRange"](v360));
  } catch {}
}
export function shouldUsePromptPreviewForPreset(v361 = null, v362 = {}) {
  return (
    (v362?.["insertPrompt"] === true ||
      globalThis["window"]?.["DEV_MODE"] === true) &&
    hasPromptPresetTemplateContent(v361)
  );
}
export function previewPresetPromptInEditor({
  storeApi: storeApi = appStore,
  nodeId: nodeId = "",
  promptEl: promptEl = null,
  promptText: promptText = "",
  toastText: toastText = "",
  toastType: toastType = "warn",
} = {}) {
  const v363 = String(promptText ?? ""),
    v364 = sanitizePromptHtml(_escapePromptPreviewHtml(v363)),
    v365 = typeof Element !== "undefined" && promptEl instanceof Element;
  promptEl && (promptEl["innerHTML"] = v364);
  !v365 &&
    promptEl &&
    (("textContent" in promptEl ||
      typeof promptEl["textContent"] !== "undefined") &&
      (promptEl["textContent"] = v363),
    ("innerText" in promptEl || typeof promptEl["innerText"] !== "undefined") &&
      (promptEl["innerText"] = v363),
    Array["isArray"](promptEl["childNodes"]) &&
      (promptEl["childNodes"] = [
        { nodeType: globalThis["Node"]?.["TEXT_NODE"] ?? 3, textContent: v363 },
      ]));
  if (typeof promptEl?.["focus"] === "function")
    try {
      promptEl["focus"]();
    } catch {}
  return (
    v365 && _moveCaretToPromptEnd(promptEl),
    storeApi?.["updateNodeData"] &&
      nodeId &&
      storeApi["updateNodeData"](nodeId, { prompt: v364 }),
    toastText && globalThis["window"]?.["showToast"]?.(toastText, toastType),
    v364
  );
}
export function insertPresetPromptIntoEditor({
  storeApi: storeApi = appStore,
  nodeId: nodeId = "",
  promptEl: promptEl = null,
  template: template = null,
  inEdges: inEdges = [],
  nodes: nodes = {},
  allowedAssetTypes: allowedAssetTypes = null,
  toastText: toastText = "",
  toastType: toastType = "success",
} = {}) {
  const v366 = resolvePresetPromptTextWithTextRefs({
    template: template,
    promptEl: promptEl,
    inEdges: inEdges,
    nodes: nodes,
    assetInputRefs: [],
    assetMediaCounts: { image: 0, video: 0, audio: 0 },
    allowedAssetTypes: allowedAssetTypes,
  });
  return previewPresetPromptInEditor({
    storeApi: storeApi,
    nodeId: nodeId,
    promptEl: promptEl,
    promptText: v366,
    toastText: toastText,
    toastType: toastType,
  });
}
let _mentionMenuEl = null,
  _mentionMenuState = { activeMenu: null },
  _mentionViewportUnsubscribe = null,
  _mentionOutsideDocClick = null,
  _mentionOutsideDocClickTimer = 0,
  _mentionMenuPositionState = null;
function _isMentionNodeConnected(v367) {
  if (!v367) return false;
  if (v367["isConnected"] === true) return true;
  if (typeof document === "undefined") return true;
  return typeof document["body"]?.["contains"] === "function"
    ? document["body"]["contains"](v367)
    : true;
}
function _clearMentionOutsideDocClick() {
  (_mentionOutsideDocClickTimer &&
    (clearTimeout(_mentionOutsideDocClickTimer),
    (_mentionOutsideDocClickTimer = 0)),
    _mentionOutsideDocClick &&
      typeof document !== "undefined" &&
      document["removeEventListener"]?.("mousedown", _mentionOutsideDocClick),
    (_mentionOutsideDocClick = null));
}
function _cleanupMentionMenuLifecycle() {
  (_clearMentionOutsideDocClick(),
    _mentionViewportUnsubscribe &&
      (_mentionViewportUnsubscribe(), (_mentionViewportUnsubscribe = null)),
    (_mentionMenuPositionState = null));
}
function _resolveMentionMenuPoint(v368) {
  if (!v368) return null;
  const v369 = 5;
  if (v368["triggerRange"]?.["getBoundingClientRect"])
    try {
      const v370 = v368["triggerRange"]["getBoundingClientRect"]();
      if (v370) return { left: v370["left"], top: v370["bottom"] + v369 };
    } catch {}
  if (
    v368["pillToEdit"]?.["getBoundingClientRect"] &&
    _isMentionNodeConnected(v368["pillToEdit"])
  ) {
    const v371 = v368["pillToEdit"]["getBoundingClientRect"]();
    return { left: v371["left"], top: v371["bottom"] + v369 };
  }
  if (
    Number["isFinite"](v368["fallbackX"]) &&
    Number["isFinite"](v368["fallbackY"])
  )
    return { left: v368["fallbackX"], top: v368["fallbackY"] };
  return null;
}
function _syncOpenMentionSubmenus() {
  const v372 = _mentionMenuPositionState?.["menu"] || _mentionMenuEl;
  if (!v372?.["querySelectorAll"]) return;
  v372["querySelectorAll"](".at-mention-submenu-open")["forEach"]((v373) => {
    const v374 = Array["from"](v373["children"] || [])["find"]((v375) =>
      v375["classList"]?.["contains"]("at-mention-submenu"),
    );
    if (v374) _positionMentionSubmenu(v373, v374);
  });
}
function _positionMentionMenu() {
  const v376 = _mentionMenuPositionState,
    v377 = v376?.["menu"];
  if (!v376 || !v377 || v377["style"]["display"] !== "flex") return;
  const v378 = _resolveMentionMenuPoint(v376);
  if (!v378) {
    _closeMentionMenu();
    return;
  }
  const v379 = Number(globalThis["window"]?.["innerHeight"] || 0),
    v380 =
      v379 > 0 && v378["top"] + 180 > v379 ? v378["top"] - 185 : v378["top"];
  ((v377["style"]["left"] = v378["left"] + "px"),
    (v377["style"]["top"] = v380 + "px"),
    _syncOpenMentionSubmenus());
}
function _watchMentionViewport() {
  if (typeof appStore["subscribeSelector"] !== "function") return;
  if (_mentionViewportUnsubscribe) _mentionViewportUnsubscribe();
  _mentionViewportUnsubscribe = appStore["subscribeSelector"](
    (v381) => v381["viewport"],
    () => _positionMentionMenu(),
  );
}
function _bindMentionOutsideDocClick(v382) {
  (_clearMentionOutsideDocClick(),
    (_mentionOutsideDocClick = (v383) => {
      !v382["contains"](v383["target"]) && _closeMentionMenu();
    }),
    (_mentionOutsideDocClickTimer = setTimeout(() => {
      ((_mentionOutsideDocClickTimer = 0),
        _mentionOutsideDocClick &&
          document["addEventListener"]?.("mousedown", _mentionOutsideDocClick));
    }, 10)));
}
export function _getMentionMenu() {
  if (!_mentionMenuEl) {
    _mentionMenuEl = document["getElementById"]("v2-mention-menu");
    if (!_mentionMenuEl)
      ((_mentionMenuEl = document["createElement"]("div")),
        (_mentionMenuEl["id"] = "v2-mention-menu"),
        (_mentionMenuEl["className"] = "at-mention-menu"),
        document["body"]["appendChild"](_mentionMenuEl));
    else
      !_mentionMenuEl["classList"]["contains"]("at-mention-menu") &&
        _mentionMenuEl["classList"]["add"]("at-mention-menu");
  }
  const v384 = document["getElementById"]?.("v2-mention-menu") || null;
  if (v384 && v384 !== _mentionMenuEl) _mentionMenuEl = v384;
  else
    _mentionMenuEl &&
      !v384 &&
      typeof document["body"]?.["appendChild"] === "function" &&
      document["body"]["appendChild"](_mentionMenuEl);
  return (
    _mentionMenuEl &&
      !_mentionMenuEl["classList"]["contains"]("at-mention-menu") &&
      _mentionMenuEl["classList"]["add"]("at-mention-menu"),
    _mentionMenuEl
  );
}
export function _closeMentionMenu() {
  _cleanupMentionMenuLifecycle();
  const v385 = _getMentionMenu();
  ((v385["style"]["display"] = "none"),
    (v385["innerHTML"] = ""),
    (_mentionMenuState["activeMenu"] = null));
}
export function _buildMentionCandidates(v386, v387 = "", v388 = {}) {
  const v389 = v386?.["nodeId"],
    v390 = appStore["getState"](),
    v391 = v390["nodes"] || {},
    v392 = v391?.[v389] || v386?.["_data"] || {},
    v393 = getTargetInputPolicy(v392),
    v394 = appStore["getIncomingEdges"](v389),
    v395 = _normalizeQuery(v387),
    v396 = { text: 0, image: 0, video: 0, audio: 0 },
    v397 = _countPromptPillsByType(
      v386?.["promptEl"],
      v388?.["excludePill"] || null,
      { nodeData: v392 },
    ),
    v398 = { ...v397 },
    v399 = [];
  v394["forEach"]((v400) => {
    const v401 = v391[v400["sourceId"]];
    if (!v401) return;
    const v402 = resolveEffectiveInputKind(v401, v400);
    if (!v402) return;
    if (!isInputKindAllowed(v393, v402)) return;
    if (v398[v402] != null) v398[v402] += 1;
    v396[v402] += 1;
    const v403 = AT_TYPE_MAP[v402] || v402,
      v404 = "" + v403 + v396[v402],
      v405 = v404;
    if (v395 && !v404["includes"](v395) && !v403["includes"](v395)) return;
    v399["push"]({
      origin: "node",
      edgeId: v400["id"],
      nodeId: v400["sourceId"],
      type: v402,
      label: v405,
      ..._getMentionVisual(v386, {
        origin: "node",
        nodeId: v400["sourceId"],
        type: v402,
      }),
      limitReason: "",
    });
  });
  const v406 = MENTION_TYPE_ORDER["filter"]((v407) =>
    isInputKindAllowed(v393, v407),
  );
  return (
    getAssetMentionCandidates({ query: "", allowedTypes: v406 })["forEach"](
      (v408) => {
        const v409 = _getMentionType(v408["type"]);
        if (!v409) return;
        if (!_candidateMatchesQuery(v408, v387)) return;
        v399["push"]({
          origin: "asset",
          assetId: v408["assetId"],
          assetIndex: v408["itemIndex"],
          type: v409,
          label: _stripMentionDisplayMarker(
            v408["insertLabel"] || v408["label"] || v408["name"],
          ),
          assetName: v408["assetName"],
          thumbUrl: _getRenderableMentionThumbUrl(v408["thumbUrl"] || "", v409),
          iconType: v409,
          limitReason:
            _getAdvancedVoiceCloneAudioLimitReason(
              v386,
              {
                origin: "asset",
                assetId: v408["assetId"],
                assetIndex: v408["itemIndex"],
                type: v409,
              },
              v392,
              v390,
            ) ?? getInputLimitReason(v393, v409, v398),
        });
      },
    ),
    v399
  );
}
export function _buildMentionMenuTree(v410 = []) {
  const v411 = [],
    v412 = new Map();
  (Array["isArray"](v410) ? v410 : [])["forEach"]((v413) => {
    if (!v413 || typeof v413 !== "object") return;
    if (v413["origin"] !== "asset") {
      v411["push"](v413);
      return;
    }
    const v414 = _getMentionType(v413["type"]);
    if (!v414) return;
    const v415 = String(v413["assetId"] || v413["assetName"] || "asset");
    !v412["has"](v415) &&
      v412["set"](v415, {
        assetId: v413["assetId"] || "",
        label: v413["assetName"] || "资产",
        typeMap: new Map(),
        items: [],
      });
    const v416 = v412["get"](v415);
    (v416["items"]["push"](v413),
      !v416["typeMap"]["has"](v414) &&
        v416["typeMap"]["set"](v414, {
          type: v414,
          label: _getAssetTypeMenuLabel(v414),
          items: [],
        }),
      v416["typeMap"]["get"](v414)["items"]["push"](v413));
  });
  const v417 = Array["from"](v412["values"]())
    ["map"]((v418) => ({
      assetId: v418["assetId"],
      label: v418["label"],
      items: v418["items"],
      typeItems: MENTION_TYPE_ORDER["map"]((v419) =>
        v418["typeMap"]["get"](v419),
      )["filter"]((v420) => v420?.["items"]?.["length"] > 0),
    }))
    ["filter"]((v421) => v421["items"]["length"] > 0);
  return { nodeItems: v411, assetItems: v417 };
}
function _getPromptInputPillLabel(v422) {
  return _stripMentionDisplayMarker(
    _getDatasetValue(v422, "label", "data-label") ||
      v422?.["textContent"] ||
      "",
  );
}
function _buildInputMentionCandidateIndex(v423) {
  const v424 = _buildMentionCandidates(v423, "")["filter"](
      (v425) => v425?.["origin"] === "node",
    ),
    v426 = new Map(),
    v427 = new Map(),
    v428 = new Map();
  return (
    v424["forEach"]((v429) => {
      const v430 = String(v429?.["nodeId"] || "")["trim"](),
        v431 = _normalizeMentionLabelKey(v429?.["label"] || ""),
        v432 = _getMentionType(v429?.["type"]);
      if (v430) v426["set"](v430, v429);
      if (v431 && !v427["has"](v431)) v427["set"](v431, v429);
      if (v431 && v432) {
        const v433 = v432 + ":" + v431;
        if (!v428["has"](v433)) v428["set"](v433, v429);
      }
    }),
    { bySourceId: v426, byLabel: v427, byLabelAndType: v428 }
  );
}
function _applyInputMentionCandidateToPill(v434, v435, v436) {
  if (!_isRefPillNode(v435) || !v436) return false;
  const v437 = _stripMentionDisplayMarker(
      v436["label"] || v435["dataset"]?.["label"] || "",
    ),
    v438 = _getMentionType(v436["type"]);
  ((v435["dataset"]["refOrigin"] = "node"),
    (v435["dataset"]["label"] = v437),
    (v435["dataset"]["nodeId"] = String(v436["nodeId"] || "")));
  if (v438) v435["dataset"]["refType"] = v438;
  return (
    delete v435["dataset"]["assetId"],
    delete v435["dataset"]["assetIndex"],
    v435["removeAttribute"]?.("data-asset-id"),
    v435["removeAttribute"]?.("data-asset-index"),
    _clearInputMentionPillUnresolved(v435),
    _renderMentionPillContent(v435, v437, _getMentionVisual(v434, v436, v435)),
    true
  );
}
export function resolvePromptInputPillsForTarget(v439) {
  if (
    !v439?.["promptEl"] ||
    typeof v439["promptEl"]["querySelectorAll"] !== "function"
  )
    return { resolved: 0, unresolved: 0 };
  const v440 = _buildInputMentionCandidateIndex(v439);
  let v441 = 0,
    v442 = 0;
  return (
    v439["promptEl"]["querySelectorAll"](".ref-pill")["forEach"]((v443) => {
      if (_isAssetMentionPill(v443)) return;
      const v444 = _getPromptInputPillLabel(v443),
        v445 = _normalizeMentionLabelKey(v444),
        v446 = _getPillMentionType(v443),
        v447 = _getDatasetValue(v443, "nodeId", "data-node-id");
      let v448 = v447 ? v440["bySourceId"]["get"](v447) : null;
      !v448 &&
        v445 &&
        v446 &&
        (v448 = v440["byLabelAndType"]["get"](v446 + ":" + v445) || null);
      !v448 && v445 && (v448 = v440["byLabel"]["get"](v445) || null);
      if (v448 && (!v446 || _getMentionType(v448["type"]) === v446)) {
        if (_applyInputMentionCandidateToPill(v439, v443, v448)) v441 += 1;
        return;
      }
      if (_setInputMentionPillUnresolved(v443, { label: v444, type: v446 }))
        v442 += 1;
    }),
    { resolved: v441, unresolved: v442 }
  );
}
function _getClipboardData(v449, v450) {
  const v451 =
    v449?.["clipboardData"] || globalThis["window"]?.["clipboardData"];
  if (typeof v451?.["getData"] !== "function") return "";
  return String(v451["getData"](v450) || "");
}
function _insertPromptHtmlAtSelection(v452) {
  if (
    typeof document !== "undefined" &&
    typeof document["execCommand"] === "function"
  )
    try {
      if (document["execCommand"]("insertHTML", false, v452)) return true;
    } catch {}
  return false;
}
function _insertPromptTextAtSelection(v453) {
  if (
    typeof document !== "undefined" &&
    typeof document["execCommand"] === "function"
  )
    try {
      if (document["execCommand"]("insertText", false, v453)) return true;
    } catch {}
  return false;
}
export function handlePromptPaste(v454, v455) {
  if (!v454?.["promptEl"]) return false;
  v455?.["preventDefault"]?.();
  const v456 = _getClipboardData(v455, "text/html"),
    v457 = _getClipboardData(v455, "text/plain"),
    v458 = sanitizePromptHtml(v456),
    v459 = !!v458 && /class="ref-pill"/i["test"](v458);
  if (!v459) {
    const v460 = _insertPromptTextAtSelection(v457);
    if (v460) return (_updatePromptHtml(v454), true);
    return false;
  }
  const v461 = _insertPromptHtmlAtSelection(v458);
  if (!v461) {
    const v462 = _insertPromptTextAtSelection(v457);
    if (v462) _updatePromptHtml(v454);
    return v462;
  }
  const v463 = resolvePromptInputPillsForTarget(v454);
  return (
    _rehydratePromptPills(v454),
    _syncEdgesOrderFromPills(v454),
    _updatePromptHtml(v454),
    v463["unresolved"] > 0 &&
      globalThis["window"]?.["showToast"]?.(
        "Some\x20@\x20input\x20refs\x20are\x20not\x20bound\x20in\x20this\x20node.",
        "warn",
      ),
    true
  );
}
export function handlePromptSelectAll(v464, v465) {
  if (!v464?.["promptEl"]) return false;
  const v466 = String(v465?.["key"] || "")["toLowerCase"](),
    v467 = String(v465?.["code"] || ""),
    v468 =
      (v465?.["ctrlKey"] || v465?.["metaKey"]) &&
      !v465?.["altKey"] &&
      (v466 === "a" || v467 === "KeyA");
  if (!v468) return false;
  const v469 = globalThis["window"]?.["getSelection"]?.(),
    v470 =
      typeof document !== "undefined" &&
      typeof document["createRange"] === "function"
        ? document["createRange"]()
        : null;
  if (!v469 || !v470) return false;
  return (
    v465["preventDefault"]?.(),
    v465["stopPropagation"]?.(),
    v470["selectNodeContents"](v464["promptEl"]),
    v469["removeAllRanges"]?.(),
    v469["addRange"]?.(v470),
    true
  );
}
export function _insertMentionPill(
  v471,
  {
    label: v472,
    nodeId: v473,
    triggerRange: triggerRange = null,
    atIndex: atIndex = -1,
    pillToEdit: pillToEdit = null,
    candidate: candidate = null,
  } = {},
) {
  if (!v471?.["promptEl"]) return false;
  const v474 = candidate || {
      origin: "node",
      label: v472,
      nodeId: v473,
      type: "",
    },
    v475 = _getMentionType(v474["type"]);
  if (v475) {
    const v476 = appStore["getState"](),
      v477 = v476["nodes"]?.[v471["nodeId"]] || v471?.["_data"] || {},
      v478 = getTargetInputPolicy(v477),
      v479 = _countPromptPillsByType(v471["promptEl"], pillToEdit || null, {
        nodeData: v477,
      });
    if (v474["origin"] === "asset") {
      const v480 = v476["nodes"] || {};
      appStore["getIncomingEdges"](v471["nodeId"])["forEach"]((v481) => {
        const v482 = resolveEffectiveInputKind(
          v480?.[v481?.["sourceId"]],
          v481,
        );
        if (v479[v482] != null) v479[v482] += 1;
      });
    }
    const v483 =
      _getAdvancedVoiceCloneAudioLimitReason(v471, v474, v477, v476) ??
      getInputLimitReason(v478, v475, v479);
    if (v483)
      return (globalThis["window"]?.["showToast"]?.(v483, "warn"), false);
  }
  if (_shouldStoreMentionAsPromptAssetInput(v471, v474))
    return _insertPromptAssetInputRef(v471, v474, {
      triggerRange: triggerRange,
      atIndex: atIndex,
      pillToEdit: pillToEdit,
    });
  const v484 = (v485) => {
    const v486 = _stripMentionDisplayMarker(v474["label"] || v472 || "");
    ((v485["dataset"]["label"] = v486),
      v474["origin"] === "asset"
        ? ((v485["dataset"]["refOrigin"] = "asset"),
          (v485["dataset"]["assetId"] = String(v474["assetId"] || "")),
          (v485["dataset"]["assetIndex"] = String(v474["assetIndex"] ?? "")),
          (v485["dataset"]["refType"] = String(v475 || v474["type"] || "")),
          _clearInputMentionPillUnresolved(v485),
          delete v485["dataset"]["nodeId"],
          v485["removeAttribute"]?.("data-node-id"),
          _renderMentionPillContent(
            v485,
            v486,
            _getMentionVisual(v471, v474, v485),
          ))
        : ((v485["dataset"]["refOrigin"] = "node"),
          (v485["dataset"]["nodeId"] = String(v474["nodeId"] || v473 || "")),
          (v475 || v474["type"]) &&
            (v485["dataset"]["refType"] = String(v475 || v474["type"] || "")),
          _clearInputMentionPillUnresolved(v485),
          delete v485["dataset"]["assetId"],
          delete v485["dataset"]["assetIndex"],
          v485["removeAttribute"]?.("data-asset-id"),
          v485["removeAttribute"]?.("data-asset-index"),
          _renderMentionPillContent(
            v485,
            v486,
            _getMentionVisual(v471, v474, v485),
          )));
  };
  if (pillToEdit) return (v484(pillToEdit), _updatePromptHtml(v471), true);
  const v487 = window["getSelection"](),
    v488 =
      triggerRange ||
      (v487 && v487["rangeCount"] ? v487["getRangeAt"](0) : null);
  if (!v488 || v488["startContainer"]["nodeType"] !== Node["TEXT_NODE"])
    return false;
  const v489 = v488["startContainer"],
    v490 = String(v489["textContent"] || ""),
    v491 = v488["startOffset"],
    v492 =
      Number["isFinite"](atIndex) && atIndex >= 0
        ? atIndex
        : v490["lastIndexOf"]("@", v491 - 1);
  if (v492 < 0) return false;
  const v493 = v490["slice"](0, v492),
    v494 = v490["slice"](v491),
    v495 = document["createTextNode"](v493),
    v496 = document["createTextNode"](v494),
    v497 = document["createElement"]("span");
  ((v497["className"] = "ref-pill"),
    (v497["contentEditable"] = "false"),
    v484(v497),
    _bindPromptPill(v471, v497),
    v489["parentNode"]["replaceChild"](v496, v489),
    v496["parentNode"]["insertBefore"](v497, v496),
    v496["parentNode"]["insertBefore"](v495, v497));
  const v498 = document["createRange"]();
  return (
    v498["setStartAfter"](v497),
    v498["collapse"](true),
    v487["removeAllRanges"](),
    v487["addRange"](v498),
    _updatePromptHtml(v471),
    true
  );
}
function _getDirectMentionItems(v499) {
  return Array["from"](v499?.["children"] || [])["filter"]((v500) =>
    v500["classList"]?.["contains"]("at-mention-item"),
  );
}
function _clearActiveItems(v501) {
  _getDirectMentionItems(v501)["forEach"]((v502) =>
    v502["classList"]["remove"]("active"),
  );
}
function _setActiveMentionItem(
  v503,
  { focusSubmenu: focusSubmenu = false } = {},
) {
  if (!v503) return;
  const v504 = v503["parentElement"];
  if (!v504) return;
  (_clearActiveItems(v504),
    v503["classList"]["add"]("active"),
    (_mentionMenuState["activeMenu"] = v504),
    v503["classList"]["contains"]("at-mention-has-submenu")
      ? _openMentionSubmenu(v503, { focusSubmenu: focusSubmenu })
      : _closeSiblingMentionSubmenus(v503));
}
function _setInitialMentionActiveItem(v505) {
  const v506 =
    _getDirectMentionItems(v505)["find"](
      (v507) => !v507["classList"]["contains"]("at-mention-disabled"),
    ) || _getDirectMentionItems(v505)[0];
  if (v506) _setActiveMentionItem(v506);
}
function _closeSiblingMentionSubmenus(v508) {
  const v509 = v508?.["parentElement"];
  if (!v509) return;
  _getDirectMentionItems(v509)["forEach"]((v510) => {
    if (v510 === v508) return;
    (v510["classList"]["remove"]("at-mention-submenu-open"),
      v510["querySelectorAll"](".at-mention-submenu-open")["forEach"]((v511) =>
        v511["classList"]["remove"]("at-mention-submenu-open"),
      ));
  });
}
function _positionMentionSubmenu(v512, v513) {
  if (!v512 || !v513 || typeof v512["getBoundingClientRect"] !== "function")
    return;
  const v514 = v512["getBoundingClientRect"](),
    v515 = Number(globalThis["window"]?.["innerWidth"] || 0),
    v516 = Number(globalThis["window"]?.["innerHeight"] || 0),
    v517 = 6,
    v518 = 12,
    v519 = v513["offsetWidth"] || 220,
    v520 = v513["offsetHeight"] || 320;
  let v521 = v514["right"] + v517;
  v515 > 0 &&
    v521 + v519 + v518 > v515 &&
    (v521 = Math["max"](v518, v514["left"] - v519 - v517));
  let v522 = v514["top"];
  (v516 > 0 &&
    v522 + v520 + v518 > v516 &&
    (v522 = Math["max"](v518, v516 - v520 - v518)),
    (v513["style"]["left"] = Math["round"](v521) + "px"),
    (v513["style"]["top"] = Math["round"](v522) + "px"),
    v516 > 0 &&
      (v513["style"]["maxHeight"] = Math["max"](160, v516 - v518 * 2) + "px"));
}
function _openMentionSubmenu(
  v523,
  { focusSubmenu: focusSubmenu = false } = {},
) {
  const v524 = Array["from"](v523?.["children"] || [])["find"]((v525) =>
    v525["classList"]?.["contains"]("at-mention-submenu"),
  );
  if (!v524) return false;
  return (
    _closeSiblingMentionSubmenus(v523),
    v523["classList"]["add"]("at-mention-submenu-open"),
    _positionMentionSubmenu(v523, v524),
    focusSubmenu
      ? ((_mentionMenuState["activeMenu"] = v524),
        _setInitialMentionActiveItem(v524))
      : (_mentionMenuState["activeMenu"] = v523["parentElement"] || v524),
    true
  );
}
function _activateMentionMenuItem(v526) {
  if (!v526) return false;
  if (v526["classList"]["contains"]("at-mention-has-submenu"))
    return _openMentionSubmenu(v526, { focusSubmenu: true });
  if (typeof v526["_mentionSelect"] === "function")
    return (v526["_mentionSelect"](), true);
  return false;
}
function _createMentionMenuItem({
  label: label = "",
  title: title = "",
  disabled: disabled = false,
  hasSubmenu: hasSubmenu = false,
  thumbUrl: thumbUrl = "",
  thumbNode: thumbNode = null,
  iconType: iconType = "",
  badges: badges = null,
  onSelect: onSelect = null,
} = {}) {
  const v527 = document["createElement"]("div");
  ((v527["className"] =
    "at-mention-item" +
    (disabled ? " at-mention-disabled disabled" : "") +
    (hasSubmenu ? "\x20at-mention-has-submenu" : "")),
    (v527["title"] = title || ""));
  const v528 = _getMentionType(iconType);
  if (thumbUrl || thumbNode || v528 === "text" || v528 === "audio") {
    const v529 = document["createElement"]("span");
    v529["className"] = "at-mention-visual";
    if (thumbUrl) {
      const v530 = document["createElement"]("img");
      ((v530["className"] = "at-mention-thumb"),
        (v530["src"] = thumbUrl),
        (v530["alt"] = ""),
        (v530["draggable"] = false),
        v529["appendChild"](v530));
    } else {
      const v531 = _cloneMentionThumbNode(
        thumbNode,
        "at-mention-thumb",
        iconType,
      );
      if (v531) v529["appendChild"](v531);
    }
    if (v529["childNodes"]["length"]) v527["appendChild"](v529);
  }
  const v532 = document["createElement"]("span");
  ((v532["className"] = "at-mention-label"),
    (v532["textContent"] = label),
    v527["appendChild"](v532));
  if (Array["isArray"](badges) && badges["length"] > 0) {
    const v533 = document["createElement"]("span");
    ((v533["className"] = "at-mention-badges"),
      badges["slice"](0, 4)["forEach"]((v534) => {
        const v535 = document["createElement"]("span");
        ((v535["className"] = "at-mention-badge"),
          (v535["textContent"] = String(v534 || "")),
          v533["appendChild"](v535));
      }),
      v527["appendChild"](v533));
  }
  if (hasSubmenu) {
    const v536 = document["createElement"]("span");
    ((v536["className"] = "at-mention-arrow"),
      (v536["textContent"] = ">"),
      v527["appendChild"](v536));
  }
  return (
    (v527["_mentionSelect"] = onSelect),
    v527["addEventListener"]("mouseenter", () => {
      _setActiveMentionItem(v527);
    }),
    v527["addEventListener"]("mousedown", (v537) => {
      (v537["preventDefault"](),
        v537["stopPropagation"](),
        _activateMentionMenuItem(v527));
    }),
    v527
  );
}
function _appendMentionCandidateItem(
  v538,
  v539,
  v540,
  {
    triggerRange: triggerRange = null,
    atIndex: atIndex = -1,
    pillToEdit: pillToEdit = null,
  } = {},
) {
  const v541 = _createMentionMenuItem({
    label: v540["label"],
    title: v540["limitReason"] || "",
    disabled: !!v540["limitReason"],
    thumbUrl: v540["thumbUrl"] || "",
    thumbNode: v540["thumbNode"] || null,
    iconType: v540["iconType"] || v540["type"] || "",
    onSelect: () => {
      if (v540["limitReason"]) {
        globalThis["window"]?.["showToast"]?.(v540["limitReason"], "warn");
        return;
      }
      (_insertMentionPill(v539, {
        label: v540["label"],
        nodeId: v540["nodeId"],
        candidate: v540,
        triggerRange: triggerRange,
        atIndex: atIndex,
        pillToEdit: pillToEdit,
      }),
        _closeMentionMenu());
    },
  });
  return (
    v540["assetName"] &&
      !v540["limitReason"] &&
      (v541["title"] =
        v540["assetName"] + " · " + _getAssetTypeMenuLabel(v540["type"])),
    v538["appendChild"](v541),
    v541
  );
}
function _getBulkAssetLimitReason(v542, v543 = [], v544 = null) {
  const v545 = (Array["isArray"](v543) ? v543 : [])["filter"](
    (v546) => v546?.["origin"] === "asset",
  );
  if (!v545["length"]) return "该资产没有当前模型可用的素材";
  const v547 = appStore["getState"](),
    v548 = v547["nodes"]?.[v542?.["nodeId"]] || v542?.["_data"] || {},
    v549 = getTargetInputPolicy(v548);
  if (_isAdvancedVoiceCloneTarget(v548)) {
    const v550 = _getActualAudioInputKeysForTarget(
        v542?.["nodeId"],
        v548,
        v547,
      ),
      v551 = Number(v549?.["maxByKind"]?.["audio"]);
    for (const v552 of v545) {
      const v553 = _getMentionType(v552["type"]);
      if (!v553) continue;
      if (v553 !== "audio") {
        const v554 = getInputLimitReason(v549, v553, {});
        if (v554) return v554;
        continue;
      }
      const v555 = _getMentionAudioInputKey(v552);
      if (v555 && v550["has"](v555)) continue;
      if (Number["isFinite"](v551) && v550["size"] >= v551)
        return getInputLimitReason(v549, "audio", { audio: v550["size"] });
      if (v555) v550["add"](v555);
    }
    return "";
  }
  const v556 = _countPromptPillsByType(v542?.["promptEl"], v544 || null, {
      nodeData: v548,
    }),
    v557 = v547["nodes"] || {};
  appStore["getIncomingEdges"](v542?.["nodeId"])["forEach"]((v558) => {
    const v559 = resolveEffectiveInputKind(v557?.[v558?.["sourceId"]], v558);
    if (v556[v559] != null) v556[v559] += 1;
  });
  for (const v560 of v545) {
    const v561 = _getMentionType(v560["type"]);
    if (!v561) continue;
    const v562 = getInputLimitReason(v549, v561, v556);
    if (v562) return v562;
    if (v556[v561] != null) v556[v561] += 1;
  }
  return "";
}
function _createMentionPillForCandidate(v563, v564 = null) {
  const v565 = document["createElement"]("span");
  ((v565["className"] = "ref-pill"), (v565["contentEditable"] = "false"));
  const v566 = _getMentionType(v563?.["type"]),
    v567 = _stripMentionDisplayMarker(v563?.["label"] || "");
  v565["dataset"]["label"] = v567;
  if (v563?.["origin"] === "asset")
    return (
      (v565["dataset"]["refOrigin"] = "asset"),
      (v565["dataset"]["assetId"] = String(v563["assetId"] || "")),
      (v565["dataset"]["assetIndex"] = String(v563["assetIndex"] ?? "")),
      (v565["dataset"]["refType"] = String(v566 || v563["type"] || "")),
      _renderMentionPillContent(
        v565,
        v567,
        _getMentionVisual(v564, v563, v565),
      ),
      v565
    );
  return (
    (v565["dataset"]["refOrigin"] = "node"),
    (v565["dataset"]["nodeId"] = String(v563?.["nodeId"] || "")),
    (v566 || v563?.["type"]) &&
      (v565["dataset"]["refType"] = String(v566 || v563["type"] || "")),
    _renderMentionPillContent(v565, v567, _getMentionVisual(v564, v563, v565)),
    v565
  );
}
function _insertMentionPills(
  v568,
  v569 = [],
  {
    triggerRange: triggerRange = null,
    atIndex: atIndex = -1,
    pillToEdit: pillToEdit = null,
  } = {},
) {
  if (!v568?.["promptEl"]) return false;
  const v570 = (Array["isArray"](v569) ? v569 : [])["filter"](Boolean);
  if (!v570["length"]) return false;
  if (pillToEdit)
    return _insertMentionPill(v568, {
      candidate: v570[0],
      pillToEdit: pillToEdit,
    });
  const v571 = v570["filter"]((v572) =>
      _shouldStoreMentionAsPromptAssetInput(v568, v572),
    ),
    v573 = v570["filter"](
      (v574) => !_shouldStoreMentionAsPromptAssetInput(v568, v574),
    );
  if (!v573["length"]) {
    const v575 = _appendPromptAssetInputRefRecords(v568, v571);
    if (
      !_consumeMentionTriggerText({
        triggerRange: triggerRange,
        atIndex: atIndex,
      })
    )
      return false;
    return _commitPromptAndAssetInputRefs(v568, v575);
  }
  const v576 = window["getSelection"](),
    v577 =
      triggerRange ||
      (v576 && v576["rangeCount"] ? v576["getRangeAt"](0) : null);
  if (!v577 || v577["startContainer"]["nodeType"] !== Node["TEXT_NODE"])
    return false;
  const v578 = v577["startContainer"],
    v579 = String(v578["textContent"] || ""),
    v580 = v577["startOffset"],
    v581 =
      Number["isFinite"](atIndex) && atIndex >= 0
        ? atIndex
        : v579["lastIndexOf"]("@", v580 - 1);
  if (v581 < 0) return false;
  const v582 = document["createTextNode"](v579["slice"](0, v581)),
    v583 = document["createTextNode"](v579["slice"](v580)),
    v584 = v578["parentNode"];
  if (!v584) return false;
  v584["replaceChild"](v583, v578);
  const v585 = [];
  (v573["forEach"]((v586, v587) => {
    v587 > 0 &&
      v584["insertBefore"](document["createTextNode"]("\u00a0"), v583);
    const v588 = _createMentionPillForCandidate(v586, v568);
    (_bindPromptPill(v568, v588),
      v585["push"](v588),
      v584["insertBefore"](v588, v583));
  }),
    v584["insertBefore"](v582, v585[0] || v583));
  const v589 = document["createRange"](),
    v590 = v585[v585["length"] - 1];
  return (
    v589["setStartAfter"](v590),
    v589["collapse"](true),
    v576["removeAllRanges"](),
    v576["addRange"](v589),
    v571["length"]
      ? _commitPromptAndAssetInputRefs(
          v568,
          _appendPromptAssetInputRefRecords(v568, v571),
        )
      : _updatePromptHtml(v568),
    true
  );
}
function _appendMentionDivider(v591) {
  const v592 = document["createElement"]("div");
  return (
    (v592["className"] = "at-mention-divider"),
    v591["appendChild"](v592),
    v592
  );
}
function _createMentionSubmenu({ leaf: leaf = false } = {}) {
  const v593 = document["createElement"]("div");
  return (
    (v593["className"] =
      "at-mention-menu at-mention-submenu" +
      (leaf ? " at-mention-leaf-submenu" : " at-mention-branch-submenu")),
    v593["addEventListener"]("mouseenter", () => {
      _mentionMenuState["activeMenu"] = v593;
    }),
    v593
  );
}
export function _populateMentionMenu(
  v594,
  {
    x: v595,
    y: v596,
    triggerRange: triggerRange = null,
    query: query = "",
    atIndex: atIndex = -1,
    pillToEdit: pillToEdit = null,
  } = {},
) {
  const v597 = _getMentionMenu();
  _cleanupMentionMenuLifecycle();
  const v598 = _buildMentionCandidates(v594, query, {
      excludePill: pillToEdit || null,
    }),
    v599 = _buildMentionMenuTree(v598);
  v597["innerHTML"] = "";
  if (!v598["length"]) return (_closeMentionMenu(), false);
  return (
    v599["nodeItems"]["forEach"]((v600) => {
      _appendMentionCandidateItem(v597, v594, v600, {
        triggerRange: triggerRange,
        atIndex: atIndex,
        pillToEdit: pillToEdit,
      });
    }),
    v599["nodeItems"]["length"] &&
      v599["assetItems"]["length"] &&
      _appendMentionDivider(v597),
    v599["assetItems"]["forEach"]((v601) => {
      const v602 = _createMentionMenuItem({
          label: v601["label"],
          hasSubmenu: true,
        }),
        v603 = _createMentionSubmenu(),
        v604 = _getBulkAssetLimitReason(v594, v601["items"], pillToEdit),
        v605 = _createMentionMenuItem({
          label: "使用整个资产",
          title: v604,
          disabled: !!v604,
          onSelect: () => {
            if (v604) {
              globalThis["window"]?.["showToast"]?.(v604, "warn");
              return;
            }
            (_insertMentionPills(v594, v601["items"], {
              triggerRange: triggerRange,
              atIndex: atIndex,
              pillToEdit: pillToEdit,
            }),
              _closeMentionMenu());
          },
        });
      (v603["appendChild"](v605),
        _appendMentionDivider(v603),
        v601["items"]["forEach"]((v606) => {
          _appendMentionCandidateItem(v603, v594, v606, {
            triggerRange: triggerRange,
            atIndex: atIndex,
            pillToEdit: pillToEdit,
          });
        }),
        v602["appendChild"](v603),
        v597["appendChild"](v602));
    }),
    (v597["style"]["display"] = "flex"),
    (v597["style"]["pointerEvents"] = "auto"),
    (v597["style"]["bottom"] = ""),
    (v597["style"]["marginTop"] = ""),
    (v597["style"]["marginBottom"] = ""),
    (v597["style"]["transformOrigin"] = ""),
    (_mentionMenuPositionState = {
      menu: v597,
      triggerRange: triggerRange,
      pillToEdit: pillToEdit,
      fallbackX: Number(v595),
      fallbackY: Number(v596),
    }),
    _positionMentionMenu(),
    (_mentionMenuState["activeMenu"] = v597),
    _setInitialMentionActiveItem(v597),
    _watchMentionViewport(),
    _bindMentionOutsideDocClick(v597),
    true
  );
}
export function _checkAtTrigger(v607, v608) {
  if (v608?.["inputType"] === "insertCompositionText") return false;
  const v609 = window["getSelection"]();
  if (!v609["rangeCount"]) return false;
  const v610 = v609["getRangeAt"](0)["cloneRange"]();
  if (v610["startContainer"]["nodeType"] !== Node["TEXT_NODE"])
    return (_closeMentionMenu(), false);
  const v611 = String(v610["startContainer"]["textContent"] || "")["slice"](
      0,
      v610["startOffset"],
    ),
    v612 = v611["lastIndexOf"]("@");
  if (v612 === -1) return (_closeMentionMenu(), false);
  const v613 = v611["slice"](v612 + 1);
  if (v613["length"] > 20) return (_closeMentionMenu(), false);
  const v614 = v610["getBoundingClientRect"]();
  return _populateMentionMenu(v607, {
    x: v614["left"],
    y: v614["bottom"] + 5,
    triggerRange: v610,
    query: v613,
    atIndex: v612,
  });
}
export function _handleMentionMenuKeyboard(v615) {
  const v616 = _getMentionMenu();
  if (v616["style"]["display"] !== "flex") return false;
  const v617 = _mentionMenuState["activeMenu"] || v616,
    v618 = _getDirectMentionItems(v617);
  if (!v618["length"]) {
    if (v615["key"] === "Escape")
      return (v615["preventDefault"](), _closeMentionMenu(), true);
    return false;
  }
  let v619 = v618["findIndex"]((v620) =>
    v620["classList"]["contains"]("active"),
  );
  if (v619 < 0) v619 = 0;
  if (v615["key"] === "ArrowDown")
    return (
      v615["preventDefault"](),
      (v619 = v619 < v618["length"] - 1 ? v619 + 1 : 0),
      _setActiveMentionItem(v618[v619]),
      v618[v619]?.["scrollIntoView"]({ block: "nearest" }),
      true
    );
  if (v615["key"] === "ArrowUp")
    return (
      v615["preventDefault"](),
      (v619 = v619 > 0 ? v619 - 1 : v618["length"] - 1),
      _setActiveMentionItem(v618[v619]),
      v618[v619]?.["scrollIntoView"]({ block: "nearest" }),
      true
    );
  if (v615["key"] === "ArrowRight") {
    v615["preventDefault"]();
    if (v619 >= 0) _openMentionSubmenu(v618[v619], { focusSubmenu: true });
    return true;
  }
  if (v615["key"] === "ArrowLeft") {
    v615["preventDefault"]();
    if (v617 !== v616 && v617["parentElement"]) {
      const v621 = v617["parentElement"],
        v622 = v621["parentElement"] || v616;
      (v621["classList"]["remove"]("at-mention-submenu-open"),
        _clearActiveItems(v622),
        v621["classList"]["add"]("active"),
        (_mentionMenuState["activeMenu"] = v622));
    }
    return true;
  }
  if (v615["key"] === "Enter") {
    v615["preventDefault"]();
    if (v619 >= 0) _activateMentionMenuItem(v618[v619]);
    return true;
  }
  if (v615["key"] === "Escape")
    return (v615["preventDefault"](), _closeMentionMenu(), true);
  return false;
}
export function _bindPromptPill(v623, v624) {
  if (!v624) return;
  v624["querySelectorAll"](".pill-del")["forEach"]((v625) => v625["remove"]());
  const v626 = _stripMentionDisplayMarker(
    String(v624["dataset"]["label"] || v624["textContent"] || "")["replace"](
      /[×✕✖]/g,
      "",
    ),
  );
  ((v624["dataset"]["label"] = v626),
    _renderMentionPillContent(v624, v626, _getMentionVisual(v623, null, v624)),
    _isUnresolvedInputMentionPill(v624) &&
      (v624["classList"]?.["add"]?.("ref-pill--unresolved"),
      (v624["title"] = "Input reference is not bound in this node.")),
    (v624["onmousedown"] = (v627) => {
      (v627["preventDefault"](), v627["stopPropagation"]());
      const v628 = v624["getBoundingClientRect"]();
      _populateMentionMenu(v623, {
        x: v628["left"],
        y: v628["bottom"] + 5,
        pillToEdit: v624,
        query: "",
        atIndex: -1,
        triggerRange: null,
      });
    }));
}
export function _rehydratePromptPills(v629) {
  if (!v629?.["promptEl"]) return;
  v629["promptEl"]["querySelectorAll"](".ref-pill")["forEach"]((v630) => {
    _bindPromptPill(v629, v630);
  });
}
const CARET_SPACER_TEXT_RE = /^[\u00A0\u200B\u200C\u200D\uFEFF]*$/;
function _isCaretSpacerTextNode(v631) {
  return !!(
    v631 &&
    v631["nodeType"] === Node["TEXT_NODE"] &&
    CARET_SPACER_TEXT_RE["test"](String(v631["textContent"] || ""))
  );
}
function _findRefPillNearNode(v632, v633) {
  let v634 = v632 || null;
  while (v634) {
    if (_isRefPillNode(v634)) return v634;
    if (!_isCaretSpacerTextNode(v634)) return null;
    v634 = v633 === "previous" ? v634["previousSibling"] : v634["nextSibling"];
  }
  return null;
}
function _getSelectedRefPill(v635) {
  const v636 = v635?.["startContainer"],
    v637 = v635?.["endContainer"];
  if (!v636 || v636 !== v637 || v636["nodeType"] !== Node["ELEMENT_NODE"])
    return null;
  if (v635["endOffset"] - v635["startOffset"] !== 1) return null;
  return _isRefPillNode(v636["childNodes"]?.[v635["startOffset"]])
    ? v636["childNodes"][v635["startOffset"]]
    : null;
}
export function _handlePillKeyboard(v638, v639) {
  if (!v638?.["promptEl"]) return false;
  if (v639["key"] !== "Backspace" && v639["key"] !== "Delete") return false;
  const v640 = window["getSelection"]();
  if (!v640["rangeCount"]) return false;
  const v641 = v640["getRangeAt"](0);
  if (!v641["collapsed"]) {
    const v642 = _getSelectedRefPill(v641);
    if (!v642) return false;
    return (
      v639["preventDefault"](),
      v642["remove"](),
      _updatePromptHtml(v638),
      true
    );
  }
  const v643 = v641["startContainer"],
    v644 = v641["startOffset"];
  let v645 = null;
  if (v643["nodeType"] === Node["TEXT_NODE"]) {
    const v646 = String(v643["textContent"] || "");
    if (
      v639["key"] === "Backspace" &&
      (v644 === 0 || CARET_SPACER_TEXT_RE["test"](v646["slice"](0, v644)))
    ) {
      v645 = _findRefPillNearNode(v643["previousSibling"], "previous");
      if (v645 && v644 > 0) v643["textContent"] = v646["slice"](v644);
    } else {
      if (
        v639["key"] === "Delete" &&
        (v644 === v646["length"] ||
          CARET_SPACER_TEXT_RE["test"](v646["slice"](v644)))
      ) {
        v645 = _findRefPillNearNode(v643["nextSibling"], "next");
        if (v645 && v644 < v646["length"])
          v643["textContent"] = v646["slice"](0, v644);
      }
    }
  } else {
    if (v643["nodeType"] === Node["ELEMENT_NODE"]) {
      if (v639["key"] === "Backspace" && v644 > 0)
        v645 = _findRefPillNearNode(v643["childNodes"][v644 - 1], "previous");
      else
        v639["key"] === "Delete" &&
          v644 < v643["childNodes"]["length"] &&
          (v645 = _findRefPillNearNode(v643["childNodes"][v644], "next"));
    }
  }
  if (_isRefPillNode(v645))
    return (
      v639["preventDefault"](),
      v645["remove"](),
      _updatePromptHtml(v638),
      true
    );
  return false;
}
export function _handlePillHover(v647, v648) {
  const v649 = v647["target"]["closest"](".ref-pill");
  if (!v649 || !v648["refBarEl"]) return;
  const v650 = v649["dataset"]["nodeId"];
  if (!v650) return;
  const v651 = v648["refBarEl"]["querySelector"](
    '.ref-thumb-wrap[data-source-id="' + v650 + "\x22]",
  );
  v651 &&
    (v651["classList"]["add"]("highlight"),
    v651["scrollIntoView"]({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    }));
}
export function _handlePillOut(v652, v653) {
  const v654 = v652["target"]["closest"](".ref-pill");
  if (!v654 || !v653["refBarEl"]) return;
  const v655 = v654["dataset"]["nodeId"];
  if (!v655) return;
  const v656 = v653["refBarEl"]["querySelector"](
    ".ref-thumb-wrap[data-source-id=\x22" + v655 + "\x22]",
  );
  v656 && v656["classList"]["remove"]("highlight");
}
export function _syncEdgesOrderFromPills(v657) {
  const v658 = Array["from"](v657["promptEl"]["querySelectorAll"](".ref-pill"));
  if (v658["length"] === 0) return;
  const v659 = appStore["getIncomingEdges"](v657["nodeId"])["filter"](
    (v660) => !v660?.["isGroupShared"] && v660?.["targetId"] === v657["nodeId"],
  );
  if (v659["length"] <= 1) return;
  const v661 = v658["map"]((v662) => v662["dataset"]["nodeId"])["filter"](
    Boolean,
  );
  if (v661["length"] === 0) return;
  const v663 = v659["map"]((v664) => v664["id"]),
    v665 = {};
  v659["forEach"]((v666) => {
    if (!v665[v666["sourceId"]]) v665[v666["sourceId"]] = [];
    v665[v666["sourceId"]]["push"](v666);
  });
  const v667 = [];
  (v661["forEach"]((v668) => {
    v665[v668]?.["length"] > 0 && v667["push"](v665[v668]["shift"]());
  }),
    Object["values"](v665)["forEach"]((v669) => v667["push"](...v669)));
  const v670 = v667["map"]((v671) => v671["id"]);
  JSON["stringify"](v663) !== JSON["stringify"](v670) &&
    ((v657["_isDraggingSorting"] = false),
    appStore["updateEdgesBatch"](v663, v667));
}
export function _syncPillLabels(v672, v673) {
  if (!v672["promptEl"]) return;
  const v674 = v672["promptEl"]["querySelectorAll"](".ref-pill");
  if (!v674["length"]) return;
  let v675 = false;
  (v674["forEach"]((v676) => {
    if (_isAssetMentionPill(v676)) return;
    const v677 = v676["dataset"]["nodeId"];
    if (!v677) return;
    if (v673[v677]) {
      const v678 = _stripMentionDisplayMarker(v673[v677]),
        v679 = v676["querySelector"]?.(".ref-pill-label"),
        v680 = String(
          v676["dataset"]["label"] ||
            v679?.["textContent"] ||
            v676["textContent"] ||
            "",
        )["trim"](),
        v681 = _getMentionVisual(v672, null, v676),
        v682 =
          v680 !== v678 ||
          !v676["querySelector"]?.(".ref-pill-label") ||
          !_isPillVisualCurrent(v676, v681) ||
          !!v676["querySelector"]?.(".pill-del");
      v682 &&
        ((v676["dataset"]["label"] = v678),
        _renderMentionPillContent(v676, v678, v681),
        (v675 = true));
    } else (v676["remove"](), (v675 = true));
  }),
    v675 && _updatePromptHtml(v672, { renderRefBar: false }));
}

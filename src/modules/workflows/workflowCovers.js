import { localPathToUrl } from "../../utils/localMediaPath.js";
import { calcWorkflowBounds } from "./workflowCanvas.js";
export const DEFAULT_WORKFLOW_COVER_ID = "__workflow_default_cover__";
export const WORKFLOW_SNAPSHOT_COVER_ID = "__workflow_snapshot_cover__";
const SNAPSHOT_WIDTH = 640,
  SNAPSHOT_HEIGHT = 360,
  SNAPSHOT_FRAME = { x: 42, y: 74, width: 556, height: 244, padding: 28 },
  SNAPSHOT_MAX_NODES = 24,
  CSS_CUSTOM_PROPERTY_RE = /^var\(\s*(--[\w-]+)(?:\s*,\s*(.+))?\s*\)$/,
  CSS_TOKEN_OPACITY_RE = /^(--[\w-]+)-(\d{2})$/,
  CSS_RGBA_FUNCTION = "rgba",
  SNAPSHOT_COLOR_TOKENS = Object["freeze"]({
    accentVideo: "--indigo-text",
    accentAudio: "--green",
    accentText: "--gold-text",
    accentImage: "--blue",
    accentMask: "--purple-bright",
    accentGroup: "--gold",
    accentDefault: "--group-slate",
    edge: "--edge-draft-stroke",
    nodeFill: "--bg-node",
    nodeStroke: "--stroke-14",
    nodeText: "--text-strong",
    nodeContentFill: "--bg-panel-dark",
    nodeTypeText: "--text-secondary",
    gridDot: "--stroke-08",
    shadow: "--black",
    frameGlowStart: "--gold-text",
    frameGlowEnd: "--gold",
    background: "--bg",
    titleText: "--text-strong",
    toolbarFill: "--surface-panel",
    toolbarStroke: "--stroke-14",
    toolbarIcon: "--text-secondary",
    toolbarDotFill: "--gold-text",
    toolbarDotStroke: "--gold",
    frameFill: "--surface-float",
    frameInnerStroke: "--gold-text",
    summaryText: "--text-secondary",
  }),
  SNAPSHOT_COLOR_FALLBACKS = Object["freeze"]({
    accentVideo: [124, 141, 246],
    accentAudio: [52, 194, 168],
    accentText: [240, 185, 74],
    accentImage: [94, 161, 255],
    accentMask: [214, 119, 255],
    accentGroup: [219, 143, 22],
    accentDefault: [139, 149, 167],
    edge: [104, 113, 129],
    nodeFill: [31, 35, 43],
    nodeStroke: [66, 74, 87],
    nodeText: [215, 220, 231],
    nodeContentFill: [17, 21, 27],
    nodeTypeText: [142, 151, 166],
    gridDot: [42, 48, 58],
    shadow: [0, 0, 0],
    frameGlowStart: [240, 165, 29],
    frameGlowEnd: [185, 110, 16],
    background: [16, 20, 27],
    titleText: [237, 241, 247],
    toolbarFill: [22, 26, 34],
    toolbarStroke: [48, 56, 70],
    toolbarIcon: [170, 178, 192],
    toolbarDotFill: [241, 167, 39],
    toolbarDotStroke: [138, 92, 16],
    frameFill: [23, 26, 31],
    frameInnerStroke: [244, 178, 59],
    summaryText: [141, 150, 166],
  }),
  CSS_TOKEN_COLOR_FALLBACKS = Object["freeze"]({
    "--indigo": [99, 102, 241],
    "--green": [16, 185, 129],
    "--gold": [245, 158, 11],
    "--red": [239, 68, 68],
    "--purple": [139, 92, 246],
    "--group-pink": [236, 72, 153],
    "--group-slate": [100, 116, 139],
    "--cyan": [6, 182, 212],
  });
function cleanText(v0) {
  return String(v0 ?? "")["trim"]();
}
function rgbToSvgColor(v1, v2, v3) {
  return (
    "#" +
    [v1, v2, v3]
      ["map"]((v4) =>
        Math["max"](0, Math["min"](255, Number(v4) || 0))
          ["toString"](16)
          ["padStart"](2, "0"),
      )
      ["join"]("")
  );
}
function fallbackSnapshotColor(v5) {
  return rgbToSvgColor(
    ...(SNAPSHOT_COLOR_FALLBACKS[v5] ||
      SNAPSHOT_COLOR_FALLBACKS["accentDefault"]),
  );
}
function fallbackCssTokenColor(v6) {
  const v7 = cleanText(v6),
    v8 = CSS_TOKEN_COLOR_FALLBACKS[v7];
  if (v8) return rgbToSvgColor(...v8);
  const v9 = v7["match"](CSS_TOKEN_OPACITY_RE);
  if (!v9) return "";
  const v10 = CSS_TOKEN_COLOR_FALLBACKS[v9[1]];
  if (!v10) return "";
  const v11 = Math["max"](0, Math["min"](100, Number(v9[2]) || 0)) / 100;
  return (
    CSS_RGBA_FUNCTION +
    "(" +
    v10[0] +
    ",\x20" +
    v10[1] +
    ",\x20" +
    v10[2] +
    ",\x20" +
    v11 +
    ")"
  );
}
function getRootComputedStyle() {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function")
    return null;
  return getComputedStyle(document["documentElement"]);
}
function resolveCssCustomProperty(v12, v13, v14 = new Set()) {
  const v15 = cleanText(v12);
  if (!v15 || !v13 || v14["has"](v15)) return "";
  v14["add"](v15);
  const v16 = cleanText(v13["getPropertyValue"](v15));
  if (!v16) return "";
  const v17 = v16["match"](CSS_CUSTOM_PROPERTY_RE);
  if (!v17) return v16;
  return resolveCssCustomProperty(v17[1], v13, v14) || cleanText(v17[2]);
}
function snapshotColor(v18) {
  const v19 = fallbackSnapshotColor(v18),
    v20 = SNAPSHOT_COLOR_TOKENS[v18],
    v21 = getRootComputedStyle();
  return resolveCssCustomProperty(v20, v21) || v19;
}
function resolveSnapshotColorValue(
  v22,
  v23 = "accentDefault",
  v24 = new Set(),
) {
  const v25 = cleanText(v22);
  if (!v25) return snapshotColor(v23);
  const v26 = v25["match"](CSS_CUSTOM_PROPERTY_RE);
  if (!v26) return v25;
  const v27 = v26[1];
  if (v24["has"](v27)) return fallbackSnapshotColor(v23);
  v24["add"](v27);
  const v28 = resolveCssCustomProperty(v27, getRootComputedStyle());
  if (v28) return resolveSnapshotColorValue(v28, v23, v24);
  const v29 = cleanText(v26[2]);
  if (v29) return resolveSnapshotColorValue(v29, v23, v24);
  return fallbackCssTokenColor(v27) || fallbackSnapshotColor(v23);
}
function withOpacityToken(v30, v31) {
  const v32 = cleanText(v30)["match"](/^var\(\s*(--[\w-]+)\s*\)$/);
  if (!v32) return v30;
  return "var(" + v32[1] + "-" + v31 + ")";
}
function normalizeNodeList(v33) {
  return Array["isArray"](v33)
    ? v33
    : v33 && typeof v33 === "object"
      ? Object["values"](v33)
      : [];
}
function normalizeEdgeList(v34) {
  return Array["isArray"](v34)
    ? v34
    : v34 && typeof v34 === "object"
      ? Object["values"](v34)
      : [];
}
function escapeSvgText(v35) {
  return cleanText(v35)
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;");
}
function truncateSvgText(v36, v37 = 10) {
  const v38 = cleanText(v36);
  if (v38["length"] <= v37) return v38;
  return v38["slice"](0, v37 - 1) + "…";
}
function edgeSourceId(v39) {
  return cleanText(v39?.["sourceId"] ?? v39?.["source"]);
}
function edgeTargetId(v40) {
  return cleanText(v40?.["targetId"] ?? v40?.["target"]);
}
function nodeTypeKey(v41) {
  return cleanText(v41?.["type"])["toLowerCase"]();
}
function isGroupNode(v42) {
  return nodeTypeKey(v42) === "group";
}
function nodeSize(v43) {
  return {
    width: Math["max"](24, Number(v43?.["width"] ?? v43?.["w"]) || 100),
    height: Math["max"](24, Number(v43?.["height"] ?? v43?.["h"]) || 100),
  };
}
function nodePosition(v44) {
  return { x: Number(v44?.["x"]) || 0, y: Number(v44?.["y"]) || 0 };
}
function pickSnapshotTitle(v45, v46 = {}) {
  const v47 = cleanText(v46["title"] || v46["name"]);
  if (v47) return v47;
  const v48 = v45["find"](
    (v49) => isGroupNode(v49) && !cleanText(v49?.["parentId"]),
  );
  return (
    cleanText(v48?.["name"] || v48?.["title"] || v48?.["label"]) || "工作流"
  );
}
function pickSnapshotGroupColor(v50, v51 = {}) {
  const v52 = cleanText(
    v51["groupColor"] || v51["accentColor"] || v51["color"],
  );
  if (v52) return v52;
  const v53 = v50["find"](
    (v54) => isGroupNode(v54) && !cleanText(v54?.["parentId"]),
  );
  return cleanText(v53?.["color"]);
}
function createSnapshotTheme(v55, v56 = {}) {
  const v57 = pickSnapshotGroupColor(v55, v56);
  if (!v57)
    return {
      frameGlowStart: snapshotColor("frameGlowStart"),
      frameGlowEnd: snapshotColor("frameGlowEnd"),
      frameInnerStroke: snapshotColor("frameInnerStroke"),
      toolbarDotFill: snapshotColor("toolbarDotFill"),
      toolbarDotStroke: snapshotColor("toolbarDotStroke"),
      groupAccent: snapshotColor("accentGroup"),
    };
  const v58 = resolveSnapshotColorValue(v57, "accentGroup"),
    v59 = resolveSnapshotColorValue(
      withOpacityToken(v57, "60"),
      "frameGlowEnd",
    );
  return {
    frameGlowStart: v58,
    frameGlowEnd: v59,
    frameInnerStroke: v58,
    toolbarDotFill: v58,
    toolbarDotStroke: v59,
    groupAccent: v58,
  };
}
function pickNodeLabel(v60) {
  return (
    cleanText(v60?.["name"] || v60?.["title"] || v60?.["label"]) ||
    pickNodeTypeLabel(v60) ||
    "节点"
  );
}
function pickNodeTypeLabel(v61) {
  const v62 = nodeTypeKey(v61);
  if (v62["includes"]("video")) return "视频";
  if (v62["includes"]("audio")) return "音频";
  if (v62["includes"]("image") || v62["includes"]("photo")) return "图像";
  if (v62["includes"]("text") || v62["includes"]("prompt")) return "文本";
  if (v62["includes"]("mask")) return "遮罩";
  if (v62["includes"]("group")) return "组";
  return "节点";
}
function pickNodeAccent(v63, v64 = null) {
  const v65 = nodeTypeKey(v63);
  if (v65["includes"]("video")) return snapshotColor("accentVideo");
  if (v65["includes"]("audio")) return snapshotColor("accentAudio");
  if (v65["includes"]("text") || v65["includes"]("prompt"))
    return snapshotColor("accentText");
  if (v65["includes"]("image") || v65["includes"]("photo"))
    return snapshotColor("accentImage");
  if (v65["includes"]("mask")) return snapshotColor("accentMask");
  if (v65["includes"]("group"))
    return cleanText(v63?.["color"])
      ? resolveSnapshotColorValue(v63["color"], "accentGroup")
      : v64?.["groupAccent"] || snapshotColor("accentGroup");
  return snapshotColor("accentDefault");
}
function projectNode(v66, v67, v68, v69) {
  const v70 = nodePosition(v66),
    v71 = nodeSize(v66),
    v72 = v69["x"] + (v70["x"] - v67["minX"]) * v68,
    v73 = v69["y"] + (v70["y"] - v67["minY"]) * v68,
    v74 = v71["width"] * v68,
    v75 = v71["height"] * v68,
    v76 = Math["max"](48, v74),
    v77 = Math["max"](34, v75);
  return {
    x: v72 - (v76 - v74) / 2,
    y: v73 - (v77 - v75) / 2,
    width: v76,
    height: v77,
    cx: v72 + v74 / 2,
    cy: v73 + v75 / 2,
  };
}
function renderSnapshotEdges(v78, v79) {
  const v80 = [];
  for (const v81 of v78) {
    const v82 = v79["get"](edgeSourceId(v81)),
      v83 = v79["get"](edgeTargetId(v81));
    if (!v82 || !v83) continue;
    const v84 = v82["x"] + v82["width"],
      v85 = v82["y"] + v82["height"] / 2,
      v86 = v83["x"],
      v87 = v83["y"] + v83["height"] / 2,
      v88 = Math["max"](34, Math["abs"](v86 - v84) * 0.45);
    v80["push"](
      '<path d="M ' +
        v84["toFixed"](1) +
        "\x20" +
        v85["toFixed"](1) +
        "\x20C\x20" +
        (v84 + v88)["toFixed"](1) +
        "\x20" +
        v85["toFixed"](1) +
        ",\x20" +
        (v86 - v88)["toFixed"](1) +
        "\x20" +
        v87["toFixed"](1) +
        ",\x20" +
        v86["toFixed"](1) +
        "\x20" +
        v87["toFixed"](1) +
        '" fill="none" stroke="' +
        snapshotColor("edge") +
        '" stroke-width="2.2" stroke-linecap="round" opacity="0.72"/>',
    );
  }
  return v80["join"]("");
}
function renderSnapshotNodes(v89, v90, v91 = null) {
  return v89["map"]((v92) => {
    const v93 = cleanText(v92?.["id"]),
      v94 = v90["get"](v93);
    if (!v94) return "";
    const v95 = escapeSvgText(
        truncateSvgText(pickNodeLabel(v92), v94["width"] > 92 ? 12 : 8),
      ),
      v96 = escapeSvgText(pickNodeTypeLabel(v92)),
      v97 = pickNodeAccent(v92, v91),
      v98 = v94["y"] + 27,
      v99 = Math["max"](8, v94["height"] - 37);
    return [
      '<g filter="url(#nodeShadow)">',
      '<rect x="' +
        v94["x"]["toFixed"](1) +
        '" y="' +
        v94["y"]["toFixed"](1) +
        '" width="' +
        v94["width"]["toFixed"](1) +
        '" height="' +
        v94["height"]["toFixed"](1) +
        "\x22\x20rx=\x2210\x22\x20fill=\x22" +
        snapshotColor("nodeFill") +
        '" stroke="' +
        snapshotColor("nodeStroke") +
        '" stroke-width="1"/>',
      "<rect\x20x=\x22" +
        (v94["x"] + 1)["toFixed"](1) +
        "\x22\x20y=\x22" +
        (v94["y"] + 1)["toFixed"](1) +
        '" width="' +
        (v94["width"] - 2)["toFixed"](1) +
        '" height="6" rx="5" fill="' +
        v97 +
        "\x22/>",
      '<text x="' +
        (v94["x"] + 12)["toFixed"](1) +
        '" y="' +
        (v94["y"] + 22)["toFixed"](1) +
        '" fill="' +
        snapshotColor("nodeText") +
        '" font-size="12" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="700">' +
        v95 +
        "</text>",
      '<rect x="' +
        (v94["x"] + 12)["toFixed"](1) +
        '" y="' +
        v98["toFixed"](1) +
        '" width="' +
        Math["max"](10, v94["width"] - 24)["toFixed"](1) +
        '" height="' +
        v99["toFixed"](1) +
        '" rx="7" fill="' +
        snapshotColor("nodeContentFill") +
        "\x22\x20opacity=\x220.76\x22/>",
      v94["width"] >= 70 && v94["height"] >= 54
        ? '<text x="' +
          (v94["x"] + 17)["toFixed"](1) +
          '" y="' +
          (v98 + 19)["toFixed"](1) +
          "\x22\x20fill=\x22" +
          snapshotColor("nodeTypeText") +
          '" font-size="10" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif">' +
          v96 +
          "</text>"
        : "",
      "</g>",
    ]["join"]("");
  })["join"]("");
}
function createWorkflowSnapshotSvg(v100, v101 = {}) {
  const v102 = normalizeNodeList(v100?.["nodes"])["filter"](Boolean);
  if (v102["length"] === 0) return "";
  const v103 = createSnapshotTheme(v102, v101),
    v104 = normalizeEdgeList(v100?.["edges"]),
    v105 = calcWorkflowBounds(v102);
  if (!v105["width"] && !v105["height"]) return "";
  const v106 = v102["filter"]((v107) => !isGroupNode(v107)),
    v108 = (v106["length"] > 0 ? v106 : v102)["slice"](0, SNAPSHOT_MAX_NODES),
    v109 = new Set(
      v108["map"]((v110) => cleanText(v110?.["id"]))["filter"](Boolean),
    ),
    v111 = v104["filter"](
      (v112) =>
        v109["has"](edgeSourceId(v112)) && v109["has"](edgeTargetId(v112)),
    ),
    v113 = SNAPSHOT_FRAME["width"] - SNAPSHOT_FRAME["padding"] * 2,
    v114 = SNAPSHOT_FRAME["height"] - SNAPSHOT_FRAME["padding"] * 2,
    v115 = Math["min"](
      v113 / Math["max"](v105["width"], 1),
      v114 / Math["max"](v105["height"], 1),
      1.45,
    ),
    v116 = v105["width"] * v115,
    v117 = v105["height"] * v115,
    v118 = {
      x: SNAPSHOT_FRAME["x"] + SNAPSHOT_FRAME["padding"] + (v113 - v116) / 2,
      y: SNAPSHOT_FRAME["y"] + SNAPSHOT_FRAME["padding"] + (v114 - v117) / 2,
    },
    v119 = new Map();
  for (const v120 of v108) {
    const v121 = cleanText(v120?.["id"]);
    if (!v121) continue;
    v119["set"](v121, projectNode(v120, v105, v115, v118));
  }
  const v122 = escapeSvgText(
      truncateSvgText(pickSnapshotTitle(v102, v101), 18),
    ),
    v123 = v102["length"] + "\x20节点\x20·\x20" + v104["length"] + " 连线";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    SNAPSHOT_WIDTH +
    '" height="' +
    SNAPSHOT_HEIGHT +
    '" viewBox="0 0 ' +
    SNAPSHOT_WIDTH +
    "\x20" +
    SNAPSHOT_HEIGHT +
    '" role="img" aria-label="workflow snapshot">\n<defs>\n  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">\n    <circle cx="2" cy="2" r="1.2" fill="' +
    snapshotColor("gridDot") +
    '" opacity="0.72"/>\n  </pattern>\n  <filter id="nodeShadow" x="-16%" y="-20%" width="132%" height="140%">\n    <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="' +
    snapshotColor("shadow") +
    "\x22\x20flood-opacity=\x220.25\x22/>\x0a\x20\x20</filter>\x0a\x20\x20<linearGradient\x20id=\x22frameGlow\x22\x20x1=\x220\x22\x20x2=\x221\x22\x20y1=\x220\x22\x20y2=\x221\x22>\x0a\x20\x20\x20\x20<stop\x20offset=\x220\x22\x20stop-color=\x22" +
    v103["frameGlowStart"] +
    '"/>\n    <stop offset="1" stop-color="' +
    v103["frameGlowEnd"] +
    "\x22/>\x0a\x20\x20</linearGradient>\x0a</defs>\x0a<rect\x20width=\x22" +
    SNAPSHOT_WIDTH +
    '" height="' +
    SNAPSHOT_HEIGHT +
    '" fill="' +
    snapshotColor("background") +
    "\x22/>\x0a<rect\x20width=\x22" +
    SNAPSHOT_WIDTH +
    '" height="' +
    SNAPSHOT_HEIGHT +
    '" fill="url(#grid)"/>\n<text x="52" y="48" fill="' +
    snapshotColor("titleText") +
    '" font-size="28" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-weight="800">' +
    v122 +
    "</text>\x0a<g\x20opacity=\x220.92\x22>\x0a\x20\x20<rect\x20x=\x22252\x22\x20y=\x2228\x22\x20width=\x22136\x22\x20height=\x2244\x22\x20rx=\x2214\x22\x20fill=\x22" +
    snapshotColor("toolbarFill") +
    '" stroke="' +
    snapshotColor("toolbarStroke") +
    '" stroke-width="1.2"/>\n  <path d="M 280 42 L 280 58 L 294 50 Z" fill="none" stroke="' +
    snapshotColor("toolbarIcon") +
    "\x22\x20stroke-width=\x222\x22\x20stroke-linejoin=\x22round\x22/>\x0a\x20\x20<circle\x20cx=\x22320\x22\x20cy=\x2250\x22\x20r=\x229\x22\x20fill=\x22" +
    v103["toolbarDotFill"] +
    '" stroke="' +
    v103["toolbarDotStroke"] +
    '" stroke-width="2"/>\n  <rect x="352" y="41" width="18" height="18" rx="2" fill="none" stroke="' +
    snapshotColor("toolbarIcon") +
    '" stroke-width="2"/>\n</g>\n<rect x="' +
    SNAPSHOT_FRAME["x"] +
    "\x22\x20y=\x22" +
    SNAPSHOT_FRAME["y"] +
    '" width="' +
    SNAPSHOT_FRAME["width"] +
    "\x22\x20height=\x22" +
    SNAPSHOT_FRAME["height"] +
    '" rx="18" fill="' +
    snapshotColor("frameFill") +
    '" fill-opacity="0.9" stroke="url(#frameGlow)" stroke-width="8"/>\n<rect x="' +
    (SNAPSHOT_FRAME["x"] + 6) +
    '" y="' +
    (SNAPSHOT_FRAME["y"] + 6) +
    '" width="' +
    (SNAPSHOT_FRAME["width"] - 12) +
    '" height="' +
    (SNAPSHOT_FRAME["height"] - 12) +
    '" rx="13" fill="none" stroke="' +
    v103["frameInnerStroke"] +
    '" stroke-width="1" opacity="0.9"/>\n<text x="' +
    (SNAPSHOT_FRAME["x"] + 26) +
    '" y="' +
    (SNAPSHOT_FRAME["y"] + 34) +
    '" fill="' +
    snapshotColor("summaryText") +
    "\x22\x20font-size=\x2215\x22\x20font-family=\x22system-ui,\x20-apple-system,\x20BlinkMacSystemFont,\x20sans-serif\x22\x20font-weight=\x22700\x22>" +
    escapeSvgText(v123) +
    "</text>\n<g>" +
    renderSnapshotEdges(v111, v119) +
    renderSnapshotNodes(v108, v119, v103) +
    "</g>\n</svg>"
  );
}
export function createWorkflowSnapshotCoverDataUrl(v124, v125 = {}) {
  const v126 = createWorkflowSnapshotSvg(v124, v125);
  if (!v126) return "";
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(v126);
}
export function createWorkflowSnapshotCoverCandidate(v127, v128 = {}) {
  const v129 = createWorkflowSnapshotCoverDataUrl(v127, v128);
  if (!v129) return null;
  return {
    id: WORKFLOW_SNAPSHOT_COVER_ID,
    src: v129,
    nodeId: "",
    label: cleanText(v128["label"]) || "工作流快照",
  };
}
function normalizePath(v130) {
  const v131 = cleanText(v130);
  if (!v131) return "";
  if (
    v131["startsWith"]("/") ||
    v131["startsWith"]("data:") ||
    v131["startsWith"]("blob:") ||
    /^https?:\/\//i["test"](v131)
  )
    return v131;
  const v132 = localPathToUrl(v131);
  return v132 || "/" + v131["replace"](/^\/+/, "");
}
function pickMediaSrc(v133) {
  if (!v133 || typeof v133 !== "object") return "";
  return normalizePath(
    v133["localPath"] ||
      v133["thumbLocalPath"] ||
      v133["thumbUrl"] ||
      v133["coverUrl"] ||
      v133["poster"] ||
      v133["imageUrl"] ||
      v133["src"] ||
      v133["url"],
  );
}
function pickArrayMediaSrc(v134, v135, v136) {
  const v137 = Array["isArray"](v134?.[v135]) ? v134[v135] : [];
  if (v137["length"] === 0) return "";
  const v138 = Number(v134?.[v136]),
    v139 = Number["isInteger"](v138) && v138 >= 0 ? v137[v138] : null;
  return pickMediaSrc(v139) || pickMediaSrc(v137[0]);
}
function getCoverCandidatePriority(v140) {
  const v141 = cleanText(v140?.["type"])["toLowerCase"](),
    v142 = [
      v141,
      cleanText(v140?.["name"]),
      cleanText(v140?.["title"]),
      cleanText(v140?.["label"]),
    ]
      ["join"]("\x20")
      ["toLowerCase"]();
  if (
    v141["startsWith"]("ai-") ||
    v141["includes"]("result") ||
    v142["includes"]("输出") ||
    v142["includes"]("生成")
  )
    return 0;
  if (
    v141["startsWith"]("source-") ||
    v142["includes"]("输入") ||
    v142["includes"]("参考")
  )
    return 1;
  return 2;
}
export function resolveWorkflowNodeThumbSrc(v143) {
  if (!v143 || typeof v143 !== "object") return "";
  return (
    normalizePath(
      v143["localPath"] ||
        v143["thumbLocalPath"] ||
        v143["thumbUrl"] ||
        v143["coverUrl"] ||
        v143["thumbnailUrl"] ||
        v143["thumbnail"] ||
        v143["poster"] ||
        v143["src"] ||
        v143["imageUrl"],
    ) ||
    pickArrayMediaSrc(v143, "images", "mainImageIndex") ||
    pickArrayMediaSrc(v143, "videos", "mainVideoIndex")
  );
}
export function extractWorkflowCoverCandidates(v144) {
  const v145 = normalizeNodeList(v144),
    v146 = new Set(),
    v147 = [];
  for (const v148 of v145) {
    const v149 = resolveWorkflowNodeThumbSrc(v148);
    if (!v149 || v146["has"](v149)) continue;
    (v146["add"](v149),
      v147["push"]({
        id: "cover-" + (v147["length"] + 1),
        src: v149,
        nodeId: cleanText(v148?.["id"]),
        label: cleanText(v148?.["name"]) || "节点 " + (v147["length"] + 1),
        priority: getCoverCandidatePriority(v148),
        order: v147["length"],
      }));
  }
  return v147["sort"](
    (v150, v151) =>
      v150["priority"] - v151["priority"] || v150["order"] - v151["order"],
  )["map"](({ priority: v152, order: v153, ...v154 }) => v154);
}
export function getDefaultWorkflowCoverCandidate() {
  return {
    id: DEFAULT_WORKFLOW_COVER_ID,
    src: "",
    nodeId: "",
    label: "RedAI-Canvas",
  };
}
export function isDataImageCover(v155) {
  return cleanText(v155)["startsWith"]("data:image/");
}
export function isSvgDataImageCover(v156) {
  return /^data:image\/svg\+xml(?:[;,]|$)/i["test"](cleanText(v156));
}

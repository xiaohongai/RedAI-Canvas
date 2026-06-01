import { resolveWorkflowNodeThumbSrc } from "./workflowCovers.js";
function cleanText(v0) {
  return String(v0 ?? "")["trim"]();
}
function toArray(v1) {
  if (Array["isArray"](v1)) return v1;
  if (v1 && typeof v1 === "object") return Object["values"](v1);
  return [];
}
function stripRichText(v2) {
  return String(v2 ?? "")
    ["replace"](/<br\s*\/?>/gi, "\x20")
    ["replace"](/<\/p>/gi, "\x20")
    ["replace"](/<[^>]*>/g, "\x20")
    ["replace"](/&nbsp;/gi, "\x20")
    ["replace"](/\s+/g, "\x20")
    ["trim"]();
}
function truncateText(v3, v4 = 88) {
  const v5 = cleanText(v3);
  if (!v5 || v5["length"] <= v4) return v5;
  return v5["slice"](0, Math["max"](0, v4 - 1)) + "…";
}
const NODE_TYPE_LABELS = {
  group: "节点组",
  text: "文本",
  "source-text": "文本",
  "ai-text": "AI\x20文本",
  image: "图片",
  "source-image": "图片",
  "ai-image": "AI 图片",
  video: "视频",
  "source-video": "视频",
  "ai-video": "AI 视频",
  audio: "音频",
  "source-audio": "音频",
  "ai-audio": "AI 音频",
  comment: "备注",
  note: "备注",
  "comment-note": "备注",
  debug: "调试",
  storyboard: "分镜",
  "storyboard-script": "分镜脚本",
  "scene-detection": "场景",
  "panorama-scene": "3D导演台",
  "panorama-360": "360全景图",
};
export function getWorkflowNodeTypeLabel(v6) {
  const v7 = cleanText(v6)["toLowerCase"]();
  if (!v7) return "节点";
  return NODE_TYPE_LABELS[v7] || v7;
}
function getWorkflowNodePlaceholderLabel(v8) {
  return getWorkflowNodeTypeLabel(v8)["replace"](/^AI\s+/i, "") || "节点";
}
function getWorkflowNodeTitle(v9) {
  return (
    cleanText(v9?.["name"]) ||
    cleanText(v9?.["title"]) ||
    cleanText(v9?.["fileName"]) ||
    cleanText(v9?.["label"]) ||
    getWorkflowNodeTypeLabel(v9?.["type"])
  );
}
function getWorkflowTagForNode(v10) {
  const v11 = cleanText(v10?.["type"])["toLowerCase"](),
    v12 = [
      v11,
      cleanText(v10?.["name"]),
      cleanText(v10?.["title"]),
      cleanText(v10?.["label"]),
      cleanText(v10?.["description"]),
    ]
      ["join"]("\x20")
      ["toLowerCase"]();
  if (
    v12["includes"]("matting") ||
    v12["includes"]("keying") ||
    v12["includes"]("抠图")
  )
    return "抠图";
  if (v11["includes"]("storyboard")) return "分镜";
  if (v11["includes"]("panorama") || v12["includes"]("3d")) return "3D";
  if (v11["includes"]("scene")) return "场景";
  if (v11["includes"]("video")) return "视频";
  if (v11["includes"]("audio")) return "音频";
  if (v11["includes"]("image") || v11 === "photo") return "图片";
  if (
    v11["includes"]("text") ||
    v11["includes"]("comment") ||
    v11["includes"]("note")
  )
    return "文本";
  return "";
}
function countByTypeLabel(v13) {
  const v14 = new Map();
  for (const v15 of v13) {
    const v16 = getWorkflowNodeTypeLabel(v15?.["type"]);
    v14["set"](v16, (v14["get"](v16) || 0) + 1);
  }
  return [...v14["entries"]()]
    ["map"](([v17, v18]) => ({ label: v17, count: v18 }))
    [
      "sort"
    ]((v19, v20) => v20["count"] - v19["count"] || v19["label"]["localeCompare"](v20["label"], "zh-CN"));
}
function buildSuggestedTags(v21, v22 = 5) {
  const v23 = [],
    v24 = new Set();
  for (const v25 of v21) {
    const v26 = getWorkflowTagForNode(v25);
    if (!v26 || v24["has"](v26)) continue;
    (v24["add"](v26), v23["push"](v26));
    if (v23["length"] >= v22) break;
  }
  return v23;
}
function appendWorkflowSuffix(v27) {
  const v28 = cleanText(v27);
  if (!v28) return "";
  if (/工作流|流程|模板/u["test"](v28)) return v28;
  return v28 + "工作流";
}
function buildSuggestedName(v29, v30, v31 = {}) {
  const v32 = appendWorkflowSuffix(v31["sourceName"]);
  if (v32) return truncateText(v32, 50);
  const v33 = v29["find"]((v34) => {
      const v35 = getWorkflowNodeTitle(v34),
        v36 = getWorkflowNodeTypeLabel(v34?.["type"]);
      return (
        v35 &&
        v35 !== v36 &&
        cleanText(v34?.["type"])["toLowerCase"]() !== "group"
      );
    }),
    v37 = appendWorkflowSuffix(getWorkflowNodeTitle(v33));
  if (v37) return truncateText(v37, 50);
  if (Array["isArray"](v30) && v30["length"] > 0)
    return truncateText(v30["slice"](0, 2)["join"]("") + "流程", 50);
  if (v29["length"] > 0) return v29["length"] + "节点流程";
  return "画布工作流";
}
function getWorkflowNodeSummary(v38) {
  const v39 = [
    v38?.["content"],
    v38?.["text"],
    v38?.["prompt"],
    v38?.["outputText"],
    v38?.["description"],
    v38?.["caption"],
    v38?.["subtitle"],
    v38?.["note"],
  ];
  for (const v40 of v39) {
    const v41 = truncateText(stripRichText(v40));
    if (v41) return v41;
  }
  if (resolveWorkflowNodeThumbSrc(v38))
    return "已包含" + getWorkflowNodePlaceholderLabel(v38?.["type"]) + "内容";
  return "";
}
export function buildWorkflowContentPreviewItems(v42) {
  const v43 = toArray(v42?.["workflowData"]?.["nodes"]),
    v44 = v43["some"](
      (v45) => cleanText(v45?.["type"])["toLowerCase"]() !== "group",
    )
      ? v43["filter"](
          (v46) => cleanText(v46?.["type"])["toLowerCase"]() !== "group",
        )
      : v43;
  return v44["filter"]((v47) => v47 && typeof v47 === "object")
    ["sort"]((v48, v49) => {
      const v50 = Number(v48?.["y"]) || 0,
        v51 = Number(v49?.["y"]) || 0;
      if (v50 !== v51) return v50 - v51;
      const v52 = Number(v48?.["x"]) || 0,
        v53 = Number(v49?.["x"]) || 0;
      return v52 - v53;
    })
    ["map"]((v54, v55) => {
      const v56 = getWorkflowNodeTypeLabel(v54?.["type"]);
      return {
        id:
          cleanText(v54?.["id"]) ||
          (cleanText(v54?.["type"]) || "node") + "-" + (v55 + 1),
        typeLabel: v56,
        placeholderLabel: getWorkflowNodePlaceholderLabel(v54?.["type"]),
        title: truncateText(getWorkflowNodeTitle(v54), 40),
        summary: getWorkflowNodeSummary(v54),
        thumbSrc: resolveWorkflowNodeThumbSrc(v54),
      };
    });
}
export function buildWorkflowSourceSummary(v57, v58 = {}) {
  const v59 =
      v57?.["workflowData"] && typeof v57["workflowData"] === "object"
        ? v57["workflowData"]
        : v57 || {},
    v60 = toArray(v59["nodes"]),
    v61 = v60["some"](
      (v62) => cleanText(v62?.["type"])["toLowerCase"]() !== "group",
    )
      ? v60["filter"](
          (v63) => cleanText(v63?.["type"])["toLowerCase"]() !== "group",
        )
      : v60,
    v64 = Array["isArray"](v59["edges"]) ? v59["edges"] : [],
    v65 = countByTypeLabel(v61),
    v66 = buildSuggestedTags(v61),
    v67 =
      cleanText(v58["sourceLabel"]) ||
      (v58["sourceGroupId"] ? "当前节点组" : "整个画布"),
    v68 = cleanText(v58["sourceName"]),
    v69 = buildWorkflowContentPreviewItems({ workflowData: v59 });
  return {
    sourceLabel: v67,
    sourceName: v68,
    sourceGroupId: cleanText(v58["sourceGroupId"]),
    nodeCount: v60["length"],
    contentNodeCount: v61["length"],
    edgeCount: v64["length"],
    isEmpty: v60["length"] === 0,
    typeCounts: v65,
    typeSummary: v65["map"]((v70) => v70["label"] + "\x20" + v70["count"])[
      "join"
    ](" · "),
    previewItems: v69,
    suggestedName: buildSuggestedName(v61, v66, { sourceName: v68 }),
    suggestedTags: v66,
  };
}

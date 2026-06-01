import appStore from "../core/stores/appStore.js";
const EXECUTABLE_NODE_TYPES = new Set([
  "ai-text",
  "ai-image",
  "ai-video",
  "ai-audio",
]);
function toNodeList(v0) {
  if (!v0 || typeof v0 !== "object") return [];
  return Object["values"](v0)["filter"]((v1) => v1 && typeof v1 === "object");
}
function isExecutableNode(v2) {
  return EXECUTABLE_NODE_TYPES["has"](String(v2?.["type"] || ""));
}
function compareCanvasOrder(v3, v4) {
  const v5 = Number(v3?.["y"]) || 0,
    v6 = Number(v4?.["y"]) || 0;
  if (v5 !== v6) return v5 - v6;
  const v7 = Number(v3?.["x"]) || 0,
    v8 = Number(v4?.["x"]) || 0;
  if (v7 !== v8) return v7 - v8;
  return String(v3?.["id"] || "")["localeCompare"](String(v4?.["id"] || ""));
}
export function collectGroupExecutableNodeIds(v9, v10) {
  const v11 = String(v10 || "")["trim"]();
  if (!v11) return [];
  const v12 = toNodeList(v9),
    v13 = new Map();
  for (const v14 of v12) {
    const v15 = String(v14["parentId"] || "")["trim"]();
    if (!v15) continue;
    if (!v13["has"](v15)) v13["set"](v15, []);
    v13["get"](v15)["push"](v14);
  }
  for (const v16 of v13["values"]()) {
    v16["sort"](compareCanvasOrder);
  }
  const v17 = [],
    v18 = new Set(),
    v19 = (v20) => {
      const v21 = v13["get"](v20) || [];
      for (const v22 of v21) {
        const v23 = String(v22?.["id"] || "")["trim"]();
        if (!v23 || v18["has"](v23)) continue;
        v18["add"](v23);
        if (isExecutableNode(v22)) v17["push"](v23);
        if (String(v22?.["type"] || "") === "group") v19(v23);
      }
    };
  return (v19(v11), v17);
}
export function collectSelectedExecutableNodeIds(v24, v25 = []) {
  const v26 = new Set(
    (Array["isArray"](v25) ? v25 : [])
      ["map"]((v27) => String(v27 || "")["trim"]())
      ["filter"](Boolean),
  );
  if (v26["size"] === 0) return [];
  return toNodeList(v24)
    ["filter"](
      (v28) =>
        v26["has"](String(v28?.["id"] || "")["trim"]()) &&
        isExecutableNode(v28),
    )
    ["sort"](compareCanvasOrder)
    ["map"]((v29) => String(v29?.["id"] || "")["trim"]())
    ["filter"](Boolean);
}
export function findGenerateButtonForNode(v30, v31) {
  const v32 = v30 || globalThis["document"];
  if (!v32 || typeof v32["getElementById"] !== "function") return null;
  const v33 = v32["getElementById"](String(v31 || ""));
  if (!v33 || typeof v33["querySelector"] !== "function") return null;
  return v33["querySelector"](
    ".prompt-submit.img-gen-btn:not(.debug-wrench-btn)",
  );
}
export function executeGroupGenerateButtons({
  groupId: v34,
  state: state = appStore["getState"](),
  root: root = globalThis["document"],
  showToast: showToast = globalThis["window"]?.["showToast"],
} = {}) {
  const v35 = state?.["nodes"] || {},
    v36 = v35?.[v34];
  if (!v36 || String(v36["type"] || "") !== "group")
    return (
      showToast?.("未找到可执行的组节点", "warn"),
      {
        clicked: 0,
        total: 0,
        missing: 0,
        skippedDisabled: 0,
        skippedGenerating: 0,
      }
    );
  const v37 = collectGroupExecutableNodeIds(v35, v34);
  if (v37["length"] === 0)
    return (
      showToast?.("组内没有可执行的生成节点", "warn"),
      {
        clicked: 0,
        total: 0,
        missing: 0,
        skippedDisabled: 0,
        skippedGenerating: 0,
      }
    );
  let v38 = 0,
    v39 = 0,
    v40 = 0,
    v41 = 0;
  for (const v42 of v37) {
    const v43 = v35[v42];
    if (v43?.["isGenerating"] === true) {
      v41 += 1;
      continue;
    }
    const v44 = findGenerateButtonForNode(root, v42);
    if (!v44) {
      v39 += 1;
      continue;
    }
    if (v44["disabled"]) {
      v40 += 1;
      continue;
    }
    (v44["click"](), (v38 += 1));
  }
  if (v38 > 0) showToast?.("已触发 " + v38 + " 个组内生成节点", "success");
  else
    v41 > 0
      ? showToast?.("组内生成节点正在运行", "warn")
      : showToast?.("组内没有可触发的生成按钮", "warn");
  return {
    clicked: v38,
    total: v37["length"],
    missing: v39,
    skippedDisabled: v40,
    skippedGenerating: v41,
  };
}
export function executeSelectedGenerateButtons({
  selectedIds: v45,
  state: state = appStore["getState"](),
  root: root = globalThis["document"],
  showToast: showToast = globalThis["window"]?.["showToast"],
} = {}) {
  const v46 = state?.["nodes"] || {},
    v47 = collectSelectedExecutableNodeIds(
      v46,
      v45 || state?.["selectedNodeIds"] || [],
    );
  if (v47["length"] === 0)
    return (
      showToast?.("选中的节点里没有可执行的生成节点", "warn"),
      {
        clicked: 0,
        total: 0,
        missing: 0,
        skippedDisabled: 0,
        skippedGenerating: 0,
      }
    );
  let v48 = 0,
    v49 = 0,
    v50 = 0,
    v51 = 0;
  for (const v52 of v47) {
    const v53 = v46[v52];
    if (v53?.["isGenerating"] === true) {
      v51 += 1;
      continue;
    }
    const v54 = findGenerateButtonForNode(root, v52);
    if (!v54) {
      v49 += 1;
      continue;
    }
    if (v54["disabled"]) {
      v50 += 1;
      continue;
    }
    (v54["click"](), (v48 += 1));
  }
  if (v48 > 0) showToast?.("已触发 " + v48 + " 个选中生成节点", "success");
  else
    v51 > 0
      ? showToast?.("选中的生成节点正在运行", "warn")
      : showToast?.("选中节点里没有可触发的生成按钮", "warn");
  return {
    clicked: v48,
    total: v47["length"],
    missing: v49,
    skippedDisabled: v50,
    skippedGenerating: v51,
  };
}

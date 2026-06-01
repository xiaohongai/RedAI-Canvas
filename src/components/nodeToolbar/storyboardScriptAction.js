import { generateId as generateId } from "../../core/math.js";
import {
  createStoryboardScriptNodeData,
  STORYBOARD_SCRIPT_DEFAULT_SIZE,
} from "../../core/storyboardScriptFactory.js";
import appStore from "../../core/stores/appStore.js";
import {
  addEdgeWithPolicies as addEdgeWithPolicies,
  isValidConnection,
} from "../../modules/interaction/EdgeController.js";
import { commit as commit } from "../../modules/history.js";
import { calcSafeSpawnPosNearNode as calcSafeSpawnPosNearNode } from "../../modules/nodeSpawn.js";
export const VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT =
  "根据这个视频生成一版分镜脚本，自动按视频内容拆分镜头";
function getGraphStore(v0) {
  return v0?.["graphStore"] || v0 || appStore;
}
function readStateSnapshot({ storeInstance: v1, getStateSnapshot: v2 } = {}) {
  if (typeof v2 === "function") {
    const v3 = v2();
    if (v3 && typeof v3 === "object") return v3;
  }
  const v4 = getGraphStore(v1);
  if (typeof v4?.["getStateRaw"] === "function") return v4["getStateRaw"]();
  if (typeof v4?.["getState"] === "function") return v4["getState"]();
  if (typeof v1?.["getStateRaw"] === "function") return v1["getStateRaw"]();
  if (typeof v1?.["getState"] === "function") return v1["getState"]();
  return {};
}
function notify(v5, v6 = "warn") {
  const v7 = globalThis["window"]?.["showToast"];
  if (typeof v7 === "function") v7(v5, v6);
}
function isVideoSourceNode(v8) {
  const v9 = String(v8?.["type"] || "")["trim"]();
  return v9 === "source-video" || v9 === "ai-video" || v9 === "video";
}
export function createConnectedStoryboardScriptNode({
  sourceNodeId: v10,
  sourceNode: v11,
  storeInstance: storeInstance = appStore,
  getStateSnapshot: v12,
  addEdgeWithPolicies: addEdgeWithPolicies = addEdgeWithPolicies,
  isValidConnectionFn: isValidConnectionFn = isValidConnection,
  commit: commit = commit,
  generateId: generateId = generateId,
  calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode = calcSafeSpawnPosNearNode,
} = {}) {
  const v13 = getGraphStore(storeInstance),
    v14 = readStateSnapshot({ storeInstance: v13, getStateSnapshot: v12 }),
    v15 = v14?.["nodes"] || {},
    v16 = String(v10 || v11?.["id"] || "")["trim"](),
    v17 = v15[v16] || v11 || null,
    v18 = String(v17?.["id"] || v16 || "")["trim"]();
  if (!v18 || !v17)
    return (
      notify("请先选择一个可连接的文本或视频节点"),
      { ok: false, reason: "missing-source" }
    );
  const v19 = generateId("storyboard-script"),
    v20 = STORYBOARD_SCRIPT_DEFAULT_SIZE["width"],
    v21 = STORYBOARD_SCRIPT_DEFAULT_SIZE["height"],
    v22 = calcSafeSpawnPosNearNode(v15, v17, v20, v21),
    v23 = isVideoSourceNode(v17) ? VIDEO_STORYBOARD_SCRIPT_DEFAULT_PROMPT : "",
    v24 = createStoryboardScriptNodeData({
      id: v19,
      x: v22["x"],
      y: v22["y"],
      width: v20,
      height: v21,
      storyboardScript: v23 ? { prompt: v23, sourceMode: "video" } : {},
    });
  if (v23) v24["prompt"] = v23;
  if (
    typeof isValidConnectionFn === "function" &&
    !isValidConnectionFn(v17, v24)
  )
    return (
      notify("当前节点不能连接到分镜脚本节点"),
      { ok: false, reason: "invalid-connection" }
    );
  if (typeof v13?.["addNode"] !== "function")
    return (
      notify("创建分镜脚本节点失败：Store 不支持 addNode", "error"),
      { ok: false, reason: "missing-add-node" }
    );
  v13["addNode"](v24);
  const v25 = addEdgeWithPolicies({ sourceId: v18, targetId: v19 });
  if (!v25)
    return (
      v13["deleteNodes"]?.([v19]),
      notify("连接分镜脚本节点失败", "error"),
      { ok: false, reason: "connect-failed" }
    );
  return (
    v13["setSelectedNodes"]?.([v19]),
    commit?.(),
    { ok: true, nodeId: v19 }
  );
}
export function bindStoryboardScriptToolbarAction({
  toolbarEl: v26,
  nodeData: v27,
  store: v28 = appStore,
  getStateSnapshot: v29,
  buttonSelector: buttonSelector = ".act-storyboard-script",
  addEdgeWithPolicies: v30,
  isValidConnectionFn: v31,
  commit: v32,
  generateId: v33,
  calcSafeSpawnPosNearNode: v34,
} = {}) {
  const v35 = v26?.["querySelector"]?.(buttonSelector);
  if (!v35) return;
  v35["addEventListener"]("click", (v36) => {
    (v36["preventDefault"](),
      v36["stopPropagation"](),
      createConnectedStoryboardScriptNode({
        sourceNodeId: v27?.["id"],
        sourceNode: v27,
        storeInstance: v28,
        getStateSnapshot: v29,
        addEdgeWithPolicies: v30,
        isValidConnectionFn: v31,
        commit: v32,
        generateId: v33,
        calcSafeSpawnPosNearNode: v34,
      }));
  });
}

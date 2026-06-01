import { isNodeType } from "../modules/registry.js";
export const NODE_DETAIL_DEFERRED_CLASS = "v2-node-detail-deferred";
const NODE_DETAIL_LOW_ZOOM_THRESHOLD = 0.45,
  NODE_DETAIL_DEFERRED_STAGE = "deferred",
  NODE_DETAIL_HYDRATED_STAGE = "hydrated",
  NODE_DETAIL_HYDRATION_BATCH_SIZE = 12,
  NODE_DETAIL_DEFER_VISIBLE_COUNT = 48;
export function createNodeDetailHydrationController({
  getWrapper: v0,
  getParkedWrapper: v1,
  getWrappers: v2,
  getParkedWrappers: v3,
  isMounted: v4,
  isInteractionBusy: v5,
} = {}) {
  let v6 = [],
    v7 = new Set(),
    v8 = null,
    v9 = "";
  function v10() {
    if (v8 === null) return;
    if (v9 === "idle" && typeof cancelIdleCallback === "function")
      cancelIdleCallback(v8);
    else v9 === "timeout" && clearTimeout(v8);
    ((v8 = null), (v9 = ""));
  }
  function v11(v12, v13 = v0?.(v12)) {
    if (!v12 || !v13) return;
    (v7["delete"](v12), v13["classList"]["remove"](NODE_DETAIL_DEFERRED_CLASS));
    if (v13["dataset"])
      v13["dataset"]["detailStage"] = NODE_DETAIL_HYDRATED_STAGE;
  }
  function v14() {
    if (v8 !== null) return;
    if (v5?.()) return;
    if (typeof requestIdleCallback === "function") {
      ((v9 = "idle"), (v8 = requestIdleCallback(v15, { timeout: 160 })));
      return;
    }
    ((v9 = "timeout"), (v8 = setTimeout(() => v15(), 32)));
  }
  function v15(v16 = null) {
    ((v8 = null), (v9 = ""));
    if (v5?.()) return;
    let v17 = 0;
    const v18 = () => {
      if (!v16 || v16["didTimeout"]) return true;
      if (typeof v16["timeRemaining"] !== "function") return true;
      return v16["timeRemaining"]() > 2;
    };
    while (
      v6["length"] > 0 &&
      v17 < NODE_DETAIL_HYDRATION_BATCH_SIZE &&
      v18()
    ) {
      const v19 = v6["shift"]();
      if (!v7["delete"](v19)) continue;
      const v20 = v0?.(v19);
      if (!v20 || !v4?.(v19) || !v20["isConnected"]) continue;
      (v11(v19, v20), (v17 += 1));
    }
    if (v6["length"] > 0) v14();
  }
  function v21(v22) {
    if (!v22 || v7["has"](v22)) return;
    (v7["add"](v22), v6["push"](v22), v14());
  }
  function v23() {
    if (v6["length"] === 0) return;
    v14();
  }
  function v24(v25, v26) {
    if (!v25 || !v26) return;
    v25["classList"]["add"](NODE_DETAIL_DEFERRED_CLASS);
    if (v25["dataset"])
      v25["dataset"]["detailStage"] = NODE_DETAIL_DEFERRED_STAGE;
    v21(v26);
  }
  function v27(v28, { removeClass: removeClass = true } = {}) {
    if (!v28) return;
    v7["delete"](v28);
    const v29 = v0?.(v28) || v1?.(v28);
    removeClass &&
      v29 &&
      (v29["classList"]["remove"](NODE_DETAIL_DEFERRED_CLASS),
      v29["dataset"] &&
        v29["dataset"]["detailStage"] &&
        delete v29["dataset"]["detailStage"]);
  }
  function v30() {
    (v10(), (v6 = []), (v7 = new Set()));
    for (const v31 of v2?.() || []) {
      (v31?.["classList"]?.["remove"]?.(NODE_DETAIL_DEFERRED_CLASS),
        v31?.["dataset"] &&
          v31["dataset"]["detailStage"] &&
          delete v31["dataset"]["detailStage"]);
    }
    for (const v32 of v3?.() || []) {
      (v32?.["classList"]?.["remove"]?.(NODE_DETAIL_DEFERRED_CLASS),
        v32?.["dataset"] &&
          v32["dataset"]["detailStage"] &&
          delete v32["dataset"]["detailStage"]);
    }
  }
  function v33({
    node: v34,
    nodeId: v35,
    isSelected: v36,
    connOverlay: v37,
    pickMode: v38,
    relatedNodeIds: v39,
  } = {}) {
    if (v36) return true;
    if (v39?.["has"]?.(v35)) return true;
    if (v37?.["srcId"] === v35 || v37?.["hoverId"] === v35) return true;
    if (v38?.["sourceNodeId"] === v35 || v38?.["hoverNodeId"] === v35)
      return true;
    return !!(v34?.["isImagesExpanded"] || v34?.["isVideosExpanded"]);
  }
  function v40({
    node: v41,
    nodeId: v42,
    isSelected: v43,
    connOverlay: v44,
    pickMode: v45,
    relatedNodeIds: v46,
    viewport: v47,
    mountCandidateCount: v48,
  } = {}) {
    if (!v41?.["id"]) return false;
    if (isNodeType(v41, ["group", "comment-note"])) return false;
    if (
      v33({
        node: v41,
        nodeId: v42,
        isSelected: v43,
        connOverlay: v44,
        pickMode: v45,
        relatedNodeIds: v46,
      })
    )
      return false;
    const v49 = Number["isFinite"](v47?.["zoom"]) ? v47["zoom"] : 1;
    return (
      v49 <= NODE_DETAIL_LOW_ZOOM_THRESHOLD ||
      Number(v48 || 0) >= NODE_DETAIL_DEFER_VISIBLE_COUNT
    );
  }
  function v50({
    wrapperEl: v51,
    node: v52,
    nodeId: v53,
    isSelected: v54,
    connOverlay: v55,
    pickMode: v56,
    relatedNodeIds: v57,
    viewport: v58,
    mountCandidateCount: v59,
  } = {}) {
    if (!v51 || !v53) return;
    v40({
      node: v52,
      nodeId: v53,
      isSelected: v54,
      connOverlay: v55,
      pickMode: v56,
      relatedNodeIds: v57,
      viewport: v58,
      mountCandidateCount: v59,
    })
      ? v24(v51, v53)
      : v11(v53, v51);
  }
  return {
    clearNodeDetailHydrationState: v30,
    forgetNodeDetailHydration: v27,
    hydrateNodeDetails: v11,
    isNodeDetailActive: v33,
    resumeNodeDetailHydration: v23,
    syncNodeDetailMountStage: v50,
  };
}

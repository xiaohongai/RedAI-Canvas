import appStore, {
  graphStore as graphStoreImport,
  uiStore as uiStoreImport,
  workspaceStore as workspaceStoreImport,
} from "../../core/stores/appStore.js";
import { screenToWorld } from "../../core/math.js";
import { commit } from "../history.js";
import {
  applyWorkflowToCanvas,
  sliceCanvasStateForWorkflow,
  normalizeWorkflowTags,
  WORKFLOW_LIMITS,
} from "./workflowCanvas.js";
import {
  DEFAULT_WORKFLOW_COVER_ID,
  createWorkflowSnapshotCoverCandidate,
  extractWorkflowCoverCandidates,
  getDefaultWorkflowCoverCandidate,
} from "./workflowCovers.js";
import {
  buildWorkflowContentPreviewItems,
  buildWorkflowSourceSummary,
} from "./workflowPreview.js";
import { filterWorkflows, findWorkflowById } from "./workflowSelectors.js";
import {
  deleteWorkflow,
  loadWorkflowsFromServer,
  renameWorkflow,
  saveNewWorkflowFromCanvas,
  saveWorkflowMeta,
  saveUpdatedWorkflowFromCanvas,
  saveWorkflowUsage,
} from "./workflowService.js";
import { playWorkflowSaveFly } from "./workflowSaveAnimation.js";
import { registerSidebarSubmenu } from "../sidebarSubmenuController.js";
const graphStore = appStore?.["graphStore"] || graphStoreImport || appStore,
  uiStore = appStore?.["uiStore"] || uiStoreImport || appStore,
  workspaceStore =
    appStore?.["workspaceStore"] || workspaceStoreImport || appStore;
function getState() {
  return {
    ...graphStore["getState"](),
    ...uiStore["getState"](),
    ...workspaceStore["getState"](),
  };
}
function getStateRaw() {
  return {
    ...graphStore["getStateRaw"](),
    ...uiStore["getStateRaw"](),
    ...workspaceStore["getStateRaw"](),
  };
}
function el(v0, v1 = "", v2 = "") {
  const v3 = document["createElement"](v0);
  if (v1) v3["className"] = v1;
  if (v2) v3["textContent"] = v2;
  return v3;
}
function cleanText(v4) {
  return String(v4 ?? "")["trim"]();
}
function formatDateTime(v5) {
  const v6 = Number(v5);
  if (!Number["isFinite"](v6) || v6 <= 0) return "未知";
  return new Date(v6)["toLocaleString"]("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatShortDate(v7) {
  const v8 = Number(v7);
  if (!Number["isFinite"](v8) || v8 <= 0) return "未知";
  return new Date(v8)["toLocaleDateString"]("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}
function formatWorkflowMetaLine(v9) {
  const v10 =
      Number(
        v9?.["nodeCount"] || v9?.["workflowData"]?.["nodes"]?.["length"] || 0,
      ) || 0,
    v11 =
      Number(
        v9?.["edgeCount"] || v9?.["workflowData"]?.["edges"]?.["length"] || 0,
      ) || 0,
    v12 = Number(v9?.["lastUsedAt"] || 0) || 0,
    v13 = Number(v9?.["updatedAt"] || 0) || 0,
    v14 =
      v12 > 0 ? "使用 " + formatShortDate(v12) : "更新 " + formatShortDate(v13);
  return v10 + " 节点 · " + v11 + " 连线 · " + v14;
}
function showToast(v15, v16 = "info") {
  window["showToast"]?.(v15, v16);
}
function appendCoverPlaceholder(v17, v18 = "RedAI-Canvas") {
  if (!v17) return;
  v17["replaceChildren"](el("div", "v2-workflow-cover-placeholder", v18));
}
const WORKFLOW_UPDATE_ENTRY_ENABLED = false,
  WORKFLOW_MODAL_TABS_ENABLED = WORKFLOW_UPDATE_ENTRY_ENABLED;
function buildWorkflowListRenderKey(v19 = []) {
  if (!Array["isArray"](v19)) return "";
  return v19["map"]((v20) => {
    const v21 = Array["isArray"](v20?.["tags"])
      ? v20["tags"]["map"](cleanText)["filter"](Boolean)["join"](",")
      : "";
    return [
      cleanText(v20?.["id"]),
      cleanText(v20?.["name"]),
      cleanText(v20?.["cover"] || v20?.["coverUrl"]),
      cleanText(v20?.["note"]),
      v21,
      Number(v20?.["updatedAt"] || 0) || 0,
      Number(v20?.["nodeCount"] || 0) || 0,
      Number(v20?.["edgeCount"] || 0) || 0,
    ]["join"]("|");
  })["join"](";");
}
export class WorkflowManager {
  constructor() {
    ((this["sidebarPanel"] = null),
      (this["sidebarContent"] = null),
      (this["modal"] = null),
      (this["modalDialog"] = null),
      (this["modalBody"] = null),
      (this["_hideTimer"] = 0),
      (this["_loadingPromise"] = null),
      (this["_pendingDeleteWorkflowId"] = ""),
      (this["_renamingWorkflowId"] = ""),
      this["initSidebarPanel"](),
      this["initModal"](),
      this["bindGlobalEvents"](),
      this["loadWorkflows"](),
      workspaceStore["subscribeSelector"](
        (v22) => ({
          workflowsKey: buildWorkflowListRenderKey(v22["workflows"]?.["items"]),
          workflowsLoading: v22["workflows"]?.["loading"] === true,
          workflowsError: v22["workflows"]?.["error"] || null,
          panelOpen: v22["workflowUi"]?.["panelOpen"],
          panelPinned: v22["workflowUi"]?.["panelPinned"],
          searchKeyword: v22["workflowUi"]?.["searchKeyword"],
          detailWorkflowId: v22["workflowUi"]?.["detailWorkflowId"],
        }),
        () => this["renderSidebar"](),
      ));
  }
  ["bindGlobalEvents"]() {
    const v23 = (v24) => {
      (v24?.["preventDefault"]?.(),
        this["openCreateModal"](v24?.["detail"]?.["groupId"] || null));
    };
    (document["addEventListener"]("workflow:create-request", v23),
      window["addEventListener"]("workflow:create-request", v23));
  }
  ["initSidebarPanel"]() {
    const v25 =
        document["querySelector"](".sidebar-floating") || document["body"],
      v26 = document["getElementById"]("btnWorkflows");
    ((this["sidebarPanel"] = el("div", "v2-workflow-sidebar-panel")),
      this["sidebarPanel"]["setAttribute"]("aria-label", "工作流面板"));
    const v27 = el("div", "v2-workflow-sidebar-header"),
      v28 = el("button", "v2-workflow-back", "‹");
    ((v28["type"] = "button"), (v28["dataset"]["action"] = "workflow-back"));
    const v29 = el("div", "v2-workflow-sidebar-title");
    ((this["sidebarTitleTextEl"] = el(
      "span",
      "v2-workflow-title-text",
      "工作流",
    )),
      v29["appendChild"](this["sidebarTitleTextEl"]),
      v27["append"](v28, v29));
    const v30 = el("div", "v2-workflow-search"),
      v31 = el("input", "v2-workflow-search-input");
    ((v31["type"] = "search"),
      (v31["placeholder"] = "搜索名称、标签、备注"),
      (v31["dataset"]["role"] = "workflow-search"),
      v30["appendChild"](v31),
      (this["sidebarContent"] = el("div", "v2-workflow-list")),
      this["sidebarPanel"]["append"](v27, v30, this["sidebarContent"]),
      v25["appendChild"](this["sidebarPanel"]),
      v26 &&
        registerSidebarSubmenu({
          key: "workflows",
          button: v26,
          panel: this["sidebarPanel"],
          open: () => this["openSidebar"](false),
          close: () => {
            (this["hideSidebar"](),
              workspaceStore["setWorkflowUi"]({
                panelOpen: false,
                panelPinned: false,
                detailWorkflowId: null,
              }));
          },
          isOpen: () => getState()["workflowUi"]?.["panelOpen"] === true,
        }),
      this["sidebarPanel"]["addEventListener"]("click", (v32) =>
        this["handleSidebarClick"](v32),
      ),
      this["sidebarPanel"]["addEventListener"]("keydown", (v33) => {
        if (v33["target"]?.["dataset"]?.["role"] !== "workflow-rename-input")
          return;
        this["handleSidebarRenameKeydown"](v33);
      }),
      this["sidebarPanel"]["addEventListener"]("focusout", (v34) => {
        const v35 = v34["target"];
        if (v35?.["dataset"]?.["role"] !== "workflow-rename-input") return;
        if (v35["dataset"]["submitted"] === "1") return;
        this["commitWorkflowRename"](
          v35["dataset"]["workflowId"],
          v35["value"],
        );
      }),
      this["sidebarPanel"]["addEventListener"]("input", (v36) => {
        const v37 = v36["target"];
        if (v37?.["dataset"]?.["role"] !== "workflow-search") return;
        workspaceStore["setWorkflowUi"]({ searchKeyword: v37["value"] || "" });
      }));
  }
  ["initModal"]() {
    ((this["modal"] = el("div", "v2-workflow-modal-backdrop")),
      this["modal"]["setAttribute"]("aria-hidden", "true"),
      (this["modalDialog"] = el("div", "v2-workflow-modal")),
      this["modalDialog"]["setAttribute"]("role", "dialog"),
      this["modalDialog"]["setAttribute"]("aria-label", "工作流"));
    const v38 = el("div", "v2-workflow-modal-header"),
      v39 = el("div", "v2-workflow-modal-title");
    ((this["modalTitleTextEl"] = el(
      "span",
      "v2-workflow-title-text",
      "工作流",
    )),
      v39["appendChild"](this["modalTitleTextEl"]));
    const v40 = el("button", "v2-workflow-icon-btn", "×");
    ((v40["type"] = "button"),
      (v40["dataset"]["action"] = "workflow-modal-close"),
      v38["append"](v39, v40),
      (this["modalBody"] = el("div", "v2-workflow-modal-body")));
    if (WORKFLOW_MODAL_TABS_ENABLED) {
      const v41 = el("div", "v2-workflow-modal-tabs"),
        v42 = [["create", "创建新工作流"]];
      WORKFLOW_UPDATE_ENTRY_ENABLED &&
        v42["push"](["update", "更新历史工作流"]);
      for (const [v43, v44] of v42) {
        const v45 = el("button", "v2-workflow-modal-tab", v44);
        ((v45["type"] = "button"),
          (v45["dataset"]["modalTab"] = v43),
          v41["appendChild"](v45));
      }
      this["modalDialog"]["append"](v38, v41, this["modalBody"]);
    } else this["modalDialog"]["append"](v38, this["modalBody"]);
    (this["modal"]["appendChild"](this["modalDialog"]),
      document["body"]["appendChild"](this["modal"]),
      this["modal"]["addEventListener"]("click", (v46) => {
        const v47 = v46["target"]["closest"]("[data-action]");
        if (v47?.["dataset"]?.["action"] === "workflow-modal-close") {
          this["closeModal"]();
          return;
        }
        v46["target"] === this["modal"] && this["closeModal"]();
      }),
      this["modal"]["addEventListener"]("click", (v48) =>
        this["handleModalClick"](v48),
      ),
      this["modal"]["addEventListener"]("input", (v49) =>
        this["handleModalInput"](v49),
      ),
      this["modal"]["addEventListener"]("keydown", (v50) =>
        this["handleModalKeydown"](v50),
      ));
  }
  async ["loadWorkflows"]() {
    if (this["_loadingPromise"]) return this["_loadingPromise"];
    return (
      workspaceStore["setWorkflowsLoading"](true),
      (this["_loadingPromise"] = loadWorkflowsFromServer()
        ["then"]((v51) => {
          const v52 = new Map();
          for (const v53 of getState()["workflows"]?.["items"] || []) {
            if (v53?.["id"]) v52["set"](v53["id"], v53);
          }
          for (const v54 of v51 || []) {
            if (v54?.["id"]) v52["set"](v54["id"], v54);
          }
          const v55 = Array["from"](v52["values"]());
          return (workspaceStore["setWorkflows"](v55), v55);
        })
        ["catch"]((v56) => {
          return (
            workspaceStore["setWorkflowsLoading"](
              false,
              v56?.["message"] || "工作流加载失败",
            ),
            showToast("工作流加载失败", "error"),
            []
          );
        })
        ["finally"](() => {
          this["_loadingPromise"] = null;
        })),
      this["_loadingPromise"]
    );
  }
  ["openSidebar"](v57 = false) {
    (clearTimeout(this["_hideTimer"]),
      workspaceStore["setWorkflowUi"]({
        panelOpen: true,
        panelPinned: v57 === true,
      }));
    const v58 = getState()["workflows"] || {};
    !v58["loadedAt"] && !v58["loading"] && this["loadWorkflows"]();
  }
  ["scheduleCloseSidebar"]() {
    (clearTimeout(this["_hideTimer"]),
      (this["_hideTimer"] = window["setTimeout"](() => {
        const v59 = getState()["workflowUi"] || {};
        !v59["panelPinned"] &&
          (this["hideSidebar"](),
          workspaceStore["setWorkflowUi"]({ panelOpen: false }));
      }, 180)));
  }
  ["hideSidebar"]() {
    (clearTimeout(this["_hideTimer"]),
      (this["_pendingDeleteWorkflowId"] = ""),
      (this["_renamingWorkflowId"] = ""),
      this["sidebarPanel"]?.["classList"]["remove"]("show"));
    const v60 = document["getElementById"]("btnWorkflows");
    v60?.["classList"]["remove"]("active");
  }
  ["renderSidebar"]() {
    if (!this["sidebarPanel"] || !this["sidebarContent"]) return;
    const v61 = getState(),
      v62 = v61["workflows"]?.["items"] || [],
      v63 = v61["workflows"] || {},
      v64 = v61["workflowUi"] || {},
      v65 = document["getElementById"]("btnWorkflows");
    (this["sidebarPanel"]["classList"]["toggle"](
      "show",
      v64["panelOpen"] === true,
    ),
      v65?.["classList"]["toggle"](
        "active",
        v64["panelOpen"] === true || v64["panelPinned"] === true,
      ));
    const v66 = this["sidebarPanel"]["querySelector"](".v2-workflow-back");
    v66?.["classList"]["toggle"]("show", !!v64["detailWorkflowId"]);
    this["sidebarTitleTextEl"] &&
      (this["sidebarTitleTextEl"]["textContent"] = v64["detailWorkflowId"]
        ? "工作流详情"
        : "工作流");
    const v67 = this["sidebarPanel"]["querySelector"](
      "[data-role='workflow-search']",
    );
    v67 &&
      v67["value"] !== (v64["searchKeyword"] || "") &&
      (v67["value"] = v64["searchKeyword"] || "");
    this["sidebarContent"]["replaceChildren"]();
    if (v64["detailWorkflowId"]) {
      ((this["_pendingDeleteWorkflowId"] = ""),
        (this["_renamingWorkflowId"] = ""),
        this["renderWorkflowDetail"](v62, v64["detailWorkflowId"]));
      return;
    }
    if (v63["loading"]) {
      this["renderLoadingList"]();
      return;
    }
    const v68 = filterWorkflows(v62, v64["searchKeyword"]);
    if (v68["length"] === 0) {
      const v69 = cleanText(v64["searchKeyword"])
        ? "没有匹配的工作流"
        : "还没有工作流";
      this["sidebarContent"]["appendChild"](this["renderEmpty"](v69));
      return;
    }
    for (const v70 of v68) {
      this["sidebarContent"]["appendChild"](this["renderWorkflowCard"](v70));
    }
  }
  ["renderLoadingList"]() {
    for (let v71 = 0; v71 < 4; v71++) {
      this["sidebarContent"]["appendChild"](el("div", "v2-workflow-skeleton"));
    }
  }
  ["renderEmpty"](v72) {
    const v73 = el("div", "v2-workflow-empty"),
      v74 = el("div", "v2-workflow-empty-text", v72);
    return (v73["appendChild"](v74), v73);
  }
  ["renderCover"](v75, v76 = "v2-workflow-cover", v77 = "RedAI-Canvas") {
    const v78 = el("div", v76),
      v79 = cleanText(v75);
    appendCoverPlaceholder(v78, v77);
    if (v79) {
      const v80 = el("img");
      ((v80["src"] = v79),
        (v80["alt"] = "工作流封面"),
        (v80["draggable"] = false),
        (v80["decoding"] = "async"),
        v80["addEventListener"](
          "load",
          () => {
            if (v78["isConnected"]) v78["replaceChildren"](v80);
          },
          { once: true },
        ));
    }
    return v78;
  }
  ["renderWorkflowCard"](v81) {
    const v82 = el("article", "v2-workflow-card"),
      v83 = String(v81?.["id"] || "");
    ((v82["dataset"]["workflowId"] = v83),
      (v82["dataset"]["action"] = "workflow-view"),
      v82["appendChild"](this["renderCover"](v81["cover"])));
    const v84 = getState()["workflowUi"]?.["applyingWorkflowId"],
      v85 = el("button", "v2-workflow-card-load");
    ((v85["type"] = "button"),
      (v85["dataset"]["action"] = "workflow-apply"),
      (v85["dataset"]["workflowId"] = v83),
      (v85["disabled"] = v84 === v81["id"]),
      (v85["title"] = "载入到画布"),
      v85["setAttribute"]("aria-label", "载入到画布"),
      (v85["innerHTML"] =
        '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 5.5a7.5 7.5 0 1 0-1 13.5"/><path d="M12 14h6v6"/><path d="m18 14-6 6"/></svg>'));
    const v86 = el("button", "v2-workflow-card-delete");
    ((v86["type"] = "button"),
      (v86["dataset"]["action"] = "workflow-delete-open"),
      (v86["dataset"]["workflowId"] = v83),
      v86["setAttribute"]("aria-label", "删除工作流"),
      (v86["innerHTML"] =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"/></svg>'));
    const v87 = el("div", "v2-workflow-card-delete-confirm");
    v87["hidden"] = this["_pendingDeleteWorkflowId"] !== v83;
    const v88 = el(
      "button",
      "v2-workflow-card-delete-confirm-btn\x20v2-workflow-card-delete-confirm-btn--danger",
      "✔",
    );
    ((v88["type"] = "button"),
      (v88["dataset"]["action"] = "workflow-delete-confirm"),
      (v88["dataset"]["workflowId"] = v83),
      v88["setAttribute"]("aria-label", "确定"));
    const v89 = el(
      "button",
      "v2-workflow-card-delete-confirm-btn\x20v2-workflow-card-delete-confirm-btn--neutral",
      "×",
    );
    ((v89["type"] = "button"),
      (v89["dataset"]["action"] = "workflow-delete-cancel"),
      (v89["dataset"]["workflowId"] = v83),
      v89["setAttribute"]("aria-label", "取消"),
      v87["append"](v88, v89),
      (v86["hidden"] = this["_pendingDeleteWorkflowId"] === v83),
      v82["append"](v85, v86, v87));
    const v90 = el("div", "v2-workflow-card-info"),
      v91 = el("div", "v2-workflow-card-title");
    ((v91["dataset"]["action"] = "workflow-rename-open"),
      (v91["dataset"]["workflowId"] = v83));
    if (this["_renamingWorkflowId"] === v83) {
      (v91["classList"]["add"]("is-editing"),
        v91["removeAttribute"]("data-action"),
        v91["removeAttribute"]("data-workflow-id"));
      const v92 = el("input", "v2-workflow-card-title-input");
      ((v92["type"] = "text"),
        (v92["value"] = v81["name"] || ""),
        (v92["maxLength"] = WORKFLOW_LIMITS["nameMax"]),
        (v92["dataset"]["role"] = "workflow-rename-input"),
        (v92["dataset"]["workflowId"] = v83),
        v92["setAttribute"]("aria-label", "工作流名称"),
        v91["appendChild"](v92),
        window["requestAnimationFrame"](() => {
          if (!v92["isConnected"]) return;
          (v92["focus"](), v92["select"]?.());
        }));
    } else v91["textContent"] = v81["name"] || "未命名工作流";
    v90["appendChild"](v91);
    const v93 = cleanText(v81["note"]),
      v94 = el("button", "v2-workflow-note-hint", "!");
    return (
      (v94["type"] = "button"),
      (v94["dataset"]["note"] = v93 || "暂无工作流备注"),
      (v94["title"] = v93 || "暂无工作流备注"),
      v94["setAttribute"](
        "aria-label",
        v93 ? "工作流备注：" + v93 : "暂无工作流备注",
      ),
      v90["appendChild"](v94),
      v84 === v81["id"] && v82["classList"]["add"]("is-applying"),
      v82["appendChild"](v90),
      v82
    );
  }
  ["renderWorkflowDetail"](v95, v96) {
    const v97 = findWorkflowById(v95, v96);
    if (!v97) {
      this["sidebarContent"]["appendChild"](
        this["renderEmpty"]("工作流不存在"),
      );
      return;
    }
    const v98 = el("div", "v2-workflow-detail");
    (v98["appendChild"](
      this["renderCover"](v97["cover"], "v2-workflow-detail-cover"),
    ),
      v98["appendChild"](el("div", "v2-workflow-detail-title", v97["name"])),
      v98["appendChild"](
        el("div", "v2-workflow-detail-meta", formatWorkflowMetaLine(v97)),
      ));
    const v99 = (v97["tags"] || [])
      ["map"]((v100) => cleanText(v100))
      ["filter"](Boolean);
    if (v99["length"] > 0) {
      const v101 = el("div", "v2-workflow-tags");
      for (const v102 of v99) {
        v101["appendChild"](el("span", "v2-workflow-tag", v102));
      }
      v98["appendChild"](v101);
    }
    const v103 = el("section", "v2-workflow-detail-section");
    v103["appendChild"](el("div", "v2-workflow-detail-section-title", "内容"));
    const v104 = buildWorkflowContentPreviewItems(v97);
    if (v104["length"] === 0)
      v103["appendChild"](
        this["renderEmpty"]("这个工作流里还没有可预览的内容"),
      );
    else {
      const v105 = el("div", "v2-workflow-content-list");
      for (const v106 of v104) {
        v105["appendChild"](this["renderWorkflowContentItem"](v106));
      }
      v103["appendChild"](v105);
    }
    v98["appendChild"](v103);
    const v107 = cleanText(v97["note"]);
    if (v107) {
      const v108 = el("div", "v2-workflow-detail-note");
      ((v108["textContent"] = v107), v98["appendChild"](v108));
    }
    const v109 = el("div", "v2-workflow-detail-actions");
    if (WORKFLOW_UPDATE_ENTRY_ENABLED) {
      const v110 = el("button", "v2-workflow-secondary-btn", "编辑信息");
      ((v110["type"] = "button"),
        (v110["dataset"]["action"] = "workflow-edit-meta"),
        (v110["dataset"]["workflowId"] = v97["id"]));
      const v111 = el("button", "v2-workflow-secondary-btn", "更新内容");
      ((v111["type"] = "button"),
        (v111["dataset"]["action"] = "workflow-open-update"),
        (v111["dataset"]["workflowId"] = v97["id"]),
        v109["append"](v110, v111));
    }
    const v112 = el("button", "v2-workflow-primary-btn", "应用到画布");
    ((v112["type"] = "button"),
      (v112["dataset"]["action"] = "workflow-apply"),
      (v112["dataset"]["workflowId"] = v97["id"]),
      getState()["workflowUi"]?.["applyingWorkflowId"] === v97["id"] &&
        ((v112["disabled"] = true), (v112["textContent"] = "应用中")),
      v109["append"](v112),
      v98["appendChild"](v109),
      this["sidebarContent"]["appendChild"](v98));
  }
  ["renderWorkflowContentItem"](v113) {
    const v114 = el("article", "v2-workflow-content-item");
    v114["appendChild"](
      this["renderCover"](
        v113["thumbSrc"],
        "v2-workflow-content-thumb",
        v113["placeholderLabel"] || "节点",
      ),
    );
    const v115 = el("div", "v2-workflow-content-info");
    (v115["appendChild"](
      el("span", "v2-workflow-content-type", v113["typeLabel"] || "节点"),
    ),
      v115["appendChild"](
        el(
          "div",
          "v2-workflow-content-title",
          v113["title"] || v113["typeLabel"] || "节点",
        ),
      ));
    const v116 = el("div", "v2-workflow-content-summary");
    return (
      (v116["textContent"] = v113["summary"] || "这个节点当前没有可展示的内容"),
      v115["appendChild"](v116),
      v114["appendChild"](v115),
      v114
    );
  }
  ["playDeleteShake"](v117) {
    if (!v117) return;
    (v117["classList"]["remove"]("is-delete-shaking"),
      void v117["offsetWidth"],
      v117["classList"]["add"]("is-delete-shaking"),
      window["setTimeout"](() => {
        if (v117["isConnected"])
          v117["classList"]["remove"]("is-delete-shaking");
      }, 240));
  }
  ["findWorkflowCard"](v118) {
    const v119 = String(v118 || "")["trim"]();
    if (!v119 || !this["sidebarContent"]) return null;
    for (const v120 of this["sidebarContent"]["querySelectorAll"](
      ".v2-workflow-card",
    )) {
      if (v120?.["dataset"]?.["workflowId"] === v119) return v120;
    }
    return null;
  }
  ["setWorkflowDeleteConfirm"](v121, v122) {
    const v123 = String(v121 || "")["trim"]();
    if (!v123) return false;
    v122 &&
      this["_pendingDeleteWorkflowId"] &&
      this["_pendingDeleteWorkflowId"] !== v123 &&
      this["setWorkflowDeleteConfirm"](this["_pendingDeleteWorkflowId"], false);
    const v124 = this["findWorkflowCard"](v123);
    if (!v124) return false;
    const v125 = v124["querySelector"](".v2-workflow-card-delete"),
      v126 = v124["querySelector"](".v2-workflow-card-delete-confirm");
    if (!v125 || !v126) return false;
    return (
      (v125["hidden"] = v122),
      (v126["hidden"] = !v122),
      v124["classList"]["toggle"]("is-delete-confirming", v122),
      (this["_pendingDeleteWorkflowId"] = v122
        ? v123
        : this["_pendingDeleteWorkflowId"] === v123
          ? ""
          : this["_pendingDeleteWorkflowId"]),
      true
    );
  }
  ["finishWorkflowRename"](v127, v128 = "") {
    const v129 = String(v127 || "")["trim"]();
    if (!v129) return false;
    const v130 = this["findWorkflowCard"](v129),
      v131 = v130?.["querySelector"](".v2-workflow-card-title");
    if (!v131) return false;
    const v132 = findWorkflowById(
      getState()["workflows"]?.["items"] || [],
      v129,
    );
    (v131["classList"]["remove"]("is-editing"),
      (v131["dataset"]["action"] = "workflow-rename-open"),
      (v131["dataset"]["workflowId"] = v129),
      v131["replaceChildren"](),
      (v131["textContent"] =
        cleanText(v128 || v132?.["name"]) || "未命名工作流"));
    if (this["_renamingWorkflowId"] === v129) this["_renamingWorkflowId"] = "";
    return true;
  }
  ["startWorkflowRename"](v133) {
    const v134 = String(v133 || "")["trim"]();
    if (!v134) return false;
    this["_renamingWorkflowId"] &&
      this["_renamingWorkflowId"] !== v134 &&
      this["finishWorkflowRename"](this["_renamingWorkflowId"]);
    this["_pendingDeleteWorkflowId"] &&
      this["setWorkflowDeleteConfirm"](this["_pendingDeleteWorkflowId"], false);
    const v135 = findWorkflowById(
        getState()["workflows"]?.["items"] || [],
        v134,
      ),
      v136 = this["findWorkflowCard"](v134),
      v137 = v136?.["querySelector"](".v2-workflow-card-title");
    if (!v135 || !v137) return false;
    ((this["_renamingWorkflowId"] = v134),
      v137["classList"]["add"]("is-editing"),
      v137["removeAttribute"]("data-action"),
      v137["removeAttribute"]("data-workflow-id"));
    const v138 = el("input", "v2-workflow-card-title-input");
    return (
      (v138["type"] = "text"),
      (v138["value"] = v135["name"] || ""),
      (v138["maxLength"] = WORKFLOW_LIMITS["nameMax"]),
      (v138["dataset"]["role"] = "workflow-rename-input"),
      (v138["dataset"]["workflowId"] = v134),
      v138["setAttribute"]("aria-label", "工作流名称"),
      v137["replaceChildren"](v138),
      window["requestAnimationFrame"](() => {
        if (!v138["isConnected"]) return;
        (v138["focus"](), v138["select"]?.());
      }),
      true
    );
  }
  ["handleSidebarClick"](v139) {
    const v140 = v139["target"]["closest"]("[data-action]"),
      v141 = v140?.["dataset"]?.["action"];
    if (v141 === "workflow-back") {
      ((this["_pendingDeleteWorkflowId"] = ""),
        (this["_renamingWorkflowId"] = ""),
        workspaceStore["setWorkflowUi"]({ detailWorkflowId: null }));
      return;
    }
    if (v141 === "workflow-open-create") {
      (v139["preventDefault"](),
        v139["stopPropagation"](),
        (this["_pendingDeleteWorkflowId"] = ""),
        (this["_renamingWorkflowId"] = ""),
        this["openCreateModal"](null));
      return;
    }
    const v142 = v140?.["dataset"]?.["workflowId"];
    if (v141 === "workflow-delete-open" && v142) {
      (v139["preventDefault"](), v139["stopPropagation"]());
      this["_renamingWorkflowId"] &&
        this["finishWorkflowRename"](this["_renamingWorkflowId"]);
      !this["setWorkflowDeleteConfirm"](v142, true) && this["renderSidebar"]();
      return;
    }
    if (v141 === "workflow-delete-cancel") {
      (v139["preventDefault"](), v139["stopPropagation"]());
      !this["setWorkflowDeleteConfirm"](v142, false) &&
        ((this["_pendingDeleteWorkflowId"] = ""), this["renderSidebar"]());
      return;
    }
    if (v141 === "workflow-delete-confirm" && v142) {
      (v139["preventDefault"](),
        v139["stopPropagation"](),
        this["deleteWorkflowById"](v142));
      return;
    }
    if (v141 === "workflow-rename-open" && v142) {
      (v139["preventDefault"](), v139["stopPropagation"]());
      !this["startWorkflowRename"](v142) &&
        ((this["_renamingWorkflowId"] = String(v142)), this["renderSidebar"]());
      return;
    }
    if (v141 === "workflow-card-apply" && v142) {
      if (
        v139["target"]["closest"]("button, input, textarea, select") ||
        v139["target"]["closest"](".v2-workflow-card-title")
      )
        return;
      (v139["preventDefault"](),
        v139["stopPropagation"](),
        (this["_pendingDeleteWorkflowId"] = ""),
        (this["_renamingWorkflowId"] = ""),
        this["applyWorkflow"](v142));
      return;
    }
    if (v141 === "workflow-view" && v142) {
      if (
        v139["target"]["closest"]("button, input, textarea, select") ||
        v139["target"]["closest"](".v2-workflow-card-title")
      )
        return;
      (v139["preventDefault"](),
        v139["stopPropagation"](),
        (this["_pendingDeleteWorkflowId"] = ""),
        (this["_renamingWorkflowId"] = ""),
        workspaceStore["setWorkflowUi"]({ detailWorkflowId: v142 }));
      return;
    }
    if (v141 === "workflow-edit-meta" && v142) {
      ((this["_pendingDeleteWorkflowId"] = ""),
        (this["_renamingWorkflowId"] = ""),
        this["openUpdateModal"](v142, { metaOnly: true }));
      return;
    }
    if (v141 === "workflow-open-update" && v142) {
      ((this["_pendingDeleteWorkflowId"] = ""),
        (this["_renamingWorkflowId"] = ""),
        this["openUpdateModal"](v142, { metaOnly: false }));
      return;
    }
    if (v141 === "workflow-apply" && v142) {
      (v139["preventDefault"](),
        v139["stopPropagation"](),
        (this["_pendingDeleteWorkflowId"] = ""),
        (this["_renamingWorkflowId"] = ""),
        this["applyWorkflow"](v142));
      return;
    }
  }
  ["handleSidebarRenameKeydown"](v143) {
    const v144 = v143["target"],
      v145 = v144?.["dataset"]?.["workflowId"];
    if (!v145) return;
    if (v143["key"] === "Enter") {
      (v143["preventDefault"](),
        v143["stopPropagation"](),
        (v144["dataset"]["submitted"] = "1"),
        this["commitWorkflowRename"](v145, v144["value"]));
      return;
    }
    v143["key"] === "Escape" &&
      (v143["preventDefault"](),
      v143["stopPropagation"](),
      !this["finishWorkflowRename"](v145) &&
        ((this["_renamingWorkflowId"] = ""), this["renderSidebar"]()));
  }
  async ["commitWorkflowRename"](v146, v147) {
    const v148 = String(v146 || "")["trim"](),
      v149 = cleanText(v147);
    if (!v148) return;
    if (!v149) {
      showToast("名称不能为空", "error");
      return;
    }
    const v150 = findWorkflowById(
      getState()["workflows"]?.["items"] || [],
      v148,
    );
    if (!v150) return;
    if (cleanText(v150["name"]) === v149) {
      !this["finishWorkflowRename"](v148, v150["name"]) &&
        ((this["_renamingWorkflowId"] = ""), this["renderSidebar"]());
      return;
    }
    let v151 = null;
    try {
      ((v151 = await renameWorkflow(v150, v149)),
        this["finishWorkflowRename"](v148, v151?.["name"] || v149),
        workspaceStore["upsertWorkflow"](v151),
        showToast("已重命名", "success"));
    } catch (v152) {
      (this["finishWorkflowRename"](v148, v150["name"]),
        showToast(v152?.["message"] || "重命名失败", "error"));
    } finally {
      this["_renamingWorkflowId"] = "";
    }
  }
  async ["deleteWorkflowById"](v153) {
    const v154 = String(v153 || "")["trim"]();
    if (!v154) return;
    (this["setWorkflowDeleteConfirm"](v154, false),
      (this["_pendingDeleteWorkflowId"] = ""),
      (this["_renamingWorkflowId"] = ""));
    try {
      await deleteWorkflow(v154);
      const v155 = getState(),
        v156 = (v155["workflows"]?.["items"] || [])["filter"](
          (v157) => String(v157?.["id"] || "") !== v154,
        );
      (workspaceStore["setWorkflows"](v156),
        v155["workflowUi"]?.["detailWorkflowId"] === v154 &&
          workspaceStore["setWorkflowUi"]({ detailWorkflowId: null }),
        showToast("已删除", "success"));
    } catch (v158) {
      showToast(v158?.["message"] || "删除失败", "error");
    }
  }
  ["openCreateModal"](v159 = null) {
    (workspaceStore["openWorkflowModal"]({
      tab: "create",
      sourceGroupId: v159,
    }),
      this["resetCreateDraftFromCurrentSource"](),
      this["renderModal"]());
  }
  ["openUpdateModal"](v160, { metaOnly: metaOnly = false } = {}) {
    (workspaceStore["openWorkflowModal"]({
      tab: "update",
      sourceGroupId: null,
    }),
      workspaceStore["setWorkflowUi"]({ updateMetaOnly: metaOnly === true }),
      this["selectUpdateTarget"](v160, { render: false }),
      this["renderModal"]());
  }
  ["resetCreateDraftFromCurrentSource"]() {
    const v161 = this["getWorkflowSourceCanvasState"](),
      v162 = this["getWorkflowSourceContext"](),
      v163 = buildWorkflowSourceSummary(v161, v162),
      v164 =
        this["getCoverCandidates"](null, v161)[0] ||
        getDefaultWorkflowCoverCandidate();
    workspaceStore["resetWorkflowDraft"]({
      name: v163["isEmpty"] ? "" : v163["suggestedName"],
      tags: v163["isEmpty"] ? [] : v163["suggestedTags"],
      cover: v164["src"] || "",
      selectedCoverId: v164["id"],
    });
  }
  ["closeModal"]() {
    (workspaceStore["closeWorkflowModal"](), this["renderModal"]());
  }
  ["getWorkflowSourceCanvasState"]() {
    const v165 = getState(),
      v166 = getStateRaw();
    return sliceCanvasStateForWorkflow(
      graphStore["serialize"](),
      v166?.["nodes"] || {},
      v165["workflowUi"]?.["sourceGroupId"],
    );
  }
  ["getWorkflowSourceContext"]() {
    const v167 = getState(),
      v168 = getStateRaw(),
      v169 = cleanText(v167["workflowUi"]?.["sourceGroupId"]),
      v170 = v169 ? v168?.["nodes"]?.[v169] : null;
    return {
      sourceGroupId: v169 || "",
      sourceLabel: v169 ? "当前节点组" : "整个画布",
      sourceName: cleanText(
        v170?.["name"] || v170?.["title"] || v170?.["label"],
      ),
    };
  }
  ["getWorkflowSourceSummary"](
    v171 = this["getWorkflowSourceCanvasState"](),
    v172 = {},
  ) {
    return buildWorkflowSourceSummary(v171, {
      ...this["getWorkflowSourceContext"](),
      ...v172,
    });
  }
  ["getCoverCandidates"](
    v173 = null,
    v174 = this["getWorkflowSourceCanvasState"](),
  ) {
    const v175 = createWorkflowSnapshotCoverCandidate(v174),
      v176 = extractWorkflowCoverCandidates(v174?.["nodes"]),
      v177 = [];
    if (v173?.["src"]) v177["push"](v173);
    if (v175?.["src"]) v177["push"](v175);
    v177["push"](...v176);
    if (v177["length"] === 0) v177["push"](getDefaultWorkflowCoverCandidate());
    const v178 = new Set();
    return v177["filter"]((v179) => {
      const v180 = v179["src"] || v179["id"];
      if (v178["has"](v180)) return false;
      return (v178["add"](v180), true);
    });
  }
  ["getUpdateCoverCandidates"](v181, v182 = null) {
    const v183 = getState()["workflowUi"] || {};
    if (v183["updateMetaOnly"] && v181?.["workflowData"])
      return this["getCoverCandidates"](v182, v181["workflowData"]);
    return this["getCoverCandidates"](v182);
  }
  ["renderModal"]() {
    if (!this["modal"] || !this["modalBody"]) return;
    const v184 = getState(),
      v185 = v184["workflowUi"] || {};
    (this["modal"]["classList"]["toggle"]("show", v185["modalOpen"] === true),
      this["modal"]["setAttribute"](
        "aria-hidden",
        v185["modalOpen"] === true ? "false" : "true",
      ));
    if (!v185["modalOpen"]) {
      this["modalBody"]["replaceChildren"]();
      return;
    }
    for (const v186 of this["modal"]["querySelectorAll"](
      ".v2-workflow-modal-tab",
    )) {
      v186["classList"]["toggle"](
        "active",
        v186["dataset"]["modalTab"] === (v185["modalTab"] || "create"),
      );
    }
    const v187 =
      v185["modalTab"] === "update" && !WORKFLOW_UPDATE_ENTRY_ENABLED
        ? "create"
        : v185["modalTab"];
    (this["modalTitleTextEl"] &&
      (this["modalTitleTextEl"]["textContent"] =
        v187 === "update"
          ? v185["updateMetaOnly"]
            ? "编辑工作流信息"
            : "更新工作流"
          : "创建工作流"),
      this["modalBody"]["replaceChildren"](),
      v187 === "update"
        ? this["renderUpdateForm"]()
        : this["renderCreateForm"]());
  }
  ["renderCreateForm"]() {
    const v188 = getState(),
      v189 = v188["workflowUi"] || {},
      v190 = this["getWorkflowSourceCanvasState"](),
      v191 = this["getWorkflowSourceSummary"](v190),
      v192 = el("div", "v2-workflow-create-layout");
    v192["appendChild"](this["renderWorkflowSourcePanel"](v191));
    const v193 = this["renderWorkflowMetaForm"]({
      mode: "create",
      candidates: this["getCoverCandidates"](null, v190),
      sourceSummary: v191,
      submitText: v189["saving"] ? "保存中" : "确认创建",
    });
    (v192["appendChild"](v193), this["modalBody"]["appendChild"](v192));
  }
  ["renderUpdateForm"]() {
    const v194 = getState(),
      v195 = v194["workflowUi"] || {},
      v196 = filterWorkflows(
        v194["workflows"]?.["items"] || [],
        v195["updateSearchKeyword"] || "",
      ),
      v197 = el("div", "v2-workflow-create-layout v2-workflow-update-layout"),
      v198 = el(
        "section",
        "v2-workflow-update-picker v2-workflow-source-panel",
      ),
      v199 = el("div", "v2-workflow-source-header");
    (v199["appendChild"](
      el("div", "v2-workflow-source-title", "选择历史工作流"),
    ),
      v199["appendChild"](
        el("div", "v2-workflow-source-scope", v196["length"] + " 个结果"),
      ),
      v198["appendChild"](v199));
    const v200 = el("input", "v2-workflow-search-input");
    ((v200["type"] = "search"),
      (v200["placeholder"] = "搜索工作流"),
      (v200["value"] = v195["updateSearchKeyword"] || ""),
      (v200["dataset"]["role"] = "workflow-update-search"),
      v198["appendChild"](v200));
    const v201 = el("div", "v2-workflow-update-list");
    if (v196["length"] === 0) {
      const v202 = el("div", "v2-workflow-source-empty");
      ((v202["textContent"] = cleanText(v195["updateSearchKeyword"])
        ? "没有匹配的工作流"
        : "还没有工作流"),
        v201["appendChild"](v202));
    } else
      for (const v203 of v196) {
        const v204 = el("button", "v2-workflow-update-item");
        ((v204["type"] = "button"),
          (v204["dataset"]["action"] = "workflow-update-select"),
          (v204["dataset"]["workflowId"] = v203["id"]),
          v204["classList"]["toggle"](
            "active",
            v195["updateTargetId"] === v203["id"],
          ),
          v204["append"](
            this["renderCover"](v203["cover"], "v2-workflow-update-thumb"),
          ));
        const v205 = el("div", "v2-workflow-update-info");
        (v205["append"](
          el("span", "", v203["name"]),
          el("small", "", formatDateTime(v203["updatedAt"])),
        ),
          v204["appendChild"](v205),
          v201["appendChild"](v204));
      }
    (v198["appendChild"](v201), v197["appendChild"](v198));
    const v206 = findWorkflowById(
        v194["workflows"]?.["items"] || [],
        v195["updateTargetId"],
      ),
      v207 = el("div", "v2-workflow-update-editor");
    if (v206) {
      const v208 = this["getWorkflowSourceCanvasState"](),
        v209 = this["getWorkflowSourceSummary"](v208),
        v210 = buildWorkflowSourceSummary(v206["workflowData"], {
          sourceLabel: "历史工作流",
          sourceName: v206["name"],
        }),
        v211 =
          v206["cover"] && v195["draft"]?.["cover"] === v206["cover"]
            ? {
                id: "existing-" + v206["id"],
                src: v206["cover"],
                nodeId: "",
                label: "当前封面",
              }
            : null;
      v207["appendChild"](
        this["renderWorkflowMetaForm"]({
          mode: "update",
          target: v206,
          candidates: this["getUpdateCoverCandidates"](v206, v211),
          sourceSummary: v195["updateMetaOnly"] ? null : v209,
          submitText: v195["saving"]
            ? "更新中"
            : v195["updateMetaOnly"]
              ? "保存信息"
              : v195["updateConfirmOpen"]
                ? "确认覆盖"
                : "确认更新",
        }),
      );
    } else
      v207["appendChild"](
        this["renderWorkflowMetaForm"]({
          mode: "update",
          candidates: [getDefaultWorkflowCoverCandidate()],
          submitText: "确认更新",
          disabled: true,
        }),
      );
    (v197["appendChild"](v207), this["modalBody"]["appendChild"](v197));
  }
  ["renderWorkflowSourcePanel"](v212, { title: title = "将保存的内容" } = {}) {
    const v213 = el("section", "v2-workflow-source-panel"),
      v214 = el("div", "v2-workflow-source-header");
    v214["appendChild"](el("div", "v2-workflow-source-title", title));
    const v215 = el(
      "div",
      "v2-workflow-source-scope",
      v212["sourceLabel"] || "整个画布",
    );
    if (v212["sourceName"])
      v215["appendChild"](el("span", "", " · " + v212["sourceName"]));
    (v214["appendChild"](v215), v213["appendChild"](v214));
    if (v212["isEmpty"]) {
      const v216 = el("div", "v2-workflow-source-empty");
      return (
        (v216["textContent"] =
          v212["sourceGroupId"] || v212["sourceLabel"] === "当前节点组"
            ? "当前组内没有可保存的节点"
            : "当前画布没有可保存的节点"),
        v213["appendChild"](v216),
        v213
      );
    }
    if (v212["typeCounts"]["length"] > 0) {
      const v217 = el("div", "v2-workflow-source-types");
      for (const v218 of v212["typeCounts"]["slice"](0, 6)) {
        v217["appendChild"](
          el(
            "span",
            "v2-workflow-source-type",
            v218["label"] + "\x20" + v218["count"],
          ),
        );
      }
      v213["appendChild"](v217);
    }
    const v219 = v212["previewItems"]["slice"](0, 4);
    if (v219["length"] > 0) {
      const v220 = el("div", "v2-workflow-source-preview");
      for (const v221 of v219) {
        v220["appendChild"](this["renderWorkflowContentItem"](v221));
      }
      (v212["previewItems"]["length"] > v219["length"] &&
        v220["appendChild"](
          el(
            "div",
            "v2-workflow-source-more",
            "还有 " +
              (v212["previewItems"]["length"] - v219["length"]) +
              " 个节点",
          ),
        ),
        v213["appendChild"](v220));
    }
    return v213;
  }
  ["renderWorkflowMetaForm"]({
    mode: v222,
    candidates: v223,
    submitText: v224,
    sourceSummary: sourceSummary = null,
    disabled: disabled = false,
  }) {
    const v225 = getState()["workflowUi"] || {},
      v226 = v225["draft"] || {},
      v227 =
        v222 === "create" || (v222 === "update" && !v225["updateMetaOnly"]),
      v228 = v227 && sourceSummary?.["isEmpty"],
      v229 = el("div", "v2-workflow-form");
    ((v229["dataset"]["workflowForm"] = v222),
      v229["classList"]["toggle"]("is-disabled", disabled === true));
    const v230 = el("div", "v2-workflow-cover-row");
    v230["appendChild"](
      this["renderCover"](v226["cover"], "v2-workflow-form-cover"),
    );
    const v231 = el("div", "v2-workflow-cover-choices");
    for (const v232 of v223) {
      const v233 = el("button", "v2-workflow-cover-choice");
      ((v233["type"] = "button"),
        (v233["dataset"]["action"] = "workflow-cover-select"),
        (v233["dataset"]["coverId"] = v232["id"]),
        (v233["dataset"]["coverSrc"] = v232["src"] || ""),
        v233["classList"]["toggle"](
          "active",
          v232["id"] === v226["selectedCoverId"],
        ),
        (v233["title"] = v232["label"]),
        v233["appendChild"](
          this["renderCover"](v232["src"], "v2-workflow-cover-choice-img"),
        ),
        v231["appendChild"](v233));
    }
    (v230["appendChild"](v231),
      v229["appendChild"](v230),
      v229["appendChild"](
        this["renderTextField"](
          "名称",
          "workflow-draft-name",
          v226["name"] || "",
          WORKFLOW_LIMITS["nameMax"],
        ),
      ),
      v229["appendChild"](this["renderTagsField"](v226["tags"] || [])),
      v229["appendChild"](this["renderNoteField"](v226["note"] || "")));
    const v234 = el("div", "v2-workflow-form-error");
    v234["dataset"]["role"] = "workflow-form-error";
    if (v225["error"]) v234["textContent"] = v225["error"];
    v229["appendChild"](v234);
    const v235 = el("div", "v2-workflow-form-footer"),
      v236 = el("button", "v2-workflow-secondary-btn", "取消");
    ((v236["type"] = "button"),
      (v236["dataset"]["action"] = "workflow-modal-close"));
    const v237 = el("button", "v2-workflow-primary-btn", v224);
    return (
      (v237["type"] = "button"),
      (v237["dataset"]["action"] =
        v222 === "update"
          ? "workflow-update-submit"
          : "workflow-create-submit"),
      (v237["disabled"] =
        disabled === true ||
        v225["saving"] === true ||
        !cleanText(v226["name"]) ||
        v228),
      v235["append"](v236, v237),
      v229["appendChild"](v235),
      v229
    );
  }
  ["renderTextField"](v238, v239, v240, v241) {
    const v242 = el("label", "v2-workflow-field");
    v242["appendChild"](el("span", "", v238));
    const v243 = el("input", "v2-workflow-input");
    return (
      (v243["type"] = "text"),
      (v243["value"] = v240 || ""),
      (v243["maxLength"] = v241),
      (v243["dataset"]["role"] = v239),
      v242["appendChild"](v243),
      v242
    );
  }
  ["renderNoteField"](v244) {
    const v245 = el("label", "v2-workflow-field v2-workflow-note-field");
    v245["appendChild"](el("span", "", "备注"));
    const v246 = el("textarea", "v2-workflow-textarea");
    return (
      (v246["maxLength"] = WORKFLOW_LIMITS["noteMax"]),
      (v246["value"] = v244 || ""),
      (v246["dataset"]["role"] = "workflow-draft-note"),
      (v246["placeholder"] = "用途、适用场景、操作步骤"),
      v245["appendChild"](v246),
      v245
    );
  }
  ["renderTagsField"](v247) {
    const v248 = el("div", "v2-workflow-field");
    v248["appendChild"](el("span", "", "标签"));
    const v249 = el("div", "v2-workflow-tag-editor");
    for (const v250 of v247) {
      const v251 = el("span", "v2-workflow-tag-chip");
      v251["appendChild"](document["createTextNode"](v250));
      const v252 = el("button", "", "×");
      ((v252["type"] = "button"),
        (v252["dataset"]["action"] = "workflow-tag-remove"),
        (v252["dataset"]["tag"] = v250),
        v251["appendChild"](v252),
        v249["appendChild"](v251));
    }
    const v253 = el("div", "v2-workflow-tag-input-row"),
      v254 = el("input", "v2-workflow-input v2-workflow-tag-input");
    ((v254["type"] = "text"),
      (v254["maxLength"] = WORKFLOW_LIMITS["tagLengthMax"]),
      (v254["placeholder"] =
        v247["length"] >= WORKFLOW_LIMITS["tagMax"]
          ? "标签已达上限"
          : "添加标签"),
      (v254["disabled"] = v247["length"] >= WORKFLOW_LIMITS["tagMax"]),
      (v254["value"] = getState()["workflowUi"]?.["tagDraft"] || ""),
      (v254["dataset"]["role"] = "workflow-tag-draft"));
    const v255 = el(
      "button",
      "v2-workflow-secondary-btn v2-workflow-tag-add-btn",
      "添加",
    );
    return (
      (v255["type"] = "button"),
      (v255["dataset"]["action"] = "workflow-tag-add"),
      (v255["disabled"] = v247["length"] >= WORKFLOW_LIMITS["tagMax"]),
      v253["append"](v254, v255),
      v248["append"](v249, v253),
      v248
    );
  }
  ["handleModalKeydown"](v256) {
    if (v256["key"] === "Escape") {
      this["closeModal"]();
      return;
    }
    if (v256["key"] !== "Enter") return;
    const v257 = v256["target"]?.["dataset"]?.["role"];
    if (v257 !== "workflow-tag-draft") return;
    (v256["preventDefault"](), this["addDraftTag"]());
  }
  ["handleModalInput"](v258) {
    const v259 = v258["target"],
      v260 = v259?.["dataset"]?.["role"];
    if (!v260) return;
    if (v260 === "workflow-draft-name")
      (workspaceStore["setWorkflowDraft"]({ name: v259["value"] || "" }),
        this["updateSubmitDisabled"]());
    else {
      if (v260 === "workflow-draft-note")
        workspaceStore["setWorkflowDraft"]({ note: v259["value"] || "" });
      else {
        if (v260 === "workflow-tag-draft")
          workspaceStore["setWorkflowUi"]({ tagDraft: v259["value"] || "" });
        else
          v260 === "workflow-update-search" &&
            (workspaceStore["setWorkflowUi"]({
              updateSearchKeyword: v259["value"] || "",
              updateConfirmOpen: false,
            }),
            this["renderModal"]());
      }
    }
  }
  ["handleModalClick"](v261) {
    const v262 = v261["target"]["closest"](".v2-workflow-modal-tab");
    if (v262?.["dataset"]?.["modalTab"]) {
      workspaceStore["setWorkflowUi"]({
        modalTab: v262["dataset"]["modalTab"],
        updateConfirmOpen: false,
        updateMetaOnly: false,
        error: null,
      });
      v262["dataset"]["modalTab"] === "create" &&
        this["resetCreateDraftFromCurrentSource"]();
      this["renderModal"]();
      return;
    }
    const v263 = v261["target"]["closest"]("[data-action]"),
      v264 = v263?.["dataset"]?.["action"];
    if (!v264) return;
    if (v264 === "workflow-cover-select") {
      const v265 = v263["dataset"]["coverId"],
        v266 =
          v265 === DEFAULT_WORKFLOW_COVER_ID
            ? ""
            : v263["dataset"]["coverSrc"] || "";
      (workspaceStore["setWorkflowDraft"]({
        selectedCoverId: v265,
        cover: v266,
      }),
        workspaceStore["setWorkflowUi"]({ updateConfirmOpen: false }),
        this["updateCoverSelectionUi"](v265, v266));
      return;
    }
    if (v264 === "workflow-tag-add") {
      this["addDraftTag"]();
      return;
    }
    if (v264 === "workflow-tag-remove") {
      this["removeDraftTag"](v263["dataset"]["tag"]);
      return;
    }
    if (v264 === "workflow-create-submit") {
      this["submitCreate"]();
      return;
    }
    if (v264 === "workflow-update-select") {
      this["selectUpdateTarget"](v263["dataset"]["workflowId"]);
      return;
    }
    v264 === "workflow-update-submit" && this["submitUpdate"]();
  }
  ["updateSubmitDisabled"]() {
    const v267 = this["modalBody"]?.["querySelector"](
      "[data-action=\x27workflow-create-submit\x27],\x20[data-action=\x27workflow-update-submit\x27]",
    );
    if (v267) {
      const v268 = getState()["workflowUi"] || {},
        v269 =
          v268["modalTab"] === "create" ||
          (v268["modalTab"] === "update" && !v268["updateMetaOnly"]),
        v270 =
          v269 &&
          this["getWorkflowSourceSummary"](
            this["getWorkflowSourceCanvasState"](),
          )["isEmpty"];
      v267["disabled"] =
        v268["saving"] === true || !cleanText(v268["draft"]?.["name"]) || v270;
    }
  }
  ["updateCoverSelectionUi"](v271, v272) {
    if (!this["modalBody"]) return;
    const v273 = cleanText(v271);
    for (const v274 of this["modalBody"]["querySelectorAll"](
      ".v2-workflow-cover-choice",
    )) {
      v274["classList"]["toggle"](
        "active",
        v274["dataset"]["coverId"] === v273,
      );
    }
    const v275 = this["modalBody"]["querySelector"](".v2-workflow-form-cover");
    if (!v275?.["parentNode"]) return;
    v275["replaceWith"](this["renderCover"](v272, "v2-workflow-form-cover"));
  }
  ["setFormError"](v276) {
    workspaceStore["setWorkflowUi"]({ error: v276 || null });
    const v277 = this["modalBody"]?.["querySelector"](
      "[data-role='workflow-form-error']",
    );
    if (v277) v277["textContent"] = v276 || "";
  }
  ["addDraftTag"]() {
    const v278 = getState()["workflowUi"] || {},
      v279 = cleanText(v278["tagDraft"])["slice"](
        0,
        WORKFLOW_LIMITS["tagLengthMax"],
      );
    if (!v279) return;
    const v280 = normalizeWorkflowTags([
      ...(v278["draft"]?.["tags"] || []),
      v279,
    ]);
    if (
      (v278["draft"]?.["tags"] || [])["length"] >= WORKFLOW_LIMITS["tagMax"]
    ) {
      this["setFormError"](
        "最多添加\x20" + WORKFLOW_LIMITS["tagMax"] + " 个标签",
      );
      return;
    }
    if (v280["length"] === (v278["draft"]?.["tags"] || [])["length"]) {
      this["setFormError"]("标签已存在");
      return;
    }
    (workspaceStore["setWorkflowDraft"]({ tags: v280 }),
      workspaceStore["setWorkflowUi"]({
        tagDraft: "",
        updateConfirmOpen: false,
        error: null,
      }),
      this["renderModal"]());
  }
  ["removeDraftTag"](v281) {
    const v282 = getState()["workflowUi"] || {},
      v283 = cleanText(v281)["toLowerCase"](),
      v284 = (v282["draft"]?.["tags"] || [])["filter"](
        (v285) => cleanText(v285)["toLowerCase"]() !== v283,
      );
    (workspaceStore["setWorkflowDraft"]({ tags: v284 }),
      workspaceStore["setWorkflowUi"]({
        updateConfirmOpen: false,
        error: null,
      }),
      this["renderModal"]());
  }
  ["selectUpdateTarget"](v286, { render: render = true } = {}) {
    const v287 = findWorkflowById(
      getState()["workflows"]?.["items"] || [],
      v286,
    );
    if (!v287) return;
    const v288 = getState()["workflowUi"] || {},
      v289 = v287["cover"]
        ? {
            id: "existing-" + v287["id"],
            src: v287["cover"],
            nodeId: "",
            label: "当前封面",
          }
        : null,
      v290 =
        this["getUpdateCoverCandidates"](
          v287,
          v288["updateMetaOnly"] ? v289 : null,
        )[0] || getDefaultWorkflowCoverCandidate(),
      v291 = v287["cover"] ? "existing-" + v287["id"] : v290["id"];
    (workspaceStore["setWorkflowUi"]({
      updateTargetId: v287["id"],
      updateConfirmOpen: false,
      tagDraft: "",
      error: null,
    }),
      workspaceStore["setWorkflowDraft"]({
        name: v287["name"],
        cover: v287["cover"] || v290["src"] || "",
        tags: v287["tags"] || [],
        note: v287["note"] || "",
        selectedCoverId: v291,
      }));
    if (render) this["renderModal"]();
  }
  async ["submitCreate"]() {
    const v292 = getState()["workflowUi"] || {};
    if (v292["saving"]) return;
    const v293 = v292["draft"] || {};
    if (!cleanText(v293["name"])) {
      this["setFormError"]("名称不能为空");
      return;
    }
    const v294 = this["getWorkflowSourceCanvasState"]();
    if (!Array["isArray"](v294["nodes"]) || v294["nodes"]["length"] === 0) {
      this["setFormError"](
        v292["sourceGroupId"]
          ? "当前组内没有可保存的节点"
          : "当前画布没有可保存的节点",
      );
      return;
    }
    (workspaceStore["setWorkflowSaving"](true), this["renderModal"]());
    try {
      const v295 = await saveNewWorkflowFromCanvas(v294, v293),
        v296 = this["modalBody"]?.["querySelector"](".v2-workflow-form-cover");
      (workspaceStore["upsertWorkflow"](v295),
        playWorkflowSaveFly({ sourceEl: v296 }),
        workspaceStore["closeWorkflowModal"](),
        this["renderModal"](),
        showToast("工作流已创建", "success"));
    } catch (v297) {
      (workspaceStore["setWorkflowSaving"](false),
        this["setFormError"](v297?.["message"] || "工作流保存失败"),
        this["renderModal"](),
        showToast("工作流保存失败", "error"));
    }
  }
  async ["submitUpdate"]() {
    const v298 = getState(),
      v299 = v298["workflowUi"] || {};
    if (v299["saving"]) return;
    const v300 = findWorkflowById(
      v298["workflows"]?.["items"] || [],
      v299["updateTargetId"],
    );
    if (!v300) {
      this["setFormError"]("请选择要更新的工作流");
      return;
    }
    if (!cleanText(v299["draft"]?.["name"])) {
      this["setFormError"]("名称不能为空");
      return;
    }
    if (v299["updateMetaOnly"]) {
      (workspaceStore["setWorkflowSaving"](true), this["renderModal"]());
      try {
        const v301 = await saveWorkflowMeta(v300, v299["draft"] || {}),
          v302 = this["modalBody"]?.["querySelector"](
            ".v2-workflow-form-cover",
          );
        (workspaceStore["upsertWorkflow"](v301),
          playWorkflowSaveFly({ sourceEl: v302 }),
          workspaceStore["closeWorkflowModal"](),
          this["renderModal"](),
          showToast("工作流信息已保存", "success"));
      } catch (v303) {
        (workspaceStore["setWorkflowSaving"](false),
          this["setFormError"](v303?.["message"] || "工作流信息保存失败"),
          this["renderModal"](),
          showToast("工作流信息保存失败", "error"));
      }
      return;
    }
    const v304 = this["getWorkflowSourceCanvasState"]();
    if (!Array["isArray"](v304["nodes"]) || v304["nodes"]["length"] === 0) {
      this["setFormError"](
        v299["sourceGroupId"]
          ? "当前组内没有可保存的节点"
          : "当前画布没有可保存的节点",
      );
      return;
    }
    if (!v299["updateConfirmOpen"]) {
      (workspaceStore["setWorkflowUi"]({
        updateConfirmOpen: true,
        error: null,
      }),
        this["renderModal"]());
      return;
    }
    (workspaceStore["setWorkflowSaving"](true), this["renderModal"]());
    try {
      const v305 = await saveUpdatedWorkflowFromCanvas(v300["id"], v304, {
          ...(v299["draft"] || {}),
          existingWorkflow: v300,
        }),
        v306 = this["modalBody"]?.["querySelector"](".v2-workflow-form-cover");
      (workspaceStore["upsertWorkflow"](v305),
        playWorkflowSaveFly({ sourceEl: v306 }),
        workspaceStore["closeWorkflowModal"](),
        this["renderModal"](),
        showToast("工作流已更新", "success"));
    } catch (v307) {
      (workspaceStore["setWorkflowSaving"](false),
        this["setFormError"](v307?.["message"] || "工作流更新失败"),
        this["renderModal"](),
        showToast("工作流更新失败", "error"));
    }
  }
  ["getCanvasCenterWorld"]() {
    const { viewport: v308 } = getState(),
      v309 = window["innerWidth"] / 2,
      v310 = window["innerHeight"] / 2,
      v311 =
        document["documentElement"]?.["clientWidth"] ||
        window["innerWidth"] ||
        0,
      v312 =
        document["documentElement"]?.["clientHeight"] ||
        window["innerHeight"] ||
        0;
    if (!v311 || !v312) return screenToWorld(v309, v310, v308);
    let v313 = 0,
      v314 = 0,
      v315 = v311,
      v316 = v312;
    const v317 = [],
      v318 = document["querySelector"]("header");
    if (v318) v317["push"](v318);
    const v319 = document["querySelector"](".sidebar-floating");
    if (v319) v317["push"](v319);
    this["sidebarPanel"]?.["classList"]?.["contains"]("show") &&
      v317["push"](this["sidebarPanel"]);
    const v320 = 8;
    for (const v321 of v317) {
      if (!v321?.["isConnected"]) continue;
      const v322 = v321["getBoundingClientRect"](),
        v323 = Math["max"](v313, v322["left"]),
        v324 = Math["max"](v314, v322["top"]),
        v325 = Math["min"](v315, v322["right"]),
        v326 = Math["min"](v316, v322["bottom"]);
      if (v325 <= v323 || v326 <= v324) continue;
      if (v322["left"] <= v313 + v320 && v322["right"] > v313 + v320) {
        v313 = Math["max"](v313, v322["right"]);
        continue;
      }
      if (v322["right"] >= v315 - v320 && v322["left"] < v315 - v320) {
        v315 = Math["min"](v315, v322["left"]);
        continue;
      }
      if (v322["top"] <= v314 + v320 && v322["bottom"] > v314 + v320) {
        v314 = Math["max"](v314, v322["bottom"]);
        continue;
      }
      v322["bottom"] >= v316 - v320 &&
        v322["top"] < v316 - v320 &&
        (v316 = Math["min"](v316, v322["top"]));
    }
    const v327 = v315 - v313,
      v328 = v316 - v314,
      v329 = v327 > 40 ? v313 + v327 / 2 : v309,
      v330 = v328 > 40 ? v314 + v328 / 2 : v310;
    return screenToWorld(v329, v330, v308);
  }
  async ["applyWorkflow"](v331) {
    const v332 = getState(),
      v333 = v332["workflowUi"] || {};
    if (v333["applyingWorkflowId"]) return;
    const v334 = findWorkflowById(v332["workflows"]?.["items"] || [], v331);
    if (!v334) {
      showToast("工作流不存在", "error");
      return;
    }
    workspaceStore["setWorkflowApplying"](v334["id"]);
    try {
      const v335 = applyWorkflowToCanvas(v334, this["getCanvasCenterWorld"]());
      if (v335["nodes"]["length"] === 0) {
        showToast("这个工作流没有可应用的节点", "warn");
        return;
      }
      (graphStore["batch"](() => {
        for (const v336 of v335["nodes"]) {
          graphStore["addNode"](v336);
        }
        for (const v337 of v335["edges"]) {
          graphStore["addEdge"](v337);
        }
        graphStore["setSelectedNodes"](
          v335["nodes"]["map"]((v338) => v338["id"]),
        );
      }),
        commit());
      const v339 = Date["now"]();
      (workspaceStore["markWorkflowUsed"](v334["id"], v339),
        saveWorkflowUsage({ ...v334, lastUsedAt: v339 }, v339)["catch"](
          () => {},
        ),
        showToast("工作流已应用到画布", "success"));
    } catch (v340) {
      showToast(v340?.["message"] || "工作流应用失败", "error");
    } finally {
      workspaceStore["setWorkflowApplying"](null);
    }
  }
}
export const workflowManager = new WorkflowManager();

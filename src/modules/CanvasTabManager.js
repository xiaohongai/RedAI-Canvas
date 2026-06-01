import { clearRendererCache } from "../core/renderer.js";
import { commit } from "./history.js";
import appStore from "../core/stores/appStore.js";
import { isGenerationTaskTerminalStatus } from "../core/generationTaskLifecycle.js";
import { startVideoThumbBackfill } from "./videoThumbBackfill.js";
import { sanitizeMultiCanvasDataForPersistence } from "../utils/thumbnailPersistence.js";
import { createStableSignature } from "../utils/stableSignature.js";
import { flushAllPendingPromptHtmlCommits } from "./nodePromptShared.js";
function markPerf(v0) {
  if (typeof performance?.["mark"] !== "function") return;
  performance["mark"](v0);
}
function measurePerf(v1, v2, v3) {
  if (typeof performance?.["measure"] !== "function") return;
  try {
    performance["measure"](v1, v2, v3);
  } catch {}
}
function createEmptyCanvasSnapshot() {
  return {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1.1 },
    assets: [],
    _persistRevHint: 0,
  };
}
function cloneMultiDataSnapshot(v4) {
  if (typeof structuredClone === "function")
    try {
      return structuredClone(v4);
    } catch {}
  try {
    return JSON["parse"](JSON["stringify"](v4));
  } catch {
    return { canvases: [], activeCanvasId: null };
  }
}
function isRecoverableTaskStatus(v5) {
  const v6 = String(v5 || "")["trim"]();
  return !v6 || !isGenerationTaskTerminalStatus(v6);
}
function markRecoveringGenerationNode(v7) {
  if (!v7 || typeof v7 !== "object") return v7;
  if (!v7["generationStartTime"] || v7["generationDuration"] != null) return v7;
  const v8 = { ...v7 };
  let v9 = false;
  String(v8["rhTaskId"] || "")["trim"]() &&
    isRecoverableTaskStatus(v8["rhTaskStatus"]) &&
    ((v8["rhTaskRecovering"] = true), (v9 = true));
  String(v8["dreaminaSubmitId"] || "")["trim"]() &&
    isRecoverableTaskStatus(v8["dreaminaTaskStatus"]) &&
    isRecoverableTaskStatus(v8["dreaminaTaskPhase"]) &&
    ((v8["dreaminaTaskRecovering"] = true), (v9 = true));
  String(v8["asyncTaskId"] || "")["trim"]() &&
    isRecoverableTaskStatus(v8["asyncTaskStatus"]) &&
    ((v8["asyncTaskRecovering"] = true), (v9 = true));
  if (!v9) return v7;
  return (
    (v8["isGenerating"] = true),
    (v8["jobStatus"] = isRecoverableTaskStatus(v8["jobStatus"])
      ? "running"
      : v8["jobStatus"]),
    (v8["generationDuration"] = null),
    v8
  );
}
function markRecoveringGenerationSnapshot(v10) {
  if (!v10 || typeof v10 !== "object") return v10;
  if (Array["isArray"](v10["nodes"]))
    return {
      ...v10,
      nodes: v10["nodes"]["map"]((v11) => markRecoveringGenerationNode(v11)),
    };
  if (v10["nodes"] && typeof v10["nodes"] === "object")
    return {
      ...v10,
      nodes: Object["fromEntries"](
        Object["entries"](v10["nodes"])["map"](([v12, v13]) => [
          v12,
          markRecoveringGenerationNode(v13),
        ]),
      ),
    };
  return v10;
}
function getCanvasNodesList(v14 = {}) {
  const v15 = v14?.["nodes"];
  if (Array["isArray"](v15)) return v15;
  if (v15 && typeof v15 === "object") return Object["values"](v15);
  return [];
}
function hasLiveGenerationNode(v16 = {}) {
  if (!v16 || typeof v16 !== "object") return false;
  if (v16["isGenerating"] !== true || v16["generationDuration"] != null)
    return false;
  const v17 = [
    v16["jobStatus"],
    v16["rhTaskStatus"],
    v16["dreaminaTaskStatus"],
    v16["dreaminaTaskPhase"],
    v16["asyncTaskStatus"],
    v16["mediaTaskStatus"],
  ];
  return !v17["some"]((v18) => {
    const v19 = String(v18 || "")
      ["trim"]()
      ["toLowerCase"]();
    if (!v19 || v19 === "idle") return false;
    return isGenerationTaskTerminalStatus(v19);
  });
}
function canvasHasLiveGeneration(v20 = {}) {
  return getCanvasNodesList(v20)["some"]((v21) => hasLiveGenerationNode(v21));
}
export function buildTabsRenderSignature(v22 = [], v23 = null) {
  return (
    (v23 || "") +
    "::" +
    (Array["isArray"](v22) ? v22 : [])
      ["map"]((v24) => (v24?.["id"] || "") + ":" + (v24?.["name"] || ""))
      ["join"]("|")
  );
}
const CanvasTabManager = {
  _canvases: [],
  _activeId: null,
  _lastPersistRevByCanvas: new Map(),
  _savedSignatureByCanvas: new Map(),
  _lastTabsRenderSignature: "",
  _tabContainerBound: false,
  _getStorePersistRev() {
    return Number(appStore["getStateRaw"]()?.["_persistRev"] || 0);
  },
  _rememberCanvasPersistRev(v25 = this["_activeId"]) {
    if (!v25) return;
    this["_lastPersistRevByCanvas"]["set"](v25, this["_getStorePersistRev"]());
  },
  _scheduleWorkspaceCacheSave() {
    return window["_triggerLocalCacheSave"]?.();
  },
  _scheduleWorkspaceMetaCacheSave() {
    return (
      window["_triggerLocalCacheMetaSave"]?.() ??
      window["_triggerLocalCacheSave"]?.()
    );
  },
  _markCanvasMetaDirty() {
    return this["_scheduleWorkspaceMetaCacheSave"]();
  },
  _notifyDirtyStateChanged() {
    if (
      typeof window === "undefined" ||
      typeof window["dispatchEvent"] !== "function"
    )
      return;
    if (typeof CustomEvent === "function") {
      window["dispatchEvent"](new CustomEvent("aicanvas:dirty-state-changed"));
      return;
    }
    typeof Event === "function" &&
      window["dispatchEvent"](new Event("aicanvas:dirty-state-changed"));
  },
  _getTabsRenderSignature() {
    return buildTabsRenderSignature(this["_canvases"], this["_activeId"]);
  },
  _buildCanvasSavedSignature(v26) {
    return createStableSignature({
      id: v26?.["id"] ?? null,
      name: v26?.["name"] ?? "未命名画布",
      nodes: Array["isArray"](v26?.["nodes"])
        ? v26["nodes"]
        : v26?.["nodes"] && typeof v26["nodes"] === "object"
          ? v26["nodes"]
          : [],
      edges: Array["isArray"](v26?.["edges"])
        ? v26["edges"]
        : v26?.["edges"] && typeof v26["edges"] === "object"
          ? v26["edges"]
          : [],
      viewport:
        v26?.["viewport"] && typeof v26["viewport"] === "object"
          ? v26["viewport"]
          : { x: 0, y: 0, zoom: 1.1 },
      assets: Array["isArray"](v26?.["assets"]) ? v26["assets"] : [],
    });
  },
  _resetSavedCanvasSignatures({ markClean: markClean = true } = {}) {
    this["_savedSignatureByCanvas"] = new Map();
    if (!markClean) return;
    this["_canvases"]["forEach"]((v27) => {
      if (!v27?.["id"]) return;
      this["_savedSignatureByCanvas"]["set"](
        v27["id"],
        this["_buildCanvasSavedSignature"](v27),
      );
    });
  },
  _removeTabContextMenu() {
    const v28 = document["getElementById"]("tab-context-menu");
    if (v28) v28["remove"]();
  },
  _startTabRename(v29) {
    if (!v29) return;
    ((v29["contentEditable"] = "true"), v29["focus"]());
    const v30 = document["createRange"]();
    v30["selectNodeContents"](v29);
    const v31 = window["getSelection"]?.();
    if (!v31) return;
    (v31["removeAllRanges"](), v31["addRange"](v30));
  },
  _commitTabRename(v32, { deferRender: deferRender = false } = {}) {
    if (!v32) return;
    const v33 = v32["closest"](".canvas-tab"),
      v34 = v33?.["dataset"]?.["id"];
    if (!v34) return;
    const v35 = this["_canvases"]["find"]((v36) => v36["id"] === v34);
    if (!v35) return;
    const v37 = v35["name"],
      v38 = String(v32["textContent"] || "")["trim"]();
    ((v32["contentEditable"] = "false"),
      this["renameCanvas"](v34, v38),
      (v32["textContent"] =
        this["_canvases"]["find"]((v39) => v39["id"] === v34)?.["name"] ||
        v37));
    if (deferRender) {
      window["setTimeout"](() => this["renderTabs"](), 0);
      return;
    }
    this["renderTabs"]();
  },
  _bindTabContainerEvents(v40) {
    if (this["_tabContainerBound"] || !v40) return;
    this["_tabContainerBound"] = true;
    let v41 = "",
      v42 = 0;
    const v43 = (v44) => {
        const v45 = v44["target"]["closest"](".canvas-tab");
        if (!v45 || !v40["contains"](v45)) return "";
        return v45["dataset"]["id"] || "";
      },
      v46 = (v47) => {
        if (v47["button"] !== 1) return false;
        const v48 = v43(v47);
        if (!v48) return false;
        return (
          v47["preventDefault"](),
          v47["stopPropagation"](),
          (v41 = v48),
          (v42 = Date["now"]()),
          void this["deleteCanvas"](v48),
          true
        );
      };
    (v40["addEventListener"]("click", (v49) => {
      const v50 = v49["target"]["closest"](".canvas-tab");
      if (!v50 || !v40["contains"](v50)) return;
      const v51 = v50["dataset"]["id"];
      if (!v51) return;
      const v52 = this["_canvases"]["find"]((v53) => v53["id"] === v51);
      if (!v52) return;
      const v54 = v49["target"]["closest"](".canvas-tab-close");
      if (v54) {
        (v49["stopPropagation"](), void this["deleteCanvas"](v51));
        return;
      }
      const v55 = v50["querySelector"](".canvas-tab-name"),
        v56 = v51 === this["_activeId"];
      if (v56) {
        if (v55?.["contentEditable"] === "true") return;
        this["_startTabRename"](v55);
        return;
      }
      this["switchTo"](v51);
    }),
      v40["addEventListener"]("pointerdown", (v57) => {
        v46(v57);
      }),
      v40["addEventListener"]("auxclick", (v58) => {
        if (v58["button"] !== 1) return;
        const v59 = v43(v58);
        if (!v59) return;
        (v58["preventDefault"](), v58["stopPropagation"]());
        if (v59 === v41 && Date["now"]() - v42 < 800) return;
        ((v41 = v59), (v42 = Date["now"]()), void this["deleteCanvas"](v59));
      }),
      v40["addEventListener"]("contextmenu", async (v60) => {
        const v61 = v60["target"]["closest"](".canvas-tab");
        if (!v61 || !v40["contains"](v61)) return;
        const v62 = v61["dataset"]["id"];
        if (!v62) return;
        const v63 = this["_canvases"]["find"]((v64) => v64["id"] === v62);
        if (!v63) return;
        (v60["preventDefault"](), v60["stopPropagation"]());
        const v65 = () => {
          this["_showTabContextMenu"](v63, {
            clientX: v60["clientX"],
            clientY: v60["clientY"],
          });
        };
        (v62 !== this["_activeId"] && (await this["switchTo"](v62)), v65());
      }),
      v40["addEventListener"]("focusout", (v66) => {
        const v67 = v66["target"]["closest"](".canvas-tab-name");
        if (!v67 || !v40["contains"](v67)) return;
        if (v67["contentEditable"] !== "true") return;
        this["_commitTabRename"](v67, { deferRender: true });
      }),
      v40["addEventListener"]("keydown", (v68) => {
        const v69 = v68["target"]["closest"](".canvas-tab-name");
        if (!v69 || !v40["contains"](v69)) return;
        if (v69["contentEditable"] !== "true") return;
        if (v68["key"] === "Enter") {
          (v68["preventDefault"](), v69["blur"]());
          return;
        }
        if (v68["key"] === "Escape") {
          v68["preventDefault"]();
          const v70 = v69["closest"](".canvas-tab")?.["dataset"]?.["id"],
            v71 = this["_canvases"]["find"]((v72) => v72["id"] === v70);
          if (v71) v69["textContent"] = v71["name"];
          v69["blur"]();
        }
      }));
  },
  _showTabContextMenu(
    v73,
    { clientX: clientX = 0, clientY: clientY = 0 } = {},
  ) {
    if (!v73) return;
    this["_removeTabContextMenu"]();
    const v74 = document["createElement"]("div");
    ((v74["id"] = "tab-context-menu"),
      (v74["className"] = "v2-dropdown-menu open"),
      (v74["style"]["position"] = "fixed"),
      (v74["style"]["left"] = clientX + "px"),
      (v74["style"]["top"] = clientY + "px"),
      (v74["style"]["zIndex"] = 9999),
      (v74["style"]["minWidth"] = "120px"));
    const v75 = "http://www.w3.org/2000/svg",
      v76 = () => {
        const v77 = document["createElementNS"](v75, "svg");
        return (
          v77["setAttribute"]("width", "14"),
          v77["setAttribute"]("height", "14"),
          v77["setAttribute"]("viewBox", "0 0 24 24"),
          v77["setAttribute"]("fill", "none"),
          v77["setAttribute"]("stroke", "currentColor"),
          v77["setAttribute"]("stroke-width", "2"),
          v77
        );
      },
      v78 = (() => {
        const v79 = v76(),
          v80 = document["createElementNS"](v75, "path");
        v80["setAttribute"](
          "d",
          "M19\x2021H5a2\x202\x200\x200\x201-2-2V5a2\x202\x200\x200\x201\x202-2h11l5\x205v11a2\x202\x200\x200\x201-2\x202z",
        );
        const v81 = document["createElementNS"](v75, "polyline");
        v81["setAttribute"](
          "points",
          "17\x2021\x2017\x2013\x207\x2013\x207\x2021",
        );
        const v82 = document["createElementNS"](v75, "polyline");
        return (
          v82["setAttribute"]("points", "7 3 7 8 15 8"),
          v79["appendChild"](v80),
          v79["appendChild"](v81),
          v79["appendChild"](v82),
          v79
        );
      })(),
      v83 = (() => {
        const v84 = v76(),
          v85 = document["createElementNS"](v75, "path");
        v85["setAttribute"](
          "d",
          "M14\x202H6a2\x202\x200\x200\x200-2\x202v16a2\x202\x200\x200\x200\x202\x202h12a2\x202\x200\x200\x200\x202-2V8z",
        );
        const v86 = document["createElementNS"](v75, "polyline");
        v86["setAttribute"]("points", "14 2 14 8 20 8");
        const v87 = document["createElementNS"](v75, "line");
        (v87["setAttribute"]("x1", "12"),
          v87["setAttribute"]("y1", "18"),
          v87["setAttribute"]("x2", "12"),
          v87["setAttribute"]("y2", "12"));
        const v88 = document["createElementNS"](v75, "line");
        return (
          v88["setAttribute"]("x1", "9"),
          v88["setAttribute"]("y1", "15"),
          v88["setAttribute"]("x2", "15"),
          v88["setAttribute"]("y2", "15"),
          v84["appendChild"](v85),
          v84["appendChild"](v86),
          v84["appendChild"](v87),
          v84["appendChild"](v88),
          v84
        );
      })(),
      v89 = (() => {
        const v90 = v76(),
          v91 = document["createElementNS"](v75, "polyline");
        v91["setAttribute"]("points", "3\x206\x205\x206\x2021\x206");
        const v92 = document["createElementNS"](v75, "path");
        return (
          v92["setAttribute"](
            "d",
            "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
          ),
          v90["appendChild"](v91),
          v90["appendChild"](v92),
          v90
        );
      })(),
      v93 = (v94, v95, v96, v97 = false) => {
        const v98 = document["createElement"]("div");
        v98["className"] = "v2-menu-row";
        if (v97) v98["style"]["color"] = "var(--red)";
        const v99 = document["createElement"]("span");
        ((v99["className"] = "v2-menu-icon"),
          v99["appendChild"](v95["cloneNode"](true)));
        const v100 = document["createElement"]("span");
        ((v100["className"] = "v2-menu-text"),
          (v100["textContent"] = v94),
          v98["appendChild"](v99),
          v98["appendChild"](v100),
          v98["addEventListener"]("pointerdown", (v101) => {
            (v101["stopPropagation"](), v74["remove"](), v96());
          }),
          v98["addEventListener"]("contextmenu", (v102) =>
            v102["preventDefault"](),
          ),
          v74["appendChild"](v98));
      };
    (v93("保存", v78, () => {
      if (window["_v2SaveProject"]) window["_v2SaveProject"](v73["name"]);
    }),
      v93("另存为...", v83, () => {
        if (
          window["electronAPI"]?.["project"] &&
          typeof window["_v2SaveProjectAsLocal"] === "function"
        ) {
          window["_v2SaveProjectAsLocal"]();
          return;
        }
        const v103 =
            this["getMultiDataSnapshot"]({ sanitizeForPersistence: true }) ||
            {},
          v104 = new Blob([JSON["stringify"](v103, null, 2)], {
            type: "application/json",
          }),
          v105 = URL["createObjectURL"](v104),
          v106 = document["createElement"]("a");
        ((v106["href"] = v105),
          (v106["download"] = v73["name"] + ".json"),
          document["body"]["appendChild"](v106),
          v106["click"](),
          document["body"]["removeChild"](v106),
          URL["revokeObjectURL"](v105),
          window["showToast"]?.("工作流已下载：" + v73["name"] + ".json"));
      }));
    const v107 = document["createElement"]("div");
    ((v107["className"] = "v2-menu-sep"),
      v74["appendChild"](v107),
      v93(
        "删除",
        v89,
        () => {
          void this["deleteCanvas"](v73["id"]);
        },
        true,
      ),
      document["body"]["appendChild"](v74));
    const v108 = (v109) => {
      !v74["contains"](v109["target"]) &&
        (v74["remove"](),
        document["removeEventListener"]("pointerdown", v108, true));
    };
    requestAnimationFrame(() =>
      document["addEventListener"]("pointerdown", v108, true),
    );
  },
  _clearCanvasSurface() {
    clearRendererCache();
    const v110 = document["getElementById"]("v2-canvas");
    if (!v110) return;
    Array["from"](v110["children"])["forEach"]((v111) => {
      if (v111["classList"]["contains"]("v2-node")) v111["remove"]();
    });
  },
  _buildCanvasRecord(v112 = {}, v113 = {}) {
    const v114 = createEmptyCanvasSnapshot(),
      v115 = Number["isFinite"](v112?.["_persistRevHint"])
        ? v112["_persistRevHint"]
        : Number["isFinite"](v113?.["_persistRevHint"])
          ? v113["_persistRevHint"]
          : v114["_persistRevHint"];
    return {
      ...v112,
      nodes: Array["isArray"](v113?.["nodes"])
        ? v113["nodes"]
        : v113?.["nodes"] && typeof v113["nodes"] === "object"
          ? v113["nodes"]
          : v114["nodes"],
      edges: Array["isArray"](v113?.["edges"])
        ? v113["edges"]
        : v113?.["edges"] && typeof v113["edges"] === "object"
          ? v113["edges"]
          : v114["edges"],
      viewport:
        v113?.["viewport"] && typeof v113["viewport"] === "object"
          ? { ...v113["viewport"] }
          : { ...v114["viewport"] },
      assets: Array["isArray"](v113?.["assets"])
        ? v113["assets"]
        : v114["assets"],
      _persistRevHint: v115,
    };
  },
  _hydrateCanvasSnapshot(
    v116,
    { preserveLiveGeneration: preserveLiveGeneration = false } = {},
  ) {
    (markPerf("hydrateTrustedSnapshot:start"),
      appStore["hydrateTrustedSnapshot"](v116, {
        preserveLiveGeneration: preserveLiveGeneration,
      }),
      markPerf("hydrateTrustedSnapshot:end"),
      measurePerf(
        "hydrateTrustedSnapshot",
        "hydrateTrustedSnapshot:start",
        "hydrateTrustedSnapshot:end",
      ),
      this["_rememberCanvasPersistRev"]());
  },
  hydrateActiveCanvasSnapshot(v117) {
    if (!this["_activeId"]) return;
    const v118 = this["_canvases"]["findIndex"](
      (v119) => v119["id"] === this["_activeId"],
    );
    if (v118 === -1) return;
    ((this["_canvases"][v118] = this["_buildCanvasRecord"](
      this["_canvases"][v118],
      v117,
    )),
      this["_clearCanvasSurface"](),
      this["_hydrateCanvasSnapshot"](this["_canvases"][v118]));
  },
  init(v120, { markClean: markClean = true } = {}) {
    ((this["_canvases"] = Array["isArray"](v120["canvases"])
      ? v120["canvases"]["map"]((v121) =>
          this["_buildCanvasRecord"](v121, v121),
        )
      : []),
      (this["_lastPersistRevByCanvas"] = new Map()),
      (this["_savedSignatureByCanvas"] = new Map()),
      (this["_lastTabsRenderSignature"] = ""));
    if (this["_canvases"]["length"] === 0) {
      const v122 = "canvas_default_" + Date["now"]();
      (this["_canvases"]["push"]({
        id: v122,
        name: "默认画布",
        ...createEmptyCanvasSnapshot(),
      }),
        (this["_activeId"] = v122),
        this["_hydrateCanvasSnapshot"](this["_canvases"][0]));
    } else {
      this["_activeId"] =
        v120["activeCanvasId"] || (this["_canvases"][0]?.["id"] ?? null);
      const v123 =
        this["_canvases"]["find"]((v124) => v124["id"] === this["_activeId"]) ||
        this["_canvases"][0];
      v123 && this["_hydrateCanvasSnapshot"](v123);
    }
    (this["_resetSavedCanvasSignatures"]({ markClean: markClean }),
      this["renderTabs"](),
      startVideoThumbBackfill(),
      this["_notifyDirtyStateChanged"]());
  },
  _flushCurrentCanvas() {
    if (!this["_activeId"]) return;
    const v125 = this["_canvases"]["findIndex"](
      (v126) => v126["id"] === this["_activeId"],
    );
    if (v125 === -1) return;
    flushAllPendingPromptHtmlCommits();
    const v127 = this["_getStorePersistRev"]();
    if (this["_lastPersistRevByCanvas"]["get"](this["_activeId"]) === v127)
      return;
    const v128 = markRecoveringGenerationSnapshot(appStore["serialize"]()),
      v129 = this["_buildCanvasRecord"](this["_canvases"][v125], v128);
    ((v129["_persistRevHint"] = v127),
      (this["_canvases"][v125] = v129),
      this["_lastPersistRevByCanvas"]["set"](this["_activeId"], v127));
  },
  async switchTo(v130) {
    if (v130 === this["_activeId"]) return;
    const v131 = this["_canvases"]["find"]((v132) => v132["id"] === v130);
    if (!v131) return;
    return (
      this["_flushCurrentCanvas"](),
      this["_clearCanvasSurface"](),
      (this["_activeId"] = v130),
      this["_hydrateCanvasSnapshot"](v131, {
        preserveLiveGeneration: canvasHasLiveGeneration(v131),
      }),
      commit(),
      this["renderTabs"](),
      startVideoThumbBackfill(),
      this["_markCanvasMetaDirty"](),
      this["_notifyDirtyStateChanged"](),
      true
    );
  },
  addCanvas() {
    (this["_flushCurrentCanvas"](), this["_clearCanvasSurface"]());
    const v133 = "canvas_" + Date["now"](),
      v134 = "画布 " + (this["_canvases"]["length"] + 1);
    return (
      this["_canvases"]["push"]({
        id: v133,
        name: v134,
        ...createEmptyCanvasSnapshot(),
      }),
      (this["_activeId"] = v133),
      this["_hydrateCanvasSnapshot"](createEmptyCanvasSnapshot()),
      commit(),
      this["renderTabs"](),
      startVideoThumbBackfill(),
      this["_markCanvasMetaDirty"](),
      this["_notifyDirtyStateChanged"](),
      true
    );
  },
  async _confirmDeleteDirtyCanvas(
    v135,
    { skipDirtyConfirm: skipDirtyConfirm = false } = {},
  ) {
    if (skipDirtyConfirm || !this["isCanvasDirty"](v135?.["id"])) return true;
    return this["_showUnsavedDeleteConfirm"](v135);
  },
  _showUnsavedDeleteConfirm(v136) {
    if (typeof document === "undefined" || !document["body"])
      return Promise["resolve"](false);
    return (
      document["getElementById"]("canvas-delete-confirm-overlay")?.["remove"](),
      new Promise((v137) => {
        const v138 = document["createElement"]("div");
        ((v138["id"] = "canvas-delete-confirm-overlay"),
          (v138["className"] = "custom-confirm-overlay"));
        const v139 = document["createElement"]("div");
        v139["className"] = "custom-confirm-box";
        const v140 = document["createElement"]("div");
        ((v140["className"] = "confirm-title"),
          (v140["textContent"] = "删除未保存画布？"));
        const v141 = document["createElement"]("div");
        ((v141["className"] = "confirm-msg"),
          (v141["textContent"] =
            "「" +
            (v136?.["name"] || "未命名画布") +
            "」有未保存改动，删除后这些改动会丢失。"));
        const v142 = document["createElement"]("div");
        v142["className"] = "confirm-btns";
        const v143 = document["createElement"]("button");
        ((v143["type"] = "button"),
          (v143["className"] = "confirm-btn confirm-cancel"),
          (v143["textContent"] = "取消"));
        const v144 = document["createElement"]("button");
        ((v144["type"] = "button"),
          (v144["className"] = "confirm-btn confirm-ok"),
          (v144["textContent"] = "删除"),
          v142["appendChild"](v143),
          v142["appendChild"](v144),
          v139["appendChild"](v140),
          v139["appendChild"](v141),
          v139["appendChild"](v142),
          v138["appendChild"](v139),
          document["body"]["appendChild"](v138));
        let v145 = false;
        const v146 = (v147) => {
            if (v145) return;
            ((v145 = true),
              document["removeEventListener"]("keydown", v148, true),
              v138["remove"](),
              v137(v147));
          },
          v148 = (v149) => {
            if (v149["key"] === "Escape") {
              (v149["preventDefault"](), v146(false));
              return;
            }
            v149["key"] === "Enter" &&
              !v149["isComposing"] &&
              (v149["preventDefault"](), v146(true));
          };
        (v138["addEventListener"]("click", (v150) => {
          if (v150["target"] === v138) v146(false);
        }),
          v143["addEventListener"]("click", () => v146(false)),
          v144["addEventListener"]("click", () => v146(true)),
          document["addEventListener"]("keydown", v148, true),
          v143["focus"]?.());
      })
    );
  },
  async deleteCanvas(v151, v152 = {}) {
    if (this["_canvases"]["length"] <= 1)
      return (window["showToast"]("至少保留一个画布页面", "warn"), false);
    const v153 = this["_canvases"]["findIndex"]((v154) => v154["id"] === v151);
    if (v153 === -1) return false;
    const v155 = this["_canvases"][v153],
      v156 = await this["_confirmDeleteDirtyCanvas"](v155, v152);
    if (!v156) return false;
    (this["_canvases"]["splice"](v153, 1),
      this["_lastPersistRevByCanvas"]["delete"](v151),
      this["_savedSignatureByCanvas"]["delete"](v151));
    if (this["_activeId"] === v151) {
      const v157 = this["_canvases"][Math["max"](0, v153 - 1)];
      ((this["_activeId"] = v157["id"]),
        this["_clearCanvasSurface"](),
        this["_hydrateCanvasSnapshot"](v157, {
          preserveLiveGeneration: canvasHasLiveGeneration(v157),
        }),
        commit());
    }
    return (
      this["renderTabs"](),
      startVideoThumbBackfill(),
      this["_markCanvasMetaDirty"](),
      this["_notifyDirtyStateChanged"](),
      true
    );
  },
  renameCanvas(v158, v159) {
    const v160 = this["_canvases"]["find"]((v161) => v161["id"] === v158);
    if (!v160) return;
    const v162 = String(v159 || "")["trim"](),
      v163 = String(v160["name"] || "")["trim"]();
    if (!v162 || v162 === v163) return;
    ((v160["name"] = v162),
      this["_markCanvasMetaDirty"](),
      this["_notifyDirtyStateChanged"]());
  },
  markCanvasClean(v164 = this["_activeId"]) {
    if (!v164) return false;
    if (v164 === this["_activeId"]) this["_flushCurrentCanvas"]();
    const v165 = this["_canvases"]["find"]((v166) => v166["id"] === v164);
    if (!v165) return false;
    return (
      this["_savedSignatureByCanvas"]["set"](
        v164,
        this["_buildCanvasSavedSignature"](v165),
      ),
      this["_notifyDirtyStateChanged"](),
      true
    );
  },
  markAllCanvasesClean() {
    return (
      this["_flushCurrentCanvas"](),
      this["_resetSavedCanvasSignatures"]({ markClean: true }),
      this["_notifyDirtyStateChanged"](),
      true
    );
  },
  isCanvasDirty(v167 = this["_activeId"]) {
    if (!v167) return false;
    if (v167 === this["_activeId"]) this["_flushCurrentCanvas"]();
    const v168 = this["_canvases"]["find"]((v169) => v169["id"] === v167);
    if (!v168) return false;
    const v170 = this["_savedSignatureByCanvas"]["get"](v167);
    if (!v170) return true;
    return v170 !== this["_buildCanvasSavedSignature"](v168);
  },
  hasDirtyCanvases() {
    return (
      this["_flushCurrentCanvas"](),
      this["_canvases"]["some"]((v171) => {
        const v172 = v171?.["id"];
        if (!v172) return false;
        const v173 = this["_savedSignatureByCanvas"]["get"](v172);
        return !v173 || v173 !== this["_buildCanvasSavedSignature"](v171);
      })
    );
  },
  getMultiDataSnapshot({
    sanitizeForPersistence: sanitizeForPersistence = false,
  } = {}) {
    this["_flushCurrentCanvas"]();
    const v174 = cloneMultiDataSnapshot({
      canvases: this["_canvases"],
      activeCanvasId: this["_activeId"],
    });
    if (!sanitizeForPersistence) return v174;
    return sanitizeMultiCanvasDataForPersistence(v174 || {});
  },
  getMultiData() {
    return this["getMultiDataSnapshot"]();
  },
  getActiveCanvasId() {
    return this["_activeId"] || "";
  },
  renderTabs() {
    const v175 = document["getElementById"]("canvasTabs");
    if (!v175) return;
    this["_bindTabContainerEvents"](v175);
    const v176 = this["_getTabsRenderSignature"]();
    if (v176 === this["_lastTabsRenderSignature"]) return;
    ((this["_lastTabsRenderSignature"] = v176),
      this["_removeTabContextMenu"]());
    const v177 = document["createDocumentFragment"]();
    (this["_canvases"]["forEach"]((v178) => {
      const v179 = v178["id"] === this["_activeId"],
        v180 = document["createElement"]("div");
      ((v180["className"] = "canvas-tab" + (v179 ? "\x20active" : "")),
        (v180["dataset"]["id"] = v178["id"]));
      const v181 = document["createElement"]("span");
      ((v181["className"] = "canvas-tab-name"),
        (v181["title"] = v178["name"]),
        (v181["textContent"] = v178["name"]));
      const v182 = document["createElement"]("button");
      ((v182["type"] = "button"),
        (v182["className"] = "canvas-tab-close"),
        (v182["title"] = "关闭此画布"),
        (v182["textContent"] = "×"),
        v180["appendChild"](v181),
        v180["appendChild"](v182),
        v177["appendChild"](v180));
    }),
      v175["replaceChildren"](v177));
  },
};
export default CanvasTabManager;
export { CanvasTabManager };

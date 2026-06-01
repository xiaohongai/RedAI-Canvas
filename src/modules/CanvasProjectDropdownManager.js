import * as project from "./project.js";
import { commit } from "./history.js";
import { clearRendererCache } from "../core/renderer.js";
import { clearElement, setStaticInnerHTML, setText } from "../utils/dom.js";
import { sanitizeMultiCanvasDataForPersistence } from "../utils/thumbnailPersistence.js";
import {
  canUseDesktopProjectApi,
  openDesktopProject,
  saveDesktopProject,
} from "../services/desktopProjectService.js";
import {
  deleteV2ProjectFromServer,
  fetchV2ProjectsFromServer,
} from "../../api/projectsV2Api.js";
import {
  closeSidebarSubmenu,
  registerSidebarSubmenu,
} from "./sidebarSubmenuController.js";
const PROJECT_FILE_EXTENSION_RE = /\.(?:aicanvas|aicproj|json)$/i;
function stripProjectFileExtensionFromName(v0) {
  return String(v0 || "")["replace"](PROJECT_FILE_EXTENSION_RE, "");
}
const CanvasProjectDropdownManager = {
  init() {
    const v1 = 12,
      v2 = 12,
      v3 = document["getElementById"]("btnCanvasLogo"),
      v4 = document["getElementById"]("canvasProjDropdown"),
      v5 = v4?.["querySelector"](".cpd-header"),
      v6 = document["getElementById"]("canvasProjList"),
      v7 = document["getElementById"]("btnCloseProjDropdown"),
      v8 = document["getElementById"]("btnNewCanvas"),
      v9 = document["getElementById"]("saveDialogOverlay"),
      v10 = document["getElementById"]("saveDialogInput"),
      v11 = document["getElementById"]("saveDialogCancel"),
      v12 = document["getElementById"]("saveDialogConfirm");
    if (!v3 || !v4 || !v9) return;
    document["body"]["appendChild"](v4);
    function v13() {
      if (!v3 || !v4) return;
      const v14 = v3["getBoundingClientRect"](),
        v15 = v4["classList"]["contains"]("open");
      if (!v15) v4["classList"]["add"]("open");
      const v16 =
          v4["getBoundingClientRect"]()["height"] || v4["offsetHeight"] || 0,
        v17 = v14["top"] + (v14["height"] - v16) / 2,
        v18 = window["innerHeight"] - v16 - v2,
        v19 = v18 <= v2 ? v2 : Math["min"](Math["max"](v17, v2), v18);
      ((v4["style"]["left"] = v14["right"] + v1 + "px"),
        (v4["style"]["top"] = v19 + "px"));
      if (!v15) v4["classList"]["remove"]("open");
    }
    function v20(v21) {
      const v22 = new Date(v21 * 1000);
      return (
        v22["getFullYear"]() +
        "-" +
        String(v22["getMonth"]() + 1)["padStart"](2, "0") +
        "-" +
        String(v22["getDate"]())["padStart"](2, "0") +
        "\x20" +
        String(v22["getHours"]())["padStart"](2, "0") +
        ":" +
        String(v22["getMinutes"]())["padStart"](2, "0")
      );
    }
    function v23() {
      const v24 = document["getElementById"]("projectNameText");
      return String(v24?.["textContent"] || "")["trim"]() || "未命名画布";
    }
    function v25() {
      return (
        window["CanvasTabManager"]?.["getMultiDataSnapshot"]?.({
          sanitizeForPersistence: true,
        }) || { canvases: [], activeCanvasId: null }
      );
    }
    function v26(v27) {
      if (!v27) return;
      (v27["classList"]["remove"]("is-shaking"),
        void v27["offsetWidth"],
        v27["classList"]["add"]("is-shaking"),
        window["setTimeout"](() => {
          v27["classList"]["remove"]("is-shaking");
        }, 240));
    }
    function v28(v29, v30, v31) {
      (v26(v29),
        window["setTimeout"](() => {
          ((v30["hidden"] = true), (v31["hidden"] = false));
        }, 180));
    }
    function v32(v33) {
      const v34 = v33?.["getBoundingClientRect"]?.();
      if (!v34) return null;
      const v35 = Number(v34["left"] ?? 0),
        v36 = Number(v34["top"] ?? 0),
        v37 = Number(v34["width"]),
        v38 = Number(v34["height"]),
        v39 = Number(v34["right"]),
        v40 = Number(v34["bottom"]),
        v41 =
          Number["isFinite"](v37) && v37 > 0
            ? v37
            : Number["isFinite"](v39)
              ? v39 - v35
              : 0,
        v42 =
          Number["isFinite"](v38) && v38 > 0
            ? v38
            : Number["isFinite"](v40)
              ? v40 - v36
              : 0;
      if (
        !Number["isFinite"](v35) ||
        !Number["isFinite"](v36) ||
        !Number["isFinite"](v41) ||
        !Number["isFinite"](v42) ||
        v41 <= 0 ||
        v42 <= 0
      )
        return null;
      return {
        left: v35,
        top: v36,
        width: v41,
        height: v42,
        right: v35 + v41,
        bottom: v36 + v42,
      };
    }
    function v43(v44) {
      if (!v44) return null;
      const v45 = Number(window["innerWidth"] || 0),
        v46 = Number(window["innerHeight"] || 0);
      if (v45 <= 0 || v46 <= 0) return v44;
      const v47 = Math["max"](0, v44["left"]),
        v48 = Math["max"](0, v44["top"]),
        v49 = Math["min"](v45, v44["right"]),
        v50 = Math["min"](v46, v44["bottom"]),
        v51 = v49 - v47,
        v52 = v50 - v48;
      if (v51 <= 0 || v52 <= 0) return v44;
      return {
        left: v47,
        top: v48,
        width: v51,
        height: v52,
        right: v49,
        bottom: v50,
      };
    }
    function v53() {
      const v54 = window["matchMedia"]?.("(prefers-reduced-motion: reduce)")?.[
        "matches"
      ];
      if (v54) return;
      const v55 =
          v32(document["getElementById"]("v2-canvas")) ||
          v32(document["getElementById"]("v2-wrap")),
        v56 = v43(v55),
        v57 = v32(v3 || document["getElementById"]("btnCanvasLogo"));
      if (!v56 || !v57) return;
      const v58 = v56["width"] / v56["height"] || 4 / 3;
      let v59 = Math["min"](
          v56["width"],
          Math["max"](140, Math["min"](360, v56["width"] * 0.42)),
        ),
        v60 = v59 / v58;
      const v61 = Math["min"](
        v56["height"],
        Math["max"](96, Math["min"](240, v56["height"] * 0.42)),
      );
      v60 > v61 && ((v60 = v61), (v59 = v60 * v58));
      ((v59 = Math["max"](1, Math["round"](v59))),
        (v60 = Math["max"](1, Math["round"](v60))));
      const v62 = v56["left"] + v56["width"] / 2,
        v63 = v56["top"] + v56["height"] / 2,
        v64 = v57["left"] + v57["width"] / 2,
        v65 = v57["top"] + v57["height"] / 2,
        v66 = Math["round"](v62 - v59 / 2),
        v67 = Math["round"](v63 - v60 / 2),
        v68 = v64 - v62,
        v69 = v65 - v63,
        v70 = document["createElement"]("div");
      ((v70["className"] = "v2-project-save-fly"),
        (v70["style"]["left"] = v66 + "px"),
        (v70["style"]["top"] = v67 + "px"),
        (v70["style"]["width"] = v59 + "px"),
        (v70["style"]["height"] = v60 + "px"),
        document["body"]["appendChild"](v70));
      const v71 = (() => {
        let v72 = false;
        return () => {
          if (v72) return;
          ((v72 = true),
            v70["remove"]?.(),
            v3?.["animate"] &&
              v3["animate"](
                [
                  { transform: "scale(1)", filter: "brightness(1)" },
                  { transform: "scale(1.08)", filter: "brightness(1.2)" },
                  { transform: "scale(1)", filter: "brightness(1)" },
                ],
                {
                  duration: 260,
                  easing: "cubic-bezier(0.2,\x200,\x200,\x201)",
                },
              ));
        };
      })();
      if (typeof v70["animate"] === "function") {
        const v73 = v70["animate"](
          [
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            {
              transform: "translate(" + v68 + "px," + v69 + "px) scale(0.12)",
              opacity: 0.18,
            },
          ],
          { duration: 560, easing: "cubic-bezier(0.2, 0, 0, 1)" },
        );
        ((v73["onfinish"] = v71), (v73["oncancel"] = v71));
        return;
      }
      window["setTimeout"](v71, 560);
    }
    function v74(v75) {
      if (!v75 || v75["canceled"]) return false;
      const v76 = sanitizeMultiCanvasDataForPersistence(
        v75["multiData"] || project["resolveCanvasData"](v75["data"] || {}),
      );
      (clearRendererCache(),
        window["CanvasTabManager"]?.["init"]?.(v76),
        window["CanvasTabManager"]?.["markAllCanvasesClean"]?.(),
        commit());
      const v77 =
        v75["projectName"] ||
        stripProjectFileExtensionFromName(v75["filename"]) ||
        "未命名画布";
      ((window["_v2CurrentFile"] = v75["filename"] || v77 + ".aicanvas"),
        (window["_v2CurrentRecentProjectId"] = v75["recentId"] || ""),
        (window["_v2CurrentProjectDisplayPath"] = v75["displayPath"] || ""),
        (window["_v2CurrentProjectLastModified"] =
          Number(v75["lastModified"] || 0) || 0),
        (window["currentProjectId"] =
          v75["projectId"] || stripProjectFileExtensionFromName(v77)));
      const v78 = document["getElementById"]("projectNameText");
      if (v78) v78["textContent"] = v77;
      return (
        window["CanvasTabManager"]?.["renderTabs"]?.(),
        window["_queueLegacyThumbnailMigration"]?.({
          projectId: window["currentProjectId"],
          projectName: v77,
          multiData: v76,
        }),
        window["_triggerLocalCacheSave"]?.(),
        true
      );
    }
    async function v79(v80 = "") {
      if (window["showGlobalLoading"])
        window["showGlobalLoading"]("打开本地项目中...");
      try {
        const v81 = await openDesktopProject({ recentId: v80 });
        v74(v81) &&
          (closeSidebarSubmenu("canvas-project"),
          v82("已打开：" + (v81["projectName"] || v81["filename"])));
      } catch (v83) {
        (console["error"]("[desktopProject] open failed:", v83),
          v82(v83?.["message"] || "打开本地项目失败", "error"));
      } finally {
        if (window["hideGlobalLoading"]) window["hideGlobalLoading"]();
      }
    }
    async function v84() {
      if (window["showGlobalLoading"])
        window["showGlobalLoading"]("另存本地项目中...");
      try {
        const v85 = await saveDesktopProject(v23(), v25(), { mode: "saveAs" });
        if (!v85 || v85["canceled"]) return;
        ((window["_v2CurrentFile"] = v85["filename"]),
          (window["_v2CurrentRecentProjectId"] = v85["recentId"] || ""),
          (window["_v2CurrentProjectDisplayPath"] = v85["displayPath"] || ""),
          (window["_v2CurrentProjectLastModified"] =
            Number(v85["lastModified"] || 0) || 0),
          (window["currentProjectId"] =
            v85["projectId"] ||
            stripProjectFileExtensionFromName(v85["filename"])),
          window["CanvasTabManager"]?.["markAllCanvasesClean"]?.(),
          v82("另存成功：" + v85["filename"]),
          v86());
      } catch (v87) {
        (console["error"]("[desktopProject] saveAs failed:", v87),
          v82(v87?.["message"] || "另存失败", "error"));
      } finally {
        if (window["hideGlobalLoading"]) window["hideGlobalLoading"]();
      }
    }
    function v88() {
      return window["CanvasTabManager"]?.["hasDirtyCanvases"]?.() === true;
    }
    function v89(v90) {
      if (!v88()) return true;
      const v91 = v90?.["filename"] || "外部项目";
      return (
        window["confirm"]?.(
          "当前画布有未保存改动。\n\n是否放弃未保存改动并打开「" + v91 + "」？",
        ) === true
      );
    }
    async function v92(v93) {
      if (!v93 || typeof v93 !== "object") return;
      if (v93["success"] === false) {
        v82(v93["error"] || "打开外部项目失败", "error");
        return;
      }
      if (!v89(v93)) return;
      if (window["showGlobalLoading"])
        window["showGlobalLoading"]("打开本地项目中...");
      try {
        v74(v93) &&
          (closeSidebarSubmenu("canvas-project"),
          v82("已打开：" + (v93["projectName"] || v93["filename"])));
      } catch (v94) {
        (console["error"]("[desktopProject] external open failed:", v94),
          v82(v94?.["message"] || "打开外部项目失败", "error"));
      } finally {
        if (window["hideGlobalLoading"]) window["hideGlobalLoading"]();
      }
    }
    async function v95(v96) {
      const v97 = Array["isArray"](v96) ? v96 : [];
      for (const v98 of v97) {
        await v92(v98);
      }
    }
    async function v99() {
      const v100 =
        window["electronAPI"]?.["project"]?.["consumeExternalOpenRequests"];
      if (typeof v100 !== "function") return;
      try {
        await v95(await v100());
      } catch (v101) {
        (console["error"](
          "[desktopProject] consume external open failed:",
          v101,
        ),
          v82(v101?.["message"] || "打开外部项目失败", "error"));
      }
    }
    function v102() {
      const v103 = window["electronAPI"]?.["project"]?.["onExternalOpen"];
      if (typeof v103 !== "function") return;
      if (window["__aiCanvasExternalProjectOpenInstalled"]) return;
      ((window["__aiCanvasExternalProjectOpenInstalled"] = true),
        v103((v104) => {
          void v95(v104);
        }),
        void v99());
    }
    function v105({ iconId: v106, title: v107, onClick: v108 }) {
      const v109 = document["createElement"]("button");
      return (
        (v109["type"] = "button"),
        (v109["className"] = "cpd-local-action-btn"),
        (v109["dataset"]["tooltip"] = v107),
        v109["setAttribute"]("aria-label", v107),
        setStaticInnerHTML(v109, v106),
        v109["addEventListener"]("click", (v110) => {
          (v110["preventDefault"](), v110["stopPropagation"](), v108?.());
        }),
        v109
      );
    }
    function v111() {
      if (!canUseDesktopProjectApi() || !v5) return;
      let v112 = v5["querySelector"](".cpd-local-actions");
      if (v112) return;
      ((v112 = document["createElement"]("div")),
        (v112["className"] = "cpd-local-actions"),
        v112["appendChild"](
          v105({
            iconId: "iconFolderOpen18",
            title: "打开本地项目",
            onClick: () => v79(),
          }),
        ),
        v112["appendChild"](
          v105({
            iconId: "iconSaveAs18",
            title: "另存为本地项目",
            onClick: () => v84(),
          }),
        ));
      const v113 = v5["querySelector"](".cpd-close");
      v5["insertBefore"](v112, v113 || null);
    }
    async function v86() {
      (v111(), clearElement(v6));
      const v114 = document["createElement"]("div");
      ((v114["className"] = "cpd-loading"),
        setText(v114, "加载中..."),
        v6["appendChild"](v114),
        requestAnimationFrame(v13));
      try {
        const v115 = await fetchV2ProjectsFromServer();
        if (!v115["length"]) {
          clearElement(v6);
          const v116 = document["createElement"]("div");
          ((v116["className"] = "cpd-empty"),
            setText(v116, "暂无保存的工作流"),
            v6["appendChild"](v116),
            requestAnimationFrame(v13));
          return;
        }
        (clearElement(v6),
          v115["forEach"]((v117) => {
            const v118 = document["createElement"]("div");
            ((v118["className"] = "cpd-item"),
              (v118["dataset"]["filename"] = v117["filename"]),
              (v118["dataset"]["name"] = v117["name"]));
            const v119 = document["createElement"]("div");
            v119["className"] = "cpd-item-left";
            const v120 = document["createElement"]("div");
            ((v120["className"] = "cpd-item-icon"),
              setStaticInnerHTML(v120, "cpdProjectItemIcon16"));
            const v121 = document["createElement"]("div");
            v121["className"] = "cpd-item-info";
            const v122 = document["createElement"]("div");
            ((v122["className"] = "cpd-item-name"),
              setText(v122, v117["name"]),
              v121["appendChild"](v122),
              v119["appendChild"](v120),
              v119["appendChild"](v121));
            const v123 = document["createElement"]("div");
            ((v123["className"] = "cpd-item-actions"),
              v118["appendChild"](v119),
              v118["appendChild"](v123));
            const v124 = document["createElement"]("div");
            ((v124["className"] = "cpd-item-delete"),
              setStaticInnerHTML(v124, "iconTrash18"));
            const v125 = document["createElement"]("div");
            ((v125["className"] = "cpd-confirm-panel"),
              (v125["hidden"] = true));
            const v126 = document["createElement"]("button");
            ((v126["type"] = "button"),
              (v126["className"] = "cpd-confirm-btn cpd-confirm-btn--danger"),
              (v126["textContent"] = "✔"),
              v126["setAttribute"]("aria-label", "确定"));
            const v127 = document["createElement"]("button");
            ((v127["type"] = "button"),
              (v127["className"] =
                "cpd-confirm-btn\x20cpd-confirm-btn--neutral"),
              (v127["textContent"] = "×"),
              v127["setAttribute"]("aria-label", "取消"),
              v125["appendChild"](v126),
              v125["appendChild"](v127),
              v123["appendChild"](v124),
              v123["appendChild"](v125),
              v119["addEventListener"]("click", (v128) => {
                (v128["stopPropagation"](),
                  v129(v117["filename"], v117["name"]));
              }),
              v124["addEventListener"]("click", (v130) => {
                (v130["stopPropagation"](), v28(v118, v124, v125));
              }),
              v127["addEventListener"]("click", (v131) => {
                (v131["stopPropagation"](),
                  (v125["hidden"] = true),
                  (v124["hidden"] = false));
              }),
              v126["addEventListener"]("click", async (v132) => {
                (v132["stopPropagation"](), (v126["textContent"] = "..."));
                const v133 = await deleteV2ProjectFromServer(v117["filename"]);
                v133
                  ? (v82("已删除"), v86())
                  : (v82("删除失败"), (v126["textContent"] = "✔"));
              }),
              v118["addEventListener"]("contextmenu", (v134) => {
                (v134["preventDefault"](), v134["stopPropagation"]());
              }),
              v6["appendChild"](v118));
          }),
          requestAnimationFrame(v13));
      } catch (v135) {
        clearElement(v6);
        const v136 = document["createElement"]("div");
        ((v136["className"] = "cpd-empty"),
          setText(v136, "加载失败，请确认服务器运行中"),
          v6["appendChild"](v136),
          requestAnimationFrame(v13));
      }
    }
    async function v129(v137, v138) {
      if (window["showGlobalLoading"])
        window["showGlobalLoading"]("加载文件中...");
      try {
        const v139 = String(v137 || "")["replace"](/\.json$/i, ""),
          v140 = await project["loadProject"](v139),
          v141 = sanitizeMultiCanvasDataForPersistence(v140),
          v142 =
            v141["canvases"]["find"](
              (v143) => v143["id"] === v141["activeCanvasId"],
            ) || v141["canvases"][0],
          v144 = window["CanvasTabManager"]["_canvases"]["find"](
            (v145) => v145["name"] === v138,
          );
        v144
          ? window["CanvasTabManager"]["switchTo"](v144["id"])
          : (window["CanvasTabManager"]["addCanvas"](),
            window["CanvasTabManager"]["renameCanvas"](
              window["CanvasTabManager"]["_activeId"],
              v138,
            ));
        window["_v2ApplySourceNamesFromFileNameToCanvas"] &&
          window["_v2ApplySourceNamesFromFileNameToCanvas"](v142);
        (window["CanvasTabManager"]["hydrateActiveCanvasSnapshot"](v142),
          window["CanvasTabManager"]["markCanvasClean"](
            window["CanvasTabManager"]["_activeId"],
          ),
          commit(),
          (window["_v2CurrentFile"] = v137),
          (window["_v2CurrentRecentProjectId"] = ""),
          (window["_v2CurrentProjectDisplayPath"] = ""),
          (window["_v2CurrentProjectLastModified"] = 0),
          (window["currentProjectId"] = v139),
          window["_queueLegacyThumbnailMigration"]?.({
            projectId: v139,
            projectName: v138,
            multiData: v140,
          }));
        const v146 = document["getElementById"]("projectNameText");
        if (v146) v146["textContent"] = v138;
        (window["CanvasTabManager"]["renderTabs"](),
          closeSidebarSubmenu("canvas-project"),
          v82("已加载：" + v138));
        if (window["hideGlobalLoading"]) window["hideGlobalLoading"]();
      } catch (v147) {
        (console["error"]("load project error:", v147),
          v82("加载失败", "error"));
        if (window["hideGlobalLoading"]) window["hideGlobalLoading"]();
      }
    }
    async function v148(v149) {
      try {
        const v150 = window["CanvasTabManager"]?.[
            "getMultiDataSnapshot"
          ]?.() || { canvases: [], activeCanvasId: null },
          v151 = await project["saveProject"](v149, v150);
        if (v151?.["canceled"]) return;
        if (v151["success"]) {
          ((window["_v2CurrentFile"] = v151["filename"]),
            (window["_v2CurrentRecentProjectId"] = ""),
            (window["_v2CurrentProjectDisplayPath"] = ""),
            (window["_v2CurrentProjectLastModified"] = 0),
            (window["currentProjectId"] =
              v151["projectId"] ||
              stripProjectFileExtensionFromName(v151["filename"])),
            window["CanvasTabManager"]["renameCanvas"](
              window["CanvasTabManager"]["_activeId"],
              v149,
            ));
          const v152 = document["getElementById"]("projectNameText");
          if (v152) v152["textContent"] = v149;
          (window["CanvasTabManager"]["renderTabs"](),
            window["CanvasTabManager"]["markAllCanvasesClean"](),
            v53(),
            v82("保存成功：" + v149),
            await v86());
        }
      } catch (v153) {
        (console["error"]("[saveProject] JSON 保存失败:", v153),
          v82("保存失败", "error"));
      }
    }
    ((window["_v2SaveProject"] = v148),
      (window["_v2SaveProjectAsLocal"] = v84));
    function v82(v154, v155 = "ok") {
      window["showToast"](v154, v155);
    }
    function v156() {
      if (!v3 || !v4) return;
      (v13(),
        v4["classList"]["add"]("open"),
        requestAnimationFrame(v13),
        v86());
    }
    function v157() {
      v4["classList"]["remove"]("open");
    }
    (registerSidebarSubmenu({
      key: "canvas-project",
      button: v3,
      panel: v4,
      open: v156,
      close: v157,
      isOpen: () => v4["classList"]["contains"]("open"),
      openClass: "open",
    }),
      v7?.["addEventListener"]("click", (v158) => {
        (v158["preventDefault"](),
          v158["stopPropagation"](),
          closeSidebarSubmenu("canvas-project"));
      }),
      v8?.["addEventListener"]("click", () => {
        (closeSidebarSubmenu("canvas-project"),
          window["CanvasTabManager"]?.["addCanvas"]?.(),
          v82("已新建画布"));
      }));
    function v159() {
      const v160 = window["CanvasTabManager"]["_canvases"]["find"](
        (v161) => v161["id"] === window["CanvasTabManager"]["_activeId"],
      );
      ((v10["value"] = v160 ? v160["name"] : "未命名画布"),
        v9["classList"]["add"]("open"),
        setTimeout(() => {
          (v10["focus"](), v10["select"]());
        }, 80));
    }
    window["_openSaveDialog"] = v159;
    function v162() {
      v9["classList"]["remove"]("open");
    }
    (v11?.["addEventListener"]("click", v162),
      v12?.["addEventListener"]("click", () => {
        const v163 = v10["value"]["trim"]() || "未命名画布";
        (v162(), v148(v163));
      }),
      v10?.["addEventListener"]("keydown", (v164) => {
        (v164["key"] === "Enter" && (v164["preventDefault"](), v12["click"]()),
          v164["key"] === "Escape" && (v164["preventDefault"](), v162()));
      }),
      v102(),
      window["addEventListener"]("resize", () => {
        v4["classList"]["contains"]("open") && v13();
      }));
  },
};
export default CanvasProjectDropdownManager;
export { CanvasProjectDropdownManager };

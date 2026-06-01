import { generateId } from "../core/math.js";
import * as project from "./project.js";
import {
  getProjects as getProjects,
  createProject as createProject,
  deleteProject as deleteProject,
} from "../../api/legacyProjectsApi.js";
import { clearRendererCache } from "../core/renderer.js";
import { commit } from "./history.js";
const projectGallery = document["getElementById"]("projectGallery"),
  projectGrid = document["getElementById"]("projectGrid"),
  ProjectManager = {
    async getProjects() {
      return await getProjects();
    },
    async createProject(v0) {
      if (!v0) {
        const v1 = new Date();
        v0 = "画板\x20" + v1["toLocaleString"]();
      }
      const v2 = generateId("proj");
      return await createProject(v2, v0);
    },
    async loadProject(v3) {
      try {
        clearRendererCache();
        const v4 = await project["loadProject"](v3);
        ((window["currentProjectId"] = v3),
          (window["_v2CurrentRecentProjectId"] = ""),
          (window["_v2CurrentProjectDisplayPath"] = ""),
          (window["_v2CurrentProjectLastModified"] = 0));
        if (projectGallery) projectGallery["classList"]["add"]("hidden");
        (document["body"]["classList"]["remove"]("in-gallery"),
          localStorage["setItem"]("tapnow_last_project_v2", v3));
        window["CanvasTabManager"] && window["CanvasTabManager"]["init"](v4);
        const v5 = document["getElementById"]("projectNameText");
        if (v5) {
          let v6 = "新项目";
          const v7 = await this["getProjects"](),
            v8 = v7["find"]((v9) => v9["id"] === v3);
          if (v8) v6 = v8["name"];
          v5["textContent"] = v6;
        }
      } catch (v10) {
        (console["error"]("Failed\x20to\x20load\x20project:", v10),
          alert("读取项目失败"));
      }
    },
    async saveCurrentProject() {
      if (!window["currentProjectId"]) return;
      if (window["CanvasTabManager"]) {
        const v11 = window["CanvasTabManager"]["getMultiDataSnapshot"](),
          v12 = await project["saveProject"](window["currentProjectId"], v11);
        v12?.["success"] &&
          window["CanvasTabManager"]["markAllCanvasesClean"]?.();
      }
    },
    showConfirm(v13, v14, v15) {
      const v16 = document["createElement"]("div");
      v16["className"] = "custom-confirm-overlay";
      const v17 = document["createElement"]("div");
      v17["className"] = "custom-confirm-box";
      const v18 = document["createElement"]("div");
      ((v18["className"] = "confirm-title"), (v18["textContent"] = v13));
      const v19 = document["createElement"]("div");
      ((v19["className"] = "confirm-msg"), (v19["textContent"] = v14));
      const v20 = document["createElement"]("div");
      v20["className"] = "confirm-btns";
      const v21 = document["createElement"]("button");
      ((v21["type"] = "button"),
        (v21["className"] = "confirm-btn\x20confirm-cancel"),
        (v21["textContent"] = "取消"));
      const v22 = document["createElement"]("button");
      ((v22["type"] = "button"),
        (v22["className"] = "confirm-btn confirm-ok"),
        (v22["textContent"] = "确认删除"),
        v20["appendChild"](v21),
        v20["appendChild"](v22),
        v17["appendChild"](v18),
        v17["appendChild"](v19),
        v17["appendChild"](v20),
        v16["appendChild"](v17),
        document["body"]["appendChild"](v16));
      const v23 = () => v16["remove"]();
      ((v21["onclick"] = v23),
        (v22["onclick"] = () => {
          (v15(), v23());
        }),
        (v16["onclick"] = (v24) => {
          if (v24["target"] === v16) v23();
        }));
    },
    async deleteProject(v25) {
      this["showConfirm"](
        "确认删除",
        "删除后项目将无法恢复，确定要继续吗？",
        async () => {
          try {
            (await deleteProject(v25),
              window["currentProjectId"] === v25
                ? this["showGallery"]()
                : this["renderGallery"]());
          } catch (v26) {
            console["error"]("Failed\x20to\x20delete\x20project:", v26);
          }
        },
      );
    },
    showGallery() {
      window["currentProjectId"] = null;
      if (projectGallery) projectGallery["classList"]["remove"]("hidden");
      (document["body"]["classList"]["add"]("in-gallery"),
        this["renderGallery"]());
    },
    async renderGallery() {
      if (!projectGrid) return;
      const v27 = await this["getProjects"]();
      projectGrid["replaceChildren"]();
      const v28 = document["createElement"]("div");
      v28["className"] = "project-card new-project-card";
      const v29 = "http://www.w3.org/2000/svg",
        v30 = document["createElement"]("div");
      ((v30["className"] = "pc-preview new-project-preview"),
        Object["assign"](v30["style"], {
          background: "var(--white-02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }));
      const v31 = document["createElementNS"](v29, "svg");
      (v31["setAttribute"]("width", "32"),
        v31["setAttribute"]("height", "32"),
        v31["setAttribute"]("viewBox", "0 0 24 24"),
        v31["setAttribute"]("fill", "none"),
        v31["setAttribute"]("stroke", "currentColor"),
        v31["setAttribute"]("stroke-width", "1.5"),
        (v31["style"]["opacity"] = "0.4"));
      const v32 = document["createElementNS"](v29, "line");
      (v32["setAttribute"]("x1", "12"),
        v32["setAttribute"]("y1", "5"),
        v32["setAttribute"]("x2", "12"),
        v32["setAttribute"]("y2", "19"));
      const v33 = document["createElementNS"](v29, "line");
      (v33["setAttribute"]("x1", "5"),
        v33["setAttribute"]("y1", "12"),
        v33["setAttribute"]("x2", "19"),
        v33["setAttribute"]("y2", "12"),
        v31["appendChild"](v32),
        v31["appendChild"](v33),
        v30["appendChild"](v31));
      const v34 = document["createElement"]("div");
      ((v34["className"] = "pc-info"),
        Object["assign"](v34["style"], {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: "16px 0",
        }));
      const v35 = document["createElement"]("div");
      ((v35["className"] = "pc-title"),
        Object["assign"](v35["style"], {
          color: "var(--text-primary)",
          fontSize: "16px",
          fontWeight: "600",
          textAlign: "center",
          margin: "0",
        }),
        (v35["textContent"] = "新建项目"),
        v34["appendChild"](v35),
        v28["appendChild"](v30),
        v28["appendChild"](v34));
      const v36 = document["createElement"]("style");
      ((v36["textContent"] =
        "@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }"),
        document["head"]["appendChild"](v36),
        (window["showGlobalLoading"] = function (v37 = "加载中...") {
          let v38 = document["getElementById"]("v2-global-loading");
          if (!v38) {
            ((v38 = document["createElement"]("div")),
              (v38["id"] = "v2-global-loading"),
              Object["assign"](v38["style"], {
                position: "fixed",
                bottom: "80px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--surface-quote)",
                color: "var(--white)",
                padding: "10px\x2024px",
                borderRadius: "30px",
                fontSize: "14px",
                zIndex: "99999",
                border: "1px\x20solid\x20var(--white-10)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0\x208px\x2032px\x20var(--black-50)",
                opacity: "0",
                transition: "opacity\x200.2s",
                pointerEvents: "none",
              }));
            const v39 = document["createElementNS"](v29, "svg");
            (v39["setAttribute"]("width", "18"),
              v39["setAttribute"]("height", "18"),
              v39["setAttribute"]("viewBox", "0 0 24 24"),
              v39["setAttribute"]("fill", "none"),
              v39["setAttribute"]("stroke", "currentColor"),
              v39["setAttribute"]("stroke-width", "2"),
              v39["classList"]["add"]("spin"));
            const v40 = document["createElementNS"](v29, "path");
            (v40["setAttribute"]("d", "M21 12a9 9 0 1 1-6.219-8.56"),
              v39["appendChild"](v40));
            const v41 = document["createElement"]("span");
            (v38["appendChild"](v39),
              v38["appendChild"](v41),
              document["body"]["appendChild"](v38));
          }
          ((v38["querySelector"]("span")["textContent"] = v37),
            void v38["offsetWidth"],
            (v38["style"]["opacity"] = "1"));
        }),
        (window["hideGlobalLoading"] = function () {
          const v42 = document["getElementById"]("v2-global-loading");
          v42 &&
            ((v42["style"]["opacity"] = "0"),
            setTimeout(() => v42["remove"](), 250));
        }),
        (v28["onclick"] = async () => {
          const v43 = await this["createProject"]();
          if (v43) {
            if (window["store"]) window["store"]["hydrate"]({});
            (await this["loadProject"](v43), commit());
          }
        }),
        projectGrid["appendChild"](v28),
        v27["sort"]((v44, v45) => v45["lastModified"] - v44["lastModified"])[
          "forEach"
        ]((v46) => {
          const v47 = document["createElement"]("div");
          v47["className"] = "project-card";
          const v48 = new Date(v46["lastModified"])["toLocaleString"]("zh-CN", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            v49 = document["createElement"]("div");
          v49["className"] = "pc-preview";
          if (
            v46["thumbnail"] &&
            v46["thumbnail"]["type"] === "image" &&
            v46["thumbnail"]["data"]
          ) {
            const v50 = document["createElement"]("img");
            ((v50["src"] = v46["thumbnail"]["data"]), v49["appendChild"](v50));
          } else {
            if (
              v46["thumbnail"] &&
              v46["thumbnail"]["type"] === "text" &&
              v46["thumbnail"]["data"]
            ) {
              const v51 = document["createElement"]("div");
              ((v51["className"] = "pc-text-snippet"),
                (v51["textContent"] = v46["thumbnail"]["data"]),
                v49["appendChild"](v51));
            } else {
              const v52 = document["createElement"]("div");
              ((v52["className"] = "pc-logo"),
                Object["assign"](v52["style"], {
                  fontWeight: "bold",
                  color: "var(--white-10)",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }),
                (v52["textContent"] = "RedAI-Canvas"),
                v49["appendChild"](v52));
            }
          }
          const v53 = document["createElement"]("div");
          v53["className"] = "pc-info";
          const v54 = document["createElement"]("div");
          ((v54["className"] = "pc-title"), (v54["textContent"] = v46["name"]));
          const v55 = document["createElement"]("div");
          v55["className"] = "pc-meta";
          const v56 = document["createElement"]("span");
          ((v56["className"] = "pc-time"), (v56["textContent"] = v48));
          const v57 = document["createElement"]("span");
          ((v57["className"] = "pc-delete"),
            (v57["dataset"]["id"] = v46["id"]),
            Object["assign"](v57["style"], {
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "color 0.2s",
            }),
            (v57["textContent"] = "删除"),
            v57["addEventListener"](
              "mouseenter",
              () => (v57["style"]["color"] = "var(--red)"),
            ),
            v57["addEventListener"](
              "mouseleave",
              () => (v57["style"]["color"] = "var(--text-muted)"),
            ),
            v55["appendChild"](v56),
            v55["appendChild"](v57),
            v53["appendChild"](v54),
            v53["appendChild"](v55),
            v47["appendChild"](v49),
            v47["appendChild"](v53),
            (v47["onclick"] = async (v58) => {
              const v59 = v58["target"]["closest"](".pc-delete");
              if (v59) {
                (v58["stopPropagation"](),
                  await this["deleteProject"](v46["id"]));
                return;
              }
              await this["loadProject"](v46["id"]);
            }),
            projectGrid["appendChild"](v47));
        }));
    },
  };
export default ProjectManager;
export { ProjectManager };

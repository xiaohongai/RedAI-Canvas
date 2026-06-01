import { registerSidebarSubmenu } from "./sidebarSubmenuController.js";
import { pickResultLocalPath } from "../utils/localMediaPath.js";
const TERMINAL_STATUSES = new Set(["complete", "failed", "cancelled"]),
  ACTIVE_STATUSES = new Set(["waiting", "processing"]),
  MAX_TASKS = 120;
function el(v0, v1 = "", v2 = "") {
  const v3 = document["createElement"](v0);
  if (v1) v3["className"] = v1;
  if (v2) v3["textContent"] = v2;
  return v3;
}
function normalizeTask(v4 = {}) {
  const v5 = String(v4["taskId"] || "")["trim"]();
  if (!v5) return null;
  return {
    taskId: v5,
    nodeId: String(v4["nodeId"] || "")["trim"](),
    assetId: String(v4["assetId"] || "")["trim"](),
    kind: String(v4["kind"] || "")["trim"](),
    status: String(v4["status"] || "")["trim"]() || "waiting",
    progress: Math["max"](0, Math["min"](1, Number(v4["progress"] || 0) || 0)),
    message: String(v4["message"] || "")["trim"](),
    error: String(v4["error"] || "")["trim"](),
    result:
      v4["result"] && typeof v4["result"] === "object" ? v4["result"] : null,
    createdAt: Number(v4["createdAt"] || 0) || Date["now"](),
    startedAt: Number(v4["startedAt"] || 0) || 0,
    finishedAt: Number(v4["finishedAt"] || 0) || 0,
    updatedAt: Date["now"](),
  };
}
function getTaskLabel(v6) {
  const v7 = {
    videoPoster: "生成视频封面",
    audioWaveform: "生成音频波形",
    videoFirstFrame: "提取视频首帧",
    videoCut: "视频裁剪",
    audioCut: "音频裁剪",
    videoAudioSeparate: "音频分离",
    videoCompose: "视频合成",
    audioCompose: "音频合并",
  };
  return v7[v6] || "媒体任务";
}
function getStatusLabel(v8) {
  if (v8 === "waiting") return "等待";
  if (v8 === "processing") return "处理中";
  if (v8 === "complete") return "完成";
  if (v8 === "failed") return "失败";
  if (v8 === "cancelled") return "已取消";
  return "任务";
}
function formatPercent(v9) {
  return (
    Math["round"](Math["max"](0, Math["min"](1, Number(v9) || 0)) * 100) + "%"
  );
}
function formatDuration(v10) {
  const v11 = Math["max"](0, Math["floor"](Number(v10 || 0) / 1000)),
    v12 = Math["floor"](v11 / 60),
    v13 = v11 % 60;
  if (v12 <= 0) return v13 + "s";
  return v12 + "m\x20" + String(v13)["padStart"](2, "0") + "s";
}
function getTaskDuration(v14) {
  const v15 = Number(v14["startedAt"] || v14["createdAt"] || 0) || 0,
    v16 =
      Number(v14["finishedAt"] || 0) ||
      (ACTIVE_STATUSES["has"](v14["status"]) ? Date["now"]() : 0);
  if (!v15 || !v16) return "";
  return formatDuration(v16 - v15);
}
function getResultLocalPath(v17) {
  return pickResultLocalPath(v17);
}
function sortTasks(v18) {
  const v19 = {
    processing: 0,
    waiting: 1,
    failed: 2,
    complete: 3,
    cancelled: 4,
  };
  return [...v18]["sort"]((v20, v21) => {
    const v22 = v19[v20["status"]] ?? 9,
      v23 = v19[v21["status"]] ?? 9;
    if (v22 !== v23) return v22 - v23;
    return (
      Number(v21["updatedAt"] || v21["createdAt"] || 0) -
      Number(v20["updatedAt"] || v20["createdAt"] || 0)
    );
  });
}
function getElectronMediaTaskApi() {
  const v24 = globalThis["window"]?.["electronAPI"]?.["mediaTask"];
  if (!v24 || typeof v24 !== "object") return null;
  return v24;
}
export class TaskCenterManager {
  constructor() {
    ((this["panel"] = null),
      (this["listEl"] = null),
      (this["summaryEl"] = null),
      (this["clearBtn"] = null),
      (this["badgeEl"] = null),
      (this["tasks"] = new Map()),
      (this["renderTimer"] = 0),
      (this["clockTimer"] = 0),
      (this["unsubscribe"] = null),
      this["initPanel"](),
      this["bindMediaTasks"]());
  }
  ["initPanel"]() {
    const v25 = document["getElementById"]("btnTasks");
    this["badgeEl"] = document["getElementById"]("taskCenterBadge");
    const v26 =
      document["querySelector"](".sidebar-floating") || document["body"];
    ((this["panel"] = el("div", "v2-task-center-panel")),
      this["panel"]["setAttribute"]("aria-label", "任务"));
    const v27 = el("div", "v2-task-center-header"),
      v28 = el("div", "v2-task-center-title", "任务");
    ((this["clearBtn"] = el("button", "v2-task-center-action", "清理完成")),
      (this["clearBtn"]["type"] = "button"),
      (this["clearBtn"]["dataset"]["taskAction"] = "clear-terminal"),
      v27["append"](v28, this["clearBtn"]),
      (this["summaryEl"] = el("div", "v2-task-center-summary")),
      (this["listEl"] = el("div", "v2-task-center-list")),
      this["panel"]["append"](v27, this["summaryEl"], this["listEl"]),
      v26["appendChild"](this["panel"]),
      v25 &&
        registerSidebarSubmenu({
          key: "tasks",
          button: v25,
          panel: this["panel"],
          open: () => this["show"](),
          close: () => this["hide"](),
          isOpen: () => this["panel"]["classList"]["contains"]("show"),
        }),
      this["panel"]["addEventListener"]("click", (v29) =>
        this["handleClick"](v29),
      ),
      this["render"]());
  }
  ["bindMediaTasks"]() {
    const v30 = getElectronMediaTaskApi();
    if (!v30) {
      this["render"]();
      return;
    }
    (typeof v30["onUpdate"] === "function" &&
      (this["unsubscribe"] = v30["onUpdate"]((v31) => {
        this["upsertTask"](v31 || {});
      })),
      typeof v30["list"] === "function" &&
        v30["list"]({ limit: MAX_TASKS })
          ["then"]((v32) => {
            if (!Array["isArray"](v32)) return;
            (v32["forEach"]((v33) => this["upsertTask"](v33, { silent: true })),
              this["scheduleRender"]());
          })
          ["catch"](() => {}));
  }
  ["show"]() {
    (this["panel"]?.["classList"]["add"]("show"),
      document["getElementById"]("btnTasks")?.["classList"]["add"]("active"),
      this["render"](),
      this["startClock"]());
  }
  ["hide"]() {
    (this["panel"]?.["classList"]["remove"]("show"),
      document["getElementById"]("btnTasks")?.["classList"]["remove"]("active"),
      this["stopClock"]());
  }
  ["startClock"]() {
    if (this["clockTimer"]) return;
    this["clockTimer"] = window["setInterval"](() => {
      if (!this["hasActiveTasks"]()) {
        this["stopClock"]();
        return;
      }
      this["render"]();
    }, 1000);
  }
  ["stopClock"]() {
    if (!this["clockTimer"]) return;
    (window["clearInterval"](this["clockTimer"]), (this["clockTimer"] = 0));
  }
  ["hasActiveTasks"]() {
    return [...this["tasks"]["values"]()]["some"]((v34) =>
      ACTIVE_STATUSES["has"](v34["status"]),
    );
  }
  ["upsertTask"](v35, { silent: silent = false } = {}) {
    const v36 = normalizeTask(v35);
    if (!v36) return;
    const v37 = this["tasks"]["get"](v36["taskId"]);
    (this["tasks"]["set"](v36["taskId"], {
      ...(v37 || {}),
      ...v36,
      updatedAt: Date["now"](),
    }),
      this["trimTasks"]());
    if (!silent) this["scheduleRender"]();
    if (ACTIVE_STATUSES["has"](v36["status"])) this["startClock"]();
  }
  ["trimTasks"]() {
    if (this["tasks"]["size"] <= MAX_TASKS) return;
    const v38 = sortTasks([...this["tasks"]["values"]()])["slice"](
      0,
      MAX_TASKS,
    );
    this["tasks"] = new Map(v38["map"]((v39) => [v39["taskId"], v39]));
  }
  ["scheduleRender"]() {
    if (this["renderTimer"]) return;
    this["renderTimer"] = window["requestAnimationFrame"](() => {
      ((this["renderTimer"] = 0), this["render"]());
    });
  }
  ["getTaskGroups"]() {
    const v40 = sortTasks([...this["tasks"]["values"]()]);
    return {
      active: v40["filter"]((v41) => ACTIVE_STATUSES["has"](v41["status"])),
      failed: v40["filter"]((v42) => v42["status"] === "failed"),
      done: v40["filter"](
        (v43) => v43["status"] === "complete" || v43["status"] === "cancelled",
      ),
    };
  }
  ["updateBadge"](v44) {
    const v45 = v44["active"]["length"];
    if (!this["badgeEl"]) return;
    ((this["badgeEl"]["hidden"] = v45 <= 0),
      (this["badgeEl"]["textContent"] = v45 > 99 ? "99+" : String(v45)));
  }
  ["render"]() {
    if (!this["listEl"] || !this["summaryEl"]) return;
    const v46 = getElectronMediaTaskApi(),
      v47 = this["getTaskGroups"]();
    this["updateBadge"](v47);
    const v48 = v47["failed"]["length"],
      v49 = v47["done"]["length"];
    this["summaryEl"]["textContent"] = v46
      ? "进行中\x20" +
        v47["active"]["length"] +
        " · 失败 " +
        v48 +
        " · 已完成 " +
        v49
      : "当前环境没有桌面后台任务";
    if (this["clearBtn"]) this["clearBtn"]["hidden"] = v49 + v48 <= 0;
    this["listEl"]["replaceChildren"]();
    if (!v46) {
      this["listEl"]["appendChild"](
        el("div", "v2-task-center-empty", "桌面任务不可用"),
      );
      return;
    }
    if (
      v47["active"]["length"] +
        v47["failed"]["length"] +
        v47["done"]["length"] ===
      0
    ) {
      this["listEl"]["appendChild"](
        el("div", "v2-task-center-empty", "暂无后台任务"),
      );
      return;
    }
    (v47["active"]["length"] &&
      this["listEl"]["appendChild"](
        this["renderSection"]("正在处理", v47["active"]),
      ),
      v47["failed"]["length"] &&
        this["listEl"]["appendChild"](
          this["renderSection"]("失败", v47["failed"]),
        ),
      v47["done"]["length"] &&
        this["listEl"]["appendChild"](
          this["renderSection"]("最近完成", v47["done"]["slice"](0, 40)),
        ));
  }
  ["renderSection"](v50, v51) {
    const v52 = el("section", "v2-task-center-section");
    return (
      v52["appendChild"](el("div", "v2-task-center-section-title", v50)),
      v51["forEach"]((v53) => v52["appendChild"](this["renderTaskCard"](v53))),
      v52
    );
  }
  ["renderTaskCard"](v54) {
    const v55 = el("article", "v2-task-card");
    v55["dataset"]["taskId"] = v54["taskId"];
    const v56 = el("div", "v2-task-card-header"),
      v57 = el("div", "v2-task-card-main");
    v57["appendChild"](
      el("div", "v2-task-card-title", getTaskLabel(v54["kind"])),
    );
    const v58 = getTaskDuration(v54),
      v59 = [
        v54["message"] || getStatusLabel(v54["status"]),
        v58 ? "耗时 " + v58 : "",
      ]
        ["filter"](Boolean)
        ["join"](" · ");
    v57["appendChild"](el("div", "v2-task-card-meta", v59));
    const v60 = el(
      "span",
      "v2-task-status v2-task-status--" + v54["status"],
      getStatusLabel(v54["status"]),
    );
    (v56["append"](v57, v60), v55["appendChild"](v56));
    if (v54["status"] === "waiting" || v54["status"] === "processing") {
      const v61 = el("div", "v2-task-progress"),
        v62 = el("div", "v2-task-progress-fill");
      ((v62["style"]["width"] = formatPercent(
        v54["status"] === "waiting" ? 0 : v54["progress"],
      )),
        v61["appendChild"](v62),
        v55["appendChild"](v61));
    }
    v54["error"] &&
      v55["appendChild"](el("div", "v2-task-card-error", v54["error"]));
    const v63 = this["renderTaskActions"](v54);
    if (v63["childElementCount"] > 0) v55["appendChild"](v63);
    return v55;
  }
  ["renderTaskActions"](v64) {
    const v65 = el("div", "v2-task-card-actions");
    if (v64["status"] === "waiting" || v64["status"] === "processing") {
      const v66 = el(
        "button",
        "v2-task-card-action v2-task-card-action--danger",
        "取消",
      );
      ((v66["type"] = "button"),
        (v66["dataset"]["taskAction"] = "cancel"),
        (v66["dataset"]["taskId"] = v64["taskId"]),
        v65["appendChild"](v66));
    }
    const v67 = getResultLocalPath(v64["result"]);
    if (v67) {
      const v68 = el("button", "v2-task-card-action", "定位文件");
      ((v68["type"] = "button"),
        (v68["dataset"]["taskAction"] = "reveal"),
        (v68["dataset"]["localPath"] = v67),
        v65["appendChild"](v68));
    }
    if (v64["error"]) {
      const v69 = el("button", "v2-task-card-action", "复制错误");
      ((v69["type"] = "button"),
        (v69["dataset"]["taskAction"] = "copy-error"),
        (v69["dataset"]["taskId"] = v64["taskId"]),
        v65["appendChild"](v69));
    }
    return v65;
  }
  ["handleClick"](v70) {
    const v71 = v70["target"]["closest"]("[data-task-action]");
    if (!v71) return;
    (v70["preventDefault"](), v70["stopPropagation"]());
    const v72 = v71["dataset"]["taskAction"] || "";
    if (v72 === "clear-terminal") {
      for (const [v73, v74] of this["tasks"]["entries"]()) {
        if (TERMINAL_STATUSES["has"](v74["status"]))
          this["tasks"]["delete"](v73);
      }
      this["render"]();
      return;
    }
    if (v72 === "cancel") {
      const v75 = v71["dataset"]["taskId"] || "";
      void getElectronMediaTaskApi()
        ?.["cancel"]?.({ taskId: v75 })
        ["catch"]((v76) => {
          window["showToast"]?.(v76?.["message"] || "取消任务失败", "error");
        });
      return;
    }
    if (v72 === "reveal") {
      const v77 = v71["dataset"]["localPath"] || "";
      void globalThis["window"]?.["electronAPI"]
        ?.["showItemInFolder"]?.({ localPath: v77 })
        ?.["catch"]((v78) => {
          window["showToast"]?.(v78?.["message"] || "定位文件失败", "error");
        });
      return;
    }
    if (v72 === "copy-error") {
      const v79 = this["tasks"]["get"](v71["dataset"]["taskId"] || ""),
        v80 = v79?.["error"] || "";
      if (!v80) return;
      const v81 = globalThis["window"]?.["electronAPI"]?.["clipboard"],
        v82 =
          typeof v81?.["writeText"] === "function"
            ? v81["writeText"]({ text: v80 })
            : globalThis["navigator"]?.["clipboard"]?.["writeText"]?.(v80);
      if (!v82) {
        window["showToast"]?.("复制失败", "error");
        return;
      }
      void Promise["resolve"](v82)
        ["then"](() => window["showToast"]?.("已复制错误信息", "success"))
        ["catch"](() => window["showToast"]?.("复制失败", "error"));
    }
  }
}
export function initTaskCenterManager() {
  if (globalThis["window"]?.["__aiCanvasTaskCenterManager"])
    return globalThis["window"]["__aiCanvasTaskCenterManager"];
  const v83 = new TaskCenterManager();
  return ((globalThis["window"]["__aiCanvasTaskCenterManager"] = v83), v83);
}

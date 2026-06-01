import { spawn } from "node:child_process";
const TERMINAL_STATUSES = new Set(["complete", "failed", "cancelled"]);
function clampProgress(v0) {
  const v1 = Number(v0);
  if (!Number["isFinite"](v1)) return 0;
  return Math["max"](0, Math["min"](1, v1));
}
function createDefaultTaskId() {
  return (
    "media-task-" +
    Date["now"]() +
    "-" +
    Math["random"]()["toString"](16)["slice"](2)
  );
}
function parseFfmpegTimeSeconds(v2) {
  const v3 = String(v2 || "")["match"](
    /time=(\d{2}):(\d{2}):(\d{2})(?:[.,](\d+))?/,
  );
  if (!v3) return null;
  const v4 = Number(v3[1]) || 0,
    v5 = Number(v3[2]) || 0,
    v6 = Number(v3[3]) || 0,
    v7 = Number("0." + (v3[4] || "0")) || 0;
  return v4 * 3600 + v5 * 60 + v6 + v7;
}
export class MediaTaskCancelledError extends Error {
  constructor(v8 = "Media\x20task\x20cancelled") {
    (super(v8), (this["name"] = "MediaTaskCancelledError"));
  }
}
export class MediaTaskQueue {
  constructor({
    concurrency: concurrency = 2,
    handlers: handlers = {},
    onUpdate: onUpdate = null,
    onActivity: onActivity = null,
    idFactory: idFactory = createDefaultTaskId,
  } = {}) {
    ((this["concurrency"] = Math["max"](
      1,
      Math["trunc"](Number(concurrency) || 1),
    )),
      (this["handlers"] = { ...handlers }),
      (this["onUpdate"] = typeof onUpdate === "function" ? onUpdate : () => {}),
      (this["onActivity"] =
        typeof onActivity === "function" ? onActivity : () => {}),
      (this["idFactory"] =
        typeof idFactory === "function" ? idFactory : createDefaultTaskId),
      (this["tasks"] = new Map()),
      (this["waiting"] = []),
      (this["active"] = 0));
  }
  ["setHandler"](v9, v10) {
    const v11 = String(v9 || "")["trim"]();
    if (!v11 || typeof v10 !== "function") return;
    this["handlers"][v11] = v10;
  }
  ["enqueue"](v12 = {}) {
    const v13 = String(v12?.["kind"] || "")["trim"]();
    if (!v13) throw new Error("Missing media task kind");
    const v14 = this["handlers"][v13];
    if (typeof v14 !== "function")
      throw new Error("Unsupported media task kind: " + v13);
    const v15 = String(v12?.["taskId"] || "")["trim"]() || this["idFactory"](),
      v16 = {
        id: v15,
        taskId: v15,
        kind: v13,
        nodeId: String(v12?.["nodeId"] || "")["trim"](),
        payload: { ...v12, kind: v13, taskId: v15 },
        status: "waiting",
        progress: 0,
        message: "",
        error: "",
        result: null,
        child: null,
        cancelRequested: false,
        createdAt: Date["now"](),
        startedAt: 0,
        finishedAt: 0,
      };
    return (
      this["tasks"]["set"](v15, v16),
      this["waiting"]["push"](v16),
      this["_emit"](v16),
      this["_pump"](),
      this["_snapshot"](v16)
    );
  }
  ["cancel"](v17) {
    const v18 = String(v17 || "")["trim"](),
      v19 = this["tasks"]["get"](v18);
    if (!v19) return { ok: false, error: "Task not found" };
    if (TERMINAL_STATUSES["has"](v19["status"]))
      return { ok: true, task: this["_snapshot"](v19) };
    v19["cancelRequested"] = true;
    if (v19["status"] === "waiting")
      return (
        (this["waiting"] = this["waiting"]["filter"](
          (v20) => v20["id"] !== v18,
        )),
        this["_finish"](v19, "cancelled", {
          progress: v19["progress"],
          message: "Cancelled",
        }),
        this["_pump"](),
        { ok: true, task: this["_snapshot"](v19) }
      );
    if (v19["child"] && typeof v19["child"]["kill"] === "function")
      try {
        v19["child"]["kill"]();
      } catch {}
    return (
      this["_emit"](v19, { message: "Cancelling" }),
      { ok: true, task: this["_snapshot"](v19) }
    );
  }
  ["get"](v21) {
    const v22 = this["tasks"]["get"](String(v21 || "")["trim"]());
    return v22 ? this["_snapshot"](v22) : null;
  }
  ["list"]({ limit: limit = 100 } = {}) {
    const v23 = Math["max"](
      1,
      Math["min"](500, Math["trunc"](Number(limit) || 100)),
    );
    return [...this["tasks"]["values"]()]
      ["sort"](
        (v24, v25) =>
          Number(v25["createdAt"] || 0) - Number(v24["createdAt"] || 0),
      )
      ["slice"](0, v23)
      ["map"]((v26) => this["_snapshot"](v26));
  }
  ["getActivity"]() {
    return this["_activitySnapshot"]();
  }
  ["emitProgress"](v27, v28, v29 = "") {
    if (!v27 || TERMINAL_STATUSES["has"](v27["status"])) return;
    v27["progress"] = clampProgress(v28);
    if (v29) v27["message"] = String(v29);
    this["_emit"](v27);
  }
  ["isCancelled"](v30) {
    return v30?.["cancelRequested"] === true;
  }
  ["throwIfCancelled"](v31) {
    if (this["isCancelled"](v31)) throw new MediaTaskCancelledError();
  }
  ["runProcess"](v32, v33, v34 = [], v35 = {}) {
    return (
      this["throwIfCancelled"](v32),
      new Promise((v36, v37) => {
        const v38 = spawn(v33, v34, {
          cwd: v35["cwd"],
          env: v35["env"],
          stdio: v35["input"]
            ? ["pipe", "pipe", "pipe"]
            : ["ignore", "pipe", "pipe"],
          windowsHide: true,
        });
        v32["child"] = v38;
        const v39 = [],
          v40 = [],
          v41 = Number(v35["durationSec"] || 0);
        let v42 = clampProgress(v35["initialProgress"] || v32["progress"] || 0);
        const v43 = (v44, v45) => {
          if (v32["child"] === v38) v32["child"] = null;
          v44(v45);
        };
        (v38["stdout"]?.["on"]("data", (v46) =>
          v39["push"](Buffer["from"](v46)),
        ),
          v38["stderr"]?.["on"]("data", (v47) => {
            const v48 = Buffer["from"](v47);
            v40["push"](v48);
            if (v41 > 0) {
              const v49 = parseFfmpegTimeSeconds(v48["toString"]("utf8"));
              if (v49 != null) {
                const v50 = clampProgress(v49 / v41);
                v50 >= v42 + 0.01 &&
                  ((v42 = v50),
                  this["emitProgress"](v32, v50, v35["progressMessage"] || ""));
              }
            }
          }),
          v38["once"]("error", (v51) => v43(v37, v51)),
          v38["once"]("exit", (v52, v53) => {
            if (this["isCancelled"](v32)) {
              v43(v37, new MediaTaskCancelledError());
              return;
            }
            if (v52 === 0) {
              v43(v36, {
                stdout: Buffer["concat"](v39),
                stderr: Buffer["concat"](v40),
                code: v52,
                signal: v53,
              });
              return;
            }
            const v54 =
              Buffer["concat"](v40)["toString"]("utf8")["trim"]() ||
              v33 + " exited with " + (v52 ?? v53 ?? "unknown");
            v43(v37, new Error(v54));
          }),
          v35["input"] && v38["stdin"] && v38["stdin"]["end"](v35["input"]));
      })
    );
  }
  ["_pump"]() {
    while (
      this["active"] < this["concurrency"] &&
      this["waiting"]["length"] > 0
    ) {
      const v55 = this["waiting"]["shift"]();
      if (!v55 || TERMINAL_STATUSES["has"](v55["status"])) continue;
      this["_run"](v55);
    }
  }
  async ["_run"](v56) {
    ((this["active"] += 1),
      (v56["status"] = "processing"),
      (v56["startedAt"] = Date["now"]()),
      (v56["progress"] = Math["max"](v56["progress"], 0.01)),
      this["_emit"](v56));
    try {
      const v57 = await this["handlers"][v56["kind"]](v56, this);
      (this["throwIfCancelled"](v56),
        this["_finish"](v56, "complete", {
          progress: 1,
          message: "Complete",
          result: v57 && typeof v57 === "object" ? v57 : {},
        }));
    } catch (v58) {
      v58 instanceof MediaTaskCancelledError || this["isCancelled"](v56)
        ? this["_finish"](v56, "cancelled", { message: "Cancelled", error: "" })
        : this["_finish"](v56, "failed", {
            message: "Failed",
            error: String(v58?.["message"] || v58),
          });
    } finally {
      ((this["active"] -= 1), this["_pump"]());
    }
  }
  ["_finish"](v59, v60, v61 = {}) {
    ((v59["status"] = v60),
      (v59["finishedAt"] = Date["now"]()),
      (v59["child"] = null));
    if (v61["progress"] != null)
      v59["progress"] = clampProgress(v61["progress"]);
    if (v61["message"] != null) v59["message"] = String(v61["message"] || "");
    if (v61["error"] != null) v59["error"] = String(v61["error"] || "");
    if (v61["result"] != null) v59["result"] = v61["result"];
    this["_emit"](v59);
  }
  ["_emit"](v62, v63 = {}) {
    if (!v62) return;
    if (v63["progress"] != null)
      v62["progress"] = clampProgress(v63["progress"]);
    if (v63["message"] != null) v62["message"] = String(v63["message"] || "");
    if (v63["error"] != null) v62["error"] = String(v63["error"] || "");
    if (v63["result"] != null) v62["result"] = v63["result"];
    (this["onUpdate"](this["_snapshot"](v62)), this["_emitActivity"]());
  }
  ["_emitActivity"]() {
    this["onActivity"](this["_activitySnapshot"]());
  }
  ["_activitySnapshot"]() {
    const v64 = [...this["tasks"]["values"]()]
        ["filter"]((v65) => v65["status"] === "processing")
        ["map"]((v66) => this["_snapshot"](v66)),
      v67 = this["waiting"]["filter"]((v68) => v68["status"] === "waiting")[
        "length"
      ],
      v69 =
        v64["length"] > 0
          ? v64["reduce"](
              (v70, v71) => v70 + clampProgress(v71["progress"]),
              0,
            ) / v64["length"]
          : 0;
    return {
      activeCount: v64["length"],
      waitingCount: v67,
      totalCount: v64["length"] + v67,
      progress: clampProgress(v69),
      activeTasks: v64,
    };
  }
  ["_snapshot"](v72) {
    return {
      taskId: v72["id"],
      nodeId: v72["nodeId"],
      assetId: v72["payload"]?.["assetId"] || "",
      kind: v72["kind"],
      status: v72["status"],
      progress: clampProgress(v72["progress"]),
      message: v72["message"] || "",
      error: v72["error"] || "",
      result: v72["result"] || null,
      createdAt: v72["createdAt"],
      startedAt: v72["startedAt"],
      finishedAt: v72["finishedAt"],
    };
  }
}
export function __parseFfmpegTimeSecondsForTest(v73) {
  return parseFfmpegTimeSeconds(v73);
}

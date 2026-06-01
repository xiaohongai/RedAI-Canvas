import appStore from "./stores/appStore.js";
import {
  buildGenerationCancelledPatch,
  buildGenerationFailurePatch,
  buildGenerationStartPatch,
  buildGenerationSuccessPatch,
} from "./generationTaskLifecycle.js";
const WORKFLOW_ADAPTER = "workflow",
  MODEL_API_ADAPTER = "modelapi",
  LOCAL_RUNTIME_ADAPTER = "localruntime",
  REQUIRED_SPEC_FIELDS = Object["freeze"]([
    "sourceNodeId",
    "trigger",
    "taskType",
    "provider",
    "adapterType",
    "modelId",
    "executionId",
    "payload",
    "cancellable",
    "resumable",
    "resultBuilder",
  ]),
  activeTasks = new Map(),
  CANCELLED_MESSAGE = "任务已取消";
function nowFrom(v0 = {}) {
  return typeof v0["now"] === "function" ? v0["now"]() : Date["now"]();
}
function getStore(v1 = {}) {
  return v1["store"] || appStore;
}
function getStateSnapshot(v2) {
  return typeof v2["getStateRaw"] === "function"
    ? v2["getStateRaw"]()
    : v2["getState"]();
}
function normalizeAdapterType(v3) {
  return String(v3 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function isWorkflowSpec(v4 = {}, v5 = {}) {
  const v6 = normalizeAdapterType(v4["adapterType"] || v5["adapterType"]);
  return v6 === WORKFLOW_ADAPTER;
}
function isAsyncModelApiSpec(v7 = {}, v8 = {}) {
  const v9 = normalizeAdapterType(v7["adapterType"] || v8["adapterType"]);
  return v9 === MODEL_API_ADAPTER && v7["async"] === true;
}
function assertSpec(
  v10,
  {
    requireSubmit: requireSubmit = false,
    requireTarget: requireTarget = false,
  } = {},
) {
  if (!v10 || typeof v10 !== "object" || Array["isArray"](v10))
    throw new Error(
      "[generationTaskRuntime]\x20task\x20spec\x20must\x20be\x20an\x20object",
    );
  const v11 = REQUIRED_SPEC_FIELDS["filter"]((v12) => {
    if (v12 === "targetNodeId" || v12 === "payload") return false;
    if (v12 === "resultBuilder")
      return typeof v10["resultBuilder"] !== "function";
    return v10[v12] === undefined || v10[v12] === null || v10[v12] === "";
  });
  if (v10["payload"] === undefined) v11["push"]("payload");
  requireTarget &&
    !String(v10["targetNodeId"] || "")["trim"]() &&
    v11["push"]("targetNodeId");
  requireSubmit &&
    typeof getSubmitFn(v10) !== "function" &&
    v11["push"]("submit");
  if (v11["length"])
    throw new Error(
      "[generationTaskRuntime]\x20missing\x20required\x20task\x20fields:\x20" +
        v11["join"](",\x20"),
    );
}
function getSubmitFn(v13) {
  return v13["submit"] || v13["adapter"]?.["submit"] || null;
}
function getPollFn(v14) {
  return (
    v14["poll"] ||
    v14["spec"]?.["poll"] ||
    v14["spec"]?.["adapter"]?.["poll"] ||
    null
  );
}
function getCancelFn(v15, v16 = {}) {
  return (
    v16["cancel"] ||
    v15["cancel"] ||
    v15["spec"]?.["cancel"] ||
    v15["spec"]?.["adapter"]?.["cancel"] ||
    null
  );
}
function extractTaskId(v17) {
  const v18 = [
    v17?.["taskId"],
    v17?.["task_id"],
    v17?.["id"],
    v17?.["data"]?.["taskId"],
    v17?.["data"]?.["task_id"],
    v17?.["data"]?.["id"],
  ];
  return String(v18["find"]((v19) => String(v19 || "")["trim"]()) || "")[
    "trim"
  ]();
}
function extractSubmittedResult(v20) {
  if (!v20 || typeof v20 !== "object") return v20;
  if (Object["prototype"]["hasOwnProperty"]["call"](v20, "result"))
    return v20["result"];
  if (Object["prototype"]["hasOwnProperty"]["call"](v20, "output"))
    return v20["output"];
  return v20;
}
function isPendingResult(v21) {
  return !!v21 && typeof v21 === "object" && v21["pending"] === true;
}
function getPendingMessage(v22) {
  return String(
    v22?.["message"] || v22?.["statusMessage"] || v22?.["msg"] || "",
  )["trim"]();
}
function buildProtocolStartPatch(v23, v24) {
  const v25 = {
    taskTrigger: String(v23["trigger"] || ""),
    taskType: String(v23["taskType"] || ""),
    taskProvider: String(v23["provider"] || ""),
    taskAdapterType: String(v23["adapterType"] || ""),
    taskModelId: String(v23["modelId"] || ""),
    taskExecutionId: String(v23["executionId"] || ""),
    taskCancellable: v23["cancellable"] === true,
    taskResumable: v23["resumable"] === true,
  };
  if (isWorkflowSpec(v23))
    return {
      ...v25,
      rhTaskId: "",
      rhTaskStatus: "pending",
      rhTaskStartedAt: v24,
      rhTaskRecovering: false,
      rhSourceNodeId: String(v23["sourceNodeId"] || ""),
      rhToolbarTaskType: String(v23["taskType"] || ""),
    };
  if (isAsyncModelApiSpec(v23))
    return {
      ...v25,
      asyncTaskId: "",
      asyncTaskStatus: "pending",
      asyncTaskStartedAt: v24,
      asyncTaskRecovering: false,
    };
  return v25;
}
function buildProtocolTaskIdPatch(v26, v27, v28) {
  if (!v27) return {};
  if (isWorkflowSpec(v26))
    return {
      rhTaskId: v27,
      rhTaskStatus: "running",
      rhTaskStartedAt: v28,
      rhTaskRecovering: false,
    };
  if (isAsyncModelApiSpec(v26))
    return {
      asyncTaskId: v27,
      asyncTaskStatus: "running",
      asyncTaskStartedAt: v28,
      asyncTaskRecovering: false,
    };
  return {};
}
function buildProtocolTerminalPatch(v29, v30) {
  if (isWorkflowSpec(v29))
    return { rhTaskStatus: v30, rhTaskRecovering: false };
  if (isAsyncModelApiSpec(v29))
    return { asyncTaskStatus: v30, asyncTaskRecovering: false };
  return {};
}
function buildProtocolPendingPatch(v31, v32, v33 = "") {
  const v34 = String(v32?.["taskId"] || "")["trim"](),
    v35 = {
      isGenerating: true,
      jobStatus: "running",
      jobError: null,
      generationDuration: null,
      ...(v33 ? { statusMessage: v33 } : {}),
    };
  if (isWorkflowSpec(v31))
    return {
      ...v35,
      ...(v34
        ? buildProtocolTaskIdPatch(v31, v34, v32["startedAt"])
        : { rhTaskStatus: "pending" }),
      rhTaskRecovering: false,
      ...(v33 ? { rhStatusMessage: v33 } : {}),
    };
  if (isAsyncModelApiSpec(v31))
    return {
      ...v35,
      ...(v34
        ? buildProtocolTaskIdPatch(v31, v34, v32["startedAt"])
        : { asyncTaskStatus: "pending" }),
      asyncTaskRecovering: false,
    };
  return v35;
}
function isMissingTargetNodeError(v36, v37) {
  const v38 = String(v36?.["message"] || "");
  return (
    v38["includes"]("updateNodeData()") && v38["includes"](String(v37 || ""))
  );
}
function updateTaskNode(
  v39,
  v40,
  v41,
  { allowMissing: allowMissing = false } = {},
) {
  if (!v40 || !v41 || typeof v41 !== "object") return false;
  try {
    return (v39["updateNodeData"](v40, v41), true);
  } catch (v42) {
    if (allowMissing && isMissingTargetNodeError(v42, v40)) return false;
    throw v42;
  }
}
function notifyTaskChange(v43, v44 = {}) {
  typeof v43?.["spec"]?.["onTaskChange"] === "function" &&
    v43["spec"]["onTaskChange"]({
      sourceNodeId: v43["sourceNodeId"],
      targetNodeId: v43["targetNodeId"],
      taskId: v43["taskId"],
      ...v44,
    });
}
function isAbortLike(v45) {
  const v46 = String(v45?.["message"] || v45 || "");
  return (
    v45?.["name"] === "AbortError" ||
    v46 === "CANCELLED" ||
    v46 === "任务已取消" ||
    v46["toLowerCase"]()["includes"]("aborted")
  );
}
function parseErrorMessage(v47, v48 = {}, v49 = "生成失败") {
  if (typeof v48["parseError"] === "function") {
    const v50 = v48["parseError"](v47),
      v51 = String(v50 || "")["trim"]();
    if (v51) return v51;
  }
  if (typeof v47?.["getUserMessage"] === "function") {
    const v52 = String(v47["getUserMessage"]() || "")["trim"]();
    if (v52) return v52;
  }
  return String(v47?.["message"] || v49)["trim"]() || v49;
}
function createCancelledError() {
  const v53 = new Error(CANCELLED_MESSAGE);
  return ((v53["name"] = "AbortError"), v53);
}
function isCancelledStatus(v54) {
  const v55 = String(v54 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v55 === "cancelled" || v55 === "canceled";
}
function isContextCancelled(v56) {
  if (v56?.["cancelRequested"] === true) return true;
  const v57 = getStateSnapshot(v56["store"])["nodes"]?.[v56["targetNodeId"]];
  return (
    isCancelledStatus(v57?.["jobStatus"]) ||
    isCancelledStatus(v57?.["rhTaskStatus"]) ||
    isCancelledStatus(v57?.["asyncTaskStatus"])
  );
}
async function cancelRemoteTask(
  v58,
  { taskId: v59, node: node = null, options: options = {} } = {},
) {
  const v60 = String(v59 || v58?.["taskId"] || "")["trim"](),
    v61 = getCancelFn(v58 || { spec: options["spec"] }, options);
  if (typeof v61 !== "function" || !v60) return;
  return await v61({
    taskId: v60,
    targetNodeId: v58?.["targetNodeId"] || options["targetNodeId"] || "",
    sourceNodeId: v58?.["sourceNodeId"] || node?.["rhSourceNodeId"] || "",
    spec: v58?.["spec"] || options["spec"] || {},
    node: node,
  });
}
async function ensureTargetNode(v62, v63, v64) {
  const v65 = String(v62["targetNodeId"] || "")["trim"]();
  if (v65) return v65;
  if (typeof v62["createTargetNode"] !== "function")
    throw new Error(
      "[generationTaskRuntime] targetNodeId or createTargetNode() is required",
    );
  const v66 = await v62["createTargetNode"]({
    spec: v62,
    startedAt: v64,
    startPatch: buildGenerationStartPatch({ startedAt: v64 }),
    protocolPatch: buildProtocolStartPatch(v62, v64),
  });
  if (!v66 || typeof v66 !== "object")
    throw new Error(
      "[generationTaskRuntime]\x20createTargetNode()\x20must\x20return\x20a\x20node",
    );
  const v67 = String(v66["id"] || "")["trim"]();
  if (!v67)
    throw new Error(
      "[generationTaskRuntime]\x20created\x20target\x20node\x20must\x20include\x20id",
    );
  return (v63["addNode"](v66), v67);
}
function buildContext(v68, v69, v70, v71, v72) {
  const v73 =
    v72["abortController"] ||
    (typeof AbortController === "function" ? new AbortController() : null);
  return {
    spec: v68,
    store: v70,
    targetNodeId: v69,
    sourceNodeId: String(v68["sourceNodeId"] || ""),
    taskType: String(v68["taskType"] || ""),
    startedAt: v71,
    taskId: String(v68["taskId"] || ""),
    abortController: v73,
    signal: v72["signal"] || v73?.["signal"] || null,
    cancelRequested: false,
  };
}
export async function normalizeResult(v74, { spec: v75, context: v76 } = {}) {
  if (typeof v75?.["resultBuilder"] !== "function") return {};
  const v77 = await v75["resultBuilder"](v74, {
    spec: v75,
    targetNodeId: v76?.["targetNodeId"] || v75["targetNodeId"],
    sourceNodeId: v76?.["sourceNodeId"] || v75["sourceNodeId"],
    taskId: v76?.["taskId"] || v75["taskId"] || "",
    startedAt: v76?.["startedAt"] || v75["startedAt"] || 0,
  });
  return v77 && typeof v77 === "object" ? v77 : {};
}
async function buildOptionalTaskPatch(v78, v79) {
  if (typeof v78 !== "function") return {};
  const v80 = await v78(...v79);
  return v80 && typeof v80 === "object" ? v80 : {};
}
async function buildStartExtraPatch(v81, v82) {
  if (typeof v81?.["startBuilder"] === "function") {
    const v83 = await v81["startBuilder"](v82);
    return v83 && typeof v83 === "object" ? v83 : {};
  }
  if (
    v81?.["startPatch"] &&
    typeof v81["startPatch"] === "object" &&
    !Array["isArray"](v81["startPatch"])
  )
    return { ...v81["startPatch"] };
  return {};
}
export async function pollTask(v84, v85 = {}) {
  const v86 = getPollFn(v84);
  if (typeof v86 !== "function")
    throw new Error(
      "[generationTaskRuntime]\x20poll\x20function\x20is\x20required",
    );
  return v86({
    taskId: String(v84["taskId"] || v84["spec"]?.["taskId"] || ""),
    targetNodeId: v84["targetNodeId"] || v84["spec"]?.["targetNodeId"],
    sourceNodeId: v84["sourceNodeId"] || v84["spec"]?.["sourceNodeId"],
    taskType: v84["taskType"] || v84["spec"]?.["taskType"],
    payload: v84["payload"] || v84["spec"]?.["payload"],
    spec: v84["spec"] || v84,
    signal:
      v85["signal"] ||
      v84["signal"] ||
      v84["abortController"]?.["signal"] ||
      null,
  });
}
export async function submitTask(v87, v88 = {}) {
  assertSpec(v87, { requireSubmit: true });
  const v89 = getStore(v88),
    v90 = Number(v87["startedAt"] || v88["startedAt"] || nowFrom(v88)),
    v91 = String(v87["targetNodeId"] || "")["trim"](),
    v92 = v91 || (await ensureTargetNode(v87, v89, v90)),
    v93 = { ...v87, targetNodeId: v92 },
    v94 = buildContext(v93, v92, v89, v90, v88);
  activeTasks["set"](v92, v94);
  const v95 = await buildStartExtraPatch(v93, v94);
  updateTaskNode(v89, v92, {
    ...buildGenerationStartPatch({ startedAt: v90 }),
    ...buildProtocolStartPatch(v93, v90),
    ...v95,
  });
  typeof v93["onTaskStart"] === "function" && v93["onTaskStart"](v94);
  notifyTaskChange(v94, { status: "running" });
  try {
    const v96 = getSubmitFn(v93),
      v97 = await v96(v93["payload"], {
        spec: v93,
        targetNodeId: v92,
        sourceNodeId: v94["sourceNodeId"],
        taskType: v94["taskType"],
        signal: v94["signal"],
        onTaskId: (v98) => {
          const v99 = String(v98 || "")["trim"]();
          if (!v99) return;
          v94["taskId"] = v99;
          if (isContextCancelled(v94)) return;
          (updateTaskNode(v89, v92, buildProtocolTaskIdPatch(v93, v99, v90)),
            notifyTaskChange(v94, { status: "running" }));
        },
      }),
      v100 = extractTaskId(v97);
    v100 && (v94["taskId"] = v100);
    if (isContextCancelled(v94)) {
      try {
        await cancelRemoteTask(v94, {
          taskId: v94["taskId"],
          node: getStateSnapshot(v89)["nodes"]?.[v92],
        });
      } catch {}
      throw createCancelledError();
    }
    v100 &&
      (updateTaskNode(v89, v92, buildProtocolTaskIdPatch(v93, v100, v90)),
      notifyTaskChange(v94, { status: "running" }));
    if (v93["waitForResult"] === false)
      return {
        ok: true,
        status: "submitted",
        targetNodeId: v92,
        taskId: v94["taskId"],
      };
    const v101 =
      v94["taskId"] && getPollFn({ spec: v93 })
        ? await pollTask({ ...v94, spec: v93 }, { signal: v94["signal"] })
        : extractSubmittedResult(v97);
    if (isContextCancelled(v94)) throw createCancelledError();
    if (isPendingResult(v101)) {
      const v102 = getPendingMessage(v101);
      return (
        updateTaskNode(v89, v92, buildProtocolPendingPatch(v93, v94, v102)),
        notifyTaskChange(v94, { status: "pending" }),
        {
          ok: true,
          status: "pending",
          pending: true,
          targetNodeId: v92,
          taskId: v94["taskId"],
          result: v101,
        }
      );
    }
    const v103 = await normalizeResult(v101, { spec: v93, context: v94 });
    if (isContextCancelled(v94)) throw createCancelledError();
    const v104 = nowFrom(v88) - v90;
    return (
      updateTaskNode(v89, v92, {
        ...buildGenerationSuccessPatch({ startedAt: v90, duration: v104 }),
        ...v103,
        ...buildProtocolTerminalPatch(v93, "success"),
      }),
      activeTasks["delete"](v92),
      notifyTaskChange(v94, { status: "success" }),
      {
        ok: true,
        status: "success",
        targetNodeId: v92,
        taskId: v94["taskId"],
        result: v101,
      }
    );
  } catch (v105) {
    const v106 = nowFrom(v88) - v90,
      v107 = isAbortLike(v105),
      v108 = getStateSnapshot(v89)["nodes"]?.[v92] || {};
    if (
      v107 &&
      (isCancelledStatus(v108?.["jobStatus"]) ||
        isCancelledStatus(v108?.["rhTaskStatus"]) ||
        isCancelledStatus(v108?.["asyncTaskStatus"]))
    )
      return (
        activeTasks["delete"](v92),
        notifyTaskChange(v94, { status: "cancelled" }),
        {
          ok: false,
          status: "cancelled",
          targetNodeId: v92,
          taskId: v94["taskId"],
          error: v105,
        }
      );
    if (v107 && v93["pauseOnAbort"] === true) {
      const v109 = await buildOptionalTaskPatch(v93["pauseBuilder"], [v94]);
      return (
        updateTaskNode(
          v89,
          v92,
          { ...buildProtocolPendingPatch(v93, v94), ...v109 },
          { allowMissing: true },
        ),
        activeTasks["delete"](v92),
        notifyTaskChange(v94, { status: "paused" }),
        {
          ok: false,
          status: "paused",
          targetNodeId: v92,
          taskId: v94["taskId"],
          error: v105,
        }
      );
    }
    const v110 = v107
        ? buildGenerationCancelledPatch({ startedAt: v90, duration: v106 })
        : buildGenerationFailurePatch({
            error: parseErrorMessage(v105, v93, "生成失败"),
            startedAt: v90,
            duration: v106,
          }),
      v111 = await buildOptionalTaskPatch(
        v107 ? v93["cancelledBuilder"] : v93["failureBuilder"],
        v107 ? [v94] : [v105, v94],
      );
    return (
      updateTaskNode(v89, v92, {
        ...v110,
        ...v111,
        ...buildProtocolTerminalPatch(v93, v107 ? "cancelled" : "failed"),
      }),
      activeTasks["delete"](v92),
      notifyTaskChange(v94, { status: v107 ? "cancelled" : "failed" }),
      {
        ok: false,
        status: v107 ? "cancelled" : "failed",
        targetNodeId: v92,
        taskId: v94["taskId"],
        error: v105,
      }
    );
  }
}
export async function cancelTask(v112, v113 = {}) {
  const v114 = getStore(v113),
    v115 = String(
      typeof v112 === "object"
        ? v112?.["targetNodeId"] || v112?.["outId"] || v112?.["id"]
        : v112 || "",
    )["trim"]();
  if (!v115) return { ok: false, reason: "missing-target" };
  const v116 = activeTasks["get"](v115) || null,
    v117 = getStateSnapshot(v114)["nodes"]?.[v115] || {},
    v118 = v116?.["spec"] ||
      v113["spec"] || {
        adapterType: v117["adapterType"],
        provider: v117["provider"],
        async: !!v117["asyncTaskId"],
      },
    v119 =
      v113["cancellable"] === true || v116?.["spec"]?.["cancellable"] === true;
  if (!v119) {
    if (v113["abortLocal"] === true) {
      if (v116) v116["cancelRequested"] = true;
      v116?.["abortController"]?.["abort"]?.();
    }
    return { ok: false, reason: "not-cancellable", targetNodeId: v115 };
  }
  const v120 = String(
      v113["taskId"] ||
        v116?.["taskId"] ||
        v112?.["taskId"] ||
        v117["rhTaskId"] ||
        v117["asyncTaskId"] ||
        "",
    ),
    v121 = getCancelFn(v116 || { spec: v118 }, v113);
  let v122 = null,
    v123 = null;
  try {
    if (v116) v116["cancelRequested"] = true;
    v116?.["abortController"]?.["abort"]?.();
  } catch {}
  if (typeof v121 === "function" && v120)
    try {
      v122 = await cancelRemoteTask(
        v116 || { spec: v118, targetNodeId: v115 },
        {
          taskId: v120,
          node: v117,
          options: { ...v113, cancel: v121, spec: v118, targetNodeId: v115 },
        },
      );
    } catch (v124) {
      v123 = v124;
    }
  const v125 =
      Number(v117["generationStartTime"] || v117["rhTaskStartedAt"] || 0) || 0,
    v126 = await buildOptionalTaskPatch(
      v113["cancelledBuilder"] || v118["cancelledBuilder"],
      [
        {
          spec: v118,
          store: v114,
          targetNodeId: v115,
          startedAt: v125,
          taskId: v120,
          remoteResult: v122,
          remoteError: v123,
        },
      ],
    );
  return (
    updateTaskNode(v114, v115, {
      ...buildGenerationCancelledPatch({ startedAt: v125 }),
      ...v126,
      ...buildProtocolTerminalPatch(v118, "cancelled"),
    }),
    activeTasks["delete"](v115),
    notifyTaskChange(v116, { status: "cancelled" }),
    { ok: true, status: "cancelled", targetNodeId: v115, taskId: v120 }
  );
}
export async function resumeTask(v127, v128 = {}) {
  assertSpec(v127, { requireTarget: true });
  const v129 = getStore(v128),
    v130 = String(v127["targetNodeId"] || "")["trim"](),
    v131 = getStateSnapshot(v129)["nodes"]?.[v130] || {},
    v132 =
      Number(
        v127["startedAt"] ||
          v131["generationStartTime"] ||
          v131["rhTaskStartedAt"] ||
          nowFrom(v128),
      ) || nowFrom(v128),
    v133 = String(
      v127["taskId"] || v131["rhTaskId"] || v131["asyncTaskId"] || "",
    )["trim"]();
  if (!v133)
    throw new Error("[generationTaskRuntime] resumeTask requires taskId");
  const v134 = { ...v127, targetNodeId: v130, taskId: v133 },
    v135 = buildContext(v134, v130, v129, v132, v128);
  ((v135["taskId"] = v133), activeTasks["set"](v130, v135));
  const v136 = await buildStartExtraPatch(v134, v135);
  updateTaskNode(v129, v130, {
    ...buildGenerationStartPatch({ startedAt: v132 }),
    ...buildProtocolTaskIdPatch(v134, v133, v132),
    ...v136,
    ...(isWorkflowSpec(v134) ? { rhTaskRecovering: true } : {}),
    ...(isAsyncModelApiSpec(v134) ? { asyncTaskRecovering: true } : {}),
  });
  typeof v134["onTaskStart"] === "function" && v134["onTaskStart"](v135);
  notifyTaskChange(v135, { status: "running", recovering: true });
  try {
    const v137 = await pollTask(
      { ...v135, spec: v134 },
      { signal: v135["signal"] },
    );
    if (isContextCancelled(v135)) throw createCancelledError();
    if (isPendingResult(v137)) {
      const v138 = getPendingMessage(v137);
      return (
        updateTaskNode(v129, v130, buildProtocolPendingPatch(v134, v135, v138)),
        notifyTaskChange(v135, { status: "pending", recovering: true }),
        {
          ok: true,
          status: "pending",
          pending: true,
          targetNodeId: v130,
          taskId: v133,
          result: v137,
        }
      );
    }
    const v139 = await normalizeResult(v137, { spec: v134, context: v135 });
    if (isContextCancelled(v135)) throw createCancelledError();
    const v140 = nowFrom(v128) - v132;
    return (
      updateTaskNode(v129, v130, {
        ...buildGenerationSuccessPatch({ startedAt: v132, duration: v140 }),
        ...v139,
        ...buildProtocolTerminalPatch(v134, "success"),
      }),
      activeTasks["delete"](v130),
      notifyTaskChange(v135, { status: "success", recovering: false }),
      {
        ok: true,
        status: "success",
        targetNodeId: v130,
        taskId: v133,
        result: v137,
      }
    );
  } catch (v141) {
    const v142 = nowFrom(v128) - v132,
      v143 = isAbortLike(v141),
      v144 = getStateSnapshot(v129)["nodes"]?.[v130] || {};
    if (
      v143 &&
      (isCancelledStatus(v144?.["jobStatus"]) ||
        isCancelledStatus(v144?.["rhTaskStatus"]) ||
        isCancelledStatus(v144?.["asyncTaskStatus"]))
    )
      return (
        activeTasks["delete"](v130),
        notifyTaskChange(v135, { status: "cancelled", recovering: false }),
        {
          ok: false,
          status: "cancelled",
          targetNodeId: v130,
          taskId: v133,
          error: v141,
        }
      );
    if (v143 && v134["pauseOnAbort"] === true) {
      const v145 = await buildOptionalTaskPatch(v134["pauseBuilder"], [v135]);
      return (
        updateTaskNode(
          v129,
          v130,
          { ...buildProtocolPendingPatch(v134, v135), ...v145 },
          { allowMissing: true },
        ),
        activeTasks["delete"](v130),
        notifyTaskChange(v135, { status: "paused", recovering: false }),
        {
          ok: false,
          status: "paused",
          targetNodeId: v130,
          taskId: v133,
          error: v141,
        }
      );
    }
    const v146 = v143
        ? buildGenerationCancelledPatch({ startedAt: v132, duration: v142 })
        : buildGenerationFailurePatch({
            error: parseErrorMessage(v141, v134, "恢复失败"),
            startedAt: v132,
            duration: v142,
          }),
      v147 = await buildOptionalTaskPatch(
        v143 ? v134["cancelledBuilder"] : v134["failureBuilder"],
        v143 ? [v135] : [v141, v135],
      );
    return (
      updateTaskNode(v129, v130, {
        ...v146,
        ...v147,
        ...buildProtocolTerminalPatch(v134, v143 ? "cancelled" : "failed"),
      }),
      activeTasks["delete"](v130),
      notifyTaskChange(v135, {
        status: v143 ? "cancelled" : "failed",
        recovering: false,
      }),
      {
        ok: false,
        status: v143 ? "cancelled" : "failed",
        targetNodeId: v130,
        taskId: v133,
        error: v141,
      }
    );
  }
}
export function getActiveGenerationTask(v148) {
  return activeTasks["get"](String(v148 || "")["trim"]()) || null;
}
export function __resetGenerationTaskRuntimeForTest() {
  activeTasks["clear"]();
}

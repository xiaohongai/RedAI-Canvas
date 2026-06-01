import appStore from "../../core/stores/appStore.js";
import { generateId } from "../../core/math.js";
import {
  getModelDisplayName,
  getModelProvider,
} from "../../config/modelConfig.js";
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
} from "../../services/fileService.js";
import {
  OUTPUT_RATIO_SWITCH_THRESHOLD,
  calcDisplaySizeByMedia,
  resolveInputRatioBasis,
  resolveOutputMediaSize,
  shouldSwitchToOutputRatio,
} from "../../services/mediaRatioService.js";
import { calcSafeSpawnPosNearNode } from "../nodeSpawn.js";
import { generateImage } from "../../../api/aiImageApi.js";
import {
  buildAsyncTaskPatch,
  buildDreaminaTaskPatch,
  buildRunningHubTaskPatch,
  isDreaminaTaskModel,
  isRunningHubModelApiTaskModel,
  isRunningHubTaskModel,
  persistRunningHubResumeCache,
} from "./taskPatch.js";
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from "../../components/aigenImage/imageGenerationResultRenderer.js";
import { buildGenerationStartPatch } from "../../core/generationTaskLifecycle.js";
import { isTaskCancelled } from "../../core/generationTaskUiState.js";
const SCENE_CONFIG = {
  erase: {
    idPrefix: "source-image-erase",
    pendingName: "擦除生成中...",
    resultName: "擦除结果",
    failureName: "擦除生成失败",
    successToast: "擦除生成成功",
  },
  repaint: {
    idPrefix: "source-image-repaint",
    pendingName: "重绘生成中...",
    resultName: "重绘结果",
    failureName: "重绘生成失败",
    successToast: "重绘生成成功",
  },
};
export const resolveGenerationRuntime = ({ model: v0, provider: v1 } = {}) => {
  const v2 = String(v0 || "")["trim"](),
    v3 = String(v1 || getModelProvider(v2) || "")["trim"](),
    v4 = isRunningHubTaskModel(v2, v3),
    v5 = isDreaminaTaskModel(v2, v3);
  return {
    model: v2,
    provider: v3,
    isRunningHubTask: v4,
    isDreaminaTask: v5,
    isAsyncTask: !v4 && !v5,
    asyncProvider: v3["toLowerCase"](),
    useOpenapiByModel: isRunningHubModelApiTaskModel(v2, v3),
  };
};
export const buildGenerationOutputText = ({
  model: v6,
  prompt: v7,
  errorMessage: errorMessage = "",
} = {}) => {
  const v8 = [
    "模型: " + getModelDisplayName(v6),
    "提示词:\x20" + String(v7 || "")["trim"](),
  ];
  return (
    errorMessage &&
      v8["push"](
        "错误: " + (String(errorMessage || "")["trim"]() || "未知错误"),
      ),
    v8["join"]("\x0a")
  );
};
const persistGenerationRuntimeIfNeeded = (v9) => {
  (v9?.["isRunningHubTask"] || v9?.["isDreaminaTask"] || v9?.["isAsyncTask"]) &&
    persistRunningHubResumeCache();
};
export const buildGenerationRuntimePatch = ({
  phase: v10,
  runtime: v11,
  latestNode: v12,
  startTime: v13,
  taskId: taskId = "",
  taskProvider: taskProvider = "",
  useOpenapiQuery: useOpenapiQuery = false,
  errorMessage: errorMessage = "",
} = {}) => {
  const v14 = String(
    taskId ||
      v12?.["rhTaskId"] ||
      v12?.["dreaminaSubmitId"] ||
      v12?.["asyncTaskId"] ||
      "",
  )["trim"]();
  if (v11?.["isRunningHubTask"])
    return buildRunningHubTaskPatch({
      taskId: v14,
      status: v10,
      startedAt: v13,
      recovering: false,
      useOpenapiQuery:
        v10 === "pending"
          ? v11["useOpenapiByModel"]
          : v10 === "running"
            ? useOpenapiQuery === true ||
              v12?.["rhTaskUseOpenapiQuery"] === true ||
              v11["useOpenapiByModel"]
            : v12?.["rhTaskUseOpenapiQuery"] === true ||
              v11["useOpenapiByModel"],
    });
  if (v11?.["isDreaminaTask"])
    return buildDreaminaTaskPatch({
      submitId: v14,
      status: v10 === "running" ? "pending" : v10,
      phase:
        v10 === "success" ? "done" : v10 === "failed" ? "failed" : "generating",
      label:
        v10 === "success"
          ? "已完成"
          : v10 === "failed"
            ? errorMessage || "生成失败"
            : v10 === "running"
              ? "生成中"
              : "提交中",
      startedAt: v13,
      recovering: false,
    });
  if (v11?.["isAsyncTask"])
    return buildAsyncTaskPatch({
      provider: String(
        taskProvider ||
          v12?.["asyncTaskProvider"] ||
          v11["asyncProvider"] ||
          "",
      )["trim"](),
      kind: "image",
      taskId: v14,
      status: v10,
      startedAt: v13,
      recovering: false,
    });
  return {};
};
const updateGenerationRuntimeNode = ({
  nodeId: v15,
  runtime: v16,
  startTime: v17,
  phase: v18,
  taskId: taskId = "",
  taskProvider: taskProvider = "",
  useOpenapiQuery: useOpenapiQuery = false,
  errorMessage: errorMessage = "",
} = {}) => {
  const v19 = String(taskId || "")["trim"]();
  if (!v19 && v18 === "running") return;
  const v20 = appStore["getState"]()["nodes"]?.[v15];
  if (!v20) return;
  if (isTaskCancelled(v20)) return;
  (appStore["updateNodeData"](v15, {
    ...buildGenerationRuntimePatch({
      phase: v18,
      runtime: v16,
      latestNode: v20,
      startTime: v17,
      taskId:
        v19 ||
        v20?.["rhTaskId"] ||
        v20?.["dreaminaSubmitId"] ||
        v20?.["asyncTaskId"] ||
        "",
      taskProvider: taskProvider,
      useOpenapiQuery: useOpenapiQuery,
      errorMessage: errorMessage,
    }),
  }),
    persistGenerationRuntimeIfNeeded(v16));
};
export const runGenerationResultFlow = async ({
  scene: v21,
  built: v22,
  sourceNode: v23,
  fallbackModel: v24,
  fallbackProvider: v25,
  exitController: v26,
  notify: notify = (v27, v28) => window["showToast"]?.(v27, v28),
} = {}) => {
  if (!v22?.["payload"]) return;
  const v29 = SCENE_CONFIG[v21];
  if (!v29) throw new Error("未知生成场景: " + v21);
  const v30 = resolveGenerationRuntime({
      model: v22?.["payload"]?.["model"] || v24,
      provider: v22?.["payload"]?.["provider"] || v25,
    }),
    v31 = String(v22?.["payload"]?.["prompt"] || "")["trim"](),
    v32 = Date["now"](),
    v33 = v22["inputUrl"];
  let v34 = null;
  const v35 = () => {
    if (!v34) return false;
    return isTaskCancelled(appStore["getState"]()["nodes"]?.[v34]);
  };
  try {
    const v36 = Number(v22?.["naturalWidth"]) || v23?.["width"] || 1,
      v37 = Number(v22?.["naturalHeight"]) || v23?.["height"] || 1,
      { width: v38, height: v39 } = getAutoMediaSizeByShortSide(v36, v37),
      { x: v40, y: v41 } = calcSafeSpawnPosNearNode(
        appStore["getState"]()["nodes"],
        v23,
        v38,
        v39,
      );
    ((v34 = generateId(v29["idPrefix"])),
      appStore["addNode"](
        buildSourceMediaNodePayload({
          id: v34,
          type: "source-image",
          x: v40,
          y: v41,
          width: v38,
          height: v39,
          needsAutoResize: false,
          name: v29["pendingName"],
          src: "",
          ...buildGenerationStartPatch({ startedAt: v32 }),
          provider: v30["provider"],
          model: v30["model"],
          ...(v30["isRunningHubTask"]
            ? {
                rhSourceNodeId: v23?.["id"] || "",
                rhToolbarTaskType: "image-" + v21,
              }
            : {}),
          ...buildGenerationRuntimePatch({
            phase: "pending",
            runtime: v30,
            startTime: v32,
          }),
          outputText: buildGenerationOutputText({
            model: v30["model"],
            prompt: v31,
          }),
        }),
      ),
      persistGenerationRuntimeIfNeeded(v30),
      appStore["setSelectedNodes"]([v34]));
    typeof window["v2FocusOnNodes"] === "function"
      ? window["v2FocusOnNodes"]([v23?.["id"], v34])
      : window["v2FocusOnNode"]?.(v34);
    v26?.({ silent: true });
    const v42 = await generateImage(v22["payload"], {
      onTaskMeta: ({ taskId: v43, useOpenapiQuery: v44, provider: v45 }) => {
        updateGenerationRuntimeNode({
          nodeId: v34,
          runtime: v30,
          startTime: v32,
          phase: "running",
          taskId: v43,
          taskProvider: v45,
          useOpenapiQuery: v44,
        });
      },
      onTaskId: (v46) => {
        updateGenerationRuntimeNode({
          nodeId: v34,
          runtime: v30,
          startTime: v32,
          phase: "running",
          taskId: v46,
        });
      },
    });
    if (v35()) return;
    if (v42?.["error"]) throw new Error(v42["error"]);
    const v47 = appStore["getState"]()["nodes"]?.[v34],
      v48 = v47?.["generationStartTime"]
        ? Date["now"]() - v47["generationStartTime"]
        : 0,
      v49 = resolveInputRatioBasis(
        { width: v22?.["naturalWidth"], height: v22?.["naturalHeight"] },
        { width: v23?.["width"], height: v23?.["height"] },
      ),
      v50 = await resolveOutputMediaSize({
        localPath: v42["localPath"],
        imageUrl: v42["imageUrl"],
        sourceUrl: v42["sourceUrl"],
        thumbUrl: v42["thumbUrl"],
        src: v42["imageUrl"] || v42["sourceUrl"] || v42["thumbUrl"] || "",
      }),
      v51 =
        v50 &&
        shouldSwitchToOutputRatio(
          v49["width"],
          v49["height"],
          v50["width"],
          v50["height"],
          OUTPUT_RATIO_SWITCH_THRESHOLD,
        )
          ? calcDisplaySizeByMedia(v50["width"], v50["height"])
          : calcDisplaySizeByMedia(v49["width"], v49["height"]);
    (appStore["updateNodeData"](v34, {
      ...buildImageGenerationResultPatch(v42, {
        startedAt: v32,
        duration: v48,
      }),
      name: v29["resultName"],
      width: v51["width"],
      height: v51["height"],
      ...buildGenerationRuntimePatch({
        phase: "success",
        runtime: v30,
        latestNode: v47,
        startTime: v32,
      }),
      outputText: buildGenerationOutputText({
        model: v30["model"],
        prompt: v31,
      }),
    }),
      persistGenerationRuntimeIfNeeded(v30),
      notify(v29["successToast"], "success"));
  } catch (v52) {
    if (!v34) throw v52;
    if (v35()) return;
    const v53 = appStore["getState"]()["nodes"]?.[v34],
      v54 = v53?.["generationStartTime"]
        ? Date["now"]() - v53["generationStartTime"]
        : 0,
      v55 = v52?.["message"] || "未知错误";
    (appStore["updateNodeData"](v34, {
      ...buildImageGenerationFailurePatch({
        error: v55,
        startedAt: v32,
        duration: v54,
      }),
      name: v29["failureName"],
      ...buildGenerationRuntimePatch({
        phase: "failed",
        runtime: v30,
        latestNode: v53,
        startTime: v32,
        errorMessage: v55,
      }),
      outputText: buildGenerationOutputText({
        model: v30["model"],
        prompt: v31,
        errorMessage: v55,
      }),
    }),
      persistGenerationRuntimeIfNeeded(v30));
  } finally {
    v33 && URL["revokeObjectURL"](v33);
  }
};

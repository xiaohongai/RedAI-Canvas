import {
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from "../../shared/runningHubVideoManifestShared.js";
export const RH_VIDEO_FRAME_INTERPOLATION_MODEL_ID =
  "runninghub/2047784060881211393";
export const RH_VIDEO_FRAME_INTERPOLATION_EXECUTION_ID =
  "runninghub.workflow.video-frame-interpolation.v1";
export const rhVideoFrameInterpolationModelManifest =
  createRunningHubVideoModelManifest({
    modelId: RH_VIDEO_FRAME_INTERPOLATION_MODEL_ID,
    executionId: RH_VIDEO_FRAME_INTERPOLATION_EXECUTION_ID,
    uiPlacement: ["toolbar"],
    displayName: "视频补帧",
    description: "RunningHub 视频补帧工作流",
    extensions: Object["freeze"]({
      videoFrameInterpolation: Object["freeze"]({
        taskType: "video-frame",
        toolbarTaskOutputTextIncludes: Object["freeze"](["RH视频补帧"]),
      }),
      sourceVideoTaskName: Object["freeze"]({
        key: "frame",
        textNeedles: Object["freeze"](["RH视频补帧", "补帧视频"]),
        managedNamePattern:
          "^补帧视频(?:\\s*\\((?:处理中|恢复中|失败|已取消)\\))?$",
        names: Object["freeze"]({
          success: "补帧视频",
          failed: "补帧视频 (失败)",
          cancelled: "补帧视频 (已取消)",
        }),
      }),
    }),
    fixedAssetSlots: ["sourceVideo"],
    inputSlots: {
      allowedKinds: ["video"],
      minByKind: { video: 1 },
      maxByKind: { image: 0, video: 1, audio: 0 },
      fixedSlots: Object["freeze"]([
        Object["freeze"]({
          id: "sourceVideo",
          kind: "video",
          label: "源视频",
          required: true,
        }),
      ]),
    },
    uiFields: [],
  });
export const rhVideoFrameInterpolationExecutionManifest =
  createRunningHubVideoExecutionManifest({
    id: RH_VIDEO_FRAME_INTERPOLATION_EXECUTION_ID,
    label: "视频补帧",
    workflowId: "2047784060881211393",
    submitMode: "openapi-v2-ai-app",
    queryMode: "openapi-v2-query",
    mapping: {
      sourceVideoNode: Object["freeze"]({
        nodeId: "4",
        fieldName: "video",
        description: "video",
      }),
    },
  });

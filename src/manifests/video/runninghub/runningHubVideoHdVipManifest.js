import {
  RH_INSTANCE_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from "../../shared/runningHubVideoManifestShared.js";
export const RH_VIDEO_HD_VIP_MODEL_ID = "runninghub/2047787809091620866";
export const RH_VIDEO_HD_VIP_EXECUTION_ID =
  "runninghub.workflow.video-hd-vip.v1";
export const RH_VIDEO_HD_VIP_HELP_TOOLTIP = [
  "视频高清 VIP 用法",
  "接入 [[red:源视频]]，作为生成后的高清增强步骤",
  "质量模式偏整体细节修复；锐化模式偏增强边缘和清晰感",
  "适合在内容、口型、人物替换都确认后最后处理",
  "不要用它替代内容编辑；它主要做画质增强",
]["join"]("\x0a");
export const rhVideoHdVipModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_HD_VIP_MODEL_ID,
  executionId: RH_VIDEO_HD_VIP_EXECUTION_ID,
  uiPlacement: ["toolbar"],
  displayName: "视频高清 VIP",
  description: "RunningHub 视频高清 VIP 工作流",
  vip: true,
  subscriptionAliases: [
    "video_hd_vip",
    "video_hd.pro",
    "ai-app/2047787809091620866",
    "2047787809091620866",
  ],
  extensions: Object["freeze"]({
    vipAliases: Object["freeze"](["video_hd_vip", "video_hd.pro"]),
    sourceVideoTaskName: Object["freeze"]({
      key: "hd",
      textNeedles: Object["freeze"](["视频高清", "高清修复视频", "高清视频"]),
      managedNamePattern:
        "^高清视频(?:\\s*\\((?:处理中|恢复中|失败|已取消)\\))?$",
      names: Object["freeze"]({
        success: "高清视频",
        failed: "高清视频 (失败)",
        cancelled: "高清视频 (已取消)",
      }),
    }),
  }),
  help: Object["freeze"]({ tooltip: RH_VIDEO_HD_VIP_HELP_TOOLTIP }),
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
  uiFields: [
    Object["freeze"]({
      id: "hdMode",
      type: "segmented",
      placement: "mode",
      label: "Mode",
      defaultValue: "quality",
      options: Object["freeze"]([
        Object["freeze"]({ value: "quality", label: "质量" }),
        Object["freeze"]({ value: "sharp", label: "锐化" }),
      ]),
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoHdVipExecutionManifest =
  createRunningHubVideoExecutionManifest({
    id: RH_VIDEO_HD_VIP_EXECUTION_ID,
    label: "视频高清 VIP",
    workflowId: "2047787809091620866",
    submitMode: "openapi-v2-ai-app",
    queryMode: "openapi-v2-query",
    mapping: {
      nodeInfoList: Object["freeze"]([
        Object["freeze"]({
          nodeId: "10",
          fieldName: "index",
          source: "param",
          field: "hdMode",
          defaultValue: "quality",
          valueMap: Object["freeze"]({ quality: "0", sharp: "1" }),
        }),
        Object["freeze"]({
          nodeId: "12",
          fieldName: "video",
          source: "videoInput",
          required: true,
        }),
      ]),
    },
  });

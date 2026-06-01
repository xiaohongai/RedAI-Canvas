import {
  RH_INSTANCE_FIELD,
  RH_VIDEO_FPS_FIELD,
  RH_VIDEO_RESOLUTION_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from "../../shared/runningHubVideoManifestShared.js";
export const RH_VIDEO_MATTING_MODEL_ID = "runninghub/video_matting";
export const RH_VIDEO_MATTING_EXECUTION_ID =
  "runninghub.workflow.video-matting.v1";
export const RH_VIDEO_MATTING_KEYING_EXECUTION_ID =
  "runninghub.video-matting.keying";
export const RH_VIDEO_MATTING_REMOVE_EXECUTION_ID =
  "runninghub.video-matting.remove";
export const RH_VIDEO_MATTING_HELP_TOOLTIP = [
  "视频抠像用法",
  "接入\x20[[red:源视频]]，自动抠出人物或主体",
  "可选遮罩图辅助锁定要抠的区域，复杂画面更建议加遮罩",
  "适合先产出干净主体素材，再用于合成、换背景或后续视频编辑",
  "分辨率和帧率越高越清晰，也会增加耗时",
]["join"]("\x0a");
export const rhVideoMattingModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_MATTING_MODEL_ID,
  executionId: RH_VIDEO_MATTING_EXECUTION_ID,
  uiPlacement: ["toolbar"],
  displayName: "视频抠像",
  description: "RunningHub\x20视频抠像工作流",
  extensions: Object["freeze"]({
    videoKeying: Object["freeze"]({
      modelId: RH_VIDEO_MATTING_MODEL_ID,
      keyingExecutionId: RH_VIDEO_MATTING_KEYING_EXECUTION_ID,
      removeExecutionId: RH_VIDEO_MATTING_REMOVE_EXECUTION_ID,
      taskTypes: Object["freeze"]({
        keying: "video-keying",
        remove: "video-remove",
      }),
    }),
    sourceVideoTaskNameRules: Object["freeze"]([
      Object["freeze"]({
        key: "erase",
        matchModel: false,
        textNeedles: Object["freeze"](["RH视频擦除", "视频擦除"]),
        managedNamePattern:
          "^(?:视频擦除生成中\\.\\.\\.|视频擦除结果|视频擦除失败)$",
        names: Object["freeze"]({
          success: "视频擦除结果",
          failed: "视频擦除失败",
          cancelled: "视频擦除结果",
        }),
      }),
      Object["freeze"]({
        key: "matting",
        matchModel: false,
        textNeedles: Object["freeze"](["RH视频抠像", "抠像结果"]),
        managedNamePattern: "^抠像结果\\b.*$",
        names: Object["freeze"]({}),
      }),
    ]),
  }),
  help: Object["freeze"]({ tooltip: RH_VIDEO_MATTING_HELP_TOOLTIP }),
  fixedAssetSlots: ["sourceVideo"],
  inputSlots: {
    allowedKinds: ["video", "image"],
    minByKind: { video: 1 },
    maxByKind: { image: 1, video: 1, audio: 0 },
    fixedSlots: Object["freeze"]([
      Object["freeze"]({
        id: "sourceVideo",
        kind: "video",
        label: "源视频",
        required: true,
      }),
      Object["freeze"]({
        id: "maskImage",
        kind: "image",
        label: "遮罩",
        required: false,
      }),
    ]),
  },
  uiFields: [RH_VIDEO_RESOLUTION_FIELD, RH_VIDEO_FPS_FIELD, RH_INSTANCE_FIELD],
});
export const rhVideoMattingExecutionManifest =
  createRunningHubVideoExecutionManifest({
    id: RH_VIDEO_MATTING_EXECUTION_ID,
    label: "视频抠像",
    workflowId: "2037354967383674881",
    submitMode: "runninghub-workflow-or-video-matting",
    queryMode: "openapi-v2-query",
    extensions: Object["freeze"]({ payloadResolver: "runninghubVideoMatting" }),
    mapping: {
      maskAppId: "2042569732972355585",
      noMaskWorkflowId: "2037354967383674881",
      noMaskVideoNode: Object["freeze"]({ nodeId: "55", fieldName: "video" }),
      noMaskFpsNode: Object["freeze"]({
        nodeId: "55",
        fieldName: "force_rate",
      }),
      noMaskResolutionNode: Object["freeze"]({
        nodeId: "74",
        fieldName: "value",
      }),
      positiveNode: Object["freeze"]({ nodeId: "71", fieldName: "value" }),
      negativeNode: Object["freeze"]({ nodeId: "72", fieldName: "value" }),
      frameIndexNode: Object["freeze"]({ nodeId: "35", fieldName: "value" }),
      maskModeNode: Object["freeze"]({ nodeId: "67", fieldName: "index" }),
      maskVideoNode: Object["freeze"]({ nodeId: "117", fieldName: "video" }),
      maskFrameCapNode: Object["freeze"]({
        nodeId: "117",
        fieldName: "frame_load_cap",
      }),
      maskFpsNode: Object["freeze"]({ nodeId: "122", fieldName: "value" }),
      maskResolutionNode: Object["freeze"]({
        nodeId: "105",
        fieldName: "value",
      }),
      maskImageNode: Object["freeze"]({ nodeId: "63", fieldName: "image" }),
    },
  });

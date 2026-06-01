import {
  RH_INSTANCE_FIELD,
  RH_VIDEO_RESOLUTION_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from "../../shared/runningHubVideoManifestShared.js";
export const RH_VIDEO_LIPSYNC_MODEL_ID = "runninghub/2054101324521844738";
export const RH_VIDEO_LIPSYNC_EXECUTION_ID =
  "runninghub.workflow.video-lipsync.v1";
export const RH_VIDEO_LIPSYNC_HELP_TOOLTIP = [
  "视频对口型用法",
  "接入 [[red:源视频或参考图]] + [[red:音频]]，让画面人物嘴型跟随音频",
  "源视频和参考图互斥，只保留最后接入的一种视觉输入",
  "源视频/参考图建议脸部清晰、嘴部无遮挡、镜头不要剧烈晃动",
  "音频时长尽量匹配要处理的视频片段；帧数控制处理范围",
  "适合配音、翻译、角色换声后的口型同步",
]["join"]("\x0a");
export const rhVideoLipSyncModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_LIPSYNC_MODEL_ID,
  executionId: RH_VIDEO_LIPSYNC_EXECUTION_ID,
  displayName: "视频对口型",
  description: "参考图或视频 + 音频生成对口型视频",
  help: Object["freeze"]({ tooltip: RH_VIDEO_LIPSYNC_HELP_TOOLTIP }),
  extensions: Object["freeze"]({
    videoParameterPanel: Object["freeze"]({
      sourceFrameCountFps: "standard",
      forceDisplayFps: 24,
      adaptiveRatio: Object["freeze"]({
        scopeTargetEdges: true,
        preferSlot: "sourceVideo",
        preferVideoKind: true,
        fallbackSquareWhenNoVideo: true,
      }),
    }),
  }),
  fixedAssetSlots: ["sourceVideo", "refImage", "audio"],
  inputSlots: {
    allowedKinds: ["text", "image", "video", "audio"],
    minByKind: { audio: 1 },
    maxByKind: { image: 1, video: 1, audio: 1 },
    displayAspectRatioSource: Object["freeze"]({
      slots: Object["freeze"](["sourceVideo", "refImage"]),
      fallbackIndex: 0,
    }),
    exclusiveGroups: Object["freeze"]([
      Object["freeze"]({
        id: "lipsyncVisualInput",
        slots: Object["freeze"](["sourceVideo", "refImage"]),
        min: 1,
        max: 1,
      }),
    ]),
    fixedSlots: Object["freeze"]([
      Object["freeze"]({
        id: "sourceVideo",
        kind: "video",
        label: "源视频",
        required: false,
      }),
      Object["freeze"]({
        id: "refImage",
        kind: "image",
        label: "参考图",
        required: false,
      }),
      Object["freeze"]({
        id: "audio",
        kind: "audio",
        label: "音频",
        required: true,
      }),
    ]),
  },
  uiFields: [
    RH_VIDEO_RESOLUTION_FIELD,
    Object["freeze"]({
      id: "rhVideoFrames",
      type: "stepper",
      placement: "videoParams",
      label: "帧数",
      defaultValue: 77,
      min: 0,
      max: 999999,
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoLipSyncExecutionManifest =
  createRunningHubVideoExecutionManifest({
    id: RH_VIDEO_LIPSYNC_EXECUTION_ID,
    label: "视频对口型",
    workflowId: "2054101324521844738",
    submitMode: "openapi-v2-ai-app",
    queryMode: "openapi-v2-query",
    mapping: {
      nodeInfoList: Object["freeze"]([
        Object["freeze"]({
          nodeId: "383",
          fieldName: "video",
          description: "video",
          source: "videoInput",
          when: Object["freeze"]({ field: "rhLipSyncInputIndex", equals: 1 }),
          required: true,
        }),
        Object["freeze"]({
          nodeId: "390",
          fieldName: "image",
          description: "image",
          source: "imageInput",
          field: "inputUrls",
          when: Object["freeze"]({ field: "rhLipSyncInputIndex", equals: 0 }),
          required: true,
        }),
        Object["freeze"]({
          nodeId: "410",
          fieldName: "value",
          description: "帧数",
          source: "param",
          fields: Object["freeze"](["frameCount", "rhVideoFrames"]),
          defaultValue: 77,
          transform: Object["freeze"]({ name: "integer", min: 1 }),
        }),
        Object["freeze"]({
          nodeId: "392",
          fieldName: "value",
          description: "分辨率",
          source: "param",
          field: "rhVideoResolution",
          defaultValue: 832,
          transform: "normalizeRhVideoResolution",
        }),
        Object["freeze"]({
          nodeId: "367",
          fieldName: "audio",
          description: "audio",
          source: "audioInput",
          required: true,
        }),
        Object["freeze"]({
          nodeId: "393",
          fieldName: "value",
          description: "提示词",
          source: "prompt",
          fields: Object["freeze"](["prompt"]),
          defaultValue: "",
        }),
        Object["freeze"]({
          nodeId: "409",
          fieldName: "index",
          description: "index",
          source: "param",
          field: "rhLipSyncInputIndex",
          defaultValue: 1,
          transform: Object["freeze"]({ name: "integer", min: 0, max: 1 }),
        }),
      ]),
    },
  });

import {
  RH_INSTANCE_FIELD,
  RH_VIDEO_FPS_FIELD,
  RH_VIDEO_RESOLUTION_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from "../../shared/runningHubVideoManifestShared.js";
export const RH_VIDEO_LTX23_MODEL_ID = "runninghub/2039336644536442882";
export const RH_VIDEO_LTX23_EXECUTION_ID = "runninghub.workflow.video-ltx23.v1";
export const RH_VIDEO_LTX23_HELP_TOOLTIP = [
  "LTX2.3唱歌数字人用法",
  "接入 [[red:参考图]] + [[red:音频]]，音频可以是唱歌或说话",
  "参考图建议使用清晰正脸或半身照，嘴部无遮挡更稳",
  "提示词要明确人物状态，例如：一个女人正在唱歌",
  "如果是说话音频，提示词写清：一个女人正在说话/采访/播报",
  "秒数、帧率和分辨率决定输出长度与清晰度",
]["join"]("\x0a");
export const rhVideoLtx23ModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_LTX23_MODEL_ID,
  executionId: RH_VIDEO_LTX23_EXECUTION_ID,
  displayName: "LTX2.3唱歌数字人",
  description: "参考图\x20+\x20音频生成唱歌数字人视频",
  help: Object["freeze"]({ tooltip: RH_VIDEO_LTX23_HELP_TOOLTIP }),
  extensions: Object["freeze"]({
    videoParameterPanel: Object["freeze"]({
      defaultSelectionState: Object["freeze"]({ rhLtxMode: "singing_voice" }),
    }),
  }),
  fixedAssetSlots: ["refImage", "audio"],
  inputSlots: {
    allowedKinds: ["text", "image", "audio"],
    minByKind: { image: 1, audio: 1 },
    maxByKind: { image: 1, video: 0, audio: 1 },
    displayAspectRatioSource: Object["freeze"]({
      kind: "image",
      slot: "refImage",
      fallbackIndex: 0,
    }),
    fixedSlots: Object["freeze"]([
      Object["freeze"]({
        id: "refImage",
        kind: "image",
        label: "参考图",
        required: true,
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
    RH_VIDEO_FPS_FIELD,
    Object["freeze"]({
      id: "rhVideoSeconds",
      type: "stepper",
      placement: "videoParams",
      label: "秒数",
      defaultValue: 5,
      min: 1,
      max: 600,
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoLtx23ExecutionManifest =
  createRunningHubVideoExecutionManifest({
    id: RH_VIDEO_LTX23_EXECUTION_ID,
    label: "LTX2.3唱歌数字人",
    workflowId: "2039336644536442882",
    submitMode: "runninghub-task-create",
    queryMode: "runninghub-task-query",
    mapping: {
      nodeInfoList: Object["freeze"]([
        Object["freeze"]({
          nodeId: "303",
          fieldName: "value",
          source: "prompt",
          defaultValue: "",
        }),
        Object["freeze"]({
          nodeId: "347",
          fieldName: "value",
          source: "param",
          field: "rhVideoResolution",
          defaultValue: 832,
          transform: "normalizeRhVideoResolution",
        }),
        Object["freeze"]({
          nodeId: "346",
          fieldName: "value",
          source: "param",
          field: "rhVideoFps",
          defaultValue: 24,
          transform: Object["freeze"]({ name: "integer" }),
        }),
        Object["freeze"]({
          nodeId: "349",
          fieldName: "value",
          source: "param",
          field: "rhVideoSeconds",
          defaultValue: 5,
          transform: Object["freeze"]({ name: "integer", min: 1 }),
        }),
        Object["freeze"]({
          nodeId: "269",
          fieldName: "image",
          source: "imageInput",
          field: "inputUrls",
          required: true,
        }),
        Object["freeze"]({
          nodeId: "332",
          fieldName: "audio",
          source: "audioInput",
          required: true,
        }),
      ]),
    },
  });

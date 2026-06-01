import {
  RH_INSTANCE_FIELD,
  RH_VIDEO_FPS_FIELD,
  RH_VIDEO_RESOLUTION_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from "../../shared/runningHubVideoManifestShared.js";
export const RH_VIDEO_BASIC_MODEL_ID = "runninghub/1971148165531475969";
export const RH_VIDEO_BASIC_EXECUTION_ID = "runninghub.workflow.video-basic.v1";
export const RH_VIDEO_BASIC_HELP_TOOLTIP = [
  "视频编辑-基础版用法",
  "接入 [[red:源视频]] + [[red:参考图]]，按提示词做快速视频编辑",
  "适合快速替换主体、风格或画面元素，先看整体方向",
  "需要限定区域时开启[[red:遮罩]]，避免影响不该改的背景",
  "帧数控制处理长度；先短帧数预览，再拉长生成",
]["join"]("\x0a");
export const rhVideoBasicModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_BASIC_MODEL_ID,
  executionId: RH_VIDEO_BASIC_EXECUTION_ID,
  displayName: "视频编辑-基础版",
  description: "源视频\x20+\x20参考图的快速视频编辑工作流",
  help: Object["freeze"]({ tooltip: RH_VIDEO_BASIC_HELP_TOOLTIP }),
  extensions: Object["freeze"]({
    videoParameterPanel: Object["freeze"]({
      sourceFrameCountFps: "standard",
      adaptiveRatio: Object["freeze"]({
        scopeTargetEdges: true,
        preferSlot: "sourceVideo",
      }),
    }),
  }),
  fixedAssetSlots: ["sourceVideo", "refImage"],
  inputSlots: {
    allowedKinds: ["text", "image", "video"],
    minByKind: { image: 1, video: 1 },
    maxByKind: { image: 1, video: 1, audio: 0 },
    fixedSlots: Object["freeze"]([
      Object["freeze"]({
        id: "sourceVideo",
        kind: "video",
        label: "源视频",
        required: true,
      }),
      Object["freeze"]({
        id: "refImage",
        kind: "image",
        label: "参考图",
        required: true,
      }),
    ]),
  },
  uiFields: [
    RH_VIDEO_RESOLUTION_FIELD,
    RH_VIDEO_FPS_FIELD,
    Object["freeze"]({
      id: "rhVideoFrames",
      type: "stepper",
      placement: "videoParams",
      label: "帧数",
      defaultValue: 77,
      min: 0,
      max: 999999,
    }),
    Object["freeze"]({
      id: "rhEnableMask",
      type: "segmented",
      placement: "videoAdvanced",
      variant: "advancedRow",
      label: "开启遮罩",
      defaultValue: false,
      description: "开启：按遮罩区域做视频编辑。\n关闭：不启用遮罩。",
      options: Object["freeze"]([
        Object["freeze"]({ value: true, label: "是" }),
        Object["freeze"]({ value: false, label: "否" }),
      ]),
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoBasicExecutionManifest =
  createRunningHubVideoExecutionManifest({
    id: RH_VIDEO_BASIC_EXECUTION_ID,
    label: "视频编辑-基础版",
    workflowId: "1971148165531475969",
    submitMode: "openapi-v2-ai-app",
    queryMode: "openapi-v2-query",
    mapping: {
      nodeInfoList: Object["freeze"]([
        Object["freeze"]({
          nodeId: "237",
          fieldName: "video",
          source: "videoInput",
          required: true,
        }),
        Object["freeze"]({
          nodeId: "234",
          fieldName: "image",
          source: "imageInput",
          field: "inputUrls",
          required: true,
        }),
        Object["freeze"]({
          nodeId: "397",
          fieldName: "value",
          source: "param",
          fields: Object["freeze"](["rhVideoFps", "frameRate"]),
          defaultValue: 24,
          transform: "normalizeRhVideoFps",
        }),
        Object["freeze"]({
          nodeId: "222",
          fieldName: "value",
          source: "param",
          field: "rhVideoResolution",
          defaultValue: 832,
          transform: "normalizeRhVideoResolution",
        }),
        Object["freeze"]({
          nodeId: "392",
          fieldName: "value",
          source: "param",
          fields: Object["freeze"](["rhVideoFrames", "frameCount"]),
          defaultValue: 77,
          transform: Object["freeze"]({ name: "integer", min: 0 }),
        }),
        Object["freeze"]({
          nodeId: "235",
          fieldName: "value",
          source: "prompt",
          defaultValue: "",
        }),
        Object["freeze"]({
          nodeId: "396",
          fieldName: "value",
          source: "param",
          field: "rhEnableMask",
          defaultValue: false,
          transform: "booleanString",
        }),
      ]),
    },
  });

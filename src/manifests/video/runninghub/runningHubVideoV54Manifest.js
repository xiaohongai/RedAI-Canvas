import {
  RH_INSTANCE_FIELD,
  RH_VIDEO_FPS_FIELD,
  RH_VIDEO_RESOLUTION_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from "../../shared/runningHubVideoManifestShared.js";
export const RH_VIDEO_V54_MODEL_ID = "runninghub/2041741496667348994";
export const RH_VIDEO_V54_EXECUTION_ID = "runninghub.workflow.video-v54.v1";
export const RH_VIDEO_V54_HELP_TOOLTIP = [
  "视频编辑V5.4用法",
  "必接 [[red:源视频]] + [[red:参考图]]，首帧图和遮罩视频可选",
  "[[red:参考图]]决定替换主体；[[red:首帧图]]适合锁定开场构图和人物状态",
  "[[red:遮罩视频]]用于限制替换区域，多人同框或复杂背景时优先准备",
  "效率适合预览；稳定适合边缘要求高；多人控制适合同框多主体",
  "遮罩边缘不稳时调外扩遮罩，误伤背景时向内收",
  "更多详细的疑难解答，请看[[red:阿硕飞书文档的视频编辑V5.X]]",
]["join"]("\x0a");
const RH_VIDEO_V54_FPS_FIELD = Object["freeze"]({
  ...RH_VIDEO_FPS_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: 16, label: "16帧" }),
    Object["freeze"]({ value: 24, label: "24帧" }),
    Object["freeze"]({ value: 30, label: "30帧" }),
  ]),
});
export const rhVideoV54ModelManifest = createRunningHubVideoModelManifest({
  modelId: RH_VIDEO_V54_MODEL_ID,
  executionId: RH_VIDEO_V54_EXECUTION_ID,
  displayName: "视频编辑V5.4",
  description: "影视替换专用，支持源视频、参考图、首帧图与遮罩视频",
  vip: true,
  subscriptionAliases: ["video_edit_v54", "video_edit.pro"],
  extensions: Object["freeze"]({
    vipAliases: Object["freeze"](["video_edit_v54", "video_edit.pro"]),
    videoParameterPanel: Object["freeze"]({
      sourceFrameCountFps: "v54",
      advancedDisplayPatch: "runningHubVideoV54",
      frameStateDefaults: Object["freeze"]({ frameRate: 24, frameCount: 77 }),
      preserveMaskTouchedState: true,
      maskVideoDisablesSubtractSubject: true,
      adaptiveRatio: Object["freeze"]({
        scopeTargetEdges: true,
        preferSlot: "sourceVideo",
        preferVideoKind: true,
      }),
    }),
  }),
  help: Object["freeze"]({ tooltip: RH_VIDEO_V54_HELP_TOOLTIP }),
  fixedAssetSlots: ["sourceVideo", "refImage", "firstFrame", "videoMask"],
  inputSlots: {
    allowedKinds: ["text", "image", "video"],
    minByKind: { image: 1, video: 1 },
    maxByKind: { image: 2, video: 2, audio: 0 },
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
      Object["freeze"]({
        id: "firstFrame",
        kind: "image",
        label: "首帧图",
        required: false,
      }),
      Object["freeze"]({
        id: "videoMask",
        kind: "video",
        label: "遮罩视频",
        required: false,
      }),
    ]),
  },
  uiFields: [
    RH_VIDEO_RESOLUTION_FIELD,
    RH_VIDEO_V54_FPS_FIELD,
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
      id: "rhSingleControlPreset",
      type: "segmented",
      placement: "videoAdvanced",
      variant: "rhV54ControlMode",
      label: "控制方式",
      defaultValue: "efficiency",
      description:
        "单人控制：可选效率、稳定。效率更快更省，适合快速预览；稳定更适合人物/主体边缘要求更高的场景。多人控制：允许同时处理多个主体，适合多人同框，但更依赖遮罩与参数。",
      options: Object["freeze"]([
        Object["freeze"]({ value: "efficiency", label: "效率" }),
        Object["freeze"]({ value: "stable", label: "稳定" }),
        Object["freeze"]({ value: "multi", label: "多人控制" }),
      ]),
    }),
    Object["freeze"]({
      id: "rhBlendIntoScene",
      type: "segmented",
      placement: "videoAdvanced",
      variant: "rhV54BooleanRow",
      label: "人物融入场景",
      defaultValue: false,
      description:
        "开启：更贴合原场景的光影、色调和边缘过渡，整体更自然。关闭：更偏直接替换，人物特征更突出。",
      options: Object["freeze"]([
        Object["freeze"]({ value: true, label: "是" }),
        Object["freeze"]({ value: false, label: "否" }),
      ]),
    }),
    Object["freeze"]({
      id: "rhSubtractSubject",
      type: "segmented",
      placement: "videoAdvanced",
      variant: "rhV54BooleanRow",
      label: "扣除主体",
      defaultValue: true,
      disableWhenSpecialMode: "cameraMove",
      description:
        "开启：系统会自动识别并扣除主体，适合替换有明显主体的视频、单人替换等。关闭：不做主体扣除。如果已接入遮罩视频，会以遮罩视频为准。",
      options: Object["freeze"]([
        Object["freeze"]({ value: true, label: "是" }),
        Object["freeze"]({ value: false, label: "否" }),
      ]),
    }),
    Object["freeze"]({
      id: "rhMaskExpand",
      type: "stepper",
      placement: "videoAdvanced",
      variant: "rhV54MaskExpand",
      label: "外扩遮罩",
      ariaLabel: "外扩遮罩数值",
      defaultValue: 25,
      min: -9999,
      max: 9999,
      step: 1,
      disableWhenSpecialMode: "cameraMove",
      description:
        "用于微调遮罩边缘。正数：向外扩，覆盖更多边缘细节；负数：向内收，减少误伤背景。可拖动或输入，支持负数。",
    }),
    Object["freeze"]({
      id: "rhMaskRect",
      type: "segmented",
      placement: "videoAdvanced",
      variant: "rhV54BooleanRow",
      label: "遮罩转为矩形",
      defaultValue: false,
      disableWhenSpecialMode: "cameraMove",
      description:
        "开启：把遮罩按矩形区域处理，适合规则边界、字幕区、框内替换。关闭：按真实轮廓遮罩，更适合人物和复杂边缘。",
      options: Object["freeze"]([
        Object["freeze"]({ value: true, label: "是" }),
        Object["freeze"]({ value: false, label: "否" }),
      ]),
    }),
    Object["freeze"]({
      id: "rhSpecialMode",
      type: "segmented",
      placement: "videoAdvanced",
      variant: "rhV54SpecialMode",
      label: "特殊模式",
      defaultValue: "none",
      description:
        "默认不选。长视频叠加适合长视频相关的特殊处理；模拟运镜用于模拟镜头运动效果。两者互斥，只能选一个；再次点击已选项可取消。",
      options: Object["freeze"]([
        Object["freeze"]({ value: "none", label: "不选", hidden: true }),
        Object["freeze"]({ value: "longVideoOverlay", label: "长视频叠加" }),
        Object["freeze"]({ value: "cameraMove", label: "模拟运镜" }),
      ]),
    }),
    Object["freeze"]({
      id: "rhBreastJiggle",
      type: "slider",
      placement: "videoAdvanced",
      variant: "rhV54BreastJiggle",
      label: "抖胸",
      ariaLabel: "抖胸幅度",
      defaultValue: 0,
      min: 0,
      max: 1,
      step: 0.05,
      description: "通过调整数值让胸部抖起来。0：关闭；数值越高抖动幅度越大。",
    }),
    RH_INSTANCE_FIELD,
  ],
});
export const rhVideoV54ExecutionManifest =
  createRunningHubVideoExecutionManifest({
    id: RH_VIDEO_V54_EXECUTION_ID,
    label: "视频编辑V5.4",
    workflowId: "2041741496667348994",
    submitMode: "openapi-v2-ai-app",
    queryMode: "openapi-v2-query",
    extensions: Object["freeze"]({ payloadResolver: "runninghubVideoV54" }),
    mapping: {
      promptNode: Object["freeze"]({ nodeId: "235", fieldName: "value" }),
      characterIntegrationNode: Object["freeze"]({
        nodeId: "915",
        fieldName: "value",
      }),
      controlModeNode: Object["freeze"]({
        nodeId: "977",
        fieldName: "value",
        valueMap: Object["freeze"]({
          efficiency: "0",
          stable: "1",
          quality: "1",
          multi: "2",
        }),
        defaultValue: "0",
      }),
      resolutionNode: Object["freeze"]({ nodeId: "222", fieldName: "value" }),
      fpsNode: Object["freeze"]({ nodeId: "1077", fieldName: "value" }),
      sourceVideoNode: Object["freeze"]({
        nodeId: "237",
        fieldName: "video",
        frameCountFieldName: "frame_load_cap",
      }),
      refImageNode: Object["freeze"]({ nodeId: "234", fieldName: "image" }),
      maskVideoNode: Object["freeze"]({ nodeId: "1021", fieldName: "video" }),
      firstFrameNode: Object["freeze"]({ nodeId: "429", fieldName: "image" }),
      firstFrameEnabledNode: Object["freeze"]({
        nodeId: "988",
        fieldName: "value",
        value: "1",
      }),
      subtractSubjectNode: Object["freeze"]({
        nodeId: "1078",
        fieldName: "value",
        value: "true",
      }),
      maskExpansionNode: Object["freeze"]({
        nodeId: "240",
        fieldName: "value",
        defaultValue: 25,
      }),
      maskRectNode: Object["freeze"]({
        nodeId: "979",
        fieldName: "index",
        falseValue: "0",
        trueValue: "1",
      }),
      maskParamsEnabledNode: Object["freeze"]({
        nodeId: "1076",
        fieldName: "value",
        value: "1",
      }),
      specialModeNode: Object["freeze"]({
        nodeId: "1063",
        fieldName: "index",
        valueMap: Object["freeze"]({ longVideoOverlay: "1", cameraMove: "2" }),
      }),
      longVideoOverlayNode: Object["freeze"]({
        nodeId: "1081",
        fieldName: "index",
        value: "1",
      }),
      breastJiggleNode: Object["freeze"]({
        nodeId: "1113",
        fieldName: "value",
        description: "抖胸幅度",
      }),
      breastJiggleEnabledNode: Object["freeze"]({
        nodeId: "1100",
        fieldName: "value",
        value: "true",
        description: "是否开抖胸",
      }),
    },
  });

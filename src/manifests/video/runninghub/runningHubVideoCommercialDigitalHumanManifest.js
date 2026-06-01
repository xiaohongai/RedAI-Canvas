import {
  RH_INSTANCE_FIELD,
  RH_VIDEO_RESOLUTION_FIELD,
  createRunningHubVideoExecutionManifest,
  createRunningHubVideoModelManifest,
} from "../../shared/runningHubVideoManifestShared.js";
export const RH_VIDEO_COMMERCIAL_DIGITAL_HUMAN_MODEL_ID =
  "runninghub/2055639633148563458";
export const RH_VIDEO_COMMERCIAL_DIGITAL_HUMAN_EXECUTION_ID =
  "runninghub.workflow.video-commercial-digital-human.v1";
export const RH_VIDEO_COMMERCIAL_DIGITAL_HUMAN_HELP_TOOLTIP = [
  "商业级数字人用法",
  "接入 [[red:图片]] + [[red:音频]]，主攻唱歌音频",
  "图片建议使用清晰正脸或半身照，嘴部无遮挡更稳",
  "音频建议使用干净的人声或唱歌音频，避免强噪声和混响过重",
  "提示词可描述人物状态、镜头和演唱氛围，例如：女人在唱歌，镜头晃动",
  "分辨率和帧数决定输出清晰度与处理长度",
  "注意事项：超过 [[red:250帧]] 请开启 [[red:48G显存]]，否则大概率会爆显存",
]["join"]("\x0a");
const RH_COMMERCIAL_DIGITAL_HUMAN_RESOLUTION_FIELD = Object["freeze"]({
  ...RH_VIDEO_RESOLUTION_FIELD,
  defaultValue: 1280,
});
export const rhVideoCommercialDigitalHumanModelManifest =
  createRunningHubVideoModelManifest({
    modelId: RH_VIDEO_COMMERCIAL_DIGITAL_HUMAN_MODEL_ID,
    executionId: RH_VIDEO_COMMERCIAL_DIGITAL_HUMAN_EXECUTION_ID,
    displayName: "商业级数字人",
    description: "主攻唱歌音频",
    vip: true,
    subscriptionAliases: [
      "commercial_digital_human",
      "commercial_digital_human.pro",
      "ai-app/2055639633148563458",
    ],
    extensions: Object["freeze"]({
      vipAliases: Object["freeze"]([
        "commercial_digital_human",
        "commercial_digital_human.pro",
      ]),
    }),
    help: Object["freeze"]({
      tooltip: RH_VIDEO_COMMERCIAL_DIGITAL_HUMAN_HELP_TOOLTIP,
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
          label: "图片",
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
      RH_COMMERCIAL_DIGITAL_HUMAN_RESOLUTION_FIELD,
      Object["freeze"]({
        id: "rhVideoFrames",
        type: "stepper",
        placement: "videoParams",
        label: "帧数",
        defaultValue: 150,
        min: 1,
        max: 999999,
      }),
      Object["freeze"]({
        id: "rhDigitalHumanMotionAmplitude",
        type: "segmented",
        placement: "videoAdvanced",
        variant: "advancedRow",
        label: "数字人动作幅度",
        defaultValue: "0",
        description:
          "普通：动作幅度自然。\n较大：动作更明显。\n强烈：动作幅度最强。\n建议：10秒以内动作幅度参数效果更明显；超过10秒后效果会明显减弱。",
        options: Object["freeze"]([
          Object["freeze"]({ value: "0", label: "普通" }),
          Object["freeze"]({ value: "1", label: "较大" }),
          Object["freeze"]({ value: "2", label: "强烈" }),
        ]),
      }),
      Object["freeze"]({
        id: "rhDigitalHumanSceneMotionAmplitude",
        type: "segmented",
        placement: "videoAdvanced",
        variant: "advancedRow",
        label: "画面运动幅度",
        defaultValue: "0",
        description: "普通：画面运动自然。\x0a较大：画面运动更明显。",
        options: Object["freeze"]([
          Object["freeze"]({ value: "0", label: "普通" }),
          Object["freeze"]({ value: "1", label: "较大" }),
        ]),
      }),
      RH_INSTANCE_FIELD,
    ],
  });
export const rhVideoCommercialDigitalHumanExecutionManifest =
  createRunningHubVideoExecutionManifest({
    id: RH_VIDEO_COMMERCIAL_DIGITAL_HUMAN_EXECUTION_ID,
    label: "商业级数字人",
    workflowId: "2055639633148563458",
    submitMode: "openapi-v2-ai-app",
    queryMode: "openapi-v2-query",
    extensions: Object["freeze"]({
      audioDurationGuard: Object["freeze"]({
        audioSlot: "audio",
        frameFields: Object["freeze"](["rhVideoFrames", "frameCount"]),
        fps: 25,
        message: "生成视频时长不能超过音频时长（按25帧/秒计算）",
        missingDurationMessage: "无法读取音频时长，请等待音频加载后再生成",
      }),
    }),
    mapping: {
      nodeInfoList: Object["freeze"]([
        Object["freeze"]({
          nodeId: "100",
          fieldName: "image",
          description: "图片",
          source: "imageInput",
          field: "inputUrls",
          required: true,
        }),
        Object["freeze"]({
          nodeId: "119",
          fieldName: "audio",
          description: "音频",
          source: "audioInput",
          required: true,
        }),
        Object["freeze"]({
          nodeId: "114",
          fieldName: "value",
          description: "分辨率",
          source: "param",
          fields: Object["freeze"]([
            "generationParams.rhVideoResolution",
            "rhVideoResolution",
          ]),
          defaultValue: 1280,
          transform: "normalizeRhVideoResolution",
        }),
        Object["freeze"]({
          nodeId: "118",
          fieldName: "value",
          description: "帧数",
          source: "param",
          fields: Object["freeze"]([
            "generationParams.rhVideoFrames",
            "rhVideoFrames",
            "frameCount",
          ]),
          defaultValue: 150,
          transform: Object["freeze"]({ name: "integer", min: 1 }),
        }),
        Object["freeze"]({
          nodeId: "117",
          fieldName: "value",
          description: "提示词",
          source: "prompt",
          fields: Object["freeze"](["prompt"]),
          defaultValue: "女人在唱歌，镜头晃动",
        }),
        Object["freeze"]({
          nodeId: "201",
          fieldName: "value",
          description: "强度",
          source: "param",
          fields: Object["freeze"]([
            "generationParams.rhDigitalHumanMotionAmplitude",
            "rhDigitalHumanMotionAmplitude",
          ]),
          defaultValue: "0",
          valueMap: Object["freeze"]({ 普通: "0", 较大: "1", 强烈: "2" }),
        }),
        Object["freeze"]({
          nodeId: "204",
          fieldName: "value",
          description: "强度2",
          source: "param",
          fields: Object["freeze"]([
            "generationParams.rhDigitalHumanSceneMotionAmplitude",
            "rhDigitalHumanSceneMotionAmplitude",
          ]),
          defaultValue: "0",
          valueMap: Object["freeze"]({ 普通: "0", 较大: "1" }),
        }),
      ]),
    },
  });

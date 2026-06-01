import { RH_IMAGE_INSTANCE_FIELD } from "../../shared/runningHubImageManifestShared.js";
import { ASPECT_RATIO_FIELD } from "../modelApi/sharedImageModelApiFields.js";
export const QWEN_IMAGE_EDIT_MODEL_ID = "runninghub/2050306122774532097";
export const QWEN_IMAGE_EDIT_EXECUTION_ID =
  "runninghub.workflow.qwen-image-edit.v1";
export const QWEN_IMAGE_EDIT_HELP_TOOLTIP = [
  "Qwen-图像编辑用法",
  "接入 [[red:1-3 张参考图]] + 一条明确编辑指令",
  "多图时按顺序写清 [[red:图1/图2/图3]] 的角色和用途",
  "适合改文字、换服装/姿势、增删物体、风格迁移和细节增强",
  "2511\x20更适合多人/多主体一致性；2509\x20更适合姿势图、深度图等条件图",
  "例：让图1的人穿上图2的黑色礼服，并保持图3的坐姿",
]["join"]("\x0a");
export const qwenImageEditModelManifest = Object["freeze"]({
  schemaVersion: "1.0",
  modelId: QWEN_IMAGE_EDIT_MODEL_ID,
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  executionId: QWEN_IMAGE_EDIT_EXECUTION_ID,
  displayName: "Qwen-图像编辑",
  icon: "images/RH.png",
  description: "多图指令编辑，适合人物/产品一致性、文字修改与姿势/深度控制",
  help: Object["freeze"]({ tooltip: QWEN_IMAGE_EDIT_HELP_TOOLTIP }),
  extensions: Object["freeze"]({
    imageMenu: Object["freeze"]({ group: "runninghubWorkflow", order: 40 }),
    ratioPolicy: Object["freeze"]({ capability: "dimensions" }),
  }),
  prompt: Object["freeze"]({
    placeholder:
      "输入图像编辑指令，按 @ 引用 1-3 张图片，例如：把第一张图的人物换成第二张图的姿势",
  }),
  capabilities: Object["freeze"]({
    inputKinds: Object["freeze"](["image"]),
    outputType: "image",
    maxImages: 3,
  }),
  inputSlots: Object["freeze"]({
    allowedKinds: Object["freeze"](["image"]),
    minByKind: Object["freeze"]({ image: 1 }),
    maxByKind: Object["freeze"]({ text: 0, image: 3, video: 0, audio: 0 }),
  }),
  uiSchema: Object["freeze"]({
    fields: Object["freeze"]([
      Object["freeze"]({
        id: "rhQwenEditMode",
        type: "segmented",
        placement: "mode",
        variant: "sectionMenu",
        label: "模式选择",
        description:
          "2511：新一代指令图像编辑，人物/多人一致性、材质/光照、工业设计与文字编辑更强；支持 1-3 张参考图和多轮编辑。\n2509：多图编辑与单图一致性增强，适合人物/产品/文字编辑；支持深度图、边缘图、关键点/姿势图等 ControlNet 条件图。",
        defaultValue: "qwen2511",
        options: Object["freeze"]([
          Object["freeze"]({
            value: "qwen2511",
            label: "Qwen-edit2511",
            displayLabel: "2511",
          }),
          Object["freeze"]({
            value: "qwen2509",
            label: "Qwen-edit2509",
            displayLabel: "2509",
          }),
        ]),
      }),
      Object["freeze"]({
        id: "rhQwenFirstImageMode",
        type: "segmented",
        placement: "advanced",
        label: "第一张图为",
        description:
          "用于告诉工作流第一张参考图的角色：原图用于常规编辑，姿势图用于姿态约束，深度图用于空间结构约束。",
        defaultValue: "original",
        options: Object["freeze"]([
          Object["freeze"]({ value: "original", label: "原图" }),
          Object["freeze"]({ value: "pose", label: "姿势图" }),
          Object["freeze"]({ value: "depth", label: "深度图" }),
        ]),
      }),
      Object["freeze"]({
        id: "imageSize",
        type: "segmented",
        placement: "resolution",
        label: "尺寸",
        defaultValue: "2K",
        options: Object["freeze"]([
          Object["freeze"]({ value: "1K", label: "1K" }),
          Object["freeze"]({ value: "1.5K", label: "1.5K" }),
          Object["freeze"]({ value: "2K", label: "2K" }),
        ]),
      }),
      ASPECT_RATIO_FIELD,
      RH_IMAGE_INSTANCE_FIELD,
    ]),
  }),
  async: true,
  cancellable: true,
  outputType: "image",
});
export const qwenImageEditExecutionManifest = Object["freeze"]({
  schemaVersion: "1.0",
  id: QWEN_IMAGE_EDIT_EXECUTION_ID,
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  workflowId: "2050306122774532097",
  appId: "2050306122774532097",
  submitMode: "openapi-v2-ai-app",
  queryMode: "openapi-v2-query",
  instanceType: Object["freeze"]({
    field: "rhInstanceType",
    defaultValue: "default",
    allowedValues: Object["freeze"](["default", "plus"]),
  }),
  mapping: Object["freeze"]({
    maxInputImages: 3,
    imageNodes: Object["freeze"](["151", "152", "157"]),
    promptNode: Object["freeze"]({ nodeId: "148", fieldName: "value" }),
    dimensionsNode: Object["freeze"]({ nodeId: "112" }),
    firstImageModeNode: Object["freeze"]({
      nodeId: "227",
      fieldName: "index",
      field: "rhQwenFirstImageMode",
      defaultValue: "original",
      valueMap: Object["freeze"]({ original: "0", pose: "1", depth: "2" }),
    }),
    editModeNode: Object["freeze"]({
      nodeId: "231",
      fieldName: "index",
      field: "rhQwenEditMode",
      defaultValue: "qwen2511",
      valueMap: Object["freeze"]({
        qwen2509: "0",
        "qwen-edit2509": "0",
        2509: "0",
        0: "0",
        qwen2511: "1",
        "qwen-edit2511": "1",
        2511: "1",
        1: "1",
      }),
    }),
    imageCountNode: Object["freeze"]({
      nodeId: "265",
      fieldName: "value",
      offset: -1,
    }),
  }),
  result: Object["freeze"]({
    taskIdPath: "taskId",
    urlFields: Object["freeze"](["url", "imageUrl"]),
  }),
  validation: Object["freeze"]({
    minInputImages: 1,
    missingInputMessage: "请先添加至少一张参考图再生成",
  }),
});

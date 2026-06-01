import { RH_IMAGE_INSTANCE_FIELD } from "../../shared/runningHubImageManifestShared.js";
export const PERSON_REPLACE_V21_MODEL_ID = "runninghub/2050313968069165058";
export const PERSON_REPLACE_V21_EXECUTION_ID =
  "runninghub.workflow.person-replace-v21.v1";
export const PERSON_REPLACE_V21_HELP_TOOLTIP = [
  "人物替换V2.1用法",
  "接入两张图：[[red:替换目标]] + [[red:被替换图]]",
  "需要精准替换时，先在图像节点的[[red:遮罩编辑器]]里画出人物区域",
  "目标图遮罩控制放入谁；被替换图遮罩控制替换谁",
  "适合作为视频编辑的[[red:首帧图]]：先定人物、构图和背景，再接视频生成",
]["join"]("\x0a");
export const personReplaceV21ModelManifest = Object["freeze"]({
  schemaVersion: "1.0",
  modelId: PERSON_REPLACE_V21_MODEL_ID,
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  executionId: PERSON_REPLACE_V21_EXECUTION_ID,
  displayName: "人物替换人物替换V2.1",
  icon: "images/RH.png",
  description: "双图人物替换，支持目标/被替换图遮罩",
  help: Object["freeze"]({ tooltip: PERSON_REPLACE_V21_HELP_TOOLTIP }),
  extensions: Object["freeze"]({
    imageMenu: Object["freeze"]({ group: "runninghubWorkflow", order: 20 }),
  }),
  capabilities: Object["freeze"]({
    inputKinds: Object["freeze"](["text", "image"]),
    outputType: "image",
    fixedImageSlots: Object["freeze"](["replaceTarget", "replacedImage"]),
  }),
  inputSlots: Object["freeze"]({
    allowedKinds: Object["freeze"](["text", "image"]),
    minByKind: Object["freeze"]({ image: 2 }),
    maxByKind: Object["freeze"]({ image: 2, video: 0, audio: 0 }),
    displayAspectRatioSource: Object["freeze"]({
      kind: "image",
      slot: "replacedImage",
      fallbackIndex: 1,
    }),
    fixedSlots: Object["freeze"]([
      Object["freeze"]({
        id: "replaceTarget",
        kind: "image",
        label: "替换目标",
        required: true,
      }),
      Object["freeze"]({
        id: "replacedImage",
        kind: "image",
        label: "被替换图",
        required: true,
      }),
    ]),
  }),
  uiSchema: Object["freeze"]({
    fields: Object["freeze"]([
      Object["freeze"]({
        id: "rhResolution",
        type: "slider",
        placement: "resolution",
        label: "分辨率",
        description: "1600 及以上分辨率需要使用 48G 显存执行。",
        showInfoTip: true,
        defaultValue: 1280,
        options: Object["freeze"]([832, 1024, 1280, 1440, 1600, 1920]),
      }),
      RH_IMAGE_INSTANCE_FIELD,
    ]),
  }),
  async: true,
  cancellable: true,
  outputType: "image",
});
export const personReplaceV21ExecutionManifest = Object["freeze"]({
  schemaVersion: "1.0",
  id: PERSON_REPLACE_V21_EXECUTION_ID,
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  label: "人物替换人物替换V2.1",
  workflowId: "2050313968069165058",
  appId: "2050313968069165058",
  submitMode: "openapi-v2-ai-app",
  queryMode: "openapi-v2-query",
  instanceType: Object["freeze"]({
    field: "rhInstanceType",
    defaultValue: "default",
  }),
  validation: Object["freeze"]({
    minInputImages: 2,
    missingInputMessage: "请添加两张图片：替换目标、被替换图",
  }),
  mapping: Object["freeze"]({
    maxInputImages: 2,
    imageNodes: Object["freeze"](["258", "265"]),
    optionalImageNodes: Object["freeze"]([
      Object["freeze"]({
        nodeId: "257",
        fieldName: "image",
        fields: Object["freeze"](["inputMaskUrls.0", "rhReplaceTargetMaskUrl"]),
        enableNode: Object["freeze"]({
          nodeId: "259",
          fieldName: "boolean",
          value: "true",
        }),
      }),
      Object["freeze"]({
        nodeId: "255",
        fieldName: "image",
        fields: Object["freeze"](["inputMaskUrls.1", "rhReplaceSourceMaskUrl"]),
        enableNode: Object["freeze"]({
          nodeId: "262",
          fieldName: "boolean",
          value: "true",
        }),
      }),
    ]),
    promptNode: Object["freeze"]({
      nodeId: "232",
      fieldName: "value",
      defaultValue: "4K",
    }),
    valueNodes: Object["freeze"]([
      Object["freeze"]({
        nodeId: "233",
        fieldName: "value",
        field: "rhResolution",
        defaultValue: 1280,
        allowedValues: Object["freeze"]([832, 1024, 1280, 1440, 1600, 1920]),
        description: "分辨率",
      }),
    ]),
  }),
  result: Object["freeze"]({
    taskIdPath: "taskId",
    imagePaths: Object["freeze"](["results[].url", "results[].imageUrl"]),
  }),
});

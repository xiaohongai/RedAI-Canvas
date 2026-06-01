import { RH_IMAGE_INSTANCE_FIELD } from "../../shared/runningHubImageManifestShared.js";
export const PERSON_REPLACE_V3_MODEL_ID = "runninghub/2041177685895946242";
export const PERSON_REPLACE_V3_EXECUTION_ID =
  "runninghub.workflow.person-replace-v3.v1";
export const PERSON_REPLACE_V3_HELP_TOOLTIP = [
  "人物替换V3用法",
  "接入两张图：[[red:替换目标]] + [[red:被替换图]]",
  "优先用图像节点的[[red:遮罩编辑器]]圈准人物边界，减少误换背景",
  "目标图负责新人物来源；被替换图负责保留场景和构图",
  "适合作为视频编辑的[[red:首帧图]]，先把人物关系、光影和镜头构图定住",
]["join"]("\x0a");
export const personReplaceV3ModelManifest = Object["freeze"]({
  schemaVersion: "1.0",
  modelId: PERSON_REPLACE_V3_MODEL_ID,
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  executionId: PERSON_REPLACE_V3_EXECUTION_ID,
  displayName: "人物替换图片编辑V3",
  icon: "images/RH.png",
  description: "双图人物替换，支持目标/被替换图遮罩",
  help: Object["freeze"]({ tooltip: PERSON_REPLACE_V3_HELP_TOOLTIP }),
  extensions: Object["freeze"]({
    imageMenu: Object["freeze"]({ group: "runninghubWorkflow", order: 10 }),
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
        defaultValue: 1440,
        options: Object["freeze"]([1024, 1280, 1440, 1600]),
      }),
      RH_IMAGE_INSTANCE_FIELD,
    ]),
  }),
  async: true,
  cancellable: true,
  outputType: "image",
});
export const personReplaceV3ExecutionManifest = Object["freeze"]({
  schemaVersion: "1.0",
  id: PERSON_REPLACE_V3_EXECUTION_ID,
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  label: "人物替换图片编辑V3",
  workflowId: "2041177685895946242",
  appId: "2041177685895946242",
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
    imageNodes: Object["freeze"](["45", "40"]),
    optionalImageNodes: Object["freeze"]([
      Object["freeze"]({
        nodeId: "1180",
        fieldName: "image",
        fields: Object["freeze"](["inputMaskUrls.0", "rhReplaceTargetMaskUrl"]),
        enableNode: Object["freeze"]({
          nodeId: "1185",
          fieldName: "boolean",
          value: "true",
        }),
      }),
      Object["freeze"]({
        nodeId: "1177",
        fieldName: "image",
        fields: Object["freeze"](["inputMaskUrls.1", "rhReplaceSourceMaskUrl"]),
        enableNode: Object["freeze"]({
          nodeId: "1186",
          fieldName: "boolean",
          value: "true",
        }),
      }),
    ]),
    promptNode: Object["freeze"]({
      nodeId: "594",
      fieldName: "value",
      defaultValue: "4k,高清画质",
    }),
    valueNodes: Object["freeze"]([
      Object["freeze"]({
        nodeId: "400",
        fieldName: "value",
        field: "rhResolution",
        defaultValue: 1440,
        description: "分辨率",
      }),
    ]),
  }),
  result: Object["freeze"]({
    taskIdPath: "taskId",
    imagePaths: Object["freeze"](["results[].url", "results[].imageUrl"]),
  }),
});

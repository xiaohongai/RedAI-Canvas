import { RH_IMAGE_INSTANCE_FIELD } from "../../shared/runningHubImageManifestShared.js";
export const ANIME_REAL_MODEL_ID = "runninghub/1994718111704158209";
export const ANIME_REAL_EXECUTION_ID = "runninghub.workflow.anime-real.v1";
export const ANIME_REAL_HELP_TOOLTIP = [
  "漫画转真人用法",
  "接入 [[red:1 张漫画/二次元角色图]]",
  "提示词补充写实程度、服装、场景和镜头语言",
  "适合把角色设定转成真人参考图，再继续做海报或视频首帧",
]["join"]("\x0a");
export const animeRealModelManifest = Object["freeze"]({
  schemaVersion: "1.0",
  modelId: ANIME_REAL_MODEL_ID,
  aliases: Object["freeze"](["runninghub/1994711386552999938"]),
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  executionId: ANIME_REAL_EXECUTION_ID,
  displayName: "漫画转真人",
  icon: "images/RH.png",
  description: "基于工作流把二次元角色转写实人像",
  help: Object["freeze"]({ tooltip: ANIME_REAL_HELP_TOOLTIP }),
  extensions: Object["freeze"]({
    imageMenu: Object["freeze"]({ group: "runninghubWorkflow", order: 30 }),
    imageNodeUi: Object["freeze"]({
      alwaysShowRefBar: true,
      rootClass: "rh-anime-real-node",
      workflowBusyButton: true,
      inputGate: Object["freeze"]({
        kind: "image",
        max: 1,
        uploadedUrlField: "rhAnimeRealRefUrl",
        clearFields: Object["freeze"]([
          "rhAnimeRealRefUrl",
          "rhAnimeRealRefLocalPath",
          "rhAnimeRealRefFileName",
        ]),
        missingMessage: "请先上传一张参考图再生成",
      }),
    }),
  }),
  capabilities: Object["freeze"]({
    inputKinds: Object["freeze"](["image"]),
    outputType: "image",
    maxImages: 1,
  }),
  inputSlots: Object["freeze"]({
    allowedKinds: Object["freeze"](["image"]),
    minByKind: Object["freeze"]({ image: 1 }),
    maxByKind: Object["freeze"]({ text: 0, image: 1, video: 0, audio: 0 }),
  }),
  uiSchema: Object["freeze"]({
    fields: Object["freeze"]([
      Object["freeze"]({
        id: "rhAnimeRealResolution",
        type: "slider",
        placement: "resolution",
        label: "分辨率",
        defaultValue: 1440,
        options: Object["freeze"]([
          Object["freeze"]({ value: 1280, label: "1280" }),
          Object["freeze"]({ value: 1440, label: "1440" }),
          Object["freeze"]({ value: 1600, label: "1600" }),
          Object["freeze"]({ value: 1760, label: "1760" }),
          Object["freeze"]({ value: 1920, label: "1920" }),
        ]),
      }),
      RH_IMAGE_INSTANCE_FIELD,
    ]),
  }),
  async: true,
  cancellable: true,
  outputType: "image",
});
export const animeRealExecutionManifest = Object["freeze"]({
  schemaVersion: "1.0",
  id: ANIME_REAL_EXECUTION_ID,
  provider: "runninghubwf",
  kind: "image",
  adapterType: "workflow",
  workflowId: "1994718111704158209",
  appId: "1994718111704158209",
  aliases: Object["freeze"](["runninghub.workflow.anime-real.legacy.v1"]),
  submitMode: "openapi-v2-ai-app",
  queryMode: "openapi-v2-query",
  instanceType: Object["freeze"]({
    field: "rhInstanceType",
    defaultValue: "default",
    allowedValues: Object["freeze"](["default", "plus"]),
  }),
  mapping: Object["freeze"]({
    maxInputImages: 1,
    imageNodes: Object["freeze"](["851"]),
    promptNode: Object["freeze"]({ nodeId: "967", fieldName: "value" }),
    valueNodes: Object["freeze"]([
      Object["freeze"]({
        nodeId: "945",
        fieldName: "value",
        field: "rhAnimeRealResolution",
        fallbackFields: Object["freeze"](["rhResolution"]),
        defaultValue: 1440,
      }),
    ]),
  }),
  result: Object["freeze"]({
    taskIdPath: "taskId",
    urlFields: Object["freeze"](["url", "imageUrl"]),
  }),
  validation: Object["freeze"]({
    minInputImages: 1,
    missingInputMessage: "请添加一张参考图片",
  }),
});

const DREAMINA_IMAGE_SIZE_FIELD = Object["freeze"]({
    id: "imageSize",
    type: "segmented",
    placement: "resolution",
    label: "Quality",
    defaultValue: "2K",
    options: Object["freeze"]([
      Object["freeze"]({ value: "2K", label: "2K" }),
      Object["freeze"]({ value: "4K", label: "4K" }),
    ]),
  }),
  DREAMINA_ASPECT_RATIO_FIELD = Object["freeze"]({
    id: "aspectRatio",
    type: "segmented",
    placement: "resolution",
    label: "Ratio",
    defaultValue: "自适应",
    options: Object["freeze"]([
      Object["freeze"]({ value: "自适应", label: "Auto" }),
      Object["freeze"]({ value: "21:9", label: "21:9" }),
      Object["freeze"]({ value: "16:9", label: "16:9" }),
      Object["freeze"]({ value: "3:2", label: "3:2" }),
      Object["freeze"]({ value: "4:3", label: "4:3" }),
      Object["freeze"]({ value: "1:1", label: "1:1" }),
      Object["freeze"]({ value: "3:4", label: "3:4" }),
      Object["freeze"]({ value: "2:3", label: "2:3" }),
      Object["freeze"]({ value: "9:16", label: "9:16" }),
    ]),
  }),
  DREAMINA_BATCH_SIZE_FIELD = Object["freeze"]({
    id: "batchSize",
    type: "segmented",
    placement: "batch",
    label: "Batch",
    defaultValue: 1,
    options: Object["freeze"]([
      Object["freeze"]({ value: 1, label: "1x", selectedLabel: "1x" }),
      Object["freeze"]({ value: 2, label: "2x", selectedLabel: "2x" }),
      Object["freeze"]({ value: 4, label: "4x", selectedLabel: "4x" }),
    ]),
  }),
  DREAMINA_IMAGE_MODELS = Object["freeze"]([
    Object["freeze"]({
      modelId: "dreamina/4.0",
      executionId: "dreamina.local-runtime.image-4-0.v1",
      displayName: "Dreamina 4.0",
      imageMenu: Object["freeze"]({
        order: 10,
        title: "即梦4.0",
        subtitle: "无图文生图\x20/\x20单图图生图",
      }),
    }),
    Object["freeze"]({
      modelId: "dreamina/4.1",
      executionId: "dreamina.local-runtime.image-4-1.v1",
      displayName: "Dreamina\x204.1",
      imageMenu: Object["freeze"]({
        order: 20,
        title: "即梦4.1",
        subtitle: "细节增强，生成更稳定",
      }),
    }),
    Object["freeze"]({
      modelId: "dreamina/4.5",
      executionId: "dreamina.local-runtime.image-4-5.v1",
      displayName: "Dreamina 4.5",
      imageMenu: Object["freeze"]({
        order: 30,
        default: true,
        title: "即梦4.5",
        subtitle: "综合性能均衡，推荐默认",
      }),
    }),
    Object["freeze"]({
      modelId: "dreamina/5.0",
      executionId: "dreamina.local-runtime.image-5-0.v1",
      displayName: "Dreamina 5.0",
      imageMenu: Object["freeze"]({
        order: 40,
        title: "即梦5.0",
        subtitle: "新版模型，画面表现更强",
      }),
    }),
  ]);
function createDreaminaModelManifest({
  modelId: v0,
  executionId: v1,
  displayName: v2,
  imageMenu: v3,
}) {
  return Object["freeze"]({
    schemaVersion: "1.0",
    modelId: v0,
    provider: "dreamina",
    kind: "image",
    adapterType: "localRuntime",
    executionId: v1,
    displayName: v2,
    icon: "images/jimeng.png",
    extensions: Object["freeze"]({
      ratioPolicy: Object["freeze"]({ capability: "aspectRatio" }),
      imageMenu: Object["freeze"]({ group: "dreamina", ...v3 }),
    }),
    inputSlots: Object["freeze"]({
      allowedKinds: Object["freeze"](["text", "image"]),
      minByKind: Object["freeze"]({ image: 0 }),
      maxByKind: Object["freeze"]({ image: 1, video: 0, audio: 0 }),
    }),
    uiSchema: Object["freeze"]({
      fields: Object["freeze"]([
        DREAMINA_IMAGE_SIZE_FIELD,
        DREAMINA_ASPECT_RATIO_FIELD,
        DREAMINA_BATCH_SIZE_FIELD,
      ]),
    }),
    async: true,
    cancellable: true,
    outputType: "image",
  });
}
function createDreaminaExecutionManifest({ executionId: v4 }) {
  return Object["freeze"]({
    schemaVersion: "1.0",
    id: v4,
    provider: "dreamina",
    kind: "image",
    adapterType: "localRuntime",
    runtime: "dreaminaImage",
    result: Object["freeze"]({
      urlFields: Object["freeze"](["url", "imageUrl"]),
    }),
  });
}
export const dreaminaImageModelManifests = Object["freeze"](
  DREAMINA_IMAGE_MODELS["map"](createDreaminaModelManifest),
);
export const dreaminaImageExecutionManifests = Object["freeze"](
  DREAMINA_IMAGE_MODELS["map"](createDreaminaExecutionManifest),
);

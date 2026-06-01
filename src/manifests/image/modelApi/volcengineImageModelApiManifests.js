import {
  APIMART_SEEDREAM_4_5_IMAGE_SIZE_FIELD,
  APIMART_SEEDREAM_4_IMAGE_SIZE_FIELD,
  APIMART_SEEDREAM_5_LITE_IMAGE_SIZE_FIELD,
  APIMART_SEEDREAM_5_LITE_RATIO_FIELD,
  APIMART_SEEDREAM_RATIO_FIELD,
  BATCH_SIZE_FIELD,
  createImageModelApiManifest,
  createModelApiExecutionManifest,
} from "./sharedImageModelApiFields.js";
export const VOLCENGINE_SEEDREAM_5_MODEL_ID = "volcengine/seedream-5.0";
export const VOLCENGINE_SEEDREAM_5_EXECUTION_ID =
  "volcengine.model-api.seedream-5.v1";
export const VOLCENGINE_SEEDREAM_4_5_MODEL_ID = "volcengine/seedream-4.5";
export const VOLCENGINE_SEEDREAM_4_5_EXECUTION_ID =
  "volcengine.model-api.seedream-4-5.v1";
export const VOLCENGINE_SEEDREAM_4_MODEL_ID = "volcengine/seedream-4.0";
export const VOLCENGINE_SEEDREAM_4_EXECUTION_ID =
  "volcengine.model-api.seedream-4.v1";
const VOLCENGINE_IMAGE_RESPONSE_MAPPING = Object["freeze"]({
    statusPath: "status",
    errorPath: Object["freeze"]([
      "error.message",
      "data.error.message",
      "message",
    ]),
    resultPaths: Object["freeze"]([
      "data.data[].url",
      "data.images[].url",
      "data.result.images[].url",
      "data.output[].url",
      "data[].url",
      "images[].url",
      "output[].url",
      "data.url",
      "result.images[].url",
      "results[].url",
      "results[].imageUrl",
      "image_url",
      "url",
    ]),
  }),
  VOLCENGINE_SEEDREAM_2K_DIMENSIONS = Object["freeze"]({
    "1:1": "2048x2048",
    "4:3": "2304x1728",
    "3:4": "1728x2304",
    "16:9": "2848x1600",
    "9:16": "1600x2848",
    "3:2": "2496x1664",
    "2:3": "1664x2496",
    "21:9": "3136x1344",
  }),
  VOLCENGINE_SEEDREAM_3K_DIMENSIONS = Object["freeze"]({
    "1:1": "3072x3072",
    "4:3": "3456x2592",
    "3:4": "2592x3456",
    "16:9": "4096x2304",
    "9:16": "2304x4096",
    "3:2": "3744x2496",
    "2:3": "2496x3744",
    "21:9": "4704x2016",
  }),
  VOLCENGINE_SEEDREAM_5_POLICY = Object["freeze"]({
    allowedResolutions: Object["freeze"](["2K", "3K"]),
    defaultResolution: "2K",
    maxBatchSize: 4,
    preserveAdaptiveInputRatio: true,
    supportsAdaptiveSize: true,
    dimensionMapByResolution: Object["freeze"]({
      "2K": VOLCENGINE_SEEDREAM_2K_DIMENSIONS,
      "3K": VOLCENGINE_SEEDREAM_3K_DIMENSIONS,
    }),
  }),
  VOLCENGINE_SEEDREAM_4_5_POLICY = Object["freeze"]({
    allowedResolutions: Object["freeze"](["2K", "4K"]),
    defaultResolution: "2K",
    maxBatchSize: 4,
    preserveAdaptiveInputRatio: true,
  }),
  VOLCENGINE_SEEDREAM_4_POLICY = Object["freeze"]({
    allowedResolutions: Object["freeze"](["1K", "2K", "4K"]),
    defaultResolution: "2K",
    maxBatchSize: 4,
    preserveAdaptiveInputRatio: true,
  }),
  VOLCENGINE_SEEDREAM_INPUT_SLOTS = Object["freeze"]({
    allowedKinds: Object["freeze"](["text", "image"]),
    minByKind: Object["freeze"]({ image: 0 }),
    maxByKind: Object["freeze"]({ image: 14, video: 0, audio: 0 }),
  }),
  VOLCENGINE_FILE_UPLOAD_POLICY = Object["freeze"]({
    inputKinds: Object["freeze"](["image"]),
  }),
  VOLCENGINE_SEEDREAM_BODY_MAPPING = Object["freeze"]([
    Object["freeze"]({ path: "model", from: "model" }),
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "size",
      from: "param",
      field: Object["freeze"](["resolvedRatioLabel", "aspectRatio"]),
      transform: "volcengineSeedreamSize",
    }),
    Object["freeze"]({
      path: "response_format",
      from: "constant",
      value: "url",
    }),
    Object["freeze"]({ path: "watermark", from: "constant", value: false }),
    Object["freeze"]({
      path: "image",
      from: "inputImages",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "sequential_image_generation",
      from: "param",
      field: "batchSize",
      defaultValue: 1,
      transform: "volcengineSeedreamSequentialMode",
    }),
    Object["freeze"]({
      path: "sequential_image_generation_options.max_images",
      from: "param",
      field: "batchSize",
      defaultValue: 1,
      transform: "volcengineSeedreamImageCount",
      omitWhenEmpty: true,
    }),
  ]);
function createImageMenuExtension(v0) {
  return Object["freeze"]({ imageMenu: Object["freeze"](v0) });
}
export const volcengineImageModelApiModelManifests = Object["freeze"]([
  createImageModelApiManifest({
    modelId: VOLCENGINE_SEEDREAM_5_MODEL_ID,
    executionId: VOLCENGINE_SEEDREAM_5_EXECUTION_ID,
    provider: "volcengine",
    displayName: "Seedream 5.0",
    icon: "images/volcengine.svg",
    description: "Volcengine\x20Ark\x20Seedream\x20image\x20generation\x20API",
    inputSlots: VOLCENGINE_SEEDREAM_INPUT_SLOTS,
    fields: [
      APIMART_SEEDREAM_5_LITE_IMAGE_SIZE_FIELD,
      APIMART_SEEDREAM_5_LITE_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "volcengine",
      order: 10,
      title: "Seedream 5.0",
      subtitle: "火山方舟原生生图，支持 2K/3K 输出",
      iconAlt: "volcengine",
      gap: 9,
    }),
  }),
  createImageModelApiManifest({
    modelId: VOLCENGINE_SEEDREAM_4_5_MODEL_ID,
    executionId: VOLCENGINE_SEEDREAM_4_5_EXECUTION_ID,
    provider: "volcengine",
    displayName: "Seedream 4.5",
    icon: "images/volcengine.svg",
    description: "Volcengine\x20Ark\x20Seedream\x20image\x20generation\x20API",
    inputSlots: VOLCENGINE_SEEDREAM_INPUT_SLOTS,
    fields: [
      APIMART_SEEDREAM_4_5_IMAGE_SIZE_FIELD,
      APIMART_SEEDREAM_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "volcengine",
      order: 20,
      title: "Seedream\x204.5",
      subtitle: "高画质图像生成与多图参考",
      iconAlt: "volcengine",
      gap: 9,
    }),
  }),
  createImageModelApiManifest({
    modelId: VOLCENGINE_SEEDREAM_4_MODEL_ID,
    executionId: VOLCENGINE_SEEDREAM_4_EXECUTION_ID,
    provider: "volcengine",
    displayName: "Seedream\x204.0",
    icon: "images/volcengine.svg",
    description: "Volcengine Ark Seedream image generation API",
    inputSlots: VOLCENGINE_SEEDREAM_INPUT_SLOTS,
    fields: [
      APIMART_SEEDREAM_4_IMAGE_SIZE_FIELD,
      APIMART_SEEDREAM_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "volcengine",
      order: 30,
      title: "Seedream 4.0",
      subtitle: "经典 Seedream 生图，支持 1K/2K/4K",
      iconAlt: "volcengine",
      gap: 10,
    }),
  }),
]);
export const volcengineImageModelApiExecutionManifests = Object["freeze"]([
  createModelApiExecutionManifest({
    id: VOLCENGINE_SEEDREAM_5_EXECUTION_ID,
    provider: "volcengine",
    model: "doubao-seedream-5-0-260128",
    endpoint: "/images/generations",
    bodyMapping: VOLCENGINE_SEEDREAM_BODY_MAPPING,
    responseMapping: VOLCENGINE_IMAGE_RESPONSE_MAPPING,
    extensions: Object["freeze"]({
      volcengineSeedream: VOLCENGINE_SEEDREAM_5_POLICY,
      volcengineFiles: VOLCENGINE_FILE_UPLOAD_POLICY,
    }),
  }),
  createModelApiExecutionManifest({
    id: VOLCENGINE_SEEDREAM_4_5_EXECUTION_ID,
    provider: "volcengine",
    model: "doubao-seedream-4-5-251128",
    endpoint: "/images/generations",
    bodyMapping: VOLCENGINE_SEEDREAM_BODY_MAPPING,
    responseMapping: VOLCENGINE_IMAGE_RESPONSE_MAPPING,
    extensions: Object["freeze"]({
      volcengineSeedream: VOLCENGINE_SEEDREAM_4_5_POLICY,
      volcengineFiles: VOLCENGINE_FILE_UPLOAD_POLICY,
    }),
  }),
  createModelApiExecutionManifest({
    id: VOLCENGINE_SEEDREAM_4_EXECUTION_ID,
    provider: "volcengine",
    model: "doubao-seedream-4-0-250828",
    endpoint: "/images/generations",
    bodyMapping: VOLCENGINE_SEEDREAM_BODY_MAPPING,
    responseMapping: VOLCENGINE_IMAGE_RESPONSE_MAPPING,
    extensions: Object["freeze"]({
      volcengineSeedream: VOLCENGINE_SEEDREAM_4_POLICY,
      volcengineFiles: VOLCENGINE_FILE_UPLOAD_POLICY,
    }),
  }),
]);

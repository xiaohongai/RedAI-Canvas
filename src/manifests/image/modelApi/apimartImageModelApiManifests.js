import {
  APIMART_NANO_BANANA_2_GOOGLE_IMAGE_SEARCH_FIELD,
  APIMART_NANO_BANANA_2_GOOGLE_SEARCH_FIELD,
  APIMART_GPT_IMAGE_2_IMAGE_SIZE_FIELD,
  APIMART_GPT_IMAGE_2_MODE_FIELD,
  APIMART_GPT_IMAGE_2_RATIO_FIELD,
  APIMART_NANO_BANANA_2_IMAGE_SIZE_FIELD,
  APIMART_NANO_BANANA_2_MODE_FIELD,
  APIMART_NANO_BANANA_IMAGE_SIZE_FIELD,
  APIMART_NANO_BANANA_MODE_FIELD,
  APIMART_NANO_BANANA_PRO_IMAGE_SIZE_FIELD,
  APIMART_NANO_BANANA_PRO_MODE_FIELD,
  APIMART_QWEN_IMAGE_BATCH_SIZE_FIELD,
  APIMART_QWEN_IMAGE_MODE_FIELD,
  APIMART_QWEN_IMAGE_RATIO_FIELD,
  APIMART_QWEN_IMAGE_SIZE_FIELD,
  APIMART_SEEDREAM_4_5_IMAGE_SIZE_FIELD,
  APIMART_SEEDREAM_4_IMAGE_SIZE_FIELD,
  APIMART_SEEDREAM_5_LITE_IMAGE_SIZE_FIELD,
  APIMART_SEEDREAM_5_LITE_RATIO_FIELD,
  APIMART_SEEDREAM_RATIO_FIELD,
  APIMART_WAN_IMAGE_MODE_FIELD,
  APIMART_WAN_IMAGE_RATIO_FIELD,
  APIMART_WAN_IMAGE_SIZE_FIELD,
  APIMART_WAN_THINKING_MODE_FIELD,
  APIMART_Z_IMAGE_TURBO_IMAGE_SIZE_FIELD,
  APIMART_Z_IMAGE_TURBO_PROMPT_EXTEND_FIELD,
  APIMART_Z_IMAGE_TURBO_RATIO_FIELD,
  ASPECT_RATIO_FIELD,
  BATCH_SIZE_FIELD,
  NANO_BANANA_2_RATIO_FIELD,
  createImageModelApiManifest,
  createModelApiExecutionManifest,
} from "./sharedImageModelApiFields.js";
export const APIMART_NANO_BANANA_2_MODEL_ID = "apimart/nano-banana-2";
export const APIMART_NANO_BANANA_2_EXECUTION_ID =
  "apimart.model-api.nano-banana-2.v1";
export const APIMART_NANO_BANANA_PRO_MODEL_ID = "apimart/nano-banana-pro";
export const APIMART_NANO_BANANA_PRO_EXECUTION_ID =
  "apimart.model-api.nano-banana-pro.v1";
export const APIMART_NANO_BANANA_MODEL_ID = "apimart/nano-banana-dot";
export const APIMART_NANO_BANANA_EXECUTION_ID =
  "apimart.model-api.nano-banana-dot.v1";
export const APIMART_GPT_IMAGE_2_MODEL_ID = "apimart/gpt-image-2";
export const APIMART_GPT_IMAGE_2_EXECUTION_ID =
  "apimart.model-api.gpt-image-2.v1";
export const APIMART_QWEN_IMAGE_MODEL_ID = "apimart/qwen-image-2.0";
export const APIMART_QWEN_IMAGE_EXECUTION_ID =
  "apimart.model-api.qwen-image-2.v1";
export const APIMART_Z_IMAGE_TURBO_MODEL_ID = "apimart/z-image-turbo";
export const APIMART_Z_IMAGE_TURBO_EXECUTION_ID =
  "apimart.model-api.z-image-turbo.v1";
export const APIMART_WAN_IMAGE_MODEL_ID = "apimart/wan2.7-image";
export const APIMART_WAN_IMAGE_EXECUTION_ID =
  "apimart.model-api.wan2-7-image.v1";
export const APIMART_SEEDREAM_4_MODEL_ID = "apimart/seedream-4.0";
export const APIMART_SEEDREAM_4_EXECUTION_ID =
  "apimart.model-api.seedream-4.v1";
export const APIMART_SEEDREAM_4_5_MODEL_ID = "apimart/seedream-4.5";
export const APIMART_SEEDREAM_4_5_EXECUTION_ID =
  "apimart.model-api.seedream-4-5.v1";
export const APIMART_SEEDREAM_5_LITE_MODEL_ID = "apimart/seedream-5.0-lite";
export const APIMART_SEEDREAM_5_LITE_EXECUTION_ID =
  "apimart.model-api.seedream-5-lite.v1";
const APIMART_IMAGE_FUNCTION_FAMILIES = Object["freeze"]({
  NANOBANANA: "nanobanana",
  NANOBANANA_2: "nanobanana-2",
  NANOBANANA_PRO: "nanobanana-pro",
  GPT_IMAGE_2: "gpt-image-2",
});
function createImageMenuExtension(v0, v1 = null) {
  return Object["freeze"]({
    imageMenu: Object["freeze"](v0),
    ...(v1 ? { imageFunctionMenu: Object["freeze"](v1) } : {}),
  });
}
const GPT_IMAGE_2_PROMPT = Object["freeze"]({
    placeholder:
      "例：马斯克在抖音直播的截图 人气爆棚 很多网友送礼物 ，比例9比16",
  }),
  APIMART_IMAGE_RESPONSE_MAPPING = Object["freeze"]({
    taskIdPath: Object["freeze"](["data[].task_id", "task_id", "taskId"]),
    statusPath: "status",
    errorPath: "error",
    resultPaths: Object["freeze"]([
      "data.result.images[].url",
      "result.images[].url",
      "data[].url",
      "results[].url",
      "results[].imageUrl",
      "url",
    ]),
  }),
  APIMART_IMAGE_TASK_POLLING = Object["freeze"]({
    mode: "task-proxy",
    method: "GET",
    urlTemplate: "{baseUrl}/v1/tasks/{taskId}?language=zh",
    headersMode: "bearer",
  }),
  APIMART_SEEDREAM_4_POLICY = Object["freeze"]({
    allowedResolutions: Object["freeze"](["1K", "2K", "4K"]),
    maxBatchSize: 15,
    textToImageBatchSize: 1,
    preserveAdaptiveInputRatio: true,
  }),
  APIMART_SEEDREAM_4_5_POLICY = Object["freeze"]({
    allowedResolutions: Object["freeze"](["2K", "4K"]),
    maxBatchSize: 15,
    textToImageBatchSize: 1,
    preserveAdaptiveInputRatio: true,
  }),
  APIMART_SEEDREAM_5_LITE_POLICY = Object["freeze"]({
    allowedResolutions: Object["freeze"](["2K", "3K"]),
    maxBatchSize: 4,
    preserveAdaptiveInputRatio: true,
  }),
  APIMART_IMAGE_BODY_MAPPING = Object["freeze"]([
    Object["freeze"]({ path: "model", from: "model" }),
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({ path: "n", from: "constant", value: 1 }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: "imageSize",
      defaultValue: "2K",
    }),
    Object["freeze"]({
      path: "size",
      from: "param",
      field: Object["freeze"](["resolvedRatioLabel", "aspectRatio"]),
      transform: "providerRatioSize",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "image_urls",
      from: "inputImages",
      omitWhenEmpty: true,
    }),
  ]),
  APIMART_GPT_IMAGE_2_BODY_MAPPING = Object["freeze"]([
    Object["freeze"]({ path: "model", from: "model" }),
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({ path: "n", from: "constant", value: 1 }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: "imageSize",
      defaultValue: "1K",
      transform: "apimartGptImage2Resolution",
    }),
    Object["freeze"]({
      path: "size",
      from: "param",
      field: Object["freeze"](["resolvedRatioLabel", "aspectRatio"]),
      transform: "providerRatioSize",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "image_urls",
      from: "inputImages",
      omitWhenEmpty: true,
    }),
  ]),
  APIMART_QWEN_IMAGE_BODY_MAPPING = Object["freeze"]([
    Object["freeze"]({ path: "model", from: "model" }),
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "n",
      from: "param",
      field: "batchSize",
      defaultValue: 1,
      transform: "apimartQwenImageCount",
    }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: "imageSize",
      defaultValue: "1K",
      transform: "apimartQwenImageResolution",
    }),
    Object["freeze"]({
      path: "size",
      from: "param",
      field: Object["freeze"](["resolvedRatioLabel", "aspectRatio"]),
      defaultValue: "1:1",
      transform: "providerRatioSize",
    }),
    Object["freeze"]({
      path: "image_urls",
      from: "inputImages",
      omitWhenEmpty: true,
    }),
  ]),
  APIMART_Z_IMAGE_TURBO_BODY_MAPPING = Object["freeze"]([
    Object["freeze"]({ path: "model", from: "model" }),
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: "imageSize",
      defaultValue: "1K",
      transform: "apimartQwenImageResolution",
    }),
    Object["freeze"]({
      path: "size",
      from: "param",
      field: Object["freeze"](["resolvedRatioLabel", "aspectRatio"]),
      defaultValue: "1:1",
      transform: "providerRatioSize",
    }),
    Object["freeze"]({
      path: "prompt_extend",
      from: "param",
      field: "prompt_extend",
      defaultValue: false,
      transform: "booleanParam",
    }),
  ]),
  APIMART_WAN_IMAGE_BODY_MAPPING = Object["freeze"]([
    Object["freeze"]({ path: "model", from: "model" }),
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "n",
      from: "param",
      field: "batchSize",
      defaultValue: 1,
      transform: "apimartImageCount",
    }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: "imageSize",
      defaultValue: "2K",
      transform: "apimartWanImageResolution",
    }),
    Object["freeze"]({
      path: "size",
      from: "param",
      field: Object["freeze"](["resolvedRatioLabel", "aspectRatio"]),
      defaultValue: "1:1",
      transform: "providerRatioSize",
    }),
    Object["freeze"]({
      path: "image_urls",
      from: "inputImages",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "thinking_mode",
      from: "param",
      field: "thinking_mode",
      defaultValue: true,
      transform: "booleanParam",
    }),
  ]),
  APIMART_NANO_BANANA_2_BODY_MAPPING = Object["freeze"]([
    ...APIMART_IMAGE_BODY_MAPPING["map"]((v2) =>
      v2["path"] === "resolution"
        ? Object["freeze"]({ ...v2, transform: "apimartNanoBanana2Resolution" })
        : v2,
    ),
    Object["freeze"]({
      path: "google_search",
      from: "param",
      field: "google_search",
      defaultValue: false,
      transform: "apimartGoogleSearch",
    }),
    Object["freeze"]({
      path: "google_image_search",
      from: "param",
      field: "google_image_search",
      defaultValue: false,
      transform: "apimartGoogleImageSearch",
    }),
  ]),
  APIMART_NANO_BANANA_PRO_BODY_MAPPING = Object["freeze"]([
    ...APIMART_IMAGE_BODY_MAPPING["map"]((v3) =>
      v3["path"] === "resolution"
        ? Object["freeze"]({ ...v3, transform: "apimartNanoBanana2Resolution" })
        : v3,
    ),
  ]),
  APIMART_NANO_BANANA_BODY_MAPPING = Object["freeze"]([
    ...APIMART_IMAGE_BODY_MAPPING["map"]((v4) =>
      v4["path"] === "resolution"
        ? Object["freeze"]({
            path: "resolution",
            from: "constant",
            value: "1K",
          })
        : v4,
    ),
  ]),
  APIMART_SEEDREAM_BODY_MAPPING = Object["freeze"]([
    Object["freeze"]({ path: "model", from: "model" }),
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({ path: "n", from: "constant", value: 1 }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: "imageSize",
      defaultValue: "2K",
      transform: "apimartSeedreamResolution",
    }),
    Object["freeze"]({
      path: "size",
      from: "param",
      field: Object["freeze"](["resolvedRatioLabel", "aspectRatio"]),
      transform: "providerRatioSize",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "image_urls",
      from: "inputImages",
      omitWhenEmpty: true,
    }),
  ]);
export const apimartImageModelApiModelManifests = Object["freeze"]([
  createImageModelApiManifest({
    modelId: APIMART_NANO_BANANA_2_MODEL_ID,
    executionId: APIMART_NANO_BANANA_2_EXECUTION_ID,
    provider: "apimart",
    displayName: "Nano banana 2",
    icon: "images/gemini.svg",
    description: "APIMart\x20image\x20model\x20API",
    fields: [
      APIMART_NANO_BANANA_2_MODE_FIELD,
      APIMART_NANO_BANANA_2_IMAGE_SIZE_FIELD,
      NANO_BANANA_2_RATIO_FIELD,
      APIMART_NANO_BANANA_2_GOOGLE_SEARCH_FIELD,
      APIMART_NANO_BANANA_2_GOOGLE_IMAGE_SEARCH_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension(
      {
        group: "apimart",
        order: 10,
        title: "Nano banana 2",
        subtitle: "新一代架构，兼顾细节与平衡",
        iconAlt: "gemini",
        gap: 10,
      },
      { family: APIMART_IMAGE_FUNCTION_FAMILIES["NANOBANANA_2"] },
    ),
  }),
  createImageModelApiManifest({
    modelId: APIMART_NANO_BANANA_PRO_MODEL_ID,
    executionId: APIMART_NANO_BANANA_PRO_EXECUTION_ID,
    provider: "apimart",
    displayName: "Nano banana pro",
    icon: "images/gemini.svg",
    description: "APIMart\x20image\x20model\x20API",
    fields: [
      APIMART_NANO_BANANA_PRO_MODE_FIELD,
      APIMART_NANO_BANANA_PRO_IMAGE_SIZE_FIELD,
      ASPECT_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension(
      {
        group: "apimart",
        order: 20,
        title: "Nano banana pro",
        subtitle: "专业级画质，光影渲染深度优化",
        iconAlt: "gemini",
        gap: 9,
      },
      { family: APIMART_IMAGE_FUNCTION_FAMILIES["NANOBANANA_PRO"] },
    ),
  }),
  createImageModelApiManifest({
    modelId: APIMART_NANO_BANANA_MODEL_ID,
    executionId: APIMART_NANO_BANANA_EXECUTION_ID,
    provider: "apimart",
    displayName: "Nano\x20banana",
    icon: "images/gemini.svg",
    description: "APIMart image model API",
    fields: [
      APIMART_NANO_BANANA_MODE_FIELD,
      APIMART_NANO_BANANA_IMAGE_SIZE_FIELD,
      ASPECT_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension(
      {
        group: "apimart",
        order: 30,
        title: "Nano\x20banana",
        subtitle: "极速版，支持独特创意风格呈现",
        iconAlt: "gemini",
        gap: 10,
      },
      { family: APIMART_IMAGE_FUNCTION_FAMILIES["NANOBANANA"] },
    ),
  }),
  createImageModelApiManifest({
    modelId: APIMART_GPT_IMAGE_2_MODEL_ID,
    executionId: APIMART_GPT_IMAGE_2_EXECUTION_ID,
    provider: "apimart",
    displayName: "GPT image 2",
    icon: "AM",
    description: "APIMart\x20image\x20model\x20API",
    prompt: GPT_IMAGE_2_PROMPT,
    fields: [
      APIMART_GPT_IMAGE_2_MODE_FIELD,
      APIMART_GPT_IMAGE_2_IMAGE_SIZE_FIELD,
      APIMART_GPT_IMAGE_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    ratioPolicy: Object["freeze"]({
      capability: "size",
      fallbackStrategyByImageSize: Object["freeze"]({ "4K": "directional" }),
    }),
    extensions: createImageMenuExtension(
      {
        group: "apimart",
        order: 40,
        title: "GPT image 2",
        subtitle: "OpenAI 图像生成模型，支持文生图与图生图",
        iconKind: "apimartBadge",
        gap: 10,
      },
      { family: APIMART_IMAGE_FUNCTION_FAMILIES["GPT_IMAGE_2"] },
    ),
  }),
  createImageModelApiManifest({
    modelId: APIMART_QWEN_IMAGE_MODEL_ID,
    executionId: APIMART_QWEN_IMAGE_EXECUTION_ID,
    provider: "apimart",
    displayName: "Qwen image 2.0",
    icon: "AM",
    description: "APIMart Qwen image generation API",
    fields: [
      APIMART_QWEN_IMAGE_MODE_FIELD,
      APIMART_QWEN_IMAGE_SIZE_FIELD,
      APIMART_QWEN_IMAGE_RATIO_FIELD,
      APIMART_QWEN_IMAGE_BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "apimart",
      order: 45,
      title: "Qwen image 2.0",
      subtitle: "Qwen 图像生成，支持 1K/2K 与最多 6 张",
      iconKind: "apimartBadge",
      gap: 10,
    }),
  }),
  createImageModelApiManifest({
    modelId: APIMART_Z_IMAGE_TURBO_MODEL_ID,
    executionId: APIMART_Z_IMAGE_TURBO_EXECUTION_ID,
    provider: "apimart",
    displayName: "Z-Image-Turbo",
    icon: "AM",
    description: "APIMart Z-Image-Turbo image generation API",
    inputSlots: Object["freeze"]({
      allowedKinds: Object["freeze"](["text"]),
      minByKind: Object["freeze"]({ image: 0 }),
      maxByKind: Object["freeze"]({ image: 0, video: 0, audio: 0 }),
    }),
    fields: [
      APIMART_Z_IMAGE_TURBO_IMAGE_SIZE_FIELD,
      APIMART_Z_IMAGE_TURBO_RATIO_FIELD,
      APIMART_Z_IMAGE_TURBO_PROMPT_EXTEND_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "apimart",
      order: 47,
      title: "Z-Image-Turbo",
      subtitle: "轻量快速生图，支持 1K/2K 和智能改写",
      iconKind: "apimartBadge",
      gap: 10,
    }),
  }),
  createImageModelApiManifest({
    modelId: APIMART_WAN_IMAGE_MODEL_ID,
    executionId: APIMART_WAN_IMAGE_EXECUTION_ID,
    provider: "apimart",
    displayName: "Wan 2.7",
    icon: "AM",
    description: "APIMart wan2.7 image generation and editing API",
    inputSlots: Object["freeze"]({
      allowedKinds: Object["freeze"](["text", "image"]),
      minByKind: Object["freeze"]({ image: 0 }),
      maxByKind: Object["freeze"]({ image: 9, video: 0, audio: 0 }),
    }),
    fields: [
      APIMART_WAN_IMAGE_MODE_FIELD,
      APIMART_WAN_IMAGE_SIZE_FIELD,
      APIMART_WAN_IMAGE_RATIO_FIELD,
      APIMART_WAN_THINKING_MODE_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "apimart",
      order: 48,
      title: "Wan\x202.7",
      subtitle: "支持文生图、图像编辑和多图参考",
      iconKind: "apimartBadge",
      gap: 10,
    }),
  }),
  createImageModelApiManifest({
    modelId: APIMART_SEEDREAM_4_MODEL_ID,
    executionId: APIMART_SEEDREAM_4_EXECUTION_ID,
    provider: "apimart",
    displayName: "Seedream 4.0",
    icon: "images/jimeng.png",
    description: "APIMart Seedream image model API",
    fields: [
      APIMART_SEEDREAM_4_IMAGE_SIZE_FIELD,
      APIMART_SEEDREAM_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "apimart",
      order: 50,
      title: "Seedream 4.0",
      subtitle: "灵活图像功能，支持高分辨率",
      iconAlt: "jimeng",
      gap: 10,
    }),
  }),
  createImageModelApiManifest({
    modelId: APIMART_SEEDREAM_4_5_MODEL_ID,
    executionId: APIMART_SEEDREAM_4_5_EXECUTION_ID,
    provider: "apimart",
    displayName: "Seedream 4.5",
    icon: "images/jimeng.png",
    description: "APIMart Seedream image model API",
    fields: [
      APIMART_SEEDREAM_4_5_IMAGE_SIZE_FIELD,
      APIMART_SEEDREAM_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "apimart",
      order: 60,
      title: "Seedream 4.5",
      subtitle: "性能均衡的多模式图像生成",
      iconAlt: "jimeng",
      gap: 9,
    }),
  }),
  createImageModelApiManifest({
    modelId: APIMART_SEEDREAM_5_LITE_MODEL_ID,
    executionId: APIMART_SEEDREAM_5_LITE_EXECUTION_ID,
    provider: "apimart",
    displayName: "Seedream 5.0",
    icon: "images/jimeng.png",
    description: "APIMart Seedream image model API",
    fields: [
      APIMART_SEEDREAM_5_LITE_IMAGE_SIZE_FIELD,
      APIMART_SEEDREAM_5_LITE_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "apimart",
      order: 70,
      title: "Seedream 5.0",
      subtitle: "轻量高效生图，支持 2K/3K 输出",
      iconAlt: "jimeng",
      gap: 9,
    }),
  }),
]);
export const apimartImageModelApiExecutionManifests = Object["freeze"]([
  createModelApiExecutionManifest({
    id: APIMART_NANO_BANANA_2_EXECUTION_ID,
    provider: "apimart",
    model: "gemini-3.1-flash-image-preview",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_NANO_BANANA_2_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
    modeModels: Object["freeze"]({
      standard: "gemini-3.1-flash-image-preview",
      official: "gemini-3.1-flash-image-preview-official",
    }),
  }),
  createModelApiExecutionManifest({
    id: APIMART_NANO_BANANA_PRO_EXECUTION_ID,
    provider: "apimart",
    model: "gemini-3-pro-image-preview",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_NANO_BANANA_PRO_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
    modeModels: Object["freeze"]({
      standard: "gemini-3-pro-image-preview",
      official: "gemini-3-pro-image-preview-official",
    }),
  }),
  createModelApiExecutionManifest({
    id: APIMART_NANO_BANANA_EXECUTION_ID,
    provider: "apimart",
    model: "gemini-2.5-flash-image-preview",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_NANO_BANANA_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
    modeModels: Object["freeze"]({
      standard: "gemini-2.5-flash-image-preview",
      official: "gemini-2.5-flash-image-preview-official",
    }),
  }),
  createModelApiExecutionManifest({
    id: APIMART_GPT_IMAGE_2_EXECUTION_ID,
    provider: "apimart",
    model: "gpt-image-2",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_GPT_IMAGE_2_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
    extensions: Object["freeze"]({ bodyResolver: "apimartGptImage2Image" }),
    modeModels: Object["freeze"]({
      standard: "gpt-image-2",
      official: "gpt-image-2-official",
    }),
  }),
  createModelApiExecutionManifest({
    id: APIMART_QWEN_IMAGE_EXECUTION_ID,
    provider: "apimart",
    model: "qwen-image-2.0",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_QWEN_IMAGE_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
    extensions: Object["freeze"]({
      batchSubmitMode: "providerN",
      maxBatchSize: 6,
    }),
    modeModels: Object["freeze"]({
      standard: "qwen-image-2.0",
      pro: "qwen-image-2.0-pro",
    }),
  }),
  createModelApiExecutionManifest({
    id: APIMART_Z_IMAGE_TURBO_EXECUTION_ID,
    provider: "apimart",
    model: "z-image-turbo",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_Z_IMAGE_TURBO_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
  }),
  createModelApiExecutionManifest({
    id: APIMART_WAN_IMAGE_EXECUTION_ID,
    provider: "apimart",
    model: "wan2.7-image",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_WAN_IMAGE_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
    extensions: Object["freeze"]({
      batchSubmitMode: "providerN",
      maxBatchSize: 4,
    }),
    modeModels: Object["freeze"]({
      standard: "wan2.7-image",
      pro: "wan2.7-image-pro",
    }),
  }),
  createModelApiExecutionManifest({
    id: APIMART_SEEDREAM_4_EXECUTION_ID,
    provider: "apimart",
    model: "doubao-seedream-4.0",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_SEEDREAM_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
    extensions: Object["freeze"]({
      apimartSeedream: APIMART_SEEDREAM_4_POLICY,
    }),
  }),
  createModelApiExecutionManifest({
    id: APIMART_SEEDREAM_4_5_EXECUTION_ID,
    provider: "apimart",
    model: "doubao-seedream-4.5",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_SEEDREAM_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
    extensions: Object["freeze"]({
      apimartSeedream: APIMART_SEEDREAM_4_5_POLICY,
    }),
  }),
  createModelApiExecutionManifest({
    id: APIMART_SEEDREAM_5_LITE_EXECUTION_ID,
    provider: "apimart",
    model: "doubao-seedream-5.0-lite",
    endpoint: "/v1/images/generations",
    bodyMapping: APIMART_SEEDREAM_BODY_MAPPING,
    responseMapping: APIMART_IMAGE_RESPONSE_MAPPING,
    taskPolling: APIMART_IMAGE_TASK_POLLING,
    extensions: Object["freeze"]({
      apimartSeedream: APIMART_SEEDREAM_5_LITE_POLICY,
    }),
  }),
]);

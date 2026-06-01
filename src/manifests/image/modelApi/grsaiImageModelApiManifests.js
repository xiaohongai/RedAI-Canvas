import {
  BATCH_SIZE_FIELD,
  GRSAI_GPT_IMAGE_2_IMAGE_SIZE_FIELD,
  GRSAI_GPT_IMAGE_2_MODE_FIELD,
  GRSAI_GPT_IMAGE_2_RATIO_FIELD,
  GRSAI_NANO_BANANA_2_RATIO_FIELD,
  GRSAI_NANO_BANANA_2_IMAGE_SIZE_FIELD,
  GRSAI_NANO_BANANA_4K_IMAGE_SIZE_FIELD,
  GRSAI_NANO_BANANA_IMAGE_SIZE_FIELD,
  GRSAI_NANO_BANANA_PRO_IMAGE_SIZE_FIELD,
  GRSAI_NANO_BANANA_RATIO_FIELD,
  MODE_CL_FIELD,
  MODE_NORMAL_CL_FIELD,
  MODE_NORMAL_FAST_FIELD,
  MODE_NORMAL_VT_CL_VIP_FIELD,
  MODE_VIP_FIELD,
  createImageModelApiManifest,
  createModelApiExecutionManifest,
  withDefaultValue,
} from "./sharedImageModelApiFields.js";
function freezeExtensionValue(v0) {
  if (Array["isArray"](v0)) return Object["freeze"]([...v0]);
  if (v0 && typeof v0 === "object")
    return Object["freeze"](
      Object["fromEntries"](
        Object["entries"](v0)["map"](([v1, v2]) => [
          v1,
          freezeExtensionValue(v2),
        ]),
      ),
    );
  return v0;
}
function createImageModelExtensions({
  imageMenu: v3,
  imageSizePolicy: v4,
  gptImage2: v5,
  nanoBanana: v6,
} = {}) {
  const v7 = {};
  if (v3) v7["imageMenu"] = freezeExtensionValue(v3);
  v4 && (v7["imageSizePolicy"] = freezeExtensionValue(v4));
  if (v5) v7["gptImage2"] = freezeExtensionValue(v5);
  if (v6) v7["nanoBanana"] = freezeExtensionValue(v6);
  return Object["freeze"](v7);
}
function createImageMenuExtension(v8) {
  return createImageModelExtensions({ imageMenu: v8 });
}
const GRSAI_IMAGE_BODY_MAPPING = Object["freeze"]([]),
  GRSAI_IMAGE_RESPONSE_MAPPING = Object["freeze"]({
    taskIdPath: Object["freeze"]([
      "task_id",
      "taskId",
      "data.task_id",
      "data.taskId",
      "id",
    ]),
    statusPath: "status",
    errorPath: "error",
    resultPaths: Object["freeze"]([
      "data.result.images[].url",
      "result.images[].url",
      "data[].url",
      "data[].image",
      "results[].url",
      "results[].imageUrl",
      "url",
    ]),
  }),
  GRSAI_IMAGE_TASK_POLLING = Object["freeze"]({
    method: "GET",
    mode: "task-proxy",
    urlTemplate: "{baseUrl}/v1/api/result?id={taskId}",
    headersMode: "bearer",
  }),
  GRSAI_IMAGE_BODY_RESOLVER = Object["freeze"]({ bodyResolver: "grsaiImage" }),
  GRSAI_GPT_IMAGE_2_BODY_RESOLVER = Object["freeze"]({
    bodyResolver: "grsaiGptImage2Image",
  }),
  GRSAI_GPT_IMAGE_2_NORMAL_PIXEL_SIZES_BY_RATIO = Object["freeze"]({
    "1:1": Object["freeze"]({ "1K": "1024x1024" }),
    "16:9": Object["freeze"]({ "1K": "1672x941" }),
    "9:16": Object["freeze"]({ "1K": "941x1672" }),
    "4:3": Object["freeze"]({ "1K": "1443x1090" }),
    "3:4": Object["freeze"]({ "1K": "1090x1443" }),
    "3:2": Object["freeze"]({ "1K": "1536x1024" }),
    "2:3": Object["freeze"]({ "1K": "1024x1536" }),
    "5:4": Object["freeze"]({ "1K": "1408x1120" }),
    "4:5": Object["freeze"]({ "1K": "1120x1408" }),
    "21:9": Object["freeze"]({ "1K": "1920x832" }),
    "9:21": Object["freeze"]({ "1K": "832x1920" }),
    "1:2": Object["freeze"]({ "1K": "896x1792" }),
    "2:1": Object["freeze"]({ "1K": "1792x896" }),
  }),
  GRSAI_GPT_IMAGE_2_VIP_PIXEL_SIZES_BY_RATIO = Object["freeze"]({
    "1:1": Object["freeze"]({
      "1K": "1024x1024",
      "2K": "2048x2048",
      "4K": "2880x2880",
    }),
    "16:9": Object["freeze"]({
      "1K": "1280x720",
      "2K": "2048x1152",
      "4K": "3840x2160",
    }),
    "9:16": Object["freeze"]({
      "1K": "720x1280",
      "2K": "1152x2048",
      "4K": "2160x3840",
    }),
    "4:3": Object["freeze"]({
      "1K": "1152x864",
      "2K": "2304x1728",
      "4K": "3264x2448",
    }),
    "3:4": Object["freeze"]({
      "1K": "864x1152",
      "2K": "1728x2304",
      "4K": "2448x3264",
    }),
    "3:2": Object["freeze"]({
      "1K": "1536x1024",
      "2K": "2048x1360",
      "4K": "3504x2336",
    }),
    "2:3": Object["freeze"]({
      "1K": "1024x1536",
      "2K": "1360x2048",
      "4K": "2336x3504",
    }),
    "5:4": Object["freeze"]({
      "1K": "1120x896",
      "2K": "2240x1792",
      "4K": "3200x2560",
    }),
    "4:5": Object["freeze"]({
      "1K": "896x1120",
      "2K": "1792x2240",
      "4K": "2560x3200",
    }),
    "21:9": Object["freeze"]({
      "1K": "1456x624",
      "2K": "2912x1248",
      "4K": "3840x1648",
    }),
    "9:21": Object["freeze"]({
      "1K": "624x1456",
      "2K": "1248x2912",
      "4K": "1648x3840",
    }),
    "1:3": Object["freeze"]({ "2K": "688x2048", "4K": "1280x3840" }),
    "3:1": Object["freeze"]({ "2K": "2048x688", "4K": "3840x1280" }),
    "2:1": Object["freeze"]({
      "1K": "1536x768",
      "2K": "3072x1536",
      "4K": "3840x1920",
    }),
    "1:2": Object["freeze"]({
      "1K": "768x1536",
      "2K": "1536x3072",
      "4K": "1920x3840",
    }),
  });
function getRatioLabelsForImageSize(v9, v10) {
  return Object["freeze"](
    Object["entries"](v9)
      ["filter"](([, v11]) =>
        Object["prototype"]["hasOwnProperty"]["call"](v11 || {}, v10),
      )
      ["map"](([v12]) => v12),
  );
}
const GRSAI_GPT_IMAGE_2_1K_RATIO_LABELS = getRatioLabelsForImageSize(
    GRSAI_GPT_IMAGE_2_NORMAL_PIXEL_SIZES_BY_RATIO,
    "1K",
  ),
  GRSAI_GPT_IMAGE_2_2K_RATIO_LABELS = getRatioLabelsForImageSize(
    GRSAI_GPT_IMAGE_2_VIP_PIXEL_SIZES_BY_RATIO,
    "2K",
  ),
  GRSAI_GPT_IMAGE_2_4K_RATIO_LABELS = getRatioLabelsForImageSize(
    GRSAI_GPT_IMAGE_2_VIP_PIXEL_SIZES_BY_RATIO,
    "4K",
  ),
  GRSAI_GPT_IMAGE_2_RATIO_POLICY = Object["freeze"]({
    capability: "aspectRatio",
    ratiosByImageSize: Object["freeze"]({
      "1K": GRSAI_GPT_IMAGE_2_1K_RATIO_LABELS,
      "2K": GRSAI_GPT_IMAGE_2_2K_RATIO_LABELS,
      "4K": GRSAI_GPT_IMAGE_2_4K_RATIO_LABELS,
    }),
  }),
  GRSAI_GPT_IMAGE_2_IMAGE_SIZE_POLICY = Object["freeze"]({
    omitRequestParam: true,
    defaultLabelSize: "1K",
  }),
  GRSAI_GPT_IMAGE_2_NORMAL_EXTENSION = Object["freeze"]({
    defaultSize: "1K",
    allowedSizes: Object["freeze"](["1K"]),
    pixelSizesByRatio: GRSAI_GPT_IMAGE_2_NORMAL_PIXEL_SIZES_BY_RATIO,
  }),
  GRSAI_GPT_IMAGE_2_VIP_EXTENSION = Object["freeze"]({
    defaultSize: "2K",
    allowedSizes: Object["freeze"](["1K", "2K", "4K"]),
    pixelSizesByRatio: GRSAI_GPT_IMAGE_2_VIP_PIXEL_SIZES_BY_RATIO,
  }),
  GRSAI_NANO_BANANA_SELECTOR_4K_IMAGE_SIZE_POLICY = Object["freeze"]({
    allow4KSelection: true,
  }),
  GRSAI_NANO_BANANA_FIXED_4K_IMAGE_SIZE_POLICY = Object["freeze"]({
    fixedSize: "4K",
  }),
  GPT_IMAGE_2_PROMPT = Object["freeze"]({
    placeholder:
      "例：马斯克在抖音直播的截图 人气爆棚 很多网友送礼物 ，比例9比16",
  });
export const grsaiImageModelApiModelManifests = Object["freeze"]([
  createImageModelApiManifest({
    modelId: "nano-banana",
    executionId: "grsai.model-api.nano-banana.v1",
    provider: "grsai",
    displayName: "nano-banana",
    icon: "images/grsai.png",
    description: "GRSAI image model API",
    fields: [
      MODE_NORMAL_FAST_FIELD,
      GRSAI_NANO_BANANA_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageMenuExtension({
      group: "grsaiModel",
      role: "family",
      family: "nanobanana",
      order: 10,
      title: "Nanobanana",
      subtitle: "基础模型",
    }),
    nanoBanana: Object["freeze"]({ family: "nanobanana", mode: "normal" }),
  }),
  createImageModelApiManifest({
    modelId: "nano-banana-fast",
    executionId: "grsai.model-api.nano-banana.v1",
    provider: "grsai",
    displayName: "nano-banana",
    icon: "images/grsai.png",
    description: "GRSAI\x20image\x20model\x20API",
    fields: [
      withDefaultValue(MODE_NORMAL_FAST_FIELD, "fast"),
      GRSAI_NANO_BANANA_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    nanoBanana: Object["freeze"]({ family: "nanobanana", mode: "fast" }),
  }),
  createImageModelApiManifest({
    modelId: "nano-banana-2",
    executionId: "grsai.model-api.nano-banana-2.v1",
    provider: "grsai",
    displayName: "nano-banana-2",
    icon: "images/grsai.png",
    description: "GRSAI image model API",
    fields: [
      MODE_NORMAL_CL_FIELD,
      GRSAI_NANO_BANANA_2_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageModelExtensions({
      imageMenu: {
        group: "grsaiModel",
        role: "family",
        family: "nanobanana-2",
        order: 30,
        title: "Nanobanana2",
        subtitle: "第二代模型",
      },
      imageSizePolicy: GRSAI_NANO_BANANA_SELECTOR_4K_IMAGE_SIZE_POLICY,
      nanoBanana: { family: "nanobanana-2", mode: "normal" },
    }),
  }),
  createImageModelApiManifest({
    modelId: "nano-banana-2-cl",
    executionId: "grsai.model-api.nano-banana-2.v1",
    provider: "grsai",
    displayName: "nano-banana-2",
    icon: "images/grsai.png",
    description: "GRSAI image model API",
    fields: [
      MODE_CL_FIELD,
      GRSAI_NANO_BANANA_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    nanoBanana: Object["freeze"]({ family: "nanobanana-2", mode: "cl" }),
  }),
  createImageModelApiManifest({
    modelId: "nano-banana-2-4k-cl",
    executionId: "grsai.model-api.nano-banana-2.v1",
    provider: "grsai",
    displayName: "nano-banana-2",
    icon: "images/grsai.png",
    description: "GRSAI image model API",
    fields: [
      MODE_CL_FIELD,
      GRSAI_NANO_BANANA_4K_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageModelExtensions({
      imageSizePolicy: GRSAI_NANO_BANANA_FIXED_4K_IMAGE_SIZE_POLICY,
      nanoBanana: { family: "nanobanana-2", mode: "cl" },
    }),
  }),
  createImageModelApiManifest({
    modelId: "nano-banana-pro",
    executionId: "grsai.model-api.nano-banana-pro.v1",
    provider: "grsai",
    displayName: "nano-banana-pro",
    icon: "images/grsai.png",
    description: "GRSAI image model API",
    fields: [
      MODE_NORMAL_VT_CL_VIP_FIELD,
      GRSAI_NANO_BANANA_PRO_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageModelExtensions({
      imageMenu: {
        group: "grsaiModel",
        role: "family",
        family: "nanobanana-pro",
        order: 20,
        title: "NanobananaPRO",
        subtitle: "专业增强模型",
      },
      imageSizePolicy: GRSAI_NANO_BANANA_SELECTOR_4K_IMAGE_SIZE_POLICY,
      nanoBanana: { family: "nanobanana-pro", mode: "normal" },
    }),
  }),
  createImageModelApiManifest({
    modelId: "nano-banana-pro-vt",
    executionId: "grsai.model-api.nano-banana-pro.v1",
    provider: "grsai",
    displayName: "nano-banana-pro",
    icon: "images/grsai.png",
    description: "GRSAI image model API",
    fields: [
      withDefaultValue(MODE_NORMAL_VT_CL_VIP_FIELD, "vt"),
      GRSAI_NANO_BANANA_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    nanoBanana: Object["freeze"]({ family: "nanobanana-pro", mode: "vt" }),
  }),
  createImageModelApiManifest({
    modelId: "nano-banana-pro-cl",
    executionId: "grsai.model-api.nano-banana-pro.v1",
    provider: "grsai",
    displayName: "nano-banana-pro",
    icon: "images/grsai.png",
    description: "GRSAI image model API",
    fields: [
      withDefaultValue(MODE_NORMAL_VT_CL_VIP_FIELD, "cl"),
      GRSAI_NANO_BANANA_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    nanoBanana: Object["freeze"]({ family: "nanobanana-pro", mode: "cl" }),
  }),
  createImageModelApiManifest({
    modelId: "nano-banana-pro-vip",
    executionId: "grsai.model-api.nano-banana-pro.v1",
    provider: "grsai",
    displayName: "nano-banana-pro",
    icon: "images/grsai.png",
    description: "GRSAI\x20image\x20model\x20API",
    fields: [
      MODE_VIP_FIELD,
      GRSAI_NANO_BANANA_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    nanoBanana: Object["freeze"]({ family: "nanobanana-pro", mode: "vip" }),
  }),
  createImageModelApiManifest({
    modelId: "nano-banana-pro-4k-vip",
    executionId: "grsai.model-api.nano-banana-pro.v1",
    provider: "grsai",
    displayName: "nano-banana-pro",
    icon: "images/grsai.png",
    description: "GRSAI\x20image\x20model\x20API",
    fields: [
      MODE_VIP_FIELD,
      GRSAI_NANO_BANANA_4K_IMAGE_SIZE_FIELD,
      GRSAI_NANO_BANANA_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    extensions: createImageModelExtensions({
      imageSizePolicy: GRSAI_NANO_BANANA_FIXED_4K_IMAGE_SIZE_POLICY,
      nanoBanana: { family: "nanobanana-pro", mode: "vip" },
    }),
  }),
  createImageModelApiManifest({
    modelId: "gpt-image-2",
    executionId: "grsai.model-api.gpt-image-2.v1",
    provider: "grsai",
    displayName: "GPT image 2",
    icon: "images/grsai.png",
    description: "GRSAI image model API",
    prompt: GPT_IMAGE_2_PROMPT,
    fields: [
      GRSAI_GPT_IMAGE_2_MODE_FIELD,
      withDefaultValue(GRSAI_GPT_IMAGE_2_IMAGE_SIZE_FIELD, "1K"),
      GRSAI_GPT_IMAGE_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    ratioPolicy: GRSAI_GPT_IMAGE_2_RATIO_POLICY,
    extensions: createImageModelExtensions({
      imageMenu: {
        group: "grsaiModel",
        role: "directModel",
        order: 0,
        title: "GPT image 2",
        subtitle: "OpenAI 图像生成模型",
      },
      imageSizePolicy: GRSAI_GPT_IMAGE_2_IMAGE_SIZE_POLICY,
      gptImage2: GRSAI_GPT_IMAGE_2_NORMAL_EXTENSION,
      nanoBanana: { family: "gpt-image-2", mode: "normal" },
    }),
  }),
  createImageModelApiManifest({
    modelId: "gpt-image-2-vip",
    executionId: "grsai.model-api.gpt-image-2.v1",
    provider: "grsai",
    displayName: "GPT image 2",
    icon: "images/grsai.png",
    description: "GRSAI image model API",
    prompt: GPT_IMAGE_2_PROMPT,
    fields: [
      withDefaultValue(GRSAI_GPT_IMAGE_2_MODE_FIELD, "vip"),
      withDefaultValue(GRSAI_GPT_IMAGE_2_IMAGE_SIZE_FIELD, "2K"),
      GRSAI_GPT_IMAGE_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
    ratioPolicy: GRSAI_GPT_IMAGE_2_RATIO_POLICY,
    extensions: createImageModelExtensions({
      imageSizePolicy: GRSAI_GPT_IMAGE_2_IMAGE_SIZE_POLICY,
      gptImage2: GRSAI_GPT_IMAGE_2_VIP_EXTENSION,
      nanoBanana: { family: "gpt-image-2", mode: "vip" },
    }),
  }),
]);
export const grsaiImageModelApiExecutionManifests = Object["freeze"]([
  createModelApiExecutionManifest({
    id: "grsai.model-api.nano-banana.v1",
    provider: "grsai",
    model: "nano-banana",
    endpoint: "/v1/api/generate",
    bodyMapping: GRSAI_IMAGE_BODY_MAPPING,
    responseMapping: GRSAI_IMAGE_RESPONSE_MAPPING,
    taskPolling: GRSAI_IMAGE_TASK_POLLING,
    extensions: GRSAI_IMAGE_BODY_RESOLVER,
    modeModels: Object["freeze"]({
      normal: "nano-banana",
      fast: "nano-banana-fast",
    }),
  }),
  createModelApiExecutionManifest({
    id: "grsai.model-api.nano-banana-2.v1",
    provider: "grsai",
    model: "nano-banana-2",
    endpoint: "/v1/api/generate",
    bodyMapping: GRSAI_IMAGE_BODY_MAPPING,
    responseMapping: GRSAI_IMAGE_RESPONSE_MAPPING,
    taskPolling: GRSAI_IMAGE_TASK_POLLING,
    extensions: GRSAI_IMAGE_BODY_RESOLVER,
    modeModels: Object["freeze"]({
      normal: "nano-banana-2",
      cl: Object["freeze"]({
        byImageSize: Object["freeze"]({ "4K": "nano-banana-2-4k-cl" }),
        default: "nano-banana-2-cl",
      }),
    }),
  }),
  createModelApiExecutionManifest({
    id: "grsai.model-api.nano-banana-pro.v1",
    provider: "grsai",
    model: "nano-banana-pro",
    endpoint: "/v1/api/generate",
    bodyMapping: GRSAI_IMAGE_BODY_MAPPING,
    responseMapping: GRSAI_IMAGE_RESPONSE_MAPPING,
    taskPolling: GRSAI_IMAGE_TASK_POLLING,
    extensions: GRSAI_IMAGE_BODY_RESOLVER,
    modeModels: Object["freeze"]({
      normal: "nano-banana-pro",
      vt: "nano-banana-pro-vt",
      cl: "nano-banana-pro-cl",
      vip: Object["freeze"]({
        byImageSize: Object["freeze"]({ "4K": "nano-banana-pro-4k-vip" }),
        default: "nano-banana-pro-vip",
      }),
    }),
  }),
  createModelApiExecutionManifest({
    id: "grsai.model-api.gpt-image-2.v1",
    provider: "grsai",
    model: "gpt-image-2",
    endpoint: "/v1/api/generate",
    bodyMapping: GRSAI_IMAGE_BODY_MAPPING,
    responseMapping: GRSAI_IMAGE_RESPONSE_MAPPING,
    taskPolling: GRSAI_IMAGE_TASK_POLLING,
    extensions: GRSAI_GPT_IMAGE_2_BODY_RESOLVER,
    modeModels: Object["freeze"]({
      normal: "gpt-image-2",
      vip: "gpt-image-2-vip",
    }),
    imageSizeModels: Object["freeze"]({
      "1K": "gpt-image-2",
      "2K": "gpt-image-2-vip",
      "4K": "gpt-image-2-vip",
      default: "gpt-image-2",
    }),
  }),
]);

import {
  ASPECT_RATIO_FIELD,
  BATCH_SIZE_FIELD,
  GPT_IMAGE_2_RATIO_FIELD,
  IMAGE_SIZE_FIELD,
  NANO_BANANA_2_RATIO_FIELD,
  RUNNINGHUB_GPT_IMAGE_2_OFFICIAL_IMAGE_SIZE_FIELD,
  RUNNINGHUB_MODEL_ROUTE_FIELD,
  createImageModelApiManifest,
  createModelApiExecutionManifest,
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
  nanoBanana: v5,
} = {}) {
  const v6 = {};
  if (v3) v6["imageMenu"] = freezeExtensionValue(v3);
  v4 && (v6["imageSizePolicy"] = freezeExtensionValue(v4));
  if (v5) v6["nanoBanana"] = freezeExtensionValue(v5);
  return Object["freeze"](v6);
}
function createImageMenuExtension(v7) {
  return createImageModelExtensions({ imageMenu: v7 });
}
const RUNNINGHUB_DIMENSIONS_RATIO_POLICY = Object["freeze"]({
    capability: "dimensions",
  }),
  RUNNINGHUB_GPT_IMAGE_2_4K_RATIO_LABELS = Object["freeze"]([
    "16:9",
    "9:16",
    "2:1",
    "1:2",
    "21:9",
    "9:21",
  ]),
  RUNNINGHUB_GPT_IMAGE_2_OFFICIAL_RATIO_POLICY = Object["freeze"]({
    capability: "aspectRatio",
    ratiosByImageSize: Object["freeze"]({
      "4K": RUNNINGHUB_GPT_IMAGE_2_4K_RATIO_LABELS,
    }),
    fallbackStrategyByImageSize: Object["freeze"]({ "4K": "directional" }),
  }),
  RUNNINGHUB_GPT_IMAGE_2_IMAGE_SIZE_POLICY = Object["freeze"]({
    defaultSize: "2K",
    allowedSizes: Object["freeze"](["1K", "2K", "4K"]),
  }),
  RUNNINGHUB_GPT_IMAGE_2_OFFICIAL_IMAGE_SIZE_POLICY = Object["freeze"]({
    officialVariant: true,
    defaultSize: "2K",
    allowedSizes: Object["freeze"](["1K", "2K", "4K"]),
  }),
  GPT_IMAGE_2_PROMPT = Object["freeze"]({
    placeholder:
      "例：马斯克在抖音直播的截图 人气爆棚 很多网友送礼物 ，比例9比16",
  }),
  RUNNINGHUB_IMAGE_BODY_MAPPING = Object["freeze"]([]),
  RUNNINGHUB_IMAGE_RESPONSE_MAPPING = Object["freeze"]({
    taskIdPath: "taskId",
    statusPath: "status",
    errorPath: "errorMessage",
    resultPaths: Object["freeze"]([
      "results[].url",
      "results[].imageUrl",
      "results[].videoUrl",
      "url",
    ]),
  }),
  RUNNINGHUB_IMAGE_RESOLVERS = Object["freeze"]({
    bodyResolver: "runninghubImage",
    endpointResolver: "runninghubImageEndpoint",
  }),
  YOUCHUAN_ASPECT_RATIO_FIELD = Object["freeze"]({
    id: "aspectRatio",
    type: "segmented",
    placement: "resolution",
    label: "Ratio",
    defaultValue: "自适应",
    options: Object["freeze"]([
      Object["freeze"]({ value: "自适应", label: "Auto" }),
      Object["freeze"]({ value: "1:1", label: "1:1" }),
      Object["freeze"]({ value: "4:3", label: "4:3" }),
      Object["freeze"]({ value: "3:2", label: "3:2" }),
      Object["freeze"]({ value: "16:9", label: "16:9" }),
      Object["freeze"]({ value: "3:4", label: "3:4" }),
      Object["freeze"]({ value: "2:3", label: "2:3" }),
      Object["freeze"]({ value: "9:16", label: "9:16" }),
    ]),
  });
function createYouchuanSegmentedField({
  id: v8,
  label: v9,
  defaultValue: v10,
  description: v11,
  options: v12,
  placement: placement = "advanced",
  variant: variant = "advancedRow",
  showInfoTip: showInfoTip = false,
}) {
  return Object["freeze"]({
    id: v8,
    type: "segmented",
    placement: placement,
    ...(variant ? { variant: variant } : {}),
    label: v9,
    defaultValue: v10,
    ...(v11 ? { description: v11 } : {}),
    ...(showInfoTip ? { showInfoTip: true } : {}),
    options: Object["freeze"](
      v12["map"]((v13) =>
        Object["freeze"]({ value: v13["value"], label: v13["label"] }),
      ),
    ),
  });
}
function createYouchuanNumberField({
  id: v14,
  label: v15,
  defaultValue: v16,
  min: v17,
  max: v18,
  step: step = v18 === 1000 ? 50 : v18 === 100 ? 5 : 1,
  description: v19,
}) {
  return Object["freeze"]({
    id: v14,
    type: "slider",
    placement: "advanced",
    variant: "rhV54BreastJiggle",
    label: v15,
    defaultValue: v16,
    min: v17,
    max: v18,
    step: step,
    ...(v19 ? { description: v19 } : {}),
  });
}
function createYouchuanToggleField({
  id: v20,
  label: v21,
  defaultValue: defaultValue = false,
  description: v22,
}) {
  return Object["freeze"]({
    id: v20,
    type: "segmented",
    placement: "advanced",
    variant: "rhV54BooleanRow",
    label: v21,
    defaultValue: defaultValue,
    ...(v22 ? { description: v22 } : {}),
    options: Object["freeze"]([
      Object["freeze"]({ value: true, label: "是" }),
      Object["freeze"]({ value: false, label: "否" }),
    ]),
  });
}
const YOUCHUAN_CHAOS_FIELD = createYouchuanNumberField({
    id: "chaos",
    label: "混乱度",
    defaultValue: 0,
    min: 0,
    max: 100,
    description:
      "控制同一提示词下的变化幅度。低值更稳定、更贴近提示词；高值会让构图、元素和风格差异更大，适合探索灵感。",
  }),
  YOUCHUAN_STYLIZE_FIELD = createYouchuanNumberField({
    id: "stylize",
    label: "风格化",
    defaultValue: 0,
    min: 0,
    max: 1000,
    description:
      "控制\x20Midjourney\x20自带审美和艺术化介入强度。低值更按提示词执行；高值画面更有风格和美感，但可能偏离细节。",
  }),
  YOUCHUAN_RAW_FIELD = createYouchuanToggleField({
    id: "raw",
    label: "Raw 模式",
    defaultValue: false,
    description:
      "减少 Midjourney 默认美化，让提示词本身更主导。适合写实、产品图、文字或需要精准控制风格的画面。",
  }),
  YOUCHUAN_IW_FIELD = createYouchuanNumberField({
    id: "iw",
    label: "主图权重",
    defaultValue: 1,
    min: 0,
    max: 3,
    description:
      "有主输入图时生效。控制主图对内容、构图和颜色的影响；值越高越参考原图，值越低文字提示越主导。",
  }),
  YOUCHUAN_SW_FIELD = createYouchuanNumberField({
    id: "sw",
    label: "风格权重",
    defaultValue: 100,
    min: 0,
    max: 1000,
    description:
      "有风格参考图时生效。控制参考图的色彩、材质、光影和整体氛围影响；值越高越贴近参考风格。",
  }),
  YOUCHUAN_V81_QUALITY_FIELD = createYouchuanSegmentedField({
    id: "quality",
    label: "质量",
    placement: "resolution",
    variant: null,
    defaultValue: "1",
    showInfoTip: true,
    description:
      "质量控制生成时投入的计算时间，不会提高图片尺寸或分辨率。数值越高，模型会花更多时间打磨纹理、边缘和局部细节，通常更细腻但更慢、更耗额度；数值越低更快、更省，画面可能更简洁。",
    options: [
      { value: "1", label: "1" },
      { value: "4", label: "4" },
    ],
  }),
  YOUCHUAN_V7_QUALITY_FIELD = createYouchuanSegmentedField({
    id: "quality",
    label: "质量",
    placement: "resolution",
    variant: null,
    defaultValue: "1",
    showInfoTip: true,
    description:
      "质量控制生成时投入的计算时间，不会提高图片尺寸或分辨率。数值越高，模型会花更多时间打磨纹理、边缘和局部细节，通常更细腻但更慢、更耗额度；数值越低更快、更省，画面可能更简洁。",
    options: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "4", label: "4" },
    ],
  }),
  YOUCHUAN_V81_HD_FIELD = createYouchuanToggleField({
    id: "hd",
    label: "原生 2K",
    defaultValue: false,
    description:
      "开启后生成原生 2K 结果，画面尺寸更大、细节更多，但生成成本更高。",
  }),
  YOUCHUAN_V6_QUALITY_FIELD = createYouchuanSegmentedField({
    id: "quality",
    label: "质量",
    placement: "resolution",
    variant: null,
    defaultValue: "1",
    showInfoTip: true,
    description:
      "质量控制生成时投入的计算时间，不会提高图片尺寸或分辨率。数值越高，模型会花更多时间打磨纹理、边缘和局部细节，通常更细腻但更慢、更耗额度；数值越低更快、更省，画面可能更简洁。",
    options: [
      { value: "0.5", label: "0.5" },
      { value: "1", label: "1" },
      { value: "2", label: "2" },
    ],
  }),
  YOUCHUAN_WEIRD_FIELD = createYouchuanNumberField({
    id: "weird",
    label: "怪异度",
    defaultValue: 0,
    min: 0,
    max: 3000,
    description:
      "加入更反常、古怪或实验性的审美选择。0\x20最稳定；数值越高越容易出现意料之外的造型、组合和气质。",
  }),
  YOUCHUAN_CW_FIELD = createYouchuanNumberField({
    id: "cw",
    label: "角色权重",
    defaultValue: 100,
    min: 0,
    max: 100,
    description:
      "有角色参考图时生效。控制参考角色的脸、发型、服装等细节保留程度；100 尽量保留完整角色，0 更偏向只保留脸部特征。",
  }),
  YOUCHUAN_OW_FIELD = createYouchuanNumberField({
    id: "ow",
    label: "Omni 权重",
    defaultValue: 100,
    min: 0,
    max: 1000,
    description:
      "V7 参考权重。控制 Omni/参考图对主体外观和形态的影响；值越高参考越强，值越低越让提示词自由发挥。",
  }),
  YOUCHUAN_V6_SV_FIELD = createYouchuanNumberField({
    id: "sv",
    label: "风格版本",
    defaultValue: 4,
    min: 1,
    max: 4,
    description:
      "选择风格参考算法版本。不同版本会用不同方式理解风格图，影响色彩、质感和氛围的迁移效果。",
  }),
  YOUCHUAN_STOP_FIELD = createYouchuanNumberField({
    id: "stop",
    label: "提前停止",
    defaultValue: 100,
    min: 10,
    max: 100,
    description:
      "控制生成过程在多少百分比时结束。100 表示完整生成；降低后画面会更柔和、更少细节，适合尝试草图感或朦胧效果。",
  }),
  YOUCHUAN_TILE_FIELD = createYouchuanToggleField({
    id: "tile",
    label: "平铺图案",
    defaultValue: false,
    description:
      "生成边缘可无缝衔接的重复图案，适合布料、壁纸、纹理和包装底纹。开启后更关注可平铺结构。",
  }),
  YOUCHUAN_V81_BODY_PARAM_TYPES = Object["freeze"]({
    chaos: "integer",
    quality: "string",
    stylize: "integer",
    raw: "boolean",
    imageUrl: "string",
    iw: "integer",
    sref: "string",
    sw: "integer",
    hd: "boolean",
  }),
  YOUCHUAN_V7_BODY_PARAM_TYPES = Object["freeze"]({
    chaos: "integer",
    quality: "string",
    stylize: "integer",
    weird: "integer",
    raw: "boolean",
    imageUrl: "string",
    iw: "integer",
    sref: "string",
    sw: "integer",
    sv: "integer",
    ow: "integer",
    tile: "boolean",
  }),
  YOUCHUAN_V6_BODY_PARAM_TYPES = Object["freeze"]({
    chaos: "integer",
    quality: "string",
    stylize: "integer",
    weird: "integer",
    raw: "boolean",
    imageUrl: "string",
    iw: "integer",
    sref: "string",
    sw: "integer",
    cref: "string",
    cw: "integer",
    sv: "integer",
    stop: "integer",
    tile: "boolean",
  }),
  YOUCHUAN_COMMON_RUNNINGHUB_IMAGE = Object["freeze"]({
    textEndpoint: "text-to-image",
    inputEndpoint: "text-to-image",
    omitResolution: true,
    conditionalParams: Object["freeze"]({
      iw: "imageUrl",
      sw: "sref",
      cw: "cref",
    }),
  }),
  YOUCHUAN_V81_INPUT_SLOTS = Object["freeze"]({
    allowedKinds: Object["freeze"](["text", "image"]),
    minByKind: Object["freeze"]({ image: 0 }),
    maxByKind: Object["freeze"]({ image: 2, video: 0, audio: 0 }),
    fixedSlots: Object["freeze"]([
      Object["freeze"]({
        id: "imageUrl",
        kind: "image",
        label: "主输入图",
        required: false,
        description: "可选，作为 imageUrl 传给 Midjourney V8.1。",
      }),
      Object["freeze"]({
        id: "sref",
        kind: "image",
        label: "风格参考图",
        required: false,
        description:
          "可选，作为 sref 传给 Midjourney V8.1，强度由高级设置 sw 控制。",
      }),
    ]),
  }),
  YOUCHUAN_V7_INPUT_SLOTS = Object["freeze"]({
    allowedKinds: Object["freeze"](["text", "image"]),
    minByKind: Object["freeze"]({ image: 0 }),
    maxByKind: Object["freeze"]({ image: 2, video: 0, audio: 0 }),
    fixedSlots: Object["freeze"]([
      Object["freeze"]({
        id: "imageUrl",
        kind: "image",
        label: "主输入图",
        required: false,
        description: "可选，作为 imageUrl 传给 Midjourney V7。",
      }),
      Object["freeze"]({
        id: "sref",
        kind: "image",
        label: "风格参考图",
        required: false,
        description:
          "可选，作为 sref 传给 Midjourney V7，强度由高级设置 sw 控制。",
      }),
    ]),
  }),
  YOUCHUAN_V6_INPUT_SLOTS = Object["freeze"]({
    allowedKinds: Object["freeze"](["text", "image"]),
    minByKind: Object["freeze"]({ image: 0 }),
    maxByKind: Object["freeze"]({ image: 3, video: 0, audio: 0 }),
    fixedSlots: Object["freeze"]([
      Object["freeze"]({
        id: "imageUrl",
        kind: "image",
        label: "主输入图",
        required: false,
        description: "可选，作为 imageUrl 传给 Midjourney V6。",
      }),
      Object["freeze"]({
        id: "cref",
        kind: "image",
        label: "角色参考图",
        required: false,
        description:
          "可选，作为 cref 传给 Midjourney V6，强度由高级设置 cw 控制。",
      }),
      Object["freeze"]({
        id: "sref",
        kind: "image",
        label: "风格参考图",
        required: false,
        description:
          "可选，作为 sref 传给 Midjourney V6，强度由高级设置 sw 控制。",
      }),
    ]),
  });
function createRunningHubImageExecutionExtensions(v23) {
  return Object["freeze"]({
    ...RUNNINGHUB_IMAGE_RESOLVERS,
    ...(v23["runningHubImage"]
      ? { runningHubImage: freezeExtensionValue(v23["runningHubImage"]) }
      : {}),
  });
}
const RUNNINGHUB_MODEL_API_MANIFESTS = Object["freeze"]([
  Object["freeze"]({
    modelId: "runninghub-model/youchuan-v81",
    executionId: "runninghub.model-api.youchuan-v81.v1",
    model: "youchuan",
    displayName: "Midjourney V8.1",
    icon: "images/RH.png",
    inputSlots: YOUCHUAN_V81_INPUT_SLOTS,
    extensions: createImageMenuExtension({
      group: "runninghubModel",
      role: "directModel",
      order: 50,
      title: "Midjourney V8.1",
      subtitle: "RunningHub Midjourney 文生图 V8.1，支持主图和风格参考图",
      alt: "midjourney-v81",
    }),
    runningHubImage: Object["freeze"]({
      ...YOUCHUAN_COMMON_RUNNINGHUB_IMAGE,
      textEndpoint: "text-to-image-v81",
      inputEndpoint: "text-to-image-v81",
      bodyParamTypes: YOUCHUAN_V81_BODY_PARAM_TYPES,
      conditionalParams: Object["freeze"]({}),
      defaultParams: Object["freeze"]({
        chaos: 0,
        quality: "1",
        stylize: 0,
        raw: false,
        iw: 1,
        sw: 100,
        hd: false,
      }),
      inputSlotBodyFields: Object["freeze"]({
        imageUrl: "imageUrl",
        sref: "sref",
      }),
      constantParams: Object["freeze"]({ sv: 6 }),
    }),
    fields: [
      YOUCHUAN_ASPECT_RATIO_FIELD,
      YOUCHUAN_V81_QUALITY_FIELD,
      YOUCHUAN_CHAOS_FIELD,
      YOUCHUAN_STYLIZE_FIELD,
      YOUCHUAN_RAW_FIELD,
      YOUCHUAN_IW_FIELD,
      YOUCHUAN_SW_FIELD,
      YOUCHUAN_V81_HD_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/youchuan-v7",
    executionId: "runninghub.model-api.youchuan-v7.v1",
    model: "youchuan",
    displayName: "Midjourney\x20V7",
    icon: "images/RH.png",
    inputSlots: YOUCHUAN_V7_INPUT_SLOTS,
    extensions: createImageMenuExtension({
      group: "runninghubModel",
      role: "directModel",
      order: 51,
      title: "Midjourney V7",
      subtitle: "RunningHub Midjourney 文生图 V7，支持主图和风格参考图",
      alt: "midjourney-v7",
    }),
    runningHubImage: Object["freeze"]({
      ...YOUCHUAN_COMMON_RUNNINGHUB_IMAGE,
      textEndpoint: "text-to-image-v7",
      inputEndpoint: "text-to-image-v7",
      bodyParamTypes: YOUCHUAN_V7_BODY_PARAM_TYPES,
      defaultParams: Object["freeze"]({
        chaos: 0,
        quality: "1",
        stylize: 0,
        weird: 0,
        raw: false,
        iw: 1,
        sw: 100,
        sv: 4,
        ow: 100,
        tile: false,
      }),
      inputSlotBodyFields: Object["freeze"]({
        imageUrl: "imageUrl",
        sref: "sref",
      }),
    }),
    fields: [
      YOUCHUAN_ASPECT_RATIO_FIELD,
      YOUCHUAN_V7_QUALITY_FIELD,
      YOUCHUAN_CHAOS_FIELD,
      YOUCHUAN_STYLIZE_FIELD,
      YOUCHUAN_WEIRD_FIELD,
      YOUCHUAN_RAW_FIELD,
      YOUCHUAN_IW_FIELD,
      YOUCHUAN_SW_FIELD,
      YOUCHUAN_V6_SV_FIELD,
      YOUCHUAN_OW_FIELD,
      YOUCHUAN_TILE_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/youchuan-v6",
    executionId: "runninghub.model-api.youchuan-v6.v1",
    model: "youchuan",
    displayName: "Midjourney V6",
    icon: "images/RH.png",
    inputSlots: YOUCHUAN_V6_INPUT_SLOTS,
    extensions: createImageMenuExtension({
      group: "runninghubModel",
      role: "directModel",
      order: 52,
      title: "Midjourney V6",
      subtitle:
        "RunningHub Midjourney 文生图 V6，支持主图、角色参考图和风格参考图",
      alt: "midjourney-v6",
    }),
    runningHubImage: Object["freeze"]({
      ...YOUCHUAN_COMMON_RUNNINGHUB_IMAGE,
      textEndpoint: "text-to-image-v6",
      inputEndpoint: "text-to-image-v6",
      bodyParamTypes: YOUCHUAN_V6_BODY_PARAM_TYPES,
      defaultParams: Object["freeze"]({
        chaos: 0,
        quality: "1",
        stylize: 0,
        weird: 0,
        raw: false,
        iw: 1,
        cw: 100,
        sw: 100,
        sv: 4,
        stop: 100,
        tile: false,
      }),
      inputSlotBodyFields: Object["freeze"]({
        imageUrl: "imageUrl",
        cref: "cref",
        sref: "sref",
      }),
    }),
    fields: [
      YOUCHUAN_ASPECT_RATIO_FIELD,
      YOUCHUAN_V6_QUALITY_FIELD,
      YOUCHUAN_CHAOS_FIELD,
      YOUCHUAN_STYLIZE_FIELD,
      YOUCHUAN_WEIRD_FIELD,
      YOUCHUAN_RAW_FIELD,
      YOUCHUAN_IW_FIELD,
      YOUCHUAN_CW_FIELD,
      YOUCHUAN_SW_FIELD,
      YOUCHUAN_V6_SV_FIELD,
      YOUCHUAN_STOP_FIELD,
      YOUCHUAN_TILE_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/seedream-v4",
    executionId: "runninghub.model-api.seedream-v4.v1",
    displayName: "Seedream V4",
    icon: "images/RH.png",
    ratioPolicy: RUNNINGHUB_DIMENSIONS_RATIO_POLICY,
    runningHubImage: Object["freeze"]({ aspectRatioMode: "dimensions" }),
    fields: [IMAGE_SIZE_FIELD, ASPECT_RATIO_FIELD, BATCH_SIZE_FIELD],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/seedream-v4.5",
    executionId: "runninghub.model-api.seedream-v4-5.v1",
    displayName: "Seedream V4.5",
    icon: "images/RH.png",
    ratioPolicy: RUNNINGHUB_DIMENSIONS_RATIO_POLICY,
    runningHubImage: Object["freeze"]({ aspectRatioMode: "dimensions" }),
    fields: [IMAGE_SIZE_FIELD, ASPECT_RATIO_FIELD, BATCH_SIZE_FIELD],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/seedream-v5-lite",
    executionId: "runninghub.model-api.seedream-v5-lite.v1",
    displayName: "Seedream V5 Lite",
    icon: "images/RH.png",
    ratioPolicy: RUNNINGHUB_DIMENSIONS_RATIO_POLICY,
    runningHubImage: Object["freeze"]({ aspectRatioMode: "dimensions" }),
    fields: [IMAGE_SIZE_FIELD, ASPECT_RATIO_FIELD, BATCH_SIZE_FIELD],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/rhart-image-v1",
    executionId: "runninghub.model-api.rhart-image-v1.v1",
    displayName: "NanoBanana",
    icon: "images/gemini.svg",
    extensions: createImageMenuExtension({
      group: "runninghubModel",
      family: "nanobanana",
      order: 10,
      title: "NanoBanana",
      subtitle: "基础图像生成模型，版本可在模式中切换",
      alt: "nanobanana",
    }),
    nanoBanana: Object["freeze"]({ family: "nanobanana", mode: "normal" }),
    routeModels: Object["freeze"]({
      low: "rhart-image-v1",
      official: "rhart-image-v1-official",
    }),
    runningHubImage: Object["freeze"]({
      inputEndpoint: "edit",
      omitResolution: true,
    }),
    fields: [
      RUNNINGHUB_MODEL_ROUTE_FIELD,
      IMAGE_SIZE_FIELD,
      ASPECT_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/rhart-image-v1-official",
    executionId: "runninghub.model-api.rhart-image-v1-official.v1",
    displayName: "NanoBanana\x20Official",
    icon: "images/gemini.svg",
    nanoBanana: Object["freeze"]({ family: "nanobanana", mode: "official" }),
    routeModels: Object["freeze"]({
      low: "rhart-image-v1",
      official: "rhart-image-v1-official",
    }),
    runningHubImage: Object["freeze"]({
      inputEndpoint: "edit",
      omitResolution: true,
    }),
    fields: [
      { ...RUNNINGHUB_MODEL_ROUTE_FIELD, defaultValue: "official" },
      IMAGE_SIZE_FIELD,
      ASPECT_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/rhart-image-n-pro",
    executionId: "runninghub.model-api.rhart-image-n-pro.v1",
    displayName: "BananaPRO",
    icon: "images/gemini.svg",
    extensions: createImageMenuExtension({
      group: "runninghubModel",
      family: "nanobanana-pro",
      order: 20,
      title: "BananaPRO",
      subtitle: "专业级画质，版本可在模式中切换",
      alt: "bananapro",
    }),
    nanoBanana: Object["freeze"]({ family: "nanobanana-pro", mode: "normal" }),
    routeModels: Object["freeze"]({
      low: "rhart-image-n-pro",
      official: "rhart-image-n-pro-official",
    }),
    runningHubImage: Object["freeze"]({ inputEndpoint: "edit" }),
    fields: [
      RUNNINGHUB_MODEL_ROUTE_FIELD,
      IMAGE_SIZE_FIELD,
      ASPECT_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/rhart-image-n-pro-official",
    executionId: "runninghub.model-api.rhart-image-n-pro-official.v1",
    displayName: "BananaPRO Official",
    icon: "images/gemini.svg",
    nanoBanana: Object["freeze"]({
      family: "nanobanana-pro",
      mode: "official",
    }),
    routeModels: Object["freeze"]({
      low: "rhart-image-n-pro",
      official: "rhart-image-n-pro-official",
    }),
    runningHubImage: Object["freeze"]({ inputEndpoint: "edit" }),
    fields: [
      { ...RUNNINGHUB_MODEL_ROUTE_FIELD, defaultValue: "official" },
      IMAGE_SIZE_FIELD,
      ASPECT_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/rhart-image-n-g31-flash",
    executionId: "runninghub.model-api.rhart-image-n-g31-flash.v1",
    displayName: "Banana2",
    icon: "images/gemini.svg",
    extensions: createImageMenuExtension({
      group: "runninghubModel",
      family: "nanobanana-2",
      order: 30,
      title: "Banana2",
      subtitle: "新一代图像模型，版本可在模式中切换",
      alt: "banana2",
    }),
    nanoBanana: Object["freeze"]({ family: "nanobanana-2", mode: "normal" }),
    routeModels: Object["freeze"]({
      low: "rhart-image-n-g31-flash",
      official: "rhart-image-n-g31-flash-official",
    }),
    fields: [
      RUNNINGHUB_MODEL_ROUTE_FIELD,
      IMAGE_SIZE_FIELD,
      NANO_BANANA_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/rhart-image-n-g31-flash-official",
    executionId: "runninghub.model-api.rhart-image-n-g31-flash-official.v1",
    displayName: "Banana2\x20Official",
    icon: "images/gemini.svg",
    nanoBanana: Object["freeze"]({ family: "nanobanana-2", mode: "official" }),
    routeModels: Object["freeze"]({
      low: "rhart-image-n-g31-flash",
      official: "rhart-image-n-g31-flash-official",
    }),
    fields: [
      { ...RUNNINGHUB_MODEL_ROUTE_FIELD, defaultValue: "official" },
      IMAGE_SIZE_FIELD,
      NANO_BANANA_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/rhart-image-g-2",
    executionId: "runninghub.model-api.rhart-image-g-2.v1",
    displayName: "GPT image 2",
    icon: "images/RH.png",
    prompt: GPT_IMAGE_2_PROMPT,
    extensions: createImageModelExtensions({
      imageMenu: {
        group: "runninghubModel",
        family: "gpt-image-2",
        order: 40,
        title: "GPT image 2",
        subtitle: "OpenAI 图像生成模型，版本可在模式中切换",
        alt: "gpt-image-2",
      },
      imageSizePolicy: RUNNINGHUB_GPT_IMAGE_2_IMAGE_SIZE_POLICY,
      nanoBanana: { family: "gpt-image-2", mode: "normal" },
    }),
    routeModels: Object["freeze"]({
      low: "rhart-image-g-2",
      official: "rhart-image-g-2-official",
    }),
    fields: [
      RUNNINGHUB_MODEL_ROUTE_FIELD,
      RUNNINGHUB_GPT_IMAGE_2_OFFICIAL_IMAGE_SIZE_FIELD,
      GPT_IMAGE_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
  }),
  Object["freeze"]({
    modelId: "runninghub-model/rhart-image-g-2-official",
    executionId: "runninghub.model-api.rhart-image-g-2-official.v1",
    displayName: "GPT image 2 Official",
    icon: "images/RH.png",
    prompt: GPT_IMAGE_2_PROMPT,
    extensions: createImageModelExtensions({
      imageSizePolicy: RUNNINGHUB_GPT_IMAGE_2_OFFICIAL_IMAGE_SIZE_POLICY,
      nanoBanana: { family: "gpt-image-2", mode: "official" },
    }),
    routeModels: Object["freeze"]({
      low: "rhart-image-g-2",
      official: "rhart-image-g-2-official",
    }),
    ratioPolicy: RUNNINGHUB_GPT_IMAGE_2_OFFICIAL_RATIO_POLICY,
    runningHubImage: Object["freeze"]({ quality: "medium" }),
    fields: [
      { ...RUNNINGHUB_MODEL_ROUTE_FIELD, defaultValue: "official" },
      RUNNINGHUB_GPT_IMAGE_2_OFFICIAL_IMAGE_SIZE_FIELD,
      GPT_IMAGE_2_RATIO_FIELD,
      BATCH_SIZE_FIELD,
    ],
  }),
]);
export const runningHubImageModelApiModelManifests = Object["freeze"](
  RUNNINGHUB_MODEL_API_MANIFESTS["map"]((v24) =>
    createImageModelApiManifest({
      modelId: v24["modelId"],
      executionId: v24["executionId"],
      provider: "runninghub",
      displayName: v24["displayName"],
      icon: v24["icon"],
      description: "RunningHub\x20image\x20model\x20API",
      fields: v24["fields"],
      extensions: v24["extensions"],
      ratioPolicy: v24["ratioPolicy"],
      inputSlots: v24["inputSlots"],
      nanoBanana: v24["nanoBanana"],
      prompt: v24["prompt"],
    }),
  ),
);
export const runningHubImageModelApiExecutionManifests = Object["freeze"](
  RUNNINGHUB_MODEL_API_MANIFESTS["map"]((v25) =>
    createModelApiExecutionManifest({
      id: v25["executionId"],
      provider: "runninghub",
      model: v25["model"] || v25["modelId"]["replace"]("runninghub-model/", ""),
      endpoint: "/openapi/v2",
      endpointMode: "text-or-image",
      routeModels: v25["routeModels"],
      bodyMapping: RUNNINGHUB_IMAGE_BODY_MAPPING,
      responseMapping: RUNNINGHUB_IMAGE_RESPONSE_MAPPING,
      extensions: createRunningHubImageExecutionExtensions(v25),
    }),
  ),
);

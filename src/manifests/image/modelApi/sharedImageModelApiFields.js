export const IMAGE_SIZE_FIELD = Object["freeze"]({
  id: "imageSize",
  type: "segmented",
  placement: "resolution",
  label: "Quality",
  defaultValue: "2K",
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({ value: "3K", label: "3K" }),
    Object["freeze"]({ value: "4K", label: "4K" }),
  ]),
});
export const APIMART_SEEDREAM_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({ value: "3K", label: "3K" }),
  ]),
});
export const APIMART_SEEDREAM_4_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({ value: "4K", label: "4K" }),
  ]),
});
export const APIMART_SEEDREAM_4_5_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({ value: "4K", label: "4K" }),
  ]),
});
export const APIMART_SEEDREAM_5_LITE_IMAGE_SIZE_FIELD =
  APIMART_SEEDREAM_IMAGE_SIZE_FIELD;
export const GPT_IMAGE_2_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({ value: "4K", label: "4K" }),
  ]),
});
export const APIMART_NANO_BANANA_2_MODE_FIELD = Object["freeze"]({
  id: "mode",
  type: "segmented",
  placement: "mode",
  label: "Mode",
  defaultValue: "standard",
  options: Object["freeze"]([
    Object["freeze"]({
      value: "standard",
      label: "标准版",
      selectedLabel: "标准版",
    }),
    Object["freeze"]({
      value: "official",
      label: "官方版",
      selectedLabel: "官方版",
    }),
  ]),
});
export const APIMART_NANO_BANANA_2_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({ value: "4K", label: "4K" }),
  ]),
});
export const APIMART_NANO_BANANA_PRO_MODE_FIELD =
  APIMART_NANO_BANANA_2_MODE_FIELD;
export const APIMART_NANO_BANANA_PRO_IMAGE_SIZE_FIELD =
  APIMART_NANO_BANANA_2_IMAGE_SIZE_FIELD;
export const APIMART_NANO_BANANA_MODE_FIELD = APIMART_NANO_BANANA_2_MODE_FIELD;
export const APIMART_NANO_BANANA_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  defaultValue: "1K",
  options: Object["freeze"]([Object["freeze"]({ value: "1K", label: "1K" })]),
});
export const APIMART_GPT_IMAGE_2_MODE_FIELD = APIMART_NANO_BANANA_2_MODE_FIELD;
export const APIMART_GPT_IMAGE_2_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...GPT_IMAGE_2_IMAGE_SIZE_FIELD,
  defaultValue: "1K",
});
export const APIMART_QWEN_IMAGE_MODE_FIELD = Object["freeze"]({
  id: "mode",
  type: "segmented",
  placement: "mode",
  label: "Mode",
  defaultValue: "standard",
  options: Object["freeze"]([
    Object["freeze"]({
      value: "standard",
      label: "标准版",
      selectedLabel: "标准版",
    }),
    Object["freeze"]({ value: "pro", label: "Pro版", selectedLabel: "Pro版" }),
  ]),
});
export const APIMART_QWEN_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  defaultValue: "1K",
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
  ]),
});
export const APIMART_QWEN_IMAGE_RATIO_FIELD = Object["freeze"]({
  id: "aspectRatio",
  type: "segmented",
  placement: "resolution",
  label: "Ratio",
  defaultValue: "自适应",
  options: Object["freeze"]([
    Object["freeze"]({
      value: "自适应",
      label: "Auto",
      selectedLabel: "自适应",
    }),
    Object["freeze"]({ value: "1:1", label: "1:1" }),
    Object["freeze"]({ value: "4:3", label: "4:3" }),
    Object["freeze"]({ value: "3:4", label: "3:4" }),
    Object["freeze"]({ value: "16:9", label: "16:9" }),
    Object["freeze"]({ value: "9:16", label: "9:16" }),
    Object["freeze"]({ value: "3:2", label: "3:2" }),
    Object["freeze"]({ value: "2:3", label: "2:3" }),
  ]),
});
export const APIMART_Z_IMAGE_TURBO_IMAGE_SIZE_FIELD =
  APIMART_QWEN_IMAGE_SIZE_FIELD;
export const APIMART_Z_IMAGE_TURBO_RATIO_FIELD = APIMART_QWEN_IMAGE_RATIO_FIELD;
export const APIMART_Z_IMAGE_TURBO_PROMPT_EXTEND_FIELD = Object["freeze"]({
  id: "prompt_extend",
  type: "toggle",
  placement: "advanced",
  label: "智能改写提示词",
  description: "开启后，AI 会自动优化提示词，生成效果更好，费用会有所增加。",
  defaultValue: false,
});
export const APIMART_WAN_IMAGE_MODE_FIELD = Object["freeze"]({
  id: "mode",
  type: "segmented",
  placement: "mode",
  label: "Mode",
  defaultValue: "standard",
  options: Object["freeze"]([
    Object["freeze"]({
      value: "standard",
      label: "标准版",
      selectedLabel: "标准版",
    }),
    Object["freeze"]({
      value: "pro",
      label: "专业版",
      selectedLabel: "专业版",
    }),
  ]),
});
const APIMART_WAN_4K_DISABLE = Object["freeze"]({
  any: Object["freeze"]([
    Object["freeze"]({ field: "mode", values: Object["freeze"](["standard"]) }),
    Object["freeze"]({
      field: "hasInputImages",
      values: Object["freeze"]([true]),
    }),
  ]),
});
export const APIMART_WAN_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  defaultValue: "2K",
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({
      value: "4K",
      label: "4K",
      disableWhen: APIMART_WAN_4K_DISABLE,
      tooltip: "4K only supports pro text-to-image",
    }),
  ]),
});
export const APIMART_WAN_IMAGE_RATIO_FIELD = APIMART_QWEN_IMAGE_RATIO_FIELD;
export const APIMART_WAN_THINKING_MODE_FIELD = Object["freeze"]({
  id: "thinking_mode",
  type: "toggle",
  placement: "advanced",
  label: "思考模式",
  description: "开启后模型增强推理能力，提升画面质量，但耗时增加。",
  defaultValue: true,
});
const APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE = Object["freeze"]({
    field: "imageSize",
    values: Object["freeze"](["4K"]),
  }),
  APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP =
    "4K\x20only\x20supports\x2016:9\x20/\x209:16\x20/\x202:1\x20/\x201:2\x20/\x2021:9\x20/\x209:21";
export const APIMART_GPT_IMAGE_2_RATIO_FIELD = Object["freeze"]({
  id: "aspectRatio",
  type: "segmented",
  placement: "resolution",
  label: "Ratio",
  defaultValue: "自适应",
  options: Object["freeze"]([
    Object["freeze"]({ value: "自适应", label: "Auto" }),
    Object["freeze"]({
      value: "1:1",
      label: "1:1",
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object["freeze"]({
      value: "3:2",
      label: "3:2",
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object["freeze"]({
      value: "2:3",
      label: "2:3",
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object["freeze"]({
      value: "4:3",
      label: "4:3",
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object["freeze"]({
      value: "3:4",
      label: "3:4",
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object["freeze"]({
      value: "5:4",
      label: "5:4",
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object["freeze"]({
      value: "4:5",
      label: "4:5",
      disableWhen: APIMART_GPT_IMAGE_2_4K_RATIO_DISABLE,
      tooltip: APIMART_GPT_IMAGE_2_4K_RATIO_TOOLTIP,
    }),
    Object["freeze"]({ value: "16:9", label: "16:9" }),
    Object["freeze"]({ value: "9:16", label: "9:16" }),
    Object["freeze"]({ value: "2:1", label: "2:1" }),
    Object["freeze"]({ value: "1:2", label: "1:2" }),
    Object["freeze"]({ value: "21:9", label: "21:9" }),
    Object["freeze"]({ value: "9:21", label: "9:21" }),
  ]),
});
export const APIMART_NANO_BANANA_2_GOOGLE_SEARCH_FIELD = Object["freeze"]({
  id: "google_search",
  type: "toggle",
  placement: "advanced",
  label: "Google 文字搜索",
  description: "启用\x20Google\x20文字搜索增强，适合需要真实信息的场景。",
  defaultValue: false,
});
export const APIMART_NANO_BANANA_2_GOOGLE_IMAGE_SEARCH_FIELD = Object["freeze"](
  {
    id: "google_image_search",
    type: "toggle",
    placement: "advanced",
    label: "Google 图片搜索",
    description:
      "启用\x20Google\x20图片搜索增强，需要同时开启\x20Google\x20文字搜索。",
    defaultValue: false,
  },
);
export const GRSAI_GPT_IMAGE_2_MODE_FIELD = Object["freeze"]({
  id: "mode",
  type: "segmented",
  placement: "mode",
  label: "Mode",
  defaultValue: "normal",
  options: Object["freeze"]([
    Object["freeze"]({ value: "normal", label: "常规", selectedLabel: "常规" }),
    Object["freeze"]({ value: "vip", label: "VIP", selectedLabel: "VIP" }),
  ]),
});
export const GRSAI_GPT_IMAGE_2_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...GPT_IMAGE_2_IMAGE_SIZE_FIELD,
  defaultValue: "1K",
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({
      value: "2K",
      label: "2K",
      disableWhen: Object["freeze"]({ field: "mode", values: ["normal"] }),
      tooltip: "VIP",
    }),
    Object["freeze"]({
      value: "4K",
      label: "4K",
      disableWhen: Object["freeze"]({ field: "mode", values: ["normal"] }),
      tooltip: "VIP",
    }),
  ]),
});
export const GRSAI_NANO_BANANA_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({
      value: "4K",
      label: "4K",
      disabled: true,
      tooltip: "1K/2K\x20only",
    }),
  ]),
});
export const GRSAI_NANO_BANANA_2_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({
      value: "4K",
      label: "4K",
      disableWhen: Object["freeze"]({ field: "mode", values: ["normal"] }),
      tooltip: "CL\x204K",
    }),
  ]),
});
export const GRSAI_NANO_BANANA_PRO_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({
      value: "4K",
      label: "4K",
      disableWhen: Object["freeze"]({
        field: "mode",
        values: ["normal", "vt", "cl"],
      }),
      tooltip: "VIP 4K",
    }),
  ]),
});
export const GRSAI_NANO_BANANA_4K_IMAGE_SIZE_FIELD = Object["freeze"]({
  ...IMAGE_SIZE_FIELD,
  defaultValue: "4K",
  options: Object["freeze"]([
    Object["freeze"]({
      value: "1K",
      label: "1K",
      disabled: true,
      tooltip: "4K only",
    }),
    Object["freeze"]({
      value: "2K",
      label: "2K",
      disabled: true,
      tooltip: "4K only",
    }),
    Object["freeze"]({ value: "4K", label: "4K" }),
  ]),
});
export const RUNNINGHUB_GPT_IMAGE_2_OFFICIAL_IMAGE_SIZE_FIELD = Object[
  "freeze"
]({
  ...IMAGE_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "1K", label: "1K" }),
    Object["freeze"]({ value: "2K", label: "2K" }),
    Object["freeze"]({ value: "4K", label: "4K" }),
  ]),
});
export const ASPECT_RATIO_FIELD = Object["freeze"]({
  id: "aspectRatio",
  type: "segmented",
  placement: "resolution",
  label: "Ratio",
  defaultValue: "自适应",
  options: Object["freeze"]([
    Object["freeze"]({ value: "自适应", label: "Auto" }),
    Object["freeze"]({ value: "1:1", label: "1:1" }),
    Object["freeze"]({ value: "9:16", label: "9:16" }),
    Object["freeze"]({ value: "16:9", label: "16:9" }),
    Object["freeze"]({ value: "3:4", label: "3:4" }),
    Object["freeze"]({ value: "4:3", label: "4:3" }),
    Object["freeze"]({ value: "3:2", label: "3:2" }),
    Object["freeze"]({ value: "2:3", label: "2:3" }),
    Object["freeze"]({ value: "5:4", label: "5:4" }),
    Object["freeze"]({ value: "4:5", label: "4:5" }),
    Object["freeze"]({ value: "21:9", label: "21:9" }),
  ]),
});
export const APIMART_SEEDREAM_RATIO_FIELD = Object["freeze"]({
  ...ASPECT_RATIO_FIELD,
  defaultValue: "auto",
  options: Object["freeze"]([
    Object["freeze"]({ value: "1:1", label: "1:1" }),
    Object["freeze"]({ value: "4:3", label: "4:3" }),
    Object["freeze"]({ value: "3:4", label: "3:4" }),
    Object["freeze"]({ value: "16:9", label: "16:9" }),
    Object["freeze"]({ value: "9:16", label: "9:16" }),
    Object["freeze"]({ value: "3:2", label: "3:2" }),
    Object["freeze"]({ value: "2:3", label: "2:3" }),
    Object["freeze"]({ value: "21:9", label: "21:9" }),
    Object["freeze"]({ value: "9:21", label: "9:21" }),
    Object["freeze"]({ value: "auto", label: "Auto", selectedLabel: "自适应" }),
  ]),
});
export const APIMART_SEEDREAM_5_LITE_RATIO_FIELD = Object["freeze"]({
  ...APIMART_SEEDREAM_RATIO_FIELD,
  options: Object["freeze"](
    APIMART_SEEDREAM_RATIO_FIELD["options"]["filter"](
      (v0) => String(v0?.["value"] ?? v0) !== "9:21",
    ),
  ),
});
export const NANO_BANANA_2_RATIO_FIELD = Object["freeze"]({
  ...ASPECT_RATIO_FIELD,
  options: Object["freeze"]([
    ...ASPECT_RATIO_FIELD["options"],
    Object["freeze"]({ value: "1:4", label: "1:4" }),
    Object["freeze"]({ value: "4:1", label: "4:1" }),
    Object["freeze"]({ value: "1:8", label: "1:8" }),
    Object["freeze"]({ value: "8:1", label: "8:1" }),
  ]),
});
export const GRSAI_NANO_BANANA_RATIO_FIELD = Object["freeze"]({
  ...ASPECT_RATIO_FIELD,
  defaultValue: "auto",
  options: Object["freeze"]([
    Object["freeze"]({ value: "auto", label: "Auto", selectedLabel: "自适应" }),
    Object["freeze"]({ value: "1:1", label: "1:1" }),
    Object["freeze"]({ value: "16:9", label: "16:9" }),
    Object["freeze"]({ value: "9:16", label: "9:16" }),
    Object["freeze"]({ value: "4:3", label: "4:3" }),
    Object["freeze"]({ value: "3:4", label: "3:4" }),
    Object["freeze"]({ value: "3:2", label: "3:2" }),
    Object["freeze"]({ value: "2:3", label: "2:3" }),
    Object["freeze"]({ value: "5:4", label: "5:4" }),
    Object["freeze"]({ value: "4:5", label: "4:5" }),
    Object["freeze"]({ value: "21:9", label: "21:9" }),
  ]),
});
export const GRSAI_NANO_BANANA_2_RATIO_FIELD = Object["freeze"]({
  ...GRSAI_NANO_BANANA_RATIO_FIELD,
  options: Object["freeze"]([
    ...GRSAI_NANO_BANANA_RATIO_FIELD["options"],
    Object["freeze"]({ value: "1:4", label: "1:4" }),
    Object["freeze"]({ value: "4:1", label: "4:1" }),
    Object["freeze"]({ value: "1:8", label: "1:8" }),
    Object["freeze"]({ value: "8:1", label: "8:1" }),
  ]),
});
export const GPT_IMAGE_2_RATIO_FIELD = Object["freeze"]({
  ...ASPECT_RATIO_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "自适应", label: "Auto" }),
    Object["freeze"]({ value: "1:1", label: "1:1" }),
    Object["freeze"]({ value: "3:2", label: "3:2" }),
    Object["freeze"]({ value: "2:3", label: "2:3" }),
    Object["freeze"]({ value: "4:3", label: "4:3" }),
    Object["freeze"]({ value: "3:4", label: "3:4" }),
    Object["freeze"]({ value: "5:4", label: "5:4" }),
    Object["freeze"]({ value: "4:5", label: "4:5" }),
    Object["freeze"]({ value: "16:9", label: "16:9" }),
    Object["freeze"]({ value: "9:16", label: "9:16" }),
    Object["freeze"]({ value: "2:1", label: "2:1" }),
    Object["freeze"]({ value: "1:2", label: "1:2" }),
    Object["freeze"]({ value: "21:9", label: "21:9" }),
    Object["freeze"]({ value: "9:21", label: "9:21" }),
  ]),
});
export const GRSAI_GPT_IMAGE_2_RATIO_FIELD = Object["freeze"]({
  ...ASPECT_RATIO_FIELD,
  defaultValue: "auto",
  options: Object["freeze"]([
    Object["freeze"]({ value: "auto", label: "Auto", selectedLabel: "自适应" }),
    Object["freeze"]({ value: "1:1", label: "1:1" }),
    Object["freeze"]({ value: "16:9", label: "16:9" }),
    Object["freeze"]({ value: "9:16", label: "9:16" }),
    Object["freeze"]({ value: "4:3", label: "4:3" }),
    Object["freeze"]({ value: "3:4", label: "3:4" }),
    Object["freeze"]({ value: "3:2", label: "3:2" }),
    Object["freeze"]({ value: "2:3", label: "2:3" }),
    Object["freeze"]({ value: "5:4", label: "5:4" }),
    Object["freeze"]({ value: "4:5", label: "4:5" }),
    Object["freeze"]({ value: "21:9", label: "21:9" }),
    Object["freeze"]({ value: "9:21", label: "9:21" }),
    Object["freeze"]({ value: "1:3", label: "1:3" }),
    Object["freeze"]({ value: "3:1", label: "3:1" }),
    Object["freeze"]({ value: "2:1", label: "2:1" }),
    Object["freeze"]({ value: "1:2", label: "1:2" }),
  ]),
});
export const MODE_NORMAL_FIELD = Object["freeze"]({
  id: "mode",
  type: "segmented",
  placement: "mode",
  label: "Mode",
  defaultValue: "normal",
  options: Object["freeze"]([
    Object["freeze"]({ value: "normal", label: "常规" }),
  ]),
});
export const MODE_NORMAL_FAST_FIELD = Object["freeze"]({
  ...MODE_NORMAL_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "normal", label: "正常" }),
    Object["freeze"]({ value: "fast", label: "快速" }),
  ]),
});
export const MODE_NORMAL_CL_FIELD = Object["freeze"]({
  ...MODE_NORMAL_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "normal", label: "常规" }),
    Object["freeze"]({ value: "cl", label: "CL" }),
  ]),
});
export const MODE_CL_FIELD = Object["freeze"]({
  ...MODE_NORMAL_FIELD,
  defaultValue: "cl",
  options: Object["freeze"]([Object["freeze"]({ value: "cl", label: "CL" })]),
});
export const MODE_VIP_FIELD = Object["freeze"]({
  ...MODE_NORMAL_FIELD,
  defaultValue: "vip",
  options: Object["freeze"]([Object["freeze"]({ value: "vip", label: "VIP" })]),
});
export const MODE_NORMAL_VT_CL_VIP_FIELD = Object["freeze"]({
  ...MODE_NORMAL_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: "normal", label: "常规" }),
    Object["freeze"]({ value: "vt", label: "VT" }),
    Object["freeze"]({ value: "cl", label: "CL" }),
    Object["freeze"]({ value: "vip", label: "VIP" }),
  ]),
});
export const RUNNINGHUB_MODEL_ROUTE_FIELD = Object["freeze"]({
  id: "rhModelRoute",
  type: "segmented",
  placement: "mode",
  label: "Route",
  defaultValue: "low",
  options: Object["freeze"]([
    Object["freeze"]({
      value: "low",
      label: "低价版",
      selectedLabel: "低价版",
    }),
    Object["freeze"]({
      value: "official",
      label: "官方版",
      selectedLabel: "官方版",
    }),
  ]),
});
export const BATCH_SIZE_FIELD = Object["freeze"]({
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
});
export const APIMART_QWEN_IMAGE_BATCH_SIZE_FIELD = Object["freeze"]({
  ...BATCH_SIZE_FIELD,
  options: Object["freeze"]([
    Object["freeze"]({ value: 1, label: "1x", selectedLabel: "1x" }),
    Object["freeze"]({ value: 2, label: "2x", selectedLabel: "2x" }),
    Object["freeze"]({ value: 4, label: "4x", selectedLabel: "4x" }),
    Object["freeze"]({ value: 6, label: "6x", selectedLabel: "6x" }),
  ]),
});
export function withDefaultValue(v1, v2) {
  return Object["freeze"]({ ...v1, defaultValue: v2 });
}
function freezeFields(v3) {
  return Object["freeze"](v3["map"]((v4) => Object["freeze"](v4)));
}
const DEFAULT_IMAGE_MODEL_API_INPUT_SLOTS = Object["freeze"]({
    allowedKinds: Object["freeze"](["text", "image"]),
    minByKind: Object["freeze"]({ image: 0 }),
    maxByKind: Object["freeze"]({ image: 8, video: 0, audio: 0 }),
  }),
  DEFAULT_RATIO_POLICY_BY_PROVIDER = Object["freeze"]({
    apimart: Object["freeze"]({ capability: "size" }),
    grsai: Object["freeze"]({ capability: "aspectRatio" }),
    ppio: Object["freeze"]({ capability: "size" }),
    runninghub: Object["freeze"]({ capability: "aspectRatio" }),
    volcengine: Object["freeze"]({ capability: "dimensions" }),
  });
function normalizeProviderId(v5) {
  return String(v5 || "")
    ["trim"]()
    ["toLowerCase"]();
}
function freezeRatioPolicyValue(v6) {
  if (Array["isArray"](v6)) return Object["freeze"]([...v6]);
  if (v6 && typeof v6 === "object")
    return Object["freeze"](
      Object["fromEntries"](
        Object["entries"](v6)["map"](([v7, v8]) => [
          v7,
          freezeRatioPolicyValue(v8),
        ]),
      ),
    );
  return v6;
}
function freezeRatioPolicy(v9) {
  if (!v9 || typeof v9 !== "object") return null;
  return Object["freeze"](
    Object["fromEntries"](
      Object["entries"](v9)["map"](([v10, v11]) => [
        v10,
        freezeRatioPolicyValue(v11),
      ]),
    ),
  );
}
function mergeRatioPolicyExtension(v12, v13, v14) {
  const v15 = v12 && typeof v12 === "object" ? { ...v12 } : {},
    v16 =
      v14 ||
      v15["ratioPolicy"] ||
      DEFAULT_RATIO_POLICY_BY_PROVIDER[normalizeProviderId(v13)] ||
      null;
  if (v16) v15["ratioPolicy"] = freezeRatioPolicy(v16);
  return Object["keys"](v15)["length"] > 0 ? Object["freeze"](v15) : null;
}
function freezeInputSlots(v17 = DEFAULT_IMAGE_MODEL_API_INPUT_SLOTS) {
  const v18 = v17 || DEFAULT_IMAGE_MODEL_API_INPUT_SLOTS,
    v19 = Array["isArray"](v18["fixedSlots"])
      ? {
          fixedSlots: Object["freeze"](
            v18["fixedSlots"]["map"]((v20) =>
              Object["freeze"]({ ...(v20 || {}) }),
            ),
          ),
        }
      : {};
  return Object["freeze"]({
    allowedKinds: Object["freeze"]([...(v18["allowedKinds"] || [])]),
    minByKind: Object["freeze"]({ ...(v18["minByKind"] || {}) }),
    maxByKind: Object["freeze"]({ ...(v18["maxByKind"] || {}) }),
    ...v19,
  });
}
export function createImageModelApiManifest({
  modelId: v21,
  executionId: v22,
  provider: v23,
  displayName: v24,
  icon: v25,
  description: v26,
  fields: v27,
  extensions: v28,
  ratioPolicy: v29,
  inputSlots: v30,
  nanoBanana: v31,
  prompt: v32,
}) {
  const v33 = v31
      ? Object["freeze"]({
          ...(v28 || {}),
          nanoBanana: Object["freeze"]({ ...v31 }),
        })
      : v28,
    v34 = mergeRatioPolicyExtension(v33, v23, v29);
  return Object["freeze"]({
    schemaVersion: "1.0",
    modelId: v21,
    provider: v23,
    kind: "image",
    adapterType: "modelApi",
    executionId: v22,
    displayName: v24,
    icon: v25,
    description: v26,
    ...(v32 ? { prompt: Object["freeze"]({ ...v32 }) } : {}),
    ...(v34 ? { extensions: v34 } : {}),
    inputSlots: freezeInputSlots(v30),
    uiSchema: Object["freeze"]({ fields: freezeFields(v27) }),
    async: true,
    cancellable: false,
    outputType: "image",
  });
}
export function createModelApiExecutionManifest({
  id: v35,
  provider: v36,
  model: v37,
  endpoint: v38,
  endpointMode: v39,
  bodyMapping: v40,
  responseMapping: v41,
  extensions: v42,
  taskPolling: v43,
  modeModels: v44,
  imageSizeModels: v45,
  routeModels: v46,
}) {
  const v47 = Object["freeze"]([
      "data.result.images[].url",
      "result.images[].url",
      "results[].url",
      "results[].imageUrl",
      "url",
    ]),
    v48 = v43 && typeof v43 === "object" ? Object["freeze"]({ ...v43 }) : null,
    v49 =
      v42 || v48
        ? Object["freeze"]({
            ...(v42 || {}),
            ...(v48 ? { taskPolling: v48 } : {}),
          })
        : null;
  return Object["freeze"]({
    schemaVersion: "1.0",
    id: v35,
    provider: v36,
    kind: "image",
    adapterType: "modelApi",
    endpoint: v38,
    ...(v39 ? { endpointMode: v39 } : {}),
    method: "POST",
    model: v37,
    ...(v44 ? { modeModels: Object["freeze"](v44) } : {}),
    ...(v45 ? { imageSizeModels: Object["freeze"](v45) } : {}),
    ...(v46 ? { routeModels: Object["freeze"](v46) } : {}),
    ...(v49 ? { extensions: v49 } : {}),
    headers: Object["freeze"]({ "Content-Type": "application/json" }),
    bodyMapping: Object["freeze"](v40 || []),
    responseMapping: Object["freeze"]({
      taskIdPath: "taskId",
      statusPath: "status",
      errorPath: "error",
      ...(v41 || {}),
      resultPaths: Object["freeze"](v41?.["resultPaths"] || v47),
    }),
    result: Object["freeze"]({
      taskIdPath: "taskId",
      urlFields: Object["freeze"](["url", "imageUrl"]),
    }),
  });
}

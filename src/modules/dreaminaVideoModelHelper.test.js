import test from "node:test";
import strict from "node:assert/strict";
import {
  APIMART_DREAMINA_VIDEO_MODEL_OPTIONS,
  buildDreaminaVideoNodeNormalizationPatch,
  ensureDreaminaVideoModelForTask,
  getDreaminaStyleVideoAllowedModels,
  getDreaminaStyleVideoDurationRange,
  getDreaminaVideoDurationRange,
  getDreaminaVideoResolutionOptions,
  normalizeDreaminaVideoResolution,
  resolveDreaminaStyleVideoCounterpartModel,
  normalizeDreaminaStyleVideoModel,
  isDreaminaVideoModel,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaVideoModel,
  normalizeDreaminaVideoRouteMode,
  pickClosestDreaminaVideoAdaptiveRatio,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from "./dreaminaVideoModelHelper.js";
(test("dreamina\x20helper:\x20兼容旧模型与旧模式字段", () => {
  const v0 = buildDreaminaVideoNodeNormalizationPatch({
    provider: "dreamina",
    model: "dreamina/text2video",
    mode: "首尾帧",
    aspectRatio: "自适应",
  });
  (strict["equal"](v0["model"], "dreamina/seedance2.0fast"),
    strict["equal"](v0["dreaminaRouteMode"], "frames2video"));
}),
  test("dreamina helper: 兼容旧 seedance 模型值", () => {
    (strict["equal"](isDreaminaVideoModel("seedance-2.0-fast"), true),
      strict["equal"](
        normalizeDreaminaVideoModel("seedance-2.0-fast"),
        "dreamina/seedance2.0fast",
      ),
      strict["equal"](
        normalizeDreaminaVideoModel("seedance-2.0"),
        "dreamina/seedance2.0",
      ));
  }),
  test("dreamina helper: 兼容 image2video 下划线模型别名", () => {
    (strict["equal"](
      normalizeDreaminaVideoModel("dreamina/3.0_fast", "dreamina"),
      "dreamina/3.0fast",
    ),
      strict["equal"](
        normalizeDreaminaVideoModel("dreamina/3.0_pro", "dreamina"),
        "dreamina/3.0pro",
      ),
      strict["equal"](
        normalizeDreaminaVideoModel("dreamina/3.5_pro", "dreamina"),
        "dreamina/3.5pro",
      ));
  }),
  test("dreamina\x20helper:\x20显式模式下任务解析正确", () => {
    (strict["equal"](
      resolveDreaminaVideoTaskType({
        routeMode: normalizeDreaminaVideoRouteMode("multimodal2video"),
        imageCount: 0,
        videoCount: 0,
        audioCount: 0,
      }),
      "text2video",
    ),
      strict["equal"](
        resolveDreaminaVideoTaskType({
          routeMode: "frames2video",
          imageCount: 1,
          videoCount: 0,
          audioCount: 0,
        }),
        "image2video",
      ),
      strict["equal"](
        resolveDreaminaVideoTaskType({
          routeMode: "frames2video",
          imageCount: 2,
          videoCount: 0,
          audioCount: 0,
        }),
        "frames2video",
      ));
  }),
  test("dreamina helper: 模型与时长/分辨率矩阵正确", () => {
    const v1 = ensureDreaminaVideoModelForTask(
      "multimodal2video",
      "dreamina/3.5pro",
      "dreamina",
    );
    (strict["equal"](v1, "dreamina/seedance2.0fast"),
      strict["deepEqual"](
        getDreaminaVideoResolutionOptions(
          "image2video",
          "dreamina/3.0pro",
          "dreamina",
        ),
        ["1080p"],
      ),
      strict["deepEqual"](
        getDreaminaVideoResolutionOptions(
          "frames2video",
          "dreamina/3.5pro",
          "dreamina",
        ),
        ["720p", "1080p"],
      ),
      strict["deepEqual"](
        getDreaminaVideoResolutionOptions(
          "multimodal2video",
          "dreamina/seedance2.0_vip",
          "dreamina",
        ),
        ["720p", "1080p"],
      ),
      strict["equal"](
        normalizeDreaminaVideoResolution(
          "multimodal2video",
          "dreamina/seedance2.0_vip",
          "1080p",
          "dreamina",
        ),
        "1080p",
      ),
      strict["deepEqual"](
        getDreaminaVideoResolutionOptions(
          "multimodal2video",
          "dreamina/seedance2.0",
          "dreamina",
        ),
        ["720p"],
      ),
      strict["deepEqual"](
        getDreaminaVideoResolutionOptions(
          "multimodal2video",
          "dreamina/seedance2.0fast_vip",
          "dreamina",
        ),
        ["720p"],
      ),
      strict["deepEqual"](
        getDreaminaVideoDurationRange(
          "image2video",
          "dreamina/3.5pro",
          "dreamina",
        ),
        { min: 4, max: 12, step: 1 },
      ));
  }),
  test("dreamina helper: 首尾帧单图回退 image2video 时保留当前可用模型", () => {
    const v2 = resolveDreaminaVideoTaskType({
      routeMode: "frames2video",
      imageCount: 1,
      videoCount: 0,
      audioCount: 0,
    });
    (strict["equal"](v2, "image2video"),
      strict["equal"](
        ensureDreaminaVideoModelForTask(v2, "dreamina/3.0", "dreamina"),
        "dreamina/3.0",
      ),
      strict["equal"](
        ensureDreaminaVideoModelForTask(v2, "dreamina/3.5pro", "dreamina"),
        "dreamina/3.5pro",
      ),
      strict["equal"](
        ensureDreaminaVideoModelForTask(
          v2,
          "dreamina/seedance2.0fast",
          "dreamina",
        ),
        "dreamina/seedance2.0fast",
      ));
  }),
  test("dreamina helper: 路由禁用态和非法组合会给出明确结果", () => {
    (strict["equal"](
      isDreaminaVideoRouteModeEnabled("multiframe2video"),
      false,
    ),
      strict["equal"](
        validateDreaminaVideoRouteSelection({
          routeMode: "multimodal2video",
          taskType: "multimodal2video",
          imageCount: 0,
          videoCount: 0,
          audioCount: 1,
        }),
        "全能参考至少需要 1 张图片或 1 个视频，音频不能单独使用",
      ),
      strict["equal"](
        validateDreaminaVideoRouteSelection({
          routeMode: "frames2video",
          taskType: "frames2video",
          imageCount: 3,
          videoCount: 0,
          audioCount: 0,
        }),
        "首尾帧模式最多支持 2 张图片",
      ));
  }),
  test("dreamina helper: 自适应比例会贴近即梦支持比例", () => {
    (strict["equal"](
      pickClosestDreaminaVideoAdaptiveRatio(1920, 1080)?.["label"],
      "16:9",
    ),
      strict["equal"](
        pickClosestDreaminaVideoAdaptiveRatio(1080, 1920)?.["label"],
        "9:16",
      ),
      strict["equal"](
        pickClosestDreaminaVideoAdaptiveRatio(0, 0)?.["label"],
        "1:1",
      ));
  }),
  test("dreamina\x20helper:\x20节点归一化阶段保留自适应", () => {
    const v3 = buildDreaminaVideoNodeNormalizationPatch({
      provider: "dreamina",
      model: "dreamina/seedance2.0fast",
      dreaminaRouteMode: "multimodal2video",
      aspectRatio: "自适应",
    });
    strict["equal"](v3, null);
  }),
  test("dreamina\x20helper:\x20APIMart\x20Seedance\x20UI\x20名称和\x201.0/1.5\x20能力矩阵", () => {
    (strict["equal"](
      APIMART_DREAMINA_VIDEO_MODEL_OPTIONS["some"]((v4) =>
        v4["title"]["includes"]("Doubao"),
      ),
      false,
    ),
      strict["equal"](
        normalizeDreaminaStyleVideoModel("apimart/seedance-1.5-pro", "apimart"),
        "apimart/doubao-seedance-1-5-pro",
      ));
    const v5 = getDreaminaStyleVideoAllowedModels("frames2video", "apimart")[
      "map"
    ]((v6) => v6["model"]);
    (strict["equal"](
      v5["includes"]("apimart/doubao-seedance-1-0-pro-fast"),
      false,
    ),
      strict["equal"](
        v5["includes"]("apimart/doubao-seedance-1-0-pro-quality"),
        true,
      ),
      strict["deepEqual"](
        getDreaminaStyleVideoDurationRange(
          "text2video",
          "apimart/doubao-seedance-1-0-pro-fast",
          "apimart",
        ),
        { min: 2, max: 12, step: 1 },
      ),
      strict["deepEqual"](
        getDreaminaStyleVideoDurationRange(
          "text2video",
          "apimart/doubao-seedance-1-5-pro",
          "apimart",
        ),
        { min: 4, max: 12, step: 1 },
      ));
  }),
  test("dreamina helper: Seedance counterpart models come from manifest extensions", () => {
    (strict["equal"](
      resolveDreaminaStyleVideoCounterpartModel(
        "apimart/doubao-seedance-2.0-fast-face",
        "dreamina",
        { taskType: "multimodal2video" },
      ),
      "dreamina/seedance2.0fast",
    ),
      strict["equal"](
        resolveDreaminaStyleVideoCounterpartModel(
          "apimart/doubao-seedance-2.0",
          "dreamina",
          { taskType: "multimodal2video" },
        ),
        "dreamina/seedance2.0",
      ),
      strict["equal"](
        resolveDreaminaStyleVideoCounterpartModel(
          "dreamina/seedance2.0_vip",
          "apimart",
          { taskType: "multimodal2video" },
        ),
        "apimart/doubao-seedance-2.0",
      ));
  }));

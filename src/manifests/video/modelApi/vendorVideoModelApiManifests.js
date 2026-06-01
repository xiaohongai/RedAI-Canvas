const VIDEO_DURATION_FIELD = Object["freeze"]({
    id: "duration",
    type: "slider",
    placement: "mode",
    variant: "durationPill",
    label: "视频时长",
    defaultValue: 5,
    min: 4,
    max: 15,
    step: 1,
  }),
  VIDEO_RESOLUTION_FIELD = Object["freeze"]({
    id: "resolution",
    type: "segmented",
    placement: "resolution",
    label: "视频分辨率",
    defaultValue: "720P",
    options: Object["freeze"]([
      Object["freeze"]({ value: "720P", label: "720P" }),
      Object["freeze"]({ value: "1080P", label: "1080P" }),
    ]),
  }),
  APIMART_VIDEO_ADAPTIVE_RATIO_VALUE = "自适应",
  APIMART_VIDEO_ADAPTIVE_RATIO_OPTION = Object["freeze"]({
    value: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
    label: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
  }),
  VIDEO_RATIO_FIELD = Object["freeze"]({
    id: "aspectRatio",
    displayRole: "aspectRatio",
    type: "segmented",
    placement: "resolution",
    label: "比例",
    defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
    options: Object["freeze"]([
      APIMART_VIDEO_ADAPTIVE_RATIO_OPTION,
      Object["freeze"]({ value: "16:9", label: "16:9" }),
      Object["freeze"]({ value: "9:16", label: "9:16" }),
      Object["freeze"]({ value: "1:1", label: "1:1" }),
      Object["freeze"]({ value: "4:3", label: "4:3" }),
      Object["freeze"]({ value: "3:4", label: "3:4" }),
    ]),
  }),
  APIMART_VIDEO_FOOTER_PLACEMENT_ORDER = Object["freeze"]([
    "mode",
    "resolution",
  ]),
  VIDEO_MODE_FIELD = Object["freeze"]({
    id: "mode",
    type: "segmented",
    placement: "mode",
    variant: "pillMenu",
    label: "模式选择",
    defaultValue: "std",
    options: Object["freeze"]([
      Object["freeze"]({ value: "std", label: "标准" }),
      Object["freeze"]({ value: "pro", label: "专业" }),
    ]),
  }),
  VIDEO_AUDIO_FIELD = Object["freeze"]({
    id: "audio",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "生成音频",
    defaultValue: false,
  }),
  VIDEO_WATERMARK_FIELD = Object["freeze"]({
    id: "watermark",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "添加水印",
    defaultValue: false,
  }),
  VIDEO_WATERMARK_CN_FIELD = Object["freeze"]({
    ...VIDEO_WATERMARK_FIELD,
    label: "添加水印",
  }),
  VIDEO_SEED_FIELD = Object["freeze"]({
    id: "seed",
    type: "text",
    placement: "advanced",
    variant: "advancedRow",
    label: "随机种子",
    defaultValue: "image",
  }),
  VIDEO_NEGATIVE_PROMPT_FIELD = Object["freeze"]({
    id: "negative_prompt",
    type: "textarea",
    placement: "advanced",
    variant: "advancedRow",
    label: "负向提示词",
    defaultValue: "none",
  }),
  VIDEO_PROMPT_EXTEND_FIELD = Object["freeze"]({
    id: "prompt_extend",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "提示词扩写",
    defaultValue: true,
  }),
  VIDEO_PROMPT_OPTIMIZER_FIELD = Object["freeze"]({
    id: "prompt_optimizer",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "自动优化提示词",
    defaultValue: true,
  }),
  VIDEO_FAST_PRETREATMENT_FIELD = Object["freeze"]({
    id: "fast_pretreatment",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "快速预处理",
    defaultValue: false,
  }),
  VIDEO_ENABLE_GIF_FIELD = Object["freeze"]({
    id: "enable_gif",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "启用 GIF 输出格式",
    defaultValue: false,
  }),
  VIDEO_AUDIO_SETTING_FIELD = Object["freeze"]({
    id: "audio_setting",
    type: "segmented",
    placement: "advanced",
    variant: "advancedRow",
    label: "音频设置",
    defaultValue: "auto",
    options: Object["freeze"]([
      Object["freeze"]({ value: "auto", label: "自动生成" }),
      Object["freeze"]({ value: "origin", label: "保留原音" }),
    ]),
  }),
  VIDEO_SHOT_TYPE_FIELD = Object["freeze"]({
    id: "shot_type",
    type: "segmented",
    placement: "advanced",
    variant: "advancedRow",
    label: "镜头类型",
    defaultValue: "single",
    options: Object["freeze"]([
      Object["freeze"]({ value: "single", label: "单镜头" }),
      Object["freeze"]({ value: "multi", label: "多镜头" }),
    ]),
  }),
  KLING_V3_AUDIO_FIELD = Object["freeze"]({
    ...VIDEO_AUDIO_FIELD,
    label: "生成有声视频",
  }),
  KLING_V3_NEGATIVE_PROMPT_FIELD = Object["freeze"]({
    ...VIDEO_NEGATIVE_PROMPT_FIELD,
    defaultValue: "模糊,\x20低画质,\x20变形",
    defaultValueAliases: Object["freeze"](["none"]),
  }),
  KLING_V3_MODE_FIELD = Object["freeze"]({
    id: "resolution",
    type: "segmented",
    placement: "resolution",
    variant: "sectionMenu",
    label: "视频分辨率",
    defaultValue: "std",
    options: Object["freeze"]([
      Object["freeze"]({ value: "std", label: "720P" }),
      Object["freeze"]({ value: "pro", label: "1080P" }),
      Object["freeze"]({ value: "4k", label: "4K" }),
    ]),
  }),
  KLING_O1_QUALITY_FIELD = Object["freeze"]({
    ...KLING_V3_MODE_FIELD,
    options: Object["freeze"]([
      Object["freeze"]({ value: "std", label: "720P" }),
      Object["freeze"]({ value: "pro", label: "1080P" }),
    ]),
  }),
  KLING_O1_KEEP_ORIGINAL_SOUND_FIELD = Object["freeze"]({
    id: "keep_original_sound",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "保留原声",
    description: "仅接入编辑视频或特征参考视频时生效。",
    defaultValue: false,
  }),
  KLING_V3_MULTI_SHOT_PLACEHOLDER_FIELD = Object["freeze"]({
    id: "multi_shot",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "多镜头分镜模式",
    description: "暂未开放，后续接入分镜参数后启用。",
    defaultValue: false,
    disabled: true,
  }),
  VEO3_MODEL_FIELD = Object["freeze"]({
    id: "mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模型选择",
    description:
      "veo3.1-fast\x20-\x20快速生成模型，适用于快速预览和迭代\x0aveo3.1-quality\x20-\x20高质量生成模型，适用于最终制作",
    defaultValue: "fast",
    options: Object["freeze"]([
      Object["freeze"]({ value: "fast", label: "fast" }),
      Object["freeze"]({ value: "quality", label: "quality" }),
    ]),
  }),
  VEO3_GENERATION_TYPE_FIELD = Object["freeze"]({
    id: "generation_type",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模式选择",
    description:
      "首尾帧：使用首帧/尾帧素材生成视频。\n参考图：使用参考图素材生成视频。\nveo3.1-quality 模型不支持参考图模式。",
    defaultValue: "frame",
    options: Object["freeze"]([
      Object["freeze"]({ value: "frame", label: "首尾帧" }),
      Object["freeze"]({
        value: "reference",
        label: "参考图",
        disableWhen: { field: "mode", value: "quality" },
      }),
    ]),
  }),
  VEO3_FRAME_HELP_TOOLTIP = [
    "VEO3 首尾帧模式",
    "[[red:不放图]]：就是文生视频，只按提示词生成。",
    "[[red:放 1 张图]]：就是普通图生视频，把这张图当作视频起点。",
    "[[red:放 2 张图]]：第一张是开头，第二张是结尾，VEO3 补中间变化。",
    "提示词例子：女孩从照片里的姿势慢慢转身看向镜头，阳光穿过窗帘，头发轻轻飘动，电影感，慢动作。",
  ]["join"]("\x0a"),
  VEO3_REFERENCE_HELP_TOOLTIP = [
    "VEO3 参考图模式",
    "[[red:不放参考图]]：就是文生视频，只按提示词生成。",
    "[[red:放 1-3 张参考图]]：参考人物、主体、风格或场景，不会固定成开头和结尾。",
    "重点写清 [[red:想生成什么动作和镜头]]；quality 档不支持参考图。",
    "提示词例子：参考图中的机器人在未来街道上奔跑，镜头低角度跟拍，背景灯牌快速掠过，速度感强。",
  ]["join"]("\x0a"),
  VEO3_FRAME_PROMPT_PLACEHOLDER =
    "描述首帧到尾帧的变化。例如：首帧中的女孩慢慢转身看向镜头，尾帧定格在微笑特写，阳光穿过窗帘，电影感，慢动作。",
  VEO3_REFERENCE_PROMPT_PLACEHOLDER =
    "描述参考图主体的动作和镜头。例如：参考图中的机器人在未来街道上奔跑，低角度跟拍，背景灯牌快速掠过，速度感强。",
  VEO3_FIXED_DURATION_FIELD = Object["freeze"]({
    id: "duration",
    type: "segmented",
    placement: "mode",
    variant: "pillMenu",
    label: "视频时长",
    defaultValue: 8,
    readOnly: true,
    options: Object["freeze"]([Object["freeze"]({ value: 8, label: "8s" })]),
  }),
  VEO3_ENABLE_GIF_FIELD = Object["freeze"]({
    ...VIDEO_ENABLE_GIF_FIELD,
    label: "启用 GIF 输出格式",
  }),
  RUNNINGHUB_VEO3_CHANNEL_FIELD = Object["freeze"]({
    id: "rh_veo3_channel",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "渠道版本",
    description: "官方稳定版更稳；低价渠道版成本更低但可能不稳定。",
    defaultValue: "lowCost",
    options: Object["freeze"]([
      Object["freeze"]({ value: "lowCost", label: "低价版" }),
      Object["freeze"]({ value: "official", label: "官方版" }),
    ]),
  }),
  RUNNINGHUB_VEO3_MODEL_FIELD = Object["freeze"]({
    id: "mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模型选择",
    defaultValue: "fast",
    options: Object["freeze"]([
      Object["freeze"]({ value: "fast", label: "Fast 版" }),
      Object["freeze"]({ value: "pro", label: "Pro\x20版" }),
      Object["freeze"]({
        value: "lite",
        label: "Lite 版",
        disableWhen: Object["freeze"]({
          field: "rh_veo3_channel",
          value: "lowCost",
        }),
      }),
    ]),
  }),
  RUNNINGHUB_VEO3_GENERATION_TYPE_FIELD = Object["freeze"]({
    id: "generation_type",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模式选择",
    description:
      "首尾帧：支持文生、图生、首尾帧。\n参考图：官方 Fast / Pro 支持 1-3 张参考图。\n视频续写：官方 Fast / Pro 支持 1 个原视频。",
    defaultValue: "frame",
    options: Object["freeze"]([
      Object["freeze"]({ value: "frame", label: "首尾帧" }),
      Object["freeze"]({
        value: "reference",
        label: "参考图",
        disableWhen: Object["freeze"]({
          any: Object["freeze"]([
            Object["freeze"]({ field: "rh_veo3_channel", value: "lowCost" }),
            Object["freeze"]({ field: "mode", value: "lite" }),
          ]),
        }),
      }),
      Object["freeze"]({
        value: "extend",
        label: "视频续写",
        disableWhen: Object["freeze"]({
          any: Object["freeze"]([
            Object["freeze"]({ field: "rh_veo3_channel", value: "lowCost" }),
            Object["freeze"]({ field: "mode", value: "lite" }),
          ]),
        }),
      }),
    ]),
  }),
  RUNNINGHUB_VEO3_DURATION_FIELD = Object["freeze"]({
    ...createFooterDurationSliderOptionsField({
      values: [4, 6, 8],
      defaultValue: 8,
      label: "视频时长（秒）",
    }),
    hideWhen: Object["freeze"]({ field: "generation_type", value: "extend" }),
  }),
  RUNNINGHUB_VEO3_GENERATE_AUDIO_FIELD = Object["freeze"]({
    id: "generateAudio",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "生成音频",
    defaultValue: false,
    hideWhen: Object["freeze"]({
      any: Object["freeze"]([
        Object["freeze"]({ field: "rh_veo3_channel", value: "lowCost" }),
        Object["freeze"]({ field: "generation_type", value: "extend" }),
      ]),
    }),
  }),
  RUNNINGHUB_VEO3_FIXED_INPUT_SLOTS = Object["freeze"]([
    Object["freeze"]({
      id: "firstFrame",
      kind: "image",
      label: "首帧图",
      description: "图生视频起始帧；低价版或官方 Lite 可接尾帧。",
      hideWhen: Object["freeze"]({
        field: "generation_type",
        values: Object["freeze"](["reference", "extend"]),
      }),
    }),
    Object["freeze"]({
      id: "lastFrame",
      kind: "image",
      label: "尾帧图",
      description: "首尾帧生视频结束帧。",
      hideWhen: Object["freeze"]({
        field: "generation_type",
        values: Object["freeze"](["reference", "extend"]),
      }),
    }),
    Object["freeze"]({
      id: "referenceImage",
      kind: "image",
      label: "参考图",
      description:
        "官方\x20Fast\x20/\x20Pro\x20参考生视频，支持\x201-3\x20张参考图。",
      showWhen: Object["freeze"]({
        field: "generation_type",
        value: "reference",
      }),
    }),
    Object["freeze"]({
      id: "extendVideo",
      kind: "video",
      label: "续写视频",
      description: "官方\x20Fast\x20/\x20Pro\x20视频续写使用的原视频。",
      showWhen: Object["freeze"]({ field: "generation_type", value: "extend" }),
    }),
  ]),
  RUNNINGHUB_VEO3_FRAME_PROMPT_PLACEHOLDER =
    "描述画面内容、动作和镜头；接首尾帧时写清从首帧到尾帧的变化。",
  RUNNINGHUB_VEO3_REFERENCE_PROMPT_PLACEHOLDER =
    "描述参考图主体的动作、场景和镜头；可用 1-3 张参考图保持人物、主体或风格。",
  RUNNINGHUB_VEO3_EXTEND_PROMPT_PLACEHOLDER =
    "视频续写按官方接口提交原视频和分辨率，不提交提示词。",
  RUNNINGHUB_VEO3_FRAME_HELP_TOOLTIP = [
    "RunningHub Veo3",
    "[[red:不放图]]：文生视频。",
    "[[red:放\x201\x20张图]]：图生视频，把图片作为视频起点。",
    "[[red:放\x202\x20张图]]：低价\x20Fast\x20/\x20Pro\x20或官方\x20Lite\x20走首尾帧接口。",
    "官方 Fast / Pro 暂按文生、图生、参考图接入；官方首尾帧请选 Lite。",
  ]["join"]("\x0a"),
  RUNNINGHUB_VEO3_REFERENCE_HELP_TOOLTIP = [
    "RunningHub\x20Veo3\x20参考图模式",
    "[[red:官方\x20Fast\x20/\x20Pro]]：支持\x201-3\x20张参考图。",
    "[[red:低价版和 Lite]]：官方文档未提供参考图接口，已在 UI 中禁用。",
    "适合角色一致性、主体参考和风格延续。",
  ]["join"]("\x0a"),
  RUNNINGHUB_VEO3_EXTEND_HELP_TOOLTIP = [
    "RunningHub\x20Veo3\x20视频续写",
    "[[red:官方\x20Fast\x20/\x20Pro]]：支持\x201\x20个原视频。",
    "[[red:低价版和 Lite]]：官方文档未提供 video-extend 接口，已在 UI 中禁用。",
    "请求只提交 video 和 resolution。",
  ]["join"]("\x0a"),
  VIDU_Q3_GENERATION_MODE_FIELD = Object["freeze"]({
    id: "vidu_q3_generation_mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模式选择",
    defaultValue: "video",
    options: Object["freeze"]([
      Object["freeze"]({ value: "video", label: "视频生成" }),
      Object["freeze"]({ value: "reference", label: "参考生视频" }),
    ]),
  }),
  VIDU_Q3_MODEL_FIELD = Object["freeze"]({
    id: "mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模型选择",
    defaultValue: "viduq3-turbo",
    description:
      "视频生成：viduq3-turbo / viduq3-pro。\n参考生视频：viduq3 / viduq3-mix。",
    options: Object["freeze"]([
      Object["freeze"]({
        value: "viduq3-turbo",
        label: "Turbo 版",
        disableWhen: Object["freeze"]({
          field: "vidu_q3_generation_mode",
          value: "reference",
        }),
      }),
      Object["freeze"]({
        value: "viduq3-pro",
        label: "Pro 版",
        disableWhen: Object["freeze"]({
          field: "vidu_q3_generation_mode",
          value: "reference",
        }),
      }),
      Object["freeze"]({
        value: "viduq3",
        label: "标准版",
        disableWhen: Object["freeze"]({
          field: "vidu_q3_generation_mode",
          value: "video",
        }),
      }),
      Object["freeze"]({
        value: "viduq3-mix",
        label: "Mix 版",
        disableWhen: Object["freeze"]({
          field: "vidu_q3_generation_mode",
          value: "video",
        }),
      }),
    ]),
  }),
  VIDU_Q3_AUDIO_FIELD = Object["freeze"]({
    ...VIDEO_AUDIO_FIELD,
    defaultValue: true,
    hideWhen: Object["freeze"]({
      field: "vidu_q3_generation_mode",
      value: "reference",
    }),
  }),
  VIDU_Q3_HELP_TOOLTIP = [
    "Vidu Q3 视频生成",
    "[[red:视频生成]]：Turbo\x20/\x20Pro，支持文生、图生、首尾帧，最多\x202\x20张图；传图时比例由图片决定。",
    "[[red:参考生视频]]：Standard / Mix，必须接入 1-7 张参考图，适合角色一致性和风格延续。",
  ]["join"]("\x0a"),
  GROK_IMAGINE_QUALITY_FIELD = Object["freeze"]({
    id: "quality",
    type: "segmented",
    placement: "resolution",
    variant: "pillMenu",
    label: "视频质量",
    defaultValue: "480p",
    options: Object["freeze"]([
      Object["freeze"]({ value: "480p", label: "480p" }),
      Object["freeze"]({ value: "720p", label: "720p" }),
    ]),
  }),
  GROK_IMAGINE_PROMPT_PLACEHOLDER =
    "描述视频内容、动作和镜头；接入参考图时会按参考图生成动态视频。",
  GROK_IMAGINE_HELP_TOOLTIP = [
    "Grok Imagine 1.0",
    "[[red:不放图]]：文生视频，只按提示词生成。",
    "[[red:放\x201-7\x20张图]]：图生视频，参考图需为公网可访问\x20URL。",
    "时长支持\x206-30\x20秒，质量支持\x20480p\x20/\x20720p。",
  ]["join"]("\x0a"),
  GEMINI_OMNI_FLASH_PROMPT_PLACEHOLDER =
    "描述视频内容、动作、环境和镜头；可接入 1 张或 3 张参考图。",
  GEMINI_OMNI_FLASH_HELP_TOOLTIP = [
    "Gemini\x20Omni\x20Flash",
    "[[red:不放图]]：文生视频，只按提示词生成。",
    "[[red:放 1 张图]]：单图生视频，把图片作为视觉参考。",
    "[[red:放 3 张图]]：参考图融合；不支持 2 张图首尾帧模式。",
    "时长支持\x204\x20/\x206\x20/\x208\x20/\x2010\x20秒，分辨率支持\x20720p\x20/\x201080p\x20/\x204K。",
  ]["join"]("\x0a"),
  HAILUO_02_PROMPT_EXAMPLE = "[推进]一只猫咪在花园中奔跑，镜头缓缓推进特写",
  HAILUO_02_HELP_TOOLTIP = [
    "Hailuo-02\x20适用场景",
    "[[red:不放图]]：文生视频，适合快速把一句场景描述变成短视频。",
    "[[red:放 1 张首帧]]：图生视频，把这张图当开头，适合人物转身、表情变化、镜头推进。",
    "[[red:放 2 张首尾帧]]：控制开头和结尾，适合白天到夜晚、近景到远景这类明确转场。",
    "[[red:1080p 只做 5 秒]]；想做 10 秒就用 512p 或 768p。",
    "提示词例子：画面从白天逐渐过渡到夜晚，天空颜色慢慢变深，城市灯光依次亮起，镜头缓慢推进。",
  ]["join"]("\x0a"),
  HAILUO_23_PROMPT_EXAMPLE = "[推进]一只猫咪在花园中奔跑，镜头缓缓推进特写",
  HAILUO_23_HELP_TOOLTIP = [
    "Hailuo 2.3 适用场景",
    "[[red:标准版不放图]]：文生视频，适合快速把一句场景描述变成短视频。",
    "[[red:标准版放 1 张首帧]]：图生视频，把这张图当开头，适合人物转身、表情变化、镜头推进。",
    "[[red:Fast\x20版必须放\x201\x20张首帧]]：更快生成，适合已有首帧的快速预览。",
    "[[red:1080p 只做 6 秒]]；想做 10 秒就用 768p。",
    "提示词例子：画面中的猫咪向镜头奔跑，镜头缓缓推进，草地和阳光有电影感。",
  ]["join"]("\x0a"),
  HAILUO_23_MODEL_FIELD = Object["freeze"]({
    id: "mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模型选择",
    description:
      "标准版支持文生和图生视频。\x0aFast\x20版必须接入首帧图片，生成更快。",
    defaultValue: "standard",
    options: Object["freeze"]([
      Object["freeze"]({ value: "standard", label: "标准版" }),
      Object["freeze"]({ value: "fast", label: "Fast 版" }),
    ]),
  }),
  RUNNINGHUB_HAILUO_02_PROMPT_PLACEHOLDER =
    "描述视频内容和镜头变化。例如：[推进]一只猫咪在花园中奔跑，镜头缓缓推进特写。",
  RUNNINGHUB_HAILUO_02_HELP_TOOLTIP = [
    "RunningHub Hailuo 02",
    "[[red:标准版不放图]]：文生视频，支持\x206\x20秒或\x2010\x20秒。",
    "[[red:标准版放\x201\x20张首帧]]：图生视频，把图片作为视频起点。",
    "[[red:标准版放 2 张首尾帧]]：控制开头和结尾。",
    "[[red:Pro 版]]：文生或首帧图生，1080P 质量，接口不接尾帧。",
    "[[red:Fast 版]]：必须接 1 张首帧图，适合快速预览。",
  ]["join"]("\x0a"),
  RUNNINGHUB_HAILUO_02_QUALITY_FIELD = Object["freeze"]({
    id: "rh_hailuo_02_quality",
    type: "segmented",
    placement: "resolution",
    variant: "sectionMenu",
    label: "视频质量",
    description:
      "标准版支持文生、图生和首尾帧；Pro\x20版支持文生/首帧图生；Fast\x20版必须接首帧。",
    defaultValue: "standard",
    options: Object["freeze"]([
      Object["freeze"]({
        value: "standard",
        label: "标准版",
        selectedLabel: "标准 768P",
      }),
      Object["freeze"]({
        value: "pro",
        label: "Pro 版",
        selectedLabel: "Pro 1080P",
      }),
      Object["freeze"]({
        value: "fast",
        label: "Fast 版",
        selectedLabel: "Fast 768P",
        tooltip: "Fast 版仅支持图生视频，必须接入首帧。",
      }),
    ]),
  }),
  RUNNINGHUB_HAILUO_02_DURATION_FIELD = Object["freeze"]({
    ...createFooterDurationSliderOptionsField({
      values: [6, 10],
      defaultValue: 6,
      label: "视频时长（秒）",
    }),
    hideWhen: Object["freeze"]({ field: "rh_hailuo_02_quality", value: "pro" }),
  }),
  RUNNINGHUB_HAILUO_02_ENABLE_PROMPT_EXPANSION_FIELD = Object["freeze"]({
    id: "enablePromptExpansion",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "提示词扩写",
    defaultValue: true,
  }),
  RUNNINGHUB_HAILUO_02_FIXED_INPUT_SLOTS = Object["freeze"]([
    Object["freeze"]({
      id: "firstFrame",
      kind: "image",
      label: "首帧",
      description: "图生视频起始帧；Fast 版必填。",
    }),
    Object["freeze"]({
      id: "lastFrame",
      kind: "image",
      label: "尾帧",
      description: "仅标准版首尾帧可用。",
      hideWhen: Object["freeze"]({
        field: "rh_hailuo_02_quality",
        values: Object["freeze"](["pro", "fast"]),
      }),
    }),
  ]),
  RUNNINGHUB_HAILUO_23_PROMPT_PLACEHOLDER =
    "描述视频内容和镜头变化。例如：[推进]画面中的猫咪向镜头奔跑，镜头缓缓推进，草地和阳光有电影感。",
  RUNNINGHUB_HAILUO_23_HELP_TOOLTIP = [
    "RunningHub\x20Hailuo\x202.3",
    "[[red:标准版不放图]]：文生视频，支持 6 秒或 10 秒。",
    "[[red:标准版放 1 张首帧]]：图生视频，把图片作为视频起点。",
    "[[red:Pro 版]]：文生或首帧图生，1080P 质量，固定 5 秒，不传 duration。",
    "[[red:Fast\x20版]]：必须接\x201\x20张首帧图，768P，支持\x206\x20秒或\x2010\x20秒。",
    "[[red:Fast\x20Pro\x20版]]：必须接\x201\x20张首帧图，1080P，固定\x206\x20秒。",
  ]["join"]("\x0a"),
  RUNNINGHUB_HAILUO_23_QUALITY_FIELD = Object["freeze"]({
    id: "rh_hailuo_23_quality",
    type: "segmented",
    placement: "resolution",
    variant: "sectionMenu",
    label: "视频质量",
    description:
      "标准版支持文生/图生；Pro 文生/图生固定 5 秒；Fast/Fast Pro 必须接首帧。",
    defaultValue: "standard",
    options: Object["freeze"]([
      Object["freeze"]({
        value: "standard",
        label: "标准版",
        selectedLabel: "标准 768P",
      }),
      Object["freeze"]({
        value: "pro",
        label: "Pro 版",
        selectedLabel: "Pro\x201080P",
      }),
      Object["freeze"]({
        value: "fast",
        label: "Fast 版",
        selectedLabel: "Fast 768P",
        tooltip: "Fast\x20版仅支持图生视频，必须接入首帧。",
      }),
      Object["freeze"]({
        value: "fastPro",
        label: "Fast Pro",
        selectedLabel: "Fast Pro 1080P",
        tooltip: "Fast Pro 版仅支持图生视频，固定 6 秒。",
      }),
    ]),
  }),
  RUNNINGHUB_HAILUO_23_DURATION_FIELD = Object["freeze"]({
    ...createFooterDurationSliderOptionsField({
      values: [6, 10],
      defaultValue: 6,
      label: "视频时长（秒）",
    }),
    hideWhen: Object["freeze"]({
      field: "rh_hailuo_23_quality",
      values: Object["freeze"](["pro", "fastPro"]),
    }),
  }),
  RUNNINGHUB_HAILUO_23_FIXED_INPUT_SLOTS = Object["freeze"]([
    Object["freeze"]({
      id: "firstFrame",
      kind: "image",
      label: "首帧",
      description: "图生视频起始帧；Fast / Fast Pro 必填。",
    }),
  ]),
  HAPPYHORSE_TEXT_HELP_TOOLTIP = [
    "HappyHorse 1.0 文生视频",
    "[[red:没入参时]]：只写提示词，就是文生视频。",
    "适合直接生成新画面、动作和镜头。",
    "提示词例子：一只白色小狗在草地上奔跑，镜头低角度跟拍，阳光明亮，慢动作。",
  ]["join"]("\x0a"),
  HAPPYHORSE_IMAGE_HELP_TOOLTIP = [
    "HappyHorse\x201.0\x20图生视频",
    "[[red:接\x201\x20张图]]：把这张图当视频起点，让画面动起来。",
    "[[red:没入参时]]：仍然是文生视频，只按提示词生成。",
    "适合人物转身、表情变化、镜头推进这类从一张图开始的变化。",
    "提示词例子：画面中的女孩慢慢转身看向镜头，发丝被风吹动，背景轻微虚化。",
  ]["join"]("\x0a"),
  HAPPYHORSE_REFERENCE_HELP_TOOLTIP = [
    "HappyHorse 1.0 参考图生视频",
    "[[red:接\x201-9\x20张参考图]]：参考人物、主体、风格或场景，生成全新画面。",
    "[[red:没入参时]]：仍然是文生视频，只按提示词生成。",
    "适合统一角色或风格，多张图可以给更多外观参考。",
    "提示词例子：参考图中的角色在未来城市中行走，镜头从侧面缓慢环绕，灯光有电影感。",
  ]["join"]("\x0a"),
  HAPPYHORSE_EDIT_HELP_TOOLTIP = [
    "HappyHorse 1.0 视频编辑",
    "[[red:接\x201\x20个视频]]：在原视频基础上改画面或动作，可再接最多\x205\x20张参考图。",
    "[[red:没入参时]]：仍然是文生视频，只按提示词生成。",
    "适合改风格、换场景、增强画面，或让原视频更贴近参考图。",
    "提示词例子：把原视频改成夜晚赛博朋克街道风格，保留人物动作，增加霓虹灯和雨水反光。",
  ]["join"]("\x0a"),
  HAPPYHORSE_HELP_TOOLTIP = HAPPYHORSE_TEXT_HELP_TOOLTIP,
  HAPPYHORSE_TEXT_PROMPT_PLACEHOLDER =
    "描述要生成的视频内容。例如：夕阳下的海边公路，慢镜头推进，电影感画面。",
  HAPPYHORSE_IMAGE_PROMPT_PLACEHOLDER =
    "描述首帧图要如何动起来。例如：让图片中的场景动起来，镜头缓慢推近，主体轻微转身，电影感。",
  HAPPYHORSE_REFERENCE_PROMPT_PLACEHOLDER =
    "描述参考图之间的主体、场景和动作关系。例如：@图片1 中的主角在 @图片2 的场景中奔跑，随后拿起 @图片3 中的道具，保持3D卡通风格，动作流畅。",
  HAPPYHORSE_EDIT_PROMPT_PLACEHOLDER =
    "描述如何改写源视频，可用参考图补充风格。例如：把视频中的角色换成卡通风格，保留原有动作和节奏。",
  HAPPYHORSE_MODE_FIELD = Object["freeze"]({
    id: "happyhorse_mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模式选择",
    description: HAPPYHORSE_HELP_TOOLTIP,
    defaultValue: "image",
    options: Object["freeze"]([
      Object["freeze"]({
        value: "auto",
        label: "模式选择",
        displayLabel: "模式选择",
        hidden: true,
      }),
      Object["freeze"]({ value: "image", label: "图生视频" }),
      Object["freeze"]({ value: "reference", label: "参考图生视频" }),
      Object["freeze"]({ value: "edit", label: "视频编辑" }),
    ]),
  }),
  HAPPYHORSE_AUDIO_SETTING_FIELD = Object["freeze"]({
    ...VIDEO_AUDIO_SETTING_FIELD,
    label: "音频设置",
    tooltip: "仅视频编辑模式生效：自动生成音频或保留原视频音轨。",
    options: Object["freeze"]([
      Object["freeze"]({ value: "auto", label: "自动生成音频" }),
      Object["freeze"]({ value: "origin", label: "保留原视频音轨" }),
    ]),
  }),
  HAPPYHORSE_WATERMARK_FIELD = Object["freeze"]({
    ...VIDEO_WATERMARK_FIELD,
    label: "添加水印",
  }),
  HAPPYHORSE_SEED_FIELD = Object["freeze"]({
    ...VIDEO_SEED_FIELD,
    label: "随机种子",
  });
function createHappyHorseFixedSlot({
  id: v0,
  kind: v1,
  label: v2,
  mode: v3,
  description: v4,
}) {
  return Object["freeze"]({
    id: v0,
    kind: v1,
    label: v2,
    description: v4,
    showWhen: Object["freeze"]({ field: "happyhorse_mode", value: v3 }),
  });
}
const HAPPYHORSE_FIXED_INPUT_SLOTS = Object["freeze"]([
    createHappyHorseFixedSlot({
      id: "firstFrame",
      kind: "image",
      label: "参考图",
      mode: "image",
      description: "图生视频使用的参考图",
    }),
    createHappyHorseFixedSlot({
      id: "referenceImage",
      kind: "image",
      label: "参考图",
      mode: "reference",
      description: "参考图生视频的参考图片",
    }),
    createHappyHorseFixedSlot({
      id: "editVideo",
      kind: "video",
      label: "参考视频",
      mode: "edit",
      description: "视频编辑使用的参考视频",
    }),
    createHappyHorseFixedSlot({
      id: "editRefImage",
      kind: "image",
      label: "参考图",
      mode: "edit",
      description: "视频编辑可选参考图",
    }),
  ]),
  RUNNINGHUB_SEEDANCE_2_MODEL_FIELD = Object["freeze"]({
    id: "rh_seedance_2_model",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模型选择",
    defaultValue: "fast",
    options: Object["freeze"]([
      Object["freeze"]({ value: "fast", label: "Fast 版" }),
      Object["freeze"]({ value: "standard", label: "标准版" }),
    ]),
  }),
  RUNNINGHUB_SEEDANCE_2_MODE_FIELD = Object["freeze"]({
    id: "rh_seedance_2_mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模式选择",
    defaultValue: "text2video",
    options: Object["freeze"]([
      Object["freeze"]({ value: "text2video", label: "文生视频" }),
      Object["freeze"]({ value: "image2video", label: "图生视频" }),
      Object["freeze"]({ value: "frames2video", label: "首尾帧" }),
      Object["freeze"]({ value: "multimodal2video", label: "全能参考" }),
    ]),
  }),
  VOLCENGINE_SEEDANCE_2_MODE_FIELD = Object["freeze"]({
    id: "volcengine_seedance_2_mode",
    type: "segmented",
    placement: "mode",
    variant: "pillMenu",
    label: "模式",
    defaultValue: "multimodal2video",
    options: Object["freeze"]([
      Object["freeze"]({
        value: "multimodal2video",
        label: "全能参考",
        selectedLabel: "全能参考",
      }),
      Object["freeze"]({
        value: "frames2video",
        label: "首尾帧",
        selectedLabel: "首尾帧",
      }),
    ]),
  }),
  RUNNINGHUB_SEEDANCE_2_RESOLUTION_FIELD = Object["freeze"]({
    id: "resolution",
    displayRole: "resolution",
    type: "segmented",
    placement: "resolution",
    variant: "pillMenu",
    qualityRatioLabelOrder: "fieldFirst",
    label: "分辨率",
    defaultValue: "720p",
    options: Object["freeze"]([
      Object["freeze"]({
        value: "480p",
        label: "480p",
        groupLabel: "原生输出分辨率",
      }),
      Object["freeze"]({
        value: "720p",
        label: "720p",
        groupLabel: "原生输出分辨率",
      }),
      Object["freeze"]({
        value: "native1080p",
        label: "native1080p",
        groupLabel: "原生输出分辨率",
      }),
      Object["freeze"]({
        value: "1080p",
        label: "1080p",
        groupLabel: "超分辨率",
      }),
      Object["freeze"]({ value: "2k", label: "2k", groupLabel: "超分辨率" }),
      Object["freeze"]({ value: "4k", label: "4k", groupLabel: "超分辨率" }),
    ]),
  }),
  RUNNINGHUB_SEEDANCE_2_GENERATE_AUDIO_FIELD = Object["freeze"]({
    id: "generateAudio",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "生成音频",
    defaultValue: true,
  }),
  RUNNINGHUB_SEEDANCE_2_WEB_SEARCH_FIELD = Object["freeze"]({
    id: "webSearch",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "联网搜索",
    defaultValue: false,
    showWhen: Object["freeze"]({
      field: "rh_seedance_2_mode",
      value: "text2video",
    }),
  }),
  RUNNINGHUB_SEEDANCE_2_REAL_PERSON_FIELD = Object["freeze"]({
    id: "realPersonMode",
    type: "toggle",
    placement: "advanced",
    variant: "advancedRow",
    label: "真人模式",
    defaultValue: false,
  });
function createVolcengineSeedance2ResolutionField({
  include1080p: include1080p = true,
} = {}) {
  const v5 = [
    Object["freeze"]({ value: "480p", label: "480p" }),
    Object["freeze"]({ value: "720p", label: "720p" }),
  ];
  return (
    include1080p &&
      v5["push"](Object["freeze"]({ value: "1080p", label: "1080p" })),
    Object["freeze"]({
      id: "resolution",
      displayRole: "resolution",
      type: "segmented",
      placement: "resolution",
      variant: "pillMenu",
      qualityRatioLabelOrder: "fieldFirst",
      label: "分辨率",
      defaultValue: "720p",
      options: Object["freeze"](v5),
    })
  );
}
const VOLCENGINE_SEEDANCE_2_RATIO_FIELD = Object["freeze"]({
    id: "aspectRatio",
    displayRole: "aspectRatio",
    type: "segmented",
    placement: "resolution",
    variant: "pillMenu",
    label: "比例",
    defaultValue: "adaptive",
    options: Object["freeze"]([
      Object["freeze"]({ value: "adaptive", label: "自适应" }),
      Object["freeze"]({ value: "16:9", label: "16:9" }),
      Object["freeze"]({ value: "9:16", label: "9:16" }),
      Object["freeze"]({ value: "1:1", label: "1:1" }),
      Object["freeze"]({ value: "4:3", label: "4:3" }),
      Object["freeze"]({ value: "3:4", label: "3:4" }),
      Object["freeze"]({ value: "21:9", label: "21:9" }),
    ]),
  }),
  VOLCENGINE_SEEDANCE_2_GENERATE_AUDIO_FIELD = Object["freeze"]({
    ...RUNNINGHUB_SEEDANCE_2_GENERATE_AUDIO_FIELD,
    defaultValue: true,
  }),
  VOLCENGINE_SEEDANCE_2_SEED_FIELD = Object["freeze"]({
    ...VIDEO_SEED_FIELD,
    defaultValue: "random",
  });
function createRunningHubSeedance2FixedSlot({
  id: v6,
  kind: v7,
  label: v8,
  mode: v9,
  modes: v10,
  description: v11,
  displayOrder: v12,
}) {
  const v13 = Object["freeze"](
      (Array["isArray"](v10) ? v10 : [v9])
        ["map"]((v14) => String(v14 || "")["trim"]())
        ["filter"](Boolean),
    ),
    v15 =
      v13["length"] > 1
        ? Object["freeze"]({ field: "rh_seedance_2_mode", values: v13 })
        : Object["freeze"]({
            field: "rh_seedance_2_mode",
            value: v13[0] || "",
          });
  return Object["freeze"]({
    id: v6,
    kind: v7,
    label: v8,
    description: v11,
    displayOrder: v12,
    showWhen: v15,
  });
}
const RUNNINGHUB_SEEDANCE_2_FIXED_INPUT_SLOTS = Object["freeze"]([
    createRunningHubSeedance2FixedSlot({
      id: "firstFrame",
      kind: "image",
      label: "首帧",
      modes: ["image2video", "frames2video"],
      displayOrder: 10,
      description: "图生或首尾帧生成的起始图片",
    }),
    createRunningHubSeedance2FixedSlot({
      id: "lastFrame",
      kind: "image",
      label: "尾帧",
      mode: "frames2video",
      displayOrder: 20,
      description: "首尾帧生成的结束图片",
    }),
    createRunningHubSeedance2FixedSlot({
      id: "referenceVideo",
      kind: "video",
      label: "参考视频",
      mode: "multimodal2video",
      displayOrder: 30,
      description: "全能参考模式的参考视频",
    }),
    createRunningHubSeedance2FixedSlot({
      id: "referenceImage",
      kind: "image",
      label: "参考图",
      mode: "multimodal2video",
      displayOrder: 40,
      description: "全能参考模式的参考图片",
    }),
    createRunningHubSeedance2FixedSlot({
      id: "referenceAudio",
      kind: "audio",
      label: "参考音频",
      mode: "multimodal2video",
      displayOrder: 50,
      description: "可选，需搭配参考图片或参考视频",
    }),
  ]),
  RUNNINGHUB_SEEDANCE_2_TEXT_PROMPT_PLACEHOLDER =
    "描述要生成的视频内容、动作、镜头和风格。",
  RUNNINGHUB_SEEDANCE_2_IMAGE_PROMPT_PLACEHOLDER =
    "描述参考图中主体如何运动，以及镜头和画面变化。",
  RUNNINGHUB_SEEDANCE_2_FRAMES_PROMPT_PLACEHOLDER =
    "描述首帧到尾帧的过渡动作、节奏和镜头关系。",
  RUNNINGHUB_SEEDANCE_2_REFERENCE_PROMPT_PLACEHOLDER =
    "用 @图片1、@视频1 指代参考素材，描述主体、动作、声音和镜头关系。",
  RUNNINGHUB_SEEDANCE_2_HELP_TOOLTIP = [
    "RunningHub Seedance 2.0",
    "模型选择：Fast 版 / 标准版。",
    "模式：文生视频\x20/\x20图生视频\x20/\x20首尾帧\x20/\x20全能参考。",
    "分辨率：480p、720p、native1080p 为原生输出；1080p、2k、4k 为基于 720p 原生生成后超分放大。",
    "图生需 1 张图；首尾帧需 2 张图；全能参考最多 9 图、3 视频、3 音频。",
  ]["join"]("\x0a"),
  VOLCENGINE_SEEDANCE_2_HELP_TOOLTIP = [
    "火山方舟\x20Seedance\x202.0",
    "模式：全能参考\x20/\x20首尾帧。",
    "无入参时只使用提示词；首尾帧模式接 1 张图时按首帧输入处理。",
    "分辨率：Fast 版支持 480p、720p；标准版支持 480p、720p、1080p。",
    "全能参考最多\x209\x20图、3\x20视频、3\x20音频；音频需搭配图片或视频。",
  ]["join"]("\x0a"),
  WAN27_HELP_TOOLTIP = [
    "Wan2.7\x20模式说明",
    "图生视频：可接首帧、尾帧和音频；没入参时就是文生视频。",
    "视频续写：接 1 个续写视频；没入参时就是文生视频。",
    "参考生视频：接参考图或参考视频；音频需搭配参考图。",
    "视频编辑：接原视频，可再接参考视频。",
  ]["join"]("\x0a"),
  WAN27_IMAGE_HELP_TOOLTIP = [
    "Wan2.7 图生视频",
    "[[red:没入参时]]：只写提示词，就是文生视频。",
    "[[red:接 1 张首帧]]：从这张图开始生成视频。",
    "[[red:接首帧 + 尾帧]]：第一张是开头，第二张是结尾，中间变化由模型补。",
    "[[red:接音频]]：可作为背景或驱动音频，2-30 秒且不超过 15MB。",
    "提示词例子：一只猫咪在草地上追逐蝴蝶，阳光明媚，镜头慢慢推进，慢动作。",
  ]["join"]("\x0a"),
  WAN27_VIDEO_HELP_TOOLTIP = [
    "Wan2.7 视频续写",
    "[[red:接\x201\x20个续写视频]]：在原视频后继续往下生成。",
    "[[red:没入参时]]：只写提示词，就是文生视频。",
    "[[red:视频超过 10 秒]]：生成前会拦截。",
    "提示词例子：延续原视频里的镜头，人物继续向前走，镜头跟随，动作自然衔接。",
  ]["join"]("\x0a"),
  WAN27_REFERENCE_HELP_TOOLTIP = [
    "Wan2.7 参考生视频",
    "[[red:接参考图或参考视频]]：参考主体、动作、风格或场景，生成新视频。",
    "[[red:音频需搭配参考图]]：作为角色声音参考使用。",
    "提示词里可以用图 1、视频 1 指代对应入参。",
    "提示词例子：图 1 中的人物来到视频 1 的街道场景中，环顾四周，镜头从侧面缓慢跟拍。",
  ]["join"]("\x0a"),
  WAN27_EDIT_HELP_TOOLTIP = [
    "Wan2.7\x20视频编辑",
    "[[red:接 1 个原视频]]：在原视频基础上改画面、换背景或改风格。",
    "[[red:参考视频可选]]：用来补充目标动作或风格参考。",
    "[[red:原视频 2-10 秒]]：超过会在生成前拦截。",
    "提示词例子：将原视频背景替换为雪山场景，保留人物动作，整体变成电影感冷色调。",
  ]["join"]("\x0a"),
  WAN27_IMAGE_PROMPT_PLACEHOLDER =
    "不接素材时描述文生视频；接首帧/尾帧时描述动作、运镜和过渡。例如：人物缓缓站起身，向镜头走来；或镜头从海边缓慢移向山顶。",
  WAN27_VIDEO_PROMPT_PLACEHOLDER =
    "描述原视频要如何续写。例如：继续向前走，镜头跟随，保持原视频里的动作节奏和画面风格。",
  WAN27_REFERENCE_PROMPT_PLACEHOLDER =
    "用 @图片1、@图片2、@视频1 指代参考素材。例如：@图片1 中的人物来到 @图片2 的场景中，学习 @图片3 的动作，保持角色一致。",
  WAN27_EDIT_PROMPT_PLACEHOLDER =
    "描述要对原视频做什么编辑，可用参考图补充风格。例如：将背景替换为雪山场景，保留人物动作和镜头节奏。",
  KLING_V3_HELP_TOOLTIP = [
    "Kling V3 视频生成",
    "[[red:不放图]]：只写提示词，就是文生视频。",
    "[[red:接 1 张首帧]]：从这张图开始生成视频。",
    "[[red:接首帧 + 尾帧]]：第一张是开头，第二张是结尾，中间变化由模型补。",
    "[[red:生成有声视频]]：在高级设置打开音频，让模型同时生成声音。",
    "标准 / 专业 / 4K 可在参数区选择；多镜头分镜模式暂未开放。",
    "提示词例子：女孩从照片里的姿势慢慢转身看向镜头，镜头缓慢推进，阳光穿过窗帘，电影感。",
  ]["join"]("\x0a"),
  KLING_V3_PROMPT_PLACEHOLDER =
    "不接素材时描述文生视频；接首帧/尾帧时描述 @图片1 到 @图片2 的变化。例如：@图片1 中的猫咪缓缓向前走，最后过渡到 @图片2 的画面，电影质感。",
  KLING_V3_OMNI_IMAGE_HELP_TOOLTIP = [
    "Kling V3 Omni 图生视频",
    "[[red:没入参时]]：只写提示词，就是文生视频。",
    "[[red:接 1 张首帧]]：从这张图开始生成视频。",
    "[[red:接首帧 + 尾帧]]：第一张是开头，第二张是结尾，中间变化由模型补。",
    "[[red:生成有声视频]]：在高级设置打开音频，让模型同时生成声音。",
    "提示词例子：画面中的女孩慢慢转身看向镜头，镜头缓慢推进，窗外阳光穿过窗帘，电影感。",
  ]["join"]("\x0a"),
  KLING_V3_OMNI_REFERENCE_HELP_TOOLTIP = [
    "Kling V3 Omni 参考生视频",
    "[[red:接参考图或参考视频]]：参考主体、动作、风格或场景生成新视频。",
    "参考视频会作为特征参考；有参考视频时不会发送生成有声视频参数。",
    "提示词例子：参考图中的角色走进参考视频的街道场景，镜头从侧面缓慢跟拍，灯光有电影感。",
  ]["join"]("\x0a"),
  KLING_V3_OMNI_EDIT_HELP_TOOLTIP = [
    "Kling V3 Omni 视频编辑",
    "[[red:接 1 个原视频]]：在原视频基础上改画面、换风格或调整内容。",
    "[[red:不能同时接首尾帧]]：视频编辑模式只使用原视频作为基础输入。",
    "提示词例子：将原视频改成夜晚赛博朋克街道风格，保留人物动作，增加霓虹灯和雨水反光。",
  ]["join"]("\x0a"),
  KLING_V3_OMNI_HELP_TOOLTIP = KLING_V3_OMNI_IMAGE_HELP_TOOLTIP,
  KLING_V3_OMNI_IMAGE_PROMPT_PLACEHOLDER =
    "不接素材时描述文生视频；接首帧/尾帧时可用 @图片1 / @图片2 指代。例如：让 @图片1 中的人物向镜头挥手，随后过渡到 @图片2 的街景。",
  KLING_V3_OMNI_REFERENCE_PROMPT_PLACEHOLDER =
    "用 @图片1、@视频1 指代参考素材。例如：参考 @图片1 的角色外观和 @视频1 的镜头风格，生成夜晚街道行走视频。",
  KLING_V3_OMNI_EDIT_PROMPT_PLACEHOLDER =
    "描述如何编辑原视频，可接参考图补充风格。例如：将原视频改成夜晚赛博朋克街道风格，保留人物动作和镜头节奏。",
  KLING_V3_OMNI_MODE_FIELD = Object["freeze"]({
    id: "kling_v3_omni_mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模式选择",
    description:
      "图生视频：首尾帧或文生视频。\n参考生视频：参考图或参考视频。\n视频编辑：基于原视频编辑。",
    defaultValue: "image",
    options: Object["freeze"]([
      Object["freeze"]({ value: "image", label: "图生视频" }),
      Object["freeze"]({ value: "reference", label: "参考生视频" }),
      Object["freeze"]({ value: "edit", label: "视频编辑" }),
    ]),
  });
function createKlingV3OmniFixedSlot({
  id: v16,
  kind: v17,
  label: v18,
  mode: v19,
  description: v20,
  displayOrder: v21,
}) {
  return Object["freeze"]({
    id: v16,
    kind: v17,
    label: v18,
    description: v20,
    displayOrder: v21,
    showWhen: Object["freeze"]({ field: "kling_v3_omni_mode", value: v19 }),
  });
}
const KLING_V3_OMNI_FIXED_INPUT_SLOTS = Object["freeze"]([
    createKlingV3OmniFixedSlot({
      id: "firstFrame",
      kind: "image",
      label: "首帧",
      mode: "image",
      displayOrder: 10,
      description: "图生视频使用的首帧图片",
    }),
    createKlingV3OmniFixedSlot({
      id: "lastFrame",
      kind: "image",
      label: "尾帧",
      mode: "image",
      displayOrder: 20,
      description: "可选，图生视频使用的尾帧图片",
    }),
    createKlingV3OmniFixedSlot({
      id: "referenceImage",
      kind: "image",
      label: "参考图",
      mode: "reference",
      displayOrder: 30,
      description: "参考生视频使用的参考图片",
    }),
    createKlingV3OmniFixedSlot({
      id: "referenceVideo",
      kind: "video",
      label: "参考视频",
      mode: "reference",
      displayOrder: 40,
      description: "参考生视频使用的特征参考视频",
    }),
    createKlingV3OmniFixedSlot({
      id: "editVideo",
      kind: "video",
      label: "原视频",
      mode: "edit",
      displayOrder: 50,
      description: "视频编辑使用的原视频",
    }),
  ]),
  KLING_O1_HELP_TOOLTIP = [
    "Kling Video O1 视频生成",
    "[[red:@图片引用]]：O1\x20会把\x20@图片1\x20/\x20@图片2\x20解析为\x20<<<image_1>>>\x20/\x20<<<image_2>>>，用于在提示词中精确引用图片。",
    "[[red:参考图片]]：最多 2 张；如果同时接特征参考视频，只使用第 1 张参考图片。",
    "[[red:编辑视频\x20/\x20特征参考视频]]：两个视频槽互斥，只能接其中一个；视频需\x203-10\x20秒。",
    "提示词例子：让@图片1中的人物向镜头挥手，随后走向@图片2中的街景，镜头缓慢推进。",
  ]["join"]("\x0a"),
  KLING_O1_PROMPT_PLACEHOLDER =
    "描述视频内容，按 @ 引用参考图片。例如：让 @图片1 中的人物向镜头挥手，随后走向 @图片2 中的街景；接编辑视频时描述要改什么画面或风格。",
  KLING_O1_FIXED_INPUT_SLOTS = Object["freeze"]([
    Object["freeze"]({
      id: "editVideo",
      kind: "video",
      label: "编辑视频",
      description: "待编辑的原视频，需 3-10 秒；与特征参考视频互斥。",
      displayOrder: 10,
    }),
    Object["freeze"]({
      id: "featureReferenceVideo",
      kind: "video",
      label: "特征参考视频",
      description: "作为特征参考的视频，需\x203-10\x20秒；与编辑视频互斥。",
      displayOrder: 20,
    }),
    Object["freeze"]({
      id: "referenceImage",
      kind: "image",
      label: "参考图片",
      description:
        "O1 提示词里可用 @图片1 / @图片2 引用，提交时会转换为 <<<image_N>>>。",
      displayOrder: 30,
    }),
  ]),
  KLING_O1_VIDEO_EXCLUSIVE_GROUPS = Object["freeze"]([
    Object["freeze"]({
      id: "klingO1VideoInput",
      slots: Object["freeze"](["editVideo", "featureReferenceVideo"]),
      max: 1,
    }),
  ]),
  RUNNINGHUB_KLING_O1_GENERATION_MODE_FIELD = Object["freeze"]({
    id: "rh_kling_o1_generation_mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模式选择",
    description:
      "视频生成：支持文生、图生、首尾帧。\n参考生视频：接 1-7 张参考图和 1 个参考视频。",
    defaultValue: "frame",
    options: Object["freeze"]([
      Object["freeze"]({ value: "frame", label: "视频生成" }),
      Object["freeze"]({ value: "reference", label: "参考生视频" }),
      Object["freeze"]({ value: "edit", label: "视频编辑" }),
    ]),
  }),
  RUNNINGHUB_KLING_O1_RATIO_FIELD = Object["freeze"]({
    ...VIDEO_RATIO_FIELD,
    defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
    options: Object["freeze"]([
      APIMART_VIDEO_ADAPTIVE_RATIO_OPTION,
      Object["freeze"]({ value: "16:9", label: "16:9" }),
      Object["freeze"]({ value: "9:16", label: "9:16" }),
      Object["freeze"]({ value: "1:1", label: "1:1" }),
    ]),
  }),
  RUNNINGHUB_KLING_O1_KEEP_ORIGINAL_SOUND_FIELD = Object["freeze"]({
    ...KLING_O1_KEEP_ORIGINAL_SOUND_FIELD,
    showWhen: Object["freeze"]({
      field: "rh_kling_o1_generation_mode",
      values: Object["freeze"](["reference", "edit"]),
    }),
  }),
  RUNNINGHUB_KLING_O1_FRAME_HELP_TOOLTIP = [
    "RunningHub\x20Kling\x20O1\x20视频生成",
    "[[red:不接图]]：走文生视频接口。",
    "[[red:接 1 张首帧]]：走图生视频接口，把这张图作为视频起点。",
    "[[red:接首帧\x20+\x20尾帧]]：走首尾帧接口，中间变化由\x20O1\x20补齐。",
    "提示词例子：@图片1 中的人物慢慢转身，最后过渡到 @图片2 的夜晚街景，电影感，镜头缓慢推进。",
  ]["join"]("\x0a"),
  RUNNINGHUB_KLING_O1_REFERENCE_HELP_TOOLTIP = [
    "RunningHub Kling O1 参考生视频",
    "[[red:必须接\x201-7\x20张参考图\x20+\x201\x20个参考视频]]：参考图用于主体/风格，参考视频用于动作或镜头特征。",
    "[[red:保留原声]]：开启后提交 keepOriginalSound。",
    "提示词例子：参考 @图片1 的角色外观和 @视频1 的动作节奏，生成夜晚街道行走镜头。",
  ]["join"]("\x0a"),
  RUNNINGHUB_KLING_O1_EDIT_HELP_TOOLTIP = [
    "RunningHub Kling O1 视频编辑",
    "[[red:接\x201\x20个原视频]]：走官方\x20edit-video\x20接口。",
    "[[red:保留原声]]：开启后提交 keepOriginalSound。",
    "提示词里直接描述要修改的画面、元素或风格。",
  ]["join"]("\x0a"),
  RUNNINGHUB_KLING_O1_HELP_TOOLTIP = RUNNINGHUB_KLING_O1_FRAME_HELP_TOOLTIP,
  RUNNINGHUB_KLING_O1_FRAME_PROMPT_PLACEHOLDER =
    "不接素材时描述文生视频；接首帧/尾帧时可用 @图片1 / @图片2 指代。例如：让 @图片1 中的人物向镜头挥手，随后过渡到 @图片2 的街景。",
  RUNNINGHUB_KLING_O1_REFERENCE_PROMPT_PLACEHOLDER =
    "描述参考图和参考视频要生成的新画面。例如：参考 @图片1 的角色外观和 @视频1 的动作节奏，生成夜晚街道行走镜头。",
  RUNNINGHUB_KLING_O1_EDIT_PROMPT_PLACEHOLDER =
    "描述要对原视频做的编辑。例如：移除背景路人，将晴天改为电影感雨夜，并保持人物动作连贯。";
function createRunningHubKlingO1FixedSlot({
  id: v22,
  kind: v23,
  label: v24,
  mode: v25,
  description: v26,
  displayOrder: v27,
}) {
  const v28 =
    v25 === "reference" || v25 === "edit"
      ? {
          showWhen: Object["freeze"]({
            field: "rh_kling_o1_generation_mode",
            value: v25,
          }),
        }
      : {
          hideWhen: Object["freeze"]({
            field: "rh_kling_o1_generation_mode",
            values: Object["freeze"](["reference", "edit"]),
          }),
        };
  return Object["freeze"]({
    id: v22,
    kind: v23,
    label: v24,
    description: v26,
    displayOrder: v27,
    ...v28,
  });
}
const RUNNINGHUB_KLING_O1_FIXED_INPUT_SLOTS = Object["freeze"]([
    createRunningHubKlingO1FixedSlot({
      id: "firstFrame",
      kind: "image",
      label: "首帧",
      mode: "frame",
      displayOrder: 10,
      description: "图生视频或首尾帧使用的起始图片",
    }),
    createRunningHubKlingO1FixedSlot({
      id: "lastFrame",
      kind: "image",
      label: "尾帧",
      mode: "frame",
      displayOrder: 20,
      description: "可选，首尾帧使用的结束图片",
    }),
    createRunningHubKlingO1FixedSlot({
      id: "editVideo",
      kind: "video",
      label: "编辑视频",
      mode: "edit",
      displayOrder: 30,
      description: "官方 edit-video 使用的原视频",
    }),
    createRunningHubKlingO1FixedSlot({
      id: "referenceVideo",
      kind: "video",
      label: "参考视频",
      mode: "reference",
      displayOrder: 40,
      description: "参考生视频必填，作为动作或镜头特征参考",
    }),
    createRunningHubKlingO1FixedSlot({
      id: "referenceImage",
      kind: "image",
      label: "参考图",
      mode: "reference",
      displayOrder: 50,
      description: "参考生视频使用，支持\x201-7\x20张参考图",
    }),
  ]),
  RUNNINGHUB_KLING_O3_MODEL_FIELD = Object["freeze"]({
    ...KLING_V3_MODE_FIELD,
    id: "resolution",
    placement: "resolution",
    label: "质量",
    description: "720P=std，1080P=pro，4K=4K\x20版。",
    defaultValue: "std",
  }),
  RUNNINGHUB_KLING_O3_MODE_FIELD = Object["freeze"]({
    ...KLING_V3_OMNI_MODE_FIELD,
    description:
      "视频生成：支持文生、图生、首尾帧。\n参考生视频：接 1-7 张参考图，可选 1 个参考视频。\n视频编辑：基于原视频编辑，std/pro 可用。",
  }),
  RUNNINGHUB_KLING_O3_RATIO_FIELD = Object["freeze"]({
    ...createAspectRatioField({ options: ["16:9", "9:16", "1:1"] }),
    hideWhen: Object["freeze"]({ field: "kling_v3_omni_mode", value: "edit" }),
  }),
  RUNNINGHUB_KLING_O3_DURATION_FIELD = Object["freeze"]({
    ...createFooterDurationField({ defaultValue: 5, min: 3, max: 15 }),
    hideWhen: Object["freeze"]({ field: "kling_v3_omni_mode", value: "edit" }),
  }),
  RUNNINGHUB_KLING_O3_AUDIO_FIELD = Object["freeze"]({
    ...KLING_V3_AUDIO_FIELD,
    hideWhen: Object["freeze"]({ field: "kling_v3_omni_mode", value: "edit" }),
  }),
  RUNNINGHUB_KLING_O3_KEEP_ORIGINAL_SOUND_FIELD = Object["freeze"]({
    ...KLING_O1_KEEP_ORIGINAL_SOUND_FIELD,
    showWhen: Object["freeze"]({
      field: "kling_v3_omni_mode",
      values: Object["freeze"](["reference", "edit"]),
    }),
  }),
  RUNNINGHUB_KLING_O3_SHOT_TYPE_FIELD = Object["freeze"]({
    id: "shotType",
    type: "segmented",
    placement: "advanced",
    variant: "advancedRow",
    label: "镜头类型",
    defaultValue: "customize",
    options: Object["freeze"]([
      Object["freeze"]({ value: "customize", label: "自定义" }),
      Object["freeze"]({ value: "intelligence", label: "智能" }),
    ]),
    hideWhen: Object["freeze"]({ field: "kling_v3_omni_mode", value: "edit" }),
  }),
  RUNNINGHUB_KLING_O3_FRAME_HELP_TOOLTIP = [
    "RunningHub Kling O3 视频生成",
    "[[red:不接图]]：走文生视频接口。",
    "[[red:接 1 张首帧]]：走图生视频接口。",
    "[[red:接首帧 + 尾帧]]：std/pro 走首尾帧图生视频；4K 文档只公开首帧字段，暂只使用首帧。",
    "标准版 / 专业版 / 4K 可在模型选择里切换。",
  ]["join"]("\x0a"),
  RUNNINGHUB_KLING_O3_REFERENCE_HELP_TOOLTIP = [
    "RunningHub\x20Kling\x20O3\x20参考生视频",
    "[[red:接 1-7 张参考图]]：用于保持主体、风格或场景一致。",
    "[[red:可选参考视频]]：有参考视频时最多使用 4 张参考图。",
    "[[red:保留原声]]：开启后提交 keepOriginalSound。",
  ]["join"]("\x0a"),
  RUNNINGHUB_KLING_O3_EDIT_HELP_TOOLTIP = [
    "RunningHub\x20Kling\x20O3\x20视频编辑",
    "[[red:接 1 个原视频]]：基于原视频按提示词编辑画面。",
    "[[red:可选参考图]]：用于补充目标风格、主体或局部参考。",
    "[[red:4K 不支持编辑]]：请选择标准版或专业版。",
  ]["join"]("\x0a"),
  RUNNINGHUB_KLING_O3_HELP_TOOLTIP = RUNNINGHUB_KLING_O3_FRAME_HELP_TOOLTIP,
  RUNNINGHUB_KLING_O3_FRAME_PROMPT_PLACEHOLDER =
    "不接素材时描述文生视频；接首帧/尾帧时可用 @图片1 / @图片2 指代。例如：让 @图片1 中的人物向镜头挥手，随后过渡到 @图片2 的街景。",
  RUNNINGHUB_KLING_O3_REFERENCE_PROMPT_PLACEHOLDER =
    "描述参考图或参考视频要生成的新画面。例如：参考 @图片1 的角色外观和 @视频1 的动作节奏，生成夜晚街道行走镜头。",
  RUNNINGHUB_KLING_O3_EDIT_PROMPT_PLACEHOLDER =
    "描述要对原视频做什么编辑，可接参考图补充风格。例如：将原视频改成夜晚赛博朋克街道风格，保留人物动作和镜头节奏。";
function createRunningHubKlingO3FixedSlot({
  id: v29,
  kind: v30,
  label: v31,
  mode: v32,
  description: v33,
  displayOrder: v34,
  hideWhen: hideWhen = null,
}) {
  return Object["freeze"]({
    id: v29,
    kind: v30,
    label: v31,
    description: v33,
    displayOrder: v34,
    showWhen: Object["freeze"]({ field: "kling_v3_omni_mode", value: v32 }),
    ...(hideWhen ? { hideWhen: Object["freeze"](hideWhen) } : {}),
  });
}
const RUNNINGHUB_KLING_O3_FIXED_INPUT_SLOTS = Object["freeze"]([
    createRunningHubKlingO3FixedSlot({
      id: "firstFrame",
      kind: "image",
      label: "首帧",
      mode: "image",
      displayOrder: 10,
      description: "图生视频使用的起始图片",
    }),
    createRunningHubKlingO3FixedSlot({
      id: "lastFrame",
      kind: "image",
      label: "尾帧",
      mode: "image",
      displayOrder: 20,
      description: "可选，std/pro 首尾帧使用的结束图片",
      hideWhen: { field: "resolution", value: "4k" },
    }),
    createRunningHubKlingO3FixedSlot({
      id: "referenceVideo",
      kind: "video",
      label: "参考视频",
      mode: "reference",
      displayOrder: 30,
      description: "参考生视频可选，作为动作或镜头特征参考",
    }),
    createRunningHubKlingO3FixedSlot({
      id: "referenceImage",
      kind: "image",
      label: "参考图",
      mode: "reference",
      displayOrder: 40,
      description: "参考生视频使用，支持\x201-7\x20张参考图",
    }),
    createRunningHubKlingO3FixedSlot({
      id: "editVideo",
      kind: "video",
      label: "原视频",
      mode: "edit",
      displayOrder: 50,
      description: "视频编辑必填，作为待编辑原视频",
    }),
    createRunningHubKlingO3FixedSlot({
      id: "editRefImage",
      kind: "image",
      label: "参考图",
      mode: "edit",
      displayOrder: 60,
      description: "视频编辑可选，用于补充风格或主体参考",
    }),
  ]),
  RUNNINGHUB_KLING_V3_PROMPT_PLACEHOLDER =
    "不接素材时描述文生视频；接首帧或首尾帧时描述动作、运镜和过渡。4K 图生当前只使用首帧。",
  RUNNINGHUB_KLING_V3_HELP_TOOLTIP = [
    "RunningHub\x20Kling\x20V3.0",
    "[[red:不接图]]：走文生视频接口。",
    "[[red:接\x201\x20张首帧]]：走图生视频接口。",
    "[[red:接首帧 + 尾帧]]：std/pro 走首尾帧图生视频；4K 文档只公开 imageUrl，暂只使用首帧。",
    "版本选择对应\x20RunningHub\x20的\x20std\x20/\x20pro\x20/\x204K\x20endpoint。",
  ]["join"]("\x0a"),
  RUNNINGHUB_KLING_V3_MODEL_FIELD = Object["freeze"]({
    ...KLING_V3_MODE_FIELD,
    label: "模型选择",
    description: "std=720P，pro=1080P，4K=Kling\x20V3.0\x204K。",
  }),
  RUNNINGHUB_KLING_V3_RATIO_FIELD = Object["freeze"]({
    ...createAspectRatioField({ options: ["16:9", "9:16", "1:1"] }),
  }),
  RUNNINGHUB_KLING_V3_CFG_SCALE_FIELD = Object["freeze"]({
    id: "cfgScale",
    type: "slider",
    placement: "advanced",
    variant: "advancedRow",
    label: "CFG 引导系数",
    description: "RunningHub Kling V3.0 支持 0-1，默认 0.5。",
    defaultValue: 0.5,
    min: 0,
    max: 1,
    step: 0.1,
  }),
  RUNNINGHUB_KLING_V3_SHOT_TYPE_FIELD = Object["freeze"]({
    id: "shotType",
    type: "segmented",
    placement: "advanced",
    variant: "advancedRow",
    label: "镜头类型",
    defaultValue: "customize",
    options: Object["freeze"]([
      Object["freeze"]({ value: "customize", label: "自定义" }),
      Object["freeze"]({ value: "intelligence", label: "智能" }),
    ]),
  }),
  RUNNINGHUB_KLING_V3_FIXED_INPUT_SLOTS = Object["freeze"]([
    Object["freeze"]({
      id: "firstFrame",
      kind: "image",
      label: "首帧",
      description: "图生视频使用的起始图片。",
      displayOrder: 10,
    }),
    Object["freeze"]({
      id: "lastFrame",
      kind: "image",
      label: "尾帧",
      description: "std/pro 可选，4K 当前文档未公开尾帧字段。",
      displayOrder: 20,
      hideWhen: Object["freeze"]({ field: "resolution", value: "4k" }),
    }),
  ]),
  WAN27_MODE_FIELD = Object["freeze"]({
    id: "wan27_mode",
    type: "segmented",
    placement: "mode",
    variant: "sectionMenu",
    label: "模式选择",
    description: WAN27_HELP_TOOLTIP,
    defaultValue: "image",
    options: Object["freeze"]([
      Object["freeze"]({ value: "image", label: "图生视频" }),
      Object["freeze"]({ value: "video", label: "视频续写" }),
      Object["freeze"]({ value: "reference", label: "参考生视频" }),
      Object["freeze"]({ value: "edit", label: "视频编辑" }),
    ]),
  }),
  WAN27_PROMPT_EXTEND_FIELD = Object["freeze"]({
    ...VIDEO_PROMPT_EXTEND_FIELD,
    label: "prompt 智能改写",
  }),
  WAN27_NEGATIVE_PROMPT_FIELD = Object["freeze"]({
    ...VIDEO_NEGATIVE_PROMPT_FIELD,
    label: "反向提示词",
    defaultValue: "模糊、变形、低质量",
  }),
  VIDU_Q3_VIDEO_PROMPT_PLACEHOLDER =
    "不接图时描述文生视频；接 @图片1 是首帧，接 @图片1 + @图片2 是首尾帧。例如：@图片1 中的人物缓缓转身微笑，最后过渡到 @图片2 的构图。",
  VIDU_Q3_REFERENCE_PROMPT_PLACEHOLDER =
    "描述参考图的动作和镜头，外观由参考图决定。可用 @图片1、@图片2 指代素材。例如：@图片1 和 @图片2 中的角色在湖边相拥，镜头缓慢环绕。";
function createWan27FixedSlot({
  id: v35,
  kind: v36,
  label: v37,
  mode: v38,
  description: v39,
  displayOrder: v40,
  showWhen: v41,
}) {
  const v42 = Array["isArray"](v38)
      ? v38["map"]((v43) => String(v43 || "")["trim"]())["filter"](Boolean)
      : [String(v38 || "")["trim"]()]["filter"](Boolean),
    v44 = [];
  v44["push"](
    v42["length"] > 1
      ? Object["freeze"]({ field: "wan27_mode", values: Object["freeze"](v42) })
      : Object["freeze"]({ field: "wan27_mode", value: v42[0] || "" }),
  );
  const v45 =
    v41 ||
    (v44["length"] > 1
      ? Object["freeze"]({ all: Object["freeze"](v44) })
      : v44[0]);
  return Object["freeze"]({
    id: v35,
    kind: v36,
    label: v37,
    description: v39,
    displayOrder: v40,
    showWhen: v45,
  });
}
const WAN27_FIXED_INPUT_SLOTS = Object["freeze"]([
    createWan27FixedSlot({
      id: "firstFrame",
      kind: "image",
      label: "首帧",
      mode: "image",
      displayOrder: 10,
      description: "图生视频使用的首帧图片",
    }),
    createWan27FixedSlot({
      id: "lastFrame",
      kind: "image",
      label: "尾帧",
      mode: "image",
      displayOrder: 20,
      description: "可选，图生视频使用的尾帧图片",
    }),
    createWan27FixedSlot({
      id: "audio",
      kind: "audio",
      label: "音频",
      mode: "image",
      displayOrder: 70,
      description: "可选，2-30 秒且不超过 15MB",
    }),
    createWan27FixedSlot({
      id: "sourceVideo",
      kind: "video",
      label: "续写视频",
      mode: "video",
      displayOrder: 30,
      description: "视频续写使用，不能超过 10 秒",
    }),
    createWan27FixedSlot({
      id: "referenceImage",
      kind: "image",
      label: "参考图",
      mode: "reference",
      displayOrder: 40,
      description: "参考生视频使用的参考图片",
    }),
    createWan27FixedSlot({
      id: "referenceVideo",
      kind: "video",
      label: "参考视频",
      mode: Object["freeze"](["reference", "edit"]),
      displayOrder: 60,
      description: "参考生视频使用的参考视频",
    }),
    createWan27FixedSlot({
      id: "originalVideo",
      kind: "video",
      label: "原视频",
      mode: "edit",
      displayOrder: 50,
      description: "视频编辑使用的原视频，需为 2-10 秒",
    }),
    createWan27FixedSlot({
      id: "referenceAudio",
      kind: "audio",
      label: "音频",
      mode: "reference",
      displayOrder: 70,
      description: "可选，参考生视频使用的音色音频，2-30 秒且不超过 15MB",
    }),
  ]),
  RUNNINGHUB_WAN27_FIXED_INPUT_SLOTS = Object["freeze"]([
    createWan27FixedSlot({
      id: "firstFrame",
      kind: "image",
      label: "首帧",
      mode: "image",
      displayOrder: 10,
      description: "图生视频使用的首帧图片",
    }),
    createWan27FixedSlot({
      id: "lastFrame",
      kind: "image",
      label: "尾帧",
      mode: "image",
      displayOrder: 20,
      description: "可选，图生视频使用的尾帧图片",
    }),
    createWan27FixedSlot({
      id: "audio",
      kind: "audio",
      label: "音频",
      mode: Object["freeze"](["image", "video"]),
      displayOrder: 70,
      description: "可选，文生、图生或视频续写使用的音频",
    }),
    createWan27FixedSlot({
      id: "sourceVideo",
      kind: "video",
      label: "续写视频",
      mode: "video",
      displayOrder: 30,
      description: "视频续写使用，不能超过 10 秒",
    }),
    createWan27FixedSlot({
      id: "referenceImage",
      kind: "image",
      label: "参考图",
      mode: "reference",
      displayOrder: 40,
      description: "参考生视频使用的参考图片",
    }),
    createWan27FixedSlot({
      id: "referenceVideo",
      kind: "video",
      label: "参考视频",
      mode: "reference",
      displayOrder: 50,
      description: "参考生视频使用的参考视频",
    }),
    createWan27FixedSlot({
      id: "originalVideo",
      kind: "video",
      label: "原视频",
      mode: "edit",
      displayOrder: 50,
      description: "视频编辑使用的原视频，需为\x202-10\x20秒",
    }),
    createWan27FixedSlot({
      id: "editRefImage",
      kind: "image",
      label: "参考图",
      mode: "edit",
      displayOrder: 60,
      description: "视频编辑可选参考图，最多 3 张",
    }),
  ]);
function freezeOption(v46) {
  if (v46 && typeof v46 === "object" && !Array["isArray"](v46))
    return Object["freeze"]({ ...v46 });
  return Object["freeze"]({ value: v46, label: String(v46) });
}
function isAdaptiveRatioOptionValue(v47) {
  const v48 = String(v47 ?? "")["trim"](),
    v49 = v48["toLowerCase"]();
  return (
    v48 === APIMART_VIDEO_ADAPTIVE_RATIO_VALUE ||
    v49 === "auto" ||
    v49 === "adaptive" ||
    v49 === "default"
  );
}
function withAdaptiveRatioOption(v50 = []) {
  const v51 = Array["isArray"](v50) ? v50 : [],
    v52 = v51["some"]((v53) =>
      isAdaptiveRatioOptionValue(v53?.["value"] ?? v53),
    );
  return v52 ? v51 : [APIMART_VIDEO_ADAPTIVE_RATIO_OPTION, ...v51];
}
function createSegmentedField({
  id: v54,
  label: v55,
  defaultValue: v56,
  options: v57,
  placement: placement = "mode",
  variant: variant = "pillMenu",
}) {
  return Object["freeze"]({
    id: v54,
    type: "segmented",
    placement: placement,
    variant: variant,
    label: v55,
    defaultValue: v56,
    options: Object["freeze"](v57["map"](freezeOption)),
  });
}
function createDurationField({
  defaultValue: defaultValue = 5,
  min: min = 4,
  max: max = 15,
  label: label = VIDEO_DURATION_FIELD["label"],
} = {}) {
  return Object["freeze"]({
    ...VIDEO_DURATION_FIELD,
    label: label,
    defaultValue: defaultValue,
    min: min,
    max: max,
  });
}
function createDurationSliderOptionsField({
  values: v58,
  defaultValue: defaultValue = v58?.[0],
  label: label = VIDEO_DURATION_FIELD["label"],
  optionOverridesByValue: optionOverridesByValue = null,
} = {}) {
  const v59 = (Array["isArray"](v58) ? v58 : [])
      ["map"]((v60) => Number(v60))
      ["filter"](Number["isFinite"]),
    v61 = v59[0] ?? Number(defaultValue) ?? 1,
    v62 = v59[v59["length"] - 1] ?? v61;
  return Object["freeze"]({
    ...VIDEO_DURATION_FIELD,
    label: label,
    defaultValue: defaultValue,
    min: v61,
    max: v62,
    step: 1,
    options: Object["freeze"](
      v59["map"]((v63) =>
        Object["freeze"]({
          value: v63,
          label: v63 + "s",
          displayLabel: v63 + "S",
          ...(optionOverridesByValue?.[v63] || {}),
        }),
      ),
    ),
  });
}
function createDurationOptionsField(v64, v65 = v64[0]) {
  return createSegmentedField({
    id: "duration",
    label: VIDEO_DURATION_FIELD["label"],
    defaultValue: v65,
    options: v64["map"]((v66) => ({
      value: v66,
      label: v66 + "s",
      displayLabel: v66 + "S",
    })),
  });
}
function withResolutionPlacement(v67) {
  return Object["freeze"]({ ...v67, placement: "resolution" });
}
function createFooterDurationField(v68 = {}) {
  return withResolutionPlacement(createDurationField(v68));
}
function createFooterDurationSliderOptionsField(v69 = {}) {
  return withResolutionPlacement(createDurationSliderOptionsField(v69));
}
function createResolutionField({
  label: label = VIDEO_RESOLUTION_FIELD["label"],
  defaultValue: defaultValue = "720P",
  options: options = ["720P", "1080P"],
} = {}) {
  return Object["freeze"]({
    ...VIDEO_RESOLUTION_FIELD,
    label: label,
    defaultValue: defaultValue,
    options: Object["freeze"](options["map"](freezeOption)),
  });
}
function createAspectRatioField({
  label: label = VIDEO_RATIO_FIELD["label"],
  defaultValue: defaultValue = APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
  options: options = ["16:9", "9:16", "1:1", "4:3", "3:4"],
} = {}) {
  return Object["freeze"]({
    ...VIDEO_RATIO_FIELD,
    label: label,
    defaultValue: defaultValue,
    options: Object["freeze"](
      withAdaptiveRatioOption(options)["map"](freezeOption),
    ),
  });
}
function createVideoMenuExtension(v70, v71 = "") {
  return Object["freeze"]({
    videoMenu: Object["freeze"]({
      role: "apimartModel",
      order: v70,
      subtitle: v71,
    }),
  });
}
function createVideoInputSlots({
  image: image = 9,
  video: video = 3,
  audio: audio = 3,
  minImage: minImage = 0,
  fixedSlots: fixedSlots = null,
  exclusiveGroups: exclusiveGroups = null,
  cycleFixedInputWhenFull: cycleFixedInputWhenFull = false,
} = {}) {
  const v72 = ["text"],
    v73 = {};
  image > 0 && (v72["push"]("image"), (v73["image"] = image));
  video > 0 && (v72["push"]("video"), (v73["video"] = video));
  audio > 0 && (v72["push"]("audio"), (v73["audio"] = audio));
  const v74 = {
    allowedKinds: Object["freeze"](v72),
    minByKind: Object["freeze"]({
      text: 0,
      ...(minImage > 0 ? { image: minImage } : {}),
    }),
    maxByKind: Object["freeze"](v73),
  };
  return (
    Array["isArray"](fixedSlots) &&
      fixedSlots["length"] > 0 &&
      (v74["fixedSlots"] = Object["freeze"](
        fixedSlots["map"]((v75) => Object["freeze"]({ ...v75 })),
      )),
    Array["isArray"](exclusiveGroups) &&
      exclusiveGroups["length"] > 0 &&
      (v74["exclusiveGroups"] = Object["freeze"](
        exclusiveGroups["map"]((v76) =>
          Object["freeze"]({
            ...v76,
            slots: Object["freeze"](
              (Array["isArray"](v76?.["slots"]) ? v76["slots"] : [])
                ["map"]((v77) => String(v77 || "")["trim"]())
                ["filter"](Boolean),
            ),
          }),
        ),
      )),
    cycleFixedInputWhenFull === true && (v74["cycleFixedInputWhenFull"] = true),
    Object["freeze"](v74)
  );
}
const VIDEO_SIZE_RATIO_POLICY = Object["freeze"]({ capability: "size" }),
  SEEDANCE_VIDEO_RATIO_POLICY = Object["freeze"]({
    capability: "size",
    ratios: Object["freeze"](["1:1", "3:4", "16:9", "4:3", "9:16", "21:9"]),
  }),
  VOLCENGINE_SEEDANCE_VIDEO_RATIO_POLICY = Object["freeze"]({
    ...SEEDANCE_VIDEO_RATIO_POLICY,
    preserveAdaptive: true,
  });
function freezeBodyMapping(v78) {
  return Object["freeze"](
    v78["map"]((v79) =>
      Object["freeze"]({
        ...v79,
        ...(Array["isArray"](v79["field"])
          ? { field: Object["freeze"](v79["field"]) }
          : {}),
      }),
    ),
  );
}
const APIMART_VIDEO_BASE_BODY_MAPPING = Object["freeze"]([
  Object["freeze"]({ path: "model", from: "model" }),
  Object["freeze"]({ path: "prompt", from: "prompt" }),
]);
function createApimartVideoBodyMapping(v80 = []) {
  return freezeBodyMapping([...APIMART_VIDEO_BASE_BODY_MAPPING, ...v80]);
}
const APIMART_VIDEO_LEGACY_BODY_MAPPING = Object["freeze"]([
    Object["freeze"]({ path: "model", from: "model" }),
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "size",
      from: "param",
      field: Object["freeze"]([
        "generationParams.aspectRatio",
        "aspectRatio",
        "size",
      ]),
      defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
      transform: "apimartVideoRatio",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "quality",
      from: "param",
      field: "videoSize",
      defaultValue: "standard",
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: "duration",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: "resolution",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "image_urls",
      from: "inputImages",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "video_url",
      from: "inputVideos",
      transform: "first",
      omitWhenEmpty: true,
    }),
  ]),
  APIMART_VIDEO_ASPECT_RATIO_ENTRY = Object["freeze"]({
    path: "aspect_ratio",
    from: "param",
    field: Object["freeze"]([
      "generationParams.aspectRatio",
      "aspectRatio",
      "aspect_ratio",
    ]),
    defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
    transform: "apimartVideoRatio",
    omitWhenEmpty: true,
  }),
  APIMART_VIDEO_SIZE_ENTRY = Object["freeze"]({
    path: "size",
    from: "param",
    field: Object["freeze"]([
      "generationParams.aspectRatio",
      "aspectRatio",
      "size",
    ]),
    defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
    transform: "apimartVideoRatio",
    omitWhenEmpty: true,
  }),
  APIMART_VIDEO_DURATION_ENTRY = Object["freeze"]({
    path: "duration",
    from: "param",
    field: Object["freeze"](["generationParams.duration", "duration"]),
    omitWhenEmpty: true,
  }),
  APIMART_VIDEO_RESOLUTION_UPPER_ENTRY = Object["freeze"]({
    path: "resolution",
    from: "param",
    field: Object["freeze"](["generationParams.resolution", "resolution"]),
    defaultValue: "720P",
    transform: "apimartVideoResolutionUpper",
  }),
  APIMART_VIDEO_RESOLUTION_UPPER_1080_ENTRY = Object["freeze"]({
    ...APIMART_VIDEO_RESOLUTION_UPPER_ENTRY,
    defaultValue: "1080P",
  }),
  APIMART_VIDEO_RESOLUTION_LOWER_ENTRY = Object["freeze"]({
    path: "resolution",
    from: "param",
    field: Object["freeze"](["generationParams.resolution", "resolution"]),
    defaultValue: "720p",
    transform: "apimartVideoResolutionLower",
  }),
  APIMART_VIDEO_RESOLUTION_VEO3_ENTRY = Object["freeze"]({
    path: "resolution",
    from: "param",
    field: Object["freeze"](["generationParams.resolution", "resolution"]),
    defaultValue: "720p",
    transform: "apimartVeo3VideoResolution",
  }),
  APIMART_VIDEO_RESOLUTION_4K_ENTRY = Object["freeze"]({
    ...APIMART_VIDEO_RESOLUTION_VEO3_ENTRY,
  }),
  APIMART_VIDEO_RESOLUTION_VIDU_ENTRY = Object["freeze"]({
    path: "resolution",
    from: "param",
    field: Object["freeze"](["generationParams.resolution", "resolution"]),
    defaultValue: "720p",
    transform: "apimartViduVideoResolution",
  }),
  APIMART_VIDEO_IMAGE_URLS_ENTRY = Object["freeze"]({
    path: "image_urls",
    from: "inputImages",
    omitWhenEmpty: true,
  }),
  APIMART_VIDEO_VEO3_IMAGE_URLS_ENTRY = Object["freeze"]({
    path: "image_urls",
    from: "inputImages",
    omitWhenEmpty: true,
  }),
  APIMART_VIDEO_AUDIO_URL_ENTRY = Object["freeze"]({
    path: "audio_url",
    from: "inputAudios",
    transform: "first",
    omitWhenEmpty: true,
  }),
  APIMART_VIDEO_NEGATIVE_PROMPT_ENTRY = Object["freeze"]({
    path: "negative_prompt",
    from: "param",
    field: Object["freeze"]([
      "generationParams.negative_prompt",
      "negative_prompt",
    ]),
    transform: "apimartOptionalText",
    omitWhenEmpty: true,
  }),
  APIMART_VIDEO_SEED_ENTRY = Object["freeze"]({
    path: "seed",
    from: "param",
    field: Object["freeze"](["generationParams.seed", "seed"]),
    transform: "apimartOptionalInteger",
    omitWhenEmpty: true,
  }),
  APIMART_VIDEO_AUDIO_ENTRY = Object["freeze"]({
    path: "audio",
    from: "param",
    field: Object["freeze"](["generationParams.audio", "audio"]),
    defaultValue: false,
    transform: "booleanParam",
  }),
  APIMART_VIDEO_KEEP_ORIGINAL_SOUND_ENTRY = Object["freeze"]({
    path: "keep_original_sound",
    from: "param",
    field: Object["freeze"]([
      "generationParams.keep_original_sound",
      "keep_original_sound",
    ]),
    defaultValue: false,
    transform: "booleanParam",
  }),
  APIMART_VIDEO_AUDIO_TRUE_ENTRY = Object["freeze"]({
    ...APIMART_VIDEO_AUDIO_ENTRY,
    defaultValue: true,
  }),
  APIMART_VIDEO_WATERMARK_ENTRY = Object["freeze"]({
    path: "watermark",
    from: "param",
    field: Object["freeze"](["generationParams.watermark", "watermark"]),
    defaultValue: false,
    transform: "booleanParam",
  }),
  APIMART_VIDEO_PROMPT_EXTEND_ENTRY = Object["freeze"]({
    path: "prompt_extend",
    from: "param",
    field: Object["freeze"]([
      "generationParams.prompt_extend",
      "prompt_extend",
    ]),
    defaultValue: true,
    transform: "booleanParam",
  }),
  APIMART_VIDEO_ENABLE_GIF_ENTRY = Object["freeze"]({
    path: "enable_gif",
    from: "param",
    field: Object["freeze"](["generationParams.enable_gif", "enable_gif"]),
    defaultValue: false,
    transform: "booleanParam",
  }),
  APIMART_VIDEO_PROMPT_OPTIMIZER_ENTRY = Object["freeze"]({
    path: "prompt_optimizer",
    from: "param",
    field: Object["freeze"]([
      "generationParams.prompt_optimizer",
      "prompt_optimizer",
    ]),
    defaultValue: true,
    transform: "booleanParam",
  }),
  APIMART_VIDEO_FAST_PRETREATMENT_ENTRY = Object["freeze"]({
    path: "fast_pretreatment",
    from: "param",
    field: Object["freeze"]([
      "generationParams.fast_pretreatment",
      "fast_pretreatment",
    ]),
    defaultValue: false,
    transform: "booleanParam",
  }),
  APIMART_VIDEO_GENERATION_TYPE_ENTRY = Object["freeze"]({
    path: "generation_type",
    from: "param",
    field: Object["freeze"]([
      "generationParams.generation_type",
      "generation_type",
    ]),
    defaultValue: "frame",
    omitWhenEmpty: true,
  }),
  APIMART_VIDEO_SHOT_TYPE_ENTRY = Object["freeze"]({
    path: "shot_type",
    from: "param",
    field: Object["freeze"](["generationParams.shot_type", "shot_type"]),
    defaultValue: "single",
  }),
  APIMART_VIDEO_VEO3_BODY_MAPPING = createApimartVideoBodyMapping([
    APIMART_VIDEO_ASPECT_RATIO_ENTRY,
    APIMART_VIDEO_GENERATION_TYPE_ENTRY,
    APIMART_VIDEO_DURATION_ENTRY,
    APIMART_VIDEO_RESOLUTION_VEO3_ENTRY,
    APIMART_VIDEO_VEO3_IMAGE_URLS_ENTRY,
    APIMART_VIDEO_ENABLE_GIF_ENTRY,
  ]),
  APIMART_VIDEO_HAILUO_02_BODY_MAPPING = createApimartVideoBodyMapping([
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "768p",
      transform: "apimartHailuoVideoResolution",
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 5,
      transform: "apimartHailuoVideoDuration",
    }),
    Object["freeze"]({
      path: "first_frame_image",
      from: "inputImages",
      transform: "first",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "last_frame_image",
      from: "inputImages",
      transform: "second",
      omitWhenEmpty: true,
    }),
    APIMART_VIDEO_PROMPT_OPTIMIZER_ENTRY,
    APIMART_VIDEO_FAST_PRETREATMENT_ENTRY,
    APIMART_VIDEO_WATERMARK_ENTRY,
  ]),
  APIMART_VIDEO_HAILUO_23_BODY_MAPPING = createApimartVideoBodyMapping([
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "768p",
      transform: "apimartHailuo23VideoResolution",
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 6,
      transform: "apimartHailuo23VideoDuration",
    }),
    Object["freeze"]({
      path: "first_frame_image",
      from: "inputImages",
      transform: "first",
      omitWhenEmpty: true,
    }),
    APIMART_VIDEO_PROMPT_OPTIMIZER_ENTRY,
    APIMART_VIDEO_FAST_PRETREATMENT_ENTRY,
    APIMART_VIDEO_WATERMARK_ENTRY,
  ]),
  APIMART_VIDEO_HAPPYHORSE_BODY_MAPPING = createApimartVideoBodyMapping([
    APIMART_VIDEO_SIZE_ENTRY,
    APIMART_VIDEO_DURATION_ENTRY,
    APIMART_VIDEO_RESOLUTION_UPPER_1080_ENTRY,
    APIMART_VIDEO_WATERMARK_ENTRY,
    APIMART_VIDEO_SEED_ENTRY,
  ]),
  RUNNINGHUB_VIDEO_HAPPYHORSE_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "happyhorse_mode",
      from: "param",
      field: Object["freeze"]([
        "generationParams.happyhorse_mode",
        "happyhorse_mode",
      ]),
      defaultValue: "auto",
    }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "1080P",
      transform: "runninghubHappyHorseResolution",
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 5,
      transform: "runninghubHappyHorseDuration",
    }),
    Object["freeze"]({
      path: "aspectRatio",
      from: "param",
      field: Object["freeze"](["generationParams.aspectRatio", "aspectRatio"]),
      defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
      transform: "runninghubHappyHorseAspectRatio",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "audioSetting",
      from: "param",
      field: Object["freeze"]([
        "generationParams.audio_setting",
        "generationParams.audioSetting",
        "audio_setting",
        "audioSetting",
      ]),
      defaultValue: "auto",
      transform: "runninghubHappyHorseAudioSetting",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "seed",
      from: "param",
      field: Object["freeze"](["generationParams.seed", "seed"]),
      transform: "apimartOptionalInteger",
      omitWhenEmpty: true,
    }),
  ]),
  RUNNINGHUB_VIDEO_SEEDANCE_2_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "rh_seedance_2_model",
      from: "param",
      field: Object["freeze"]([
        "generationParams.rh_seedance_2_model",
        "rh_seedance_2_model",
      ]),
      defaultValue: "fast",
    }),
    Object["freeze"]({
      path: "rh_seedance_2_mode",
      from: "param",
      field: Object["freeze"]([
        "generationParams.rh_seedance_2_mode",
        "rh_seedance_2_mode",
      ]),
      defaultValue: "text2video",
    }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "720p",
      transform: "runninghubSeedance2Resolution",
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 5,
      transform: "runninghubSeedance2Duration",
    }),
    Object["freeze"]({
      path: "ratio",
      from: "param",
      field: Object["freeze"]([
        "generationParams.aspectRatio",
        "aspectRatio",
        "ratio",
      ]),
      defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
      transform: "runninghubSeedance2Ratio",
    }),
    Object["freeze"]({
      path: "generateAudio",
      from: "param",
      field: Object["freeze"]([
        "generationParams.generateAudio",
        "generateAudio",
      ]),
      defaultValue: true,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "webSearch",
      from: "param",
      field: Object["freeze"](["generationParams.webSearch", "webSearch"]),
      defaultValue: false,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "realPersonMode",
      from: "param",
      field: Object["freeze"]([
        "generationParams.realPersonMode",
        "realPersonMode",
      ]),
      defaultValue: false,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "conversionSlots",
      from: "constant",
      value: Object["freeze"](["all"]),
    }),
    Object["freeze"]({
      path: "returnLastFrame",
      from: "param",
      field: Object["freeze"]([
        "generationParams.returnLastFrame",
        "returnLastFrame",
      ]),
      defaultValue: false,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "seed",
      from: "param",
      field: Object["freeze"](["generationParams.seed", "seed"]),
      transform: "apimartOptionalInteger",
      omitWhenEmpty: true,
    }),
  ]),
  APIMART_VIDEO_WAN27_BODY_MAPPING = createApimartVideoBodyMapping([
    APIMART_VIDEO_SIZE_ENTRY,
    APIMART_VIDEO_DURATION_ENTRY,
    APIMART_VIDEO_RESOLUTION_UPPER_1080_ENTRY,
    APIMART_VIDEO_IMAGE_URLS_ENTRY,
    APIMART_VIDEO_NEGATIVE_PROMPT_ENTRY,
    Object["freeze"]({
      path: "video_urls",
      from: "inputVideos",
      omitWhenEmpty: true,
    }),
    APIMART_VIDEO_AUDIO_URL_ENTRY,
    APIMART_VIDEO_PROMPT_EXTEND_ENTRY,
    APIMART_VIDEO_WATERMARK_ENTRY,
    APIMART_VIDEO_SEED_ENTRY,
  ]),
  APIMART_VIDEO_KLING_4K_BODY_MAPPING = createApimartVideoBodyMapping([
    Object["freeze"]({
      path: "mode",
      from: "param",
      field: Object["freeze"](["generationParams.mode", "mode"]),
      defaultValue: "std",
      transform: "apimartKlingVideoMode4k",
    }),
    APIMART_VIDEO_DURATION_ENTRY,
    APIMART_VIDEO_ASPECT_RATIO_ENTRY,
    APIMART_VIDEO_IMAGE_URLS_ENTRY,
    APIMART_VIDEO_AUDIO_ENTRY,
    APIMART_VIDEO_WATERMARK_ENTRY,
    APIMART_VIDEO_NEGATIVE_PROMPT_ENTRY,
  ]),
  APIMART_VIDEO_KLING_V3_BODY_MAPPING = createApimartVideoBodyMapping([
    Object["freeze"]({
      path: "mode",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "std",
      transform: "apimartKlingVideoMode4k",
    }),
    APIMART_VIDEO_DURATION_ENTRY,
    APIMART_VIDEO_ASPECT_RATIO_ENTRY,
    APIMART_VIDEO_IMAGE_URLS_ENTRY,
    APIMART_VIDEO_AUDIO_ENTRY,
    APIMART_VIDEO_WATERMARK_ENTRY,
    APIMART_VIDEO_NEGATIVE_PROMPT_ENTRY,
  ]),
  APIMART_VIDEO_KLING_O1_BODY_MAPPING = createApimartVideoBodyMapping([
    Object["freeze"]({
      path: "mode",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "std",
      transform: "apimartKlingVideoMode",
    }),
    APIMART_VIDEO_DURATION_ENTRY,
    APIMART_VIDEO_ASPECT_RATIO_ENTRY,
    APIMART_VIDEO_IMAGE_URLS_ENTRY,
    APIMART_VIDEO_KEEP_ORIGINAL_SOUND_ENTRY,
  ]),
  RUNNINGHUB_VIDEO_KLING_O1_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "rh_kling_o1_generation_mode",
      from: "param",
      field: Object["freeze"]([
        "generationParams.rh_kling_o1_generation_mode",
        "rh_kling_o1_generation_mode",
      ]),
      defaultValue: "frame",
    }),
    Object["freeze"]({
      path: "mode",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "std",
      transform: "runninghubKlingVideoMode",
    }),
    Object["freeze"]({
      path: "aspectRatio",
      from: "param",
      field: Object["freeze"](["generationParams.aspectRatio", "aspectRatio"]),
      defaultValue: "9:16",
      transform: "runninghubKlingO1AspectRatio",
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 5,
      transform: "runninghubKlingO1Duration",
    }),
    Object["freeze"]({
      path: "keepOriginalSound",
      from: "param",
      field: Object["freeze"]([
        "generationParams.keepOriginalSound",
        "generationParams.keep_original_sound",
        "keepOriginalSound",
        "keep_original_sound",
      ]),
      defaultValue: false,
      transform: "booleanParam",
    }),
  ]),
  RUNNINGHUB_VIDEO_KLING_O3_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "kling_v3_omni_mode",
      from: "param",
      field: Object["freeze"]([
        "generationParams.kling_v3_omni_mode",
        "kling_v3_omni_mode",
      ]),
      defaultValue: "image",
    }),
    Object["freeze"]({
      path: "rh_kling_o3_model",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "std",
      transform: "runninghubKlingO3Model",
    }),
    Object["freeze"]({
      path: "aspectRatio",
      from: "param",
      field: Object["freeze"](["generationParams.aspectRatio", "aspectRatio"]),
      defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
      transform: "runninghubKlingO3AspectRatio",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 5,
      transform: "runninghubKlingO3Duration",
    }),
    Object["freeze"]({
      path: "sound",
      from: "param",
      field: Object["freeze"]([
        "generationParams.audio",
        "generationParams.sound",
        "audio",
        "sound",
      ]),
      defaultValue: false,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "keepOriginalSound",
      from: "param",
      field: Object["freeze"]([
        "generationParams.keepOriginalSound",
        "generationParams.keep_original_sound",
        "keepOriginalSound",
        "keep_original_sound",
      ]),
      defaultValue: false,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "multiShot",
      from: "param",
      field: Object["freeze"]([
        "generationParams.multiShot",
        "generationParams.multi_shot",
        "multiShot",
        "multi_shot",
      ]),
      defaultValue: false,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "shotType",
      from: "param",
      field: Object["freeze"](["generationParams.shotType", "shotType"]),
      defaultValue: "customize",
      transform: "runninghubKlingO3ShotType",
    }),
  ]),
  RUNNINGHUB_VIDEO_KLING_V3_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "rh_kling_v3_model",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "std",
      transform: "runninghubKlingV3Model",
    }),
    Object["freeze"]({
      path: "aspectRatio",
      from: "param",
      field: Object["freeze"](["generationParams.aspectRatio", "aspectRatio"]),
      defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
      transform: "runninghubKlingV3AspectRatio",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 5,
      transform: "runninghubKlingV3Duration",
    }),
    Object["freeze"]({
      path: "cfgScale",
      from: "param",
      field: Object["freeze"](["generationParams.cfgScale", "cfgScale"]),
      defaultValue: 0.5,
      transform: "runninghubKlingV3CfgScale",
    }),
    Object["freeze"]({
      path: "sound",
      from: "param",
      field: Object["freeze"]([
        "generationParams.audio",
        "generationParams.sound",
        "audio",
        "sound",
      ]),
      defaultValue: false,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "multiShot",
      from: "param",
      field: Object["freeze"]([
        "generationParams.multiShot",
        "generationParams.multi_shot",
        "multiShot",
        "multi_shot",
      ]),
      defaultValue: false,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "shotType",
      from: "param",
      field: Object["freeze"](["generationParams.shotType", "shotType"]),
      defaultValue: "customize",
      transform: "runninghubKlingV3ShotType",
    }),
    Object["freeze"]({
      path: "negativePrompt",
      from: "param",
      field: Object["freeze"]([
        "generationParams.negative_prompt",
        "generationParams.negativePrompt",
        "negative_prompt",
        "negativePrompt",
      ]),
      transform: "apimartOptionalText",
      omitWhenEmpty: true,
    }),
  ]),
  RUNNINGHUB_VIDEO_VEO3_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "rh_veo3_channel",
      from: "param",
      field: Object["freeze"]([
        "generationParams.rh_veo3_channel",
        "rh_veo3_channel",
      ]),
      defaultValue: "lowCost",
    }),
    Object["freeze"]({
      path: "mode",
      from: "param",
      field: Object["freeze"](["generationParams.mode", "mode"]),
      defaultValue: "fast",
    }),
    Object["freeze"]({
      path: "generation_type",
      from: "param",
      field: Object["freeze"]([
        "generationParams.generation_type",
        "generation_type",
      ]),
      defaultValue: "frame",
    }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "720p",
      transform: "runninghubVeo3Resolution",
    }),
    Object["freeze"]({
      path: "aspectRatio",
      from: "param",
      field: Object["freeze"](["generationParams.aspectRatio", "aspectRatio"]),
      defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
      transform: "runninghubVeo3AspectRatio",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 8,
      transform: "runninghubVeo3Duration",
    }),
    Object["freeze"]({
      path: "generateAudio",
      from: "param",
      field: Object["freeze"]([
        "generationParams.generateAudio",
        "generationParams.generate_audio",
        "generateAudio",
        "generate_audio",
      ]),
      defaultValue: false,
      transform: "booleanParam",
    }),
  ]),
  RUNNINGHUB_VIDEO_WAN27_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "wan27_mode",
      from: "param",
      field: Object["freeze"](["generationParams.wan27_mode", "wan27_mode"]),
      defaultValue: "image",
    }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "720P",
      transform: "runninghubWan27Resolution",
    }),
    Object["freeze"]({
      path: "aspectRatio",
      from: "param",
      field: Object["freeze"](["generationParams.aspectRatio", "aspectRatio"]),
      defaultValue: APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
      transform: "runninghubWan27AspectRatio",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 5,
      transform: "runninghubWan27Duration",
    }),
    Object["freeze"]({
      path: "promptExtend",
      from: "param",
      field: Object["freeze"]([
        "generationParams.prompt_extend",
        "generationParams.promptExtend",
        "prompt_extend",
        "promptExtend",
      ]),
      defaultValue: true,
      transform: "booleanParam",
    }),
    Object["freeze"]({
      path: "negativePrompt",
      from: "param",
      field: Object["freeze"]([
        "generationParams.negative_prompt",
        "generationParams.negativePrompt",
        "negative_prompt",
        "negativePrompt",
      ]),
      transform: "apimartOptionalText",
      omitWhenEmpty: true,
    }),
    Object["freeze"]({
      path: "audioUrl",
      from: "inputAudios",
      transform: "first",
      omitWhenEmpty: true,
    }),
  ]),
  RUNNINGHUB_VIDEO_HAILUO_02_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "rh_hailuo_02_quality",
      from: "param",
      field: Object["freeze"]([
        "generationParams.rh_hailuo_02_quality",
        "rh_hailuo_02_quality",
      ]),
      defaultValue: "standard",
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 6,
      transform: "runninghubHailuo02Duration",
    }),
    Object["freeze"]({
      path: "enablePromptExpansion",
      from: "param",
      field: Object["freeze"]([
        "generationParams.enablePromptExpansion",
        "generationParams.enable_prompt_expansion",
        "enablePromptExpansion",
        "enable_prompt_expansion",
      ]),
      defaultValue: true,
      transform: "booleanParam",
    }),
  ]),
  RUNNINGHUB_VIDEO_HAILUO_23_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "rh_hailuo_23_quality",
      from: "param",
      field: Object["freeze"]([
        "generationParams.rh_hailuo_23_quality",
        "rh_hailuo_23_quality",
      ]),
      defaultValue: "standard",
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 6,
      transform: "runninghubHailuo23Duration",
    }),
    Object["freeze"]({
      path: "enablePromptExpansion",
      from: "param",
      field: Object["freeze"]([
        "generationParams.enablePromptExpansion",
        "generationParams.enable_prompt_expansion",
        "enablePromptExpansion",
        "enable_prompt_expansion",
      ]),
      defaultValue: true,
      transform: "booleanParam",
    }),
  ]),
  APIMART_VIDEO_VIDU_BODY_MAPPING = createApimartVideoBodyMapping([
    Object["freeze"]({
      ...APIMART_VIDEO_DURATION_ENTRY,
      defaultValue: 5,
      transform: "apimartViduVideoDuration",
    }),
    APIMART_VIDEO_RESOLUTION_VIDU_ENTRY,
    APIMART_VIDEO_ASPECT_RATIO_ENTRY,
    APIMART_VIDEO_IMAGE_URLS_ENTRY,
    APIMART_VIDEO_AUDIO_TRUE_ENTRY,
    APIMART_VIDEO_SEED_ENTRY,
  ]),
  APIMART_VIDEO_GROK_IMAGINE_BODY_MAPPING = createApimartVideoBodyMapping([
    APIMART_VIDEO_SIZE_ENTRY,
    Object["freeze"]({
      ...APIMART_VIDEO_DURATION_ENTRY,
      defaultValue: 6,
      transform: Object["freeze"]({
        name: "integerRange",
        min: 6,
        max: 30,
        fallback: 6,
      }),
    }),
    Object["freeze"]({
      path: "quality",
      from: "param",
      field: Object["freeze"](["generationParams.quality", "quality"]),
      defaultValue: "480p",
    }),
    APIMART_VIDEO_IMAGE_URLS_ENTRY,
  ]),
  APIMART_VIDEO_OMNI_FLASH_BODY_MAPPING = createApimartVideoBodyMapping([
    Object["freeze"]({ ...APIMART_VIDEO_DURATION_ENTRY, defaultValue: 6 }),
    APIMART_VIDEO_RESOLUTION_4K_ENTRY,
    APIMART_VIDEO_ASPECT_RATIO_ENTRY,
    Object["freeze"]({
      ...APIMART_VIDEO_IMAGE_URLS_ENTRY,
      transform: Object["freeze"]({
        name: "imageCountOptions",
        allowedCounts: Object["freeze"]([1, 3]),
        label: "Gemini\x20Omni\x20Flash",
      }),
    }),
  ]),
  VOLCENGINE_VIDEO_SEEDANCE_2_BODY_MAPPING = freezeBodyMapping([
    Object["freeze"]({ path: "prompt", from: "prompt" }),
    Object["freeze"]({
      path: "volcengine_seedance_2_mode",
      from: "param",
      field: Object["freeze"]([
        "generationParams.volcengine_seedance_2_mode",
        "volcengine_seedance_2_mode",
      ]),
      defaultValue: "multimodal2video",
    }),
    Object["freeze"]({
      path: "resolution",
      from: "param",
      field: Object["freeze"](["generationParams.resolution", "resolution"]),
      defaultValue: "720p",
    }),
    Object["freeze"]({
      path: "ratio",
      from: "param",
      field: Object["freeze"]([
        "generationParams.aspectRatio",
        "aspectRatio",
        "ratio",
      ]),
      defaultValue: "adaptive",
    }),
    Object["freeze"]({
      path: "duration",
      from: "param",
      field: Object["freeze"](["generationParams.duration", "duration"]),
      defaultValue: 5,
    }),
    Object["freeze"]({
      path: "generate_audio",
      from: "param",
      field: Object["freeze"]([
        "generationParams.generateAudio",
        "generationParams.generate_audio",
        "generateAudio",
        "generate_audio",
      ]),
      defaultValue: true,
    }),
    Object["freeze"]({
      path: "seed",
      from: "param",
      field: Object["freeze"](["generationParams.seed", "seed"]),
      omitWhenEmpty: true,
    }),
  ]),
  APIMART_VIDEO_RESPONSE_MAPPING = Object["freeze"]({
    taskIdPath: Object["freeze"](["data[].task_id", "task_id", "taskId"]),
    statusPath: "status",
    errorPath: "error",
    resultPaths: Object["freeze"]([
      "result.videos[].url",
      "data.result.videos[].url",
      "results[].videoUrl",
      "results[].url",
      "url",
    ]),
  }),
  RUNNINGHUB_VIDEO_RESPONSE_MAPPING = Object["freeze"]({
    taskIdPath: Object["freeze"](["taskId", "data.taskId", "data[].taskId"]),
    statusPath: "status",
    errorPath: "errorMessage",
    resultPaths: Object["freeze"]([
      "results[].url",
      "results[].videoUrl",
      "data.results[].url",
      "url",
    ]),
  }),
  VOLCENGINE_VIDEO_RESPONSE_MAPPING = Object["freeze"]({
    taskIdPath: Object["freeze"](["id", "data.id"]),
    statusPath: "status",
    errorPath: "error.message",
    resultPaths: Object["freeze"]([
      "content.video_url",
      "content.videoUrl",
      "data.content.video_url",
      "data.content.videoUrl",
    ]),
  }),
  APIMART_VIDEO_TASK_POLLING = Object["freeze"]({
    mode: "task-proxy",
    method: "GET",
    urlTemplate: "{baseUrl}/v1/tasks/{taskId}?language=zh",
    headersMode: "bearer",
  }),
  VOLCENGINE_VIDEO_TASK_POLLING = Object["freeze"]({
    mode: "task-proxy",
    method: "GET",
    urlTemplate: "{baseUrl}/contents/generations/tasks/{taskId}",
    headersMode: "bearer",
  }),
  APIMART_SEEDANCE_VIDEO_RESOLVERS = Object["freeze"]({
    bodyResolver: "apimartSeedanceVideo",
  }),
  VOLCENGINE_SEEDANCE_VIDEO_RESOLVERS = Object["freeze"]({
    bodyResolver: "volcengineSeedance2Video",
  }),
  APIMART_SEEDANCE_2_0_VIDEO_POLICY = Object["freeze"]({
    ratioField: "size",
    defaultResolution: "720p",
    supportsVideoReferences: true,
    supportsAudioReferences: true,
    maxRoleImageCount: 2,
    maxImageCount: 9,
    maxVideoReferenceCount: 3,
    maxAudioReferenceCount: 3,
    privateAvatarAssets: Object["freeze"]({
      enabled: true,
      provider: "apimart",
      capability: "seedance2PrivateAvatar",
      models: Object["freeze"]([
        "doubao-seedance-2.0",
        "doubao-seedance-2.0-fast",
      ]),
    }),
  }),
  VOLCENGINE_VIDEO_FILE_UPLOAD_POLICY = Object["freeze"]({
    inputKinds: Object["freeze"](["image", "video", "audio"]),
    videoFps: 0.3,
  }),
  VOLCENGINE_SEEDANCE_2_0_VIDEO_POLICY = Object["freeze"]({
    defaultRatio: "adaptive",
    defaultResolution: "720p",
    maxImageCount: 9,
    maxVideoReferenceCount: 3,
    maxAudioReferenceCount: 3,
    minDuration: 4,
    maxDuration: 15,
  }),
  APIMART_SEEDANCE_1_5_VIDEO_POLICY = Object["freeze"]({
    ratioField: "aspect_ratio",
    defaultResolution: "720p",
    supportsVideoReferences: false,
    supportsAudioReferences: false,
    maxRoleImageCount: 2,
    maxImageCount: 2,
    supportsGenerateAudioParam: true,
    supportsCameraFixedParam: true,
  }),
  APIMART_SEEDANCE_1_0_FAST_VIDEO_POLICY = Object["freeze"]({
    ratioField: "aspect_ratio",
    defaultResolution: "1080p",
    supportsVideoReferences: false,
    supportsAudioReferences: false,
    maxRoleImageCount: 1,
    maxImageCount: 1,
    roleImageLimitError:
      "Seedance 1.0 Pro Fast does not support last-frame input",
  }),
  APIMART_SEEDANCE_1_0_QUALITY_VIDEO_POLICY = Object["freeze"]({
    ratioField: "aspect_ratio",
    defaultResolution: "1080p",
    supportsVideoReferences: false,
    supportsAudioReferences: false,
    maxRoleImageCount: 2,
    maxImageCount: 1,
  });
function createSeedanceVideoExecutionExtensions(v81) {
  return Object["freeze"]({
    ...APIMART_SEEDANCE_VIDEO_RESOLVERS,
    seedanceVideo: v81,
  });
}
function createVolcengineSeedanceVideoExecutionExtensions(v82) {
  return Object["freeze"]({
    ...VOLCENGINE_SEEDANCE_VIDEO_RESOLVERS,
    seedanceVideo: v82,
    volcengineFiles: VOLCENGINE_VIDEO_FILE_UPLOAD_POLICY,
  });
}
const APIMART_SEEDANCE_DEFAULT_TASK_TYPES = Object["freeze"]([
    "text2video",
    "image2video",
    "frames2video",
    "multimodal2video",
  ]),
  APIMART_SEEDANCE_NO_FAST_FRAMES_TASK_TYPES = Object["freeze"]([
    "text2video",
    "image2video",
    "multimodal2video",
  ]),
  APIMART_SEEDANCE_STANDARD_RESOLUTION_BY_TASK = Object["freeze"]({
    text2video: Object["freeze"](["480p", "720p", "1080p"]),
    image2video: Object["freeze"](["480p", "720p", "1080p"]),
    frames2video: Object["freeze"](["480p", "720p", "1080p"]),
    multimodal2video: Object["freeze"](["480p", "720p", "1080p"]),
  }),
  APIMART_SEEDANCE_FAST_RESOLUTION_BY_TASK = Object["freeze"]({
    text2video: Object["freeze"](["480p", "720p"]),
    image2video: Object["freeze"](["480p", "720p"]),
    frames2video: Object["freeze"](["480p", "720p"]),
    multimodal2video: Object["freeze"](["480p", "720p"]),
  }),
  APIMART_SEEDANCE_DEFAULT_DURATION_BY_TASK = Object["freeze"]({
    text2video: Object["freeze"]({ min: 4, max: 15, step: 1 }),
    image2video: Object["freeze"]({ min: 4, max: 15, step: 1 }),
    frames2video: Object["freeze"]({ min: 4, max: 15, step: 1 }),
    multimodal2video: Object["freeze"]({ min: 4, max: 15, step: 1 }),
  }),
  APIMART_SEEDANCE_1_5_DURATION_BY_TASK = Object["freeze"]({
    text2video: Object["freeze"]({ min: 4, max: 12, step: 1 }),
    image2video: Object["freeze"]({ min: 4, max: 12, step: 1 }),
    frames2video: Object["freeze"]({ min: 4, max: 12, step: 1 }),
    multimodal2video: Object["freeze"]({ min: 4, max: 12, step: 1 }),
  }),
  APIMART_SEEDANCE_1_0_DURATION_BY_TASK = Object["freeze"]({
    text2video: Object["freeze"]({ min: 2, max: 12, step: 1 }),
    image2video: Object["freeze"]({ min: 2, max: 12, step: 1 }),
    frames2video: Object["freeze"]({ min: 2, max: 12, step: 1 }),
    multimodal2video: Object["freeze"]({ min: 2, max: 12, step: 1 }),
  });
function freezeFields(v83) {
  return Object["freeze"](v83["map"]((v84) => Object["freeze"](v84)));
}
function createVideoModelApiManifest({
  modelId: v85,
  executionId: v86,
  displayName: v87,
  provider: provider = "apimart",
  aliases: aliases = null,
  icon: icon = "AM",
  description: description = null,
  extensions: extensions = null,
  fields: fields = [
    VIDEO_RESOLUTION_FIELD,
    VIDEO_RATIO_FIELD,
    createFooterDurationField(),
  ],
  inputSlots: inputSlots = createVideoInputSlots(),
  ratioPolicy: ratioPolicy = VIDEO_SIZE_RATIO_POLICY,
  prompt: prompt = null,
  help: help = null,
  footerPlacementOrder:
    footerPlacementOrder = APIMART_VIDEO_FOOTER_PLACEMENT_ORDER,
}) {
  const v88 = Array["isArray"](footerPlacementOrder)
      ? footerPlacementOrder["map"]((v89) => String(v89 || "")["trim"]())[
          "filter"
        ](Boolean)
      : [],
    v90 = {
      schemaVersion: "1.0",
      modelId: v85,
      ...(Array["isArray"](aliases) ? { aliases: aliases } : {}),
      provider: provider,
      kind: "video",
      adapterType: "modelApi",
      executionId: v86,
      displayName: v87,
      icon: icon,
      description:
        description ||
        (provider === "apimart"
          ? "APIMart video model API"
          : v87 + " video model API"),
      inputSlots: inputSlots,
      uiSchema: Object["freeze"]({
        fields: freezeFields(fields),
        ...(v88["length"]
          ? { footerPlacementOrder: Object["freeze"](v88) }
          : {}),
      }),
      ...(prompt && typeof prompt === "object"
        ? { prompt: Object["freeze"](prompt) }
        : {}),
      ...(help && typeof help === "object"
        ? { help: Object["freeze"](help) }
        : {}),
      async: true,
      cancellable: false,
      outputType: "video",
      extensions: Object["freeze"]({ ratioPolicy: ratioPolicy }),
    };
  return (
    extensions &&
      typeof extensions === "object" &&
      (v90["extensions"] = Object["freeze"]({
        ratioPolicy: ratioPolicy,
        ...extensions,
      })),
    Object["freeze"](v90)
  );
}
function createVideoExecutionManifest({
  id: v91,
  model: v92,
  provider: provider = "apimart",
  endpoint: endpoint = "/v1/videos/generations",
  endpointMode: endpointMode = "video-generation",
  extensions: extensions = null,
  bodyMapping: bodyMapping = APIMART_VIDEO_LEGACY_BODY_MAPPING,
  modeModels: modeModels = null,
  responseMapping: responseMapping = APIMART_VIDEO_RESPONSE_MAPPING,
  taskPolling: taskPolling = APIMART_VIDEO_TASK_POLLING,
  resultTaskIdPath: resultTaskIdPath = "task_id",
  resultUrlFields: resultUrlFields = Object["freeze"]([
    "videoUrl",
    "video_url",
    "url",
  ]),
}) {
  const v93 = Object["freeze"]({
    ...(taskPolling ? { taskPolling: taskPolling } : {}),
    ...(extensions && typeof extensions === "object" ? extensions : {}),
  });
  return Object["freeze"]({
    schemaVersion: "1.0",
    id: v91,
    provider: provider,
    kind: "video",
    adapterType: "modelApi",
    endpoint: endpoint,
    endpointMode: endpointMode,
    method: "POST",
    model: v92,
    ...(modeModels ? { modeModels: Object["freeze"](modeModels) } : {}),
    extensions: v93,
    headers: Object["freeze"]({ "Content-Type": "application/json" }),
    bodyMapping: bodyMapping,
    responseMapping: responseMapping,
    result: Object["freeze"]({
      taskIdPath: resultTaskIdPath,
      urlFields: Object["freeze"](resultUrlFields),
    }),
  });
}
const APIMART_VIDEO_MODELS = Object["freeze"]([
    Object["freeze"]({
      modelId: "apimart/luma-ray-v2",
      executionId: "apimart.model-api.video.luma-ray-v2.v1",
      displayName: "Luma Ray V2",
      model: "luma-ray-v2",
    }),
    Object["freeze"]({
      modelId: "apimart/veo3-fast",
      executionId: "apimart.model-api.video.veo3-fast.v1",
      displayName: "VEO3",
      model: "veo3.1-fast",
      modeModels: Object["freeze"]({
        fast: "veo3.1-fast",
        quality: "veo3.1-quality",
      }),
      fields: Object["freeze"]([
        VEO3_MODEL_FIELD,
        VEO3_GENERATION_TYPE_FIELD,
        createResolutionField({
          label: "视频分辨率",
          defaultValue: "720p",
          options: [
            "720p",
            {
              value: "1080p",
              label: "1080p",
              disableWhen: { field: "enable_gif", value: true },
            },
            {
              value: "4k",
              label: "4K",
              disableWhen: { field: "enable_gif", value: true },
            },
          ],
        }),
        Object["freeze"]({
          ...createAspectRatioField({
            label: "比例",
            options: ["16:9", "9:16"],
          }),
          hideWhen: Object["freeze"]({
            field: "generation_type",
            value: "extend",
          }),
        }),
        withResolutionPlacement(VEO3_FIXED_DURATION_FIELD),
        VEO3_ENABLE_GIF_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 3,
        video: 0,
        audio: 0,
        fixedSlots: Object["freeze"]([
          Object["freeze"]({
            id: "firstFrame",
            kind: "image",
            label: "首帧图",
            hideWhen: Object["freeze"]({
              field: "generation_type",
              value: "reference",
            }),
          }),
          Object["freeze"]({
            id: "lastFrame",
            kind: "image",
            label: "尾帧图",
            hideWhen: Object["freeze"]({
              field: "generation_type",
              value: "reference",
            }),
          }),
        ]),
      }),
      bodyMapping: APIMART_VIDEO_VEO3_BODY_MAPPING,
      executionExtensions: Object["freeze"]({
        bodyResolver: "apimartVeo3Video",
      }),
      prompt: Object["freeze"]({
        placeholder: VEO3_FRAME_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "frame",
            }),
            placeholder: VEO3_FRAME_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "reference",
            }),
            placeholder: VEO3_REFERENCE_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({
        tooltip: VEO3_FRAME_HELP_TOOLTIP,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "frame",
            }),
            tooltip: VEO3_FRAME_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "reference",
            }),
            tooltip: VEO3_REFERENCE_HELP_TOOLTIP,
          }),
        ]),
      }),
      extensions: createVideoMenuExtension(
        30,
        "VEO3.1\x20Fast\x20/\x20Quality",
      ),
    }),
    Object["freeze"]({
      modelId: "apimart/grok-imagine-1.0",
      executionId: "apimart.model-api.video.grok-imagine-1.v1",
      displayName: "Grok Imagine 1.0",
      model: "grok-imagine-1.0-video-apimart",
      fields: Object["freeze"]([
        createAspectRatioField({
          defaultValue: "16:9",
          options: ["16:9", "9:16", "1:1", "3:2", "2:3"],
        }),
        createFooterDurationField({ defaultValue: 6, min: 6, max: 30 }),
        GROK_IMAGINE_QUALITY_FIELD,
      ]),
      inputSlots: createVideoInputSlots({ image: 7, video: 0, audio: 0 }),
      bodyMapping: APIMART_VIDEO_GROK_IMAGINE_BODY_MAPPING,
      prompt: Object["freeze"]({
        placeholder: GROK_IMAGINE_PROMPT_PLACEHOLDER,
      }),
      help: Object["freeze"]({ tooltip: GROK_IMAGINE_HELP_TOOLTIP }),
      extensions: createVideoMenuExtension(35, "文生 / 图生，最多 7 张参考图"),
    }),
    Object["freeze"]({
      modelId: "apimart/omni-flash-ext",
      executionId: "apimart.model-api.video.omni-flash-ext.v1",
      displayName: "Gemini\x20Omni\x20Flash",
      model: "Omni-Flash-Ext",
      fields: Object["freeze"]([
        createAspectRatioField({
          defaultValue: "16:9",
          options: ["16:9", "9:16"],
        }),
        createFooterDurationSliderOptionsField({
          values: [4, 6, 8, 10],
          defaultValue: 6,
        }),
        createResolutionField({
          label: "视频分辨率",
          defaultValue: "720p",
          options: ["720p", "1080p", "4k"],
        }),
      ]),
      inputSlots: createVideoInputSlots({ image: 3, video: 0, audio: 0 }),
      bodyMapping: APIMART_VIDEO_OMNI_FLASH_BODY_MAPPING,
      prompt: Object["freeze"]({
        placeholder: GEMINI_OMNI_FLASH_PROMPT_PLACEHOLDER,
      }),
      help: Object["freeze"]({ tooltip: GEMINI_OMNI_FLASH_HELP_TOOLTIP }),
      extensions: createVideoMenuExtension(36, "文生 / 单图 / 3 图融合"),
    }),
    Object["freeze"]({
      modelId: "apimart/minimax-hailuo",
      executionId: "apimart.model-api.video.minimax-hailuo.v1",
      displayName: "Hailuo 02",
      aliases: Object["freeze"]([
        "apimart/hailuo-02",
        "apimart/minimax-hailuo-02",
      ]),
      model: "MiniMax-Hailuo-02",
      fields: Object["freeze"]([
        createResolutionField({
          label: "视频分辨率",
          defaultValue: "768p",
          options: [
            "512p",
            "768p",
            Object["freeze"]({
              value: "1080p",
              label: "1080p",
              tooltip: "1080p 仅支持 5 秒",
            }),
          ],
        }),
        createAspectRatioField({ options: [] }),
        createFooterDurationSliderOptionsField({
          values: [5, 10],
          defaultValue: 5,
          label: "视频时长（秒）",
          optionOverridesByValue: Object["freeze"]({
            10: Object["freeze"]({
              disableWhen: Object["freeze"]({
                field: "resolution",
                value: "1080p",
              }),
            }),
          }),
        }),
        VIDEO_PROMPT_OPTIMIZER_FIELD,
        VIDEO_FAST_PRETREATMENT_FIELD,
        VIDEO_WATERMARK_CN_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 2,
        video: 0,
        audio: 0,
        fixedSlots: Object["freeze"]([
          Object["freeze"]({
            id: "firstFrame",
            kind: "image",
            label: "首帧",
            description: "视频起始帧图片",
          }),
          Object["freeze"]({
            id: "lastFrame",
            kind: "image",
            label: "尾帧",
            description: "视频结束帧图片",
          }),
        ]),
      }),
      bodyMapping: APIMART_VIDEO_HAILUO_02_BODY_MAPPING,
      executionExtensions: Object["freeze"]({
        bodyResolver: "apimartHailuo02Video",
      }),
      prompt: Object["freeze"]({
        placeholder:
          "描述视频内容，支持运镜指令。例如：" + HAILUO_02_PROMPT_EXAMPLE,
      }),
      help: Object["freeze"]({ tooltip: HAILUO_02_HELP_TOOLTIP }),
      extensions: createVideoMenuExtension(
        90,
        "运镜指令；使用示例：" + HAILUO_02_PROMPT_EXAMPLE,
      ),
    }),
    Object["freeze"]({
      modelId: "apimart/minimax-hailuo-2.3",
      executionId: "apimart.model-api.video.minimax-hailuo-2-3.v1",
      displayName: "Hailuo\x202.3",
      model: "MiniMax-Hailuo-2.3",
      modeModels: Object["freeze"]({
        standard: "MiniMax-Hailuo-2.3",
        fast: "MiniMax-Hailuo-2.3-Fast",
      }),
      fields: Object["freeze"]([
        HAILUO_23_MODEL_FIELD,
        createResolutionField({
          label: "视频分辨率",
          defaultValue: "768p",
          options: [
            "768p",
            Object["freeze"]({
              value: "1080p",
              label: "1080p",
              tooltip: "1080p 仅支持 6 秒",
            }),
          ],
        }),
        createAspectRatioField({ options: [] }),
        createFooterDurationSliderOptionsField({
          values: [6, 10],
          defaultValue: 6,
          optionOverridesByValue: Object["freeze"]({
            10: Object["freeze"]({
              disableWhen: Object["freeze"]({
                field: "resolution",
                value: "1080p",
              }),
            }),
          }),
        }),
        VIDEO_PROMPT_OPTIMIZER_FIELD,
        VIDEO_FAST_PRETREATMENT_FIELD,
        VIDEO_WATERMARK_CN_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 1,
        video: 0,
        audio: 0,
        fixedSlots: Object["freeze"]([
          Object["freeze"]({
            id: "firstFrame",
            kind: "image",
            label: "首帧",
            description: "视频起始帧图片；Fast 版必填",
          }),
        ]),
      }),
      bodyMapping: APIMART_VIDEO_HAILUO_23_BODY_MAPPING,
      executionExtensions: Object["freeze"]({
        bodyResolver: "apimartHailuo23Video",
      }),
      prompt: Object["freeze"]({
        placeholder:
          "描述视频内容，支持运镜指令。例如：" + HAILUO_23_PROMPT_EXAMPLE,
      }),
      help: Object["freeze"]({ tooltip: HAILUO_23_HELP_TOOLTIP }),
      extensions: createVideoMenuExtension(
        80,
        "标准 / Fast；使用示例：" + HAILUO_23_PROMPT_EXAMPLE,
      ),
    }),
    Object["freeze"]({
      modelId: "apimart/happyhorse-1.0",
      executionId: "apimart.model-api.video.happyhorse-1.v1",
      displayName: "HappyHorse 1.0",
      model: "happyhorse-1.0",
      fields: Object["freeze"]([
        HAPPYHORSE_MODE_FIELD,
        createResolutionField({ label: "视频分辨率", defaultValue: "1080P" }),
        createAspectRatioField(),
        createFooterDurationField({
          defaultValue: 5,
          min: 3,
          max: 15,
          label: "视频时长",
        }),
        HAPPYHORSE_AUDIO_SETTING_FIELD,
        HAPPYHORSE_WATERMARK_FIELD,
        HAPPYHORSE_SEED_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 9,
        video: 1,
        audio: 0,
        fixedSlots: HAPPYHORSE_FIXED_INPUT_SLOTS,
        cycleFixedInputWhenFull: true,
      }),
      bodyMapping: APIMART_VIDEO_HAPPYHORSE_BODY_MAPPING,
      executionExtensions: Object["freeze"]({
        bodyResolver: "apimartHappyHorseVideo",
      }),
      prompt: Object["freeze"]({
        placeholder: HAPPYHORSE_TEXT_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({ field: "happyhorse_mode", value: "auto" }),
            placeholder: HAPPYHORSE_TEXT_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "happyhorse_mode",
              value: "image",
            }),
            placeholder: HAPPYHORSE_IMAGE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "happyhorse_mode",
              value: "reference",
            }),
            placeholder: HAPPYHORSE_REFERENCE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "happyhorse_mode", value: "edit" }),
            placeholder: HAPPYHORSE_EDIT_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({
        tooltip: HAPPYHORSE_HELP_TOOLTIP,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({ field: "happyhorse_mode", value: "auto" }),
            tooltip: HAPPYHORSE_TEXT_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "happyhorse_mode",
              value: "image",
            }),
            tooltip: HAPPYHORSE_IMAGE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "happyhorse_mode",
              value: "reference",
            }),
            tooltip: HAPPYHORSE_REFERENCE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "happyhorse_mode", value: "edit" }),
            tooltip: HAPPYHORSE_EDIT_HELP_TOOLTIP,
          }),
        ]),
      }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "apimartModel",
          order: 20,
          label: "HappyHorse\x201.0",
          subtitle: "T2V\x20/\x20I2V\x20/\x20R2V\x20/\x20Edit",
        }),
      }),
    }),
    Object["freeze"]({
      modelId: "apimart/wan2.7",
      executionId: "apimart.model-api.video.wan2-7.v1",
      displayName: "Wan 2.7",
      model: "wan2.7",
      fields: Object["freeze"]([
        WAN27_MODE_FIELD,
        createResolutionField({ defaultValue: "1080P" }),
        createAspectRatioField(),
        createFooterDurationField({ defaultValue: 5, min: 2, max: 15 }),
        WAN27_PROMPT_EXTEND_FIELD,
        VIDEO_WATERMARK_FIELD,
        VIDEO_SEED_FIELD,
        WAN27_NEGATIVE_PROMPT_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 5,
        video: 5,
        audio: 1,
        fixedSlots: WAN27_FIXED_INPUT_SLOTS,
      }),
      bodyMapping: APIMART_VIDEO_WAN27_BODY_MAPPING,
      executionExtensions: Object["freeze"]({
        bodyResolver: "apimartWan27Video",
      }),
      prompt: Object["freeze"]({
        placeholder: WAN27_IMAGE_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "image" }),
            placeholder: WAN27_IMAGE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "video" }),
            placeholder: WAN27_VIDEO_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "reference" }),
            placeholder: WAN27_REFERENCE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "edit" }),
            placeholder: WAN27_EDIT_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({
        tooltip: WAN27_HELP_TOOLTIP,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "image" }),
            tooltip: WAN27_IMAGE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "video" }),
            tooltip: WAN27_VIDEO_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "reference" }),
            tooltip: WAN27_REFERENCE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "edit" }),
            tooltip: WAN27_EDIT_HELP_TOOLTIP,
          }),
        ]),
      }),
      extensions: createVideoMenuExtension(
        40,
        "文生 / 图生 / 参考 / 续写 / 编辑",
      ),
    }),
    Object["freeze"]({
      modelId: "apimart/kling-v1-5",
      executionId: "apimart.model-api.video.kling-v1-5.v1",
      displayName: "Kling V1.5",
      model: "kling-v1-5-gen-video",
    }),
    Object["freeze"]({
      modelId: "apimart/kling-v3",
      executionId: "apimart.model-api.video.kling-v3.v1",
      displayName: "Kling V3",
      model: "kling-v3",
      fields: Object["freeze"]([
        KLING_V3_MODE_FIELD,
        createAspectRatioField({ options: ["16:9", "9:16", "1:1"] }),
        createFooterDurationField({ defaultValue: 5, min: 3, max: 15 }),
        KLING_V3_AUDIO_FIELD,
        KLING_V3_MULTI_SHOT_PLACEHOLDER_FIELD,
        VIDEO_WATERMARK_FIELD,
        KLING_V3_NEGATIVE_PROMPT_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 2,
        video: 0,
        audio: 0,
        fixedSlots: Object["freeze"]([
          Object["freeze"]({
            id: "firstFrame",
            kind: "image",
            label: "首帧",
            description: "图生视频使用的首帧图片",
          }),
          Object["freeze"]({
            id: "lastFrame",
            kind: "image",
            label: "尾帧",
            description: "可选，图生视频使用的尾帧图片",
          }),
        ]),
      }),
      bodyMapping: APIMART_VIDEO_KLING_V3_BODY_MAPPING,
      prompt: Object["freeze"]({ placeholder: KLING_V3_PROMPT_PLACEHOLDER }),
      help: Object["freeze"]({ tooltip: KLING_V3_HELP_TOOLTIP }),
      extensions: createVideoMenuExtension(60, "Kling v3"),
    }),
    Object["freeze"]({
      modelId: "apimart/kling-v3-omni",
      executionId: "apimart.model-api.video.kling-v3-omni.v1",
      displayName: "Kling\x20V3\x20Omni",
      model: "kling-v3-omni",
      fields: Object["freeze"]([
        KLING_V3_OMNI_MODE_FIELD,
        KLING_V3_MODE_FIELD,
        createAspectRatioField({ options: ["16:9", "9:16", "1:1"] }),
        createFooterDurationField({ defaultValue: 5, min: 3, max: 15 }),
        KLING_V3_AUDIO_FIELD,
        KLING_V3_MULTI_SHOT_PLACEHOLDER_FIELD,
        VIDEO_WATERMARK_FIELD,
        KLING_V3_NEGATIVE_PROMPT_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 2,
        video: 1,
        audio: 0,
        fixedSlots: KLING_V3_OMNI_FIXED_INPUT_SLOTS,
      }),
      bodyMapping: APIMART_VIDEO_KLING_V3_BODY_MAPPING,
      executionExtensions: Object["freeze"]({
        bodyResolver: "apimartKlingV3OmniVideo",
      }),
      prompt: Object["freeze"]({
        placeholder: KLING_V3_OMNI_IMAGE_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "image",
            }),
            placeholder: KLING_V3_OMNI_IMAGE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "reference",
            }),
            placeholder: KLING_V3_OMNI_REFERENCE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "edit",
            }),
            placeholder: KLING_V3_OMNI_EDIT_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({
        tooltip: KLING_V3_OMNI_HELP_TOOLTIP,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "image",
            }),
            tooltip: KLING_V3_OMNI_IMAGE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "reference",
            }),
            tooltip: KLING_V3_OMNI_REFERENCE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "edit",
            }),
            tooltip: KLING_V3_OMNI_EDIT_HELP_TOOLTIP,
          }),
        ]),
      }),
      extensions: createVideoMenuExtension(50, "Kling v3 Omni"),
    }),
    Object["freeze"]({
      modelId: "apimart/kling-video-o1",
      executionId: "apimart.model-api.video.kling-o1.v1",
      displayName: "Kling O1",
      model: "kling-video-o1",
      fields: Object["freeze"]([
        KLING_O1_QUALITY_FIELD,
        createAspectRatioField({ options: ["16:9", "9:16", "1:1"] }),
        createFooterDurationSliderOptionsField({
          values: [5, 10],
          defaultValue: 5,
        }),
        KLING_O1_KEEP_ORIGINAL_SOUND_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 2,
        video: 1,
        audio: 0,
        fixedSlots: KLING_O1_FIXED_INPUT_SLOTS,
        exclusiveGroups: KLING_O1_VIDEO_EXCLUSIVE_GROUPS,
      }),
      bodyMapping: APIMART_VIDEO_KLING_O1_BODY_MAPPING,
      executionExtensions: Object["freeze"]({
        bodyResolver: "apimartKlingO1Video",
      }),
      prompt: Object["freeze"]({ placeholder: KLING_O1_PROMPT_PLACEHOLDER }),
      help: Object["freeze"]({ tooltip: KLING_O1_HELP_TOOLTIP }),
      extensions: createVideoMenuExtension(70, "Kling O1"),
    }),
    Object["freeze"]({
      modelId: "apimart/viduq3",
      executionId: "apimart.model-api.video.viduq3.v1",
      displayName: "Vidu Q3",
      model: "viduq3-turbo",
      modeModels: Object["freeze"]({
        "viduq3-turbo": "viduq3-turbo",
        "viduq3-pro": "viduq3-pro",
        viduq3: "viduq3",
        "viduq3-mix": "viduq3-mix",
      }),
      fields: Object["freeze"]([
        VIDU_Q3_MODEL_FIELD,
        VIDU_Q3_GENERATION_MODE_FIELD,
        createResolutionField({
          defaultValue: "720p",
          options: [
            Object["freeze"]({
              value: "540p",
              label: "540p",
              disableWhen: Object["freeze"]({
                all: Object["freeze"]([
                  Object["freeze"]({
                    field: "vidu_q3_generation_mode",
                    value: "reference",
                  }),
                  Object["freeze"]({ field: "mode", value: "viduq3-mix" }),
                ]),
              }),
            }),
            "720p",
            "1080p",
          ],
        }),
        createAspectRatioField(),
        createFooterDurationField({ defaultValue: 5, min: 1, max: 16 }),
        VIDU_Q3_AUDIO_FIELD,
        VIDEO_SEED_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 7,
        video: 0,
        audio: 0,
        fixedSlots: Object["freeze"]([
          Object["freeze"]({
            id: "firstFrame",
            kind: "image",
            label: "首帧图",
            hideWhen: Object["freeze"]({
              field: "vidu_q3_generation_mode",
              value: "reference",
            }),
          }),
          Object["freeze"]({
            id: "lastFrame",
            kind: "image",
            label: "尾帧图",
            hideWhen: Object["freeze"]({
              field: "vidu_q3_generation_mode",
              value: "reference",
            }),
          }),
        ]),
      }),
      bodyMapping: APIMART_VIDEO_VIDU_BODY_MAPPING,
      executionExtensions: Object["freeze"]({
        bodyResolver: "apimartViduQ3Video",
      }),
      prompt: Object["freeze"]({
        placeholder: VIDU_Q3_VIDEO_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "vidu_q3_generation_mode",
              value: "video",
            }),
            placeholder: VIDU_Q3_VIDEO_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "vidu_q3_generation_mode",
              value: "reference",
            }),
            placeholder: VIDU_Q3_REFERENCE_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({ tooltip: VIDU_Q3_HELP_TOOLTIP }),
      extensions: createVideoMenuExtension(
        100,
        "Vidu\x20Q3\x20Turbo\x20/\x20Pro\x20/\x20Standard\x20/\x20Mix",
      ),
    }),
    Object["freeze"]({
      modelId: "apimart/doubao-seedance-2.0-fast",
      executionId: "apimart.model-api.video.doubao-seedance-2-fast.v1",
      displayName: "Seedance 2.0 Fast",
      aliases: Object["freeze"](["apimart/seedance-2.0-fast"]),
      model: "doubao-seedance-2.0-fast",
      endpointMode: "seedance-video-generation",
      executionExtensions: createSeedanceVideoExecutionExtensions(
        APIMART_SEEDANCE_2_0_VIDEO_POLICY,
      ),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "apimartDreaminaEntry",
          order: 10,
          label: "即梦视频",
          subtitle: "Seedance 系列，文生/图生/首尾帧参考素材",
        }),
        dreaminaStyleVideo: Object["freeze"]({
          order: 10,
          counterpartKey: "seedance2-fast",
          title: "Seedance 2.0 Fast",
          subtitle: "APIMart 快速版，支持文生、图生、首尾帧与参考素材",
          taskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          defaultForTaskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          resolutionOptionsByTaskType: APIMART_SEEDANCE_FAST_RESOLUTION_BY_TASK,
          durationRangeByTaskType: APIMART_SEEDANCE_DEFAULT_DURATION_BY_TASK,
        }),
      }),
    }),
    Object["freeze"]({
      modelId: "apimart/doubao-seedance-2.0",
      executionId: "apimart.model-api.video.doubao-seedance-2.v1",
      displayName: "Seedance 2.0",
      aliases: Object["freeze"](["apimart/seedance-2.0"]),
      model: "doubao-seedance-2.0",
      endpointMode: "seedance-video-generation",
      executionExtensions: createSeedanceVideoExecutionExtensions(
        APIMART_SEEDANCE_2_0_VIDEO_POLICY,
      ),
      extensions: Object["freeze"]({
        dreaminaStyleVideo: Object["freeze"]({
          order: 20,
          counterpartKey: "seedance2-standard",
          title: "Seedance 2.0",
          subtitle: "APIMart 标准版，质量优先，支持 1080p",
          taskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          resolutionOptionsByTaskType:
            APIMART_SEEDANCE_STANDARD_RESOLUTION_BY_TASK,
          durationRangeByTaskType: APIMART_SEEDANCE_DEFAULT_DURATION_BY_TASK,
        }),
      }),
    }),
    Object["freeze"]({
      modelId: "apimart/doubao-seedance-2.0-fast-face",
      executionId: "apimart.model-api.video.doubao-seedance-2-fast-face.v1",
      displayName: "Seedance\x202.0\x20Fast\x20Face",
      aliases: Object["freeze"](["apimart/seedance-2.0-fast-face"]),
      model: "doubao-seedance-2.0-fast-face",
      endpointMode: "seedance-video-generation",
      executionExtensions: createSeedanceVideoExecutionExtensions(
        APIMART_SEEDANCE_2_0_VIDEO_POLICY,
      ),
      extensions: Object["freeze"]({
        dreaminaStyleVideo: Object["freeze"]({
          order: 30,
          counterpartKey: "seedance2-fast",
          title: "Seedance 2.0 Fast Face",
          subtitle: "APIMart\x20快速真人版，支持真人素材上传",
          taskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          resolutionOptionsByTaskType: APIMART_SEEDANCE_FAST_RESOLUTION_BY_TASK,
          durationRangeByTaskType: APIMART_SEEDANCE_DEFAULT_DURATION_BY_TASK,
        }),
      }),
    }),
    Object["freeze"]({
      modelId: "apimart/doubao-seedance-2.0-face",
      executionId: "apimart.model-api.video.doubao-seedance-2-face.v1",
      displayName: "Seedance 2.0 Face",
      aliases: Object["freeze"](["apimart/seedance-2.0-face"]),
      model: "doubao-seedance-2.0-face",
      endpointMode: "seedance-video-generation",
      executionExtensions: createSeedanceVideoExecutionExtensions(
        APIMART_SEEDANCE_2_0_VIDEO_POLICY,
      ),
      extensions: Object["freeze"]({
        dreaminaStyleVideo: Object["freeze"]({
          order: 40,
          counterpartKey: "seedance2-standard",
          title: "Seedance 2.0 Face",
          subtitle: "APIMart 真人标准版，支持真人素材上传与 1080p",
          taskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          resolutionOptionsByTaskType:
            APIMART_SEEDANCE_STANDARD_RESOLUTION_BY_TASK,
          durationRangeByTaskType: APIMART_SEEDANCE_DEFAULT_DURATION_BY_TASK,
        }),
      }),
    }),
    Object["freeze"]({
      modelId: "apimart/doubao-seedance-1-5-pro",
      executionId: "apimart.model-api.video.doubao-seedance-1-5-pro.v1",
      displayName: "Seedance 1.5 Pro",
      aliases: Object["freeze"]([
        "apimart/seedance-1.5-pro",
        "apimart/seedance-1-5-pro",
      ]),
      model: "doubao-seedance-1-5-pro",
      endpointMode: "seedance-video-generation",
      executionExtensions: createSeedanceVideoExecutionExtensions(
        APIMART_SEEDANCE_1_5_VIDEO_POLICY,
      ),
      extensions: Object["freeze"]({
        dreaminaStyleVideo: Object["freeze"]({
          order: 50,
          title: "Seedance 1.5 Pro",
          subtitle: "APIMart 1.5 Pro，支持文生、图生、首尾帧与生成音频参数",
          taskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          resolutionOptionsByTaskType:
            APIMART_SEEDANCE_STANDARD_RESOLUTION_BY_TASK,
          durationRangeByTaskType: APIMART_SEEDANCE_1_5_DURATION_BY_TASK,
        }),
      }),
    }),
    Object["freeze"]({
      modelId: "apimart/doubao-seedance-1-0-pro-fast",
      executionId: "apimart.model-api.video.doubao-seedance-1-pro-fast.v1",
      displayName: "Seedance 1.0 Pro Fast",
      aliases: Object["freeze"]([
        "apimart/seedance-1.0-pro-fast",
        "apimart/seedance-1-0-pro-fast",
      ]),
      model: "doubao-seedance-1-0-pro-fast",
      endpointMode: "seedance-video-generation",
      executionExtensions: createSeedanceVideoExecutionExtensions(
        APIMART_SEEDANCE_1_0_FAST_VIDEO_POLICY,
      ),
      extensions: Object["freeze"]({
        dreaminaStyleVideo: Object["freeze"]({
          order: 60,
          title: "Seedance 1.0 Pro Fast",
          subtitle: "APIMart 1.0 快速版，适合预览和迭代",
          taskTypes: APIMART_SEEDANCE_NO_FAST_FRAMES_TASK_TYPES,
          resolutionOptionsByTaskType:
            APIMART_SEEDANCE_STANDARD_RESOLUTION_BY_TASK,
          durationRangeByTaskType: APIMART_SEEDANCE_1_0_DURATION_BY_TASK,
        }),
      }),
    }),
    Object["freeze"]({
      modelId: "apimart/doubao-seedance-1-0-pro-quality",
      executionId: "apimart.model-api.video.doubao-seedance-1-pro-quality.v1",
      displayName: "Seedance 1.0 Pro Quality",
      aliases: Object["freeze"]([
        "apimart/seedance-1.0-pro-quality",
        "apimart/seedance-1-0-pro-quality",
      ]),
      model: "doubao-seedance-1-0-pro-quality",
      endpointMode: "seedance-video-generation",
      executionExtensions: createSeedanceVideoExecutionExtensions(
        APIMART_SEEDANCE_1_0_QUALITY_VIDEO_POLICY,
      ),
      extensions: Object["freeze"]({
        dreaminaStyleVideo: Object["freeze"]({
          order: 70,
          title: "Seedance 1.0 Pro Quality",
          subtitle: "APIMart 1.0 高质量版，支持首尾帧",
          taskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          resolutionOptionsByTaskType:
            APIMART_SEEDANCE_STANDARD_RESOLUTION_BY_TASK,
          durationRangeByTaskType: APIMART_SEEDANCE_1_0_DURATION_BY_TASK,
        }),
      }),
    }),
  ]),
  RUNNINGHUB_VIDEO_MODELS = Object["freeze"]([
    Object["freeze"]({
      provider: "runninghub",
      modelId: "runninghub-model/kling-video-o1",
      executionId: "runninghub.model-api.video.kling-o1.v1",
      displayName: "Kling\x20O1",
      icon: "images/RH.png",
      description: "RunningHub\x20Kling\x20O1\x20model\x20API",
      model: "kling-video-o1",
      endpoint: "/openapi/v2/kling-video-o1/text-to-video",
      fields: Object["freeze"]([
        RUNNINGHUB_KLING_O1_GENERATION_MODE_FIELD,
        KLING_O1_QUALITY_FIELD,
        RUNNINGHUB_KLING_O1_RATIO_FIELD,
        createFooterDurationSliderOptionsField({
          values: [5, 10],
          defaultValue: 5,
        }),
        RUNNINGHUB_KLING_O1_KEEP_ORIGINAL_SOUND_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 7,
        video: 1,
        audio: 0,
        fixedSlots: RUNNINGHUB_KLING_O1_FIXED_INPUT_SLOTS,
      }),
      bodyMapping: RUNNINGHUB_VIDEO_KLING_O1_BODY_MAPPING,
      responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
      taskPolling: null,
      resultTaskIdPath: "taskId",
      executionExtensions: Object["freeze"]({
        bodyResolver: "runninghubKlingO1Video",
        endpointResolver: "runninghubKlingO1VideoEndpoint",
      }),
      prompt: Object["freeze"]({
        placeholder: RUNNINGHUB_KLING_O1_FRAME_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_kling_o1_generation_mode",
              value: "frame",
            }),
            placeholder: RUNNINGHUB_KLING_O1_FRAME_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_kling_o1_generation_mode",
              value: "reference",
            }),
            placeholder: RUNNINGHUB_KLING_O1_REFERENCE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_kling_o1_generation_mode",
              value: "edit",
            }),
            placeholder: RUNNINGHUB_KLING_O1_EDIT_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({
        tooltip: RUNNINGHUB_KLING_O1_HELP_TOOLTIP,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_kling_o1_generation_mode",
              value: "frame",
            }),
            tooltip: RUNNINGHUB_KLING_O1_FRAME_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_kling_o1_generation_mode",
              value: "reference",
            }),
            tooltip: RUNNINGHUB_KLING_O1_REFERENCE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_kling_o1_generation_mode",
              value: "edit",
            }),
            tooltip: RUNNINGHUB_KLING_O1_EDIT_HELP_TOOLTIP,
          }),
        ]),
      }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "runninghubModel",
          order: 70,
          label: "Kling O1",
          subtitle:
            "文生\x20/\x20图生\x20/\x20首尾帧\x20/\x20参考\x20/\x20编辑",
        }),
      }),
    }),
    Object["freeze"]({
      provider: "runninghub",
      modelId: "runninghub-model/kling-v3",
      executionId: "runninghub.model-api.video.kling-v3.v1",
      displayName: "Kling V3.0",
      aliases: Object["freeze"]([
        "runninghub-model/kling-v3.0",
        "runninghub-model/kling-v30",
        "runninghub-model/kling-v3-0",
      ]),
      icon: "images/RH.png",
      description: "RunningHub\x20Kling\x20V3.0\x20model\x20API",
      model: "kling-v3",
      endpoint: "/openapi/v2/kling-v3.0-std/text-to-video",
      fields: Object["freeze"]([
        RUNNINGHUB_KLING_V3_MODEL_FIELD,
        RUNNINGHUB_KLING_V3_RATIO_FIELD,
        createFooterDurationField({ defaultValue: 5, min: 3, max: 15 }),
        KLING_V3_AUDIO_FIELD,
        RUNNINGHUB_KLING_V3_CFG_SCALE_FIELD,
        RUNNINGHUB_KLING_V3_SHOT_TYPE_FIELD,
        KLING_V3_NEGATIVE_PROMPT_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 2,
        video: 0,
        audio: 0,
        fixedSlots: RUNNINGHUB_KLING_V3_FIXED_INPUT_SLOTS,
      }),
      bodyMapping: RUNNINGHUB_VIDEO_KLING_V3_BODY_MAPPING,
      responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
      taskPolling: null,
      resultTaskIdPath: "taskId",
      executionExtensions: Object["freeze"]({
        bodyResolver: "runninghubKlingV3Video",
        endpointResolver: "runninghubKlingV3VideoEndpoint",
      }),
      prompt: Object["freeze"]({
        placeholder: RUNNINGHUB_KLING_V3_PROMPT_PLACEHOLDER,
      }),
      help: Object["freeze"]({ tooltip: RUNNINGHUB_KLING_V3_HELP_TOOLTIP }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "runninghubModel",
          order: 60,
          label: "Kling V3.0",
          subtitle: "std / pro / 4K，文生 / 图生 / 首尾帧",
        }),
      }),
    }),
    Object["freeze"]({
      provider: "runninghub",
      modelId: "runninghub-model/kling-o3",
      executionId: "runninghub.model-api.video.kling-o3.v1",
      displayName: "Kling O3",
      aliases: Object["freeze"]([
        "runninghub-model/kling-video-o3",
        "runninghub-model/kling-o3-video",
        "runninghub-model/kling-o3-std",
      ]),
      icon: "images/RH.png",
      description: "RunningHub\x20Kling\x20O3\x20model\x20API",
      model: "kling-video-o3",
      endpoint: "/openapi/v2/kling-video-o3-std/text-to-video",
      fields: Object["freeze"]([
        RUNNINGHUB_KLING_O3_MODEL_FIELD,
        RUNNINGHUB_KLING_O3_MODE_FIELD,
        RUNNINGHUB_KLING_O3_RATIO_FIELD,
        RUNNINGHUB_KLING_O3_DURATION_FIELD,
        RUNNINGHUB_KLING_O3_AUDIO_FIELD,
        RUNNINGHUB_KLING_O3_KEEP_ORIGINAL_SOUND_FIELD,
        RUNNINGHUB_KLING_O3_SHOT_TYPE_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 7,
        video: 1,
        audio: 0,
        fixedSlots: RUNNINGHUB_KLING_O3_FIXED_INPUT_SLOTS,
      }),
      bodyMapping: RUNNINGHUB_VIDEO_KLING_O3_BODY_MAPPING,
      responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
      taskPolling: null,
      resultTaskIdPath: "taskId",
      executionExtensions: Object["freeze"]({
        bodyResolver: "runninghubKlingO3Video",
        endpointResolver: "runninghubKlingO3VideoEndpoint",
      }),
      prompt: Object["freeze"]({
        placeholder: RUNNINGHUB_KLING_O3_FRAME_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "image",
            }),
            placeholder: RUNNINGHUB_KLING_O3_FRAME_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "reference",
            }),
            placeholder: RUNNINGHUB_KLING_O3_REFERENCE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "edit",
            }),
            placeholder: RUNNINGHUB_KLING_O3_EDIT_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({
        tooltip: RUNNINGHUB_KLING_O3_HELP_TOOLTIP,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "image",
            }),
            tooltip: RUNNINGHUB_KLING_O3_FRAME_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "reference",
            }),
            tooltip: RUNNINGHUB_KLING_O3_REFERENCE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "kling_v3_omni_mode",
              value: "edit",
            }),
            tooltip: RUNNINGHUB_KLING_O3_EDIT_HELP_TOOLTIP,
          }),
        ]),
      }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "runninghubModel",
          order: 50,
          label: "Kling\x20O3",
          subtitle: "std / pro / 4K，文生 / 图生 / 参考 / 编辑",
        }),
      }),
    }),
    Object["freeze"]({
      provider: "runninghub",
      modelId: "runninghub-model/seedance-2.0",
      executionId: "runninghub.model-api.video.seedance-2.v1",
      displayName: "Seedance 2.0",
      aliases: Object["freeze"]([
        "runninghub-model/seedance2.0",
        "runninghub-model/seedance-2",
        "runninghub-model/sparkvideo-2.0",
        "runninghub-model/seedance-2.0-fast",
      ]),
      icon: "images/RH.png",
      description: "RunningHub Seedance 2.0 model API",
      model: "rhart-video/sparkvideo-2.0",
      endpoint: "/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video",
      endpointMode: "seedance-video-generation",
      fields: Object["freeze"]([
        RUNNINGHUB_SEEDANCE_2_MODEL_FIELD,
        RUNNINGHUB_SEEDANCE_2_MODE_FIELD,
        RUNNINGHUB_SEEDANCE_2_RESOLUTION_FIELD,
        Object["freeze"]({
          ...createAspectRatioField({
            options: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
          }),
          variant: "pillMenu",
        }),
        createFooterDurationSliderOptionsField({
          values: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          defaultValue: 5,
        }),
        RUNNINGHUB_SEEDANCE_2_GENERATE_AUDIO_FIELD,
        RUNNINGHUB_SEEDANCE_2_WEB_SEARCH_FIELD,
        RUNNINGHUB_SEEDANCE_2_REAL_PERSON_FIELD,
        VIDEO_SEED_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 9,
        video: 3,
        audio: 3,
        fixedSlots: RUNNINGHUB_SEEDANCE_2_FIXED_INPUT_SLOTS,
        cycleFixedInputWhenFull: true,
      }),
      bodyMapping: RUNNINGHUB_VIDEO_SEEDANCE_2_BODY_MAPPING,
      responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
      taskPolling: null,
      resultTaskIdPath: "taskId",
      executionExtensions: Object["freeze"]({
        bodyResolver: "runninghubSeedance2Video",
        endpointResolver: "runninghubSeedance2VideoEndpoint",
      }),
      prompt: Object["freeze"]({
        placeholder: RUNNINGHUB_SEEDANCE_2_TEXT_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_seedance_2_mode",
              value: "text2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_TEXT_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_seedance_2_mode",
              value: "image2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_IMAGE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_seedance_2_mode",
              value: "frames2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_FRAMES_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "rh_seedance_2_mode",
              value: "multimodal2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_REFERENCE_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({ tooltip: RUNNINGHUB_SEEDANCE_2_HELP_TOOLTIP }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "runninghubModel",
          order: 10,
          label: "Seedance 2.0",
          subtitle: "Fast / Standard, T2V / I2V / Frames / Multimodal",
        }),
      }),
    }),
    Object["freeze"]({
      provider: "runninghub",
      modelId: "runninghub-model/happyhorse-1.0",
      executionId: "runninghub.model-api.video.happyhorse-1.v1",
      displayName: "HappyHorse 1.0",
      aliases: Object["freeze"]([
        "runninghub-model/happyhorse",
        "runninghub-model/happyhorse-1",
        "runninghub-model/alibaba-happyhorse-1.0",
      ]),
      icon: "images/RH.png",
      description: "RunningHub\x20Alibaba\x20HappyHorse\x201.0\x20model\x20API",
      model: "alibaba/happyhorse-1.0",
      endpoint: "/openapi/v2/alibaba/happyhorse-1.0/text-to-video",
      fields: Object["freeze"]([
        HAPPYHORSE_MODE_FIELD,
        createResolutionField({ label: "视频分辨率", defaultValue: "1080P" }),
        createAspectRatioField(),
        createFooterDurationField({
          defaultValue: 5,
          min: 3,
          max: 15,
          label: "视频时长",
        }),
        HAPPYHORSE_AUDIO_SETTING_FIELD,
        HAPPYHORSE_SEED_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 9,
        video: 1,
        audio: 0,
        fixedSlots: HAPPYHORSE_FIXED_INPUT_SLOTS,
        cycleFixedInputWhenFull: true,
      }),
      bodyMapping: RUNNINGHUB_VIDEO_HAPPYHORSE_BODY_MAPPING,
      responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
      taskPolling: null,
      resultTaskIdPath: "taskId",
      executionExtensions: Object["freeze"]({
        bodyResolver: "runninghubHappyHorseVideo",
        endpointResolver: "runninghubHappyHorseVideoEndpoint",
      }),
      prompt: Object["freeze"]({
        placeholder: HAPPYHORSE_TEXT_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({ field: "happyhorse_mode", value: "auto" }),
            placeholder: HAPPYHORSE_TEXT_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "happyhorse_mode",
              value: "image",
            }),
            placeholder: HAPPYHORSE_IMAGE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "happyhorse_mode",
              value: "reference",
            }),
            placeholder: HAPPYHORSE_REFERENCE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "happyhorse_mode", value: "edit" }),
            placeholder: HAPPYHORSE_EDIT_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({
        tooltip: HAPPYHORSE_HELP_TOOLTIP,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({ field: "happyhorse_mode", value: "auto" }),
            tooltip: HAPPYHORSE_TEXT_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "happyhorse_mode",
              value: "image",
            }),
            tooltip: HAPPYHORSE_IMAGE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "happyhorse_mode",
              value: "reference",
            }),
            tooltip: HAPPYHORSE_REFERENCE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "happyhorse_mode", value: "edit" }),
            tooltip: HAPPYHORSE_EDIT_HELP_TOOLTIP,
          }),
        ]),
      }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "runninghubModel",
          order: 20,
          label: "HappyHorse 1.0",
          subtitle: "T2V / I2V / R2V / Edit",
        }),
      }),
    }),
    Object["freeze"]({
      provider: "runninghub",
      modelId: "runninghub-model/veo3",
      executionId: "runninghub.model-api.video.veo3.v1",
      displayName: "Veo3",
      aliases: Object["freeze"]([
        "runninghub-model/veo3.1",
        "runninghub-model/rhart-video-v3.1",
        "runninghub-model/rhart-video-v31",
      ]),
      icon: "images/RH.png",
      description: "RunningHub 全能视频 V3.1 / Veo3 model API",
      model: "rhart-video-v3.1",
      endpoint: "/openapi/v2/rhart-video-v3.1-fast/text-to-video",
      fields: Object["freeze"]([
        RUNNINGHUB_VEO3_CHANNEL_FIELD,
        RUNNINGHUB_VEO3_MODEL_FIELD,
        RUNNINGHUB_VEO3_GENERATION_TYPE_FIELD,
        createResolutionField({
          label: "视频分辨率",
          defaultValue: "720p",
          options: [
            "720p",
            Object["freeze"]({
              value: "1080p",
              label: "1080p",
              disableWhen: Object["freeze"]({
                field: "rh_veo3_channel",
                value: "lowCost",
              }),
            }),
            Object["freeze"]({
              value: "4k",
              label: "4K",
              disableWhen: Object["freeze"]({
                any: Object["freeze"]([
                  Object["freeze"]({
                    field: "rh_veo3_channel",
                    value: "lowCost",
                  }),
                  Object["freeze"]({ field: "mode", value: "lite" }),
                ]),
              }),
            }),
          ],
        }),
        createAspectRatioField({ label: "比例", options: ["16:9", "9:16"] }),
        RUNNINGHUB_VEO3_DURATION_FIELD,
        RUNNINGHUB_VEO3_GENERATE_AUDIO_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 3,
        video: 1,
        audio: 0,
        fixedSlots: RUNNINGHUB_VEO3_FIXED_INPUT_SLOTS,
      }),
      bodyMapping: RUNNINGHUB_VIDEO_VEO3_BODY_MAPPING,
      responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
      taskPolling: null,
      resultTaskIdPath: "taskId",
      executionExtensions: Object["freeze"]({
        bodyResolver: "runninghubVeo3Video",
        endpointResolver: "runninghubVeo3VideoEndpoint",
      }),
      prompt: Object["freeze"]({
        placeholder: RUNNINGHUB_VEO3_FRAME_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "frame",
            }),
            placeholder: RUNNINGHUB_VEO3_FRAME_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "reference",
            }),
            placeholder: RUNNINGHUB_VEO3_REFERENCE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "extend",
            }),
            placeholder: RUNNINGHUB_VEO3_EXTEND_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({
        tooltip: RUNNINGHUB_VEO3_FRAME_HELP_TOOLTIP,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "frame",
            }),
            tooltip: RUNNINGHUB_VEO3_FRAME_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "reference",
            }),
            tooltip: RUNNINGHUB_VEO3_REFERENCE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "generation_type",
              value: "extend",
            }),
            tooltip: RUNNINGHUB_VEO3_EXTEND_HELP_TOOLTIP,
          }),
        ]),
      }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "runninghubModel",
          order: 30,
          label: "Veo3",
          subtitle: "全能视频 V3.1，官方 / 低价渠道",
        }),
      }),
    }),
    Object["freeze"]({
      provider: "runninghub",
      modelId: "runninghub-model/wan2.7",
      executionId: "runninghub.model-api.video.wan2-7.v1",
      displayName: "Wan 2.7",
      aliases: Object["freeze"]([
        "runninghub-model/wan27",
        "runninghub-model/wan-2.7",
        "runninghub-model/alibaba-wan-2.7",
      ]),
      icon: "images/RH.png",
      description: "RunningHub Alibaba Wan 2.7 model API",
      model: "alibaba/wan-2.7",
      endpoint: "/openapi/v2/alibaba/wan-2.7/text-to-video",
      fields: Object["freeze"]([
        WAN27_MODE_FIELD,
        createResolutionField({ defaultValue: "720P" }),
        createAspectRatioField(),
        createFooterDurationField({ defaultValue: 5, min: 2, max: 15 }),
        WAN27_PROMPT_EXTEND_FIELD,
        WAN27_NEGATIVE_PROMPT_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 5,
        video: 5,
        audio: 1,
        fixedSlots: RUNNINGHUB_WAN27_FIXED_INPUT_SLOTS,
      }),
      bodyMapping: RUNNINGHUB_VIDEO_WAN27_BODY_MAPPING,
      responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
      taskPolling: null,
      resultTaskIdPath: "taskId",
      executionExtensions: Object["freeze"]({
        bodyResolver: "runninghubWan27Video",
        endpointResolver: "runninghubWan27VideoEndpoint",
      }),
      prompt: Object["freeze"]({
        placeholder: WAN27_IMAGE_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "image" }),
            placeholder: WAN27_IMAGE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "video" }),
            placeholder: WAN27_VIDEO_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "reference" }),
            placeholder: WAN27_REFERENCE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "edit" }),
            placeholder: WAN27_EDIT_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({
        tooltip: WAN27_HELP_TOOLTIP,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "image" }),
            tooltip: WAN27_IMAGE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "video" }),
            tooltip: WAN27_VIDEO_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "reference" }),
            tooltip: WAN27_REFERENCE_HELP_TOOLTIP,
          }),
          Object["freeze"]({
            when: Object["freeze"]({ field: "wan27_mode", value: "edit" }),
            tooltip: WAN27_EDIT_HELP_TOOLTIP,
          }),
        ]),
      }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "runninghubModel",
          order: 40,
          label: "Wan\x202.7",
          subtitle: "文生 / 图生 / 参考 / 续写 / 编辑",
        }),
      }),
    }),
    Object["freeze"]({
      provider: "runninghub",
      modelId: "runninghub-model/hailuo-02",
      executionId: "runninghub.model-api.video.hailuo-02.v1",
      displayName: "Hailuo\x2002",
      aliases: Object["freeze"]([
        "runninghub-model/hailuo02",
        "runninghub-model/minimax-hailuo",
        "runninghub-model/minimax-hailuo-02",
      ]),
      icon: "images/RH.png",
      description: "RunningHub MiniMax Hailuo 02 model API",
      model: "minimax/hailuo-02",
      endpoint: "/openapi/v2/minimax/hailuo-02/t2v-standard",
      fields: Object["freeze"]([
        RUNNINGHUB_HAILUO_02_QUALITY_FIELD,
        RUNNINGHUB_HAILUO_02_DURATION_FIELD,
        RUNNINGHUB_HAILUO_02_ENABLE_PROMPT_EXPANSION_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 2,
        video: 0,
        audio: 0,
        fixedSlots: RUNNINGHUB_HAILUO_02_FIXED_INPUT_SLOTS,
      }),
      bodyMapping: RUNNINGHUB_VIDEO_HAILUO_02_BODY_MAPPING,
      responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
      taskPolling: null,
      resultTaskIdPath: "taskId",
      executionExtensions: Object["freeze"]({
        bodyResolver: "runninghubHailuo02Video",
        endpointResolver: "runninghubHailuo02VideoEndpoint",
      }),
      prompt: Object["freeze"]({
        placeholder: RUNNINGHUB_HAILUO_02_PROMPT_PLACEHOLDER,
      }),
      help: Object["freeze"]({ tooltip: RUNNINGHUB_HAILUO_02_HELP_TOOLTIP }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "runninghubModel",
          order: 90,
          label: "Hailuo 02",
          subtitle: "文生 / 图生 / 首尾帧 / Fast 图生",
        }),
      }),
    }),
    Object["freeze"]({
      provider: "runninghub",
      modelId: "runninghub-model/hailuo-2.3",
      executionId: "runninghub.model-api.video.hailuo-2-3.v1",
      displayName: "Hailuo\x202.3",
      aliases: Object["freeze"]([
        "runninghub-model/hailuo23",
        "runninghub-model/hailuo-23",
        "runninghub-model/minimax-hailuo-2.3",
        "runninghub-model/minimax-hailuo-23",
      ]),
      icon: "images/RH.png",
      description: "RunningHub MiniMax Hailuo 2.3 model API",
      model: "minimax/hailuo-2.3",
      endpoint: "/openapi/v2/minimax/hailuo-2.3/t2v-standard",
      fields: Object["freeze"]([
        RUNNINGHUB_HAILUO_23_QUALITY_FIELD,
        RUNNINGHUB_HAILUO_23_DURATION_FIELD,
        RUNNINGHUB_HAILUO_02_ENABLE_PROMPT_EXPANSION_FIELD,
      ]),
      inputSlots: createVideoInputSlots({
        image: 1,
        video: 0,
        audio: 0,
        fixedSlots: RUNNINGHUB_HAILUO_23_FIXED_INPUT_SLOTS,
      }),
      bodyMapping: RUNNINGHUB_VIDEO_HAILUO_23_BODY_MAPPING,
      responseMapping: RUNNINGHUB_VIDEO_RESPONSE_MAPPING,
      taskPolling: null,
      resultTaskIdPath: "taskId",
      executionExtensions: Object["freeze"]({
        bodyResolver: "runninghubHailuo23Video",
        endpointResolver: "runninghubHailuo23VideoEndpoint",
      }),
      prompt: Object["freeze"]({
        placeholder: RUNNINGHUB_HAILUO_23_PROMPT_PLACEHOLDER,
      }),
      help: Object["freeze"]({ tooltip: RUNNINGHUB_HAILUO_23_HELP_TOOLTIP }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "runninghubModel",
          order: 80,
          label: "Hailuo 2.3",
          subtitle: "文生 / 图生 / Pro / Fast",
        }),
      }),
    }),
  ]),
  VOLCENGINE_SEEDANCE_2_COMMON_FIELDS = Object["freeze"]([
    VOLCENGINE_SEEDANCE_2_MODE_FIELD,
    VOLCENGINE_SEEDANCE_2_RATIO_FIELD,
    createFooterDurationField({ defaultValue: 5, min: 4, max: 15 }),
    VOLCENGINE_SEEDANCE_2_GENERATE_AUDIO_FIELD,
    VOLCENGINE_SEEDANCE_2_SEED_FIELD,
  ]),
  VOLCENGINE_SEEDANCE_2_INPUT_SLOTS = createVideoInputSlots({
    image: 9,
    video: 3,
    audio: 3,
  }),
  VOLCENGINE_VIDEO_MODELS = Object["freeze"]([
    Object["freeze"]({
      provider: "volcengine",
      modelId: "volcengine/seedance-2.0-fast",
      executionId: "volcengine.model-api.video.seedance-2-fast.v1",
      displayName: "Seedance\x202.0\x20Fast",
      aliases: Object["freeze"]([
        "volcengine/doubao-seedance-2-0-fast",
        "volcengine/doubao-seedance-2-0-fast-260128",
      ]),
      icon: "images/volcengine.svg",
      description: "火山方舟 Seedance 2.0 Fast model API",
      model: "doubao-seedance-2-0-fast-260128",
      endpoint: "/contents/generations/tasks",
      endpointMode: "content-generation-task",
      ratioPolicy: VOLCENGINE_SEEDANCE_VIDEO_RATIO_POLICY,
      fields: Object["freeze"]([
        VOLCENGINE_SEEDANCE_2_MODE_FIELD,
        createVolcengineSeedance2ResolutionField({ include1080p: false }),
        ...VOLCENGINE_SEEDANCE_2_COMMON_FIELDS["slice"](1),
      ]),
      inputSlots: VOLCENGINE_SEEDANCE_2_INPUT_SLOTS,
      bodyMapping: VOLCENGINE_VIDEO_SEEDANCE_2_BODY_MAPPING,
      responseMapping: VOLCENGINE_VIDEO_RESPONSE_MAPPING,
      taskPolling: VOLCENGINE_VIDEO_TASK_POLLING,
      resultTaskIdPath: "id",
      executionExtensions: createVolcengineSeedanceVideoExecutionExtensions(
        VOLCENGINE_SEEDANCE_2_0_VIDEO_POLICY,
      ),
      prompt: Object["freeze"]({
        placeholder: RUNNINGHUB_SEEDANCE_2_TEXT_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "volcengine_seedance_2_mode",
              value: "text2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_TEXT_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "volcengine_seedance_2_mode",
              value: "image2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_IMAGE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "volcengine_seedance_2_mode",
              value: "frames2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_FRAMES_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "volcengine_seedance_2_mode",
              value: "multimodal2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_REFERENCE_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({ tooltip: VOLCENGINE_SEEDANCE_2_HELP_TOOLTIP }),
      extensions: Object["freeze"]({
        videoMenu: Object["freeze"]({
          role: "volcengineOfficial",
          order: 10,
          label: "火山方舟",
          subtitle: "Seedance 2.0 官方 API",
          iconAlt: "volcengine",
        }),
        dreaminaStyleVideo: Object["freeze"]({
          order: 10,
          title: "Seedance\x202.0\x20Fast",
          subtitle: "火山方舟快速版，480p / 720p",
          counterpartKey: "seedance2-fast",
          taskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          defaultForTaskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          resolutionOptionsByTaskType: APIMART_SEEDANCE_FAST_RESOLUTION_BY_TASK,
          durationRangeByTaskType: APIMART_SEEDANCE_DEFAULT_DURATION_BY_TASK,
        }),
      }),
    }),
    Object["freeze"]({
      provider: "volcengine",
      modelId: "volcengine/seedance-2.0",
      executionId: "volcengine.model-api.video.seedance-2.v1",
      displayName: "Seedance\x202.0",
      aliases: Object["freeze"]([
        "volcengine/doubao-seedance-2-0",
        "volcengine/doubao-seedance-2-0-260128",
      ]),
      icon: "images/volcengine.svg",
      description: "火山方舟\x20Seedance\x202.0\x20model\x20API",
      model: "doubao-seedance-2-0-260128",
      endpoint: "/contents/generations/tasks",
      endpointMode: "content-generation-task",
      ratioPolicy: VOLCENGINE_SEEDANCE_VIDEO_RATIO_POLICY,
      fields: Object["freeze"]([
        VOLCENGINE_SEEDANCE_2_MODE_FIELD,
        createVolcengineSeedance2ResolutionField({ include1080p: true }),
        ...VOLCENGINE_SEEDANCE_2_COMMON_FIELDS["slice"](1),
      ]),
      inputSlots: VOLCENGINE_SEEDANCE_2_INPUT_SLOTS,
      bodyMapping: VOLCENGINE_VIDEO_SEEDANCE_2_BODY_MAPPING,
      responseMapping: VOLCENGINE_VIDEO_RESPONSE_MAPPING,
      taskPolling: VOLCENGINE_VIDEO_TASK_POLLING,
      resultTaskIdPath: "id",
      executionExtensions: createVolcengineSeedanceVideoExecutionExtensions(
        VOLCENGINE_SEEDANCE_2_0_VIDEO_POLICY,
      ),
      prompt: Object["freeze"]({
        placeholder: RUNNINGHUB_SEEDANCE_2_TEXT_PROMPT_PLACEHOLDER,
        variants: Object["freeze"]([
          Object["freeze"]({
            when: Object["freeze"]({
              field: "volcengine_seedance_2_mode",
              value: "text2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_TEXT_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "volcengine_seedance_2_mode",
              value: "image2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_IMAGE_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "volcengine_seedance_2_mode",
              value: "frames2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_FRAMES_PROMPT_PLACEHOLDER,
          }),
          Object["freeze"]({
            when: Object["freeze"]({
              field: "volcengine_seedance_2_mode",
              value: "multimodal2video",
            }),
            placeholder: RUNNINGHUB_SEEDANCE_2_REFERENCE_PROMPT_PLACEHOLDER,
          }),
        ]),
      }),
      help: Object["freeze"]({ tooltip: VOLCENGINE_SEEDANCE_2_HELP_TOOLTIP }),
      extensions: Object["freeze"]({
        dreaminaStyleVideo: Object["freeze"]({
          order: 20,
          title: "Seedance 2.0",
          subtitle: "火山方舟标准版，支持\x201080p",
          counterpartKey: "seedance2-standard",
          taskTypes: APIMART_SEEDANCE_DEFAULT_TASK_TYPES,
          resolutionOptionsByTaskType:
            APIMART_SEEDANCE_STANDARD_RESOLUTION_BY_TASK,
          durationRangeByTaskType: APIMART_SEEDANCE_DEFAULT_DURATION_BY_TASK,
        }),
      }),
    }),
  ]),
  VENDOR_VIDEO_MODELS = Object["freeze"]([
    ...APIMART_VIDEO_MODELS,
    ...RUNNINGHUB_VIDEO_MODELS,
    ...VOLCENGINE_VIDEO_MODELS,
  ]);
function isSeedanceVideoManifest(v94) {
  return (
    v94?.["endpointMode"] === "seedance-video-generation" ||
    v94?.["executionExtensions"]?.["bodyResolver"] ===
      "volcengineSeedance2Video"
  );
}
function getVideoManifestRatioPolicy(v95) {
  if (v95?.["ratioPolicy"]) return v95["ratioPolicy"];
  return isSeedanceVideoManifest(v95)
    ? SEEDANCE_VIDEO_RATIO_POLICY
    : VIDEO_SIZE_RATIO_POLICY;
}
export const vendorVideoModelApiModelManifests = Object["freeze"](
  VENDOR_VIDEO_MODELS["map"]((v96) =>
    createVideoModelApiManifest({
      modelId: v96["modelId"],
      executionId: v96["executionId"],
      displayName: v96["displayName"],
      provider: v96["provider"] || "apimart",
      aliases: v96["aliases"],
      icon: v96["icon"] || "AM",
      description: v96["description"],
      fields: v96["fields"],
      inputSlots: v96["inputSlots"],
      prompt: v96["prompt"],
      help: v96["help"],
      footerPlacementOrder: v96["footerPlacementOrder"],
      extensions: Object["freeze"]({
        ...(v96["extensions"] || {}),
        ratioPolicy: getVideoManifestRatioPolicy(v96),
      }),
      ratioPolicy: getVideoManifestRatioPolicy(v96),
    }),
  ),
);
export const vendorVideoModelApiExecutionManifests = Object["freeze"](
  VENDOR_VIDEO_MODELS["map"]((v97) =>
    createVideoExecutionManifest({
      id: v97["executionId"],
      model: v97["model"],
      provider: v97["provider"] || "apimart",
      endpoint: v97["endpoint"] || "/v1/videos/generations",
      endpointMode: v97["endpointMode"],
      extensions: v97["executionExtensions"],
      bodyMapping: v97["bodyMapping"],
      modeModels: v97["modeModels"],
      responseMapping: v97["responseMapping"] || APIMART_VIDEO_RESPONSE_MAPPING,
      taskPolling: Object["prototype"]["hasOwnProperty"]["call"](
        v97,
        "taskPolling",
      )
        ? v97["taskPolling"]
        : APIMART_VIDEO_TASK_POLLING,
      resultTaskIdPath: v97["resultTaskIdPath"] || "task_id",
    }),
  ),
);

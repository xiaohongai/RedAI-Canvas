import {
  deletePromptPresetFromServer,
  fetchPromptPresetsFromServer,
  savePromptPresetToServer,
} from "../../api/promptPresetsApi.js";
import {
  PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT,
  PROMPT_PRESET_TEMPLATE_TYPE_STATIC,
  PROMPT_PRESET_USER_INPUT_PLACEHOLDER,
} from "./promptPresetTemplate.js";
import appStore from "../core/stores/appStore.js";
import { isSubscriptionActive } from "./subscriptionAccess.js";
import { openSettingsPanel } from "./settings/panelSettings.js";
const TEMPLATES = {
    SceneReference:
      "{用户输入}, 生成一张四宫格场景图（没有人物）包含（顶视图 (Plan View)，轴测图/45° 俯视图 (Axonometric View)，2个多个正交立面图 (Elevations)）",
    Panorama360Seamless: {
      type: PROMPT_PRESET_TEMPLATE_TYPE_CONDITIONAL_BY_IMAGE_INPUT,
      imageInputTemplate:
        "360-degree equirectangular panorama, spherical panorama for VR viewing, seamless 360° wrap-around environment 参考图片场景生成{用户输入}",
      textInputTemplate:
        "360-degree\x20equirectangular\x20panorama,\x20spherical\x20panorama\x20for\x20VR\x20viewing,\x20seamless\x20360°\x20wrap-around\x20environment\x20场景为：{用户输入}",
      emptyInputMessage: "请输入场景或添加参考图片",
    },
    characterRef3View:
      "生成全身三视图，右边放正视图，45度的侧视图，后视图，{用户输入 || 灰色背景}",
    characterRef3ViewFace:
      "生成全身三视图以及一张脸部特写（最左边占满三分之一的位置是上半身特写），右边三分之二放正视图，45度的侧视图，后视图，{用户输入 || 灰色背景}",
    characterRefAnalysis:
      "生成人设解析图，包含正视图、侧视图、背视图，以及服装细节拆解、面部特征特写，排版紧凑，{用户输入 || 灰色背景}",
    multiGrid4:
      "生成一张无缝的四宫格（2x2）的连贯剧情分镜图。要求：同一角色的外观、服饰、发型保持一致；场景与光影风格统一；镜头从左上到右下依次推进；每一格都有明确动作与主体，构图干净、排版紧凑。故事/描述：{用户输入 || 一段简短剧情}",
    multiGrid9:
      "生成一张无缝的九宫格（3x3）的连贯剧情分镜图。要求：角色一致性极强（外观、服饰、配色不变）；同一场景基调延续；每格推进一个小动作或情绪变化；分镜顺序从左上到右下；画面干净、排版紧凑。故事/描述：{用户输入 || 一段简短剧情}",
    multiGrid16:
      "生成一张无缝的十六宫格（4x4）的连贯剧情分镜图。要求：角色与关键道具保持完全一致；每一个分镜都必须是下一个分镜的时间上或因果上的延续，不能跳跃，每格节奏更细（动作拆分、表情递进、镜头切换合理）；整体风格统一；分镜顺序从左上到右下；画面干净、排版紧凑。故事/描述：{用户输入 || 一段简短剧情}",
    multiGrid25:
      "生成一张无缝的二十五宫格（5x5）的连贯剧情分镜图。要求：连续叙事、强一致性（角色/服饰/配色/画风固定）；每一个分镜都必须是下一个分镜的时间上或因果上的延续，不能跳跃；镜头语言清晰；分镜顺序从左上到右下；画面干净、排版紧凑。故事/描述：{用户输入\x20||\x20一段简短剧情}",
    storyboardVertical:
      "请根据我后面提供的【用户输入】，生成一张“专业影视分镜设定板 / Storyboard Board”。\n\n要求：\n1. 输出的是一整张竖版分镜板，不是单张插画，不是漫画页，不是海报。\n2. 整体风格为：黑灰底、细线分栏、专业影视项目提案风格。\n3. 参考图规则：如果用户输入中写了“某角色参考@图片1 / 场景参考@图片2”，则必须严格参考对应图片，保持角色外观、服装、发型、年龄气质、场景结构、时代背景、光影氛围的一致性。\n4. 整张图固定分为三部分：\n   - 顶部标题区：标题、总时长、风格关键词\n   - 中部 Storyboard 区：按用户输入中的时间段拆成 4-6 个 CUT，每行分为左中右三栏：\n     左栏：CUT编号 + 时间段\n     中栏：该镜头对应的电影感画面\n     右栏：主体 / 动作 / 描述 / 镜头 / 台词 / 音效\n5. 分镜画面必须叙事连贯、角色一致、场景一致、服装一致、光影一致。\n6. 所有中间画面都要像电影剧照，镜头语言明确，严格体现用户输入中的动作、表情、氛围和情绪推进。\n7. 右侧说明栏必须用简洁专业的中文排版，字段固定为：\n   主体：\n   动作：\n   描述：\n   镜头：\n   台词：\n   音效：\n8. 文字尽量清晰可读，不要乱码，排版整洁克制，高级感强。\n9. 最终输出只生成一张完整的、专业的、电影级影视分镜设定板。\n\n# 【用户输入】\n{用户输入 || 一段简短剧情}",
    storyboardVerticalScene:
      "请根据我后面提供的【用户输入】，生成一张“专业影视分镜设定板 / Storyboard Board”。\n\n要求：\n1. 输出的是一整张竖版分镜板，不是单张插画，不是漫画页，不是海报。\n2. 整体风格为：黑灰底、细线分栏、专业影视项目提案风格。\n3. 参考图规则：如果用户输入中写了“某角色参考@图片1 / 场景参考@图片2”，则必须严格参考对应图片，保持角色外观、服装、发型、年龄气质、场景结构、时代背景、光影氛围的一致性。\n4. 整张图固定分为三部分：\n   - 顶部标题区：标题、总时长、风格关键词\n   - 中部 Storyboard 区：按用户输入中的时间段拆成 4-6 个 CUT，每行分为左中右三栏：\n     左栏：CUT编号 + 时间段\n     中栏：该镜头对应的电影感画面\n     右栏：主体 / 动作 / 描述 / 镜头 / 台词 / 音效\n   - 底部补充区：场景图 Secondary（2张小图）+ 光影与氛围 Lighting & Mood（1张小图）+ 色彩板与风格说明（5-6个色块）\n5. 分镜画面必须叙事连贯、角色一致、场景一致、服装一致、光影一致。\n6. 所有中间画面都要像电影剧照，镜头语言明确，严格体现用户输入中的动作、表情、氛围和情绪推进。\n7. 右侧说明栏必须用简洁专业的中文排版，字段固定为：\n   主体：\n   动作：\n   描述：\n   镜头：\n   台词：\n   音效：\n8. 文字尽量清晰可读，不要乱码，排版整洁克制，高级感强。\n9. 最终输出只生成一张完整的、专业的、电影级影视分镜设定板。\n\n# 【用户输入】\n{用户输入 || 一段简短剧情}",
    storyboardHorizontal:
      "请根据我后面提供的【用户输入】，生成一张“横版专业影视故事板 / Storyboard Sheet”。  \n要求： \n1. 输出必须是一整张横版16:9故事板表格，不是海报，不是漫画页，不是竖版分镜板。 \n2. 主体必须是“表格结构”，每一行对应一个 CUT。 \n3. 表头固定为： CUT｜秒数｜图片内容｜场景｜主体｜动作｜描述｜镜头｜台词｜音效｜色彩/光影 \n4. 按用户输入中的时间顺序，从上到下排列所有 CUT。 \n5. “图片内容”列中，每个 CUT 必须对应一张横向16:9的电影感分镜画面，真实人物质感，镜头语言明确。 \n6. “场景”列用于写该镜头的环境与空间信息。 \n7. “色彩/光影”列用于写该镜头的色调、光源、冷暖关系与氛围重点。 \n8. 其余列分别填写该镜头的主体、动作、描述、镜头、台词、音效，文字风格必须像正规影视故事板备注，简洁、专业、整齐。 \n9. 如果用户输入中有“角色参考@图片1 / 场景参考@图片2 / 道具参考@图片3”，必须严格参考并保持角色、服装、场景、氛围一致。 \n10. 整体风格为黑灰底、细线分栏、专业影视提案风格。 \n11. 最终只输出一张完整的横版故事板表格图。  \n#【用户输入】\n{用户输入 || 一段简短剧情}",
    storyboardHorizontalScene:
      "请根据我后面提供的【用户输入】，生成一张“横版专业影视故事板 / Storyboard Sheet”。  \n要求： \n1. 输出必须是一整张横版16:9故事板表格，不是海报，不是漫画页，不是竖版分镜板。 \n2. 主体必须是“表格结构”，每一行对应一个 CUT。 \n3. 表头固定为： CUT｜秒数｜图片内容｜场景｜主体｜动作｜描述｜镜头｜台词｜音效｜色彩/光影 \n4. 按用户输入中的时间顺序，从上到下排列所有 CUT。 \n5. “图片内容”列中，每个 CUT 必须对应一张横向16:9的电影感分镜画面，真实人物质感，镜头语言明确。 \n6. “场景”列用于写该镜头的环境与空间信息。 \n7. “色彩/光影”列用于写该镜头的色调、光源、冷暖关系与氛围重点。 \n8. 其余列分别填写该镜头的主体、动作、描述、镜头、台词、音效，文字风格必须像正规影视故事板备注，简洁、专业、整齐。 \n9. 如果用户输入中有“角色参考@图片1 / 场景参考@图片2 / 道具参考@图片3”，必须严格参考并保持角色、服装、场景、氛围一致。 \n10. 整体风格为黑灰底、细线分栏、专业影视提案风格。 \n11. 表格底部增加一条补充信息区，包含：场景总设定、综合色彩色板、整体风格说明。 \n12. 最终只输出一张完整的横版故事板表格图。  \n#【用户输入】\n{用户输入 || 一段简短剧情}",
    longToShort:
      "\n    {用户输入} # 对以上的小说剧情文案进行大幅精简（目标篇幅约为原文的50*-70%）\n完整保留原文对话，同时按照“对白驱动剧情”的结构重新梳理旁白与独白，保留原文段落结构与标点符号。\n用第一人称进行改文\n锁定所有对话： 识别并保护所有直接引语，确保一字不改。\n构建开篇（10%）： 提炼原文关键背景（时代、世界观、人物身份），用简短叙事交代框架。\n精简叙事（20%）： 大幅删减环境描写和过度修饰，仅保留连接对话必要的动作和场景推进。\n筛选独白（30%）： 保留能强化冲突、体现人物压力和真实状态的核心心理描写，删去流水账式的心理活动。\n格式输出： 保持小说文本格式，保留标点符号，保留原段落分行（必要时可合并过碎的描述段落，但不可合并对话段落）。\n# 结构与内容规则\n## 【整体篇幅控制】\n总字数目标： 控制在原文的 50-70% 左右。\n精简策略： 由于对话不能动，主要通过大幅删减“非对话部分的废话”来达成字数减半的目标。\n## 【文本结构比例】\n对白（核心）： 占比最高。严格保持原文，不得增删改一字。\n内心独白（约30%）： 紧贴对话，用于强化情绪、痛感、压迫或绝望。\n叙事（约20%）： 仅作铺垫和连接，禁止写成分镜（如“镜头一转”），禁止扩写。\n背景（约10%）： 开篇必须交代，不可省略。\n##【写作形式与风格】\n输出格式： 纯正的小说文本，保留标点符号，保留段落感。\n风格要求： 对白驱动剧情。通过精简旁白，让对话节奏更紧凑，冲突更集中。\n## 禁止项：\n❌ 禁止出现分镜词（特写、远景、淡入淡出）。\n❌ 禁止出现时间轴（0-5秒）。\n❌ 禁止删除或修改任何一句对话。\n❌ 禁止新增原文没有的情节或设定。\n## 情绪与逻辑\n逻辑： 尽管大幅删减了旁白，必须确保对话与动作的衔接流畅，事件顺序严格遵照原文。\n氛围： 突出原文中的冲突与张力，保留关键的情绪转折点。\n## 输出要求\n直接输出修改后的完整文案。\n保留标点符号和段落格式。",
    extractInfo:
      "{用户输入}\n# 筛选出以上故事里的角色（包括主要怪物）、场景以及道具物品\n把以上每个角色根据剧情写出详细中文提示词包括五官相貌，脸型，发型，全身服饰提示词。重要物品，场景\n用 --- 符号来分割每一个角色,先把人设输出完毕，最后再输出场景，如有角色不同状态也需要标注出来(但不需要太详细)，不用输出多余说明，不带有格式\n# 输出示例：\n\n#人设\n1. 主角：沈仪\n# 中文提示词：\n1个青年男性，古风，捕快，英俊硬朗，剑眉星目，黑色长发，凌乱发髻，身穿古代黑色官差制服，衣衫不整，暗黑武侠，电影光效。\n# 中文提示词(受伤状态)：\n.....\n\n---\n\n2. 配角：刘家丫头\n...\n...\n...\n\n---\n# 重要物品\n1. 腰间佩戴的一把制式长刀（佩刀），刀柄古旧；\n2. 。。。。\n# 场景：\n1. 昏暗的破旧土屋或夜晚的院落，月光惨白，暗黑压抑氛围。\n2. ....\n",
    Storyboard1:
      '## 核心任务\n你是一个专业的AI分镜脚本生成器。任务是基于提供的文本信息，生成“视频提示词”的分镜脚本，分割后的上下分镜必须十分丝滑的连贯。\n\n# 输入信息\n\n**故事情节：**\n{用户输入}\n\n# 视频提示词原则\n\n## 视觉关键词密集度\n\n- 规则：为最大化 AI 模型对画面的控制力，必须使用大量具体的、高辨识度的视觉描述词汇\n- 场景、角色、光影、特效必须混合使用（例如：“幽蓝色的霓虹线路”、“血红色的赛博月亮”、“凌厉的金色电光”、“数码化的爆炸效果”）。\n\n## 运镜的专业化和指令化\n\n- 规则：采用专业电影术语而非简单描述，以明确规定画面的动态行为。\n- 严格使用【超广角】、【特写】等**景别**，以及【慢速推轨】、【环绕慢摇】、【动态手持】等**镜头运动**指令。\n\n## *动作的分解与强调\n\n- 逻辑：复杂的动作不能一笔带过，必须分解成关键帧和关键特写，确保动作的冲击力。\n- 使用【爆发式跃出】（远景）接【腰部极限扭转】（近景），再接【接触的瞬间】（慢动作特写），突出高速和高冲击。\n\n## 人物台词\n- 原文中的对话内容不允许进行擅自删改。要把输入文案作为唯一的信息来源，忠实地将其内容转化为分镜脚本，避免添加任何文案中未提及的情节、动作、场景或角色心理活动。\n- 对话要用“”标示出来。\n\n## 时长与节奏的控制：\n\n- 为每个分镜设定一个合理的时长，以控制最终视频的节奏感。短时间用于高冲击特写，长时间用于场景铺垫或关键动作。\n- 提示词应用的视频时长15秒及以内，剧本包含画面，运镜，所以每一幕的提示词不能超过该时间\n\n## 听觉元素\n\n- 在关键动作后备注音效提示，如“尖锐的破空声与低沉的能量轰鸣”或“无台词，只有金属、能量、符文破碎的声音”。\n\n# 输出格式严格遵循的规则：\n1.  保持连续性：\n    - 为保证场景一致性，若前后剧情为统一场景则需要延续上一则剧本的场景\n\n2.  剧情不能改变：\n    - 保留剧情上的所有对话。 \n\n3.  设定角色、场景映射：\n    - 但凡该幕出场的所有角色都应该有角色映射（[人名]参考@图片参考@音频）\n\n4.  输出格式：\n    - 按顺序输出分镜描述，不需要解释或分析过程。\n    - 输出的内容应当没字体样式。\n\n5. **提示词推理限制：不得出现任何违禁词，违禁词包括词典如下**：\n\n“ 血液相关：血液飞溅、喷血、鲜血淋漓、血池、血祭、断头血、内脏出血、血腥场面、血债、血洗\n暴力场景：分尸、碎尸、斩首、砍头、挖眼、掏心、剥皮、凌迟、虐杀、酷刑、断肢、爆头、穿刺、撕咬\n其他暴力：屠杀、灭门、焚尸、鞭尸、尸横遍野、血肉模糊、骨裂、脑浆、内脏外露、残肢断臂\n裸露低俗类：全裸、半裸、袒胸露背、露脐、露臀、露私密部位、一丝不挂、裸体、赤裸 低俗暗示：性感暴露、挑逗性裸露、低俗姿势、暴露隐私部位、酥胸半露、衣不蔽体\n违规场景：色情暗示、艳情、低俗互动、性挑逗、裸露祭祀\n色情与性暗示类：色情、淫秽、嫖娼、卖淫、性交易、一夜情、通奸、乱伦、恋童、兽交 暗示类：约炮、撩骚、打炮、床上戏、胸器、美腿诱惑、性感撩拨、暧昧低俗、艳舞、脱衣舞 敏感部位描述：乳房、阴部、阴茎、臀部\n其他高危敏感词封建迷信：血腥祭祀、活人献祭、血咒、尸变、僵尸吸血、妖魔鬼怪（恐怖化描述，如 "食人恶鬼"） \n危害公序良俗：自残、自杀、暴力教唆、聚众斗殴、黑帮火拼、恐怖袭击、校园暴力\n敏感宗教 / 政治：邪教仪式、极端宗教、分裂、恐怖组织、反动、颠）”\n\n# 固定的模板格式\n    - 使用 ---  作为每一幕提示词的分隔符。 \n    - 提示词第一部分：最顶部固定是（第X幕）无字幕，无BGM\n    - 第二部分为内容（每一幕都用动作来收尾，为了更好的衔接视频上下文）。\n    - 场景基调要固定好！为了更好的衔接上下镜头（如：秋季，大风，漆黑的夜晚）。\n\n## 输出样例\n第一幕：\n无字幕，无BGM\n沈仪的形象参考@图片1音色参考@音频1，犬妖参考@图片2音色参考@音频2\n夜晚，破旧院落。\n【中景镜头】，沈仪脸上挤出僵硬的笑容，用肩膀撞了一下犬妖的胳膊。\n（人声强颜欢笑） 沈仪说：“老弟的本事你还不清楚，哪里快的起来。走走走，今晚我请酒。”\n沈仪试图推着犬妖往外走，但犬妖纹丝不动。\n犬妖低头俯视沈仪，眼神冰冷漠然。\n犬妖甩开沈仪的手，转身走向院内。沈仪下意识伸手去拦，被犬妖毛茸茸的爪子一把抓住手腕。\n（人声冷漠）犬妖说：“伱当我是蠢猪？”\n【特写镜头】，犬妖猛然贴近沈仪的脸，张开满是尖牙的大嘴，唾液拉丝。\n\n--- \n\n第二幕：\n无字幕，无BGM\n沈仪的形象参考@图片1音色参考@音频1，犬妖参考@图片4音色参考@音频3\n夜晚，破旧院落。\n【特写镜头】，犬妖猛然贴近沈仪的脸，张开满是尖牙的大嘴，唾液拉丝。\n（人声愤怒）犬妖说：“姓沈的，你好像真拿自己当个东西了。里面的动静我听的清清楚楚，你他妈敢反水？！”\n【镜头快速后拉】，犬妖抬起粗壮的大腿猛地蹬向沈仪腹部。\n沈仪面部表情扭曲，整个人如破麻袋般倒飞出去，撞破屋门摔入屋内。\n（人声痛苦）沈仪说：“不是，你属狗的？说翻脸就翻脸？”\n（人声愤怒）犬妖说：“给脸不要脸的东西，合该拿你一起来祭我五脏六腑。”\n沈仪瘫软在地，用力捂住小腹\n',
    Storyboard2:
      '## 核心任务\n你是一个专业的AI分镜脚本生成器。任务是基于提供的文本信息，生成“视频提示词”的分镜脚本，分割后的上下分镜必须十分丝滑的连贯。\n# 输入信息\n\n**故事情节：**\n{用户输入}\n\n# 视频提示词原则\n\n## 视觉关键词密集度\n\n- 规则：为最大化 AI 模型对画面的控制力，必须使用大量具体的、高辨识度的视觉描述词汇\n- 场景、角色、光影、特效必须混合使用（例如：“幽蓝色的霓虹线路”、“血红色的赛博月亮”、“凌厉的金色电光”、“数码化的爆炸效果”）。\n\n## 运镜的专业化和指令化\n\n- 规则：采用专业电影术语而非简单描述，以明确规定画面的动态行为。\n- 严格使用【超广角】、【特写】等**景别**，以及【慢速推轨】、【环绕慢摇】、【动态手持】等**镜头运动**指令。\n\n## *动作的分解与强调\n\n- 逻辑：复杂的动作不能一笔带过，必须分解成关键帧和关键特写，确保动作的冲击力。\n- 使用【爆发式跃出】（远景）接【腰部极限扭转】（近景），再接【接触的瞬间】（慢动作特写），突出高速和高冲击。\n\n## 人物台词\n- 原文中的对话内容不允许进行擅自删改。要把输入文案作为唯一的信息来源，忠实地将其内容转化为分镜脚本，避免添加任何文案中未提及的情节、动作、场景或角色心理活动。\n- 对话要用“”标示出来。\n\n## 时长与节奏的控制：\n\n- 为每个分镜设定一个合理的时长，以控制最终视频的节奏感。短时间用于高冲击特写，长时间用于场景铺垫或关键动作。\n- 提示词应用的视频时长15秒及以内，剧本包含画面，运镜，所以每一幕的提示词不能超过该时间\n\n## 听觉元素\n\n- 在关键动作后备注音效提示，如“尖锐的破空声与低沉的能量轰鸣”或“无台词，只有金属、能量、符文破碎的声音”。\n\n# 输出格式严格遵循的规则：\n1.  保持连续性：\n    - 为保证场景一致性，若前后剧情为统一场景则需要延续上一则剧本的场景\n\n2.  剧情不能改变：\n    - 保留剧情上的所有对话。 \n\n3.  设定角色、场景映射：\n    - 但凡该幕出场的所有角色都应该有角色映射（[人名]参考@图片参考@音频）\n\n4.  输出格式：\n    - 按顺序输出分镜描述，不需要解释或分析过程。\n    - 输出给我的内容应当没字体样式。\n\n5. **提示词推理限制：不得出现任何违禁词，违禁词包括词典如下**：\n\n“ 血液相关：血液飞溅、喷血、鲜血淋漓、血池、血祭、断头血、内脏出血、血腥场面、血债、血洗\n暴力场景：分尸、碎尸、斩首、砍头、挖眼、掏心、剥皮、凌迟、虐杀、酷刑、断肢、爆头、穿刺、撕咬\n其他暴力：屠杀、灭门、焚尸、鞭尸、尸横遍野、血肉模糊、骨裂、脑浆、内脏外露、残肢断臂\n裸露低俗类：全裸、半裸、袒胸露背、露脐、露臀、露私密部位、一丝不挂、裸体、赤裸 低俗暗示：性感暴露、挑逗性裸露、低俗姿势、暴露隐私部位、酥胸半露、衣不蔽体\n违规场景：色情暗示、艳情、低俗互动、性挑逗、裸露祭祀\n色情与性暗示类：色情、淫秽、嫖娼、卖淫、性交易、一夜情、通奸、乱伦、恋童、兽交 暗示类：约炮、撩骚、打炮、床上戏、胸器、美腿诱惑、性感撩拨、暧昧低俗、艳舞、脱衣舞 敏感部位描述：乳房、阴部、阴茎、臀部\n其他高危敏感词封建迷信：血腥祭祀、活人献祭、血咒、尸变、僵尸吸血、妖魔鬼怪（恐怖化描述，如 "食人恶鬼"） \n危害公序良俗：自残、自杀、暴力教唆、聚众斗殴、黑帮火拼、恐怖袭击、校园暴力\n敏感宗教 / 政治：邪教仪式、极端宗教、分裂、恐怖组织、反动、颠）”\n\n# 固定的模板格式\n    - 使用 ---  作为每一幕提示词的分隔符。 \n    - 提示词第一部分：最顶部固定是（第X幕）无字幕，无BGM\n    - 第二部分为内容（可以的话每一幕都用动作来收尾，为了更好的衔接视频上下文）。\n    - 场景基调要固定好！为了更好的衔接上下镜头（如：秋季，大风，漆黑的夜晚）。\n\n# 输出样例\n第1幕\n无字幕，无BGM\n沈仪参考@图片1，刘家丫头参考@图片2\n场景参考@图片4 昏暗潮湿的土屋，夜间，油灯摇曳，阴冷压抑的色调，空气中漂浮尘埃。\n0-1.5s：【特写】沈仪猛然睁眼，满头冷汗，呼吸急促。镜头快速推向其手掌，指缝间沾染暗红印记\n1.5-3s：【主观镜头】沈仪视线。床脚刘家丫头衣衫凌乱、瑟瑟发抖；身侧老头佝偻，手中木棒顶端滴落粘稠暗色液体。\n3-6s：【中景】沈仪按着后脑，神情痛苦狰狞，戾气在眉宇间聚集。\n6-9s：【特写】沈仪咬牙，眼神凶狠，胸膛剧烈起伏。\n（愤怒）沈仪：“嗬哧！……我说……”\n音效：沉重的喘息声，心跳如鼓点，油灯爆裂的滋滋声。\n9-15s：【低角度特写】刘丫头突然扑上前来，双手死死抱住沈仪小腿，神情绝望癫狂。\n（惊恐）刘丫头：“爷！我给您！我什么都给您！您放俺爹回乡下好不好？”\n\n--- \n\n第2幕\n.....\n.....\n.....',
    Seedance2VideoFormat:
      "{用户输入}\n如用户指定秒数就按照用户的来，如没指定就按照15秒来写提示词，不要输出多余内容。严格按照下面格式输出提示词\nx-xs：景别，行为\nx-xs：景别，行为\nx-xs：景别，行为\n示例：0-1s：特写镜头，人物拿起刀.............../",
  },
  IMAGE_PRESET_EMPTY_INPUT_MESSAGE = "请输入提示词或添加参考图片",
  staticPromptTemplate = (v0) => ({
    type: PROMPT_PRESET_TEMPLATE_TYPE_STATIC,
    text: v0,
    requireInput: true,
    emptyInputMessage: IMAGE_PRESET_EMPTY_INPUT_MESSAGE,
  });
export const PROMPT_PRESETS = {
  "ai-image": [
    {
      icon: "📐",
      title: "场景参考",
      desc: "一键生成场景多视图和全景图",
      subItems: [
        {
          icon: "📐",
          title: "场景四视图",
          desc: "一键生成场景多视图",
          template: staticPromptTemplate(TEMPLATES["SceneReference"]),
        },
        {
          icon: "🌐",
          title: "360°无缝全景图",
          desc: "生成适合\x20VR\x20查看的一张无缝\x20360°\x20全景图",
          template: TEMPLATES["Panorama360Seamless"],
        },
      ],
    },
    {
      icon: "🧍",
      title: "人设参考",
      desc: "一键生成人物多视图\x20三视图、三视图加脸部、人设拆解图",
      subItems: [
        {
          icon: "🧍",
          title: "人物三视图",
          desc: "纯正的三向视图展示",
          template: staticPromptTemplate(TEMPLATES["characterRef3View"]),
        },
        {
          icon: "🧍",
          title: "人物三视图+脸部",
          desc: "带脸部特写的三视图",
          template: staticPromptTemplate(TEMPLATES["characterRef3ViewFace"]),
        },
        {
          icon: "🧍",
          title: "人设解析图",
          desc: "包含细节拆解的设定集",
          template: staticPromptTemplate(TEMPLATES["characterRefAnalysis"]),
        },
      ],
    },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      title: "多宫格",
      desc: "一键生成剧情连续的多宫格图片",
      subItems: [
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
          title: "4宫格",
          desc: "起承转合更清晰，适合一句话剧情",
          template: staticPromptTemplate(TEMPLATES["multiGrid4"]),
        },
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="3" width="4" height="4"></rect><rect x="10" y="3" width="4" height="4"></rect><rect x="17" y="3" width="4" height="4"></rect><rect x="3" y="10" width="4" height="4"></rect><rect x="10" y="10" width="4" height="4"></rect><rect x="17" y="10" width="4" height="4"></rect><rect x="3" y="17" width="4" height="4"></rect><rect x="10" y="17" width="4" height="4"></rect><rect x="17" y="17" width="4" height="4"></rect></svg>',
          title: "9宫格",
          desc: "3x3 更细动作与情绪递进",
          template: staticPromptTemplate(TEMPLATES["multiGrid9"]),
        },
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M3 3h18v18H3z"></path><path d="M7.5 3v18"></path><path d="M12 3v18"></path><path d="M16.5 3v18"></path><path d="M3 7.5h18"></path><path d="M3 12h18"></path><path d="M3 16.5h18"></path></svg>',
          title: "16宫格",
          desc: "4x4 更密的节奏推进与镜头切换",
          template: staticPromptTemplate(TEMPLATES["multiGrid16"]),
        },
        {
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M3 3h18v18H3z"></path><path d="M6.6 3v18"></path><path d="M10.2 3v18"></path><path d="M13.8 3v18"></path><path d="M17.4 3v18"></path><path d="M3 6.6h18"></path><path d="M3 10.2h18"></path><path d="M3 13.8h18"></path><path d="M3 17.4h18"></path></svg>',
          title: "25宫格",
          desc: "5x5 长连续剧情，适合完整片段",
          template: staticPromptTemplate(TEMPLATES["multiGrid25"]),
        },
      ],
    },
    {
      icon: "🎬",
      title: "故事板分镜",
      desc: "一键生成故事板分镜",
      subItems: [
        {
          icon: "🎬",
          title: "竖版故事分镜",
          desc: "竖版分镜，从上到下推进",
          template: staticPromptTemplate(TEMPLATES["storyboardVertical"]),
        },
        {
          icon: "🎬",
          title: "竖版故事分镜+场景",
          desc: "竖版分镜，包含场景设定参考",
          template: staticPromptTemplate(TEMPLATES["storyboardVerticalScene"]),
        },
        {
          icon: "🎬",
          title: "横版故事分镜",
          desc: "横版分镜，从左到右推进",
          template: staticPromptTemplate(TEMPLATES["storyboardHorizontal"]),
        },
        {
          icon: "🎬",
          title: "横版故事分镜+场景",
          desc: "横版分镜，包含场景设定参考",
          template: staticPromptTemplate(
            TEMPLATES["storyboardHorizontalScene"],
          ),
        },
      ],
    },
  ],
  "ai-text": [
    {
      icon: "📝",
      title: "长篇精缩V1",
      desc: "一键把长篇内容精缩成短篇",
      template: TEMPLATES["longToShort"],
    },
    {
      icon: "📝",
      title: "提取人物场景道具信息",
      desc: "提取文本中的人物、场景、道具信息",
      template: TEMPLATES["extractInfo"],
    },
    {
      icon: "🧍",
      title: "格式化短剧提示词",
      desc: "将小说一键转化为标准AI视频提示词脚本",
      subItems: [
        {
          icon: "📝",
          title: "影视级叙事分镜脚本",
          desc: "将小说一键转化为标准戏剧化脚本，专为AI短剧视频量身定制",
          template: TEMPLATES["Storyboard1"],
        },
        {
          icon: "📝",
          title: "影视级叙事分镜脚本-秒级",
          desc: "精确到秒的光影渲染、运镜与音效控制，专为AI短剧视频量身定制",
          template: TEMPLATES["Storyboard2"],
        },
        {
          icon: "🎬",
          title: "Seedance2.0视频格式",
          desc: "按用户秒数或默认15秒输出 Seedance 2.0 秒级视频提示词",
          template: TEMPLATES["Seedance2VideoFormat"],
        },
      ],
    },
  ],
  "ai-video": [],
};
let customPresets = {};
const FREE_CUSTOM_PRESET_LIMIT = 2,
  SUPPORTED_PRESET_NODE_TYPES = new Set([
    "ai-image",
    "ai-text",
    "ai-video",
    "ai-audio",
  ]),
  NODE_TYPE_LABELS = {
    "ai-image": "图像节点",
    "ai-text": "文本节点",
    "ai-video": "视频节点",
    "ai-audio": "音频节点",
  },
  PRESET_MANAGER_TABS = [
    {
      nodeType: "ai-text",
      label: "文本预设",
      desc: "管理 文本节点 的生成预设",
      icon: "text",
    },
    {
      nodeType: "ai-image",
      label: "图像预设",
      desc: "管理\x20图像节点\x20的生成预设",
      icon: "image",
    },
    {
      nodeType: "ai-video",
      label: "视频预设",
      desc: "管理\x20视频节点\x20的生成预设",
      icon: "video",
    },
    {
      nodeType: "ai-audio",
      label: "音频预设",
      desc: "管理 音频节点 的生成预设",
      icon: "audio",
    },
  ],
  USER_INPUT_PLACEHOLDER = PROMPT_PRESET_USER_INPUT_PLACEHOLDER,
  USER_INPUT_PILL_HTML =
    "<span\x20class=\x22preset-placeholder-pill\x22\x20contenteditable=\x22false\x22\x20data-preset-placeholder=\x22user-input\x22>提示词</span>",
  PRESET_TEMPLATE_PLACEHOLDER_TEXT =
    "例如：生成全身三视图，包含正视图、45度侧视图、后视图，背景简洁\x20人物参考";
export const PROMPT_PRESET_TRIGGER_MODE_DIRECT = "direct";
export const PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT = "insertPrompt";
const PROMPT_PRESET_TRIGGER_MODES = new Set([
  PROMPT_PRESET_TRIGGER_MODE_DIRECT,
  PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT,
]);
export function normalizePromptPresetTriggerMode(v1) {
  const v2 = String(v1 || "")["trim"]();
  return PROMPT_PRESET_TRIGGER_MODES["has"](v2)
    ? v2
    : PROMPT_PRESET_TRIGGER_MODE_DIRECT;
}
export function shouldInsertPromptForPreset(v3 = {}) {
  return (
    normalizePromptPresetTriggerMode(v3?.["triggerMode"]) ===
    PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT
  );
}
function getPromptPresetTriggerModeLabel(v4 = {}) {
  return shouldInsertPromptForPreset(v4) ? "加入提示词" : "直接触发";
}
export async function loadCustomPresets() {
  try {
    customPresets = await fetchPromptPresetsFromServer();
  } catch (v5) {
    console["warn"](
      "[promptPresets]\x20No\x20custom\x20presets\x20found\x20or\x20load\x20failed.",
      v5,
    );
  }
}
export function getPromptPresets(v6) {
  const v7 = PROMPT_PRESETS[v6] || [],
    v8 = customPresets[v6] || [];
  return [...v7, ...v8];
}
function normalizePresetNodeType(v9) {
  const v10 = String(v9 || "")["trim"]();
  return SUPPORTED_PRESET_NODE_TYPES["has"](v10) ? v10 : "ai-image";
}
function normalizePresetManagerNodeType(v11) {
  const v12 = String(v11 || "")["trim"]();
  return PRESET_MANAGER_TABS["some"]((v13) => v13["nodeType"] === v12)
    ? v12
    : "ai-text";
}
export function getCustomPromptPresets(v14) {
  const v15 = normalizePresetNodeType(v14);
  return Array["isArray"](customPresets[v15]) ? [...customPresets[v15]] : [];
}
export function getSlashPromptPresetEntries(v16) {
  const v17 = PROMPT_PRESETS[v16] || [],
    v18 = getCustomPromptPresets(v16);
  if (v18["length"] === 0) return [...v17];
  return [
    ...v17,
    { title: "用户自定义", desc: "已保存的自定义预设", subItems: v18 },
  ];
}
export function canCreateCustomPromptPreset(v19, v20) {
  if (isSubscriptionActive(v20 || {})) return true;
  return getCustomPromptPresets(v19)["length"] < FREE_CUSTOM_PRESET_LIMIT;
}
export function __setCustomPromptPresetsForTest(v21 = {}) {
  customPresets = v21 && typeof v21 === "object" ? { ...v21 } : {};
}
function escapePresetTemplateHtml(v22) {
  return String(v22 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;")
    ["replace"](/"/g, "&quot;");
}
export function renderPresetTemplateEditorHtml(v23 = "") {
  return String(v23 ?? "")
    ["split"](USER_INPUT_PLACEHOLDER)
    ["map"]((v24) => escapePresetTemplateHtml(v24)["replace"](/\r?\n/g, "<br>"))
    ["join"](USER_INPUT_PILL_HTML);
}
export function serializePresetTemplateEditorHtml(v25 = "") {
  const v26 = "__AIC_USER_INPUT_PLACEHOLDER__",
    v27 = String(v25 ?? "")
      ["replace"](
        /<span\b[^>]*\bdata-preset-placeholder=["']user-input["'][^>]*>[\s\S]*?<\/span>/gi,
        v26,
      )
      ["replace"](/<br\b[^>]*\/?>/gi, "\x0a")
      ["replace"](/<\/(div|p)>/gi, "\x0a")
      ["replace"](/<[^>]+>/g, "");
  if (
    typeof document === "undefined" ||
    typeof document["createElement"] !== "function"
  )
    return v27["replace"](/&nbsp;/g, "\x20")
      ["replace"](/&lt;/g, "<")
      ["replace"](/&gt;/g, ">")
      ["replace"](/&quot;/g, "\x22")
      ["replace"](/&#39;/g, "\x27")
      ["replace"](/&amp;/g, "&")
      ["replace"](new RegExp(v26, "g"), USER_INPUT_PLACEHOLDER)
      ["replace"](/\n{3,}/g, "\x0a\x0a")
      ["trim"]();
  const v28 = document["createElement"]("textarea");
  return (
    (v28["innerHTML"] = v27),
    v28["value"]
      ["replace"](new RegExp(v26, "g"), USER_INPUT_PLACEHOLDER)
      ["replace"](/\u00a0/g, "\x20")
      ["replace"](/\n{3,}/g, "\x0a\x0a")
      ["trim"]()
  );
}
function editorHasUserInputPill(v29) {
  return !!v29?.["querySelector"]?.('[data-preset-placeholder="user-input"]');
}
function moveCaretAfterNode(v30) {
  const v31 = window["getSelection"]?.();
  if (!v31) return;
  const v32 = document["createRange"]();
  (v32["setStartAfter"](v30),
    v32["collapse"](true),
    v31["removeAllRanges"](),
    v31["addRange"](v32));
}
function insertUserInputPill(v33) {
  if (editorHasUserInputPill(v33))
    return (
      showPresetManagerToast("一个预设内容只能插入一次提示词", "warn"),
      false
    );
  const v34 = document["createElement"]("span");
  v34["innerHTML"] = USER_INPUT_PILL_HTML;
  const v35 = v34["firstElementChild"],
    v36 = document["createTextNode"]("\x20"),
    v37 = window["getSelection"]?.(),
    v38 =
      v37?.["rangeCount"] &&
      v33["contains"](v37["getRangeAt"](0)["commonAncestorContainer"])
        ? v37["getRangeAt"](0)
        : null;
  return (
    v38
      ? (v38["deleteContents"](),
        v38["insertNode"](v36),
        v38["insertNode"](v35))
      : (v33["appendChild"](v35), v33["appendChild"](v36)),
    moveCaretAfterNode(v36),
    v33["focus"](),
    true
  );
}
function buildPresetModalButton(v39, v40) {
  const v41 = document["createElement"]("button");
  return (
    (v41["type"] = "button"),
    (v41["className"] = v40),
    (v41["textContent"] = v39),
    v41
  );
}
function buildPresetTriggerModeControl(v42) {
  let v43 = normalizePromptPresetTriggerMode(v42);
  const v44 = document["createElement"]("div");
  ((v44["className"] = "preset-manager-trigger-modes"),
    v44["setAttribute"]("role", "group"),
    v44["setAttribute"]("aria-label", "预设触发方式"));
  const v45 = document["createElement"]("span");
  ((v45["className"] = "preset-manager-trigger-mode-label"),
    (v45["textContent"] = "模式："),
    v44["appendChild"](v45));
  const v46 = (v47, v48) => {
      const v49 = buildPresetModalButton(v48, "preset-manager-trigger-mode");
      return (
        (v49["dataset"]["triggerMode"] = v47),
        v49["setAttribute"]("aria-pressed", "false"),
        v49["addEventListener"]("click", () => {
          ((v43 = v47), v50());
        }),
        v44["appendChild"](v49),
        v49
      );
    },
    v51 = v46(PROMPT_PRESET_TRIGGER_MODE_DIRECT, "直接触发"),
    v52 = v46(PROMPT_PRESET_TRIGGER_MODE_INSERT_PROMPT, "加入提示词");
  function v50() {
    [v51, v52]["forEach"]((v53) => {
      const v54 = v53["dataset"]["triggerMode"] === v43;
      (v53["classList"]["toggle"]("is-active", v54),
        v53["setAttribute"]("aria-pressed", v54 ? "true" : "false"));
    });
  }
  return (v50(), { element: v44, getValue: () => v43 });
}
function buildPresetManagerIcon(v55) {
  const v56 = document["createElement"]("span");
  return (
    (v56["className"] =
      "preset-manager-list-icon\x20preset-manager-list-icon--" + v55),
    v56["setAttribute"]("aria-hidden", "true"),
    v56
  );
}
function getPresetThumbSrc(v57) {
  const v58 = String(v57?.["thumbnailDataUrl"] || "")["trim"]();
  if (v58) return v58;
  const v59 = String(v57?.["thumbUrl"] || "")["trim"]();
  if (v59) return v59;
  const v60 = String(v57?.["thumbLocalPath"] || "")["trim"]();
  return v60 ? "/" + v60["replace"](/^\/+/, "") : "";
}
function readPresetThumbnailFile(v61) {
  return new Promise((v62, v63) => {
    if (!v61 || !String(v61["type"] || "")["startsWith"]("image/")) {
      v63(new Error("请选择图片文件"));
      return;
    }
    const v64 = new FileReader();
    ((v64["onload"] = () => v62(String(v64["result"] || ""))),
      (v64["onerror"] = () => v63(new Error("读取缩略图失败"))),
      v64["readAsDataURL"](v61));
  });
}
function buildPresetThumbnailControl({ preset: v65, onUpload: v66 }) {
  const v67 = document["createElement"]("label");
  ((v67["className"] = "preset-manager-list-thumb"),
    (v67["title"] = "上传缩略图"),
    v67["addEventListener"]("click", (v68) => v68["stopPropagation"]()));
  const v69 = getPresetThumbSrc(v65);
  if (v69) {
    const v70 = document["createElement"]("img");
    ((v70["className"] = "preset-manager-list-thumb-img"),
      (v70["src"] = v69),
      (v70["alt"] = ""),
      v67["appendChild"](v70));
  } else {
    const v71 = document["createElement"]("span");
    ((v71["className"] = "preset-manager-list-thumb-plus"),
      (v71["textContent"] = "+"),
      v67["appendChild"](v71));
  }
  const v72 = document["createElement"]("input");
  return (
    (v72["className"] = "preset-manager-thumb-input"),
    (v72["type"] = "file"),
    (v72["accept"] = "image/*"),
    v72["addEventListener"]("click", (v73) => v73["stopPropagation"]()),
    v72["addEventListener"]("change", async () => {
      const v74 = v72["files"]?.[0];
      if (!v74) return;
      try {
        const v75 = await readPresetThumbnailFile(v74);
        v66?.(v75);
      } catch (v76) {
        showPresetManagerToast(v76?.["message"] || "上传缩略图失败", "error");
      } finally {
        v72["value"] = "";
      }
    }),
    v67["appendChild"](v72),
    v67
  );
}
function buildPresetEditorPlaceholder() {
  const v77 = document["createElement"]("div");
  ((v77["className"] = "preset-manager-editor-placeholder"),
    v77["setAttribute"]("aria-hidden", "true"),
    v77["appendChild"](
      document["createTextNode"](PRESET_TEMPLATE_PLACEHOLDER_TEXT + "\x20"),
    ));
  const v78 = document["createElement"]("span");
  return (
    (v78["innerHTML"] = USER_INPUT_PILL_HTML),
    v77["appendChild"](v78["firstElementChild"]),
    v77
  );
}
function isPresetTemplateEditorEmpty(v79) {
  return !serializePresetTemplateEditorHtml(v79?.["innerHTML"] || "");
}
function syncPresetEditorPlaceholder(v80, v81) {
  v81["hidden"] = !isPresetTemplateEditorEmpty(v80);
}
function buildPresetManagerTabIcon(v82) {
  const v83 = document["createElementNS"]("http://www.w3.org/2000/svg", "svg");
  (v83["setAttribute"]("class", "preset-manager-tab-icon"),
    v83["setAttribute"]("width", "16"),
    v83["setAttribute"]("height", "16"),
    v83["setAttribute"]("viewBox", "0 0 24 24"),
    v83["setAttribute"]("fill", "none"),
    v83["setAttribute"]("stroke", "currentColor"),
    v83["setAttribute"]("stroke-width", "2"),
    v83["setAttribute"]("aria-hidden", "true"));
  const v84 = (v85, v86) => {
    const v87 = document["createElementNS"]("http://www.w3.org/2000/svg", v85);
    (Object["entries"](v86)["forEach"](([v88, v89]) =>
      v87["setAttribute"](v88, v89),
    ),
      v83["appendChild"](v87));
  };
  if (v82 === "text")
    return (
      v84("polyline", { points: "4 7 4 4 20 4 20 7" }),
      v84("line", { x1: "9", y1: "20", x2: "15", y2: "20" }),
      v84("line", { x1: "12", y1: "4", x2: "12", y2: "20" }),
      v83
    );
  if (v82 === "image")
    return (
      v84("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
      v84("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
      v84("polyline", { points: "21\x2015\x2016\x2010\x205\x2021" }),
      v83
    );
  if (v82 === "video")
    return (
      v84("polygon", { points: "23 7 16 12 23 17 23 7" }),
      v84("rect", { x: "1", y: "5", width: "15", height: "14", rx: "2" }),
      v83
    );
  if (v82 === "audio")
    return (
      v84("path", { d: "M9\x2018V5l12-2v13" }),
      v84("circle", { cx: "6", cy: "18", r: "3" }),
      v84("circle", { cx: "18", cy: "16", r: "3" }),
      v83
    );
  return v83;
}
function getUniqueDraftTitle(v90) {
  const v91 = new Set(
    (v90 || [])["map"]((v92) => String(v92?.["title"] || "")["trim"]()),
  );
  let v93 = 1,
    v94 = "自定义预设";
  while (v91["has"](v94)) {
    ((v93 += 1), (v94 = "自定义预设 " + v93));
  }
  return v94;
}
function showPresetManagerToast(v95, v96 = "info") {
  window["showToast"]?.(v95, v96);
}
function requestSubscriptionFromPresetManager(v97, { onSuccess: v98 } = {}) {
  v97?.["remove"]();
  if (typeof window["openSubscriptionDialog"] === "function") {
    window["openSubscriptionDialog"]({ onSuccess: v98 });
    return;
  }
  (openSettingsPanel(),
    showPresetManagerToast("请先激活授权后继续添加预设", "warn"));
}
function createPresetEditor({
  nodeType: v99,
  preset: preset = null,
  isDraft: isDraft = false,
  onSaved: v100,
}) {
  const v101 = document["createElement"]("div");
  v101["className"] = "preset-manager-detail";
  const v102 = isDraft ? "" : String(preset?.["title"] || "")["trim"](),
    v103 = String(preset?.["title"] || "")["trim"](),
    v104 = document["createElement"]("label");
  v104["className"] = "preset-manager-field";
  const v105 = document["createElement"]("span");
  ((v105["className"] = "preset-manager-label"),
    (v105["textContent"] = "名字"));
  const v106 = document["createElement"]("input");
  ((v106["className"] = "preset-manager-input"),
    (v106["type"] = "text"),
    (v106["placeholder"] = "预设名称"),
    (v106["value"] = v103),
    v104["appendChild"](v105),
    v104["appendChild"](v106));
  const v107 = document["createElement"]("label");
  v107["className"] = "preset-manager-field";
  const v108 = document["createElement"]("span");
  ((v108["className"] = "preset-manager-label"),
    (v108["textContent"] = "说明"));
  const v109 = document["createElement"]("input");
  ((v109["className"] = "preset-manager-input"),
    (v109["type"] = "text"),
    (v109["placeholder"] = "说明这个预设适合什么场景"),
    (v109["value"] = String(preset?.["desc"] || "")["trim"]()),
    v107["appendChild"](v108),
    v107["appendChild"](v109));
  const v110 = document["createElement"]("div");
  v110["className"] = "preset-manager-template-tools";
  const v111 = document["createElement"]("span");
  ((v111["className"] = "preset-manager-label"),
    (v111["textContent"] = "提示词模板"));
  const v112 = buildPresetModalButton(
    "点击插入提示词栏内容",
    "preset-modal-btn-secondary preset-manager-insert-btn",
  );
  (v110["appendChild"](v111), v110["appendChild"](v112));
  const v113 = document["createElement"]("div");
  v113["className"] = "preset-manager-editor-wrap";
  const v114 = document["createElement"]("div");
  ((v114["className"] = "preset-manager-textarea preset-manager-editor"),
    (v114["contentEditable"] = "true"),
    (v114["spellcheck"] = false),
    (v114["innerHTML"] = renderPresetTemplateEditorHtml(
      preset?.["template"] || "",
    )),
    v112["addEventListener"]("click", () => insertUserInputPill(v114)));
  const v115 = buildPresetEditorPlaceholder();
  (v114["addEventListener"]("input", () =>
    syncPresetEditorPlaceholder(v114, v115),
  ),
    v114["addEventListener"]("blur", () =>
      syncPresetEditorPlaceholder(v114, v115),
    ),
    v113["addEventListener"]("click", () => {
      v114["focus"]();
    }),
    v113["appendChild"](v114),
    v113["appendChild"](v115),
    syncPresetEditorPlaceholder(v114, v115));
  const v116 = buildPresetTriggerModeControl(preset?.["triggerMode"]),
    v117 = buildPresetModalButton("保存", "preset-modal-btn-primary");
  return (
    v117["addEventListener"]("click", async () => {
      const v118 = v106["value"]["trim"](),
        v119 = serializePresetTemplateEditorHtml(v114["innerHTML"]);
      if (!v118) {
        (showPresetManagerToast("请填写预设名称", "warn"), v106["focus"]());
        return;
      }
      if (!v119) {
        (showPresetManagerToast("请填写预设内容", "warn"), v114["focus"]());
        return;
      }
      ((v117["disabled"] = true), (v117["textContent"] = "保存中..."));
      try {
        (await savePromptPresetToServer({
          nodeType: v99,
          title: v118,
          desc: v109["value"]["trim"](),
          template: v119,
          triggerMode: v116["getValue"](),
          thumbnailDataUrl: String(preset?.["thumbnailDataUrl"] || "")[
            "trim"
          ](),
          thumbLocalPath: String(preset?.["thumbLocalPath"] || "")["trim"](),
          originalTitle: v102,
          installId: String(
            window["__aicInstallId"] || globalThis["__aicInstallId"] || "",
          )["trim"](),
        }),
          await loadCustomPresets(),
          showPresetManagerToast("自定义预设已保存", "success"),
          v100?.({ title: v118 }));
      } catch (v120) {
        showPresetManagerToast(
          v120?.["message"] || "保存自定义预设失败",
          "error",
        );
      } finally {
        ((v117["disabled"] = false), (v117["textContent"] = "保存"));
      }
    }),
    v101["appendChild"](v104),
    v101["appendChild"](v107),
    v101["appendChild"](v110),
    v101["appendChild"](v113),
    { element: v101, triggerModeControl: v116["element"], saveButton: v117 }
  );
}
export function openCustomPresetsManager({ nodeType: v121 } = {}) {
  let v122 = normalizePresetManagerNodeType(v121);
  const v123 = document["createElement"]("div");
  v123["className"] = "preset-modal-overlay";
  const v124 = document["createElement"]("div");
  ((v124["className"] = "preset-modal preset-modal--manager"),
    v124["addEventListener"]("click", (v125) => v125["stopPropagation"]()));
  const v126 = document["createElement"]("div");
  v126["className"] = "preset-manager-title-row";
  const v127 = document["createElement"]("div");
  v127["className"] = "preset-manager-title-group";
  const v128 = document["createElement"]("div");
  ((v128["textContent"] = "用户预设"),
    (v128["className"] = "preset-modal-title"));
  const v129 = document["createElement"]("div");
  ((v129["className"] = "preset-modal-desc"),
    (v129["textContent"] =
      PRESET_MANAGER_TABS["find"]((v130) => v130["nodeType"] === v122)?.[
        "desc"
      ] || "管理 " + (NODE_TYPE_LABELS[v122] || "节点") + " 的生成预设"),
    v127["appendChild"](v128),
    v127["appendChild"](v129));
  const v131 = buildPresetModalButton("×", "preset-manager-close-btn");
  (v131["setAttribute"]("aria-label", "关闭"),
    v131["addEventListener"]("click", () => v123["remove"]()),
    v126["appendChild"](v127),
    v126["appendChild"](v131));
  const v132 = document["createElement"]("div");
  ((v132["className"] = "preset-manager-tabs"),
    v132["setAttribute"]("role", "tablist"));
  const v133 = new Map();
  PRESET_MANAGER_TABS["forEach"]((v134) => {
    const v135 = buildPresetModalButton("", "preset-manager-tab");
    (v135["setAttribute"]("role", "tab"),
      v135["appendChild"](buildPresetManagerTabIcon(v134["icon"])));
    const v136 = document["createElement"]("span");
    ((v136["textContent"] = v134["label"]),
      v135["appendChild"](v136),
      v135["addEventListener"]("click", () => {
        ((v122 = v134["nodeType"]), v137());
      }),
      v133["set"](v134["nodeType"], v135),
      v132["appendChild"](v135));
  });
  const v138 = document["createElement"]("div");
  v138["className"] = "preset-manager-shell";
  const v139 = document["createElement"]("div");
  v139["className"] = "preset-manager-sidebar";
  const v140 = buildPresetModalButton("新建", "preset-manager-new-btn"),
    v141 = document["createElement"]("div");
  ((v141["className"] = "preset-manager-list"),
    v139["appendChild"](v140),
    v139["appendChild"](v141));
  const v142 = document["createElement"]("div");
  ((v142["className"] = "preset-manager-detail-pane"),
    v138["appendChild"](v139),
    v138["appendChild"](v142));
  const v143 = document["createElement"]("div");
  v143["className"] = "preset-modal-actions";
  const v144 = new Map(
      PRESET_MANAGER_TABS["map"]((v145) => [
        v145["nodeType"],
        { selectedKey: "", draftPreset: null, draftCounter: 0 },
      ]),
    ),
    v146 = (v147) =>
      v144["get"](v147) || {
        selectedKey: "",
        draftPreset: null,
        draftCounter: 0,
      },
    v148 = (v149) => "saved:" + String(v149?.["title"] || ""),
    v150 = (v151) => (v151 ? "draft:" + v151["id"] : ""),
    v137 = () => {
      (v141["replaceChildren"](),
        v142["replaceChildren"](),
        v143["replaceChildren"]());
      const v152 = PRESET_MANAGER_TABS["find"](
        (v153) => v153["nodeType"] === v122,
      );
      ((v129["textContent"] =
        v152?.["desc"] ||
        "管理\x20" + (NODE_TYPE_LABELS[v122] || "节点") + " 的生成预设"),
        v133["forEach"]((v154, v155) => {
          const v156 = v155 === v122;
          (v154["classList"]["toggle"]("is-active", v156),
            v154["setAttribute"]("aria-selected", v156 ? "true" : "false"));
        }));
      const v157 = v146(v122),
        v158 = appStore["getStateRaw"]()["subscription"] || {},
        v159 = isSubscriptionActive(v158),
        v160 = getCustomPromptPresets(v122),
        v161 = canCreateCustomPromptPreset(v122, v158),
        v162 = [];
      v157["draftPreset"] &&
        v162["push"]({
          key: v150(v157["draftPreset"]),
          preset: v157["draftPreset"],
          isDraft: true,
        });
      v160["forEach"]((v163) => {
        v162["push"]({ key: v148(v163), preset: v163, isDraft: false });
      });
      !v157["selectedKey"] &&
        v162["length"] > 0 &&
        (v157["selectedKey"] = v162[0]["key"]);
      v157["selectedKey"] &&
        v162["length"] > 0 &&
        !v162["some"]((v164) => v164["key"] === v157["selectedKey"]) &&
        (v157["selectedKey"] = v162[0]["key"]);
      if (v162["length"] === 0) {
        const v165 = document["createElement"]("div");
        ((v165["className"] = "preset-manager-empty"),
          (v165["textContent"] = "左侧点击新建，创建一个自定义预设。"),
          v141["appendChild"](v165));
      }
      v162["forEach"](({ key: v166, preset: v167, isDraft: v168 }) => {
        const v169 = document["createElement"]("div");
        (v169["setAttribute"]("role", "button"),
          (v169["tabIndex"] = 0),
          (v169["className"] = "preset-manager-list-item"),
          v169["classList"]["toggle"](
            "is-active",
            v166 === v157["selectedKey"],
          ),
          v169["classList"]["toggle"]("has-trigger-badge", !v168),
          v169["appendChild"](
            buildPresetThumbnailControl({
              preset: v167,
              onUpload: (v170) => {
                ((v167["thumbnailDataUrl"] = v170),
                  (v167["thumbLocalPath"] = ""),
                  (v167["thumbUrl"] = ""),
                  (v157["selectedKey"] = v166),
                  showPresetManagerToast("缩略图已更新，保存后生效", "success"),
                  v137());
              },
            }),
          ));
        const v171 = document["createElement"]("span");
        v171["className"] = "preset-manager-list-text";
        const v172 = document["createElement"]("span");
        ((v172["className"] = "preset-manager-list-title"),
          (v172["textContent"] = v167?.["title"] || "自定义预设"));
        const v173 = document["createElement"]("span");
        ((v173["className"] = "preset-manager-list-desc"),
          (v173["textContent"] =
            v167?.["desc"] || v167?.["template"] || "输入说明与提示词模板"),
          v171["appendChild"](v172),
          v171["appendChild"](v173),
          v169["appendChild"](v171));
        if (!v168) {
          const v174 = document["createElement"]("span");
          ((v174["className"] = "preset-manager-list-trigger-badge"),
            (v174["textContent"] = getPromptPresetTriggerModeLabel(v167)),
            v169["appendChild"](v174));
        }
        (v169["addEventListener"]("click", () => {
          ((v157["selectedKey"] = v166), v137());
        }),
          v169["addEventListener"]("keydown", (v175) => {
            if (v175["key"] !== "Enter" && v175["key"] !== "\x20") return;
            (v175["preventDefault"](), (v157["selectedKey"] = v166), v137());
          }));
        const v176 = buildPresetModalButton("×", "preset-manager-list-delete");
        (v176["setAttribute"](
          "aria-label",
          "删除\x20" + (v167?.["title"] || "自定义预设"),
        ),
          v176["addEventListener"]("click", async (v177) => {
            (v177["preventDefault"](),
              v177["stopPropagation"](),
              (v176["disabled"] = true));
            if (v168) {
              v157["draftPreset"] = null;
              v157["selectedKey"] === v166 && (v157["selectedKey"] = "");
              v137();
              return;
            }
            try {
              (await deletePromptPresetFromServer({
                nodeType: v122,
                title: String(v167?.["title"] || ""),
              }),
                await loadCustomPresets(),
                showPresetManagerToast("自定义预设已删除", "success"),
                v157["selectedKey"] === v166 && (v157["selectedKey"] = ""),
                v137());
            } catch (v178) {
              (showPresetManagerToast(
                v178?.["message"] || "删除自定义预设失败",
                "error",
              ),
                (v176["disabled"] = false));
            }
          }),
          v169["appendChild"](v176),
          v141["appendChild"](v169));
      });
      if (v159) {
        const v179 = document["createElement"]("div");
        ((v179["className"] = "preset-manager-status"),
          (v179["textContent"] = "已授权：可继续添加更多预设。"),
          v143["appendChild"](v179));
      }
      const v180 = v162["find"]((v181) => v181["key"] === v157["selectedKey"]);
      if (v180) {
        const v182 = createPresetEditor({
          nodeType: v122,
          preset: v180["preset"],
          isDraft: v180["isDraft"],
          onSaved: ({ title: v183 } = {}) => {
            ((v157["draftPreset"] = null),
              (v157["selectedKey"] = "saved:" + String(v183 || "")["trim"]()),
              v137());
          },
        });
        (v142["appendChild"](v182["element"]),
          v143["appendChild"](v182["triggerModeControl"]),
          v143["appendChild"](v182["saveButton"]));
      } else {
        const v184 = document["createElement"]("div");
        ((v184["className"] = "preset-manager-detail-empty"),
          (v184["textContent"] = "选择左侧预设，或点击新建开始编辑。"),
          v142["appendChild"](v184));
      }
      v140["disabled"] = !v161;
      if (!v161) {
        const v185 = document["createElement"]("div");
        ((v185["className"] = "preset-manager-limit"),
          (v185["textContent"] =
            "未授权用户每类节点最多 " +
            FREE_CUSTOM_PRESET_LIMIT +
            " 个自定义预设。"));
        const v186 = buildPresetModalButton(
          "去激活授权",
          "preset-modal-btn-secondary",
        );
        (v186["addEventListener"]("click", () =>
          requestSubscriptionFromPresetManager(v123),
        ),
          v185["appendChild"](v186),
          v142["appendChild"](v185));
      }
    };
  (v140["addEventListener"]("click", () => {
    const v187 = v146(v122),
      v188 = appStore["getStateRaw"]()["subscription"] || {};
    if (!canCreateCustomPromptPreset(v122, v188)) {
      (showPresetManagerToast(
        "未授权用户每类节点最多 " + FREE_CUSTOM_PRESET_LIMIT + " 个自定义预设",
        "warn",
      ),
        requestSubscriptionFromPresetManager(v123));
      return;
    }
    ((v187["draftCounter"] += 1),
      (v187["draftPreset"] = {
        id: v187["draftCounter"],
        title: getUniqueDraftTitle(getCustomPromptPresets(v122)),
        desc: "",
        template: "",
        triggerMode: PROMPT_PRESET_TRIGGER_MODE_DIRECT,
      }),
      (v187["selectedKey"] = "draft:" + v187["draftPreset"]["id"]),
      v137());
  }),
    v124["appendChild"](v126),
    v124["appendChild"](v132),
    v124["appendChild"](v138),
    v124["appendChild"](v143),
    v123["appendChild"](v124),
    v137(),
    v123["addEventListener"]("mousedown", (v189) => {
      v189["target"] === v123 && v123["remove"]();
    }),
    document["body"]["appendChild"](v123));
}

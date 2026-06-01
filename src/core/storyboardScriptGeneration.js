import {
  STORYBOARD_SCRIPT_COLUMNS,
  STORYBOARD_SCRIPT_NODE_TYPE,
} from "./storyboardScriptFactory.js";
export const STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION =
  "storyboard-script.v1";
const STORYBOARD_SCRIPT_MAX_SHOT_COUNT = 30;
export const STORYBOARD_SCRIPT_TEXT_ONLY_SYSTEM_PROMPT =
  '你是一个影视广告分镜脚本结构化生成器。用户会自由输入剧情、文案、广告创意、短剧片段或零散要求，不要求用户按固定格式填写。你必须自行识别：故事主题、产品/人物/场景、情绪、风格、镜头数量、总时长、平台比例、台词、音效和画面节奏。\n\n核心任务：\n1. 只处理纯文本输入，不要假设有图片或视频参考。\n2. 如果用户明确写了“30段 / 30个镜头 / 30 cuts / 30 shots / 分成N段 / N个分镜”，rows 数量必须严格等于该数字，但最多不超过 30 个镜头；如果用户指定超过 30 个镜头，必须合并为最关键的 30 个镜头。\n3. 如果用户没有明确指定镜头数量，必须根据内容密度、剧情节奏、平台比例和总时长自行判断 rows 数量，不要固定为 30 个镜头，且最多不超过 30 个镜头。\n4. 如果用户明确写了总时长，按镜头节奏合理分配每条“时长”；如果没有总时长，自行判断每个镜头的合理时长，短促动作可 0.5-1.5 秒，铺垫或关键动作可更长。\n5. 用户输入是广告文案时，按“吸引注意 -> 展示痛点/产品 -> 关键卖点 -> 情绪或反转 -> 收束行动”拆分。\n6. 用户输入是剧情时，按连续因果拆分，不要跳跃，不要让角色、场景、道具前后矛盾；相邻镜头之间要保持动作承接、视线方向、情绪递进、空间方位和道具状态连续。\n7. 每一行都是一个可执行的分镜镜头，字段必须具体、可用于后续图片生成和视频生成。\n8. “图片提示词”和“视频提示词”都必须是该镜头的完整生成总览，不是某一项字段的单独补充，不能只写几个关键词或复述“画面描述”。两者都要整合景别、构图、镜头语言/运镜意图、人物/产品/主体、场景、情绪、动作、表情、行为、服装道具、光影色彩、材质、氛围、风格和参考素材。“图片提示词”要把运镜意图转译成静帧镜头语言、画面张力和主体姿态，可直接给生图模型；“视频提示词”要在同一总览基础上继续写清时序变化、运动轨迹、速度节奏、身体联动、环境动态和转场，可直接给生视频模型。包含人物动作时，不能只写“走路、转身、抬手”这类泛动作，必须写清人物状态、动作意图、速度与节奏、重心变化、肩颈/手臂/躯干/髋部/腿部/脚步的身体联动，以及表情、视线、呼吸、衣物或道具随动作产生的细节。\n9. 多人镜头必须写清主要人物和次要人物的互动关系。过肩镜头、对话镜头、双人同框等场景中，如果一个人在说话或行动，另一个人的反应、停顿、眼神、姿态或细微动作也要按镜头需要写入；不需要每个镜头都强行写反应，但不能让人物像静止背景。\n10. “对白”字段如果包含台词，必须根据剧情、人物性格和当下状态写成“声线质感+语速+情绪底色+发声习惯：“要说的台词””的形式，例如“略沙哑的低声线，语速放慢，压着委屈，句尾轻微发颤：“我真的尽力了。””；不要只写裸台词。\n11. 没有对应内容的字段填空字符串，不要填 null，不要省略字段。\n\n输出要求：\n- 只输出合法 JSON。\n- 不要输出 Markdown，不要包裹代码块，不要解释。\n- 顶层对象必须包含 schemaVersion、type、sourceMode、title、detectedIntent、rows。\n- schemaVersion 必须是 "storyboard-script.v1"。\n- type 必须是 "storyboard-script"。\n- sourceMode 必须是 "text"。\n- detectedIntent.shotCount 必须等于 rows.length。\n- rows 中每个对象必须包含这些中文字段，且按这个顺序输出：\n  镜号、时长、景别、场景、画面描述、角色、角色描述、角色动作、情绪、角色图、参考、图片提示词、视频提示词、对白、音效。\n\nJSON 结构示例如下（只展示 1 行字段结构；正式输出要按用户内容生成完整 rows）：\n{\n  "schemaVersion": "storyboard-script.v1",\n  "type": "storyboard-script",\n  "sourceMode": "text",\n  "title": "根据内容生成的短标题",\n  "detectedIntent": {\n    "shotCount": 1,\n    "totalDurationSeconds": 1,\n    "aspectRatio": "9:16",\n    "style": "电影感",\n    "language": "zh-CN"\n  },\n  "rows": [\n    {\n      "镜号": "1",\n      "时长": "1.0s",\n      "景别": "",\n      "场景": "",\n      "画面描述": "",\n      "角色": "",\n      "角色描述": "",\n      "角色动作": "",\n      "情绪": "",\n      "角色图": "",\n      "参考": "",\n      "图片提示词": "",\n      "视频提示词": "",\n      "对白": "",\n      "音效": ""\n    }\n  ]\n}';
export const STORYBOARD_SCRIPT_TEXT_ONLY_USER_PROMPT_TEMPLATE =
  "请根据下面的用户输入生成分镜脚本 JSON。\n用户输入：\n{用户输入 || 一段适合生成短视频分镜的剧情或文案}";
export const STORYBOARD_SCRIPT_TEXT_ONLY_PROMPT_TEMPLATE =
  STORYBOARD_SCRIPT_TEXT_ONLY_SYSTEM_PROMPT +
  "\x0a\x0a" +
  STORYBOARD_SCRIPT_TEXT_ONLY_USER_PROMPT_TEMPLATE;
export const STORYBOARD_SCRIPT_IMAGE_SYSTEM_PROMPT =
  "你是一个影视广告分镜脚本结构化生成器。用户会自由输入剧情、文案、广告创意、短剧片段或零散要求，并可能提供一张或多张参考图片。用户不需要按固定格式填写。你必须综合文本和图片，自行识别：图片中的主体、产品、人物、场景、风格、构图、情绪、故事主题、镜头数量、总时长、平台比例、台词、音效和画面节奏。\x0a\x0a核心任务：\x0a1.\x20只处理图片+可选文本输入，不要假设有视频参考。\x0a2.\x20参考图片会以\x20@图片1、@图片2\x20这样的顺序出现。必须根据图片可见内容分析，不要编造看不见的品牌、文字、身份或事件。\x0a3.\x20如果用户明确写了“30段\x20/\x2030个镜头\x20/\x2030\x20cuts\x20/\x2030\x20shots\x20/\x20分成N段\x20/\x20N个分镜”，rows\x20数量必须严格等于该数字，但最多不超过\x2030\x20个镜头；如果用户指定超过\x2030\x20个镜头，必须合并为最关键的\x2030\x20个镜头。\x0a4.\x20如果用户没有明确指定镜头数量，必须根据图片数量、内容密度、剧情节奏、平台比例和总时长自行判断\x20rows\x20数量，不要固定为\x2030\x20个镜头，且最多不超过\x2030\x20个镜头。\x0a5.\x20如果图片明显是产品、人物、场景或风格参考，则围绕这些视觉信息扩展成可执行分镜；如果图片明显是连续帧或多张关键帧，则按图片顺序组织镜头连续性。\x0a6.\x20“角色图”字段填写对应角色、主体或产品参考图的\x20@图片N，供界面渲染缩略图；“参考”字段也必须保留，填写该镜头用到的图片参考总览，可包含角色、产品、场景、风格或连续关键帧的\x20@图片N，多个引用用“、”分隔。不要填写图片\x20URL。\x0a7.\x20用户输入是广告文案时，按“吸引注意\x20->\x20展示痛点/产品\x20->\x20关键卖点\x20->\x20情绪或反转\x20->\x20收束行动”拆分。\x0a8.\x20用户输入是剧情时，按连续因果拆分，不要跳跃，不要让角色、场景、道具前后矛盾；相邻镜头之间要保持动作承接、视线方向、情绪递进、空间方位和道具状态连续。\x0a9.\x20每一行都是一个可执行的分镜镜头，字段必须具体、可用于后续图片生成和视频生成。\x0a10.\x20“图片提示词”和“视频提示词”都必须是该镜头的完整生成总览，不是某一项字段的单独补充，不能只写几个关键词或复述“画面描述”。两者都要整合景别、构图、镜头语言/运镜意图、人物/产品/主体、参考图外观/材质/风格、场景、情绪、动作、表情、行为、服装道具、光影色彩、质感、氛围和参考素材。“图片提示词”要把运镜意图转译成静帧镜头语言、画面张力和主体姿态，可直接给生图模型；“视频提示词”要在同一总览基础上继续写清时序变化、运动轨迹、速度节奏、身体联动、环境动态和转场，可直接给生视频模型。包含人物动作时，不能只写“走路、转身、抬手”这类泛动作，必须写清人物状态、动作意图、速度与节奏、重心变化、肩颈/手臂/躯干/髋部/腿部/脚步的身体联动，以及表情、视线、呼吸、衣物或道具随动作产生的细节。\x0a11.\x20多人镜头必须写清主要人物和次要人物的互动关系。过肩镜头、对话镜头、双人同框等场景中，如果一个人在说话或行动，另一个人的反应、停顿、眼神、姿态或细微动作也要按镜头需要写入；不需要每个镜头都强行写反应，但不能让人物像静止背景。\x0a12.\x20“对白”字段如果包含台词，必须根据剧情、人物性格和当下状态写成“声线质感+语速+情绪底色+发声习惯：“要说的台词””的形式，例如“清亮但克制的声线，语速偏快，带着强装镇定的紧张，开头轻吸一口气：“先别回头。””；不要只写裸台词。\x0a13.\x20没有对应内容的字段填空字符串，不要填\x20null，不要省略字段。\x0a\x0a输出要求：\x0a-\x20只输出合法\x20JSON。\x0a-\x20不要输出\x20Markdown，不要包裹代码块，不要解释。\x0a-\x20顶层对象必须包含\x20schemaVersion、type、sourceMode、title、detectedIntent、rows。\x0a-\x20schemaVersion\x20必须是\x20\x22storyboard-script.v1\x22。\x0a-\x20type\x20必须是\x20\x22storyboard-script\x22。\x0a-\x20sourceMode\x20必须是\x20\x22image\x22。\x0a-\x20detectedIntent.shotCount\x20必须等于\x20rows.length。\x0a-\x20图片输入模式下\x20rows[].参考\x20应填写该镜头用到的\x20@图片N\x20参考；没有对应参考时才填空字符串。不要填写图片\x20URL。\x0a-\x20rows\x20中每个对象必须包含这些中文字段，且按这个顺序输出：\x0a\x20\x20镜号、时长、景别、场景、画面描述、角色、角色描述、角色动作、情绪、角色图、参考、图片提示词、视频提示词、对白、音效。\x0a\x0aJSON\x20结构示例如下（只展示\x201\x20行字段结构；正式输出要按用户内容和参考图片生成完整\x20rows）：\x0a{\x0a\x20\x20\x22schemaVersion\x22:\x20\x22storyboard-script.v1\x22,\x0a\x20\x20\x22type\x22:\x20\x22storyboard-script\x22,\x0a\x20\x20\x22sourceMode\x22:\x20\x22image\x22,\x0a\x20\x20\x22title\x22:\x20\x22根据内容生成的短标题\x22,\x0a\x20\x20\x22detectedIntent\x22:\x20{\x0a\x20\x20\x20\x20\x22shotCount\x22:\x201,\x0a\x20\x20\x20\x20\x22totalDurationSeconds\x22:\x201,\x0a\x20\x20\x20\x20\x22aspectRatio\x22:\x20\x229:16\x22,\x0a\x20\x20\x20\x20\x22style\x22:\x20\x22电影感\x22,\x0a\x20\x20\x20\x20\x22language\x22:\x20\x22zh-CN\x22\x0a\x20\x20},\x0a\x20\x20\x22rows\x22:\x20[\x0a\x20\x20\x20\x20{\x0a\x20\x20\x20\x20\x20\x20\x22镜号\x22:\x20\x221\x22,\x0a\x20\x20\x20\x20\x20\x20\x22时长\x22:\x20\x221.0s\x22,\x0a\x20\x20\x20\x20\x20\x20\x22景别\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22场景\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22画面描述\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22角色\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22角色描述\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22角色动作\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22情绪\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22角色图\x22:\x20\x22@图片1\x22,\x0a\x20\x20\x20\x20\x20\x20\x22参考\x22:\x20\x22@图片1\x22,\x0a\x20\x20\x20\x20\x20\x20\x22图片提示词\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22视频提示词\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22对白\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22音效\x22:\x20\x22\x22\x0a\x20\x20\x20\x20}\x0a\x20\x20]\x0a}";
export const STORYBOARD_SCRIPT_IMAGE_USER_PROMPT_TEMPLATE =
  "请根据下面的用户输入和参考图片生成分镜脚本 JSON。\n参考图片：\n{参考图片 || @图片1}\n\n用户输入：\n{用户输入 || 请根据参考图片生成短视频分镜脚本}";
export const STORYBOARD_SCRIPT_IMAGE_PROMPT_TEMPLATE =
  STORYBOARD_SCRIPT_IMAGE_SYSTEM_PROMPT +
  "\x0a\x0a" +
  STORYBOARD_SCRIPT_IMAGE_USER_PROMPT_TEMPLATE;
export const STORYBOARD_SCRIPT_VIDEO_SYSTEM_PROMPT =
  '你是一个影视广告分镜脚本结构化生成器。用户会自由输入剧情、文案、广告创意、短剧片段或零散要求，并可能提供一个或多个参考视频。用户不需要按固定格式填写。你必须综合文本和视频，自行识别：视频中的镜头边界、场景变化、动作节奏、运镜、主体、产品/人物/场景、情绪、风格、镜头数量、总时长、平台比例、台词、音效和画面节奏。\n\n核心任务：\n1. 只处理视频+可选文本输入。系统会先把视频用本地 ffmpeg 预处理成分段代表帧，这些帧会以 @图片1、@图片2 的顺序出现；原始视频仍会以 @视频1、@视频2 的顺序出现在文字说明里。\n2. 必须优先根据“视频切片参考”里的 @图片N 和对应 @视频N 时间段生成分镜，不要把单个抽帧误当作完整镜头，也不要忽略相邻切片之间的连续关系。\n3. 如果用户明确写了“30段 / 30个镜头 / 30 cuts / 30 shots / 分成N段 / N个分镜 / 自动裁剪N段”，rows 数量必须严格等于该数字，但最多不超过 30 个镜头；如果用户指定超过 30 个镜头，必须合并为最关键的 30 个镜头。\n4. 如果用户没有明确指定镜头数量，必须根据视频切片参考、主体动作变化、场景变化、节奏段落和文本意图自行判断 rows 数量，不要固定为 30 个镜头，且最多不超过 30 个镜头。\n5. 对视频拆分时，一行对应一个语义镜头或可执行剪辑段，不要逐帧罗列；如果切片没有明显剪切，可按动作阶段、运镜阶段、情绪节奏或叙事节点拆分。\n6. “参考”字段必须优先填写对应的 @图片N；如果该帧带有视频时间段，则写成“@图片N / @视频1 00:01.2-00:03.0”。不要填写图片 URL 或视频 URL。\n7. “角色图”字段在纯视频输入模式必须填空字符串；视频代表帧统一放在“参考”字段，供界面渲染缩略图和后续追溯参考素材。\n8. 用户输入是广告文案时，按“吸引注意 -> 展示痛点/产品 -> 关键卖点 -> 情绪或反转 -> 收束行动”拆分。\n9. 用户输入是剧情时，按连续因果拆分，不要跳跃，不要让角色、场景、道具前后矛盾；相邻镜头之间要保持动作承接、视线方向、情绪递进、空间方位和道具状态连续。\n10. 每一行都是一个可执行的分镜镜头，字段必须具体、可用于后续图片生成和视频生成。\n11. “图片提示词”和“视频提示词”都必须是该镜头的完整生成总览，不是某一项字段的单独补充，不能只写几个关键词或复述“画面描述”。两者都要整合景别、构图、镜头语言/运镜意图、人物/产品/主体、代表性关键帧、场景、情绪、动作、表情、行为、服装道具、光影色彩、质感、氛围、风格和参考素材。“图片提示词”要把运镜意图转译成静帧镜头语言、画面张力和主体姿态，可直接给生图模型；“视频提示词”要在同一总览基础上继续写清时序变化、运动轨迹、速度节奏、身体联动、环境动态和转场，并尽量继承参考视频的运动逻辑，可直接给生视频模型。包含人物动作时，不能只写“走路、转身、抬手”这类泛动作，必须写清人物状态、动作意图、速度与节奏、重心变化、肩颈/手臂/躯干/髋部/腿部/脚步的身体联动，以及表情、视线、呼吸、衣物或道具随动作产生的细节；例如同样是走路，要区分轻快小步、沉稳慢步、疲惫拖步、紧张快走等不同身体节奏。\n12. 多人镜头必须写清主要人物和次要人物的互动关系。过肩镜头、对话镜头、双人同框等场景中，如果一个人在说话或行动，另一个人的反应、停顿、眼神、姿态或细微动作也要按镜头需要写入；不需要每个镜头都强行写反应，但不能让人物像静止背景。\n13. “对白”字段如果包含台词，必须根据剧情、人物性格和当下状态写成“声线质感+语速+情绪底色+发声习惯：“要说的台词””的形式，例如“气息很轻的耳语感，语速缓慢，带着疲惫后的释然，句中有短暂停顿：“终于……结束了。””；不要只写裸台词。\n14. 没有对应内容的字段填空字符串，不要填 null，不要省略字段。\n\n输出要求：\n- 只输出合法 JSON。\n- 不要输出 Markdown，不要包裹代码块，不要解释。\n- 顶层对象必须包含 schemaVersion、type、sourceMode、title、detectedIntent、rows。\n- schemaVersion 必须是 "storyboard-script.v1"。\n- type 必须是 "storyboard-script"。\n- sourceMode 必须是 "video"。\n- detectedIntent.shotCount 必须等于 rows.length。\n- 视频输入模式下 rows[].参考 必须引用 @图片N；如果有时间段，同时附带 @视频N 时间段。不要把 @视频N 或 @图片N 写入“角色图”。\n- rows 中每个对象必须包含这些中文字段，且按这个顺序输出：\n  镜号、时长、景别、场景、画面描述、角色、角色描述、角色动作、情绪、角色图、参考、图片提示词、视频提示词、对白、音效。\n\nJSON 结构示例如下（只展示 1 行字段结构；正式输出要按用户内容和参考视频生成完整 rows）：\n{\n  "schemaVersion": "storyboard-script.v1",\n  "type": "storyboard-script",\n  "sourceMode": "video",\n  "title": "根据内容生成的短标题",\n  "detectedIntent": {\n    "shotCount": 1,\n    "totalDurationSeconds": 1,\n    "aspectRatio": "9:16",\n    "style": "电影感",\n    "language": "zh-CN"\n  },\n  "rows": [\n    {\n      "镜号": "1",\n      "时长": "1.0s",\n      "景别": "",\n      "场景": "",\n      "画面描述": "",\n      "角色": "",\n      "角色描述": "",\n      "角色动作": "",\n      "情绪": "",\n      "角色图": "",\n      "参考": "@图片1 / @视频1 00:00.0-00:01.0",\n      "图片提示词": "",\n      "视频提示词": "",\n      "对白": "",\n      "音效": ""\n    }\n  ]\n}';
export const STORYBOARD_SCRIPT_VIDEO_USER_PROMPT_TEMPLATE =
  "请根据下面的用户输入和参考视频生成分镜脚本 JSON。\n视频切片参考：\n{视频切片参考 || 无；请直接根据参考视频理解时间线}\n\n参考视频：\n{参考视频 || @视频1}\n\n用户输入：\n{用户输入 || 请根据参考视频自动拆分镜头并生成短视频分镜脚本}";
export const STORYBOARD_SCRIPT_VIDEO_PROMPT_TEMPLATE =
  STORYBOARD_SCRIPT_VIDEO_SYSTEM_PROMPT +
  "\x0a\x0a" +
  STORYBOARD_SCRIPT_VIDEO_USER_PROMPT_TEMPLATE;
export const STORYBOARD_SCRIPT_MULTIMODAL_PROMPT_TEMPLATE =
  "你是一个影视广告分镜脚本结构化生成器。用户可能同时提供文本、图片参考和视频参考。你必须综合这些输入，自行识别：故事主题、产品/人物/场景、情绪、风格、镜头数量、总时长、平台比例、台词、音效和画面节奏。\x0a\x0a核心任务：\x0a1.\x20同时理解文本、图片和视频参考；图片可作为角色、产品、场景、风格或构图参考，视频可作为动作、运镜、节奏、场景连续性参考。\x0a2.\x20如果用户明确写了“30段\x20/\x2030个镜头\x20/\x2030\x20cuts\x20/\x2030\x20shots\x20/\x20分成N段\x20/\x20N个分镜”，rows\x20数量必须严格等于该数字，但最多不超过\x2030\x20个镜头；如果用户指定超过\x2030\x20个镜头，必须合并为最关键的\x2030\x20个镜头。\x0a3.\x20如果用户明确写了总时长，按镜头节奏合理分配每条“时长”；如果没有总时长，必须根据参考素材的真实镜头切换、动作阶段、内容密度和剧情节奏自行判断\x20rows\x20数量，不要固定为\x2030\x20个镜头，且最多不超过\x2030\x20个镜头。\x0a4.\x20用户输入是广告文案时，按“吸引注意\x20->\x20展示痛点/产品\x20->\x20关键卖点\x20->\x20情绪或反转\x20->\x20收束行动”拆分。\x0a5.\x20用户输入是剧情时，按连续因果拆分，不要跳跃，不要让角色、场景、道具前后矛盾；相邻镜头之间要保持动作承接、视线方向、情绪递进、空间方位和道具状态连续。\x0a6.\x20每一行都是一个可执行的分镜镜头，字段必须具体、可用于后续图片生成和视频生成。\x0a7.\x20图片参考可写入“角色图”或“参考”字段，格式为\x20@图片N；视频参考写入“参考”字段，格式为\x20@视频N\x20或\x20@视频N\x20时间段；不要填写图片或视频\x20URL。\x0a8.\x20“图片提示词”和“视频提示词”都必须是该镜头的完整生成总览，不是某一项字段的单独补充，不能只写几个关键词或复述“画面描述”。两者都要整合景别、构图、镜头语言/运镜意图、人物/产品/主体、参考图外观/材质/风格、场景、情绪、动作、表情、行为、服装道具、光影色彩、质感、氛围、风格和参考素材。“图片提示词”要把运镜意图转译成静帧镜头语言、画面张力和主体姿态，可直接给生图模型；“视频提示词”要在同一总览基础上继续写清时序变化、运动轨迹、速度节奏、身体联动、环境动态和转场，可直接给生视频模型。包含人物动作时，不能只写“走路、转身、抬手”这类泛动作，必须写清人物状态、动作意图、速度与节奏、重心变化、肩颈/手臂/躯干/髋部/腿部/脚步的身体联动，以及表情、视线、呼吸、衣物或道具随动作产生的细节。\x0a9.\x20多人镜头必须写清主要人物和次要人物的互动关系。过肩镜头、对话镜头、双人同框等场景中，如果一个人在说话或行动，另一个人的反应、停顿、眼神、姿态或细微动作也要按镜头需要写入；不需要每个镜头都强行写反应，但不能让人物像静止背景。\x0a10.\x20“对白”字段如果包含台词，必须根据剧情、人物性格和当下状态写成“声线质感+语速+情绪底色+发声习惯：“要说的台词””的形式，例如“温柔偏低的声线，语速平稳，底色带安抚，咬字轻但清晰：“你先听我说。””；不要只写裸台词。\x0a11.\x20没有对应内容的字段填空字符串，不要填\x20null，不要省略字段。\x0a\x0a输出要求：\x0a-\x20只输出合法\x20JSON。\x0a-\x20不要输出\x20Markdown，不要包裹代码块，不要解释。\x0a-\x20顶层对象必须包含\x20schemaVersion、type、sourceMode、title、detectedIntent、rows。\x0a-\x20schemaVersion\x20必须是\x20\x22storyboard-script.v1\x22。\x0a-\x20type\x20必须是\x20\x22storyboard-script\x22。\x0a-\x20sourceMode\x20必须是\x20\x22multimodal\x22。\x0a-\x20rows\x20中每个对象必须包含这些中文字段，且按这个顺序输出：\x0a\x20\x20镜号、时长、景别、场景、画面描述、角色、角色描述、角色动作、情绪、角色图、参考、图片提示词、视频提示词、对白、音效。\x0a\x0aJSON\x20结构如下：\x0a{\x0a\x20\x20\x22schemaVersion\x22:\x20\x22storyboard-script.v1\x22,\x0a\x20\x20\x22type\x22:\x20\x22storyboard-script\x22,\x0a\x20\x20\x22sourceMode\x22:\x20\x22multimodal\x22,\x0a\x20\x20\x22title\x22:\x20\x22根据内容生成的短标题\x22,\x0a\x20\x20\x22detectedIntent\x22:\x20{\x0a\x20\x20\x20\x20\x22shotCount\x22:\x201,\x0a\x20\x20\x20\x20\x22totalDurationSeconds\x22:\x201,\x0a\x20\x20\x20\x20\x22aspectRatio\x22:\x20\x229:16\x22,\x0a\x20\x20\x20\x20\x22style\x22:\x20\x22电影感\x22,\x0a\x20\x20\x20\x20\x22language\x22:\x20\x22zh-CN\x22\x0a\x20\x20},\x0a\x20\x20\x22rows\x22:\x20[\x0a\x20\x20\x20\x20{\x0a\x20\x20\x20\x20\x20\x20\x22镜号\x22:\x20\x221\x22,\x0a\x20\x20\x20\x20\x20\x20\x22时长\x22:\x20\x221.0s\x22,\x0a\x20\x20\x20\x20\x20\x20\x22景别\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22场景\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22画面描述\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22角色\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22角色描述\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22角色动作\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22情绪\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22角色图\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22参考\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22图片提示词\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22视频提示词\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22对白\x22:\x20\x22\x22,\x0a\x20\x20\x20\x20\x20\x20\x22音效\x22:\x20\x22\x22\x0a\x20\x20\x20\x20}\x0a\x20\x20]\x0a}\x0a\x0a用户输入：\x0a{用户输入\x20||\x20请根据参考素材生成短视频分镜脚本}";
export function buildStoryboardScriptTextOnlyPrompt(v0) {
  const v1 = String(v0 || "")["trim"]();
  return STORYBOARD_SCRIPT_TEXT_ONLY_USER_PROMPT_TEMPLATE["replace"](
    /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
    (v2, v3) => v1 || v3 || "",
  );
}
export function buildStoryboardScriptTextOnlySystemPrompt() {
  return STORYBOARD_SCRIPT_TEXT_ONLY_SYSTEM_PROMPT;
}
function normalizePositiveInteger(v4) {
  const v5 = Number(v4);
  return Number["isFinite"](v5) && v5 > 0 ? Math["trunc"](v5) : 0;
}
export function extractRequestedStoryboardShotCount(
  v6,
  { max: max = STORYBOARD_SCRIPT_MAX_SHOT_COUNT } = {},
) {
  const v7 = String(v6 || "");
  if (!v7["trim"]()) return 0;
  const v8 = normalizePositiveInteger(max) || STORYBOARD_SCRIPT_MAX_SHOT_COUNT,
    v9 = [
      /(\d{1,3})\s*(?:段|个镜头|个分镜|镜头|分镜)/gi,
      /(?:分成|拆成|裁剪成|自动裁剪|生成|输出|出)\s*(\d{1,3})\s*(?:段|个|镜头|分镜)?/gi,
      /(\d{1,3})\s*(?:cuts?|shots?)/gi,
    ];
  for (const v10 of v9) {
    v10["lastIndex"] = 0;
    const v11 = v10["exec"](v7),
      v12 = normalizePositiveInteger(v11?.[1]);
    if (v12 > 0) return Math["min"](v12, v8);
  }
  return 0;
}
function getImageReferenceLabels(v13 = {}) {
  if (Array["isArray"](v13["imageLabels"]) && v13["imageLabels"]["length"] > 0)
    return v13["imageLabels"]
      ["map"]((v14) => String(v14 || "")["trim"]())
      ["filter"](Boolean);
  const v15 = normalizePositiveInteger(v13["imageCount"]);
  return Array["from"]({ length: v15 }, (v16, v17) => "@图片" + (v17 + 1));
}
function buildImageReferenceText(v18 = {}) {
  const v19 = getImageReferenceLabels(v18);
  return v19["length"] > 0 ? v19["join"]("、") : "@图片1";
}
function getVideoReferenceLabels(v20 = {}) {
  if (Array["isArray"](v20["videoLabels"]) && v20["videoLabels"]["length"] > 0)
    return v20["videoLabels"]
      ["map"]((v21) => String(v21 || "")["trim"]())
      ["filter"](Boolean);
  const v22 = normalizePositiveInteger(v20["videoCount"]);
  return Array["from"]({ length: v22 }, (v23, v24) => "@视频" + (v24 + 1));
}
function buildVideoReferenceText(v25 = {}) {
  const v26 = getVideoReferenceLabels(v25);
  return v26["length"] > 0 ? v26["join"]("、") : "@视频1";
}
export function buildStoryboardScriptImagePrompt(v27, v28 = {}) {
  const v29 = String(v27 || "")["trim"](),
    v30 = buildImageReferenceText(v28);
  return STORYBOARD_SCRIPT_IMAGE_USER_PROMPT_TEMPLATE["replace"](
    /\{\{?\s*参考图片(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
    (v31, v32) => v30 || v32 || "",
  )["replace"](
    /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
    (v33, v34) => v29 || v34 || "",
  );
}
export function buildStoryboardScriptImageSystemPrompt() {
  return STORYBOARD_SCRIPT_IMAGE_SYSTEM_PROMPT;
}
export function buildStoryboardScriptVideoPrompt(v35, v36 = {}) {
  const v37 = String(v35 || "")["trim"](),
    v38 = buildVideoReferenceText(v36),
    v39 = String(v36["videoFrameSummary"] || "")["trim"]();
  return STORYBOARD_SCRIPT_VIDEO_USER_PROMPT_TEMPLATE["replace"](
    /\{\{?\s*视频切片参考(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
    (v40, v41) => v39 || v41 || "",
  )
    ["replace"](
      /\{\{?\s*参考视频(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
      (v42, v43) => v38 || v43 || "",
    )
    ["replace"](
      /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
      (v44, v45) => v37 || v45 || "",
    );
}
export function buildStoryboardScriptVideoSystemPrompt() {
  return STORYBOARD_SCRIPT_VIDEO_SYSTEM_PROMPT;
}
function hasMultimodalInputs(v46 = {}) {
  return (
    Number(v46["imageCount"] || 0) > 0 ||
    Number(v46["videoCount"] || 0) > 0 ||
    String(v46["summary"] || "")["trim"]()
  );
}
export function buildStoryboardScriptPrompt(v47, v48 = {}) {
  const v49 = String(v47 || "")["trim"](),
    v50 = String(v48["summary"] || "")["trim"](),
    v51 = normalizePositiveInteger(v48["imageCount"]),
    v52 = normalizePositiveInteger(v48["videoCount"]),
    v53 = [v50, v49]["filter"](Boolean)["join"]("\x0a\x0a");
  if (!hasMultimodalInputs(v48))
    return buildStoryboardScriptTextOnlyPrompt(v53);
  if (v51 > 0 && v52 === 0) return buildStoryboardScriptImagePrompt(v53, v48);
  if (v52 > 0 && v51 === 0) return buildStoryboardScriptVideoPrompt(v53, v48);
  return STORYBOARD_SCRIPT_MULTIMODAL_PROMPT_TEMPLATE["replace"](
    /\{\{?\s*用户输入(?:\s*\|\|?\s*([^}]+))?\s*\}\}?/g,
    (v54, v55) => v53 || v55 || "",
  );
}
const STORYBOARD_SCRIPT_SOURCE_MODES = new Set([
  "text",
  "image",
  "video",
  "multimodal",
]);
function normalizeStoryboardScriptSourceMode(v56) {
  const v57 = String(v56 || "")["trim"]();
  return STORYBOARD_SCRIPT_SOURCE_MODES["has"](v57) ? v57 : "text";
}
const COLUMN_ALIASES = Object["freeze"]({
  镜号: ["shotNumber", "shot_number", "shotNo", "shotId", "cut", "cutNumber"],
  时长: [
    "duration",
    "durationText",
    "durationSeconds",
    "duration_seconds",
    "duration_sec",
    "seconds",
    "time",
    "length",
  ],
  画面描述: [
    "plotDescription",
    "visualDescription",
    "imageDescription",
    "sceneDescription",
    "shotDescription",
    "storyboardDescription",
    "frameDescription",
    "screenDescription",
    "description",
    "content",
    "画面",
    "画面内容",
  ],
  角色: [
    "character",
    "characters",
    "characterName",
    "role",
    "subject",
    "人物",
    "主角",
  ],
  角色描述: [
    "characterDescription",
    "characterProfile",
    "characterAppearance",
    "roleDescription",
    "roleProfile",
    "subjectDescription",
    "appearance",
    "人物描述",
    "角色设定",
  ],
  角色图: [
    "characterImage",
    "characterImages",
    "characterImageUrl",
    "characterImageUrls",
    "character_image",
    "roleImage",
    "roleImageUrl",
  ],
  参考: [
    "reference",
    "referenceImage",
    "referenceImages",
    "referenceImageUrl",
    "referenceFrame",
    "referenceFrameImage",
    "referenceVideo",
    "referenceVideoUrl",
    "sourceVideo",
    "sourceVideoUrl",
    "videoReference",
    "referenceUrl",
    "ref",
    "refImage",
    "refVideo",
    "参考图",
    "参考视频",
  ],
  景别: [
    "shotSize",
    "shotScale",
    "shotType",
    "framing",
    "cameraShot",
    "viewSize",
    "镜头景别",
  ],
  场景: [
    "sceneTags",
    "scene",
    "setting",
    "environment",
    "location",
    "locationTags",
    "tags",
    "场景标签",
  ],
  角色动作: [
    "characterAction",
    "action",
    "actionDescription",
    "bodyAction",
    "performance",
    "movement",
    "动作",
  ],
  情绪: ["emotion", "emotionState", "mood", "tone", "feeling", "情感"],
  音效: [
    "audioEffects",
    "soundEffects",
    "soundDesign",
    "ambientSound",
    "sound",
    "sfx",
    "bgm",
    "music",
    "声音",
  ],
  对白: [
    "dialogue",
    "dialog",
    "line",
    "voiceover",
    "voiceOver",
    "narration",
    "subtitle",
    "copy",
    "台词",
    "旁白",
  ],
  图片提示词: [
    "imageGenerationPrompt",
    "imagePrompt",
    "image_prompt",
    "imagePromptCn",
    "stillPrompt",
    "framePrompt",
    "visualPrompt",
    "composition",
    "lighting",
    "lightingAndAtmosphere",
    "artDirection",
    "stylePrompt",
    "prompt",
  ],
  视频提示词: [
    "videoMotionPrompt",
    "videoPrompt",
    "video_prompt",
    "motionPrompt",
    "cameraMovement",
    "cameraMove",
    "cameraMotion",
    "camera",
    "lensMovement",
    "movementDescription",
    "actionPrompt",
    "videoAction",
    "animationPrompt",
    "dynamicPrompt",
  ],
});
function extractJsonCandidate(v58) {
  const v59 = String(v58 || "")["trim"]();
  if (!v59) return "";
  const v60 = v59["match"](/```(?:json)?\s*([\s\S]*?)```/i);
  if (v60?.[1]) return v60[1]["trim"]();
  if (v59["startsWith"]("{") || v59["startsWith"]("[")) return v59;
  const v61 = v59["indexOf"]("{"),
    v62 = v59["lastIndexOf"]("}");
  if (v61 >= 0 && v62 > v61) return v59["slice"](v61, v62 + 1)["trim"]();
  const v63 = v59["indexOf"]("["),
    v64 = v59["lastIndexOf"]("]");
  if (v63 >= 0 && v64 > v63) return v59["slice"](v63, v64 + 1)["trim"]();
  return "";
}
function parseJsonInput(v65) {
  if (v65 && typeof v65 === "object") return v65;
  const v66 = extractJsonCandidate(v65);
  if (!v66) return null;
  try {
    return JSON["parse"](v66);
  } catch {
    return null;
  }
}
function isPlainObject(v67) {
  return v67 && typeof v67 === "object" && !Array["isArray"](v67);
}
function pickRows(v68) {
  if (Array["isArray"](v68)) return v68;
  if (!isPlainObject(v68)) return [];
  if (Array["isArray"](v68["rows"])) return v68["rows"];
  if (Array["isArray"](v68["shots"])) return v68["shots"];
  if (Array["isArray"](v68["scenes"])) return v68["scenes"];
  if (Array["isArray"](v68["items"])) return v68["items"];
  return [];
}
function toCellString(v69, v70 = "") {
  if (v69 == null) return "";
  if (Array["isArray"](v69))
    return v69["map"]((v71) => toCellString(v71, v70))
      ["filter"](Boolean)
      ["join"]("，");
  if (typeof v69 === "number") return v70 === "时长" ? v69 + "s" : String(v69);
  if (typeof v69 === "boolean") return v69 ? "是" : "否";
  if (typeof v69 === "object") {
    const v72 =
      v69["url"] ||
      v69["imageUrl"] ||
      v69["reference_frame_image"] ||
      v69["referenceFrameImage"] ||
      "";
    if ((v70 === "参考" || v70 === "角色图") && v72)
      return String(v72)["trim"]();
    try {
      return JSON["stringify"](v69);
    } catch {
      return String(v69);
    }
  }
  return String(v69)["trim"]();
}
function pickColumnValue(v73, v74) {
  if (Object["hasOwn"](v73, v74)) return v73[v74];
  const v75 = COLUMN_ALIASES[v74] || [];
  for (const v76 of v75) {
    if (Object["hasOwn"](v73, v76)) return v73[v76];
  }
  return "";
}
function normalizeStoryboardRow(v77, v78) {
  const v79 = {};
  for (const v80 of STORYBOARD_SCRIPT_COLUMNS) {
    v79[v80["key"]] = toCellString(
      pickColumnValue(v77, v80["key"]),
      v80["key"],
    );
  }
  if (!v79["镜号"]) v79["镜号"] = String(v78 + 1);
  return v79;
}
const STORYBOARD_IMAGE_PLACEHOLDER_PATTERN = /@图片\d+/g,
  STORYBOARD_VIDEO_PLACEHOLDER_PATTERN = /@视频\d+/g;
function extractStoryboardImagePlaceholders(v81) {
  return String(v81 || "")["match"](STORYBOARD_IMAGE_PLACEHOLDER_PATTERN) || [];
}
function extractStoryboardVideoPlaceholders(v82) {
  return String(v82 || "")["match"](STORYBOARD_VIDEO_PLACEHOLDER_PATTERN) || [];
}
function normalizeStoryboardRowForSourceMode(v83, v84) {
  const v85 = { ...v83 };
  if (v84 === "image" || v84 === "multimodal") {
    const v86 = extractStoryboardImagePlaceholders(v85["角色图"]),
      v87 = extractStoryboardImagePlaceholders(v85["参考"]);
    v86["length"] === 0 &&
      v87["length"] > 0 &&
      (v85["角色图"] = v87["join"]("、"));
  }
  if (v84 === "video" || v84 === "multimodal") {
    const v88 = extractStoryboardImagePlaceholders(v85["角色图"]),
      v89 = extractStoryboardImagePlaceholders(v85["参考"]);
    if (v84 === "video" && v89["length"] === 0 && v88["length"] > 0) {
      const v90 = String(v85["参考"] || "")["trim"]();
      v85["参考"] = v90 ? v88["join"]("、") + " / " + v90 : v88["join"]("、");
    }
    const v91 = extractStoryboardVideoPlaceholders(v85["角色图"]),
      v92 = extractStoryboardVideoPlaceholders(v85["参考"]);
    v92["length"] === 0 &&
      v91["length"] > 0 &&
      (v85["参考"] = v91["join"]("、"));
  }
  return (v84 === "video" && (v85["角色图"] = ""), v85);
}
function hasStoryboardMarker(v93) {
  if (!isPlainObject(v93)) return false;
  return (
    String(v93["schemaVersion"] || "")["trim"]() ===
      STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION ||
    String(v93["type"] || "")["trim"]() === STORYBOARD_SCRIPT_NODE_TYPE
  );
}
function normalizeDetectedIntent(v94, v95) {
  const v96 = isPlainObject(v94) ? { ...v94 } : {},
    v97 = Number(v96["shotCount"]);
  v96["shotCount"] =
    Number["isFinite"](v97) && v97 > 0 ? Math["trunc"](v97) : v95["length"];
  if (!v96["language"]) v96["language"] = "zh-CN";
  return v96;
}
export function normalizeStoryboardScriptGenerationResult(
  v98,
  { requireMarker: requireMarker = true, sourceMode: v99 = "" } = {},
) {
  const v100 = parseJsonInput(v98);
  if (!v100) return { ok: false, error: "NO_VALID_JSON" };
  if (requireMarker && !hasStoryboardMarker(v100))
    return { ok: false, error: "NOT_STORYBOARD_SCRIPT_JSON" };
  const v101 = normalizeStoryboardScriptSourceMode(v99 || v100["sourceMode"]),
    v102 = pickRows(v100)["filter"](isPlainObject),
    v103 = v102["map"](normalizeStoryboardRow)["map"]((v104) =>
      normalizeStoryboardRowForSourceMode(v104, v101),
    );
  if (v103["length"] === 0) return { ok: false, error: "NO_ROWS" };
  const v105 = normalizeDetectedIntent(v100["detectedIntent"], v103),
    v106 = String(v100["title"] || "分镜脚本")["trim"]() || "分镜脚本",
    v107 = [];
  Number["isFinite"](Number(v105["shotCount"])) &&
    Number(v105["shotCount"]) !== v103["length"] &&
    v107["push"]("SHOT_COUNT_MISMATCH");
  const v108 = {
    schemaVersion: STORYBOARD_SCRIPT_GENERATION_SCHEMA_VERSION,
    type: STORYBOARD_SCRIPT_NODE_TYPE,
    sourceMode: v101,
    title: v106,
    detectedIntent: v105,
    rows: v103,
  };
  return {
    ok: true,
    title: v106,
    sourceMode: v108["sourceMode"],
    rows: v103,
    detectedIntent: v105,
    warnings: v107,
    rawJson: JSON["stringify"](v108, null, 2),
  };
}

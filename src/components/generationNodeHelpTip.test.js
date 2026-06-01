import test from "node:test";
import strict from "node:assert/strict";
import {
  getGenerationNodeHelpTooltip,
  stripGenerationNodeHelpMarkup,
} from "./generationNodeHelpTip.js";
(test("generationNodeHelpTip: manifest tooltip supports red emphasis markup", () => {
  const v0 = getGenerationNodeHelpTooltip({
      kind: "audio",
      key: "indextts2_clone",
    }),
    v1 = getGenerationNodeHelpTooltip({ kind: "audio", key: "voice_convert" });
  (strict["match"](v0, /\[\[red:1段参考音色\]\]/),
    strict["match"](v1, /\[\[red:2段音频\]\]/),
    strict["equal"](
      stripGenerationNodeHelpMarkup("输入 [[red:1段参考音色]]"),
      "输入\x201段参考音色",
    ));
}),
  test("generationNodeHelpTip:\x20VEO3\x20tooltip\x20follows\x20generation\x20type", () => {
    const v2 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/veo3-fast",
        nodeData: { generationParams: { generation_type: "frame" } },
      }),
      v3 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/veo3-fast",
        nodeData: { generationParams: { generation_type: "reference" } },
      });
    (strict["match"](v2, /VEO3 首尾帧模式/),
      strict["match"](v2, /\[\[red:不放图\]\]/),
      strict["match"](v2, /文生视频/),
      strict["match"](v2, /\[\[red:放 1 张图\]\]/),
      strict["match"](v2, /普通图生视频/),
      strict["match"](v2, /\[\[red:放 2 张图\]\]/),
      strict["match"](v2, /提示词例子/),
      strict["doesNotMatch"](v2, /jpg|png|webp|10MB/),
      strict["doesNotMatch"](v2, /1-3 张参考图/),
      strict["match"](v3, /VEO3 参考图模式/),
      strict["match"](v3, /\[\[red:不放参考图\]\]/),
      strict["match"](v3, /文生视频/),
      strict["match"](v3, /\[\[red:放 1-3 张参考图\]\]/),
      strict["match"](v3, /提示词例子/),
      strict["match"](v3, /想生成什么动作和镜头/),
      strict["match"](v3, /不会固定成开头和结尾/),
      strict["doesNotMatch"](v3, /jpg|png|webp|10MB/),
      strict["doesNotMatch"](v3, /2 张图/));
  }),
  test("generationNodeHelpTip: Hailuo tooltip explains usage scenarios", () => {
    const v4 = getGenerationNodeHelpTooltip({
      kind: "video",
      key: "apimart/minimax-hailuo",
    });
    (strict["match"](v4, /Hailuo-02 适用场景/),
      strict["match"](v4, /\[\[red:不放图\]\]/),
      strict["match"](v4, /\[\[red:放 1 张首帧\]\]/),
      strict["match"](v4, /\[\[red:放 2 张首尾帧\]\]/),
      strict["match"](v4, /\[\[red:1080p 只做 5 秒\]\]/),
      strict["match"](v4, /提示词例子/),
      strict["doesNotMatch"](v4, /快速预处理|快速预览/));
  }),
  test("generationNodeHelpTip: Kling V3 tooltip explains first and last frame usage", () => {
    const v5 = getGenerationNodeHelpTooltip({
      kind: "video",
      key: "apimart/kling-v3",
    });
    (strict["match"](v5, /Kling V3 视频生成/),
      strict["match"](v5, /\[\[red:不放图\]\]/),
      strict["match"](v5, /\[\[red:接 1 张首帧\]\]/),
      strict["match"](v5, /\[\[red:接首帧 \+ 尾帧\]\]/),
      strict["match"](v5, /\[\[red:生成有声视频\]\]/),
      strict["match"](v5, /多镜头分镜模式暂未开放/),
      strict["match"](v5, /提示词例子/));
  }),
  test("generationNodeHelpTip: Kling V3 Omni tooltip follows selected mode", () => {
    const v6 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/kling-v3-omni",
        nodeData: { generationParams: { kling_v3_omni_mode: "image" } },
      }),
      v7 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/kling-v3-omni",
        nodeData: { generationParams: { kling_v3_omni_mode: "reference" } },
      }),
      v8 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/kling-v3-omni",
        nodeData: { generationParams: { kling_v3_omni_mode: "edit" } },
      });
    (strict["match"](v6, /Kling V3 Omni 图生视频/),
      strict["match"](v6, /\[\[red:接首帧 \+ 尾帧\]\]/),
      strict["match"](v7, /Kling V3 Omni 参考生视频/),
      strict["match"](v7, /\[\[red:接参考图或参考视频\]\]/),
      strict["match"](v8, /Kling V3 Omni 视频编辑/),
      strict["match"](v8, /\[\[red:接 1 个原视频\]\]/));
  }),
  test("generationNodeHelpTip: Kling O1 tooltip explains image reference syntax", () => {
    const v9 = getGenerationNodeHelpTooltip({
      kind: "video",
      key: "apimart/kling-video-o1",
    });
    (strict["match"](v9, /Kling Video O1/),
      strict["match"](v9, /<<<image_1>>>/),
      strict["match"](v9, /<<<image_2>>>/),
      strict["match"](v9, /3-10/));
  }),
  test("generationNodeHelpTip:\x20HappyHorse\x20tooltip\x20follows\x20selected\x20mode", () => {
    const v10 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/happyhorse-1.0",
        nodeData: { generationParams: { happyhorse_mode: "auto" } },
      }),
      v11 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/happyhorse-1.0",
        nodeData: { generationParams: { happyhorse_mode: "image" } },
      }),
      v12 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/happyhorse-1.0",
        nodeData: { generationParams: { happyhorse_mode: "reference" } },
      }),
      v13 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/happyhorse-1.0",
        nodeData: { generationParams: { happyhorse_mode: "edit" } },
      });
    (strict["match"](v10, /HappyHorse 1\.0 文生视频/),
      strict["match"](v10, /\[\[red:没入参时\]\]/),
      strict["match"](v10, /提示词例子/),
      strict["match"](v11, /HappyHorse 1\.0 图生视频/),
      strict["match"](v11, /\[\[red:接 1 张图\]\]/),
      strict["match"](v11, /\[\[red:没入参时\]\]/),
      strict["match"](v11, /仍然是文生视频/),
      strict["match"](v12, /HappyHorse 1\.0 参考图生视频/),
      strict["match"](v12, /\[\[red:接 1-9 张参考图\]\]/),
      strict["match"](v12, /\[\[red:没入参时\]\]/),
      strict["match"](v12, /仍然是文生视频/),
      strict["match"](v13, /HappyHorse 1\.0 视频编辑/),
      strict["match"](v13, /\[\[red:接 1 个视频\]\]/),
      strict["match"](v13, /\[\[red:没入参时\]\]/),
      strict["match"](v13, /最多 5 张参考图/),
      strict["match"](v13, /仍然是文生视频/));
  }),
  test("generationNodeHelpTip: Wan2.7 tooltip follows selected mode", () => {
    const v14 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/wan2.7",
        nodeData: { generationParams: { wan27_mode: "image" } },
      }),
      v15 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/wan2.7",
        nodeData: { generationParams: { wan27_mode: "video" } },
      }),
      v16 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/wan2.7",
        nodeData: { generationParams: { wan27_mode: "reference" } },
      }),
      v17 = getGenerationNodeHelpTooltip({
        kind: "video",
        key: "apimart/wan2.7",
        nodeData: { generationParams: { wan27_mode: "edit" } },
      });
    (strict["match"](v14, /Wan2\.7 图生视频/),
      strict["match"](v14, /\[\[red:没入参时\]\]/),
      strict["match"](v14, /\[\[red:接首帧 \+ 尾帧\]\]/),
      strict["match"](v14, /2-30 秒且不超过 15MB/),
      strict["match"](v15, /Wan2\.7 视频续写/),
      strict["match"](v15, /\[\[red:接 1 个续写视频\]\]/),
      strict["match"](v15, /\[\[red:视频超过 10 秒\]\]/),
      strict["match"](v16, /Wan2\.7 参考生视频/),
      strict["match"](v16, /\[\[red:接参考图或参考视频\]\]/),
      strict["match"](v16, /\[\[red:音频需搭配参考图\]\]/),
      strict["match"](v17, /Wan2\.7 视频编辑/),
      strict["match"](v17, /\[\[red:接 1 个原视频\]\]/),
      strict["match"](v17, /\[\[red:参考视频可选\]\]/),
      strict["match"](v17, /\[\[red:原视频 2-10 秒\]\]/));
  }));

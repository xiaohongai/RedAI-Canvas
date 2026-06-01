const NODE_CREATION_ITEMS = Object["freeze"]({
    "ai-text": Object["freeze"]({
      type: "ai-text",
      label: "文本",
      defaultName: "文本",
      subtitle: "文案、脚本、提示词",
    }),
    "ai-image": Object["freeze"]({
      type: "ai-image",
      label: "图像",
      defaultName: "图像",
      subtitle: "图片、海报、角色素材",
    }),
    "ai-video": Object["freeze"]({
      type: "ai-video",
      label: "视频",
      defaultName: "视频",
      subtitle: "短片、转场、动态镜头",
    }),
    "ai-audio": Object["freeze"]({
      type: "ai-audio",
      label: "音频",
      defaultName: "音频",
      subtitle: "配音、音效、音乐",
    }),
    "source-text": Object["freeze"]({
      type: "source-text",
      label: "源文本",
      defaultName: "源文本",
      subtitle: "文案、脚本、提示词输入",
    }),
    "source-image": Object["freeze"]({
      type: "source-image",
      label: "源图像",
      defaultName: "源图像",
      subtitle: "参考图、首帧、素材",
    }),
    "source-video": Object["freeze"]({
      type: "source-video",
      label: "源视频",
      defaultName: "源视频",
      subtitle: "参考、剪辑、视频输入",
    }),
    "source-audio": Object["freeze"]({
      type: "source-audio",
      label: "源音频",
      defaultName: "源音频",
      subtitle: "配音、音乐、声音参考",
    }),
    "web-preview": Object["freeze"]({
      type: "web-preview",
      label: "网页预览",
      defaultName: "网页预览",
      devOnly: true,
      subtitle: "输入网址并在画布内查看",
    }),
    "panorama-scene": Object["freeze"]({
      type: "panorama-scene",
      label: "3D导演台",
      defaultName: "3D导演台",
      subtitle: "3D 场景、人物、机位",
    }),
    "panorama-360": Object["freeze"]({
      type: "panorama-360",
      label: "360全景图",
      defaultName: "360全景图",
      subtitle: "全景画面与空间关系",
    }),
    "storyboard-script": Object["freeze"]({
      type: "storyboard-script",
      label: "分镜脚本",
      defaultName: "分镜脚本",
      badge: "BETA",
      subtitle: "镜头表、提示词、节奏",
    }),
    collage: Object["freeze"]({
      type: "collage",
      label: "拼图",
      defaultName: "拼图",
      subtitle: "图片排版与导出",
    }),
    "media-clip": Object["freeze"]({
      type: "media-clip",
      label: "剪辑",
      defaultName: "剪辑",
      devOnly: true,
      subtitle: "音视频剪切整理",
    }),
    debug: Object["freeze"]({
      type: "debug",
      label: "调试节点",
      defaultName: "调试节点",
      devOnly: true,
      subtitle: "查看 Payload 与任务状态",
    }),
  }),
  NODE_CREATION_SECTIONS = Object["freeze"]({
    generation: Object["freeze"]({
      id: "generation",
      label: "生成节点",
      itemTypes: Object["freeze"]([
        "ai-text",
        "ai-image",
        "ai-video",
        "ai-audio",
      ]),
    }),
    source: Object["freeze"]({
      id: "source",
      label: "源节点",
      itemTypes: Object["freeze"]([
        "source-text",
        "source-image",
        "source-video",
        "source-audio",
      ]),
    }),
    function: Object["freeze"]({
      id: "function",
      label: "功能节点",
      itemTypes: Object["freeze"]([
        "panorama-scene",
        "panorama-360",
        "storyboard-script",
        "collage",
        "web-preview",
        "media-clip",
        "debug",
      ]),
    }),
  });
export const PICKER_NODE_CREATION_SECTION_IDS = Object["freeze"]([
  "generation",
  "function",
]);
export const CONTEXT_NODE_CREATION_SECTION_IDS = Object["freeze"]([
  "generation",
  "source",
  "function",
]);
export const NODE_CREATION_UPLOAD_ITEM = Object["freeze"]({
  label: "上传文件",
  subtitle: "图片、视频、音频",
});
export function getNodeCreationMenuItem(v0) {
  return NODE_CREATION_ITEMS[String(v0 || "")] || null;
}
export function getNodeCreationMenuSections(
  v1,
  { includeDevOnly: includeDevOnly = false } = {},
) {
  return (Array["isArray"](v1) ? v1 : [])
    ["map"]((v2) => {
      const v3 = NODE_CREATION_SECTIONS[v2];
      if (!v3) return null;
      const v4 = v3["itemTypes"]
        ["map"]((v5) => getNodeCreationMenuItem(v5))
        ["filter"]((v6) => v6 && (includeDevOnly || v6["devOnly"] !== true));
      if (v4["length"] === 0) return null;
      return { id: v3["id"], label: v3["label"], items: v4 };
    })
    ["filter"](Boolean);
}

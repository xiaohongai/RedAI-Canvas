import { createToolbarHtml, createToolbarIconButton } from "./buttonFactory.js";
import { STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG } from "./storyboardScriptToolbarIcon.js";
export const TEXT_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: "v2-text-toolbar",
  items: [
    createToolbarIconButton({
      action: "copy",
      tooltip: "复制",
      label: "复制",
      iconSvg:
        "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22><rect\x20x=\x229\x22\x20y=\x229\x22\x20width=\x2213\x22\x20height=\x2213\x22\x20rx=\x222\x22\x20ry=\x222\x22/><path\x20d=\x22M5\x2015H4a2\x202\x200\x200\x201-2-2V4a2\x202\x200\x200\x201\x202-2h9a2\x202\x200\x200\x201\x202\x202v1\x22/></svg>",
    }),
    createToolbarIconButton({
      action: "clear-empty-lines",
      tooltip: "清除空行",
      label: "清除空行",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h8"/><path d="M18 15l3 3"/><path d="M21 15l-3 3"/></svg>',
    }),
    createToolbarIconButton({
      action: "storyboard-script",
      tooltip: "分镜脚本",
      label: "分镜脚本",
      iconSvg: STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG,
    }),
    createToolbarIconButton({
      action: "fullscreen",
      tooltip: "全屏显示",
      label: "全屏显示",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
    }),
  ],
});

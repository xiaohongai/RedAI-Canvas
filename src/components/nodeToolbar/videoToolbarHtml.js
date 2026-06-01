import {
  createToolbarDivider,
  createToolbarIconButton,
} from "./buttonFactory.js";
import { STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG } from "./storyboardScriptToolbarIcon.js";
const MORE_ICON_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  FACE_DETECTION_ICON_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="5.5"/><path d="M9.5 10.5h.01"/><path d="M14.5 10.5h.01"/><path d="M9.5 14.5c1.5 1.2 3.5 1.2 5 0"/></svg>',
  VIDEO_TOOLBAR_BUTTON_POOL = [
    createToolbarIconButton({
      action: "clip",
      tooltip: "裁剪视频",
      label: "裁剪视频",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
    }),
    createToolbarIconButton({
      action: "extract-keyframes",
      tooltip: "提取关键帧",
      label: "提取关键帧",
      iconSvg:
        "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22\x20stroke-linecap=\x22round\x22\x20stroke-linejoin=\x22round\x22><rect\x20x=\x223\x22\x20y=\x225\x22\x20width=\x2218\x22\x20height=\x2214\x22\x20rx=\x222\x22/><path\x20d=\x22M7\x209h.01\x22/><path\x20d=\x22m8\x2015\x203-3\x202\x202\x203-4\x202\x205\x22/></svg>",
    }),
    createToolbarIconButton({
      action: "keying",
      tooltip: "抠像",
      label: "抠像",
      iconSvg:
        "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22><path\x20d=\x22M7\x203h10a2\x202\x200\x200\x201\x202\x202v14a2\x202\x200\x200\x201-2\x202H7a2\x202\x200\x200\x201-2-2V5a2\x202\x200\x200\x201\x202-2z\x22/><path\x20d=\x22M9\x207h6\x22/><path\x20d=\x22M9\x2011h6\x22/><path\x20d=\x22M9\x2015h6\x22/></svg>",
    }),
    createToolbarIconButton({
      action: "storyboard-script",
      tooltip: "分镜脚本",
      label: "分镜脚本",
      iconSvg: STORYBOARD_SCRIPT_TOOLBAR_ICON_SVG,
    }),
    createToolbarIconButton({
      action: "apimart-face-detect",
      tooltip: "apimart提供 seedance2.0人脸检测",
      label: "人脸检测",
      iconSvg: FACE_DETECTION_ICON_SVG,
    }),
    createToolbarIconButton({
      action: "hd",
      tooltip: "高清",
      label: "高清",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 3v18m9-9H3m14.48-6.36L6.52 17.64m10.96 0L6.52 6.36"/></svg>',
    }),
    createToolbarIconButton({
      action: "replace",
      tooltip: "补帧",
      label: "补帧",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.7" cy="7.2" r="2.2"/><path d="M2.7 18.2c.6-2.7 1.7-4 3-4s2.4 1.3 3 4"/><path d="M10.2 7.4c.7-.5 1.9-.5 2.6 0" opacity=".35"/><path d="M9.4 11.4c1.3-.9 3.9-.9 5.2 0" opacity=".6"/><path d="M10.2 15.6c.8-.7 2.8-.7 3.6 0" opacity=".35"/><circle cx="18.3" cy="7.2" r="2.2"/><path d="M15.3 18.2c.6-2.7 1.7-4 3-4s2.4 1.3 3 4"/></svg>',
    }),
    createToolbarIconButton({
      action: "remove",
      tooltip: "视频擦除",
      label: "视频擦除",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg>',
    }),
    createToolbarIconButton({
      action: "separate-av",
      tooltip: "音画分离",
      label: "音画分离",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="8" height="14" rx="1.5"/><path d="M7 9v6"/><path d="M15 8v8"/><path d="M18 5v14"/><path d="M21 10v4"/></svg>',
    }),
    createToolbarIconButton({
      action: "fullscreen",
      tooltip: "全屏显示",
      label: "全屏显示",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
    }),
    createToolbarIconButton({
      action: "download",
      tooltip: "下载",
      label: "下载",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    }),
    createToolbarIconButton({
      action: "reset-size",
      tooltip: "恢复默认大小",
      label: "恢复默认大小",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 0 1 15.36-6.36"/><path d="M21 12a9 9 0 0 1-15.36 6.36"/><polyline points="21 3 21 9 15 9"/><polyline points="3 21 3 15 9 15"/></svg>',
    }),
  ]["join"]("\x0a\x20\x20\x20\x20\x20\x20");
export const VIDEO_TOOLBAR_HTML =
  '\n<div class="node-floating-toolbar v2-video-toolbar">\n  <div class="v2-img-toolbar-main v2-video-toolbar-main">\n    <div class="v2-img-toolbar-zone v2-img-toolbar-zone-primary" data-zone="outside-primary"></div>\n    ' +
  createToolbarIconButton({
    action: "more-tools",
    tooltip: "更多",
    label: "更多",
    iconSvg: MORE_ICON_SVG,
  }) +
  "\n    " +
  createToolbarDivider()["replace"](
    'class="ftb-divider"',
    'class="ftb-divider v2-img-toolbar-main-divider"',
  ) +
  "\x0a\x20\x20\x20\x20<div\x20class=\x22v2-img-toolbar-zone\x20v2-img-toolbar-zone-secondary\x22\x20data-zone=\x22outside-secondary\x22></div>\x0a\x20\x20</div>\x0a\x20\x20<div\x20class=\x22v2-img-toolbar-more-menu\x20v2-video-toolbar-more-menu\x22\x20data-role=\x22more-menu\x22\x20hidden>\x0a\x20\x20\x20\x20<div\x20class=\x22v2-img-toolbar-more-title\x22>更多工具</div>\x0a\x20\x20\x20\x20<div\x20class=\x22v2-img-toolbar-more-inline\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-img-toolbar-zone\x20v2-img-toolbar-zone-more\x22\x20data-zone=\x22more\x22></div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22ftb-divider\x20v2-img-toolbar-customize-divider\x22></div>\x0a\x20\x20\x20\x20\x20\x20<button\x20class=\x22ftb-btn\x20v2-img-toolbar-customize-toggle\x20act-customize-tools\x22\x20type=\x22button\x22\x20data-tooltip=\x22拖动高亮按钮可换位，可放到外部或更多区\x22\x20aria-label=\x22自定义工具\x22>自定义工具</button>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>\x0a\x20\x20<div\x20class=\x22v2-img-toolbar-button-pool\x20v2-video-toolbar-button-pool\x22\x20data-role=\x22button-pool\x22\x20hidden>\x0a\x20\x20\x20\x20\x20\x20" +
  VIDEO_TOOLBAR_BUTTON_POOL +
  "\n  </div>\n</div>\n";

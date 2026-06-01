import { createToolbarIconButton } from "./buttonFactory.js";
const MORE_ICON_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  FACE_DETECTION_ICON_SVG =
    "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22\x20stroke-linecap=\x22round\x22\x20stroke-linejoin=\x22round\x22><path\x20d=\x22M4\x208V6a2\x202\x200\x200\x201\x202-2h2\x22/><path\x20d=\x22M16\x204h2a2\x202\x200\x200\x201\x202\x202v2\x22/><path\x20d=\x22M20\x2016v2a2\x202\x200\x200\x201-2\x202h-2\x22/><path\x20d=\x22M8\x2020H6a2\x202\x200\x200\x201-2-2v-2\x22/><circle\x20cx=\x2212\x22\x20cy=\x2212\x22\x20r=\x225.5\x22/><path\x20d=\x22M9.5\x2010.5h.01\x22/><path\x20d=\x22M14.5\x2010.5h.01\x22/><path\x20d=\x22M9.5\x2014.5c1.5\x201.2\x203.5\x201.2\x205\x200\x22/></svg>",
  IMAGE_TOOLBAR_BUTTON_POOL = [
    createToolbarIconButton({
      action: "matting",
      tooltip: "遮罩编辑器",
      label: "遮罩编辑器",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><circle cx="12" cy="12" r="5"/><path d="M12 7A5 5 0 0 1 12 17L12 7Z" fill="currentColor" fill-opacity="0.28" stroke="none"/><path d="M7 17l2-2"/><path d="M8.5 18.5l-1-1"/></svg>',
    }),
    createToolbarIconButton({
      action: "repaint",
      tooltip: "重绘",
      label: "重绘",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3.5" y="4.5" width="13" height="13" rx="2"/><path d="m3.5 14 3-3a2 2 0 0 1 2.8 0L12 13.7"/><path d="M18.5 3.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" fill="currentColor" stroke="none"/><path d="m14 18 5-5 2 2-5 5-3 1 1-3Z"/></svg>',
    }),
    createToolbarIconButton({
      action: "erase",
      tooltip: "擦除",
      label: "擦除",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 20H7l-4.5-4.5a2.1 2.1 0 0 1 0-3L11 4a2.1 2.1 0 0 1 3 0l7.5 7.5a2.1 2.1 0 0 1 0 3L16 20"/><path d="m6.5 9.5 8 8"/></svg>',
    }),
    createToolbarIconButton({
      action: "hd",
      tooltip: "高清",
      label: "高清",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 3v18m9-9H3m14.48-6.36L6.52 17.64m10.96 0L6.52 6.36"/></svg>',
    }),
    createToolbarIconButton({
      action: "expand",
      tooltip: "扩图",
      label: "扩图",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    }),
    createToolbarIconButton({
      action: "auto-subject",
      tooltip: "自动识别主体",
      label: "自动识别主体",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
    }),
    createToolbarIconButton({
      action: "apimart-face-detect",
      tooltip: "apimart提供 seedance2.0人脸检测",
      label: "人脸检测",
      iconSvg: FACE_DETECTION_ICON_SVG,
    }),
    createToolbarIconButton({
      action: "panorama-360",
      tooltip: "一键360全景图",
      label: "一键360全景图",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="8"/><path d="M4 12h16"/><path d="M12 4a12 12 0 0 0 0 16"/><path d="M12 4a12 12 0 0 1 0 16"/><path d="M3 8c3-2 6-3 9-3s6 1 9 3"/><path d="M3 16c3 2 6 3 9 3s6-1 9-3"/></svg>',
    }),
    createToolbarIconButton({
      action: "multigrid",
      tooltip: "宫格裁切",
      label: "宫格裁切",
      iconSvg:
        "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22><rect\x20x=\x223\x22\x20y=\x223\x22\x20width=\x227\x22\x20height=\x227\x22></rect><rect\x20x=\x2214\x22\x20y=\x223\x22\x20width=\x227\x22\x20height=\x227\x22></rect><rect\x20x=\x2214\x22\x20y=\x2214\x22\x20width=\x227\x22\x20height=\x227\x22></rect><rect\x20x=\x223\x22\x20y=\x2214\x22\x20width=\x227\x22\x20height=\x227\x22></rect></svg>",
    }),
    createToolbarIconButton({
      action: "multiangle",
      tooltip: "控制角度",
      label: "控制角度",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M12 22V12"/><path d="M12 12 3.27 7.73"/><path d="M12 12l8.73-4.27"/></svg>',
    }),
    createToolbarIconButton({
      action: "annotate",
      tooltip: "标注",
      label: "标注",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    }),
    createToolbarIconButton({
      action: "crop",
      tooltip: "裁切",
      label: "裁切",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
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
  ]["join"]("\n      ");
export const IMAGE_TOOLBAR_HTML =
  '\n<div class="node-floating-toolbar v2-img-toolbar">\n  <div class="v2-img-toolbar-main">\n    <div class="v2-img-toolbar-zone v2-img-toolbar-zone-primary" data-zone="outside-primary"></div>\n    ' +
  createToolbarIconButton({
    action: "more-tools",
    tooltip: "更多",
    label: "更多",
    iconSvg: MORE_ICON_SVG,
  }) +
  "\x0a\x20\x20\x20\x20<div\x20class=\x22ftb-divider\x20v2-img-toolbar-main-divider\x22></div>\x0a\x20\x20\x20\x20<div\x20class=\x22v2-img-toolbar-zone\x20v2-img-toolbar-zone-secondary\x22\x20data-zone=\x22outside-secondary\x22></div>\x0a\x20\x20</div>\x0a\x20\x20<div\x20class=\x22v2-img-toolbar-more-menu\x22\x20data-role=\x22more-menu\x22\x20hidden>\x0a\x20\x20\x20\x20<div\x20class=\x22v2-img-toolbar-more-title\x22>更多工具</div>\x0a\x20\x20\x20\x20<div\x20class=\x22v2-img-toolbar-more-inline\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-img-toolbar-zone\x20v2-img-toolbar-zone-more\x22\x20data-zone=\x22more\x22></div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22ftb-divider\x20v2-img-toolbar-customize-divider\x22></div>\x0a\x20\x20\x20\x20\x20\x20<button\x20class=\x22ftb-btn\x20v2-img-toolbar-customize-toggle\x20act-customize-tools\x22\x20type=\x22button\x22\x20data-tooltip=\x22拖动高亮按钮可换位，可放到外部或更多区\x22\x20aria-label=\x22自定义工具\x22>自定义工具</button>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>\x0a\x20\x20<div\x20class=\x22v2-img-toolbar-button-pool\x22\x20data-role=\x22button-pool\x22\x20hidden>\x0a\x20\x20\x20\x20\x20\x20" +
  IMAGE_TOOLBAR_BUTTON_POOL +
  "\n  </div>\n</div>\n";

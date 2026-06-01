import {
  createToolbarHtml,
  createToolbarIconButton,
} from "../nodeToolbar/buttonFactory.js";
const ICONS = {
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="m12 2 8 4.5v11L12 22 4 17.5v-11L12 2Z"/><path d="M12 22V11.5"/><path d="M20 6.5 12 11.5 4 6.5"/></svg>',
  mannequin:
    "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22><circle\x20cx=\x2212\x22\x20cy=\x225\x22\x20r=\x222.5\x22/><path\x20d=\x22M12\x208v7\x22/><path\x20d=\x22M8.5\x2012.5\x2012\x209l3.5\x203.5\x22/><path\x20d=\x22M9\x2021l3-6\x203\x206\x22/></svg>",
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 3v18M15 3v18M3 15h18"/></svg>',
  capture:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 8h3l2-2h6l2 2h3v10H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  camera:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 7h12a2 2 0 0 1 2 2v8H4z"/><path d="m16 11 4-2v8l-4-2"/><circle cx="10" cy="13" r="2.5"/></svg>',
  focus:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 4v3"/><path d="M12 17v3"/><path d="M4 12h3"/><path d="M17 12h3"/><circle cx="12" cy="12" r="4"/></svg>',
  reset:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
};
export const PANORAMA_SCENE_BOTTOM_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: "panorama-scene-fixed-toolbar",
  items: [
    createToolbarIconButton({
      action: "cube",
      tooltip: "创建方块",
      label: "创建方块",
      iconSvg: ICONS["cube"],
      extraClass:
        "panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--cube",
    }),
    createToolbarIconButton({
      action: "mannequin-entry",
      tooltip: "人偶",
      label: "人偶",
      iconSvg: ICONS["mannequin"],
      extraClass:
        "panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--mannequin",
    }),
    createToolbarIconButton({
      action: "grid",
      tooltip: "矩形排列",
      label: "矩形排列",
      iconSvg: ICONS["grid"],
      extraClass:
        "panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--grid",
    }),
    createToolbarIconButton({
      action: "capture",
      tooltip: "截图",
      label: "截图",
      iconSvg: ICONS["capture"],
      extraClass:
        "panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--capture",
    }),
    createToolbarIconButton({
      action: "camera",
      tooltip: "创建机位书签",
      label: "创建机位书签",
      iconSvg: ICONS["camera"],
      extraClass:
        "panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--camera",
    }),
    createToolbarIconButton({
      action: "focus",
      tooltip: "焦距",
      label: "焦距",
      iconSvg: ICONS["focus"],
      extraClass:
        "panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--focus",
    }),
    createToolbarIconButton({
      action: "reset-view",
      tooltip: "重置视角",
      label: "重置视角",
      iconSvg: ICONS["reset"],
      extraClass:
        "panorama-scene-fixed-toolbar__btn panorama-scene-fixed-toolbar__btn--reset",
    }),
  ],
});

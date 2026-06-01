import {
  createToolbarDivider,
  createToolbarHtml,
  createToolbarIconButton,
} from "../nodeToolbar/buttonFactory.js";
const ICONS = {
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  upload:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/></svg>',
  fullscreen:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  collapseToggle:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="m6 15 6-6 6 6"/></svg>',
};
export const PANORAMA_SCENE_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: "v2-panorama-scene-toolbar",
  items: [
    createToolbarIconButton({
      action: "enter-edit",
      tooltip: "编辑",
      label: "编辑",
      iconSvg: ICONS["edit"],
      extraClass: "panorama-scene-toolbar-btn",
    }),
    createToolbarDivider(),
    createToolbarIconButton({
      action: "upload-panorama",
      tooltip: "上传全景图",
      label: "上传全景图",
      iconSvg: ICONS["upload"],
      extraClass: "panorama-scene-toolbar-btn",
    }),
    createToolbarIconButton({
      action: "fullscreen",
      tooltip: "全屏显示",
      label: "全屏显示",
      iconSvg: ICONS["fullscreen"],
      extraClass: "panorama-scene-toolbar-btn",
    }),
    createToolbarIconButton({
      action: "collapse-node",
      tooltip: "折叠",
      label: "折叠",
      iconSvg: ICONS["collapseToggle"],
      extraClass:
        "panorama-scene-toolbar-btn panorama-scene-toolbar-btn--collapse",
    }),
  ],
});

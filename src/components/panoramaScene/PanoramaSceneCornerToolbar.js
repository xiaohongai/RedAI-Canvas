import {
  createToolbarHtml,
  createToolbarIconButton,
} from "../nodeToolbar/buttonFactory.js";
const ICONS = {
  environment:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4"/></svg>',
};
export const PANORAMA_SCENE_CORNER_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: "v2-panorama-scene-corner-toolbar",
  items: [
    createToolbarIconButton({
      action: "environment-toggle",
      tooltip: "切换到夜景",
      label: "切换环境",
      iconSvg: ICONS["environment"],
      extraClass: "panorama-scene-env-toggle-btn",
    }),
  ],
});

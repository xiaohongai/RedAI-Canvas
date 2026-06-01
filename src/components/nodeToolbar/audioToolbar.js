import { registerStaticInnerHTML } from "../../utils/dom.js";
import { createToolbarHtml, createToolbarIconButton } from "./buttonFactory.js";
const CLIP_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
  SEPARATE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 15v-6"/><path d="M8 18V6"/><path d="M12 4v16"/><path d="M16 6v12"/><path d="M20 9v6"/><path d="M12 3v18"/></svg>',
  SPEED_ICON =
    "<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20width=\x2216\x22\x20height=\x2216\x22><circle\x20cx=\x2212\x22\x20cy=\x2212\x22\x20r=\x2210\x22/><polyline\x20points=\x2212\x206\x2012\x2012\x2016\x2014\x22/></svg>",
  DOWNLOAD_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
function createAudioToolbarItems() {
  const v0 = [
    createToolbarIconButton({
      action: "clip",
      tooltip: "裁剪音频",
      label: "裁剪音频",
      iconSvg: CLIP_ICON,
    }),
    createToolbarIconButton({
      action: "separate",
      tooltip: "人声分离",
      label: "人声分离",
      iconSvg: SEPARATE_ICON,
    }),
    createToolbarIconButton({
      action: "speed",
      tooltip: "倍速",
      label: "倍速",
      iconSvg: SPEED_ICON,
    }),
  ];
  return (
    v0["push"](
      createToolbarIconButton({
        action: "download",
        tooltip: "下载",
        label: "下载",
        iconSvg: DOWNLOAD_ICON,
      }),
    ),
    v0
  );
}
export const SOURCE_AUDIO_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: "audio-toolbar",
  items: createAudioToolbarItems(),
});
export const AUDIO_TOOLBAR_HTML = createToolbarHtml({
  toolbarClass: "audio-toolbar",
  items: createAudioToolbarItems(),
});
(registerStaticInnerHTML("toolbar:audio", AUDIO_TOOLBAR_HTML),
  registerStaticInnerHTML("toolbar:source-audio", SOURCE_AUDIO_TOOLBAR_HTML));

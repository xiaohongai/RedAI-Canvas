export const WEB_PREVIEW_MIN_WIDTH = 1024;
export const WEB_PREVIEW_MIN_HEIGHT = 576;
export const WEB_PREVIEW_MIN_SIZE = Object["freeze"]({
  width: WEB_PREVIEW_MIN_WIDTH,
  height: WEB_PREVIEW_MIN_HEIGHT,
});
export function clampWebPreviewNodeSize(v0 = {}) {
  return {
    width: Math["max"](WEB_PREVIEW_MIN_WIDTH, Number(v0["width"]) || 0),
    height: Math["max"](WEB_PREVIEW_MIN_HEIGHT, Number(v0["height"]) || 0),
  };
}

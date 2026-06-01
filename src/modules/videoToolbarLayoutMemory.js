export const VIDEO_TOOLBAR_ACTIONS = Object["freeze"]([
  "clip",
  "extract-keyframes",
  "keying",
  "storyboard-script",
  "apimart-face-detect",
  "fullscreen",
  "download",
  "reset-size",
  "hd",
  "replace",
  "remove",
  "separate-av",
]);
const DEFAULT_VIDEO_TOOLBAR_LAYOUT = Object["freeze"]({
    outsidePrimary: Object["freeze"]([
      "clip",
      "extract-keyframes",
      "keying",
      "storyboard-script",
      "apimart-face-detect",
    ]),
    outsideSecondary: Object["freeze"]([
      "fullscreen",
      "download",
      "reset-size",
    ]),
    more: Object["freeze"](["hd", "replace", "remove", "separate-av"]),
  }),
  ZONE_KEYS = Object["freeze"](["outsidePrimary", "outsideSecondary", "more"]);
function cloneDefaultLayout() {
  return {
    outsidePrimary: [...DEFAULT_VIDEO_TOOLBAR_LAYOUT["outsidePrimary"]],
    outsideSecondary: [...DEFAULT_VIDEO_TOOLBAR_LAYOUT["outsideSecondary"]],
    more: [...DEFAULT_VIDEO_TOOLBAR_LAYOUT["more"]],
  };
}
function normalizeAction(v0) {
  const v1 = String(v0 || "")["trim"]();
  return VIDEO_TOOLBAR_ACTIONS["includes"](v1) ? v1 : "";
}
export function getDefaultVideoToolbarLayout() {
  return cloneDefaultLayout();
}
export function normalizeVideoToolbarLayout(v2) {
  const v3 = cloneDefaultLayout();
  if (!v2 || typeof v2 !== "object") return v3;
  const v4 = { outsidePrimary: [], outsideSecondary: [], more: [] },
    v5 = new Set();
  for (const v6 of ZONE_KEYS) {
    const v7 = Array["isArray"](v2[v6]) ? v2[v6] : [];
    for (const v8 of v7) {
      const v9 = normalizeAction(v8);
      if (!v9 || v5["has"](v9)) continue;
      (v5["add"](v9), v4[v6]["push"](v9));
    }
  }
  for (const v10 of VIDEO_TOOLBAR_ACTIONS) {
    if (v5["has"](v10)) continue;
    if (v3["outsidePrimary"]["includes"](v10)) {
      v4["outsidePrimary"]["push"](v10);
      continue;
    }
    if (v3["outsideSecondary"]["includes"](v10)) {
      v4["outsideSecondary"]["push"](v10);
      continue;
    }
    v4["more"]["push"](v10);
  }
  return v4;
}
export function serializeVideoToolbarLayout(v11) {
  const v12 = normalizeVideoToolbarLayout(v11);
  return JSON["stringify"]({
    outsidePrimary: v12["outsidePrimary"],
    outsideSecondary: v12["outsideSecondary"],
    more: v12["more"],
  });
}

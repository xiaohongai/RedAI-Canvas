export const IMAGE_TOOLBAR_ACTIONS = Object["freeze"]([
  "matting",
  "repaint",
  "erase",
  "hd",
  "expand",
  "auto-subject",
  "apimart-face-detect",
  "panorama-360",
  "multigrid",
  "multiangle",
  "annotate",
  "crop",
  "fullscreen",
  "download",
  "reset-size",
]);
const DEFAULT_IMAGE_TOOLBAR_LAYOUT = Object["freeze"]({
    outsidePrimary: Object["freeze"]([
      "matting",
      "expand",
      "apimart-face-detect",
      "panorama-360",
      "multigrid",
      "multiangle",
    ]),
    outsideSecondary: Object["freeze"]([
      "annotate",
      "crop",
      "fullscreen",
      "download",
      "reset-size",
    ]),
    more: Object["freeze"](["repaint", "erase", "hd", "auto-subject"]),
  }),
  ZONE_KEYS = Object["freeze"](["outsidePrimary", "outsideSecondary", "more"]);
function cloneDefaultLayout() {
  return {
    outsidePrimary: [...DEFAULT_IMAGE_TOOLBAR_LAYOUT["outsidePrimary"]],
    outsideSecondary: [...DEFAULT_IMAGE_TOOLBAR_LAYOUT["outsideSecondary"]],
    more: [...DEFAULT_IMAGE_TOOLBAR_LAYOUT["more"]],
  };
}
function normalizeAction(v0) {
  const v1 = String(v0 || "")["trim"]();
  return IMAGE_TOOLBAR_ACTIONS["includes"](v1) ? v1 : "";
}
export function getDefaultImageToolbarLayout() {
  return cloneDefaultLayout();
}
export function normalizeImageToolbarLayout(v2) {
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
  for (const v10 of IMAGE_TOOLBAR_ACTIONS) {
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
export function serializeImageToolbarLayout(v11) {
  const v12 = normalizeImageToolbarLayout(v11);
  return JSON["stringify"]({
    outsidePrimary: v12["outsidePrimary"],
    outsideSecondary: v12["outsideSecondary"],
    more: v12["more"],
  });
}

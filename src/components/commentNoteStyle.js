export const COMMENT_NOTE_TEXT_COLOR_MAP = {
  white: "var(--canvas-white)",
  red: "var(--red)",
  orange: "var(--gold)",
  yellow: "var(--warning-text)",
  green: "var(--green)",
  blue: "var(--blue)",
  purple: "var(--purple)",
  cyan: "var(--cyan)",
  pink: "var(--group-pink)",
  gray: "var(--group-slate)",
};
export const COMMENT_NOTE_BACKGROUND_COLOR_MAP = {
  transparent: "transparent",
  white: "var(--white-10)",
  red: "var(--red-15)",
  orange: "var(--gold-15)",
  yellow: "var(--warning-bg)",
  green: "var(--green-15)",
  blue: "var(--blue-15)",
  purple: "var(--purple-20)",
  cyan: "var(--cyan-15)",
  pink: "var(--group-pink-05)",
  gray: "var(--group-slate-05)",
};
export const COMMENT_NOTE_STROKE_COLOR_MAP = {
  "canvas-white": "var(--canvas-white)",
  blue: "var(--blue)",
  green: "var(--green)",
  red: "var(--red)",
  indigo: "var(--indigo-text)",
  black: "var(--black-90)",
};
export function createDefaultCommentNoteStyle() {
  return {
    fontSize: 24,
    textColor: "white",
    backgroundColor: "transparent",
    strokeColor: "canvas-white",
    strokeWidth: 0,
    writingMode: "horizontal",
  };
}
export function normalizeCommentNoteStyle(v0 = {}) {
  const v1 = {
      ...createDefaultCommentNoteStyle(),
      ...(v0 && typeof v0 === "object" ? v0 : {}),
    },
    v2 = Number(v1["fontSize"]);
  v1["fontSize"] = Number["isFinite"](v2)
    ? Math["min"](56, Math["max"](14, v2))
    : 24;
  const v3 = Number(v1["strokeWidth"]);
  return (
    (v1["strokeWidth"] = Number["isFinite"](v3)
      ? Math["min"](6, Math["max"](0, v3))
      : 0),
    (v1["writingMode"] = "horizontal"),
    !COMMENT_NOTE_TEXT_COLOR_MAP[v1["textColor"]] &&
      (v1["textColor"] = "white"),
    !COMMENT_NOTE_BACKGROUND_COLOR_MAP[v1["backgroundColor"]] &&
      (v1["backgroundColor"] = "transparent"),
    !COMMENT_NOTE_STROKE_COLOR_MAP[v1["strokeColor"]] &&
      (v1["strokeColor"] = "canvas-white"),
    v1
  );
}

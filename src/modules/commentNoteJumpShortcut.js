const MODIFIER_ORDER = Object["freeze"](["Ctrl", "Shift", "Alt"]),
  MODIFIER_ALIAS_MAP = Object["freeze"]({
    CTRL: "Ctrl",
    CONTROL: "Ctrl",
    CMD: "Ctrl",
    COMMAND: "Ctrl",
    META: "Ctrl",
    SHIFT: "Shift",
    ALT: "Alt",
    OPTION: "Alt",
  }),
  NAMED_KEY_MAP = Object["freeze"]({
    DELETE: "Delete",
    BACKSPACE: "Backspace",
    ESC: "Escape",
    ESCAPE: "Escape",
    TAB: "Tab",
    SPACE: "Space",
    ENTER: "Enter",
  }),
  DEFAULT_JUMP_ZOOM_PERCENT = 50;
export function getDefaultJumpZoomPercent() {
  return DEFAULT_JUMP_ZOOM_PERCENT;
}
function _normalizeKeyPart(v0) {
  const v1 = String(v0 ?? "")["trim"]();
  if (!v1) return "";
  if (v1 === "\x20") return "Space";
  const v2 = v1["toUpperCase"]();
  if (MODIFIER_ALIAS_MAP[v2]) return MODIFIER_ALIAS_MAP[v2];
  if (NAMED_KEY_MAP[v2]) return NAMED_KEY_MAP[v2];
  if (v1["length"] === 1) return v1["toUpperCase"]();
  return v1[0]["toUpperCase"]() + v1["slice"](1)["toLowerCase"]();
}
export function normalizeJumpShortcutKeys(v3) {
  const v4 = Array["isArray"](v3) ? v3 : [],
    v5 = new Set(),
    v6 = [];
  v4["forEach"]((v7) => {
    const v8 = _normalizeKeyPart(v7);
    if (!v8) return;
    if (MODIFIER_ORDER["includes"](v8)) {
      v5["add"](v8);
      return;
    }
    !v6["includes"](v8) && v6["push"](v8);
  });
  const v9 = v6[0];
  if (!v9) return [];
  const v10 = MODIFIER_ORDER["filter"]((v11) => v5["has"](v11));
  return [...v10, v9];
}
export function buildJumpShortcutBinding(v12) {
  const v13 = normalizeJumpShortcutKeys(v12);
  if (!v13["length"]) return "";
  return v13["join"]("+")["toUpperCase"]();
}
export function formatJumpShortcutLabel(v14, v15 = "未设置") {
  const v16 = normalizeJumpShortcutKeys(v14);
  if (!v16["length"]) return v15;
  return v16["join"]("+");
}
export function normalizeJumpShortcutZoomPercent(
  v17,
  v18 = DEFAULT_JUMP_ZOOM_PERCENT,
) {
  if (v17 === null || v17 === undefined || v17 === "")
    return normalizeJumpShortcutZoomPercent(v18, DEFAULT_JUMP_ZOOM_PERCENT);
  const v19 = Number(v17);
  if (!Number["isFinite"](v19))
    return normalizeJumpShortcutZoomPercent(v18, DEFAULT_JUMP_ZOOM_PERCENT);
  return Math["max"](0, Math["min"](100, Math["round"](v19)));
}
export function normalizeCommentNoteJumpShortcut(v20) {
  const v21 = v20 && typeof v20 === "object" ? v20 : {};
  return {
    keys: normalizeJumpShortcutKeys(v21["keys"]),
    zoomPercent: normalizeJumpShortcutZoomPercent(v21["zoomPercent"]),
  };
}
export function parseJumpShortcutFromKeydown(v22) {
  const v23 = [];
  if (v22?.["ctrlKey"] || v22?.["metaKey"]) v23["push"]("Ctrl");
  if (v22?.["shiftKey"]) v23["push"]("Shift");
  if (v22?.["altKey"]) v23["push"]("Alt");
  const v24 = v22?.["key"] === "\x20" ? "Space" : v22?.["key"];
  return (v23["push"](v24), normalizeJumpShortcutKeys(v23));
}
export function jumpZoomPercentToViewportZoom(v25) {
  const v26 = normalizeJumpShortcutZoomPercent(v25);
  return Math["max"](0.2, Math["min"](0.2 + (v26 / 100) * 1.8, 2));
}
export function viewportZoomToJumpZoomPercent(v27) {
  const v28 = Number(v27);
  if (!Number["isFinite"](v28)) return DEFAULT_JUMP_ZOOM_PERCENT;
  const v29 = Math["max"](0.2, Math["min"](v28, 2)),
    v30 = ((v29 - 0.2) / 1.8) * 100;
  return normalizeJumpShortcutZoomPercent(v30);
}
export function resolveJumpZoom(v31) {
  return jumpZoomPercentToViewportZoom(v31);
}

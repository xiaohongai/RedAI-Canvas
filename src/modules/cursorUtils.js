export function createLinkCursor(v0 = {}) {
  const v1 = v0 && typeof v0 === "object" ? v0 : {},
    v2 = { small: 24, medium: 36, large: 48 },
    v3 = { small: 4, medium: 6, large: 8 },
    v4 = Object["prototype"]["hasOwnProperty"]["call"](v2, v1["size"])
      ? v1["size"]
      : "small",
    v5 = v1["strokeColor"] || "white",
    v6 = v1["fillColor"] || "white",
    v7 = v1["fillOpacity"] ?? "0.18",
    v8 = v1["fallback"] || "crosshair",
    v9 = v2[v4],
    v10 = v3[v4],
    v11 =
      "<svg\x20xmlns=\x22http://www.w3.org/2000/svg\x22\x20width=\x22" +
      v9 +
      "\x22\x20height=\x22" +
      v9 +
      '" viewBox="0 0 24 24" fill="none" stroke="' +
      v5 +
      '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" fill="' +
      v6 +
      '" fill-opacity="' +
      v7 +
      "\x22/><circle\x20cx=\x2220\x22\x20cy=\x2220\x22\x20r=\x222.5\x22\x20fill=\x22" +
      v5 +
      "\x22/><path\x20d=\x22M12\x2012\x20Q\x2017\x2012\x2019\x2018\x22\x20stroke-dasharray=\x223\x203\x22/></svg>";
  return (
    "url(\x22data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(v11) +
    '") ' +
    v10 +
    "\x20" +
    v10 +
    ",\x20" +
    v8
  );
}
export function getCursorSize() {
  return (
    localStorage["getItem"]("v2-cursor-style") ||
    localStorage["getItem"]("cursorSize") ||
    "small"
  );
}
export function applyLinkCursor(v12, v13 = {}) {
  const v14 = createLinkCursor(v13);
  v12["style"]["setProperty"]("cursor", v14, "important");
}
export function removeLinkCursor(v15) {
  v15["style"]["removeProperty"]("cursor");
}

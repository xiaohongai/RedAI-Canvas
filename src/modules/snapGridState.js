const SNAP_GRID_STORAGE_KEY = "v2-snap-grid",
  SNAP_GRID_CHANGED_EVENT = "v2-snap-grid-changed";
function getRoot() {
  return typeof window !== "undefined" ? window : globalThis;
}
function readStoredSnapGridEnabled() {
  const v0 = getRoot();
  try {
    const v1 = v0?.["localStorage"]?.["getItem"](SNAP_GRID_STORAGE_KEY);
    if (v1 == null) return false;
    return v1 === "true";
  } catch {
    return false;
  }
}
function syncSnapGridButtons(v2) {
  if (typeof document === "undefined") return;
  const v3 = v2 === true,
    v4 = document["getElementById"]("btnToggleDots");
  v4 && v4["classList"]["toggle"]("active", v3);
  const v5 = document["getElementById"]("btnSnapGridOn"),
    v6 = document["getElementById"]("btnSnapGridOff");
  if (v5) v5["classList"]["toggle"]("active", v3);
  if (v6) v6["classList"]["toggle"]("active", !v3);
}
export function readSnapGridEnabled() {
  const v7 = getRoot();
  if (typeof v7?.["v2SnapToGrid"] === "boolean") return v7["v2SnapToGrid"];
  return readStoredSnapGridEnabled();
}
export function writeSnapGridEnabled(v8, { emitEvent: emitEvent = true } = {}) {
  const v9 = getRoot(),
    v10 = v8 === true;
  v9["v2SnapToGrid"] = v10;
  try {
    v9?.["localStorage"]?.["setItem"](
      SNAP_GRID_STORAGE_KEY,
      v10 ? "true" : "false",
    );
  } catch {}
  return (
    emitEvent &&
      typeof v9?.["dispatchEvent"] === "function" &&
      typeof CustomEvent === "function" &&
      v9["dispatchEvent"](
        new CustomEvent(SNAP_GRID_CHANGED_EVENT, { detail: { enabled: v10 } }),
      ),
    v10
  );
}
export function applySnapGridEnabled(
  v11,
  { syncButtons: syncButtons = true, emitEvent: emitEvent = true } = {},
) {
  const v12 = writeSnapGridEnabled(v11, { emitEvent: emitEvent });
  if (syncButtons) syncSnapGridButtons(v12);
  return v12;
}
export function subscribeSnapGridChanges(v13) {
  if (typeof window === "undefined" || typeof v13 !== "function")
    return () => {};
  const v14 = (v15) => v13(v15?.["detail"]?.["enabled"] === true, v15);
  return (
    window["addEventListener"](SNAP_GRID_CHANGED_EVENT, v14),
    () => window["removeEventListener"](SNAP_GRID_CHANGED_EVENT, v14)
  );
}

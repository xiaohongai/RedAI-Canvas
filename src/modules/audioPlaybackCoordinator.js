const clients = new Map();
function normalizeClientId(v0) {
  return String(v0 || "")["trim"]();
}
export function registerAudioPlaybackClient(v1, v2 = {}) {
  const v3 = normalizeClientId(v1);
  if (!v3) return () => {};
  return (
    clients["set"](v3, v2),
    () => {
      if (clients["get"](v3) === v2) clients["delete"](v3);
    }
  );
}
export function beginAudioPlayback(v4) {
  const v5 = normalizeClientId(v4);
  if (!v5) return;
  for (const [v6, v7] of clients["entries"]()) {
    if (v6 === v5) continue;
    try {
      v7?.["stopForExternalPlayback"]?.();
    } catch {}
  }
}
export function __resetAudioPlaybackCoordinatorForTest() {
  clients["clear"]();
}

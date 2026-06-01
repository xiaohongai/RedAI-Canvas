let installed = false;
function isDesktopRenderer() {
  return !!globalThis["window"]?.["electronAPI"];
}
function dispatchRendererWake(v0 = "wake") {
  try {
    window["dispatchEvent"](
      new CustomEvent("aicanvas:desktop-media-wake", {
        detail: { reason: v0 },
      }),
    );
  } catch {}
}
export function initDesktopMediaWakeService() {
  if (installed || !isDesktopRenderer()) return;
  ((installed = true),
    document["addEventListener"]("visibilitychange", () => {
      if (document["visibilityState"] === "visible")
        dispatchRendererWake("visibilitychange");
    }),
    window["addEventListener"]("focus", () => dispatchRendererWake("focus")),
    window["addEventListener"]("pageshow", () =>
      dispatchRendererWake("pageshow"),
    ));
}
export const __desktopMediaWakeServiceForTest = {
  dispatchRendererWake: dispatchRendererWake,
};

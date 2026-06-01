export function registerAppGlobalEvents({
  onBeforeUnload: v0,
  onPageHide: v1,
  onVisibilityChange: v2,
  onDocumentDragEnter: v3,
  onDocumentDragOver: v4,
  onDocumentDrop: v5,
  onBoot: v6,
}) {
  (typeof v0 === "function" && window["addEventListener"]("beforeunload", v0),
    typeof v1 === "function" && window["addEventListener"]("pagehide", v1),
    typeof v2 === "function" &&
      document["addEventListener"]("visibilitychange", v2),
    typeof v3 === "function" && document["addEventListener"]("dragenter", v3),
    typeof v4 === "function" && document["addEventListener"]("dragover", v4),
    typeof v5 === "function" && document["addEventListener"]("drop", v5),
    typeof v6 === "function" &&
      (document["readyState"] === "loading"
        ? document["addEventListener"]("DOMContentLoaded", v6, { once: true })
        : v6()));
}

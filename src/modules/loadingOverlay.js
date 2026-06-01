const pendingLoadings = new WeakMap();
function normalizeVariant(v0 = {}) {
  return v0 && v0["variant"] === "static" ? "static" : "full";
}
function applyLoadingVariant(v1, v2) {
  (v1["classList"]["add"]("img-preview-loading"),
    v2 === "static"
      ? v1["classList"]["add"]("img-preview-loading--static")
      : v1["classList"]["remove"]("img-preview-loading--static"));
}
export function startLoading(v3, v4 = {}) {
  if (!v3) return;
  const v5 = normalizeVariant(v4),
    v6 = pendingLoadings["get"](v3);
  if (v6) {
    v6["variant"] = v5;
    return;
  }
  if (
    v3["classList"]?.["contains"]?.("img-preview-loading") ||
    v3["querySelector"]?.(".img-loading-overlay")
  ) {
    applyLoadingVariant(v3, v5);
    return;
  }
  const v7 = { variant: v5 };
  (pendingLoadings["set"](v3, v7),
    setTimeout(() => {
      if (pendingLoadings["get"](v3) !== v7) return;
      if (v3["querySelector"](".img-loading-overlay")) return;
      applyLoadingVariant(v3, v7["variant"]);
      const v8 = document["createElement"]("div");
      v8["className"] = "img-loading-overlay";
      if (v7["variant"] !== "static") {
        const v9 = document["createElement"]("div");
        ((v9["className"] = "img-loading-shimmer"), v8["appendChild"](v9));
      }
      v3["appendChild"](v8);
    }, 50));
}
export function stopLoading(v10) {
  if (!v10) return;
  (pendingLoadings["delete"](v10),
    v10["classList"]["remove"]("img-preview-loading"),
    v10["classList"]["remove"]("img-preview-loading--static"),
    v10["querySelectorAll"](".img-loading-overlay")["forEach"]((v11) =>
      v11["remove"](),
    ));
}

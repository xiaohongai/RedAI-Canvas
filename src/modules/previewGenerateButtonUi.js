export const GENERATE_ICON_HTML =
  "<svg\x20width=\x2214\x22\x20height=\x2214\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><line\x20x1=\x2212\x22\x20y1=\x2219\x22\x20x2=\x2212\x22\x20y2=\x225\x22/><polyline\x20points=\x225\x2012\x2012\x205\x2019\x2012\x22/></svg>";
export const GENERATE_LOADING_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
export const GENERATE_CANCEL_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g class="v2-task-cancel-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';
function normalizeTitle(v0) {
  return String(v0 || "生成")["trim"]() || "生成";
}
function applyTooltip(v1, v2) {
  if (!v1?.["dataset"]) return;
  const v3 = String(v2 || "")["trim"]();
  if (v3) v1["dataset"]["tooltip"] = v3;
  else delete v1["dataset"]["tooltip"];
}
export function setGenerateButtonLoadingUi(
  v4,
  {
    title: title = "生成",
    tooltip: tooltip = "",
    disabled: disabled = true,
    ariaLabel: ariaLabel = "",
  } = {},
) {
  if (!v4) return;
  v4["disabled"] = disabled === true;
  if (v4["style"]) v4["style"]["color"] = "";
  (v4["classList"]?.["remove"]?.("is-rh-busy", "is-task-cancel"),
    applyTooltip(v4, tooltip));
  const v5 = normalizeTitle(ariaLabel || title);
  (v4["setAttribute"]?.("aria-label", v5),
    (v4["title"] = normalizeTitle(title)),
    (v4["innerHTML"] = GENERATE_LOADING_ICON_HTML));
}
export function setGenerateButtonCancellableUi(
  v6,
  {
    title: title = "点击取消任务",
    tooltip: tooltip = "点击取消任务",
    ariaLabel: ariaLabel = "取消生成",
    color: color = "var(--white)",
    busy: busy = false,
  } = {},
) {
  if (!v6) return;
  v6["disabled"] = false;
  if (v6["style"]) v6["style"]["color"] = color;
  (v6["classList"]?.["toggle"]?.("is-rh-busy", busy === true),
    v6["classList"]?.["add"]?.("is-task-cancel"),
    applyTooltip(v6, tooltip),
    v6["setAttribute"]?.("aria-label", String(ariaLabel || "取消生成")),
    (v6["title"] = String(title || "点击取消任务")),
    (v6["innerHTML"] = GENERATE_CANCEL_ICON_HTML));
}
export function resetGenerateButtonIdleUi(v7, v8 = "生成") {
  if (!v7) return;
  v7["disabled"] = false;
  if (v7["style"]) v7["style"]["color"] = "";
  (v7["classList"]?.["remove"]?.("is-rh-busy", "is-task-cancel"),
    applyTooltip(v7, ""),
    v7["setAttribute"]?.("aria-label", normalizeTitle(v8)),
    (v7["title"] = normalizeTitle(v8)),
    (v7["innerHTML"] = GENERATE_ICON_HTML));
}
export function setPreviewGenerateButtonLoading(v9) {
  setGenerateButtonLoadingUi(v9);
}
export function resetPreviewGenerateButton(v10, v11 = "生成") {
  resetGenerateButtonIdleUi(v10, v11);
}
export function createPreviewGenerateButtonCallbacks(v12, v13 = "生成") {
  return {
    onStart() {
      setPreviewGenerateButtonLoading(v12?.["btnEl"]);
    },
    onStop() {
      (resetPreviewGenerateButton(v12?.["btnEl"], v13),
        v12?.["_updateSubmitButtonState"]?.());
    },
  };
}

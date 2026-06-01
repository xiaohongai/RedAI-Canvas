const DEFAULT_DURATION = 2900,
  ALERT_DURATION = 5000,
  ICONS = { ok: "", warn: "⚠️", error: "✕", success: "✓" };
export function showToast(v0, v1 = "ok", v2) {
  const v3 = document["getElementById"]("v2-toast-wrap");
  if (!v3) {
    console["warn"]("[Toast]", v0);
    return;
  }
  const v4 = v1 === "warning" ? "warn" : v1,
    v5 = v4 === "error" || v4 === "warn",
    v6 = v5 ? ALERT_DURATION : DEFAULT_DURATION,
    v7 = Number["isFinite"](Number(v2)) ? Math["max"](0, Number(v2)) : v6,
    v8 = v5 ? Math["max"](ALERT_DURATION, v7) : v7,
    v9 = ICONS[v4] ?? "",
    v10 = document["createElement"]("div");
  v10["className"] = "v2-toast" + (v4 !== "ok" ? "\x20" + v4 : "");
  v8 > DEFAULT_DURATION && !v5 && v10["classList"]["add"]("is-long");
  if (v9) {
    const v11 = document["createElement"]("span");
    ((v11["className"] = "v2-toast-icon"),
      (v11["textContent"] = v9),
      v10["appendChild"](v11));
  }
  const v12 = document["createElement"]("span");
  ((v12["textContent"] = v0),
    v10["appendChild"](v12),
    v3["appendChild"](v10),
    setTimeout(() => {
      v10["remove"]();
    }, v8));
}
export function showSuccess(v13, v14) {
  showToast(v13, "success", v14);
}
export function showError(v15, v16) {
  showToast(v15, "error", v16);
}
export function showWarning(v17, v18) {
  showToast(v17, "warn", v18);
}
export function initToastService() {
  ((window["showToast"] = showToast),
    (window["showSuccess"] = showSuccess),
    (window["showError"] = showError),
    (window["showWarning"] = showWarning));
}

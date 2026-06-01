export function showDevToast(v0, v1 = "") {
  document["querySelectorAll"](".v2-dev-toast")["forEach"]((v2) =>
    v2["remove"](),
  );
  const v3 = document["createElement"]("div");
  v3["className"] = "v2-dev-toast";
  if (v1) {
    const v4 = document["createElement"]("div");
    ((v4["className"] = "v2-dev-toast-icon"),
      (v4["textContent"] = v1),
      v3["appendChild"](v4));
  }
  const v5 = document["createElement"]("span");
  ((v5["className"] = "v2-dev-toast-text"),
    (v5["textContent"] = v0 + "\x20（开发中）"),
    v3["appendChild"](v5),
    document["body"]["appendChild"](v3),
    v3["offsetHeight"],
    v3["classList"]["add"]("is-visible"),
    setTimeout(() => {
      (v3["classList"]["remove"]("is-visible"),
        setTimeout(() => v3["remove"](), 300));
    }, 2000));
}

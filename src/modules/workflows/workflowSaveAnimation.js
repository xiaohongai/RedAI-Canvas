function getRect(v0) {
  const v1 = v0?.["getBoundingClientRect"]?.();
  if (!v1) return null;
  const v2 = Number(v1["left"] ?? 0),
    v3 = Number(v1["top"] ?? 0),
    v4 = Number(v1["width"]),
    v5 = Number(v1["height"]),
    v6 = Number(v1["right"]),
    v7 = Number(v1["bottom"]),
    v8 =
      Number["isFinite"](v4) && v4 > 0
        ? v4
        : Number["isFinite"](v6)
          ? v6 - v2
          : 0,
    v9 =
      Number["isFinite"](v5) && v5 > 0
        ? v5
        : Number["isFinite"](v7)
          ? v7 - v3
          : 0;
  if (
    !Number["isFinite"](v2) ||
    !Number["isFinite"](v3) ||
    !Number["isFinite"](v8) ||
    !Number["isFinite"](v9) ||
    v8 <= 0 ||
    v9 <= 0
  )
    return null;
  return {
    left: v2,
    top: v3,
    width: v8,
    height: v9,
    right: v2 + v8,
    bottom: v3 + v9,
  };
}
function stripDuplicateIds(v10) {
  if (!v10) return;
  (v10["id"] &&
    typeof v10["removeAttribute"] === "function" &&
    v10["removeAttribute"]("id"),
    v10["querySelectorAll"]?.("[id]")?.["forEach"]((v11) => {
      v11["removeAttribute"]?.("id");
    }));
}
export function playWorkflowSaveFly({
  sourceEl: v12,
  targetEl: targetEl = null,
  documentRef: documentRef = globalThis["document"],
  windowRef: windowRef = globalThis["window"],
} = {}) {
  const v13 = documentRef || v12?.["ownerDocument"] || globalThis["document"],
    v14 = windowRef || globalThis["window"];
  if (!v13?.["body"] || !v12 || !v14) return null;
  const v15 = v14["matchMedia"]?.("(prefers-reduced-motion: reduce)")?.[
    "matches"
  ];
  if (v15) return null;
  const v16 = getRect(v12),
    v17 = targetEl || v13["getElementById"]?.("btnWorkflows"),
    v18 = getRect(v17);
  if (!v16 || !v18) return null;
  const v19 = v13["createElement"]("div");
  ((v19["className"] = "v2-workflow-save-fly"),
    (v19["style"]["left"] = v16["left"] + "px"),
    (v19["style"]["top"] = v16["top"] + "px"),
    (v19["style"]["width"] = v16["width"] + "px"),
    (v19["style"]["height"] = v16["height"] + "px"));
  const v20 = v12["cloneNode"]?.(true);
  v20 && (stripDuplicateIds(v20), v19["appendChild"](v20));
  v13["body"]["appendChild"](v19);
  const v21 = v16["left"] + v16["width"] / 2,
    v22 = v16["top"] + v16["height"] / 2,
    v23 = v18["left"] + v18["width"] / 2,
    v24 = v18["top"] + v18["height"] / 2,
    v25 = v23 - v21,
    v26 = v24 - v22,
    v27 = (() => {
      let v28 = false;
      return () => {
        if (v28) return;
        ((v28 = true),
          v19["remove"]?.(),
          v17?.["animate"]?.(
            [
              { transform: "scale(1)", filter: "brightness(1)" },
              { transform: "scale(1.08)", filter: "brightness(1.2)" },
              { transform: "scale(1)", filter: "brightness(1)" },
            ],
            { duration: 260, easing: "cubic-bezier(0.2,\x200,\x200,\x201)" },
          ));
      };
    })();
  if (typeof v19["animate"] === "function") {
    const v29 = v19["animate"](
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        {
          transform: "translate(" + v25 + "px," + v26 + "px) scale(0.12)",
          opacity: 0.2,
        },
      ],
      { duration: 520, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    );
    return (
      (v29["onfinish"] = v27),
      (v29["oncancel"] = v27),
      { fly: v19, animation: v29 }
    );
  }
  return (v14["setTimeout"]?.(v27, 520), { fly: v19, animation: null });
}

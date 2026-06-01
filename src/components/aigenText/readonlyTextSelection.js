function getCaretRangeFromPoint(v0, v1, v2) {
  if (typeof v0?.["caretRangeFromPoint"] === "function")
    return v0["caretRangeFromPoint"](v1, v2);
  const v3 = v0?.["caretPositionFromPoint"]?.(v1, v2);
  if (!v3 || typeof v0?.["createRange"] !== "function") return null;
  const v4 = v0["createRange"]();
  return (v4["setStart"](v3["offsetNode"], v3["offset"]), v4);
}
function setSelection(v5, v6, v7) {
  const v8 = v5?.["getSelection"]?.();
  if (!v8 || !v6 || !v7) return;
  v8["removeAllRanges"]();
  if (typeof v8["setBaseAndExtent"] === "function") {
    v8["setBaseAndExtent"](
      v6["startContainer"],
      v6["startOffset"],
      v7["startContainer"],
      v7["startOffset"],
    );
    return;
  }
  const v9 = v6["startContainer"]["ownerDocument"]["createRange"]();
  (v9["setStart"](v6["startContainer"], v6["startOffset"]),
    v9["setEnd"](v7["startContainer"], v7["startOffset"]),
    v8["addRange"](v9));
}
function findActiveReadonlyTextRoot(v10) {
  if (!v10) return null;
  const v11 = v10["nodeType"] === 1 ? v10 : v10["parentElement"];
  if (!v11) return null;
  if (typeof v11["closest"] === "function")
    return v11["closest"](".aigen-text-output.is-text-selection-active");
  let v12 = v11;
  while (v12) {
    if (
      v12["classList"]?.["contains"]?.("aigen-text-output") &&
      v12["classList"]?.["contains"]?.("is-text-selection-active")
    )
      return v12;
    v12 = v12["parentElement"];
  }
  return null;
}
function rangeTouchesActiveReadonlyText(v13, v14) {
  if (!v13) return false;
  if (
    findActiveReadonlyTextRoot(v13["commonAncestorContainer"]) ||
    findActiveReadonlyTextRoot(v13["startContainer"]) ||
    findActiveReadonlyTextRoot(v13["endContainer"])
  )
    return true;
  const v15 = Array["from"](
    v14?.["querySelectorAll"]?.(
      ".aigen-text-output.is-text-selection-active",
    ) || [],
  );
  return v15["some"]((v16) => {
    try {
      if (typeof v13["intersectsNode"] === "function")
        return v13["intersectsNode"](v16);
    } catch (v17) {
      return false;
    }
    return (
      v16["contains"]?.(v13["startContainer"]) ||
      v16["contains"]?.(v13["endContainer"])
    );
  });
}
export function hasActiveReadonlyTextSelection(v18 = document) {
  const v19 = v18?.["getSelection"]?.();
  if (
    !v19 ||
    v19["isCollapsed"] ||
    !String(v19["toString"]?.() || "")["trim"]()
  )
    return false;
  const v20 = Number(v19["rangeCount"]) || 0;
  for (let v21 = 0; v21 < v20; v21 += 1) {
    if (rangeTouchesActiveReadonlyText(v19["getRangeAt"](v21), v18))
      return true;
  }
  return false;
}
export function bindReadonlyTextSelection(v22, v23 = {}) {
  if (!v22?.["addEventListener"]) return () => {};
  const v24 = v22["ownerDocument"] || document,
    v25 = v24["defaultView"] || window;
  let v26 = false;
  const v27 = () => {
      if (v26) return;
      ((v26 = true),
        v22["classList"]?.["add"]("is-text-selection-active"),
        v23["onActivate"]?.());
    },
    v28 = () => {
      if (!v26) return;
      ((v26 = false),
        v23["onDeactivate"]?.(),
        v22["classList"]?.["remove"]("is-text-selection-active"),
        v24["body"]?.["classList"]["remove"]("is-aigen-text-selecting"));
    },
    v29 = (v30) => {
      if (v30["button"] !== 0) return;
      if (!v26) return;
      (v30["preventDefault"](),
        v30["stopPropagation"](),
        v24["body"]?.["classList"]["add"]("is-aigen-text-selecting"));
      const v31 = getCaretRangeFromPoint(v24, v30["clientX"], v30["clientY"]),
        v32 = (v33) => {
          const v34 = getCaretRangeFromPoint(
            v24,
            v33["clientX"],
            v33["clientY"],
          );
          (v31 &&
            v34 &&
            v22["contains"](v31["startContainer"]) &&
            v22["contains"](v34["startContainer"]) &&
            setSelection(v25, v31, v34),
            v33["preventDefault"](),
            v33["stopPropagation"]());
        },
        v35 = (v36) => {
          (v32(v36),
            v24["body"]?.["classList"]["remove"]("is-aigen-text-selecting"),
            v24["removeEventListener"]("pointermove", v32, true),
            v24["removeEventListener"]("pointerup", v35, true),
            v24["removeEventListener"]("pointercancel", v35, true));
        };
      (v24["addEventListener"]("pointermove", v32, true),
        v24["addEventListener"]("pointerup", v35, true),
        v24["addEventListener"]("pointercancel", v35, true));
    },
    v37 = (v38) => {
      (v38["preventDefault"](), v38["stopPropagation"](), v27());
    },
    v39 = (v40) => {
      if (!v26 || v22["contains"](v40["target"])) return;
      v28();
    },
    v41 = (v42) => {
      if (v42["key"] === "Escape") v28();
    };
  return (
    v22["addEventListener"]("pointerdown", v29, true),
    v22["addEventListener"]("dblclick", v37),
    v24["addEventListener"]("pointerdown", v39, true),
    v24["addEventListener"]("keydown", v41, true),
    () => {
      (v28(),
        v22["removeEventListener"]("pointerdown", v29, true),
        v22["removeEventListener"]("dblclick", v37),
        v24["removeEventListener"]("pointerdown", v39, true),
        v24["removeEventListener"]("keydown", v41, true));
    }
  );
}

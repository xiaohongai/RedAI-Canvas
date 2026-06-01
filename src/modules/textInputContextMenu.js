const MENU_SELECTOR = ".v2-text-input-context-menu",
  TEXT_INPUT_TYPES = new Set([
    "",
    "text",
    "search",
    "url",
    "tel",
    "email",
    "password",
    "number",
  ]);
function getWindow() {
  return globalThis["window"] || null;
}
function getDocument() {
  return globalThis["document"] || null;
}
function isInputElement(v0) {
  return String(v0?.["tagName"] || "")["toUpperCase"]() === "INPUT";
}
function isTextAreaElement(v1) {
  return String(v1?.["tagName"] || "")["toUpperCase"]() === "TEXTAREA";
}
function isContentEditableElement(v2) {
  return (
    v2?.["isContentEditable"] === true ||
    String(v2?.["getAttribute"]?.("contenteditable") || "")["toLowerCase"]() ===
      "true" ||
    String(v2?.["contentEditable"] || "")["toLowerCase"]() === "true"
  );
}
function isWritableTextInput(v3) {
  if (!isInputElement(v3)) return false;
  const v4 = String(v3["type"] || "")["toLowerCase"]();
  return TEXT_INPUT_TYPES["has"](v4) && !v3["disabled"] && !v3["readOnly"];
}
function isWritableTextArea(v5) {
  return isTextAreaElement(v5) && !v5["disabled"] && !v5["readOnly"];
}
export function getEditableTextTarget(v6) {
  if (!v6) return null;
  const v7 = v6["closest"]?.("input, textarea, [contenteditable='true']") || v6;
  if (
    isWritableTextInput(v7) ||
    isWritableTextArea(v7) ||
    isContentEditableElement(v7)
  )
    return v7;
  return null;
}
export function isEditableTextTargetInGroupedNode(v8, v9 = {}) {
  const v10 = getEditableTextTarget(v8);
  if (!v10) return false;
  const v11 = v10["closest"]?.(".v2-node"),
    v12 = String(v11?.["dataset"]?.["nodeId"] || v11?.["id"] || "")["trim"]();
  if (!v12) return false;
  const v13 = v9?.[v12],
    v14 = String(v13?.["parentId"] || "")["trim"]();
  if (!v14) return false;
  return v9?.[v14]?.["type"] === "group";
}
function closeTextInputContextMenu() {
  getDocument()
    ?.["querySelectorAll"]?.(MENU_SELECTOR)
    ?.["forEach"]((v15) => v15["remove"]());
}
function dispatchInputEvent(v16) {
  const v17 = v16?.["ownerDocument"]?.["defaultView"] || getWindow(),
    v18 = v17?.["InputEvent"] || v17?.["Event"] || globalThis["Event"];
  if (typeof v18 !== "function" || typeof v16?.["dispatchEvent"] !== "function")
    return;
  v16["dispatchEvent"](new v18("input", { bubbles: true }));
}
function clampSelection(v19, v20) {
  const v21 = Number(v19);
  if (!Number["isFinite"](v21)) return v20;
  return Math["max"](0, Math["min"](v20, v21));
}
function setFieldSelection(v22, v23, v24) {
  if (typeof v22?.["setSelectionRange"] !== "function") return;
  try {
    v22["setSelectionRange"](v23, v24);
  } catch {}
}
export function captureEditableSelection(v25) {
  if (isWritableTextInput(v25) || isWritableTextArea(v25)) {
    const v26 = String(v25["value"] || "")["length"];
    return {
      kind: "field",
      start: clampSelection(v25["selectionStart"], v26),
      end: clampSelection(v25["selectionEnd"], v26),
    };
  }
  const v27 = v25?.["ownerDocument"]?.["defaultView"] || getWindow(),
    v28 = v27?.["getSelection"]?.();
  if (!v28 || v28["rangeCount"] === 0) return null;
  const v29 = v28["getRangeAt"](0),
    v30 = v29["commonAncestorContainer"];
  if (!v25["contains"]?.(v30)) return null;
  return { kind: "contenteditable", range: v29["cloneRange"]() };
}
function restoreEditableSelection(v31, v32) {
  if (!v32) return;
  if (v32["kind"] === "field") {
    (v31["focus"]?.({ preventScroll: true }),
      setFieldSelection(v31, v32["start"], v32["end"]));
    return;
  }
  if (v32["kind"] !== "contenteditable" || !v32["range"]) return;
  v31["focus"]?.({ preventScroll: true });
  const v33 = v31?.["ownerDocument"]?.["defaultView"] || getWindow(),
    v34 = v33?.["getSelection"]?.();
  if (!v34) return;
  (v34["removeAllRanges"](), v34["addRange"](v32["range"]));
}
function insertTextIntoField(v35, v36, v37) {
  const v38 = String(v35["value"] || ""),
    v39 = clampSelection(
      v37?.["start"] ?? v35["selectionStart"],
      v38["length"],
    ),
    v40 = clampSelection(v37?.["end"] ?? v35["selectionEnd"], v38["length"]);
  v35["focus"]?.({ preventScroll: true });
  if (typeof v35["setRangeText"] === "function")
    try {
      v35["setRangeText"](v36, v39, v40, "end");
    } catch (v41) {
      v35["value"] = v38["slice"](0, v39) + v36 + v38["slice"](v40);
      const v42 = v39 + v36["length"];
      setFieldSelection(v35, v42, v42);
    }
  else {
    v35["value"] = v38["slice"](0, v39) + v36 + v38["slice"](v40);
    const v43 = v39 + v36["length"];
    setFieldSelection(v35, v43, v43);
  }
  return (dispatchInputEvent(v35), true);
}
function insertTextIntoContentEditable(v44, v45, v46) {
  const v47 = v44?.["ownerDocument"] || getDocument();
  (v44["focus"]?.({ preventScroll: true }), restoreEditableSelection(v44, v46));
  if (typeof v47?.["execCommand"] === "function")
    try {
      if (v47["execCommand"]("insertText", false, v45)) return true;
    } catch {}
  const v48 = v47?.["defaultView"] || getWindow(),
    v49 = v48?.["getSelection"]?.();
  if (v49 && v49["rangeCount"] > 0) {
    const v50 = v49["getRangeAt"](0);
    v50["deleteContents"]();
    const v51 = v47["createTextNode"](String(v45 || ""));
    (v50["insertNode"](v51),
      v50["setStartAfter"](v51),
      v50["collapse"](true),
      v49["removeAllRanges"](),
      v49["addRange"](v50));
  } else
    typeof v44["appendChild"] === "function" && v47?.["createTextNode"]
      ? v44["appendChild"](v47["createTextNode"](String(v45 || "")))
      : (v44["textContent"] = "" + (v44["textContent"] || "") + v45);
  return (dispatchInputEvent(v44), true);
}
export function insertPlainTextIntoEditable(v52, v53, v54 = null) {
  const v55 = getEditableTextTarget(v52);
  if (!v55 || typeof v53 !== "string") return false;
  if (isWritableTextInput(v55) || isWritableTextArea(v55))
    return insertTextIntoField(v55, v53, v54);
  if (isContentEditableElement(v55))
    return insertTextIntoContentEditable(v55, v53, v54);
  return false;
}
async function readClipboardText() {
  const v56 = globalThis["navigator"]?.["clipboard"]?.["readText"];
  if (typeof v56 !== "function") return null;
  return v56["call"](globalThis["navigator"]["clipboard"]);
}
export async function pasteTextIntoEditableFromClipboard(v57, v58) {
  let v59 = null;
  try {
    v59 = await readClipboardText();
  } catch (v60) {
    return (
      getWindow()?.["showToast"]?.("读取剪贴板失败，请检查权限", "error"),
      false
    );
  }
  if (typeof v59 !== "string")
    return (
      getWindow()?.["showToast"]?.("当前环境不支持读取剪贴板文本", "error"),
      false
    );
  if (!v59)
    return (
      getWindow()?.["showToast"]?.("剪贴板没有可粘贴的文本", "warn"),
      false
    );
  return insertPlainTextIntoEditable(v57, v59, v58);
}
function placeMenu(v61, v62, v63) {
  const v64 = getDocument(),
    v65 = getWindow();
  v64?.["body"]?.["appendChild"](v61);
  const v66 = v61["offsetWidth"] || 180,
    v67 = v61["offsetHeight"] || 44,
    v68 = v65 && v62 + v66 > v65["innerWidth"] ? v62 - v66 : v62,
    v69 = v65 && v63 + v67 > v65["innerHeight"] ? v63 - v67 : v63;
  ((v61["style"]["left"] = Math["max"](0, v68) + "px"),
    (v61["style"]["top"] = Math["max"](0, v69) + "px"));
}
export function showTextInputContextMenu({
  target: v70,
  screenX: v71,
  screenY: v72,
  snapshot: v73,
}) {
  const v74 = getDocument();
  if (!v74?.["createElement"]) return;
  const v75 = v73 === undefined ? captureEditableSelection(v70) : v73;
  (closeTextInputContextMenu(),
    v74["querySelectorAll"]?.(".v2-canvas-ctx-menu")?.["forEach"]((v76) =>
      v76["remove"](),
    ));
  const v77 = v74["createElement"]("div");
  v77["className"] = "v2-canvas-ctx-menu v2-text-input-context-menu";
  const v78 = v74["createElement"]("div");
  v78["className"] = "v2-menu-row\x20v2-menu-row-split";
  const v79 = v74["createElement"]("span");
  ((v79["textContent"] = "粘贴文本"), v78["appendChild"](v79));
  const v80 = v74["createElement"]("span");
  ((v80["className"] = "v2-menu-kbd"),
    (v80["textContent"] = "Ctrl V"),
    v78["appendChild"](v80),
    v78["addEventListener"]("pointerdown", async (v81) => {
      (v81["preventDefault"](),
        v81["stopPropagation"](),
        v77["remove"](),
        restoreEditableSelection(v70, v75),
        await pasteTextIntoEditableFromClipboard(v70, v75));
    }),
    v77["appendChild"](v78),
    placeMenu(v77, v71, v72));
  const v82 = (v83) => {
      if (v77["contains"](v83["target"])) return;
      (v77["remove"](),
        v74["removeEventListener"]("pointerdown", v82, true),
        v74["removeEventListener"]("keydown", v84, true));
    },
    v84 = (v85) => {
      if (v85["key"] !== "Escape") return;
      (v77["remove"](),
        v74["removeEventListener"]("pointerdown", v82, true),
        v74["removeEventListener"]("keydown", v84, true));
    };
  getWindow()?.["requestAnimationFrame"]?.(() => {
    (v74["addEventListener"]("pointerdown", v82, true),
      v74["addEventListener"]("keydown", v84, true));
  });
}
export function initTextInputContextMenu(v86 = getDocument()) {
  if (!v86?.["addEventListener"]) return () => {};
  const v87 = (v88) => {
    if (v88["defaultPrevented"]) return;
    const v89 = getEditableTextTarget(v88["target"]);
    if (!v89) return;
    (v88["preventDefault"](), v88["stopPropagation"]());
    const v90 = captureEditableSelection(v89);
    (v89["focus"]?.({ preventScroll: true }),
      showTextInputContextMenu({
        target: v89,
        screenX: v88["clientX"] || 0,
        screenY: v88["clientY"] || 0,
        snapshot: v90,
      }));
  };
  return (
    v86["addEventListener"]("contextmenu", v87),
    () => {
      (v86["removeEventListener"]("contextmenu", v87),
        closeTextInputContextMenu());
    }
  );
}

import { buildSourceMediaNodePayload } from "../../services/fileService.js";
import { buildCanvasLocalImageFields } from "../../services/canvasMediaLocalService.js";
import { generateId, screenToWorld } from "../../core/math.js";
export const RESULT_IMAGE_DRAG_OUT_THRESHOLD_PX = 6;
function asObject(v0) {
  return v0 && typeof v0 === "object" && !Array["isArray"](v0) ? v0 : null;
}
function firstNonEmptyString(...v1) {
  for (const v2 of v1) {
    const v3 = String(v2 || "")["trim"]();
    if (v3) return v3;
  }
  return "";
}
function toPositiveInt(v4) {
  const v5 = Number(v4);
  if (!Number["isFinite"](v5) || v5 <= 0) return 0;
  return Math["max"](1, Math["round"](v5));
}
function pickImageWidth(v6) {
  return (
    toPositiveInt(v6?.["originalWidth"]) ||
    toPositiveInt(v6?.["imageWidth"]) ||
    toPositiveInt(v6?.["width"]) ||
    toPositiveInt(v6?.["metadata"]?.["width"])
  );
}
function pickImageHeight(v7) {
  return (
    toPositiveInt(v7?.["originalHeight"]) ||
    toPositiveInt(v7?.["imageHeight"]) ||
    toPositiveInt(v7?.["height"]) ||
    toPositiveInt(v7?.["metadata"]?.["height"])
  );
}
function pickFallbackSize({
  fallbackWidth: fallbackWidth = 0,
  fallbackHeight: fallbackHeight = 0,
} = {}) {
  const v8 = toPositiveInt(fallbackWidth),
    v9 = toPositiveInt(fallbackHeight);
  return v8 > 0 && v9 > 0 ? { width: v8, height: v9 } : null;
}
function fileNameFromPath(v10) {
  const v11 = String(v10 || "")
    ["replace"](/\\/g, "/")
    ["replace"](/^\/+/, "");
  if (!v11) return "";
  const v12 = v11["split"]("/");
  return String(v12[v12["length"] - 1] || "")["trim"]();
}
export function normalizeResultImageForDragOut(v13) {
  const v14 = asObject(v13);
  if (!v14 || firstNonEmptyString(v14["error"])) return null;
  const v15 = buildCanvasLocalImageFields(v14, { includeSrc: true }),
    v16 = firstNonEmptyString(
      v15["src"],
      v15["imageUrl"],
      v15["sourceUrl"],
      v15["thumbUrl"],
      v15["localPath"],
      v15["originalLocalPath"],
      v15["displayLocalPath"],
      v15["thumbLocalPath"],
    );
  if (!v16) return null;
  const v17 = pickImageWidth(v14),
    v18 = pickImageHeight(v14),
    v19 = firstNonEmptyString(
      v14["fileName"],
      fileNameFromPath(v15["localPath"]),
      fileNameFromPath(v15["originalLocalPath"]),
      fileNameFromPath(v15["displayLocalPath"]),
    );
  return {
    ...v15,
    ...(v17 > 0 ? { imageWidth: v17, originalWidth: v17 } : {}),
    ...(v18 > 0 ? { imageHeight: v18, originalHeight: v18 } : {}),
    ...(v19 ? { fileName: v19 } : {}),
  };
}
export function hasUsableResultImageForDragOut(v20) {
  return !!normalizeResultImageForDragOut(v20);
}
export function buildResultImageDragOutNodePayload({
  image: v21,
  viewport: viewport = { x: 0, y: 0, zoom: 1 },
  screenX: screenX = 0,
  screenY: screenY = 0,
  fallbackWidth: fallbackWidth = 0,
  fallbackHeight: fallbackHeight = 0,
  id: id = "",
  createId: createId = () => generateId("source-image"),
  name: name = "",
} = {}) {
  const v22 = normalizeResultImageForDragOut(v21);
  if (!v22) return null;
  const v23 = String(id || "")["trim"]() || createId(),
    v24 = toPositiveInt(v22["imageWidth"]),
    v25 = toPositiveInt(v22["imageHeight"]),
    v26 = pickFallbackSize({
      fallbackWidth: fallbackWidth,
      fallbackHeight: fallbackHeight,
    }),
    v27 = screenToWorld(screenX, screenY, viewport || { x: 0, y: 0, zoom: 1 }),
    v28 =
      v24 > 0 && v25 > 0
        ? { naturalWidth: v24, naturalHeight: v25, needsAutoResize: false }
        : v26
          ? {
              width: v26["width"],
              height: v26["height"],
              fixedSize: true,
              needsAutoResize: false,
              useExplicitSizeAsSource: true,
            }
          : { needsAutoResize: true },
    v29 = buildSourceMediaNodePayload({
      ...v22,
      ...v28,
      id: v23,
      type: "source-image",
      x: 0,
      y: 0,
      name: firstNonEmptyString(name, v22["fileName"], "图片"),
      src: v22["src"] || v22["imageUrl"] || v22["sourceUrl"] || "",
    });
  return {
    ...v29,
    x: v27["x"] - (v29["width"] || 0) / 2,
    y: v27["y"] - (v29["height"] || 0) / 2,
  };
}
function getEventClientPoint(v30) {
  return {
    x: Number["isFinite"](Number(v30?.["clientX"]))
      ? Number(v30["clientX"])
      : 0,
    y: Number["isFinite"](Number(v30?.["clientY"]))
      ? Number(v30["clientY"])
      : 0,
  };
}
function getElementSize(v31) {
  const v32 =
    v31 && typeof v31["getBoundingClientRect"] === "function"
      ? v31["getBoundingClientRect"]()
      : null;
  return {
    width: toPositiveInt(v32?.["width"]) || toPositiveInt(v31?.["offsetWidth"]),
    height:
      toPositiveInt(v32?.["height"]) || toPositiveInt(v31?.["offsetHeight"]),
  };
}
function resolveOption(v33, ...v34) {
  return typeof v33 === "function" ? v33(...v34) : v33;
}
function removeGhost(v35) {
  if (!v35) return;
  (v35["style"] &&
    ((v35["style"]["transition"] =
      "opacity 0.16s cubic-bezier(0.4, 0, 0.2, 1)"),
    (v35["style"]["opacity"] = "0")),
    setTimeout(() => v35["remove"]?.(), 160));
}
export function createResultImageDragGhost({
  sourceEl: sourceEl = null,
  fallbackSrc: fallbackSrc = "",
  width: width = 0,
  height: height = 0,
  documentRef: documentRef = globalThis["document"],
} = {}) {
  if (!documentRef?.["createElement"]) return null;
  const v36 = Math["max"](1, toPositiveInt(width) || 120),
    v37 = Math["max"](1, toPositiveInt(height) || 120),
    v38 = documentRef["createElement"]("div");
  ((v38["className"] = "v2-ghost-image result-image-drag-ghost"),
    Object["assign"](v38["style"], { width: v36 + "px", height: v37 + "px" }));
  const v39 = documentRef["createElement"]("img"),
    v40 = firstNonEmptyString(
      sourceEl?.["currentSrc"],
      sourceEl?.["src"],
      fallbackSrc,
    );
  if (v40) v39["setAttribute"]("src", v40);
  return (v38["appendChild"](v39), v38);
}
export function startResultImageDragOutPointer(v41, v42 = {}) {
  if (!v41 || v41["button"] !== 0) return false;
  const v43 = v42["targetEl"] || v41["currentTarget"];
  if (!v43) return false;
  v41["stopPropagation"]?.();
  const v44 = v43["ownerDocument"] || globalThis["document"],
    v45 = v44?.["body"] || globalThis["document"]?.["body"],
    v46 = getEventClientPoint(v41);
  let v47 = false,
    v48 = null,
    v49 = false;
  const v50 = () => {
      if (v49) return;
      ((v49 = true),
        v44?.["removeEventListener"]?.("pointermove", v51, true),
        v44?.["removeEventListener"]?.("pointerup", v52, true),
        v44?.["removeEventListener"]?.("pointercancel", v53, true));
      try {
        v43["releasePointerCapture"]?.(v41["pointerId"]);
      } catch {}
      v42["onDragEnd"]?.();
    },
    v54 = (v55) => {
      if (v47) return true;
      const v56 = getEventClientPoint(v55);
      if (
        Math["hypot"](v56["x"] - v46["x"], v56["y"] - v46["y"]) <=
        RESULT_IMAGE_DRAG_OUT_THRESHOLD_PX
      )
        return false;
      const v57 = resolveOption(v42["image"]);
      if (!hasUsableResultImageForDragOut(v57))
        return (
          v42["markClickSuppressed"]?.(),
          v42["showToast"]?.("这张结果图还没有可拖出的本地图片", "warning"),
          v50(),
          false
        );
      ((v47 = true), v42["markClickSuppressed"]?.(), v42["onDragStart"]?.());
      const v58 = resolveOption(v42["getGhostSourceElement"]),
        v59 = resolveOption(v42["getGhostSize"]) || getElementSize(v58 || v43);
      return (
        (v48 =
          v42["createGhost"]?.({
            sourceEl: v58 || v43,
            fallbackSrc: resolveOption(v42["getFallbackSrc"]) || "",
            width: v59["width"],
            height: v59["height"],
            documentRef: v44,
          }) ||
          createResultImageDragGhost({
            sourceEl: v58 || v43,
            fallbackSrc: resolveOption(v42["getFallbackSrc"]) || "",
            width: v59["width"],
            height: v59["height"],
            documentRef: v44,
          })),
        v48 &&
          (v45?.["appendChild"]?.(v48),
          (v48["style"]["transform"] =
            "translate(" +
            v56["x"] +
            "px, " +
            v56["y"] +
            "px)\x20translate(-50%,\x20-50%)")),
        true
      );
    };
  function v51(v60) {
    if (!v54(v60)) return;
    (v60["preventDefault"]?.(), v60["stopPropagation"]?.());
    const v61 = getEventClientPoint(v60);
    v48 &&
      (v48["style"]["transform"] =
        "translate(" +
        v61["x"] +
        "px, " +
        v61["y"] +
        "px) translate(-50%, -50%)");
  }
  function v52(v62) {
    const v63 = v47;
    v50();
    if (!v63) return;
    (v62["preventDefault"]?.(), v62["stopPropagation"]?.());
    const v64 = resolveOption(v42["image"]),
      v65 =
        resolveOption(v42["getNodeFallbackSize"]) ||
        resolveOption(v42["getGhostSize"]) ||
        getElementSize(v43),
      v66 = buildResultImageDragOutNodePayload({
        image: v64,
        viewport: resolveOption(v42["getViewport"]) || { x: 0, y: 0, zoom: 1 },
        screenX: Number(v62?.["clientX"] ?? v46["x"]),
        screenY: Number(v62?.["clientY"] ?? v46["y"]),
        fallbackWidth: v65["width"],
        fallbackHeight: v65["height"],
        createId: v42["createId"],
        name: resolveOption(v42["getNodeName"]),
      });
    if (!v66) {
      (v42["showToast"]?.("这张结果图还没有可拖出的本地图片", "warning"),
        removeGhost(v48));
      return;
    }
    (v42["addNode"]?.(v66),
      v42["setSelectedNodes"]?.([v66["id"]]),
      v42["commit"]?.(),
      v42["onCreated"]?.(v66),
      removeGhost(v48));
  }
  function v53(v67) {
    (v67?.["stopPropagation"]?.(), v50(), removeGhost(v48));
  }
  try {
    v43["setPointerCapture"]?.(v41["pointerId"]);
  } catch {}
  return (
    v44?.["addEventListener"]?.("pointermove", v51, true),
    v44?.["addEventListener"]?.("pointerup", v52, true),
    v44?.["addEventListener"]?.("pointercancel", v53, true),
    true
  );
}
export function bindResultImageDragOutGesture(v68, v69 = {}) {
  if (!v68?.["addEventListener"]) return () => {};
  const v70 = (v71) => {
    if (v69["isEnabled"] && !v69["isEnabled"]()) return;
    startResultImageDragOutPointer(v71, { ...v69, targetEl: v68 });
  };
  return (
    v68["addEventListener"]("pointerdown", v70),
    () => v68["removeEventListener"]?.("pointerdown", v70)
  );
}

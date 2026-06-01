import { buildFixedInputAssetSlotMap } from "../../modules/fixedInputAssetRefs.js";
import { bindRefThumbFixedSlotDrag } from "../../modules/refThumbDragController.js";
function escapeRefBarHtml(v0) {
  return String(v0 ?? "")
    ["replace"](/&/g, "&amp;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;")
    ["replace"](/"/g, "&quot;")
    ["replace"](/'/g, "&#39;");
}
function getFixedImageSlotLabelHtml(v1, v2) {
  const v3 = String(v2 || "")["trim"](),
    v4 = v1?.["slotById"]?.[v3] || {},
    v5 = String(v4["label"] || v3)["trim"]() || v3;
  return escapeRefBarHtml(v5)["replace"](/\s+/g, "<br>");
}
function getFixedImageSlotTitle(v6, v7) {
  const v8 = String(v7 || "")["trim"](),
    v9 = v6?.["slotById"]?.[v8] || {};
  return String(v9["description"] || v9["label"] || v8)["trim"]() || v8;
}
function getFixedImageSlotAcceptMap(v10) {
  const v11 = {};
  return (
    (v10?.["visibleSlots"] || [])["forEach"]((v12) => {
      const v13 = String(v10?.["slotKindById"]?.[v12] || "")["trim"]();
      if (v12 && v13) v11[v12] = v13;
    }),
    v11
  );
}
function getItemKey(v14) {
  return String(v14?.["key"] || v14?.["edgeId"] || "");
}
function createAssetSlotItem({
  ref: v15,
  slot: v16,
  fixedInputConfig: v17,
  ensureThumbDecoded: v18,
}) {
  if (!v15?.["url"]) return null;
  const v19 = String(v15["thumbUrl"] || v15["url"] || "")["trim"]();
  if (!v19) return null;
  v18(v19);
  const v20 = String(v15["assetId"] || ""),
    v21 = String(v15["itemIndex"] ?? ""),
    v22 = String(v15["assetMentionOccurrence"] ?? ""),
    v23 = String(v15["assetRefSource"] || "prompt");
  return {
    key: "asset:" + v23 + ":" + v20 + ":" + v21 + ":image:" + v16,
    edgeId: "",
    sourceId: "asset:" + v20 + ":" + v21,
    refSlot: v16,
    type: "image",
    label: v15["label"] || v15["name"] || getFixedImageSlotTitle(v17, v16),
    sig: "asset:" + v16 + "|" + String(v15["url"] || "") + "|" + v19,
    thumbHTML:
      '<img src="' +
      v19 +
      "\x22\x20class=\x22ref-thumb-media\x20is-pending\x22\x20draggable=\x22false\x22>",
    thumbSrc: v19,
    previewSrc: String(v15["url"] || v19),
    virtual: true,
    assetId: v20,
    assetIndex: v21,
    assetOccurrence: v22,
    assetRefSource: v23,
    refType: "image",
  };
}
function hasAssignedVirtualAsset(v24, v25) {
  if (!v25?.["virtual"]) return false;
  return Array["from"](v24["values"]())["some"](
    (v26) =>
      v26?.["virtual"] &&
      String(v26["assetId"] || "") === String(v25["assetId"] || "") &&
      String(v26["assetIndex"] || "") === String(v25["assetIndex"] || "") &&
      String(v26["assetOccurrence"] || "") ===
        String(v25["assetOccurrence"] || "") &&
      String(v26["assetRefSource"] || "prompt") ===
        String(v25["assetRefSource"] || "prompt"),
  );
}
function ensureFixedImageSkeleton({
  refBarEl: v27,
  attachBtnHTML: v28,
  slotOrder: v29,
  fixedInputConfig: v30,
  owner: v31,
}) {
  let v32 = v27["querySelector"](".prompt-attachment-btn"),
    v33 =
      v27["querySelector"](".rh-v5-ref-container") ||
      v27["querySelector"](".ref-thumb-container");
  const v34 = v29["every"]((v35) =>
    v33?.["querySelector"]?.("[data-slot=\x22" + v35 + "\x22]"),
  );
  if (!v32 || !v33 || !v34) {
    const v36 = v29["map"]((v37) => {
      const v38 = escapeRefBarHtml(getFixedImageSlotTitle(v30, v37));
      return (
        "<button\x20type=\x22button\x22\x20class=\x22ref-thumb-wrap\x20ref-upload-slot\x20rh-v5-ref-box\x22\x20data-ref-slot=\x22" +
        escapeRefBarHtml(v37) +
        '" data-slot="' +
        escapeRefBarHtml(v37) +
        '" data-kind="image" draggable="false" title="' +
        v38 +
        '"><span class="ref-upload-label">' +
        getFixedImageSlotLabelHtml(v30, v37) +
        "</span></button>"
      );
    })["join"]("");
    ((v27["innerHTML"] =
      v28 +
      "\x20<div\x20class=\x22ref-thumb-container\x20rh-v5-ref-container\x22>" +
      v36 +
      "</div>"),
      (v32 = v27["querySelector"](".prompt-attachment-btn")),
      (v33 =
        v27["querySelector"](".rh-v5-ref-container") ||
        v27["querySelector"](".ref-thumb-container")),
      (v31["_attachBtnIcon"] = v32 ? v32["querySelector"](".btn-icon") : null));
  }
  return v33;
}
function collectFixedSlotItems({
  slotOrder: v39,
  items: v40,
  fixedInputConfig: v41,
  promptEl: v42,
  targetNodeData: v43,
  ensureThumbDecoded: v44,
}) {
  const v45 = new Map(),
    v46 = new Set(),
    v47 = new Set(v39);
  for (const v48 of v40) {
    if (v48["type"] !== "image") continue;
    const v49 = getItemKey(v48),
      v50 = String(v48["refSlot"] || "")["trim"]();
    if (!v49 || v46["has"](v49) || !v47["has"](v50)) continue;
    if (v45["has"](v50)) continue;
    (v45["set"](v50, v48), v46["add"](v49));
  }
  const v51 = buildFixedInputAssetSlotMap(v42, {
    slotOrderByType: v41["slotOrderByType"] || {},
    visibleSlots: v39,
    exclusiveGroups: v41["exclusiveGroups"] || [],
    occupiedSlots: new Set(v45["keys"]()),
    nodeData: v43,
  });
  v39["forEach"]((v52) => {
    if (v45["has"](v52)) return;
    const v53 = createAssetSlotItem({
      ref: v51[v52],
      slot: v52,
      fixedInputConfig: v41,
      ensureThumbDecoded: v44,
    });
    if (v53) v45["set"](v52, v53);
  });
  for (const v54 of v40) {
    if (v54["type"] !== "image") continue;
    const v55 = getItemKey(v54);
    if (!v55 || v46["has"](v55)) continue;
    if (hasAssignedVirtualAsset(v45, v54)) continue;
    const v56 = v39["find"]((v57) => !v45["has"](v57));
    if (!v56) break;
    (v45["set"](v56, v54), v46["add"](v55));
  }
  return v45;
}
function syncFixedSlotElement({
  container: v58,
  slot: v59,
  item: v60,
  fixedInputConfig: v61,
  revealRefThumbMedia: v62,
}) {
  const v63 = getFixedImageSlotTitle(v61, v59);
  let v64 = v58?.["querySelector"]?.('[data-slot="' + v59 + "\x22]");
  if (v60 && v64?.["classList"]?.["contains"]?.("ref-upload-slot")) {
    const v65 = document["createElement"]("div");
    ((v65["className"] =
      "ref-thumb-wrap\x20rh-v5-ref-box" +
      (v60["virtual"] ? "\x20ref-thumb-wrap--asset" : "")),
      v64["replaceWith"](v65),
      (v64 = v65));
  } else {
    if (!v60 && v64 && !v64["classList"]?.["contains"]?.("ref-upload-slot")) {
      const v66 = document["createElement"]("button");
      ((v66["type"] = "button"),
        (v66["className"] = "ref-thumb-wrap ref-upload-slot rh-v5-ref-box"),
        v64["replaceWith"](v66),
        (v64 = v66));
    } else
      !v64 &&
        ((v64 = document["createElement"](v60 ? "div" : "button")),
        v58?.["appendChild"](v64));
  }
  if (!v64) return;
  ((v64["dataset"]["refSlot"] = v59),
    (v64["dataset"]["slot"] = v59),
    (v64["dataset"]["kind"] = "image"),
    (v64["title"] = v63));
  if (v60) {
    ((v64["className"] =
      "ref-thumb-wrap rh-v5-ref-box" +
      (v60["virtual"] ? " ref-thumb-wrap--asset" : "")),
      v64["classList"]["remove"]("ref-upload-slot"),
      v64["setAttribute"]("draggable", v60["virtual"] ? "false" : "true"),
      (v64["dataset"]["refKey"] = getItemKey(v60)),
      (v64["dataset"]["edgeId"] = v60["edgeId"] || ""),
      (v64["dataset"]["sourceId"] = v60["sourceId"] || ""),
      (v64["dataset"]["refOrigin"] = v60["virtual"] ? "asset" : "node"));
    v60["virtual"]
      ? ((v64["dataset"]["assetId"] = v60["assetId"] || ""),
        (v64["dataset"]["assetIndex"] = v60["assetIndex"] || ""),
        (v64["dataset"]["assetOccurrence"] = v60["assetOccurrence"] || ""),
        (v64["dataset"]["assetRefSource"] = v60["assetRefSource"] || "prompt"),
        (v64["dataset"]["refType"] = v60["refType"] || v60["type"] || ""))
      : (delete v64["dataset"]["assetId"],
        delete v64["dataset"]["assetIndex"],
        delete v64["dataset"]["assetOccurrence"],
        delete v64["dataset"]["assetRefSource"],
        delete v64["dataset"]["refType"]);
    v64["dataset"]["sig"] !== v60["sig"] &&
      ((v64["innerHTML"] =
        v60["thumbHTML"] +
        "<button\x20type=\x22button\x22\x20class=\x22ref-thumb-delete\x22\x20title=\x22移除参考\x22>&times;</button>"),
      (v64["dataset"]["sig"] = v60["sig"]),
      v62(v64, v60["sig"]));
    if (v60["thumbSrc"]) v64["dataset"]["thumbSrc"] = v60["thumbSrc"];
    else delete v64["dataset"]["thumbSrc"];
    if (v60["previewSrc"]) v64["dataset"]["previewSrc"] = v60["previewSrc"];
    else delete v64["dataset"]["previewSrc"];
    return;
  }
  ((v64["className"] = "ref-thumb-wrap\x20ref-upload-slot\x20rh-v5-ref-box"),
    v64["setAttribute"]("draggable", "false"),
    [
      "refKey",
      "edgeId",
      "sourceId",
      "refOrigin",
      "assetId",
      "assetIndex",
      "assetOccurrence",
      "assetRefSource",
      "refType",
      "sig",
      "thumbSrc",
      "previewSrc",
    ]["forEach"]((v67) => {
      if (v64["dataset"][v67]) delete v64["dataset"][v67];
    }));
  const v68 =
    '<span class="ref-upload-label">' +
    getFixedImageSlotLabelHtml(v61, v59) +
    "</span>";
  if (v64["innerHTML"] !== v68) v64["innerHTML"] = v68;
}
export function renderManifestFixedImageRefBar({
  owner: v69,
  refBarEl: v70,
  promptEl: v71,
  attachBtnHTML: v72,
  fixedInputConfig: v73,
  items: v74,
  targetNodeData: v75,
  sourceIdToLabel: v76,
  store: v77,
  nodeId: v78,
  ensureThumbDecoded: v79,
  revealRefThumbMedia: v80,
  syncPillLabels: v81,
}) {
  const v82 = (v73?.["visibleSlots"] || [])
    ["map"]((v83) => String(v83 || "")["trim"]())
    [
      "filter"
    ]((v84) => v84 && String(v73?.["slotKindById"]?.[v84] || "") === "image");
  if (v82["length"] === 0) return false;
  (v70["classList"]["add"]("active", "rh-v5-refbar"),
    (v69["_lastRefHTML"] = "__rh-manifest-fixed-image__:" + v82["join"](",")));
  const v85 = ensureFixedImageSkeleton({
      refBarEl: v70,
      attachBtnHTML: v72,
      slotOrder: v82,
      fixedInputConfig: v73,
      owner: v69,
    }),
    v86 = collectFixedSlotItems({
      slotOrder: v82,
      items: v74,
      fixedInputConfig: v73,
      promptEl: v71,
      targetNodeData: v75,
      ensureThumbDecoded: v79,
    }),
    v87 = new Set(v82);
  return (
    Array["from"](v85?.["querySelectorAll"]?.("[data-slot]") || [])
      ["filter"]((v88) => !v87["has"](String(v88?.["dataset"]?.["slot"] || "")))
      ["forEach"]((v89) => v89["remove"]()),
    v82["forEach"]((v90) => {
      syncFixedSlotElement({
        container: v85,
        slot: v90,
        item: v86["get"](v90) || null,
        fixedInputConfig: v73,
        revealRefThumbMedia: v80,
      });
    }),
    bindRefThumbFixedSlotDrag({
      owner: v69,
      container: v85,
      store: v77,
      nodeId: v78,
      acceptMap: getFixedImageSlotAcceptMap(v73),
    }),
    v69["_syncBtnIconState"](),
    v81(v69, v76),
    true
  );
}

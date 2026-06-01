import {
  isCanvasLowZoomActive,
  isNodePromotedForFullImage,
} from "./canvasImageLod.js";
const PROVIDER_ICON_RE = /^images\/(?:RH|jimeng|grsai|ppio)\.png(?:[?#].*)?$/i,
  PROVIDER_ICON_SELECTOR = [
    "#v2-canvas\x20.v2-node\x20.img-model-pills\x20img",
    "#v2-canvas .v2-node .img-model-menu img",
    "#v2-canvas .v2-node .image-function-model-trigger-icon-slot img",
  ]["join"](","),
  PROVIDER_ICON_CONTAINER_SELECTOR =
    ".img-model-pills, .img-model-menu, .image-function-model-trigger-icon-slot",
  PROVIDER_SRC_ATTR = "lowZoomProviderSrc",
  PROVIDER_SRCSET_ATTR = "lowZoomProviderSrcset",
  PLACEHOLDER_CLASS = "provider-logo-lod-placeholder",
  NODE_PROMOTION_CLASSES = new Set([
    "selected",
    "v2-selected",
    "selection-related",
    "conn-src",
    "conn-hoverTarget",
  ]);
function getDocumentRef(v0) {
  return v0?.["ownerDocument"] || globalThis["document"];
}
function scheduleFrame(v1) {
  const v2 = globalThis["requestAnimationFrame"];
  if (typeof v2 === "function") return v2(v1);
  return setTimeout(v1, 16);
}
function cancelFrame(v3) {
  const v4 = globalThis["cancelAnimationFrame"];
  if (typeof v4 === "function") {
    v4(v3);
    return;
  }
  clearTimeout(v3);
}
function normalizeIconSrc(v5) {
  return String(v5 || "")
    ["trim"]()
    ["replace"](/^https?:\/\/[^/]+\//i, "")
    ["replace"](/^\/+/, "");
}
function readProviderIconSrc(v6) {
  return (
    v6?.["getAttribute"]?.("src") || v6?.["dataset"]?.[PROVIDER_SRC_ATTR] || ""
  );
}
function isProviderIconImage(v7) {
  return isProviderLogoSrc(readProviderIconSrc(v7));
}
function isElementNode(v8) {
  return !!v8 && v8["nodeType"] === 1;
}
function getElementFromNode(v9) {
  if (isElementNode(v9)) return v9;
  const v10 = v9?.["parentElement"] || v9?.["parentNode"];
  return isElementNode(v10) ? v10 : null;
}
function elementMatches(v11, v12) {
  if (!isElementNode(v11) || typeof v11["matches"] !== "function") return false;
  try {
    return v11["matches"](v12);
  } catch {
    return false;
  }
}
function elementContainsMatch(v13, v14) {
  if (!isElementNode(v13) || typeof v13["querySelector"] !== "function")
    return false;
  try {
    return !!v13["querySelector"](v14);
  } catch {
    return false;
  }
}
function isProviderIconElement(v15) {
  if (!isElementNode(v15)) return false;
  if (elementMatches(v15, PROVIDER_ICON_SELECTOR)) return true;
  if (String(v15["tagName"] || "")["toLowerCase"]() !== "img") return false;
  return isProviderIconImage(v15);
}
function nodeContainsProviderIcon(v16) {
  if (!isElementNode(v16)) return false;
  return (
    isProviderIconElement(v16) ||
    elementContainsMatch(v16, PROVIDER_ICON_SELECTOR) ||
    elementMatches(v16, PROVIDER_ICON_CONTAINER_SELECTOR) ||
    elementContainsMatch(v16, PROVIDER_ICON_CONTAINER_SELECTOR)
  );
}
function didPromotionClassChange(v17, v18 = "") {
  const v19 = new Set(
      String(v17 || "")
        ["split"](/\s+/)
        ["filter"](Boolean),
    ),
    v20 = new Set(
      String(v18 || "")
        ["split"](/\s+/)
        ["filter"](Boolean),
    );
  for (const v21 of NODE_PROMOTION_CLASSES) {
    if (v19["has"](v21) !== v20["has"](v21)) return true;
  }
  return false;
}
function shouldSyncForProviderIconMutation(v22) {
  const v23 = v22?.["target"];
  if (!v23) return false;
  if (v22["type"] === "childList") {
    const v24 = [
      ...Array["from"](v22["addedNodes"] || []),
      ...Array["from"](v22["removedNodes"] || []),
    ];
    return v24["some"]((v25) => nodeContainsProviderIcon(v25));
  }
  if (v22["type"] !== "attributes") return false;
  if (isProviderIconElement(v23)) return true;
  if (v22["attributeName"] !== "class") return false;
  if (elementMatches(v23, ".v2-node"))
    return didPromotionClassChange(
      v22["oldValue"],
      v23["getAttribute"]?.("class") || "",
    );
  return nodeContainsProviderIcon(v23);
}
function getClosestCanvasNode(v26) {
  const v27 = getElementFromNode(v26);
  if (!v27) return null;
  if (elementMatches(v27, ".v2-node")) return v27;
  if (typeof v27["closest"] !== "function") return null;
  try {
    return v27["closest"](".v2-node");
  } catch {
    return null;
  }
}
function shouldSyncForProviderPointerEvent(v28) {
  const v29 = getClosestCanvasNode(v28?.["target"]),
    v30 = getClosestCanvasNode(v28?.["relatedTarget"]);
  return !!(v29 || v30) && v29 !== v30;
}
function findProviderIconImages(v31) {
  if (!v31 || typeof v31["querySelectorAll"] !== "function") return [];
  return Array["from"](v31["querySelectorAll"](PROVIDER_ICON_SELECTOR));
}
function shouldDehydrateProviderIcon(
  v32,
  { store: v33, documentRef: v34 } = {},
) {
  if (!isProviderIconImage(v32)) return false;
  const v35 = v32["closest"]?.(".v2-node");
  if (!v35) return false;
  if (!isCanvasLowZoomActive(v34)) return false;
  return !isNodePromotedForFullImage({
    nodeId: v35["id"],
    rootEl: v35,
    store: v33,
    documentRef: v34,
  });
}
export function isProviderLogoSrc(v36) {
  return PROVIDER_ICON_RE["test"](normalizeIconSrc(v36));
}
export function dehydrateProviderIcon(v37) {
  if (!v37 || !isProviderIconImage(v37)) return false;
  const v38 = String(v37["getAttribute"]?.("src") || "")["trim"]();
  v38 &&
    ((v37["dataset"][PROVIDER_SRC_ATTR] = v38), v37["removeAttribute"]("src"));
  const v39 = String(v37["getAttribute"]?.("srcset") || "")["trim"]();
  return (
    v39 &&
      ((v37["dataset"][PROVIDER_SRCSET_ATTR] = v39),
      v37["removeAttribute"]("srcset")),
    v37["classList"]?.["add"](PLACEHOLDER_CLASS),
    true
  );
}
export function hydrateProviderIcon(v40) {
  if (!v40) return false;
  const v41 = String(v40["dataset"]?.[PROVIDER_SRC_ATTR] || "")["trim"](),
    v42 = String(v40["dataset"]?.[PROVIDER_SRCSET_ATTR] || "")["trim"]();
  return (
    v41 &&
      !String(v40["getAttribute"]?.("src") || "")["trim"]() &&
      v40["setAttribute"]("src", v41),
    v42 &&
      !String(v40["getAttribute"]?.("srcset") || "")["trim"]() &&
      v40["setAttribute"]("srcset", v42),
    v40["dataset"] &&
      (delete v40["dataset"][PROVIDER_SRC_ATTR],
      delete v40["dataset"][PROVIDER_SRCSET_ATTR]),
    v40["classList"]?.["remove"](PLACEHOLDER_CLASS),
    !!v41 || !!v42
  );
}
export function syncLowZoomProviderIcons({
  rootEl: rootEl = globalThis["document"],
  store: store = null,
} = {}) {
  const v43 = getDocumentRef(rootEl),
    v44 = rootEl?.["querySelectorAll"] ? rootEl : v43,
    v45 = findProviderIconImages(v44);
  for (const v46 of v45) {
    shouldDehydrateProviderIcon(v46, { store: store, documentRef: v43 })
      ? dehydrateProviderIcon(v46)
      : hydrateProviderIcon(v46);
  }
}
export function installProviderIconLodController({
  rootEl: rootEl = null,
  store: store = null,
} = {}) {
  const v47 = getDocumentRef(rootEl),
    v48 = rootEl || v47?.["getElementById"]?.("v2-canvas") || v47;
  let v49 = null;
  const v50 = () => {
      if (v49 !== null) return;
      v49 = scheduleFrame(() => {
        ((v49 = null), syncLowZoomProviderIcons({ rootEl: v48, store: store }));
      });
    },
    v51 = (v52 = []) => {
      const v53 = Array["isArray"](v52) ? v52 : Array["from"](v52 || []);
      v53["some"]((v54) => shouldSyncForProviderIconMutation(v54)) && v50();
    },
    v55 = (v56) => {
      if (shouldSyncForProviderPointerEvent(v56)) v50();
    },
    v57 =
      typeof MutationObserver === "function" && v48
        ? new MutationObserver(v51)
        : null;
  (v57?.["observe"](v48, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "src", "srcset"],
    attributeOldValue: true,
  }),
    v48?.["addEventListener"]?.("pointerover", v55, true),
    v48?.["addEventListener"]?.("pointerout", v55, true));
  const v58 = store?.["subscribeSelector"]?.(
    (v59) => (v59["selectedNodeIds"] || [])["join"]("|"),
    v50,
  );
  return (
    v50(),
    {
      sync: () => syncLowZoomProviderIcons({ rootEl: v48, store: store }),
      scheduleSync: v50,
      disconnect() {
        (v49 !== null && (cancelFrame(v49), (v49 = null)),
          v57?.["disconnect"](),
          v48?.["removeEventListener"]?.("pointerover", v55, true),
          v48?.["removeEventListener"]?.("pointerout", v55, true),
          v58?.());
      },
    }
  );
}

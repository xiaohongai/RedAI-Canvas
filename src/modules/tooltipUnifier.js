const TOOLTIP_ATTRS = ["data-tooltip", "data-tooltip-right"],
  NATIVE_TITLE_BACKUP_ATTR = "data-native-title",
  GENERATED_TOOLTIP_ATTR = "data-tooltip-source",
  GENERATED_TOOLTIP_VALUE = "native-title",
  TOOLTIP_PORTAL_CLASS = "global-tooltip",
  TOOLTIP_PORTAL_READY_CLASS = "has-global-tooltip-portal",
  TOOLTIP_ARROW_CLASS = "global-tooltip-arrow",
  DEFAULT_TOOLTIP_PLACEMENT = "top",
  RIGHT_TOOLTIP_PLACEMENT = "right",
  TOOLTIP_GAP_PX = 12,
  TOOLTIP_VIEWPORT_PADDING_PX = 8,
  TOOLTIP_ARROW_PADDING_PX = 12,
  GLOBAL_TOOLTIP_EXCLUDE_SELECTOR = ".generation-node-help-tip";
let installed = null;
function isElementNode(v0) {
  return v0 && v0["nodeType"] === 1;
}
function clamp(v1, v2, v3) {
  const v4 = Number["isFinite"](v2) ? v2 : 0,
    v5 = Number["isFinite"](v3) ? Math["max"](v4, v3) : v4;
  return Math["min"](Math["max"](v1, v4), v5);
}
function normalizeRect(v6 = {}) {
  const v7 = Number(v6["left"]) || 0,
    v8 = Number(v6["top"]) || 0,
    v9 =
      Number(v6["width"]) || Math["max"](0, (Number(v6["right"]) || v7) - v7),
    v10 =
      Number(v6["height"]) || Math["max"](0, (Number(v6["bottom"]) || v8) - v8);
  return {
    left: v7,
    top: v8,
    right: Number(v6["right"]) || v7 + v9,
    bottom: Number(v6["bottom"]) || v8 + v10,
    width: v9,
    height: v10,
  };
}
function normalizeViewport(v11 = {}) {
  return {
    width:
      Number(v11["width"]) ||
      Number(v11["innerWidth"]) ||
      Number(globalThis["innerWidth"]) ||
      0,
    height:
      Number(v11["height"]) ||
      Number(v11["innerHeight"]) ||
      Number(globalThis["innerHeight"]) ||
      0,
    padding:
      Number(v11["padding"]) >= 0
        ? Number(v11["padding"])
        : TOOLTIP_VIEWPORT_PADDING_PX,
    gap: Number(v11["gap"]) >= 0 ? Number(v11["gap"]) : TOOLTIP_GAP_PX,
    arrowPadding:
      Number(v11["arrowPadding"]) >= 0
        ? Number(v11["arrowPadding"])
        : TOOLTIP_ARROW_PADDING_PX,
  };
}
export function computeTooltipPosition(
  v12,
  v13,
  v14,
  v15 = DEFAULT_TOOLTIP_PLACEMENT,
) {
  const v16 = normalizeRect(v12),
    v17 = normalizeRect(v13),
    v18 = normalizeViewport(v14),
    v19 = v18["width"] - v18["padding"] - v17["width"],
    v20 = v18["height"] - v18["padding"] - v17["height"],
    v21 = v16["left"] + v16["width"] / 2,
    v22 = v16["top"] + v16["height"] / 2;
  let v23 = v15 === RIGHT_TOOLTIP_PLACEMENT ? RIGHT_TOOLTIP_PLACEMENT : "top",
    v24 = v21 - v17["width"] / 2,
    v25 = v16["top"] - v17["height"] - v18["gap"];
  if (v23 === "top") {
    const v26 = v16["bottom"] + v18["gap"];
    return (
      v25 < v18["padding"] &&
        v26 + v17["height"] <= v18["height"] - v18["padding"] &&
        ((v23 = "bottom"), (v25 = v26)),
      (v24 = clamp(v24, v18["padding"], v19)),
      (v25 = clamp(v25, v18["padding"], v20)),
      {
        left: v24,
        top: v25,
        placement: v23,
        arrowLeft: clamp(
          v21 - v24,
          v18["arrowPadding"],
          v17["width"] - v18["arrowPadding"],
        ),
        arrowTop: null,
      }
    );
  }
  return (
    (v24 = v16["right"] + v18["gap"]),
    (v25 = v22 - v17["height"] / 2),
    v24 + v17["width"] > v18["width"] - v18["padding"] &&
      v16["left"] - v18["gap"] - v17["width"] >= v18["padding"] &&
      ((v23 = "left"), (v24 = v16["left"] - v18["gap"] - v17["width"])),
    (v24 = clamp(v24, v18["padding"], v19)),
    (v25 = clamp(v25, v18["padding"], v20)),
    {
      left: v24,
      top: v25,
      placement: v23,
      arrowLeft: null,
      arrowTop: clamp(
        v22 - v25,
        v18["arrowPadding"],
        v17["height"] - v18["arrowPadding"],
      ),
    }
  );
}
function hasUnifiedTooltip(v27) {
  return TOOLTIP_ATTRS["some"]((v28) => {
    const v29 = v27["getAttribute"](v28);
    return typeof v29 === "string" && v29["trim"]();
  });
}
function shouldMirrorToAriaLabel(v30) {
  if (v30["hasAttribute"]("aria-label")) return false;
  const v31 = String(v30["tagName"] || "")["toLowerCase"]();
  if (v31 === "button" || v31 === "input" || v31 === "select") return true;
  return v30["hasAttribute"]("role") || v30["hasAttribute"]("tabindex");
}
export function unifyNativeTooltipElement(v32) {
  if (!isElementNode(v32) || !v32["hasAttribute"]("title")) return false;
  const v33 = String(v32["getAttribute"]("title") || "")["trim"](),
    v34 =
      v32["getAttribute"](GENERATED_TOOLTIP_ATTR) === GENERATED_TOOLTIP_VALUE;
  if (v33)
    ((v34 || !hasUnifiedTooltip(v32)) &&
      (v32["setAttribute"]("data-tooltip", v33),
      v32["setAttribute"](GENERATED_TOOLTIP_ATTR, GENERATED_TOOLTIP_VALUE)),
      v32["setAttribute"](NATIVE_TITLE_BACKUP_ATTR, v33),
      shouldMirrorToAriaLabel(v32) && v32["setAttribute"]("aria-label", v33));
  else
    v34 &&
      (v32["removeAttribute"]("data-tooltip"),
      v32["removeAttribute"](GENERATED_TOOLTIP_ATTR),
      v32["removeAttribute"](NATIVE_TITLE_BACKUP_ATTR));
  return (v32["removeAttribute"]("title"), true);
}
export function unifyNativeTooltips(v35 = globalThis["document"]) {
  if (!v35) return 0;
  let v36 = 0;
  if (isElementNode(v35) && unifyNativeTooltipElement(v35)) v36 += 1;
  const v37 = v35["querySelectorAll"]?.("[title]");
  if (!v37) return v36;
  return (
    v37["forEach"]((v38) => {
      if (unifyNativeTooltipElement(v38)) v36 += 1;
    }),
    v36
  );
}
function normalizeMutationRecord(v39) {
  if (v39["type"] === "attributes") {
    unifyNativeTooltipElement(v39["target"]);
    return;
  }
  v39["addedNodes"]["forEach"]((v40) => {
    unifyNativeTooltips(v40);
  });
}
function getTooltipDescriptor(v41) {
  if (!isElementNode(v41)) return null;
  if (v41["closest"]?.(GLOBAL_TOOLTIP_EXCLUDE_SELECTOR)) return null;
  const v42 = String(v41["getAttribute"]("data-tooltip-right") || "")["trim"]();
  if (v42) {
    if (v41["getAttribute"]("aria-expanded") === "true") return null;
    return { text: v42, placement: RIGHT_TOOLTIP_PLACEMENT };
  }
  const v43 = String(v41["getAttribute"]("data-tooltip") || "")["trim"]();
  if (v43) return { text: v43, placement: DEFAULT_TOOLTIP_PLACEMENT };
  return null;
}
function findTooltipTarget(v44) {
  let v45 = isElementNode(v44) ? v44 : v44?.["parentElement"];
  while (isElementNode(v45)) {
    if (getTooltipDescriptor(v45)) return v45;
    v45 = v45["parentElement"];
  }
  return null;
}
function createTooltipPortal(v46) {
  const v47 = v46["createElement"]("div");
  ((v47["className"] = TOOLTIP_PORTAL_CLASS),
    v47["setAttribute"]("role", "tooltip"),
    (v47["hidden"] = true));
  const v48 = v46["createElement"]("div");
  return (
    (v48["className"] = TOOLTIP_ARROW_CLASS),
    v47["appendChild"](v48),
    v46["body"]?.["appendChild"](v47),
    { portal: v47, arrow: v48 }
  );
}
export function installTooltipUnifier(v49 = globalThis["document"]) {
  if (!v49?.["documentElement"]) return () => {};
  if (installed) return installed["cleanup"];
  (unifyNativeTooltips(v49),
    v49["documentElement"]["classList"]?.["add"](TOOLTIP_PORTAL_READY_CLASS));
  let v50 = null,
    v51 = null,
    v52 = null;
  const v53 = () => {
      if (v51 && v51["isConnected"] !== false) return v51;
      if (!v49["body"] || typeof v49["createElement"] !== "function")
        return null;
      const v54 = createTooltipPortal(v49);
      return ((v51 = v54["portal"]), (v52 = v54["arrow"]), v51);
    },
    v55 = (v56 = null) => {
      if (v56 && v50 !== v56) return;
      v50 = null;
      if (!v51) return;
      (v51["classList"]?.["remove"]("is-visible"), (v51["hidden"] = true));
    },
    v57 = () => {
      if (!v50 || !v51 || v51["hidden"]) return;
      if (!v49["documentElement"]["contains"]?.(v50)) {
        v55();
        return;
      }
      const v58 = getTooltipDescriptor(v50);
      if (!v58) {
        v55();
        return;
      }
      const v59 = v50["getBoundingClientRect"]?.(),
        v60 = v51["getBoundingClientRect"]?.();
      if (!v59 || !v60) return;
      const v61 = v49["defaultView"] || globalThis,
        v62 = computeTooltipPosition(
          v59,
          v60,
          { width: v61["innerWidth"], height: v61["innerHeight"] },
          v58["placement"],
        );
      ((v51["style"]["left"] = v62["left"] + "px"),
        (v51["style"]["top"] = v62["top"] + "px"),
        (v51["dataset"]["placement"] = v62["placement"]),
        v51["classList"]?.["toggle"](
          "is-placement-right",
          v62["placement"] === "right",
        ),
        v51["classList"]?.["toggle"](
          "is-placement-left",
          v62["placement"] === "left",
        ),
        v51["classList"]?.["toggle"](
          "is-placement-bottom",
          v62["placement"] === "bottom",
        ),
        v51["classList"]?.["toggle"](
          "is-placement-top",
          v62["placement"] === "top",
        ),
        v52 &&
          (v62["arrowLeft"] != null &&
            ((v52["style"]["left"] = v62["arrowLeft"] + "px"),
            (v52["style"]["top"] = "")),
          v62["arrowTop"] != null &&
            ((v52["style"]["top"] = v62["arrowTop"] + "px"),
            (v52["style"]["left"] = ""))));
    },
    v63 = (v64) => {
      const v65 = getTooltipDescriptor(v64);
      if (!v65) {
        v55(v64);
        return;
      }
      const v66 = v53();
      if (!v66) return;
      ((v50 = v64), (v66["textContent"] = v65["text"]));
      if (v52) v66["appendChild"](v52);
      ((v66["hidden"] = false),
        v66["classList"]?.["remove"]("is-visible"),
        (v66["style"]["left"] = "0px"),
        (v66["style"]["top"] = "0px"),
        v57(),
        v66["classList"]?.["add"]("is-visible"));
    },
    v67 = (v68) => {
      if (!isElementNode(v68)) return;
      const v69 = v68["classList"]?.["contains"]("is-tooltip-pinned");
      if (v69 && getTooltipDescriptor(v68)) {
        v63(v68);
        return;
      }
      if (v50 === v68) {
        const v70 = getTooltipDescriptor(v68);
        if (v70) v63(v68);
        else v55(v68);
      }
    },
    v71 =
      v49["defaultView"]?.["MutationObserver"] ||
      globalThis["MutationObserver"],
    v72 = v71
      ? new v71((v73) => {
          (v73["forEach"]((v74) => {
            (normalizeMutationRecord(v74),
              v74["type"] === "attributes" &&
                [
                  "class",
                  "data-tooltip",
                  "data-tooltip-right",
                  "aria-expanded",
                ]["includes"](v74["attributeName"]) &&
                v67(v74["target"]));
          }),
            v50 && !v49["documentElement"]["contains"]?.(v50) && v55());
        })
      : null;
  v72?.["observe"](v49["documentElement"], {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "title",
      "class",
      "data-tooltip",
      "data-tooltip-right",
      "aria-expanded",
    ],
  });
  const v75 = (v76) => {
      const v77 = v76["target"]?.["closest"]?.("[title]") || v76["target"];
      unifyNativeTooltipElement(v77);
      const v78 = findTooltipTarget(v76["target"]);
      if (v78) v63(v78);
    },
    v79 = (v80) => {
      if (!v50) return;
      if (v50["contains"]?.(v80["relatedTarget"])) return;
      v55(v50);
    },
    v81 = (v82) => {
      const v83 = v82["target"]?.["closest"]?.("[title]") || v82["target"];
      unifyNativeTooltipElement(v83);
      const v84 = findTooltipTarget(v82["target"]);
      if (v84) v63(v84);
    },
    v85 = (v86) => {
      if (!v50) return;
      if (v50["contains"]?.(v86["relatedTarget"])) return;
      v55(v50);
    },
    v87 = () => {
      v55();
    },
    v88 = () => v55();
  (v49["addEventListener"]?.("pointerover", v75, true),
    v49["addEventListener"]?.("pointerout", v79, true),
    v49["addEventListener"]?.("focusin", v81, true),
    v49["addEventListener"]?.("focusout", v85, true),
    v49["addEventListener"]?.("pointerdown", v88, true),
    v49["addEventListener"]?.("scroll", v87, true),
    v49["defaultView"]?.["addEventListener"]?.("scroll", v87, true),
    v49["defaultView"]?.["addEventListener"]?.("resize", v87));
  const v89 = () => {
    (v72?.["disconnect"](),
      v49["removeEventListener"]?.("pointerover", v75, true),
      v49["removeEventListener"]?.("pointerout", v79, true),
      v49["removeEventListener"]?.("focusin", v81, true),
      v49["removeEventListener"]?.("focusout", v85, true),
      v49["removeEventListener"]?.("pointerdown", v88, true),
      v49["removeEventListener"]?.("scroll", v87, true),
      v49["defaultView"]?.["removeEventListener"]?.("scroll", v87, true),
      v49["defaultView"]?.["removeEventListener"]?.("resize", v87),
      v49["documentElement"]["classList"]?.["remove"](
        TOOLTIP_PORTAL_READY_CLASS,
      ),
      v51?.["remove"]?.(),
      (v50 = null),
      (v51 = null),
      (v52 = null),
      (installed = null));
  };
  return ((installed = { cleanup: v89 }), v89);
}

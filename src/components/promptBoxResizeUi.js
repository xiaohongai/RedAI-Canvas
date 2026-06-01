import {
  applyPromptBoxHeight,
  getPromptBoxHeightBounds,
  normalizePromptBoxHeight,
} from "./promptBoxResize.js";
const EDGE_HIT_TOP_OFFSET = 20,
  EDGE_HIT_BOTTOM_OFFSET = 10;
export function syncPromptBoxSizeFromData(v0, v1 = v0?.["_data"]) {
  if (!v0?.["promptEl"] || v0["_isPromptBoxResizing"]) return;
  const v2 = getPromptBoxHeightBounds(v0["_promptPanel"]),
    v3 = normalizePromptBoxHeight(v1?.["promptBoxHeight"], v2);
  applyPromptBoxHeight(v0["promptEl"], v3);
}
export function setupPromptBoxResize(v4, { store: v5, getStateSnapshot: v6 }) {
  if (!v4?.["_promptPanel"] || v4["_promptResizeHandle"]) return;
  v4["_promptResizeHandle"] = true;
  const v7 = () => v6()["ui"]?.["promptBoxResizeEnabled"] !== false,
    v8 = (v9) => !!v9?.["closest"](".floating-menu, .img-model-menu"),
    v10 = (v11) => {
      const v12 = v4["_promptPanel"]["getBoundingClientRect"]();
      return (
        v11 >= v12["bottom"] - EDGE_HIT_TOP_OFFSET &&
        v11 <= v12["bottom"] + EDGE_HIT_BOTTOM_OFFSET
      );
    },
    v13 = (v14) => {
      if (!v4["_promptPanel"]) return;
      if (!v7()) {
        v4["_promptPanel"]["classList"]["remove"]("is-resize-hover");
        return;
      }
      if (v4["_isPromptBoxResizing"]) {
        v4["_promptPanel"]["classList"]["add"]("is-resize-hover");
        return;
      }
      const v15 = !v8(v14?.["target"]) && v10(v14["clientY"]);
      v4["_promptPanel"]["classList"]["toggle"]("is-resize-hover", v15);
    },
    v16 = () => {
      !v4["_isPromptBoxResizing"] &&
        v4["_promptPanel"]?.["classList"]["remove"]("is-resize-hover");
    },
    v17 = () => {
      (v4["_promptPanel"]?.["removeEventListener"]("pointerdown", v18),
        v4["_promptPanel"]?.["removeEventListener"]("pointermove", v13),
        v4["_promptPanel"]?.["removeEventListener"]("pointerleave", v16),
        v4["_promptPanel"]?.["classList"]["remove"]("is-resize-hover"));
    },
    v18 = (v19) => {
      if (!v4["_promptInputWrap"] || !v4["promptEl"]) return;
      if (!v7()) return;
      if (v19["button"] !== 0) return;
      if (!v10(v19["clientY"])) return;
      if (v19["target"]?.["closest"](".prompt-submit") || v8(v19["target"]))
        return;
      (v19["stopPropagation"](), v19["preventDefault"]());
      const v20 = getPromptBoxHeightBounds(v4["_promptPanel"]),
        v21 = v19["clientY"],
        v22 = v4["promptEl"]["getBoundingClientRect"]()["height"];
      ((v4["_isPromptBoxResizing"] = true),
        v4["_promptInputWrap"]["classList"]["add"]("is-resizing"),
        v4["_promptPanel"]["classList"]["add"]("is-resize-hover"));
      const v23 = (v24) => {
          v24["preventDefault"]();
          const v25 = normalizePromptBoxHeight(
            v22 + (v24["clientY"] - v21),
            v20,
          );
          applyPromptBoxHeight(v4["promptEl"], v25);
        },
        v26 = (v27) => {
          (v27["preventDefault"](),
            window["removeEventListener"]("pointermove", v23),
            window["removeEventListener"]("pointerup", v26),
            window["removeEventListener"]("pointercancel", v26));
          const v28 = normalizePromptBoxHeight(
            v4["promptEl"]?.["getBoundingClientRect"]()["height"],
            v20,
          );
          (applyPromptBoxHeight(v4["promptEl"], v28),
            v4["_promptInputWrap"]["classList"]["remove"]("is-resizing"),
            (v4["_isPromptBoxResizing"] = false),
            v4["_promptPanel"]["classList"]["remove"]("is-resize-hover"),
            v13(v27),
            v5["updateNodeData"](v4["nodeId"], { promptBoxHeight: v28 }));
        };
      (window["addEventListener"]("pointermove", v23),
        window["addEventListener"]("pointerup", v26),
        window["addEventListener"]("pointercancel", v26),
        (v4["_promptResizeCleanup"] = () => {
          (v17(),
            window["removeEventListener"]("pointermove", v23),
            window["removeEventListener"]("pointerup", v26),
            window["removeEventListener"]("pointercancel", v26));
        }));
    };
  (v4["_promptPanel"]["addEventListener"]("pointermove", v13),
    v4["_promptPanel"]["addEventListener"]("pointerleave", v16),
    v4["_promptPanel"]["addEventListener"]("pointerdown", v18),
    (v4["_promptResizeCleanup"] = v17));
}

import {
  RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  RH_AUDIO_ADVANCED_VOICE_CLONE_RUNNINGHUB_MODEL_ID,
  getModelManifest,
} from "../manifests/index.js";
import { RH_AUDIO_ADVANCED_VOICE_CLONE_HELP_TOOLTIP } from "../manifests/audio/runninghub/runningHubAudioAdvancedVoiceCloneManifest.js";
export const ADVANCED_VOICE_CLONE_HELP_TOOLTIP =
  RH_AUDIO_ADVANCED_VOICE_CLONE_HELP_TOOLTIP;
const HELP_HIGHLIGHT_PATTERN = /\[\[red:([^\]]+)\]\]/g,
  ADVANCED_VOICE_CLONE_ALIASES = [
    RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
    RH_AUDIO_ADVANCED_VOICE_CLONE_RUNNINGHUB_MODEL_ID,
    ...(getModelManifest(RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID)?.[
      "subscriptionAliases"
    ] || []),
    "进阶声音克隆",
  ],
  GENERATION_NODE_HELP_TOOLTIP_MAP = Object["fromEntries"](
    ADVANCED_VOICE_CLONE_ALIASES["map"]((v0) => [
      "audio:" + String(v0 || "")["trim"](),
      ADVANCED_VOICE_CLONE_HELP_TOOLTIP,
    ])["filter"](([v1]) => v1 !== "audio:"),
  );
function getHelpConditionFieldValue(v2 = {}, v3 = "") {
  const v4 = String(v3 || "")["trim"]();
  if (!v4) return undefined;
  const v5 =
    v2?.["generationParams"] && typeof v2["generationParams"] === "object"
      ? v2["generationParams"]
      : {};
  if (Object["prototype"]["hasOwnProperty"]["call"](v5, v4)) return v5[v4];
  if (Object["prototype"]["hasOwnProperty"]["call"](v2 || {}, v4))
    return v2[v4];
  const v6 = v4["split"](".")["filter"](Boolean);
  if (v6["length"] <= 1) return undefined;
  let v7 = v2;
  for (const v8 of v6) {
    if (!v7 || typeof v7 !== "object") return undefined;
    v7 = v7[v8];
  }
  return v7;
}
function helpConditionMatches(v9, v10 = {}) {
  if (!v9 || typeof v9 !== "object") return false;
  if (Array["isArray"](v9["any"]))
    return v9["any"]["some"]((v11) => helpConditionMatches(v11, v10));
  if (Array["isArray"](v9["all"]))
    return v9["all"]["every"]((v12) => helpConditionMatches(v12, v10));
  const v13 = String(v9["field"] || "")["trim"]();
  if (!v13) return false;
  const v14 = getHelpConditionFieldValue(v10, v13),
    v15 = Array["isArray"](v9["values"])
      ? v9["values"]
      : Object["prototype"]["hasOwnProperty"]["call"](v9, "value")
        ? [v9["value"]]
        : [];
  if (v15["length"] === 0) return Boolean(v14);
  return v15["some"](
    (v16) => v14 === v16 || String(v14 ?? "") === String(v16 ?? ""),
  );
}
function resolveManifestHelpText(v17, v18 = {}) {
  const v19 = v17?.["help"];
  if (!v19 || typeof v19 !== "object") return "";
  const v20 = Array["isArray"](v19["variants"]) ? v19["variants"] : [];
  for (const v21 of v20) {
    if (
      v21 &&
      typeof v21 === "object" &&
      helpConditionMatches(v21["when"], v18)
    ) {
      const v22 = String(v21["tooltip"] || v21["text"] || "")["trim"]();
      if (v22) return v22;
    }
  }
  return String(v19["tooltip"] || v19["text"] || "")["trim"]();
}
export function getGenerationNodeHelpTooltip({
  kind: kind = "",
  key: key = "",
  model: model = "",
  label: label = "",
  nodeData: nodeData = {},
} = {}) {
  const v23 = String(kind || "")["trim"](),
    v24 = [key, model, label]
      ["map"]((v25) => String(v25 || "")["trim"]())
      ["filter"](Boolean);
  for (const v26 of v24) {
    const v27 = getModelManifest(v26),
      v28 = resolveManifestHelpText(v27, nodeData);
    if (v28) return v28;
    const v29 = v23 ? v23 + ":" + v26 : "",
      v30 =
        (v29 && GENERATION_NODE_HELP_TOOLTIP_MAP[v29]) ||
        GENERATION_NODE_HELP_TOOLTIP_MAP[v26] ||
        "";
    if (v30) return v30;
  }
  return "";
}
export function stripGenerationNodeHelpMarkup(v31 = "") {
  return (
    (HELP_HIGHLIGHT_PATTERN["lastIndex"] = 0),
    String(v31 || "")["replace"](HELP_HIGHLIGHT_PATTERN, "$1")
  );
}
export function createGenerationNodeHelpTipController({
  panel: v32,
  getHelpText: v33,
  ariaLabel: ariaLabel = "生成模型说明",
} = {}) {
  let v34 = null,
    v35 = null,
    v36 = null;
  const v37 = () => (typeof v33 === "function" ? String(v33() || "") : ""),
    v38 = (v39, v40) => {
      const v41 = String(v40 || "");
      HELP_HIGHLIGHT_PATTERN["lastIndex"] = 0;
      let v42 = 0,
        v43 = HELP_HIGHLIGHT_PATTERN["exec"](v41);
      while (v43) {
        v43["index"] > v42 &&
          v39["appendChild"](
            document["createTextNode"](v41["slice"](v42, v43["index"])),
          );
        const v44 = document["createElement"]("span");
        ((v44["className"] = "generation-node-help-emphasis"),
          (v44["textContent"] = v43[1]),
          v39["appendChild"](v44),
          (v42 = v43["index"] + v43[0]["length"]),
          (v43 = HELP_HIGHLIGHT_PATTERN["exec"](v41)));
      }
      v42 < v41["length"] &&
        v39["appendChild"](document["createTextNode"](v41["slice"](v42)));
    },
    v45 = (v46, v47, v48 = "") => {
      const v49 = document["createElement"]("div");
      if (v48) v49["className"] = v48;
      return (v38(v49, v47), v46["appendChild"](v49), v49);
    },
    v50 = (v51, v52, v53) => {
      const v54 = document["createElement"]("div");
      v54["className"] = "generation-node-help-example-line";
      const v55 = document["createElement"]("span");
      ((v55["className"] = "generation-node-help-ref-pill"),
        (v55["textContent"] = v52),
        v54["appendChild"](v55),
        v54["appendChild"](document["createTextNode"]("\x20" + v53)),
        v51["appendChild"](v54));
    },
    v56 = (v57, v58) => {
      String(v58 || "")
        ["split"]("\x0a")
        ["forEach"]((v59, v60) => {
          v45(
            v57,
            v59,
            v60 === 0 && /用法$/["test"](String(v59 || "")["trim"]())
              ? "generation-node-help-title"
              : "",
          );
        });
    },
    v61 = (v62, v63) => {
      v62["textContent"] = "";
      if (v63 !== ADVANCED_VOICE_CLONE_HELP_TOOLTIP) {
        v56(v62, v63);
        return;
      }
      (v45(v62, "进阶声音克隆用法", "generation-node-help-title"),
        v45(v62, "支持 [[red:3~15 秒音频]]"),
        v45(v62, "[[red:无音频入参]]时 TTS语音 根据提示词生成随机音色"),
        v45(v62, "例：今晚月色真好", "generation-node-help-muted-line"),
        v45(v62, "[[red:1个音频入参]]时 克隆语音"),
        v45(v62, "[[red:2个音频入参]]时 多人克隆音色对话"),
        v45(v62, "例："),
        v50(v62, "@音频1", "你今晚回家吗"),
        v50(v62, "@音频2", "不回了加班要忙到很晚"));
    },
    v64 = () => {
      if (!v32) return null;
      if (v34 && v34["parentNode"] === v32) return v34;
      const v65 = v32["querySelector"](".generation-node-help-tip");
      if (v65) return ((v34 = v65), v65);
      const v66 = document["createElement"]("button");
      return (
        (v66["type"] = "button"),
        (v66["className"] = "rh-tip generation-node-help-tip"),
        (v66["textContent"] = "!"),
        v66["setAttribute"]("aria-label", ariaLabel),
        v66["addEventListener"]("mouseenter", v67),
        v66["addEventListener"]("mouseleave", v68),
        v66["addEventListener"]("focus", v67),
        v66["addEventListener"]("blur", v68),
        v66["addEventListener"]("click", (v69) => {
          (v69["preventDefault"](), v69["stopPropagation"]());
        }),
        v66["addEventListener"]("pointerdown", (v70) => {
          (v70["preventDefault"](), v70["stopPropagation"]());
        }),
        v32["appendChild"](v66),
        (v34 = v66),
        v66
      );
    },
    v71 = () => {
      if (v35?.["isConnected"]) return v35;
      const v72 = document["createElement"]("div");
      return (
        (v72["className"] = "generation-node-help-tooltip-portal"),
        v72["setAttribute"]("role", "tooltip"),
        document["body"]["appendChild"](v72),
        (v35 = v72),
        v72
      );
    },
    v73 = () => {
      if (!v34 || !v35) return;
      const v74 = 12,
        v75 = v34["getBoundingClientRect"](),
        v76 = v35["offsetWidth"] || 340,
        v77 = v35["offsetHeight"] || 0,
        v78 = Math["max"](v74, window["innerWidth"] - v76 - v74),
        v79 = v75["right"] - v76 + 6,
        v80 = Math["min"](Math["max"](v74, v79), v78),
        v81 = v75["top"] - v77 - v74,
        v82 = v75["bottom"] + v74,
        v83 = v81 < v74,
        v84 = v83 ? v82 : v81,
        v85 = Math["min"](
          Math["max"](v75["left"] + v75["width"] / 2 - v80, 16),
          v76 - 16,
        );
      ((v35["style"]["left"] = v80 + "px"),
        (v35["style"]["top"] = v84 + "px"),
        v35["classList"]["toggle"]("is-below", v83),
        v35["style"]["setProperty"](
          "--generation-node-help-tooltip-arrow-left",
          v85 + "px",
        ));
    },
    v67 = () => {
      const v86 = v37();
      if (!v86 || v34?.["classList"]["contains"]("is-hidden")) return;
      const v87 = v71();
      (v61(v87, v86),
        v87["classList"]["add"]("is-open"),
        v73(),
        !v36 &&
          ((v36 = () => v73()),
          window["addEventListener"]("scroll", v36, true),
          window["addEventListener"]("resize", v36)));
    },
    v68 = () => {
      v35?.["classList"]["remove"]("is-open");
      if (!v36) return;
      (window["removeEventListener"]("scroll", v36, true),
        window["removeEventListener"]("resize", v36),
        (v36 = null));
    },
    v88 = () => {
      const v89 = v34 || v64();
      if (!v89) return;
      const v90 = v37(),
        v91 = Boolean(v90);
      v89["classList"]["toggle"]("is-hidden", !v91);
      v91
        ? v89["setAttribute"](
            "data-tooltip",
            stripGenerationNodeHelpMarkup(v90),
          )
        : v89["removeAttribute"]("data-tooltip");
      v32?.["classList"]["toggle"]("has-generation-node-help-tip", v91);
      if (!v91) v68();
    },
    v92 = () => {
      (v68(), v35?.["remove"](), (v35 = null));
    };
  return { sync: v88, remove: v92 };
}
export function attachGenerationNodeHelpTip(
  v93,
  {
    panel: v94,
    kind: v95,
    getKey: v96,
    getModel: getModel = v96,
    getLabel: v97,
    getNodeData: v98,
    ariaLabel: v99,
  } = {},
) {
  if (!v93 || !v94) return null;
  return (
    (v93["_generationNodeHelpTip"] = createGenerationNodeHelpTipController({
      panel: v94,
      getHelpText: () =>
        getGenerationNodeHelpTooltip({
          kind: v95,
          key: typeof v96 === "function" ? v96() : "",
          model: typeof getModel === "function" ? getModel() : "",
          label: typeof v97 === "function" ? v97() : "",
          nodeData: typeof v98 === "function" ? v98() : {},
        }),
      ariaLabel: v99,
    })),
    v93["_generationNodeHelpTip"]["sync"](),
    v93["_generationNodeHelpTip"]
  );
}

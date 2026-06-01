import appStore from "../core/stores/appStore.js";
import {
  getShortcuts,
  handleShortcutKeydown,
  isRecording,
} from "../modules/shortcuts.js";
import {
  buildJumpShortcutBinding,
  normalizeCommentNoteJumpShortcut,
  parseJumpShortcutFromKeydown,
} from "../modules/commentNoteJumpShortcut.js";
import { hasActiveReadonlyTextSelection } from "../components/aigenText/readonlyTextSelection.js";
let _spaceHeld = false,
  _listeners = [];
const ALIGN_HOLD_TRIGGER_MS = 220;
let _alignHoldTimer = null,
  _alignHoldActive = false,
  _alignHoldKey = "";
const MODIFIER_ALIAS_MAP = Object["freeze"]({
    CTRL: "Ctrl",
    CONTROL: "Ctrl",
    CMD: "Ctrl",
    COMMAND: "Ctrl",
    META: "Ctrl",
    SHIFT: "Shift",
    ALT: "Alt",
    OPTION: "Alt",
  }),
  NAMED_KEY_ALIAS_MAP = Object["freeze"]({
    SPACE: "Space",
    ESC: "Escape",
    ESCAPE: "Escape",
    ENTER: "Enter",
    TAB: "Tab",
    DELETE: "Delete",
    BACKSPACE: "Backspace",
  });
function normalizeShortcutKeyPart(v0) {
  const v1 = String(v0 ?? "")["trim"]();
  if (!v1) return "";
  if (v1 === "\x20") return "Space";
  const v2 = v1["toUpperCase"]();
  if (MODIFIER_ALIAS_MAP[v2]) return MODIFIER_ALIAS_MAP[v2];
  if (NAMED_KEY_ALIAS_MAP[v2]) return NAMED_KEY_ALIAS_MAP[v2];
  if (v1["length"] === 1) return v1["toUpperCase"]();
  return v1[0]["toUpperCase"]() + v1["slice"](1)["toLowerCase"]();
}
function getPanShortcutParts() {
  const v3 = getShortcuts?.() || {},
    v4 = v3?.["pan-canvas"]?.["keys"],
    v5 = Array["isArray"](v4) && v4["length"] > 0 ? v4 : ["Space"];
  return new Set(
    v5["map"]((v6) => normalizeShortcutKeyPart(v6))["filter"](Boolean),
  );
}
function setPanShortcutHeld(v7) {
  ((_spaceHeld = v7 === true), (window["_spaceHeld"] = _spaceHeld));
  const v8 = document["getElementById"]("v2-wrap");
  if (v8) v8["style"]["cursor"] = _spaceHeld ? "var(--grab-cursor)" : "";
}
function shouldReleasePanShortcut(v9) {
  if (!_spaceHeld) return false;
  const v10 =
      v9?.["key"] === "\x20" || v9?.["code"] === "Space"
        ? "Space"
        : v9?.["key"],
    v11 = normalizeShortcutKeyPart(v10);
  if (!v11) return false;
  return getPanShortcutParts()["has"](v11);
}
function isAudioClipModeActive() {
  const v12 = document["getElementById"]("v2-wrap");
  return !!v12?.["classList"]["contains"]("is-audio-clip-mode");
}
function isEscFeatureModeActive(v13) {
  return (
    !!v13?.["matting"]?.["active"] ||
    !!v13?.["annotate"]?.["active"] ||
    isAudioClipModeActive()
  );
}
function isCommentNoteShortcutRecording() {
  return window["__commentNoteShortcutRecording"] === true;
}
function dispatchShortcutAction(v14) {
  window["dispatchEvent"](new CustomEvent("shortcut-action", { detail: v14 }));
}
function isRepeatSuppressedShortcut(v15) {
  const v16 = String(v15 || "");
  return (
    v16 === "panorama-scene-camera-create" ||
    v16["startsWith"]("panorama-scene-camera-")
  );
}
function resolveCommentNoteJumpActionId(v17, v18) {
  if (!v17 || v18?.["repeat"]) return null;
  const v19 = buildJumpShortcutBinding(parseJumpShortcutFromKeydown(v18));
  if (!v19) return null;
  const v20 = v17["nodes"] || {};
  for (const [v21, v22] of Object["entries"](v20)) {
    if (!v22 || v22["type"] !== "comment-note") continue;
    const v23 = normalizeCommentNoteJumpShortcut(v22["jumpShortcut"]),
      v24 = buildJumpShortcutBinding(v23["keys"]);
    if (!v24 || v24 !== v19) continue;
    return "comment-note-jump::" + v21;
  }
  return null;
}
function _clearAlignHoldState() {
  (_alignHoldTimer && (clearTimeout(_alignHoldTimer), (_alignHoldTimer = null)),
    (_alignHoldActive = false),
    (_alignHoldKey = ""));
}
function isEditingText() {
  const v25 = document["activeElement"],
    v26 = v25?.["tagName"];
  return (
    v26 === "INPUT" ||
    v26 === "TEXTAREA" ||
    v25?.["contentEditable"] === "true" ||
    v25?.["isContentEditable"] === true
  );
}
function isPlainCopyShortcut(v27) {
  return (
    (v27?.["ctrlKey"] || v27?.["metaKey"]) &&
    !v27?.["shiftKey"] &&
    !v27?.["altKey"] &&
    (String(v27?.["key"] || "")["toLowerCase"]() === "c" ||
      v27?.["code"] === "KeyC")
  );
}
function buildShortcutContext(
  v28,
  { audioClipModeActive: audioClipModeActive = false } = {},
) {
  const v29 = Array["isArray"](v28?.["selectedNodeIds"])
      ? v28["selectedNodeIds"]
      : [],
    v30 = v29["length"] === 1 ? v28?.["nodes"]?.[v29[0]]?.["type"] || "" : "",
    v31 = v29["length"] === 1 ? v28?.["nodes"]?.[v29[0]] || null : null,
    v32 =
      v30 === "panorama-360"
        ? v31?.["panorama360Node"] || null
        : v31?.["sceneNode"] || null;
  return {
    mattingActive: v28?.["matting"]?.["active"],
    annotateActive: v28?.["annotate"]?.["active"],
    videoKeyingActive: v28?.["videoKeying"]?.["active"],
    featureModeActive:
      !!v28?.["matting"]?.["active"] ||
      !!v28?.["annotate"]?.["active"] ||
      !!v28?.["videoClip"]?.["active"] ||
      !!v28?.["videoKeying"]?.["active"] ||
      audioClipModeActive,
    alignFeatureEnabled: v28?.["ui"]?.["alignFeatureEnabled"] !== false,
    selectedNodeType: v30,
    panoramaSceneEditing:
      (v30 === "panorama-scene" || v30 === "panorama-360") &&
      v32?.["ui"]?.["isEditing"] === true,
  };
}
function handleKeyDown(v33) {
  if (isCommentNoteShortcutRecording()) return;
  const v34 = appStore["getStateRaw"]();
  if (v33["code"] === "Escape" && isEscFeatureModeActive(v34)) {
    (v33["preventDefault"](),
      v33["stopImmediatePropagation"](),
      dispatchShortcutAction("escape-all"));
    return;
  }
  if (isEditingText()) {
    if (v33["code"] === "Escape") {
      const { pickConnectMode: v35 } = appStore["getStateRaw"]();
      v35 &&
        v35["active"] &&
        (appStore["setPickConnectMode"]({ active: false }),
        v33["preventDefault"](),
        v33["stopPropagation"]());
    }
    return;
  }
  if (isPlainCopyShortcut(v33) && hasActiveReadonlyTextSelection(document))
    return;
  const v36 = isAudioClipModeActive();
  if (v36) return;
  if (v34["videoKeying"]?.["active"] || v34["videoClip"]?.["active"]) {
    if (v33["code"] === "Escape") return;
    (v33["preventDefault"](), v33["stopPropagation"]());
    return;
  }
  if (
    v34["annotate"]?.["active"] &&
    !v33["ctrlKey"] &&
    !v33["metaKey"] &&
    !v33["altKey"] &&
    String(v33["key"] || "")["toUpperCase"]() === "T"
  ) {
    (v33["preventDefault"](),
      v33["stopPropagation"](),
      window["dispatchEvent"](
        new CustomEvent("shortcut-action", { detail: "editor-tool-text" }),
      ));
    return;
  }
  if (v33["code"] === "Escape") {
    const { pickConnectMode: v37 } = appStore["getStateRaw"]();
    if (v37 && v37["active"]) {
      (appStore["setPickConnectMode"]({ active: false }),
        v33["preventDefault"](),
        v33["stopPropagation"]());
      return;
    }
  }
  if (v33["key"] === "Control") {
    const v38 = document["getElementById"]("pick-connect-overlay");
    v38 &&
      v38["style"]["display"] !== "none" &&
      (v38["style"]["cursor"] = "var(--connect-cursor)");
  }
  if (isRecording()) return;
  const v39 = appStore["getStateRaw"](),
    v40 = buildShortcutContext(v39, { audioClipModeActive: v36 }),
    v41 = handleShortcutKeydown(v33, v40);
  if (v33["repeat"] && isRepeatSuppressedShortcut(v41)) {
    v33["preventDefault"]();
    return;
  }
  if (v41 === "pan-canvas") {
    v33["preventDefault"]();
    !v33["repeat"] && setPanShortcutHeld(true);
    return;
  }
  if (v41 === "align-feature") {
    const v42 = String(v39["ui"]?.["alignFeatureTriggerMode"] || "click"),
      v43 = v42 === "hold" || v42 === "click" || v42 === "off" ? v42 : "click";
    if (v43 === "off" || v40["alignFeatureEnabled"] === false) return;
    v33["preventDefault"]();
    if (v43 === "click") {
      dispatchShortcutAction("align-feature-toggle");
      return;
    }
    if (v33["repeat"]) return;
    (_clearAlignHoldState(),
      (_alignHoldKey = (v33["code"] || "") + "|" + (v33["key"] || "")),
      (_alignHoldTimer = setTimeout(() => {
        ((_alignHoldTimer = null),
          (_alignHoldActive = true),
          dispatchShortcutAction("align-feature-hold-start"));
      }, ALIGN_HOLD_TRIGGER_MS)));
    return;
  }
  if (v41) {
    (v33["preventDefault"](),
      window["dispatchEvent"](
        new CustomEvent("shortcut-action", { detail: v41 }),
      ));
    return;
  }
  if (!v40["featureModeActive"]) {
    const v44 = resolveCommentNoteJumpActionId(v39, v33);
    if (v44) {
      (v33["preventDefault"](), dispatchShortcutAction(v44));
      return;
    }
  }
  const v45 =
    v33["key"] === "Delete" ||
    v33["key"] === "Del" ||
    v33["key"] === "Backspace" ||
    v33["code"] === "Delete" ||
    v33["code"] === "Backspace";
  !v40["featureModeActive"] &&
    v45 &&
    (v33["preventDefault"](),
    v33["stopPropagation"](),
    v33["stopImmediatePropagation"]());
}
function handleKeyUp(v46) {
  if (_alignHoldKey) {
    const v47 = (v46["code"] || "") + "|" + (v46["key"] || ""),
      v48 =
        v47 === _alignHoldKey ||
        v46["code"] === "Tab" ||
        String(v46["key"] || "")["toLowerCase"]() === "tab";
    if (v48) {
      const v49 = _alignHoldActive;
      (_clearAlignHoldState(),
        v49 && dispatchShortcutAction("align-feature-hold-end"));
    }
  }
  shouldReleasePanShortcut(v46) && setPanShortcutHeld(false);
  if (v46["key"] === "Control") {
    const v50 = document["getElementById"]("pick-connect-overlay");
    v50 && v50["style"]["display"] !== "none" && (v50["style"]["cursor"] = "");
  }
}
export function isSpaceHeld() {
  return _spaceHeld;
}
export function addShortcutListener(v51) {
  _listeners["push"](v51);
  const v52 = (v53) => v51(v53["detail"]);
  return (
    window["addEventListener"]("shortcut-action", v52),
    () => {
      const v54 = _listeners["indexOf"](v51);
      (v54 > -1 && _listeners["splice"](v54, 1),
        window["removeEventListener"]("shortcut-action", v52));
    }
  );
}
export function initKeyboardService() {
  (window["addEventListener"]("keydown", handleKeyDown, true),
    document["addEventListener"]("keyup", handleKeyUp),
    window["addEventListener"]("blur", _clearAlignHoldState),
    (_spaceHeld = false),
    (window["_spaceHeld"] = false));
}
export function destroyKeyboardService() {
  (window["removeEventListener"]("keydown", handleKeyDown, true),
    document["removeEventListener"]("keyup", handleKeyUp),
    window["removeEventListener"]("blur", _clearAlignHoldState),
    _clearAlignHoldState(),
    setPanShortcutHeld(false));
}

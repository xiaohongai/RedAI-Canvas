let _previewEl = null,
  _previewImgEl = null,
  _activeWrapEl = null,
  _rafId = 0,
  _hasGlobalHideHooks = false,
  _hideTimerId = 0,
  _currentSrc = "",
  _pendingSrc = "";
import { ensureThumbDecoded } from "./refThumbMediaReveal.js";
function _ensurePreviewEl() {
  if (_previewEl) return _previewEl;
  const v0 = document["createElement"]("div");
  v0["className"] = "ref-hover-preview";
  const v1 = document["createElement"]("img");
  return (
    (v1["className"] = "ref-hover-preview-img"),
    (v1["alt"] = ""),
    v0["appendChild"](v1),
    document["body"]["appendChild"](v0),
    (_previewEl = v0),
    (_previewImgEl = v1),
    v0
  );
}
function _hide() {
  if (_hideTimerId) clearTimeout(_hideTimerId);
  _hideTimerId = 0;
  if (_rafId) cancelAnimationFrame(_rafId);
  ((_rafId = 0), (_activeWrapEl = null), (_pendingSrc = ""));
  if (_previewEl) _previewEl["classList"]["remove"]("is-visible");
  if (_previewImgEl) _previewImgEl["classList"]["remove"]("is-pending");
}
function _scheduleHide(v2 = 80) {
  if (_hideTimerId) clearTimeout(_hideTimerId);
  _hideTimerId = window["setTimeout"](() => {
    ((_hideTimerId = 0), _hide());
  }, v2);
}
function _schedulePosition() {
  if (_rafId) return;
  _rafId = requestAnimationFrame(() => {
    _rafId = 0;
    if (!_activeWrapEl || !_previewEl) return;
    const v3 = _activeWrapEl["getBoundingClientRect"](),
      v4 = v3["left"] + v3["width"] / 2,
      v5 = v3["top"] - 10;
    ((_previewEl["style"]["left"] = Math["round"](v4) + "px"),
      (_previewEl["style"]["top"] = Math["round"](v5) + "px"));
  });
}
function _getThumbImgSrc(v6) {
  const v7 = v6["querySelector"]("img.ref-thumb-media"),
    v8 = String(v7?.["getAttribute"]("src") || "")["trim"]();
  return v8 || "";
}
export function resolveRefThumbHoverPreviewUrl(v9) {
  const v10 = String(v9?.["dataset"]?.["previewSrc"] || "")["trim"]();
  if (v10) return v10;
  const v11 = String(v9?.["dataset"]?.["thumbSrc"] || "")["trim"]();
  if (v11) return v11;
  return _getThumbImgSrc(v9);
}
export function _resetRefThumbHoverPreviewForTests() {
  ((_previewEl = null),
    (_previewImgEl = null),
    (_activeWrapEl = null),
    (_rafId = 0),
    (_hasGlobalHideHooks = false),
    (_hideTimerId = 0),
    (_currentSrc = ""),
    (_pendingSrc = ""));
}
function _showForWrap(v12) {
  const v13 = resolveRefThumbHoverPreviewUrl(v12);
  if (!v13) {
    _hide();
    return;
  }
  (_ensurePreviewEl(), (_activeWrapEl = v12));
  if (_hideTimerId) clearTimeout(_hideTimerId);
  _hideTimerId = 0;
  if (_previewImgEl) {
    const v14 = !!_previewEl?.["classList"]["contains"]("is-visible");
    if (!v14)
      ((_currentSrc = v13),
        (_pendingSrc = ""),
        _previewImgEl["classList"]["remove"]("is-pending"),
        (_previewImgEl["src"] = v13),
        ensureThumbDecoded(v13));
    else {
      if (!_currentSrc)
        ((_currentSrc = v13),
          (_pendingSrc = ""),
          _previewImgEl["classList"]["remove"]("is-pending"),
          (_previewImgEl["src"] = v13));
      else {
        if (_currentSrc !== v13) {
          ((_currentSrc = v13), (_pendingSrc = v13));
          const v15 = v13;
          (_previewImgEl["classList"]["add"]("is-pending"),
            (_previewImgEl["src"] = v15),
            ensureThumbDecoded(v13)["then"](() => {
              if (_pendingSrc !== v15) return;
              if (!_previewImgEl) return;
              ((_pendingSrc = ""),
                _previewImgEl["classList"]["remove"]("is-pending"));
            }));
        }
      }
    }
  }
  (_previewEl["classList"]["add"]("is-visible"), _schedulePosition());
}
function _ensureGlobalHideHooks() {
  if (_hasGlobalHideHooks) return;
  ((_hasGlobalHideHooks = true),
    window["addEventListener"]("scroll", _hide, true),
    window["addEventListener"]("blur", _hide, true),
    window["addEventListener"]("wheel", _hide, {
      passive: true,
      capture: true,
    }));
}
export function bindRefThumbHoverPreview(v16) {
  if (!v16) return () => {};
  _ensureGlobalHideHooks();
  const v17 = (v18) => {
      const v19 = v18["target"]?.["closest"]?.(".ref-thumb-wrap");
      if (!v19 || !v16["contains"](v19)) return;
      _showForWrap(v19);
    },
    v20 = (v21) => {
      const v22 = v21["target"]?.["closest"]?.(".ref-thumb-wrap");
      if (!v22 || !v16["contains"](v22)) return;
      const v23 = v21["relatedTarget"];
      if (v23 && v22["contains"](v23)) return;
      if (v23 && v16["contains"](v23)) {
        _scheduleHide(80);
        return;
      }
      _hide();
    },
    v24 = () => {
      if (!_activeWrapEl) return;
      if (!v16["contains"](_activeWrapEl)) {
        _hide();
        return;
      }
      _schedulePosition();
    },
    v25 = () => _hide();
  return (
    v16["addEventListener"]("pointerover", v17),
    v16["addEventListener"]("pointerout", v20),
    v16["addEventListener"]("pointermove", v24),
    v16["addEventListener"]("pointerdown", v25, true),
    () => {
      (v16["removeEventListener"]("pointerover", v17),
        v16["removeEventListener"]("pointerout", v20),
        v16["removeEventListener"]("pointermove", v24),
        v16["removeEventListener"]("pointerdown", v25, true));
    }
  );
}

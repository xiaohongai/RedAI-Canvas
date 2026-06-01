import * as threeRuntime from "./threeRuntime.js";
import { normalizePathToLocalUrl } from "../../services/mediaRatioService.js";
function resolveColorValue(v0, v1 = new Set()) {
  const v2 = String(v0 || "")["trim"]();
  if (!v2) return "";
  const v3 = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+?)\s*)?\)$/["exec"](
    v2,
  );
  if (!v3) return v2;
  const v4 = v3[1],
    v5 = (v3[2] || "")["trim"]();
  if (v1["has"](v4)) return v5;
  v1["add"](v4);
  const v6 = resolveCssVarValue(v4, v1);
  return v6 || v5;
}
function resolveCssVarValue(v7, v8 = new Set()) {
  if (typeof window === "undefined" || !window["getComputedStyle"]) return "";
  const v9 = window["getComputedStyle"](document["documentElement"])
    ["getPropertyValue"](v7)
    ["trim"]();
  if (!v9) return "";
  return resolveColorValue(v9, v8);
}
function cssColorValue(v10, v11) {
  const v12 = resolveCssVarValue(v10);
  if (v12) return v12;
  if (typeof v11 === "string" && v11["trim"]()["startsWith"]("--"))
    return resolveCssVarValue(v11["trim"]()) || "";
  return resolveColorValue(v11);
}
function resolveSelectionAccentColor() {
  return resolveThemeColor("--blue", "--blue");
}
export function resolveThemeColor(v13, v14) {
  try {
    const v15 = cssColorValue(v13, v14);
    return v15 ? new threeRuntime["Color"](v15) : new threeRuntime["Color"]();
  } catch {
    return new threeRuntime["Color"]();
  }
}
export function resolveThemeColorValue(v16, v17) {
  return cssColorValue(v16, v17);
}
export function clamp01(v18) {
  return Math["max"](0, Math["min"](1, Number(v18) || 0));
}
export function normalizePanoramaTextureUrl(v19, v20) {
  const v21 = String(v19 || "")["trim"](),
    v22 = String(v20 || "")["trim"](),
    v23 = v21 || v22;
  if (!v23) return "";
  const v24 = v23["replace"](/\\/g, "/"),
    v25 = normalizePathToLocalUrl(v24);
  if (/^(data:|blob:)/i["test"](v25)) return v25;
  try {
    return encodeURI(decodeURI(v25));
  } catch {
    try {
      return encodeURI(v25);
    } catch {
      return v25;
    }
  }
}
export function applySelectionEmphasis(v26, v27, v28 = 0.2) {
  if (!v26 || !("emissive" in v26) || !v26["emissive"]?.["isColor"]) return;
  (v26["emissive"]["copy"](resolveSelectionAccentColor()),
    (v26["emissiveIntensity"] = v27 ? v28 : 0));
}
export function createSelectionRing(v29) {
  const v30 = v29?.["isColor"]
      ? v29["clone"]()
      : new threeRuntime["Color"](v29 || resolveSelectionAccentColor()),
    v31 = new threeRuntime["Group"](),
    v32 = (v33) =>
      new threeRuntime["MeshBasicMaterial"]({
        color: v30["clone"](),
        transparent: true,
        opacity: v33,
        side: threeRuntime["DoubleSide"],
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    v34 = new threeRuntime["Mesh"](
      new threeRuntime["CircleGeometry"](0.62, 40),
      v32(0.12),
    );
  ((v34["rotation"]["x"] = -Math["PI"] / 2),
    (v34["position"]["y"] = 0.016),
    v31["add"](v34));
  const v35 = new threeRuntime["Mesh"](
    new threeRuntime["RingGeometry"](0.5, 0.62, 40),
    v32(0.38),
  );
  ((v35["rotation"]["x"] = -Math["PI"] / 2),
    (v35["position"]["y"] = 0.02),
    v31["add"](v35));
  const v36 = new threeRuntime["Mesh"](
    new threeRuntime["RingGeometry"](0.28, 0.38, 40),
    v32(0.98),
  );
  return (
    (v36["rotation"]["x"] = -Math["PI"] / 2),
    (v36["position"]["y"] = 0.024),
    v31["add"](v36),
    (v31["visible"] = false),
    v31
  );
}

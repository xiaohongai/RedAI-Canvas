import { getShortcuts } from "../shortcuts.js";
export function formatShortcutLabel(v0) {
  const v1 = String(v0 || "")["trim"]();
  if (!v1) return "";
  return v1["replace"](/;/g, "；");
}
export function getShortcutLabelByAction(v2, v3 = "") {
  try {
    const v4 = getShortcuts?.() || {},
      v5 = v4?.[v2]?.["keys"];
    if (Array["isArray"](v5) && v5["length"] > 0)
      return formatShortcutLabel(v5["join"]("+"));
  } catch {}
  return formatShortcutLabel(v3);
}

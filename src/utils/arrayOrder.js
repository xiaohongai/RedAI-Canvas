export function isSameStringOrder(v0, v1) {
  if (!Array["isArray"](v0) || !Array["isArray"](v1)) return false;
  if (v0["length"] !== v1["length"]) return false;
  for (let v2 = 0; v2 < v0["length"]; v2 += 1) {
    if (String(v0[v2] ?? "") !== String(v1[v2] ?? "")) return false;
  }
  return true;
}

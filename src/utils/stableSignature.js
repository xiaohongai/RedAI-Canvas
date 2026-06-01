export function createStableSignature(v0) {
  if (v0 === null || v0 === undefined) return String(v0);
  if (typeof v0 !== "object") return JSON["stringify"](v0);
  if (Array["isArray"](v0))
    return (
      "[" + v0["map"]((v1) => createStableSignature(v1))["join"](",") + "]"
    );
  const v2 = Object["keys"](v0)["sort"]();
  return (
    "{" +
    v2["map"](
      (v3) => JSON["stringify"](v3) + ":" + createStableSignature(v0[v3]),
    )["join"](",") +
    "}"
  );
}

export function isValidString(v0) {
  return typeof v0 === "string" && v0["trim"]()["length"] > 0;
}
export function isValidNumber(v1, v2 = {}) {
  const { min: v3, max: v4, integer: integer = false } = v2;
  if (v1 === null || v1 === undefined || v1 === "") return false;
  const v5 = Number(v1);
  if (isNaN(v5) || !isFinite(v5)) return false;
  if (integer && !Number["isInteger"](v5)) return false;
  if (v3 !== undefined && v5 < v3) return false;
  if (v4 !== undefined && v5 > v4) return false;
  return true;
}
export function isValidEmail(v6) {
  if (!v6) return false;
  const v7 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return v7["test"](v6);
}
export function isValidUrl(v8) {
  if (!v8) return false;
  try {
    return (new URL(v8), true);
  } catch {
    return false;
  }
}
export function isValidImageUrl(v9) {
  if (!isValidUrl(v9)) return false;
  const v10 = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".avif",
    ],
    v11 = v9["toLowerCase"]();
  return (
    v10["some"]((v12) => v11["includes"](v12)) ||
    v11["startsWith"]("data:image/")
  );
}
export function isValidColor(v13) {
  if (!v13) return false;
  if (/^#[0-9A-Fa-f]{3,8}$/["test"](v13)) return true;
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+)?\s*\)$/["test"](v13))
    return true;
  if (
    /^hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?(\s*,\s*[\d.]+)?\s*\)$/["test"](v13)
  )
    return true;
  const v14 = ["transparent", "inherit", "initial", "unset"];
  if (v14["includes"](v13["toLowerCase"]())) return true;
  return false;
}
export function isEmptyObject(v15) {
  if (!v15 || typeof v15 !== "object") return true;
  return Object["keys"](v15)["length"] === 0;
}
export function isEmptyArray(v16) {
  return !Array["isArray"](v16) || v16["length"] === 0;
}
export function isBase64(v17) {
  if (!v17) return false;
  const v18 = /^[A-Za-z0-9+/]*={0,2}$/;
  return v18["test"](v17) && v17["length"] % 4 === 0;
}
export function isDataUrl(v19) {
  if (!v19) return false;
  return /^data:([\w/+-]+);base64,/["test"](v19);
}
export function isValidFileType(v20, v21) {
  if (!v20 || !v21 || !Array["isArray"](v21)) return false;
  const v22 = v20["split"](".")["pop"]()?.["toLowerCase"]();
  return v21["map"]((v23) => v23["toLowerCase"]())["includes"](v22);
}
export function isValidFileSize(v24, v25) {
  return typeof v24 === "number" && v24 > 0 && v24 <= v25;
}
export function validateNode(v26) {
  const v27 = [];
  if (!v26) return (v27["push"]("节点数据为空"), { valid: false, errors: v27 });
  return (
    (!v26["id"] || typeof v26["id"] !== "string") &&
      v27["push"]("节点缺少有效 ID"),
    (!v26["type"] || typeof v26["type"] !== "string") &&
      v27["push"]("节点缺少有效类型"),
    (typeof v26["x"] !== "number" || isNaN(v26["x"])) &&
      v27["push"]("节点\x20X\x20坐标无效"),
    (typeof v26["y"] !== "number" || isNaN(v26["y"])) &&
      v27["push"]("节点 Y 坐标无效"),
    { valid: v27["length"] === 0, errors: v27 }
  );
}
export function validateCanvasData(v28) {
  const v29 = [];
  if (!v28) return (v29["push"]("数据为空"), { valid: false, errors: v29 });
  (!v28["nodes"] || typeof v28["nodes"] !== "object") &&
    v29["push"]("缺少节点数据");
  (!v28["edges"] || !Array["isArray"](v28["edges"])) &&
    v29["push"]("缺少连线数据");
  if (v28["viewport"]) {
    const v30 = v28["viewport"];
    if (typeof v30["x"] !== "number") v29["push"]("视口 X 坐标无效");
    if (typeof v30["y"] !== "number") v29["push"]("视口 Y 坐标无效");
    if (typeof v30["zoom"] !== "number" || v30["zoom"] <= 0)
      v29["push"]("视口缩放值无效");
  }
  return { valid: v29["length"] === 0, errors: v29 };
}
export function firstNonEmpty(...v31) {
  for (const v32 of v31) {
    if (typeof v32 === "string" && v32["trim"]()) return v32;
  }
  return "";
}

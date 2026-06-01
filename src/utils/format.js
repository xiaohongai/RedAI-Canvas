export function formatFileSize(v0, v1 = 2) {
  if (v0 === 0) return "0 Bytes";
  if (!v0 || isNaN(v0)) return "Unknown";
  const v2 = 1024,
    v3 = ["Bytes", "KB", "MB", "GB", "TB", "PB"],
    v4 = Math["floor"](Math["log"](v0) / Math["log"](v2));
  return (
    parseFloat((v0 / Math["pow"](v2, v4))["toFixed"](v1)) + "\x20" + v3[v4]
  );
}
export function formatDate(v5, v6 = "YYYY-MM-DD HH:mm:ss") {
  const v7 = v5 instanceof Date ? v5 : new Date(v5);
  if (isNaN(v7["getTime"]())) return "Invalid Date";
  const v8 = (v9) => String(v9)["padStart"](2, "0"),
    v10 = {
      YYYY: v7["getFullYear"](),
      MM: v8(v7["getMonth"]() + 1),
      DD: v8(v7["getDate"]()),
      HH: v8(v7["getHours"]()),
      mm: v8(v7["getMinutes"]()),
      ss: v8(v7["getSeconds"]()),
    };
  return v6["replace"](/YYYY|MM|DD|HH|mm|ss/g, (v11) => v10[v11]);
}
export function formatRelativeTime(v12) {
  const v13 = v12 instanceof Date ? v12 : new Date(v12),
    v14 = new Date(),
    v15 = v14["getTime"]() - v13["getTime"](),
    v16 = 60 * 1000,
    v17 = 60 * v16,
    v18 = 24 * v17,
    v19 = 7 * v18,
    v20 = 30 * v18,
    v21 = 365 * v18;
  if (v15 < v16) return "刚刚";
  if (v15 < v17) return Math["floor"](v15 / v16) + " 分钟前";
  if (v15 < v18) return Math["floor"](v15 / v17) + "\x20小时前";
  if (v15 < v19) return Math["floor"](v15 / v18) + " 天前";
  if (v15 < v20) return Math["floor"](v15 / v19) + " 周前";
  if (v15 < v21) return Math["floor"](v15 / v20) + " 个月前";
  return Math["floor"](v15 / v21) + " 年前";
}
export function formatNumber(v22, v23 = 0) {
  if (v22 === null || v22 === undefined || isNaN(v22)) return "-";
  return Number(v22)["toLocaleString"]("zh-CN", {
    minimumFractionDigits: v23,
    maximumFractionDigits: v23,
  });
}
export function formatDuration(v24) {
  if (!v24 || v24 < 0) return "00:00";
  const v25 = Math["floor"](v24 / 3600),
    v26 = Math["floor"]((v24 % 3600) / 60),
    v27 = Math["floor"](v24 % 60),
    v28 = (v29) => String(v29)["padStart"](2, "0");
  if (v25 > 0) return v28(v25) + ":" + v28(v26) + ":" + v28(v27);
  return v28(v26) + ":" + v28(v27);
}
export function truncateText(v30, v31, v32 = "...") {
  if (!v30 || v30["length"] <= v31) return v30 || "";
  return v30["slice"](0, v31 - v32["length"]) + v32;
}
export function capitalize(v33) {
  if (!v33) return "";
  return v33["charAt"](0)["toUpperCase"]() + v33["slice"](1);
}
export function camelToKebab(v34) {
  return v34["replace"](/([a-z0-9])([A-Z])/g, "$1-$2")["toLowerCase"]();
}
export function kebabToCamel(v35) {
  return v35["replace"](/-([a-z])/g, (v36, v37) => v37["toUpperCase"]());
}

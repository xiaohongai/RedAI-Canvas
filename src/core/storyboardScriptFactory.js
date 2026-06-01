export const STORYBOARD_SCRIPT_NODE_TYPE = "storyboard-script";
export const STORYBOARD_SCRIPT_DEFAULT_NAME = "分镜脚本";
export const STORYBOARD_SCRIPT_DEFAULT_VIEW_MODE = "list";
export const STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE = "image";
export const STORYBOARD_SCRIPT_TEXT_PROVIDER = "volcengine";
export const STORYBOARD_SCRIPT_TEXT_PROVIDERS = Object["freeze"]([
  STORYBOARD_SCRIPT_TEXT_PROVIDER,
  "nvidia",
]);
export const STORYBOARD_SCRIPT_TEXT_MODEL =
  "volcengine/doubao-seed-2-0-pro-260215";
export const STORYBOARD_SCRIPT_DEFAULT_SIZE = Object["freeze"]({
  width: 1024,
  height: 576,
});
const STORYBOARD_SCRIPT_COLUMN_LABELS = Object["freeze"]([
  "镜号",
  "时长",
  "景别",
  "场景",
  "画面描述",
  "角色",
  "角色描述",
  "角色动作",
  "情绪",
  "角色图",
  "参考",
  "图片提示词",
  "视频提示词",
  "对白",
  "音效",
]);
export const STORYBOARD_SCRIPT_COLUMNS = Object["freeze"](
  STORYBOARD_SCRIPT_COLUMN_LABELS["map"]((v0) =>
    Object["freeze"]({ key: v0, label: v0 }),
  ),
);
export const STORYBOARD_SCRIPT_TABLE_EXPORT_MIME = "text/csv;charset=utf-8";
const STORYBOARD_SCRIPT_VIEW_MODES = new Set(["list", "card"]),
  STORYBOARD_SCRIPT_MEDIA_MODES = new Set(["image", "video"]),
  STORYBOARD_SCRIPT_SCHEMA_VERSION = "storyboard-script.v1";
export function normalizeStoryboardScriptViewMode(v1) {
  const v2 = String(v1 || "")["trim"]();
  return STORYBOARD_SCRIPT_VIEW_MODES["has"](v2)
    ? v2
    : STORYBOARD_SCRIPT_DEFAULT_VIEW_MODE;
}
export function normalizeStoryboardScriptMediaMode(v3) {
  const v4 = String(v3 || "")["trim"]();
  return STORYBOARD_SCRIPT_MEDIA_MODES["has"](v4)
    ? v4
    : STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE;
}
export function normalizeStoryboardScriptSelectedRowIndexes(v5, v6 = 0) {
  if (!Array["isArray"](v5)) return [];
  const v7 = Number["isFinite"](v6) ? Math["max"](0, Math["trunc"](v6)) : 0,
    v8 = new Set(),
    v9 = [];
  return (
    v5["forEach"]((v10) => {
      const v11 = Number(v10);
      if (!Number["isInteger"](v11) || v11 < 0 || v11 >= v7) return;
      if (v8["has"](v11)) return;
      (v8["add"](v11), v9["push"](v11));
    }),
    v9
  );
}
function parseJsonRows(v12) {
  if (typeof v12 !== "string") return v12;
  const v13 = v12["trim"]();
  if (!v13) return [];
  try {
    return JSON["parse"](v13);
  } catch {
    return [];
  }
}
function parseJsonObject(v14) {
  if (v14 && typeof v14 === "object" && !Array["isArray"](v14)) return v14;
  if (typeof v14 !== "string") return null;
  const v15 = v14["trim"]();
  if (!v15) return null;
  try {
    const v16 = JSON["parse"](v15);
    return v16 && typeof v16 === "object" && !Array["isArray"](v16)
      ? v16
      : null;
  } catch {
    return null;
  }
}
function pickRowsContainer(v17) {
  const v18 = parseJsonRows(v17);
  if (Array["isArray"](v18)) return v18;
  if (!v18 || typeof v18 !== "object") return [];
  if (Array["isArray"](v18["rows"])) return v18["rows"];
  if (Array["isArray"](v18["shots"])) return v18["shots"];
  if (Array["isArray"](v18["scenes"])) return v18["scenes"];
  if (Array["isArray"](v18["items"])) return v18["items"];
  return [];
}
function normalizeFiniteNumber(v19) {
  const v20 = Number(v19);
  return Number["isFinite"](v20) ? v20 : null;
}
function normalizePositiveDimension(v21, v22) {
  const v23 = Number(v21);
  return Number["isFinite"](v23) && v23 > 0 ? v23 : v22;
}
export function resolveStoryboardScriptResizeMinSize(v24 = {}) {
  return {
    width: normalizePositiveDimension(
      v24?.["resizeMinWidth"],
      STORYBOARD_SCRIPT_DEFAULT_SIZE["width"],
    ),
    height: normalizePositiveDimension(
      v24?.["resizeMinHeight"],
      STORYBOARD_SCRIPT_DEFAULT_SIZE["height"],
    ),
  };
}
function parseClockDurationSeconds(v25) {
  const v26 = String(v25 || "")
    ["trim"]()
    ["split"](":");
  if (v26["length"] < 2 || v26["length"] > 3) return null;
  const v27 = v26["map"]((v28) => Number(v28));
  if (v27["some"]((v29) => !Number["isFinite"](v29) || v29 < 0)) return null;
  if (v27["length"] === 2) return v27[0] * 60 + v27[1];
  return v27[0] * 3600 + v27[1] * 60 + v27[2];
}
function parseDurationSeconds(v30) {
  const v31 = normalizeFiniteNumber(v30);
  if (v31 != null) return v31;
  const v32 = String(v30 || "")["trim"]();
  if (!v32) return null;
  const v33 = parseClockDurationSeconds(v32);
  if (v33 != null) return v33;
  const v34 = [...v32["matchAll"](/\d+(?:\.\d+)?/g)]["map"]((v35) =>
    Number(v35[0]),
  );
  if (v34["length"] === 0) return null;
  const v36 = /[-~～—–至到]/["test"](v32) && v34["length"] >= 2;
  if (v36) return (v34[0] + v34[1]) / 2;
  return v34[0];
}
function getRowsTotalDurationSeconds(v37) {
  const v38 = v37["reduce"]((v39, v40) => {
    const v41 = parseDurationSeconds(
      v40?.["时长"] ?? v40?.["duration"] ?? v40?.["durationText"],
    );
    return v41 == null ? v39 : v39 + v41;
  }, 0);
  return v38 > 0 ? Number(v38["toFixed"](3)) : null;
}
export function normalizeStoryboardScriptRows(v42) {
  return pickRowsContainer(v42)
    ["filter"](
      (v43) => v43 && typeof v43 === "object" && !Array["isArray"](v43),
    )
    ["map"]((v44) => {
      const v45 =
        v44["场景"] ??
        v44["场景标签"] ??
        v44["sceneTags"] ??
        v44["scene"] ??
        v44["location"];
      return v45 == null ? { ...v44 } : { ...v44, 场景: v45 };
    });
}
function formatTableCellValue(v46) {
  if (v46 == null) return "";
  if (typeof v46 === "string") return v46;
  if (typeof v46 === "number" || typeof v46 === "boolean") return String(v46);
  try {
    return JSON["stringify"](v46);
  } catch {
    return String(v46);
  }
}
function escapeCsvCell(v47) {
  const v48 = formatTableCellValue(v47)["replace"](/\r\n?/g, "\x0a");
  if (!/[",\n]/["test"](v48)) return v48;
  return "\x22" + v48["replace"](/"/g, "\x22\x22") + "\x22";
}
export function serializeStoryboardScriptRowsToCsv(
  v49,
  v50 = STORYBOARD_SCRIPT_COLUMNS,
) {
  const v51 = normalizeStoryboardScriptRows(v49),
    v52 =
      Array["isArray"](v50) && v50["length"] ? v50 : STORYBOARD_SCRIPT_COLUMNS,
    v53 = v52["map"]((v54) => String(v54?.["key"] || "")),
    v55 = v52["map"]((v56) => v56?.["label"] || v56?.["key"] || ""),
    v57 = [
      v55["map"](escapeCsvCell)["join"](","),
      ...v51["map"]((v58) =>
        v53["map"]((v59) => escapeCsvCell(v58?.[v59]))["join"](","),
      ),
    ];
  return "\ufeff" + v57["join"]("\x0d\x0a") + "\x0d\x0a";
}
export function buildCanonicalStoryboardScriptJson(v60 = {}) {
  const v61 =
      v60 && typeof v60 === "object" && !Array["isArray"](v60)
        ? v60
        : { rows: v60 },
    v62 = parseJsonObject(v61["rawJson"]),
    v63 = Array["isArray"](v61["rows"]) ? v61["rows"] : v62 ? v62 : v61,
    v64 = normalizeStoryboardScriptRows(v63),
    v65 =
      v61["detectedIntent"] && typeof v61["detectedIntent"] === "object"
        ? v61["detectedIntent"]
        : v62?.["detectedIntent"] && typeof v62["detectedIntent"] === "object"
          ? v62["detectedIntent"]
          : {},
    v66 = { ...v65, shotCount: v64["length"] },
    v67 = getRowsTotalDurationSeconds(v64);
  if (v67 != null) v66["totalDurationSeconds"] = v67;
  else {
    const v68 = normalizeFiniteNumber(v65["totalDurationSeconds"]);
    if (v68 != null) v66["totalDurationSeconds"] = v68;
  }
  const v69 =
      String(v61["title"] || v62?.["title"] || "")["trim"]() ||
      STORYBOARD_SCRIPT_DEFAULT_NAME,
    v70 = {
      schemaVersion: STORYBOARD_SCRIPT_SCHEMA_VERSION,
      title: v69,
      detectedIntent: v66,
      rows: v64,
    },
    v71 = Array["isArray"](v61["warnings"])
      ? v61["warnings"]
      : Array["isArray"](v62?.["warnings"])
        ? v62["warnings"]
        : [];
  if (v71["length"] > 0) v70["warnings"] = [...v71];
  return v70;
}
export function serializeCanonicalStoryboardScriptJson(v72 = {}) {
  return JSON["stringify"](buildCanonicalStoryboardScriptJson(v72), null, 2);
}
export function createDefaultStoryboardScriptState(v73 = {}) {
  if (typeof v73 === "string") {
    const v74 = normalizeStoryboardScriptRows(v73),
      v75 = serializeCanonicalStoryboardScriptJson({ rawJson: v73, rows: v74 });
    return {
      version: 1,
      viewMode: STORYBOARD_SCRIPT_DEFAULT_VIEW_MODE,
      mediaMode: STORYBOARD_SCRIPT_DEFAULT_MEDIA_MODE,
      rawJson: v73,
      canonicalJson: v75,
      rows: v74,
      selectedRowIndexes: [],
      selectionMode: false,
    };
  }
  const v76 = v73 && typeof v73 === "object" ? v73 : {},
    v77 = typeof v76["rawJson"] === "string" ? v76["rawJson"] : "",
    v78 = Array["isArray"](v76["rows"]) ? v76["rows"] : v77 ? v77 : [],
    v79 = normalizeStoryboardScriptRows(v78),
    v80 = buildCanonicalStoryboardScriptJson({
      ...v76,
      rawJson: v77,
      rows: v79,
    });
  return {
    ...v76,
    version: 1,
    viewMode: normalizeStoryboardScriptViewMode(v76["viewMode"]),
    mediaMode: normalizeStoryboardScriptMediaMode(v76["mediaMode"]),
    rawJson: v77,
    canonicalJson: JSON["stringify"](v80, null, 2),
    rows: v79,
    title: v80["title"],
    detectedIntent: v80["detectedIntent"],
    selectedRowIndexes: normalizeStoryboardScriptSelectedRowIndexes(
      v76["selectedRowIndexes"],
      v79["length"],
    ),
    selectionMode: v76["selectionMode"] === true,
  };
}
export function createStoryboardScriptNodeData({
  id: v81,
  x: x = 0,
  y: y = 0,
  width: width = STORYBOARD_SCRIPT_DEFAULT_SIZE["width"],
  height: height = STORYBOARD_SCRIPT_DEFAULT_SIZE["height"],
  name: name = STORYBOARD_SCRIPT_DEFAULT_NAME,
  storyboardScript: storyboardScript = {},
} = {}) {
  const v82 = normalizePositiveDimension(
      width,
      STORYBOARD_SCRIPT_DEFAULT_SIZE["width"],
    ),
    v83 = normalizePositiveDimension(
      height,
      STORYBOARD_SCRIPT_DEFAULT_SIZE["height"],
    );
  return {
    id: v81,
    type: STORYBOARD_SCRIPT_NODE_TYPE,
    x: x,
    y: y,
    width: v82,
    height: v83,
    resizeMinWidth: v82,
    resizeMinHeight: v83,
    name: name,
    storyboardScript: createDefaultStoryboardScriptState(storyboardScript),
  };
}

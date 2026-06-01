export function isActionableFileManagerMediaKind(v0) {
  const v1 = String(v0 || "")
    ["trim"]()
    ["toLowerCase"]();
  return v1 === "image" || v1 === "video" || v1 === "audio";
}
export function buildFileManagerHistoryRecordKey({
  projectId: projectId = "",
  canvasId: canvasId = "",
  resultFingerprint: resultFingerprint = "",
} = {}) {
  return [
    String(projectId || "")["trim"](),
    String(canvasId || "")["trim"](),
    String(resultFingerprint || "")["trim"](),
  ]["join"](":");
}
export function buildFileManagerHistoryMediaKey({
  projectId: projectId = "",
  canvasId: canvasId = "",
  mediaKind: mediaKind = "",
  localPath: localPath = "",
  resultFingerprint: resultFingerprint = "",
} = {}) {
  const v2 = String(localPath || "")["trim"]();
  if (v2)
    return [
      "media",
      String(projectId || "")["trim"](),
      String(canvasId || "")["trim"](),
      String(mediaKind || "")
        ["trim"]()
        ["toLowerCase"](),
      v2,
    ]["join"](":");
  if (!String(resultFingerprint || "")["trim"]()) return "";
  return (
    "fingerprint:" +
    buildFileManagerHistoryRecordKey({
      projectId: projectId,
      canvasId: canvasId,
      resultFingerprint: resultFingerprint,
    })
  );
}
export function isFileManagerHistoryRecordVisible({
  record: v3,
  source: source = "history",
  projectId: projectId = "",
  canvasId: canvasId = "",
  activeFilter: activeFilter = "all",
  getMediaKind: getMediaKind = (v4) => v4?.["mediaKind"],
} = {}) {
  const v5 = String(projectId || "")["trim"](),
    v6 = String(canvasId || "")["trim"]();
  if (v5 && String(v3?.["projectId"] || "")["trim"]() !== v5) return false;
  if (
    source === "current-canvas" &&
    v6 &&
    String(v3?.["canvasId"] || "")["trim"]() !== v6
  )
    return false;
  const v7 = String(activeFilter || "all")["trim"]();
  return v7 === "all" || String(getMediaKind(v3) || "")["trim"]() === v7;
}
export function getFileManagerSelectionAfterClick({
  current: current = [],
  recordId: recordId = "",
  shiftKey: shiftKey = false,
  actionable: actionable = true,
} = {}) {
  const v8 = String(recordId || ""),
    v9 = new Set(
      (Array["isArray"](current) ? current : [])["map"]((v10) =>
        String(v10 || ""),
      ),
    );
  if (!v8 || !actionable) return Array["from"](v9);
  if (shiftKey) {
    if (v9["has"](v8)) v9["delete"](v8);
    else v9["add"](v8);
    return Array["from"](v9);
  }
  return [v8];
}
export function getFileManagerMenuActions({
  records: records = [],
  canRevealInFolder: canRevealInFolder = false,
  getMediaKind: getMediaKind = (v11) => v11?.["mediaKind"],
  isActionableRecord: isActionableRecord = (v12) =>
    isActionableFileManagerMediaKind(getMediaKind(v12)),
} = {}) {
  const v13 = (Array["isArray"](records) ? records : [])["filter"](
    isActionableRecord,
  );
  if (v13["length"] === 0) return [];
  const v14 = ["add-to-canvas"];
  if (v13["length"] === 1) {
    const v15 = String(getMediaKind(v13[0]) || "")
      ["trim"]()
      ["toLowerCase"]();
    if (v15 === "image" || v15 === "video") v14["push"]("fullscreen");
    if (canRevealInFolder) v14["push"]("reveal");
  }
  return (v14["push"]("delete"), v14);
}

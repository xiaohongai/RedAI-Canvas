import { clipboard } from "electron";
function readClipboardCustomFileReferences({
  fileReferencesFormat: v0,
  normalizeClipboardFileReferences: v1,
}) {
  try {
    const v2 = clipboard["readBuffer"](v0);
    if (!v2 || v2["length"] === 0) return [];
    const v3 = JSON["parse"](v2["toString"]("utf8"));
    return v1(v3?.["files"] || []);
  } catch {
    return [];
  }
}
export function registerClipboardIpcHandlers({
  ipcMain: v4,
  fileReferencesFormat: v5,
  createClipboardNativeImage: v6,
  normalizeClipboardFileReferences: v7,
  parseClipboardFileReferencesFromText: v8,
}) {
  (v4["handle"]("clipboard:writeImage", (v9, v10 = {}) => {
    try {
      const v11 = v6(v10 || {});
      if (!v11 || v11["isEmpty"]()) return { ok: false, reason: "no-image" };
      const v12 = String(
        v10?.["text"] || v10?.["absolutePath"] || v10?.["localPath"] || "",
      )["trim"]();
      if (v12) clipboard["write"]({ image: v11, text: v12 });
      else clipboard["writeImage"](v11);
      return { ok: true, mimeType: "image/png" };
    } catch (v13) {
      return {
        ok: false,
        reason: "write-failed",
        error: String(v13?.["message"] || v13),
      };
    }
  }),
    v4["handle"]("clipboard:readImage", () => {
      try {
        const v14 = clipboard["readImage"]();
        if (!v14 || v14["isEmpty"]()) return { ok: false, reason: "no-image" };
        return {
          ok: true,
          mimeType: "image/png",
          dataBase64: v14["toPNG"]()["toString"]("base64"),
        };
      } catch (v15) {
        return {
          ok: false,
          reason: "read-failed",
          error: String(v15?.["message"] || v15),
        };
      }
    }),
    v4["handle"]("clipboard:writeFileReferences", (v16, v17 = {}) => {
      try {
        const v18 = v7(v17?.["paths"] || v17?.["files"] || []);
        if (v18["length"] === 0)
          return { ok: false, reason: "no-files", files: [] };
        const v19 = v18["map"]((v20) => v20["path"]);
        try {
          clipboard["writeBuffer"](
            v5,
            Buffer["from"](
              JSON["stringify"]({ version: 1, files: v19 }),
              "utf8",
            ),
          );
        } catch {}
        return (
          clipboard["writeText"](v19["join"]("\x0a")),
          { ok: true, files: v18 }
        );
      } catch (v21) {
        return {
          ok: false,
          reason: "write-failed",
          error: String(v21?.["message"] || v21),
          files: [],
        };
      }
    }),
    v4["handle"]("clipboard:readFileReferences", () => {
      try {
        let v22 = readClipboardCustomFileReferences({
          fileReferencesFormat: v5,
          normalizeClipboardFileReferences: v7,
        });
        return (
          v22["length"] === 0 && (v22 = v8(clipboard["readText"]())),
          { ok: v22["length"] > 0, files: v22 }
        );
      } catch (v23) {
        return {
          ok: false,
          reason: "read-failed",
          error: String(v23?.["message"] || v23),
          files: [],
        };
      }
    }),
    v4["handle"]("clipboard:writeText", (v24, v25 = {}) => {
      try {
        return (
          clipboard["writeText"](String(v25?.["text"] || "")),
          { ok: true }
        );
      } catch (v26) {
        return {
          ok: false,
          reason: "write-failed",
          error: String(v26?.["message"] || v26),
        };
      }
    }),
    v4["handle"]("clipboard:readText", () => {
      try {
        return { ok: true, text: clipboard["readText"]() };
      } catch (v27) {
        return {
          ok: false,
          reason: "read-failed",
          error: String(v27?.["message"] || v27),
          text: "",
        };
      }
    }));
}

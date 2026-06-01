import { mkdirSync } from "node:fs";
import { shell } from "electron";
export function registerFileIpcHandlers({
  ipcMain: v0,
  importAssetToLibrary: v1,
  createLocalPreviewUrl: v2,
  resolveLocalVirtualPath: v3,
  resolveKnownFolder: v4,
  openExternalUrl: v5,
  selectDirectory: v6,
}) {
  (v0["handle"]("asset:import", async (v7, v8) => {
    return await v1(v8 || {});
  }),
    v0["handle"]("file:importLocalFile", async (v9, v10) => {
      return await v1(v10 || {});
    }),
    v0["handle"]("file:getLocalPreviewUrl", (v11, v12) => {
      const v13 = v2(v12 || {});
      return (
        console["log"]("[drag-import-prof]\x20main:preview-url:created", {
          t: Date["now"](),
          name: v12?.["name"] || "",
          url: v13,
        }),
        { url: v13 }
      );
    }),
    v0["handle"]("dialog:selectDirectory", async (v14, v15) => {
      if (typeof v6 !== "function") throw new Error("当前环境不支持选择目录");
      return await v6(v15 || {});
    }),
    v0["handle"]("shell:showItemInFolder", (v16, v17) => {
      const v18 = v3(v17?.["localPath"] || "");
      if (!v18) throw new Error("不允许定位该路径");
      return (shell["showItemInFolder"](v18), { ok: true });
    }),
    v0["handle"]("shell:openKnownFolder", (v19, v20) => {
      const v21 = v4(v20?.["kind"] || "");
      if (!v21) throw new Error("不允许打开该目录");
      return (
        mkdirSync(v21, { recursive: true }),
        void shell["openPath"](v21),
        { ok: true }
      );
    }),
    v0["handle"]("shell:openExternal", (v22, v23) => {
      const v24 = v5(v23?.["url"] || v23);
      if (!v24["ok"]) throw new Error(v24["error"] || "不允许打开该外部链接");
      return v24;
    }));
}

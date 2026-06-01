export function bindVideoDownloadAction(v0) {
  const {
      toolbarEl: v1,
      fetchRemoteBlob: v2,
      _guessDownloadName: v3,
      _triggerHrefDownload: v4,
      _isProbablyLocalUrl: v5,
      _getCurrentVideoUrl: v6,
    } = v0,
    v7 = v1["querySelector"](".act-download");
  v7 &&
    v7["addEventListener"]("click", async (v8) => {
      v8["stopPropagation"]();
      const v9 = v6();
      if (!v9) {
        alert("没有可下载的视频");
        return;
      }
      const v10 = v3(v9);
      if (v5(v9)) {
        v4(v9, v10);
        return;
      }
      try {
        const v11 = new AbortController(),
          v12 = setTimeout(() => v11["abort"](), 20000),
          v13 = await v2(v9, { signal: v11["signal"] });
        clearTimeout(v12);
        const v14 = window["URL"]["createObjectURL"](v13);
        (v4(v14, v10),
          setTimeout(() => window["URL"]["revokeObjectURL"](v14), 1500));
      } catch {
        v4(v9, v10);
      }
    });
}

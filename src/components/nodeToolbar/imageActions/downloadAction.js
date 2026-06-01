export function bindImageDownloadAction(v0) {
  const {
      toolbarEl: v1,
      getNodeData: v2,
      getImage: v3,
      localPathToUrl: v4,
      fetchRemoteBlob: v5,
    } = v0,
    v6 = v1["querySelector"](".act-download");
  v6 &&
    v6["addEventListener"]("click", async (v7) => {
      v7["stopPropagation"]();
      const v8 = v2();
      if (!v8) {
        alert("节点数据已丢失");
        return;
      }
      const v9 = (v10) =>
          String(v10 || "")
            ["trim"]()
            ["replace"](/[\\/:*?"<>|]/g, "_"),
        v11 = (v12) => {
          const v13 = String(v12 || "")["trim"]();
          if (!v13) return "";
          const v14 = v13["split"]("#")[0]["split"]("?")[0],
            v15 = v14["split"]("/")["pop"]() || "";
          return v15;
        },
        v16 = (v17) => {
          const v18 = String(v17 || "")["trim"]();
          if (!v18) return "";
          if (
            v18["startsWith"]("http://") ||
            v18["startsWith"]("https://") ||
            v18["startsWith"]("blob:") ||
            v18["startsWith"]("data:")
          )
            return v18;
          if (v18["startsWith"]("/")) return v18;
          return v4(v18) || "/" + v18["replace"](/^\/+/, "");
        },
        v19 = (v20) => {
          const v21 = String(v20 || "")["trim"]();
          if (!v21) return false;
          if (v21["startsWith"]("/")) return true;
          try {
            const v22 = new URL(v21, window["location"]["href"]);
            return v22["origin"] === window["location"]["origin"];
          } catch {
            return false;
          }
        },
        v23 = (v24) => {
          const v25 = v9(v8["fileName"]);
          if (v25) return v25;
          const v26 = v9(v11(v24));
          if (v26) return v26["includes"](".") ? v26 : v26 + ".png";
          return "image_" + Date["now"]() + ".png";
        },
        v27 = (v28, v29) => {
          const v30 = document["createElement"]("a");
          ((v30["href"] = v28),
            (v30["download"] = v29),
            (v30["rel"] = "noopener"),
            document["body"]["appendChild"](v30),
            v30["click"](),
            v30["remove"]());
        },
        v31 = v16(v8["localPath"]) || (v19(v8["src"]) ? v8["src"] : ""),
        v32 =
          v8["sourceUrl"] ||
          v8["src"] ||
          v8["resultUrl"] ||
          v8["imageUrl"] ||
          v8["thumbUrl"],
        v33 = v23(v31 || v32);
      if (!v31 && !v32 && !v8["sourceId"]) {
        alert("没有可下载的图像");
        return;
      }
      if (v31) {
        v27(v31, v33);
        return;
      }
      if (v8["sourceId"])
        try {
          const v34 = await v3(v8["sourceId"]);
          if (v34) {
            const v35 = window["URL"]["createObjectURL"](v34);
            (v27(v35, v33),
              setTimeout(() => window["URL"]["revokeObjectURL"](v35), 1000));
            return;
          }
        } catch {}
      if (!v32) {
        alert("没有可下载的图像");
        return;
      }
      if (v19(v32)) {
        v27(v32, v33);
        return;
      }
      try {
        const v36 = new AbortController(),
          v37 = setTimeout(() => v36["abort"](), 15000),
          v38 = await v5(v32, { signal: v36["signal"] });
        clearTimeout(v37);
        const v39 = window["URL"]["createObjectURL"](v38);
        (v27(v39, v33),
          setTimeout(() => window["URL"]["revokeObjectURL"](v39), 1000));
      } catch {
        v27(v32, v33);
      }
    });
}

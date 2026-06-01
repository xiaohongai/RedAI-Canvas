export function bindVideoSmartClipAction(v0) {
  const {
      toolbarEl: v1,
      nodeData: v2,
      store: v3,
      findAvailablePosition: v4,
      detectScenes: v5,
      getNodeSpawnPrefs: v6,
      buildSourceMediaNodePayload: v7,
      getAutoMediaSizeByShortSide: v8,
      _getLatestNodeData: v9,
    } = v0,
    v10 = v1["querySelector"](".act-smart-clip");
  v10 &&
    v10["addEventListener"]("click", async (v11) => {
      v11["stopPropagation"]();
      const v12 = v9(),
        v13 = v12["src"] || v12["videoUrl"];
      if (!v13) {
        window["showToast"]?.("视频源无效", "error");
        return;
      }
      const v14 = v10["querySelector"]("svg");
      if (v14) v14["classList"]["add"]("v2-spinning");
      try {
        window["showToast"]?.("正在分析视频场景...", "info");
        const v15 = await v5({
          videoUrl: v13,
          provider: "grsai",
          sensitivity: 0.5,
        });
        if (v15["sceneCount"] <= 1) {
          window["showToast"]?.("未检测到场景变化", "info");
          return;
        }
        const { direction: v16, spacing: v17, avoidOverlap: v18 } = v6(),
          v19 = v3["getState"]()["nodes"][v2["id"]];
        if (!v19) {
          window["showToast"]?.("找不到原节点", "error");
          return;
        }
        const v20 = [];
        let v21 = 0;
        for (let v22 = 0; v22 < v15["sceneCount"]; v22++) {
          const v23 =
              v22 < v15["sceneChanges"]["length"]
                ? v15["sceneChanges"][v22]
                : 100,
            v24 = v16 === "down" ? "down" : "right",
            v25 = Number(v19["x"]) || 0,
            v26 = Number(v19["y"]) || 0,
            v27 = Number(v19["width"]) || 512,
            v28 = Number(v19["height"]) || 288,
            v29 = v8(v27, v28),
            v30 = v25 + v27 + v17,
            v31 =
              v24 === "down"
                ? v26 + v28 + v17 * (v22 + 1)
                : v26 + Math["round"]((v28 - v29["height"]) / 2),
            v32 = v18
              ? v4(
                  v3["getState"]()["nodes"] || {},
                  v30,
                  v31,
                  v29["width"],
                  v29["height"],
                  v17,
                  v24,
                )
              : { x: v30, y: v31 },
            v33 =
              "source-video-scene-" +
              Date["now"]() +
              "-" +
              v22 +
              "-" +
              Math["random"]()["toString"](36)["slice"](2, 6);
          (v3["addNode"](
            v7({
              id: v33,
              type: "source-video",
              name: "场景 " + (v22 + 1),
              src: v12["src"],
              localPath: v12["localPath"],
              clipStart: v21,
              clipEnd: v23,
              x: v32["x"],
              y: v32["y"],
              width: v29["width"],
              height: v29["height"],
              needsAutoResize: false,
            }),
          ),
            v20["push"](v33),
            (v21 = v23));
        }
        v20["length"] > 0 &&
          (v3["setSelectedNodes"](v20),
          window["v2FocusOnNodes"] &&
            window["v2FocusOnNodes"]([v19["id"], ...v20]),
          window["showToast"]?.(
            "✅ 已创建 " + v20["length"] + "\x20个场景节点",
            "success",
          ));
      } catch (v34) {
        (console["error"]("智能剪辑失败:", v34),
          window["showToast"]?.("智能剪辑失败，请重试", "error"));
      } finally {
        if (v14) v14["classList"]["remove"]("v2-spinning");
      }
    });
}

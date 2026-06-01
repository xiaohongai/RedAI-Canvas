export function bindVideoExtractKeyframesAction(v0) {
  const {
      toolbarEl: v1,
      nodeData: v2,
      getStateSnapshot: v3,
      VideoClipController: v4,
      VideoKeyingController: v5,
      runSmartClipKeyframeExtractionFromVideoNode: v6,
    } = v0,
    v7 = v1?.["querySelector"]?.(".act-extract-keyframes");
  if (!v7) return;
  const v8 = "提取关键帧",
    v9 = v7["querySelector"]?.("svg"),
    v10 = (v11, v12 = v8) => {
      ((v7["dataset"]["loading"] = v11 ? "true" : "false"),
        (v7["disabled"] = !!v11),
        v7["setAttribute"]?.("aria-busy", v11 ? "true" : "false"),
        v7["setAttribute"]?.("data-tooltip", v12),
        v9?.["classList"]?.["toggle"]?.("v2-spinning", !!v11));
    };
  v7["addEventListener"]("click", async (v13) => {
    v13["stopPropagation"]();
    if (v7["dataset"]["loading"] === "true") return;
    const v14 = v3();
    if (v14["videoKeying"]?.["active"]) {
      window["showToast"]?.("请先退出当前视频编辑模式", "info");
      return;
    }
    if (v14["videoClip"]?.["active"]) {
      window["showToast"]?.("请先退出裁剪视频模式", "info");
      return;
    }
    if (typeof v6 !== "function") {
      window["showToast"]?.("提取关键帧功能不可用", "error");
      return;
    }
    (v4?.["exit"]?.({ silent: true }),
      v5?.["exit"]?.({ silent: true }),
      v10(true, "提取关键帧：准备中"),
      window["showToast"]?.(
        "⏳\x20正在智能剪辑：分析场景并提取关键帧...",
        "info",
      ));
    try {
      const v15 = await v6({
        nodeId: v2?.["id"],
        onProgress: (v16) => {
          if (!v16?.["text"]) return;
          v10(true, "提取关键帧：" + v16["text"]);
        },
      });
      if (!v15?.["ok"]) {
        window["showToast"]?.(
          v15?.["reason"] === "no-segments"
            ? "未检测到场景变化"
            : "智能剪辑没有生成有效关键帧",
          v15?.["reason"] === "no-segments" ? "info" : "error",
        );
        return;
      }
      window["showToast"]?.(
        "✅ 智能剪辑完成，已生成 " + v15["nodeIds"]["length"] + " 张关键帧",
        "success",
      );
    } catch (v17) {
      const v18 =
        v17 instanceof Error ? v17["message"] : String(v17 || "智能剪辑失败");
      window["showToast"]?.("❌ 提取关键帧失败: " + v18, "error");
    } finally {
      v10(false);
    }
  });
}

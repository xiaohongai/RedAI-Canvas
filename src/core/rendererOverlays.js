export function createContextMenuEl() {
  const v0 = document["createElement"]("div");
  return (
    (v0["id"] = "v2-context-menu"),
    (v0["dataset"]["uiStop"] = "1"),
    Object["assign"](v0["style"], {
      position: "absolute",
      display: "none",
      background: "var(--bg-context-menu)",
      border: "1px solid var(--white-10)",
      backdropFilter: "blur(12px)",
      borderRadius: "8px",
      padding: "6px",
      boxShadow: "0 4px 12px var(--black-50)",
      zIndex: "2000",
      minWidth: "160px",
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    }),
    v0
  );
}
export function renderContextMenu(v1, v2) {
  if (!v2 || !v2["visible"]) {
    ((v1["style"]["display"] = "none"), v1["replaceChildren"]());
    return;
  }
  ((v1["style"]["display"] = "flex"),
    (v1["style"]["left"] = v2["x"] + "px"),
    (v1["style"]["top"] = v2["y"] + "px"));
  if (v1["children"]["length"] > 0) return;
  const v3 = document["createElement"]("div");
  ((v3["textContent"] = "菜单"),
    Object["assign"](v3["style"], {
      fontSize: "11px",
      color: "var(--text-muted)",
      padding: "4px 8px",
      borderBottom: "1px solid var(--white-08)",
      marginBottom: "4px",
      userSelect: "none",
    }),
    v1["appendChild"](v3));
  const v4 = document["createElement"]("button");
  ((v4["dataset"]["cmd"] = "delete_nodes"),
    (v4["textContent"] = "删除"),
    Object["assign"](v4["style"], {
      background: "transparent",
      border: "none",
      color: "var(--text-danger)",
      padding: "8px\x2012px",
      cursor: "pointer",
      textAlign: "left",
      borderRadius: "4px",
      fontSize: "13px",
    }),
    v1["appendChild"](v4));
}
export function createPickConnectBannerEl() {
  const v5 = document["createElement"]("div");
  return (
    (v5["id"] = "v2-pick-connect-banner"),
    (v5["className"] = "v2-pick-connect-banner"),
    (v5["textContent"] = "点击目标节点完成连接"),
    Object["assign"](v5["style"], {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "var(--bg-panel-card)",
      border: "1px solid var(--blue-30)",
      borderRadius: "8px",
      padding: "10px\x2020px",
      color: "var(--text-primary)",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 4px 12px var(--black-50)",
      zIndex: "1000",
      display: "none",
      pointerEvents: "none",
    }),
    v5
  );
}
export function renderPickConnectBanner(v6, v7) {
  v6["style"]["display"] = v7?.["active"] ? "block" : "none";
}

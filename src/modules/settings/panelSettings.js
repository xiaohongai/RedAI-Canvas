function getSettingsPanelElements() {
  return {
    settingsOverlay: document["getElementById"]("settingsOverlay"),
    avatarMenu: document["getElementById"]("avatarMenu"),
  };
}
function isSettingsPanelOpen(v0) {
  return !!v0 && v0["style"]["display"] === "block";
}
export function openSettingsPanel() {
  const { settingsOverlay: v1, avatarMenu: v2 } = getSettingsPanelElements();
  if (!v1) return false;
  return (
    (v1["style"]["display"] = "block"),
    v2?.["classList"]["remove"]("open"),
    true
  );
}
export function closeSettingsPanel() {
  const { settingsOverlay: v3 } = getSettingsPanelElements();
  if (!v3) return false;
  return ((v3["style"]["display"] = "none"), true);
}
export function toggleSettingsPanel() {
  const { settingsOverlay: v4 } = getSettingsPanelElements();
  if (!v4) return false;
  return isSettingsPanelOpen(v4) ? closeSettingsPanel() : openSettingsPanel();
}
export function initSettingsPanelEvents() {
  const v5 = document["getElementById"]("btnOpenSettings"),
    v6 = document["getElementById"]("btnSettingsClose"),
    v7 = document["getElementById"]("settingsOverlay");
  if (!v5 || !v7) return;
  (v5["addEventListener"]("click", (v8) => {
    (v8["stopPropagation"](), openSettingsPanel());
  }),
    v6?.["addEventListener"]("click", () => {
      closeSettingsPanel();
    }),
    v7["addEventListener"]("click", (v9) => {
      v9["target"] === v7 && closeSettingsPanel();
    }));
  const v10 = document["querySelectorAll"](".settings-nav-item"),
    v11 = document["querySelectorAll"](".settings-pane");
  v10["forEach"]((v12) => {
    v12["addEventListener"]("click", () => {
      (v10["forEach"]((v13) => v13["classList"]["remove"]("active")),
        v11["forEach"]((v14) => v14["classList"]["remove"]("active")),
        v12["classList"]["add"]("active"));
      const v15 = "pane-" + v12["dataset"]["pane"],
        v16 = document["getElementById"](v15);
      if (v16) v16["classList"]["add"]("active");
    });
  });
}

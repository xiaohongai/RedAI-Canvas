export function installAppMenu({
  app: v0,
  Menu: v1,
  shell: v2,
  getMainWindow: v3,
  logDir: v4,
  restartBackendAndReload: v5,
  stopSpawnedServer: v6,
} = {}) {
  if (v0?.["isPackaged"]) {
    v1["setApplicationMenu"](null);
    return;
  }
  const v7 = [
    {
      label: "Dev",
      submenu: [
        {
          label: "Reload Canvas",
          accelerator: "F5",
          click: () => v3()?.["webContents"]["reload"](),
        },
        {
          label: "Hard Reload Canvas",
          accelerator: "CommandOrControl+Shift+R",
          click: () => v3()?.["webContents"]["reloadIgnoringCache"](),
        },
        {
          label: "Reload Preload + Canvas",
          accelerator: "CommandOrControl+R",
          click: () => v3()?.["webContents"]["reload"](),
        },
        { type: "separator" },
        {
          label: "Restart\x20Backend\x20and\x20Reload",
          click: () => {
            void v5();
          },
        },
        {
          label: "Relaunch\x20Electron\x20Main",
          click: () => {
            (v6(), v0["relaunch"](), v0["exit"](0));
          },
        },
        { type: "separator" },
        {
          label: "Toggle DevTools",
          accelerator: "F12",
          click: () => v3()?.["webContents"]["toggleDevTools"](),
        },
        {
          label: "Open Logs Folder",
          click: () => {
            void v2["openPath"](v4);
          },
        },
      ],
    },
  ];
  v1["setApplicationMenu"](v1["buildFromTemplate"](v7));
}

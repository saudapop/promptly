const path = require("path");
const isDev = require("electron-is-dev");
const { ipcMain } = require("electron");
const { menubar } = require("menubar");

const mb = menubar({
  browserWindow: {
    frame: false,
    transparent: true,
    width: 400,
    height: 100 + 12,
    webPreferences: { nodeIntegration: true },
    alwaysOnTop: isDev,
  },
  icon: path.join(__dirname, "dock_icons/logoTemplate.png"),
  preloadWindow: true,
  index: isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`,
});

mb.on("ready", () => {
  mb.showWindow();
});

ipcMain.on("update-title-bar", (_, title) => {
  mb.tray.setTitle(title);
});

mb.on("after-create-window", () => {
  if (isDev) {
    mb.window.openDevTools();
  }
});

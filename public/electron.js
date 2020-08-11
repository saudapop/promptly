const os = require("os");
const path = require("path");
const isDev = require("electron-is-dev");
const { ipcMain, BrowserWindow } = require("electron");
const { menubar } = require("menubar");

const OS = os.platform();
const DARWIN = "darwin";

const mb = menubar({
  browserWindow: {
    frame: false,
    transparent: true,
    width: 400,
    height: 100 + 12,
    webPreferences: { nodeIntegration: true },
    alwaysOnTop: isDev,
    resizable: false,
  },
  icon: path.join(
    __dirname,
    OS === DARWIN ? "dock_icons/logoTemplate.png" : "icon.png"
  ),
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
    mb.addDevToolsExtension(
      path.join(
        os.homedir(),
        "/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.7.0_0"
      )
    );
    mb.window.openDevTools();
  }
});

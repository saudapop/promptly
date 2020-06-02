const { app, BrowserWindow } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
let mainWindow;

const { menubar } = require("menubar");
const { autoUpdater } = require("electron-updater");

const mb = menubar({
  browserWindow: {
    width: 400,
    height: 100,
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

autoUpdater.checkForUpdatesAndNotify();

mb.on("after-create-window", () => {
  if (isDev) {
    mb.window.openDevTools();
  }
});

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 400,
//     height: 100,
//     webPreferences: { nodeIntegration: true },
//   });
//   mainWindow.loadURL(
//     isDev
//       ? "http://localhost:3000"
//       : `file://${path.join(__dirname, "../build/index.html")}`
//   );

//   mainWindow.on("close", (event) => {
//     if (process.platform !== "darwin") {
//       event.preventDefault();
//       mainWindow.hide();
//     } else {
//       mainWindow = null;
//     }
//   });
// }

// app.on("ready", createWindow);

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") {
//     app.quit();
//   }
// });

// app.on("activate", () => {
//   if (mainWindow === null) {
//     createWindow();
//   } else {
//     mainWindow.show();
//   }
// });

// app.on("quit", () => {
//   app.quit();
// });

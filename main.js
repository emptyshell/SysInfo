const path = require("path");
const os = require("os");
const { app, Menu, ipcMain, shell, ipcRenderer } = require("electron");
const Store = require("./Store");
const { settings } = require("cluster");
const MainWindow = require("./MainWindow");
const AboutWindow = require("./AboutWindow");
const AppTray = require("./AppTray");

process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let aboutWindow;
let tray;

// Init Store and defaults
const store = new Store({
  configName: "user-settings",
  defaults: {
    settings: {
      cpuOverloadWarning: 95,
      memOverloadWarning: 95,
      alertFrequencyMinutes: 3,
    },
  },
});

function createMainWindow() {
  mainWindow = new MainWindow("app/index.html", isDev);
}

function createAboutWindow() {
  aboutWindow = new AboutWindow("app/about.html");
}

app.on("ready", () => {
  createMainWindow();

  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.send("settings:get", store.get("settings"));
  });

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }

    return true;
  });

  tray = new AppTray({
    icon: path.join(__dirname, "assets", "icons", "tray_icon.png"),
    mainWindow,
    app,
  });

  mainWindow.on("closed", () => (mainWindow = null));
});

const menu = [
  {
    label: "File",
    role: "fileMenu",
  },
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            {
              role: "reload",
            },
            {
              role: "forcereload",
            },
            {
              type: "separator",
            },
            {
              role: "toggleDevTools",
            },
          ],
        },
      ]
    : []),
  ...(isMac
    ? [{ label: "About", click: createAboutWindow }]
    : [
        {
          label: "Help",
          submenu: [{ label: "About", click: createAboutWindow }],
        },
      ]),
];

ipcMain.on("settings:set", (e, options) => {
  store.set("settings", options);
  mainWindow.webContents.send("settings:get", store.get("settings"));
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

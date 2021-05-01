const path = require("path");
const os = require("os");
const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  shell,
  ipcRenderer,
  Tray,
} = require("electron");
const Store = require("./Store");
const { settings } = require("cluster");

process.env.NODE_ENV = "development";

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
  mainWindow = new BrowserWindow({
    width: isDev ? 700 : 500,
    height: 540,
    title: "Image Shrink",
    icon: `${__dirname}/assets/icons/icon.svg`,
    resizable: isDev,
    opacity: 0.95,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on("dom-ready", () => {
    mainWindow.webContents.send("settings:get", store.get("settings"));
  });

  mainWindow.loadFile("app/index.html");
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 250,
    title: "About Image Shrink",
    opacity: 0.95,
    icon: `${__dirname}/assets/icons/icon.svg`,
    resizable: false,
  });

  aboutWindow.removeMenu();

  aboutWindow.loadFile("app/about.html");
}

app.on("ready", () => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  const icon = path.join(__dirname, "assets", "icons", "icon.png");
  tray = new Tray(icon);

  tray.on("click", () => {
    if (mainWindow.isVisible() === true) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
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

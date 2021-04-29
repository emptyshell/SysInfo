const path = require("path");
const os = require("os");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const log = require("electron-log");

process.env.NODE_ENV = "development";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let aboutWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: isDev ? 1180 : 880,
    height: 450,
    title: "Image Shrink",
    icon: `${__dirname}/assets/icons/icon.svg`,
    resizable: isDev,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile("app/index.html");
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 300,
    height: 250,
    title: "About Image Shrink",
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

ipcMain.on("image:minimize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageshrink");
  //   shrinkImage(options);
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

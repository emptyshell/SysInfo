const { BrowserWindow } = require("electron");

class MainWindow extends BrowserWindow {
  constructor(file, isDev) {
    super({
      width: isDev ? 700 : 500,
      height: 540,
      title: "SysInfo",
      icon: `${__dirname}/assets/icons/icon.png`,
      resizable: isDev,
      opacity: 0.95,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    if (isDev) {
      this.webContents.openDevTools();
    }

    this.loadFile(file);
  }
}

module.exports = MainWindow;

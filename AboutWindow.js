const { BrowserWindow } = require("electron");

class AboutWindow extends BrowserWindow {
  constructor(file) {
    super({
      width: 300,
      height: 250,
      title: "About SysInfo",
      opacity: 0.95,
      icon: `${__dirname}/assets/icons/icon.svg`,
      resizable: false,
    });

    this.removeMenu();
    this.loadFile(file);
  }
}

module.exports = AboutWindow;

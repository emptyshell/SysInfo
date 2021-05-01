const { Tray } = require("electron");

class AppTray extends Tray {
  constructor(options) {
    super(options.icon);

    this.on("click", () => {
      if (options.mainWindow.isVisible() === true) {
        options.mainWindow.hide();
      } else {
        options.mainWindow.show();
      }
    });

    this.on("right-click", () => {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: "Quit",
          click: () => {
            options.app.isQuitting = true;
            options.app.quit();
          },
        },
      ]);

      this.popUpContextMenu(contextMenu);
    });
  }
}

module.exports = AppTray;

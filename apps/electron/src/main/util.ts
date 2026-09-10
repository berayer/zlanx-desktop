import { app, BrowserWindow, ipcMain } from "electron";

export const is = {
  dev: !app.isPackaged,
};

export const optimizer = {
  watchWindowShortcuts: (
    window: BrowserWindow,
    shortcutOptions?: {
      escToCloseWindow?: boolean;
      zoom?: boolean;
    },
  ) => {
    if (!window) return;
    const { webContents } = window;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          // Ignore CommandOrControl + R
          if (input.code === "KeyR" && (input.control || input.meta)) event.preventDefault();
          if (
            input.code === "KeyI" &&
            ((input.alt && input.meta) || (input.control && input.shift))
          ) {
            event.preventDefault();
          }
        } else {
          // Toggle devtool(F12)
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          // Disable zoom in
          if (input.code === "Minus" && (input.control || input.meta)) event.preventDefault();
          // Disable zoom out
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFrameLessWindowIpc: () => {
    ipcMain.on("win:invoke", (event, action) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            // cSpell:words unmaximize
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  },
};

export const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux",
};

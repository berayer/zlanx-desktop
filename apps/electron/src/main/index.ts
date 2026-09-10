import { app, shell, BrowserWindow, ipcMain, session } from "electron";
import { existsSync } from "fs";
import { join } from "path";
import { is, optimizer, platform } from "@main/util";

// 开发环境下与 website 共用工作区根目录的 .env，
// 渲染进程地址由其中的 ELECTRON_RENDERER_URL 提供。
const workspaceEnvFile = join(app.getAppPath(), "../../.env");
if (is.dev && existsSync(workspaceEnvFile)) {
  process.loadEnvFile(workspaceEnvFile);
}

const electronApp = {
  setAppUserModelId(id: string): void {
    if (platform.isWindows) app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto: boolean): boolean {
    if (platform.isLinux) return false;
    const isOpenAtLogin = (): boolean => {
      return app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      app.setLoginItemSettings({ openAtLogin: auto });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy(): Promise<void> {
    return session.defaultSession.setProxy({ mode: "direct" });
  },
};

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      sandbox: false,
    },
    frame: false,
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: "deny" };
  });

  void loadRenderer(mainWindow);
}

/**
 * 开发环境加载 website dev server（地址来自工作区根目录 .env 的
 * ELECTRON_RENDERER_URL），生产环境加载打包后的 html。
 * dev server 可能还没就绪，所以加载失败后会重试。
 */
async function loadRenderer(window: BrowserWindow): Promise<void> {
  const devServerUrl = process.env["ELECTRON_RENDERER_URL"];

  if (!is.dev || !devServerUrl) {
    await window.loadFile(join(__dirname, "../renderer/index.html"));
    return;
  }

  try {
    await window.loadURL(devServerUrl);
  } catch {
    if (window.isDestroyed()) return;
    setTimeout(() => void loadRenderer(window), 300);
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
void app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.zlanx.desktop");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

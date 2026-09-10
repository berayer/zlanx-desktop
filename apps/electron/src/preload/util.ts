import { ipcRenderer, webFrame, webUtils } from "electron";
import type { ElectronAPI } from "@preload/types";

export type {
  ElectronAPI,
  IpcRenderer,
  IpcRendererListener,
  WebFrame,
  WebUtils,
  NodeProcess,
} from "@preload/types";

export const electronAPI: ElectronAPI = {
  ipcRenderer: {
    send(channel, ...args) {
      ipcRenderer.send(channel, ...args);
    },
    sendSync(channel, ...args) {
      return ipcRenderer.sendSync(channel, ...args);
    },
    sendToHost(channel, ...args) {
      ipcRenderer.sendToHost(channel, ...args);
    },
    postMessage(channel, message, transfer) {
      ipcRenderer.postMessage(channel, message, transfer);
    },
    invoke(channel, ...args) {
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel, listener) {
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    },
    once(channel, listener) {
      ipcRenderer.once(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    },
    removeListener(channel, listener) {
      ipcRenderer.removeListener(channel, listener);
      return this;
    },
    removeAllListeners(channel) {
      ipcRenderer.removeAllListeners(channel);
    },
  },
  webFrame: {
    insertCSS(css) {
      return webFrame.insertCSS(css);
    },
    setZoomFactor(factor) {
      if (typeof factor === "number" && factor > 0) {
        webFrame.setZoomFactor(factor);
      }
    },
    setZoomLevel(level) {
      if (typeof level === "number") {
        webFrame.setZoomLevel(level);
      }
    },
  },
  webUtils: {
    getPathForFile(file) {
      return webUtils.getPathForFile(file);
    },
  },
  process: {
    get platform() {
      return process.platform;
    },
    get versions() {
      return process.versions;
    },
    get env() {
      return { ...process.env };
    },
  },
};

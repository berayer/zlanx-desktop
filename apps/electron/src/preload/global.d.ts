import type { ElectronAPI } from "./types";

export {};

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

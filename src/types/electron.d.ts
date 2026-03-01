/**
 * TypeScript declarations for Electron API exposed via preload
 */

export interface ElectronAPI {
  send: (channel: string, data: unknown) => void;
  on: (channel: string, callback: (data: unknown) => void) => void;
  invoke: (channel: string, data?: unknown) => Promise<any>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};

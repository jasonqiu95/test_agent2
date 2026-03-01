import { contextBridge, ipcRenderer } from 'electron'

export interface ElectronAPI {
  send: (channel: string, data: unknown) => void;
  on: (channel: string, callback: (data: unknown) => void) => void;
  invoke: (channel: string, data?: unknown) => Promise<any>;
}

contextBridge.exposeInMainWorld('electron', {
  send: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data)
  },
  on: (channel: string, callback: (data: unknown) => void) => {
    ipcRenderer.on(channel, (_event, data) => callback(data))
  },
  invoke: (channel: string, data?: unknown) => {
    return ipcRenderer.invoke(channel, data)
  },
} as ElectronAPI)

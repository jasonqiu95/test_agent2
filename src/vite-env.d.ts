/// <reference types="vite/client" />

interface Window {
  electron: {
    send: (channel: string, data: unknown) => void
    on: (channel: string, callback: (data: unknown) => void) => void
    invoke: (channel: string, data?: unknown) => Promise<unknown>
  }
}

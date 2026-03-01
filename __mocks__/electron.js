// Mock for Electron module to prevent errors during testing
module.exports = {
  app: {
    getPath: jest.fn(() => '/mock/path'),
    getVersion: jest.fn(() => '1.0.0'),
    getName: jest.fn(() => 'Mock App'),
    quit: jest.fn(),
    on: jest.fn(),
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
    removeHandler: jest.fn(),
  },
  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
    invoke: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
    showMessageBox: jest.fn(),
  },
  BrowserWindow: jest.fn(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    webContents: {
      send: jest.fn(),
    },
  })),
  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
};

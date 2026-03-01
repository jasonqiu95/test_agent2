/**
 * IPC handlers for menu actions
 * These handlers respond to requests from the renderer process
 */

import { ipcMain, BrowserWindow, dialog } from 'electron';

/**
 * Register all menu-related IPC handlers
 */
export function registerMenuHandlers(): void {
  // Request to show About dialog
  ipcMain.handle('menu:showAbout', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;

    await dialog.showMessageBox(focusedWindow, {
      type: 'info',
      title: 'About',
      message: 'Book Publishing App',
      detail: 'Version 1.0.0\n\nA professional book publishing application built with Electron.',
      buttons: ['OK'],
    });
  });

  // Request to show Shortcuts dialog
  ipcMain.handle('menu:showShortcuts', async () => {
    // This will be handled by the renderer to show a custom shortcuts dialog
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;

    focusedWindow.webContents.send('menu:help:shortcuts');
  });

  // Export handlers
  ipcMain.handle('menu:export', async (_event, options: { format: string }) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) {
      return { canceled: true };
    }

    const { format } = options;
    const extensions: Record<string, string[]> = {
      pdf: ['pdf'],
      docx: ['docx'],
      epub: ['epub'],
    };

    const names: Record<string, string> = {
      pdf: 'PDF Document',
      docx: 'Word Document',
      epub: 'EPUB eBook',
    };

    const result = await dialog.showSaveDialog(focusedWindow, {
      title: `Export as ${names[format] || format.toUpperCase()}`,
      defaultPath: `untitled.${format}`,
      filters: [
        { name: names[format] || format.toUpperCase(), extensions: extensions[format] || [format] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    return {
      canceled: false,
      filePath: result.filePath,
      format,
    };
  });

  // Find and Replace dialog triggers
  ipcMain.handle('menu:showFind', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;

    focusedWindow.webContents.send('menu:edit:find');
  });

  ipcMain.handle('menu:showReplace', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;

    focusedWindow.webContents.send('menu:edit:replace');
  });

  // Zoom handlers
  ipcMain.handle('menu:zoom', async (_event, options: { action: 'in' | 'out' | 'reset' }) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return { success: false };

    const webContents = focusedWindow.webContents;
    const currentZoom = webContents.getZoomFactor();

    switch (options.action) {
      case 'in':
        webContents.setZoomFactor(Math.min(currentZoom + 0.1, 3.0));
        break;
      case 'out':
        webContents.setZoomFactor(Math.max(currentZoom - 0.1, 0.5));
        break;
      case 'reset':
        webContents.setZoomFactor(1.0);
        break;
    }

    return { success: true, zoomFactor: webContents.getZoomFactor() };
  });

  // Theme change handler
  ipcMain.handle('menu:setTheme', async (_event, options: { theme: string }) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return { success: false };

    focusedWindow.webContents.send('menu:view:theme', options);
    return { success: true };
  });
}

/**
 * Unregister all menu-related IPC handlers
 */
export function unregisterMenuHandlers(): void {
  ipcMain.removeHandler('menu:showAbout');
  ipcMain.removeHandler('menu:showShortcuts');
  ipcMain.removeHandler('menu:export');
  ipcMain.removeHandler('menu:showFind');
  ipcMain.removeHandler('menu:showReplace');
  ipcMain.removeHandler('menu:zoom');
  ipcMain.removeHandler('menu:setTheme');
}

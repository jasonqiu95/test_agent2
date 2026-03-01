/**
 * IPC handlers for file dialog operations
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';

export interface SelectDocxFileResult {
  canceled: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Register all file dialog-related IPC handlers
 */
export function registerFileDialogHandlers(): void {
  // Select DOCX file handler
  ipcMain.handle('fileDialog:selectDocx', async (): Promise<SelectDocxFileResult> => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (!focusedWindow) {
        return { canceled: true };
      }

      const result = await dialog.showOpenDialog(focusedWindow, {
        title: 'Select DOCX File',
        filters: [
          { name: 'Word Documents', extensions: ['docx'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
      }

      return {
        canceled: false,
        filePath: result.filePaths[0],
      };
    } catch (error) {
      return {
        canceled: true,
        error: error instanceof Error ? error.message : 'File selection failed',
      };
    }
  });
}

/**
 * Unregister all file dialog-related IPC handlers
 */
export function unregisterFileDialogHandlers(): void {
  ipcMain.removeHandler('fileDialog:selectDocx');
}

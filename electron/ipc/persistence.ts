/**
 * IPC handlers for project persistence
 */

import { ipcMain, dialog, BrowserWindow } from 'electron';
import { promises as fs } from 'fs';
import { join, extname } from 'path';

export interface SaveOptions {
  filePath: string;
  content: string;
}

export interface LoadOptions {
  filePath: string;
}

export interface DialogOptions {
  defaultPath?: string;
}

export interface ConfirmOptions {
  filePath: string;
}

/**
 * Register all persistence-related IPC handlers
 */
export function registerPersistenceHandlers(): void {
  // Save file handler
  ipcMain.handle('persistence:save', async (_event, options: SaveOptions) => {
    try {
      const { filePath, content } = options;

      // Ensure .vellum extension
      const normalizedPath = ensureVellumExtension(filePath);

      await fs.writeFile(normalizedPath, content, 'utf-8');

      return {
        success: true,
        filePath: normalizedPath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save file',
      };
    }
  });

  // Save dialog handler
  ipcMain.handle(
    'persistence:saveDialog',
    async (_event, options: DialogOptions) => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (!focusedWindow) {
          return { canceled: true };
        }

        const result = await dialog.showSaveDialog(focusedWindow, {
          title: 'Save Project',
          defaultPath: options.defaultPath || 'untitled.vellum',
          filters: [
            { name: 'Vellum Project', extensions: ['vellum'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          properties: ['createDirectory', 'showOverwriteConfirmation'],
        });

        return result;
      } catch (error) {
        return {
          canceled: true,
          error: error instanceof Error ? error.message : 'Save dialog failed',
        };
      }
    }
  );

  // Load file handler
  ipcMain.handle('persistence:load', async (_event, options: LoadOptions) => {
    try {
      const { filePath } = options;

      const content = await fs.readFile(filePath, 'utf-8');

      return {
        success: true,
        content,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load file',
      };
    }
  });

  // Open dialog handler
  ipcMain.handle('persistence:openDialog', async (_event) => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (!focusedWindow) {
        return { canceled: true };
      }

      const result = await dialog.showOpenDialog(focusedWindow, {
        title: 'Open Project',
        filters: [
          { name: 'Vellum Project', extensions: ['vellum'] },
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
        error: error instanceof Error ? error.message : 'Open dialog failed',
      };
    }
  });

  // Confirm unsaved changes handler
  ipcMain.handle(
    'persistence:confirmUnsavedChanges',
    async (_event, options: ConfirmOptions) => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        if (!focusedWindow) {
          return { response: 2 }; // Cancel
        }

        const fileName = options.filePath || 'Untitled';

        const result = await dialog.showMessageBox(focusedWindow, {
          type: 'warning',
          title: 'Unsaved Changes',
          message: `Do you want to save changes to "${fileName}"?`,
          detail: 'Your changes will be lost if you don\'t save them.',
          buttons: ['Save', "Don't Save", 'Cancel'],
          defaultId: 0,
          cancelId: 2,
        });

        return result;
      } catch (error) {
        console.error('Error showing unsaved changes dialog:', error);
        return { response: 2 }; // Cancel on error
      }
    }
  );
}

/**
 * Ensure file path has .vellum extension
 */
function ensureVellumExtension(filePath: string): string {
  const ext = extname(filePath);
  if (ext.toLowerCase() !== '.vellum') {
    return `${filePath}.vellum`;
  }
  return filePath;
}

/**
 * Unregister all persistence-related IPC handlers
 */
export function unregisterPersistenceHandlers(): void {
  ipcMain.removeHandler('persistence:save');
  ipcMain.removeHandler('persistence:saveDialog');
  ipcMain.removeHandler('persistence:load');
  ipcMain.removeHandler('persistence:openDialog');
  ipcMain.removeHandler('persistence:confirmUnsavedChanges');
}

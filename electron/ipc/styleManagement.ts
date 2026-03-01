/**
 * IPC handlers for custom style management
 */

import { ipcMain, app } from 'electron';
import { promises as fs } from 'fs';
import { join } from 'path';
import { BookStyle } from '../../src/types/style';

const CUSTOM_STYLES_FILE = 'custom-styles.json';

/**
 * Get the path to the custom styles file in user config directory
 */
function getCustomStylesPath(): string {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, CUSTOM_STYLES_FILE);
}

/**
 * Ensure the user data directory exists
 */
async function ensureUserDataDir(): Promise<void> {
  const userDataPath = app.getPath('userData');
  try {
    await fs.access(userDataPath);
  } catch {
    await fs.mkdir(userDataPath, { recursive: true });
  }
}

/**
 * Load all custom styles from disk
 */
async function loadCustomStylesFromDisk(): Promise<BookStyle[]> {
  try {
    const filePath = getCustomStylesPath();
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // File doesn't exist or is invalid - return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Save custom styles to disk
 */
async function saveCustomStylesToDisk(styles: BookStyle[]): Promise<void> {
  await ensureUserDataDir();
  const filePath = getCustomStylesPath();
  const content = JSON.stringify(styles, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Register all style management IPC handlers
 */
export function registerStyleManagementHandlers(): void {
  // Load custom styles
  ipcMain.handle('style:loadCustom', async () => {
    try {
      const styles = await loadCustomStylesFromDisk();
      return {
        success: true,
        styles,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load custom styles',
      };
    }
  });

  // Save a new custom style
  ipcMain.handle('style:saveCustom', async (_event, style: BookStyle) => {
    try {
      const styles = await loadCustomStylesFromDisk();

      // Check if style with this ID already exists
      const existingIndex = styles.findIndex(s => s.id === style.id);
      if (existingIndex >= 0) {
        return {
          success: false,
          error: 'A style with this ID already exists. Use updateCustom to modify it.',
        };
      }

      // Ensure the style has custom category
      const customStyle = { ...style, category: 'custom' as const };
      styles.push(customStyle);

      await saveCustomStylesToDisk(styles);

      return {
        success: true,
        style: customStyle,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save custom style',
      };
    }
  });

  // Update an existing custom style
  ipcMain.handle('style:updateCustom', async (_event, { id, style }: { id: string; style: BookStyle }) => {
    try {
      const styles = await loadCustomStylesFromDisk();

      const existingIndex = styles.findIndex(s => s.id === id);
      if (existingIndex < 0) {
        return {
          success: false,
          error: 'Style not found',
        };
      }

      // Ensure the style has custom category
      const updatedStyle = { ...style, id, category: 'custom' as const };
      styles[existingIndex] = updatedStyle;

      await saveCustomStylesToDisk(styles);

      return {
        success: true,
        style: updatedStyle,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update custom style',
      };
    }
  });

  // Delete a custom style
  ipcMain.handle('style:deleteCustom', async (_event, id: string) => {
    try {
      const styles = await loadCustomStylesFromDisk();

      const existingIndex = styles.findIndex(s => s.id === id);
      if (existingIndex < 0) {
        return {
          success: false,
          error: 'Style not found',
        };
      }

      styles.splice(existingIndex, 1);

      await saveCustomStylesToDisk(styles);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete custom style',
      };
    }
  });
}

/**
 * Unregister all style management IPC handlers
 */
export function unregisterStyleManagementHandlers(): void {
  ipcMain.removeHandler('style:loadCustom');
  ipcMain.removeHandler('style:saveCustom');
  ipcMain.removeHandler('style:updateCustom');
  ipcMain.removeHandler('style:deleteCustom');
}

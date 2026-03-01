/**
 * Service for managing custom book styles
 * Uses Electron IPC if available, falls back to localStorage
 */

import { BookStyle } from '../types/style';

const LOCALSTORAGE_KEY = 'vellum-custom-styles';

/**
 * Check if Electron API is available
 */
function isElectronAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electron;
}

/**
 * Load custom styles from localStorage
 */
function loadFromLocalStorage(): BookStyle[] {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load custom styles from localStorage:', error);
    return [];
  }
}

/**
 * Save custom styles to localStorage
 */
function saveToLocalStorage(styles: BookStyle[]): void {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(styles));
  } catch (error) {
    console.error('Failed to save custom styles to localStorage:', error);
    throw new Error('Failed to save custom styles');
  }
}

/**
 * Load all custom styles
 * @returns Promise resolving to array of custom BookStyle objects
 */
export async function loadCustomStyles(): Promise<BookStyle[]> {
  if (isElectronAvailable()) {
    try {
      const result = await window.electron.invoke('style:loadCustom') as {
        success: boolean;
        styles?: BookStyle[];
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to load custom styles');
      }

      return result.styles || [];
    } catch (error) {
      console.error('Electron IPC failed, falling back to localStorage:', error);
      return loadFromLocalStorage();
    }
  } else {
    return loadFromLocalStorage();
  }
}

/**
 * Save a new custom style
 * @param style The BookStyle to save (will be assigned 'custom' category)
 * @returns Promise that resolves when the style is saved
 */
export async function saveCustomStyle(style: BookStyle): Promise<void> {
  // Ensure the style has custom category
  const customStyle: BookStyle = { ...style, category: 'custom' };

  if (isElectronAvailable()) {
    try {
      const result = await window.electron.invoke('style:saveCustom', customStyle) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to save custom style');
      }
    } catch (error) {
      console.error('Electron IPC failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const styles = loadFromLocalStorage();

      // Check if style with this ID already exists
      if (styles.some(s => s.id === style.id)) {
        throw new Error('A style with this ID already exists. Use updateCustomStyle to modify it.');
      }

      styles.push(customStyle);
      saveToLocalStorage(styles);
    }
  } else {
    // Use localStorage
    const styles = loadFromLocalStorage();

    // Check if style with this ID already exists
    if (styles.some(s => s.id === style.id)) {
      throw new Error('A style with this ID already exists. Use updateCustomStyle to modify it.');
    }

    styles.push(customStyle);
    saveToLocalStorage(styles);
  }
}

/**
 * Update an existing custom style
 * @param id The ID of the style to update
 * @param style The updated BookStyle data
 * @returns Promise that resolves when the style is updated
 */
export async function updateCustomStyle(id: string, style: BookStyle): Promise<void> {
  // Ensure the style has custom category and correct ID
  const updatedStyle: BookStyle = { ...style, id, category: 'custom' };

  if (isElectronAvailable()) {
    try {
      const result = await window.electron.invoke('style:updateCustom', {
        id,
        style: updatedStyle,
      }) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to update custom style');
      }
    } catch (error) {
      console.error('Electron IPC failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const styles = loadFromLocalStorage();
      const existingIndex = styles.findIndex(s => s.id === id);

      if (existingIndex < 0) {
        throw new Error('Style not found');
      }

      styles[existingIndex] = updatedStyle;
      saveToLocalStorage(styles);
    }
  } else {
    // Use localStorage
    const styles = loadFromLocalStorage();
    const existingIndex = styles.findIndex(s => s.id === id);

    if (existingIndex < 0) {
      throw new Error('Style not found');
    }

    styles[existingIndex] = updatedStyle;
    saveToLocalStorage(styles);
  }
}

/**
 * Delete a custom style
 * @param id The ID of the style to delete
 * @returns Promise that resolves when the style is deleted
 */
export async function deleteCustomStyle(id: string): Promise<void> {
  if (isElectronAvailable()) {
    try {
      const result = await window.electron.invoke('style:deleteCustom', id) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete custom style');
      }
    } catch (error) {
      console.error('Electron IPC failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const styles = loadFromLocalStorage();
      const existingIndex = styles.findIndex(s => s.id === id);

      if (existingIndex < 0) {
        throw new Error('Style not found');
      }

      styles.splice(existingIndex, 1);
      saveToLocalStorage(styles);
    }
  } else {
    // Use localStorage
    const styles = loadFromLocalStorage();
    const existingIndex = styles.findIndex(s => s.id === id);

    if (existingIndex < 0) {
      throw new Error('Style not found');
    }

    styles.splice(existingIndex, 1);
    saveToLocalStorage(styles);
  }
}

/**
 * Get all styles including built-in and custom styles
 * This function should be called with built-in styles to merge with custom ones
 * @param builtInStyles Array of built-in BookStyle objects
 * @returns Promise resolving to combined array of all styles
 */
export async function getAllStyles(builtInStyles: BookStyle[]): Promise<BookStyle[]> {
  const customStyles = await loadCustomStyles();
  return [...builtInStyles, ...customStyles];
}

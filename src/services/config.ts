/**
 * Configuration service for managing user preferences
 */

import { UserPreferences, DEFAULT_PREFERENCES } from '../types/preferences';

const CONFIG_STORAGE_KEY = 'vellum_user_preferences';
const CONFIG_FILE_NAME = 'preferences.json';

type PreferencesListener = (preferences: UserPreferences) => void;

export class ConfigService {
  private currentPreferences: UserPreferences;
  private listeners: Set<PreferencesListener> = new Set();
  private saveDebounceMs: number = 500;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.currentPreferences = this.loadPreferences();
  }

  /**
   * Get current preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.currentPreferences };
  }

  /**
   * Update preferences (partial update)
   */
  updatePreferences(updates: Partial<UserPreferences>): void {
    this.currentPreferences = {
      ...this.currentPreferences,
      ...updates,
      lastModified: new Date().toISOString(),
    };

    this.notifyListeners();
    this.scheduleSave();
  }

  /**
   * Update a specific preference section
   */
  updateAutoSave(autoSave: Partial<UserPreferences['autoSave']>): void {
    this.currentPreferences.autoSave = {
      ...this.currentPreferences.autoSave,
      ...autoSave,
    };
    this.notifyListeners();
    this.scheduleSave();
  }

  updateEditor(editor: Partial<UserPreferences['editor']>): void {
    this.currentPreferences.editor = {
      ...this.currentPreferences.editor,
      ...editor,
    };
    this.notifyListeners();
    this.scheduleSave();
  }

  updateExportDefaults(exportDefaults: Partial<UserPreferences['exportDefaults']>): void {
    this.currentPreferences.exportDefaults = {
      ...this.currentPreferences.exportDefaults,
      ...exportDefaults,
    };
    this.notifyListeners();
    this.scheduleSave();
  }

  updateTheme(theme: UserPreferences['theme']): void {
    this.currentPreferences.theme = theme;
    this.notifyListeners();
    this.scheduleSave();
    this.applyTheme(theme);
  }

  updateKeyboardShortcut(
    shortcutId: string,
    customKeys: string[]
  ): void {
    if (this.currentPreferences.keyboardShortcuts[shortcutId]) {
      this.currentPreferences.keyboardShortcuts[shortcutId].customKeys = customKeys;
      this.notifyListeners();
      this.scheduleSave();
    }
  }

  /**
   * Reset keyboard shortcut to default
   */
  resetKeyboardShortcut(shortcutId: string): void {
    if (this.currentPreferences.keyboardShortcuts[shortcutId]) {
      delete this.currentPreferences.keyboardShortcuts[shortcutId].customKeys;
      this.notifyListeners();
      this.scheduleSave();
    }
  }

  /**
   * Reset all preferences to defaults
   */
  resetToDefaults(): void {
    this.currentPreferences = { ...DEFAULT_PREFERENCES };
    this.notifyListeners();
    this.savePreferences();
  }

  /**
   * Register a listener for preference changes
   */
  onChange(listener: PreferencesListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Export preferences to JSON file
   */
  async exportPreferences(): Promise<{ success: boolean; error?: string }> {
    try {
      const jsonContent = JSON.stringify(this.currentPreferences, null, 2);

      if (window.electron) {
        const result = await window.electron.invoke('config:export', {
          defaultPath: CONFIG_FILE_NAME,
          content: jsonContent,
        });
        return result;
      }

      // Fallback for non-Electron environment
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = CONFIG_FILE_NAME;
      a.click();
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Import preferences from JSON file
   */
  async importPreferences(): Promise<{ success: boolean; error?: string }> {
    try {
      if (window.electron) {
        const result = await window.electron.invoke('config:import');

        if (result.success && result.content) {
          const imported: UserPreferences = JSON.parse(result.content);
          this.validateAndApplyPreferences(imported);
          return { success: true };
        }

        return { success: false, error: result.error || 'Import failed' };
      }

      // Fallback for non-Electron environment
      return { success: false, error: 'Import only available in Electron' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load preferences from storage
   */
  private loadPreferences(): UserPreferences {
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);

      if (stored) {
        const parsed: UserPreferences = JSON.parse(stored);
        return this.validateAndMergePreferences(parsed);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }

    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(): void {
    try {
      const jsonString = JSON.stringify(this.currentPreferences);
      localStorage.setItem(CONFIG_STORAGE_KEY, jsonString);

      // Also save to file system if Electron is available
      if (window.electron) {
        window.electron.invoke('config:save', {
          content: jsonString,
        }).catch((error: Error) => {
          console.error('Error saving preferences to file:', error);
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  /**
   * Schedule a debounced save
   */
  private scheduleSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.savePreferences();
    }, this.saveDebounceMs);
  }

  /**
   * Notify all listeners of preference changes
   */
  private notifyListeners(): void {
    const preferences = this.getPreferences();
    this.listeners.forEach((listener) => {
      listener(preferences);
    });
  }

  /**
   * Validate and merge preferences with defaults
   */
  private validateAndMergePreferences(
    preferences: Partial<UserPreferences>
  ): UserPreferences {
    return {
      version: preferences.version || DEFAULT_PREFERENCES.version,
      autoSave: {
        ...DEFAULT_PREFERENCES.autoSave,
        ...preferences.autoSave,
      },
      defaultStyleId: preferences.defaultStyleId,
      exportDefaults: {
        ...DEFAULT_PREFERENCES.exportDefaults,
        ...preferences.exportDefaults,
      },
      editor: {
        ...DEFAULT_PREFERENCES.editor,
        ...preferences.editor,
      },
      theme: preferences.theme || DEFAULT_PREFERENCES.theme,
      keyboardShortcuts: {
        ...DEFAULT_PREFERENCES.keyboardShortcuts,
        ...preferences.keyboardShortcuts,
      },
      lastModified: preferences.lastModified || new Date().toISOString(),
    };
  }

  /**
   * Validate and apply imported preferences
   */
  private validateAndApplyPreferences(preferences: UserPreferences): void {
    this.currentPreferences = this.validateAndMergePreferences(preferences);
    this.notifyListeners();
    this.savePreferences();
    this.applyTheme(this.currentPreferences.theme);
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: UserPreferences['theme']): void {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }
}

// Singleton instance
let configServiceInstance: ConfigService | null = null;

export function getConfigService(): ConfigService {
  if (!configServiceInstance) {
    configServiceInstance = new ConfigService();
  }
  return configServiceInstance;
}

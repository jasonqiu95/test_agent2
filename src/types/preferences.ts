/**
 * User preferences and settings types
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ExportFormat = 'pdf' | 'epub' | 'docx' | 'html';
export type TrimSize = '5x8' | '5.5x8.5' | '6x9' | '8.5x11' | 'custom';

export interface AutoSaveSettings {
  enabled: boolean;
  intervalSeconds: number;
}

export interface EditorPreferences {
  fontSize: number;
  spellCheckEnabled: boolean;
  lineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
}

export interface ExportDefaults {
  format: ExportFormat;
  trimSize: TrimSize;
  customTrimWidth?: number;
  customTrimHeight?: number;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
}

export interface KeyboardShortcut {
  id: string;
  label: string;
  description: string;
  defaultKeys: string[];
  customKeys?: string[];
  category: 'file' | 'edit' | 'view' | 'navigation' | 'formatting';
}

export interface KeyboardShortcuts {
  [key: string]: KeyboardShortcut;
}

export interface UserPreferences {
  version: string;
  autoSave: AutoSaveSettings;
  defaultStyleId?: string;
  exportDefaults: ExportDefaults;
  editor: EditorPreferences;
  theme: ThemeMode;
  keyboardShortcuts: KeyboardShortcuts;
  lastModified: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  version: '1.0.0',
  autoSave: {
    enabled: true,
    intervalSeconds: 30,
  },
  exportDefaults: {
    format: 'pdf',
    trimSize: '6x9',
    includeTableOfContents: true,
    includePageNumbers: true,
  },
  editor: {
    fontSize: 14,
    spellCheckEnabled: true,
    lineNumbers: false,
    wordWrap: true,
    tabSize: 2,
  },
  theme: 'system',
  keyboardShortcuts: {
    save: {
      id: 'save',
      label: 'Save',
      description: 'Save current document',
      defaultKeys: ['Ctrl+S', 'Cmd+S'],
      category: 'file',
    },
    export: {
      id: 'export',
      label: 'Export',
      description: 'Export document',
      defaultKeys: ['Ctrl+E', 'Cmd+E'],
      category: 'file',
    },
    newChapter: {
      id: 'newChapter',
      label: 'New Chapter',
      description: 'Create a new chapter',
      defaultKeys: ['Ctrl+Shift+N', 'Cmd+Shift+N'],
      category: 'edit',
    },
    toggleStyleBrowser: {
      id: 'toggleStyleBrowser',
      label: 'Toggle Style Browser',
      description: 'Show/hide style browser',
      defaultKeys: ['Ctrl+B', 'Cmd+B'],
      category: 'view',
    },
    togglePreview: {
      id: 'togglePreview',
      label: 'Toggle Preview',
      description: 'Show/hide preview pane',
      defaultKeys: ['Ctrl+P', 'Cmd+P'],
      category: 'view',
    },
    find: {
      id: 'find',
      label: 'Find',
      description: 'Find in document',
      defaultKeys: ['Ctrl+F', 'Cmd+F'],
      category: 'edit',
    },
    showShortcuts: {
      id: 'showShortcuts',
      label: 'Show Shortcuts',
      description: 'Display keyboard shortcuts',
      defaultKeys: ['Ctrl+/', 'Cmd+/'],
      category: 'view',
    },
    undo: {
      id: 'undo',
      label: 'Undo',
      description: 'Undo last action',
      defaultKeys: ['Ctrl+Z', 'Cmd+Z'],
      category: 'edit',
    },
    redo: {
      id: 'redo',
      label: 'Redo',
      description: 'Redo last action',
      defaultKeys: ['Ctrl+Shift+Z', 'Cmd+Shift+Z'],
      category: 'edit',
    },
    bold: {
      id: 'bold',
      label: 'Bold',
      description: 'Apply bold formatting',
      defaultKeys: ['Ctrl+B', 'Cmd+B'],
      category: 'formatting',
    },
    italic: {
      id: 'italic',
      label: 'Italic',
      description: 'Apply italic formatting',
      defaultKeys: ['Ctrl+I', 'Cmd+I'],
      category: 'formatting',
    },
  },
  lastModified: new Date().toISOString(),
};

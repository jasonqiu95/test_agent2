import React, { useState, useEffect } from 'react';
import { getConfigService } from '../../services/config';
import type {
  UserPreferences,
  ThemeMode,
  ExportFormat,
  TrimSize,
  KeyboardShortcut,
} from '../../types/preferences';
import type { BookStyle } from '../../types/style';
import './PreferencesDialog.css';

export interface PreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableStyles?: BookStyle[];
}

type TabId = 'general' | 'editor' | 'export' | 'theme' | 'shortcuts';

export const PreferencesDialog: React.FC<PreferencesDialogProps> = ({
  isOpen,
  onClose,
  availableStyles = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [preferences, setPreferences] = useState<UserPreferences>(
    getConfigService().getPreferences()
  );
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [shortcutInput, setShortcutInput] = useState<string>('');

  useEffect(() => {
    const unsubscribe = getConfigService().onChange((newPreferences) => {
      setPreferences(newPreferences);
    });

    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !editingShortcut) {
      onClose();
    }
  };

  const handleAutoSaveToggle = () => {
    getConfigService().updateAutoSave({
      enabled: !preferences.autoSave.enabled,
    });
  };

  const handleAutoSaveInterval = (intervalSeconds: number) => {
    getConfigService().updateAutoSave({ intervalSeconds });
  };

  const handleDefaultStyleChange = (styleId: string) => {
    getConfigService().updatePreferences({ defaultStyleId: styleId });
  };

  const handleExportFormatChange = (format: ExportFormat) => {
    getConfigService().updateExportDefaults({ format });
  };

  const handleTrimSizeChange = (trimSize: TrimSize) => {
    getConfigService().updateExportDefaults({ trimSize });
  };

  const handleEditorFontSizeChange = (fontSize: number) => {
    getConfigService().updateEditor({ fontSize });
  };

  const handleSpellCheckToggle = () => {
    getConfigService().updateEditor({
      spellCheckEnabled: !preferences.editor.spellCheckEnabled,
    });
  };

  const handleThemeChange = (theme: ThemeMode) => {
    getConfigService().updateTheme(theme);
  };

  const handleShortcutEdit = (shortcutId: string) => {
    const shortcut = preferences.keyboardShortcuts[shortcutId];
    const currentKeys = shortcut.customKeys || shortcut.defaultKeys;
    setEditingShortcut(shortcutId);
    setShortcutInput(currentKeys.join(', '));
  };

  const handleShortcutSave = () => {
    if (editingShortcut) {
      const keys = shortcutInput
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      if (keys.length > 0) {
        getConfigService().updateKeyboardShortcut(editingShortcut, keys);
      }

      setEditingShortcut(null);
      setShortcutInput('');
    }
  };

  const handleShortcutReset = (shortcutId: string) => {
    getConfigService().resetKeyboardShortcut(shortcutId);
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all preferences to defaults? This cannot be undone.'
      )
    ) {
      getConfigService().resetToDefaults();
    }
  };

  const handleExport = async () => {
    const result = await getConfigService().exportPreferences();
    if (result.success) {
      alert('Preferences exported successfully!');
    } else {
      alert(`Export failed: ${result.error}`);
    }
  };

  const handleImport = async () => {
    const result = await getConfigService().importPreferences();
    if (result.success) {
      alert('Preferences imported successfully!');
    } else {
      alert(`Import failed: ${result.error}`);
    }
  };

  return (
    <div
      className="preferences-dialog-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-dialog-title"
    >
      <div className="preferences-dialog">
        <div className="preferences-dialog-header">
          <h2 id="preferences-dialog-title">Preferences</h2>
          <button
            className="preferences-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="preferences-dialog-body">
          <div className="preferences-tabs">
            <button
              className={`preferences-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`preferences-tab ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              Editor
            </button>
            <button
              className={`preferences-tab ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
            <button
              className={`preferences-tab ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              Theme
            </button>
            <button
              className={`preferences-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              Shortcuts
            </button>
          </div>

          <div className="preferences-content">
            {activeTab === 'general' && (
              <GeneralTab
                preferences={preferences}
                availableStyles={availableStyles}
                onAutoSaveToggle={handleAutoSaveToggle}
                onAutoSaveInterval={handleAutoSaveInterval}
                onDefaultStyleChange={handleDefaultStyleChange}
              />
            )}

            {activeTab === 'editor' && (
              <EditorTab
                preferences={preferences}
                onFontSizeChange={handleEditorFontSizeChange}
                onSpellCheckToggle={handleSpellCheckToggle}
              />
            )}

            {activeTab === 'export' && (
              <ExportTab
                preferences={preferences}
                onFormatChange={handleExportFormatChange}
                onTrimSizeChange={handleTrimSizeChange}
              />
            )}

            {activeTab === 'theme' && (
              <ThemeTab preferences={preferences} onThemeChange={handleThemeChange} />
            )}

            {activeTab === 'shortcuts' && (
              <ShortcutsTab
                preferences={preferences}
                editingShortcut={editingShortcut}
                shortcutInput={shortcutInput}
                onShortcutEdit={handleShortcutEdit}
                onShortcutSave={handleShortcutSave}
                onShortcutReset={handleShortcutReset}
                onShortcutInputChange={setShortcutInput}
              />
            )}
          </div>
        </div>

        <div className="preferences-dialog-footer">
          <div className="preferences-footer-left">
            <button className="preferences-btn-secondary" onClick={handleImport}>
              Import
            </button>
            <button className="preferences-btn-secondary" onClick={handleExport}>
              Export
            </button>
          </div>
          <div className="preferences-footer-right">
            <button className="preferences-btn-secondary" onClick={handleResetAll}>
              Reset All
            </button>
            <button className="preferences-btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GeneralTabProps {
  preferences: UserPreferences;
  availableStyles: BookStyle[];
  onAutoSaveToggle: () => void;
  onAutoSaveInterval: (interval: number) => void;
  onDefaultStyleChange: (styleId: string) => void;
}

const GeneralTab: React.FC<GeneralTabProps> = ({
  preferences,
  availableStyles,
  onAutoSaveToggle,
  onAutoSaveInterval,
  onDefaultStyleChange,
}) => {
  return (
    <div className="preferences-section">
      <div className="preferences-group">
        <h3 className="preferences-group-title">Auto-Save</h3>
        <div className="preferences-field">
          <label className="preferences-checkbox-label">
            <input
              type="checkbox"
              checked={preferences.autoSave.enabled}
              onChange={onAutoSaveToggle}
            />
            <span>Enable auto-save</span>
          </label>
        </div>
        {preferences.autoSave.enabled && (
          <div className="preferences-field">
            <label className="preferences-label">
              Auto-save interval (seconds)
            </label>
            <select
              className="preferences-select"
              value={preferences.autoSave.intervalSeconds}
              onChange={(e) => onAutoSaveInterval(Number(e.target.value))}
            >
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="120">2 minutes</option>
              <option value="300">5 minutes</option>
            </select>
          </div>
        )}
      </div>

      <div className="preferences-group">
        <h3 className="preferences-group-title">Default Style</h3>
        <div className="preferences-field">
          <label className="preferences-label">Default book style</label>
          <select
            className="preferences-select"
            value={preferences.defaultStyleId || ''}
            onChange={(e) => onDefaultStyleChange(e.target.value)}
          >
            <option value="">None</option>
            {availableStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
          <p className="preferences-hint">
            This style will be applied to new chapters by default
          </p>
        </div>
      </div>
    </div>
  );
};

interface EditorTabProps {
  preferences: UserPreferences;
  onFontSizeChange: (fontSize: number) => void;
  onSpellCheckToggle: () => void;
}

const EditorTab: React.FC<EditorTabProps> = ({
  preferences,
  onFontSizeChange,
  onSpellCheckToggle,
}) => {
  return (
    <div className="preferences-section">
      <div className="preferences-group">
        <h3 className="preferences-group-title">Editor Settings</h3>

        <div className="preferences-field">
          <label className="preferences-label">Font size</label>
          <div className="preferences-range-control">
            <input
              type="range"
              min="10"
              max="24"
              step="1"
              value={preferences.editor.fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="preferences-range"
            />
            <span className="preferences-range-value">
              {preferences.editor.fontSize}px
            </span>
          </div>
        </div>

        <div className="preferences-field">
          <label className="preferences-checkbox-label">
            <input
              type="checkbox"
              checked={preferences.editor.spellCheckEnabled}
              onChange={onSpellCheckToggle}
            />
            <span>Enable spell check</span>
          </label>
        </div>

        <div className="preferences-field">
          <label className="preferences-checkbox-label">
            <input
              type="checkbox"
              checked={preferences.editor.lineNumbers}
              onChange={() =>
                getConfigService().updateEditor({
                  lineNumbers: !preferences.editor.lineNumbers,
                })
              }
            />
            <span>Show line numbers</span>
          </label>
        </div>

        <div className="preferences-field">
          <label className="preferences-checkbox-label">
            <input
              type="checkbox"
              checked={preferences.editor.wordWrap}
              onChange={() =>
                getConfigService().updateEditor({
                  wordWrap: !preferences.editor.wordWrap,
                })
              }
            />
            <span>Word wrap</span>
          </label>
        </div>

        <div className="preferences-field">
          <label className="preferences-label">Tab size</label>
          <select
            className="preferences-select"
            value={preferences.editor.tabSize}
            onChange={(e) =>
              getConfigService().updateEditor({ tabSize: Number(e.target.value) })
            }
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="8">8 spaces</option>
          </select>
        </div>
      </div>
    </div>
  );
};

interface ExportTabProps {
  preferences: UserPreferences;
  onFormatChange: (format: ExportFormat) => void;
  onTrimSizeChange: (trimSize: TrimSize) => void;
}

const ExportTab: React.FC<ExportTabProps> = ({
  preferences,
  onFormatChange,
  onTrimSizeChange,
}) => {
  return (
    <div className="preferences-section">
      <div className="preferences-group">
        <h3 className="preferences-group-title">Export Defaults</h3>

        <div className="preferences-field">
          <label className="preferences-label">Default export format</label>
          <select
            className="preferences-select"
            value={preferences.exportDefaults.format}
            onChange={(e) => onFormatChange(e.target.value as ExportFormat)}
          >
            <option value="pdf">PDF</option>
            <option value="epub">EPUB</option>
            <option value="docx">DOCX</option>
            <option value="html">HTML</option>
          </select>
        </div>

        <div className="preferences-field">
          <label className="preferences-label">Default trim size</label>
          <select
            className="preferences-select"
            value={preferences.exportDefaults.trimSize}
            onChange={(e) => onTrimSizeChange(e.target.value as TrimSize)}
          >
            <option value="5x8">5" × 8"</option>
            <option value="5.5x8.5">5.5" × 8.5"</option>
            <option value="6x9">6" × 9"</option>
            <option value="8.5x11">8.5" × 11"</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="preferences-field">
          <label className="preferences-checkbox-label">
            <input
              type="checkbox"
              checked={preferences.exportDefaults.includeTableOfContents}
              onChange={() =>
                getConfigService().updateExportDefaults({
                  includeTableOfContents:
                    !preferences.exportDefaults.includeTableOfContents,
                })
              }
            />
            <span>Include table of contents</span>
          </label>
        </div>

        <div className="preferences-field">
          <label className="preferences-checkbox-label">
            <input
              type="checkbox"
              checked={preferences.exportDefaults.includePageNumbers}
              onChange={() =>
                getConfigService().updateExportDefaults({
                  includePageNumbers: !preferences.exportDefaults.includePageNumbers,
                })
              }
            />
            <span>Include page numbers</span>
          </label>
        </div>
      </div>
    </div>
  );
};

interface ThemeTabProps {
  preferences: UserPreferences;
  onThemeChange: (theme: ThemeMode) => void;
}

const ThemeTab: React.FC<ThemeTabProps> = ({ preferences, onThemeChange }) => {
  return (
    <div className="preferences-section">
      <div className="preferences-group">
        <h3 className="preferences-group-title">Theme Selection</h3>

        <div className="preferences-theme-options">
          <div
            className={`preferences-theme-option ${
              preferences.theme === 'light' ? 'active' : ''
            }`}
            onClick={() => onThemeChange('light')}
          >
            <div className="preferences-theme-preview light">
              <div className="preview-header"></div>
              <div className="preview-content">
                <div className="preview-line"></div>
                <div className="preview-line"></div>
                <div className="preview-line short"></div>
              </div>
            </div>
            <span className="preferences-theme-label">Light</span>
          </div>

          <div
            className={`preferences-theme-option ${
              preferences.theme === 'dark' ? 'active' : ''
            }`}
            onClick={() => onThemeChange('dark')}
          >
            <div className="preferences-theme-preview dark">
              <div className="preview-header"></div>
              <div className="preview-content">
                <div className="preview-line"></div>
                <div className="preview-line"></div>
                <div className="preview-line short"></div>
              </div>
            </div>
            <span className="preferences-theme-label">Dark</span>
          </div>

          <div
            className={`preferences-theme-option ${
              preferences.theme === 'system' ? 'active' : ''
            }`}
            onClick={() => onThemeChange('system')}
          >
            <div className="preferences-theme-preview system">
              <div className="preview-split">
                <div className="preview-half light">
                  <div className="preview-header"></div>
                  <div className="preview-content">
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                  </div>
                </div>
                <div className="preview-half dark">
                  <div className="preview-header"></div>
                  <div className="preview-content">
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                  </div>
                </div>
              </div>
            </div>
            <span className="preferences-theme-label">System</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ShortcutsTabProps {
  preferences: UserPreferences;
  editingShortcut: string | null;
  shortcutInput: string;
  onShortcutEdit: (shortcutId: string) => void;
  onShortcutSave: () => void;
  onShortcutReset: (shortcutId: string) => void;
  onShortcutInputChange: (value: string) => void;
}

const ShortcutsTab: React.FC<ShortcutsTabProps> = ({
  preferences,
  editingShortcut,
  shortcutInput,
  onShortcutEdit,
  onShortcutSave,
  onShortcutReset,
  onShortcutInputChange,
}) => {
  const categories: Array<{ id: KeyboardShortcut['category']; label: string }> = [
    { id: 'file', label: 'File' },
    { id: 'edit', label: 'Edit' },
    { id: 'view', label: 'View' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'formatting', label: 'Formatting' },
  ];

  const getShortcutsByCategory = (category: KeyboardShortcut['category']) => {
    return Object.values(preferences.keyboardShortcuts).filter(
      (shortcut) => shortcut.category === category
    );
  };

  return (
    <div className="preferences-section">
      <div className="preferences-shortcuts-hint">
        Click on any shortcut to customize it. Use commas to separate multiple key
        combinations.
      </div>

      {categories.map((category) => {
        const shortcuts = getShortcutsByCategory(category.id);
        if (shortcuts.length === 0) return null;

        return (
          <div key={category.id} className="preferences-group">
            <h3 className="preferences-group-title">{category.label}</h3>
            <div className="preferences-shortcuts-list">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.id} className="preferences-shortcut-item">
                  <div className="preferences-shortcut-info">
                    <span className="preferences-shortcut-label">
                      {shortcut.label}
                    </span>
                    <span className="preferences-shortcut-description">
                      {shortcut.description}
                    </span>
                  </div>

                  <div className="preferences-shortcut-keys">
                    {editingShortcut === shortcut.id ? (
                      <div className="preferences-shortcut-edit">
                        <input
                          type="text"
                          className="preferences-shortcut-input"
                          value={shortcutInput}
                          onChange={(e) => onShortcutInputChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onShortcutSave();
                            } else if (e.key === 'Escape') {
                              onShortcutInputChange('');
                            }
                          }}
                          onBlur={onShortcutSave}
                          autoFocus
                          placeholder="Ctrl+S, Cmd+S"
                        />
                      </div>
                    ) : (
                      <>
                        <div
                          className="preferences-shortcut-display"
                          onClick={() => onShortcutEdit(shortcut.id)}
                        >
                          {(shortcut.customKeys || shortcut.defaultKeys).map(
                            (key, idx) => (
                              <kbd key={idx} className="preferences-kbd">
                                {key}
                              </kbd>
                            )
                          )}
                        </div>
                        {shortcut.customKeys && (
                          <button
                            className="preferences-shortcut-reset"
                            onClick={() => onShortcutReset(shortcut.id)}
                            title="Reset to default"
                          >
                            ↻
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

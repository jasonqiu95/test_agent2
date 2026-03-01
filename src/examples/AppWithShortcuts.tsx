import React, { useState, useCallback } from 'react';
import { useKeyboardShortcuts, KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { ShortcutsDialog } from '../components/ShortcutsDialog';

/**
 * Example application demonstrating the keyboard shortcuts system
 *
 * This component shows how to implement all the required shortcuts:
 * - Save: Cmd+S / Ctrl+S
 * - Export: Cmd+E / Ctrl+E
 * - New Chapter: Cmd+N / Ctrl+N
 * - Toggle Style Browser: Cmd+T / Ctrl+T
 * - Toggle Preview: Cmd+P / Ctrl+P
 * - Find: Cmd+F / Ctrl+F
 * - Show Shortcuts: Cmd+/ / Ctrl+/
 */
export const AppWithShortcuts: React.FC = () => {
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showStyleBrowser, setShowStyleBrowser] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  // Define all keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrl: true,
      description: 'Save',
      action: useCallback(() => {
        setLastAction('Save triggered');
        // Implement save logic here
        console.log('Saving...');
      }, []),
    },
    {
      key: 'e',
      ctrl: true,
      description: 'Export',
      action: useCallback(() => {
        setLastAction('Export triggered');
        // Implement export logic here
        console.log('Exporting...');
      }, []),
    },
    {
      key: 'n',
      ctrl: true,
      description: 'New Chapter',
      action: useCallback(() => {
        setLastAction('New Chapter triggered');
        // Implement new chapter logic here
        console.log('Creating new chapter...');
      }, []),
    },
    {
      key: 't',
      ctrl: true,
      description: 'Toggle Style Browser',
      action: useCallback(() => {
        setShowStyleBrowser((prev) => !prev);
        setLastAction('Style Browser toggled');
      }, []),
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Toggle Preview',
      action: useCallback(() => {
        setShowPreview((prev) => !prev);
        setLastAction('Preview toggled');
      }, []),
    },
    {
      key: 'f',
      ctrl: true,
      description: 'Find',
      action: useCallback(() => {
        setLastAction('Find triggered');
        // Implement find logic here
        console.log('Opening find...');
      }, []),
    },
    {
      key: '/',
      ctrl: true,
      description: 'Show Keyboard Shortcuts',
      action: useCallback(() => {
        setShowShortcutsDialog(true);
      }, []),
    },
  ];

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({ shortcuts });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Keyboard Shortcuts Demo</h1>

      <div style={{ marginBottom: '20px' }}>
        <p>
          <strong>Last Action:</strong> {lastAction || 'None'}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Available Shortcuts</h2>
        <ul>
          <li><kbd>Cmd/Ctrl + S</kbd> - Save</li>
          <li><kbd>Cmd/Ctrl + E</kbd> - Export</li>
          <li><kbd>Cmd/Ctrl + N</kbd> - New Chapter</li>
          <li><kbd>Cmd/Ctrl + T</kbd> - Toggle Style Browser (currently {showStyleBrowser ? 'ON' : 'OFF'})</li>
          <li><kbd>Cmd/Ctrl + P</kbd> - Toggle Preview (currently {showPreview ? 'ON' : 'OFF'})</li>
          <li><kbd>Cmd/Ctrl + F</kbd> - Find</li>
          <li><kbd>Cmd/Ctrl + /</kbd> - Show Shortcuts Dialog</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setShowShortcutsDialog(true)}>
          Show Shortcuts Dialog
        </button>
      </div>

      {showStyleBrowser && (
        <div style={{
          padding: '15px',
          background: '#f0f0f0',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Style Browser</h3>
          <p>This is the style browser panel. Press Cmd/Ctrl+T to toggle.</p>
        </div>
      )}

      {showPreview && (
        <div style={{
          padding: '15px',
          background: '#e8f4f8',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>Preview</h3>
          <p>This is the preview panel. Press Cmd/Ctrl+P to toggle.</p>
        </div>
      )}

      <ShortcutsDialog
        isOpen={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
};

export default AppWithShortcuts;

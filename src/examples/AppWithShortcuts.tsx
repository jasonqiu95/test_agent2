import React, { useState, useCallback } from 'react';
import { useKeyboardShortcuts, KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { ShortcutsDialog, ShortcutCategory } from '../components/ShortcutsDialog';

/**
 * Example application demonstrating the comprehensive keyboard shortcuts system
 *
 * Organized by categories:
 * - File: New, Open, Save, Export
 * - Edit: Undo, Redo, Bold, Italic, Underline
 * - View: Panel Focus (1/2/3), Preview Toggle
 * - Navigation: Chapter Navigation (Up/Down)
 */
export const AppWithShortcuts: React.FC = () => {
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [focusedPanel, setFocusedPanel] = useState<number>(1);
  const [lastAction, setLastAction] = useState<string>('');
  const [textFormatting, setTextFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  // File shortcuts
  const fileShortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrl: true,
      description: 'New Document',
      action: useCallback(() => {
        setLastAction('New Document');
        console.log('Creating new document...');
      }, []),
    },
    {
      key: 'o',
      ctrl: true,
      description: 'Open Document',
      action: useCallback(() => {
        setLastAction('Open Document');
        console.log('Opening document...');
      }, []),
    },
    {
      key: 's',
      ctrl: true,
      description: 'Save Document',
      action: useCallback(() => {
        setLastAction('Save Document');
        console.log('Saving document...');
      }, []),
    },
    {
      key: 'e',
      ctrl: true,
      description: 'Export Document',
      action: useCallback(() => {
        setLastAction('Export Document');
        console.log('Exporting document...');
      }, []),
    },
  ];

  // Edit shortcuts
  const editShortcuts: KeyboardShortcut[] = [
    {
      key: 'z',
      ctrl: true,
      description: 'Undo',
      action: useCallback(() => {
        setLastAction('Undo');
        console.log('Undoing...');
      }, []),
    },
    {
      key: 'y',
      ctrl: true,
      description: 'Redo',
      action: useCallback(() => {
        setLastAction('Redo');
        console.log('Redoing...');
      }, []),
    },
    {
      key: 'b',
      ctrl: true,
      description: 'Toggle Bold',
      action: useCallback(() => {
        setTextFormatting((prev) => ({ ...prev, bold: !prev.bold }));
        setLastAction('Toggle Bold');
      }, []),
    },
    {
      key: 'i',
      ctrl: true,
      description: 'Toggle Italic',
      action: useCallback(() => {
        setTextFormatting((prev) => ({ ...prev, italic: !prev.italic }));
        setLastAction('Toggle Italic');
      }, []),
    },
    {
      key: 'u',
      ctrl: true,
      description: 'Toggle Underline',
      action: useCallback(() => {
        setTextFormatting((prev) => ({ ...prev, underline: !prev.underline }));
        setLastAction('Toggle Underline');
      }, []),
    },
  ];

  // View shortcuts
  const viewShortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      ctrl: true,
      description: 'Focus Panel 1',
      action: useCallback(() => {
        setFocusedPanel(1);
        setLastAction('Focus Panel 1');
      }, []),
    },
    {
      key: '2',
      ctrl: true,
      description: 'Focus Panel 2',
      action: useCallback(() => {
        setFocusedPanel(2);
        setLastAction('Focus Panel 2');
      }, []),
    },
    {
      key: '3',
      ctrl: true,
      description: 'Focus Panel 3',
      action: useCallback(() => {
        setFocusedPanel(3);
        setLastAction('Focus Panel 3');
      }, []),
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Toggle Preview',
      action: useCallback(() => {
        setShowPreview((prev) => !prev);
        setLastAction('Toggle Preview');
      }, []),
    },
  ];

  // Navigation shortcuts
  const navigationShortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowUp',
      ctrl: true,
      description: 'Previous Chapter',
      action: useCallback(() => {
        setLastAction('Navigate to Previous Chapter');
        console.log('Navigating to previous chapter...');
      }, []),
    },
    {
      key: 'ArrowDown',
      ctrl: true,
      description: 'Next Chapter',
      action: useCallback(() => {
        setLastAction('Navigate to Next Chapter');
        console.log('Navigating to next chapter...');
      }, []),
    },
  ];

  // Help shortcut
  const helpShortcut: KeyboardShortcut = {
    key: '/',
    ctrl: true,
    description: 'Show Keyboard Shortcuts',
    action: useCallback(() => {
      setShowShortcutsDialog(true);
    }, []),
  };

  // Combine all shortcuts for the hook
  const allShortcuts = [
    ...fileShortcuts,
    ...editShortcuts,
    ...viewShortcuts,
    ...navigationShortcuts,
    helpShortcut,
  ];

  // Organize shortcuts by category for the dialog
  const shortcutCategories: ShortcutCategory[] = [
    { name: 'File', shortcuts: fileShortcuts },
    { name: 'Edit', shortcuts: editShortcuts },
    { name: 'View', shortcuts: viewShortcuts },
    { name: 'Navigation', shortcuts: navigationShortcuts },
    { name: 'Help', shortcuts: [helpShortcut] },
  ];

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({ shortcuts: allShortcuts });

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Comprehensive Keyboard Shortcuts Demo</h1>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f4f8', borderRadius: '4px' }}>
        <p style={{ margin: 0 }}>
          <strong>Last Action:</strong> {lastAction || 'None'}
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setShowShortcutsDialog(true)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#007bff',
            color: 'white',
          }}
        >
          Show All Shortcuts (Ctrl+/)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Panel 1 */}
        <div style={{
          padding: '15px',
          background: focusedPanel === 1 ? '#d4edda' : '#f0f0f0',
          borderRadius: '4px',
          border: focusedPanel === 1 ? '2px solid #28a745' : '2px solid transparent',
        }}>
          <h3>Panel 1 {focusedPanel === 1 && '(Focused)'}</h3>
          <p>Press <kbd>Ctrl+1</kbd> to focus this panel</p>
          <p><strong>Text Formatting:</strong></p>
          <ul>
            <li>Bold: {textFormatting.bold ? '✓' : '✗'} (Ctrl+B)</li>
            <li>Italic: {textFormatting.italic ? '✓' : '✗'} (Ctrl+I)</li>
            <li>Underline: {textFormatting.underline ? '✓' : '✗'} (Ctrl+U)</li>
          </ul>
        </div>

        {/* Panel 2 */}
        <div style={{
          padding: '15px',
          background: focusedPanel === 2 ? '#d4edda' : '#f0f0f0',
          borderRadius: '4px',
          border: focusedPanel === 2 ? '2px solid #28a745' : '2px solid transparent',
        }}>
          <h3>Panel 2 {focusedPanel === 2 && '(Focused)'}</h3>
          <p>Press <kbd>Ctrl+2</kbd> to focus this panel</p>
          <p><strong>File Operations:</strong></p>
          <ul>
            <li>New: Ctrl+N</li>
            <li>Open: Ctrl+O</li>
            <li>Save: Ctrl+S</li>
            <li>Export: Ctrl+E</li>
          </ul>
        </div>

        {/* Panel 3 */}
        <div style={{
          padding: '15px',
          background: focusedPanel === 3 ? '#d4edda' : '#f0f0f0',
          borderRadius: '4px',
          border: focusedPanel === 3 ? '2px solid #28a745' : '2px solid transparent',
        }}>
          <h3>Panel 3 {focusedPanel === 3 && '(Focused)'}</h3>
          <p>Press <kbd>Ctrl+3</kbd> to focus this panel</p>
          <p><strong>Navigation:</strong></p>
          <ul>
            <li>Previous Chapter: Ctrl+↑</li>
            <li>Next Chapter: Ctrl+↓</li>
          </ul>
        </div>
      </div>

      {showPreview && (
        <div style={{
          padding: '15px',
          background: '#fff3cd',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #ffc107',
        }}>
          <h3>Preview Panel (Ctrl+P to toggle)</h3>
          <p>This is the preview panel showing your content.</p>
          <p><strong>Edit Commands:</strong> Undo (Ctrl+Z) | Redo (Ctrl+Y)</p>
        </div>
      )}

      <ShortcutsDialog
        isOpen={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
        categories={shortcutCategories}
      />
    </div>
  );
};

export default AppWithShortcuts;

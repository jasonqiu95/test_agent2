import React from 'react';
import { KeyboardShortcut, formatShortcut } from '../../hooks/useKeyboardShortcuts';
import './ShortcutsDialog.css';

export interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  title?: string;
}

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({
  isOpen,
  onClose,
  shortcuts,
  title = 'Keyboard Shortcuts',
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="shortcuts-dialog-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
    >
      <div className="shortcuts-dialog">
        <div className="shortcuts-dialog-header">
          <h2 id="shortcuts-dialog-title">{title}</h2>
          <button
            className="shortcuts-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="shortcuts-dialog-content">
          <table className="shortcuts-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Shortcut</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr key={index}>
                  <td className="shortcut-description">{shortcut.description}</td>
                  <td className="shortcut-keys">
                    <kbd>{formatShortcut(shortcut)}</kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

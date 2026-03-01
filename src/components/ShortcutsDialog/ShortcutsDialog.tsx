import React from 'react';
import { KeyboardShortcut, formatShortcut } from '../../hooks/useKeyboardShortcuts';
import './ShortcutsDialog.css';

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

export interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
  categories?: ShortcutCategory[];
  title?: string;
}

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({
  isOpen,
  onClose,
  shortcuts,
  categories,
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

  // Use categories if provided, otherwise create a single category from shortcuts
  const displayCategories: ShortcutCategory[] = categories || (shortcuts ? [{ name: '', shortcuts }] : []);

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
          {displayCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="shortcuts-category">
              {category.name && (
                <h3 className="shortcuts-category-title">{category.name}</h3>
              )}
              <table className="shortcuts-table">
                {!category.name && (
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Shortcut</th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {category.shortcuts.map((shortcut, index) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};

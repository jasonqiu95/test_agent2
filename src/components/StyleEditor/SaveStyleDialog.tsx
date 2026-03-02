import React, { useState, useEffect } from 'react';
import './SaveStyleDialog.css';

export interface SaveStyleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  defaultName?: string;
  defaultDescription?: string;
}

export const SaveStyleDialog: React.FC<SaveStyleDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
  defaultDescription = '',
}) => {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setDescription(defaultDescription);
      setError('');
    }
  }, [isOpen, defaultName, defaultDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Style name is required');
      return;
    }

    if (trimmedName.length < 3) {
      setError('Style name must be at least 3 characters');
      return;
    }

    onSave(trimmedName, description.trim());
    onClose();
  };

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

  if (!isOpen) return null;

  return (
    <div
      className="save-style-dialog-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-style-dialog-title"
    >
      <div className="save-style-dialog">
        <div className="save-style-dialog__header">
          <h2 id="save-style-dialog-title">Save Custom Style</h2>
          <button
            className="save-style-dialog__close"
            onClick={onClose}
            aria-label="Close dialog"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="save-style-dialog__content">
            {error && (
              <div className="save-style-dialog__error">
                {error}
              </div>
            )}

            <div className="save-style-dialog__field">
              <label htmlFor="style-name" className="save-style-dialog__label">
                Style Name *
              </label>
              <input
                id="style-name"
                type="text"
                className="save-style-dialog__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Custom Style"
                autoFocus
                required
              />
            </div>

            <div className="save-style-dialog__field">
              <label htmlFor="style-description" className="save-style-dialog__label">
                Description (optional)
              </label>
              <textarea
                id="style-description"
                className="save-style-dialog__textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your custom style"
                rows={3}
              />
            </div>
          </div>

          <div className="save-style-dialog__footer">
            <button
              type="button"
              className="save-style-dialog__btn save-style-dialog__btn--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-style-dialog__btn save-style-dialog__btn--primary"
            >
              Save Style
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

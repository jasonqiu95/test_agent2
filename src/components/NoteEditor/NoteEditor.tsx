import React, { useState, useEffect, useRef } from 'react';
import './NoteEditor.css';

export interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (content: string) => void;
  noteNumber?: number;
  noteType?: string;
  initialContent?: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  noteNumber,
  noteType = 'Note',
  initialContent = '',
}) => {
  const [content, setContent] = useState(initialContent);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Sync content with initialContent when it changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Focus content area when dialog opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

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

  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const noteTitle = noteNumber ? `${noteType} ${noteNumber}` : noteType;

  return (
    <div
      className="note-editor-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-editor-title"
    >
      <div className="note-editor">
        <div className="note-editor-header">
          <div className="note-editor-title-group">
            <h2 id="note-editor-title">{noteTitle}</h2>
            {noteType && (
              <span className="note-editor-type-badge">{noteType}</span>
            )}
          </div>
          <button
            className="note-editor-close"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        <div className="note-editor-body">
          <div className="note-editor-content">
            <textarea
              ref={contentRef}
              className="note-editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter note content..."
              aria-label="Note content"
            />
          </div>
        </div>

        <div className="note-editor-footer">
          <div className="note-editor-footer-left">
            <span className="note-editor-char-count">
              {content.length} characters
            </span>
          </div>
          <div className="note-editor-footer-right">
            <button
              className="note-editor-btn note-editor-btn-secondary"
              onClick={handleCancel}
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              className="note-editor-btn note-editor-btn-primary"
              onClick={handleSave}
              aria-label="Save note"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

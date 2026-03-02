import React from 'react';
import './EditorPanel.css';

export interface EditorPanelProps {
  /** Title displayed in the panel header */
  title?: string;
  /** Content to be rendered in the editor area */
  children?: React.ReactNode;
  /** Optional toolbar content */
  toolbar?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Callback when panel is closed */
  onClose?: () => void;
}

/**
 * EditorPanel component - Main editor container for the Vellum 3-panel layout
 *
 * This component provides the structure for the central editor panel, including:
 * - Header with title
 * - Toolbar area for editor controls
 * - Content area for editor
 * - Optional footer
 */
export const EditorPanel: React.FC<EditorPanelProps> = ({
  title = 'Editor',
  children,
  toolbar,
  footer,
  className = '',
  onClose,
}) => {
  return (
    <div className={`editor-panel ${className}`}>
      <div className="editor-panel-header">
        <h2 className="editor-panel-title">{title}</h2>
        {onClose && (
          <button
            className="editor-panel-close"
            onClick={onClose}
            aria-label="Close editor panel"
          >
            ×
          </button>
        )}
      </div>

      {toolbar && (
        <div className="editor-panel-toolbar">
          {toolbar}
        </div>
      )}

      <div className="editor-panel-content">
        {children || (
          <div className="editor-panel-placeholder">
            No content loaded
          </div>
        )}
      </div>

      {footer && (
        <div className="editor-panel-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default EditorPanel;

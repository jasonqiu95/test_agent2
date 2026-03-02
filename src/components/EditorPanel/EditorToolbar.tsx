/**
 * EditorToolbar Component
 * Formatting toolbar with text controls for the editor
 */

import React, { useEffect, useState } from 'react';
import { EditorView } from 'prosemirror-view';
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setHeading,
  setParagraph,
  isBoldActive,
  isItalicActive,
  isUnderlineActive,
  isHeadingActive,
} from '../../editor/commands';
import './EditorToolbar.css';

export interface EditorToolbarProps {
  /** ProseMirror editor view instance */
  editorView: EditorView | null;
  /** Additional CSS class names */
  className?: string;
}

interface ToolbarButton {
  id: string;
  label: string;
  title: string;
  icon: string;
  command: () => void;
  isActive: () => boolean;
  shortcut: string;
}

/**
 * EditorToolbar component for text formatting controls
 *
 * Provides buttons for:
 * - Bold, Italic, Underline
 * - Heading levels (H1-H6)
 * - Active state indicators
 * - Keyboard shortcut tooltips
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editorView,
  className = '',
}) => {
  const [, forceUpdate] = useState({});

  // Update toolbar state on editor changes
  useEffect(() => {
    if (!editorView) return;

    const updateToolbar = () => {
      forceUpdate({});
    };

    // Listen to editor updates
    const handleUpdate = () => {
      updateToolbar();
    };

    // Set up a mutation observer to detect selection changes
    const observer = new MutationObserver(updateToolbar);
    observer.observe(editorView.dom, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Also listen to selection changes
    document.addEventListener('selectionchange', updateToolbar);

    return () => {
      observer.disconnect();
      document.removeEventListener('selectionchange', updateToolbar);
    };
  }, [editorView]);

  if (!editorView) {
    return null;
  }

  const state = editorView.state;

  /**
   * Execute a command on the editor
   */
  const executeCommand = (command: any) => {
    command(state, editorView.dispatch, editorView);
    editorView.focus();
  };

  // Text formatting buttons
  const textButtons: ToolbarButton[] = [
    {
      id: 'bold',
      label: 'Bold',
      title: 'Bold',
      icon: 'B',
      command: () => executeCommand(toggleBold),
      isActive: () => isBoldActive(state),
      shortcut: 'Ctrl+B',
    },
    {
      id: 'italic',
      label: 'Italic',
      title: 'Italic',
      icon: 'I',
      command: () => executeCommand(toggleItalic),
      isActive: () => isItalicActive(state),
      shortcut: 'Ctrl+I',
    },
    {
      id: 'underline',
      label: 'Underline',
      title: 'Underline',
      icon: 'U',
      command: () => executeCommand(toggleUnderline),
      isActive: () => isUnderlineActive(state),
      shortcut: 'Ctrl+U',
    },
  ];

  // Heading level buttons
  const headingButtons: ToolbarButton[] = [
    {
      id: 'h1',
      label: 'H1',
      title: 'Heading 1',
      icon: 'H1',
      command: () => executeCommand(setHeading(1)),
      isActive: () => isHeadingActive(state, 1),
      shortcut: 'Ctrl+Alt+1',
    },
    {
      id: 'h2',
      label: 'H2',
      title: 'Heading 2',
      icon: 'H2',
      command: () => executeCommand(setHeading(2)),
      isActive: () => isHeadingActive(state, 2),
      shortcut: 'Ctrl+Alt+2',
    },
    {
      id: 'h3',
      label: 'H3',
      title: 'Heading 3',
      icon: 'H3',
      command: () => executeCommand(setHeading(3)),
      isActive: () => isHeadingActive(state, 3),
      shortcut: 'Ctrl+Alt+3',
    },
    {
      id: 'h4',
      label: 'H4',
      title: 'Heading 4',
      icon: 'H4',
      command: () => executeCommand(setHeading(4)),
      isActive: () => isHeadingActive(state, 4),
      shortcut: 'Ctrl+Alt+4',
    },
    {
      id: 'h5',
      label: 'H5',
      title: 'Heading 5',
      icon: 'H5',
      command: () => executeCommand(setHeading(5)),
      isActive: () => isHeadingActive(state, 5),
      shortcut: 'Ctrl+Alt+5',
    },
    {
      id: 'h6',
      label: 'H6',
      title: 'Heading 6',
      icon: 'H6',
      command: () => executeCommand(setHeading(6)),
      isActive: () => isHeadingActive(state, 6),
      shortcut: 'Ctrl+Alt+6',
    },
  ];

  return (
    <div className={`editor-toolbar-formatting ${className}`}>
      {/* Text formatting section */}
      <div className="toolbar-section">
        {textButtons.map((button) => (
          <button
            key={button.id}
            className={`toolbar-btn ${button.isActive() ? 'active' : ''}`}
            onClick={button.command}
            title={`${button.title} (${button.shortcut})`}
            aria-label={button.label}
            aria-pressed={button.isActive()}
            type="button"
          >
            <span className={`toolbar-icon toolbar-icon-${button.id}`}>
              {button.icon}
            </span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="toolbar-divider" />

      {/* Heading levels section */}
      <div className="toolbar-section">
        {headingButtons.map((button) => (
          <button
            key={button.id}
            className={`toolbar-btn toolbar-btn-heading ${button.isActive() ? 'active' : ''}`}
            onClick={button.command}
            title={`${button.title} (${button.shortcut})`}
            aria-label={button.label}
            aria-pressed={button.isActive()}
            type="button"
          >
            <span className="toolbar-icon toolbar-icon-heading">
              {button.icon}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EditorToolbar;

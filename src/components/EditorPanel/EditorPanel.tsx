import React, { useRef, useEffect, useState } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node as PMNode } from 'prosemirror-model';
import { editorSchema } from '../../editor/schema';
import { createDefaultPlugins } from '../../editor/plugins';
import { createEmptyDocument } from '../../editor/serialization';
import type { EditorInstance, EditorHandlers } from '../../editor/types';
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
  /** Initial content for the editor */
  content?: any;
  /** Whether the editor is editable */
  editable?: boolean;
  /** Event handlers for the editor */
  handlers?: EditorHandlers;
  /** Auto-focus the editor on mount */
  autoFocus?: boolean;
}

/**
 * EditorPanel component - Main editor container for the Vellum 3-panel layout
 *
 * This component provides the structure for the central editor panel, including:
 * - Header with title
 * - Toolbar area for editor controls
 * - Content area for ProseMirror editor
 * - Optional footer
 * - Editor initialization and lifecycle management
 */
export const EditorPanel: React.FC<EditorPanelProps> = ({
  title = 'Editor',
  children,
  toolbar,
  footer,
  className = '',
  onClose,
  content,
  editable = true,
  handlers,
  autoFocus = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);

  // Initialize editor on mount
  useEffect(() => {
    if (!editorRef.current) return;

    // Create initial document
    const doc = content ? editorSchema.nodeFromJSON(content) : createEmptyDocument(editorSchema);

    // Create plugins
    const plugins = createDefaultPlugins(editorSchema, {
      historyDepth: 100,
      newGroupDelay: 500,
    });

    // Create editor state
    const state = EditorState.create({
      doc,
      schema: editorSchema,
      plugins,
    });

    // Create editor view
    const view = new EditorView(editorRef.current, {
      state,
      editable: () => editable,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        // Call onChange handler
        if (handlers?.onChange && transaction.docChanged) {
          handlers.onChange({
            state: newState,
            transaction,
            content: newState.doc,
          });
        }

        // Call onUpdate handler
        if (handlers?.onUpdate) {
          handlers.onUpdate(view);
        }
      },
      handleDOMEvents: {
        focus: () => {
          handlers?.onFocus?.();
          return false;
        },
        blur: () => {
          handlers?.onBlur?.();
          return false;
        },
      },
    });

    // Store view reference
    viewRef.current = view;

    // Create editor instance API
    const instance: EditorInstance = {
      view,
      state: view.state,
      schema: editorSchema,
      destroy: () => {
        view.destroy();
      },
      getContent: () => {
        return view.state.doc;
      },
      setContent: (newContent) => {
        let doc: PMNode;
        if (typeof newContent === 'object' && newContent !== null && 'type' in newContent && 'nodeSize' in newContent) {
          doc = newContent as PMNode;
        } else {
          doc = editorSchema.nodeFromJSON(newContent);
        }
        const newState = EditorState.create({
          doc,
          schema: editorSchema,
          plugins,
        });
        view.updateState(newState);
      },
      focus: () => {
        view.focus();
      },
      blur: () => {
        view.dom.blur();
      },
      isEmpty: () => {
        const doc = view.state.doc;
        return doc.childCount === 1 &&
               doc.firstChild?.type.name === 'paragraph' &&
               doc.firstChild.content.size === 0;
      },
    };

    setEditorInstance(instance);

    // Auto-focus if requested
    if (autoFocus) {
      setTimeout(() => view.focus(), 0);
    }

    // Cleanup on unmount
    return () => {
      view.destroy();
      viewRef.current = null;
      setEditorInstance(null);
    };
  }, []); // Only run on mount

  // Update editable state when prop changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.setProps({ editable: () => editable });
    }
  }, [editable]);

  // Update content when prop changes
  useEffect(() => {
    if (content && editorInstance) {
      editorInstance.setContent(content);
    }
  }, [content, editorInstance]);

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
          <div
            ref={editorRef}
            className="editor-panel-prosemirror"
          />
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

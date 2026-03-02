import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node as PMNode } from 'prosemirror-model';
import { editorSchema } from '../../editor/schema';
import { createDefaultPlugins } from '../../editor/plugins';
import { createEmptyDocument, serializeToJSON } from '../../editor/serialization';
import type { EditorInstance, EditorHandlers } from '../../editor/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectEditorContent,
  selectActiveChapterId,
  updateEditorContent,
  updateSelection,
  loadChapterContent,
  updateMetadata,
} from '../../store/editorSlice';
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
  /** Initial content for the editor (overrides Redux state if provided) */
  content?: any;
  /** Whether the editor is editable */
  editable?: boolean;
  /** Event handlers for the editor */
  handlers?: EditorHandlers;
  /** Auto-focus the editor on mount */
  autoFocus?: boolean;
  /** Chapter ID for Redux integration */
  chapterId?: string;
  /** Debounce delay in milliseconds for Redux updates (default: 300) */
  debounceDelay?: number;
  /** Use Redux for state management (default: true) */
  useRedux?: boolean;
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
 * - Redux integration for controlled component pattern
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
  chapterId,
  debounceDelay = 300,
  useRedux = true,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Redux integration
  const dispatch = useAppDispatch();
  const reduxContent = useAppSelector(selectEditorContent);
  const activeChapterId = useAppSelector(selectActiveChapterId);

  // Determine effective content source
  const effectiveContent = useMemo(() => {
    if (!useRedux) return content;
    if (content) return content; // Explicit prop overrides Redux
    if (chapterId && chapterId === activeChapterId) return reduxContent;
    return null;
  }, [useRedux, content, chapterId, activeChapterId, reduxContent]);

  // Helper to calculate metadata from document
  const calculateMetadata = useCallback((doc: PMNode) => {
    let wordCount = 0;
    let characterCount = 0;

    doc.descendants((node) => {
      if (node.isText && node.text) {
        characterCount += node.text.length;
        wordCount += node.text.split(/\s+/).filter(Boolean).length;
      }
    });

    const isEmpty =
      doc.childCount === 1 &&
      doc.firstChild?.type.name === 'paragraph' &&
      doc.firstChild.content.size === 0;

    return { wordCount, characterCount, isEmpty };
  }, []);

  // Debounced Redux dispatch
  const debouncedDispatch = useCallback(
    (doc: PMNode) => {
      if (!useRedux || !chapterId) return;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        const contentJSON = serializeToJSON(doc);
        const metadata = calculateMetadata(doc);

        dispatch(
          updateEditorContent({
            content: contentJSON,
            metadata,
          })
        );
      }, debounceDelay);
    },
    [useRedux, chapterId, debounceDelay, dispatch, calculateMetadata]
  );

  // Initialize editor on mount
  useEffect(() => {
    if (!editorRef.current) return;

    // Create initial document
    const doc = effectiveContent
      ? editorSchema.nodeFromJSON(effectiveContent)
      : createEmptyDocument(editorSchema);

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

        // Update Redux store with debouncing
        if (transaction.docChanged) {
          debouncedDispatch(newState.doc);

          // Update selection in Redux (not debounced)
          if (useRedux && chapterId) {
            dispatch(
              updateSelection({
                anchor: newState.selection.anchor,
                head: newState.selection.head,
              })
            );
          }
        }

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
        if (
          typeof newContent === 'object' &&
          newContent !== null &&
          'type' in newContent &&
          'nodeSize' in newContent
        ) {
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
        return (
          doc.childCount === 1 &&
          doc.firstChild?.type.name === 'paragraph' &&
          doc.firstChild.content.size === 0
        );
      },
    };

    setEditorInstance(instance);

    // Load chapter content into Redux if using Redux and chapterId is provided
    if (useRedux && chapterId && effectiveContent) {
      const metadata = calculateMetadata(doc);
      dispatch(
        loadChapterContent({
          chapterId,
          content: serializeToJSON(doc),
          metadata,
        })
      );
    }

    // Auto-focus if requested
    if (autoFocus) {
      setTimeout(() => view.focus(), 0);
    }

    // Cleanup on unmount
    return () => {
      // Clear any pending debounced updates
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

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

  // Update content when effective content changes
  useEffect(() => {
    if (effectiveContent && editorInstance && viewRef.current) {
      // Only update if content is different from current editor content
      const currentContent = serializeToJSON(viewRef.current.state.doc);
      const newContentStr = JSON.stringify(effectiveContent);
      const currentContentStr = JSON.stringify(currentContent);

      if (newContentStr !== currentContentStr) {
        editorInstance.setContent(effectiveContent);

        // Update metadata in Redux if using Redux
        if (useRedux && chapterId) {
          const metadata = calculateMetadata(viewRef.current.state.doc);
          dispatch(updateMetadata(metadata));
        }
      }
    }
  }, [effectiveContent, editorInstance, useRedux, chapterId, calculateMetadata, dispatch]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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

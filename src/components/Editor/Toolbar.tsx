/**
 * Text Formatting Toolbar Component
 * Provides rich text formatting controls with selection-aware state
 */

import React from 'react';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { toggleBlockquote, toggleVerse, isBlockquoteActive, isVerseActive } from '../../editor/commands';

export interface ToolbarProps {
  editorView: EditorView | null;
  onFormat?: (format: string) => void;
}

export interface FormatState {
  bold: boolean;
  italic: boolean;
  code: boolean;
  blockquote: boolean;
  verse: boolean;
  hasSelection: boolean;
}

/**
 * Get the active format state from the current selection
 */
export function getFormatState(state: EditorState): FormatState {
  const { from, to, empty } = state.selection;
  const hasSelection = !empty;

  // Check block-level formatting
  const blockquote = isBlockquoteActive(state);
  const verse = isVerseActive(state);

  // For collapsed selection (cursor), check stored marks
  if (empty) {
    const storedMarks = state.storedMarks || state.selection.$from.marks();
    return {
      bold: storedMarks.some(mark => mark.type.name === 'strong'),
      italic: storedMarks.some(mark => mark.type.name === 'em'),
      code: storedMarks.some(mark => mark.type.name === 'code'),
      blockquote,
      verse,
      hasSelection: false,
    };
  }

  // For ranges, check if mark is present throughout
  const { doc, schema } = state;
  const strongMark = schema.marks.strong;
  const emMark = schema.marks.em;
  const codeMark = schema.marks.code;

  return {
    bold: strongMark ? doc.rangeHasMark(from, to, strongMark) : false,
    italic: emMark ? doc.rangeHasMark(from, to, emMark) : false,
    code: codeMark ? doc.rangeHasMark(from, to, codeMark) : false,
    blockquote,
    verse,
    hasSelection,
  };
}

/**
 * Toggle a mark (format) on the current selection
 */
export function toggleFormat(view: EditorView, markType: string): void {
  const { state, dispatch } = view;
  const mark = state.schema.marks[markType];

  if (!mark) {
    console.warn(`Mark type "${markType}" not found in schema`);
    return;
  }

  const { from, to } = state.selection;
  const hasMark = state.doc.rangeHasMark(from, to, mark);

  const tr = hasMark
    ? state.tr.removeMark(from, to, mark)
    : state.tr.addMark(from, to, mark.create());

  dispatch(tr);
}

export const Toolbar: React.FC<ToolbarProps> = ({ editorView, onFormat }) => {
  const [formatState, setFormatState] = React.useState<FormatState>({
    bold: false,
    italic: false,
    code: false,
    blockquote: false,
    verse: false,
    hasSelection: false,
  });

  // Update format state when editor view changes
  React.useEffect(() => {
    if (!editorView) {
      setFormatState({
        bold: false,
        italic: false,
        code: false,
        blockquote: false,
        verse: false,
        hasSelection: false,
      });
      return;
    }

    const updateFormatState = () => {
      const newState = getFormatState(editorView.state);
      setFormatState(newState);
    };

    // Initial update
    updateFormatState();

    // Listen to state changes
    const originalDispatch = editorView.dispatch;
    editorView.dispatch = (tr) => {
      originalDispatch.call(editorView, tr);
      updateFormatState();
    };

    return () => {
      editorView.dispatch = originalDispatch;
    };
  }, [editorView]);

  const handleFormat = (format: string) => {
    if (editorView) {
      toggleFormat(editorView, format);
      onFormat?.(format);
    }
  };

  const handleBold = () => handleFormat('strong');
  const handleItalic = () => handleFormat('em');
  const handleCode = () => handleFormat('code');

  const handleBlockquote = () => {
    if (editorView) {
      const command = toggleBlockquote(editorView.state.schema);
      command(editorView.state, editorView.dispatch);
      onFormat?.('blockquote');
    }
  };

  const handleVerse = () => {
    if (editorView) {
      const command = toggleVerse(editorView.state.schema);
      command(editorView.state, editorView.dispatch);
      onFormat?.('verse');
    }
  };

  return (
    <div className="formatting-toolbar" data-testid="formatting-toolbar">
      <button
        className={`toolbar-btn toolbar-btn-bold ${formatState.bold ? 'active' : ''}`}
        onClick={handleBold}
        disabled={!editorView}
        title="Bold (Ctrl+B)"
        data-testid="btn-bold"
        aria-pressed={formatState.bold}
      >
        <strong>B</strong>
      </button>

      <button
        className={`toolbar-btn toolbar-btn-italic ${formatState.italic ? 'active' : ''}`}
        onClick={handleItalic}
        disabled={!editorView}
        title="Italic (Ctrl+I)"
        data-testid="btn-italic"
        aria-pressed={formatState.italic}
      >
        <em>I</em>
      </button>

      <button
        className={`toolbar-btn toolbar-btn-code ${formatState.code ? 'active' : ''}`}
        onClick={handleCode}
        disabled={!editorView}
        title="Code"
        data-testid="btn-code"
        aria-pressed={formatState.code}
      >
        <code>&lt;/&gt;</code>
      </button>

      <div className="toolbar-divider" />

      <button
        className={`toolbar-btn toolbar-btn-blockquote ${formatState.blockquote ? 'active' : ''}`}
        onClick={handleBlockquote}
        disabled={!editorView}
        title="Blockquote (Ctrl+Shift+9)"
        data-testid="btn-blockquote"
        aria-pressed={formatState.blockquote}
      >
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.2em' }}>"</span>
      </button>

      <button
        className={`toolbar-btn toolbar-btn-verse ${formatState.verse ? 'active' : ''}`}
        onClick={handleVerse}
        disabled={!editorView}
        title="Verse (Ctrl+Shift+V)"
        data-testid="btn-verse"
        aria-pressed={formatState.verse}
      >
        <span style={{ fontFamily: 'serif', fontSize: '0.9em' }}>⋮</span>
      </button>

      <div className="toolbar-status" data-testid="toolbar-status">
        {formatState.hasSelection ? 'Selection' : 'Cursor'}
      </div>
    </div>
  );
};

/**
 * Text Formatting Toolbar Component
 * Provides rich text formatting controls with selection-aware state
 */

import React from 'react';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';

export interface ToolbarProps {
  editorView: EditorView | null;
  onFormat?: (format: string) => void;
}

export interface FormatState {
  bold: boolean;
  italic: boolean;
  code: boolean;
  hasSelection: boolean;
}

/**
 * Get the active format state from the current selection
 */
export function getFormatState(state: EditorState): FormatState {
  const { from, to, empty } = state.selection;
  const hasSelection = !empty;

  // For collapsed selection (cursor), check stored marks
  if (empty) {
    const storedMarks = state.storedMarks || state.selection.$from.marks();
    return {
      bold: storedMarks.some(mark => mark.type.name === 'strong'),
      italic: storedMarks.some(mark => mark.type.name === 'em'),
      code: storedMarks.some(mark => mark.type.name === 'code'),
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
    hasSelection: false,
  });

  // Update format state when editor view changes
  React.useEffect(() => {
    if (!editorView) {
      setFormatState({
        bold: false,
        italic: false,
        code: false,
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

      <div className="toolbar-status" data-testid="toolbar-status">
        {formatState.hasSelection ? 'Selection' : 'Cursor'}
      </div>
    </div>
  );
};

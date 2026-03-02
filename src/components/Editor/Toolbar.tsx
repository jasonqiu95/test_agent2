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
  headingLevel: number | null; // 0 for paragraph, 1-6 for headings
}

/**
 * Get the active format state from the current selection
 */
export function getFormatState(state: EditorState): FormatState {
  const { from, to, empty, $from } = state.selection;
  const hasSelection = !empty;

  // Check block-level formatting
  const blockquote = isBlockquoteActive(state);
  const verse = isVerseActive(state);

  // Get heading level from current block
  const currentBlock = $from.parent;
  let headingLevel: number | null = null;

  if (currentBlock.type.name === 'heading') {
    headingLevel = currentBlock.attrs.level;
  } else if (currentBlock.type.name === 'paragraph') {
    headingLevel = 0; // 0 indicates paragraph
  }

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
      headingLevel,
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
    headingLevel,
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

/**
 * Set the block type to a specific heading level or paragraph
 * @param view - The editor view
 * @param level - Heading level (0 for paragraph, 1-6 for headings)
 */
export function setBlockHeading(view: EditorView, level: number): void {
  const { state, dispatch } = view;
  const { $from, $to } = state.selection;

  if (level === 0) {
    // Convert to paragraph
    const paragraphType = state.schema.nodes.paragraph;
    if (!paragraphType) return;

    const range = $from.blockRange($to);
    if (!range) return;

    const tr = state.tr.setBlockType(range.start, range.end, paragraphType);
    dispatch(tr);
  } else if (level >= 1 && level <= 6) {
    // Convert to heading
    const headingType = state.schema.nodes.heading;
    if (!headingType) return;

    const range = $from.blockRange($to);
    if (!range) return;

    const tr = state.tr.setBlockType(range.start, range.end, headingType, { level });
    dispatch(tr);
  }
}

export const Toolbar: React.FC<ToolbarProps> = ({ editorView, onFormat }) => {
  const [formatState, setFormatState] = React.useState<FormatState>({
    bold: false,
    italic: false,
    code: false,
    blockquote: false,
    verse: false,
    hasSelection: false,
    headingLevel: null,
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
        headingLevel: null,
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

  const handleHeadingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (editorView) {
      const level = parseInt(event.target.value, 10);
      setBlockHeading(editorView, level);
      onFormat?.(`heading-${level}`);
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

  // Determine selected value for dropdown
  const getHeadingValue = () => {
    if (formatState.headingLevel === 0) return '0';
    if (formatState.headingLevel !== null && formatState.headingLevel >= 1 && formatState.headingLevel <= 6) {
      return formatState.headingLevel.toString();
    }
    return '';
  };

  return (
    <div className="formatting-toolbar" data-testid="formatting-toolbar">
      <select
        className="toolbar-select toolbar-heading-select"
        value={getHeadingValue()}
        onChange={handleHeadingChange}
        disabled={!editorView}
        title="Text Style"
        data-testid="heading-select"
      >
        <option value="" disabled>Style</option>
        <option value="0">Paragraph</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
        <option value="5">Heading 5</option>
        <option value="6">Heading 6</option>
      </select>

      <div className="toolbar-separator" />

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

/**
 * Editor formatting commands
 * Functions to apply formatting to selected text or blocks
 */

import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { toggleMark, setBlockType } from 'prosemirror-commands';
import { MarkType as Mark } from 'prosemirror-model';
import { MarkType, NodeType } from './types';

/**
 * Command function type for ProseMirror
 */
export type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView
) => boolean;

/**
 * Toggle bold formatting
 */
export function toggleBold(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const markType = state.schema.marks[MarkType.BOLD];
  if (!markType) return false;
  return toggleMark(markType)(state, dispatch);
}

/**
 * Toggle italic formatting
 */
export function toggleItalic(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const markType = state.schema.marks[MarkType.ITALIC];
  if (!markType) return false;
  return toggleMark(markType)(state, dispatch);
}

/**
 * Toggle underline formatting
 */
export function toggleUnderline(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const markType = state.schema.marks[MarkType.UNDERLINE];
  if (!markType) return false;
  return toggleMark(markType)(state, dispatch);
}

/**
 * Set heading level (H1-H6)
 */
export function setHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const nodeType = state.schema.nodes[NodeType.HEADING];
    if (!nodeType) return false;
    return setBlockType(nodeType, { level })(state, dispatch);
  };
}

/**
 * Set paragraph (removes heading)
 */
export function setParagraph(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const nodeType = state.schema.nodes[NodeType.PARAGRAPH];
  if (!nodeType) return false;
  return setBlockType(nodeType)(state, dispatch);
}

/**
 * Check if a mark is active in the current selection
 */
export function isMarkActive(state: EditorState, markType: MarkType): boolean {
  const type = state.schema.marks[markType];
  if (!type) return false;

  const { from, $from, to, empty } = state.selection;

  if (empty) {
    // For empty selection, check stored marks or marks at cursor position
    return !!type.isInSet(state.storedMarks || $from.marks());
  }

  // For non-empty selection, check if mark is present throughout the selection
  return state.doc.rangeHasMark(from, to, type);
}

/**
 * Check if bold is active
 */
export function isBoldActive(state: EditorState): boolean {
  return isMarkActive(state, MarkType.BOLD);
}

/**
 * Check if italic is active
 */
export function isItalicActive(state: EditorState): boolean {
  return isMarkActive(state, MarkType.ITALIC);
}

/**
 * Check if underline is active
 */
export function isUnderlineActive(state: EditorState): boolean {
  return isMarkActive(state, MarkType.UNDERLINE);
}

/**
 * Get the current heading level, or null if not in a heading
 */
export function getCurrentHeadingLevel(state: EditorState): number | null {
  const { $from } = state.selection;
  const node = $from.parent;

  if (node.type.name === NodeType.HEADING) {
    return node.attrs.level as number;
  }

  return null;
}

/**
 * Check if the current block is a heading with the specified level
 */
export function isHeadingActive(state: EditorState, level: number): boolean {
  return getCurrentHeadingLevel(state) === level;
}

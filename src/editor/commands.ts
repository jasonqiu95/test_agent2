/**
 * Editor commands for text formatting and manipulation
 * Provides functions for formatting marks and converting between block types
 */

import { Command } from 'prosemirror-state';
import { toggleMark, setBlockType, lift, wrapIn } from 'prosemirror-commands';
import { Schema, NodeType as PMNodeType, Node as PMNode } from 'prosemirror-model';
import { MarkType, NodeType } from './types';
import { EditorState } from 'prosemirror-state';

/**
 * Creates a command to toggle bold formatting
 */
export function toggleBold(schema: Schema): Command {
  const markType = schema.marks[MarkType.BOLD];
  if (!markType) {
    return () => false;
  }
  return toggleMark(markType);
}

/**
 * Creates a command to toggle italic formatting
 */
export function toggleItalic(schema: Schema): Command {
  const markType = schema.marks[MarkType.ITALIC];
  if (!markType) {
    return () => false;
  }
  return toggleMark(markType);
}

/**
 * Creates a command to toggle underline formatting
 */
export function toggleUnderline(schema: Schema): Command {
  const markType = schema.marks[MarkType.UNDERLINE];
  if (!markType) {
    return () => false;
  }
  return toggleMark(markType);
}

/**
 * Creates a command to toggle strikethrough formatting
 */
export function toggleStrikethrough(schema: Schema): Command {
  const markType = schema.marks[MarkType.STRIKETHROUGH];
  if (!markType) {
    return () => false;
  }
  return toggleMark(markType);
}

/**
 * Creates a command to toggle code formatting
 */
export function toggleCode(schema: Schema): Command {
  const markType = schema.marks[MarkType.CODE];
  if (!markType) {
    return () => false;
  }
  return toggleMark(markType);
}

/**
 * Check if the current selection is inside a specific node type
 */
function isInsideNodeType(state: EditorState, nodeType: PMNodeType): boolean {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type === nodeType) {
      return true;
    }
  }
  return false;
}

/**
 * Creates a command to toggle blockquote
 * Wraps selection in blockquote if not in one, lifts if already in one
 */
export function toggleBlockquote(schema: Schema): Command {
  const nodeType = schema.nodes[NodeType.BLOCKQUOTE];
  if (!nodeType) {
    return () => false;
  }

  return (state, dispatch) => {
    // Check if we're inside a blockquote
    if (isInsideNodeType(state, nodeType)) {
      // Try to lift out of the blockquote
      return lift(state, dispatch);
    } else {
      // Try to wrap in blockquote
      return wrapIn(nodeType)(state, dispatch);
    }
  };
}

/**
 * Inserts a blockquote at the current position
 */
export function insertBlockquote(schema: Schema): Command {
  const nodeType = schema.nodes[NodeType.BLOCKQUOTE];
  const paragraphType = schema.nodes[NodeType.PARAGRAPH];

  if (!nodeType || !paragraphType) {
    return () => false;
  }

  return (state, dispatch) => {
    const { $from } = state.selection;
    const blockquote = nodeType.create(null, paragraphType.create());

    if (dispatch) {
      const tr = state.tr.replaceSelectionWith(blockquote);
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Check if blockquote is active in the current selection
 */
export function isBlockquoteActive(state: EditorState): boolean {
  const nodeType = state.schema.nodes[NodeType.BLOCKQUOTE];
  if (!nodeType) return false;
  return isInsideNodeType(state, nodeType);
}

/**
 * Creates a command to toggle verse
 * Wraps selection in verse if not in one, lifts if already in one
 */
export function toggleVerse(schema: Schema): Command {
  const verseType = schema.nodes[NodeType.VERSE];
  const verseLineType = schema.nodes[NodeType.VERSE_LINE];

  if (!verseType || !verseLineType) {
    return () => false;
  }

  return (state, dispatch) => {
    // Check if we're inside a verse
    if (isInsideNodeType(state, verseType)) {
      // Try to lift out of the verse
      return lift(state, dispatch);
    } else {
      // Get selected content and convert to verse lines
      const { $from, $to } = state.selection;
      const range = $from.blockRange($to);

      if (!range) return false;

      if (dispatch) {
        const tr = state.tr;
        const verseLines: any[] = [];

        // Convert selected blocks to verse lines
        state.doc.nodesBetween(range.start, range.end, (node, pos) => {
          if (node.isBlock && node.type.name === NodeType.PARAGRAPH) {
            verseLines.push(verseLineType.create(null, node.content));
          }
        });

        // If no verse lines, create one empty verse line
        if (verseLines.length === 0) {
          verseLines.push(verseLineType.create());
        }

        const verse = verseType.create(null, verseLines);
        tr.replaceRangeWith(range.start, range.end, verse);
        dispatch(tr);
      }
      return true;
    }
  };
}

/**
 * Inserts a verse block at the current position
 */
export function insertVerse(schema: Schema): Command {
  const verseType = schema.nodes[NodeType.VERSE];
  const verseLineType = schema.nodes[NodeType.VERSE_LINE];

  if (!verseType || !verseLineType) {
    return () => false;
  }

  return (state, dispatch) => {
    const verseLine = verseLineType.create();
    const verse = verseType.create(null, [verseLine]);

    if (dispatch) {
      const tr = state.tr.replaceSelectionWith(verse);
      dispatch(tr);
    }
    return true;
  };
}

/**
 * Check if verse is active in the current selection
 */
export function isVerseActive(state: EditorState): boolean {
  const nodeType = state.schema.nodes[NodeType.VERSE];
  if (!nodeType) return false;
  return isInsideNodeType(state, nodeType);
}

/**
 * Set the selected block(s) to paragraph type
 * Handles multiple blocks, empty blocks, and list items
 *
 * @returns A ProseMirror command function
 */
export function setParagraph(): Command {
  return (state, dispatch) => {
    const { $from, $to } = state.selection;
    const paragraphType = state.schema.nodes[NodeType.PARAGRAPH];

    if (!paragraphType) {
      return false;
    }

    // Check if we can apply the command
    const range = $from.blockRange($to);
    if (!range) {
      return false;
    }

    // Handle list items specially
    const parentNode = $from.node(range.depth);
    if (parentNode.type.name === NodeType.LIST_ITEM) {
      // Try to lift the list item out first, then convert to paragraph
      if (dispatch) {
        const liftResult = lift(state, dispatch);
        if (liftResult) {
          // After lifting, apply setBlockType in a new transaction
          const tr = state.tr;
          tr.setBlockType(range.start, range.end, paragraphType);
          dispatch(tr);
          return true;
        }
      }
      return false;
    }

    // For other blocks, use standard setBlockType
    return setBlockType(paragraphType)(state, dispatch);
  };
}

/**
 * Set the selected block(s) to a specific heading level
 * Handles multiple blocks, empty blocks, and list items
 *
 * @param level - Heading level (1-6)
 * @returns A ProseMirror command function
 */
export function setHeading(level: 1 | 2 | 3 | 4 | 5 | 6): Command {
  return (state, dispatch) => {
    const { $from, $to } = state.selection;
    const headingType = state.schema.nodes[NodeType.HEADING];

    if (!headingType) {
      return false;
    }

    // Validate level
    if (level < 1 || level > 6) {
      return false;
    }

    // Check if we can apply the command
    const range = $from.blockRange($to);
    if (!range) {
      return false;
    }

    // Handle list items specially
    const parentNode = $from.node(range.depth);
    if (parentNode.type.name === NodeType.LIST_ITEM) {
      // Try to lift the list item out first, then convert to heading
      if (dispatch) {
        const liftResult = lift(state, dispatch);
        if (liftResult) {
          // After lifting, apply setBlockType in a new transaction
          const tr = state.tr;
          tr.setBlockType(range.start, range.end, headingType, { level });
          dispatch(tr);
          return true;
        }
      }
      return false;
    }

    // For other blocks, use standard setBlockType
    return setBlockType(headingType, { level })(state, dispatch);
  };
}

/**
 * Toggle paragraph formatting on the selected block(s)
 * If the current block is a paragraph, do nothing
 * If the current block is another type, convert to paragraph
 *
 * @returns A ProseMirror command function
 */
export function toggleParagraph(): Command {
  return (state, dispatch) => {
    const { $from } = state.selection;
    const paragraphType = state.schema.nodes[NodeType.PARAGRAPH];

    if (!paragraphType) {
      return false;
    }

    // Get the current block node
    const currentBlock = $from.parent;

    // If already a paragraph, do nothing
    if (currentBlock.type === paragraphType) {
      return false;
    }

    // Otherwise, convert to paragraph
    return setParagraph()(state, dispatch);
  };
}

/**
 * Toggle heading formatting on the selected block(s)
 * If the current block is a heading with the same level, convert to paragraph
 * If the current block is a different type, convert to the specified heading level
 *
 * @param level - Heading level (1-6)
 * @returns A ProseMirror command function
 */
export function toggleHeading(level: 1 | 2 | 3 | 4 | 5 | 6): Command {
  return (state, dispatch) => {
    const { $from } = state.selection;
    const headingType = state.schema.nodes[NodeType.HEADING];
    const paragraphType = state.schema.nodes[NodeType.PARAGRAPH];

    if (!headingType || !paragraphType) {
      return false;
    }

    // Validate level
    if (level < 1 || level > 6) {
      return false;
    }

    // Get the current block node
    const currentBlock = $from.parent;

    // If already a heading with the same level, convert to paragraph
    if (currentBlock.type === headingType && currentBlock.attrs.level === level) {
      return setParagraph()(state, dispatch);
    }

    // Otherwise, convert to the specified heading level
    return setHeading(level)(state, dispatch);
  };
}

/**
 * Check if the current selection can be converted to a paragraph
 * Useful for enabling/disabling UI controls
 *
 * @returns Boolean indicating if conversion is possible
 */
export function canSetParagraph(state: any): boolean {
  const { $from, $to } = state.selection;
  const paragraphType = state.schema.nodes[NodeType.PARAGRAPH];

  if (!paragraphType) {
    return false;
  }

  const range = $from.blockRange($to);
  if (!range) {
    return false;
  }

  // Check if setBlockType would work
  return setBlockType(paragraphType)(state, undefined);
}

/**
 * Check if the current selection can be converted to a heading
 * Useful for enabling/disabling UI controls
 *
 * @param level - Heading level (1-6)
 * @returns Boolean indicating if conversion is possible
 */
export function canSetHeading(state: any, level: 1 | 2 | 3 | 4 | 5 | 6): boolean {
  const { $from, $to } = state.selection;
  const headingType = state.schema.nodes[NodeType.HEADING];

  if (!headingType) {
    return false;
  }

  if (level < 1 || level > 6) {
    return false;
  }

  const range = $from.blockRange($to);
  if (!range) {
    return false;
  }

  // Check if setBlockType would work
  return setBlockType(headingType, { level })(state, undefined);
}

/**
 * Check if the current block is a paragraph
 * Useful for updating UI state
 *
 * @returns Boolean indicating if current block is a paragraph
 */
export function isParagraph(state: any): boolean {
  const { $from } = state.selection;
  const paragraphType = state.schema.nodes[NodeType.PARAGRAPH];

  if (!paragraphType) {
    return false;
  }

  return $from.parent.type === paragraphType;
}

/**
 * Check if the current block is a heading with a specific level
 * Useful for updating UI state
 *
 * @param level - Heading level (1-6)
 * @returns Boolean indicating if current block is a heading with the specified level
 */
export function isHeading(state: any, level: 1 | 2 | 3 | 4 | 5 | 6): boolean {
  const { $from } = state.selection;
  const headingType = state.schema.nodes[NodeType.HEADING];

  if (!headingType) {
    return false;
  }

  const currentBlock = $from.parent;
  return currentBlock.type === headingType && currentBlock.attrs.level === level;
}

/**
 * Get the heading level of the current block, if it's a heading
 * Returns null if the current block is not a heading
 *
 * @returns Heading level (1-6) or null
 */
export function getCurrentHeadingLevel(state: any): number | null {
  const { $from } = state.selection;
  const headingType = state.schema.nodes[NodeType.HEADING];

  if (!headingType) {
    return null;
  }

  const currentBlock = $from.parent;
  if (currentBlock.type === headingType) {
    return currentBlock.attrs.level;
  }

  return null;
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
 * Check if the current block is a heading with the specified level
 */
export function isHeadingActive(state: EditorState, level: number): boolean {
  return getCurrentHeadingLevel(state) === level;
}

/**
 * Convert multiple selected blocks to a specific block type
 * Useful for batch operations across selection ranges
 *
 * @param blockTypeName - Name of the block type to convert to
 * @param attrs - Optional attributes for the new block type
 * @returns A ProseMirror command function
 */
export function convertSelectedBlocks(
  blockTypeName: string,
  attrs?: Record<string, any>
): Command {
  return (state, dispatch) => {
    const { $from, $to } = state.selection;
    const blockType = state.schema.nodes[blockTypeName];

    if (!blockType) {
      return false;
    }

    const range = $from.blockRange($to);
    if (!range) {
      return false;
    }

    if (!dispatch) {
      return setBlockType(blockType, attrs)(state, undefined);
    }

    // Apply conversion to all blocks in range
    const tr = state.tr;
    let applied = false;

    state.doc.nodesBetween(range.start, range.end, (node, pos) => {
      if (node.isBlock && node.type !== blockType) {
        tr.setBlockType(pos, pos + node.nodeSize, blockType, attrs);
        applied = true;
      }
      return true;
    });

    if (applied) {
      dispatch(tr);
      return true;
    }

    return false;
  };
}

/**
 * Insert a subheading at the current cursor position
 * Subheadings are heading levels 2-6 (h1 is reserved for chapter titles)
 *
 * @param level - Subheading level (2-6)
 * @returns A ProseMirror command function
 */
export function insertSubheading(level: 2 | 3 | 4 | 5 | 6): Command {
  return (state, dispatch) => {
    const { $from, $to } = state.selection;
    const headingType = state.schema.nodes[NodeType.HEADING];

    if (!headingType) {
      return false;
    }

    // Validate level (must be 2-6 for subheadings)
    if (level < 2 || level > 6) {
      return false;
    }

    if (!dispatch) {
      return true;
    }

    // Create a new heading node
    const heading = headingType.create({ level });

    // Insert the heading at the current position
    const tr = state.tr;
    tr.replaceSelectionWith(heading);
    dispatch(tr);

    return true;
  };
}

/**
 * Insert a scene break at the current cursor position
 * Scene breaks are used to separate scenes within a chapter
 *
 * @param symbol - The symbol to display (default: '* * *')
 * @returns A ProseMirror command function
 */
export function insertSceneBreak(symbol: string = '* * *'): Command {
  return (state, dispatch) => {
    const sceneBreakType = state.schema.nodes[NodeType.SCENE_BREAK];
    if (!sceneBreakType) {
      return false;
    }

    const { $from } = state.selection;

    // Create the scene break node
    const sceneBreak = sceneBreakType.create({ symbol });

    // Insert at the current position
    if (dispatch) {
      const tr = state.tr;
      const pos = $from.after();
      tr.insert(pos, sceneBreak);

      // Move cursor after the scene break
      const newPos = pos + sceneBreak.nodeSize;
      tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newPos)));

      dispatch(tr);
    }

    return true;
  };
}

/**
 * Toggle subheading formatting on the selected block(s)
 * If the current block is a subheading with the same level, convert to paragraph
 * If the current block is another type, convert to the specified subheading level
 *
 * @param level - Subheading level (2-6)
 * @returns A ProseMirror command function
 */
export function toggleSubheading(level: 2 | 3 | 4 | 5 | 6): Command {
  return (state, dispatch) => {
    const { $from } = state.selection;
    const headingType = state.schema.nodes[NodeType.HEADING];
    const paragraphType = state.schema.nodes[NodeType.PARAGRAPH];

    if (!headingType || !paragraphType) {
      return false;
    }

    // Validate level (must be 2-6 for subheadings)
    if (level < 2 || level > 6) {
      return false;
    }

    // Get the current block node
    const currentBlock = $from.parent;

    // If already a heading with the same level, convert to paragraph
    if (currentBlock.type === headingType && currentBlock.attrs.level === level) {
      return setParagraph()(state, dispatch);
    }

    // Otherwise, convert to the specified subheading level
    return setHeading(level)(state, dispatch);
  };
}

/**
 * Insert an ornamental break at the current cursor position
 * Ornamental breaks are decorative section separators
 *
 * @param symbol - The decorative symbol to display (default: '❦')
 * @param style - The style variant (default: 'default')
 * @returns A ProseMirror command function
 */
export function insertOrnamentalBreak(
  symbol: string = '❦',
  style: string = 'default'
): Command {
  return (state, dispatch) => {
    const ornamentalBreakType = state.schema.nodes[NodeType.ORNAMENTAL_BREAK];
    if (!ornamentalBreakType) {
      return false;
    }

    const { $from } = state.selection;

    // Create the ornamental break node
    const ornamentalBreak = ornamentalBreakType.create({ symbol, style });

    // Insert at the current position
    if (dispatch) {
      const tr = state.tr;
      const pos = $from.after();
      tr.insert(pos, ornamentalBreak);

      // Move cursor after the ornamental break
      const newPos = pos + ornamentalBreak.nodeSize;
      tr.setSelection(state.selection.constructor.near(tr.doc.resolve(newPos)));

      dispatch(tr);
    }

    return true;
  };
}

/**
 * Set a subheading level (2-6)
 * Convenience function that calls setHeading with validation
 *
 * @param level - Subheading level (2-6)
 * @returns A ProseMirror command function
 */
export function setSubheading(level: 2 | 3 | 4 | 5 | 6): Command {
  // Validate level
  if (level < 2 || level > 6) {
    return () => false;
  }
  return setHeading(level);
}

/**
 * Find the highest existing marker number of a specific type in the document
 * @param state - Editor state
 * @param markerType - Node type (FOOTNOTE_MARKER or ENDNOTE_MARKER)
 * @returns The highest marker number found, or 0 if none exist
 */
export function findHighestMarkerNumber(state: EditorState, markerType: NodeType): number {
  let highestNumber = 0;
  const nodeType = state.schema.nodes[markerType];

  if (!nodeType) return 0;

  state.doc.descendants((node) => {
    if (node.type === nodeType) {
      const number = node.attrs.number as number;
      if (number > highestNumber) {
        highestNumber = number;
      }
    }
  });

  return highestNumber;
}

/**
 * Generate a unique note ID
 * @param prefix - Prefix for the ID (e.g., 'fn' for footnote, 'en' for endnote)
 * @returns A unique note ID
 */
function generateNoteId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Insert a footnote marker at the current cursor position
 * Automatically assigns the next available number
 * @returns A ProseMirror command function
 */
export function insertFootnoteMarker(): Command {
  return (state, dispatch) => {
    const footnoteMarkerType = state.schema.nodes[NodeType.FOOTNOTE_MARKER];

    if (!footnoteMarkerType) {
      return false;
    }

    const { $from } = state.selection;

    // Check if we can insert an inline node at the current position
    if (!$from.parent.type.spec.content?.includes('inline')) {
      return false;
    }

    // Find the highest existing footnote marker number
    const highestNumber = findHighestMarkerNumber(state, NodeType.FOOTNOTE_MARKER);
    const newNumber = highestNumber + 1;
    const noteId = generateNoteId('fn');

    // Create the footnote marker node
    const footnoteMarker = footnoteMarkerType.create({
      number: newNumber,
      noteId,
    });

    if (dispatch) {
      const tr = state.tr.replaceSelectionWith(footnoteMarker, false);
      dispatch(tr);
    }

    return true;
  };
}

/**
 * Insert an endnote marker at the current cursor position
 * Automatically assigns the next available number
 * @returns A ProseMirror command function
 */
export function insertEndnoteMarker(): Command {
  return (state, dispatch) => {
    const endnoteMarkerType = state.schema.nodes[NodeType.ENDNOTE_MARKER];

    if (!endnoteMarkerType) {
      return false;
    }

    const { $from } = state.selection;

    // Check if we can insert an inline node at the current position
    if (!$from.parent.type.spec.content?.includes('inline')) {
      return false;
    }

    // Find the highest existing endnote marker number
    const highestNumber = findHighestMarkerNumber(state, NodeType.ENDNOTE_MARKER);
    const newNumber = highestNumber + 1;
    const noteId = generateNoteId('en');

    // Create the endnote marker node
    const endnoteMarker = endnoteMarkerType.create({
      number: newNumber,
      noteId,
    });

    if (dispatch) {
      const tr = state.tr.replaceSelectionWith(endnoteMarker, false);
      dispatch(tr);
    }

    return true;
  };
}

/**
 * Renumber all markers of a specific type in the document
 * Used after inserting or deleting markers to maintain sequential numbering
 * @param markerType - Node type (FOOTNOTE_MARKER or ENDNOTE_MARKER)
 * @returns A ProseMirror command function
 */
export function renumberMarkers(markerType: NodeType): Command {
  return (state, dispatch) => {
    const nodeType = state.schema.nodes[markerType];

    if (!nodeType) {
      return false;
    }

    if (!dispatch) {
      return true;
    }

    const tr = state.tr;
    let currentNumber = 1;
    const markerPositions: Array<{ pos: number; node: PMNode }> = [];

    // Collect all marker positions
    state.doc.descendants((node, pos) => {
      if (node.type === nodeType) {
        markerPositions.push({ pos, node });
      }
    });

    // Update each marker with sequential numbering
    markerPositions.forEach(({ pos, node }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        number: currentNumber++,
      });
    });

    if (markerPositions.length > 0) {
      dispatch(tr);
    }

    return true;
  };
}

/**
 * Helper function to create all formatting commands for a schema
 *
 * @param schema - ProseMirror schema
 * @returns Object containing all formatting commands
 */
export function createFormattingCommands(schema: Schema) {
  return {
    toggleBold: toggleBold(schema),
    toggleItalic: toggleItalic(schema),
    toggleUnderline: toggleUnderline(schema),
    toggleStrikethrough: toggleStrikethrough(schema),
    toggleCode: toggleCode(schema),
    setHeading1: setHeading(1),
    setHeading2: setHeading(2),
    setHeading3: setHeading(3),
    setHeading4: setHeading(4),
    setHeading5: setHeading(5),
    setHeading6: setHeading(6),
    setParagraph: setParagraph(),
    toggleBlockquote: toggleBlockquote(schema),
    insertBlockquote: insertBlockquote(schema),
    toggleVerse: toggleVerse(schema),
    insertVerse: insertVerse(schema),
    // Subheading commands (h2-h6 only)
    setSubheading2: setSubheading(2),
    setSubheading3: setSubheading(3),
    setSubheading4: setSubheading(4),
    setSubheading5: setSubheading(5),
    setSubheading6: setSubheading(6),
    toggleSubheading2: toggleSubheading(2),
    toggleSubheading3: toggleSubheading(3),
    toggleSubheading4: toggleSubheading(4),
    toggleSubheading5: toggleSubheading(5),
    toggleSubheading6: toggleSubheading(6),
    // Scene and ornamental break commands
    insertSceneBreak: insertSceneBreak,
    insertOrnamentalBreak: insertOrnamentalBreak,
    // Footnote and endnote marker commands
    insertFootnoteMarker: insertFootnoteMarker,
    insertEndnoteMarker: insertEndnoteMarker,
  };
}

// Re-export image commands for easy access
export {
  insertImageNode,
  insertImageFromUrl,
  insertImageFromUpload,
  insertImageWithPicker,
  insertImageFromFile,
  canInsertImage,
  createInsertImageCommand,
} from './commands/insertImage';

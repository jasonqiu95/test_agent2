/**
 * Editor commands for text formatting and manipulation
 */

import { Command } from 'prosemirror-state';
import { toggleMark, setBlockType } from 'prosemirror-commands';
import { Schema } from 'prosemirror-model';
import { MarkType, NodeType } from './types';

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
 * Creates a command to set heading level
 *
 * @param schema - ProseMirror schema
 * @param level - Heading level (1-6)
 * @returns Command to set heading level
 */
export function setHeading(schema: Schema, level: number): Command {
  const nodeType = schema.nodes[NodeType.HEADING];
  if (!nodeType || level < 1 || level > 6) {
    return () => false;
  }
  return setBlockType(nodeType, { level });
}

/**
 * Creates a command to convert current block to paragraph
 */
export function setParagraph(schema: Schema): Command {
  const nodeType = schema.nodes[NodeType.PARAGRAPH];
  if (!nodeType) {
    return () => false;
  }
  return setBlockType(nodeType);
}

/**
 * Creates a command to toggle blockquote
 */
export function toggleBlockquote(schema: Schema): Command {
  const nodeType = schema.nodes[NodeType.BLOCKQUOTE];
  if (!nodeType) {
    return () => false;
  }
  return setBlockType(nodeType);
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
    setHeading1: setHeading(schema, 1),
    setHeading2: setHeading(schema, 2),
    setHeading3: setHeading(schema, 3),
    setHeading4: setHeading(schema, 4),
    setHeading5: setHeading(schema, 5),
    setHeading6: setHeading(schema, 6),
    setParagraph: setParagraph(schema),
    toggleBlockquote: toggleBlockquote(schema),
  };
}

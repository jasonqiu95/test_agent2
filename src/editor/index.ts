/**
 * Editor module exports
 * Provides ProseMirror schema, types, and serialization utilities
 */

// Schema exports
export {
  editorSchema,
  nodeSpecs,
  markSpecs,
  getNodeType,
  getMarkType,
  isBlockNode,
  isInlineNode,
} from './schema';

// Type exports
export {
  NodeType,
  MarkType,
  type HeadingAttrs,
  type SceneBreakAttrs,
  type OrnamentalBreakAttrs,
  type VerseAttrs,
  type ImageAttrs,
  type LinkAttrs,
  type OrderedListAttrs,
  type NodeAttrs,
  type MarkAttrs,
  type EditorConfig,
  type EditorInstance,
  type EditorChangeEvent,
  type EditorHandlers,
} from './types';

// Serialization exports
export {
  serializeToTextBlocks,
  deserializeFromTextBlocks,
  serializeToJSON,
  deserializeFromJSON,
  serializeToHTML,
  deserializeFromHTML,
  createEmptyDocument,
  isDocumentEmpty,
} from './serialization';

// Command exports
export type { Command } from './commands';
export {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setHeading,
  setParagraph,
  isBoldActive,
  isItalicActive,
  isUnderlineActive,
  isHeadingActive,
  getCurrentHeadingLevel,
  isMarkActive,
} from './commands';

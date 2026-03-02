/**
 * Editor type definitions for ProseMirror integration
 */

import { Node as PMNode, Mark, Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

/**
 * Node type names used in the schema
 */
export enum NodeType {
  DOC = 'doc',
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  BLOCKQUOTE = 'blockquote',
  ORDERED_LIST = 'ordered_list',
  BULLET_LIST = 'bullet_list',
  LIST_ITEM = 'list_item',
  SCENE_BREAK = 'scene_break',
  ORNAMENTAL_BREAK = 'ornamental_break',
  VERSE = 'verse',
  VERSE_LINE = 'verse_line',
  IMAGE = 'image',
  HARD_BREAK = 'hard_break',
  FOOTNOTE_MARKER = 'footnote_marker',
  ENDNOTE_MARKER = 'endnote_marker',
  TEXT = 'text',
}

/**
 * Mark type names used in the schema
 */
export enum MarkType {
  BOLD = 'bold',
  ITALIC = 'italic',
  UNDERLINE = 'underline',
  STRIKETHROUGH = 'strikethrough',
  SUBSCRIPT = 'subscript',
  SUPERSCRIPT = 'superscript',
  CODE = 'code',
  LINK = 'link',
}

/**
 * Attributes for heading nodes
 */
export interface HeadingAttrs {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Attributes for scene break nodes
 */
export interface SceneBreakAttrs {
  symbol?: string;
}

/**
 * Attributes for ornamental break nodes (placeholder for future implementation)
 */
export interface OrnamentalBreakAttrs {
  style?: string;
  symbol?: string;
}

/**
 * Attributes for verse nodes
 */
export interface VerseAttrs {
  stanza?: number;
}

/**
 * Attributes for image nodes
 */
export interface ImageAttrs {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  alignment?: 'inline' | 'block' | 'left' | 'right';
}

/**
 * Attributes for link marks
 */
export interface LinkAttrs {
  href: string;
  title?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

/**
 * Attributes for ordered list nodes
 */
export interface OrderedListAttrs {
  order?: number;
}

/**
 * Attributes for footnote marker nodes
 */
export interface FootnoteMarkerAttrs {
  number: number;
  noteId: string;
}

/**
 * Attributes for endnote marker nodes
 */
export interface EndnoteMarkerAttrs {
  number: number;
  noteId: string;
}

/**
 * Editor configuration options
 */
export interface EditorConfig {
  schema: Schema;
  plugins?: any[];
  content?: PMNode | Record<string, any>;
  editable?: boolean;
  autoFocus?: boolean;
}

/**
 * Editor instance interface
 */
export interface EditorInstance {
  view: EditorView;
  state: EditorState;
  schema: Schema;
  destroy: () => void;
  getContent: () => PMNode;
  setContent: (content: PMNode | Record<string, any>) => void;
  focus: () => void;
  blur: () => void;
  isEmpty: () => boolean;
}

/**
 * Editor change event
 */
export interface EditorChangeEvent {
  state: EditorState;
  transaction: Transaction;
  content: PMNode;
}

/**
 * Editor event handlers
 */
export interface EditorHandlers {
  onChange?: (event: EditorChangeEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onUpdate?: (view: EditorView) => void;
}

/**
 * Node attributes union type
 */
export type NodeAttrs =
  | HeadingAttrs
  | SceneBreakAttrs
  | OrnamentalBreakAttrs
  | VerseAttrs
  | ImageAttrs
  | OrderedListAttrs
  | FootnoteMarkerAttrs
  | EndnoteMarkerAttrs
  | Record<string, any>;

/**
 * Mark attributes union type
 */
export type MarkAttrs = LinkAttrs | Record<string, any>;

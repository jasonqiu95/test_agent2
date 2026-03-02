/**
 * Inline text formatting definitions for rich text support
 */

export interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  color?: string;
  highlight?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface InlineText {
  text: string;
  style?: InlineStyle;
}

export interface RichTextContent {
  segments: InlineText[];
  plainText: string;
}

export interface ImageReference {
  type: 'image';
  id: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  src?: string; // Base64 or file path
}

export interface LinkReference {
  type: 'link';
  text: string;
  url: string;
  title?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
  style?: InlineStyle; // Support for formatted link text
}

export interface FootnoteReference {
  type: 'footnote';
  text?: string; // Optional text content
  number?: number; // Auto-numbered or explicit
  referenceId: string; // Links to footnote content
  symbol?: string; // Alternative to numbering
}

export type TextSegment = InlineText | ImageReference | LinkReference | FootnoteReference;

export interface RichText {
  segments: TextSegment[];
  plainText: string;
}

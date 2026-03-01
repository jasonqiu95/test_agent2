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

export type TextSegment = InlineText | ImageReference;

export interface RichText {
  segments: TextSegment[];
  plainText: string;
}

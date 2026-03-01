/**
 * Type definitions for mammoth.js DOCX parsing library
 */

export interface DocxParseResult {
  value: string;
  messages: DocxMessage[];
}

export interface DocxMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export interface DocxParseOptions {
  styleMap?: string[];
  includeDefaultStyleMap?: boolean;
  includeEmbeddedStyleMap?: boolean;
  convertImage?: (image: DocxImage) => Promise<{ src: string }>;
  ignoreEmptyParagraphs?: boolean;
}

export interface DocxImage {
  read: (encoding?: string) => Promise<Buffer>;
  contentType: string;
}

export interface DocxBuffer {
  arrayBuffer: ArrayBuffer;
}

export interface MammothAPI {
  convertToHtml(options: { path: string } | { buffer: Buffer }, docxOptions?: DocxParseOptions): Promise<DocxParseResult>;
  extractRawText(options: { path: string } | { buffer: Buffer }): Promise<DocxParseResult>;
}

/**
 * Structured document types for detailed DOCX parsing
 */

export interface InlineFormatting {
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

export interface TextRun {
  type: 'text';
  text: string;
  formatting: InlineFormatting;
}

export interface Break {
  type: 'break';
  breakType: 'line' | 'page' | 'column';
}

export interface Tab {
  type: 'tab';
}

export type ParagraphContent = TextRun | Break | Tab;

export interface ParagraphStyle {
  styleName?: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  indentation?: {
    left?: number;
    right?: number;
    firstLine?: number;
    hanging?: number;
  };
  spacing?: {
    before?: number;
    after?: number;
    line?: number;
  };
  numbering?: {
    level: number;
    format: string;
  };
}

export interface Paragraph {
  type: 'paragraph';
  content: ParagraphContent[];
  style: ParagraphStyle;
  rawText: string;
}

export interface SectionBreak {
  type: 'section-break';
  sectionType?: 'nextPage' | 'nextColumn' | 'continuous' | 'evenPage' | 'oddPage';
}

export type DocumentElement = Paragraph | SectionBreak;

export interface StructuredDocument {
  elements: DocumentElement[];
  metadata: {
    paragraphCount: number;
    wordCount: number;
    characterCount: number;
  };
}

export interface StructuredParseResult {
  document: StructuredDocument;
  messages: DocxMessage[];
}

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

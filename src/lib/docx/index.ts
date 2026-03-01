/**
 * DOCX Library - Entry point for DOCX parsing functionality
 */

export { DocxParser as default, DocxParser } from './parser';
export { FormatConverter, convertDocxToInternalFormat } from './formatConverter';
export type { ConversionOptions, ConvertedDocument } from './formatConverter';
export type {
  DocxParseResult,
  DocxParseOptions,
  DocxMessage,
  DocxImage,
  DocxBuffer,
  MammothAPI,
  StructuredParseResult,
  StructuredDocument,
  DocumentElement,
  Paragraph,
  ParagraphContent,
  TextRun,
  Break,
  Tab,
  ParagraphStyle,
  InlineFormatting,
  SectionBreak
} from './types';
export {
  detectChapters,
  getChapterContent,
  getChapterStats
} from './chapterDetection';
export type {
  DetectedChapter,
  ChapterDetectionOptions
} from './chapterDetection';

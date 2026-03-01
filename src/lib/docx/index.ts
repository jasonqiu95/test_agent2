/**
 * DOCX Library - Entry point for DOCX parsing functionality
 */

export { DocxParser as default, DocxParser } from './parser';
export type {
  DocxParseResult,
  DocxParseOptions,
  DocxMessage,
  DocxImage,
  DocxBuffer,
  MammothAPI
} from './types';

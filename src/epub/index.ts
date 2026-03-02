/**
 * EPUB 3 Module
 *
 * Provides utilities for creating EPUB 3 compliant documents and structures,
 * including XHTML templates and block element conversion functions.
 */

// XHTML Template exports
export * from './xhtml-template';
export { default as xhtmlTemplate } from './xhtml-template';

// Block Converter exports
export {
  convertParagraph,
  convertHeading,
  convertBlockquote,
  convertUnorderedList,
  convertOrderedList,
  convertListItem,
  convertNestedList,
  convertVerse,
  convertVerseWithStanzas,
  convertBlockElements,
  validateBlockElement,
  extractTextContent,
  type BlockConverterOptions,
  type ConversionResult,
} from './block-converter';

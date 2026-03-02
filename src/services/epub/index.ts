/**
 * EPUB Services
 * Export all EPUB-related services and utilities
 */

export { generateTOC, type TocEntry, type TocGenerationResult, type TocOptions } from './tocGenerator';

export {
  convertNote,
  convertNoteCollection,
  extractAndConvertNotes,
  generateNoteStyles,
  type NoteType,
  type NoteStyle,
  type NoteReference,
  type NoteConversionOptions,
  type ConvertedNote,
  type NoteCollectionResult,
} from './note-converter';

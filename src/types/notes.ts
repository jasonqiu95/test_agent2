/**
 * Footnote and Endnote definitions
 */

import { Metadata } from './common';
import { StyleReference } from './style';

/**
 * Marker types for footnotes/endnotes
 */
export type NoteMarkerType = 'number' | 'symbol' | 'custom';

/**
 * Common note symbols (* † ‡ § ¶)
 */
export type NoteSymbol = '*' | '†' | '‡' | '§' | '¶' | '**' | '††' | '‡‡';

/**
 * Base interface for all note types
 */
export interface BaseNote extends Metadata {
  /** Unique identifier for the note */
  id: string;

  /** Note content (can be plain text or rich text) */
  content: string;

  /** Reference to the source element (TextBlock) that contains the marker */
  sourceElementId: string;

  /** Numbering type: auto-numbered, manual number, or symbol */
  markerType: NoteMarkerType;

  /** Manual number if markerType is 'number' */
  number?: number;

  /** Symbol if markerType is 'symbol' */
  symbol?: NoteSymbol | string;

  /** Custom marker text if markerType is 'custom' */
  customMarker?: string;

  /** Optional styling for the note */
  style?: StyleReference;
}

/**
 * Footnote interface
 * Footnotes appear at the bottom of the page or chapter
 */
export interface Footnote extends BaseNote {
  /** Type discriminator */
  noteType: 'footnote';

  /** Whether to display on same page as marker (default: true) */
  displayOnSamePage?: boolean;

  /** Page number where this footnote appears (for PDF) */
  pageNumber?: number;
}

/**
 * Endnote interface
 * Endnotes appear at the end of a chapter or book
 */
export interface Endnote extends BaseNote {
  /** Type discriminator */
  noteType: 'endnote';

  /** Chapter ID if endnotes are grouped by chapter */
  chapterId?: string;

  /** Whether to group at chapter end (true) or book end (false) */
  groupByChapter?: boolean;
}

/**
 * Union type for all note types
 */
export type Note = Footnote | Endnote;

/**
 * Inline marker that references a footnote or endnote
 * This appears in the text where the note is referenced
 */
export interface FootnoteMarker {
  /** Type discriminator */
  type: 'footnote-marker' | 'endnote-marker';

  /** Reference to the note ID */
  noteId: string;

  /** Display marker (number or symbol) */
  marker: string;

  /** Marker type */
  markerType: NoteMarkerType;

  /** Optional custom styling for the marker */
  style?: StyleReference;

  /** Whether marker is superscript (default: true) */
  superscript?: boolean;
}

/**
 * Configuration for auto-numbering notes
 */
export interface NoteNumberingConfig {
  /** Starting number (default: 1) */
  startNumber?: number;

  /** Reset numbering per chapter (default: true for footnotes, false for endnotes) */
  resetPerChapter?: boolean;

  /** Reset numbering per page (default: false, only for footnotes) */
  resetPerPage?: boolean;

  /** Format for numbers: 'numeric' | 'roman-lower' | 'roman-upper' | 'alpha-lower' | 'alpha-upper' */
  numberFormat?: 'numeric' | 'roman-lower' | 'roman-upper' | 'alpha-lower' | 'alpha-upper';
}

/**
 * Collection of footnotes with numbering configuration
 */
export interface FootnoteCollection {
  /** All footnotes in this collection */
  footnotes: Footnote[];

  /** Numbering configuration */
  config?: NoteNumberingConfig;
}

/**
 * Collection of endnotes with numbering configuration
 */
export interface EndnoteCollection {
  /** All endnotes in this collection */
  endnotes: Endnote[];

  /** Numbering configuration */
  config?: NoteNumberingConfig;

  /** Whether to group by chapter */
  groupByChapter?: boolean;
}

/**
 * Helper type for note creation
 */
export interface CreateNoteParams {
  content: string;
  sourceElementId: string;
  markerType?: NoteMarkerType;
  number?: number;
  symbol?: NoteSymbol | string;
  customMarker?: string;
  style?: StyleReference;
}

/**
 * Helper type for footnote-specific creation
 */
export interface CreateFootnoteParams extends CreateNoteParams {
  displayOnSamePage?: boolean;
  pageNumber?: number;
}

/**
 * Helper type for endnote-specific creation
 */
export interface CreateEndnoteParams extends CreateNoteParams {
  chapterId?: string;
  groupByChapter?: boolean;
}

/**
 * Book definitions
 */

import { Metadata } from './common';
import { Chapter } from './chapter';
import { Element } from './element';
import { Style } from './style';
import { Endnote, NoteNumberingConfig } from './notes';

export interface BookMetadata extends Omit<Metadata, 'id'> {
  isbn?: string;
  isbn13?: string;
  publisher?: string;
  publicationDate?: Date;
  edition?: string;
  language?: string;
  genre?: string[];
  keywords?: string[];
  series?: string;
  seriesNumber?: number;
  awards?: string[];
  rights?: string;
  description?: string;
}

export interface Author {
  id: string;
  name: string;
  role?: 'author' | 'co-author' | 'editor' | 'translator' | 'contributor';
  bio?: string;
  website?: string;
  email?: string;
}

export interface Book extends Metadata {
  title: string;
  subtitle?: string;
  authors: Author[];
  frontMatter: Element[];
  chapters: Chapter[];
  backMatter: Element[];
  styles: Style[];
  metadata: BookMetadata;
  wordCount?: number;
  pageCount?: number;
  coverImage?: string;
  status?: 'draft' | 'review' | 'published' | 'archived';
  endnotes?: Endnote[]; // Book-level endnotes (when not grouped by chapter)
  footnoteConfig?: NoteNumberingConfig; // Global footnote numbering configuration
  endnoteConfig?: NoteNumberingConfig; // Global endnote numbering configuration
}

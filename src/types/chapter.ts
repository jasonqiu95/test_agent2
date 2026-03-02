/**
 * Chapter definitions
 */

import { Metadata } from './common';
import { StyleReference } from './style';
import { TextBlock } from './textBlock';
import { Footnote, Endnote } from './notes';

export interface Chapter extends Metadata {
  number?: number;
  title: string;
  subtitle?: string;
  content: TextBlock[];
  style?: StyleReference;
  epigraph?: string;
  epigraphAttribution?: string;
  wordCount?: number;
  includeInToc?: boolean;
  partNumber?: number; // For books divided into parts
  partTitle?: string;
  footnotes?: Footnote[]; // Footnotes for this chapter
  endnotes?: Endnote[]; // Endnotes for this chapter (if grouped by chapter)
}

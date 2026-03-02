/**
 * Type definitions for PDF export workflow
 */

import type { Dimensions } from '../pdf/pageGeometry';
import type { Margins, SpreadMargins } from '../pdf/marginCalculator';

/**
 * Book content structure
 */
export interface BookContent {
  title: string;
  author?: string;
  chapters: Chapter[];
  frontMatter?: FrontMatter[];
  backMatter?: BackMatter[];
}

export interface Chapter {
  id: string;
  title: string;
  content: Paragraph[];
  startOnNewPage?: boolean;
  pageBreak?: 'any' | 'right' | 'left'; // Chapter always starts on: any page, right (odd) page, or left (even) page
}

export interface Paragraph {
  id: string;
  text: string;
  style?: ParagraphStyle;
  formatting?: TextFormatting;
}

export interface ParagraphStyle {
  align?: 'left' | 'center' | 'right' | 'justify';
  indent?: number;
  spacing?: {
    before?: number;
    after?: number;
    lineHeight?: number;
  };
  keepWithNext?: boolean;
  widowControl?: boolean;
  orphanControl?: boolean;
}

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export interface FrontMatter {
  type: 'title-page' | 'copyright' | 'dedication' | 'toc';
  content?: any;
}

export interface BackMatter {
  type: 'about-author' | 'acknowledgments' | 'appendix';
  title: string;
  content: Paragraph[];
}

/**
 * PDF export configuration
 */
export interface PdfExportOptions {
  trimSize: string | Dimensions;
  margins?: Margins | SpreadMargins;
  bleed?: number;
  includeBleed?: boolean;
  mirrorMargins?: boolean;

  // Styling options
  fonts?: FontConfiguration;
  colors?: ColorConfiguration;

  // Layout options
  pageNumbers?: PageNumberConfiguration;
  headers?: HeaderConfiguration;
  footers?: FooterConfiguration;

  // Typography options
  widowOrphanControl?: boolean;
  hyphenation?: boolean;

  // Output options
  compress?: boolean;
  pdfVersion?: string;
}

export interface FontConfiguration {
  body?: string;
  heading?: string;
  baseSize?: number;
}

export interface ColorConfiguration {
  text?: string;
  heading?: string;
}

export interface PageNumberConfiguration {
  enabled: boolean;
  format?: 'numeric' | 'roman-lower' | 'roman-upper';
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center';
  startPage?: number;
  prefix?: string;
  suffix?: string;
}

export interface HeaderConfiguration {
  enabled: boolean;
  leftPage?: string;
  rightPage?: string;
  fontSize?: number;
}

export interface FooterConfiguration {
  enabled: boolean;
  leftPage?: string;
  rightPage?: string;
  fontSize?: number;
}

/**
 * Layout information
 */
export interface PageLayout {
  pageNumber: number;
  content: LayoutElement[];
  header?: HeaderElement;
  footer?: FooterElement;
}

export interface LayoutElement {
  type: 'text' | 'heading' | 'page-break';
  content?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style?: any;
}

export interface HeaderElement {
  text: string;
  x: number;
  y: number;
}

export interface FooterElement {
  text: string;
  pageNumber?: string;
  x: number;
  y: number;
}

/**
 * Page break control
 */
export interface PageBreakInfo {
  type: 'soft' | 'hard' | 'chapter';
  pageNumber: number;
  position: number;
}

/**
 * Widow/Orphan control settings
 */
export interface WidowOrphanSettings {
  minLinesAtStart: number; // Minimum lines to keep at start of page (orphan control)
  minLinesAtEnd: number;   // Minimum lines to keep at end of page (widow control)
  enabled: boolean;
}

/**
 * PDF generation result
 */
export interface PdfGenerationResult {
  success: boolean;
  pageCount: number;
  buffer?: Buffer;
  error?: string;
  metadata?: PdfMetadata;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
}

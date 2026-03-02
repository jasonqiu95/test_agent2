/**
 * Type definitions for book styling and PDF generation
 */

import type { Dimensions, Unit } from './pageGeometry';
import type { Margins, SpreadMargins } from './marginCalculator';

/**
 * Font configuration
 */
export interface FontConfig {
  family: string;
  size: number;
  weight?: number | string;
  style?: 'normal' | 'italic' | 'oblique';
  lineHeight?: number;
  letterSpacing?: number;
}

/**
 * Font family configuration with variants
 */
export interface FontFamily {
  regular: string;
  bold?: string;
  italic?: string;
  boldItalic?: string;
}

/**
 * Font format types for @font-face
 */
export type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf';

/**
 * Custom font source configuration for @font-face
 */
export interface CustomFontSource {
  /** URL to the font file */
  url: string;
  /** Font format */
  format: FontFormat;
}

/**
 * Custom font configuration with variants
 */
export interface CustomFont {
  /** Font family name */
  family: string;
  /** Font weight */
  weight?: number | string;
  /** Font style */
  style?: 'normal' | 'italic' | 'oblique';
  /** Array of font file sources in priority order */
  sources: CustomFontSource[];
  /** Font display strategy */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  /** Unicode range for subsetting */
  unicodeRange?: string;
}

/**
 * Fonts configuration for the book
 */
export interface Fonts {
  body: FontConfig;
  heading: FontConfig;
  chapter: FontConfig;
  serif?: FontFamily;
  sansSerif?: FontFamily;
  monospace?: FontFamily;
}

/**
 * Heading style configuration
 */
export interface HeadingStyle {
  fontSize: number;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  fontFamily?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  marginTop?: number;
  marginBottom?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  breakAfter?: 'auto' | 'avoid' | 'always' | 'page' | 'left' | 'right' | 'column';
}

/**
 * All heading levels configuration
 */
export interface Headings {
  h1?: HeadingStyle;
  h2?: HeadingStyle;
  h3?: HeadingStyle;
  h4?: HeadingStyle;
  h5?: HeadingStyle;
  h6?: HeadingStyle;
  chapterTitle?: HeadingStyle;
  sectionTitle?: HeadingStyle;
}

/**
 * Drop cap configuration
 */
export interface DropCaps {
  enabled: boolean;
  lines?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  marginRight?: number;
  float?: 'left' | 'right';
}

/**
 * First paragraph styling
 */
export interface FirstParagraph {
  enabled: boolean;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'small-caps';
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  marginBottom?: number;
  smallCapsWords?: number; // Number of words to apply small-caps to
}

/**
 * Ornamental break configuration
 */
export interface OrnamentalBreaks {
  enabled: boolean;
  character?: string; // The ornament character(s) to use
  fontSize?: number;
  marginTop?: number;
  marginBottom?: number;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
}

/**
 * Body text configuration
 */
export interface BodyText {
  fontSize: number;
  lineHeight: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textIndent?: number;
  paragraphSpacing?: number;
  hyphenation?: boolean;
  orphans?: number;
  widows?: number;
  color?: string;
  fontFamily?: string;
}

/**
 * Complete book style configuration
 */
export interface BookStyle {
  fonts: Fonts;
  headings: Headings;
  dropCaps?: DropCaps;
  firstParagraph?: FirstParagraph;
  ornamentalBreaks?: OrnamentalBreaks;
  bodyText: BodyText;
  /** Custom fonts with @font-face declarations */
  customFonts?: CustomFont[];
}

/**
 * Options for style to CSS conversion
 */
export interface StyleToCssOptions {
  trimSize: string | Dimensions;
  margins: Margins | SpreadMargins;
  unit?: Unit;
  includePagedMedia?: boolean; // Include @page rules for print
  includeResetStyles?: boolean; // Include CSS reset
  pageNumbering?: boolean;
  bleed?: number;
  customCSS?: string; // Additional custom CSS to append
}

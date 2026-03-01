/**
 * PDF generation types and interfaces
 */

/**
 * Standard trim sizes for book printing
 */
export type TrimSize =
  | '5x8'
  | '5.5x8.5'
  | '6x9'
  | '7x10'
  | '8x10'
  | '8.5x11'
  | 'A4'
  | 'A5'
  | 'custom';

/**
 * Custom dimensions for trim size (in inches)
 */
export interface CustomTrimSize {
  width: number;
  height: number;
}

/**
 * PDF margin settings (in inches)
 * Uses inside/outside for proper gutter handling in book printing
 */
export interface PdfMargins {
  top: number;
  bottom: number;
  inside: number;
  outside: number;
}

/**
 * Bleed settings for professional printing (in inches)
 */
export interface BleedSettings {
  enabled: boolean;
  top: number;
  bottom: number;
  inside: number;
  outside: number;
}

/**
 * Header configuration
 */
export interface HeaderConfig {
  enabled: boolean;
  leftPage?: string;
  rightPage?: string;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * Page number configuration
 */
export interface PageNumberConfig {
  enabled: boolean;
  position: 'top' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  startNumber?: number;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * PDF generation options
 */
export interface PdfGenerationOptions {
  trimSize: TrimSize;
  customTrimSize?: CustomTrimSize;
  margins: PdfMargins;
  bleed?: BleedSettings;
  includeHeaders: boolean;
  headerConfig?: HeaderConfig;
  includePageNumbers: boolean;
  pageNumberConfig?: PageNumberConfig;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  embedFonts?: boolean;
  compress?: boolean;
}

/**
 * PDF generation result
 */
export interface PdfGenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
  pageCount?: number;
  fileSize?: number;
}

/**
 * PDF Generator interface
 */
export interface PdfGenerator {
  /**
   * Generates a PDF from the provided content
   * @param content The content to convert to PDF
   * @param options PDF generation options
   * @returns Promise resolving to generation result
   */
  generatePdf(
    content: any,
    options: PdfGenerationOptions
  ): Promise<PdfGenerationResult>;
}

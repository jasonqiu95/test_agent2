/**
 * PDF Export workflow
 * Handles the complete PDF generation pipeline:
 * Book data → Layout → Page breaks → Headers/Footers → Styling → PDF generation
 */

import type {
  BookContent,
  PdfExportOptions,
  PdfGenerationResult,
  PageLayout,
} from './types';
import type { Margins, SpreadMargins, PageConfiguration } from '../pdf/marginCalculator';
import {
  calculatePageConfiguration,
  calculateSpreadPageConfiguration,
  getBookMargins,
  getStandardMargins,
} from '../pdf/marginCalculator';
import { calculatePageDimensions, inchesToPoints } from '../pdf/pageGeometry';
import { LayoutEngine } from './layoutEngine';

/**
 * PDF Generator class
 * This is a wrapper around PDFKit that will be mocked in tests
 */
export interface IPdfGenerator {
  addPage(width: number, height: number): void;
  setFont(font: string, size: number): void;
  setText(text: string, x: number, y: number, options?: any): void;
  addText(text: string, x: number, y: number, width: number, options?: any): void;
  save(): void;
  end(): void;
  getBuffer(): Promise<Buffer>;
}

/**
 * PDF Export class
 * Orchestrates the entire PDF generation workflow
 */
export class PdfExporter {
  private options: PdfExportOptions;
  private pdfGenerator?: IPdfGenerator;

  constructor(options: PdfExportOptions) {
    this.options = {
      ...this.getDefaultOptions(),
      ...options,
    };
  }

  /**
   * Get default export options
   */
  private getDefaultOptions(): Partial<PdfExportOptions> {
    return {
      bleed: 0.125,
      includeBleed: true,
      mirrorMargins: true,
      fonts: {
        body: 'Times-Roman',
        heading: 'Times-Bold',
        baseSize: 12,
      },
      colors: {
        text: '#000000',
        heading: '#000000',
      },
      pageNumbers: {
        enabled: true,
        format: 'numeric',
        position: 'bottom-center',
        startPage: 1,
      },
      headers: {
        enabled: false,
      },
      footers: {
        enabled: false,
      },
      widowOrphanControl: true,
      hyphenation: false,
      compress: true,
    };
  }

  /**
   * Export book content to PDF
   */
  public async export(
    content: BookContent,
    pdfGenerator?: IPdfGenerator
  ): Promise<PdfGenerationResult> {
    try {
      this.pdfGenerator = pdfGenerator;

      // Step 1: Calculate page dimensions
      const pageDimensions = calculatePageDimensions(this.options.trimSize);

      // Step 2: Calculate margins
      const margins = this.getMargins();
      const pageConfig = this.calculatePageConfig(pageDimensions, margins);

      // Step 3: Generate layout (handles page breaks, widow/orphan control)
      const layoutEngine = new LayoutEngine(pageConfig, this.options);
      const pages = layoutEngine.generateLayout(content);

      // Step 4: Generate PDF from layout
      await this.generatePdf(pages, pageConfig);

      // Step 5: Return result
      const buffer = this.pdfGenerator ? await this.pdfGenerator.getBuffer() : undefined;

      return {
        success: true,
        pageCount: pages.length,
        buffer,
        metadata: {
          title: content.title,
          author: content.author,
          creator: 'Book Publishing App',
          producer: 'PDFKit',
          creationDate: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        pageCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get margins based on configuration
   */
  private getMargins(): Margins {
    if (!this.options.margins) {
      return this.options.mirrorMargins ? getBookMargins() : getStandardMargins();
    }

    if ('inside' in this.options.margins) {
      // SpreadMargins - convert to regular margins for right page
      const spreadMargins = this.options.margins as SpreadMargins;
      return {
        top: spreadMargins.top,
        bottom: spreadMargins.bottom,
        left: spreadMargins.inside,
        right: spreadMargins.outside,
      };
    }

    return this.options.margins as Margins;
  }

  /**
   * Calculate page configuration
   */
  private calculatePageConfig(
    pageDimensions: { width: number; height: number },
    margins: Margins
  ): PageConfiguration {
    // Convert points to inches for margin calculator
    const pageInInches = {
      width: pageDimensions.width / 72,
      height: pageDimensions.height / 72,
    };

    return calculatePageConfiguration(
      pageInInches,
      margins,
      this.options.bleed || 0.125
    );
  }

  /**
   * Generate PDF from layout
   */
  private async generatePdf(pages: PageLayout[], pageConfig: PageConfiguration): Promise<void> {
    if (!this.pdfGenerator) {
      return;
    }

    const pageWidth = inchesToPoints(pageConfig.page.width);
    const pageHeight = inchesToPoints(pageConfig.page.height);

    for (const page of pages) {
      // Add page
      this.pdfGenerator.addPage(pageWidth, pageHeight);

      // Add header
      if (page.header) {
        this.pdfGenerator.setFont(
          this.options.fonts?.body || 'Times-Roman',
          this.options.headers?.fontSize || 10
        );
        this.pdfGenerator.setText(
          page.header.text,
          page.header.x,
          page.header.y
        );
      }

      // Add content
      for (const element of page.content) {
        if (element.type === 'heading') {
          this.pdfGenerator.setFont(
            element.style?.fontFamily || this.options.fonts?.heading || 'Times-Bold',
            element.style?.fontSize || 18
          );
          this.pdfGenerator.addText(
            element.content || '',
            element.x,
            element.y,
            element.width,
            { align: 'left' }
          );
        } else if (element.type === 'text') {
          this.pdfGenerator.setFont(
            element.style?.fontFamily || this.options.fonts?.body || 'Times-Roman',
            element.style?.fontSize || 12
          );
          this.pdfGenerator.addText(
            element.content || '',
            element.x,
            element.y,
            element.width,
            {
              align: element.style?.align || 'left',
              lineGap: element.style?.lineHeight ? (element.style.lineHeight - element.style.fontSize) : 0,
            }
          );
        }
      }

      // Add footer
      if (page.footer) {
        this.pdfGenerator.setFont(
          this.options.fonts?.body || 'Times-Roman',
          this.options.footers?.fontSize || 10
        );

        // Footer text
        if (page.footer.text) {
          this.pdfGenerator.setText(
            page.footer.text,
            page.footer.x,
            page.footer.y
          );
        }

        // Page number
        if (page.footer.pageNumber) {
          const pageNumX = this.getPageNumberX(pageConfig, this.options.pageNumbers?.position);
          this.pdfGenerator.setText(
            page.footer.pageNumber,
            pageNumX,
            page.footer.y
          );
        }
      }
    }

    this.pdfGenerator.save();
    this.pdfGenerator.end();
  }

  /**
   * Get X coordinate for page number based on position
   */
  private getPageNumberX(pageConfig: PageConfiguration, position?: string): number {
    const contentX = inchesToPoints(pageConfig.contentArea.x);
    const contentWidth = inchesToPoints(pageConfig.contentArea.width);

    switch (position) {
      case 'bottom-left':
        return contentX;
      case 'bottom-right':
        return contentX + contentWidth - 50; // Approximate width of page number
      case 'bottom-center':
      case 'top-center':
      default:
        return contentX + contentWidth / 2 - 25; // Center the page number
    }
  }

  /**
   * Validate export options
   */
  public validateOptions(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate trim size
    if (!this.options.trimSize) {
      errors.push('Trim size is required');
    }

    // Validate page numbers
    if (this.options.pageNumbers?.enabled && this.options.pageNumbers.startPage && this.options.pageNumbers.startPage < 1) {
      errors.push('Page number start page must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Convenience function to export book to PDF
 */
export async function exportBookToPdf(
  content: BookContent,
  options: PdfExportOptions,
  pdfGenerator?: IPdfGenerator
): Promise<PdfGenerationResult> {
  const exporter = new PdfExporter(options);
  return exporter.export(content, pdfGenerator);
}

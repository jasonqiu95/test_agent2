/**
 * Mock PDF Generator for testing
 * Mocks PDFKit functionality without creating actual PDF files
 */

import type { IPdfGenerator } from '../../../src/lib/export/pdfExport';

export interface MockPdfPage {
  width: number;
  height: number;
  content: MockPdfElement[];
}

export interface MockPdfElement {
  type: 'text' | 'header' | 'footer' | 'page-number';
  text: string;
  x: number;
  y: number;
  width?: number;
  font?: string;
  fontSize?: number;
  options?: any;
}

/**
 * Mock PDF Generator implementation
 */
export class MockPdfGenerator implements IPdfGenerator {
  public pages: MockPdfPage[] = [];
  private currentPage: MockPdfPage | null = null;
  private currentFont: string = 'Times-Roman';
  private currentFontSize: number = 12;
  private buffer: Buffer | null = null;

  /**
   * Add a new page
   */
  addPage(width: number, height: number): void {
    const page: MockPdfPage = {
      width,
      height,
      content: [],
    };
    this.pages.push(page);
    this.currentPage = page;
  }

  /**
   * Set current font
   */
  setFont(font: string, size: number): void {
    this.currentFont = font;
    this.currentFontSize = size;
  }

  /**
   * Add text at specific position
   */
  setText(text: string, x: number, y: number, options?: any): void {
    if (!this.currentPage) {
      throw new Error('No page available. Call addPage() first.');
    }

    this.currentPage.content.push({
      type: 'text',
      text,
      x,
      y,
      font: this.currentFont,
      fontSize: this.currentFontSize,
      options,
    });
  }

  /**
   * Add text with width and alignment
   */
  addText(text: string, x: number, y: number, width: number, options?: any): void {
    if (!this.currentPage) {
      throw new Error('No page available. Call addPage() first.');
    }

    this.currentPage.content.push({
      type: 'text',
      text,
      x,
      y,
      width,
      font: this.currentFont,
      fontSize: this.currentFontSize,
      options,
    });
  }

  /**
   * Save current state (no-op in mock)
   */
  save(): void {
    // No-op for mock
  }

  /**
   * End document and create buffer
   */
  end(): void {
    // Create a simple buffer with metadata
    const metadata = {
      pageCount: this.pages.length,
      timestamp: new Date().toISOString(),
    };
    this.buffer = Buffer.from(JSON.stringify(metadata));
  }

  /**
   * Get the generated buffer
   */
  async getBuffer(): Promise<Buffer> {
    if (!this.buffer) {
      throw new Error('Document not finalized. Call end() first.');
    }
    return this.buffer;
  }

  /**
   * Get page count
   */
  getPageCount(): number {
    return this.pages.length;
  }

  /**
   * Get specific page
   */
  getPage(index: number): MockPdfPage | undefined {
    return this.pages[index];
  }

  /**
   * Get all text content from a page
   */
  getPageText(pageIndex: number): string[] {
    const page = this.pages[pageIndex];
    if (!page) {
      return [];
    }
    return page.content.map(element => element.text);
  }

  /**
   * Find elements by type on a page
   */
  findElementsByType(pageIndex: number, type: string): MockPdfElement[] {
    const page = this.pages[pageIndex];
    if (!page) {
      return [];
    }
    return page.content.filter(element => element.type === type);
  }

  /**
   * Find text element containing specific text
   */
  findTextElement(pageIndex: number, searchText: string): MockPdfElement | undefined {
    const page = this.pages[pageIndex];
    if (!page) {
      return undefined;
    }
    return page.content.find(element => element.text.includes(searchText));
  }

  /**
   * Get all page numbers
   */
  getPageNumbers(): string[] {
    return this.pages.map((page, index) => {
      const pageNumElement = page.content.find(
        element => element.type === 'page-number' || /^\d+$/.test(element.text)
      );
      return pageNumElement?.text || '';
    });
  }

  /**
   * Check if widow/orphan control is working
   * Returns true if no single-line orphans or widows are detected
   */
  hasProperWidowOrphanControl(): boolean {
    // This is a simplified check - in real implementation would need more sophisticated detection
    for (let i = 0; i < this.pages.length - 1; i++) {
      const currentPage = this.pages[i];
      const nextPage = this.pages[i + 1];

      // Check for orphans (single line at bottom of page)
      const lastElements = currentPage.content.slice(-2);
      if (lastElements.length === 2 &&
          lastElements[1].type === 'text' &&
          lastElements[1].y - lastElements[0].y > 50) {
        // Likely an orphan
        return false;
      }

      // Check for widows (single line at top of page)
      const firstElements = nextPage.content.slice(0, 2);
      if (firstElements.length === 2 &&
          firstElements[0].type === 'text' &&
          firstElements[1].y - firstElements[0].y > 50) {
        // Likely a widow
        return false;
      }
    }
    return true;
  }

  /**
   * Reset the mock generator
   */
  reset(): void {
    this.pages = [];
    this.currentPage = null;
    this.currentFont = 'Times-Roman';
    this.currentFontSize = 12;
    this.buffer = null;
  }
}

/**
 * Factory function to create a mock PDF generator
 */
export function createMockPdfGenerator(): MockPdfGenerator {
  return new MockPdfGenerator();
}

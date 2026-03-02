/**
 * Integration tests for PDF export workflow
 * Tests: Book data → Print layout → Page breaks → Headers/Footers → Styling → PDF generation
 */

import { PdfExporter, exportBookToPdf } from '../../src/lib/export/pdfExport';
import type { PdfExportOptions, BookContent } from '../../src/lib/export/types';
import { createMockPdfGenerator, MockPdfGenerator } from './__mocks__/pdfGenerator';
import {
  SIMPLE_BOOK,
  MULTI_CHAPTER_BOOK,
  LONG_BOOK,
  MINIMAL_BOOK,
} from './fixtures/sampleBooks';

describe('PDF Export Integration Tests', () => {
  describe('Basic PDF Generation', () => {
    it('should generate PDF from simple book data', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(SIMPLE_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.metadata?.title).toBe('Simple Book');
      expect(result.metadata?.author).toBe('Test Author');
    });

    it('should generate PDF buffer', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MINIMAL_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeDefined();
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });

    it('should handle minimal book correctly', async () => {
      const options: PdfExportOptions = {
        trimSize: '5x8',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MINIMAL_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(result.pageCount).toBe(1);
      expect(mockPdf.getPageCount()).toBe(1);
    });

    it('should include all chapters in PDF', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check that all chapter titles are present
      const allText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      expect(allText).toContain('Chapter One');
      expect(allText).toContain('Chapter Two');
      expect(allText).toContain('Chapter Three');
    });
  });

  describe('Print Layout and Page Breaks', () => {
    it('should create proper page breaks for chapters', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(result.pageCount).toBeGreaterThan(3); // Multiple chapters should span multiple pages

      // Each chapter should start on a new page
      const chapterPages = mockPdf.pages.filter(page =>
        page.content.some(element =>
          element.text.startsWith('Chapter')
        )
      );

      expect(chapterPages.length).toBe(3); // 3 chapters
    });

    it('should distribute content across multiple pages', async () => {
      const options: PdfExportOptions = {
        trimSize: '5x8', // Smaller size = more pages
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(LONG_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(result.pageCount).toBeGreaterThan(5);
    });

    it('should handle different content densities', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        fonts: {
          baseSize: 10,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(LONG_BOOK, options, mockPdf);

      const smallFontPages = result.pageCount;

      // Test with larger font
      const mockPdf2 = createMockPdfGenerator();
      const options2: PdfExportOptions = {
        trimSize: '6x9',
        fonts: {
          baseSize: 14,
        },
      };

      const result2 = await exportBookToPdf(LONG_BOOK, options2, mockPdf2);
      const largeFontPages = result2.pageCount;

      // Larger font should result in more pages
      expect(largeFontPages).toBeGreaterThan(smallFontPages);
    });
  });

  describe('Headers and Footers', () => {
    it('should add headers when enabled', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        headers: {
          enabled: true,
          leftPage: 'Test Book',
          rightPage: 'Chapter Title',
          fontSize: 10,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check that headers are present on pages
      const pagesWithHeaders = mockPdf.pages.filter(page => page.content.some(
        element => element.text === 'Test Book' || element.text === 'Chapter Title'
      ));

      expect(pagesWithHeaders.length).toBeGreaterThan(0);
    });

    it('should add footers when enabled', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        footers: {
          enabled: true,
          leftPage: 'Footer Left',
          rightPage: 'Footer Right',
          fontSize: 10,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(SIMPLE_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check for footer content
      const allText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      const hasFooter = allText.some(text =>
        text === 'Footer Left' || text === 'Footer Right'
      );

      expect(hasFooter).toBe(true);
    });

    it('should handle mirrored headers for left/right pages', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        headers: {
          enabled: true,
          leftPage: 'Left Header',
          rightPage: 'Right Header',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(2);

      // Check alternating headers
      const allText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      expect(allText).toContain('Left Header');
      expect(allText).toContain('Right Header');
    });
  });

  describe('Styling', () => {
    it('should apply custom fonts', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        fonts: {
          body: 'Helvetica',
          heading: 'Helvetica-Bold',
          baseSize: 11,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(SIMPLE_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check that custom fonts are used
      const fonts = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.font)
      );

      expect(fonts).toContain('Helvetica');
      expect(fonts).toContain('Helvetica-Bold');
    });

    it('should apply correct font sizes', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        fonts: {
          baseSize: 14,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(SIMPLE_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check font sizes in content
      const bodyElements = mockPdf.pages.flatMap(page =>
        page.content.filter(element => element.type === 'text' && !element.text.startsWith('Chapter'))
      );

      const bodySizes = bodyElements.map(element => element.fontSize);
      expect(bodySizes.some(size => size === 14)).toBe(true);
    });

    it('should style chapter headings differently from body text', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        fonts: {
          body: 'Times-Roman',
          heading: 'Times-Bold',
          baseSize: 12,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Find chapter headings
      const headings = mockPdf.pages.flatMap(page =>
        page.content.filter(element => element.text.startsWith('Chapter'))
      );

      // Headings should use bold font
      expect(headings.every(h => h.font === 'Times-Bold')).toBe(true);

      // Headings should be larger than body text
      const headingSizes = headings.map(h => h.fontSize || 0);
      expect(headingSizes.some(size => size > 12)).toBe(true);
    });
  });

  describe('Margins and Bleeds', () => {
    it('should apply standard margins', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        margins: {
          top: 1.0,
          bottom: 1.0,
          left: 1.0,
          right: 1.0,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(SIMPLE_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Content should respect margins
      const page = mockPdf.getPage(0);
      expect(page).toBeDefined();

      if (page) {
        const contentElements = page.content.filter(el => el.type === 'text');
        // X position should be at least 1 inch (72 points) from edge
        expect(contentElements.every(el => el.x >= 72)).toBe(true);
      }
    });

    it('should apply mirrored margins for book spreads', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 1.0,
          outside: 0.75,
        },
        mirrorMargins: true,
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(1);
    });

    it('should include bleed when specified', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        bleed: 0.125,
        includeBleed: true,
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(SIMPLE_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate export options', () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
      };

      const exporter = new PdfExporter(options);
      const validation = exporter.validateOptions();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid options', () => {
      const options: PdfExportOptions = {
        trimSize: '',
      };

      const exporter = new PdfExporter(options);
      const validation = exporter.validateOptions();

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate page number start page', () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          startPage: 0, // Invalid
        },
      };

      const exporter = new PdfExporter(options);
      const validation = exporter.validateOptions();

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(err => err.includes('start page'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const options: PdfExportOptions = {
        trimSize: 'invalid-size',
      };

      const mockPdf = createMockPdfGenerator();

      // Should not throw, but return error result
      const result = await exportBookToPdf(SIMPLE_BOOK, options, mockPdf);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.pageCount).toBe(0);
    });
  });
});

/**
 * Integration tests for various trim sizes
 * Tests different book formats: 5x8, 6x9, 7x10, A4, A5, etc.
 */

import { exportBookToPdf } from '../../src/lib/export/pdfExport';
import type { PdfExportOptions } from '../../src/lib/export/types';
import { createMockPdfGenerator } from './__mocks__/pdfGenerator';
import { MULTI_CHAPTER_BOOK, LONG_BOOK } from './fixtures/sampleBooks';
import { calculatePageDimensions, inchesToPoints } from '../../src/lib/pdf/pageGeometry';

describe('PDF Export - Trim Sizes', () => {
  describe('Standard US Trade Sizes', () => {
    it('should generate PDF with 5x8 trim size', async () => {
      const options: PdfExportOptions = {
        trimSize: '5x8',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(0);

      // Verify page dimensions
      const page = mockPdf.getPage(0);
      expect(page).toBeDefined();
      if (page) {
        const expectedDims = calculatePageDimensions('5x8');
        expect(page.width).toBe(expectedDims.width);
        expect(page.height).toBe(expectedDims.height);
      }
    });

    it('should generate PDF with 5.5x8.5 trim size (digest)', async () => {
      const options: PdfExportOptions = {
        trimSize: '5.5x8.5',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      if (page) {
        const expectedDims = calculatePageDimensions('5.5x8.5');
        expect(page.width).toBe(expectedDims.width);
        expect(page.height).toBe(expectedDims.height);
      }
    });

    it('should generate PDF with 6x9 trim size (trade paperback)', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      if (page) {
        const expectedDims = calculatePageDimensions('6x9');
        expect(page.width).toBe(expectedDims.width);
        expect(page.height).toBe(expectedDims.height);
        expect(page.width).toBe(inchesToPoints(6));
        expect(page.height).toBe(inchesToPoints(9));
      }
    });

    it('should generate PDF with 7x10 trim size (royal)', async () => {
      const options: PdfExportOptions = {
        trimSize: '7x10',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      if (page) {
        expect(page.width).toBe(inchesToPoints(7));
        expect(page.height).toBe(inchesToPoints(10));
      }
    });

    it('should generate PDF with 8.5x11 trim size (letter)', async () => {
      const options: PdfExportOptions = {
        trimSize: '8.5x11',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      if (page) {
        expect(page.width).toBe(inchesToPoints(8.5));
        expect(page.height).toBe(inchesToPoints(11));
      }
    });
  });

  describe('International Sizes', () => {
    it('should generate PDF with A4 trim size', async () => {
      const options: PdfExportOptions = {
        trimSize: 'A4',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      expect(page).toBeDefined();
      if (page) {
        const expectedDims = calculatePageDimensions('A4');
        expect(page.width).toBeCloseTo(expectedDims.width, 0);
        expect(page.height).toBeCloseTo(expectedDims.height, 0);
      }
    });

    it('should generate PDF with A5 trim size', async () => {
      const options: PdfExportOptions = {
        trimSize: 'A5',
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      if (page) {
        const expectedDims = calculatePageDimensions('A5');
        expect(page.width).toBeCloseTo(expectedDims.width, 0);
        expect(page.height).toBeCloseTo(expectedDims.height, 0);
      }
    });
  });

  describe('Custom Dimensions', () => {
    it('should generate PDF with custom dimensions in inches', async () => {
      const options: PdfExportOptions = {
        trimSize: {
          width: 5.25,
          height: 8.25,
          unit: 'in',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      if (page) {
        expect(page.width).toBeCloseTo(inchesToPoints(5.25), 1);
        expect(page.height).toBeCloseTo(inchesToPoints(8.25), 1);
      }
    });

    it('should generate PDF with custom dimensions in millimeters', async () => {
      const options: PdfExportOptions = {
        trimSize: {
          width: 150,
          height: 220,
          unit: 'mm',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(0);
    });
  });

  describe('Page Count Variations by Trim Size', () => {
    it('should produce more pages with smaller trim size', async () => {
      // Test with 5x8 (smaller)
      const smallOptions: PdfExportOptions = {
        trimSize: '5x8',
        fonts: { baseSize: 12 },
      };

      const mockPdfSmall = createMockPdfGenerator();
      const smallResult = await exportBookToPdf(LONG_BOOK, smallOptions, mockPdfSmall);

      // Test with 8.5x11 (larger)
      const largeOptions: PdfExportOptions = {
        trimSize: '8.5x11',
        fonts: { baseSize: 12 },
      };

      const mockPdfLarge = createMockPdfGenerator();
      const largeResult = await exportBookToPdf(LONG_BOOK, largeOptions, mockPdfLarge);

      expect(smallResult.success).toBe(true);
      expect(largeResult.success).toBe(true);

      // Smaller trim size should produce more pages
      expect(smallResult.pageCount).toBeGreaterThan(largeResult.pageCount);
    });

    it('should maintain consistent content across different trim sizes', async () => {
      const trimSizes = ['5x8', '6x9', '7x10'];
      const results = [];

      for (const trimSize of trimSizes) {
        const options: PdfExportOptions = { trimSize };
        const mockPdf = createMockPdfGenerator();
        const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

        expect(result.success).toBe(true);
        results.push({
          trimSize,
          pageCount: result.pageCount,
          mockPdf,
        });
      }

      // All should have generated PDFs
      expect(results.every(r => r.pageCount > 0)).toBe(true);

      // All should contain the same chapter titles
      for (const { mockPdf, trimSize } of results) {
        const allText = mockPdf.pages.flatMap(page =>
          page.content.map(element => element.text)
        );

        expect(allText).toContain('Chapter One');
        expect(allText).toContain('Chapter Two');
        expect(allText).toContain('Chapter Three');
      }
    });
  });

  describe('Content Area Calculations', () => {
    it('should maintain proper margins for different trim sizes', async () => {
      const trimSizes = ['5x8', '6x9', 'A4'];
      const marginInches = 1.0;
      const marginPoints = inchesToPoints(marginInches);

      for (const trimSize of trimSizes) {
        const options: PdfExportOptions = {
          trimSize,
          margins: {
            top: marginInches,
            bottom: marginInches,
            left: marginInches,
            right: marginInches,
          },
        };

        const mockPdf = createMockPdfGenerator();
        const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

        expect(result.success).toBe(true);

        // Check that content respects margins
        const page = mockPdf.getPage(0);
        if (page) {
          const contentElements = page.content.filter(el => el.type === 'text');
          const minX = Math.min(...contentElements.map(el => el.x));

          // Content should start at least marginPoints from left edge
          expect(minX).toBeGreaterThanOrEqual(marginPoints - 1); // Allow 1 point tolerance
        }
      }
    });

    it('should scale content area proportionally with trim size', async () => {
      const options5x8: PdfExportOptions = {
        trimSize: '5x8',
        margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
      };

      const options6x9: PdfExportOptions = {
        trimSize: '6x9',
        margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
      };

      const mockPdf5x8 = createMockPdfGenerator();
      const mockPdf6x9 = createMockPdfGenerator();

      await exportBookToPdf(MULTI_CHAPTER_BOOK, options5x8, mockPdf5x8);
      await exportBookToPdf(MULTI_CHAPTER_BOOK, options6x9, mockPdf6x9);

      const page5x8 = mockPdf5x8.getPage(0);
      const page6x9 = mockPdf6x9.getPage(0);

      // 6x9 should have larger page dimensions
      if (page5x8 && page6x9) {
        expect(page6x9.width).toBeGreaterThan(page5x8.width);
        expect(page6x9.height).toBeGreaterThan(page5x8.height);
      }
    });
  });
});

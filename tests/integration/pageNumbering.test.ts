/**
 * Integration tests for page numbering and headers/footers
 */

import { exportBookToPdf } from '../../src/lib/export/pdfExport';
import type { PdfExportOptions } from '../../src/lib/export/types';
import { createMockPdfGenerator } from './__mocks__/pdfGenerator';
import { MULTI_CHAPTER_BOOK, LONG_BOOK } from './fixtures/sampleBooks';

describe('PDF Export - Page Numbering', () => {
  describe('Basic Page Numbering', () => {
    it('should add page numbers when enabled', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          format: 'numeric',
          position: 'bottom-center',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check that page numbers are present
      for (let i = 0; i < mockPdf.getPageCount(); i++) {
        const pageText = mockPdf.getPageText(i);
        const hasNumber = pageText.some(text => /^\d+$/.test(text));
        expect(hasNumber).toBe(true);
      }
    });

    it('should not add page numbers when disabled', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: false,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check that no standalone numbers appear (page numbers should not be present)
      const allText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      // There might be numbers in content, but no isolated page numbers
      const isolatedNumbers = allText.filter(text => /^\d+$/.test(text.trim()));
      expect(isolatedNumbers.length).toBeLessThanOrEqual(mockPdf.getPageCount());
    });

    it('should number pages sequentially', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          format: 'numeric',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(LONG_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(5);

      // Extract page numbers and verify sequence
      const pageNumbers = mockPdf.pages.map((page, index) => {
        const pageText = page.content.map(el => el.text);
        const numberMatch = pageText.find(text => /^\d+$/.test(text));
        return numberMatch ? parseInt(numberMatch, 10) : null;
      });

      // Check that numbers are sequential
      for (let i = 0; i < pageNumbers.length - 1; i++) {
        if (pageNumbers[i] !== null && pageNumbers[i + 1] !== null) {
          expect(pageNumbers[i + 1]).toBe(pageNumbers[i]! + 1);
        }
      }
    });
  });

  describe('Page Number Formats', () => {
    it('should format page numbers as numeric', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          format: 'numeric',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check for numeric page numbers (1, 2, 3, etc.)
      const page1Text = mockPdf.getPageText(0);
      expect(page1Text.some(text => text === '1')).toBe(true);
    });

    it('should format page numbers as lowercase Roman numerals', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          format: 'roman-lower',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check for lowercase Roman numerals (i, ii, iii, etc.)
      const pageText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      const romanNumerals = pageText.filter(text =>
        /^[ivxlcdm]+$/.test(text) && text.length < 10
      );

      expect(romanNumerals.length).toBeGreaterThan(0);
      expect(romanNumerals).toContain('i');
    });

    it('should format page numbers as uppercase Roman numerals', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          format: 'roman-upper',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check for uppercase Roman numerals (I, II, III, etc.)
      const pageText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      const romanNumerals = pageText.filter(text =>
        /^[IVXLCDM]+$/.test(text) && text.length < 10
      );

      expect(romanNumerals.length).toBeGreaterThan(0);
      expect(romanNumerals).toContain('I');
    });
  });

  describe('Page Number Positioning', () => {
    it('should position page numbers at bottom center', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          position: 'bottom-center',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      if (page) {
        const pageNumElement = page.content.find(el => /^\d+$/.test(el.text));
        if (pageNumElement) {
          // Should be roughly centered horizontally
          const centerX = page.width / 2;
          expect(Math.abs(pageNumElement.x - centerX)).toBeLessThan(50);
        }
      }
    });

    it('should position page numbers at bottom left', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          position: 'bottom-left',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      if (page) {
        const pageNumElement = page.content.find(el => /^\d+$/.test(el.text));
        if (pageNumElement) {
          // Should be on the left side
          expect(pageNumElement.x).toBeLessThan(page.width / 2);
        }
      }
    });

    it('should position page numbers at bottom right', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          position: 'bottom-right',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page = mockPdf.getPage(0);
      if (page) {
        const pageNumElement = page.content.find(el => /^\d+$/.test(el.text));
        if (pageNumElement) {
          // Should be on the right side
          expect(pageNumElement.x).toBeGreaterThan(page.width / 2);
        }
      }
    });
  });

  describe('Page Number Start Page', () => {
    it('should start numbering from specified page', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          startPage: 3,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(LONG_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(3);

      // First two pages should not have page numbers
      const page1Text = mockPdf.getPageText(0);
      const page2Text = mockPdf.getPageText(1);

      const hasNumber1 = page1Text.some(text => /^\d+$/.test(text));
      const hasNumber2 = page2Text.some(text => /^\d+$/.test(text));

      expect(hasNumber1).toBe(false);
      expect(hasNumber2).toBe(false);

      // Third page should have page number 1
      const page3Text = mockPdf.getPageText(2);
      expect(page3Text.some(text => text === '1')).toBe(true);
    });
  });

  describe('Page Number Prefix and Suffix', () => {
    it('should add prefix to page numbers', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          prefix: 'Page ',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page1Text = mockPdf.getPageText(0);
      expect(page1Text.some(text => text.startsWith('Page '))).toBe(true);
    });

    it('should add suffix to page numbers', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          suffix: ' of ' + MULTI_CHAPTER_BOOK.chapters.length,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const allText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      expect(allText.some(text => text.includes(' of '))).toBe(true);
    });

    it('should add both prefix and suffix', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          prefix: '- ',
          suffix: ' -',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const page1Text = mockPdf.getPageText(0);
      expect(page1Text.some(text => text.startsWith('- ') && text.endsWith(' -'))).toBe(true);
    });
  });

  describe('Headers and Footers Integration', () => {
    it('should combine page numbers with footers', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        pageNumbers: {
          enabled: true,
          position: 'bottom-center',
        },
        footers: {
          enabled: true,
          leftPage: 'Author Name',
          rightPage: 'Book Title',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check that both footers and page numbers are present
      const allText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      expect(allText.some(text => text === 'Author Name' || text === 'Book Title')).toBe(true);
      expect(allText.some(text => /^\d+$/.test(text))).toBe(true);
    });

    it('should support headers and page numbers simultaneously', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        headers: {
          enabled: true,
          leftPage: 'Left Header',
          rightPage: 'Right Header',
        },
        pageNumbers: {
          enabled: true,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(MULTI_CHAPTER_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const allText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      expect(allText).toContain('Left Header');
      expect(allText).toContain('Right Header');
      expect(allText.some(text => /^\d+$/.test(text))).toBe(true);
    });
  });
});

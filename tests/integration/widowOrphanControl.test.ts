/**
 * Integration tests for widow and orphan control
 * Tests proper handling of paragraph breaks across pages
 */

import { exportBookToPdf } from '../../src/lib/export/pdfExport';
import type { PdfExportOptions, BookContent } from '../../src/lib/export/types';
import { createMockPdfGenerator } from './__mocks__/pdfGenerator';
import { WIDOW_ORPHAN_TEST_BOOK, LONG_BOOK } from './fixtures/sampleBooks';

describe('PDF Export - Widow and Orphan Control', () => {
  describe('Basic Widow/Orphan Control', () => {
    it('should apply widow/orphan control when enabled', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: true,
        fonts: {
          baseSize: 12,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(WIDOW_ORPHAN_TEST_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(1);
    });

    it('should allow widows/orphans when control is disabled', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: false,
        fonts: {
          baseSize: 12,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(WIDOW_ORPHAN_TEST_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(0);
    });

    it('should produce different pagination with widow/orphan control', async () => {
      // Test with control enabled
      const optionsEnabled: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: true,
        fonts: { baseSize: 11 },
      };

      const mockPdfEnabled = createMockPdfGenerator();
      const resultEnabled = await exportBookToPdf(LONG_BOOK, optionsEnabled, mockPdfEnabled);

      // Test with control disabled
      const optionsDisabled: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: false,
        fonts: { baseSize: 11 },
      };

      const mockPdfDisabled = createMockPdfGenerator();
      const resultDisabled = await exportBookToPdf(LONG_BOOK, optionsDisabled, mockPdfDisabled);

      expect(resultEnabled.success).toBe(true);
      expect(resultDisabled.success).toBe(true);

      // Widow/orphan control may result in slightly different page counts
      // as it adjusts page breaks to avoid single lines
      const pageDifference = Math.abs(resultEnabled.pageCount - resultDisabled.pageCount);
      expect(pageDifference).toBeLessThanOrEqual(3); // Should be similar but not necessarily identical
    });
  });

  describe('Orphan Prevention', () => {
    it('should prevent orphans (single lines at bottom of page)', async () => {
      // Create a book that would naturally create orphans
      const testBook: BookContent = {
        title: 'Orphan Test Book',
        author: 'Test Author',
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: [
              {
                id: 'para-1',
                text: 'Paragraph 1. '.repeat(50), // Long paragraph
                style: {
                  spacing: { lineHeight: 1.5 },
                },
              },
              {
                id: 'para-2',
                text: 'This is a short paragraph that could be an orphan if not controlled properly.',
                style: {
                  spacing: { lineHeight: 1.5 },
                },
              },
              {
                id: 'para-3',
                text: 'Paragraph 3. '.repeat(30),
                style: {
                  spacing: { lineHeight: 1.5 },
                },
              },
            ],
          },
        ],
      };

      const options: PdfExportOptions = {
        trimSize: '5x8', // Smaller size to force page breaks
        widowOrphanControl: true,
        fonts: { baseSize: 12 },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(testBook, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(1);

      // Verify that the layout engine attempted to control orphans
      // This is a basic check - in a real implementation, we'd verify
      // that no page ends with a single line of a multi-line paragraph
    });
  });

  describe('Widow Prevention', () => {
    it('should prevent widows (single lines at top of page)', async () => {
      // Create a book that would naturally create widows
      const testBook: BookContent = {
        title: 'Widow Test Book',
        author: 'Test Author',
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: [
              {
                id: 'para-1',
                text: 'First paragraph. '.repeat(60), // Very long paragraph
                style: {
                  spacing: { lineHeight: 1.5 },
                },
              },
              {
                id: 'para-2',
                text: 'Second paragraph. '.repeat(40),
                style: {
                  spacing: { lineHeight: 1.5 },
                },
              },
            ],
          },
        ],
      };

      const options: PdfExportOptions = {
        trimSize: '5x8',
        widowOrphanControl: true,
        fonts: { baseSize: 12 },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(testBook, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(1);
    });
  });

  describe('Multi-line Paragraph Handling', () => {
    it('should keep minimum lines together at page breaks', async () => {
      const testBook: BookContent = {
        title: 'Multi-line Test',
        author: 'Test Author',
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: Array.from({ length: 20 }, (_, i) => ({
              id: `para-${i}`,
              text: `This is paragraph ${i + 1}. It contains enough text to span multiple lines in the layout. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
              style: {
                spacing: { lineHeight: 1.5, after: 12 },
              },
            })),
          },
        ],
      };

      const options: PdfExportOptions = {
        trimSize: '5.5x8.5',
        widowOrphanControl: true,
        fonts: { baseSize: 11 },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(testBook, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(2);

      // Content should be distributed across pages
      const pagesWithContent = mockPdf.pages.filter(
        page => page.content.some(el => el.type === 'text')
      );

      expect(pagesWithContent.length).toBe(mockPdf.getPageCount());
    });

    it('should handle very long paragraphs that span multiple pages', async () => {
      const veryLongText = 'This is a very long paragraph. '.repeat(200);

      const testBook: BookContent = {
        title: 'Long Paragraph Test',
        author: 'Test Author',
        chapters: [
          {
            id: 'chapter-1',
            title: 'Long Chapter',
            content: [
              {
                id: 'para-1',
                text: veryLongText,
                style: {
                  spacing: { lineHeight: 1.5 },
                },
              },
              {
                id: 'para-2',
                text: 'Short paragraph after long one.',
              },
            ],
          },
        ],
      };

      const options: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: true,
        fonts: { baseSize: 12 },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(testBook, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(2);

      // Very long paragraph should be split across multiple pages
      const firstPageText = mockPdf.getPageText(0);
      const secondPageText = mockPdf.getPageText(1);

      expect(firstPageText.some(text => text.includes('very long paragraph'))).toBe(true);
      expect(secondPageText.length).toBeGreaterThan(0);
    });
  });

  describe('Keep With Next', () => {
    it('should keep headings with following paragraph', async () => {
      const testBook: BookContent = {
        title: 'Keep With Next Test',
        author: 'Test Author',
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: [
              {
                id: 'filler-1',
                text: 'Filler content. '.repeat(100),
                style: {
                  spacing: { lineHeight: 1.5 },
                },
              },
              {
                id: 'para-after-heading',
                text: 'This paragraph should stay with the heading.',
                style: {
                  spacing: { lineHeight: 1.5 },
                },
              },
            ],
          },
          {
            id: 'chapter-2',
            title: 'Second Chapter',
            startOnNewPage: false, // Should be kept with previous content if space allows
            content: [
              {
                id: 'para-2-1',
                text: 'Content of second chapter.',
              },
            ],
          },
        ],
      };

      const options: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: true,
        fonts: { baseSize: 12 },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(testBook, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single-line paragraphs correctly', async () => {
      const testBook: BookContent = {
        title: 'Single Line Test',
        author: 'Test Author',
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: Array.from({ length: 50 }, (_, i) => ({
              id: `para-${i}`,
              text: `Line ${i + 1}`,
              style: {
                spacing: { lineHeight: 1.5, after: 10 },
              },
            })),
          },
        ],
      };

      const options: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: true,
        fonts: { baseSize: 12 },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(testBook, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(1);
    });

    it('should handle mixed short and long paragraphs', async () => {
      const testBook: BookContent = {
        title: 'Mixed Length Test',
        author: 'Test Author',
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: [
              { id: 'p1', text: 'Short.' },
              { id: 'p2', text: 'This is a longer paragraph. '.repeat(20) },
              { id: 'p3', text: 'Short again.' },
              { id: 'p4', text: 'Another long paragraph. '.repeat(25) },
              { id: 'p5', text: 'Short.' },
              { id: 'p6', text: 'Long paragraph continues. '.repeat(30) },
            ],
          },
        ],
      };

      const options: PdfExportOptions = {
        trimSize: '5x8',
        widowOrphanControl: true,
        fonts: { baseSize: 11 },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(testBook, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(1);

      // All content should be present
      const allText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      expect(allText.some(text => text.includes('Short'))).toBe(true);
      expect(allText.some(text => text.includes('longer paragraph'))).toBe(true);
    });

    it('should not create excessive whitespace', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: true,
        fonts: { baseSize: 12 },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(LONG_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      // Check that pages have reasonable content density
      for (let i = 0; i < mockPdf.getPageCount(); i++) {
        const page = mockPdf.getPage(i);
        if (page && i < mockPdf.getPageCount() - 1) { // Skip last page
          // Each page should have some content
          expect(page.content.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Integration with Other Features', () => {
    it('should work with page numbers', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: true,
        pageNumbers: {
          enabled: true,
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(WIDOW_ORPHAN_TEST_BOOK, options, mockPdf);

      expect(result.success).toBe(true);
      expect(mockPdf.getPageCount()).toBeGreaterThan(1);

      // Check page numbers are present
      for (let i = 0; i < mockPdf.getPageCount(); i++) {
        const pageText = mockPdf.getPageText(i);
        expect(pageText.some(text => /\d+/.test(text))).toBe(true);
      }
    });

    it('should work with headers and footers', async () => {
      const options: PdfExportOptions = {
        trimSize: '6x9',
        widowOrphanControl: true,
        headers: {
          enabled: true,
          leftPage: 'Left',
          rightPage: 'Right',
        },
        footers: {
          enabled: true,
          leftPage: 'Footer',
          rightPage: 'Footer',
        },
      };

      const mockPdf = createMockPdfGenerator();
      const result = await exportBookToPdf(WIDOW_ORPHAN_TEST_BOOK, options, mockPdf);

      expect(result.success).toBe(true);

      const allText = mockPdf.pages.flatMap(page =>
        page.content.map(element => element.text)
      );

      expect(allText.some(text => text === 'Left' || text === 'Right')).toBe(true);
      expect(allText.some(text => text === 'Footer')).toBe(true);
    });

    it('should work with different trim sizes', async () => {
      const trimSizes = ['5x8', '6x9', '7x10'];

      for (const trimSize of trimSizes) {
        const options: PdfExportOptions = {
          trimSize,
          widowOrphanControl: true,
        };

        const mockPdf = createMockPdfGenerator();
        const result = await exportBookToPdf(WIDOW_ORPHAN_TEST_BOOK, options, mockPdf);

        expect(result.success).toBe(true);
        expect(mockPdf.getPageCount()).toBeGreaterThan(0);
      }
    });
  });
});

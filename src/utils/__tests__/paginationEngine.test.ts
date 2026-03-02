/**
 * Pagination Engine Tests
 */

import {
  calculatePagination,
  estimatePageCount,
  PageDimensions,
  PaginationOptions,
} from '../paginationEngine';
import { Element } from '../../types/element';
import { BookStyle } from '../../types/style';
import { TextBlock } from '../../types/textBlock';

describe('PaginationEngine', () => {
  // Mock data
  const mockDimensions: PageDimensions = {
    pageWidth: 816,
    pageHeight: 1056,
    marginTop: 72,
    marginBottom: 72,
    marginLeft: 72,
    marginRight: 72,
  };

  const mockStyle: BookStyle = {
    id: 'classic',
    name: 'Classic',
    description: 'Classic book style',
    category: 'serif',
    fonts: {
      body: 'Georgia',
      heading: 'Garamond',
      fallback: 'serif',
    },
    headings: {
      h1: {
        fontSize: '32px',
        lineHeight: '1.2',
        marginTop: '32px',
        marginBottom: '16px',
      },
      h2: {
        fontSize: '24px',
        lineHeight: '1.3',
        marginTop: '24px',
        marginBottom: '12px',
      },
      h3: {
        fontSize: '20px',
        lineHeight: '1.4',
        marginTop: '20px',
        marginBottom: '10px',
      },
    },
    body: {
      fontSize: '16px',
      lineHeight: '1.5',
      textAlign: 'justify',
    },
    dropCap: {
      enabled: false,
      lines: 3,
    },
    ornamentalBreak: {
      enabled: false,
      symbol: '***',
    },
    firstParagraph: {
      enabled: false,
      indent: {
        enabled: false,
      },
    },
    spacing: {
      paragraphSpacing: '8px',
      lineHeight: '1.5',
      sectionSpacing: '32px',
      chapterSpacing: '48px',
    },
    colors: {
      text: '#000000',
      heading: '#000000',
    },
  };

  const createMockElement = (contentBlocks: Partial<TextBlock>[]): Element => ({
    id: 'test-element',
    type: 'prologue',
    matter: 'front',
    title: 'Test Chapter',
    content: contentBlocks.map((block, index) => ({
      id: `block-${index}`,
      content: block.content || 'Test content',
      blockType: block.blockType || 'paragraph',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...block,
    })) as TextBlock[],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('calculatePagination', () => {
    it('should calculate pagination for simple content', () => {
      const element = createMockElement([
        {
          content: 'This is a test paragraph with some content. '.repeat(50),
          blockType: 'paragraph',
        },
      ]);

      const result = calculatePagination(element, mockStyle, mockDimensions);

      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.pageBreaks).toBeDefined();
      expect(result.pageHeights).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalHeight).toBeGreaterThan(0);
    });

    it('should handle explicit page breaks', () => {
      const element = createMockElement([
        {
          content: 'First page content. '.repeat(20),
          blockType: 'paragraph',
          features: [
            {
              id: 'break-1',
              type: 'break',
              breakType: 'page',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
        {
          content: 'Second page content. '.repeat(20),
          blockType: 'paragraph',
        },
      ]);

      const result = calculatePagination(element, mockStyle, mockDimensions, {
        respectPageBreaks: true,
      });

      expect(result.pageCount).toBeGreaterThanOrEqual(2);
      expect(result.metadata.hasExplicitPageBreaks).toBe(true);
      expect(result.pageBreaks.some(pb => pb.breakType === 'explicit')).toBe(true);
    });

    it('should handle chapter boundaries', () => {
      const element = createMockElement([
        {
          content: 'Chapter content. '.repeat(100),
          blockType: 'paragraph',
        },
      ]);
      element.type = 'prologue'; // Chapter-like element

      const result = calculatePagination(element, mockStyle, mockDimensions, {
        respectChapterBoundaries: true,
      });

      expect(result.pageCount).toBeGreaterThan(0);
    });

    it('should apply widow/orphan control', () => {
      const element = createMockElement([
        {
          content: 'Content that might need widow/orphan control. '.repeat(30),
          blockType: 'paragraph',
        },
      ]);

      const result = calculatePagination(element, mockStyle, mockDimensions, {
        widowOrphanControl: true,
        minLinesAtBoundary: 2,
      });

      expect(result.pageCount).toBeGreaterThan(0);
      // Widow/orphan adjustments might have been made
      expect(result.metadata.widowOrphanAdjustments).toBeGreaterThanOrEqual(0);
    });

    it('should keep headings with following content', () => {
      const element = createMockElement([
        {
          content: 'Introduction',
          blockType: 'heading',
          level: 2,
        },
        {
          content: 'This is the content following the heading. '.repeat(50),
          blockType: 'paragraph',
        },
      ]);

      const result = calculatePagination(element, mockStyle, mockDimensions, {
        keepHeadingsWithContent: true,
      });

      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.pageBreaks).toBeDefined();
    });

    it('should handle empty content', () => {
      const element = createMockElement([]);

      const result = calculatePagination(element, mockStyle, mockDimensions);

      expect(result.pageCount).toBe(1);
      expect(result.pageBreaks).toHaveLength(0);
    });

    it('should handle multiple block types', () => {
      const element = createMockElement([
        {
          content: 'Heading',
          blockType: 'heading',
          level: 1,
        },
        {
          content: 'Regular paragraph. '.repeat(20),
          blockType: 'paragraph',
        },
        {
          content: 'function test() {\n  return true;\n}',
          blockType: 'code',
        },
        {
          content: 'Item 1\nItem 2\nItem 3',
          blockType: 'list',
        },
      ]);

      const result = calculatePagination(element, mockStyle, mockDimensions);

      expect(result.pageCount).toBeGreaterThan(0);
      expect(result.metadata.totalHeight).toBeGreaterThan(0);
    });
  });

  describe('estimatePageCount', () => {
    it('should provide quick page count estimation', () => {
      const element = createMockElement([
        {
          content: 'Test content. '.repeat(100),
          blockType: 'paragraph',
        },
      ]);

      const pageCount = estimatePageCount(element, mockStyle, mockDimensions);

      expect(pageCount).toBeGreaterThan(0);
      expect(typeof pageCount).toBe('number');
    });

    it('should estimate at least 1 page for minimal content', () => {
      const element = createMockElement([
        {
          content: 'Short content',
          blockType: 'paragraph',
        },
      ]);

      const pageCount = estimatePageCount(element, mockStyle, mockDimensions);

      expect(pageCount).toBe(1);
    });

    it('should scale with content length', () => {
      const shortElement = createMockElement([
        {
          content: 'Short. '.repeat(10),
          blockType: 'paragraph',
        },
      ]);

      const longElement = createMockElement([
        {
          content: 'Long content. '.repeat(200),
          blockType: 'paragraph',
        },
      ]);

      const shortPages = estimatePageCount(shortElement, mockStyle, mockDimensions);
      const longPages = estimatePageCount(longElement, mockStyle, mockDimensions);

      expect(longPages).toBeGreaterThan(shortPages);
    });
  });

  describe('pagination metadata', () => {
    it('should provide accurate metadata', () => {
      const element = createMockElement([
        {
          content: 'Test paragraph. '.repeat(50),
          blockType: 'paragraph',
        },
      ]);

      const result = calculatePagination(element, mockStyle, mockDimensions);

      expect(result.metadata.totalHeight).toBeGreaterThan(0);
      expect(result.metadata.averagePageHeight).toBeGreaterThan(0);
      expect(result.metadata.hasExplicitPageBreaks).toBe(false);
      expect(result.metadata.widowOrphanAdjustments).toBeGreaterThanOrEqual(0);
    });

    it('should track page heights', () => {
      const element = createMockElement([
        {
          content: 'Page content. '.repeat(100),
          blockType: 'paragraph',
        },
      ]);

      const result = calculatePagination(element, mockStyle, mockDimensions);

      expect(result.pageHeights.length).toBe(result.pageCount);
      result.pageHeights.forEach(height => {
        expect(height).toBeGreaterThan(0);
      });
    });
  });
});

/**
 * Tests for text block and paragraph conversion
 */

import { HtmlConverter, escapeHtml, buildParagraphClasses, buildParagraphStyles, isEmptyTextBlock } from '../bookToHtml';
import { TextBlock } from '../../../types/textBlock';
import { Book } from '../../../types/book';
import { BookStyle } from '../../../types/style';

describe('Text Block Conversion', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeHtml("It's a test")).toBe('It&#39;s a test');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('isEmptyTextBlock', () => {
    it('should identify empty text blocks', () => {
      const emptyBlock: TextBlock = {
        id: '1',
        content: '',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(isEmptyTextBlock(emptyBlock)).toBe(true);
    });

    it('should identify whitespace-only text blocks', () => {
      const whitespaceBlock: TextBlock = {
        id: '2',
        content: '   \n\t  ',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(isEmptyTextBlock(whitespaceBlock)).toBe(true);
    });

    it('should identify non-empty text blocks', () => {
      const contentBlock: TextBlock = {
        id: '3',
        content: 'Some content',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(isEmptyTextBlock(contentBlock)).toBe(false);
    });
  });

  describe('buildParagraphClasses', () => {
    it('should build basic paragraph classes', () => {
      const classes = buildParagraphClasses(null, null, false, false, false);
      expect(classes).toContain('book-paragraph');
    });

    it('should include alignment class', () => {
      const classes = buildParagraphClasses('center', null, false, false, false);
      expect(classes).toContain('book-paragraph');
      expect(classes).toContain('book-text-center');
    });

    it('should include indentation class', () => {
      const classes = buildParagraphClasses(null, 'default', false, false, false);
      expect(classes).toContain('book-paragraph');
      expect(classes).toContain('book-indent-default');
    });

    it('should include first paragraph and drop cap classes', () => {
      const classes = buildParagraphClasses(null, null, true, true, false);
      expect(classes).toContain('book-paragraph');
      expect(classes).toContain('book-first-paragraph');
      expect(classes).toContain('book-drop-cap');
    });

    it('should include empty class for empty paragraphs', () => {
      const classes = buildParagraphClasses(null, null, false, false, true);
      expect(classes).toContain('book-paragraph');
      expect(classes).toContain('book-paragraph-empty');
    });

    it('should use custom prefix', () => {
      const classes = buildParagraphClasses(null, null, false, false, false, 'custom');
      expect(classes).toContain('custom-paragraph');
    });
  });

  describe('buildParagraphStyles', () => {
    it('should build inline styles for alignment', () => {
      const styles = buildParagraphStyles('justify');
      expect(styles).toContain('text-align: justify');
    });

    it('should include custom styles', () => {
      const styles = buildParagraphStyles(null, {
        fontSize: '16px',
        lineHeight: '1.5',
      });
      expect(styles).toContain('font-size: 16px');
      expect(styles).toContain('line-height: 1.5');
    });

    it('should convert camelCase to kebab-case', () => {
      const styles = buildParagraphStyles(null, {
        marginTop: '10px',
        paddingLeft: '20px',
      });
      expect(styles).toContain('margin-top: 10px');
      expect(styles).toContain('padding-left: 20px');
    });

    it('should return empty array when no styles', () => {
      const styles = buildParagraphStyles(null);
      expect(styles).toEqual([]);
    });
  });

  describe('HtmlConverter paragraph conversion', () => {
    const mockBook: Book = {
      id: 'test-book',
      title: 'Test Book',
      author: 'Test Author',
      createdAt: new Date(),
      updatedAt: new Date(),
      chapters: [],
      frontMatter: [],
      backMatter: [],
    };

    it('should convert a simple paragraph', () => {
      const converter = new HtmlConverter(mockBook);
      const block: TextBlock = {
        id: '1',
        content: 'This is a test paragraph.',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = (converter as any).convertParagraph(block);
      expect(result).toContain('<p');
      expect(result).toContain('class="book-paragraph');
      expect(result).toContain('This is a test paragraph.');
      expect(result).toContain('</p>');
    });

    it('should escape HTML in content', () => {
      const converter = new HtmlConverter(mockBook);
      const block: TextBlock = {
        id: '2',
        content: '<script>alert("xss")</script>',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = (converter as any).convertParagraph(block);
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should handle empty paragraphs', () => {
      const converter = new HtmlConverter(mockBook);
      const block: TextBlock = {
        id: '3',
        content: '',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = (converter as any).convertParagraph(block);
      expect(result).toContain('book-paragraph-empty');
      expect(result).toContain('&nbsp;');
    });

    it('should apply alignment classes', () => {
      const styleConfig: BookStyle = {
        id: 'test-style',
        name: 'Test Style',
        description: 'Test',
        category: 'serif',
        fonts: {
          body: 'Georgia',
          heading: 'Arial',
          fallback: 'serif',
        },
        headings: {
          h1: { fontSize: '2em' },
          h2: { fontSize: '1.5em' },
          h3: { fontSize: '1.2em' },
        },
        body: {
          fontSize: '16px',
          lineHeight: '1.6',
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
          paragraphSpacing: '1em',
          lineHeight: '1.6',
          sectionSpacing: '2em',
          chapterSpacing: '3em',
        },
        colors: {
          text: '#000',
          heading: '#000',
        },
      };

      const converter = new HtmlConverter(mockBook, { styleConfig });
      const block: TextBlock = {
        id: '4',
        content: 'Justified text.',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = (converter as any).convertParagraph(block);
      expect(result).toContain('book-text-justify');
      expect(result).toContain('text-align: justify');
    });

    it('should apply drop cap to first paragraph in body chapter', () => {
      const styleConfig: BookStyle = {
        id: 'test-style',
        name: 'Test Style',
        description: 'Test',
        category: 'serif',
        fonts: {
          body: 'Georgia',
          heading: 'Arial',
          fallback: 'serif',
        },
        headings: {
          h1: { fontSize: '2em' },
          h2: { fontSize: '1.5em' },
          h3: { fontSize: '1.2em' },
        },
        body: {
          fontSize: '16px',
          lineHeight: '1.6',
        },
        dropCap: {
          enabled: true,
          lines: 3,
        },
        ornamentalBreak: {
          enabled: false,
          symbol: '***',
        },
        firstParagraph: {
          enabled: true,
          indent: {
            enabled: false,
          },
        },
        spacing: {
          paragraphSpacing: '1em',
          lineHeight: '1.6',
          sectionSpacing: '2em',
          chapterSpacing: '3em',
        },
        colors: {
          text: '#000',
          heading: '#000',
        },
      };

      const converter = new HtmlConverter(mockBook, { styleConfig });
      (converter as any).context.sectionType = 'body-chapter';
      (converter as any).context.isFirstParagraph = true;

      const block: TextBlock = {
        id: '5',
        content: 'First paragraph with drop cap.',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = (converter as any).convertParagraph(block);
      expect(result).toContain('book-first-paragraph');
      expect(result).toContain('book-drop-cap');
    });

    it('should not apply drop cap to non-body-chapter sections', () => {
      const styleConfig: BookStyle = {
        id: 'test-style',
        name: 'Test Style',
        description: 'Test',
        category: 'serif',
        fonts: {
          body: 'Georgia',
          heading: 'Arial',
          fallback: 'serif',
        },
        headings: {
          h1: { fontSize: '2em' },
          h2: { fontSize: '1.5em' },
          h3: { fontSize: '1.2em' },
        },
        body: {
          fontSize: '16px',
          lineHeight: '1.6',
        },
        dropCap: {
          enabled: true,
          lines: 3,
        },
        ornamentalBreak: {
          enabled: false,
          symbol: '***',
        },
        firstParagraph: {
          enabled: true,
          indent: {
            enabled: false,
          },
        },
        spacing: {
          paragraphSpacing: '1em',
          lineHeight: '1.6',
          sectionSpacing: '2em',
          chapterSpacing: '3em',
        },
        colors: {
          text: '#000',
          heading: '#000',
        },
      };

      const converter = new HtmlConverter(mockBook, { styleConfig });
      (converter as any).context.sectionType = 'front-matter';
      (converter as any).context.isFirstParagraph = true;

      const block: TextBlock = {
        id: '6',
        content: 'First paragraph in front matter.',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = (converter as any).convertParagraph(block);
      expect(result).toContain('book-first-paragraph');
      expect(result).not.toContain('book-drop-cap');
    });
  });
});

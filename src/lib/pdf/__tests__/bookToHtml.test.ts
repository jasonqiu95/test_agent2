/**
 * Tests for bookToHtml chapter conversion
 */

import { HtmlConverter, bookToHtml, BookToHtmlOptions } from '../bookToHtml';
import { Book } from '../../../types/book';
import { Chapter } from '../../../types/chapter';
import { Element } from '../../../types/element';

// Helper to create a minimal Book object for testing
function createTestBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'test-book-1',
    title: 'Test Book',
    authors: [{ id: 'author-1', name: 'Test Author' }],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// Helper to create a minimal Chapter object for testing
function createTestChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 'chapter-1',
    title: 'Test Chapter',
    content: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// Helper to create a minimal Element object for testing
function createTestElement(overrides: Partial<Element> = {}): Element {
  return {
    id: 'element-1',
    type: 'preface',
    matter: 'front',
    title: 'Test Element',
    content: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

describe('HtmlConverter - Chapter Conversion', () => {
  describe('convertChapters', () => {
    it('should return empty string when book has no chapters', () => {
      const book = createTestBook({ chapters: [] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();
      expect(html).toBeTruthy(); // Main container is still created
    });

    it('should convert a single chapter with title', () => {
      const chapter = createTestChapter({
        number: 1,
        title: 'The Beginning',
      });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('<article');
      expect(html).toContain('book-chapter');
      expect(html).toContain('Chapter 1');
      expect(html).toContain('The Beginning');
      expect(html).toContain('</article>');
    });

    it('should convert multiple chapters', () => {
      const chapters = [
        createTestChapter({ number: 1, title: 'Chapter One' }),
        createTestChapter({ number: 2, title: 'Chapter Two' }),
        createTestChapter({ number: 3, title: 'Chapter Three' }),
      ];
      const book = createTestBook({ chapters });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('Chapter One');
      expect(html).toContain('Chapter Two');
      expect(html).toContain('Chapter Three');
      expect((html.match(/<article/g) || []).length).toBe(3);
    });

    it('should include chapter subtitle', () => {
      const chapter = createTestChapter({
        number: 1,
        title: 'Main Title',
        subtitle: 'A Subtitle',
      });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('Main Title');
      expect(html).toContain('A Subtitle');
      expect(html).toContain('book-chapter-subtitle');
    });

    it('should include chapter epigraph and attribution', () => {
      const chapter = createTestChapter({
        number: 1,
        title: 'Chapter Title',
        epigraph: 'This is an epigraph',
        epigraphAttribution: 'Famous Author',
      });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('This is an epigraph');
      expect(html).toContain('Famous Author');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('<cite');
    });

    it('should apply semantic HTML5 tags', () => {
      const chapter = createTestChapter({ number: 1, title: 'Test' });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book, { useSemanticTags: true });
      const html = converter.convert();

      expect(html).toContain('<article');
      expect(html).toContain('<header');
      expect(html).toContain('<h1');
      expect(html).toContain('<main');
    });

    it('should use div tags when semantic tags disabled', () => {
      const chapter = createTestChapter({ number: 1, title: 'Test' });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book, { useSemanticTags: false });
      const html = converter.convert();

      expect(html).toContain('<div');
      expect(html).not.toContain('<article');
    });

    it('should include ARIA attributes when enabled', () => {
      const chapter = createTestChapter({ number: 1, title: 'Accessible Chapter' });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book, { includeAria: true });
      const html = converter.convert();

      expect(html).toContain('role="doc-chapter"');
      expect(html).toContain('aria-label="Accessible Chapter"');
      expect(html).toContain('aria-labelledby="chapter-1-heading"');
    });

    it('should not include ARIA attributes when disabled', () => {
      const chapter = createTestChapter({ number: 1, title: 'Test' });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book, {
        includeAria: false,
        includeToc: false // Disable TOC to avoid interference
      });
      const html = converter.convert();

      expect(html).not.toContain('role=');
      expect(html).not.toContain('aria-');
    });

    it('should include chapter numbers when enabled', () => {
      const chapter = createTestChapter({ number: 5, title: 'Test' });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book, { includeChapterNumbers: true });
      const html = converter.convert();

      expect(html).toContain('Chapter 5');
      expect(html).toContain('book-chapter-number');
    });

    it('should not include chapter numbers when disabled', () => {
      const chapter = createTestChapter({ number: 5, title: 'Test' });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book, { includeChapterNumbers: false });
      const html = converter.convert();

      expect(html).not.toContain('Chapter 5');
      expect(html).not.toContain('book-chapter-number');
    });

    it('should handle chapters without numbers', () => {
      const chapter = createTestChapter({ title: 'Unnumbered' });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('Unnumbered');
      expect(html).not.toContain('Chapter ');
    });

    it('should apply custom CSS class prefix', () => {
      const chapter = createTestChapter({ number: 1, title: 'Test' });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book, { classPrefix: 'custom' });
      const html = converter.convert();

      expect(html).toContain('custom-chapter');
      expect(html).toContain('custom-chapter-title');
      expect(html).not.toContain('book-chapter');
    });

    it('should include data attributes for chapter metadata', () => {
      const chapter = createTestChapter({
        id: 'chapter-abc-123',
        number: 7,
        title: 'Test',
      });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('data-chapter-id="chapter-abc-123"');
      expect(html).toContain('data-chapter-number="7"');
    });

    it('should handle part titles and numbers', () => {
      const chapter = createTestChapter({
        number: 1,
        title: 'First Chapter',
        partNumber: 1,
        partTitle: 'Part One: The Beginning',
      });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('Part One: The Beginning');
      expect(html).toContain('book-chapter-part-title');
      expect(html).toContain('book-chapter-part-1');
    });

    it('should apply matter type CSS classes', () => {
      const chapter = createTestChapter({
        number: 1,
        title: 'Test',
        custom: { matterType: 'front' },
      });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('book-chapter-front');
    });

    it('should escape HTML in chapter titles', () => {
      const chapter = createTestChapter({
        number: 1,
        title: '<script>alert("xss")</script>',
      });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should generate proper heading hierarchy', () => {
      const chapter = createTestChapter({
        number: 1,
        title: 'Main Title',
        subtitle: 'Subtitle',
      });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('<h1');
      expect(html).toContain('<h2');
      expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('<h2'));
    });

    it('should insert page breaks between chapters when enabled', () => {
      const chapters = [
        createTestChapter({ number: 1, title: 'Chapter One' }),
        createTestChapter({ number: 2, title: 'Chapter Two' }),
        createTestChapter({ number: 3, title: 'Chapter Three' }),
      ];
      const book = createTestBook({ chapters });
      const converter = new HtmlConverter(book, {
        enablePageBreaks: true,
        includeToc: false // Disable TOC to avoid interference
      });
      const html = converter.convert();

      // Should contain page break divs
      expect(html).toContain('book-page-break');
      // Count page breaks - should be 2 (between chapters, not before first or after last)
      const pageBreaks = (html.match(/book-page-break/g) || []).length;
      expect(pageBreaks).toBe(2);

      // Verify page breaks are positioned correctly (between chapters)
      // Find the closing tags to ensure we're checking positions correctly
      const chapter1End = html.indexOf('</article>', html.indexOf('Chapter One'));
      const chapter2Start = html.indexOf('<article', html.indexOf('Chapter Two') - 100);
      const chapter2End = html.indexOf('</article>', html.indexOf('Chapter Two'));
      const chapter3Start = html.indexOf('<article', html.indexOf('Chapter Three') - 100);

      const firstPageBreakIndex = html.indexOf('book-page-break');
      const lastPageBreakIndex = html.lastIndexOf('book-page-break');

      // First page break should be after chapter 1 ends but before chapter 2 starts
      expect(firstPageBreakIndex).toBeGreaterThan(chapter1End);
      expect(firstPageBreakIndex).toBeLessThan(chapter2Start);

      // Last page break should be after chapter 2 ends but before chapter 3 starts
      expect(lastPageBreakIndex).toBeGreaterThan(chapter2End);
      expect(lastPageBreakIndex).toBeLessThan(chapter3Start);
    });

    it('should not insert page breaks when disabled', () => {
      const chapters = [
        createTestChapter({ number: 1, title: 'Chapter One' }),
        createTestChapter({ number: 2, title: 'Chapter Two' }),
        createTestChapter({ number: 3, title: 'Chapter Three' }),
      ];
      const book = createTestBook({ chapters });
      const converter = new HtmlConverter(book, {
        enablePageBreaks: false,
        includeToc: false // Disable TOC to avoid interference
      });
      const html = converter.convert();

      // Should not contain page break divs
      expect(html).not.toContain('book-page-break');
    });

    it('should not add page break before first chapter', () => {
      const chapters = [
        createTestChapter({ number: 1, title: 'Chapter One' }),
        createTestChapter({ number: 2, title: 'Chapter Two' }),
      ];
      const book = createTestBook({ chapters });
      const converter = new HtmlConverter(book, {
        enablePageBreaks: true,
        includeToc: false // Disable TOC to avoid interference
      });
      const html = converter.convert();

      const chapter1Start = html.indexOf('<article');
      const firstPageBreakIndex = html.indexOf('book-page-break');

      // First page break should come after the first chapter starts
      expect(firstPageBreakIndex).toBeGreaterThan(chapter1Start);
    });

    it('should handle single chapter without page breaks', () => {
      const chapter = createTestChapter({ number: 1, title: 'Only Chapter' });
      const book = createTestBook({ chapters: [chapter] });
      const converter = new HtmlConverter(book, {
        enablePageBreaks: true,
        includeToc: false // Disable TOC to avoid interference
      });
      const html = converter.convert();

      // Should not contain any page breaks with only one chapter
      expect(html).not.toContain('book-page-break');
    });
  });

  describe('convertFrontMatter and convertBackMatter', () => {
    it('should convert front matter elements', () => {
      const element = createTestElement({
        type: 'preface',
        matter: 'front',
        title: 'Preface',
      });
      const book = createTestBook({ frontMatter: [element] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('Preface');
      expect(html).toContain('book-element-preface');
      expect(html).toContain('book-element-front');
    });

    it('should convert back matter elements', () => {
      const element = createTestElement({
        type: 'appendix',
        matter: 'back',
        title: 'Appendix A',
      });
      const book = createTestBook({ backMatter: [element] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('Appendix A');
      expect(html).toContain('book-element-appendix');
      expect(html).toContain('book-element-back');
    });

    it('should apply appropriate ARIA roles for elements', () => {
      const preface = createTestElement({
        type: 'preface',
        matter: 'front',
        title: 'Preface',
      });
      const book = createTestBook({ frontMatter: [preface] });
      const converter = new HtmlConverter(book, { includeAria: true });
      const html = converter.convert();

      expect(html).toContain('role="doc-preface"');
    });

    it('should include element data attributes', () => {
      const element = createTestElement({
        id: 'element-xyz-789',
        type: 'acknowledgments',
        matter: 'front',
        title: 'Acknowledgments',
      });
      const book = createTestBook({ frontMatter: [element] });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('data-element-id="element-xyz-789"');
      expect(html).toContain('data-element-type="acknowledgments"');
    });
  });

  describe('convert - Full Book', () => {
    it('should convert a complete book structure', () => {
      const book = createTestBook({
        frontMatter: [
          createTestElement({
            type: 'preface',
            matter: 'front',
            title: 'Preface',
          }),
        ],
        chapters: [
          createTestChapter({ number: 1, title: 'Chapter One' }),
          createTestChapter({ number: 2, title: 'Chapter Two' }),
        ],
        backMatter: [
          createTestElement({
            type: 'appendix',
            matter: 'back',
            title: 'Appendix',
          }),
        ],
      });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      // Check order
      const prefaceIndex = html.indexOf('Preface');
      const chapter1Index = html.indexOf('Chapter One');
      const chapter2Index = html.indexOf('Chapter Two');
      const appendixIndex = html.indexOf('Appendix');

      expect(prefaceIndex).toBeLessThan(chapter1Index);
      expect(chapter1Index).toBeLessThan(chapter2Index);
      expect(chapter2Index).toBeLessThan(appendixIndex);
    });

    it('should wrap content in main container with semantic tags', () => {
      const book = createTestBook({
        chapters: [createTestChapter({ number: 1, title: 'Test' })],
      });
      const converter = new HtmlConverter(book, { useSemanticTags: true });
      const html = converter.convert();

      expect(html).toMatch(/^<main/);
      expect(html).toMatch(/<\/main>$/);
      expect(html).toContain('role="main"');
    });
  });

  describe('bookToHtml function', () => {
    it('should convert book using exported function', () => {
      const book = createTestBook({
        chapters: [createTestChapter({ number: 1, title: 'Test Chapter' })],
      });
      const html = bookToHtml(book);

      expect(html).toContain('Test Chapter');
      expect(html).toContain('<article');
    });

    it('should accept options', () => {
      const book = createTestBook({
        chapters: [createTestChapter({ number: 1, title: 'Test' })],
      });
      const html = bookToHtml(book, {
        classPrefix: 'mybook',
        includeChapterNumbers: false,
      });

      expect(html).toContain('mybook-chapter');
      expect(html).not.toContain('Chapter 1');
    });
  });
});

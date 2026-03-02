/**
 * Tests for bookToHtml Table of Contents generation
 */

import { HtmlConverter, generateTocHtml, collectTocEntries, BookToHtmlOptions } from '../bookToHtml';
import { Book } from '../../../types/book';
import { Chapter } from '../../../types/chapter';
import { Element } from '../../../types/element';
import { TextBlock } from '../../../types/textBlock';

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

// Helper to create a heading TextBlock
function createHeading(level: number, content: string): TextBlock {
  return {
    blockType: 'heading',
    level,
    content,
  };
}

describe('Table of Contents Generation', () => {
  describe('collectTocEntries', () => {
    it('should collect entries from front matter', () => {
      const book = createTestBook({
        frontMatter: [
          createTestElement({ id: 'preface', type: 'preface', title: 'Preface' }),
          createTestElement({ id: 'intro', type: 'introduction', title: 'Introduction' }),
        ],
      });

      const options: BookToHtmlOptions = { tocDepth: 'chapters' };
      const entries = collectTocEntries(book, options);

      expect(entries).toHaveLength(2);
      expect(entries[0].title).toBe('Preface');
      expect(entries[0].id).toBe('element-preface');
      expect(entries[0].type).toBe('element');
      expect(entries[1].title).toBe('Introduction');
    });

    it('should collect entries from chapters', () => {
      const book = createTestBook({
        chapters: [
          createTestChapter({ id: 'ch1', number: 1, title: 'First Chapter' }),
          createTestChapter({ id: 'ch2', number: 2, title: 'Second Chapter' }),
        ],
      });

      const options: BookToHtmlOptions = { tocDepth: 'chapters' };
      const entries = collectTocEntries(book, options);

      expect(entries).toHaveLength(2);
      expect(entries[0].title).toContain('First Chapter');
      expect(entries[0].id).toBe('chapter-1-heading');
      expect(entries[0].type).toBe('chapter');
      expect(entries[1].title).toContain('Second Chapter');
    });

    it('should collect entries from back matter', () => {
      const book = createTestBook({
        backMatter: [
          createTestElement({ id: 'epilogue', type: 'epilogue', title: 'Epilogue', matter: 'back' }),
          createTestElement({ id: 'appendix', type: 'appendix', title: 'Appendix A', matter: 'back' }),
        ],
      });

      const options: BookToHtmlOptions = { tocDepth: 'chapters' };
      const entries = collectTocEntries(book, options);

      expect(entries).toHaveLength(2);
      expect(entries[0].title).toBe('Epilogue');
      expect(entries[1].title).toBe('Appendix A');
    });

    it('should respect includeInToc flag', () => {
      const book = createTestBook({
        frontMatter: [
          createTestElement({ id: 'preface', title: 'Preface', includeInToc: true }),
          createTestElement({ id: 'copyright', title: 'Copyright', includeInToc: false }),
        ],
      });

      const options: BookToHtmlOptions = { tocDepth: 'chapters' };
      const entries = collectTocEntries(book, options);

      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Preface');
    });

    it('should collect chapter subheadings when tocDepth is subheads', () => {
      const book = createTestBook({
        chapters: [
          createTestChapter({
            id: 'ch1',
            number: 1,
            title: 'First Chapter',
            content: [
              createHeading(1, 'Section 1'),
              { blockType: 'paragraph', content: 'Some text' },
              createHeading(2, 'Subsection 1.1'),
              createHeading(1, 'Section 2'),
            ],
          }),
        ],
      });

      const options: BookToHtmlOptions = { tocDepth: 'subheads', tocMaxHeadingLevel: 2 };
      const entries = collectTocEntries(book, options);

      expect(entries).toHaveLength(1);
      expect(entries[0].children).toHaveLength(3); // Two h1s and one h2
      expect(entries[0].children?.[0].title).toBe('Section 1');
      expect(entries[0].children?.[1].title).toBe('Subsection 1.1');
      expect(entries[0].children?.[2].title).toBe('Section 2');
    });

    it('should group chapters by parts', () => {
      const book = createTestBook({
        chapters: [
          createTestChapter({ id: 'ch1', number: 1, title: 'Chapter 1', partNumber: 1, partTitle: 'Part One' }),
          createTestChapter({ id: 'ch2', number: 2, title: 'Chapter 2', partNumber: 1, partTitle: 'Part One' }),
          createTestChapter({ id: 'ch3', number: 3, title: 'Chapter 3', partNumber: 2, partTitle: 'Part Two' }),
        ],
      });

      const options: BookToHtmlOptions = { tocDepth: 'chapters' };
      const entries = collectTocEntries(book, options);

      expect(entries).toHaveLength(2); // Two parts
      expect(entries[0].type).toBe('part');
      expect(entries[0].title).toBe('Part One');
      expect(entries[0].children).toHaveLength(2);
      expect(entries[1].type).toBe('part');
      expect(entries[1].title).toBe('Part Two');
      expect(entries[1].children).toHaveLength(1);
    });

    it('should only collect parts when tocDepth is parts', () => {
      const book = createTestBook({
        chapters: [
          createTestChapter({ id: 'ch1', number: 1, title: 'Chapter 1', partNumber: 1, partTitle: 'Part One' }),
          createTestChapter({ id: 'ch2', number: 2, title: 'Chapter 2', partNumber: 1, partTitle: 'Part One' }),
        ],
      });

      const options: BookToHtmlOptions = { tocDepth: 'parts' };
      const entries = collectTocEntries(book, options);

      expect(entries).toHaveLength(1); // One part
      expect(entries[0].type).toBe('part');
      expect(entries[0].children).toBeUndefined(); // No chapter children when depth is 'parts'
    });
  });

  describe('generateTocHtml', () => {
    it('should generate empty string when includeToc is false', () => {
      const book = createTestBook({
        chapters: [createTestChapter({ number: 1, title: 'Chapter 1' })],
      });

      const options: BookToHtmlOptions = { includeToc: false };
      const html = generateTocHtml(book, options);

      expect(html).toBe('');
    });

    it('should generate TOC HTML with nav element', () => {
      const book = createTestBook({
        chapters: [createTestChapter({ number: 1, title: 'Chapter 1' })],
      });

      const options: BookToHtmlOptions = { includeToc: true };
      const html = generateTocHtml(book, options);

      expect(html).toContain('<nav');
      expect(html).toContain('book-toc');
      expect(html).toContain('role="doc-toc"');
      expect(html).toContain('aria-label="Table of Contents"');
      expect(html).toContain('</nav>');
    });

    it('should generate TOC with chapter links', () => {
      const book = createTestBook({
        chapters: [
          createTestChapter({ number: 1, title: 'First Chapter' }),
          createTestChapter({ number: 2, title: 'Second Chapter' }),
        ],
      });

      const options: BookToHtmlOptions = { includeToc: true, includeChapterNumbers: true };
      const html = generateTocHtml(book, options);

      expect(html).toContain('href="#chapter-1-heading"');
      expect(html).toContain('href="#chapter-2-heading"');
      expect(html).toContain('Chapter 1');
      expect(html).toContain('First Chapter');
      expect(html).toContain('Second Chapter');
    });

    it('should generate TOC with nested lists for hierarchical structure', () => {
      const book = createTestBook({
        chapters: [
          createTestChapter({
            number: 1,
            title: 'Chapter 1',
            content: [createHeading(1, 'Section 1')],
          }),
        ],
      });

      const options: BookToHtmlOptions = { includeToc: true, tocDepth: 'subheads' };
      const html = generateTocHtml(book, options);

      expect(html).toContain('<ol>');
      expect(html).toContain('</ol>');
      // Check for nested ol
      const olMatches = html.match(/<ol>/g);
      expect(olMatches && olMatches.length).toBeGreaterThan(1);
    });

    it('should include page number placeholders when tocIncludePageNumbers is true', () => {
      const book = createTestBook({
        chapters: [createTestChapter({ number: 1, title: 'Chapter 1' })],
      });

      const options: BookToHtmlOptions = { includeToc: true, tocIncludePageNumbers: true };
      const html = generateTocHtml(book, options);

      expect(html).toContain('book-toc-page-number');
      expect(html).toContain('000');
    });

    it('should apply tocVariant class', () => {
      const book = createTestBook({
        chapters: [createTestChapter({ number: 1, title: 'Chapter 1' })],
      });

      const optionsFrontMatter: BookToHtmlOptions = { includeToc: true, tocVariant: 'front-matter' };
      const htmlFrontMatter = generateTocHtml(book, optionsFrontMatter);
      expect(htmlFrontMatter).toContain('book-toc-front-matter');

      const optionsNavigation: BookToHtmlOptions = { includeToc: true, tocVariant: 'navigation' };
      const htmlNavigation = generateTocHtml(book, optionsNavigation);
      expect(htmlNavigation).toContain('book-toc-navigation');
    });

    it('should include TOC title', () => {
      const book = createTestBook({
        chapters: [createTestChapter({ number: 1, title: 'Chapter 1' })],
      });

      const options: BookToHtmlOptions = { includeToc: true };
      const html = generateTocHtml(book, options);

      expect(html).toContain('<h1');
      expect(html).toContain('Contents');
      expect(html).toContain('book-element-title-toc');
    });
  });

  describe('HtmlConverter integration', () => {
    it('should include TOC in converted HTML', () => {
      const book = createTestBook({
        chapters: [
          createTestChapter({ number: 1, title: 'Chapter 1' }),
          createTestChapter({ number: 2, title: 'Chapter 2' }),
        ],
      });

      const converter = new HtmlConverter(book, { includeToc: true });
      const html = converter.convert();

      expect(html).toContain('<nav');
      expect(html).toContain('book-toc');
      expect(html).toContain('Contents');
      expect(html).toContain('href="#chapter-1-heading"');
      expect(html).toContain('href="#chapter-2-heading"');
    });

    it('should exclude TOC when includeToc is false', () => {
      const book = createTestBook({
        chapters: [createTestChapter({ number: 1, title: 'Chapter 1' })],
      });

      const converter = new HtmlConverter(book, { includeToc: false });
      const html = converter.convert();

      expect(html).not.toContain('book-toc');
      expect(html).not.toContain('Contents');
    });

    it('should place navigation TOC at the beginning', () => {
      const book = createTestBook({
        frontMatter: [createTestElement({ id: 'preface', title: 'Preface' })],
        chapters: [createTestChapter({ number: 1, title: 'Chapter 1' })],
      });

      const converter = new HtmlConverter(book, { includeToc: true, tocVariant: 'navigation' });
      const html = converter.convert();

      const tocIndex = html.indexOf('<nav');
      const prefaceIndex = html.indexOf('Preface');
      const chapterIndex = html.indexOf('Chapter 1');

      expect(tocIndex).toBeLessThan(prefaceIndex);
      expect(tocIndex).toBeLessThan(chapterIndex);
    });

    it('should place front-matter TOC after front matter', () => {
      const book = createTestBook({
        frontMatter: [createTestElement({ id: 'preface', title: 'Preface' })],
        chapters: [createTestChapter({ number: 1, title: 'Chapter 1' })],
      });

      const converter = new HtmlConverter(book, { includeToc: true, tocVariant: 'front-matter' });
      const html = converter.convert();

      const prefaceIndex = html.indexOf('Preface');
      const tocIndex = html.indexOf('<nav');
      const chapterIndex = html.indexOf('Chapter 1');

      expect(prefaceIndex).toBeLessThan(tocIndex);
      expect(tocIndex).toBeLessThan(chapterIndex);
    });
  });
});

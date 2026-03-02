/**
 * Tests for bookToHtml cover page generation
 */

import { HtmlConverter, bookToHtml, BookToHtmlOptions } from '../bookToHtml';
import { Book } from '../../../types/book';

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

describe('HtmlConverter - Cover Page Generation', () => {
  describe('generateCoverPage', () => {
    it('should generate cover page with image when coverImage is provided', () => {
      const book = createTestBook({
        title: 'My Test Book',
        coverImage: 'https://example.com/cover.jpg',
      });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('book-cover-page');
      expect(html).toContain('book-cover-image');
      expect(html).toContain('src="https:&#x2F;&#x2F;example.com&#x2F;cover.jpg"');
      expect(html).toContain('alt="Cover of My Test Book"');
    });

    it('should generate title-only cover page when coverImage is missing', () => {
      const book = createTestBook({
        title: 'My Test Book',
        subtitle: 'A Subtitle',
        authors: [
          { id: 'author-1', name: 'Author One' },
          { id: 'author-2', name: 'Author Two' },
        ],
      });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('book-cover-page');
      expect(html).toContain('book-cover-page-title-only');
      expect(html).toContain('book-cover-title');
      expect(html).toContain('My Test Book');
      expect(html).toContain('book-cover-subtitle');
      expect(html).toContain('A Subtitle');
      expect(html).toContain('book-cover-authors');
      expect(html).toContain('Author One, Author Two');
    });

    it('should not generate cover page when both coverImage and title are missing', () => {
      const book = createTestBook({
        title: '',
        coverImage: undefined,
      });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).not.toContain('book-cover-page');
    });

    it('should include ARIA attributes when includeAria is enabled', () => {
      const book = createTestBook({
        title: 'My Test Book',
        coverImage: 'https://example.com/cover.jpg',
      });
      const options: BookToHtmlOptions = {
        includeAria: true,
      };
      const converter = new HtmlConverter(book, options);
      const html = converter.convert();

      expect(html).toContain('role="banner"');
      expect(html).toContain('aria-label="Book cover: My Test Book"');
    });

    it('should not include ARIA attributes when includeAria is disabled', () => {
      const book = createTestBook({
        title: 'My Test Book',
        coverImage: 'https://example.com/cover.jpg',
      });
      const options: BookToHtmlOptions = {
        includeAria: false,
      };
      const converter = new HtmlConverter(book, options);
      const html = converter.convert();

      expect(html).not.toContain('role="banner"');
      expect(html).not.toContain('aria-label=');
    });

    it('should use custom classPrefix when provided', () => {
      const book = createTestBook({
        title: 'My Test Book',
        coverImage: 'https://example.com/cover.jpg',
      });
      const options: BookToHtmlOptions = {
        classPrefix: 'custom',
      };
      const converter = new HtmlConverter(book, options);
      const html = converter.convert();

      expect(html).toContain('custom-cover-page');
      expect(html).toContain('custom-cover-image');
    });

    it('should escape HTML in title and authors', () => {
      const book = createTestBook({
        title: 'Test <script>alert("XSS")</script> Book',
        authors: [
          { id: 'author-1', name: 'Author <b>Bold</b>' },
        ],
      });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<b>Bold</b>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;b&gt;');
    });

    it('should place cover page before front matter', () => {
      const book = createTestBook({
        title: 'My Test Book',
        coverImage: 'https://example.com/cover.jpg',
        frontMatter: [
          {
            id: 'preface-1',
            type: 'preface',
            matter: 'front',
            title: 'Preface',
            content: [],
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
          },
        ],
      });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      const coverPageIndex = html.indexOf('book-cover-page');
      const prefaceIndex = html.indexOf('Preface');

      expect(coverPageIndex).toBeGreaterThan(-1);
      expect(prefaceIndex).toBeGreaterThan(-1);
      expect(coverPageIndex).toBeLessThan(prefaceIndex);
    });

    it('should use semantic section tag when useSemanticTags is enabled', () => {
      const book = createTestBook({
        title: 'My Test Book',
        coverImage: 'https://example.com/cover.jpg',
      });
      const options: BookToHtmlOptions = {
        useSemanticTags: true,
      };
      const converter = new HtmlConverter(book, options);
      const html = converter.convert();

      expect(html).toContain('<section class="book-cover-page"');
      expect(html).toContain('</section>');
    });

    it('should use div tag when useSemanticTags is disabled', () => {
      const book = createTestBook({
        title: 'My Test Book',
        coverImage: 'https://example.com/cover.jpg',
      });
      const options: BookToHtmlOptions = {
        useSemanticTags: false,
      };
      const converter = new HtmlConverter(book, options);
      const html = converter.convert();

      expect(html).toContain('<div class="book-cover-page"');
      expect(html).toContain('</div>');
    });

    it('should handle title-only cover without subtitle', () => {
      const book = createTestBook({
        title: 'My Test Book',
        subtitle: undefined,
        authors: [{ id: 'author-1', name: 'Test Author' }],
      });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('book-cover-title');
      expect(html).toContain('My Test Book');
      expect(html).not.toContain('book-cover-subtitle');
    });

    it('should handle title-only cover without authors', () => {
      const book = createTestBook({
        title: 'My Test Book',
        authors: [],
      });
      const converter = new HtmlConverter(book);
      const html = converter.convert();

      expect(html).toContain('book-cover-title');
      expect(html).toContain('My Test Book');
      expect(html).not.toContain('book-cover-authors');
    });
  });
});

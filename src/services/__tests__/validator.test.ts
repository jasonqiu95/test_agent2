/**
 * Validator Tests
 */

import {
  validateBook,
  getValidationSummary,
  type ValidationResult,
} from '../validator';
import type { Book } from '../../types/book';

describe('Book Validator', () => {
  const createMinimalBook = (): Book => ({
    id: 'test-book',
    createdAt: new Date(),
    updatedAt: new Date(),
    title: 'Test Book',
    authors: [{ id: 'author-1', name: 'Test Author' }],
    frontMatter: [],
    chapters: [
      {
        id: 'chapter-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Chapter 1',
        content: [
          {
            id: 'block-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            content: 'Some content',
            blockType: 'paragraph',
          },
        ],
      },
    ],
    backMatter: [],
    styles: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  describe('validateMetadata', () => {
    it('should pass validation for a book with required metadata', () => {
      const book = createMinimalBook();
      const result = validateBook(book, { validateMetadata: true });

      expect(result.errors.filter((e) => e.category === 'Metadata')).toHaveLength(0);
    });

    it('should fail validation when title is missing', () => {
      const book = createMinimalBook();
      book.title = '';

      const result = validateBook(book, { validateMetadata: true });
      const titleError = result.errors.find((e) => e.id === 'metadata-title-missing');

      expect(titleError).toBeDefined();
      expect(titleError?.severity).toBe('error');
    });

    it('should fail validation when authors are missing', () => {
      const book = createMinimalBook();
      book.authors = [];

      const result = validateBook(book, { validateMetadata: true });
      const authorError = result.errors.find((e) => e.id === 'metadata-author-missing');

      expect(authorError).toBeDefined();
      expect(authorError?.severity).toBe('error');
    });

    it('should warn when description is missing', () => {
      const book = createMinimalBook();

      const result = validateBook(book, { validateMetadata: true });
      const descWarning = result.warnings.find((w) => w.id === 'metadata-description-missing');

      expect(descWarning).toBeDefined();
      expect(descWarning?.severity).toBe('warning');
    });
  });

  describe('validateChapters', () => {
    it('should pass validation for a book with chapters', () => {
      const book = createMinimalBook();

      const result = validateBook(book, { validateChapters: true });
      expect(result.valid).toBe(true);
    });

    it('should fail validation when book has no chapters', () => {
      const book = createMinimalBook();
      book.chapters = [];

      const result = validateBook(book, { validateChapters: true });
      const chapterError = result.errors.find((e) => e.id === 'chapters-empty');

      expect(chapterError).toBeDefined();
      expect(result.valid).toBe(false);
    });

    it('should fail validation when chapter is empty', () => {
      const book = createMinimalBook();
      book.chapters.push({
        id: 'chapter-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Empty Chapter',
        content: [],
      });

      const result = validateBook(book, { validateChapters: true });
      const emptyChapterError = result.errors.find((e) => e.id.startsWith('chapter-empty-'));

      expect(emptyChapterError).toBeDefined();
      expect(emptyChapterError?.location).toContain('Chapter 2');
    });

    it('should warn when chapter has no title', () => {
      const book = createMinimalBook();
      book.chapters[0].title = '';

      const result = validateBook(book, { validateChapters: true });
      const noTitleWarning = result.warnings.find((w) => w.id.startsWith('chapter-no-title-'));

      expect(noTitleWarning).toBeDefined();
    });
  });

  describe('validateISBN', () => {
    it('should pass validation for valid ISBN-10', () => {
      const book = createMinimalBook();
      book.metadata.isbn = '0-306-40615-2';

      const result = validateBook(book, { validateISBN: true });
      const isbnErrors = result.errors.filter((e) => e.category === 'Metadata' && e.id.includes('isbn'));

      expect(isbnErrors).toHaveLength(0);
    });

    it('should pass validation for valid ISBN-13', () => {
      const book = createMinimalBook();
      book.metadata.isbn13 = '978-0-306-40615-7';

      const result = validateBook(book, { validateISBN: true });
      const isbnErrors = result.errors.filter((e) => e.category === 'Metadata' && e.id.includes('isbn'));

      expect(isbnErrors).toHaveLength(0);
    });

    it('should fail validation for invalid ISBN-10', () => {
      const book = createMinimalBook();
      book.metadata.isbn = '0-306-40615-0'; // Invalid check digit

      const result = validateBook(book, { validateISBN: true });
      const isbnError = result.errors.find((e) => e.id === 'isbn-invalid-format');

      expect(isbnError).toBeDefined();
    });

    it('should fail validation for invalid ISBN-13', () => {
      const book = createMinimalBook();
      book.metadata.isbn13 = '978-0-306-40615-0'; // Invalid check digit

      const result = validateBook(book, { validateISBN: true });
      const isbnError = result.errors.find((e) => e.id === 'isbn13-invalid-format');

      expect(isbnError).toBeDefined();
    });

    it('should provide info when no ISBN is provided', () => {
      const book = createMinimalBook();

      const result = validateBook(book, { validateISBN: true });
      const isbnInfo = result.info.find((i) => i.id === 'isbn-missing');

      expect(isbnInfo).toBeDefined();
    });
  });

  describe('validateLinks', () => {
    it('should fail validation for empty link URL', () => {
      const book = createMinimalBook();
      book.chapters[0].content[0].features = [
        {
          id: 'link-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          type: 'link',
          content: 'Click here',
          url: '',
        },
      ];

      const result = validateBook(book, { validateLinks: true });
      const emptyLinkError = result.errors.find((e) => e.id.startsWith('link-empty-'));

      expect(emptyLinkError).toBeDefined();
    });

    it('should warn for insecure HTTP links', () => {
      const book = createMinimalBook();
      book.chapters[0].content[0].features = [
        {
          id: 'link-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          type: 'link',
          content: 'Click here',
          url: 'http://example.com',
        },
      ];

      const result = validateBook(book, { validateLinks: true });
      const insecureWarning = result.warnings.find((w) => w.id.startsWith('link-insecure-'));

      expect(insecureWarning).toBeDefined();
    });

    it('should fail validation for localhost links', () => {
      const book = createMinimalBook();
      book.chapters[0].content[0].features = [
        {
          id: 'link-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          type: 'link',
          content: 'Click here',
          url: 'http://localhost:3000',
        },
      ];

      const result = validateBook(book, { validateLinks: true });
      const localhostError = result.errors.find((e) => e.id.startsWith('link-localhost-'));

      expect(localhostError).toBeDefined();
    });
  });

  describe('validateStyles', () => {
    it('should warn when no styles are defined', () => {
      const book = createMinimalBook();
      book.styles = [];

      const result = validateBook(book, { validateStyles: true });
      const noStylesWarning = result.warnings.find((w) => w.id === 'styles-none');

      expect(noStylesWarning).toBeDefined();
    });

    it('should fail validation when referenced style does not exist', () => {
      const book = createMinimalBook();
      book.chapters[0].style = { styleId: 'non-existent-style' };

      const result = validateBook(book, { validateStyles: true });
      const missingStyleError = result.errors.find((e) => e.id.startsWith('style-missing-'));

      expect(missingStyleError).toBeDefined();
    });

    it('should provide info about unused styles', () => {
      const book = createMinimalBook();
      book.styles = [
        {
          id: 'unused-style',
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'Unused Style',
          fontSize: 12,
        },
      ];

      const result = validateBook(book, { validateStyles: true });
      const unusedStyleInfo = result.info.find((i) => i.id === 'styles-unused');

      expect(unusedStyleInfo).toBeDefined();
    });
  });

  describe('getValidationSummary', () => {
    it('should return success message when no issues', () => {
      const result: ValidationResult = {
        valid: true,
        issues: [],
        errors: [],
        warnings: [],
        info: [],
      };

      const summary = getValidationSummary(result);
      expect(summary).toBe('No issues found. Book is ready for export.');
    });

    it('should summarize errors, warnings, and info', () => {
      const result: ValidationResult = {
        valid: false,
        issues: [
          { id: '1', severity: 'error', category: 'Test', message: 'Error 1' },
          { id: '2', severity: 'error', category: 'Test', message: 'Error 2' },
          { id: '3', severity: 'warning', category: 'Test', message: 'Warning 1' },
          { id: '4', severity: 'info', category: 'Test', message: 'Info 1' },
        ],
        errors: [
          { id: '1', severity: 'error', category: 'Test', message: 'Error 1' },
          { id: '2', severity: 'error', category: 'Test', message: 'Error 2' },
        ],
        warnings: [{ id: '3', severity: 'warning', category: 'Test', message: 'Warning 1' }],
        info: [{ id: '4', severity: 'info', category: 'Test', message: 'Info 1' }],
      };

      const summary = getValidationSummary(result);
      expect(summary).toBe('2 errors, 1 warning, 1 info');
    });
  });
});

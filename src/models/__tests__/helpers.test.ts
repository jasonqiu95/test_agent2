/**
 * Helper Functions Unit Tests
 */

import {
  countWords,
  countTextBlockWords,
  calculateChapterWordCount,
  calculateBookWordCount,
  sortChapters,
  sortElements,
  getTextFeaturesByType,
  getChaptersByPart,
  getFrontMatterByType,
  getBackMatterByType,
  touchMetadata,
  isNumberedChapter,
  generateTableOfContents,
} from '../helpers';
import { createBook, createAuthor, createChapter, createElement, createTextBlock, createLink, createNote } from '../factories';
import type { Book, Chapter, Element, TextBlock, Link, Note } from '../../types';

describe('Helper Functions', () => {
  describe('countWords', () => {
    it('should count words in a simple sentence', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('The quick brown fox')).toBe(4);
    });

    it('should handle empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('should handle strings with only whitespace', () => {
      expect(countWords('   ')).toBe(0);
      expect(countWords('\n\t  ')).toBe(0);
    });

    it('should handle multiple spaces between words', () => {
      expect(countWords('Hello    world')).toBe(2);
      expect(countWords('One  two   three')).toBe(3);
    });

    it('should handle strings with leading/trailing whitespace', () => {
      expect(countWords('  Hello world  ')).toBe(2);
      expect(countWords('\n\tHello world\n')).toBe(2);
    });

    it('should handle punctuation', () => {
      expect(countWords('Hello, world!')).toBe(2);
      expect(countWords('It\'s a beautiful day.')).toBe(4);
    });

    it('should handle newlines and tabs', () => {
      expect(countWords('Hello\nworld')).toBe(2);
      expect(countWords('Hello\tworld')).toBe(2);
      expect(countWords('Line one\nLine two\nLine three')).toBe(6);
    });
  });

  describe('countTextBlockWords', () => {
    it('should count words across multiple text blocks', () => {
      const blocks: TextBlock[] = [
        createTextBlock('Hello world'),
        createTextBlock('The quick brown fox'),
        createTextBlock('jumps over the lazy dog'),
      ];

      expect(countTextBlockWords(blocks)).toBe(11);
    });

    it('should return 0 for empty array', () => {
      expect(countTextBlockWords([])).toBe(0);
    });

    it('should handle text blocks with empty content', () => {
      const blocks: TextBlock[] = [
        createTextBlock('Hello world'),
        createTextBlock(''),
        createTextBlock('Test'),
      ];

      expect(countTextBlockWords(blocks)).toBe(3);
    });

    it('should handle text blocks with only whitespace', () => {
      const blocks: TextBlock[] = [
        createTextBlock('Hello world'),
        createTextBlock('   '),
        createTextBlock('Test'),
      ];

      expect(countTextBlockWords(blocks)).toBe(3);
    });
  });

  describe('calculateChapterWordCount', () => {
    it('should calculate word count for a chapter', () => {
      const chapter = createChapter('Chapter 1', {
        content: [
          createTextBlock('Hello world'),
          createTextBlock('The quick brown fox'),
        ],
      });

      expect(calculateChapterWordCount(chapter)).toBe(6);
    });

    it('should return 0 for empty chapter', () => {
      const chapter = createChapter('Empty Chapter');

      expect(calculateChapterWordCount(chapter)).toBe(0);
    });

    it('should handle chapter with mixed content', () => {
      const chapter = createChapter('Chapter 1', {
        content: [
          createTextBlock('First paragraph with five words'),
          createTextBlock(''),
          createTextBlock('Second paragraph'),
        ],
      });

      expect(calculateChapterWordCount(chapter)).toBe(7);
    });
  });

  describe('calculateBookWordCount', () => {
    const author = createAuthor('Test Author');

    it('should calculate total word count for a book', () => {
      const book = createBook('Test Book', [author], {
        frontMatter: [
          createElement('dedication', 'front', 'Dedication', {
            content: [createTextBlock('For my family')],
          }),
        ],
        chapters: [
          createChapter('Chapter 1', {
            content: [createTextBlock('Hello world test content')],
          }),
          createChapter('Chapter 2', {
            content: [createTextBlock('More test content here')],
          }),
        ],
        backMatter: [
          createElement('appendix', 'back', 'Appendix', {
            content: [createTextBlock('Appendix content here')],
          }),
        ],
      });

      expect(calculateBookWordCount(book)).toBe(14);
    });

    it('should return 0 for empty book', () => {
      const book = createBook('Empty Book', [author]);

      expect(calculateBookWordCount(book)).toBe(0);
    });

    it('should count only chapters if no front/back matter', () => {
      const book = createBook('Test Book', [author], {
        chapters: [
          createChapter('Chapter 1', {
            content: [createTextBlock('Hello world')],
          }),
        ],
      });

      expect(calculateBookWordCount(book)).toBe(2);
    });

    it('should handle book with only front matter', () => {
      const book = createBook('Test Book', [author], {
        frontMatter: [
          createElement('dedication', 'front', 'Dedication', {
            content: [createTextBlock('For my family and friends')],
          }),
        ],
      });

      expect(calculateBookWordCount(book)).toBe(5);
    });

    it('should handle book with only back matter', () => {
      const book = createBook('Test Book', [author], {
        backMatter: [
          createElement('appendix', 'back', 'Appendix', {
            content: [createTextBlock('Appendix content')],
          }),
        ],
      });

      expect(calculateBookWordCount(book)).toBe(2);
    });
  });

  describe('sortChapters', () => {
    it('should sort chapters by number', () => {
      const chapters: Chapter[] = [
        createChapter('Chapter 3', { number: 3 }),
        createChapter('Chapter 1', { number: 1 }),
        createChapter('Chapter 2', { number: 2 }),
      ];

      const sorted = sortChapters(chapters);

      expect(sorted[0].number).toBe(1);
      expect(sorted[1].number).toBe(2);
      expect(sorted[2].number).toBe(3);
    });

    it('should not mutate original array', () => {
      const chapters: Chapter[] = [
        createChapter('Chapter 3', { number: 3 }),
        createChapter('Chapter 1', { number: 1 }),
      ];

      const original = [...chapters];
      sortChapters(chapters);

      expect(chapters).toEqual(original);
    });

    it('should handle chapters without numbers', () => {
      const chapters: Chapter[] = [
        createChapter('Chapter 3', { number: 3 }),
        createChapter('Prologue'),
        createChapter('Chapter 1', { number: 1 }),
      ];

      const sorted = sortChapters(chapters);

      // Chapters without numbers should be treated as 0
      expect(sorted[0].number).toBeUndefined();
      expect(sorted[1].number).toBe(1);
      expect(sorted[2].number).toBe(3);
    });

    it('should handle empty array', () => {
      const sorted = sortChapters([]);

      expect(sorted).toEqual([]);
    });

    it('should handle chapters with same number', () => {
      const chapters: Chapter[] = [
        createChapter('Chapter 1a', { number: 1 }),
        createChapter('Chapter 1b', { number: 1 }),
      ];

      const sorted = sortChapters(chapters);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].number).toBe(1);
      expect(sorted[1].number).toBe(1);
    });
  });

  describe('sortElements', () => {
    it('should sort elements by order', () => {
      const elements: Element[] = [
        createElement('appendix', 'back', 'Appendix C', { order: 3 }),
        createElement('appendix', 'back', 'Appendix A', { order: 1 }),
        createElement('appendix', 'back', 'Appendix B', { order: 2 }),
      ];

      const sorted = sortElements(elements);

      expect(sorted[0].order).toBe(1);
      expect(sorted[1].order).toBe(2);
      expect(sorted[2].order).toBe(3);
    });

    it('should not mutate original array', () => {
      const elements: Element[] = [
        createElement('appendix', 'back', 'Appendix C', { order: 3 }),
        createElement('appendix', 'back', 'Appendix A', { order: 1 }),
      ];

      const original = [...elements];
      sortElements(elements);

      expect(elements).toEqual(original);
    });

    it('should handle elements without order', () => {
      const elements: Element[] = [
        createElement('appendix', 'back', 'Appendix C', { order: 3 }),
        createElement('dedication', 'front', 'Dedication'),
        createElement('appendix', 'back', 'Appendix A', { order: 1 }),
      ];

      const sorted = sortElements(elements);

      expect(sorted[0].order).toBeUndefined();
      expect(sorted[1].order).toBe(1);
      expect(sorted[2].order).toBe(3);
    });

    it('should handle empty array', () => {
      const sorted = sortElements([]);

      expect(sorted).toEqual([]);
    });
  });

  describe('getTextFeaturesByType', () => {
    it('should filter features by type', () => {
      const link1 = createLink('Link 1', 'https://example1.com');
      const link2 = createLink('Link 2', 'https://example2.com');
      const note = createNote('Note 1');

      const textBlock = createTextBlock('Test content', 'paragraph', {
        features: [link1, note, link2],
      });

      const links = getTextFeaturesByType<Link>(textBlock, 'link');

      expect(links).toHaveLength(2);
      expect(links[0].url).toBe('https://example1.com');
      expect(links[1].url).toBe('https://example2.com');
    });

    it('should return empty array if no matching features', () => {
      const note = createNote('Note 1');
      const textBlock = createTextBlock('Test content', 'paragraph', {
        features: [note],
      });

      const links = getTextFeaturesByType<Link>(textBlock, 'link');

      expect(links).toEqual([]);
    });

    it('should return empty array if features is undefined', () => {
      const textBlock = createTextBlock('Test content');
      textBlock.features = undefined;

      const links = getTextFeaturesByType<Link>(textBlock, 'link');

      expect(links).toEqual([]);
    });

    it('should return empty array if features is empty', () => {
      const textBlock = createTextBlock('Test content');

      const links = getTextFeaturesByType<Link>(textBlock, 'link');

      expect(links).toEqual([]);
    });

    it('should filter notes by type', () => {
      const note1 = createNote('Note 1', 'footnote');
      const note2 = createNote('Note 2', 'endnote');
      const link = createLink('Link', 'https://example.com');

      const textBlock = createTextBlock('Test content', 'paragraph', {
        features: [note1, link, note2],
      });

      const notes = getTextFeaturesByType<Note>(textBlock, 'note');

      expect(notes).toHaveLength(2);
      expect(notes[0].noteType).toBe('footnote');
      expect(notes[1].noteType).toBe('endnote');
    });
  });

  describe('getChaptersByPart', () => {
    it('should filter chapters by part number', () => {
      const chapters: Chapter[] = [
        createChapter('Chapter 1', { partNumber: 1 }),
        createChapter('Chapter 2', { partNumber: 1 }),
        createChapter('Chapter 3', { partNumber: 2 }),
        createChapter('Chapter 4', { partNumber: 2 }),
      ];

      const part1Chapters = getChaptersByPart(chapters, 1);
      const part2Chapters = getChaptersByPart(chapters, 2);

      expect(part1Chapters).toHaveLength(2);
      expect(part2Chapters).toHaveLength(2);
      expect(part1Chapters[0].title).toBe('Chapter 1');
      expect(part2Chapters[0].title).toBe('Chapter 3');
    });

    it('should return empty array if no chapters in part', () => {
      const chapters: Chapter[] = [
        createChapter('Chapter 1', { partNumber: 1 }),
      ];

      const part2Chapters = getChaptersByPart(chapters, 2);

      expect(part2Chapters).toEqual([]);
    });

    it('should handle chapters without part number', () => {
      const chapters: Chapter[] = [
        createChapter('Chapter 1', { partNumber: 1 }),
        createChapter('Chapter 2'),
      ];

      const part1Chapters = getChaptersByPart(chapters, 1);

      expect(part1Chapters).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const part1Chapters = getChaptersByPart([], 1);

      expect(part1Chapters).toEqual([]);
    });
  });

  describe('getFrontMatterByType', () => {
    const author = createAuthor('Test Author');

    it('should filter front matter by type', () => {
      const book = createBook('Test Book', [author], {
        frontMatter: [
          createElement('dedication', 'front', 'Dedication'),
          createElement('preface', 'front', 'Preface'),
          createElement('dedication', 'front', 'Another Dedication'),
        ],
      });

      const dedications = getFrontMatterByType(book, 'dedication');

      expect(dedications).toHaveLength(2);
      expect(dedications[0].type).toBe('dedication');
      expect(dedications[1].type).toBe('dedication');
    });

    it('should return empty array if no matching elements', () => {
      const book = createBook('Test Book', [author], {
        frontMatter: [
          createElement('preface', 'front', 'Preface'),
        ],
      });

      const dedications = getFrontMatterByType(book, 'dedication');

      expect(dedications).toEqual([]);
    });

    it('should return empty array if no front matter', () => {
      const book = createBook('Test Book', [author]);

      const dedications = getFrontMatterByType(book, 'dedication');

      expect(dedications).toEqual([]);
    });
  });

  describe('getBackMatterByType', () => {
    const author = createAuthor('Test Author');

    it('should filter back matter by type', () => {
      const book = createBook('Test Book', [author], {
        backMatter: [
          createElement('appendix', 'back', 'Appendix A'),
          createElement('glossary', 'back', 'Glossary'),
          createElement('appendix', 'back', 'Appendix B'),
        ],
      });

      const appendices = getBackMatterByType(book, 'appendix');

      expect(appendices).toHaveLength(2);
      expect(appendices[0].type).toBe('appendix');
      expect(appendices[1].type).toBe('appendix');
    });

    it('should return empty array if no matching elements', () => {
      const book = createBook('Test Book', [author], {
        backMatter: [
          createElement('glossary', 'back', 'Glossary'),
        ],
      });

      const appendices = getBackMatterByType(book, 'appendix');

      expect(appendices).toEqual([]);
    });

    it('should return empty array if no back matter', () => {
      const book = createBook('Test Book', [author]);

      const appendices = getBackMatterByType(book, 'appendix');

      expect(appendices).toEqual([]);
    });
  });

  describe('touchMetadata', () => {
    it('should update timestamp', () => {
      const originalDate = new Date('2024-01-01');
      const item = {
        id: 'test',
        createdAt: originalDate,
        updatedAt: originalDate,
        version: 1,
      };

      const updated = touchMetadata(item);

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('should increment version', () => {
      const item = {
        id: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 5,
      };

      const updated = touchMetadata(item);

      expect(updated.version).toBe(6);
    });

    it('should handle missing version', () => {
      const item = {
        id: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updated = touchMetadata(item);

      expect(updated.version).toBe(1);
    });

    it('should set updatedBy when provided', () => {
      const item = {
        id: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };

      const updated = touchMetadata(item, 'user123');

      expect(updated.updatedBy).toBe('user123');
    });

    it('should not mutate original object', () => {
      const originalDate = new Date('2024-01-01');
      const item = {
        id: 'test',
        createdAt: originalDate,
        updatedAt: originalDate,
        version: 1,
      };

      touchMetadata(item);

      expect(item.updatedAt).toBe(originalDate);
      expect(item.version).toBe(1);
    });

    it('should preserve other properties', () => {
      const item = {
        id: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        customField: 'value',
      };

      const updated = touchMetadata(item);

      expect(updated).toHaveProperty('customField', 'value');
    });
  });

  describe('isNumberedChapter', () => {
    it('should return true for numbered chapters', () => {
      const chapter = createChapter('Chapter 1', { number: 1 });

      expect(isNumberedChapter(chapter)).toBe(true);
    });

    it('should return false for chapters without number', () => {
      const chapter = createChapter('Prologue');

      expect(isNumberedChapter(chapter)).toBe(false);
    });

    it('should return false for chapters with number 0', () => {
      const chapter = createChapter('Chapter 0', { number: 0 });

      expect(isNumberedChapter(chapter)).toBe(false);
    });

    it('should return false for chapters with negative number', () => {
      const chapter = createChapter('Chapter -1', { number: -1 });

      expect(isNumberedChapter(chapter)).toBe(false);
    });

    it('should return true for chapters with large numbers', () => {
      const chapter = createChapter('Chapter 100', { number: 100 });

      expect(isNumberedChapter(chapter)).toBe(true);
    });
  });

  describe('generateTableOfContents', () => {
    const author = createAuthor('Test Author');

    it('should generate TOC for book with all sections', () => {
      const book = createBook('Test Book', [author], {
        frontMatter: [
          createElement('dedication', 'front', 'Dedication', { includeInToc: true }),
          createElement('preface', 'front', 'Preface', { includeInToc: true }),
        ],
        chapters: [
          createChapter('Chapter 1', { number: 1, includeInToc: true }),
          createChapter('Chapter 2', { number: 2, includeInToc: true }),
        ],
        backMatter: [
          createElement('appendix', 'back', 'Appendix', { includeInToc: true }),
        ],
      });

      const toc = generateTableOfContents(book);

      expect(toc).toHaveLength(5);
      expect(toc[0].title).toBe('Dedication');
      expect(toc[1].title).toBe('Preface');
      expect(toc[2].title).toBe('Chapter 1');
      expect(toc[3].title).toBe('Chapter 2');
      expect(toc[4].title).toBe('Appendix');
    });

    it('should include correct types in TOC entries', () => {
      const book = createBook('Test Book', [author], {
        frontMatter: [
          createElement('dedication', 'front', 'Dedication'),
        ],
        chapters: [
          createChapter('Chapter 1', { number: 1 }),
        ],
      });

      const toc = generateTableOfContents(book);

      expect(toc[0].type).toBe('element');
      expect(toc[1].type).toBe('chapter');
    });

    it('should include chapter numbers', () => {
      const book = createBook('Test Book', [author], {
        chapters: [
          createChapter('Chapter 1', { number: 1 }),
          createChapter('Chapter 2', { number: 2 }),
        ],
      });

      const toc = generateTableOfContents(book);

      expect(toc[0].number).toBe(1);
      expect(toc[1].number).toBe(2);
    });

    it('should not include numbers for elements', () => {
      const book = createBook('Test Book', [author], {
        frontMatter: [
          createElement('dedication', 'front', 'Dedication'),
        ],
      });

      const toc = generateTableOfContents(book);

      expect(toc[0].number).toBeUndefined();
    });

    it('should exclude items not marked for TOC', () => {
      const book = createBook('Test Book', [author], {
        frontMatter: [
          createElement('dedication', 'front', 'Dedication', { includeInToc: false }),
        ],
        chapters: [
          createChapter('Chapter 1', { number: 1, includeInToc: false }),
          createChapter('Chapter 2', { number: 2, includeInToc: true }),
        ],
      });

      const toc = generateTableOfContents(book);

      expect(toc).toHaveLength(1);
      expect(toc[0].title).toBe('Chapter 2');
    });

    it('should include chapters by default when includeInToc is undefined', () => {
      const book = createBook('Test Book', [author], {
        chapters: [
          createChapter('Chapter 1', { number: 1 }),
        ],
      });

      // Explicitly set includeInToc to undefined
      book.chapters[0].includeInToc = undefined;

      const toc = generateTableOfContents(book);

      expect(toc).toHaveLength(1);
      expect(toc[0].title).toBe('Chapter 1');
    });

    it('should include IDs for all TOC entries', () => {
      const book = createBook('Test Book', [author], {
        chapters: [
          createChapter('Chapter 1', { number: 1 }),
        ],
      });

      const toc = generateTableOfContents(book);

      expect(toc[0].id).toBe(book.chapters[0].id);
    });

    it('should return empty array for empty book', () => {
      const book = createBook('Empty Book', [author]);

      const toc = generateTableOfContents(book);

      expect(toc).toEqual([]);
    });

    it('should maintain correct order of elements', () => {
      const book = createBook('Test Book', [author], {
        frontMatter: [
          createElement('preface', 'front', 'Preface'),
          createElement('dedication', 'front', 'Dedication'),
        ],
        chapters: [
          createChapter('Chapter 2', { number: 2 }),
          createChapter('Chapter 1', { number: 1 }),
        ],
        backMatter: [
          createElement('glossary', 'back', 'Glossary'),
          createElement('appendix', 'back', 'Appendix'),
        ],
      });

      const toc = generateTableOfContents(book);

      // TOC should follow the order in the book, not sort automatically
      expect(toc[0].title).toBe('Preface');
      expect(toc[1].title).toBe('Dedication');
      expect(toc[2].title).toBe('Chapter 2');
      expect(toc[3].title).toBe('Chapter 1');
      expect(toc[4].title).toBe('Glossary');
      expect(toc[5].title).toBe('Appendix');
    });
  });
});

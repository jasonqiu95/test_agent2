/**
 * Factory Functions Unit Tests
 */

import { validate as validateUUID } from 'uuid';
import {
  createMetadata,
  createBook,
  createAuthor,
  createChapter,
  createElement,
  createTextBlock,
  createStyle,
  createSubhead,
  createBreak,
  createQuote,
  createVerse,
  createList,
  createLink,
  createNote,
} from '../factories';
import type {
  Book,
  Chapter,
  Element,
  TextBlock,
  Style,
  Author,
  Metadata,
  Subhead,
  Break,
  Quote,
  Verse,
  List,
  Link,
  Note,
} from '../../types';

describe('Factory Functions', () => {
  describe('createMetadata', () => {
    it('should create metadata with valid UUID', () => {
      const metadata = createMetadata();

      expect(validateUUID(metadata.id)).toBe(true);
    });

    it('should create metadata with default values', () => {
      const metadata = createMetadata();

      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.updatedAt).toBeInstanceOf(Date);
      expect(metadata.version).toBe(1);
      expect(metadata.tags).toEqual([]);
    });

    it('should allow overriding default values', () => {
      const customDate = new Date('2024-01-01');
      const metadata = createMetadata({
        createdAt: customDate,
        version: 5,
        tags: ['test', 'sample'],
        createdBy: 'user123',
      });

      expect(metadata.createdAt).toBe(customDate);
      expect(metadata.version).toBe(5);
      expect(metadata.tags).toEqual(['test', 'sample']);
      expect(metadata.createdBy).toBe('user123');
    });

    it('should create unique IDs for each metadata instance', () => {
      const metadata1 = createMetadata();
      const metadata2 = createMetadata();

      expect(metadata1.id).not.toBe(metadata2.id);
    });

    it('should set createdAt and updatedAt to the same time initially', () => {
      const metadata = createMetadata();
      const timeDiff = Math.abs(
        metadata.updatedAt.getTime() - metadata.createdAt.getTime()
      );

      // Should be within a few milliseconds
      expect(timeDiff).toBeLessThan(10);
    });
  });

  describe('createBook', () => {
    const author: Author = { id: 'author-1', name: 'Test Author', role: 'author' };

    it('should create a valid book with required fields', () => {
      const book = createBook('Test Book', [author]);

      expect(book.title).toBe('Test Book');
      expect(book.authors).toEqual([author]);
      expect(validateUUID(book.id)).toBe(true);
    });

    it('should initialize book with default values', () => {
      const book = createBook('Test Book', [author]);

      expect(book.frontMatter).toEqual([]);
      expect(book.chapters).toEqual([]);
      expect(book.backMatter).toEqual([]);
      expect(book.styles).toEqual([]);
      expect(book.status).toBe('draft');
    });

    it('should set metadata timestamps', () => {
      const book = createBook('Test Book', [author]);

      expect(book.metadata.createdAt).toBeInstanceOf(Date);
      expect(book.metadata.updatedAt).toBeInstanceOf(Date);
      expect(book.metadata.version).toBe(1);
    });

    it('should allow overriding default values', () => {
      const chapter: Chapter = {
        id: 'chapter-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Chapter 1',
        content: [],
      };

      const book = createBook('Test Book', [author], {
        status: 'published',
        chapters: [chapter],
      });

      expect(book.status).toBe('published');
      expect(book.chapters).toHaveLength(1);
      expect(book.chapters[0].title).toBe('Chapter 1');
    });

    it('should handle multiple authors', () => {
      const authors: Author[] = [
        { id: 'author-1', name: 'First Author', role: 'author' },
        { id: 'author-2', name: 'Second Author', role: 'co-author' },
      ];

      const book = createBook('Test Book', authors);

      expect(book.authors).toHaveLength(2);
      expect(book.authors[1].role).toBe('co-author');
    });

    it('should create spec-compliant book objects', () => {
      const book = createBook('Test Book', [author]);

      // Verify all required fields are present
      expect(book).toHaveProperty('id');
      expect(book).toHaveProperty('createdAt');
      expect(book).toHaveProperty('updatedAt');
      expect(book).toHaveProperty('title');
      expect(book).toHaveProperty('authors');
      expect(book).toHaveProperty('frontMatter');
      expect(book).toHaveProperty('chapters');
      expect(book).toHaveProperty('backMatter');
      expect(book).toHaveProperty('styles');
      expect(book).toHaveProperty('metadata');
    });
  });

  describe('createAuthor', () => {
    it('should create an author with valid UUID', () => {
      const author = createAuthor('John Doe');

      expect(validateUUID(author.id)).toBe(true);
      expect(author.name).toBe('John Doe');
    });

    it('should set default role to author', () => {
      const author = createAuthor('John Doe');

      expect(author.role).toBe('author');
    });

    it('should allow overriding default values', () => {
      const author = createAuthor('Jane Doe', {
        role: 'editor',
        bio: 'Editor bio',
      });

      expect(author.role).toBe('editor');
      expect(author.bio).toBe('Editor bio');
    });

    it('should create unique IDs for each author', () => {
      const author1 = createAuthor('Author 1');
      const author2 = createAuthor('Author 2');

      expect(author1.id).not.toBe(author2.id);
    });
  });

  describe('createChapter', () => {
    it('should create a chapter with valid UUID', () => {
      const chapter = createChapter('Chapter 1');

      expect(validateUUID(chapter.id)).toBe(true);
      expect(chapter.title).toBe('Chapter 1');
    });

    it('should initialize chapter with default values', () => {
      const chapter = createChapter('Chapter 1');

      expect(chapter.content).toEqual([]);
      expect(chapter.includeInToc).toBe(true);
      expect(chapter.createdAt).toBeInstanceOf(Date);
      expect(chapter.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow overriding default values', () => {
      const textBlock: TextBlock = {
        id: 'block-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        content: 'Test content',
        blockType: 'paragraph',
        features: [],
      };

      const chapter = createChapter('Chapter 1', {
        number: 5,
        content: [textBlock],
        includeInToc: false,
      });

      expect(chapter.number).toBe(5);
      expect(chapter.content).toHaveLength(1);
      expect(chapter.includeInToc).toBe(false);
    });

    it('should create spec-compliant chapter objects', () => {
      const chapter = createChapter('Chapter 1');

      expect(chapter).toHaveProperty('id');
      expect(chapter).toHaveProperty('createdAt');
      expect(chapter).toHaveProperty('updatedAt');
      expect(chapter).toHaveProperty('title');
      expect(chapter).toHaveProperty('content');
      expect(chapter).toHaveProperty('includeInToc');
    });
  });

  describe('createElement', () => {
    it('should create an element with valid UUID', () => {
      const element = createElement('dedication', 'front', 'Dedication');

      expect(validateUUID(element.id)).toBe(true);
      expect(element.type).toBe('dedication');
      expect(element.matter).toBe('front');
      expect(element.title).toBe('Dedication');
    });

    it('should initialize element with default values', () => {
      const element = createElement('dedication', 'front', 'Dedication');

      expect(element.content).toEqual([]);
      expect(element.includeInToc).toBe(true);
      expect(element.createdAt).toBeInstanceOf(Date);
      expect(element.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow overriding default values', () => {
      const textBlock: TextBlock = {
        id: 'block-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        content: 'Test content',
        blockType: 'paragraph',
        features: [],
      };

      const element = createElement('dedication', 'front', 'Dedication', {
        content: [textBlock],
        includeInToc: false,
        order: 1,
      });

      expect(element.content).toHaveLength(1);
      expect(element.includeInToc).toBe(false);
      expect(element.order).toBe(1);
    });

    it('should create back matter elements', () => {
      const element = createElement('appendix', 'back', 'Appendix A');

      expect(element.matter).toBe('back');
      expect(element.type).toBe('appendix');
    });

    it('should create spec-compliant element objects', () => {
      const element = createElement('dedication', 'front', 'Dedication');

      expect(element).toHaveProperty('id');
      expect(element).toHaveProperty('createdAt');
      expect(element).toHaveProperty('updatedAt');
      expect(element).toHaveProperty('type');
      expect(element).toHaveProperty('matter');
      expect(element).toHaveProperty('title');
      expect(element).toHaveProperty('content');
      expect(element).toHaveProperty('includeInToc');
    });
  });

  describe('createTextBlock', () => {
    it('should create a text block with valid UUID', () => {
      const textBlock = createTextBlock('Sample text content');

      expect(validateUUID(textBlock.id)).toBe(true);
      expect(textBlock.content).toBe('Sample text content');
    });

    it('should default to paragraph block type', () => {
      const textBlock = createTextBlock('Sample text content');

      expect(textBlock.blockType).toBe('paragraph');
    });

    it('should allow specifying block type', () => {
      const textBlock = createTextBlock('Sample text content', 'heading');

      expect(textBlock.blockType).toBe('heading');
    });

    it('should initialize features as empty array', () => {
      const textBlock = createTextBlock('Sample text content');

      expect(textBlock.features).toEqual([]);
    });

    it('should allow overriding default values', () => {
      const link: Link = {
        id: 'link-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'link',
        content: 'Click here',
        url: 'https://example.com',
        target: '_blank',
      };

      const textBlock = createTextBlock('Sample text content', 'paragraph', {
        features: [link],
      });

      expect(textBlock.features).toHaveLength(1);
      expect(textBlock.features?.[0].type).toBe('link');
    });

    it('should create spec-compliant text block objects', () => {
      const textBlock = createTextBlock('Sample text content');

      expect(textBlock).toHaveProperty('id');
      expect(textBlock).toHaveProperty('createdAt');
      expect(textBlock).toHaveProperty('updatedAt');
      expect(textBlock).toHaveProperty('content');
      expect(textBlock).toHaveProperty('blockType');
      expect(textBlock).toHaveProperty('features');
    });
  });

  describe('createStyle', () => {
    it('should create a style with valid UUID', () => {
      const style = createStyle('Heading 1');

      expect(validateUUID(style.id)).toBe(true);
      expect(style.name).toBe('Heading 1');
    });

    it('should initialize style with default values', () => {
      const style = createStyle('Heading 1');

      expect(style.fontFamily).toBe('serif');
      expect(style.fontSize).toBe(12);
      expect(style.fontWeight).toBe('normal');
      expect(style.fontStyle).toBe('normal');
      expect(style.textAlign).toBe('left');
      expect(style.textDecoration).toBe('none');
      expect(style.textTransform).toBe('none');
    });

    it('should allow overriding default values', () => {
      const style = createStyle('Heading 1', {
        fontFamily: 'sans-serif',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
      });

      expect(style.fontFamily).toBe('sans-serif');
      expect(style.fontSize).toBe(24);
      expect(style.fontWeight).toBe('bold');
      expect(style.textAlign).toBe('center');
    });

    it('should create spec-compliant style objects', () => {
      const style = createStyle('Heading 1');

      expect(style).toHaveProperty('id');
      expect(style).toHaveProperty('createdAt');
      expect(style).toHaveProperty('updatedAt');
      expect(style).toHaveProperty('name');
      expect(style).toHaveProperty('fontFamily');
      expect(style).toHaveProperty('fontSize');
      expect(style).toHaveProperty('fontWeight');
      expect(style).toHaveProperty('fontStyle');
      expect(style).toHaveProperty('textAlign');
      expect(style).toHaveProperty('textDecoration');
      expect(style).toHaveProperty('textTransform');
    });
  });

  describe('createSubhead', () => {
    it('should create a subhead with valid UUID', () => {
      const subhead = createSubhead('Subhead Title');

      expect(validateUUID(subhead.id)).toBe(true);
      expect(subhead.content).toBe('Subhead Title');
      expect(subhead.type).toBe('subhead');
    });

    it('should default to level 2', () => {
      const subhead = createSubhead('Subhead Title');

      expect(subhead.level).toBe(2);
    });

    it('should allow specifying level', () => {
      const subhead = createSubhead('Subhead Title', 3);

      expect(subhead.level).toBe(3);
    });

    it('should allow overriding default values', () => {
      const subhead = createSubhead('Subhead Title', 2, {
        level: 4,
      });

      expect(subhead.level).toBe(4);
    });

    it('should create spec-compliant subhead objects', () => {
      const subhead = createSubhead('Subhead Title');

      expect(subhead).toHaveProperty('id');
      expect(subhead).toHaveProperty('createdAt');
      expect(subhead).toHaveProperty('updatedAt');
      expect(subhead).toHaveProperty('type');
      expect(subhead).toHaveProperty('content');
      expect(subhead).toHaveProperty('level');
    });
  });

  describe('createBreak', () => {
    it('should create a break with valid UUID', () => {
      const breakFeature = createBreak();

      expect(validateUUID(breakFeature.id)).toBe(true);
      expect(breakFeature.type).toBe('break');
    });

    it('should default to section break', () => {
      const breakFeature = createBreak();

      expect(breakFeature.breakType).toBe('section');
    });

    it('should allow specifying break type', () => {
      const breakFeature = createBreak('page');

      expect(breakFeature.breakType).toBe('page');
    });

    it('should allow overriding default values', () => {
      const breakFeature = createBreak('section', {
        breakType: 'chapter',
      });

      expect(breakFeature.breakType).toBe('chapter');
    });

    it('should create spec-compliant break objects', () => {
      const breakFeature = createBreak();

      expect(breakFeature).toHaveProperty('id');
      expect(breakFeature).toHaveProperty('createdAt');
      expect(breakFeature).toHaveProperty('updatedAt');
      expect(breakFeature).toHaveProperty('type');
      expect(breakFeature).toHaveProperty('breakType');
    });
  });

  describe('createQuote', () => {
    it('should create a quote with valid UUID', () => {
      const quote = createQuote('This is a quote');

      expect(validateUUID(quote.id)).toBe(true);
      expect(quote.content).toBe('This is a quote');
      expect(quote.type).toBe('quote');
    });

    it('should default to block quote', () => {
      const quote = createQuote('This is a quote');

      expect(quote.quoteType).toBe('block');
    });

    it('should allow specifying quote type', () => {
      const quote = createQuote('This is a quote', 'inline');

      expect(quote.quoteType).toBe('inline');
    });

    it('should allow overriding default values', () => {
      const quote = createQuote('This is a quote', 'block', {
        attribution: 'Famous Author',
      });

      expect(quote.attribution).toBe('Famous Author');
    });

    it('should create spec-compliant quote objects', () => {
      const quote = createQuote('This is a quote');

      expect(quote).toHaveProperty('id');
      expect(quote).toHaveProperty('createdAt');
      expect(quote).toHaveProperty('updatedAt');
      expect(quote).toHaveProperty('type');
      expect(quote).toHaveProperty('content');
      expect(quote).toHaveProperty('quoteType');
    });
  });

  describe('createVerse', () => {
    it('should create a verse with valid UUID', () => {
      const verse = createVerse(['Line 1', 'Line 2']);

      expect(validateUUID(verse.id)).toBe(true);
      expect(verse.type).toBe('verse');
    });

    it('should store verse lines', () => {
      const lines = ['Line 1', 'Line 2', 'Line 3'];
      const verse = createVerse(lines);

      expect(verse.lines).toEqual(lines);
      expect(verse.lines).toHaveLength(3);
    });

    it('should allow overriding default values', () => {
      const verse = createVerse(['Line 1', 'Line 2'], {
        stanzaBreak: true,
      });

      expect(verse.stanzaBreak).toBe(true);
    });

    it('should create spec-compliant verse objects', () => {
      const verse = createVerse(['Line 1', 'Line 2']);

      expect(verse).toHaveProperty('id');
      expect(verse).toHaveProperty('createdAt');
      expect(verse).toHaveProperty('updatedAt');
      expect(verse).toHaveProperty('type');
      expect(verse).toHaveProperty('lines');
    });
  });

  describe('createList', () => {
    it('should create a list with valid UUID', () => {
      const list = createList(['Item 1', 'Item 2']);

      expect(validateUUID(list.id)).toBe(true);
      expect(list.type).toBe('list');
    });

    it('should default to unordered list', () => {
      const list = createList(['Item 1', 'Item 2']);

      expect(list.listType).toBe('unordered');
    });

    it('should allow specifying list type', () => {
      const list = createList(['Item 1', 'Item 2'], 'ordered');

      expect(list.listType).toBe('ordered');
    });

    it('should store list items', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const list = createList(items);

      expect(list.items).toEqual(items);
      expect(list.items).toHaveLength(3);
    });

    it('should allow overriding default values', () => {
      const list = createList(['Item 1', 'Item 2'], 'unordered', {
        listType: 'ordered',
        startNumber: 5,
      });

      expect(list.listType).toBe('ordered');
      expect(list.startNumber).toBe(5);
    });

    it('should create spec-compliant list objects', () => {
      const list = createList(['Item 1', 'Item 2']);

      expect(list).toHaveProperty('id');
      expect(list).toHaveProperty('createdAt');
      expect(list).toHaveProperty('updatedAt');
      expect(list).toHaveProperty('type');
      expect(list).toHaveProperty('items');
      expect(list).toHaveProperty('listType');
    });
  });

  describe('createLink', () => {
    it('should create a link with valid UUID', () => {
      const link = createLink('Click here', 'https://example.com');

      expect(validateUUID(link.id)).toBe(true);
      expect(link.content).toBe('Click here');
      expect(link.url).toBe('https://example.com');
      expect(link.type).toBe('link');
    });

    it('should default to _self target', () => {
      const link = createLink('Click here', 'https://example.com');

      expect(link.target).toBe('_self');
    });

    it('should allow overriding default values', () => {
      const link = createLink('Click here', 'https://example.com', {
        target: '_blank',
        title: 'Example Link',
      });

      expect(link.target).toBe('_blank');
      expect(link.title).toBe('Example Link');
    });

    it('should create spec-compliant link objects', () => {
      const link = createLink('Click here', 'https://example.com');

      expect(link).toHaveProperty('id');
      expect(link).toHaveProperty('createdAt');
      expect(link).toHaveProperty('updatedAt');
      expect(link).toHaveProperty('type');
      expect(link).toHaveProperty('content');
      expect(link).toHaveProperty('url');
      expect(link).toHaveProperty('target');
    });
  });

  describe('createNote', () => {
    it('should create a note with valid UUID', () => {
      const note = createNote('This is a note');

      expect(validateUUID(note.id)).toBe(true);
      expect(note.content).toBe('This is a note');
      expect(note.type).toBe('note');
    });

    it('should default to footnote', () => {
      const note = createNote('This is a note');

      expect(note.noteType).toBe('footnote');
    });

    it('should allow specifying note type', () => {
      const note = createNote('This is a note', 'endnote');

      expect(note.noteType).toBe('endnote');
    });

    it('should allow overriding default values', () => {
      const note = createNote('This is a note', 'footnote', {
        number: 5,
        symbol: '*',
      });

      expect(note.number).toBe(5);
      expect(note.symbol).toBe('*');
    });

    it('should create spec-compliant note objects', () => {
      const note = createNote('This is a note');

      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('createdAt');
      expect(note).toHaveProperty('updatedAt');
      expect(note).toHaveProperty('type');
      expect(note).toHaveProperty('content');
      expect(note).toHaveProperty('noteType');
    });
  });

  describe('UUID Generation', () => {
    it('should generate unique UUIDs across all factory functions', () => {
      const ids = new Set<string>();

      ids.add(createMetadata().id);
      ids.add(createAuthor('Test').id);
      ids.add(createChapter('Test').id);
      ids.add(createElement('dedication', 'front', 'Test').id);
      ids.add(createTextBlock('Test').id);
      ids.add(createStyle('Test').id);
      ids.add(createSubhead('Test').id);
      ids.add(createBreak().id);
      ids.add(createQuote('Test').id);
      ids.add(createVerse(['Test']).id);
      ids.add(createList(['Test']).id);
      ids.add(createLink('Test', 'https://example.com').id);
      ids.add(createNote('Test').id);

      // All IDs should be unique
      expect(ids.size).toBe(13);
    });

    it('should generate valid v4 UUIDs', () => {
      const metadata = createMetadata();

      // v4 UUIDs should match this pattern
      const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(metadata.id).toMatch(uuidV4Pattern);
    });
  });
});

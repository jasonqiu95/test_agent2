/**
 * Tests for EPUB TOC Generator
 */

import { generateTOC, TocEntry } from '../epub/tocGenerator';
import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
import { TextBlock } from '../../types/textBlock';

describe('generateTOC', () => {
  // Helper function to create a test book
  const createTestBook = (): Book => ({
    id: 'test-book-1',
    title: 'Test Book',
    subtitle: 'A Test Subtitle',
    authors: [
      {
        id: 'author-1',
        name: 'John Doe',
        role: 'author',
      },
    ],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {
      title: 'Test Book',
      language: 'en',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Helper function to create a test chapter
  const createTestChapter = (
    number: number,
    title: string,
    content: TextBlock[] = []
  ): Chapter => ({
    id: `chapter-${number}`,
    number,
    title,
    content,
    includeInToc: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Helper function to create a heading block
  const createHeading = (level: number, content: string): TextBlock => ({
    id: `heading-${Date.now()}-${Math.random()}`,
    blockType: 'heading',
    content,
    level,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Helper function to create a paragraph block
  const createParagraph = (content: string): TextBlock => ({
    id: `para-${Date.now()}-${Math.random()}`,
    blockType: 'paragraph',
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('basic TOC generation', () => {
    it('should generate TOC for a book with simple chapters', () => {
      const book = createTestBook();
      book.chapters = [
        createTestChapter(1, 'Introduction'),
        createTestChapter(2, 'The Journey Begins'),
        createTestChapter(3, 'Conclusion'),
      ];

      const result = generateTOC(book);

      expect(result).toBeDefined();
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0].title).toBe('Chapter 1: Introduction');
      expect(result.entries[1].title).toBe('Chapter 2: The Journey Begins');
      expect(result.entries[2].title).toBe('Chapter 3: Conclusion');
      expect(result.ncx).toContain('<ncx');
      expect(result.navXhtml).toContain('<nav');
    });

    it('should generate correct play order', () => {
      const book = createTestBook();
      book.chapters = [
        createTestChapter(1, 'Chapter One'),
        createTestChapter(2, 'Chapter Two'),
        createTestChapter(3, 'Chapter Three'),
      ];

      const result = generateTOC(book);

      expect(result.entries[0].playOrder).toBe(1);
      expect(result.entries[1].playOrder).toBe(2);
      expect(result.entries[2].playOrder).toBe(3);
    });

    it('should skip chapters with includeInToc set to false', () => {
      const book = createTestBook();
      const chapter1 = createTestChapter(1, 'Chapter One');
      const chapter2 = createTestChapter(2, 'Chapter Two');
      chapter2.includeInToc = false;
      const chapter3 = createTestChapter(3, 'Chapter Three');

      book.chapters = [chapter1, chapter2, chapter3];

      const result = generateTOC(book);

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].title).toBe('Chapter 1: Chapter One');
      expect(result.entries[1].title).toBe('Chapter 3: Chapter Three');
    });
  });

  describe('nested TOC with subheadings', () => {
    it('should extract subheadings from chapter content', () => {
      const book = createTestBook();
      const chapter = createTestChapter(1, 'Main Chapter', [
        createParagraph('Introduction paragraph'),
        createHeading(2, 'First Section'),
        createParagraph('Content of first section'),
        createHeading(2, 'Second Section'),
        createParagraph('Content of second section'),
      ]);

      book.chapters = [chapter];

      const result = generateTOC(book);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].children).toHaveLength(2);
      expect(result.entries[0].children[0].title).toBe('First Section');
      expect(result.entries[0].children[1].title).toBe('Second Section');
    });

    it('should handle nested subheadings (h2, h3)', () => {
      const book = createTestBook();
      const chapter = createTestChapter(1, 'Main Chapter', [
        createHeading(2, 'Section 1'),
        createHeading(3, 'Subsection 1.1'),
        createHeading(3, 'Subsection 1.2'),
        createHeading(2, 'Section 2'),
        createHeading(3, 'Subsection 2.1'),
      ]);

      book.chapters = [chapter];

      const result = generateTOC(book, { maxDepth: 3 });

      expect(result.entries[0].children).toHaveLength(2);
      expect(result.entries[0].children[0].title).toBe('Section 1');
      expect(result.entries[0].children[0].children).toHaveLength(2);
      expect(result.entries[0].children[0].children[0].title).toBe('Subsection 1.1');
      expect(result.entries[0].children[1].title).toBe('Section 2');
      expect(result.entries[0].children[1].children).toHaveLength(1);
    });

    it('should respect maxDepth option', () => {
      const book = createTestBook();
      const chapter = createTestChapter(1, 'Main Chapter', [
        createHeading(2, 'Section 1'),
        createHeading(3, 'Subsection 1.1'),
        createHeading(4, 'Sub-subsection 1.1.1'),
      ]);

      book.chapters = [chapter];

      const result = generateTOC(book, { maxDepth: 2 });

      expect(result.entries[0].children).toHaveLength(1);
      expect(result.entries[0].children[0].children).toHaveLength(0); // h3 should be excluded
    });

    it('should generate correct hrefs with anchors for subheadings', () => {
      const book = createTestBook();
      const chapter = createTestChapter(1, 'Main Chapter', [
        createHeading(2, 'First Section'),
      ]);

      book.chapters = [chapter];

      const result = generateTOC(book);

      expect(result.entries[0].href).toBe('Text/chapter-001.xhtml');
      expect(result.entries[0].children[0].href).toMatch(/Text\/chapter-001\.xhtml#chapter-1-h2-\d+/);
    });
  });

  describe('front and back matter', () => {
    it('should include front matter in TOC', () => {
      const book = createTestBook();
      book.frontMatter = [
        {
          id: 'preface',
          type: 'preface',
          matter: 'front',
          title: 'Preface',
          content: [createParagraph('Preface content')],
          includeInToc: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Element,
        {
          id: 'acknowledgments',
          type: 'acknowledgments',
          matter: 'front',
          title: 'Acknowledgments',
          content: [createParagraph('Thanks to everyone')],
          includeInToc: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Element,
      ];
      book.chapters = [createTestChapter(1, 'Chapter One')];

      const result = generateTOC(book);

      expect(result.entries.length).toBeGreaterThanOrEqual(3);
      expect(result.entries[0].title).toBe('Preface');
      expect(result.entries[1].title).toBe('Acknowledgments');
      expect(result.entries[2].title).toBe('Chapter 1: Chapter One');
    });

    it('should include back matter in TOC', () => {
      const book = createTestBook();
      book.chapters = [createTestChapter(1, 'Chapter One')];
      book.backMatter = [
        {
          id: 'epilogue',
          type: 'epilogue',
          matter: 'back',
          title: 'Epilogue',
          content: [createParagraph('Epilogue content')],
          includeInToc: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Element,
        {
          id: 'about-author',
          type: 'about-author',
          matter: 'back',
          title: 'About the Author',
          content: [createParagraph('Author bio')],
          includeInToc: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Element,
      ];

      const result = generateTOC(book);

      expect(result.entries).toHaveLength(3);
      expect(result.entries[1].title).toBe('Epilogue');
      expect(result.entries[2].title).toBe('About the Author');
    });

    it('should exclude front matter when option is false', () => {
      const book = createTestBook();
      book.frontMatter = [
        {
          id: 'preface',
          type: 'preface',
          matter: 'front',
          title: 'Preface',
          content: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Element,
      ];
      book.chapters = [createTestChapter(1, 'Chapter One')];

      const result = generateTOC(book, { includeFrontMatter: false });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].title).toBe('Chapter 1: Chapter One');
    });

    it('should exclude back matter when option is false', () => {
      const book = createTestBook();
      book.chapters = [createTestChapter(1, 'Chapter One')];
      book.backMatter = [
        {
          id: 'epilogue',
          type: 'epilogue',
          matter: 'back',
          title: 'Epilogue',
          content: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Element,
      ];

      const result = generateTOC(book, { includeBackMatter: false });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].title).toBe('Chapter 1: Chapter One');
    });
  });

  describe('NCX generation', () => {
    it('should generate valid NCX XML', () => {
      const book = createTestBook();
      book.chapters = [
        createTestChapter(1, 'Chapter One'),
        createTestChapter(2, 'Chapter Two'),
      ];

      const result = generateTOC(book, {
        bookId: 'test-book-123',
        bookTitle: 'Test Book',
        bookAuthor: 'John Doe',
      });

      expect(result.ncx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.ncx).toContain('<!DOCTYPE ncx');
      expect(result.ncx).toContain('<ncx');
      expect(result.ncx).toContain('<head>');
      expect(result.ncx).toContain('<docTitle>');
      expect(result.ncx).toContain('<text>Test Book</text>');
      expect(result.ncx).toContain('<docAuthor>');
      expect(result.ncx).toContain('<text>John Doe</text>');
      expect(result.ncx).toContain('<navMap>');
      expect(result.ncx).toContain('</navMap>');
      expect(result.ncx).toContain('</ncx>');
    });

    it('should include navPoint elements for each TOC entry', () => {
      const book = createTestBook();
      book.chapters = [
        createTestChapter(1, 'Chapter One'),
        createTestChapter(2, 'Chapter Two'),
      ];

      const result = generateTOC(book);

      expect(result.ncx).toContain('<navPoint');
      expect(result.ncx).toContain('playOrder="1"');
      expect(result.ncx).toContain('playOrder="2"');
      expect(result.ncx).toContain('<navLabel>');
      expect(result.ncx).toContain('<content src=');
    });

    it('should escape XML special characters in NCX', () => {
      const book = createTestBook();
      book.chapters = [
        createTestChapter(1, 'Chapter with <special> & "characters"'),
      ];

      const result = generateTOC(book);

      expect(result.ncx).toContain('&lt;special&gt;');
      expect(result.ncx).toContain('&amp;');
      expect(result.ncx).toContain('&quot;');
      expect(result.ncx).not.toContain('<special>');
    });

    it('should include nested navPoints for subheadings', () => {
      const book = createTestBook();
      const chapter = createTestChapter(1, 'Main Chapter', [
        createHeading(2, 'Section 1'),
        createHeading(2, 'Section 2'),
      ]);
      book.chapters = [chapter];

      const result = generateTOC(book);

      // Count navPoint occurrences (1 chapter + 2 sections)
      const navPointCount = (result.ncx.match(/<navPoint/g) || []).length;
      expect(navPointCount).toBe(3);
    });
  });

  describe('nav.xhtml generation', () => {
    it('should generate valid HTML5 nav document', () => {
      const book = createTestBook();
      book.chapters = [
        createTestChapter(1, 'Chapter One'),
        createTestChapter(2, 'Chapter Two'),
      ];

      const result = generateTOC(book, { tocTitle: 'Contents' });

      expect(result.navXhtml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.navXhtml).toContain('<!DOCTYPE html>');
      expect(result.navXhtml).toContain('<html xmlns="http://www.w3.org/1999/xhtml"');
      expect(result.navXhtml).toContain('xmlns:epub="http://www.idpf.org/2007/ops"');
      expect(result.navXhtml).toContain('<nav id="toc" epub:type="toc">');
      expect(result.navXhtml).toContain('<h1>Contents</h1>');
      expect(result.navXhtml).toContain('<ol>');
      expect(result.navXhtml).toContain('</ol>');
      expect(result.navXhtml).toContain('</nav>');
    });

    it('should include nested ol elements for subheadings', () => {
      const book = createTestBook();
      const chapter = createTestChapter(1, 'Main Chapter', [
        createHeading(2, 'Section 1'),
        createHeading(2, 'Section 2'),
      ]);
      book.chapters = [chapter];

      const result = generateTOC(book);

      // Should have nested <ol> for subheadings
      const olCount = (result.navXhtml.match(/<ol>/g) || []).length;
      expect(olCount).toBeGreaterThan(1);
    });

    it('should escape HTML special characters in nav.xhtml', () => {
      const book = createTestBook();
      book.chapters = [
        createTestChapter(1, 'Chapter with <special> & "characters"'),
      ];

      const result = generateTOC(book);

      expect(result.navXhtml).toContain('&lt;special&gt;');
      expect(result.navXhtml).toContain('&amp;');
      expect(result.navXhtml).toContain('&quot;');
    });

    it('should include CSS styling', () => {
      const book = createTestBook();
      book.chapters = [createTestChapter(1, 'Chapter One')];

      const result = generateTOC(book);

      expect(result.navXhtml).toContain('<style type="text/css">');
      expect(result.navXhtml).toContain('nav#toc');
      expect(result.navXhtml).toContain('</style>');
    });
  });

  describe('chapter with parts', () => {
    it('should include part information in TOC', () => {
      const book = createTestBook();
      const chapter = createTestChapter(1, 'The Beginning');
      chapter.partNumber = 1;
      chapter.partTitle = 'Part I: Origins';

      book.chapters = [chapter];

      const result = generateTOC(book);

      expect(result.entries[0].title).toBe('Part I: Origins: The Beginning');
    });
  });

  describe('edge cases', () => {
    it('should handle empty book with no chapters', () => {
      const book = createTestBook();

      const result = generateTOC(book);

      expect(result.entries).toHaveLength(0);
      expect(result.ncx).toContain('<navMap>');
      expect(result.navXhtml).toContain('<nav');
    });

    it('should handle chapters without content', () => {
      const book = createTestBook();
      book.chapters = [createTestChapter(1, 'Empty Chapter', [])];

      const result = generateTOC(book);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].children).toHaveLength(0);
    });

    it('should handle missing author information', () => {
      const book = createTestBook();
      book.authors = [];
      book.chapters = [createTestChapter(1, 'Chapter One')];

      const result = generateTOC(book);

      expect(result.ncx).toContain('<docAuthor>');
      expect(result.ncx).toContain('Unknown Author');
    });
  });
});

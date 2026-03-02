/**
 * Integration tests for EPUB 3 export workflow
 * Tests: book data → EPUB structure → metadata → styling → TOC → packaging
 */

import { Book, Author } from '../../src/types/book';
import { Chapter } from '../../src/types/chapter';
import { BookStyle } from '../../src/types/style';
import { Element } from '../../src/types/element';
import { ImageData } from '../../src/workers/types';
import {
  generateEPUBStructure,
  generateTOC,
  validateEPUB,
  EPUBOptions,
} from '../../src/lib/epub/generator';
import { EPUBExporter, exportEPUB } from '../../src/lib/export/epubExporter';

// Mock epub-gen-memory
jest.mock('epub-gen-memory', () => {
  return jest.fn().mockImplementation((options) => ({
    genEpub: jest.fn().mockResolvedValue(new ArrayBuffer(1024)),
  }));
});

describe('EPUB Export Workflow Integration Tests', () => {
  // Test data factories
  const createMockAuthor = (overrides?: Partial<Author>): Author => ({
    id: 'author-1',
    name: 'John Doe',
    role: 'author',
    ...overrides,
  });

  const createMockChapter = (overrides?: Partial<Chapter>): Chapter => ({
    id: 'chapter-1',
    number: 1,
    title: 'Chapter One',
    content: [
      {
        id: 'block-1',
        type: 'paragraph',
        content: 'This is the first paragraph of the chapter.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    includeInToc: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockElement = (overrides?: Partial<Element>): Element => ({
    id: 'element-1',
    type: 'dedication',
    matter: 'front',
    content: [
      {
        id: 'block-1',
        type: 'paragraph',
        content: 'For my family',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    includeInToc: false,
    metadata: {
      id: 'meta-1',
      title: 'Dedication',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockBook = (overrides?: Partial<Book>): Book => ({
    id: 'book-1',
    title: 'Test Book',
    subtitle: 'A Test Novel',
    authors: [createMockAuthor()],
    frontMatter: [],
    chapters: [createMockChapter()],
    backMatter: [],
    styles: [],
    metadata: {
      title: 'Test Book',
      createdAt: new Date(),
      updatedAt: new Date(),
      isbn: '978-3-16-148410-0',
      publisher: 'Test Publisher',
      language: 'en',
      genre: ['Fiction'],
      description: 'A test book for EPUB export',
      rights: 'Copyright 2026',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockStyle = (overrides?: Partial<BookStyle>): BookStyle => ({
    id: 'style-1',
    name: 'Standard Style',
    description: 'Standard book style',
    isDefault: true,
    css: 'body { font-family: Georgia, serif; }',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockImage = (overrides?: Partial<ImageData>): ImageData => ({
    id: 'image-1',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    mimeType: 'image/png',
    width: 100,
    height: 100,
    ...overrides,
  });

  describe('Basic EPUB Generation', () => {
    it('should generate EPUB structure from minimal book data', () => {
      const book = createMockBook();
      const styles: BookStyle[] = [];
      const images: ImageData[] = [];

      const structure = generateEPUBStructure(book, styles, images);

      expect(structure).toBeDefined();
      expect(structure.metadata).toBeDefined();
      expect(structure.metadata.title).toBe('Test Book');
      expect(structure.metadata.author).toBe('John Doe');
      expect(structure.chapters).toHaveLength(1);
      expect(structure.chapters[0].title).toBe('Chapter One');
    });

    it('should include multiple authors in metadata', () => {
      const book = createMockBook({
        authors: [
          createMockAuthor({ id: 'author-1', name: 'John Doe' }),
          createMockAuthor({ id: 'author-2', name: 'Jane Smith' }),
        ],
      });

      const structure = generateEPUBStructure(book, [], []);

      expect(Array.isArray(structure.metadata.author)).toBe(true);
      expect(structure.metadata.author).toEqual(['John Doe', 'Jane Smith']);
    });

    it('should generate HTML content for chapters', () => {
      const book = createMockBook();
      const structure = generateEPUBStructure(book, [], []);

      expect(structure.chapters[0].content).toContain('<div class="chapter">');
      expect(structure.chapters[0].content).toContain('<h1 class="chapter-title">Chapter One</h1>');
      expect(structure.chapters[0].content).toContain('This is the first paragraph');
    });
  });

  describe('Front and Back Matter', () => {
    it('should include front matter elements', () => {
      const book = createMockBook({
        frontMatter: [
          createMockElement({
            type: 'dedication',
            metadata: { id: 'meta-1', title: 'Dedication', createdAt: new Date(), updatedAt: new Date() },
          }),
          createMockElement({
            type: 'acknowledgments',
            metadata: { id: 'meta-2', title: 'Acknowledgments', createdAt: new Date(), updatedAt: new Date() },
          }),
        ],
      });

      const structure = generateEPUBStructure(book, [], []);

      // 2 front matter + 1 chapter
      expect(structure.chapters.length).toBeGreaterThanOrEqual(3);
      expect(structure.chapters[0].title).toBe('Dedication');
      expect(structure.chapters[0].beforeToc).toBe(true);
      expect(structure.chapters[1].title).toBe('Acknowledgments');
    });

    it('should include back matter elements', () => {
      const book = createMockBook({
        backMatter: [
          createMockElement({
            type: 'epilogue',
            metadata: { id: 'meta-1', title: 'Epilogue', createdAt: new Date(), updatedAt: new Date() },
          }),
        ],
      });

      const structure = generateEPUBStructure(book, [], []);

      // 1 chapter + 1 back matter
      expect(structure.chapters.length).toBeGreaterThanOrEqual(2);
      const lastChapter = structure.chapters[structure.chapters.length - 1];
      expect(lastChapter.title).toBe('Epilogue');
    });

    it('should respect includeInToc for front/back matter', () => {
      const book = createMockBook({
        frontMatter: [
          createMockElement({
            type: 'dedication',
            includeInToc: false,
            metadata: { id: 'meta-1', title: 'Dedication', createdAt: new Date(), updatedAt: new Date() },
          }),
        ],
      });

      const structure = generateEPUBStructure(book, [], []);

      expect(structure.chapters[0].excludeFromToc).toBe(true);
    });
  });

  describe('Styling', () => {
    it('should apply custom styles to EPUB', () => {
      const book = createMockBook();
      const styles = [
        createMockStyle({
          name: 'Custom Style',
          css: '.custom-class { color: red; }',
        }),
      ];

      const structure = generateEPUBStructure(book, styles, []);

      expect(structure.styles).toContain('.custom-class { color: red; }');
      expect(structure.styles).toContain('/* Custom Style */');
    });

    it('should include default base styles', () => {
      const book = createMockBook();
      const structure = generateEPUBStructure(book, [], []);

      expect(structure.styles).toContain('body {');
      expect(structure.styles).toContain('.chapter-title');
      expect(structure.styles).toContain('.epigraph');
    });

    it('should combine multiple style sheets', () => {
      const book = createMockBook();
      const styles = [
        createMockStyle({ name: 'Style 1', css: '.style1 {}' }),
        createMockStyle({ name: 'Style 2', css: '.style2 {}' }),
      ];

      const structure = generateEPUBStructure(book, styles, []);

      expect(structure.styles).toContain('.style1 {}');
      expect(structure.styles).toContain('.style2 {}');
    });
  });

  describe('Images', () => {
    it('should process images for EPUB', () => {
      const book = createMockBook();
      const images = [
        createMockImage({ id: 'img-1' }),
        createMockImage({ id: 'img-2' }),
      ];

      const structure = generateEPUBStructure(book, [], images);

      expect(structure.images).toHaveLength(2);
      expect(structure.images[0].id).toBe('img-1');
      expect(structure.images[1].id).toBe('img-2');
    });

    it('should include cover image', () => {
      const book = createMockBook({
        coverImage: 'cover-1',
      });
      const images = [
        createMockImage({ id: 'cover-1' }),
      ];

      const structure = generateEPUBStructure(book, [], images);

      expect(structure.coverImage).toBeDefined();
      expect(structure.coverImage?.id).toBe('cover-1');
    });

    it('should handle books without images', () => {
      const book = createMockBook();
      const structure = generateEPUBStructure(book, [], []);

      expect(structure.images).toEqual([]);
      expect(structure.coverImage).toBeUndefined();
    });
  });

  describe('Table of Contents', () => {
    it('should generate TOC from structure', () => {
      const book = createMockBook({
        chapters: [
          createMockChapter({ id: 'ch-1', title: 'Chapter One', number: 1 }),
          createMockChapter({ id: 'ch-2', title: 'Chapter Two', number: 2 }),
        ],
      });

      const structure = generateEPUBStructure(book, [], []);
      const toc = generateTOC(structure);

      expect(toc).toContain('<nav epub:type="toc"');
      expect(toc).toContain('Chapter One');
      expect(toc).toContain('Chapter Two');
    });

    it('should exclude chapters with excludeFromToc', () => {
      const book = createMockBook({
        chapters: [
          createMockChapter({ id: 'ch-1', title: 'Chapter One', includeInToc: true }),
          createMockChapter({ id: 'ch-2', title: 'Hidden Chapter', includeInToc: false }),
        ],
      });

      const structure = generateEPUBStructure(book, [], []);
      const toc = generateTOC(structure);

      expect(toc).toContain('Chapter One');
      expect(toc).not.toContain('Hidden Chapter');
    });
  });

  describe('EPUB Validation', () => {
    it('should validate complete EPUB structure', () => {
      const book = createMockBook();
      const structure = generateEPUBStructure(book, [], []);

      const validation = validateEPUB(structure);

      expect(validation.valid).toBe(true);
      expect(validation.errors.filter(e => e.type === 'error')).toHaveLength(0);
    });

    it('should fail validation without title', () => {
      const book = createMockBook({ title: '' });
      const structure = generateEPUBStructure(book, [], []);

      const validation = validateEPUB(structure);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('title'),
        })
      );
    });

    it('should fail validation without author', () => {
      const book = createMockBook({ authors: [] });
      const structure = generateEPUBStructure(book, [], []);

      const validation = validateEPUB(structure);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('author'),
        })
      );
    });

    it('should fail validation without chapters', () => {
      const book = createMockBook({ chapters: [] });
      const structure = generateEPUBStructure(book, [], []);

      const validation = validateEPUB(structure);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('at least one chapter'),
        })
      );
    });

    it('should warn about missing language', () => {
      const book = createMockBook({
        metadata: {
          title: 'Test Book',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      const structure = generateEPUBStructure(book, [], []);

      const validation = validateEPUB(structure);

      // May still be valid but with warnings
      expect(validation.errors).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          message: expect.stringContaining('language'),
        })
      );
    });
  });

  describe('Complete Export Workflow', () => {
    it('should export EPUB with all steps', async () => {
      const book = createMockBook();
      const styles: BookStyle[] = [];
      const images: ImageData[] = [];

      const result = await exportEPUB(book, styles, images);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeDefined();
      expect(result.fileName).toContain('test_book');
      expect(result.fileName).toContain('.epub');
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should track progress during export', async () => {
      const book = createMockBook();
      const progressUpdates: string[] = [];

      const exporter = new EPUBExporter(
        book,
        [],
        [],
        {},
        (progress) => {
          progressUpdates.push(progress.step);
        }
      );

      await exporter.export();

      expect(progressUpdates).toContain('structure');
      expect(progressUpdates).toContain('metadata');
      expect(progressUpdates).toContain('styling');
      expect(progressUpdates).toContain('validation');
      expect(progressUpdates).toContain('packaging');
      expect(progressUpdates).toContain('complete');
    });

    it('should handle export with all options', async () => {
      const book = createMockBook({
        frontMatter: [createMockElement()],
        backMatter: [createMockElement({ type: 'epilogue' })],
        chapters: [
          createMockChapter({ number: 1, title: 'Chapter One' }),
          createMockChapter({ number: 2, title: 'Chapter Two' }),
        ],
      });

      const styles = [createMockStyle()];
      const images = [createMockImage()];

      const options: EPUBOptions = {
        includeMetadata: true,
        includeToc: true,
        validate: true,
        quality: 'high',
      };

      const result = await exportEPUB(book, styles, images, options);

      expect(result.success).toBe(true);
      expect(result.validation).toBeDefined();
      expect(result.validation?.valid).toBe(true);
    });

    it('should fail export for invalid book data', async () => {
      const book = createMockBook({ title: '', authors: [] });

      const result = await exportEPUB(book, [], []);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('validation failed');
    });
  });

  describe('Different Book Configurations', () => {
    it('should export book with complex chapter structure', async () => {
      const book = createMockBook({
        chapters: [
          createMockChapter({
            id: 'ch-1',
            number: 1,
            title: 'Chapter One',
            subtitle: 'The Beginning',
            epigraph: 'To be or not to be',
            epigraphAttribution: 'Shakespeare',
            content: [
              {
                id: 'block-1',
                type: 'paragraph',
                content: [
                  { text: 'This is ', bold: false },
                  { text: 'bold text', bold: true },
                  { text: ' and ', bold: false },
                  { text: 'italic text', italic: true },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          }),
        ],
      });

      const result = await exportEPUB(book, [], []);

      expect(result.success).toBe(true);
    });

    it('should export book without front/back matter', async () => {
      const book = createMockBook({
        frontMatter: [],
        backMatter: [],
        chapters: [createMockChapter()],
      });

      const result = await exportEPUB(book, [], []);

      expect(result.success).toBe(true);
    });

    it('should export book with only text (no images)', async () => {
      const book = createMockBook();

      const result = await exportEPUB(book, [], []);

      expect(result.success).toBe(true);
    });

    it('should export book with custom styles', async () => {
      const book = createMockBook();
      const styles = [
        createMockStyle({
          name: 'Fancy Style',
          css: `
            .chapter-title { font-family: 'Times New Roman', serif; }
            p { text-indent: 2em; }
          `,
        }),
      ];

      const result = await exportEPUB(book, styles, []);

      expect(result.success).toBe(true);
    });

    it('should export multi-author book', async () => {
      const book = createMockBook({
        authors: [
          createMockAuthor({ id: 'a1', name: 'Author One' }),
          createMockAuthor({ id: 'a2', name: 'Author Two', role: 'co-author' }),
          createMockAuthor({ id: 'a3', name: 'Editor One', role: 'editor' }),
        ],
      });

      const result = await exportEPUB(book, [], []);

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Force an error by providing invalid data
      const invalidBook = { invalid: 'data' } as any;

      const exporter = new EPUBExporter(invalidBook, [], []);
      const result = await exporter.export();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include validation errors in result', async () => {
      const book = createMockBook({ chapters: [] });

      const result = await exportEPUB(book, [], [], { validate: true });

      expect(result.success).toBe(false);
      expect(result.validation).toBeDefined();
      expect(result.validation?.valid).toBe(false);
      expect(result.validation?.errors.length).toBeGreaterThan(0);
    });
  });
});

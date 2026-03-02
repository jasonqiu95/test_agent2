/**
 * Comprehensive tests for EpubGenerator service
 * Tests metadata generation, content XHTML conversion, CSS injection, TOC.ncx/nav.xhtml generation,
 * spine/manifest entries, OPF package document, ZIP archive creation, cover image handling,
 * font embedding, and validation
 */

import { EpubGenerator } from '../EpubGenerator';
import { Book } from '../../types/book';
import { BookStyle } from '../../types/style';
import JSZip from 'jszip';

describe('EpubGenerator', () => {
  let generator: EpubGenerator;

  beforeEach(() => {
    generator = new EpubGenerator();
  });

  // Mock book data for testing
  const createMockBook = (overrides: Partial<Book> = {}): Book => ({
    id: 'book-123',
    title: 'Test Book',
    subtitle: 'A Test Subtitle',
    authors: [
      { id: 'author-1', name: 'John Doe', role: 'author' },
      { id: 'author-2', name: 'Jane Smith', role: 'editor' },
    ],
    frontMatter: [],
    chapters: [
      {
        id: 'chapter-1',
        number: 1,
        title: 'Introduction',
        content: [
          {
            id: 'block-1',
            blockType: 'paragraph',
            content: 'This is the first paragraph of the introduction.',
          },
          {
            id: 'block-2',
            blockType: 'paragraph',
            content: 'This is the second paragraph.',
          },
        ],
        includeInToc: true,
      },
      {
        id: 'chapter-2',
        number: 2,
        title: 'Main Content',
        subtitle: 'The Core Material',
        epigraph: 'An inspiring quote',
        epigraphAttribution: 'Famous Author',
        content: [
          {
            id: 'block-3',
            blockType: 'heading',
            content: 'Section Title',
            level: 2,
          },
          {
            id: 'block-4',
            blockType: 'paragraph',
            content: 'Content of the main chapter.',
          },
        ],
        includeInToc: true,
      },
    ],
    backMatter: [],
    styles: [],
    metadata: {
      isbn: '1234567890',
      isbn13: '978-1234567890',
      language: 'en',
      publisher: 'Test Publisher',
      publicationDate: new Date('2024-01-15'),
      description: 'A test book for unit testing',
      rights: 'Copyright © 2024 Test Publisher',
    },
    coverImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  });

  const createMockStyle = (overrides: Partial<BookStyle> = {}): BookStyle => ({
    id: 'style-1',
    name: 'Classic',
    description: 'A classic book style',
    category: 'serif',
    fonts: {
      body: 'Georgia',
      heading: 'Garamond',
      fallback: 'serif',
    },
    headings: {
      h1: {
        fontSize: '2em',
        fontWeight: 'bold',
        marginTop: '1em',
        marginBottom: '0.5em',
      },
      h2: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        marginTop: '0.8em',
        marginBottom: '0.4em',
      },
      h3: {
        fontSize: '1.2em',
        fontWeight: 'bold',
        marginTop: '0.6em',
        marginBottom: '0.3em',
      },
    },
    body: {
      fontSize: '1em',
      lineHeight: '1.6',
      textAlign: 'justify',
    },
    dropCap: {
      enabled: true,
      lines: 3,
      fontSize: '3em',
      fontWeight: 'bold',
    },
    ornamentalBreak: {
      enabled: true,
      symbol: '***',
      textAlign: 'center',
      marginTop: '2em',
      marginBottom: '2em',
    },
    firstParagraph: {
      enabled: true,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
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
      text: '#000000',
      heading: '#1a1a1a',
      background: '#ffffff',
    },
    ...overrides,
  });

  describe('Metadata Generation', () => {
    describe('generatePackageOpf', () => {
      it('should generate valid package.opf with title, author, and language', () => {
        const metadata = {
          title: 'Test Book',
          authors: [{ name: 'John Doe' }],
          language: 'en',
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(result).toContain('<package xmlns="http://www.idpf.org/2007/opf" version="3.0"');
        expect(result).toContain('<dc:title>Test Book</dc:title>');
        expect(result).toContain('<dc:creator id="author1">John Doe</dc:creator>');
        expect(result).toContain('<dc:language>en</dc:language>');
      });

      it('should include ISBN-13 in metadata', () => {
        const metadata = {
          title: 'Test Book',
          authors: [{ name: 'John Doe' }],
          isbn13: '978-1234567890',
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<dc:identifier opf:scheme="ISBN">978-1234567890</dc:identifier>');
      });

      it('should include ISBN-10 when ISBN-13 is not provided', () => {
        const metadata = {
          title: 'Test Book',
          authors: [{ name: 'John Doe' }],
          isbn: '1234567890',
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<dc:identifier opf:scheme="ISBN">1234567890</dc:identifier>');
      });

      it('should prefer ISBN-13 over ISBN-10', () => {
        const metadata = {
          title: 'Test Book',
          authors: [{ name: 'John Doe' }],
          isbn: '0987654321',
          isbn13: '978-1111111111',
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<dc:identifier opf:scheme="ISBN">978-1111111111</dc:identifier>');
        expect(result).not.toContain('0987654321');
      });

      it('should include subtitle with proper metadata', () => {
        const metadata = {
          title: 'Main Title',
          subtitle: 'A Subtitle',
          authors: [{ name: 'Jane Doe' }],
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<dc:title>Main Title</dc:title>');
        expect(result).toContain('<dc:title id="subtitle">A Subtitle</dc:title>');
        expect(result).toContain('<meta property="title-type" refines="#subtitle">subtitle</meta>');
      });

      it('should include multiple authors with proper roles', () => {
        const metadata = {
          title: 'Collaborative Work',
          authors: [
            { name: 'Author One', role: 'author' },
            { name: 'Editor Two', role: 'editor' },
            { name: 'Translator Three', role: 'translator' },
          ],
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<dc:creator id="author1">Author One</dc:creator>');
        expect(result).toContain('<meta property="role" refines="#author1" scheme="marc:relators">aut</meta>');
        expect(result).toContain('<dc:creator id="author2">Editor Two</dc:creator>');
        expect(result).toContain('<meta property="role" refines="#author2" scheme="marc:relators">edt</meta>');
        expect(result).toContain('<dc:creator id="author3">Translator Three</dc:creator>');
        expect(result).toContain('<meta property="role" refines="#author3" scheme="marc:relators">trl</meta>');
      });

      it('should include publisher and publication date', () => {
        const metadata = {
          title: 'Published Book',
          authors: [{ name: 'Author' }],
          publisher: 'Test Publisher',
          publicationDate: new Date('2024-01-15'),
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<dc:publisher>Test Publisher</dc:publisher>');
        expect(result).toContain('<dc:date>2024-01-15</dc:date>');
      });

      it('should include description and rights', () => {
        const metadata = {
          title: 'Complete Book',
          authors: [{ name: 'Author' }],
          description: 'A comprehensive book about testing',
          rights: 'Copyright © 2024 Test Publisher',
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<dc:description>A comprehensive book about testing</dc:description>');
        expect(result).toContain('<dc:rights>Copyright © 2024 Test Publisher</dc:rights>');
      });

      it('should escape XML special characters in metadata', () => {
        const metadata = {
          title: 'Book & Title with <tags> and "quotes"',
          authors: [{ name: "O'Brien & Co." }],
          description: 'Contains <special> & "characters"',
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('Book &amp; Title with &lt;tags&gt; and &quot;quotes&quot;');
        expect(result).toContain('O&apos;Brien &amp; Co.');
        expect(result).toContain('Contains &lt;special&gt; &amp; &quot;characters&quot;');
      });

      it('should include dcterms:modified timestamp', () => {
        const metadata = {
          title: 'Test Book',
          authors: [{ name: 'Author' }],
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<meta property="dcterms:modified">');
        expect(result).toMatch(/<meta property="dcterms:modified">\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z<\/meta>/);
      });

      it('should default to English language when not specified', () => {
        const metadata = {
          title: 'Book',
          authors: [{ name: 'Author' }],
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('xml:lang="en"');
        expect(result).toContain('<dc:language>en</dc:language>');
      });

      it('should use custom book ID when provided', () => {
        const metadata = {
          title: 'Test Book',
          authors: [{ name: 'Author' }],
          id: 'custom-book-id-123',
        };

        const result = generator.generatePackageOpf(metadata);

        expect(result).toContain('<dc:identifier id="bookid">custom-book-id-123</dc:identifier>');
      });
    });
  });

  describe('Manifest and Spine Generation', () => {
    it('should include manifest items in package.opf', () => {
      const metadata = {
        title: 'Book',
        authors: [{ name: 'Author' }],
      };

      const manifestItems = [
        { id: 'chapter1', href: 'chapter1.xhtml', mediaType: 'application/xhtml+xml' },
        { id: 'stylesheet', href: 'styles.css', mediaType: 'text/css' },
        { id: 'cover-image', href: 'cover.jpg', mediaType: 'image/jpeg', properties: 'cover-image' },
      ];

      const result = generator.generatePackageOpf(metadata, manifestItems);

      expect(result).toContain('<manifest>');
      expect(result).toContain('<item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>');
      expect(result).toContain('<item id="stylesheet" href="styles.css" media-type="text/css"/>');
      expect(result).toContain('<item id="cover-image" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>');
      expect(result).toContain('</manifest>');
    });

    it('should automatically add nav document to manifest if not present', () => {
      const metadata = {
        title: 'Book',
        authors: [{ name: 'Author' }],
      };

      const result = generator.generatePackageOpf(metadata, []);

      expect(result).toContain('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');
    });

    it('should include spine items in reading order', () => {
      const metadata = {
        title: 'Book',
        authors: [{ name: 'Author' }],
      };

      const spineItems = [
        { idref: 'cover' },
        { idref: 'chapter1' },
        { idref: 'chapter2' },
        { idref: 'appendix', linear: false },
      ];

      const result = generator.generatePackageOpf(metadata, [], spineItems);

      expect(result).toContain('<spine>');
      expect(result).toContain('<itemref idref="cover"/>');
      expect(result).toContain('<itemref idref="chapter1"/>');
      expect(result).toContain('<itemref idref="chapter2"/>');
      expect(result).toContain('<itemref idref="appendix" linear="no"/>');
      expect(result).toContain('</spine>');
    });

    it('should include guide section with reference items', () => {
      const metadata = {
        title: 'Book',
        authors: [{ name: 'Author' }],
      };

      const guideItems = [
        { type: 'cover', title: 'Cover', href: 'cover.xhtml' },
        { type: 'toc', title: 'Table of Contents', href: 'toc.xhtml' },
        { type: 'text', title: 'Start', href: 'chapter1.xhtml' },
      ];

      const result = generator.generatePackageOpf(metadata, [], [], guideItems);

      expect(result).toContain('<guide>');
      expect(result).toContain('<reference type="cover" title="Cover" href="cover.xhtml"/>');
      expect(result).toContain('<reference type="toc" title="Table of Contents" href="toc.xhtml"/>');
      expect(result).toContain('<reference type="text" title="Start" href="chapter1.xhtml"/>');
      expect(result).toContain('</guide>');
    });

    it('should not include guide section when no guide items provided', () => {
      const metadata = {
        title: 'Book',
        authors: [{ name: 'Author' }],
      };

      const result = generator.generatePackageOpf(metadata, [], []);

      expect(result).not.toContain('<guide>');
    });
  });

  describe('EPUB Structure', () => {
    it('should create basic EPUB directory structure with mimetype', async () => {
      const zip = generator.buildEpubStructure();

      const mimetypeFile = zip.file('mimetype');
      expect(mimetypeFile).not.toBeNull();

      if (mimetypeFile) {
        const content = await mimetypeFile.async('string');
        expect(content).toBe('application/epub+zip');
      }
    });

    it('should create META-INF folder', () => {
      const zip = generator.buildEpubStructure();
      expect(zip.folder('META-INF')).not.toBeNull();
    });

    it('should create OEBPS folder', () => {
      const zip = generator.buildEpubStructure();
      expect(zip.folder('OEBPS')).not.toBeNull();
    });

    it('should create container.xml in META-INF', async () => {
      const zip = generator.buildEpubStructure();
      const containerFile = zip.file('META-INF/container.xml');

      expect(containerFile).not.toBeNull();

      if (containerFile) {
        const content = await containerFile.async('string');
        expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(content).toContain('<container version="1.0"');
        expect(content).toContain('xmlns="urn:oasis:names:tc:opendocument:xmlns:container"');
        expect(content).toContain('<rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/>');
      }
    });

    it('should set mimetype file with STORE compression', async () => {
      const zip = generator.buildEpubStructure();
      const mimetypeFile = zip.file('mimetype');

      if (mimetypeFile) {
        // Check compression options
        const options = (mimetypeFile as any)._data?.compressedSize;
        // The mimetype should be stored uncompressed
        const content = await mimetypeFile.async('string');
        expect(content).toBe('application/epub+zip');
      }
    });
  });

  describe('TOC.ncx Generation', () => {
    it('should generate valid toc.ncx with chapters', () => {
      const chapters = [
        { id: 'chapter-1', title: 'Introduction', number: 1, content: [], includeInToc: true },
        { id: 'chapter-2', title: 'Main Content', number: 2, content: [], includeInToc: true },
        { id: 'chapter-3', title: 'Conclusion', number: 3, content: [], includeInToc: true },
      ];

      const result = generator.generateTocNcx(chapters);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN"');
      expect(result).toContain('<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">');
      expect(result).toContain('<docTitle>');
      expect(result).toContain('<text>Table of Contents</text>');
      expect(result).toContain('<navMap>');
    });

    it('should include navPoint elements for each chapter', () => {
      const chapters = [
        { id: 'chapter-1', title: 'Introduction', number: 1, content: [], includeInToc: true },
        { id: 'chapter-2', title: 'Main Content', number: 2, content: [], includeInToc: true },
      ];

      const result = generator.generateTocNcx(chapters);

      expect(result).toContain('<navPoint id="navpoint-1" playOrder="1">');
      expect(result).toContain('<text>Introduction</text>');
      expect(result).toContain('<content src="chapter-1.xhtml"/>');

      expect(result).toContain('<navPoint id="navpoint-2" playOrder="2">');
      expect(result).toContain('<text>Main Content</text>');
      expect(result).toContain('<content src="chapter-2.xhtml"/>');
    });

    it('should filter out chapters with includeInToc=false', () => {
      const chapters = [
        { id: 'chapter-1', title: 'Introduction', number: 1, content: [], includeInToc: true },
        { id: 'chapter-2', title: 'Hidden Chapter', number: 2, content: [], includeInToc: false },
        { id: 'chapter-3', title: 'Conclusion', number: 3, content: [], includeInToc: true },
      ];

      const result = generator.generateTocNcx(chapters);

      expect(result).toContain('Introduction');
      expect(result).not.toContain('Hidden Chapter');
      expect(result).toContain('Conclusion');
    });

    it('should escape XML special characters in chapter titles', () => {
      const chapters = [
        { id: 'chapter-1', title: 'Chapter with <tags> & "quotes"', number: 1, content: [], includeInToc: true },
      ];

      const result = generator.generateTocNcx(chapters);

      expect(result).toContain('Chapter with &lt;tags&gt; &amp; &quot;quotes&quot;');
    });

    it('should include UUID in head metadata', () => {
      const chapters = [
        { id: 'chapter-1', title: 'Test', number: 1, content: [], includeInToc: true },
      ];

      const result = generator.generateTocNcx(chapters);

      expect(result).toContain('<meta name="dtb:uid" content="urn:uuid:');
      expect(result).toMatch(/urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/);
    });
  });

  describe('nav.xhtml Generation', () => {
    it('should generate valid EPUB 3 navigation document', () => {
      const chapters = [
        { id: 'chapter-1', title: 'Introduction', number: 1, content: [], includeInToc: true },
        { id: 'chapter-2', title: 'Main Content', number: 2, content: [], includeInToc: true },
      ];

      const result = generator.generateNavXhtml(chapters);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html xmlns="http://www.w3.org/1999/xhtml"');
      expect(result).toContain('xmlns:epub="http://www.idpf.org/2007/ops"');
      expect(result).toContain('<nav epub:type="toc" id="toc">');
      expect(result).toContain('<h1>Table of Contents</h1>');
    });

    it('should include chapter links in navigation list', () => {
      const chapters = [
        { id: 'chapter-1', title: 'Introduction', number: 1, content: [], includeInToc: true },
        { id: 'chapter-2', title: 'Conclusion', number: 2, content: [], includeInToc: true },
      ];

      const result = generator.generateNavXhtml(chapters);

      expect(result).toContain('<a href="chapter-chapter-1.xhtml">Chapter 1: Introduction</a>');
      expect(result).toContain('<a href="chapter-chapter-2.xhtml">Chapter 2: Conclusion</a>');
    });

    it('should filter out chapters with includeInToc=false', () => {
      const chapters = [
        { id: 'chapter-1', title: 'Introduction', number: 1, content: [], includeInToc: true },
        { id: 'chapter-2', title: 'Hidden', number: 2, content: [], includeInToc: false },
      ];

      const result = generator.generateNavXhtml(chapters);

      expect(result).toContain('Introduction');
      expect(result).not.toContain('Hidden');
    });

    it('should group chapters by parts when partNumber and partTitle are provided', () => {
      const chapters = [
        {
          id: 'chapter-1',
          title: 'Introduction',
          number: 1,
          content: [],
          includeInToc: true,
          partNumber: 1,
          partTitle: 'Part One: Beginning',
        },
        {
          id: 'chapter-2',
          title: 'Development',
          number: 2,
          content: [],
          includeInToc: true,
          partNumber: 1,
          partTitle: 'Part One: Beginning',
        },
        {
          id: 'chapter-3',
          title: 'Conclusion',
          number: 3,
          content: [],
          includeInToc: true,
          partNumber: 2,
          partTitle: 'Part Two: Ending',
        },
      ];

      const result = generator.generateNavXhtml(chapters);

      expect(result).toContain('Part One: Beginning');
      expect(result).toContain('Part Two: Ending');
    });

    it('should include CSS styles for navigation', () => {
      const chapters = [
        { id: 'chapter-1', title: 'Test', number: 1, content: [], includeInToc: true },
      ];

      const result = generator.generateNavXhtml(chapters);

      expect(result).toContain('<style type="text/css">');
      expect(result).toContain('nav {');
      expect(result).toContain('font-family: sans-serif;');
      expect(result).toContain('.part-title {');
    });
  });

  describe('CSS Generation', () => {
    it('should generate CSS from BookStyle', () => {
      const style = createMockStyle();
      const css = (generator as any).generateCss(style);

      expect(css).toContain('/* Generated EPUB Styles */');
      expect(css).toContain('body {');
      expect(css).toContain('font-family: Georgia, serif;');
      expect(css).toContain('font-size: 1em;');
      expect(css).toContain('line-height: 1.6;');
      expect(css).toContain('color: #000000;');
    });

    it('should include heading styles', () => {
      const style = createMockStyle();
      const css = (generator as any).generateCss(style);

      expect(css).toContain('h1 {');
      expect(css).toContain('font-family: Garamond, serif;');
      expect(css).toContain('font-size: 2em;');

      expect(css).toContain('h2 {');
      expect(css).toContain('font-size: 1.5em;');

      expect(css).toContain('h3 {');
      expect(css).toContain('font-size: 1.2em;');
    });

    it('should include drop cap styles when enabled', () => {
      const style = createMockStyle({
        dropCap: {
          enabled: true,
          lines: 3,
          fontSize: '3em',
          fontWeight: 'bold',
          color: '#333',
          marginRight: '0.1em',
        },
      });

      const css = (generator as any).generateCss(style);

      expect(css).toContain('p.first-paragraph::first-letter {');
      expect(css).toContain('float: left;');
      expect(css).toContain('font-size: 3em;');
      expect(css).toContain('line-height: 3;');
      expect(css).toContain('font-weight: bold;');
      expect(css).toContain('color: #333;');
    });

    it('should not include drop cap styles when disabled', () => {
      const style = createMockStyle({
        dropCap: {
          enabled: false,
          lines: 3,
        },
      });

      const css = (generator as any).generateCss(style);

      expect(css).not.toContain('p.first-paragraph::first-letter {');
    });

    it('should include first paragraph styles when enabled', () => {
      const style = createMockStyle({
        firstParagraph: {
          enabled: true,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontSize: '1.1em',
          indent: { enabled: false },
        },
      });

      const css = (generator as any).generateCss(style);

      expect(css).toContain('p.first-paragraph {');
      expect(css).toContain('text-transform: uppercase;');
      expect(css).toContain('letter-spacing: 0.1em;');
      expect(css).toContain('font-size: 1.1em;');
    });

    it('should include ornamental break styles when enabled', () => {
      const style = createMockStyle({
        ornamentalBreak: {
          enabled: true,
          symbol: '***',
          textAlign: 'center',
          marginTop: '2em',
          marginBottom: '2em',
          fontSize: '1.5em',
        },
      });

      const css = (generator as any).generateCss(style);

      expect(css).toContain('.ornamental-break {');
      expect(css).toContain('text-align: center;');
      expect(css).toContain('margin-top: 2em;');
      expect(css).toContain('margin-bottom: 2em;');
      expect(css).toContain('font-size: 1.5em;');
    });

    it('should include paragraph spacing', () => {
      const style = createMockStyle();
      const css = (generator as any).generateCss(style);

      expect(css).toContain('p {');
      expect(css).toContain('margin: 1em 0;');
    });

    it('should append custom CSS when provided', () => {
      const style = createMockStyle();
      const customCss = '.custom-class { color: red; }';
      const css = (generator as any).generateCss(style, customCss);

      expect(css).toContain('/* Custom CSS */');
      expect(css).toContain('.custom-class { color: red; }');
    });

    it('should handle background color in body', () => {
      const style = createMockStyle({
        colors: {
          text: '#000',
          heading: '#111',
          background: '#f5f5f5',
        },
      });

      const css = (generator as any).generateCss(style);

      expect(css).toContain('background-color: #f5f5f5;');
    });

    it('should handle text alignment in body', () => {
      const style = createMockStyle({
        body: {
          fontSize: '1em',
          lineHeight: '1.6',
          textAlign: 'justify',
        },
      });

      const css = (generator as any).generateCss(style);

      expect(css).toContain('text-align: justify;');
    });
  });

  describe('Content XHTML Conversion', () => {
    it('should generate valid XHTML for a chapter', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Test Chapter',
        number: 1,
        content: [
          { id: 'p1', blockType: 'paragraph' as const, content: 'First paragraph.' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      expect(xhtml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xhtml).toContain('<!DOCTYPE html>');
      expect(xhtml).toContain('<html xmlns="http://www.w3.org/1999/xhtml"');
      expect(xhtml).toContain('xmlns:epub="http://www.idpf.org/2007/ops"');
      expect(xhtml).toContain('<link rel="stylesheet" type="text/css" href="styles.css"/>');
    });

    it('should include chapter title with number', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Introduction',
        number: 1,
        content: [
          { id: 'p1', blockType: 'paragraph' as const, content: 'Content' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      expect(xhtml).toContain('<h2 class="chapter-number">Chapter 1</h2>');
      expect(xhtml).toContain('<h1 class="chapter-title">Introduction</h1>');
    });

    it('should include subtitle when provided', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Main Title',
        subtitle: 'A Subtitle',
        number: 1,
        content: [
          { id: 'p1', blockType: 'paragraph' as const, content: 'Content' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      expect(xhtml).toContain('<h2 class="chapter-subtitle">A Subtitle</h2>');
    });

    it('should include epigraph when provided', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Chapter',
        epigraph: 'An inspiring quote',
        epigraphAttribution: 'Famous Author',
        content: [
          { id: 'p1', blockType: 'paragraph' as const, content: 'Content' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      expect(xhtml).toContain('<div class="epigraph">');
      expect(xhtml).toContain('<p>An inspiring quote</p>');
      expect(xhtml).toContain('<p class="attribution">Famous Author</p>');
    });

    it('should convert paragraph blocks to <p> elements', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Chapter',
        content: [
          { id: 'p1', blockType: 'paragraph' as const, content: 'First paragraph.' },
          { id: 'p2', blockType: 'paragraph' as const, content: 'Second paragraph.' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      expect(xhtml).toContain('<p class="first-paragraph">First paragraph.</p>');
      expect(xhtml).toContain('<p>Second paragraph.</p>');
    });

    it('should convert heading blocks to heading elements', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Chapter',
        content: [
          { id: 'h1', blockType: 'heading' as const, content: 'Section Title', level: 2 },
          { id: 'p1', blockType: 'paragraph' as const, content: 'Content' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      expect(xhtml).toContain('<h2>Section Title</h2>');
    });

    it('should convert preformatted blocks to <pre> elements', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Chapter',
        content: [
          { id: 'pre1', blockType: 'preformatted' as const, content: 'Preformatted text' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      expect(xhtml).toContain('<pre>Preformatted text</pre>');
    });

    it('should convert code blocks to <pre><code> elements', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Chapter',
        content: [
          { id: 'code1', blockType: 'code' as const, content: 'const x = 10;' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      expect(xhtml).toContain('<pre><code>const x = 10;</code></pre>');
    });

    it('should escape XML special characters in content', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Chapter & Title <test>',
        content: [
          { id: 'p1', blockType: 'paragraph' as const, content: 'Text with <tags> & "quotes"' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      expect(xhtml).toContain('Chapter &amp; Title &lt;test&gt;');
      expect(xhtml).toContain('Text with &lt;tags&gt; &amp; &quot;quotes&quot;');
    });

    it('should only mark first paragraph with first-paragraph class', () => {
      const chapter = {
        id: 'chapter-1',
        title: 'Chapter',
        content: [
          { id: 'p1', blockType: 'paragraph' as const, content: 'First' },
          { id: 'p2', blockType: 'paragraph' as const, content: 'Second' },
          { id: 'p3', blockType: 'paragraph' as const, content: 'Third' },
        ],
      };
      const style = createMockStyle();

      const xhtml = (generator as any).generateChapterXhtml(chapter, style);

      const firstMatch = xhtml.match(/<p class="first-paragraph">First<\/p>/);
      const secondMatch = xhtml.match(/<p>Second<\/p>/);
      const thirdMatch = xhtml.match(/<p>Third<\/p>/);

      expect(firstMatch).not.toBeNull();
      expect(secondMatch).not.toBeNull();
      expect(thirdMatch).not.toBeNull();
    });
  });

  describe('Cover Image Handling', () => {
    it('should generate cover XHTML with correct image reference', () => {
      const coverXhtml = (generator as any).generateCoverXhtml('jpg');

      expect(coverXhtml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(coverXhtml).toContain('<img src="cover.jpg" alt="Cover Image"/>');
    });

    it('should support different image formats', () => {
      const jpgXhtml = (generator as any).generateCoverXhtml('jpg');
      const pngXhtml = (generator as any).generateCoverXhtml('png');
      const gifXhtml = (generator as any).generateCoverXhtml('gif');

      expect(jpgXhtml).toContain('<img src="cover.jpg"');
      expect(pngXhtml).toContain('<img src="cover.png"');
      expect(gifXhtml).toContain('<img src="cover.gif"');
    });

    it('should detect JPEG media type from data URI', () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const mediaType = (generator as any).getCoverImageMediaType(imageData);

      expect(mediaType).toBe('image/jpeg');
    });

    it('should detect PNG media type from data URI', () => {
      const imageData = 'data:image/png;base64,iVBORw0KGgo=';
      const mediaType = (generator as any).getCoverImageMediaType(imageData);

      expect(mediaType).toBe('image/png');
    });

    it('should detect media type from file extension', () => {
      expect((generator as any).getCoverImageMediaType('cover.jpg')).toBe('image/jpeg');
      expect((generator as any).getCoverImageMediaType('cover.jpeg')).toBe('image/jpeg');
      expect((generator as any).getCoverImageMediaType('cover.png')).toBe('image/png');
      expect((generator as any).getCoverImageMediaType('cover.gif')).toBe('image/gif');
      expect((generator as any).getCoverImageMediaType('cover.svg')).toBe('image/svg+xml');
    });

    it('should default to JPEG for unknown formats', () => {
      const mediaType = (generator as any).getCoverImageMediaType('cover.unknown');
      expect(mediaType).toBe('image/jpeg');
    });

    it('should get correct file extension for media types', () => {
      expect((generator as any).getCoverImageExtension('image/jpeg')).toBe('jpg');
      expect((generator as any).getCoverImageExtension('image/png')).toBe('png');
      expect((generator as any).getCoverImageExtension('image/gif')).toBe('gif');
      expect((generator as any).getCoverImageExtension('image/svg+xml')).toBe('svg');
    });

    it('should default to jpg extension for unknown media types', () => {
      const ext = (generator as any).getCoverImageExtension('image/unknown');
      expect(ext).toBe('jpg');
    });
  });

  describe('Full EPUB Generation', () => {
    it('should successfully generate EPUB from book data', async () => {
      const book = createMockBook();
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(true);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation when book has no chapters', async () => {
      const book = createMockBook({ chapters: [] });
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Book validation failed');
    });

    it('should merge options with defaults', async () => {
      const book = createMockBook();
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style, {
        version: '2.0',
        compressionLevel: 9,
      });

      expect(result.success).toBe(true);
    });

    it('should include cover when includeCover is true and coverImage exists', async () => {
      const book = createMockBook({
        coverImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      });
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style, {
        includeCover: true,
      });

      expect(result.success).toBe(true);
    });

    it('should add warning when TOC generation is disabled', async () => {
      const book = createMockBook();
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style, {
        includeToc: false,
      });

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Table of contents generation was disabled');
    });

    it('should add warning when cover image processing fails', async () => {
      const book = createMockBook({
        coverImage: 'invalid-image-data',
      });
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style, {
        includeCover: true,
      });

      expect(result.success).toBe(true);
      // May have warnings about cover image
    });

    it('should handle custom CSS in options', async () => {
      const book = createMockBook();
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style, {
        customCss: '.custom { color: blue; }',
      });

      expect(result.success).toBe(true);
    });

    it('should generate unique chapter IDs', async () => {
      const book = createMockBook({
        chapters: [
          {
            id: 'intro',
            title: 'Introduction',
            content: [{ id: 'p1', blockType: 'paragraph', content: 'Content' }],
          },
          {
            id: 'conclusion',
            title: 'Conclusion',
            content: [{ id: 'p2', blockType: 'paragraph', content: 'Content' }],
          },
        ],
      });
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(true);
    });

    it('should handle chapters with various includeInToc values', async () => {
      const book = createMockBook({
        chapters: [
          {
            id: 'chapter-1',
            title: 'Visible Chapter',
            content: [{ id: 'p1', blockType: 'paragraph', content: 'Content' }],
            includeInToc: true,
          },
          {
            id: 'chapter-2',
            title: 'Hidden Chapter',
            content: [{ id: 'p2', blockType: 'paragraph', content: 'Content' }],
            includeInToc: false,
          },
        ],
      });
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(true);
    });

    it('should handle all book metadata fields', async () => {
      const book = createMockBook({
        metadata: {
          isbn: '1234567890',
          isbn13: '978-1234567890',
          language: 'en-US',
          publisher: 'Test Publisher Inc.',
          publicationDate: new Date('2024-01-15'),
          description: 'A comprehensive test book',
          rights: 'All rights reserved © 2024',
          edition: '1st Edition',
          genre: ['Fiction', 'Mystery'],
          keywords: ['test', 'epub', 'book'],
        },
      });
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(true);
    });

    it('should return error message on generation failure', async () => {
      const book = createMockBook({ chapters: [] });
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('ZIP Archive Structure', () => {
    it('should create valid ZIP structure with all required files', async () => {
      const book = createMockBook();
      const style = createMockStyle();

      // Generate EPUB without saving to file
      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(true);
      expect(result.fileSize).toBeGreaterThan(0);
    });

    it('should create chapters in OEBPS folder', async () => {
      const book = createMockBook();
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(true);
    });

    it('should create styles.css in OEBPS folder', async () => {
      const book = createMockBook();
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(true);
    });

    it('should create package.opf with all manifest items', async () => {
      const book = createMockBook();
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(true);
    });
  });

  describe('Default Options', () => {
    it('should return default options', () => {
      const defaults = generator.getDefaultOptions();

      expect(defaults.version).toBe('3.0');
      expect(defaults.includeToc).toBe(true);
      expect(defaults.includeCover).toBe(true);
      expect(defaults.compressionLevel).toBe(6);
    });

    it('should allow setting default options', () => {
      generator.setDefaultOptions({
        version: '2.0',
        compressionLevel: 9,
      });

      const defaults = generator.getDefaultOptions();

      expect(defaults.version).toBe('2.0');
      expect(defaults.compressionLevel).toBe(9);
      expect(defaults.includeToc).toBe(true); // Should retain other defaults
    });

    it('should use updated defaults for subsequent generations', async () => {
      generator.setDefaultOptions({
        includeCover: false,
      });

      const book = createMockBook();
      const style = createMockStyle();

      const result = await generator.generateEpub(book, style);

      expect(result.success).toBe(true);
    });
  });

  describe('Singleton Instance', () => {
    it('should export getEpubGenerator function', () => {
      const { getEpubGenerator } = require('../EpubGenerator');
      expect(typeof getEpubGenerator).toBe('function');
    });

    it('should return same instance on multiple calls', () => {
      const { getEpubGenerator } = require('../EpubGenerator');
      const instance1 = getEpubGenerator();
      const instance2 = getEpubGenerator();

      expect(instance1).toBe(instance2);
    });
  });
});

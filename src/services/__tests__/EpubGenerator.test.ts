/**
 * Tests for EpubGenerator service
 */

import { EpubGenerator } from '../EpubGenerator';

describe('EpubGenerator', () => {
  let generator: EpubGenerator;

  beforeEach(() => {
    generator = new EpubGenerator();
  });

  describe('generatePackageOpf', () => {
    it('should generate valid package.opf with minimal metadata', () => {
      const metadata = {
        title: 'Test Book',
        authors: [{ name: 'John Doe' }],
        language: 'en',
      };

      const result = generator.generatePackageOpf(metadata);

      // Check XML structure
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<package xmlns="http://www.idpf.org/2007/opf" version="3.0"');
      expect(result).toContain('<metadata');
      expect(result).toContain('<manifest>');
      expect(result).toContain('<spine>');
      expect(result).toContain('</package>');

      // Check metadata elements
      expect(result).toContain('<dc:title>Test Book</dc:title>');
      expect(result).toContain('<dc:creator id="author1">John Doe</dc:creator>');
      expect(result).toContain('<dc:language>en</dc:language>');
      expect(result).toContain('<dc:identifier id="bookid">');
      expect(result).toContain('<dc:date>');
      expect(result).toContain('<meta property="dcterms:modified">');
    });

    it('should include subtitle when provided', () => {
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

    it('should include multiple authors with roles', () => {
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

    it('should include ISBN when provided', () => {
      const metadata = {
        title: 'Book with ISBN',
        authors: [{ name: 'Author' }],
        isbn13: '978-1234567890',
      };

      const result = generator.generatePackageOpf(metadata);

      expect(result).toContain('<dc:identifier opf:scheme="ISBN">978-1234567890</dc:identifier>');
    });

    it('should prefer ISBN-13 over ISBN-10', () => {
      const metadata = {
        title: 'Book with ISBNs',
        authors: [{ name: 'Author' }],
        isbn: '0987654321',
        isbn13: '978-1234567890',
      };

      const result = generator.generatePackageOpf(metadata);

      expect(result).toContain('<dc:identifier opf:scheme="ISBN">978-1234567890</dc:identifier>');
      expect(result).not.toContain('0987654321');
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

    it('should escape XML special characters', () => {
      const metadata = {
        title: 'Book & Title with <tags> and "quotes"',
        authors: [{ name: 'O\'Brien & Co.' }],
      };

      const result = generator.generatePackageOpf(metadata);

      expect(result).toContain('Book &amp; Title with &lt;tags&gt; and &quot;quotes&quot;');
      expect(result).toContain('O&apos;Brien &amp; Co.');
    });

    it('should include manifest items', () => {
      const metadata = {
        title: 'Book',
        authors: [{ name: 'Author' }],
      };

      const manifestItems = [
        { id: 'chapter1', href: 'chapter1.xhtml', mediaType: 'application/xhtml+xml' },
        { id: 'style', href: 'style.css', mediaType: 'text/css' },
        { id: 'cover', href: 'cover.jpg', mediaType: 'image/jpeg', properties: 'cover-image' },
      ];

      const result = generator.generatePackageOpf(metadata, manifestItems);

      expect(result).toContain('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');
      expect(result).toContain('<item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>');
      expect(result).toContain('<item id="style" href="style.css" media-type="text/css"/>');
      expect(result).toContain('<item id="cover" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>');
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

      expect(result).toContain('<itemref idref="cover"/>');
      expect(result).toContain('<itemref idref="chapter1"/>');
      expect(result).toContain('<itemref idref="chapter2"/>');
      expect(result).toContain('<itemref idref="appendix" linear="no"/>');
    });

    it('should include guide items', () => {
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

    it('should not include guide section when no guide items', () => {
      const metadata = {
        title: 'Book',
        authors: [{ name: 'Author' }],
      };

      const result = generator.generatePackageOpf(metadata);

      expect(result).not.toContain('<guide>');
    });

    it('should generate complete package.opf with all sections', () => {
      const metadata = {
        title: 'Complete EPUB',
        subtitle: 'With All Features',
        authors: [
          { name: 'John Doe', role: 'author' },
          { name: 'Jane Smith', role: 'editor' },
        ],
        isbn13: '978-1234567890',
        language: 'en-US',
        publisher: 'Test Publisher Inc.',
        publicationDate: new Date('2024-03-01'),
        description: 'A complete example EPUB with all metadata',
        rights: 'All rights reserved',
        id: 'unique-book-id-123',
      };

      const manifestItems = [
        { id: 'cover', href: 'cover.xhtml', mediaType: 'application/xhtml+xml' },
        { id: 'cover-image', href: 'images/cover.jpg', mediaType: 'image/jpeg', properties: 'cover-image' },
        { id: 'chapter1', href: 'chapter1.xhtml', mediaType: 'application/xhtml+xml' },
        { id: 'chapter2', href: 'chapter2.xhtml', mediaType: 'application/xhtml+xml' },
        { id: 'style', href: 'css/style.css', mediaType: 'text/css' },
      ];

      const spineItems = [
        { idref: 'cover' },
        { idref: 'chapter1' },
        { idref: 'chapter2' },
      ];

      const guideItems = [
        { type: 'cover', title: 'Cover', href: 'cover.xhtml' },
        { type: 'text', title: 'Beginning', href: 'chapter1.xhtml' },
      ];

      const result = generator.generatePackageOpf(metadata, manifestItems, spineItems, guideItems);

      // Verify it's valid XML structure
      expect(result.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(result).toContain('unique-identifier="bookid"');
      expect(result).toContain('xml:lang="en-US"');

      // Verify all sections present
      expect(result).toContain('<metadata');
      expect(result).toContain('<manifest>');
      expect(result).toContain('<spine>');
      expect(result).toContain('<guide>');

      // Verify Dublin Core metadata
      expect(result).toContain('<dc:identifier id="bookid">unique-book-id-123</dc:identifier>');
      expect(result).toContain('<dc:title>Complete EPUB</dc:title>');
      expect(result).toContain('<dc:title id="subtitle">With All Features</dc:title>');
      expect(result).toContain('<dc:language>en-US</dc:language>');
      expect(result).toContain('<dc:publisher>Test Publisher Inc.</dc:publisher>');
      expect(result).toContain('<dc:date>2024-03-01</dc:date>');
      expect(result).toContain('<dc:description>A complete example EPUB with all metadata</dc:description>');
      expect(result).toContain('<dc:rights>All rights reserved</dc:rights>');
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
  });

  describe('buildEpubStructure', () => {
    it('should create basic EPUB directory structure', async () => {
      const zip = generator.buildEpubStructure();

      // Verify mimetype file exists
      const mimetypeFile = zip.file('mimetype');
      expect(mimetypeFile).not.toBeNull();

      if (mimetypeFile) {
        const content = await mimetypeFile.async('string');
        expect(content).toBe('application/epub+zip');
      }

      // Verify folders exist
      expect(zip.folder('META-INF')).not.toBeNull();
      expect(zip.folder('OEBPS')).not.toBeNull();
    });
  });
});

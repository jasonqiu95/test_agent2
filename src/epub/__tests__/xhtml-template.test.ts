/**
 * Tests for XHTML Template Structure for EPUB 3
 */

import {
  buildXhtmlDocument,
  createXhtmlPage,
  createChapterDocument,
  createCoverPage,
  createTitlePage,
  validateXhtmlStructure,
  generateUniqueId,
  resetIdCounter,
  escapeXhtml,
  createNamespaceAttr,
  EPUB_NAMESPACES,
  EPUB_TYPES,
  XHTML_DOCTYPE,
  XML_DECLARATION,
} from '../xhtml-template';

describe('XHTML Template for EPUB 3', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('Constants', () => {
    it('should have correct EPUB namespaces', () => {
      expect(EPUB_NAMESPACES.XHTML).toBe('http://www.w3.org/1999/xhtml');
      expect(EPUB_NAMESPACES.EPUB).toBe('http://www.idpf.org/2007/ops');
      expect(EPUB_NAMESPACES.OPS).toBe('http://www.idpf.org/2007/ops');
    });

    it('should have EPUB type constants', () => {
      expect(EPUB_TYPES.CHAPTER).toBe('chapter');
      expect(EPUB_TYPES.COVER).toBe('cover');
      expect(EPUB_TYPES.TITLE_PAGE).toBe('titlepage');
    });

    it('should have correct DOCTYPE', () => {
      expect(XHTML_DOCTYPE).toBe('<!DOCTYPE html>');
    });

    it('should have correct XML declaration', () => {
      expect(XML_DECLARATION).toBe('<?xml version="1.0" encoding="UTF-8"?>');
    });
  });

  describe('generateUniqueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      expect(id1).not.toBe(id2);
    });

    it('should use custom prefix', () => {
      const id = generateUniqueId('chapter');
      expect(id).toContain('chapter-');
    });

    it('should increment counter', () => {
      resetIdCounter();
      const id1 = generateUniqueId('test');
      const id2 = generateUniqueId('test');
      expect(id1).toContain('-1');
      expect(id2).toContain('-2');
    });
  });

  describe('escapeXhtml', () => {
    it('should escape special characters', () => {
      expect(escapeXhtml('&')).toBe('&amp;');
      expect(escapeXhtml('<')).toBe('&lt;');
      expect(escapeXhtml('>')).toBe('&gt;');
      expect(escapeXhtml('"')).toBe('&quot;');
      expect(escapeXhtml("'")).toBe('&apos;');
    });

    it('should escape multiple characters', () => {
      const input = '<tag attr="value">text & more</tag>';
      const expected = '&lt;tag attr=&quot;value&quot;&gt;text &amp; more&lt;/tag&gt;';
      expect(escapeXhtml(input)).toBe(expected);
    });
  });

  describe('createNamespaceAttr', () => {
    it('should create namespace attribute', () => {
      const attr = createNamespaceAttr('epub', 'http://www.idpf.org/2007/ops');
      expect(attr).toBe('xmlns:epub="http://www.idpf.org/2007/ops"');
    });
  });

  describe('buildXhtmlDocument', () => {
    it('should build basic XHTML document', () => {
      const doc = buildXhtmlDocument({
        title: 'Test Page',
        bodyContent: '<p>Test content</p>',
      });

      expect(doc).toContain(XML_DECLARATION);
      expect(doc).toContain(XHTML_DOCTYPE);
      expect(doc).toContain('<html');
      expect(doc).toContain('xmlns="http://www.w3.org/1999/xhtml"');
      expect(doc).toContain('xmlns:epub="http://www.idpf.org/2007/ops"');
      expect(doc).toContain('<title>Test Page</title>');
      expect(doc).toContain('<p>Test content</p>');
    });

    it('should include stylesheets', () => {
      const doc = buildXhtmlDocument({
        title: 'Test Page',
        stylesheets: ['styles/main.css', 'styles/chapter.css'],
        bodyContent: '<p>Test</p>',
      });

      expect(doc).toContain('<link rel="stylesheet" type="text/css" href="styles/main.css" />');
      expect(doc).toContain('<link rel="stylesheet" type="text/css" href="styles/chapter.css" />');
    });

    it('should include custom language', () => {
      const doc = buildXhtmlDocument({
        title: 'Test Page',
        lang: 'fr',
        bodyContent: '<p>Test</p>',
      });

      expect(doc).toContain('xml:lang="fr"');
      expect(doc).toContain('lang="fr"');
    });

    it('should include epub:type attribute', () => {
      const doc = buildXhtmlDocument({
        title: 'Chapter One',
        epubType: 'chapter',
        bodyContent: '<p>Chapter content</p>',
      });

      expect(doc).toContain('epub:type="chapter"');
    });

    it('should include body attributes', () => {
      const doc = buildXhtmlDocument({
        title: 'Test Page',
        bodyContent: '<p>Test</p>',
        bodyAttributes: { class: 'chapter-body', 'data-id': '123' },
      });

      expect(doc).toContain('class="chapter-body"');
      expect(doc).toContain('data-id="123"');
    });

    it('should support RTL direction', () => {
      const doc = buildXhtmlDocument({
        title: 'Test Page',
        dir: 'rtl',
        bodyContent: '<p>Test</p>',
      });

      expect(doc).toContain('dir="rtl"');
    });

    it('should escape special characters in title', () => {
      const doc = buildXhtmlDocument({
        title: 'Test & <Title>',
        bodyContent: '<p>Test</p>',
      });

      expect(doc).toContain('<title>Test &amp; &lt;Title&gt;</title>');
    });
  });

  describe('createXhtmlPage', () => {
    it('should create a simple XHTML page', () => {
      const page = createXhtmlPage('My Page', '<p>Content here</p>');

      expect(page).toContain('<title>My Page</title>');
      expect(page).toContain('<p>Content here</p>');
      expect(page).toContain(XML_DECLARATION);
      expect(page).toContain(XHTML_DOCTYPE);
    });

    it('should include stylesheets', () => {
      const page = createXhtmlPage('My Page', '<p>Content</p>', ['style.css']);

      expect(page).toContain('<link rel="stylesheet" type="text/css" href="style.css" />');
    });
  });

  describe('createChapterDocument', () => {
    it('should create a chapter document', () => {
      const chapter = createChapterDocument('Chapter 1', '<p>Chapter content</p>');

      expect(chapter).toContain('<title>Chapter 1</title>');
      expect(chapter).toContain('epub:type="chapter"');
      expect(chapter).toContain('<section epub:type="chapter"');
      expect(chapter).toContain('<h1>Chapter 1</h1>');
      expect(chapter).toContain('<p>Chapter content</p>');
    });

    it('should include chapter ID', () => {
      const chapter = createChapterDocument(
        'Chapter 1',
        '<p>Content</p>',
        'chapter-1'
      );

      expect(chapter).toContain('id="chapter-1"');
    });

    it('should include stylesheets', () => {
      const chapter = createChapterDocument(
        'Chapter 1',
        '<p>Content</p>',
        undefined,
        ['chapter.css']
      );

      expect(chapter).toContain('<link rel="stylesheet" type="text/css" href="chapter.css" />');
    });
  });

  describe('createCoverPage', () => {
    it('should create a cover page', () => {
      const cover = createCoverPage('images/cover.jpg', 'Book Cover');

      expect(cover).toContain('<title>Cover</title>');
      expect(cover).toContain('epub:type="cover"');
      expect(cover).toContain('id="cover-image"');
      expect(cover).toContain('src="images/cover.jpg"');
      expect(cover).toContain('alt="Book Cover"');
    });

    it('should use default alt text', () => {
      const cover = createCoverPage('images/cover.jpg');

      expect(cover).toContain('alt="Cover"');
    });

    it('should escape special characters in paths', () => {
      const cover = createCoverPage('images/cover & test.jpg', 'Test & Cover');

      expect(cover).toContain('src="images/cover &amp; test.jpg"');
      expect(cover).toContain('alt="Test &amp; Cover"');
    });
  });

  describe('createTitlePage', () => {
    it('should create a title page', () => {
      const titlePage = createTitlePage('My Book', 'John Doe');

      expect(titlePage).toContain('<title>My Book</title>');
      expect(titlePage).toContain('epub:type="titlepage"');
      expect(titlePage).toContain('id="title-page"');
      expect(titlePage).toContain('<h1>My Book</h1>');
      expect(titlePage).toContain('class="author"');
      expect(titlePage).toContain('John Doe');
    });

    it('should include publisher', () => {
      const titlePage = createTitlePage('My Book', 'John Doe', 'Great Publisher');

      expect(titlePage).toContain('class="publisher"');
      expect(titlePage).toContain('Great Publisher');
    });

    it('should escape special characters', () => {
      const titlePage = createTitlePage('Book & Title', 'John & Jane', 'Publisher & Co');

      expect(titlePage).toContain('<h1>Book &amp; Title</h1>');
      expect(titlePage).toContain('John &amp; Jane');
      expect(titlePage).toContain('Publisher &amp; Co');
    });
  });

  describe('validateXhtmlStructure', () => {
    it('should validate correct XHTML', () => {
      const validDoc = buildXhtmlDocument({
        title: 'Valid Doc',
        bodyContent: '<p>Content</p>',
      });

      const result = validateXhtmlStructure(validDoc);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing XML declaration', () => {
      const invalidDoc = '<!DOCTYPE html><html><head></head><body></body></html>';
      const result = validateXhtmlStructure(invalidDoc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing XML declaration');
    });

    it('should detect missing DOCTYPE', () => {
      const invalidDoc = '<?xml version="1.0"?><html><head></head><body></body></html>';
      const result = validateXhtmlStructure(invalidDoc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing XHTML DOCTYPE');
    });

    it('should detect missing namespace', () => {
      const invalidDoc = '<?xml version="1.0"?><!DOCTYPE html><html><head></head><body></body></html>';
      const result = validateXhtmlStructure(invalidDoc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing XHTML namespace');
    });

    it('should detect missing elements', () => {
      const invalidDoc = '<?xml version="1.0"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"></html>';
      const result = validateXhtmlStructure(invalidDoc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing head element');
      expect(result.errors).toContain('Missing body element');
    });

    it('should detect missing charset', () => {
      const invalidDoc = `<?xml version="1.0"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml">
        <head><title>Test</title></head><body></body></html>`;
      const result = validateXhtmlStructure(invalidDoc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing UTF-8 charset declaration');
    });

    it('should detect missing title', () => {
      const invalidDoc = `<?xml version="1.0"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml">
        <head><meta charset="UTF-8" /></head><body></body></html>`;
      const result = validateXhtmlStructure(invalidDoc);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing title element');
    });
  });
});

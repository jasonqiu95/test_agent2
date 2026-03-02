/**
 * Tests for Matter Converter
 */

import {
  convertTextBlock,
  convertTextBlocks,
  convertFrontMatter,
  convertBackMatter,
  convertMatterElement,
  convertTitlePage,
  convertCopyrightPage,
  convertDedication,
  convertAboutAuthor,
  convertAlsoBy,
  validateMatterElement,
  getMatterFilename,
  isFrontMatter,
  isBackMatter,
  type MatterConverterOptions,
} from '../matter-converter';
import { Element, ElementType } from '../../types/element';
import { TextBlock } from '../../types/textBlock';

describe('Matter Converter', () => {
  // ============================================================================
  // TextBlock Conversion Tests
  // ============================================================================

  describe('convertTextBlock', () => {
    it('should convert a paragraph block', () => {
      const block: TextBlock = {
        id: 'p1',
        content: 'This is a test paragraph.',
        blockType: 'paragraph',
      };

      const result = convertTextBlock(block);
      expect(result.html).toContain('<p>');
      expect(result.html).toContain('This is a test paragraph.');
      expect(result.html).toContain('</p>');
    });

    it('should convert a heading block', () => {
      const block: TextBlock = {
        id: 'h1',
        content: 'Chapter Title',
        blockType: 'heading',
        level: 1,
      };

      const result = convertTextBlock(block);
      expect(result.html).toContain('<h1>');
      expect(result.html).toContain('Chapter Title');
      expect(result.html).toContain('</h1>');
    });

    it('should handle block with alignment', () => {
      const block: TextBlock = {
        id: 'p2',
        content: 'Centered text',
        blockType: 'paragraph',
        style: {
          name: 'centered',
          type: 'inline',
          alignment: 'center',
        },
      };

      const result = convertTextBlock(block, { preserveClasses: true });
      expect(result.html).toContain('text-align: center');
    });

    it('should convert a blockquote', () => {
      const block: TextBlock = {
        id: 'bq1',
        content: 'A famous quote.',
        blockType: 'paragraph',
      };

      const result = convertTextBlock(block);
      expect(result.html).toContain('A famous quote.');
    });
  });

  describe('convertTextBlocks', () => {
    it('should convert multiple text blocks', () => {
      const blocks: TextBlock[] = [
        {
          id: 'h1',
          content: 'Title',
          blockType: 'heading',
          level: 1,
        },
        {
          id: 'p1',
          content: 'First paragraph.',
          blockType: 'paragraph',
        },
        {
          id: 'p2',
          content: 'Second paragraph.',
          blockType: 'paragraph',
        },
      ];

      const result = convertTextBlocks(blocks);
      expect(result.html).toContain('<h1>Title</h1>');
      expect(result.html).toContain('First paragraph.');
      expect(result.html).toContain('Second paragraph.');
      expect(result.metadata?.itemCount).toBe(3);
    });
  });

  // ============================================================================
  // Front Matter Tests
  // ============================================================================

  describe('convertTitlePage', () => {
    it('should create a title page with all fields', () => {
      const xhtml = convertTitlePage(
        'My Book Title',
        'John Doe',
        'A Subtitle',
        'My Publisher'
      );

      expect(xhtml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xhtml).toContain('<!DOCTYPE html>');
      expect(xhtml).toContain('epub:type="titlepage"');
      expect(xhtml).toContain('My Book Title');
      expect(xhtml).toContain('John Doe');
      expect(xhtml).toContain('A Subtitle');
      expect(xhtml).toContain('My Publisher');
    });

    it('should create a title page without optional fields', () => {
      const xhtml = convertTitlePage('My Book Title', 'John Doe');

      expect(xhtml).toContain('My Book Title');
      expect(xhtml).toContain('John Doe');
      expect(xhtml).not.toContain('subtitle');
      expect(xhtml).not.toContain('publisher');
    });
  });

  describe('convertCopyrightPage', () => {
    it('should create a copyright page with all fields', () => {
      const xhtml = convertCopyrightPage('2026', 'John Doe', {
        publisher: 'My Publisher',
        isbn: '978-0-00-000000-0',
        edition: 'First Edition',
      });

      expect(xhtml).toContain('Copyright © 2026 by John Doe');
      expect(xhtml).toContain('My Publisher');
      expect(xhtml).toContain('978-0-00-000000-0');
      expect(xhtml).toContain('First Edition');
      expect(xhtml).toContain('epub:type="copyright-page"');
    });

    it('should use default rights statement', () => {
      const xhtml = convertCopyrightPage('2026', 'John Doe');

      expect(xhtml).toContain('All rights reserved');
    });

    it('should use custom rights statement', () => {
      const xhtml = convertCopyrightPage('2026', 'John Doe', {
        rightsStatement: 'Custom rights statement.',
      });

      expect(xhtml).toContain('Custom rights statement.');
      expect(xhtml).not.toContain('All rights reserved');
    });
  });

  describe('convertDedication', () => {
    it('should create a dedication page', () => {
      const xhtml = convertDedication('For my family and friends');

      expect(xhtml).toContain('epub:type="dedication"');
      expect(xhtml).toContain('For my family and friends');
      expect(xhtml).toContain('<title>Dedication</title>');
    });
  });

  describe('convertFrontMatter', () => {
    it('should convert a front matter element', () => {
      const element: Element = {
        id: 'preface',
        type: 'preface',
        matter: 'front',
        title: 'Preface',
        content: [
          {
            id: 'h1',
            content: 'Preface',
            blockType: 'heading',
            level: 1,
          },
          {
            id: 'p1',
            content: 'This is the preface content.',
            blockType: 'paragraph',
          },
        ],
      };

      const result = convertFrontMatter(element);

      expect(result.xhtml).toContain('epub:type="preface"');
      expect(result.xhtml).toContain('Preface');
      expect(result.xhtml).toContain('This is the preface content.');
      expect(result.elementType).toBe('preface');
      expect(result.matterType).toBe('front');
    });

    it('should throw error for non-front matter', () => {
      const element: Element = {
        id: 'epilogue',
        type: 'epilogue',
        matter: 'back',
        title: 'Epilogue',
        content: [],
      };

      expect(() => convertFrontMatter(element)).toThrow('not front matter');
    });
  });

  // ============================================================================
  // Back Matter Tests
  // ============================================================================

  describe('convertAboutAuthor', () => {
    it('should create an about author page with website', () => {
      const xhtml = convertAboutAuthor(
        'Jane Smith',
        'Jane Smith is an award-winning author.',
        'www.janesmith.com'
      );

      expect(xhtml).toContain('About the Author');
      expect(xhtml).toContain('Jane Smith is an award-winning author.');
      expect(xhtml).toContain('www.janesmith.com');
      expect(xhtml).toContain('epub:type="author"');
    });

    it('should create an about author page without website', () => {
      const xhtml = convertAboutAuthor(
        'Jane Smith',
        'Jane Smith is an award-winning author.'
      );

      expect(xhtml).toContain('Jane Smith is an award-winning author.');
      expect(xhtml).not.toContain('For more information');
    });
  });

  describe('convertAlsoBy', () => {
    it('should create an also by page', () => {
      const books = ['Book One', 'Book Two', 'Book Three'];
      const xhtml = convertAlsoBy('Jane Smith', books);

      expect(xhtml).toContain('Also by Jane Smith');
      expect(xhtml).toContain('Book One');
      expect(xhtml).toContain('Book Two');
      expect(xhtml).toContain('Book Three');
      expect(xhtml).toContain('<ul');
      expect(xhtml).toContain('epub:type="other-credits"');
    });
  });

  describe('convertBackMatter', () => {
    it('should convert a back matter element', () => {
      const element: Element = {
        id: 'epilogue',
        type: 'epilogue',
        matter: 'back',
        title: 'Epilogue',
        content: [
          {
            id: 'h1',
            content: 'Epilogue',
            blockType: 'heading',
            level: 1,
          },
          {
            id: 'p1',
            content: 'This is the epilogue content.',
            blockType: 'paragraph',
          },
        ],
      };

      const result = convertBackMatter(element);

      expect(result.xhtml).toContain('epub:type="epilogue"');
      expect(result.xhtml).toContain('Epilogue');
      expect(result.xhtml).toContain('This is the epilogue content.');
      expect(result.elementType).toBe('epilogue');
      expect(result.matterType).toBe('back');
    });

    it('should throw error for non-back matter', () => {
      const element: Element = {
        id: 'preface',
        type: 'preface',
        matter: 'front',
        title: 'Preface',
        content: [],
      };

      expect(() => convertBackMatter(element)).toThrow('not back matter');
    });
  });

  // ============================================================================
  // General Matter Conversion Tests
  // ============================================================================

  describe('convertMatterElement', () => {
    it('should convert any matter element', () => {
      const element: Element = {
        id: 'intro',
        type: 'introduction',
        matter: 'front',
        title: 'Introduction',
        content: [
          {
            id: 'p1',
            content: 'Introduction content here.',
            blockType: 'paragraph',
          },
        ],
      };

      const result = convertMatterElement(element);

      expect(result.xhtml).toContain('epub:type="introduction"');
      expect(result.xhtml).toContain('Introduction');
      expect(result.metadata?.blockCount).toBe(1);
    });

    it('should apply custom options', () => {
      const element: Element = {
        id: 'ack',
        type: 'acknowledgments',
        matter: 'front',
        title: 'Acknowledgments',
        content: [
          {
            id: 'p1',
            content: 'Thanks to everyone.',
            blockType: 'paragraph',
          },
        ],
      };

      const options: MatterConverterOptions = {
        stylesheets: ['styles/matter.css'],
        lang: 'en-US',
        sectionClass: 'custom-class',
      };

      const result = convertMatterElement(element, options);

      expect(result.xhtml).toContain('styles/matter.css');
      expect(result.xhtml).toContain('lang="en-US"');
      expect(result.xhtml).toContain('class="custom-class"');
    });

    it('should detect images in content', () => {
      const element: Element = {
        id: 'title',
        type: 'title-page',
        matter: 'front',
        title: 'Title Page',
        content: [
          {
            id: 'p1',
            content: 'Title',
            blockType: 'paragraph',
            richText: {
              plainText: 'Title',
              segments: [
                {
                  type: 'image',
                  src: 'images/logo.jpg',
                  alt: 'Logo',
                },
              ],
            },
          },
        ],
      };

      const result = convertMatterElement(element);

      expect(result.metadata?.hasImages).toBe(true);
    });

    it('should detect links in content', () => {
      const element: Element = {
        id: 'about',
        type: 'about-author',
        matter: 'back',
        title: 'About',
        content: [
          {
            id: 'p1',
            content: 'Visit website',
            blockType: 'paragraph',
            richText: {
              plainText: 'Visit website',
              segments: [
                {
                  type: 'link',
                  text: 'Visit website',
                  url: 'https://example.com',
                },
              ],
            },
          },
        ],
      };

      const result = convertMatterElement(element);

      expect(result.metadata?.hasLinks).toBe(true);
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  describe('validateMatterElement', () => {
    it('should validate a correct element', () => {
      const element: Element = {
        id: 'preface',
        type: 'preface',
        matter: 'front',
        title: 'Preface',
        content: [
          {
            id: 'p1',
            content: 'Content',
            blockType: 'paragraph',
          },
        ],
      };

      const result = validateMatterElement(element);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing type', () => {
      const element = {
        id: 'test',
        matter: 'front',
        title: 'Test',
        content: [],
      } as Element;

      const result = validateMatterElement(element);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Element type is required');
    });

    it('should detect missing title', () => {
      const element = {
        id: 'test',
        type: 'preface',
        matter: 'front',
        content: [],
      } as Element;

      const result = validateMatterElement(element);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Element title is required');
    });

    it('should detect empty content', () => {
      const element: Element = {
        id: 'test',
        type: 'preface',
        matter: 'front',
        title: 'Test',
        content: [],
      };

      const result = validateMatterElement(element);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Element must have content');
    });

    it('should detect matter type mismatch for front matter', () => {
      const element: Element = {
        id: 'preface',
        type: 'preface',
        matter: 'back',
        title: 'Preface',
        content: [
          {
            id: 'p1',
            content: 'Content',
            blockType: 'paragraph',
          },
        ],
      };

      const result = validateMatterElement(element);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('should have matter type'))).toBe(true);
    });

    it('should detect invalid heading level', () => {
      const element: Element = {
        id: 'test',
        type: 'preface',
        matter: 'front',
        title: 'Test',
        content: [
          {
            id: 'h1',
            content: 'Heading',
            blockType: 'heading',
            level: 10,
          },
        ],
      };

      const result = validateMatterElement(element);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid heading level'))).toBe(true);
    });
  });

  // ============================================================================
  // Utility Tests
  // ============================================================================

  describe('getMatterFilename', () => {
    it('should generate filename from title', () => {
      const element: Element = {
        id: 'preface',
        type: 'preface',
        matter: 'front',
        title: 'Preface',
        content: [],
      };

      const filename = getMatterFilename(element);

      expect(filename).toBe('preface.xhtml');
    });

    it('should sanitize special characters', () => {
      const element: Element = {
        id: 'about',
        type: 'about-author',
        matter: 'back',
        title: 'About the Author!',
        content: [],
      };

      const filename = getMatterFilename(element);

      expect(filename).toBe('about-the-author.xhtml');
    });

    it('should handle multiple spaces', () => {
      const element: Element = {
        id: 'title',
        type: 'title-page',
        matter: 'front',
        title: 'Title   Page   Here',
        content: [],
      };

      const filename = getMatterFilename(element);

      expect(filename).toBe('title-page-here.xhtml');
    });
  });

  describe('isFrontMatter', () => {
    it('should identify front matter types', () => {
      expect(isFrontMatter('title-page')).toBe(true);
      expect(isFrontMatter('copyright')).toBe(true);
      expect(isFrontMatter('dedication')).toBe(true);
      expect(isFrontMatter('preface')).toBe(true);
      expect(isFrontMatter('prologue')).toBe(true);
    });

    it('should not identify back matter as front matter', () => {
      expect(isFrontMatter('epilogue')).toBe(false);
      expect(isFrontMatter('about-author')).toBe(false);
      expect(isFrontMatter('also-by')).toBe(false);
    });
  });

  describe('isBackMatter', () => {
    it('should identify back matter types', () => {
      expect(isBackMatter('epilogue')).toBe(true);
      expect(isBackMatter('afterword')).toBe(true);
      expect(isBackMatter('about-author')).toBe(true);
      expect(isBackMatter('also-by')).toBe(true);
      expect(isBackMatter('appendix')).toBe(true);
    });

    it('should not identify front matter as back matter', () => {
      expect(isBackMatter('title-page')).toBe(false);
      expect(isBackMatter('copyright')).toBe(false);
      expect(isBackMatter('dedication')).toBe(false);
    });
  });
});

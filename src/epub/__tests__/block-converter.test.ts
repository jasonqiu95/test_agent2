/**
 * Block Element Converter Tests
 */

import {
  convertParagraph,
  convertHeading,
  convertBlockquote,
  convertUnorderedList,
  convertOrderedList,
  convertListItem,
  convertNestedList,
  convertVerse,
  convertVerseWithStanzas,
  convertBlockElements,
  validateBlockElement,
  extractTextContent,
} from '../block-converter';

describe('Block Element Converter', () => {
  describe('convertParagraph', () => {
    it('should convert simple paragraph', () => {
      const result = convertParagraph('This is a paragraph.');
      expect(result.html).toBe('<p>This is a paragraph.</p>');
      expect(result.metadata?.elementType).toBe('paragraph');
    });

    it('should handle paragraph with attributes', () => {
      const result = convertParagraph(
        'Paragraph with class.',
        { class: 'intro', id: 'p1' },
        { preserveClasses: true, preserveIds: true }
      );
      expect(result.html).toContain('class="intro"');
      expect(result.html).toContain('id="p1"');
    });

    it('should sanitize HTML when option is enabled', () => {
      const result = convertParagraph('<script>alert("xss")</script>', {}, { sanitizeHtml: true });
      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).not.toContain('<script>');
    });

    it('should handle empty content', () => {
      const result = convertParagraph('');
      expect(result.html).toBe('<p></p>');
    });
  });

  describe('convertHeading', () => {
    it('should convert h1', () => {
      const result = convertHeading(1, 'Chapter One');
      expect(result.html).toBe('<h1>Chapter One</h1>');
      expect(result.metadata?.elementType).toBe('heading-1');
      expect(result.metadata?.nestingLevel).toBe(1);
    });

    it('should convert h2 through h6', () => {
      for (let level = 2; level <= 6; level++) {
        const result = convertHeading(level as 1 | 2 | 3 | 4 | 5 | 6, `Heading ${level}`);
        expect(result.html).toBe(`<h${level}>Heading ${level}</h${level}>`);
        expect(result.metadata?.nestingLevel).toBe(level);
      }
    });

    it('should handle heading with attributes', () => {
      const result = convertHeading(
        2,
        'Section Title',
        { class: 'section-heading', id: 'section-1' },
        { preserveClasses: true, preserveIds: true }
      );
      expect(result.html).toContain('class="section-heading"');
      expect(result.html).toContain('id="section-1"');
    });

    it('should return warning for invalid level', () => {
      const result = convertHeading(7 as any, 'Invalid');
      expect(result.html).toBe('');
      expect(result.warnings).toContain('Invalid heading level: 7. Must be between 1 and 6.');
    });
  });

  describe('convertBlockquote', () => {
    it('should convert blockquote', () => {
      const result = convertBlockquote('This is a quote.');
      expect(result.html).toBe('<blockquote>This is a quote.</blockquote>');
      expect(result.metadata?.elementType).toBe('blockquote');
    });

    it('should handle blockquote with attributes', () => {
      const result = convertBlockquote(
        'Quote text',
        { class: 'pullquote' },
        { preserveClasses: true }
      );
      expect(result.html).toContain('class="pullquote"');
    });

    it('should handle nested HTML in blockquote', () => {
      const result = convertBlockquote('<p>Nested paragraph</p>');
      expect(result.html).toBe('<blockquote><p>Nested paragraph</p></blockquote>');
    });
  });

  describe('convertUnorderedList', () => {
    it('should convert unordered list', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const result = convertUnorderedList(items);
      expect(result.html).toContain('<ul>');
      expect(result.html).toContain('<li>Item 1</li>');
      expect(result.html).toContain('<li>Item 2</li>');
      expect(result.html).toContain('<li>Item 3</li>');
      expect(result.html).toContain('</ul>');
      expect(result.metadata?.itemCount).toBe(3);
    });

    it('should handle empty list', () => {
      const result = convertUnorderedList([]);
      expect(result.html).toBe('');
      expect(result.warnings).toContain('Empty list provided');
    });

    it('should handle list with attributes', () => {
      const result = convertUnorderedList(
        ['Item 1'],
        { class: 'feature-list' },
        { preserveClasses: true }
      );
      expect(result.html).toContain('class="feature-list"');
    });

    it('should sanitize list items', () => {
      const result = convertUnorderedList(['<script>alert("xss")</script>'], {}, { sanitizeHtml: true });
      expect(result.html).toContain('&lt;script&gt;');
    });
  });

  describe('convertOrderedList', () => {
    it('should convert ordered list', () => {
      const items = ['First', 'Second', 'Third'];
      const result = convertOrderedList(items);
      expect(result.html).toContain('<ol>');
      expect(result.html).toContain('<li>First</li>');
      expect(result.html).toContain('<li>Second</li>');
      expect(result.html).toContain('<li>Third</li>');
      expect(result.html).toContain('</ol>');
      expect(result.metadata?.itemCount).toBe(3);
    });

    it('should handle empty list', () => {
      const result = convertOrderedList([]);
      expect(result.html).toBe('');
      expect(result.warnings).toContain('Empty list provided');
    });

    it('should handle list with attributes', () => {
      const result = convertOrderedList(
        ['Step 1'],
        { class: 'instructions', id: 'steps' },
        { preserveClasses: true, preserveIds: true }
      );
      expect(result.html).toContain('class="instructions"');
      expect(result.html).toContain('id="steps"');
    });
  });

  describe('convertListItem', () => {
    it('should convert list item', () => {
      const result = convertListItem('Item content');
      expect(result.html).toBe('<li>Item content</li>');
    });

    it('should handle list item with nested list', () => {
      const nested = '<ul><li>Nested item</li></ul>';
      const result = convertListItem('Parent item', {}, {}, nested);
      expect(result.html).toContain('<li>Parent item');
      expect(result.html).toContain('<ul><li>Nested item</li></ul>');
      expect(result.html).toContain('</li>');
    });

    it('should handle list item with attributes', () => {
      const result = convertListItem(
        'Item',
        { class: 'special' },
        { preserveClasses: true }
      );
      expect(result.html).toContain('class="special"');
    });
  });

  describe('convertNestedList', () => {
    it('should convert simple nested list', () => {
      const items = [
        { content: 'Item 1' },
        {
          content: 'Item 2',
          children: [
            { content: 'Nested 2.1' },
            { content: 'Nested 2.2' },
          ],
        },
        { content: 'Item 3' },
      ];

      const result = convertNestedList(items);
      expect(result.html).toContain('<ul>');
      expect(result.html).toContain('<li>Item 1</li>');
      expect(result.html).toContain('<li>Item 2');
      expect(result.html).toContain('<li>Nested 2.1</li>');
      expect(result.html).toContain('<li>Nested 2.2</li>');
      expect(result.metadata?.itemCount).toBe(3);
    });

    it('should handle ordered nested list', () => {
      const items = [
        { content: 'Step 1' },
        {
          content: 'Step 2',
          children: [{ content: 'Sub-step 2.1' }],
        },
      ];

      const result = convertNestedList(items, true);
      expect(result.html).toContain('<ol>');
      expect(result.html).toContain('</ol>');
    });

    it('should handle mixed ordered and unordered', () => {
      const items = [
        {
          content: 'Item 1',
          children: [{ content: 'Nested' }],
          ordered: true,
        },
      ];

      const result = convertNestedList(items, false);
      expect(result.html).toContain('<ul>');
      expect(result.html).toContain('<ol>');
    });

    it('should prevent excessive nesting', () => {
      const deeplyNested: any = { content: 'Level 0' };
      let current = deeplyNested;

      // Create 15 levels of nesting (exceeds max of 10)
      for (let i = 1; i <= 15; i++) {
        current.children = [{ content: `Level ${i}` }];
        current = current.children[0];
      }

      const result = convertNestedList([deeplyNested]);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes('Maximum nesting depth'))).toBe(true);
    });

    it('should handle empty nested list', () => {
      const result = convertNestedList([]);
      expect(result.html).toBe('');
      expect(result.warnings).toContain('Empty list provided');
    });
  });

  describe('convertVerse', () => {
    it('should convert verse lines', () => {
      const lines = [
        'Roses are red,',
        'Violets are blue,',
        'Sugar is sweet,',
        'And so are you.',
      ];

      const result = convertVerse(lines);
      expect(result.html).toContain('<div');
      expect(result.html).toContain('class="verse"');
      expect(result.html).toContain('Roses are red,<br/>');
      expect(result.html).toContain('Violets are blue,<br/>');
      expect(result.metadata?.itemCount).toBe(4);
    });

    it('should handle empty lines in verse', () => {
      const lines = ['Line 1', '', 'Line 3'];
      const result = convertVerse(lines);
      expect(result.html).toContain('Line 1<br/>');
      expect(result.html).toContain('&#160;<br/>'); // Non-breaking space for empty line
      expect(result.html).toContain('Line 3<br/>');
    });

    it('should preserve verse class while adding custom class', () => {
      const lines = ['Line 1'];
      const result = convertVerse(lines, { class: 'poem' }, { preserveClasses: true });
      expect(result.html).toContain('class="poem verse"');
    });

    it('should handle empty verse', () => {
      const result = convertVerse([]);
      expect(result.html).toBe('');
      expect(result.warnings).toContain('No verse lines provided');
    });

    it('should handle verse with attributes', () => {
      const lines = ['Line 1'];
      const result = convertVerse(
        lines,
        { id: 'verse-1', class: 'epic' },
        { preserveClasses: true, preserveIds: true }
      );
      expect(result.html).toContain('id="verse-1"');
      expect(result.html).toContain('class="epic verse"');
    });
  });

  describe('convertVerseWithStanzas', () => {
    it('should convert verse with stanzas', () => {
      const stanzas = [
        ['Line 1 of stanza 1', 'Line 2 of stanza 1'],
        ['Line 1 of stanza 2', 'Line 2 of stanza 2'],
      ];

      const result = convertVerseWithStanzas(stanzas);
      expect(result.html).toContain('<div class="verse"');
      expect(result.html).toContain('<div class="stanza">');
      expect(result.html).toContain('Line 1 of stanza 1<br/>');
      expect(result.html).toContain('Line 1 of stanza 2<br/>');
      expect(result.metadata?.itemCount).toBe(4); // Total lines
    });

    it('should handle empty stanzas', () => {
      const result = convertVerseWithStanzas([]);
      expect(result.html).toBe('');
      expect(result.warnings).toContain('No stanzas provided');
    });

    it('should handle empty lines in stanzas', () => {
      const stanzas = [['Line 1', '', 'Line 3']];
      const result = convertVerseWithStanzas(stanzas);
      expect(result.html).toContain('&#160;');
    });
  });

  describe('convertBlockElements', () => {
    it('should batch convert multiple elements', () => {
      const elements = [
        { type: 'h1' as const, content: 'Title' },
        { type: 'p' as const, content: 'First paragraph.' },
        { type: 'p' as const, content: 'Second paragraph.' },
        { type: 'ul' as const, content: ['Item 1', 'Item 2'] },
      ];

      const result = convertBlockElements(elements);
      expect(result.html).toContain('<h1>Title</h1>');
      expect(result.html).toContain('<p>First paragraph.</p>');
      expect(result.html).toContain('<p>Second paragraph.</p>');
      expect(result.html).toContain('<ul>');
      expect(result.metadata?.itemCount).toBe(4);
    });

    it('should handle all heading levels', () => {
      const elements = [
        { type: 'h1' as const, content: 'H1' },
        { type: 'h2' as const, content: 'H2' },
        { type: 'h3' as const, content: 'H3' },
        { type: 'h4' as const, content: 'H4' },
        { type: 'h5' as const, content: 'H5' },
        { type: 'h6' as const, content: 'H6' },
      ];

      const result = convertBlockElements(elements);
      expect(result.html).toContain('<h1>H1</h1>');
      expect(result.html).toContain('<h2>H2</h2>');
      expect(result.html).toContain('<h3>H3</h3>');
      expect(result.html).toContain('<h4>H4</h4>');
      expect(result.html).toContain('<h5>H5</h5>');
      expect(result.html).toContain('<h6>H6</h6>');
    });

    it('should handle blockquotes and lists', () => {
      const elements = [
        { type: 'blockquote' as const, content: 'A quote' },
        { type: 'ol' as const, content: ['First', 'Second'] },
        { type: 'verse' as const, content: ['Verse line 1', 'Verse line 2'] },
      ];

      const result = convertBlockElements(elements);
      expect(result.html).toContain('<blockquote>A quote</blockquote>');
      expect(result.html).toContain('<ol>');
      expect(result.html).toContain('class="verse"');
    });

    it('should collect warnings from all elements', () => {
      const elements = [
        { type: 'ul' as const, content: [] }, // Empty list
        { type: 'ol' as const, content: [] }, // Empty list
      ];

      const result = convertBlockElements(elements);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });

    it('should handle unknown element types', () => {
      const elements = [{ type: 'unknown' as any, content: 'test' }];

      const result = convertBlockElements(elements);
      expect(result.warnings).toContain('Unknown element type: unknown');
    });
  });

  describe('validateBlockElement', () => {
    it('should validate correct HTML', () => {
      const html = '<p>Valid paragraph</p>';
      const result = validateBlockElement(html);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect mismatched tags', () => {
      const html = '<p>Unclosed paragraph';
      const result = validateBlockElement(html);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Mismatched'))).toBe(true);
    });

    it('should detect self-closing block elements', () => {
      const html = '<p/>';
      const result = validateBlockElement(html);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Self-closing'))).toBe(true);
    });

    it('should validate nested structures', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = validateBlockElement(html);
      expect(result.valid).toBe(true);
    });

    it('should validate complex nested structures', () => {
      const html = '<div><p>Paragraph</p><ul><li>Item</li></ul></div>';
      const result = validateBlockElement(html);
      expect(result.valid).toBe(true);
    });
  });

  describe('extractTextContent', () => {
    it('should extract text from HTML', () => {
      const html = '<p>This is <strong>bold</strong> text.</p>';
      const text = extractTextContent(html);
      expect(text).toBe('This is bold text.');
    });

    it('should handle HTML entities', () => {
      const html = '<p>Text with &lt;tags&gt; and &amp; symbols</p>';
      const text = extractTextContent(html);
      expect(text).toBe('Text with <tags> and & symbols');
    });

    it('should handle non-breaking spaces', () => {
      const html = '<p>Text&nbsp;with&nbsp;spaces</p>';
      const text = extractTextContent(html);
      expect(text).toBe('Text with spaces');
    });

    it('should handle complex HTML', () => {
      const html = '<div><h1>Title</h1><p>Paragraph</p><ul><li>Item</li></ul></div>';
      const text = extractTextContent(html);
      expect(text).toBe('TitleParagraphItem');
    });

    it('should handle empty HTML', () => {
      const html = '<p></p>';
      const text = extractTextContent(html);
      expect(text).toBe('');
    });

    it('should trim whitespace', () => {
      const html = '  <p>  Text  </p>  ';
      const text = extractTextContent(html);
      expect(text).toBe('Text');
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle complex nested structures', () => {
      const items = [
        {
          content: 'Chapter 1',
          children: [
            { content: 'Section 1.1' },
            {
              content: 'Section 1.2',
              children: [
                { content: 'Subsection 1.2.1' },
                { content: 'Subsection 1.2.2' },
              ],
            },
          ],
        },
      ];

      const result = convertNestedList(items, true);
      expect(result.html).toContain('<ol>');
      expect(result.html).toContain('Chapter 1');
      expect(result.html).toContain('Section 1.1');
      expect(result.html).toContain('Subsection 1.2.1');
      expect(validateBlockElement(result.html).valid).toBe(true);
    });

    it('should handle mixed content types', () => {
      const elements = [
        { type: 'h1' as const, content: 'Chapter Title' },
        { type: 'p' as const, content: 'Introduction paragraph.' },
        { type: 'blockquote' as const, content: 'A relevant quote.' },
        { type: 'p' as const, content: 'Continuation.' },
        { type: 'verse' as const, content: ['Verse line 1', 'Verse line 2'] },
        { type: 'ul' as const, content: ['Point 1', 'Point 2'] },
      ];

      const result = convertBlockElements(elements, {
        preserveClasses: true,
        preserveIds: true,
      });

      expect(result.html).toContain('<h1>');
      expect(result.html).toContain('<p>');
      expect(result.html).toContain('<blockquote>');
      expect(result.html).toContain('<ul>');
      expect(result.html).toContain('class="verse"');
      expect(validateBlockElement(result.html).valid).toBe(true);
    });

    it('should preserve attributes across conversion', () => {
      const result = convertParagraph(
        'Test',
        { id: 'p1', class: 'intro', style: 'color: red;' },
        { preserveClasses: true, preserveIds: true }
      );

      expect(result.html).toContain('id="p1"');
      expect(result.html).toContain('class="intro"');
      expect(result.html).toContain('style="color: red;"');
    });

    it('should handle custom attributes', () => {
      const result = convertParagraph(
        'Test',
        {},
        {
          customAttributes: {
            'data-chapter': '1',
            'data-section': 'intro',
          },
        }
      );

      expect(result.html).toContain('data-chapter="1"');
      expect(result.html).toContain('data-section="intro"');
    });
  });
});

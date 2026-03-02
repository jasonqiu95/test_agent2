/**
 * Format Converter Tests
 */

import { FormatConverter, convertDocxToInternalFormat } from '../formatConverter';
import type { StructuredDocument, Paragraph, TextRun, Break, Tab } from '../types';

describe('FormatConverter', () => {
  describe('convertToRichText', () => {
    it('should convert bold text', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Bold text',
                formatting: { bold: true }
              } as TextRun
            ],
            style: {},
            rawText: 'Bold text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 9 }
      };

      const result = await convertDocxToInternalFormat(document);
      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].content).toBe('Bold text');
      expect(result.blocks[0].metadata?.richText).toBeDefined();
    });

    it('should convert italic text', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Italic text',
                formatting: { italic: true }
              } as TextRun
            ],
            style: {},
            rawText: 'Italic text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 11 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText).toBeDefined();
      expect(richText![0].style?.italic).toBe(true);
    });

    it('should convert underlined text', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Underlined text',
                formatting: { underline: true }
              } as TextRun
            ],
            style: {},
            rawText: 'Underlined text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 15 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![0].style?.underline).toBe(true);
    });

    it('should convert strikethrough text', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Strikethrough text',
                formatting: { strikethrough: true }
              } as TextRun
            ],
            style: {},
            rawText: 'Strikethrough text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 18 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![0].style?.strikethrough).toBe(true);
    });

    it('should convert multiple formatting styles', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Bold and italic',
                formatting: { bold: true, italic: true }
              } as TextRun
            ],
            style: {},
            rawText: 'Bold and italic'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 3, characterCount: 15 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![0].style?.bold).toBe(true);
      expect(richText![0].style?.italic).toBe(true);
    });

    it('should convert text with color', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Colored text',
                formatting: { color: '#FF0000' }
              } as TextRun
            ],
            style: {},
            rawText: 'Colored text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 12 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![0].style?.color).toBe('#FF0000');
    });

    it('should convert text with highlight', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Highlighted text',
                formatting: { highlight: 'yellow' }
              } as TextRun
            ],
            style: {},
            rawText: 'Highlighted text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 16 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![0].style?.highlight).toBe('yellow');
    });

    it('should convert text with font size', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Large text',
                formatting: { fontSize: 24 }
              } as TextRun
            ],
            style: {},
            rawText: 'Large text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 10 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![0].style?.fontSize).toBe(24);
    });

    it('should convert text with font family', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Special font',
                formatting: { fontFamily: 'Arial' }
              } as TextRun
            ],
            style: {},
            rawText: 'Special font'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 12 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![0].style?.fontFamily).toBe('Arial');
    });

    it('should convert subscript text', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'H2O',
                formatting: { subscript: true }
              } as TextRun
            ],
            style: {},
            rawText: 'H2O'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 1, characterCount: 3 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![0].style?.subscript).toBe(true);
    });

    it('should convert superscript text', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'x^2',
                formatting: { superscript: true }
              } as TextRun
            ],
            style: {},
            rawText: 'x^2'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 1, characterCount: 3 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![0].style?.superscript).toBe(true);
    });

    it('should handle line breaks', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Line 1',
                formatting: {}
              } as TextRun,
              {
                type: 'break',
                breakType: 'line'
              } as Break,
              {
                type: 'text',
                text: 'Line 2',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: 'Line 1Line 2'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 4, characterCount: 12 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText).toHaveLength(3);
      expect(richText![1].text).toBe('\n');
    });

    it('should handle page breaks', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Page 1',
                formatting: {}
              } as TextRun,
              {
                type: 'break',
                breakType: 'page'
              } as Break,
              {
                type: 'text',
                text: 'Page 2',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: 'Page 1Page 2'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 4, characterCount: 12 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText![1].text).toBe('\n\n');
    });

    it('should handle tabs', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Before',
                formatting: {}
              } as TextRun,
              {
                type: 'tab'
              } as Tab,
              {
                type: 'text',
                text: 'After',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: 'BeforeAfter'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 11 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText).toHaveLength(3);
      expect(richText![1].text).toBe('\t');
    });

    it('should handle mixed content with multiple runs', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Normal ',
                formatting: {}
              } as TextRun,
              {
                type: 'text',
                text: 'bold',
                formatting: { bold: true }
              } as TextRun,
              {
                type: 'text',
                text: ' and ',
                formatting: {}
              } as TextRun,
              {
                type: 'text',
                text: 'italic',
                formatting: { italic: true }
              } as TextRun
            ],
            style: {},
            rawText: 'Normal bold and italic'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 4, characterCount: 22 }
      };

      const result = await convertDocxToInternalFormat(document);
      const richText = result.blocks[0].metadata?.richText;
      expect(richText).toHaveLength(4);
      expect(richText![1].style?.bold).toBe(true);
      expect(richText![3].style?.italic).toBe(true);
    });

    it('should detect headings', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Chapter One',
                formatting: {}
              } as TextRun
            ],
            style: { headingLevel: 1 },
            rawText: 'Chapter One'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 11 }
      };

      const result = await convertDocxToInternalFormat(document);
      expect(result.features).toHaveLength(1);
      expect(result.features[0].type).toBe('subhead');
      expect((result.features[0] as any).level).toBe(1);
    });

    it('should detect all heading levels', async () => {
      const levels: (1 | 2 | 3 | 4 | 5 | 6)[] = [1, 2, 3, 4, 5, 6];

      for (const level of levels) {
        const document: StructuredDocument = {
          elements: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `Heading ${level}`,
                  formatting: {}
                } as TextRun
              ],
              style: { headingLevel: level },
              rawText: `Heading ${level}`
            } as Paragraph
          ],
          metadata: { paragraphCount: 1, wordCount: 2, characterCount: 10 }
        };

        const result = await convertDocxToInternalFormat(document);
        expect(result.features[0].type).toBe('subhead');
        expect((result.features[0] as any).level).toBe(level);
      }
    });

    it('should detect scene breaks', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '* * *',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: '* * *'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 3, characterCount: 5 }
      };

      const result = await convertDocxToInternalFormat(document);
      expect(result.features).toHaveLength(1);
      expect(result.features[0].type).toBe('break');
      expect((result.features[0] as any).breakType).toBe('scene');
    });

    it('should detect alternative scene break patterns', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '# # #',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: '# # #'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 3, characterCount: 5 }
      };

      const result = await convertDocxToInternalFormat(document);
      expect(result.features[0].type).toBe('break');
      expect((result.features[0] as any).breakType).toBe('scene');
    });

    it('should detect block quotes by indentation', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This is a quote',
                formatting: {}
              } as TextRun
            ],
            style: {
              indentation: {
                left: 1440 // 1 inch in twips
              }
            },
            rawText: 'This is a quote'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 4, characterCount: 15 }
      };

      const result = await convertDocxToInternalFormat(document);
      expect(result.features).toHaveLength(1);
      expect(result.features[0].type).toBe('quote');
      expect((result.features[0] as any).quoteType).toBe('block');
    });

    it('should handle section breaks', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'section-break',
            sectionType: 'nextPage'
          }
        ],
        metadata: { paragraphCount: 0, wordCount: 0, characterCount: 0 }
      };

      const result = await convertDocxToInternalFormat(document);
      expect(result.features).toHaveLength(1);
      expect(result.features[0].type).toBe('break');
      expect((result.features[0] as any).breakType).toBe('section');
    });

    it('should preserve alignment in metadata', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Centered text',
                formatting: {}
              } as TextRun
            ],
            style: { alignment: 'center' },
            rawText: 'Centered text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 13 }
      };

      const result = await convertDocxToInternalFormat(document);
      expect(result.blocks[0].metadata?.alignment).toBe('center');
    });

    it('should handle documents with no formatting', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Plain text',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: 'Plain text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 2, characterCount: 10 }
      };

      const result = await convertDocxToInternalFormat(document, {
        preserveFormatting: false
      });

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].content).toBe('Plain text');
      expect(result.blocks[0].metadata?.richText).toBeUndefined();
    });

    it('should handle empty documents', async () => {
      const document: StructuredDocument = {
        elements: [],
        metadata: { paragraphCount: 0, wordCount: 0, characterCount: 0 }
      };

      const result = await convertDocxToInternalFormat(document);
      expect(result.blocks).toHaveLength(0);
      expect(result.features).toHaveLength(0);
    });

    it('should disable scene break detection when option is false', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '* * *',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: '* * *'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 3, characterCount: 5 }
      };

      const result = await convertDocxToInternalFormat(document, {
        detectSceneBreaks: false
      });

      expect(result.blocks).toHaveLength(1);
      expect(result.features.some(f => f.type === 'break')).toBe(false);
    });

    it('should use custom scene break patterns', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '~~~',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: '~~~'
          } as Paragraph
        ],
        metadata: { paragraphCount: 1, wordCount: 1, characterCount: 3 }
      };

      const result = await convertDocxToInternalFormat(document, {
        sceneBreakPatterns: [/^~{3,}$/]
      });

      expect(result.features[0].type).toBe('break');
      expect((result.features[0] as any).breakType).toBe('scene');
    });

    it('should handle complex documents with multiple element types', async () => {
      const document: StructuredDocument = {
        elements: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Title',
                formatting: { bold: true }
              } as TextRun
            ],
            style: { headingLevel: 1 },
            rawText: 'Title'
          } as Paragraph,
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Normal paragraph',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: 'Normal paragraph'
          } as Paragraph,
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '* * *',
                formatting: {}
              } as TextRun
            ],
            style: {},
            rawText: '* * *'
          } as Paragraph,
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Quote text',
                formatting: { italic: true }
              } as TextRun
            ],
            style: {
              indentation: { left: 1440 }
            },
            rawText: 'Quote text'
          } as Paragraph
        ],
        metadata: { paragraphCount: 4, wordCount: 8, characterCount: 40 }
      };

      const result = await convertDocxToInternalFormat(document);

      expect(result.blocks).toHaveLength(1); // Only normal paragraph becomes a block
      expect(result.features).toHaveLength(3); // Heading, scene break, quote
    });
  });
});

/**
 * Format Converter Tests
 */

import { FormatConverter, convertDocxToInternalFormat } from '../formatConverter';
import type { StructuredDocument, Paragraph, TextRun } from '../types';

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
  });
});

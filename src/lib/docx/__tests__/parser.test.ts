/**
 * Comprehensive Unit Tests for DOCX Parser
 * Tests parsing, error handling, text extraction, and structured parsing
 */

import { DocxParser } from '../parser';
import type { DocxParseResult, StructuredParseResult } from '../types';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

// Mock mammoth module
jest.mock('mammoth', () => ({
  convertToHtml: jest.fn(),
  extractRawText: jest.fn()
}));

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

const mammoth = require('mammoth');
const fs = require('fs');

describe('DocxParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseToHtml', () => {
    it('should parse a valid DOCX file and return HTML', async () => {
      const mockResult: DocxParseResult = {
        value: '<p>Hello World</p>',
        messages: []
      };

      mammoth.convertToHtml.mockResolvedValue(mockResult);

      const result = await DocxParser.parseToHtml('/path/to/test.docx');

      expect(result.value).toBe('<p>Hello World</p>');
      expect(result.messages).toHaveLength(0);
      expect(mammoth.convertToHtml).toHaveBeenCalledWith(
        { path: '/path/to/test.docx' },
        undefined
      );
    });

    it('should pass parsing options to mammoth', async () => {
      const mockResult: DocxParseResult = {
        value: '<p>Test</p>',
        messages: []
      };

      mammoth.convertToHtml.mockResolvedValue(mockResult);

      const options = {
        styleMap: ['p[style-name="Heading 1"] => h1'],
        includeDefaultStyleMap: false
      };

      await DocxParser.parseToHtml('/path/to/test.docx', options);

      expect(mammoth.convertToHtml).toHaveBeenCalledWith(
        { path: '/path/to/test.docx' },
        options
      );
    });

    it('should handle corrupt DOCX files with error', async () => {
      mammoth.convertToHtml.mockRejectedValue(new Error('Invalid ZIP file'));

      await expect(DocxParser.parseToHtml('/path/to/corrupt.docx'))
        .rejects
        .toThrow('Failed to parse DOCX file: Invalid ZIP file');
    });

    it('should handle non-existent files', async () => {
      mammoth.convertToHtml.mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(DocxParser.parseToHtml('/path/to/missing.docx'))
        .rejects
        .toThrow('Failed to parse DOCX file: ENOENT: no such file');
    });

    it('should handle parsing warnings', async () => {
      const mockResult: DocxParseResult = {
        value: '<p>Content</p>',
        messages: [
          { type: 'warning', message: 'Unsupported style detected' }
        ]
      };

      mammoth.convertToHtml.mockResolvedValue(mockResult);

      const result = await DocxParser.parseToHtml('/path/to/test.docx');

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe('warning');
    });
  });

  describe('parseBufferToHtml', () => {
    it('should parse a DOCX buffer and return HTML', async () => {
      const mockBuffer = Buffer.from('mock docx content');
      const mockResult: DocxParseResult = {
        value: '<p>Buffer content</p>',
        messages: []
      };

      mammoth.convertToHtml.mockResolvedValue(mockResult);

      const result = await DocxParser.parseBufferToHtml(mockBuffer);

      expect(result.value).toBe('<p>Buffer content</p>');
      expect(mammoth.convertToHtml).toHaveBeenCalledWith(
        { buffer: mockBuffer },
        undefined
      );
    });

    it('should handle corrupt buffer data', async () => {
      const corruptBuffer = Buffer.from('not a valid docx');

      mammoth.convertToHtml.mockRejectedValue(new Error('Invalid buffer format'));

      await expect(DocxParser.parseBufferToHtml(corruptBuffer))
        .rejects
        .toThrow('Failed to parse DOCX buffer: Invalid buffer format');
    });

    it('should handle empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);

      mammoth.convertToHtml.mockRejectedValue(new Error('Empty buffer'));

      await expect(DocxParser.parseBufferToHtml(emptyBuffer))
        .rejects
        .toThrow('Failed to parse DOCX buffer');
    });
  });

  describe('extractText', () => {
    it('should extract plain text from DOCX file', async () => {
      const mockResult: DocxParseResult = {
        value: 'Plain text content without formatting',
        messages: []
      };

      mammoth.extractRawText.mockResolvedValue(mockResult);

      const result = await DocxParser.extractText('/path/to/test.docx');

      expect(result.value).toBe('Plain text content without formatting');
      expect(mammoth.extractRawText).toHaveBeenCalledWith({ path: '/path/to/test.docx' });
    });

    it('should handle text extraction errors', async () => {
      mammoth.extractRawText.mockRejectedValue(new Error('Cannot read file'));

      await expect(DocxParser.extractText('/path/to/test.docx'))
        .rejects
        .toThrow('Failed to extract text from DOCX file: Cannot read file');
    });

    it('should extract text with special characters', async () => {
      const mockResult: DocxParseResult = {
        value: 'Text with émojis 🎉 and spëcial çhars',
        messages: []
      };

      mammoth.extractRawText.mockResolvedValue(mockResult);

      const result = await DocxParser.extractText('/path/to/test.docx');

      expect(result.value).toContain('émojis');
      expect(result.value).toContain('🎉');
    });

    it('should handle empty documents', async () => {
      const mockResult: DocxParseResult = {
        value: '',
        messages: []
      };

      mammoth.extractRawText.mockResolvedValue(mockResult);

      const result = await DocxParser.extractText('/path/to/empty.docx');

      expect(result.value).toBe('');
    });
  });

  describe('extractTextFromBuffer', () => {
    it('should extract text from buffer', async () => {
      const mockBuffer = Buffer.from('mock docx');
      const mockResult: DocxParseResult = {
        value: 'Extracted text from buffer',
        messages: []
      };

      mammoth.extractRawText.mockResolvedValue(mockResult);

      const result = await DocxParser.extractTextFromBuffer(mockBuffer);

      expect(result.value).toBe('Extracted text from buffer');
      expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer: mockBuffer });
    });

    it('should handle buffer extraction errors', async () => {
      const mockBuffer = Buffer.from('invalid');

      mammoth.extractRawText.mockRejectedValue(new Error('Invalid format'));

      await expect(DocxParser.extractTextFromBuffer(mockBuffer))
        .rejects
        .toThrow('Failed to extract text from DOCX buffer: Invalid format');
    });
  });

  describe('Helper Methods', () => {
    describe('hasErrors', () => {
      it('should return true when result has errors', () => {
        const result: DocxParseResult = {
          value: 'content',
          messages: [
            { type: 'error', message: 'An error occurred' }
          ]
        };

        expect(DocxParser.hasErrors(result)).toBe(true);
      });

      it('should return false when result has no errors', () => {
        const result: DocxParseResult = {
          value: 'content',
          messages: [
            { type: 'warning', message: 'A warning' },
            { type: 'info', message: 'Info message' }
          ]
        };

        expect(DocxParser.hasErrors(result)).toBe(false);
      });

      it('should return false for empty messages', () => {
        const result: DocxParseResult = {
          value: 'content',
          messages: []
        };

        expect(DocxParser.hasErrors(result)).toBe(false);
      });
    });

    describe('hasWarnings', () => {
      it('should return true when result has warnings', () => {
        const result: DocxParseResult = {
          value: 'content',
          messages: [
            { type: 'warning', message: 'A warning' }
          ]
        };

        expect(DocxParser.hasWarnings(result)).toBe(true);
      });

      it('should return false when result has no warnings', () => {
        const result: DocxParseResult = {
          value: 'content',
          messages: [
            { type: 'error', message: 'An error' }
          ]
        };

        expect(DocxParser.hasWarnings(result)).toBe(false);
      });
    });

    describe('getErrors', () => {
      it('should return all error messages', () => {
        const result: DocxParseResult = {
          value: 'content',
          messages: [
            { type: 'error', message: 'Error 1' },
            { type: 'warning', message: 'Warning' },
            { type: 'error', message: 'Error 2' }
          ]
        };

        const errors = DocxParser.getErrors(result);

        expect(errors).toEqual(['Error 1', 'Error 2']);
      });

      it('should return empty array when no errors', () => {
        const result: DocxParseResult = {
          value: 'content',
          messages: []
        };

        expect(DocxParser.getErrors(result)).toEqual([]);
      });
    });

    describe('getWarnings', () => {
      it('should return all warning messages', () => {
        const result: DocxParseResult = {
          value: 'content',
          messages: [
            { type: 'warning', message: 'Warning 1' },
            { type: 'error', message: 'Error' },
            { type: 'warning', message: 'Warning 2' }
          ]
        };

        const warnings = DocxParser.getWarnings(result);

        expect(warnings).toEqual(['Warning 1', 'Warning 2']);
      });

      it('should return empty array when no warnings', () => {
        const result: DocxParseResult = {
          value: 'content',
          messages: []
        };

        expect(DocxParser.getWarnings(result)).toEqual([]);
      });
    });
  });

  describe('parseStructured', () => {
    it('should parse structured document from file path', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r>
                <w:t>Hello World</w:t>
              </w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);

      const mockBuffer = await mockZip.generateAsync({ type: 'nodebuffer' });
      fs.readFileSync.mockReturnValue(mockBuffer);

      const result = await DocxParser.parseStructured('/path/to/test.docx');

      expect(result.document).toBeDefined();
      expect(result.document.elements).toHaveLength(1);
      expect(result.document.elements[0].type).toBe('paragraph');
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/test.docx');
    });

    it('should handle file read errors', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(DocxParser.parseStructured('/path/to/missing.docx'))
        .rejects
        .toThrow('Failed to parse DOCX file structure: File not found');
    });
  });

  describe('parseStructuredFromBuffer', () => {
    it('should parse simple document with one paragraph', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r>
                <w:t>Simple paragraph</w:t>
              </w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.document.elements).toHaveLength(1);
      expect(result.document.metadata.paragraphCount).toBe(1);
      expect(result.document.metadata.wordCount).toBe(2);
      expect(result.messages).toHaveLength(0);
    });

    it('should parse document with multiple paragraphs', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>First paragraph</w:t></w:r>
            </w:p>
            <w:p>
              <w:r><w:t>Second paragraph</w:t></w:r>
            </w:p>
            <w:p>
              <w:r><w:t>Third paragraph</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.document.elements).toHaveLength(3);
      expect(result.document.metadata.paragraphCount).toBe(3);
    });

    it('should parse empty document', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.document.elements).toHaveLength(0);
      expect(result.document.metadata.paragraphCount).toBe(0);
      expect(result.document.metadata.wordCount).toBe(0);
    });

    it('should parse document with bold formatting', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:b/>
                </w:rPr>
                <w:t>Bold text</w:t>
              </w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.content[0].formatting.bold).toBe(true);
    });

    it('should parse document with italic formatting', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:i/>
                </w:rPr>
                <w:t>Italic text</w:t>
              </w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.content[0].formatting.italic).toBe(true);
    });

    it('should parse document with underline', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:u w:val="single"/>
                </w:rPr>
                <w:t>Underlined text</w:t>
              </w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.content[0].formatting.underline).toBe(true);
    });

    it('should parse document with heading styles', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:pPr>
                <w:pStyle w:val="Heading1"/>
              </w:pPr>
              <w:r><w:t>Chapter Title</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.style.styleName).toBe('Heading1');
      expect(paragraph.style.headingLevel).toBe(1);
    });

    it('should parse document with alignment', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:pPr>
                <w:jc w:val="center"/>
              </w:pPr>
              <w:r><w:t>Centered text</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.style.alignment).toBe('center');
    });

    it('should parse document with special characters', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>Special: &lt;&gt;&amp;"' àéîöü 🎉</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.rawText).toContain('<>');
      expect(paragraph.rawText).toContain('&');
    });

    it('should handle missing document.xml', async () => {
      const mockZip = new JSZip();
      // Don't add document.xml
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe('error');
      expect(result.messages[0].message).toContain('document.xml not found');
      expect(result.document.elements).toHaveLength(0);
    });

    it('should handle corrupt ZIP data', async () => {
      const corruptBuffer = Buffer.from('not a zip file');

      const result = await DocxParser.parseStructuredFromBuffer(corruptBuffer);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe('error');
      expect(result.document.elements).toHaveLength(0);
    });

    it('should handle malformed XML', async () => {
      const malformedXml = '<invalid>Not closed properly';

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', malformedXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages[0].type).toBe('error');
    });

    it('should count words correctly', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>This document has exactly seven words here</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.document.metadata.wordCount).toBe(7);
    });

    it('should count characters correctly', async () => {
      const text = 'Hello';
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>${text}</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.document.metadata.characterCount).toBe(5);
    });

    it('should parse document with line breaks', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>Line 1</w:t></w:r>
              <w:r><w:br/></w:r>
              <w:r><w:t>Line 2</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.content).toHaveLength(3); // text, break, text
      expect(paragraph.content[1].type).toBe('break');
      expect(paragraph.content[1].breakType).toBe('line');
    });

    it('should parse document with tabs', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>Before</w:t></w:r>
              <w:r><w:tab/></w:r>
              <w:r><w:t>After</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.content).toHaveLength(3);
      expect(paragraph.content[1].type).toBe('tab');
    });

    it('should parse document with section breaks', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>Section 1</w:t></w:r>
            </w:p>
            <w:sectPr>
              <w:type w:val="nextPage"/>
            </w:sectPr>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.document.elements).toHaveLength(2);
      expect(result.document.elements[1].type).toBe('section-break');
      expect((result.document.elements[1] as any).sectionType).toBe('nextPage');
    });

    it('should parse document with color formatting', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:color w:val="FF0000"/>
                </w:rPr>
                <w:t>Red text</w:t>
              </w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.content[0].formatting.color).toBe('#FF0000');
    });

    it('should parse document with font size', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r>
                <w:rPr>
                  <w:sz w:val="28"/>
                </w:rPr>
                <w:t>14pt text</w:t>
              </w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.content[0].formatting.fontSize).toBe(14);
    });

    it('should parse document with indentation', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:pPr>
                <w:ind w:left="720" w:right="360" w:firstLine="360"/>
              </w:pPr>
              <w:r><w:t>Indented text</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.style.indentation).toBeDefined();
      expect(paragraph.style.indentation.left).toBe(720);
      expect(paragraph.style.indentation.right).toBe(360);
      expect(paragraph.style.indentation.firstLine).toBe(360);
    });

    it('should parse document with numbering', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:pPr>
                <w:numPr>
                  <w:ilvl w:val="0"/>
                  <w:numId w:val="1"/>
                </w:numPr>
              </w:pPr>
              <w:r><w:t>List item</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      const paragraph = result.document.elements[0] as any;
      expect(paragraph.style.numbering).toBeDefined();
      expect(paragraph.style.numbering.level).toBe(0);
      expect(paragraph.style.numbering.format).toBe('1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle document with only whitespace', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>   </w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.document.elements).toHaveLength(1);
      expect(result.document.metadata.wordCount).toBe(0); // Whitespace doesn't count as words
    });

    it('should handle document with empty paragraphs', async () => {
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p></w:p>
            <w:p></w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.document.elements).toHaveLength(2);
      expect(result.document.metadata.wordCount).toBe(0);
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(10000).trim();
      const mockXml = `<?xml version="1.0"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p>
              <w:r><w:t>${longText}</w:t></w:r>
            </w:p>
          </w:body>
        </w:document>`;

      const mockZip = new JSZip();
      mockZip.file('word/document.xml', mockXml);
      const buffer = await mockZip.generateAsync({ type: 'nodebuffer' });

      const result = await DocxParser.parseStructuredFromBuffer(buffer);

      expect(result.document.metadata.wordCount).toBe(10000);
    });
  });
});

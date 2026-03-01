/**
 * DOCX Parser Wrapper Module
 * Provides a clean interface for parsing .docx files using mammoth.js
 * and direct XML parsing for structured document extraction
 */

import type {
  DocxParseResult,
  DocxParseOptions,
  MammothAPI,
  StructuredParseResult,
  StructuredDocument,
  DocumentElement,
  Paragraph,
  ParagraphContent,
  ParagraphStyle,
  InlineFormatting,
  DocxMessage,
  SectionBreak
} from './types';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import { readFileSync } from 'fs';

// Dynamic import of mammoth with proper typing
const mammoth: MammothAPI = require('mammoth');

export class DocxParser {
  /**
   * Parse a DOCX file from a file path and return HTML content
   * @param filePath - Absolute path to the .docx file
   * @param options - Optional parsing configuration
   * @returns Promise with parsed HTML and any messages
   */
  static async parseToHtml(
    filePath: string,
    options?: DocxParseOptions
  ): Promise<DocxParseResult> {
    try {
      const result = await mammoth.convertToHtml(
        { path: filePath },
        options
      );
      return result;
    } catch (error) {
      throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse a DOCX file from a Buffer and return HTML content
   * @param buffer - Buffer containing the .docx file data
   * @param options - Optional parsing configuration
   * @returns Promise with parsed HTML and any messages
   */
  static async parseBufferToHtml(
    buffer: Buffer,
    options?: DocxParseOptions
  ): Promise<DocxParseResult> {
    try {
      const result = await mammoth.convertToHtml(
        { buffer },
        options
      );
      return result;
    } catch (error) {
      throw new Error(`Failed to parse DOCX buffer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract raw text from a DOCX file (no HTML formatting)
   * @param filePath - Absolute path to the .docx file
   * @returns Promise with extracted text and any messages
   */
  static async extractText(filePath: string): Promise<DocxParseResult> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result;
    } catch (error) {
      throw new Error(`Failed to extract text from DOCX file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract raw text from a DOCX Buffer (no HTML formatting)
   * @param buffer - Buffer containing the .docx file data
   * @returns Promise with extracted text and any messages
   */
  static async extractTextFromBuffer(buffer: Buffer): Promise<DocxParseResult> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result;
    } catch (error) {
      throw new Error(`Failed to extract text from DOCX buffer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if the parse result has any errors
   * @param result - Parse result from any parsing method
   * @returns true if there are errors, false otherwise
   */
  static hasErrors(result: DocxParseResult): boolean {
    return result.messages.some(msg => msg.type === 'error');
  }

  /**
   * Check if the parse result has any warnings
   * @param result - Parse result from any parsing method
   * @returns true if there are warnings, false otherwise
   */
  static hasWarnings(result: DocxParseResult): boolean {
    return result.messages.some(msg => msg.type === 'warning');
  }

  /**
   * Get all error messages from a parse result
   * @param result - Parse result from any parsing method
   * @returns Array of error message strings
   */
  static getErrors(result: DocxParseResult): string[] {
    return result.messages
      .filter(msg => msg.type === 'error')
      .map(msg => msg.message);
  }

  /**
   * Get all warning messages from a parse result
   * @param result - Parse result from any parsing method
   * @returns Array of warning message strings
   */
  static getWarnings(result: DocxParseResult): string[] {
    return result.messages
      .filter(msg => msg.type === 'warning')
      .map(msg => msg.message);
  }

  /**
   * Parse a DOCX file and extract structured document data
   * Extracts paragraph-level metadata, heading levels, styles, breaks, and inline formatting
   * @param filePath - Absolute path to the .docx file
   * @returns Promise with structured document tree
   */
  static async parseStructured(filePath: string): Promise<StructuredParseResult> {
    try {
      const buffer = readFileSync(filePath);
      return await this.parseStructuredFromBuffer(buffer);
    } catch (error) {
      throw new Error(`Failed to parse DOCX file structure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse a DOCX buffer and extract structured document data
   * @param buffer - Buffer containing the .docx file data
   * @returns Promise with structured document tree
   */
  static async parseStructuredFromBuffer(buffer: Buffer): Promise<StructuredParseResult> {
    const messages: DocxMessage[] = [];

    try {
      // Load the DOCX file as a ZIP archive
      const zip = await JSZip.loadAsync(buffer);

      // Extract the main document XML
      const documentXml = await zip.file('word/document.xml')?.async('string');
      if (!documentXml) {
        throw new Error('document.xml not found in DOCX file');
      }

      // Extract styles XML for heading and style information
      const stylesXml = await zip.file('word/styles.xml')?.async('string');
      const styles = stylesXml ? await parseStringPromise(stylesXml) : null;

      // Parse the document XML
      const doc = await parseStringPromise(documentXml);

      // Extract document body
      const body = doc['w:document']?.['w:body']?.[0];
      if (!body) {
        throw new Error('Document body not found');
      }

      // Parse all elements (paragraphs, tables, section breaks, etc.)
      const elements: DocumentElement[] = [];
      let totalWords = 0;
      let totalChars = 0;

      // Process each element in the body
      for (const key of Object.keys(body)) {
        if (key === 'w:p') {
          // Paragraphs
          const paragraphs = body[key];
          for (const p of paragraphs) {
            const paragraph = this.parseParagraph(p, styles);
            elements.push(paragraph);
            totalWords += paragraph.rawText.split(/\s+/).filter(w => w.length > 0).length;
            totalChars += paragraph.rawText.length;
          }
        } else if (key === 'w:sectPr') {
          // Section properties (section break)
          const sectionBreak: SectionBreak = {
            type: 'section-break',
            sectionType: this.extractSectionType(body[key][0])
          };
          elements.push(sectionBreak);
        }
      }

      const document: StructuredDocument = {
        elements,
        metadata: {
          paragraphCount: elements.filter(e => e.type === 'paragraph').length,
          wordCount: totalWords,
          characterCount: totalChars
        }
      };

      return {
        document,
        messages
      };
    } catch (error) {
      messages.push({
        type: 'error',
        message: error instanceof Error ? error.message : String(error)
      });

      return {
        document: {
          elements: [],
          metadata: {
            paragraphCount: 0,
            wordCount: 0,
            characterCount: 0
          }
        },
        messages
      };
    }
  }

  /**
   * Parse a single paragraph element
   */
  private static parseParagraph(p: any, _styles: any): Paragraph {
    const content: ParagraphContent[] = [];
    const style: ParagraphStyle = {};
    let rawText = '';

    // Extract paragraph properties
    if (p['w:pPr']) {
      const pPr = p['w:pPr'][0];

      // Style name
      if (pPr['w:pStyle']) {
        const styleName = pPr['w:pStyle'][0].$?.['w:val'];
        if (styleName) {
          style.styleName = styleName;
          style.headingLevel = this.extractHeadingLevel(styleName);
        }
      }

      // Alignment
      if (pPr['w:jc']) {
        const jc = pPr['w:jc'][0].$?.['w:val'];
        if (jc === 'left' || jc === 'center' || jc === 'right' || jc === 'both') {
          style.alignment = jc === 'both' ? 'justify' : jc;
        }
      }

      // Indentation
      if (pPr['w:ind']) {
        const ind = pPr['w:ind'][0].$;
        style.indentation = {
          left: ind?.['w:left'] ? parseInt(ind['w:left']) : undefined,
          right: ind?.['w:right'] ? parseInt(ind['w:right']) : undefined,
          firstLine: ind?.['w:firstLine'] ? parseInt(ind['w:firstLine']) : undefined,
          hanging: ind?.['w:hanging'] ? parseInt(ind['w:hanging']) : undefined
        };
      }

      // Spacing
      if (pPr['w:spacing']) {
        const spacing = pPr['w:spacing'][0].$;
        style.spacing = {
          before: spacing?.['w:before'] ? parseInt(spacing['w:before']) : undefined,
          after: spacing?.['w:after'] ? parseInt(spacing['w:after']) : undefined,
          line: spacing?.['w:line'] ? parseInt(spacing['w:line']) : undefined
        };
      }

      // Numbering
      if (pPr['w:numPr']) {
        const numPr = pPr['w:numPr'][0];
        const level = numPr['w:ilvl']?.[0].$?.['w:val'];
        const numId = numPr['w:numId']?.[0].$?.['w:val'];
        if (level !== undefined) {
          style.numbering = {
            level: parseInt(level),
            format: numId || 'decimal'
          };
        }
      }
    }

    // Extract runs (text content with formatting)
    if (p['w:r']) {
      for (const run of p['w:r']) {
        const runContent = this.parseRun(run);
        content.push(...runContent.content);
        rawText += runContent.text;
      }
    }

    // Check for page breaks in paragraph properties
    if (p['w:pPr']?.[0]?.['w:pageBreakBefore']) {
      content.unshift({
        type: 'break',
        breakType: 'page'
      });
    }

    return {
      type: 'paragraph',
      content,
      style,
      rawText
    };
  }

  /**
   * Parse a run element (text with formatting)
   */
  private static parseRun(run: any): { content: ParagraphContent[], text: string } {
    const content: ParagraphContent[] = [];
    let text = '';

    // Extract run properties (formatting)
    const formatting: InlineFormatting = {};
    if (run['w:rPr']) {
      const rPr = run['w:rPr'][0];

      // Bold
      if (rPr['w:b'] && rPr['w:b'][0].$?.['w:val'] !== '0') {
        formatting.bold = true;
      }

      // Italic
      if (rPr['w:i'] && rPr['w:i'][0].$?.['w:val'] !== '0') {
        formatting.italic = true;
      }

      // Underline
      if (rPr['w:u']) {
        const uVal = rPr['w:u'][0].$?.['w:val'];
        formatting.underline = uVal !== 'none';
      }

      // Strikethrough
      if (rPr['w:strike'] && rPr['w:strike'][0].$?.['w:val'] !== '0') {
        formatting.strikethrough = true;
      }

      // Subscript/Superscript
      if (rPr['w:vertAlign']) {
        const vertAlign = rPr['w:vertAlign'][0].$?.['w:val'];
        if (vertAlign === 'subscript') {
          formatting.subscript = true;
        } else if (vertAlign === 'superscript') {
          formatting.superscript = true;
        }
      }

      // Color
      if (rPr['w:color']) {
        const color = rPr['w:color'][0].$?.['w:val'];
        if (color && color !== 'auto') {
          formatting.color = '#' + color;
        }
      }

      // Highlight
      if (rPr['w:highlight']) {
        formatting.highlight = rPr['w:highlight'][0].$?.['w:val'];
      }

      // Font size (in half-points)
      if (rPr['w:sz']) {
        const sz = rPr['w:sz'][0].$?.['w:val'];
        if (sz) {
          formatting.fontSize = parseInt(sz) / 2;
        }
      }

      // Font family
      if (rPr['w:rFonts']) {
        formatting.fontFamily = rPr['w:rFonts'][0].$?.['w:ascii'];
      }
    }

    // Extract text content
    if (run['w:t']) {
      for (const t of run['w:t']) {
        const textContent = typeof t === 'string' ? t : (t._ || '');
        text += textContent;
        content.push({
          type: 'text',
          text: textContent,
          formatting
        });
      }
    }

    // Handle breaks
    if (run['w:br']) {
      for (const br of run['w:br']) {
        const breakType = br.$?.['w:type'];
        content.push({
          type: 'break',
          breakType: breakType === 'page' ? 'page' : breakType === 'column' ? 'column' : 'line'
        });
      }
    }

    // Handle tabs
    if (run['w:tab']) {
      content.push({
        type: 'tab'
      });
    }

    return { content, text };
  }

  /**
   * Extract heading level from style name
   */
  private static extractHeadingLevel(styleName: string): 1 | 2 | 3 | 4 | 5 | 6 | undefined {
    const match = styleName.match(/heading\s*(\d)/i) || styleName.match(/^h(\d)$/i);
    if (match) {
      const level = parseInt(match[1]);
      if (level >= 1 && level <= 6) {
        return level as 1 | 2 | 3 | 4 | 5 | 6;
      }
    }
    return undefined;
  }

  /**
   * Extract section type from section properties
   */
  private static extractSectionType(sectPr: any): SectionBreak['sectionType'] {
    if (sectPr?.['w:type']) {
      const type = sectPr['w:type'][0].$?.['w:val'];
      switch (type) {
        case 'nextPage': return 'nextPage';
        case 'nextColumn': return 'nextColumn';
        case 'continuous': return 'continuous';
        case 'evenPage': return 'evenPage';
        case 'oddPage': return 'oddPage';
      }
    }
    return undefined;
  }
}

export default DocxParser;

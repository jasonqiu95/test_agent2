/**
 * DOCX Parser Wrapper Module
 * Provides a clean interface for parsing .docx files using mammoth.js
 */

import type { DocxParseResult, DocxParseOptions, MammothAPI } from './types';

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
}

export default DocxParser;

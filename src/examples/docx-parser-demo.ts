/**
 * DOCX Parser Demo
 *
 * This file demonstrates how to use the DOCX parser module.
 * To run this demo, you'll need a sample .docx file.
 */

import { DocxParser } from '../lib/docx';
import type { DocxParseResult } from '../lib/docx';

/**
 * Demo: Parse a DOCX file to HTML
 */
export async function demoParseToHtml(filePath: string): Promise<void> {
  console.log('=== Parse DOCX to HTML Demo ===');
  console.log(`File: ${filePath}`);

  try {
    const result: DocxParseResult = await DocxParser.parseToHtml(filePath);

    console.log('\nParsing successful!');
    console.log(`Content length: ${result.value.length} characters`);

    if (DocxParser.hasWarnings(result)) {
      console.log('\nWarnings:');
      DocxParser.getWarnings(result).forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    console.log('\nHTML Preview (first 200 chars):');
    console.log(result.value.substring(0, 200));
  } catch (error) {
    console.error('Parsing failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Demo: Extract plain text from a DOCX file
 */
export async function demoParseToText(filePath: string): Promise<void> {
  console.log('\n=== Parse DOCX to Text Demo ===');
  console.log(`File: ${filePath}`);

  try {
    const result: DocxParseResult = await DocxParser.extractText(filePath);

    console.log('\nText extraction successful!');
    console.log(`Content length: ${result.value.length} characters`);
    console.log('\nText Preview (first 200 chars):');
    console.log(result.value.substring(0, 200));
  } catch (error) {
    console.error('Text extraction failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Demo: Parse from Buffer
 */
export async function demoParseFromBuffer(buffer: Buffer): Promise<void> {
  console.log('\n=== Parse from Buffer Demo ===');

  try {
    const result: DocxParseResult = await DocxParser.parseBufferToHtml(buffer);

    console.log('Parsing from buffer successful!');
    console.log(`Content length: ${result.value.length} characters`);
  } catch (error) {
    console.error('Buffer parsing failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * Demo: Error handling
 */
export async function demoErrorHandling(): Promise<void> {
  console.log('\n=== Error Handling Demo ===');

  try {
    await DocxParser.parseToHtml('./non-existent.docx');
    console.log('Unexpected: parsing should have failed');
  } catch (error) {
    console.log('Expected error occurred:');
    console.log(`  Message: ${error instanceof Error ? error.message : error}`);
  }
}

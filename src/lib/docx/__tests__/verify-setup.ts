/**
 * Verification script for DOCX parser setup
 *
 * This script verifies that the DOCX parser module is correctly set up
 * and can be imported without errors.
 */

import { DocxParser } from '../index';
import type { DocxParseResult } from '../index';

/**
 * Verify that all exports are available
 */
function verifyExports(): void {
  console.log('✓ Verifying exports...');

  // Check DocxParser class
  if (typeof DocxParser !== 'function') {
    throw new Error('DocxParser is not exported');
  }

  // Check static methods
  if (typeof DocxParser.parseToHtml !== 'function') {
    throw new Error('DocxParser.parseToHtml is not a function');
  }
  if (typeof DocxParser.extractText !== 'function') {
    throw new Error('DocxParser.extractText is not a function');
  }
  if (typeof DocxParser.parseBufferToHtml !== 'function') {
    throw new Error('DocxParser.parseBufferToHtml is not a function');
  }
  if (typeof DocxParser.extractTextFromBuffer !== 'function') {
    throw new Error('DocxParser.extractTextFromBuffer is not a function');
  }
  if (typeof DocxParser.hasErrors !== 'function') {
    throw new Error('DocxParser.hasErrors is not a function');
  }
  if (typeof DocxParser.hasWarnings !== 'function') {
    throw new Error('DocxParser.hasWarnings is not a function');
  }
  if (typeof DocxParser.parseStructured !== 'function') {
    throw new Error('DocxParser.parseStructured is not a function');
  }
  if (typeof DocxParser.parseStructuredFromBuffer !== 'function') {
    throw new Error('DocxParser.parseStructuredFromBuffer is not a function');
  }

  console.log('  ✓ DocxParser class exported');
  console.log('  ✓ parseToHtml method available');
  console.log('  ✓ extractText method available');
  console.log('  ✓ parseBufferToHtml method available');
  console.log('  ✓ extractTextFromBuffer method available');
  console.log('  ✓ hasErrors method available');
  console.log('  ✓ hasWarnings method available');
  console.log('  ✓ parseStructured method available');
  console.log('  ✓ parseStructuredFromBuffer method available');
}

/**
 * Verify utility functions work
 */
function verifyUtilities(): void {
  console.log('\n✓ Verifying utility functions...');

  // Test helper methods with mock result
  const mockResult: DocxParseResult = {
    value: 'test content',
    messages: [
      { type: 'error', message: 'Test error' },
      { type: 'warning', message: 'Test warning' },
      { type: 'info', message: 'Test info' }
    ]
  };

  // Test hasErrors
  if (!DocxParser.hasErrors(mockResult)) {
    throw new Error('hasErrors should return true for result with errors');
  }

  // Test hasWarnings
  if (!DocxParser.hasWarnings(mockResult)) {
    throw new Error('hasWarnings should return true for result with warnings');
  }

  // Test getErrors
  const errors = DocxParser.getErrors(mockResult);
  if (errors.length !== 1 || errors[0] !== 'Test error') {
    throw new Error('getErrors should return array with error message');
  }

  // Test getWarnings
  const warnings = DocxParser.getWarnings(mockResult);
  if (warnings.length !== 1 || warnings[0] !== 'Test warning') {
    throw new Error('getWarnings should return array with warning message');
  }

  console.log('  ✓ hasErrors works correctly');
  console.log('  ✓ hasWarnings works correctly');
  console.log('  ✓ getErrors works correctly');
  console.log('  ✓ getWarnings works correctly');
}

/**
 * Verify error handling for non-existent files
 */
async function verifyErrorHandling(): Promise<void> {
  console.log('\n✓ Verifying error handling...');

  try {
    // Try to parse a non-existent file - should throw an error
    await DocxParser.parseToHtml('./non-existent-file.docx');
    throw new Error('Expected parsing to fail for non-existent file');
  } catch (error) {
    // This is expected
    if (error instanceof Error && error.message.includes('Failed to parse DOCX file')) {
      console.log('  ✓ Error handling works correctly');
      console.log(`  ✓ Error message: ${error.message.substring(0, 60)}...`);
    } else {
      throw error;
    }
  }
}

/**
 * Run all verification tests
 */
export async function runVerification(): Promise<void> {
  console.log('=== DOCX Parser Setup Verification ===\n');

  try {
    verifyExports();
    verifyUtilities();
    await verifyErrorHandling();

    console.log('\n=== All Verifications Passed ✓ ===');
    console.log('\nThe DOCX parser module is correctly installed and configured!');
    console.log('You can now use it to parse .docx files.');
  } catch (error) {
    console.error('\n=== Verification Failed ✗ ===');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  runVerification().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

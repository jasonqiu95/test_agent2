/**
 * Sample document fixtures for import testing
 *
 * These fixtures provide paths to sample .docx files and helpers
 * to create temporary test documents.
 */

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

/**
 * Sample document configurations
 */
export interface SampleDocument {
  name: string;
  description: string;
  path: string;
  expectedChapters?: number;
  expectedWordCount?: number;
}

/**
 * Get the fixtures directory path
 */
export function getFixturesDir(): string {
  return path.resolve(__dirname);
}

/**
 * Get the documents directory path
 */
export function getDocumentsDir(): string {
  return path.join(getFixturesDir(), 'documents');
}

/**
 * Sample .docx files for testing
 * Note: These are references to sample files that should be present
 * in the e2e/fixtures/documents directory
 */
export const sampleDocuments: Record<string, SampleDocument> = {
  simple: {
    name: 'simple-book.docx',
    description: 'A simple document with basic formatting',
    path: path.join(getDocumentsDir(), 'simple-book.docx'),
    expectedChapters: 2,
    expectedWordCount: 100,
  },
  withHeadings: {
    name: 'book-with-headings.docx',
    description: 'Document with proper heading hierarchy',
    path: path.join(getDocumentsDir(), 'book-with-headings.docx'),
    expectedChapters: 3,
    expectedWordCount: 500,
  },
  complex: {
    name: 'complex-book.docx',
    description: 'Complex document with images, tables, and formatting',
    path: path.join(getDocumentsDir(), 'complex-book.docx'),
    expectedChapters: 5,
    expectedWordCount: 1500,
  },
  corrupted: {
    name: 'corrupted.docx',
    description: 'Intentionally corrupted document for error handling tests',
    path: path.join(getDocumentsDir(), 'corrupted.docx'),
  },
  empty: {
    name: 'empty.docx',
    description: 'Empty document',
    path: path.join(getDocumentsDir(), 'empty.docx'),
    expectedChapters: 0,
    expectedWordCount: 0,
  },
};

/**
 * Create a minimal valid .docx file for testing
 * This creates a temporary .docx file with minimal content
 *
 * @param outputPath - Where to save the .docx file
 * @param content - The text content to include
 */
export async function createMinimalDocx(
  outputPath: string,
  content: string = 'Test content'
): Promise<void> {
  // For now, we'll create a placeholder
  // In a real implementation, you'd use a library like docx or officegen
  // to create a proper .docx file
  const placeholder = `This is a placeholder for a .docx file.\nContent: ${content}`;
  await fs.writeFile(outputPath, placeholder, 'utf-8');
}

/**
 * Verify that a document file exists
 */
export async function documentExists(docPath: string): Promise<boolean> {
  try {
    await fs.access(docPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the size of a document file
 */
export async function getDocumentSize(docPath: string): Promise<number> {
  const stats = await fs.stat(docPath);
  return stats.size;
}

/**
 * Create the documents directory if it doesn't exist
 */
export async function ensureDocumentsDir(): Promise<void> {
  const docsDir = getDocumentsDir();
  try {
    await fs.mkdir(docsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's fine
  }
}

/**
 * Sample text content for generating test documents
 */
export const sampleContent = {
  chapter1: `Chapter 1: The Beginning

This is the first chapter of our test book. It contains several paragraphs of content that can be used for testing import functionality.

The content includes various formatting elements and should be parsed correctly by the import system.

This paragraph demonstrates how multi-paragraph chapters are handled during the import process.`,

  chapter2: `Chapter 2: The Middle

The second chapter continues the narrative with more interesting content.

We include different types of text to ensure the import handles various scenarios.

This helps us verify that the chapter structure is maintained correctly.`,

  chapter3: `Chapter 3: The End

Our final chapter brings the test book to a close.

It's important to test how the last chapter is imported and whether all content is preserved.

The end.`,

  withHeadings: `# Book Title

## Chapter 1: Introduction

This is the introduction to our test book.

### Section 1.1

Subsections should also be handled properly.

## Chapter 2: Main Content

The main content goes here.

### Section 2.1

More detailed content.

### Section 2.2

Additional sections.`,

  complexFormatting: `**Bold text** and *italic text* should be preserved.

Lists should work:
- Item 1
- Item 2
- Item 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

> Block quotes should also be handled.

Code blocks:
\`\`\`
function test() {
  return true;
}
\`\`\`

Regular paragraphs continue after special formatting.`,
};

/**
 * Helper to create a test document with specific content
 */
export async function createTestDocument(
  filename: string,
  content: string
): Promise<string> {
  await ensureDocumentsDir();
  const filePath = path.join(getDocumentsDir(), filename);
  await createMinimalDocx(filePath, content);
  return filePath;
}

/**
 * Clean up test documents
 */
export async function cleanupTestDocuments(): Promise<void> {
  const docsDir = getDocumentsDir();
  try {
    const files = await fs.readdir(docsDir);
    for (const file of files) {
      if (file.startsWith('test-') || file.startsWith('temp-')) {
        await fs.unlink(path.join(docsDir, file));
      }
    }
  } catch (error) {
    // Directory might not exist, that's fine
  }
}

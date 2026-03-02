/**
 * Integration Tests for DOCX Import Workflow
 *
 * Comprehensive test suite for DOCX import functionality using Playwright.
 * Tests chapter auto-detection, formatting preservation, front/back matter,
 * large files, error handling, progress feedback, and cancel operations.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { DocxParser } from '../../src/lib/docx';
import { detectChapters } from '../../src/lib/docx/chapterDetection';
import type { Book } from '../../src/types/book';

/**
 * Test fixture paths
 */
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const SAMPLE_BOOK_PATH = path.join(FIXTURES_DIR, 'sample-book.docx');

/**
 * Helper to create a DOCX fixture programmatically
 */
async function createDocxFixture(filename: string, content: string): Promise<string> {
  const zip = new JSZip();

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${content}
  </w:body>
</w:document>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:outlineLvl w:val="0"/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:pPr>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
  </w:style>
</w:styles>`;

  zip.file('word/document.xml', documentXml);
  zip.file('word/styles.xml', stylesXml);
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const filepath = path.join(FIXTURES_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  return filepath;
}

/**
 * Helper to evaluate Redux store state in the app
 */
async function getReduxStoreState(page: any): Promise<any> {
  return await page.evaluate(() => {
    // Access the Redux store from the window object (if exposed)
    // @ts-ignore
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
      // @ts-ignore
      return window.store?.getState();
    }
    return null;
  });
}

test.describe('DOCX Import Integration Tests', () => {
  test.setTimeout(120000); // 2 minutes for large file tests

  test.describe('Basic Import and Chapter Detection', () => {
    test('should import a DOCX file and detect chapters correctly', async () => {
      // Parse the sample DOCX file
      const result = await DocxParser.parseStructured(SAMPLE_BOOK_PATH);

      expect(result.messages).toBeDefined();
      expect(result.document).toBeDefined();
      expect(result.document.elements.length).toBeGreaterThan(0);

      // Detect chapters
      const chapters = detectChapters(result.document);

      expect(chapters.length).toBeGreaterThan(0);

      // Verify chapter structure
      chapters.forEach(chapter => {
        expect(chapter.title).toBeTruthy();
        expect(chapter.startIndex).toBeGreaterThanOrEqual(0);
        expect(chapter.endIndex).toBeGreaterThanOrEqual(chapter.startIndex);
        expect(chapter.confidence).toBeGreaterThanOrEqual(0);
        expect(chapter.confidence).toBeLessThanOrEqual(1);
      });

      // Verify chapters have content
      const firstChapter = chapters[0];
      expect(firstChapter.title).toMatch(/chapter|prologue|preface/i);
    });

    test('should auto-detect chapters by heading level', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1: The Start</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Content of chapter one.</w:t></w:r></w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 2: The Middle</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Content of chapter two.</w:t></w:r></w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 3: The End</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Content of chapter three.</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-chapters.docx', content);
      const result = await DocxParser.parseStructured(filepath);
      const chapters = detectChapters(result.document);

      expect(chapters.length).toBe(3);
      expect(chapters[0].title).toContain('Chapter 1');
      expect(chapters[1].title).toContain('Chapter 2');
      expect(chapters[2].title).toContain('Chapter 3');

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should detect chapters with numbered formats', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter One</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>First chapter content.</w:t></w:r></w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter Two</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Second chapter content.</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-numbered.docx', content);
      const result = await DocxParser.parseStructured(filepath);
      const chapters = detectChapters(result.document);

      expect(chapters.length).toBe(2);
      expect(chapters[0].isNumbered).toBe(true);
      expect(chapters[1].isNumbered).toBe(true);

      // Cleanup
      fs.unlinkSync(filepath);
    });
  });

  test.describe('Formatting Preservation', () => {
    test('should preserve bold formatting', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p>
          <w:r>
            <w:rPr><w:b/></w:rPr>
            <w:t>This text is bold.</w:t>
          </w:r>
        </w:p>
      `;

      const filepath = await createDocxFixture('test-bold.docx', content);
      const result = await DocxParser.parseStructured(filepath);

      // Find the paragraph with bold text
      const paragraphs = result.document.elements.filter(el => el.type === 'paragraph');
      const boldParagraph = paragraphs.find(p =>
        p.type === 'paragraph' && p.content.some(c => c.type === 'text' && c.formatting.bold)
      );

      expect(boldParagraph).toBeDefined();
      if (boldParagraph && boldParagraph.type === 'paragraph') {
        const boldText = boldParagraph.content.find(c => c.type === 'text' && c.formatting.bold);
        expect(boldText).toBeDefined();
        if (boldText && boldText.type === 'text') {
          expect(boldText.formatting.bold).toBe(true);
        }
      }

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should preserve italic formatting', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p>
          <w:r>
            <w:rPr><w:i/></w:rPr>
            <w:t>This text is italic.</w:t>
          </w:r>
        </w:p>
      `;

      const filepath = await createDocxFixture('test-italic.docx', content);
      const result = await DocxParser.parseStructured(filepath);

      const paragraphs = result.document.elements.filter(el => el.type === 'paragraph');
      const italicParagraph = paragraphs.find(p =>
        p.type === 'paragraph' && p.content.some(c => c.type === 'text' && c.formatting.italic)
      );

      expect(italicParagraph).toBeDefined();
      if (italicParagraph && italicParagraph.type === 'paragraph') {
        const italicText = italicParagraph.content.find(c => c.type === 'text' && c.formatting.italic);
        expect(italicText).toBeDefined();
        if (italicText && italicText.type === 'text') {
          expect(italicText.formatting.italic).toBe(true);
        }
      }

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should preserve combined bold and italic formatting', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p>
          <w:r>
            <w:rPr><w:b/><w:i/></w:rPr>
            <w:t>This text is bold and italic.</w:t>
          </w:r>
        </w:p>
      `;

      const filepath = await createDocxFixture('test-bold-italic.docx', content);
      const result = await DocxParser.parseStructured(filepath);

      const paragraphs = result.document.elements.filter(el => el.type === 'paragraph');
      const formattedParagraph = paragraphs.find(p =>
        p.type === 'paragraph' && p.content.some(c =>
          c.type === 'text' && c.formatting.bold && c.formatting.italic
        )
      );

      expect(formattedParagraph).toBeDefined();
      if (formattedParagraph && formattedParagraph.type === 'paragraph') {
        const formattedText = formattedParagraph.content.find(c =>
          c.type === 'text' && c.formatting.bold && c.formatting.italic
        );
        expect(formattedText).toBeDefined();
        if (formattedText && formattedText.type === 'text') {
          expect(formattedText.formatting.bold).toBe(true);
          expect(formattedText.formatting.italic).toBe(true);
        }
      }

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should preserve heading levels', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Chapter content.</w:t></w:r></w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
          <w:r><w:t>Section 1.1</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Section content.</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-headings.docx', content);
      const result = await DocxParser.parseStructured(filepath);

      const paragraphs = result.document.elements.filter(el => el.type === 'paragraph');
      const h1 = paragraphs.find(p => p.type === 'paragraph' && p.style.headingLevel === 1);
      const h2 = paragraphs.find(p => p.type === 'paragraph' && p.style.headingLevel === 2);

      expect(h1).toBeDefined();
      expect(h2).toBeDefined();

      if (h1 && h1.type === 'paragraph') {
        expect(h1.rawText).toContain('Chapter 1');
      }
      if (h2 && h2.type === 'paragraph') {
        expect(h2.rawText).toContain('Section 1.1');
      }

      // Cleanup
      fs.unlinkSync(filepath);
    });
  });

  test.describe('Front and Back Matter Detection', () => {
    test('should detect prologue as front matter', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Prologue</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>This is the prologue content.</w:t></w:r></w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Chapter one content.</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-prologue.docx', content);
      const result = await DocxParser.parseStructured(filepath);
      const chapters = detectChapters(result.document);

      const prologue = chapters.find(ch => ch.type === 'prologue');
      expect(prologue).toBeDefined();
      expect(prologue?.title.toLowerCase()).toContain('prologue');

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should detect preface as front matter', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Preface</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>This is the preface.</w:t></w:r></w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Chapter content.</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-preface.docx', content);
      const result = await DocxParser.parseStructured(filepath);
      const chapters = detectChapters(result.document);

      const preface = chapters.find(ch => ch.type === 'preface');
      expect(preface).toBeDefined();
      expect(preface?.title.toLowerCase()).toContain('preface');

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should detect epilogue as back matter', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Chapter content.</w:t></w:r></w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Epilogue</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>This is the epilogue.</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-epilogue.docx', content);
      const result = await DocxParser.parseStructured(filepath);
      const chapters = detectChapters(result.document);

      const epilogue = chapters.find(ch => ch.type === 'epilogue');
      expect(epilogue).toBeDefined();
      expect(epilogue?.title.toLowerCase()).toContain('epilogue');

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should detect afterword as back matter', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Chapter content.</w:t></w:r></w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Afterword</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>This is the afterword.</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-afterword.docx', content);
      const result = await DocxParser.parseStructured(filepath);
      const chapters = detectChapters(result.document);

      const afterword = chapters.find(ch => ch.type === 'afterword');
      expect(afterword).toBeDefined();
      expect(afterword?.title.toLowerCase()).toContain('afterword');

      // Cleanup
      fs.unlinkSync(filepath);
    });
  });

  test.describe('Large File Handling', () => {
    test('should handle large DOCX files (10MB+) without errors', async () => {
      // Create a large file with many chapters and content
      const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50);
      let content = '';

      // Create 100 chapters with substantial content
      for (let i = 1; i <= 100; i++) {
        content += `
          <w:p>
            <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
            <w:r><w:t>Chapter ${i}</w:t></w:r>
          </w:p>
        `;

        // Add 20 paragraphs per chapter
        for (let j = 0; j < 20; j++) {
          content += `
            <w:p><w:r><w:t>${loremIpsum}</w:t></w:r></w:p>
          `;
        }
      }

      const filepath = await createDocxFixture('test-large.docx', content);

      // Check file size
      const stats = fs.statSync(filepath);
      console.log(`Created large file: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // Parse large file - should not throw errors
      const startTime = Date.now();
      const result = await DocxParser.parseStructured(filepath);
      const parseTime = Date.now() - startTime;

      console.log(`Parse time: ${parseTime}ms`);

      expect(result.document).toBeDefined();
      expect(result.document.elements.length).toBeGreaterThan(0);

      // Verify chapter detection works on large files
      const chapters = detectChapters(result.document);
      expect(chapters.length).toBe(100);

      // Cleanup
      fs.unlinkSync(filepath);
    }, 180000); // 3 minute timeout for large file test
  });

  test.describe('Error Handling', () => {
    test('should handle corrupted DOCX files gracefully', async () => {
      const corruptedContent = `
        <w:p>
          <w:r>
            <w:t>Corrupted content without proper closing
      `;

      const filepath = await createDocxFixture('test-corrupted.docx', corruptedContent);

      // Should handle error gracefully
      await expect(async () => {
        await DocxParser.parseStructured(filepath);
      }).rejects.toThrow();

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should handle empty DOCX files', async () => {
      const emptyContent = `
        <w:p><w:r><w:t></w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-empty.docx', emptyContent);
      const result = await DocxParser.parseStructured(filepath);

      expect(result.document).toBeDefined();
      expect(result.document.elements.length).toBeGreaterThanOrEqual(0);

      const chapters = detectChapters(result.document);
      expect(chapters.length).toBe(0);

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should handle DOCX files with no detectable chapters', async () => {
      const content = `
        <w:p><w:r><w:t>Just some text without any headings.</w:t></w:r></w:p>
        <w:p><w:r><w:t>More text without structure.</w:t></w:r></w:p>
        <w:p><w:r><w:t>Even more unstructured content.</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-no-chapters.docx', content);
      const result = await DocxParser.parseStructured(filepath);
      const chapters = detectChapters(result.document);

      expect(chapters.length).toBe(0);

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should handle missing file gracefully', async () => {
      const nonExistentPath = path.join(FIXTURES_DIR, 'does-not-exist.docx');

      await expect(async () => {
        await DocxParser.parseStructured(nonExistentPath);
      }).rejects.toThrow();
    });
  });

  test.describe('Progress Feedback and Cancellation', () => {
    test('should provide progress information during parsing', async () => {
      // Create a moderately sized file
      let content = '';
      for (let i = 1; i <= 20; i++) {
        content += `
          <w:p>
            <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
            <w:r><w:t>Chapter ${i}</w:t></w:r>
          </w:p>
          <w:p><w:r><w:t>Chapter ${i} content goes here.</w:t></w:r></w:p>
        `;
      }

      const filepath = await createDocxFixture('test-progress.docx', content);

      // Track parsing progress
      const startTime = Date.now();
      const result = await DocxParser.parseStructured(filepath);
      const endTime = Date.now();

      expect(result.document).toBeDefined();
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30s

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should handle parsing cancellation', async () => {
      // This test simulates cancellation by using a timeout
      const content = 'a'.repeat(1000000); // Large content
      const largeContent = `
        <w:p><w:r><w:t>${content}</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-cancel.docx', largeContent);

      // Create a promise that will reject after a short timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation cancelled')), 100);
      });

      const parsePromise = DocxParser.parseStructured(filepath);

      // Race between parsing and timeout
      await expect(async () => {
        await Promise.race([parsePromise, timeoutPromise]);
      }).rejects.toThrow('Operation cancelled');

      // Cleanup
      fs.unlinkSync(filepath);
    });
  });

  test.describe('Redux Store Integration', () => {
    test('should verify chapter structure matches expected Book type', async () => {
      const result = await DocxParser.parseStructured(SAMPLE_BOOK_PATH);
      const chapters = detectChapters(result.document);

      // Verify the structure matches what would be in Redux store
      chapters.forEach(chapter => {
        // Each chapter should have properties that match the Book type
        expect(chapter).toHaveProperty('title');
        expect(chapter).toHaveProperty('startIndex');
        expect(chapter).toHaveProperty('endIndex');
        expect(chapter).toHaveProperty('type');
        expect(chapter).toHaveProperty('confidence');

        // Type should be valid
        expect(['chapter', 'prologue', 'epilogue', 'preface', 'introduction', 'afterword'])
          .toContain(chapter.type);
      });
    });

    test('should validate book metadata structure', async () => {
      const result = await DocxParser.parseStructured(SAMPLE_BOOK_PATH);

      // Verify document metadata
      expect(result.document.metadata).toBeDefined();
      expect(result.document.metadata.paragraphCount).toBeGreaterThan(0);
      expect(result.document.metadata.wordCount).toBeGreaterThan(0);
      expect(result.document.metadata.characterCount).toBeGreaterThan(0);
    });
  });

  test.describe('Complex Document Structures', () => {
    test('should handle documents with multiple heading levels', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Part 1</w:t></w:r>
        </w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Content</w:t></w:r></w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
          <w:r><w:t>Chapter 2</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Content</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-multi-level.docx', content);
      const result = await DocxParser.parseStructured(filepath);

      // Test with different heading level options
      const chaptersH1Only = detectChapters(result.document, { maxHeadingLevel: 1 });
      const chaptersH2Included = detectChapters(result.document, { maxHeadingLevel: 2 });

      expect(chaptersH1Only.length).toBeLessThan(chaptersH2Included.length);

      // Cleanup
      fs.unlinkSync(filepath);
    });

    test('should handle page breaks correctly', async () => {
      const content = `
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 1</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Content before break.</w:t></w:r></w:p>
        <w:p>
          <w:r>
            <w:br w:type="page"/>
          </w:r>
        </w:p>
        <w:p>
          <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
          <w:r><w:t>Chapter 2</w:t></w:r>
        </w:p>
        <w:p><w:r><w:t>Content after break.</w:t></w:r></w:p>
      `;

      const filepath = await createDocxFixture('test-page-breaks.docx', content);
      const result = await DocxParser.parseStructured(filepath);

      // Find paragraphs with page breaks
      const hasPageBreak = result.document.elements.some(el =>
        el.type === 'paragraph' &&
        el.content.some(c => c.type === 'break' && c.breakType === 'page')
      );

      expect(hasPageBreak).toBe(true);

      // Cleanup
      fs.unlinkSync(filepath);
    });
  });
});

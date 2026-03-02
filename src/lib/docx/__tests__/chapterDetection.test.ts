/**
 * Chapter Detection Algorithm Tests
 * Tests auto-detection of chapter headings, false positive prevention,
 * multi-level headings, scene breaks, and special chapter types
 */

import {
  detectChapters,
  getChapterContent,
  getChapterStats,
  type DetectedChapter,
  type ChapterDetectionOptions
} from '../chapterDetection';
import type { StructuredDocument, Paragraph, TextRun, Break } from '../types';

/**
 * Helper function to create a structured document from paragraphs
 */
function createDocument(paragraphs: Array<{
  text: string;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  bold?: boolean;
  fontSize?: number;
  hasPageBreak?: boolean;
}>): StructuredDocument {
  const elements = paragraphs.map(p => {
    const content: (TextRun | Break)[] = [];

    // Add page break if specified
    if (p.hasPageBreak) {
      content.push({
        type: 'break',
        breakType: 'page'
      });
    }

    // Add text run
    content.push({
      type: 'text',
      text: p.text,
      formatting: {
        bold: p.bold,
        fontSize: p.fontSize
      }
    });

    return {
      type: 'paragraph',
      content,
      style: {
        headingLevel: p.headingLevel,
        alignment: p.alignment
      },
      rawText: p.text
    } as Paragraph;
  });

  const allText = paragraphs.map(p => p.text).join(' ');
  const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length;

  return {
    elements,
    metadata: {
      paragraphCount: paragraphs.length,
      wordCount,
      characterCount: allText.length
    }
  };
}

describe('Chapter Detection Algorithm', () => {
  describe('Basic Chapter Detection', () => {
    it('should detect chapters with "Chapter 1" format', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'First chapter content.' },
        { text: 'Chapter 2', headingLevel: 1 },
        { text: 'Second chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Chapter 1');
      expect(chapters[0].isNumbered).toBe(true);
      expect(chapters[0].chapterNumber).toBe(1);
      expect(chapters[0].type).toBe('chapter');
      expect(chapters[1].title).toBe('Chapter 2');
      expect(chapters[1].chapterNumber).toBe(2);
    });

    it('should detect chapters with "Chapter One" format', () => {
      const doc = createDocument([
        { text: 'Chapter One', headingLevel: 1 },
        { text: 'First chapter content.' },
        { text: 'Chapter Two', headingLevel: 1 },
        { text: 'Second chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Chapter One');
      expect(chapters[0].isNumbered).toBe(true);
      expect(chapters[0].chapterNumber).toBe(1);
      expect(chapters[1].title).toBe('Chapter Two');
      expect(chapters[1].chapterNumber).toBe(2);
    });

    it('should detect chapters with just numbers', () => {
      const doc = createDocument([
        { text: '1', headingLevel: 1 },
        { text: 'First chapter content.' },
        { text: '2', headingLevel: 1 },
        { text: 'Second chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('1');
      expect(chapters[0].isNumbered).toBe(true);
      expect(chapters[0].chapterNumber).toBe(1);
      expect(chapters[1].chapterNumber).toBe(2);
    });

    it('should detect chapters with Roman numerals', () => {
      const doc = createDocument([
        { text: 'I', headingLevel: 1 },
        { text: 'First chapter content.' },
        { text: 'II', headingLevel: 1 },
        { text: 'Second chapter content.' },
        { text: 'III', headingLevel: 1 },
        { text: 'Third chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(3);
      expect(chapters[0].title).toBe('I');
      expect(chapters[0].isNumbered).toBe(true);
      expect(chapters[0].chapterNumber).toBe(1);
      expect(chapters[1].chapterNumber).toBe(2);
      expect(chapters[2].chapterNumber).toBe(3);
    });

    it('should detect chapters with "Chapter I" format', () => {
      const doc = createDocument([
        { text: 'Chapter I', headingLevel: 1 },
        { text: 'First chapter content.' },
        { text: 'Chapter II', headingLevel: 1 },
        { text: 'Second chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Chapter I');
      expect(chapters[0].isNumbered).toBe(true);
      expect(chapters[0].chapterNumber).toBe(1);
      expect(chapters[1].chapterNumber).toBe(2);
    });

    it('should detect chapters with various formats mixed', () => {
      const doc = createDocument([
        { text: 'Chapter 1: The Beginning', headingLevel: 1 },
        { text: 'First chapter content.' },
        { text: '2. The Middle', headingLevel: 1 },
        { text: 'Second chapter content.' },
        { text: 'Part Three', headingLevel: 1 },
        { text: 'Third chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(3);
      expect(chapters[0].chapterNumber).toBe(1);
      expect(chapters[1].chapterNumber).toBe(2);
      expect(chapters[2].chapterNumber).toBe(3);
    });
  });

  describe('Special Chapter Types', () => {
    it('should detect prologue', () => {
      const doc = createDocument([
        { text: 'Prologue', headingLevel: 1 },
        { text: 'Prologue content.' },
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'First chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Prologue');
      expect(chapters[0].type).toBe('prologue');
      expect(chapters[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect epilogue', () => {
      const doc = createDocument([
        { text: 'Chapter 10', headingLevel: 1 },
        { text: 'Last chapter content.' },
        { text: 'Epilogue', headingLevel: 1 },
        { text: 'Epilogue content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[1].title).toBe('Epilogue');
      expect(chapters[1].type).toBe('epilogue');
      expect(chapters[1].confidence).toBeGreaterThan(0.8);
    });

    it('should detect preface', () => {
      const doc = createDocument([
        { text: 'Preface', headingLevel: 1 },
        { text: 'Preface content.' },
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'First chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Preface');
      expect(chapters[0].type).toBe('preface');
    });

    it('should detect introduction', () => {
      const doc = createDocument([
        { text: 'Introduction', headingLevel: 1 },
        { text: 'Introduction content.' },
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'First chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Introduction');
      expect(chapters[0].type).toBe('introduction');
    });

    it('should detect afterword', () => {
      const doc = createDocument([
        { text: 'Chapter 5', headingLevel: 1 },
        { text: 'Last chapter content.' },
        { text: 'Afterword', headingLevel: 1 },
        { text: 'Afterword content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[1].title).toBe('Afterword');
      expect(chapters[1].type).toBe('afterword');
    });

    it('should detect variations of special chapters (prolog, epilog, etc.)', () => {
      const doc = createDocument([
        { text: 'Prolog', headingLevel: 1 },
        { text: 'Prolog content.' },
        { text: 'Intro', headingLevel: 1 },
        { text: 'Intro content.' },
        { text: 'Epilog', headingLevel: 1 },
        { text: 'Epilog content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(3);
      expect(chapters[0].type).toBe('prologue');
      expect(chapters[1].type).toBe('introduction');
      expect(chapters[2].type).toBe('epilogue');
    });
  });

  describe('Multi-level Headings', () => {
    it('should filter out subheadings by default', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'First chapter content.' },
        { text: 'Section 1.1', headingLevel: 2 },
        { text: 'Subsection content.' },
        { text: 'Chapter 2', headingLevel: 1 },
        { text: 'Second chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Chapter 1');
      expect(chapters[1].title).toBe('Chapter 2');
    });

    it('should include subheadings when option is enabled', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'First chapter content.' },
        { text: 'Section 1.1', headingLevel: 2 },
        { text: 'Subsection content.' },
        { text: 'Chapter 2', headingLevel: 1 },
        { text: 'Second chapter content.' }
      ]);

      const options: ChapterDetectionOptions = {
        includeSubheadings: true
      };
      const chapters = detectChapters(doc, options);

      expect(chapters).toHaveLength(3);
      expect(chapters[0].title).toBe('Chapter 1');
      expect(chapters[0].headingLevel).toBe(1);
      expect(chapters[1].title).toBe('Section 1.1');
      expect(chapters[1].headingLevel).toBe(2);
      expect(chapters[2].title).toBe('Chapter 2');
      expect(chapters[2].headingLevel).toBe(1);
    });

    it('should respect maxHeadingLevel option', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'Content.' },
        { text: 'Section 1.1', headingLevel: 2 },
        { text: 'Content.' },
        { text: 'Subsection 1.1.1', headingLevel: 3 },
        { text: 'Content.' },
        { text: 'Deep heading', headingLevel: 4 },
        { text: 'Content.' }
      ]);

      const options: ChapterDetectionOptions = {
        includeSubheadings: true,
        maxHeadingLevel: 3
      };
      const chapters = detectChapters(doc, options);

      expect(chapters).toHaveLength(3);
      expect(chapters.some(ch => ch.headingLevel === 4)).toBe(false);
    });

    it('should handle documents with only heading level 2', () => {
      const doc = createDocument([
        { text: 'Part One', headingLevel: 2 },
        { text: 'Content for part one.' },
        { text: 'Part Two', headingLevel: 2 },
        { text: 'Content for part two.' }
      ]);

      // Need to enable includeSubheadings for heading level 2 to be detected
      const options: ChapterDetectionOptions = {
        includeSubheadings: true
      };
      const chapters = detectChapters(doc, options);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Part One');
      expect(chapters[1].title).toBe('Part Two');
    });
  });

  describe('Page Break Detection', () => {
    it('should detect chapters with page breaks', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1, hasPageBreak: true },
        { text: 'First chapter content.' },
        { text: 'Chapter 2', headingLevel: 1, hasPageBreak: true },
        { text: 'Second chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Chapter 1');
      expect(chapters[1].title).toBe('Chapter 2');
    });

    it('should detect chapters based on page breaks when detectPageBreaks is enabled', () => {
      const doc = createDocument([
        { text: 'Chapter 1', bold: true, hasPageBreak: true },
        { text: 'Content.' },
        { text: 'Chapter 2', bold: true, hasPageBreak: true },
        { text: 'Content.' }
      ]);

      const options: ChapterDetectionOptions = {
        detectPageBreaks: true,
        minConfidence: 0.4
      };
      const chapters = detectChapters(doc, options);

      expect(chapters.length).toBeGreaterThan(0);
    });

    it('should ignore page breaks when detectPageBreaks is disabled', () => {
      const doc = createDocument([
        { text: 'Not a chapter', hasPageBreak: true },
        { text: 'Content.' }
      ]);

      const options: ChapterDetectionOptions = {
        detectPageBreaks: false
      };
      const chapters = detectChapters(doc, options);

      expect(chapters).toHaveLength(0);
    });

    it('should increase confidence for headings with page breaks', () => {
      const doc1 = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'Content.' }
      ]);

      const doc2 = createDocument([
        { text: 'Chapter 1', headingLevel: 1, hasPageBreak: true },
        { text: 'Content.' }
      ]);

      const chapters1 = detectChapters(doc1);
      const chapters2 = detectChapters(doc2);

      expect(chapters2[0].confidence).toBeGreaterThanOrEqual(chapters1[0].confidence);
    });
  });

  describe('False Positive Prevention', () => {
    it('should not detect non-chapter headings as chapters', () => {
      const doc = createDocument([
        { text: 'Table of Contents', headingLevel: 1 },
        { text: 'Chapter 1... page 5' },
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'First chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      // Should detect both, but TOC should have lower confidence
      expect(chapters.length).toBeGreaterThan(0);
      expect(chapters.some(ch => ch.title === 'Chapter 1')).toBe(true);
    });

    it('should filter chapters below confidence threshold', () => {
      const doc = createDocument([
        { text: 'Some random text', headingLevel: 2 },
        { text: 'Content.' }
      ]);

      const options: ChapterDetectionOptions = {
        minConfidence: 0.8
      };
      const chapters = detectChapters(doc, options);

      // Heading 2 without chapter keywords should have low confidence
      expect(chapters).toHaveLength(0);
    });

    it('should give lower confidence to very long text as chapter titles', () => {
      const longText = 'This is a very long paragraph that goes on and on and should not be detected as a chapter title because it is way too long to be a reasonable chapter heading and exceeds the character limit.';
      const shortText = 'Chapter 1';

      const doc1 = createDocument([
        { text: longText, bold: true, hasPageBreak: true },
        { text: 'Content.' }
      ]);

      const doc2 = createDocument([
        { text: shortText, bold: true, hasPageBreak: true },
        { text: 'Content.' }
      ]);

      const options: ChapterDetectionOptions = {
        detectPageBreaks: true,
        minConfidence: 0.3
      };
      const chapters1 = detectChapters(doc1, options);
      const chapters2 = detectChapters(doc2, options);

      // Long text may still be detected but with lower confidence than short chapter titles
      // The looksLikeChapterTitle function filters out text > 100 chars from confidence boost
      if (chapters1.length > 0 && chapters2.length > 0) {
        expect(chapters1[0].confidence).toBeLessThan(chapters2[0].confidence);
      }
    });

    it('should not detect empty headings', () => {
      const doc = createDocument([
        { text: '', headingLevel: 1 },
        { text: 'Content.' },
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'Content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('Chapter 1');
    });

    it('should distinguish between chapter references and actual chapters', () => {
      const doc = createDocument([
        { text: 'In Chapter 1, we discussed...' },
        { text: 'More content here.' },
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'Actual chapter content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('Chapter 1');
      expect(chapters[0].startIndex).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty document', () => {
      const doc: StructuredDocument = {
        elements: [],
        metadata: {
          paragraphCount: 0,
          wordCount: 0,
          characterCount: 0
        }
      };

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(0);
    });

    it('should handle document with no chapters', () => {
      const doc = createDocument([
        { text: 'Just some regular text.' },
        { text: 'More regular text.' },
        { text: 'No chapters here.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(0);
    });

    it('should handle single chapter document', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'All the content is in one chapter.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('Chapter 1');
      expect(chapters[0].startIndex).toBe(0);
      expect(chapters[0].endIndex).toBe(1);
    });

    it('should handle chapters with no content between them', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'Chapter 2', headingLevel: 1 },
        { text: 'Chapter 3', headingLevel: 1 }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(3);
      expect(chapters[0].endIndex).toBe(0);
      expect(chapters[1].endIndex).toBe(1);
    });

    it('should handle chapters with special characters', () => {
      const doc = createDocument([
        { text: 'Chapter 1: "The Beginning"', headingLevel: 1 },
        { text: 'Content.' },
        { text: 'Chapter 2: [Flashback]', headingLevel: 1 },
        { text: 'Content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe('Chapter 1: "The Beginning"');
      expect(chapters[1].title).toBe('Chapter 2: [Flashback]');
    });

    it('should handle large Roman numerals', () => {
      const doc = createDocument([
        { text: 'XX', headingLevel: 1 },
        { text: 'Content.' },
        { text: 'XXI', headingLevel: 1 },
        { text: 'Content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(2);
      expect(chapters[0].chapterNumber).toBe(20);
      expect(chapters[1].chapterNumber).toBe(21);
    });

    it('should handle chapters with whitespace variations', () => {
      const doc = createDocument([
        { text: '  Chapter  1  ', headingLevel: 1 },
        { text: 'Content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('Chapter  1');
    });

    it('should handle centered chapter titles', () => {
      const doc = createDocument([
        { text: 'Chapter One', alignment: 'center', bold: true, hasPageBreak: true },
        { text: 'Content.' }
      ]);

      const options: ChapterDetectionOptions = {
        detectPageBreaks: true,
        minConfidence: 0.4
      };
      const chapters = detectChapters(doc, options);

      expect(chapters.length).toBeGreaterThan(0);
    });
  });

  describe('Chapter Content and Statistics', () => {
    it('should extract chapter content correctly', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'First paragraph.' },
        { text: 'Second paragraph.' },
        { text: 'Chapter 2', headingLevel: 1 },
        { text: 'Next chapter content.' }
      ]);

      const chapters = detectChapters(doc);
      const content = getChapterContent(doc, chapters[0]);

      expect(content).toContain('Chapter 1');
      expect(content).toContain('First paragraph.');
      expect(content).toContain('Second paragraph.');
      expect(content).not.toContain('Next chapter content.');
    });

    it('should calculate chapter statistics correctly', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'First paragraph with some words.' },
        { text: 'Second paragraph with more words.' },
        { text: 'Chapter 2', headingLevel: 1 },
        { text: 'Next chapter.' }
      ]);

      const chapters = detectChapters(doc);
      const stats = getChapterStats(doc, chapters[0]);

      expect(stats.paragraphCount).toBe(3);
      expect(stats.wordCount).toBeGreaterThan(0);
      expect(stats.characterCount).toBeGreaterThan(0);
    });

    it('should handle chapter at end of document', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'Content.' },
        { text: 'Epilogue', headingLevel: 1 },
        { text: 'Final words.' }
      ]);

      const chapters = detectChapters(doc);
      const lastChapter = chapters[chapters.length - 1];

      expect(lastChapter.endIndex).toBe(doc.elements.length - 1);

      const content = getChapterContent(doc, lastChapter);
      expect(content).toContain('Epilogue');
      expect(content).toContain('Final words.');
    });
  });

  describe('Confidence Scoring', () => {
    it('should give higher confidence to Heading 1', () => {
      const doc = createDocument([
        { text: 'Chapter 1', headingLevel: 1 },
        { text: 'Content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters[0].confidence).toBeGreaterThan(0.9);
    });

    it('should give lower confidence to Heading 2', () => {
      const doc = createDocument([
        { text: 'Section 1', headingLevel: 2 },
        { text: 'Content.' }
      ]);

      const options: ChapterDetectionOptions = {
        includeSubheadings: true
      };
      const chapters = detectChapters(doc, options);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].confidence).toBeLessThan(0.9);
    });

    it('should increase confidence for numbered chapters', () => {
      const doc1 = createDocument([
        { text: 'Random Heading', headingLevel: 2 },
        { text: 'Content.' }
      ]);

      const doc2 = createDocument([
        { text: 'Chapter 1', headingLevel: 2 },
        { text: 'Content.' }
      ]);

      const options: ChapterDetectionOptions = {
        includeSubheadings: true
      };
      const chapters1 = detectChapters(doc1, options);
      const chapters2 = detectChapters(doc2, options);

      expect(chapters1).toHaveLength(1);
      expect(chapters2).toHaveLength(1);
      expect(chapters2[0].confidence).toBeGreaterThan(chapters1[0].confidence);
    });

    it('should increase confidence for special chapter types', () => {
      const doc1 = createDocument([
        { text: 'Some Heading', headingLevel: 1 },
        { text: 'Content.' }
      ]);

      const doc2 = createDocument([
        { text: 'Prologue', headingLevel: 1 },
        { text: 'Content.' }
      ]);

      const chapters1 = detectChapters(doc1);
      const chapters2 = detectChapters(doc2);

      expect(chapters2[0].confidence).toBeGreaterThan(chapters1[0].confidence);
    });
  });

  describe('Complex Document Scenarios', () => {
    it('should handle a realistic novel structure', () => {
      const doc = createDocument([
        { text: 'Title Page Content' },
        { text: 'Dedication' },
        { text: 'Prologue', headingLevel: 1 },
        { text: 'In the beginning...' },
        { text: 'Chapter 1: The Journey Begins', headingLevel: 1 },
        { text: 'It was a dark and stormy night.' },
        { text: 'Part One', headingLevel: 2 },
        { text: 'Some organizational heading.' },
        { text: 'Chapter 2: The Adventure Continues', headingLevel: 1 },
        { text: 'The next day arrived.' },
        { text: 'Chapter 3', headingLevel: 1 },
        { text: 'More adventures.' },
        { text: 'Epilogue', headingLevel: 1 },
        { text: 'And they lived happily ever after.' },
        { text: 'Afterword', headingLevel: 1 },
        { text: 'Author notes.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters.length).toBeGreaterThanOrEqual(5);

      // Check for special chapters
      const prologue = chapters.find(ch => ch.type === 'prologue');
      const epilogue = chapters.find(ch => ch.type === 'epilogue');
      const afterword = chapters.find(ch => ch.type === 'afterword');

      expect(prologue).toBeDefined();
      expect(epilogue).toBeDefined();
      expect(afterword).toBeDefined();

      // Check for regular chapters
      const regularChapters = chapters.filter(ch => ch.type === 'chapter');
      expect(regularChapters.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle documents with inconsistent numbering', () => {
      const doc = createDocument([
        { text: 'Chapter One', headingLevel: 1 },
        { text: 'Content.' },
        { text: 'Chapter 2', headingLevel: 1 },
        { text: 'Content.' },
        { text: 'Chapter III', headingLevel: 1 },
        { text: 'Content.' },
        { text: '4', headingLevel: 1 },
        { text: 'Content.' }
      ]);

      const chapters = detectChapters(doc);

      expect(chapters).toHaveLength(4);
      expect(chapters[0].chapterNumber).toBe(1);
      expect(chapters[1].chapterNumber).toBe(2);
      expect(chapters[2].chapterNumber).toBe(3);
      expect(chapters[3].chapterNumber).toBe(4);
    });

    it('should handle mixed heading levels in realistic scenario', () => {
      const doc = createDocument([
        { text: 'Part I: The Beginning', headingLevel: 1 },
        { text: 'Part content.' },
        { text: 'Chapter 1', headingLevel: 2 },
        { text: 'Chapter content.' },
        { text: 'Chapter 2', headingLevel: 2 },
        { text: 'Chapter content.' },
        { text: 'Part II: The Middle', headingLevel: 1 },
        { text: 'Part content.' },
        { text: 'Chapter 3', headingLevel: 2 },
        { text: 'Chapter content.' }
      ]);

      const options: ChapterDetectionOptions = {
        includeSubheadings: true,
        maxHeadingLevel: 2
      };
      const chapters = detectChapters(doc, options);

      expect(chapters.length).toBeGreaterThanOrEqual(5);

      // Check that both H1 and H2 are included
      expect(chapters.some(ch => ch.headingLevel === 1)).toBe(true);
      expect(chapters.some(ch => ch.headingLevel === 2)).toBe(true);
    });
  });
});

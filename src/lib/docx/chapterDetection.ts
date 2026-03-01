/**
 * Chapter Auto-Detection Algorithm
 * Detects chapter boundaries from parsed DOCX structure
 */

import type { StructuredDocument, Paragraph, DocumentElement } from './types';

export interface DetectedChapter {
  title: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  type: 'chapter' | 'prologue' | 'epilogue' | 'preface' | 'introduction' | 'afterword';
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  isNumbered: boolean;
  chapterNumber?: number;
}

export interface ChapterDetectionOptions {
  /** Minimum confidence threshold (0-1) for chapter detection */
  minConfidence?: number;
  /** Whether to include subheadings (Heading 2+) as separate chapters */
  includeSubheadings?: boolean;
  /** Maximum heading level to consider as chapter markers (default: 2) */
  maxHeadingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Treat page breaks as potential chapter boundaries */
  detectPageBreaks?: boolean;
}

interface ChapterCandidate {
  index: number;
  title: string;
  confidence: number;
  headingLevel?: number;
  hasPageBreak: boolean;
  type: DetectedChapter['type'];
  isNumbered: boolean;
  chapterNumber?: number;
}

/**
 * Detect chapters from a structured DOCX document
 */
export function detectChapters(
  document: StructuredDocument,
  options: ChapterDetectionOptions = {}
): DetectedChapter[] {
  const {
    minConfidence = 0.5,
    includeSubheadings = false,
    maxHeadingLevel = 2,
    detectPageBreaks = true
  } = options;

  // Find all chapter candidates
  const candidates = findChapterCandidates(
    document.elements,
    maxHeadingLevel,
    detectPageBreaks
  );

  if (candidates.length === 0) {
    return [];
  }

  // Convert candidates to detected chapters with start/end indices
  const chapters: DetectedChapter[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    // Filter by confidence threshold
    if (candidate.confidence < minConfidence) {
      continue;
    }

    // Filter by subheading option
    if (!includeSubheadings && candidate.headingLevel && candidate.headingLevel > 1) {
      continue;
    }

    const startIndex = candidate.index;
    const endIndex = i < candidates.length - 1
      ? candidates[i + 1].index - 1
      : document.elements.length - 1;

    chapters.push({
      title: candidate.title,
      startIndex,
      endIndex,
      confidence: candidate.confidence,
      type: candidate.type,
      headingLevel: candidate.headingLevel as any,
      isNumbered: candidate.isNumbered,
      chapterNumber: candidate.chapterNumber
    });
  }

  return chapters;
}

/**
 * Find chapter candidates in the document
 */
function findChapterCandidates(
  elements: DocumentElement[],
  maxHeadingLevel: number,
  detectPageBreaks: boolean
): ChapterCandidate[] {
  const candidates: ChapterCandidate[] = [];

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    if (element.type !== 'paragraph') {
      continue;
    }

    const paragraph = element as Paragraph;

    // Check for heading-based chapters
    if (paragraph.style.headingLevel && paragraph.style.headingLevel <= maxHeadingLevel) {
      const candidate = analyzeHeadingCandidate(paragraph, i, elements);
      if (candidate) {
        candidates.push(candidate);
      }
    }
    // Check for page break-based chapters
    else if (detectPageBreaks && hasPageBreak(paragraph)) {
      const candidate = analyzePageBreakCandidate(paragraph, i, elements);
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

/**
 * Analyze a heading-based chapter candidate
 */
function analyzeHeadingCandidate(
  paragraph: Paragraph,
  index: number,
  elements: DocumentElement[]
): ChapterCandidate | null {
  const title = paragraph.rawText.trim();

  if (!title || title.length === 0) {
    return null;
  }

  // Base confidence for headings
  let confidence = 0.7;

  // Increase confidence for Heading 1
  if (paragraph.style.headingLevel === 1) {
    confidence = 0.95;
  }

  // Detect special chapter types
  const type = detectChapterType(title);

  // Increase confidence for known chapter types
  if (type !== 'chapter') {
    confidence = Math.min(confidence + 0.15, 1.0);
  }

  // Detect chapter numbering
  const numberInfo = extractChapterNumber(title);

  if (numberInfo.isNumbered) {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  // Check for page break before this heading
  const hasPageBreakBefore = index > 0 && hasPageBreak(elements[index - 1] as Paragraph);
  if (hasPageBreakBefore) {
    confidence = Math.min(confidence + 0.05, 1.0);
  }

  return {
    index,
    title,
    confidence,
    headingLevel: paragraph.style.headingLevel,
    hasPageBreak: hasPageBreakBefore || hasPageBreak(paragraph),
    type,
    isNumbered: numberInfo.isNumbered,
    chapterNumber: numberInfo.number
  };
}

/**
 * Analyze a page break-based chapter candidate
 */
function analyzePageBreakCandidate(
  paragraph: Paragraph,
  index: number,
  elements: DocumentElement[]
): ChapterCandidate | null {
  const title = paragraph.rawText.trim();

  if (!title || title.length === 0) {
    return null;
  }

  // Look ahead to find potential chapter title (within next 3 paragraphs)
  let chapterTitle = title;
  let actualIndex = index;

  for (let j = index; j < Math.min(index + 3, elements.length); j++) {
    const nextElement = elements[j];
    if (nextElement.type === 'paragraph') {
      const nextPara = nextElement as Paragraph;
      const nextText = nextPara.rawText.trim();

      if (nextText.length > 0) {
        // Check if this looks like a chapter title
        if (looksLikeChapterTitle(nextText, nextPara)) {
          chapterTitle = nextText;
          actualIndex = j;
          break;
        }
      }
    }
  }

  // Base confidence for page break detection is lower
  let confidence = 0.4;

  // Increase confidence if title looks like a chapter
  if (looksLikeChapterTitle(chapterTitle, paragraph)) {
    confidence = 0.6;
  }

  const type = detectChapterType(chapterTitle);
  const numberInfo = extractChapterNumber(chapterTitle);

  if (numberInfo.isNumbered) {
    confidence = Math.min(confidence + 0.15, 1.0);
  }

  return {
    index: actualIndex,
    title: chapterTitle,
    confidence,
    headingLevel: undefined,
    hasPageBreak: true,
    type,
    isNumbered: numberInfo.isNumbered,
    chapterNumber: numberInfo.number
  };
}

/**
 * Check if a paragraph contains a page break
 */
function hasPageBreak(element: DocumentElement): boolean {
  if (element.type !== 'paragraph') {
    return false;
  }

  const paragraph = element as Paragraph;

  return paragraph.content.some(
    content => content.type === 'break' && content.breakType === 'page'
  );
}

/**
 * Detect special chapter types (prologue, epilogue, etc.)
 */
function detectChapterType(title: string): DetectedChapter['type'] {
  const lowerTitle = title.toLowerCase();

  // Check for prologue variations
  if (/^(prologue|prolog)$/i.test(lowerTitle)) {
    return 'prologue';
  }

  // Check for epilogue variations
  if (/^(epilogue|epilog)$/i.test(lowerTitle)) {
    return 'epilogue';
  }

  // Check for preface
  if (/^(preface|foreword)$/i.test(lowerTitle)) {
    return 'preface';
  }

  // Check for introduction
  if (/^(introduction|intro)$/i.test(lowerTitle)) {
    return 'introduction';
  }

  // Check for afterword
  if (/^(afterword|postscript)$/i.test(lowerTitle)) {
    return 'afterword';
  }

  return 'chapter';
}

/**
 * Extract chapter number from title
 */
function extractChapterNumber(title: string): { isNumbered: boolean; number?: number } {
  // Pattern 1: "Chapter 1", "Chapter One", etc.
  const chapterPattern = /^(?:chapter|ch\.?|part)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)/i;
  const match1 = title.match(chapterPattern);

  if (match1) {
    const numStr = match1[1];
    const number = parseNumber(numStr);
    return { isNumbered: true, number };
  }

  // Pattern 2: Roman numerals (I, II, III, etc.)
  const romanPattern = /^(?:chapter\s+)?([IVXLCDM]+)(?:\s|$|:|\.)/i;
  const match2 = title.match(romanPattern);

  if (match2) {
    const number = parseRomanNumeral(match2[1]);
    return { isNumbered: number !== null, number: number ?? undefined };
  }

  // Pattern 3: Just a number at the start
  const numberPattern = /^(\d+)(?:\s|$|:|\.)/;
  const match3 = title.match(numberPattern);

  if (match3) {
    return { isNumbered: true, number: parseInt(match3[1]) };
  }

  return { isNumbered: false };
}

/**
 * Parse word numbers (one, two, three, etc.) to integers
 */
function parseNumber(str: string): number | undefined {
  const wordMap: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12
  };

  const lower = str.toLowerCase();
  if (wordMap[lower] !== undefined) {
    return wordMap[lower];
  }

  const num = parseInt(str);
  return isNaN(num) ? undefined : num;
}

/**
 * Parse Roman numerals to integers
 */
function parseRomanNumeral(roman: string): number | null {
  const romanMap: Record<string, number> = {
    'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
  };

  let result = 0;
  const upper = roman.toUpperCase();

  for (let i = 0; i < upper.length; i++) {
    const current = romanMap[upper[i]];
    const next = romanMap[upper[i + 1]];

    if (!current) {
      return null; // Invalid Roman numeral
    }

    if (next && current < next) {
      result += next - current;
      i++; // Skip next character
    } else {
      result += current;
    }
  }

  return result;
}

/**
 * Heuristic to determine if text looks like a chapter title
 */
function looksLikeChapterTitle(text: string, paragraph: Paragraph): boolean {
  // Short titles are more likely to be chapter titles
  if (text.length > 100) {
    return false;
  }

  // Check for common chapter keywords
  const hasChapterKeyword = /^(chapter|ch\.?|part|section|prologue|epilogue|preface|introduction|afterword)/i.test(text);
  if (hasChapterKeyword) {
    return true;
  }

  // Check for centering (common for chapter titles)
  if (paragraph.style.alignment === 'center') {
    return true;
  }

  // Check for bold formatting
  const hasBoldFormatting = paragraph.content.some(
    content => content.type === 'text' && content.formatting.bold
  );
  if (hasBoldFormatting) {
    return true;
  }

  // Check for larger font size
  const hasLargeFont = paragraph.content.some(
    content => content.type === 'text' && content.formatting.fontSize && content.formatting.fontSize > 14
  );
  if (hasLargeFont) {
    return true;
  }

  return false;
}

/**
 * Get the text content of a chapter (between start and end indices)
 */
export function getChapterContent(
  document: StructuredDocument,
  chapter: DetectedChapter
): string {
  const elements = document.elements.slice(chapter.startIndex, chapter.endIndex + 1);

  return elements
    .filter(el => el.type === 'paragraph')
    .map(el => (el as Paragraph).rawText)
    .join('\n');
}

/**
 * Get chapter statistics
 */
export function getChapterStats(
  document: StructuredDocument,
  chapter: DetectedChapter
): {
  paragraphCount: number;
  wordCount: number;
  characterCount: number;
} {
  const elements = document.elements.slice(chapter.startIndex, chapter.endIndex + 1);
  const paragraphs = elements.filter(el => el.type === 'paragraph') as Paragraph[];

  const text = paragraphs.map(p => p.rawText).join(' ');
  const words = text.split(/\s+/).filter(w => w.length > 0);

  return {
    paragraphCount: paragraphs.length,
    wordCount: words.length,
    characterCount: text.length
  };
}

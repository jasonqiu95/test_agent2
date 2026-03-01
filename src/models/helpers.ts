/**
 * Helper functions for working with models
 */

import {
  Book,
  Chapter,
  Element,
  TextBlock,
  TextFeature,
} from '../types';

/**
 * Calculate word count for a text block
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate total word count for an array of text blocks
 */
export function countTextBlockWords(blocks: TextBlock[]): number {
  return blocks.reduce((total, block) => total + countWords(block.content), 0);
}

/**
 * Calculate word count for a chapter
 */
export function calculateChapterWordCount(chapter: Chapter): number {
  return countTextBlockWords(chapter.content);
}

/**
 * Calculate total word count for a book
 */
export function calculateBookWordCount(book: Book): number {
  let total = 0;

  // Front matter
  book.frontMatter.forEach(element => {
    total += countTextBlockWords(element.content);
  });

  // Chapters
  book.chapters.forEach(chapter => {
    total += calculateChapterWordCount(chapter);
  });

  // Back matter
  book.backMatter.forEach(element => {
    total += countTextBlockWords(element.content);
  });

  return total;
}

/**
 * Sort chapters by number
 */
export function sortChapters(chapters: Chapter[]): Chapter[] {
  return [...chapters].sort((a, b) => {
    const aNum = a.number ?? 0;
    const bNum = b.number ?? 0;
    return aNum - bNum;
  });
}

/**
 * Sort elements by order
 */
export function sortElements(elements: Element[]): Element[] {
  return [...elements].sort((a, b) => {
    const aOrder = a.order ?? 0;
    const bOrder = b.order ?? 0;
    return aOrder - bOrder;
  });
}

/**
 * Get all text features of a specific type from a text block
 */
export function getTextFeaturesByType<T extends TextFeature>(
  block: TextBlock,
  type: TextFeature['type']
): T[] {
  return (block.features?.filter(feature => feature.type === type) ?? []) as T[];
}

/**
 * Get all chapters in a specific part
 */
export function getChaptersByPart(
  chapters: Chapter[],
  partNumber: number
): Chapter[] {
  return chapters.filter(chapter => chapter.partNumber === partNumber);
}

/**
 * Get all front matter elements of a specific type
 */
export function getFrontMatterByType(
  book: Book,
  type: Element['type']
): Element[] {
  return book.frontMatter.filter(element => element.type === type);
}

/**
 * Get all back matter elements of a specific type
 */
export function getBackMatterByType(
  book: Book,
  type: Element['type']
): Element[] {
  return book.backMatter.filter(element => element.type === type);
}

/**
 * Update metadata timestamp
 */
export function touchMetadata<T extends { updatedAt: Date; version?: number }>(
  item: T,
  updatedBy?: string
): T {
  return {
    ...item,
    updatedAt: new Date(),
    updatedBy,
    version: (item.version ?? 0) + 1,
  };
}

/**
 * Check if a chapter is numbered
 */
export function isNumberedChapter(chapter: Chapter): boolean {
  return chapter.number !== undefined && chapter.number > 0;
}

/**
 * Generate a table of contents entry
 */
export interface TocEntry {
  title: string;
  type: 'chapter' | 'element';
  number?: number;
  id: string;
}

/**
 * Generate table of contents for a book
 */
export function generateTableOfContents(book: Book): TocEntry[] {
  const toc: TocEntry[] = [];

  // Front matter
  book.frontMatter
    .filter(element => element.includeInToc)
    .forEach(element => {
      toc.push({
        title: element.title,
        type: 'element',
        id: element.id,
      });
    });

  // Chapters
  book.chapters
    .filter(chapter => chapter.includeInToc ?? true)
    .forEach(chapter => {
      toc.push({
        title: chapter.title,
        type: 'chapter',
        number: chapter.number,
        id: chapter.id,
      });
    });

  // Back matter
  book.backMatter
    .filter(element => element.includeInToc)
    .forEach(element => {
      toc.push({
        title: element.title,
        type: 'element',
        id: element.id,
      });
    });

  return toc;
}

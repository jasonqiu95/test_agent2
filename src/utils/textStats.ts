/**
 * Text Statistics Utility
 * Provides functions to calculate word counts, character counts, page estimates, and reading time
 */

export interface TextStats {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  pages: number;
  readingTimeMinutes: number;
}

const WORDS_PER_PAGE = 250;
const WORDS_PER_MINUTE = 200;

/**
 * Count words in a text string
 * Handles hyphenated words and contractions as single words
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Split by whitespace and filter out empty strings
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  return words.length;
}

/**
 * Count characters with spaces
 */
export function countCharactersWithSpaces(text: string): number {
  return text.length;
}

/**
 * Count characters without spaces
 */
export function countCharactersWithoutSpaces(text: string): number {
  return text.replace(/\s/g, '').length;
}

/**
 * Estimate number of pages based on word count
 * Uses industry standard of 250 words per page
 */
export function estimatePages(wordCount: number): number {
  if (wordCount === 0) {
    return 0;
  }
  return Math.ceil(wordCount / WORDS_PER_PAGE);
}

/**
 * Estimate reading time in minutes based on word count
 * Uses average reading speed of 200 words per minute
 */
export function estimateReadingTime(wordCount: number): number {
  if (wordCount === 0) {
    return 0;
  }
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}

/**
 * Format reading time as a human-readable string
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 0) {
    return '0 min';
  }
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Strip formatting markup from text
 */
export function stripMarkup(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')      // Bold
    .replace(/\*(.*?)\*/g, '$1')          // Italic
    .replace(/__(.*?)__/g, '$1')          // Bold
    .replace(/_(.*?)_/g, '$1')            // Italic
    .replace(/`(.*?)`/g, '$1')            // Inline code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')   // Links
    .replace(/#+\s/g, '');                // Headers
}

/**
 * Calculate all text statistics for a given text string
 */
export function calculateTextStats(text: string): TextStats {
  const cleanText = stripMarkup(text);
  const words = countWords(cleanText);

  return {
    words,
    charactersWithSpaces: countCharactersWithSpaces(cleanText),
    charactersWithoutSpaces: countCharactersWithoutSpaces(cleanText),
    pages: estimatePages(words),
    readingTimeMinutes: estimateReadingTime(words),
  };
}

/**
 * Calculate combined statistics for multiple text strings
 */
export function calculateCombinedStats(texts: string[]): TextStats {
  const combined = texts.join(' ');
  return calculateTextStats(combined);
}

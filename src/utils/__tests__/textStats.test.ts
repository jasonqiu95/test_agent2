/**
 * Text Statistics Utility Tests
 */

import {
  countWords,
  countCharactersWithSpaces,
  countCharactersWithoutSpaces,
  estimatePages,
  estimateReadingTime,
  formatReadingTime,
  stripMarkup,
  calculateTextStats,
  calculateCombinedStats,
} from '../textStats';

describe('textStats', () => {
  describe('countWords', () => {
    it('should count words in a simple sentence', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('The quick brown fox')).toBe(4);
    });

    it('should handle empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('should handle whitespace only', () => {
      expect(countWords('   ')).toBe(0);
      expect(countWords('\n\t  ')).toBe(0);
    });

    it('should handle multiple spaces between words', () => {
      expect(countWords('Hello    world')).toBe(2);
      expect(countWords('One  two   three')).toBe(3);
    });

    it('should handle contractions as single words', () => {
      expect(countWords("don't won't can't")).toBe(3);
      expect(countWords("it's you're we're")).toBe(3);
    });

    it('should handle hyphenated words as single words', () => {
      expect(countWords('twenty-one self-aware state-of-the-art')).toBe(3);
    });

    it('should handle punctuation', () => {
      expect(countWords('Hello, world!')).toBe(2);
      expect(countWords("How's it going?")).toBe(3);
    });

    it('should handle newlines and tabs', () => {
      expect(countWords('Hello\nworld')).toBe(2);
      expect(countWords('Hello\tworld')).toBe(2);
    });
  });

  describe('countCharactersWithSpaces', () => {
    it('should count all characters including spaces', () => {
      expect(countCharactersWithSpaces('Hello world')).toBe(11);
      expect(countCharactersWithSpaces('Test  123')).toBe(9);
    });

    it('should handle empty string', () => {
      expect(countCharactersWithSpaces('')).toBe(0);
    });

    it('should count spaces', () => {
      expect(countCharactersWithSpaces('   ')).toBe(3);
    });

    it('should count newlines and tabs', () => {
      expect(countCharactersWithSpaces('Hello\nworld')).toBe(11);
      expect(countCharactersWithSpaces('Hello\tworld')).toBe(11);
    });
  });

  describe('countCharactersWithoutSpaces', () => {
    it('should count characters excluding spaces', () => {
      expect(countCharactersWithoutSpaces('Hello world')).toBe(10);
      expect(countCharactersWithoutSpaces('Test  123')).toBe(7);
    });

    it('should handle empty string', () => {
      expect(countCharactersWithoutSpaces('')).toBe(0);
    });

    it('should return 0 for spaces only', () => {
      expect(countCharactersWithoutSpaces('   ')).toBe(0);
    });

    it('should exclude newlines and tabs', () => {
      expect(countCharactersWithoutSpaces('Hello\nworld')).toBe(10);
      expect(countCharactersWithoutSpaces('Hello\tworld')).toBe(10);
    });
  });

  describe('estimatePages', () => {
    it('should estimate pages at 250 words per page', () => {
      expect(estimatePages(250)).toBe(1);
      expect(estimatePages(500)).toBe(2);
      expect(estimatePages(1000)).toBe(4);
    });

    it('should round up partial pages', () => {
      expect(estimatePages(251)).toBe(2);
      expect(estimatePages(300)).toBe(2);
      expect(estimatePages(499)).toBe(2);
    });

    it('should handle zero words', () => {
      expect(estimatePages(0)).toBe(0);
    });

    it('should handle small word counts', () => {
      expect(estimatePages(1)).toBe(1);
      expect(estimatePages(10)).toBe(1);
      expect(estimatePages(100)).toBe(1);
    });

    it('should handle large word counts', () => {
      expect(estimatePages(10000)).toBe(40);
      expect(estimatePages(100000)).toBe(400);
    });
  });

  describe('estimateReadingTime', () => {
    it('should estimate reading time at 200 words per minute', () => {
      expect(estimateReadingTime(200)).toBe(1);
      expect(estimateReadingTime(400)).toBe(2);
      expect(estimateReadingTime(1000)).toBe(5);
    });

    it('should round up partial minutes', () => {
      expect(estimateReadingTime(201)).toBe(2);
      expect(estimateReadingTime(300)).toBe(2);
      expect(estimateReadingTime(399)).toBe(2);
    });

    it('should handle zero words', () => {
      expect(estimateReadingTime(0)).toBe(0);
    });

    it('should handle small word counts', () => {
      expect(estimateReadingTime(1)).toBe(1);
      expect(estimateReadingTime(10)).toBe(1);
      expect(estimateReadingTime(100)).toBe(1);
    });

    it('should handle large word counts', () => {
      expect(estimateReadingTime(10000)).toBe(50);
      expect(estimateReadingTime(100000)).toBe(500);
    });
  });

  describe('formatReadingTime', () => {
    it('should format minutes', () => {
      expect(formatReadingTime(0)).toBe('0 min');
      expect(formatReadingTime(1)).toBe('1 min');
      expect(formatReadingTime(30)).toBe('30 min');
      expect(formatReadingTime(59)).toBe('59 min');
    });

    it('should format hours', () => {
      expect(formatReadingTime(60)).toBe('1h');
      expect(formatReadingTime(120)).toBe('2h');
      expect(formatReadingTime(180)).toBe('3h');
    });

    it('should format hours and minutes', () => {
      expect(formatReadingTime(61)).toBe('1h 1m');
      expect(formatReadingTime(90)).toBe('1h 30m');
      expect(formatReadingTime(125)).toBe('2h 5m');
      expect(formatReadingTime(185)).toBe('3h 5m');
    });

    it('should handle large durations', () => {
      expect(formatReadingTime(500)).toBe('8h 20m');
      expect(formatReadingTime(1000)).toBe('16h 40m');
    });
  });

  describe('stripMarkup', () => {
    it('should strip bold markdown', () => {
      expect(stripMarkup('**bold text**')).toBe('bold text');
      expect(stripMarkup('__bold text__')).toBe('bold text');
    });

    it('should strip italic markdown', () => {
      expect(stripMarkup('*italic text*')).toBe('italic text');
      expect(stripMarkup('_italic text_')).toBe('italic text');
    });

    it('should strip inline code', () => {
      expect(stripMarkup('`code here`')).toBe('code here');
    });

    it('should strip links', () => {
      expect(stripMarkup('[link text](https://example.com)')).toBe('link text');
    });

    it('should strip headers', () => {
      expect(stripMarkup('# Header')).toBe('Header');
      expect(stripMarkup('## Header')).toBe('Header');
      expect(stripMarkup('### Header')).toBe('Header');
    });

    it('should handle multiple formatting types', () => {
      expect(stripMarkup('**bold** and *italic* with `code`')).toBe('bold and italic with code');
    });

    it('should handle plain text', () => {
      expect(stripMarkup('plain text')).toBe('plain text');
    });

    it('should handle empty string', () => {
      expect(stripMarkup('')).toBe('');
    });
  });

  describe('calculateTextStats', () => {
    it('should calculate all stats for simple text', () => {
      const stats = calculateTextStats('Hello world');

      expect(stats.words).toBe(2);
      expect(stats.charactersWithSpaces).toBe(11);
      expect(stats.charactersWithoutSpaces).toBe(10);
      expect(stats.pages).toBe(1);
      expect(stats.readingTimeMinutes).toBe(1);
    });

    it('should calculate stats for text with markup', () => {
      const stats = calculateTextStats('**bold** and *italic*');

      // After stripping: "bold and italic" = 3 words, 15 chars with spaces, 13 without
      expect(stats.words).toBe(3);
      expect(stats.charactersWithSpaces).toBe(15);
      expect(stats.charactersWithoutSpaces).toBe(13);
    });

    it('should handle empty text', () => {
      const stats = calculateTextStats('');

      expect(stats.words).toBe(0);
      expect(stats.charactersWithSpaces).toBe(0);
      expect(stats.charactersWithoutSpaces).toBe(0);
      expect(stats.pages).toBe(0);
      expect(stats.readingTimeMinutes).toBe(0);
    });

    it('should calculate stats for long text', () => {
      const words = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(' ');
      const stats = calculateTextStats(words);

      expect(stats.words).toBe(1000);
      expect(stats.pages).toBe(4); // 1000 / 250 = 4
      expect(stats.readingTimeMinutes).toBe(5); // 1000 / 200 = 5
    });
  });

  describe('calculateCombinedStats', () => {
    it('should combine stats from multiple texts', () => {
      const texts = ['Hello world', 'The quick brown fox', 'jumps over'];
      const stats = calculateCombinedStats(texts);

      // Total: 2 + 4 + 2 = 8 words
      expect(stats.words).toBe(8);
    });

    it('should handle empty array', () => {
      const stats = calculateCombinedStats([]);

      expect(stats.words).toBe(0);
      expect(stats.charactersWithSpaces).toBe(0);
      expect(stats.charactersWithoutSpaces).toBe(0);
      expect(stats.pages).toBe(0);
      expect(stats.readingTimeMinutes).toBe(0);
    });

    it('should handle array with empty strings', () => {
      const texts = ['', '  ', 'Hello'];
      const stats = calculateCombinedStats(texts);

      expect(stats.words).toBe(1);
    });

    it('should strip markup from all texts', () => {
      const texts = ['**bold**', '*italic*', '`code`'];
      const stats = calculateCombinedStats(texts);

      // After stripping: "bold italic code" = 3 words
      expect(stats.words).toBe(3);
    });
  });
});

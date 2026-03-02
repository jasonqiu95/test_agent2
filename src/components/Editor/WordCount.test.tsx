/**
 * WordCount Component Tests
 * Tests for word count functionality including real-time updates, accuracy, and formatting
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WordCount } from './WordCount';
import { TextBlock } from '../../types/textBlock';

// Helper to create a text block
const createTextBlock = (content: string, id: string = `block-${Date.now()}`): TextBlock => ({
  id,
  content,
  blockType: 'paragraph',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('WordCount', () => {
  describe('Word count updates on typing', () => {
    it('should update word count when content changes', () => {
      const { rerender } = render(<WordCount content={[createTextBlock('Hello')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('1 word');

      rerender(<WordCount content={[createTextBlock('Hello world')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('2 words');

      rerender(<WordCount content={[createTextBlock('Hello world from React')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('4 words');
    });

    it('should update word count across multiple blocks', () => {
      const { rerender } = render(
        <WordCount
          content={[
            createTextBlock('First block', 'block-1'),
            createTextBlock('Second block', 'block-2'),
          ]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('4 words');

      rerender(
        <WordCount
          content={[
            createTextBlock('First block', 'block-1'),
            createTextBlock('Second block with more words', 'block-2'),
          ]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('7 words');
    });
  });

  describe('Word count accuracy with punctuation and special characters', () => {
    it('should count words with punctuation correctly', () => {
      render(
        <WordCount
          content={[createTextBlock("Hello, world! How's it going?")]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('5 words');
    });

    it('should handle contractions as single words', () => {
      render(
        <WordCount
          content={[createTextBlock("don't won't can't shouldn't")]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('4 words');
    });

    it('should handle hyphens correctly', () => {
      render(
        <WordCount
          content={[createTextBlock('twenty-one self-aware state-of-the-art')]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('3 words');
    });

    it('should handle numbers and mixed alphanumeric content', () => {
      render(
        <WordCount
          content={[createTextBlock('123 test123 456abc 789')]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('4 words');
    });

    it('should handle special characters and symbols', () => {
      render(
        <WordCount
          content={[createTextBlock('test @ # $ % ^ & * ( ) word')]}
        />
      );
      // Special characters by themselves are counted as separate words when split by whitespace
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('10 words');
    });

    it('should handle multiple consecutive spaces', () => {
      render(
        <WordCount
          content={[createTextBlock('word1     word2   word3')]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('3 words');
    });

    it('should handle tabs and newlines', () => {
      render(
        <WordCount
          content={[createTextBlock('word1\tword2\nword3\r\nword4')]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('4 words');
    });
  });

  describe('Word count excludes formatting markup', () => {
    it('should exclude bold markdown syntax', () => {
      render(
        <WordCount
          content={[createTextBlock('This is **bold text** here')]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('5 words');
    });

    it('should exclude italic markdown syntax', () => {
      render(
        <WordCount
          content={[createTextBlock('This is *italic text* here')]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('5 words');
    });

    it('should exclude underscore bold and italic syntax', () => {
      render(
        <WordCount
          content={[createTextBlock('This is __bold__ and _italic_ text')]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('6 words');
    });

    it('should exclude inline code markdown', () => {
      render(
        <WordCount
          content={[createTextBlock('Use `const variable` in code')]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('5 words');
    });

    it('should exclude link markdown syntax', () => {
      render(
        <WordCount
          content={[createTextBlock('Visit [Google](https://google.com) now')]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('3 words');
    });

    it('should exclude header markdown syntax', () => {
      render(
        <WordCount
          content={[
            createTextBlock('# Header One'),
            createTextBlock('## Header Two'),
            createTextBlock('### Header Three'),
          ]}
        />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('6 words');
    });

    it('should handle mixed formatting markup', () => {
      render(
        <WordCount
          content={[
            createTextBlock('**Bold** and *italic* with `code` and [link](url)'),
          ]}
        />
      );
      // After stripping markup: "Bold and italic with code and link" = 7 words
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('7 words');
    });
  });

  describe('Character count (with and without spaces)', () => {
    it('should display character count with spaces when enabled', () => {
      render(
        <WordCount
          content={[createTextBlock('Hello world')]}
          showCharactersWithSpaces={true}
        />
      );
      expect(screen.getByTestId('word-count-chars-with-spaces')).toHaveTextContent(
        '11 characters'
      );
    });

    it('should display character count without spaces when enabled', () => {
      render(
        <WordCount
          content={[createTextBlock('Hello world')]}
          showCharactersWithoutSpaces={true}
        />
      );
      expect(screen.getByTestId('word-count-chars-without-spaces')).toHaveTextContent(
        '10 characters'
      );
    });

    it('should display both character counts when both are enabled', () => {
      render(
        <WordCount
          content={[createTextBlock('Hello world')]}
          showCharactersWithSpaces={true}
          showCharactersWithoutSpaces={true}
        />
      );
      expect(screen.getByTestId('word-count-chars-with-spaces')).toHaveTextContent(
        '11 characters'
      );
      expect(screen.getByTestId('word-count-chars-without-spaces')).toHaveTextContent(
        '10 characters'
      );
    });

    it('should not display character counts by default', () => {
      render(<WordCount content={[createTextBlock('Hello world')]} />);
      expect(screen.queryByTestId('word-count-chars-with-spaces')).not.toBeInTheDocument();
      expect(screen.queryByTestId('word-count-chars-without-spaces')).not.toBeInTheDocument();
    });

    it('should count characters correctly with punctuation', () => {
      render(
        <WordCount
          content={[createTextBlock("Hello, world! How's it going?")]}
          showCharactersWithSpaces={true}
          showCharactersWithoutSpaces={true}
        />
      );
      // "Hello, world! How's it going?" = 29 characters with spaces, 25 without
      expect(screen.getByTestId('word-count-chars-with-spaces')).toHaveTextContent(
        '29 characters'
      );
      expect(screen.getByTestId('word-count-chars-without-spaces')).toHaveTextContent(
        '25 characters'
      );
    });

    it('should strip formatting markup before counting characters', () => {
      render(
        <WordCount
          content={[createTextBlock('**bold** *italic*')]}
          showCharactersWithSpaces={true}
          showCharactersWithoutSpaces={true}
        />
      );
      // 'bold italic' = 11 with space, 10 without
      expect(screen.getByTestId('word-count-chars-with-spaces')).toHaveTextContent(
        '11 characters'
      );
      expect(screen.getByTestId('word-count-chars-without-spaces')).toHaveTextContent(
        '10 characters'
      );
    });
  });

  describe('Word count for empty content shows 0', () => {
    it('should show 0 words for empty content array', () => {
      render(<WordCount content={[]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('0 words');
    });

    it('should show 0 words for blocks with empty strings', () => {
      render(<WordCount content={[createTextBlock('')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('0 words');
    });

    it('should show 0 words for blocks with only whitespace', () => {
      render(<WordCount content={[createTextBlock('   \n\t  ')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('0 words');
    });

    it('should show 0 characters for empty content when character counts enabled', () => {
      render(
        <WordCount
          content={[]}
          showCharactersWithSpaces={true}
          showCharactersWithoutSpaces={true}
        />
      );
      expect(screen.getByTestId('word-count-chars-with-spaces')).toHaveTextContent(
        '0 characters'
      );
      expect(screen.getByTestId('word-count-chars-without-spaces')).toHaveTextContent(
        '0 characters'
      );
    });

    it('should use singular form for 1 word', () => {
      render(<WordCount content={[createTextBlock('word')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('1 word');
    });
  });

  describe('Word count updates after paste operations', () => {
    it('should update word count after pasting single line', () => {
      const { rerender } = render(<WordCount content={[createTextBlock('Initial')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('1 word');

      // Simulate paste by updating content
      rerender(<WordCount content={[createTextBlock('Initial pasted content here')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('4 words');
    });

    it('should update word count after pasting multiple paragraphs', () => {
      const { rerender } = render(<WordCount content={[createTextBlock('Initial')]} />);

      // Simulate paste of multi-paragraph content
      const pastedContent = `First paragraph with some words.

Second paragraph with more content.

Third paragraph here.`;
      rerender(<WordCount content={[createTextBlock(pastedContent)]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('13 words');
    });

    it('should handle paste with formatting markup', () => {
      const { rerender } = render(<WordCount content={[createTextBlock('Initial')]} />);

      // Simulate paste with markdown formatting
      const pastedContent = '**Bold text** and *italic text* with `code`';
      rerender(<WordCount content={[createTextBlock(pastedContent)]} />);
      // After stripping markup: "Bold text and italic text with code" = 7 words
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('7 words');
    });
  });

  describe('Real-time vs debounced updates', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should update immediately when debounceMs is 0 (real-time)', () => {
      const { rerender } = render(
        <WordCount content={[createTextBlock('Hello')]} debounceMs={0} />
      );
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('1 word');

      rerender(<WordCount content={[createTextBlock('Hello world')]} debounceMs={0} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('2 words');
    });

    it('should update immediately by default (no debounce)', () => {
      const { rerender } = render(<WordCount content={[createTextBlock('Hello')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('1 word');

      rerender(<WordCount content={[createTextBlock('Hello world')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('2 words');
    });

    it('should delay updates when debounceMs is set', async () => {
      const { rerender } = render(
        <WordCount content={[createTextBlock('Hello')]} debounceMs={300} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('word-count-words')).toHaveTextContent('1 word');
      });

      // Change content - should not update immediately
      rerender(<WordCount content={[createTextBlock('Hello world')]} debounceMs={300} />);

      // Should still show old value
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('1 word');

      // Fast-forward time
      jest.advanceTimersByTime(300);

      // Now should show updated value
      await waitFor(() => {
        expect(screen.getByTestId('word-count-words')).toHaveTextContent('2 words');
      });
    });

    it('should cancel previous debounce timeout on rapid changes', async () => {
      const { rerender } = render(
        <WordCount content={[createTextBlock('One')]} debounceMs={500} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('word-count-words')).toHaveTextContent('1 word');
      });

      // First change
      rerender(<WordCount content={[createTextBlock('One two')]} debounceMs={500} />);
      jest.advanceTimersByTime(200);

      // Second change before timeout
      rerender(<WordCount content={[createTextBlock('One two three')]} debounceMs={500} />);
      jest.advanceTimersByTime(200);

      // Third change before timeout
      rerender(<WordCount content={[createTextBlock('One two three four')]} debounceMs={500} />);

      // Should still show initial value
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('1 word');

      // Complete the debounce period
      jest.advanceTimersByTime(500);

      // Should show final value
      await waitFor(() => {
        expect(screen.getByTestId('word-count-words')).toHaveTextContent('4 words');
      });
    });
  });

  describe('Word count display formatting (1,234 words)', () => {
    it('should format numbers with commas by default', () => {
      // Create content with enough words to require comma formatting (>1000 words)
      const largeContent = Array.from({ length: 100 }, (_, i) =>
        createTextBlock(`Block ${i + 1} with some additional text content here to increase word count significantly`, `block-${i}`)
      );
      render(<WordCount content={largeContent} />);

      const wordCountText = screen.getByTestId('word-count-words').textContent || '';
      expect(wordCountText).toMatch(/,/); // Should contain comma (>1000 words)
      expect(wordCountText).toContain('words');
    });

    it('should format 1,000 with comma', () => {
      // Create content with exactly 1000 words
      const words = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      expect(screen.getByTestId('word-count-words')).toHaveTextContent('1,000 words');
    });

    it('should format 10,234 with comma', () => {
      // Create content with exactly 10,234 words
      const words = Array.from({ length: 10234 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      expect(screen.getByTestId('word-count-words')).toHaveTextContent('10,234 words');
    });

    it('should not format numbers when formatNumbers is false', () => {
      const words = Array.from({ length: 1234 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} formatNumbers={false} />);

      expect(screen.getByTestId('word-count-words')).toHaveTextContent('1234 words');
    });

    it('should format character counts with commas', () => {
      const words = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(' ');
      render(
        <WordCount
          content={[createTextBlock(words)]}
          showCharactersWithSpaces={true}
          showCharactersWithoutSpaces={true}
        />
      );

      const charsWithSpaces = screen.getByTestId('word-count-chars-with-spaces').textContent || '';
      const charsWithoutSpaces = screen.getByTestId('word-count-chars-without-spaces').textContent || '';

      // Should contain commas in formatted numbers
      expect(charsWithSpaces).toMatch(/,/);
      expect(charsWithoutSpaces).toMatch(/,/);
    });

    it('should not format small numbers with commas', () => {
      render(<WordCount content={[createTextBlock('one two three')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('3 words');
      expect(screen.getByTestId('word-count-words').textContent).not.toMatch(/,/);
    });
  });

  describe('Page count estimate (250 words/page)', () => {
    it('should display page count estimate by default', () => {
      const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      // 300 words = 2 pages (at 250 words/page)
      expect(screen.getByTestId('word-count-pages')).toHaveTextContent('2 pages');
    });

    it('should calculate 1 page for 250 words', () => {
      const words = Array.from({ length: 250 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      expect(screen.getByTestId('word-count-pages')).toHaveTextContent('1 page');
    });

    it('should calculate 2 pages for 251 words', () => {
      const words = Array.from({ length: 251 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      expect(screen.getByTestId('word-count-pages')).toHaveTextContent('2 pages');
    });

    it('should calculate 4 pages for 1000 words', () => {
      const words = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      expect(screen.getByTestId('word-count-pages')).toHaveTextContent('4 pages');
    });

    it('should not display page count when showPageCount is false', () => {
      const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} showPageCount={false} />);

      expect(screen.queryByTestId('word-count-pages')).not.toBeInTheDocument();
    });

    it('should not display page count for empty content', () => {
      render(<WordCount content={[]} />);
      expect(screen.queryByTestId('word-count-pages')).not.toBeInTheDocument();
    });

    it('should use singular form for 1 page', () => {
      const words = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      expect(screen.getByTestId('word-count-pages')).toHaveTextContent('1 page');
    });
  });

  describe('Reading time estimate (200 WPM)', () => {
    it('should display reading time estimate by default', () => {
      const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      // 300 words = 2 min (at 200 WPM)
      expect(screen.getByTestId('word-count-reading-time')).toHaveTextContent('2 min read');
    });

    it('should calculate 1 min for 200 words', () => {
      const words = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      expect(screen.getByTestId('word-count-reading-time')).toHaveTextContent('1 min read');
    });

    it('should calculate 2 min for 201 words', () => {
      const words = Array.from({ length: 201 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      expect(screen.getByTestId('word-count-reading-time')).toHaveTextContent('2 min read');
    });

    it('should calculate 5 min for 1000 words', () => {
      const words = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      expect(screen.getByTestId('word-count-reading-time')).toHaveTextContent('5 min read');
    });

    it('should format hours when reading time is 60+ minutes', () => {
      const words = Array.from({ length: 12000 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      // 12000 words = 60 min = 1h
      expect(screen.getByTestId('word-count-reading-time')).toHaveTextContent('1h read');
    });

    it('should format hours and minutes when reading time has remainder', () => {
      const words = Array.from({ length: 13000 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} />);

      // 13000 words = 65 min = 1h 5m
      expect(screen.getByTestId('word-count-reading-time')).toHaveTextContent('1h 5m read');
    });

    it('should not display reading time when showReadingTime is false', () => {
      const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
      render(<WordCount content={[createTextBlock(words)]} showReadingTime={false} />);

      expect(screen.queryByTestId('word-count-reading-time')).not.toBeInTheDocument();
    });

    it('should not display reading time for empty content', () => {
      render(<WordCount content={[]} />);
      expect(screen.queryByTestId('word-count-reading-time')).not.toBeInTheDocument();
    });
  });

  describe('Label support for different contexts', () => {
    it('should display label when provided', () => {
      render(<WordCount content={[createTextBlock('test')]} label="Chapter:" />);
      expect(screen.getByTestId('word-count-label')).toHaveTextContent('Chapter:');
    });

    it('should support "Selection:" label', () => {
      render(<WordCount content={[createTextBlock('test')]} label="Selection:" />);
      expect(screen.getByTestId('word-count-label')).toHaveTextContent('Selection:');
    });

    it('should support "Book:" label', () => {
      render(<WordCount content={[createTextBlock('test')]} label="Book:" />);
      expect(screen.getByTestId('word-count-label')).toHaveTextContent('Book:');
    });

    it('should not display label when not provided', () => {
      render(<WordCount content={[createTextBlock('test')]} />);
      expect(screen.queryByTestId('word-count-label')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle very long text efficiently', () => {
      const veryLongText = Array.from({ length: 10000 }, (_, i) => `word${i}`).join(' ');
      const { rerender } = render(<WordCount content={[createTextBlock(veryLongText)]} />);

      expect(screen.getByTestId('word-count-words')).toHaveTextContent('10,000 words');

      // Should handle rerender efficiently
      rerender(<WordCount content={[createTextBlock(veryLongText + ' extra')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('10,001 words');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <WordCount content={[createTextBlock('test')]} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should have proper data-testid for testing', () => {
      render(<WordCount content={[createTextBlock('test')]} />);
      expect(screen.getByTestId('word-count')).toBeInTheDocument();
    });

    it('should handle content with unicode characters', () => {
      render(<WordCount content={[createTextBlock('Hello 世界 🌍')]} />);
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('3 words');
    });

    it('should handle multiple blocks with mixed content', () => {
      render(
        <WordCount
          content={[
            createTextBlock('First block', 'block-1'),          // 2 words
            createTextBlock('', 'block-2'),                     // 0 words
            createTextBlock('   ', 'block-3'),                  // 0 words
            createTextBlock('**Bold** content', 'block-4'),     // 2 words (Bold + content)
            createTextBlock('Regular text here', 'block-5'),    // 3 words
          ]}
        />
      );
      // Total: 2 + 0 + 0 + 2 + 3 = 7 words
      expect(screen.getByTestId('word-count-words')).toHaveTextContent('7 words');
    });

    it('should display all stats together', () => {
      const words = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ');
      render(
        <WordCount
          content={[createTextBlock(words)]}
          showCharactersWithSpaces={true}
          showCharactersWithoutSpaces={true}
          showPageCount={true}
          showReadingTime={true}
          label="Chapter:"
        />
      );

      expect(screen.getByTestId('word-count-label')).toBeInTheDocument();
      expect(screen.getByTestId('word-count-words')).toBeInTheDocument();
      expect(screen.getByTestId('word-count-chars-with-spaces')).toBeInTheDocument();
      expect(screen.getByTestId('word-count-chars-without-spaces')).toBeInTheDocument();
      expect(screen.getByTestId('word-count-pages')).toBeInTheDocument();
      expect(screen.getByTestId('word-count-reading-time')).toBeInTheDocument();
    });
  });
});

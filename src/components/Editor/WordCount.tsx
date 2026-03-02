/**
 * WordCount Component
 * Displays word and character counts for editor content
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TextBlock } from '../../types/textBlock';
import { countWords } from '../../models/helpers';

export interface WordCountProps {
  content: TextBlock[];
  /** Debounce delay in milliseconds. Set to 0 for real-time updates */
  debounceMs?: number;
  /** Show character count with spaces */
  showCharactersWithSpaces?: boolean;
  /** Show character count without spaces */
  showCharactersWithoutSpaces?: boolean;
  /** Format numbers with commas (e.g., 1,234) */
  formatNumbers?: boolean;
  className?: string;
}

interface CountStats {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
}

/**
 * Calculate statistics from text content, excluding formatting markup
 */
function calculateStats(content: TextBlock[]): CountStats {
  let totalWords = 0;
  let totalCharsWithSpaces = 0;
  let totalCharsWithoutSpaces = 0;

  content.forEach((block) => {
    // Strip formatting markup from content (simple approach - strips common markdown)
    const cleanContent = block.content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1')     // Italic
      .replace(/__(.*?)__/g, '$1')     // Bold
      .replace(/_(.*?)_/g, '$1')       // Italic
      .replace(/`(.*?)`/g, '$1')       // Inline code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .replace(/#+\s/g, '');           // Headers

    // Count words using the helper function
    totalWords += countWords(cleanContent);

    // Count characters with spaces
    totalCharsWithSpaces += cleanContent.length;

    // Count characters without spaces
    totalCharsWithoutSpaces += cleanContent.replace(/\s/g, '').length;
  });

  return {
    words: totalWords,
    charactersWithSpaces: totalCharsWithSpaces,
    charactersWithoutSpaces: totalCharsWithoutSpaces,
  };
}

/**
 * Format number with thousands separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export const WordCount: React.FC<WordCountProps> = ({
  content,
  debounceMs = 0,
  showCharactersWithSpaces = false,
  showCharactersWithoutSpaces = false,
  formatNumbers = true,
  className = '',
}) => {
  // Calculate stats immediately for real-time display
  const immediateStats = useMemo(() => calculateStats(content), [content]);

  // Store debounced stats separately
  const [debouncedStats, setDebouncedStats] = useState<CountStats>(immediateStats);

  // Handle debouncing
  useEffect(() => {
    if (debounceMs === 0) {
      // No debounce - use immediate stats
      setDebouncedStats(immediateStats);
      return;
    }

    // Debounce the stats update
    const timeoutId = setTimeout(() => {
      setDebouncedStats(immediateStats);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [immediateStats, debounceMs]);

  // Use debounced stats if debouncing is enabled, otherwise use immediate stats
  const displayStats = debounceMs > 0 ? debouncedStats : immediateStats;

  const formatCount = (count: number) => {
    return formatNumbers ? formatNumber(count) : count.toString();
  };

  return (
    <div className={`word-count ${className}`.trim()} data-testid="word-count">
      <span className="word-count-item" data-testid="word-count-words">
        {formatCount(displayStats.words)} {displayStats.words === 1 ? 'word' : 'words'}
      </span>

      {showCharactersWithSpaces && (
        <span className="word-count-item" data-testid="word-count-chars-with-spaces">
          {formatCount(displayStats.charactersWithSpaces)} characters
        </span>
      )}

      {showCharactersWithoutSpaces && (
        <span className="word-count-item" data-testid="word-count-chars-without-spaces">
          {formatCount(displayStats.charactersWithoutSpaces)} characters (no spaces)
        </span>
      )}
    </div>
  );
};

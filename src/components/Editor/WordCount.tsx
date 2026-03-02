/**
 * WordCount Component
 * Displays word and character counts for editor content
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TextBlock } from '../../types/textBlock';
import {
  calculateTextStats,
  stripMarkup,
  formatReadingTime,
  type TextStats
} from '../../utils/textStats';

export interface WordCountProps {
  content: TextBlock[];
  /** Debounce delay in milliseconds. Set to 0 for real-time updates */
  debounceMs?: number;
  /** Show character count with spaces */
  showCharactersWithSpaces?: boolean;
  /** Show character count without spaces */
  showCharactersWithoutSpaces?: boolean;
  /** Show page count estimate (250 words/page) */
  showPageCount?: boolean;
  /** Show reading time estimate (200 WPM) */
  showReadingTime?: boolean;
  /** Format numbers with commas (e.g., 1,234) */
  formatNumbers?: boolean;
  /** Label prefix for the stats (e.g., "Selection:", "Chapter:", "Book:") */
  label?: string;
  className?: string;
}

interface CountStats {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  pages: number;
  readingTimeMinutes: number;
}

/**
 * Calculate statistics from text content, excluding formatting markup
 */
function calculateStats(content: TextBlock[]): CountStats {
  // Combine all block content
  const combinedText = content
    .map(block => stripMarkup(block.content))
    .join(' ');

  // Calculate stats using the utility
  const stats = calculateTextStats(combinedText);

  return stats;
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
  showPageCount = true,
  showReadingTime = true,
  formatNumbers = true,
  label,
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
      {label && (
        <span className="word-count-label" data-testid="word-count-label">
          {label}
        </span>
      )}

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

      {showPageCount && displayStats.pages > 0 && (
        <span className="word-count-item" data-testid="word-count-pages">
          {formatCount(displayStats.pages)} {displayStats.pages === 1 ? 'page' : 'pages'}
        </span>
      )}

      {showReadingTime && displayStats.readingTimeMinutes > 0 && (
        <span className="word-count-item" data-testid="word-count-reading-time">
          {formatReadingTime(displayStats.readingTimeMinutes)} read
        </span>
      )}
    </div>
  );
};

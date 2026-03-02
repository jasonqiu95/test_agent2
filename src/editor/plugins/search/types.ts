/**
 * Search query configuration
 */
export interface SearchQuery {
  /** The search query string */
  query: string;
  /** Whether the search is case-sensitive */
  caseSensitive: boolean;
  /** Whether to use regular expression matching */
  regex: boolean;
  /** Whether to match whole words only */
  wholeWord: boolean;
}

/**
 * Represents a single search match in the document
 */
export interface SearchMatch {
  /** Starting position of the match */
  from: number;
  /** Ending position of the match */
  to: number;
  /** Index of this match in the matches array */
  index: number;
}

/**
 * State of the search plugin
 */
export interface SearchPluginState {
  /** The current search query and options */
  query: SearchQuery | null;
  /** Search options */
  options: {
    caseSensitive: boolean;
    regex: boolean;
    wholeWord: boolean;
  };
  /** Array of all matches found in the document */
  matches: SearchMatch[];
  /** Index of the currently active match (-1 if none) */
  currentMatchIndex: number;
}

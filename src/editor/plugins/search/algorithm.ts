/**
 * Search algorithm for finding text matches in ProseMirror documents
 * Supports plain text, regex, case-sensitive, and whole word matching
 */

import { Node as PMNode } from 'prosemirror-model';
import { SearchMatch, SearchQuery } from './types';

/**
 * Interface for tracking text and position mappings
 */
interface TextBlock {
  text: string;
  start: number;
}

/**
 * Escapes special regex characters in a string
 * @param str - The string to escape
 * @returns The escaped string safe for use in regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a regex pattern from search query and options
 * @param query - The search query configuration
 * @returns A RegExp object configured with the appropriate flags and pattern
 */
function createSearchRegex(query: SearchQuery): RegExp | null {
  try {
    let pattern: string;

    if (query.regex) {
      // Use the query string as-is for regex mode
      pattern = query.query;
    } else {
      // Escape special characters for plain text search
      pattern = escapeRegex(query.query);
    }

    // Wrap in word boundaries if whole word matching is enabled
    if (query.wholeWord && !query.regex) {
      pattern = `\\b${pattern}\\b`;
    } else if (query.wholeWord && query.regex) {
      // For regex mode with whole word, only add boundaries if not already present
      if (!pattern.startsWith('\\b')) {
        pattern = `\\b${pattern}`;
      }
      if (!pattern.endsWith('\\b')) {
        pattern = `${pattern}\\b`;
      }
    }

    // Set flags: 'g' for global, 'i' for case-insensitive (if not case-sensitive)
    const flags = query.caseSensitive ? 'g' : 'gi';

    return new RegExp(pattern, flags);
  } catch (error) {
    // Invalid regex pattern
    return null;
  }
}

/**
 * Extracts text content from a ProseMirror document with position mapping
 * @param doc - The ProseMirror document node
 * @returns Array of text blocks with their starting positions
 */
function extractTextBlocks(doc: PMNode): TextBlock[] {
  const blocks: TextBlock[] = [];

  doc.descendants((node, pos) => {
    // Only process text nodes
    if (node.isText && node.text) {
      blocks.push({
        text: node.text,
        start: pos,
      });
    }
    return true; // Continue traversing
  });

  return blocks;
}

/**
 * Extracts full text content from a ProseMirror document
 * Used for regex matching across the entire document
 * @param doc - The ProseMirror document node
 * @returns The full text content and position map
 */
function extractFullText(doc: PMNode): { text: string; positionMap: number[] } {
  let fullText = '';
  const positionMap: number[] = [];

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i++) {
        fullText += node.text[i];
        positionMap.push(pos + i);
      }
    }
    return true;
  });

  return { text: fullText, positionMap };
}

/**
 * Finds all matches in text blocks using regex
 * @param blocks - Array of text blocks with positions
 * @param regex - The regex pattern to match
 * @returns Array of SearchMatch objects
 */
function findMatchesInBlocks(blocks: TextBlock[], regex: RegExp): SearchMatch[] {
  const matches: SearchMatch[] = [];
  let index = 0;

  for (const block of blocks) {
    // Reset regex lastIndex for each block
    regex.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(block.text)) !== null) {
      const from = block.start + match.index;
      const to = from + match[0].length;

      matches.push({
        from,
        to,
        index: index++,
      });

      // Prevent infinite loops on zero-width matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
  }

  return matches;
}

/**
 * Finds all matches in full text using regex
 * Used when searching across text node boundaries
 * @param fullText - The complete document text
 * @param positionMap - Map of character indices to document positions
 * @param regex - The regex pattern to match
 * @returns Array of SearchMatch objects
 */
function findMatchesInFullText(
  fullText: string,
  positionMap: number[],
  regex: RegExp
): SearchMatch[] {
  const matches: SearchMatch[] = [];
  let index = 0;

  // Reset regex lastIndex
  regex.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(fullText)) !== null) {
    const startIdx = match.index;
    const endIdx = startIdx + match[0].length;

    // Map text indices to document positions
    const from = positionMap[startIdx];
    const to = positionMap[endIdx - 1] + 1; // +1 because 'to' is exclusive

    matches.push({
      from,
      to,
      index: index++,
    });

    // Prevent infinite loops on zero-width matches
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  return matches;
}

/**
 * Main search algorithm function
 * Traverses a ProseMirror document and finds all text matches
 *
 * @param doc - The ProseMirror document to search
 * @param query - The search query configuration with options
 * @returns Array of SearchMatch objects with positions, sorted by document order
 *
 * @example
 * ```typescript
 * const matches = searchDocument(doc, {
 *   query: 'hello',
 *   caseSensitive: false,
 *   regex: false,
 *   wholeWord: true
 * });
 * // Returns: [{ from: 10, to: 15, index: 0 }, { from: 42, to: 47, index: 1 }]
 * ```
 */
export function searchDocument(doc: PMNode, query: SearchQuery): SearchMatch[] {
  // Return empty array if query is empty
  if (!query.query || query.query.trim() === '') {
    return [];
  }

  // Create the search regex based on query options
  const regex = createSearchRegex(query);
  if (!regex) {
    // Invalid regex pattern
    return [];
  }

  // Extract text blocks from the document
  const blocks = extractTextBlocks(doc);

  // For simple searches, we can match within individual text blocks
  // For regex searches that might span across nodes, use full text
  if (query.regex && regex.source.includes('\\s') || regex.source.includes('.')) {
    // Regex might match across text nodes, use full text extraction
    const { text, positionMap } = extractFullText(doc);
    return findMatchesInFullText(text, positionMap, regex);
  } else {
    // Simple search within text blocks
    return findMatchesInBlocks(blocks, regex);
  }
}

/**
 * Validates a regex pattern
 * @param pattern - The regex pattern string to validate
 * @returns true if the pattern is valid, false otherwise
 */
export function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Counts the total number of occurrences of a pattern in the document
 * @param doc - The ProseMirror document to search
 * @param query - The search query configuration
 * @returns The number of matches found
 */
export function countMatches(doc: PMNode, query: SearchQuery): number {
  return searchDocument(doc, query).length;
}

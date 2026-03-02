/**
 * Heading utilities for numbering, TOC extraction, and navigation
 */

import { Node as PMNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { NodeType } from './types';

/**
 * Represents a heading in the document
 */
export interface HeadingInfo {
  level: number;
  text: string;
  position: number;
  number?: string; // Hierarchical number like "1.2.3"
}

/**
 * Options for heading numbering
 */
export interface HeadingNumberingOptions {
  startLevel?: number; // Start numbering from this level (default: 2)
  endLevel?: number; // End numbering at this level (default: 6)
  separator?: string; // Separator for hierarchical numbers (default: ".")
  includeTrailingSeparator?: boolean; // Add separator after number (default: true)
}

/**
 * Extract all headings from a ProseMirror document
 *
 * @param doc - The ProseMirror document node
 * @returns Array of heading information
 */
export function extractHeadings(doc: PMNode): HeadingInfo[] {
  const headings: HeadingInfo[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name === NodeType.HEADING) {
      const level = node.attrs.level as number;
      const text = node.textContent;

      headings.push({
        level,
        text,
        position: pos,
      });
    }
  });

  return headings;
}

/**
 * Extract headings from editor state
 *
 * @param state - The editor state
 * @returns Array of heading information
 */
export function extractHeadingsFromState(state: EditorState): HeadingInfo[] {
  return extractHeadings(state.doc);
}

/**
 * Generate hierarchical numbering for headings
 *
 * @param headings - Array of headings to number
 * @param options - Numbering options
 * @returns Array of headings with numbers added
 */
export function numberHeadings(
  headings: HeadingInfo[],
  options: HeadingNumberingOptions = {}
): HeadingInfo[] {
  const {
    startLevel = 2,
    endLevel = 6,
    separator = '.',
    includeTrailingSeparator = true,
  } = options;

  // Track counters for each level
  const counters: number[] = new Array(7).fill(0); // Index 0 unused, 1-6 for heading levels

  return headings.map((heading) => {
    const { level } = heading;

    // Skip numbering if outside configured range
    if (level < startLevel || level > endLevel) {
      return heading;
    }

    // Increment counter for this level
    counters[level]++;

    // Reset counters for deeper levels
    for (let i = level + 1; i <= 6; i++) {
      counters[i] = 0;
    }

    // Build hierarchical number (e.g., "1.2.3")
    const numberParts: number[] = [];
    for (let i = startLevel; i <= level; i++) {
      if (counters[i] > 0) {
        numberParts.push(counters[i]);
      }
    }

    const number =
      numberParts.join(separator) + (includeTrailingSeparator ? separator : '');

    return {
      ...heading,
      number,
    };
  });
}

/**
 * Generate a table of contents from headings
 *
 * @param headings - Array of headings
 * @param options - TOC generation options
 * @returns Array of TOC entries
 */
export interface TocEntry {
  level: number;
  text: string;
  number?: string;
  position: number;
  children?: TocEntry[];
}

export function generateTableOfContents(
  headings: HeadingInfo[],
  options: { numbered?: boolean; startLevel?: number; endLevel?: number } = {}
): TocEntry[] {
  const { numbered = true, startLevel = 2, endLevel = 6 } = options;

  // Apply numbering if requested
  const processedHeadings = numbered
    ? numberHeadings(headings, { startLevel, endLevel })
    : headings;

  // Filter by level range
  const filteredHeadings = processedHeadings.filter(
    (h) => h.level >= startLevel && h.level <= endLevel
  );

  // Build hierarchical structure
  const root: TocEntry[] = [];
  const stack: TocEntry[] = [];

  for (const heading of filteredHeadings) {
    const entry: TocEntry = {
      level: heading.level,
      text: heading.text,
      number: heading.number,
      position: heading.position,
      children: [],
    };

    // Find the correct parent
    while (stack.length > 0 && stack[stack.length - 1].level >= entry.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top-level entry
      root.push(entry);
    } else {
      // Child entry
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(entry);
    }

    stack.push(entry);
  }

  return root;
}

/**
 * Find the heading at or before a specific position
 *
 * @param state - The editor state
 * @param pos - Position in the document
 * @returns The heading info, or null if none found
 */
export function findHeadingAtPosition(
  state: EditorState,
  pos: number
): HeadingInfo | null {
  const headings = extractHeadingsFromState(state);

  // Find the last heading that starts at or before pos
  let found: HeadingInfo | null = null;

  for (const heading of headings) {
    if (heading.position <= pos) {
      found = heading;
    } else {
      break;
    }
  }

  return found;
}

/**
 * Get all heading positions for navigation
 *
 * @param state - The editor state
 * @returns Array of positions where headings occur
 */
export function getHeadingPositions(state: EditorState): number[] {
  const headings = extractHeadingsFromState(state);
  return headings.map((h) => h.position);
}

/**
 * Find the next heading position after the current position
 *
 * @param state - The editor state
 * @param currentPos - Current cursor position
 * @returns Position of next heading, or null if none found
 */
export function findNextHeading(
  state: EditorState,
  currentPos: number
): number | null {
  const positions = getHeadingPositions(state);

  for (const pos of positions) {
    if (pos > currentPos) {
      return pos;
    }
  }

  return null;
}

/**
 * Find the previous heading position before the current position
 *
 * @param state - The editor state
 * @param currentPos - Current cursor position
 * @returns Position of previous heading, or null if none found
 */
export function findPreviousHeading(
  state: EditorState,
  currentPos: number
): number | null {
  const positions = getHeadingPositions(state);

  for (let i = positions.length - 1; i >= 0; i--) {
    if (positions[i] < currentPos) {
      return positions[i];
    }
  }

  return null;
}

/**
 * Format heading number with custom styling
 *
 * @param number - The heading number string
 * @param style - Numbering style ('decimal' | 'roman' | 'alpha')
 * @returns Formatted number string
 */
export function formatHeadingNumber(
  number: string,
  style: 'decimal' | 'roman' | 'alpha' = 'decimal'
): string {
  if (style === 'decimal') {
    return number;
  }

  // Extract the last number from the hierarchical number
  const parts = number.replace(/\.$/, '').split('.');
  const lastNumber = parseInt(parts[parts.length - 1], 10);

  if (style === 'roman') {
    return parts.slice(0, -1).join('.') + '.' + toRoman(lastNumber);
  }

  if (style === 'alpha') {
    return parts.slice(0, -1).join('.') + '.' + toAlpha(lastNumber);
  }

  return number;
}

/**
 * Convert number to Roman numerals
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

/**
 * Convert number to alphabetic (A, B, C, ...)
 */
function toAlpha(num: number): string {
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

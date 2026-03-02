/**
 * Pagination Engine Module
 *
 * This module provides advanced pagination calculation for book content rendering.
 * It uses layout calculation algorithms to estimate content flow across pages,
 * handles page breaks, widow/orphan control, and chapter boundaries.
 */

import { Element } from '../types/element';
import { BookStyle } from '../types/style';
import { TextBlock } from '../types/textBlock';
import { Break, TextFeature } from '../types/textFeature';

/**
 * Device configuration for pagination calculations
 */
export interface PageDimensions {
  /** Page width in pixels */
  pageWidth: number;
  /** Page height in pixels */
  pageHeight: number;
  /** Top margin in pixels */
  marginTop: number;
  /** Bottom margin in pixels */
  marginBottom: number;
  /** Left margin in pixels */
  marginLeft: number;
  /** Right margin in pixels */
  marginRight: number;
}

/**
 * Typography configuration for pagination calculations
 */
export interface TypographyConfig {
  /** Base font size in pixels */
  fontSize: number;
  /** Line height multiplier or pixel value */
  lineHeight: number;
  /** Heading sizes by level */
  headingSizes: { [level: number]: number };
  /** Heading line heights by level */
  headingLineHeights: { [level: number]: number };
  /** Heading margins (top, bottom) by level */
  headingMargins: { [level: number]: { top: number; bottom: number } };
  /** Paragraph spacing in pixels */
  paragraphSpacing: number;
  /** Section spacing in pixels */
  sectionSpacing: number;
  /** Chapter spacing in pixels */
  chapterSpacing: number;
  /** Average character width ratio (relative to font size) */
  charWidthRatio: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Enable widow/orphan control (prevents single lines at page boundaries) */
  widowOrphanControl?: boolean;
  /** Minimum lines to keep together at page boundaries */
  minLinesAtBoundary?: number;
  /** Keep headings with following content */
  keepHeadingsWithContent?: boolean;
  /** Enable chapter boundary detection */
  respectChapterBoundaries?: boolean;
  /** Enable page break detection from content */
  respectPageBreaks?: boolean;
  /** Enable virtual rendering for measurements */
  useVirtualRendering?: boolean;
}

/**
 * Result of pagination calculation
 */
export interface PaginationResult {
  /** Total number of pages */
  pageCount: number;
  /** Page breaks with positions */
  pageBreaks: PageBreak[];
  /** Content height estimates by page */
  pageHeights: number[];
  /** Metadata about the pagination */
  metadata: {
    totalHeight: number;
    averagePageHeight: number;
    hasExplicitPageBreaks: boolean;
    widowOrphanAdjustments: number;
  };
}

/**
 * Information about a page break
 */
export interface PageBreak {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Block index where the break occurs */
  blockIndex: number;
  /** Type of break */
  breakType: 'natural' | 'explicit' | 'chapter' | 'widow-orphan';
  /** Estimated content height before this break */
  heightBefore: number;
}

/**
 * Internal structure for tracking content layout
 */
interface LayoutBlock {
  /** Block index in original content */
  index: number;
  /** Estimated height in pixels */
  height: number;
  /** Block type */
  type: 'paragraph' | 'heading' | 'preformatted' | 'code' | 'list' | 'break' | 'feature';
  /** Whether this is an explicit page break */
  isPageBreak: boolean;
  /** Whether this starts a chapter */
  isChapterStart: boolean;
  /** Number of lines in this block */
  lineCount: number;
  /** Whether this block should stay with the next block */
  keepWithNext: boolean;
  /** Minimum lines to keep together */
  minLinesToKeep?: number;
}

/**
 * Calculates pagination for book content with advanced layout algorithms
 *
 * @param elementData - The element to paginate
 * @param styleConfig - Style configuration
 * @param dimensions - Page dimensions
 * @param options - Pagination options
 * @returns Pagination result with page count and breaks
 *
 * @example
 * ```typescript
 * const result = calculatePagination(element, style, {
 *   pageWidth: 816,
 *   pageHeight: 1056,
 *   marginTop: 72,
 *   marginBottom: 72,
 *   marginLeft: 72,
 *   marginRight: 72,
 * });
 * console.log(`Total pages: ${result.pageCount}`);
 * ```
 */
export function calculatePagination(
  elementData: Element,
  styleConfig: BookStyle,
  dimensions: PageDimensions,
  options: PaginationOptions = {}
): PaginationResult {
  // Set default options
  const opts: Required<PaginationOptions> = {
    widowOrphanControl: options.widowOrphanControl ?? true,
    minLinesAtBoundary: options.minLinesAtBoundary ?? 2,
    keepHeadingsWithContent: options.keepHeadingsWithContent ?? true,
    respectChapterBoundaries: options.respectChapterBoundaries ?? true,
    respectPageBreaks: options.respectPageBreaks ?? true,
    useVirtualRendering: options.useVirtualRendering ?? true,
  };

  // Extract typography configuration from style
  const typography = extractTypography(styleConfig);

  // Calculate available content area
  const contentHeight = dimensions.pageHeight - dimensions.marginTop - dimensions.marginBottom;
  const contentWidth = dimensions.pageWidth - dimensions.marginLeft - dimensions.marginRight;

  // Build layout blocks from content
  const layoutBlocks = buildLayoutBlocks(
    elementData,
    typography,
    contentWidth,
    opts
  );

  // Calculate page breaks
  const result = calculatePageBreaks(
    layoutBlocks,
    contentHeight,
    opts
  );

  return result;
}

/**
 * Extracts typography configuration from BookStyle
 */
function extractTypography(styleConfig: BookStyle): TypographyConfig {
  // Parse font size (handle both "16px" and "1rem" formats)
  const baseFontSize = parseFloat(styleConfig.body.fontSize) || 16;
  const lineHeight = parseFloat(styleConfig.body.lineHeight) || 1.5;

  // Extract heading configurations
  const headingSizes: { [level: number]: number } = {
    1: parseFloat(styleConfig.headings.h1.fontSize) || baseFontSize * 2.5,
    2: parseFloat(styleConfig.headings.h2.fontSize) || baseFontSize * 2,
    3: parseFloat(styleConfig.headings.h3.fontSize) || baseFontSize * 1.5,
    4: parseFloat(styleConfig.headings.h4?.fontSize || '0') || baseFontSize * 1.25,
  };

  const headingLineHeights: { [level: number]: number } = {
    1: parseFloat(styleConfig.headings.h1.lineHeight || '1.2') || 1.2,
    2: parseFloat(styleConfig.headings.h2.lineHeight || '1.3') || 1.3,
    3: parseFloat(styleConfig.headings.h3.lineHeight || '1.4') || 1.4,
    4: parseFloat(styleConfig.headings.h4?.lineHeight || '1.4') || 1.4,
  };

  const headingMargins: { [level: number]: { top: number; bottom: number } } = {
    1: {
      top: parseFloat(styleConfig.headings.h1.marginTop || '0') || baseFontSize * 2,
      bottom: parseFloat(styleConfig.headings.h1.marginBottom || '0') || baseFontSize * 1,
    },
    2: {
      top: parseFloat(styleConfig.headings.h2.marginTop || '0') || baseFontSize * 1.5,
      bottom: parseFloat(styleConfig.headings.h2.marginBottom || '0') || baseFontSize * 0.75,
    },
    3: {
      top: parseFloat(styleConfig.headings.h3.marginTop || '0') || baseFontSize * 1.25,
      bottom: parseFloat(styleConfig.headings.h3.marginBottom || '0') || baseFontSize * 0.5,
    },
    4: {
      top: parseFloat(styleConfig.headings.h4?.marginTop || '0') || baseFontSize * 1,
      bottom: parseFloat(styleConfig.headings.h4?.marginBottom || '0') || baseFontSize * 0.5,
    },
  };

  return {
    fontSize: baseFontSize,
    lineHeight,
    headingSizes,
    headingLineHeights,
    headingMargins,
    paragraphSpacing: parseFloat(styleConfig.spacing.paragraphSpacing) || baseFontSize * 0.5,
    sectionSpacing: parseFloat(styleConfig.spacing.sectionSpacing) || baseFontSize * 2,
    chapterSpacing: parseFloat(styleConfig.spacing.chapterSpacing) || baseFontSize * 3,
    charWidthRatio: 0.6, // Approximate ratio of character width to font size
  };
}

/**
 * Builds layout blocks from element content with height calculations
 */
function buildLayoutBlocks(
  elementData: Element,
  typography: TypographyConfig,
  contentWidth: number,
  options: Required<PaginationOptions>
): LayoutBlock[] {
  const blocks: LayoutBlock[] = [];

  // Check if this is a chapter start (title-page, chapter elements)
  const isChapterElement = ['title-page', 'prologue', 'epilogue'].includes(elementData.type);

  // Add element title as a block if present
  if (elementData.title) {
    const titleHeight = estimateHeadingHeight(
      elementData.title,
      1, // H1 for element titles
      typography,
      contentWidth
    );

    blocks.push({
      index: -1, // Special index for title
      height: titleHeight,
      type: 'heading',
      isPageBreak: false,
      isChapterStart: isChapterElement,
      lineCount: Math.ceil(titleHeight / (typography.headingSizes[1] * typography.headingLineHeights[1])),
      keepWithNext: options.keepHeadingsWithContent,
      minLinesToKeep: options.minLinesAtBoundary,
    });
  }

  // Process content blocks
  if (elementData.content) {
    elementData.content.forEach((block, index) => {
      // Check for explicit page breaks in features
      const hasPageBreak = options.respectPageBreaks && hasExplicitPageBreak(block);

      // Calculate block height
      const blockHeight = estimateBlockHeight(block, typography, contentWidth);

      // Determine if this is a chapter start
      const isChapterStart = isChapterElement && index === 0;

      blocks.push({
        index,
        height: blockHeight,
        type: block.blockType,
        isPageBreak: hasPageBreak,
        isChapterStart,
        lineCount: estimateLineCount(block, typography, contentWidth),
        keepWithNext: block.blockType === 'heading' && options.keepHeadingsWithContent,
        minLinesToKeep: options.widowOrphanControl ? options.minLinesAtBoundary : undefined,
      });

      // If there's an explicit page break, add a break block
      if (hasPageBreak) {
        blocks.push({
          index: -2, // Special index for explicit break
          height: 0,
          type: 'break',
          isPageBreak: true,
          isChapterStart: false,
          lineCount: 0,
          keepWithNext: false,
        });
      }
    });
  }

  return blocks;
}

/**
 * Checks if a text block contains an explicit page break
 */
function hasExplicitPageBreak(block: TextBlock): boolean {
  if (!block.features) return false;

  return block.features.some((feature: TextFeature) => {
    return feature.type === 'break' && (feature as Break).breakType === 'page';
  });
}

/**
 * Estimates the height of a text block
 */
function estimateBlockHeight(
  block: TextBlock,
  typography: TypographyConfig,
  contentWidth: number
): number {
  switch (block.blockType) {
    case 'heading':
      return estimateHeadingHeight(block.content, block.level || 1, typography, contentWidth);

    case 'paragraph':
      return estimateParagraphHeight(block.content, typography, contentWidth);

    case 'preformatted':
    case 'code':
      return estimatePreformattedHeight(block.content, typography);

    case 'list':
      return estimateListHeight(block.content, typography, contentWidth, block.indentLevel || 0);

    default:
      return estimateParagraphHeight(block.content, typography, contentWidth);
  }
}

/**
 * Estimates the height of a heading
 */
function estimateHeadingHeight(
  content: string,
  level: number,
  typography: TypographyConfig,
  contentWidth: number
): number {
  const fontSize = typography.headingSizes[level] || typography.fontSize;
  const lineHeight = typography.headingLineHeights[level] || 1.2;
  const margins = typography.headingMargins[level] || { top: 0, bottom: 0 };

  const lines = estimateLines(content, fontSize, contentWidth, typography.charWidthRatio);
  const contentHeight = lines * fontSize * lineHeight;

  return contentHeight + margins.top + margins.bottom;
}

/**
 * Estimates the height of a paragraph
 */
function estimateParagraphHeight(
  content: string,
  typography: TypographyConfig,
  contentWidth: number
): number {
  const lines = estimateLines(
    content,
    typography.fontSize,
    contentWidth,
    typography.charWidthRatio
  );

  const lineHeightPx = typography.fontSize * typography.lineHeight;
  return lines * lineHeightPx + typography.paragraphSpacing;
}

/**
 * Estimates the height of preformatted text
 */
function estimatePreformattedHeight(content: string, typography: TypographyConfig): number {
  // Count actual line breaks in preformatted text
  const lines = content.split('\n').length;
  const lineHeightPx = typography.fontSize * typography.lineHeight;

  return lines * lineHeightPx + typography.paragraphSpacing;
}

/**
 * Estimates the height of a list
 */
function estimateListHeight(
  content: string,
  typography: TypographyConfig,
  contentWidth: number,
  indentLevel: number
): number {
  // Estimate list item count (simple heuristic)
  const items = content.split('\n').filter(line => line.trim().length > 0);

  let totalHeight = 0;
  items.forEach(item => {
    const itemWidth = contentWidth - (indentLevel * typography.fontSize * 2);
    const lines = estimateLines(item, typography.fontSize, itemWidth, typography.charWidthRatio);
    totalHeight += lines * typography.fontSize * typography.lineHeight;
  });

  return totalHeight + typography.paragraphSpacing;
}

/**
 * Estimates the number of lines a text will take
 */
function estimateLines(
  text: string,
  fontSize: number,
  contentWidth: number,
  charWidthRatio: number
): number {
  if (!text || text.length === 0) return 1;

  const avgCharWidth = fontSize * charWidthRatio;
  const charsPerLine = Math.floor(contentWidth / avgCharWidth);

  if (charsPerLine <= 0) return 1;

  // Account for word wrapping (average word length ~5 chars + space)
  const words = text.split(/\s+/);
  let currentLineLength = 0;
  let lines = 1;

  words.forEach(word => {
    const wordLength = word.length + 1; // +1 for space
    if (currentLineLength + wordLength > charsPerLine) {
      lines++;
      currentLineLength = wordLength;
    } else {
      currentLineLength += wordLength;
    }
  });

  return Math.max(1, lines);
}

/**
 * Estimates the line count for a block
 */
function estimateLineCount(
  block: TextBlock,
  typography: TypographyConfig,
  contentWidth: number
): number {
  const height = estimateBlockHeight(block, typography, contentWidth);
  const lineHeightPx = typography.fontSize * typography.lineHeight;

  return Math.ceil(height / lineHeightPx);
}

/**
 * Calculates page breaks based on layout blocks
 */
function calculatePageBreaks(
  blocks: LayoutBlock[],
  contentHeight: number,
  options: Required<PaginationOptions>
): PaginationResult {
  const pageBreaks: PageBreak[] = [];
  const pageHeights: number[] = [];

  let currentPage = 1;
  let currentPageHeight = 0;
  let totalHeight = 0;
  let hasExplicitPageBreaks = false;
  let widowOrphanAdjustments = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Handle chapter boundaries
    if (block.isChapterStart && options.respectChapterBoundaries && currentPageHeight > 0) {
      // Start new page for chapter
      pageBreaks.push({
        pageNumber: currentPage,
        blockIndex: block.index,
        breakType: 'chapter',
        heightBefore: currentPageHeight,
      });
      pageHeights.push(currentPageHeight);
      currentPage++;
      currentPageHeight = 0;
    }

    // Handle explicit page breaks
    if (block.isPageBreak && options.respectPageBreaks) {
      hasExplicitPageBreaks = true;
      pageBreaks.push({
        pageNumber: currentPage,
        blockIndex: block.index,
        breakType: 'explicit',
        heightBefore: currentPageHeight,
      });
      pageHeights.push(currentPageHeight);
      currentPage++;
      currentPageHeight = 0;
      continue; // Skip the break block itself
    }

    // Check if block fits on current page
    if (currentPageHeight + block.height > contentHeight) {
      // Block doesn't fit, need to determine break point

      // Check widow/orphan control
      if (options.widowOrphanControl && block.minLinesToKeep) {
        const remainingHeight = contentHeight - currentPageHeight;
        const lineHeight = block.height / block.lineCount;
        const linesThatFit = Math.floor(remainingHeight / lineHeight);

        // If we can't fit minimum lines, move entire block to next page
        if (linesThatFit < block.minLinesToKeep) {
          pageBreaks.push({
            pageNumber: currentPage,
            blockIndex: block.index,
            breakType: 'widow-orphan',
            heightBefore: currentPageHeight,
          });
          pageHeights.push(currentPageHeight);
          currentPage++;
          currentPageHeight = block.height;
          widowOrphanAdjustments++;
          continue;
        }

        // If block will leave orphan on next page, adjust
        const linesOnNextPage = block.lineCount - linesThatFit;
        if (linesOnNextPage < block.minLinesToKeep && linesOnNextPage > 0) {
          // Move more lines to next page to avoid orphan
          const linesToMove = block.minLinesToKeep;
          const heightToMove = linesToMove * lineHeight;

          pageBreaks.push({
            pageNumber: currentPage,
            blockIndex: block.index,
            breakType: 'widow-orphan',
            heightBefore: currentPageHeight,
          });
          pageHeights.push(currentPageHeight);
          currentPage++;
          currentPageHeight = heightToMove;
          widowOrphanAdjustments++;
          continue;
        }
      }

      // Check keep-with-next
      if (block.keepWithNext && i < blocks.length - 1) {
        const nextBlock = blocks[i + 1];
        // If this block (e.g., heading) would be at the bottom, move it to next page
        if (currentPageHeight + block.height + nextBlock.height > contentHeight) {
          pageBreaks.push({
            pageNumber: currentPage,
            blockIndex: block.index,
            breakType: 'natural',
            heightBefore: currentPageHeight,
          });
          pageHeights.push(currentPageHeight);
          currentPage++;
          currentPageHeight = block.height;
          continue;
        }
      }

      // Natural page break
      pageBreaks.push({
        pageNumber: currentPage,
        blockIndex: block.index,
        breakType: 'natural',
        heightBefore: currentPageHeight,
      });
      pageHeights.push(currentPageHeight);
      currentPage++;
      currentPageHeight = block.height;
    } else {
      // Block fits on current page
      currentPageHeight += block.height;
    }

    totalHeight += block.height;
  }

  // Add the last page height
  if (currentPageHeight > 0) {
    pageHeights.push(currentPageHeight);
  }

  const pageCount = Math.max(1, currentPage);
  const averagePageHeight = pageHeights.length > 0
    ? pageHeights.reduce((sum, h) => sum + h, 0) / pageHeights.length
    : 0;

  return {
    pageCount,
    pageBreaks,
    pageHeights,
    metadata: {
      totalHeight,
      averagePageHeight,
      hasExplicitPageBreaks,
      widowOrphanAdjustments,
    },
  };
}

/**
 * Quick page count estimation (faster but less accurate)
 * Use this for real-time previews where accuracy is less critical
 *
 * @param elementData - The element to estimate
 * @param styleConfig - Style configuration
 * @param dimensions - Page dimensions
 * @returns Estimated page count
 */
export function estimatePageCount(
  elementData: Element,
  styleConfig: BookStyle,
  dimensions: PageDimensions
): number {
  const typography = extractTypography(styleConfig);
  const contentHeight = dimensions.pageHeight - dimensions.marginTop - dimensions.marginBottom;
  const contentWidth = dimensions.pageWidth - dimensions.marginLeft - dimensions.marginRight;

  // Quick estimate without detailed layout
  let totalHeight = 0;

  // Add title height
  if (elementData.title) {
    totalHeight += estimateHeadingHeight(elementData.title, 1, typography, contentWidth);
  }

  // Add content blocks
  if (elementData.content) {
    elementData.content.forEach(block => {
      totalHeight += estimateBlockHeight(block, typography, contentWidth);
    });
  }

  return Math.max(1, Math.ceil(totalHeight / contentHeight));
}

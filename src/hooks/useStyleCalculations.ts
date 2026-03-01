/**
 * useStyleCalculations Hook
 * React hook with useMemo for expensive style calculations
 *
 * Provides memoized style calculations that only recompute when dependencies change
 */

import { useMemo, useCallback } from 'react';
import { BookStyle, DropCapStyle } from '../types/style';
import { Chapter, TextBlock } from '../types';
import {
  computeHeadingStyles,
  computeParagraphStyles,
  computeDropCapStyles,
  computeOrnamentalBreakStyles,
  applyStylesToChapter,
  mergeStyles,
  generateStyleHash,
} from '../services/style-engine';

// ============================================================================
// CHAPTER STYLES HOOK
// ============================================================================

/**
 * Hook for computing chapter-level styles with memoization
 * Only recomputes when chapter or bookStyle changes
 */
export function useChapterStyles(chapter: Chapter, bookStyle: BookStyle) {
  return useMemo(() => {
    return applyStylesToChapter(chapter, bookStyle);
  }, [chapter.id, bookStyle.id, chapter.content.length]);
}

// ============================================================================
// TEXT BLOCK STYLES HOOK
// ============================================================================

interface UseTextBlockStylesOptions {
  block: TextBlock;
  bookStyle: BookStyle;
  isFirstParagraph?: boolean;
}

/**
 * Hook for computing individual text block styles
 * Memoized to avoid recalculation on every render
 */
export function useTextBlockStyles({
  block,
  bookStyle,
  isFirstParagraph = false,
}: UseTextBlockStylesOptions) {
  // Memoize block styles based on block type and configuration
  const blockStyles = useMemo(() => {
    switch (block.blockType) {
      case 'heading': {
        const level = block.level || 1;
        const headingStyle = bookStyle.headings[`h${level}` as 'h1' | 'h2' | 'h3' | 'h4'];
        if (!headingStyle) {
          return {};
        }
        return computeHeadingStyles(headingStyle, level, bookStyle);
      }

      case 'paragraph': {
        const hasDropCap = isFirstParagraph && bookStyle.dropCap.enabled;
        return computeParagraphStyles(bookStyle, isFirstParagraph, hasDropCap);
      }

      case 'preformatted':
      case 'code': {
        return {
          fontFamily: 'monospace',
          fontSize: '0.9em',
          lineHeight: '1.4',
          padding: '1em',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          overflowX: 'auto' as const,
        };
      }

      default:
        return {};
    }
  }, [
    block.blockType,
    block.level,
    bookStyle.id,
    isFirstParagraph,
    bookStyle.dropCap.enabled,
  ]);

  // Memoize drop cap styles separately
  const dropCapStyles = useMemo(() => {
    if (
      block.blockType !== 'paragraph' ||
      !isFirstParagraph ||
      !bookStyle.dropCap.enabled ||
      !block.content
    ) {
      return null;
    }

    const firstChar = block.content.charAt(0);
    return computeDropCapStyles(bookStyle.dropCap, bookStyle, firstChar);
  }, [
    block.blockType,
    block.content,
    isFirstParagraph,
    bookStyle.dropCap.enabled,
    bookStyle.id,
  ]);

  return {
    blockStyles,
    dropCapStyles,
  };
}

// ============================================================================
// ORNAMENTAL BREAK HOOK
// ============================================================================

/**
 * Hook for ornamental break (scene break) styles
 */
export function useOrnamentalBreakStyles(bookStyle: BookStyle) {
  return useMemo(() => {
    return computeOrnamentalBreakStyles(bookStyle);
  }, [bookStyle.ornamentalBreak.enabled, bookStyle.id]);
}

// ============================================================================
// HEADING STYLES HOOK
// ============================================================================

/**
 * Hook for all heading styles in a book
 * Returns memoized styles for h1, h2, h3, h4
 */
export function useHeadingStyles(bookStyle: BookStyle) {
  const h1Styles = useMemo(
    () => computeHeadingStyles(bookStyle.headings.h1, 1, bookStyle),
    [bookStyle.headings.h1, bookStyle.id]
  );

  const h2Styles = useMemo(
    () => computeHeadingStyles(bookStyle.headings.h2, 2, bookStyle),
    [bookStyle.headings.h2, bookStyle.id]
  );

  const h3Styles = useMemo(
    () => computeHeadingStyles(bookStyle.headings.h3, 3, bookStyle),
    [bookStyle.headings.h3, bookStyle.id]
  );

  const h4Styles = useMemo(
    () => bookStyle.headings.h4
      ? computeHeadingStyles(bookStyle.headings.h4, 4, bookStyle)
      : {},
    [bookStyle.headings.h4, bookStyle.id]
  );

  return {
    h1: h1Styles,
    h2: h2Styles,
    h3: h3Styles,
    h4: h4Styles,
  };
}

// ============================================================================
// MERGED STYLES HOOK
// ============================================================================

/**
 * Hook for merging base style with overrides
 * Useful when applying custom style modifications
 */
export function useMergedStyles(
  baseStyle: BookStyle,
  overrides?: Partial<BookStyle>
) {
  return useMemo(() => {
    return mergeStyles(baseStyle, overrides);
  }, [baseStyle.id, overrides]);
}

// ============================================================================
// PARAGRAPH STYLES HOOK
// ============================================================================

interface UseParagraphStylesOptions {
  bookStyle: BookStyle;
  isFirstParagraph?: boolean;
  hasDropCap?: boolean;
}

/**
 * Hook for paragraph-specific styles
 */
export function useParagraphStyles({
  bookStyle,
  isFirstParagraph = false,
  hasDropCap = false,
}: UseParagraphStylesOptions) {
  return useMemo(() => {
    return computeParagraphStyles(bookStyle, isFirstParagraph, hasDropCap);
  }, [bookStyle.id, isFirstParagraph, hasDropCap]);
}

// ============================================================================
// DROP CAP HOOK
// ============================================================================

/**
 * Hook for drop cap styles with first character
 */
export function useDropCapStyles(
  dropCapConfig: DropCapStyle,
  bookStyle: BookStyle,
  firstChar: string
) {
  return useMemo(() => {
    if (!dropCapConfig.enabled || !firstChar) {
      return null;
    }
    return computeDropCapStyles(dropCapConfig, bookStyle, firstChar);
  }, [dropCapConfig.enabled, bookStyle.id, firstChar]);
}

// ============================================================================
// STYLE HASH HOOK
// ============================================================================

/**
 * Hook for generating stable style hashes
 * Useful for React keys and cache management
 */
export function useStyleHash(
  style: Partial<BookStyle>,
  content?: string
): string {
  return useMemo(() => {
    return generateStyleHash(style, content);
  }, [style, content]);
}

// ============================================================================
// BATCH CHAPTER STYLES HOOK
// ============================================================================

/**
 * Hook for computing styles for multiple chapters
 * Optimized for switching styles across many chapters
 */
export function useBatchChapterStyles(
  chapters: Chapter[],
  bookStyle: BookStyle
) {
  return useMemo(() => {
    const chapterStylesMap = new Map<
      string,
      ReturnType<typeof applyStylesToChapter>
    >();

    chapters.forEach(chapter => {
      const styles = applyStylesToChapter(chapter, bookStyle);
      chapterStylesMap.set(chapter.id, styles);
    });

    return chapterStylesMap;
  }, [
    chapters.map(c => c.id).join(','),
    chapters.map(c => c.content.length).join(','),
    bookStyle.id,
  ]);
}

// ============================================================================
// STYLE TRANSITION HOOK
// ============================================================================

/**
 * Hook for managing style transitions
 * Returns a callback that can be used to transition between styles smoothly
 */
export function useStyleTransition(currentStyle: BookStyle) {
  const transitionToStyle = useCallback(
    (newStyle: BookStyle) => {
      // This could be extended to include animation logic
      // For now, it provides a stable callback reference
      const transitionKey = `${currentStyle.id}->${newStyle.id}`;
      return {
        from: currentStyle,
        to: newStyle,
        hash: generateStyleHash({}, transitionKey),
      };
    },
    [currentStyle.id]
  );

  return transitionToStyle;
}

// ============================================================================
// COMPOSITE HOOK FOR FULL CHAPTER RENDERING
// ============================================================================

/**
 * Comprehensive hook that provides all necessary styles for chapter rendering
 * Use this for complete chapter components
 */
export function useChapterRenderStyles(chapter: Chapter, bookStyle: BookStyle) {
  const chapterStyles = useChapterStyles(chapter, bookStyle);
  const headingStyles = useHeadingStyles(bookStyle);
  const ornamentalBreakStyles = useOrnamentalBreakStyles(bookStyle);

  // Memoize the complete style package
  return useMemo(
    () => ({
      chapter: chapterStyles.chapterStyles,
      blocks: chapterStyles.blockStyles,
      headings: headingStyles,
      ornamentalBreak: ornamentalBreakStyles,
      bookStyle,
    }),
    [chapterStyles, headingStyles, ornamentalBreakStyles, bookStyle.id]
  );
}

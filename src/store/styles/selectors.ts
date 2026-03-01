/**
 * Style Selectors with Reselect
 * Memoized selectors for Redux state (or any state management)
 *
 * These selectors use reselect for automatic memoization
 * They only recompute when their inputs change
 */

import { createSelector } from 'reselect';
import { BookStyle } from '../../types/style';
import { Chapter } from '../../types';
import {
  computeHeadingStyles,
  computeParagraphStyles,
  computeDropCapStyles,
  computeOrnamentalBreakStyles,
  applyStylesToChapter,
  mergeStyles,
} from '../../services/style-engine';

// ============================================================================
// STATE SHAPE (for reference - adapt to your actual Redux state)
// ============================================================================

export interface StylesState {
  currentStyle: BookStyle | null;
  availableStyles: BookStyle[];
  customOverrides?: Partial<BookStyle>;
}

export interface AppState {
  styles: StylesState;
  chapters: Chapter[];
  currentChapterId: string | null;
}

// ============================================================================
// BASE SELECTORS (input selectors)
// ============================================================================

/**
 * Select the current book style
 */
export const selectCurrentStyle = (state: AppState): BookStyle | null =>
  state.styles.currentStyle;

/**
 * Select all available styles
 */
export const selectAvailableStyles = (state: AppState): BookStyle[] =>
  state.styles.availableStyles;

/**
 * Select custom style overrides
 */
export const selectStyleOverrides = (state: AppState): Partial<BookStyle> | undefined =>
  state.styles.customOverrides;

/**
 * Select all chapters
 */
export const selectAllChapters = (state: AppState): Chapter[] =>
  state.chapters;

/**
 * Select current chapter ID
 */
export const selectCurrentChapterId = (state: AppState): string | null =>
  state.currentChapterId;

// ============================================================================
// MEMOIZED SELECTORS
// ============================================================================

/**
 * Select the active book style with overrides applied
 * Memoized - only recomputes when style or overrides change
 */
export const selectActiveBookStyle = createSelector(
  [selectCurrentStyle, selectStyleOverrides],
  (currentStyle, overrides): BookStyle | null => {
    if (!currentStyle) return null;
    if (!overrides) return currentStyle;
    return mergeStyles(currentStyle, overrides);
  }
);

/**
 * Select heading styles for all levels
 * Memoized by book style
 */
export const selectHeadingStyles = createSelector(
  [selectActiveBookStyle],
  (bookStyle) => {
    if (!bookStyle) return null;

    return {
      h1: computeHeadingStyles(bookStyle.headings.h1, 1, bookStyle),
      h2: computeHeadingStyles(bookStyle.headings.h2, 2, bookStyle),
      h3: computeHeadingStyles(bookStyle.headings.h3, 3, bookStyle),
      h4: bookStyle.headings.h4
        ? computeHeadingStyles(bookStyle.headings.h4, 4, bookStyle)
        : null,
    };
  }
);

/**
 * Select paragraph styles
 * Memoized by book style
 */
export const selectParagraphStyles = createSelector(
  [selectActiveBookStyle],
  (bookStyle) => {
    if (!bookStyle) return null;

    return {
      regular: computeParagraphStyles(bookStyle, false, false),
      first: computeParagraphStyles(bookStyle, true, false),
      firstWithDropCap: computeParagraphStyles(bookStyle, true, true),
    };
  }
);

/**
 * Select drop cap styles
 * Memoized by book style and configuration
 */
export const selectDropCapStyles = createSelector(
  [selectActiveBookStyle],
  (bookStyle) => {
    if (!bookStyle || !bookStyle.dropCap.enabled) return null;

    // Return a function that can compute drop cap for any first character
    return (firstChar: string) =>
      computeDropCapStyles(bookStyle.dropCap, bookStyle, firstChar);
  }
);

/**
 * Select ornamental break styles
 * Memoized by book style
 */
export const selectOrnamentalBreakStyles = createSelector(
  [selectActiveBookStyle],
  (bookStyle) => {
    if (!bookStyle) return null;
    return computeOrnamentalBreakStyles(bookStyle);
  }
);

/**
 * Select current chapter
 * Memoized by chapter ID
 */
export const selectCurrentChapter = createSelector(
  [selectAllChapters, selectCurrentChapterId],
  (chapters, currentId): Chapter | null => {
    if (!currentId) return null;
    return chapters.find(c => c.id === currentId) || null;
  }
);

/**
 * Select current chapter with styles applied
 * Memoized - only recomputes when chapter or style changes
 */
export const selectCurrentChapterWithStyles = createSelector(
  [selectCurrentChapter, selectActiveBookStyle],
  (chapter, bookStyle) => {
    if (!chapter || !bookStyle) return null;

    const { chapterStyles, blockStyles } = applyStylesToChapter(chapter, bookStyle);

    return {
      chapter,
      chapterStyles,
      blockStyles,
    };
  }
);

/**
 * Select all chapters with styles applied
 * Expensive operation - only use when necessary
 * Memoized by chapters and book style
 */
export const selectAllChaptersWithStyles = createSelector(
  [selectAllChapters, selectActiveBookStyle],
  (chapters, bookStyle) => {
    if (!bookStyle) return [];

    return chapters.map(chapter => {
      const { chapterStyles, blockStyles } = applyStylesToChapter(chapter, bookStyle);
      return {
        chapter,
        chapterStyles,
        blockStyles,
      };
    });
  }
);

/**
 * Select style by ID
 * Factory selector for selecting a specific style
 */
export const makeSelectStyleById = () =>
  createSelector(
    [selectAvailableStyles, (_: AppState, styleId: string) => styleId],
    (styles, styleId): BookStyle | undefined => {
      return styles.find(s => s.id === styleId);
    }
  );

/**
 * Select styles by category
 * Factory selector for filtering by category
 */
export const makeSelectStylesByCategory = () =>
  createSelector(
    [selectAvailableStyles, (_: AppState, category: string) => category],
    (styles, category): BookStyle[] => {
      return styles.filter(s => s.category === category);
    }
  );

/**
 * Select chapter by ID with styles
 * Factory selector for a specific chapter
 */
export const makeSelectChapterWithStyles = () =>
  createSelector(
    [
      selectAllChapters,
      selectActiveBookStyle,
      (_: AppState, chapterId: string) => chapterId,
    ],
    (chapters, bookStyle, chapterId) => {
      if (!bookStyle) return null;

      const chapter = chapters.find(c => c.id === chapterId);
      if (!chapter) return null;

      const { chapterStyles, blockStyles } = applyStylesToChapter(chapter, bookStyle);

      return {
        chapter,
        chapterStyles,
        blockStyles,
      };
    }
  );

// ============================================================================
// UTILITY SELECTORS
// ============================================================================

/**
 * Check if drop cap is enabled
 */
export const selectIsDropCapEnabled = createSelector(
  [selectActiveBookStyle],
  (bookStyle): boolean => {
    return bookStyle?.dropCap.enabled || false;
  }
);

/**
 * Check if ornamental break is enabled
 */
export const selectIsOrnamentalBreakEnabled = createSelector(
  [selectActiveBookStyle],
  (bookStyle): boolean => {
    return bookStyle?.ornamentalBreak.enabled || false;
  }
);

/**
 * Check if first paragraph styling is enabled
 */
export const selectIsFirstParagraphEnabled = createSelector(
  [selectActiveBookStyle],
  (bookStyle): boolean => {
    return bookStyle?.firstParagraph.enabled || false;
  }
);

/**
 * Select color scheme
 */
export const selectColorScheme = createSelector(
  [selectActiveBookStyle],
  (bookStyle) => {
    return bookStyle?.colors || null;
  }
);

/**
 * Select typography settings
 */
export const selectTypographySettings = createSelector(
  [selectActiveBookStyle],
  (bookStyle) => {
    if (!bookStyle) return null;

    return {
      fonts: bookStyle.fonts,
      body: bookStyle.body,
      spacing: bookStyle.spacing,
    };
  }
);

// ============================================================================
// PERFORMANCE SELECTORS
// ============================================================================

/**
 * Select chapter count
 * Simple selector for performance monitoring
 */
export const selectChapterCount = createSelector(
  [selectAllChapters],
  (chapters): number => chapters.length
);

/**
 * Select total word count across all chapters
 * Memoized to avoid recalculation
 */
export const selectTotalWordCount = createSelector(
  [selectAllChapters],
  (chapters): number => {
    return chapters.reduce((total, chapter) => {
      return total + (chapter.wordCount || 0);
    }, 0);
  }
);

/**
 * Select chapters that need style recalculation
 * Useful for incremental updates
 */
export const selectChaptersNeedingStyleUpdate = createSelector(
  [selectAllChapters, selectActiveBookStyle],
  (chapters, bookStyle) => {
    if (!bookStyle) return [];

    // This is a placeholder - in a real app, you'd track which chapters
    // have been styled with which style version
    return chapters;
  }
);

// ============================================================================
// EXAMPLE USAGE (commented out)
// ============================================================================

/*
// In a React component with Redux:
import { useSelector } from 'react-redux';

function ChapterRenderer() {
  // Get memoized chapter with styles
  const chapterWithStyles = useSelector(selectCurrentChapterWithStyles);

  // Get heading styles
  const headingStyles = useSelector(selectHeadingStyles);

  // Use factory selector for specific chapter
  const selectChapterStyles = useMemo(makeSelectChapterWithStyles, []);
  const specificChapter = useSelector(state =>
    selectChapterStyles(state, 'chapter-id')
  );

  // ... render logic
}

// Without Redux - can be used with any state management:
function useChapterStyles(chapter: Chapter, bookStyle: BookStyle) {
  const chapterWithStyles = useMemo(() => {
    return applyStylesToChapter(chapter, bookStyle);
  }, [chapter, bookStyle]);

  return chapterWithStyles;
}
*/

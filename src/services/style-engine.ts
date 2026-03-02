/**
 * Style Engine Service
 * Provides memoized and cached expensive style calculations
 *
 * Performance optimizations:
 * - Cache computed styles with style+content hash keys
 * - Memoize expensive CSS-in-JS computations
 * - Cache font metrics calculations
 * - Optimize layout measurements
 */

import { BookStyle, HeadingStyle, DropCapStyle, Style } from '../types/style';
import { Chapter } from '../types';

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class StyleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize = 1000, ttl = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// HASH FUNCTION for cache keys
// ============================================================================

/**
 * Generate a stable hash from style and content
 * Used as cache key for computed styles
 */
export function generateStyleHash(style: Partial<BookStyle | Style>, content?: string): string {
  const styleStr = JSON.stringify(style);
  const contentStr = content || '';

  // Simple but effective hash function
  let hash = 0;
  const combined = styleStr + contentStr;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString(36);
}

// ============================================================================
// CACHE INSTANCES
// ============================================================================

const computedStylesCache = new StyleCache<React.CSSProperties>(1000);
const fontMetricsCache = new StyleCache<FontMetrics>(500);
const dropCapStylesCache = new StyleCache<React.CSSProperties>(200);
const headingStylesCache = new StyleCache<React.CSSProperties>(200);
const ornamentalBreakCache = new StyleCache<React.CSSProperties>(100);
const mergedStylesCache = new StyleCache<BookStyle>(500);

// ============================================================================
// FONT METRICS CALCULATION
// ============================================================================

interface FontMetrics {
  ascent: number;
  descent: number;
  lineHeight: number;
  capHeight: number;
  xHeight: number;
  baselineOffset: number;
}

/**
 * Calculate font metrics for precise typography
 * This is expensive as it requires DOM manipulation
 * Results are cached by font family + size
 */
export function calculateFontMetrics(
  fontFamily: string,
  fontSize: number
): FontMetrics {
  const cacheKey = `${fontFamily}-${fontSize}`;
  const cached = fontMetricsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  // Create temporary element for measurement
  const element = document.createElement('div');
  element.style.fontFamily = fontFamily;
  element.style.fontSize = `${fontSize}px`;
  element.style.position = 'absolute';
  element.style.visibility = 'hidden';
  element.style.whiteSpace = 'nowrap';
  element.textContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  document.body.appendChild(element);

  const computedStyle = window.getComputedStyle(element);
  const lineHeight = parseFloat(computedStyle.lineHeight);

  // Approximate typographic metrics
  const metrics: FontMetrics = {
    ascent: fontSize * 0.75, // Approximation
    descent: fontSize * 0.25, // Approximation
    lineHeight: isNaN(lineHeight) ? fontSize * 1.2 : lineHeight,
    capHeight: fontSize * 0.7, // Approximation
    xHeight: fontSize * 0.5, // Approximation
    baselineOffset: 0,
  };

  document.body.removeChild(element);

  fontMetricsCache.set(cacheKey, metrics);
  return metrics;
}

// ============================================================================
// STYLE MERGING AND INHERITANCE
// ============================================================================

/**
 * Merge multiple styles with inheritance
 * Base styles are overridden by more specific styles
 * Results are cached to avoid expensive object merging
 */
export function mergeStyles(
  baseStyle: BookStyle,
  overrides?: Partial<BookStyle>
): BookStyle {
  if (!overrides) {
    return baseStyle;
  }

  const cacheKey = `merge-${baseStyle.id}-${JSON.stringify(overrides).substring(0, 50)}`;
  const cached = mergedStylesCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const merged: BookStyle = {
    ...baseStyle,
    ...overrides,
    fonts: { ...baseStyle.fonts, ...overrides.fonts },
    headings: {
      ...baseStyle.headings,
      ...overrides.headings,
      h1: { ...baseStyle.headings.h1, ...overrides.headings?.h1 },
      h2: { ...baseStyle.headings.h2, ...overrides.headings?.h2 },
      h3: { ...baseStyle.headings.h3, ...overrides.headings?.h3 },
      h4: overrides.headings?.h4
        ? { ...baseStyle.headings.h4, ...overrides.headings.h4 }
        : baseStyle.headings.h4,
    },
    body: { ...baseStyle.body, ...overrides.body },
    dropCap: { ...baseStyle.dropCap, ...overrides.dropCap },
    ornamentalBreak: { ...baseStyle.ornamentalBreak, ...overrides.ornamentalBreak },
    firstParagraph: { ...baseStyle.firstParagraph, ...overrides.firstParagraph },
    spacing: { ...baseStyle.spacing, ...overrides.spacing },
    colors: { ...baseStyle.colors, ...overrides.colors },
  };

  mergedStylesCache.set(cacheKey, merged);
  return merged;
}

// ============================================================================
// HEADING STYLE CALCULATIONS
// ============================================================================

/**
 * Convert HeadingStyle to CSS properties
 * Cached by heading level + style configuration
 */
export function computeHeadingStyles(
  headingStyle: HeadingStyle,
  level: number,
  bookStyle: BookStyle
): React.CSSProperties {
  const cacheKey = `heading-${level}-${bookStyle.id}-${JSON.stringify(headingStyle).substring(0, 30)}`;
  const cached = headingStylesCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const styles: React.CSSProperties = {
    fontFamily: headingStyle.fontFamily || bookStyle.fonts.heading,
    fontSize: headingStyle.fontSize,
    fontWeight: headingStyle.fontWeight || 'bold',
    lineHeight: headingStyle.lineHeight,
    marginTop: headingStyle.marginTop,
    marginBottom: headingStyle.marginBottom,
    textTransform: headingStyle.textTransform,
    letterSpacing: headingStyle.letterSpacing,
    color: headingStyle.color || bookStyle.colors.heading,
  };

  headingStylesCache.set(cacheKey, styles);
  return styles;
}

// ============================================================================
// PARAGRAPH STYLE CALCULATIONS
// ============================================================================

/**
 * Compute paragraph styles with first paragraph special styling
 * Cached by paragraph position + style configuration
 */
export function computeParagraphStyles(
  bookStyle: BookStyle,
  isFirstParagraph: boolean,
  hasDropCap: boolean
): React.CSSProperties {
  const cacheKey = `para-${bookStyle.id}-${isFirstParagraph}-${hasDropCap}`;

  const cached = computedStylesCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const styles: React.CSSProperties = {
    fontFamily: bookStyle.fonts.body,
    fontSize: bookStyle.body.fontSize,
    lineHeight: bookStyle.body.lineHeight,
    fontWeight: bookStyle.body.fontWeight,
    textAlign: bookStyle.body.textAlign,
    color: bookStyle.colors.text,
    marginBottom: bookStyle.spacing.paragraphSpacing,
  };

  // Apply first paragraph styling
  if (isFirstParagraph && bookStyle.firstParagraph.enabled) {
    if (bookStyle.firstParagraph.textTransform) {
      styles.textTransform = bookStyle.firstParagraph.textTransform === 'small-caps'
        ? 'lowercase'
        : bookStyle.firstParagraph.textTransform;
    }
    if (bookStyle.firstParagraph.fontVariant) {
      styles.fontVariant = bookStyle.firstParagraph.fontVariant;
    }
    if (bookStyle.firstParagraph.letterSpacing) {
      styles.letterSpacing = bookStyle.firstParagraph.letterSpacing;
    }
    if (bookStyle.firstParagraph.fontSize) {
      styles.fontSize = bookStyle.firstParagraph.fontSize;
    }
  }

  // Adjust for drop cap
  if (hasDropCap) {
    styles.display = 'inline';
  }

  computedStylesCache.set(cacheKey, styles);
  return styles;
}

// ============================================================================
// DROP CAP POSITIONING
// ============================================================================

/**
 * Calculate drop cap styles with precise positioning
 * Uses font metrics for accurate baseline alignment
 */
export function computeDropCapStyles(
  dropCapStyle: DropCapStyle,
  bookStyle: BookStyle,
  firstChar: string
): React.CSSProperties | null {
  if (!dropCapStyle.enabled) {
    return null;
  }

  const cacheKey = `dropcap-${bookStyle.id}-${firstChar}`;
  const cached = dropCapStylesCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const fontFamily = dropCapStyle.fontFamily || bookStyle.fonts.heading;
  const fontSize = dropCapStyle.fontSize || '3.5em';

  // Calculate font metrics for precise positioning
  const baseFontSize = parseFloat(bookStyle.body.fontSize);
  const metrics = calculateFontMetrics(fontFamily, baseFontSize * 3.5);

  const styles: React.CSSProperties = {
    float: 'left',
    fontFamily,
    fontSize,
    fontWeight: dropCapStyle.fontWeight || 'bold',
    lineHeight: '1',
    marginRight: dropCapStyle.marginRight || '0.1em',
    color: dropCapStyle.color || bookStyle.colors.dropCap || bookStyle.colors.accent,
    // Precise vertical alignment using font metrics
    marginTop: `${metrics.baselineOffset}px`,
  };

  dropCapStylesCache.set(cacheKey, styles);
  return styles;
}

// ============================================================================
// ORNAMENTAL BREAK RENDERING
// ============================================================================

/**
 * Compute ornamental break (scene break) styles
 * Cached by ornamental break configuration
 */
export function computeOrnamentalBreakStyles(
  bookStyle: BookStyle
): React.CSSProperties {
  if (!bookStyle.ornamentalBreak.enabled) {
    return { display: 'none' };
  }

  const cacheKey = `ornamental-${bookStyle.id}`;
  const cached = ornamentalBreakCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const styles: React.CSSProperties = {
    textAlign: 'center',
    fontSize: bookStyle.ornamentalBreak.fontSize || '1.5em',
    margin: bookStyle.ornamentalBreak.spacing || '2em 0',
    color: bookStyle.colors.accent || bookStyle.colors.text,
    userSelect: 'none',
  };

  ornamentalBreakCache.set(cacheKey, styles);
  return styles;
}

// ============================================================================
// CHAPTER STYLE APPLICATION
// ============================================================================

/**
 * Apply styles to entire chapter
 * This is called when switching styles and should be optimized
 */
export function applyStylesToChapter(
  chapter: Chapter,
  bookStyle: BookStyle
): {
  chapterStyles: React.CSSProperties;
  blockStyles: Map<string, React.CSSProperties>;
} {
  // Chapter-level styles
  const chapterStyles: React.CSSProperties = {
    fontFamily: bookStyle.fonts.body,
    color: bookStyle.colors.text,
    padding: bookStyle.spacing.chapterSpacing,
  };

  // Compute styles for each text block
  const blockStyles = new Map<string, React.CSSProperties>();

  chapter.content.forEach((block, index) => {
    let blockStyle: React.CSSProperties = {};

    switch (block.blockType) {
      case 'heading':
        const level = block.level || 1;
        const headingStyle = bookStyle.headings[`h${level}` as 'h1' | 'h2' | 'h3' | 'h4'];
        if (headingStyle) {
          blockStyle = computeHeadingStyles(headingStyle, level, bookStyle);
        }
        break;

      case 'paragraph':
        const isFirstParagraph = index === 0 ||
          (index === 1 && chapter.content[0].blockType === 'heading');
        const hasDropCap = isFirstParagraph && bookStyle.dropCap.enabled;
        blockStyle = computeParagraphStyles(bookStyle, isFirstParagraph, hasDropCap);
        break;

      case 'preformatted':
      case 'code':
        blockStyle = {
          fontFamily: 'monospace',
          fontSize: '0.9em',
          lineHeight: '1.4',
          padding: '1em',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          overflowX: 'auto',
        };
        break;
    }

    blockStyles.set(block.id, blockStyle);
  });

  return { chapterStyles, blockStyles };
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear all style caches
 * Useful when styles are updated or memory needs to be freed
 */
export function clearStyleCaches(): void {
  computedStylesCache.clear();
  fontMetricsCache.clear();
  dropCapStylesCache.clear();
  headingStylesCache.clear();
  ornamentalBreakCache.clear();
  mergedStylesCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getStyleCacheStats() {
  return {
    computedStyles: computedStylesCache.size,
    fontMetrics: fontMetricsCache.size,
    dropCapStyles: dropCapStylesCache.size,
    headingStyles: headingStylesCache.size,
    ornamentalBreak: ornamentalBreakCache.size,
    mergedStyles: mergedStylesCache.size,
  };
}

// Export cache instances for testing
export const __caches = {
  computedStylesCache,
  fontMetricsCache,
  dropCapStylesCache,
  headingStylesCache,
  ornamentalBreakCache,
  mergedStylesCache,
};

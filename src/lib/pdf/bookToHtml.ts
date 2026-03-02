/**
 * HTML converter for book content
 * Provides infrastructure and types for converting Book structure to HTML
 */

import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element, ElementType, MatterType } from '../../types/element';
import { TextBlock } from '../../types/textBlock';
import { BookStyle, Style } from '../../types/style';

/**
 * Options for HTML conversion
 */
export interface BookToHtmlOptions {
  /** Include CSS styles inline */
  includeInlineStyles?: boolean;
  /** Custom CSS class prefix */
  classPrefix?: string;
  /** Include HTML5 semantic tags */
  useSemanticTags?: boolean;
  /** Include ARIA attributes for accessibility */
  includeAria?: boolean;
  /** Custom style configuration */
  styleConfig?: BookStyle;
  /** Generate table of contents */
  includeToc?: boolean;
  /** Custom HTML escaping function */
  escapeHtml?: (text: string) => string;
  /** Custom metadata to include in HTML head */
  metadata?: Record<string, string>;
  /** Output format version */
  htmlVersion?: 'html5' | 'xhtml';
  /** Include chapter numbers */
  includeChapterNumbers?: boolean;
  /** Custom template variables */
  templateVariables?: Record<string, string>;
}

/**
 * Section type for HTML generation context
 */
export type SectionType =
  | 'front-matter'
  | 'body-chapter'
  | 'back-matter'
  | 'toc'
  | 'title-page';

/**
 * HTML generation context
 * Tracks current state during conversion
 */
export interface HtmlGenerationContext {
  /** Current chapter being processed */
  currentChapter?: Chapter;
  /** Current element being processed */
  currentElement?: Element;
  /** Current section type */
  sectionType: SectionType;
  /** Chapter index in book */
  chapterIndex?: number;
  /** Element index in current section */
  elementIndex?: number;
  /** Style configuration */
  styleConfig: BookStyle | null;
  /** Options for HTML generation */
  options: BookToHtmlOptions;
  /** Whether this is the first paragraph in a section */
  isFirstParagraph: boolean;
  /** Current heading level (for nesting) */
  currentHeadingLevel: number;
  /** Accumulated HTML fragments */
  htmlFragments: string[];
}

/**
 * Style application configuration
 */
export interface StyleContext {
  /** Book-level style */
  bookStyle?: BookStyle;
  /** Element or chapter style override */
  elementStyle?: Style;
  /** Inline style overrides */
  inlineStyles?: Record<string, string | number>;
  /** CSS classes to apply */
  cssClasses: string[];
}

/**
 * Tag configuration for semantic HTML
 */
export interface SemanticTagConfig {
  /** HTML tag name */
  tag: string;
  /** CSS classes */
  classes: string[];
  /** ARIA role */
  role?: string;
  /** ARIA attributes */
  ariaAttributes?: Record<string, string>;
  /** Custom data attributes */
  dataAttributes?: Record<string, string>;
}

/**
 * Main HTML converter class
 */
export class HtmlConverter {
  private readonly book: Book;
  private readonly options: BookToHtmlOptions;
  private context: HtmlGenerationContext;

  constructor(book: Book, options: BookToHtmlOptions = {}) {
    this.book = book;
    this.options = {
      includeInlineStyles: true,
      classPrefix: 'book',
      useSemanticTags: true,
      includeAria: true,
      includeToc: true,
      htmlVersion: 'html5',
      includeChapterNumbers: true,
      ...options,
    };

    this.context = this.initializeContext();
  }

  /**
   * Initialize HTML generation context
   */
  private initializeContext(): HtmlGenerationContext {
    return {
      sectionType: 'front-matter',
      styleConfig: this.options.styleConfig || null,
      options: this.options,
      isFirstParagraph: true,
      currentHeadingLevel: 1,
      htmlFragments: [],
    };
  }

  /**
   * Convert book to HTML
   * Main entry point for conversion
   */
  public convert(): string {
    // TODO: Implement actual conversion logic
    return '';
  }

  /**
   * Convert front matter to HTML
   */
  private convertFrontMatter(): string {
    // TODO: Implement front matter conversion
    return '';
  }

  /**
   * Convert chapters to HTML
   */
  private convertChapters(): string {
    // TODO: Implement chapter conversion
    return '';
  }

  /**
   * Convert back matter to HTML
   */
  private convertBackMatter(): string {
    // TODO: Implement back matter conversion
    return '';
  }

  /**
   * Convert a single text block to HTML
   */
  private convertTextBlock(block: TextBlock): string {
    // Only handle paragraph blocks in this implementation
    if (block.blockType !== 'paragraph') {
      return '';
    }

    return this.convertParagraph(block);
  }

  /**
   * Convert a paragraph block to HTML
   * Handles alignment, indentation, drop caps, and special styling
   */
  private convertParagraph(block: TextBlock): string {
    const classes: string[] = [];
    const inlineStyles: string[] = [];
    const prefix = this.options.classPrefix || 'book';

    // Base paragraph class
    classes.push(generateClassName('paragraph', undefined, prefix));

    // Handle text alignment
    const alignment = this.getTextAlignment(block);
    if (alignment) {
      classes.push(generateClassName('text', alignment, prefix));
      if (this.options.includeInlineStyles) {
        inlineStyles.push(`text-align: ${alignment}`);
      }
    }

    // Handle indentation
    const indentation = this.getParagraphIndentation(block);
    if (indentation) {
      classes.push(generateClassName('indent', indentation, prefix));
    }

    // Handle first paragraph special styling (drop caps)
    const isFirstParagraph = this.context.isFirstParagraph;
    if (isFirstParagraph && this.shouldApplyDropCap()) {
      classes.push(generateClassName('first-paragraph', undefined, prefix));
      classes.push(generateClassName('drop-cap', undefined, prefix));
    } else if (isFirstParagraph) {
      classes.push(generateClassName('first-paragraph', undefined, prefix));
    }

    // Handle empty paragraphs (for spacing)
    const content = block.content || '';
    const isEmpty = content.trim() === '';
    if (isEmpty) {
      classes.push(generateClassName('paragraph', 'empty', prefix));
    }

    // Escape and prepare content
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const escapedContent = isEmpty ? '&nbsp;' : escapeFn(content);

    // Build attributes
    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
    const styleAttr =
      inlineStyles.length > 0 && this.options.includeInlineStyles
        ? ` style="${inlineStyles.join('; ')}"`
        : '';

    // Mark that we've processed the first paragraph
    if (isFirstParagraph && !isEmpty) {
      this.context.isFirstParagraph = false;
    }

    return `<p${classAttr}${styleAttr}>${escapedContent}</p>`;
  }

  /**
   * Get text alignment from block style
   */
  private getTextAlignment(
    block: TextBlock
  ): 'left' | 'center' | 'right' | 'justify' | null {
    // Check for style reference
    if (block.style?.overrides?.textAlign) {
      return block.style.overrides.textAlign;
    }

    // Check for book-level body alignment
    if (this.context.styleConfig?.body?.textAlign) {
      return this.context.styleConfig.body.textAlign === 'justify'
        ? 'justify'
        : this.context.styleConfig.body.textAlign;
    }

    return null;
  }

  /**
   * Get paragraph indentation level
   */
  private getParagraphIndentation(block: TextBlock): string | null {
    // First paragraph typically has no indent (or special handling)
    if (this.context.isFirstParagraph) {
      const firstParaStyle = this.context.styleConfig?.firstParagraph;
      if (firstParaStyle?.indent?.enabled) {
        return 'first';
      }
      return 'none';
    }

    // Check for custom indentation in style overrides
    if (block.style?.overrides?.padding) {
      const padding = block.style.overrides.padding;
      if (typeof padding === 'string' && padding.includes('em')) {
        const value = parseFloat(padding);
        if (value >= 2) return 'large';
        if (value >= 1) return 'medium';
        if (value > 0) return 'small';
      }
    }

    // Default paragraph indentation
    return 'default';
  }

  /**
   * Determine if drop cap should be applied to current paragraph
   */
  private shouldApplyDropCap(): boolean {
    const dropCapConfig = this.context.styleConfig?.dropCap;
    if (!dropCapConfig || !dropCapConfig.enabled) {
      return false;
    }

    // Only apply to first paragraph of body chapters
    return (
      this.context.isFirstParagraph &&
      this.context.sectionType === 'body-chapter'
    );
  }

  /**
   * Update conversion context
   */
  private updateContext(updates: Partial<HtmlGenerationContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Reset context for new section
   */
  private resetContextForSection(sectionType: SectionType): void {
    this.context.sectionType = sectionType;
    this.context.isFirstParagraph = true;
    this.context.currentHeadingLevel = 1;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * HTML escape utility
 * Escapes special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Generate CSS class name
 * Creates consistent, prefixed class names
 */
export function generateClassName(
  base: string,
  modifier?: string,
  prefix: string = 'book'
): string {
  const parts = [prefix, base];
  if (modifier) {
    parts.push(modifier);
  }
  return parts.join('-');
}

/**
 * Select semantic HTML tag based on section type
 */
export function selectSemanticTag(
  sectionType: SectionType,
  elementType?: ElementType,
  useSemanticTags: boolean = true
): SemanticTagConfig {
  if (!useSemanticTags) {
    return {
      tag: 'div',
      classes: [generateClassName('section')],
    };
  }

  switch (sectionType) {
    case 'front-matter':
      return {
        tag: 'section',
        classes: [generateClassName('front-matter')],
        role: 'doc-frontmatter',
      };

    case 'body-chapter':
      return {
        tag: 'section',
        classes: [generateClassName('chapter')],
        role: 'doc-chapter',
      };

    case 'back-matter':
      return {
        tag: 'section',
        classes: [generateClassName('back-matter')],
        role: 'doc-backmatter',
      };

    case 'toc':
      return {
        tag: 'nav',
        classes: [generateClassName('toc')],
        role: 'doc-toc',
        ariaAttributes: { 'aria-label': 'Table of Contents' },
      };

    case 'title-page':
      return {
        tag: 'section',
        classes: [generateClassName('title-page')],
        role: 'doc-cover',
      };

    default:
      return {
        tag: 'section',
        classes: [generateClassName('section')],
      };
  }
}

/**
 * Select semantic tag for element type
 */
export function selectElementTag(
  elementType: ElementType,
  useSemanticTags: boolean = true
): SemanticTagConfig {
  if (!useSemanticTags) {
    return {
      tag: 'div',
      classes: [generateClassName('element', elementType)],
    };
  }

  const roleMap: Partial<Record<ElementType, string>> = {
    preface: 'doc-preface',
    foreword: 'doc-foreword',
    prologue: 'doc-prologue',
    epilogue: 'doc-epilogue',
    introduction: 'doc-introduction',
    dedication: 'doc-dedication',
    epigraph: 'doc-epigraph',
    acknowledgments: 'doc-acknowledgments',
    afterword: 'doc-afterword',
    appendix: 'doc-appendix',
    glossary: 'doc-glossary',
    bibliography: 'doc-bibliography',
    index: 'doc-index',
  };

  return {
    tag: 'section',
    classes: [generateClassName('element', elementType)],
    role: roleMap[elementType],
  };
}

/**
 * Generate HTML attributes from config
 */
export function generateAttributes(config: SemanticTagConfig): string {
  const attributes: string[] = [];

  // Add classes
  if (config.classes.length > 0) {
    attributes.push(`class="${config.classes.join(' ')}"`);
  }

  // Add role
  if (config.role) {
    attributes.push(`role="${config.role}"`);
  }

  // Add ARIA attributes
  if (config.ariaAttributes) {
    for (const [key, value] of Object.entries(config.ariaAttributes)) {
      attributes.push(`${key}="${escapeHtml(value)}"`);
    }
  }

  // Add data attributes
  if (config.dataAttributes) {
    for (const [key, value] of Object.entries(config.dataAttributes)) {
      attributes.push(`data-${key}="${escapeHtml(value)}"`);
    }
  }

  return attributes.length > 0 ? ' ' + attributes.join(' ') : '';
}

/**
 * Normalize whitespace in text
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}

/**
 * Check if text block is empty or contains only whitespace
 */
export function isEmptyTextBlock(block: TextBlock): boolean {
  return !block.content || block.content.trim() === '';
}

/**
 * Build CSS class list for a paragraph element
 */
export function buildParagraphClasses(
  alignment: string | null,
  indentation: string | null,
  isFirst: boolean,
  hasDropCap: boolean,
  isEmpty: boolean,
  prefix: string = 'book'
): string[] {
  const classes: string[] = [generateClassName('paragraph', undefined, prefix)];

  if (alignment) {
    classes.push(generateClassName('text', alignment, prefix));
  }

  if (indentation) {
    classes.push(generateClassName('indent', indentation, prefix));
  }

  if (isFirst) {
    classes.push(generateClassName('first-paragraph', undefined, prefix));
    if (hasDropCap) {
      classes.push(generateClassName('drop-cap', undefined, prefix));
    }
  }

  if (isEmpty) {
    classes.push(generateClassName('paragraph', 'empty', prefix));
  }

  return classes;
}

/**
 * Build inline style string for a paragraph element
 */
export function buildParagraphStyles(
  alignment: string | null,
  customStyles?: Record<string, string | number>
): string[] {
  const styles: string[] = [];

  if (alignment) {
    styles.push(`text-align: ${alignment}`);
  }

  if (customStyles) {
    for (const [key, value] of Object.entries(customStyles)) {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      styles.push(`${cssKey}: ${value}`);
    }
  }

  return styles;
}

/**
 * Convert matter type to section type
 */
export function matterTypeToSectionType(
  matterType: MatterType
): SectionType {
  switch (matterType) {
    case 'front':
      return 'front-matter';
    case 'body':
      return 'body-chapter';
    case 'back':
      return 'back-matter';
  }
}

/**
 * Main conversion function
 * Entry point for converting a book to HTML
 */
export function bookToHtml(
  book: Book,
  options: BookToHtmlOptions = {}
): string {
  const converter = new HtmlConverter(book, options);
  return converter.convert();
}

/**
 * HTML converter for book content
 * Provides infrastructure and types for converting Book structure to HTML
 *
 * CSS Class System Documentation:
 * ================================
 *
 * This module implements a comprehensive CSS class naming system for book HTML generation.
 * All classes follow BEM-like naming conventions with consistent prefixes.
 *
 * Class Categories:
 * - Layout: Container and structural classes
 * - Typography: Text styling and formatting
 * - Element: Content element types (chapters, paragraphs, etc.)
 * - Theme: Theme-specific variations
 * - State: Dynamic state classes (first-paragraph, has-drop-cap, etc.)
 * - Print: Print-specific styling classes
 *
 * Naming Convention:
 * - Base format: {prefix}-{category}-{name}--{modifier}
 * - Example: book-element-chapter--front-matter
 * - Prefix defaults to 'book' but is configurable
 *
 * Usage:
 * - Use CssClassNames enum for static class names
 * - Use ClassBuilder for dynamic class generation
 * - Use StyleMapper to convert BookStyle to CSS classes
 */

import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element, ElementType, MatterType } from '../../types/element';
import { TextBlock } from '../../types/textBlock';
import { BookStyle, Style } from '../../types/style';

// ============================================================================
// CSS Class System - Constants and Enums
// ============================================================================

/**
 * CSS class name constants
 * Centralized class names for consistent styling across the application
 */
export const CssClassNames = {
  // Layout containers
  LAYOUT: {
    CONTAINER: 'container',
    WRAPPER: 'wrapper',
    CONTENT: 'content',
    INNER: 'inner',
  },

  // Section types
  SECTION: {
    FRONT_MATTER: 'front-matter',
    BODY: 'body',
    BACK_MATTER: 'back-matter',
    CHAPTER: 'chapter',
    TOC: 'toc',
    TITLE_PAGE: 'title-page',
  },

  // Element types
  ELEMENT: {
    PARAGRAPH: 'paragraph',
    HEADING: 'heading',
    TITLE: 'title',
    SUBTITLE: 'subtitle',
    DEDICATION: 'dedication',
    EPIGRAPH: 'epigraph',
    QUOTE: 'quote',
    LIST: 'list',
    LIST_ITEM: 'list-item',
    IMAGE: 'image',
    FIGURE: 'figure',
    CAPTION: 'caption',
    SEPARATOR: 'separator',
    ORNAMENTAL_BREAK: 'ornamental-break',
  },

  // Typography elements
  TYPOGRAPHY: {
    DROP_CAP: 'drop-cap',
    FIRST_PARAGRAPH: 'first-paragraph',
    SMALL_CAPS: 'small-caps',
    EMPHASIS: 'emphasis',
    STRONG: 'strong',
    ITALIC: 'italic',
    BOLD: 'bold',
    UNDERLINE: 'underline',
    UPPERCASE: 'uppercase',
    LOWERCASE: 'lowercase',
    CAPITALIZE: 'capitalize',
  },

  // State modifiers
  STATE: {
    FIRST: 'first',
    LAST: 'last',
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
    HAS_DROP_CAP: 'has-drop-cap',
    HAS_IMAGE: 'has-image',
    NO_INDENT: 'no-indent',
  },

  // Theme variations
  THEME: {
    SERIF: 'serif',
    SANS_SERIF: 'sans-serif',
    SCRIPT: 'script',
    MODERN: 'modern',
    CLASSIC: 'classic',
    MINIMAL: 'minimal',
    ELEGANT: 'elegant',
  },

  // Print-specific classes
  PRINT: {
    PAGE: 'page',
    PAGE_BREAK_BEFORE: 'page-break-before',
    PAGE_BREAK_AFTER: 'page-break-after',
    PAGE_BREAK_AVOID: 'page-break-avoid',
    NO_BREAK: 'no-break',
    RUNNING_HEADER: 'running-header',
    RUNNING_FOOTER: 'running-footer',
    PAGE_NUMBER: 'page-number',
  },

  // Alignment
  ALIGN: {
    LEFT: 'align-left',
    CENTER: 'align-center',
    RIGHT: 'align-right',
    JUSTIFY: 'align-justify',
  },

  // Spacing
  SPACING: {
    TIGHT: 'spacing-tight',
    NORMAL: 'spacing-normal',
    LOOSE: 'spacing-loose',
    COMPACT: 'spacing-compact',
  },
} as const;

/**
 * CSS class categories for organized generation
 */
export enum CssClassCategory {
  LAYOUT = 'layout',
  SECTION = 'section',
  ELEMENT = 'element',
  TYPOGRAPHY = 'typography',
  STATE = 'state',
  THEME = 'theme',
  PRINT = 'print',
  ALIGN = 'align',
  SPACING = 'spacing',
}

/**
 * Theme types for class generation
 */
export enum ThemeType {
  SERIF = 'serif',
  SANS_SERIF = 'sans-serif',
  SCRIPT = 'script',
  MODERN = 'modern',
  CLASSIC = 'classic',
  MINIMAL = 'minimal',
  ELEGANT = 'elegant',
}

/**
 * Print media types
 */
export enum PrintMediaType {
  SCREEN = 'screen',
  PRINT = 'print',
  EBOOK = 'ebook',
  ALL = 'all',
}

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
 * Class builder options for dynamic class generation
 */
export interface ClassBuilderOptions {
  /** CSS class prefix (default: 'book') */
  prefix?: string;
  /** Current theme type */
  theme?: ThemeType;
  /** Target media type (screen, print, ebook) */
  mediaType?: PrintMediaType;
  /** Include state classes */
  includeState?: boolean;
  /** Custom class modifiers */
  modifiers?: string[];
}

/**
 * Style to CSS class mapping configuration
 */
export interface StyleMappingConfig {
  /** Map font families to theme classes */
  fontFamilyMap?: Map<string, string>;
  /** Map text alignment to classes */
  textAlignMap?: Map<string, string>;
  /** Map font weights to classes */
  fontWeightMap?: Map<string | number, string>;
  /** Map spacing values to classes */
  spacingMap?: Map<string, string>;
  /** Custom property mappings */
  customMappings?: Record<string, (value: any) => string[]>;
}

// ============================================================================
// CSS Class System - Helper Classes
// ============================================================================

/**
 * ClassBuilder - Dynamic CSS class generation
 *
 * Provides a fluent API for building CSS class names with proper prefixing,
 * modifiers, and theme support.
 *
 * Example usage:
 *   const builder = new ClassBuilder({ prefix: 'book', theme: ThemeType.SERIF });
 *   builder.add('paragraph').modifier('first').theme().build();
 *   // Returns: ['book-paragraph', 'book-paragraph--first', 'book-theme-serif']
 */
export class ClassBuilder {
  private classes: Set<string> = new Set();
  private readonly options: Required<ClassBuilderOptions>;

  constructor(options: ClassBuilderOptions = {}) {
    this.options = {
      prefix: options.prefix || 'book',
      theme: options.theme || ThemeType.CLASSIC,
      mediaType: options.mediaType || PrintMediaType.ALL,
      includeState: options.includeState !== false,
      modifiers: options.modifiers || [],
    };
  }

  /**
   * Add a base class name
   */
  add(className: string, category?: CssClassCategory): this {
    const fullClass = category
      ? `${this.options.prefix}-${category}-${className}`
      : `${this.options.prefix}-${className}`;
    this.classes.add(fullClass);
    return this;
  }

  /**
   * Add a class with a modifier
   */
  modifier(base: string, modifier: string): this {
    this.classes.add(`${this.options.prefix}-${base}--${modifier}`);
    return this;
  }

  /**
   * Add theme-specific class
   */
  theme(themeType?: ThemeType): this {
    const theme = themeType || this.options.theme;
    this.classes.add(`${this.options.prefix}-theme-${theme}`);
    return this;
  }

  /**
   * Add state class
   */
  state(stateName: string): this {
    if (this.options.includeState) {
      this.classes.add(`${this.options.prefix}-state-${stateName}`);
    }
    return this;
  }

  /**
   * Add print-specific class
   */
  print(className: string): this {
    this.classes.add(`${this.options.prefix}-print-${className}`);
    return this;
  }

  /**
   * Add media-specific class
   */
  media(mediaType?: PrintMediaType): this {
    const media = mediaType || this.options.mediaType;
    if (media !== PrintMediaType.ALL) {
      this.classes.add(`${this.options.prefix}-media-${media}`);
    }
    return this;
  }

  /**
   * Add element type class
   */
  element(elementType: ElementType | string): this {
    this.classes.add(`${this.options.prefix}-element-${elementType}`);
    return this;
  }

  /**
   * Add section type class
   */
  section(sectionType: SectionType | string): this {
    this.classes.add(`${this.options.prefix}-section-${sectionType}`);
    return this;
  }

  /**
   * Add typography class
   */
  typography(typographyClass: string): this {
    this.classes.add(`${this.options.prefix}-typography-${typographyClass}`);
    return this;
  }

  /**
   * Add alignment class
   */
  align(alignment: 'left' | 'center' | 'right' | 'justify'): this {
    this.classes.add(`${this.options.prefix}-align-${alignment}`);
    return this;
  }

  /**
   * Add spacing class
   */
  spacing(spacing: 'tight' | 'normal' | 'loose' | 'compact'): this {
    this.classes.add(`${this.options.prefix}-spacing-${spacing}`);
    return this;
  }

  /**
   * Add custom modifiers from options
   */
  applyModifiers(): this {
    this.options.modifiers.forEach((mod) => {
      this.classes.add(`${this.options.prefix}-${mod}`);
    });
    return this;
  }

  /**
   * Add raw class name without prefixing
   */
  raw(className: string): this {
    this.classes.add(className);
    return this;
  }

  /**
   * Conditionally add a class
   */
  when(condition: boolean, className: string, category?: CssClassCategory): this {
    if (condition) {
      this.add(className, category);
    }
    return this;
  }

  /**
   * Build and return array of class names
   */
  build(): string[] {
    return Array.from(this.classes);
  }

  /**
   * Build and return space-separated class string
   */
  buildString(): string {
    return this.build().join(' ');
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.classes.clear();
    return this;
  }

  /**
   * Clone the builder with current classes
   */
  clone(): ClassBuilder {
    const cloned = new ClassBuilder(this.options);
    this.classes.forEach((cls) => cloned.raw(cls));
    return cloned;
  }
}

/**
 * StyleMapper - Maps BookStyle and Style objects to CSS classes
 *
 * Converts style configuration objects into appropriate CSS class names
 * for consistent styling across ebook and print formats.
 *
 * Example usage:
 *   const mapper = new StyleMapper({ prefix: 'book' });
 *   const classes = mapper.mapBookStyle(bookStyle);
 *   // Returns array of CSS classes based on style configuration
 */
export class StyleMapper {
  private readonly prefix: string;
  private readonly config: StyleMappingConfig;

  constructor(prefix: string = 'book', config: StyleMappingConfig = {}) {
    this.prefix = prefix;
    this.config = this.initializeConfig(config);
  }

  /**
   * Initialize default style mappings
   */
  private initializeConfig(config: StyleMappingConfig): StyleMappingConfig {
    return {
      fontFamilyMap: config.fontFamilyMap || this.createFontFamilyMap(),
      textAlignMap: config.textAlignMap || this.createTextAlignMap(),
      fontWeightMap: config.fontWeightMap || this.createFontWeightMap(),
      spacingMap: config.spacingMap || this.createSpacingMap(),
      customMappings: config.customMappings || {},
    };
  }

  /**
   * Create font family to class name mapping
   */
  private createFontFamilyMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('serif', 'font-serif');
    map.set('sans-serif', 'font-sans');
    map.set('script', 'font-script');
    map.set('monospace', 'font-mono');
    return map;
  }

  /**
   * Create text alignment mapping
   */
  private createTextAlignMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('left', CssClassNames.ALIGN.LEFT);
    map.set('center', CssClassNames.ALIGN.CENTER);
    map.set('right', CssClassNames.ALIGN.RIGHT);
    map.set('justify', CssClassNames.ALIGN.JUSTIFY);
    return map;
  }

  /**
   * Create font weight mapping
   */
  private createFontWeightMap(): Map<string | number, string> {
    const map = new Map<string | number, string>();
    map.set('normal', 'weight-normal');
    map.set('bold', 'weight-bold');
    map.set('bolder', 'weight-bolder');
    map.set('lighter', 'weight-lighter');
    map.set(400, 'weight-normal');
    map.set(700, 'weight-bold');
    return map;
  }

  /**
   * Create spacing mapping
   */
  private createSpacingMap(): Map<string, string> {
    const map = new Map<string, string>();
    map.set('tight', CssClassNames.SPACING.TIGHT);
    map.set('normal', CssClassNames.SPACING.NORMAL);
    map.set('loose', CssClassNames.SPACING.LOOSE);
    map.set('compact', CssClassNames.SPACING.COMPACT);
    return map;
  }

  /**
   * Map BookStyle to CSS classes
   */
  mapBookStyle(bookStyle: BookStyle): string[] {
    const builder = new ClassBuilder({ prefix: this.prefix });

    // Add category-based theme class
    if (bookStyle.category) {
      builder.theme(this.mapCategoryToTheme(bookStyle.category));
    }

    // Add body text alignment
    if (bookStyle.body.textAlign) {
      const alignClass = this.config.textAlignMap?.get(bookStyle.body.textAlign);
      if (alignClass) {
        builder.raw(alignClass);
      }
    }

    // Add drop cap class if enabled
    if (bookStyle.dropCap.enabled) {
      builder.typography(CssClassNames.TYPOGRAPHY.DROP_CAP);
      builder.state(CssClassNames.STATE.HAS_DROP_CAP);
    }

    // Add first paragraph styling if enabled
    if (bookStyle.firstParagraph.enabled) {
      builder.typography(CssClassNames.TYPOGRAPHY.FIRST_PARAGRAPH);
    }

    // Add ornamental break if enabled
    if (bookStyle.ornamentalBreak.enabled) {
      builder.add(CssClassNames.ELEMENT.ORNAMENTAL_BREAK);
    }

    return builder.build();
  }

  /**
   * Map element Style to CSS classes
   */
  mapStyle(style: Style): string[] {
    const builder = new ClassBuilder({ prefix: this.prefix });

    // Font family
    if (style.fontFamily) {
      const fontClass = this.config.fontFamilyMap?.get(style.fontFamily);
      if (fontClass) {
        builder.raw(fontClass);
      }
    }

    // Font weight
    if (style.fontWeight) {
      const weightClass = this.config.fontWeightMap?.get(style.fontWeight);
      if (weightClass) {
        builder.raw(weightClass);
      }
    }

    // Font style
    if (style.fontStyle === 'italic') {
      builder.typography(CssClassNames.TYPOGRAPHY.ITALIC);
    }

    // Text alignment
    if (style.textAlign) {
      const alignClass = this.config.textAlignMap?.get(style.textAlign);
      if (alignClass) {
        builder.raw(alignClass);
      }
    }

    // Text decoration
    if (style.textDecoration === 'underline') {
      builder.typography(CssClassNames.TYPOGRAPHY.UNDERLINE);
    }

    // Text transform
    if (style.textTransform) {
      switch (style.textTransform) {
        case 'uppercase':
          builder.typography(CssClassNames.TYPOGRAPHY.UPPERCASE);
          break;
        case 'lowercase':
          builder.typography(CssClassNames.TYPOGRAPHY.LOWERCASE);
          break;
        case 'capitalize':
          builder.typography(CssClassNames.TYPOGRAPHY.CAPITALIZE);
          break;
      }
    }

    return builder.build();
  }

  /**
   * Map style category to theme type
   */
  private mapCategoryToTheme(category: string): ThemeType {
    switch (category) {
      case 'serif':
        return ThemeType.SERIF;
      case 'sans-serif':
        return ThemeType.SANS_SERIF;
      case 'script':
        return ThemeType.SCRIPT;
      case 'modern':
        return ThemeType.MODERN;
      default:
        return ThemeType.CLASSIC;
    }
  }

  /**
   * Generate classes for heading level
   */
  mapHeadingLevel(level: number, style?: Style): string[] {
    const builder = new ClassBuilder({ prefix: this.prefix });
    builder.add(CssClassNames.ELEMENT.HEADING);
    builder.modifier(CssClassNames.ELEMENT.HEADING, `h${level}`);

    if (style) {
      builder.raw(...this.mapStyle(style));
    }

    return builder.build();
  }

  /**
   * Generate classes for paragraph with context
   */
  mapParagraph(
    isFirst: boolean,
    hasDropCap: boolean,
    style?: Style
  ): string[] {
    const builder = new ClassBuilder({ prefix: this.prefix });
    builder.add(CssClassNames.ELEMENT.PARAGRAPH);

    if (isFirst) {
      builder.state(CssClassNames.STATE.FIRST);
      builder.typography(CssClassNames.TYPOGRAPHY.FIRST_PARAGRAPH);
    }

    if (hasDropCap) {
      builder.state(CssClassNames.STATE.HAS_DROP_CAP);
    }

    if (style) {
      builder.raw(...this.mapStyle(style));
    }

    return builder.build();
  }

  /**
   * Generate classes for element type
   */
  mapElementType(elementType: ElementType, matterType: MatterType): string[] {
    const builder = new ClassBuilder({ prefix: this.prefix });
    builder.element(elementType);
    builder.modifier('element', matterType);
    return builder.build();
  }
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
    // TODO: Implement text block conversion
    return '';
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
// Utility Functions - Class Generation Helpers
// ============================================================================

/**
 * Generate classes for section based on context
 *
 * Creates appropriate CSS classes for a section element considering:
 * - Section type (front-matter, chapter, back-matter, etc.)
 * - Print vs ebook requirements
 * - Theme variations
 * - Page break requirements
 *
 * @param sectionType The type of section
 * @param context HTML generation context
 * @returns Array of CSS class names
 */
export function generateSectionClasses(
  sectionType: SectionType,
  context: HtmlGenerationContext
): string[] {
  const builder = new ClassBuilder({
    prefix: context.options.classPrefix || 'book',
    includeState: true,
  });

  builder.section(sectionType);

  // Add print-specific classes
  if (sectionType === 'body-chapter' || sectionType === 'title-page') {
    builder.print(CssClassNames.PRINT.PAGE_BREAK_BEFORE);
  }

  // Add theme if available
  if (context.styleConfig?.category) {
    const theme = mapCategoryToTheme(context.styleConfig.category);
    builder.theme(theme);
  }

  // Add state classes
  if (context.chapterIndex === 0) {
    builder.state(CssClassNames.STATE.FIRST);
  }

  return builder.build();
}

/**
 * Generate classes for paragraph element
 *
 * @param context HTML generation context
 * @param style Optional style override
 * @returns Array of CSS class names
 */
export function generateParagraphClasses(
  context: HtmlGenerationContext,
  style?: Style
): string[] {
  const mapper = new StyleMapper(context.options.classPrefix);

  const hasDropCap =
    context.isFirstParagraph &&
    context.styleConfig?.dropCap?.enabled === true;

  return mapper.mapParagraph(context.isFirstParagraph, hasDropCap, style);
}

/**
 * Generate classes for heading element
 *
 * @param level Heading level (1-6)
 * @param context HTML generation context
 * @param style Optional style override
 * @returns Array of CSS class names
 */
export function generateHeadingClasses(
  level: number,
  context: HtmlGenerationContext,
  style?: Style
): string[] {
  const mapper = new StyleMapper(context.options.classPrefix);
  const classes = mapper.mapHeadingLevel(level, style);

  // Add page break avoidance for print
  const builder = new ClassBuilder({
    prefix: context.options.classPrefix || 'book',
  });
  classes.forEach((cls) => builder.raw(cls));
  builder.print(CssClassNames.PRINT.PAGE_BREAK_AVOID);

  return builder.build();
}

/**
 * Generate classes for element based on type and matter
 *
 * @param element The element to generate classes for
 * @param context HTML generation context
 * @returns Array of CSS class names
 */
export function generateElementClasses(
  element: Element,
  context: HtmlGenerationContext
): string[] {
  const mapper = new StyleMapper(context.options.classPrefix);
  const classes = mapper.mapElementType(element.type, element.matter);

  // Add style-based classes if element has style reference
  if (element.style && context.styleConfig) {
    // In a real implementation, we would resolve the style reference
    // For now, we'll add a placeholder
    const builder = new ClassBuilder({
      prefix: context.options.classPrefix || 'book',
    });
    classes.forEach((cls) => builder.raw(cls));

    // Add book style classes
    if (context.styleConfig) {
      const bookStyleClasses = mapper.mapBookStyle(context.styleConfig);
      bookStyleClasses.forEach((cls) => builder.raw(cls));
    }

    return builder.build();
  }

  return classes;
}

/**
 * Generate classes for text block based on formatting
 *
 * @param block Text block to analyze
 * @param prefix Class prefix
 * @returns Array of CSS class names
 */
export function generateTextBlockClasses(
  block: TextBlock,
  prefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix });

  // Add formatting classes based on text block properties
  if (block.style) {
    const mapper = new StyleMapper(prefix);
    const styleClasses = mapper.mapStyle(block.style);
    styleClasses.forEach((cls) => builder.raw(cls));
  }

  return builder.build();
}

/**
 * Generate classes for list elements
 *
 * @param ordered Whether the list is ordered
 * @param level Nesting level
 * @param prefix Class prefix
 * @returns Array of CSS class names
 */
export function generateListClasses(
  ordered: boolean,
  level: number = 0,
  prefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix });
  builder.add(CssClassNames.ELEMENT.LIST);
  builder.modifier('list', ordered ? 'ordered' : 'unordered');

  if (level > 0) {
    builder.modifier('list', `level-${level}`);
  }

  return builder.build();
}

/**
 * Generate classes for ornamental break
 *
 * @param style Style configuration for the break
 * @param prefix Class prefix
 * @returns Array of CSS class names
 */
export function generateOrnamentalBreakClasses(
  style?: BookStyle,
  prefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix });
  builder.add(CssClassNames.ELEMENT.ORNAMENTAL_BREAK);
  builder.add(CssClassNames.ELEMENT.SEPARATOR);

  if (style?.ornamentalBreak.textAlign) {
    builder.align(
      style.ornamentalBreak.textAlign as 'left' | 'center' | 'right'
    );
  } else {
    builder.align('center');
  }

  return builder.build();
}

/**
 * Generate classes for drop cap
 *
 * @param style Drop cap style configuration
 * @param prefix Class prefix
 * @returns Array of CSS class names
 */
export function generateDropCapClasses(
  style?: BookStyle,
  prefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix });

  if (style?.dropCap.enabled) {
    builder.typography(CssClassNames.TYPOGRAPHY.DROP_CAP);
    builder.modifier('drop-cap', `lines-${style.dropCap.lines || 3}`);
  }

  return builder.build();
}

/**
 * Generate print-specific classes
 *
 * @param options Print options
 * @param prefix Class prefix
 * @returns Array of CSS class names
 */
export function generatePrintClasses(
  options: {
    pageBreakBefore?: boolean;
    pageBreakAfter?: boolean;
    avoidBreak?: boolean;
    runningHeader?: boolean;
  },
  prefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix });

  if (options.pageBreakBefore) {
    builder.print(CssClassNames.PRINT.PAGE_BREAK_BEFORE);
  }

  if (options.pageBreakAfter) {
    builder.print(CssClassNames.PRINT.PAGE_BREAK_AFTER);
  }

  if (options.avoidBreak) {
    builder.print(CssClassNames.PRINT.PAGE_BREAK_AVOID);
  }

  if (options.runningHeader) {
    builder.print(CssClassNames.PRINT.RUNNING_HEADER);
  }

  return builder.build();
}

/**
 * Map book style category to theme type
 */
function mapCategoryToTheme(category: string): ThemeType {
  switch (category) {
    case 'serif':
      return ThemeType.SERIF;
    case 'sans-serif':
      return ThemeType.SANS_SERIF;
    case 'script':
      return ThemeType.SCRIPT;
    case 'modern':
      return ThemeType.MODERN;
    default:
      return ThemeType.CLASSIC;
  }
}

/**
 * Combine multiple class arrays into a single deduplicated array
 *
 * @param classArrays Multiple arrays of class names
 * @returns Deduplicated array of class names
 */
export function combineClasses(...classArrays: (string[] | undefined)[]): string[] {
  const classSet = new Set<string>();

  for (const classes of classArrays) {
    if (classes) {
      classes.forEach((cls) => classSet.add(cls));
    }
  }

  return Array.from(classSet);
}

/**
 * Convert class array to HTML class attribute string
 *
 * @param classes Array of class names
 * @returns HTML class attribute string or empty string if no classes
 */
export function classesToAttribute(classes: string[]): string {
  if (classes.length === 0) {
    return '';
  }
  return ` class="${classes.join(' ')}"`;
}

// ============================================================================
// Utility Functions - HTML Generation
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
 * Generate CSS class name (Legacy function - use ClassBuilder for new code)
 * Creates consistent, prefixed class names
 *
 * @deprecated Use ClassBuilder for more flexible class generation
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

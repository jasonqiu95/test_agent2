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
import { Break, TextFeature, Quote, Verse, List as ListFeature, ListItem } from '../../types/textFeature';

/**
 * Ornamental break style options
 */
export type OrnamentalBreakStyle = 'asterisk' | 'symbol' | 'image' | 'custom';

/**
 * Ornamental break configuration
 */
export interface OrnamentalBreakConfig {
  /** Break style type */
  style: OrnamentalBreakStyle;
  /** Symbol or character to use (for asterisk, symbol, or custom styles) */
  symbol?: string;
  /** Image URL (for image style) */
  imageUrl?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Font size for symbol */
  fontSize?: string;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Top margin */
  marginTop?: string;
  /** Bottom margin */
  marginBottom?: string;
}

/**
 * Heading numbering style
 */
export type HeadingNumberingStyle =
  | 'decimal'        // 1, 2, 3
  | 'decimal-dot'    // 1., 2., 3.
  | 'roman-upper'    // I, II, III
  | 'roman-lower'    // i, ii, iii
  | 'alpha-upper'    // A, B, C
  | 'alpha-lower'    // a, b, c
  | 'none';          // No numbering

/**
 * Heading configuration for subheads and section headings
 */
export interface HeadingConfig {
  /** Whether to include numbering */
  numbering?: boolean;
  /** Numbering style */
  numberingStyle?: HeadingNumberingStyle;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Whether to uppercase the heading */
  uppercase?: boolean;
  /** Whether to apply small caps */
  smallCaps?: boolean;
  /** Top spacing (in CSS units) */
  marginTop?: string;
  /** Bottom spacing (in CSS units) */
  marginBottom?: string;
  /** Font size (in CSS units) */
  fontSize?: string;
  /** Font weight */
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  /** Whether to include in document outline */
  includeInOutline?: boolean;
}

/**
 * Heading hierarchy context for tracking heading levels within a chapter
 */
export interface HeadingHierarchyContext {
  /** Current heading counters by level (1-6) */
  counters: Map<number, number>;
  /** Parent heading level */
  parentLevel?: number;
}

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
    SUBHEAD: 'subhead',
    SECTION_HEADING: 'section-heading',
    TITLE: 'title',
    SUBTITLE: 'subtitle',
    DEDICATION: 'dedication',
    EPIGRAPH: 'epigraph',
    QUOTE: 'quote',
    BLOCKQUOTE: 'blockquote',
    QUOTE_ATTRIBUTION: 'quote-attribution',
    LIST: 'list',
    LIST_ITEM: 'list-item',
    VERSE: 'verse',
    VERSE_LINE: 'verse-line',
    POETRY: 'poetry',
    PREFORMATTED: 'preformatted',
    CODE: 'code',
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
    NUMBERED: 'numbered',
    UNNUMBERED: 'unnumbered',
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
  /** Ornamental break configuration */
  ornamentalBreakConfig?: OrnamentalBreakConfig;
  /** Enable page break hints for print */
  enablePageBreaks?: boolean;
  /** Heading configuration for subheads */
  headingConfig?: HeadingConfig;
  /** Enable automatic heading hierarchy numbering */
  enableHeadingNumbering?: boolean;
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
  /** Heading hierarchy context for numbering */
  headingHierarchy: HeadingHierarchyContext;
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
      headingHierarchy: {
        counters: new Map(),
        parentLevel: undefined,
      },
      htmlFragments: [],
    };
  }

  /**
   * Convert book to HTML
   * Main entry point for conversion
   */
  public convert(): string {
    const fragments: string[] = [];

    // Convert front matter
    const frontMatterHtml = this.convertFrontMatter();
    if (frontMatterHtml) {
      fragments.push(frontMatterHtml);
    }

    // Convert chapters
    const chaptersHtml = this.convertChapters();
    if (chaptersHtml) {
      fragments.push(chaptersHtml);
    }

    // Convert back matter
    const backMatterHtml = this.convertBackMatter();
    if (backMatterHtml) {
      fragments.push(backMatterHtml);
    }

    // Wrap in main container if semantic tags are enabled
    if (this.options.useSemanticTags) {
      const prefix = this.options.classPrefix || 'book';
      const bookClasses = [generateClassName('container', undefined, prefix)];
      const roleAttr = this.options.includeAria ? ' role="main"' : '';
      return `<main class="${bookClasses.join(' ')}"${roleAttr}>\n${fragments.join('\n\n')}\n</main>`;
    }

    return fragments.join('\n\n');
  }

  /**
   * Convert front matter to HTML
   */
  private convertFrontMatter(): string {
    if (!this.book.frontMatter || this.book.frontMatter.length === 0) {
      return '';
    }

    this.resetContextForSection('front-matter');
    const elementsHtml = this.book.frontMatter
      .map((element, index) => {
        this.updateContext({ currentElement: element, elementIndex: index });
        return this.convertElement(element);
      })
      .join('\n\n');

    return elementsHtml;
  }

  /**
   * Convert chapters to HTML
   */
  private convertChapters(): string {
    if (!this.book.chapters || this.book.chapters.length === 0) {
      return '';
    }

    this.resetContextForSection('body-chapter');
    const chaptersHtml = this.book.chapters
      .map((chapter, index) => {
        this.updateContext({ currentChapter: chapter, chapterIndex: index });
        return this.convertSingleChapter(chapter, index);
      })
      .join('\n\n');

    return chaptersHtml;
  }

  /**
   * Convert a single chapter to HTML
   */
  private convertSingleChapter(chapter: Chapter, index: number): string {
    const fragments: string[] = [];
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const includeAria = this.options.includeAria ?? true;
    const includeChapterNumbers = this.options.includeChapterNumbers ?? true;

    // Determine chapter matter type (front, body, back) based on metadata or position
    const matterType = this.determineChapterMatterType(chapter, index);
    const sectionType = matterTypeToSectionType(matterType);

    // Create semantic tag config for chapter container
    const tagConfig = this.getChapterTagConfig(
      chapter,
      matterType,
      useSemanticTags,
      includeAria
    );

    // Open chapter container
    fragments.push(
      `<${tagConfig.tag}${generateAttributes(tagConfig)}>`
    );

    // Add chapter header (number, title, subtitle)
    const headerHtml = this.convertChapterHeader(
      chapter,
      includeChapterNumbers
    );
    if (headerHtml) {
      fragments.push(headerHtml);
    }

    // Add epigraph if present
    if (chapter.epigraph) {
      fragments.push(this.convertChapterEpigraph(chapter));
    }

    // Add chapter content
    const contentHtml = this.convertChapterContent(chapter);
    if (contentHtml) {
      fragments.push(contentHtml);
    }

    // Close chapter container
    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Get semantic tag configuration for chapter
   */
  private getChapterTagConfig(
    chapter: Chapter,
    matterType: MatterType,
    useSemanticTags: boolean,
    includeAria: boolean
  ): SemanticTagConfig {
    const prefix = this.options.classPrefix || 'book';
    const classes: string[] = [];
    const ariaAttributes: Record<string, string> = {};
    const dataAttributes: Record<string, string> = {};

    // Base chapter class
    classes.push(generateClassName('chapter', undefined, prefix));

    // Matter type class
    classes.push(
      generateClassName('chapter', matterType, prefix)
    );

    // Part number class if applicable
    if (chapter.partNumber !== undefined) {
      classes.push(
        generateClassName('chapter', `part-${chapter.partNumber}`, prefix)
      );
    }

    // ARIA labels
    if (includeAria) {
      if (chapter.title) {
        ariaAttributes['aria-label'] = chapter.title;
      }
      if (chapter.number !== undefined) {
        ariaAttributes['aria-labelledby'] = `chapter-${chapter.number}-heading`;
      }
    }

    // Data attributes
    dataAttributes['chapter-id'] = chapter.id;
    if (chapter.number !== undefined) {
      dataAttributes['chapter-number'] = String(chapter.number);
    }

    return {
      tag: useSemanticTags ? 'article' : 'div',
      classes,
      role: useSemanticTags && includeAria ? 'doc-chapter' : undefined,
      ariaAttributes: includeAria ? ariaAttributes : undefined,
      dataAttributes,
    };
  }

  /**
   * Convert chapter header (number, title, subtitle) to HTML
   */
  private convertChapterHeader(
    chapter: Chapter,
    includeChapterNumbers: boolean
  ): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const headingLevel = this.context.currentHeadingLevel;
    const headingTag = this.getHeadingTag(headingLevel);

    // Create header container
    const headerClasses = [generateClassName('chapter-header', undefined, prefix)];
    fragments.push(`<header class="${headerClasses.join(' ')}">`);

    // Add part title if present
    if (chapter.partTitle) {
      const partTitleClasses = [
        generateClassName('chapter-part-title', undefined, prefix),
      ];
      fragments.push(
        `<div class="${partTitleClasses.join(' ')}">${escapeHtml(chapter.partTitle)}</div>`
      );
    }

    // Build chapter heading
    const headingFragments: string[] = [];
    const headingClasses = [generateClassName('chapter-title', undefined, prefix)];
    const headingId =
      chapter.number !== undefined
        ? `chapter-${chapter.number}-heading`
        : `chapter-${chapter.id}-heading`;

    // Add chapter number if applicable
    if (includeChapterNumbers && chapter.number !== undefined) {
      const numberClasses = [
        generateClassName('chapter-number', undefined, prefix),
      ];
      headingFragments.push(
        `<span class="${numberClasses.join(' ')}">Chapter ${chapter.number}</span>`
      );
    }

    // Add chapter title
    if (chapter.title) {
      const titleSpanClasses = [
        generateClassName('chapter-title-text', undefined, prefix),
      ];
      headingFragments.push(
        `<span class="${titleSpanClasses.join(' ')}">${escapeHtml(chapter.title)}</span>`
      );
    }

    // Output chapter heading
    if (headingFragments.length > 0) {
      fragments.push(
        `<${headingTag} id="${headingId}" class="${headingClasses.join(' ')}">${headingFragments.join(' ')}</${headingTag}>`
      );
    }

    // Add subtitle if present
    if (chapter.subtitle) {
      const subtitleClasses = [
        generateClassName('chapter-subtitle', undefined, prefix),
      ];
      const subtitleTag = this.getHeadingTag(headingLevel + 1);
      fragments.push(
        `<${subtitleTag} class="${subtitleClasses.join(' ')}">${escapeHtml(chapter.subtitle)}</${subtitleTag}>`
      );
    }

    // Close header container
    fragments.push('</header>');

    return fragments.join('\n');
  }

  /**
   * Convert chapter epigraph to HTML
   */
  private convertChapterEpigraph(chapter: Chapter): string {
    if (!chapter.epigraph) {
      return '';
    }

    const prefix = this.options.classPrefix || 'book';
    const fragments: string[] = [];
    const epigraphClasses = [
      generateClassName('chapter-epigraph', undefined, prefix),
    ];

    fragments.push(`<div class="${epigraphClasses.join(' ')}">`);
    fragments.push(`<blockquote>${escapeHtml(chapter.epigraph)}</blockquote>`);

    if (chapter.epigraphAttribution) {
      const attributionClasses = [
        generateClassName('epigraph-attribution', undefined, prefix),
      ];
      fragments.push(
        `<cite class="${attributionClasses.join(' ')}">${escapeHtml(chapter.epigraphAttribution)}</cite>`
      );
    }

    fragments.push('</div>');

    return fragments.join('\n');
  }

  /**
   * Convert chapter content (text blocks) to HTML
   */
  private convertChapterContent(chapter: Chapter): string {
    if (!chapter.content || chapter.content.length === 0) {
      return '';
    }

    const prefix = this.options.classPrefix || 'book';
    const contentClasses = [
      generateClassName('chapter-content', undefined, prefix),
    ];

    const contentHtml = chapter.content
      .map((block) => this.convertTextBlock(block))
      .filter((html) => html.length > 0)
      .join('\n');

    if (!contentHtml) {
      return '';
    }

    return `<div class="${contentClasses.join(' ')}">\n${contentHtml}\n</div>`;
  }

  /**
   * Determine chapter matter type based on metadata or position
   */
  private determineChapterMatterType(
    chapter: Chapter,
    index: number
  ): MatterType {
    // Check if chapter has custom matter type in metadata
    if (chapter.custom?.matterType) {
      const matterType = chapter.custom.matterType as string;
      if (
        matterType === 'front' ||
        matterType === 'body' ||
        matterType === 'back'
      ) {
        return matterType as MatterType;
      }
    }

    // Default: all chapters are body matter
    // (front/back matter should typically be handled via Elements)
    return 'body';
  }

  /**
   * Get appropriate heading tag for heading level
   */
  private getHeadingTag(level: number): string {
    const clampedLevel = Math.max(1, Math.min(6, level));
    return `h${clampedLevel}`;
  }

  /**
   * Convert back matter to HTML
   */
  private convertBackMatter(): string {
    if (!this.book.backMatter || this.book.backMatter.length === 0) {
      return '';
    }

    this.resetContextForSection('back-matter');
    const elementsHtml = this.book.backMatter
      .map((element, index) => {
        this.updateContext({ currentElement: element, elementIndex: index });
        return this.convertElement(element);
      })
      .join('\n\n');

    return elementsHtml;
  }

  /**
   * Convert a single element (front/back matter) to HTML
   */
  private convertElement(element: Element): string {
    // Route to specialized conversion methods based on element type
    switch (element.type) {
      case 'title-page':
        return this.convertTitlePage(element);
      case 'copyright':
        return this.convertCopyright(element);
      case 'dedication':
        return this.convertDedication(element);
      case 'epigraph':
        return this.convertEpigraph(element);
      case 'foreword':
      case 'preface':
      case 'introduction':
        return this.convertIntroductoryElement(element);
      case 'epilogue':
      case 'afterword':
        return this.convertConcludingElement(element);
      case 'acknowledgments':
        return this.convertAcknowledgments(element);
      case 'about-author':
        return this.convertAboutAuthor(element);
      case 'also-by':
        return this.convertAlsoBy(element);
      case 'bibliography':
        return this.convertBibliography(element);
      default:
        return this.convertGenericElement(element);
    }
  }

  /**
   * Convert a generic element to HTML (fallback for unspecified types)
   */
  private convertGenericElement(element: Element): string {
    const fragments: string[] = [];
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const includeAria = this.options.includeAria ?? true;

    // Get semantic tag config for element
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    // Add matter type class
    const prefix = this.options.classPrefix || 'book';
    const matterClass = generateClassName(
      'element',
      element.matter,
      prefix
    );
    tagConfig.classes.push(matterClass);

    // Add ARIA attributes
    if (includeAria && element.title) {
      tagConfig.ariaAttributes = {
        ...tagConfig.ariaAttributes,
        'aria-label': element.title,
      };
    }

    // Add data attributes
    tagConfig.dataAttributes = {
      ...tagConfig.dataAttributes,
      'element-id': element.id,
      'element-type': element.type,
    };

    // Open element container
    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Add element title
    if (element.title) {
      const headingLevel = this.context.currentHeadingLevel;
      const headingTag = this.getHeadingTag(headingLevel);
      const titleClasses = [generateClassName('element-title', undefined, prefix)];
      fragments.push(
        `<${headingTag} class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add element content
    if (element.content && element.content.length > 0) {
      const contentClasses = [generateClassName('element-content', undefined, prefix)];
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(
          `<div class="${contentClasses.join(' ')}">\n${contentHtml}\n</div>`
        );
      }
    }

    // Close element container
    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Add matter type class to tag config
   */
  private addMatterTypeClass(tagConfig: SemanticTagConfig, element: Element): void {
    const prefix = this.options.classPrefix || 'book';
    const matterClass = generateClassName('element', element.matter, prefix);
    tagConfig.classes.push(matterClass);
  }

  /**
   * Convert title page to HTML
   * Title page typically includes book title, subtitle, author name, and publisher info
   */
  private convertTitlePage(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    // Add special classes for title page
    tagConfig.classes.push(generateClassName('element', 'title-page', prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('page-break', 'after', prefix));

    // Add data attributes
    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Title page content is typically center-aligned
    const contentClasses = [
      generateClassName('element-content', undefined, prefix),
      generateClassName('text', 'center', prefix),
      generateClassName('title-page-content', undefined, prefix),
    ];

    fragments.push(`<div class="${contentClasses.join(' ')}">`);

    // Render content blocks with special styling
    if (element.content && element.content.length > 0) {
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(contentHtml);
      }
    }

    fragments.push('</div>');
    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert copyright page to HTML
   * Copyright page includes copyright notice, ISBN, publisher info, etc.
   */
  private convertCopyright(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'copyright', prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('page-break', 'after', prefix));

    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Copyright content typically uses small text
    const contentClasses = [
      generateClassName('element-content', undefined, prefix),
      generateClassName('copyright-content', undefined, prefix),
    ];

    fragments.push(`<div class="${contentClasses.join(' ')}">`);

    if (element.content && element.content.length > 0) {
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(contentHtml);
      }
    }

    fragments.push('</div>');
    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert dedication to HTML
   * Dedication is typically short, centered, and italicized
   */
  private convertDedication(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'dedication', prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('page-break', 'after', prefix));

    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Add optional title
    if (element.title) {
      const headingLevel = this.context.currentHeadingLevel;
      const headingTag = this.getHeadingTag(headingLevel);
      const titleClasses = [
        generateClassName('element-title', undefined, prefix),
        generateClassName('text', 'center', prefix),
      ];
      fragments.push(
        `<${headingTag} class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Dedication content is centered and often italicized
    const contentClasses = [
      generateClassName('element-content', undefined, prefix),
      generateClassName('text', 'center', prefix),
      generateClassName('dedication-content', undefined, prefix),
    ];

    fragments.push(`<div class="${contentClasses.join(' ')}">`);

    if (element.content && element.content.length > 0) {
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(contentHtml);
      }
    }

    fragments.push('</div>');
    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert epigraph to HTML
   * Epigraph is a short quotation at the beginning, typically right-aligned
   */
  private convertEpigraph(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'epigraph', prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('page-break', 'after', prefix));

    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Epigraph content is typically right-aligned or centered
    const contentClasses = [
      generateClassName('element-content', undefined, prefix),
      generateClassName('text', 'right', prefix),
      generateClassName('epigraph-content', undefined, prefix),
    ];

    fragments.push(`<div class="${contentClasses.join(' ')}">`);

    if (element.content && element.content.length > 0) {
      // Wrap epigraph in blockquote for semantic meaning
      fragments.push('<blockquote>');

      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(contentHtml);
      }

      fragments.push('</blockquote>');
    }

    fragments.push('</div>');
    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert introductory elements (foreword, preface, introduction) to HTML
   * These elements typically have a title and standard text formatting
   */
  private convertIntroductoryElement(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', element.type, prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('element', 'introductory', prefix));
    tagConfig.classes.push(generateClassName('page-break', 'before', prefix));

    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Add title
    if (element.title) {
      const headingLevel = this.context.currentHeadingLevel;
      const headingTag = this.getHeadingTag(headingLevel);
      const titleClasses = [
        generateClassName('element-title', undefined, prefix),
        generateClassName('text', 'center', prefix),
      ];
      fragments.push(
        `<${headingTag} class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add content
    if (element.content && element.content.length > 0) {
      const contentClasses = [generateClassName('element-content', undefined, prefix)];
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(
          `<div class="${contentClasses.join(' ')}">\n${contentHtml}\n</div>`
        );
      }
    }

    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert concluding elements (epilogue, afterword) to HTML
   * These elements typically have a title and standard text formatting
   */
  private convertConcludingElement(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', element.type, prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('element', 'concluding', prefix));
    tagConfig.classes.push(generateClassName('page-break', 'before', prefix));

    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Add title
    if (element.title) {
      const headingLevel = this.context.currentHeadingLevel;
      const headingTag = this.getHeadingTag(headingLevel);
      const titleClasses = [
        generateClassName('element-title', undefined, prefix),
        generateClassName('text', 'center', prefix),
      ];
      fragments.push(
        `<${headingTag} class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add content
    if (element.content && element.content.length > 0) {
      const contentClasses = [generateClassName('element-content', undefined, prefix)];
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(
          `<div class="${contentClasses.join(' ')}">\n${contentHtml}\n</div>`
        );
      }
    }

    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert acknowledgments to HTML
   */
  private convertAcknowledgments(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'acknowledgments', prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('page-break', 'before', prefix));

    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Add title
    if (element.title) {
      const headingLevel = this.context.currentHeadingLevel;
      const headingTag = this.getHeadingTag(headingLevel);
      const titleClasses = [
        generateClassName('element-title', undefined, prefix),
        generateClassName('text', 'center', prefix),
      ];
      fragments.push(
        `<${headingTag} class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add content
    if (element.content && element.content.length > 0) {
      const contentClasses = [generateClassName('element-content', undefined, prefix)];
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(
          `<div class="${contentClasses.join(' ')}">\n${contentHtml}\n</div>`
        );
      }
    }

    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert "About the Author" to HTML
   */
  private convertAboutAuthor(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'about-author', prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('page-break', 'before', prefix));

    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Add title
    if (element.title) {
      const headingLevel = this.context.currentHeadingLevel;
      const headingTag = this.getHeadingTag(headingLevel);
      const titleClasses = [
        generateClassName('element-title', undefined, prefix),
        generateClassName('text', 'center', prefix),
      ];
      fragments.push(
        `<${headingTag} class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add content with special styling for author bio
    if (element.content && element.content.length > 0) {
      const contentClasses = [
        generateClassName('element-content', undefined, prefix),
        generateClassName('author-bio', undefined, prefix),
      ];
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(
          `<div class="${contentClasses.join(' ')}">\n${contentHtml}\n</div>`
        );
      }
    }

    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert "Also By" (list of author's other works) to HTML
   */
  private convertAlsoBy(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'also-by', prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('page-break', 'before', prefix));

    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Add title
    if (element.title) {
      const headingLevel = this.context.currentHeadingLevel;
      const headingTag = this.getHeadingTag(headingLevel);
      const titleClasses = [
        generateClassName('element-title', undefined, prefix),
        generateClassName('text', 'center', prefix),
      ];
      fragments.push(
        `<${headingTag} class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add content formatted as a list
    if (element.content && element.content.length > 0) {
      const contentClasses = [
        generateClassName('element-content', undefined, prefix),
        generateClassName('also-by-list', undefined, prefix),
        generateClassName('text', 'center', prefix),
      ];
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(
          `<div class="${contentClasses.join(' ')}">\n${contentHtml}\n</div>`
        );
      }
    }

    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert bibliography to HTML
   */
  private convertBibliography(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'bibliography', prefix));
    this.addMatterTypeClass(tagConfig, element);
    tagConfig.classes.push(generateClassName('page-break', 'before', prefix));

    tagConfig.dataAttributes = {
      'element-id': element.id,
      'element-type': element.type,
    };

    fragments.push(`<${tagConfig.tag}${generateAttributes(tagConfig)}>`);

    // Add title
    if (element.title) {
      const headingLevel = this.context.currentHeadingLevel;
      const headingTag = this.getHeadingTag(headingLevel);
      const titleClasses = [
        generateClassName('element-title', undefined, prefix),
        generateClassName('text', 'center', prefix),
      ];
      fragments.push(
        `<${headingTag} class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add content with special bibliography styling
    if (element.content && element.content.length > 0) {
      const contentClasses = [
        generateClassName('element-content', undefined, prefix),
        generateClassName('bibliography-content', undefined, prefix),
      ];
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(
          `<div class="${contentClasses.join(' ')}">\n${contentHtml}\n</div>`
        );
      }
    }

    fragments.push(`</${tagConfig.tag}>`);

    return fragments.join('\n');
  }

  /**
   * Convert a single text block to HTML
   */
  private convertTextBlock(block: TextBlock): string {
    switch (block.blockType) {
      case 'paragraph':
        return this.convertParagraph(block);

      case 'heading':
        return this.convertHeading(block);

      case 'list':
        return this.convertList(block);

      case 'preformatted':
        return this.convertPreformatted(block);

      case 'code':
        return this.convertCode(block);

      default:
        return '';
    }
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
   * Convert a list block to HTML
   * Handles ordered and unordered lists with proper nesting
   */
  private convertList(block: TextBlock): string {
    const prefix = this.options.classPrefix || 'book';
    const listType = block.listType || 'unordered';
    const indentLevel = block.indentLevel || 0;

    // Generate CSS classes for the list
    const classes = generateListClasses(listType === 'ordered', indentLevel, prefix);
    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

    // Determine the list tag
    const listTag = listType === 'ordered' ? 'ol' : 'ul';

    // Escape content and wrap in list item
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const escapedContent = escapeFn(block.content || '');
    const itemClasses = [generateClassName('list-item', undefined, prefix)];
    if (indentLevel > 0) {
      itemClasses.push(generateClassName('list-item', `level-${indentLevel}`, prefix));
    }
    const itemClassAttr = ` class="${itemClasses.join(' ')}"`;

    return `<${listTag}${classAttr}><li${itemClassAttr}>${escapedContent}</li></${listTag}>`;
  }

  /**
   * Convert a preformatted block to HTML
   * Used for verse/poetry with preserved line breaks
   */
  private convertPreformatted(block: TextBlock): string {
    const classes: string[] = [];
    const prefix = this.options.classPrefix || 'book';

    // Add base preformatted/verse class
    classes.push(generateClassName('verse', undefined, prefix));
    classes.push(generateClassName('preformatted', undefined, prefix));

    // Handle alignment
    const alignment = this.getTextAlignment(block);
    if (alignment) {
      classes.push(generateClassName('text', alignment, prefix));
    }

    // Escape content and preserve line breaks
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const content = block.content || '';
    const lines = content.split('\n');
    const escapedLines = lines.map((line) => escapeFn(line));
    const formattedContent = escapedLines.join('<br />');

    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

    return `<pre${classAttr}>${formattedContent}</pre>`;
  }

  /**
   * Convert a heading block to HTML
   * Handles subheads (h2-h6) and section headings with proper hierarchy
   */
  private convertHeading(block: TextBlock): string {
    const classes: string[] = [];
    const inlineStyles: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const escapeFn = this.options.escapeHtml || escapeHtml;

    // Get heading level from block (default to 2 for subheads in chapters)
    const level = Math.max(2, Math.min(6, block.level || 2));

    // Get heading configuration
    const headingConfig = this.getHeadingConfig(level);

    // Generate heading classes
    const headingClasses = generateHeadingClasses(level, headingConfig, prefix);
    classes.push(...headingClasses);

    // Handle text alignment
    const alignment = block.style?.alignment || headingConfig.textAlign;
    if (alignment && this.options.includeInlineStyles) {
      inlineStyles.push(`text-align: ${alignment}`);
    }

    // Handle font size
    if (headingConfig.fontSize && this.options.includeInlineStyles) {
      inlineStyles.push(`font-size: ${headingConfig.fontSize}`);
    }

    // Handle font weight
    if (headingConfig.fontWeight && this.options.includeInlineStyles) {
      inlineStyles.push(`font-weight: ${headingConfig.fontWeight}`);
    }

    // Handle margins
    if (headingConfig.marginTop && this.options.includeInlineStyles) {
      inlineStyles.push(`margin-top: ${headingConfig.marginTop}`);
    }
    if (headingConfig.marginBottom && this.options.includeInlineStyles) {
      inlineStyles.push(`margin-bottom: ${headingConfig.marginBottom}`);
    }

    // Prepare heading content
    let content = block.content || '';

    // Apply text transformations
    if (headingConfig.uppercase) {
      content = content.toUpperCase();
    }

    // Add heading numbering if enabled
    let headingNumber = '';
    if (this.options.enableHeadingNumbering && headingConfig.numbering) {
      // Update hierarchy
      updateHeadingHierarchy(this.context.headingHierarchy, level);

      // Build hierarchical number
      const numberingStyle = headingConfig.numberingStyle || 'decimal-dot';
      headingNumber = buildHierarchicalNumber(
        this.context.headingHierarchy,
        level,
        numberingStyle
      );

      if (headingNumber) {
        headingNumber = `<span class="${prefix}-heading-number">${headingNumber}</span> `;
      }
    }

    // Escape content
    const escapedContent = escapeFn(content);

    // Build attributes
    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
    const styleAttr =
      inlineStyles.length > 0 && this.options.includeInlineStyles
        ? ` style="${inlineStyles.join('; ')}"`
        : '';

    // Build ARIA attributes for accessibility
    let ariaAttr = '';
    if (this.options.includeAria) {
      ariaAttr = ` role="heading" aria-level="${level}"`;
    }

    // Update context
    this.context.currentHeadingLevel = level;

    // Headings reset the first paragraph flag
    this.context.isFirstParagraph = true;

    // Generate semantic heading tag (h2-h6)
    const tag = `h${level}`;

    return `<${tag}${classAttr}${styleAttr}${ariaAttr}>${headingNumber}${escapedContent}</${tag}>`;
  }

  /**
   * Convert a code block to HTML
   * Handles syntax highlighting metadata
   */
  private convertCode(block: TextBlock): string {
    const classes: string[] = [];
    const prefix = this.options.classPrefix || 'book';

    // Add base code class
    classes.push(generateClassName('code', undefined, prefix));

    // Add language class if specified
    if (block.language) {
      classes.push(generateClassName('code', `language-${block.language}`, prefix));
    }

    // Escape content
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const escapedContent = escapeFn(block.content || '');

    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

    return `<pre${classAttr}><code>${escapedContent}</code></pre>`;
  }

  /**
   * Get heading configuration for a specific level
   * Merges default configuration with options
   */
  private getHeadingConfig(level: number): HeadingConfig {
    const defaults: HeadingConfig = {
      numbering: this.options.enableHeadingNumbering ?? false,
      numberingStyle: 'decimal-dot',
      textAlign: 'left',
      uppercase: false,
      smallCaps: false,
      includeInOutline: true,
    };

    // Level-specific defaults
    const levelDefaults: Partial<HeadingConfig> = {};
    switch (level) {
      case 2:
        levelDefaults.fontSize = '1.5em';
        levelDefaults.fontWeight = 'bold';
        levelDefaults.marginTop = '2em';
        levelDefaults.marginBottom = '1em';
        break;
      case 3:
        levelDefaults.fontSize = '1.3em';
        levelDefaults.fontWeight = 'bold';
        levelDefaults.marginTop = '1.5em';
        levelDefaults.marginBottom = '0.75em';
        break;
      case 4:
        levelDefaults.fontSize = '1.1em';
        levelDefaults.fontWeight = 'bold';
        levelDefaults.marginTop = '1.25em';
        levelDefaults.marginBottom = '0.5em';
        break;
      case 5:
        levelDefaults.fontSize = '1em';
        levelDefaults.fontWeight = 'bold';
        levelDefaults.marginTop = '1em';
        levelDefaults.marginBottom = '0.5em';
        break;
      case 6:
        levelDefaults.fontSize = '0.9em';
        levelDefaults.fontWeight = 'bold';
        levelDefaults.marginTop = '1em';
        levelDefaults.marginBottom = '0.5em';
        break;
    }

    // Merge configurations: defaults < level defaults < options
    return {
      ...defaults,
      ...levelDefaults,
      ...this.options.headingConfig,
    };
  }

  /**
   * Convert a Quote TextFeature to HTML blockquote
   * Handles block quotes with attribution and source
   */
  private convertQuote(quote: Quote): string {
    const classes: string[] = [];
    const prefix = this.options.classPrefix || 'book';

    // Add base quote/blockquote class
    classes.push(generateClassName('quote', undefined, prefix));
    classes.push(generateClassName('blockquote', undefined, prefix));

    // Add quote type modifier
    if (quote.quoteType) {
      classes.push(generateClassName('quote', quote.quoteType, prefix));
    }

    // Escape content
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const escapedContent = escapeFn(quote.content || '');

    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

    // Build blockquote HTML
    let html = `<blockquote${classAttr}>${escapedContent}`;

    // Add attribution if present
    if (quote.attribution || quote.source) {
      const attrClasses = [generateClassName('quote-attribution', undefined, prefix)];
      const attrClassAttr = ` class="${attrClasses.join(' ')}"`;
      const attribution = quote.attribution ? escapeFn(quote.attribution) : '';
      const source = quote.source ? escapeFn(quote.source) : '';

      if (attribution && source) {
        html += `<cite${attrClassAttr}>${attribution}, <em>${source}</em></cite>`;
      } else if (attribution) {
        html += `<cite${attrClassAttr}>${attribution}</cite>`;
      } else if (source) {
        html += `<cite${attrClassAttr}><em>${source}</em></cite>`;
      }
    }

    html += '</blockquote>';
    return html;
  }

  /**
   * Convert a Verse TextFeature to HTML
   * Handles poetry with line breaks and indentation
   */
  private convertVerse(verse: Verse): string {
    const classes: string[] = [];
    const prefix = this.options.classPrefix || 'book';

    // Add base verse class
    classes.push(generateClassName('verse', undefined, prefix));
    classes.push(generateClassName('poetry', undefined, prefix));

    // Add stanza class if specified
    if (verse.stanza !== undefined) {
      classes.push(generateClassName('verse', `stanza-${verse.stanza}`, prefix));
    }

    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

    // Escape and format lines
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const lines = verse.lines.map((line, index) => {
      const escapedLine = escapeFn(line);
      const lineClasses = [generateClassName('verse-line', undefined, prefix)];

      // Add indentation class if specified
      const indentation = verse.indentation?.[index];
      if (indentation !== undefined && indentation > 0) {
        lineClasses.push(generateClassName('verse-line', `indent-${indentation}`, prefix));
      }

      const lineClassAttr = ` class="${lineClasses.join(' ')}"`;
      return `<span${lineClassAttr}>${escapedLine}</span>`;
    });

    const formattedContent = lines.join('<br />');

    return `<div${classAttr}>${formattedContent}</div>`;
  }

  /**
   * Convert a List TextFeature to HTML list
   * Handles ordered and unordered lists with recursive nesting
   */
  private convertListFeature(list: ListFeature): string {
    const prefix = this.options.classPrefix || 'book';
    const listTag = list.listType === 'ordered' ? 'ol' : 'ul';

    // Generate CSS classes for the list
    const classes = generateListClasses(list.listType === 'ordered', 0, prefix);
    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

    // Add start attribute for ordered lists with custom start number
    const startAttr = list.startNumber && list.listType === 'ordered' ? ` start="${list.startNumber}"` : '';

    // Convert list items recursively
    const items = list.items.map((item) => this.convertListItem(item, 0, prefix));

    return `<${listTag}${classAttr}${startAttr}>${items.join('')}</${listTag}>`;
  }

  /**
   * Convert a ListItem to HTML list item
   * Handles nested list items recursively
   */
  private convertListItem(item: ListItem, level: number, prefix: string): string {
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const escapedContent = escapeFn(item.content || '');

    // Generate list item classes
    const itemClasses = [generateClassName('list-item', undefined, prefix)];
    if (level > 0) {
      itemClasses.push(generateClassName('list-item', `level-${level}`, prefix));
    }
    if (item.marker) {
      itemClasses.push(generateClassName('list-item', 'custom-marker', prefix));
    }

    const itemClassAttr = ` class="${itemClasses.join(' ')}"`;

    // Build list item HTML
    let html = `<li${itemClassAttr}>${escapedContent}`;

    // Handle nested list items
    if (item.children && item.children.length > 0) {
      const nestedListClasses = generateListClasses(false, level + 1, prefix);
      const nestedListClassAttr = nestedListClasses.length > 0 ? ` class="${nestedListClasses.join(' ')}"` : '';
      const nestedItems = item.children.map((child) => this.convertListItem(child, level + 1, prefix));
      html += `<ul${nestedListClassAttr}>${nestedItems.join('')}</ul>`;
    }

    html += '</li>';
    return html;
  }

  /**
   * Convert a break to HTML
   * Handles scene breaks, page breaks, and ornamental breaks
   */
  private convertBreak(
    breakType: 'line' | 'section' | 'page' | 'scene',
    symbol?: string
  ): string {
    const classPrefix = this.options.classPrefix || 'book';

    switch (breakType) {
      case 'page':
        if (this.options.enablePageBreaks) {
          return generatePageBreak(classPrefix);
        }
        return '';

      case 'scene':
      case 'section':
        // Check if ornamental breaks are enabled in style config
        if (this.context.styleConfig?.ornamentalBreak?.enabled) {
          return generateOrnamentalBreakFromStyle(
            this.context.styleConfig,
            classPrefix
          );
        }
        // Fallback to scene break with optional symbol
        return generateSceneBreak(symbol, classPrefix);

      case 'line':
        // Line breaks are handled as <br> tags, not block breaks
        return '<br />';

      default:
        return generateSceneBreak(symbol, classPrefix);
    }
  }

  /**
   * Convert ornamental break to HTML with custom configuration
   */
  private convertOrnamentalBreak(
    style?: string,
    symbol?: string
  ): string {
    const classPrefix = this.options.classPrefix || 'book';

    // Use custom config if provided
    if (this.options.ornamentalBreakConfig) {
      return generateOrnamentalBreak(
        this.options.ornamentalBreakConfig,
        classPrefix
      );
    }

    // Use BookStyle config if available
    if (this.context.styleConfig?.ornamentalBreak?.enabled) {
      return generateOrnamentalBreakFromStyle(
        this.context.styleConfig,
        classPrefix
      );
    }

    // Fallback to default ornamental break
    const config: OrnamentalBreakConfig = {
      style: (style as OrnamentalBreakStyle) || 'symbol',
      symbol: symbol || '❦',
      textAlign: 'center',
      marginTop: '2em',
      marginBottom: '2em',
    };

    return generateOrnamentalBreak(config, classPrefix);
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
<<<<<<< HEAD
 * Generate classes for blockquote
 *
 * @param quoteType Type of quote (block, inline, epigraph)
 * @param prefix Class prefix
 * @returns Array of CSS class names
 */
export function generateBlockquoteClasses(
  quoteType?: 'block' | 'inline' | 'epigraph',
  prefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix });
  builder.add(CssClassNames.ELEMENT.BLOCKQUOTE);
  builder.add(CssClassNames.ELEMENT.QUOTE);

  if (quoteType) {
    builder.modifier('quote', quoteType);
=======
 * Generate classes for heading elements
 *
 * @param level Heading level (1-6, where 2-6 are subheads within chapters)
 * @param config Heading configuration
 * @param prefix Class prefix
 * @returns Array of CSS class names
 */
export function generateHeadingClasses(
  level: number,
  config?: HeadingConfig,
  prefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix });

  // Base heading class
  builder.add(CssClassNames.ELEMENT.HEADING);

  // Add subhead or section heading class based on level
  if (level >= 2) {
    builder.add(CssClassNames.ELEMENT.SUBHEAD);
  } else {
    builder.add(CssClassNames.ELEMENT.SECTION_HEADING);
  }

  // Add level-specific class (h2, h3, etc.)
  builder.modifier('heading', `level-${level}`);

  // Add numbering state
  if (config?.numbering) {
    builder.add(CssClassNames.STATE.NUMBERED);
    if (config.numberingStyle && config.numberingStyle !== 'none') {
      builder.modifier('heading', `numbering-${config.numberingStyle}`);
    }
  } else {
    builder.add(CssClassNames.STATE.UNNUMBERED);
  }

  // Add alignment
  if (config?.textAlign) {
    builder.align(config.textAlign);
  }

  // Add typography modifiers
  if (config?.uppercase) {
    builder.add(CssClassNames.TYPOGRAPHY.UPPERCASE);
  }

  if (config?.smallCaps) {
    builder.add(CssClassNames.TYPOGRAPHY.SMALL_CAPS);
>>>>>>> agent/implement-subheads-and-section-headings
  }

  return builder.build();
}

/**
<<<<<<< HEAD
 * Generate classes for verse/poetry
 *
 * @param stanza Optional stanza number
 * @param prefix Class prefix
 * @returns Array of CSS class names
 */
export function generateVerseClasses(
  stanza?: number,
  prefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix });
  builder.add(CssClassNames.ELEMENT.VERSE);
  builder.add(CssClassNames.ELEMENT.POETRY);

  if (stanza !== undefined) {
    builder.modifier('verse', `stanza-${stanza}`);
  }

  return builder.build();
}

/**
 * Generate classes for verse line
 *
 * @param indentation Optional indentation level
 * @param prefix Class prefix
 * @returns Array of CSS class names
 */
export function generateVerseLineClasses(
  indentation?: number,
  prefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix });
  builder.add(CssClassNames.ELEMENT.VERSE_LINE);

  if (indentation !== undefined && indentation > 0) {
    builder.modifier('verse-line', `indent-${indentation}`);
  }

  return builder.build();
=======
 * Format heading number based on numbering style
 *
 * @param number The heading number
 * @param style Numbering style
 * @returns Formatted heading number
 */
export function formatHeadingNumber(
  number: number,
  style: HeadingNumberingStyle = 'decimal'
): string {
  switch (style) {
    case 'decimal':
      return `${number}`;

    case 'decimal-dot':
      return `${number}.`;

    case 'roman-upper': {
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
                            'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
      return number <= 20 ? romanNumerals[number - 1] : `${number}`;
    }

    case 'roman-lower': {
      const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
                            'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'];
      return number <= 20 ? romanNumerals[number - 1] : `${number}`;
    }

    case 'alpha-upper': {
      return number <= 26 ? String.fromCharCode(64 + number) : `${number}`;
    }

    case 'alpha-lower': {
      return number <= 26 ? String.fromCharCode(96 + number) : `${number}`;
    }

    case 'none':
      return '';

    default:
      return `${number}`;
  }
}

/**
 * Build hierarchical heading number (e.g., "1.2.3")
 *
 * @param hierarchy Heading hierarchy context
 * @param level Current heading level
 * @param style Numbering style
 * @returns Formatted hierarchical number
 */
export function buildHierarchicalNumber(
  hierarchy: HeadingHierarchyContext,
  level: number,
  style: HeadingNumberingStyle = 'decimal-dot'
): string {
  const numbers: string[] = [];

  // Build number path from level 2 to current level
  for (let i = 2; i <= level; i++) {
    const count = hierarchy.counters.get(i) || 0;
    if (count > 0) {
      numbers.push(formatHeadingNumber(count, 'decimal'));
    }
  }

  // Join with dots and add final dot if needed
  const joined = numbers.join('.');
  return style === 'decimal-dot' ? `${joined}.` : joined;
}

/**
 * Update heading hierarchy when encountering a heading
 *
 * @param hierarchy Heading hierarchy context
 * @param level Heading level
 */
export function updateHeadingHierarchy(
  hierarchy: HeadingHierarchyContext,
  level: number
): void {
  // Increment counter for this level
  const currentCount = hierarchy.counters.get(level) || 0;
  hierarchy.counters.set(level, currentCount + 1);

  // Reset counters for deeper levels
  for (let i = level + 1; i <= 6; i++) {
    hierarchy.counters.set(i, 0);
  }

  // Update parent level
  hierarchy.parentLevel = level;
>>>>>>> agent/implement-subheads-and-section-headings
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
    'title-page': 'doc-cover',
    copyright: 'doc-credit',
    dedication: 'doc-dedication',
    epigraph: 'doc-epigraph',
    foreword: 'doc-foreword',
    preface: 'doc-preface',
    introduction: 'doc-introduction',
    prologue: 'doc-prologue',
    epilogue: 'doc-epilogue',
    afterword: 'doc-afterword',
    acknowledgments: 'doc-acknowledgments',
    'about-author': 'doc-credit',
    'also-by': 'doc-credit',
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

// ============================================================================
// Break Generation Functions
// ============================================================================

/**
 * Generate HTML for a scene break
 * Creates an <hr> element with custom classes for scene breaks
 */
export function generateSceneBreak(
  symbol?: string,
  classPrefix: string = 'book'
): string {
  const classes = [
    generateClassName('scene-break', undefined, classPrefix),
  ];

  if (symbol && symbol.trim()) {
    // Scene break with symbol (ornamental style)
    classes.push(generateClassName('scene-break', 'ornamental', classPrefix));
    return `<div class="${classes.join(' ')}">${escapeHtml(symbol)}</div>`;
  } else {
    // Simple scene break (horizontal rule)
    return `<hr class="${classes.join(' ')}" />`;
  }
}

/**
 * Generate HTML for a page break hint
 * Creates a <div> element with page-break class for print CSS
 */
export function generatePageBreak(
  classPrefix: string = 'book'
): string {
  const classes = [
    generateClassName('page-break', undefined, classPrefix),
  ];

  return `<div class="${classes.join(' ')}"></div>`;
}

/**
 * Generate HTML for an ornamental break
 * Creates a decorative break with configurable symbol, image, or custom content
 */
export function generateOrnamentalBreak(
  config: OrnamentalBreakConfig,
  classPrefix: string = 'book'
): string {
  const classes = [
    generateClassName('ornamental-break', undefined, classPrefix),
    generateClassName('ornamental-break', config.style, classPrefix),
  ];

  const inlineStyles: string[] = [];

  // Apply styling from config
  if (config.fontSize) {
    inlineStyles.push(`font-size: ${config.fontSize}`);
  }
  if (config.textAlign) {
    inlineStyles.push(`text-align: ${config.textAlign}`);
  }
  if (config.marginTop) {
    inlineStyles.push(`margin-top: ${config.marginTop}`);
  }
  if (config.marginBottom) {
    inlineStyles.push(`margin-bottom: ${config.marginBottom}`);
  }

  const styleAttr = inlineStyles.length > 0
    ? ` style="${inlineStyles.join('; ')}"`
    : '';

  const classAttr = `class="${classes.join(' ')}"`;

  // Generate content based on style type
  let content = '';
  switch (config.style) {
    case 'asterisk':
      content = escapeHtml(config.symbol || '* * *');
      break;

    case 'symbol':
      content = escapeHtml(config.symbol || '❦');
      break;

    case 'image':
      if (config.imageUrl) {
        const alt = config.imageAlt ? escapeHtml(config.imageAlt) : 'Ornamental break';
        // Don't escape URL - it's safe in attributes and escaping breaks URLs
        const url = config.imageUrl.replace(/"/g, '&quot;');
        content = `<img src="${url}" alt="${alt}" />`;
      } else {
        content = escapeHtml(config.symbol || '❦');
      }
      break;

    case 'custom':
      content = escapeHtml(config.symbol || '');
      break;

    default:
      content = escapeHtml(config.symbol || '❦');
  }

  return `<div ${classAttr}${styleAttr}>${content}</div>`;
}

/**
 * Generate ornamental break from BookStyle configuration
 * Uses the ornamental break settings from BookStyle
 */
export function generateOrnamentalBreakFromStyle(
  bookStyle: BookStyle | null,
  classPrefix: string = 'book'
): string {
  if (!bookStyle?.ornamentalBreak?.enabled) {
    // Fallback to simple scene break if ornamental breaks are disabled
    return generateSceneBreak('* * *', classPrefix);
  }

  const obConfig = bookStyle.ornamentalBreak;

  const config: OrnamentalBreakConfig = {
    style: 'symbol',
    symbol: obConfig.symbol || '❦',
    fontSize: obConfig.fontSize,
    textAlign: obConfig.textAlign,
    marginTop: obConfig.marginTop,
    marginBottom: obConfig.marginBottom,
  };

  return generateOrnamentalBreak(config, classPrefix);
}

/**
 * Generate CSS for break elements
 * Returns CSS rules for scene breaks, page breaks, and ornamental breaks
 */
export function generateBreakStyles(classPrefix: string = 'book'): string {
  return `
/* Scene Breaks */
.${classPrefix}-scene-break {
  border: none;
  border-top: 1px solid #ccc;
  margin: 2em 0;
  text-align: center;
  position: relative;
}

.${classPrefix}-scene-break-ornamental {
  border: none;
  padding: 1em 0;
  text-align: center;
  font-size: 1.5em;
}

/* Page Breaks */
.${classPrefix}-page-break {
  page-break-before: always;
  break-before: page;
  height: 0;
  margin: 0;
  padding: 0;
  visibility: hidden;
}

@media screen {
  .${classPrefix}-page-break {
    display: none;
  }
}

/* Ornamental Breaks */
.${classPrefix}-ornamental-break {
  text-align: center;
  margin: 2em 0;
  font-size: 1.5em;
  line-height: 1;
}

.${classPrefix}-ornamental-break-asterisk {
  letter-spacing: 0.5em;
  font-weight: normal;
}

.${classPrefix}-ornamental-break-symbol {
  font-size: 2em;
}

.${classPrefix}-ornamental-break-image img {
  max-width: 100px;
  height: auto;
  display: inline-block;
}

.${classPrefix}-ornamental-break-custom {
  /* Custom styling can be applied inline */
}

/* Print-specific break handling */
@media print {
  .${classPrefix}-scene-break {
    margin: 1.5em 0;
  }

  .${classPrefix}-ornamental-break {
    margin: 1.5em 0;
  }

  .${classPrefix}-page-break {
    display: block;
    visibility: visible;
  }
}
`.trim();
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

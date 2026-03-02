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
import { Break, TextFeature, Quote, Verse, List as ListFeature, ListItem, Image, Figure, ImageAlignment, ImageSizing, Note } from '../../types/textFeature';
import {
  TextSegment,
  InlineText,
  InlineStyle,
  LinkReference,
  FootnoteReference
} from '../../types/inlineText';

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
 * Footnote numbering scheme
 */
export type FootnoteNumberingScheme =
  | 'numeric'        // 1, 2, 3, ...
  | 'symbolic'       // *, †, ‡, §, ¶, ...
  | 'per-chapter'    // Reset numbering per chapter
  | 'continuous';    // Continuous numbering throughout book

/**
 * Footnote placement
 */
export type FootnotePlacement = 'chapter-end' | 'book-end';

/**
 * Footnote configuration
 */
export interface FootnoteConfig {
  /** Whether to render footnotes */
  enabled?: boolean;
  /** Numbering scheme */
  numberingScheme?: FootnoteNumberingScheme;
  /** Where to place footnotes */
  placement?: FootnotePlacement;
  /** Section title for footnotes */
  sectionTitle?: string;
  /** Whether to include backlinks from footnotes to references */
  includeBacklinks?: boolean;
  /** Symbolic characters to use for symbolic numbering */
  symbols?: string[];
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
    FOOTNOTES_SECTION: 'footnotes-section',
    ENDNOTES_SECTION: 'endnotes-section',
    FOOTNOTE: 'footnote',
    ENDNOTE: 'endnote',
    FOOTNOTE_MARKER: 'footnote-marker',
    FOOTNOTE_CONTENT: 'footnote-content',
    FOOTNOTE_BACKLINK: 'footnote-backlink',
    TOC_ENTRY: 'toc-entry',
    TOC_PART: 'toc-part',
    TOC_CHAPTER: 'toc-chapter',
    TOC_SECTION: 'toc-section',
    TOC_LINK: 'toc-link',
    TOC_TITLE: 'toc-title',
    TOC_PAGE_NUMBER: 'toc-page-number',
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
    STRIKETHROUGH: 'strikethrough',
    SUPERSCRIPT: 'superscript',
    SUBSCRIPT: 'subscript',
    UPPERCASE: 'uppercase',
    LOWERCASE: 'lowercase',
    CAPITALIZE: 'capitalize',
    LINK: 'link',
    FOOTNOTE_REF: 'footnote-ref',
    STYLED_TEXT: 'styled-text',
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
  /** TOC depth: 'parts' (parts only), 'chapters' (parts + chapters), 'subheads' (parts + chapters + headings) */
  tocDepth?: 'parts' | 'chapters' | 'subheads';
  /** Include page numbers in TOC (placeholders for print) */
  tocIncludePageNumbers?: boolean;
  /** TOC variant: 'front-matter' (full TOC in front matter) or 'navigation' (compact nav TOC) */
  tocVariant?: 'front-matter' | 'navigation';
  /** Maximum heading level to include in TOC (1-6) when tocDepth is 'subheads' */
  tocMaxHeadingLevel?: number;
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
  /** Footnote configuration */
  footnoteConfig?: FootnoteConfig;
  /** Endnote configuration */
  endnoteConfig?: FootnoteConfig;
  /** Generate full HTML document with DOCTYPE, html, head, and body tags (default: false) */
  generateFullDocument?: boolean;
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
 * Stored note information for rendering
 */
export interface StoredNote {
  /** The note content */
  note: Note;
  /** Assigned number */
  number: number;
  /** Assigned symbol (if using symbolic numbering) */
  symbol?: string;
  /** Chapter index where this note was referenced */
  chapterIndex?: number;
}

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
  /** Footnote reference counter for auto-numbering */
  footnoteCounter?: number;
  /** Map of footnote reference IDs to numbers */
  footnoteNumbers?: Map<string, number>;
  /** Collection of footnotes for current chapter */
  chapterFootnotes?: Map<string, StoredNote>;
  /** Collection of all endnotes for the book */
  bookEndnotes?: Map<string, StoredNote>;
  /** Per-chapter footnote counter (resets each chapter) */
  chapterFootnoteCounter?: number;
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
      tocDepth: 'chapters',
      tocIncludePageNumbers: false,
      tocVariant: 'front-matter',
      tocMaxHeadingLevel: 3,
      htmlVersion: 'html5',
      includeChapterNumbers: true,
      footnoteConfig: {
        enabled: true,
        numberingScheme: 'numeric',
        placement: 'chapter-end',
        sectionTitle: 'Notes',
        includeBacklinks: true,
        symbols: ['*', '†', '‡', '§', '¶', '‖', '#'],
      },
      endnoteConfig: {
        enabled: true,
        numberingScheme: 'continuous',
        placement: 'book-end',
        sectionTitle: 'Endnotes',
        includeBacklinks: true,
        symbols: ['*', '†', '‡', '§', '¶', '‖', '#'],
      },
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
      footnoteCounter: 0,
      footnoteNumbers: new Map(),
      chapterFootnotes: new Map(),
      bookEndnotes: new Map(),
      chapterFootnoteCounter: 0,
    };
  }

  /**
   * Convert book to HTML
   * Main entry point for conversion
   */
  public convert(): string {
    const fragments: string[] = [];

    // Generate cover page (if cover image exists)
    const coverPageHtml = this.generateCoverPage();
    if (coverPageHtml) {
      fragments.push(coverPageHtml);
    }

    // Convert front matter
    const frontMatterHtml = this.convertFrontMatter();
    if (frontMatterHtml) {
      fragments.push(frontMatterHtml);
    }

    // Generate and insert table of contents
    if (this.options.includeToc) {
      const tocHtml = generateTocHtml(this.book, this.options);
      if (tocHtml) {
        // Insert TOC based on variant
        if (this.options.tocVariant === 'navigation') {
          // Navigation TOC goes at the beginning
          fragments.unshift(tocHtml);
        } else {
          // Front-matter TOC goes after front matter, before chapters
          fragments.push(tocHtml);
        }
      }
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

    // Add endnotes section if enabled and endnotes exist
    const endnotesHtml = this.renderEndnotesSection();
    if (endnotesHtml) {
      fragments.push(endnotesHtml);
    }

    // Wrap in main container if semantic tags are enabled
    let bodyContent: string;
    if (this.options.useSemanticTags) {
      const prefix = this.options.classPrefix || 'book';
      const bookClasses = [generateClassName('container', undefined, prefix)];
      const roleAttr = this.options.includeAria ? ' role="main"' : '';
      bodyContent = `<main class="${bookClasses.join(' ')}"${roleAttr}>\n${fragments.join('\n\n')}\n</main>`;
    } else {
      bodyContent = fragments.join('\n\n');
    }

    // Wrap in full HTML document if requested
    if (this.options.generateFullDocument) {
      const htmlLang = this.book.metadata?.language || 'en';
      return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
${this.generateHtmlHead()}
</head>
<body>
${bodyContent}
</body>
</html>`;
    }

    return bodyContent;
  }

  /**
   * Generate HTML head section with metadata
   */
  private generateHtmlHead(): string {
    const fragments: string[] = [];
    const escape = this.options.escapeHtml || escapeHtml;

    // Charset
    fragments.push('  <meta charset="UTF-8">');

    // Title
    if (this.book.title) {
      const fullTitle = this.book.subtitle
        ? `${escape(this.book.title)}: ${escape(this.book.subtitle)}`
        : escape(this.book.title);
      fragments.push(`  <title>${fullTitle}</title>`);
    }

    // Viewport meta tag for responsive design
    fragments.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');

    // Authors
    if (this.book.authors && this.book.authors.length > 0) {
      const authorNames = this.book.authors
        .map(author => escape(author.name))
        .join(', ');
      fragments.push(`  <meta name="author" content="${authorNames}">`);
    }

    // Description
    if (this.book.metadata?.description) {
      fragments.push(`  <meta name="description" content="${escape(this.book.metadata.description)}">`);
    }

    // ISBN
    if (this.book.metadata?.isbn) {
      fragments.push(`  <meta name="isbn" content="${escape(this.book.metadata.isbn)}">`);
    }

    // ISBN-13
    if (this.book.metadata?.isbn13) {
      fragments.push(`  <meta name="isbn-13" content="${escape(this.book.metadata.isbn13)}">`);
    }

    // Language
    if (this.book.metadata?.language) {
      fragments.push(`  <meta name="language" content="${escape(this.book.metadata.language)}">`);
    }

    // Publisher
    if (this.book.metadata?.publisher) {
      fragments.push(`  <meta name="publisher" content="${escape(this.book.metadata.publisher)}">`);
    }

    // Publication date
    if (this.book.metadata?.publicationDate) {
      const dateStr = this.book.metadata.publicationDate instanceof Date
        ? this.book.metadata.publicationDate.toISOString().split('T')[0]
        : String(this.book.metadata.publicationDate);
      fragments.push(`  <meta name="publication-date" content="${escape(dateStr)}">`);
    }

    // Keywords
    if (this.book.metadata?.keywords && this.book.metadata.keywords.length > 0) {
      const keywords = this.book.metadata.keywords.map(k => escape(k)).join(', ');
      fragments.push(`  <meta name="keywords" content="${keywords}">`);
    }

    // Genre
    if (this.book.metadata?.genre && this.book.metadata.genre.length > 0) {
      const genres = this.book.metadata.genre.map(g => escape(g)).join(', ');
      fragments.push(`  <meta name="genre" content="${genres}">`);
    }

    // Custom metadata from options
    if (this.options.metadata) {
      for (const [key, value] of Object.entries(this.options.metadata)) {
        fragments.push(`  <meta name="${escape(key)}" content="${escape(value)}">`);
      }
    }

    return fragments.join('\n');
  }

  /**
   * Generate cover page HTML
   * Returns HTML for the cover page if coverImage exists, or title page if coverImage is missing
   */
  private generateCoverPage(): string {
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags !== false;
    const includeAria = this.options.includeAria !== false;

    // If no cover image, check if we should show title page as fallback
    if (!this.book.coverImage) {
      // Only show title fallback if book has a title
      if (!this.book.title) {
        return '';
      }

      // Generate title-only cover page
      const sectionTag = useSemanticTags ? 'section' : 'div';
      const sectionClasses = [
        generateClassName('cover-page', undefined, prefix),
        generateClassName('cover-page', 'title-only', prefix),
      ];
      const roleAttr = includeAria ? ' role="banner"' : '';
      const ariaLabel = includeAria
        ? ` aria-label="Book cover: ${escapeHtml(this.book.title)}"`
        : '';

      const titleHtml = `<h1 class="${generateClassName('cover-title', undefined, prefix)}">${escapeHtml(this.book.title)}</h1>`;
      const subtitleHtml = this.book.subtitle
        ? `\n    <p class="${generateClassName('cover-subtitle', undefined, prefix)}">${escapeHtml(this.book.subtitle)}</p>`
        : '';
      const authorsHtml =
        this.book.authors && this.book.authors.length > 0
          ? `\n    <p class="${generateClassName('cover-authors', undefined, prefix)}">${this.book.authors
              .map((author) => escapeHtml(author.name))
              .join(', ')}</p>`
          : '';

      return `<${sectionTag} class="${sectionClasses.join(' ')}"${roleAttr}${ariaLabel}>
  <div class="${generateClassName('cover-content', undefined, prefix)}">
    ${titleHtml}${subtitleHtml}${authorsHtml}
  </div>
</${sectionTag}>`;
    }

    // Generate cover page with image
    const sectionTag = useSemanticTags ? 'section' : 'div';
    const sectionClasses = [generateClassName('cover-page', undefined, prefix)];
    const roleAttr = includeAria ? ' role="banner"' : '';
    const ariaLabel = includeAria
      ? ` aria-label="Book cover: ${escapeHtml(this.book.title)}"`
      : '';

    const imgClasses = [generateClassName('cover-image', undefined, prefix)];
    const imgAlt = `Cover of ${escapeHtml(this.book.title)}`;
    const imgAriaAttr = includeAria ? ` aria-label="${imgAlt}"` : '';

    return `<${sectionTag} class="${sectionClasses.join(' ')}"${roleAttr}${ariaLabel}>
  <img src="${escapeHtml(this.book.coverImage)}" alt="${imgAlt}" class="${imgClasses.join(' ')}"${imgAriaAttr} />
</${sectionTag}>`;
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
    const chapterFragments: string[] = [];

    this.book.chapters.forEach((chapter, index) => {
      this.updateContext({ currentChapter: chapter, chapterIndex: index });

      // Add page break before chapter (except for the first chapter)
      if (index > 0 && this.options.enablePageBreaks) {
        const classPrefix = this.options.classPrefix || 'book';
        chapterFragments.push(generatePageBreak(classPrefix));
      }

      // Add the chapter content
      chapterFragments.push(this.convertSingleChapter(chapter, index));
    });

    return chapterFragments.join('\n\n');
  }

  /**
   * Convert a single chapter to HTML
   */
  private convertSingleChapter(chapter: Chapter, index: number): string {
    const fragments: string[] = [];
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const includeAria = this.options.includeAria ?? true;
    const includeChapterNumbers = this.options.includeChapterNumbers ?? true;

    // Reset chapter footnotes at the start of each chapter
    if (this.options.footnoteConfig?.numberingScheme === 'per-chapter') {
      this.context.chapterFootnoteCounter = 0;
    }
    this.context.chapterFootnotes = new Map();

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

    // Add footnotes section if enabled and footnotes exist
    const footnotesHtml = this.renderFootnotesSection();
    if (footnotesHtml) {
      fragments.push(footnotesHtml);
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
   * Get the conventional sort order for back matter elements
   * Lower numbers appear first
   */
  private getBackMatterSortOrder(elementType: ElementType): number {
    const order: Record<string, number> = {
      'epilogue': 1,
      'afterword': 2,
      'acknowledgments': 3,
      'appendix': 4,
      'glossary': 5,
      'about-author': 6,
      'also-by': 7,
      'bibliography': 8,
      'index': 9,
    };
    return order[elementType] ?? 99; // Other types go last
  }

  /**
   * Convert back matter to HTML
   * Ensures proper ordering: epilogue, afterword, acknowledgments, appendices,
   * glossary, about author, also by, bibliography, index
   */
  private convertBackMatter(): string {
    if (!this.book.backMatter || this.book.backMatter.length === 0) {
      return '';
    }

    this.resetContextForSection('back-matter');

    // Sort back matter elements in conventional order
    const sortedBackMatter = [...this.book.backMatter].sort((a, b) => {
      // Use explicit order if specified
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // Otherwise use conventional ordering
      return this.getBackMatterSortOrder(a.type) - this.getBackMatterSortOrder(b.type);
    });

    const elementsHtml = sortedBackMatter
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
      case 'prologue':
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
      case 'appendix':
        return this.convertAppendix(element);
      case 'glossary':
        return this.convertGlossary(element);
      case 'index':
        return this.convertIndex(element);
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
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
    const escapeFn = this.options.escapeHtml || escapeHtml;

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

    // Render book title with semantic HTML
    if (this.book.title) {
      const titleClasses = [
        generateClassName('title-page-title', undefined, prefix),
      ];
      fragments.push(
        `<h1 class="${titleClasses.join(' ')}">${escapeFn(this.book.title)}</h1>`
      );
    }

    // Render subtitle if present
    if (this.book.subtitle) {
      const subtitleClasses = [
        generateClassName('title-page-subtitle', undefined, prefix),
      ];
      fragments.push(
        `<h2 class="${subtitleClasses.join(' ')}">${escapeFn(this.book.subtitle)}</h2>`
      );
    }

    // Render authors
    if (this.book.authors && this.book.authors.length > 0) {
      const authorsClasses = [
        generateClassName('title-page-authors', undefined, prefix),
      ];
      fragments.push(`<div class="${authorsClasses.join(' ')}">`);

      for (const author of this.book.authors) {
        const authorClasses = [
          generateClassName('title-page-author', undefined, prefix),
        ];
        const authorRole = author.role && author.role !== 'author'
          ? ` (${escapeFn(author.role)})`
          : '';
        fragments.push(
          `<p class="${authorClasses.join(' ')}">${escapeFn(author.name)}${authorRole}</p>`
        );
      }

      fragments.push('</div>');
    }

    // Render publisher if present
    if (this.book.metadata?.publisher) {
      const publisherClasses = [
        generateClassName('title-page-publisher', undefined, prefix),
      ];
      fragments.push(
        `<div class="${publisherClasses.join(' ')}">${escapeFn(this.book.metadata.publisher)}</div>`
      );
    }

    // Render any additional content blocks if provided in the element
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

    // Add custom content blocks if provided
    if (element.content && element.content.length > 0) {
      const contentHtml = element.content
        .map((block) => this.convertTextBlock(block))
        .filter((html) => html.length > 0)
        .join('\n');

      if (contentHtml) {
        fragments.push(contentHtml);
      }
    }

    // Build copyright information from book metadata
    const copyrightInfo: string[] = [];
    const metadata = this.book.metadata;

    // Copyright notice
    if (this.book.title) {
      const year = metadata.publicationDate
        ? new Date(metadata.publicationDate).getFullYear()
        : new Date().getFullYear();

      const authorNames = this.book.authors
        .filter(author => author.role === 'author' || !author.role)
        .map(author => author.name)
        .join(', ');

      if (authorNames) {
        copyrightInfo.push(
          `<p class="${generateClassName('copyright-notice', undefined, prefix)}">` +
          `Copyright © ${year} by ${escapeHtml(authorNames)}` +
          `</p>`
        );
      }
    }

    // Rights statement
    if (metadata.rights) {
      copyrightInfo.push(
        `<p class="${generateClassName('copyright-rights', undefined, prefix)}">` +
        escapeHtml(metadata.rights) +
        `</p>`
      );
    } else {
      copyrightInfo.push(
        `<p class="${generateClassName('copyright-rights', undefined, prefix)}">` +
        `All rights reserved.` +
        `</p>`
      );
    }

    // ISBN information
    if (metadata.isbn13 || metadata.isbn) {
      const isbnClasses = generateClassName('copyright-isbn', undefined, prefix);
      if (metadata.isbn13) {
        copyrightInfo.push(
          `<p class="${isbnClasses}">ISBN-13: ${escapeHtml(metadata.isbn13)}</p>`
        );
      }
      if (metadata.isbn && metadata.isbn !== metadata.isbn13) {
        copyrightInfo.push(
          `<p class="${isbnClasses}">ISBN-10: ${escapeHtml(metadata.isbn)}</p>`
        );
      }
    }

    // Publisher information
    if (metadata.publisher) {
      copyrightInfo.push(
        `<p class="${generateClassName('copyright-publisher', undefined, prefix)}">` +
        `Published by ${escapeHtml(metadata.publisher)}` +
        `</p>`
      );
    }

    // Publication date
    if (metadata.publicationDate) {
      const date = new Date(metadata.publicationDate);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      copyrightInfo.push(
        `<p class="${generateClassName('copyright-date', undefined, prefix)}">` +
        escapeHtml(formattedDate) +
        `</p>`
      );
    }

    // Edition information (if available)
    if (metadata.edition) {
      copyrightInfo.push(
        `<p class="${generateClassName('copyright-edition', undefined, prefix)}">` +
        escapeHtml(metadata.edition) +
        `</p>`
      );
    }

    // Add copyright information to fragments
    if (copyrightInfo.length > 0) {
      const copyrightBlock = `<div class="${generateClassName('copyright-info', undefined, prefix)}">` +
        copyrightInfo.join('\n') +
        `</div>`;
      fragments.push(copyrightBlock);
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
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
   * Convert an appendix element to HTML
   */
  private convertAppendix(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'appendix', prefix));
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add content
    if (element.content && element.content.length > 0) {
      const contentClasses = [
        generateClassName('element-content', undefined, prefix),
        generateClassName('appendix-content', undefined, prefix),
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
   * Convert a glossary element to HTML
   */
  private convertGlossary(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'glossary', prefix));
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add content with special glossary styling
    if (element.content && element.content.length > 0) {
      const contentClasses = [
        generateClassName('element-content', undefined, prefix),
        generateClassName('glossary-content', undefined, prefix),
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
   * Convert an index element to HTML
   */
  private convertIndex(element: Element): string {
    const fragments: string[] = [];
    const prefix = this.options.classPrefix || 'book';
    const useSemanticTags = this.options.useSemanticTags ?? true;
    const tagConfig = selectElementTag(element.type, useSemanticTags);

    tagConfig.classes.push(generateClassName('element', 'index', prefix));
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
      const elementId = `element-${element.id}`;
      fragments.push(
        `<${headingTag} id="${elementId}" class="${titleClasses.join(' ')}">${escapeHtml(element.title)}</${headingTag}>`
      );
    }

    // Add content with special index styling
    if (element.content && element.content.length > 0) {
      const contentClasses = [
        generateClassName('element-content', undefined, prefix),
        generateClassName('index-content', undefined, prefix),
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
    const fragments: string[] = [];

    // Process text features first (images, figures, breaks, etc.)
    if (block.features && block.features.length > 0) {
      for (const feature of block.features) {
        const featureHtml = this.convertTextFeature(feature);
        if (featureHtml) {
          fragments.push(featureHtml);
        }
      }
    }

    // Process the main block content based on block type
    let blockHtml = '';
    switch (block.blockType) {
      case 'paragraph':
        blockHtml = this.convertParagraph(block);
        break;

      case 'heading':
        blockHtml = this.convertHeading(block);
        break;

      case 'list':
        blockHtml = this.convertList(block);
        break;

      case 'preformatted':
        blockHtml = this.convertPreformatted(block);
        break;

      case 'code':
        blockHtml = this.convertCode(block);
        break;

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

    // Convert content with inline formatting
    const processedContent = isEmpty ? '&nbsp;' : this.convertTextContent(block);

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

    return `<p${classAttr}${styleAttr}>${processedContent}</p>`;
  }

  /**
   * Convert text content with inline formatting
   * Processes richText if available, otherwise falls back to plain content
   */
  private convertTextContent(block: TextBlock): string {
    // If richText is available, process inline formatting
    if (block.richText && block.richText.segments.length > 0) {
      return this.convertRichText(block.richText.segments);
    }

    // Otherwise, escape and return plain content
    const escapeFn = this.options.escapeHtml || escapeHtml;
    return escapeFn(block.content || '');
  }

  /**
   * Convert rich text segments to HTML with inline formatting
   */
  private convertRichText(segments: TextSegment[]): string {
    return segments.map((segment) => this.convertTextSegment(segment)).join('');
  }

  /**
   * Convert a single text segment to HTML
   */
  private convertTextSegment(segment: TextSegment): string {
    // Handle different segment types
    if ('type' in segment) {
      if (segment.type === 'link') {
        return this.convertLinkSegment(segment as LinkReference);
      } else if (segment.type === 'footnote') {
        return this.convertFootnoteSegment(segment as FootnoteReference);
      }
      // Image references would be handled here if needed
      return '';
    }

    // Handle inline text with formatting
    const inlineText = segment as InlineText;
    return this.convertInlineText(inlineText);
  }

  /**
   * Convert inline text with formatting styles
   * Handles nested formatting like bold, italic, underline, etc.
   */
  private convertInlineText(inlineText: InlineText): string {
    const escapeFn = this.options.escapeHtml || escapeHtml;
    let content = escapeFn(inlineText.text);

    if (!inlineText.style) {
      return content;
    }

    const style = inlineText.style;
    const prefix = this.options.classPrefix || 'book';

    // Apply formatting in order (innermost to outermost)
    // Superscript and subscript are mutually exclusive
    if (style.superscript) {
      const classes = generateClassName('superscript', undefined, prefix);
      content = `<sup class="${classes}">${content}</sup>`;
    } else if (style.subscript) {
      const classes = generateClassName('subscript', undefined, prefix);
      content = `<sub class="${classes}">${content}</sub>`;
    }

    // Strikethrough
    if (style.strikethrough) {
      const classes = generateClassName('strikethrough', undefined, prefix);
      content = `<s class="${classes}">${content}</s>`;
    }

    // Underline
    if (style.underline) {
      const classes = generateClassName('underline', undefined, prefix);
      content = `<u class="${classes}">${content}</u>`;
    }

    // Italic
    if (style.italic) {
      const classes = generateClassName('italic', undefined, prefix);
      content = `<em class="${classes}">${content}</em>`;
    }

    // Bold
    if (style.bold) {
      const classes = generateClassName('bold', undefined, prefix);
      content = `<strong class="${classes}">${content}</strong>`;
    }

    // Handle additional styles (color, highlight, fontSize, fontFamily)
    if (style.color || style.highlight || style.fontSize || style.fontFamily) {
      const spanClasses: string[] = [generateClassName('styled-text', undefined, prefix)];
      const inlineStyles: string[] = [];

      if (style.color) {
        inlineStyles.push(`color: ${style.color}`);
      }
      if (style.highlight) {
        inlineStyles.push(`background-color: ${style.highlight}`);
      }
      if (style.fontSize) {
        inlineStyles.push(`font-size: ${style.fontSize}px`);
      }
      if (style.fontFamily) {
        inlineStyles.push(`font-family: ${style.fontFamily}`);
      }

      const classAttr = ` class="${spanClasses.join(' ')}"`;
      const styleAttr = inlineStyles.length > 0 && this.options.includeInlineStyles
        ? ` style="${inlineStyles.join('; ')}"`
        : '';

      content = `<span${classAttr}${styleAttr}>${content}</span>`;
    }

    return content;
  }

  /**
   * Convert link segment to HTML anchor tag
   */
  private convertLinkSegment(link: LinkReference): string {
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const prefix = this.options.classPrefix || 'book';

    // Process link text with potential inline formatting
    let linkText: string;
    if (link.style) {
      linkText = this.convertInlineText({ text: link.text, style: link.style });
    } else {
      linkText = escapeFn(link.text);
    }

    // Build link attributes
    const classes = [generateClassName('link', undefined, prefix)];
    const attributes: string[] = [`href="${escapeFn(link.url)}"`];

    if (link.title) {
      attributes.push(`title="${escapeFn(link.title)}"`);
    }

    if (link.target) {
      attributes.push(`target="${link.target}"`);
      // Add rel="noopener noreferrer" for security when opening in new tab
      if (link.target === '_blank' && !link.rel) {
        attributes.push(`rel="noopener noreferrer"`);
      }
    }

    if (link.rel) {
      attributes.push(`rel="${link.rel}"`);
    }

    const classAttr = ` class="${classes.join(' ')}"`;
    return `<a${classAttr} ${attributes.join(' ')}>${linkText}</a>`;
  }

  /**
   * Convert footnote reference to HTML
   * Handles auto-numbering and links to footnote content
   */
  private convertFootnoteSegment(footnote: FootnoteReference): string {
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const prefix = this.options.classPrefix || 'book';

    // Get or assign footnote number
    let number: number;
    if (footnote.number !== undefined) {
      number = footnote.number;
    } else if (this.context.footnoteNumbers?.has(footnote.referenceId)) {
      number = this.context.footnoteNumbers.get(footnote.referenceId)!;
    } else {
      // Auto-assign number
      this.context.footnoteCounter = (this.context.footnoteCounter || 0) + 1;
      number = this.context.footnoteCounter;
      if (!this.context.footnoteNumbers) {
        this.context.footnoteNumbers = new Map();
      }
      this.context.footnoteNumbers.set(footnote.referenceId, number);
    }

    // Use symbol if provided, otherwise use number
    const displayText = footnote.symbol || number.toString();

    // Build footnote reference
    const classes = [generateClassName('footnote-ref', undefined, prefix)];
    const refId = `fnref-${footnote.referenceId}`;
    const targetId = `fn-${footnote.referenceId}`;

    const classAttr = ` class="${classes.join(' ')}"`;
    const idAttr = ` id="${refId}"`;
    const hrefAttr = ` href="#${targetId}"`;
    const roleAttr = this.options.includeAria ? ` role="doc-noteref"` : '';
    const ariaLabel = this.options.includeAria
      ? ` aria-label="Footnote ${number}"`
      : '';

    return `<sup${classAttr}><a${idAttr}${hrefAttr}${roleAttr}${ariaLabel}>${escapeFn(displayText)}</a></sup>`;
  }

  /**
   * Collect a note (footnote or endnote) for later rendering
   */
  private collectNote(note: Note): void {
    const referenceId = note.referenceId || note.id;
    if (!referenceId) {
      return; // Skip notes without reference IDs
    }

    // Determine if this is a footnote or endnote
    const isFootnote = note.noteType === 'footnote';
    const config = isFootnote ? this.options.footnoteConfig : this.options.endnoteConfig;

    if (!config?.enabled) {
      return; // Notes are disabled
    }

    // Determine numbering
    let number: number;
    let symbol: string | undefined;

    if (note.number !== undefined) {
      // Use explicit number
      number = note.number;
    } else if (note.symbol) {
      // Use explicit symbol
      symbol = note.symbol;
      number = this.context.footnoteNumbers?.get(referenceId) || 0;
    } else {
      // Auto-assign number based on scheme
      if (config.numberingScheme === 'per-chapter' && isFootnote) {
        this.context.chapterFootnoteCounter = (this.context.chapterFootnoteCounter || 0) + 1;
        number = this.context.chapterFootnoteCounter;
      } else if (config.numberingScheme === 'symbolic') {
        // Use symbolic numbering
        const symbolIndex = (this.context.footnoteCounter || 0) % (config.symbols?.length || 7);
        symbol = config.symbols?.[symbolIndex] || '*';
        this.context.footnoteCounter = (this.context.footnoteCounter || 0) + 1;
        number = this.context.footnoteCounter;
      } else {
        // Continuous numeric numbering
        this.context.footnoteCounter = (this.context.footnoteCounter || 0) + 1;
        number = this.context.footnoteCounter;
      }

      // Store the assigned number
      if (!this.context.footnoteNumbers) {
        this.context.footnoteNumbers = new Map();
      }
      this.context.footnoteNumbers.set(referenceId, number);
    }

    const storedNote: StoredNote = {
      note,
      number,
      symbol,
      chapterIndex: this.context.chapterIndex,
    };

    // Store in appropriate collection
    if (isFootnote && config.placement === 'chapter-end') {
      if (!this.context.chapterFootnotes) {
        this.context.chapterFootnotes = new Map();
      }
      this.context.chapterFootnotes.set(referenceId, storedNote);
    } else {
      // Store as endnote (book-end)
      if (!this.context.bookEndnotes) {
        this.context.bookEndnotes = new Map();
      }
      this.context.bookEndnotes.set(referenceId, storedNote);
    }
  }

  /**
   * Render footnotes section at chapter end
   */
  private renderFootnotesSection(): string {
    const config = this.options.footnoteConfig;

    // Only render if footnotes are enabled, have chapter-end placement, and exist
    if (!config?.enabled || config.placement !== 'chapter-end' || !this.context.chapterFootnotes?.size) {
      return '';
    }

    const prefix = this.options.classPrefix || 'book';
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const fragments: string[] = [];

    // Section wrapper
    const sectionClass = generateClassName('footnotes-section', undefined, prefix);
    const roleAttr = this.options.includeAria ? ` role="doc-endnotes"` : '';
    fragments.push(`<section class="${sectionClass}"${roleAttr}>`);

    // Section title - use configured title or default to 'Footnotes'
    const sectionTitle = config.sectionTitle || 'Footnotes';
    const titleClass = generateClassName('footnotes-title', undefined, prefix);
    fragments.push(`<h2 class="${titleClass}">${escapeFn(sectionTitle)}</h2>`);

    // Separator
    fragments.push('<hr class="' + generateClassName('footnotes-separator', undefined, prefix) + '" />');

    // Footnotes list
    const listClass = generateClassName('footnotes-list', undefined, prefix);
    fragments.push(`<ol class="${listClass}">`);

    // Sort footnotes by number
    const sortedNotes = Array.from(this.context.chapterFootnotes.values())
      .sort((a, b) => a.number - b.number);

    for (const storedNote of sortedNotes) {
      fragments.push(this.renderSingleNote(storedNote, 'footnote'));
    }

    fragments.push('</ol>');
    fragments.push('</section>');

    // Clear chapter footnotes after rendering
    this.context.chapterFootnotes.clear();

    return fragments.join('\n');
  }

  /**
   * Render endnotes section at book end
   * This handles both endnotes and footnotes with book-end placement
   */
  private renderEndnotesSection(): string {
    const footnoteConfig = this.options.footnoteConfig;
    const endnoteConfig = this.options.endnoteConfig;

    // Check if there are any notes to render
    if (!this.context.bookEndnotes?.size) {
      return '';
    }

    // Separate footnotes and endnotes from bookEndnotes collection
    const bookEndFootnotes: StoredNote[] = [];
    const actualEndnotes: StoredNote[] = [];

    for (const storedNote of this.context.bookEndnotes.values()) {
      if (storedNote.note.noteType === 'footnote') {
        // Only include if footnotes are enabled with book-end placement
        if (footnoteConfig?.enabled && footnoteConfig.placement === 'book-end') {
          bookEndFootnotes.push(storedNote);
        }
      } else if (storedNote.note.noteType === 'endnote') {
        // Only include if endnotes are enabled
        if (endnoteConfig?.enabled) {
          actualEndnotes.push(storedNote);
        }
      }
    }

    // If nothing to render after filtering, return empty string
    if (bookEndFootnotes.length === 0 && actualEndnotes.length === 0) {
      return '';
    }

    const prefix = this.options.classPrefix || 'book';
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const fragments: string[] = [];

    // Determine section title and CSS class based on what's being rendered
    let sectionTitle = 'Notes';
    let sectionClass = 'notes-section';

    if (bookEndFootnotes.length > 0 && actualEndnotes.length === 0) {
      // Only footnotes with book-end placement
      sectionTitle = footnoteConfig?.sectionTitle || 'Footnotes';
      sectionClass = 'footnotes-section';
    } else if (bookEndFootnotes.length === 0 && actualEndnotes.length > 0) {
      // Only endnotes
      sectionTitle = endnoteConfig?.sectionTitle || 'Endnotes';
      sectionClass = 'endnotes-section';
    } else {
      // Both types - use a generic title
      // Prefer endnote config title, or footnote config title, or default to 'Notes'
      sectionTitle = endnoteConfig?.sectionTitle || footnoteConfig?.sectionTitle || 'Notes';
      sectionClass = 'notes-section';
    }

    // Section wrapper
    const sectionClassName = generateClassName(sectionClass, undefined, prefix);
    const roleAttr = this.options.includeAria ? ` role="doc-endnotes"` : '';
    fragments.push(`<section class="${sectionClassName}"${roleAttr}>`);

    // Section title
    const titleClass = generateClassName(sectionClass.replace('-section', '-title'), undefined, prefix);
    fragments.push(`<h2 class="${titleClass}">${escapeFn(sectionTitle)}</h2>`);

    // Separator
    fragments.push('<hr class="' + generateClassName(sectionClass.replace('-section', '-separator'), undefined, prefix) + '" />');

    // Render footnotes first (if any), then endnotes
    if (bookEndFootnotes.length > 0) {
      const listClass = generateClassName('footnotes-list', undefined, prefix);
      fragments.push(`<ol class="${listClass}">`);

      // Sort footnotes by number
      const sortedFootnotes = bookEndFootnotes.sort((a, b) => a.number - b.number);

      for (const storedNote of sortedFootnotes) {
        fragments.push(this.renderSingleNote(storedNote, 'footnote'));
      }

      fragments.push('</ol>');
    }

    if (actualEndnotes.length > 0) {
      const listClass = generateClassName('endnotes-list', undefined, prefix);
      fragments.push(`<ol class="${listClass}">`);

      // Sort endnotes by number
      const sortedEndnotes = actualEndnotes.sort((a, b) => a.number - b.number);

      for (const storedNote of sortedEndnotes) {
        fragments.push(this.renderSingleNote(storedNote, 'endnote'));
      }

      fragments.push('</ol>');
    }

    fragments.push('</section>');

    return fragments.join('\n');
  }

  /**
   * Render a single note (footnote or endnote)
   */
  private renderSingleNote(storedNote: StoredNote, type: 'footnote' | 'endnote'): string {
    const { note, number, symbol } = storedNote;
    const referenceId = note.referenceId || note.id;
    const prefix = this.options.classPrefix || 'book';
    const escapeFn = this.options.escapeHtml || escapeHtml;
    const config = type === 'footnote' ? this.options.footnoteConfig : this.options.endnoteConfig;

    const fragments: string[] = [];

    // List item
    const itemClass = generateClassName(type, undefined, prefix);
    const itemId = `fn-${referenceId}`;
    const roleAttr = this.options.includeAria ? ` role="doc-${type}"` : '';
    fragments.push(`<li id="${itemId}" class="${itemClass}"${roleAttr}>`);

    // Note marker (number or symbol)
    const markerClass = generateClassName('footnote-marker', undefined, prefix);
    const displayText = symbol || number.toString();
    fragments.push(`<span class="${markerClass}">${escapeFn(displayText)}.</span> `);

    // Note content
    const contentClass = generateClassName('footnote-content', undefined, prefix);
    fragments.push(`<span class="${contentClass}">${escapeFn(note.content)}</span>`);

    // Backlink to reference
    if (config?.includeBacklinks) {
      const backlinkClass = generateClassName('footnote-backlink', undefined, prefix);
      const refId = `fnref-${referenceId}`;
      const backlinkRole = this.options.includeAria ? ` role="doc-backlink"` : '';
      const ariaLabel = this.options.includeAria ? ` aria-label="Back to reference"` : '';
      fragments.push(` <a href="#${refId}" class="${backlinkClass}"${backlinkRole}${ariaLabel}>↩</a>`);
    }

    fragments.push('</li>');

    return fragments.join('');
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
  }

  return builder.build();
}

/**
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
  }

  return builder.build();
}

/**
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
}

/**
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

// ============================================================================
// Table of Contents Generation Functions
// ============================================================================

/**
 * TOC entry represents a single item in the table of contents
 */
export interface TocEntry {
  /** Entry ID for linking */
  id: string;
  /** Display title */
  title: string;
  /** Entry type: 'part', 'chapter', 'section', 'element' */
  type: 'part' | 'chapter' | 'section' | 'element';
  /** Hierarchy level (1 = top level, 2 = nested, etc.) */
  level: number;
  /** Child entries for hierarchical structure */
  children?: TocEntry[];
  /** Page number (placeholder for print TOC) */
  pageNumber?: string;
  /** Chapter or part number for display */
  number?: number | string;
  /** Whether this is from front/back matter */
  matterType?: 'front' | 'body' | 'back';
}

/**
 * Collect TOC entries from book structure
 */
export function collectTocEntries(
  book: Book,
  options: BookToHtmlOptions
): TocEntry[] {
  const entries: TocEntry[] = [];
  const tocDepth = options.tocDepth || 'chapters';
  const maxHeadingLevel = options.tocMaxHeadingLevel || 3;

  // Helper to extract heading entries from content
  const extractHeadingsFromContent = (
    content: TextBlock[],
    chapterId: string,
    chapterNumber?: number
  ): TocEntry[] => {
    if (tocDepth !== 'subheads') {
      return [];
    }

    const headings: TocEntry[] = [];
    let headingCounter = 1;

    for (const block of content) {
      if (block.blockType === 'heading' && block.level && block.level <= maxHeadingLevel) {
        const headingId = `chapter-${chapterNumber || chapterId}-heading-${headingCounter}`;
        headings.push({
          id: headingId,
          title: block.content || '',
          type: 'section',
          level: block.level + 2, // Offset by 2 (book title=1, chapter=2, so h1=3)
          pageNumber: options.tocIncludePageNumbers ? '000' : undefined,
        });
        headingCounter++;
      }
    }

    return headings;
  };

  // Collect front matter entries
  if (book.frontMatter) {
    for (const element of book.frontMatter) {
      if (element.includeInToc !== false) {
        entries.push({
          id: `element-${element.id}`,
          title: element.title || element.type,
          type: 'element',
          level: 1,
          matterType: 'front',
          pageNumber: options.tocIncludePageNumbers ? '000' : undefined,
        });
      }
    }
  }

  // Collect chapters with optional parts and subheadings
  if (book.chapters && book.chapters.length > 0) {
    let currentPart: TocEntry | null = null;

    for (const chapter of book.chapters) {
      if (chapter.includeInToc === false) {
        continue;
      }

      // Handle parts
      if (chapter.partNumber !== undefined && chapter.partTitle) {
        if (!currentPart || currentPart.number !== chapter.partNumber) {
          currentPart = {
            id: `part-${chapter.partNumber}`,
            title: chapter.partTitle,
            type: 'part',
            level: 1,
            number: chapter.partNumber,
            matterType: 'body',
            pageNumber: options.tocIncludePageNumbers ? '000' : undefined,
          };
          // Only include children array if tocDepth allows chapter details
          if (tocDepth !== 'parts') {
            currentPart.children = [];
          }
          entries.push(currentPart);
        }
      } else {
        currentPart = null;
      }

      // Create chapter entry
      const chapterTitle = chapter.number !== undefined
        ? `${options.includeChapterNumbers ? `Chapter ${chapter.number}: ` : ''}${chapter.title}`
        : chapter.title;

      const chapterEntry: TocEntry = {
        id: chapter.number !== undefined ? `chapter-${chapter.number}-heading` : `chapter-${chapter.id}-heading`,
        title: chapterTitle,
        type: 'chapter',
        level: currentPart ? 2 : 1,
        number: chapter.number,
        matterType: 'body',
        pageNumber: options.tocIncludePageNumbers ? '000' : undefined,
      };

      // Add subheadings if depth allows
      if (tocDepth === 'subheads' && chapter.content) {
        const headings = extractHeadingsFromContent(
          chapter.content,
          chapter.id,
          chapter.number
        );
        if (headings.length > 0) {
          chapterEntry.children = headings;
        }
      }

      // Add to part or top level
      if (currentPart && tocDepth !== 'parts') {
        currentPart.children = currentPart.children || [];
        currentPart.children.push(chapterEntry);
      } else if (!currentPart) {
        entries.push(chapterEntry);
      }
    }
  }

  // Collect back matter entries
  if (book.backMatter) {
    for (const element of book.backMatter) {
      if (element.includeInToc !== false) {
        entries.push({
          id: `element-${element.id}`,
          title: element.title || element.type,
          type: 'element',
          level: 1,
          matterType: 'back',
          pageNumber: options.tocIncludePageNumbers ? '000' : undefined,
        });
      }
    }
  }

  return entries;
}

/**
 * Generate HTML for a single TOC entry
 */
function generateTocEntryHtml(
  entry: TocEntry,
  classPrefix: string,
  includePageNumbers: boolean
): string {
  const linkClass = generateClassName(CssClassNames.ELEMENT.TOC_LINK, undefined, classPrefix);
  const titleClass = generateClassName(CssClassNames.ELEMENT.TOC_TITLE, undefined, classPrefix);

  // Build entry classes based on type and level
  const entryClasses = [
    generateClassName(CssClassNames.ELEMENT.TOC_ENTRY, undefined, classPrefix),
    generateClassName(CssClassNames.ELEMENT.TOC_ENTRY, entry.type, classPrefix),
    generateClassName(CssClassNames.ELEMENT.TOC_ENTRY, `level-${entry.level}`, classPrefix),
  ];

  // Generate link with title
  const linkHtml = `<a href="#${entry.id}" class="${linkClass}">
    <span class="${titleClass}">${escapeHtml(entry.title)}</span>${
    includePageNumbers && entry.pageNumber
      ? `<span class="${generateClassName(CssClassNames.ELEMENT.TOC_PAGE_NUMBER, undefined, classPrefix)}">${entry.pageNumber}</span>`
      : ''
  }</a>`;

  // Generate children if any
  let childrenHtml = '';
  if (entry.children && entry.children.length > 0) {
    const childItems = entry.children.map(child =>
      generateTocEntryHtml(child, classPrefix, includePageNumbers)
    ).join('\n');
    childrenHtml = `\n<ol>\n${childItems}\n</ol>`;
  }

  return `<li class="${entryClasses.join(' ')}">${linkHtml}${childrenHtml}</li>`;
}

/**
 * Generate complete TOC HTML from book structure
 */
export function generateTocHtml(
  book: Book,
  options: BookToHtmlOptions
): string {
  if (!options.includeToc) {
    return '';
  }

  const classPrefix = options.classPrefix || 'book';
  const tocVariant = options.tocVariant || 'front-matter';
  const includePageNumbers = options.tocIncludePageNumbers || false;

  // Collect TOC entries
  const entries = collectTocEntries(book, options);

  if (entries.length === 0) {
    return '';
  }

  // Build TOC classes
  const tocClasses = [
    generateClassName(CssClassNames.SECTION.TOC, undefined, classPrefix),
    generateClassName(CssClassNames.SECTION.TOC, tocVariant, classPrefix),
  ];

  // Build ARIA attributes
<<<<<<< HEAD
  const includeAria = options.includeAria ?? true;
  const ariaLabel = includeAria ? ' aria-label="Table of Contents"' : '';
  const roleAttr = includeAria ? ' role="doc-toc"' : '';
=======
  const ariaLabel = options.includeAria ? ' aria-label="Table of Contents"' : '';
  const roleAttr = options.includeAria ? ' role="doc-toc"' : '';
>>>>>>> agent/fix-cover-page-html-generation

  // Generate TOC entries HTML
  const entriesHtml = entries.map(entry =>
    generateTocEntryHtml(entry, classPrefix, includePageNumbers)
  ).join('\n');

  // Build TOC title
  const tocTitleClass = generateClassName('element-title', 'toc', classPrefix);
  const tocTitle = `<h1 class="${tocTitleClass}">Contents</h1>`;

  // Wrap in nav element with semantic markup
  return `<nav class="${tocClasses.join(' ')}"${roleAttr}${ariaLabel}>
${tocTitle}
<ol>
${entriesHtml}
</ol>
</nav>`;
}

/**
 * Generate CSS classes for images
 * Returns array of CSS class names for image elements
 */
export function generateImageClasses(
  image: Image,
  classPrefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix: classPrefix });
  builder.element(CssClassNames.ELEMENT.IMAGE);

  const classes = builder.build();

  // Add alignment class
  if (image.alignment) {
    classes.push(
      `${classPrefix}-element-${CssClassNames.ELEMENT.IMAGE}-${image.alignment}`
    );
  }

  // Add sizing class
  if (image.sizing) {
    classes.push(
      `${classPrefix}-element-${CssClassNames.ELEMENT.IMAGE}-size-${image.sizing}`
    );
  }

  // Add responsive class
  classes.push(
    `${classPrefix}-element-${CssClassNames.ELEMENT.IMAGE}-responsive`
  );

  // Add base64 indicator class if applicable
  if (image.isBase64) {
    classes.push(
      `${classPrefix}-element-${CssClassNames.ELEMENT.IMAGE}-embedded`
    );
  }

  // Add custom classes
  if (image.cssClasses && image.cssClasses.length > 0) {
    classes.push(...image.cssClasses);
  }

  return classes;
}

/**
 * Generate HTML for an inline image
 * Converts Image feature to HTML <img> element with appropriate attributes
 */
export function generateImage(
  image: Image,
  classPrefix: string = 'book'
): string {
  const classes = generateImageClasses(image, classPrefix);

  // Build attributes
  const attributes: string[] = [];

  // Add class attribute
  if (classes.length > 0) {
    attributes.push(`class="${classes.join(' ')}"`);
  }

  // Add src attribute (escape quotes in URL)
  const src = image.src.replace(/"/g, '&quot;');
  attributes.push(`src="${src}"`);

  // Add alt attribute (required for accessibility)
  const alt = escapeHtml(image.alt);
  attributes.push(`alt="${alt}"`);

  // Add title attribute if provided
  if (image.title) {
    const title = escapeHtml(image.title);
    attributes.push(`title="${title}"`);
  }

  // Add width if specified
  if (image.width) {
    attributes.push(`width="${escapeHtml(image.width)}"`);
  }

  // Add height if specified
  if (image.height) {
    attributes.push(`height="${escapeHtml(image.height)}"`);
  }

  // Add loading="lazy" for better performance
  attributes.push('loading="lazy"');

  return `<img ${attributes.join(' ')} />`;
}

/**
 * Generate CSS classes for figures
 * Returns array of CSS class names for figure elements
 */
export function generateFigureClasses(
  figure: Figure,
  classPrefix: string = 'book'
): string[] {
  const builder = new ClassBuilder({ prefix: classPrefix });
  builder.element(CssClassNames.ELEMENT.FIGURE);

  const classes = builder.build();

  // Add alignment class
  if (figure.alignment) {
    classes.push(
      `${classPrefix}-element-${CssClassNames.ELEMENT.FIGURE}-${figure.alignment}`
    );
  }

  // Add caption indicator class if caption is present
  if (figure.caption) {
    classes.push(
      `${classPrefix}-element-${CssClassNames.ELEMENT.FIGURE}-with-caption`
    );
  }

  // Add custom classes
  if (figure.cssClasses && figure.cssClasses.length > 0) {
    classes.push(...figure.cssClasses);
  }

  return classes;
}

/**
 * Generate HTML for a figure element
 * Wraps an image in <figure> with optional <figcaption>
 */
export function generateFigure(
  figure: Figure,
  classPrefix: string = 'book'
): string {
  const classes = generateFigureClasses(figure, classPrefix);
  const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

  // Generate the image HTML
  const imageHtml = generateImage(figure.image, classPrefix);

  // Generate caption if provided
  let captionHtml = '';
  if (figure.caption) {
    const captionClasses = [
      `${classPrefix}-element-${CssClassNames.ELEMENT.CAPTION}`,
    ];
    const captionClassAttr = ` class="${captionClasses.join(' ')}"`;
    const captionContent = escapeHtml(figure.caption);
    captionHtml = `\n  <figcaption${captionClassAttr}>${captionContent}</figcaption>`;
  }

  return `<figure${classAttr}>\n  ${imageHtml}${captionHtml}\n</figure>`;
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
 * Generate CSS for image and figure elements
 * Returns CSS rules for inline images and figure wrappers
 */
export function generateImageStyles(classPrefix: string = 'book'): string {
  return `
/* Base Image Styles */
.${classPrefix}-element-image {
  display: inline-block;
  max-width: 100%;
  height: auto;
  vertical-align: middle;
}

.${classPrefix}-element-image-responsive {
  max-width: 100%;
  height: auto;
}

/* Image Sizing */
.${classPrefix}-element-image-size-small {
  max-width: 200px;
}

.${classPrefix}-element-image-size-medium {
  max-width: 400px;
}

.${classPrefix}-element-image-size-large {
  max-width: 600px;
}

.${classPrefix}-element-image-size-full {
  max-width: 100%;
  width: 100%;
}

/* Image Alignment */
.${classPrefix}-element-image-left {
  float: left;
  margin-right: 1em;
  margin-bottom: 0.5em;
}

.${classPrefix}-element-image-right {
  float: right;
  margin-left: 1em;
  margin-bottom: 0.5em;
}

.${classPrefix}-element-image-center {
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.${classPrefix}-element-image-full-width {
  display: block;
  width: 100%;
  max-width: 100%;
  margin-left: 0;
  margin-right: 0;
}

/* Base64 Embedded Images */
.${classPrefix}-element-image-embedded {
  /* Styling for base64 embedded images */
}

/* Figure Styles */
.${classPrefix}-element-figure {
  margin: 1.5em 0;
  padding: 0;
  display: block;
}

.${classPrefix}-element-figure img {
  display: block;
  max-width: 100%;
  height: auto;
}

/* Figure Alignment */
.${classPrefix}-element-figure-left {
  float: left;
  margin-right: 1.5em;
  margin-bottom: 1em;
  max-width: 50%;
}

.${classPrefix}-element-figure-right {
  float: right;
  margin-left: 1.5em;
  margin-bottom: 1em;
  max-width: 50%;
}

.${classPrefix}-element-figure-center {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.${classPrefix}-element-figure-full-width {
  width: 100%;
  margin-left: 0;
  margin-right: 0;
}

/* Figure Caption */
.${classPrefix}-element-caption {
  font-size: 0.9em;
  font-style: italic;
  color: #666;
  text-align: center;
  margin-top: 0.5em;
  padding: 0 1em;
}

.${classPrefix}-element-figure-with-caption {
  /* Additional styling for figures with captions */
}

/* Responsive Design */
@media screen and (max-width: 768px) {
  .${classPrefix}-element-image-left,
  .${classPrefix}-element-image-right {
    float: none;
    display: block;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 1em;
  }

  .${classPrefix}-element-figure-left,
  .${classPrefix}-element-figure-right {
    float: none;
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 1.5em;
  }

  .${classPrefix}-element-image-size-small,
  .${classPrefix}-element-image-size-medium,
  .${classPrefix}-element-image-size-large {
    max-width: 100%;
  }
}

/* Print Styles */
@media print {
  .${classPrefix}-element-figure {
    page-break-inside: avoid;
    margin: 1em 0;
  }

  .${classPrefix}-element-image-left,
  .${classPrefix}-element-image-right {
    float: none;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  .${classPrefix}-element-figure-left,
  .${classPrefix}-element-figure-right {
    float: none;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  .${classPrefix}-element-caption {
    page-break-before: avoid;
    color: #000;
  }
}
`.trim();
}

/**
 * Generate CSS for cover page
 * Returns CSS rules for cover page layout and styling
 */
export function generateCoverPageStyles(classPrefix: string = 'book'): string {
  return `
/* Cover Page Styles */
.${classPrefix}-cover-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  page-break-after: always;
  text-align: center;
  padding: 2em;
  break-after: page;
}

.${classPrefix}-cover-image {
  max-width: 100%;
  max-height: 100vh;
  width: auto;
  height: auto;
  display: block;
  margin: 0 auto;
  object-fit: contain;
}

/* Title-only cover page */
.${classPrefix}-cover-page-title-only {
  flex-direction: column;
}

.${classPrefix}-cover-content {
  max-width: 800px;
  margin: 0 auto;
}

.${classPrefix}-cover-title {
  font-size: 3em;
  font-weight: bold;
  margin: 0 0 0.5em 0;
  line-height: 1.2;
  color: #000;
}

.${classPrefix}-cover-subtitle {
  font-size: 1.5em;
  font-weight: normal;
  margin: 0 0 1em 0;
  line-height: 1.4;
  color: #333;
}

.${classPrefix}-cover-authors {
  font-size: 1.2em;
  font-weight: normal;
  margin: 2em 0 0 0;
  color: #555;
}

/* Responsive Design */
@media screen and (max-width: 768px) {
  .${classPrefix}-cover-page {
    min-height: auto;
    padding: 1em;
  }

  .${classPrefix}-cover-title {
    font-size: 2em;
  }

  .${classPrefix}-cover-subtitle {
    font-size: 1.2em;
  }

  .${classPrefix}-cover-authors {
    font-size: 1em;
  }
}

/* Print Styles */
@media print {
  .${classPrefix}-cover-page {
    page-break-after: always;
    break-after: page;
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

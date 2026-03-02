/**
 * HTML converter for book content
 * Provides infrastructure and types for converting Book structure to HTML
 */

import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element, ElementType, MatterType } from '../../types/element';
import { TextBlock } from '../../types/textBlock';
import { BookStyle, Style } from '../../types/style';
import { Break, TextFeature } from '../../types/textFeature';

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

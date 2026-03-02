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

/**
 * Chapter to XHTML Converter for EPUB
 *
 * Orchestrates conversion of chapter objects to chapter-N.xhtml files.
 * Handles chapter metadata, content blocks, inline formatting, scene breaks, and notes.
 */

import { Chapter } from '../types/chapter';
import { TextBlock } from '../types/textBlock';
import { TextFeature, Break, Verse, Quote, List } from '../types/textFeature';
import { Footnote, Endnote } from '../types/notes';
import { BookStyle } from '../types/style';
import { convertRichText, convertContent, escapeHtml } from './inline-converter';
import {
  convertParagraph,
  convertHeading,
  convertBlockquote,
  convertOrderedList,
  convertUnorderedList,
  convertVerse,
  BlockConverterOptions,
} from './block-converter';
import { convertSceneBreakToHtml, SceneBreakConverterOptions } from './scene-break-converter';
import {
  buildXhtmlDocument,
  EPUB_TYPES,
  escapeXhtml,
  XhtmlTemplateOptions,
} from './xhtml-template';

/**
 * Options for chapter conversion
 */
export interface ChapterConverterOptions {
  /** CSS stylesheets to include */
  stylesheets?: string[];
  /** Book style configuration */
  bookStyle?: BookStyle;
  /** Document language */
  lang?: string;
  /** Directory for text direction */
  dir?: 'ltr' | 'rtl';
  /** Include chapter number in title */
  includeChapterNumber?: boolean;
  /** Custom chapter prefix (default: "Chapter") */
  chapterPrefix?: string;
  /** CSS class prefix for elements */
  classPrefix?: string;
  /** Whether to preserve HTML in content */
  preserveHtml?: boolean;
  /** Whether to include footnotes at chapter end */
  includeFootnotesAtEnd?: boolean;
  /** Whether to include endnotes at chapter end */
  includeEndnotesAtEnd?: boolean;
}

/**
 * Result of chapter conversion
 */
export interface ChapterConversionResult {
  /** The complete XHTML document */
  xhtml: string;
  /** Chapter filename (e.g., "chapter-1.xhtml") */
  filename: string;
  /** Chapter title */
  title: string;
  /** Conversion warnings */
  warnings?: string[];
  /** Chapter metadata */
  metadata: {
    chapterId: string;
    chapterNumber?: number;
    wordCount?: number;
    hasFootnotes: boolean;
    hasEndnotes: boolean;
  };
}

/**
 * Convert a Chapter object to XHTML format
 *
 * @param chapter - The chapter to convert
 * @param options - Conversion options
 * @returns Chapter conversion result with XHTML content
 *
 * @example
 * ```typescript
 * const chapter: Chapter = {
 *   id: 'ch1',
 *   number: 1,
 *   title: 'The Beginning',
 *   content: [...]
 * };
 *
 * const result = convertChapterToXhtml(chapter, {
 *   stylesheets: ['../styles/main.css'],
 *   bookStyle: myBookStyle
 * });
 *
 * // result.xhtml contains the complete XHTML document
 * // result.filename is 'chapter-1.xhtml'
 * ```
 */
export function convertChapterToXhtml(
  chapter: Chapter,
  options: ChapterConverterOptions = {}
): ChapterConversionResult {
  const {
    stylesheets = [],
    bookStyle,
    lang = 'en',
    dir = 'ltr',
    includeChapterNumber = true,
    chapterPrefix = 'Chapter',
    classPrefix = 'epub',
    preserveHtml = true,
    includeFootnotesAtEnd = true,
    includeEndnotesAtEnd = false,
  } = options;

  const warnings: string[] = [];

  // Generate chapter ID
  const chapterId = chapter.id || `chapter-${chapter.number || 'untitled'}`;

  // Build chapter title
  const chapterTitle = buildChapterTitle(chapter, includeChapterNumber, chapterPrefix);

  // Convert chapter content
  const bodyContent = convertChapterContent(chapter, {
    bookStyle,
    classPrefix,
    preserveHtml,
  });

  // Build the complete chapter HTML structure
  const chapterHtml = buildChapterHtml(
    chapterId,
    chapterTitle,
    chapter,
    bodyContent,
    {
      includeFootnotesAtEnd,
      includeEndnotesAtEnd,
      classPrefix,
    }
  );

  // Build XHTML document
  const xhtmlOptions: XhtmlTemplateOptions = {
    title: chapterTitle,
    lang,
    dir,
    stylesheets,
    epubType: EPUB_TYPES.CHAPTER,
    bodyContent: chapterHtml,
    docId: chapterId,
  };

  const xhtml = buildXhtmlDocument(xhtmlOptions);

  // Generate filename
  const filename = generateChapterFilename(chapter);

  return {
    xhtml,
    filename,
    title: chapterTitle,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      chapterId,
      chapterNumber: chapter.number,
      wordCount: chapter.wordCount,
      hasFootnotes: (chapter.footnotes?.length ?? 0) > 0,
      hasEndnotes: (chapter.endnotes?.length ?? 0) > 0,
    },
  };
}

/**
 * Build chapter title from chapter metadata
 */
function buildChapterTitle(
  chapter: Chapter,
  includeNumber: boolean,
  prefix: string
): string {
  const parts: string[] = [];

  if (includeNumber && chapter.number !== undefined) {
    parts.push(`${prefix} ${chapter.number}`);
  }

  if (chapter.title) {
    parts.push(chapter.title);
  }

  return parts.join(': ') || 'Untitled Chapter';
}

/**
 * Generate chapter filename
 */
function generateChapterFilename(chapter: Chapter): string {
  if (chapter.number !== undefined) {
    return `chapter-${chapter.number}.xhtml`;
  }

  // Fallback to sanitized title or ID
  const sanitized = (chapter.title || chapter.id || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `chapter-${sanitized}.xhtml`;
}

/**
 * Convert chapter content blocks to HTML
 */
function convertChapterContent(
  chapter: Chapter,
  options: {
    bookStyle?: BookStyle;
    classPrefix?: string;
    preserveHtml?: boolean;
  }
): string {
  const { bookStyle, classPrefix = 'epub', preserveHtml = true } = options;
  const htmlParts: string[] = [];

  const blockOptions: BlockConverterOptions = {
    sanitizeHtml: !preserveHtml,
    preserveClasses: true,
    preserveIds: true,
  };

  const sceneBreakOptions: SceneBreakConverterOptions = {
    bookStyle,
    classPrefix,
  };

  // Process each content block
  for (const block of chapter.content || []) {
    const blockHtml = convertTextBlock(block, blockOptions, sceneBreakOptions);
    if (blockHtml) {
      htmlParts.push(blockHtml);
    }
  }

  return htmlParts.join('\n\n');
}

/**
 * Convert a single TextBlock to HTML
 */
function convertTextBlock(
  block: TextBlock,
  blockOptions: BlockConverterOptions,
  sceneBreakOptions: SceneBreakConverterOptions
): string {
  // Get block content (prefer richText over plain content)
  const content = block.richText
    ? convertRichText(block.richText)
    : escapeHtml(block.content);

  let html = '';

  // Convert based on block type
  switch (block.blockType) {
    case 'paragraph':
      html = convertParagraph(content, {}, blockOptions).html;
      break;

    case 'heading':
      const level = Math.min(Math.max(block.level || 2, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
      html = convertHeading(level, content, {}, blockOptions).html;
      break;

    case 'preformatted':
    case 'code':
      html = convertCodeBlock(content, block.language);
      break;

    case 'list':
      html = convertListBlock(block, content, blockOptions);
      break;

    default:
      // Default to paragraph
      html = convertParagraph(content, {}, blockOptions).html;
  }

  // Process features (scene breaks, quotes, verse, etc.)
  if (block.features && block.features.length > 0) {
    const featureHtml = block.features
      .map(feature => convertTextFeature(feature, sceneBreakOptions, blockOptions))
      .filter(Boolean)
      .join('\n');

    if (featureHtml) {
      html = html + '\n' + featureHtml;
    }
  }

  return html;
}

/**
 * Convert a code block to HTML
 */
function convertCodeBlock(content: string, language?: string): string {
  const langClass = language ? ` class="language-${escapeHtml(language)}"` : '';
  return `<pre><code${langClass}>${content}</code></pre>`;
}

/**
 * Convert a list block to HTML
 */
function convertListBlock(
  block: TextBlock,
  content: string,
  options: BlockConverterOptions
): string {
  const isOrdered = block.listType === 'ordered';

  // For simple list blocks, split content by lines
  const items = content.split('\n').filter(line => line.trim());

  if (isOrdered) {
    return convertOrderedList(items, {}, options).html;
  } else {
    return convertUnorderedList(items, {}, options).html;
  }
}

/**
 * Convert a TextFeature to HTML
 */
function convertTextFeature(
  feature: TextFeature,
  sceneBreakOptions: SceneBreakConverterOptions,
  blockOptions: BlockConverterOptions
): string {
  switch (feature.type) {
    case 'break':
      return convertSceneBreakToHtml(feature as Break, sceneBreakOptions);

    case 'quote':
      return convertQuoteFeature(feature as Quote, blockOptions);

    case 'verse':
      return convertVerseFeature(feature as Verse, blockOptions);

    case 'list':
      return convertListFeature(feature as List, blockOptions);

    case 'subhead':
      return convertHeading(3, escapeHtml(feature.content || ''), {}, blockOptions).html;

    default:
      return '';
  }
}

/**
 * Convert a Quote feature to HTML
 */
function convertQuoteFeature(quote: Quote, options: BlockConverterOptions): string {
  const content = escapeHtml(quote.content);
  let html = convertBlockquote(content, {}, options).html;

  if (quote.attribution) {
    const attribution = escapeHtml(quote.attribution);
    const source = quote.source ? escapeHtml(quote.source) : '';
    const cite = source ? ` <cite>${source}</cite>` : '';
    html = html.replace('</blockquote>', `  <footer>— ${attribution}${cite}</footer>\n</blockquote>`);
  }

  return html;
}

/**
 * Convert a Verse feature to HTML
 */
function convertVerseFeature(verse: Verse, options: BlockConverterOptions): string {
  const lines = verse.lines.map(line => escapeHtml(line));
  return convertVerse(lines, {}, options).html;
}

/**
 * Convert a List feature to HTML
 */
function convertListFeature(list: List, options: BlockConverterOptions): string {
  const items = list.items.map(item => escapeHtml(item.content));

  if (list.listType === 'ordered') {
    return convertOrderedList(items, {}, options).html;
  } else {
    return convertUnorderedList(items, {}, options).html;
  }
}

/**
 * Build the complete chapter HTML structure
 */
function buildChapterHtml(
  chapterId: string,
  chapterTitle: string,
  chapter: Chapter,
  bodyContent: string,
  options: {
    includeFootnotesAtEnd?: boolean;
    includeEndnotesAtEnd?: boolean;
    classPrefix?: string;
  }
): string {
  const { includeFootnotesAtEnd, includeEndnotesAtEnd, classPrefix = 'epub' } = options;
  const parts: string[] = [];

  // Open chapter section
  parts.push(`  <section epub:type="${EPUB_TYPES.CHAPTER}" id="${chapterId}">`);

  // Add chapter title
  parts.push(`    <h1>${escapeXhtml(chapterTitle)}</h1>`);

  // Add subtitle if present
  if (chapter.subtitle) {
    parts.push(`    <p class="chapter-subtitle">${escapeXhtml(chapter.subtitle)}</p>`);
  }

  // Add epigraph if present
  if (chapter.epigraph) {
    parts.push(`    <div class="epigraph">`);
    parts.push(`      <p>${escapeXhtml(chapter.epigraph)}</p>`);
    if (chapter.epigraphAttribution) {
      parts.push(`      <footer>— ${escapeXhtml(chapter.epigraphAttribution)}</footer>`);
    }
    parts.push(`    </div>`);
  }

  // Add main content (indented)
  const indentedContent = bodyContent
    .split('\n')
    .map(line => (line ? `    ${line}` : line))
    .join('\n');
  parts.push(indentedContent);

  // Add footnotes section if requested
  if (includeFootnotesAtEnd && chapter.footnotes && chapter.footnotes.length > 0) {
    parts.push(convertFootnotesSection(chapter.footnotes, classPrefix));
  }

  // Add endnotes section if requested
  if (includeEndnotesAtEnd && chapter.endnotes && chapter.endnotes.length > 0) {
    parts.push(convertEndnotesSection(chapter.endnotes, classPrefix));
  }

  // Close chapter section
  parts.push(`  </section>`);

  return parts.join('\n');
}

/**
 * Convert footnotes to HTML section
 */
function convertFootnotesSection(footnotes: Footnote[], classPrefix: string): string {
  const parts: string[] = [];

  parts.push(`    <aside epub:type="footnotes" class="${classPrefix}-footnotes">`);
  parts.push(`      <h2>Footnotes</h2>`);
  parts.push(`      <ol>`);

  for (const footnote of footnotes) {
    const noteId = footnote.id;
    const marker = footnote.number?.toString() || footnote.symbol || '*';
    const content = escapeXhtml(footnote.content);

    parts.push(`        <li id="${noteId}" epub:type="footnote">`);
    parts.push(`          <p>${content} <a href="#ref-${noteId}">↩</a></p>`);
    parts.push(`        </li>`);
  }

  parts.push(`      </ol>`);
  parts.push(`    </aside>`);

  return parts.join('\n');
}

/**
 * Convert endnotes to HTML section
 */
function convertEndnotesSection(endnotes: Endnote[], classPrefix: string): string {
  const parts: string[] = [];

  parts.push(`    <aside epub:type="endnotes" class="${classPrefix}-endnotes">`);
  parts.push(`      <h2>Notes</h2>`);
  parts.push(`      <ol>`);

  for (const endnote of endnotes) {
    const noteId = endnote.id;
    const marker = endnote.number?.toString() || endnote.symbol || '*';
    const content = escapeXhtml(endnote.content);

    parts.push(`        <li id="${noteId}" epub:type="endnote">`);
    parts.push(`          <p>${content} <a href="#ref-${noteId}">↩</a></p>`);
    parts.push(`        </li>`);
  }

  parts.push(`      </ol>`);
  parts.push(`    </aside>`);

  return parts.join('\n');
}

/**
 * Batch convert multiple chapters to XHTML
 *
 * @param chapters - Array of chapters to convert
 * @param options - Conversion options
 * @returns Array of chapter conversion results
 */
export function convertChaptersToXhtml(
  chapters: Chapter[],
  options: ChapterConverterOptions = {}
): ChapterConversionResult[] {
  return chapters.map(chapter => convertChapterToXhtml(chapter, options));
}

/**
 * Save chapter XHTML to file system
 * (This would typically use Node.js fs module in actual implementation)
 *
 * @param result - Chapter conversion result
 * @param outputDir - Output directory path
 * @returns Promise resolving to the file path
 */
export async function saveChapterXhtml(
  result: ChapterConversionResult,
  outputDir: string
): Promise<string> {
  // This is a placeholder - actual implementation would use fs.writeFile
  const filePath = `${outputDir}/${result.filename}`;
  // await fs.promises.writeFile(filePath, result.xhtml, 'utf-8');
  return filePath;
}

/**
 * Validate chapter structure before conversion
 *
 * @param chapter - Chapter to validate
 * @returns Validation result with any errors
 */
export function validateChapter(chapter: Chapter): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!chapter.title || chapter.title.trim() === '') {
    errors.push('Chapter title is required');
  }

  if (!chapter.content || chapter.content.length === 0) {
    errors.push('Chapter content is empty');
  }

  if (chapter.content) {
    for (let i = 0; i < chapter.content.length; i++) {
      const block = chapter.content[i];
      if (!block.blockType) {
        errors.push(`Content block ${i} missing blockType`);
      }
      if (!block.content && !block.richText) {
        errors.push(`Content block ${i} has no content`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

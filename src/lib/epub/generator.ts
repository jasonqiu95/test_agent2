/**
 * EPUB 3 Generator
 * Handles the complete EPUB generation workflow:
 * book data → EPUB structure → metadata → styling → TOC → packaging
 */

import { Book } from '../../types/book';
import { BookStyle } from '../../types/style';
import { ImageData } from '../../workers/types';
import {
  EpubOptions,
  EpubMetadata,
  ChapterData,
  EpubStructure,
  EpubValidationResult,
  EpubImageData,
  EpubStylesheet,
} from '../../types/epub';

// Re-export types for backward compatibility
export type EPUBOptions = EpubOptions;
export type EPUBMetadata = EpubMetadata;
export type EPUBChapter = ChapterData;
export type EPUBStructure = Omit<EpubStructure, 'content' | 'styles'> & {
  chapters: ChapterData[];
  styles: string;
};
export type EPUBValidationResult = EpubValidationResult;

/**
 * Generate EPUB structure from book data
 */
export function generateEPUBStructure(
  book: Book,
  styles: BookStyle[],
  images: ImageData[],
  options: EpubOptions = {}
): EPUBStructure {
  const metadata = generateMetadata(book, options);
  const chapters = generateChapters(book, options);
  const epubStyles = generateStyles(book, styles, options);
  const epubImages = processImages(images, book);
  const coverImage = images.find(img => img.id === book.coverImage);

  return {
    metadata,
    chapters,
    styles: epubStyles,
    images: epubImages,
    coverImage,
  };
}

/**
 * Generate EPUB metadata from book data
 */
function generateMetadata(book: Book, options: EpubOptions): EpubMetadata {
  const authors = book.authors.map(a => a.name);

  return {
    title: book.title,
    author: authors.length === 1 ? authors[0] : authors,
    language: book.metadata.language || 'en',
    publisher: book.metadata.publisher,
    description: book.metadata.description,
    isbn: book.metadata.isbn13 || book.metadata.isbn,
    publicationDate: book.metadata.publicationDate,
    subject: book.metadata.genre,
    rights: book.metadata.rights,
    coverImage: book.coverImage,
    series: book.metadata.series,
    seriesNumber: book.metadata.seriesNumber,
    edition: book.metadata.edition,
    keywords: book.metadata.keywords,
    awards: book.metadata.awards,
  };
}

/**
 * Generate EPUB chapters from book structure
 */
function generateChapters(book: Book, options: EpubOptions): ChapterData[] {
  const chapters: ChapterData[] = [];

  // Add front matter
  if (book.frontMatter && book.frontMatter.length > 0) {
    book.frontMatter.forEach((element, index) => {
      const content = renderElementContent(element);
      chapters.push({
        id: element.id || `front-matter-${index + 1}`,
        title: element.metadata?.title || `Front Matter ${index + 1}`,
        content,
        filename: `front-matter-${index + 1}.xhtml`,
        excludeFromToc: !element.includeInToc,
        beforeToc: true,
      });
    });
  }

  // Add chapters
  book.chapters.forEach((chapter, index) => {
    const content = renderChapterContent(chapter);
    chapters.push({
      id: chapter.id,
      title: chapter.title,
      subtitle: chapter.subtitle,
      content,
      filename: `chapter-${index + 1}.xhtml`,
      number: chapter.number || index + 1,
      partNumber: chapter.partNumber,
      partTitle: chapter.partTitle,
      excludeFromToc: chapter.includeInToc === false,
      epigraph: chapter.epigraph,
      epigraphAttribution: chapter.epigraphAttribution,
    });
  });

  // Add back matter
  if (book.backMatter && book.backMatter.length > 0) {
    book.backMatter.forEach((element, index) => {
      const content = renderElementContent(element);
      chapters.push({
        id: element.id || `back-matter-${index + 1}`,
        title: element.metadata?.title || `Back Matter ${index + 1}`,
        content,
        filename: `back-matter-${index + 1}.xhtml`,
        excludeFromToc: !element.includeInToc,
      });
    });
  }

  return chapters;
}

/**
 * Render element content to HTML
 */
function renderElementContent(element: any): string {
  let html = '<div class="element">';

  if (element.metadata?.title) {
    html += `<h1 class="element-title">${escapeHtml(element.metadata.title)}</h1>`;
  }

  if (element.content && Array.isArray(element.content)) {
    element.content.forEach((block: any) => {
      html += renderTextBlock(block);
    });
  }

  html += '</div>';
  return html;
}

/**
 * Render chapter content to HTML
 */
function renderChapterContent(chapter: any): string {
  let html = '<div class="chapter">';

  // Chapter title
  if (chapter.title) {
    html += `<h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>`;
  }

  // Subtitle
  if (chapter.subtitle) {
    html += `<h2 class="chapter-subtitle">${escapeHtml(chapter.subtitle)}</h2>`;
  }

  // Epigraph
  if (chapter.epigraph) {
    html += '<div class="epigraph">';
    html += `<p class="epigraph-text">${escapeHtml(chapter.epigraph)}</p>`;
    if (chapter.epigraphAttribution) {
      html += `<p class="epigraph-attribution">${escapeHtml(chapter.epigraphAttribution)}</p>`;
    }
    html += '</div>';
  }

  // Content
  if (chapter.content && Array.isArray(chapter.content)) {
    chapter.content.forEach((block: any) => {
      html += renderTextBlock(block);
    });
  }

  html += '</div>';
  return html;
}

/**
 * Render text block to HTML
 */
function renderTextBlock(block: any): string {
  if (!block || !block.content) return '';

  const tag = getBlockTag(block.type);
  const classes = getBlockClasses(block);
  const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

  let html = `<${tag}${classAttr}>`;

  if (typeof block.content === 'string') {
    html += escapeHtml(block.content);
  } else if (Array.isArray(block.content)) {
    block.content.forEach((inline: any) => {
      html += renderInlineText(inline);
    });
  }

  html += `</${tag}>`;
  return html;
}

/**
 * Render inline text with formatting
 */
function renderInlineText(inline: any): string {
  if (!inline) return '';

  if (typeof inline === 'string') {
    return escapeHtml(inline);
  }

  let text = inline.text || '';
  text = escapeHtml(text);

  // Apply formatting
  if (inline.bold) {
    text = `<strong>${text}</strong>`;
  }
  if (inline.italic) {
    text = `<em>${text}</em>`;
  }
  if (inline.underline) {
    text = `<u>${text}</u>`;
  }
  if (inline.strikethrough) {
    text = `<del>${text}</del>`;
  }
  if (inline.superscript) {
    text = `<sup>${text}</sup>`;
  }
  if (inline.subscript) {
    text = `<sub>${text}</sub>`;
  }

  return text;
}

/**
 * Get HTML tag for block type
 */
function getBlockTag(type: string): string {
  const tagMap: Record<string, string> = {
    paragraph: 'p',
    heading1: 'h1',
    heading2: 'h2',
    heading3: 'h3',
    heading4: 'h4',
    heading5: 'h5',
    heading6: 'h6',
    blockquote: 'blockquote',
    list: 'ul',
    orderedList: 'ol',
    listItem: 'li',
    codeBlock: 'pre',
  };

  return tagMap[type] || 'div';
}

/**
 * Get CSS classes for block
 */
function getBlockClasses(block: any): string[] {
  const classes: string[] = [];

  if (block.type) {
    classes.push(`block-${block.type}`);
  }

  if (block.alignment) {
    classes.push(`align-${block.alignment}`);
  }

  if (block.style) {
    classes.push(`style-${block.style}`);
  }

  return classes;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Generate CSS styles for EPUB
 */
function generateStyles(
  book: Book,
  styles: BookStyle[],
  options: EpubOptions
): string {
  let css = `
/* EPUB Base Styles */
body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 0;
  padding: 1em;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: bold;
  margin: 1.5em 0 0.5em 0;
  line-height: 1.3;
}

h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.25em; }

p {
  margin: 0 0 1em 0;
  text-indent: 1.5em;
}

.chapter-title {
  text-align: center;
  margin-top: 2em;
  margin-bottom: 1em;
}

.chapter-subtitle {
  text-align: center;
  font-style: italic;
  margin-bottom: 2em;
}

.epigraph {
  margin: 2em 20% 2em auto;
  text-align: right;
  font-style: italic;
}

.epigraph-attribution {
  margin-top: 0.5em;
  font-size: 0.9em;
}

blockquote {
  margin: 1em 2em;
  font-style: italic;
}

.element-title {
  text-align: center;
  margin-top: 2em;
  margin-bottom: 2em;
}

/* Alignment classes */
.align-left { text-align: left; }
.align-center { text-align: center; }
.align-right { text-align: right; }
.align-justify { text-align: justify; }
`;

  // Add custom styles from book
  if (styles && styles.length > 0) {
    styles.forEach(style => {
      if (style.css) {
        css += `\n/* ${style.name} */\n${style.css}\n`;
      }
    });
  }

  return css;
}

/**
 * Process images for EPUB
 */
function processImages(images: ImageData[], book: Book): EpubImageData[] {
  return images.map(img => ({
    id: img.id,
    url: img.url,
    buffer: img.buffer,
    mimeType: img.mimeType || 'image/jpeg',
    width: img.width,
    height: img.height,
  }));
}

/**
 * Generate Table of Contents structure
 */
export function generateTOC(structure: EPUBStructure): string {
  const items: string[] = [];

  structure.chapters.forEach((chapter, index) => {
    if (!chapter.excludeFromToc) {
      const filename = chapter.filename || `chapter-${index + 1}.xhtml`;
      items.push(
        `<li><a href="${filename}">${escapeHtml(chapter.title)}</a></li>`
      );
    }
  });

  return `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${items.join('\n      ')}
    </ol>
  </nav>
</body>
</html>
`;
}

/**
 * Basic EPUB validation
 */
export function validateEPUB(structure: EPUBStructure): EpubValidationResult {
  const errors: EpubValidationResult['errors'] = [];

  // Validate metadata
  if (!structure.metadata.title) {
    errors.push({
      type: 'error',
      message: 'EPUB metadata must include a title',
      location: 'metadata',
    });
  }

  if (!structure.metadata.author ||
      (Array.isArray(structure.metadata.author) && structure.metadata.author.length === 0)) {
    errors.push({
      type: 'error',
      message: 'EPUB metadata must include at least one author',
      location: 'metadata',
    });
  }

  if (!structure.metadata.language || structure.metadata.language.trim() === '') {
    errors.push({
      type: 'warning',
      message: 'EPUB metadata should include a language',
      location: 'metadata',
    });
  }

  // Validate chapters
  if (!structure.chapters || structure.chapters.length === 0) {
    errors.push({
      type: 'error',
      message: 'EPUB must contain at least one chapter',
      location: 'content',
    });
  }

  structure.chapters.forEach((chapter, index) => {
    if (!chapter.title) {
      errors.push({
        type: 'warning',
        message: `Chapter ${index + 1} is missing a title`,
        location: `chapter-${index}`,
      });
    }

    if (!chapter.content || chapter.content.trim().length === 0) {
      errors.push({
        type: 'warning',
        message: `Chapter ${index + 1} has no content`,
        location: `chapter-${index}`,
      });
    }
  });

  return {
    valid: errors.filter(e => e.type === 'error').length === 0,
    errors,
  };
}

/**
 * Package EPUB structure into buffer
 */
export async function packageEPUB(
  structure: EPUBStructure,
  options: EpubOptions = {}
): Promise<ArrayBuffer> {
  // This would use epub-gen-memory or similar library
  // For now, we'll create a simple implementation
  try {
    const EPub = (await import('epub-gen-memory')).default || (await import('epub-gen-memory'));

    const epubOptions = {
      title: structure.metadata.title,
      author: Array.isArray(structure.metadata.author)
        ? structure.metadata.author.join(', ')
        : structure.metadata.author,
      publisher: structure.metadata.publisher,
      description: structure.metadata.description,
      cover: structure.coverImage?.url,
      css: structure.styles,
      content: structure.chapters.map(ch => ({
        title: ch.title,
        data: ch.content,
        excludeFromToc: ch.excludeFromToc,
        beforeToc: ch.beforeToc,
      })),
      verbose: false,
    };

    const epubInstance = new (EPub as any)(epubOptions);
    const buffer = await epubInstance.genEpub();
    return buffer;
  } catch (error) {
    throw new Error(`Failed to package EPUB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

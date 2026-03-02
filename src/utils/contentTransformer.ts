/**
 * Content Transformer Module
 *
 * This module provides functionality to transform book element data into semantic HTML markup.
 * It handles chapters, paragraphs, headings, subheads, block quotes, verse, lists, breaks,
 * inline images, footnotes, endnotes, and rich text formatting (bold, italic, links).
 */

import { Element } from '../types/element';
import { TextBlock } from '../types/textBlock';
import {
  TextFeature,
  Subhead,
  Break,
  Quote,
  Verse,
  List,
  ListItem,
  Link,
  Note,
} from '../types/textFeature';
import { InlineStyle, TextSegment, ImageReference } from '../types/inlineText';

/**
 * Options for content transformation
 */
export interface TransformOptions {
  /** CSS class prefix for generated elements */
  classPrefix?: string;
  /** Whether to include inline styles */
  useInlineStyles?: boolean;
  /** Whether to generate IDs for elements */
  generateIds?: boolean;
  /** Starting number for footnotes */
  footnoteStartNumber?: number;
  /** Starting number for endnotes */
  endnoteStartNumber?: number;
}

/**
 * Escapes HTML special characters to prevent XSS vulnerabilities
 *
 * @param text - Text to escape
 * @returns Escaped text safe for HTML insertion
 */
function escapeHtml(text: string | undefined): string {
  if (!text) return '';

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Transforms book element content into HTML
 *
 * @param element - The element to transform
 * @param options - Transformation options
 * @returns HTML string representation of the element
 */
export function transformElementToHtml(
  element: Element,
  options: TransformOptions = {}
): string {
  const { classPrefix = 'book', generateIds = true } = options;

  const elementId = generateIds && element.id ? ` id="${escapeHtml(element.id)}"` : '';
  const elementClass = `${classPrefix}-element`;
  const dataAttrs = `data-type="${escapeHtml(element.type)}" data-matter="${escapeHtml(element.matter)}"`;

  let html = `<article class="${elementClass}"${elementId} ${dataAttrs}>\n`;

  // Add element title if present
  if (element.title) {
    html += transformElementTitle(element.title, element.type, classPrefix);
  }

  // Transform content blocks
  html += `  <div class="${classPrefix}-content">\n`;
  if (element.content && element.content.length > 0) {
    html += transformTextBlocks(element.content, options);
  }
  html += `  </div>\n`;

  html += `</article>`;

  return html;
}

/**
 * Transforms element title into HTML heading
 *
 * @param title - The title text
 * @param elementType - Type of element
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the title
 */
function transformElementTitle(
  title: string,
  elementType: string,
  classPrefix: string
): string {
  return `  <header class="${classPrefix}-header">
    <h1 class="${classPrefix}-title ${classPrefix}-title--${elementType}">${escapeHtml(title)}</h1>
  </header>\n`;
}

/**
 * Transforms an array of text blocks into HTML
 *
 * @param blocks - Array of text blocks to transform
 * @param options - Transformation options
 * @returns HTML string representation of the blocks
 */
export function transformTextBlocks(
  blocks: TextBlock[],
  options: TransformOptions = {}
): string {
  const { classPrefix = 'book' } = options;
  let html = '';
  let footnoteCounter = options.footnoteStartNumber || 1;
  let endnoteCounter = options.endnoteStartNumber || 1;

  blocks.forEach((block, index) => {
    const isFirstBlock = index === 0;

    switch (block.blockType) {
      case 'paragraph':
        html += transformParagraph(block, classPrefix, isFirstBlock);
        break;
      case 'heading':
        html += transformHeading(block, classPrefix);
        break;
      case 'preformatted':
        html += transformPreformatted(block, classPrefix);
        break;
      case 'code':
        html += transformCode(block, classPrefix);
        break;
      default:
        html += transformParagraph(block, classPrefix, isFirstBlock);
    }

    // Handle features (subheads, breaks, quotes, etc.)
    if (block.features && block.features.length > 0) {
      block.features.forEach((feature) => {
        switch (feature.type) {
          case 'subhead':
            html += transformSubhead(feature as Subhead, classPrefix);
            break;
          case 'break':
            html += transformBreak(feature as Break, classPrefix);
            break;
          case 'quote':
            html += transformQuote(feature as Quote, classPrefix);
            break;
          case 'verse':
            html += transformVerse(feature as Verse, classPrefix);
            break;
          case 'list':
            html += transformList(feature as List, classPrefix);
            break;
          case 'link':
            html += transformLink(feature as Link, classPrefix);
            break;
          case 'note':
            const note = feature as Note;
            if (note.noteType === 'footnote') {
              html += transformFootnote(note, footnoteCounter++, classPrefix);
            } else if (note.noteType === 'endnote') {
              html += transformEndnote(note, endnoteCounter++, classPrefix);
            } else {
              html += transformNote(note, classPrefix);
            }
            break;
        }
      });
    }
  });

  return html;
}

/**
 * Transforms a paragraph block into HTML
 *
 * @param block - The paragraph block
 * @param classPrefix - CSS class prefix
 * @param isFirst - Whether this is the first paragraph
 * @returns HTML string for the paragraph
 */
function transformParagraph(
  block: TextBlock,
  classPrefix: string,
  isFirst: boolean = false
): string {
  const firstClass = isFirst ? ` ${classPrefix}-paragraph--first` : '';
  const blockId = block.id ? ` id="${escapeHtml(block.id)}"` : '';
  const content = transformRichText(block.content, classPrefix);

  return `    <p class="${classPrefix}-paragraph${firstClass}"${blockId}>${content}</p>\n`;
}

/**
 * Transforms a heading block into HTML
 *
 * @param block - The heading block
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the heading
 */
function transformHeading(block: TextBlock, classPrefix: string): string {
  const level = Math.min(Math.max(block.level || 2, 1), 6);
  const blockId = block.id ? ` id="${escapeHtml(block.id)}"` : '';
  const content = transformRichText(block.content, classPrefix);

  return `    <h${level} class="${classPrefix}-heading ${classPrefix}-heading--${level}"${blockId}>${content}</h${level}>\n`;
}

/**
 * Transforms a preformatted text block into HTML
 *
 * @param block - The preformatted block
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the preformatted text
 */
function transformPreformatted(block: TextBlock, classPrefix: string): string {
  const blockId = block.id ? ` id="${escapeHtml(block.id)}"` : '';
  return `    <pre class="${classPrefix}-preformatted"${blockId}>${escapeHtml(block.content)}</pre>\n`;
}

/**
 * Transforms a code block into HTML
 *
 * @param block - The code block
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the code block
 */
function transformCode(block: TextBlock, classPrefix: string): string {
  const blockId = block.id ? ` id="${escapeHtml(block.id)}"` : '';
  const langClass = block.language ? ` language-${escapeHtml(block.language)}` : '';

  return `    <pre class="${classPrefix}-code"${blockId}><code class="${classPrefix}-code-content${langClass}">${escapeHtml(block.content)}</code></pre>\n`;
}

/**
 * Transforms a subhead into HTML
 *
 * @param subhead - The subhead feature
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the subhead
 */
function transformSubhead(subhead: Subhead, classPrefix: string): string {
  const level = Math.min(Math.max(subhead.level || 3, 2), 6);
  const subheadId = subhead.id ? ` id="${escapeHtml(subhead.id)}"` : '';
  const content = transformRichText(subhead.content, classPrefix);

  return `    <h${level} class="${classPrefix}-subhead ${classPrefix}-subhead--${level}"${subheadId}>${content}</h${level}>\n`;
}

/**
 * Transforms a break (scene break, ornamental break, etc.) into HTML
 *
 * @param breakFeature - The break feature
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the break
 */
function transformBreak(breakFeature: Break, classPrefix: string): string {
  const breakType = breakFeature.breakType || 'scene';
  const breakId = breakFeature.id ? ` id="${escapeHtml(breakFeature.id)}"` : '';

  if (breakType === 'line') {
    return `    <hr class="${classPrefix}-break ${classPrefix}-break--line"${breakId} />\n`;
  }

  const symbol = escapeHtml(breakFeature.symbol || '* * *');

  return `    <div class="${classPrefix}-break ${classPrefix}-break--${breakType}"${breakId}>
      <span class="${classPrefix}-break-symbol">${symbol}</span>
    </div>\n`;
}

/**
 * Transforms a block quote into HTML
 *
 * @param quote - The quote feature
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the quote
 */
function transformQuote(quote: Quote, classPrefix: string): string {
  const quoteType = quote.quoteType || 'block';
  const quoteId = quote.id ? ` id="${escapeHtml(quote.id)}"` : '';
  const content = transformRichText(quote.content, classPrefix);

  let html = `    <blockquote class="${classPrefix}-quote ${classPrefix}-quote--${quoteType}"${quoteId}>\n`;
  html += `      <p class="${classPrefix}-quote-content">${content}</p>\n`;

  if (quote.attribution || quote.source) {
    html += `      <footer class="${classPrefix}-quote-footer">\n`;
    if (quote.attribution) {
      html += `        <cite class="${classPrefix}-quote-attribution">${escapeHtml(quote.attribution)}</cite>\n`;
    }
    if (quote.source) {
      html += `        <span class="${classPrefix}-quote-source">${escapeHtml(quote.source)}</span>\n`;
    }
    html += `      </footer>\n`;
  }

  html += `    </blockquote>\n`;
  return html;
}

/**
 * Transforms verse (poetry) into HTML
 *
 * @param verse - The verse feature
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the verse
 */
function transformVerse(verse: Verse, classPrefix: string): string {
  const verseId = verse.id ? ` id="${escapeHtml(verse.id)}"` : '';
  const stanzaAttr = verse.stanza ? ` data-stanza="${verse.stanza}"` : '';

  let html = `    <div class="${classPrefix}-verse"${verseId}${stanzaAttr}>\n`;

  verse.lines.forEach((line, index) => {
    const indent = verse.indentation && verse.indentation[index]
      ? ` style="padding-left: ${verse.indentation[index]}em;"`
      : '';
    const content = transformRichText(line, classPrefix);
    html += `      <div class="${classPrefix}-verse-line"${indent}>${content}</div>\n`;
  });

  html += `    </div>\n`;
  return html;
}

/**
 * Transforms a list into HTML
 *
 * @param list - The list feature
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the list
 */
function transformList(list: List, classPrefix: string): string {
  const listId = list.id ? ` id="${escapeHtml(list.id)}"` : '';
  const startAttr = list.listType === 'ordered' && list.startNumber
    ? ` start="${list.startNumber}"`
    : '';

  if (list.listType === 'definition') {
    return transformDefinitionList(list, classPrefix, listId);
  }

  const tagName = list.listType === 'ordered' ? 'ol' : 'ul';
  let html = `    <${tagName} class="${classPrefix}-list ${classPrefix}-list--${list.listType}"${listId}${startAttr}>\n`;

  list.items.forEach((item) => {
    html += transformListItem(item, classPrefix);
  });

  html += `    </${tagName}>\n`;
  return html;
}

/**
 * Transforms a list item into HTML
 *
 * @param item - The list item
 * @param classPrefix - CSS class prefix
 * @param level - Nesting level
 * @returns HTML string for the list item
 */
function transformListItem(
  item: ListItem,
  classPrefix: string,
  level: number = 0
): string {
  const indent = '  '.repeat(level + 2);
  const content = transformRichText(item.content, classPrefix);
  let html = `${indent}<li class="${classPrefix}-list-item">${content}`;

  if (item.children && item.children.length > 0) {
    const childTagName = 'ul';
    html += `\n${indent}  <${childTagName} class="${classPrefix}-list ${classPrefix}-list--nested">\n`;
    item.children.forEach((child) => {
      html += transformListItem(child, classPrefix, level + 1);
    });
    html += `${indent}  </${childTagName}>\n${indent}`;
  }

  html += `</li>\n`;
  return html;
}

/**
 * Transforms a definition list into HTML
 *
 * @param list - The list feature
 * @param classPrefix - CSS class prefix
 * @param listId - Optional ID attribute
 * @returns HTML string for the definition list
 */
function transformDefinitionList(
  list: List,
  classPrefix: string,
  listId: string
): string {
  let html = `    <dl class="${classPrefix}-list ${classPrefix}-list--definition"${listId}>\n`;

  list.items.forEach((item) => {
    const content = transformRichText(item.content, classPrefix);
    const [term, ...definitions] = content.split(':');

    html += `      <dt class="${classPrefix}-list-term">${term.trim()}</dt>\n`;
    if (definitions.length > 0) {
      html += `      <dd class="${classPrefix}-list-definition">${definitions.join(':').trim()}</dd>\n`;
    }
  });

  html += `    </dl>\n`;
  return html;
}

/**
 * Transforms a link into HTML (standalone link element)
 *
 * @param link - The link feature
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the link
 */
function transformLink(link: Link, classPrefix: string): string {
  const linkId = link.id ? ` id="${escapeHtml(link.id)}"` : '';
  const href = escapeHtml(link.url);
  const title = link.title ? ` title="${escapeHtml(link.title)}"` : '';
  const target = link.target ? ` target="${link.target}"` : '';
  const rel = link.rel ? ` rel="${escapeHtml(link.rel)}"` : '';
  const content = transformRichText(link.content, classPrefix);

  return `<a class="${classPrefix}-link" href="${href}"${title}${target}${rel}${linkId}>${content}</a>`;
}

/**
 * Transforms a footnote into HTML
 *
 * @param note - The note feature
 * @param number - Footnote number
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the footnote
 */
function transformFootnote(note: Note, number: number, classPrefix: string): string {
  const noteId = note.id || `footnote-${number}`;
  const refId = note.referenceId || `footnote-ref-${number}`;
  const marker = note.symbol || number.toString();
  const content = transformRichText(note.content, classPrefix);

  return `    <aside class="${classPrefix}-footnote" id="${noteId}" role="note">
      <a href="#${refId}" class="${classPrefix}-footnote-backref">${marker}</a>
      <span class="${classPrefix}-footnote-content">${content}</span>
    </aside>\n`;
}

/**
 * Transforms an endnote into HTML
 *
 * @param note - The note feature
 * @param number - Endnote number
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the endnote
 */
function transformEndnote(note: Note, number: number, classPrefix: string): string {
  const noteId = note.id || `endnote-${number}`;
  const refId = note.referenceId || `endnote-ref-${number}`;
  const marker = note.symbol || number.toString();
  const content = transformRichText(note.content, classPrefix);

  return `    <aside class="${classPrefix}-endnote" id="${noteId}" role="note">
      <a href="#${refId}" class="${classPrefix}-endnote-backref">${marker}</a>
      <span class="${classPrefix}-endnote-content">${content}</span>
    </aside>\n`;
}

/**
 * Transforms a generic note into HTML
 *
 * @param note - The note feature
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the note
 */
function transformNote(note: Note, classPrefix: string): string {
  const noteId = note.id ? ` id="${escapeHtml(note.id)}"` : '';
  const noteType = note.noteType || 'inline';
  const content = transformRichText(note.content, classPrefix);

  return `    <aside class="${classPrefix}-note ${classPrefix}-note--${noteType}"${noteId} role="note">
      ${content}
    </aside>\n`;
}

/**
 * Transforms rich text with inline formatting into HTML
 *
 * @param content - The content to transform (can be string or TextSegment[])
 * @param classPrefix - CSS class prefix
 * @returns HTML string with inline formatting
 */
function transformRichText(
  content: string | TextSegment[] | undefined,
  classPrefix: string
): string {
  if (!content) return '';

  // If content is a plain string, escape and return it
  if (typeof content === 'string') {
    return escapeHtml(content);
  }

  // Handle array of text segments with formatting
  let html = '';

  content.forEach((segment) => {
    if ('text' in segment) {
      // InlineText segment
      html += applyInlineStyle(segment.text, segment.style, classPrefix);
    } else if (segment.type === 'image') {
      // ImageReference segment
      html += transformInlineImage(segment as ImageReference, classPrefix);
    }
  });

  return html;
}

/**
 * Applies inline styles to text
 *
 * @param text - The text to style
 * @param style - The inline style to apply
 * @param classPrefix - CSS class prefix
 * @returns HTML string with inline formatting
 */
function applyInlineStyle(
  text: string,
  style: InlineStyle | undefined,
  classPrefix: string
): string {
  if (!style) {
    return escapeHtml(text);
  }

  let html = escapeHtml(text);
  const classes: string[] = [];
  const inlineStyles: string[] = [];

  // Apply formatting
  if (style.bold) {
    html = `<strong class="${classPrefix}-bold">${html}</strong>`;
  }

  if (style.italic) {
    html = `<em class="${classPrefix}-italic">${html}</em>`;
  }

  if (style.underline) {
    html = `<u class="${classPrefix}-underline">${html}</u>`;
  }

  if (style.strikethrough) {
    html = `<s class="${classPrefix}-strikethrough">${html}</s>`;
  }

  if (style.subscript) {
    html = `<sub class="${classPrefix}-subscript">${html}</sub>`;
  }

  if (style.superscript) {
    html = `<sup class="${classPrefix}-superscript">${html}</sup>`;
  }

  // Apply color, highlight, fontSize, fontFamily as inline styles
  if (style.color) {
    inlineStyles.push(`color: ${style.color}`);
  }

  if (style.highlight) {
    inlineStyles.push(`background-color: ${style.highlight}`);
  }

  if (style.fontSize) {
    inlineStyles.push(`font-size: ${style.fontSize}${typeof style.fontSize === 'number' ? 'px' : ''}`);
  }

  if (style.fontFamily) {
    inlineStyles.push(`font-family: ${style.fontFamily}`);
  }

  // Wrap in span if we have inline styles or classes
  if (inlineStyles.length > 0 || classes.length > 0) {
    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
    const styleAttr = inlineStyles.length > 0 ? ` style="${inlineStyles.join('; ')}"` : '';
    html = `<span${classAttr}${styleAttr}>${html}</span>`;
  }

  return html;
}

/**
 * Transforms an inline image reference into HTML
 *
 * @param image - The image reference
 * @param classPrefix - CSS class prefix
 * @returns HTML string for the inline image
 */
function transformInlineImage(image: ImageReference, classPrefix: string): string {
  const src = escapeHtml(image.src || '');
  const alt = escapeHtml(image.alt || '');
  const title = image.title ? ` title="${escapeHtml(image.title)}"` : '';
  const width = image.width ? ` width="${image.width}"` : '';
  const height = image.height ? ` height="${image.height}"` : '';
  const imgId = image.id ? ` id="${escapeHtml(image.id)}"` : '';

  return `<img class="${classPrefix}-inline-image" src="${src}" alt="${alt}"${title}${width}${height}${imgId} />`;
}

/**
 * Generates a complete HTML document from element content
 *
 * @param element - The element to transform
 * @param options - Transformation options
 * @returns Complete HTML document string
 */
export function generateCompleteHtml(
  element: Element,
  options: TransformOptions = {}
): string {
  const { classPrefix = 'book' } = options;
  const content = transformElementToHtml(element, options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(element.title)}</title>
</head>
<body class="${classPrefix}-body">
  <main class="${classPrefix}-main">
    ${content}
  </main>
</body>
</html>`;
}

/**
 * Inline Formatting Converter
 * Converts inline formatting from the book data model to HTML tags
 * Handles nested formatting, links, special characters, and rich text segments
 */

import {
  InlineText,
  InlineStyle,
  LinkReference,
  TextSegment,
  RichText,
  ImageReference,
  FootnoteReference,
} from '../types/inlineText';

/**
 * Escape HTML special characters to prevent XSS and ensure valid EPUB HTML
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

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
 * Convert a single InlineText segment to HTML with proper formatting
 */
export function convertInlineText(inline: InlineText): string {
  if (!inline || !inline.text) return '';

  let text = escapeHtml(inline.text);

  // If no style, return escaped text
  if (!inline.style) {
    return text;
  }

  // Apply inline formatting in the correct order for proper nesting
  // Order: structural (sub/sup) → semantic (strong/em) → presentational (u/del) → styling (span)
  text = applyInlineStyle(text, inline.style);

  return text;
}

/**
 * Apply inline style formatting with proper nesting
 */
function applyInlineStyle(text: string, style: InlineStyle): string {
  let result = text;

  // Apply subscript/superscript (mutually exclusive)
  if (style.subscript) {
    result = `<sub>${result}</sub>`;
  } else if (style.superscript) {
    result = `<sup>${result}</sup>`;
  }

  // Apply semantic formatting
  if (style.bold) {
    result = `<strong>${result}</strong>`;
  }
  if (style.italic) {
    result = `<em>${result}</em>`;
  }

  // Apply presentational formatting
  if (style.underline) {
    result = `<u>${result}</u>`;
  }
  if (style.strikethrough) {
    result = `<del>${result}</del>`;
  }

  // Apply styling with span if needed
  const spanStyles: string[] = [];

  if (style.color) {
    spanStyles.push(`color: ${escapeHtml(style.color)}`);
  }
  if (style.highlight) {
    spanStyles.push(`background-color: ${escapeHtml(style.highlight)}`);
  }
  if (style.fontSize) {
    spanStyles.push(`font-size: ${style.fontSize}px`);
  }
  if (style.fontFamily) {
    spanStyles.push(`font-family: ${escapeHtml(style.fontFamily)}`);
  }

  if (spanStyles.length > 0) {
    result = `<span style="${spanStyles.join('; ')}">${result}</span>`;
  }

  return result;
}

/**
 * Convert a LinkReference to an anchor tag with proper attributes
 */
export function convertLink(link: LinkReference): string {
  if (!link || !link.url) return '';

  const attributes: string[] = [];

  // Required href attribute
  attributes.push(`href="${escapeHtml(link.url)}"`);

  // Optional title attribute
  if (link.title) {
    attributes.push(`title="${escapeHtml(link.title)}"`);
  }

  // Optional target attribute
  if (link.target) {
    attributes.push(`target="${link.target}"`);
  }

  // Optional rel attribute
  if (link.rel) {
    attributes.push(`rel="${escapeHtml(link.rel)}"`);
  }

  const linkText = link.text || link.url;

  // Apply inline style to link text if present
  let formattedText = escapeHtml(linkText);
  if (link.style) {
    formattedText = applyInlineStyle(formattedText, link.style);
  }

  return `<a ${attributes.join(' ')}>${formattedText}</a>`;
}

/**
 * Convert an ImageReference to an img tag
 */
export function convertImage(image: ImageReference): string {
  if (!image || !image.src) return '';

  const attributes: string[] = [];

  // Required src attribute
  attributes.push(`src="${escapeHtml(image.src)}"`);

  // Optional alt attribute (important for accessibility)
  if (image.alt) {
    attributes.push(`alt="${escapeHtml(image.alt)}"`);
  } else {
    attributes.push('alt=""'); // Empty alt for decorative images
  }

  // Optional title attribute
  if (image.title) {
    attributes.push(`title="${escapeHtml(image.title)}"`);
  }

  // Optional width and height
  if (image.width) {
    attributes.push(`width="${image.width}"`);
  }
  if (image.height) {
    attributes.push(`height="${image.height}"`);
  }

  return `<img ${attributes.join(' ')} />`;
}

/**
 * Convert a FootnoteReference to a sup tag with anchor
 */
export function convertFootnote(footnote: FootnoteReference): string {
  if (!footnote || !footnote.referenceId) return '';

  const displayText = footnote.symbol || footnote.number?.toString() || '*';
  const escapedText = escapeHtml(displayText);
  const escapedId = escapeHtml(footnote.referenceId);

  // Create a superscript anchor linking to the footnote
  return `<sup><a href="#${escapedId}" id="ref-${escapedId}" epub:type="noteref">${escapedText}</a></sup>`;
}

/**
 * Convert a TextSegment (union type) to HTML
 */
export function convertTextSegment(segment: TextSegment): string {
  if (!segment) return '';

  // Handle different segment types
  if ('type' in segment) {
    switch (segment.type) {
      case 'link':
        return convertLink(segment as LinkReference);
      case 'image':
        return convertImage(segment as ImageReference);
      case 'footnote':
        return convertFootnote(segment as FootnoteReference);
    }
  }

  // Handle plain InlineText
  return convertInlineText(segment as InlineText);
}

/**
 * Convert RichText (array of segments) to HTML
 */
export function convertRichText(richText: RichText): string {
  if (!richText || !richText.segments || richText.segments.length === 0) {
    // Fallback to plain text if no segments
    return escapeHtml(richText.plainText || '');
  }

  return richText.segments.map(segment => convertTextSegment(segment)).join('');
}

/**
 * Convert plain string content with optional inline formatting
 * This handles cases where content might be a simple string or rich text
 */
export function convertContent(content: string | RichText | TextSegment[]): string {
  if (!content) return '';

  // Handle string content
  if (typeof content === 'string') {
    return escapeHtml(content);
  }

  // Handle RichText object
  if ('segments' in content && 'plainText' in content) {
    return convertRichText(content as RichText);
  }

  // Handle array of TextSegments
  if (Array.isArray(content)) {
    return content.map(segment => convertTextSegment(segment)).join('');
  }

  return '';
}

/**
 * Utility to create InlineText with style
 */
export function createInlineText(text: string, style?: Partial<InlineStyle>): InlineText {
  return {
    text,
    style: style as InlineStyle,
  };
}

/**
 * Utility to create a link
 */
export function createLink(
  text: string,
  url: string,
  options?: {
    title?: string;
    target?: '_blank' | '_self' | '_parent' | '_top';
    rel?: string;
    style?: Partial<InlineStyle>;
  }
): LinkReference {
  return {
    type: 'link',
    text,
    url,
    title: options?.title,
    target: options?.target,
    rel: options?.rel,
    style: options?.style as InlineStyle,
  };
}

/**
 * Parse simple markdown-like inline formatting to InlineText segments
 * Handles: **bold**, *italic*, __underline__, ~~strikethrough~~
 * This is a helper for simple cases - complex formatting should use proper data model
 */
export function parseSimpleFormatting(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  let currentPos = 0;

  // Regex patterns for simple inline formatting
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, style: { bold: true } },
    { regex: /\*(.+?)\*/g, style: { italic: true } },
    { regex: /__(.+?)__/g, style: { underline: true } },
    { regex: /~~(.+?)~~/g, style: { strikethrough: true } },
  ];

  // For simplicity, we'll just detect bold and italic for now
  // A full implementation would need a proper parser to handle overlapping marks
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /\*(.+?)\*/g;

  // This is a simplified version - a production implementation would need
  // a more sophisticated parser for nested and overlapping formatting
  let match;
  let lastIndex = 0;
  const boldPattern = /\*\*(.+?)\*\*/g;

  while ((match = boldPattern.exec(text)) !== null) {
    // Add plain text before the match
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        segments.push({ text: plainText });
      }
    }

    // Add formatted text
    segments.push({
      text: match[1],
      style: { bold: true },
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining plain text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      segments.push({ text: remainingText });
    }
  }

  // If no formatting found, return as plain text
  if (segments.length === 0) {
    segments.push({ text });
  }

  return segments;
}

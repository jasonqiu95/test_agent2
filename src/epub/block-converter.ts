/**
 * Block Element Converter for EPUB
 * Converts block-level HTML elements to EPUB-compatible format
 * Handles paragraphs, headings, blockquotes, lists, and verse formatting
 */

/**
 * Converter options for block elements
 */
export interface BlockConverterOptions {
  preserveClasses?: boolean;
  preserveIds?: boolean;
  sanitizeHtml?: boolean;
  indentationLevel?: number;
  customAttributes?: Record<string, string>;
}

/**
 * Result of block element conversion
 */
export interface ConversionResult {
  html: string;
  warnings?: string[];
  metadata?: {
    elementType: string;
    nestingLevel?: number;
    itemCount?: number;
  };
}

/**
 * Attributes for HTML elements
 */
interface ElementAttributes {
  id?: string;
  class?: string;
  style?: string;
  [key: string]: string | undefined;
}

/**
 * Sanitizes and formats HTML attributes
 */
function formatAttributes(
  attrs: ElementAttributes,
  options: BlockConverterOptions = {}
): string {
  const parts: string[] = [];

  if (options.preserveIds && attrs.id) {
    parts.push(`id="${escapeHtml(attrs.id)}"`);
  }

  if (options.preserveClasses && attrs.class) {
    parts.push(`class="${escapeHtml(attrs.class)}"`);
  }

  if (attrs.style) {
    parts.push(`style="${escapeHtml(attrs.style)}"`);
  }

  // Add custom attributes
  if (options.customAttributes) {
    for (const [key, value] of Object.entries(options.customAttributes)) {
      if (key !== 'id' && key !== 'class' && key !== 'style') {
        parts.push(`${key}="${escapeHtml(value)}"`);
      }
    }
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Converts a paragraph element
 */
export function convertParagraph(
  content: string,
  attrs: ElementAttributes = {},
  options: BlockConverterOptions = {}
): ConversionResult {
  const formattedAttrs = formatAttributes(attrs, options);
  const sanitizedContent = options.sanitizeHtml ? escapeHtml(content) : content;

  return {
    html: `<p${formattedAttrs}>${sanitizedContent}</p>`,
    metadata: {
      elementType: 'paragraph',
    },
  };
}

/**
 * Converts a heading element (h1-h6)
 */
export function convertHeading(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  content: string,
  attrs: ElementAttributes = {},
  options: BlockConverterOptions = {}
): ConversionResult {
  if (level < 1 || level > 6) {
    return {
      html: '',
      warnings: [`Invalid heading level: ${level}. Must be between 1 and 6.`],
      metadata: {
        elementType: 'heading',
      },
    };
  }

  const formattedAttrs = formatAttributes(attrs, options);
  const sanitizedContent = options.sanitizeHtml ? escapeHtml(content) : content;

  return {
    html: `<h${level}${formattedAttrs}>${sanitizedContent}</h${level}>`,
    metadata: {
      elementType: `heading-${level}`,
      nestingLevel: level,
    },
  };
}

/**
 * Converts a blockquote element
 */
export function convertBlockquote(
  content: string,
  attrs: ElementAttributes = {},
  options: BlockConverterOptions = {}
): ConversionResult {
  const formattedAttrs = formatAttributes(attrs, options);
  const sanitizedContent = options.sanitizeHtml ? escapeHtml(content) : content;

  return {
    html: `<blockquote${formattedAttrs}>${sanitizedContent}</blockquote>`,
    metadata: {
      elementType: 'blockquote',
    },
  };
}

/**
 * Converts an unordered list
 */
export function convertUnorderedList(
  items: string[],
  attrs: ElementAttributes = {},
  options: BlockConverterOptions = {}
): ConversionResult {
  if (!items || items.length === 0) {
    return {
      html: '',
      warnings: ['Empty list provided'],
      metadata: {
        elementType: 'ul',
        itemCount: 0,
      },
    };
  }

  const formattedAttrs = formatAttributes(attrs, options);
  const listItems = items
    .map((item) => {
      const sanitizedItem = options.sanitizeHtml ? escapeHtml(item) : item;
      return `<li>${sanitizedItem}</li>`;
    })
    .join('\n');

  return {
    html: `<ul${formattedAttrs}>\n${listItems}\n</ul>`,
    metadata: {
      elementType: 'ul',
      itemCount: items.length,
    },
  };
}

/**
 * Converts an ordered list
 */
export function convertOrderedList(
  items: string[],
  attrs: ElementAttributes = {},
  options: BlockConverterOptions = {}
): ConversionResult {
  if (!items || items.length === 0) {
    return {
      html: '',
      warnings: ['Empty list provided'],
      metadata: {
        elementType: 'ol',
        itemCount: 0,
      },
    };
  }

  const formattedAttrs = formatAttributes(attrs, options);
  const listItems = items
    .map((item) => {
      const sanitizedItem = options.sanitizeHtml ? escapeHtml(item) : item;
      return `<li>${sanitizedItem}</li>`;
    })
    .join('\n');

  return {
    html: `<ol${formattedAttrs}>\n${listItems}\n</ol>`,
    metadata: {
      elementType: 'ol',
      itemCount: items.length,
    },
  };
}

/**
 * Converts a list item with nested content
 */
export function convertListItem(
  content: string,
  attrs: ElementAttributes = {},
  options: BlockConverterOptions = {},
  nestedList?: string
): ConversionResult {
  const formattedAttrs = formatAttributes(attrs, options);
  const sanitizedContent = options.sanitizeHtml ? escapeHtml(content) : content;

  let html = `<li${formattedAttrs}>${sanitizedContent}`;
  if (nestedList) {
    html += `\n${nestedList}`;
  }
  html += '</li>';

  return {
    html,
    metadata: {
      elementType: 'li',
    },
  };
}

/**
 * Converts nested lists (supports arbitrary nesting depth)
 */
export function convertNestedList(
  items: Array<{
    content: string;
    children?: Array<{ content: string; children?: any }>;
    ordered?: boolean;
  }>,
  ordered: boolean = false,
  attrs: ElementAttributes = {},
  options: BlockConverterOptions = {},
  depth: number = 0
): ConversionResult {
  const warnings: string[] = [];
  const maxDepth = 10; // Prevent infinite recursion

  if (depth > maxDepth) {
    return {
      html: '',
      warnings: [`Maximum nesting depth (${maxDepth}) exceeded`],
      metadata: {
        elementType: ordered ? 'ol' : 'ul',
        nestingLevel: depth,
      },
    };
  }

  if (!items || items.length === 0) {
    return {
      html: '',
      warnings: ['Empty list provided'],
      metadata: {
        elementType: ordered ? 'ol' : 'ul',
        itemCount: 0,
        nestingLevel: depth,
      },
    };
  }

  const listType = ordered ? 'ol' : 'ul';
  const formattedAttrs = formatAttributes(attrs, options);

  const listItems = items.map((item) => {
    const sanitizedContent = options.sanitizeHtml
      ? escapeHtml(item.content)
      : item.content;

    let html = `<li>${sanitizedContent}`;

    if (item.children && item.children.length > 0) {
      const nestedResult = convertNestedList(
        item.children,
        item.ordered ?? ordered,
        {},
        options,
        depth + 1
      );
      html += `\n${nestedResult.html}`;
      if (nestedResult.warnings) {
        warnings.push(...nestedResult.warnings);
      }
    }

    html += '</li>';
    return html;
  });

  return {
    html: `<${listType}${formattedAttrs}>\n${listItems.join('\n')}\n</${listType}>`,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      elementType: listType,
      itemCount: items.length,
      nestingLevel: depth,
    },
  };
}

/**
 * Converts verse/poetry formatting
 */
export function convertVerse(
  lines: string[],
  attrs: ElementAttributes = {},
  options: BlockConverterOptions = {}
): ConversionResult {
  if (!lines || lines.length === 0) {
    return {
      html: '',
      warnings: ['No verse lines provided'],
      metadata: {
        elementType: 'verse',
      },
    };
  }

  // Ensure 'verse' class is included
  const verseClass = attrs.class ? `${attrs.class} verse` : 'verse';
  const verseAttrs = { ...attrs, class: verseClass };
  const formattedAttrs = formatAttributes(verseAttrs, {
    ...options,
    preserveClasses: true,
  });

  const verseLines = lines
    .map((line) => {
      const sanitizedLine = options.sanitizeHtml ? escapeHtml(line) : line;
      // Use line breaks to preserve verse structure
      return (sanitizedLine || '&#160;') + '<br/>'; // Use non-breaking space for empty lines
    })
    .join('\n');

  return {
    html: `<div${formattedAttrs}>\n${verseLines}\n</div>`,
    metadata: {
      elementType: 'verse',
      itemCount: lines.length,
    },
  };
}

/**
 * Converts verse with stanzas (groups of lines)
 */
export function convertVerseWithStanzas(
  stanzas: string[][],
  attrs: ElementAttributes = {},
  options: BlockConverterOptions = {}
): ConversionResult {
  if (!stanzas || stanzas.length === 0) {
    return {
      html: '',
      warnings: ['No stanzas provided'],
      metadata: {
        elementType: 'verse',
      },
    };
  }

  const verseClass = attrs.class ? `${attrs.class} verse` : 'verse';
  const verseAttrs = { ...attrs, class: verseClass };
  const formattedAttrs = formatAttributes(verseAttrs, {
    ...options,
    preserveClasses: true,
  });

  const stanzaHtml = stanzas
    .map((stanza) => {
      const lines = stanza
        .map((line) => {
          const sanitizedLine = options.sanitizeHtml ? escapeHtml(line) : line;
          return sanitizedLine || '&#160;';
        })
        .join('<br/>\n');
      return `<div class="stanza">\n${lines}\n</div>`;
    })
    .join('\n\n');

  return {
    html: `<div${formattedAttrs}>\n${stanzaHtml}\n</div>`,
    metadata: {
      elementType: 'verse',
      itemCount: stanzas.reduce((sum, stanza) => sum + stanza.length, 0),
    },
  };
}

/**
 * Batch converts multiple block elements
 */
export function convertBlockElements(
  elements: Array<{
    type:
      | 'p'
      | 'h1'
      | 'h2'
      | 'h3'
      | 'h4'
      | 'h5'
      | 'h6'
      | 'blockquote'
      | 'ul'
      | 'ol'
      | 'verse';
    content: string | string[];
    attrs?: ElementAttributes;
  }>,
  options: BlockConverterOptions = {}
): ConversionResult {
  const htmlParts: string[] = [];
  const warnings: string[] = [];

  for (const element of elements) {
    let result: ConversionResult;

    switch (element.type) {
      case 'p':
        result = convertParagraph(
          element.content as string,
          element.attrs,
          options
        );
        break;

      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        const level = parseInt(element.type.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6;
        result = convertHeading(
          level,
          element.content as string,
          element.attrs,
          options
        );
        break;

      case 'blockquote':
        result = convertBlockquote(
          element.content as string,
          element.attrs,
          options
        );
        break;

      case 'ul':
        result = convertUnorderedList(
          element.content as string[],
          element.attrs,
          options
        );
        break;

      case 'ol':
        result = convertOrderedList(
          element.content as string[],
          element.attrs,
          options
        );
        break;

      case 'verse':
        result = convertVerse(
          element.content as string[],
          element.attrs,
          options
        );
        break;

      default:
        result = {
          html: '',
          warnings: [`Unknown element type: ${element.type}`],
          metadata: {
            elementType: 'unknown',
          },
        };
    }

    if (result.html) {
      htmlParts.push(result.html);
    }

    if (result.warnings) {
      warnings.push(...result.warnings);
    }
  }

  return {
    html: htmlParts.join('\n\n'),
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      elementType: 'batch',
      itemCount: elements.length,
    },
  };
}

/**
 * Validates block element structure
 */
export function validateBlockElement(
  html: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Normalize whitespace for validation
  const normalizedHtml = html.replace(/\s+/g, ' ').trim();

  // Check for properly closed tags
  const openTags = normalizedHtml.match(/<(p|h[1-6]|blockquote|ul|ol|li|div)\b[^>]*>/g) || [];
  const closeTags = normalizedHtml.match(/<\/(p|h[1-6]|blockquote|ul|ol|li|div)>/g) || [];

  if (openTags.length !== closeTags.length) {
    errors.push('Mismatched opening and closing tags');
  }

  // Check for valid nesting (lists must contain only li elements as direct children)
  // This regex checks if there's text content after <ul> or <ol> that's not a tag
  // It looks for list tags followed by text that's not just whitespace or another tag
  const invalidListNesting = /<(ul|ol)[^>]*>\s*(?!<)[a-zA-Z0-9]/;
  if (invalidListNesting.test(normalizedHtml)) {
    errors.push('Invalid list nesting: lists must contain only <li> elements');
  }

  // Check for self-closing block elements (not valid in EPUB)
  const selfClosingBlocks = /<(p|h[1-6]|blockquote|ul|ol|li|div)\s*\/>/g;
  if (selfClosingBlocks.test(normalizedHtml)) {
    errors.push('Self-closing block elements are not valid');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extracts text content from block HTML
 */
export function extractTextContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;|&#160;/g, ' ') // Replace non-breaking spaces
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

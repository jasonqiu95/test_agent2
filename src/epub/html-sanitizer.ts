/**
 * HTML Sanitization Utility
 *
 * Provides comprehensive HTML sanitization for EPUB generation:
 * - Removes dangerous tags and attributes
 * - Encodes special characters properly
 * - Validates HTML structure
 * - Cleans up malformed HTML
 */

/**
 * Configuration options for HTML sanitization
 */
export interface SanitizationOptions {
  /**
   * Allow custom tags beyond the default safe list
   */
  allowedTags?: string[];

  /**
   * Allow custom attributes beyond the default safe list
   */
  allowedAttributes?: Record<string, string[]>;

  /**
   * Allow data attributes (data-*)
   */
  allowDataAttributes?: boolean;

  /**
   * Allow inline styles
   */
  allowStyles?: boolean;

  /**
   * Allow custom URL protocols beyond http/https
   */
  allowedProtocols?: string[];

  /**
   * Strip all HTML tags and return plain text
   */
  stripAll?: boolean;

  /**
   * Keep comments in the HTML
   */
  keepComments?: boolean;
}

/**
 * Result of sanitization with metadata
 */
export interface SanitizationResult {
  /**
   * Sanitized HTML string
   */
  html: string;

  /**
   * Whether any content was modified
   */
  modified: boolean;

  /**
   * List of removed tags
   */
  removedTags: string[];

  /**
   * List of removed attributes
   */
  removedAttributes: string[];

  /**
   * List of warnings encountered
   */
  warnings: string[];
}

/**
 * Default safe HTML tags for EPUB content
 */
const DEFAULT_SAFE_TAGS = new Set([
  // Structure
  'div', 'span', 'p', 'br', 'hr',

  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',

  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',

  // Text formatting
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
  'sub', 'sup', 'small', 'mark', 'code', 'pre',

  // Semantic
  'blockquote', 'q', 'cite', 'abbr', 'dfn',
  'time', 'address', 'figure', 'figcaption',

  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'caption', 'col', 'colgroup',

  // Links and media
  'a', 'img',

  // EPUB-specific
  'section', 'article', 'nav', 'aside', 'header', 'footer',
  'main', 'details', 'summary',
]);

/**
 * Default safe attributes per tag
 */
const DEFAULT_SAFE_ATTRIBUTES: Record<string, Set<string>> = {
  '*': new Set(['id', 'class', 'title', 'lang', 'dir']),
  'a': new Set(['href', 'target', 'rel', 'name']),
  'img': new Set(['src', 'alt', 'width', 'height', 'loading']),
  'table': new Set(['border', 'cellpadding', 'cellspacing']),
  'td': new Set(['colspan', 'rowspan', 'align', 'valign']),
  'th': new Set(['colspan', 'rowspan', 'align', 'valign', 'scope']),
  'col': new Set(['span', 'width']),
  'colgroup': new Set(['span', 'width']),
  'time': new Set(['datetime']),
  'blockquote': new Set(['cite']),
  'q': new Set(['cite']),
  'del': new Set(['cite', 'datetime']),
  'ins': new Set(['cite', 'datetime']),
  'abbr': new Set(['title']),
};

/**
 * Safe URL protocols
 */
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:', '#']);

/**
 * Dangerous attributes that should always be removed
 */
const DANGEROUS_ATTRIBUTES = new Set([
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
  'onmouseenter', 'onmouseleave', 'onfocus', 'onblur', 'onchange',
  'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress',
]);

/**
 * HTML Sanitizer class
 */
export class HtmlSanitizer {
  private options: Required<SanitizationOptions>;
  private allowedTags: Set<string>;
  private allowedAttributes: Map<string, Set<string>>;
  private allowedProtocols: Set<string>;
  private removedTags: Set<string> = new Set();
  private removedAttributes: Set<string> = new Set();
  private warnings: string[] = [];

  constructor(options: SanitizationOptions = {}) {
    this.options = {
      allowedTags: options.allowedTags || [],
      allowedAttributes: options.allowedAttributes || {},
      allowDataAttributes: options.allowDataAttributes ?? false,
      allowStyles: options.allowStyles ?? false,
      allowedProtocols: options.allowedProtocols || [],
      stripAll: options.stripAll ?? false,
      keepComments: options.keepComments ?? false,
    };

    // Build allowed tags set
    this.allowedTags = new Set([
      ...DEFAULT_SAFE_TAGS,
      ...this.options.allowedTags,
    ]);

    // Build allowed attributes map
    this.allowedAttributes = new Map();
    for (const [tag, attrs] of Object.entries(DEFAULT_SAFE_ATTRIBUTES)) {
      this.allowedAttributes.set(tag, new Set(attrs));
    }
    for (const [tag, attrs] of Object.entries(this.options.allowedAttributes)) {
      const existing = this.allowedAttributes.get(tag) || new Set();
      this.allowedAttributes.set(tag, new Set([...existing, ...attrs]));
    }

    // Build allowed protocols set
    this.allowedProtocols = new Set([
      ...SAFE_PROTOCOLS,
      ...this.options.allowedProtocols,
    ]);

    // Add style to allowed attributes if enabled
    if (this.options.allowStyles) {
      const globalAttrs = this.allowedAttributes.get('*') || new Set();
      globalAttrs.add('style');
      this.allowedAttributes.set('*', globalAttrs);
    }
  }

  /**
   * Sanitize HTML string
   */
  sanitize(html: string): SanitizationResult {
    // Reset tracking
    this.removedTags.clear();
    this.removedAttributes.clear();
    this.warnings = [];

    if (!html || typeof html !== 'string') {
      return {
        html: '',
        modified: false,
        removedTags: [],
        removedAttributes: [],
        warnings: ['Input was not a valid string'],
      };
    }

    // Strip all tags if requested
    if (this.options.stripAll) {
      return {
        html: this.stripAllTags(html),
        modified: true,
        removedTags: ['all'],
        removedAttributes: ['all'],
        warnings: [],
      };
    }

    try {
      // Create a temporary container element
      // This approach works in both browser and jsdom environments
      const container = document.createElement('div');
      container.innerHTML = html;

      // Sanitize the container
      this.sanitizeNode(container);

      // Serialize back to HTML
      const serialized = container.innerHTML;

      return {
        html: serialized,
        modified: this.removedTags.size > 0 || this.removedAttributes.size > 0,
        removedTags: Array.from(this.removedTags),
        removedAttributes: Array.from(this.removedAttributes),
        warnings: this.warnings,
      };
    } catch (error) {
      this.warnings.push(`Sanitization error: ${error instanceof Error ? error.message : String(error)}`);

      // Fallback: encode everything
      return {
        html: this.encodeHtml(html),
        modified: true,
        removedTags: ['all'],
        removedAttributes: ['all'],
        warnings: this.warnings,
      };
    }
  }

  /**
   * Sanitize a DOM node recursively
   */
  private sanitizeNode(node: Node): void {
    // Handle different node types
    if (node.nodeType === Node.ELEMENT_NODE) {
      this.sanitizeElement(node as Element);
    } else if (node.nodeType === Node.COMMENT_NODE && !this.options.keepComments) {
      node.parentNode?.removeChild(node);
    }

    // Process children (iterate backwards to safely remove nodes)
    const children = Array.from(node.childNodes);
    for (const child of children) {
      this.sanitizeNode(child);
    }
  }

  /**
   * Sanitize an element
   */
  private sanitizeElement(element: Element): void {
    const tagName = element.tagName.toLowerCase();

    // Remove dangerous tags
    if (!this.allowedTags.has(tagName)) {
      this.removedTags.add(tagName);

      // For dangerous tags like script, style, etc., remove entirely including content
      const dangerousTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'base']);

      if (dangerousTags.has(tagName)) {
        // Remove the entire element including its content
        element.parentNode?.removeChild(element);
      } else {
        // For other non-allowed tags, preserve content but remove the tag
        while (element.firstChild) {
          element.parentNode?.insertBefore(element.firstChild, element);
        }
        element.parentNode?.removeChild(element);
      }
      return;
    }

    // Sanitize attributes
    this.sanitizeAttributes(element);
  }

  /**
   * Sanitize element attributes
   */
  private sanitizeAttributes(element: Element): void {
    const tagName = element.tagName.toLowerCase();
    const attributes = Array.from(element.attributes);

    for (const attr of attributes) {
      const attrName = attr.name.toLowerCase();

      // Always remove dangerous event handlers
      if (DANGEROUS_ATTRIBUTES.has(attrName) || attrName.startsWith('on')) {
        this.removedAttributes.add(attrName);
        element.removeAttribute(attr.name);
        continue;
      }

      // Check if attribute is allowed
      const isAllowed = this.isAttributeAllowed(tagName, attrName);

      if (!isAllowed) {
        this.removedAttributes.add(attrName);
        element.removeAttribute(attr.name);
        continue;
      }

      // Validate URL attributes
      if (attrName === 'href' || attrName === 'src') {
        if (!this.isUrlSafe(attr.value)) {
          this.removedAttributes.add(`${attrName}[unsafe-url]`);
          element.removeAttribute(attr.name);
          this.warnings.push(`Removed unsafe URL: ${attr.value}`);
        }
      }

      // Sanitize style attribute
      if (attrName === 'style' && this.options.allowStyles) {
        const sanitizedStyle = this.sanitizeStyle(attr.value);
        if (sanitizedStyle !== attr.value) {
          element.setAttribute('style', sanitizedStyle);
        }
      }
    }
  }

  /**
   * Check if an attribute is allowed for a tag
   */
  private isAttributeAllowed(tagName: string, attrName: string): boolean {
    // Check data attributes
    if (attrName.startsWith('data-')) {
      return this.options.allowDataAttributes;
    }

    // Check tag-specific attributes
    const tagAttrs = this.allowedAttributes.get(tagName);
    if (tagAttrs?.has(attrName)) {
      return true;
    }

    // Check global attributes
    const globalAttrs = this.allowedAttributes.get('*');
    return globalAttrs?.has(attrName) ?? false;
  }

  /**
   * Validate URL safety
   */
  private isUrlSafe(url: string): boolean {
    if (!url) {
      return true; // Empty URLs are safe (will just be removed)
    }

    try {
      // Handle relative URLs
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return true;
      }

      // Handle fragment URLs
      if (url.startsWith('#')) {
        return true;
      }

      // Parse absolute URLs
      const parsed = new URL(url, 'http://example.com');
      return this.allowedProtocols.has(parsed.protocol);
    } catch {
      // If URL parsing fails, it might be a relative URL or invalid
      // Allow it if it doesn't look like javascript:
      return !url.toLowerCase().includes('javascript:') &&
             !url.toLowerCase().includes('data:') &&
             !url.toLowerCase().includes('vbscript:');
    }
  }

  /**
   * Sanitize CSS style attribute
   */
  private sanitizeStyle(style: string): string {
    // Remove dangerous CSS properties
    const dangerous = [
      'behavior', 'expression', 'moz-binding',
      '-o-link', '-o-link-source', '-o-replace',
    ];

    let sanitized = style;
    for (const prop of dangerous) {
      const regex = new RegExp(`${prop}\\s*:`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }

    // Remove url() with javascript: or data:
    sanitized = sanitized.replace(
      /url\s*\(\s*['"]?(javascript|data):/gi,
      'url(about:blank'
    );

    return sanitized;
  }

  /**
   * Strip all HTML tags
   */
  private stripAllTags(html: string): string {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.textContent || '';
  }

  /**
   * Encode HTML entities
   */
  private encodeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Convenience function to sanitize HTML with default options
 */
export function sanitizeHtml(
  html: string,
  options?: SanitizationOptions
): string {
  const sanitizer = new HtmlSanitizer(options);
  return sanitizer.sanitize(html).html;
}

/**
 * Encode special characters in text
 */
export function encodeSpecialCharacters(text: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => entities[char] || char);
}

/**
 * Decode HTML entities
 */
export function decodeHtmlEntities(text: string): string {
  const div = document.createElement('div');
  div.innerHTML = text;
  return div.textContent || '';
}

/**
 * Validate HTML structure
 */
export function validateHtmlStructure(html: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      errors.push('HTML parsing error: ' + parserError.textContent);
    }

    // Check for unclosed tags (basic check)
    const openTags: string[] = [];
    const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const tag = match[1].toLowerCase();
      const isClosing = match[0].startsWith('</');

      // Skip self-closing tags
      if (['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tag)) {
        continue;
      }

      if (isClosing) {
        if (openTags.length === 0 || openTags[openTags.length - 1] !== tag) {
          errors.push(`Unexpected closing tag: </${tag}>`);
        } else {
          openTags.pop();
        }
      } else if (!match[0].endsWith('/>')) {
        openTags.push(tag);
      }
    }

    // Check for unclosed tags
    if (openTags.length > 0) {
      errors.push(`Unclosed tags: ${openTags.join(', ')}`);
    }

  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Clean up malformed HTML
 */
export function cleanMalformedHtml(html: string): string {
  try {
    const container = document.createElement('div');
    container.innerHTML = html;

    // The browser's parser will automatically fix most issues
    return container.innerHTML;
  } catch {
    // Fallback: return original
    return html;
  }
}

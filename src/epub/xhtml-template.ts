/**
 * XHTML Template Structure for EPUB 3
 *
 * This module provides utilities for creating valid XHTML documents
 * compliant with EPUB 3 specifications.
 */

// ============================================================================
// Constants for EPUB 3 Namespaces and Attributes
// ============================================================================

/**
 * EPUB 3 namespace URIs
 */
export const EPUB_NAMESPACES = {
  XHTML: 'http://www.w3.org/1999/xhtml',
  EPUB: 'http://www.idpf.org/2007/ops',
  OPS: 'http://www.idpf.org/2007/ops',
  XML: 'http://www.w3.org/XML/1998/namespace',
} as const;

/**
 * EPUB 3 structural semantic vocabulary
 */
export const EPUB_TYPES = {
  COVER: 'cover',
  TITLE_PAGE: 'titlepage',
  TOC: 'toc',
  FRONTMATTER: 'frontmatter',
  BODYMATTER: 'bodymatter',
  BACKMATTER: 'backmatter',
  CHAPTER: 'chapter',
  PART: 'part',
  SECTION: 'section',
  PREFACE: 'preface',
  PROLOGUE: 'prologue',
  EPILOGUE: 'epilogue',
  DEDICATION: 'dedication',
  ACKNOWLEDGMENTS: 'acknowledgments',
  FOREWORD: 'foreword',
  INTRODUCTION: 'introduction',
  APPENDIX: 'appendix',
  BIBLIOGRAPHY: 'bibliography',
  GLOSSARY: 'glossary',
  INDEX: 'index',
  COLOPHON: 'colophon',
  COPYRIGHT_PAGE: 'copyright-page',
  FOOTNOTE: 'footnote',
  ENDNOTE: 'endnote',
  PAGEBREAK: 'pagebreak',
  PAGEBREAK_LIST: 'page-list',
} as const;

/**
 * DOCTYPE declaration for XHTML 1.1
 */
export const XHTML_DOCTYPE = '<!DOCTYPE html>';

/**
 * XML declaration
 */
export const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

// ============================================================================
// Utility Functions
// ============================================================================

let idCounter = 0;

/**
 * Generate a unique ID for XHTML elements
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateUniqueId(prefix: string = 'id'): string {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/**
 * Reset the ID counter (useful for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Escape XML/XHTML special characters
 * @param text - Text to escape
 * @returns Escaped text safe for XHTML
 */
export function escapeXhtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Create a namespace attribute string
 * @param prefix - Namespace prefix (e.g., 'epub')
 * @param uri - Namespace URI
 * @returns Namespace attribute string
 */
export function createNamespaceAttr(prefix: string, uri: string): string {
  return `xmlns:${prefix}="${uri}"`;
}

// ============================================================================
// XHTML Template Configuration Interface
// ============================================================================

export interface XhtmlTemplateOptions {
  /** Document title */
  title: string;
  /** Document language (e.g., 'en', 'en-US') */
  lang?: string;
  /** CSS stylesheet paths */
  stylesheets?: string[];
  /** EPUB type semantic inflection */
  epubType?: string;
  /** Additional head elements (meta tags, links, etc.) */
  headContent?: string;
  /** Body content */
  bodyContent?: string;
  /** Additional body attributes */
  bodyAttributes?: Record<string, string>;
  /** Document ID for the html element */
  docId?: string;
  /** Direction (ltr or rtl) */
  dir?: 'ltr' | 'rtl';
}

// ============================================================================
// XHTML Template Builder
// ============================================================================

/**
 * Build a complete XHTML document structure for EPUB 3
 * @param options - Configuration options for the XHTML document
 * @returns Complete XHTML document as string
 */
export function buildXhtmlDocument(options: XhtmlTemplateOptions): string {
  const {
    title,
    lang = 'en',
    stylesheets = [],
    epubType,
    headContent = '',
    bodyContent = '',
    bodyAttributes = {},
    docId,
    dir = 'ltr',
  } = options;

  // Build namespace attributes
  const namespaceAttrs = [
    `xmlns="${EPUB_NAMESPACES.XHTML}"`,
    createNamespaceAttr('epub', EPUB_NAMESPACES.EPUB),
    `xml:lang="${lang}"`,
    `lang="${lang}"`,
  ].join(' ');

  // Build stylesheet links
  const stylesheetLinks = stylesheets
    .map(href => `  <link rel="stylesheet" type="text/css" href="${escapeXhtml(href)}" />`)
    .join('\n');

  // Build body attributes
  const bodyAttrs = Object.entries(bodyAttributes)
    .map(([key, value]) => `${key}="${escapeXhtml(value)}"`)
    .join(' ');

  const epubTypeAttr = epubType ? ` epub:type="${epubType}"` : '';
  const docIdAttr = docId ? ` id="${docId}"` : '';
  const dirAttr = ` dir="${dir}"`;
  const bodyAttrString = [bodyAttrs, epubTypeAttr].filter(Boolean).join(' ');

  // Build complete XHTML document
  const xhtmlDocument = `${XML_DECLARATION}
${XHTML_DOCTYPE}
<html ${namespaceAttrs}${docIdAttr}${dirAttr}>
<head>
  <meta charset="UTF-8" />
  <title>${escapeXhtml(title)}</title>
${stylesheetLinks}${headContent ? '\n' + headContent : ''}
</head>
<body${bodyAttrString ? ' ' + bodyAttrString : ''}>
${bodyContent}
</body>
</html>`;

  return xhtmlDocument;
}

/**
 * Create a basic XHTML page structure
 * @param title - Page title
 * @param content - HTML content for the body
 * @param stylesheets - Optional array of stylesheet paths
 * @returns Complete XHTML document
 */
export function createXhtmlPage(
  title: string,
  content: string,
  stylesheets?: string[]
): string {
  return buildXhtmlDocument({
    title,
    bodyContent: content,
    stylesheets,
  });
}

/**
 * Create an XHTML chapter document
 * @param chapterTitle - Title of the chapter
 * @param content - HTML content for the chapter
 * @param chapterId - Optional unique identifier for the chapter
 * @param stylesheets - Optional array of stylesheet paths
 * @returns Complete XHTML document for the chapter
 */
export function createChapterDocument(
  chapterTitle: string,
  content: string,
  chapterId?: string,
  stylesheets?: string[]
): string {
  const wrappedContent = `  <section epub:type="${EPUB_TYPES.CHAPTER}"${chapterId ? ` id="${chapterId}"` : ''}>
    <h1>${escapeXhtml(chapterTitle)}</h1>
${content}
  </section>`;

  return buildXhtmlDocument({
    title: chapterTitle,
    bodyContent: wrappedContent,
    epubType: EPUB_TYPES.CHAPTER,
    stylesheets,
  });
}

/**
 * Create a cover page XHTML document
 * @param imageHref - Path to the cover image
 * @param altText - Alternative text for the image
 * @param stylesheets - Optional array of stylesheet paths
 * @returns Complete XHTML document for the cover page
 */
export function createCoverPage(
  imageHref: string,
  altText: string = 'Cover',
  stylesheets?: string[]
): string {
  const coverContent = `  <div id="cover-image">
    <img src="${escapeXhtml(imageHref)}" alt="${escapeXhtml(altText)}" />
  </div>`;

  return buildXhtmlDocument({
    title: 'Cover',
    bodyContent: coverContent,
    epubType: EPUB_TYPES.COVER,
    stylesheets,
  });
}

/**
 * Create a title page XHTML document
 * @param bookTitle - Title of the book
 * @param author - Author name(s)
 * @param publisher - Optional publisher name
 * @param stylesheets - Optional array of stylesheet paths
 * @returns Complete XHTML document for the title page
 */
export function createTitlePage(
  bookTitle: string,
  author: string,
  publisher?: string,
  stylesheets?: string[]
): string {
  const titleContent = `  <section epub:type="${EPUB_TYPES.TITLE_PAGE}" id="title-page">
    <h1>${escapeXhtml(bookTitle)}</h1>
    <p class="author">${escapeXhtml(author)}</p>${
    publisher ? `\n    <p class="publisher">${escapeXhtml(publisher)}</p>` : ''
  }
  </section>`;

  return buildXhtmlDocument({
    title: bookTitle,
    bodyContent: titleContent,
    epubType: EPUB_TYPES.TITLE_PAGE,
    stylesheets,
  });
}

/**
 * Validate XHTML structure for EPUB 3 compliance
 * Basic validation checks for common issues
 * @param xhtml - XHTML string to validate
 * @returns Object with validation result and any errors
 */
export function validateXhtmlStructure(xhtml: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for XML declaration
  if (!xhtml.includes(XML_DECLARATION)) {
    errors.push('Missing XML declaration');
  }

  // Check for DOCTYPE
  if (!xhtml.includes(XHTML_DOCTYPE)) {
    errors.push('Missing XHTML DOCTYPE');
  }

  // Check for XHTML namespace
  if (!xhtml.includes(EPUB_NAMESPACES.XHTML)) {
    errors.push('Missing XHTML namespace');
  }

  // Check for required html element
  if (!xhtml.includes('<html')) {
    errors.push('Missing html element');
  }

  // Check for required head element
  if (!xhtml.includes('<head>')) {
    errors.push('Missing head element');
  }

  // Check for required body element
  if (!xhtml.includes('<body')) {
    errors.push('Missing body element');
  }

  // Check for charset meta tag
  if (!xhtml.includes('charset="UTF-8"') && !xhtml.includes("charset='UTF-8'")) {
    errors.push('Missing UTF-8 charset declaration');
  }

  // Check for title element
  if (!xhtml.includes('<title>')) {
    errors.push('Missing title element');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Export default template builder
// ============================================================================

export default {
  buildXhtmlDocument,
  createXhtmlPage,
  createChapterDocument,
  createCoverPage,
  createTitlePage,
  validateXhtmlStructure,
  generateUniqueId,
  escapeXhtml,
  EPUB_NAMESPACES,
  EPUB_TYPES,
  XHTML_DOCTYPE,
  XML_DECLARATION,
};

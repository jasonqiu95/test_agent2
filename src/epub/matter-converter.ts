/**
 * Front/Back Matter XHTML Converter for EPUB 3
 *
 * Converts front matter (Title Page, Copyright, Dedication, TOC, etc.) and
 * back matter (Epilogue, About the Author, Also By, etc.) to XHTML files.
 * Handles special formatting requirements for each matter type with appropriate
 * semantic HTML and EPUB 3 epub:type attributes.
 */

import { Element, ElementType, MatterType } from '../types/element';
import { TextBlock } from '../types/textBlock';
import {
  buildXhtmlDocument,
  EPUB_TYPES,
  escapeXhtml,
  XhtmlTemplateOptions,
} from './xhtml-template';
import { convertContent, convertRichText } from './inline-converter';
import {
  convertParagraph,
  convertHeading,
  convertBlockquote,
  convertUnorderedList,
  convertOrderedList,
  ConversionResult,
  BlockConverterOptions,
} from './block-converter';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Options for matter conversion
 */
export interface MatterConverterOptions {
  /** CSS stylesheet paths to include */
  stylesheets?: string[];
  /** Language code (e.g., 'en', 'en-US') */
  lang?: string;
  /** Text direction (ltr or rtl) */
  dir?: 'ltr' | 'rtl';
  /** Whether to preserve IDs and classes from TextBlocks */
  preserveAttributes?: boolean;
  /** Whether to sanitize HTML content */
  sanitizeHtml?: boolean;
  /** Custom CSS class for the matter section */
  sectionClass?: string;
}

/**
 * Result of matter conversion
 */
export interface MatterConversionResult {
  /** Generated XHTML document */
  xhtml: string;
  /** Element type that was converted */
  elementType: ElementType;
  /** Matter type (front or back) */
  matterType: MatterType;
  /** Warnings encountered during conversion */
  warnings?: string[];
  /** Metadata about the conversion */
  metadata?: {
    blockCount: number;
    hasImages: boolean;
    hasLinks: boolean;
  };
}

// ============================================================================
// EPUB Type Mapping
// ============================================================================

/**
 * Map element types to EPUB 3 structural semantic types
 */
const ELEMENT_TYPE_TO_EPUB_TYPE: Record<ElementType, string> = {
  'title-page': EPUB_TYPES.TITLE_PAGE,
  'copyright': EPUB_TYPES.COPYRIGHT_PAGE,
  'dedication': EPUB_TYPES.DEDICATION,
  'epigraph': 'epigraph',
  'foreword': EPUB_TYPES.FOREWORD,
  'preface': EPUB_TYPES.PREFACE,
  'acknowledgments': EPUB_TYPES.ACKNOWLEDGMENTS,
  'introduction': EPUB_TYPES.INTRODUCTION,
  'prologue': EPUB_TYPES.PROLOGUE,
  'epilogue': EPUB_TYPES.EPILOGUE,
  'afterword': 'afterword',
  'appendix': EPUB_TYPES.APPENDIX,
  'glossary': EPUB_TYPES.GLOSSARY,
  'bibliography': EPUB_TYPES.BIBLIOGRAPHY,
  'index': EPUB_TYPES.INDEX,
  'about-author': 'author',
  'also-by': 'other-credits',
  'other': 'section',
};

/**
 * Get EPUB type for an element type
 */
function getEpubType(elementType: ElementType): string {
  return ELEMENT_TYPE_TO_EPUB_TYPE[elementType] || 'section';
}

// ============================================================================
// TextBlock to HTML Conversion
// ============================================================================

/**
 * Convert a TextBlock to HTML
 */
export function convertTextBlock(
  block: TextBlock,
  options: BlockConverterOptions = {}
): ConversionResult {
  const warnings: string[] = [];

  // Get content from richText or plain content
  let content: string;
  if (block.richText) {
    content = convertRichText(block.richText);
  } else {
    content = convertContent(block.content);
  }

  // Build attributes from block style and options
  const attrs: Record<string, string> = {};

  if (options.preserveIds && block.id) {
    attrs.id = block.id;
  }

  if (options.preserveClasses && block.style?.name) {
    attrs.class = block.style.name;
  }

  // Apply alignment if specified
  if (block.style?.alignment) {
    const alignStyle = `text-align: ${block.style.alignment}`;
    attrs.style = attrs.style ? `${attrs.style}; ${alignStyle}` : alignStyle;
  }

  // Convert based on block type
  let result: ConversionResult;

  switch (block.blockType) {
    case 'heading':
      const level = (block.level || 1) as 1 | 2 | 3 | 4 | 5 | 6;
      result = convertHeading(level, content, attrs, options);
      break;

    case 'paragraph':
      result = convertParagraph(content, attrs, options);
      break;

    case 'blockquote':
      result = convertBlockquote(content, attrs, options);
      break;

    case 'list':
      // Parse list items from content
      const items = content.split('\n').filter(item => item.trim());
      if (block.listType === 'ordered') {
        result = convertOrderedList(items, attrs, options);
      } else {
        result = convertUnorderedList(items, attrs, options);
      }
      break;

    case 'preformatted':
    case 'code':
      // Wrap in pre/code tags
      const codeClass = block.language ? `language-${block.language}` : '';
      const codeAttrs = {
        ...attrs,
        class: codeClass ? (attrs.class ? `${attrs.class} ${codeClass}` : codeClass) : attrs.class,
      };
      const codeHtml = block.blockType === 'code'
        ? `<code>${content}</code>`
        : content;
      result = {
        html: `<pre${formatAttributes(codeAttrs)}>${codeHtml}</pre>`,
        metadata: { elementType: block.blockType },
      };
      break;

    default:
      warnings.push(`Unknown block type: ${block.blockType}`);
      result = convertParagraph(content, attrs, options);
  }

  // Add any warnings
  if (warnings.length > 0) {
    result.warnings = [...(result.warnings || []), ...warnings];
  }

  return result;
}

/**
 * Convert multiple TextBlocks to HTML
 */
export function convertTextBlocks(
  blocks: TextBlock[],
  options: BlockConverterOptions = {}
): ConversionResult {
  const htmlParts: string[] = [];
  const warnings: string[] = [];
  let hasImages = false;
  let hasLinks = false;

  for (const block of blocks) {
    const result = convertTextBlock(block, options);

    if (result.html) {
      htmlParts.push(result.html);
    }

    if (result.warnings) {
      warnings.push(...result.warnings);
    }

    // Check for images and links in content
    if (block.richText?.segments) {
      for (const segment of block.richText.segments) {
        if ('type' in segment) {
          if (segment.type === 'image') hasImages = true;
          if (segment.type === 'link') hasLinks = true;
        }
      }
    }
  }

  return {
    html: htmlParts.join('\n'),
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      elementType: 'batch',
      itemCount: blocks.length,
    },
  };
}

/**
 * Format HTML attributes from object
 */
function formatAttributes(attrs: Record<string, string | undefined>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== '') {
      parts.push(`${key}="${escapeXhtml(value)}"`);
    }
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

// ============================================================================
// Front Matter Conversion
// ============================================================================

/**
 * Convert a front matter element to XHTML
 */
export function convertFrontMatter(
  element: Element,
  options: MatterConverterOptions = {}
): MatterConversionResult {
  if (element.matter !== 'front') {
    throw new Error(`Element is not front matter: ${element.matter}`);
  }

  return convertMatterElement(element, options);
}

/**
 * Convert Title Page to XHTML
 */
export function convertTitlePage(
  title: string,
  author: string,
  subtitle?: string,
  publisher?: string,
  options: MatterConverterOptions = {}
): string {
  const titleBlock = `    <h1 class="title">${escapeXhtml(title)}</h1>`;
  const subtitleBlock = subtitle
    ? `\n    <p class="subtitle">${escapeXhtml(subtitle)}</p>`
    : '';
  const authorBlock = `\n    <p class="author">${escapeXhtml(author)}</p>`;
  const publisherBlock = publisher
    ? `\n    <p class="publisher">${escapeXhtml(publisher)}</p>`
    : '';

  const bodyContent = `  <section epub:type="${EPUB_TYPES.TITLE_PAGE}" id="title-page">
${titleBlock}${subtitleBlock}${authorBlock}${publisherBlock}
  </section>`;

  return buildXhtmlDocument({
    title,
    bodyContent,
    epubType: EPUB_TYPES.TITLE_PAGE,
    stylesheets: options.stylesheets,
    lang: options.lang,
    dir: options.dir,
  });
}

/**
 * Convert Copyright Page to XHTML
 */
export function convertCopyrightPage(
  copyrightYear: string | number,
  authorName: string,
  additionalInfo?: {
    publisher?: string;
    isbn?: string;
    edition?: string;
    rightsStatement?: string;
  },
  options: MatterConverterOptions = {}
): string {
  const defaultRights = 'All rights reserved. No part of this book may be reproduced in any form or by any electronic or mechanical means, including information storage and retrieval systems, without permission in writing from the publisher, except by reviewers, who may quote brief passages in a review.';

  const rightsStatement = additionalInfo?.rightsStatement || defaultRights;

  let contentParts: string[] = [
    `    <p class="copyright">Copyright © ${escapeXhtml(String(copyrightYear))} by ${escapeXhtml(authorName)}</p>`,
    `    <p class="rights">${escapeXhtml(rightsStatement)}</p>`,
  ];

  if (additionalInfo?.edition) {
    contentParts.push(`    <p class="edition">${escapeXhtml(additionalInfo.edition)}</p>`);
  }

  if (additionalInfo?.publisher) {
    contentParts.push(`    <p class="publisher">Published by ${escapeXhtml(additionalInfo.publisher)}</p>`);
  }

  if (additionalInfo?.isbn) {
    contentParts.push(`    <p class="isbn">ISBN: ${escapeXhtml(additionalInfo.isbn)}</p>`);
  }

  const bodyContent = `  <section epub:type="${EPUB_TYPES.COPYRIGHT_PAGE}" id="copyright-page">
${contentParts.join('\n')}
  </section>`;

  return buildXhtmlDocument({
    title: 'Copyright',
    bodyContent,
    epubType: EPUB_TYPES.COPYRIGHT_PAGE,
    stylesheets: options.stylesheets,
    lang: options.lang,
    dir: options.dir,
  });
}

/**
 * Convert Dedication to XHTML
 */
export function convertDedication(
  dedicationText: string,
  options: MatterConverterOptions = {}
): string {
  const bodyContent = `  <section epub:type="${EPUB_TYPES.DEDICATION}" id="dedication">
    <div class="dedication-text">
      <p>${escapeXhtml(dedicationText)}</p>
    </div>
  </section>`;

  return buildXhtmlDocument({
    title: 'Dedication',
    bodyContent,
    epubType: EPUB_TYPES.DEDICATION,
    stylesheets: options.stylesheets,
    lang: options.lang,
    dir: options.dir,
  });
}

// ============================================================================
// Back Matter Conversion
// ============================================================================

/**
 * Convert a back matter element to XHTML
 */
export function convertBackMatter(
  element: Element,
  options: MatterConverterOptions = {}
): MatterConversionResult {
  if (element.matter !== 'back') {
    throw new Error(`Element is not back matter: ${element.matter}`);
  }

  return convertMatterElement(element, options);
}

/**
 * Convert About the Author to XHTML
 */
export function convertAboutAuthor(
  authorName: string,
  biography: string,
  website?: string,
  options: MatterConverterOptions = {}
): string {
  const websiteBlock = website
    ? `\n    <p class="author-website">For more information, visit <a href="${escapeXhtml(website)}">${escapeXhtml(website)}</a></p>`
    : '';

  const bodyContent = `  <section epub:type="author" id="about-author">
    <h1>About the Author</h1>
    <p class="author-bio">${escapeXhtml(biography)}</p>${websiteBlock}
  </section>`;

  return buildXhtmlDocument({
    title: 'About the Author',
    bodyContent,
    epubType: 'author',
    stylesheets: options.stylesheets,
    lang: options.lang,
    dir: options.dir,
  });
}

/**
 * Convert Also By section to XHTML
 */
export function convertAlsoBy(
  authorName: string,
  books: string[],
  options: MatterConverterOptions = {}
): string {
  const bookList = books
    .map(book => `      <li>${escapeXhtml(book)}</li>`)
    .join('\n');

  const bodyContent = `  <section epub:type="other-credits" id="also-by">
    <h1>Also by ${escapeXhtml(authorName)}</h1>
    <ul class="book-list">
${bookList}
    </ul>
  </section>`;

  return buildXhtmlDocument({
    title: `Also by ${authorName}`,
    bodyContent,
    epubType: 'other-credits',
    stylesheets: options.stylesheets,
    lang: options.lang,
    dir: options.dir,
  });
}

// ============================================================================
// General Matter Conversion
// ============================================================================

/**
 * Convert any matter element to XHTML
 */
export function convertMatterElement(
  element: Element,
  options: MatterConverterOptions = {}
): MatterConversionResult {
  const warnings: string[] = [];
  const epubType = getEpubType(element.type);

  // Generate section ID from element type
  const sectionId = element.id || element.type.replace(/_/g, '-');
  const sectionClass = options.sectionClass || element.type;

  // Convert text blocks to HTML
  const blockOptions: BlockConverterOptions = {
    preserveIds: options.preserveAttributes,
    preserveClasses: options.preserveAttributes,
    sanitizeHtml: options.sanitizeHtml,
  };

  const blocksResult = convertTextBlocks(element.content, blockOptions);

  if (blocksResult.warnings) {
    warnings.push(...blocksResult.warnings);
  }

  // Indent the content properly
  const indentedContent = blocksResult.html
    .split('\n')
    .map(line => line ? `    ${line}` : line)
    .join('\n');

  // Build section wrapper
  const bodyContent = `  <section epub:type="${epubType}" id="${sectionId}" class="${sectionClass}">
${indentedContent}
  </section>`;

  // Build XHTML document
  const xhtmlOptions: XhtmlTemplateOptions = {
    title: element.title,
    bodyContent,
    epubType,
    stylesheets: options.stylesheets,
    lang: options.lang,
    dir: options.dir,
  };

  const xhtml = buildXhtmlDocument(xhtmlOptions);

  return {
    xhtml,
    elementType: element.type,
    matterType: element.matter,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      blockCount: element.content.length,
      hasImages: blocksResult.html.includes('<img'),
      hasLinks: blocksResult.html.includes('<a'),
    },
  };
}

/**
 * Convert multiple matter elements to XHTML documents
 */
export function convertMatterElements(
  elements: Element[],
  options: MatterConverterOptions = {}
): MatterConversionResult[] {
  return elements.map(element => convertMatterElement(element, options));
}

/**
 * Batch convert front matter elements
 */
export function convertFrontMatterBatch(
  elements: Element[],
  options: MatterConverterOptions = {}
): MatterConversionResult[] {
  const frontMatterElements = elements.filter(el => el.matter === 'front');
  return convertMatterElements(frontMatterElements, options);
}

/**
 * Batch convert back matter elements
 */
export function convertBackMatterBatch(
  elements: Element[],
  options: MatterConverterOptions = {}
): MatterConversionResult[] {
  const backMatterElements = elements.filter(el => el.matter === 'back');
  return convertMatterElements(backMatterElements, options);
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate matter element structure
 */
export function validateMatterElement(element: Element): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!element.type) {
    errors.push('Element type is required');
  }

  if (!element.matter) {
    errors.push('Matter type is required');
  }

  if (!element.title) {
    errors.push('Element title is required');
  }

  if (!element.content || element.content.length === 0) {
    errors.push('Element must have content');
  }

  // Validate matter type matches element type
  const isFrontMatter = [
    'title-page',
    'copyright',
    'dedication',
    'epigraph',
    'foreword',
    'preface',
    'acknowledgments',
    'introduction',
    'prologue',
  ].includes(element.type);

  const isBackMatter = [
    'epilogue',
    'afterword',
    'appendix',
    'glossary',
    'bibliography',
    'index',
    'about-author',
    'also-by',
  ].includes(element.type);

  if (isFrontMatter && element.matter !== 'front') {
    errors.push(`Element type '${element.type}' should have matter type 'front'`);
  }

  if (isBackMatter && element.matter !== 'back') {
    errors.push(`Element type '${element.type}' should have matter type 'back'`);
  }

  // Validate content blocks
  for (const block of element.content || []) {
    if (!block.blockType) {
      errors.push('TextBlock must have a blockType');
    }
    if (block.blockType === 'heading' && block.level && (block.level < 1 || block.level > 6)) {
      errors.push(`Invalid heading level: ${block.level}. Must be between 1 and 6.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get appropriate filename for a matter element
 */
export function getMatterFilename(element: Element): string {
  const sanitizedTitle = element.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${sanitizedTitle}.xhtml`;
}

/**
 * Check if element type is front matter
 */
export function isFrontMatter(elementType: ElementType): boolean {
  return [
    'title-page',
    'copyright',
    'dedication',
    'epigraph',
    'foreword',
    'preface',
    'acknowledgments',
    'introduction',
    'prologue',
  ].includes(elementType);
}

/**
 * Check if element type is back matter
 */
export function isBackMatter(elementType: ElementType): boolean {
  return [
    'epilogue',
    'afterword',
    'appendix',
    'glossary',
    'bibliography',
    'index',
    'about-author',
    'also-by',
  ].includes(elementType);
}

/**
 * Book validation service for pre-export checks
 */

import type { Book } from '../types/book';
import type { Chapter } from '../types/chapter';
import type { Element } from '../types/element';
import type { TextBlock } from '../types/textBlock';
import type { Link } from '../types/textFeature';
import type { ImageReference } from '../types/inlineText';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: string;
  message: string;
  location?: string;
  details?: string;
  fixable?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  info: ValidationIssue[];
}

export interface ValidationOptions {
  validateMetadata?: boolean;
  validateChapters?: boolean;
  validateISBN?: boolean;
  validateImages?: boolean;
  validateLinks?: boolean;
  validateStyles?: boolean;
  minImageWidth?: number;
  minImageHeight?: number;
  exportFormat?: 'pdf' | 'epub' | 'mobi' | 'html';
}

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  validateMetadata: true,
  validateChapters: true,
  validateISBN: true,
  validateImages: true,
  validateLinks: true,
  validateStyles: true,
  minImageWidth: 300,
  minImageHeight: 300,
  exportFormat: 'pdf',
};

/**
 * Validates a book for export
 */
export function validateBook(
  book: Book,
  options: ValidationOptions = {}
): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const issues: ValidationIssue[] = [];

  if (opts.validateMetadata) {
    issues.push(...validateMetadata(book));
  }

  if (opts.validateChapters) {
    issues.push(...validateChapters(book.chapters));
  }

  if (opts.validateISBN) {
    issues.push(...validateISBN(book));
  }

  if (opts.validateImages) {
    issues.push(
      ...validateImages(book, opts.minImageWidth, opts.minImageHeight, opts.exportFormat)
    );
  }

  if (opts.validateLinks) {
    issues.push(...validateLinks(book));
  }

  if (opts.validateStyles) {
    issues.push(...validateStyles(book));
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const info = issues.filter((i) => i.severity === 'info');

  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
    info,
  };
}

/**
 * Validates required metadata
 */
function validateMetadata(book: Book): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!book.title || book.title.trim() === '') {
    issues.push({
      id: 'metadata-title-missing',
      severity: 'error',
      category: 'Metadata',
      message: 'Book title is required',
      details: 'A title must be provided before exporting the book.',
    });
  }

  if (!book.authors || book.authors.length === 0) {
    issues.push({
      id: 'metadata-author-missing',
      severity: 'error',
      category: 'Metadata',
      message: 'At least one author is required',
      details: 'Books must have at least one author before export.',
    });
  } else {
    book.authors.forEach((author, index) => {
      if (!author.name || author.name.trim() === '') {
        issues.push({
          id: `metadata-author-name-missing-${index}`,
          severity: 'error',
          category: 'Metadata',
          message: `Author #${index + 1} is missing a name`,
          details: 'All authors must have a name.',
        });
      }
    });
  }

  if (!book.metadata.description || book.metadata.description.trim() === '') {
    issues.push({
      id: 'metadata-description-missing',
      severity: 'warning',
      category: 'Metadata',
      message: 'Book description is recommended',
      details: 'A description helps readers understand what the book is about.',
    });
  }

  if (!book.metadata.language) {
    issues.push({
      id: 'metadata-language-missing',
      severity: 'warning',
      category: 'Metadata',
      message: 'Book language is not specified',
      details: 'Specifying the language improves accessibility and searchability.',
    });
  }

  if (!book.metadata.publisher) {
    issues.push({
      id: 'metadata-publisher-missing',
      severity: 'info',
      category: 'Metadata',
      message: 'Publisher information is not provided',
      details: 'Adding publisher information is recommended for professional publications.',
    });
  }

  return issues;
}

/**
 * Validates chapters for empty content
 */
function validateChapters(chapters: Chapter[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (chapters.length === 0) {
    issues.push({
      id: 'chapters-empty',
      severity: 'error',
      category: 'Content',
      message: 'Book has no chapters',
      details: 'The book must contain at least one chapter.',
    });
    return issues;
  }

  chapters.forEach((chapter, index) => {
    if (!chapter.content || chapter.content.length === 0) {
      issues.push({
        id: `chapter-empty-${chapter.id}`,
        severity: 'error',
        category: 'Content',
        message: `Chapter "${chapter.title}" is empty`,
        location: `Chapter ${index + 1}`,
        details: 'Chapters must contain content before export.',
      });
    } else {
      const hasContent = chapter.content.some((block) => {
        return block.content && block.content.trim().length > 0;
      });

      if (!hasContent) {
        issues.push({
          id: `chapter-no-content-${chapter.id}`,
          severity: 'error',
          category: 'Content',
          message: `Chapter "${chapter.title}" has no text content`,
          location: `Chapter ${index + 1}`,
          details: 'All chapter blocks are empty.',
        });
      }
    }

    if (!chapter.title || chapter.title.trim() === '') {
      issues.push({
        id: `chapter-no-title-${chapter.id}`,
        severity: 'warning',
        category: 'Content',
        message: `Chapter ${index + 1} has no title`,
        location: `Chapter ${index + 1}`,
        details: 'Chapter titles help readers navigate the book.',
      });
    }
  });

  return issues;
}

/**
 * Validates ISBN format
 */
function validateISBN(book: Book): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const isbn = book.metadata.isbn;
  const isbn13 = book.metadata.isbn13;

  if (isbn) {
    if (!isValidISBN10(isbn)) {
      issues.push({
        id: 'isbn-invalid-format',
        severity: 'error',
        category: 'Metadata',
        message: 'Invalid ISBN-10 format',
        details: `The ISBN "${isbn}" is not a valid ISBN-10. ISBN-10 must be 10 digits with a valid check digit.`,
      });
    }
  }

  if (isbn13) {
    if (!isValidISBN13(isbn13)) {
      issues.push({
        id: 'isbn13-invalid-format',
        severity: 'error',
        category: 'Metadata',
        message: 'Invalid ISBN-13 format',
        details: `The ISBN-13 "${isbn13}" is not valid. ISBN-13 must be 13 digits starting with 978 or 979 and have a valid check digit.`,
      });
    }
  }

  if (!isbn && !isbn13) {
    issues.push({
      id: 'isbn-missing',
      severity: 'info',
      category: 'Metadata',
      message: 'No ISBN provided',
      details: 'An ISBN is recommended for commercial publication.',
    });
  }

  return issues;
}

/**
 * Validates ISBN-10 format and check digit
 */
function isValidISBN10(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, '');
  if (!/^[0-9]{9}[0-9X]$/i.test(cleaned)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i], 10) * (10 - i);
  }

  const checkDigit = cleaned[9].toUpperCase();
  const checkValue = checkDigit === 'X' ? 10 : parseInt(checkDigit, 10);
  sum += checkValue;

  return sum % 11 === 0;
}

/**
 * Validates ISBN-13 format and check digit
 */
function isValidISBN13(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, '');
  if (!/^(978|979)[0-9]{10}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleaned[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = parseInt(cleaned[12], 10);
  const calculatedCheck = (10 - (sum % 10)) % 10;

  return checkDigit === calculatedCheck;
}

/**
 * Validates images for adequate resolution
 */
function validateImages(
  book: Book,
  minWidth: number,
  minHeight: number,
  exportFormat: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (exportFormat !== 'pdf') {
    return issues;
  }

  const allContent: TextBlock[] = [
    ...book.chapters.flatMap((ch) => ch.content),
    ...book.frontMatter.flatMap((el) => el.content),
    ...book.backMatter.flatMap((el) => el.content),
  ];

  allContent.forEach((block, blockIndex) => {
    if (block.features) {
      block.features.forEach((feature) => {
        if ('segments' in feature) {
          const segments = (feature as any).segments;
          if (Array.isArray(segments)) {
            segments.forEach((segment: any) => {
              if (segment.type === 'image') {
                const img = segment as ImageReference;
                if (img.width && img.height) {
                  if (img.width < minWidth || img.height < minHeight) {
                    issues.push({
                      id: `image-low-res-${img.id}`,
                      severity: 'warning',
                      category: 'Images',
                      message: `Image has low resolution for PDF export`,
                      location: `Block ${blockIndex + 1}`,
                      details: `Image "${img.alt || img.id}" is ${img.width}x${img.height}px. Recommended minimum is ${minWidth}x${minHeight}px for print quality.`,
                    });
                  }
                }

                if (!img.alt || img.alt.trim() === '') {
                  issues.push({
                    id: `image-no-alt-${img.id}`,
                    severity: 'warning',
                    category: 'Images',
                    message: 'Image is missing alt text',
                    location: `Block ${blockIndex + 1}`,
                    details: 'Alt text improves accessibility and SEO.',
                  });
                }
              }
            });
          }
        }
      });
    }
  });

  if (book.coverImage) {
    issues.push({
      id: 'cover-image-check',
      severity: 'info',
      category: 'Images',
      message: 'Cover image present',
      details: 'Verify that cover image meets your publishing requirements.',
    });
  } else {
    issues.push({
      id: 'cover-image-missing',
      severity: 'warning',
      category: 'Images',
      message: 'No cover image provided',
      details: 'A cover image is recommended for most publications.',
    });
  }

  return issues;
}

/**
 * Detects broken links in the book content
 */
function validateLinks(book: Book): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const allContent: (TextBlock | Element)[] = [
    ...book.chapters.flatMap((ch) => ch.content),
    ...book.frontMatter.flatMap((el) => el.content),
    ...book.backMatter.flatMap((el) => el.content),
  ];

  allContent.forEach((block, blockIndex) => {
    if ('features' in block && block.features) {
      block.features.forEach((feature) => {
        if (feature.type === 'link') {
          const link = feature as Link;

          if (!link.url || link.url.trim() === '') {
            issues.push({
              id: `link-empty-${link.id}`,
              severity: 'error',
              category: 'Links',
              message: 'Link has no URL',
              location: `Block ${blockIndex + 1}`,
              details: `Link text: "${link.content}"`,
            });
          } else if (link.url.startsWith('http://')) {
            issues.push({
              id: `link-insecure-${link.id}`,
              severity: 'warning',
              category: 'Links',
              message: 'Link uses insecure HTTP protocol',
              location: `Block ${blockIndex + 1}`,
              details: `URL: ${link.url}. Consider using HTTPS for security.`,
            });
          } else if (link.url.includes('localhost') || link.url.includes('127.0.0.1')) {
            issues.push({
              id: `link-localhost-${link.id}`,
              severity: 'error',
              category: 'Links',
              message: 'Link points to localhost',
              location: `Block ${blockIndex + 1}`,
              details: `URL: ${link.url}. This link will not work for readers.`,
            });
          } else if (!isValidURL(link.url)) {
            issues.push({
              id: `link-invalid-${link.id}`,
              severity: 'error',
              category: 'Links',
              message: 'Link has invalid URL format',
              location: `Block ${blockIndex + 1}`,
              details: `URL: ${link.url}`,
            });
          }

          if (!link.content || link.content.trim() === '') {
            issues.push({
              id: `link-no-text-${link.id}`,
              severity: 'warning',
              category: 'Links',
              message: 'Link has no display text',
              location: `Block ${blockIndex + 1}`,
              details: `URL: ${link.url}`,
            });
          }
        }
      });
    }
  });

  return issues;
}

/**
 * Validates URL format
 */
function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    if (url.startsWith('#') || url.startsWith('/')) {
      return true;
    }
    return false;
  }
}

/**
 * Validates style completeness
 */
function validateStyles(book: Book): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!book.styles || book.styles.length === 0) {
    issues.push({
      id: 'styles-none',
      severity: 'warning',
      category: 'Styles',
      message: 'No styles defined',
      details: 'Consider defining styles for consistent formatting.',
    });
    return issues;
  }

  const styleIds = new Set(book.styles.map((s) => s.id));
  const referencedStyleIds = new Set<string>();

  const addReferencedStyles = (styleRef?: { styleId: string }) => {
    if (styleRef?.styleId) {
      referencedStyleIds.add(styleRef.styleId);
    }
  };

  book.chapters.forEach((chapter) => {
    addReferencedStyles(chapter.style);
    chapter.content.forEach((block) => {
      addReferencedStyles(block.style);
    });
  });

  [...book.frontMatter, ...book.backMatter].forEach((element) => {
    addReferencedStyles(element.style);
    element.content.forEach((block) => {
      addReferencedStyles(block.style);
    });
  });

  referencedStyleIds.forEach((refId) => {
    if (!styleIds.has(refId)) {
      issues.push({
        id: `style-missing-${refId}`,
        severity: 'error',
        category: 'Styles',
        message: `Referenced style "${refId}" does not exist`,
        details: 'This style is referenced but not defined in the book styles.',
      });
    }
  });

  book.styles.forEach((style) => {
    if (!style.name || style.name.trim() === '') {
      issues.push({
        id: `style-no-name-${style.id}`,
        severity: 'warning',
        category: 'Styles',
        message: `Style "${style.id}" has no name`,
        details: 'Named styles are easier to manage.',
      });
    }

    if (
      !style.fontFamily &&
      !style.fontSize &&
      !style.fontWeight &&
      !style.fontStyle &&
      !style.textAlign &&
      !style.color
    ) {
      issues.push({
        id: `style-empty-${style.id}`,
        severity: 'info',
        category: 'Styles',
        message: `Style "${style.name || style.id}" has no properties defined`,
        details: 'This style has no visual properties and may not be useful.',
      });
    }
  });

  const unusedStyles = Array.from(styleIds).filter((id) => !referencedStyleIds.has(id));
  if (unusedStyles.length > 0) {
    issues.push({
      id: 'styles-unused',
      severity: 'info',
      category: 'Styles',
      message: `${unusedStyles.length} unused style(s) defined`,
      details: `Styles not referenced: ${unusedStyles.join(', ')}`,
    });
  }

  return issues;
}

/**
 * Get validation summary text
 */
export function getValidationSummary(result: ValidationResult): string {
  const { errors, warnings, info } = result;

  if (errors.length === 0 && warnings.length === 0 && info.length === 0) {
    return 'No issues found. Book is ready for export.';
  }

  const parts: string[] = [];

  if (errors.length > 0) {
    parts.push(`${errors.length} error${errors.length !== 1 ? 's' : ''}`);
  }

  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`);
  }

  if (info.length > 0) {
    parts.push(`${info.length} info`);
  }

  return parts.join(', ');
}

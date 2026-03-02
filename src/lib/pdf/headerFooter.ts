/**
 * Header and footer generation for PDF print output
 * Supports running headers/footers with page numbers, chapter names,
 * and different content for even/odd pages.
 */

import { Book } from '../../types/book'
import { BookStyle } from './types'
import { Chapter } from '../../types/chapter'

/**
 * Page numbering format types
 */
export type PageNumberFormat = 'arabic' | 'roman' | 'roman-upper' | 'none'

/**
 * Page number placement options
 */
export type PageNumberPlacement = 'center' | 'outside' | 'inside' | 'left' | 'right'

/**
 * Header/footer position
 */
export type HeaderFooterPosition = 'header' | 'footer'

/**
 * Content alignment options
 */
export type ContentAlignment = 'left' | 'center' | 'right'

/**
 * Configuration for a single header or footer element
 */
export interface HeaderFooterElement {
  /** Content to display (can include {pageNumber}, {totalPages}, {chapterTitle}, {chapterNumber}, {bookTitle}, {authorName}) */
  content: string
  /** Alignment of content */
  align: ContentAlignment
  /** Font size in points */
  fontSize?: number
  /** Font family */
  fontFamily?: string
  /** Font style */
  fontStyle?: 'normal' | 'italic'
  /** Font weight */
  fontWeight?: 'normal' | 'bold' | number
  /** Text transform */
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  /** Custom CSS classes */
  cssClasses?: string[]
}

/**
 * Configuration for headers and footers on a page
 */
export interface PageHeaderFooterConfig {
  /** Left element */
  left?: HeaderFooterElement
  /** Center element */
  center?: HeaderFooterElement
  /** Right element */
  right?: HeaderFooterElement
}

/**
 * Configuration for different page types
 */
export interface HeaderFooterPageConfig {
  /** Configuration for even (verso) pages */
  even?: PageHeaderFooterConfig
  /** Configuration for odd (recto) pages */
  odd?: PageHeaderFooterConfig
  /** Configuration for first page of chapter */
  firstPage?: PageHeaderFooterConfig
}

/**
 * Complete header and footer configuration
 */
export interface HeaderFooterConfig {
  /** Enable headers */
  headerEnabled: boolean
  /** Enable footers */
  footerEnabled: boolean
  /** Header configurations */
  header: HeaderFooterPageConfig
  /** Footer configurations */
  footer: HeaderFooterPageConfig
  /** Page number format for front matter */
  frontMatterNumberFormat: PageNumberFormat
  /** Page number format for main content */
  mainContentNumberFormat: PageNumberFormat
  /** Page number format for back matter */
  backMatterNumberFormat: PageNumberFormat
  /** Page number placement */
  pageNumberPlacement: PageNumberPlacement
  /** Height of header area in mm */
  headerHeight?: number
  /** Height of footer area in mm */
  footerHeight?: number
  /** Whether to suppress headers/footers on chapter start pages */
  suppressOnChapterStart?: boolean
  /** Custom CSS for header/footer styling */
  customCss?: string
}

/**
 * Context for header/footer generation
 */
export interface HeaderFooterContext {
  /** Book metadata */
  book: Book
  /** Current chapter information */
  chapter?: Chapter
  /** Chapter number */
  chapterNumber?: number
  /** Current section type */
  sectionType: 'front-matter' | 'main-content' | 'back-matter'
  /** Book style configuration */
  bookStyle?: BookStyle
  /** Page offset for front matter */
  frontMatterPageCount?: number
}

/**
 * Default header/footer configuration
 */
export const DEFAULT_HEADER_FOOTER_CONFIG: HeaderFooterConfig = {
  headerEnabled: true,
  footerEnabled: true,
  header: {
    even: {
      left: {
        content: '{pageNumber}',
        align: 'left',
        fontSize: 10,
      },
      center: {
        content: '{bookTitle}',
        align: 'center',
        fontSize: 10,
        fontStyle: 'italic',
      },
    },
    odd: {
      center: {
        content: '{chapterTitle}',
        align: 'center',
        fontSize: 10,
        fontStyle: 'italic',
      },
      right: {
        content: '{pageNumber}',
        align: 'right',
        fontSize: 10,
      },
    },
    firstPage: {
      // Usually suppress header on first page of chapter
    },
  },
  footer: {
    even: {},
    odd: {},
    firstPage: {},
  },
  frontMatterNumberFormat: 'roman',
  mainContentNumberFormat: 'arabic',
  backMatterNumberFormat: 'arabic',
  pageNumberPlacement: 'outside',
  headerHeight: 15,
  footerHeight: 15,
  suppressOnChapterStart: true,
}

/**
 * Format page number according to specified format
 */
export function formatPageNumber(pageNum: number, format: PageNumberFormat): string {
  if (format === 'none') {
    return ''
  }

  if (format === 'arabic') {
    return pageNum.toString()
  }

  // Roman numeral conversion
  const toRoman = (num: number): string => {
    const romanNumerals: [number, string][] = [
      [1000, 'M'],
      [900, 'CM'],
      [500, 'D'],
      [400, 'CD'],
      [100, 'C'],
      [90, 'XC'],
      [50, 'L'],
      [40, 'XL'],
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ]

    let result = ''
    let remaining = num

    for (const [value, numeral] of romanNumerals) {
      while (remaining >= value) {
        result += numeral
        remaining -= value
      }
    }

    return result
  }

  const roman = toRoman(pageNum)
  return format === 'roman' ? roman.toLowerCase() : roman
}

/**
 * Replace template variables in content string
 */
export function replaceTemplateVariables(
  content: string,
  context: HeaderFooterContext,
  pageNumber?: number,
  totalPages?: number
): string {
  let result = content

  // Replace page number
  if (pageNumber !== undefined) {
    const format =
      context.sectionType === 'front-matter'
        ? 'roman'
        : context.sectionType === 'back-matter'
          ? 'arabic'
          : 'arabic'
    result = result.replace(/{pageNumber}/g, formatPageNumber(pageNumber, format))
  }

  // Replace total pages
  if (totalPages !== undefined) {
    result = result.replace(/{totalPages}/g, totalPages.toString())
  }

  // Replace chapter information
  if (context.chapter) {
    result = result.replace(/{chapterTitle}/g, context.chapter.title || '')
    result = result.replace(/{chapterNumber}/g, context.chapterNumber?.toString() || '')
  }

  // Replace book information
  if (context.book) {
    result = result.replace(/{bookTitle}/g, context.book.title || '')
    const authorNames = context.book.authors.map((a) => a.name).join(', ')
    result = result.replace(/{authorName}/g, authorNames)
  }

  return result
}

/**
 * Generate CSS for header/footer element
 */
export function generateElementStyles(element: HeaderFooterElement): string {
  const styles: string[] = []

  if (element.fontSize) {
    styles.push(`font-size: ${element.fontSize}pt`)
  }

  if (element.fontFamily) {
    styles.push(`font-family: ${element.fontFamily}`)
  }

  if (element.fontStyle) {
    styles.push(`font-style: ${element.fontStyle}`)
  }

  if (element.fontWeight) {
    styles.push(`font-weight: ${element.fontWeight}`)
  }

  if (element.textTransform) {
    styles.push(`text-transform: ${element.textTransform}`)
  }

  styles.push(`text-align: ${element.align}`)

  return styles.join('; ')
}

/**
 * Generate HTML for a page header or footer
 */
export function generateHeaderFooterHtml(
  config: PageHeaderFooterConfig | undefined,
  context: HeaderFooterContext,
  isEvenPage: boolean = false
): string {
  if (!config) {
    return '<div style="width: 100%; height: 100%;"></div>'
  }

  const sections: string[] = []

  // Left section
  if (config.left) {
    const content = replaceTemplateVariables(config.left.content, context)
    const styles = generateElementStyles(config.left)
    const classes = config.left.cssClasses?.join(' ') || ''
    sections.push(`<div class="hf-left ${classes}" style="flex: 1; ${styles}">${content}</div>`)
  } else {
    sections.push('<div class="hf-left" style="flex: 1;"></div>')
  }

  // Center section
  if (config.center) {
    const content = replaceTemplateVariables(config.center.content, context)
    const styles = generateElementStyles(config.center)
    const classes = config.center.cssClasses?.join(' ') || ''
    sections.push(`<div class="hf-center ${classes}" style="flex: 1; ${styles}">${content}</div>`)
  } else {
    sections.push('<div class="hf-center" style="flex: 1;"></div>')
  }

  // Right section
  if (config.right) {
    const content = replaceTemplateVariables(config.right.content, context)
    const styles = generateElementStyles(config.right)
    const classes = config.right.cssClasses?.join(' ') || ''
    sections.push(`<div class="hf-right ${classes}" style="flex: 1; ${styles}">${content}</div>`)
  } else {
    sections.push('<div class="hf-right" style="flex: 1;"></div>')
  }

  return `
    <div style="
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      padding: 0 20px;
      font-size: 10pt;
    ">
      ${sections.join('\n      ')}
    </div>
  `
}

/**
 * Generate Puppeteer header template
 */
export function generateHeaderTemplate(
  config: HeaderFooterConfig,
  context: HeaderFooterContext
): string {
  if (!config.headerEnabled) {
    return '<div></div>'
  }

  // Puppeteer uses special CSS classes for page counters
  // .pageNumber and .totalPages are automatically replaced
  const commonStyles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: ${context.bookStyle?.fonts.body.family || 'serif'};
      }
      .hf-container {
        width: 100%;
        height: ${config.headerHeight || 15}mm;
      }
      ${config.customCss || ''}
    </style>
  `

  // For even pages
  const evenHtml = generateHeaderFooterHtml(config.header.even, context, true)

  // For odd pages
  const oddHtml = generateHeaderFooterHtml(config.header.odd, context, false)

  // Puppeteer templates need to be valid HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${commonStyles}
    </head>
    <body>
      <div class="hf-container">
        ${oddHtml}
      </div>
    </body>
    </html>
  `
}

/**
 * Generate Puppeteer footer template
 */
export function generateFooterTemplate(
  config: HeaderFooterConfig,
  context: HeaderFooterContext
): string {
  if (!config.footerEnabled) {
    return '<div></div>'
  }

  const commonStyles = `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: ${context.bookStyle?.fonts.body.family || 'serif'};
      }
      .hf-container {
        width: 100%;
        height: ${config.footerHeight || 15}mm;
      }
      ${config.customCss || ''}
    </style>
  `

  // For even pages
  const evenHtml = generateHeaderFooterHtml(config.footer.even, context, true)

  // For odd pages
  const oddHtml = generateHeaderFooterHtml(config.footer.odd, context, false)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${commonStyles}
    </head>
    <body>
      <div class="hf-container">
        ${oddHtml}
      </div>
    </body>
    </html>
  `
}

/**
 * Create header/footer configuration from book style
 */
export function createConfigFromBookStyle(
  bookStyle?: BookStyle,
  customOverrides?: Partial<HeaderFooterConfig>
): HeaderFooterConfig {
  const config: HeaderFooterConfig = { ...DEFAULT_HEADER_FOOTER_CONFIG }

  // Apply book style settings if available
  if (bookStyle) {
    // Use book style fonts for headers/footers
    if (config.header.even?.center) {
      config.header.even.center.fontFamily = bookStyle.fonts.body.family
    }
    if (config.header.odd?.center) {
      config.header.odd.center.fontFamily = bookStyle.fonts.body.family
    }
  }

  // Apply custom overrides
  if (customOverrides) {
    Object.assign(config, customOverrides)
  }

  return config
}

/**
 * Generate header/footer templates for a specific chapter
 */
export function generateChapterHeaderFooter(
  book: Book,
  chapter: Chapter,
  chapterNumber: number,
  config: HeaderFooterConfig,
  bookStyle?: BookStyle
): {
  headerTemplate: string
  footerTemplate: string
} {
  const context: HeaderFooterContext = {
    book,
    chapter,
    chapterNumber,
    sectionType: 'main-content',
    bookStyle,
  }

  return {
    headerTemplate: generateHeaderTemplate(config, context),
    footerTemplate: generateFooterTemplate(config, context),
  }
}

/**
 * Generate header/footer templates for front matter
 */
export function generateFrontMatterHeaderFooter(
  book: Book,
  config: HeaderFooterConfig,
  bookStyle?: BookStyle
): {
  headerTemplate: string
  footerTemplate: string
} {
  const context: HeaderFooterContext = {
    book,
    sectionType: 'front-matter',
    bookStyle,
  }

  return {
    headerTemplate: generateHeaderTemplate(config, context),
    footerTemplate: generateFooterTemplate(config, context),
  }
}

/**
 * Generate header/footer templates for back matter
 */
export function generateBackMatterHeaderFooter(
  book: Book,
  config: HeaderFooterConfig,
  bookStyle?: BookStyle
): {
  headerTemplate: string
  footerTemplate: string
} {
  const context: HeaderFooterContext = {
    book,
    sectionType: 'back-matter',
    bookStyle,
  }

  return {
    headerTemplate: generateHeaderTemplate(config, context),
    footerTemplate: generateFooterTemplate(config, context),
  }
}

/**
 * Calculate page number offset for different sections
 */
export interface PageNumberOffsets {
  frontMatter: number
  mainContent: number
  backMatter: number
}

/**
 * Calculate page number offsets based on section page counts
 */
export function calculatePageNumberOffsets(
  frontMatterPages: number,
  mainContentPages: number
): PageNumberOffsets {
  return {
    frontMatter: 1,
    mainContent: 1,
    backMatter: mainContentPages + 1,
  }
}

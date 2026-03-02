/**
 * Puppeteer Page Configuration for PDF Generation
 * Configures Puppeteer page settings including size, margins, headers/footers, and PDF options
 */

import type { Page, PDFOptions } from 'puppeteer';
import type { TrimSize, CustomTrimSize, PdfMargins, HeaderConfig, PageNumberConfig } from '../../types/pdf';
import type { BookStyle } from '../../types/style';

/**
 * Page configuration options for Puppeteer
 */
export interface PuppeteerPageConfig {
  trimSize: TrimSize;
  customTrimSize?: CustomTrimSize;
  margins: PdfMargins;
  printBackground?: boolean;
  headerConfig?: HeaderConfig;
  pageNumberConfig?: PageNumberConfig;
  style?: BookStyle;
  quality?: 'draft' | 'standard' | 'high';
  waitForFonts?: boolean;
  pageBreaks?: {
    avoidOrphans?: boolean;
    avoidWidows?: boolean;
    minOrphanLines?: number;
    minWidowLines?: number;
  };
}

/**
 * Trim size dimensions in inches
 * Puppeteer accepts dimensions in various units, we'll use inches for clarity
 */
const TRIM_SIZES: Record<string, { width: number; height: number }> = {
  '5x8': { width: 5, height: 8 },
  '5.5x8.5': { width: 5.5, height: 8.5 },
  '6x9': { width: 6, height: 9 },
  '7x10': { width: 7, height: 10 },
  '8x10': { width: 8, height: 10 },
  '8.5x11': { width: 8.5, height: 11 },
  'A4': { width: 8.27, height: 11.69 },
  'A5': { width: 5.83, height: 8.27 },
};

/**
 * Convert inches to CSS string
 */
function inchesToCss(inches: number): string {
  return `${inches}in`;
}

/**
 * Get page dimensions for a trim size
 */
function getPageDimensions(
  trimSize: TrimSize,
  customTrimSize?: CustomTrimSize
): { width: string; height: string } {
  if (trimSize === 'custom' && customTrimSize) {
    return {
      width: inchesToCss(customTrimSize.width),
      height: inchesToCss(customTrimSize.height),
    };
  }

  const dimensions = TRIM_SIZES[trimSize] || TRIM_SIZES['6x9'];
  return {
    width: inchesToCss(dimensions.width),
    height: inchesToCss(dimensions.height),
  };
}

/**
 * Format margins for PDF options
 */
function formatMargins(margins: PdfMargins): {
  top: string;
  bottom: string;
  left: string;
  right: string;
} {
  // For PDF generation, we use the outside margin for both left and right
  // The inside/outside concept is handled by the alternating page logic
  return {
    top: inchesToCss(margins.top),
    bottom: inchesToCss(margins.bottom),
    left: inchesToCss(margins.outside),
    right: inchesToCss(margins.inside),
  };
}

/**
 * Generate header template HTML
 */
function generateHeaderTemplate(
  config: HeaderConfig,
  style?: BookStyle
): string {
  if (!config.enabled) {
    return '<div></div>';
  }

  const fontSize = config.fontSize || 10;
  const fontFamily = config.fontFamily || style?.fonts?.body || 'serif';
  const color = style?.colors?.text || '#000000';

  // Puppeteer supports special tags for header/footer:
  // <span class="pageNumber"></span> - Current page number
  // <span class="totalPages"></span> - Total pages
  // <span class="date"></span> - Current date
  // <span class="title"></span> - Document title
  // <span class="url"></span> - Document URL

  return `
    <div style="
      width: 100%;
      font-size: ${fontSize}px;
      font-family: ${fontFamily};
      color: ${color};
      padding: 0 0.5in;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <span style="flex: 1; text-align: left;">${config.leftPage || ''}</span>
      <span style="flex: 1; text-align: right;">${config.rightPage || ''}</span>
    </div>
  `;
}

/**
 * Generate footer template HTML with page numbers
 */
function generateFooterTemplate(
  config: PageNumberConfig,
  style?: BookStyle
): string {
  if (!config.enabled) {
    return '<div></div>';
  }

  const fontSize = config.fontSize || 10;
  const fontFamily = config.fontFamily || style?.fonts?.body || 'serif';
  const color = style?.colors?.text || '#000000';
  const startNumber = config.startNumber || 1;

  let justifyContent = 'center';
  if (config.alignment === 'left') justifyContent = 'flex-start';
  if (config.alignment === 'right') justifyContent = 'flex-end';

  // For page numbering with custom start number, we can use CSS counter
  return `
    <div style="
      width: 100%;
      font-size: ${fontSize}px;
      font-family: ${fontFamily};
      color: ${color};
      padding: 0 0.5in;
      display: flex;
      justify-content: ${justifyContent};
      align-items: center;
    ">
      <span class="pageNumber"></span>
    </div>
  `;
}

/**
 * Get DPI/scale factor based on quality setting
 */
function getScaleFactor(quality?: 'draft' | 'standard' | 'high'): number {
  switch (quality) {
    case 'draft':
      return 1.0; // 72 DPI
    case 'high':
      return 2.0; // 144 DPI
    case 'standard':
    default:
      return 1.5; // 108 DPI
  }
}

/**
 * Inject page break CSS styles
 */
async function injectPageBreakStyles(
  page: Page,
  pageBreaks?: {
    avoidOrphans?: boolean;
    avoidWidows?: boolean;
    minOrphanLines?: number;
    minWidowLines?: number;
  }
): Promise<void> {
  if (!pageBreaks) {
    return;
  }

  const orphans = pageBreaks.minOrphanLines || 2;
  const widows = pageBreaks.minWidowLines || 2;

  await page.addStyleTag({
    content: `
      @media print {
        /* Page break settings */
        p, div, section {
          ${pageBreaks.avoidOrphans ? `orphans: ${orphans};` : ''}
          ${pageBreaks.avoidWidows ? `widows: ${widows};` : ''}
        }

        /* Avoid breaks inside certain elements */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
          break-after: avoid;
        }

        /* Keep headings with following content */
        h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p {
          page-break-before: avoid;
          break-before: avoid;
        }

        /* Avoid breaks inside these elements */
        blockquote, pre, table, figure {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Chapter/section breaks */
        .chapter, .section {
          page-break-before: always;
          break-before: page;
        }

        /* Force page breaks where specified */
        .page-break, .pagebreak {
          page-break-before: always;
          break-before: page;
        }

        /* Avoid breaks in these */
        .keep-together {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    `,
  });
}

/**
 * Wait for fonts to load
 */
async function waitForFonts(page: Page, timeout: number = 30000): Promise<void> {
  try {
    await page.evaluateHandle(
      async (timeoutMs: number) => {
        // Check if document.fonts API is available
        if (!document.fonts) {
          return;
        }

        // Wait for fonts to be ready or timeout
        const startTime = Date.now();
        while (document.fonts.status !== 'loaded') {
          if (Date.now() - startTime > timeoutMs) {
            console.warn('Font loading timeout - proceeding anyway');
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Additional wait to ensure fonts are fully applied
        await document.fonts.ready;
      },
      timeout
    );
  } catch (error) {
    console.warn('Error waiting for fonts:', error);
    // Continue anyway - fonts might still be loaded
  }
}

/**
 * Configure Puppeteer page for PDF generation
 *
 * @param page - Puppeteer page instance
 * @param config - Page configuration options
 * @returns Configured page instance and PDF options
 */
export async function configurePage(
  page: Page,
  config: PuppeteerPageConfig
): Promise<{ page: Page; pdfOptions: PDFOptions }> {
  // Get page dimensions
  const dimensions = getPageDimensions(config.trimSize, config.customTrimSize);

  // Format margins
  const margins = formatMargins(config.margins);

  // Set viewport to match PDF dimensions (important for accurate rendering)
  // Convert inches to pixels (assuming 96 DPI for viewport)
  const widthInches = parseFloat(dimensions.width);
  const heightInches = parseFloat(dimensions.height);
  await page.setViewport({
    width: Math.round(widthInches * 96),
    height: Math.round(heightInches * 96),
    deviceScaleFactor: getScaleFactor(config.quality),
  });

  // Inject page break CSS styles
  await injectPageBreakStyles(page, config.pageBreaks);

  // Wait for fonts to load if requested
  if (config.waitForFonts !== false) {
    await waitForFonts(page);
  }

  // Generate header/footer templates
  const displayHeaderFooter =
    (config.headerConfig?.enabled || config.pageNumberConfig?.enabled) ?? false;

  const headerTemplate = config.headerConfig
    ? generateHeaderTemplate(config.headerConfig, config.style)
    : '<div></div>';

  const footerTemplate = config.pageNumberConfig
    ? config.pageNumberConfig.position === 'bottom'
      ? generateFooterTemplate(config.pageNumberConfig, config.style)
      : '<div></div>'
    : '<div></div>';

  // Build PDF options
  const pdfOptions: PDFOptions = {
    // Page format - use custom width/height
    width: dimensions.width,
    height: dimensions.height,

    // Margins
    margin: margins,

    // Print background graphics (colors, images)
    printBackground: config.printBackground !== false,

    // Prefer CSS-defined page size over options
    preferCSSPageSize: false,

    // Display header and footer
    displayHeaderFooter,
    headerTemplate: displayHeaderFooter ? headerTemplate : undefined,
    footerTemplate: displayHeaderFooter ? footerTemplate : undefined,

    // Scale - affects text/image rendering quality
    scale: getScaleFactor(config.quality),

    // Landscape orientation (false for books)
    landscape: false,

    // Page ranges (empty = all pages)
    pageRanges: '',

    // Format can be specified if not using custom dimensions
    // format: 'Letter', // We use width/height instead

    // Omit background (opposite of printBackground)
    omitBackground: false,

    // Tagged PDF (for accessibility)
    tagged: true,

    // Outline (PDF bookmarks)
    outline: true,
  };

  return {
    page,
    pdfOptions,
  };
}

/**
 * Configure page with content and return PDF buffer
 *
 * @param page - Puppeteer page instance
 * @param content - HTML content to render
 * @param config - Page configuration options
 * @returns PDF buffer
 */
export async function generatePdfFromHtml(
  page: Page,
  content: string,
  config: PuppeteerPageConfig
): Promise<Buffer> {
  // Configure the page
  const { pdfOptions } = await configurePage(page, config);

  // Set content
  await page.setContent(content, {
    waitUntil: ['load', 'networkidle0'],
  });

  // Wait for fonts if requested
  if (config.waitForFonts !== false) {
    await waitForFonts(page);
  }

  // Generate PDF
  const pdfBuffer = await page.pdf(pdfOptions);

  return pdfBuffer;
}

/**
 * Helper to create default page configuration
 */
export function createDefaultPageConfig(
  overrides?: Partial<PuppeteerPageConfig>
): PuppeteerPageConfig {
  return {
    trimSize: '6x9',
    margins: {
      top: 0.75,
      bottom: 0.75,
      inside: 0.75,
      outside: 0.5,
    },
    printBackground: true,
    quality: 'standard',
    waitForFonts: true,
    pageBreaks: {
      avoidOrphans: true,
      avoidWidows: true,
      minOrphanLines: 2,
      minWidowLines: 2,
    },
    ...overrides,
  };
}

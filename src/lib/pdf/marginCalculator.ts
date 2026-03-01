/**
 * Margin and bleed calculator for print-ready PDF generation
 *
 * Handles calculation of page dimensions including margins and bleeds,
 * with support for mirrored margins for book spreads.
 */

/**
 * Margin configuration for a page
 * All measurements in inches
 */
export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Margin configuration for book spreads with inside/outside margins
 * All measurements in inches
 */
export interface SpreadMargins {
  top: number;
  bottom: number;
  inside: number;
  outside: number;
}

/**
 * Page dimensions
 * All measurements in inches
 */
export interface PageDimensions {
  width: number;
  height: number;
}

/**
 * Content area dimensions after applying margins
 * All measurements in inches
 */
export interface ContentArea {
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * Complete page configuration with margins and bleeds
 * All measurements in inches
 */
export interface PageConfiguration {
  page: PageDimensions;
  margins: Margins;
  bleed: number;
  trimBox: PageDimensions;
  bleedBox: PageDimensions;
  contentArea: ContentArea;
}

/**
 * Page side enumeration for book spreads
 */
export type PageSide = 'left' | 'right';

/**
 * Standard bleed amount for commercial printing (in inches)
 */
export const STANDARD_BLEED = 0.125;

/**
 * Common margin presets (in inches)
 */
export const MARGIN_PRESETS = {
  standard: {
    top: 1.0,
    bottom: 1.0,
    left: 1.0,
    right: 1.0,
  },
  narrow: {
    top: 0.5,
    bottom: 0.5,
    left: 0.5,
    right: 0.5,
  },
  wide: {
    top: 1.5,
    bottom: 1.5,
    left: 1.5,
    right: 1.5,
  },
  book: {
    top: 0.75,
    bottom: 0.75,
    inside: 1.0,
    outside: 0.75,
  },
} as const;

/**
 * Calculates margins with bleed for print-ready PDF generation
 *
 * @param baseMargins - The base margins for the page
 * @param bleed - The bleed amount (typically 0.125 inches)
 * @returns Margins adjusted for bleed
 */
export function calculateMarginsWithBleed(
  baseMargins: Margins,
  bleed: number = STANDARD_BLEED
): Margins {
  return {
    top: baseMargins.top + bleed,
    bottom: baseMargins.bottom + bleed,
    left: baseMargins.left + bleed,
    right: baseMargins.right + bleed,
  };
}

/**
 * Calculates the content area dimensions after applying margins
 *
 * @param pageDimensions - The page dimensions
 * @param margins - The margins to apply
 * @returns Content area with position and dimensions
 */
export function calculateContentArea(
  pageDimensions: PageDimensions,
  margins: Margins
): ContentArea {
  return {
    width: pageDimensions.width - margins.left - margins.right,
    height: pageDimensions.height - margins.top - margins.bottom,
    x: margins.left,
    y: margins.top,
  };
}

/**
 * Converts spread margins to regular margins based on page side
 * Mirrors margins appropriately for left/right pages in book spreads
 *
 * @param spreadMargins - Margins with inside/outside specification
 * @param pageSide - Whether this is a left or right page
 * @returns Standard margins with left/right values
 */
export function getMarginsForPageSide(
  spreadMargins: SpreadMargins,
  pageSide: PageSide
): Margins {
  // For left pages (even page numbers), inside is on the right
  // For right pages (odd page numbers), inside is on the left
  if (pageSide === 'left') {
    return {
      top: spreadMargins.top,
      bottom: spreadMargins.bottom,
      left: spreadMargins.outside,
      right: spreadMargins.inside,
    };
  } else {
    return {
      top: spreadMargins.top,
      bottom: spreadMargins.bottom,
      left: spreadMargins.inside,
      right: spreadMargins.outside,
    };
  }
}

/**
 * Determines page side based on page number
 *
 * @param pageNumber - The page number (1-indexed)
 * @returns The page side (left or right)
 */
export function getPageSide(pageNumber: number): PageSide {
  // Odd pages are right pages, even pages are left pages
  return pageNumber % 2 === 0 ? 'left' : 'right';
}

/**
 * Calculates complete page configuration including trim box, bleed box, and content area
 *
 * @param pageDimensions - The base page dimensions (trim size)
 * @param margins - The margins to apply
 * @param bleed - The bleed amount (typically 0.125 inches)
 * @returns Complete page configuration with all boxes and areas
 */
export function calculatePageConfiguration(
  pageDimensions: PageDimensions,
  margins: Margins,
  bleed: number = STANDARD_BLEED
): PageConfiguration {
  // Trim box is the final page size after cutting
  const trimBox = { ...pageDimensions };

  // Bleed box extends beyond trim box by the bleed amount
  const bleedBox = {
    width: pageDimensions.width + bleed * 2,
    height: pageDimensions.height + bleed * 2,
  };

  // Content area is calculated from trim box with margins
  const contentArea = calculateContentArea(pageDimensions, margins);

  return {
    page: pageDimensions,
    margins,
    bleed,
    trimBox,
    bleedBox,
    contentArea,
  };
}

/**
 * Calculates page configuration for a specific page in a book spread
 *
 * @param pageDimensions - The base page dimensions (trim size)
 * @param spreadMargins - Margins with inside/outside specification
 * @param pageNumber - The page number (1-indexed)
 * @param bleed - The bleed amount (typically 0.125 inches)
 * @returns Complete page configuration for the specific page side
 */
export function calculateSpreadPageConfiguration(
  pageDimensions: PageDimensions,
  spreadMargins: SpreadMargins,
  pageNumber: number,
  bleed: number = STANDARD_BLEED
): PageConfiguration {
  const pageSide = getPageSide(pageNumber);
  const margins = getMarginsForPageSide(spreadMargins, pageSide);
  return calculatePageConfiguration(pageDimensions, margins, bleed);
}

/**
 * Helper function to get standard margin preset
 *
 * @returns Standard margins (1 inch on all sides)
 */
export function getStandardMargins(): Margins {
  return { ...MARGIN_PRESETS.standard };
}

/**
 * Helper function to get narrow margin preset
 *
 * @returns Narrow margins (0.5 inch on all sides)
 */
export function getNarrowMargins(): Margins {
  return { ...MARGIN_PRESETS.narrow };
}

/**
 * Helper function to get wide margin preset
 *
 * @returns Wide margins (1.5 inches on all sides)
 */
export function getWideMargins(): Margins {
  return { ...MARGIN_PRESETS.wide };
}

/**
 * Helper function to get book margin preset for spreads
 *
 * @returns Book margins with inside/outside configuration
 */
export function getBookMargins(): SpreadMargins {
  return { ...MARGIN_PRESETS.book };
}

/**
 * Validates that margins don't exceed page dimensions
 *
 * @param pageDimensions - The page dimensions
 * @param margins - The margins to validate
 * @returns True if margins are valid, false otherwise
 */
export function validateMargins(
  pageDimensions: PageDimensions,
  margins: Margins
): boolean {
  const contentArea = calculateContentArea(pageDimensions, margins);
  return contentArea.width > 0 && contentArea.height > 0;
}

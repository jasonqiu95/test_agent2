/**
 * Page geometry utilities for PDF generation
 * Handles trim sizes, unit conversions, and page dimension calculations
 */

// Unit conversion constants
const POINTS_PER_INCH = 72;
const MM_PER_INCH = 25.4;
const POINTS_PER_MM = POINTS_PER_INCH / MM_PER_INCH;

export type Unit = 'in' | 'pt' | 'mm';

export interface Dimensions {
  width: number;
  height: number;
  unit: Unit;
}

export interface TrimSize {
  name: string;
  width: number;
  height: number;
  unit: Unit;
}

/**
 * Standard trim sizes for common book formats
 * All dimensions are specified in inches
 */
export const TRIM_SIZES: Record<string, Dimensions> = {
  '5x8': { width: 5, height: 8, unit: 'in' },
  '5.5x8.5': { width: 5.5, height: 8.5, unit: 'in' },
  '6x9': { width: 6, height: 9, unit: 'in' },
  '7x10': { width: 7, height: 10, unit: 'in' },
  '8.5x11': { width: 8.5, height: 11, unit: 'in' },
  'A4': { width: 210, height: 297, unit: 'mm' },
  'A5': { width: 148, height: 210, unit: 'mm' },
  'letter': { width: 8.5, height: 11, unit: 'in' },
  'legal': { width: 8.5, height: 14, unit: 'in' },
};

/**
 * Standard trim size constants for easy access
 */
export const STANDARD_TRIM_SIZES = {
  MASS_MARKET: TRIM_SIZES['5x8'],
  DIGEST: TRIM_SIZES['5.5x8.5'],
  TRADE: TRIM_SIZES['6x9'],
  ROYAL: TRIM_SIZES['7x10'],
  LETTER: TRIM_SIZES['letter'],
  LEGAL: TRIM_SIZES['legal'],
  A4: TRIM_SIZES['A4'],
  A5: TRIM_SIZES['A5'],
} as const;

/**
 * Convert inches to points
 */
export function inchesToPoints(inches: number): number {
  return inches * POINTS_PER_INCH;
}

/**
 * Convert points to inches
 */
export function pointsToInches(points: number): number {
  return points / POINTS_PER_INCH;
}

/**
 * Convert millimeters to points
 */
export function mmToPoints(mm: number): number {
  return mm * POINTS_PER_MM;
}

/**
 * Convert points to millimeters
 */
export function pointsToMm(points: number): number {
  return points / POINTS_PER_MM;
}

/**
 * Convert inches to millimeters
 */
export function inchesToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

/**
 * Convert millimeters to inches
 */
export function mmToInches(mm: number): number {
  return mm / MM_PER_INCH;
}

/**
 * Convert any dimension to points
 */
export function toPoints(value: number, unit: Unit): number {
  switch (unit) {
    case 'in':
      return inchesToPoints(value);
    case 'mm':
      return mmToPoints(value);
    case 'pt':
      return value;
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Convert points to any unit
 */
export function fromPoints(points: number, unit: Unit): number {
  switch (unit) {
    case 'in':
      return pointsToInches(points);
    case 'mm':
      return pointsToMm(points);
    case 'pt':
      return points;
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

/**
 * Convert dimensions from one unit to another
 */
export function convertDimensions(
  dimensions: Dimensions,
  targetUnit: Unit
): Dimensions {
  if (dimensions.unit === targetUnit) {
    return dimensions;
  }

  const widthInPoints = toPoints(dimensions.width, dimensions.unit);
  const heightInPoints = toPoints(dimensions.height, dimensions.unit);

  return {
    width: fromPoints(widthInPoints, targetUnit),
    height: fromPoints(heightInPoints, targetUnit),
    unit: targetUnit,
  };
}

/**
 * Calculate page dimensions in points from a trim size
 * Points are the standard unit used in PDF generation (72 points = 1 inch)
 */
export function calculatePageDimensions(trimSize: string | Dimensions): {
  width: number;
  height: number;
} {
  let dimensions: Dimensions;

  if (typeof trimSize === 'string') {
    dimensions = TRIM_SIZES[trimSize];
    if (!dimensions) {
      throw new Error(
        `Unknown trim size: ${trimSize}. Available sizes: ${Object.keys(TRIM_SIZES).join(', ')}`
      );
    }
  } else {
    dimensions = trimSize;
  }

  return {
    width: toPoints(dimensions.width, dimensions.unit),
    height: toPoints(dimensions.height, dimensions.unit),
  };
}

/**
 * Get a list of all available trim size names
 */
export function getAvailableTrimSizes(): string[] {
  return Object.keys(TRIM_SIZES);
}

/**
 * Get trim size dimensions by name
 */
export function getTrimSize(name: string): Dimensions | undefined {
  return TRIM_SIZES[name];
}

/**
 * Check if a trim size name exists
 */
export function isValidTrimSize(name: string): boolean {
  return name in TRIM_SIZES;
}

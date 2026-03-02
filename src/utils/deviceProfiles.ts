/**
 * Device Profiles Module
 *
 * This module provides comprehensive device-specific rendering profiles
 * for iPad, Kindle, iPhone, and Print Spread modes. It includes viewport
 * dimensions, page sizing, margins, DPI settings, and CSS generation
 * utilities for each device type.
 */

/**
 * Device type enumeration for supported rendering modes
 */
export type DeviceType = 'ipad' | 'kindle' | 'iphone' | 'print-spread' | 'desktop' | 'tablet' | 'mobile' | 'print';

/**
 * Margin configuration for device-specific rendering
 */
export interface DeviceMargins {
  /** Top margin in pixels */
  top: number;
  /** Right margin in pixels */
  right: number;
  /** Bottom margin in pixels */
  bottom: number;
  /** Left margin in pixels */
  left: number;
  /** Inner margin for spreads (binding side) in pixels */
  inner?: number;
  /** Outer margin for spreads in pixels */
  outer?: number;
}

/**
 * Header and footer positioning configuration
 */
export interface HeaderFooterConfig {
  /** Whether header is enabled */
  headerEnabled: boolean;
  /** Header height in pixels */
  headerHeight: number;
  /** Header margin from top in pixels */
  headerMarginTop: number;
  /** Whether footer is enabled */
  footerEnabled: boolean;
  /** Footer height in pixels */
  footerHeight: number;
  /** Footer margin from bottom in pixels */
  footerMarginBottom: number;
}

/**
 * Comprehensive device profile configuration
 */
export interface DeviceProfile {
  /** Device type identifier */
  type: DeviceType;
  /** Human-readable device name */
  name: string;
  /** Viewport width in pixels */
  viewportWidth: number;
  /** Viewport height in pixels */
  viewportHeight: number;
  /** Page width in pixels (content area) */
  pageWidth: number;
  /** Page height in pixels (content area) */
  pageHeight: number;
  /** Device pixel ratio for high-DPI displays */
  pixelRatio: number;
  /** DPI (dots per inch) setting */
  dpi: number;
  /** Device-specific margins */
  margins: DeviceMargins;
  /** Header and footer configuration */
  headerFooter: HeaderFooterConfig;
  /** Whether the device supports spread (two-page) view */
  supportsSpread: boolean;
  /** Orientation: portrait or landscape */
  orientation: 'portrait' | 'landscape';
  /** Device-specific CSS class name */
  cssClass: string;
}

/**
 * iPad device profile (9.7" display)
 * Resolution: 2048 x 1536 (264 PPI)
 * Typical reading dimensions with margins
 */
export const IPAD_PROFILE: DeviceProfile = {
  type: 'ipad',
  name: 'iPad (9.7")',
  viewportWidth: 768,
  viewportHeight: 1024,
  pageWidth: 708,
  pageHeight: 944,
  pixelRatio: 2,
  dpi: 264,
  margins: {
    top: 40,
    right: 30,
    bottom: 40,
    left: 30,
  },
  headerFooter: {
    headerEnabled: true,
    headerHeight: 24,
    headerMarginTop: 16,
    footerEnabled: true,
    footerHeight: 24,
    footerMarginBottom: 16,
  },
  supportsSpread: true,
  orientation: 'portrait',
  cssClass: 'device-ipad',
};

/**
 * Kindle device profile (Kindle Paperwhite)
 * Resolution: 1448 x 1072 (300 PPI)
 * E-ink display optimized for reading
 */
export const KINDLE_PROFILE: DeviceProfile = {
  type: 'kindle',
  name: 'Kindle Paperwhite',
  viewportWidth: 758,
  viewportHeight: 1024,
  pageWidth: 698,
  pageHeight: 964,
  pixelRatio: 2,
  dpi: 300,
  margins: {
    top: 30,
    right: 30,
    bottom: 30,
    left: 30,
  },
  headerFooter: {
    headerEnabled: false,
    headerHeight: 0,
    headerMarginTop: 0,
    footerEnabled: true,
    footerHeight: 20,
    footerMarginBottom: 10,
  },
  supportsSpread: false,
  orientation: 'portrait',
  cssClass: 'device-kindle',
};

/**
 * iPhone device profile (iPhone 12/13/14 standard)
 * Resolution: 2532 x 1170 (460 PPI)
 * Mobile reading optimized
 */
export const IPHONE_PROFILE: DeviceProfile = {
  type: 'iphone',
  name: 'iPhone',
  viewportWidth: 390,
  viewportHeight: 844,
  pageWidth: 350,
  pageHeight: 784,
  pixelRatio: 3,
  dpi: 460,
  margins: {
    top: 30,
    right: 20,
    bottom: 30,
    left: 20,
  },
  headerFooter: {
    headerEnabled: false,
    headerHeight: 0,
    headerMarginTop: 0,
    footerEnabled: true,
    footerHeight: 20,
    footerMarginBottom: 10,
  },
  supportsSpread: false,
  orientation: 'portrait',
  cssClass: 'device-iphone',
};

/**
 * Print Spread device profile (standard book spread)
 * Two facing pages for print production
 * Standard 6" x 9" book format
 */
export const PRINT_SPREAD_PROFILE: DeviceProfile = {
  type: 'print-spread',
  name: 'Print Spread (6" × 9")',
  viewportWidth: 1728, // Two pages side by side (864 x 2)
  viewportHeight: 1296,
  pageWidth: 816, // Single page width
  pageHeight: 1224,
  pixelRatio: 1,
  dpi: 300,
  margins: {
    top: 72, // 1 inch at 72 DPI (scaled to 300 DPI)
    right: 54, // 0.75 inch
    bottom: 72,
    left: 54,
    inner: 72, // Binding margin
    outer: 54,
  },
  headerFooter: {
    headerEnabled: true,
    headerHeight: 24,
    headerMarginTop: 36,
    footerEnabled: true,
    footerHeight: 24,
    footerMarginBottom: 36,
  },
  supportsSpread: true,
  orientation: 'landscape',
  cssClass: 'device-print-spread',
};

/**
 * Desktop device profile (fallback for general desktop use)
 */
export const DESKTOP_PROFILE: DeviceProfile = {
  type: 'desktop',
  name: 'Desktop',
  viewportWidth: 1920,
  viewportHeight: 1080,
  pageWidth: 816,
  pageHeight: 1056,
  pixelRatio: 1,
  dpi: 96,
  margins: {
    top: 48,
    right: 48,
    bottom: 48,
    left: 48,
  },
  headerFooter: {
    headerEnabled: true,
    headerHeight: 24,
    headerMarginTop: 24,
    footerEnabled: true,
    footerHeight: 24,
    footerMarginBottom: 24,
  },
  supportsSpread: false,
  orientation: 'landscape',
  cssClass: 'device-desktop',
};

/**
 * Tablet device profile (generic tablet)
 */
export const TABLET_PROFILE: DeviceProfile = {
  type: 'tablet',
  name: 'Tablet',
  viewportWidth: 1024,
  viewportHeight: 768,
  pageWidth: 768,
  pageHeight: 1024,
  pixelRatio: 2,
  dpi: 160,
  margins: {
    top: 40,
    right: 30,
    bottom: 40,
    left: 30,
  },
  headerFooter: {
    headerEnabled: true,
    headerHeight: 24,
    headerMarginTop: 16,
    footerEnabled: true,
    footerHeight: 24,
    footerMarginBottom: 16,
  },
  supportsSpread: true,
  orientation: 'landscape',
  cssClass: 'device-tablet',
};

/**
 * Mobile device profile (generic mobile)
 */
export const MOBILE_PROFILE: DeviceProfile = {
  type: 'mobile',
  name: 'Mobile',
  viewportWidth: 375,
  viewportHeight: 667,
  pageWidth: 335,
  pageHeight: 607,
  pixelRatio: 3,
  dpi: 326,
  margins: {
    top: 30,
    right: 20,
    bottom: 30,
    left: 20,
  },
  headerFooter: {
    headerEnabled: false,
    headerHeight: 0,
    headerMarginTop: 0,
    footerEnabled: true,
    footerHeight: 20,
    footerMarginBottom: 10,
  },
  supportsSpread: false,
  orientation: 'portrait',
  cssClass: 'device-mobile',
};

/**
 * Print device profile (single page print)
 */
export const PRINT_PROFILE: DeviceProfile = {
  type: 'print',
  name: 'Print (6" × 9")',
  viewportWidth: 864,
  viewportHeight: 1296,
  pageWidth: 816,
  pageHeight: 1224,
  pixelRatio: 1,
  dpi: 300,
  margins: {
    top: 72,
    right: 54,
    bottom: 72,
    left: 54,
  },
  headerFooter: {
    headerEnabled: true,
    headerHeight: 24,
    headerMarginTop: 36,
    footerEnabled: true,
    footerHeight: 24,
    footerMarginBottom: 36,
  },
  supportsSpread: false,
  orientation: 'portrait',
  cssClass: 'device-print',
};

/**
 * Device profile registry mapping device types to their configurations
 */
export const DEVICE_PROFILES: Record<DeviceType, DeviceProfile> = {
  ipad: IPAD_PROFILE,
  kindle: KINDLE_PROFILE,
  iphone: IPHONE_PROFILE,
  'print-spread': PRINT_SPREAD_PROFILE,
  desktop: DESKTOP_PROFILE,
  tablet: TABLET_PROFILE,
  mobile: MOBILE_PROFILE,
  print: PRINT_PROFILE,
};

/**
 * Gets a device profile by device type
 *
 * @param {DeviceType} deviceType - The device type to retrieve
 * @returns {DeviceProfile} The device profile configuration
 * @throws {Error} If the device type is not found
 *
 * @example
 * ```typescript
 * const profile = getDeviceProfile('ipad');
 * console.log(profile.pageWidth); // 708
 * ```
 */
export function getDeviceProfile(deviceType: DeviceType): DeviceProfile {
  const profile = DEVICE_PROFILES[deviceType];
  if (!profile) {
    throw new Error(`Unknown device type: ${deviceType}`);
  }
  return { ...profile };
}

/**
 * Validates if a string is a valid device type
 *
 * @param {string} deviceType - The device type to validate
 * @returns {boolean} True if the device type is valid
 */
export function isValidDeviceType(deviceType: string): deviceType is DeviceType {
  return deviceType in DEVICE_PROFILES;
}

/**
 * Gets all available device types
 *
 * @returns {DeviceType[]} Array of all supported device types
 */
export function getAvailableDeviceTypes(): DeviceType[] {
  return Object.keys(DEVICE_PROFILES) as DeviceType[];
}

/**
 * Generates device-specific CSS including media queries, page sizing, and margin calculations
 *
 * @param {DeviceProfile} profile - The device profile to generate CSS for
 * @param {string} classPrefix - CSS class prefix for generated styles
 * @returns {string} Generated device-specific CSS
 *
 * @example
 * ```typescript
 * const profile = getDeviceProfile('ipad');
 * const css = generateDeviceCSS(profile, 'preview');
 * ```
 */
export function generateDeviceCSS(profile: DeviceProfile, classPrefix: string = 'preview'): string {
  const { margins, pageWidth, pageHeight, viewportWidth, headerFooter, cssClass, supportsSpread } = profile;

  const cssRules: string[] = [];

  // Base container styles with device class
  cssRules.push(`
.${classPrefix}-container.${cssClass} {
  max-width: ${pageWidth}px;
  min-height: ${pageHeight}px;
  margin: ${margins.top}px auto ${margins.bottom}px;
  padding: 0 ${margins.left}px 0 ${margins.right}px;
  box-sizing: border-box;
}`.trim());

  // Page dimensions for print/pagination
  cssRules.push(`
.${classPrefix}-container.${cssClass} .${classPrefix}-page {
  width: ${pageWidth}px;
  height: ${pageHeight}px;
  padding: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
  box-sizing: border-box;
  position: relative;
}`.trim());

  // Header styles if enabled
  if (headerFooter.headerEnabled) {
    cssRules.push(`
.${classPrefix}-container.${cssClass} .${classPrefix}-header {
  position: absolute;
  top: ${headerFooter.headerMarginTop}px;
  left: ${margins.left}px;
  right: ${margins.right}px;
  height: ${headerFooter.headerHeight}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85em;
  opacity: 0.7;
}`.trim());
  }

  // Footer styles if enabled
  if (headerFooter.footerEnabled) {
    cssRules.push(`
.${classPrefix}-container.${cssClass} .${classPrefix}-footer {
  position: absolute;
  bottom: ${headerFooter.footerMarginBottom}px;
  left: ${margins.left}px;
  right: ${margins.right}px;
  height: ${headerFooter.footerHeight}px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85em;
  opacity: 0.7;
}`.trim());
  }

  // Spread-specific styles for two-page layouts
  if (supportsSpread) {
    const spreadWidth = pageWidth * 2;
    const innerMargin = margins.inner || margins.left;
    const outerMargin = margins.outer || margins.right;

    cssRules.push(`
.${classPrefix}-container.${cssClass}.${classPrefix}-spread {
  max-width: ${spreadWidth}px;
  display: flex;
  gap: 0;
}

.${classPrefix}-container.${cssClass}.${classPrefix}-spread .${classPrefix}-page-left {
  width: ${pageWidth}px;
  padding-left: ${outerMargin}px;
  padding-right: ${innerMargin}px;
}

.${classPrefix}-container.${cssClass}.${classPrefix}-spread .${classPrefix}-page-right {
  width: ${pageWidth}px;
  padding-left: ${innerMargin}px;
  padding-right: ${outerMargin}px;
}`.trim());
  }

  // Responsive media query for smaller viewports
  cssRules.push(`
@media (max-width: ${viewportWidth}px) {
  .${classPrefix}-container.${cssClass} {
    max-width: 100%;
    margin: ${margins.top}px ${margins.left}px ${margins.bottom}px;
    padding: 0;
  }

  .${classPrefix}-container.${cssClass} .${classPrefix}-page {
    width: 100%;
    height: auto;
    padding: ${margins.top}px ${margins.left}px ${margins.bottom}px;
  }
}`.trim());

  // Print media query for print devices
  if (profile.type === 'print' || profile.type === 'print-spread') {
    cssRules.push(`
@media print {
  .${classPrefix}-container.${cssClass} {
    margin: 0;
    padding: 0;
  }

  .${classPrefix}-container.${cssClass} .${classPrefix}-page {
    width: ${pageWidth}px;
    height: ${pageHeight}px;
    page-break-after: always;
    page-break-inside: avoid;
  }

  @page {
    size: ${pageWidth}px ${pageHeight}px;
    margin: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
  }
}`.trim());
  }

  return cssRules.join('\n\n');
}

/**
 * Calculates the content area dimensions (excluding margins and headers/footers)
 *
 * @param {DeviceProfile} profile - The device profile
 * @returns {{ width: number; height: number }} Content area dimensions
 */
export function getContentAreaDimensions(profile: DeviceProfile): { width: number; height: number } {
  const { pageWidth, pageHeight, margins, headerFooter } = profile;

  const contentWidth = pageWidth - margins.left - margins.right;

  let contentHeight = pageHeight - margins.top - margins.bottom;
  if (headerFooter.headerEnabled) {
    contentHeight -= headerFooter.headerHeight + headerFooter.headerMarginTop;
  }
  if (headerFooter.footerEnabled) {
    contentHeight -= headerFooter.footerHeight + headerFooter.footerMarginBottom;
  }

  return {
    width: Math.max(0, contentWidth),
    height: Math.max(0, contentHeight),
  };
}

/**
 * Converts physical dimensions (inches) to pixels based on device DPI
 *
 * @param {number} inches - Dimension in inches
 * @param {number} dpi - Device DPI
 * @returns {number} Dimension in pixels
 */
export function inchesToPixels(inches: number, dpi: number): number {
  return Math.round(inches * dpi);
}

/**
 * Converts pixels to physical dimensions (inches) based on device DPI
 *
 * @param {number} pixels - Dimension in pixels
 * @param {number} dpi - Device DPI
 * @returns {number} Dimension in inches
 */
export function pixelsToInches(pixels: number, dpi: number): number {
  return pixels / dpi;
}

/**
 * Gets the optimal font size for a device based on its profile
 *
 * @param {DeviceProfile} profile - The device profile
 * @param {number} baseFontSize - Base font size in pixels (default: 16)
 * @returns {number} Optimal font size in pixels
 */
export function getOptimalFontSize(profile: DeviceProfile, baseFontSize: number = 16): number {
  // Adjust font size based on device DPI and pixel ratio
  const dpiScale = profile.dpi / 96; // 96 DPI is standard for web
  const pixelRatioScale = profile.pixelRatio;

  // Calculate optimal size (scale down for high DPI devices to maintain readability)
  const optimalSize = baseFontSize * Math.sqrt(dpiScale / pixelRatioScale);

  return Math.round(optimalSize * 100) / 100; // Round to 2 decimal places
}

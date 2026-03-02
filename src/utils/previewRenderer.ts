/**
 * Preview Renderer Module
 *
 * This module provides functionality to render book element previews with styling
 * for different device types. It generates HTML and CSS output suitable for
 * preview displays in the book publishing application.
 */

import { Element } from '../types/element';
import { BookStyle } from '../types/style';
import { transformElementToHtml, transformTextBlocks } from './contentTransformer';
import { generateCSS as generateStyleCSS, CSSGeneratorOptions } from './styleGenerator';
import {
  generateFontLoadingConfig,
  extractFontFamilies,
} from './fontLoader';

/**
 * Device type options for preview rendering
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'print';

/**
 * Configuration object for device-specific rendering dimensions and settings
 */
export interface DeviceConfig {
  /** Width of the preview viewport in pixels */
  width: number;
  /** Height of the preview viewport in pixels */
  height: number;
  /** Pixel density ratio for high-DPI displays */
  pixelRatio: number;
  /** Page width for pagination calculations */
  pageWidth?: number;
  /** Page height for pagination calculations */
  pageHeight?: number;
}

/**
 * Result object returned by the preview renderer
 */
export interface PreviewResult {
  /** Generated HTML content for the preview */
  html: string;
  /** Generated CSS styles for the preview */
  css: string;
  /** Estimated number of pages for the rendered content */
  pageCount: number;
  /** Google Fonts URL for loading fonts (if applicable) */
  googleFontsUrl?: string;
  /** Custom @font-face rules for custom fonts */
  fontFaceRules?: string;
}

/**
 * Options for customizing the rendering behavior
 */
export interface RenderOptions {
  /** Whether to include page breaks in the output */
  includePageBreaks?: boolean;
  /** Whether to generate print-optimized output */
  printOptimized?: boolean;
  /** Custom CSS class prefix for generated elements */
  classPrefix?: string;
  /** Whether to include inline styles in addition to CSS classes */
  useInlineStyles?: boolean;
}

/**
 * Device configuration presets for common device types
 */
const DEVICE_CONFIGS: Record<DeviceType, DeviceConfig> = {
  desktop: {
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    pageWidth: 816,
    pageHeight: 1056,
  },
  tablet: {
    width: 1024,
    height: 768,
    pixelRatio: 2,
    pageWidth: 768,
    pageHeight: 1024,
  },
  mobile: {
    width: 375,
    height: 667,
    pixelRatio: 3,
    pageWidth: 375,
    pageHeight: 667,
  },
  print: {
    width: 816,
    height: 1056,
    pixelRatio: 1,
    pageWidth: 816,
    pageHeight: 1056,
  },
};

/**
 * Renders a book element preview with the specified style configuration and device settings.
 *
 * This function takes book element content, applies the provided style configuration,
 * and generates HTML and CSS output optimized for the target device type. It also
 * estimates the page count based on the content and styling.
 *
 * @param {Element} elementData - The book element to render, including content and metadata
 * @param {BookStyle} styleConfig - Style configuration defining fonts, colors, spacing, and layout
 * @param {DeviceType} deviceType - Target device type for rendering optimization
 * @param {RenderOptions} [options] - Optional rendering customization options
 *
 * @returns {PreviewResult} An object containing the generated HTML, CSS, and page count
 *
 * @example
 * ```typescript
 * const element: Element = {
 *   id: '1',
 *   type: 'chapter',
 *   matter: 'body',
 *   title: 'Chapter 1',
 *   content: [{ ... }],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 *
 * const style: BookStyle = {
 *   id: 'classic',
 *   name: 'Classic',
 *   category: 'serif',
 *   // ... other style properties
 * };
 *
 * const result = renderPreview(element, style, 'desktop');
 * console.log(result.html); // Generated HTML
 * console.log(result.css);  // Generated CSS
 * console.log(result.pageCount); // Estimated pages
 * ```
 *
 * @throws {Error} If elementData or styleConfig is invalid or missing required properties
 *
 * @public
 */
export function renderPreview(
  elementData: Element,
  styleConfig: BookStyle,
  deviceType: DeviceType,
  options?: RenderOptions
): PreviewResult {
  // Validate input parameters
  if (!elementData) {
    throw new Error('elementData is required');
  }

  if (!styleConfig) {
    throw new Error('styleConfig is required');
  }

  if (!deviceType) {
    throw new Error('deviceType is required');
  }

  // Get device configuration
  const deviceConfig = DEVICE_CONFIGS[deviceType];
  if (!deviceConfig) {
    throw new Error(`Invalid deviceType: ${deviceType}`);
  }

  // Merge default options with provided options
  const renderOptions: Required<RenderOptions> = {
    includePageBreaks: options?.includePageBreaks ?? true,
    printOptimized: options?.printOptimized ?? deviceType === 'print',
    classPrefix: options?.classPrefix ?? 'preview',
    useInlineStyles: options?.useInlineStyles ?? false,
  };

  // Generate font loading configuration
  const fontConfig = generateFontLoadingConfig(styleConfig);

  // Generate HTML content
  const html = generateHTML(elementData, styleConfig, renderOptions);

  // Generate CSS styles (including font-face rules)
  const css = generateCSS(styleConfig, deviceConfig, renderOptions, fontConfig.fontFaceRules);

  // Calculate estimated page count
  const pageCount = calculatePageCount(elementData, styleConfig, deviceConfig);

  return {
    html,
    css,
    pageCount,
    googleFontsUrl: fontConfig.googleFontsUrl || undefined,
    fontFaceRules: fontConfig.fontFaceRules || undefined,
  };
}

/**
 * Generates HTML markup for the element content
 *
 * @param {Element} elementData - The element to render
 * @param {BookStyle} styleConfig - Style configuration
 * @param {Required<RenderOptions>} options - Rendering options
 * @returns {string} Generated HTML string
 * @private
 */
function generateHTML(
  elementData: Element,
  _styleConfig: BookStyle,
  options: Required<RenderOptions>
): string {
  const { classPrefix, useInlineStyles } = options;

  // Transform element to HTML using the content transformer
  const content = transformElementToHtml(elementData, {
    classPrefix,
    useInlineStyles,
    generateIds: true,
  });

  // Wrap in container
  return `
    <div class="${classPrefix}-container">
      ${content}
    </div>
  `.trim();
}

/**
 * Generates CSS styles based on the style configuration and device settings
 *
 * @param {BookStyle} styleConfig - Style configuration
 * @param {DeviceConfig} deviceConfig - Device configuration
 * @param {Required<RenderOptions>} options - Rendering options
 * @param {string} fontFaceRules - @font-face rules for custom fonts
 * @returns {string} Generated CSS string
 * @private
 */
function generateCSS(
  styleConfig: BookStyle,
  deviceConfig: DeviceConfig,
  options: Required<RenderOptions>,
  fontFaceRules: string = ''
): string {
  const { classPrefix, printOptimized } = options;

  // Use the styleGenerator to create comprehensive CSS
  const generatorOptions: CSSGeneratorOptions = {
    classPrefix,
    includePrintStyles: printOptimized,
    deviceWidth: deviceConfig.pageWidth || deviceConfig.width,
    minify: false,
  };

  const { css } = generateStyleCSS(styleConfig, generatorOptions);

  // Add device-specific adjustments
  const deviceSpecificCSS = `
.${classPrefix}-container {
  max-width: ${deviceConfig.pageWidth || deviceConfig.width}px;
  margin: 0 auto;
}

@media (max-width: ${deviceConfig.width}px) {
  .${classPrefix}-container {
    max-width: 100%;
    padding: 0 1rem;
  }
}
  `.trim();

  // Combine font-face rules (if any) with generated CSS and device-specific CSS
  const cssParts: string[] = [];

  if (fontFaceRules) {
    cssParts.push(fontFaceRules);
  }

  cssParts.push(css);
  cssParts.push(deviceSpecificCSS);

  return cssParts.join('\n\n');
}

/**
 * Calculates the estimated page count for the rendered content
 *
 * @param {Element} elementData - The element to measure
 * @param {BookStyle} styleConfig - Style configuration
 * @param {DeviceConfig} deviceConfig - Device configuration
 * @returns {number} Estimated number of pages
 * @private
 */
function calculatePageCount(
  elementData: Element,
  styleConfig: BookStyle,
  deviceConfig: DeviceConfig
): number {
  // Estimate page count based on content blocks and styling
  const contentBlocks = elementData.content?.length || 0;

  if (contentBlocks === 0) {
    return 1;
  }

  // Calculate average words per block
  let totalWords = 0;
  elementData.content?.forEach((block) => {
    const wordCount = block.content.split(/\s+/).filter((word) => word.length > 0).length;
    totalWords += wordCount;
  });

  // Estimate based on page dimensions and font size
  const fontSize = parseFloat(styleConfig.body.fontSize) || 16;
  const lineHeight = parseFloat(styleConfig.body.lineHeight) || 1.5;
  const pageHeight = deviceConfig.pageHeight || 1056;
  const pageWidth = deviceConfig.pageWidth || 816;

  // Calculate approximate lines per page
  const lineHeightPx = fontSize * lineHeight;
  const linesPerPage = Math.floor(pageHeight / lineHeightPx);

  // Estimate words per line based on average word length and font size
  const avgWordLength = 5; // average word length in characters
  const charsPerLine = Math.floor(pageWidth / (fontSize * 0.6));
  const wordsPerLine = Math.floor(charsPerLine / avgWordLength);
  const wordsPerPage = linesPerPage * wordsPerLine;

  // Calculate total pages
  const estimatedPages = Math.ceil(totalWords / wordsPerPage);

  return Math.max(1, estimatedPages);
}

/**
 * Escapes HTML special characters to prevent XSS vulnerabilities
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML insertion
 * @private
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Gets the device configuration for a specific device type
 *
 * @param {DeviceType} deviceType - The device type
 * @returns {DeviceConfig} Device configuration object
 * @public
 */
export function getDeviceConfig(deviceType: DeviceType): DeviceConfig {
  const config = DEVICE_CONFIGS[deviceType];
  if (!config) {
    throw new Error(`Invalid deviceType: ${deviceType}`);
  }
  return { ...config };
}

/**
 * Validates whether a device type is supported
 *
 * @param {string} deviceType - The device type to validate
 * @returns {boolean} True if the device type is valid
 * @public
 */
export function isValidDeviceType(deviceType: string): deviceType is DeviceType {
  return deviceType in DEVICE_CONFIGS;
}

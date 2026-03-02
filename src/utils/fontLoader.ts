/**
 * Font Loader Module
 *
 * Provides functionality for loading web fonts from various sources including
 * Google Fonts and custom font files. Handles @font-face generation, font URL
 * resolution, fallback chains, and font variant management.
 */

import { BookStyle } from '../types/style';

/**
 * Font source types
 */
export type FontSource = 'google' | 'custom' | 'system';

/**
 * Font weight variants
 */
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 'normal' | 'bold';

/**
 * Font style variants
 */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * Font format types for @font-face
 */
export type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf' | 'eot';

/**
 * Configuration for a single font variant
 */
export interface FontVariant {
  /** Font family name */
  family: string;
  /** Font weight */
  weight: FontWeight;
  /** Font style */
  style: FontStyle;
  /** URL to the font file */
  url?: string;
  /** Font format */
  format?: FontFormat;
}

/**
 * Configuration for a custom font file
 */
export interface CustomFontConfig {
  /** Font family name */
  family: string;
  /** Font weight */
  weight?: FontWeight;
  /** Font style */
  style?: FontStyle;
  /** Array of font file URLs with formats */
  sources: Array<{
    url: string;
    format: FontFormat;
  }>;
  /** Unicode range for subsetting */
  unicodeRange?: string;
  /** Font display strategy */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

/**
 * Result from font family extraction
 */
export interface ExtractedFont {
  /** Primary font family name (without quotes) */
  primary: string;
  /** Array of all font families in order */
  families: string[];
  /** Fallback chain as a CSS string */
  fallbackChain: string;
  /** Source type of the primary font */
  source: FontSource;
}

/**
 * Well-known Google Fonts (partial list of popular fonts)
 */
const GOOGLE_FONTS = new Set([
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'PT Sans',
  'Merriweather',
  'Playfair Display',
  'EB Garamond',
  'Cormorant Garamond',
  'Crimson Text',
  'Libre Baskerville',
  'Cinzel',
  'Tangerine',
  'Dancing Script',
  'Pacifico',
  'Source Sans Pro',
  'Source Serif Pro',
  'Noto Sans',
  'Noto Serif',
  'IBM Plex Sans',
  'IBM Plex Serif',
  'Inter',
  'Poppins',
  'Nunito',
]);

/**
 * System fonts that don't require loading
 */
const SYSTEM_FONTS = new Set([
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Times',
  'Courier New',
  'Courier',
  'Verdana',
  'Georgia',
  'Palatino',
  'Bookman',
  'Comic Sans MS',
  'Trebuchet MS',
  'Impact',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
]);

/**
 * Extracts and validates font family names from a font family string.
 * Parses comma-separated font names, removes quotes, and provides fallback information.
 *
 * @param {string} fontFamily - Font family string (e.g., "'Garamond', 'EB Garamond', serif")
 * @returns {ExtractedFont} Extracted font information with primary font and fallbacks
 *
 * @example
 * ```typescript
 * const result = extractFontFamilies("'Garamond', 'EB Garamond', serif");
 * console.log(result.primary); // "Garamond"
 * console.log(result.families); // ["Garamond", "EB Garamond", "serif"]
 * console.log(result.source); // "system"
 * ```
 */
export function extractFontFamilies(fontFamily: string): ExtractedFont {
  if (!fontFamily || typeof fontFamily !== 'string') {
    return {
      primary: 'serif',
      families: ['serif'],
      fallbackChain: 'serif',
      source: 'system',
    };
  }

  // Split by comma and clean up each font name
  const families = fontFamily
    .split(',')
    .map((font) => font.trim().replace(/^['"]|['"]$/g, ''))
    .filter((font) => font.length > 0);

  if (families.length === 0) {
    return {
      primary: 'serif',
      families: ['serif'],
      fallbackChain: 'serif',
      source: 'system',
    };
  }

  const primary = families[0];
  const source = determineFontSource(primary);

  return {
    primary,
    families,
    fallbackChain: families.map((f) => (needsQuotes(f) ? `'${f}'` : f)).join(', '),
    source,
  };
}

/**
 * Determines the source type of a font.
 *
 * @param {string} fontFamily - Font family name
 * @returns {FontSource} The source type of the font
 * @private
 */
function determineFontSource(fontFamily: string): FontSource {
  if (SYSTEM_FONTS.has(fontFamily)) {
    return 'system';
  }
  if (GOOGLE_FONTS.has(fontFamily)) {
    return 'google';
  }
  // Default to custom for unknown fonts
  return 'custom';
}

/**
 * Checks if a font family name needs quotes in CSS.
 *
 * @param {string} fontFamily - Font family name
 * @returns {boolean} True if the font name needs quotes
 * @private
 */
function needsQuotes(fontFamily: string): boolean {
  // Generic families don't need quotes
  if (
    ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(fontFamily)
  ) {
    return false;
  }
  // Font names with spaces or special characters need quotes
  return /[\s,]/.test(fontFamily);
}

/**
 * Extracts all unique font families from a BookStyle configuration.
 *
 * @param {BookStyle} styleConfig - The book style configuration
 * @returns {ExtractedFont[]} Array of extracted font information
 *
 * @example
 * ```typescript
 * const fonts = extractStyleFonts(bookStyle);
 * fonts.forEach(font => {
 *   if (font.source === 'google') {
 *     loadGoogleFont(font.primary);
 *   }
 * });
 * ```
 */
export function extractStyleFonts(styleConfig: BookStyle): ExtractedFont[] {
  const fontSet = new Set<string>();
  const extractedFonts: ExtractedFont[] = [];

  // Extract body font
  if (styleConfig.fonts.body) {
    fontSet.add(styleConfig.fonts.body);
  }

  // Extract heading font
  if (styleConfig.fonts.heading) {
    fontSet.add(styleConfig.fonts.heading);
  }

  // Extract script font
  if (styleConfig.fonts.script) {
    fontSet.add(styleConfig.fonts.script);
  }

  // Extract fonts from individual heading styles
  if (styleConfig.headings.h1?.fontFamily) {
    fontSet.add(styleConfig.headings.h1.fontFamily);
  }
  if (styleConfig.headings.h2?.fontFamily) {
    fontSet.add(styleConfig.headings.h2.fontFamily);
  }
  if (styleConfig.headings.h3?.fontFamily) {
    fontSet.add(styleConfig.headings.h3.fontFamily);
  }
  if (styleConfig.headings.h4?.fontFamily) {
    fontSet.add(styleConfig.headings.h4.fontFamily);
  }

  // Extract drop cap font
  if (styleConfig.dropCap?.fontFamily) {
    fontSet.add(styleConfig.dropCap.fontFamily);
  }

  // Process each unique font family string
  fontSet.forEach((fontFamily) => {
    const extracted = extractFontFamilies(fontFamily);
    extractedFonts.push(extracted);
  });

  return extractedFonts;
}

/**
 * Generates a Google Fonts URL for loading fonts.
 *
 * @param {string[]} fontFamilies - Array of font family names
 * @param {FontWeight[]} weights - Array of font weights to load
 * @param {FontStyle[]} styles - Array of font styles to load
 * @returns {string} Google Fonts URL
 *
 * @example
 * ```typescript
 * const url = generateGoogleFontsUrl(
 *   ['Garamond', 'EB Garamond'],
 *   [400, 500, 700],
 *   ['normal', 'italic']
 * );
 * // Returns: https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap
 * ```
 */
export function generateGoogleFontsUrl(
  fontFamilies: string[],
  weights: FontWeight[] = [400, 700],
  styles: FontStyle[] = ['normal', 'italic']
): string {
  const googleFonts = fontFamilies.filter((family) => GOOGLE_FONTS.has(family));

  if (googleFonts.length === 0) {
    return '';
  }

  const baseUrl = 'https://fonts.googleapis.com/css2';
  const params = new URLSearchParams();

  googleFonts.forEach((family) => {
    // Build weight and style combinations
    const variants: string[] = [];

    styles.forEach((style) => {
      const italValue = style === 'italic' ? '1' : '0';
      weights.forEach((weight) => {
        const weightValue = typeof weight === 'string' ? (weight === 'bold' ? 700 : 400) : weight;
        variants.push(`${italValue},${weightValue}`);
      });
    });

    // Format: family=Font+Name:ital,wght@0,400;0,700;1,400;1,700
    const familyParam = `${family.replace(/\s+/g, '+')}:ital,wght@${variants.join(';')}`;
    params.append('family', familyParam);
  });

  params.append('display', 'swap');

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates @font-face CSS rules for custom fonts.
 *
 * @param {CustomFontConfig} config - Custom font configuration
 * @returns {string} Generated @font-face CSS rule
 *
 * @example
 * ```typescript
 * const css = generateFontFaceRule({
 *   family: 'My Custom Font',
 *   weight: 400,
 *   style: 'normal',
 *   sources: [
 *     { url: '/fonts/custom.woff2', format: 'woff2' },
 *     { url: '/fonts/custom.woff', format: 'woff' }
 *   ],
 *   display: 'swap'
 * });
 * ```
 */
export function generateFontFaceRule(config: CustomFontConfig): string {
  const { family, weight = 400, style = 'normal', sources, unicodeRange, display = 'swap' } = config;

  const srcParts = sources.map((source) => {
    const format = source.format === 'ttf' ? 'truetype' : source.format;
    return `url('${source.url}') format('${format}')`;
  });

  const rules: string[] = [
    `  font-family: '${family}';`,
    `  font-style: ${style};`,
    `  font-weight: ${weight};`,
    `  font-display: ${display};`,
    `  src: ${srcParts.join(',\n       ')};`,
  ];

  if (unicodeRange) {
    rules.push(`  unicode-range: ${unicodeRange};`);
  }

  return `@font-face {\n${rules.join('\n')}\n}`;
}

/**
 * Generates @font-face CSS rules for multiple custom font variants.
 *
 * @param {CustomFontConfig[]} configs - Array of custom font configurations
 * @returns {string} Generated CSS with all @font-face rules
 *
 * @example
 * ```typescript
 * const css = generateFontFaceRules([
 *   { family: 'Custom', weight: 400, style: 'normal', sources: [...] },
 *   { family: 'Custom', weight: 700, style: 'normal', sources: [...] },
 * ]);
 * ```
 */
export function generateFontFaceRules(configs: CustomFontConfig[]): string {
  return configs.map((config) => generateFontFaceRule(config)).join('\n\n');
}

/**
 * Creates a font fallback chain with web-safe fallbacks.
 *
 * @param {string} primaryFont - Primary font family name
 * @param {BookStyleCategory} category - Font category
 * @returns {string} Complete font stack with fallbacks
 *
 * @example
 * ```typescript
 * const stack = createFontFallbackChain('Garamond', 'serif');
 * // Returns: "'Garamond', 'EB Garamond', 'Palatino', 'Georgia', 'Times New Roman', serif"
 * ```
 */
export function createFontFallbackChain(
  primaryFont: string,
  category: 'serif' | 'sans-serif' | 'script' | 'modern' | 'custom' = 'serif'
): string {
  const fonts: string[] = [];

  // Add primary font
  if (primaryFont && !SYSTEM_FONTS.has(primaryFont)) {
    fonts.push(needsQuotes(primaryFont) ? `'${primaryFont}'` : primaryFont);
  }

  // Add category-specific fallbacks
  switch (category) {
    case 'serif':
      fonts.push("'Palatino'", "'Georgia'", "'Times New Roman'", 'serif');
      break;
    case 'sans-serif':
    case 'modern':
      fonts.push(
        "'Helvetica Neue'",
        "'Helvetica'",
        "'Arial'",
        '-apple-system',
        'BlinkMacSystemFont',
        'sans-serif'
      );
      break;
    case 'script':
      fonts.push("'Brush Script MT'", "'Lucida Calligraphy'", 'cursive');
      break;
    case 'custom':
      fonts.push('sans-serif');
      break;
  }

  return fonts.join(', ');
}

/**
 * Resolves font URL based on the source type.
 *
 * @param {string} fontFamily - Font family name
 * @param {FontSource} source - Font source type
 * @param {string} baseUrl - Base URL for custom fonts
 * @returns {string} Resolved font URL or empty string for system fonts
 *
 * @example
 * ```typescript
 * const url = resolveFontUrl('Custom Font', 'custom', '/assets/fonts');
 * // Returns: "/assets/fonts/Custom-Font"
 * ```
 */
export function resolveFontUrl(
  fontFamily: string,
  source: FontSource,
  baseUrl: string = '/fonts'
): string {
  if (source === 'system') {
    return '';
  }

  if (source === 'google') {
    // Google Fonts are loaded via their CDN, not direct file URLs
    return generateGoogleFontsUrl([fontFamily]);
  }

  // Custom fonts - create a normalized file path
  const normalizedName = fontFamily.replace(/\s+/g, '-').toLowerCase();
  return `${baseUrl}/${normalizedName}`;
}

/**
 * Validates font family names to ensure they are safe for CSS.
 *
 * @param {string} fontFamily - Font family name to validate
 * @returns {boolean} True if the font family name is valid
 *
 * @example
 * ```typescript
 * validateFontFamily('Garamond'); // true
 * validateFontFamily(''); // false
 * validateFontFamily('Font<script>alert(1)</script>'); // false
 * ```
 */
export function validateFontFamily(fontFamily: string): boolean {
  if (!fontFamily || typeof fontFamily !== 'string') {
    return false;
  }

  // Check for dangerous characters that could lead to CSS injection
  const dangerousChars = /[<>{}();:]/;
  if (dangerousChars.test(fontFamily)) {
    return false;
  }

  // Font names should only contain letters, numbers, spaces, hyphens, and quotes
  const validPattern = /^['"\w\s\-,]+$/;
  return validPattern.test(fontFamily);
}

/**
 * Parses font weight from various formats to a numeric value.
 *
 * @param {FontWeight | string} weight - Font weight in various formats
 * @returns {number} Numeric font weight (100-900)
 *
 * @example
 * ```typescript
 * parseFontWeight('bold'); // 700
 * parseFontWeight('normal'); // 400
 * parseFontWeight('600'); // 600
 * parseFontWeight(500); // 500
 * ```
 */
export function parseFontWeight(weight: FontWeight | string | undefined): number {
  if (!weight) {
    return 400;
  }

  if (typeof weight === 'number') {
    return Math.max(100, Math.min(900, weight));
  }

  const weightMap: Record<string, number> = {
    normal: 400,
    bold: 700,
    lighter: 300,
    bolder: 700,
  };

  const numericWeight = parseInt(weight, 10);
  if (!isNaN(numericWeight)) {
    return Math.max(100, Math.min(900, numericWeight));
  }

  return weightMap[weight.toLowerCase()] || 400;
}

/**
 * Generates a complete font loading configuration from a BookStyle.
 * Includes Google Fonts URLs and @font-face rules for custom fonts.
 *
 * @param {BookStyle} styleConfig - Book style configuration
 * @param {CustomFontConfig[]} customFonts - Optional custom font configurations
 * @returns {Object} Font loading configuration with URLs and CSS
 *
 * @example
 * ```typescript
 * const config = generateFontLoadingConfig(bookStyle, customFonts);
 * // Add Google Fonts link to document
 * if (config.googleFontsUrl) {
 *   const link = document.createElement('link');
 *   link.href = config.googleFontsUrl;
 *   link.rel = 'stylesheet';
 *   document.head.appendChild(link);
 * }
 * // Add custom font CSS
 * if (config.fontFaceRules) {
 *   const style = document.createElement('style');
 *   style.textContent = config.fontFaceRules;
 *   document.head.appendChild(style);
 * }
 * ```
 */
export function generateFontLoadingConfig(
  styleConfig: BookStyle,
  customFonts: CustomFontConfig[] = []
): {
  googleFontsUrl: string;
  fontFaceRules: string;
  fonts: ExtractedFont[];
} {
  // Extract all fonts from the style configuration
  const extractedFonts = extractStyleFonts(styleConfig);

  // Collect Google Fonts
  const googleFontFamilies: string[] = [];
  extractedFonts.forEach((font) => {
    font.families.forEach((family) => {
      if (GOOGLE_FONTS.has(family) && !googleFontFamilies.includes(family)) {
        googleFontFamilies.push(family);
      }
    });
  });

  // Generate Google Fonts URL
  const weights: FontWeight[] = [300, 400, 500, 600, 700];
  const styles: FontStyle[] = ['normal', 'italic'];
  const googleFontsUrl = generateGoogleFontsUrl(googleFontFamilies, weights, styles);

  // Generate @font-face rules for custom fonts
  const fontFaceRules = generateFontFaceRules(customFonts);

  return {
    googleFontsUrl,
    fontFaceRules,
    fonts: extractedFonts,
  };
}

/**
 * Preloads a font by creating a link element with rel="preload".
 * This improves performance by starting the font download earlier.
 *
 * @param {string} fontUrl - URL to the font file
 * @param {FontFormat} format - Font format
 * @returns {HTMLLinkElement} The created link element
 *
 * @example
 * ```typescript
 * const link = preloadFont('/fonts/custom.woff2', 'woff2');
 * document.head.appendChild(link);
 * ```
 */
export function preloadFont(fontUrl: string, format: FontFormat = 'woff2'): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = `font/${format}`;
  link.href = fontUrl;
  link.crossOrigin = 'anonymous';
  return link;
}

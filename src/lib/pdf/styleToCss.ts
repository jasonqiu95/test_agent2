/**
 * Style to CSS converter for book PDF generation
 * Converts BookStyle configuration to CSS string for print-ready PDFs
 */

import type { BookStyle, StyleToCssOptions } from './types';
import { calculatePageDimensions, toPoints, type Unit } from './pageGeometry';
import type { Margins } from './marginCalculator';

/**
 * Converts a BookStyle configuration to a complete CSS string
 *
 * This function generates CSS rules for all aspects of book typography
 * including fonts, headings, drop caps, ornamental breaks, and body text.
 * The generated CSS is optimized for print-ready PDF generation.
 *
 * @param style - The book style configuration
 * @param options - Conversion options including trim size and margins
 * @returns Complete CSS string ready for PDF generation
 *
 * @example
 * ```typescript
 * const style: BookStyle = {
 *   fonts: {
 *     body: { family: 'Garamond', size: 11, lineHeight: 1.5 },
 *     heading: { family: 'Helvetica', size: 18, weight: 'bold' },
 *     chapter: { family: 'Helvetica', size: 24, weight: 'bold' }
 *   },
 *   headings: {
 *     h1: { fontSize: 24, textAlign: 'center', marginBottom: 1 }
 *   },
 *   bodyText: {
 *     fontSize: 11,
 *     lineHeight: 1.5,
 *     textAlign: 'justify',
 *     textIndent: 0.25
 *   }
 * };
 *
 * const options: StyleToCssOptions = {
 *   trimSize: '6x9',
 *   margins: { top: 0.75, bottom: 0.75, left: 1, right: 0.75 }
 * };
 *
 * const css = convertStyleToCss(style, options);
 * ```
 */
export function convertStyleToCss(
  style: BookStyle,
  options: StyleToCssOptions
): string {
  const cssRules: string[] = [];

  // Add CSS reset if requested
  if (options.includeResetStyles !== false) {
    cssRules.push(generateResetStyles());
  }

  // Add @page rules for print if requested
  if (options.includePagedMedia !== false) {
    cssRules.push(generatePageStyles(options));
  }

  // Generate font rules
  cssRules.push(generateFontStyles(style.fonts));

  // Generate body text styles
  cssRules.push(generateBodyTextStyles(style.bodyText));

  // Generate heading styles
  cssRules.push(generateHeadingStyles(style.headings));

  // Generate drop cap styles if enabled
  if (style.dropCaps?.enabled) {
    cssRules.push(generateDropCapStyles(style.dropCaps));
  }

  // Generate first paragraph styles if enabled
  if (style.firstParagraph?.enabled) {
    cssRules.push(generateFirstParagraphStyles(style.firstParagraph));
  }

  // Generate ornamental break styles if enabled
  if (style.ornamentalBreaks?.enabled) {
    cssRules.push(generateOrnamentalBreakStyles(style.ornamentalBreaks));
  }

  // Add custom CSS if provided
  if (options.customCSS) {
    cssRules.push(options.customCSS);
  }

  return cssRules.filter(Boolean).join('\n\n');
}

/**
 * Generates CSS reset styles for consistent rendering
 */
function generateResetStyles(): string {
  return `/* CSS Reset for consistent rendering */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}`;
}

/**
 * Generates @page rules for print media
 */
function generatePageStyles(options: StyleToCssOptions): string {
  const pageDimensions = calculatePageDimensions(options.trimSize);
  const margins = options.margins as Margins;
  const unit = options.unit || 'pt';

  return `/* Page configuration for print */
@page {
  size: ${pageDimensions.width}pt ${pageDimensions.height}pt;
  margin-top: ${formatUnit(margins.top, 'in', unit)};
  margin-bottom: ${formatUnit(margins.bottom, 'in', unit)};
  margin-left: ${formatUnit(margins.left, 'in', unit)};
  margin-right: ${formatUnit(margins.right, 'in', unit)};
}`;
}

/**
 * Generates font-related CSS rules
 */
function generateFontStyles(fonts: BookStyle['fonts']): string {
  return `/* Font configuration */
body {
  font-family: ${fonts.body.family};
  font-size: ${fonts.body.size}pt;
  font-weight: ${fonts.body.weight || 'normal'};
  font-style: ${fonts.body.style || 'normal'};
  line-height: ${fonts.body.lineHeight || 1.5};
  ${fonts.body.letterSpacing ? `letter-spacing: ${fonts.body.letterSpacing}em;` : ''}
}`;
}

/**
 * Generates body text CSS rules
 */
function generateBodyTextStyles(bodyText: BookStyle['bodyText']): string {
  const rules: string[] = ['/* Body text styles */', 'p {'];

  rules.push(`  font-size: ${bodyText.fontSize}pt;`);
  rules.push(`  line-height: ${bodyText.lineHeight};`);

  if (bodyText.textAlign) {
    rules.push(`  text-align: ${bodyText.textAlign};`);
  }

  if (bodyText.textIndent) {
    rules.push(`  text-indent: ${bodyText.textIndent}in;`);
  }

  if (bodyText.paragraphSpacing) {
    rules.push(`  margin-bottom: ${bodyText.paragraphSpacing}em;`);
  }

  if (bodyText.hyphenation) {
    rules.push(`  hyphens: auto;`);
    rules.push(`  -webkit-hyphens: auto;`);
  }

  if (bodyText.orphans) {
    rules.push(`  orphans: ${bodyText.orphans};`);
  }

  if (bodyText.widows) {
    rules.push(`  widows: ${bodyText.widows};`);
  }

  if (bodyText.color) {
    rules.push(`  color: ${bodyText.color};`);
  }

  if (bodyText.fontFamily) {
    rules.push(`  font-family: ${bodyText.fontFamily};`);
  }

  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates heading CSS rules
 */
function generateHeadingStyles(headings: BookStyle['headings']): string {
  const rules: string[] = ['/* Heading styles */'];

  const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

  for (const level of headingLevels) {
    const heading = headings[level];
    if (heading) {
      rules.push(formatHeadingRule(level, heading));
    }
  }

  // Chapter and section titles
  if (headings.chapterTitle) {
    rules.push(formatHeadingRule('.chapter-title', headings.chapterTitle));
  }

  if (headings.sectionTitle) {
    rules.push(formatHeadingRule('.section-title', headings.sectionTitle));
  }

  return rules.join('\n\n');
}

/**
 * Formats a single heading rule
 */
function formatHeadingRule(selector: string, style: BookStyle['headings'][keyof BookStyle['headings']]): string {
  if (!style) return '';

  const rules: string[] = [`${selector} {`];

  rules.push(`  font-size: ${style.fontSize}pt;`);

  if (style.fontWeight) {
    rules.push(`  font-weight: ${style.fontWeight};`);
  }

  if (style.fontFamily) {
    rules.push(`  font-family: ${style.fontFamily};`);
  }

  if (style.textTransform) {
    rules.push(`  text-transform: ${style.textTransform};`);
  }

  if (style.marginTop) {
    rules.push(`  margin-top: ${style.marginTop}em;`);
  }

  if (style.marginBottom) {
    rules.push(`  margin-bottom: ${style.marginBottom}em;`);
  }

  if (style.textAlign) {
    rules.push(`  text-align: ${style.textAlign};`);
  }

  if (style.lineHeight) {
    rules.push(`  line-height: ${style.lineHeight};`);
  }

  if (style.letterSpacing) {
    rules.push(`  letter-spacing: ${style.letterSpacing}em;`);
  }

  if (style.color) {
    rules.push(`  color: ${style.color};`);
  }

  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates drop cap CSS rules
 */
function generateDropCapStyles(dropCaps: BookStyle['dropCaps']): string {
  if (!dropCaps) return '';

  const rules: string[] = ['/* Drop cap styles */', '.drop-cap::first-letter {'];

  rules.push(`  float: ${dropCaps.float || 'left'};`);
  rules.push(`  font-size: ${dropCaps.fontSize || dropCaps.lines ? dropCaps.lines * 1.5 : 3}em;`);
  rules.push(`  line-height: ${dropCaps.lines || 2};`);
  rules.push(`  margin-right: ${dropCaps.marginRight || 0.1}em;`);

  if (dropCaps.fontFamily) {
    rules.push(`  font-family: ${dropCaps.fontFamily};`);
  }

  if (dropCaps.fontWeight) {
    rules.push(`  font-weight: ${dropCaps.fontWeight};`);
  }

  if (dropCaps.color) {
    rules.push(`  color: ${dropCaps.color};`);
  }

  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates first paragraph CSS rules
 */
function generateFirstParagraphStyles(firstPara: BookStyle['firstParagraph']): string {
  if (!firstPara) return '';

  const rules: string[] = ['/* First paragraph styles */', '.first-paragraph {'];

  if (firstPara.textTransform) {
    rules.push(`  text-transform: ${firstPara.textTransform};`);
  }

  if (firstPara.fontSize) {
    rules.push(`  font-size: ${firstPara.fontSize}pt;`);
  }

  if (firstPara.fontWeight) {
    rules.push(`  font-weight: ${firstPara.fontWeight};`);
  }

  if (firstPara.letterSpacing) {
    rules.push(`  letter-spacing: ${firstPara.letterSpacing}em;`);
  }

  if (firstPara.marginBottom) {
    rules.push(`  margin-bottom: ${firstPara.marginBottom}em;`);
  }

  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates ornamental break CSS rules
 *
 * Creates CSS for ornamental/scene breaks that can be styled with different
 * characters (asterisks, dingbats, custom symbols), sizes, spacing, and alignment.
 * Supports both .scene-break and hr elements.
 *
 * @param breaks - Ornamental break configuration
 * @returns CSS string for ornamental break rules
 */
function generateOrnamentalBreakStyles(breaks: BookStyle['ornamentalBreaks']): string {
  if (!breaks) return '';

  const rules: string[] = ['/* Ornamental break styles */'];

  // Default values
  const alignment = breaks.textAlign || 'center';
  const marginTop = breaks.marginTop ?? 1;
  const marginBottom = breaks.marginBottom ?? 1;
  const character = breaks.character || '* * *';

  // Base styles for both .scene-break and hr elements
  const baseStyles = [
    `  text-align: ${alignment};`,
    `  margin-top: ${marginTop}em;`,
    `  margin-bottom: ${marginBottom}em;`,
    `  display: block;`,
    `  width: 100%;`
  ];

  if (breaks.fontSize) {
    baseStyles.push(`  font-size: ${breaks.fontSize}pt;`);
  }

  if (breaks.color) {
    baseStyles.push(`  color: ${breaks.color};`);
  }

  // Styles for .scene-break class
  rules.push('.scene-break {');
  rules.push(...baseStyles);
  rules.push('}');
  rules.push('');

  // Styles for hr elements (horizontal rules used as scene breaks)
  rules.push('hr.scene-break {');
  rules.push(`  border: none;`);
  rules.push(`  background: none;`);
  rules.push(`  height: auto;`);
  rules.push(...baseStyles);
  rules.push('}');

  // Add ::before pseudo-element with the ornamental character
  rules.push('');
  rules.push('.scene-break::before,');
  rules.push('hr.scene-break::before {');
  rules.push(`  content: '${escapeForCss(character)}';`);
  rules.push(`  display: block;`);

  // Add letter-spacing for multiple character symbols (e.g., "* * *")
  if (character.length > 1) {
    rules.push(`  letter-spacing: 0.2em;`);
  }

  rules.push('}');

  return rules.join('\n');
}

/**
 * Escapes special characters for use in CSS content property
 *
 * @param str - String to escape
 * @returns Escaped string safe for CSS
 */
function escapeForCss(str: string): string {
  // Escape single quotes and backslashes for CSS content property
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Formats a dimension value with unit conversion
 */
function formatUnit(value: number, fromUnit: Unit, toUnit: Unit): string {
  if (fromUnit === toUnit) {
    return `${value}${toUnit}`;
  }

  const points = toPoints(value, fromUnit);
  const converted = fromUnit === 'in' ? points : value;

  return `${converted}${toUnit}`;
}

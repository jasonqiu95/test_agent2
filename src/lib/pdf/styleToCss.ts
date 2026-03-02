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

  // Add print optimizations
  cssRules.push(generatePrintOptimizations());

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
 *
 * Creates CSS for drop cap styling using the ::first-letter pseudo-element.
 * Applies to the first paragraph after chapter headings and supports
 * different drop cap heights (2-5 lines).
 *
 * @param dropCaps - Drop cap configuration from BookStyle
 * @returns CSS string for drop cap rules
 */
function generateDropCapStyles(dropCaps: BookStyle['dropCaps']): string {
  if (!dropCaps) return '';

  const rules: string[] = ['/* Drop cap styles */'];

  // Calculate font size based on number of lines (2-5 lines)
  // Default to 3 lines if not specified
  const lines = dropCaps.lines && dropCaps.lines >= 2 && dropCaps.lines <= 5
    ? dropCaps.lines
    : 3;

  // Calculate appropriate font size for the drop cap
  // Use custom fontSize if provided, otherwise calculate based on lines
  const fontSize = dropCaps.fontSize
    ? `${dropCaps.fontSize}pt`
    : `${lines * 1.6}em`;

  // Apply to first paragraph after chapter heading (.first-paragraph class)
  rules.push('.first-paragraph::first-letter,');
  rules.push('.drop-cap::first-letter {');
  rules.push(`  float: ${dropCaps.float || 'left'};`);
  rules.push(`  font-size: ${fontSize};`);
  rules.push(`  line-height: ${lines === 2 ? 0.8 : lines === 3 ? 0.85 : lines === 4 ? 0.9 : 0.9};`);
  rules.push(`  margin-right: ${dropCaps.marginRight || 0.1}em;`);
  rules.push(`  margin-top: ${lines === 2 ? '0.05em' : '0.08em'};`);

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

  // Apply to p:first-of-type (alternative selector for first paragraph after headings)
  rules.push('');
  rules.push('/* First paragraph after chapter heading */');
  rules.push('h1 + p::first-letter,');
  rules.push('h2 + p::first-letter,');
  rules.push('.chapter-title + p::first-letter {');
  rules.push(`  float: ${dropCaps.float || 'left'};`);
  rules.push(`  font-size: ${fontSize};`);
  rules.push(`  line-height: ${lines === 2 ? 0.8 : lines === 3 ? 0.85 : lines === 4 ? 0.9 : 0.9};`);
  rules.push(`  margin-right: ${dropCaps.marginRight || 0.1}em;`);
  rules.push(`  margin-top: ${lines === 2 ? '0.05em' : '0.08em'};`);

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
 * Targets first paragraph after headings with special styling
 */
function generateFirstParagraphStyles(firstPara: BookStyle['firstParagraph']): string {
  if (!firstPara) return '';

  const rules: string[] = ['/* First paragraph styles */'];

  // Target first paragraphs after headings
  const selectors = [
    'h1 + p',
    'h2 + p',
    'h3 + p',
    'h4 + p',
    'h5 + p',
    'h6 + p',
    '.chapter-title + p',
    '.section-title + p'
  ];

  rules.push(`${selectors.join(',\n')} {`);

  // Remove text indent for first paragraphs
  rules.push(`  text-indent: 0;`);

  // Handle small caps via font-variant or text-transform
  if (firstPara.textTransform === 'small-caps') {
    rules.push(`  font-variant: small-caps;`);
  } else if (firstPara.textTransform) {
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

  // Handle partial small-caps (first N words) if specified
  if (firstPara.smallCapsWords && firstPara.smallCapsWords > 0) {
    rules.push('');
    rules.push('/* Apply small-caps to first words only */');
    rules.push(`${selectors.join(',\n')}::first-line {`);
    rules.push(`  font-variant: small-caps;`);
    rules.push('}');
  }

  return rules.join('\n');
}

/**
 * Generates ornamental break CSS rules
 */
function generateOrnamentalBreakStyles(breaks: BookStyle['ornamentalBreaks']): string {
  if (!breaks) return '';

  const rules: string[] = ['/* Ornamental break styles */', '.ornamental-break {'];

  rules.push(`  text-align: ${breaks.textAlign || 'center'};`);
  rules.push(`  margin-top: ${breaks.marginTop || 1}em;`);
  rules.push(`  margin-bottom: ${breaks.marginBottom || 1}em;`);

  if (breaks.fontSize) {
    rules.push(`  font-size: ${breaks.fontSize}pt;`);
  }

  if (breaks.color) {
    rules.push(`  color: ${breaks.color};`);
  }

  rules.push('}');

  // Add ::before pseudo-element if character is specified
  if (breaks.character) {
    rules.push('');
    rules.push('.ornamental-break::before {');
    rules.push(`  content: '${breaks.character}';`);
    rules.push('}');
  }

  return rules.join('\n');
}

/**
 * Generates print-specific CSS optimizations
 * Wraps all print-specific rules in @media print query
 */
function generatePrintOptimizations(): string {
  const rules: string[] = ['/* Print optimizations */'];

  rules.push('@media print {');
  rules.push('  /* Hide screen-only elements */');
  rules.push('  .no-print,');
  rules.push('  .screen-only {');
  rules.push('    display: none !important;');
  rules.push('  }');
  rules.push('');
  rules.push('  /* Preserve colors for print */');
  rules.push('  * {');
  rules.push('    color-adjust: exact;');
  rules.push('    -webkit-print-color-adjust: exact;');
  rules.push('    print-color-adjust: exact;');
  rules.push('  }');
  rules.push('');
  rules.push('  /* Optimize text rendering for print */');
  rules.push('  body {');
  rules.push('    text-rendering: optimizeLegibility;');
  rules.push('    -webkit-font-smoothing: antialiased;');
  rules.push('    -moz-osx-font-smoothing: grayscale;');
  rules.push('  }');
  rules.push('');
  rules.push('  /* Prevent page breaks inside elements */');
  rules.push('  h1, h2, h3, h4, h5, h6 {');
  rules.push('    page-break-after: avoid;');
  rules.push('    break-after: avoid;');
  rules.push('  }');
  rules.push('');
  rules.push('  p, blockquote {');
  rules.push('    page-break-inside: avoid;');
  rules.push('    break-inside: avoid;');
  rules.push('  }');
  rules.push('');
  rules.push('  /* Ensure images fit on page */');
  rules.push('  img {');
  rules.push('    max-width: 100%;');
  rules.push('    page-break-inside: avoid;');
  rules.push('    break-inside: avoid;');
  rules.push('  }');
  rules.push('}');

  return rules.join('\n');
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

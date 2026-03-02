/**
 * Style Generator Module
 *
 * This module provides functionality to convert style configuration objects
 * into complete CSS stylesheets. It handles typography, headings, drop caps,
 * first paragraph treatment, ornamental breaks, spacing, colors, and supports
 * style inheritance and cascading.
 */

import { BookStyle, HeadingStyle, DropCapStyle, FirstParagraphStyle } from '../types/style';
import { ElementType } from '../types/element';

/**
 * Options for CSS generation
 */
export interface CSSGeneratorOptions {
  /** CSS class prefix for generated classes */
  classPrefix?: string;
  /** Whether to include print-specific styles */
  includePrintStyles?: boolean;
  /** Device width for responsive calculations */
  deviceWidth?: number;
  /** Whether to minify the output CSS */
  minify?: boolean;
}

/**
 * Result of CSS generation
 */
export interface CSSGenerationResult {
  /** Generated CSS string */
  css: string;
  /** Map of element types to their CSS class names */
  classMap: Record<string, string>;
  /** CSS custom properties (CSS variables) */
  customProperties: Record<string, string>;
}

/**
 * Generates complete CSS stylesheet from a BookStyle configuration
 *
 * @param {BookStyle} styleConfig - The style configuration object
 * @param {CSSGeneratorOptions} [options] - Optional CSS generation options
 * @returns {CSSGenerationResult} Generated CSS and related metadata
 *
 * @example
 * ```typescript
 * const style: BookStyle = {
 *   id: 'classic',
 *   name: 'Classic',
 *   category: 'serif',
 *   fonts: { body: 'Georgia', heading: 'Garamond', fallback: 'serif' },
 *   // ... other config
 * };
 *
 * const result = generateCSS(style, { classPrefix: 'book' });
 * console.log(result.css); // Full CSS stylesheet
 * ```
 */
export function generateCSS(
  styleConfig: BookStyle,
  options: CSSGeneratorOptions = {}
): CSSGenerationResult {
  const {
    classPrefix = 'book',
    includePrintStyles = false,
    minify = false,
  } = options;

  const customProperties = generateCustomProperties(styleConfig);
  const classMap = generateClassMap(classPrefix);

  const cssRules: string[] = [];

  // Root CSS custom properties
  cssRules.push(generateRootVariables(customProperties));

  // Base typography
  cssRules.push(generateBaseTypography(styleConfig, classPrefix));

  // Heading styles
  cssRules.push(generateHeadingStyles(styleConfig, classPrefix));

  // Paragraph styles
  cssRules.push(generateParagraphStyles(styleConfig, classPrefix));

  // Drop cap styles
  if (styleConfig.dropCap.enabled) {
    cssRules.push(generateDropCapStyles(styleConfig.dropCap, classPrefix));
  }

  // First paragraph styles
  if (styleConfig.firstParagraph.enabled) {
    cssRules.push(generateFirstParagraphStyles(styleConfig.firstParagraph, classPrefix));
  }

  // Ornamental break styles
  if (styleConfig.ornamentalBreak.enabled) {
    cssRules.push(generateOrnamentalBreakStyles(styleConfig.ornamentalBreak, classPrefix));
  }

  // Element-specific styles
  cssRules.push(generateElementStyles(styleConfig, classPrefix));

  // Spacing and layout
  cssRules.push(generateSpacingStyles(styleConfig, classPrefix));

  // Color scheme
  cssRules.push(generateColorStyles(styleConfig, classPrefix));

  // Print styles
  if (includePrintStyles) {
    cssRules.push(generatePrintStyles(styleConfig, classPrefix));
  }

  const css = minify ? minifyCSS(cssRules.join('\n\n')) : cssRules.join('\n\n');

  return {
    css,
    classMap,
    customProperties,
  };
}

/**
 * Generates CSS custom properties from the style configuration
 */
function generateCustomProperties(styleConfig: BookStyle): Record<string, string> {
  const { fonts, body, spacing, colors } = styleConfig;

  return {
    '--font-body': `${fonts.body}, ${fonts.fallback}`,
    '--font-heading': `${fonts.heading}, ${fonts.fallback}`,
    '--font-script': fonts.script ? `${fonts.script}, ${fonts.fallback}` : fonts.body,
    '--font-size-base': body.fontSize,
    '--line-height-base': body.lineHeight,
    '--font-weight-body': body.fontWeight || 'normal',
    '--color-text': colors.text,
    '--color-heading': colors.heading,
    '--color-accent': colors.accent || colors.text,
    '--color-background': colors.background || '#ffffff',
    '--color-drop-cap': colors.dropCap || colors.accent || colors.heading,
    '--spacing-paragraph': spacing.paragraphSpacing,
    '--spacing-line': spacing.lineHeight,
    '--spacing-section': spacing.sectionSpacing,
    '--spacing-chapter': spacing.chapterSpacing,
  };
}

/**
 * Generates a map of element types to CSS class names
 */
function generateClassMap(classPrefix: string): Record<string, string> {
  const elementTypes: ElementType[] = [
    'title-page',
    'copyright',
    'dedication',
    'epigraph',
    'foreword',
    'preface',
    'acknowledgments',
    'introduction',
    'prologue',
    'epilogue',
    'afterword',
    'appendix',
    'glossary',
    'bibliography',
    'index',
    'about-author',
    'also-by',
    'other',
  ];

  const classMap: Record<string, string> = {
    container: `${classPrefix}-container`,
    element: `${classPrefix}-element`,
    title: `${classPrefix}-title`,
    content: `${classPrefix}-content`,
    paragraph: `${classPrefix}-paragraph`,
    'drop-cap': `${classPrefix}-drop-cap`,
    'first-paragraph': `${classPrefix}-first-paragraph`,
    'ornamental-break': `${classPrefix}-ornamental-break`,
  };

  elementTypes.forEach((type) => {
    classMap[type] = `${classPrefix}-${type}`;
  });

  return classMap;
}

/**
 * Generates the :root CSS variables declaration
 */
function generateRootVariables(customProperties: Record<string, string>): string {
  const declarations = Object.entries(customProperties)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `:root {\n${declarations}\n}`;
}

/**
 * Generates base typography CSS rules
 */
function generateBaseTypography(styleConfig: BookStyle, classPrefix: string): string {
  const { body } = styleConfig;

  return `
.${classPrefix}-container {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  font-weight: var(--font-weight-body);
  color: var(--color-text);
  background-color: var(--color-background);
  text-align: ${body.textAlign || 'left'};
}

.${classPrefix}-element {
  max-width: 100%;
  margin: 0 auto;
}`.trim();
}

/**
 * Generates heading styles for h1-h4
 */
function generateHeadingStyles(styleConfig: BookStyle, classPrefix: string): string {
  const { headings } = styleConfig;
  const rules: string[] = [];

  // H1
  rules.push(generateSingleHeadingStyle('h1', headings.h1, classPrefix));

  // H2
  rules.push(generateSingleHeadingStyle('h2', headings.h2, classPrefix));

  // H3
  rules.push(generateSingleHeadingStyle('h3', headings.h3, classPrefix));

  // H4 (optional)
  if (headings.h4) {
    rules.push(generateSingleHeadingStyle('h4', headings.h4, classPrefix));
  }

  // Common heading styles
  rules.push(`
.${classPrefix}-title,
.${classPrefix}-content h1,
.${classPrefix}-content h2,
.${classPrefix}-content h3,
.${classPrefix}-content h4 {
  font-family: var(--font-heading);
  color: var(--color-heading);
}`.trim());

  return rules.join('\n\n');
}

/**
 * Generates CSS for a single heading level
 */
function generateSingleHeadingStyle(
  level: string,
  style: HeadingStyle,
  classPrefix: string
): string {
  const selector = `.${classPrefix}-content ${level}`;
  const declarations: string[] = [];

  if (style.fontFamily) {
    declarations.push(`font-family: ${style.fontFamily}, var(--font-heading)`);
  }
  declarations.push(`font-size: ${style.fontSize}`);

  if (style.fontWeight) {
    declarations.push(`font-weight: ${style.fontWeight}`);
  }
  if (style.lineHeight) {
    declarations.push(`line-height: ${style.lineHeight}`);
  }
  if (style.marginTop) {
    declarations.push(`margin-top: ${style.marginTop}`);
  }
  if (style.marginBottom) {
    declarations.push(`margin-bottom: ${style.marginBottom}`);
  }
  if (style.textTransform && style.textTransform !== 'none') {
    declarations.push(`text-transform: ${style.textTransform}`);
  }
  if (style.letterSpacing) {
    declarations.push(`letter-spacing: ${style.letterSpacing}`);
  }
  if (style.color) {
    declarations.push(`color: ${style.color}`);
  }

  return `${selector} {\n  ${declarations.join(';\n  ')};\n}`;
}

/**
 * Generates paragraph styles
 */
function generateParagraphStyles(_styleConfig: BookStyle, classPrefix: string): string {
  return `
.${classPrefix}-content p,
.${classPrefix}-paragraph {
  margin-bottom: var(--spacing-paragraph);
  line-height: var(--line-height-base);
  text-indent: 0;
}

.${classPrefix}-content p + p {
  text-indent: 1.5em;
  margin-top: 0;
}`.trim();
}

/**
 * Generates drop cap styles
 */
function generateDropCapStyles(dropCap: DropCapStyle, classPrefix: string): string {
  const declarations: string[] = [
    `float: left`,
    `font-size: ${dropCap.fontSize || '3.5em'}`,
    `line-height: ${dropCap.lines}`,
    `margin-right: ${dropCap.marginRight || '0.1em'}`,
    `margin-bottom: -0.2em`,
  ];

  if (dropCap.fontFamily) {
    declarations.push(`font-family: ${dropCap.fontFamily}, var(--font-heading)`);
  }
  if (dropCap.fontWeight) {
    declarations.push(`font-weight: ${dropCap.fontWeight}`);
  }
  declarations.push(`color: ${dropCap.color || 'var(--color-drop-cap)'}`);

  return `
.${classPrefix}-drop-cap::first-letter,
.${classPrefix}-content .${classPrefix}-first-paragraph::first-letter {
  ${declarations.join(';\n  ')};
}`.trim();
}

/**
 * Generates first paragraph styles
 */
function generateFirstParagraphStyles(
  firstParagraph: FirstParagraphStyle,
  classPrefix: string
): string {
  const declarations: string[] = [];

  if (firstParagraph.textTransform && firstParagraph.textTransform !== 'none') {
    if (firstParagraph.textTransform === 'small-caps') {
      declarations.push(`font-variant: small-caps`);
    } else {
      declarations.push(`text-transform: ${firstParagraph.textTransform}`);
    }
  }
  if (firstParagraph.fontVariant) {
    declarations.push(`font-variant: ${firstParagraph.fontVariant}`);
  }
  if (firstParagraph.letterSpacing) {
    declarations.push(`letter-spacing: ${firstParagraph.letterSpacing}`);
  }
  if (firstParagraph.fontSize) {
    declarations.push(`font-size: ${firstParagraph.fontSize}`);
  }

  if (declarations.length === 0) {
    return '';
  }

  return `
.${classPrefix}-content .${classPrefix}-first-paragraph,
.${classPrefix}-element[data-first-paragraph="true"] > .${classPrefix}-content > p:first-of-type {
  ${declarations.join(';\n  ')};
  text-indent: 0;
}`.trim();
}

/**
 * Generates ornamental break styles
 */
function generateOrnamentalBreakStyles(
  ornamentalBreak: { enabled: boolean; symbol: string; spacing?: string; fontSize?: string },
  classPrefix: string
): string {
  return `
.${classPrefix}-ornamental-break {
  text-align: center;
  font-size: ${ornamentalBreak.fontSize || '1.5em'};
  margin: ${ornamentalBreak.spacing || '2em 0'};
  color: var(--color-accent);
}

.${classPrefix}-ornamental-break::before {
  content: "${escapeCSS(ornamentalBreak.symbol)}";
}`.trim();
}

/**
 * Generates element-specific styles
 */
function generateElementStyles(_styleConfig: BookStyle, classPrefix: string): string {
  return `
/* Title Page */
.${classPrefix}-element[data-type="title-page"] {
  text-align: center;
  padding: var(--spacing-chapter);
}

.${classPrefix}-element[data-type="title-page"] .${classPrefix}-title {
  font-size: 3em;
  margin-bottom: 0.5em;
}

/* Copyright */
.${classPrefix}-element[data-type="copyright"] {
  font-size: 0.9em;
  line-height: 1.6;
}

/* Dedication, Epigraph */
.${classPrefix}-element[data-type="dedication"],
.${classPrefix}-element[data-type="epigraph"] {
  text-align: center;
  font-style: italic;
  padding: var(--spacing-chapter);
}

/* Front Matter */
.${classPrefix}-element[data-matter="front"] {
  padding-top: var(--spacing-section);
}

/* Body Matter */
.${classPrefix}-element[data-matter="body"] {
  padding: var(--spacing-chapter) 0;
}

/* Back Matter */
.${classPrefix}-element[data-matter="back"] {
  padding-top: var(--spacing-section);
}

/* Appendix, Glossary, Bibliography, Index */
.${classPrefix}-element[data-type="appendix"],
.${classPrefix}-element[data-type="glossary"],
.${classPrefix}-element[data-type="bibliography"],
.${classPrefix}-element[data-type="index"] {
  font-size: 0.95em;
}`.trim();
}

/**
 * Generates spacing and layout styles
 */
function generateSpacingStyles(_styleConfig: BookStyle, classPrefix: string): string {
  return `
.${classPrefix}-content {
  padding: 0 1.5rem;
}

.${classPrefix}-element + .${classPrefix}-element {
  margin-top: var(--spacing-section);
}

.${classPrefix}-content > * + * {
  margin-top: var(--spacing-paragraph);
}

.${classPrefix}-content section + section {
  margin-top: var(--spacing-section);
}`.trim();
}

/**
 * Generates color styles
 */
function generateColorStyles(_styleConfig: BookStyle, classPrefix: string): string {

  return `
.${classPrefix}-container a {
  color: var(--color-accent);
  text-decoration: none;
}

.${classPrefix}-container a:hover {
  text-decoration: underline;
}

.${classPrefix}-content blockquote {
  border-left: 3px solid var(--color-accent);
  padding-left: 1em;
  margin-left: 0;
  font-style: italic;
  color: var(--color-text);
  opacity: 0.9;
}

.${classPrefix}-content em {
  font-style: italic;
}

.${classPrefix}-content strong {
  font-weight: bold;
}`.trim();
}

/**
 * Generates print-specific styles
 */
function generatePrintStyles(_styleConfig: BookStyle, classPrefix: string): string {
  return `
@media print {
  .${classPrefix}-container {
    background-color: white;
    color: black;
  }

  .${classPrefix}-element {
    page-break-after: always;
  }

  .${classPrefix}-element[data-type="title-page"],
  .${classPrefix}-element[data-matter="front"]:first-of-type {
    page-break-before: always;
  }

  .${classPrefix}-content h1,
  .${classPrefix}-content h2,
  .${classPrefix}-content h3 {
    page-break-after: avoid;
    page-break-inside: avoid;
  }

  .${classPrefix}-content p {
    orphans: 3;
    widows: 3;
  }

  .${classPrefix}-container a {
    color: inherit;
    text-decoration: underline;
  }
}`.trim();
}

/**
 * Generates CSS for a specific element with style inheritance
 *
 * @param {string} elementType - The type of element
 * @param {BookStyle} baseStyle - Base style configuration
 * @param {Record<string, any>} [styleOverrides] - Optional style overrides
 * @param {string} [classPrefix] - CSS class prefix
 * @returns {string} Generated CSS for the element
 */
export function generateElementCSS(
  elementType: string,
  _baseStyle: BookStyle,
  styleOverrides: Record<string, any> = {},
  classPrefix: string = 'book'
): string {
  const selector = `.${classPrefix}-element[data-type="${elementType}"]`;

  // Apply overrides with inheritance
  const declarations: string[] = [];

  if (styleOverrides.fontSize) {
    declarations.push(`font-size: ${styleOverrides.fontSize}`);
  }
  if (styleOverrides.fontFamily) {
    declarations.push(`font-family: ${styleOverrides.fontFamily}`);
  }
  if (styleOverrides.fontWeight) {
    declarations.push(`font-weight: ${styleOverrides.fontWeight}`);
  }
  if (styleOverrides.lineHeight) {
    declarations.push(`line-height: ${styleOverrides.lineHeight}`);
  }
  if (styleOverrides.textAlign) {
    declarations.push(`text-align: ${styleOverrides.textAlign}`);
  }
  if (styleOverrides.color) {
    declarations.push(`color: ${styleOverrides.color}`);
  }
  if (styleOverrides.margin) {
    declarations.push(`margin: ${styleOverrides.margin}`);
  }
  if (styleOverrides.padding) {
    declarations.push(`padding: ${styleOverrides.padding}`);
  }

  // Always generate the selector, even if there are no overrides
  // This allows the element to be targeted by CSS
  if (declarations.length > 0) {
    return `${selector} {\n  ${declarations.join(';\n  ')};\n}`;
  } else {
    // Generate an empty rule to establish the selector
    return `${selector} {\n  /* Element-specific styles can be added here */\n}`;
  }
}

/**
 * Escapes special characters in CSS strings
 */
function escapeCSS(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\A ');
}

/**
 * Minifies CSS by removing whitespace and comments
 */
function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around special chars
    .trim();
}

/**
 * Merges multiple style configurations with cascading priority
 *
 * @param {BookStyle} baseStyle - Base style configuration
 * @param {...Partial<BookStyle>[]} overrides - Style overrides to merge
 * @returns {BookStyle} Merged style configuration
 */
export function mergeStyles(
  baseStyle: BookStyle,
  ...overrides: Partial<BookStyle>[]
): BookStyle {
  let merged = { ...baseStyle };

  for (const override of overrides) {
    // Merge headings with special handling for optional h4
    const mergedHeadings: BookStyle['headings'] = {
      h1: { ...merged.headings.h1, ...override.headings?.h1 },
      h2: { ...merged.headings.h2, ...override.headings?.h2 },
      h3: { ...merged.headings.h3, ...override.headings?.h3 },
    };

    if (merged.headings.h4 || override.headings?.h4) {
      mergedHeadings.h4 = { ...merged.headings.h4, ...override.headings?.h4 } as HeadingStyle;
    }

    merged = {
      ...merged,
      ...override,
      fonts: { ...merged.fonts, ...override.fonts },
      headings: mergedHeadings,
      body: { ...merged.body, ...override.body },
      dropCap: { ...merged.dropCap, ...override.dropCap },
      ornamentalBreak: { ...merged.ornamentalBreak, ...override.ornamentalBreak },
      firstParagraph: { ...merged.firstParagraph, ...override.firstParagraph },
      spacing: { ...merged.spacing, ...override.spacing },
      colors: { ...merged.colors, ...override.colors },
    };
  }

  return merged;
}

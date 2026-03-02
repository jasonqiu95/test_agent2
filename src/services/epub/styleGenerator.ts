/**
 * EPUB CSS Generator
 * Converts BookStyle configuration to CSS for EPUB output
 */

import type { BookStyle } from '../../types/style';
import type { CustomFontConfig } from '../../utils/fontLoader';

export interface EpubCssOptions {
  /** Include CSS reset styles */
  includeResetStyles?: boolean;
  /** Custom CSS to append */
  customCSS?: string;
  /** Custom fonts for @font-face embedding */
  customFonts?: CustomFontConfig[];
  /** Class prefix for generated CSS classes */
  classPrefix?: string;
}

/**
 * Generates complete CSS for EPUB from BookStyle configuration
 *
 * Generates CSS for:
 * - Body text (font-family, font-size, line-height, text-align, text-indent)
 * - Chapter headings (font, size, weight, alignment, margins)
 * - Subheadings (h2-h6 styles)
 * - Block quotes (indentation, font style, margins)
 * - Verse/poetry (alignment, line breaks, font)
 * - Scene breaks (spacing, ornamental characters)
 * - First paragraph (drop caps, no-indent)
 * - Page breaks (page-break-before/after)
 * - @font-face embedding for custom fonts
 *
 * @param style - BookStyle configuration
 * @param options - Generation options
 * @returns Complete CSS string for EPUB
 *
 * @example
 * ```typescript
 * const css = epubStyleToCss(bookStyle, {
 *   includeResetStyles: true,
 *   customFonts: [{ family: 'Custom', sources: [...] }]
 * });
 * ```
 */
export function epubStyleToCss(
  style: BookStyle,
  options: EpubCssOptions = {}
): string {
  const cssRules: string[] = [];

  // Add custom @font-face rules first
  if (options.customFonts && options.customFonts.length > 0) {
    cssRules.push(generateFontFaceRules(options.customFonts));
  }

  // Add CSS reset if requested
  if (options.includeResetStyles !== false) {
    cssRules.push(generateEpubResetStyles());
  }

  // Generate base body and text styles
  cssRules.push(generateBodyStyles(style));

  // Generate heading styles (h1-h6)
  cssRules.push(generateHeadingStyles(style.headings));

  // Generate drop cap styles if enabled
  if (style.dropCap?.enabled) {
    cssRules.push(generateDropCapStyles(style.dropCap, style.colors));
  }

  // Generate first paragraph styles if enabled
  if (style.firstParagraph?.enabled) {
    cssRules.push(generateFirstParagraphStyles(style.firstParagraph));
  }

  // Generate block quote styles
  cssRules.push(generateBlockQuoteStyles(style));

  // Generate verse/poetry styles
  cssRules.push(generateVerseStyles(style));

  // Generate scene break styles
  if (style.ornamentalBreak?.enabled) {
    cssRules.push(generateSceneBreakStyles(style.ornamentalBreak, style.colors));
  }

  // Generate page break control styles
  cssRules.push(generatePageBreakStyles());

  // Add custom CSS if provided
  if (options.customCSS) {
    cssRules.push(options.customCSS);
  }

  return cssRules.filter(Boolean).join('\n\n');
}

/**
 * Generates @font-face CSS rules for custom fonts
 */
function generateFontFaceRules(customFonts: CustomFontConfig[]): string {
  if (!customFonts || customFonts.length === 0) {
    return '';
  }

  const fontFaceRules = customFonts.map((font) => {
    const { family, weight = 400, style = 'normal', sources, display = 'swap', unicodeRange } = font;

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
  });

  return `/* Custom font definitions */\n${fontFaceRules.join('\n\n')}`;
}

/**
 * Generates CSS reset styles for EPUB
 */
function generateEpubResetStyles(): string {
  return `/* EPUB CSS Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 100%;
}`;
}

/**
 * Generates body and paragraph text styles
 */
function generateBodyStyles(style: BookStyle): string {
  const rules: string[] = ['/* Body and text styles */'];

  // Body element styles
  rules.push('body {');
  rules.push(`  font-family: ${formatFontStack(style.fonts.body)};`);
  rules.push(`  font-size: ${style.body.fontSize};`);
  rules.push(`  line-height: ${style.body.lineHeight};`);

  if (style.body.fontWeight) {
    rules.push(`  font-weight: ${style.body.fontWeight};`);
  }

  if (style.body.textAlign) {
    rules.push(`  text-align: ${style.body.textAlign};`);
  }

  if (style.colors.text) {
    rules.push(`  color: ${style.colors.text};`);
  }

  if (style.colors.background) {
    rules.push(`  background-color: ${style.colors.background};`);
  }

  rules.push('  margin: 0;');
  rules.push('  padding: 1em;');
  rules.push('}');

  // Paragraph styles
  rules.push('');
  rules.push('p {');
  rules.push(`  margin: 0 0 ${style.spacing.paragraphSpacing} 0;`);

  // Text indent for regular paragraphs
  rules.push(`  text-indent: 1.5em;`);

  rules.push('  text-rendering: optimizeLegibility;');
  rules.push('  -webkit-font-smoothing: antialiased;');
  rules.push('  -moz-osx-font-smoothing: grayscale;');
  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates heading styles (h1-h6)
 */
function generateHeadingStyles(headings: BookStyle['headings']): string {
  const rules: string[] = ['/* Heading styles */'];

  // H1 - Chapter titles
  if (headings.h1) {
    rules.push(formatHeadingRule('h1, .chapter-title', headings.h1));
  }

  // H2 - Major subheadings
  if (headings.h2) {
    rules.push(formatHeadingRule('h2', headings.h2));
  }

  // H3 - Minor subheadings
  if (headings.h3) {
    rules.push(formatHeadingRule('h3', headings.h3));
  }

  // H4-H6 - Additional heading levels
  if (headings.h4) {
    rules.push(formatHeadingRule('h4', headings.h4));
  }

  // Default styles for h5 and h6 if not specified
  const h5Style = (headings as any).h5;
  const h6Style = (headings as any).h6;

  if (h5Style) {
    rules.push(formatHeadingRule('h5', h5Style));
  } else {
    rules.push('h5 {');
    rules.push('  font-size: 1em;');
    rules.push('  font-weight: bold;');
    rules.push('  margin-top: 1em;');
    rules.push('  margin-bottom: 0.5em;');
    rules.push('}');
  }

  if (h6Style) {
    rules.push(formatHeadingRule('h6', h6Style));
  } else {
    rules.push('h6 {');
    rules.push('  font-size: 0.9em;');
    rules.push('  font-weight: bold;');
    rules.push('  margin-top: 1em;');
    rules.push('  margin-bottom: 0.5em;');
    rules.push('}');
  }

  return rules.join('\n\n');
}

/**
 * Formats a single heading rule
 */
function formatHeadingRule(selector: string, style: any): string {
  if (!style) return '';

  const rules: string[] = [`${selector} {`];

  if (style.fontFamily) {
    rules.push(`  font-family: ${formatFontStack(style.fontFamily)};`);
  }

  rules.push(`  font-size: ${style.fontSize};`);

  if (style.fontWeight) {
    rules.push(`  font-weight: ${style.fontWeight};`);
  }

  if (style.lineHeight) {
    rules.push(`  line-height: ${style.lineHeight};`);
  }

  if (style.textTransform) {
    rules.push(`  text-transform: ${style.textTransform};`);
  }

  if (style.letterSpacing) {
    rules.push(`  letter-spacing: ${style.letterSpacing};`);
  }

  if (style.color) {
    rules.push(`  color: ${style.color};`);
  }

  // Default to center alignment for h1/chapter titles
  const textAlign = style.textAlign || (selector.includes('h1') || selector.includes('chapter-title') ? 'center' : 'left');
  rules.push(`  text-align: ${textAlign};`);

  rules.push(`  margin-top: ${style.marginTop || '2em'};`);
  rules.push(`  margin-bottom: ${style.marginBottom || '1em'};`);

  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates drop cap styles
 */
function generateDropCapStyles(dropCap: any, colors: BookStyle['colors']): string {
  const rules: string[] = ['/* Drop cap styles */'];

  const lines = dropCap.lines || 3;
  const fontSize = dropCap.fontSize || `${lines * 1.6}em`;
  const color = dropCap.color || colors.dropCap || colors.heading || colors.text;

  // First paragraph after chapter heading
  rules.push('.first-paragraph::first-letter,');
  rules.push('h1 + p::first-letter,');
  rules.push('.chapter-title + p::first-letter {');
  rules.push('  float: left;');
  rules.push(`  font-size: ${fontSize};`);
  rules.push(`  line-height: ${lines === 2 ? 0.8 : lines === 3 ? 0.85 : 0.9};`);
  rules.push(`  margin-right: ${dropCap.marginRight || '0.1em'};`);
  rules.push('  margin-top: 0.08em;');

  if (dropCap.fontFamily) {
    rules.push(`  font-family: ${formatFontStack(dropCap.fontFamily)};`);
  }

  if (dropCap.fontWeight) {
    rules.push(`  font-weight: ${dropCap.fontWeight};`);
  }

  if (color) {
    rules.push(`  color: ${color};`);
  }

  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates first paragraph styles
 */
function generateFirstParagraphStyles(firstPara: any): string {
  const rules: string[] = ['/* First paragraph styles */'];

  const selectors = [
    'h1 + p',
    'h2 + p',
    '.chapter-title + p',
    '.first-paragraph'
  ];

  rules.push(`${selectors.join(',\n')} {`);

  // Remove text indent for first paragraphs
  if (!firstPara.indent?.enabled) {
    rules.push('  text-indent: 0;');
  } else if (firstPara.indent?.value) {
    rules.push(`  text-indent: ${firstPara.indent.value};`);
  }

  // Handle small caps
  if (firstPara.textTransform === 'small-caps' || firstPara.fontVariant === 'small-caps') {
    rules.push('  font-variant: small-caps;');
  } else if (firstPara.textTransform) {
    rules.push(`  text-transform: ${firstPara.textTransform};`);
  }

  if (firstPara.letterSpacing) {
    rules.push(`  letter-spacing: ${firstPara.letterSpacing};`);
  }

  if (firstPara.fontSize) {
    rules.push(`  font-size: ${firstPara.fontSize};`);
  }

  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates block quote styles
 */
function generateBlockQuoteStyles(style: BookStyle): string {
  const rules: string[] = ['/* Block quote styles */'];

  rules.push('blockquote {');
  rules.push('  margin: 1.5em 2em;');
  rules.push('  padding-left: 1em;');
  rules.push('  font-style: italic;');
  rules.push('  font-size: 0.95em;');
  rules.push('  line-height: 1.5;');

  if (style.colors.text) {
    rules.push(`  color: ${style.colors.text};`);
  }

  rules.push('}');

  // Quote attribution
  rules.push('');
  rules.push('blockquote cite,');
  rules.push('.quote-attribution {');
  rules.push('  display: block;');
  rules.push('  text-align: right;');
  rules.push('  font-size: 0.9em;');
  rules.push('  margin-top: 0.5em;');
  rules.push('  font-style: normal;');
  rules.push('}');

  // Epigraph styles
  rules.push('');
  rules.push('.epigraph {');
  rules.push('  margin: 2em 20% 2em auto;');
  rules.push('  text-align: right;');
  rules.push('  font-style: italic;');
  rules.push('  font-size: 0.95em;');
  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates verse/poetry styles
 */
function generateVerseStyles(style: BookStyle): string {
  const rules: string[] = ['/* Verse and poetry styles */'];

  rules.push('.verse,');
  rules.push('.poetry {');
  rules.push('  margin: 1.5em 0;');
  rules.push('  white-space: pre-line;');
  rules.push('  font-style: italic;');

  if (style.fonts.script) {
    rules.push(`  font-family: ${formatFontStack(style.fonts.script)};`);
  }

  rules.push('}');

  // Verse lines
  rules.push('');
  rules.push('.verse-line {');
  rules.push('  display: block;');
  rules.push('  margin: 0;');
  rules.push('  padding: 0;');
  rules.push('  line-height: 1.6;');
  rules.push('}');

  // Indented verse lines
  rules.push('');
  rules.push('.verse-line.indent-1 {');
  rules.push('  margin-left: 2em;');
  rules.push('}');
  rules.push('');
  rules.push('.verse-line.indent-2 {');
  rules.push('  margin-left: 4em;');
  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates scene break / ornamental break styles
 */
function generateSceneBreakStyles(ornamentalBreak: any, colors: BookStyle['colors']): string {
  const rules: string[] = ['/* Scene break styles */'];

  const symbol = ornamentalBreak.customSymbol || ornamentalBreak.symbol || '* * *';
  const alignment = ornamentalBreak.textAlign || 'center';
  const marginTop = ornamentalBreak.marginTop || '1.5em';
  const marginBottom = ornamentalBreak.marginBottom || '1.5em';

  rules.push('.scene-break,');
  rules.push('hr.scene-break {');
  rules.push(`  text-align: ${alignment};`);
  rules.push(`  margin-top: ${marginTop};`);
  rules.push(`  margin-bottom: ${marginBottom};`);
  rules.push('  display: block;');
  rules.push('  width: 100%;');
  rules.push('  border: none;');
  rules.push('  background: none;');
  rules.push('  height: auto;');

  if (ornamentalBreak.fontSize) {
    rules.push(`  font-size: ${ornamentalBreak.fontSize};`);
  }

  if (colors.accent) {
    rules.push(`  color: ${colors.accent};`);
  }

  rules.push('}');

  // Add the ornamental symbol
  rules.push('');
  rules.push('.scene-break::before,');
  rules.push('hr.scene-break::before {');
  rules.push(`  content: '${escapeForCss(symbol)}';`);
  rules.push('  display: block;');

  if (symbol.length > 1) {
    rules.push('  letter-spacing: 0.3em;');
  }

  rules.push('}');

  return rules.join('\n');
}

/**
 * Generates page break control styles
 */
function generatePageBreakStyles(): string {
  return `/* Page break control */

/* Prevent page breaks inside these elements */
blockquote,
figure,
pre,
table,
.no-break {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Force page break before chapter starts */
.chapter,
.chapter-start,
h1.chapter-title {
  page-break-before: always;
  break-before: page;
}

/* Prevent page breaks immediately after headings */
h1, h2, h3, h4, h5, h6 {
  page-break-after: avoid;
  break-after: avoid;
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Keep headings with following content */
h1 + p,
h2 + p,
h3 + p {
  page-break-before: avoid;
  break-before: avoid;
}

/* Widows and orphans control */
p {
  orphans: 2;
  widows: 2;
}`;
}

/**
 * Formats a font family string with proper fallback fonts
 */
function formatFontStack(fontFamily: string): string {
  if (!fontFamily) {
    return 'serif';
  }

  // If already contains commas, assume it's a complete font stack
  if (fontFamily.includes(',')) {
    return fontFamily;
  }

  // Check if font name needs quotes
  const needsQuotes = /[\s,]/.test(fontFamily) && !fontFamily.startsWith('"') && !fontFamily.startsWith("'");
  const quotedFont = needsQuotes ? `"${fontFamily}"` : fontFamily;

  // Determine appropriate fallback based on font characteristics
  const lowerFont = fontFamily.toLowerCase();
  let fallback = 'serif';

  if (
    lowerFont.includes('sans') ||
    lowerFont.includes('helvetica') ||
    lowerFont.includes('arial')
  ) {
    fallback = 'sans-serif';
  } else if (
    lowerFont.includes('mono') ||
    lowerFont.includes('courier') ||
    lowerFont.includes('code')
  ) {
    fallback = 'monospace';
  } else if (
    lowerFont.includes('script') ||
    lowerFont.includes('cursive')
  ) {
    fallback = 'cursive';
  }

  return `${quotedFont}, ${fallback}`;
}

/**
 * Escapes special characters for use in CSS content property
 */
function escapeForCss(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

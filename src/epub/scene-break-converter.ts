/**
 * EPUB Scene Break Converter
 *
 * Converts scene breaks to <hr> tags with proper CSS classes and data attributes
 * for EPUB generation. Handles both simple breaks and ornamental breaks with
 * configurable styling hooks.
 */

import { Break } from '../types/textFeature';
import { BookStyle } from '../types/style';

/**
 * Scene break style configuration
 */
export interface SceneBreakStyle {
  /** Type of break to render */
  type: 'simple' | 'ornamental';
  /** Symbol to display (for ornamental breaks) */
  symbol?: string;
  /** CSS class names to apply */
  classNames?: string[];
  /** Data attributes for styling hooks */
  dataAttributes?: Record<string, string>;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
  /** Top margin */
  marginTop?: string;
  /** Bottom margin */
  marginBottom?: string;
}

/**
 * Options for converting scene breaks
 */
export interface SceneBreakConverterOptions {
  /** CSS class prefix (default: 'epub') */
  classPrefix?: string;
  /** Book style configuration */
  bookStyle?: BookStyle;
  /** Force ornamental breaks even for simple breaks */
  forceOrnamental?: boolean;
  /** Additional CSS classes to add */
  additionalClasses?: string[];
  /** Additional data attributes */
  additionalDataAttributes?: Record<string, string>;
}

/**
 * Convert a Break feature to EPUB-compatible HTML
 *
 * @param breakFeature - The break feature to convert
 * @param options - Conversion options
 * @returns HTML string for the scene break
 *
 * @example
 * ```typescript
 * const break: Break = {
 *   type: 'break',
 *   breakType: 'scene',
 *   symbol: '* * *'
 * };
 *
 * const html = convertSceneBreakToHtml(break, {
 *   classPrefix: 'epub',
 *   bookStyle: myBookStyle
 * });
 * ```
 */
export function convertSceneBreakToHtml(
  breakFeature: Break,
  options: SceneBreakConverterOptions = {}
): string {
  const {
    classPrefix = 'epub',
    bookStyle,
    forceOrnamental = false,
    additionalClasses = [],
    additionalDataAttributes = {}
  } = options;

  // Determine if this should be an ornamental break
  const isOrnamental = forceOrnamental ||
    (bookStyle?.ornamentalBreak?.enabled && breakFeature.breakType === 'scene') ||
    (breakFeature.breakType === 'section' && bookStyle?.ornamentalBreak?.enabled);

  // Build the style configuration
  const style = buildSceneBreakStyle(breakFeature, bookStyle, isOrnamental);

  // Generate the HTML
  if (isOrnamental && style.symbol) {
    return generateOrnamentalBreakHtml(style, classPrefix, additionalClasses, additionalDataAttributes);
  } else {
    return generateSimpleBreakHtml(style, classPrefix, additionalClasses, additionalDataAttributes);
  }
}

/**
 * Build scene break style configuration from break feature and book style
 */
function buildSceneBreakStyle(
  breakFeature: Break,
  bookStyle?: BookStyle,
  isOrnamental: boolean = false
): SceneBreakStyle {
  const style: SceneBreakStyle = {
    type: isOrnamental ? 'ornamental' : 'simple',
    classNames: [],
    dataAttributes: {}
  };

  // Add break type to data attributes
  if (breakFeature.breakType) {
    style.dataAttributes!['break-type'] = breakFeature.breakType;
  }

  // Add break ID if present
  if (breakFeature.id) {
    style.dataAttributes!['break-id'] = breakFeature.id;
  }

  // Configure ornamental break
  if (isOrnamental && bookStyle?.ornamentalBreak) {
    const ornamental = bookStyle.ornamentalBreak;

    // Use custom symbol if provided, otherwise use default
    style.symbol = breakFeature.symbol ||
                   ornamental.customSymbol ||
                   ornamental.symbol ||
                   '* * *';

    // Add styling from book config
    style.textAlign = ornamental.textAlign || 'center';
    style.marginTop = ornamental.marginTop;
    style.marginBottom = ornamental.marginBottom;

    // Add ornamental-specific data attributes
    style.dataAttributes!['ornamental'] = 'true';
    style.dataAttributes!['symbol'] = style.symbol;
  } else if (breakFeature.symbol) {
    // Simple break with symbol
    style.symbol = breakFeature.symbol;
    style.dataAttributes!['symbol'] = breakFeature.symbol;
  }

  return style;
}

/**
 * Generate HTML for a simple scene break (horizontal rule)
 */
function generateSimpleBreakHtml(
  style: SceneBreakStyle,
  classPrefix: string,
  additionalClasses: string[],
  additionalDataAttributes: Record<string, string>
): string {
  const classes = [
    `${classPrefix}-scene-break`,
    `${classPrefix}-scene-break--simple`,
    ...additionalClasses
  ];

  const dataAttrs = {
    ...style.dataAttributes,
    ...additionalDataAttributes
  };

  const classAttr = `class="${classes.join(' ')}"`;
  const dataAttrString = Object.entries(dataAttrs)
    .map(([key, value]) => `data-${key}="${escapeHtml(value)}"`)
    .join(' ');

  const attributes = [classAttr, dataAttrString].filter(Boolean).join(' ');

  return `<hr ${attributes} />`;
}

/**
 * Generate HTML for an ornamental scene break (with symbol)
 */
function generateOrnamentalBreakHtml(
  style: SceneBreakStyle,
  classPrefix: string,
  additionalClasses: string[],
  additionalDataAttributes: Record<string, string>
): string {
  const classes = [
    `${classPrefix}-scene-break`,
    `${classPrefix}-scene-break--ornamental`,
    ...additionalClasses
  ];

  const dataAttrs = {
    ...style.dataAttributes,
    ...additionalDataAttributes
  };

  const classAttr = `class="${classes.join(' ')}"`;
  const dataAttrString = Object.entries(dataAttrs)
    .map(([key, value]) => `data-${key}="${escapeHtml(value)}"`)
    .join(' ');

  const styleAttr = buildStyleAttribute(style);
  const attributes = [classAttr, dataAttrString, styleAttr].filter(Boolean).join(' ');

  const symbol = escapeHtml(style.symbol || '* * *');

  // Use hr element with pseudo-element content via data attribute
  return `<hr ${attributes} role="separator" aria-label="Scene break" />`;
}

/**
 * Build inline style attribute from scene break style
 */
function buildStyleAttribute(style: SceneBreakStyle): string {
  const styles: string[] = [];

  if (style.textAlign) {
    styles.push(`text-align: ${style.textAlign}`);
  }

  if (style.marginTop) {
    styles.push(`margin-top: ${style.marginTop}`);
  }

  if (style.marginBottom) {
    styles.push(`margin-bottom: ${style.marginBottom}`);
  }

  return styles.length > 0 ? `style="${styles.join('; ')}"` : '';
}

/**
 * Generate CSS for EPUB scene breaks
 *
 * @param classPrefix - CSS class prefix (default: 'epub')
 * @param bookStyle - Optional book style configuration
 * @returns CSS string for scene breaks
 *
 * @example
 * ```typescript
 * const css = generateSceneBreakCss('epub', bookStyle);
 * ```
 */
export function generateSceneBreakCss(
  classPrefix: string = 'epub',
  bookStyle?: BookStyle
): string {
  const rules: string[] = [];

  rules.push(`/* Scene break styles */`);

  // Base scene break styles
  rules.push(`.${classPrefix}-scene-break {`);
  rules.push(`  display: block;`);
  rules.push(`  margin: 1.5em auto;`);
  rules.push(`  border: none;`);
  rules.push(`  background: none;`);
  rules.push(`  text-align: center;`);
  rules.push(`  page-break-inside: avoid;`);
  rules.push(`  break-inside: avoid;`);
  rules.push(`}`);
  rules.push('');

  // Simple break styles (horizontal line)
  rules.push(`.${classPrefix}-scene-break--simple {`);
  rules.push(`  border-top: 1px solid currentColor;`);
  rules.push(`  width: 30%;`);
  rules.push(`  opacity: 0.5;`);
  rules.push(`  height: 0;`);
  rules.push(`}`);
  rules.push('');

  // Ornamental break styles (with symbol)
  rules.push(`.${classPrefix}-scene-break--ornamental {`);
  rules.push(`  border: none;`);
  rules.push(`  width: 100%;`);
  rules.push(`  height: auto;`);

  // Apply book style configuration if available
  if (bookStyle?.ornamentalBreak?.enabled) {
    const ob = bookStyle.ornamentalBreak;

    if (ob.fontSize) {
      rules.push(`  font-size: ${ob.fontSize};`);
    }

    if (ob.marginTop) {
      rules.push(`  margin-top: ${ob.marginTop};`);
    }

    if (ob.marginBottom) {
      rules.push(`  margin-bottom: ${ob.marginBottom};`);
    }

    if (bookStyle.colors?.accent) {
      rules.push(`  color: ${bookStyle.colors.accent};`);
    }
  } else {
    rules.push(`  font-size: 1.2em;`);
    rules.push(`  margin-top: 2em;`);
    rules.push(`  margin-bottom: 2em;`);
  }

  rules.push(`}`);
  rules.push('');

  // Add ::before pseudo-element for ornamental symbol
  rules.push(`.${classPrefix}-scene-break--ornamental::before {`);
  rules.push(`  content: attr(data-symbol);`);
  rules.push(`  display: block;`);
  rules.push(`  letter-spacing: 0.3em;`);
  rules.push(`  text-align: center;`);
  rules.push(`}`);
  rules.push('');

  // Page break control
  rules.push(`.${classPrefix}-scene-break + p,`);
  rules.push(`.${classPrefix}-scene-break + .${classPrefix}-paragraph {`);
  rules.push(`  page-break-before: avoid;`);
  rules.push(`  break-before: avoid;`);
  rules.push(`}`);

  return rules.join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Batch convert multiple scene breaks to HTML
 *
 * @param breaks - Array of break features
 * @param options - Conversion options
 * @returns Array of HTML strings
 */
export function convertSceneBreaksToHtml(
  breaks: Break[],
  options: SceneBreakConverterOptions = {}
): string[] {
  return breaks.map(breakFeature =>
    convertSceneBreakToHtml(breakFeature, options)
  );
}

/**
 * Check if a break feature should be rendered as ornamental
 *
 * @param breakFeature - The break feature
 * @param bookStyle - Book style configuration
 * @returns True if break should be ornamental
 */
export function isOrnamentalBreak(
  breakFeature: Break,
  bookStyle?: BookStyle
): boolean {
  if (!bookStyle?.ornamentalBreak?.enabled) {
    return false;
  }

  // Scene and section breaks can be ornamental
  return breakFeature.breakType === 'scene' ||
         breakFeature.breakType === 'section';
}

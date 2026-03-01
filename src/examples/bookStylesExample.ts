/**
 * Example usage of book styles
 * This demonstrates how to load and apply book styles in your application
 */

import {
  allStyles,
  getStyleById,
  getStylesByCategory,
  getAllStyleNames,
} from '../data/styles';
import { BookStyle } from '../types/style';

/**
 * Example 1: Get all available styles
 */
export function listAllStyles(): void {
  console.log('Available book styles:');
  allStyles.forEach(style => {
    console.log(`- ${style.name} (${style.category}): ${style.description}`);
  });
}

/**
 * Example 2: Get a specific style by ID
 */
export function applyBaskervilleStyle(): BookStyle | undefined {
  const style = getStyleById('baskerville');
  if (style) {
    console.log(`Applying ${style.name} style`);
    console.log('Body font:', style.fonts.body);
    console.log('Heading font:', style.fonts.heading);
    return style;
  }
  return undefined;
}

/**
 * Example 3: Get all serif styles
 */
export function getSerifStyles(): BookStyle[] {
  return getStylesByCategory('serif');
}

/**
 * Example 4: Generate CSS from a book style
 */
export function generateCSS(styleId: string): string {
  const style = getStyleById(styleId);
  if (!style) {
    throw new Error(`Style '${styleId}' not found`);
  }

  return `
/* ${style.name} - ${style.description} */

body {
  font-family: ${style.fonts.body}, ${style.fonts.fallback};
  font-size: ${style.body.fontSize};
  line-height: ${style.body.lineHeight};
  color: ${style.colors.text};
  background-color: ${style.colors.background || '#ffffff'};
  text-align: ${style.body.textAlign || 'left'};
}

h1 {
  font-family: ${style.fonts.heading}, ${style.fonts.fallback};
  font-size: ${style.headings.h1.fontSize};
  font-weight: ${style.headings.h1.fontWeight};
  line-height: ${style.headings.h1.lineHeight};
  margin-top: ${style.headings.h1.marginTop};
  margin-bottom: ${style.headings.h1.marginBottom};
  color: ${style.colors.heading};
  ${style.headings.h1.textTransform ? `text-transform: ${style.headings.h1.textTransform};` : ''}
  ${style.headings.h1.letterSpacing ? `letter-spacing: ${style.headings.h1.letterSpacing};` : ''}
}

h2 {
  font-family: ${style.fonts.heading}, ${style.fonts.fallback};
  font-size: ${style.headings.h2.fontSize};
  font-weight: ${style.headings.h2.fontWeight};
  line-height: ${style.headings.h2.lineHeight};
  margin-top: ${style.headings.h2.marginTop};
  margin-bottom: ${style.headings.h2.marginBottom};
  color: ${style.colors.heading};
  ${style.headings.h2.letterSpacing ? `letter-spacing: ${style.headings.h2.letterSpacing};` : ''}
}

h3 {
  font-family: ${style.fonts.heading}, ${style.fonts.fallback};
  font-size: ${style.headings.h3.fontSize};
  font-weight: ${style.headings.h3.fontWeight};
  line-height: ${style.headings.h3.lineHeight};
  margin-top: ${style.headings.h3.marginTop};
  margin-bottom: ${style.headings.h3.marginBottom};
  color: ${style.colors.heading};
}

p {
  margin-bottom: ${style.spacing.paragraphSpacing};
}

${style.dropCap.enabled ? `
/* Drop cap for first paragraph */
.chapter p:first-of-type::first-letter {
  float: left;
  font-size: ${style.dropCap.fontSize};
  line-height: ${style.dropCap.lines};
  font-weight: ${style.dropCap.fontWeight};
  margin-right: ${style.dropCap.marginRight};
  color: ${style.dropCap.color};
  ${style.dropCap.fontFamily ? `font-family: ${style.dropCap.fontFamily};` : ''}
}
` : ''}

${style.firstParagraph.enabled ? `
/* First paragraph special styling */
.chapter p:first-of-type {
  ${style.firstParagraph.textTransform ? `text-transform: ${style.firstParagraph.textTransform};` : ''}
  ${style.firstParagraph.fontVariant ? `font-variant: ${style.firstParagraph.fontVariant};` : ''}
  ${style.firstParagraph.letterSpacing ? `letter-spacing: ${style.firstParagraph.letterSpacing};` : ''}
  ${style.firstParagraph.fontSize ? `font-size: ${style.firstParagraph.fontSize};` : ''}
}
` : ''}

${style.ornamentalBreak.enabled ? `
/* Scene break ornament */
.scene-break::before {
  content: "${style.ornamentalBreak.symbol}";
  display: block;
  text-align: center;
  margin: ${style.ornamentalBreak.spacing} 0;
  font-size: ${style.ornamentalBreak.fontSize};
}
` : ''}

.section {
  margin-bottom: ${style.spacing.sectionSpacing};
}

.chapter {
  margin-bottom: ${style.spacing.chapterSpacing};
}
  `.trim();
}

/**
 * Example 5: Get style names for a dropdown menu
 */
export function getStyleOptionsForDropdown(): Array<{ value: string; label: string; category: string }> {
  return allStyles.map(style => ({
    value: style.id,
    label: style.name,
    category: style.category,
  }));
}

/**
 * Example 6: Apply style to React component (conceptual)
 */
export function getStyleAsReactCSS(styleId: string): Record<string, React.CSSProperties> {
  const style = getStyleById(styleId);
  if (!style) {
    throw new Error(`Style '${styleId}' not found`);
  }

  return {
    body: {
      fontFamily: style.fonts.body,
      fontSize: style.body.fontSize,
      lineHeight: style.body.lineHeight,
      color: style.colors.text,
      backgroundColor: style.colors.background,
      textAlign: style.body.textAlign,
    },
    h1: {
      fontFamily: style.fonts.heading,
      fontSize: style.headings.h1.fontSize,
      fontWeight: style.headings.h1.fontWeight as React.CSSProperties['fontWeight'],
      lineHeight: style.headings.h1.lineHeight,
      marginTop: style.headings.h1.marginTop,
      marginBottom: style.headings.h1.marginBottom,
      color: style.colors.heading,
      textTransform: style.headings.h1.textTransform as React.CSSProperties['textTransform'],
      letterSpacing: style.headings.h1.letterSpacing,
    },
    paragraph: {
      marginBottom: style.spacing.paragraphSpacing,
    },
  };
}

// Example usage
if (import.meta.env.DEV) {
  console.log('=== Book Styles Examples ===\n');

  // List all styles
  console.log('1. All available styles:');
  console.log(getAllStyleNames());

  // Get a specific style
  console.log('\n2. Baskerville style details:');
  console.log(getStyleById('baskerville'));

  // Generate CSS
  console.log('\n3. Generated CSS for Garamond:');
  console.log(generateCSS('garamond'));
}

/**
 * Example usage of EPUB CSS Generator
 */

import { epubStyleToCss } from './styleGenerator';
import type { BookStyle } from '../../types/style';
import type { CustomFontConfig } from '../../utils/fontLoader';

// Example 1: Basic usage with classic serif style
const classicSerifStyle: BookStyle = {
  id: 'classic-serif',
  name: 'Classic Serif',
  description: 'Traditional book style with Garamond',
  category: 'serif',
  fonts: {
    body: 'Garamond',
    heading: 'Garamond',
    fallback: 'serif',
  },
  headings: {
    h1: {
      fontSize: '2em',
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: '3em',
      marginBottom: '1.5em',
      letterSpacing: '0.05em',
    },
    h2: {
      fontSize: '1.5em',
      fontWeight: 'bold',
      marginTop: '2em',
      marginBottom: '1em',
    },
    h3: {
      fontSize: '1.25em',
      fontWeight: 'bold',
      marginTop: '1.5em',
      marginBottom: '0.75em',
    },
  },
  body: {
    fontSize: '1em',
    lineHeight: '1.6',
    textAlign: 'justify',
  },
  dropCap: {
    enabled: true,
    lines: 3,
    fontWeight: 'bold',
    marginRight: '0.1em',
  },
  ornamentalBreak: {
    enabled: true,
    symbol: '***',
    customSymbol: '* * *',
    textAlign: 'center',
    marginTop: '1.5em',
    marginBottom: '1.5em',
  },
  firstParagraph: {
    enabled: true,
    textTransform: 'small-caps',
    letterSpacing: '0.05em',
    indent: {
      enabled: false,
    },
  },
  spacing: {
    paragraphSpacing: '1em',
    lineHeight: '1.6',
    sectionSpacing: '2em',
    chapterSpacing: '3em',
  },
  colors: {
    text: '#1a1a1a',
    heading: '#000000',
    accent: '#666666',
  },
};

// Generate CSS
const css1 = epubStyleToCss(classicSerifStyle);
console.log('Classic Serif CSS:');
console.log(css1);
console.log('\n---\n');

// Example 2: Modern sans-serif style with custom fonts
const modernSansStyle: BookStyle = {
  id: 'modern-sans',
  name: 'Modern Sans',
  description: 'Clean modern style with Helvetica',
  category: 'sans-serif',
  fonts: {
    body: 'Helvetica Neue',
    heading: 'Helvetica Neue',
    fallback: 'sans-serif',
  },
  headings: {
    h1: {
      fontSize: '2.5em',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginTop: '2em',
      marginBottom: '1em',
      color: '#0066cc',
    },
    h2: {
      fontSize: '1.75em',
      fontWeight: '600',
      marginTop: '1.5em',
      marginBottom: '0.75em',
      color: '#0066cc',
    },
    h3: {
      fontSize: '1.25em',
      fontWeight: '600',
      marginTop: '1em',
      marginBottom: '0.5em',
    },
  },
  body: {
    fontSize: '1em',
    lineHeight: '1.7',
    textAlign: 'left',
  },
  dropCap: {
    enabled: false,
    lines: 3,
  },
  ornamentalBreak: {
    enabled: true,
    symbol: '***',
    customSymbol: '✦',
    textAlign: 'center',
    fontSize: '1.5em',
    marginTop: '2em',
    marginBottom: '2em',
  },
  firstParagraph: {
    enabled: true,
    fontSize: '1.1em',
    letterSpacing: '0.02em',
    indent: {
      enabled: false,
    },
  },
  spacing: {
    paragraphSpacing: '1.2em',
    lineHeight: '1.7',
    sectionSpacing: '2.5em',
    chapterSpacing: '3.5em',
  },
  colors: {
    text: '#333333',
    heading: '#0066cc',
    accent: '#0099ff',
    background: '#ffffff',
  },
};

const customFonts: CustomFontConfig[] = [
  {
    family: 'Helvetica Neue',
    weight: 400,
    style: 'normal',
    sources: [
      { url: '/fonts/helvetica-neue-regular.woff2', format: 'woff2' },
      { url: '/fonts/helvetica-neue-regular.woff', format: 'woff' },
    ],
    display: 'swap',
  },
  {
    family: 'Helvetica Neue',
    weight: 700,
    style: 'normal',
    sources: [
      { url: '/fonts/helvetica-neue-bold.woff2', format: 'woff2' },
      { url: '/fonts/helvetica-neue-bold.woff', format: 'woff' },
    ],
    display: 'swap',
  },
];

const css2 = epubStyleToCss(modernSansStyle, {
  customFonts,
  customCSS: '/* Additional custom styles */\n.highlight { background: yellow; }',
});

console.log('Modern Sans CSS with custom fonts:');
console.log(css2);
console.log('\n---\n');

// Example 3: Poetry/verse-focused style
const poetryStyle: BookStyle = {
  id: 'poetry',
  name: 'Poetry Style',
  description: 'Optimized for verse and poetry',
  category: 'serif',
  fonts: {
    body: 'Georgia',
    heading: 'Georgia',
    script: 'Palatino',
    fallback: 'serif',
  },
  headings: {
    h1: {
      fontSize: '1.75em',
      fontWeight: 'normal',
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: '2em',
      marginBottom: '2em',
    },
    h2: {
      fontSize: '1.25em',
      fontWeight: 'normal',
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: '1.5em',
      marginBottom: '1em',
    },
    h3: {
      fontSize: '1.1em',
      fontWeight: 'normal',
      marginTop: '1em',
      marginBottom: '0.75em',
    },
  },
  body: {
    fontSize: '1.1em',
    lineHeight: '1.8',
    textAlign: 'left',
  },
  dropCap: {
    enabled: false,
    lines: 2,
  },
  ornamentalBreak: {
    enabled: true,
    symbol: '***',
    customSymbol: '❧',
    textAlign: 'center',
    fontSize: '1.2em',
    marginTop: '2em',
    marginBottom: '2em',
  },
  firstParagraph: {
    enabled: false,
  },
  spacing: {
    paragraphSpacing: '1.5em',
    lineHeight: '1.8',
    sectionSpacing: '3em',
    chapterSpacing: '4em',
  },
  colors: {
    text: '#2a2a2a',
    heading: '#4a4a4a',
    accent: '#8a8a8a',
  },
};

const css3 = epubStyleToCss(poetryStyle, {
  includeResetStyles: true,
});

console.log('Poetry Style CSS:');
console.log(css3);

export { classicSerifStyle, modernSansStyle, poetryStyle };

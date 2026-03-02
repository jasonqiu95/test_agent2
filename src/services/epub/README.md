# EPUB CSS Generator

Generate complete CSS stylesheets for EPUB output based on BookStyle configurations.

## Overview

The `epubStyleToCss()` function converts a `BookStyle` configuration object into a complete CSS stylesheet optimized for EPUB e-readers. It handles all typography, spacing, and styling aspects of book formatting.

## Features

### Complete Typography Support

- **Body Text**: Font family, size, line height, text alignment, and indentation
- **Chapter Headings**: Custom fonts, sizes, weights, alignment, and margins (h1-h6)
- **First Paragraph**: Special styling with optional drop caps and no-indent
- **Drop Caps**: Multi-line drop caps with custom fonts and colors
- **Block Quotes**: Indentation, font style, margins, and attribution styling
- **Verse/Poetry**: Proper alignment, line breaks, and indentation
- **Scene Breaks**: Ornamental characters with custom spacing

### Advanced Features

- **@font-face Embedding**: Automatic generation of font-face rules for custom fonts
- **Page Break Control**: Intelligent page break rules for better pagination
- **Color Schemes**: Support for text, heading, accent, and background colors
- **CSS Reset**: Optional reset styles for consistent cross-platform rendering
- **Custom CSS**: Ability to append additional custom styles

## Usage

### Basic Example

```typescript
import { epubStyleToCss } from './services/epub/styleGenerator';
import type { BookStyle } from './types/style';

const bookStyle: BookStyle = {
  id: 'my-style',
  name: 'My Book Style',
  description: 'Custom book style',
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
      marginTop: '2em',
      marginBottom: '1em',
    },
    h2: {
      fontSize: '1.5em',
      fontWeight: 'bold',
      marginTop: '1.5em',
      marginBottom: '0.75em',
    },
    h3: {
      fontSize: '1.25em',
      fontWeight: 'bold',
      marginTop: '1em',
      marginBottom: '0.5em',
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
  },
  ornamentalBreak: {
    enabled: true,
    symbol: '***',
    textAlign: 'center',
  },
  firstParagraph: {
    enabled: true,
    indent: { enabled: false },
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
  },
};

// Generate CSS
const css = epubStyleToCss(bookStyle);
```

### With Custom Fonts

```typescript
import { epubStyleToCss } from './services/epub/styleGenerator';
import type { CustomFontConfig } from './utils/fontLoader';

const customFonts: CustomFontConfig[] = [
  {
    family: 'My Custom Font',
    weight: 400,
    style: 'normal',
    sources: [
      { url: '/fonts/custom-regular.woff2', format: 'woff2' },
      { url: '/fonts/custom-regular.woff', format: 'woff' },
      { url: '/fonts/custom-regular.ttf', format: 'ttf' },
    ],
    display: 'swap',
  },
  {
    family: 'My Custom Font',
    weight: 700,
    style: 'normal',
    sources: [
      { url: '/fonts/custom-bold.woff2', format: 'woff2' },
    ],
    display: 'swap',
  },
];

const css = epubStyleToCss(bookStyle, {
  customFonts,
  includeResetStyles: true,
});
```

### With Custom CSS

```typescript
const css = epubStyleToCss(bookStyle, {
  customCSS: `
    /* Custom styles for special elements */
    .my-special-class {
      color: #cc0000;
      font-weight: bold;
    }
  `,
});
```

## API Reference

### `epubStyleToCss(style, options?)`

Generates complete CSS for EPUB from BookStyle configuration.

**Parameters:**

- `style: BookStyle` - The book style configuration object
- `options?: EpubCssOptions` - Optional generation options

**Returns:** `string` - Complete CSS stylesheet

### `EpubCssOptions`

Optional configuration for CSS generation.

```typescript
interface EpubCssOptions {
  /** Include CSS reset styles (default: true) */
  includeResetStyles?: boolean;

  /** Custom CSS to append */
  customCSS?: string;

  /** Custom fonts for @font-face embedding */
  customFonts?: CustomFontConfig[];

  /** Class prefix for generated CSS classes */
  classPrefix?: string;
}
```

## Generated CSS Structure

The generated CSS includes the following sections (in order):

1. **Custom Fonts** - @font-face rules for embedded fonts
2. **CSS Reset** - Normalize styles for consistent rendering
3. **Body Styles** - Base text and paragraph styles
4. **Heading Styles** - h1-h6 styles with custom typography
5. **Drop Cap Styles** - First letter styling for chapter openings
6. **First Paragraph Styles** - Special formatting for opening paragraphs
7. **Block Quote Styles** - Quote and epigraph styling
8. **Verse/Poetry Styles** - Line-by-line formatting for poetry
9. **Scene Break Styles** - Ornamental breaks between sections
10. **Page Break Control** - Rules for proper pagination
11. **Custom CSS** - User-provided additional styles

## BookStyle Configuration

### Required Properties

```typescript
interface BookStyle {
  id: string;
  name: string;
  description: string;
  category: BookStyleCategory;
  fonts: {
    body: string;
    heading: string;
    script?: string;
    fallback: string;
  };
  headings: {
    h1: HeadingStyle;
    h2: HeadingStyle;
    h3: HeadingStyle;
    h4?: HeadingStyle;
  };
  body: {
    fontSize: string;
    lineHeight: string;
    fontWeight?: string;
    textAlign?: 'left' | 'justify';
  };
  dropCap: DropCapStyle;
  ornamentalBreak: OrnamentalBreakStyle;
  firstParagraph: FirstParagraphStyle;
  spacing: SpacingConfig;
  colors: ColorScheme;
}
```

### Heading Style

```typescript
interface HeadingStyle {
  fontFamily?: string;
  fontSize: string;
  fontWeight?: string;
  lineHeight?: string;
  marginTop?: string;
  marginBottom?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string;
  color?: string;
}
```

### Drop Cap Style

```typescript
interface DropCapStyle {
  enabled: boolean;
  lines: number;           // 2-5 lines
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  marginRight?: string;
}
```

### First Paragraph Style

```typescript
interface FirstParagraphStyle {
  enabled: boolean;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'small-caps';
  fontVariant?: string;
  letterSpacing?: string;
  fontSize?: string;
  indent?: {
    enabled: boolean;
    value?: string;
  };
}
```

## Examples

See `example.ts` for complete working examples including:

1. **Classic Serif Style** - Traditional book formatting with Garamond
2. **Modern Sans Style** - Clean contemporary design with custom fonts
3. **Poetry Style** - Optimized for verse and poetry with special formatting

## Testing

Run the test suite:

```bash
npm test -- src/services/epub/__tests__/styleGenerator.test.ts
```

The test suite covers:
- Body text generation
- Heading styles (h1-h6)
- Drop caps with various configurations
- First paragraph styling
- Block quotes and epigraphs
- Verse/poetry formatting
- Scene breaks with custom symbols
- Page break control
- Custom font embedding
- Font stack generation

## Integration

### With EPUB Generator

```typescript
import { generateEPUBStructure } from './lib/epub/generator';
import { epubStyleToCss } from './services/epub/styleGenerator';

// Generate EPUB structure
const epubStructure = generateEPUBStructure(book, styles, images, options);

// Generate CSS from book style
const css = epubStyleToCss(bookStyle, {
  customFonts: extractCustomFonts(bookStyle),
});

// Use CSS in EPUB generation
epubStructure.styles = css;
```

## Best Practices

1. **Font Embedding**: Always provide multiple font formats (woff2, woff, ttf) for maximum compatibility
2. **Drop Caps**: Use 2-3 lines for optimal readability
3. **Line Height**: Use 1.5-1.8 for body text in EPUB format
4. **Text Alignment**: Use `justify` for traditional books, `left` for modern styles
5. **Colors**: Use sufficient contrast ratios (4.5:1 minimum) for accessibility
6. **Page Breaks**: Let the CSS handle page breaks automatically; avoid forcing breaks except for chapters

## Browser/E-reader Compatibility

The generated CSS is compatible with:
- Apple Books (iOS/macOS)
- Kindle (via EPUB conversion)
- Google Play Books
- Kobo
- Adobe Digital Editions
- Calibre

CSS features used are based on:
- CSS 2.1 (broad compatibility)
- CSS3 Fonts Module
- CSS3 Paged Media (where supported)

## License

MIT

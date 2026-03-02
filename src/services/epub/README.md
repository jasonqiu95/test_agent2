# EPUB Services

This directory contains services for EPUB generation and manipulation.

## TOC Generator

The TOC (Table of Contents) generator creates both NCX (EPUB 2.0) and nav.xhtml (EPUB 3.0) formats from book content.

### Features

- ✅ Generates toc.ncx for EPUB 2.0 compatibility (XML format with navPoint elements)
- ✅ Generates nav.xhtml for EPUB 3.0 (HTML5 nav element with nested ol/li)
- ✅ Extracts chapter titles and subheadings from book content
- ✅ Assigns play order numbers automatically
- ✅ Links to chapter XHTML files with anchors for subheadings
- ✅ Supports nested TOC levels (chapters > subheadings)
- ✅ Handles front/back matter in TOC
- ✅ Respects includeInToc flags on chapters and elements
- ✅ Configurable maximum depth for TOC entries
- ✅ Proper XML/HTML escaping for special characters

### Usage

```typescript
import { generateTOC } from './services/epub';
import { Book } from './types/book';

// Your book data
const book: Book = {
  id: 'my-book',
  title: 'My Amazing Book',
  authors: [{ id: 'author-1', name: 'Jane Doe', role: 'author' }],
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: 'Introduction',
      content: [
        { blockType: 'paragraph', content: 'Welcome...' },
        { blockType: 'heading', level: 2, content: 'Background' },
        { blockType: 'paragraph', content: 'Some history...' },
        { blockType: 'heading', level: 2, content: 'Overview' },
      ],
      includeInToc: true,
    },
    {
      id: 'chapter-2',
      number: 2,
      title: 'Getting Started',
      content: [...],
      includeInToc: true,
    },
  ],
  frontMatter: [...],
  backMatter: [...],
  // ... other book properties
};

// Generate TOC with default options
const toc = generateTOC(book);

// Access the generated content
console.log(toc.ncx);        // NCX XML content
console.log(toc.navXhtml);   // nav.xhtml HTML5 content
console.log(toc.entries);    // Structured TOC entries

// Generate TOC with custom options
const customToc = generateTOC(book, {
  maxDepth: 2,                    // Only include h1 and h2
  tocTitle: 'Contents',           // Custom title
  includeFrontMatter: true,       // Include front matter (default: true)
  includeBackMatter: true,        // Include back matter (default: true)
  bookId: 'custom-book-id',       // Custom book ID for NCX
  bookTitle: 'Custom Book Title', // Custom title for NCX
  bookAuthor: 'Custom Author',    // Custom author for NCX
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxDepth` | `number` | `3` | Maximum depth of TOC entries (1-6) |
| `tocTitle` | `string` | `'Table of Contents'` | Title shown in nav.xhtml |
| `includeFrontMatter` | `boolean` | `true` | Include front matter elements in TOC |
| `includeBackMatter` | `boolean` | `true` | Include back matter elements in TOC |
| `bookId` | `string` | `book.id` | Book identifier for NCX metadata |
| `bookTitle` | `string` | `book.title` | Book title for NCX metadata |
| `bookAuthor` | `string` | `book.authors[0].name` | Book author for NCX metadata |

### TOC Structure

#### TocEntry

Each TOC entry has the following structure:

```typescript
interface TocEntry {
  id: string;           // Unique identifier
  title: string;        // Display title
  href: string;         // Link to content (e.g., "Text/chapter-001.xhtml")
  playOrder: number;    // Sequential play order
  children: TocEntry[]; // Nested subheadings
  level: number;        // Heading level (1-6)
}
```

### Generated Files

#### toc.ncx (EPUB 2.0)

The NCX file is an XML document that provides navigation for EPUB 2.0 readers:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="book-id"/>
    <meta name="dtb:depth" content="3"/>
    <!-- ... -->
  </head>
  <docTitle>
    <text>Book Title</text>
  </docTitle>
  <docAuthor>
    <text>Author Name</text>
  </docAuthor>
  <navMap>
    <navPoint id="chapter-1" playOrder="1">
      <navLabel>
        <text>Chapter 1: Introduction</text>
      </navLabel>
      <content src="Text/chapter-001.xhtml"/>
      <navPoint id="chapter-1-h2-0" playOrder="2">
        <navLabel>
          <text>Background</text>
        </navLabel>
        <content src="Text/chapter-001.xhtml#chapter-1-h2-0"/>
      </navPoint>
    </navPoint>
  </navMap>
</ncx>
```

#### nav.xhtml (EPUB 3.0)

The nav.xhtml file is an HTML5 document with structured navigation:

```html
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
  <style type="text/css">
    /* Built-in styling */
  </style>
</head>
<body>
  <nav id="toc" epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li>
        <a href="Text/chapter-001.xhtml">Chapter 1: Introduction</a>
        <ol>
          <li>
            <a href="Text/chapter-001.xhtml#chapter-1-h2-0">Background</a>
          </li>
        </ol>
      </li>
    </ol>
  </nav>
</body>
</html>
```

### Subheading Extraction

The TOC generator automatically extracts subheadings from chapter content based on the `blockType: 'heading'` and `level` properties of TextBlocks:

- Level 1: Chapter title (not included as subheading)
- Level 2-6: Subheadings (included based on `maxDepth` option)

Subheadings are nested according to their level hierarchy:
- h2 → Direct children of chapter
- h3 → Children of h2
- h4 → Children of h3
- etc.

### Front and Back Matter

The generator handles front matter (preface, acknowledgments, etc.) and back matter (epilogue, about author, etc.) elements:

- Front matter appears before chapters
- Back matter appears after chapters
- Each element gets its own TOC entry
- Elements respect the `includeInToc` property

### File Naming Convention

The generator uses a consistent naming convention for chapter files:

- Chapters: `Text/chapter-001.xhtml`, `Text/chapter-002.xhtml`, etc.
- Front matter: `Text/frontmatter-001.xhtml`, `Text/frontmatter-002.xhtml`, etc.
- Back matter: `Text/backmatter-001.xhtml`, `Text/backmatter-002.xhtml`, etc.

### Testing

Run the test suite:

```bash
npm test -- tocGenerator.test.ts
```

The test suite includes 23 comprehensive tests covering:
- Basic TOC generation
- Nested subheadings
- Front and back matter handling
- NCX XML generation
- nav.xhtml HTML5 generation
- Special character escaping
- Edge cases

### Integration

To use the TOC generator in your EPUB generation workflow:

1. **Generate TOC** after preparing book content
2. **Save toc.ncx** to the EPUB package at `OEBPS/toc.ncx`
3. **Save nav.xhtml** to the EPUB package at `OEBPS/nav.xhtml`
4. **Add to manifest** in `package.opf`:
   ```xml
   <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
   <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
   ```
5. **Reference in spine** (for nav.xhtml):
   ```xml
   <itemref idref="nav" linear="no"/>
   ```

### Notes

- The generator assumes chapter files follow the naming pattern `chapter-XXX.xhtml`
- Subheading anchors use the format `{chapter-id}-h{level}-{index}`
- Special characters in titles are automatically escaped for XML/HTML
- Play order is assigned sequentially starting from 1
- The NCX depth metadata is calculated from the `maxDepth` option

---

## CSS Style Generator

Generate complete CSS stylesheets for EPUB output based on BookStyle configurations.

### Overview

The `epubStyleToCss()` function converts a `BookStyle` configuration object into a complete CSS stylesheet optimized for EPUB e-readers. It handles all typography, spacing, and styling aspects of book formatting.

### Features

#### Complete Typography Support

- **Body Text**: Font family, size, line height, text alignment, and indentation
- **Chapter Headings**: Custom fonts, sizes, weights, alignment, and margins (h1-h6)
- **First Paragraph**: Special styling with optional drop caps and no-indent
- **Drop Caps**: Multi-line drop caps with custom fonts and colors
- **Block Quotes**: Indentation, font style, margins, and attribution styling
- **Verse/Poetry**: Proper alignment, line breaks, and indentation
- **Scene Breaks**: Ornamental characters with custom spacing

#### Advanced Features

- **@font-face Embedding**: Automatic generation of font-face rules for custom fonts
- **Page Break Control**: Intelligent page break rules for better pagination
- **Color Schemes**: Support for text, heading, accent, and background colors
- **CSS Reset**: Optional reset styles for consistent cross-platform rendering
- **Custom CSS**: Ability to append additional custom styles

### Usage

#### Basic Example

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

#### With Custom Fonts

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

#### With Custom CSS

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

### API Reference

#### `epubStyleToCss(style, options?)`

Generates complete CSS for EPUB from BookStyle configuration.

**Parameters:**

- `style: BookStyle` - The book style configuration object
- `options?: EpubCssOptions` - Optional generation options

**Returns:** `string` - Complete CSS stylesheet

#### `EpubCssOptions`

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

### Generated CSS Structure

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

### BookStyle Configuration

#### Required Properties

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

#### Heading Style

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

#### Drop Cap Style

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

#### First Paragraph Style

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

### Examples

See `example.ts` for complete working examples including:

1. **Classic Serif Style** - Traditional book formatting with Garamond
2. **Modern Sans Style** - Clean contemporary design with custom fonts
3. **Poetry Style** - Optimized for verse and poetry with special formatting

### Testing

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

### Integration

#### With EPUB Generator

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

### Best Practices

1. **Font Embedding**: Always provide multiple font formats (woff2, woff, ttf) for maximum compatibility
2. **Drop Caps**: Use 2-3 lines for optimal readability
3. **Line Height**: Use 1.5-1.8 for body text in EPUB format
4. **Text Alignment**: Use `justify` for traditional books, `left` for modern styles
5. **Colors**: Use sufficient contrast ratios (4.5:1 minimum) for accessibility
6. **Page Breaks**: Let the CSS handle page breaks automatically; avoid forcing breaks except for chapters

### Browser/E-reader Compatibility

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

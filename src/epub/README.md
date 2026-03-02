# EPUB Utilities

This directory contains utilities for converting book data models to EPUB format.

## HTML Sanitization Utility

A comprehensive HTML sanitization library for EPUB generation and user-generated content, providing security against XSS attacks and malformed HTML.

### Features

- **Security-first**: Removes dangerous tags, attributes, and JavaScript execution vectors
- **Configurable**: Whitelist-based approach with customizable options
- **Structure validation**: Detects and reports HTML structure issues
- **Malformed HTML cleanup**: Automatically fixes common HTML errors
- **Special character encoding**: Proper handling of HTML entities
- **Browser and Node.js compatible**: Works in both browser and jsdom test environments

### Usage

#### Basic Sanitization

```typescript
import { sanitizeHtml } from './epub/html-sanitizer';

// Simple sanitization with default options
const dirty = '<p>Hello <script>alert("XSS")</script> World!</p>';
const clean = sanitizeHtml(dirty);
// Result: '<p>Hello  World!</p>'
```

#### Advanced Usage with Options

```typescript
import { HtmlSanitizer } from './epub/html-sanitizer';

const sanitizer = new HtmlSanitizer({
  // Allow custom tags
  allowedTags: ['custom-element'],

  // Allow custom attributes
  allowedAttributes: {
    'div': ['data-id', 'data-type'],
  },

  // Enable data attributes
  allowDataAttributes: true,

  // Allow inline styles
  allowStyles: true,

  // Allow custom protocols
  allowedProtocols: ['custom:'],

  // Keep HTML comments
  keepComments: true,
});

const result = sanitizer.sanitize(html);
console.log(result.html);           // Sanitized HTML
console.log(result.modified);       // Whether content was modified
console.log(result.removedTags);    // Array of removed tag names
console.log(result.removedAttributes); // Array of removed attributes
console.log(result.warnings);       // Array of warnings
```

#### Utility Functions

##### Encode Special Characters

```typescript
import { encodeSpecialCharacters } from './epub/html-sanitizer';

const encoded = encodeSpecialCharacters('<script>alert("XSS")</script>');
// Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
```

##### Decode HTML Entities

```typescript
import { decodeHtmlEntities } from './epub/html-sanitizer';

const decoded = decodeHtmlEntities('&lt;p&gt;Hello&lt;/p&gt;');
// Result: '<p>Hello</p>'
```

##### Validate HTML Structure

```typescript
import { validateHtmlStructure } from './epub/html-sanitizer';

const validation = validateHtmlStructure('<div><p>Unclosed div');
console.log(validation.valid);   // false
console.log(validation.errors);  // Array of error messages
```

##### Clean Malformed HTML

```typescript
import { cleanMalformedHtml } from './epub/html-sanitizer';

const cleaned = cleanMalformedHtml('<div><p>Unclosed<div>Content</div>');
// Browser automatically closes the unclosed <p> tag
```

### Default Safe Tags

The sanitizer allows these HTML tags by default:

#### Structure
- `div`, `span`, `p`, `br`, `hr`

#### Headings
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

#### Lists
- `ul`, `ol`, `li`, `dl`, `dt`, `dd`

#### Text Formatting
- `strong`, `b`, `em`, `i`, `u`, `s`, `del`, `ins`
- `sub`, `sup`, `small`, `mark`, `code`, `pre`

#### Semantic Elements
- `blockquote`, `q`, `cite`, `abbr`, `dfn`
- `time`, `address`, `figure`, `figcaption`

#### Tables
- `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`
- `caption`, `col`, `colgroup`

#### Links and Media
- `a`, `img`

#### EPUB-specific
- `section`, `article`, `nav`, `aside`, `header`, `footer`
- `main`, `details`, `summary`

### Default Safe Attributes

#### Global Attributes
- `id`, `class`, `title`, `lang`, `dir`

#### Tag-specific Attributes
- **Links (`a`)**: `href`, `target`, `rel`, `name`
- **Images (`img`)**: `src`, `alt`, `width`, `height`, `loading`
- **Tables**: `border`, `cellpadding`, `cellspacing`, `colspan`, `rowspan`, `align`, `valign`, `scope`, `span`
- **Time (`time`)**: `datetime`
- **Quotes (`blockquote`, `q`)**: `cite`
- **Edits (`del`, `ins`)**: `cite`, `datetime`
- **Abbreviations (`abbr`)**: `title`

### Security Features

#### Automatically Removed

1. **Dangerous Tags**: `script`, `style`, `iframe`, `object`, `embed`, `link`, `base`
2. **Event Handlers**: `onclick`, `onload`, `onerror`, `onmouseover`, etc.
3. **Dangerous URL Protocols**: `javascript:`, `data:`, `vbscript:`
4. **Dangerous CSS**: `behavior`, `expression`, `moz-binding`, etc.

#### URL Validation

Safe protocols by default:
- `http:`, `https:`
- `mailto:`, `tel:`
- `#` (fragment identifiers)
- Relative URLs (`/path`, `./path`, `../path`)

### EPUB Integration

This sanitizer is designed specifically for EPUB generation use cases:

```typescript
import { sanitizeHtml } from './epub/html-sanitizer';

// Sanitize chapter content before including in EPUB
const chapterHtml = `
  <section class="chapter">
    <h1>Chapter Title</h1>
    <p>Chapter content...</p>
  </section>
`;

const sanitizedChapter = sanitizeHtml(chapterHtml);
// Now safe to include in EPUB
```

### Testing

The library includes comprehensive tests covering:
- Basic sanitization
- Dangerous tag removal
- Attribute sanitization
- URL validation
- Style attribute handling
- Custom configuration options
- Complex HTML structures
- Real-world scenarios

Run tests:
```bash
npm test -- src/epub/__tests__/html-sanitizer.test.ts
```

### Performance Considerations

- Uses native browser DOM APIs for parsing and manipulation
- Efficient whitelist-based approach
- Single-pass sanitization algorithm
- Minimal memory overhead

### Browser Compatibility

Works in all modern browsers and Node.js environments with jsdom:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Node.js with jsdom (for testing)

## Inline Converter

The `inline-converter.ts` module provides functions to transform inline formatting from the book data model to proper HTML tags for EPUB generation.

### Features

- **Text Formatting**: Bold, italic, underline, strikethrough
- **Subscript/Superscript**: For chemical formulas, mathematical notation, etc.
- **Styling**: Color, highlight, font size, font family
- **Links**: Full support for anchor tags with href, title, target, and rel attributes
- **Images**: Convert image references to img tags with proper attributes
- **Footnotes**: Convert footnote references to superscript anchors
- **Special Characters**: Proper HTML escaping to prevent XSS
- **Nested Formatting**: Handles multiple formatting styles applied to the same text

### Usage Examples

#### Basic Inline Text

```typescript
import { convertInlineText } from './epub/inline-converter';

const text = {
  text: 'Hello World',
  style: { bold: true, italic: true }
};

const html = convertInlineText(text);
// Output: <em><strong>Hello World</strong></em>
```

#### Links with Formatting

```typescript
import { createLink, convertLink } from './epub/inline-converter';

const link = createLink('Visit our site', 'https://example.com', {
  title: 'Example Website',
  target: '_blank',
  rel: 'noopener noreferrer',
  style: { bold: true }
});

const html = convertLink(link);
// Output: <a href="https://example.com" title="Example Website" target="_blank" rel="noopener noreferrer"><strong>Visit our site</strong></a>
```

#### Rich Text with Multiple Segments

```typescript
import { convertRichText } from './epub/inline-converter';

const richText = {
  segments: [
    { text: 'This is ' },
    { text: 'bold', style: { bold: true } },
    { text: ' and ' },
    { text: 'italic', style: { italic: true } },
    { text: ' text.' }
  ],
  plainText: 'This is bold and italic text.'
};

const html = convertRichText(richText);
// Output: This is <strong>bold</strong> and <em>italic</em> text.
```

#### Links in Rich Text

```typescript
const richText = {
  segments: [
    { text: 'Visit ' },
    {
      type: 'link',
      text: 'our website',
      url: 'https://example.com',
      title: 'Example'
    },
    { text: ' for more information.' }
  ],
  plainText: 'Visit our website for more information.'
};

const html = convertRichText(richText);
// Output: Visit <a href="https://example.com" title="Example">our website</a> for more information.
```

#### Footnotes

```typescript
import { convertFootnote } from './epub/inline-converter';

const footnote = {
  type: 'footnote',
  referenceId: 'fn-1',
  number: 1
};

const html = convertFootnote(footnote);
// Output: <sup><a href="#fn-1" id="ref-fn-1" epub:type="noteref">1</a></sup>
```

#### Complex Nested Formatting

```typescript
const text = {
  text: 'Important Note',
  style: {
    bold: true,
    italic: true,
    underline: true,
    color: '#ff0000',
    fontSize: 16
  }
};

const html = convertInlineText(text);
// Output: <span style="color: #ff0000; font-size: 16px"><u><em><strong>Important Note</strong></em></u></span>
```

### API Reference

#### Core Conversion Functions

- **`convertInlineText(inline: InlineText): string`**
  Converts a single inline text segment with styling to HTML

- **`convertLink(link: LinkReference): string`**
  Converts a link reference to an anchor tag with all attributes

- **`convertImage(image: ImageReference): string`**
  Converts an image reference to an img tag

- **`convertFootnote(footnote: FootnoteReference): string`**
  Converts a footnote reference to a superscript anchor

- **`convertTextSegment(segment: TextSegment): string`**
  Converts any text segment type (auto-detects type)

- **`convertRichText(richText: RichText): string`**
  Converts rich text with multiple segments to HTML

- **`convertContent(content: string | RichText | TextSegment[]): string`**
  Universal converter that handles any content type

#### Utility Functions

- **`escapeHtml(text: string): string`**
  Escapes HTML special characters (&, <, >, ", ')

- **`createInlineText(text: string, style?: Partial<InlineStyle>): InlineText`**
  Helper to create InlineText objects

- **`createLink(text: string, url: string, options?: LinkOptions): LinkReference`**
  Helper to create LinkReference objects

- **`parseSimpleFormatting(text: string): TextSegment[]`**
  Parse simple markdown-like formatting (e.g., **bold**)

### Supported InlineStyle Properties

- `bold`: Apply strong emphasis
- `italic`: Apply emphasis
- `underline`: Underline text
- `strikethrough`: Strike through text
- `subscript`: Lower subscript text (mutually exclusive with superscript)
- `superscript`: Raise superscript text (mutually exclusive with subscript)
- `color`: Text color (CSS color value)
- `highlight`: Background color (CSS color value)
- `fontSize`: Font size in pixels
- `fontFamily`: Font family name

### HTML Tag Mapping

- Bold → `<strong>`
- Italic → `<em>`
- Underline → `<u>`
- Strikethrough → `<del>`
- Subscript → `<sub>`
- Superscript → `<sup>`
- Links → `<a>`
- Images → `<img>`
- Styling → `<span style="...">`

### Formatting Order (Nesting)

The converter applies formatting in a specific order for proper nesting:

1. Subscript/Superscript (structural)
2. Bold/Italic (semantic)
3. Underline/Strikethrough (presentational)
4. Color/Styling (span with inline styles)

Example:
```typescript
{ text: "H2O", style: { bold: true, underline: true, subscript: true, color: "blue" } }
// Result: <span style="color: blue"><u><strong><sub>H2O</sub></strong></u></span>
```

### Security

All user-provided content is properly escaped using `escapeHtml()` to prevent XSS attacks. This includes:
- Text content
- Link URLs and titles
- Image alt text and titles
- All HTML attributes

### Testing

Comprehensive tests are available in `__tests__/inline-converter.test.ts` covering:
- All formatting types
- Nested formatting combinations
- Link attributes
- Image attributes
- Footnote references
- HTML escaping
- Edge cases (empty strings, null values, etc.)

Run tests with:
```bash
npm test -- src/epub/__tests__/inline-converter.test.ts
```

### Integration with EPUB Generator

The inline converter can be used to enhance the existing EPUB generator in `src/lib/epub/generator.ts`. Instead of the simple `renderInlineText` function, use `convertRichText` for better support of complex formatting.

Example integration:
```typescript
import { convertRichText, convertContent } from '../epub/inline-converter';

function renderTextBlock(block: TextBlock): string {
  const tag = getBlockTag(block.blockType);
  let html = `<${tag}>`;

  // Use the new converter for rich text
  if (block.richText) {
    html += convertRichText(block.richText);
  } else {
    html += convertContent(block.content);
  }

  html += `</${tag}>`;
  return html;
}
```

## Scene Break Converter

Converts scene breaks to EPUB-compatible HTML with proper CSS classes and data attributes for styling.

### Features

- **Simple Breaks**: Converts scene breaks to horizontal rules (`<hr>` tags)
- **Ornamental Breaks**: Creates decorative breaks with custom symbols
- **CSS Generation**: Generates complete CSS stylesheets for scene breaks
- **Data Attributes**: Adds data attributes for styling hooks and JavaScript interaction
- **BookStyle Integration**: Works seamlessly with BookStyle configuration
- **Accessibility**: Includes ARIA labels and semantic HTML

### Installation

```typescript
import {
  convertSceneBreakToHtml,
  convertSceneBreaksToHtml,
  generateSceneBreakCss,
  isOrnamentalBreak,
} from './epub/scene-break-converter';
```

### Usage

#### Basic Scene Break

```typescript
import { convertSceneBreakToHtml } from './epub';
import { Break } from '../types/textFeature';

const breakFeature: Break = {
  type: 'break',
  breakType: 'scene',
};

const html = convertSceneBreakToHtml(breakFeature);
// Output: <hr class="epub-scene-break epub-scene-break--simple" data-break-type="scene" />
```

#### Ornamental Break with BookStyle

```typescript
import { convertSceneBreakToHtml } from './epub';
import { Break } from '../types/textFeature';
import { BookStyle } from '../types/style';

const breakFeature: Break = {
  type: 'break',
  breakType: 'scene',
  symbol: '* * *',
};

const bookStyle: BookStyle = {
  // ... book style config
  ornamentalBreak: {
    enabled: true,
    symbol: '❦',
    fontSize: '20px',
    textAlign: 'center',
    marginTop: '2em',
    marginBottom: '2em',
  },
  colors: {
    text: '#000000',
    heading: '#333333',
    accent: '#8B4513',
  },
};

const html = convertSceneBreakToHtml(breakFeature, { bookStyle });
```

#### Custom Class Prefix

```typescript
const html = convertSceneBreakToHtml(breakFeature, {
  classPrefix: 'my-book',
});
// Output: <hr class="my-book-scene-break my-book-scene-break--simple" ... />
```

#### Additional Classes and Data Attributes

```typescript
const html = convertSceneBreakToHtml(breakFeature, {
  additionalClasses: ['custom-styling', 'special-break'],
  additionalDataAttributes: {
    'chapter': '7',
    'position': 'end',
  },
});
```

#### Batch Conversion

```typescript
import { convertSceneBreaksToHtml } from './epub';

const breaks: Break[] = [
  { type: 'break', breakType: 'scene', id: 'break-1' },
  { type: 'break', breakType: 'scene', symbol: '* * *', id: 'break-2' },
  { type: 'break', breakType: 'section', symbol: '◆', id: 'break-3' },
];

const htmlArray = convertSceneBreaksToHtml(breaks, {
  bookStyle,
  classPrefix: 'epub',
});
```

#### Generate CSS Stylesheet

```typescript
import { generateSceneBreakCss } from './epub';

const css = generateSceneBreakCss('epub', bookStyle);
// Returns complete CSS for scene breaks
```

#### Check if Break is Ornamental

```typescript
import { isOrnamentalBreak } from './epub';

const isOrn = isOrnamentalBreak(breakFeature, bookStyle);
// Returns true if break should be rendered as ornamental
```

### API Reference

#### `convertSceneBreakToHtml(breakFeature, options?)`

Converts a single Break feature to EPUB-compatible HTML.

**Parameters:**
- `breakFeature: Break` - The break feature to convert
- `options?: SceneBreakConverterOptions` - Conversion options

**Returns:** `string` - HTML string

**Options:**
- `classPrefix?: string` - CSS class prefix (default: 'epub')
- `bookStyle?: BookStyle` - Book style configuration
- `forceOrnamental?: boolean` - Force ornamental style
- `additionalClasses?: string[]` - Additional CSS classes
- `additionalDataAttributes?: Record<string, string>` - Additional data attributes

#### `convertSceneBreaksToHtml(breaks, options?)`

Batch converts multiple Break features to HTML.

**Parameters:**
- `breaks: Break[]` - Array of break features
- `options?: SceneBreakConverterOptions` - Conversion options

**Returns:** `string[]` - Array of HTML strings

#### `generateSceneBreakCss(classPrefix?, bookStyle?)`

Generates complete CSS stylesheet for scene breaks.

**Parameters:**
- `classPrefix?: string` - CSS class prefix (default: 'epub')
- `bookStyle?: BookStyle` - Book style configuration

**Returns:** `string` - CSS stylesheet

#### `isOrnamentalBreak(breakFeature, bookStyle?)`

Checks if a break should be rendered as ornamental.

**Parameters:**
- `breakFeature: Break` - The break feature
- `bookStyle?: BookStyle` - Book style configuration

**Returns:** `boolean` - True if break should be ornamental

### Output HTML

#### Simple Break

```html
<hr class="epub-scene-break epub-scene-break--simple"
    data-break-type="scene"
    data-break-id="break-123" />
```

#### Ornamental Break

```html
<hr class="epub-scene-break epub-scene-break--ornamental"
    data-break-type="scene"
    data-ornamental="true"
    data-symbol="❦"
    style="text-align: center; margin-top: 2em; margin-bottom: 2em"
    role="separator"
    aria-label="Scene break" />
```

### CSS Classes

- `.epub-scene-break` - Base class for all scene breaks
- `.epub-scene-break--simple` - Simple horizontal rule break
- `.epub-scene-break--ornamental` - Ornamental break with symbol
- `.epub-scene-break::before` - Pseudo-element for ornamental symbol

### Data Attributes

- `data-break-type` - Type of break (scene, section, page, line)
- `data-break-id` - Unique identifier for the break
- `data-ornamental` - "true" if ornamental break
- `data-symbol` - Symbol to display (for ornamental breaks)
- Custom attributes via `additionalDataAttributes` option

### Break Types

- **scene**: Scene break within a chapter
- **section**: Section break between major parts
- **page**: Page break (for print)
- **line**: Line break (inline)

### Ornamental Symbols

Common ornamental symbols for scene breaks:

- `❦` - Floral heart
- `✦` - Four pointed star
- `✻` - Eight pointed star
- `※` - Reference mark
- `◆` - Diamond
- `* * *` - Three asterisks
- `~ ~ ~` - Three tildes

### Integration with EPUB Generation

```typescript
import { convertSceneBreakToHtml, generateSceneBreakCss } from './epub';

// In your EPUB generator
class EPUBGenerator {
  generateChapter(chapter: Chapter, bookStyle: BookStyle) {
    const css = generateSceneBreakCss('epub', bookStyle);

    const content = chapter.content.map(block => {
      if (block.type === 'break') {
        return convertSceneBreakToHtml(block, { bookStyle });
      }
      // ... handle other block types
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>${content}</body>
      </html>
    `;
  }
}
```

### Examples

See `examples/scene-break-usage.ts` for complete usage examples.

### Testing

Run tests with:

```bash
npm test src/epub/__tests__/scene-break-converter.test.ts
```

## License

Part of the EPUB Book Publishing application.

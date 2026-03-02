# EPUB Utilities

This directory contains utilities for converting book data models to EPUB format.

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

# Break Generation for Book-to-HTML Conversion

This module provides comprehensive support for generating scene breaks, page breaks, and ornamental breaks when converting book content to HTML.

## Features

### 1. Scene Breaks

Scene breaks are used to separate scenes within a chapter. They can be rendered as:
- Simple horizontal rules (`<hr>`)
- Text-based breaks with custom symbols (e.g., `* * *`, `~`, etc.)

**Usage:**
```typescript
import { generateSceneBreak } from './bookToHtml';

// Simple horizontal rule
const simpleBreak = generateSceneBreak();
// Output: <hr class="book-scene-break" />

// With custom symbol
const symbolBreak = generateSceneBreak('* * *');
// Output: <div class="book-scene-break book-scene-break-ornamental">* * *</div>
```

### 2. Page Breaks

Page breaks provide hints for print CSS to force page breaks at specific locations. They are hidden on screen but enforce page breaks when printing.

**Usage:**
```typescript
import { generatePageBreak } from './bookToHtml';

const pageBreak = generatePageBreak();
// Output: <div class="book-page-break"></div>
```

**CSS Behavior:**
- On screen: `display: none` (hidden)
- In print: `page-break-before: always` (forces page break)

### 3. Ornamental Breaks

Ornamental breaks are decorative section separators with rich styling options. They support multiple styles and configurations.

#### Ornamental Break Styles

1. **Asterisk Style**: Traditional asterisk-based breaks
   ```typescript
   const config = {
     style: 'asterisk',
     symbol: '* * *',
     fontSize: '18px',
     textAlign: 'center'
   };
   ```

2. **Symbol Style**: Unicode decorative symbols
   ```typescript
   const config = {
     style: 'symbol',
     symbol: '❦',  // or ✦, ✻, ※, ◆, etc.
     fontSize: '24px',
     textAlign: 'center'
   };
   ```

3. **Image Style**: Custom ornamental images
   ```typescript
   const config = {
     style: 'image',
     imageUrl: '/assets/ornaments/divider.svg',
     imageAlt: 'Decorative divider',
     textAlign: 'center'
   };
   ```

4. **Custom Style**: Custom text or HTML-safe content
   ```typescript
   const config = {
     style: 'custom',
     symbol: '— THE END —',
     fontSize: '14px',
     textAlign: 'center'
   };
   ```

#### Ornamental Break Configuration

```typescript
interface OrnamentalBreakConfig {
  style: 'asterisk' | 'symbol' | 'image' | 'custom';
  symbol?: string;           // Symbol or text to display
  imageUrl?: string;         // URL for image style
  imageAlt?: string;         // Alt text for image
  fontSize?: string;         // CSS font size
  textAlign?: 'left' | 'center' | 'right';
  marginTop?: string;        // CSS margin top
  marginBottom?: string;     // CSS margin bottom
}
```

**Usage:**
```typescript
import { generateOrnamentalBreak } from './bookToHtml';

const config = {
  style: 'symbol',
  symbol: '❦',
  fontSize: '24px',
  textAlign: 'center',
  marginTop: '2em',
  marginBottom: '2em'
};

const ornamentalBreak = generateOrnamentalBreak(config);
```

### 4. BookStyle Integration

Ornamental breaks can be generated from BookStyle configurations:

```typescript
import { generateOrnamentalBreakFromStyle } from './bookToHtml';

const bookStyle = {
  ornamentalBreak: {
    enabled: true,
    symbol: '✻',
    fontSize: '20px',
    textAlign: 'center',
    marginTop: '2em',
    marginBottom: '2em'
  }
};

const break = generateOrnamentalBreakFromStyle(bookStyle);
```

### 5. CSS Generation

The module provides a complete CSS stylesheet for all break types:

```typescript
import { generateBreakStyles } from './bookToHtml';

const css = generateBreakStyles('book');
// Returns complete CSS with:
// - Scene break styles
// - Page break styles (print-specific)
// - Ornamental break styles
// - Media queries for print and screen
```

## HtmlConverter Integration

The `HtmlConverter` class includes methods for converting breaks:

```typescript
class HtmlConverter {
  // Convert Break text features
  private convertBreak(
    breakType: 'line' | 'section' | 'page' | 'scene',
    symbol?: string
  ): string;

  // Convert ornamental breaks with custom config
  private convertOrnamentalBreak(
    style?: string,
    symbol?: string
  ): string;
}
```

## BookToHtmlOptions

Extended options for break configuration:

```typescript
interface BookToHtmlOptions {
  // ... other options

  /** Ornamental break configuration */
  ornamentalBreakConfig?: OrnamentalBreakConfig;

  /** Enable page break hints for print */
  enablePageBreaks?: boolean;
}
```

## CSS Classes

All breaks use consistent, prefixed CSS classes (default prefix: `book`):

### Scene Breaks
- `.book-scene-break`: Base scene break class
- `.book-scene-break-ornamental`: Scene break with symbol

### Page Breaks
- `.book-page-break`: Page break hint

### Ornamental Breaks
- `.book-ornamental-break`: Base ornamental break class
- `.book-ornamental-break-asterisk`: Asterisk style
- `.book-ornamental-break-symbol`: Symbol style
- `.book-ornamental-break-image`: Image style
- `.book-ornamental-break-custom`: Custom style

## Print-Specific Behavior

### Page Breaks
```css
/* Hidden on screen */
@media screen {
  .book-page-break {
    display: none;
  }
}

/* Visible and functional in print */
@media print {
  .book-page-break {
    display: block;
    page-break-before: always;
    break-before: page;
  }
}
```

### Spacing Adjustments
Scene breaks and ornamental breaks have adjusted margins in print mode to conserve space while maintaining readability.

## Popular Ornamental Symbols

Here are some commonly used Unicode symbols for ornamental breaks:

- `❦` - Floral Heart
- `✦` - Four Pointed Star
- `✻` - Eight Pointed Star
- `※` - Reference Mark
- `◆` - Diamond
- `✿` - Flower
- `❄` - Snowflake
- `☼` - Sun
- `⁎` - Asterisk Operator

## Security

All text content is properly escaped using the `escapeHtml` function to prevent XSS attacks. Image URLs are sanitized to allow only valid URL characters while preventing injection.

## Examples

See `src/examples/breakGenerationExample.ts` for comprehensive usage examples.

## Testing

Comprehensive unit tests are available in `src/lib/pdf/__tests__/bookToHtml.breaks.test.ts`:

- 24 test cases covering all break types
- Tests for HTML escaping and XSS prevention
- Tests for custom class prefixes
- Integration tests for complete workflows

Run tests:
```bash
npm test -- src/lib/pdf/__tests__/bookToHtml.breaks.test.ts
```

## API Reference

### Functions

#### `generateSceneBreak(symbol?, classPrefix?): string`
Generates HTML for a scene break.

**Parameters:**
- `symbol` (optional): Symbol to display, or undefined for simple HR
- `classPrefix` (optional): CSS class prefix (default: 'book')

**Returns:** HTML string

#### `generatePageBreak(classPrefix?): string`
Generates HTML for a page break hint.

**Parameters:**
- `classPrefix` (optional): CSS class prefix (default: 'book')

**Returns:** HTML string

#### `generateOrnamentalBreak(config, classPrefix?): string`
Generates HTML for an ornamental break.

**Parameters:**
- `config`: OrnamentalBreakConfig object
- `classPrefix` (optional): CSS class prefix (default: 'book')

**Returns:** HTML string

#### `generateOrnamentalBreakFromStyle(bookStyle, classPrefix?): string`
Generates ornamental break from BookStyle configuration.

**Parameters:**
- `bookStyle`: BookStyle object with ornamentalBreak settings
- `classPrefix` (optional): CSS class prefix (default: 'book')

**Returns:** HTML string

#### `generateBreakStyles(classPrefix?): string`
Generates CSS styles for all break types.

**Parameters:**
- `classPrefix` (optional): CSS class prefix (default: 'book')

**Returns:** CSS string

## Implementation Details

### HTML Structure

**Scene Break (simple):**
```html
<hr class="book-scene-break" />
```

**Scene Break (with symbol):**
```html
<div class="book-scene-break book-scene-break-ornamental">* * *</div>
```

**Page Break:**
```html
<div class="book-page-break"></div>
```

**Ornamental Break:**
```html
<div class="book-ornamental-break book-ornamental-break-symbol"
     style="font-size: 24px; text-align: center; margin-top: 2em; margin-bottom: 2em;">
  ❦
</div>
```

## Related Types

- `Break` - Text feature type from `types/textFeature.ts`
- `BookStyle` - Style configuration from `types/style.ts`
- `Element` - Book element type from `types/element.ts`

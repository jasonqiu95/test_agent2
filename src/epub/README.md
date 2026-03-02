# EPUB Scene Break Converter

Converts scene breaks to EPUB-compatible HTML with proper CSS classes and data attributes for styling.

## Features

- **Simple Breaks**: Converts scene breaks to horizontal rules (`<hr>` tags)
- **Ornamental Breaks**: Creates decorative breaks with custom symbols
- **CSS Generation**: Generates complete CSS stylesheets for scene breaks
- **Data Attributes**: Adds data attributes for styling hooks and JavaScript interaction
- **BookStyle Integration**: Works seamlessly with BookStyle configuration
- **Accessibility**: Includes ARIA labels and semantic HTML

## Installation

```typescript
import {
  convertSceneBreakToHtml,
  convertSceneBreaksToHtml,
  generateSceneBreakCss,
  isOrnamentalBreak,
} from './epub/scene-break-converter';
```

## Usage

### Basic Scene Break

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

### Ornamental Break with BookStyle

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

### Custom Class Prefix

```typescript
const html = convertSceneBreakToHtml(breakFeature, {
  classPrefix: 'my-book',
});
// Output: <hr class="my-book-scene-break my-book-scene-break--simple" ... />
```

### Additional Classes and Data Attributes

```typescript
const html = convertSceneBreakToHtml(breakFeature, {
  additionalClasses: ['custom-styling', 'special-break'],
  additionalDataAttributes: {
    'chapter': '7',
    'position': 'end',
  },
});
```

### Batch Conversion

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

### Generate CSS Stylesheet

```typescript
import { generateSceneBreakCss } from './epub';

const css = generateSceneBreakCss('epub', bookStyle);
// Returns complete CSS for scene breaks
```

### Check if Break is Ornamental

```typescript
import { isOrnamentalBreak } from './epub';

const isOrn = isOrnamentalBreak(breakFeature, bookStyle);
// Returns true if break should be rendered as ornamental
```

## API Reference

### `convertSceneBreakToHtml(breakFeature, options?)`

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

### `convertSceneBreaksToHtml(breaks, options?)`

Batch converts multiple Break features to HTML.

**Parameters:**
- `breaks: Break[]` - Array of break features
- `options?: SceneBreakConverterOptions` - Conversion options

**Returns:** `string[]` - Array of HTML strings

### `generateSceneBreakCss(classPrefix?, bookStyle?)`

Generates complete CSS stylesheet for scene breaks.

**Parameters:**
- `classPrefix?: string` - CSS class prefix (default: 'epub')
- `bookStyle?: BookStyle` - Book style configuration

**Returns:** `string` - CSS stylesheet

### `isOrnamentalBreak(breakFeature, bookStyle?)`

Checks if a break should be rendered as ornamental.

**Parameters:**
- `breakFeature: Break` - The break feature
- `bookStyle?: BookStyle` - Book style configuration

**Returns:** `boolean` - True if break should be ornamental

## Output HTML

### Simple Break

```html
<hr class="epub-scene-break epub-scene-break--simple"
    data-break-type="scene"
    data-break-id="break-123" />
```

### Ornamental Break

```html
<hr class="epub-scene-break epub-scene-break--ornamental"
    data-break-type="scene"
    data-ornamental="true"
    data-symbol="❦"
    style="text-align: center; margin-top: 2em; margin-bottom: 2em"
    role="separator"
    aria-label="Scene break" />
```

## CSS Classes

- `.epub-scene-break` - Base class for all scene breaks
- `.epub-scene-break--simple` - Simple horizontal rule break
- `.epub-scene-break--ornamental` - Ornamental break with symbol
- `.epub-scene-break::before` - Pseudo-element for ornamental symbol

## Data Attributes

- `data-break-type` - Type of break (scene, section, page, line)
- `data-break-id` - Unique identifier for the break
- `data-ornamental` - "true" if ornamental break
- `data-symbol` - Symbol to display (for ornamental breaks)
- Custom attributes via `additionalDataAttributes` option

## Break Types

- **scene**: Scene break within a chapter
- **section**: Section break between major parts
- **page**: Page break (for print)
- **line**: Line break (inline)

## Ornamental Symbols

Common ornamental symbols for scene breaks:

- `❦` - Floral heart
- `✦` - Four pointed star
- `✻` - Eight pointed star
- `※` - Reference mark
- `◆` - Diamond
- `* * *` - Three asterisks
- `~ ~ ~` - Three tildes

## Integration with EPUB Generation

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

## Examples

See `examples/scene-break-usage.ts` for complete usage examples.

## Testing

Run tests with:

```bash
npm test src/epub/__tests__/scene-break-converter.test.ts
```

## License

Part of the EPUB Book Publishing application.

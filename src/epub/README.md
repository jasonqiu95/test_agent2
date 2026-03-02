# HTML Sanitization Utility

A comprehensive HTML sanitization library for EPUB generation and user-generated content, providing security against XSS attacks and malformed HTML.

## Features

- **Security-first**: Removes dangerous tags, attributes, and JavaScript execution vectors
- **Configurable**: Whitelist-based approach with customizable options
- **Structure validation**: Detects and reports HTML structure issues
- **Malformed HTML cleanup**: Automatically fixes common HTML errors
- **Special character encoding**: Proper handling of HTML entities
- **Browser and Node.js compatible**: Works in both browser and jsdom test environments

## Usage

### Basic Sanitization

```typescript
import { sanitizeHtml } from './epub/html-sanitizer';

// Simple sanitization with default options
const dirty = '<p>Hello <script>alert("XSS")</script> World!</p>';
const clean = sanitizeHtml(dirty);
// Result: '<p>Hello  World!</p>'
```

### Advanced Usage with Options

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

### Utility Functions

#### Encode Special Characters

```typescript
import { encodeSpecialCharacters } from './epub/html-sanitizer';

const encoded = encodeSpecialCharacters('<script>alert("XSS")</script>');
// Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
```

#### Decode HTML Entities

```typescript
import { decodeHtmlEntities } from './epub/html-sanitizer';

const decoded = decodeHtmlEntities('&lt;p&gt;Hello&lt;/p&gt;');
// Result: '<p>Hello</p>'
```

#### Validate HTML Structure

```typescript
import { validateHtmlStructure } from './epub/html-sanitizer';

const validation = validateHtmlStructure('<div><p>Unclosed div');
console.log(validation.valid);   // false
console.log(validation.errors);  // Array of error messages
```

#### Clean Malformed HTML

```typescript
import { cleanMalformedHtml } from './epub/html-sanitizer';

const cleaned = cleanMalformedHtml('<div><p>Unclosed<div>Content</div>');
// Browser automatically closes the unclosed <p> tag
```

## Default Safe Tags

The sanitizer allows these HTML tags by default:

### Structure
- `div`, `span`, `p`, `br`, `hr`

### Headings
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

### Lists
- `ul`, `ol`, `li`, `dl`, `dt`, `dd`

### Text Formatting
- `strong`, `b`, `em`, `i`, `u`, `s`, `del`, `ins`
- `sub`, `sup`, `small`, `mark`, `code`, `pre`

### Semantic Elements
- `blockquote`, `q`, `cite`, `abbr`, `dfn`
- `time`, `address`, `figure`, `figcaption`

### Tables
- `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`
- `caption`, `col`, `colgroup`

### Links and Media
- `a`, `img`

### EPUB-specific
- `section`, `article`, `nav`, `aside`, `header`, `footer`
- `main`, `details`, `summary`

## Default Safe Attributes

### Global Attributes
- `id`, `class`, `title`, `lang`, `dir`

### Tag-specific Attributes
- **Links (`a`)**: `href`, `target`, `rel`, `name`
- **Images (`img`)**: `src`, `alt`, `width`, `height`, `loading`
- **Tables**: `border`, `cellpadding`, `cellspacing`, `colspan`, `rowspan`, `align`, `valign`, `scope`, `span`
- **Time (`time`)**: `datetime`
- **Quotes (`blockquote`, `q`)**: `cite`
- **Edits (`del`, `ins`)**: `cite`, `datetime`
- **Abbreviations (`abbr`)**: `title`

## Security Features

### Automatically Removed

1. **Dangerous Tags**: `script`, `style`, `iframe`, `object`, `embed`, `link`, `base`
2. **Event Handlers**: `onclick`, `onload`, `onerror`, `onmouseover`, etc.
3. **Dangerous URL Protocols**: `javascript:`, `data:`, `vbscript:`
4. **Dangerous CSS**: `behavior`, `expression`, `moz-binding`, etc.

### URL Validation

Safe protocols by default:
- `http:`, `https:`
- `mailto:`, `tel:`
- `#` (fragment identifiers)
- Relative URLs (`/path`, `./path`, `../path`)

## EPUB Integration

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

## Testing

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

## Performance Considerations

- Uses native browser DOM APIs for parsing and manipulation
- Efficient whitelist-based approach
- Single-pass sanitization algorithm
- Minimal memory overhead

## Browser Compatibility

Works in all modern browsers and Node.js environments with jsdom:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Node.js with jsdom (for testing)

## License

Part of the Electron Book Publishing App project.

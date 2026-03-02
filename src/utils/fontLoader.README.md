# Font Loader Module

A comprehensive font loading system for web applications that handles Google Fonts, custom font files, @font-face generation, and font fallback chains.

## Features

- ✅ **Google Fonts Integration** - Automatic URL generation for Google Fonts API
- ✅ **Custom Font Support** - @font-face rule generation for self-hosted fonts
- ✅ **Font Fallback Chains** - Intelligent fallback font stacks for better compatibility
- ✅ **Font Validation** - Security-focused font family name validation
- ✅ **Multiple Format Support** - WOFF2, WOFF, TTF, OTF, EOT
- ✅ **Font Preloading** - Performance optimization with font preloading
- ✅ **Weight & Style Variants** - Support for multiple font weights and styles
- ✅ **TypeScript Support** - Full type safety with TypeScript definitions

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Performance Tips](#performance-tips)

## Installation

The font loader is part of the utils module:

```typescript
import {
  generateFontLoadingConfig,
  extractFontFamilies,
  generateGoogleFontsUrl,
  generateFontFaceRule,
  createFontFallbackChain,
  preloadFont,
} from '../utils/fontLoader';
```

## Basic Usage

### 1. Extract Font Families

Parse font family strings and extract individual fonts:

```typescript
const result = extractFontFamilies("'EB Garamond', 'Georgia', serif");

console.log(result.primary);        // "EB Garamond"
console.log(result.families);       // ["EB Garamond", "Georgia", "serif"]
console.log(result.fallbackChain);  // "'EB Garamond', Georgia, serif"
console.log(result.source);         // "google", "system", or "custom"
```

### 2. Load Google Fonts

Generate a Google Fonts URL and add it to your document:

```typescript
const url = generateGoogleFontsUrl(
  ['EB Garamond', 'Roboto'],
  [400, 700],
  ['normal', 'italic']
);

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = url;
document.head.appendChild(link);
```

### 3. Generate @font-face Rules

Create CSS for custom fonts:

```typescript
const css = generateFontFaceRule({
  family: 'Custom Font',
  weight: 400,
  style: 'normal',
  sources: [
    { url: '/fonts/custom.woff2', format: 'woff2' },
    { url: '/fonts/custom.woff', format: 'woff' }
  ],
  display: 'swap'
});

const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);
```

### 4. Complete Configuration from BookStyle

Generate a complete font loading configuration:

```typescript
const config = generateFontLoadingConfig(bookStyle, customFonts);

// Load Google Fonts
if (config.googleFontsUrl) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = config.googleFontsUrl;
  document.head.appendChild(link);
}

// Add custom fonts
if (config.fontFaceRules) {
  const style = document.createElement('style');
  style.textContent = config.fontFaceRules;
  document.head.appendChild(style);
}
```

## API Reference

### `extractFontFamilies(fontFamily: string): ExtractedFont`

Extracts and validates font family names from a CSS font-family string.

**Parameters:**
- `fontFamily` - Font family string (e.g., "'Garamond', serif")

**Returns:**
- `ExtractedFont` object with:
  - `primary` - Primary font family name
  - `families` - Array of all font families
  - `fallbackChain` - CSS-ready font stack string
  - `source` - Font source type ('google', 'system', or 'custom')

### `generateGoogleFontsUrl(fontFamilies: string[], weights?: FontWeight[], styles?: FontStyle[]): string`

Generates a Google Fonts API URL for loading fonts.

**Parameters:**
- `fontFamilies` - Array of Google Font family names
- `weights` - Array of font weights (default: [400, 700])
- `styles` - Array of font styles (default: ['normal', 'italic'])

**Returns:**
- Google Fonts URL string or empty string if no Google Fonts found

### `generateFontFaceRule(config: CustomFontConfig): string`

Generates a @font-face CSS rule for a custom font.

**Parameters:**
- `config` - Custom font configuration object

**Returns:**
- @font-face CSS rule string

### `createFontFallbackChain(primaryFont: string, category: BookStyleCategory): string`

Creates a font fallback chain with web-safe alternatives.

**Parameters:**
- `primaryFont` - Primary font family name
- `category` - Font category ('serif', 'sans-serif', 'script', 'modern', 'custom')

**Returns:**
- Complete font stack as CSS string

### `generateFontLoadingConfig(styleConfig: BookStyle, customFonts?: CustomFontConfig[])`

Generates complete font loading configuration from a BookStyle.

**Parameters:**
- `styleConfig` - Book style configuration
- `customFonts` - Optional array of custom font configurations

**Returns:**
- Object with:
  - `googleFontsUrl` - Google Fonts URL
  - `fontFaceRules` - Custom @font-face CSS
  - `fonts` - Array of extracted fonts

### `preloadFont(fontUrl: string, format?: FontFormat): HTMLLinkElement`

Creates a preload link element for a font file.

**Parameters:**
- `fontUrl` - URL to the font file
- `format` - Font format (default: 'woff2')

**Returns:**
- HTMLLinkElement for preloading

### `validateFontFamily(fontFamily: string): boolean`

Validates a font family name for security and correctness.

**Parameters:**
- `fontFamily` - Font family name to validate

**Returns:**
- `true` if valid, `false` otherwise

### `parseFontWeight(weight: FontWeight | string | undefined): number`

Parses font weight from various formats to numeric value.

**Parameters:**
- `weight` - Font weight in any format

**Returns:**
- Numeric font weight (100-900)

## Examples

### Example 1: Basic Google Fonts

```typescript
const url = generateGoogleFontsUrl(['Roboto']);
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = url;
document.head.appendChild(link);
```

### Example 2: Custom Font with Multiple Formats

```typescript
const css = generateFontFaceRule({
  family: 'MyFont',
  weight: 400,
  style: 'normal',
  sources: [
    { url: '/fonts/myfont.woff2', format: 'woff2' },
    { url: '/fonts/myfont.woff', format: 'woff' },
    { url: '/fonts/myfont.ttf', format: 'ttf' }
  ],
  display: 'swap',
  unicodeRange: 'U+0000-00FF'
});
```

### Example 3: Font Fallback Chain

```typescript
const stack = createFontFallbackChain('Garamond', 'serif');
// Result: "'Garamond', 'Palatino', 'Georgia', 'Times New Roman', serif"
```

### Example 4: Preload Critical Fonts

```typescript
const link = preloadFont('/fonts/critical.woff2', 'woff2');
document.head.appendChild(link);
```

### Example 5: React Hook

```typescript
function useFontLoader(bookStyle: BookStyle) {
  React.useEffect(() => {
    const config = generateFontLoadingConfig(bookStyle);

    if (config.googleFontsUrl) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = config.googleFontsUrl;
      document.head.appendChild(link);
    }

    if (config.fontFaceRules) {
      const style = document.createElement('style');
      style.textContent = config.fontFaceRules;
      document.head.appendChild(style);
    }
  }, [bookStyle]);
}
```

## Best Practices

### 1. Font Loading Strategy

Use `font-display: swap` for better performance:

```typescript
{
  display: 'swap'  // Recommended for most cases
}
```

Options:
- `swap` - Show fallback immediately, swap when loaded (best UX)
- `block` - Hide text briefly, then show with custom font
- `fallback` - Brief hide, then fallback, then custom font
- `optional` - Only use custom font if cached

### 2. Subsetting Fonts

Specify unicode ranges to reduce file size:

```typescript
{
  unicodeRange: 'U+0000-00FF'  // Basic Latin
}
```

### 3. Font Format Priority

List formats in order of preference:

```typescript
sources: [
  { url: 'font.woff2', format: 'woff2' },  // Best compression
  { url: 'font.woff', format: 'woff' },    // Good fallback
  { url: 'font.ttf', format: 'ttf' }       // Universal support
]
```

### 4. Preload Critical Fonts

Preload fonts used above the fold:

```typescript
const link = preloadFont('/fonts/heading.woff2', 'woff2');
document.head.appendChild(link);
```

### 5. Font Validation

Always validate user-provided font names:

```typescript
if (validateFontFamily(userFont)) {
  // Safe to use
} else {
  // Use fallback
}
```

## Performance Tips

1. **Limit Font Variants**: Only load weights and styles you actually use
2. **Use WOFF2**: Modern format with best compression (~30% smaller than WOFF)
3. **Subset Fonts**: Include only required characters/languages
4. **Preload Critical Fonts**: Use `<link rel="preload">` for above-the-fold fonts
5. **Font Display Swap**: Use `font-display: swap` for better perceived performance
6. **HTTP/2**: Serve fonts over HTTP/2 for better multiplexing
7. **CDN**: Use CDN for Google Fonts or host fonts on CDN
8. **Cache Headers**: Set long cache expiration for font files

### Optimal Google Fonts Loading

```typescript
// Only load weights you need
const url = generateGoogleFontsUrl(
  ['Roboto'],
  [400, 700],  // Regular and bold only
  ['normal']   // No italics if not needed
);
```

### Optimal Custom Font Setup

```typescript
const config: CustomFontConfig = {
  family: 'MyFont',
  weight: 400,
  style: 'normal',
  sources: [
    { url: '/fonts/myfont.woff2', format: 'woff2' }  // WOFF2 only
  ],
  display: 'swap',
  unicodeRange: 'U+0000-00FF, U+0131'  // Latin subset
};
```

## Browser Support

- **WOFF2**: Chrome 36+, Firefox 39+, Safari 12+, Edge 14+
- **WOFF**: All modern browsers
- **TTF/OTF**: Universal support
- **EOT**: IE only (deprecated)

## Security

The font loader includes security measures:

- ✅ Font family name validation to prevent CSS injection
- ✅ Safe HTML escaping in generated CSS
- ✅ URL encoding for font URLs
- ✅ CORS handling for external fonts

## TypeScript Types

```typescript
type FontSource = 'google' | 'custom' | 'system';
type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 'normal' | 'bold';
type FontStyle = 'normal' | 'italic' | 'oblique';
type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf' | 'eot';

interface CustomFontConfig {
  family: string;
  weight?: FontWeight;
  style?: FontStyle;
  sources: Array<{ url: string; format: FontFormat }>;
  unicodeRange?: string;
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

interface ExtractedFont {
  primary: string;
  families: string[];
  fallbackChain: string;
  source: FontSource;
}
```

## Testing

The font loader includes comprehensive test coverage:

```bash
npm test -- fontLoader.test.ts
```

Tests cover:
- Font family extraction
- Google Fonts URL generation
- @font-face rule generation
- Font fallback chains
- Font validation
- Weight parsing
- Complete configuration generation

## License

MIT

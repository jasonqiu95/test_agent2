# Built-in Book Styles

This directory contains professionally designed book typography styles for various publishing needs.

## Available Styles

### Serif Styles (5)
Ideal for traditional book publishing, literary fiction, and long-form reading.

- **Baskerville Classic** - Refined transitional serif with elegant proportions
- **Garamond Elegance** - Timeless old-style serif with graceful curves
- **Caslon Heritage** - Distinguished old-style serif with historical charm
- **Minion Pro Classic** - Versatile old-style serif for academic works
- **Palatino Traditional** - Renaissance-inspired serif for memoirs

### Sans-Serif Styles (4)
Perfect for contemporary non-fiction, technical writing, and modern publications.

- **Helvetica Modern** - Clean minimalist design
- **Avenir Light** - Geometric with humanist influences
- **Gill Sans Humanist** - British classic with humanist proportions
- **Optima Elegant** - Humanist sans with flared strokes

### Script Styles (1)
Decorative typefaces for special elements and ornamental use.

- **Edwardian Script** - Elegant calligraphic script

### Modern Styles (3)
Bold, contemporary designs for avant-garde and design-focused publications.

- **Futura Bold** - Strong geometric modernist character
- **Didot Refined** - Elegant neoclassical with high contrast
- **Century Gothic Clean** - Approachable geometric sans

## Style Components

Each style includes comprehensive definitions for:

### Typography
- **Font families**: Body text, headings, and optional script fonts with web-safe fallbacks
- **Heading styles**: Complete H1-H3 styling (font size, weight, spacing, transforms)
- **Body text**: Font size, line height, weight, and alignment

### Special Features
- **Drop caps**: Initial letter styling (size, lines, spacing, color)
- **Ornamental breaks**: Scene break symbols and decorative elements
- **First paragraph**: Special treatment for opening paragraphs (small-caps, letterspacing)

### Layout
- **Spacing**: Paragraph, line, section, and chapter spacing
- **Colors**: Text, heading, accent, background, and drop cap colors

## Usage

```typescript
import { allStyles, getStyleById, stylesByCategory } from './data/styles';

// Get all styles
const styles = allStyles;

// Get a specific style
const baskerville = getStyleById('baskerville');

// Get styles by category
const serifStyles = stylesByCategory.serif;
```

## Style Application

Each style can be applied programmatically to generate CSS:

```typescript
const style = getStyleById('garamond');

// Apply to body text
const bodyStyles = {
  fontFamily: style.fonts.body,
  fontSize: style.body.fontSize,
  lineHeight: style.body.lineHeight,
  color: style.colors.text,
};

// Apply to headings
const h1Styles = {
  fontFamily: style.fonts.heading,
  ...style.headings.h1,
  color: style.colors.heading,
};
```

## Customization

Styles can be extended or overridden:

```typescript
const customStyle = {
  ...getStyleById('baskerville'),
  colors: {
    ...getStyleById('baskerville')!.colors,
    accent: '#custom-color',
  },
};
```

## Adding New Styles

1. Create a new JSON file in this directory
2. Follow the `BookStyle` interface from `src/types/style.ts`
3. Import and export in `index.ts`
4. Add to appropriate category in `stylesByCategory`

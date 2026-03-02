# Book to HTML CSS Class System

## Overview

This directory contains a comprehensive CSS class naming system for converting book structures to HTML. The system provides consistent, semantic, and maintainable CSS classes for all HTML elements, supporting both ebook and print CSS requirements with theme-specific variations.

## Key Features

✅ **Comprehensive Class Constants** - Centralized class names organized by category
✅ **Dynamic Class Generation** - Fluent API via `ClassBuilder` for flexible class creation
✅ **Style Mapping** - Automatic conversion of `BookStyle` and `Style` objects to CSS classes
✅ **Theme Support** - Built-in support for multiple theme variations
✅ **Print & Ebook CSS** - Classes designed for both digital and print media
✅ **BEM-like Naming** - Consistent, predictable naming convention
✅ **Type Safety** - Full TypeScript support with enums and interfaces
✅ **Extensible** - Easy to extend with custom mappings and modifiers

## File Structure

```
src/lib/pdf/
├── bookToHtml.ts                      # Main implementation
├── README.md                          # This file
├── CSS_CLASS_API.md                   # Comprehensive API documentation
├── examples/
│   └── cssClassSystemExample.ts       # Usage examples
└── __tests__/
    └── cssClassSystem.test.ts         # Unit tests
```

## Quick Start

### Basic Usage

```typescript
import { ClassBuilder, CssClassNames } from './bookToHtml';

// Create a class builder
const builder = new ClassBuilder({ prefix: 'book' });

// Build paragraph classes
const classes = builder
  .add('paragraph')
  .state('first')
  .typography('drop-cap')
  .build();

// Result: ['book-paragraph', 'book-state-first', 'book-typography-drop-cap']
```

### With Style Mapping

```typescript
import { StyleMapper } from './bookToHtml';
import { BookStyle } from '../../types/style';

const mapper = new StyleMapper('book');

// Map book style to classes
const classes = mapper.mapBookStyle(bookStyle);

// Map individual style properties
const paragraphClasses = mapper.mapParagraph(
  true,  // isFirst
  true,  // hasDropCap
  customStyle
);
```

### Complete Example

```typescript
import {
  ClassBuilder,
  ThemeType,
  classesToAttribute,
} from './bookToHtml';

// Chapter section with theme
const builder = new ClassBuilder({
  prefix: 'book',
  theme: ThemeType.ELEGANT,
});

const sectionClasses = builder
  .section('body-chapter')
  .theme()
  .print('page-break-before')
  .build();

const html = `<section${classesToAttribute(sectionClasses)}>
  <!-- Chapter content -->
</section>`;
```

## Architecture

### 1. Class Constants (`CssClassNames`)

Static class name constants organized by category:

- **Layout** - Container and structural classes
- **Section** - Book section types (front-matter, body, back-matter)
- **Element** - Content elements (paragraph, heading, image, etc.)
- **Typography** - Text formatting (drop-cap, italic, bold, etc.)
- **State** - Dynamic states (first, last, active, has-drop-cap)
- **Theme** - Theme variations (serif, sans-serif, modern, elegant)
- **Print** - Print-specific (page-break-before, running-header, etc.)
- **Align** - Text alignment (left, center, right, justify)
- **Spacing** - Spacing modifiers (tight, normal, loose)

### 2. ClassBuilder

Fluent API for dynamic class generation:

```typescript
new ClassBuilder(options)
  .add(className)           // Add base class
  .modifier(base, mod)      // Add with modifier
  .element(type)            // Add element type
  .section(type)            // Add section type
  .typography(class)        // Add typography class
  .theme(theme)             // Add theme class
  .state(state)             // Add state class
  .print(class)             // Add print class
  .align(alignment)         // Add alignment
  .spacing(spacing)         // Add spacing
  .when(condition, class)   // Conditional add
  .raw(class)               // Add raw class
  .build()                  // Return array
  .buildString()            // Return string
```

### 3. StyleMapper

Converts style objects to CSS classes:

- `mapBookStyle(bookStyle)` - Map `BookStyle` to classes
- `mapStyle(style)` - Map `Style` to classes
- `mapHeadingLevel(level)` - Generate heading classes
- `mapParagraph(isFirst, hasDropCap)` - Generate paragraph classes
- `mapElementType(type, matter)` - Generate element type classes

### 4. Utility Functions

Helper functions for common operations:

- `generateSectionClasses()` - Generate section classes from context
- `generateParagraphClasses()` - Generate paragraph classes from context
- `generateHeadingClasses()` - Generate heading classes
- `generateElementClasses()` - Generate element classes
- `generatePrintClasses()` - Generate print-specific classes
- `combineClasses()` - Combine and deduplicate class arrays
- `classesToAttribute()` - Convert to HTML class attribute string

## Class Naming Convention

All classes follow a BEM-like naming pattern:

```
{prefix}-{category}-{name}--{modifier}
```

**Examples:**

- `book-element-paragraph` - Base paragraph element
- `book-element-paragraph--first` - First paragraph modifier
- `book-typography-drop-cap` - Typography modifier
- `book-theme-serif` - Theme variation
- `book-print-page-break-before` - Print-specific class
- `book-state-has-drop-cap` - State indicator

**Default Prefix:** `book` (configurable via options)

## Theme System

Built-in theme types:

- `ThemeType.SERIF` - Traditional serif fonts
- `ThemeType.SANS_SERIF` - Modern sans-serif fonts
- `ThemeType.SCRIPT` - Decorative script fonts
- `ThemeType.MODERN` - Contemporary styling
- `ThemeType.CLASSIC` - Classic book styling
- `ThemeType.MINIMAL` - Minimalist approach
- `ThemeType.ELEGANT` - Elegant, refined styling

Usage:

```typescript
const builder = new ClassBuilder({
  theme: ThemeType.ELEGANT
});

builder.theme(); // Adds: book-theme-elegant
```

## Print & Ebook Support

### Print-Specific Classes

```typescript
// Page breaks
builder.print('page-break-before');
builder.print('page-break-after');
builder.print('page-break-avoid');

// Running elements
builder.print('running-header');
builder.print('running-footer');
builder.print('page-number');
```

### CSS Media Queries

Classes are designed to work with media queries:

```css
/* Base styles */
.book-element-paragraph {
  margin-bottom: 1em;
}

/* Print-specific */
@media print {
  .book-print-page-break-before {
    page-break-before: always;
  }

  .book-print-page-break-avoid {
    page-break-inside: avoid;
  }
}

/* Ebook-specific */
@media screen {
  .book-element-paragraph {
    margin-bottom: 1.5em;
  }
}
```

## API Documentation

For complete API documentation, see:

- [CSS_CLASS_API.md](./CSS_CLASS_API.md) - Comprehensive API reference
- [cssClassSystemExample.ts](./examples/cssClassSystemExample.ts) - Usage examples

## Testing

Run tests:

```bash
npm test src/lib/pdf/__tests__/cssClassSystem.test.ts
```

The test suite covers:

- ✅ Class constant integrity
- ✅ ClassBuilder methods and chaining
- ✅ StyleMapper conversions
- ✅ Utility functions
- ✅ Integration scenarios

## Examples

### Example 1: Chapter Opening

```typescript
const builder = new ClassBuilder({
  prefix: 'book',
  theme: ThemeType.SERIF
});

// Chapter section
const sectionClasses = builder
  .section('body-chapter')
  .theme()
  .print('page-break-before')
  .build();

// Chapter title
builder.reset();
const titleClasses = builder
  .add('heading')
  .modifier('heading', 'h1')
  .align('center')
  .print('page-break-avoid')
  .build();

// First paragraph with drop cap
builder.reset();
const paragraphClasses = builder
  .add('paragraph')
  .state('first')
  .typography('drop-cap')
  .state('has-drop-cap')
  .state('no-indent')
  .build();
```

### Example 2: Front Matter Element

```typescript
const builder = new ClassBuilder({ prefix: 'book' });

// Dedication
const dedicationClasses = builder
  .element('dedication')
  .section('front-matter')
  .align('center')
  .print('page-break-before')
  .spacing('loose')
  .build();
```

### Example 3: Using Context-Based Generation

```typescript
import {
  generateSectionClasses,
  generateParagraphClasses,
  HtmlGenerationContext
} from './bookToHtml';

const context: HtmlGenerationContext = {
  sectionType: 'body-chapter',
  isFirstParagraph: true,
  styleConfig: bookStyle,
  options: { classPrefix: 'book' },
  // ... other context properties
};

const sectionClasses = generateSectionClasses('body-chapter', context);
const paragraphClasses = generateParagraphClasses(context);
```

### Example 4: Style Mapping

```typescript
const mapper = new StyleMapper('book');

// Map book style
const bookClasses = mapper.mapBookStyle(bookStyle);

// Map element style
const styleClasses = mapper.mapStyle({
  fontWeight: 'bold',
  textAlign: 'center',
  fontStyle: 'italic'
});

// Combine
const combined = combineClasses(bookClasses, styleClasses);
```

## CSS Integration

### Recommended CSS Structure

```css
/* 1. Base Element Styles */
.book-element-paragraph { /* ... */ }
.book-element-heading { /* ... */ }

/* 2. Typography Modifiers */
.book-typography-drop-cap::first-letter { /* ... */ }
.book-typography-small-caps { /* ... */ }

/* 3. State Variations */
.book-state-first.book-element-paragraph { /* ... */ }
.book-state-has-drop-cap { /* ... */ }

/* 4. Theme Variations */
.book-theme-serif { /* ... */ }
.book-theme-sans-serif { /* ... */ }

/* 5. Print-Specific */
@media print {
  .book-print-page-break-before { /* ... */ }
  .book-print-page-break-avoid { /* ... */ }
}

/* 6. Alignment */
.book-align-left { text-align: left; }
.book-align-center { text-align: center; }
.book-align-right { text-align: right; }
.book-align-justify { text-align: justify; }

/* 7. Spacing */
.book-spacing-tight { /* ... */ }
.book-spacing-normal { /* ... */ }
.book-spacing-loose { /* ... */ }
```

## Best Practices

1. **Use ClassBuilder for Dynamic Generation**
   - Prefer `ClassBuilder` over manual string concatenation
   - Chain methods for readable, maintainable code

2. **Leverage StyleMapper**
   - Use `StyleMapper` to convert style objects automatically
   - Extend with custom mappings as needed

3. **Keep Classes Semantic**
   - Use descriptive class names that reflect purpose
   - Follow BEM-like conventions consistently

4. **Separate Print and Screen Concerns**
   - Use print-specific classes for page layout
   - Use media queries for format-specific styling

5. **Theme at Root Level**
   - Apply theme classes to root or section elements
   - Use theme-specific CSS for variations

6. **Deduplicate Classes**
   - Use `combineClasses()` to merge multiple sources
   - Avoid duplicate classes in output

7. **Document Extensions**
   - Document custom mappings and modifiers
   - Maintain naming consistency

## Extending the System

### Adding Custom Mappings

```typescript
const customConfig: StyleMappingConfig = {
  customMappings: {
    customProperty: (value: any) => {
      // Return array of class names based on value
      return [`custom-${value}`];
    }
  }
};

const mapper = new StyleMapper('book', customConfig);
```

### Creating Custom Builder Methods

```typescript
class CustomClassBuilder extends ClassBuilder {
  customMethod(value: string): this {
    this.add(`custom-${value}`);
    return this;
  }
}
```

### Adding New Class Constants

```typescript
// Add to CssClassNames
export const CssClassNames = {
  // ... existing categories
  CUSTOM: {
    NEW_CLASS: 'new-class',
  },
};
```

## Migration Guide

### From Legacy `generateClassName`

```typescript
// Old (deprecated)
const className = generateClassName('paragraph', 'first');

// New
const builder = new ClassBuilder({ prefix: 'book' });
const classes = builder.modifier('paragraph', 'first').build();
```

## Performance Considerations

- **Reuse ClassBuilder instances** for similar class generation
- **Use `clone()`** instead of creating new instances for variations
- **Cache StyleMapper instances** for repeated conversions
- **Combine classes efficiently** to avoid redundant processing

## Troubleshooting

### Classes Not Applying

- Verify prefix matches between HTML and CSS
- Check CSS file is loaded
- Ensure CSS specificity is sufficient

### Duplicate Classes

- Use `combineClasses()` to deduplicate
- Check builder isn't being reused incorrectly

### Missing Theme Classes

- Verify theme is set in options or builder
- Check theme mapping in StyleMapper

## Contributing

When adding new features:

1. Update class constants in `CssClassNames`
2. Add builder methods if needed
3. Update `StyleMapper` for new mappings
4. Add utility functions for common use cases
5. Write tests for new functionality
6. Update documentation

## License

See project root LICENSE file.

## Support

For issues or questions:
- Check [CSS_CLASS_API.md](./CSS_CLASS_API.md) for detailed API docs
- Review [examples](./examples/cssClassSystemExample.ts)
- Run tests to verify functionality

# CSS Class System API Documentation

## Overview

The CSS class system provides a comprehensive, flexible way to apply consistent styling to book HTML elements. It supports both ebook and print CSS requirements with theme-specific variations and dynamic class generation.

## Architecture

The system consists of three main components:

1. **CssClassNames** - Static class name constants organized by category
2. **ClassBuilder** - Fluent API for dynamic class generation
3. **StyleMapper** - Converts style configurations to CSS classes

## Class Naming Convention

All classes follow a BEM-like naming pattern:

```
{prefix}-{category}-{name}--{modifier}
```

**Examples:**
- `book-element-paragraph`
- `book-element-paragraph--first`
- `book-typography-drop-cap`
- `book-theme-serif`
- `book-print-page-break-before`

**Default prefix:** `book` (configurable via options)

## CssClassNames Constants

### Layout Classes

```typescript
CssClassNames.LAYOUT = {
  CONTAINER: 'container',
  WRAPPER: 'wrapper',
  CONTENT: 'content',
  INNER: 'inner',
}
```

**Usage:** Structure and container elements

### Section Classes

```typescript
CssClassNames.SECTION = {
  FRONT_MATTER: 'front-matter',
  BODY: 'body',
  BACK_MATTER: 'back-matter',
  CHAPTER: 'chapter',
  TOC: 'toc',
  TITLE_PAGE: 'title-page',
}
```

**Usage:** Major structural sections of the book

### Element Classes

```typescript
CssClassNames.ELEMENT = {
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  TITLE: 'title',
  SUBTITLE: 'subtitle',
  DEDICATION: 'dedication',
  EPIGRAPH: 'epigraph',
  QUOTE: 'quote',
  LIST: 'list',
  LIST_ITEM: 'list-item',
  IMAGE: 'image',
  FIGURE: 'figure',
  CAPTION: 'caption',
  SEPARATOR: 'separator',
  ORNAMENTAL_BREAK: 'ornamental-break',
}
```

**Usage:** Content elements and text blocks

### Typography Classes

```typescript
CssClassNames.TYPOGRAPHY = {
  DROP_CAP: 'drop-cap',
  FIRST_PARAGRAPH: 'first-paragraph',
  SMALL_CAPS: 'small-caps',
  EMPHASIS: 'emphasis',
  STRONG: 'strong',
  ITALIC: 'italic',
  BOLD: 'bold',
  UNDERLINE: 'underline',
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  CAPITALIZE: 'capitalize',
}
```

**Usage:** Text formatting and styling

### State Classes

```typescript
CssClassNames.STATE = {
  FIRST: 'first',
  LAST: 'last',
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  VISIBLE: 'visible',
  HAS_DROP_CAP: 'has-drop-cap',
  HAS_IMAGE: 'has-image',
  NO_INDENT: 'no-indent',
}
```

**Usage:** Dynamic element states

### Theme Classes

```typescript
CssClassNames.THEME = {
  SERIF: 'serif',
  SANS_SERIF: 'sans-serif',
  SCRIPT: 'script',
  MODERN: 'modern',
  CLASSIC: 'classic',
  MINIMAL: 'minimal',
  ELEGANT: 'elegant',
}
```

**Usage:** Theme-specific styling variations

### Print Classes

```typescript
CssClassNames.PRINT = {
  PAGE: 'page',
  PAGE_BREAK_BEFORE: 'page-break-before',
  PAGE_BREAK_AFTER: 'page-break-after',
  PAGE_BREAK_AVOID: 'page-break-avoid',
  NO_BREAK: 'no-break',
  RUNNING_HEADER: 'running-header',
  RUNNING_FOOTER: 'running-footer',
  PAGE_NUMBER: 'page-number',
}
```

**Usage:** Print-specific styling (page breaks, headers, footers)

## ClassBuilder API

The `ClassBuilder` class provides a fluent API for building CSS class arrays dynamically.

### Constructor

```typescript
const builder = new ClassBuilder({
  prefix: 'book',           // Class prefix (default: 'book')
  theme: ThemeType.SERIF,   // Theme type
  mediaType: PrintMediaType.PRINT,  // Media type
  includeState: true,       // Include state classes
  modifiers: ['custom']     // Custom modifiers
});
```

### Methods

#### `add(className: string, category?: CssClassCategory): this`

Add a base class name with optional category.

```typescript
builder.add('paragraph', CssClassCategory.ELEMENT);
// Generates: book-element-paragraph
```

#### `modifier(base: string, modifier: string): this`

Add a class with a modifier.

```typescript
builder.modifier('paragraph', 'first');
// Generates: book-paragraph--first
```

#### `theme(themeType?: ThemeType): this`

Add theme-specific class.

```typescript
builder.theme(ThemeType.SERIF);
// Generates: book-theme-serif
```

#### `state(stateName: string): this`

Add state class (if `includeState` is true).

```typescript
builder.state('first');
// Generates: book-state-first
```

#### `print(className: string): this`

Add print-specific class.

```typescript
builder.print('page-break-before');
// Generates: book-print-page-break-before
```

#### `element(elementType: ElementType): this`

Add element type class.

```typescript
builder.element('dedication');
// Generates: book-element-dedication
```

#### `section(sectionType: SectionType): this`

Add section type class.

```typescript
builder.section('front-matter');
// Generates: book-section-front-matter
```

#### `typography(typographyClass: string): this`

Add typography class.

```typescript
builder.typography('drop-cap');
// Generates: book-typography-drop-cap
```

#### `align(alignment: 'left' | 'center' | 'right' | 'justify'): this`

Add alignment class.

```typescript
builder.align('center');
// Generates: book-align-center
```

#### `spacing(spacing: 'tight' | 'normal' | 'loose' | 'compact'): this`

Add spacing class.

```typescript
builder.spacing('loose');
// Generates: book-spacing-loose
```

#### `when(condition: boolean, className: string, category?: CssClassCategory): this`

Conditionally add a class.

```typescript
builder.when(isFirstParagraph, 'first-paragraph', CssClassCategory.TYPOGRAPHY);
```

#### `raw(className: string): this`

Add a raw class name without prefixing.

```typescript
builder.raw('custom-class');
// Generates: custom-class
```

#### `build(): string[]`

Build and return array of class names.

```typescript
const classes = builder.build();
// Returns: ['book-paragraph', 'book-paragraph--first', ...]
```

#### `buildString(): string`

Build and return space-separated class string.

```typescript
const classString = builder.buildString();
// Returns: 'book-paragraph book-paragraph--first ...'
```

#### `reset(): this`

Reset the builder (clears all classes).

#### `clone(): ClassBuilder`

Clone the builder with current classes.

### Example Usage

```typescript
// Create a builder for a first paragraph with drop cap
const builder = new ClassBuilder({
  prefix: 'book',
  theme: ThemeType.SERIF
});

builder
  .add('paragraph', CssClassCategory.ELEMENT)
  .state('first')
  .typography('drop-cap')
  .state('has-drop-cap')
  .theme()
  .print('page-break-avoid');

const classes = builder.build();
// Result: [
//   'book-element-paragraph',
//   'book-state-first',
//   'book-typography-drop-cap',
//   'book-state-has-drop-cap',
//   'book-theme-serif',
//   'book-print-page-break-avoid'
// ]
```

## StyleMapper API

The `StyleMapper` class converts `BookStyle` and `Style` objects into CSS classes.

### Constructor

```typescript
const mapper = new StyleMapper('book', {
  fontFamilyMap: new Map([['serif', 'font-serif']]),
  textAlignMap: new Map([['center', 'align-center']]),
  fontWeightMap: new Map([['bold', 'weight-bold']]),
  spacingMap: new Map([['tight', 'spacing-tight']]),
  customMappings: {
    customProp: (value) => ['custom-class']
  }
});
```

### Methods

#### `mapBookStyle(bookStyle: BookStyle): string[]`

Map a `BookStyle` object to CSS classes.

```typescript
const classes = mapper.mapBookStyle(bookStyle);
// Returns: ['book-theme-serif', 'book-align-justify', 'book-typography-drop-cap', ...]
```

#### `mapStyle(style: Style): string[]`

Map a `Style` object to CSS classes.

```typescript
const classes = mapper.mapStyle(style);
// Returns: ['font-serif', 'weight-bold', 'book-align-center', ...]
```

#### `mapHeadingLevel(level: number, style?: Style): string[]`

Generate classes for heading level.

```typescript
const classes = mapper.mapHeadingLevel(1);
// Returns: ['book-element-heading', 'book-heading--h1', ...]
```

#### `mapParagraph(isFirst: boolean, hasDropCap: boolean, style?: Style): string[]`

Generate classes for paragraph.

```typescript
const classes = mapper.mapParagraph(true, true);
// Returns: [
//   'book-element-paragraph',
//   'book-state-first',
//   'book-typography-first-paragraph',
//   'book-state-has-drop-cap',
//   ...
// ]
```

#### `mapElementType(elementType: ElementType, matterType: MatterType): string[]`

Generate classes for element type.

```typescript
const classes = mapper.mapElementType('dedication', 'front');
// Returns: ['book-element-dedication', 'book-element--front']
```

## Utility Functions

### `generateSectionClasses(sectionType, context): string[]`

Generate classes for section based on context.

```typescript
const classes = generateSectionClasses('body-chapter', context);
```

### `generateParagraphClasses(context, style?): string[]`

Generate classes for paragraph element.

```typescript
const classes = generateParagraphClasses(context, style);
```

### `generateHeadingClasses(level, context, style?): string[]`

Generate classes for heading element.

```typescript
const classes = generateHeadingClasses(1, context);
```

### `generateElementClasses(element, context): string[]`

Generate classes for element based on type and matter.

```typescript
const classes = generateElementClasses(element, context);
```

### `generatePrintClasses(options, prefix?): string[]`

Generate print-specific classes.

```typescript
const classes = generatePrintClasses({
  pageBreakBefore: true,
  avoidBreak: true
});
```

### `combineClasses(...classArrays): string[]`

Combine multiple class arrays into deduplicated array.

```typescript
const combined = combineClasses(classes1, classes2, classes3);
```

### `classesToAttribute(classes): string`

Convert class array to HTML class attribute string.

```typescript
const attr = classesToAttribute(classes);
// Returns: ' class="book-paragraph book-state-first"'
```

## Ebook vs Print CSS Support

The class system supports both ebook and print requirements:

### Print-Specific Classes

Use print classes for page breaks, headers, and print layout:

```typescript
builder
  .print('page-break-before')  // Force page break before element
  .print('page-break-after')   // Force page break after element
  .print('page-break-avoid')   // Avoid page break within element
  .print('running-header');    // Running header element
```

### Media Type Targeting

Specify media type for appropriate class generation:

```typescript
const builder = new ClassBuilder({
  mediaType: PrintMediaType.PRINT  // or EBOOK, SCREEN
});
```

### CSS Media Query Integration

Classes are designed to work with CSS media queries:

```css
/* Ebook styles */
.book-element-paragraph {
  margin-bottom: 1em;
}

/* Print styles */
@media print {
  .book-print-page-break-before {
    page-break-before: always;
  }

  .book-print-page-break-avoid {
    page-break-inside: avoid;
  }
}
```

## Theme System

### Available Themes

- `ThemeType.SERIF` - Traditional serif fonts
- `ThemeType.SANS_SERIF` - Modern sans-serif fonts
- `ThemeType.SCRIPT` - Decorative script fonts
- `ThemeType.MODERN` - Contemporary styling
- `ThemeType.CLASSIC` - Classic book styling
- `ThemeType.MINIMAL` - Minimalist approach
- `ThemeType.ELEGANT` - Elegant, refined styling

### Theme Application

```typescript
// Apply theme to builder
builder.theme(ThemeType.ELEGANT);

// Or set in constructor
const builder = new ClassBuilder({
  theme: ThemeType.ELEGANT
});
```

### Theme-Specific CSS

```css
.book-theme-serif .book-element-heading {
  font-family: "Garamond", serif;
}

.book-theme-sans-serif .book-element-heading {
  font-family: "Helvetica Neue", sans-serif;
}
```

## Best Practices

1. **Use ClassBuilder for Dynamic Classes**
   - Always use `ClassBuilder` for programmatic class generation
   - Chain methods for readable, fluent code

2. **Leverage StyleMapper for Style Objects**
   - Let `StyleMapper` handle conversion from style configs
   - Extend mappings for custom properties

3. **Keep Classes Semantic**
   - Use descriptive class names that reflect purpose
   - Follow BEM-like naming for consistency

4. **Separate Print and Screen Concerns**
   - Use print-specific classes for page breaks
   - Use media type targeting for different outputs

5. **Theme Consistently**
   - Apply theme at the root level
   - Use theme-specific classes for variations

6. **Combine Classes Efficiently**
   - Use `combineClasses()` to merge multiple sources
   - Avoid duplicate classes with deduplication

7. **Document Custom Extensions**
   - Document custom mappings and modifiers
   - Maintain consistent naming patterns

## Examples

### Example 1: Chapter Opening

```typescript
const builder = new ClassBuilder({
  prefix: 'book',
  theme: ThemeType.ELEGANT
});

// Chapter section
const chapterClasses = builder
  .section('body-chapter')
  .state('first')
  .theme()
  .print('page-break-before')
  .build();

// Chapter title
const titleClasses = new ClassBuilder({ prefix: 'book' })
  .add('heading', CssClassCategory.ELEMENT)
  .modifier('heading', 'h1')
  .print('page-break-avoid')
  .build();

// First paragraph with drop cap
const paragraphClasses = new ClassBuilder({ prefix: 'book' })
  .add('paragraph', CssClassCategory.ELEMENT)
  .state('first')
  .state('has-drop-cap')
  .typography('drop-cap')
  .state('no-indent')
  .build();
```

### Example 2: Using StyleMapper

```typescript
const mapper = new StyleMapper('book');

// Map book style
const bookClasses = mapper.mapBookStyle(bookStyle);

// Map heading with custom style
const headingClasses = mapper.mapHeadingLevel(1, {
  fontWeight: 'bold',
  textAlign: 'center',
  textTransform: 'uppercase'
});

// Map paragraph
const paragraphClasses = mapper.mapParagraph(
  true,  // isFirst
  true,  // hasDropCap
  customStyle
);
```

### Example 3: Complete Element Styling

```typescript
function styleElement(element: Element, context: HtmlGenerationContext) {
  // Generate element type classes
  const elementClasses = generateElementClasses(element, context);

  // Generate style-based classes
  const mapper = new StyleMapper(context.options.classPrefix);
  const styleClasses = element.style
    ? mapper.mapStyle(element.style)
    : [];

  // Generate print classes
  const printClasses = generatePrintClasses({
    pageBreakBefore: element.type === 'title-page',
    avoidBreak: true
  });

  // Combine all classes
  const allClasses = combineClasses(
    elementClasses,
    styleClasses,
    printClasses
  );

  // Convert to HTML attribute
  const classAttr = classesToAttribute(allClasses);

  return `<div${classAttr}>...</div>`;
}
```

## CSS Integration

### Sample CSS Structure

```css
/* Base element styles */
.book-element-paragraph {
  margin-bottom: 1em;
  text-indent: 1.5em;
}

.book-element-heading {
  font-weight: bold;
  margin-top: 2em;
  margin-bottom: 1em;
}

/* State variations */
.book-state-first.book-element-paragraph {
  text-indent: 0;
}

.book-state-has-drop-cap::first-letter {
  float: left;
  font-size: 3em;
  line-height: 0.9;
  margin-right: 0.1em;
}

/* Theme variations */
.book-theme-serif {
  font-family: "Garamond", "Georgia", serif;
}

.book-theme-sans-serif {
  font-family: "Helvetica Neue", "Arial", sans-serif;
}

/* Print-specific styles */
@media print {
  .book-print-page-break-before {
    page-break-before: always;
  }

  .book-print-page-break-avoid {
    page-break-inside: avoid;
  }

  .book-print-running-header {
    position: running(header);
  }
}

/* Typography modifiers */
.book-typography-drop-cap::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.85;
  margin: 0.05em 0.1em 0 0;
}

.book-typography-small-caps {
  font-variant: small-caps;
}
```

## Migration Guide

If migrating from the legacy `generateClassName` function:

```typescript
// Old way (deprecated)
const className = generateClassName('paragraph', 'first');

// New way
const builder = new ClassBuilder({ prefix: 'book' });
const classes = builder.modifier('paragraph', 'first').build();
```

## Performance Considerations

1. **Reuse ClassBuilder instances** when generating similar classes
2. **Use `clone()`** instead of creating new instances for variations
3. **Cache StyleMapper instances** for repeated conversions
4. **Combine classes efficiently** to avoid redundant processing

## Extensibility

### Adding Custom Mappings

```typescript
const customConfig: StyleMappingConfig = {
  customMappings: {
    letterSpacing: (value: string | number) => {
      if (value === 'wide') return ['letter-spacing-wide'];
      if (value === 'tight') return ['letter-spacing-tight'];
      return [];
    }
  }
};

const mapper = new StyleMapper('book', customConfig);
```

### Creating Custom Builder Methods

```typescript
class CustomClassBuilder extends ClassBuilder {
  customFeature(value: string): this {
    this.add(`custom-${value}`);
    return this;
  }
}
```

## Troubleshooting

### Classes Not Applying

- Verify prefix matches between HTML and CSS
- Check that CSS file is loaded
- Ensure specificity is sufficient

### Duplicate Classes

- Use `combineClasses()` to deduplicate
- Check that builder isn't being reused incorrectly

### Missing Theme Classes

- Verify theme is set in options or builder
- Check theme mapping in StyleMapper

### Print Styles Not Working

- Verify `@media print` CSS is included
- Check print class prefix matches
- Ensure print classes are generated with `print()` method

# ProseMirror Node Specifications

This directory contains custom node specifications for the ProseMirror editor schema.

## Image Node

The image node supports both inline and block images with flexible alignment options.

### Attributes

- **src** (required, string): Image source URL or base64 data URI
- **alt** (optional, string): Alternative text for accessibility
- **title** (optional, string): Image title (tooltip)
- **width** (optional, number): Image width in pixels
- **height** (optional, number): Image height in pixels
- **alignment** (optional, 'inline' | 'block' | 'left' | 'right'): Image alignment

### Alignment Behavior

- **inline** (default): Image appears inline with text, using a simple `<img>` tag
- **block**: Image appears as a block element, centered, wrapped in `<div class="image-wrapper image-block">`
- **left**: Image floats to the left, wrapped in `<div class="image-wrapper image-left">`
- **right**: Image floats to the right, wrapped in `<div class="image-wrapper image-right">`

### Supported Image Sources

1. **External URLs**: `https://example.com/image.jpg`
2. **Relative paths**: `./images/photo.png`
3. **Data URIs**: `data:image/png;base64,iVBORw0KGgo...`

### DOM Parsing

The image node can parse:
- Standard `<img>` tags with `data-alignment` attribute
- Images wrapped in `<div class="image-wrapper">` containers
- Images with inline styles (float, display, text-align) for alignment detection

### Example Usage

```typescript
import { editorSchema } from '../schema';

// Create an inline image
const inlineImage = editorSchema.nodes.image.create({
  src: 'https://example.com/image.jpg',
  alt: 'Example image',
  alignment: 'inline',
});

// Create a block image with dimensions
const blockImage = editorSchema.nodes.image.create({
  src: 'data:image/png;base64,...',
  alt: 'Chart',
  width: 800,
  height: 600,
  alignment: 'block',
  title: 'Sales Chart 2024',
});

// Create a floating image
const floatImage = editorSchema.nodes.image.create({
  src: './assets/portrait.jpg',
  alt: 'Portrait',
  width: 300,
  alignment: 'right',
});
```

### Properties

- **atom**: true (treated as a single unit)
- **draggable**: true (can be dragged and dropped)
- **inline**: true (default inline behavior)
- **group**: 'inline' (part of inline content)

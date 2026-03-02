# Mock Preview Renderer

A comprehensive mock implementation of the preview rendering engine for testing purposes.

## Overview

The mock preview renderer simulates book content rendering for different device types, returning predictable HTML/DOM structures that are ideal for testing. It provides all the functionality of the real preview renderer with deterministic outputs suitable for snapshot testing and assertions.

## Features

- **Device-specific rendering**: Supports desktop, tablet, mobile, and print devices
- **Predictable output**: Returns consistent, testable HTML and CSS
- **Isolated test instances**: Create independent renderer instances with `createMockRenderer()`
- **Call tracking**: Monitor render calls for test assertions
- **Flexible options**: Supports page breaks, inline styles, and custom prefixes
- **Helper methods**: Includes utilities for rendering pages, applying styles, and more

## Basic Usage

### Simple Rendering

```typescript
import { renderPreview } from '../__mocks__/previewRenderer';
import { Element } from '../types/element';
import { BookStyle } from '../types/style';

// Create test data
const element: Element = {
  id: 'chapter-1',
  type: 'prologue',
  matter: 'front',
  title: 'Chapter One',
  content: [/* ... */],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const style: BookStyle = {
  /* ... style configuration ... */
};

// Render preview
const result = renderPreview(element, style, 'desktop');

console.log(result.html);      // Generated HTML
console.log(result.css);       // Generated CSS
console.log(result.pageCount); // Estimated page count
```

### Using the Factory Function

For better test isolation, use the `createMockRenderer()` factory:

```typescript
import { createMockRenderer } from '../__mocks__/previewRenderer';

describe('My Component Tests', () => {
  let renderer;

  beforeEach(() => {
    renderer = createMockRenderer();
  });

  it('should render preview', () => {
    const result = renderer.render(element, style, 'tablet');

    expect(result.html).toContain('Chapter One');
    expect(renderer.getRenderCount()).toBe(1);
  });

  afterEach(() => {
    renderer.reset();
  });
});
```

## API Reference

### Core Functions

#### `renderPreview(elementData, styleConfig, deviceType, options?)`

Renders a preview with the specified configuration.

**Parameters:**
- `elementData: Element` - The book element to render
- `styleConfig: BookStyle` - Style configuration
- `deviceType: DeviceType` - Target device ('desktop' | 'tablet' | 'mobile' | 'print')
- `options?: RenderOptions` - Optional rendering customization

**Returns:** `PreviewResult` with `html`, `css`, and `pageCount`

**Example:**
```typescript
const result = renderPreview(element, style, 'mobile', {
  includePageBreaks: true,
  classPrefix: 'custom',
  useInlineStyles: false,
});
```

#### `getDeviceConfig(deviceType)`

Gets the configuration for a specific device type.

**Returns:** `DeviceConfig` with width, height, pixelRatio, etc.

```typescript
const config = getDeviceConfig('desktop');
console.log(config.width);  // 1920
console.log(config.height); // 1080
```

#### `isValidDeviceType(deviceType)`

Validates whether a device type is supported.

```typescript
if (isValidDeviceType('desktop')) {
  // Valid device type
}
```

### Factory Function

#### `createMockRenderer()`

Creates an isolated mock renderer instance with its own state.

**Returns:** Object with the following methods:

##### `render(elementData, styleConfig, deviceType, options?)`

Same as `renderPreview()` but tracks calls in instance state.

##### `renderPage(elementData, styleConfig, deviceType, pageNumber, options?)`

Renders a specific page number (useful for paginated content testing).

```typescript
const renderer = createMockRenderer();
const result = renderer.renderPage(element, style, 'print', 5);
// Result will have data-page-number="5" in HTML
```

##### `applyCustomStyles(result, customCSS)`

Adds custom CSS to a render result.

```typescript
const result = renderer.render(element, style, 'desktop');
const styled = renderer.applyCustomStyles(result, '.custom { color: red; }');
```

##### `getCalls()`

Returns array of all render calls made to this instance.

```typescript
renderer.render(element, style, 'desktop');
renderer.render(element, style, 'mobile');

const calls = renderer.getCalls();
console.log(calls.length); // 2
console.log(calls[0].deviceType); // 'desktop'
```

##### `getRenderCount()`

Returns the number of render calls.

##### `getLastRenderTime()`

Returns timestamp of the last render call.

##### `wasDeviceTypeUsed(deviceType)`

Checks if a specific device type was used in any render call.

```typescript
renderer.render(element, style, 'tablet');
console.log(renderer.wasDeviceTypeUsed('tablet'));  // true
console.log(renderer.wasDeviceTypeUsed('desktop')); // false
```

##### `getUsedDeviceTypes()`

Returns array of all unique device types used.

##### `reset()`

Resets the instance state (useful in test cleanup).

```typescript
afterEach(() => {
  renderer.reset();
});
```

### Global State Utilities

#### `__getMockState()`

Gets the global mock state (useful for debugging).

#### `__resetMockState()`

Resets global mock state (use in test cleanup).

```typescript
afterEach(() => {
  __resetMockState();
});
```

## Device Types and Configurations

The mock supports four device types with the following configurations:

### Desktop
- Width: 1920px
- Height: 1080px
- Pixel Ratio: 1
- Page Width: 816px
- Page Height: 1056px

### Tablet
- Width: 1024px
- Height: 768px
- Pixel Ratio: 2
- Page Width: 768px
- Page Height: 1024px

### Mobile
- Width: 375px
- Height: 667px
- Pixel Ratio: 3
- Page Width: 375px
- Page Height: 667px

### Print
- Width: 816px
- Height: 1056px
- Pixel Ratio: 1
- Page Width: 816px
- Page Height: 1056px

## Render Options

```typescript
interface RenderOptions {
  includePageBreaks?: boolean;    // Default: true
  printOptimized?: boolean;       // Default: true for 'print' device
  classPrefix?: string;           // Default: 'preview'
  useInlineStyles?: boolean;      // Default: false
}
```

## Testing Patterns

### Snapshot Testing

```typescript
it('should render consistent output', () => {
  const result = renderPreview(element, style, 'desktop');
  expect(result).toMatchSnapshot();
});
```

### Asserting HTML Structure

```typescript
it('should include element metadata', () => {
  const result = renderPreview(element, style, 'tablet');

  expect(result.html).toContain(`data-element-id="${element.id}"`);
  expect(result.html).toContain(`data-type="${element.type}"`);
  expect(result.html).toContain(`data-device="tablet"`);
});
```

### Testing Different Devices

```typescript
it('should render for all device types', () => {
  const devices: DeviceType[] = ['desktop', 'tablet', 'mobile', 'print'];

  devices.forEach(device => {
    const result = renderPreview(element, style, device);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });
});
```

### Call Tracking

```typescript
it('should track render calls', () => {
  const renderer = createMockRenderer();

  renderer.render(element, style, 'desktop');
  renderer.render(element, style, 'mobile');

  expect(renderer.getRenderCount()).toBe(2);
  expect(renderer.wasDeviceTypeUsed('desktop')).toBe(true);

  const usedTypes = renderer.getUsedDeviceTypes();
  expect(usedTypes).toEqual(['desktop', 'mobile']);
});
```

### Isolated Test Instances

```typescript
describe('Component A tests', () => {
  const rendererA = createMockRenderer();

  it('test 1', () => {
    rendererA.render(element, style, 'desktop');
    expect(rendererA.getRenderCount()).toBe(1);
  });
});

describe('Component B tests', () => {
  const rendererB = createMockRenderer();

  it('test 2', () => {
    // rendererB has independent state
    expect(rendererB.getRenderCount()).toBe(0);
  });
});
```

## Security Features

The mock includes HTML escaping to prevent XSS vulnerabilities:

```typescript
const dangerousElement = {
  ...element,
  title: '<script>alert("xss")</script>',
};

const result = renderPreview(dangerousElement, style, 'desktop');
// HTML will contain: &lt;script&gt;alert("xss")&lt;/script&gt;
```

## Best Practices

1. **Use `createMockRenderer()` for test isolation** - Prevents test interference
2. **Reset state in cleanup** - Use `renderer.reset()` or `__resetMockState()`
3. **Prefer instance methods over global functions** - Better test organization
4. **Use snapshot testing** - Mock output is deterministic
5. **Test all device types** - Ensure device-specific logic works correctly
6. **Validate error cases** - Mock throws appropriate errors for invalid inputs

## Example Test Suite

```typescript
import { createMockRenderer } from '../__mocks__/previewRenderer';

describe('Preview Rendering', () => {
  let renderer;

  beforeEach(() => {
    renderer = createMockRenderer();
  });

  afterEach(() => {
    renderer.reset();
  });

  describe('Basic rendering', () => {
    it('should render desktop view', () => {
      const result = renderer.render(element, style, 'desktop');
      expect(result.html).toContain('preview-container');
      expect(result.pageCount).toBeGreaterThan(0);
    });

    it('should apply custom class prefix', () => {
      const result = renderer.render(element, style, 'mobile', {
        classPrefix: 'book',
      });
      expect(result.html).toContain('book-container');
    });
  });

  describe('Device-specific rendering', () => {
    it('should handle mobile layout', () => {
      const result = renderer.render(element, style, 'mobile');
      expect(result.html).toContain('data-device="mobile"');
    });
  });

  describe('Call tracking', () => {
    it('should track multiple renders', () => {
      renderer.render(element, style, 'desktop');
      renderer.render(element, style, 'tablet');

      expect(renderer.getRenderCount()).toBe(2);
      expect(renderer.getUsedDeviceTypes()).toHaveLength(2);
    });
  });
});
```

## Related Files

- Real implementation: `src/utils/previewRenderer.ts`
- Type definitions: `src/types/element.ts`, `src/types/style.ts`
- Preview component: `src/components/Preview/PreviewPanel.tsx`

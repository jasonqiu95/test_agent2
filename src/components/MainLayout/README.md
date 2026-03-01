# MainLayout Component

A 3-panel main application layout component with Vellum's signature design.

## Features

- **3-Panel Design**: Left Navigator, Center Editor, Right Preview
- **Resizable Panels**: Drag handles for dynamic panel resizing
  - Navigator: 250-500px (default: 300px)
  - Preview: 400-800px (default: 500px)
  - Editor: Flexible, takes remaining space
- **Panel Visibility Toggles**: Show/hide panels with toolbar buttons
- **Dark Theme Support**: Uses CSS variables for easy theming
- **Responsive Design**: Automatically adapts to smaller screens
- **Keyboard Shortcuts Ready**: Built-in support for keyboard shortcuts (Cmd+B for Navigator, Cmd+Shift+P for Preview)

## Usage

### Basic Usage

```tsx
import { MainLayout } from './components/MainLayout';

function App() {
  return (
    <MainLayout
      navigator={<NavigatorPanel />}
      editor={<EditorPanel />}
      preview={<PreviewPanel />}
    />
  );
}
```

### Controlled Visibility

```tsx
import { MainLayout } from './components/MainLayout';
import { useState } from 'react';

function App() {
  const [showNavigator, setShowNavigator] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

  return (
    <MainLayout
      navigator={<NavigatorPanel />}
      editor={<EditorPanel />}
      preview={<PreviewPanel />}
      showNavigator={showNavigator}
      showPreview={showPreview}
      onToggleNavigator={() => setShowNavigator(!showNavigator)}
      onTogglePreview={() => setShowPreview(!showPreview)}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `navigator` | `React.ReactNode` | - | Content for the left navigator panel |
| `editor` | `React.ReactNode` | **required** | Content for the center editor panel |
| `preview` | `React.ReactNode` | - | Content for the right preview panel |
| `showNavigator` | `boolean` | `true` | Control navigator visibility (controlled mode) |
| `showPreview` | `boolean` | `true` | Control preview visibility (controlled mode) |
| `onToggleNavigator` | `() => void` | - | Callback when navigator toggle is clicked |
| `onTogglePreview` | `() => void` | - | Callback when preview toggle is clicked |

## Dark Theme

To enable dark theme, add the `data-theme="dark"` attribute to the document root:

```typescript
document.documentElement.setAttribute('data-theme', 'dark');
```

To switch back to light theme:

```typescript
document.documentElement.setAttribute('data-theme', 'light');
```

## CSS Variables

You can customize the appearance by overriding these CSS variables:

### Light Theme
```css
:root {
  --layout-bg-color: #f5f5f5;
  --layout-toolbar-bg: #ffffff;
  --layout-toolbar-border: #e0e0e0;
  --layout-text-primary: #333333;
  --layout-text-secondary: #666666;
  --layout-button-hover: #f0f0f0;
  --layout-button-active: #e0e0e0;
  --layout-editor-bg: #ffffff;
  --layout-shadow: rgba(0, 0, 0, 0.1);
}
```

### Dark Theme
```css
[data-theme='dark'] {
  --layout-bg-color: #121212;
  --layout-toolbar-bg: #1e1e1e;
  --layout-toolbar-border: #3a3a3a;
  --layout-text-primary: #e0e0e0;
  --layout-text-secondary: #b0b0b0;
  --layout-button-hover: #2a2a2a;
  --layout-button-active: #333333;
  --layout-editor-bg: #1e1e1e;
  --layout-shadow: rgba(0, 0, 0, 0.3);
}
```

## Responsive Breakpoints

- **Desktop** (>1024px): Full 3-panel layout with resizable panels
- **Tablet** (768px-1024px): Vertical stacking, panels at 40% viewport height
- **Mobile** (<768px): Vertical stacking, panels at 50% viewport height, hidden labels

## Example

See `src/examples/MainLayoutDemo.tsx` for a complete working example with demo content and theme switching.

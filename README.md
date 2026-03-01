# Keyboard Shortcuts System

A comprehensive keyboard shortcuts system for React applications with cross-platform support (Windows/Mac).

## Features

- ⌨️ Global keyboard shortcuts with customizable actions
- 🖥️ Cross-platform support (Cmd on Mac, Ctrl on Windows)
- 📋 Built-in shortcuts cheat sheet dialog
- ♿ Accessible and keyboard-friendly
- 🎨 Dark mode support
- 🔧 Fully customizable and extensible

## Implemented Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + S` | Save | Save current work |
| `Cmd/Ctrl + E` | Export | Export content |
| `Cmd/Ctrl + N` | New Chapter | Create new chapter |
| `Cmd/Ctrl + T` | Toggle Style Browser | Show/hide style browser |
| `Cmd/Ctrl + P` | Toggle Preview | Show/hide preview |
| `Cmd/Ctrl + F` | Find | Open find dialog |
| `Cmd/Ctrl + /` | Shortcuts Cheat Sheet | Show keyboard shortcuts dialog |

## Installation

This is a standalone implementation. Copy the following files to your project:

```
src/
├── hooks/
│   └── useKeyboardShortcuts.ts
├── components/
│   └── ShortcutsDialog/
│       ├── ShortcutsDialog.tsx
│       ├── ShortcutsDialog.css
│       └── index.ts
├── types/
│   └── shortcuts.ts
└── examples/
    └── AppWithShortcuts.tsx
```

## Usage

### Basic Usage

```tsx
import { useKeyboardShortcuts, KeyboardShortcut } from './hooks/useKeyboardShortcuts';
import { ShortcutsDialog } from './components/ShortcutsDialog';

function App() {
  const [showDialog, setShowDialog] = useState(false);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrl: true,
      description: 'Save',
      action: () => {
        console.log('Saving...');
        // Your save logic
      },
    },
    {
      key: '/',
      ctrl: true,
      description: 'Show Shortcuts',
      action: () => setShowDialog(true),
    },
  ];

  useKeyboardShortcuts({ shortcuts });

  return (
    <div>
      <h1>My App</h1>
      <ShortcutsDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}
```

### Advanced Usage with State Management

```tsx
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useCallback, useState } from 'react';

function Editor() {
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const shortcuts = [
    {
      key: 's',
      ctrl: true,
      description: 'Save',
      action: useCallback(() => {
        // Save content
        localStorage.setItem('content', content);
      }, [content]),
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Toggle Preview',
      action: useCallback(() => {
        setShowPreview(prev => !prev);
      }, []),
    },
  ];

  useKeyboardShortcuts({ shortcuts });

  return (
    <div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      {showPreview && <div>{content}</div>}
    </div>
  );
}
```

### Conditional Shortcuts

```tsx
const shortcuts = [
  {
    key: 's',
    ctrl: true,
    description: 'Save',
    action: () => save(),
  },
];

// Enable/disable shortcuts based on conditions
useKeyboardShortcuts({
  shortcuts,
  enabled: !isLoading && isAuthenticated,
});
```

## API Reference

### `useKeyboardShortcuts`

Custom hook for managing keyboard shortcuts.

**Parameters:**
- `shortcuts`: Array of `KeyboardShortcut` objects
- `enabled`: Boolean to enable/disable shortcuts (default: `true`)

**Returns:**
- `shortcuts`: Current shortcuts array

### `KeyboardShortcut` Interface

```typescript
interface KeyboardShortcut {
  key: string;              // The key to press (e.g., 's', 'f', '/')
  ctrl?: boolean;           // Requires Ctrl (Windows) or Cmd (Mac)
  alt?: boolean;            // Requires Alt key
  shift?: boolean;          // Requires Shift key
  meta?: boolean;           // Requires Meta/Cmd key (Mac only)
  description: string;      // Human-readable description
  action: () => void;       // Function to execute
  preventDefault?: boolean; // Prevent default browser behavior (default: true)
}
```

### `ShortcutsDialog` Component

A modal dialog that displays all available keyboard shortcuts.

**Props:**
- `isOpen`: Boolean to show/hide the dialog
- `onClose`: Callback function when dialog is closed
- `shortcuts`: Array of shortcuts to display
- `title`: Dialog title (default: "Keyboard Shortcuts")

### Utility Functions

#### `getModifierKey()`

Returns the appropriate modifier key symbol for the current platform.

```typescript
const modKey = getModifierKey(); // Returns '⌘' on Mac, 'Ctrl' on Windows
```

#### `formatShortcut(shortcut: KeyboardShortcut)`

Formats a shortcut for display with appropriate platform symbols.

```typescript
const formatted = formatShortcut({
  key: 's',
  ctrl: true,
  description: 'Save',
  action: () => {},
});
// Returns: '⌘S' on Mac, 'Ctrl+S' on Windows
```

## Cross-Platform Support

The system automatically detects the platform and handles key modifiers accordingly:

- **Mac**: Uses `⌘` (Command/Meta key)
- **Windows/Linux**: Uses `Ctrl` key

When defining shortcuts with `ctrl: true`, the system accepts both `ctrlKey` and `metaKey`, making it work seamlessly across platforms.

## Accessibility

- Dialog is keyboard accessible (close with `Escape`)
- Proper ARIA labels and roles
- Focus management
- Semantic HTML structure

## Styling

The `ShortcutsDialog` component includes a CSS file with:
- Modern, clean design
- Smooth animations
- Dark mode support (via `prefers-color-scheme`)
- Responsive layout
- Customizable via CSS variables

To customize, modify the CSS classes in `ShortcutsDialog.css` or override them in your own stylesheet.

## Best Practices

1. **Use `useCallback`** for shortcut actions to prevent unnecessary re-renders
2. **Prevent conflicts** by avoiding shortcuts that conflict with browser defaults
3. **Document shortcuts** clearly in your UI
4. **Test cross-platform** on both Mac and Windows
5. **Make shortcuts discoverable** using the cheat sheet dialog (Cmd+/)

## Example Application

See `src/examples/AppWithShortcuts.tsx` for a complete working example that demonstrates all features.

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- React 16.8+ (for hooks)

## License

MIT

## Contributing

Contributions are welcome! Please ensure that:
- Code follows existing patterns
- Cross-platform compatibility is maintained
- Accessibility standards are met
- Documentation is updated

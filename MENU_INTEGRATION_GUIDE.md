# Quick Menu Integration Guide

## What Was Implemented

A complete native application menu bar system for Electron with:

### Menus Created
- **File Menu**: New, Open, Save, Save As, Export (PDF/DOCX/EPUB), Close
- **Edit Menu**: Undo, Redo, Cut, Copy, Paste, Select All, Find, Replace
- **View Menu**: Toggle Sidebar/Properties/Outline, Zoom In/Out/Reset, Theme Selection
- **Format Menu**: Bold, Italic, Underline, Strikethrough, Alignment, Text Styles, Clear Formatting
- **Help Menu**: Documentation, Keyboard Shortcuts, About

### Architecture
1. **Menu Definition** (`electron/menu.ts`) - Native Electron menu structure
2. **IPC Communication** (`electron/ipc/menuActions.ts`) - Main ↔ Renderer communication
3. **React Integration** (`src/hooks/useMenuActions.ts`) - Hook for easy integration
4. **Example Component** (`src/examples/AppWithMenu.tsx`) - Working example

## Quick Start

### Step 1: Use the Menu Hook in Your App

```tsx
// In your main App component
import { useMenuActions } from './hooks/useMenuActions';

function App() {
  useMenuActions({
    onNew: () => console.log('New file'),
    onSave: () => console.log('Save file'),
    onBold: () => console.log('Toggle bold'),
    // Add more handlers as needed
  });

  return <YourContent />;
}
```

### Step 2: With Redux (Optional)

```tsx
import { useMenuActions } from './hooks/useMenuActions';
import { useDispatch } from 'react-redux';

function App() {
  const dispatch = useDispatch();

  useMenuActions({
    onNew: () => dispatch({ type: 'FILE_NEW' }),
    onSave: () => dispatch({ type: 'FILE_SAVE' }),
    onBold: () => dispatch({ type: 'FORMAT_BOLD' }),
    // Map all menu actions to Redux actions
  });

  return <YourContent />;
}
```

### Step 3: Test the Menu

1. Run your app: `npm run dev`
2. Check the menu bar (top of screen on macOS, top of window on Windows/Linux)
3. Try keyboard shortcuts (Cmd/Ctrl+N, Cmd/Ctrl+S, etc.)
4. Open the Help menu and try "Keyboard Shortcuts" (Cmd/Ctrl+/)

## Files Created

```
electron/
├── menu.ts                          # ✨ Menu definition with all items
├── main.ts                          # ✏️ Updated to register menu
└── ipc/
    ├── menuActions.ts               # ✨ IPC handlers for menu actions
    └── index.ts                     # ✏️ Updated to export menu handlers

src/
├── hooks/
│   └── useMenuActions.ts            # ✨ React hook for menu integration
└── examples/
    └── AppWithMenu.tsx              # ✨ Example implementation

docs/
└── MENU_SYSTEM.md                   # ✨ Complete documentation
```

## Available Menu Actions

### Handler Interface

```typescript
interface MenuActionHandlers {
  // File
  onNew?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onExport?: (format: string) => void;
  onClose?: () => void;

  // Edit
  onUndo?: () => void;
  onRedo?: () => void;
  onFind?: () => void;
  onReplace?: () => void;

  // View
  onToggleSidebar?: () => void;
  onToggleProperties?: () => void;
  onToggleOutline?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;

  // Format
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onStrikethrough?: () => void;
  onAlign?: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onStyle?: (style: string) => void;
  onClearFormatting?: () => void;

  // Help
  onShowShortcuts?: () => void;
  onShowAbout?: () => void;
}
```

## Common Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| New | Cmd+N | Ctrl+N |
| Open | Cmd+O | Ctrl+O |
| Save | Cmd+S | Ctrl+S |
| Save As | Cmd+Shift+S | Ctrl+Shift+S |
| Undo | Cmd+Z | Ctrl+Z |
| Redo | Cmd+Shift+Z | Ctrl+Y |
| Bold | Cmd+B | Ctrl+B |
| Italic | Cmd+I | Ctrl+I |
| Find | Cmd+F | Ctrl+F |
| Zoom In | Cmd++ | Ctrl++ |
| Zoom Out | Cmd+- | Ctrl+- |
| Toggle Sidebar | Cmd+B | Ctrl+B |
| Help | Cmd+/ | Ctrl+/ |

## Next Steps

1. **Implement Handlers**: Add your app's logic to each menu action handler
2. **Connect State Management**: If using Redux, connect menu actions to Redux actions
3. **Add Dialogs**: Implement custom dialogs for Find, Replace, Shortcuts
4. **Customize Menu**: Add/remove menu items based on your app's needs
5. **Test Thoroughly**: Test all menu items and shortcuts on different platforms

## See Also

- Full documentation: `docs/MENU_SYSTEM.md`
- Example component: `src/examples/AppWithMenu.tsx`
- Menu definition: `electron/menu.ts`

## Support

The menu system is fully integrated and ready to use. All menu items send IPC messages to the renderer process, where you can handle them with the `useMenuActions` hook and connect them to your state management system (Redux, Context API, or plain React state).

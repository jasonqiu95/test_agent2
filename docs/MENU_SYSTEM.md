# Application Menu System

This document describes the native application menu bar implementation for the Electron book publishing app.

## Overview

The menu system provides a native menu bar with the following menus:
- **File**: New, Open, Save, Save As, Export, Close
- **Edit**: Undo, Redo, Cut, Copy, Paste, Select All, Find, Replace
- **View**: Toggle panels, Zoom, Theme switching
- **Format**: Bold, Italic, Alignment, Text styles
- **Help**: Documentation, Shortcuts, About

## Architecture

The menu system consists of three main components:

1. **Menu Definition** (`electron/menu.ts`): Defines the menu structure and items
2. **IPC Handlers** (`electron/ipc/menuActions.ts`): Handles communication between main and renderer processes
3. **React Hook** (`src/hooks/useMenuActions.ts`): Connects menu actions to your app's state management

## File Structure

```
electron/
├── menu.ts                    # Menu bar definition
├── main.ts                    # Main process setup
└── ipc/
    ├── menuActions.ts         # Menu IPC handlers
    └── index.ts               # IPC registry

src/
├── hooks/
│   └── useMenuActions.ts      # React hook for menu integration
└── examples/
    └── AppWithMenu.tsx        # Example implementation
```

## Usage

### Basic Integration

1. **Import the hook in your main app component:**

```tsx
import { useMenuActions } from './hooks/useMenuActions';

function App() {
  useMenuActions({
    onNew: () => {
      // Handle new file
    },
    onSave: () => {
      // Handle save
    },
    onBold: () => {
      // Toggle bold formatting
    },
    // ... other handlers
  });

  return <YourAppContent />;
}
```

### Integration with Redux

If you're using Redux, dispatch actions from the menu handlers:

```tsx
import { useMenuActions } from './hooks/useMenuActions';
import { useDispatch } from 'react-redux';
import * as actions from './store/actions';

function App() {
  const dispatch = useDispatch();

  useMenuActions({
    onNew: () => dispatch(actions.createNewFile()),
    onSave: () => dispatch(actions.saveFile()),
    onBold: () => dispatch(actions.toggleBold()),
    onThemeChange: (theme) => dispatch(actions.setTheme(theme)),
    // ... other handlers
  });

  return <YourAppContent />;
}
```

### Integration with React Context

For apps using Context API:

```tsx
import { useMenuActions } from './hooks/useMenuActions';
import { useAppContext } from './context/AppContext';

function App() {
  const { newFile, saveFile, toggleBold, setTheme } = useAppContext();

  useMenuActions({
    onNew: newFile,
    onSave: saveFile,
    onBold: toggleBold,
    onThemeChange: setTheme,
    // ... other handlers
  });

  return <YourAppContent />;
}
```

## Menu Actions Reference

### File Menu

| Action | Shortcut | Handler |
|--------|----------|---------|
| New | Cmd/Ctrl+N | `onNew()` |
| Open | Cmd/Ctrl+O | `onOpen()` |
| Save | Cmd/Ctrl+S | `onSave()` |
| Save As | Cmd/Ctrl+Shift+S | `onSaveAs()` |
| Export | - | `onExport(format)` |
| Close | Cmd/Ctrl+W | `onClose()` |

### Edit Menu

| Action | Shortcut | Handler |
|--------|----------|---------|
| Undo | Cmd/Ctrl+Z | `onUndo()` |
| Redo | Cmd+Shift+Z / Ctrl+Y | `onRedo()` |
| Cut | Cmd/Ctrl+X | Built-in |
| Copy | Cmd/Ctrl+C | Built-in |
| Paste | Cmd/Ctrl+V | Built-in |
| Select All | Cmd/Ctrl+A | Built-in |
| Find | Cmd/Ctrl+F | `onFind()` |
| Replace | Cmd/Ctrl+H | `onReplace()` |

### View Menu

| Action | Shortcut | Handler |
|--------|----------|---------|
| Toggle Sidebar | Cmd/Ctrl+B | `onToggleSidebar()` |
| Toggle Properties | Cmd/Ctrl+Shift+P | `onToggleProperties()` |
| Toggle Outline | Cmd/Ctrl+Shift+O | `onToggleOutline()` |
| Zoom In | Cmd/Ctrl++ | `onZoomIn()` |
| Zoom Out | Cmd/Ctrl+- | `onZoomOut()` |
| Reset Zoom | Cmd/Ctrl+0 | `onResetZoom()` |
| Theme | - | `onThemeChange(theme)` |

### Format Menu

| Action | Shortcut | Handler |
|--------|----------|---------|
| Bold | Cmd/Ctrl+B | `onBold()` |
| Italic | Cmd/Ctrl+I | `onItalic()` |
| Underline | Cmd/Ctrl+U | `onUnderline()` |
| Strikethrough | Cmd/Ctrl+Shift+X | `onStrikethrough()` |
| Align Left | Cmd/Ctrl+Shift+L | `onAlign('left')` |
| Align Center | Cmd/Ctrl+Shift+E | `onAlign('center')` |
| Align Right | Cmd/Ctrl+Shift+R | `onAlign('right')` |
| Justify | Cmd/Ctrl+Shift+J | `onAlign('justify')` |
| Heading 1 | Cmd/Ctrl+Alt+1 | `onStyle('heading1')` |
| Heading 2 | Cmd/Ctrl+Alt+2 | `onStyle('heading2')` |
| Heading 3 | Cmd/Ctrl+Alt+3 | `onStyle('heading3')` |
| Paragraph | Cmd/Ctrl+Alt+0 | `onStyle('paragraph')` |
| Clear Formatting | Cmd/Ctrl+\\ | `onClearFormatting()` |

### Help Menu

| Action | Shortcut | Handler |
|--------|----------|---------|
| Documentation | - | Opens external link |
| Keyboard Shortcuts | Cmd/Ctrl+/ | `onShowShortcuts()` |
| About | - | `onShowAbout()` |

## IPC API

The menu system also provides helper functions for programmatic access:

```tsx
import { menuAPI } from './hooks/useMenuActions';

// Show the About dialog
await menuAPI.showAbout();

// Show the Shortcuts dialog
await menuAPI.showShortcuts();

// Show export dialog
const result = await menuAPI.export('pdf');
if (!result.canceled) {
  console.log(`Exporting to ${result.filePath}`);
}

// Control zoom
await menuAPI.zoom('in');
await menuAPI.zoom('out');
await menuAPI.zoom('reset');

// Set theme
await menuAPI.setTheme('dark');
```

## Customization

### Adding New Menu Items

1. **Add menu item in `electron/menu.ts`:**

```typescript
{
  label: 'My Custom Action',
  accelerator: 'CmdOrCtrl+Shift+M',
  click: () => {
    mainWindow?.webContents.send('menu:custom:myAction');
  },
}
```

2. **Add IPC handler if needed in `electron/ipc/menuActions.ts`:**

```typescript
ipcMain.handle('menu:customAction', async (_event, options) => {
  // Handle the action in main process
  return { success: true };
});
```

3. **Add handler in `useMenuActions.ts`:**

```typescript
export interface MenuActionHandlers {
  // ... existing handlers
  onMyCustomAction?: () => void;
}

// In the hook:
const handleCustomAction = useCallback(() => {
  handlers.onMyCustomAction?.();
}, [handlers]);

// In useEffect:
window.electron.on('menu:custom:myAction', handleCustomAction);
```

### Platform-Specific Menus

The menu automatically adapts to macOS and Windows/Linux:
- macOS gets an app menu with About, Services, and Hide options
- Windows/Linux get Exit in the File menu and About in the Help menu
- Keyboard shortcuts use Cmd on macOS and Ctrl on Windows/Linux

## Testing

To test the menu system:

1. Run the app: `npm run dev`
2. Check that all menu items appear correctly
3. Test keyboard shortcuts
4. Verify menu actions trigger the correct handlers
5. Test on both macOS and Windows/Linux if possible

## Example

See `src/examples/AppWithMenu.tsx` for a complete working example of menu integration with React state management.

## Troubleshooting

### Menu items not responding

Make sure:
1. IPC handlers are registered in `electron/main.ts`
2. `useMenuActions` hook is called in your root component
3. Menu listeners are set up before the window is shown

### Keyboard shortcuts not working

- Check for conflicts with browser/system shortcuts
- Verify the accelerator syntax in `electron/menu.ts`
- Test in a production build (some shortcuts behave differently in dev mode)

### Menu not showing on macOS

- Ensure `setApplicationMenu()` is called after window creation
- Check that the menu is built correctly with `Menu.buildFromTemplate()`

## Future Enhancements

Potential improvements:
- Dynamic menu items based on app state
- Recent files submenu
- Context menus for specific UI elements
- Menu state synchronization (checkmarks, enabled/disabled states)
- Custom menu bar themes

# PreferencesDialog Component

A comprehensive settings/preferences dialog for the Vellum book publishing application.

## Features

### 1. General Settings
- **Auto-save toggle**: Enable/disable automatic saving
- **Auto-save interval**: Configure how frequently documents are auto-saved (10s, 30s, 1m, 2m, 5m)
- **Default style selection**: Choose default book style for new chapters

### 2. Editor Preferences
- **Font size**: Adjustable editor font size (10-24px)
- **Spell check**: Toggle spell checking
- **Line numbers**: Show/hide line numbers
- **Word wrap**: Enable/disable word wrapping
- **Tab size**: Configure tab spacing (2, 4, or 8 spaces)

### 3. Export Defaults
- **Export format**: Choose default format (PDF, EPUB, DOCX, HTML)
- **Trim size**: Select book dimensions (5x8, 5.5x8.5, 6x9, 8.5x11, custom)
- **Table of contents**: Include/exclude TOC in exports
- **Page numbers**: Include/exclude page numbers

### 4. Theme Selection
- **Light theme**: Bright, high-contrast interface
- **Dark theme**: Dark, easy-on-eyes interface
- **System theme**: Automatically match OS theme preference

### 5. Keyboard Shortcuts Customization
- View and customize keyboard shortcuts for all actions
- Organized by category: File, Edit, View, Navigation, Formatting
- Click any shortcut to edit
- Reset individual shortcuts to defaults
- Support for multiple key combinations per action

## Usage

```tsx
import { PreferencesDialog } from './components/PreferencesDialog';
import { useState } from 'react';

function App() {
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <>
      <button onClick={() => setShowPreferences(true)}>
        Open Preferences
      </button>

      <PreferencesDialog
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        availableStyles={bookStyles} // Optional: array of BookStyle objects
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls dialog visibility |
| `onClose` | `() => void` | Yes | Callback when dialog is closed |
| `availableStyles` | `BookStyle[]` | No | List of available book styles for default selection |

## Configuration Service

The preferences are managed by the `ConfigService` singleton, which provides:

- **Persistence**: Preferences are saved to localStorage and optionally to file system
- **Real-time updates**: Changes are immediately reflected across the app
- **Change listeners**: Subscribe to preference changes
- **Import/Export**: Save and restore preference configurations
- **Type-safe**: Full TypeScript support for all preference types

### Using ConfigService

```tsx
import { getConfigService } from './services/config';

// Get current preferences
const preferences = getConfigService().getPreferences();

// Update specific preference
getConfigService().updateTheme('dark');

// Listen to changes
const unsubscribe = getConfigService().onChange((newPreferences) => {
  console.log('Preferences updated:', newPreferences);
});

// Clean up listener
unsubscribe();
```

## Accessing via Menu or Toolbar

To make preferences accessible via menu:

```tsx
// In your menu configuration
const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Preferences...',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          // Open preferences dialog
          mainWindow.webContents.send('open-preferences');
        }
      }
    ]
  }
];
```

To add toolbar button:

```tsx
<button
  onClick={() => setShowPreferences(true)}
  title="Preferences"
  aria-label="Open preferences"
>
  ⚙️
</button>
```

## Keyboard Shortcut Format

Shortcuts support platform-specific keys:
- `Ctrl+S, Cmd+S` - Ctrl on Windows/Linux, Cmd on macOS
- Multiple combinations separated by commas
- Examples: `Ctrl+Shift+N`, `Alt+F4`, `Cmd+Option+P`

## Persistence

Preferences are persisted to:
1. **localStorage**: For browser-based persistence
2. **File system** (Electron only): `preferences.json` in app data directory

Configuration is automatically saved after changes with a 500ms debounce.

## Styling

The component includes comprehensive CSS with:
- Light and dark theme support
- Responsive design for mobile/tablet
- Smooth animations and transitions
- Accessible focus states
- Follows existing design patterns from ImportPreviewDialog

## Electron Integration

For full functionality in Electron, implement these IPC handlers:

```typescript
// In main process
ipcMain.handle('config:save', async (event, { content }) => {
  // Save to app data directory
});

ipcMain.handle('config:export', async (event, { defaultPath, content }) => {
  // Show save dialog and export
});

ipcMain.handle('config:import', async () => {
  // Show open dialog and import
});
```

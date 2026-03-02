# Editor Plugins

This directory contains ProseMirror plugins for the Vellum editor.

## Available Plugins

### Base Plugins (`base.ts`)
- **Gap Cursor**: Allows cursor placement in locations that normally wouldn't be selectable (e.g., between block elements)

### History Plugin (`history.ts`)
- **Undo/Redo**: Provides undo and redo functionality with configurable depth and group delay
- Default depth: 100 history entries
- Default group delay: 500ms (changes within this window are grouped together)

### Keymap Plugins (`keymap.ts`)
- **Undo**: `Cmd-Z` (Mac) / `Ctrl-Z` (Windows/Linux)
- **Redo**: `Cmd-Y` or `Shift-Cmd-Z` (Mac) / `Ctrl-Y` or `Shift-Ctrl-Z` (Windows/Linux)
- **Base Keymap**: Standard editing commands (Enter, Backspace, Delete, arrow keys, etc.)

## Usage

### Using Default Plugins

```typescript
import { createDefaultPlugins } from './plugins';
import { editorSchema } from './schema';
import { EditorState } from 'prosemirror-state';

const plugins = createDefaultPlugins(editorSchema, {
  historyDepth: 100,
  newGroupDelay: 500,
});

const state = EditorState.create({
  schema: editorSchema,
  plugins,
});
```

### Using Individual Plugins

```typescript
import { createHistoryPlugin, createKeymapPlugins, createBasePlugins } from './plugins';
import { editorSchema } from './schema';

const plugins = [
  createHistoryPlugin({ depth: 50, newGroupDelay: 1000 }),
  ...createBasePlugins(editorSchema),
  ...createKeymapPlugins(editorSchema),
];
```

## Plugin Order

The order of plugins matters in ProseMirror. The default plugin order is:

1. **History Plugin** - Must come first to track all changes
2. **Base Plugins** - Gap cursor and other base functionality
3. **Keymap Plugins** - Should be last to have lowest priority

This ensures that history captures all changes and keymaps don't override more specific plugin behavior.

## Configuration Options

### History Plugin

- `depth` (number): Maximum number of history entries (default: 100)
- `newGroupDelay` (number): Time in milliseconds to group consecutive changes (default: 500)

## Adding Custom Plugins

To add a custom plugin:

1. Create a new file in this directory (e.g., `myPlugin.ts`)
2. Export a function that returns a ProseMirror Plugin
3. Add it to `index.ts` exports
4. Include it in `createDefaultPlugins` if it should be enabled by default

Example:

```typescript
// myPlugin.ts
import { Plugin } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';

export function createMyPlugin(schema: Schema): Plugin {
  return new Plugin({
    // plugin implementation
  });
}
```

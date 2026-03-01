# Redux Store

This directory contains the Redux store configuration and setup for the Book Publishing Application.

## Structure

```
store/
├── index.ts      # Store configuration with Redux DevTools
├── hooks.ts      # Typed hooks for Redux
└── README.md     # This file

slices/
├── bookSlice.ts      # Book data and CRUD operations
├── selectionSlice.ts # Current selection state
├── uiSlice.ts        # UI state management
├── styleSlice.ts     # Style settings
├── previewSlice.ts   # Preview mode state
└── index.ts          # Slices exports
```

## Usage

### 1. Wrap your app with Redux Provider

```tsx
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <YourApp />
    </Provider>
  );
}
```

### 2. Use typed hooks in components

```tsx
import { useAppDispatch, useAppSelector } from './store/hooks';
import { addChapter, selectChapter } from './slices';

function BookEditor() {
  const dispatch = useAppDispatch();
  const currentBook = useAppSelector(state => state.book.currentBook);
  const selectedChapterId = useAppSelector(state => state.selection.chapterId);

  const handleAddChapter = (chapter) => {
    dispatch(addChapter(chapter));
    dispatch(selectChapter(chapter.id));
  };

  return <div>...</div>;
}
```

## Slices

### BookSlice

Manages book data including chapters and elements (front/back matter).

**Key Actions:**
- `setBook(book)` - Set the current book
- `addChapter(chapter)` - Add a new chapter
- `updateChapter({ id, chapter })` - Update a chapter
- `deleteChapter(id)` - Delete a chapter
- `reorderChapters(ids)` - Reorder chapters
- `addElement({ matter, element })` - Add front/back matter element
- `updateElement({ matter, id, element })` - Update an element
- `deleteElement({ matter, id })` - Delete an element

### SelectionSlice

Tracks the current selection (chapter, element, text block, or text range).

**Key Actions:**
- `selectChapter(id)` - Select a chapter
- `selectElement(id)` - Select an element
- `selectTextBlock({ chapterOrElementId, textBlockId })` - Select a text block
- `selectTextRange(range)` - Select a text range
- `clearSelection()` - Clear selection
- `undoSelection()` / `redoSelection()` - Navigate selection history

### UISlice

Manages UI state including theme, layout, panels, modals, and toasts.

**Key Actions:**
- `setTheme(theme)` - Set theme (light/dark/auto)
- `setLayoutMode(mode)` - Set layout mode
- `openPanel(panel)` / `closePanel(id)` - Manage panels
- `openModal({ id, data })` / `closeModal(id)` - Manage modals
- `addToast(toast)` / `removeToast(id)` - Manage toasts
- `setZoom(zoom)` - Set zoom level
- `toggleFullscreen()` - Toggle fullscreen mode

### StyleSlice

Manages style definitions and style templates.

**Key Actions:**
- `addStyle(style)` - Add a new style
- `updateStyle({ id, style })` - Update a style
- `deleteStyle(id)` - Delete a style
- `setCurrentStyle(id)` - Set active style
- `toggleFavorite(id)` - Toggle favorite style
- `addTemplate(template)` - Add a style template
- `applyTemplate(id)` - Apply a style template

### PreviewSlice

Manages preview mode state and settings.

**Key Actions:**
- `setPreviewMode(mode)` - Set preview mode (off/side-by-side/preview-only/fullscreen)
- `togglePreview()` - Toggle preview on/off
- `setExportFormat(format)` - Set export format (pdf/epub/mobi/html/docx/markdown)
- `setPageSettings(settings)` - Update page settings
- `setScale(scale)` - Set preview scale
- `refreshPreview()` - Trigger preview refresh

## Redux DevTools

The store is configured with Redux DevTools integration. Features include:

- **Action history** - View all dispatched actions
- **State inspection** - Inspect state at any point
- **Time travel** - Jump to previous states
- **Action dispatch** - Manually dispatch actions
- **State import/export** - Save and load state
- **Action tracing** - See where actions were dispatched from

To use Redux DevTools:
1. Install the [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
2. Open your app in development mode
3. Open browser DevTools and look for the Redux tab

## Type Safety

All hooks and state are fully typed with TypeScript. Use the provided hooks:

```tsx
import { useAppDispatch, useAppSelector } from './store/hooks';

// ✅ Correct - Fully typed
const dispatch = useAppDispatch();
const book = useAppSelector(state => state.book.currentBook);

// ❌ Avoid - Not typed
import { useDispatch, useSelector } from 'react-redux';
const dispatch = useDispatch(); // Not typed
```

## Best Practices

1. **Always use typed hooks** - Use `useAppDispatch` and `useAppSelector` instead of plain hooks
2. **Keep actions simple** - One action should do one thing
3. **Use selectors** - Create reusable selectors for complex state access
4. **Normalize state** - Keep state flat when possible
5. **Avoid mutations** - Redux Toolkit uses Immer, but be aware of edge cases
6. **Use action creators** - Always use the exported action creators from slices

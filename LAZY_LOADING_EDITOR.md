# Lazy Loading Editor

A high-performance editor implementation with lazy loading, caching, and preloading capabilities for handling large documents with multiple chapters.

## Features

- **Lazy Loading**: Only loads and renders the active chapter's content
- **LRU Cache**: Keeps 3-5 most recently accessed chapters in memory
- **Smart Preloading**: Automatically preloads adjacent chapters (previous/next) in the background
- **Undo/Redo**: Separate undo/redo stacks maintained per chapter
- **Unsaved Changes**: Tracks and preserves unsaved changes even when chapters are unloaded from cache
- **Loading States**: Smooth transitions with loading indicators during chapter switches
- **Memory Efficient**: Unloads inactive chapters while preserving unsaved changes

## Architecture

### Components

```
src/
├── components/
│   └── Editor/
│       ├── Editor.tsx              # Main editor component
│       ├── EditorToolbar.tsx       # Navigation and controls
│       ├── EditorContent.tsx       # Content display and editing
│       ├── LoadingOverlay.tsx      # Loading state UI
│       ├── Editor.css              # Styles
│       └── index.ts                # Exports
├── services/
│   └── content-loader.ts           # Content loading service
├── store/
│   └── chapters/
│       ├── chapter-store.ts        # State management
│       ├── undo-redo.ts            # Undo/redo manager
│       └── index.ts                # Exports
├── utils/
│   └── lru-cache.ts                # LRU cache implementation
└── hooks/
    └── useChapterStore.ts          # React hook for store
```

### Core Classes

#### `LRUCache<T>`
- Generic LRU (Least Recently Used) cache implementation
- Configurable size (default: 5 items)
- Automatic eviction of least recently used items
- O(1) get/set operations

#### `ContentLoaderService`
- Manages chapter content loading and caching
- Handles preloading of adjacent chapters
- Preserves unsaved changes when chapters are unloaded
- Provides loading state notifications

#### `UndoRedoManager`
- Maintains separate undo/redo stacks per chapter
- Configurable history size (default: 50 states)
- Efficient memory usage with deep cloning

#### `ChapterStore`
- Central state management for the editor
- Coordinates between ContentLoader and UndoRedoManager
- Observable pattern for state updates
- Navigation helpers (next/prev chapter)

## Usage

### Basic Example

```tsx
import React from 'react';
import { Editor } from './components/Editor';
import { getChapterStore } from './store/chapters';
import { Chapter } from './types/chapter';

function MyEditor() {
  const chapters: Chapter[] = [
    // Your chapters here
  ];

  const store = getChapterStore(5, 50); // 5 cache size, 50 history size
  store.initializeChapters(chapters);

  return (
    <Editor
      store={store}
      initialChapterId="chapter-1"
      onChapterChange={(chapterId) => {
        console.log('Now editing:', chapterId);
      }}
    />
  );
}
```

### Using the React Hook

```tsx
import React from 'react';
import { Editor } from './components/Editor';
import { useChapterStore } from './hooks/useChapterStore';

function MyEditor() {
  const chapters = [/* your chapters */];

  const {
    store,
    state,
    loadChapter,
    saveChapter,
    undo,
    redo,
    navigateNext,
    navigatePrevious,
    getCacheStats,
  } = useChapterStore(chapters, {
    cacheSize: 5,
    maxHistorySize: 50,
    initialChapterId: 'chapter-1',
  });

  return (
    <div>
      <button onClick={() => undo()}>Undo</button>
      <button onClick={() => redo()}>Redo</button>
      <button onClick={() => saveChapter()}>Save</button>

      <Editor store={store} />

      {state.isDirty && <p>You have unsaved changes</p>}
    </div>
  );
}
```

### Advanced Usage

#### Custom Cache Size

```tsx
const store = getChapterStore(
  10,  // Keep 10 chapters in cache
  100  // 100 undo/redo states per chapter
);
```

#### Programmatic Navigation

```tsx
// Load specific chapter
await store.loadChapter('chapter-5');

// Navigate sequentially
await store.navigateNext();
await store.navigatePrevious();

// Check chapter info
const chapter = store.getChapterInfo('chapter-5');
console.log(chapter.title);
```

#### Cache Management

```tsx
// Get cache statistics
const stats = store.getCacheStats();
console.log('Cached chapters:', stats.contentLoader.keys);
console.log('Undo states:', stats.undoRedo.totalUndoStates);

// Clear cache (preserving unsaved changes)
store.clearCache(true);

// Clear cache (discard unsaved changes)
store.clearCache(false);
```

#### Monitoring State

```tsx
const unsubscribe = store.subscribe((state) => {
  console.log('Active chapter:', state.activeChapterId);
  console.log('Is loading:', state.isLoading);
  console.log('Has unsaved changes:', state.isDirty);
  console.log('Can undo:', state.undoRedoState.canUndo);
  console.log('Can redo:', state.undoRedoState.canRedo);
});

// Later, unsubscribe
unsubscribe();
```

## Performance Characteristics

### Memory Usage
- **Active Chapter**: Full content in memory + undo/redo stacks
- **Cached Chapters**: 4-5 chapters worth of content (configurable)
- **Inactive Chapters**: Only unsaved changes retained (if any)

### Loading Times
- **Cached Chapter**: < 10ms (instant from cache)
- **Preloaded Chapter**: < 10ms (already loaded in background)
- **Cold Load**: 100-200ms (simulated, adjust for real I/O)

### Optimization Strategies
1. **LRU Cache**: Keeps frequently accessed chapters in memory
2. **Preloading**: Adjacent chapters loaded in background
3. **Lazy Initialization**: Undo/redo stacks created on first access
4. **Selective Persistence**: Only dirty chapters need saving

## API Reference

### ChapterStore

```typescript
class ChapterStore {
  // Initialization
  initializeChapters(chapters: Chapter[]): void

  // State management
  getState(): Readonly<ChapterState>
  subscribe(listener: ChapterStoreListener): () => void

  // Chapter operations
  loadChapter(chapterId: string): Promise<boolean>
  updateContent(content: TextBlock[]): void
  saveCurrentChapter(): Promise<boolean>

  // Navigation
  navigateNext(): Promise<boolean>
  navigatePrevious(): Promise<boolean>

  // Undo/Redo
  undo(): void
  redo(): void

  // Utilities
  getChapterInfo(chapterId: string): Chapter | undefined
  getAllChapters(): Chapter[]
  getCacheStats(): object
  clearCache(preserveUnsaved: boolean): void
}
```

### ContentLoaderService

```typescript
class ContentLoaderService {
  // Initialization
  initializeChapters(chapters: Chapter[]): void
  setOnLoadingStateChange(callback: (state: LoadingState) => void): void

  // Loading
  loadChapter(chapterId: string): Promise<ChapterContent | null>

  // Content management
  updateChapterContent(chapterId: string, content: TextBlock[]): void
  saveChapter(chapterId: string): Promise<boolean>

  // State queries
  getUnsavedChanges(chapterId: string): TextBlock[] | undefined
  hasUnsavedChanges(chapterId: string): boolean
  getLoadingState(chapterId: string): LoadingState

  // Cache management
  unloadChapter(chapterId: string): void
  clearCache(preserveUnsaved: boolean): void
  getCacheStats(): object
}
```

### UndoRedoManager

```typescript
class UndoRedoManager {
  // Initialization
  initializeChapter(chapterId: string, initialContent: TextBlock[]): void

  // Operations
  pushState(chapterId: string, content: TextBlock[]): void
  undo(chapterId: string, currentContent: TextBlock[]): TextBlock[] | null
  redo(chapterId: string, currentContent: TextBlock[]): TextBlock[] | null

  // State queries
  canUndo(chapterId: string): boolean
  canRedo(chapterId: string): boolean
  getState(chapterId: string): UndoRedoState

  // Management
  clearHistory(chapterId: string): void
  removeChapter(chapterId: string): void
  getStats(): object
}
```

## Testing

Run the example to see the lazy loading editor in action:

```tsx
import { LazyEditorExample } from './examples/LazyEditorExample';

function App() {
  return <LazyEditorExample />;
}
```

## Configuration

### Cache Size
Controls how many chapters are kept in memory:
- **Small (3)**: Minimal memory, more loading
- **Medium (5)**: Balanced (default)
- **Large (10)**: Fast navigation, more memory

### History Size
Controls undo/redo depth per chapter:
- **Small (20)**: Limited undo, less memory
- **Medium (50)**: Good balance (default)
- **Large (100)**: Deep history, more memory

## Future Enhancements

- [ ] Virtual scrolling for very large chapters
- [ ] Debounced auto-save
- [ ] Cloud sync integration
- [ ] Collaborative editing support
- [ ] Search across chapters
- [ ] Export/import functionality
- [ ] Custom loading strategies
- [ ] WebWorker for background processing

## License

MIT

# Editor Test Utilities

This directory contains comprehensive test utilities and fixtures for testing the Editor component.

## Directory Structure

```
__tests__/
├── fixtures/          # Test data and fixtures
│   ├── chapters.ts   # Chapter and TextBlock fixtures
│   └── index.ts      # Fixtures export
├── utils/            # Test utilities
│   ├── mockChapterStore.ts          # Mock ChapterStore implementation
│   ├── renderWithProviders.tsx      # Custom render with Redux
│   ├── userInteractions.ts          # User interaction helpers
│   ├── contentEditableMocks.ts      # ContentEditable API mocks
│   ├── prosemirrorTestUtils.ts      # ProseMirror test utilities
│   └── index.ts                     # Utilities export
└── README.md         # This file
```

## Usage

### Quick Start

```typescript
import { render } from '@/__tests__/utils';
import { sampleChapters } from '@/__tests__/fixtures';

// All utilities are available from the index exports
```

### 1. Test Fixtures

Create mock chapters and text blocks for testing:

```typescript
import {
  createMockChapter,
  createMockTextBlock,
  sampleChapters,
  emptyChapter,
  complexChapter,
  createChapterSequence,
} from '@/__tests__/fixtures';

// Create a custom chapter
const chapter = createMockChapter({
  title: 'My Test Chapter',
  content: [
    createMockTextBlock({ content: 'First paragraph' }),
    createMockTextBlock({ content: 'Second paragraph' }),
  ],
});

// Use pre-built samples
const chapters = sampleChapters; // Array of 3 sample chapters
const empty = emptyChapter; // Empty chapter for testing
const complex = complexChapter; // Chapter with various block types

// Create multiple chapters for navigation testing
const sequence = createChapterSequence(10); // Creates 10 chapters
```

### 2. Mock ChapterStore

Create a mock ChapterStore for testing components:

```typescript
import { createMockChapterStore, waitForStateChange } from '@/__tests__/utils';
import { sampleChapters } from '@/__tests__/fixtures';

// Create a mock store with chapters
const mockStore = createMockChapterStore({
  chapters: sampleChapters,
  initialState: {
    activeChapterId: 'chapter-1',
    content: sampleChapters[0].content,
  },
});

// Use in tests
await mockStore.loadChapter('chapter-2');
expect(mockStore.getState().activeChapterId).toBe('chapter-2');

// Wait for state changes
const newState = await waitForStateChange(
  mockStore,
  (state) => state.isDirty === true
);
```

### 3. Custom Render with Redux

Render components with Redux Provider:

```typescript
import { renderWithProviders, createTestStore } from '@/__tests__/utils';
import { MyComponent } from './MyComponent';

// Basic usage
const { getByText, store } = renderWithProviders(<MyComponent />);

// With preloaded state
const { getByText, store } = renderWithProviders(<MyComponent />, {
  preloadedState: {
    book: { /* your state */ },
    selection: { /* your state */ },
  },
});

// With custom store
const customStore = createTestStore();
const { getByText } = renderWithProviders(<MyComponent />, {
  store: customStore,
});
```

### 4. User Interaction Helpers

Simulate user interactions with the editor:

```typescript
import {
  typeInBlock,
  clickSave,
  clickUndo,
  selectChapter,
  addBlock,
  removeBlock,
  pressEnter,
  applyFormatting,
} from '@/__tests__/utils';

// Type in a specific block
await typeInBlock(0, 'Hello world');

// Add and remove blocks
await addBlock();
await removeBlock(1);

// Save and undo
await clickSave();
await clickUndo();

// Select a chapter
await selectChapter(/chapter 2/i);

// Apply formatting
const element = screen.getByRole('textbox');
await applyFormatting(element, 'bold');
```

### 5. ContentEditable Mocks

Mock the Selection API and contentEditable behavior:

```typescript
import {
  setupContentEditableMocks,
  mockSelection,
  mockExecCommand,
  setTextSelection,
  simulateInput,
} from '@/__tests__/utils';

// Setup all mocks at once
const mocks = setupContentEditableMocks();

// Use individual mocks
const selectionMock = mockSelection();
selectionMock.setSelection({
  anchorNode: textNode,
  anchorOffset: 0,
  focusNode: textNode,
  focusOffset: 5,
});

// Cleanup after tests
afterEach(() => {
  mocks.cleanup();
});
```

### 6. ProseMirror Test Utilities

Test ProseMirror editor functionality:

```typescript
import {
  createTestEditor,
  insertText,
  applyMark,
  getDocumentText,
  typeText,
  simulateUndo,
} from '@/__tests__/utils';

// Create a test editor
const { view, state } = createTestEditor('<p>Hello world</p>');

// Insert text
insertText(view, ' and goodbye');

// Apply formatting
applyMark(view, 'strong');

// Get content
const text = getDocumentText(view.state);

// Simulate typing
await typeText(view, 'More text', 50); // 50ms delay between chars

// Clean up
destroyEditor(view);
```

## Complete Example Test

```typescript
import { render, screen } from '@/__tests__/utils';
import {
  createMockChapterStore,
  typeInBlock,
  clickSave,
  getBlockCount,
} from '@/__tests__/utils';
import { sampleChapters } from '@/__tests__/fixtures';
import { Editor } from '@/components/Editor/Editor';

describe('Editor', () => {
  it('allows editing and saving chapter content', async () => {
    // Setup
    const mockStore = createMockChapterStore({
      chapters: sampleChapters,
    });

    // Render
    render(<Editor store={mockStore} initialChapterId="chapter-1" />);

    // Wait for load
    await screen.findByText(/the beginning/i);

    // Type in first block
    await typeInBlock(0, ' Additional content');

    // Verify dirty state
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();

    // Save
    await clickSave();

    // Verify saved
    expect(mockStore.saveCurrentChapter).toHaveBeenCalled();
  });
});
```

## API Reference

### Fixtures

- `createMockChapter(overrides?)` - Create a mock chapter
- `createMockTextBlock(overrides?)` - Create a mock text block
- `sampleChapters` - Array of sample chapters
- `sampleTextBlocks` - Array of sample text blocks
- `emptyChapter` - Empty chapter fixture
- `complexChapter` - Complex chapter with various block types
- `createChapterSequence(count)` - Create multiple chapters
- `createChapterWithWordCount(count)` - Create chapter with specific word count

### Mock ChapterStore

- `createMockChapterStore(options?)` - Create a mock store
- `simulateLoading(store, duration)` - Simulate loading delay
- `getMockStoreState(store)` - Get current state
- `waitForStateChange(store, predicate, timeout)` - Wait for state change
- `resetMockStore(store)` - Reset all mocks

### Render Utilities

- `renderWithProviders(ui, options?)` - Render with Redux Provider
- `createTestStore(preloadedState?)` - Create a test Redux store
- `getStoreState(result)` - Get Redux state from render result
- `dispatchAndWait(result, action, waitMs?)` - Dispatch action and wait

### User Interactions

- `typeInEditor(element, text, options?)` - Type text
- `typeInBlock(index, text, options?)` - Type in specific block
- `selectText(element, start, end)` - Select text range
- `applyFormatting(element, format)` - Apply text formatting
- `clickButton(text)` - Click a button
- `clickSave()`, `clickUndo()`, `clickRedo()` - Click toolbar buttons
- `selectChapter(title)` - Select a chapter
- `addBlock()`, `removeBlock(index)` - Add/remove blocks
- `pressKey(key, modifiers?)` - Press keyboard keys
- `getAllBlockContents()` - Get all block text
- `getBlockCount()` - Get number of blocks

### ContentEditable Mocks

- `setupContentEditableMocks()` - Setup all mocks
- `mockSelection()` - Mock Selection API
- `mockExecCommand()` - Mock document.execCommand
- `mockClipboard()` - Mock Clipboard API
- `setTextSelection(element, start, end)` - Set selection
- `simulateInput(element, data, type)` - Simulate input event

### ProseMirror Utilities

- `createTestEditor(content?, container?, schema?, plugins?)` - Create editor
- `createTestEditorState(content?, schema?, plugins?)` - Create state
- `insertText(view, text)` - Insert text
- `deleteText(view, from, to)` - Delete text
- `applyMark(view, markType, attrs?)` - Apply formatting mark
- `toggleMark(view, markType)` - Toggle mark on/off
- `getDocumentText(state)` - Get text content
- `getDocumentHTML(state)` - Get HTML content
- `typeText(view, text, delay?)` - Simulate typing
- `simulateUndo(view)`, `simulateRedo(view)` - Simulate undo/redo
- `destroyEditor(view)` - Clean up editor

## Best Practices

1. **Use fixtures** instead of creating test data inline
2. **Mock at the right level** - use ChapterStore mock for Editor tests, but test real ChapterStore separately
3. **Clean up after tests** - destroy editors, clean up DOM elements
4. **Wait for async operations** - use `waitForStateChange` or `waitFor` from testing-library
5. **Test user interactions** not implementation details - use the interaction helpers

## TypeScript Support

All utilities and fixtures are fully typed. Import types as needed:

```typescript
import type { CustomRenderResult } from '@/__tests__/utils';
import type { Chapter, TextBlock } from '@/types';
```

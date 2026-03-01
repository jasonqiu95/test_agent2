# Comprehensive Undo/Redo System

## Overview

This document describes the comprehensive undo/redo system implemented for the book publishing application. The system extends beyond editor-level undo/redo to provide app-level history tracking for structural changes.

## Architecture

### Components

1. **Redux Store** (`src/store/index.ts`)
   - Central state management using Redux Toolkit
   - Configured with book slice and undo slice
   - Includes undo middleware for action tracking

2. **Undo Middleware** (`src/store/middleware/undoMiddleware.ts`)
   - Intercepts all Redux actions
   - Tracks undoable actions (add, delete, reorder, update operations)
   - Captures state before and after each action
   - Handles undo/redo by restoring previous states
   - Excludes non-structural actions from tracking

3. **Undo Slice** (`src/slices/undoSlice.ts`)
   - Manages history stacks (past and future)
   - Enforces history limit (default: 50 actions)
   - Provides selectors for undo/redo availability
   - Tracks action metadata (timestamp, state snapshots)

4. **Book Slice** (`src/slices/bookSlice.ts`)
   - Manages book state with undoable actions
   - Supports:
     - Chapter management (add, delete, update, reorder)
     - Element management (front/back matter)
     - Author management
     - Book metadata updates

5. **Undo/Redo Hook** (`src/hooks/useUndoRedo.ts`)
   - React hook for undo/redo operations
   - Registers keyboard shortcuts:
     - **Ctrl+Z** (Cmd+Z on Mac): Undo
     - **Ctrl+Shift+Z** (Cmd+Shift+Z on Mac): Redo
   - Provides state and control functions

6. **UI Components** (`src/components/UndoRedoStatus/`)
   - Visual undo/redo controls
   - Action count display
   - Keyboard shortcut hints
   - Clear visual distinction between undo/redo states

## Features

### 1. Redux Action History
All structural changes are tracked automatically:
- Add/delete/reorder chapters
- Add/delete/reorder elements (front/back matter)
- Add/delete/update authors
- Update book metadata

### 2. State Restoration
- Complete state snapshots before and after each action
- Accurate restoration of book state on undo/redo
- Proper handling of complex nested structures

### 3. History Management
- Configurable history limit (default: 50 actions)
- Automatic pruning of oldest actions when limit reached
- Future history cleared when new action is performed
- Memory-efficient storage of state diffs

### 4. Keyboard Shortcuts
- **Ctrl+Z** / **Cmd+Z**: Undo last action
- **Ctrl+Shift+Z** / **Cmd+Shift+Z**: Redo next action
- Works globally across the application
- Automatic platform detection (Windows/Mac)

### 5. Visual Feedback
- Undo/Redo buttons with enabled/disabled states
- Action count badges showing available undo/redo actions
- Keyboard shortcut hints in UI
- Responsive design for mobile devices

## Usage

### Basic Usage

```typescript
import { useUndoRedo } from './hooks/useUndoRedo';

function MyComponent() {
  const { undo, redo, canUndo, canRedo, undoCount, redoCount } = useUndoRedo();

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>
        Undo ({undoCount})
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo ({redoCount})
      </button>
    </div>
  );
}
```

### Dispatching Undoable Actions

```typescript
import { useAppDispatch } from './store/hooks';
import { addChapter, deleteChapter, updateChapter } from './slices/bookSlice';

function BookEditor() {
  const dispatch = useAppDispatch();

  const handleAddChapter = () => {
    dispatch(addChapter({
      id: 'chapter-1',
      title: 'New Chapter',
      content: [],
      // ... other chapter properties
    }));
  };

  const handleDeleteChapter = (chapterId: string) => {
    dispatch(deleteChapter(chapterId));
  };

  const handleUpdateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    dispatch(updateChapter({ id: chapterId, updates }));
  };
}
```

### Configuring History Limit

```typescript
import { useAppDispatch } from './store/hooks';
import { setMaxHistorySize } from './slices/undoSlice';

function Settings() {
  const dispatch = useAppDispatch();

  const handleChangeHistoryLimit = (newLimit: number) => {
    dispatch(setMaxHistorySize(newLimit));
  };
}
```

## Undoable Actions

The following actions are automatically tracked:

### Chapter Operations
- `book/addChapter` - Add new chapter
- `book/deleteChapter` - Delete chapter
- `book/updateChapter` - Update chapter properties
- `book/reorderChapters` - Reorder chapters

### Element Operations
- `book/addElement` - Add front/back matter element
- `book/deleteElement` - Delete element
- `book/updateElement` - Update element properties
- `book/reorderElements` - Reorder elements

### Author Operations
- `book/addAuthor` - Add author
- `book/deleteAuthor` - Delete author
- `book/updateAuthor` - Update author information

### Metadata Operations
- `book/updateMetadata` - Update book metadata

## Non-Undoable Actions

The following actions are NOT tracked (for performance reasons):
- `book/setCurrentBook` - Switch current book
- `book/setLoading` - Update loading state
- `book/setError` - Update error state
- All undo slice actions

## Technical Details

### State Storage
- **Past**: Array of history entries (most recent at end)
- **Future**: Array of future entries for redo (most recent at end)
- **Entry Structure**:
  ```typescript
  {
    action: AnyAction,        // The original action
    stateBefore: RootState,   // State before action
    stateAfter: RootState,    // State after action
    timestamp: number         // Action timestamp
  }
  ```

### Memory Management
- History limit prevents unbounded memory growth
- Old actions automatically removed when limit exceeded
- State snapshots use Redux Toolkit's serializable check
- Deep cloning avoided through Redux immutability

### Performance Considerations
- Middleware runs on every action but only stores undoable ones
- State comparison is shallow (Redux Toolkit's built-in)
- UI updates only when undo/redo counts change
- Keyboard event listeners cleaned up on unmount

## Testing

### Manual Testing
1. Perform any structural change (add/delete/reorder)
2. Press Ctrl+Z (or Cmd+Z) to undo
3. Verify the change was reversed
4. Press Ctrl+Shift+Z (or Cmd+Shift+Z) to redo
5. Verify the change was reapplied

### Automated Testing
```typescript
// Example test
describe('Undo/Redo System', () => {
  it('should undo chapter addition', () => {
    const store = createTestStore();
    const chapter = createTestChapter();

    store.dispatch(addChapter(chapter));
    expect(store.getState().book.currentBook.chapters).toHaveLength(1);

    store.dispatch(undo());
    expect(store.getState().book.currentBook.chapters).toHaveLength(0);
  });
});
```

## Future Enhancements

Possible improvements for the future:
1. **Action Labels**: Human-readable descriptions for each action
2. **Selective Undo**: Jump to specific points in history
3. **History Persistence**: Save/load undo history to disk
4. **Undo Groups**: Batch multiple actions as single undo point
5. **Conflict Resolution**: Handle concurrent edits in multi-user scenarios
6. **Editor Integration**: Coordinate with editor's native undo
7. **History Viewer**: Visual timeline of actions
8. **Undo Branches**: Support forking history (like Git)

## Troubleshooting

### Issue: Undo not working
- Check that action type is in UNDOABLE_ACTION_PREFIXES
- Verify middleware is properly configured in store
- Ensure state is not mutated directly

### Issue: Memory usage too high
- Reduce MAX_HISTORY_SIZE in undoSlice.ts
- Use setMaxHistorySize action to adjust at runtime
- Check for large objects in state snapshots

### Issue: Keyboard shortcuts not working
- Verify useUndoRedo hook is called in a component
- Check that event listeners are properly registered
- Ensure no other handlers are preventing default behavior

## License

MIT

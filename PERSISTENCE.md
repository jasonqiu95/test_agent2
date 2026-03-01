# Project Persistence System

This document describes the project persistence system implementation for the Vellum book publishing application.

## Overview

The persistence system provides comprehensive save/load functionality for book projects using the `.vellum` file format (JSON-based). It includes auto-save with debouncing, unsaved changes detection, and native file dialogs.

## Architecture

### Components

1. **IPC Handlers** (`electron/ipc/persistence.ts`)
   - Electron main process handlers for file operations
   - Native file dialogs (open, save, save as)
   - Unsaved changes tracking

2. **Persistence Service** (`src/services/persistence.ts`)
   - Singleton service for managing project state
   - Auto-save with 3-second debouncing
   - Event callbacks for changes and saves

3. **React Hook** (`src/hooks/usePersistence.ts`)
   - React integration for the persistence service
   - State management for project info
   - Simplified API for components

4. **UI Components**
   - `UnsavedChangesWarning`: Modal dialog for unsaved changes
   - `AppWithPersistence`: Demo application showing all features

## File Format

The `.vellum` file format is JSON-based:

```json
{
  "version": "1.0.0",
  "book": {
    "id": "...",
    "title": "Book Title",
    "authors": [...],
    "chapters": [...],
    "frontMatter": [...],
    "backMatter": [...],
    "styles": [...],
    "metadata": {...}
  },
  "lastSaved": "2026-03-01T12:00:00.000Z"
}
```

## Usage

### Basic Usage with Hook

```tsx
import { usePersistence } from './hooks/usePersistence'
import { Book } from './types/book'

function MyApp() {
  const [book, setBook] = useState<Book>(createBook())

  const {
    save,
    load,
    markModified,
    hasUnsavedChanges,
    currentProject
  } = usePersistence({
    onSave: (filePath) => console.log('Saved to:', filePath),
    onChange: () => console.log('Project modified')
  })

  const handleBookChange = (updatedBook: Book) => {
    setBook(updatedBook)
    markModified(updatedBook) // Triggers auto-save
  }

  return (
    <div>
      <button onClick={() => save(book)}>Save</button>
      <button onClick={() => load()}>Open</button>
      {hasUnsavedChanges && <span>*</span>}
    </div>
  )
}
```

### Direct Service Usage

```tsx
import { getPersistenceService } from './services/persistence'

const persistence = getPersistenceService()

// Save project
const result = await persistence.save(book)
if (result.success) {
  console.log('Saved to:', result.filePath)
}

// Load project
const loadResult = await persistence.load()
if (loadResult.success) {
  const book = loadResult.data.book
}

// Mark as modified (triggers auto-save)
persistence.markModified(book)
```

## Features

### 1. Save/Load Operations

- **Save**: Save to current file path
- **Save As**: Save with file dialog to choose location
- **Load**: Open file with file dialog
- **New**: Create new project with unsaved changes check

### 2. Auto-Save

- Automatically saves after 3 seconds of inactivity
- Debounced to prevent excessive disk writes
- Only works if project has a file path
- Can be enabled/disabled via `setAutoSaveEnabled()`

### 3. Unsaved Changes Detection

- Tracks modifications to project data
- Shows warning before closing window
- Checks before creating new project
- Integrated with OS close button

### 4. File Dialogs

Native OS dialogs for:
- Open file (`.vellum` filter)
- Save as (`.vellum` default extension)
- Unsaved changes confirmation

## IPC Channels

The following IPC channels are available:

- `project:save` - Save project to file
- `project:saveAs` - Save project with dialog
- `project:load` - Load project from file
- `project:new` - Create new project
- `project:markModified` - Mark project as modified
- `project:hasUnsavedChanges` - Check unsaved changes status
- `project:getCurrentPath` - Get current file path

## API Reference

### PersistenceService

```typescript
class PersistenceService {
  // Save operations
  save(book: Book, filePath?: string): Promise<SaveResult>
  saveAs(book: Book): Promise<SaveResult>
  load(filePath?: string): Promise<LoadResult>
  new(): Promise<{success: boolean}>

  // State management
  markModified(book: Book): void
  hasUnsavedChanges(): Promise<boolean>
  getCurrentPath(): Promise<ProjectInfo>

  // Configuration
  setAutoSaveEnabled(enabled: boolean): void

  // Event callbacks
  onChange(callback: () => void): () => void
  onSave(callback: (filePath: string) => void): () => void

  // Cleanup
  dispose(): void
}
```

### usePersistence Hook

```typescript
interface UsePersistenceReturn {
  currentProject: ProjectInfo
  hasUnsavedChanges: boolean
  isAutoSaveEnabled: boolean
  save: (book: Book) => Promise<SaveResult>
  saveAs: (book: Book) => Promise<SaveResult>
  load: (filePath?: string) => Promise<LoadResult>
  newProject: () => Promise<{success: boolean}>
  markModified: (book: Book) => void
  setAutoSaveEnabled: (enabled: boolean) => void
  refreshProjectInfo: () => Promise<void>
}
```

## Testing

To test the persistence system:

1. Run the demo application:
   ```bash
   npm run dev
   ```

2. Test operations:
   - Create a new project
   - Edit book data
   - Save the project
   - Close and reopen the file
   - Test auto-save by editing and waiting 3 seconds
   - Try to close with unsaved changes

## Security Considerations

- File operations use Node.js `fs.promises` API
- Context isolation is enabled in Electron
- IPC channels use `contextBridge` for security
- No arbitrary code execution from file contents

## Future Enhancements

Potential improvements:
- Backup/recovery system
- Version history
- Cloud sync integration
- Multiple file format support (DOCX, PDF export)
- Collaborative editing
- Conflict resolution for concurrent edits

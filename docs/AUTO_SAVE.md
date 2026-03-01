# Auto-Save Functionality

This document describes the auto-save system implemented for the application.

## Overview

The auto-save system provides:

1. **Debounced Save on State Changes** - Automatically saves changes after 3-5 seconds of inactivity
2. **Visual Status Indicators** - Shows current save state (saving/saved/error/conflict)
3. **Background Saving** - Non-blocking async save operations
4. **Conflict Detection** - Detects when files are modified externally
5. **Toggle Option** - Enable/disable auto-save as needed

## Architecture

### Components

1. **PersistenceService** (`src/services/persistence.ts`)
   - Core service handling file I/O and project state
   - Tracks save status and file modification times
   - Provides event listeners for status changes

2. **useAutoSave Hook** (`src/hooks/useAutoSave.ts`)
   - React hook for monitoring state changes
   - Automatically triggers saves with debouncing
   - Returns save status and control functions

3. **usePersistence Hook** (`src/hooks/usePersistence.ts`)
   - React hook for basic persistence operations
   - Now includes save status information

4. **SaveStatusIndicator Component** (`src/components/SaveStatusIndicator.tsx`)
   - Visual component for displaying save status
   - Handles conflict resolution UI

## Usage

### Basic Auto-Save

```tsx
import { useAutoSave } from '../hooks/useAutoSave';
import { SaveStatusIndicator } from '../components/SaveStatusIndicator';

function MyEditor() {
  const [book, setBook] = useState<Book | null>(null);

  const { saveStatus, lastError, reloadFile } = useAutoSave(book, {
    enabled: true,
    debounceMs: 3000, // 3 seconds
  });

  return (
    <div>
      <SaveStatusIndicator
        status={saveStatus}
        lastError={lastError}
        onReload={reloadFile}
      />
      {/* Your editor UI */}
    </div>
  );
}
```

### With Callbacks

```tsx
const { saveStatus, enableAutoSave, disableAutoSave } = useAutoSave(book, {
  enabled: true,
  debounceMs: 3000,
  onSaveComplete: (filePath) => {
    console.log('Saved to:', filePath);
  },
  onSaveError: (error) => {
    console.error('Save failed:', error);
  },
  onConflict: () => {
    alert('File modified externally!');
  },
});
```

### Disable/Enable Auto-Save

```tsx
const { isAutoSaveEnabled, enableAutoSave, disableAutoSave } = useAutoSave(book);

// Toggle auto-save
const toggleAutoSave = () => {
  if (isAutoSaveEnabled) {
    disableAutoSave();
  } else {
    enableAutoSave();
  }
};
```

### Manual Save

```tsx
const { triggerSave } = useAutoSave(book);

// Save immediately without waiting for debounce
const handleSaveNow = async () => {
  await triggerSave();
};
```

### Conflict Resolution

When a conflict is detected (file modified externally):

```tsx
const { saveStatus, reloadFile } = useAutoSave(book, {
  onConflict: () => {
    // Show dialog to user
    if (confirm('File modified externally. Reload?')) {
      reloadFile();
    }
  },
});
```

## Save Status States

The system uses the following status states:

- **`idle`** - No active save operation, no recent saves
- **`saving`** - Currently saving to disk
- **`saved`** - Save completed successfully (shown for 2 seconds)
- **`error`** - Save failed (check `lastError` for details)
- **`conflict`** - File modified externally

## Configuration Options

### useAutoSave Options

```typescript
interface UseAutoSaveOptions {
  enabled?: boolean;        // Enable/disable auto-save (default: true)
  debounceMs?: number;      // Debounce delay in ms (default: 3000)
  onSaveStart?: () => void;
  onSaveComplete?: (filePath: string) => void;
  onSaveError?: (error: string) => void;
  onConflict?: () => void;
}
```

### Recommended Debounce Times

- **Small documents** (< 100KB): 3000ms (3 seconds)
- **Medium documents** (100KB - 1MB): 4000ms (4 seconds)
- **Large documents** (> 1MB): 5000ms (5 seconds)

## Conflict Detection

The system detects conflicts by:

1. Storing file modification time on load/save
2. Checking modification time before each save
3. Preventing save if file was modified externally
4. Setting status to `conflict` and notifying user

To resolve conflicts:

```tsx
const { reloadFile } = useAutoSave(book);

// Option 1: Reload from disk (loses local changes)
await reloadFile();

// Option 2: Force save (overwrites external changes)
// User should implement this based on their requirements
```

## Best Practices

1. **Only auto-save files with a path** - New unsaved projects should not be auto-saved
2. **Clear visual feedback** - Always show save status to users
3. **Handle conflicts gracefully** - Provide clear options when conflicts occur
4. **Debounce appropriately** - Balance between save frequency and performance
5. **Test error scenarios** - Ensure proper handling of disk full, permissions, etc.

## Implementation Details

### Debouncing

The debounce timer is reset on every state change:

```typescript
// In useAutoSave hook
useEffect(() => {
  if (bookChanged) {
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      persistence.updateProject(book);
    }, debounceMs);
  }
}, [book, debounceMs]);
```

### Conflict Detection

File modification time is checked before each save:

```typescript
// In PersistenceService
private async checkForConflict(filePath: string): Promise<boolean> {
  const stats = await window.electron.invoke('persistence:getFileStats', {
    filePath,
  });

  if (stats.modTime > this.lastFileModTime) {
    return true; // Conflict detected
  }

  return false;
}
```

### Status Lifecycle

```
idle → [change detected] → [debounce wait] → saving → saved → idle
                                                    ↓
                                                  error
                                                    ↓
                                                 conflict
```

## Electron Main Process Requirements

The following IPC handlers must be implemented in the Electron main process:

```typescript
// File stats for conflict detection
ipcMain.handle('persistence:getFileStats', async (event, { filePath }) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      success: true,
      modTime: stats.mtimeMs,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});
```

## Testing

### Manual Testing

1. Load a file
2. Make changes to the document
3. Wait for auto-save indicator (should appear after debounce time)
4. Verify file is saved
5. Modify file externally (e.g., in text editor)
6. Make another change in the app
7. Verify conflict is detected

### Edge Cases to Test

- [ ] Auto-save disabled - changes should not be saved
- [ ] No file path - new projects should not auto-save
- [ ] File deleted externally - should show error
- [ ] File permissions changed - should show error
- [ ] Disk full - should show error
- [ ] Rapid changes - should only save once after debounce
- [ ] App closed during save - should handle gracefully

## Future Enhancements

Potential improvements:

1. **Backup/Version History** - Keep previous versions
2. **Conflict Resolution UI** - Show diff and merge options
3. **Auto-save Queue** - Queue multiple saves if needed
4. **Progressive Save** - Save chunks for large documents
5. **Cloud Sync** - Sync to cloud storage services
6. **Collaborative Editing** - Handle multiple users

## Troubleshooting

### Auto-save not working

- Check that `isAutoSaveEnabled` is true
- Verify file has a path (not a new unsaved project)
- Check console for errors
- Verify debounce time is reasonable

### Conflicts not detected

- Ensure Electron IPC handler for `getFileStats` is implemented
- Check file system permissions
- Verify file modification time is being tracked

### Slow performance

- Increase debounce time for large documents
- Consider implementing progressive save
- Check for JSON serialization performance issues

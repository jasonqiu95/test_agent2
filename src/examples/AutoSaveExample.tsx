import React, { useState } from 'react';
import { useAutoSave } from '../hooks/useAutoSave';
import { usePersistence } from '../hooks/usePersistence';
import { SaveStatusIndicator } from '../components/SaveStatusIndicator';
import type { Book } from '../types/book';

/**
 * Example component demonstrating auto-save functionality
 *
 * This example shows:
 * 1. Monitoring state changes with useAutoSave
 * 2. Displaying save status with visual indicators
 * 3. Enabling/disabling auto-save
 * 4. Handling conflicts and errors
 */
export const AutoSaveExample: React.FC = () => {
  // Example book state (replace with your actual state management)
  const [book, setBook] = useState<Book | null>(null);

  // Use the persistence hook for basic operations
  const { load, saveStatus: persistenceSaveStatus } = usePersistence({
    onSave: (filePath) => {
      console.log('File saved:', filePath);
    },
    onChange: (hasChanges) => {
      console.log('Has unsaved changes:', hasChanges);
    },
  });

  // Use the auto-save hook to automatically save changes
  const {
    saveStatus,
    lastError,
    isAutoSaveEnabled,
    enableAutoSave,
    disableAutoSave,
    triggerSave,
    reloadFile,
  } = useAutoSave(book, {
    enabled: true,
    debounceMs: 3000, // 3 seconds
    onSaveComplete: (filePath) => {
      console.log('Auto-saved to:', filePath);
    },
    onSaveError: (error) => {
      console.error('Auto-save error:', error);
    },
    onConflict: () => {
      alert('File has been modified externally. Please reload.');
    },
  });

  // Example: Update book content
  const handleUpdateBook = (updatedBook: Book) => {
    setBook(updatedBook);
    // Auto-save will be triggered automatically after debounce delay
  };

  // Example: Load a file
  const handleLoadFile = async () => {
    const result = await load();
    if (result.success && result.data) {
      setBook(result.data.book);
    }
  };

  return (
    <div className="auto-save-example">
      <header>
        <h1>Auto-Save Example</h1>

        {/* Save status indicator */}
        <SaveStatusIndicator
          status={saveStatus}
          lastError={lastError}
          onReload={reloadFile}
        />

        {/* Auto-save toggle */}
        <div className="auto-save-controls">
          <label>
            <input
              type="checkbox"
              checked={isAutoSaveEnabled}
              onChange={(e) => {
                if (e.target.checked) {
                  enableAutoSave();
                } else {
                  disableAutoSave();
                }
              }}
            />
            Enable Auto-Save
          </label>

          {/* Manual save button */}
          <button onClick={triggerSave} disabled={!book}>
            Save Now
          </button>

          {/* Load file button */}
          <button onClick={handleLoadFile}>
            Load File
          </button>
        </div>
      </header>

      <main>
        {/* Your book editing UI goes here */}
        {book && (
          <div className="book-editor">
            <h2>{book.title}</h2>
            {/* Add your editing components */}
          </div>
        )}
      </main>
    </div>
  );
};

/**
 * Minimal example showing just the auto-save hook
 */
export const MinimalAutoSaveExample: React.FC<{ book: Book | null }> = ({ book }) => {
  const { saveStatus } = useAutoSave(book, {
    enabled: true,
    debounceMs: 3000,
  });

  return (
    <div className="status-bar">
      {saveStatus === 'saving' && <span>Saving...</span>}
      {saveStatus === 'saved' && <span>✓ Saved</span>}
    </div>
  );
};

/**
 * Example with custom debounce time (5 seconds)
 */
export const SlowAutoSaveExample: React.FC<{ book: Book | null }> = ({ book }) => {
  const { saveStatus, isAutoSaveEnabled, enableAutoSave, disableAutoSave } = useAutoSave(book, {
    enabled: true,
    debounceMs: 5000, // 5 seconds - useful for very large documents
    onSaveStart: () => console.log('Starting auto-save...'),
    onSaveComplete: () => console.log('Auto-save completed'),
  });

  return (
    <div>
      <button onClick={isAutoSaveEnabled ? disableAutoSave : enableAutoSave}>
        {isAutoSaveEnabled ? 'Disable' : 'Enable'} Auto-Save (5s delay)
      </button>
      <SaveStatusIndicator status={saveStatus} />
    </div>
  );
};

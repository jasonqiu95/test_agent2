import { useEffect, useRef, useCallback, useState } from 'react';
import { getPersistenceService, SaveStatus } from '../services/persistence';
import type { Book } from '../types/book';

export interface UseAutoSaveOptions {
  /**
   * Enable/disable auto-save
   * @default true
   */
  enabled?: boolean;

  /**
   * Debounce delay in milliseconds (3-5 seconds recommended)
   * @default 3000
   */
  debounceMs?: number;

  /**
   * Callback when save starts
   */
  onSaveStart?: () => void;

  /**
   * Callback when save completes successfully
   */
  onSaveComplete?: (filePath: string) => void;

  /**
   * Callback when save fails
   */
  onSaveError?: (error: string) => void;

  /**
   * Callback when conflict is detected
   */
  onConflict?: () => void;
}

export interface UseAutoSaveReturn {
  /**
   * Current save status
   */
  saveStatus: SaveStatus;

  /**
   * Last error message if status is 'error'
   */
  lastError?: string;

  /**
   * Whether auto-save is currently enabled
   */
  isAutoSaveEnabled: boolean;

  /**
   * Enable auto-save
   */
  enableAutoSave: () => void;

  /**
   * Disable auto-save
   */
  disableAutoSave: () => void;

  /**
   * Manually trigger a save (bypasses auto-save timer)
   */
  triggerSave: () => Promise<void>;

  /**
   * Reload file to resolve conflicts
   */
  reloadFile: () => Promise<boolean>;
}

/**
 * Hook to automatically save changes to the current project
 *
 * @param book - The book data to monitor for changes
 * @param options - Configuration options
 * @returns Auto-save state and controls
 *
 * @example
 * ```tsx
 * const { saveStatus, enableAutoSave, disableAutoSave } = useAutoSave(bookData, {
 *   enabled: true,
 *   debounceMs: 3000,
 *   onSaveComplete: (filePath) => console.log('Saved to', filePath),
 *   onConflict: () => alert('File modified externally!')
 * });
 *
 * // Display save status
 * {saveStatus === 'saving' && <span>Saving...</span>}
 * {saveStatus === 'saved' && <span>All changes saved</span>}
 * ```
 */
export function useAutoSave(
  book: Book | null,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    enabled = true,
    debounceMs = 3000,
    onSaveStart,
    onSaveComplete,
    onSaveError,
    onConflict,
  } = options;

  const persistence = getPersistenceService();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(enabled);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousBookRef = useRef<Book | null>(null);
  const isSavingRef = useRef(false);

  // Update persistence service auto-save settings
  useEffect(() => {
    persistence.setAutoSaveEnabled(isAutoSaveEnabled);
    if (debounceMs) {
      persistence.setAutoSaveDebounce(debounceMs);
    }
  }, [persistence, isAutoSaveEnabled, debounceMs]);

  // Listen to save status changes from persistence service
  useEffect(() => {
    const unsubscribe = persistence.onStatusChange((status) => {
      setSaveStatus(status);
      const projectInfo = persistence.getProjectInfo();
      setLastError(projectInfo.lastError);

      // Trigger callbacks based on status
      if (status === 'saving' && !isSavingRef.current) {
        isSavingRef.current = true;
        onSaveStart?.();
      } else if (status === 'saved' || status === 'idle') {
        isSavingRef.current = false;
      } else if (status === 'error') {
        isSavingRef.current = false;
        onSaveError?.(projectInfo.lastError || 'Unknown error');
      } else if (status === 'conflict') {
        isSavingRef.current = false;
        onConflict?.();
      }
    });

    return unsubscribe;
  }, [persistence, onSaveStart, onSaveError, onConflict]);

  // Listen to successful saves
  useEffect(() => {
    const unsubscribe = persistence.onSave((filePath) => {
      onSaveComplete?.(filePath);
    });

    return unsubscribe;
  }, [persistence, onSaveComplete]);

  // Monitor book changes and trigger auto-save
  useEffect(() => {
    // Don't auto-save if disabled or no book data
    if (!isAutoSaveEnabled || !book) {
      return;
    }

    // Check if book has actually changed
    const bookChanged = previousBookRef.current !== null &&
                       JSON.stringify(previousBookRef.current) !== JSON.stringify(book);

    if (bookChanged) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Schedule auto-save
      autoSaveTimerRef.current = setTimeout(() => {
        const projectInfo = persistence.getProjectInfo();

        // Only auto-save if there's a file path (don't auto-save new unsaved projects)
        if (projectInfo.filePath) {
          persistence.updateProject(book);
        }
      }, debounceMs);
    }

    // Update previous book reference
    previousBookRef.current = book;

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [book, isAutoSaveEnabled, debounceMs, persistence]);

  const enableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(true);
    persistence.setAutoSaveEnabled(true);
  }, [persistence]);

  const disableAutoSave = useCallback(() => {
    setIsAutoSaveEnabled(false);
    persistence.setAutoSaveEnabled(false);

    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, [persistence]);

  const triggerSave = useCallback(async () => {
    if (!book) {
      return;
    }

    // Clear any pending auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    // Update and save immediately
    const currentProject = persistence.getCurrentProject();
    if (currentProject) {
      persistence.updateProject(book);
    } else {
      persistence.createProject(book);
    }

    await persistence.saveProject();
  }, [book, persistence]);

  const reloadFile = useCallback(async () => {
    const projectInfo = persistence.getProjectInfo();

    if (!projectInfo.filePath) {
      return false;
    }

    const result = await persistence.loadProject(projectInfo.filePath);
    return result.success;
  }, [persistence]);

  return {
    saveStatus,
    lastError,
    isAutoSaveEnabled,
    enableAutoSave,
    disableAutoSave,
    triggerSave,
    reloadFile,
  };
}

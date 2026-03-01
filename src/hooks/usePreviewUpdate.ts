import { useEffect, useRef, useCallback, useState } from 'react';

export type UpdateType = 'text-edit' | 'navigation';

interface PreviewUpdateOptions {
  /** Debounce delay for text edits in milliseconds (default: 400ms) */
  debounceDelay?: number;
  /** Whether to use requestIdleCallback for non-critical renders (default: true) */
  useIdleCallback?: boolean;
  /** Callback when preview starts updating */
  onUpdateStart?: () => void;
  /** Callback when preview finishes updating */
  onUpdateEnd?: () => void;
}

interface PreviewUpdateResult {
  /** Current content to be displayed in preview */
  previewContent: string;
  /** Whether preview is currently updating */
  isUpdating: boolean;
  /** Trigger a preview update */
  triggerUpdate: (content: string, type?: UpdateType) => void;
  /** Cancel any pending updates */
  cancelPendingUpdates: () => void;
}

/**
 * Hook to manage debounced preview panel updates.
 *
 * Features:
 * - Debounces text edit updates (300-500ms configurable)
 * - Immediate updates for navigation events
 * - Uses requestIdleCallback for non-critical renders
 * - Provides loading state indicator
 * - Cancellable pending updates (e.g., when switching chapters)
 *
 * @param options Configuration options for preview updates
 * @returns Preview update state and control functions
 */
export function usePreviewUpdate(
  options: PreviewUpdateOptions = {}
): PreviewUpdateResult {
  const {
    debounceDelay = 400,
    useIdleCallback = true,
    onUpdateStart,
    onUpdateEnd,
  } = options;

  const [previewContent, setPreviewContent] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Refs to track pending operations
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleCallbackIdRef = useRef<number | null>(null);
  const pendingContentRef = useRef<string | null>(null);

  /**
   * Cancel all pending update operations
   */
  const cancelPendingUpdates = useCallback(() => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Cancel idle callback
    if (idleCallbackIdRef.current !== null) {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleCallbackIdRef.current);
      }
      idleCallbackIdRef.current = null;
    }

    // Clear pending content
    pendingContentRef.current = null;

    // Reset updating state
    setIsUpdating(false);
    onUpdateEnd?.();
  }, [onUpdateEnd]);

  /**
   * Apply the preview update using requestIdleCallback or immediately
   */
  const applyUpdate = useCallback(
    (content: string, immediate: boolean = false) => {
      const performUpdate = () => {
        setPreviewContent(content);
        setIsUpdating(false);
        onUpdateEnd?.();
        pendingContentRef.current = null;
      };

      if (immediate || !useIdleCallback || typeof requestIdleCallback === 'undefined') {
        // Immediate update or requestIdleCallback not available
        performUpdate();
      } else {
        // Schedule update during idle time for better performance
        idleCallbackIdRef.current = requestIdleCallback(
          () => {
            performUpdate();
            idleCallbackIdRef.current = null;
          },
          { timeout: 1000 } // Fallback to ensure update happens within 1 second
        );
      }
    },
    [useIdleCallback, onUpdateEnd]
  );

  /**
   * Trigger a preview update with debouncing based on update type
   */
  const triggerUpdate = useCallback(
    (content: string, type: UpdateType = 'text-edit') => {
      // Cancel any existing pending updates
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (idleCallbackIdRef.current !== null && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleCallbackIdRef.current);
        idleCallbackIdRef.current = null;
      }

      // Store pending content
      pendingContentRef.current = content;

      // Set updating state
      if (!isUpdating) {
        setIsUpdating(true);
        onUpdateStart?.();
      }

      if (type === 'navigation') {
        // Immediate update for navigation events
        applyUpdate(content, true);
      } else {
        // Debounced update for text edits
        debounceTimerRef.current = setTimeout(() => {
          applyUpdate(content, false);
          debounceTimerRef.current = null;
        }, debounceDelay);
      }
    },
    [debounceDelay, applyUpdate, isUpdating, onUpdateStart]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingUpdates();
    };
  }, [cancelPendingUpdates]);

  return {
    previewContent,
    isUpdating,
    triggerUpdate,
    cancelPendingUpdates,
  };
}

/**
 * Mock implementation of usePreviewUpdate hook for testing
 */

export type UpdateType = 'text-edit' | 'navigation';

interface PreviewUpdateOptions {
  debounceDelay?: number;
  useIdleCallback?: boolean;
  onUpdateStart?: () => void;
  onUpdateEnd?: () => void;
}

interface PreviewUpdateResult {
  previewContent: string;
  isUpdating: boolean;
  triggerUpdate: (content: string, type?: UpdateType) => void;
  cancelPendingUpdates: () => void;
}

// Create a simple state container for testing
let mockPreviewContent = '<p>Initial mock content</p>';
let mockIsUpdating = false;
let mockTriggerUpdate: ((content: string, type?: UpdateType) => void) | null = null;

// Mock implementation that simulates the hook behavior
export function usePreviewUpdate(options: PreviewUpdateOptions = {}): PreviewUpdateResult {
  // Create the triggerUpdate function that updates the module state
  if (!mockTriggerUpdate) {
    mockTriggerUpdate = jest.fn((content: string, type?: UpdateType) => {
      // Immediately update content (no debounce in tests)
      mockPreviewContent = content;
      if (options.onUpdateEnd) {
        options.onUpdateEnd();
      }
    });
  }

  const cancelPendingUpdates = jest.fn();

  return {
    previewContent: mockPreviewContent,
    isUpdating: mockIsUpdating,
    triggerUpdate: mockTriggerUpdate,
    cancelPendingUpdates,
  };
}

// Helper to reset mock state between tests
export const __resetMockPreviewState = () => {
  mockPreviewContent = '<p>Initial mock content</p>';
  mockIsUpdating = false;
  mockTriggerUpdate = null;
};

// Helper to set mock state for testing
export const __setMockPreviewState = (content: string, isUpdating: boolean = false) => {
  mockPreviewContent = content;
  mockIsUpdating = isUpdating;
};

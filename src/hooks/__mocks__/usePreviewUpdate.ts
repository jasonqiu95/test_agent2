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

<<<<<<< HEAD
let mockPreviewContent = '<p>Test preview content</p>';
let mockIsUpdating = false;

export function usePreviewUpdate(
  options: PreviewUpdateOptions = {}
): PreviewUpdateResult {
  const triggerUpdate = jest.fn((content: string, type?: UpdateType) => {
    mockPreviewContent = content;
    if (options.onUpdateStart) {
      options.onUpdateStart();
    }
    // Simulate async update
    setTimeout(() => {
      if (options.onUpdateEnd) {
        options.onUpdateEnd();
      }
    }, 0);
  });
=======
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
>>>>>>> agent/test-preview-content-rendering

  const cancelPendingUpdates = jest.fn();

  return {
    previewContent: mockPreviewContent,
    isUpdating: mockIsUpdating,
<<<<<<< HEAD
    triggerUpdate,
=======
    triggerUpdate: mockTriggerUpdate,
>>>>>>> agent/test-preview-content-rendering
    cancelPendingUpdates,
  };
}

// Helper to reset mock state between tests
<<<<<<< HEAD
export function __resetMockPreviewContent(content: string = '<p>Test preview content</p>') {
  mockPreviewContent = content;
  mockIsUpdating = false;
}
=======
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
>>>>>>> agent/test-preview-content-rendering

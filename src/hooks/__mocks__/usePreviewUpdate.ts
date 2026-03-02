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

  const cancelPendingUpdates = jest.fn();

  return {
    previewContent: mockPreviewContent,
    isUpdating: mockIsUpdating,
    triggerUpdate,
    cancelPendingUpdates,
  };
}

// Helper to reset mock state between tests
export function __resetMockPreviewContent(content: string = '<p>Test preview content</p>') {
  mockPreviewContent = content;
  mockIsUpdating = false;
}

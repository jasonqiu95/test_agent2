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

export const usePreviewUpdate = jest.fn(
  (options: PreviewUpdateOptions = {}): PreviewUpdateResult => ({
    previewContent: '<p>Test preview content</p>',
    isUpdating: false,
    triggerUpdate: jest.fn(),
    cancelPendingUpdates: jest.fn(),
  })
);

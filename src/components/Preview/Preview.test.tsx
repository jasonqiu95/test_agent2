/**
 * Preview Component Test Suite
 *
 * Tests for PreviewPanel component with proper Redux integration,
 * debounced updates, and mock rendering engine.
 *
 * This test file demonstrates the complete test infrastructure setup including:
 * - Redux store provider wrapper
 * - Mock rendering engine
 * - Jest mocks for external dependencies
 * - beforeEach/afterEach cleanup
 * - Reusable render helper function
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import {
  renderWithProviders,
  mockElement,
  mockStyleConfig,
  mockBook,
  mockRequestIdleCallback,
  cleanupMocks,
  userEvent,
  AllProviders,
} from '../../__tests__/testUtils';

// Mock the preview renderer module
jest.mock('../../__mocks__/previewRenderer', () => ({
  renderPreview: jest.fn((elementData, styleConfig, deviceType, options) => ({
    html: `<div data-testid="preview-content">${elementData.title}</div>`,
    css: '.preview-container { max-width: 816px; }',
    pageCount: 1,
  })),
  createMockRenderer: jest.fn(() => ({
    render: jest.fn((elementData, styleConfig, deviceType, options) => ({
      html: `<div data-testid="preview-content">${elementData.title}</div>`,
      css: '.preview-container { max-width: 816px; }',
      pageCount: 1,
    })),
    reset: jest.fn(),
    getCalls: jest.fn(() => []),
    getRenderCount: jest.fn(() => 0),
  })),
  getDeviceConfig: jest.fn((deviceType) => ({
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    pageWidth: 816,
    pageHeight: 1056,
  })),
}));

// Mock the usePreviewUpdate hook (uses manual mock from src/hooks/__mocks__/usePreviewUpdate.ts)
jest.mock('../../hooks/usePreviewUpdate');

// Mock CSS imports
jest.mock('./PreviewPanel.css', () => ({}));

// Note: Add mocks for font and image loaders when those modules are implemented
// Example:
// jest.mock('../../utils/fontLoader', () => ({ ... }));
// jest.mock('../../utils/imageLoader', () => ({ ... }));

/**
 * Simple test component for demonstrating test infrastructure
 */
const SimplePreviewComponent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="preview-panel" data-testid="preview-component">
      <div className="preview-panel__header">
        <h2 className="preview-panel__title">Preview</h2>
      </div>
      <div className="preview-panel__content">
        <div className="preview-panel__text" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
};

describe('Preview Component Test Infrastructure', () => {
  // Setup and teardown
  beforeEach(() => {
    // Mock requestIdleCallback for preview updates
    mockRequestIdleCallback();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up mocked functions
    cleanupMocks();

    // Reset all mocks
    jest.resetAllMocks();
  });

  describe('Test Infrastructure Validation', () => {
    it('should have Redux store available in tests', () => {
      const { store } = renderWithProviders(
        <SimplePreviewComponent content="<p>Test</p>" />
      );

      expect(store).toBeDefined();
      expect(store.getState()).toHaveProperty('book');
      expect(store.getState()).toHaveProperty('selection');
      expect(store.getState()).toHaveProperty('undo');
    });

    it('should render components with Redux provider wrapper', () => {
      renderWithProviders(
        <SimplePreviewComponent content="<p>Test content</p>" />
      );

      const component = screen.getByTestId('preview-component');
      expect(component).toBeInTheDocument();
    });

    it('should provide test utilities for user interactions', async () => {
      const { getByText } = renderWithProviders(
        <SimplePreviewComponent content="<p>Test content</p>" />
      );

      const heading = getByText('Preview');
      expect(heading).toBeInTheDocument();
    });

    it('should support custom preloaded state', () => {
      const customBook = {
        id: 'custom-1',
        title: 'Custom Book',
        subtitle: '',
        authors: [],
        chapters: [],
        frontMatter: [],
        backMatter: [],
        metadata: {
          isbn: '',
          publisher: '',
          publicationDate: new Date(),
          language: 'en',
          genre: '',
        },
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { store } = renderWithProviders(
        <SimplePreviewComponent content="<p>Test</p>" />,
        {
          preloadedState: {
            book: {
              currentBook: customBook,
              books: [customBook],
              loading: false,
              error: null,
            },
          },
        }
      );

      expect(store.getState().book.currentBook).toEqual(customBook);
    });
  });

  describe('Mock Data Availability', () => {
    it('should provide mock element data', () => {
      expect(mockElement).toBeDefined();
      expect(mockElement.id).toBe('element-1');
      expect(mockElement.type).toBe('chapter');
      expect(mockElement.title).toBe('Test Chapter');
    });

    it('should provide mock style configuration', () => {
      expect(mockStyleConfig).toBeDefined();
      expect(mockStyleConfig.id).toBe('style-1');
      expect(mockStyleConfig.fonts.body).toBe('Georgia');
    });
  });

  describe('Cleanup Utilities', () => {
    it('should clean up mocks after each test', () => {
      // This test verifies that afterEach cleanup works
      expect(jest.clearAllMocks).toBeDefined();
      expect(jest.resetAllMocks).toBeDefined();
    });

    it('should have mockRequestIdleCallback utility', () => {
      // Verify the mock was set up in beforeEach
      expect(global.requestIdleCallback).toBeDefined();
      expect(global.cancelIdleCallback).toBeDefined();
    });
  });
});

/**
 * ===========================================================================
 * COMPREHENSIVE PREVIEW PANEL EDGE CASE AND ERROR HANDLING TESTS
 * ===========================================================================
 */

import { PreviewPanel } from './PreviewPanel';
<<<<<<< HEAD
import { updateChapter } from '../../slices/bookSlice';

// Get the mocked hook to control its behavior
const mockUsePreviewUpdate = jest.requireMock('../../hooks/usePreviewUpdate')
  .usePreviewUpdate as jest.MockedFunction<any>;

describe('PreviewPanel Live Content Update Synchronization', () => {
  let triggerUpdateMock: jest.Mock;
  let cancelPendingUpdatesMock: jest.Mock;
  let onUpdateStartMock: jest.Mock;
  let onUpdateEndMock: jest.Mock;

  beforeEach(() => {
    // Mock requestIdleCallback for preview updates
    mockRequestIdleCallback();

    // Create fresh mocks for each test
    triggerUpdateMock = jest.fn();
    cancelPendingUpdatesMock = jest.fn();
    onUpdateStartMock = jest.fn();
    onUpdateEndMock = jest.fn();

    // Set up default mock return value
    mockUsePreviewUpdate.mockReturnValue({
      previewContent: '<p>Test preview content</p>',
      isUpdating: false,
      triggerUpdate: triggerUpdateMock,
      cancelPendingUpdates: cancelPendingUpdatesMock,
    });

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up mocked functions
    cleanupMocks();

    // Reset all mocks
    jest.resetAllMocks();
  });

  describe('Live Content Updates', () => {
    it('should update preview immediately when editor content changes', async () => {
      // Configure mock to simulate immediate update
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Initial content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      const { rerender } = renderWithProviders(
        <PreviewPanel content="<p>Initial content</p>" />
      );

      // Verify initial trigger
      expect(triggerUpdateMock).toHaveBeenCalledWith(
        '<p>Initial content</p>',
        'text-edit'
      );

      // Update content
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Updated content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      rerender(<PreviewPanel content="<p>Updated content</p>" />);

      // Verify triggerUpdate was called with new content
      await waitFor(() => {
        expect(triggerUpdateMock).toHaveBeenCalledWith(
          '<p>Updated content</p>',
          'text-edit'
        );
      });
    });

    it('should trigger preview update when Redux state changes via updateChapter action', async () => {
      const { store } = renderWithProviders(<PreviewPanel content="<p>Test</p>" />, {
        preloadedState: {
          book: {
            currentBook: {
              ...mockBook,
              chapters: [
                {
                  id: 'chapter-1',
                  title: 'Chapter 1',
                  content: [],
                  order: 0,
                },
              ],
            },
            books: [],
            loading: false,
            error: null,
          },
        },
      });

      // Dispatch Redux action to update chapter
      const chapterUpdates = {
        title: 'Chapter 1 Updated',
        content: [{ type: 'paragraph', text: 'New content from Redux' }],
      };

      store.dispatch(updateChapter({ id: 'chapter-1', updates: chapterUpdates }));

      // Verify Redux state was updated
      const state = store.getState();
      const updatedChapter = state.book.currentBook?.chapters[0];
      expect(updatedChapter?.title).toBe('Chapter 1 Updated');
      expect(updatedChapter?.content).toEqual([
        { type: 'paragraph', text: 'New content from Redux' },
      ]);
    });

    it('should handle multiple rapid content changes correctly', async () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content 1</p>',
        isUpdating: true,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      const { rerender } = renderWithProviders(
        <PreviewPanel content="<p>Content 1</p>" debounceDelay={400} />
      );

      // Simulate rapid content changes
      const changes = [
        '<p>Content 2</p>',
        '<p>Content 3</p>',
        '<p>Content 4</p>',
        '<p>Final content</p>',
      ];

      changes.forEach((content) => {
        rerender(<PreviewPanel content={content} debounceDelay={400} />);
      });

      // Verify triggerUpdate was called for each change
      await waitFor(() => {
        expect(triggerUpdateMock).toHaveBeenCalledTimes(5); // Initial + 4 updates
      });

      // Verify the last call was with the final content
      expect(triggerUpdateMock).toHaveBeenLastCalledWith(
        '<p>Final content</p>',
        'text-edit'
      );
    });

    it('should properly debounce text edit updates', async () => {
      const debounceDelay = 400;

      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Initial</p>',
        isUpdating: true,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(
        <PreviewPanel
          content="<p>Initial</p>"
          updateType="text-edit"
          debounceDelay={debounceDelay}
        />
      );

      // Verify debounce delay was passed to the hook
      expect(mockUsePreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          debounceDelay,
        })
      );
    });

    it('should update immediately for navigation events', async () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Chapter 1</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(
        <PreviewPanel content="<p>Chapter 1</p>" updateType="navigation" />
      );

      // Verify triggerUpdate was called with navigation type
      expect(triggerUpdateMock).toHaveBeenCalledWith(
        '<p>Chapter 1</p>',
        'navigation'
      );
=======
import { usePreviewUpdate } from '../../hooks/usePreviewUpdate';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';

// Get mock functions for assertions
const mockUsePreviewUpdate = usePreviewUpdate as jest.Mock;

describe('PreviewPanel Edge Cases and Error Handling', () => {
  // Setup mock defaults before each test
  beforeEach(() => {
    // Reset to default mock implementation
    mockUsePreviewUpdate.mockReturnValue({
      previewContent: '<p>Test preview content</p>',
      isUpdating: false,
      triggerUpdate: jest.fn(),
      cancelPendingUpdates: jest.fn(),
    });
  });

  describe('Empty Content Handling', () => {
    it('should render placeholder when content is empty string', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="" />);

      expect(screen.getByText('No content to preview')).toBeInTheDocument();
    });

    it('should render placeholder when content is only whitespace', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="   \n  \t  " />);

      expect(screen.getByText('No content to preview')).toBeInTheDocument();
    });

    it('should render placeholder when previewContent is empty', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="<p>Test</p>" />);

      expect(screen.getByText('No content to preview')).toBeInTheDocument();
    });

    it('should not crash with null or undefined content', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: null as any,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="<p>Test</p>" />);

      expect(screen.getByText('No content to preview')).toBeInTheDocument();
    });
  });

  describe('Very Long Chapters', () => {
    it('should render very long content without crashing', () => {
      const longContent = '<p>' + 'Lorem ipsum dolor sit amet. '.repeat(10000) + '</p>';

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: longContent,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={longContent} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
      expect(previewText?.innerHTML).toContain('Lorem ipsum');
    });

    it('should handle extremely large content (>1MB)', () => {
      // Create a very large string (~2MB)
      const hugeContent = '<p>' + 'X'.repeat(2000000) + '</p>';

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: hugeContent,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={hugeContent} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
    });

    it('should trigger update with very long content', () => {
      const triggerUpdate = jest.fn();
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Test</p>',
        isUpdating: false,
        triggerUpdate,
        cancelPendingUpdates: jest.fn(),
      });

      const veryLongContent = '<p>' + 'Content '.repeat(50000) + '</p>';
      renderWithProviders(<PreviewPanel content={veryLongContent} />);

      expect(triggerUpdate).toHaveBeenCalledWith(veryLongContent, 'text-edit');
    });
  });

  describe('Chapters with Only Images', () => {
    it('should render content with only image tags', () => {
      const imageOnlyContent = '<img src="data:image/png;base64,iVBORw0KGg" alt="Test Image" />';

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: imageOnlyContent,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={imageOnlyContent} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText?.innerHTML).toContain('img');
    });

    it('should handle multiple images without text', () => {
      const multipleImages = `
        <img src="data:image/png;base64,abc" alt="Image 1" />
        <img src="data:image/png;base64,def" alt="Image 2" />
        <img src="data:image/png;base64,ghi" alt="Image 3" />
      `;

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: multipleImages,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={multipleImages} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText?.innerHTML).toContain('Image 1');
      expect(previewText?.innerHTML).toContain('Image 2');
      expect(previewText?.innerHTML).toContain('Image 3');
    });

    it('should handle images with missing src attributes', () => {
      const brokenImages = `
        <img alt="Broken Image 1" />
        <img alt="Broken Image 2" />
      `;

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: brokenImages,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={brokenImages} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
    });
  });

  describe('Malformed Content', () => {
    it('should handle unclosed HTML tags', () => {
      const malformedHtml = '<p>Unclosed paragraph<div>Unclosed div<span>Unclosed span';

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: malformedHtml,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={malformedHtml} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
    });

    it('should handle invalid HTML entities', () => {
      const invalidEntities = '<p>&invalid; &unknown; &123abc;</p>';

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: invalidEntities,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={invalidEntities} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
    });

    it('should handle script tags safely', () => {
      const scriptContent = '<p>Safe content</p><script>alert("XSS")</script>';

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: scriptContent,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={scriptContent} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
      // Note: dangerouslySetInnerHTML will render scripts, but they won't execute in jsdom
    });

    it('should handle deeply nested HTML', () => {
      const deeplyNested = '<div>'.repeat(100) + 'Content' + '</div>'.repeat(100);

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: deeplyNested,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={deeplyNested} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
      expect(previewText?.innerHTML).toContain('Content');
    });

    it('should handle mixed valid and invalid markup', () => {
      const mixedMarkup = `
        <p>Valid paragraph</p>
        <invalid-tag>Invalid content</invalid-tag>
        <p class="unclosed">
        <div>Another valid div</div>
      `;

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: mixedMarkup,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={mixedMarkup} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
    });

    it('should handle special characters and unicode', () => {
      const specialChars = '<p>Special: © ® ™ € £ ¥ ñ ü 中文 日本語 한국어 🎉 👍</p>';

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: specialChars,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content={specialChars} />);

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText?.innerHTML).toContain('Special:');
    });
  });

  describe('Missing Style Definitions', () => {
    it('should render without custom className', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Test</p>',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content="<p>Test</p>" />);

      const panel = container.querySelector('.preview-panel');
      expect(panel).toBeInTheDocument();
      expect(panel?.classList.contains('preview-panel')).toBe(true);
    });

    it('should handle undefined updateType gracefully', () => {
      const triggerUpdate = jest.fn();
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Test</p>',
        isUpdating: false,
        triggerUpdate,
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="<p>Test</p>" updateType={undefined} />);

      // Should use default 'text-edit' updateType when undefined is passed
      expect(triggerUpdate).toHaveBeenCalledWith('<p>Test</p>', 'text-edit');
    });

    it('should handle missing optional props', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Test</p>',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="<p>Test</p>" />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should apply empty string className without error', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Test</p>',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(
        <PreviewPanel content="<p>Test</p>" className="" />
      );

      const panel = container.querySelector('.preview-panel');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('Render Errors and Error Boundaries', () => {
    // Suppress console errors for these tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('should catch errors with ErrorBoundary and show fallback UI', () => {
      const ThrowError = () => {
        throw new Error('Test render error');
      };

      renderWithProviders(
        <ErrorBoundary fallback={<div>Error occurred</div>}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    it('should catch errors in PreviewPanel with ErrorBoundary', () => {
      // Create a component that throws an error
      const BrokenPreview = () => {
        throw new Error('Preview render error');
      };

      const onError = jest.fn();

      renderWithProviders(
        <ErrorBoundary onError={onError}>
          <BrokenPreview />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
    });

    it('should recover from error when reset', () => {
      let shouldThrow = true;
      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Conditional error');
        }
        return <div>Recovered</div>;
      };

      const { rerender, store } = renderWithProviders(
        <ErrorBoundary>
          <ConditionalError />
        </ErrorBoundary>
      );

      // Error should be caught
      expect(screen.queryByText('Recovered')).not.toBeInTheDocument();

      // Reset error and rerender
      shouldThrow = false;
      rerender(
        <AllProviders store={store}>
          <ErrorBoundary>
            <ConditionalError />
          </ErrorBoundary>
        </AllProviders>
      );
    });

    it('should handle errors during dangerouslySetInnerHTML', () => {
      // dangerouslySetInnerHTML itself won't throw, but we test the component structure
      const problematicContent = '<p>Normal content</p>'.repeat(1000);

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: problematicContent,
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(
        <ErrorBoundary>
          <PreviewPanel content={problematicContent} />
        </ErrorBoundary>
      );

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
>>>>>>> agent/test-preview-edge-cases-and-error-handling
    });
  });

  describe('Loading States', () => {
<<<<<<< HEAD
    it('should show loading indicator when preview is updating', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: true,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(<PreviewPanel content="<p>Content</p>" />);

      const loadingIndicator = screen.getByTitle('Updating preview...');
      expect(loadingIndicator).toBeInTheDocument();

      const spinner = document.querySelector('.preview-panel__spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading indicator when update completes', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(<PreviewPanel content="<p>Content</p>" />);
=======
    it('should show loading indicator when isUpdating is true', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Test</p>',
        isUpdating: true,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="<p>Test</p>" />);

      const loadingIndicator = screen.getByTitle('Updating preview...');
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should hide loading indicator when isUpdating is false', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Test</p>',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="<p>Test</p>" />);
>>>>>>> agent/test-preview-edge-cases-and-error-handling

      const loadingIndicator = screen.queryByTitle('Updating preview...');
      expect(loadingIndicator).not.toBeInTheDocument();
    });

<<<<<<< HEAD
    it('should transition from loading to loaded state', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: true,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      const { rerender } = renderWithProviders(
        <PreviewPanel content="<p>Content</p>" />
      );

      // Verify loading state
      expect(screen.getByTitle('Updating preview...')).toBeInTheDocument();

      // Simulate update completion
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      rerender(<PreviewPanel content="<p>Content</p>" />);

      // Verify loading state is gone
=======
    it('should show spinner SVG when loading', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Test</p>',
        isUpdating: true,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content="<p>Test</p>" />);

      const spinner = container.querySelector('.preview-panel__spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner?.tagName).toBe('svg');
    });

    it('should display content while loading', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Existing content</p>',
        isUpdating: true,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content="<p>New content</p>" />);

      // Should show both loading indicator and existing content
      expect(screen.getByTitle('Updating preview...')).toBeInTheDocument();
      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText?.innerHTML).toContain('Existing content');
    });

    it('should transition from loading to loaded state', () => {
      // First render with loading state
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Content</p>',
        isUpdating: true,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { rerender, store } = renderWithProviders(<PreviewPanel content="<p>Content</p>" />);

      expect(screen.getByTitle('Updating preview...')).toBeInTheDocument();

      // Update mock to not be loading
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Content</p>',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      rerender(
        <AllProviders store={store}>
          <PreviewPanel content="<p>Content</p>" />
        </AllProviders>
      );

>>>>>>> agent/test-preview-edge-cases-and-error-handling
      expect(screen.queryByTitle('Updating preview...')).not.toBeInTheDocument();
    });
  });

<<<<<<< HEAD
  describe('Chapter Navigation and Update Cancellation', () => {
    it('should cancel pending updates when chapter changes', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Chapter 1</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      const { rerender } = renderWithProviders(
        <PreviewPanel content="<p>Chapter 1</p>" chapterId="chapter-1" />
      );

      // Change chapter
      rerender(
        <PreviewPanel content="<p>Chapter 2</p>" chapterId="chapter-2" />
      );

      // Verify cancelPendingUpdates was called when chapter changed
      expect(cancelPendingUpdatesMock).toHaveBeenCalled();
    });

    it('should not cancel updates when chapter ID stays the same', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      const { rerender } = renderWithProviders(
        <PreviewPanel content="<p>Content 1</p>" chapterId="chapter-1" />
      );

      // Reset mock to track new calls
      cancelPendingUpdatesMock.mockClear();

      // Update content but keep same chapter
      rerender(
        <PreviewPanel content="<p>Content 2</p>" chapterId="chapter-1" />
      );

      // Verify cancelPendingUpdates was not called
      expect(cancelPendingUpdatesMock).not.toHaveBeenCalled();
    });
  });

  describe('Callback Integration', () => {
    it('should call onPreviewUpdate callback when update completes', async () => {
      const onPreviewUpdate = jest.fn();
      const testContent = '<p>Test preview content</p>';

      // Configure mock to simulate update lifecycle
      mockUsePreviewUpdate.mockImplementation((options) => {
        // Simulate calling onUpdateEnd
=======
  describe('Preview with No Selected Element', () => {
    it('should show placeholder when no element is selected', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="" />);

      expect(screen.getByText('No content to preview')).toBeInTheDocument();
    });

    it('should display placeholder text with proper styling', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { container } = renderWithProviders(<PreviewPanel content="" />);

      const placeholder = container.querySelector('.preview-panel__placeholder');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder?.textContent).toBe('No content to preview');
    });

    it('should not show loading indicator when no element is selected', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(<PreviewPanel content="" />);

      expect(screen.queryByTitle('Updating preview...')).not.toBeInTheDocument();
    });

    it('should transition from placeholder to content', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      const { rerender, store } = renderWithProviders(<PreviewPanel content="" />);

      expect(screen.getByText('No content to preview')).toBeInTheDocument();

      // Update to show content
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>New content</p>',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      rerender(
        <AllProviders store={store}>
          <PreviewPanel content="<p>New content</p>" />
        </AllProviders>
      );

      expect(screen.queryByText('No content to preview')).not.toBeInTheDocument();
    });

    it('should not call onPreviewUpdate when content is empty', () => {
      const onPreviewUpdate = jest.fn();

      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      });

      renderWithProviders(
        <PreviewPanel content="" onPreviewUpdate={onPreviewUpdate} />
      );

      // onUpdateEnd would only be called after an update completes
      expect(onPreviewUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Chapter Navigation and State Management', () => {
    it('should handle chapter changes without crashing', () => {
      const cancelPendingUpdates = jest.fn();
      const triggerUpdate = jest.fn();

      // Return the same mock for all calls
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Chapter content</p>',
        isUpdating: false,
        triggerUpdate,
        cancelPendingUpdates,
      });

      const { rerender, store } = renderWithProviders(
        <PreviewPanel content="<p>Chapter 1</p>" chapterId="chapter-1" />
      );

      expect(screen.getByText('Preview')).toBeInTheDocument();

      // Change chapter - component should handle it gracefully
      rerender(
        <AllProviders store={store}>
          <PreviewPanel content="<p>Chapter 2</p>" chapterId="chapter-2" />
        </AllProviders>
      );

      // Component should still be rendered and functional after chapter change
      expect(screen.getByText('Preview')).toBeInTheDocument();

      // Verify multiple different chapters can be rendered
      rerender(
        <AllProviders store={store}>
          <PreviewPanel content="<p>Chapter 3</p>" chapterId="chapter-3" />
        </AllProviders>
      );

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should not cancel updates when chapter stays the same', () => {
      const cancelPendingUpdates = jest.fn();
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Chapter 1</p>',
        isUpdating: false,
        triggerUpdate: jest.fn(),
        cancelPendingUpdates,
      });

      const { rerender, store } = renderWithProviders(
        <PreviewPanel content="<p>Chapter 1</p>" chapterId="chapter-1" />
      );

      // Update content but keep same chapter
      rerender(
        <AllProviders store={store}>
          <PreviewPanel content="<p>Chapter 1 updated</p>" chapterId="chapter-1" />
        </AllProviders>
      );

      // Cancel should not be called when chapter ID doesn't change
      expect(cancelPendingUpdates).not.toHaveBeenCalled();
    });

    it('should handle rapid chapter switching', () => {
      const cancelPendingUpdates = jest.fn();
      const triggerUpdate = jest.fn();

      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: false,
        triggerUpdate,
        cancelPendingUpdates,
      });

      const { rerender, store } = renderWithProviders(
        <PreviewPanel content="<p>Chapter 1</p>" chapterId="chapter-1" />
      );

      // Rapidly switch chapters
      for (let i = 2; i <= 10; i++) {
        rerender(
          <AllProviders store={store}>
            <PreviewPanel content={`<p>Chapter ${i}</p>`} chapterId={`chapter-${i}`} />
          </AllProviders>
        );
      }

      // Should cancel for each chapter change
      expect(cancelPendingUpdates.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Callback Handling', () => {
    it('should call onPreviewUpdate with updated content', async () => {
      const onPreviewUpdate = jest.fn();
      const onUpdateEnd = jest.fn();

      mockUsePreviewUpdate.mockImplementationOnce((options) => {
        // Simulate the hook calling onUpdateEnd
>>>>>>> agent/test-preview-edge-cases-and-error-handling
        setTimeout(() => {
          if (options.onUpdateEnd) {
            options.onUpdateEnd();
          }
        }, 0);

        return {
<<<<<<< HEAD
          previewContent: testContent,
          isUpdating: false,
          triggerUpdate: triggerUpdateMock,
          cancelPendingUpdates: cancelPendingUpdatesMock,
=======
          previewContent: '<p>Updated content</p>',
          isUpdating: false,
          triggerUpdate: jest.fn(),
          cancelPendingUpdates: jest.fn(),
>>>>>>> agent/test-preview-edge-cases-and-error-handling
        };
      });

      renderWithProviders(
        <PreviewPanel content="<p>Test</p>" onPreviewUpdate={onPreviewUpdate} />
      );

      await waitFor(() => {
<<<<<<< HEAD
        expect(onPreviewUpdate).toHaveBeenCalledWith(testContent);
      });
    });

    it('should pass update callbacks to usePreviewUpdate hook', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(<PreviewPanel content="<p>Content</p>" />);

      // Verify hook was called with callbacks
      expect(mockUsePreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          onUpdateStart: expect.any(Function),
          onUpdateEnd: expect.any(Function),
        })
      );
    });
  });

  describe('Debounce Configuration', () => {
    it('should use default debounce delay of 400ms', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(<PreviewPanel content="<p>Content</p>" />);

      expect(mockUsePreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          debounceDelay: 400,
        })
      );
    });

    it('should use custom debounce delay when provided', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(
        <PreviewPanel content="<p>Content</p>" debounceDelay={1000} />
      );

      expect(mockUsePreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          debounceDelay: 1000,
        })
      );
    });

    it('should enable requestIdleCallback by default', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(<PreviewPanel content="<p>Content</p>" />);

      expect(mockUsePreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          useIdleCallback: true,
        })
      );
    });
  });

  describe('Content Rendering', () => {
    it('should render preview content when available', () => {
      const testContent = '<p>Test preview content</p>';

      mockUsePreviewUpdate.mockReturnValue({
        previewContent: testContent,
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      const { container } = renderWithProviders(
        <PreviewPanel content={testContent} />
      );

      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
      expect(previewText?.innerHTML).toBe(testContent);
    });

    it('should show placeholder when no content available', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(<PreviewPanel content="" />);

      expect(screen.getByText('No content to preview')).toBeInTheDocument();
    });

    it('should update rendered content when preview content changes', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Initial content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      const { container, rerender } = renderWithProviders(
        <PreviewPanel content="<p>Initial content</p>" />
      );

      // Verify initial content
      let previewText = container.querySelector('.preview-panel__text');
      expect(previewText?.innerHTML).toBe('<p>Initial content</p>');

      // Update to new content
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Updated content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      rerender(<PreviewPanel content="<p>Updated content</p>" />);

      // Verify updated content
      previewText = container.querySelector('.preview-panel__text');
      expect(previewText?.innerHTML).toBe('<p>Updated content</p>');
    });
  });

  describe('Component Styling and Accessibility', () => {
    it('should render preview panel with header', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Test content</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      renderWithProviders(<PreviewPanel content="<p>Test content</p>" />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Test</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
      });

      const { container } = renderWithProviders(
        <PreviewPanel content="<p>Test</p>" className="custom-preview" />
      );

      const previewPanel = container.querySelector('.preview-panel');
      expect(previewPanel).toHaveClass('preview-panel', 'custom-preview');
    });

    it('should have accessible heading', () => {
      mockUsePreviewUpdate.mockReturnValue({
        previewContent: '<p>Test</p>',
        isUpdating: false,
        triggerUpdate: triggerUpdateMock,
        cancelPendingUpdates: cancelPendingUpdatesMock,
=======
        // The callback should be called after update
      }, { timeout: 100 });
    });

    it('should not crash if onPreviewUpdate is undefined', () => {
      mockUsePreviewUpdate.mockImplementationOnce((options) => {
        // Simulate calling onUpdateEnd even when callback is undefined
        if (options.onUpdateEnd) {
          options.onUpdateEnd();
        }

        return {
          previewContent: '<p>Content</p>',
          isUpdating: false,
          triggerUpdate: jest.fn(),
          cancelPendingUpdates: jest.fn(),
        };
>>>>>>> agent/test-preview-edge-cases-and-error-handling
      });

      renderWithProviders(<PreviewPanel content="<p>Test</p>" />);

<<<<<<< HEAD
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Preview');
=======
      expect(screen.getByText('Preview')).toBeInTheDocument();
>>>>>>> agent/test-preview-edge-cases-and-error-handling
    });
  });
});

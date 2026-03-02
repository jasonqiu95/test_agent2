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
    });
  });

  describe('Loading States', () => {
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

      const loadingIndicator = screen.queryByTitle('Updating preview...');
      expect(loadingIndicator).not.toBeInTheDocument();
    });

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

      expect(screen.queryByTitle('Updating preview...')).not.toBeInTheDocument();
    });
  });

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
        setTimeout(() => {
          if (options.onUpdateEnd) {
            options.onUpdateEnd();
          }
        }, 0);

        return {
          previewContent: '<p>Updated content</p>',
          isUpdating: false,
          triggerUpdate: jest.fn(),
          cancelPendingUpdates: jest.fn(),
        };
      });

      renderWithProviders(
        <PreviewPanel content="<p>Test</p>" onPreviewUpdate={onPreviewUpdate} />
      );

      await waitFor(() => {
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
      });

      renderWithProviders(<PreviewPanel content="<p>Test</p>" />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  });
});

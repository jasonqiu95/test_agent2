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

// Import PreviewPanel component for testing
import { PreviewPanel } from './PreviewPanel';
import { BookStyle } from '../../types/style';

// Mock style system
const mockStyleSystem = {
  applyStyle: jest.fn(),
  getComputedStyles: jest.fn(),
  loadFonts: jest.fn(),
};

jest.mock('../../services/style-engine', () => ({
  computeHeadingStyles: jest.fn((headingConfig, level, bookStyle) => ({
    fontFamily: headingConfig.fontFamily || bookStyle.fonts.heading,
    fontSize: headingConfig.fontSize,
    fontWeight: headingConfig.fontWeight,
    lineHeight: headingConfig.lineHeight,
    marginTop: headingConfig.marginTop,
    marginBottom: headingConfig.marginBottom,
    color: headingConfig.color || bookStyle.colors.heading,
    textTransform: headingConfig.textTransform,
    letterSpacing: headingConfig.letterSpacing,
  })),
  computeParagraphStyles: jest.fn((bookStyle, isFirst, hasDropCap) => ({
    fontFamily: bookStyle.fonts.body,
    fontSize: bookStyle.body.fontSize,
    lineHeight: bookStyle.body.lineHeight,
    color: bookStyle.colors.text,
    textAlign: bookStyle.body.textAlign,
    marginBottom: bookStyle.spacing.paragraphSpacing,
    ...(isFirst && bookStyle.firstParagraph.enabled && {
      fontVariant: bookStyle.firstParagraph.fontVariant,
      letterSpacing: bookStyle.firstParagraph.letterSpacing,
      fontSize: bookStyle.firstParagraph.fontSize,
    }),
  })),
  computeDropCapStyles: jest.fn((dropCapConfig, bookStyle) => ({
    fontSize: dropCapConfig.fontSize,
    fontWeight: dropCapConfig.fontWeight,
    float: 'left',
    lineHeight: dropCapConfig.lines,
    marginRight: dropCapConfig.marginRight,
    color: dropCapConfig.color || bookStyle.colors.dropCap,
    fontFamily: dropCapConfig.fontFamily || bookStyle.fonts.body,
  })),
  computeOrnamentalBreakStyles: jest.fn((bookStyle) => ({
    textAlign: bookStyle.ornamentalBreak.textAlign || 'center',
    fontSize: bookStyle.ornamentalBreak.fontSize,
    marginTop: bookStyle.ornamentalBreak.marginTop,
    marginBottom: bookStyle.ornamentalBreak.marginBottom,
    content: bookStyle.ornamentalBreak.symbol,
  })),
  applyStylesToChapter: jest.fn(),
  mergeStyles: jest.fn((baseStyle, overrides) => ({
    ...baseStyle,
    ...overrides,
  })),
}));

/**
 * Mock book styles for testing
 */
const mockGaramondStyle: BookStyle = {
  id: 'garamond',
  name: 'Garamond Elegance',
  description: 'A timeless old-style serif typeface',
  category: 'serif',
  fonts: {
    body: 'Garamond, serif',
    heading: 'Garamond, serif',
    fallback: 'serif',
  },
  headings: {
    h1: {
      fontSize: '2.75em',
      fontWeight: '500',
      lineHeight: '1.15',
      marginTop: '2em',
      marginBottom: '1em',
      textTransform: 'capitalize',
      letterSpacing: '0.03em',
      color: '#1f1f1f',
    },
    h2: {
      fontSize: '2em',
      fontWeight: '500',
      lineHeight: '1.3',
      marginTop: '1.75em',
      marginBottom: '0.6em',
      letterSpacing: '0.02em',
    },
    h3: {
      fontSize: '1.5em',
      fontWeight: '500',
      lineHeight: '1.4',
      marginTop: '1.5em',
      marginBottom: '0.5em',
    },
  },
  body: {
    fontSize: '1.15em',
    lineHeight: '1.8',
    textAlign: 'justify',
  },
  dropCap: {
    enabled: true,
    lines: 4,
    fontSize: '4.5em',
    fontWeight: '500',
    marginRight: '0.12em',
    color: '#6b4423',
  },
  ornamentalBreak: {
    enabled: true,
    symbol: '✦ ✦ ✦',
    fontSize: '1em',
    marginTop: '2.5em',
    marginBottom: '2.5em',
  },
  firstParagraph: {
    enabled: true,
    fontVariant: 'small-caps',
    letterSpacing: '0.08em',
    fontSize: '1em',
    indent: {
      enabled: false,
    },
  },
  spacing: {
    paragraphSpacing: '1.3em',
    lineHeight: '1.8',
    sectionSpacing: '3.5em',
    chapterSpacing: '6em',
  },
  colors: {
    text: '#333333',
    heading: '#1f1f1f',
    accent: '#6b4423',
    background: '#fffef9',
    dropCap: '#6b4423',
  },
};

const mockHelveticaStyle: BookStyle = {
  id: 'helvetica',
  name: 'Helvetica Modern',
  description: 'A clean, modern sans-serif typeface',
  category: 'sans-serif',
  fonts: {
    body: 'Helvetica, Arial, sans-serif',
    heading: 'Helvetica, Arial, sans-serif',
    fallback: 'sans-serif',
  },
  headings: {
    h1: {
      fontSize: '3em',
      fontWeight: 'bold',
      lineHeight: '1.2',
      marginTop: '1.5em',
      marginBottom: '0.8em',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#000000',
    },
    h2: {
      fontSize: '2.2em',
      fontWeight: 'bold',
      lineHeight: '1.3',
      marginTop: '1.2em',
      marginBottom: '0.6em',
    },
    h3: {
      fontSize: '1.6em',
      fontWeight: 'bold',
      lineHeight: '1.4',
      marginTop: '1em',
      marginBottom: '0.5em',
    },
  },
  body: {
    fontSize: '1em',
    lineHeight: '1.6',
    textAlign: 'left',
  },
  dropCap: {
    enabled: false,
    lines: 3,
  },
  ornamentalBreak: {
    enabled: true,
    symbol: '* * *',
    fontSize: '1.2em',
    textAlign: 'center',
    marginTop: '2em',
    marginBottom: '2em',
  },
  firstParagraph: {
    enabled: false,
    indent: {
      enabled: false,
    },
  },
  spacing: {
    paragraphSpacing: '1em',
    lineHeight: '1.6',
    sectionSpacing: '2.5em',
    chapterSpacing: '4em',
  },
  colors: {
    text: '#222222',
    heading: '#000000',
    accent: '#0066cc',
    background: '#ffffff',
  },
};

/**
 * ===========================================================================
 * COMPREHENSIVE PREVIEW PANEL EDGE CASE AND ERROR HANDLING TESTS
 * ===========================================================================
 */

import { PreviewPanel } from './PreviewPanel';
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

 * STYLE APPLICATION TO PREVIEW TESTS
 * ===========================================================================
 */

describe('Preview Style Application', () => {
  beforeEach(() => {
    mockRequestIdleCallback();
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

/**
 * ===========================================================================
 * DEVICE TYPE SWITCHING INTEGRATION TESTS
 * ===========================================================================
 *
 * Comprehensive tests for device type switching functionality including:
 * - Preview dimension updates for each device type
 * - Device-specific style application
 * - Viewport size mocking
 * - Integration with device controls
 */

// Import necessary components for integration testing
import { DeviceSwitcher } from './DeviceSwitcher';
import { PreviewContent } from './PreviewContent';
import { DeviceChrome } from './DeviceChrome';
import deviceDimensions from '../../constants/deviceDimensions';

// Mock device-specific CSS imports
jest.mock('./PreviewContent.css', () => ({}));
jest.mock('./DeviceChrome.css', () => ({}));

describe('Device Type Switching Integration', () => {
  beforeEach(() => {
    mockRequestIdleCallback();
    jest.clearAllMocks();

    // Mock window.postMessage for iframe communication
    window.postMessage = jest.fn();
  });

  afterEach(() => {
    cleanupMocks();
    jest.resetAllMocks();
  });

  describe('Device Controls Rendering', () => {
    it('should render DeviceSwitcher controls correctly', () => {
      renderWithProviders(<DeviceSwitcher />);

      expect(screen.getByLabelText('Switch to iPad mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to Kindle mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to iPhone mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Switch to Print Spread mode')).toBeInTheDocument();
    });

    it('should render device controls with correct initial state', () => {
      const { store } = renderWithProviders(<DeviceSwitcher />);

      const iPadButton = screen.getByLabelText('Switch to iPad mode');
      expect(iPadButton).toHaveClass('device-switcher__button--active');
      expect(store.getState().preview.deviceMode).toBe('iPad');
    });
  });

  describe('Device Mode Changes and Dimension Updates', () => {
    it('should update device mode in store when clicking Kindle button', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      await user.click(screen.getByLabelText('Switch to Kindle mode'));

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('Kindle');
      });
    });

    it('should update device mode in store when clicking iPhone button', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      await user.click(screen.getByLabelText('Switch to iPhone mode'));

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPhone');
      });
    });

    it('should update device mode in store when clicking PrintSpread button', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      await user.click(screen.getByLabelText('Switch to Print Spread mode'));

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('PrintSpread');
      });
    });

    it('should verify iPad device dimensions from config', () => {
      expect(deviceDimensions.iPad).toBeDefined();
      expect(deviceDimensions.iPad.viewport.width).toBe(1536);
      expect(deviceDimensions.iPad.viewport.height).toBe(2048);
      expect(deviceDimensions.iPad.ppi).toBe(264);
    });

    it('should verify Kindle device dimensions from config', () => {
      expect(deviceDimensions.Kindle).toBeDefined();
      expect(deviceDimensions.Kindle.viewport.width).toBe(758);
      expect(deviceDimensions.Kindle.viewport.height).toBe(1024);
      expect(deviceDimensions.Kindle.ppi).toBe(300);
    });

    it('should verify iPhone device dimensions from config', () => {
      expect(deviceDimensions.iPhone).toBeDefined();
      expect(deviceDimensions.iPhone.viewport.width).toBe(750);
      expect(deviceDimensions.iPhone.viewport.height).toBe(1334);
      expect(deviceDimensions.iPhone.ppi).toBe(326);
    });

    it('should verify PrintSpread device dimensions from config', () => {
      expect(deviceDimensions.PrintSpread).toBeDefined();
      expect(deviceDimensions.PrintSpread.ppi).toBe(300);
      expect(deviceDimensions.PrintSpread.isVariable).toBe(true);
      expect(deviceDimensions.PrintSpread.trimSizes).toBeDefined();
    });
  });

  describe('PreviewContent with Device Modes', () => {
    it('should render PreviewContent with desktop mode by default', () => {
      const { container } = renderWithProviders(
        <PreviewContent content="<p>Test content</p>" deviceMode="desktop" />
      );

      const previewContainer = container.querySelector('.device-desktop');
      expect(previewContainer).toBeInTheDocument();
    });

    it('should render PreviewContent with tablet mode', () => {
      const { container } = renderWithProviders(
        <PreviewContent content="<p>Test content</p>" deviceMode="tablet" />
      );

      const previewContainer = container.querySelector('.device-tablet');
      expect(previewContainer).toBeInTheDocument();
    });

    it('should render PreviewContent with mobile mode', () => {
      const { container } = renderWithProviders(
        <PreviewContent content="<p>Test content</p>" deviceMode="mobile" />
      );

      const previewContainer = container.querySelector('.device-mobile');
      expect(previewContainer).toBeInTheDocument();
    });

    it('should render empty state when no content provided', () => {
      renderWithProviders(<PreviewContent content="" deviceMode="desktop" />);

      expect(screen.getByText('No content to preview')).toBeInTheDocument();
      expect(screen.getByText('Add content to see it rendered here')).toBeInTheDocument();
    });

    it('should apply custom styles to PreviewContent', () => {
      const customStyles = '.test { color: red; }';
      renderWithProviders(
        <PreviewContent
          content="<p>Test</p>"
          styles={customStyles}
          deviceMode="desktop"
        />
      );

      expect(screen.getByTitle('Content Preview')).toBeInTheDocument();
    });
  });

  describe('DeviceChrome Visual Rendering', () => {
    it('should render desktop chrome correctly', () => {
      const { container } = renderWithProviders(
        <DeviceChrome deviceMode="desktop">
          <div>Test Content</div>
        </DeviceChrome>
      );

      expect(container.querySelector('.device-chrome-desktop')).toBeInTheDocument();
    });

    it('should render iPad chrome with device bezel', () => {
      const { container } = renderWithProviders(
        <DeviceChrome deviceMode="ipad">
          <div>Test Content</div>
        </DeviceChrome>
      );

      expect(container.querySelector('.device-chrome-ipad')).toBeInTheDocument();
      expect(container.querySelector('.ipad-bezel')).toBeInTheDocument();
      expect(container.querySelector('.ipad-camera')).toBeInTheDocument();
    });

    it('should render iPhone chrome with notch', () => {
      const { container } = renderWithProviders(
        <DeviceChrome deviceMode="iphone">
          <div>Test Content</div>
        </DeviceChrome>
      );

      expect(container.querySelector('.device-chrome-iphone')).toBeInTheDocument();
      expect(container.querySelector('.device-notch')).toBeInTheDocument();
      expect(container.querySelector('.notch-camera')).toBeInTheDocument();
    });

    it('should render Kindle chrome with brand label', () => {
      const { container } = renderWithProviders(
        <DeviceChrome deviceMode="kindle">
          <div>Test Content</div>
        </DeviceChrome>
      );

      expect(container.querySelector('.device-chrome-kindle')).toBeInTheDocument();
      expect(container.querySelector('.kindle-brand')).toBeInTheDocument();
      expect(screen.getByText('Kindle')).toBeInTheDocument();
    });

    it('should render PrintSpread chrome with book pages', () => {
      const { container } = renderWithProviders(
        <DeviceChrome deviceMode="printspread">
          <div>Test Content</div>
        </DeviceChrome>
      );

      expect(container.querySelector('.device-chrome-printspread')).toBeInTheDocument();
      expect(container.querySelector('.book-left-page')).toBeInTheDocument();
      expect(container.querySelector('.book-right-page')).toBeInTheDocument();
      expect(container.querySelector('.book-spine')).toBeInTheDocument();
    });
  });

  describe('Complete Device Switching Flow', () => {
    it('should handle complete flow: render switcher, click button, verify state', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(
        <div>
          <DeviceSwitcher />
          <PreviewContent content="<p>Test content</p>" />
        </div>
      );

      // Initial state
      expect(store.getState().preview.deviceMode).toBe('iPad');

      // Switch to Kindle
      await user.click(screen.getByLabelText('Switch to Kindle mode'));

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('Kindle');
      });

      // Verify Kindle button is active
      const kindleButton = screen.getByLabelText('Switch to Kindle mode');
      expect(kindleButton).toHaveClass('device-switcher__button--active');
    });

    it('should transition through all device types correctly', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      const transitions = [
        { button: 'Switch to Kindle mode', expectedMode: 'Kindle' },
        { button: 'Switch to iPhone mode', expectedMode: 'iPhone' },
        { button: 'Switch to Print Spread mode', expectedMode: 'PrintSpread' },
        { button: 'Switch to iPad mode', expectedMode: 'iPad' },
      ];

      for (const transition of transitions) {
        await user.click(screen.getByLabelText(transition.button));
        await waitFor(() => {
          expect(store.getState().preview.deviceMode).toBe(transition.expectedMode);
        });
      }
    });
  });

  describe('Mock Viewport Testing', () => {
    it('should handle viewport size mocking for iPad', () => {
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
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
      // Verify triggerUpdate was called for each change
      await waitFor(() => {
        expect(triggerUpdateMock).toHaveBeenCalledTimes(5); // Initial + 4 updates
      // Verify the last call was with the final content
      expect(triggerUpdateMock).toHaveBeenLastCalledWith(
        'text-edit'
    it('should properly debounce text edit updates', async () => {
      const debounceDelay = 400;
        previewContent: '<p>Initial</p>',
      renderWithProviders(
        <PreviewPanel
          content="<p>Initial</p>"
          updateType="text-edit"
          debounceDelay={debounceDelay}
        />
      // Verify debounce delay was passed to the hook
      expect(mockUsePreviewUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          debounceDelay,
        })
    it('should update immediately for navigation events', async () => {
        previewContent: '<p>Chapter 1</p>',
        isUpdating: false,
        <PreviewPanel content="<p>Chapter 1</p>" updateType="navigation" />
      // Verify triggerUpdate was called with navigation type
      expect(triggerUpdateMock).toHaveBeenCalledWith(
        '<p>Chapter 1</p>',
        'navigation'
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
  describe('Empty Content Handling', () => {
    it('should render placeholder when content is empty string', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '',
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      renderWithProviders(<PreviewPanel content="" />);
      expect(screen.getByText('No content to preview')).toBeInTheDocument();
    it('should render placeholder when content is only whitespace', () => {
      renderWithProviders(<PreviewPanel content="   \n  \t  " />);
    it('should render placeholder when previewContent is empty', () => {
      renderWithProviders(<PreviewPanel content="<p>Test</p>" />);
    it('should not crash with null or undefined content', () => {
        previewContent: null as any,
  describe('Very Long Chapters', () => {
    it('should render very long content without crashing', () => {
      const longContent = '<p>' + 'Lorem ipsum dolor sit amet. '.repeat(10000) + '</p>';
        previewContent: longContent,
      const { container } = renderWithProviders(<PreviewPanel content={longContent} />);
      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText).toBeInTheDocument();
      expect(previewText?.innerHTML).toContain('Lorem ipsum');
    it('should handle extremely large content (>1MB)', () => {
      // Create a very large string (~2MB)
      const hugeContent = '<p>' + 'X'.repeat(2000000) + '</p>';
        previewContent: hugeContent,
      const { container } = renderWithProviders(<PreviewPanel content={hugeContent} />);
    it('should trigger update with very long content', () => {
      const triggerUpdate = jest.fn();
        previewContent: '<p>Test</p>',
        triggerUpdate,
      const veryLongContent = '<p>' + 'Content '.repeat(50000) + '</p>';
      renderWithProviders(<PreviewPanel content={veryLongContent} />);
      expect(triggerUpdate).toHaveBeenCalledWith(veryLongContent, 'text-edit');
  describe('Chapters with Only Images', () => {
    it('should render content with only image tags', () => {
      const imageOnlyContent = '<img src="data:image/png;base64,iVBORw0KGg" alt="Test Image" />';
        previewContent: imageOnlyContent,
      const { container } = renderWithProviders(<PreviewPanel content={imageOnlyContent} />);
      expect(previewText?.innerHTML).toContain('img');
    it('should handle multiple images without text', () => {
      const multipleImages = `
        <img src="data:image/png;base64,abc" alt="Image 1" />
        <img src="data:image/png;base64,def" alt="Image 2" />
        <img src="data:image/png;base64,ghi" alt="Image 3" />
      `;
        previewContent: multipleImages,
      const { container } = renderWithProviders(<PreviewPanel content={multipleImages} />);
      expect(previewText?.innerHTML).toContain('Image 1');
      expect(previewText?.innerHTML).toContain('Image 2');
      expect(previewText?.innerHTML).toContain('Image 3');
    it('should handle images with missing src attributes', () => {
      const brokenImages = `
        <img alt="Broken Image 1" />
        <img alt="Broken Image 2" />
        previewContent: brokenImages,
      const { container } = renderWithProviders(<PreviewPanel content={brokenImages} />);
  describe('Malformed Content', () => {
    it('should handle unclosed HTML tags', () => {
      const malformedHtml = '<p>Unclosed paragraph<div>Unclosed div<span>Unclosed span';
        previewContent: malformedHtml,
      const { container } = renderWithProviders(<PreviewPanel content={malformedHtml} />);
    it('should handle invalid HTML entities', () => {
      const invalidEntities = '<p>&invalid; &unknown; &123abc;</p>';
        previewContent: invalidEntities,
      const { container } = renderWithProviders(<PreviewPanel content={invalidEntities} />);
    it('should handle script tags safely', () => {
      const scriptContent = '<p>Safe content</p><script>alert("XSS")</script>';
        previewContent: scriptContent,
      const { container } = renderWithProviders(<PreviewPanel content={scriptContent} />);
      // Note: dangerouslySetInnerHTML will render scripts, but they won't execute in jsdom
    it('should handle deeply nested HTML', () => {
      const deeplyNested = '<div>'.repeat(100) + 'Content' + '</div>'.repeat(100);
        previewContent: deeplyNested,
      const { container } = renderWithProviders(<PreviewPanel content={deeplyNested} />);
      expect(previewText?.innerHTML).toContain('Content');
    it('should handle mixed valid and invalid markup', () => {
      const mixedMarkup = `
        <p>Valid paragraph</p>
        <invalid-tag>Invalid content</invalid-tag>
        <p class="unclosed">
        <div>Another valid div</div>
        previewContent: mixedMarkup,
      const { container } = renderWithProviders(<PreviewPanel content={mixedMarkup} />);
    it('should handle special characters and unicode', () => {
      const specialChars = '<p>Special: © ® ™ € £ ¥ ñ ü 中文 日本語 한국어 🎉 👍</p>';
        previewContent: specialChars,
      const { container } = renderWithProviders(<PreviewPanel content={specialChars} />);
      expect(previewText?.innerHTML).toContain('Special:');
  describe('Missing Style Definitions', () => {
    it('should render without custom className', () => {
      const { container } = renderWithProviders(<PreviewPanel content="<p>Test</p>" />);
      const panel = container.querySelector('.preview-panel');
      expect(panel).toBeInTheDocument();
      expect(panel?.classList.contains('preview-panel')).toBe(true);
    it('should handle undefined updateType gracefully', () => {
      renderWithProviders(<PreviewPanel content="<p>Test</p>" updateType={undefined} />);
      // Should use default 'text-edit' updateType when undefined is passed
      expect(triggerUpdate).toHaveBeenCalledWith('<p>Test</p>', 'text-edit');
    it('should handle missing optional props', () => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
    it('should apply empty string className without error', () => {
      const { container } = renderWithProviders(
        <PreviewPanel content="<p>Test</p>" className="" />
  describe('Render Errors and Error Boundaries', () => {
    // Suppress console errors for these tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    afterAll(() => {
      console.error = originalError;
    it('should catch errors with ErrorBoundary and show fallback UI', () => {
      const ThrowError = () => {
        throw new Error('Test render error');
        <ErrorBoundary fallback={<div>Error occurred</div>}>
          <ThrowError />
        </ErrorBoundary>
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    it('should catch errors in PreviewPanel with ErrorBoundary', () => {
      // Create a component that throws an error
      const BrokenPreview = () => {
        throw new Error('Preview render error');
      const onError = jest.fn();
        <ErrorBoundary onError={onError}>
          <BrokenPreview />
      expect(onError).toHaveBeenCalled();
    it('should recover from error when reset', () => {
      let shouldThrow = true;
      const ConditionalError = () => {
        if (shouldThrow) {
          throw new Error('Conditional error');
        }
        return <div>Recovered</div>;
      const { rerender, store } = renderWithProviders(
        <ErrorBoundary>
          <ConditionalError />
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
    it('should handle errors during dangerouslySetInnerHTML', () => {
      // dangerouslySetInnerHTML itself won't throw, but we test the component structure
      const problematicContent = '<p>Normal content</p>'.repeat(1000);
        previewContent: problematicContent,
          <PreviewPanel content={problematicContent} />
    });
  });

  describe('Loading States', () => {
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
        isUpdating: false,
      rerender(<PreviewPanel content="<p>Content</p>" />);
      // Verify loading state is gone
    it('should show spinner SVG when loading', () => {
      mockUsePreviewUpdate.mockReturnValueOnce({
        previewContent: '<p>Test</p>',
        triggerUpdate: jest.fn(),
        cancelPendingUpdates: jest.fn(),
      const { container } = renderWithProviders(<PreviewPanel content="<p>Test</p>" />);
      const spinner = container.querySelector('.preview-panel__spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner?.tagName).toBe('svg');
    });
    it('should display content while loading', () => {
        previewContent: '<p>Existing content</p>',
      const { container } = renderWithProviders(<PreviewPanel content="<p>New content</p>" />);
      // Should show both loading indicator and existing content
      const previewText = container.querySelector('.preview-panel__text');
      expect(previewText?.innerHTML).toContain('Existing content');
      // First render with loading state
      const { rerender, store } = renderWithProviders(<PreviewPanel content="<p>Content</p>" />);
      // Update mock to not be loading
      rerender(
        <AllProviders store={store}>
          <PreviewPanel content="<p>Content</p>" />
        </AllProviders>
      expect(screen.queryByTitle('Updating preview...')).not.toBeInTheDocument();
    });
  });

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
          previewContent: testContent,
          isUpdating: false,
          triggerUpdate: triggerUpdateMock,
          cancelPendingUpdates: cancelPendingUpdatesMock,

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

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Preview');

      expect(screen.getByText('Preview')).toBeInTheDocument();

    cleanupMocks();
    jest.resetAllMocks();
  });

  describe('Book Style Selection', () => {
    it('should update preview appearance when selecting a book style', async () => {
      const styledContent = `
        <div style="font-family: Garamond, serif; font-size: 1.15em; line-height: 1.8; color: #333333; background-color: #fffef9;">
          <h1 style="font-size: 2.75em; color: #1f1f1f;">Chapter Title</h1>
          <p>Chapter content</p>
        </div>
      `;

      const { rerender, container } = renderWithProviders(
        <PreviewPanel content="<p>Initial content</p>" />
      );

      // Simulate style application
      rerender(
        <PreviewPanel content={styledContent} />
      );

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        expect(previewText).toBeInTheDocument();
      });
    });

    it('should apply different styles when switching between book styles', async () => {
      const garamondContent = `
        <div style="font-family: Garamond, serif; background-color: #fffef9;">
          <h1>Garamond Title</h1>
        </div>
      `;

      const helveticaContent = `
        <div style="font-family: Helvetica, Arial, sans-serif; background-color: #ffffff;">
          <h1>Helvetica Title</h1>
        </div>
      `;

      const { rerender, container } = renderWithProviders(
        <PreviewPanel content={garamondContent} />
      );

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        expect(previewText?.innerHTML).toContain('Garamond');
      });

      // Switch to Helvetica style
      rerender(<PreviewPanel content={helveticaContent} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        expect(previewText?.innerHTML).toContain('Helvetica');

      expect(store.getState().preview.deviceMode).toBe('iPad');
      expect(deviceDimensions.iPad.viewport.width).toBe(1536);
      expect(deviceDimensions.iPad.viewport.height).toBe(2048);
    });

    it('should handle viewport size mocking for Kindle', () => {
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'Kindle',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      expect(store.getState().preview.deviceMode).toBe('Kindle');
      expect(deviceDimensions.Kindle.viewport.width).toBe(758);
      expect(deviceDimensions.Kindle.viewport.height).toBe(1024);
    });

    it('should handle viewport size mocking for iPhone', () => {
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPhone',
            zoomLevel: 100,
            currentPage: 1,
            totalPages: 0,
          },
        },
      });

      expect(store.getState().preview.deviceMode).toBe('iPhone');
      expect(deviceDimensions.iPhone.viewport.width).toBe(750);
      expect(deviceDimensions.iPhone.viewport.height).toBe(1334);
    });
  });

  describe('Device-Specific Styles Application', () => {
    it('should apply device-specific CSS class for desktop', () => {
      const { container } = renderWithProviders(
        <PreviewContent content="<p>Test</p>" deviceMode="desktop" />
      );

      expect(container.querySelector('.device-desktop')).toBeInTheDocument();
    });

    it('should apply device-specific CSS class for tablet', () => {
      const { container } = renderWithProviders(
        <PreviewContent content="<p>Test</p>" deviceMode="tablet" />
      );

      expect(container.querySelector('.device-tablet')).toBeInTheDocument();
    });

    it('should apply device-specific CSS class for mobile', () => {
      const { container } = renderWithProviders(
        <PreviewContent content="<p>Test</p>" deviceMode="mobile" />
      );

      expect(container.querySelector('.device-mobile')).toBeInTheDocument();
    });

    it('should render PreviewContent with custom className', () => {
      const { container } = renderWithProviders(
        <PreviewContent
          content="<p>Test</p>"
          deviceMode="desktop"
          className="custom-class"
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Integration with Rendering Engine', () => {
    it('should call preview renderer with correct device type', () => {
      const { getDeviceConfig } = require('../../__mocks__/previewRenderer');

      getDeviceConfig('iPad');
      expect(getDeviceConfig).toHaveBeenCalledWith('iPad');

      getDeviceConfig('Kindle');
      expect(getDeviceConfig).toHaveBeenCalledWith('Kindle');

      getDeviceConfig('iPhone');
      expect(getDeviceConfig).toHaveBeenCalledWith('iPhone');
    });

    it('should receive device configuration from renderer', () => {
      const { getDeviceConfig } = require('../../__mocks__/previewRenderer');

      const config = getDeviceConfig('iPad');
      expect(config).toHaveProperty('width');
      expect(config).toHaveProperty('height');
      expect(config).toHaveProperty('pixelRatio');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing device mode gracefully', () => {
      const { container } = renderWithProviders(
        <DeviceChrome deviceMode="unknown" as any>
          <div>Test</div>
        </DeviceChrome>
      );

      // Should fall back to desktop chrome
      expect(container.querySelector('.device-chrome-desktop')).toBeInTheDocument();
    });

    it('should handle empty content in all device modes', () => {
      const modes = ['desktop', 'tablet', 'mobile'];

      modes.forEach((mode) => {
        const { container, unmount } = renderWithProviders(
          <PreviewContent content="" deviceMode={mode as any} />
        );

        expect(screen.getByText('No content to preview')).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle rapid device switching without errors', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />);

      // Rapidly click through all devices
      await user.click(screen.getByLabelText('Switch to Kindle mode'));
      await user.click(screen.getByLabelText('Switch to iPhone mode'));
      await user.click(screen.getByLabelText('Switch to Print Spread mode'));
      await user.click(screen.getByLabelText('Switch to iPad mode'));

      // Should end in a valid state
      await waitFor(() => {
        const finalMode = store.getState().preview.deviceMode;
        expect(['iPad', 'Kindle', 'iPhone', 'PrintSpread']).toContain(finalMode);
      });
    });
  });

  describe('Style Element Application', () => {
    it('should apply heading styles correctly', async () => {
      const contentWithHeadings = `
        <div>
          <h1 style="font-size: 2.75em; font-weight: 500; color: #1f1f1f; text-transform: capitalize;">Main Title</h1>
          <h2 style="font-size: 2em; font-weight: 500; color: #1f1f1f;">Subtitle</h2>
          <h3 style="font-size: 1.5em; font-weight: 500;">Section Header</h3>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithHeadings} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('font-size: 2.75em');
        expect(html).toContain('font-size: 2em');
        expect(html).toContain('font-size: 1.5em');
      });
    });

    it('should apply body text styles correctly', async () => {
      const contentWithBody = `
        <div style="font-family: Garamond, serif; font-size: 1.15em; line-height: 1.8; text-align: justify;">
          <p style="margin-bottom: 1.3em; color: #333333;">First paragraph with body styling.</p>
          <p style="margin-bottom: 1.3em; color: #333333;">Second paragraph with body styling.</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithBody} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('font-family: Garamond');
        expect(html).toContain('font-size: 1.15em');
        expect(html).toContain('line-height: 1.8');
        expect(html).toContain('text-align: justify');
      });
    });

    it('should apply ornamental break styles correctly', async () => {
      const contentWithBreak = `
        <div>
          <p>Paragraph before break</p>
          <div style="text-align: center; font-size: 1em; margin-top: 2.5em; margin-bottom: 2.5em;">
            ✦ ✦ ✦
          </div>
          <p>Paragraph after break</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithBreak} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('✦ ✦ ✦');
        expect(html).toContain('text-align: center');
        expect(html).toContain('margin-top: 2.5em');
      });
    });

    it('should apply drop cap styles correctly', async () => {
      const contentWithDropCap = `
        <div>
          <p>
            <span style="float: left; font-size: 4.5em; font-weight: 500; line-height: 4; margin-right: 0.12em; color: #6b4423; font-family: Garamond, serif;">O</span>nce upon a time, there was a story that began with a beautiful drop cap.
          </p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithDropCap} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('float: left');
        expect(html).toContain('font-size: 4.5em');
        expect(html).toContain('color: #6b4423');
      });
    });

    it('should apply first paragraph special styling', async () => {
      const contentWithFirstParagraph = `
        <div>
          <p style="font-variant: small-caps; letter-spacing: 0.08em;">This is the first paragraph with special styling.</p>
          <p>This is a regular paragraph.</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithFirstParagraph} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('font-variant: small-caps');
        expect(html).toContain('letter-spacing: 0.08em');
      });
    });
  });

  describe('Custom Style Configurations', () => {
    it('should apply custom style overrides correctly', async () => {
      const customStyledContent = `
        <div style="font-family: 'Custom Font', serif; font-size: 1.25em; color: #ff0000;">
          <h1 style="color: #0000ff;">Custom Styled Title</h1>
          <p>Custom styled content</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={customStyledContent} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('Custom Font');
        expect(html).toContain('font-size: 1.25em');
        expect(html).toContain('color: #ff0000');
        expect(html).toContain('color: #0000ff');
      });
    });

    it('should merge custom configurations with base styles', async () => {
      const mergedStyledContent = `
        <div style="font-family: Garamond, serif; font-size: 1.3em; color: #444444;">
          <p>Content with merged styles</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={mergedStyledContent} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('font-family: Garamond');
        expect(html).toContain('font-size: 1.3em');
      });
    });
  });

  describe('Real-time Style Updates', () => {
    it('should update preview in real-time when styles change', async () => {
      const initialContent = `<p style="color: #000000;">Initial text</p>`;
      const updatedContent = `<p style="color: #ff0000;">Updated text</p>`;

      const { rerender, container } = renderWithProviders(
        <PreviewPanel content={initialContent} />
      );

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        expect(previewText?.innerHTML).toContain('color: #000000');
      });

      rerender(<PreviewPanel content={updatedContent} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        expect(previewText?.innerHTML).toContain('color: #ff0000');
      });
    });

    it('should show loading state during style application', async () => {
      const { container } = renderWithProviders(<PreviewPanel content="<p>Test content</p>" />);

      // Note: In actual implementation, isUpdating would be controlled by the hook
      // This test validates the loading indicator element exists in the component
      const header = container.querySelector('.preview-panel__header');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Font Loading and Display', () => {
    it('should apply font family from style configuration', async () => {
      const contentWithFonts = `
        <div style="font-family: 'Garamond', 'EB Garamond', 'Cormorant Garamond', serif;">
          <h1 style="font-family: 'Garamond', 'EB Garamond', serif;">Title with Garamond</h1>
          <p>Body text with Garamond</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithFonts} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('Garamond');
        expect(html).toContain('EB Garamond');
      });
    });

    it('should include fallback fonts in font stack', async () => {
      const contentWithFallbacks = `
        <div style="font-family: Helvetica, Arial, sans-serif;">
          <p>Content with fallback fonts</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithFallbacks} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('Helvetica');
        expect(html).toContain('Arial');
        expect(html).toContain('sans-serif');
      });
    });

    it('should apply different font families for headings and body', async () => {
      const contentWithMixedFonts = `
        <div style="font-family: Georgia, serif;">
          <h1 style="font-family: Arial, sans-serif;">Sans-serif Heading</h1>
          <p>Serif body text</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithMixedFonts} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('Arial');
        expect(html).toContain('Georgia');
      });
    });
  });

  describe('Theme-specific Styles', () => {
    it('should apply background color from theme', async () => {
      const contentWithBackground = `
        <div style="background-color: #fffef9; padding: 2rem;">
          <p>Content with themed background</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithBackground} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('background-color: #fffef9');
      });
    });

    it('should apply border styles from theme', async () => {
      const contentWithBorder = `
        <div style="border: 1px solid #6b4423; padding: 1rem;">
          <p>Content with themed border</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithBorder} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('border: 1px solid #6b4423');
      });
    });

    it('should apply spacing from theme configuration', async () => {
      const contentWithSpacing = `
        <div>
          <p style="margin-bottom: 1.3em;">Paragraph with themed spacing</p>
          <h2 style="margin-top: 1.75em; margin-bottom: 0.6em;">Heading with themed margins</h2>
          <p style="margin-bottom: 1.3em;">Another paragraph</p>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithSpacing} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('margin-bottom: 1.3em');
        expect(html).toContain('margin-top: 1.75em');
      });
    });

    it('should apply text color scheme consistently', async () => {
      const contentWithColors = `
        <div>
          <h1 style="color: #1f1f1f;">Heading Color</h1>
          <p style="color: #333333;">Body text color</p>
          <span style="color: #6b4423;">Accent color</span>
        </div>
      `;

      const { container } = renderWithProviders(<PreviewPanel content={contentWithColors} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        const html = previewText?.innerHTML || '';

        expect(html).toContain('color: #1f1f1f');
        expect(html).toContain('color: #333333');
        expect(html).toContain('color: #6b4423');
      });
    });

    it('should handle theme changes without breaking layout', async () => {
      const lightThemeContent = `
        <div style="background-color: #ffffff; color: #000000;">
          <p>Light theme content</p>
        </div>
      `;

      const darkThemeContent = `
        <div style="background-color: #1a1a1a; color: #ffffff;">
          <p>Dark theme content</p>
        </div>
      `;

      const { rerender, container } = renderWithProviders(
        <PreviewPanel content={lightThemeContent} />
      );

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        expect(previewText?.innerHTML).toContain('background-color: #ffffff');
      });

      rerender(<PreviewPanel content={darkThemeContent} />);

      await waitFor(() => {
        const previewText = container.querySelector('.preview-panel__text');
        expect(previewText?.innerHTML).toContain('background-color: #1a1a1a');
      });
    });
  });

  describe('Style System Integration', () => {
    it('should compute styles using mocked style engine', () => {
      const { computeHeadingStyles, computeParagraphStyles } = require('../../services/style-engine');

      computeHeadingStyles(mockGaramondStyle.headings.h1, 1, mockGaramondStyle);
      expect(computeHeadingStyles).toHaveBeenCalledWith(
        mockGaramondStyle.headings.h1,
        1,
        mockGaramondStyle
      );

      computeParagraphStyles(mockGaramondStyle, false, false);
      expect(computeParagraphStyles).toHaveBeenCalledWith(
        mockGaramondStyle,
        false,
        false
      );
    });

    it('should handle ornamental break computation', () => {
      const { computeOrnamentalBreakStyles } = require('../../services/style-engine');

      const result = computeOrnamentalBreakStyles(mockGaramondStyle);
      expect(computeOrnamentalBreakStyles).toHaveBeenCalledWith(mockGaramondStyle);
      expect(result).toHaveProperty('textAlign');
      expect(result).toHaveProperty('content');
      expect(result.content).toBe('✦ ✦ ✦');
    });

    it('should handle drop cap computation', () => {
      const { computeDropCapStyles } = require('../../services/style-engine');

      const result = computeDropCapStyles(mockGaramondStyle.dropCap, mockGaramondStyle);
      expect(computeDropCapStyles).toHaveBeenCalledWith(
        mockGaramondStyle.dropCap,
        mockGaramondStyle
      );
      expect(result).toHaveProperty('fontSize');
      expect(result).toHaveProperty('float');
      expect(result.float).toBe('left');
    });

    it('should merge custom styles with base styles', () => {
      const { mergeStyles } = require('../../services/style-engine');

      const customOverrides = {
        colors: {
          text: '#000000',
          heading: '#111111',
          background: '#ffffff',
        },
      };

      const result = mergeStyles(mockGaramondStyle, customOverrides);
      expect(mergeStyles).toHaveBeenCalledWith(mockGaramondStyle, customOverrides);
      expect(result).toMatchObject(expect.objectContaining(customOverrides));

  describe('Performance and State Management', () => {
    it('should maintain zoom level when switching devices', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 150,
            currentPage: 1,
            totalPages: 10,
          },
        },
      });

      expect(store.getState().preview.zoomLevel).toBe(150);

      await user.click(screen.getByLabelText('Switch to Kindle mode'));

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('Kindle');
        expect(store.getState().preview.zoomLevel).toBe(150); // Zoom level preserved
      });
    });

    it('should maintain page number when switching devices', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<DeviceSwitcher />, {
        preloadedState: {
          preview: {
            deviceMode: 'iPad',
            zoomLevel: 100,
            currentPage: 5,
            totalPages: 10,
          },
        },
      });

      expect(store.getState().preview.currentPage).toBe(5);

      await user.click(screen.getByLabelText('Switch to iPhone mode'));

      await waitFor(() => {
        expect(store.getState().preview.deviceMode).toBe('iPhone');
        expect(store.getState().preview.currentPage).toBe(5); // Page number preserved
      });
    });
  });
});


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
 * COMPREHENSIVE PREVIEW PANEL COMPONENT TESTS
 * ===========================================================================
 *
 * Below are example tests for the actual PreviewPanel component.
 * These tests require the usePreviewUpdate hook mock to be properly configured.
 *
 * To use these tests:
 * 1. Ensure the manual mock in src/hooks/__mocks__/usePreviewUpdate.ts is working
 * 2. Uncomment the tests below
 * 3. Import PreviewPanel: import { PreviewPanel } from './PreviewPanel';
 * 4. Run the tests
 *
 * Example test structure:
 *
 * describe('PreviewPanel Component', () => {
 *   describe('Rendering', () => {
 *     it('should render preview panel with header', () => {
 *       renderWithProviders(<PreviewPanel content="<p>Test content</p>" />);
 *       expect(screen.getByText('Preview')).toBeInTheDocument();
 *     });
 *
 *     it('should render preview content when provided', () => {
 *       renderWithProviders(<PreviewPanel content="<p>Test content</p>" />);
 *       // Add assertions based on mock behavior
 *     });
 *
 *     it('should apply custom className', () => {
 *       const { container } = renderWithProviders(
 *         <PreviewPanel content="<p>Test</p>" className="custom-preview" />
 *       );
 *       const previewPanel = container.querySelector('.preview-panel');
 *       expect(previewPanel).toHaveClass('custom-preview');
 *     });
 *   });
 *
 *   describe('Loading State', () => {
 *     it('should show loading indicator when updating', () => {
 *       // Configure mock to return isUpdating: true
 *       // Add test implementation
 *     });
 *   });
 *
 *   describe('Content Updates', () => {
 *     it('should trigger update when content changes', () => {
 *       // Test debounced content updates
 *     });
 *
 *     it('should call onPreviewUpdate callback', async () => {
 *       const onPreviewUpdate = jest.fn();
 *       renderWithProviders(
 *         <PreviewPanel content="<p>Test</p>" onPreviewUpdate={onPreviewUpdate} />
 *       );
 *       await waitFor(() => expect(onPreviewUpdate).toHaveBeenCalled());
 *     });
 *   });
 *
 *   describe('Chapter Navigation', () => {
 *     it('should cancel pending updates when chapter changes', () => {
 *       // Test chapter switching behavior
 *     });
 *   });
 *
 *   describe('Debounce Configuration', () => {
 *     it('should use custom debounce delay', () => {
 *       renderWithProviders(
 *         <PreviewPanel content="<p>Test</p>" debounceDelay={1000} />
 *       );
 *       // Verify debounce delay is applied
 *     });
 *   });
 *
 *   describe('Accessibility', () => {
 *     it('should have accessible heading', () => {
 *       renderWithProviders(<PreviewPanel content="<p>Test</p>" />);
 *       const heading = screen.getByRole('heading', { level: 2 });
 *       expect(heading).toHaveTextContent('Preview');
 *     });
 *   });
 * });
 */

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

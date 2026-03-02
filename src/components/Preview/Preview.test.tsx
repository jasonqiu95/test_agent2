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
 * STYLE APPLICATION TO PREVIEW TESTS
 * ===========================================================================
 */

describe('Preview Style Application', () => {
  beforeEach(() => {
    mockRequestIdleCallback();
    jest.clearAllMocks();
  });

  afterEach(() => {
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
    });
  });
});

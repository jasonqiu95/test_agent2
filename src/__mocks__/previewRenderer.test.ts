/**
 * Tests for Mock Preview Renderer
 *
 * Demonstrates usage patterns and validates mock behavior
 */

import {
  renderPreview,
  createMockRenderer,
  getDeviceConfig,
  isValidDeviceType,
  __getMockState,
  __resetMockState,
} from './previewRenderer';
import { Element } from '../types/element';
import { BookStyle } from '../types/style';

describe('Mock Preview Renderer', () => {
  // Sample test data
  const mockElement: Element = {
    id: 'test-element-1',
    type: 'prologue',
    matter: 'front',
    title: 'Test Chapter',
    content: [
      { id: 'block-1', type: 'paragraph', text: 'First paragraph content' } as any,
      { id: 'block-2', type: 'paragraph', text: 'Second paragraph content' } as any,
      { id: 'block-3', type: 'paragraph', text: 'Third paragraph content' } as any,
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockStyle: BookStyle = {
    id: 'test-style',
    name: 'Test Style',
    description: 'A test style configuration',
    category: 'serif',
    fonts: {
      body: 'Georgia',
      heading: 'Helvetica',
      fallback: 'serif',
    },
    headings: {
      h1: {
        fontSize: '2.5rem',
        fontWeight: 'bold',
        lineHeight: '1.2',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 'bold',
      },
      h3: {
        fontSize: '1.5rem',
      },
    },
    body: {
      fontSize: '16px',
      lineHeight: '1.6',
      textAlign: 'justify',
    },
    dropCap: {
      enabled: false,
      lines: 3,
    },
    ornamentalBreak: {
      enabled: false,
      symbol: '***',
    },
    firstParagraph: {
      enabled: false,
    },
    spacing: {
      paragraphSpacing: '1rem',
      lineHeight: '1.6',
      sectionSpacing: '2rem',
      chapterSpacing: '3rem',
    },
    colors: {
      text: '#000000',
      heading: '#333333',
      background: '#ffffff',
    },
  };

  beforeEach(() => {
    __resetMockState();
  });

  describe('renderPreview', () => {
    it('should render preview with valid inputs', () => {
      const result = renderPreview(mockElement, mockStyle, 'desktop');

      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('css');
      expect(result).toHaveProperty('pageCount');
      expect(typeof result.html).toBe('string');
      expect(typeof result.css).toBe('string');
      expect(typeof result.pageCount).toBe('number');
    });

    it('should include element data in HTML output', () => {
      const result = renderPreview(mockElement, mockStyle, 'tablet');

      expect(result.html).toContain(mockElement.title);
      expect(result.html).toContain(`data-device="tablet"`);
      expect(result.html).toContain(`data-type="${mockElement.type}"`);
      expect(result.html).toContain(`data-element-id="${mockElement.id}"`);
    });

    it('should apply different device configurations', () => {
      const desktopResult = renderPreview(mockElement, mockStyle, 'desktop');
      const mobileResult = renderPreview(mockElement, mockStyle, 'mobile');

      expect(desktopResult.html).toContain('data-device="desktop"');
      expect(mobileResult.html).toContain('data-device="mobile"');

      // Different device types may result in different page counts
      expect(desktopResult.pageCount).toBeGreaterThanOrEqual(1);
      expect(mobileResult.pageCount).toBeGreaterThanOrEqual(1);
    });

    it('should respect render options', () => {
      const resultWithPageBreaks = renderPreview(mockElement, mockStyle, 'print', {
        includePageBreaks: true,
        classPrefix: 'custom',
      });

      expect(resultWithPageBreaks.html).toContain('custom-container');
      expect(resultWithPageBreaks.html).toContain('custom-page-break');

      const resultWithoutPageBreaks = renderPreview(mockElement, mockStyle, 'print', {
        includePageBreaks: false,
      });

      expect(resultWithoutPageBreaks.html).not.toContain('preview-page-break');
    });

    it('should apply inline styles when requested', () => {
      const result = renderPreview(mockElement, mockStyle, 'desktop', {
        useInlineStyles: true,
      });

      expect(result.html).toContain('style="');
      expect(result.html).toContain(mockStyle.fonts.body);
    });

    it('should throw error for missing elementData', () => {
      expect(() => {
        renderPreview(null as any, mockStyle, 'desktop');
      }).toThrow('elementData is required');
    });

    it('should throw error for missing styleConfig', () => {
      expect(() => {
        renderPreview(mockElement, null as any, 'desktop');
      }).toThrow('styleConfig is required');
    });

    it('should throw error for missing deviceType', () => {
      expect(() => {
        renderPreview(mockElement, mockStyle, null as any);
      }).toThrow('deviceType is required');
    });

    it('should throw error for invalid deviceType', () => {
      expect(() => {
        renderPreview(mockElement, mockStyle, 'invalid' as any);
      }).toThrow('Invalid deviceType: invalid');
    });

    it('should generate CSS with style configuration', () => {
      const result = renderPreview(mockElement, mockStyle, 'desktop');

      expect(result.css).toContain(mockStyle.fonts.body);
      expect(result.css).toContain(mockStyle.body.fontSize);
      expect(result.css).toContain(mockStyle.colors.text);
      expect(result.css).toContain('.preview-container');
    });

    it('should calculate page count based on content', () => {
      const shortElement = { ...mockElement, content: [] };
      const shortResult = renderPreview(shortElement, mockStyle, 'desktop');
      expect(shortResult.pageCount).toBe(1); // Minimum 1 page

      const longElement = {
        ...mockElement,
        content: Array(50).fill({ type: 'paragraph', text: 'Content' }),
      };
      const longResult = renderPreview(longElement, mockStyle, 'desktop');
      expect(longResult.pageCount).toBeGreaterThan(1);
    });
  });

  describe('getDeviceConfig', () => {
    it('should return device configuration for valid types', () => {
      const desktopConfig = getDeviceConfig('desktop');
      expect(desktopConfig).toHaveProperty('width');
      expect(desktopConfig).toHaveProperty('height');
      expect(desktopConfig).toHaveProperty('pixelRatio');
      expect(desktopConfig.width).toBe(1920);

      const mobileConfig = getDeviceConfig('mobile');
      expect(mobileConfig.width).toBe(375);
    });

    it('should throw error for invalid device type', () => {
      expect(() => {
        getDeviceConfig('invalid' as any);
      }).toThrow('Invalid deviceType: invalid');
    });

    it('should return a copy of config, not reference', () => {
      const config1 = getDeviceConfig('desktop');
      const config2 = getDeviceConfig('desktop');

      config1.width = 9999;
      expect(config2.width).toBe(1920); // Should not be affected
    });
  });

  describe('isValidDeviceType', () => {
    it('should validate correct device types', () => {
      expect(isValidDeviceType('desktop')).toBe(true);
      expect(isValidDeviceType('tablet')).toBe(true);
      expect(isValidDeviceType('mobile')).toBe(true);
      expect(isValidDeviceType('print')).toBe(true);
    });

    it('should reject invalid device types', () => {
      expect(isValidDeviceType('invalid')).toBe(false);
      expect(isValidDeviceType('laptop')).toBe(false);
      expect(isValidDeviceType('')).toBe(false);
    });
  });

  describe('createMockRenderer', () => {
    it('should create isolated renderer instance', () => {
      const renderer = createMockRenderer();

      expect(renderer).toHaveProperty('render');
      expect(renderer).toHaveProperty('getDeviceConfig');
      expect(renderer).toHaveProperty('renderPage');
      expect(renderer).toHaveProperty('applyCustomStyles');
      expect(renderer).toHaveProperty('getCalls');
      expect(renderer).toHaveProperty('reset');
    });

    it('should track render calls independently', () => {
      const renderer1 = createMockRenderer();
      const renderer2 = createMockRenderer();

      renderer1.render(mockElement, mockStyle, 'desktop');
      renderer1.render(mockElement, mockStyle, 'mobile');

      renderer2.render(mockElement, mockStyle, 'tablet');

      expect(renderer1.getRenderCount()).toBe(2);
      expect(renderer2.getRenderCount()).toBe(1);
    });

    it('should reset instance state', () => {
      const renderer = createMockRenderer();

      renderer.render(mockElement, mockStyle, 'desktop');
      expect(renderer.getRenderCount()).toBe(1);

      renderer.reset();
      expect(renderer.getRenderCount()).toBe(0);
      expect(renderer.getCalls()).toHaveLength(0);
    });

    it('should render specific page numbers', () => {
      const renderer = createMockRenderer();

      const result = renderer.renderPage(mockElement, mockStyle, 'desktop', 5);

      expect(result.html).toContain('data-page-number="5"');
    });

    it('should apply custom styles', () => {
      const renderer = createMockRenderer();

      const result = renderer.render(mockElement, mockStyle, 'desktop');
      const customCSS = '.custom-class { color: red; }';
      const styledResult = renderer.applyCustomStyles(result, customCSS);

      expect(styledResult.css).toContain(customCSS);
      expect(styledResult.css).toContain('/* Custom Styles */');
    });

    it('should track device types used', () => {
      const renderer = createMockRenderer();

      renderer.render(mockElement, mockStyle, 'desktop');
      renderer.render(mockElement, mockStyle, 'mobile');
      renderer.render(mockElement, mockStyle, 'mobile');

      expect(renderer.wasDeviceTypeUsed('desktop')).toBe(true);
      expect(renderer.wasDeviceTypeUsed('mobile')).toBe(true);
      expect(renderer.wasDeviceTypeUsed('tablet')).toBe(false);

      const usedTypes = renderer.getUsedDeviceTypes();
      expect(usedTypes).toContain('desktop');
      expect(usedTypes).toContain('mobile');
      expect(usedTypes).toHaveLength(2);
    });

    it('should record last render time', () => {
      const renderer = createMockRenderer();

      const beforeTime = Date.now();
      renderer.render(mockElement, mockStyle, 'desktop');
      const afterTime = Date.now();

      const lastRenderTime = renderer.getLastRenderTime();
      expect(lastRenderTime).toBeGreaterThanOrEqual(beforeTime);
      expect(lastRenderTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Global mock state utilities', () => {
    it('should track global render calls', () => {
      const initialState = __getMockState();
      const initialCount = initialState.renderCount;

      renderPreview(mockElement, mockStyle, 'desktop');

      const newState = __getMockState();
      expect(newState.renderCount).toBe(initialCount + 1);
    });

    it('should reset global state', () => {
      renderPreview(mockElement, mockStyle, 'desktop');
      renderPreview(mockElement, mockStyle, 'mobile');

      __resetMockState();

      const state = __getMockState();
      expect(state.renderCount).toBe(0);
      expect(state.calls).toHaveLength(0);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty content gracefully', () => {
      const emptyElement = { ...mockElement, content: [] };
      const result = renderPreview(emptyElement, mockStyle, 'desktop');

      expect(result.html).toContain('preview-content');
      expect(result.pageCount).toBe(1); // Minimum 1 page
    });

    it('should escape HTML in titles', () => {
      const elementWithHTML = {
        ...mockElement,
        title: '<script>alert("xss")</script>',
      };

      const result = renderPreview(elementWithHTML, mockStyle, 'desktop');

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
    });

    it('should handle undefined optional properties', () => {
      const minimalStyle: BookStyle = {
        ...mockStyle,
        colors: {
          text: '#000',
          heading: '#000',
        },
      };

      expect(() => {
        renderPreview(mockElement, minimalStyle, 'desktop');
      }).not.toThrow();
    });
  });

  describe('Device-specific rendering', () => {
    it('should render differently for print device', () => {
      const printResult = renderPreview(mockElement, mockStyle, 'print', {
        printOptimized: true,
      });

      const screenResult = renderPreview(mockElement, mockStyle, 'desktop', {
        printOptimized: false,
      });

      expect(printResult.css).toContain('@media print');
      // Print results should default to including page breaks
      expect(printResult.html).toContain('page-break');
    });

    it('should calculate different page counts per device', () => {
      const devices: Array<'desktop' | 'tablet' | 'mobile' | 'print'> = [
        'desktop',
        'tablet',
        'mobile',
        'print',
      ];

      const results = devices.map(device =>
        renderPreview(mockElement, mockStyle, device)
      );

      // All results should have valid page counts
      results.forEach(result => {
        expect(result.pageCount).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(result.pageCount)).toBe(true);
      });
    });
  });
});

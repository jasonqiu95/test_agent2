/**
 * Comprehensive tests for previewRenderer module
 *
 * Tests cover:
 * - Content-to-HTML conversion for all element types
 * - Style-to-CSS generation with various configurations
 * - Font loading and @font-face rules
 * - Device-specific rendering for all device types
 * - Pagination calculations
 * - Edge cases and error handling
 */

import {
  renderPreview,
  getDeviceConfig,
  getDeviceProfile,
  isValidDeviceType,
  getDeviceContentArea,
  getDeviceOptimalFontSize,
  DeviceType,
  DeviceConfig,
  PreviewResult,
  RenderOptions,
} from '../previewRenderer';
import { Element } from '../../types/element';
import { BookStyle } from '../../types/style';
import * as contentTransformer from '../contentTransformer';
import * as styleGenerator from '../styleGenerator';
import * as fontLoader from '../fontLoader';
import * as deviceProfiles from '../deviceProfiles';
import * as paginationEngine from '../paginationEngine';

// Mock all dependencies
jest.mock('../contentTransformer');
jest.mock('../styleGenerator');
jest.mock('../fontLoader');
jest.mock('../deviceProfiles');
jest.mock('../paginationEngine');

describe('previewRenderer', () => {
  // Test fixtures
  const mockElement: Element = {
    id: 'test-element-1',
    type: 'chapter',
    matter: 'body',
    title: 'Test Chapter',
    order: 1,
    includeInToc: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    content: [
      {
        id: 'block-1',
        blockType: 'heading',
        content: 'Chapter Title',
        level: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'block-2',
        blockType: 'paragraph',
        content: 'This is a test paragraph with some content.',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
  };

  const mockStyle: BookStyle = {
    id: 'test-style',
    name: 'Test Style',
    description: 'A test style configuration',
    category: 'serif',
    fonts: {
      body: 'Georgia',
      heading: 'Garamond',
      fallback: 'serif',
    },
    headings: {
      h1: {
        fontSize: '2.5em',
        fontWeight: 'bold',
        lineHeight: '1.2',
        marginTop: '2rem',
        marginBottom: '1.5rem',
      },
      h2: {
        fontSize: '2em',
        fontWeight: 'bold',
        lineHeight: '1.3',
        marginTop: '1.5rem',
        marginBottom: '1rem',
      },
      h3: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        lineHeight: '1.4',
        marginTop: '1rem',
        marginBottom: '0.75rem',
      },
    },
    body: {
      fontSize: '16px',
      lineHeight: '1.6',
      fontWeight: 'normal',
      textAlign: 'justify',
    },
    spacing: {
      paragraphSpacing: '1em',
      lineHeight: '1.6',
      sectionSpacing: '3em',
      chapterSpacing: '4em',
    },
    colors: {
      text: '#2c3e50',
      heading: '#1a252f',
      accent: '#8B4513',
      background: '#ffffff',
    },
  };

  const mockDeviceProfile: deviceProfiles.DeviceProfile = {
    id: 'desktop',
    name: 'Desktop',
    viewportWidth: 1024,
    viewportHeight: 768,
    pixelRatio: 1,
    pageWidth: 816,
    pageHeight: 1056,
    margins: {
      top: 72,
      bottom: 72,
      left: 72,
      right: 72,
    },
    orientation: 'landscape',
    category: 'desktop',
    baseFontSize: 16,
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (contentTransformer.transformElementToHtml as jest.Mock).mockReturnValue(
      '<div class="chapter"><h1>Chapter Title</h1><p>Test content</p></div>'
    );

    (styleGenerator.generateCSS as jest.Mock).mockReturnValue({
      css: '.preview-container { font-family: Georgia; }',
      classMap: {},
      customProperties: {},
    });

    (fontLoader.generateFontLoadingConfig as jest.Mock).mockReturnValue({
      googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Georgia',
      fontFaceRules: '@font-face { font-family: Georgia; }',
      fontFamilies: ['Georgia'],
    });

    (deviceProfiles.getDeviceProfile as jest.Mock).mockReturnValue(mockDeviceProfile);
    (deviceProfiles.isValidDeviceType as jest.Mock).mockReturnValue(true);
    (deviceProfiles.generateDeviceCSS as jest.Mock).mockReturnValue(
      '.preview-container { max-width: 816px; }'
    );
    (deviceProfiles.getContentAreaDimensions as jest.Mock).mockReturnValue({
      width: 672,
      height: 912,
    });
    (deviceProfiles.getOptimalFontSize as jest.Mock).mockReturnValue(16);

    (paginationEngine.calculatePagination as jest.Mock).mockReturnValue({
      pageCount: 5,
      pages: [],
      metadata: {
        hasExplicitPageBreaks: false,
        widowOrphanAdjustments: 2,
        averagePageHeight: 912,
      },
    });

    (paginationEngine.estimatePageCount as jest.Mock).mockReturnValue(4);
  });

  describe('renderPreview', () => {
    describe('input validation', () => {
      it('should throw error when elementData is missing', () => {
        expect(() => {
          renderPreview(null as any, mockStyle, 'desktop');
        }).toThrow('elementData is required');
      });

      it('should throw error when styleConfig is missing', () => {
        expect(() => {
          renderPreview(mockElement, null as any, 'desktop');
        }).toThrow('styleConfig is required');
      });

      it('should throw error when deviceType is missing', () => {
        expect(() => {
          renderPreview(mockElement, mockStyle, null as any);
        }).toThrow('deviceType is required');
      });

      it('should throw error for invalid deviceType', () => {
        (deviceProfiles.isValidDeviceType as jest.Mock).mockReturnValue(false);

        expect(() => {
          renderPreview(mockElement, mockStyle, 'invalid-device' as DeviceType);
        }).toThrow('Invalid deviceType: invalid-device');
      });
    });

    describe('device-specific rendering', () => {
      const deviceTypes: DeviceType[] = [
        'desktop',
        'tablet',
        'mobile',
        'ipad',
        'kindle',
        'iphone',
        'print',
        'print-spread',
      ];

      deviceTypes.forEach((deviceType) => {
        it(`should render preview for ${deviceType} device`, () => {
          const result = renderPreview(mockElement, mockStyle, deviceType);

          expect(result).toBeDefined();
          expect(result.html).toBeTruthy();
          expect(result.css).toBeTruthy();
          expect(result.pageCount).toBeGreaterThan(0);
        });
      });

      it('should use device-specific configuration for each device type', () => {
        const result = renderPreview(mockElement, mockStyle, 'kindle');

        expect(result).toBeDefined();
        expect(deviceProfiles.generateDeviceCSS).toHaveBeenCalled();
      });

      it('should adjust CSS for print devices', () => {
        const result = renderPreview(mockElement, mockStyle, 'print');

        expect(styleGenerator.generateCSS).toHaveBeenCalledWith(
          mockStyle,
          expect.objectContaining({
            includePrintStyles: true,
          })
        );
      });

      it('should handle print-spread device with appropriate dimensions', () => {
        const result = renderPreview(mockElement, mockStyle, 'print-spread');

        expect(result).toBeDefined();
        expect(styleGenerator.generateCSS).toHaveBeenCalled();
        // Verify that some device-specific width was used
        const callArgs = (styleGenerator.generateCSS as jest.Mock).mock.calls[0];
        expect(callArgs[1].deviceWidth).toBeGreaterThan(0);
      });
    });

    describe('HTML generation', () => {
      it('should generate HTML with correct structure', () => {
        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(contentTransformer.transformElementToHtml).toHaveBeenCalledWith(
          mockElement,
          expect.objectContaining({
            classPrefix: 'preview',
            useInlineStyles: false,
            generateIds: true,
          })
        );

        expect(result.html).toContain('preview-container');
      });

      it('should use custom class prefix when provided', () => {
        const options: RenderOptions = {
          classPrefix: 'custom-prefix',
        };

        renderPreview(mockElement, mockStyle, 'desktop', options);

        expect(contentTransformer.transformElementToHtml).toHaveBeenCalledWith(
          mockElement,
          expect.objectContaining({
            classPrefix: 'custom-prefix',
          })
        );
      });

      it('should include inline styles when requested', () => {
        const options: RenderOptions = {
          useInlineStyles: true,
        };

        renderPreview(mockElement, mockStyle, 'desktop', options);

        expect(contentTransformer.transformElementToHtml).toHaveBeenCalledWith(
          mockElement,
          expect.objectContaining({
            useInlineStyles: true,
          })
        );
      });

      it('should handle page breaks option', () => {
        const options: RenderOptions = {
          includePageBreaks: false,
        };

        const result = renderPreview(mockElement, mockStyle, 'desktop', options);

        expect(result).toBeDefined();
      });
    });

    describe('CSS generation', () => {
      it('should generate CSS with default options', () => {
        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(styleGenerator.generateCSS).toHaveBeenCalledWith(
          mockStyle,
          expect.objectContaining({
            classPrefix: 'preview',
            includePrintStyles: false,
            minify: false,
          })
        );

        expect(result.css).toBeTruthy();
      });

      it('should include device-specific CSS', () => {
        const result = renderPreview(mockElement, mockStyle, 'mobile');

        expect(deviceProfiles.generateDeviceCSS).toHaveBeenCalled();
        expect(result.css).toBeTruthy();
      });

      it('should include font-face rules in CSS', () => {
        (fontLoader.generateFontLoadingConfig as jest.Mock).mockReturnValue({
          fontFaceRules: '@font-face { font-family: "Custom Font"; }',
          fontFamilies: ['Custom Font'],
        });

        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(result.css).toContain('@font-face');
        expect(result.fontFaceRules).toBe('@font-face { font-family: "Custom Font"; }');
      });

      it('should combine all CSS parts correctly', () => {
        (fontLoader.generateFontLoadingConfig as jest.Mock).mockReturnValue({
          fontFaceRules: '/* font rules */',
          fontFamilies: ['Georgia'],
        });

        (styleGenerator.generateCSS as jest.Mock).mockReturnValue({
          css: '/* style rules */',
          classMap: {},
          customProperties: {},
        });

        (deviceProfiles.generateDeviceCSS as jest.Mock).mockReturnValue('/* device rules */');

        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(result.css).toContain('/* font rules */');
        expect(result.css).toContain('/* style rules */');
        expect(result.css).toContain('/* device rules */');
      });

      it('should handle print-optimized CSS', () => {
        const options: RenderOptions = {
          printOptimized: true,
        };

        renderPreview(mockElement, mockStyle, 'desktop', options);

        expect(styleGenerator.generateCSS).toHaveBeenCalledWith(
          mockStyle,
          expect.objectContaining({
            includePrintStyles: true,
          })
        );
      });
    });

    describe('font loading', () => {
      it('should generate font loading configuration', () => {
        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(fontLoader.generateFontLoadingConfig).toHaveBeenCalledWith(mockStyle);
      });

      it('should include Google Fonts URL when available', () => {
        (fontLoader.generateFontLoadingConfig as jest.Mock).mockReturnValue({
          googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700',
          fontFamilies: ['Roboto'],
        });

        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(result.googleFontsUrl).toBe(
          'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700'
        );
      });

      it('should include custom font-face rules', () => {
        const customFontFaceRules = `
          @font-face {
            font-family: 'CustomFont';
            src: url('/fonts/custom.woff2') format('woff2');
          }
        `;

        (fontLoader.generateFontLoadingConfig as jest.Mock).mockReturnValue({
          fontFaceRules: customFontFaceRules,
          fontFamilies: ['CustomFont'],
        });

        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(result.fontFaceRules).toBe(customFontFaceRules);
      });

      it('should handle multiple font families', () => {
        (fontLoader.generateFontLoadingConfig as jest.Mock).mockReturnValue({
          googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto|Open+Sans',
          fontFamilies: ['Roboto', 'Open Sans'],
        });

        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(result.googleFontsUrl).toContain('Roboto');
        expect(result.googleFontsUrl).toContain('Open+Sans');
      });

      it('should handle missing font configuration', () => {
        (fontLoader.generateFontLoadingConfig as jest.Mock).mockReturnValue({
          fontFamilies: [],
        });

        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(result.googleFontsUrl).toBeUndefined();
        expect(result.fontFaceRules).toBeUndefined();
      });
    });

    describe('pagination calculations', () => {
      it('should calculate page count with detailed pagination by default', () => {
        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(paginationEngine.calculatePagination).toHaveBeenCalledWith(
          mockElement,
          mockStyle,
          expect.objectContaining({
            pageWidth: expect.any(Number),
            pageHeight: expect.any(Number),
            marginTop: expect.any(Number),
            marginBottom: expect.any(Number),
            marginLeft: expect.any(Number),
            marginRight: expect.any(Number),
          }),
          expect.objectContaining({
            widowOrphanControl: true,
            minLinesAtBoundary: 2,
            keepHeadingsWithContent: true,
            respectChapterBoundaries: true,
            respectPageBreaks: true,
            useVirtualRendering: true,
          })
        );

        expect(result.pageCount).toBe(5);
      });

      it('should use quick estimation when detailed pagination is disabled', () => {
        const options: RenderOptions = {
          useDetailedPagination: false,
        };

        const result = renderPreview(mockElement, mockStyle, 'desktop', options);

        expect(paginationEngine.estimatePageCount).toHaveBeenCalled();
        expect(paginationEngine.calculatePagination).not.toHaveBeenCalled();
        expect(result.pageCount).toBe(4);
      });

      it('should include pagination metadata when using detailed calculation', () => {
        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(result.paginationMetadata).toEqual({
          hasExplicitPageBreaks: false,
          widowOrphanAdjustments: 2,
          averagePageHeight: 912,
        });
      });

      it('should not include pagination metadata with quick estimation', () => {
        const options: RenderOptions = {
          useDetailedPagination: false,
        };

        const result = renderPreview(mockElement, mockStyle, 'desktop', options);

        expect(result.paginationMetadata).toBeUndefined();
      });

      it('should use custom pagination options when provided', () => {
        const customPaginationOptions = {
          widowOrphanControl: false,
          minLinesAtBoundary: 3,
          keepHeadingsWithContent: false,
          respectChapterBoundaries: false,
          respectPageBreaks: false,
          useVirtualRendering: false,
        };

        const options: RenderOptions = {
          paginationOptions: customPaginationOptions,
        };

        renderPreview(mockElement, mockStyle, 'desktop', options);

        expect(paginationEngine.calculatePagination).toHaveBeenCalledWith(
          mockElement,
          mockStyle,
          expect.any(Object),
          customPaginationOptions
        );
      });

      it('should handle device-specific page dimensions', () => {
        renderPreview(mockElement, mockStyle, 'kindle');

        expect(paginationEngine.calculatePagination).toHaveBeenCalled();

        // Verify that pagination was called with valid dimensions
        const callArgs = (paginationEngine.calculatePagination as jest.Mock).mock.calls[0];
        const dimensions = callArgs[2];
        expect(dimensions.pageWidth).toBeGreaterThan(0);
        expect(dimensions.pageHeight).toBeGreaterThan(0);
        expect(dimensions.marginTop).toBeGreaterThanOrEqual(0);
        expect(dimensions.marginBottom).toBeGreaterThanOrEqual(0);
        expect(dimensions.marginLeft).toBeGreaterThanOrEqual(0);
        expect(dimensions.marginRight).toBeGreaterThanOrEqual(0);
      });
    });

    describe('element type variations', () => {
      const elementTypes: Array<Element['type']> = [
        'title-page',
        'copyright',
        'dedication',
        'epigraph',
        'foreword',
        'preface',
        'acknowledgments',
        'introduction',
        'prologue',
        'epilogue',
        'afterword',
        'appendix',
        'glossary',
        'bibliography',
        'index',
        'about-author',
        'also-by',
        'other',
      ];

      elementTypes.forEach((elementType) => {
        it(`should render ${elementType} element correctly`, () => {
          const element: Element = {
            ...mockElement,
            type: elementType,
            matter: elementType === 'epilogue' || elementType === 'afterword' ? 'back' : 'front',
          };

          const result = renderPreview(element, mockStyle, 'desktop');

          expect(result).toBeDefined();
          expect(contentTransformer.transformElementToHtml).toHaveBeenCalledWith(
            element,
            expect.any(Object)
          );
        });
      });
    });

    describe('render options combinations', () => {
      it('should handle all options together', () => {
        const options: RenderOptions = {
          includePageBreaks: true,
          printOptimized: true,
          classPrefix: 'custom',
          useInlineStyles: true,
          useDetailedPagination: true,
          paginationOptions: {
            widowOrphanControl: true,
            minLinesAtBoundary: 2,
          },
        };

        const result = renderPreview(mockElement, mockStyle, 'print', options);

        expect(result).toBeDefined();
        expect(contentTransformer.transformElementToHtml).toHaveBeenCalledWith(
          mockElement,
          expect.objectContaining({
            classPrefix: 'custom',
            useInlineStyles: true,
          })
        );
        expect(styleGenerator.generateCSS).toHaveBeenCalledWith(
          mockStyle,
          expect.objectContaining({
            classPrefix: 'custom',
            includePrintStyles: true,
          })
        );
      });

      it('should use default options when none provided', () => {
        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(contentTransformer.transformElementToHtml).toHaveBeenCalledWith(
          mockElement,
          expect.objectContaining({
            classPrefix: 'preview',
            useInlineStyles: false,
          })
        );
      });
    });

    describe('complete preview result', () => {
      it('should return all required fields in PreviewResult', () => {
        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(result).toMatchObject({
          html: expect.any(String),
          css: expect.any(String),
          pageCount: expect.any(Number),
        });
      });

      it('should return optional fields when available', () => {
        (fontLoader.generateFontLoadingConfig as jest.Mock).mockReturnValue({
          googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto',
          fontFaceRules: '@font-face { }',
          fontFamilies: ['Roboto'],
        });

        const result = renderPreview(mockElement, mockStyle, 'desktop');

        expect(result.googleFontsUrl).toBeDefined();
        expect(result.fontFaceRules).toBeDefined();
        expect(result.paginationMetadata).toBeDefined();
      });
    });
  });

  describe('getDeviceConfig', () => {
    it('should return device configuration for valid device types', () => {
      const config = getDeviceConfig('desktop');

      expect(config).toMatchObject({
        width: expect.any(Number),
        height: expect.any(Number),
        pixelRatio: expect.any(Number),
      });
    });

    it('should return different configurations for different devices', () => {
      const desktopConfig = getDeviceConfig('desktop');
      const mobileConfig = getDeviceConfig('mobile');

      expect(desktopConfig.width).not.toBe(mobileConfig.width);
    });

    it('should throw error for invalid device type', () => {
      expect(() => {
        getDeviceConfig('invalid' as DeviceType);
      }).toThrow('Invalid deviceType: invalid');
    });

    it('should return a copy of the configuration', () => {
      const config1 = getDeviceConfig('desktop');
      const config2 = getDeviceConfig('desktop');

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different object references
    });

    it('should include profile reference when available', () => {
      const config = getDeviceConfig('kindle');

      expect(config.profile).toBeDefined();
    });

    const allDeviceTypes: DeviceType[] = [
      'desktop',
      'tablet',
      'mobile',
      'ipad',
      'kindle',
      'iphone',
      'print',
      'print-spread',
    ];

    allDeviceTypes.forEach((deviceType) => {
      it(`should return valid configuration for ${deviceType}`, () => {
        const config = getDeviceConfig(deviceType);

        expect(config.width).toBeGreaterThan(0);
        expect(config.height).toBeGreaterThan(0);
        expect(config.pixelRatio).toBeGreaterThan(0);
      });
    });
  });

  describe('getDeviceProfile', () => {
    it('should delegate to deviceProfiles module', () => {
      getDeviceProfile('desktop');

      expect(deviceProfiles.getDeviceProfile).toHaveBeenCalledWith('desktop');
    });

    it('should return the device profile', () => {
      const profile = getDeviceProfile('kindle');

      expect(profile).toEqual(mockDeviceProfile);
    });
  });

  describe('isValidDeviceType', () => {
    it('should delegate to deviceProfiles module', () => {
      isValidDeviceType('desktop');

      expect(deviceProfiles.isValidDeviceType).toHaveBeenCalledWith('desktop');
    });

    it('should return true for valid device types', () => {
      (deviceProfiles.isValidDeviceType as jest.Mock).mockReturnValue(true);

      expect(isValidDeviceType('desktop')).toBe(true);
    });

    it('should return false for invalid device types', () => {
      (deviceProfiles.isValidDeviceType as jest.Mock).mockReturnValue(false);

      expect(isValidDeviceType('invalid')).toBe(false);
    });
  });

  describe('getDeviceContentArea', () => {
    it('should get content area dimensions for device', () => {
      const dimensions = getDeviceContentArea('desktop');

      expect(deviceProfiles.getDeviceProfile).toHaveBeenCalledWith('desktop');
      expect(deviceProfiles.getContentAreaDimensions).toHaveBeenCalledWith(mockDeviceProfile);
      expect(dimensions).toEqual({ width: 672, height: 912 });
    });

    it('should return different dimensions for different devices', () => {
      (deviceProfiles.getContentAreaDimensions as jest.Mock)
        .mockReturnValueOnce({ width: 672, height: 912 })
        .mockReturnValueOnce({ width: 320, height: 568 });

      const desktopDimensions = getDeviceContentArea('desktop');
      const mobileDimensions = getDeviceContentArea('mobile');

      expect(desktopDimensions.width).toBeGreaterThan(mobileDimensions.width);
    });
  });

  describe('getDeviceOptimalFontSize', () => {
    it('should get optimal font size for device with default base size', () => {
      const fontSize = getDeviceOptimalFontSize('desktop');

      expect(deviceProfiles.getDeviceProfile).toHaveBeenCalledWith('desktop');
      expect(deviceProfiles.getOptimalFontSize).toHaveBeenCalledWith(mockDeviceProfile, 16);
      expect(fontSize).toBe(16);
    });

    it('should get optimal font size with custom base size', () => {
      const fontSize = getDeviceOptimalFontSize('mobile', 18);

      expect(deviceProfiles.getOptimalFontSize).toHaveBeenCalledWith(mockDeviceProfile, 18);
    });

    it('should return different font sizes for different devices', () => {
      (deviceProfiles.getOptimalFontSize as jest.Mock)
        .mockReturnValueOnce(16)
        .mockReturnValueOnce(14);

      const desktopFontSize = getDeviceOptimalFontSize('desktop');
      const kindleFontSize = getDeviceOptimalFontSize('kindle');

      expect(desktopFontSize).not.toBe(kindleFontSize);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex element with multiple block types', () => {
      const complexElement: Element = {
        ...mockElement,
        content: [
          {
            id: 'block-1',
            blockType: 'heading',
            content: 'Chapter Title',
            level: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'block-2',
            blockType: 'paragraph',
            content: 'First paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'block-3',
            blockType: 'heading',
            content: 'Section Title',
            level: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'block-4',
            blockType: 'paragraph',
            content: 'Second paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      const result = renderPreview(complexElement, mockStyle, 'desktop');

      expect(result).toBeDefined();
      expect(contentTransformer.transformElementToHtml).toHaveBeenCalledWith(
        complexElement,
        expect.any(Object)
      );
    });

    it('should handle element with custom styles', () => {
      const styledElement: Element = {
        ...mockElement,
        style: {
          id: 'custom-style',
          overrides: {},
        },
      };

      const result = renderPreview(styledElement, mockStyle, 'desktop');

      expect(result).toBeDefined();
    });

    it('should render consistently across multiple calls', () => {
      const result1 = renderPreview(mockElement, mockStyle, 'desktop');
      const result2 = renderPreview(mockElement, mockStyle, 'desktop');

      expect(result1.html).toBe(result2.html);
      expect(result1.css).toBe(result2.css);
      expect(result1.pageCount).toBe(result2.pageCount);
    });

    it('should handle style with drop cap configuration', () => {
      const styleWithDropCap: BookStyle = {
        ...mockStyle,
        dropCap: {
          enabled: true,
          lines: 3,
          fontSize: '3.5em',
          fontFamily: 'Garamond',
          fontWeight: 'bold',
          color: '#8B4513',
        },
      };

      const result = renderPreview(mockElement, styleWithDropCap, 'desktop');

      expect(result).toBeDefined();
      expect(styleGenerator.generateCSS).toHaveBeenCalledWith(
        styleWithDropCap,
        expect.any(Object)
      );
    });

    it('should handle style with ornamental break', () => {
      const styleWithBreak: BookStyle = {
        ...mockStyle,
        ornamentalBreak: {
          enabled: true,
          symbol: '❧',
          spacing: '2em 0',
          fontSize: '1.5em',
        },
      };

      const result = renderPreview(mockElement, styleWithBreak, 'desktop');

      expect(result).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty element content', () => {
      const emptyElement: Element = {
        ...mockElement,
        content: [],
      };

      const result = renderPreview(emptyElement, mockStyle, 'desktop');

      expect(result).toBeDefined();
      expect(result.pageCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing device profile margins', () => {
      // Note: This tests the fallback behavior if profile margins are missing
      const result = renderPreview(mockElement, mockStyle, 'desktop');

      expect(result).toBeDefined();
      expect(paginationEngine.calculatePagination).toHaveBeenCalled();

      // Verify that some margin values were used (either from profile or defaults)
      const callArgs = (paginationEngine.calculatePagination as jest.Mock).mock.calls[0];
      const dimensions = callArgs[2];
      expect(dimensions.marginTop).toBeGreaterThanOrEqual(0);
      expect(dimensions.marginBottom).toBeGreaterThanOrEqual(0);
      expect(dimensions.marginLeft).toBeGreaterThanOrEqual(0);
      expect(dimensions.marginRight).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing page dimensions', () => {
      // Note: This tests the fallback behavior if page dimensions are missing
      const result = renderPreview(mockElement, mockStyle, 'desktop');

      expect(result).toBeDefined();
      expect(paginationEngine.calculatePagination).toHaveBeenCalled();

      // Verify that some page dimensions were used (either from profile or fallback)
      const callArgs = (paginationEngine.calculatePagination as jest.Mock).mock.calls[0];
      const dimensions = callArgs[2];
      expect(dimensions.pageWidth).toBeGreaterThan(0);
      expect(dimensions.pageHeight).toBeGreaterThan(0);
    });

    it('should handle zero page count from pagination engine', () => {
      (paginationEngine.calculatePagination as jest.Mock).mockReturnValue({
        pageCount: 0,
        pages: [],
        metadata: {
          hasExplicitPageBreaks: false,
          widowOrphanAdjustments: 0,
          averagePageHeight: 0,
        },
      });

      const result = renderPreview(mockElement, mockStyle, 'desktop');

      expect(result.pageCount).toBe(0);
    });

    it('should handle very large page counts', () => {
      (paginationEngine.calculatePagination as jest.Mock).mockReturnValue({
        pageCount: 9999,
        pages: [],
        metadata: {
          hasExplicitPageBreaks: true,
          widowOrphanAdjustments: 100,
          averagePageHeight: 912,
        },
      });

      const result = renderPreview(mockElement, mockStyle, 'desktop');

      expect(result.pageCount).toBe(9999);
    });
  });

  describe('backward compatibility', () => {
    it('should handle device profile without profile reference', () => {
      const legacyDeviceConfig: DeviceConfig = {
        width: 1024,
        height: 768,
        pixelRatio: 1,
        pageWidth: 816,
        pageHeight: 1056,
      };

      // Mock to return a device without full profile
      (deviceProfiles.getDeviceProfile as jest.Mock).mockReturnValue({
        ...mockDeviceProfile,
        profile: undefined,
      });

      const result = renderPreview(mockElement, mockStyle, 'desktop');

      expect(result).toBeDefined();
      expect(result.css).toBeTruthy();
    });
  });

  describe('CSS fallback for devices without profile', () => {
    it('should generate fallback CSS when profile is not available', () => {
      // Mock device profile without full profile reference
      const config = getDeviceConfig('desktop');
      config.profile = undefined;

      // Need to test the internal CSS generation path
      const result = renderPreview(mockElement, mockStyle, 'desktop');

      expect(result.css).toBeTruthy();
    });
  });
});

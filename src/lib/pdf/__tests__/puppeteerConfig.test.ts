/**
 * Tests for Puppeteer page configuration
 */

import {
  configurePage,
  createDefaultPageConfig,
  type PuppeteerPageConfig,
} from '../puppeteerConfig';
import type { Page, PDFOptions } from 'puppeteer';

// Mock Puppeteer page
const createMockPage = (): jest.Mocked<Page> => {
  const mockPage = {
    setViewport: jest.fn().mockResolvedValue(undefined),
    addStyleTag: jest.fn().mockResolvedValue(undefined),
    evaluateHandle: jest.fn().mockResolvedValue(undefined),
    setContent: jest.fn().mockResolvedValue(undefined),
    pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf')),
  } as unknown as jest.Mocked<Page>;

  return mockPage;
};

describe('puppeteerConfig', () => {
  describe('createDefaultPageConfig', () => {
    it('should create default configuration', () => {
      const config = createDefaultPageConfig();

      expect(config).toEqual({
        trimSize: '6x9',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
        printBackground: true,
        quality: 'standard',
        waitForFonts: true,
        pageBreaks: {
          avoidOrphans: true,
          avoidWidows: true,
          minOrphanLines: 2,
          minWidowLines: 2,
        },
      });
    });

    it('should merge overrides with defaults', () => {
      const config = createDefaultPageConfig({
        trimSize: '5x8',
        quality: 'high',
      });

      expect(config.trimSize).toBe('5x8');
      expect(config.quality).toBe('high');
      expect(config.margins).toEqual({
        top: 0.75,
        bottom: 0.75,
        inside: 0.75,
        outside: 0.5,
      });
    });
  });

  describe('configurePage', () => {
    let mockPage: jest.Mocked<Page>;

    beforeEach(() => {
      mockPage = createMockPage();
    });

    it('should configure page with default settings', async () => {
      const config = createDefaultPageConfig();
      const result = await configurePage(mockPage, config);

      expect(result.page).toBe(mockPage);
      expect(result.pdfOptions).toBeDefined();
      expect(mockPage.setViewport).toHaveBeenCalled();
      expect(mockPage.addStyleTag).toHaveBeenCalled();
    });

    it('should set correct viewport dimensions for 6x9', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: '6x9',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
      };

      await configurePage(mockPage, config);

      expect(mockPage.setViewport).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 576, // 6 inches * 96 DPI
          height: 864, // 9 inches * 96 DPI
          deviceScaleFactor: 1.5, // standard quality
        })
      );
    });

    it('should set correct viewport dimensions for 5x8', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: '5x8',
        margins: {
          top: 1,
          bottom: 1,
          inside: 1,
          outside: 0.5,
        },
      };

      await configurePage(mockPage, config);

      expect(mockPage.setViewport).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 480, // 5 inches * 96 DPI
          height: 768, // 8 inches * 96 DPI
        })
      );
    });

    it('should handle custom trim size', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: 'custom',
        customTrimSize: {
          width: 7,
          height: 10,
        },
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
      };

      const result = await configurePage(mockPage, config);

      expect(result.pdfOptions.width).toBe('7in');
      expect(result.pdfOptions.height).toBe('10in');
    });

    it('should set scale factor based on quality', async () => {
      const configs = [
        { quality: 'draft' as const, expectedScale: 1.0 },
        { quality: 'standard' as const, expectedScale: 1.5 },
        { quality: 'high' as const, expectedScale: 2.0 },
      ];

      for (const { quality, expectedScale } of configs) {
        const mockPageLocal = createMockPage();
        const config: PuppeteerPageConfig = {
          trimSize: '6x9',
          margins: {
            top: 0.75,
            bottom: 0.75,
            inside: 0.75,
            outside: 0.5,
          },
          quality,
        };

        const result = await configurePage(mockPageLocal, config);

        expect(result.pdfOptions.scale).toBe(expectedScale);
        expect(mockPageLocal.setViewport).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceScaleFactor: expectedScale,
          })
        );
      }
    });

    it('should configure margins correctly', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: '6x9',
        margins: {
          top: 1.0,
          bottom: 0.75,
          inside: 0.875,
          outside: 0.625,
        },
      };

      const result = await configurePage(mockPage, config);

      expect(result.pdfOptions.margin).toEqual({
        top: '1in',
        bottom: '0.75in',
        left: '0.625in',
        right: '0.875in',
      });
    });

    it('should enable print background by default', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: '6x9',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
      };

      const result = await configurePage(mockPage, config);

      expect(result.pdfOptions.printBackground).toBe(true);
    });

    it('should disable print background when specified', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: '6x9',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
        printBackground: false,
      };

      const result = await configurePage(mockPage, config);

      expect(result.pdfOptions.printBackground).toBe(false);
    });

    it('should inject page break styles when configured', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: '6x9',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
        pageBreaks: {
          avoidOrphans: true,
          avoidWidows: true,
          minOrphanLines: 3,
          minWidowLines: 3,
        },
      };

      await configurePage(mockPage, config);

      expect(mockPage.addStyleTag).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('orphans: 3'),
        })
      );
      expect(mockPage.addStyleTag).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('widows: 3'),
        })
      );
    });

    it('should configure header and footer when enabled', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: '6x9',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
        headerConfig: {
          enabled: true,
          leftPage: 'Book Title',
          rightPage: 'Chapter Title',
          fontSize: 10,
          fontFamily: 'Georgia',
        },
        pageNumberConfig: {
          enabled: true,
          position: 'bottom',
          alignment: 'center',
          startNumber: 1,
          fontSize: 10,
          fontFamily: 'Georgia',
        },
      };

      const result = await configurePage(mockPage, config);

      expect(result.pdfOptions.displayHeaderFooter).toBe(true);
      expect(result.pdfOptions.headerTemplate).toBeDefined();
      expect(result.pdfOptions.footerTemplate).toBeDefined();
      expect(result.pdfOptions.headerTemplate).toContain('Book Title');
      expect(result.pdfOptions.headerTemplate).toContain('Chapter Title');
    });

    it('should not display header/footer when disabled', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: '6x9',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
        headerConfig: {
          enabled: false,
        },
        pageNumberConfig: {
          enabled: false,
          position: 'bottom',
          alignment: 'center',
        },
      };

      const result = await configurePage(mockPage, config);

      expect(result.pdfOptions.displayHeaderFooter).toBe(false);
    });

    it('should handle A4 and A5 sizes', async () => {
      const a4Config: PuppeteerPageConfig = {
        trimSize: 'A4',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
      };

      const a4Result = await configurePage(createMockPage(), a4Config);
      expect(a4Result.pdfOptions.width).toBe('8.27in');
      expect(a4Result.pdfOptions.height).toBe('11.69in');

      const a5Config: PuppeteerPageConfig = {
        trimSize: 'A5',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
      };

      const a5Result = await configurePage(createMockPage(), a5Config);
      expect(a5Result.pdfOptions.width).toBe('5.83in');
      expect(a5Result.pdfOptions.height).toBe('8.27in');
    });

    it('should skip font loading when waitForFonts is false', async () => {
      const config: PuppeteerPageConfig = {
        trimSize: '6x9',
        margins: {
          top: 0.75,
          bottom: 0.75,
          inside: 0.75,
          outside: 0.5,
        },
        waitForFonts: false,
      };

      await configurePage(mockPage, config);

      // evaluateHandle should not be called for font loading
      expect(mockPage.evaluateHandle).not.toHaveBeenCalled();
    });

    it('should return correct PDF options structure', async () => {
      const config = createDefaultPageConfig();
      const result = await configurePage(mockPage, config);

      expect(result.pdfOptions).toMatchObject({
        width: expect.any(String),
        height: expect.any(String),
        margin: expect.any(Object),
        printBackground: expect.any(Boolean),
        preferCSSPageSize: false,
        scale: expect.any(Number),
        landscape: false,
        pageRanges: '',
        omitBackground: false,
        tagged: true,
        outline: true,
      });
    });
  });
});

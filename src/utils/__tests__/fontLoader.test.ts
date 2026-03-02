/**
 * Font Loader Tests
 */

import {
  extractFontFamilies,
  extractStyleFonts,
  generateGoogleFontsUrl,
  generateFontFaceRule,
  generateFontFaceRules,
  createFontFallbackChain,
  resolveFontUrl,
  validateFontFamily,
  parseFontWeight,
  generateFontLoadingConfig,
  type CustomFontConfig,
} from '../fontLoader';
import { BookStyle } from '../../types/style';

describe('fontLoader', () => {
  describe('extractFontFamilies', () => {
    it('should extract font families from a font stack string', () => {
      const result = extractFontFamilies("'Garamond', 'EB Garamond', serif");

      expect(result.primary).toBe('Garamond');
      expect(result.families).toEqual(['Garamond', 'EB Garamond', 'serif']);
      // Single-word fonts without spaces don't need quotes
      expect(result.fallbackChain).toBe("Garamond, 'EB Garamond', serif");
    });

    it('should handle font names without quotes', () => {
      const result = extractFontFamilies('Arial, Helvetica, sans-serif');

      expect(result.primary).toBe('Arial');
      expect(result.families).toEqual(['Arial', 'Helvetica', 'sans-serif']);
    });

    it('should identify font source correctly', () => {
      const googleFont = extractFontFamilies("'EB Garamond', serif");
      expect(googleFont.source).toBe('google');

      const systemFont = extractFontFamilies('Arial, sans-serif');
      expect(systemFont.source).toBe('system');

      const customFont = extractFontFamilies("'Custom Font', serif");
      expect(customFont.source).toBe('custom');
    });

    it('should handle empty or invalid input', () => {
      const result = extractFontFamilies('');

      expect(result.primary).toBe('serif');
      expect(result.families).toEqual(['serif']);
      expect(result.source).toBe('system');
    });

    it('should preserve quotes for font names with spaces', () => {
      const result = extractFontFamilies('Times New Roman, serif');

      expect(result.fallbackChain).toBe("'Times New Roman', serif");
    });
  });

  describe('extractStyleFonts', () => {
    it('should extract all fonts from a BookStyle configuration', () => {
      const mockStyle: BookStyle = {
        id: 'test',
        name: 'Test Style',
        description: 'Test',
        category: 'serif',
        fonts: {
          body: "'Garamond', serif",
          heading: "'EB Garamond', serif",
          fallback: 'serif',
        },
        headings: {
          h1: {
            fontSize: '2em',
            fontFamily: "'Cinzel', serif",
          },
          h2: {
            fontSize: '1.5em',
          },
          h3: {
            fontSize: '1.25em',
          },
        },
        body: {
          fontSize: '1em',
          lineHeight: '1.6',
        },
        dropCap: {
          enabled: true,
          lines: 3,
          fontFamily: "'EB Garamond', serif",
        },
        ornamentalBreak: {
          enabled: true,
          symbol: '* * *',
        },
        firstParagraph: {
          enabled: true,
        },
        spacing: {
          paragraphSpacing: '1em',
          lineHeight: '1.6',
          sectionSpacing: '2em',
          chapterSpacing: '3em',
        },
        colors: {
          text: '#000',
          heading: '#000',
        },
      };

      const fonts = extractStyleFonts(mockStyle);

      expect(fonts.length).toBeGreaterThan(0);
      expect(fonts.some(f => f.primary === 'Garamond')).toBe(true);
      expect(fonts.some(f => f.primary === 'EB Garamond')).toBe(true);
      expect(fonts.some(f => f.primary === 'Cinzel')).toBe(true);
    });
  });

  describe('generateGoogleFontsUrl', () => {
    it('should generate a valid Google Fonts URL', () => {
      const url = generateGoogleFontsUrl(['EB Garamond'], [400, 700], ['normal', 'italic']);

      expect(url).toContain('https://fonts.googleapis.com/css2');
      // URLs are properly encoded, so + becomes %2B
      expect(url).toContain('EB%2BGaramond');
      expect(url).toContain('display=swap');
    });

    it('should handle multiple font families', () => {
      const url = generateGoogleFontsUrl(['EB Garamond', 'Roboto']);

      expect(url).toContain('EB%2BGaramond');
      expect(url).toContain('Roboto');
    });

    it('should return empty string for non-Google fonts', () => {
      const url = generateGoogleFontsUrl(['Arial', 'Custom Font']);

      expect(url).toBe('');
    });

    it('should handle font weights and styles', () => {
      const url = generateGoogleFontsUrl(['Roboto'], [300, 400, 700]);

      // URL encoding: ital,wght becomes ital%2Cwght
      expect(url).toContain('ital%2Cwght');
      expect(url).toContain('300');
      expect(url).toContain('400');
      expect(url).toContain('700');
    });
  });

  describe('generateFontFaceRule', () => {
    it('should generate a valid @font-face rule', () => {
      const config: CustomFontConfig = {
        family: 'Custom Font',
        weight: 400,
        style: 'normal',
        sources: [
          { url: '/fonts/custom.woff2', format: 'woff2' },
          { url: '/fonts/custom.woff', format: 'woff' },
        ],
        display: 'swap',
      };

      const css = generateFontFaceRule(config);

      expect(css).toContain('@font-face');
      expect(css).toContain("font-family: 'Custom Font'");
      expect(css).toContain('font-weight: 400');
      expect(css).toContain('font-style: normal');
      expect(css).toContain('font-display: swap');
      expect(css).toContain('/fonts/custom.woff2');
      expect(css).toContain("format('woff2')");
    });

    it('should handle unicode range', () => {
      const config: CustomFontConfig = {
        family: 'Custom Font',
        sources: [{ url: '/fonts/custom.woff2', format: 'woff2' }],
        unicodeRange: 'U+0000-00FF',
      };

      const css = generateFontFaceRule(config);

      expect(css).toContain('unicode-range: U+0000-00FF');
    });

    it('should convert ttf format to truetype', () => {
      const config: CustomFontConfig = {
        family: 'Custom Font',
        sources: [{ url: '/fonts/custom.ttf', format: 'ttf' }],
      };

      const css = generateFontFaceRule(config);

      expect(css).toContain("format('truetype')");
    });
  });

  describe('generateFontFaceRules', () => {
    it('should generate multiple @font-face rules', () => {
      const configs: CustomFontConfig[] = [
        {
          family: 'Custom Font',
          weight: 400,
          style: 'normal',
          sources: [{ url: '/fonts/custom-regular.woff2', format: 'woff2' }],
        },
        {
          family: 'Custom Font',
          weight: 700,
          style: 'normal',
          sources: [{ url: '/fonts/custom-bold.woff2', format: 'woff2' }],
        },
      ];

      const css = generateFontFaceRules(configs);

      expect(css).toContain('font-weight: 400');
      expect(css).toContain('font-weight: 700');
      expect(css).toContain('custom-regular.woff2');
      expect(css).toContain('custom-bold.woff2');
    });
  });

  describe('createFontFallbackChain', () => {
    it('should create a serif fallback chain', () => {
      const chain = createFontFallbackChain('Garamond', 'serif');

      expect(chain).toContain('Garamond');
      expect(chain).toContain('Palatino');
      expect(chain).toContain('Georgia');
      expect(chain).toContain('serif');
    });

    it('should create a sans-serif fallback chain', () => {
      const chain = createFontFallbackChain('Helvetica', 'sans-serif');

      expect(chain).toContain('Helvetica');
      expect(chain).toContain('Arial');
      expect(chain).toContain('sans-serif');
    });

    it('should create a script fallback chain', () => {
      const chain = createFontFallbackChain('Dancing Script', 'script');

      expect(chain).toContain('Dancing Script');
      expect(chain).toContain('cursive');
    });

    it('should not duplicate system fonts', () => {
      const chain = createFontFallbackChain('Arial', 'sans-serif');

      // Arial is a system font, so it should only appear once
      const arialCount = (chain.match(/Arial/g) || []).length;
      expect(arialCount).toBe(1);
    });
  });

  describe('resolveFontUrl', () => {
    it('should return empty string for system fonts', () => {
      const url = resolveFontUrl('Arial', 'system');

      expect(url).toBe('');
    });

    it('should generate Google Fonts URL', () => {
      const url = resolveFontUrl('Roboto', 'google');

      expect(url).toContain('fonts.googleapis.com');
      expect(url).toContain('Roboto');
    });

    it('should generate custom font path', () => {
      const url = resolveFontUrl('Custom Font', 'custom', '/assets/fonts');

      expect(url).toContain('/assets/fonts');
      expect(url).toContain('custom-font');
    });

    it('should normalize font names for URLs', () => {
      const url = resolveFontUrl('My Custom Font', 'custom');

      expect(url).toBe('/fonts/my-custom-font');
    });
  });

  describe('validateFontFamily', () => {
    it('should validate valid font names', () => {
      expect(validateFontFamily('Garamond')).toBe(true);
      expect(validateFontFamily('Times New Roman')).toBe(true);
      expect(validateFontFamily("'EB Garamond'")).toBe(true);
      expect(validateFontFamily('Arial, sans-serif')).toBe(true);
    });

    it('should reject invalid font names', () => {
      expect(validateFontFamily('')).toBe(false);
      expect(validateFontFamily('<script>alert(1)</script>')).toBe(false);
      expect(validateFontFamily('font{color:red;}')).toBe(false);
      expect(validateFontFamily('font();')).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(validateFontFamily(null as any)).toBe(false);
      expect(validateFontFamily(undefined as any)).toBe(false);
      expect(validateFontFamily(123 as any)).toBe(false);
    });
  });

  describe('parseFontWeight', () => {
    it('should parse numeric weights', () => {
      expect(parseFontWeight(400)).toBe(400);
      expect(parseFontWeight(700)).toBe(700);
      expect(parseFontWeight('500')).toBe(500);
    });

    it('should parse named weights', () => {
      expect(parseFontWeight('normal')).toBe(400);
      expect(parseFontWeight('bold')).toBe(700);
      expect(parseFontWeight('lighter')).toBe(300);
      expect(parseFontWeight('bolder')).toBe(700);
    });

    it('should handle undefined', () => {
      expect(parseFontWeight(undefined)).toBe(400);
    });

    it('should clamp values to valid range', () => {
      expect(parseFontWeight(50 as any)).toBe(100);
      expect(parseFontWeight(1000 as any)).toBe(900);
    });
  });

  describe('generateFontLoadingConfig', () => {
    it('should generate complete font loading configuration', () => {
      const mockStyle: BookStyle = {
        id: 'test',
        name: 'Test Style',
        description: 'Test',
        category: 'serif',
        fonts: {
          body: "'EB Garamond', serif",
          heading: "'EB Garamond', serif",
          fallback: 'serif',
        },
        headings: {
          h1: { fontSize: '2em' },
          h2: { fontSize: '1.5em' },
          h3: { fontSize: '1.25em' },
        },
        body: {
          fontSize: '1em',
          lineHeight: '1.6',
        },
        dropCap: {
          enabled: true,
          lines: 3,
        },
        ornamentalBreak: {
          enabled: true,
          symbol: '* * *',
        },
        firstParagraph: {
          enabled: true,
        },
        spacing: {
          paragraphSpacing: '1em',
          lineHeight: '1.6',
          sectionSpacing: '2em',
          chapterSpacing: '3em',
        },
        colors: {
          text: '#000',
          heading: '#000',
        },
      };

      const config = generateFontLoadingConfig(mockStyle);

      expect(config.googleFontsUrl).toBeTruthy();
      expect(config.googleFontsUrl).toContain('EB%2BGaramond');
      expect(config.fonts.length).toBeGreaterThan(0);
    });

    it('should include custom font-face rules', () => {
      const mockStyle: BookStyle = {
        id: 'test',
        name: 'Test Style',
        description: 'Test',
        category: 'serif',
        fonts: {
          body: "'Custom Font', serif",
          heading: "'Custom Font', serif",
          fallback: 'serif',
        },
        headings: {
          h1: { fontSize: '2em' },
          h2: { fontSize: '1.5em' },
          h3: { fontSize: '1.25em' },
        },
        body: {
          fontSize: '1em',
          lineHeight: '1.6',
        },
        dropCap: {
          enabled: true,
          lines: 3,
        },
        ornamentalBreak: {
          enabled: true,
          symbol: '* * *',
        },
        firstParagraph: {
          enabled: true,
        },
        spacing: {
          paragraphSpacing: '1em',
          lineHeight: '1.6',
          sectionSpacing: '2em',
          chapterSpacing: '3em',
        },
        colors: {
          text: '#000',
          heading: '#000',
        },
      };

      const customFonts: CustomFontConfig[] = [
        {
          family: 'Custom Font',
          weight: 400,
          style: 'normal',
          sources: [{ url: '/fonts/custom.woff2', format: 'woff2' }],
        },
      ];

      const config = generateFontLoadingConfig(mockStyle, customFonts);

      expect(config.fontFaceRules).toContain('@font-face');
      expect(config.fontFaceRules).toContain('Custom Font');
    });
  });
});

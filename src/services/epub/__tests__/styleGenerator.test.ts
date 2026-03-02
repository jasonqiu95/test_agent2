/**
 * Tests for EPUB CSS Generator
 */

import { epubStyleToCss } from '../styleGenerator';
import type { BookStyle } from '../../../types/style';
import type { CustomFontConfig } from '../../../utils/fontLoader';

describe('epubStyleToCss', () => {
  const mockBookStyle: BookStyle = {
    id: 'test-style',
    name: 'Test Style',
    description: 'A test book style',
    category: 'serif',
    fonts: {
      body: 'Garamond',
      heading: 'Helvetica',
      fallback: 'serif',
    },
    headings: {
      h1: {
        fontSize: '2em',
        fontWeight: 'bold',
        marginTop: '2em',
        marginBottom: '1em',
      },
      h2: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        marginTop: '1.5em',
        marginBottom: '0.75em',
      },
      h3: {
        fontSize: '1.25em',
        fontWeight: 'bold',
        marginTop: '1em',
        marginBottom: '0.5em',
      },
    },
    body: {
      fontSize: '1em',
      lineHeight: '1.6',
      textAlign: 'justify',
    },
    dropCap: {
      enabled: true,
      lines: 3,
      fontWeight: 'bold',
    },
    ornamentalBreak: {
      enabled: true,
      symbol: '***',
      textAlign: 'center',
      marginTop: '1.5em',
      marginBottom: '1.5em',
    },
    firstParagraph: {
      enabled: true,
      indent: {
        enabled: false,
      },
    },
    spacing: {
      paragraphSpacing: '1em',
      lineHeight: '1.6',
      sectionSpacing: '2em',
      chapterSpacing: '3em',
    },
    colors: {
      text: '#000000',
      heading: '#1a1a1a',
      accent: '#666666',
    },
  };

  describe('basic CSS generation', () => {
    it('should generate CSS for body text', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('body {');
      expect(css).toContain('font-family: "Garamond", serif');
      expect(css).toContain('font-size: 1em');
      expect(css).toContain('line-height: 1.6');
      expect(css).toContain('text-align: justify');
      expect(css).toContain('color: #000000');
    });

    it('should generate CSS for paragraphs', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('p {');
      expect(css).toContain('margin: 0 0 1em 0');
      expect(css).toContain('text-indent: 1.5em');
    });

    it('should include CSS reset by default', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('/* EPUB CSS Reset */');
      expect(css).toContain('margin: 0');
      expect(css).toContain('padding: 0');
    });

    it('should not include CSS reset when disabled', () => {
      const css = epubStyleToCss(mockBookStyle, { includeResetStyles: false });

      expect(css).not.toContain('/* EPUB CSS Reset */');
    });
  });

  describe('heading styles', () => {
    it('should generate CSS for h1 headings', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('h1, .chapter-title {');
      expect(css).toContain('font-size: 2em');
      expect(css).toContain('font-weight: bold');
      expect(css).toContain('margin-top: 2em');
      expect(css).toContain('margin-bottom: 1em');
      expect(css).toContain('text-align: center');
    });

    it('should generate CSS for h2 headings', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('h2 {');
      expect(css).toContain('font-size: 1.5em');
      expect(css).toContain('margin-top: 1.5em');
    });

    it('should generate CSS for h3 headings', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('h3 {');
      expect(css).toContain('font-size: 1.25em');
    });

    it('should generate default styles for h5 and h6', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('h5 {');
      expect(css).toContain('h6 {');
    });

    it('should apply custom font family to headings', () => {
      const styleWithCustomHeadingFont: BookStyle = {
        ...mockBookStyle,
        headings: {
          ...mockBookStyle.headings,
          h1: {
            ...mockBookStyle.headings.h1,
            fontFamily: 'Helvetica Neue',
          },
        },
      };

      const css = epubStyleToCss(styleWithCustomHeadingFont);

      expect(css).toContain('font-family: "Helvetica Neue", sans-serif');
    });
  });

  describe('drop cap styles', () => {
    it('should generate drop cap CSS when enabled', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('/* Drop cap styles */');
      expect(css).toContain('.first-paragraph::first-letter');
      expect(css).toContain('h1 + p::first-letter');
      expect(css).toContain('float: left');
      expect(css).toContain('font-weight: bold');
    });

    it('should not generate drop cap CSS when disabled', () => {
      const styleWithoutDropCap: BookStyle = {
        ...mockBookStyle,
        dropCap: {
          enabled: false,
          lines: 3,
        },
      };

      const css = epubStyleToCss(styleWithoutDropCap);

      expect(css).not.toContain('/* Drop cap styles */');
    });

    it('should use custom drop cap font size', () => {
      const styleWithCustomDropCap: BookStyle = {
        ...mockBookStyle,
        dropCap: {
          enabled: true,
          lines: 3,
          fontSize: '3em',
        },
      };

      const css = epubStyleToCss(styleWithCustomDropCap);

      expect(css).toContain('font-size: 3em');
    });

    it('should use color from colors config', () => {
      const styleWithDropCapColor: BookStyle = {
        ...mockBookStyle,
        colors: {
          ...mockBookStyle.colors,
          dropCap: '#cc0000',
        },
      };

      const css = epubStyleToCss(styleWithDropCapColor);

      expect(css).toContain('color: #cc0000');
    });
  });

  describe('first paragraph styles', () => {
    it('should generate first paragraph CSS when enabled', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('/* First paragraph styles */');
      expect(css).toContain('h1 + p');
      expect(css).toContain('text-indent: 0');
    });

    it('should not generate first paragraph CSS when disabled', () => {
      const styleWithoutFirstPara: BookStyle = {
        ...mockBookStyle,
        firstParagraph: {
          enabled: false,
        },
      };

      const css = epubStyleToCss(styleWithoutFirstPara);

      expect(css).not.toContain('/* First paragraph styles */');
    });

    it('should apply small-caps when specified', () => {
      const styleWithSmallCaps: BookStyle = {
        ...mockBookStyle,
        firstParagraph: {
          enabled: true,
          textTransform: 'small-caps',
          indent: {
            enabled: false,
          },
        },
      };

      const css = epubStyleToCss(styleWithSmallCaps);

      expect(css).toContain('font-variant: small-caps');
    });

    it('should apply custom letter spacing', () => {
      const styleWithLetterSpacing: BookStyle = {
        ...mockBookStyle,
        firstParagraph: {
          enabled: true,
          letterSpacing: '0.1em',
          indent: {
            enabled: false,
          },
        },
      };

      const css = epubStyleToCss(styleWithLetterSpacing);

      expect(css).toContain('letter-spacing: 0.1em');
    });
  });

  describe('block quote styles', () => {
    it('should generate block quote CSS', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('/* Block quote styles */');
      expect(css).toContain('blockquote {');
      expect(css).toContain('margin: 1.5em 2em');
      expect(css).toContain('font-style: italic');
    });

    it('should generate quote attribution styles', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('.quote-attribution');
      expect(css).toContain('text-align: right');
    });

    it('should generate epigraph styles', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('.epigraph {');
      expect(css).toContain('margin: 2em 20% 2em auto');
    });
  });

  describe('verse/poetry styles', () => {
    it('should generate verse CSS', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('/* Verse and poetry styles */');
      expect(css).toContain('.verse');
      expect(css).toContain('.poetry');
      expect(css).toContain('white-space: pre-line');
      expect(css).toContain('font-style: italic');
    });

    it('should generate verse line styles', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('.verse-line');
      expect(css).toContain('.verse-line.indent-1');
      expect(css).toContain('.verse-line.indent-2');
    });

    it('should use script font if available', () => {
      const styleWithScriptFont: BookStyle = {
        ...mockBookStyle,
        fonts: {
          ...mockBookStyle.fonts,
          script: 'Brush Script MT',
        },
      };

      const css = epubStyleToCss(styleWithScriptFont);

      expect(css).toContain('font-family: "Brush Script MT", cursive');
    });
  });

  describe('scene break styles', () => {
    it('should generate scene break CSS when enabled', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('/* Scene break styles */');
      expect(css).toContain('.scene-break');
      expect(css).toContain('hr.scene-break');
      expect(css).toContain("content: '***'");
    });

    it('should not generate scene break CSS when disabled', () => {
      const styleWithoutBreak: BookStyle = {
        ...mockBookStyle,
        ornamentalBreak: {
          enabled: false,
          symbol: '***',
        },
      };

      const css = epubStyleToCss(styleWithoutBreak);

      expect(css).not.toContain('/* Scene break styles */');
    });

    it('should use custom ornamental symbol', () => {
      const styleWithCustomSymbol: BookStyle = {
        ...mockBookStyle,
        ornamentalBreak: {
          enabled: true,
          symbol: '***',
          customSymbol: '✦ ✦ ✦',
          textAlign: 'center',
        },
      };

      const css = epubStyleToCss(styleWithCustomSymbol);

      expect(css).toContain("content: '✦ ✦ ✦'");
    });

    it('should apply custom alignment and spacing', () => {
      const styleWithCustomBreak: BookStyle = {
        ...mockBookStyle,
        ornamentalBreak: {
          enabled: true,
          symbol: '***',
          textAlign: 'right',
          marginTop: '3em',
          marginBottom: '2em',
        },
      };

      const css = epubStyleToCss(styleWithCustomBreak);

      expect(css).toContain('text-align: right');
      expect(css).toContain('margin-top: 3em');
      expect(css).toContain('margin-bottom: 2em');
    });
  });

  describe('page break styles', () => {
    it('should generate page break control CSS', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('/* Page break control */');
      expect(css).toContain('page-break-inside: avoid');
      expect(css).toContain('page-break-before: always');
      expect(css).toContain('page-break-after: avoid');
    });

    it('should prevent breaks inside blockquotes and figures', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('blockquote,');
      expect(css).toContain('figure,');
      expect(css).toContain('break-inside: avoid');
    });

    it('should force page breaks before chapters', () => {
      const css = epubStyleToCss(mockBookStyle);

      expect(css).toContain('.chapter,');
      expect(css).toContain('.chapter-start,');
      expect(css).toContain('break-before: page');
    });
  });

  describe('custom fonts', () => {
    it('should generate @font-face rules for custom fonts', () => {
      const customFonts: CustomFontConfig[] = [
        {
          family: 'Custom Serif',
          weight: 400,
          style: 'normal',
          sources: [
            { url: '/fonts/custom.woff2', format: 'woff2' },
            { url: '/fonts/custom.woff', format: 'woff' },
          ],
          display: 'swap',
        },
      ];

      const css = epubStyleToCss(mockBookStyle, { customFonts });

      expect(css).toContain('/* Custom font definitions */');
      expect(css).toContain('@font-face {');
      expect(css).toContain("font-family: 'Custom Serif'");
      expect(css).toContain("url('/fonts/custom.woff2') format('woff2')");
      expect(css).toContain('font-display: swap');
    });

    it('should handle multiple font variants', () => {
      const customFonts: CustomFontConfig[] = [
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

      const css = epubStyleToCss(mockBookStyle, { customFonts });

      expect(css).toContain('font-weight: 400');
      expect(css).toContain('font-weight: 700');
      expect(css).toContain('custom-regular.woff2');
      expect(css).toContain('custom-bold.woff2');
    });

    it('should include unicode-range when specified', () => {
      const customFonts: CustomFontConfig[] = [
        {
          family: 'Custom Font',
          sources: [{ url: '/fonts/custom.woff2', format: 'woff2' }],
          unicodeRange: 'U+0000-00FF',
        },
      ];

      const css = epubStyleToCss(mockBookStyle, { customFonts });

      expect(css).toContain('unicode-range: U+0000-00FF');
    });
  });

  describe('custom CSS', () => {
    it('should append custom CSS when provided', () => {
      const customCSS = '/* Custom styles */\n.my-custom-class { color: red; }';
      const css = epubStyleToCss(mockBookStyle, { customCSS });

      expect(css).toContain('/* Custom styles */');
      expect(css).toContain('.my-custom-class { color: red; }');
    });
  });

  describe('font stack formatting', () => {
    it('should quote font names with spaces', () => {
      const styleWithSpacedFont: BookStyle = {
        ...mockBookStyle,
        fonts: {
          ...mockBookStyle.fonts,
          body: 'EB Garamond',
        },
      };

      const css = epubStyleToCss(styleWithSpacedFont);

      expect(css).toContain('"EB Garamond"');
    });

    it('should add sans-serif fallback for sans fonts', () => {
      const styleWithSansFont: BookStyle = {
        ...mockBookStyle,
        fonts: {
          ...mockBookStyle.fonts,
          body: 'Helvetica',
        },
      };

      const css = epubStyleToCss(styleWithSansFont);

      expect(css).toContain('Helvetica, sans-serif');
    });

    it('should preserve existing font stacks', () => {
      const styleWithStack: BookStyle = {
        ...mockBookStyle,
        fonts: {
          ...mockBookStyle.fonts,
          body: 'Garamond, Georgia, serif',
        },
      };

      const css = epubStyleToCss(styleWithStack);

      expect(css).toContain('Garamond, Georgia, serif');
    });
  });
});

/**
 * Unit tests for break generation functions in bookToHtml
 * Tests scene breaks, page breaks, and ornamental breaks
 */

import {
  generateSceneBreak,
  generatePageBreak,
  generateOrnamentalBreak,
  generateOrnamentalBreakFromStyle,
  generateBreakStyles,
  OrnamentalBreakConfig,
} from '../bookToHtml';
import { BookStyle } from '../../../types/style';

describe('Break Generation Functions', () => {
  describe('generateSceneBreak', () => {
    it('should generate simple scene break without symbol', () => {
      const html = generateSceneBreak();
      expect(html).toContain('<hr');
      expect(html).toContain('class="book-scene-break"');
    });

    it('should generate scene break with custom symbol', () => {
      const html = generateSceneBreak('* * *');
      expect(html).toContain('<div');
      expect(html).toContain('class="book-scene-break book-scene-break-ornamental"');
      expect(html).toContain('* * *');
    });

    it('should generate scene break with custom class prefix', () => {
      const html = generateSceneBreak('~', 'custom');
      expect(html).toContain('class="custom-scene-break custom-scene-break-ornamental"');
    });

    it('should escape HTML in symbol', () => {
      const html = generateSceneBreak('<script>alert("xss")</script>');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should treat empty symbol as no symbol', () => {
      const html = generateSceneBreak('   ');
      expect(html).toContain('<hr');
    });
  });

  describe('generatePageBreak', () => {
    it('should generate page break with default prefix', () => {
      const html = generatePageBreak();
      expect(html).toContain('<div');
      expect(html).toContain('class="book-page-break"');
      expect(html).toContain('></div>');
    });

    it('should generate page break with custom prefix', () => {
      const html = generatePageBreak('novel');
      expect(html).toContain('class="novel-page-break"');
    });
  });

  describe('generateOrnamentalBreak', () => {
    it('should generate ornamental break with asterisk style', () => {
      const config: OrnamentalBreakConfig = {
        style: 'asterisk',
        symbol: '* * *',
      };
      const html = generateOrnamentalBreak(config);
      expect(html).toContain('class="book-ornamental-break book-ornamental-break-asterisk"');
      expect(html).toContain('* * *');
    });

    it('should generate ornamental break with symbol style', () => {
      const config: OrnamentalBreakConfig = {
        style: 'symbol',
        symbol: '❦',
      };
      const html = generateOrnamentalBreak(config);
      expect(html).toContain('class="book-ornamental-break book-ornamental-break-symbol"');
      expect(html).toContain('❦');
    });

    it('should generate ornamental break with image style', () => {
      const config: OrnamentalBreakConfig = {
        style: 'image',
        imageUrl: '/images/ornament.png',
        imageAlt: 'Decorative ornament',
      };
      const html = generateOrnamentalBreak(config);
      expect(html).toContain('class="book-ornamental-break book-ornamental-break-image"');
      expect(html).toContain('<img');
      expect(html).toContain('src="/images/ornament.png"');
      expect(html).toContain('alt="Decorative ornament"');
    });

    it('should apply inline styles from config', () => {
      const config: OrnamentalBreakConfig = {
        style: 'symbol',
        symbol: '✦',
        fontSize: '24px',
        textAlign: 'center',
        marginTop: '2em',
        marginBottom: '2em',
      };
      const html = generateOrnamentalBreak(config);
      expect(html).toContain('style="');
      expect(html).toContain('font-size: 24px');
      expect(html).toContain('text-align: center');
      expect(html).toContain('margin-top: 2em');
      expect(html).toContain('margin-bottom: 2em');
    });

    it('should fallback to symbol if image URL is missing', () => {
      const config: OrnamentalBreakConfig = {
        style: 'image',
        symbol: '❦',
      };
      const html = generateOrnamentalBreak(config);
      expect(html).not.toContain('<img');
      expect(html).toContain('❦');
    });

    it('should use default symbol if not provided', () => {
      const config: OrnamentalBreakConfig = {
        style: 'symbol',
      };
      const html = generateOrnamentalBreak(config);
      expect(html).toContain('❦');
    });

    it('should escape HTML in symbols', () => {
      const config: OrnamentalBreakConfig = {
        style: 'custom',
        symbol: '<b>bold</b>',
      };
      const html = generateOrnamentalBreak(config);
      expect(html).not.toContain('<b>');
      expect(html).toContain('&lt;b&gt;');
    });
  });

  describe('generateOrnamentalBreakFromStyle', () => {
    it('should generate ornamental break from BookStyle', () => {
      const bookStyle: Partial<BookStyle> = {
        ornamentalBreak: {
          enabled: true,
          symbol: '✻',
          fontSize: '20px',
          textAlign: 'center',
          marginTop: '1.5em',
          marginBottom: '1.5em',
        },
      } as BookStyle;

      const html = generateOrnamentalBreakFromStyle(bookStyle as BookStyle);
      expect(html).toContain('✻');
      expect(html).toContain('font-size: 20px');
      expect(html).toContain('text-align: center');
    });

    it('should fallback to scene break if ornamental breaks disabled', () => {
      const bookStyle: Partial<BookStyle> = {
        ornamentalBreak: {
          enabled: false,
          symbol: '❦',
        },
      } as BookStyle;

      const html = generateOrnamentalBreakFromStyle(bookStyle as BookStyle);
      expect(html).toContain('* * *');
    });

    it('should fallback to scene break if bookStyle is null', () => {
      const html = generateOrnamentalBreakFromStyle(null);
      expect(html).toContain('* * *');
    });

    it('should use custom symbol from BookStyle', () => {
      const bookStyle: Partial<BookStyle> = {
        ornamentalBreak: {
          enabled: true,
          symbol: '❦',
          customSymbol: '◆◆◆',
        },
      } as BookStyle;

      const html = generateOrnamentalBreakFromStyle(bookStyle as BookStyle);
      expect(html).toContain('❦');
    });
  });

  describe('generateBreakStyles', () => {
    it('should generate CSS for all break types', () => {
      const css = generateBreakStyles();
      expect(css).toContain('.book-scene-break');
      expect(css).toContain('.book-page-break');
      expect(css).toContain('.book-ornamental-break');
    });

    it('should include print-specific styles', () => {
      const css = generateBreakStyles();
      expect(css).toContain('@media print');
      expect(css).toContain('page-break-before: always');
      expect(css).toContain('break-before: page');
    });

    it('should include screen-specific styles for page breaks', () => {
      const css = generateBreakStyles();
      expect(css).toContain('@media screen');
      expect(css).toContain('display: none');
    });

    it('should support custom class prefix', () => {
      const css = generateBreakStyles('novel');
      expect(css).toContain('.novel-scene-break');
      expect(css).toContain('.novel-page-break');
      expect(css).toContain('.novel-ornamental-break');
    });
  });

  describe('Integration Tests', () => {
    it('should generate consistent class names across all break types', () => {
      const sceneBreak = generateSceneBreak('***', 'book');
      const pageBreak = generatePageBreak('book');
      const ornamentalBreak = generateOrnamentalBreak(
        { style: 'symbol', symbol: '❦' },
        'book'
      );

      expect(sceneBreak).toContain('book-scene-break');
      expect(pageBreak).toContain('book-page-break');
      expect(ornamentalBreak).toContain('book-ornamental-break');
    });

    it('should handle all ornamental break styles', () => {
      const styles: OrnamentalBreakConfig[] = [
        { style: 'asterisk', symbol: '* * *' },
        { style: 'symbol', symbol: '❦' },
        { style: 'image', imageUrl: '/test.png' },
        { style: 'custom', symbol: 'THE END' },
      ];

      styles.forEach((config) => {
        const html = generateOrnamentalBreak(config);
        expect(html).toBeTruthy();
        expect(html).toContain('ornamental-break');
      });
    });
  });
});

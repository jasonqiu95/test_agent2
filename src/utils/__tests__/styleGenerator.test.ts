/**
 * Tests for Style Generator Module
 */

import { generateCSS, generateElementCSS, mergeStyles } from '../styleGenerator';
import { BookStyle } from '../../types/style';

describe('styleGenerator', () => {
  const mockStyle: BookStyle = {
    id: 'test-style',
    name: 'Test Style',
    description: 'A test style configuration',
    category: 'serif',
    fonts: {
      body: 'Georgia',
      heading: 'Garamond',
      script: 'Brush Script MT',
      fallback: 'serif',
    },
    headings: {
      h1: {
        fontSize: '2.5em',
        fontWeight: 'bold',
        lineHeight: '1.2',
        marginTop: '2rem',
        marginBottom: '1.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
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
    dropCap: {
      enabled: true,
      lines: 3,
      fontSize: '3.5em',
      fontFamily: 'Garamond',
      fontWeight: 'bold',
      color: '#8B4513',
      marginRight: '0.1em',
    },
    ornamentalBreak: {
      enabled: true,
      symbol: '❧',
      spacing: '2em 0',
      fontSize: '1.5em',
    },
    firstParagraph: {
      enabled: true,
      textTransform: 'small-caps',
      letterSpacing: '0.1em',
      fontSize: '1.1em',
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
      dropCap: '#8B4513',
    },
  };

  describe('generateCSS', () => {
    it('should generate CSS with default options', () => {
      const result = generateCSS(mockStyle);

      expect(result.css).toBeTruthy();
      expect(result.classMap).toBeTruthy();
      expect(result.customProperties).toBeTruthy();
    });

    it('should include custom properties', () => {
      const result = generateCSS(mockStyle);

      expect(result.customProperties).toMatchObject({
        '--font-body': 'Georgia, serif',
        '--font-heading': 'Garamond, serif',
        '--font-size-base': '16px',
        '--line-height-base': '1.6',
        '--color-text': '#2c3e50',
        '--color-heading': '#1a252f',
      });
    });

    it('should generate CSS with custom class prefix', () => {
      const result = generateCSS(mockStyle, { classPrefix: 'custom' });

      expect(result.css).toContain('.custom-container');
      expect(result.css).toContain('.custom-element');
      expect(result.classMap.container).toBe('custom-container');
    });

    it('should include print styles when requested', () => {
      const result = generateCSS(mockStyle, { includePrintStyles: true });

      expect(result.css).toContain('@media print');
      expect(result.css).toContain('page-break-after');
    });

    it('should generate drop cap styles when enabled', () => {
      const result = generateCSS(mockStyle);

      expect(result.css).toContain('drop-cap');
      expect(result.css).toContain('first-letter');
      expect(result.css).toContain('float: left');
    });

    it('should not generate drop cap styles when disabled', () => {
      const styleWithoutDropCap = {
        ...mockStyle,
        dropCap: { ...mockStyle.dropCap, enabled: false },
      };
      const result = generateCSS(styleWithoutDropCap);

      expect(result.css).not.toContain('drop-cap::first-letter');
    });

    it('should generate first paragraph styles when enabled', () => {
      const result = generateCSS(mockStyle);

      expect(result.css).toContain('first-paragraph');
      expect(result.css).toContain('small-caps');
    });

    it('should generate ornamental break styles when enabled', () => {
      const result = generateCSS(mockStyle);

      expect(result.css).toContain('ornamental-break');
      expect(result.css).toContain('❧');
    });

    it('should generate heading styles for h1-h3', () => {
      const result = generateCSS(mockStyle);

      expect(result.css).toContain('.book-content h1');
      expect(result.css).toContain('.book-content h2');
      expect(result.css).toContain('.book-content h3');
      expect(result.css).toContain('font-size: 2.5em');
      expect(result.css).toContain('font-size: 2em');
      expect(result.css).toContain('font-size: 1.5em');
    });

    it('should generate element-specific styles', () => {
      const result = generateCSS(mockStyle);

      expect(result.css).toContain('data-type="title-page"');
      expect(result.css).toContain('data-type="copyright"');
      expect(result.css).toContain('data-matter="front"');
      expect(result.css).toContain('data-matter="body"');
    });

    it('should generate spacing styles', () => {
      const result = generateCSS(mockStyle);

      expect(result.css).toContain('--spacing-paragraph');
      expect(result.css).toContain('--spacing-section');
      expect(result.css).toContain('--spacing-chapter');
    });

    it('should minify CSS when requested', () => {
      const normal = generateCSS(mockStyle, { minify: false });
      const minified = generateCSS(mockStyle, { minify: true });

      expect(minified.css.length).toBeLessThan(normal.css.length);
      expect(minified.css).not.toContain('  ');
    });
  });

  describe('generateElementCSS', () => {
    it('should generate CSS for specific element type', () => {
      const css = generateElementCSS('dedication', mockStyle);

      expect(css).toContain('data-type="dedication"');
    });

    it('should apply style overrides', () => {
      const css = generateElementCSS(
        'copyright',
        mockStyle,
        { fontSize: '0.9em', fontStyle: 'italic' },
        'book'
      );

      expect(css).toContain('font-size: 0.9em');
      expect(css).toContain('data-type="copyright"');
    });

    it('should use custom class prefix', () => {
      const css = generateElementCSS('prologue', mockStyle, {}, 'custom');

      expect(css).toContain('.custom-element');
      expect(css).toContain('data-type="prologue"');
    });

    it('should handle multiple style overrides', () => {
      const css = generateElementCSS('epilogue', mockStyle, {
        fontSize: '1.2em',
        fontWeight: 'bold',
        color: '#333',
        margin: '2em 0',
        padding: '1em',
        textAlign: 'center',
      });

      expect(css).toContain('font-size: 1.2em');
      expect(css).toContain('font-weight: bold');
      expect(css).toContain('color: #333');
      expect(css).toContain('margin: 2em 0');
      expect(css).toContain('padding: 1em');
      expect(css).toContain('text-align: center');
    });
  });

  describe('mergeStyles', () => {
    it('should merge multiple style configurations', () => {
      const override1: Partial<BookStyle> = {
        body: { fontSize: '18px', lineHeight: '1.8', textAlign: 'left' },
      };

      const override2: Partial<BookStyle> = {
        colors: { text: '#000000', heading: '#333333' },
      };

      const merged = mergeStyles(mockStyle, override1, override2);

      expect(merged.body.fontSize).toBe('18px');
      expect(merged.body.lineHeight).toBe('1.8');
      expect(merged.colors.text).toBe('#000000');
      expect(merged.colors.heading).toBe('#333333');
      expect(merged.fonts.body).toBe('Georgia'); // Original preserved
    });

    it('should preserve original style when no overrides', () => {
      const merged = mergeStyles(mockStyle);

      expect(merged).toEqual(mockStyle);
    });

    it('should cascade multiple overrides correctly', () => {
      const override1: Partial<BookStyle> = {
        headings: {
          h1: { fontSize: '3em', fontWeight: 'bold' },
          h2: { fontSize: '2.2em' },
          h3: { fontSize: '1.8em' },
        },
      };

      const override2: Partial<BookStyle> = {
        headings: {
          h1: { fontSize: '3.5em' }, // Override the override
          h2: { fontWeight: 'normal' },
          h3: { fontSize: '1.6em' },
        } as any,
      };

      const merged = mergeStyles(mockStyle, override1, override2);

      expect(merged.headings.h1.fontSize).toBe('3.5em'); // Last override wins
      expect(merged.headings.h1.fontWeight).toBe('bold'); // From override1
      expect(merged.headings.h2.fontSize).toBe('2.2em'); // From override1
      expect(merged.headings.h2.fontWeight).toBe('normal'); // From override2
    });

    it('should handle partial heading overrides', () => {
      const override: Partial<BookStyle> = {
        headings: {
          h1: { fontSize: '4em' },
        } as any, // Partial override
      };

      const merged = mergeStyles(mockStyle, override);

      expect(merged.headings.h1.fontSize).toBe('4em');
      expect(merged.headings.h1.fontWeight).toBe('bold'); // Original preserved
      expect(merged.headings.h2).toEqual(mockStyle.headings.h2); // Unchanged
    });
  });
});

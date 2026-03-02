/**
 * Tests for EPUB Scene Break Converter
 */

import { describe, it, expect } from '@jest/globals';
import {
  convertSceneBreakToHtml,
  convertSceneBreaksToHtml,
  generateSceneBreakCss,
  isOrnamentalBreak,
  type SceneBreakConverterOptions,
} from '../scene-break-converter';
import { Break } from '../../types/textFeature';
import { BookStyle } from '../../types/style';

describe('convertSceneBreakToHtml', () => {
  it('should convert a simple scene break to hr tag', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
    };

    const html = convertSceneBreakToHtml(breakFeature);

    expect(html).toContain('<hr');
    expect(html).toContain('epub-scene-break');
    expect(html).toContain('epub-scene-break--simple');
    expect(html).toContain('data-break-type="scene"');
  });

  it('should convert a scene break with symbol to ornamental break when enabled', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
      symbol: '* * *',
    };

    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: true,
        symbol: '❦',
        textAlign: 'center',
        marginTop: '2em',
        marginBottom: '2em',
      },
    } as BookStyle;

    const html = convertSceneBreakToHtml(breakFeature, {
      bookStyle: bookStyle as BookStyle,
    });

    expect(html).toContain('epub-scene-break--ornamental');
    expect(html).toContain('data-ornamental="true"');
    expect(html).toContain('role="separator"');
    expect(html).toContain('aria-label="Scene break"');
  });

  it('should use custom symbol from break feature', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
      symbol: '✦',
    };

    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: true,
        symbol: '❦',
        textAlign: 'center',
      },
    } as BookStyle;

    const html = convertSceneBreakToHtml(breakFeature, {
      bookStyle: bookStyle as BookStyle,
    });

    expect(html).toContain('data-symbol="✦"');
  });

  it('should add custom class prefix', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
    };

    const html = convertSceneBreakToHtml(breakFeature, {
      classPrefix: 'custom',
    });

    expect(html).toContain('custom-scene-break');
  });

  it('should include break ID in data attributes', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
      id: 'break-123',
    };

    const html = convertSceneBreakToHtml(breakFeature);

    expect(html).toContain('data-break-id="break-123"');
  });

  it('should add additional classes', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
    };

    const html = convertSceneBreakToHtml(breakFeature, {
      additionalClasses: ['custom-class-1', 'custom-class-2'],
    });

    expect(html).toContain('custom-class-1');
    expect(html).toContain('custom-class-2');
  });

  it('should add additional data attributes', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
    };

    const html = convertSceneBreakToHtml(breakFeature, {
      additionalDataAttributes: {
        'chapter': '5',
        'position': 'middle',
      },
    });

    expect(html).toContain('data-chapter="5"');
    expect(html).toContain('data-position="middle"');
  });

  it('should escape HTML in symbol', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
      symbol: '<script>alert("xss")</script>',
    };

    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: true,
        symbol: '❦',
        textAlign: 'center',
      },
    } as BookStyle;

    const html = convertSceneBreakToHtml(breakFeature, {
      bookStyle: bookStyle as BookStyle,
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should handle section breaks with ornamental style', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'section',
    };

    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: true,
        symbol: '◆',
        textAlign: 'center',
      },
    } as BookStyle;

    const html = convertSceneBreakToHtml(breakFeature, {
      bookStyle: bookStyle as BookStyle,
    });

    expect(html).toContain('epub-scene-break--ornamental');
    expect(html).toContain('data-break-type="section"');
  });

  it('should force ornamental style when option is set', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
    };

    const html = convertSceneBreakToHtml(breakFeature, {
      forceOrnamental: true,
      bookStyle: {
        ornamentalBreak: {
          enabled: false,
          symbol: '❦',
          textAlign: 'center',
        },
      } as BookStyle,
    });

    expect(html).toContain('epub-scene-break--ornamental');
  });

  it('should apply inline styles from book config', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
    };

    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: true,
        symbol: '❦',
        textAlign: 'right',
        marginTop: '3em',
        marginBottom: '4em',
      },
    } as BookStyle;

    const html = convertSceneBreakToHtml(breakFeature, {
      bookStyle: bookStyle as BookStyle,
    });

    expect(html).toContain('style=');
    expect(html).toContain('text-align: right');
    expect(html).toContain('margin-top: 3em');
    expect(html).toContain('margin-bottom: 4em');
  });
});

describe('convertSceneBreaksToHtml', () => {
  it('should convert multiple scene breaks', () => {
    const breaks: Break[] = [
      { type: 'break', breakType: 'scene' },
      { type: 'break', breakType: 'scene', symbol: '* * *' },
      { type: 'break', breakType: 'section' },
    ];

    const htmlArray = convertSceneBreaksToHtml(breaks);

    expect(htmlArray).toHaveLength(3);
    expect(htmlArray[0]).toContain('epub-scene-break');
    expect(htmlArray[1]).toContain('data-symbol');
    expect(htmlArray[2]).toContain('data-break-type="section"');
  });

  it('should apply options to all breaks', () => {
    const breaks: Break[] = [
      { type: 'break', breakType: 'scene' },
      { type: 'break', breakType: 'scene' },
    ];

    const options: SceneBreakConverterOptions = {
      classPrefix: 'custom',
      additionalClasses: ['extra-class'],
    };

    const htmlArray = convertSceneBreaksToHtml(breaks, options);

    htmlArray.forEach(html => {
      expect(html).toContain('custom-scene-break');
      expect(html).toContain('extra-class');
    });
  });
});

describe('generateSceneBreakCss', () => {
  it('should generate basic CSS for scene breaks', () => {
    const css = generateSceneBreakCss();

    expect(css).toContain('.epub-scene-break');
    expect(css).toContain('.epub-scene-break--simple');
    expect(css).toContain('.epub-scene-break--ornamental');
    expect(css).toContain('::before');
    expect(css).toContain('page-break-inside: avoid');
  });

  it('should use custom class prefix', () => {
    const css = generateSceneBreakCss('custom');

    expect(css).toContain('.custom-scene-break');
    expect(css).toContain('.custom-scene-break--simple');
    expect(css).toContain('.custom-scene-break--ornamental');
  });

  it('should apply book style configuration', () => {
    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: true,
        symbol: '❦',
        fontSize: '24px',
        marginTop: '3em',
        marginBottom: '3em',
        textAlign: 'center',
      },
      colors: {
        text: '#000000',
        heading: '#333333',
        accent: '#cc0000',
      },
    } as BookStyle;

    const css = generateSceneBreakCss('epub', bookStyle as BookStyle);

    expect(css).toContain('font-size: 24px');
    expect(css).toContain('margin-top: 3em');
    expect(css).toContain('margin-bottom: 3em');
    expect(css).toContain('color: #cc0000');
  });

  it('should include default styles when no book style provided', () => {
    const css = generateSceneBreakCss('epub');

    expect(css).toContain('font-size: 1.2em');
    expect(css).toContain('margin-top: 2em');
    expect(css).toContain('margin-bottom: 2em');
  });

  it('should include page break control styles', () => {
    const css = generateSceneBreakCss();

    expect(css).toContain('.epub-scene-break + p');
    expect(css).toContain('page-break-before: avoid');
    expect(css).toContain('break-before: avoid');
  });
});

describe('isOrnamentalBreak', () => {
  it('should return true for scene break with ornamental enabled', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
    };

    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: true,
        symbol: '❦',
        textAlign: 'center',
      },
    } as BookStyle;

    expect(isOrnamentalBreak(breakFeature, bookStyle as BookStyle)).toBe(true);
  });

  it('should return true for section break with ornamental enabled', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'section',
    };

    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: true,
        symbol: '❦',
        textAlign: 'center',
      },
    } as BookStyle;

    expect(isOrnamentalBreak(breakFeature, bookStyle as BookStyle)).toBe(true);
  });

  it('should return false when ornamental is disabled', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
    };

    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: false,
        symbol: '❦',
        textAlign: 'center',
      },
    } as BookStyle;

    expect(isOrnamentalBreak(breakFeature, bookStyle as BookStyle)).toBe(false);
  });

  it('should return false for page breaks', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'page',
    };

    const bookStyle: Partial<BookStyle> = {
      ornamentalBreak: {
        enabled: true,
        symbol: '❦',
        textAlign: 'center',
      },
    } as BookStyle;

    expect(isOrnamentalBreak(breakFeature, bookStyle as BookStyle)).toBe(false);
  });

  it('should return false when no book style provided', () => {
    const breakFeature: Break = {
      type: 'break',
      breakType: 'scene',
    };

    expect(isOrnamentalBreak(breakFeature)).toBe(false);
  });
});

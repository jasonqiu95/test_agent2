/**
 * Tests for CSS Class System
 */

import {
  ClassBuilder,
  StyleMapper,
  CssClassNames,
  CssClassCategory,
  ThemeType,
  PrintMediaType,
  combineClasses,
  classesToAttribute,
  generatePrintClasses,
} from '../bookToHtml';
import { BookStyle, Style } from '../../../types/style';

describe('CssClassNames', () => {
  it('should have all required class categories', () => {
    expect(CssClassNames.LAYOUT).toBeDefined();
    expect(CssClassNames.SECTION).toBeDefined();
    expect(CssClassNames.ELEMENT).toBeDefined();
    expect(CssClassNames.TYPOGRAPHY).toBeDefined();
    expect(CssClassNames.STATE).toBeDefined();
    expect(CssClassNames.THEME).toBeDefined();
    expect(CssClassNames.PRINT).toBeDefined();
    expect(CssClassNames.ALIGN).toBeDefined();
    expect(CssClassNames.SPACING).toBeDefined();
  });

  it('should have consistent naming', () => {
    expect(CssClassNames.ELEMENT.PARAGRAPH).toBe('paragraph');
    expect(CssClassNames.ELEMENT.HEADING).toBe('heading');
    expect(CssClassNames.TYPOGRAPHY.DROP_CAP).toBe('drop-cap');
  });
});

describe('ClassBuilder', () => {
  describe('constructor', () => {
    it('should create with default options', () => {
      const builder = new ClassBuilder();
      const classes = builder.add('test').build();
      expect(classes).toContain('book-test');
    });

    it('should respect custom prefix', () => {
      const builder = new ClassBuilder({ prefix: 'custom' });
      const classes = builder.add('test').build();
      expect(classes).toContain('custom-test');
    });

    it('should respect theme option', () => {
      const builder = new ClassBuilder({ theme: ThemeType.SERIF });
      const classes = builder.theme().build();
      expect(classes).toContain('book-theme-serif');
    });
  });

  describe('add method', () => {
    it('should add base class', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.add('paragraph').build();
      expect(classes).toContain('book-paragraph');
    });

    it('should add class with category', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.add('paragraph', CssClassCategory.ELEMENT).build();
      expect(classes).toContain('book-element-paragraph');
    });
  });

  describe('modifier method', () => {
    it('should add class with modifier', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.modifier('paragraph', 'first').build();
      expect(classes).toContain('book-paragraph--first');
    });
  });

  describe('theme method', () => {
    it('should add default theme class', () => {
      const builder = new ClassBuilder({ prefix: 'book', theme: ThemeType.SERIF });
      const classes = builder.theme().build();
      expect(classes).toContain('book-theme-serif');
    });

    it('should add custom theme class', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.theme(ThemeType.MODERN).build();
      expect(classes).toContain('book-theme-modern');
    });
  });

  describe('state method', () => {
    it('should add state class when enabled', () => {
      const builder = new ClassBuilder({ prefix: 'book', includeState: true });
      const classes = builder.state('first').build();
      expect(classes).toContain('book-state-first');
    });

    it('should not add state class when disabled', () => {
      const builder = new ClassBuilder({ prefix: 'book', includeState: false });
      const classes = builder.state('first').build();
      expect(classes).not.toContain('book-state-first');
    });
  });

  describe('print method', () => {
    it('should add print class', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.print('page-break-before').build();
      expect(classes).toContain('book-print-page-break-before');
    });
  });

  describe('element method', () => {
    it('should add element class', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.element('dedication').build();
      expect(classes).toContain('book-element-dedication');
    });
  });

  describe('section method', () => {
    it('should add section class', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.section('front-matter').build();
      expect(classes).toContain('book-section-front-matter');
    });
  });

  describe('typography method', () => {
    it('should add typography class', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.typography('drop-cap').build();
      expect(classes).toContain('book-typography-drop-cap');
    });
  });

  describe('align method', () => {
    it('should add alignment class', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.align('center').build();
      expect(classes).toContain('book-align-center');
    });
  });

  describe('spacing method', () => {
    it('should add spacing class', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.spacing('loose').build();
      expect(classes).toContain('book-spacing-loose');
    });
  });

  describe('when method', () => {
    it('should add class when condition is true', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.when(true, 'conditional').build();
      expect(classes).toContain('book-conditional');
    });

    it('should not add class when condition is false', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.when(false, 'conditional').build();
      expect(classes).not.toContain('book-conditional');
    });
  });

  describe('raw method', () => {
    it('should add raw class without prefix', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder.raw('custom-class').build();
      expect(classes).toContain('custom-class');
    });
  });

  describe('buildString method', () => {
    it('should return space-separated string', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classString = builder
        .add('paragraph')
        .state('first')
        .buildString();
      expect(classString).toBe('book-paragraph book-state-first');
    });
  });

  describe('reset method', () => {
    it('should clear all classes', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      builder.add('paragraph').build();
      builder.reset();
      const classes = builder.build();
      expect(classes).toHaveLength(0);
    });
  });

  describe('clone method', () => {
    it('should create independent copy', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      builder.add('paragraph');
      const cloned = builder.clone();
      cloned.add('heading');

      const originalClasses = builder.build();
      const clonedClasses = cloned.build();

      expect(originalClasses).toContain('book-paragraph');
      expect(originalClasses).not.toContain('book-heading');
      expect(clonedClasses).toContain('book-paragraph');
      expect(clonedClasses).toContain('book-heading');
    });
  });

  describe('method chaining', () => {
    it('should support fluent chaining', () => {
      const builder = new ClassBuilder({ prefix: 'book' });
      const classes = builder
        .add('paragraph')
        .state('first')
        .typography('drop-cap')
        .align('justify')
        .print('page-break-avoid')
        .build();

      expect(classes).toHaveLength(5);
      expect(classes).toContain('book-paragraph');
      expect(classes).toContain('book-state-first');
      expect(classes).toContain('book-typography-drop-cap');
      expect(classes).toContain('book-align-justify');
      expect(classes).toContain('book-print-page-break-avoid');
    });
  });
});

describe('StyleMapper', () => {
  describe('constructor', () => {
    it('should create with default prefix', () => {
      const mapper = new StyleMapper();
      expect(mapper).toBeDefined();
    });

    it('should create with custom prefix', () => {
      const mapper = new StyleMapper('custom');
      expect(mapper).toBeDefined();
    });
  });

  describe('mapBookStyle', () => {
    it('should map book style to classes', () => {
      const bookStyle: BookStyle = {
        id: 'test-style',
        name: 'Test Style',
        description: 'A test style',
        category: 'serif',
        fonts: {
          body: 'Garamond',
          heading: 'Playfair',
          fallback: 'serif',
        },
        headings: {
          h1: { fontSize: '2em' },
          h2: { fontSize: '1.5em' },
          h3: { fontSize: '1.2em' },
        },
        body: {
          fontSize: '12pt',
          lineHeight: '1.5',
          textAlign: 'justify',
        },
        dropCap: {
          enabled: true,
          lines: 3,
        },
        ornamentalBreak: {
          enabled: true,
          symbol: '***',
        },
        firstParagraph: {
          enabled: true,
          indent: { enabled: false },
        },
        spacing: {
          paragraphSpacing: '1em',
          lineHeight: '1.5',
          sectionSpacing: '2em',
          chapterSpacing: '3em',
        },
        colors: {
          text: '#000',
          heading: '#000',
        },
      };

      const mapper = new StyleMapper('book');
      const classes = mapper.mapBookStyle(bookStyle);

      expect(classes).toContain('book-theme-serif');
      expect(classes).toContain('book-align-justify');
      expect(classes).toContain('book-typography-drop-cap');
    });
  });

  describe('mapStyle', () => {
    it('should map style to classes', () => {
      const style: Style = {
        name: 'test',
        fontWeight: 'bold',
        fontStyle: 'italic',
        textAlign: 'center',
        textTransform: 'uppercase',
      };

      const mapper = new StyleMapper('book');
      const classes = mapper.mapStyle(style);

      expect(classes).toContain('weight-bold');
      expect(classes).toContain('book-typography-italic');
      expect(classes).toContain('book-align-center');
      expect(classes).toContain('book-typography-uppercase');
    });
  });

  describe('mapHeadingLevel', () => {
    it('should generate heading classes', () => {
      const mapper = new StyleMapper('book');
      const classes = mapper.mapHeadingLevel(1);

      expect(classes).toContain('book-element-heading');
      expect(classes).toContain('book-heading--h1');
    });
  });

  describe('mapParagraph', () => {
    it('should generate paragraph classes for first paragraph with drop cap', () => {
      const mapper = new StyleMapper('book');
      const classes = mapper.mapParagraph(true, true);

      expect(classes).toContain('book-element-paragraph');
      expect(classes).toContain('book-state-first');
      expect(classes).toContain('book-typography-first-paragraph');
      expect(classes).toContain('book-state-has-drop-cap');
    });

    it('should generate paragraph classes for regular paragraph', () => {
      const mapper = new StyleMapper('book');
      const classes = mapper.mapParagraph(false, false);

      expect(classes).toContain('book-element-paragraph');
      expect(classes).not.toContain('book-state-first');
      expect(classes).not.toContain('book-state-has-drop-cap');
    });
  });

  describe('mapElementType', () => {
    it('should generate element type classes', () => {
      const mapper = new StyleMapper('book');
      const classes = mapper.mapElementType('dedication', 'front');

      expect(classes).toContain('book-element-dedication');
      expect(classes).toContain('book-element--front');
    });
  });
});

describe('Utility Functions', () => {
  describe('combineClasses', () => {
    it('should combine multiple class arrays', () => {
      const classes1 = ['book-paragraph', 'book-state-first'];
      const classes2 = ['book-typography-drop-cap'];
      const classes3 = ['book-align-justify'];

      const combined = combineClasses(classes1, classes2, classes3);

      expect(combined).toHaveLength(4);
      expect(combined).toContain('book-paragraph');
      expect(combined).toContain('book-state-first');
      expect(combined).toContain('book-typography-drop-cap');
      expect(combined).toContain('book-align-justify');
    });

    it('should deduplicate classes', () => {
      const classes1 = ['book-paragraph', 'book-state-first'];
      const classes2 = ['book-paragraph', 'book-typography-drop-cap'];

      const combined = combineClasses(classes1, classes2);

      expect(combined).toHaveLength(3);
      expect(combined.filter((c) => c === 'book-paragraph')).toHaveLength(1);
    });

    it('should handle undefined arrays', () => {
      const classes1 = ['book-paragraph'];
      const classes2 = undefined;

      const combined = combineClasses(classes1, classes2);

      expect(combined).toHaveLength(1);
      expect(combined).toContain('book-paragraph');
    });
  });

  describe('classesToAttribute', () => {
    it('should convert classes to HTML attribute', () => {
      const classes = ['book-paragraph', 'book-state-first'];
      const attr = classesToAttribute(classes);

      expect(attr).toBe(' class="book-paragraph book-state-first"');
    });

    it('should return empty string for empty array', () => {
      const attr = classesToAttribute([]);
      expect(attr).toBe('');
    });
  });

  describe('generatePrintClasses', () => {
    it('should generate print classes based on options', () => {
      const classes = generatePrintClasses({
        pageBreakBefore: true,
        pageBreakAfter: true,
        avoidBreak: true,
        runningHeader: true,
      });

      expect(classes).toContain('book-print-page-break-before');
      expect(classes).toContain('book-print-page-break-after');
      expect(classes).toContain('book-print-page-break-avoid');
      expect(classes).toContain('book-print-running-header');
    });

    it('should only generate specified print classes', () => {
      const classes = generatePrintClasses({
        pageBreakBefore: true,
      });

      expect(classes).toContain('book-print-page-break-before');
      expect(classes).not.toContain('book-print-page-break-after');
    });
  });
});

describe('Integration Tests', () => {
  it('should generate complete chapter opening classes', () => {
    const builder = new ClassBuilder({
      prefix: 'book',
      theme: ThemeType.ELEGANT,
    });

    // Chapter section
    const sectionClasses = builder
      .section('body-chapter')
      .theme()
      .print('page-break-before')
      .state('first')
      .build();

    expect(sectionClasses).toContain('book-section-body-chapter');
    expect(sectionClasses).toContain('book-theme-elegant');
    expect(sectionClasses).toContain('book-print-page-break-before');
    expect(sectionClasses).toContain('book-state-first');

    // First paragraph with drop cap
    builder.reset();
    const paragraphClasses = builder
      .add('paragraph')
      .state('first')
      .typography('drop-cap')
      .state('has-drop-cap')
      .build();

    expect(paragraphClasses).toContain('book-paragraph');
    expect(paragraphClasses).toContain('book-state-first');
    expect(paragraphClasses).toContain('book-typography-drop-cap');
    expect(paragraphClasses).toContain('book-state-has-drop-cap');
  });

  it('should work with StyleMapper and ClassBuilder together', () => {
    const style: Style = {
      name: 'test',
      fontWeight: 'bold',
      textAlign: 'center',
    };

    const mapper = new StyleMapper('book');
    const styleClasses = mapper.mapStyle(style);

    const builder = new ClassBuilder({ prefix: 'book' });
    const builderClasses = builder
      .add('heading')
      .print('page-break-avoid')
      .build();

    const combined = combineClasses(styleClasses, builderClasses);

    expect(combined).toContain('weight-bold');
    expect(combined).toContain('book-align-center');
    expect(combined).toContain('book-heading');
    expect(combined).toContain('book-print-page-break-avoid');
  });
});

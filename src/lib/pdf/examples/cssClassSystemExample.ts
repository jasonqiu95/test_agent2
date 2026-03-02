/**
 * CSS Class System Usage Examples
 *
 * This file demonstrates various ways to use the CSS class system
 * for generating consistent, semantic HTML classes for book elements.
 */

import {
  ClassBuilder,
  StyleMapper,
  CssClassNames,
  ThemeType,
  PrintMediaType,
  generateSectionClasses,
  generateParagraphClasses,
  generateHeadingClasses,
  generateElementClasses,
  generatePrintClasses,
  combineClasses,
  classesToAttribute,
  HtmlGenerationContext,
  SectionType,
} from '../bookToHtml';
import { BookStyle, Style } from '../../../types/style';
import { Element } from '../../../types/element';

// ============================================================================
// Example 1: Basic ClassBuilder Usage
// ============================================================================

export function example1_basicClassBuilder() {
  console.log('=== Example 1: Basic ClassBuilder ===\n');

  // Create a simple paragraph class
  const builder = new ClassBuilder({ prefix: 'book' });

  const classes = builder
    .add('paragraph')
    .state('first')
    .build();

  console.log('Paragraph classes:', classes);
  console.log('As string:', builder.buildString());
  console.log('');
}

// ============================================================================
// Example 2: Advanced ClassBuilder with Theme
// ============================================================================

export function example2_classBuilderWithTheme() {
  console.log('=== Example 2: ClassBuilder with Theme ===\n');

  const builder = new ClassBuilder({
    prefix: 'book',
    theme: ThemeType.ELEGANT,
    mediaType: PrintMediaType.PRINT,
  });

  const classes = builder
    .section('body-chapter')
    .theme()
    .print('page-break-before')
    .state('first')
    .build();

  console.log('Chapter section classes:', classes);
  console.log('HTML attribute:', classesToAttribute(classes));
  console.log('');
}

// ============================================================================
// Example 3: Drop Cap First Paragraph
// ============================================================================

export function example3_dropCapParagraph() {
  console.log('=== Example 3: Drop Cap First Paragraph ===\n');

  const builder = new ClassBuilder({ prefix: 'book' });

  const classes = builder
    .add('paragraph')
    .state('first')
    .state('has-drop-cap')
    .typography('drop-cap')
    .state('no-indent')
    .print('page-break-avoid')
    .build();

  console.log('First paragraph with drop cap:', classes);

  // Generate HTML
  const html = `<p${classesToAttribute(classes)}>
    This is the first paragraph of the chapter with a decorative drop cap.
  </p>`;

  console.log('HTML:', html);
  console.log('');
}

// ============================================================================
// Example 4: StyleMapper for BookStyle
// ============================================================================

export function example4_styleMapper() {
  console.log('=== Example 4: StyleMapper ===\n');

  const bookStyle: BookStyle = {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    description: 'An elegant serif theme',
    category: 'serif',
    fonts: {
      body: 'Garamond',
      heading: 'Playfair Display',
      fallback: 'serif',
    },
    headings: {
      h1: {
        fontSize: '2.5em',
        fontWeight: 'bold',
        marginBottom: '1em',
      },
      h2: {
        fontSize: '2em',
        fontWeight: 'bold',
        marginBottom: '0.8em',
      },
      h3: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        marginBottom: '0.6em',
      },
    },
    body: {
      fontSize: '12pt',
      lineHeight: '1.5',
      textAlign: 'justify',
    },
    dropCap: {
      enabled: true,
      lines: 3,
      fontSize: '3.5em',
      color: '#333',
    },
    ornamentalBreak: {
      enabled: true,
      symbol: '* * *',
      fontSize: '1.5em',
      textAlign: 'center',
      marginTop: '2em',
      marginBottom: '2em',
    },
    firstParagraph: {
      enabled: true,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      indent: {
        enabled: false,
      },
    },
    spacing: {
      paragraphSpacing: '1em',
      lineHeight: '1.5',
      sectionSpacing: '3em',
      chapterSpacing: '4em',
    },
    colors: {
      text: '#333',
      heading: '#000',
      accent: '#8b4513',
    },
  };

  const mapper = new StyleMapper('book');

  const classes = mapper.mapBookStyle(bookStyle);
  console.log('Book style classes:', classes);

  // Map heading
  const h1Classes = mapper.mapHeadingLevel(1);
  console.log('H1 heading classes:', h1Classes);

  // Map paragraph
  const paragraphClasses = mapper.mapParagraph(true, true);
  console.log('First paragraph with drop cap:', paragraphClasses);

  console.log('');
}

// ============================================================================
// Example 5: Element-Specific Classes
// ============================================================================

export function example5_elementClasses() {
  console.log('=== Example 5: Element-Specific Classes ===\n');

  const builder = new ClassBuilder({ prefix: 'book' });

  // Dedication element
  const dedicationClasses = builder
    .reset()
    .element('dedication')
    .section('front-matter')
    .align('center')
    .print('page-break-before')
    .build();

  console.log('Dedication classes:', dedicationClasses);

  // Epigraph element
  const epigraphClasses = builder
    .reset()
    .element('epigraph')
    .section('front-matter')
    .align('right')
    .typography('italic')
    .build();

  console.log('Epigraph classes:', epigraphClasses);

  // Chapter title
  const chapterTitleClasses = builder
    .reset()
    .add('heading')
    .modifier('heading', 'h1')
    .element('title')
    .align('center')
    .print('page-break-avoid')
    .build();

  console.log('Chapter title classes:', chapterTitleClasses);

  console.log('');
}

// ============================================================================
// Example 6: Print-Specific Classes
// ============================================================================

export function example6_printClasses() {
  console.log('=== Example 6: Print-Specific Classes ===\n');

  // Chapter opening with page break
  const chapterClasses = generatePrintClasses({
    pageBreakBefore: true,
    avoidBreak: false,
  }, 'book');

  console.log('Chapter opening (page break before):', chapterClasses);

  // Heading that should not break
  const headingClasses = generatePrintClasses({
    avoidBreak: true,
  }, 'book');

  console.log('Heading (avoid break):', headingClasses);

  // Running header
  const headerClasses = generatePrintClasses({
    runningHeader: true,
  }, 'book');

  console.log('Running header:', headerClasses);

  console.log('');
}

// ============================================================================
// Example 7: Combining Multiple Class Sources
// ============================================================================

export function example7_combineClasses() {
  console.log('=== Example 7: Combining Classes ===\n');

  const elementClasses = ['book-element-paragraph'];
  const stateClasses = ['book-state-first', 'book-state-has-drop-cap'];
  const styleClasses = ['book-align-justify', 'book-typography-drop-cap'];
  const printClasses = ['book-print-page-break-avoid'];

  const combined = combineClasses(
    elementClasses,
    stateClasses,
    styleClasses,
    printClasses
  );

  console.log('Combined classes:', combined);
  console.log('As HTML attribute:', classesToAttribute(combined));

  console.log('');
}

// ============================================================================
// Example 8: Conditional Classes
// ============================================================================

export function example8_conditionalClasses() {
  console.log('=== Example 8: Conditional Classes ===\n');

  const isFirstParagraph = true;
  const hasDropCap = true;
  const isChapterOpening = true;

  const builder = new ClassBuilder({ prefix: 'book' });

  const classes = builder
    .add('paragraph')
    .when(isFirstParagraph, 'first', undefined)
    .when(hasDropCap, 'has-drop-cap', undefined)
    .when(hasDropCap, 'drop-cap', undefined)
    .when(isChapterOpening, 'no-indent', undefined)
    .build();

  console.log('Conditional classes:', classes);

  console.log('');
}

// ============================================================================
// Example 9: Context-Based Class Generation
// ============================================================================

export function example9_contextBasedClasses() {
  console.log('=== Example 9: Context-Based Generation ===\n');

  // Mock context
  const context: HtmlGenerationContext = {
    sectionType: 'body-chapter' as SectionType,
    styleConfig: null,
    options: {
      classPrefix: 'book',
      useSemanticTags: true,
      includeAria: true,
    },
    isFirstParagraph: true,
    currentHeadingLevel: 1,
    htmlFragments: [],
    chapterIndex: 0,
  };

  // Generate section classes
  const sectionClasses = generateSectionClasses('body-chapter', context);
  console.log('Section classes:', sectionClasses);

  // Generate paragraph classes
  const paragraphClasses = generateParagraphClasses(context);
  console.log('Paragraph classes:', paragraphClasses);

  // Generate heading classes
  const headingClasses = generateHeadingClasses(1, context);
  console.log('Heading classes:', headingClasses);

  console.log('');
}

// ============================================================================
// Example 10: Complete HTML Element Generation
// ============================================================================

export function example10_completeHTMLGeneration() {
  console.log('=== Example 10: Complete HTML Generation ===\n');

  const builder = new ClassBuilder({
    prefix: 'book',
    theme: ThemeType.ELEGANT,
  });

  // Chapter section
  const chapterClasses = builder
    .section('body-chapter')
    .theme()
    .print('page-break-before')
    .buildString();

  const chapterHTML = `<section ${classesToAttribute(builder.build())}>`;

  // Chapter title
  builder.reset();
  const titleClasses = builder
    .add('heading')
    .element('title')
    .modifier('heading', 'h1')
    .align('center')
    .print('page-break-avoid')
    .buildString();

  const titleHTML = `  <h1 ${classesToAttribute(builder.build())}>Chapter One</h1>`;

  // First paragraph with drop cap
  builder.reset();
  const paragraphClasses = builder
    .add('paragraph')
    .state('first')
    .state('has-drop-cap')
    .typography('drop-cap')
    .state('no-indent')
    .buildString();

  const paragraphHTML = `  <p ${classesToAttribute(builder.build())}>
    This is the opening paragraph of the chapter, featuring a beautiful drop cap.
  </p>`;

  // Regular paragraph
  builder.reset();
  const regularClasses = builder
    .add('paragraph')
    .align('justify')
    .buildString();

  const regularHTML = `  <p ${classesToAttribute(builder.build())}>
    This is a regular paragraph with standard indentation and justification.
  </p>`;

  const closingHTML = '</section>';

  const completeHTML = [
    chapterHTML,
    titleHTML,
    paragraphHTML,
    regularHTML,
    closingHTML,
  ].join('\n');

  console.log('Complete chapter HTML:\n');
  console.log(completeHTML);
  console.log('');
}

// ============================================================================
// Run All Examples
// ============================================================================

export function runAllExamples() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     CSS Class System - Usage Examples                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  example1_basicClassBuilder();
  example2_classBuilderWithTheme();
  example3_dropCapParagraph();
  example4_styleMapper();
  example5_elementClasses();
  example6_printClasses();
  example7_combineClasses();
  example8_conditionalClasses();
  example9_contextBasedClasses();
  example10_completeHTMLGeneration();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     All Examples Completed                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

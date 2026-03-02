/**
 * Usage Examples for EPUB Scene Break Converter
 *
 * This file demonstrates how to use the scene break converter
 * to transform scene breaks into EPUB-compatible HTML with proper
 * CSS classes and data attributes for styling.
 */

import {
  convertSceneBreakToHtml,
  convertSceneBreaksToHtml,
  generateSceneBreakCss,
  isOrnamentalBreak,
} from '../scene-break-converter';
import { Break } from '../../types/textFeature';
import { BookStyle } from '../../types/style';

// ============================================================================
// Example 1: Simple Scene Break
// ============================================================================

export function exampleSimpleBreak() {
  const breakFeature: Break = {
    type: 'break',
    breakType: 'scene',
  };

  const html = convertSceneBreakToHtml(breakFeature);

  console.log('Simple Scene Break:');
  console.log(html);
  // Output: <hr class="epub-scene-break epub-scene-break--simple" data-break-type="scene" />
}

// ============================================================================
// Example 2: Ornamental Break with BookStyle
// ============================================================================

export function exampleOrnamentalBreak() {
  const breakFeature: Break = {
    type: 'break',
    breakType: 'scene',
    symbol: '* * *',
  };

  const bookStyle: BookStyle = {
    id: 'classic-serif',
    name: 'Classic Serif',
    category: 'serif',
    fonts: {
      body: 'Georgia',
      heading: 'Garamond',
      fallback: 'serif',
    },
    headings: {} as any,
    body: {} as any,
    dropCap: {} as any,
    firstParagraph: {} as any,
    spacing: {} as any,
    colors: {
      text: '#000000',
      heading: '#333333',
      accent: '#8B4513',
    },
    ornamentalBreak: {
      enabled: true,
      symbol: '❦',
      fontSize: '20px',
      textAlign: 'center',
      marginTop: '2em',
      marginBottom: '2em',
    },
  };

  const html = convertSceneBreakToHtml(breakFeature, {
    bookStyle,
  });

  console.log('Ornamental Break:');
  console.log(html);
  // Output: <hr class="epub-scene-break epub-scene-break--ornamental"
  //           data-break-type="scene" data-ornamental="true" data-symbol="* * *"
  //           style="text-align: center; margin-top: 2em; margin-bottom: 2em"
  //           role="separator" aria-label="Scene break" />
}

// ============================================================================
// Example 3: Custom Class Prefix
// ============================================================================

export function exampleCustomPrefix() {
  const breakFeature: Break = {
    type: 'break',
    breakType: 'scene',
    id: 'break-chapter-5',
  };

  const html = convertSceneBreakToHtml(breakFeature, {
    classPrefix: 'my-book',
  });

  console.log('Custom Class Prefix:');
  console.log(html);
  // Output: <hr class="my-book-scene-break my-book-scene-break--simple"
  //           data-break-type="scene" data-break-id="break-chapter-5" />
}

// ============================================================================
// Example 4: Additional Classes and Data Attributes
// ============================================================================

export function exampleAdditionalAttributes() {
  const breakFeature: Break = {
    type: 'break',
    breakType: 'section',
  };

  const html = convertSceneBreakToHtml(breakFeature, {
    additionalClasses: ['custom-styling', 'special-break'],
    additionalDataAttributes: {
      'chapter': '7',
      'position': 'end',
      'style-theme': 'dark',
    },
  });

  console.log('Additional Attributes:');
  console.log(html);
  // Output includes custom-styling, special-break classes
  // and data-chapter, data-position, data-style-theme attributes
}

// ============================================================================
// Example 5: Batch Conversion
// ============================================================================

export function exampleBatchConversion() {
  const breaks: Break[] = [
    {
      type: 'break',
      breakType: 'scene',
      id: 'break-1',
    },
    {
      type: 'break',
      breakType: 'scene',
      symbol: '* * *',
      id: 'break-2',
    },
    {
      type: 'break',
      breakType: 'section',
      symbol: '◆',
      id: 'break-3',
    },
  ];

  const bookStyle: Partial<BookStyle> = {
    ornamentalBreak: {
      enabled: true,
      symbol: '❦',
      textAlign: 'center',
      marginTop: '2em',
      marginBottom: '2em',
    },
    colors: {
      text: '#000000',
      heading: '#333333',
      accent: '#cc0000',
    },
  } as BookStyle;

  const htmlArray = convertSceneBreaksToHtml(breaks, {
    bookStyle: bookStyle as BookStyle,
    classPrefix: 'epub',
  });

  console.log('Batch Conversion:');
  htmlArray.forEach((html, index) => {
    console.log(`Break ${index + 1}:`);
    console.log(html);
  });
}

// ============================================================================
// Example 6: Generate CSS Stylesheet
// ============================================================================

export function exampleGenerateCSS() {
  const bookStyle: Partial<BookStyle> = {
    ornamentalBreak: {
      enabled: true,
      symbol: '❦',
      fontSize: '24px',
      textAlign: 'center',
      marginTop: '3em',
      marginBottom: '3em',
    },
    colors: {
      text: '#000000',
      heading: '#333333',
      accent: '#8B4513',
    },
  } as BookStyle;

  const css = generateSceneBreakCss('epub', bookStyle as BookStyle);

  console.log('Generated CSS:');
  console.log(css);
}

// ============================================================================
// Example 7: Check if Break is Ornamental
// ============================================================================

export function exampleCheckOrnamental() {
  const sceneBreak: Break = {
    type: 'break',
    breakType: 'scene',
  };

  const pageBreak: Break = {
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

  console.log('Scene break is ornamental:', isOrnamentalBreak(sceneBreak, bookStyle as BookStyle));
  // Output: true

  console.log('Page break is ornamental:', isOrnamentalBreak(pageBreak, bookStyle as BookStyle));
  // Output: false
}

// ============================================================================
// Example 8: Complete EPUB Chapter with Scene Breaks
// ============================================================================

export function exampleCompleteChapter() {
  const bookStyle: BookStyle = {
    id: 'classic-serif',
    name: 'Classic Serif',
    category: 'serif',
    fonts: {
      body: 'Georgia',
      heading: 'Garamond',
      fallback: 'serif',
    },
    headings: {} as any,
    body: {} as any,
    dropCap: {} as any,
    firstParagraph: {} as any,
    spacing: {} as any,
    colors: {
      text: '#1a1a1a',
      heading: '#000000',
      accent: '#8B4513',
      background: '#ffffff',
    },
    ornamentalBreak: {
      enabled: true,
      symbol: '✦',
      fontSize: '20px',
      textAlign: 'center',
      marginTop: '2.5em',
      marginBottom: '2.5em',
    },
  };

  // Generate CSS
  const css = generateSceneBreakCss('epub', bookStyle);

  // Create breaks
  const break1: Break = {
    type: 'break',
    breakType: 'scene',
    id: 'break-scene-1',
  };

  const break2: Break = {
    type: 'break',
    breakType: 'scene',
    symbol: '* * *',
    id: 'break-scene-2',
  };

  const html1 = convertSceneBreakToHtml(break1, { bookStyle });
  const html2 = convertSceneBreakToHtml(break2, { bookStyle });

  // Construct complete chapter HTML
  const chapterHtml = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Chapter One</title>
  <style>
${css}

body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 0;
  padding: 1em;
  color: #1a1a1a;
}

p {
  text-indent: 1.5em;
  margin: 0 0 0.5em 0;
}

h1 {
  text-align: center;
  margin: 2em 0 1em 0;
}
  </style>
</head>
<body>
  <h1 class="chapter-title">Chapter One</h1>

  <p>The morning sun cast long shadows across the village square.
     Sarah walked briskly, her mind occupied with the events of the
     previous evening.</p>

  <p>She had made a decision that would change everything.</p>

  ${html1}

  <p>Three hours later, in a different part of town, Marcus received
     an unexpected visitor.</p>

  <p>The knock on the door was soft but insistent.</p>

  ${html2}

  <p>The next morning brought clarity. The decision had been the right
     one, though the path forward remained uncertain.</p>

  <p>Sarah smiled, knowing that whatever came next, she was ready.</p>
</body>
</html>
  `.trim();

  console.log('Complete Chapter HTML:');
  console.log(chapterHtml);
}

// ============================================================================
// Run All Examples
// ============================================================================

export function runAllExamples() {
  console.log('=== EPUB Scene Break Converter Examples ===\n');

  exampleSimpleBreak();
  console.log('\n---\n');

  exampleOrnamentalBreak();
  console.log('\n---\n');

  exampleCustomPrefix();
  console.log('\n---\n');

  exampleAdditionalAttributes();
  console.log('\n---\n');

  exampleBatchConversion();
  console.log('\n---\n');

  exampleGenerateCSS();
  console.log('\n---\n');

  exampleCheckOrnamental();
  console.log('\n---\n');

  exampleCompleteChapter();
}

// Uncomment to run examples
// runAllExamples();

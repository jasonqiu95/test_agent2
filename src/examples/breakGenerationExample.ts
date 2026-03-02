/**
 * Example demonstrating break generation functionality
 * Shows how to use scene breaks, page breaks, and ornamental breaks
 */

import {
  generateSceneBreak,
  generatePageBreak,
  generateOrnamentalBreak,
  generateOrnamentalBreakFromStyle,
  generateBreakStyles,
  OrnamentalBreakConfig,
} from '../lib/pdf/bookToHtml';
import { BookStyle } from '../types/style';

// ============================================================================
// Example 1: Simple Scene Breaks
// ============================================================================

function exampleSceneBreaks() {
  console.log('=== Scene Break Examples ===\n');

  // Simple horizontal rule
  const simpleBreak = generateSceneBreak();
  console.log('Simple scene break (hr):');
  console.log(simpleBreak);
  console.log();

  // Scene break with asterisks
  const asteriskBreak = generateSceneBreak('* * *');
  console.log('Scene break with asterisks:');
  console.log(asteriskBreak);
  console.log();

  // Scene break with custom symbol
  const symbolBreak = generateSceneBreak('~');
  console.log('Scene break with custom symbol:');
  console.log(symbolBreak);
  console.log();
}

// ============================================================================
// Example 2: Page Breaks
// ============================================================================

function examplePageBreaks() {
  console.log('=== Page Break Examples ===\n');

  // Standard page break for print
  const pageBreak = generatePageBreak();
  console.log('Page break (for print CSS):');
  console.log(pageBreak);
  console.log();

  // With custom class prefix
  const customPrefixBreak = generatePageBreak('novel');
  console.log('Page break with custom prefix:');
  console.log(customPrefixBreak);
  console.log();
}

// ============================================================================
// Example 3: Ornamental Breaks - Different Styles
// ============================================================================

function exampleOrnamentalBreaks() {
  console.log('=== Ornamental Break Examples ===\n');

  // Asterisk style
  const asteriskConfig: OrnamentalBreakConfig = {
    style: 'asterisk',
    symbol: '* * *',
    fontSize: '18px',
    textAlign: 'center',
    marginTop: '2em',
    marginBottom: '2em',
  };
  const asteriskBreak = generateOrnamentalBreak(asteriskConfig);
  console.log('Ornamental break - Asterisk style:');
  console.log(asteriskBreak);
  console.log();

  // Symbol style with unicode character
  const symbolConfig: OrnamentalBreakConfig = {
    style: 'symbol',
    symbol: '❦',
    fontSize: '24px',
    textAlign: 'center',
    marginTop: '2em',
    marginBottom: '2em',
  };
  const symbolBreak = generateOrnamentalBreak(symbolConfig);
  console.log('Ornamental break - Symbol style:');
  console.log(symbolBreak);
  console.log();

  // Image style
  const imageConfig: OrnamentalBreakConfig = {
    style: 'image',
    imageUrl: '/assets/ornaments/floral-divider.svg',
    imageAlt: 'Floral divider ornament',
    textAlign: 'center',
    marginTop: '3em',
    marginBottom: '3em',
  };
  const imageBreak = generateOrnamentalBreak(imageConfig);
  console.log('Ornamental break - Image style:');
  console.log(imageBreak);
  console.log();

  // Custom style with text
  const customConfig: OrnamentalBreakConfig = {
    style: 'custom',
    symbol: '— THE END —',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '4em',
    marginBottom: '4em',
  };
  const customBreak = generateOrnamentalBreak(customConfig);
  console.log('Ornamental break - Custom style:');
  console.log(customBreak);
  console.log();
}

// ============================================================================
// Example 4: Using BookStyle Configuration
// ============================================================================

function exampleBookStyleBreaks() {
  console.log('=== BookStyle Configuration Examples ===\n');

  // Create a sample BookStyle
  const bookStyle: Partial<BookStyle> = {
    id: 'classic-serif',
    name: 'Classic Serif',
    ornamentalBreak: {
      enabled: true,
      symbol: '✻',
      fontSize: '20px',
      textAlign: 'center',
      marginTop: '2.5em',
      marginBottom: '2.5em',
    },
  } as BookStyle;

  const breakFromStyle = generateOrnamentalBreakFromStyle(bookStyle as BookStyle);
  console.log('Ornamental break from BookStyle:');
  console.log(breakFromStyle);
  console.log();

  // With custom symbol
  const customSymbolStyle: Partial<BookStyle> = {
    ...bookStyle,
    ornamentalBreak: {
      enabled: true,
      symbol: '◆',
      customSymbol: '◆◆◆',
      fontSize: '16px',
      textAlign: 'center',
      marginTop: '1.5em',
      marginBottom: '1.5em',
    },
  } as BookStyle;

  const customSymbolBreak = generateOrnamentalBreakFromStyle(
    customSymbolStyle as BookStyle
  );
  console.log('Ornamental break with custom symbol:');
  console.log(customSymbolBreak);
  console.log();
}

// ============================================================================
// Example 5: Complete HTML Document with Breaks
// ============================================================================

function exampleCompleteDocument() {
  console.log('=== Complete HTML Document Example ===\n');

  const styles = generateBreakStyles('book');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chapter with Breaks</title>
  <style>
${styles}

body {
  font-family: Georgia, serif;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 2em;
}

p {
  text-indent: 1.5em;
  margin: 0;
  margin-bottom: 0.5em;
}
  </style>
</head>
<body>
  <h1>Chapter One</h1>

  <p>The morning sun cast long shadows across the village square. Sarah walked briskly, her mind occupied with the events of the previous evening.</p>

  <p>She had made a decision that would change everything.</p>

  ${generateSceneBreak('* * *')}

  <p>Three hours later, in a different part of town, Marcus received an unexpected visitor.</p>

  <p>The knock on the door was soft but insistent.</p>

  ${generateOrnamentalBreak({
    style: 'symbol',
    symbol: '❦',
    fontSize: '24px',
    textAlign: 'center',
    marginTop: '2em',
    marginBottom: '2em',
  })}

  <p>The next morning brought clarity. The decision had been the right one, though the path forward remained uncertain.</p>

  <p>Sarah smiled, knowing that whatever came next, she was ready.</p>

  ${generatePageBreak()}

  <h2>Chapter Two</h2>

  <p>A new chapter begins...</p>
</body>
</html>
  `.trim();

  console.log(html);
}

// ============================================================================
// Example 6: Different Ornamental Break Symbols
// ============================================================================

function exampleOrnamentalSymbols() {
  console.log('=== Different Ornamental Symbols ===\n');

  const symbols = [
    { name: 'Floral Heart', symbol: '❦' },
    { name: 'Four Pointed Star', symbol: '✦' },
    { name: 'Eight Pointed Star', symbol: '✻' },
    { name: 'Reference Mark', symbol: '※' },
    { name: 'Diamond', symbol: '◆' },
    { name: 'Three Diamonds', symbol: '◆◆◆' },
    { name: 'Snowflake', symbol: '❄' },
    { name: 'Flower', symbol: '✿' },
    { name: 'Sun', symbol: '☼' },
    { name: 'Asterisk Operator', symbol: '⁎' },
  ];

  symbols.forEach(({ name, symbol }) => {
    const config: OrnamentalBreakConfig = {
      style: 'symbol',
      symbol,
      fontSize: '24px',
      textAlign: 'center',
    };
    console.log(`${name} (${symbol}):`);
    console.log(generateOrnamentalBreak(config));
    console.log();
  });
}

// ============================================================================
// Example 7: Print-specific Page Breaks
// ============================================================================

function examplePrintPageBreaks() {
  console.log('=== Print-specific Page Break Usage ===\n');

  const html = `
<div class="chapter">
  <h1>Chapter One</h1>
  <p>Content of chapter one...</p>
  ${generatePageBreak()}
</div>

<div class="chapter">
  <h1>Chapter Two</h1>
  <p>Content of chapter two...</p>
  ${generatePageBreak()}
</div>

<div class="chapter">
  <h1>Chapter Three</h1>
  <p>Content of chapter three...</p>
</div>
  `.trim();

  console.log('HTML with page breaks between chapters:');
  console.log(html);
  console.log();

  console.log('Note: Page breaks are hidden on screen but force page breaks when printing.');
}

// ============================================================================
// Run Examples
// ============================================================================

export function runBreakGenerationExamples() {
  exampleSceneBreaks();
  examplePageBreaks();
  exampleOrnamentalBreaks();
  exampleBookStyleBreaks();
  exampleOrnamentalSymbols();
  examplePrintPageBreaks();
  exampleCompleteDocument();
}

// Uncomment to run examples
// runBreakGenerationExamples();

/**
 * Usage Examples for Matter Converter
 *
 * This file demonstrates how to use the matter converter to create
 * XHTML files for front and back matter in EPUB 3 format.
 */

import {
  convertTitlePage,
  convertCopyrightPage,
  convertDedication,
  convertAboutAuthor,
  convertAlsoBy,
  convertMatterElement,
  convertFrontMatterBatch,
  convertBackMatterBatch,
  validateMatterElement,
  getMatterFilename,
  type MatterConverterOptions,
} from '../matter-converter';
import { Element } from '../../types/element';
import { TextBlock } from '../../types/textBlock';

// ============================================================================
// Example 1: Create a Title Page
// ============================================================================

function exampleTitlePage() {
  const xhtml = convertTitlePage(
    'The Great Adventure',
    'Jane Doe',
    'A Journey Through Time',
    'Acme Publishing'
  );

  console.log('Title Page XHTML:');
  console.log(xhtml);
  // Output: Complete XHTML document with title, subtitle, author, and publisher
}

// ============================================================================
// Example 2: Create a Copyright Page
// ============================================================================

function exampleCopyrightPage() {
  const xhtml = convertCopyrightPage(
    2026,
    'Jane Doe',
    {
      publisher: 'Acme Publishing',
      isbn: '978-0-12-345678-9',
      edition: 'First Edition',
    }
  );

  console.log('Copyright Page XHTML:');
  console.log(xhtml);
  // Output: Complete XHTML document with copyright information
}

// ============================================================================
// Example 3: Create a Dedication
// ============================================================================

function exampleDedication() {
  const xhtml = convertDedication('For my family, who believed in me.');

  console.log('Dedication XHTML:');
  console.log(xhtml);
  // Output: Complete XHTML document with dedication text
}

// ============================================================================
// Example 4: Create About the Author Page
// ============================================================================

function exampleAboutAuthor() {
  const xhtml = convertAboutAuthor(
    'Jane Doe',
    'Jane Doe is an award-winning author of numerous bestsellers. She lives in New York with her cat.',
    'www.janedoe.com'
  );

  console.log('About the Author XHTML:');
  console.log(xhtml);
  // Output: Complete XHTML document with author biography
}

// ============================================================================
// Example 5: Create Also By Page
// ============================================================================

function exampleAlsoBy() {
  const books = [
    'The First Adventure',
    'The Second Journey',
    'The Final Chapter',
  ];

  const xhtml = convertAlsoBy('Jane Doe', books);

  console.log('Also By XHTML:');
  console.log(xhtml);
  // Output: Complete XHTML document with list of books
}

// ============================================================================
// Example 6: Convert Custom Front Matter Element
// ============================================================================

function exampleCustomFrontMatter() {
  // Create a preface element
  const preface: Element = {
    id: 'preface',
    type: 'preface',
    matter: 'front',
    title: 'Preface',
    content: [
      {
        id: 'h1',
        content: 'Preface',
        blockType: 'heading',
        level: 1,
      },
      {
        id: 'p1',
        content: 'This book has been a labor of love for many years.',
        blockType: 'paragraph',
      },
      {
        id: 'p2',
        content: 'I hope you enjoy reading it as much as I enjoyed writing it.',
        blockType: 'paragraph',
      },
    ],
  };

  // Validate the element first
  const validation = validateMatterElement(preface);
  if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    return;
  }

  // Convert to XHTML
  const result = convertMatterElement(preface);

  console.log('Preface XHTML:');
  console.log(result.xhtml);
  console.log('Metadata:', result.metadata);
  // Output: Complete XHTML document with preface content
}

// ============================================================================
// Example 7: Convert Custom Back Matter Element
// ============================================================================

function exampleCustomBackMatter() {
  // Create an epilogue element
  const epilogue: Element = {
    id: 'epilogue',
    type: 'epilogue',
    matter: 'back',
    title: 'Epilogue',
    content: [
      {
        id: 'h1',
        content: 'Epilogue',
        blockType: 'heading',
        level: 1,
      },
      {
        id: 'p1',
        content: 'Years later, the adventure continued...',
        blockType: 'paragraph',
      },
    ],
  };

  const result = convertMatterElement(epilogue);

  console.log('Epilogue XHTML:');
  console.log(result.xhtml);
  // Output: Complete XHTML document with epilogue content
}

// ============================================================================
// Example 8: Batch Convert Front Matter
// ============================================================================

function exampleBatchFrontMatter() {
  const frontMatterElements: Element[] = [
    {
      id: 'dedication',
      type: 'dedication',
      matter: 'front',
      title: 'Dedication',
      content: [
        {
          id: 'p1',
          content: 'For my family.',
          blockType: 'paragraph',
        },
      ],
    },
    {
      id: 'preface',
      type: 'preface',
      matter: 'front',
      title: 'Preface',
      content: [
        {
          id: 'h1',
          content: 'Preface',
          blockType: 'heading',
          level: 1,
        },
        {
          id: 'p1',
          content: 'This is the preface.',
          blockType: 'paragraph',
        },
      ],
    },
  ];

  const results = convertFrontMatterBatch(frontMatterElements);

  results.forEach(result => {
    console.log(`${result.elementType} - ${getMatterFilename({
      id: result.elementType,
      type: result.elementType,
      matter: result.matterType,
      title: result.elementType,
      content: [],
    })}`);
    console.log('Block count:', result.metadata?.blockCount);
    console.log('Has images:', result.metadata?.hasImages);
    console.log('Has links:', result.metadata?.hasLinks);
  });
}

// ============================================================================
// Example 9: Using Custom Options
// ============================================================================

function exampleWithOptions() {
  const options: MatterConverterOptions = {
    stylesheets: ['styles/matter.css', 'styles/common.css'],
    lang: 'en-US',
    dir: 'ltr',
    preserveAttributes: true,
    sectionClass: 'custom-matter',
  };

  const element: Element = {
    id: 'acknowledgments',
    type: 'acknowledgments',
    matter: 'front',
    title: 'Acknowledgments',
    content: [
      {
        id: 'h1',
        content: 'Acknowledgments',
        blockType: 'heading',
        level: 1,
      },
      {
        id: 'p1',
        content: 'I would like to thank...',
        blockType: 'paragraph',
      },
    ],
  };

  const result = convertMatterElement(element, options);

  console.log('Acknowledgments with custom options:');
  console.log(result.xhtml);
  // Output includes custom stylesheets and language attributes
}

// ============================================================================
// Example 10: Rich Text Content
// ============================================================================

function exampleRichText() {
  const element: Element = {
    id: 'intro',
    type: 'introduction',
    matter: 'front',
    title: 'Introduction',
    content: [
      {
        id: 'h1',
        content: 'Introduction',
        blockType: 'heading',
        level: 1,
      },
      {
        id: 'p1',
        content: 'Visit our website',
        blockType: 'paragraph',
        richText: {
          plainText: 'Visit our website at example.com for more information.',
          segments: [
            {
              text: 'Visit our website at ',
            },
            {
              type: 'link',
              text: 'example.com',
              url: 'https://example.com',
            },
            {
              text: ' for more information.',
            },
          ],
        },
      },
    ],
  };

  const result = convertMatterElement(element);

  console.log('Introduction with rich text:');
  console.log(result.xhtml);
  console.log('Has links:', result.metadata?.hasLinks);
  // Output includes properly formatted hyperlinks
}

// ============================================================================
// Example 11: Complex Front Matter with Styling
// ============================================================================

function exampleComplexFrontMatter() {
  const element: Element = {
    id: 'epigraph',
    type: 'epigraph',
    matter: 'front',
    title: 'Epigraph',
    content: [
      {
        id: 'quote',
        content: 'The journey of a thousand miles begins with one step.',
        blockType: 'paragraph',
        style: {
          name: 'epigraph-quote',
          type: 'inline',
          alignment: 'center',
        },
      },
      {
        id: 'attribution',
        content: '— Lao Tzu',
        blockType: 'paragraph',
        style: {
          name: 'epigraph-attribution',
          type: 'inline',
          alignment: 'right',
        },
      },
    ],
  };

  const options: MatterConverterOptions = {
    stylesheets: ['styles/epigraph.css'],
    preserveAttributes: true,
  };

  const result = convertMatterElement(element, options);

  console.log('Epigraph with styling:');
  console.log(result.xhtml);
  // Output includes alignment styles and custom CSS classes
}

// ============================================================================
// Example 12: Generate Filenames
// ============================================================================

function exampleGenerateFilenames() {
  const elements: Element[] = [
    { id: 't', type: 'title-page', matter: 'front', title: 'Title Page', content: [] },
    { id: 'c', type: 'copyright', matter: 'front', title: 'Copyright', content: [] },
    { id: 'd', type: 'dedication', matter: 'front', title: 'Dedication', content: [] },
    { id: 'e', type: 'epilogue', matter: 'back', title: 'Epilogue', content: [] },
    { id: 'a', type: 'about-author', matter: 'back', title: 'About the Author', content: [] },
  ];

  console.log('Generated filenames:');
  elements.forEach(element => {
    const filename = getMatterFilename(element);
    console.log(`${element.type}: ${filename}`);
  });
  // Output:
  // title-page: title-page.xhtml
  // copyright: copyright.xhtml
  // dedication: dedication.xhtml
  // epilogue: epilogue.xhtml
  // about-author: about-the-author.xhtml
}

// ============================================================================
// Run Examples (commented out to prevent execution during import)
// ============================================================================

// Uncomment to run specific examples
// exampleTitlePage();
// exampleCopyrightPage();
// exampleDedication();
// exampleAboutAuthor();
// exampleAlsoBy();
// exampleCustomFrontMatter();
// exampleCustomBackMatter();
// exampleBatchFrontMatter();
// exampleWithOptions();
// exampleRichText();
// exampleComplexFrontMatter();
// exampleGenerateFilenames();

export {
  exampleTitlePage,
  exampleCopyrightPage,
  exampleDedication,
  exampleAboutAuthor,
  exampleAlsoBy,
  exampleCustomFrontMatter,
  exampleCustomBackMatter,
  exampleBatchFrontMatter,
  exampleWithOptions,
  exampleRichText,
  exampleComplexFrontMatter,
  exampleGenerateFilenames,
};

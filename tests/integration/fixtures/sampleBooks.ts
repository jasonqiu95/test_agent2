/**
 * Sample book data for testing PDF export
 */

import type { BookContent, Chapter, Paragraph } from '../../../src/lib/export/types';

/**
 * Generate a paragraph with specified text
 */
function createParagraph(text: string, id?: string): Paragraph {
  return {
    id: id || `para-${Math.random().toString(36).substr(2, 9)}`,
    text,
    style: {
      align: 'justify',
      spacing: {
        after: 12,
        lineHeight: 1.5,
      },
    },
  };
}

/**
 * Generate a chapter with multiple paragraphs
 */
function createChapter(title: string, paragraphCount: number): Chapter {
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < paragraphCount; i++) {
    const text = `This is paragraph ${i + 1} of ${paragraphCount} in the chapter "${title}". ` +
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    paragraphs.push(createParagraph(text, `${title}-para-${i + 1}`));
  }

  return {
    id: `chapter-${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    content: paragraphs,
    startOnNewPage: true,
  };
}

/**
 * Simple book with one chapter
 */
export const SIMPLE_BOOK: BookContent = {
  title: 'Simple Book',
  author: 'Test Author',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter One',
      content: [
        createParagraph('This is the first paragraph of the book.'),
        createParagraph('This is the second paragraph of the book.'),
        createParagraph('This is the third paragraph of the book.'),
      ],
    },
  ],
};

/**
 * Book with multiple chapters for testing pagination
 */
export const MULTI_CHAPTER_BOOK: BookContent = {
  title: 'Multi-Chapter Book',
  author: 'Test Author',
  chapters: [
    createChapter('Chapter One', 5),
    createChapter('Chapter Two', 7),
    createChapter('Chapter Three', 4),
  ],
};

/**
 * Long book for testing extensive pagination and widow/orphan control
 */
export const LONG_BOOK: BookContent = {
  title: 'Long Book for Testing',
  author: 'Test Author',
  chapters: [
    createChapter('Chapter One: The Beginning', 8),
    createChapter('Chapter Two: The Middle Part', 10),
    createChapter('Chapter Three: More Content', 7),
  ],
};

/**
 * Book with short paragraphs for widow/orphan testing
 */
export const WIDOW_ORPHAN_TEST_BOOK: BookContent = {
  title: 'Widow Orphan Test Book',
  author: 'Test Author',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Test Chapter',
      content: [
        ...Array.from({ length: 12 }, (_, i) =>
          createParagraph(
            `Short paragraph ${i + 1}. This is a short paragraph that should test widow and orphan control.`,
            `short-para-${i + 1}`
          )
        ),
      ],
    },
  ],
};

/**
 * Book with varying paragraph lengths
 */
export const MIXED_LENGTH_BOOK: BookContent = {
  title: 'Mixed Length Book',
  author: 'Test Author',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter with Mixed Content',
      content: [
        createParagraph('Very short.'),
        createParagraph(
          'This is a medium-length paragraph that contains a reasonable amount of text. ' +
          'It should span several lines on a typical page layout. ' +
          'The content is designed to test how the layout engine handles paragraphs of different sizes.'
        ),
        createParagraph(
          'This is a very long paragraph that will definitely span multiple lines. ' +
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
          'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
        ),
        createParagraph('Another short one.'),
        createParagraph(
          'Medium paragraph again with some interesting content about testing and validation. ' +
          'This helps ensure that the layout engine can handle transitions between different paragraph lengths.'
        ),
      ],
    },
  ],
};

/**
 * Minimal book for basic structural tests
 */
export const MINIMAL_BOOK: BookContent = {
  title: 'Minimal Book',
  author: 'Test Author',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Only Chapter',
      content: [
        createParagraph('Single paragraph.'),
      ],
    },
  ],
};

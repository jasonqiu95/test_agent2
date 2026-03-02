/**
 * Test Data Helpers for Integration Tests
 * Provides reusable sample data for testing book styles
 */

import { Book } from '../../../src/types/book';
import { Chapter } from '../../../src/types/chapter';
import { TextBlock } from '../../../src/types/textBlock';
import { Element } from '../../../src/types/element';

/**
 * Create a sample text block with specified properties
 */
export const createTextBlock = (
  id: string,
  content: string,
  blockType: TextBlock['blockType'] = 'paragraph',
  level?: number
): TextBlock => ({
  id,
  content,
  blockType,
  level,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * Create a sample chapter with various content types
 */
export const createChapter = (
  id: string,
  number: number,
  title: string = `Chapter ${number}`
): Chapter => ({
  id,
  number,
  title,
  content: [
    createTextBlock(`${id}-h1`, title, 'heading', 1),
    createTextBlock(
      `${id}-p1`,
      'This is the first paragraph with an interesting opening that captures the reader\'s attention immediately.',
      'paragraph'
    ),
    createTextBlock(`${id}-h2`, 'Section One', 'heading', 2),
    createTextBlock(
      `${id}-p2`,
      'The story continues with more detail and depth. Characters are introduced and the plot begins to develop in unexpected ways.',
      'paragraph'
    ),
    createTextBlock(
      `${id}-p3`,
      'Another paragraph follows, building on the previous content and adding layers of complexity to the narrative.',
      'paragraph'
    ),
    createTextBlock(`${id}-h3`, 'Subsection', 'heading', 3),
    createTextBlock(
      `${id}-p4`,
      'Further elaboration with specific details that enrich the reader\'s understanding of the subject matter.',
      'paragraph'
    ),
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  wordCount: 75,
  includeInToc: true,
});

/**
 * Create a chapter with minimal content
 */
export const createMinimalChapter = (id: string, number: number): Chapter => ({
  id,
  number,
  title: `Chapter ${number}`,
  content: [
    createTextBlock(`${id}-h1`, `Chapter ${number}`, 'heading', 1),
    createTextBlock(`${id}-p1`, 'A simple paragraph.', 'paragraph'),
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  wordCount: 4,
  includeInToc: true,
});

/**
 * Create a chapter with code blocks
 */
export const createChapterWithCode = (id: string, number: number): Chapter => ({
  id,
  number,
  title: `Chapter ${number}: Technical Examples`,
  content: [
    createTextBlock(`${id}-h1`, 'Technical Examples', 'heading', 1),
    createTextBlock(`${id}-p1`, 'Here is some example code:', 'paragraph'),
    createTextBlock(
      `${id}-code1`,
      'function example() {\n  return "Hello World";\n}',
      'code'
    ),
    createTextBlock(`${id}-p2`, 'The code above demonstrates a simple function.', 'paragraph'),
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  wordCount: 25,
  includeInToc: true,
});

/**
 * Create a front matter element
 */
export const createFrontMatterElement = (
  id: string,
  type: Element['type'],
  title: string,
  content: string
): Element => ({
  id,
  type,
  matter: 'front',
  title,
  content: [createTextBlock(`${id}-content`, content, 'paragraph')],
  createdAt: new Date(),
  updatedAt: new Date(),
  includeInToc: true,
});

/**
 * Create a back matter element
 */
export const createBackMatterElement = (
  id: string,
  type: Element['type'],
  title: string,
  content: string
): Element => ({
  id,
  type,
  matter: 'back',
  title,
  content: [createTextBlock(`${id}-content`, content, 'paragraph')],
  createdAt: new Date(),
  updatedAt: new Date(),
  includeInToc: true,
});

/**
 * Create a complete sample book with various content
 */
export const createSampleBook = (
  id: string = 'test-book',
  chapterCount: number = 3
): Book => {
  const chapters = Array.from({ length: chapterCount }, (_, i) =>
    createChapter(`${id}-chapter-${i + 1}`, i + 1)
  );

  return {
    id,
    title: 'The Complete Guide to Testing',
    subtitle: 'A Comprehensive Reference',
    authors: [
      {
        id: 'author-1',
        name: 'Test Author',
        role: 'author',
        bio: 'An experienced writer and developer',
      },
    ],
    frontMatter: [
      createFrontMatterElement(
        `${id}-dedication`,
        'dedication',
        'Dedication',
        'For all the testers who make software better.'
      ),
      createFrontMatterElement(
        `${id}-preface`,
        'preface',
        'Preface',
        'This book aims to provide comprehensive coverage of testing principles and practices.'
      ),
    ],
    chapters,
    backMatter: [
      createBackMatterElement(
        `${id}-about`,
        'about-author',
        'About the Author',
        'Test Author has been writing and developing software for many years.'
      ),
    ],
    styles: [],
    metadata: {
      language: 'en',
      genre: ['technical', 'reference'],
      keywords: ['testing', 'software', 'quality'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    wordCount: chapterCount * 75 + 50,
    status: 'draft',
  };
};

/**
 * Create a book with specific structure for testing
 */
export const createTestBook = (config: {
  id?: string;
  chapterCount?: number;
  includeCode?: boolean;
  includeFrontMatter?: boolean;
  includeBackMatter?: boolean;
}): Book => {
  const {
    id = 'test-book',
    chapterCount = 3,
    includeCode = false,
    includeFrontMatter = true,
    includeBackMatter = true,
  } = config;

  const chapters = includeCode
    ? Array.from({ length: chapterCount }, (_, i) =>
        i % 2 === 0
          ? createChapter(`${id}-chapter-${i + 1}`, i + 1)
          : createChapterWithCode(`${id}-chapter-${i + 1}`, i + 1)
      )
    : Array.from({ length: chapterCount }, (_, i) =>
        createChapter(`${id}-chapter-${i + 1}`, i + 1)
      );

  return {
    id,
    title: 'Test Book',
    authors: [{ id: 'author-1', name: 'Test Author', role: 'author' }],
    frontMatter: includeFrontMatter
      ? [
          createFrontMatterElement(
            `${id}-preface`,
            'preface',
            'Preface',
            'Introduction to the book.'
          ),
        ]
      : [],
    chapters,
    backMatter: includeBackMatter
      ? [
          createBackMatterElement(
            `${id}-about`,
            'about-author',
            'About',
            'About the author.'
          ),
        ]
      : [],
    styles: [],
    metadata: {
      language: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
  };
};

/**
 * Create a large book for performance testing
 */
export const createLargeBook = (chapterCount: number = 100): Book => {
  return createSampleBook(`large-book-${chapterCount}`, chapterCount);
};

/**
 * Sample text snippets for testing various style features
 */
export const sampleText = {
  shortParagraph: 'A brief sentence.',
  mediumParagraph:
    'This is a medium-length paragraph with enough content to test typical styling scenarios.',
  longParagraph:
    'This is a longer paragraph that contains significantly more text to test how styles handle extended content. It includes multiple sentences and various punctuation marks. The purpose is to verify that line height, spacing, and other typographic features work correctly with realistic content lengths.',
  heading: 'Important Section Title',
  dropCapStart:
    'In the beginning was the word, and the word was with testing, and the word was good.',
  codeBlock: `function example() {\n  const message = "Hello, World!";\n  console.log(message);\n  return message;\n}`,
};

/**
 * Wait for a specified duration (useful for async testing)
 */
export const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Deep clone an object (useful for comparing before/after states)
 */
export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Compare two objects for equality
 */
export const isEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

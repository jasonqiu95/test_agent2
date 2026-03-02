/**
 * Mock book data for E2E testing
 *
 * These fixtures provide realistic book structures with chapters,
 * front matter, back matter, and various content types.
 */

import type { Book, Author } from '../../src/types/book';
import type { Chapter } from '../../src/types/chapter';
import type { TextBlock } from '../../src/types/textBlock';
import type { Element } from '../../src/types/element';

/**
 * Helper to create a text block
 */
export function createTextBlock(
  content: string,
  blockType: TextBlock['blockType'] = 'paragraph',
  options: Partial<TextBlock> = {}
): TextBlock {
  const now = new Date();
  return {
    id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    content,
    blockType,
    ...options,
  };
}

/**
 * Helper to create a chapter
 */
export function createChapter(
  number: number,
  title: string,
  content: TextBlock[],
  options: Partial<Chapter> = {}
): Chapter {
  const now = new Date();
  const wordCount = content.reduce(
    (acc, block) => acc + block.content.split(/\s+/).length,
    0
  );

  return {
    id: `chapter-${number}`,
    createdAt: now,
    updatedAt: now,
    number,
    title,
    content,
    wordCount,
    includeInToc: true,
    ...options,
  };
}

/**
 * Helper to create front/back matter
 */
export function createElement(
  type: Element['type'],
  matter: Element['matter'],
  title: string,
  content: TextBlock[],
  options: Partial<Element> = {}
): Element {
  const now = new Date();
  return {
    id: `element-${type}`,
    createdAt: now,
    updatedAt: now,
    type,
    matter,
    title,
    content,
    includeInToc: true,
    ...options,
  };
}

/**
 * Simple book with minimal content (good for basic tests)
 */
export function createSimpleBook(): Book {
  const now = new Date();
  const author: Author = {
    id: 'author-1',
    name: 'John Doe',
    role: 'author',
  };

  const chapters: Chapter[] = [
    createChapter(1, 'Chapter One', [
      createTextBlock('This is the first chapter of the book.'),
      createTextBlock('It contains some introductory content.'),
    ]),
    createChapter(2, 'Chapter Two', [
      createTextBlock('The second chapter continues the story.'),
      createTextBlock('With more exciting content to follow.'),
    ]),
  ];

  return {
    id: 'book-simple',
    createdAt: now,
    updatedAt: now,
    title: 'Simple Test Book',
    authors: [author],
    frontMatter: [],
    chapters,
    backMatter: [],
    styles: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      description: 'A simple book for basic testing',
    },
    status: 'draft',
    wordCount: chapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0),
  };
}

/**
 * Complete book with front matter, chapters, and back matter
 */
export function createCompleteBook(): Book {
  const now = new Date();
  const authors: Author[] = [
    {
      id: 'author-1',
      name: 'Jane Smith',
      role: 'author',
      bio: 'Jane Smith is an acclaimed novelist.',
      email: 'jane@example.com',
    },
    {
      id: 'author-2',
      name: 'Robert Johnson',
      role: 'co-author',
    },
  ];

  const frontMatter: Element[] = [
    createElement('title-page', 'front', 'Title Page', [
      createTextBlock('The Complete Test Novel', 'heading', { level: 1 }),
      createTextBlock('by Jane Smith and Robert Johnson'),
    ]),
    createElement('copyright', 'front', 'Copyright', [
      createTextBlock('Copyright © 2024 Jane Smith'),
      createTextBlock('All rights reserved.'),
    ]),
    createElement('dedication', 'front', 'Dedication', [
      createTextBlock('For all the test runners everywhere.'),
    ]),
  ];

  const chapters: Chapter[] = [
    createChapter(1, 'The Beginning', [
      createTextBlock('In the beginning, there was a test.', 'paragraph'),
      createTextBlock('It was a simple test, but it needed to pass.'),
      createTextBlock('The developers worked tirelessly.'),
    ]),
    createChapter(2, 'The Journey', [
      createTextBlock('The journey was long and arduous.'),
      createTextBlock('Many obstacles were encountered along the way.'),
      createTextBlock('But the team persevered.'),
    ]),
    createChapter(3, 'The Resolution', [
      createTextBlock('Finally, after much effort, success was achieved.'),
      createTextBlock('The tests passed, and there was much rejoicing.'),
    ]),
  ];

  const backMatter: Element[] = [
    createElement('epilogue', 'back', 'Epilogue', [
      createTextBlock('And so ends our tale of testing triumph.'),
    ]),
    createElement('about-author', 'back', 'About the Authors', [
      createTextBlock('Jane Smith has written numerous books on software testing.'),
      createTextBlock('Robert Johnson is a renowned test automation expert.'),
    ]),
  ];

  const totalWordCount =
    frontMatter.reduce(
      (acc, el) =>
        acc +
        el.content.reduce(
          (sum, block) => sum + block.content.split(/\s+/).length,
          0
        ),
      0
    ) +
    chapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0) +
    backMatter.reduce(
      (acc, el) =>
        acc +
        el.content.reduce(
          (sum, block) => sum + block.content.split(/\s+/).length,
          0
        ),
      0
    );

  return {
    id: 'book-complete',
    createdAt: now,
    updatedAt: now,
    title: 'The Complete Test Novel',
    subtitle: 'A Story of Testing Excellence',
    authors,
    frontMatter,
    chapters,
    backMatter,
    styles: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      isbn: '978-0-123456-78-9',
      isbn13: '978-0-123456-78-9',
      publisher: 'Test Publishing House',
      publicationDate: now,
      edition: 'First Edition',
      language: 'English',
      genre: ['Fiction', 'Technology'],
      keywords: ['testing', 'software', 'quality'],
      description: 'A comprehensive test novel with all the elements.',
    },
    status: 'draft',
    wordCount: totalWordCount,
  };
}

/**
 * Book with various text block types (headings, code, etc.)
 */
export function createBookWithVariedContent(): Book {
  const now = new Date();
  const author: Author = {
    id: 'author-1',
    name: 'Tech Writer',
    role: 'author',
  };

  const chapters: Chapter[] = [
    createChapter(1, 'Introduction to Testing', [
      createTextBlock('Introduction to Testing', 'heading', { level: 1 }),
      createTextBlock('Testing is a critical part of software development.'),
      createTextBlock('What is Testing?', 'heading', { level: 2 }),
      createTextBlock('Testing verifies that code behaves as expected.'),
    ]),
    createChapter(2, 'Code Examples', [
      createTextBlock('Here are some code examples:', 'paragraph'),
      createTextBlock(
        'function test() {\n  return true;\n}',
        'code',
        { language: 'javascript' }
      ),
      createTextBlock('The function above returns true.'),
    ]),
    createChapter(3, 'Preformatted Content', [
      createTextBlock('Some text with specific formatting:'),
      createTextBlock('  * Item 1\n  * Item 2\n  * Item 3', 'preformatted'),
    ]),
  ];

  return {
    id: 'book-varied',
    createdAt: now,
    updatedAt: now,
    title: 'Testing Guide with Varied Content',
    authors: [author],
    frontMatter: [],
    chapters,
    backMatter: [],
    styles: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      description: 'A book with various content types for testing',
    },
    status: 'draft',
    wordCount: chapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0),
  };
}

/**
 * Empty book (for testing new project creation)
 */
export function createEmptyBook(): Book {
  const now = new Date();
  return {
    id: `book-empty-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    title: 'Untitled',
    authors: [],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
    },
    status: 'draft',
  };
}

/**
 * Book with many chapters (for performance testing)
 */
export function createLargeBook(chapterCount: number = 50): Book {
  const now = new Date();
  const author: Author = {
    id: 'author-1',
    name: 'Prolific Author',
    role: 'author',
  };

  const chapters: Chapter[] = [];
  for (let i = 1; i <= chapterCount; i++) {
    chapters.push(
      createChapter(i, `Chapter ${i}`, [
        createTextBlock(`This is chapter ${i}.`),
        createTextBlock('It contains some content for performance testing.'),
        createTextBlock('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
      ])
    );
  }

  return {
    id: 'book-large',
    createdAt: now,
    updatedAt: now,
    title: 'Large Test Book',
    subtitle: `A book with ${chapterCount} chapters`,
    authors: [author],
    frontMatter: [],
    chapters,
    backMatter: [],
    styles: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      description: 'A large book for performance testing',
    },
    status: 'draft',
    wordCount: chapters.reduce((acc, ch) => acc + (ch.wordCount || 0), 0),
  };
}

/**
 * All available mock books
 */
export const mockBooks = {
  simple: createSimpleBook(),
  complete: createCompleteBook(),
  varied: createBookWithVariedContent(),
  empty: createEmptyBook(),
  large: createLargeBook(),
};

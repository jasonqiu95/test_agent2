/**
 * Test fixtures for EPUB export integration tests
 */

import { Book, Author } from '../../src/types/book';
import { Chapter } from '../../src/types/chapter';
import { BookStyle } from '../../src/types/style';
import { Element } from '../../src/types/element';
import { ImageData } from '../../src/workers/types';

/**
 * Sample book data for testing
 */
export const sampleBookMinimal: Book = {
  id: 'book-minimal',
  title: 'The Minimal Book',
  authors: [
    {
      id: 'author-1',
      name: 'Jane Doe',
      role: 'author',
    },
  ],
  frontMatter: [],
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: 'Chapter One',
      content: [
        {
          id: 'block-1',
          type: 'paragraph',
          content: 'This is a simple paragraph.',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
      includeInToc: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ],
  backMatter: [],
  styles: [],
  metadata: {
    title: 'The Minimal Book',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    language: 'en',
  },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

/**
 * Sample book with front and back matter
 */
export const sampleBookWithMatter: Book = {
  id: 'book-with-matter',
  title: 'The Complete Book',
  subtitle: 'A Story of Everything',
  authors: [
    {
      id: 'author-1',
      name: 'John Smith',
      role: 'author',
      bio: 'An experienced author',
    },
  ],
  frontMatter: [
    {
      id: 'dedication',
      type: 'dedication',
      matter: 'front',
      content: [
        {
          id: 'ded-1',
          type: 'paragraph',
          content: 'For my family and friends',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
      includeInToc: false,
      metadata: {
        id: 'meta-ded',
        title: 'Dedication',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'acknowledgments',
      type: 'acknowledgments',
      matter: 'front',
      content: [
        {
          id: 'ack-1',
          type: 'paragraph',
          content: 'I would like to thank everyone who helped make this book possible.',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
      includeInToc: true,
      metadata: {
        id: 'meta-ack',
        title: 'Acknowledgments',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ],
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: 'The Beginning',
      subtitle: 'Where it all starts',
      epigraph: 'All great stories have a beginning.',
      epigraphAttribution: 'Anonymous',
      content: [
        {
          id: 'p1',
          type: 'paragraph',
          content: 'It was a dark and stormy night.',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'p2',
          type: 'paragraph',
          content: 'The wind howled through the trees.',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
      includeInToc: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'chapter-2',
      number: 2,
      title: 'The Middle',
      content: [
        {
          id: 'p3',
          type: 'paragraph',
          content: 'Things got complicated.',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
      includeInToc: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'chapter-3',
      number: 3,
      title: 'The End',
      content: [
        {
          id: 'p4',
          type: 'paragraph',
          content: 'And they lived happily ever after.',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
      includeInToc: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ],
  backMatter: [
    {
      id: 'epilogue',
      type: 'epilogue',
      matter: 'back',
      content: [
        {
          id: 'epi-1',
          type: 'paragraph',
          content: 'Years later, the story continued...',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
      includeInToc: true,
      metadata: {
        id: 'meta-epi',
        title: 'Epilogue',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ],
  styles: [],
  metadata: {
    title: 'The Complete Book',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    isbn: '978-3-16-148410-0',
    isbn13: '978-3-16-148410-0',
    publisher: 'Great Books Publishing',
    publicationDate: new Date('2026-06-01'),
    language: 'en',
    genre: ['Fiction', 'Drama'],
    keywords: ['story', 'novel', 'fiction'],
    description: 'A complete book with all the elements.',
    rights: 'Copyright 2026 John Smith. All rights reserved.',
  },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

/**
 * Sample book with images
 */
export const sampleBookWithImages: Book = {
  ...sampleBookMinimal,
  id: 'book-with-images',
  title: 'The Illustrated Book',
  coverImage: 'cover-image-1',
};

/**
 * Sample images
 */
export const sampleImages: ImageData[] = [
  {
    id: 'cover-image-1',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    mimeType: 'image/png',
    width: 600,
    height: 800,
  },
  {
    id: 'image-1',
    url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBD==',
    mimeType: 'image/jpeg',
    width: 400,
    height: 300,
  },
];

/**
 * Sample styles
 */
export const sampleStyles: BookStyle[] = [
  {
    id: 'style-standard',
    name: 'Standard',
    description: 'Standard book formatting',
    isDefault: true,
    css: `
      body {
        font-family: Georgia, serif;
        font-size: 12pt;
        line-height: 1.6;
      }
      p {
        text-indent: 1.5em;
        margin: 0;
      }
      h1 {
        font-size: 24pt;
        text-align: center;
        margin: 2em 0 1em 0;
      }
    `,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'style-modern',
    name: 'Modern',
    description: 'Modern minimalist style',
    isDefault: false,
    css: `
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.8;
      }
      .chapter-title {
        font-weight: 300;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
    `,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

/**
 * Sample book with complex formatting
 */
export const sampleBookWithFormatting: Book = {
  id: 'book-formatted',
  title: 'The Formatted Book',
  authors: [{ id: 'a1', name: 'Test Author', role: 'author' }],
  frontMatter: [],
  chapters: [
    {
      id: 'ch-1',
      number: 1,
      title: 'Formatted Chapter',
      content: [
        {
          id: 'block-1',
          type: 'paragraph',
          content: [
            { text: 'This is ', bold: false, italic: false },
            { text: 'bold', bold: true, italic: false },
            { text: ' and ', bold: false, italic: false },
            { text: 'italic', bold: false, italic: true },
            { text: ' and ', bold: false, italic: false },
            { text: 'both', bold: true, italic: true },
            { text: '.', bold: false, italic: false },
          ],
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'block-2',
          type: 'paragraph',
          content: [
            { text: 'Text with ', bold: false },
            { text: 'underline', underline: true },
            { text: ' and ', bold: false },
            { text: 'strikethrough', strikethrough: true },
            { text: '.', bold: false },
          ],
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'block-3',
          type: 'blockquote',
          content: 'This is a quoted passage.',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ],
      includeInToc: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ],
  backMatter: [],
  styles: [],
  metadata: {
    title: 'The Formatted Book',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    language: 'en',
  },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

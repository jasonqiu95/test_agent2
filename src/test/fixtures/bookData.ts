/**
 * Mock Book Data Fixtures for Testing
 * Provides comprehensive book structures including front matter, chapters, and back matter
 */

import { Book, Author } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element, ElementType } from '../../types/element';
import { TextBlock } from '../../types/textBlock';

/**
 * Helper function to create a text block
 */
export const createTextBlock = (content: string, blockType: TextBlock['blockType'] = 'paragraph'): TextBlock => ({
  id: `block-${Math.random().toString(36).substr(2, 9)}`,
  content,
  blockType,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

/**
 * Helper function to create a chapter
 */
export const createChapter = (
  number: number,
  title: string,
  contentParagraphs: string[] = ['Sample chapter content.']
): Chapter => ({
  id: `chapter-${number}`,
  number,
  title,
  content: contentParagraphs.map(p => createTextBlock(p)),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  includeInToc: true,
});

/**
 * Helper function to create an element (front or back matter)
 */
export const createElement = (
  type: ElementType,
  matter: 'front' | 'back',
  title: string,
  contentParagraphs: string[] = ['Sample content.']
): Element => ({
  id: `element-${type}`,
  type,
  matter,
  title,
  content: contentParagraphs.map(p => createTextBlock(p)),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  includeInToc: type !== 'title-page' && type !== 'copyright',
});

/**
 * Sample author data
 */
export const mockAuthor: Author = {
  id: 'author-1',
  name: 'Jane Doe',
  role: 'author',
  bio: 'Jane Doe is an award-winning author of fiction.',
  website: 'https://janedoe.example.com',
  email: 'jane@example.com',
};

export const mockCoAuthor: Author = {
  id: 'author-2',
  name: 'John Smith',
  role: 'co-author',
  bio: 'John Smith is a bestselling author.',
};

/**
 * SIMPLE BOOK - Minimal structure with just chapters
 */
export const simpleBook: Book = {
  id: 'book-simple',
  title: 'A Simple Tale',
  authors: [mockAuthor],
  frontMatter: [],
  chapters: [
    createChapter(1, 'Chapter One', [
      'This is the first chapter.',
      'It has multiple paragraphs.',
    ]),
    createChapter(2, 'Chapter Two', [
      'This is the second chapter.',
    ]),
    createChapter(3, 'Chapter Three', [
      'This is the third chapter.',
    ]),
  ],
  backMatter: [],
  styles: [],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    language: 'en',
    genre: ['Fiction'],
  },
  wordCount: 15,
  status: 'draft',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * COMPLEX BOOK - Full structure with all front and back matter elements
 */
export const complexBook: Book = {
  id: 'book-complex',
  title: 'The Complete Masterpiece',
  subtitle: 'A Comprehensive Novel',
  authors: [mockAuthor, mockCoAuthor],
  frontMatter: [
    createElement('title-page', 'front', 'Title Page', [
      'THE COMPLETE MASTERPIECE',
      'A Comprehensive Novel',
      'by Jane Doe and John Smith',
    ]),
    createElement('copyright', 'front', 'Copyright', [
      '© 2024 Jane Doe and John Smith',
      'All rights reserved.',
      'Published by Example Press',
      'ISBN: 978-0-123456-78-9',
    ]),
    createElement('dedication', 'front', 'Dedication', [
      'To all the dreamers and storytellers who inspire us.',
    ]),
    createElement('epigraph', 'front', 'Epigraph', [
      '"In the beginning was the Word..." - Ancient Text',
    ]),
    createElement('foreword', 'front', 'Foreword', [
      'This remarkable work by Jane Doe and John Smith represents a new milestone in contemporary fiction.',
      'Their collaborative effort brings together unique perspectives and masterful storytelling.',
    ]),
    createElement('preface', 'front', 'Preface', [
      'This book began as a simple idea over coffee one morning.',
      'What followed was a journey of discovery, creativity, and collaboration.',
    ]),
    createElement('acknowledgments', 'front', 'Acknowledgments', [
      'We would like to thank our families for their unwavering support.',
      'Special thanks to our editor, Sarah Williams, for her invaluable feedback.',
    ]),
    createElement('prologue', 'front', 'Prologue', [
      'The storm clouds gathered on the horizon as she stood at the edge of the cliff.',
      'Everything she had known was about to change.',
    ]),
  ],
  chapters: [
    createChapter(1, 'The Beginning', [
      'It was a morning like any other, yet everything was different.',
      'The sun rose slowly over the mountains, casting long shadows across the valley.',
      'She knew this would be the day that changed everything.',
    ]),
    createChapter(2, 'The Journey', [
      'The path ahead was uncertain, but she pressed on.',
      'Each step brought new challenges and unexpected discoveries.',
    ]),
    createChapter(3, 'The Discovery', [
      'What she found in the ancient library defied explanation.',
      'The manuscript contained secrets that had been hidden for centuries.',
    ]),
    createChapter(4, 'The Revelation', [
      'As the pieces fell into place, the truth became clear.',
      'Nothing would ever be the same again.',
    ]),
    createChapter(5, 'The Confrontation', [
      'The moment of truth had arrived.',
      'She stood face to face with destiny.',
    ]),
    createChapter(6, 'The Resolution', [
      'In the end, it all made sense.',
      'The journey had been worth every step.',
    ]),
  ],
  backMatter: [
    createElement('epilogue', 'back', 'Epilogue', [
      'Five years later, she stood in the same spot.',
      'The cliff edge was unchanged, but she was transformed.',
      'The storm had passed, leaving only clear skies and endless possibilities.',
    ]),
    createElement('afterword', 'back', 'Afterword', [
      'Writing this book has been an incredible journey for both of us.',
      'We hope readers have found meaning and enjoyment in these pages.',
    ]),
    createElement('acknowledgments', 'back', 'Acknowledgments', [
      'Additional thanks to our beta readers and the writing community.',
      'Your feedback and encouragement made this book possible.',
    ]),
    createElement('about-author', 'back', 'About the Authors', [
      'Jane Doe is the author of five novels and numerous short stories.',
      'John Smith has been writing professionally for over a decade.',
      'Together, they bring a combined 20 years of storytelling experience.',
    ]),
    createElement('also-by', 'back', 'Also By the Authors', [
      'By Jane Doe:',
      '- The First Story (2020)',
      '- Another Tale (2021)',
      '- The Third Book (2022)',
      '',
      'By John Smith:',
      '- Beginning Words (2019)',
      '- The Middle Path (2021)',
    ]),
  ],
  styles: [],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    isbn: '978-0-123456-78-9',
    isbn13: '978-0-123456-78-9',
    publisher: 'Example Press',
    publicationDate: new Date('2024-06-01'),
    edition: 'First Edition',
    language: 'en',
    genre: ['Fiction', 'Literary Fiction', 'Drama'],
    keywords: ['adventure', 'discovery', 'transformation'],
    series: 'The Complete Series',
    seriesNumber: 1,
    description: 'A comprehensive novel exploring themes of discovery and transformation.',
  },
  wordCount: 2500,
  pageCount: 350,
  status: 'review',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
};

/**
 * EMPTY BOOK - No content, just structure
 */
export const emptyBook: Book = {
  id: 'book-empty',
  title: 'Untitled Book',
  authors: [mockAuthor],
  frontMatter: [],
  chapters: [],
  backMatter: [],
  styles: [],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    language: 'en',
  },
  wordCount: 0,
  status: 'draft',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * BOOK WITH PARTS - Chapters organized into parts
 */
export const bookWithParts: Book = {
  id: 'book-parts',
  title: 'Epic Saga',
  subtitle: 'A Three-Part Journey',
  authors: [mockAuthor],
  frontMatter: [
    createElement('title-page', 'front', 'Title Page', ['EPIC SAGA', 'A Three-Part Journey', 'by Jane Doe']),
    createElement('prologue', 'front', 'Prologue', ['The story begins long before our heroes were born.']),
  ],
  chapters: [
    // Part I
    { ...createChapter(1, 'The Awakening'), partNumber: 1, partTitle: 'Part I: Origins' },
    { ...createChapter(2, 'First Steps'), partNumber: 1, partTitle: 'Part I: Origins' },
    { ...createChapter(3, 'The Call'), partNumber: 1, partTitle: 'Part I: Origins' },
    // Part II
    { ...createChapter(4, 'The Quest'), partNumber: 2, partTitle: 'Part II: Journey' },
    { ...createChapter(5, 'Trials'), partNumber: 2, partTitle: 'Part II: Journey' },
    { ...createChapter(6, 'Allies'), partNumber: 2, partTitle: 'Part II: Journey' },
    // Part III
    { ...createChapter(7, 'The Final Battle'), partNumber: 3, partTitle: 'Part III: Resolution' },
    { ...createChapter(8, 'Victory'), partNumber: 3, partTitle: 'Part III: Resolution' },
    { ...createChapter(9, 'New Beginning'), partNumber: 3, partTitle: 'Part III: Resolution' },
  ],
  backMatter: [
    createElement('epilogue', 'back', 'Epilogue', ['And so, a new chapter begins.']),
  ],
  styles: [],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    language: 'en',
    genre: ['Fantasy', 'Epic'],
    series: 'Epic Saga Series',
    seriesNumber: 1,
  },
  wordCount: 5000,
  pageCount: 450,
  status: 'published',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * BOOK WITH ONLY FRONT MATTER - No chapters yet
 */
export const bookWithOnlyFrontMatter: Book = {
  id: 'book-front-only',
  title: 'Work in Progress',
  authors: [mockAuthor],
  frontMatter: [
    createElement('title-page', 'front', 'Title Page', ['WORK IN PROGRESS', 'by Jane Doe']),
    createElement('dedication', 'front', 'Dedication', ['To those who believe in the power of words.']),
    createElement('preface', 'front', 'Preface', [
      'This book is currently in development.',
      'More content will be added soon.',
    ]),
  ],
  chapters: [],
  backMatter: [],
  styles: [],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    language: 'en',
  },
  status: 'draft',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * Export all fixtures as an array for easy iteration in tests
 */
export const allBookFixtures = {
  simpleBook,
  complexBook,
  emptyBook,
  bookWithParts,
  bookWithOnlyFrontMatter,
};

/**
 * Helper to get a book by ID
 */
export const getBookById = (id: string): Book | undefined => {
  return Object.values(allBookFixtures).find(book => book.id === id);
};

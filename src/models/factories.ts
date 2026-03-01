/**
 * Factory functions for creating model instances with defaults
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Book,
  Chapter,
  Element,
  TextBlock,
  Style,
  Author,
  Metadata,
  Subhead,
  Break,
  Quote,
  Verse,
  List,
  Link,
  Note,
  ElementType,
  MatterType,
} from '../types';

/**
 * Create base metadata with default values
 */
export function createMetadata(overrides?: Partial<Metadata>): Metadata {
  const now = new Date();
  return {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    version: 1,
    tags: [],
    ...overrides,
  };
}

/**
 * Create a new Book instance
 */
export function createBook(
  title: string,
  authors: Author[],
  overrides?: Partial<Book>
): Book {
  return {
    ...createMetadata(),
    title,
    authors,
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    },
    status: 'draft',
    ...overrides,
  };
}

/**
 * Create a new Author instance
 */
export function createAuthor(
  name: string,
  overrides?: Partial<Author>
): Author {
  return {
    id: uuidv4(),
    name,
    role: 'author',
    ...overrides,
  };
}

/**
 * Create a new Chapter instance
 */
export function createChapter(
  title: string,
  overrides?: Partial<Chapter>
): Chapter {
  return {
    ...createMetadata(),
    title,
    content: [],
    includeInToc: true,
    ...overrides,
  };
}

/**
 * Create a new Element instance (front/back matter)
 */
export function createElement(
  type: ElementType,
  matter: MatterType,
  title: string,
  overrides?: Partial<Element>
): Element {
  return {
    ...createMetadata(),
    type,
    matter,
    title,
    content: [],
    includeInToc: true,
    ...overrides,
  };
}

/**
 * Create a new TextBlock instance
 */
export function createTextBlock(
  content: string,
  blockType: TextBlock['blockType'] = 'paragraph',
  overrides?: Partial<TextBlock>
): TextBlock {
  return {
    ...createMetadata(),
    content,
    blockType,
    features: [],
    ...overrides,
  };
}

/**
 * Create a new Style instance
 */
export function createStyle(
  name: string,
  overrides?: Partial<Style>
): Style {
  return {
    ...createMetadata(),
    name,
    fontFamily: 'serif',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    textDecoration: 'none',
    textTransform: 'none',
    ...overrides,
  };
}

/**
 * Create a Subhead text feature
 */
export function createSubhead(
  content: string,
  level: number = 2,
  overrides?: Partial<Subhead>
): Subhead {
  return {
    ...createMetadata(),
    type: 'subhead',
    content,
    level,
    ...overrides,
  };
}

/**
 * Create a Break text feature
 */
export function createBreak(
  breakType: Break['breakType'] = 'section',
  overrides?: Partial<Break>
): Break {
  return {
    ...createMetadata(),
    type: 'break',
    breakType,
    ...overrides,
  };
}

/**
 * Create a Quote text feature
 */
export function createQuote(
  content: string,
  quoteType: Quote['quoteType'] = 'block',
  overrides?: Partial<Quote>
): Quote {
  return {
    ...createMetadata(),
    type: 'quote',
    content,
    quoteType,
    ...overrides,
  };
}

/**
 * Create a Verse text feature
 */
export function createVerse(
  lines: string[],
  overrides?: Partial<Verse>
): Verse {
  return {
    ...createMetadata(),
    type: 'verse',
    lines,
    ...overrides,
  };
}

/**
 * Create a List text feature
 */
export function createList(
  items: List['items'],
  listType: List['listType'] = 'unordered',
  overrides?: Partial<List>
): List {
  return {
    ...createMetadata(),
    type: 'list',
    items,
    listType,
    ...overrides,
  };
}

/**
 * Create a Link text feature
 */
export function createLink(
  content: string,
  url: string,
  overrides?: Partial<Link>
): Link {
  return {
    ...createMetadata(),
    type: 'link',
    content,
    url,
    target: '_self',
    ...overrides,
  };
}

/**
 * Create a Note text feature
 */
export function createNote(
  content: string,
  noteType: Note['noteType'] = 'footnote',
  overrides?: Partial<Note>
): Note {
  return {
    ...createMetadata(),
    type: 'note',
    content,
    noteType,
    ...overrides,
  };
}

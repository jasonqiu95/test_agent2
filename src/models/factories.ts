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
  Footnote,
  Endnote,
  FootnoteMarker,
  CreateFootnoteParams,
  CreateEndnoteParams,
  NoteMarkerType,
  NoteSymbol,
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

/**
 * Create a Footnote with auto-numbering support
 */
export function createFootnote(
  params: CreateFootnoteParams,
  overrides?: Partial<Footnote>
): Footnote {
  const markerType = params.markerType || 'number';

  return {
    ...createMetadata(),
    noteType: 'footnote',
    content: params.content,
    sourceElementId: params.sourceElementId,
    markerType,
    number: params.number,
    symbol: params.symbol as NoteSymbol | undefined,
    customMarker: params.customMarker,
    style: params.style,
    displayOnSamePage: params.displayOnSamePage ?? true,
    pageNumber: params.pageNumber,
    ...overrides,
  };
}

/**
 * Create an Endnote with auto-numbering support
 */
export function createEndnote(
  params: CreateEndnoteParams,
  overrides?: Partial<Endnote>
): Endnote {
  const markerType = params.markerType || 'number';

  return {
    ...createMetadata(),
    noteType: 'endnote',
    content: params.content,
    sourceElementId: params.sourceElementId,
    markerType,
    number: params.number,
    symbol: params.symbol as NoteSymbol | undefined,
    customMarker: params.customMarker,
    style: params.style,
    chapterId: params.chapterId,
    groupByChapter: params.groupByChapter ?? false,
    ...overrides,
  };
}

/**
 * Create a FootnoteMarker for inline reference
 */
export function createFootnoteMarker(
  noteId: string,
  marker: string,
  markerType: NoteMarkerType = 'number',
  isEndnote: boolean = false,
  overrides?: Partial<FootnoteMarker>
): FootnoteMarker {
  return {
    type: isEndnote ? 'endnote-marker' : 'footnote-marker',
    noteId,
    marker,
    markerType,
    superscript: true,
    ...overrides,
  };
}

/**
 * Create a numbered Footnote (convenience function)
 */
export function createNumberedFootnote(
  content: string,
  sourceElementId: string,
  number: number,
  overrides?: Partial<Footnote>
): Footnote {
  return createFootnote(
    {
      content,
      sourceElementId,
      markerType: 'number',
      number,
    },
    overrides
  );
}

/**
 * Create a numbered Endnote (convenience function)
 */
export function createNumberedEndnote(
  content: string,
  sourceElementId: string,
  number: number,
  chapterId?: string,
  overrides?: Partial<Endnote>
): Endnote {
  return createEndnote(
    {
      content,
      sourceElementId,
      markerType: 'number',
      number,
      chapterId,
    },
    overrides
  );
}

/**
 * Create a symbol-based Footnote (convenience function)
 */
export function createSymbolFootnote(
  content: string,
  sourceElementId: string,
  symbol: NoteSymbol | string,
  overrides?: Partial<Footnote>
): Footnote {
  return createFootnote(
    {
      content,
      sourceElementId,
      markerType: 'symbol',
      symbol,
    },
    overrides
  );
}

/**
 * Create a symbol-based Endnote (convenience function)
 */
export function createSymbolEndnote(
  content: string,
  sourceElementId: string,
  symbol: NoteSymbol | string,
  chapterId?: string,
  overrides?: Partial<Endnote>
): Endnote {
  return createEndnote(
    {
      content,
      sourceElementId,
      markerType: 'symbol',
      symbol,
      chapterId,
    },
    overrides
  );
}

/**
 * Get the next symbol in sequence (* † ‡ § ¶ ** †† ‡‡)
 */
export function getNextNoteSymbol(currentIndex: number): NoteSymbol | string {
  const symbols: (NoteSymbol | string)[] = ['*', '†', '‡', '§', '¶'];

  if (currentIndex < symbols.length) {
    return symbols[currentIndex];
  }

  // For indices beyond 5, use doubled symbols
  const baseIndex = (currentIndex - symbols.length) % symbols.length;
  const repeatCount = Math.floor((currentIndex - symbols.length) / symbols.length) + 2;
  return symbols[baseIndex].repeat(repeatCount);
}

/**
 * Auto-number footnotes in a collection based on configuration
 */
export function autoNumberFootnotes(
  footnotes: Footnote[],
  startNumber: number = 1
): Footnote[] {
  let currentNumber = startNumber;

  return footnotes.map((footnote) => {
    if (footnote.markerType === 'number' && !footnote.number) {
      return {
        ...footnote,
        number: currentNumber++,
      };
    }
    return footnote;
  });
}

/**
 * Auto-number endnotes in a collection based on configuration
 */
export function autoNumberEndnotes(
  endnotes: Endnote[],
  startNumber: number = 1
): Endnote[] {
  let currentNumber = startNumber;

  return endnotes.map((endnote) => {
    if (endnote.markerType === 'number' && !endnote.number) {
      return {
        ...endnote,
        number: currentNumber++,
      };
    }
    return endnote;
  });
}

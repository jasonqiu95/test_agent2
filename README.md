# Core Data Models

TypeScript data models for a book publishing application.

## Features

- **Comprehensive Type Definitions**: TypeScript interfaces for all book components
- **Factory Functions**: Easy creation of model instances with sensible defaults
- **Helper Utilities**: Functions for word counting, sorting, filtering, and more
- **Metadata Support**: Built-in metadata tracking for all entities

## Types

### Book
Main book structure containing:
- Title, subtitle, authors
- Front matter (title page, copyright, dedication, etc.)
- Chapters
- Back matter (appendix, glossary, index, etc.)
- Styles and metadata

### Chapter
Chapter structure with:
- Title, subtitle, number
- Content (text blocks)
- Epigraph support
- Word count tracking
- Part/section organization

### Element
Front and back matter elements including:
- Title page
- Copyright
- Dedication
- Foreword, Preface, Introduction
- Epilogue, Afterword
- Appendix, Glossary, Bibliography, Index

### TextBlock
Structured text content with:
- Content and block type (paragraph, heading, code, etc.)
- Style references
- Embedded text features
- Location tracking

### TextFeature
Inline text features:
- **Subhead**: Section subheadings with levels
- **Break**: Line, section, page, or scene breaks
- **Quote**: Block quotes, inline quotes, epigraphs
- **Verse**: Poetry with line and stanza support
- **List**: Ordered, unordered, and definition lists
- **Link**: Hyperlinks with targets and relations
- **Note**: Footnotes, endnotes, sidenotes

### Style
Text formatting and styling:
- Font properties (family, size, weight, style)
- Text alignment and decoration
- Colors and backgrounds
- Spacing and borders
- Custom properties

## Usage

### Creating a Book

```typescript
import { createBook, createAuthor, createChapter } from './models';

const author = createAuthor('Jane Doe', { bio: 'Award-winning author' });
const book = createBook('My Great Novel', [author]);

const chapter1 = createChapter('The Beginning', {
  number: 1,
  content: [
    createTextBlock('It was a dark and stormy night...'),
  ],
});

book.chapters.push(chapter1);
```

### Creating Text Features

```typescript
import {
  createTextBlock,
  createQuote,
  createList,
  createNote,
} from './models';

const block = createTextBlock('This is a paragraph with features.', 'paragraph');

block.features = [
  createQuote('To be or not to be', 'inline', {
    attribution: 'Shakespeare',
  }),
  createNote('This is a footnote', 'footnote', { number: 1 }),
];
```

### Using Helper Functions

```typescript
import {
  calculateBookWordCount,
  generateTableOfContents,
  sortChapters,
} from './models';

const wordCount = calculateBookWordCount(book);
const toc = generateTableOfContents(book);
const sortedChapters = sortChapters(book.chapters);
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run build:watch

# Clean build
npm run clean
```

## License

MIT

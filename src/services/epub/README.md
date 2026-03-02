# EPUB Services

This directory contains services for EPUB generation and manipulation.

## TOC Generator

The TOC (Table of Contents) generator creates both NCX (EPUB 2.0) and nav.xhtml (EPUB 3.0) formats from book content.

### Features

- ✅ Generates toc.ncx for EPUB 2.0 compatibility (XML format with navPoint elements)
- ✅ Generates nav.xhtml for EPUB 3.0 (HTML5 nav element with nested ol/li)
- ✅ Extracts chapter titles and subheadings from book content
- ✅ Assigns play order numbers automatically
- ✅ Links to chapter XHTML files with anchors for subheadings
- ✅ Supports nested TOC levels (chapters > subheadings)
- ✅ Handles front/back matter in TOC
- ✅ Respects includeInToc flags on chapters and elements
- ✅ Configurable maximum depth for TOC entries
- ✅ Proper XML/HTML escaping for special characters

### Usage

```typescript
import { generateTOC } from './services/epub';
import { Book } from './types/book';

// Your book data
const book: Book = {
  id: 'my-book',
  title: 'My Amazing Book',
  authors: [{ id: 'author-1', name: 'Jane Doe', role: 'author' }],
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: 'Introduction',
      content: [
        { blockType: 'paragraph', content: 'Welcome...' },
        { blockType: 'heading', level: 2, content: 'Background' },
        { blockType: 'paragraph', content: 'Some history...' },
        { blockType: 'heading', level: 2, content: 'Overview' },
      ],
      includeInToc: true,
    },
    {
      id: 'chapter-2',
      number: 2,
      title: 'Getting Started',
      content: [...],
      includeInToc: true,
    },
  ],
  frontMatter: [...],
  backMatter: [...],
  // ... other book properties
};

// Generate TOC with default options
const toc = generateTOC(book);

// Access the generated content
console.log(toc.ncx);        // NCX XML content
console.log(toc.navXhtml);   // nav.xhtml HTML5 content
console.log(toc.entries);    // Structured TOC entries

// Generate TOC with custom options
const customToc = generateTOC(book, {
  maxDepth: 2,                    // Only include h1 and h2
  tocTitle: 'Contents',           // Custom title
  includeFrontMatter: true,       // Include front matter (default: true)
  includeBackMatter: true,        // Include back matter (default: true)
  bookId: 'custom-book-id',       // Custom book ID for NCX
  bookTitle: 'Custom Book Title', // Custom title for NCX
  bookAuthor: 'Custom Author',    // Custom author for NCX
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxDepth` | `number` | `3` | Maximum depth of TOC entries (1-6) |
| `tocTitle` | `string` | `'Table of Contents'` | Title shown in nav.xhtml |
| `includeFrontMatter` | `boolean` | `true` | Include front matter elements in TOC |
| `includeBackMatter` | `boolean` | `true` | Include back matter elements in TOC |
| `bookId` | `string` | `book.id` | Book identifier for NCX metadata |
| `bookTitle` | `string` | `book.title` | Book title for NCX metadata |
| `bookAuthor` | `string` | `book.authors[0].name` | Book author for NCX metadata |

### TOC Structure

#### TocEntry

Each TOC entry has the following structure:

```typescript
interface TocEntry {
  id: string;           // Unique identifier
  title: string;        // Display title
  href: string;         // Link to content (e.g., "Text/chapter-001.xhtml")
  playOrder: number;    // Sequential play order
  children: TocEntry[]; // Nested subheadings
  level: number;        // Heading level (1-6)
}
```

### Generated Files

#### toc.ncx (EPUB 2.0)

The NCX file is an XML document that provides navigation for EPUB 2.0 readers:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="book-id"/>
    <meta name="dtb:depth" content="3"/>
    <!-- ... -->
  </head>
  <docTitle>
    <text>Book Title</text>
  </docTitle>
  <docAuthor>
    <text>Author Name</text>
  </docAuthor>
  <navMap>
    <navPoint id="chapter-1" playOrder="1">
      <navLabel>
        <text>Chapter 1: Introduction</text>
      </navLabel>
      <content src="Text/chapter-001.xhtml"/>
      <navPoint id="chapter-1-h2-0" playOrder="2">
        <navLabel>
          <text>Background</text>
        </navLabel>
        <content src="Text/chapter-001.xhtml#chapter-1-h2-0"/>
      </navPoint>
    </navPoint>
  </navMap>
</ncx>
```

#### nav.xhtml (EPUB 3.0)

The nav.xhtml file is an HTML5 document with structured navigation:

```html
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
  <style type="text/css">
    /* Built-in styling */
  </style>
</head>
<body>
  <nav id="toc" epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li>
        <a href="Text/chapter-001.xhtml">Chapter 1: Introduction</a>
        <ol>
          <li>
            <a href="Text/chapter-001.xhtml#chapter-1-h2-0">Background</a>
          </li>
        </ol>
      </li>
    </ol>
  </nav>
</body>
</html>
```

### Subheading Extraction

The TOC generator automatically extracts subheadings from chapter content based on the `blockType: 'heading'` and `level` properties of TextBlocks:

- Level 1: Chapter title (not included as subheading)
- Level 2-6: Subheadings (included based on `maxDepth` option)

Subheadings are nested according to their level hierarchy:
- h2 → Direct children of chapter
- h3 → Children of h2
- h4 → Children of h3
- etc.

### Front and Back Matter

The generator handles front matter (preface, acknowledgments, etc.) and back matter (epilogue, about author, etc.) elements:

- Front matter appears before chapters
- Back matter appears after chapters
- Each element gets its own TOC entry
- Elements respect the `includeInToc` property

### File Naming Convention

The generator uses a consistent naming convention for chapter files:

- Chapters: `Text/chapter-001.xhtml`, `Text/chapter-002.xhtml`, etc.
- Front matter: `Text/frontmatter-001.xhtml`, `Text/frontmatter-002.xhtml`, etc.
- Back matter: `Text/backmatter-001.xhtml`, `Text/backmatter-002.xhtml`, etc.

### Testing

Run the test suite:

```bash
npm test -- tocGenerator.test.ts
```

The test suite includes 23 comprehensive tests covering:
- Basic TOC generation
- Nested subheadings
- Front and back matter handling
- NCX XML generation
- nav.xhtml HTML5 generation
- Special character escaping
- Edge cases

### Integration

To use the TOC generator in your EPUB generation workflow:

1. **Generate TOC** after preparing book content
2. **Save toc.ncx** to the EPUB package at `OEBPS/toc.ncx`
3. **Save nav.xhtml** to the EPUB package at `OEBPS/nav.xhtml`
4. **Add to manifest** in `package.opf`:
   ```xml
   <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
   <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
   ```
5. **Reference in spine** (for nav.xhtml):
   ```xml
   <itemref idref="nav" linear="no"/>
   ```

### Notes

- The generator assumes chapter files follow the naming pattern `chapter-XXX.xhtml`
- Subheading anchors use the format `{chapter-id}-h{level}-{index}`
- Special characters in titles are automatically escaped for XML/HTML
- Play order is assigned sequentially starting from 1
- The NCX depth metadata is calculated from the `maxDepth` option

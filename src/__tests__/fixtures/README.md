# Test Fixtures

Comprehensive test fixtures for book content, including chapters with various formatting, front matter, and back matter elements.

## Overview

These fixtures provide realistic sample book content for testing Preview components and other book-related functionality.

## Available Fixtures

### Books

- **`sampleBook`** - Complete book with all front matter, 7 chapters, and back matter
- **`minimalBook`** - Minimal book with just title page and one simple chapter
- **`complexFormattingBook`** - Book with complex formatting for stress testing

### Chapters (`sampleChapters.ts`)

1. **`simpleChapter`** - Basic chapter with headings and paragraphs
2. **`chapterWithSceneBreaks`** - Demonstrates scene breaks between sections
3. **`chapterWithBlockQuotes`** - Contains block quotes with attribution
4. **`chapterWithVerse`** - Includes poetry/verse with proper indentation
5. **`chapterWithFootnotes`** - Demonstrates footnote references
6. **`chapterWithHeadings`** - Multiple heading levels (H1, H2, H3)
7. **`chapterInPart`** - Chapter that's part of a larger part division

### Front Matter Elements

- `titlePageElement` - Book title page
- `copyrightElement` - Copyright and publication info
- `dedicationElement` - Dedication page
- `epigraphElement` - Book epigraph with quote
- `forewordElement` - Foreword with author bio
- `acknowledgementsElement` - Acknowledgments section
- `prologueElement` - Story prologue

### Back Matter Elements

- `epilogueElement` - Story epilogue with verse
- `afterwordElement` - Author's afterword
- `aboutAuthorElement` - Author biographies
- `appendixElement` - Appendix with timeline and lists
- `bibliographyElement` - Bibliography section

### Authors

- `sampleAuthors` - Array of sample author objects

## Usage Examples

### Import specific fixtures

```typescript
import { sampleBook, simpleChapter } from '@/__tests__/fixtures';
```

### Import all chapters

```typescript
import { allSampleChapters } from '@/__tests__/fixtures';
```

### Import helpers

```typescript
import {
  getChapterByNumber,
  getChaptersWithFeatureType,
  getElementByType,
  getElementsByMatter,
  createTextBlock,
} from '@/__tests__/fixtures';
```

### Example Test Usage

```typescript
import { sampleBook, chapterWithFootnotes } from '@/__tests__/fixtures';

describe('Preview Component', () => {
  it('should render a complete book', () => {
    render(<Preview book={sampleBook} />);
    expect(screen.getByText('The Journey Beyond')).toBeInTheDocument();
  });

  it('should render footnotes correctly', () => {
    render(<ChapterView chapter={chapterWithFootnotes} />);
    const footnotes = screen.getAllByRole('note');
    expect(footnotes).toHaveLength(3);
  });
});
```

### Helper Functions

#### `getChapterByNumber(number: number): Chapter | undefined`

Retrieve a chapter by its chapter number.

```typescript
const chapter3 = getChapterByNumber(3);
```

#### `getChaptersWithFeatureType(featureType: TextFeature['type']): Chapter[]`

Get all chapters containing a specific feature type (e.g., 'quote', 'verse', 'note').

```typescript
const chaptersWithVerses = getChaptersWithFeatureType('verse');
const chaptersWithNotes = getChaptersWithFeatureType('note');
```

#### `getElementByType(elements: Element[], type: ElementType): Element | undefined`

Find a specific element by type in an array of elements.

```typescript
const dedication = getElementByType(sampleBook.frontMatter, 'dedication');
```

#### `getElementsByMatter(book: Book, matter: 'front' | 'back'): Element[]`

Get all elements of a specific matter type from a book.

```typescript
const frontMatter = getElementsByMatter(sampleBook, 'front');
```

#### `createTextBlock(content: string, blockType?, features?): TextBlock`

Create a text block for testing.

```typescript
const paragraph = createTextBlock('This is a test paragraph.');
const heading = createTextBlock('Chapter Title', 'heading');
```

## Content Features Demonstrated

### Text Formatting

- ✅ Headings (H1, H2, H3)
- ✅ Paragraphs
- ✅ Block quotes with attribution
- ✅ Poetry/verse with indentation
- ✅ Scene breaks with symbols

### Special Elements

- ✅ Footnotes with references
- ✅ Endnotes
- ✅ Epigraphs
- ✅ Lists (unordered)
- ✅ Multiple chapters in parts

### Book Structure

- ✅ Title page
- ✅ Copyright page
- ✅ Dedication
- ✅ Foreword
- ✅ Acknowledgments
- ✅ Prologue
- ✅ Multiple chapters
- ✅ Epilogue
- ✅ Afterword
- ✅ About the author
- ✅ Appendix
- ✅ Bibliography

## Data Structure

All fixtures follow the TypeScript type definitions in `src/types/`:

- `Book` - Complete book structure
- `Chapter` - Chapter with content blocks
- `Element` - Front/back matter elements
- `TextBlock` - Individual content blocks
- `TextFeature` - Special features (quotes, verses, notes, etc.)

## Extending Fixtures

To add new fixtures:

1. Create new content in `sampleChapters.ts` or `bookContent.ts`
2. Follow existing patterns for IDs, dates, and structure
3. Export the new fixture
4. Add to the appropriate collection array (e.g., `allSampleChapters`)
5. Update this README with the new fixture

## Testing Best Practices

1. **Use specific fixtures** for specific tests (e.g., `chapterWithFootnotes` for footnote tests)
2. **Use minimal fixtures** for simple tests to improve performance
3. **Use complex fixtures** for stress testing and edge cases
4. **Use helpers** to find specific content within fixtures
5. **Create custom blocks** with `createTextBlock()` when you need specific test data

## Notes

- All dates are set to `2024-01-01` for consistency
- IDs follow the pattern: `{type}-{descriptor}-{number}`
- Word counts are approximate and match content length
- Content is realistic but fictional

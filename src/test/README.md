# Test Infrastructure Documentation

This directory contains comprehensive test infrastructure for the Navigator component and other parts of the application.

## Directory Structure

```
src/test/
├── fixtures/
│   ├── bookData.ts       # Mock book data with various configurations
│   └── index.ts          # Fixture exports
├── utils/
│   ├── testHelpers.tsx   # Test utilities and rendering helpers
│   ├── mockHandlers.ts   # Mock API handlers
│   └── index.ts          # Utility exports
└── README.md            # This file
```

## Fixtures

### Book Data Fixtures (`fixtures/bookData.ts`)

The `bookData.ts` file provides comprehensive mock book data for testing various scenarios:

#### Available Fixtures:

1. **`simpleBook`** - Minimal structure
   - 3 chapters
   - No front or back matter
   - Perfect for basic tests

2. **`complexBook`** - Full structure with all elements
   - 8 front matter elements (Title Page, Copyright, Dedication, Epigraph, Foreword, Preface, Acknowledgments, Prologue)
   - 6 chapters
   - 5 back matter elements (Epilogue, Afterword, Acknowledgments, About Author, Also By)
   - Multiple authors
   - Complete metadata

3. **`emptyBook`** - Empty structure
   - No chapters
   - No front or back matter
   - Useful for testing empty states

4. **`bookWithParts`** - Chapters organized into parts
   - 9 chapters divided into 3 parts
   - Front and back matter
   - Useful for testing part-based navigation

5. **`bookWithOnlyFrontMatter`** - Work in progress
   - 3 front matter elements
   - No chapters yet
   - Useful for testing incomplete books

#### Helper Functions:

```typescript
// Create custom text blocks
createTextBlock(content: string, blockType?: 'paragraph' | 'heading' | 'preformatted' | 'code'): TextBlock

// Create custom chapters
createChapter(number: number, title: string, contentParagraphs?: string[]): Chapter

// Create custom elements (front/back matter)
createElement(
  type: ElementType,
  matter: 'front' | 'back',
  title: string,
  contentParagraphs?: string[]
): Element

// Get a book by ID
getBookById(id: string): Book | undefined
```

#### Usage Example:

```typescript
import { simpleBook, complexBook, createChapter } from '@/test/fixtures/bookData';

// Use a predefined fixture
const book = simpleBook;

// Create a custom chapter
const customChapter = createChapter(1, 'Custom Chapter', [
  'First paragraph content.',
  'Second paragraph content.',
]);
```

## Test Utilities

### Test Helpers (`utils/testHelpers.tsx`)

Provides utilities for rendering the Navigator component and working with book data in tests.

#### Rendering Functions:

```typescript
// Render NavigatorPanel with basic props
renderNavigatorPanel(
  props?: Partial<NavigatorPanelProps>,
  options?: RenderOptions
): RenderResult

// Render NavigatorPanel with children
renderNavigatorWithContent(
  children: ReactElement | string,
  props?: Partial<NavigatorPanelProps>,
  options?: RenderOptions
): RenderResult

// Render NavigatorPanel with footer
renderNavigatorWithFooter(
  children: ReactElement | string,
  footer: ReactElement | string,
  props?: Partial<NavigatorPanelProps>,
  options?: RenderOptions
): RenderResult
```

#### Navigator Tree Functions:

```typescript
// Create a tree structure from book data
createNavigatorTree(book: Book): NavigatorTreeNode

// Flatten a tree into a list
flattenNavigatorTree(node: NavigatorTreeNode): NavigatorTreeNode[]

// Find a node by ID
findNodeById(tree: NavigatorTreeNode, id: string): NavigatorTreeNode | undefined
```

#### Book Data Functions:

```typescript
// Get all chapters
getAllChapters(book: Book): Chapter[]

// Get all front matter
getAllFrontMatter(book: Book): Element[]

// Get all back matter
getAllBackMatter(book: Book): Element[]

// Get total content count
getTotalContentCount(book: Book): number

// Check if book has content
hasContent(book: Book): boolean

// Get chapters organized by parts
getChaptersByParts(book: Book): ChaptersByPart[]
```

#### Mock Functions:

```typescript
// Create mock event handlers
createMockHandlers(): {
  onClose: jest.fn()
  onChapterSelect: jest.fn()
  onElementSelect: jest.fn()
  onNavigate: jest.fn()
  onExpand: jest.fn()
  onCollapse: jest.fn()
  onSearch: jest.fn()
}

// Setup common mocks (IntersectionObserver, ResizeObserver)
setupTestMocks(): void

// Cleanup test mocks
cleanupTestMocks(): void
```

#### Utility Functions:

```typescript
// Wait for a condition
waitForCondition(condition: () => boolean, timeout?: number, interval?: number): Promise<void>

// Simulate delay
delay(ms: number): Promise<void>
```

### Mock API Handlers (`utils/mockHandlers.ts`)

Provides mock implementations of API calls for testing data fetching without a real backend.

#### MockBookApi Class:

```typescript
const mockBookApi = new MockBookApi();

// Configure behavior
mockBookApi.setShouldFail(true);  // Make next call fail
mockBookApi.setDelay(100);        // Set delay in ms

// API methods
await mockBookApi.getAllBooks();
await mockBookApi.getBookById(bookId);
await mockBookApi.getChapters(bookId);
await mockBookApi.getChapter(bookId, chapterId);
await mockBookApi.getFrontMatter(bookId);
await mockBookApi.getBackMatter(bookId);
await mockBookApi.getElement(bookId, elementId);

// Database operations
mockBookApi.addBook(book);
mockBookApi.removeBook(bookId);
mockBookApi.clear();
mockBookApi.reset();
```

#### Mock Fetch Functions:

```typescript
// Setup global fetch mock
setupMockFetch(api?: MockBookApi): void

// Reset mock fetch
resetMockFetch(): void

// Cleanup mock fetch
cleanupMockFetch(): void
```

## Usage Examples

### Basic Test Example

```typescript
import { screen } from '@testing-library/react';
import { renderNavigatorPanel, setupTestMocks, cleanupTestMocks } from '@/test/utils';
import { simpleBook } from '@/test/fixtures';

describe('NavigatorPanel', () => {
  beforeEach(() => {
    setupTestMocks();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  it('should render with title', () => {
    renderNavigatorPanel({ title: 'Book Structure' });
    expect(screen.getByText('Book Structure')).toBeInTheDocument();
  });
});
```

### Testing with Book Data

```typescript
import { mockBookApi, setupMockFetch, resetMockFetch } from '@/test/utils';
import { complexBook } from '@/test/fixtures';

describe('Book API', () => {
  beforeEach(() => {
    setupMockFetch();
  });

  afterEach(() => {
    resetMockFetch();
  });

  it('should fetch book data', async () => {
    const response = await mockBookApi.getBookById(complexBook.id);
    expect(response.status).toBe(200);
    expect(response.data?.chapters).toHaveLength(6);
    expect(response.data?.frontMatter).toHaveLength(8);
    expect(response.data?.backMatter).toHaveLength(5);
  });

  it('should handle errors', async () => {
    mockBookApi.setShouldFail(true);
    const response = await mockBookApi.getBookById('any-id');
    expect(response.status).toBe(500);
    expect(response.error).toBeDefined();
  });
});
```

### Testing Event Handlers

```typescript
import userEvent from '@testing-library/user-event';
import { renderNavigatorPanel, createMockHandlers } from '@/test/utils';

it('should call onClose when clicked', async () => {
  const user = userEvent.setup();
  const handlers = createMockHandlers();

  renderNavigatorPanel({ onClose: handlers.onClose });

  const closeButton = screen.getByLabelText('Close navigator panel');
  await user.click(closeButton);

  expect(handlers.onClose).toHaveBeenCalledTimes(1);
});
```

### Testing Navigator Tree

```typescript
import { createNavigatorTree, flattenNavigatorTree, findNodeById } from '@/test/utils';
import { complexBook } from '@/test/fixtures';

it('should create navigator tree from book', () => {
  const tree = createNavigatorTree(complexBook);

  expect(tree.type).toBe('book');
  expect(tree.title).toBe(complexBook.title);
  expect(tree.children).toBeDefined();

  // Find specific nodes
  const chapterNode = findNodeById(tree, 'chapter-1');
  expect(chapterNode?.type).toBe('chapter');

  // Get all nodes
  const allNodes = flattenNavigatorTree(tree);
  expect(allNodes.length).toBeGreaterThan(0);
});
```

## Front and Back Matter Elements

The fixtures include all standard front and back matter types:

### Front Matter:
- **Title Page** (`title-page`) - Book title, subtitle, and authors
- **Copyright** (`copyright`) - Copyright information, ISBN, publisher
- **Dedication** (`dedication`) - Dedication text
- **Epigraph** (`epigraph`) - Opening quote or passage
- **Foreword** (`foreword`) - Introduction by another person
- **Preface** (`preface`) - Author's introduction
- **Acknowledgments** (`acknowledgments`) - Thanks and credits
- **Prologue** (`prologue`) - Story opening before Chapter 1

### Back Matter:
- **Epilogue** (`epilogue`) - Story conclusion after final chapter
- **Afterword** (`afterword`) - Author's closing notes
- **Acknowledgments** (`acknowledgments`) - Additional thanks
- **About Author** (`about-author`) - Author biography
- **Also By** (`also-by`) - Other works by the author(s)

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- NavigatorPanel.test.tsx

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

## Best Practices

1. **Always use fixtures** - Don't create book data inline in tests
2. **Setup and cleanup** - Use `beforeEach` and `afterEach` for mocks
3. **Mock API calls** - Use `mockBookApi` for all data fetching tests
4. **Use helper functions** - Leverage `renderNavigatorPanel` and other helpers
5. **Test different scenarios** - Use various fixtures (simple, complex, empty, etc.)
6. **Clean up after tests** - Call cleanup functions in `afterEach`

## Adding New Fixtures

To add new test fixtures:

1. Add your fixture to `fixtures/bookData.ts`
2. Export it from `allBookFixtures`
3. Add it to the mock API if needed
4. Document it in this README

Example:

```typescript
export const myCustomBook: Book = {
  id: 'book-custom',
  title: 'My Custom Book',
  // ... rest of the book structure
};

export const allBookFixtures = {
  simpleBook,
  complexBook,
  emptyBook,
  bookWithParts,
  bookWithOnlyFrontMatter,
  myCustomBook, // Add your fixture here
};
```

## Troubleshooting

### Tests failing with "Cannot find module"
- Ensure all imports use correct paths
- Check that index files export properly

### Mock API not working
- Call `setupMockFetch()` in `beforeEach`
- Call `resetMockFetch()` in `afterEach`

### JSX not working in test files
- Ensure test files with JSX use `.tsx` extension
- Import React in files that use JSX

### Date-related test failures
- Fixtures use fixed dates (`new Date('2024-01-01')`)
- For current date tests, create custom fixtures

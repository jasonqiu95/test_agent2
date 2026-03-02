# E2E Test Fixtures and Helpers

This directory contains reusable test fixtures, helpers, and page object models for E2E testing.

## Structure

```
e2e/
├── fixtures/           # Test data fixtures
│   ├── mockBooks.ts    # Mock book data with chapters
│   ├── sampleDocuments.ts  # Sample .docx files
│   ├── bookConfigs.ts  # Book configuration presets
│   └── index.ts
├── helpers/           # Test helper utilities
│   ├── projectHelpers.ts    # Project operations
│   ├── navigationHelpers.ts # Navigation and view switching
│   ├── waitHelpers.ts       # Waiting and verification
│   └── index.ts
└── page-objects/      # Page object models
    ├── NavigatorPanel.ts   # Navigator panel POM
    ├── EditorPanel.ts      # Editor panel POM
    ├── PreviewPanel.ts     # Preview panel POM
    ├── StylesPanel.ts      # Styles panel POM
    └── index.ts
```

## Fixtures

### Mock Books

The `mockBooks.ts` file provides various book fixtures for testing:

```typescript
import { mockBooks, createSimpleBook, createCompleteBook } from './fixtures';

test('should load a simple book', async ({ electronApp }) => {
  const book = mockBooks.simple; // or createSimpleBook()
  await openProject(page, book);
  // ... test logic
});
```

Available book fixtures:
- `mockBooks.simple` - Minimal book with 2 chapters
- `mockBooks.complete` - Full book with front matter, chapters, and back matter
- `mockBooks.varied` - Book with various content types (headings, code, etc.)
- `mockBooks.empty` - Empty book for testing project creation
- `mockBooks.large` - Large book with many chapters for performance testing

Helper functions:
- `createSimpleBook()` - Create a simple book
- `createCompleteBook()` - Create a complete book
- `createBookWithVariedContent()` - Book with varied content
- `createEmptyBook()` - Empty book
- `createLargeBook(count)` - Large book with specified chapter count
- `createTextBlock(content, type)` - Create a text block
- `createChapter(number, title, content)` - Create a chapter
- `createElement(type, matter, title, content)` - Create front/back matter

### Sample Documents

The `sampleDocuments.ts` file provides sample .docx files for import testing:

```typescript
import { sampleDocuments, createTestDocument } from './fixtures';

test('should import a document', async ({ electronApp }) => {
  const docPath = sampleDocuments.simple.path;
  await importDocument(page, docPath);
  // ... test logic
});
```

Available sample documents:
- `sampleDocuments.simple` - Simple document with basic formatting
- `sampleDocuments.withHeadings` - Document with heading hierarchy
- `sampleDocuments.complex` - Complex document with images and tables
- `sampleDocuments.corrupted` - Corrupted document for error testing
- `sampleDocuments.empty` - Empty document

Helper functions:
- `createTestDocument(filename, content)` - Create a test document
- `documentExists(path)` - Check if document exists
- `getDocumentSize(path)` - Get document file size
- `cleanupTestDocuments()` - Clean up temporary test documents

### Book Configurations

The `bookConfigs.ts` file provides configuration presets:

```typescript
import { bookConfigs, mergeConfig } from './fixtures';

const config = mergeConfig({
  title: 'My Book',
  chapterCount: 5,
});
```

Available configurations:
- `bookConfigs.default` - Default configuration
- `bookConfigs.minimal` - Minimal configuration
- `bookConfigs.complete` - Complete configuration
- `bookConfigs.novel` - Novel configuration
- `bookConfigs.nonFiction` - Non-fiction configuration
- `bookConfigs.academic` - Academic book configuration
- `bookConfigs.multiLanguage` - Multi-language configurations
- `bookConfigs.status` - Different status configurations
- `bookConfigs.export` - Export format configurations

## Helpers

### Project Helpers

Operations for working with projects:

```typescript
import { openProject, createNewProject, saveProject } from './helpers';

test('project operations', async ({ electronApp }) => {
  const { window } = electronApp;

  // Create a new project
  await createNewProject(window);

  // Open an existing project
  await openProject(window, mockBooks.simple);

  // Save the project
  await saveProject(window, '/path/to/save');

  // Close the project
  await closeProject(window);
});
```

Available functions:
- `openProject(page, book, filePath?)` - Open a project
- `createNewProject(page)` - Create a new project
- `saveProject(page, filePath)` - Save the project
- `closeProject(page)` - Close the project
- `getProjectTitle(page)` - Get project title
- `isProjectOpen(page)` - Check if project is open
- `importDocument(page, path)` - Import a document
- `exportProject(page, format, path)` - Export project
- `getProjectStats(page)` - Get project statistics

### Navigation Helpers

Navigate between views and panels:

```typescript
import { navigateToView, navigateToChapter, togglePanel } from './helpers';

test('navigation', async ({ electronApp }) => {
  const { window } = electronApp;

  // Navigate to a view
  await navigateToView(window, 'editor');

  // Navigate to a chapter
  await navigateToChapter(window, 1);

  // Toggle a panel
  await togglePanel(window, 'preview');
});
```

Available functions:
- `navigateToView(page, view)` - Navigate to a view
- `waitForViewReady(page, view)` - Wait for view to be ready
- `togglePanel(page, panel)` - Toggle panel visibility
- `isPanelVisible(page, panel)` - Check if panel is visible
- `navigateToChapter(page, number)` - Navigate to a chapter
- `navigateToSection(page, chapter, section)` - Navigate to a section
- `openDialog(page, name)` - Open a dialog
- `closeDialog(page)` - Close the current dialog
- `scrollToElement(page, selector)` - Scroll to an element

### Wait Helpers

Wait for various conditions:

```typescript
import { waitForPreviewUpdate, waitForFileExists, verifyFileExists } from './helpers';

test('waiting', async ({ electronApp }) => {
  const { window } = electronApp;

  // Wait for preview to update
  await waitForPreviewUpdate(window);

  // Wait for a file to exist
  await waitForFileExists('/path/to/file');

  // Verify file exists
  const exists = await verifyFileExists('/path/to/file');
});
```

Available functions:
- `waitForPreviewUpdate(page, timeout?)` - Wait for preview to update
- `waitForFileExists(path, timeout?)` - Wait for file to exist
- `verifyFileExists(path)` - Verify file exists
- `waitForText(page, selector, text)` - Wait for text in element
- `waitForElementStable(page, selector)` - Wait for element to be stable
- `waitForEditorReady(page)` - Wait for editor to be ready
- `waitForSaveComplete(page)` - Wait for save operation
- `waitForLoadingComplete(page, selector?)` - Wait for loading to complete
- `waitForNetworkIdle(page)` - Wait for network to be idle
- `waitForElementCount(page, selector, count)` - Wait for element count
- `waitForDialog(page, selector)` - Wait for dialog to appear
- `waitForNotification(page, message)` - Wait for notification
- `pollUntil(condition, options)` - Poll until condition is true
- `retryWithBackoff(operation, retries, delay)` - Retry operation with backoff

## Page Object Models

Page objects provide a clean interface to interact with UI panels:

### Navigator Panel

```typescript
import { NavigatorPanel } from './page-objects';

test('navigator', async ({ electronApp }) => {
  const { window } = electronApp;
  const navigator = new NavigatorPanel(window);

  await navigator.waitForReady();

  // Get chapters
  const chapterCount = await navigator.getChapterCount();
  const titles = await navigator.getChapterTitles();

  // Select a chapter
  await navigator.selectChapter(1);

  // Add a chapter
  await navigator.addChapter();

  // Search
  await navigator.search('chapter 1');
});
```

Available methods:
- `isVisible()` - Check if panel is visible
- `getChapters()` - Get all chapters
- `getChapterCount()` - Get chapter count
- `selectChapter(number)` - Select a chapter
- `selectChapterByTitle(title)` - Select chapter by title
- `getChapterTitles()` - Get all chapter titles
- `addChapter()` - Add a new chapter
- `search(query)` - Search for content
- `getFrontMatter()` - Get front matter items
- `getBackMatter()` - Get back matter items
- `reorderChapter(from, to)` - Reorder chapters
- `toggleChapterExpansion(number)` - Expand/collapse chapter

### Editor Panel

```typescript
import { EditorPanel } from './page-objects';

test('editor', async ({ electronApp }) => {
  const { window } = electronApp;
  const editor = new EditorPanel(window);

  await editor.waitForReady();

  // Edit content
  await editor.setContent('New content');
  await editor.type('More text');

  // Apply formatting
  await editor.applyFormatting('bold');

  // Get content
  const content = await editor.getContent();
  const wordCount = await editor.getWordCount();
});
```

Available methods:
- `isVisible()` - Check if panel is visible
- `getContent()` - Get editor content
- `setContent(text)` - Set editor content
- `type(text)` - Type at cursor position
- `clear()` - Clear all content
- `applyFormatting(format)` - Apply formatting
- `insertHeading(level)` - Insert heading
- `insertCodeBlock(language?)` - Insert code block
- `insertList(type)` - Insert list
- `undo()` / `redo()` - Undo/redo
- `getWordCount()` - Get word count
- `selectAll()` / `copy()` / `paste()` - Clipboard operations
- `find(query)` - Find text
- `replace(find, replace)` - Replace text

### Preview Panel

```typescript
import { PreviewPanel } from './page-objects';

test('preview', async ({ electronApp }) => {
  const { window } = electronApp;
  const preview = new PreviewPanel(window);

  await preview.waitForReady();

  // Check content
  const hasText = await preview.containsText('Chapter 1');

  // Zoom
  await preview.zoomIn();
  await preview.setZoom(150);

  // Navigate pages
  await preview.nextPage();
  const currentPage = await preview.getCurrentPage();

  // Refresh
  await preview.refresh();
});
```

Available methods:
- `isVisible()` - Check if panel is visible
- `getRenderedContent()` - Get rendered HTML
- `getTextContent()` - Get text content
- `containsText(text)` - Check if text is present
- `zoomIn()` / `zoomOut()` - Zoom controls
- `setZoom(percentage)` - Set zoom level
- `nextPage()` / `previousPage()` - Page navigation
- `getCurrentPage()` / `getTotalPages()` - Page info
- `goToPage(number)` - Go to specific page
- `refresh()` - Refresh preview
- `waitForUpdate()` - Wait for preview update
- `screenshot(path)` - Take screenshot

### Styles Panel

```typescript
import { StylesPanel } from './page-objects';

test('styles', async ({ electronApp }) => {
  const { window } = electronApp;
  const styles = new StylesPanel(window);

  await styles.waitForReady();

  // Get styles
  const styleNames = await styles.getStyleNames();
  const count = await styles.getStyleCount();

  // Select and apply
  await styles.selectStyle('Heading 1');
  await styles.applyStyle('Heading 1');

  // Add new style
  await styles.addStyle('Custom Style', {
    fontSize: '16px',
    fontWeight: 'bold',
  });

  // Edit or delete
  await styles.editStyle('Custom Style');
  await styles.deleteStyle('Custom Style');
});
```

Available methods:
- `isVisible()` - Check if panel is visible
- `getStyles()` - Get all styles
- `getStyleCount()` - Get style count
- `selectStyle(name)` - Select a style
- `getStyleNames()` - Get all style names
- `addStyle(name, properties)` - Add new style
- `editStyle(name)` - Edit a style
- `deleteStyle(name)` - Delete a style
- `duplicateStyle(name, newName)` - Duplicate a style
- `applyStyle(name)` - Apply style to selection
- `search(query)` - Search styles
- `filterByCategory(category)` - Filter by category
- `importStyles(path)` / `exportStyles(path)` - Import/export

## Example Test

Here's a complete example using fixtures, helpers, and page objects:

```typescript
import { test, expect } from './utils/fixtures';
import { mockBooks } from './fixtures';
import { openProject, navigateToChapter, waitForPreviewUpdate } from './helpers';
import { NavigatorPanel, EditorPanel, PreviewPanel } from './page-objects';

test('complete workflow', async ({ electronApp }) => {
  const { window } = electronApp;

  // Open a project
  const book = mockBooks.complete;
  await openProject(window, book);

  // Use page objects
  const navigator = new NavigatorPanel(window);
  const editor = new EditorPanel(window);
  const preview = new PreviewPanel(window);

  // Wait for panels to be ready
  await navigator.waitForReady();
  await editor.waitForReady();
  await preview.waitForReady();

  // Navigate and edit
  await navigator.selectChapter(1);
  await editor.setContent('Updated chapter content');

  // Wait for preview to update
  await waitForPreviewUpdate(window);

  // Verify changes
  const hasUpdatedText = await preview.containsText('Updated chapter content');
  expect(hasUpdatedText).toBe(true);
});
```

## Best Practices

1. **Use Page Objects** for all UI interactions - they provide a stable interface
2. **Use Fixtures** for test data - keep tests independent and repeatable
3. **Use Helpers** for common operations - reduce code duplication
4. **Wait Appropriately** - use the wait helpers to ensure proper synchronization
5. **Clean Up** - use cleanup functions to remove temporary files
6. **Isolate Tests** - each test should be independent and not rely on other tests

## Contributing

When adding new fixtures, helpers, or page objects:

1. Follow the existing patterns and naming conventions
2. Add comprehensive JSDoc comments
3. Export from the index files
4. Update this README with examples
5. Write tests for your new utilities

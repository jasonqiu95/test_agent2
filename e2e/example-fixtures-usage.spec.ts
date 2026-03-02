/**
 * Example test demonstrating usage of fixtures, helpers, and page objects
 *
 * This test shows how to use all the E2E testing utilities together
 * in a realistic testing scenario.
 */

import { test, expect } from './utils/fixtures';
import { mockBooks, createSimpleBook, sampleDocuments } from './fixtures';
import {
  openProject,
  createNewProject,
  closeProject,
  navigateToView,
  navigateToChapter,
  waitForPreviewUpdate,
  verifyFileExists,
} from './helpers';
import {
  NavigatorPanel,
  EditorPanel,
  PreviewPanel,
  StylesPanel,
} from './page-objects';

test.describe('Fixtures and Helpers Usage Examples', () => {
  test('should use mock book fixtures', async ({ electronApp }) => {
    const { window } = electronApp;

    // Use a predefined mock book
    const book = mockBooks.simple;

    // Open the project
    await openProject(window, book);

    // Verify the project is open
    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Check chapter count
    const chapterCount = await navigator.getChapterCount();
    expect(chapterCount).toBe(2); // Simple book has 2 chapters
  });

  test('should create and use custom book', async ({ electronApp }) => {
    const { window } = electronApp;

    // Create a custom book using helper functions
    const customBook = createSimpleBook();

    // Open it
    await openProject(window, customBook);

    // Verify it loaded
    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    const titles = await navigator.getChapterTitles();
    expect(titles.length).toBeGreaterThan(0);
  });

  test('should use navigator page object', async ({ electronApp }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Get all chapter titles
    const titles = await navigator.getChapterTitles();
    expect(titles).toContain('The Beginning');
    expect(titles).toContain('The Journey');

    // Select a chapter
    await navigator.selectChapterByTitle('The Journey');

    // Verify selection
    const selected = await navigator.getSelectedItem();
    expect(selected).toContain('The Journey');
  });

  test('should use editor page object', async ({ electronApp }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.simple);

    const editor = new EditorPanel(window);
    await editor.waitForReady();

    // Set content
    await editor.setContent('This is new content for testing.');

    // Apply formatting
    await editor.selectAll();
    await editor.applyFormatting('bold');

    // Verify content
    const content = await editor.getContent();
    expect(content).toContain('This is new content');
  });

  test('should use preview page object', async ({ electronApp }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.varied);

    const preview = new PreviewPanel(window);
    await preview.waitForReady();

    // Check if content is rendered
    const hasContent = await preview.hasContent();
    expect(hasContent).toBe(true);

    // Check for specific text
    const containsText = await preview.containsText('Introduction to Testing');
    expect(containsText).toBe(true);

    // Test zoom controls
    await preview.zoomIn();
    const zoomLevel = await preview.getZoomLevel();
    expect(zoomLevel).toBeGreaterThan(100);
  });

  test('should use styles page object', async ({ electronApp }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);

    // Navigate to styles view
    await navigateToView(window, 'styles');

    const styles = new StylesPanel(window);
    await styles.waitForReady();

    // Get available styles
    const styleNames = await styles.getStyleNames();
    expect(styleNames.length).toBeGreaterThan(0);

    // Search for a style
    await styles.search('Heading');

    // Get filtered count
    const filteredCount = await styles.getStyleCount();
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('should use wait helpers', async ({ electronApp }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.simple);

    const editor = new EditorPanel(window);
    const preview = new PreviewPanel(window);

    await editor.waitForReady();
    await preview.waitForReady();

    // Make a change
    await editor.setContent('Updated content');

    // Wait for preview to update
    await waitForPreviewUpdate(window);

    // Verify the update
    const hasUpdated = await preview.containsText('Updated content');
    expect(hasUpdated).toBe(true);
  });

  test('should navigate between views', async ({ electronApp }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);

    // Navigate to editor
    await navigateToView(window, 'editor');

    const editor = new EditorPanel(window);
    expect(await editor.isVisible()).toBe(true);

    // Navigate to preview
    await navigateToView(window, 'preview');

    const preview = new PreviewPanel(window);
    expect(await preview.isVisible()).toBe(true);
  });

  test('should navigate between chapters', async ({ electronApp }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Navigate to chapter 1
    await navigateToChapter(window, 1);

    // Verify selection
    let selected = await navigator.getSelectedItem();
    expect(selected).toContain('Chapter');

    // Navigate to chapter 2
    await navigateToChapter(window, 2);

    selected = await navigator.getSelectedItem();
    expect(selected).toContain('Chapter');
  });

  test('should use all components together', async ({ electronApp }) => {
    const { window } = electronApp;

    // 1. Open a complete book
    await openProject(window, mockBooks.complete);

    // 2. Initialize all page objects
    const navigator = new NavigatorPanel(window);
    const editor = new EditorPanel(window);
    const preview = new PreviewPanel(window);

    // 3. Wait for everything to be ready
    await navigator.waitForReady();
    await editor.waitForReady();
    await preview.waitForReady();

    // 4. Get initial state
    const initialChapters = await navigator.getChapterTitles();
    expect(initialChapters.length).toBe(3);

    // 5. Select a chapter
    await navigator.selectChapter(1);

    // 6. Edit content
    await editor.setContent('This is the updated first chapter.');

    // 7. Wait for preview to update
    await waitForPreviewUpdate(window);

    // 8. Verify in preview
    const previewHasUpdate = await preview.containsText(
      'This is the updated first chapter'
    );
    expect(previewHasUpdate).toBe(true);

    // 9. Navigate to another chapter
    await navigator.selectChapter(2);

    // 10. Add more content
    await editor.type('\n\nAdditional content for chapter 2.');

    // 11. Wait and verify again
    await waitForPreviewUpdate(window);

    const previewHasChapter2 = await preview.containsText(
      'Additional content for chapter 2'
    );
    expect(previewHasChapter2).toBe(true);
  });

  test('should handle empty book', async ({ electronApp }) => {
    const { window } = electronApp;

    // Create new project
    await createNewProject(window);

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Empty book should have no chapters initially
    const chapterCount = await navigator.getChapterCount();
    expect(chapterCount).toBe(0);

    // Add a chapter
    await navigator.addChapter();

    // Now should have 1 chapter
    const newCount = await navigator.getChapterCount();
    expect(newCount).toBe(1);
  });

  test('should use large book for performance', async ({ electronApp }) => {
    const { window } = electronApp;

    // Use large book fixture
    await openProject(window, mockBooks.large);

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Large book should have many chapters
    const chapterCount = await navigator.getChapterCount();
    expect(chapterCount).toBeGreaterThanOrEqual(50);

    // Navigate through chapters
    await navigator.selectChapter(25);

    const editor = new EditorPanel(window);
    await editor.waitForReady();

    // Verify editor loaded
    const content = await editor.getContent();
    expect(content).toContain('chapter 25');
  });
});

test.describe('Project Lifecycle', () => {
  test('should create, edit, and close project', async ({ electronApp }) => {
    const { window } = electronApp;

    // 1. Create new project
    await createNewProject(window);

    // 2. Verify it's open
    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // 3. Add a chapter
    await navigator.addChapter();

    // 4. Edit the chapter
    const editor = new EditorPanel(window);
    await editor.waitForReady();
    await editor.setContent('First chapter content');

    // 5. Verify in preview
    const preview = new PreviewPanel(window);
    await preview.waitForReady();
    await waitForPreviewUpdate(window);

    const hasContent = await preview.containsText('First chapter content');
    expect(hasContent).toBe(true);

    // 6. Close project
    await closeProject(window);

    // 7. Verify we're back at welcome screen
    await navigateToView(window, 'welcome');
  });
});

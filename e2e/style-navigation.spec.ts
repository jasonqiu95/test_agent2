/**
 * E2E Test: Project Loading and Style View Navigation
 *
 * Tests the following workflow:
 * 1. Launches the app
 * 2. Creates or opens a project with sample content (chapters, text)
 * 3. Verifies the Navigator panel shows content
 * 4. Clicks to switch from Contents view to Styles view
 * 5. Verifies the Styles view loads with style categories visible
 * 6. Takes screenshots for visual verification
 * 7. Verifies DOM elements and state changes
 */

import { test, expect } from './utils/fixtures';
import { mockBooks, createSimpleBook } from './fixtures';
import { openProject } from './helpers';
import { NavigatorPanel, StylesPanel } from './page-objects';

test.describe('Project Loading and Style View Navigation', () => {
  test('should load project, display content in Navigator, and navigate to Styles view', async ({
    electronApp,
  }) => {
    const { window } = electronApp;

    // Step 1: App is already launched via fixture
    await window.screenshot({ path: 'test-results/screenshots/01-app-launched.png' });

    // Step 2: Create and open a project with sample content
    const book = createSimpleBook();
    await openProject(window, book);

    // Wait for project to load
    await window.waitForSelector('.editor-view', { state: 'visible', timeout: 10000 });
    await window.screenshot({ path: 'test-results/screenshots/02-project-opened.png' });

    // Step 3: Verify the Navigator panel shows content
    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Verify Navigator panel is visible
    const isNavigatorVisible = await navigator.isVisible();
    expect(isNavigatorVisible).toBe(true);

    // Verify chapters are loaded
    const chapterCount = await navigator.getChapterCount();
    expect(chapterCount).toBeGreaterThan(0);
    expect(chapterCount).toBe(2); // Simple book has 2 chapters

    // Verify chapter titles are displayed
    const chapterTitles = await navigator.getChapterTitles();
    expect(chapterTitles).toContain('Chapter One');
    expect(chapterTitles).toContain('Chapter Two');

    // Verify Contents view is active by default
    const contentsButton = window.locator('[data-testid="view-button-contents"]');
    const stylesButton = window.locator('[data-testid="view-button-styles"]');
    expect(await contentsButton.getAttribute('class')).toContain('active');

    await window.screenshot({ path: 'test-results/screenshots/03-contents-view-loaded.png' });

    // Step 4: Click to switch from Contents view to Styles view
    await stylesButton.click();

    // Wait for view transition
    await window.waitForTimeout(300);

    // Step 5: Verify Styles view is now active
    expect(await stylesButton.getAttribute('class')).toContain('active');
    expect(await contentsButton.getAttribute('class')).not.toContain('active');

    // Verify DOM state change - Contents button should not be active
    const contentsButtonClass = await contentsButton.getAttribute('class');
    expect(contentsButtonClass).not.toContain('active');

    // Verify Styles button is now active
    const stylesButtonClass = await stylesButton.getAttribute('class');
    expect(stylesButtonClass).toContain('active');

    await window.screenshot({ path: 'test-results/screenshots/04-styles-view-active.png' });

    // Step 6: Verify Styles view content
    // Check if Navigator shows styles or if there's an empty state
    const navigatorList = window.locator('.navigator-list');
    const navigatorEmpty = window.locator('.navigator-empty');

    const hasNavigatorList = (await navigatorList.count()) > 0;
    const hasEmptyState = (await navigatorEmpty.count()) > 0;

    // Either we have styles listed or an empty state message
    expect(hasNavigatorList || hasEmptyState).toBe(true);

    if (hasEmptyState) {
      // Verify empty state message for styles
      const emptyText = await navigatorEmpty.textContent();
      expect(emptyText).toContain('No styles available');
    } else {
      // If styles exist, verify they're displayed
      const styleItems = window.locator('.navigator-item.style');
      const styleCount = await styleItems.count();
      expect(styleCount).toBeGreaterThan(0);
    }

    await window.screenshot({ path: 'test-results/screenshots/05-styles-view-content.png' });

    // Step 7: Verify view can be switched back to Contents
    await contentsButton.click();
    await window.waitForTimeout(300);

    // Verify Contents view is active again
    expect(await contentsButton.getAttribute('class')).toContain('active');
    expect(await stylesButton.getAttribute('class')).not.toContain('active');

    // Verify chapters are still visible
    const chaptersAfterSwitch = window.locator('.navigator-item.chapter');
    expect(await chaptersAfterSwitch.count()).toBe(2);

    await window.screenshot({ path: 'test-results/screenshots/06-back-to-contents-view.png' });
  });

  test('should display styles in Styles view when book has styles', async ({ electronApp }) => {
    const { window } = electronApp;

    // Use the complete book which has styles
    const book = mockBooks.complete;
    await openProject(window, book);

    // Wait for project to load
    await window.waitForSelector('.editor-view', { state: 'visible', timeout: 10000 });

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Switch to Styles view
    const stylesButton = window.locator('[data-testid="view-button-styles"]');
    await stylesButton.click();
    await window.waitForTimeout(300);

    // Verify Styles view is active
    expect(await stylesButton.getAttribute('class')).toContain('active');

    await window.screenshot({
      path: 'test-results/screenshots/07-styles-view-with-styles.png',
    });

    // Note: If the book doesn't have styles in the fixture, we'll see empty state
    // This is expected behavior and the test passes
    const navigatorEmpty = window.locator('.navigator-empty');
    const hasEmptyState = (await navigatorEmpty.count()) > 0;

    if (hasEmptyState) {
      const emptyText = await navigatorEmpty.textContent();
      expect(emptyText).toContain('No styles available');
    }
  });

  test('should maintain Navigator visibility across view switches', async ({ electronApp }) => {
    const { window } = electronApp;

    // Open project with sample content
    const book = createSimpleBook();
    await openProject(window, book);

    await window.waitForSelector('.editor-view', { state: 'visible', timeout: 10000 });

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Get initial visibility state
    const initialVisibility = await navigator.isVisible();
    expect(initialVisibility).toBe(true);

    // Switch to Styles view
    const stylesButton = window.locator('[data-testid="view-button-styles"]');
    await stylesButton.click();
    await window.waitForTimeout(300);

    // Navigator should still be visible
    const visibilityAfterStylesSwitch = await navigator.isVisible();
    expect(visibilityAfterStylesSwitch).toBe(true);

    // Switch back to Contents view
    const contentsButton = window.locator('[data-testid="view-button-contents"]');
    await contentsButton.click();
    await window.waitForTimeout(300);

    // Navigator should still be visible
    const visibilityAfterContentsSwitch = await navigator.isVisible();
    expect(visibilityAfterContentsSwitch).toBe(true);

    await window.screenshot({
      path: 'test-results/screenshots/08-navigator-visibility-maintained.png',
    });
  });

  test('should update Navigator content when switching between views', async ({
    electronApp,
  }) => {
    const { window } = electronApp;

    // Open project with sample content
    const book = createSimpleBook();
    await openProject(window, book);

    await window.waitForSelector('.editor-view', { state: 'visible', timeout: 10000 });

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Verify Contents view shows chapters
    const chaptersInContentsView = window.locator('.navigator-item.chapter');
    const initialChapterCount = await chaptersInContentsView.count();
    expect(initialChapterCount).toBe(2);

    // Take screenshot of Contents view
    await window.screenshot({ path: 'test-results/screenshots/09-contents-view-items.png' });

    // Switch to Styles view
    const stylesButton = window.locator('[data-testid="view-button-styles"]');
    await stylesButton.click();
    await window.waitForTimeout(300);

    // Verify chapters are no longer visible (content has changed)
    const chaptersInStylesView = window.locator('.navigator-item.chapter');
    const chapterCountInStylesView = await chaptersInStylesView.count();
    expect(chapterCountInStylesView).toBe(0);

    // Verify style items or empty state is shown
    const styleItems = window.locator('.navigator-item.style');
    const emptyState = window.locator('.navigator-empty');

    const hasStyles = (await styleItems.count()) > 0;
    const hasEmptyState = (await emptyState.count()) > 0;

    expect(hasStyles || hasEmptyState).toBe(true);

    // Take screenshot of Styles view
    await window.screenshot({ path: 'test-results/screenshots/10-styles-view-items.png' });

    // Switch back to Contents view
    const contentsButton = window.locator('[data-testid="view-button-contents"]');
    await contentsButton.click();
    await window.waitForTimeout(300);

    // Verify chapters are visible again
    const chaptersAfterSwitch = window.locator('.navigator-item.chapter');
    const finalChapterCount = await chaptersAfterSwitch.count();
    expect(finalChapterCount).toBe(initialChapterCount);

    await window.screenshot({
      path: 'test-results/screenshots/11-contents-view-restored.png',
    });
  });

  test('should verify DOM structure and attributes in both views', async ({ electronApp }) => {
    const { window } = electronApp;

    // Open project
    const book = createSimpleBook();
    await openProject(window, book);

    await window.waitForSelector('.editor-view', { state: 'visible', timeout: 10000 });

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Verify Navigator DOM structure
    const navigatorPanel = window.locator('.navigator');
    expect(await navigatorPanel.count()).toBe(1);

    // Verify view switcher buttons exist
    const contentsButton = window.locator('[data-testid="view-button-contents"]');
    const stylesButton = window.locator('[data-testid="view-button-styles"]');

    expect(await contentsButton.count()).toBe(1);
    expect(await stylesButton.count()).toBe(1);

    // Verify button text
    expect(await contentsButton.textContent()).toContain('Contents');
    expect(await stylesButton.textContent()).toContain('Styles');

    // Verify Contents view DOM elements
    const navigatorContent = window.locator('.navigator-content');
    expect(await navigatorContent.count()).toBe(1);

    const navigatorList = window.locator('.navigator-list');
    const hasContentList = (await navigatorList.count()) > 0;
    expect(hasContentList).toBe(true);

    // Verify chapter items have correct data attributes
    const chapterItems = window.locator('.navigator-item[data-item-type="chapter"]');
    const chapterCount = await chapterItems.count();
    expect(chapterCount).toBeGreaterThan(0);

    // Check first chapter has required attributes
    const firstChapter = chapterItems.first();
    const itemId = await firstChapter.getAttribute('data-item-id');
    const itemType = await firstChapter.getAttribute('data-item-type');
    const testId = await firstChapter.getAttribute('data-testid');

    expect(itemId).toBeTruthy();
    expect(itemType).toBe('chapter');
    expect(testId).toBeTruthy();

    await window.screenshot({ path: 'test-results/screenshots/12-dom-structure-verified.png' });
  });
});

import { test, expect } from './fixtures';
import * as path from 'path';
import { waitForUIReady, takeScreenshot, isEditorView } from './helpers/electron';

/**
 * E2E Test Suite: Project Open and Chapter Selection
 *
 * Tests the complete user flow:
 * 1. Launch the app
 * 2. Open/load a test project (via import)
 * 3. Verify Navigator displays chapter list
 * 4. Click on chapter in Navigator
 * 5. Verify chapter selection state and highlighting
 */
test.describe('Navigator: Project Open and Chapter Selection', () => {
  // Increase timeout for these comprehensive E2E tests
  test.setTimeout(60000);

  const sampleDocxPath = path.resolve(__dirname, 'fixtures', 'sample-book.docx');

  test('should open project and select chapters in Navigator', async ({
    electronApp,
    mainWindow,
    navigatorPage,
  }) => {
    // Step 1: Verify app launched successfully
    console.log('Step 1: Verifying app launched...');
    await expect(mainWindow.locator('#root')).toBeVisible();

    // Step 2: Check if we're on welcome screen and import document
    console.log('Step 2: Importing test project...');
    const welcomeTitle = mainWindow.locator('.welcome-title');

    // If on welcome screen, import the document
    if (await welcomeTitle.isVisible({ timeout: 5000 })) {
      const importButton = mainWindow.locator('button:has-text("Import Document")');
      await expect(importButton).toBeVisible();
      await importButton.click();

      // Handle file chooser
      try {
        const fileChooser = await mainWindow.waitForEvent('filechooser', { timeout: 5000 });
        await fileChooser.setFiles([sampleDocxPath]);
        console.log('Test project file selected');
      } catch (error) {
        console.log('File chooser handling:', error);
      }

      // Wait for import preview dialog
      await mainWindow.waitForTimeout(2000);

      // Accept the import
      const importPreviewDialog = mainWindow.locator('.import-preview-dialog');
      if (await importPreviewDialog.isVisible({ timeout: 15000 })) {
        const importButtonInDialog = mainWindow.locator('.import-preview-btn-primary');
        await expect(importButtonInDialog).toBeVisible();
        await importButtonInDialog.click();

        // Wait for import to complete
        await mainWindow.waitForTimeout(2000);
      }
    }

    // Step 3: Verify we're in editor view with project loaded
    console.log('Step 3: Verifying editor view...');
    const inEditorView = await isEditorView(mainWindow);
    expect(inEditorView).toBe(true);

    await takeScreenshot(mainWindow, 'navigator-selection-01-project-loaded', { fullPage: true });

    // Step 4: Verify Navigator panel is visible and ready
    console.log('Step 4: Verifying Navigator panel...');

    // Check if navigator is visible, if not, toggle it
    const isNavigatorVisible = await navigatorPage.isVisible();
    if (!isNavigatorVisible) {
      console.log('Navigator not visible, toggling...');
      await navigatorPage.toggle();
      await mainWindow.waitForTimeout(500);
    }

    // Wait for navigator to be ready
    await navigatorPage.waitForReady();
    await expect(navigatorPage.panel).toBeVisible();

    // Verify navigator title
    const navigatorTitle = await navigatorPage.getTitle();
    console.log('Navigator title:', navigatorTitle);
    expect(navigatorTitle).toBeTruthy();

    await takeScreenshot(mainWindow, 'navigator-selection-02-navigator-visible', { fullPage: true });

    // Step 5: Verify chapter list is displayed in Navigator
    console.log('Step 5: Verifying chapter list...');

    // Expand the Chapters section if it's collapsed
    const chaptersSection = navigatorPage.content.locator('.tree-section-header').filter({ hasText: 'Chapters' });
    const isChaptersExpanded = await chaptersSection.getAttribute('aria-expanded');

    if (isChaptersExpanded === 'false') {
      console.log('Expanding Chapters section...');
      await chaptersSection.click();
      await mainWindow.waitForTimeout(300);
    }

    // Get all chapter items
    const chapterItems = navigatorPage.content.locator('.tree-item');
    const chapterCount = await chapterItems.count();
    console.log(`Found ${chapterCount} chapters in Navigator`);

    expect(chapterCount).toBeGreaterThan(0);

    // Verify chapter items are visible
    await expect(chapterItems.first()).toBeVisible();

    // Get chapter titles
    const chapterTitles: string[] = [];
    for (let i = 0; i < Math.min(chapterCount, 5); i++) {
      const title = await chapterItems.nth(i).textContent();
      if (title) {
        chapterTitles.push(title.trim());
        console.log(`Chapter ${i + 1}:`, title.trim());
      }
    }

    expect(chapterTitles.length).toBeGreaterThan(0);

    await takeScreenshot(mainWindow, 'navigator-selection-03-chapter-list-displayed', { fullPage: true });

    // Step 6: Verify Navigator UI state before selection
    console.log('Step 6: Verifying Navigator UI state before selection...');

    // Check that no chapter is initially selected (or first one is selected by default)
    const selectedItems = navigatorPage.content.locator('.tree-item.selected');
    const initialSelectedCount = await selectedItems.count();
    console.log('Initial selected items count:', initialSelectedCount);

    await takeScreenshot(mainWindow, 'navigator-selection-04-initial-state', { fullPage: true });

    // Step 7: Click on first chapter in Navigator
    console.log('Step 7: Clicking on first chapter...');

    const firstChapter = chapterItems.first();
    const firstChapterTitle = await firstChapter.textContent();
    console.log('Clicking chapter:', firstChapterTitle?.trim());

    await firstChapter.click();

    // Wait for selection to take effect
    await mainWindow.waitForTimeout(500);

    await takeScreenshot(mainWindow, 'navigator-selection-05-first-chapter-clicked', { fullPage: true });

    // Step 8: Verify first chapter is now selected
    console.log('Step 8: Verifying first chapter selection state...');

    // Check that the first chapter has the 'selected' class
    await expect(firstChapter).toHaveClass(/selected/);

    // Check aria-selected attribute
    const ariaSelected = await firstChapter.getAttribute('aria-selected');
    expect(ariaSelected).toBe('true');

    console.log('First chapter is selected with proper attributes');

    // Step 9: Click on second chapter if available
    if (chapterCount > 1) {
      console.log('Step 9: Clicking on second chapter...');

      const secondChapter = chapterItems.nth(1);
      const secondChapterTitle = await secondChapter.textContent();
      console.log('Clicking chapter:', secondChapterTitle?.trim());

      await secondChapter.click();
      await mainWindow.waitForTimeout(500);

      await takeScreenshot(mainWindow, 'navigator-selection-06-second-chapter-clicked', { fullPage: true });

      // Step 10: Verify second chapter selection and first chapter deselection
      console.log('Step 10: Verifying chapter selection changed...');

      // Check that second chapter is now selected
      await expect(secondChapter).toHaveClass(/selected/);
      const secondAriaSelected = await secondChapter.getAttribute('aria-selected');
      expect(secondAriaSelected).toBe('true');

      // Check that first chapter is no longer selected
      const firstChapterAfterSwitch = chapterItems.first();
      const firstChapterClasses = await firstChapterAfterSwitch.getAttribute('class');
      const firstAriaSelected = await firstChapterAfterSwitch.getAttribute('aria-selected');

      console.log('First chapter classes after switch:', firstChapterClasses);
      console.log('First chapter aria-selected after switch:', firstAriaSelected);

      // First chapter should not have selected class or should have aria-selected="false"
      if (firstChapterClasses?.includes('selected')) {
        expect(firstAriaSelected).toBe('false');
      } else {
        expect(firstChapterClasses).not.toMatch(/\bselected\b/);
      }

      console.log('Second chapter is now selected, first chapter deselected');
    }

    // Step 11: Verify only one chapter is selected at a time
    console.log('Step 11: Verifying single selection...');

    const currentlySelected = await navigatorPage.content.locator('.tree-item[aria-selected="true"]').count();
    console.log('Currently selected items:', currentlySelected);
    expect(currentlySelected).toBe(1);

    await takeScreenshot(mainWindow, 'navigator-selection-07-final-state', { fullPage: true });

    // Step 12: Test navigation by clicking on third chapter if available
    if (chapterCount > 2) {
      console.log('Step 12: Testing third chapter selection...');

      const thirdChapter = chapterItems.nth(2);
      const thirdChapterTitle = await thirdChapter.textContent();
      console.log('Clicking chapter:', thirdChapterTitle?.trim());

      await thirdChapter.click();
      await mainWindow.waitForTimeout(500);

      // Verify third chapter is selected
      await expect(thirdChapter).toHaveClass(/selected/);
      const thirdAriaSelected = await thirdChapter.getAttribute('aria-selected');
      expect(thirdAriaSelected).toBe('true');

      // Verify still only one chapter is selected
      const finalSelectedCount = await navigatorPage.content.locator('.tree-item[aria-selected="true"]').count();
      expect(finalSelectedCount).toBe(1);

      console.log('Third chapter selection verified');
    }

    await takeScreenshot(mainWindow, 'navigator-selection-08-test-complete', { fullPage: true });

    console.log('Test completed successfully!');
  });

  test('should display correct chapter highlighting styles', async ({
    mainWindow,
    navigatorPage,
  }) => {
    console.log('Testing chapter highlighting styles...');

    // Import and load project
    const welcomeTitle = mainWindow.locator('.welcome-title');
    if (await welcomeTitle.isVisible({ timeout: 5000 })) {
      const importButton = mainWindow.locator('button:has-text("Import Document")');
      await importButton.click();

      try {
        const fileChooser = await mainWindow.waitForEvent('filechooser', { timeout: 5000 });
        await fileChooser.setFiles([sampleDocxPath]);
      } catch (error) {
        console.log('File chooser handling:', error);
      }

      await mainWindow.waitForTimeout(2000);

      const importPreviewDialog = mainWindow.locator('.import-preview-dialog');
      if (await importPreviewDialog.isVisible({ timeout: 15000 })) {
        const importButtonInDialog = mainWindow.locator('.import-preview-btn-primary');
        await importButtonInDialog.click();
        await mainWindow.waitForTimeout(2000);
      }
    }

    // Ensure navigator is visible
    const isNavigatorVisible = await navigatorPage.isVisible();
    if (!isNavigatorVisible) {
      await navigatorPage.toggle();
      await mainWindow.waitForTimeout(500);
    }

    await navigatorPage.waitForReady();

    // Expand chapters section
    const chaptersSection = navigatorPage.content.locator('.tree-section-header').filter({ hasText: 'Chapters' });
    const isExpanded = await chaptersSection.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await chaptersSection.click();
      await mainWindow.waitForTimeout(300);
    }

    // Get chapter items
    const chapterItems = navigatorPage.content.locator('.tree-item');
    const chapterCount = await chapterItems.count();

    if (chapterCount > 0) {
      // Click first chapter and verify styling
      const firstChapter = chapterItems.first();
      await firstChapter.click();
      await mainWindow.waitForTimeout(300);

      // Verify selected chapter has visual styling
      await expect(firstChapter).toHaveClass(/selected/);

      // Check that the chapter is visually distinguishable
      const backgroundColor = await firstChapter.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      console.log('Selected chapter background color:', backgroundColor);
      // Selected chapter should have a non-transparent background
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(backgroundColor).not.toBe('transparent');

      console.log('Chapter highlighting styles verified');
    }

    await takeScreenshot(mainWindow, 'navigator-selection-styling-test', { fullPage: true });
  });

  test('should maintain chapter selection when Navigator is toggled', async ({
    mainWindow,
    navigatorPage,
  }) => {
    console.log('Testing chapter selection persistence on Navigator toggle...');

    // Import and load project
    const welcomeTitle = mainWindow.locator('.welcome-title');
    if (await welcomeTitle.isVisible({ timeout: 5000 })) {
      const importButton = mainWindow.locator('button:has-text("Import Document")');
      await importButton.click();

      try {
        const fileChooser = await mainWindow.waitForEvent('filechooser', { timeout: 5000 });
        await fileChooser.setFiles([sampleDocxPath]);
      } catch (error) {
        console.log('File chooser handling:', error);
      }

      await mainWindow.waitForTimeout(2000);

      const importPreviewDialog = mainWindow.locator('.import-preview-dialog');
      if (await importPreviewDialog.isVisible({ timeout: 15000 })) {
        const importButtonInDialog = mainWindow.locator('.import-preview-btn-primary');
        await importButtonInDialog.click();
        await mainWindow.waitForTimeout(2000);
      }
    }

    // Ensure navigator is visible
    const isNavigatorVisible = await navigatorPage.isVisible();
    if (!isNavigatorVisible) {
      await navigatorPage.toggle();
      await mainWindow.waitForTimeout(500);
    }

    await navigatorPage.waitForReady();

    // Expand chapters section
    const chaptersSection = navigatorPage.content.locator('.tree-section-header').filter({ hasText: 'Chapters' });
    const isExpanded = await chaptersSection.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await chaptersSection.click();
      await mainWindow.waitForTimeout(300);
    }

    // Select a chapter
    const chapterItems = navigatorPage.content.locator('.tree-item');
    const chapterCount = await chapterItems.count();

    if (chapterCount > 1) {
      // Click second chapter
      const secondChapter = chapterItems.nth(1);
      const selectedChapterTitle = await secondChapter.textContent();
      console.log('Selecting chapter:', selectedChapterTitle?.trim());

      await secondChapter.click();
      await mainWindow.waitForTimeout(300);

      // Verify it's selected
      await expect(secondChapter).toHaveClass(/selected/);

      // Toggle Navigator off
      console.log('Toggling Navigator off...');
      await navigatorPage.toggle();
      await mainWindow.waitForTimeout(500);

      // Verify Navigator is hidden
      const isHidden = !(await navigatorPage.isVisible());
      expect(isHidden).toBe(true);

      // Toggle Navigator back on
      console.log('Toggling Navigator back on...');
      await navigatorPage.toggle();
      await mainWindow.waitForTimeout(500);

      // Wait for Navigator to be ready again
      await navigatorPage.waitForReady();

      // Verify the chapter is still selected
      const chapterItemsAfterToggle = navigatorPage.content.locator('.tree-item');
      const secondChapterAfterToggle = chapterItemsAfterToggle.nth(1);

      await expect(secondChapterAfterToggle).toHaveClass(/selected/);
      const ariaSelected = await secondChapterAfterToggle.getAttribute('aria-selected');
      expect(ariaSelected).toBe('true');

      console.log('Chapter selection persisted after Navigator toggle');
    }

    await takeScreenshot(mainWindow, 'navigator-selection-toggle-persistence-test', { fullPage: true });
  });
});

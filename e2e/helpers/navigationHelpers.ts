/**
 * Navigation helper utilities for E2E tests
 *
 * These helpers provide navigation and view-switching functionality
 * for E2E tests.
 */

import { Page, Locator } from '@playwright/test';

/**
 * Available views in the application
 */
export type AppView = 'welcome' | 'editor' | 'preview' | 'styles' | 'settings';

/**
 * Available panels in the editor view
 */
export type EditorPanel = 'navigator' | 'editor' | 'preview' | 'styles';

/**
 * Navigate to a specific view
 *
 * @param page - The Playwright page object
 * @param view - The view to navigate to
 */
export async function navigateToView(
  page: Page,
  view: AppView
): Promise<void> {
  switch (view) {
    case 'welcome':
      // Click back button or menu item
      const backButton = page.locator('button:has-text("Back to Welcome")');
      if (await backButton.count() > 0) {
        await backButton.click();
      }
      break;

    case 'editor':
      // Ensure we're in editor view
      const editorView = page.locator('.editor-view');
      if (!(await editorView.isVisible())) {
        // Need to open a project first
        throw new Error('Cannot navigate to editor without opening a project');
      }
      break;

    case 'preview':
      // Switch to preview tab/panel
      const previewTab = page.locator('[data-view="preview"]');
      await previewTab.click();
      break;

    case 'styles':
      // Switch to styles tab/panel
      const stylesTab = page.locator('[data-view="styles"]');
      await stylesTab.click();
      break;

    case 'settings':
      // Open settings dialog
      const settingsButton = page.locator('button[aria-label="Settings"]');
      await settingsButton.click();
      break;
  }

  // Wait for the view to be visible
  await waitForViewReady(page, view);
}

/**
 * Wait for a view to be ready
 *
 * @param page - The Playwright page object
 * @param view - The view to wait for
 * @param timeout - Timeout in milliseconds
 */
export async function waitForViewReady(
  page: Page,
  view: AppView,
  timeout: number = 10000
): Promise<void> {
  const selectors: Record<AppView, string> = {
    welcome: '.welcome-screen',
    editor: '.editor-view',
    preview: '.preview-panel',
    styles: '.styles-panel',
    settings: '.settings-dialog',
  };

  const selector = selectors[view];
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Toggle a panel's visibility
 *
 * @param page - The Playwright page object
 * @param panel - The panel to toggle
 */
export async function togglePanel(
  page: Page,
  panel: EditorPanel
): Promise<void> {
  const toggleButton = page.locator(`button[data-toggle="${panel}"]`);
  await toggleButton.click();
}

/**
 * Check if a panel is visible
 *
 * @param page - The Playwright page object
 * @param panel - The panel to check
 * @returns True if the panel is visible
 */
export async function isPanelVisible(
  page: Page,
  panel: EditorPanel
): Promise<boolean> {
  const panelElement = page.locator(`[data-panel="${panel}"]`);
  return await panelElement.isVisible();
}

/**
 * Navigate to a specific chapter in the navigator
 *
 * @param page - The Playwright page object
 * @param chapterNumber - The chapter number to navigate to
 */
export async function navigateToChapter(
  page: Page,
  chapterNumber: number
): Promise<void> {
  const chapterItem = page.locator(
    `.navigator-chapter[data-chapter="${chapterNumber}"]`
  );
  await chapterItem.click();

  // Wait for the chapter to load in the editor
  await page.waitForTimeout(500);
}

/**
 * Navigate to a specific section within a chapter
 *
 * @param page - The Playwright page object
 * @param chapterNumber - The chapter number
 * @param sectionId - The section identifier
 */
export async function navigateToSection(
  page: Page,
  chapterNumber: number,
  sectionId: string
): Promise<void> {
  // First navigate to the chapter
  await navigateToChapter(page, chapterNumber);

  // Then scroll to the section
  await page.evaluate((id) => {
    const section = document.querySelector(`[data-section="${id}"]`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, sectionId);
}

/**
 * Open a dialog by name
 *
 * @param page - The Playwright page object
 * @param dialogName - The name of the dialog to open
 */
export async function openDialog(
  page: Page,
  dialogName: string
): Promise<void> {
  const button = page.locator(`button[data-opens="${dialogName}"]`);
  await button.click();

  // Wait for dialog to be visible
  await page.waitForSelector(`.${dialogName}-dialog`, {
    state: 'visible',
    timeout: 5000,
  });
}

/**
 * Close the currently open dialog
 *
 * @param page - The Playwright page object
 */
export async function closeDialog(page: Page): Promise<void> {
  // Try to find a close button
  const closeButton = page.locator('.dialog-close, button:has-text("Close")');
  if (await closeButton.count() > 0) {
    await closeButton.click();
  } else {
    // Try pressing Escape
    await page.keyboard.press('Escape');
  }

  // Wait for dialog to be hidden
  await page.waitForTimeout(300);
}

/**
 * Get the current URL or route
 *
 * @param page - The Playwright page object
 * @returns The current URL
 */
export async function getCurrentRoute(page: Page): Promise<string> {
  return page.url();
}

/**
 * Wait for navigation to complete
 *
 * @param page - The Playwright page object
 * @param timeout - Timeout in milliseconds
 */
export async function waitForNavigation(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Scroll to an element
 *
 * @param page - The Playwright page object
 * @param selector - CSS selector of the element
 */
export async function scrollToElement(
  page: Page,
  selector: string
): Promise<void> {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, selector);
}

/**
 * Get breadcrumb navigation path
 *
 * @param page - The Playwright page object
 * @returns Array of breadcrumb labels
 */
export async function getBreadcrumbs(page: Page): Promise<string[]> {
  const breadcrumbs = page.locator('.breadcrumb-item');
  const count = await breadcrumbs.count();
  const items: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await breadcrumbs.nth(i).textContent();
    if (text) {
      items.push(text.trim());
    }
  }

  return items;
}

/**
 * Check if currently on a specific view
 *
 * @param page - The Playwright page object
 * @param view - The view to check
 * @returns True if on the specified view
 */
export async function isOnView(
  page: Page,
  view: AppView
): Promise<boolean> {
  const selectors: Record<AppView, string> = {
    welcome: '.welcome-screen',
    editor: '.editor-view',
    preview: '.preview-panel',
    styles: '.styles-panel',
    settings: '.settings-dialog',
  };

  const selector = selectors[view];
  const element = page.locator(selector);
  return await element.isVisible();
}

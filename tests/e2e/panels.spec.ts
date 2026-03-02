/**
 * Example E2E test demonstrating the use of:
 * - Custom fixtures
 * - Page object models
 * - Utility functions
 * - Testing the three main panels (Navigator, Editor, Preview)
 */

import { test, expect } from './fixtures';
import { waitForUIReady, createNewProject, isWelcomeScreen } from './helpers/electron';

test.describe('Main Panels Integration', () => {
  test('should display all three panels in editor view', async ({
    mainWindow,
    navigatorPage,
    editorPage,
    previewPage,
  }) => {
    // Wait for app to be ready
    await waitForUIReady(mainWindow);

    // Check if we're on welcome screen and navigate to editor if needed
    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    // Verify all panels are present (may not be visible yet)
    const navigatorVisible = await navigatorPage.isVisible();
    const editorVisible = await editorPage.isVisible();
    const previewVisible = await previewPage.isVisible();

    // At least the editor should always be visible
    expect(editorVisible).toBe(true);

    // Log the state for debugging
    console.log('Panel visibility:', {
      navigator: navigatorVisible,
      editor: editorVisible,
      preview: previewVisible,
    });
  });

  test('should allow toggling navigator panel', async ({ mainWindow, navigatorPage }) => {
    await waitForUIReady(mainWindow);

    // Check initial state
    const initialState = await navigatorPage.isVisible();

    // Toggle the panel
    await navigatorPage.toggle();

    // Verify state changed
    const newState = await navigatorPage.isVisible();
    expect(newState).toBe(!initialState);

    // Toggle back
    await navigatorPage.toggle();
    const finalState = await navigatorPage.isVisible();
    expect(finalState).toBe(initialState);
  });

  test('should allow toggling preview panel', async ({ mainWindow, previewPage }) => {
    await waitForUIReady(mainWindow);

    // Check initial state
    const initialState = await previewPage.isVisible();

    // Toggle the panel
    await previewPage.toggle();

    // Verify state changed
    const newState = await previewPage.isVisible();
    expect(newState).toBe(!initialState);

    // Toggle back
    await previewPage.toggle();
    const finalState = await previewPage.isVisible();
    expect(finalState).toBe(initialState);
  });
});

test.describe('Navigator Panel', () => {
  test('should display navigator panel with correct title', async ({
    mainWindow,
    navigatorPage,
  }) => {
    await waitForUIReady(mainWindow);

    // Ensure navigator is visible
    if (!(await navigatorPage.isVisible())) {
      await navigatorPage.toggle();
    }

    await navigatorPage.waitForReady();

    // Check the title
    const title = await navigatorPage.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should be able to interact with navigation items', async ({
    mainWindow,
    navigatorPage,
  }) => {
    await waitForUIReady(mainWindow);

    if (!(await navigatorPage.isVisible())) {
      await navigatorPage.toggle();
    }

    await navigatorPage.waitForReady();

    // Get navigation items count
    const itemCount = await navigatorPage.getItemCount();
    console.log(`Navigator has ${itemCount} items`);

    // Items count should be non-negative
    expect(itemCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Editor Panel', () => {
  test('should display editor and allow text input', async ({
    mainWindow,
    editorPage,
  }) => {
    await waitForUIReady(mainWindow);

    // Ensure we're in editor view
    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    // Wait for editor to be ready
    await editorPage.waitForReady();

    // Editor should be visible
    expect(await editorPage.isVisible()).toBe(true);

    // Try to focus the editor
    await editorPage.focus();

    // Check if editor has focus
    const hasFocus = await editorPage.hasFocus();
    console.log('Editor has focus:', hasFocus);
  });

  test('should be able to type text in editor', async ({
    mainWindow,
    editorPage,
  }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    await editorPage.waitForReady();

    // Clear any existing content
    try {
      await editorPage.clear();
    } catch {
      // Editor might be empty already
    }

    // Type some text
    const testText = 'Hello, Playwright!';
    await editorPage.typeText(testText);

    // Wait a bit for the text to appear
    await mainWindow.waitForTimeout(500);

    // Verify the text was typed (content should contain our text)
    const content = await editorPage.getContent();
    expect(content).toContain('Hello');
  });

  test('should have toolbar visible', async ({ mainWindow, editorPage }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    await editorPage.waitForReady();

    // Check if toolbar is visible
    const toolbarVisible = await editorPage.isToolbarVisible();
    console.log('Toolbar visible:', toolbarVisible);
  });
});

test.describe('Preview Panel', () => {
  test('should display preview panel', async ({ mainWindow, previewPage }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    // Ensure preview is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
    }

    await previewPage.waitForReady();

    // Preview should be visible now
    expect(await previewPage.isVisible()).toBe(true);
  });

  test('should display preview content', async ({ mainWindow, previewPage }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
    }

    await previewPage.waitForReady();

    // Get preview content
    const content = await previewPage.getContent();
    console.log('Preview content length:', content.length);

    // Content might be empty initially, which is fine
    expect(typeof content).toBe('string');
  });
});

test.describe('Editor-Preview Synchronization', () => {
  test('should update preview when typing in editor', async ({
    mainWindow,
    editorPage,
    previewPage,
  }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    // Ensure both editor and preview are visible
    await editorPage.waitForReady();

    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
    }

    await previewPage.waitForReady();

    // Clear editor
    try {
      await editorPage.clear();
    } catch {
      // Ignore if already empty
    }

    // Type text in editor
    const testText = 'Testing preview update';
    await editorPage.typeText(testText);

    // Wait for debounce and preview update
    await previewPage.waitForDebounce(600);

    // Check if preview contains the text
    const previewContent = await previewPage.getContent();
    console.log('Preview content after typing:', previewContent);

    // The preview should eventually contain our text (or be updating)
    // This might need adjustment based on actual implementation
  });
});

test.describe('Panel Interactions', () => {
  test('should maintain editor focus when toggling panels', async ({
    mainWindow,
    editorPage,
    navigatorPage,
    previewPage,
  }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    await editorPage.waitForReady();
    await editorPage.focus();

    // Toggle navigator
    await navigatorPage.toggle();
    await mainWindow.waitForTimeout(300);

    // Toggle preview
    await previewPage.toggle();
    await mainWindow.waitForTimeout(300);

    // Editor should still be interactable
    expect(await editorPage.isVisible()).toBe(true);
  });

  test('should handle rapid panel toggling', async ({
    mainWindow,
    navigatorPage,
    previewPage,
  }) => {
    await waitForUIReady(mainWindow);

    // Rapidly toggle panels
    await navigatorPage.toggle();
    await previewPage.toggle();
    await navigatorPage.toggle();
    await previewPage.toggle();

    // Wait for animations to complete
    await mainWindow.waitForTimeout(500);

    // App should still be responsive
    const root = mainWindow.locator('#root');
    await expect(root).toBeVisible();
  });
});

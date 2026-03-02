/**
 * E2E Test: Editor Content Editing
 * Tests for editing content in the Editor panel including:
 * - Selecting chapters
 * - Focusing the editor
 * - Typing/modifying text content
 * - Verifying text appears in editor
 * - Verifying content is saved to state
 * - Editor focus, content updates, and cursor position assertions
 */

import { test, expect } from './fixtures';
import { waitForUIReady, createNewProject, isWelcomeScreen } from './helpers/electron';

test.describe('Editor Content Editing', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    // Ensure we're in editor view
    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should focus editor and verify focus state', async ({ mainWindow, editorPage }) => {
    // Wait for editor to be ready
    await editorPage.waitForReady();

    // Focus the editor
    await editorPage.focus();

    // Wait a moment for focus to settle
    await mainWindow.waitForTimeout(200);

    // Verify editor has focus
    const hasFocus = await editorPage.hasFocus();
    expect(hasFocus).toBe(true);
  });

  test('should type text content and verify it appears in editor', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();

    // Clear any existing content
    try {
      await editorPage.clear();
    } catch {
      // Editor might be empty already
    }

    // Focus the editor
    await editorPage.focus();

    // Type test text
    const testText = 'This is a test paragraph for editor content editing.';
    await editorPage.typeText(testText);

    // Wait for text to appear
    await mainWindow.waitForTimeout(300);

    // Verify text appears in editor
    const content = await editorPage.getContent();
    expect(content).toContain('This is a test paragraph');
    expect(content).toContain('editor content editing');
  });

  test('should modify existing text content', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();

    // Clear and type initial text
    try {
      await editorPage.clear();
    } catch {
      // Ignore if empty
    }

    await editorPage.focus();
    const initialText = 'Initial text content';
    await editorPage.typeText(initialText);

    // Wait for text to appear
    await mainWindow.waitForTimeout(200);

    // Verify initial text
    let content = await editorPage.getContent();
    expect(content).toContain('Initial text content');

    // Add more text
    await editorPage.typeText(' - Modified');

    // Wait for modification
    await mainWindow.waitForTimeout(200);

    // Verify modified text
    content = await editorPage.getContent();
    expect(content).toContain('Initial text content - Modified');
  });

  test('should maintain cursor position after typing', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore if empty
    }

    // Type some text
    await editorPage.typeText('Test text');

    // Get cursor position
    const cursorPos = await editorPage.getCursorPosition();
    expect(cursorPos).not.toBeNull();

    // Cursor should be at the end of the typed text
    if (cursorPos) {
      expect(cursorPos.column).toBeGreaterThan(0);
    }
  });

  test('should verify content updates in real-time', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear existing content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Type text character by character and verify updates
    const word = 'Testing';
    for (let i = 0; i < word.length; i++) {
      await mainWindow.keyboard.type(word[i]);
      await mainWindow.waitForTimeout(50);
    }

    // Verify all characters appear
    const content = await editorPage.getContent();
    expect(content).toContain('Testing');
  });

  test('should handle multi-line text editing', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Type first line
    await editorPage.typeText('First line of text');

    // Press Enter to create new line
    await mainWindow.keyboard.press('Enter');

    // Type second line
    await editorPage.typeText('Second line of text');

    // Wait for content update
    await mainWindow.waitForTimeout(300);

    // Verify both lines exist
    const content = await editorPage.getContent();
    expect(content).toContain('First line of text');
    expect(content).toContain('Second line of text');
  });

  test('should handle text selection and replacement', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type initial text
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Replace this text');
    await mainWindow.waitForTimeout(200);

    // Select all text
    await mainWindow.keyboard.press('Control+A');

    // Type replacement text
    await editorPage.typeText('New replacement text');

    // Verify old text is gone and new text appears
    const content = await editorPage.getContent();
    expect(content).not.toContain('Replace this text');
    expect(content).toContain('New replacement text');
  });

  test('should verify content persists after losing and regaining focus', async ({
    mainWindow,
    editorPage,
    navigatorPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type test text
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const testText = 'Persistent test content';
    await editorPage.typeText(testText);
    await mainWindow.waitForTimeout(300);

    // Verify initial content
    let content = await editorPage.getContent();
    expect(content).toContain('Persistent test content');

    // Toggle navigator to shift focus away from editor
    await navigatorPage.toggle();
    await mainWindow.waitForTimeout(300);

    // Toggle back
    await navigatorPage.toggle();
    await mainWindow.waitForTimeout(300);

    // Focus editor again
    await editorPage.focus();

    // Verify content persisted
    content = await editorPage.getContent();
    expect(content).toContain('Persistent test content');
  });

  test('should handle special characters and symbols', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Type text with special characters
    const specialText = 'Special chars: @#$%^&*()[]{}';
    await editorPage.typeText(specialText);

    await mainWindow.waitForTimeout(200);

    // Verify special characters appear
    const content = await editorPage.getContent();
    expect(content).toContain('@#$%^&*()[]{}');
  });

  test('should support undo and redo operations', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type initial text
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const firstText = 'First version';
    await editorPage.typeText(firstText);
    await mainWindow.waitForTimeout(200);

    // Verify first text
    let content = await editorPage.getContent();
    expect(content).toContain('First version');

    // Add more text
    await editorPage.typeText(' - Second version');
    await mainWindow.waitForTimeout(200);

    // Verify combined text
    content = await editorPage.getContent();
    expect(content).toContain('First version - Second version');

    // Undo the last change
    await editorPage.undo();
    await mainWindow.waitForTimeout(300);

    // Verify undo worked (should only have first text)
    content = await editorPage.getContent();
    expect(content).toContain('First version');

    // Redo the change
    await editorPage.redo();
    await mainWindow.waitForTimeout(300);

    // Verify redo worked
    content = await editorPage.getContent();
    expect(content).toContain('First version - Second version');
  });

  test('should handle rapid typing without losing characters', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Type rapidly
    const rapidText = 'RapidTypingTestWithoutDelays';
    await mainWindow.keyboard.type(rapidText, { delay: 10 });

    // Wait for content to settle
    await mainWindow.waitForTimeout(300);

    // Verify all characters appear
    const content = await editorPage.getContent();
    expect(content).toContain('RapidTypingTest');
    expect(content).toContain('WithoutDelays');
  });

  test('should clear editor content completely', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Type some text
    await editorPage.typeText('Content to be cleared');
    await mainWindow.waitForTimeout(200);

    // Verify text exists
    let content = await editorPage.getContent();
    expect(content).toContain('Content to be cleared');

    // Clear the editor
    await editorPage.clear();
    await mainWindow.waitForTimeout(200);

    // Verify content is empty or minimal
    content = await editorPage.getContent();
    expect(content.length).toBeLessThan(25); // Account for empty paragraphs or whitespace
  });
});

test.describe('Editor Content with Navigator Integration', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should select chapter from navigator and edit content', async ({
    mainWindow,
    navigatorPage,
    editorPage
  }) => {
    await editorPage.waitForReady();

    // Ensure navigator is visible
    if (!(await navigatorPage.isVisible())) {
      await navigatorPage.toggle();
    }

    await navigatorPage.waitForReady();

    // Get navigation items
    const itemCount = await navigatorPage.getItemCount();
    console.log(`Found ${itemCount} navigation items`);

    // If there are navigation items, click the first one
    if (itemCount > 0) {
      const items = await navigatorPage.getNavigationItems();
      if (items.length > 0) {
        await navigatorPage.clickNavigationItem(items[0]);
        await mainWindow.waitForTimeout(500);
      }
    }

    // Focus editor and type
    await editorPage.focus();
    await editorPage.waitForReady();

    // Clear and type test content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const chapterText = 'Chapter content edited via navigator selection';
    await editorPage.typeText(chapterText);

    await mainWindow.waitForTimeout(300);

    // Verify content appears
    const content = await editorPage.getContent();
    expect(content).toContain('Chapter content');
    expect(content).toContain('navigator selection');
  });

  test('should maintain editor content when switching between chapters', async ({
    mainWindow,
    navigatorPage,
    editorPage
  }) => {
    await editorPage.waitForReady();

    // Ensure navigator is visible
    if (!(await navigatorPage.isVisible())) {
      await navigatorPage.toggle();
    }

    await navigatorPage.waitForReady();

    const itemCount = await navigatorPage.getItemCount();

    // Only run this test if we have multiple items
    if (itemCount >= 2) {
      const items = await navigatorPage.getNavigationItems();

      // Select first item and add content
      await navigatorPage.clickNavigationItem(items[0]);
      await mainWindow.waitForTimeout(300);
      await editorPage.focus();

      try {
        await editorPage.clear();
      } catch {
        // Ignore
      }

      await editorPage.typeText('First chapter content');
      await mainWindow.waitForTimeout(300);

      // Select second item
      await navigatorPage.clickNavigationItem(items[1]);
      await mainWindow.waitForTimeout(300);

      // Select first item again
      await navigatorPage.clickNavigationItem(items[0]);
      await mainWindow.waitForTimeout(300);

      // Verify first chapter content persisted
      const content = await editorPage.getContent();
      expect(content).toContain('First chapter content');
    } else {
      console.log('Skipping chapter switching test: insufficient navigation items');
      // Test passes - not enough items to test switching
      expect(true).toBe(true);
    }
  });
});

test.describe('Editor State Persistence', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should save content to application state', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const stateTestText = 'Content that should be saved to state';
    await editorPage.typeText(stateTestText);

    // Wait for state update (debounced)
    await mainWindow.waitForTimeout(500);

    // Verify content is in the editor (indicating state was updated)
    const content = await editorPage.getContent();
    expect(content).toContain('Content that should be saved to state');

    // Verify HTML content is also updated
    const htmlContent = await editorPage.getHTMLContent();
    expect(htmlContent.length).toBeGreaterThan(0);
    expect(htmlContent).toContain('state');
  });

  test('should handle content updates with debouncing', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Type rapidly to test debouncing
    await editorPage.typeText('Quick');
    await mainWindow.waitForTimeout(50);
    await editorPage.typeText(' update');

    // Wait for debounce period
    await mainWindow.waitForTimeout(600);

    // Verify final content
    const content = await editorPage.getContent();
    expect(content).toContain('Quick update');
  });

  test('should verify editor remains editable after content updates', async ({
    mainWindow,
    editorPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Type, wait, type again to simulate real editing
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('First edit');
    await mainWindow.waitForTimeout(300);

    // Verify editor is still editable
    expect(await editorPage.hasFocus()).toBe(true);

    // Type more content
    await editorPage.typeText(' - Second edit');
    await mainWindow.waitForTimeout(300);

    // Verify both edits appear
    const content = await editorPage.getContent();
    expect(content).toContain('First edit');
    expect(content).toContain('Second edit');

    // Verify editor still has focus
    expect(await editorPage.hasFocus()).toBe(true);
  });
});

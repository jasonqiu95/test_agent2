/**
 * E2E Test: Preview Panel Live Updates
 * Tests verifying the Preview panel updates in real-time when editor content changes
 * including timing assertions to ensure updates happen promptly.
 */

import { test, expect } from './fixtures';
import { waitForUIReady, createNewProject, isWelcomeScreen } from './helpers/electron';

test.describe('Preview Panel Live Updates', () => {
  test.beforeEach(async ({ mainWindow, previewPage }) => {
    await waitForUIReady(mainWindow);

    // Ensure we're in editor view
    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    // Ensure preview panel is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
    }

    await previewPage.waitForReady();
  });

  test('should update preview when editor content changes', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    // Wait for editor to be ready
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear any existing content
    try {
      await editorPage.clear();
    } catch {
      // Editor might be empty already
    }

    // Type test text in editor
    const testText = 'This is a test paragraph for preview updates.';
    const startTime = Date.now();
    await editorPage.typeText(testText);

    // Wait for preview to update (with debounce)
    await previewPage.waitForDebounce(600);

    // Verify timing - update should happen within reasonable time (< 2 seconds)
    const updateTime = Date.now() - startTime;
    expect(updateTime).toBeLessThan(2000);

    // Verify preview content matches editor content
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('This is a test paragraph');
    expect(previewContent).toContain('preview updates');

    // Verify editor content for comparison
    const editorContent = await editorPage.getContent();
    expect(previewContent).toContain(editorContent.trim());
  });

  test('should handle multiple consecutive edits with real-time updates', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear existing content
    try {
      await editorPage.clear();
    } catch {
      // Ignore if empty
    }

    // First edit
    const firstText = 'First edit content';
    await editorPage.typeText(firstText);
    await previewPage.waitForDebounce(600);

    // Verify first edit appears in preview
    let previewContent = await previewPage.getContent();
    expect(previewContent).toContain('First edit content');

    // Second edit - append more text
    const secondText = ' - Second edit';
    await editorPage.typeText(secondText);
    await previewPage.waitForDebounce(600);

    // Verify both edits appear in preview
    previewContent = await previewPage.getContent();
    expect(previewContent).toContain('First edit content');
    expect(previewContent).toContain('Second edit');

    // Third edit - add new line and more content
    await mainWindow.keyboard.press('Enter');
    const thirdText = 'Third edit on new line';
    await editorPage.typeText(thirdText);
    await previewPage.waitForDebounce(600);

    // Verify all three edits appear in preview
    previewContent = await previewPage.getContent();
    expect(previewContent).toContain('First edit content');
    expect(previewContent).toContain('Second edit');
    expect(previewContent).toContain('Third edit on new line');
  });

  test('should update preview promptly with timing assertions', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Measure time for preview update
    const testText = 'Timing test content';
    const startTime = Date.now();

    await editorPage.typeText(testText);

    // Wait for specific content to appear in preview
    await previewPage.waitForContentUpdate(testText, 2000);

    const updateTime = Date.now() - startTime;

    // Assert update happened promptly (within 2 seconds)
    expect(updateTime).toBeLessThan(2000);
    console.log(`Preview updated in ${updateTime}ms`);

    // Verify content matches
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain(testText);
  });

  test('should reflect rapid typing in preview without losing content', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Type rapidly to test debouncing and update mechanism
    const rapidText = 'RapidTypingTest';
    await mainWindow.keyboard.type(rapidText, { delay: 20 });

    // Wait for debounce and update
    await previewPage.waitForDebounce(600);

    // Verify all characters appear in preview
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('RapidTypingTest');

    // Verify content is complete (no characters lost)
    const editorContent = await editorPage.getContent();
    expect(previewContent).toContain(editorContent.trim());
  });

  test('should update preview when content is deleted', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type initial content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const initialText = 'Content to be deleted partially';
    await editorPage.typeText(initialText);
    await previewPage.waitForDebounce(600);

    // Verify initial content in preview
    let previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Content to be deleted partially');

    // Delete last word using backspace
    for (let i = 0; i < 10; i++) {
      await mainWindow.keyboard.press('Backspace');
    }

    await previewPage.waitForDebounce(600);

    // Verify preview updated to reflect deletion
    previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Content to be deleted');
    expect(previewContent).not.toContain('partially');
  });

  test('should update preview with formatted text', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Type text and apply bold formatting
    const boldText = 'Bold text test';
    await editorPage.typeText(boldText);

    // Select the text
    await mainWindow.keyboard.press('Control+A');

    // Apply bold formatting
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(200);

    // Wait for preview update
    await previewPage.waitForDebounce(600);

    // Verify preview shows formatted text
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Bold text test');

    // Check if bold formatting is reflected in preview HTML
    const hasFormattedText = await previewPage.hasFormattedText('bold');
    expect(hasFormattedText).toBe(true);
  });

  test('should handle multi-line content updates in real-time', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Type first line
    await editorPage.typeText('Line one content');
    await mainWindow.keyboard.press('Enter');

    // Type second line
    await editorPage.typeText('Line two content');
    await mainWindow.keyboard.press('Enter');

    // Type third line
    await editorPage.typeText('Line three content');

    // Wait for preview update
    await previewPage.waitForDebounce(600);

    // Verify all lines appear in preview
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Line one content');
    expect(previewContent).toContain('Line two content');
    expect(previewContent).toContain('Line three content');

    // Get paragraphs from preview
    const paragraphs = await previewPage.getParagraphs();
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });

  test('should update preview when content is replaced', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type initial content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const initialText = 'Original content to replace';
    await editorPage.typeText(initialText);
    await previewPage.waitForDebounce(600);

    // Verify initial content in preview
    let previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Original content to replace');

    // Select all and replace
    await mainWindow.keyboard.press('Control+A');
    const newText = 'Completely new replaced content';
    await editorPage.typeText(newText);

    await previewPage.waitForDebounce(600);

    // Verify preview shows new content
    previewContent = await previewPage.getContent();
    expect(previewContent).not.toContain('Original content to replace');
    expect(previewContent).toContain('Completely new replaced content');
  });

  test('should maintain preview sync during undo/redo operations', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type initial content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const firstText = 'First version of content';
    await editorPage.typeText(firstText);
    await previewPage.waitForDebounce(600);

    // Verify first version in preview
    let previewContent = await previewPage.getContent();
    expect(previewContent).toContain('First version of content');

    // Add more content
    await editorPage.typeText(' - Extended version');
    await previewPage.waitForDebounce(600);

    // Verify extended version in preview
    previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Extended version');

    // Undo the last change
    await editorPage.undo();
    await previewPage.waitForDebounce(600);

    // Verify preview reverts to first version
    previewContent = await previewPage.getContent();
    expect(previewContent).toContain('First version of content');
    expect(previewContent).not.toContain('Extended version');

    // Redo the change
    await editorPage.redo();
    await previewPage.waitForDebounce(600);

    // Verify preview shows extended version again
    previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Extended version');
  });

  test('should measure and assert preview update latency', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const iterations = 3;
    const updateTimes: number[] = [];

    // Test multiple edits and measure update times
    for (let i = 0; i < iterations; i++) {
      const testText = `Update iteration ${i + 1}`;
      const startTime = Date.now();

      await editorPage.typeText(testText);
      await previewPage.waitForContentUpdate(`iteration ${i + 1}`, 2000);

      const updateTime = Date.now() - startTime;
      updateTimes.push(updateTime);

      // Add space for next iteration
      if (i < iterations - 1) {
        await editorPage.typeText(' ');
      }
    }

    // Calculate average update time
    const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;

    console.log(`Update times: ${updateTimes.join(', ')}ms`);
    console.log(`Average update time: ${avgUpdateTime}ms`);

    // Assert all updates happened promptly
    for (const time of updateTimes) {
      expect(time).toBeLessThan(2000);
    }

    // Assert average update time is reasonable
    expect(avgUpdateTime).toBeLessThan(1500);

    // Verify final content
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('iteration 1');
    expect(previewContent).toContain('iteration 2');
    expect(previewContent).toContain('iteration 3');
  });
});

test.describe('Preview Panel Content Matching', () => {
  test.beforeEach(async ({ mainWindow, previewPage }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }

    // Ensure preview panel is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
    }

    await previewPage.waitForReady();
  });

  test('should match plain text content between editor and preview', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const testText = 'Plain text content for matching test';
    await editorPage.typeText(testText);
    await previewPage.waitForDebounce(600);

    // Get content from both panels
    const editorContent = await editorPage.getContent();
    const previewContent = await previewPage.getContent();

    // Verify preview contains editor content
    expect(previewContent).toContain(editorContent.trim());
  });

  test('should match complex content with multiple paragraphs', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Create multi-paragraph content
    await editorPage.typeText('First paragraph content');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.keyboard.press('Enter');
    await editorPage.typeText('Second paragraph content');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.keyboard.press('Enter');
    await editorPage.typeText('Third paragraph content');

    await previewPage.waitForDebounce(600);

    // Verify all paragraphs appear in preview
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('First paragraph content');
    expect(previewContent).toContain('Second paragraph content');
    expect(previewContent).toContain('Third paragraph content');

    // Check paragraph structure in preview
    const paragraphs = await previewPage.getParagraphs();
    expect(paragraphs.length).toBeGreaterThanOrEqual(3);
  });

  test('should match special characters and symbols', async ({
    mainWindow,
    editorPage,
    previewPage
  }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const specialText = 'Special characters: @#$%^&*() []{}';
    await editorPage.typeText(specialText);
    await previewPage.waitForDebounce(600);

    // Verify special characters appear in preview
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('@#$%^&*()');
    expect(previewContent).toContain('[]{}');
  });
});

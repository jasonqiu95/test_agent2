import { test, expect } from './fixtures';
import { createScreenshotManager, captureFullWindow, captureComparison } from './helpers/screenshots';

/**
 * Example E2E test demonstrating screenshot capture utilities
 *
 * This test shows how to:
 * - Use ScreenshotManager for organized screenshot capture
 * - Capture full window, individual panels, and comparisons
 * - Organize screenshots by test name and workflow steps
 */

test.describe('Screenshot Utilities Demo', () => {
  test('should capture screenshots at key workflow states', async ({ mainWindow }) => {
    // Create a screenshot manager for this test
    const screenshots = createScreenshotManager(mainWindow, test.info().title);

    // Step 1: Capture initial state
    await screenshots.captureWorkflowStep('initial-load');

    // Step 2: Capture all panels
    const panels = await screenshots.captureAllPanels();
    expect(panels.fullWindow).toBeTruthy();

    // Step 3: Capture individual panels
    try {
      await screenshots.captureEditorPanel();
    } catch (error) {
      console.log('Editor panel not available in this test');
    }

    // Step 4: Capture final state
    await screenshots.captureWorkflowStep('final-state');
  });

  test('should capture before/after comparison screenshots', async ({ mainWindow, editorPage }) => {
    const screenshots = createScreenshotManager(mainWindow, test.info().title);

    // Wait for editor to be ready
    await editorPage.waitForReady();

    // Capture comparison: before and after typing text
    const comparison = await screenshots.captureComparison(
      'type-text',
      async () => {
        await editorPage.typeText('Hello, World!');
      }
    );

    expect(comparison.before).toBeTruthy();
    expect(comparison.after).toBeTruthy();
    expect(comparison.testName).toBeTruthy();
  });

  test('should capture element-specific comparisons', async ({ mainWindow, editorPage }) => {
    const screenshots = createScreenshotManager(mainWindow, test.info().title);

    // Wait for editor to be ready
    await editorPage.waitForReady();

    // Capture comparison of just the editor element
    const editorComparison = await screenshots.captureElementComparison(
      'bold-formatting',
      '.editor-content, .ProseMirror',
      async () => {
        await editorPage.typeText('Bold text');
        await editorPage.content.press('Control+A');
        await editorPage.applyBold();
      }
    );

    expect(editorComparison.before).toBeTruthy();
    expect(editorComparison.after).toBeTruthy();
  });

  test('should capture screenshot sequence for multi-step workflow', async ({ mainWindow, editorPage }) => {
    const screenshots = createScreenshotManager(mainWindow, test.info().title);

    // Wait for editor to be ready
    await editorPage.waitForReady();

    // Capture a sequence of workflow steps
    const sequence = await screenshots.captureSequence([
      {
        name: 'empty-editor',
      },
      {
        name: 'type-heading',
        action: async () => {
          await editorPage.insertHeading(1);
          await editorPage.typeText('My Heading');
          await editorPage.content.press('Enter');
        },
      },
      {
        name: 'type-paragraph',
        action: async () => {
          await editorPage.typeText('This is a paragraph of text.');
          await editorPage.content.press('Enter');
        },
      },
      {
        name: 'insert-list',
        action: async () => {
          await editorPage.insertBulletList();
          await editorPage.typeText('First item');
          await editorPage.content.press('Enter');
          await editorPage.typeText('Second item');
        },
      },
    ]);

    expect(sequence).toHaveLength(4);
    sequence.forEach((path) => expect(path).toBeTruthy());
  });

  test('should use standalone screenshot helpers', async ({ mainWindow }) => {
    // Standalone helper for simple screenshot capture
    const fullWindowPath = await captureFullWindow(mainWindow, 'standalone-example');
    expect(fullWindowPath).toBeTruthy();

    // Standalone comparison helper
    const comparison = await captureComparison(
      mainWindow,
      'standalone-comparison',
      async () => {
        // Simulate some UI change
        await mainWindow.evaluate(() => {
          document.body.style.backgroundColor = '#f0f0f0';
        });
      }
    );

    expect(comparison.before).toBeTruthy();
    expect(comparison.after).toBeTruthy();
  });

  test('should organize screenshots by test name', async ({ mainWindow }) => {
    // Each test gets its own organized folder structure
    const screenshots = createScreenshotManager(
      mainWindow,
      'my-custom-test-name'
    );

    const step1 = await screenshots.captureWorkflowStep('step-1');
    const step2 = await screenshots.captureWorkflowStep('step-2');

    // Screenshots are organized with test name in the filename
    expect(step1).toContain('my-custom-test-name');
    expect(step2).toContain('my-custom-test-name');
    expect(step1).toContain('step-1-step-1');
    expect(step2).toContain('step-2-step-2');
  });

  test('should handle missing panels gracefully', async ({ mainWindow }) => {
    const screenshots = createScreenshotManager(mainWindow, test.info().title);

    // Attempt to capture all panels - should not throw if some don't exist
    const panels = await screenshots.captureAllPanels();

    // Should always have full window capture
    expect(panels.fullWindow).toBeTruthy();

    // Other panels may or may not exist depending on app state
    // The utility handles this gracefully without throwing errors
  });

  test('should support custom metadata in filenames', async ({ mainWindow }) => {
    const screenshots = createScreenshotManager(mainWindow, test.info().title);

    const path = await screenshots.captureWorkflowStep('custom-metadata', {
      metadata: {
        browser: 'electron',
        theme: 'dark',
      },
    });

    expect(path).toContain('browser-electron');
    expect(path).toContain('theme-dark');
  });

  test('should capture element screenshots', async ({ mainWindow, editorPage }) => {
    const screenshots = createScreenshotManager(mainWindow, test.info().title);

    // Wait for editor to be ready
    await editorPage.waitForReady();

    // Capture screenshot of a specific element using locator
    const toolbarPath = await screenshots.captureElement(
      editorPage.toolbar,
      'editor-toolbar'
    );

    expect(toolbarPath).toBeTruthy();
    expect(toolbarPath).toContain('editor-toolbar');
  });
});

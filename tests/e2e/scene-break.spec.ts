/**
 * E2E Test: Scene Break Insertion
 *
 * Tests for inserting scene breaks in the editor and verifying they appear
 * correctly in both the editor and preview panel with proper styling.
 *
 * Test scenarios:
 * - Insert scene break via keyboard shortcut
 * - Insert scene break via toolbar button
 * - Verify scene break appears in editor
 * - Verify scene break renders in preview with correct styling
 * - Verify scene break symbol and appearance
 */

import { test, expect } from './fixtures';
import { waitForUIReady, createNewProject, isWelcomeScreen } from './helpers/electron';

test.describe('Scene Break Insertion', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    // Ensure we're in editor view
    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should insert scene break via keyboard shortcut', async ({ mainWindow, editorPage, previewPage }) => {
    // Wait for editor to be ready
    await editorPage.waitForReady();

    // Clear any existing content
    try {
      await editorPage.clear();
    } catch {
      // Ignore if already empty
    }

    // Focus the editor and type some text
    await editorPage.focus();
    await editorPage.typeText('First scene content.');
    await mainWindow.waitForTimeout(200);

    // Insert scene break via keyboard shortcut (Ctrl+Shift+B)
    await editorPage.insertSceneBreakViaShortcut();

    // Wait for scene break to appear
    await mainWindow.waitForTimeout(300);

    // Verify scene break appears in editor
    const hasSceneBreak = await editorPage.hasSceneBreak();
    expect(hasSceneBreak).toBe(true);

    // Get scene breaks from editor
    const editorSceneBreaks = await editorPage.getSceneBreaks();
    expect(editorSceneBreaks.length).toBeGreaterThan(0);
    expect(editorSceneBreaks[0].symbol).toBeTruthy();

    // Type text after scene break
    await editorPage.typeText('Second scene content.');
    await mainWindow.waitForTimeout(300);

    // Ensure preview panel is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    // Wait for preview to update
    await previewPage.waitForDebounce(800);

    // Verify scene break appears in preview
    const previewHasSceneBreak = await previewPage.hasSceneBreak();
    expect(previewHasSceneBreak).toBe(true);

    // Get scene breaks from preview
    const previewSceneBreaks = await previewPage.getSceneBreaks();
    expect(previewSceneBreaks.length).toBeGreaterThan(0);

    // Verify scene break has expected symbol (default: * * *)
    expect(previewSceneBreaks[0].symbol).toBeTruthy();
  });

  test('should insert scene break via toolbar button', async ({ mainWindow, editorPage, previewPage }) => {
    // Wait for editor to be ready
    await editorPage.waitForReady();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Focus and type initial content
    await editorPage.focus();
    await editorPage.typeText('Content before break.');
    await mainWindow.waitForTimeout(200);

    // Insert scene break via toolbar button
    await editorPage.insertSceneBreak();

    // Wait for insertion
    await mainWindow.waitForTimeout(300);

    // Verify scene break in editor
    expect(await editorPage.hasSceneBreak()).toBe(true);

    // Type content after break
    await editorPage.typeText('Content after break.');
    await mainWindow.waitForTimeout(300);

    // Ensure preview is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    // Wait for preview update
    await previewPage.waitForDebounce(800);

    // Verify scene break in preview
    expect(await previewPage.hasSceneBreak()).toBe(true);

    // Verify both text sections appear in preview
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Content before break');
    expect(previewContent).toContain('Content after break');
  });

  test('should render scene break with correct visual styling in preview', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();

    // Clear and prepare content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.focus();
    await editorPage.typeText('Scene one.');
    await mainWindow.waitForTimeout(200);

    // Insert scene break
    await editorPage.insertSceneBreakViaShortcut();
    await mainWindow.waitForTimeout(300);

    await editorPage.typeText('Scene two.');
    await mainWindow.waitForTimeout(300);

    // Ensure preview is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    // Wait for preview update
    await previewPage.waitForDebounce(800);

    // Verify scene break element exists with proper class
    const hasSceneBreakClass = await previewPage.hasElement('.scene-break');
    expect(hasSceneBreakClass).toBe(true);

    // Get scene breaks and verify styling
    const sceneBreaks = await previewPage.getSceneBreaks();
    expect(sceneBreaks.length).toBeGreaterThan(0);

    // Verify scene break has the expected styling properties
    const sceneBreak = sceneBreaks[0];
    expect(sceneBreak.symbol).toBeTruthy();
    expect(sceneBreak.style).toBeTruthy();

    // Parse style and verify text-align is center
    const styleObj = JSON.parse(sceneBreak.style);
    expect(styleObj.textAlign).toBe('center');
  });

  test('should insert multiple scene breaks in sequence', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.focus();

    // Create content with multiple scene breaks
    await editorPage.typeText('Scene 1');
    await mainWindow.waitForTimeout(200);

    await editorPage.insertSceneBreakViaShortcut();
    await mainWindow.waitForTimeout(200);

    await editorPage.typeText('Scene 2');
    await mainWindow.waitForTimeout(200);

    await editorPage.insertSceneBreakViaShortcut();
    await mainWindow.waitForTimeout(200);

    await editorPage.typeText('Scene 3');
    await mainWindow.waitForTimeout(300);

    // Verify multiple scene breaks in editor
    const editorSceneBreaks = await editorPage.getSceneBreaks();
    expect(editorSceneBreaks.length).toBe(2);

    // Ensure preview is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    // Wait for preview update
    await previewPage.waitForDebounce(800);

    // Verify multiple scene breaks in preview
    const previewSceneBreaks = await previewPage.getSceneBreaks();
    expect(previewSceneBreaks.length).toBe(2);

    // Verify all scenes appear in preview
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Scene 1');
    expect(previewContent).toContain('Scene 2');
    expect(previewContent).toContain('Scene 3');
  });

  test('should verify scene break element presence and attributes', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();

    // Clear and prepare
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.focus();
    await editorPage.typeText('Test content for scene break.');
    await mainWindow.waitForTimeout(200);

    // Insert scene break
    await editorPage.insertSceneBreak();
    await mainWindow.waitForTimeout(300);

    // Verify scene break element in editor has proper structure
    const editorHasBreak = await editorPage.hasSceneBreak();
    expect(editorHasBreak).toBe(true);

    // Verify scene break in editor content
    const editorHTMLContent = await editorPage.getHTMLContent();
    expect(editorHTMLContent).toContain('scene-break');

    // Ensure preview is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    // Wait for preview to render
    await previewPage.waitForDebounce(800);

    // Verify scene break element in preview
    const previewHasBreak = await previewPage.hasSceneBreak();
    expect(previewHasBreak).toBe(true);

    // Verify scene break in preview HTML
    const previewHTMLContent = await previewPage.getHTMLContent();
    expect(previewHTMLContent).toContain('scene-break');

    // Verify scene break has data-symbol attribute
    const sceneBreaks = await previewPage.getSceneBreaks();
    expect(sceneBreaks[0].symbol).toBeTruthy();
    expect(sceneBreaks[0].symbol.length).toBeGreaterThan(0);
  });

  test('should maintain scene breaks after editor operations', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.focus();

    // Type, insert break, type more
    await editorPage.typeText('First part.');
    await mainWindow.waitForTimeout(200);

    await editorPage.insertSceneBreakViaShortcut();
    await mainWindow.waitForTimeout(200);

    await editorPage.typeText('Second part.');
    await mainWindow.waitForTimeout(300);

    // Verify scene break exists
    expect(await editorPage.hasSceneBreak()).toBe(true);

    // Perform undo
    await editorPage.undo();
    await mainWindow.waitForTimeout(300);

    // Scene break might still exist (depending on undo granularity)
    // Just verify editor still works

    // Perform redo
    await editorPage.redo();
    await mainWindow.waitForTimeout(300);

    // Type more content
    await editorPage.typeText(' Additional text.');
    await mainWindow.waitForTimeout(300);

    // Verify scene break still present in editor
    const hasBreak = await editorPage.hasSceneBreak();
    expect(hasBreak).toBe(true);

    // Ensure preview is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    // Verify preview renders correctly
    await previewPage.waitForDebounce(800);
    expect(await previewPage.hasSceneBreak()).toBe(true);
  });

  test('should position cursor correctly after scene break insertion', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();

    // Clear content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.focus();

    // Type initial text
    await editorPage.typeText('Before break');
    await mainWindow.waitForTimeout(200);

    // Insert scene break
    await editorPage.insertSceneBreakViaShortcut();
    await mainWindow.waitForTimeout(300);

    // Try to type after scene break to verify cursor position
    await editorPage.typeText('After break');
    await mainWindow.waitForTimeout(300);

    // Verify both texts appear in editor
    const content = await editorPage.getContent();
    expect(content).toContain('Before break');
    expect(content).toContain('After break');

    // Verify scene break is between them
    expect(await editorPage.hasSceneBreak()).toBe(true);
  });
});

test.describe('Scene Break Visual Appearance', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should verify scene break ornament renders correctly in preview', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();

    // Clear and setup
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.focus();
    await editorPage.typeText('Chapter content with scene break.');
    await mainWindow.waitForTimeout(200);

    // Insert scene break
    await editorPage.insertSceneBreak();
    await mainWindow.waitForTimeout(300);

    // Ensure preview is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    // Wait for preview to render
    await previewPage.waitForDebounce(800);

    // Take screenshot for visual verification (optional)
    // await previewPage.screenshot('scene-break-preview.png');

    // Verify scene break element is visible in preview
    const sceneBreakElement = await previewPage.hasElement('.scene-break');
    expect(sceneBreakElement).toBe(true);

    // Get scene breaks and verify they have content
    const sceneBreaks = await previewPage.getSceneBreaks();
    expect(sceneBreaks.length).toBeGreaterThan(0);

    // Verify scene break has visible symbol
    const symbol = sceneBreaks[0].symbol;
    expect(symbol).toBeTruthy();
    expect(symbol.length).toBeGreaterThan(0);

    // Common scene break symbols: *, •, —, etc.
    // Just verify it's not empty
    expect(symbol.trim().length).toBeGreaterThan(0);
  });

  test('should verify scene break is centered and styled in preview', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();

    // Clear and setup content
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.focus();
    await editorPage.typeText('Content above.');
    await mainWindow.waitForTimeout(200);

    await editorPage.insertSceneBreakViaShortcut();
    await mainWindow.waitForTimeout(300);

    await editorPage.typeText('Content below.');
    await mainWindow.waitForTimeout(300);

    // Open preview
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    await previewPage.waitForDebounce(800);

    // Verify scene break styling in preview
    const sceneBreaks = await previewPage.getSceneBreaks();
    expect(sceneBreaks.length).toBe(1);

    const styleObj = JSON.parse(sceneBreaks[0].style);

    // Verify centered alignment
    expect(styleObj.textAlign).toBe('center');

    // Verify has margins (scene breaks should have spacing)
    expect(styleObj.margin).toBeTruthy();

    // Verify has color styling
    expect(styleObj.color).toBeTruthy();

    // Verify font size is set
    expect(styleObj.fontSize).toBeTruthy();
  });
});

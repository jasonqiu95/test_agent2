/**
 * E2E Test: Complete Edit and Preview Workflow
 *
 * Comprehensive integration test covering the full workflow:
 * 1. Open project
 * 2. Select chapter in navigator
 * 3. Edit content
 * 4. Verify preview updates
 * 5. Apply bold formatting
 * 6. Verify in preview
 * 7. Apply italic formatting
 * 8. Verify in preview
 * 9. Insert scene break
 * 10. Verify preview reflects all changes
 *
 * This test orchestrates all individual test scenarios into one complete user workflow
 * with screenshots captured at each major state.
 */

import { test, expect } from './fixtures';
import { waitForUIReady, createNewProject, isWelcomeScreen } from './helpers/electron';
import { createScreenshotManager } from './helpers/screenshots';

test.describe('Complete Edit and Preview Workflow', () => {
  // Extended timeout for comprehensive workflow test
  test.setTimeout(120000);

  test('should complete full editing workflow with preview updates', async ({
    mainWindow,
    navigatorPage,
    editorPage,
    previewPage,
  }) => {
    console.log('🚀 Starting complete edit and preview workflow test...');

    // Initialize screenshot manager for workflow documentation
    const screenshots = createScreenshotManager(mainWindow, 'complete-workflow');

    // ============================================================
    // STEP 1: Open Project / Initialize Editor View
    // ============================================================
    console.log('📂 Step 1: Opening project...');
    await waitForUIReady(mainWindow);

    // Ensure we're in editor view
    if (await isWelcomeScreen(mainWindow)) {
      console.log('Creating new project from welcome screen...');
      await createNewProject(mainWindow);
      await waitForUIReady(mainWindow);
    }

    // Capture initial state
    await screenshots.captureWorkflowStep('01-initial-state', { timeout: 500 });
    console.log('✅ Project initialized');

    // ============================================================
    // STEP 2: Ensure Navigator is Visible and Select Chapter
    // ============================================================
    console.log('📑 Step 2: Selecting chapter in navigator...');

    // Ensure navigator panel is visible
    const isNavigatorVisible = await navigatorPage.isVisible();
    if (!isNavigatorVisible) {
      console.log('Opening navigator panel...');
      await navigatorPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    await navigatorPage.waitForReady();
    await expect(navigatorPage.panel).toBeVisible();

    // Try to get navigation items
    const navItems = await navigatorPage.getNavigationItems();
    console.log(`Found ${navItems.length} navigation items`);

    // If there are chapters/sections, select the first one
    if (navItems.length > 0) {
      console.log(`Selecting first item: "${navItems[0]}"`);
      await navigatorPage.clickNavigationItem(navItems[0]);
      await mainWindow.waitForTimeout(500);
    }

    // Capture navigator with selected chapter
    await screenshots.captureWorkflowStep('02-chapter-selected', { timeout: 500 });
    console.log('✅ Chapter selected in navigator');

    // ============================================================
    // STEP 3: Ensure Preview Panel is Visible
    // ============================================================
    console.log('👁️ Step 3: Ensuring preview panel is visible...');

    const isPreviewVisible = await previewPage.isVisible();
    if (!isPreviewVisible) {
      console.log('Opening preview panel...');
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    await previewPage.waitForReady();
    await expect(previewPage.panel).toBeVisible();
    console.log('✅ Preview panel ready');

    // ============================================================
    // STEP 4: Edit Content in Editor
    // ============================================================
    console.log('✏️ Step 4: Editing content in editor...');

    // Wait for editor to be ready
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear any existing content
    try {
      await editorPage.clear();
      await mainWindow.waitForTimeout(200);
    } catch {
      console.log('Editor already empty or clear not needed');
    }

    // Type initial content
    const initialContent = 'This is the opening paragraph of our story. The character begins their journey with hope and determination.';
    console.log('Typing initial content...');
    await editorPage.typeText(initialContent);
    await mainWindow.waitForTimeout(300);

    // Capture state after typing
    await screenshots.captureWorkflowStep('03-content-typed', { timeout: 500 });
    console.log('✅ Initial content typed');

    // ============================================================
    // STEP 5: Verify Preview Updates with Initial Content
    // ============================================================
    console.log('🔄 Step 5: Verifying preview updates...');

    // Wait for preview to update with debounce
    await previewPage.waitForDebounce(800);

    // Verify content appears in preview
    const previewContent1 = await previewPage.getContent();
    expect(previewContent1).toContain('opening paragraph');
    expect(previewContent1).toContain('hope and determination');

    // Verify editor and preview are in sync
    const editorContent1 = await editorPage.getContent();
    expect(previewContent1).toContain(editorContent1.trim());

    // Capture preview update
    await screenshots.captureWorkflowStep('04-preview-updated', { timeout: 500 });
    console.log('✅ Preview updated with initial content');

    // ============================================================
    // STEP 6: Select Text and Apply Bold Formatting
    // ============================================================
    console.log('💪 Step 6: Applying bold formatting...');

    // Add a new line and more content
    await mainWindow.keyboard.press('Enter');
    await mainWindow.keyboard.press('Enter');

    const boldContent = 'This text will be bold';
    await editorPage.typeText(boldContent);
    await mainWindow.waitForTimeout(200);

    // Select the text we just typed (triple-click or Ctrl+A to select last paragraph)
    // First, select just the last line by using keyboard selection
    await mainWindow.keyboard.press('Shift+Home'); // Select to start of line
    await mainWindow.waitForTimeout(100);

    // Apply bold formatting
    console.log('Applying bold to selected text...');
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Verify bold in editor
    const editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<strong>|<b>/i);

    // Capture state with bold formatting
    await screenshots.captureWorkflowStep('05-bold-applied', { timeout: 500 });
    console.log('✅ Bold formatting applied');

    // ============================================================
    // STEP 7: Verify Bold Formatting in Preview
    // ============================================================
    console.log('👀 Step 7: Verifying bold in preview...');

    // Wait for preview to update
    await previewPage.waitForDebounce(800);

    // Verify bold formatting appears in preview
    const hasBoldInPreview = await previewPage.hasFormattedText('bold');
    expect(hasBoldInPreview).toBe(true);

    const previewHTML1 = await previewPage.getHTMLContent();
    expect(previewHTML1).toMatch(/<strong>|<b>/i);

    // Verify content is in preview
    const previewContent2 = await previewPage.getContent();
    expect(previewContent2).toContain('This text will be bold');

    // Capture preview with bold text
    await screenshots.captureWorkflowStep('06-bold-in-preview', { timeout: 500 });
    console.log('✅ Bold formatting verified in preview');

    // ============================================================
    // STEP 8: Add More Content and Apply Italic Formatting
    // ============================================================
    console.log('🎨 Step 8: Applying italic formatting...');

    // Move to end and add new content
    await mainWindow.keyboard.press('End');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.keyboard.press('Enter');

    const italicContent = 'This text will be italic';
    await editorPage.typeText(italicContent);
    await mainWindow.waitForTimeout(200);

    // Select the text we just typed
    await mainWindow.keyboard.press('Shift+Home');
    await mainWindow.waitForTimeout(100);

    // Apply italic formatting
    console.log('Applying italic to selected text...');
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Verify italic in editor
    const editorHTML2 = await editorPage.getHTMLContent();
    expect(editorHTML2).toMatch(/<em>|<i>/i);

    // Capture state with italic formatting
    await screenshots.captureWorkflowStep('07-italic-applied', { timeout: 500 });
    console.log('✅ Italic formatting applied');

    // ============================================================
    // STEP 9: Verify Italic Formatting in Preview
    // ============================================================
    console.log('👀 Step 9: Verifying italic in preview...');

    // Wait for preview to update
    await previewPage.waitForDebounce(800);

    // Verify italic formatting appears in preview
    const hasItalicInPreview = await previewPage.hasFormattedText('italic');
    expect(hasItalicInPreview).toBe(true);

    const previewHTML2 = await previewPage.getHTMLContent();
    expect(previewHTML2).toMatch(/<em>|<i>/i);

    // Verify content is in preview
    const previewContent3 = await previewPage.getContent();
    expect(previewContent3).toContain('This text will be italic');

    // Capture preview with italic text
    await screenshots.captureWorkflowStep('08-italic-in-preview', { timeout: 500 });
    console.log('✅ Italic formatting verified in preview');

    // ============================================================
    // STEP 10: Insert Scene Break
    // ============================================================
    console.log('✨ Step 10: Inserting scene break...');

    // Move to end and add some space
    await mainWindow.keyboard.press('End');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.keyboard.press('Enter');

    // Insert scene break using the editor's method
    console.log('Inserting scene break...');
    await editorPage.insertSceneBreak();
    await mainWindow.waitForTimeout(400);

    // Verify scene break appears in editor
    const hasSceneBreakInEditor = await editorPage.hasSceneBreak();
    expect(hasSceneBreakInEditor).toBe(true);

    const editorSceneBreaks = await editorPage.getSceneBreaks();
    expect(editorSceneBreaks.length).toBeGreaterThan(0);
    console.log(`Scene break in editor: "${editorSceneBreaks[0].symbol}"`);

    // Add content after scene break
    await editorPage.typeText('Content after the scene break.');
    await mainWindow.waitForTimeout(300);

    // Capture state with scene break
    await screenshots.captureWorkflowStep('09-scene-break-inserted', { timeout: 500 });
    console.log('✅ Scene break inserted');

    // ============================================================
    // STEP 11: Verify All Changes in Preview
    // ============================================================
    console.log('🎯 Step 11: Verifying all changes in preview...');

    // Wait for preview to update with all changes
    await previewPage.waitForDebounce(1000);

    // Verify all content is in preview
    const finalPreviewContent = await previewPage.getContent();

    // Check original content
    expect(finalPreviewContent).toContain('opening paragraph');
    expect(finalPreviewContent).toContain('hope and determination');

    // Check bold text
    expect(finalPreviewContent).toContain('This text will be bold');
    const hasBoldFinal = await previewPage.hasFormattedText('bold');
    expect(hasBoldFinal).toBe(true);

    // Check italic text
    expect(finalPreviewContent).toContain('This text will be italic');
    const hasItalicFinal = await previewPage.hasFormattedText('italic');
    expect(hasItalicFinal).toBe(true);

    // Check scene break
    const hasSceneBreakInPreview = await previewPage.hasSceneBreak();
    expect(hasSceneBreakInPreview).toBe(true);

    const previewSceneBreaks = await previewPage.getSceneBreaks();
    expect(previewSceneBreaks.length).toBeGreaterThan(0);
    console.log(`Scene break in preview: "${previewSceneBreaks[0].symbol}"`);

    // Check content after scene break
    expect(finalPreviewContent).toContain('Content after the scene break');

    // Capture final state with all changes
    await screenshots.captureWorkflowStep('10-all-changes-verified', { timeout: 500 });
    console.log('✅ All changes verified in preview');

    // ============================================================
    // STEP 12: Capture Final Screenshots of All Panels
    // ============================================================
    console.log('📸 Step 12: Capturing final panel screenshots...');

    const finalPanels = await screenshots.captureAllPanels({ timeout: 500 });

    // Verify screenshots were captured
    expect(finalPanels.fullWindow).toBeTruthy();
    console.log('✅ Final screenshots captured');

    // ============================================================
    // WORKFLOW COMPLETE
    // ============================================================
    console.log('🎉 Complete workflow test finished successfully!');
    console.log('📊 Summary:');
    console.log(`   - Steps completed: ${screenshots.getCurrentStep()}`);
    console.log('   - Initial content: typed and verified');
    console.log('   - Bold formatting: applied and verified');
    console.log('   - Italic formatting: applied and verified');
    console.log('   - Scene break: inserted and verified');
    console.log('   - Preview sync: all changes reflected correctly');
  });

  test('should handle complex multi-paragraph workflow with mixed formatting', async ({
    mainWindow,
    editorPage,
    previewPage,
  }) => {
    console.log('🚀 Starting complex multi-paragraph workflow test...');

    const screenshots = createScreenshotManager(mainWindow, 'complex-workflow');

    // Setup
    await waitForUIReady(mainWindow);
    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
      await waitForUIReady(mainWindow);
    }

    // Ensure preview is visible
    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    await editorPage.waitForReady();
    await previewPage.waitForReady();
    await editorPage.focus();

    // Clear editor
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // ============================================================
    // Create complex multi-paragraph content
    // ============================================================
    console.log('Creating paragraph 1...');
    await editorPage.typeText('Chapter One: The Beginning');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.keyboard.press('Enter');

    await screenshots.captureWorkflowStep('01-title-added');

    console.log('Creating paragraph 2 with bold...');
    await editorPage.typeText('The hero entered the dark forest.');
    await mainWindow.keyboard.press('Shift+Home');
    await editorPage.applyBold();
    await mainWindow.keyboard.press('End');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.keyboard.press('Enter');

    await screenshots.captureWorkflowStep('02-bold-paragraph-added');

    console.log('Creating paragraph 3 with italic...');
    await editorPage.typeText('What mysteries await in the shadows?');
    await mainWindow.keyboard.press('Shift+Home');
    await editorPage.applyItalic();
    await mainWindow.keyboard.press('End');
    await mainWindow.keyboard.press('Enter');
    await mainWindow.keyboard.press('Enter');

    await screenshots.captureWorkflowStep('03-italic-paragraph-added');

    console.log('Inserting scene break...');
    await editorPage.insertSceneBreak();
    await mainWindow.waitForTimeout(300);

    await screenshots.captureWorkflowStep('04-scene-break-added');

    console.log('Creating paragraph 4 after break...');
    await editorPage.typeText('Hours later, the hero emerged victorious.');
    await mainWindow.keyboard.press('Enter');

    await screenshots.captureWorkflowStep('05-post-break-content');

    // ============================================================
    // Verify everything in preview
    // ============================================================
    console.log('Verifying complete workflow in preview...');
    await previewPage.waitForDebounce(1000);

    const previewContent = await previewPage.getContent();

    // Verify all text content
    expect(previewContent).toContain('Chapter One: The Beginning');
    expect(previewContent).toContain('The hero entered the dark forest');
    expect(previewContent).toContain('What mysteries await in the shadows');
    expect(previewContent).toContain('Hours later, the hero emerged victorious');

    // Verify formatting
    expect(await previewPage.hasFormattedText('bold')).toBe(true);
    expect(await previewPage.hasFormattedText('italic')).toBe(true);

    // Verify scene break
    expect(await previewPage.hasSceneBreak()).toBe(true);

    // Verify paragraph count
    const paragraphs = await previewPage.getParagraphs();
    expect(paragraphs.length).toBeGreaterThanOrEqual(3);

    await screenshots.captureWorkflowStep('06-final-verification');

    console.log('✅ Complex workflow completed successfully!');
  });

  test('should handle rapid edits and maintain preview sync', async ({
    mainWindow,
    editorPage,
    previewPage,
  }) => {
    console.log('🚀 Starting rapid edits workflow test...');

    const screenshots = createScreenshotManager(mainWindow, 'rapid-edits-workflow');

    // Setup
    await waitForUIReady(mainWindow);
    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
      await waitForUIReady(mainWindow);
    }

    if (!(await previewPage.isVisible())) {
      await previewPage.toggle();
      await mainWindow.waitForTimeout(300);
    }

    await editorPage.waitForReady();
    await previewPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await screenshots.captureWorkflowStep('00-initial');

    // ============================================================
    // Perform rapid sequential edits
    // ============================================================
    console.log('Performing rapid edit 1...');
    await editorPage.typeText('First rapid edit');
    await screenshots.captureWorkflowStep('01-edit-1');

    console.log('Performing rapid edit 2...');
    await editorPage.typeText(' - Second edit');
    await screenshots.captureWorkflowStep('02-edit-2');

    console.log('Performing rapid edit 3...');
    await mainWindow.keyboard.press('Enter');
    await editorPage.typeText('Third line edit');
    await screenshots.captureWorkflowStep('03-edit-3');

    // Apply formatting during rapid edits
    console.log('Applying bold during rapid edit...');
    await mainWindow.keyboard.press('Control+A');
    await editorPage.applyBold();
    await screenshots.captureWorkflowStep('04-bold-rapid');

    console.log('Adding more content...');
    await mainWindow.keyboard.press('End');
    await mainWindow.keyboard.press('Enter');
    await editorPage.typeText('Final rapid content');
    await screenshots.captureWorkflowStep('05-final-rapid');

    // ============================================================
    // Verify preview caught up with all edits
    // ============================================================
    console.log('Waiting for preview to sync...');
    await previewPage.waitForDebounce(1200);

    const previewContent = await previewPage.getContent();

    expect(previewContent).toContain('First rapid edit');
    expect(previewContent).toContain('Second edit');
    expect(previewContent).toContain('Third line edit');
    expect(previewContent).toContain('Final rapid content');
    expect(await previewPage.hasFormattedText('bold')).toBe(true);

    await screenshots.captureWorkflowStep('06-sync-verified');

    console.log('✅ Rapid edits workflow completed - preview remained in sync!');
  });
});

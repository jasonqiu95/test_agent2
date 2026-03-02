/**
 * Full Workflow E2E Test: Style-to-Export Integration
 *
 * This test validates the complete user journey from project creation
 * through styling to final export. It covers:
 * 1. Project creation and document import
 * 2. Style selection and configuration
 * 3. Preview verification
 * 4. EPUB and PDF export
 * 5. File verification on disk
 */

import { test, expect } from './utils/fixtures';
import {
  createNewProject,
  importDocument,
  exportProject,
  getProjectStats
} from './helpers/projectHelpers';
import { navigateToView, waitForViewReady } from './helpers/navigationHelpers';
import { StylesPanel, PreviewPanel } from './page-objects';
import { sampleDocuments, createTestDocument, sampleContent } from './fixtures/sampleDocuments';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

test.describe('Full Workflow: Style-to-Export Integration', () => {
  let tempDir: string;
  let testDocPath: string;
  let epubOutputPath: string;
  let pdfOutputPath: string;

  test.beforeEach(async () => {
    // Create temporary directories for test files
    tempDir = path.join(os.tmpdir(), `e2e-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Define output paths
    epubOutputPath = path.join(tempDir, 'test-book.epub');
    pdfOutputPath = path.join(tempDir, 'test-book.pdf');

    // Create a test document with chapters
    const testContent = `
${sampleContent.chapter1}

${sampleContent.chapter2}

${sampleContent.chapter3}
    `.trim();

    testDocPath = await createTestDocument('test-workflow.docx', testContent);
  });

  test.afterEach(async () => {
    // Clean up temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  test('should complete full workflow from import to export', async ({ electronApp }) => {
    const { window } = electronApp;

    // Step 1: Launch app and create new project
    await test.step('Create new project', async () => {
      await createNewProject(window);

      // Verify we're in the editor view
      await expect(window.locator('.editor-view')).toBeVisible({ timeout: 10000 });
    });

    // Step 2: Import .docx file with chapters
    await test.step('Import document with chapters', async () => {
      await importDocument(window, testDocPath);

      // Wait for import to complete
      await window.waitForSelector('.import-dialog', { state: 'hidden', timeout: 30000 });

      // Verify chapters were imported
      const stats = await getProjectStats(window);
      expect(stats.chapterCount).toBeGreaterThan(0);
    });

    // Step 3: Navigate to Styles view
    await test.step('Navigate to Styles view', async () => {
      await navigateToView(window, 'styles');
      await waitForViewReady(window, 'styles');

      const stylesPanel = new StylesPanel(window);
      await stylesPanel.waitForReady();

      // Verify styles panel is visible
      expect(await stylesPanel.isVisible()).toBe(true);
    });

    // Step 4: Apply a professional style (Classic Serif)
    await test.step('Apply Classic Serif style', async () => {
      const stylesPanel = new StylesPanel(window);

      // Check if Classic Serif style exists
      const hasClassicSerif = await stylesPanel.hasStyle('Classic Serif');

      if (hasClassicSerif) {
        // Select and apply the Classic Serif style
        await stylesPanel.selectStyle('Classic Serif');
        await stylesPanel.applyStyle('Classic Serif');
      } else {
        // If Classic Serif doesn't exist, use the first available professional style
        const styleNames = await stylesPanel.getStyleNames();
        expect(styleNames.length).toBeGreaterThan(0);

        const firstStyle = styleNames[0];
        await stylesPanel.selectStyle(firstStyle);
        await stylesPanel.applyStyle(firstStyle);
      }

      // Wait for style application
      await window.waitForTimeout(1000);
    });

    // Step 5: Configure 2-3 style features
    await test.step('Configure style features', async () => {
      const stylesPanel = new StylesPanel(window);

      // Get the currently selected style
      const selectedStyle = await stylesPanel.getSelectedStyle();
      expect(selectedStyle).toBeTruthy();

      if (selectedStyle) {
        // Edit the style to configure features
        await stylesPanel.editStyle(selectedStyle);

        // Wait for style editor dialog
        const dialog = window.locator('.style-editor-dialog');
        await dialog.waitFor({ state: 'visible', timeout: 5000 });

        // Configure feature 1: Font size
        const fontSizeInput = dialog.locator('input[name="font-size"], input[name="fontSize"]');
        if (await fontSizeInput.count() > 0) {
          await fontSizeInput.first().fill('14');
        }

        // Configure feature 2: Line height
        const lineHeightInput = dialog.locator('input[name="line-height"], input[name="lineHeight"]');
        if (await lineHeightInput.count() > 0) {
          await lineHeightInput.first().fill('1.5');
        }

        // Configure feature 3: Paragraph spacing
        const paragraphSpacingInput = dialog.locator('input[name="paragraph-spacing"], input[name="paragraphSpacing"]');
        if (await paragraphSpacingInput.count() > 0) {
          await paragraphSpacingInput.first().fill('12');
        }

        // Save the style configuration
        const saveButton = dialog.locator('button:has-text("Save")');
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await dialog.waitFor({ state: 'hidden', timeout: 5000 });
        } else {
          // Close dialog if no save button
          const closeButton = dialog.locator('button:has-text("Close"), button:has-text("Cancel")');
          await closeButton.first().click();
        }
      }
    });

    // Step 6: Return to content view and verify styled preview
    await test.step('Verify styled preview', async () => {
      // Navigate to preview view
      await navigateToView(window, 'preview');
      await waitForViewReady(window, 'preview');

      const previewPanel = new PreviewPanel(window);
      await previewPanel.waitForReady();

      // Verify preview has content
      expect(await previewPanel.hasContent()).toBe(true);

      // Verify preview contains imported text
      const textContent = await previewPanel.getTextContent();
      expect(textContent.length).toBeGreaterThan(0);

      // Check for chapter content
      expect(
        textContent.includes('Chapter') ||
        textContent.includes('Beginning') ||
        textContent.includes('first chapter')
      ).toBe(true);

      // Verify preview is not in loading state
      expect(await previewPanel.isLoading()).toBe(false);
    });

    // Step 7: Generate EPUB and verify file creation
    await test.step('Export to EPUB', async () => {
      await exportProject(window, 'epub', epubOutputPath);

      // Wait for export to complete
      await window.waitForTimeout(2000);

      // Verify EPUB file was created
      try {
        const epubStats = await fs.stat(epubOutputPath);
        expect(epubStats.isFile()).toBe(true);
        expect(epubStats.size).toBeGreaterThan(0);
      } catch (error) {
        // If file doesn't exist at exact path, check for similar files
        const files = await fs.readdir(tempDir);
        const epubFiles = files.filter(f => f.endsWith('.epub'));
        expect(epubFiles.length).toBeGreaterThan(0);

        // Use the first epub file found
        const actualEpubPath = path.join(tempDir, epubFiles[0]);
        const epubStats = await fs.stat(actualEpubPath);
        expect(epubStats.size).toBeGreaterThan(0);
      }
    });

    // Step 8: Generate PDF and verify file creation
    await test.step('Export to PDF', async () => {
      await exportProject(window, 'pdf', pdfOutputPath);

      // Wait for export to complete
      await window.waitForTimeout(2000);

      // Verify PDF file was created
      try {
        const pdfStats = await fs.stat(pdfOutputPath);
        expect(pdfStats.isFile()).toBe(true);
        expect(pdfStats.size).toBeGreaterThan(0);
      } catch (error) {
        // If file doesn't exist at exact path, check for similar files
        const files = await fs.readdir(tempDir);
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));
        expect(pdfFiles.length).toBeGreaterThan(0);

        // Use the first pdf file found
        const actualPdfPath = path.join(tempDir, pdfFiles[0]);
        const pdfStats = await fs.stat(actualPdfPath);
        expect(pdfStats.size).toBeGreaterThan(0);
      }
    });

    // Step 9: Verify both exports completed successfully
    await test.step('Verify all exports completed', async () => {
      // List all files in temp directory
      const files = await fs.readdir(tempDir);

      // Count export files
      const epubFiles = files.filter(f => f.endsWith('.epub'));
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));

      // Verify we have at least one of each type
      expect(epubFiles.length).toBeGreaterThanOrEqual(1);
      expect(pdfFiles.length).toBeGreaterThanOrEqual(1);

      // Verify files have content
      for (const epubFile of epubFiles) {
        const stats = await fs.stat(path.join(tempDir, epubFile));
        expect(stats.size).toBeGreaterThan(0);
      }

      for (const pdfFile of pdfFiles) {
        const stats = await fs.stat(path.join(tempDir, pdfFile));
        expect(stats.size).toBeGreaterThan(0);
      }
    });
  });

  test('should handle workflow with existing document', async ({ electronApp }) => {
    const { window } = electronApp;

    await test.step('Setup project with existing document', async () => {
      // Use a pre-existing sample document if available
      const docPath = sampleDocuments.withHeadings?.path || testDocPath;

      await createNewProject(window);
      await importDocument(window, docPath);

      // Verify import
      await expect(window.locator('.editor-view')).toBeVisible();
    });

    await test.step('Apply and configure style', async () => {
      await navigateToView(window, 'styles');
      const stylesPanel = new StylesPanel(window);
      await stylesPanel.waitForReady();

      // Get available styles
      const styles = await stylesPanel.getStyleNames();

      if (styles.length > 0) {
        // Apply first available style
        await stylesPanel.selectStyle(styles[0]);
        await stylesPanel.applyStyle(styles[0]);

        // Verify style was selected
        const selected = await stylesPanel.getSelectedStyle();
        expect(selected).toBe(styles[0]);
      }
    });

    await test.step('Verify preview and export', async () => {
      // Check preview
      await navigateToView(window, 'preview');
      const previewPanel = new PreviewPanel(window);
      await previewPanel.waitForReady();

      expect(await previewPanel.hasContent()).toBe(true);

      // Export to EPUB only (faster test)
      await exportProject(window, 'epub', epubOutputPath);
      await window.waitForTimeout(1500);

      // Verify export
      const files = await fs.readdir(tempDir);
      const epubFiles = files.filter(f => f.endsWith('.epub'));
      expect(epubFiles.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('should handle workflow errors gracefully', async ({ electronApp }) => {
    const { window } = electronApp;

    await test.step('Create project without import', async () => {
      await createNewProject(window);
      await expect(window.locator('.editor-view')).toBeVisible();
    });

    await test.step('Attempt to export empty project', async () => {
      // Try to export without content
      // This should either show an error or create a minimal file
      try {
        await exportProject(window, 'epub', epubOutputPath);
        await window.waitForTimeout(1000);

        // Check if an error dialog appeared
        const errorDialog = window.locator('.error-dialog, .alert-dialog');
        const hasError = await errorDialog.count() > 0;

        if (hasError) {
          // Error handling is working correctly
          expect(await errorDialog.isVisible()).toBe(true);
        }
      } catch (error) {
        // Export failed gracefully
        expect(error).toBeTruthy();
      }
    });
  });

  test('should preserve styles through preview updates', async ({ electronApp }) => {
    const { window } = electronApp;

    await test.step('Setup and apply style', async () => {
      await createNewProject(window);
      await importDocument(window, testDocPath);

      await navigateToView(window, 'styles');
      const stylesPanel = new StylesPanel(window);
      await stylesPanel.waitForReady();

      const styles = await stylesPanel.getStyleNames();
      if (styles.length > 0) {
        await stylesPanel.selectStyle(styles[0]);
        await stylesPanel.applyStyle(styles[0]);
      }
    });

    await test.step('Verify style persists in preview', async () => {
      await navigateToView(window, 'preview');
      const previewPanel = new PreviewPanel(window);
      await previewPanel.waitForReady();

      // Get initial preview state
      const initialContent = await previewPanel.getRenderedContent();
      expect(initialContent.length).toBeGreaterThan(0);

      // Refresh preview
      await previewPanel.refresh();

      // Verify content is still styled
      const refreshedContent = await previewPanel.getRenderedContent();
      expect(refreshedContent.length).toBeGreaterThan(0);

      // Style should be maintained (content should be similar)
      expect(refreshedContent.length).toBeCloseTo(initialContent.length, -2);
    });
  });
});

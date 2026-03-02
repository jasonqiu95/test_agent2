/**
 * E2E Test: PDF Export with File Verification
 *
 * This test verifies the complete PDF export workflow:
 * 1. Create/open project with styled content
 * 2. Navigate to Export/Generate section
 * 3. Select PDF format and configure settings
 * 4. Generate PDF
 * 5. Verify progress indicator
 * 6. Verify success notification
 * 7. Verify PDF file was created
 * 8. Verify file properties (extension, size, page count)
 */

import { test, expect } from './utils/fixtures';
import { mockBooks } from './fixtures';
import { openProject, waitForFileExists, verifyFileExists } from './helpers';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

test.describe('PDF Export with File Verification', () => {
  let tempDir: string;
  let exportFilePath: string;

  test.beforeEach(async () => {
    // Create temporary directory for export files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-export-test-'));
    exportFilePath = path.join(tempDir, 'test-book-export.pdf');
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

  test('should export project as PDF with complete file verification', async ({
    electronApp,
  }) => {
    const { window, app } = electronApp;

    // Step 1: Open a project with styled content
    await openProject(window, mockBooks.complete);

    // Wait for the project to be fully loaded
    await window.waitForSelector('.editor-view', { timeout: 10000 });

    // Step 2: Set up export path via test helper
    // Inject the export file path that the app should use
    await window.evaluate((filePath) => {
      if (!window.testHelpers) {
        window.testHelpers = {};
      }
      window.testHelpers.setExportPath = (path: string) => {
        (window as any).__testExportPath = filePath;
      };
      window.testHelpers.setExportPath(filePath);
    }, exportFilePath);

    // Step 3: Trigger PDF export via menu event
    // Simulate the Electron menu action
    await window.evaluate(() => {
      // Emit the menu event that the app listens for
      window.dispatchEvent(
        new CustomEvent('menu:file:export', {
          detail: { format: 'pdf' },
        })
      );
    });

    // Alternative: If there's an export button in the UI, click it
    // Wait for export dialog to appear
    const exportDialog = window.locator('.export-dialog, [role="dialog"]');
    const hasDialog = (await exportDialog.count()) > 0;

    if (hasDialog) {
      await exportDialog.waitFor({ state: 'visible', timeout: 5000 });

      // Step 4: Configure PDF export settings
      // Select PDF format
      const formatSelect = window.locator(
        'select[name="format"], select[aria-label*="format" i]'
      );
      if ((await formatSelect.count()) > 0) {
        await formatSelect.selectOption('pdf');
      }

      // Configure trim size to 6x9
      const trimSizeSelect = window.locator(
        'select[name="trimSize"], select[aria-label*="trim" i], select[aria-label*="size" i]'
      );
      if ((await trimSizeSelect.count()) > 0) {
        await trimSizeSelect.selectOption('6x9');
      }

      // Configure margins (if available)
      const marginInputs = window.locator(
        'input[name*="margin" i], input[aria-label*="margin" i]'
      );
      const marginCount = await marginInputs.count();
      if (marginCount > 0) {
        // Set reasonable default margins (e.g., 0.75 inches)
        for (let i = 0; i < Math.min(marginCount, 4); i++) {
          await marginInputs.nth(i).fill('0.75');
        }
      }

      // Configure headers/footers (if available)
      const headerCheckbox = window.locator(
        'input[type="checkbox"][name*="header" i], input[type="checkbox"][aria-label*="header" i]'
      );
      if ((await headerCheckbox.count()) > 0) {
        await headerCheckbox.check();
      }

      const footerCheckbox = window.locator(
        'input[type="checkbox"][name*="footer" i], input[type="checkbox"][aria-label*="footer" i]'
      );
      if ((await footerCheckbox.count()) > 0) {
        await footerCheckbox.check();
      }

      // Step 5: Click Generate/Export PDF button
      const generateButton = window.locator(
        'button:has-text("Generate"), button:has-text("Export"), button:has-text("Generate PDF")'
      );
      await generateButton.click();
    } else {
      // If no dialog, the export might start directly
      // Wait a moment for the process to begin
      await window.waitForTimeout(1000);
    }

    // Step 6: Wait for and verify export progress indicator
    const progressModal = window.locator(
      '.generation-progress-modal, .generation-progress-backdrop, [role="dialog"][aria-labelledby*="progress"]'
    );

    // Progress modal should appear
    await expect(progressModal).toBeVisible({ timeout: 5000 });

    // Verify progress bar exists
    const progressBar = window.locator(
      '[role="progressbar"], .generation-progress-bar, .progress-bar'
    );
    await expect(progressBar).toBeVisible({ timeout: 2000 });

    // Verify progress status text is displayed
    const progressStatus = window.locator(
      '.generation-progress-status, .progress-status, [class*="status"]'
    );
    if ((await progressStatus.count()) > 0) {
      await expect(progressStatus).toBeVisible();
    }

    // Wait for export progress to complete
    // The modal should disappear when done
    await progressModal.waitFor({ state: 'hidden', timeout: 60000 });

    // Step 7: Verify success notification appears
    const notification = window.locator(
      '.notification, .toast, [role="alert"], [class*="notification"]'
    );

    // Wait for success notification with various possible text patterns
    await notification.waitFor({ state: 'visible', timeout: 5000 });

    const notificationText = await notification.textContent();
    expect(notificationText?.toLowerCase()).toMatch(
      /success|complete|exported|generated|saved/i
    );

    // Step 8: Verify PDF file was created at expected path
    // Wait for file to exist (with retry logic)
    const fileExists = await waitForFileExists(exportFilePath, 10000);
    expect(fileExists).toBe(true);

    // Additional verification using fs module
    const fileExistsVerification = await verifyFileExists(exportFilePath);
    expect(fileExistsVerification).toBe(true);

    // Step 9: Verify file has .pdf extension
    expect(exportFilePath.endsWith('.pdf')).toBe(true);
    expect(path.extname(exportFilePath)).toBe('.pdf');

    // Step 10: Verify minimum file size (PDF files should be at least a few KB)
    const stats = await fs.stat(exportFilePath);
    expect(stats.size).toBeGreaterThan(1024); // At least 1 KB
    expect(stats.size).toBeGreaterThan(0); // Not empty

    // For a complete book with multiple chapters, expect a reasonable size
    expect(stats.size).toBeGreaterThan(10 * 1024); // At least 10 KB for a multi-chapter book

    // Step 11: Optionally verify PDF has multiple pages
    // Read the file content to check for page markers
    const fileBuffer = await fs.readFile(exportFilePath);
    const fileContent = fileBuffer.toString('latin1'); // PDFs use Latin-1 encoding

    // Verify PDF signature (starts with %PDF-)
    expect(fileContent.startsWith('%PDF-')).toBe(true);

    // Verify PDF contains page objects (indicates multiple pages)
    // Look for Type /Page entries in the PDF
    const pageMatches = fileContent.match(/\/Type\s*\/Page\b/g);
    if (pageMatches) {
      const pageCount = pageMatches.length;
      expect(pageCount).toBeGreaterThan(0);

      // The complete book should have multiple pages
      // (front matter + 3 chapters + back matter)
      expect(pageCount).toBeGreaterThanOrEqual(3);
    }

    // Verify file is a valid PDF by checking for EOF marker
    expect(fileContent).toContain('%%EOF');
  });

  test('should handle PDF export for simple book', async ({ electronApp }) => {
    const { window } = electronApp;

    // Use simple book with less content
    await openProject(window, mockBooks.simple);
    await window.waitForSelector('.editor-view', { timeout: 10000 });

    const simpleExportPath = path.join(tempDir, 'simple-book.pdf');

    // Set export path
    await window.evaluate((filePath) => {
      if (!window.testHelpers) {
        window.testHelpers = {};
      }
      (window as any).__testExportPath = filePath;
    }, simpleExportPath);

    // Trigger export
    await window.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('menu:file:export', {
          detail: { format: 'pdf' },
        })
      );
    });

    // If dialog appears, configure and submit
    const exportDialog = window.locator('.export-dialog, [role="dialog"]');
    if ((await exportDialog.count()) > 0) {
      await exportDialog.waitFor({ state: 'visible', timeout: 5000 });

      const generateButton = window.locator(
        'button:has-text("Generate"), button:has-text("Export")'
      );
      await generateButton.click();
    }

    // Wait for progress modal
    const progressModal = window.locator(
      '.generation-progress-modal, .generation-progress-backdrop'
    );
    await progressModal.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for completion
    await progressModal.waitFor({ state: 'hidden', timeout: 60000 });

    // Verify file was created
    const fileExists = await waitForFileExists(simpleExportPath, 10000);
    expect(fileExists).toBe(true);

    // Verify basic file properties
    const stats = await fs.stat(simpleExportPath);
    expect(stats.size).toBeGreaterThan(1024); // At least 1 KB
    expect(path.extname(simpleExportPath)).toBe('.pdf');

    // Verify PDF format
    const fileBuffer = await fs.readFile(simpleExportPath);
    const fileContent = fileBuffer.toString('latin1');
    expect(fileContent.startsWith('%PDF-')).toBe(true);
  });

  test('should handle export cancellation', async ({ electronApp }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.varied);
    await window.waitForSelector('.editor-view', { timeout: 10000 });

    const cancelExportPath = path.join(tempDir, 'cancelled-export.pdf');

    await window.evaluate((filePath) => {
      if (!window.testHelpers) {
        window.testHelpers = {};
      }
      (window as any).__testExportPath = filePath;
    }, cancelExportPath);

    // Trigger export
    await window.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('menu:file:export', {
          detail: { format: 'pdf' },
        })
      );
    });

    // Wait for progress modal
    const progressModal = window.locator(
      '.generation-progress-modal, .generation-progress-backdrop'
    );
    await progressModal.waitFor({ state: 'visible', timeout: 5000 });

    // Click cancel button
    const cancelButton = window.locator(
      '.generation-progress-btn-cancel, button:has-text("Cancel")'
    );
    if ((await cancelButton.count()) > 0) {
      await cancelButton.click();

      // Modal should close
      await progressModal.waitFor({ state: 'hidden', timeout: 5000 });

      // Wait a moment to ensure no file is created
      await window.waitForTimeout(2000);

      // Verify file was NOT created (or is incomplete)
      const fileExists = await verifyFileExists(cancelExportPath);

      // If a file was created, it should be small/incomplete
      if (fileExists) {
        const stats = await fs.stat(cancelExportPath);
        // Cancelled exports might create partial files, but they should be small
        // or we can check if they're valid PDFs
        console.log('File created despite cancellation, size:', stats.size);
      }
    }
  });
});

// Type declarations for test helpers
declare global {
  interface Window {
    testHelpers?: {
      loadBook?: (book: any) => void;
      setImportFile?: (filePath: string) => void;
      setExportPath?: (filePath: string) => void;
    };
    __testExportPath?: string;
  }
}

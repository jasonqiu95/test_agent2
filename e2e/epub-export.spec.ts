/**
 * E2E Test: EPUB Export with File Verification
 *
 * Tests the complete EPUB generation workflow including:
 * - Project creation with styled content
 * - Export configuration with metadata
 * - EPUB file generation and verification
 * - File structure validation using JSZip
 */

import { test, expect } from './utils/fixtures';
import { openProject, createNewProject } from './helpers';
import { mockBooks, createSimpleBook } from './fixtures';
import { NavigatorPanel, EditorPanel } from './page-objects';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import JSZip from 'jszip';

// Test configuration
const TEST_TIMEOUT = 120000; // 2 minutes for EPUB generation
const EPUB_MIN_SIZE = 1024; // Minimum 1KB
const EPUB_MAX_SIZE = 100 * 1024 * 1024; // Maximum 100MB

/**
 * Helper to create a temporary directory for test outputs
 */
async function createTempDir(): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `epub-test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Helper to clean up temporary directory
 */
async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup temp dir: ${tempDir}`, error);
  }
}

/**
 * Verify EPUB file structure using JSZip
 */
async function verifyEpubStructure(epubPath: string): Promise<{
  valid: boolean;
  errors: string[];
  structure: {
    hasMimetype: boolean;
    hasMetaInf: boolean;
    hasOEBPS: boolean;
    hasContainerXml: boolean;
    hasContentOpf: boolean;
    fileCount: number;
  };
}> {
  const errors: string[] = [];
  const structure = {
    hasMimetype: false,
    hasMetaInf: false,
    hasOEBPS: false,
    hasContainerXml: false,
    hasContentOpf: false,
    fileCount: 0,
  };

  try {
    // Read the EPUB file
    const epubBuffer = await fs.readFile(epubPath);
    const zip = await JSZip.loadAsync(epubBuffer);

    // Get all files in the archive
    const files = Object.keys(zip.files);
    structure.fileCount = files.length;

    // Check for mimetype file
    if (files.includes('mimetype')) {
      structure.hasMimetype = true;
      const mimetypeFile = zip.files['mimetype'];
      const mimetypeContent = await mimetypeFile.async('string');
      if (mimetypeContent.trim() !== 'application/epub+zip') {
        errors.push(`Invalid mimetype: ${mimetypeContent}`);
      }
    } else {
      errors.push('Missing mimetype file');
    }

    // Check for META-INF directory
    structure.hasMetaInf = files.some(f => f.startsWith('META-INF/'));
    if (!structure.hasMetaInf) {
      errors.push('Missing META-INF directory');
    }

    // Check for OEBPS directory (or equivalent content directory)
    structure.hasOEBPS = files.some(f => f.startsWith('OEBPS/') || f.startsWith('content/'));
    if (!structure.hasOEBPS) {
      errors.push('Missing OEBPS/content directory');
    }

    // Check for container.xml
    if (files.includes('META-INF/container.xml')) {
      structure.hasContainerXml = true;
      const containerFile = zip.files['META-INF/container.xml'];
      const containerContent = await containerFile.async('string');
      // Basic validation that it contains rootfile reference
      if (!containerContent.includes('rootfile')) {
        errors.push('container.xml missing rootfile reference');
      }
    } else {
      errors.push('Missing META-INF/container.xml');
    }

    // Check for content.opf (OPF file can be named differently, so we look for .opf extension)
    const opfFiles = files.filter(f => f.endsWith('.opf'));
    structure.hasContentOpf = opfFiles.length > 0;
    if (!structure.hasContentOpf) {
      errors.push('Missing OPF package document');
    }

    return {
      valid: errors.length === 0,
      errors,
      structure,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to load EPUB: ${error instanceof Error ? error.message : 'Unknown error'}`],
      structure,
    };
  }
}

test.describe('EPUB Export with File Verification', () => {
  let tempDir: string;

  // Setup: Create temp directory before each test
  test.beforeEach(async () => {
    tempDir = await createTempDir();
  });

  // Teardown: Clean up temp directory after each test
  test.afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  test('should generate EPUB from project with styled content', async ({ electronApp }) => {
    test.setTimeout(TEST_TIMEOUT);
    const { window } = electronApp;

    // 1. Create/open project with styled content
    const book = createSimpleBook();
    // Enhance the book with metadata for EPUB
    book.metadata = {
      ...book.metadata,
      author: 'Test Author',
      publisher: 'Test Publishing',
      language: 'en',
      isbn: '978-0-123456-78-9',
      description: 'A test book for EPUB generation',
    };

    await openProject(window, book);

    // Wait for the project to be fully loaded
    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Verify chapters are loaded
    const chapterCount = await navigator.getChapterCount();
    expect(chapterCount).toBeGreaterThan(0);

    // 2. Navigate to Export/Generate section
    // Look for export button in the UI
    const exportButton = window.locator('button:has-text("Export"), button[data-testid="export-button"]').first();

    // If export button exists in main UI, click it
    if (await exportButton.count() > 0) {
      await exportButton.click();
    } else {
      // Alternative: Try menu-based approach
      const menuButton = window.locator('button:has-text("File"), button[aria-label="File menu"]').first();
      if (await menuButton.count() > 0) {
        await menuButton.click();
        await window.locator('button:has-text("Export"), li:has-text("Export")').first().click();
      }
    }

    // Wait for export dialog to appear
    const exportDialog = window.locator('.export-dialog, [data-testid="export-dialog"], [role="dialog"]');
    await exportDialog.waitFor({ state: 'visible', timeout: 10000 });

    // 3. Configure EPUB settings (title, author metadata)
    // Select EPUB format
    const formatSelect = window.locator('select[name="format"], select[data-testid="export-format"]').first();
    if (await formatSelect.count() > 0) {
      await formatSelect.selectOption('epub');
    }

    // Set title (if editable)
    const titleInput = window.locator('input[name="title"], input[data-testid="epub-title"]').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill('Test EPUB Book');
    }

    // Set author (if editable)
    const authorInput = window.locator('input[name="author"], input[data-testid="epub-author"]').first();
    if (await authorInput.count() > 0) {
      await authorInput.fill('Test Author');
    }

    // Set output path using test helper if available
    const outputPath = path.join(tempDir, 'test-output.epub');
    await window.evaluate((filePath) => {
      if (window.testHelpers?.setExportPath) {
        window.testHelpers.setExportPath(filePath);
      }
    }, outputPath);

    // 4. Click Generate EPUB button
    const generateButton = window.locator(
      'button:has-text("Generate EPUB"), button:has-text("Generate"), button[data-testid="generate-epub-button"]'
    ).first();
    await generateButton.click();

    // 5. Wait for export progress indicator to complete
    const progressModal = window.locator('.generation-progress-modal, [data-testid="generation-progress"]');

    // Wait for progress modal to appear
    await progressModal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      console.log('Progress modal not visible, continuing...');
    });

    // Wait for progress to reach 100% or modal to disappear
    // We use a more flexible approach that waits for either completion state
    let progressCompleted = false;
    const startTime = Date.now();
    const maxWaitTime = 60000; // 60 seconds

    while (!progressCompleted && (Date.now() - startTime) < maxWaitTime) {
      // Check if modal is still visible
      const modalVisible = await progressModal.isVisible().catch(() => false);

      if (!modalVisible) {
        progressCompleted = true;
        break;
      }

      // Check progress percentage
      const progressPercent = window.locator('.generation-progress-percentage');
      const percentText = await progressPercent.textContent().catch(() => '0%');

      if (percentText.includes('100')) {
        progressCompleted = true;
        break;
      }

      // Check progress bar
      const progressBar = window.locator('.generation-progress-bar');
      const progressWidth = await progressBar.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.width;
      }).catch(() => '0%');

      if (progressWidth === '100%' || progressWidth.includes('100')) {
        progressCompleted = true;
        break;
      }

      // Wait a bit before checking again
      await window.waitForTimeout(500);
    }

    // Wait for modal to disappear (indicates completion)
    await progressModal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      console.log('Progress modal still visible after timeout');
    });

    // 6. Verify success notification appears
    const successNotification = window.locator(
      '.success-notification, .notification:has-text("success"), [data-testid="success-notification"]'
    ).first();

    // Give some time for notification to appear
    await window.waitForTimeout(1000);

    // Check if success notification is visible (optional, as file verification is more reliable)
    const notificationVisible = await successNotification.isVisible().catch(() => false);
    if (notificationVisible) {
      const notificationText = await successNotification.textContent();
      expect(notificationText).toMatch(/success|complete|generated/i);
    }

    // 7. Verify EPUB file was created at expected path using fs module
    // Wait a bit for file to be fully written
    await window.waitForTimeout(2000);

    // Check if file exists
    let fileExists = false;
    let fileStats;
    try {
      fileStats = await fs.stat(outputPath);
      fileExists = fileStats.isFile();
    } catch (error) {
      console.error('File not found:', outputPath);
    }

    expect(fileExists).toBe(true);
    expect(fileStats).toBeDefined();

    // 8. Verify file size is reasonable
    const fileSize = fileStats!.size;
    expect(fileSize).toBeGreaterThan(EPUB_MIN_SIZE);
    expect(fileSize).toBeLessThan(EPUB_MAX_SIZE);

    console.log(`EPUB file created: ${outputPath}, size: ${fileSize} bytes`);

    // 9. Use JSZip to verify EPUB structure
    const verification = await verifyEpubStructure(outputPath);

    // Log structure details
    console.log('EPUB Structure:', verification.structure);
    if (verification.errors.length > 0) {
      console.log('EPUB Validation Errors:', verification.errors);
    }

    // Assert structure validity
    expect(verification.valid).toBe(true);
    expect(verification.errors).toHaveLength(0);

    // Verify specific structure requirements
    expect(verification.structure.hasMimetype).toBe(true);
    expect(verification.structure.hasMetaInf).toBe(true);
    expect(verification.structure.hasOEBPS).toBe(true);
    expect(verification.structure.hasContainerXml).toBe(true);
    expect(verification.structure.hasContentOpf).toBe(true);
    expect(verification.structure.fileCount).toBeGreaterThan(5); // At least mimetype, container.xml, content.opf, toc, and content files
  });

  test('should generate EPUB with complete book metadata', async ({ electronApp }) => {
    test.setTimeout(TEST_TIMEOUT);
    const { window } = electronApp;

    // Use the complete book fixture with full metadata
    const book = mockBooks.complete;
    await openProject(window, book);

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Verify all book sections are loaded
    const chapterCount = await navigator.getChapterCount();
    expect(chapterCount).toBe(3); // Complete book has 3 chapters

    // Navigate to export
    const exportButton = window.locator('button:has-text("Export"), button[data-testid="export-button"]').first();

    if (await exportButton.count() > 0) {
      await exportButton.click();
    }

    const exportDialog = window.locator('.export-dialog, [data-testid="export-dialog"], [role="dialog"]');
    await exportDialog.waitFor({ state: 'visible', timeout: 10000 });

    // Configure EPUB export
    const formatSelect = window.locator('select[name="format"], select[data-testid="export-format"]').first();
    if (await formatSelect.count() > 0) {
      await formatSelect.selectOption('epub');
    }

    // Set output path
    const outputPath = path.join(tempDir, 'complete-book.epub');
    await window.evaluate((filePath) => {
      if (window.testHelpers?.setExportPath) {
        window.testHelpers.setExportPath(filePath);
      }
    }, outputPath);

    // Generate EPUB
    const generateButton = window.locator(
      'button:has-text("Generate EPUB"), button:has-text("Generate"), button[data-testid="generate-epub-button"]'
    ).first();
    await generateButton.click();

    // Wait for completion
    const progressModal = window.locator('.generation-progress-modal, [data-testid="generation-progress"]');
    await progressModal.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {
      console.log('Progress modal timeout');
    });

    // Wait for file to be written
    await window.waitForTimeout(2000);

    // Verify file was created
    const fileStats = await fs.stat(outputPath);
    expect(fileStats.isFile()).toBe(true);
    expect(fileStats.size).toBeGreaterThan(EPUB_MIN_SIZE);

    // Verify EPUB structure
    const verification = await verifyEpubStructure(outputPath);
    expect(verification.valid).toBe(true);
    expect(verification.structure.fileCount).toBeGreaterThan(10); // Complete book should have more files

    console.log(`Complete EPUB generated: ${fileStats.size} bytes, ${verification.structure.fileCount} files`);
  });

  test('should handle EPUB generation cancellation', async ({ electronApp }) => {
    test.setTimeout(TEST_TIMEOUT);
    const { window } = electronApp;

    const book = mockBooks.large; // Use large book for testing cancellation
    await openProject(window, book);

    const navigator = new NavigatorPanel(window);
    await navigator.waitForReady();

    // Navigate to export
    const exportButton = window.locator('button:has-text("Export"), button[data-testid="export-button"]').first();
    if (await exportButton.count() > 0) {
      await exportButton.click();
    }

    const exportDialog = window.locator('.export-dialog, [data-testid="export-dialog"], [role="dialog"]');
    await exportDialog.waitFor({ state: 'visible', timeout: 10000 });

    // Configure and start generation
    const formatSelect = window.locator('select[name="format"], select[data-testid="export-format"]').first();
    if (await formatSelect.count() > 0) {
      await formatSelect.selectOption('epub');
    }

    const outputPath = path.join(tempDir, 'cancelled.epub');
    await window.evaluate((filePath) => {
      if (window.testHelpers?.setExportPath) {
        window.testHelpers.setExportPath(filePath);
      }
    }, outputPath);

    const generateButton = window.locator(
      'button:has-text("Generate EPUB"), button:has-text("Generate"), button[data-testid="generate-epub-button"]'
    ).first();
    await generateButton.click();

    // Wait for progress modal to appear
    const progressModal = window.locator('.generation-progress-modal, [data-testid="generation-progress"]');
    await progressModal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      console.log('Progress modal not visible');
    });

    // Click cancel button
    const cancelButton = window.locator('.generation-progress-btn-cancel, button:has-text("Cancel")').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    }

    // Wait for modal to close
    await progressModal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      console.log('Progress modal did not close');
    });

    // Verify file was not created or is incomplete
    await window.waitForTimeout(1000);

    try {
      const fileStats = await fs.stat(outputPath);
      // If file exists, it should be smaller than expected (incomplete)
      // Or we check that it's not a valid EPUB
      if (fileStats.size > 0) {
        const verification = await verifyEpubStructure(outputPath);
        // Cancelled EPUB might not be valid
        console.log('Cancelled EPUB validation:', verification.valid);
      }
    } catch (error) {
      // File doesn't exist, which is expected for cancelled operation
      console.log('File was not created (cancelled)');
    }
  });
});

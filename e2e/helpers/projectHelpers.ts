/**
 * Project-related helper utilities for E2E tests
 *
 * These helpers provide high-level operations for working with
 * projects in E2E tests.
 */

import { Page } from '@playwright/test';
import type { Book } from '../../src/types/book';
import fs from 'fs/promises';
import path from 'path';

/**
 * Open a project in the application
 *
 * @param page - The Playwright page object
 * @param book - The book data to open
 * @param filePath - Optional file path where the project is saved
 */
export async function openProject(
  page: Page,
  book: Book,
  filePath?: string
): Promise<void> {
  // Wait for the welcome screen to be visible
  await page.waitForSelector('.welcome-screen', { timeout: 10000 });

  // If a file path is provided, we can try to open from recent projects
  if (filePath) {
    // Check if there's a recent project with this path
    const recentProject = page.locator(`.recent-project[data-path="${filePath}"]`);
    const exists = await recentProject.count();

    if (exists > 0) {
      // Click the recent project
      await recentProject.click();
      return;
    }
  }

  // Otherwise, we need to create/load the project
  // This could involve using the "Open" button and file dialog
  // For testing purposes, we might inject the book data directly
  await page.evaluate((bookData: Book) => {
    // Inject the book data into the app's state
    // This assumes there's a global method to load book data
    // Adjust based on your actual implementation
    if (window.testHelpers?.loadBook) {
      window.testHelpers.loadBook(bookData);
    }
  }, book);

  // Wait for the editor view to be visible
  await page.waitForSelector('.editor-view', { timeout: 10000 });
}

/**
 * Create a new project
 *
 * @param page - The Playwright page object
 */
export async function createNewProject(page: Page): Promise<void> {
  // Wait for welcome screen
  await page.waitForSelector('.welcome-screen', { timeout: 10000 });

  // Click "New Project" button
  const newProjectButton = page.locator('button:has-text("New Project")');
  await newProjectButton.click();

  // Wait for editor view
  await page.waitForSelector('.editor-view', { timeout: 10000 });
}

/**
 * Save the current project
 *
 * @param page - The Playwright page object
 * @param filePath - Where to save the project
 */
export async function saveProject(
  page: Page,
  filePath: string
): Promise<void> {
  // Trigger save (this might be Cmd+S or a button)
  await page.keyboard.press('Meta+S');

  // Wait for save to complete (adjust based on your app's feedback)
  await page.waitForTimeout(500);
}

/**
 * Close the current project
 *
 * @param page - The Playwright page object
 */
export async function closeProject(page: Page): Promise<void> {
  // Click back to welcome button
  const backButton = page.locator('button:has-text("Back to Welcome")');
  await backButton.click();

  // Wait for welcome screen
  await page.waitForSelector('.welcome-screen', { timeout: 10000 });
}

/**
 * Get the current project title from the UI
 *
 * @param page - The Playwright page object
 * @returns The project title
 */
export async function getProjectTitle(page: Page): Promise<string> {
  const titleElement = page.locator('.editor-title');
  return await titleElement.textContent() || '';
}

/**
 * Check if a project is currently open
 *
 * @param page - The Playwright page object
 * @returns True if a project is open
 */
export async function isProjectOpen(page: Page): Promise<boolean> {
  const editorView = page.locator('.editor-view');
  return await editorView.isVisible();
}

/**
 * Import a document into the current project
 *
 * @param page - The Playwright page object
 * @param documentPath - Path to the document to import
 */
export async function importDocument(
  page: Page,
  documentPath: string
): Promise<void> {
  // Click import button
  const importButton = page.locator('button:has-text("Import")');
  await importButton.click();

  // Wait for import dialog
  await page.waitForSelector('.import-dialog', { timeout: 5000 });

  // Handle file input
  // Note: This is tricky in E2E tests, might need to mock the file dialog
  // or use a test helper to inject the file path
  await page.evaluate((filePath) => {
    if (window.testHelpers?.setImportFile) {
      window.testHelpers.setImportFile(filePath);
    }
  }, documentPath);

  // Confirm import
  const confirmButton = page.locator('.import-dialog button:has-text("Import")');
  await confirmButton.click();

  // Wait for import to complete
  await page.waitForSelector('.import-dialog', { state: 'hidden', timeout: 30000 });
}

/**
 * Export the current project to a specific format
 *
 * @param page - The Playwright page object
 * @param format - Export format (pdf, epub, docx, etc.)
 * @param outputPath - Where to save the exported file
 */
export async function exportProject(
  page: Page,
  format: string,
  outputPath: string
): Promise<void> {
  // Open export dialog
  const exportButton = page.locator('button:has-text("Export")');
  await exportButton.click();

  // Wait for export dialog
  await page.waitForSelector('.export-dialog', { timeout: 5000 });

  // Select format
  const formatSelect = page.locator('.export-dialog select[name="format"]');
  await formatSelect.selectOption(format);

  // Set output path (might need test helper)
  await page.evaluate((path) => {
    if (window.testHelpers?.setExportPath) {
      window.testHelpers.setExportPath(path);
    }
  }, outputPath);

  // Confirm export
  const confirmButton = page.locator('.export-dialog button:has-text("Export")');
  await confirmButton.click();

  // Wait for export to complete
  await page.waitForSelector('.export-dialog', { state: 'hidden', timeout: 30000 });
}

/**
 * Get project statistics from the UI
 *
 * @param page - The Playwright page object
 * @returns Object with word count, chapter count, etc.
 */
export async function getProjectStats(page: Page): Promise<{
  wordCount?: number;
  chapterCount?: number;
  pageCount?: number;
}> {
  const stats: any = {};

  // Try to find word count
  const wordCountElement = page.locator('[data-testid="word-count"]');
  if (await wordCountElement.count() > 0) {
    const text = await wordCountElement.textContent();
    stats.wordCount = parseInt(text || '0', 10);
  }

  // Try to find chapter count
  const chapterCountElement = page.locator('[data-testid="chapter-count"]');
  if (await chapterCountElement.count() > 0) {
    const text = await chapterCountElement.textContent();
    stats.chapterCount = parseInt(text || '0', 10);
  }

  return stats;
}

/**
 * Create a temporary project file for testing
 *
 * @param book - The book data
 * @param tempDir - Temporary directory to use
 * @returns Path to the created file
 */
export async function createTempProjectFile(
  book: Book,
  tempDir: string
): Promise<string> {
  await fs.mkdir(tempDir, { recursive: true });
  const filename = `test-project-${Date.now()}.json`;
  const filePath = path.join(tempDir, filename);
  await fs.writeFile(filePath, JSON.stringify(book, null, 2));
  return filePath;
}

/**
 * Clean up temporary project files
 *
 * @param tempDir - Temporary directory to clean
 */
export async function cleanupTempProjects(tempDir: string): Promise<void> {
  try {
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      if (file.startsWith('test-project-')) {
        await fs.unlink(path.join(tempDir, file));
      }
    }
  } catch (error) {
    // Directory might not exist
  }
}

// Type declarations for test helpers
declare global {
  interface Window {
    testHelpers?: {
      loadBook?: (book: Book) => void;
      setImportFile?: (filePath: string) => void;
      setExportPath?: (filePath: string) => void;
    };
  }
}

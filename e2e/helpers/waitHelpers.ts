/**
 * Wait and verification helper utilities for E2E tests
 *
 * These helpers provide waiting and verification functionality
 * to ensure proper test synchronization.
 */

import { Page, expect } from '@playwright/test';
import fs from 'fs/promises';

/**
 * Wait for preview to update after content changes
 *
 * @param page - The Playwright page object
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForPreviewUpdate(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  // Wait for any pending preview renders
  await page.waitForFunction(
    () => {
      // Check if there's a preview rendering flag
      return !(window as any).previewRendering;
    },
    { timeout }
  );

  // Additional wait for DOM updates
  await page.waitForTimeout(200);
}

/**
 * Wait for a file to exist on the filesystem
 *
 * @param filePath - Path to the file
 * @param timeout - Maximum time to wait in milliseconds
 * @returns True if file exists
 */
export async function waitForFileExists(
  filePath: string,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      // File doesn't exist yet, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return false;
}

/**
 * Verify that a file exists
 *
 * @param filePath - Path to the file
 * @returns True if file exists
 */
export async function verifyFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for an element to contain specific text
 *
 * @param page - The Playwright page object
 * @param selector - CSS selector of the element
 * @param text - Text to wait for
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForText(
  page: Page,
  selector: string,
  text: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(
    ({ sel, txt }) => {
      const element = document.querySelector(sel);
      return element?.textContent?.includes(txt) || false;
    },
    { sel: selector, txt: text },
    { timeout }
  );
}

/**
 * Wait for an element to be stable (not moving/resizing)
 *
 * @param page - The Playwright page object
 * @param selector - CSS selector of the element
 * @param stableTime - How long element should be stable in milliseconds
 */
export async function waitForElementStable(
  page: Page,
  selector: string,
  stableTime: number = 500
): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });

  let lastBox = await element.boundingBox();
  const startTime = Date.now();

  while (Date.now() - startTime < stableTime) {
    await page.waitForTimeout(50);
    const currentBox = await element.boundingBox();

    if (
      !lastBox ||
      !currentBox ||
      lastBox.x !== currentBox.x ||
      lastBox.y !== currentBox.y ||
      lastBox.width !== currentBox.width ||
      lastBox.height !== currentBox.height
    ) {
      // Position or size changed, reset timer
      lastBox = currentBox;
      startTime = Date.now();
    }
  }
}

/**
 * Wait for editor content to be loaded
 *
 * @param page - The Playwright page object
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForEditorReady(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  // Wait for editor container
  await page.waitForSelector('.editor-container', {
    state: 'visible',
    timeout,
  });

  // Wait for editor to be initialized
  await page.waitForFunction(
    () => {
      return (window as any).editorInitialized === true;
    },
    { timeout }
  );
}

/**
 * Wait for save operation to complete
 *
 * @param page - The Playwright page object
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForSaveComplete(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  // Wait for save indicator to appear
  const saveIndicator = page.locator('[data-status="saving"]');

  // Wait for it to disappear (save complete)
  await saveIndicator.waitFor({ state: 'hidden', timeout });
}

/**
 * Wait for a spinner or loading indicator to disappear
 *
 * @param page - The Playwright page object
 * @param selector - CSS selector of the loading indicator
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForLoadingComplete(
  page: Page,
  selector: string = '.loading-spinner',
  timeout: number = 10000
): Promise<void> {
  const loadingIndicator = page.locator(selector);

  // Wait for it to be hidden
  await loadingIndicator.waitFor({ state: 'hidden', timeout });
}

/**
 * Wait for multiple conditions to be true
 *
 * @param conditions - Array of condition functions
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForConditions(
  conditions: (() => Promise<boolean>)[],
  timeout: number = 5000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const results = await Promise.all(conditions.map((fn) => fn()));

    if (results.every((result) => result === true)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('Timeout waiting for conditions');
}

/**
 * Wait for network requests to be idle
 *
 * @param page - The Playwright page object
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for specific number of elements to appear
 *
 * @param page - The Playwright page object
 * @param selector - CSS selector
 * @param count - Expected number of elements
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForElementCount(
  page: Page,
  selector: string,
  count: number,
  timeout: number = 5000
): Promise<void> {
  await page.waitForFunction(
    ({ sel, expectedCount }) => {
      const elements = document.querySelectorAll(sel);
      return elements.length === expectedCount;
    },
    { sel: selector, expectedCount: count },
    { timeout }
  );
}

/**
 * Verify file content matches expected content
 *
 * @param filePath - Path to the file
 * @param expectedContent - Expected content (string or regex)
 * @returns True if content matches
 */
export async function verifyFileContent(
  filePath: string,
  expectedContent: string | RegExp
): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    if (typeof expectedContent === 'string') {
      return content.includes(expectedContent);
    } else {
      return expectedContent.test(content);
    }
  } catch {
    return false;
  }
}

/**
 * Wait for dialog to appear
 *
 * @param page - The Playwright page object
 * @param dialogSelector - CSS selector of the dialog
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForDialog(
  page: Page,
  dialogSelector: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(dialogSelector, {
    state: 'visible',
    timeout,
  });
}

/**
 * Wait for toast/notification message
 *
 * @param page - The Playwright page object
 * @param message - Expected message text
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForNotification(
  page: Page,
  message: string,
  timeout: number = 5000
): Promise<void> {
  const notification = page.locator('.notification, .toast');
  await notification.waitFor({ state: 'visible', timeout });

  await expect(notification).toContainText(message);
}

/**
 * Poll a condition until it's true
 *
 * @param condition - Function that returns a promise of boolean
 * @param options - Polling options
 */
export async function pollUntil(
  condition: () => Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 100,
    errorMessage = 'Timeout waiting for condition',
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(errorMessage);
}

/**
 * Retry an operation with exponential backoff
 *
 * @param operation - The operation to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelay - Initial delay in milliseconds
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

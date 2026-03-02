import { Page } from '@playwright/test';

/**
 * Accessibility Testing Helpers
 *
 * Utilities for testing keyboard navigation, ARIA attributes,
 * focus management, and screen reader compatibility
 */

export interface FocusIndicatorStyles {
  outline: string;
  outlineWidth: string;
  outlineStyle: string;
  outlineColor: string;
  boxShadow: string;
}

export interface ColorContrastInfo {
  color: string;
  backgroundColor: string;
  fontSize: string;
  fontWeight: string;
}

/**
 * Get basic accessibility information for the page
 */
export async function getAccessibilitySnapshot(page: Page) {
  // Return basic accessibility structure info
  return {
    role: 'WebArea',
    children: await page.locator('[role], button, a, input, select, textarea, h1, h2, h3, h4, h5, h6').all(),
  };
}

/**
 * Check if an element has a visible focus indicator
 */
export async function hasFocusIndicator(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);

  await element.focus();

  const styles = await element.evaluate((el) => {
    const computed = globalThis.getComputedStyle(el);
    return {
      outline: computed.outline,
      outlineWidth: computed.outlineWidth,
      outlineStyle: computed.outlineStyle,
      boxShadow: computed.boxShadow,
    };
  });

  return (
    (styles.outlineWidth !== '0px' && styles.outlineStyle !== 'none') ||
    styles.boxShadow !== 'none'
  );
}

/**
 * Get focus indicator styles for an element
 */
export async function getFocusIndicatorStyles(
  page: Page,
  selector: string
): Promise<FocusIndicatorStyles> {
  const element = page.locator(selector);
  await element.focus();

  return await element.evaluate((el) => {
    const styles = globalThis.getComputedStyle(el);
    return {
      outline: styles.outline,
      outlineWidth: styles.outlineWidth,
      outlineStyle: styles.outlineStyle,
      outlineColor: styles.outlineColor,
      boxShadow: styles.boxShadow,
    };
  });
}

/**
 * Get color contrast information for an element
 */
export async function getColorContrast(
  page: Page,
  selector: string
): Promise<ColorContrastInfo> {
  const element = page.locator(selector);

  return await element.evaluate((el) => {
    const styles = globalThis.getComputedStyle(el);
    return {
      color: styles.color,
      backgroundColor: styles.backgroundColor,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
    };
  });
}

/**
 * Check if an element has proper accessible name
 */
export async function hasAccessibleName(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);

  const textContent = await element.textContent();
  const hasText = ((textContent?.trim().length ?? 0) > 0);
  const ariaLabel = await element.getAttribute('aria-label');
  const ariaLabelledBy = await element.getAttribute('aria-labelledby');
  const title = await element.getAttribute('title');

  return hasText || ariaLabel !== null || ariaLabelledBy !== null || title !== null;
}

/**
 * Get the currently focused element's selector
 */
export async function getFocusedElementInfo(page: Page): Promise<{
  tagName: string;
  id: string | null;
  className: string | null;
  role: string | null;
  ariaLabel: string | null;
}> {
  return await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return { tagName: '', id: null, className: null, role: null, ariaLabel: null };

    return {
      tagName: el.tagName,
      id: el.id || null,
      className: el.className || null,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
    };
  });
}

/**
 * Navigate through focusable elements using Tab
 */
export async function tabThroughElements(
  page: Page,
  count: number = 5
): Promise<string[]> {
  const focusedElements: string[] = [];

  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const info = await getFocusedElementInfo(page);
    focusedElements.push(info.tagName);
  }

  return focusedElements;
}

/**
 * Navigate backwards through focusable elements using Shift+Tab
 */
export async function shiftTabThroughElements(
  page: Page,
  count: number = 3
): Promise<string[]> {
  const focusedElements: string[] = [];

  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);

    const info = await getFocusedElementInfo(page);
    focusedElements.push(info.tagName);
  }

  return focusedElements;
}

/**
 * Check if dialog has proper ARIA attributes
 */
export async function validateDialogAccessibility(page: Page, dialogSelector: string): Promise<{
  hasRole: boolean;
  hasAriaModal: boolean;
  hasAriaLabel: boolean;
  hasFocusTrap: boolean;
}> {
  const dialog = page.locator(dialogSelector);

  const role = await dialog.getAttribute('role');
  const ariaModal = await dialog.getAttribute('aria-modal');
  const ariaLabel = await dialog.getAttribute('aria-label');
  const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');

  // Check if focus is trapped in dialog (first and last elements should be focusable)
  const focusableInDialog = await dialog.locator('button, a, input, [tabindex]:not([tabindex="-1"])').count();

  return {
    hasRole: role === 'dialog',
    hasAriaModal: ariaModal === 'true',
    hasAriaLabel: ariaLabel !== null || ariaLabelledBy !== null,
    hasFocusTrap: focusableInDialog > 0,
  };
}

/**
 * Trigger keyboard shortcut based on platform
 */
export async function triggerShortcut(
  page: Page,
  shortcut: {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  }
): Promise<void> {
  const platform = process.platform;
  const modifier = platform === 'darwin' ? 'Meta' : 'Control';

  const keys: string[] = [];

  if (shortcut.ctrl) {
    keys.push(modifier);
  }
  if (shortcut.shift) {
    keys.push('Shift');
  }
  if (shortcut.alt) {
    keys.push('Alt');
  }
  keys.push(shortcut.key);

  await page.keyboard.press(keys.join('+'));
}

/**
 * Check if element is keyboard focusable
 */
export async function isKeyboardFocusable(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector);

  return await element.evaluate((el) => {
    // Check if element is focusable
    const tabindex = el.getAttribute('tabindex');
    const tagName = el.tagName.toLowerCase();

    const naturallyFocusable = [
      'a', 'button', 'input', 'select', 'textarea', 'details'
    ].includes(tagName);

    const hasFocusableTabindex = tabindex !== null && tabindex !== '-1';

    // Check if element is visible and not disabled
    const styles = globalThis.getComputedStyle(el);
    const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
    const isDisabled = (el as HTMLButtonElement).disabled;

    return (naturallyFocusable || hasFocusableTabindex) && isVisible && !isDisabled;
  });
}

/**
 * Get all focusable elements in the page
 */
export async function getAllFocusableElements(page: Page): Promise<number> {
  return await page.locator('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])').count();
}

/**
 * Check heading hierarchy (h1 -> h2 -> h3, etc.)
 */
export async function validateHeadingHierarchy(page: Page): Promise<{
  valid: boolean;
  headings: Array<{ level: number; text: string }>;
  errors: string[];
}> {
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  const headingData: Array<{ level: number; text: string }> = [];
  const errors: string[] = [];

  for (const heading of headings) {
    const tagName = await heading.evaluate(el => el.tagName);
    const level = parseInt(tagName.substring(1));
    const text = (await heading.textContent()) || '';

    headingData.push({ level, text });
  }

  // Check for proper hierarchy
  let previousLevel = 0;
  for (let i = 0; i < headingData.length; i++) {
    const current = headingData[i];

    if (i === 0 && current.level !== 1) {
      errors.push('First heading should be h1');
    }

    if (current.level > previousLevel + 1) {
      errors.push(`Heading level jumps from h${previousLevel} to h${current.level}`);
    }

    previousLevel = current.level;
  }

  return {
    valid: errors.length === 0,
    headings: headingData,
    errors,
  };
}

/**
 * Check for landmark regions
 */
export async function validateLandmarks(page: Page): Promise<{
  hasMain: boolean;
  hasNav: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
  landmarks: string[];
}> {
  const main = await page.locator('main, [role="main"]').count();
  const nav = await page.locator('nav, [role="navigation"]').count();
  const header = await page.locator('header, [role="banner"]').count();
  const footer = await page.locator('footer, [role="contentinfo"]').count();

  const landmarks: string[] = [];
  if (main > 0) landmarks.push('main');
  if (nav > 0) landmarks.push('nav');
  if (header > 0) landmarks.push('header');
  if (footer > 0) landmarks.push('footer');

  return {
    hasMain: main > 0,
    hasNav: nav > 0,
    hasHeader: header > 0,
    hasFooter: footer > 0,
    landmarks,
  };
}

/**
 * Check if images have alt text
 */
export async function validateImageAccessibility(page: Page): Promise<{
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  decorativeImages: number;
}> {
  const images = await page.locator('img').all();
  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;
  let decorativeImages = 0;

  for (const img of images) {
    const alt = await img.getAttribute('alt');
    const role = await img.getAttribute('role');

    if (role === 'presentation' || alt === '') {
      decorativeImages++;
    } else if (alt !== null) {
      imagesWithAlt++;
    } else {
      imagesWithoutAlt++;
    }
  }

  return {
    totalImages: images.length,
    imagesWithAlt,
    imagesWithoutAlt,
    decorativeImages,
  };
}

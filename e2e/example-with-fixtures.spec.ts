import { test, expect } from './utils/fixtures';

/**
 * Example tests using custom fixtures
 *
 * These tests demonstrate how to use the custom Electron fixtures
 * which automatically handle app lifecycle (launch/close).
 *
 * This approach is cleaner and reduces boilerplate compared to
 * manually managing the app in beforeEach/afterEach hooks.
 */

test.describe('Example with Fixtures', () => {
  test('should have app automatically launched', async ({ electronApp }) => {
    const { window } = electronApp;

    // The app is already launched and ready!
    // No need for beforeEach/afterEach

    await expect(window.locator('#root')).toBeVisible();
  });

  test('should access window properties', async ({ electronApp }) => {
    const { window } = electronApp;

    const title = await window.title();
    expect(title).toBeTruthy();

    const url = window.url();
    expect(url).toBeTruthy();
  });

  test('should perform UI interactions', async ({ electronApp }) => {
    const { window } = electronApp;

    // Wait for and interact with UI elements
    const root = window.locator('#root');
    await expect(root).toBeVisible();

    // Example: Check if root has content
    const hasContent = await root.evaluate((el) => el.children.length > 0);
    expect(hasContent).toBe(true);
  });
});

test.describe('Multiple Tests with Same Setup', () => {
  // Each test gets a fresh app instance automatically
  // No shared state between tests

  test('test 1', async ({ electronApp }) => {
    const { window } = electronApp;
    await expect(window.locator('#root')).toBeVisible();
  });

  test('test 2', async ({ electronApp }) => {
    const { window } = electronApp;
    const title = await window.title();
    expect(title).toBeTruthy();
  });

  test('test 3', async ({ electronApp }) => {
    const { window } = electronApp;
    const size = await window.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    expect(size.width).toBeGreaterThan(0);
  });
});

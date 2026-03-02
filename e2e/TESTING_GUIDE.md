# E2E Testing Quick Guide

Quick reference for writing Playwright E2E tests for the Electron app.

## Quick Start

1. Build the app: `npm run build:dir`
2. Run tests: `npm run test:e2e`
3. Debug: `npm run test:e2e:debug`

## Test Patterns

### Pattern 1: Using Fixtures (Recommended)

```typescript
import { test, expect } from './utils/fixtures';

test('my test', async ({ electronApp }) => {
  const { window } = electronApp;
  // App is already launched and ready!
  await expect(window.locator('#my-element')).toBeVisible();
});
```

**Pros**: Automatic lifecycle management, less boilerplate
**Use when**: Writing standard tests

### Pattern 2: Manual Lifecycle

```typescript
import { test, expect } from '@playwright/test';
import { launchElectronApp, closeElectronApp } from './utils/electron-helpers';

test('my test', async () => {
  const { app, window } = await launchElectronApp();
  try {
    // Your test code
  } finally {
    await closeElectronApp(app);
  }
});
```

**Pros**: Full control over app lifecycle
**Use when**: Need custom launch options or complex setup

### Pattern 3: Shared Context with Hooks

```typescript
import { test, expect } from '@playwright/test';
import { launchElectronApp, closeElectronApp, ElectronTestContext } from './utils/electron-helpers';

test.describe('Feature Tests', () => {
  let context: ElectronTestContext;

  test.beforeEach(async () => {
    context = await launchElectronApp();
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeElectronApp(context.app);
    }
  });

  test('test 1', async () => {
    const { window } = context;
    // Use window
  });

  test('test 2', async () => {
    const { window } = context;
    // Use window
  });
});
```

**Pros**: Reduce duplication across related tests
**Use when**: Multiple tests need identical setup

## Common Tasks

### Wait for Element

```typescript
// Wait for element to be visible
await window.locator('#my-element').waitFor({ state: 'visible' });

// Wait with timeout
await window.locator('#my-element').waitFor({
  state: 'visible',
  timeout: 5000,
});
```

### Click and Type

```typescript
// Click element
await window.locator('button#submit').click();

// Type text
await window.locator('input#name').fill('John Doe');

// Press keys
await window.keyboard.press('Enter');
await window.keyboard.press('Control+S');
```

### Assertions

```typescript
// Element visibility
await expect(window.locator('#element')).toBeVisible();
await expect(window.locator('#element')).toBeHidden();

// Text content
await expect(window.locator('#title')).toHaveText('Welcome');
await expect(window.locator('#title')).toContainText('Wel');

// Attributes
await expect(window.locator('button')).toHaveAttribute('disabled', '');
await expect(window.locator('input')).toHaveValue('test');

// Count
await expect(window.locator('.item')).toHaveCount(5);
```

### Screenshots

```typescript
// Full page
await window.screenshot({ path: 'screenshot.png', fullPage: true });

// Element only
await window.locator('#element').screenshot({ path: 'element.png' });

// Using helper
import { takeScreenshot } from './utils/electron-helpers';
await takeScreenshot(window, 'my-test');
```

### Execute JavaScript

```typescript
// Get data
const data = await window.evaluate(() => {
  return {
    title: document.title,
    width: window.innerWidth,
  };
});

// Modify DOM
await window.evaluate(() => {
  document.body.style.backgroundColor = 'red';
});

// Pass arguments
const result = await window.evaluate((arg) => {
  return arg * 2;
}, 5); // result = 10
```

### Access Electron APIs

```typescript
import { getAppVersion, getUserDataPath, getAppPath } from './utils/electron-helpers';

const { app } = electronApp;

// Get version
const version = await getAppVersion(app);

// Get paths
const userDataPath = await getUserDataPath(app);
const appPath = await getAppPath(app);

// Evaluate in main process
const result = await app.evaluate(async ({ app }) => {
  return app.getName();
});
```

## Selectors

### CSS Selectors

```typescript
window.locator('#id')              // By ID
window.locator('.class')           // By class
window.locator('button')           // By tag
window.locator('[data-test="x"]')  // By attribute
window.locator('div > button')     // Descendant
```

### Text Selectors

```typescript
window.locator('text=Click me')    // Exact text
window.locator('text=/submit/i')   // Regex
window.getByText('Click me')       // Built-in
window.getByRole('button', { name: 'Submit' })
```

### Chaining

```typescript
window
  .locator('.container')
  .locator('button')
  .first()
  .click();
```

## Debugging

### Visual Debugging

```bash
npm run test:e2e:headed  # See the browser
npm run test:e2e:debug   # Playwright Inspector
```

### Pause Execution

```typescript
await window.pause();  // Opens Playwright Inspector
```

### Console Output

```typescript
// Listen to browser console
window.on('console', msg => {
  console.log(`BROWSER: ${msg.text()}`);
});

// Listen to page errors
window.on('pageerror', err => {
  console.error('PAGE ERROR:', err);
});
```

### Slow Motion

```typescript
const { app, window } = await launchElectronApp();
// Add artificial delay between actions for debugging
await window.waitForTimeout(1000);
```

## Best Practices

### ✅ Do

- Use semantic selectors (`getByRole`, `getByText`)
- Wait for conditions, not fixed timeouts
- Keep tests independent
- Use fixtures for common setup
- Take screenshots on important steps
- Test user workflows, not implementation

### ❌ Don't

- Use `waitForTimeout()` unless absolutely necessary
- Share state between tests
- Use fragile selectors (nth-child, complex CSS)
- Test internal implementation details
- Leave console.log in committed code
- Make tests dependent on execution order

## Troubleshooting

### App won't launch

```bash
# Rebuild the app
npm run build:dir

# Check if main.js exists
ls dist-electron/main.js

# Verify Electron installed
npm ls electron
```

### Test timeouts

```typescript
// Increase timeout for specific test
test('slow test', async ({ electronApp }) => {
  test.setTimeout(60000);
  // test code
});

// Or globally in playwright.config.ts
timeout: 60 * 1000
```

### Flaky tests

```typescript
// Use proper waits
await window.locator('#element').waitFor({ state: 'visible' });

// Not this
await window.waitForTimeout(1000);

// Increase retries in CI
// Set in playwright.config.ts:
retries: process.env.CI ? 2 : 0
```

### Element not found

```typescript
// Check if element exists
const exists = await window.locator('#element').count() > 0;

// Wait for element with better error
await expect(window.locator('#element')).toBeVisible({
  timeout: 10000,
});

// Debug: take screenshot
await window.screenshot({ path: 'debug.png' });
```

## Resources

- [Playwright Docs](https://playwright.dev)
- [Playwright API](https://playwright.dev/docs/api/class-playwright)
- [Electron Testing](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- Project README: `e2e/README.md`

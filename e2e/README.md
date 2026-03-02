# E2E Testing with Playwright

End-to-end testing infrastructure for the Electron Book Publishing App using Playwright.

## Overview

This directory contains E2E tests that verify the application works correctly from a user's perspective. Tests launch the actual Electron application and interact with it through Playwright.

## Prerequisites

Before running E2E tests:

1. **Build the application**:
   ```bash
   npm run build:dir
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

## Running Tests

### All tests (headless mode)
```bash
npm run test:e2e
```

### With visible window (headed mode)
```bash
npm run test:e2e:headed
```

### Debug mode with Playwright Inspector
```bash
npm run test:e2e:debug
```

### View HTML test report
```bash
npm run test:e2e:report
```

### Run specific test file
```bash
npx playwright test e2e/app.spec.ts
```

### Run tests with specific tag
```bash
npx playwright test --grep @smoke
```

## Directory Structure

```
e2e/
├── README.md                 # This file
├── app.spec.ts              # Basic application lifecycle tests
└── utils/
    └── electron-helpers.ts  # Utility functions for Electron testing
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import {
  launchElectronApp,
  closeElectronApp,
  waitForAppReady,
} from './utils/electron-helpers';

test.describe('My Feature', () => {
  test('should do something', async () => {
    // Launch the app
    const { app, window } = await launchElectronApp();

    // Wait for app to be ready
    await waitForAppReady(window);

    // Your test code here
    await expect(window.locator('#my-element')).toBeVisible();

    // Clean up
    await closeElectronApp(app);
  });
});
```

### Using beforeEach/afterEach Hooks

For tests that need the same setup:

```typescript
test.describe('My Feature Suite', () => {
  let context: ElectronTestContext;

  test.beforeEach(async () => {
    context = await launchElectronApp();
    await waitForAppReady(context.window);
  });

  test.afterEach(async () => {
    if (context?.app) {
      await closeElectronApp(context.app);
    }
  });

  test('test 1', async () => {
    const { window } = context;
    // Your test...
  });

  test('test 2', async () => {
    const { window } = context;
    // Your test...
  });
});
```

## Available Helper Functions

The `utils/electron-helpers.ts` file provides:

### Core Functions

- **`launchElectronApp(options?)`** - Launch the Electron app with optional configuration
- **`closeElectronApp(app)`** - Gracefully close the app
- **`waitForAppReady(window, options?)`** - Wait for app to be fully loaded
- **`restartElectronApp(app, options?)`** - Restart the app (useful for persistence tests)

### Information Functions

- **`getAppPath(app)`** - Get the application path
- **`getUserDataPath(app)`** - Get user data directory path
- **`getAppVersion(app)`** - Get the app version

### Utility Functions

- **`takeScreenshot(window, name, options?)`** - Take named screenshots
- **`waitForIpcEvent(window, eventName, timeout?)`** - Wait for IPC events
- **`clearUserData(app)`** - Clear user data (for clean state tests)

### Launch Options

```typescript
const { app, window } = await launchElectronApp({
  env: { CUSTOM_VAR: 'value' },
  mainPath: '/custom/path/to/main.js',
  args: ['--additional-arg'],
  timeout: 60000,
});
```

## Test Organization

### Naming Conventions

- Test files: `*.spec.ts`
- Test descriptions: Use clear, descriptive names
- Group related tests with `test.describe()`

### Example Structure

```typescript
test.describe('Feature Name', () => {
  test.describe('Sub-feature', () => {
    test('should do X when Y happens', async () => {
      // test code
    });
  });
});
```

## Debugging

### Visual Debugging

```bash
# Run with visible browser
npm run test:e2e:headed

# Run with Playwright Inspector
npm run test:e2e:debug
```

### Pause Execution

Add to your test:
```typescript
await window.pause();
```

### Screenshots

```typescript
// Manual screenshot
await window.screenshot({ path: 'debug.png' });

// Using helper
await takeScreenshot(window, 'my-test-screenshot');
```

### Console Logs

```typescript
window.on('console', msg => console.log('BROWSER LOG:', msg.text()));
```

## Configuration

The main Playwright configuration is in `playwright.config.ts` at the project root.

Key configurations:
- **Test directory**: `./e2e`
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries in CI, 0 locally
- **Reporters**: HTML, List, JSON
- **Artifacts**: Screenshots and videos on failure

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build app
  run: npm run build:dir

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

### Environment Variables

- `CI=true` - Enables CI mode (more retries, single worker)
- `NODE_ENV=test` - Set automatically when launching app

## Test Results

After running tests:

- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **Screenshots**: `test-results/*.png`
- **Videos**: `test-results/*.webm`

## Best Practices

1. **Always clean up**: Use `afterEach` to close the app
2. **Wait for ready state**: Use `waitForAppReady()` before interacting
3. **Use descriptive names**: Make test failures easy to understand
4. **Keep tests independent**: Don't rely on test execution order
5. **Test user scenarios**: Focus on real user workflows
6. **Use Page Object Model**: For complex UIs, create page objects
7. **Avoid hard-coded waits**: Use `waitFor*` methods instead of `waitForTimeout`
8. **Take screenshots on key steps**: Helps with debugging failures

## Common Issues

### App fails to launch

- Ensure the app is built: `npm run build:dir`
- Check that `dist-electron/main.js` exists
- Verify Electron is installed: `npm ls electron`

### Tests timeout

- Increase timeout in test: `test.setTimeout(60000)`
- Check if app is starting properly
- Look for console errors in the app

### Flaky tests

- Add proper wait conditions
- Use `waitForAppReady()` before interactions
- Increase retries in CI configuration
- Check for race conditions

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- [Playwright Electron API](https://playwright.dev/docs/api/class-electron)

## Support

For issues or questions:
1. Check the test output and screenshots in `test-results/`
2. Run with `--debug` flag for interactive debugging
3. Review the Playwright HTML report
4. Check the main application logs

# E2E Testing with Playwright

This directory contains end-to-end (E2E) tests for the Electron application using Playwright.

## Prerequisites

Before running E2E tests, ensure you have:
1. Built the application: `npm run build:dir`
2. Installed dependencies: `npm install`

## Running Tests

### Run all tests (headless)
```bash
npm run test:e2e
```

### Run tests with visible browser (headed mode)
```bash
npm run test:e2e:headed
```

### Debug tests interactively
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { launchElectronApp, closeElectronApp } from './helpers/electron';

test('my test', async () => {
  const { app, window } = await launchElectronApp();

  // Your test code here
  await expect(window.locator('#root')).toBeVisible();

  await closeElectronApp(app);
});
```

### Using Helper Functions

The `helpers/electron.ts` file provides utility functions for:
- `launchElectronApp()`: Launch the Electron app
- `closeElectronApp(app)`: Close the app gracefully
- `restartElectronApp(app)`: Restart the app
- `waitForAppReady(window)`: Wait for app initialization
- `getAppPath(app)`: Get app path for file operations
- `getUserDataPath(app)`: Get user data directory

## Test Organization

- `app.spec.ts`: Basic application lifecycle tests
- Add more test files as needed (e.g., `features.spec.ts`, `ui.spec.ts`)

## Configuration

The Playwright configuration is defined in `playwright.config.ts` at the project root. It includes:
- Electron-specific launch options
- HTML reporter for test results
- Screenshot and video capture on failure
- Test timeout and retry settings

## Debugging

1. Use `test:e2e:debug` to run tests in debug mode
2. Add `await window.pause()` in your test to pause execution
3. Use `await window.screenshot({ path: 'debug.png' })` to capture screenshots
4. Check `test-results/` directory for screenshots and videos on failure

## CI/CD Integration

For CI environments:
- Tests run with 2 retries automatically
- Workers are limited to 1 for stability
- Use `test:e2e` command in your CI pipeline

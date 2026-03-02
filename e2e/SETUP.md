# Playwright E2E Testing Setup

This document describes the complete Playwright E2E testing infrastructure for the Electron Book Publishing App.

## Infrastructure Overview

The E2E testing infrastructure consists of:

1. **Playwright Configuration** (`playwright.config.ts`)
2. **Test Directory Structure** (`e2e/`)
3. **Test Utilities** (`e2e/utils/`)
4. **Example Tests** (`e2e/*.spec.ts`)
5. **NPM Scripts** (in `package.json`)

## Directory Structure

```
e2e/
├── README.md                    # Comprehensive testing documentation
├── TESTING_GUIDE.md             # Quick reference and patterns
├── SETUP.md                     # This file
├── tsconfig.json                # TypeScript config for E2E tests
├── app.spec.ts                  # Basic application lifecycle tests
├── example-with-fixtures.spec.ts # Example using custom fixtures
└── utils/
    ├── electron-helpers.ts      # Core utility functions
    └── fixtures.ts              # Custom Playwright fixtures
```

## Configuration Details

### playwright.config.ts

Located at project root, configured with:

- **Test directory**: `./e2e`
- **Timeout**: 30 seconds per test
- **Expect timeout**: 5 seconds
- **Parallel execution**: Enabled
- **Retries**: 2 in CI, 0 locally
- **Workers**: 1 in CI, auto locally
- **Reporters**:
  - HTML report (`playwright-report/`)
  - List output to console
  - JSON results (`test-results/results.json`)
- **Artifacts**:
  - Screenshots on failure
  - Videos on failure
  - Traces on retry

### package.json Scripts

The following npm scripts are configured:

```json
{
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report"
}
```

## Test Utilities

### electron-helpers.ts

Core utilities for Electron app testing:

**Launch & Lifecycle:**
- `launchElectronApp(options?)` - Launch the app with custom options
- `closeElectronApp(app)` - Gracefully close the app
- `restartElectronApp(app, options?)` - Restart the app
- `waitForAppReady(window, options?)` - Wait for full initialization

**Information:**
- `getAppPath(app)` - Get application path
- `getUserDataPath(app)` - Get user data directory
- `getAppVersion(app)` - Get app version

**Utilities:**
- `takeScreenshot(window, name, options?)` - Take named screenshots
- `waitForIpcEvent(window, eventName, timeout?)` - Wait for IPC events
- `clearUserData(app)` - Clear user data for clean tests

**Types:**
- `ElectronTestContext` - Interface with `app` and `window`
- `LaunchOptions` - Configuration for app launch

### fixtures.ts

Custom Playwright fixtures for simplified testing:

- `test` - Extended test with auto-managed Electron app
- `expect` - Re-exported from Playwright
- `testManual` - Base test without fixtures for manual control

**Benefits of using fixtures:**
- Automatic app lifecycle management
- Less boilerplate code
- Consistent setup across tests
- Automatic cleanup even if test fails

## Prerequisites

Before running E2E tests:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the Electron app**:
   ```bash
   npm run build:dir
   ```

   This creates `dist-electron/main.js` which is required for tests.

3. **Verify Playwright installation**:
   ```bash
   npx playwright --version
   ```

## Running Tests

### Basic Commands

```bash
# Run all tests (headless)
npm run test:e2e

# Run with browser visible
npm run test:e2e:headed

# Debug with Playwright Inspector
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

### Advanced Commands

```bash
# Run specific test file
npx playwright test e2e/app.spec.ts

# Run tests matching pattern
npx playwright test --grep "should launch"

# Run with specific reporter
npx playwright test --reporter=dot

# Run in UI mode
npx playwright test --ui

# Update snapshots (if using visual regression)
npx playwright test --update-snapshots
```

## Writing Your First Test

### Option 1: Using Fixtures (Recommended)

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from './utils/fixtures';

test.describe('My Feature', () => {
  test('should work correctly', async ({ electronApp }) => {
    const { window } = electronApp;

    // App is already launched and ready!
    await expect(window.locator('#my-element')).toBeVisible();

    // No need to close - handled automatically
  });
});
```

### Option 2: Manual Control

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import {
  launchElectronApp,
  closeElectronApp,
  waitForAppReady,
} from './utils/electron-helpers';

test('my test', async () => {
  const { app, window } = await launchElectronApp();

  await waitForAppReady(window);

  // Your test code here

  await closeElectronApp(app);
});
```

## CI/CD Integration

### Environment Variables

- `CI=true` - Enables CI mode (2 retries, 1 worker)
- `NODE_ENV=test` - Automatically set when launching app

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

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

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: test-results/
```

## Test Artifacts

After running tests, the following artifacts are generated:

```
test-results/          # Screenshots, videos, traces
playwright-report/     # HTML report
  └── index.html
```

These are in `.gitignore` and should not be committed.

## Debugging Tips

### 1. Visual Debugging

```bash
# See the browser in action
npm run test:e2e:headed

# Use Playwright Inspector
npm run test:e2e:debug
```

### 2. Pause Execution

Add to your test:
```typescript
await window.pause();
```

### 3. Screenshots

```typescript
await window.screenshot({ path: 'debug.png' });
```

### 4. Console Output

```typescript
window.on('console', msg => console.log('BROWSER:', msg.text()));
window.on('pageerror', err => console.error('ERROR:', err));
```

### 5. Trace Viewer

```bash
# After a failed test with trace
npx playwright show-trace test-results/trace.zip
```

## Common Issues

### Issue: "Cannot find module 'electron'"

**Solution**: Install dependencies
```bash
npm install
```

### Issue: "Error: spawn ENOENT main.js"

**Solution**: Build the app first
```bash
npm run build:dir
```

### Issue: Tests timeout

**Solution**:
- Check if app is building correctly
- Increase timeout in test
- Look for errors in test-results/

### Issue: Flaky tests

**Solution**:
- Use proper waits (`waitFor`) instead of `waitForTimeout`
- Ensure app is ready with `waitForAppReady()`
- Check for race conditions
- Increase retries in CI

## Best Practices Summary

1. **Use fixtures** for common setup
2. **Wait for conditions**, not timeouts
3. **Keep tests independent** - no shared state
4. **Test user workflows**, not implementation
5. **Use semantic selectors** when possible
6. **Take screenshots** at key points
7. **Clean up** resources (though fixtures handle this)
8. **Run tests locally** before pushing

## Migration from tests/e2e

If you have existing tests in `tests/e2e`, migrate them to `e2e/`:

1. Move test files to `e2e/`
2. Update imports to use `./utils/` instead of `./helpers/`
3. Consider using fixtures for simpler tests
4. Update any hardcoded paths

## Next Steps

1. **Write tests for your features**
2. **Integrate into CI/CD pipeline**
3. **Add visual regression testing** (optional)
4. **Create page objects** for complex UIs
5. **Add performance tests** (optional)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- `e2e/README.md` - Detailed usage guide
- `e2e/TESTING_GUIDE.md` - Quick reference

## Support

For questions or issues:
1. Check the documentation in `e2e/README.md`
2. Review example tests in `e2e/`
3. Check test output and artifacts
4. Consult Playwright documentation

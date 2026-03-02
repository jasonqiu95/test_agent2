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

### Run specific test file
```bash
# Run only import flow tests
npx playwright test import-flow

# Run only basic app tests
npx playwright test app
```

### Run tests with visible browser (headed mode)
```bash
npm run test:e2e:headed

# Or for specific tests
npx playwright test import-flow --headed
```

### Debug tests interactively
```bash
npm run test:e2e:debug

# Or debug specific tests
npx playwright test import-flow --debug
```

### View test report
```bash
npm run test:e2e:report
```

### View screenshots and videos
After running tests, check:
- `test-results/` - Screenshots captured during test execution
- `playwright-report/` - HTML report with test results and artifacts

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
- `import-flow.spec.ts`: Complete user flow for creating projects and importing DOCX files
  - Tests new project creation
  - DOCX file import with chapter detection
  - Import preview dialog interactions
  - Chapter verification in navigator
  - Includes screenshots at each step
- `helpers/`: Utility functions for test setup and teardown
- `fixtures/`: Test data files (DOCX samples, etc.)

## Configuration

The Playwright configuration is defined in `playwright.config.ts` at the project root. It includes:
- Electron-specific launch options
- HTML reporter for test results
- Screenshot and video capture on failure (with full-page screenshots)
- Video recording at 1280x720 resolution
- Test timeout and retry settings

## Test Features

### Import Flow Tests (`import-flow.spec.ts`)

The import flow test suite comprehensively tests the complete user journey:

1. **App Launch**: Verifies the Electron app starts successfully
2. **Welcome Screen**: Validates UI elements and action buttons
3. **New Project Creation**: Tests blank project initialization
4. **Document Import**:
   - File selection dialog handling
   - DOCX parsing and chapter detection
   - Import preview dialog with chapter cards
5. **Preview Interactions**:
   - Chapter selection/deselection
   - Chapter content preview
   - Import statistics display
6. **Import Acceptance**: Completes the import and verifies success
7. **Content Verification**: Validates chapters appear in editor/navigator

**Screenshots**: The test captures 12+ screenshots at each major step, saved to `test-results/`

**Coverage**:
- ✅ Full user workflow end-to-end
- ✅ UI state validation at each step
- ✅ DOCX file parsing with real sample file
- ✅ Chapter detection and preview
- ✅ Import cancellation handling
- ✅ Empty document handling

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

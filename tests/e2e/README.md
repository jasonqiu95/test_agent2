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

## Test Architecture

### Fixtures (`fixtures.ts`)
Custom Playwright fixtures that provide:
- **electronApp**: Automatically launches and closes the Electron app
- **mainWindow**: The main application window, ready for interaction
- **navigatorPage**: Page Object Model for the Navigator panel
- **editorPage**: Page Object Model for the Editor panel
- **previewPage**: Page Object Model for the Preview panel

### Page Object Models (`page-objects/`)
Reusable page objects that encapsulate UI interactions:

#### NavigatorPage
- `isVisible()`: Check if navigator panel is visible
- `toggle()`: Toggle panel visibility
- `getNavigationItems()`: Get list of navigation items
- `clickNavigationItem(text)`: Click on a specific item
- `waitForReady()`: Wait for panel to be ready

#### EditorPage
- `isVisible()`: Check if editor is visible
- `waitForReady()`: Wait for editor to be ready
- `typeText(text)`: Type text into the editor
- `clear()`: Clear editor content
- `getContent()`: Get current text content
- `applyBold()`, `applyItalic()`, `applyUnderline()`: Apply formatting
- `undo()`, `redo()`: Undo/redo operations

#### PreviewPage
- `isVisible()`: Check if preview panel is visible
- `toggle()`: Toggle panel visibility
- `waitForReady()`: Wait for preview to be ready
- `getContent()`: Get preview text content
- `waitForContentUpdate(text)`: Wait for specific content to appear
- `getHeadings()`: Get all heading elements
- `getParagraphs()`: Get all paragraphs
- `waitForDebounce()`: Wait for debounced updates

### Helper Functions (`helpers/electron.ts`)
Utility functions for common test operations:

#### App Lifecycle
- `launchElectronApp(options?)`: Launch the app with custom options
- `closeElectronApp(app)`: Close the app gracefully
- `restartElectronApp(app, options?)`: Restart the app
- `waitForAppReady(window)`: Wait for app to be fully loaded
- `waitForUIReady(window)`: Wait for UI to be ready (no loading indicators)

#### Project Management
- `createNewProject(window)`: Create a new blank project
- `loadTestProject(window, filePath)`: Load a project from file

#### Utility Functions
- `getWindowTitle(window)`: Get the current window title
- `takeScreenshot(window, name)`: Take a named screenshot
- `isWelcomeScreen(window)`: Check if on welcome screen
- `isEditorView(window)`: Check if in editor view
- `pressShortcut(window, shortcut)`: Simulate keyboard shortcut
- `getMemoryUsage(app)`: Get memory usage information

## Writing Tests

### Using Fixtures (Recommended)

```typescript
import { test, expect } from './fixtures';
import { waitForUIReady } from './helpers/electron';

test('should interact with editor', async ({ mainWindow, editorPage }) => {
  await waitForUIReady(mainWindow);
  await editorPage.waitForReady();

  await editorPage.typeText('Hello World');
  const content = await editorPage.getContent();

  expect(content).toContain('Hello World');
});
```

### Testing Multiple Panels

```typescript
import { test, expect } from './fixtures';

test('should synchronize editor and preview', async ({
  mainWindow,
  editorPage,
  previewPage,
}) => {
  await editorPage.waitForReady();
  await previewPage.waitForReady();

  // Type in editor
  await editorPage.typeText('Test content');

  // Wait for preview to update
  await previewPage.waitForDebounce();

  // Verify preview content
  const preview = await previewPage.getContent();
  expect(preview).toContain('Test content');
});
```

### Manual App Launch (Advanced)

```typescript
import { test, expect } from '@playwright/test';
import { launchElectronApp, closeElectronApp, waitForUIReady } from './helpers/electron';

test('custom app launch', async () => {
  const { app, window } = await launchElectronApp({
    clearUserData: true,
    env: { DEBUG: 'true' },
  });

  await waitForUIReady(window);

  // Your test code here

  await closeElectronApp(app);
});
```

## Test Organization

- `app.spec.ts`: Basic application lifecycle tests
- `panels.spec.ts`: Tests for Navigator, Editor, and Preview panels
- `page-objects/`: Page Object Models for UI components
- `helpers/`: Utility functions for common operations
- `fixtures.ts`: Custom Playwright fixtures

## Configuration

The Playwright configuration is in `playwright.config.ts` at the project root:
- **Timeout**: 60 seconds per test
- **Retries**: 2 retries in CI, 0 locally
- **Workers**: 1 in CI, unlimited locally
- **Reporters**: HTML report, JSON output, and list format
- **Screenshots**: On failure
- **Video**: Retained on failure
- **Traces**: On first retry

## Debugging

### Debug Mode
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector for step-by-step debugging.

### Pause Execution
```typescript
await mainWindow.pause();
```

### Screenshots
```typescript
await takeScreenshot(mainWindow, 'debug-state');
// or
await mainWindow.screenshot({ path: 'test-results/debug.png' });
```

### Console Logs
```typescript
import { getConsoleLogs } from './helpers/electron';

const logs = await getConsoleLogs(mainWindow);
console.log('App logs:', logs);
```

### Check Test Results
- Screenshots and videos: `test-results/` directory
- HTML report: `playwright-report/` directory
- View report: `npm run test:e2e:report`

## Best Practices

1. **Use Fixtures**: Prefer the custom fixtures for automatic app lifecycle management
2. **Use Page Objects**: Encapsulate UI interactions in page objects for maintainability
3. **Wait for Ready State**: Always wait for UI to be ready before interactions
4. **Test Isolation**: Each test should be independent and not rely on state from other tests
5. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
6. **Handle Async**: Always await async operations and use proper error handling
7. **Clean Up**: Fixtures handle cleanup automatically, but clean up custom resources

## CI/CD Integration

For CI environments:
- Tests run with 2 retries automatically
- Workers are limited to 1 for stability
- Use `test:e2e` command in your CI pipeline
- Traces are collected on first retry for debugging failures
- JSON results are saved to `test-results/results.json`

### Example CI Configuration

```yaml
- name: Build App
  run: npm run build:dir

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### App won't launch
- Ensure the app is built: `npm run build:dir`
- Check `dist-electron/main.js` exists
- Verify Electron is installed: `npm install`

### Tests are flaky
- Increase timeouts in `playwright.config.ts`
- Add more explicit waits using `waitForUIReady()`
- Check for race conditions in async operations

### Can't find elements
- Use Playwright Inspector to inspect elements: `npm run test:e2e:debug`
- Update selectors in page objects
- Ensure elements are visible before interaction

### Memory issues
- Use `getMemoryUsage()` helper to monitor memory
- Ensure proper cleanup of resources
- Limit parallel test execution with `workers` config

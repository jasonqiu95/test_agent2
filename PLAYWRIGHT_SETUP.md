# Playwright Test Configuration Setup

This document describes the comprehensive Playwright test configuration that has been set up for the Electron book publishing application.

## Overview

The test infrastructure provides a complete end-to-end testing solution with:
- Electron-specific configuration
- Custom fixtures for automatic app lifecycle management
- Page Object Models for the three main panels (Navigator, Editor, Preview)
- Utility functions for common test operations
- Example tests demonstrating best practices

## File Structure

```
tests/e2e/
├── README.md                 # Comprehensive testing documentation
├── fixtures.ts              # Custom Playwright fixtures
├── app.spec.ts              # Basic application lifecycle tests
├── panels.spec.ts           # Tests for the three main panels
├── page-objects/            # Page Object Models
│   ├── index.ts            # Exports all page objects
│   ├── NavigatorPage.ts    # Navigator panel interactions
│   ├── EditorPage.ts       # Editor panel interactions
│   └── PreviewPage.ts      # Preview panel interactions
└── helpers/
    └── electron.ts         # Utility functions for Electron testing

playwright.config.ts         # Playwright configuration at project root
```

## Key Components

### 1. Playwright Configuration (playwright.config.ts)

Enhanced configuration with:
- **Timeout**: 60 seconds per test
- **Retries**: 2 in CI, 0 locally
- **Workers**: 1 in CI, unlimited locally
- **Reporters**: HTML, JSON, and list formats
- **Screenshots/Videos**: Captured on failure
- **Traces**: Collected on first retry

### 2. Custom Fixtures (fixtures.ts)

Provides automatic setup and teardown:
```typescript
export interface ElectronFixtures {
  electronApp: ElectronApplication;    // Auto-launched Electron app
  mainWindow: Page;                    // Main window ready for testing
  navigatorPage: NavigatorPage;        // Navigator panel page object
  editorPage: EditorPage;              // Editor panel page object
  previewPage: PreviewPage;            // Preview panel page object
}
```

### 3. Page Object Models

#### NavigatorPage
Methods for interacting with the document structure navigation panel:
- `isVisible()`: Check visibility
- `toggle()`: Toggle panel on/off
- `getNavigationItems()`: Get all navigation items
- `clickNavigationItem(text)`: Click a specific item
- `waitForReady()`: Wait for panel to be ready
- `expandSection()`, `collapseSection()`: Manage collapsible sections
- `searchItem()`: Search within navigator

#### EditorPage
Methods for interacting with the text editor:
- `isVisible()`: Check visibility
- `waitForReady()`: Wait for editor to be ready
- `typeText(text)`: Type text into editor
- `clear()`: Clear editor content
- `getContent()`: Get current text
- `getHTMLContent()`: Get HTML representation
- `applyBold()`, `applyItalic()`, `applyUnderline()`: Apply formatting
- `insertHeading()`: Insert headings
- `undo()`, `redo()`: Undo/redo operations
- `insertBulletList()`, `insertNumberedList()`: Insert lists
- `hasFocus()`, `focus()`: Manage editor focus

#### PreviewPage
Methods for interacting with the live preview:
- `isVisible()`: Check visibility
- `toggle()`: Toggle panel on/off
- `waitForReady()`: Wait for preview to be ready
- `getContent()`: Get preview text
- `getHTMLContent()`: Get HTML representation
- `waitForContentUpdate(text)`: Wait for specific content
- `getHeadings()`: Get all heading elements
- `getParagraphs()`: Get all paragraphs
- `getListItems()`: Get list items
- `waitForDebounce()`: Wait for debounced updates
- `hasFormattedText()`: Check for formatted text
- `getLinks()`: Get all links

### 4. Utility Functions (helpers/electron.ts)

#### App Lifecycle
- `launchElectronApp(options?)`: Launch with custom options
  - Supports custom args, env variables, timeout
  - Can clear user data before launch
- `closeElectronApp(app)`: Graceful shutdown
- `restartElectronApp(app, options?)`: Restart with new options
- `waitForAppReady(window)`: Wait for DOM ready
- `waitForUIReady(window)`: Wait for all loading indicators

#### Project Management
- `createNewProject(window)`: Create new blank project
- `loadTestProject(window, path)`: Load project from file

#### Testing Utilities
- `getWindowTitle(window)`: Get window title
- `takeScreenshot(window, name)`: Named screenshots
- `isWelcomeScreen(window)`: Check current view
- `isEditorView(window)`: Check current view
- `pressShortcut(window, shortcut)`: Simulate keyboard shortcuts
- `waitForCondition(condition, options)`: Custom wait conditions
- `getMemoryUsage(app)`: Monitor memory usage
- `getConsoleLogs(window)`: Capture console output

## Usage Examples

### Basic Test with Fixtures
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
test('editor and preview sync', async ({
  mainWindow,
  editorPage,
  previewPage,
}) => {
  await editorPage.waitForReady();
  await previewPage.waitForReady();

  await editorPage.typeText('Test content');
  await previewPage.waitForDebounce();

  const preview = await previewPage.getContent();
  expect(preview).toContain('Test content');
});
```

### Custom App Launch
```typescript
import { launchElectronApp, closeElectronApp } from './helpers/electron';

test('custom launch', async () => {
  const { app, window } = await launchElectronApp({
    clearUserData: true,
    env: { DEBUG: 'true' },
    timeout: 45000,
  });

  // Test code here

  await closeElectronApp(app);
});
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Organization

The test suite includes:

1. **app.spec.ts**: Basic application lifecycle tests
   - App launch and window creation
   - Main content visibility
   - Window lifecycle management

2. **panels.spec.ts**: Integration tests for the three main panels
   - Panel visibility and toggling
   - Navigator interactions
   - Editor text input and formatting
   - Preview content and synchronization
   - Panel interaction scenarios

## Best Practices

1. **Always use fixtures** for automatic app lifecycle management
2. **Use page objects** to encapsulate UI interactions
3. **Wait for ready state** before interacting with elements
4. **Test isolation** - each test should be independent
5. **Clear test names** that describe what is being tested
6. **Handle async properly** with proper awaits
7. **Use utility functions** for common operations

## CI/CD Integration

The configuration is optimized for CI environments:
- Automatic retries on failure
- Limited parallelism for stability
- Comprehensive failure diagnostics (screenshots, videos, traces)
- JSON output for integration with CI tools

Example CI workflow:
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

## Next Steps

To start writing tests:

1. **Build the application**: `npm run build:dir`
2. **Review the example tests**: See `app.spec.ts` and `panels.spec.ts`
3. **Use the fixtures**: Import `test` and `expect` from `./fixtures`
4. **Leverage page objects**: Import the page objects you need
5. **Run your tests**: `npm run test:e2e`

## Troubleshooting

### App won't launch
- Ensure app is built: `npm run build:dir`
- Check `dist-electron/main.js` exists
- Verify Electron is installed: `npm install`

### Tests are flaky
- Increase timeouts in config
- Add explicit waits with `waitForUIReady()`
- Check for race conditions

### Can't find elements
- Use debug mode: `npm run test:e2e:debug`
- Update selectors in page objects
- Ensure elements are visible before interaction

## Documentation

For detailed information, see:
- `tests/e2e/README.md` - Comprehensive testing guide
- `playwright.config.ts` - Configuration reference
- Page object files - API documentation in comments

## Summary

This test infrastructure provides:
- ✅ Electron-specific configuration
- ✅ Automatic app lifecycle management
- ✅ Page Object Models for all three main panels
- ✅ Comprehensive utility functions
- ✅ Example tests demonstrating usage
- ✅ CI/CD ready configuration
- ✅ Detailed documentation

The setup follows industry best practices and provides a solid foundation for comprehensive end-to-end testing of the Electron book publishing application.

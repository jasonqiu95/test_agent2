# Import Flow E2E Tests

## Overview

This document describes the comprehensive E2E tests for the new project creation and DOCX import flow in the book publishing application.

## What's Tested

### Complete User Flow
The tests cover the entire user journey from app launch to viewing imported chapters:

1. **Application Launch**
   - Electron app starts successfully
   - Main window opens and loads

2. **Welcome Screen**
   - Welcome screen displays with correct title
   - All action buttons are present and functional:
     - Import Document
     - New Project
     - Open Existing

3. **New Project Creation**
   - Creating a blank project works
   - Editor view loads after project creation
   - Navigation between welcome screen and editor

4. **Document Import Initiation**
   - Import button triggers file selection
   - File chooser dialog handling

5. **DOCX File Selection**
   - File selection with sample DOCX file
   - File parsing and processing

6. **Import Preview Dialog**
   - Dialog appears with detected chapters
   - Chapter cards display correctly
   - Chapter content preview is visible
   - Import statistics show selected/total chapters
   - Chapter metadata (type, heading level, confidence) displays

7. **Chapter Preview Interactions**
   - Checkbox selection/deselection works
   - Chapters remain selected by default
   - UI updates reflect selection changes

8. **Import Acceptance**
   - Import button is enabled when chapters selected
   - Clicking import completes the process
   - Dialog closes after import

9. **Content Verification**
   - Editor view displays with imported content
   - Book title updates appropriately
   - Application state reflects imported data

### Additional Test Scenarios

- **Import Cancellation**: Tests that cancelling the file selection returns to welcome screen
- **Empty Document**: Placeholder for testing documents with no detected chapters

## Test Files

### `import-flow.spec.ts`
Main test file containing:
- Full flow test (~60 second timeout)
- Import cancellation test
- Empty document test (placeholder)

### `fixtures/sample-book.docx`
Sample DOCX file with:
- Title: "The Adventures of Test Book"
- 3 chapters with proper Heading 1 styles
- Multiple paragraphs per chapter
- Realistic content for visual verification

### `fixtures/createSampleDocx.js`
Script to regenerate the sample DOCX file using JSZip or Python

## Screenshots

The tests capture screenshots at every major step (12+ screenshots per full flow test):

1. `01-app-launched.png` - Initial app launch
2. `02-welcome-screen.png` - Welcome screen UI
3. `03-new-project-created.png` - After creating new project
4. `04-import-initiated.png` - Import dialog triggered
5. `05-file-selected.png` - File selection completed
6. `06-import-preview-dialog.png` - Import preview appears
7. `07-chapters-detected.png` - Detected chapters displayed
8. `08-chapter-selection.png` - Chapter selection interaction
9. `09-import-accepted.png` - After clicking import
10. `10-editor-with-content.png` - Editor view with content
11. `11-final-state.png` - Final application state
12. `12-test-complete.png` - Test completion

## Configuration

### Playwright Config Updates
Enhanced `playwright.config.ts` with:
- Full-page screenshots
- 1280x720 video resolution
- Viewport size for consistent rendering
- Screenshot mode: only on failure
- Video mode: retain on failure

## Running the Tests

### Prerequisites
```bash
# Build the application first
npm run build:dir

# Install dependencies (if not already done)
npm install
```

### Run Import Flow Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run only import flow tests
npx playwright test import-flow

# Run with UI visible (headed mode)
npx playwright test import-flow --headed

# Debug mode with inspector
npx playwright test import-flow --debug

# Run specific test by name
npx playwright test -g "should complete full flow"
```

### View Results
```bash
# Open HTML report
npm run test:e2e:report

# View screenshots
open test-results/

# View individual test artifacts
open test-results/import-flow-should-complete-full-flow/
```

## Implementation Details

### Test Architecture
- Uses Playwright Test framework
- Leverages `@playwright/test` with Electron support
- Helper functions in `helpers/electron.ts` for app lifecycle
- Page Object Model approach for locators
- Timeout: 60 seconds for complex flows

### File Selection Handling
The tests handle Electron's file selection dialog using:
```typescript
const fileChooserPromise = window.waitForEvent('filechooser');
const fileChooser = await fileChooserPromise;
await fileChooser.setFiles([sampleDocxPath]);
```

### Verification Strategy
- **Visual verification**: Screenshots at each step
- **Element visibility**: Using Playwright's `toBeVisible()` assertions
- **Content verification**: Checking text content of key elements
- **State verification**: Ensuring UI reflects expected application state
- **Count verification**: Verifying expected number of chapters

### Error Handling
- Try-catch blocks for optional UI elements (navigator panel)
- Timeout handling for async operations
- Graceful handling of file chooser events
- Console logging for debugging

## Known Limitations

1. **File Dialog Interaction**: File selection in Electron can be tricky in headless mode. The test includes error handling for cases where the file chooser event isn't captured.

2. **Navigator Panel**: The navigator panel visibility depends on the app's UI state. The test handles cases where it might not be visible by default.

3. **Timing**: Some operations (DOCX parsing, import processing) may take variable time. The test includes generous timeouts and wait periods.

4. **Dependencies**: The test requires the application to be built (`npm run build:dir`) before running.

## Future Enhancements

Potential improvements for the test suite:

1. **Additional DOCX Samples**:
   - Empty document
   - Document with no headings
   - Document with complex formatting
   - Very large documents

2. **Additional User Flows**:
   - Edit chapter titles in preview
   - Merge/split chapters
   - Import into existing project
   - Multiple file imports

3. **Performance Testing**:
   - Measure import time for various document sizes
   - Memory usage during import
   - UI responsiveness during processing

4. **Accessibility Testing**:
   - Keyboard navigation through import flow
   - Screen reader compatibility
   - Focus management

5. **Error Scenarios**:
   - Corrupted DOCX files
   - Unsupported file formats
   - Network/file system errors

## Troubleshooting

### Tests Failing to Launch App
```bash
# Ensure app is built
npm run build:dir

# Check that dist-electron/main.js exists
ls -la dist-electron/main.js
```

### File Selection Not Working
- In headless mode, file chooser events may not fire consistently
- Run with `--headed` flag to see actual behavior
- Check console output for file chooser errors

### Screenshots Not Captured
```bash
# Ensure test-results directory exists and is writable
mkdir -p test-results
chmod 755 test-results

# Check Playwright config has screenshot settings
```

### Import Preview Not Appearing
- Verify sample DOCX file exists: `tests/e2e/fixtures/sample-book.docx`
- Check that DOCX parsing library (mammoth) is working
- Increase wait timeout if DOCX parsing is slow

## Contributing

When modifying these tests:

1. **Maintain Screenshots**: Keep the screenshot captures for visual regression
2. **Update Documentation**: Keep this file and README.md in sync
3. **Add Test Cases**: Add new test scenarios to `import-flow.spec.ts`
4. **Generate Fixtures**: Use `createSampleDocx.js` for new test files
5. **Run Tests Locally**: Always run tests before committing

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright with Electron](https://playwright.dev/docs/api/class-electron)
- [Electron Testing Best Practices](https://www.electronjs.org/docs/latest/tutorial/automated-testing)

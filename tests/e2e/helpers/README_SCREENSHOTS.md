# E2E Screenshot Utilities

This directory contains screenshot capture utilities for E2E tests, making it easy to capture and organize screenshots at key workflow states.

## Features

- **Full Window Capture**: Capture complete window screenshots
- **Panel-Specific Capture**: Capture individual panels (navigator, editor, preview)
- **Before/After Comparisons**: Capture comparison screenshots for state changes
- **Organized Output**: Screenshots organized by test name and step
- **Workflow Sequences**: Capture multi-step workflows with descriptive names
- **Flexible Options**: Customize output directory, timing, metadata, and more

## Usage

### Using ScreenshotManager (Recommended)

The `ScreenshotManager` class provides organized screenshot capture with automatic naming and folder structure:

```typescript
import { test } from './fixtures';
import { createScreenshotManager } from './helpers/screenshots';

test('my test', async ({ mainWindow }) => {
  const screenshots = createScreenshotManager(mainWindow, test.info().title);

  // Capture full window at workflow step
  await screenshots.captureWorkflowStep('initial-state');

  // Capture all panels
  const panels = await screenshots.captureAllPanels();

  // Capture before/after comparison
  const comparison = await screenshots.captureComparison('button-click', async () => {
    await page.click('button');
  });

  // Capture sequence of steps
  await screenshots.captureSequence([
    { name: 'step-1', action: async () => { /* ... */ } },
    { name: 'step-2', action: async () => { /* ... */ } },
  ]);
});
```

### Standalone Functions

For simple use cases, standalone functions are available:

```typescript
import { captureFullWindow, capturePanel, captureComparison } from './helpers/screenshots';

// Capture full window
await captureFullWindow(page, 'my-screenshot');

// Capture specific panel
await capturePanel(page, '.editor', 'editor-panel');

// Capture before/after
await captureComparison(page, 'action', async () => {
  // perform action
});
```

## API Reference

### ScreenshotManager

#### Constructor

```typescript
new ScreenshotManager(page: Page, testName: string, outputDir?: string)
```

Creates a new screenshot manager instance.

#### Methods

##### `captureFullWindow(stepName: string, options?: ScreenshotOptions): Promise<string>`

Captures a full window screenshot at a specific workflow step.

##### `capturePanel(panelName: string, selector: string, options?: ScreenshotOptions): Promise<string>`

Captures a screenshot of a specific panel element.

##### `captureNavigatorPanel(options?: ScreenshotOptions): Promise<string>`

Captures the navigator panel specifically.

##### `captureEditorPanel(options?: ScreenshotOptions): Promise<string>`

Captures the editor panel specifically.

##### `capturePreviewPanel(options?: ScreenshotOptions): Promise<string>`

Captures the preview panel specifically.

##### `captureAllPanels(options?: ScreenshotOptions): Promise<PanelScreenshotResult>`

Captures all panels in one call, returning paths to each captured panel.

##### `captureComparison(stepName: string, beforeAction: () => Promise<void>, options?: ScreenshotOptions): Promise<ComparisonScreenshotResult>`

Captures before/after comparison screenshots around an action.

##### `captureElementComparison(stepName: string, selector: string, beforeAction: () => Promise<void>, options?: ScreenshotOptions): Promise<ComparisonScreenshotResult>`

Captures before/after comparison screenshots of a specific element.

##### `captureWorkflowStep(stepName: string, options?: ScreenshotOptions): Promise<string>`

Captures a screenshot at a specific workflow step with metadata.

##### `captureElement(locator: Locator, elementName: string, options?: ScreenshotOptions): Promise<string>`

Captures a screenshot of a specific element using a Playwright locator.

##### `captureSequence(steps: Array<{ name: string; action?: () => Promise<void> }>, options?: ScreenshotOptions): Promise<string[]>`

Captures multiple screenshots in sequence with optional actions between captures.

##### `resetStepCounter(): void`

Resets the step counter (useful for new test sections).

##### `getCurrentStep(): number`

Returns the current step counter value.

### ScreenshotOptions

```typescript
interface ScreenshotOptions {
  /** Full page screenshot (default: false) */
  fullPage?: boolean;

  /** Timeout for waiting before capture (default: 300ms) */
  timeout?: number;

  /** Custom output directory */
  outputDir?: string;

  /** Add timestamp to filename (default: false) */
  timestamp?: boolean;

  /** Additional metadata to include in filename */
  metadata?: Record<string, string>;
}
```

### Return Types

#### PanelScreenshotResult

```typescript
interface PanelScreenshotResult {
  navigator?: string;
  editor?: string;
  preview?: string;
  fullWindow?: string;
}
```

#### ComparisonScreenshotResult

```typescript
interface ComparisonScreenshotResult {
  before: string;
  after: string;
  testName: string;
  step: string;
}
```

## Output Organization

Screenshots are organized in the following structure:

```
test-results/screenshots/
├── full-window/
│   └── test-name-step-1-action.png
├── panels/
│   ├── navigator/
│   ├── editor/
│   └── preview/
├── comparisons/
│   ├── test-name-step-1-action-before.png
│   ├── test-name-step-1-action-after.png
│   └── elements/
└── elements/
    └── test-name-element-name.png
```

## Best Practices

1. **Use descriptive step names**: Make it easy to identify what the screenshot shows
2. **Capture at key states**: Focus on important workflow states and transitions
3. **Use comparisons for changes**: Before/after screenshots help visualize state changes
4. **Organize by test**: Use ScreenshotManager to automatically organize by test name
5. **Add metadata**: Use the metadata option to add context to filenames
6. **Handle missing elements**: The utilities gracefully handle missing panels without throwing errors

## Examples

See `tests/e2e/screenshot-example.spec.ts` for comprehensive usage examples.

## Tips

- Screenshots automatically wait for animations to complete (300ms default)
- Use `fullPage: true` for scrollable content
- Add custom `timeout` for slower animations or transitions
- Use `metadata` to add context like browser type, theme, etc.
- Organize screenshots by test name for better management

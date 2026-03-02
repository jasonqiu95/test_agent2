import { Page, Locator } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Screenshot capture utilities for E2E tests
 * Provides helpers for capturing and organizing screenshots at various workflow states
 */

export interface ScreenshotOptions {
  /** Full page screenshot (default: false) */
  fullPage?: boolean;
  /** Timeout for waiting before capture (default: 300ms for animations) */
  timeout?: number;
  /** Custom output directory (default: test-results/screenshots) */
  outputDir?: string;
  /** Add timestamp to filename (default: false) */
  timestamp?: boolean;
  /** Additional metadata to include in filename */
  metadata?: Record<string, string>;
}

export interface ComparisonScreenshotResult {
  /** Path to the 'before' screenshot */
  before: string;
  /** Path to the 'after' screenshot */
  after: string;
  /** Test name used for organization */
  testName: string;
  /** Step identifier */
  step: string;
}

export interface PanelScreenshotResult {
  /** Path to the navigator panel screenshot */
  navigator?: string;
  /** Path to the editor panel screenshot */
  editor?: string;
  /** Path to the preview panel screenshot */
  preview?: string;
  /** Path to the full window screenshot */
  fullWindow?: string;
}

/**
 * ScreenshotManager class for organizing and capturing test screenshots
 */
export class ScreenshotManager {
  private page: Page;
  private testName: string;
  private outputDir: string;
  private stepCounter: number = 0;

  constructor(page: Page, testName: string, outputDir?: string) {
    this.page = page;
    this.testName = this.sanitizeTestName(testName);
    this.outputDir = outputDir || path.resolve(__dirname, '../../../test-results/screenshots');
  }

  /**
   * Sanitize test name for use in filenames
   */
  private sanitizeTestName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDir(subDir?: string): Promise<string> {
    const targetDir = subDir ? path.join(this.outputDir, subDir) : this.outputDir;
    await fs.mkdir(targetDir, { recursive: true });
    return targetDir;
  }

  /**
   * Build filename with optional metadata
   */
  private buildFilename(
    baseName: string,
    options: ScreenshotOptions = {}
  ): string {
    let filename = `${this.testName}-${baseName}`;

    // Add metadata to filename
    if (options.metadata) {
      const metadataStr = Object.entries(options.metadata)
        .map(([key, value]) => `${key}-${value}`)
        .join('-');
      filename += `-${metadataStr}`;
    }

    // Add timestamp if requested
    if (options.timestamp) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      filename += `-${timestamp}`;
    }

    return `${filename}.png`;
  }

  /**
   * Wait for animations and UI to settle before capturing
   */
  private async waitForStable(timeout?: number): Promise<void> {
    await this.page.waitForTimeout(timeout || 300);

    // Wait for any pending animations
    await this.page.evaluate(() => {
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });
    });
  }

  /**
   * Capture full window screenshot
   */
  async captureFullWindow(
    stepName: string,
    options: ScreenshotOptions = {}
  ): Promise<string> {
    await this.waitForStable(options.timeout);

    const dir = await this.ensureOutputDir('full-window');
    const filename = this.buildFilename(`step-${++this.stepCounter}-${stepName}`, options);
    const filepath = path.join(dir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: options.fullPage || false,
    });

    return filepath;
  }

  /**
   * Capture a specific panel by selector
   */
  async capturePanel(
    panelName: string,
    selector: string,
    options: ScreenshotOptions = {}
  ): Promise<string> {
    await this.waitForStable(options.timeout);

    const locator = this.page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout: 5000 });

    const dir = await this.ensureOutputDir(`panels/${panelName}`);
    const filename = this.buildFilename(`${panelName}-panel`, options);
    const filepath = path.join(dir, filename);

    await locator.screenshot({ path: filepath });

    return filepath;
  }

  /**
   * Capture navigator panel
   */
  async captureNavigatorPanel(options: ScreenshotOptions = {}): Promise<string> {
    return this.capturePanel(
      'navigator',
      '.navigator, .navigator-panel, [data-testid="navigator"]',
      options
    );
  }

  /**
   * Capture editor panel
   */
  async captureEditorPanel(options: ScreenshotOptions = {}): Promise<string> {
    return this.capturePanel(
      'editor',
      '.editor, .editor-container, [data-testid="editor"]',
      options
    );
  }

  /**
   * Capture preview panel
   */
  async capturePreviewPanel(options: ScreenshotOptions = {}): Promise<string> {
    return this.capturePanel(
      'preview',
      '.preview, .preview-panel, [data-testid="preview"]',
      options
    );
  }

  /**
   * Capture all panels in one call
   */
  async captureAllPanels(options: ScreenshotOptions = {}): Promise<PanelScreenshotResult> {
    const result: PanelScreenshotResult = {};

    // Capture each panel, but don't fail if one doesn't exist
    try {
      result.navigator = await this.captureNavigatorPanel(options);
    } catch (error) {
      console.warn('Navigator panel not found or not visible');
    }

    try {
      result.editor = await this.captureEditorPanel(options);
    } catch (error) {
      console.warn('Editor panel not found or not visible');
    }

    try {
      result.preview = await this.capturePreviewPanel(options);
    } catch (error) {
      console.warn('Preview panel not found or not visible');
    }

    // Also capture full window for comparison
    result.fullWindow = await this.captureFullWindow('all-panels', options);

    return result;
  }

  /**
   * Capture before/after comparison screenshots
   * Useful for testing state changes, interactions, and workflows
   */
  async captureComparison(
    stepName: string,
    beforeAction: () => Promise<void>,
    options: ScreenshotOptions = {}
  ): Promise<ComparisonScreenshotResult> {
    const dir = await this.ensureOutputDir('comparisons');
    const step = `step-${++this.stepCounter}-${stepName}`;

    // Capture 'before' state
    await this.waitForStable(options.timeout);
    const beforeFilename = this.buildFilename(`${step}-before`, options);
    const beforePath = path.join(dir, beforeFilename);
    await this.page.screenshot({
      path: beforePath,
      fullPage: options.fullPage || false,
    });

    // Execute the action
    await beforeAction();

    // Capture 'after' state
    await this.waitForStable(options.timeout);
    const afterFilename = this.buildFilename(`${step}-after`, options);
    const afterPath = path.join(dir, afterFilename);
    await this.page.screenshot({
      path: afterPath,
      fullPage: options.fullPage || false,
    });

    return {
      before: beforePath,
      after: afterPath,
      testName: this.testName,
      step,
    };
  }

  /**
   * Capture comparison screenshots for a specific element
   */
  async captureElementComparison(
    stepName: string,
    selector: string,
    beforeAction: () => Promise<void>,
    options: ScreenshotOptions = {}
  ): Promise<ComparisonScreenshotResult> {
    const dir = await this.ensureOutputDir('comparisons/elements');
    const step = `step-${++this.stepCounter}-${stepName}`;

    const locator = this.page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout: 5000 });

    // Capture 'before' state
    await this.waitForStable(options.timeout);
    const beforeFilename = this.buildFilename(`${step}-before`, options);
    const beforePath = path.join(dir, beforeFilename);
    await locator.screenshot({ path: beforePath });

    // Execute the action
    await beforeAction();

    // Capture 'after' state
    await this.waitForStable(options.timeout);
    const afterFilename = this.buildFilename(`${step}-after`, options);
    const afterPath = path.join(dir, afterFilename);
    await locator.screenshot({ path: afterPath });

    return {
      before: beforePath,
      after: afterPath,
      testName: this.testName,
      step,
    };
  }

  /**
   * Capture a screenshot at a specific workflow step
   */
  async captureWorkflowStep(
    stepName: string,
    options: ScreenshotOptions = {}
  ): Promise<string> {
    return this.captureFullWindow(stepName, {
      ...options,
      metadata: { workflow: 'step', ...options.metadata },
    });
  }

  /**
   * Capture screenshot of a specific locator
   */
  async captureElement(
    locator: Locator,
    elementName: string,
    options: ScreenshotOptions = {}
  ): Promise<string> {
    await this.waitForStable(options.timeout);
    await locator.waitFor({ state: 'visible', timeout: 5000 });

    const dir = await this.ensureOutputDir('elements');
    const filename = this.buildFilename(elementName, options);
    const filepath = path.join(dir, filename);

    await locator.screenshot({ path: filepath });

    return filepath;
  }

  /**
   * Capture multiple screenshots in sequence with descriptive names
   */
  async captureSequence(
    steps: Array<{ name: string; action?: () => Promise<void> }>,
    options: ScreenshotOptions = {}
  ): Promise<string[]> {
    const screenshots: string[] = [];

    for (const step of steps) {
      if (step.action) {
        await step.action();
      }

      const screenshot = await this.captureWorkflowStep(step.name, options);
      screenshots.push(screenshot);
    }

    return screenshots;
  }

  /**
   * Reset step counter (useful for new test sections)
   */
  resetStepCounter(): void {
    this.stepCounter = 0;
  }

  /**
   * Get the current step counter value
   */
  getCurrentStep(): number {
    return this.stepCounter;
  }
}

/**
 * Create a screenshot manager for a test
 */
export function createScreenshotManager(
  page: Page,
  testName: string,
  outputDir?: string
): ScreenshotManager {
  return new ScreenshotManager(page, testName, outputDir);
}

/**
 * Standalone helper: Capture full window screenshot
 */
export async function captureFullWindow(
  page: Page,
  name: string,
  options: ScreenshotOptions = {}
): Promise<string> {
  const dir = options.outputDir || path.resolve(__dirname, '../../../test-results/screenshots');
  await fs.mkdir(dir, { recursive: true });

  const filename = `${name}${options.timestamp ? `-${Date.now()}` : ''}.png`;
  const filepath = path.join(dir, filename);

  if (options.timeout) {
    await page.waitForTimeout(options.timeout);
  }

  await page.screenshot({
    path: filepath,
    fullPage: options.fullPage || false,
  });

  return filepath;
}

/**
 * Standalone helper: Capture panel screenshot
 */
export async function capturePanel(
  page: Page,
  selector: string,
  name: string,
  options: ScreenshotOptions = {}
): Promise<string> {
  const dir = options.outputDir || path.resolve(__dirname, '../../../test-results/screenshots');
  await fs.mkdir(dir, { recursive: true });

  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: 5000 });

  const filename = `${name}${options.timestamp ? `-${Date.now()}` : ''}.png`;
  const filepath = path.join(dir, filename);

  if (options.timeout) {
    await page.waitForTimeout(options.timeout);
  }

  await locator.screenshot({ path: filepath });

  return filepath;
}

/**
 * Standalone helper: Capture before/after comparison
 */
export async function captureComparison(
  page: Page,
  name: string,
  action: () => Promise<void>,
  options: ScreenshotOptions = {}
): Promise<ComparisonScreenshotResult> {
  const dir = options.outputDir || path.resolve(__dirname, '../../../test-results/screenshots/comparisons');
  await fs.mkdir(dir, { recursive: true });

  // Before screenshot
  if (options.timeout) {
    await page.waitForTimeout(options.timeout);
  }

  const beforePath = path.join(dir, `${name}-before.png`);
  await page.screenshot({
    path: beforePath,
    fullPage: options.fullPage || false,
  });

  // Execute action
  await action();

  // After screenshot
  if (options.timeout) {
    await page.waitForTimeout(options.timeout);
  }

  const afterPath = path.join(dir, `${name}-after.png`);
  await page.screenshot({
    path: afterPath,
    fullPage: options.fullPage || false,
  });

  return {
    before: beforePath,
    after: afterPath,
    testName: name,
    step: 'comparison',
  };
}

/**
 * Wait for page to be stable before screenshot
 */
export async function waitForStableState(page: Page, timeout = 300): Promise<void> {
  await page.waitForTimeout(timeout);

  // Wait for animations to complete
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  });
}

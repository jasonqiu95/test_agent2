import { test as base, _electron as electron } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import { NavigatorPage } from './page-objects/NavigatorPage';
import { EditorPage } from './page-objects/EditorPage';
import { PreviewPage } from './page-objects/PreviewPage';

/**
 * Extended test fixtures for Electron application testing
 * Provides automatic app lifecycle management and page object models
 */

export interface ElectronFixtures {
  /** The Electron application instance */
  electronApp: ElectronApplication;
  /** The main application window */
  mainWindow: Page;
  /** Navigator panel page object */
  navigatorPage: NavigatorPage;
  /** Editor panel page object */
  editorPage: EditorPage;
  /** Preview panel page object */
  previewPage: PreviewPage;
}

/**
 * Extend Playwright test with Electron-specific fixtures
 */
export const test = base.extend<ElectronFixtures>({
  // Electron application fixture
  electronApp: async ({}, use) => {
    const app = await electron.launch({
      args: [path.resolve(__dirname, '../../dist-electron/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      },
      timeout: 30000,
    });

    await use(app);

    // Cleanup: close the app after test
    await app.close();
  },

  // Main window fixture
  mainWindow: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();

    // Wait for the window to be ready
    await window.waitForLoadState('domcontentloaded');

    // Wait for root element to be visible
    await window.locator('#root').waitFor({ state: 'visible', timeout: 15000 });

    await use(window);
  },

  // Navigator page object fixture
  navigatorPage: async ({ mainWindow }, use) => {
    const navigatorPage = new NavigatorPage(mainWindow);
    await use(navigatorPage);
  },

  // Editor page object fixture
  editorPage: async ({ mainWindow }, use) => {
    const editorPage = new EditorPage(mainWindow);
    await use(editorPage);
  },

  // Preview page object fixture
  previewPage: async ({ mainWindow }, use) => {
    const previewPage = new PreviewPage(mainWindow);
    await use(previewPage);
  },
});

export { expect } from '@playwright/test';

/**
 * Editor Panel Page Object Model
 *
 * Represents the main editor panel where content is edited.
 */

import { Page, Locator } from '@playwright/test';

export class EditorPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly editorContainer: Locator;
  readonly toolbar: Locator;
  readonly statusBar: Locator;
  readonly wordCountDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('[data-panel="editor"]');
    this.editorContainer = this.panel.locator('.editor-container');
    this.toolbar = this.panel.locator('.editor-toolbar');
    this.statusBar = this.panel.locator('.editor-status-bar');
    this.wordCountDisplay = this.statusBar.locator('[data-stat="word-count"]');
  }

  /**
   * Check if the editor panel is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.panel.isVisible();
  }

  /**
   * Get the current editor content
   */
  async getContent(): Promise<string> {
    return await this.editorContainer.evaluate((el) => {
      // Assuming the editor stores content in a data attribute or property
      return (el as any).textContent || '';
    });
  }

  /**
   * Set the editor content
   */
  async setContent(content: string): Promise<void> {
    await this.editorContainer.click();
    await this.page.keyboard.press('Meta+A');
    await this.page.keyboard.type(content);
  }

  /**
   * Type text at the current cursor position
   */
  async type(text: string): Promise<void> {
    await this.editorContainer.click();
    await this.page.keyboard.type(text);
  }

  /**
   * Clear all content
   */
  async clear(): Promise<void> {
    await this.editorContainer.click();
    await this.page.keyboard.press('Meta+A');
    await this.page.keyboard.press('Backspace');
  }

  /**
   * Apply formatting (bold, italic, etc.)
   */
  async applyFormatting(format: 'bold' | 'italic' | 'underline'): Promise<void> {
    const buttons: Record<string, string> = {
      bold: 'Meta+B',
      italic: 'Meta+I',
      underline: 'Meta+U',
    };

    const shortcut = buttons[format];
    if (shortcut) {
      await this.page.keyboard.press(shortcut);
    } else {
      // Fallback to clicking toolbar button
      await this.toolbar.locator(`button[data-format="${format}"]`).click();
    }
  }

  /**
   * Insert a heading
   */
  async insertHeading(level: number): Promise<void> {
    const button = this.toolbar.locator(`button[data-heading="${level}"]`);
    await button.click();
  }

  /**
   * Insert a code block
   */
  async insertCodeBlock(language?: string): Promise<void> {
    const button = this.toolbar.locator('button[data-insert="code"]');
    await button.click();

    if (language) {
      // Select language from dropdown
      const langSelect = this.panel.locator('select[name="language"]');
      await langSelect.selectOption(language);
    }
  }

  /**
   * Insert a list
   */
  async insertList(type: 'bullet' | 'numbered'): Promise<void> {
    const button = this.toolbar.locator(`button[data-list="${type}"]`);
    await button.click();
  }

  /**
   * Undo last action
   */
  async undo(): Promise<void> {
    await this.page.keyboard.press('Meta+Z');
  }

  /**
   * Redo last undone action
   */
  async redo(): Promise<void> {
    await this.page.keyboard.press('Meta+Shift+Z');
  }

  /**
   * Get word count
   */
  async getWordCount(): Promise<number> {
    const text = await this.wordCountDisplay.textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Select all text
   */
  async selectAll(): Promise<void> {
    await this.editorContainer.click();
    await this.page.keyboard.press('Meta+A');
  }

  /**
   * Copy selection
   */
  async copy(): Promise<void> {
    await this.page.keyboard.press('Meta+C');
  }

  /**
   * Cut selection
   */
  async cut(): Promise<void> {
    await this.page.keyboard.press('Meta+X');
  }

  /**
   * Paste from clipboard
   */
  async paste(): Promise<void> {
    await this.editorContainer.click();
    await this.page.keyboard.press('Meta+V');
  }

  /**
   * Find text in editor
   */
  async find(query: string): Promise<void> {
    await this.page.keyboard.press('Meta+F');

    // Wait for find dialog
    const findInput = this.page.locator('.find-dialog input[type="search"]');
    await findInput.fill(query);
  }

  /**
   * Replace text
   */
  async replace(find: string, replace: string): Promise<void> {
    await this.page.keyboard.press('Meta+H');

    // Wait for replace dialog
    const findInput = this.page.locator('.replace-dialog input[name="find"]');
    const replaceInput = this.page.locator('.replace-dialog input[name="replace"]');

    await findInput.fill(find);
    await replaceInput.fill(replace);

    // Click replace all
    const replaceAllButton = this.page.locator('button:has-text("Replace All")');
    await replaceAllButton.click();
  }

  /**
   * Get current cursor position
   */
  async getCursorPosition(): Promise<{ line: number; column: number }> {
    return await this.editorContainer.evaluate((el) => {
      // This would depend on the actual editor implementation
      // Placeholder for demonstration
      return { line: 0, column: 0 };
    });
  }

  /**
   * Set cursor position
   */
  async setCursorPosition(line: number, column: number): Promise<void> {
    await this.editorContainer.evaluate(
      ({ l, c }) => {
        // This would depend on the actual editor implementation
        // Placeholder for demonstration
      },
      { l: line, c: column }
    );
  }

  /**
   * Check if content has unsaved changes
   */
  async hasUnsavedChanges(): Promise<boolean> {
    const indicator = this.statusBar.locator('[data-status="modified"]');
    return await indicator.isVisible();
  }

  /**
   * Focus the editor
   */
  async focus(): Promise<void> {
    await this.editorContainer.click();
  }

  /**
   * Check if editor is focused
   */
  async isFocused(): Promise<boolean> {
    return await this.editorContainer.evaluate((el) => {
      return document.activeElement === el ||
        el.contains(document.activeElement);
    });
  }

  /**
   * Wait for the editor to be ready
   */
  async waitForReady(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });
    await this.editorContainer.waitFor({ state: 'visible' });

    // Wait for editor initialization
    await this.page.waitForFunction(() => {
      return (window as any).editorInitialized === true;
    });
  }

  /**
   * Get selected text
   */
  async getSelection(): Promise<string> {
    return await this.page.evaluate(() => {
      return window.getSelection()?.toString() || '';
    });
  }

  /**
   * Check if toolbar is visible
   */
  async isToolbarVisible(): Promise<boolean> {
    return await this.toolbar.isVisible();
  }

  /**
   * Get available toolbar buttons
   */
  async getToolbarButtons(): Promise<string[]> {
    const buttons = this.toolbar.locator('button');
    const count = await buttons.count();
    const labels: string[] = [];

    for (let i = 0; i < count; i++) {
      const label = await buttons.nth(i).getAttribute('aria-label');
      if (label) {
        labels.push(label);
      }
    }

    return labels;
  }
}

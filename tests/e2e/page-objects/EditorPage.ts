import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Editor Panel
 * Handles interactions with the text editor component
 */
export class EditorPage {
  readonly page: Page;
  readonly editorContainer: Locator;
  readonly toolbar: Locator;
  readonly content: Locator;
  readonly loadingOverlay: Locator;

  // Toolbar buttons
  readonly boldButton: Locator;
  readonly italicButton: Locator;
  readonly underlineButton: Locator;
  readonly heading1Button: Locator;
  readonly heading2Button: Locator;
  readonly bulletListButton: Locator;
  readonly numberedListButton: Locator;
  readonly undoButton: Locator;
  readonly redoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editorContainer = page.locator('.editor, .editor-container').first();
    this.toolbar = page.locator('.editor-toolbar, .toolbar').first();
    this.content = page.locator('.editor-content, .ProseMirror, [contenteditable="true"]').first();
    this.loadingOverlay = page.locator('.loading-overlay, .editor-loading');

    // Toolbar buttons - using flexible selectors
    this.boldButton = this.toolbar.locator('button[aria-label*="Bold"], button[title*="Bold"]');
    this.italicButton = this.toolbar.locator('button[aria-label*="Italic"], button[title*="Italic"]');
    this.underlineButton = this.toolbar.locator('button[aria-label*="Underline"], button[title*="Underline"]');
    this.heading1Button = this.toolbar.locator('button[aria-label*="Heading 1"], button[title*="Heading 1"]');
    this.heading2Button = this.toolbar.locator('button[aria-label*="Heading 2"], button[title*="Heading 2"]');
    this.bulletListButton = this.toolbar.locator('button[aria-label*="Bullet"], button[title*="Bullet"]');
    this.numberedListButton = this.toolbar.locator('button[aria-label*="Numbered"], button[title*="Numbered"]');
    this.undoButton = this.toolbar.locator('button[aria-label*="Undo"], button[title*="Undo"]');
    this.redoButton = this.toolbar.locator('button[aria-label*="Redo"], button[title*="Redo"]');
  }

  /**
   * Check if the editor is visible and ready
   */
  async isVisible(): Promise<boolean> {
    try {
      await this.editorContainer.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for the editor to be ready (no loading state)
   */
  async waitForReady(): Promise<void> {
    await this.content.waitFor({ state: 'visible' });

    // Wait for loading overlay to disappear if present
    try {
      await this.loadingOverlay.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // Loading overlay might not exist, which is fine
    }

    // Wait for editor to be editable
    await this.page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        return element && (
          element.getAttribute('contenteditable') === 'true' ||
          element.classList.contains('ProseMirror')
        );
      },
      '.editor-content, .ProseMirror, [contenteditable="true"]',
      { timeout: 10000 }
    );
  }

  /**
   * Get the current editor content as text
   */
  async getContent(): Promise<string> {
    return await this.content.textContent() || '';
  }

  /**
   * Get the editor HTML content
   */
  async getHTMLContent(): Promise<string> {
    return await this.content.innerHTML();
  }

  /**
   * Type text into the editor
   */
  async typeText(text: string): Promise<void> {
    await this.content.click();
    await this.content.type(text, { delay: 50 });
  }

  /**
   * Clear the editor content
   */
  async clear(): Promise<void> {
    await this.content.click();
    await this.page.keyboard.press('Control+A'); // Select all
    await this.page.keyboard.press('Backspace');
  }

  /**
   * Apply bold formatting to selected text
   */
  async applyBold(): Promise<void> {
    if (await this.boldButton.isVisible()) {
      await this.boldButton.click();
    } else {
      // Fallback to keyboard shortcut
      await this.page.keyboard.press('Control+B');
    }
  }

  /**
   * Apply italic formatting to selected text
   */
  async applyItalic(): Promise<void> {
    if (await this.italicButton.isVisible()) {
      await this.italicButton.click();
    } else {
      await this.page.keyboard.press('Control+I');
    }
  }

  /**
   * Apply underline formatting
   */
  async applyUnderline(): Promise<void> {
    if (await this.underlineButton.isVisible()) {
      await this.underlineButton.click();
    } else {
      await this.page.keyboard.press('Control+U');
    }
  }

  /**
   * Insert a heading
   */
  async insertHeading(level: 1 | 2): Promise<void> {
    const button = level === 1 ? this.heading1Button : this.heading2Button;
    if (await button.isVisible()) {
      await button.click();
    }
  }

  /**
   * Select text in the editor
   */
  async selectText(text: string): Promise<void> {
    await this.content.click();
    // Use triple-click to select a paragraph or use keyboard shortcuts
    const textLocator = this.content.locator(`text="${text}"`);
    await textLocator.click({ clickCount: 3 });
  }

  /**
   * Undo the last action
   */
  async undo(): Promise<void> {
    if (await this.undoButton.isVisible()) {
      await this.undoButton.click();
    } else {
      await this.page.keyboard.press('Control+Z');
    }
  }

  /**
   * Redo the last undone action
   */
  async redo(): Promise<void> {
    if (await this.redoButton.isVisible()) {
      await this.redoButton.click();
    } else {
      await this.page.keyboard.press('Control+Shift+Z');
    }
  }

  /**
   * Insert a bullet list
   */
  async insertBulletList(): Promise<void> {
    if (await this.bulletListButton.isVisible()) {
      await this.bulletListButton.click();
    }
  }

  /**
   * Insert a numbered list
   */
  async insertNumberedList(): Promise<void> {
    if (await this.numberedListButton.isVisible()) {
      await this.numberedListButton.click();
    }
  }

  /**
   * Check if the editor has focus
   */
  async hasFocus(): Promise<boolean> {
    return await this.content.evaluate((el) => {
      return document.activeElement === el || el.contains(document.activeElement);
    });
  }

  /**
   * Focus the editor
   */
  async focus(): Promise<void> {
    await this.content.click();
  }

  /**
   * Get the current cursor position (approximate)
   */
  async getCursorPosition(): Promise<{ line: number; column: number } | null> {
    return await this.content.evaluate(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      return {
        line: 0, // Simplified - would need more complex logic for actual line numbers
        column: range.startOffset,
      };
    });
  }

  /**
   * Wait for a specific text to appear in the editor
   */
  async waitForText(text: string, timeout = 5000): Promise<void> {
    await this.content.locator(`text="${text}"`).waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if toolbar is visible
   */
  async isToolbarVisible(): Promise<boolean> {
    return await this.toolbar.isVisible();
  }
}

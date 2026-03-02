import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Preview Panel
 * Handles interactions with the live preview component
 */
export class PreviewPage {
  readonly page: Page;
  readonly panel: Locator;
  readonly content: Locator;
  readonly loadingIndicator: Locator;
  readonly toggleButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('.preview-panel, .preview').first();
    this.content = this.panel.locator('.preview-content, .preview-body').first();
    this.loadingIndicator = this.panel.locator('.preview-loading, .loading-indicator');
    this.toggleButton = page.locator('.main-layout-toggle-btn').filter({ hasText: 'Preview' });
  }

  /**
   * Check if the preview panel is visible
   */
  async isVisible(): Promise<boolean> {
    try {
      await this.panel.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Toggle the preview panel visibility
   */
  async toggle(): Promise<void> {
    await this.toggleButton.click();
    // Wait for animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Wait for the preview to be ready (no loading state)
   */
  async waitForReady(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });

    // Wait for loading indicator to disappear if present
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // Loading indicator might not exist, which is fine
    }

    // Wait for content to be visible
    await this.content.waitFor({ state: 'visible' });
  }

  /**
   * Get the preview content as text
   */
  async getContent(): Promise<string> {
    return await this.content.textContent() || '';
  }

  /**
   * Get the preview HTML content
   */
  async getHTMLContent(): Promise<string> {
    return await this.content.innerHTML();
  }

  /**
   * Wait for the preview to update with specific content
   * Useful for testing debounced preview updates
   */
  async waitForContentUpdate(expectedText: string, timeout = 10000): Promise<void> {
    await this.content.locator(`text="${expectedText}"`).waitFor({
      state: 'visible',
      timeout
    });
  }

  /**
   * Check if the preview is currently loading/updating
   */
  async isLoading(): Promise<boolean> {
    try {
      const isVisible = await this.loadingIndicator.isVisible();
      return isVisible;
    } catch {
      return false;
    }
  }

  /**
   * Wait for preview to finish loading/updating
   */
  async waitForLoadingComplete(timeout = 10000): Promise<void> {
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout });
    } catch {
      // Loading indicator might not exist or be hidden already
    }
  }

  /**
   * Get all heading elements in the preview
   */
  async getHeadings(): Promise<Array<{ level: number; text: string }>> {
    const headings = await this.content.locator('h1, h2, h3, h4, h5, h6').all();
    const result: Array<{ level: number; text: string }> = [];

    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
      const text = await heading.textContent();
      const level = parseInt(tagName[1]);

      if (text) {
        result.push({ level, text: text.trim() });
      }
    }

    return result;
  }

  /**
   * Get all paragraph texts in the preview
   */
  async getParagraphs(): Promise<string[]> {
    const paragraphs = await this.content.locator('p').all();
    const texts: string[] = [];

    for (const p of paragraphs) {
      const text = await p.textContent();
      if (text) {
        texts.push(text.trim());
      }
    }

    return texts;
  }

  /**
   * Check if a specific element exists in the preview
   */
  async hasElement(selector: string): Promise<boolean> {
    const count = await this.content.locator(selector).count();
    return count > 0;
  }

  /**
   * Get list items from the preview
   */
  async getListItems(): Promise<string[]> {
    const items = await this.content.locator('li').all();
    const texts: string[] = [];

    for (const item of items) {
      const text = await item.textContent();
      if (text) {
        texts.push(text.trim());
      }
    }

    return texts;
  }

  /**
   * Take a screenshot of the preview panel
   */
  async screenshot(path?: string): Promise<Buffer> {
    return await this.panel.screenshot({ path });
  }

  /**
   * Scroll the preview to a specific position
   */
  async scrollTo(position: number | 'top' | 'bottom'): Promise<void> {
    await this.content.evaluate((el, pos) => {
      if (pos === 'top') {
        el.scrollTop = 0;
      } else if (pos === 'bottom') {
        el.scrollTop = el.scrollHeight;
      } else {
        el.scrollTop = pos;
      }
    }, position);
  }

  /**
   * Get the current scroll position
   */
  async getScrollPosition(): Promise<number> {
    return await this.content.evaluate((el) => el.scrollTop);
  }

  /**
   * Wait for a debounced update to complete
   * Useful for testing editor-to-preview synchronization
   */
  async waitForDebounce(delay = 500): Promise<void> {
    await this.page.waitForTimeout(delay);
    await this.waitForLoadingComplete();
  }

  /**
   * Check if formatted text exists (bold, italic, etc.)
   */
  async hasFormattedText(format: 'bold' | 'italic' | 'underline'): Promise<boolean> {
    const tagMap = {
      bold: 'strong, b',
      italic: 'em, i',
      underline: 'u',
    };

    return await this.hasElement(tagMap[format]);
  }

  /**
   * Get all links in the preview
   */
  async getLinks(): Promise<Array<{ text: string; href: string }>> {
    const links = await this.content.locator('a').all();
    const result: Array<{ text: string; href: string }> = [];

    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');

      if (text && href) {
        result.push({ text: text.trim(), href });
      }
    }

    return result;
  }
}

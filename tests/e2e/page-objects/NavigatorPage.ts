import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Navigator Panel
 * Handles interactions with the document structure navigation panel
 */
export class NavigatorPage {
  readonly page: Page;
  readonly panel: Locator;
  readonly header: Locator;
  readonly title: Locator;
  readonly content: Locator;
  readonly footer: Locator;
  readonly closeButton: Locator;
  readonly toggleButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('.navigator-panel');
    this.header = this.panel.locator('.navigator-panel-header');
    this.title = this.header.locator('.navigator-panel-title');
    this.content = this.panel.locator('.navigator-panel-content');
    this.footer = this.panel.locator('.navigator-panel-footer');
    this.closeButton = this.header.locator('.navigator-panel-close');
    this.toggleButton = page.locator('.main-layout-toggle-btn').filter({ hasText: 'Navigator' });
  }

  /**
   * Check if the navigator panel is visible
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
   * Get the navigator panel title
   */
  async getTitle(): Promise<string> {
    return await this.title.textContent() || '';
  }

  /**
   * Toggle the navigator panel visibility
   */
  async toggle(): Promise<void> {
    await this.toggleButton.click();
    // Wait for animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Close the navigator panel using the close button
   */
  async close(): Promise<void> {
    if (await this.closeButton.isVisible()) {
      await this.closeButton.click();
    }
  }

  /**
   * Get list of navigation items (chapters, sections, etc.)
   */
  async getNavigationItems(): Promise<string[]> {
    const items = await this.content.locator('[role="treeitem"], .nav-item, .chapter-item').all();
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
   * Click on a navigation item by text
   */
  async clickNavigationItem(text: string): Promise<void> {
    const item = this.content.locator('[role="treeitem"], .nav-item, .chapter-item')
      .filter({ hasText: text })
      .first();
    await item.click();
  }

  /**
   * Wait for the navigator panel to be ready
   */
  async waitForReady(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });
    await this.content.waitFor({ state: 'visible' });
  }

  /**
   * Get the count of navigation items
   */
  async getItemCount(): Promise<number> {
    return await this.content.locator('[role="treeitem"], .nav-item, .chapter-item').count();
  }

  /**
   * Search for an item in the navigator
   */
  async searchItem(searchText: string): Promise<void> {
    const searchInput = this.panel.locator('input[type="search"], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(searchText);
    }
  }

  /**
   * Expand a collapsible section
   */
  async expandSection(sectionName: string): Promise<void> {
    const section = this.content.locator('[role="button"]').filter({ hasText: sectionName });
    const isExpanded = await section.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await section.click();
    }
  }

  /**
   * Collapse a collapsible section
   */
  async collapseSection(sectionName: string): Promise<void> {
    const section = this.content.locator('[role="button"]').filter({ hasText: sectionName });
    const isExpanded = await section.getAttribute('aria-expanded');
    if (isExpanded === 'true') {
      await section.click();
    }
  }
}

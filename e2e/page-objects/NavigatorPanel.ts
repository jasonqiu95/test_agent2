/**
 * Navigator Panel Page Object Model
 *
 * Represents the Navigator panel which displays the book structure
 * including chapters, sections, and front/back matter.
 */

import { Page, Locator } from '@playwright/test';

export class NavigatorPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly chapterList: Locator;
  readonly frontMatterList: Locator;
  readonly backMatterList: Locator;
  readonly searchInput: Locator;
  readonly addChapterButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('[data-panel="navigator"]');
    this.chapterList = this.panel.locator('.chapter-list');
    this.frontMatterList = this.panel.locator('.front-matter-list');
    this.backMatterList = this.panel.locator('.back-matter-list');
    this.searchInput = this.panel.locator('input[type="search"]');
    this.addChapterButton = this.panel.locator('button:has-text("Add Chapter")');
  }

  /**
   * Check if the navigator panel is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.panel.isVisible();
  }

  /**
   * Get all chapter items
   */
  async getChapters(): Promise<Locator[]> {
    const chapters = this.chapterList.locator('.chapter-item');
    const count = await chapters.count();
    const items: Locator[] = [];

    for (let i = 0; i < count; i++) {
      items.push(chapters.nth(i));
    }

    return items;
  }

  /**
   * Get the number of chapters
   */
  async getChapterCount(): Promise<number> {
    const chapters = this.chapterList.locator('.chapter-item');
    return await chapters.count();
  }

  /**
   * Click on a chapter by number
   */
  async selectChapter(chapterNumber: number): Promise<void> {
    const chapter = this.chapterList.locator(
      `[data-chapter="${chapterNumber}"]`
    );
    await chapter.click();
  }

  /**
   * Click on a chapter by title
   */
  async selectChapterByTitle(title: string): Promise<void> {
    const chapter = this.chapterList.locator(`.chapter-item:has-text("${title}")`);
    await chapter.click();
  }

  /**
   * Get chapter titles
   */
  async getChapterTitles(): Promise<string[]> {
    const chapters = await this.getChapters();
    const titles: string[] = [];

    for (const chapter of chapters) {
      const title = await chapter.locator('.chapter-title').textContent();
      if (title) {
        titles.push(title.trim());
      }
    }

    return titles;
  }

  /**
   * Add a new chapter
   */
  async addChapter(): Promise<void> {
    await this.addChapterButton.click();
  }

  /**
   * Search for content in the navigator
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  /**
   * Clear the search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }

  /**
   * Get front matter items
   */
  async getFrontMatter(): Promise<Locator[]> {
    const items = this.frontMatterList.locator('.element-item');
    const count = await items.count();
    const elements: Locator[] = [];

    for (let i = 0; i < count; i++) {
      elements.push(items.nth(i));
    }

    return elements;
  }

  /**
   * Get back matter items
   */
  async getBackMatter(): Promise<Locator[]> {
    const items = this.backMatterList.locator('.element-item');
    const count = await items.count();
    const elements: Locator[] = [];

    for (let i = 0; i < count; i++) {
      elements.push(items.nth(i));
    }

    return elements;
  }

  /**
   * Select a front matter element by type
   */
  async selectFrontMatter(type: string): Promise<void> {
    const element = this.frontMatterList.locator(`[data-element-type="${type}"]`);
    await element.click();
  }

  /**
   * Select a back matter element by type
   */
  async selectBackMatter(type: string): Promise<void> {
    const element = this.backMatterList.locator(`[data-element-type="${type}"]`);
    await element.click();
  }

  /**
   * Right-click on a chapter to open context menu
   */
  async openChapterContextMenu(chapterNumber: number): Promise<void> {
    const chapter = this.chapterList.locator(
      `[data-chapter="${chapterNumber}"]`
    );
    await chapter.click({ button: 'right' });
  }

  /**
   * Drag a chapter to reorder
   */
  async reorderChapter(
    fromChapter: number,
    toChapter: number
  ): Promise<void> {
    const source = this.chapterList.locator(`[data-chapter="${fromChapter}"]`);
    const target = this.chapterList.locator(`[data-chapter="${toChapter}"]`);

    await source.dragTo(target);
  }

  /**
   * Expand or collapse a chapter
   */
  async toggleChapterExpansion(chapterNumber: number): Promise<void> {
    const expandButton = this.chapterList.locator(
      `[data-chapter="${chapterNumber}"] .expand-toggle`
    );
    await expandButton.click();
  }

  /**
   * Check if a chapter is expanded
   */
  async isChapterExpanded(chapterNumber: number): Promise<boolean> {
    const chapter = this.chapterList.locator(
      `[data-chapter="${chapterNumber}"]`
    );
    const expanded = await chapter.getAttribute('aria-expanded');
    return expanded === 'true';
  }

  /**
   * Get the currently selected item
   */
  async getSelectedItem(): Promise<string | null> {
    const selected = this.panel.locator('.navigator-item.selected');

    if ((await selected.count()) === 0) {
      return null;
    }

    return await selected.textContent();
  }

  /**
   * Wait for the navigator to load
   */
  async waitForLoad(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });
    await this.chapterList.waitFor({ state: 'visible' });
  }
}

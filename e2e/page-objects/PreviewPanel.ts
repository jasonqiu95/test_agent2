/**
 * Preview Panel Page Object Model
 *
 * Represents the preview panel showing rendered book content.
 */

import { Page, Locator } from '@playwright/test';

export class PreviewPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly previewContainer: Locator;
  readonly toolbar: Locator;
  readonly zoomControls: Locator;
  readonly pageDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('[data-panel="preview"]');
    this.previewContainer = this.panel.locator('.preview-container');
    this.toolbar = this.panel.locator('.preview-toolbar');
    this.zoomControls = this.toolbar.locator('.zoom-controls');
    this.pageDisplay = this.toolbar.locator('.page-display');
  }

  /**
   * Check if the preview panel is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.panel.isVisible();
  }

  /**
   * Get the rendered preview HTML
   */
  async getRenderedContent(): Promise<string> {
    return await this.previewContainer.innerHTML();
  }

  /**
   * Get the preview text content
   */
  async getTextContent(): Promise<string> {
    return await this.previewContainer.textContent() || '';
  }

  /**
   * Check if specific text appears in the preview
   */
  async containsText(text: string): Promise<boolean> {
    const content = await this.getTextContent();
    return content.includes(text);
  }

  /**
   * Zoom in
   */
  async zoomIn(): Promise<void> {
    const zoomInButton = this.zoomControls.locator('button[data-action="zoom-in"]');
    await zoomInButton.click();
  }

  /**
   * Zoom out
   */
  async zoomOut(): Promise<void> {
    const zoomOutButton = this.zoomControls.locator('button[data-action="zoom-out"]');
    await zoomOutButton.click();
  }

  /**
   * Reset zoom to 100%
   */
  async resetZoom(): Promise<void> {
    const resetButton = this.zoomControls.locator('button[data-action="zoom-reset"]');
    await resetButton.click();
  }

  /**
   * Set specific zoom level
   */
  async setZoom(percentage: number): Promise<void> {
    const zoomSelect = this.zoomControls.locator('select[name="zoom"]');
    await zoomSelect.selectOption(`${percentage}%`);
  }

  /**
   * Get current zoom level
   */
  async getZoomLevel(): Promise<number> {
    const zoomDisplay = this.zoomControls.locator('.zoom-level');
    const text = await zoomDisplay.textContent();
    return parseInt(text?.replace('%', '') || '100', 10);
  }

  /**
   * Navigate to next page
   */
  async nextPage(): Promise<void> {
    const nextButton = this.toolbar.locator('button[data-action="next-page"]');
    await nextButton.click();
  }

  /**
   * Navigate to previous page
   */
  async previousPage(): Promise<void> {
    const prevButton = this.toolbar.locator('button[data-action="prev-page"]');
    await prevButton.click();
  }

  /**
   * Get current page number
   */
  async getCurrentPage(): Promise<number> {
    const pageText = await this.pageDisplay.textContent();
    const match = pageText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * Get total number of pages
   */
  async getTotalPages(): Promise<number> {
    const pageText = await this.pageDisplay.textContent();
    const match = pageText?.match(/of (\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * Go to specific page
   */
  async goToPage(pageNumber: number): Promise<void> {
    const pageInput = this.toolbar.locator('input[name="page-number"]');
    await pageInput.fill(String(pageNumber));
    await pageInput.press('Enter');
  }

  /**
   * Refresh/reload the preview
   */
  async refresh(): Promise<void> {
    const refreshButton = this.toolbar.locator('button[data-action="refresh"]');
    await refreshButton.click();

    // Wait for preview to update
    await this.waitForUpdate();
  }

  /**
   * Wait for preview to finish rendering
   */
  async waitForUpdate(timeout: number = 5000): Promise<void> {
    // Wait for any loading indicators to disappear
    const loadingIndicator = this.panel.locator('.preview-loading');
    await loadingIndicator.waitFor({ state: 'hidden', timeout });

    // Additional wait for render completion
    await this.page.waitForFunction(
      () => {
        return !(window as any).previewRendering;
      },
      { timeout }
    );
  }

  /**
   * Scroll preview to specific position
   */
  async scrollTo(x: number, y: number): Promise<void> {
    await this.previewContainer.evaluate(
      ({ scrollX, scrollY }, el) => {
        el.scrollTo(scrollX, scrollY);
      },
      { scrollX: x, scrollY: y }
    );
  }

  /**
   * Scroll to top of preview
   */
  async scrollToTop(): Promise<void> {
    await this.scrollTo(0, 0);
  }

  /**
   * Scroll to bottom of preview
   */
  async scrollToBottom(): Promise<void> {
    await this.previewContainer.evaluate((el) => {
      el.scrollTo(0, el.scrollHeight);
    });
  }

  /**
   * Get preview dimensions
   */
  async getDimensions(): Promise<{ width: number; height: number }> {
    const box = await this.previewContainer.boundingBox();
    return {
      width: box?.width || 0,
      height: box?.height || 0,
    };
  }

  /**
   * Take a screenshot of the preview
   */
  async screenshot(path: string): Promise<void> {
    await this.previewContainer.screenshot({ path });
  }

  /**
   * Check if preview is in loading state
   */
  async isLoading(): Promise<boolean> {
    const loadingIndicator = this.panel.locator('.preview-loading');
    return await loadingIndicator.isVisible();
  }

  /**
   * Get rendered chapters in preview
   */
  async getRenderedChapters(): Promise<Locator[]> {
    const chapters = this.previewContainer.locator('.chapter');
    const count = await chapters.count();
    const items: Locator[] = [];

    for (let i = 0; i < count; i++) {
      items.push(chapters.nth(i));
    }

    return items;
  }

  /**
   * Find element in preview by selector
   */
  findElement(selector: string): Locator {
    return this.previewContainer.locator(selector);
  }

  /**
   * Check if preview has content
   */
  async hasContent(): Promise<boolean> {
    const html = await this.getRenderedContent();
    return html.trim().length > 0;
  }

  /**
   * Get preview mode (single page, spread, continuous)
   */
  async getViewMode(): Promise<string> {
    const modeButton = this.toolbar.locator('[data-control="view-mode"]');
    return (await modeButton.getAttribute('data-mode')) || 'single';
  }

  /**
   * Set preview mode
   */
  async setViewMode(mode: 'single' | 'spread' | 'continuous'): Promise<void> {
    const modeButton = this.toolbar.locator('[data-control="view-mode"]');
    await modeButton.click();

    // Select from dropdown
    const option = this.page.locator(`[data-view-mode="${mode}"]`);
    await option.click();
  }

  /**
   * Toggle print layout view
   */
  async togglePrintLayout(): Promise<void> {
    const printButton = this.toolbar.locator('button[data-action="print-layout"]');
    await printButton.click();
  }

  /**
   * Check if an element is visible in the preview
   */
  async isElementVisible(selector: string): Promise<boolean> {
    const element = this.previewContainer.locator(selector);
    return await element.isVisible();
  }

  /**
   * Wait for the preview panel to be ready
   */
  async waitForReady(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });
    await this.previewContainer.waitFor({ state: 'visible' });
    await this.waitForUpdate();
  }
}

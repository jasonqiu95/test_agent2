/**
 * Styles Panel Page Object Model
 *
 * Represents the styles panel for managing text and layout styles.
 */

import { Page, Locator } from '@playwright/test';

export class StylesPanel {
  readonly page: Page;
  readonly panel: Locator;
  readonly stylesList: Locator;
  readonly toolbar: Locator;
  readonly previewArea: Locator;
  readonly addStyleButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.locator('[data-panel="styles"]');
    this.stylesList = this.panel.locator('.styles-list');
    this.toolbar = this.panel.locator('.styles-toolbar');
    this.previewArea = this.panel.locator('.style-preview');
    this.addStyleButton = this.toolbar.locator('button:has-text("Add Style")');
    this.searchInput = this.toolbar.locator('input[type="search"]');
  }

  /**
   * Check if the styles panel is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.panel.isVisible();
  }

  /**
   * Get all available styles
   */
  async getStyles(): Promise<Locator[]> {
    const styles = this.stylesList.locator('.style-item');
    const count = await styles.count();
    const items: Locator[] = [];

    for (let i = 0; i < count; i++) {
      items.push(styles.nth(i));
    }

    return items;
  }

  /**
   * Get the number of styles
   */
  async getStyleCount(): Promise<number> {
    const styles = this.stylesList.locator('.style-item');
    return await styles.count();
  }

  /**
   * Select a style by name
   */
  async selectStyle(styleName: string): Promise<void> {
    const style = this.stylesList.locator(`.style-item:has-text("${styleName}")`);
    await style.click();
  }

  /**
   * Get style names
   */
  async getStyleNames(): Promise<string[]> {
    const styles = await this.getStyles();
    const names: string[] = [];

    for (const style of styles) {
      const name = await style.locator('.style-name').textContent();
      if (name) {
        names.push(name.trim());
      }
    }

    return names;
  }

  /**
   * Add a new style
   */
  async addStyle(name: string, properties: Record<string, string>): Promise<void> {
    await this.addStyleButton.click();

    // Wait for style editor dialog
    const dialog = this.page.locator('.style-editor-dialog');
    await dialog.waitFor({ state: 'visible' });

    // Fill in style name
    const nameInput = dialog.locator('input[name="style-name"]');
    await nameInput.fill(name);

    // Set properties
    for (const [property, value] of Object.entries(properties)) {
      const propertyInput = dialog.locator(`input[name="${property}"]`);
      if (await propertyInput.count() > 0) {
        await propertyInput.fill(value);
      }
    }

    // Save style
    const saveButton = dialog.locator('button:has-text("Save")');
    await saveButton.click();

    // Wait for dialog to close
    await dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Edit an existing style
   */
  async editStyle(styleName: string): Promise<void> {
    const style = this.stylesList.locator(`.style-item:has-text("${styleName}")`);
    const editButton = style.locator('button[data-action="edit"]');
    await editButton.click();

    // Wait for style editor dialog
    const dialog = this.page.locator('.style-editor-dialog');
    await dialog.waitFor({ state: 'visible' });
  }

  /**
   * Delete a style
   */
  async deleteStyle(styleName: string): Promise<void> {
    const style = this.stylesList.locator(`.style-item:has-text("${styleName}")`);
    const deleteButton = style.locator('button[data-action="delete"]');
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.locator('button:has-text("Delete")');
    await confirmButton.click();
  }

  /**
   * Duplicate a style
   */
  async duplicateStyle(styleName: string, newName: string): Promise<void> {
    const style = this.stylesList.locator(`.style-item:has-text("${styleName}")`);
    const duplicateButton = style.locator('button[data-action="duplicate"]');
    await duplicateButton.click();

    // Enter new name
    const dialog = this.page.locator('.duplicate-style-dialog');
    await dialog.waitFor({ state: 'visible' });

    const nameInput = dialog.locator('input[name="style-name"]');
    await nameInput.fill(newName);

    // Confirm
    const confirmButton = dialog.locator('button:has-text("Duplicate")');
    await confirmButton.click();

    await dialog.waitFor({ state: 'hidden' });
  }

  /**
   * Search for styles
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }

  /**
   * Get style properties for a specific style
   */
  async getStyleProperties(styleName: string): Promise<Record<string, string>> {
    await this.selectStyle(styleName);
    await this.editStyle(styleName);

    const dialog = this.page.locator('.style-editor-dialog');
    const properties: Record<string, string> = {};

    // Extract properties from the dialog
    const inputs = dialog.locator('input[name]');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const name = await input.getAttribute('name');
      const value = await input.inputValue();

      if (name) {
        properties[name] = value;
      }
    }

    // Close dialog
    const cancelButton = dialog.locator('button:has-text("Cancel")');
    await cancelButton.click();

    return properties;
  }

  /**
   * Apply a style to selected text
   */
  async applyStyle(styleName: string): Promise<void> {
    const style = this.stylesList.locator(`.style-item:has-text("${styleName}")`);
    const applyButton = style.locator('button[data-action="apply"]');
    await applyButton.click();
  }

  /**
   * Get style preview for a specific style
   */
  async getStylePreview(styleName: string): Promise<string> {
    await this.selectStyle(styleName);

    // Wait for preview to update
    await this.page.waitForTimeout(300);

    return await this.previewArea.innerHTML();
  }

  /**
   * Filter styles by category
   */
  async filterByCategory(category: string): Promise<void> {
    const categoryFilter = this.toolbar.locator('select[name="category"]');
    await categoryFilter.selectOption(category);
  }

  /**
   * Get available style categories
   */
  async getCategories(): Promise<string[]> {
    const categoryFilter = this.toolbar.locator('select[name="category"]');
    const options = categoryFilter.locator('option');
    const count = await options.count();
    const categories: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) {
        categories.push(text.trim());
      }
    }

    return categories;
  }

  /**
   * Import styles from a file
   */
  async importStyles(filePath: string): Promise<void> {
    const importButton = this.toolbar.locator('button:has-text("Import")');
    await importButton.click();

    // Handle file dialog (this might need special handling in tests)
    await this.page.evaluate((path) => {
      if (window.testHelpers?.setImportFile) {
        window.testHelpers.setImportFile(path);
      }
    }, filePath);

    // Confirm import
    const confirmButton = this.page.locator('button:has-text("Import")');
    await confirmButton.click();
  }

  /**
   * Export styles to a file
   */
  async exportStyles(outputPath: string): Promise<void> {
    const exportButton = this.toolbar.locator('button:has-text("Export")');
    await exportButton.click();

    // Set output path
    await this.page.evaluate((path) => {
      if (window.testHelpers?.setExportPath) {
        window.testHelpers.setExportPath(path);
      }
    }, outputPath);

    // Confirm export
    const confirmButton = this.page.locator('button:has-text("Export")');
    await confirmButton.click();
  }

  /**
   * Check if a style exists
   */
  async hasStyle(styleName: string): Promise<boolean> {
    const style = this.stylesList.locator(`.style-item:has-text("${styleName}")`);
    return (await style.count()) > 0;
  }

  /**
   * Get the currently selected style
   */
  async getSelectedStyle(): Promise<string | null> {
    const selected = this.stylesList.locator('.style-item.selected');

    if ((await selected.count()) === 0) {
      return null;
    }

    const name = await selected.locator('.style-name').textContent();
    return name?.trim() || null;
  }

  /**
   * Sort styles by name
   */
  async sortByName(order: 'asc' | 'desc' = 'asc'): Promise<void> {
    const sortButton = this.toolbar.locator('button[data-sort="name"]');
    await sortButton.click();

    // Check if we need to click again for descending order
    const currentOrder = await sortButton.getAttribute('data-order');
    if (order === 'desc' && currentOrder !== 'desc') {
      await sortButton.click();
    }
  }

  /**
   * Reset all styles to defaults
   */
  async resetToDefaults(): Promise<void> {
    const resetButton = this.toolbar.locator('button:has-text("Reset")');
    await resetButton.click();

    // Confirm reset
    const confirmButton = this.page.locator('button:has-text("Reset All")');
    await confirmButton.click();
  }

  /**
   * Wait for the styles panel to be ready
   */
  async waitForReady(): Promise<void> {
    await this.panel.waitFor({ state: 'visible' });
    await this.stylesList.waitFor({ state: 'visible' });
  }
}

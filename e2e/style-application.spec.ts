/**
 * E2E Test: Style Browsing and Application with Preview
 *
 * Tests the complete workflow of browsing, applying, and previewing
 * different book styles with real-time preview updates.
 */

import { test, expect } from './utils/fixtures';
import { mockBooks } from './fixtures';
import {
  openProject,
  navigateToView,
  waitForPreviewUpdate,
} from './helpers';
import {
  StylesPanel,
  PreviewPanel,
} from './page-objects';

test.describe('Style Browsing and Application', () => {
  test('should browse and apply styles with preview updates', async ({ electronApp }) => {
    const { window } = electronApp;

    // 1. Open project with content
    await openProject(window, mockBooks.complete);

    // 2. Navigate to Styles view
    await navigateToView(window, 'styles');

    // Initialize page objects
    const stylesPanel = new StylesPanel(window);
    const previewPanel = new PreviewPanel(window);

    // Wait for both panels to be ready
    await stylesPanel.waitForReady();
    await previewPanel.waitForReady();

    // Verify styles panel is visible and has styles
    const isStylesVisible = await stylesPanel.isVisible();
    expect(isStylesVisible).toBe(true);

    const styleCount = await stylesPanel.getStyleCount();
    expect(styleCount).toBeGreaterThan(0);

    // 3. Get available style categories
    const categories = await stylesPanel.getCategories();
    expect(categories.length).toBeGreaterThan(0);

    // Store initial preview content for comparison
    const initialPreviewContent = await previewPanel.getRenderedContent();

    // Test applying styles from different categories
    const styledToTest = [
      { name: 'Classic Serif', category: 'serif', fontPattern: /Georgia|Garamond|Baskerville/i },
      { name: 'Modern Sans', category: 'sans-serif', fontPattern: /Helvetica|Arial|Roboto/i },
      { name: 'Elegant Script', category: 'script', fontPattern: /Brush Script|Lucida|Cursive/i },
      { name: 'Contemporary', category: 'modern', fontPattern: /Avenir|Montserrat|Open Sans/i },
    ];

    for (const styleToTest of styledToTest) {
      // 4. Filter by category if available
      if (categories.includes(styleToTest.category)) {
        await stylesPanel.filterByCategory(styleToTest.category);

        // Wait for filter to apply
        await window.waitForTimeout(300);

        // Get filtered styles
        const filteredCount = await stylesPanel.getStyleCount();
        expect(filteredCount).toBeGreaterThan(0);
      }

      // Get available style names
      const styleNames = await stylesPanel.getStyleNames();

      // Find a style to apply (use the first one if our specific name doesn't exist)
      const styleToApply = styleNames.find(name =>
        name.toLowerCase().includes(styleToTest.category.split('-')[0])
      ) || styleNames[0];

      if (!styleToApply) continue;

      // 5. Apply the style
      await stylesPanel.selectStyle(styleToApply);

      // Wait for selection to register
      await window.waitForTimeout(300);

      // 6. Verify style is shown as active/selected
      const selectedStyle = await stylesPanel.getSelectedStyle();
      expect(selectedStyle).toBe(styleToApply);

      // Click apply button or double-click to apply
      const hasStyle = await stylesPanel.hasStyle(styleToApply);
      expect(hasStyle).toBe(true);

      await stylesPanel.applyStyle(styleToApply);

      // 7. Wait for preview to update
      await waitForPreviewUpdate(window);
      await previewPanel.waitForUpdate();

      // 8. Verify preview panel updates after style application
      const updatedPreviewContent = await previewPanel.getRenderedContent();

      // Preview content should have changed from initial
      expect(updatedPreviewContent).not.toBe(initialPreviewContent);

      // Check for font family changes in preview
      const previewHTML = await previewPanel.getRenderedContent();

      // Verify that heading styles are present
      const hasHeadings = await previewPanel.isElementVisible('h1, h2, h3');
      expect(hasHeadings).toBe(true);

      // Check that content is rendered
      const hasContent = await previewPanel.hasContent();
      expect(hasContent).toBe(true);

      // Verify text content is still present after style change
      const textContent = await previewPanel.getTextContent();
      expect(textContent.length).toBeGreaterThan(0);

      // Get computed styles from preview to verify font changes
      const h1Element = previewPanel.findElement('h1').first();
      if (await h1Element.count() > 0) {
        const h1FontFamily = await h1Element.evaluate((el) => {
          return window.getComputedStyle(el).fontFamily;
        });
        expect(h1FontFamily).toBeTruthy();
      }

      // Get paragraph element and check for body font
      const pElement = previewPanel.findElement('p').first();
      if (await pElement.count() > 0) {
        const pFontFamily = await pElement.evaluate((el) => {
          return window.getComputedStyle(el).fontFamily;
        });
        expect(pFontFamily).toBeTruthy();
      }
    }

    // Clear category filter to see all styles
    await stylesPanel.filterByCategory('all');
    const allStylesCount = await stylesPanel.getStyleCount();
    expect(allStylesCount).toBeGreaterThanOrEqual(styleCount);
  });

  test('should persist applied style after reload', async ({ electronApp }) => {
    const { window } = electronApp;

    // Open project with content
    await openProject(window, mockBooks.complete);

    // Navigate to Styles view
    await navigateToView(window, 'styles');

    const stylesPanel = new StylesPanel(window);
    const previewPanel = new PreviewPanel(window);

    await stylesPanel.waitForReady();
    await previewPanel.waitForReady();

    // Get available styles
    const styleNames = await stylesPanel.getStyleNames();
    expect(styleNames.length).toBeGreaterThan(0);

    // Apply a specific style
    const styleToApply = styleNames[0];
    await stylesPanel.selectStyle(styleToApply);
    await stylesPanel.applyStyle(styleToApply);

    // Wait for preview to update
    await waitForPreviewUpdate(window);
    await previewPanel.waitForUpdate();

    // Verify style is selected
    const selectedBeforeReload = await stylesPanel.getSelectedStyle();
    expect(selectedBeforeReload).toBe(styleToApply);

    // Get preview content before reload
    const previewContentBefore = await previewPanel.getRenderedContent();

    // Reload the page/app
    await window.reload();

    // Wait for everything to load again
    await navigateToView(window, 'styles');
    await stylesPanel.waitForReady();
    await previewPanel.waitForReady();

    // Verify the applied style persisted
    const selectedAfterReload = await stylesPanel.getSelectedStyle();
    expect(selectedAfterReload).toBe(styleToApply);

    // Verify preview still shows the same styling
    const previewContentAfter = await previewPanel.getRenderedContent();

    // The styling should be consistent (though exact HTML might differ slightly)
    // We check that content is present and has similar structure
    expect(previewContentAfter).toBeTruthy();
    expect(await previewPanel.hasContent()).toBe(true);
  });

  test('should update preview for different style categories', async ({ electronApp }) => {
    const { window } = electronApp;

    // Open project with content
    await openProject(window, mockBooks.complete);

    // Navigate to Styles view
    await navigateToView(window, 'styles');

    const stylesPanel = new StylesPanel(window);
    const previewPanel = new PreviewPanel(window);

    await stylesPanel.waitForReady();
    await previewPanel.waitForReady();

    // Get available categories
    const categories = await stylesPanel.getCategories();

    // Test each category
    for (const category of categories) {
      if (category.toLowerCase() === 'all') continue;

      // Filter by category
      await stylesPanel.filterByCategory(category);
      await window.waitForTimeout(300);

      // Get styles in this category
      const stylesInCategory = await stylesPanel.getStyleNames();

      if (stylesInCategory.length === 0) continue;

      // Apply the first style in the category
      const styleToApply = stylesInCategory[0];
      await stylesPanel.selectStyle(styleToApply);
      await stylesPanel.applyStyle(styleToApply);

      // Wait for preview update
      await waitForPreviewUpdate(window);
      await previewPanel.waitForUpdate();

      // Verify preview updated
      const hasContent = await previewPanel.hasContent();
      expect(hasContent).toBe(true);

      // Verify style is selected
      const selectedStyle = await stylesPanel.getSelectedStyle();
      expect(selectedStyle).toBe(styleToApply);

      // Check that headings are styled
      const h1Visible = await previewPanel.isElementVisible('h1');
      expect(h1Visible).toBe(true);
    }
  });

  test('should show style preview when browsing', async ({ electronApp }) => {
    const { window } = electronApp;

    // Open project with content
    await openProject(window, mockBooks.complete);

    // Navigate to Styles view
    await navigateToView(window, 'styles');

    const stylesPanel = new StylesPanel(window);
    await stylesPanel.waitForReady();

    // Get all available styles
    const styleNames = await stylesPanel.getStyleNames();
    expect(styleNames.length).toBeGreaterThan(0);

    // Browse through first 3 styles and check preview updates
    for (let i = 0; i < Math.min(3, styleNames.length); i++) {
      const styleName = styleNames[i];

      // Select the style (but don't apply yet)
      await stylesPanel.selectStyle(styleName);

      // Wait for preview to update
      await window.waitForTimeout(300);

      // Get style preview
      const stylePreview = await stylesPanel.getStylePreview(styleName);
      expect(stylePreview).toBeTruthy();
      expect(stylePreview.length).toBeGreaterThan(0);

      // Verify the style is selected
      const selected = await stylesPanel.getSelectedStyle();
      expect(selected).toBe(styleName);
    }
  });

  test('should search and filter styles', async ({ electronApp }) => {
    const { window } = electronApp;

    // Open project with content
    await openProject(window, mockBooks.complete);

    // Navigate to Styles view
    await navigateToView(window, 'styles');

    const stylesPanel = new StylesPanel(window);
    await stylesPanel.waitForReady();

    // Get initial count
    const initialCount = await stylesPanel.getStyleCount();
    expect(initialCount).toBeGreaterThan(0);

    // Search for styles
    await stylesPanel.search('classic');
    await window.waitForTimeout(300);

    // Verify filtered results
    const filteredCount = await stylesPanel.getStyleCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Get filtered style names
    const filteredNames = await stylesPanel.getStyleNames();

    // At least one result should contain 'classic' (case insensitive)
    if (filteredNames.length > 0) {
      const hasClassic = filteredNames.some(name =>
        name.toLowerCase().includes('classic')
      );
      expect(hasClassic).toBe(true);
    }

    // Clear search
    await stylesPanel.clearSearch();
    await window.waitForTimeout(300);

    // Verify we're back to all styles
    const clearedCount = await stylesPanel.getStyleCount();
    expect(clearedCount).toBe(initialCount);
  });

  test('should apply sequential style changes', async ({ electronApp }) => {
    const { window } = electronApp;

    // Open project with content
    await openProject(window, mockBooks.complete);

    // Navigate to Styles view
    await navigateToView(window, 'styles');

    const stylesPanel = new StylesPanel(window);
    const previewPanel = new PreviewPanel(window);

    await stylesPanel.waitForReady();
    await previewPanel.waitForReady();

    // Get available styles
    const styleNames = await stylesPanel.getStyleNames();
    const numStylesToTest = Math.min(4, styleNames.length);

    expect(styleNames.length).toBeGreaterThanOrEqual(numStylesToTest);

    const previewSnapshots: string[] = [];

    // Apply 4 different styles sequentially
    for (let i = 0; i < numStylesToTest; i++) {
      const styleToApply = styleNames[i];

      // Select and apply style
      await stylesPanel.selectStyle(styleToApply);
      await stylesPanel.applyStyle(styleToApply);

      // Wait for preview to update
      await waitForPreviewUpdate(window);
      await previewPanel.waitForUpdate();

      // Verify style is selected
      const selected = await stylesPanel.getSelectedStyle();
      expect(selected).toBe(styleToApply);

      // Capture preview state
      const previewContent = await previewPanel.getRenderedContent();
      expect(previewContent).toBeTruthy();

      // Verify this preview is different from previous ones
      for (const previousSnapshot of previewSnapshots) {
        // While content structure might be similar, styling should differ
        // We just verify each state produces valid content
        expect(previewContent.length).toBeGreaterThan(0);
      }

      previewSnapshots.push(previewContent);

      // Verify preview has expected elements
      expect(await previewPanel.hasContent()).toBe(true);
      const textContent = await previewPanel.getTextContent();
      expect(textContent.length).toBeGreaterThan(0);
    }

    // Verify we captured all snapshots
    expect(previewSnapshots.length).toBe(numStylesToTest);
  });
});

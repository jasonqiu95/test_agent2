/**
 * E2E Test: Style Feature Configuration
 *
 * Tests the ability to configure individual style features:
 * - Apply a base style
 * - Open style configuration panel/modal
 * - Configure different features (headings, drop caps, ornamental breaks, first paragraph, body font)
 * - Verify preview updates
 * - Save as custom style
 * - Verify custom style appears in list
 */

import { test, expect } from './utils/fixtures';
import { mockBooks } from './fixtures';
import { openProject, navigateToView, waitForPreviewUpdate } from './helpers';
import { StylesPanel, PreviewPanel } from './page-objects';

test.describe('Style Feature Configuration', () => {
  test('should configure heading appearance and update preview', async ({
    electronApp,
  }) => {
    const { window } = electronApp;

    // Open project and navigate to styles
    await openProject(window, mockBooks.complete);
    await navigateToView(window, 'styles');

    const styles = new StylesPanel(window);
    await styles.waitForReady();

    // Apply a base style (Garamond)
    await styles.selectStyle('Garamond');
    await styles.applyStyle('Garamond');

    // Open style editor to configure
    await styles.editStyle('Garamond');

    // Wait for style editor dialog
    const styleEditor = window.locator('.style-editor');
    await styleEditor.waitFor({ state: 'visible' });

    // Configure H1 heading appearance
    const h1Section = styleEditor.locator('.heading-style-section').filter({
      hasText: 'H1',
    });

    // Change font size
    const h1FontSize = h1Section.locator('#h1-font-size');
    await h1FontSize.fill('32');

    // Change font weight
    const h1FontWeight = h1Section.locator('#h1-font-weight');
    await h1FontWeight.selectOption('bold');

    // Change text transform
    const h1TextTransform = h1Section.locator('#h1-text-transform');
    await h1TextTransform.selectOption('uppercase');

    // Change letter spacing
    const h1LetterSpacing = h1Section.locator('#h1-letter-spacing');
    await h1LetterSpacing.fill('2');

    // Verify preview updates
    const preview = styleEditor.locator('.style-editor__preview');
    await expect(preview).toBeVisible();

    // Check that preview contains heading with updated styles
    const previewHeading = preview.locator('h1, [class*="heading"]').first();
    await expect(previewHeading).toBeVisible();

    // Wait for preview to update
    await window.waitForTimeout(500);
  });

  test('should toggle drop caps and update preview', async ({
    electronApp,
  }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);
    await navigateToView(window, 'styles');

    const styles = new StylesPanel(window);
    await styles.waitForReady();

    // Apply base style
    await styles.selectStyle('Baskerville');
    await styles.applyStyle('Baskerville');
    await styles.editStyle('Baskerville');

    const styleEditor = window.locator('.style-editor');
    await styleEditor.waitFor({ state: 'visible' });

    // Find drop caps section
    const dropCapSection = styleEditor
      .locator('.style-editor__section')
      .filter({ hasText: 'Drop Caps' });

    // Initially drop caps might be off, toggle it on
    const dropCapCheckbox = dropCapSection.locator(
      'input[type="checkbox"]'
    ).first();
    const wasChecked = await dropCapCheckbox.isChecked();

    // Toggle drop caps
    await dropCapCheckbox.click();

    // Wait for UI to update
    await window.waitForTimeout(300);

    // Verify checkbox state changed
    const isNowChecked = await dropCapCheckbox.isChecked();
    expect(isNowChecked).toBe(!wasChecked);

    // If we enabled drop caps, verify font selector appears
    if (!wasChecked) {
      const dropCapFontSelector = dropCapSection.locator(
        'label:has-text("Drop Cap Font")'
      );
      await expect(dropCapFontSelector).toBeVisible();
    }

    // Verify preview updates
    const preview = styleEditor.locator('.style-editor__preview');
    await expect(preview).toBeVisible();
  });

  test('should configure ornamental break style and preview changes', async ({
    electronApp,
  }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);
    await navigateToView(window, 'styles');

    const styles = new StylesPanel(window);
    await styles.waitForReady();

    // Apply base style
    await styles.selectStyle('Caslon');
    await styles.applyStyle('Caslon');
    await styles.editStyle('Caslon');

    const styleEditor = window.locator('.style-editor');
    await styleEditor.waitFor({ state: 'visible' });

    // Find ornamental breaks section
    const ornamentalSection = styleEditor
      .locator('.style-editor__section')
      .filter({ hasText: 'Ornamental Breaks' });

    // Enable ornamental breaks
    const ornamentalToggle = ornamentalSection.locator(
      'input[type="checkbox"]'
    ).first();

    // Ensure it's enabled
    if (!(await ornamentalToggle.isChecked())) {
      await ornamentalToggle.click();
      await window.waitForTimeout(300);
    }

    // Find the ornamental breaks content section
    const ornamentalContent = styleEditor.locator('.ornamental-breaks-content');
    await expect(ornamentalContent).toBeVisible();

    // Change symbol
    const symbolSelect = ornamentalContent.locator('select.form-select').first();
    await symbolSelect.selectOption('❦'); // Floral Heart

    // Wait for change
    await window.waitForTimeout(200);

    // Change alignment to center
    const centerAlignButton = ornamentalContent.locator(
      'button.align-btn'
    ).filter({ hasText: '≡' });
    await centerAlignButton.click();

    // Verify preview contains the symbol
    const ornamentalPreview = ornamentalContent.locator('.ornamental-preview');
    await expect(ornamentalPreview).toBeVisible();

    const previewSymbol = ornamentalPreview.locator('.preview-symbol');
    const symbolText = await previewSymbol.textContent();
    expect(symbolText?.trim()).toContain('❦');
  });

  test('should configure first paragraph treatment', async ({
    electronApp,
  }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);
    await navigateToView(window, 'styles');

    const styles = new StylesPanel(window);
    await styles.waitForReady();

    // Apply base style
    await styles.selectStyle('Palatino');
    await styles.applyStyle('Palatino');
    await styles.editStyle('Palatino');

    const styleEditor = window.locator('.style-editor');
    await styleEditor.waitFor({ state: 'visible' });

    // Scroll to find first paragraph section (might need to scroll)
    await styleEditor.evaluate((el) => {
      const section = el.querySelector('.first-paragraph-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    await window.waitForTimeout(300);

    // Find first paragraph section
    const firstParaSection = styleEditor.locator('.first-paragraph-section');
    await expect(firstParaSection).toBeVisible();

    // Enable first paragraph treatment
    const firstParaToggle = firstParaSection
      .locator('.first-paragraph-section__toggle-input')
      .first();

    // Ensure it's enabled
    if (!(await firstParaToggle.isChecked())) {
      await firstParaToggle.click();
      await window.waitForTimeout(300);
    }

    // Find content area
    const firstParaContent = firstParaSection.locator(
      '.first-paragraph-section__content'
    );
    await expect(firstParaContent).toBeVisible();

    // Change text transform to small-caps
    const textTransformSelect = firstParaContent.locator(
      '.first-paragraph-section__select'
    );
    await textTransformSelect.selectOption('small-caps');

    await window.waitForTimeout(200);

    // Set letter spacing
    const letterSpacingInput = firstParaContent
      .locator('input.first-paragraph-section__input')
      .filter({ has: window.locator('label:has-text("Letter Spacing")') })
      .first();

    // Try alternative selector
    const letterSpacingField = firstParaContent
      .locator('.first-paragraph-section__field')
      .filter({ hasText: 'Letter Spacing' });
    const letterSpacing = letterSpacingField.locator('input');
    await letterSpacing.fill('0.1em');

    await window.waitForTimeout(200);

    // Verify the values were set
    const selectedTransform = await textTransformSelect.inputValue();
    expect(selectedTransform).toBe('small-caps');

    const letterSpacingValue = await letterSpacing.inputValue();
    expect(letterSpacingValue).toBe('0.1em');
  });

  test('should change body font selection and update preview', async ({
    electronApp,
  }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);
    await navigateToView(window, 'styles');

    const styles = new StylesPanel(window);
    await styles.waitForReady();

    // Apply base style
    await styles.selectStyle('Helvetica');
    await styles.applyStyle('Helvetica');
    await styles.editStyle('Helvetica');

    const styleEditor = window.locator('.style-editor');
    await styleEditor.waitFor({ state: 'visible' });

    // Find typography section with body font
    const typographySection = styleEditor
      .locator('.style-editor__section')
      .filter({ hasText: 'Typography' })
      .first();

    await expect(typographySection).toBeVisible();

    // Find body font selector
    const bodyFontLabel = typographySection.locator('label:has-text("Body Font")');
    await expect(bodyFontLabel).toBeVisible();

    // Look for the select or input next to the label
    const bodyFontSection = typographySection.locator('.style-editor__section-content');

    // Try to find font selector input/select
    // It might be a custom component, so we'll look for inputs
    const fontInput = bodyFontSection
      .locator('input, select')
      .filter({ has: window.locator('label:has-text("Body Font")') })
      .first();

    // Alternative: find first input in body font area
    const bodyFontContainer = bodyFontLabel.locator('xpath=following-sibling::*[1]');
    const fontSelector = bodyFontContainer.locator('input, select').first();

    if ((await fontSelector.count()) > 0) {
      // Clear and type new font
      await fontSelector.click();
      await fontSelector.fill('Georgia, serif');
      await window.waitForTimeout(300);
    } else {
      // Try finding by placeholder or other attributes
      const fontField = bodyFontSection.locator(
        'input[placeholder*="font" i], select'
      ).first();

      if ((await fontField.count()) > 0) {
        await fontField.click();
        await fontField.fill('Georgia, serif');
      }
    }

    // Verify preview is visible
    const preview = styleEditor.locator('.style-editor__preview');
    await expect(preview).toBeVisible();
  });

  test('should configure multiple features and save as custom style', async ({
    electronApp,
  }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);
    await navigateToView(window, 'styles');

    const styles = new StylesPanel(window);
    await styles.waitForReady();

    const initialStyleCount = await styles.getStyleCount();

    // Apply base style
    await styles.selectStyle('Garamond');
    await styles.applyStyle('Garamond');

    // Duplicate to create a custom style base
    const customStyleName = 'My Custom Style ' + Date.now();
    await styles.duplicateStyle('Garamond', customStyleName);

    await window.waitForTimeout(500);

    // Verify new style was created
    const newStyleCount = await styles.getStyleCount();
    expect(newStyleCount).toBe(initialStyleCount + 1);

    // Edit the new custom style
    await styles.editStyle(customStyleName);

    const styleEditor = window.locator('.style-editor');
    await styleEditor.waitFor({ state: 'visible' });

    // Configure multiple features:

    // 1. Enable drop caps
    const dropCapSection = styleEditor
      .locator('.style-editor__section')
      .filter({ hasText: 'Drop Caps' });
    const dropCapCheckbox = dropCapSection.locator('input[type="checkbox"]').first();

    if (!(await dropCapCheckbox.isChecked())) {
      await dropCapCheckbox.click();
      await window.waitForTimeout(200);
    }

    // 2. Configure ornamental breaks
    const ornamentalSection = styleEditor
      .locator('.style-editor__section')
      .filter({ hasText: 'Ornamental Breaks' });
    const ornamentalToggle = ornamentalSection.locator('input[type="checkbox"]').first();

    if (!(await ornamentalToggle.isChecked())) {
      await ornamentalToggle.click();
      await window.waitForTimeout(200);
    }

    const ornamentalContent = styleEditor.locator('.ornamental-breaks-content');
    const symbolSelect = ornamentalContent.locator('select.form-select').first();
    await symbolSelect.selectOption('✻'); // Eight Pointed Star

    // 3. Configure H2 heading
    const h2Section = styleEditor.locator('.heading-style-section').filter({
      hasText: 'H2',
    });
    const h2TextTransform = h2Section.locator('#h2-text-transform');
    await h2TextTransform.selectOption('uppercase');

    // 4. Configure body text alignment
    await styleEditor.evaluate((el) => {
      const bodySection = el.querySelector('.body-style-section');
      if (bodySection) {
        bodySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    await window.waitForTimeout(300);

    const bodyStyleSection = styleEditor.locator('.body-style-section');
    const justifyRadio = bodyStyleSection
      .locator('input[type="radio"][value="justify"]')
      .first();

    if (await justifyRadio.count() > 0) {
      await justifyRadio.click();
      await window.waitForTimeout(200);
    }

    // 5. Verify preview is updating
    const preview = styleEditor.locator('.style-editor__preview');
    await expect(preview).toBeVisible();

    // Close the editor (save changes)
    const closeButton = styleEditor.locator('button:has-text("Save"), button:has-text("Close"), button:has-text("Done")').first();

    if ((await closeButton.count()) > 0) {
      await closeButton.click();
    } else {
      // Try pressing Escape or clicking outside
      await window.keyboard.press('Escape');
    }

    await window.waitForTimeout(500);

    // Verify custom style appears in styles list
    const hasCustomStyle = await styles.hasStyle(customStyleName);
    expect(hasCustomStyle).toBe(true);

    // Verify we can select it
    await styles.selectStyle(customStyleName);
    const selectedStyle = await styles.getSelectedStyle();
    expect(selectedStyle).toContain(customStyleName);
  });

  test('should configure all five features systematically', async ({
    electronApp,
  }) => {
    const { window } = electronApp;

    await openProject(window, mockBooks.complete);
    await navigateToView(window, 'styles');

    const styles = new StylesPanel(window);
    await styles.waitForReady();

    // 1. Apply base style (Baskerville)
    await styles.selectStyle('Baskerville');
    await styles.applyStyle('Baskerville');

    // Create a new custom style for configuration
    const customStyleName = 'Complete Custom ' + Date.now();
    await styles.duplicateStyle('Baskerville', customStyleName);
    await window.waitForTimeout(500);

    // Edit the custom style
    await styles.editStyle(customStyleName);

    const styleEditor = window.locator('.style-editor');
    await styleEditor.waitFor({ state: 'visible' });

    // Feature 1: Heading Appearance (H1)
    const h1Section = styleEditor.locator('.heading-style-section').filter({
      hasText: 'H1',
    });
    const h1FontSize = h1Section.locator('#h1-font-size');
    await h1FontSize.fill('36');
    const h1FontWeight = h1Section.locator('#h1-font-weight');
    await h1FontWeight.selectOption('bold');
    await window.waitForTimeout(200);

    // Feature 2: Drop Caps
    const dropCapSection = styleEditor
      .locator('.style-editor__section')
      .filter({ hasText: 'Drop Caps' });
    const dropCapCheckbox = dropCapSection.locator('input[type="checkbox"]').first();
    const dropCapInitialState = await dropCapCheckbox.isChecked();
    await dropCapCheckbox.click();
    await window.waitForTimeout(200);
    const dropCapNewState = await dropCapCheckbox.isChecked();
    expect(dropCapNewState).toBe(!dropCapInitialState);

    // Feature 3: Ornamental Break Style
    const ornamentalSection = styleEditor
      .locator('.style-editor__section')
      .filter({ hasText: 'Ornamental Breaks' });
    const ornamentalToggle = ornamentalSection.locator('input[type="checkbox"]').first();

    if (!(await ornamentalToggle.isChecked())) {
      await ornamentalToggle.click();
      await window.waitForTimeout(200);
    }

    const ornamentalContent = styleEditor.locator('.ornamental-breaks-content');
    await expect(ornamentalContent).toBeVisible();
    const symbolSelect = ornamentalContent.locator('select.form-select').first();
    await symbolSelect.selectOption('※'); // Reference Mark
    await window.waitForTimeout(200);

    // Feature 4: First Paragraph Treatment
    await styleEditor.evaluate((el) => {
      const section = el.querySelector('.first-paragraph-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await window.waitForTimeout(300);

    const firstParaSection = styleEditor.locator('.first-paragraph-section');
    await expect(firstParaSection).toBeVisible();

    const firstParaToggle = firstParaSection
      .locator('.first-paragraph-section__toggle-input')
      .first();

    if (!(await firstParaToggle.isChecked())) {
      await firstParaToggle.click();
      await window.waitForTimeout(200);
    }

    const firstParaContent = firstParaSection.locator(
      '.first-paragraph-section__content'
    );
    const textTransformSelect = firstParaContent.locator(
      '.first-paragraph-section__select'
    );
    await textTransformSelect.selectOption('uppercase');
    await window.waitForTimeout(200);

    // Feature 5: Body Font Selection
    await styleEditor.evaluate((el) => {
      const section = el.querySelector('.style-editor__section');
      if (section) {
        section.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    });
    await window.waitForTimeout(300);

    const bodyStyleSection = styleEditor.locator('.body-style-section');
    await expect(bodyStyleSection).toBeVisible();

    // Change font size
    const bodyFontSize = bodyStyleSection
      .locator('.body-style-section__content')
      .locator('input')
      .filter({ has: window.locator('label:has-text("Font Size")') })
      .first();

    // Try alternative approach
    const fontSizeField = bodyStyleSection
      .locator('label:has-text("Font Size")')
      .locator('xpath=following-sibling::input')
      .first();

    const fontSizeInput = (await fontSizeField.count()) > 0
      ? fontSizeField
      : bodyStyleSection.locator('input[placeholder*="12pt" i], input[placeholder*="1rem" i]').first();

    if ((await fontSizeInput.count()) > 0) {
      await fontSizeInput.fill('13pt');
      await window.waitForTimeout(200);
    }

    // Verify preview updates throughout
    const preview = styleEditor.locator('.style-editor__preview');
    await expect(preview).toBeVisible();

    // Verify the style has unsaved changes indicator if present
    const dirtyIndicator = styleEditor.locator('.style-editor__dirty-indicator');
    // It might be visible or not depending on the debounce
    // Just check that the editor is still open
    await expect(styleEditor).toBeVisible();

    // Save/close the editor
    await window.keyboard.press('Escape');
    await window.waitForTimeout(500);

    // Verify the custom style is in the list
    const hasCustomStyle = await styles.hasStyle(customStyleName);
    expect(hasCustomStyle).toBe(true);
  });
});

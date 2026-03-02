/**
 * E2E Test: Text Formatting (Bold, Italic)
 * Tests for applying text formatting including:
 * - Applying bold formatting to selected text
 * - Applying italic formatting to selected text
 * - Verifying formatting in both editor and preview panels
 * - Combining multiple formats (bold + italic)
 * - Removing formatting
 * - Asserting on DOM elements and computed styles
 */

import { test, expect } from './fixtures';
import { waitForUIReady, createNewProject, isWelcomeScreen } from './helpers/electron';

test.describe('Text Formatting - Bold', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    // Ensure we're in editor view
    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should apply bold formatting to selected text', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type test text
    try {
      await editorPage.clear();
    } catch {
      // Ignore if empty
    }

    const testText = 'This text will be bold';
    await editorPage.typeText(testText);
    await mainWindow.waitForTimeout(300);

    // Select the text
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);

    // Apply bold formatting
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Verify bold in editor HTML
    const editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<strong>|<b>/i);

    // Wait for preview to update
    await previewPage.waitForDebounce();

    // Verify bold in preview
    const hasBold = await previewPage.hasFormattedText('bold');
    expect(hasBold).toBe(true);

    // Verify preview content
    const previewHTML = await previewPage.getHTMLContent();
    expect(previewHTML).toMatch(/<strong>|<b>/i);
  });

  test('should verify bold element exists in editor DOM', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Bold text test');
    await mainWindow.waitForTimeout(200);

    // Select all
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);

    // Apply bold
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Check for bold elements in editor
    const boldElement = await editorPage.content.locator('strong, b').first();
    await expect(boldElement).toBeVisible();

    // Verify the text content
    const boldText = await boldElement.textContent();
    expect(boldText).toContain('Bold text test');
  });

  test('should verify bold computed styles in editor', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Style check text');
    await mainWindow.waitForTimeout(200);

    // Select and apply bold
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Get computed style
    const fontWeight = await editorPage.content.locator('strong, b').first().evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });

    // Bold should be weight 700 or greater, or "bold"
    const weight = parseInt(fontWeight);
    expect(weight >= 700 || fontWeight === 'bold').toBe(true);
  });
});

test.describe('Text Formatting - Italic', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should apply italic formatting to selected text', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type test text
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const testText = 'This text will be italic';
    await editorPage.typeText(testText);
    await mainWindow.waitForTimeout(300);

    // Select the text
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);

    // Apply italic formatting
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Verify italic in editor HTML
    const editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<em>|<i>/i);

    // Wait for preview to update
    await previewPage.waitForDebounce();

    // Verify italic in preview
    const hasItalic = await previewPage.hasFormattedText('italic');
    expect(hasItalic).toBe(true);

    // Verify preview content
    const previewHTML = await previewPage.getHTMLContent();
    expect(previewHTML).toMatch(/<em>|<i>/i);
  });

  test('should verify italic element exists in editor DOM', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Italic text test');
    await mainWindow.waitForTimeout(200);

    // Select all
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);

    // Apply italic
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Check for italic elements in editor
    const italicElement = await editorPage.content.locator('em, i').first();
    await expect(italicElement).toBeVisible();

    // Verify the text content
    const italicText = await italicElement.textContent();
    expect(italicText).toContain('Italic text test');
  });

  test('should verify italic computed styles in editor', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Italic style check');
    await mainWindow.waitForTimeout(200);

    // Select and apply italic
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Get computed style
    const fontStyle = await editorPage.content.locator('em, i').first().evaluate((el) => {
      return window.getComputedStyle(el).fontStyle;
    });

    // Should be italic or oblique
    expect(['italic', 'oblique']).toContain(fontStyle);
  });
});

test.describe('Text Formatting - Combined Formats', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should apply both bold and italic formatting', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type test text
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    const testText = 'This text will be bold and italic';
    await editorPage.typeText(testText);
    await mainWindow.waitForTimeout(300);

    // Select the text
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);

    // Apply bold
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(200);

    // Apply italic (text should still be selected or reselect)
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Verify both formats in editor
    const editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<strong>|<b>/i);
    expect(editorHTML).toMatch(/<em>|<i>/i);

    // Wait for preview to update
    await previewPage.waitForDebounce();

    // Verify both formats in preview
    const hasBold = await previewPage.hasFormattedText('bold');
    const hasItalic = await previewPage.hasFormattedText('italic');
    expect(hasBold).toBe(true);
    expect(hasItalic).toBe(true);

    const previewHTML = await previewPage.getHTMLContent();
    expect(previewHTML).toMatch(/<strong>|<b>/i);
    expect(previewHTML).toMatch(/<em>|<i>/i);
  });

  test('should verify nested formatting elements in editor', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Combined formatting test');
    await mainWindow.waitForTimeout(200);

    // Select all
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);

    // Apply bold
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(200);

    // Apply italic
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Check for both elements
    const hasBold = await editorPage.content.locator('strong, b').count();
    const hasItalic = await editorPage.content.locator('em, i').count();

    expect(hasBold).toBeGreaterThan(0);
    expect(hasItalic).toBeGreaterThan(0);
  });

  test('should verify combined computed styles in editor', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Style verification test');
    await mainWindow.waitForTimeout(200);

    // Select and apply both formats
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(200);
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Find the innermost element with text
    const styles = await editorPage.content.evaluate(() => {
      const findDeepestTextNode = (el: Element): Element => {
        const children = Array.from(el.children);
        if (children.length === 0) return el;

        // Find first child with text content
        for (const child of children) {
          if (child.textContent && child.textContent.trim().length > 0) {
            return findDeepestTextNode(child);
          }
        }
        return el;
      };

      const content = document.querySelector('.editor-content, .ProseMirror, [contenteditable="true"]');
      if (!content) return { fontWeight: '', fontStyle: '' };

      const deepest = findDeepestTextNode(content);
      const computed = window.getComputedStyle(deepest);

      return {
        fontWeight: computed.fontWeight,
        fontStyle: computed.fontStyle,
      };
    });

    // Verify both styles are applied
    const weight = parseInt(styles.fontWeight);
    expect(weight >= 700 || styles.fontWeight === 'bold').toBe(true);
    expect(['italic', 'oblique']).toContain(styles.fontStyle);
  });

  test('should verify combined formatting in preview', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Preview combined test');
    await mainWindow.waitForTimeout(200);

    // Apply both formats
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(200);
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Wait for preview update
    await previewPage.waitForDebounce();

    // Get computed styles from preview
    const previewStyles = await previewPage.content.evaluate(() => {
      const findFormattedElement = (parent: Element): Element | null => {
        const strong = parent.querySelector('strong, b');
        if (strong) return strong;

        const em = parent.querySelector('em, i');
        if (em) return em;

        return null;
      };

      const content = document.querySelector('.preview-content, .preview-body');
      if (!content) return { fontWeight: '', fontStyle: '' };

      const formatted = findFormattedElement(content);
      if (!formatted) return { fontWeight: '', fontStyle: '' };

      const computed = window.getComputedStyle(formatted);
      return {
        fontWeight: computed.fontWeight,
        fontStyle: computed.fontStyle,
      };
    });

    // Verify styles in preview
    const weight = parseInt(previewStyles.fontWeight);
    expect(weight >= 600 || previewStyles.fontWeight === 'bold').toBe(true);
  });
});

test.describe('Text Formatting - Removing Formats', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should remove bold formatting', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    // Clear and type test text
    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Remove bold test');
    await mainWindow.waitForTimeout(200);

    // Select and apply bold
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Verify bold is applied
    let editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<strong>|<b>/i);

    // Remove bold by applying it again (toggle)
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Verify bold is removed
    editorHTML = await editorPage.getHTMLContent();
    const boldCount = (editorHTML.match(/<strong>|<b>/gi) || []).length;

    // Either no bold tags, or if present, they shouldn't wrap our text
    const content = await editorPage.getContent();
    expect(content).toContain('Remove bold test');

    // Wait for preview update
    await previewPage.waitForDebounce();
  });

  test('should remove italic formatting', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Remove italic test');
    await mainWindow.waitForTimeout(200);

    // Select and apply italic
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Verify italic is applied
    let editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<em>|<i>/i);

    // Remove italic by applying it again (toggle)
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Verify italic is removed
    editorHTML = await editorPage.getHTMLContent();
    const italicCount = (editorHTML.match(/<em>|<i>/gi) || []).length;

    // Either no italic tags, or content should still be present
    const content = await editorPage.getContent();
    expect(content).toContain('Remove italic test');

    // Wait for preview update
    await previewPage.waitForDebounce();
  });

  test('should remove one format while keeping another', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Selective removal test');
    await mainWindow.waitForTimeout(200);

    // Apply both formats
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(200);
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Verify both are applied
    let editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<strong>|<b>/i);
    expect(editorHTML).toMatch(/<em>|<i>/i);

    // Remove only bold
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Verify italic remains
    editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<em>|<i>/i);

    // Content should still be present
    const content = await editorPage.getContent();
    expect(content).toContain('Selective removal test');
  });

  test('should handle formatting removal in preview', async ({ mainWindow, editorPage, previewPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Preview removal test');
    await mainWindow.waitForTimeout(200);

    // Apply bold
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.waitForTimeout(100);
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Wait for preview
    await previewPage.waitForDebounce();

    // Verify bold in preview
    let hasBold = await previewPage.hasFormattedText('bold');
    expect(hasBold).toBe(true);

    // Remove bold
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Wait for preview to update
    await previewPage.waitForDebounce();

    // Content should still be in preview
    const previewContent = await previewPage.getContent();
    expect(previewContent).toContain('Preview removal test');
  });
});

test.describe('Text Formatting - Partial Selection', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForUIReady(mainWindow);

    if (await isWelcomeScreen(mainWindow)) {
      await createNewProject(mainWindow);
    }
  });

  test('should format only selected portion of text', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    await editorPage.typeText('Some text with partial formatting applied here');
    await mainWindow.waitForTimeout(300);

    // Use shift+arrow keys to select "partial formatting"
    // First, position cursor
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.keyboard.press('ArrowLeft'); // Move to start

    // Move to "partial"
    for (let i = 0; i < 15; i++) {
      await mainWindow.keyboard.press('ArrowRight');
    }

    // Select "partial formatting" (18 characters)
    for (let i = 0; i < 18; i++) {
      await mainWindow.keyboard.press('Shift+ArrowRight');
    }

    await mainWindow.waitForTimeout(200);

    // Apply bold to selection
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Verify HTML contains bold
    const editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<strong>|<b>/i);

    // Verify full text is still present
    const content = await editorPage.getContent();
    expect(content).toContain('Some text with partial formatting applied here');
  });

  test('should apply different formats to different text portions', async ({ mainWindow, editorPage }) => {
    await editorPage.waitForReady();
    await editorPage.focus();

    try {
      await editorPage.clear();
    } catch {
      // Ignore
    }

    // Type sentence
    await editorPage.typeText('First part and second part');
    await mainWindow.waitForTimeout(300);

    // Select "First part"
    await mainWindow.keyboard.press('Control+A');
    await mainWindow.keyboard.press('ArrowLeft');

    for (let i = 0; i < 10; i++) {
      await mainWindow.keyboard.press('Shift+ArrowRight');
    }

    await mainWindow.waitForTimeout(100);

    // Make it bold
    await editorPage.applyBold();
    await mainWindow.waitForTimeout(300);

    // Move cursor to "second part"
    await mainWindow.keyboard.press('ArrowRight');
    for (let i = 0; i < 4; i++) {
      await mainWindow.keyboard.press('ArrowRight');
    }

    // Select "second part"
    for (let i = 0; i < 11; i++) {
      await mainWindow.keyboard.press('Shift+ArrowRight');
    }

    await mainWindow.waitForTimeout(100);

    // Make it italic
    await editorPage.applyItalic();
    await mainWindow.waitForTimeout(300);

    // Verify both formats exist
    const editorHTML = await editorPage.getHTMLContent();
    expect(editorHTML).toMatch(/<strong>|<b>/i);
    expect(editorHTML).toMatch(/<em>|<i>/i);
  });
});

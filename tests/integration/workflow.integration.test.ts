/**
 * Integration Tests - Complete Workflows
 *
 * Tests end-to-end user workflows for the book styles system:
 * 1. Author selects and applies a style
 * 2. Author customizes style features
 * 3. Author switches between styles with instant preview
 * 4. Author saves custom style for reuse
 */

import { BookStyle } from '../../src/types/style';
import {
  allStyles,
  getStyleById,
  getStylesByCategory,
} from '../../src/data/styles';
import {
  applyStyleToBook,
  generateStylePreview,
  saveCustomStyle,
  loadCustomStyles,
  updateCustomStyle,
  deleteCustomStyle,
  getAllStyles,
} from '../../src/services/styleService';
import {
  mergeStyles,
  clearStyleCaches,
  applyStylesToChapter,
} from '../../src/services/style-engine';
import {
  createSampleBook,
  createTestBook,
  deepClone,
  isEqual,
} from './helpers/test-data';

describe('Complete Workflow Integration Tests', () => {
  beforeEach(() => {
    clearStyleCaches();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    clearStyleCaches();
  });

  // ============================================================================
  // WORKFLOW 1: Browse and Apply Style
  // ============================================================================

  describe('Workflow: Browse and Apply Style', () => {
    test('Author browses styles by category and applies one', async () => {
      // Step 1: Author creates a new book
      const book = createSampleBook('novel-1', 5);
      expect(book.chapters.length).toBe(5);

      // Step 2: Author browses serif styles
      const serifStyles = getStylesByCategory('serif');
      expect(serifStyles.length).toBeGreaterThan(0);

      // Step 3: Author views Garamond style details
      const garamond = getStyleById('garamond')!;
      expect(garamond.name).toBe('Garamond Elegance');
      expect(garamond.description).toContain('old-style serif');

      // Step 4: Author generates preview
      const preview = await generateStylePreview(book, garamond);
      expect(preview).toBeDefined();
      expect(preview?.chapters.length).toBe(5);

      // Step 5: Author is satisfied and applies the style
      const result = await applyStyleToBook(book, garamond);
      expect(result.success).toBe(true);
      expect(result.appliedStyleId).toBe('garamond');

      // Step 6: Verify the book is styled
      const styledBook = result.book!;
      styledBook.chapters.forEach(chapter => {
        expect(chapter.style).toBeDefined();
        chapter.content.forEach(block => {
          expect(block.style?.styleId).toBeDefined();
        });
      });
    });

    test('Author compares multiple styles before choosing', async () => {
      const book = createSampleBook('novel-2', 3);

      // Author generates previews for multiple styles
      const stylesToCompare = ['garamond', 'baskerville', 'caslon'];
      const previews = await Promise.all(
        stylesToCompare.map(id => generateStylePreview(book, id))
      );

      // All previews should be valid
      expect(previews.length).toBe(3);
      previews.forEach(preview => {
        expect(preview).toBeDefined();
        expect(preview?.styles.length).toBeGreaterThan(0);
      });

      // Author chooses Baskerville
      const finalChoice = await applyStyleToBook(book, 'baskerville');
      expect(finalChoice.success).toBe(true);
      expect(finalChoice.appliedStyleId).toBe('baskerville');
    });

    test('Author explores different style categories', async () => {
      const book = createSampleBook('tech-book', 3);

      // Browse serif styles
      const serifStyles = getStylesByCategory('serif');
      expect(serifStyles.length).toBeGreaterThan(0);

      // Browse sans-serif styles
      const sansSerifStyles = getStylesByCategory('sans-serif');
      expect(sansSerifStyles.length).toBeGreaterThan(0);

      // Try a modern style
      const modernStyles = getStylesByCategory('modern');
      if (modernStyles.length > 0) {
        const result = await applyStyleToBook(book, modernStyles[0].id);
        expect(result.success).toBe(true);
      }
    });
  });

  // ============================================================================
  // WORKFLOW 2: Customize Style Features
  // ============================================================================

  describe('Workflow: Customize Style Features', () => {
    test('Author customizes color scheme', async () => {
      const book = createSampleBook('custom-colors', 2);

      // Start with Garamond
      const garamond = getStyleById('garamond')!;

      // Customize colors
      const customColors: Partial<BookStyle> = {
        colors: {
          text: '#2c3e50',
          heading: '#1a252f',
          accent: '#e74c3c',
          background: '#ecf0f1',
        },
      };

      const customized = mergeStyles(garamond, customColors);

      // Apply customized style
      const result = await applyStyleToBook(book, customized);
      expect(result.success).toBe(true);

      // Verify colors are applied
      const styledBook = result.book!;
      const bodyStyle = styledBook.styles.find(s => s.id.includes('body'));
      expect(bodyStyle?.color).toBe('#2c3e50');
    });

    test('Author adjusts typography settings', async () => {
      const book = createSampleBook('custom-typography', 2);
      const helvetica = getStyleById('helvetica')!;

      // Customize typography
      const customTypography: Partial<BookStyle> = {
        body: {
          fontSize: '1.2em',
          lineHeight: '1.9',
          textAlign: 'left',
        },
        spacing: {
          paragraphSpacing: '1.5em',
          lineHeight: '1.9',
          sectionSpacing: '4em',
          chapterSpacing: '7em',
        },
      };

      const customized = mergeStyles(helvetica, customTypography);
      const result = await applyStyleToBook(book, customized);

      expect(result.success).toBe(true);
      const bodyStyle = result.book!.styles.find(s => s.id.includes('body'));
      expect(bodyStyle?.fontSize).toBe(1.2);
      expect(bodyStyle?.lineHeight).toBe(1.9);
    });

    test('Author enables/disables drop caps', async () => {
      const book = createSampleBook('drop-cap-test', 2);
      const garamond = getStyleById('garamond')!;

      // Test with drop caps enabled
      const withDropCap = mergeStyles(garamond, {
        dropCap: {
          enabled: true,
          lines: 4,
          fontSize: '5em',
          fontWeight: 'bold',
          color: '#8b4513',
          marginRight: '0.15em',
        },
      });

      const result1 = await applyStyleToBook(book, withDropCap);
      expect(result1.success).toBe(true);
      expect(result1.book!.styles.some(s => s.id.includes('drop-cap'))).toBe(true);

      // Test with drop caps disabled
      const withoutDropCap = mergeStyles(garamond, {
        dropCap: {
          ...garamond.dropCap,
          enabled: false,
        },
      });

      const result2 = await applyStyleToBook(book, withoutDropCap);
      expect(result2.success).toBe(true);
    });

    test('Author customizes heading hierarchy', async () => {
      const book = createSampleBook('custom-headings', 2);
      const baskerville = getStyleById('baskerville')!;

      // Make h1 more prominent, h2/h3 more subtle
      const customHeadings: Partial<BookStyle> = {
        headings: {
          h1: {
            fontSize: '4em',
            fontWeight: 'bold',
            lineHeight: '1',
            marginTop: '3em',
            marginBottom: '1.5em',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          h2: {
            fontSize: '2em',
            fontWeight: 'normal',
            lineHeight: '1.4',
            marginTop: '2em',
            marginBottom: '0.8em',
            letterSpacing: '0.02em',
          },
          h3: {
            fontSize: '1.4em',
            fontWeight: 'normal',
            lineHeight: '1.5',
            marginTop: '1.5em',
            marginBottom: '0.6em',
          },
        } as any,
      };

      const customized = mergeStyles(baskerville, customHeadings);
      const result = await applyStyleToBook(book, customized);

      expect(result.success).toBe(true);
      const h1Style = result.book!.styles.find(s => s.id.includes('h1'));
      expect(h1Style?.fontSize).toBe(4);
    });

    test('Author customizes ornamental breaks', async () => {
      const book = createSampleBook('custom-breaks', 2);
      const garamond = getStyleById('garamond')!;

      // Change ornamental break symbol
      const customBreaks: Partial<BookStyle> = {
        ornamentalBreak: {
          enabled: true,
          symbol: '❦',
          spacing: '3em',
          fontSize: '1.5em',
        },
      };

      const customized = mergeStyles(garamond, customBreaks);
      expect(customized.ornamentalBreak.symbol).toBe('❦');
      expect(customized.ornamentalBreak.enabled).toBe(true);
    });
  });

  // ============================================================================
  // WORKFLOW 3: Instant Style Switching
  // ============================================================================

  describe('Workflow: Instant Style Switching', () => {
    test('Author rapidly switches between styles', async () => {
      const book = createSampleBook('style-switching', 3);

      // Apply multiple styles in sequence
      const styleSequence = ['garamond', 'helvetica', 'baskerville', 'caslon'];
      let currentBook = book;

      for (const styleId of styleSequence) {
        const result = await applyStyleToBook(currentBook, styleId);
        expect(result.success).toBe(true);
        expect(result.appliedStyleId).toBe(styleId);
        currentBook = result.book!;
      }

      // Final book should have last style applied
      const lastStyle = currentBook.styles.find(s => s.name.includes('Caslon'));
      expect(lastStyle).toBeDefined();
    });

    test('Author previews multiple styles without applying', async () => {
      const book = createSampleBook('preview-only', 2);
      const originalBook = deepClone(book);

      // Generate many previews
      const styleIds = ['garamond', 'baskerville', 'helvetica', 'caslon', 'didot'];
      const previews = await Promise.all(
        styleIds.map(id => generateStylePreview(book, id))
      );

      // All previews should exist
      expect(previews.every(p => p !== null)).toBe(true);

      // Original book should be unchanged
      expect(isEqual(book, originalBook)).toBe(true);
    });

    test('Author switches style and immediately sees preview update', async () => {
      const book = createSampleBook('instant-preview', 1);

      // Apply initial style
      const result1 = await applyStyleToBook(book, 'garamond');
      expect(result1.success).toBe(true);

      // Instantly switch to new style
      const result2 = await applyStyleToBook(result1.book!, 'helvetica');
      expect(result2.success).toBe(true);
      expect(result2.appliedStyleId).toBe('helvetica');

      // Verify style changed
      const helveticaStyle = result2.book!.styles.find(s => s.name.includes('Helvetica'));
      expect(helveticaStyle).toBeDefined();
    });

    test('Author compares serif vs sans-serif instantly', async () => {
      const book = createSampleBook('serif-vs-sans', 2);

      // Try serif
      const serifResult = await applyStyleToBook(book, 'garamond');
      expect(serifResult.success).toBe(true);

      // Switch to sans-serif
      const sansResult = await applyStyleToBook(serifResult.book!, 'helvetica');
      expect(sansResult.success).toBe(true);

      // Verify different font families
      const serifFont = serifResult.book!.styles[0];
      const sansFont = sansResult.book!.styles[0];

      expect(serifFont.fontFamily).not.toBe(sansFont.fontFamily);
    });
  });

  // ============================================================================
  // WORKFLOW 4: Save and Reuse Custom Style
  // ============================================================================

  describe('Workflow: Save and Reuse Custom Style', () => {
    test('Author creates and saves custom style', async () => {
      const book = createSampleBook('my-novel', 3);

      // Start with base style
      const garamond = getStyleById('garamond')!;

      // Customize it extensively
      const myStyle = mergeStyles(garamond, {
        id: 'my-custom-style',
        name: 'My Novel Style',
        description: 'Custom style for my novel',
        colors: {
          text: '#2c3e50',
          heading: '#1a252f',
          accent: '#e74c3c',
          background: '#fafafa',
        },
        body: {
          fontSize: '1.15em',
          lineHeight: '1.85',
          textAlign: 'justify',
        },
        dropCap: {
          enabled: true,
          lines: 5,
          fontSize: '5em',
          fontWeight: 'bold',
          color: '#e74c3c',
          marginRight: '0.12em',
        },
      });

      // Save custom style
      await saveCustomStyle(myStyle);

      // Load custom styles to verify
      const customStyles = await loadCustomStyles();
      const found = customStyles.find(s => s.id === 'my-custom-style');
      expect(found).toBeDefined();
      expect(found?.name).toBe('My Novel Style');

      // Apply the custom style
      const result = await applyStyleToBook(book, myStyle);
      expect(result.success).toBe(true);

      // Cleanup
      await deleteCustomStyle('my-custom-style');
    });

    test('Author reuses saved custom style in new book', async () => {
      // Save a custom style
      const garamond = getStyleById('garamond')!;
      const myStyle = mergeStyles(garamond, {
        id: 'reusable-style',
        name: 'My Reusable Style',
      });

      await saveCustomStyle(myStyle);

      // Create first book and apply style
      const book1 = createSampleBook('book-1', 2);
      const result1 = await applyStyleToBook(book1, myStyle);
      expect(result1.success).toBe(true);

      // Create second book and apply same style
      const book2 = createSampleBook('book-2', 3);
      const result2 = await applyStyleToBook(book2, myStyle);
      expect(result2.success).toBe(true);

      // Both should have same style applied
      expect(result1.appliedStyleId).toBe('reusable-style');
      expect(result2.appliedStyleId).toBe('reusable-style');

      // Cleanup
      await deleteCustomStyle('reusable-style');
    });

    test('Author updates saved custom style', async () => {
      const book = createSampleBook('evolving-book', 2);

      // Create and save initial custom style
      const helvetica = getStyleById('helvetica')!;
      const myStyle = mergeStyles(helvetica, {
        id: 'evolving-style',
        name: 'Evolving Style v1',
        colors: {
          text: '#333333',
          heading: '#000000',
        },
      });

      await saveCustomStyle(myStyle);

      // Apply to book
      const result1 = await applyStyleToBook(book, myStyle);
      expect(result1.success).toBe(true);

      // Update the style
      const updatedStyle = mergeStyles(myStyle, {
        name: 'Evolving Style v2',
        colors: {
          text: '#555555',
          heading: '#222222',
        },
      });

      await updateCustomStyle('evolving-style', updatedStyle);

      // Load and verify update
      const customStyles = await loadCustomStyles();
      const found = customStyles.find(s => s.id === 'evolving-style');
      expect(found?.name).toBe('Evolving Style v2');

      // Apply updated style
      const result2 = await applyStyleToBook(book, found!);
      expect(result2.success).toBe(true);

      // Cleanup
      await deleteCustomStyle('evolving-style');
    });

    test('Author manages multiple custom styles', async () => {
      const book = createSampleBook('multi-style-book', 2);

      // Create multiple custom styles
      const styles = ['garamond', 'baskerville', 'helvetica'].map((baseId, i) => {
        const base = getStyleById(baseId)!;
        return mergeStyles(base, {
          id: `custom-${i + 1}`,
          name: `Custom Style ${i + 1}`,
        });
      });

      // Save all custom styles
      for (const style of styles) {
        await saveCustomStyle(style);
      }

      // Verify all saved
      const customStyles = await loadCustomStyles();
      expect(customStyles.length).toBe(3);

      // Get all styles (built-in + custom)
      const allAvailable = await getAllStyles(allStyles);
      expect(allAvailable.length).toBe(allStyles.length + 3);

      // Apply different custom styles
      for (const style of styles) {
        const result = await applyStyleToBook(book, style);
        expect(result.success).toBe(true);
      }

      // Cleanup
      for (let i = 1; i <= 3; i++) {
        await deleteCustomStyle(`custom-${i}`);
      }
    });
  });

  // ============================================================================
  // WORKFLOW 5: Complex Real-World Scenario
  // ============================================================================

  describe('Workflow: Complex Real-World Scenario', () => {
    test('Complete author workflow from start to finish', async () => {
      // SCENARIO: Author is writing a novel and wants to style it perfectly

      // Step 1: Create the book
      const novel = createSampleBook('great-american-novel', 10);
      expect(novel.chapters.length).toBe(10);

      // Step 2: Browse serif styles (good for novels)
      const serifStyles = getStylesByCategory('serif');
      expect(serifStyles.length).toBeGreaterThan(0);

      // Step 3: Preview top 3 choices
      const topChoices = serifStyles.slice(0, 3);
      const previews = await Promise.all(
        topChoices.map(style => generateStylePreview(novel, style.id))
      );
      expect(previews.every(p => p !== null)).toBe(true);

      // Step 4: Choose Garamond as base
      const garamond = getStyleById('garamond')!;

      // Step 5: Customize for personal preference
      const myNovelStyle = mergeStyles(garamond, {
        id: 'my-novel-style',
        name: 'My Novel Style',
        description: 'Perfect style for my literary fiction',
        colors: {
          text: '#2c2c2c',
          heading: '#1a1a1a',
          accent: '#8b4513',
          background: '#fffef9',
          dropCap: '#8b4513',
        },
        body: {
          fontSize: '1.2em',
          lineHeight: '1.9',
          textAlign: 'justify',
        },
        dropCap: {
          enabled: true,
          lines: 5,
          fontSize: '5.5em',
          fontWeight: '500',
          color: '#8b4513',
          marginRight: '0.15em',
        },
        firstParagraph: {
          enabled: true,
          fontVariant: 'small-caps',
          letterSpacing: '0.1em',
          fontSize: '1em',
        },
        spacing: {
          paragraphSpacing: '1.4em',
          lineHeight: '1.9',
          sectionSpacing: '4em',
          chapterSpacing: '7em',
        },
      });

      // Step 6: Preview the customized style
      const customPreview = await generateStylePreview(novel, myNovelStyle);
      expect(customPreview).toBeDefined();

      // Step 7: Apply to book
      const styledNovel = await applyStyleToBook(novel, myNovelStyle);
      expect(styledNovel.success).toBe(true);

      // Step 8: Verify all chapters are styled
      styledNovel.book!.chapters.forEach((chapter, i) => {
        expect(chapter.style).toBeDefined();
        chapter.content.forEach(block => {
          expect(block.style?.styleId).toBeDefined();
        });
      });

      // Step 9: Save for future use
      await saveCustomStyle(myNovelStyle);

      // Step 10: Verify saved
      const savedStyles = await loadCustomStyles();
      const found = savedStyles.find(s => s.id === 'my-novel-style');
      expect(found).toBeDefined();

      // Step 11: Create a new book in the series, reuse style
      const sequel = createSampleBook('sequel-novel', 8);
      const sequelStyled = await applyStyleToBook(sequel, myNovelStyle);
      expect(sequelStyled.success).toBe(true);

      // Step 12: Decide to tweak the style slightly
      const tweakedStyle = mergeStyles(myNovelStyle, {
        body: {
          ...myNovelStyle.body,
          lineHeight: '2.0', // Slightly more spacing
        },
      });

      await updateCustomStyle('my-novel-style', tweakedStyle);

      // Cleanup
      await deleteCustomStyle('my-novel-style');
    });
  });
});

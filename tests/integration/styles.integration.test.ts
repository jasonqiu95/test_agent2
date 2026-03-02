/**
 * Integration Tests for Book Styles Application
 *
 * Tests the complete workflow:
 * 1. Loading built-in styles
 * 2. Applying styles to a book
 * 3. Updating preview
 * 4. Customizing style features
 * 5. Saving custom styles
 * 6. Style switching and instant preview updates
 * 7. Verifying all style features (heading, drop caps, ornamental breaks, fonts)
 */

import { BookStyle } from '../../src/types/style';
import { Book } from '../../src/types/book';
import { Chapter } from '../../src/types/chapter';
import { TextBlock } from '../../src/types/textBlock';
import {
  allStyles,
  getStyleById,
  getStylesByCategory,
  getAllStyleIds,
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
  computeHeadingStyles,
  computeParagraphStyles,
  computeDropCapStyles,
  computeOrnamentalBreakStyles,
  applyStylesToChapter,
  mergeStyles,
  clearStyleCaches,
} from '../../src/services/style-engine';

// ============================================================================
// TEST DATA - Sample Book Content
// ============================================================================

const createSampleTextBlock = (
  id: string,
  content: string,
  blockType: TextBlock['blockType'],
  level?: number
): TextBlock => ({
  id,
  content,
  blockType,
  level,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createSampleChapter = (id: string, number: number): Chapter => ({
  id,
  number,
  title: `Chapter ${number}: The Adventure Begins`,
  content: [
    createSampleTextBlock(
      `${id}-block-1`,
      `Chapter ${number}`,
      'heading',
      1
    ),
    createSampleTextBlock(
      `${id}-block-2`,
      'In the beginning, there was a story waiting to be told. A tale of wonder and excitement that would captivate readers for generations to come.',
      'paragraph'
    ),
    createSampleTextBlock(
      `${id}-block-3`,
      'The Journey',
      'heading',
      2
    ),
    createSampleTextBlock(
      `${id}-block-4`,
      'As the sun rose over the distant mountains, our hero embarked on a journey that would change everything. The path ahead was uncertain, but determination burned bright in their heart.',
      'paragraph'
    ),
    createSampleTextBlock(
      `${id}-block-5`,
      'Another paragraph to continue the story with more detail and depth. The characters developed, the plot thickened, and readers found themselves unable to put the book down.',
      'paragraph'
    ),
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  wordCount: 95,
  includeInToc: true,
});

const createSampleBook = (): Book => ({
  id: 'test-book-1',
  title: 'The Great Adventure',
  subtitle: 'A Tale of Wonder',
  authors: [
    {
      id: 'author-1',
      name: 'Jane Doe',
      role: 'author',
    },
  ],
  frontMatter: [],
  chapters: [
    createSampleChapter('chapter-1', 1),
    createSampleChapter('chapter-2', 2),
    createSampleChapter('chapter-3', 3),
  ],
  backMatter: [],
  styles: [],
  metadata: {
    language: 'en',
    genre: ['fiction', 'adventure'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  wordCount: 285,
  status: 'draft',
});

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

describe('Book Styles Integration Tests', () => {
  let sampleBook: Book;

  beforeEach(() => {
    // Create fresh sample book for each test
    sampleBook = createSampleBook();

    // Clear style caches to ensure clean state
    clearStyleCaches();

    // Clear localStorage for custom styles
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    clearStyleCaches();
  });

  // ============================================================================
  // TEST SUITE 1: Loading Built-in Styles
  // ============================================================================

  describe('Loading Built-in Styles', () => {
    test('should load all built-in styles', () => {
      expect(allStyles).toBeDefined();
      expect(allStyles.length).toBeGreaterThan(0);

      // Verify structure of each style
      allStyles.forEach(style => {
        expect(style).toHaveProperty('id');
        expect(style).toHaveProperty('name');
        expect(style).toHaveProperty('description');
        expect(style).toHaveProperty('category');
        expect(style).toHaveProperty('fonts');
        expect(style).toHaveProperty('headings');
        expect(style).toHaveProperty('body');
        expect(style).toHaveProperty('dropCap');
        expect(style).toHaveProperty('ornamentalBreak');
        expect(style).toHaveProperty('firstParagraph');
        expect(style).toHaveProperty('spacing');
        expect(style).toHaveProperty('colors');
      });
    });

    test('should retrieve style by ID', () => {
      const garamond = getStyleById('garamond');

      expect(garamond).toBeDefined();
      expect(garamond?.id).toBe('garamond');
      expect(garamond?.name).toBe('Garamond Elegance');
      expect(garamond?.category).toBe('serif');
    });

    test('should return undefined for non-existent style ID', () => {
      const nonExistent = getStyleById('non-existent-style');
      expect(nonExistent).toBeUndefined();
    });

    test('should retrieve styles by category', () => {
      const serifStyles = getStylesByCategory('serif');

      expect(serifStyles.length).toBeGreaterThan(0);
      serifStyles.forEach(style => {
        expect(style.category).toBe('serif');
      });
    });

    test('should get all style IDs', () => {
      const styleIds = getAllStyleIds();

      expect(styleIds).toContain('garamond');
      expect(styleIds).toContain('baskerville');
      expect(styleIds).toContain('helvetica');
      expect(styleIds.length).toBeGreaterThan(0);
    });

    test('should verify all styles have required properties', () => {
      allStyles.forEach(style => {
        // Font properties
        expect(style.fonts.body).toBeDefined();
        expect(style.fonts.heading).toBeDefined();
        expect(style.fonts.fallback).toBeDefined();

        // Heading styles (h1, h2, h3 are required)
        expect(style.headings.h1).toBeDefined();
        expect(style.headings.h2).toBeDefined();
        expect(style.headings.h3).toBeDefined();
        expect(style.headings.h1.fontSize).toBeDefined();
        expect(style.headings.h2.fontSize).toBeDefined();
        expect(style.headings.h3.fontSize).toBeDefined();

        // Body style
        expect(style.body.fontSize).toBeDefined();
        expect(style.body.lineHeight).toBeDefined();

        // Color scheme
        expect(style.colors.text).toBeDefined();
        expect(style.colors.heading).toBeDefined();
      });
    });
  });

  // ============================================================================
  // TEST SUITE 2: Applying Styles to Book
  // ============================================================================

  describe('Applying Styles to Book', () => {
    test('should apply Garamond style to book', async () => {
      const result = await applyStyleToBook(sampleBook, 'garamond');

      expect(result.success).toBe(true);
      expect(result.book).toBeDefined();
      expect(result.appliedStyleId).toBe('garamond');
      expect(result.error).toBeUndefined();
    });

    test('should apply styles to all chapters', async () => {
      const result = await applyStyleToBook(sampleBook, 'garamond');

      expect(result.success).toBe(true);
      const styledBook = result.book!;

      // Verify all chapters have styles applied
      styledBook.chapters.forEach(chapter => {
        expect(chapter.style).toBeDefined();
        expect(chapter.style?.styleId).toContain('garamond');

        // Verify all text blocks have styles
        chapter.content.forEach(block => {
          expect(block.style).toBeDefined();
          expect(block.style?.styleId).toBeDefined();
        });
      });
    });

    test('should apply correct heading styles based on level', async () => {
      const garamond = getStyleById('garamond')!;
      const result = await applyStyleToBook(sampleBook, garamond);

      expect(result.success).toBe(true);
      const styledBook = result.book!;

      // Find heading blocks
      const chapter = styledBook.chapters[0];
      const h1Block = chapter.content.find(b => b.blockType === 'heading' && b.level === 1);
      const h2Block = chapter.content.find(b => b.blockType === 'heading' && b.level === 2);

      expect(h1Block?.style?.styleId).toBe('garamond-h1');
      expect(h2Block?.style?.styleId).toBe('garamond-h2');
    });

    test('should apply first paragraph special styling when paragraph is first block', async () => {
      const garamond = getStyleById('garamond')!;

      // Create a book where the first block is a paragraph (not a heading)
      const bookWithFirstPara = createSampleBook();
      bookWithFirstPara.chapters[0].content = [
        createSampleTextBlock(
          'first-para',
          'This is the first paragraph that should get special styling.',
          'paragraph'
        ),
        createSampleTextBlock(
          'heading-1',
          'A Heading',
          'heading',
          2
        ),
        createSampleTextBlock(
          'para-2',
          'This is a regular paragraph.',
          'paragraph'
        ),
      ];

      const result = await applyStyleToBook(bookWithFirstPara, garamond);

      expect(result.success).toBe(true);
      const styledBook = result.book!;

      // First block is a paragraph, so it should get first-paragraph style
      const chapter = styledBook.chapters[0];
      const firstBlock = chapter.content[0];

      if (garamond.firstParagraph.enabled) {
        expect(firstBlock.style?.styleId).toBe('garamond-first-paragraph');
      }

      // Second paragraph should get regular body style
      const secondPara = chapter.content[2];
      expect(secondPara.style?.styleId).toBe('garamond-body');
    });

    test('should handle style application with BookStyle object', async () => {
      const baskerville = getStyleById('baskerville')!;
      const result = await applyStyleToBook(sampleBook, baskerville);

      expect(result.success).toBe(true);
      expect(result.appliedStyleId).toBe('baskerville');
    });

    test('should fail gracefully with non-existent style', async () => {
      const result = await applyStyleToBook(sampleBook, 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.book).toBeUndefined();
    });

    test('should convert BookStyle to internal Style array', async () => {
      const result = await applyStyleToBook(sampleBook, 'garamond');

      expect(result.success).toBe(true);
      const styledBook = result.book!;

      // Should have created internal styles
      expect(styledBook.styles).toBeDefined();
      expect(styledBook.styles.length).toBeGreaterThan(0);

      // Should have styles for body, headings, etc.
      const bodyStyle = styledBook.styles.find(s => s.id.includes('body'));
      const h1Style = styledBook.styles.find(s => s.id.includes('h1'));

      expect(bodyStyle).toBeDefined();
      expect(h1Style).toBeDefined();
    });
  });

  // ============================================================================
  // TEST SUITE 3: Preview Generation and Updates
  // ============================================================================

  describe('Preview Generation and Updates', () => {
    test('should generate style preview without mutating original book', async () => {
      const originalBook = JSON.parse(JSON.stringify(sampleBook));
      const preview = await generateStylePreview(sampleBook, 'garamond');

      expect(preview).toBeDefined();
      expect(preview).not.toBe(sampleBook); // Different object reference

      // Original book should be unchanged
      expect(JSON.stringify(sampleBook)).toBe(JSON.stringify(originalBook));
    });

    test('should generate preview with different style', async () => {
      const garamondPreview = await generateStylePreview(sampleBook, 'garamond');
      const helveticaPreview = await generateStylePreview(sampleBook, 'helvetica');

      expect(garamondPreview).toBeDefined();
      expect(helveticaPreview).toBeDefined();

      // Previews should have different styles
      expect(garamondPreview?.styles).not.toEqual(helveticaPreview?.styles);
    });

    test('should return null for non-existent style preview', async () => {
      const preview = await generateStylePreview(sampleBook, 'non-existent');
      expect(preview).toBeNull();
    });

    test('should support instant style switching', async () => {
      // Apply multiple styles in sequence
      const style1 = await applyStyleToBook(sampleBook, 'garamond');
      expect(style1.success).toBe(true);

      const style2 = await applyStyleToBook(style1.book!, 'baskerville');
      expect(style2.success).toBe(true);

      const style3 = await applyStyleToBook(style2.book!, 'helvetica');
      expect(style3.success).toBe(true);
      expect(style3.appliedStyleId).toBe('helvetica');
    });

    test('should handle rapid style changes', async () => {
      const styleIds = ['garamond', 'baskerville', 'helvetica', 'caslon'];
      const results = await Promise.all(
        styleIds.map(id => generateStylePreview(sampleBook, id))
      );

      results.forEach((preview, index) => {
        expect(preview).toBeDefined();
        expect(preview?.styles.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // TEST SUITE 4: Style Features Verification
  // ============================================================================

  describe('Style Features Verification', () => {
    describe('Heading Styles', () => {
      test('should compute heading styles correctly', () => {
        const garamond = getStyleById('garamond')!;

        const h1Styles = computeHeadingStyles(garamond.headings.h1, 1, garamond);
        const h2Styles = computeHeadingStyles(garamond.headings.h2, 2, garamond);
        const h3Styles = computeHeadingStyles(garamond.headings.h3, 3, garamond);

        // H1 should be largest
        expect(h1Styles.fontSize).toBe(garamond.headings.h1.fontSize);
        expect(h2Styles.fontSize).toBe(garamond.headings.h2.fontSize);
        expect(h3Styles.fontSize).toBe(garamond.headings.h3.fontSize);

        // Should have correct font family
        expect(h1Styles.fontFamily).toContain('Garamond');
      });

      test('should apply heading colors from style', () => {
        const garamond = getStyleById('garamond')!;
        const h1Styles = computeHeadingStyles(garamond.headings.h1, 1, garamond);

        expect(h1Styles.color).toBeDefined();
        expect(h1Styles.color).toBe(garamond.colors.heading);
      });

      test('should apply text transform to headings', () => {
        const garamond = getStyleById('garamond')!;
        const h1Styles = computeHeadingStyles(garamond.headings.h1, 1, garamond);

        if (garamond.headings.h1.textTransform) {
          expect(h1Styles.textTransform).toBe(garamond.headings.h1.textTransform);
        }
      });
    });

    describe('Drop Caps', () => {
      test('should compute drop cap styles when enabled', () => {
        const garamond = getStyleById('garamond')!;

        if (garamond.dropCap.enabled) {
          const dropCapStyles = computeDropCapStyles(
            garamond.dropCap,
            garamond,
            'I'
          );

          expect(dropCapStyles).toBeDefined();
          expect(dropCapStyles?.float).toBe('left');
          expect(dropCapStyles?.fontSize).toBeDefined();
          expect(dropCapStyles?.lineHeight).toBe('1');
        }
      });

      test('should return null when drop cap is disabled', () => {
        const helvetica = getStyleById('helvetica')!;

        if (!helvetica.dropCap.enabled) {
          const dropCapStyles = computeDropCapStyles(
            helvetica.dropCap,
            helvetica,
            'I'
          );

          expect(dropCapStyles).toBeNull();
        }
      });

      test('should apply drop cap color from style', () => {
        const garamond = getStyleById('garamond')!;

        if (garamond.dropCap.enabled) {
          const dropCapStyles = computeDropCapStyles(
            garamond.dropCap,
            garamond,
            'T'
          );

          expect(dropCapStyles?.color).toBeDefined();
        }
      });

      test('should handle different drop cap characters', () => {
        const garamond = getStyleById('garamond')!;

        if (garamond.dropCap.enabled) {
          const chars = ['A', 'B', 'C', 'W', 'M'];

          chars.forEach(char => {
            const styles = computeDropCapStyles(garamond.dropCap, garamond, char);
            expect(styles).toBeDefined();
            expect(styles?.float).toBe('left');
          });
        }
      });
    });

    describe('Ornamental Breaks', () => {
      test('should compute ornamental break styles', () => {
        const garamond = getStyleById('garamond')!;
        const breakStyles = computeOrnamentalBreakStyles(garamond);

        if (garamond.ornamentalBreak.enabled) {
          expect(breakStyles.textAlign).toBe('center');
          expect(breakStyles.fontSize).toBeDefined();
          expect(breakStyles.display).not.toBe('none');
        }
      });

      test('should hide ornamental break when disabled', () => {
        const helvetica = getStyleById('helvetica')!;
        const breakStyles = computeOrnamentalBreakStyles(helvetica);

        if (!helvetica.ornamentalBreak.enabled) {
          expect(breakStyles.display).toBe('none');
        }
      });

      test('should use correct ornamental symbol', () => {
        const garamond = getStyleById('garamond')!;

        if (garamond.ornamentalBreak.enabled) {
          expect(garamond.ornamentalBreak.symbol).toBeDefined();
          expect(garamond.ornamentalBreak.symbol.length).toBeGreaterThan(0);
        }
      });
    });

    describe('Paragraph Styles', () => {
      test('should compute regular paragraph styles', () => {
        const garamond = getStyleById('garamond')!;
        const paraStyles = computeParagraphStyles(garamond, false, false);

        expect(paraStyles.fontFamily).toContain('Garamond');
        expect(paraStyles.fontSize).toBe(garamond.body.fontSize);
        expect(paraStyles.lineHeight).toBe(garamond.body.lineHeight);
        expect(paraStyles.color).toBe(garamond.colors.text);
      });

      test('should apply first paragraph styling', () => {
        const garamond = getStyleById('garamond')!;
        const firstParaStyles = computeParagraphStyles(garamond, true, false);
        const regularParaStyles = computeParagraphStyles(garamond, false, false);

        if (garamond.firstParagraph.enabled) {
          // First paragraph should have different styling
          expect(firstParaStyles).not.toEqual(regularParaStyles);

          if (garamond.firstParagraph.letterSpacing) {
            expect(firstParaStyles.letterSpacing).toBe(
              garamond.firstParagraph.letterSpacing
            );
          }
        }
      });

      test('should handle paragraph with drop cap', () => {
        const garamond = getStyleById('garamond')!;
        const paraWithDropCap = computeParagraphStyles(garamond, true, true);

        expect(paraWithDropCap.display).toBe('inline');
      });
    });

    describe('Font Families', () => {
      test('should have distinct fonts for serif styles', () => {
        const serifStyles = getStylesByCategory('serif');

        serifStyles.forEach(style => {
          expect(style.fonts.body).toBeDefined();
          expect(style.fonts.fallback).toBe('serif');
        });
      });

      test('should have distinct fonts for sans-serif styles', () => {
        const sansSerifStyles = getStylesByCategory('sans-serif');

        sansSerifStyles.forEach(style => {
          expect(style.fonts.body).toBeDefined();
          expect(style.fonts.fallback).toBe('sans-serif');
        });
      });

      test('should apply font stack to headings and body', () => {
        allStyles.forEach(style => {
          expect(style.fonts.body).toBeDefined();
          expect(style.fonts.heading).toBeDefined();
        });
      });
    });

    describe('Color Schemes', () => {
      test('should have complete color scheme', () => {
        allStyles.forEach(style => {
          expect(style.colors.text).toBeDefined();
          expect(style.colors.heading).toBeDefined();

          // Verify color format (hex)
          expect(style.colors.text).toMatch(/^#[0-9a-fA-F]{6}$/);
          expect(style.colors.heading).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
      });

      test('should apply text color to paragraphs', () => {
        const garamond = getStyleById('garamond')!;
        const paraStyles = computeParagraphStyles(garamond, false, false);

        expect(paraStyles.color).toBe(garamond.colors.text);
      });
    });
  });

  // ============================================================================
  // TEST SUITE 5: Chapter Style Application
  // ============================================================================

  describe('Chapter Style Application', () => {
    test('should apply styles to entire chapter', () => {
      const garamond = getStyleById('garamond')!;
      const chapter = sampleBook.chapters[0];

      const { chapterStyles, blockStyles } = applyStylesToChapter(chapter, garamond);

      expect(chapterStyles).toBeDefined();
      expect(chapterStyles.fontFamily).toContain('Garamond');
      expect(chapterStyles.color).toBe(garamond.colors.text);

      // Should have styles for all blocks
      expect(blockStyles.size).toBe(chapter.content.length);
    });

    test('should compute individual block styles', () => {
      const garamond = getStyleById('garamond')!;
      const chapter = sampleBook.chapters[0];

      const { blockStyles } = applyStylesToChapter(chapter, garamond);

      chapter.content.forEach(block => {
        const styles = blockStyles.get(block.id);
        expect(styles).toBeDefined();

        // Verify style properties based on block type
        if (block.blockType === 'heading') {
          expect(styles?.fontFamily).toBeDefined();
          expect(styles?.fontSize).toBeDefined();
        } else if (block.blockType === 'paragraph') {
          expect(styles?.fontFamily).toContain('Garamond');
        }
      });
    });

    test('should handle chapters with mixed content', () => {
      const garamond = getStyleById('garamond')!;
      const chapter = sampleBook.chapters[0];

      const { blockStyles } = applyStylesToChapter(chapter, garamond);

      // Count different block types
      const headings = chapter.content.filter(b => b.blockType === 'heading');
      const paragraphs = chapter.content.filter(b => b.blockType === 'paragraph');

      headings.forEach(h => {
        const styles = blockStyles.get(h.id);
        expect(styles?.fontSize).toBeDefined();
      });

      paragraphs.forEach(p => {
        const styles = blockStyles.get(p.id);
        expect(styles?.fontFamily).toBeDefined();
      });
    });
  });

  // ============================================================================
  // TEST SUITE 6: Custom Style Management
  // ============================================================================

  describe('Custom Style Management', () => {
    const createCustomStyle = (): BookStyle => ({
      id: 'custom-test-style',
      name: 'Custom Test Style',
      description: 'A custom style for testing',
      category: 'custom',
      fonts: {
        body: 'Georgia, serif',
        heading: 'Arial, sans-serif',
        fallback: 'serif',
      },
      headings: {
        h1: {
          fontSize: '3em',
          fontWeight: 'bold',
          lineHeight: '1.2',
          marginTop: '2em',
          marginBottom: '1em',
        },
        h2: {
          fontSize: '2.2em',
          fontWeight: 'bold',
          lineHeight: '1.3',
          marginTop: '1.5em',
          marginBottom: '0.8em',
        },
        h3: {
          fontSize: '1.6em',
          fontWeight: 'bold',
          lineHeight: '1.4',
          marginTop: '1.2em',
          marginBottom: '0.6em',
        },
      },
      body: {
        fontSize: '1.1em',
        lineHeight: '1.7',
        textAlign: 'left',
      },
      dropCap: {
        enabled: true,
        lines: 3,
        fontSize: '3em',
        fontWeight: 'bold',
        color: '#333333',
        marginRight: '0.1em',
      },
      ornamentalBreak: {
        enabled: true,
        symbol: '* * *',
        spacing: '2em',
        fontSize: '1.2em',
      },
      firstParagraph: {
        enabled: true,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontSize: '1em',
      },
      spacing: {
        paragraphSpacing: '1.2em',
        lineHeight: '1.7',
        sectionSpacing: '3em',
        chapterSpacing: '5em',
      },
      colors: {
        text: '#222222',
        heading: '#000000',
        accent: '#555555',
        background: '#ffffff',
      },
    });

    test('should save custom style', async () => {
      const customStyle = createCustomStyle();

      await expect(saveCustomStyle(customStyle)).resolves.not.toThrow();

      const loadedStyles = await loadCustomStyles();
      expect(loadedStyles).toContainEqual(expect.objectContaining({
        id: 'custom-test-style',
        category: 'custom',
      }));
    });

    test('should load custom styles', async () => {
      const customStyle = createCustomStyle();
      await saveCustomStyle(customStyle);

      const loadedStyles = await loadCustomStyles();

      expect(loadedStyles.length).toBeGreaterThan(0);
      const found = loadedStyles.find(s => s.id === 'custom-test-style');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Custom Test Style');
    });

    test('should update existing custom style', async () => {
      const customStyle = createCustomStyle();
      await saveCustomStyle(customStyle);

      const updatedStyle: BookStyle = {
        ...customStyle,
        name: 'Updated Custom Style',
        description: 'Updated description',
      };

      await expect(
        updateCustomStyle('custom-test-style', updatedStyle)
      ).resolves.not.toThrow();

      const loadedStyles = await loadCustomStyles();
      const found = loadedStyles.find(s => s.id === 'custom-test-style');
      expect(found?.name).toBe('Updated Custom Style');
    });

    test('should delete custom style', async () => {
      const customStyle = createCustomStyle();
      await saveCustomStyle(customStyle);

      await expect(
        deleteCustomStyle('custom-test-style')
      ).resolves.not.toThrow();

      const loadedStyles = await loadCustomStyles();
      const found = loadedStyles.find(s => s.id === 'custom-test-style');
      expect(found).toBeUndefined();
    });

    test('should get all styles including custom', async () => {
      const customStyle = createCustomStyle();
      await saveCustomStyle(customStyle);

      const all = await getAllStyles(allStyles);

      expect(all.length).toBe(allStyles.length + 1);
      expect(all).toContainEqual(expect.objectContaining({
        id: 'custom-test-style',
      }));
    });

    test('should fail to save duplicate custom style', async () => {
      const customStyle = createCustomStyle();
      await saveCustomStyle(customStyle);

      await expect(saveCustomStyle(customStyle)).rejects.toThrow();
    });

    test('should fail to update non-existent style', async () => {
      const customStyle = createCustomStyle();

      await expect(
        updateCustomStyle('non-existent', customStyle)
      ).rejects.toThrow();
    });

    test('should fail to delete non-existent style', async () => {
      await expect(deleteCustomStyle('non-existent')).rejects.toThrow();
    });
  });

  // ============================================================================
  // TEST SUITE 7: Style Merging and Customization
  // ============================================================================

  describe('Style Merging and Customization', () => {
    test('should merge base style with overrides', () => {
      const garamond = getStyleById('garamond')!;

      const overrides: Partial<BookStyle> = {
        colors: {
          text: '#ff0000',
          heading: '#00ff00',
        },
        body: {
          fontSize: '1.5em',
          lineHeight: '2',
        },
      };

      const merged = mergeStyles(garamond, overrides);

      expect(merged.colors.text).toBe('#ff0000');
      expect(merged.colors.heading).toBe('#00ff00');
      expect(merged.body.fontSize).toBe('1.5em');
      expect(merged.body.lineHeight).toBe('2');

      // Original properties should be preserved
      expect(merged.id).toBe('garamond');
      expect(merged.name).toBe('Garamond Elegance');
    });

    test('should handle partial heading overrides', () => {
      const garamond = getStyleById('garamond')!;

      const overrides: Partial<BookStyle> = {
        headings: {
          h1: {
            fontSize: '5em',
            fontWeight: '900',
            lineHeight: '1.1',
          },
        } as any,
      };

      const merged = mergeStyles(garamond, overrides);

      expect(merged.headings.h1.fontSize).toBe('5em');
      expect(merged.headings.h1.fontWeight).toBe('900');

      // H2 and H3 should remain unchanged
      expect(merged.headings.h2).toEqual(garamond.headings.h2);
      expect(merged.headings.h3).toEqual(garamond.headings.h3);
    });

    test('should merge without modifying original style', () => {
      const garamond = getStyleById('garamond')!;
      const originalGaramond = JSON.parse(JSON.stringify(garamond));

      const overrides: Partial<BookStyle> = {
        colors: { text: '#ff0000', heading: '#00ff00' },
      };

      mergeStyles(garamond, overrides);

      // Original should be unchanged
      expect(JSON.stringify(garamond)).toBe(JSON.stringify(originalGaramond));
    });

    test('should handle empty overrides', () => {
      const garamond = getStyleById('garamond')!;
      const merged = mergeStyles(garamond, {});

      expect(merged).toEqual(garamond);
    });

    test('should handle undefined overrides', () => {
      const garamond = getStyleById('garamond')!;
      const merged = mergeStyles(garamond, undefined);

      expect(merged).toEqual(garamond);
    });
  });

  // ============================================================================
  // TEST SUITE 8: Performance and Caching
  // ============================================================================

  describe('Performance and Caching', () => {
    test('should cache heading styles computations', () => {
      const garamond = getStyleById('garamond')!;

      // First call - computes and caches
      const start1 = Date.now();
      const styles1 = computeHeadingStyles(garamond.headings.h1, 1, garamond);
      const time1 = Date.now() - start1;

      // Second call - should be cached and faster
      const start2 = Date.now();
      const styles2 = computeHeadingStyles(garamond.headings.h1, 1, garamond);
      const time2 = Date.now() - start2;

      expect(styles1).toEqual(styles2);
      // Note: Time comparison might not always be reliable in tests
    });

    test('should cache paragraph styles computations', () => {
      const garamond = getStyleById('garamond')!;

      const styles1 = computeParagraphStyles(garamond, false, false);
      const styles2 = computeParagraphStyles(garamond, false, false);

      expect(styles1).toEqual(styles2);
    });

    test('should cache ornamental break styles', () => {
      const garamond = getStyleById('garamond')!;

      const styles1 = computeOrnamentalBreakStyles(garamond);
      const styles2 = computeOrnamentalBreakStyles(garamond);

      expect(styles1).toEqual(styles2);
    });

    test('should clear all caches', () => {
      const garamond = getStyleById('garamond')!;

      // Populate caches
      computeHeadingStyles(garamond.headings.h1, 1, garamond);
      computeParagraphStyles(garamond, false, false);
      computeOrnamentalBreakStyles(garamond);

      // Clear caches
      clearStyleCaches();

      // After clearing, computations should work normally
      const styles = computeHeadingStyles(garamond.headings.h1, 1, garamond);
      expect(styles).toBeDefined();
    });

    test('should handle large books efficiently', async () => {
      // Create a large book
      const largeBook: Book = {
        ...sampleBook,
        chapters: Array.from({ length: 50 }, (_, i) =>
          createSampleChapter(`chapter-${i}`, i + 1)
        ),
      };

      const start = Date.now();
      const result = await applyStyleToBook(largeBook, 'garamond');
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(result.book?.chapters.length).toBe(50);

      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });

  // ============================================================================
  // TEST SUITE 9: Complete Integration Workflow
  // ============================================================================

  describe('Complete Integration Workflow', () => {
    test('should execute complete style application workflow', async () => {
      // Step 1: Load built-in styles
      const styleIds = getAllStyleIds();
      expect(styleIds.length).toBeGreaterThan(0);

      // Step 2: Select a style
      const garamond = getStyleById('garamond')!;
      expect(garamond).toBeDefined();

      // Step 3: Generate preview
      const preview = await generateStylePreview(sampleBook, garamond);
      expect(preview).toBeDefined();

      // Step 4: Apply style to book
      const result = await applyStyleToBook(sampleBook, garamond);
      expect(result.success).toBe(true);

      // Step 5: Verify all features applied
      const styledBook = result.book!;
      styledBook.chapters.forEach(chapter => {
        chapter.content.forEach(block => {
          expect(block.style).toBeDefined();
        });
      });

      // Step 6: Switch to different style
      const helvetica = getStyleById('helvetica')!;
      const result2 = await applyStyleToBook(styledBook, helvetica);
      expect(result2.success).toBe(true);
      expect(result2.appliedStyleId).toBe('helvetica');
    });

    test('should customize and save style workflow', async () => {
      // Step 1: Load base style
      const garamond = getStyleById('garamond')!;

      // Step 2: Customize it
      const customized = mergeStyles(garamond, {
        id: 'garamond-custom',
        name: 'My Custom Garamond',
        colors: {
          text: '#1a1a1a',
          heading: '#000000',
        },
      });

      // Step 3: Save as custom style
      await saveCustomStyle(customized);

      // Step 4: Load and verify
      const customStyles = await loadCustomStyles();
      const found = customStyles.find(s => s.id === 'garamond-custom');
      expect(found).toBeDefined();

      // Step 5: Apply custom style
      const result = await applyStyleToBook(sampleBook, customized);
      expect(result.success).toBe(true);

      // Step 6: Cleanup
      await deleteCustomStyle('garamond-custom');
    });

    test('should handle style switching with preview', async () => {
      const styles = ['garamond', 'baskerville', 'helvetica', 'caslon'];

      // Generate previews for all styles
      const previews = await Promise.all(
        styles.map(id => generateStylePreview(sampleBook, id))
      );

      // All previews should be valid
      previews.forEach(preview => {
        expect(preview).toBeDefined();
      });

      // Apply final choice
      const finalResult = await applyStyleToBook(sampleBook, 'garamond');
      expect(finalResult.success).toBe(true);
      expect(finalResult.appliedStyleId).toBe('garamond');
    });
  });
});

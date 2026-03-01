/**
 * Style Service
 * Combines style application and custom style management
 */

import { Book } from '../types/book';
import { Chapter } from '../types/chapter';
import { Element } from '../types/element';
import { TextBlock } from '../types/textBlock';
import { Style, BookStyle, HeadingStyle } from '../types/style';
import { getStyleById } from '../data/styles';

export interface StyleApplicationResult {
  success: boolean;
  book?: Book;
  error?: string;
  appliedStyleId?: string;
}

export interface StylePreview {
  bookId: string;
  styleId: string;
  preview: Book;
  timestamp: Date;
}

/**
 * Service for applying book styles to documents
 */
export class StyleService {
  private previewCache: Map<string, StylePreview> = new Map();

  /**
   * Apply a style to a book, updating all elements
   */
  async applyStyle(bookId: string, styleConfig: BookStyle | string): Promise<StyleApplicationResult> {
    try {
      // Resolve style config if string ID provided
      const bookStyle = typeof styleConfig === 'string'
        ? getStyleById(styleConfig)
        : styleConfig;

      if (!bookStyle) {
        return {
          success: false,
          error: `Style not found: ${styleConfig}`,
        };
      }

      // Get the book (in a real app, this would fetch from a store/database)
      const book = this.getBookById(bookId);
      if (!book) {
        return {
          success: false,
          error: `Book not found: ${bookId}`,
        };
      }

      // Create styled book
      const styledBook = this.applyStyleToBook(book, bookStyle);

      return {
        success: true,
        book: styledBook,
        appliedStyleId: bookStyle.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate a preview of style application without mutating the book
   */
  async generatePreview(bookId: string, styleConfig: BookStyle | string): Promise<StylePreview | null> {
    const bookStyle = typeof styleConfig === 'string'
      ? getStyleById(styleConfig)
      : styleConfig;

    if (!bookStyle) {
      return null;
    }

    const book = this.getBookById(bookId);
    if (!book) {
      return null;
    }

    // Create a deep clone to avoid mutation
    const bookClone = JSON.parse(JSON.stringify(book)) as Book;
    const previewBook = this.applyStyleToBook(bookClone, bookStyle);

    const preview: StylePreview = {
      bookId,
      styleId: bookStyle.id,
      preview: previewBook,
      timestamp: new Date(),
    };

    // Cache the preview
    const cacheKey = `${bookId}-${bookStyle.id}`;
    this.previewCache.set(cacheKey, preview);

    return preview;
  }

  /**
   * Get a cached preview
   */
  getCachedPreview(bookId: string, styleId: string): StylePreview | null {
    const cacheKey = `${bookId}-${styleId}`;
    return this.previewCache.get(cacheKey) || null;
  }

  /**
   * Clear preview cache
   */
  clearPreviewCache(bookId?: string): void {
    if (bookId) {
      // Clear only previews for specific book
      for (const [key] of this.previewCache) {
        if (key.startsWith(`${bookId}-`)) {
          this.previewCache.delete(key);
        }
      }
    } else {
      // Clear all previews
      this.previewCache.clear();
    }
  }

  /**
   * Apply a BookStyle to a Book, creating a new styled book
   */
  private applyStyleToBook(book: Book, bookStyle: BookStyle): Book {
    // Convert BookStyle to internal Style array
    const styles = this.bookStyleToStyles(bookStyle);

    // Apply styles to all chapters
    const styledChapters = book.chapters.map(chapter =>
      this.applyStyleToChapter(chapter, bookStyle, styles)
    );

    // Apply styles to front matter
    const styledFrontMatter = book.frontMatter.map(element =>
      this.applyStyleToElement(element, bookStyle, styles)
    );

    // Apply styles to back matter
    const styledBackMatter = book.backMatter.map(element =>
      this.applyStyleToElement(element, bookStyle, styles)
    );

    return {
      ...book,
      chapters: styledChapters,
      frontMatter: styledFrontMatter,
      backMatter: styledBackMatter,
      styles,
    };
  }

  /**
   * Apply style to a chapter
   */
  private applyStyleToChapter(chapter: Chapter, bookStyle: BookStyle, styles: Style[]): Chapter {
    const bodyStyleId = this.getStyleId(bookStyle, 'body');

    // Apply styles to chapter content blocks
    const styledContent = chapter.content.map((block, index) =>
      this.applyStyleToTextBlock(block, bookStyle, styles, index === 0)
    );

    return {
      ...chapter,
      content: styledContent,
      style: {
        styleId: bodyStyleId,
      },
    };
  }

  /**
   * Apply style to an element (front/back matter)
   */
  private applyStyleToElement(element: Element, bookStyle: BookStyle, styles: Style[]): Element {
    const bodyStyleId = this.getStyleId(bookStyle, 'body');

    // Apply styles to element content blocks
    const styledContent = element.content.map((block, index) =>
      this.applyStyleToTextBlock(block, bookStyle, styles, index === 0)
    );

    return {
      ...element,
      content: styledContent,
      style: {
        styleId: bodyStyleId,
      },
    };
  }

  /**
   * Apply style to a text block
   */
  private applyStyleToTextBlock(
    block: TextBlock,
    bookStyle: BookStyle,
    _styles: Style[],
    isFirstBlock: boolean
  ): TextBlock {
    let styleId: string;

    // Determine which style to apply based on block type
    switch (block.blockType) {
      case 'heading':
        const level = block.level || 1;
        styleId = this.getStyleId(bookStyle, `h${level}` as 'h1' | 'h2' | 'h3');
        break;
      case 'code':
      case 'preformatted':
        styleId = this.getStyleId(bookStyle, 'body'); // Use body style for now
        break;
      case 'paragraph':
      default:
        // First paragraph might get special styling (drop cap, small caps)
        if (isFirstBlock && bookStyle.firstParagraph.enabled) {
          styleId = this.getStyleId(bookStyle, 'first-paragraph');
        } else {
          styleId = this.getStyleId(bookStyle, 'body');
        }
        break;
    }

    return {
      ...block,
      style: {
        styleId,
      },
    };
  }

  /**
   * Convert BookStyle to internal Style array
   */
  private bookStyleToStyles(bookStyle: BookStyle): Style[] {
    const styles: Style[] = [];

    // Body style
    styles.push({
      id: this.getStyleId(bookStyle, 'body'),
      name: `${bookStyle.name} - Body`,
      fontFamily: bookStyle.fonts.body,
      fontSize: this.parseSize(bookStyle.body.fontSize),
      lineHeight: this.parseLineHeight(bookStyle.body.lineHeight),
      textAlign: bookStyle.body.textAlign,
      color: bookStyle.colors.text,
      fontWeight: this.parseFontWeight(bookStyle.body.fontWeight),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Heading styles
    styles.push(this.headingStyleToStyle(bookStyle, 'h1', bookStyle.headings.h1));
    styles.push(this.headingStyleToStyle(bookStyle, 'h2', bookStyle.headings.h2));
    styles.push(this.headingStyleToStyle(bookStyle, 'h3', bookStyle.headings.h3));
    if (bookStyle.headings.h4) {
      styles.push(this.headingStyleToStyle(bookStyle, 'h4', bookStyle.headings.h4));
    }

    // First paragraph style (if enabled)
    if (bookStyle.firstParagraph.enabled) {
      styles.push({
        id: this.getStyleId(bookStyle, 'first-paragraph'),
        name: `${bookStyle.name} - First Paragraph`,
        fontFamily: bookStyle.fonts.body,
        fontSize: this.parseSize(bookStyle.firstParagraph.fontSize || bookStyle.body.fontSize),
        lineHeight: this.parseLineHeight(bookStyle.body.lineHeight),
        textAlign: bookStyle.body.textAlign,
        color: bookStyle.colors.text,
        textTransform: bookStyle.firstParagraph.textTransform === 'small-caps'
          ? undefined
          : bookStyle.firstParagraph.textTransform,
        letterSpacing: bookStyle.firstParagraph.letterSpacing,
        customProperties: bookStyle.firstParagraph.fontVariant
          ? { fontVariant: bookStyle.firstParagraph.fontVariant }
          : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Drop cap style (if enabled)
    if (bookStyle.dropCap.enabled) {
      styles.push({
        id: this.getStyleId(bookStyle, 'drop-cap'),
        name: `${bookStyle.name} - Drop Cap`,
        fontFamily: bookStyle.dropCap.fontFamily || bookStyle.fonts.heading,
        fontSize: this.parseSize(bookStyle.dropCap.fontSize || '4em'),
        fontWeight: this.parseFontWeight(bookStyle.dropCap.fontWeight),
        color: bookStyle.dropCap.color || bookStyle.colors.dropCap || bookStyle.colors.accent,
        customProperties: {
          lines: bookStyle.dropCap.lines.toString(),
          marginRight: bookStyle.dropCap.marginRight || '0.1em',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return styles;
  }

  /**
   * Convert a heading style to internal Style format
   */
  private headingStyleToStyle(bookStyle: BookStyle, level: string, headingStyle: HeadingStyle): Style {
    return {
      id: this.getStyleId(bookStyle, level as 'h1' | 'h2' | 'h3'),
      name: `${bookStyle.name} - ${level.toUpperCase()}`,
      fontFamily: headingStyle.fontFamily || bookStyle.fonts.heading,
      fontSize: this.parseSize(headingStyle.fontSize),
      fontWeight: this.parseFontWeight(headingStyle.fontWeight),
      lineHeight: this.parseLineHeight(headingStyle.lineHeight),
      color: headingStyle.color || bookStyle.colors.heading,
      textTransform: headingStyle.textTransform,
      letterSpacing: headingStyle.letterSpacing,
      margin: this.buildMargin(headingStyle.marginTop, headingStyle.marginBottom),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate a style ID
   */
  private getStyleId(bookStyle: BookStyle, type: string): string {
    return `${bookStyle.id}-${type}`;
  }

  /**
   * Parse font size string to number (for simplified processing)
   */
  private parseSize(size?: string): number | undefined {
    if (!size) return undefined;

    // For now, just strip the unit and return the number
    // In a real app, you might want to keep the unit
    const match = size.match(/^([\d.]+)/);
    return match ? parseFloat(match[1]) : undefined;
  }

  /**
   * Parse line height string to number or string
   */
  private parseLineHeight(lineHeight?: string): number | string | undefined {
    if (!lineHeight) return undefined;

    // If it's a unitless number, convert to number
    const match = lineHeight.match(/^([\d.]+)$/);
    if (match) {
      return parseFloat(match[1]);
    }

    // Otherwise keep as string
    return lineHeight;
  }

  /**
   * Parse font weight
   */
  private parseFontWeight(weight?: string): 'normal' | 'bold' | 'lighter' | 'bolder' | number | undefined {
    if (!weight) return undefined;

    const numWeight = parseInt(weight);
    if (!isNaN(numWeight)) {
      return numWeight;
    }

    // Only return valid string literals
    if (weight === 'normal' || weight === 'bold' || weight === 'lighter' || weight === 'bolder') {
      return weight;
    }

    // Default to 'normal' for unknown values
    return 'normal';
  }

  /**
   * Build margin string from top and bottom values
   */
  private buildMargin(marginTop?: string, marginBottom?: string): string | undefined {
    if (!marginTop && !marginBottom) return undefined;
    return `${marginTop || '0'} 0 ${marginBottom || '0'} 0`;
  }

  /**
   * Get a book by ID (placeholder - in real app, would fetch from store)
   */
  private getBookById(_bookId: string): Book | null {
    // This is a placeholder. In a real application, you would:
    // 1. Fetch from Redux/Zustand store
    // 2. Query from database
    // 3. Get from PersistenceService
    // For now, return null to indicate this needs to be implemented
    // by the calling code passing the book object
    return null;
  }
}

// Singleton instance
let styleServiceInstance: StyleService | null = null;

/**
 * Get the StyleService singleton instance
 */
export function getStyleService(): StyleService {
  if (!styleServiceInstance) {
    styleServiceInstance = new StyleService();
  }
  return styleServiceInstance;
}

/**
 * Helper function to apply style directly to a book object
 */
export async function applyStyleToBook(
  book: Book,
  styleConfig: BookStyle | string
): Promise<StyleApplicationResult> {
  // Resolve style
  const bookStyle = typeof styleConfig === 'string'
    ? getStyleById(styleConfig)
    : styleConfig;

  if (!bookStyle) {
    return {
      success: false,
      error: `Style not found: ${styleConfig}`,
    };
  }

  try {
    // Create a temporary service instance to avoid ID lookup
    const tempService = new StyleService();
    const styledBook = (tempService as any).applyStyleToBook(book, bookStyle);

    return {
      success: true,
      book: styledBook,
      appliedStyleId: bookStyle.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
=======
 * Service for managing custom book styles
 * Uses Electron IPC if available, falls back to localStorage
 */

import { BookStyle } from '../types/style';

const LOCALSTORAGE_KEY = 'vellum-custom-styles';

/**
 * Check if Electron API is available
 */
function isElectronAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electron;
}

/**
 * Load custom styles from localStorage
 */
function loadFromLocalStorage(): BookStyle[] {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load custom styles from localStorage:', error);
    return [];
>>>>>>> agent/implement-custom-style-save-load-service
  }
}

/**
 * Helper function to generate a preview without mutating the original book
 */
export async function generateStylePreview(
  book: Book,
  styleConfig: BookStyle | string
): Promise<Book | null> {
  const bookStyle = typeof styleConfig === 'string'
    ? getStyleById(styleConfig)
    : styleConfig;

  if (!bookStyle) {
    return null;
  }

  // Create a deep clone to avoid mutation
  const bookClone = JSON.parse(JSON.stringify(book)) as Book;

  const tempService = new StyleService();
  return (tempService as any).applyStyleToBook(bookClone, bookStyle);
}

// ============================================================================
// Custom Style Management Functions
// ============================================================================

const LOCALSTORAGE_KEY = 'vellum-custom-styles';

/**
 * Check if Electron API is available
 */
function isElectronAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electron;
}

/**
 * Load custom styles from localStorage
 */
function loadFromLocalStorage(): BookStyle[] {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load custom styles from localStorage:', error);
    return [];
  }
}

/**
 * Save custom styles to localStorage
 */
function saveToLocalStorage(styles: BookStyle[]): void {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(styles));
  } catch (error) {
    console.error('Failed to save custom styles to localStorage:', error);
    throw new Error('Failed to save custom styles');
  }
}

/**
 * Load all custom styles
 * @returns Promise resolving to array of custom BookStyle objects
 */
export async function loadCustomStyles(): Promise<BookStyle[]> {
  if (isElectronAvailable()) {
    try {
      const result = await window.electron.invoke('style:loadCustom') as {
        success: boolean;
        styles?: BookStyle[];
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to load custom styles');
      }

      return result.styles || [];
    } catch (error) {
      console.error('Electron IPC failed, falling back to localStorage:', error);
      return loadFromLocalStorage();
    }
  } else {
    return loadFromLocalStorage();
  }
}

/**
 * Save a new custom style
 * @param style The BookStyle to save (will be assigned 'custom' category)
 * @returns Promise that resolves when the style is saved
 */
export async function saveCustomStyle(style: BookStyle): Promise<void> {
  // Ensure the style has custom category
  const customStyle: BookStyle = { ...style, category: 'custom' };

  if (isElectronAvailable()) {
    try {
      const result = await window.electron.invoke('style:saveCustom', customStyle) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to save custom style');
      }
    } catch (error) {
      console.error('Electron IPC failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const styles = loadFromLocalStorage();

      // Check if style with this ID already exists
      if (styles.some(s => s.id === style.id)) {
        throw new Error('A style with this ID already exists. Use updateCustomStyle to modify it.');
      }

      styles.push(customStyle);
      saveToLocalStorage(styles);
    }
  } else {
    // Use localStorage
    const styles = loadFromLocalStorage();

    // Check if style with this ID already exists
    if (styles.some(s => s.id === style.id)) {
      throw new Error('A style with this ID already exists. Use updateCustomStyle to modify it.');
    }

    styles.push(customStyle);
    saveToLocalStorage(styles);
  }
}

/**
 * Update an existing custom style
 * @param id The ID of the style to update
 * @param style The updated BookStyle data
 * @returns Promise that resolves when the style is updated
 */
export async function updateCustomStyle(id: string, style: BookStyle): Promise<void> {
  // Ensure the style has custom category and correct ID
  const updatedStyle: BookStyle = { ...style, id, category: 'custom' };

  if (isElectronAvailable()) {
    try {
      const result = await window.electron.invoke('style:updateCustom', {
        id,
        style: updatedStyle,
      }) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to update custom style');
      }
    } catch (error) {
      console.error('Electron IPC failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const styles = loadFromLocalStorage();
      const existingIndex = styles.findIndex(s => s.id === id);

      if (existingIndex < 0) {
        throw new Error('Style not found');
      }

      styles[existingIndex] = updatedStyle;
      saveToLocalStorage(styles);
    }
  } else {
    // Use localStorage
    const styles = loadFromLocalStorage();
    const existingIndex = styles.findIndex(s => s.id === id);

    if (existingIndex < 0) {
      throw new Error('Style not found');
    }

    styles[existingIndex] = updatedStyle;
    saveToLocalStorage(styles);
  }
}

/**
 * Delete a custom style
 * @param id The ID of the style to delete
 * @returns Promise that resolves when the style is deleted
 */
export async function deleteCustomStyle(id: string): Promise<void> {
  if (isElectronAvailable()) {
    try {
      const result = await window.electron.invoke('style:deleteCustom', id) as {
        success: boolean;
        error?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete custom style');
      }
    } catch (error) {
      console.error('Electron IPC failed, falling back to localStorage:', error);
      // Fallback to localStorage
      const styles = loadFromLocalStorage();
      const existingIndex = styles.findIndex(s => s.id === id);

      if (existingIndex < 0) {
        throw new Error('Style not found');
      }

      styles.splice(existingIndex, 1);
      saveToLocalStorage(styles);
    }
  } else {
    // Use localStorage
    const styles = loadFromLocalStorage();
    const existingIndex = styles.findIndex(s => s.id === id);

    if (existingIndex < 0) {
      throw new Error('Style not found');
    }

    styles.splice(existingIndex, 1);
    saveToLocalStorage(styles);
  }
}

/**
 * Get all styles including built-in and custom styles
 * This function should be called with built-in styles to merge with custom ones
 * @param builtInStyles Array of built-in BookStyle objects
 * @returns Promise resolving to combined array of all styles
 */
export async function getAllStyles(builtInStyles: BookStyle[]): Promise<BookStyle[]> {
  const customStyles = await loadCustomStyles();
  return [...builtInStyles, ...customStyles];
}

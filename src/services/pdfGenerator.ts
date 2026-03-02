/**
 * PDF Generation Service
 * Handles PDF generation using Puppeteer for rendering
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { Book } from '../types/book';
import { BookStyle } from '../types/style';
import { TrimSize, PdfGenerationOptions, PdfGenerationResult } from '../types/pdf';

/**
 * Logger interface for structured logging
 */
interface Logger {
  info: (message: string, data?: Record<string, any>) => void;
  warn: (message: string, data?: Record<string, any>) => void;
  error: (message: string, data?: Record<string, any>) => void;
  debug: (message: string, data?: Record<string, any>) => void;
}

/**
 * Simple console-based logger implementation
 */
class ConsoleLogger implements Logger {
  info(message: string, data?: Record<string, any>): void {
    console.log(`[INFO] ${message}`, data || '');
  }

  warn(message: string, data?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, data || '');
  }

  error(message: string, data?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, data || '');
  }

  debug(message: string, data?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}

/**
 * PDF Generator Service Error
 */
export class PdfGeneratorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'PdfGeneratorError';
  }
}

/**
 * Generation context containing state during PDF generation
 */
interface GenerationContext {
  book: Book;
  style: BookStyle;
  trimSize: TrimSize;
  options: PdfGenerationOptions;
  startTime: number;
  page?: Page;
}

/**
 * PDF Generator Service
 * Manages PDF generation lifecycle using Puppeteer
 */
export class PdfGeneratorService {
  private browser: Browser | null = null;
  private isInitialized = false;
  private logger: Logger;
  private initPromise: Promise<void> | null = null;

  constructor(logger?: Logger) {
    this.logger = logger || new ConsoleLogger();
  }

  /**
   * Initializes the Puppeteer browser instance
   * @throws {PdfGeneratorError} If browser initialization fails
   */
  private async initializeBrowser(): Promise<void> {
    if (this.isInitialized && this.browser) {
      return;
    }

    // Return existing initialization promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.logger.info('Initializing Puppeteer browser...');

        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
        });

        this.isInitialized = true;
        this.logger.info('Puppeteer browser initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Puppeteer browser', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw new PdfGeneratorError(
          'Failed to initialize PDF generator',
          'BROWSER_INIT_FAILED',
          { originalError: error }
        );
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Validates input parameters for PDF generation
   * @param book The book to generate PDF from
   * @param style The style to apply
   * @param trimSize The trim size for the PDF
   * @param options Generation options
   * @throws {PdfGeneratorError} If validation fails
   */
  private validateInputs(
    book: Book,
    style: BookStyle,
    trimSize: TrimSize,
    options: PdfGenerationOptions
  ): void {
    // Validate book
    if (!book) {
      throw new PdfGeneratorError(
        'Book is required for PDF generation',
        'INVALID_BOOK',
        { book }
      );
    }

    if (!book.title || book.title.trim().length === 0) {
      throw new PdfGeneratorError(
        'Book must have a valid title',
        'INVALID_BOOK_TITLE',
        { title: book.title }
      );
    }

    if (!book.chapters || book.chapters.length === 0) {
      this.logger.warn('Book has no chapters', { bookId: book.id });
    }

    // Validate style
    if (!style) {
      throw new PdfGeneratorError(
        'Style is required for PDF generation',
        'INVALID_STYLE',
        { style }
      );
    }

    if (!style.id || !style.name) {
      throw new PdfGeneratorError(
        'Style must have valid id and name',
        'INVALID_STYLE_METADATA',
        { styleId: style.id, styleName: style.name }
      );
    }

    // Validate trim size
    if (!trimSize) {
      throw new PdfGeneratorError(
        'Trim size is required for PDF generation',
        'INVALID_TRIM_SIZE',
        { trimSize }
      );
    }

    // Validate custom trim size if specified
    if (trimSize === 'custom' && (!options.customTrimSize ||
        options.customTrimSize.width <= 0 ||
        options.customTrimSize.height <= 0)) {
      throw new PdfGeneratorError(
        'Custom trim size requires valid width and height',
        'INVALID_CUSTOM_TRIM_SIZE',
        { customTrimSize: options.customTrimSize }
      );
    }

    // Validate options
    if (!options) {
      throw new PdfGeneratorError(
        'Generation options are required',
        'INVALID_OPTIONS',
        { options }
      );
    }

    if (!options.margins) {
      throw new PdfGeneratorError(
        'Margin settings are required',
        'INVALID_MARGINS',
        { margins: options.margins }
      );
    }

    this.logger.debug('Input validation passed', {
      bookTitle: book.title,
      styleId: style.id,
      trimSize,
    });
  }

  /**
   * Sets up the generation context with validated inputs
   * @param book The book to generate PDF from
   * @param style The style to apply
   * @param trimSize The trim size for the PDF
   * @param options Generation options
   * @returns Generation context
   */
  private setupGenerationContext(
    book: Book,
    style: BookStyle,
    trimSize: TrimSize,
    options: PdfGenerationOptions
  ): GenerationContext {
    const context: GenerationContext = {
      book,
      style,
      trimSize,
      options,
      startTime: Date.now(),
    };

    this.logger.info('Generation context initialized', {
      bookId: book.id,
      bookTitle: book.title,
      styleId: style.id,
      trimSize,
      chapterCount: book.chapters.length,
    });

    return context;
  }

  /**
   * Generates a PDF from the provided book with specified style and options
   * @param book The book to generate PDF from
   * @param style The style to apply to the book
   * @param trimSize The trim size for the PDF
   * @param options PDF generation options
   * @returns Promise resolving to generation result
   * @throws {PdfGeneratorError} If generation fails
   */
  async generatePdf(
    book: Book,
    style: BookStyle,
    trimSize: TrimSize,
    options: PdfGenerationOptions
  ): Promise<PdfGenerationResult> {
    try {
      this.logger.info('Starting PDF generation', {
        bookTitle: book.title,
        trimSize,
      });

      // Validate inputs
      this.validateInputs(book, style, trimSize, options);

      // Ensure browser is initialized
      await this.initializeBrowser();

      // Setup generation context
      const context = this.setupGenerationContext(book, style, trimSize, options);

      // TODO: Implement actual PDF generation logic
      // - Create new page in browser
      // - Render book content with style
      // - Apply trim size and margins
      // - Generate PDF buffer
      // - Save to file system

      this.logger.warn('PDF generation not yet implemented', {
        context: {
          bookId: context.book.id,
          styleId: context.style.id,
        },
      });

      // Placeholder result
      const result: PdfGenerationResult = {
        success: false,
        error: 'PDF generation implementation pending',
      };

      const duration = Date.now() - context.startTime;
      this.logger.info('PDF generation completed', {
        success: result.success,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      this.logger.error('PDF generation failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof PdfGeneratorError) {
        throw error;
      }

      throw new PdfGeneratorError(
        'PDF generation failed with unexpected error',
        'GENERATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Cleans up resources and closes the browser instance
   * @throws {PdfGeneratorError} If cleanup fails
   */
  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        this.logger.info('Closing Puppeteer browser...');
        await this.browser.close();
        this.browser = null;
        this.isInitialized = false;
        this.logger.info('Puppeteer browser closed successfully');
      }
    } catch (error) {
      this.logger.error('Failed to cleanup browser', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new PdfGeneratorError(
        'Failed to cleanup PDF generator',
        'CLEANUP_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Checks if the service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.browser !== null;
  }
}

/**
 * Singleton instance of PDF Generator Service
 */
let pdfGeneratorInstance: PdfGeneratorService | null = null;

/**
 * Gets the singleton instance of PDF Generator Service
 * @returns The PDF generator service instance
 */
export function getPdfGeneratorService(): PdfGeneratorService {
  if (!pdfGeneratorInstance) {
    pdfGeneratorInstance = new PdfGeneratorService();
  }
  return pdfGeneratorInstance;
}

/**
 * Resets the singleton instance (primarily for testing)
 */
export function resetPdfGeneratorService(): void {
  if (pdfGeneratorInstance) {
    pdfGeneratorInstance.cleanup().catch((error) => {
      console.error('Error during service reset:', error);
    });
    pdfGeneratorInstance = null;
  }
}

/**
 * Export singleton instance for direct use
 */
export const pdfGeneratorService = getPdfGeneratorService();

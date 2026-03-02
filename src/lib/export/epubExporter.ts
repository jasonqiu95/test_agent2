/**
 * EPUB Export Service
 * Orchestrates the complete EPUB 3 generation workflow
 */

import { Book } from '../../types/book';
import { BookStyle } from '../../types/style';
import { ImageData } from '../../workers/types';
import {
  generateEPUBStructure,
  generateTOC,
  validateEPUB,
  packageEPUB,
  EPUBOptions,
  EPUBStructure,
  EPUBValidationResult,
} from '../epub/generator';

export interface ExportProgress {
  step: string;
  percentage: number;
  message: string;
}

export interface ExportResult {
  success: boolean;
  buffer?: ArrayBuffer;
  fileName: string;
  fileSize?: number;
  validation?: EPUBValidationResult;
  error?: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

/**
 * EPUB Exporter Service
 * Handles the complete workflow: book data → EPUB structure → metadata → styling → TOC → packaging
 */
export class EPUBExporter {
  private book: Book;
  private styles: BookStyle[];
  private images: ImageData[];
  private options: EPUBOptions;
  private progressCallback?: ProgressCallback;

  constructor(
    book: Book,
    styles: BookStyle[],
    images: ImageData[],
    options: EPUBOptions = {},
    progressCallback?: ProgressCallback
  ) {
    this.book = book;
    this.styles = styles;
    this.images = images;
    this.options = {
      includeMetadata: true,
      includeToc: true,
      validate: true,
      quality: 'standard',
      ...options,
    };
    this.progressCallback = progressCallback;
  }

  /**
   * Execute the complete EPUB export workflow
   */
  async export(): Promise<ExportResult> {
    try {
      // Step 1: Generate EPUB structure
      this.reportProgress('structure', 20, 'Generating EPUB structure...');
      const structure = generateEPUBStructure(
        this.book,
        this.styles,
        this.images,
        this.options
      );

      // Step 2: Inject metadata
      this.reportProgress('metadata', 40, 'Injecting metadata...');
      // Metadata is already part of structure generation

      // Step 3: Apply styling
      this.reportProgress('styling', 60, 'Applying styles...');
      // Styling is already part of structure generation

      // Step 4: Generate TOC
      if (this.options.includeToc) {
        this.reportProgress('toc', 70, 'Generating table of contents...');
        const toc = generateTOC(structure);
        // TOC generation is part of the packaging process
      }

      // Step 5: Validate
      let validation: EPUBValidationResult | undefined;
      if (this.options.validate) {
        this.reportProgress('validation', 80, 'Validating EPUB structure...');
        validation = validateEPUB(structure);

        if (!validation.valid) {
          const errors = validation.errors
            .filter(e => e.type === 'error')
            .map(e => e.message)
            .join('; ');
          return {
            success: false,
            fileName: this.generateFileName(),
            validation,
            error: `EPUB validation failed: ${errors}`,
          };
        }
      }

      // Step 6: Package EPUB
      this.reportProgress('packaging', 90, 'Packaging EPUB file...');
      const buffer = await packageEPUB(structure, this.options);

      const result = {
        success: true,
        buffer,
        fileName: this.generateFileName(),
        fileSize: buffer.byteLength,
        validation,
      };

      // Complete - report after creating result to avoid errors
      this.reportProgress('complete', 100, 'EPUB generation complete');

      return result;
    } catch (error) {
      const fileName = this.book?.title
        ? this.generateFileName()
        : 'untitled.epub';

      return {
        success: false,
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export with file system mock (for testing)
   */
  async exportWithMockFS(): Promise<ExportResult> {
    // This method uses the same export process but allows for mocked file system
    return this.export();
  }

  /**
   * Generate file name for the EPUB
   */
  private generateFileName(): string {
    const title = (this.book?.title || 'untitled')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    return `${title}_${timestamp}.epub`;
  }

  /**
   * Report progress to callback
   */
  private reportProgress(step: string, percentage: number, message: string): void {
    if (this.progressCallback) {
      this.progressCallback({ step, percentage, message });
    }
  }
}

/**
 * Convenience function to export EPUB
 */
export async function exportEPUB(
  book: Book,
  styles: BookStyle[],
  images: ImageData[],
  options: EPUBOptions = {},
  progressCallback?: ProgressCallback
): Promise<ExportResult> {
  const exporter = new EPUBExporter(book, styles, images, options, progressCallback);
  return exporter.export();
}

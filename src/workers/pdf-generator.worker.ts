/**
 * PDF Generator Web Worker
 * Handles PDF generation in a separate thread to avoid blocking the UI
 */

import * as PDFKit from 'pdfkit';

// @ts-ignore - PDFKit types are incomplete
const PDFDocument = (PDFKit as any).default || PDFKit;
import {
  WorkerMessageType,
  MainToWorkerMessage,
  WorkerToMainMessage,
  InitializeMessage,
  CancelMessage,
  CancelledMessage,
  createWorkerMessage,
  isInitializeMessage,
  isCancelMessage,
  PdfOptions,
} from './types';
import { Book } from '../types/book';
import { BookStyle } from '../types/style';
import { Chapter } from '../types/chapter';
import { Element } from '../types/element';
import { TextBlock } from '../types/textBlock';
import { ProgressReporter, ProgressStep, ProgressEvent, formatETA } from '../utils/ProgressReporter';

/**
 * Worker state
 */
interface WorkerState {
  isInitialized: boolean;
  isProcessing: boolean;
  isCancelled: boolean;
  workerId: string;
  operationTimeoutId?: number;
  activeResources: Set<string>;
  partialFiles: string[];
  currentProgress: number;
}

// Initialize worker state
const state: WorkerState = {
  isInitialized: false,
  isProcessing: false,
  isCancelled: false,
  workerId: `pdf-worker-${Date.now()}`,
  operationTimeoutId: undefined,
  activeResources: new Set(),
  partialFiles: [],
  currentProgress: 0,
};

/**
 * Configuration constants
 */
const OPERATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_BOOK_TITLE_LENGTH = 1;
const MAX_BOOK_TITLE_LENGTH = 500;
const MAX_CHAPTERS = 10000;

/**
 * Trim size dimensions in points (PDF units)
 */
const TRIM_SIZES: Record<string, { width: number; height: number }> = {
  '5x8': { width: 360, height: 576 },
  '5.5x8.5': { width: 396, height: 612 },
  '6x9': { width: 432, height: 648 },
  '7x10': { width: 504, height: 720 },
  '8x10': { width: 576, height: 720 },
  '8.5x11': { width: 612, height: 792 },
  A4: { width: 595.28, height: 841.89 },
  A5: { width: 419.53, height: 595.28 },
};

/**
 * Convert inches to points
 */
function inchesToPoints(inches: number): number {
  return inches * 72;
}

/**
 * Get page dimensions for a trim size
 */
function getPageDimensions(
  trimSize: string,
  customTrimSize?: { width: number; height: number }
): { width: number; height: number } {
  if (trimSize === 'custom' && customTrimSize) {
    return {
      width: inchesToPoints(customTrimSize.width),
      height: inchesToPoints(customTrimSize.height),
    };
  }
  return TRIM_SIZES[trimSize] || TRIM_SIZES['6x9'];
}

/**
 * Calculate content area based on margins
 */
function calculateContentArea(
  pageWidth: number,
  pageHeight: number,
  margins: {
    top: number;
    bottom: number;
    inside: number;
    outside: number;
  },
  isLeftPage: boolean
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const marginTop = inchesToPoints(margins.top);
  const marginBottom = inchesToPoints(margins.bottom);
  const marginInside = inchesToPoints(margins.inside);
  const marginOutside = inchesToPoints(margins.outside);

  const marginLeft = isLeftPage ? marginOutside : marginInside;
  const marginRight = isLeftPage ? marginInside : marginOutside;

  return {
    x: marginLeft,
    y: marginTop,
    width: pageWidth - marginLeft - marginRight,
    height: pageHeight - marginTop - marginBottom,
  };
}

/**
 * Post message to main thread with type safety
 */
function postMessage(message: WorkerToMainMessage): void {
  self.postMessage(message);
}

/**
 * Register a resource that needs cleanup
 */
function registerResource(resourceId: string): void {
  state.activeResources.add(resourceId);
}

/**
 * Unregister a resource after cleanup
 */
function unregisterResource(resourceId: string): void {
  state.activeResources.delete(resourceId);
}

/**
 * Clean up all active resources and partial files
 */
async function cleanupResources(): Promise<string[]> {
  const cleanedResources: string[] = [];

  // Clean up active resources
  for (const resourceId of state.activeResources) {
    try {
      // TODO: Implement actual resource cleanup based on resource type
      // This could include releasing PDF document objects, closing streams, etc.
      cleanedResources.push(resourceId);
    } catch (error) {
      console.error(`Failed to cleanup resource ${resourceId}:`, error);
    }
  }

  // Clean up partial files
  for (const filePath of state.partialFiles) {
    try {
      // TODO: Implement actual file cleanup
      // In a real implementation, this would delete temporary PDF fragments
      cleanedResources.push(filePath);
    } catch (error) {
      console.error(`Failed to cleanup partial file ${filePath}:`, error);
    }
  }

  state.activeResources.clear();
  state.partialFiles = [];

  return cleanedResources;
}

/**
 * Check if cancellation has been requested and throw if so
 * This should be called periodically during long operations
 */
function checkCancellation(): void {
  if (state.isCancelled) {
    throw new Error('CANCELLATION_REQUESTED');
  }
}

/**
 * Render page header
 */
function renderHeader(
  doc: PDFKit.PDFDocument,
  config: any,
  pageNumber: number,
  bookTitle: string,
  chapterTitle: string,
  contentArea: { x: number; y: number; width: number; height: number }
): void {
  if (!config?.enabled) return;

  const isLeftPage = pageNumber % 2 === 0;
  const headerText = isLeftPage
    ? config.leftPage || bookTitle
    : config.rightPage || chapterTitle;

  doc
    .fontSize(config.fontSize || 10)
    .font(config.fontFamily || 'Helvetica')
    .text(headerText, contentArea.x, contentArea.y - 30, {
      width: contentArea.width,
      align: isLeftPage ? 'left' : 'right',
    });
}

/**
 * Render page number
 */
function renderPageNumber(
  doc: PDFKit.PDFDocument,
  config: any,
  pageNumber: number,
  contentArea: { x: number; y: number; width: number; height: number },
  pageHeight: number
): void {
  if (!config?.enabled) return;

  const displayNumber = (config.startNumber || 1) + pageNumber - 1;
  const y =
    config.position === 'top'
      ? contentArea.y - 30
      : pageHeight - contentArea.y + 10;

  let align: 'left' | 'center' | 'right' = 'center';
  if (config.alignment === 'left') align = 'left';
  else if (config.alignment === 'right') align = 'right';

  doc
    .fontSize(config.fontSize || 10)
    .font(config.fontFamily || 'Helvetica')
    .text(String(displayNumber), contentArea.x, y, {
      width: contentArea.width,
      align,
    });
}

/**
 * Apply text styles from BookStyle
 */
function applyTextStyle(
  doc: PDFKit.PDFDocument,
  style: any,
  type: 'body' | 'heading'
): void {
  if (type === 'body') {
    doc
      .fontSize(style?.body?.fontSize ? parseFloat(style.body.fontSize) : 11)
      .font(style?.fonts?.body || 'Times-Roman')
      .fillColor(style?.colors?.text || '#000000');
  } else if (type === 'heading') {
    doc
      .fontSize(
        style?.headings?.h1?.fontSize
          ? parseFloat(style.headings.h1.fontSize)
          : 18
      )
      .font(style?.fonts?.heading || 'Helvetica-Bold')
      .fillColor(style?.colors?.heading || '#000000');
  }
}

/**
 * Render text blocks (chapters, front matter, back matter)
 */
function renderTextBlocks(
  doc: PDFKit.PDFDocument,
  blocks: TextBlock[],
  style: any,
  contentArea: { x: number; y: number; width: number; height: number }
): void {
  blocks.forEach((block) => {
    if (block.blockType === 'heading') {
      applyTextStyle(doc, style, 'heading');
      doc.text(block.content, contentArea.x, undefined, {
        width: contentArea.width,
        align: 'left',
      });
      doc.moveDown(0.5);
    } else {
      applyTextStyle(doc, style, 'body');
      doc.text(block.content, contentArea.x, undefined, {
        width: contentArea.width,
        align: style?.body?.textAlign || 'justify',
        lineGap: 3,
      });
      doc.moveDown(1);
    }
  });
}

/**
 * Render a chapter
 */
function renderChapter(
  doc: PDFKit.PDFDocument,
  chapter: Chapter,
  chapterIndex: number,
  style: any,
  contentArea: { x: number; y: number; width: number; height: number },
  options: any
): void {
  // Start new page for chapter
  if (chapterIndex > 0) {
    doc.addPage();
  }

  const pageNumber = (doc as any).bufferedPageRange().count;

  // Render chapter title
  doc
    .fontSize(
      style?.headings?.h1?.fontSize
        ? parseFloat(style.headings.h1.fontSize)
        : 24
    )
    .font(style?.fonts?.heading || 'Helvetica-Bold')
    .fillColor(style?.colors?.heading || '#000000')
    .text(
      chapter.number
        ? `Chapter ${chapter.number}: ${chapter.title}`
        : chapter.title,
      contentArea.x,
      contentArea.y + 50,
      {
        width: contentArea.width,
        align: 'center',
      }
    );

  doc.moveDown(2);

  // Render chapter content
  renderTextBlocks(doc, chapter.content, style, contentArea);
}

/**
 * Send progress update to main thread
 */
function sendProgress(
  percentage: number,
  status: string,
  details?: {
    currentChapter?: number;
    currentChapterTitle?: string;
    currentPage?: number;
    totalPages?: number;
    details?: string;
    eta?: number | null;
    currentStep?: string;
  }
): void {
  state.currentProgress = percentage;
  postMessage(
    createWorkerMessage(WorkerMessageType.PROGRESS, {
      percentage,
      status,
      ...details,
    })
  );
}

/**
 * Send error to main thread
 */
function sendError(
  code: string,
  message: string,
  details?: {
    details?: string;
    stack?: string;
    recoverable?: boolean;
    chapterNumber?: number;
    elementId?: string;
  }
): void {
  postMessage(
    createWorkerMessage(WorkerMessageType.ERROR, {
      code,
      message,
      ...details,
    })
  );
}

/**
 * Serialize error information safely
 */
function serializeError(error: unknown): { message: string; stack?: string; name?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error && typeof error === 'object') {
    return {
      message: String((error as any).message || error),
      stack: (error as any).stack,
      name: (error as any).name,
    };
  }

  return { message: 'Unknown error' };
}

/**
 * Validate book data structure
 */
function validateBookData(book: any): { isValid: boolean; error?: string } {
  if (!book || typeof book !== 'object') {
    return { isValid: false, error: 'Book data is missing or invalid' };
  }

  if (!book.title || typeof book.title !== 'string') {
    return { isValid: false, error: 'Book title is required and must be a string' };
  }

  if (book.title.length < MIN_BOOK_TITLE_LENGTH) {
    return { isValid: false, error: 'Book title is too short' };
  }

  if (book.title.length > MAX_BOOK_TITLE_LENGTH) {
    return { isValid: false, error: `Book title exceeds maximum length of ${MAX_BOOK_TITLE_LENGTH}` };
  }

  if (!Array.isArray(book.authors)) {
    return { isValid: false, error: 'Book authors must be an array' };
  }

  if (book.authors.length === 0) {
    return { isValid: false, error: 'Book must have at least one author' };
  }

  for (let i = 0; i < book.authors.length; i++) {
    const author = book.authors[i];
    if (!author || typeof author !== 'object') {
      return { isValid: false, error: `Author at index ${i} is invalid` };
    }
    if (!author.name || typeof author.name !== 'string') {
      return { isValid: false, error: `Author at index ${i} must have a name` };
    }
  }

  if (!Array.isArray(book.chapters)) {
    return { isValid: false, error: 'Book chapters must be an array' };
  }

  if (book.chapters.length === 0) {
    return { isValid: false, error: 'Book must have at least one chapter' };
  }

  if (book.chapters.length > MAX_CHAPTERS) {
    return { isValid: false, error: `Book has too many chapters (max: ${MAX_CHAPTERS})` };
  }

  for (let i = 0; i < book.chapters.length; i++) {
    const chapter = book.chapters[i];
    if (!chapter || typeof chapter !== 'object') {
      return { isValid: false, error: `Chapter at index ${i} is invalid`, chapterNumber: i };
    }
    if (!chapter.title || typeof chapter.title !== 'string') {
      return { isValid: false, error: `Chapter at index ${i} must have a title`, chapterNumber: i };
    }
  }

  return { isValid: true };
}

/**
 * Validate image data
 */
function validateImageData(images: any[]): { isValid: boolean; error?: string; imageId?: string } {
  if (!Array.isArray(images)) {
    return { isValid: false, error: 'Images must be an array' };
  }

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    if (!image || typeof image !== 'object') {
      return { isValid: false, error: `Image at index ${i} is invalid` };
    }

    if (!image.id || typeof image.id !== 'string') {
      return { isValid: false, error: `Image at index ${i} must have a valid ID`, imageId: image.id };
    }

    if (!image.url && !image.buffer) {
      return {
        isValid: false,
        error: `Image "${image.id}" must have either a URL or buffer`,
        imageId: image.id
      };
    }

    if (image.buffer) {
      if (!(image.buffer instanceof ArrayBuffer)) {
        return {
          isValid: false,
          error: `Image "${image.id}" buffer must be an ArrayBuffer`,
          imageId: image.id
        };
      }

      if (image.buffer.byteLength === 0) {
        return {
          isValid: false,
          error: `Image "${image.id}" has empty buffer`,
          imageId: image.id
        };
      }

      if (image.buffer.byteLength > MAX_IMAGE_SIZE) {
        return {
          isValid: false,
          error: `Image "${image.id}" exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
          imageId: image.id
        };
      }
    }

    if (image.url && typeof image.url !== 'string') {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid URL`,
        imageId: image.id
      };
    }

    if (image.mimeType && typeof image.mimeType !== 'string') {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid mimeType`,
        imageId: image.id
      };
    }

    // Validate dimensions if provided
    if (image.width !== undefined && (typeof image.width !== 'number' || image.width <= 0)) {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid width`,
        imageId: image.id
      };
    }

    if (image.height !== undefined && (typeof image.height !== 'number' || image.height <= 0)) {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid height`,
        imageId: image.id
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate styles data
 */
function validateStyles(styles: any[]): { isValid: boolean; error?: string } {
  if (!Array.isArray(styles)) {
    return { isValid: false, error: 'Styles must be an array' };
  }

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    if (!style || typeof style !== 'object') {
      return { isValid: false, error: `Style at index ${i} is invalid` };
    }
  }

  return { isValid: true };
}

/**
 * Validate initialization options
 */
function validateOptions(options: any): { isValid: boolean; error?: string } {
  if (!options) {
    return { isValid: true }; // Options are optional
  }

  if (typeof options !== 'object') {
    return { isValid: false, error: 'Options must be an object' };
  }

  if (options.format && !['epub', 'pdf', 'docx'].includes(options.format)) {
    return { isValid: false, error: `Invalid format: ${options.format}` };
  }

  if (options.quality && !['draft', 'standard', 'high'].includes(options.quality)) {
    return { isValid: false, error: `Invalid quality: ${options.quality}` };
  }

  if (options.pageSize && typeof options.pageSize !== 'string') {
    return { isValid: false, error: 'pageSize must be a string' };
  }

  if (options.margin && typeof options.margin !== 'string') {
    return { isValid: false, error: 'margin must be a string' };
  }

  return { isValid: true };
}

/**
 * Set operation timeout
 */
function setOperationTimeout(): void {
  clearOperationTimeout();

  state.operationTimeoutId = self.setTimeout(() => {
    if (state.isProcessing) {
      state.isCancelled = true;
      sendError(
        'OPERATION_TIMEOUT',
        `PDF generation timed out after ${OPERATION_TIMEOUT_MS / 1000} seconds`,
        { recoverable: false }
      );
      state.isProcessing = false;
    }
  }, OPERATION_TIMEOUT_MS);
}

/**
 * Clear operation timeout
 */
function clearOperationTimeout(): void {
  if (state.operationTimeoutId !== undefined) {
    self.clearTimeout(state.operationTimeoutId);
    state.operationTimeoutId = undefined;
  }
}

/**
 * Calculate total sections to process (for progress tracking)
 */
function calculateTotalSections(book: Book): {
  totalSections: number;
  frontMatterCount: number;
  chaptersCount: number;
  backMatterCount: number;
} {
  const frontMatterCount = book.frontMatter?.length || 0;
  const chaptersCount = book.chapters?.length || 0;
  const backMatterCount = book.backMatter?.length || 0;

  return {
    totalSections: frontMatterCount + chaptersCount + backMatterCount,
    frontMatterCount,
    chaptersCount,
    backMatterCount,
  };
}

/**
 * Generate PDF from book data
 */
async function generatePdf(
  book: Book,
  styles: BookStyle[],
  options: any
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const pdfOptions = options?.pdf || {};
      const style = styles[0]; // Use first style or default

      // Calculate total sections for progress tracking
      const { totalSections, frontMatterCount, chaptersCount, backMatterCount } =
        calculateTotalSections(book);

      // Define progress steps with weights
      const progressSteps: ProgressStep[] = [
        { id: 'validation', name: 'Validating document', weight: 5 },
        { id: 'setup', name: 'Setting up PDF document', weight: 5 },
        { id: 'frontmatter', name: 'Rendering front matter', weight: 15 },
        { id: 'chapters', name: 'Rendering chapters', weight: 40 },
        { id: 'backmatter', name: 'Rendering back matter', weight: 15 },
        { id: 'pagenumbers', name: 'Adding page numbers', weight: 10 },
        { id: 'finalize', name: 'Finalizing PDF', weight: 10 },
      ];

      // Create progress reporter
      const progressReporter = new ProgressReporter(
        progressSteps,
        (event: ProgressEvent) => {
          sendProgress(event.overallProgress, event.status, {
            details: event.details,
            eta: event.eta,
            currentStep: event.stepName,
          });
        },
        100 // Minimum 100ms between progress updates
      );

      let sectionsProcessed = 0;

      // Start validation step
      progressReporter.startStep('validation');
      progressReporter.updateProgress(50, 'Validating book structure');

      // Get page dimensions
      const pageDimensions = getPageDimensions(
        pdfOptions.trimSize || '6x9',
        pdfOptions.customTrimSize
      );

      // Default margins if not provided
      const margins = pdfOptions.margins || {
        top: 0.75,
        bottom: 0.75,
        inside: 0.75,
        outside: 0.5,
      };

      progressReporter.updateProgress(100, 'Validation complete');
      progressReporter.completeStep();

      // Start setup step
      progressReporter.startStep('setup');
      progressReporter.updateProgress(30, 'Creating PDF document');

      // Create PDF document
      const doc = new PDFDocument({
        size: [pageDimensions.width, pageDimensions.height],
        margins: {
          top: inchesToPoints(margins.top),
          bottom: inchesToPoints(margins.bottom),
          left: inchesToPoints(margins.outside),
          right: inchesToPoints(margins.inside),
        },
        autoFirstPage: false,
        bufferPages: true,
        compress: pdfOptions.compress !== false,
      });

      // Register PDF document as a resource
      registerResource('pdf-document');

      // Collect chunks for buffer
      const chunks: Uint8Array[] = [];
      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = new Uint8Array(
          chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        );
        let offset = 0;
        for (const chunk of chunks) {
          pdfBuffer.set(chunk, offset);
          offset += chunk.length;
        }
        unregisterResource('pdf-document');
        resolve(pdfBuffer.buffer);
      });
      doc.on('error', reject);

      progressReporter.updateProgress(70, 'Setting PDF metadata');

      // Set PDF metadata
      doc.info.Title = book.title || 'Untitled';
      doc.info.Author = book.authors
        .map((a) => a.name)
        .join(', ');
      if (book.metadata?.description) {
        doc.info.Subject = book.metadata.description;
      }
      if (book.metadata?.keywords) {
        doc.info.Keywords = book.metadata.keywords.join(', ');
      }

      progressReporter.updateProgress(100, 'PDF document setup complete');
      progressReporter.completeStep();

      let totalPages = 0;

      // Render front matter
      if (book.frontMatter && book.frontMatter.length > 0) {
        progressReporter.startStep('frontmatter');
        progressReporter.updateProgress(0, 'Starting front matter rendering', `Processing ${frontMatterCount} sections`);

        book.frontMatter.forEach((element, index) => {
          checkCancellation();

          doc.addPage();
          totalPages++;

          const isLeftPage = totalPages % 2 === 0;
          const contentArea = calculateContentArea(
            pageDimensions.width,
            pageDimensions.height,
            margins,
            isLeftPage
          );

          // Render element title
          doc
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(element.title, contentArea.x, contentArea.y, {
              width: contentArea.width,
              align: 'center',
            });

          doc.moveDown(2);

          // Render element content
          renderTextBlocks(doc, element.content, style, contentArea);

          sectionsProcessed++;
          const stepProgress = ((index + 1) / frontMatterCount) * 100;
          progressReporter.updateProgress(
            stepProgress,
            `Rendering: ${element.title}`,
            `Section ${index + 1} of ${frontMatterCount}`
          );
        });

        progressReporter.completeStep('Front matter complete');
      } else {
        // No front matter, skip this step
        progressReporter.startStep('frontmatter');
        progressReporter.completeStep('No front matter to render');
      }

      // Render chapters
      progressReporter.startStep('chapters');
      progressReporter.updateProgress(0, 'Starting chapter rendering', `Processing ${chaptersCount} chapters`);

      book.chapters.forEach((chapter, index) => {
        checkCancellation();

        doc.addPage();
        totalPages++;

        const isLeftPage = totalPages % 2 === 0;
        const contentArea = calculateContentArea(
          pageDimensions.width,
          pageDimensions.height,
          margins,
          isLeftPage
        );

        // Render headers if enabled
        if (pdfOptions.includeHeaders && index > 0) {
          renderHeader(
            doc,
            pdfOptions.headerConfig,
            totalPages,
            book.title,
            chapter.title,
            contentArea
          );
        }

        // Render page numbers if enabled
        if (pdfOptions.includePageNumbers) {
          renderPageNumber(
            doc,
            pdfOptions.pageNumberConfig,
            totalPages,
            contentArea,
            pageDimensions.height
          );
        }

        // Render chapter
        renderChapter(doc, chapter, index, style, contentArea, options);

        sectionsProcessed++;
        const stepProgress = ((index + 1) / chaptersCount) * 100;
        progressReporter.updateProgress(
          stepProgress,
          `Rendering: ${chapter.title}`,
          `Chapter ${index + 1} of ${chaptersCount}`
        );
      });

      progressReporter.completeStep('Chapters complete');

      // Render back matter
      if (book.backMatter && book.backMatter.length > 0) {
        progressReporter.startStep('backmatter');
        progressReporter.updateProgress(0, 'Starting back matter rendering', `Processing ${backMatterCount} sections`);

        book.backMatter.forEach((element, index) => {
          checkCancellation();

          doc.addPage();
          totalPages++;

          const isLeftPage = totalPages % 2 === 0;
          const contentArea = calculateContentArea(
            pageDimensions.width,
            pageDimensions.height,
            margins,
            isLeftPage
          );

          // Render element title
          doc
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(element.title, contentArea.x, contentArea.y, {
              width: contentArea.width,
              align: 'center',
            });

          doc.moveDown(2);

          // Render element content
          renderTextBlocks(doc, element.content, style, contentArea);

          sectionsProcessed++;
          const stepProgress = ((index + 1) / backMatterCount) * 100;
          progressReporter.updateProgress(
            stepProgress,
            `Rendering: ${element.title}`,
            `Section ${index + 1} of ${backMatterCount}`
          );
        });

        progressReporter.completeStep('Back matter complete');
      } else {
        // No back matter, skip this step
        progressReporter.startStep('backmatter');
        progressReporter.completeStep('No back matter to render');
      }

      // Add page numbers to all pages if enabled
      if (pdfOptions.includePageNumbers) {
        progressReporter.startStep('pagenumbers');
        const range = doc.bufferedPageRange();
        progressReporter.updateProgress(0, 'Adding page numbers', `Processing ${range.count} pages`);

        for (let i = 0; i < range.count; i++) {
          checkCancellation();

          doc.switchToPage(i);
          const pageNum = i + 1;
          const isLeftPage = pageNum % 2 === 0;
          const contentArea = calculateContentArea(
            pageDimensions.width,
            pageDimensions.height,
            margins,
            isLeftPage
          );
          renderPageNumber(
            doc,
            pdfOptions.pageNumberConfig,
            pageNum,
            contentArea,
            pageDimensions.height
          );

          // Report progress every 10 pages to avoid excessive updates
          if (i % 10 === 0 || i === range.count - 1) {
            const stepProgress = ((i + 1) / range.count) * 100;
            progressReporter.updateProgress(
              stepProgress,
              'Adding page numbers',
              `Page ${i + 1} of ${range.count}`
            );
          }
        }

        progressReporter.completeStep('Page numbers added');
      } else {
        // No page numbers, skip this step
        progressReporter.startStep('pagenumbers');
        progressReporter.completeStep('Page numbers not required');
      }

      // Finalize PDF
      progressReporter.startStep('finalize');
      progressReporter.updateProgress(30, 'Compressing document');

      progressReporter.updateProgress(70, 'Finalizing document');

      // Finalize the PDF
      doc.end();

      progressReporter.updateProgress(100, 'PDF generation complete');
      progressReporter.completeStep('Document ready');
    } catch (error) {
      unregisterResource('pdf-document');
      reject(error);
    }
  });
}

/**
 * Handle initialization message
 */
async function handleInitialize(message: InitializeMessage): Promise<void> {
  const startTime = Date.now();

  try {
    if (state.isProcessing) {
      sendError(
        'WORKER_BUSY',
        'Worker is already processing a task',
        { recoverable: false }
      );
      return;
    }

    state.isProcessing = true;
    state.isCancelled = false;
    state.currentProgress = 0;

    // Set operation timeout
    setOperationTimeout();

    // Validate message structure
    if (!message.data || typeof message.data !== 'object') {
      throw new Error('Invalid initialization data: missing or invalid data object');
    }

    const { book, styles, images, options } = message.data;

    // Validate book data
    const bookValidation = validateBookData(book);
    if (!bookValidation.isValid) {
      const error: any = new Error(`Invalid book data: ${bookValidation.error}`);
      error.chapterNumber = (bookValidation as any).chapterNumber;
      throw error;
    }

    checkCancellation();

    // Validate styles
    const stylesValidation = validateStyles(styles || []);
    if (!stylesValidation.isValid) {
      throw new Error(`Invalid styles: ${stylesValidation.error}`);
    }

    checkCancellation();

    // Validate images
    const imageValidation = validateImageData(images || []);
    if (!imageValidation.isValid) {
      const error: any = new Error(`Invalid image data: ${imageValidation.error}`);
      error.imageId = imageValidation.imageId;
      throw error;
    }

    checkCancellation();

    // Validate options
    const optionsValidation = validateOptions(options);
    if (!optionsValidation.isValid) {
      throw new Error(`Invalid options: ${optionsValidation.error}`);
    }

    checkCancellation();

    // Check for missing referenced images

    const imageIds = new Set((images || []).map(img => img.id));
    const warnings: string[] = [];

    // Check chapters for image references
    for (let i = 0; i < book.chapters.length; i++) {
      const chapter = book.chapters[i];
      if (chapter.content) {
        const imageReferences = chapter.content.match(/!\[.*?\]\((.*?)\)/g) || [];
        for (const ref of imageReferences) {
          const imageId = ref.match(/!\[.*?\]\((.*?)\)/)?.[1];
          if (imageId && !imageIds.has(imageId)) {
            warnings.push(`Chapter ${i + 1} "${chapter.title}" references missing image: ${imageId}`);
          }
        }
      }
    }

    checkCancellation();

    // Check cover image if specified
    if (book.coverImage && !imageIds.has(book.coverImage)) {
      warnings.push(`Book references missing cover image: ${book.coverImage}`);
    }

    checkCancellation();

    // Generate the PDF (progress is tracked internally via ProgressReporter)
    const buffer = await generatePdf(book, styles || [], options);

    // Clean up resources on successful completion
    await cleanupResources();

    const processingTime = Date.now() - startTime;

    postMessage(
      createWorkerMessage(WorkerMessageType.COMPLETE, {
        buffer,
        fileName: `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        fileSize: buffer.byteLength,
        mimeType: 'application/pdf',
        metadata: {
          processingTimeMs: processingTime,
          pageCount: book.chapters.length, // Approximate page count
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      })
    );
  } catch (error) {
    const serialized = serializeError(error);
    const errorMessage = serialized.message;

    // Check if this is a cancellation
    if (errorMessage === 'CANCELLATION_REQUESTED') {
      // Clean up resources
      const cleanedResources = await cleanupResources();

      postMessage(
        createWorkerMessage(WorkerMessageType.CANCELLED, {
          reason: 'PDF generation cancelled by user',
          partialProgress: state.currentProgress,
          cleanedUp: true,
          resourcesReleased: cleanedResources,
        })
      );
    } else {
      // This is an actual error, attempt cleanup anyway
      try {
        await cleanupResources();
      } catch (cleanupError) {
        console.error('Failed to cleanup after error:', cleanupError);
      }

      const errorCode = state.isCancelled ? 'GENERATION_CANCELLED' :
                       (error as any).chapterNumber !== undefined ? 'CHAPTER_ERROR' :
                       (error as any).imageId ? 'IMAGE_ERROR' :
                       serialized.name === 'TypeError' ? 'INVALID_DATA' :
                       serialized.name === 'RangeError' ? 'RESOURCE_LIMIT' :
                       serialized.name === 'ReferenceError' ? 'LIBRARY_ERROR' :
                       'GENERATION_ERROR';

      sendError(
        errorCode,
        `PDF generation failed: ${serialized.message}`,
        {
          details: serialized.stack,
          stack: serialized.stack,
          recoverable: state.isCancelled,
          chapterNumber: (error as any).chapterNumber,
          elementId: (error as any).imageId,
        }
      );
    }
  } finally {
    clearOperationTimeout();
    state.isProcessing = false;
    state.isCancelled = false;
    state.currentProgress = 0;
  }
}

/**
 * Handle cancellation message
 */
function handleCancel(message: CancelMessage): void {
  if (!state.isProcessing) {
    // Not processing, nothing to cancel
    return;
  }

  // Set the cancellation flag
  state.isCancelled = true;

  // Send progress update to inform user that cancellation is in progress
  sendProgress(state.currentProgress, 'Cancelling PDF generation and cleaning up...', {
    details: message.data.reason,
  });
}

/**
 * Route incoming messages to appropriate handlers
 */
async function routeMessage(message: MainToWorkerMessage): Promise<void> {
  try {
    // Validate message structure
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message: message must be an object');
    }

    if (!message.type) {
      throw new Error('Invalid message: missing type field');
    }

    if (typeof message.timestamp !== 'number') {
      throw new Error('Invalid message: missing or invalid timestamp');
    }

    if (isInitializeMessage(message)) {
      await handleInitialize(message);
    } else if (isCancelMessage(message)) {
      handleCancel(message);
    } else {
      // Unknown message type - should never reach here with proper types
      const unknownMessage = message as any;
      sendError('INVALID_MESSAGE', `Unknown message type: ${unknownMessage.type}`, {
        recoverable: false,
      });
    }
  } catch (error) {
    const serialized = serializeError(error);

    sendError('MESSAGE_HANDLER_ERROR', `Failed to handle message: ${serialized.message}`, {
      details: serialized.stack,
      stack: serialized.stack,
      recoverable: false,
    });
  }
}

/**
 * Global error handler for uncaught errors
 */
self.onerror = (event: ErrorEvent) => {
  const serialized = serializeError(event.error || event.message);
  const location = event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : 'unknown location';

  sendError('WORKER_ERROR', `Uncaught error in worker: ${serialized.message}`, {
    details: `Error at ${location}`,
    stack: serialized.stack,
    recoverable: false,
  });

  // Clear any ongoing operation
  clearOperationTimeout();
  state.isProcessing = false;
  state.isCancelled = false;

  // Prevent default error handling
  event.preventDefault();
  return true;
};

/**
 * Global handler for unhandled promise rejections
 */
self.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const serialized = serializeError(event.reason);

  sendError('WORKER_UNHANDLED_REJECTION', `Unhandled promise rejection: ${serialized.message}`, {
    details: 'A promise was rejected but no error handler was attached',
    stack: serialized.stack,
    recoverable: false,
  });

  // Clear any ongoing operation
  clearOperationTimeout();
  state.isProcessing = false;
  state.isCancelled = false;

  // Prevent default error handling
  event.preventDefault();
};

/**
 * Message event listener - entry point for all messages from main thread
 */
self.onmessage = async (event: MessageEvent<MainToWorkerMessage>) => {
  try {
    const message = event.data;

    // Validate message structure
    if (!message || typeof message !== 'object' || !message.type) {
      sendError('INVALID_MESSAGE', 'Invalid message format: message must be an object with a type field', {
        recoverable: false,
      });
      return;
    }

    await routeMessage(message);
  } catch (error) {
    const serialized = serializeError(error);

    sendError('MESSAGE_ERROR', `Error processing message: ${serialized.message}`, {
      details: serialized.stack,
      stack: serialized.stack,
      recoverable: false,
    });
  }
};

/**
 * Initialize worker and notify main thread
 */
function initialize(): void {
  try {
    state.isInitialized = true;

    // Send ready message to main thread
    postMessage(
      createWorkerMessage(WorkerMessageType.READY, {
        workerId: state.workerId,
        capabilities: ['pdf-generation', 'progress-tracking', 'cancellation', 'validation'],
      })
    );
  } catch (error) {
    const serialized = serializeError(error);
    sendError('INITIALIZATION_ERROR', `Failed to initialize worker: ${serialized.message}`, {
      details: serialized.stack,
      stack: serialized.stack,
      recoverable: false,
    });
  }
}

// Initialize the worker on startup
initialize();

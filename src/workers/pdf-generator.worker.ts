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

/**
 * Worker state
 */
interface WorkerState {
  isInitialized: boolean;
  isProcessing: boolean;
  isCancelled: boolean;
  workerId: string;
}

// Initialize worker state
const state: WorkerState = {
  isInitialized: false,
  isProcessing: false,
  isCancelled: false,
  workerId: `pdf-worker-${Date.now()}`,
};

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
  }
): void {
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
        resolve(pdfBuffer.buffer);
      });
      doc.on('error', reject);

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

      let totalPages = 0;

      // Render front matter
      if (book.frontMatter && book.frontMatter.length > 0) {
        sendProgress(20, 'Rendering front matter...');
        book.frontMatter.forEach((element, index) => {
          if (state.isCancelled) return;

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
        });
      }

      // Render chapters
      sendProgress(40, 'Rendering chapters...');
      book.chapters.forEach((chapter, index) => {
        if (state.isCancelled) return;

        sendProgress(
          40 + ((index / book.chapters.length) * 40),
          `Rendering chapter ${index + 1} of ${book.chapters.length}...`,
          {
            currentChapter: index + 1,
            currentChapterTitle: chapter.title,
          }
        );

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
      });

      // Render back matter
      if (book.backMatter && book.backMatter.length > 0) {
        sendProgress(85, 'Rendering back matter...');
        book.backMatter.forEach((element) => {
          if (state.isCancelled) return;

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
        });
      }

      // Add page numbers to all pages if enabled
      if (pdfOptions.includePageNumbers) {
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
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
        }
      }

      sendProgress(95, 'Finalizing PDF...');

      // Finalize the PDF
      doc.end();
    } catch (error) {
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

    sendProgress(0, 'Initializing PDF generation...');

    const { book, styles, images, options } = message.data;

    sendProgress(10, 'Parsing book data...');

    // Validate book data
    if (!book || !book.title) {
      throw new Error('Invalid book data: missing title');
    }

    if (!book.chapters || book.chapters.length === 0) {
      throw new Error('Invalid book data: no chapters found');
    }

    if (state.isCancelled) {
      sendError('GENERATION_CANCELLED', 'PDF generation was cancelled', {
        recoverable: true,
      });
      return;
    }

    sendProgress(15, 'Generating PDF document...');

    // Generate the PDF
    const buffer = await generatePdf(book, styles || [], options);

    if (state.isCancelled) {
      sendError('GENERATION_CANCELLED', 'PDF generation was cancelled', {
        recoverable: true,
      });
      return;
    }

    sendProgress(100, 'PDF generation complete');

    const processingTime = Date.now() - startTime;

    postMessage(
      createWorkerMessage(WorkerMessageType.COMPLETE, {
        buffer,
        fileName: `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        fileSize: buffer.byteLength,
        mimeType: 'application/pdf',
        metadata: {
          processingTimeMs: processingTime,
          pageCount: book.pageCount,
        },
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    sendError('GENERATION_ERROR', `PDF generation failed: ${errorMessage}`, {
      details: errorMessage,
      stack: errorStack,
      recoverable: false,
    });
  } finally {
    state.isProcessing = false;
  }
}

/**
 * Handle cancellation message
 */
function handleCancel(message: CancelMessage): void {
  state.isCancelled = true;
  sendProgress(0, 'Cancelling PDF generation...', {
    details: message.data.reason,
  });
}

/**
 * Route incoming messages to appropriate handlers
 */
async function routeMessage(message: MainToWorkerMessage): Promise<void> {
  try {
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    sendError('MESSAGE_HANDLER_ERROR', `Failed to handle message: ${errorMessage}`, {
      details: errorMessage,
      stack: errorStack,
      recoverable: false,
    });
  }
}

/**
 * Global error handler for uncaught errors
 */
self.onerror = (event: ErrorEvent) => {
  sendError('WORKER_ERROR', `Uncaught error in worker: ${event.message}`, {
    details: event.message,
    stack: event.error?.stack,
    recoverable: false,
  });
  return true; // Prevent default error handling
};

/**
 * Global handler for unhandled promise rejections
 */
self.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const errorMessage =
    event.reason instanceof Error ? event.reason.message : String(event.reason);
  const errorStack =
    event.reason instanceof Error ? event.reason.stack : undefined;

  sendError('WORKER_UNHANDLED_REJECTION', `Unhandled promise rejection: ${errorMessage}`, {
    details: errorMessage,
    stack: errorStack,
    recoverable: false,
  });
};

/**
 * Message event listener - entry point for all messages from main thread
 */
self.onmessage = async (event: MessageEvent<MainToWorkerMessage>) => {
  try {
    const message = event.data;

    // Validate message structure
    if (!message || typeof message !== 'object' || !message.type) {
      sendError('INVALID_MESSAGE', 'Invalid message format', {
        recoverable: false,
      });
      return;
    }

    await routeMessage(message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    sendError('MESSAGE_ERROR', `Error processing message: ${errorMessage}`, {
      details: errorMessage,
      stack: errorStack,
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
        capabilities: ['pdf-generation', 'progress-tracking', 'cancellation'],
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendError('INITIALIZATION_ERROR', `Failed to initialize worker: ${errorMessage}`, {
      recoverable: false,
    });
  }
}

// Initialize the worker on startup
initialize();

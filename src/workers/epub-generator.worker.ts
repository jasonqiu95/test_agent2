/**
 * EPUB Generator Web Worker
 *
 * Handles EPUB generation in a separate thread to avoid blocking the UI.
 * Communicates with the main thread using a defined message protocol.
 */

import {
  WorkerMessageType,
  MainToWorkerMessage,
  WorkerToMainMessage,
  isInitializeMessage,
  isCancelMessage,
  createWorkerMessage,
  ReadyMessage,
  ProgressMessage,
  ErrorMessage,
  CompleteMessage,
  ImageData,
  InitializeMessage,
} from './types';
import { Book } from '../types/book';
import { Chapter } from '../types/chapter';
import { Element } from '../types/element';
import { TextBlock } from '../types/textBlock';
import { BookStyle, Style } from '../types/style';
// @ts-ignore - epub-gen-memory types may not be perfect
import Epub from 'epub-gen-memory';

/**
 * Utility functions for EPUB generation
 */

/**
 * Convert BookStyle to CSS string
 */
function bookStyleToCSS(style: BookStyle): string {
  const css: string[] = [];

  // Body styles
  css.push(`
    body {
      font-family: ${style.fonts.body}, ${style.fonts.fallback};
      font-size: ${style.body.fontSize};
      line-height: ${style.body.lineHeight};
      font-weight: ${style.body.fontWeight || 'normal'};
      text-align: ${style.body.textAlign || 'left'};
      color: ${style.colors.text};
      ${style.colors.background ? `background-color: ${style.colors.background};` : ''}
    }
  `);

  // Heading styles
  const headings = ['h1', 'h2', 'h3', 'h4'] as const;
  headings.forEach((tag) => {
    const headingStyle = style.headings[tag];
    if (headingStyle) {
      css.push(`
        ${tag} {
          font-family: ${headingStyle.fontFamily || style.fonts.heading}, ${style.fonts.fallback};
          font-size: ${headingStyle.fontSize};
          font-weight: ${headingStyle.fontWeight || 'bold'};
          line-height: ${headingStyle.lineHeight || '1.2'};
          margin-top: ${headingStyle.marginTop || '1em'};
          margin-bottom: ${headingStyle.marginBottom || '0.5em'};
          ${headingStyle.textTransform ? `text-transform: ${headingStyle.textTransform};` : ''}
          ${headingStyle.letterSpacing ? `letter-spacing: ${headingStyle.letterSpacing};` : ''}
          color: ${headingStyle.color || style.colors.heading};
        }
      `);
    }
  });

  // Paragraph styles
  css.push(`
    p {
      margin-bottom: ${style.spacing.paragraphSpacing};
      text-indent: 1.5em;
    }
  `);

  // First paragraph (no indent)
  if (style.firstParagraph.enabled) {
    css.push(`
      .first-paragraph {
        text-indent: ${style.firstParagraph.indent?.enabled ? style.firstParagraph.indent.value || '0' : '0'};
        ${style.firstParagraph.textTransform ? `text-transform: ${style.firstParagraph.textTransform};` : ''}
        ${style.firstParagraph.fontVariant ? `font-variant: ${style.firstParagraph.fontVariant};` : ''}
        ${style.firstParagraph.letterSpacing ? `letter-spacing: ${style.firstParagraph.letterSpacing};` : ''}
        ${style.firstParagraph.fontSize ? `font-size: ${style.firstParagraph.fontSize};` : ''}
      }
    `);
  }

  // Drop cap styles
  if (style.dropCap.enabled) {
    css.push(`
      .drop-cap::first-letter {
        float: left;
        font-size: ${style.dropCap.fontSize || '3.5em'};
        line-height: ${style.dropCap.lines || 3};
        font-family: ${style.dropCap.fontFamily || style.fonts.heading}, ${style.fonts.fallback};
        font-weight: ${style.dropCap.fontWeight || 'bold'};
        margin-right: ${style.dropCap.marginRight || '0.1em'};
        color: ${style.dropCap.color || style.colors.dropCap || style.colors.accent || style.colors.heading};
      }
    `);
  }

  // Ornamental break
  if (style.ornamentalBreak.enabled) {
    css.push(`
      .ornamental-break {
        text-align: ${style.ornamentalBreak.textAlign || 'center'};
        font-size: ${style.ornamentalBreak.fontSize || '1.5em'};
        margin-top: ${style.ornamentalBreak.marginTop || '1em'};
        margin-bottom: ${style.ornamentalBreak.marginBottom || '1em'};
      }
    `);
  }

  // Code and preformatted text
  css.push(`
    pre, code {
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 0.5em;
      overflow-x: auto;
    }

    code {
      padding: 0.2em 0.4em;
      font-size: 0.9em;
    }
  `);

  return css.join('\n');
}

/**
 * Convert Style to CSS properties
 */
function styleToCSSProperties(style: Style): string {
  const props: string[] = [];

  if (style.fontFamily) props.push(`font-family: ${style.fontFamily}`);
  if (style.fontSize) props.push(`font-size: ${style.fontSize}px`);
  if (style.fontWeight) props.push(`font-weight: ${style.fontWeight}`);
  if (style.fontStyle) props.push(`font-style: ${style.fontStyle}`);
  if (style.textAlign) props.push(`text-align: ${style.textAlign}`);
  if (style.textDecoration) props.push(`text-decoration: ${style.textDecoration}`);
  if (style.textTransform) props.push(`text-transform: ${style.textTransform}`);
  if (style.lineHeight) props.push(`line-height: ${style.lineHeight}`);
  if (style.letterSpacing) props.push(`letter-spacing: ${style.letterSpacing}`);
  if (style.color) props.push(`color: ${style.color}`);
  if (style.backgroundColor) props.push(`background-color: ${style.backgroundColor}`);
  if (style.padding) props.push(`padding: ${style.padding}`);
  if (style.margin) props.push(`margin: ${style.margin}`);
  if (style.border) props.push(`border: ${style.border}`);

  if (style.customProperties) {
    Object.entries(style.customProperties).forEach(([key, value]) => {
      props.push(`${key}: ${value}`);
    });
  }

  return props.join('; ');
}

/**
 * Convert TextBlock to HTML
 */
function textBlockToHTML(block: TextBlock, isFirst: boolean = false): string {
  let content = escapeHTML(block.content);

  // Apply features (bold, italic, etc.) if present
  if (block.features && block.features.length > 0) {
    // This is a simplified version - in a real implementation,
    // you'd need to apply features at the correct positions
    content = block.content;
  }

  switch (block.blockType) {
    case 'heading':
      const level = Math.min(block.level || 1, 6);
      return `<h${level}>${content}</h${level}>`;

    case 'preformatted':
      return `<pre>${content}</pre>`;

    case 'code':
      const lang = block.language ? ` class="language-${block.language}"` : '';
      return `<pre><code${lang}>${content}</code></pre>`;

    case 'paragraph':
    default:
      const className = isFirst ? ' class="first-paragraph drop-cap"' : '';
      return `<p${className}>${content}</p>`;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Convert Chapter to HTML
 */
function chapterToHTML(chapter: Chapter): string {
  const html: string[] = [];

  // Chapter title
  if (chapter.number && chapter.title) {
    html.push(`<h1>Chapter ${chapter.number}: ${escapeHTML(chapter.title)}</h1>`);
  } else if (chapter.title) {
    html.push(`<h1>${escapeHTML(chapter.title)}</h1>`);
  }

  // Subtitle
  if (chapter.subtitle) {
    html.push(`<h2>${escapeHTML(chapter.subtitle)}</h2>`);
  }

  // Epigraph
  if (chapter.epigraph) {
    html.push(`<div class="epigraph">`);
    html.push(`<p><em>${escapeHTML(chapter.epigraph)}</em></p>`);
    if (chapter.epigraphAttribution) {
      html.push(`<p class="attribution">— ${escapeHTML(chapter.epigraphAttribution)}</p>`);
    }
    html.push(`</div>`);
  }

  // Content
  chapter.content.forEach((block, index) => {
    html.push(textBlockToHTML(block, index === 0));
  });

  return html.join('\n');
}

/**
 * Convert Element (front/back matter) to HTML
 */
function elementToHTML(element: Element): string {
  const html: string[] = [];

  // Element title
  html.push(`<h1>${escapeHTML(element.title)}</h1>`);

  // Content
  element.content.forEach((block, index) => {
    html.push(textBlockToHTML(block, index === 0));
  });

  return html.join('\n');
}

/**
 * Worker state
 */
interface WorkerState {
  isProcessing: boolean;
  isCancelled: boolean;
  workerId: string;
  operationTimeoutId?: number;
}

// Initialize worker state
const state: WorkerState = {
  isProcessing: false,
  isCancelled: false,
  workerId: crypto.randomUUID(),
  operationTimeoutId: undefined,
};

/**
 * Configuration constants
 */
const OPERATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_BOOK_TITLE_LENGTH = 1;
const MAX_BOOK_TITLE_LENGTH = 500;

/**
 * Post a message to the main thread
 */
function postMessageToMain(message: WorkerToMainMessage): void {
  self.postMessage(message);
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
    return { isValid: false, error: 'Book title is too long' };
  }

  if (!Array.isArray(book.authors)) {
    return { isValid: false, error: 'Book authors must be an array' };
  }

  if (book.authors.length === 0) {
    return { isValid: false, error: 'Book must have at least one author' };
  }

  for (let i = 0; i < book.authors.length; i++) {
    const author = book.authors[i];
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

  for (let i = 0; i < book.chapters.length; i++) {
    const chapter = book.chapters[i];
    if (!chapter || typeof chapter !== 'object') {
      return { isValid: false, error: `Chapter at index ${i} is invalid` };
    }
    if (!chapter.title || typeof chapter.title !== 'string') {
      return { isValid: false, error: `Chapter at index ${i} must have a title` };
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

    if (image.buffer && image.buffer.byteLength > MAX_IMAGE_SIZE) {
      return {
        isValid: false,
        error: `Image "${image.id}" exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        imageId: image.id
      };
    }

    if (image.url && typeof image.url !== 'string') {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid URL`,
        imageId: image.id
      };
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
      postMessageToMain(
        createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
          code: 'OPERATION_TIMEOUT',
          message: `EPUB generation timed out after ${OPERATION_TIMEOUT_MS / 1000} seconds`,
          recoverable: false,
        })
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
 * Check if operation was cancelled
 */
function checkCancellation(): void {
  if (state.isCancelled) {
    throw new Error('Generation cancelled by user');
  }
}

/**
 * Handle initialization message
 */
async function handleInitialize(message: InitializeMessage): Promise<void> {
  const startTime = Date.now();

  if (state.isProcessing) {
    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: 'WORKER_BUSY',
        message: 'Worker is already processing a task',
        recoverable: false,
      })
    );
    return;
  }

  state.isProcessing = true;
  state.isCancelled = false;

  try {
    // Set operation timeout
    setOperationTimeout();

    // Send initial progress
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 0,
        status: 'Initializing EPUB generation...',
      })
    );

    // Validate message structure
    if (!message.data || typeof message.data !== 'object') {
      throw new Error('Invalid initialization data: missing or invalid data object');
    }

    const { book, styles, images, options } = message.data;

    // Validate book data
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 5,
        status: 'Validating book data...',
      })
    );

    const bookValidation = validateBookData(book);
    if (!bookValidation.isValid) {
      throw new Error(`Invalid book data: ${bookValidation.error}`);
    }

    checkCancellation();

    // Validate images
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 8,
        status: 'Validating images...',
      })
    );

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

    // Validate styles
    if (styles && !Array.isArray(styles)) {
      throw new Error('Invalid styles: must be an array');
    }

    checkCancellation();

    // Check for missing referenced images
    const imageIds = new Set((images || []).map(img => img.id));
    const warnings: string[] = [];

    // Check chapters for image references
    for (const chapter of book.chapters) {
      if (chapter.content) {
        const imageReferences = chapter.content.match(/!\[.*?\]\((.*?)\)/g) || [];
        for (const ref of imageReferences) {
          const imageId = ref.match(/!\[.*?\]\((.*?)\)/)?.[1];
          if (imageId && !imageIds.has(imageId)) {
            warnings.push(`Chapter "${chapter.title}" references missing image: ${imageId}`);
          }
        }
      }
    }

    checkCancellation();

    // Progress: 10% - Prepare metadata
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 10,
        status: 'Preparing metadata...',
      })
    );

    // Prepare EPUB metadata
    const author = book.authors.length > 0
      ? book.authors.map(a => a.name).join(', ')
      : 'Unknown Author';

    const epubOptions: any = {
      title: book.title,
      author: author,
      publisher: book.metadata.publisher || 'Self-Published',
      cover: book.coverImage,
      description: book.metadata.description,
      tocTitle: 'Table of Contents',
      appendChapterTitles: true,
      date: book.metadata.publicationDate
        ? new Date(book.metadata.publicationDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      lang: book.metadata.language || 'en',
      version: 3, // EPUB 3
    };

    // Add optional metadata
    if (book.metadata.isbn) {
      epubOptions.isbn = book.metadata.isbn;
    }
    if (book.metadata.series) {
      epubOptions.series = book.metadata.series;
      if (book.metadata.seriesNumber) {
        epubOptions.sequence = book.metadata.seriesNumber;
      }
    }

    if (state.isCancelled) {
      throw new Error('Generation cancelled by user');
    }

    // Progress: 20% - Generate CSS
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 20,
        status: 'Generating CSS styles...',
      })
    );

    // Generate CSS from BookStyles
    let cssContent = '';
    if (styles && styles.length > 0) {
      cssContent = styles.map(style => bookStyleToCSS(style)).join('\n\n');
    } else {
      // Default minimal CSS
      cssContent = `
        body {
          font-family: Georgia, serif;
          font-size: 1em;
          line-height: 1.6;
          text-align: left;
          color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        p {
          margin-bottom: 1em;
          text-indent: 1.5em;
        }
      `;
    }

    epubOptions.css = cssContent;

    if (state.isCancelled) {
      throw new Error('Generation cancelled by user');
    }

    // Progress: 30% - Prepare content
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 30,
        status: 'Preparing content...',
      })
    );

    // Build content array for epub-gen
    const content: any[] = [];
    let totalItems = book.frontMatter.length + book.chapters.length + book.backMatter.length;
    let processedItems = 0;

    // Add front matter
    for (const element of book.frontMatter) {
      if (state.isCancelled) {
        throw new Error('Generation cancelled by user');
      }

      content.push({
        title: element.title,
        data: elementToHTML(element),
        beforeToc: true,
      });

      processedItems++;
      const progress = 30 + Math.floor((processedItems / totalItems) * 40);
      postMessageToMain(
        createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
          percentage: progress,
          status: `Processing front matter: ${element.title}...`,
        })
      );
    }
=======
    // Validate message structure
    if (!message.data || typeof message.data !== 'object') {
      throw new Error('Invalid initialization data: missing or invalid data object');
    }

    const { book, styles, images, options } = message.data;

    // Validate book data
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 5,
        status: 'Validating book data...',
      })
    );

    const bookValidation = validateBookData(book);
    if (!bookValidation.isValid) {
      throw new Error(`Invalid book data: ${bookValidation.error}`);
    }

    checkCancellation();

    // Validate images
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 10,
        status: 'Validating images...',
      })
    );

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

    // Validate styles
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 15,
        status: 'Validating styles...',
      })
    );

    if (styles && !Array.isArray(styles)) {
      throw new Error('Invalid styles: must be an array');
    }

    checkCancellation();

    // Check for missing referenced images
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 20,
        status: 'Checking image references...',
      })
    );

    const imageIds = new Set((images || []).map(img => img.id));
    const warnings: string[] = [];

    // Check chapters for image references
    for (const chapter of book.chapters) {
      if (chapter.content) {
        const imageReferences = chapter.content.match(/!\[.*?\]\((.*?)\)/g) || [];
        for (const ref of imageReferences) {
          const imageId = ref.match(/!\[.*?\]\((.*?)\)/)?.[1];
          if (imageId && !imageIds.has(imageId)) {
            warnings.push(`Chapter "${chapter.title}" references missing image: ${imageId}`);
          }
        }
      }
    }

    checkCancellation();

    // TODO: Implement actual EPUB generation logic
    // For now, this is a skeleton that demonstrates the message flow

    // Simulate some work with progress updates
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 30,
        status: 'Generating EPUB structure...',
      })
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    checkCancellation();

    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 50,
        status: 'Processing chapters...',
      })
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    checkCancellation();

    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 70,
        status: 'Embedding images...',
      })
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    checkCancellation();

    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 90,
        status: 'Finalizing EPUB...',
      })
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    checkCancellation();
>>>>>>> agent/implement-worker-error-handling

    // Add chapters
    for (let i = 0; i < book.chapters.length; i++) {
      if (state.isCancelled) {
        throw new Error('Generation cancelled by user');
      }

      const chapter = book.chapters[i];
      content.push({
        title: chapter.title,
        data: chapterToHTML(chapter),
        excludeFromToc: chapter.includeInToc === false,
      });

      processedItems++;
      const progress = 30 + Math.floor((processedItems / totalItems) * 40);
      postMessageToMain(
        createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
          percentage: progress,
          status: `Processing chapter ${i + 1}/${book.chapters.length}: ${chapter.title}...`,
          currentChapter: i + 1,
          currentChapterTitle: chapter.title,
        })
      );
    }

    // Add back matter
    for (const element of book.backMatter) {
      if (state.isCancelled) {
        throw new Error('Generation cancelled by user');
      }

      content.push({
        title: element.title,
        data: elementToHTML(element),
        excludeFromToc: element.includeInToc === false,
      });

      processedItems++;
      const progress = 30 + Math.floor((processedItems / totalItems) * 40);
      postMessageToMain(
        createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
          percentage: progress,
          status: `Processing back matter: ${element.title}...`,
        })
      );
    }

    epubOptions.content = content;

    if (state.isCancelled) {
      throw new Error('Generation cancelled by user');
    }

    // Progress: 70% - Generate EPUB
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 70,
        status: 'Generating EPUB file...',
      })
    );

    // Generate EPUB using epub-gen-memory
    // This library returns a Buffer which we need to convert to ArrayBuffer
    const epubBuffer = await new Epub(epubOptions).generate();

    if (state.isCancelled) {
      throw new Error('Generation cancelled by user');
    }

    // Progress: 90% - Finalizing
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 90,
        status: 'Finalizing...',
      })
    );

    // Convert Node.js Buffer to ArrayBuffer for structured cloning
    const arrayBuffer = epubBuffer.buffer.slice(
      epubBuffer.byteOffset,
      epubBuffer.byteOffset + epubBuffer.byteLength
    );

    // Calculate processing time and metadata
    const processingTimeMs = Date.now() - startTime;
    const fileName = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;

    // Progress: 100% - Complete
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 100,
        status: 'Complete!',
      })
    );

    // Send completion message with the generated EPUB buffer
    postMessageToMain(
      createWorkerMessage<CompleteMessage>(WorkerMessageType.COMPLETE, {
        buffer: arrayBuffer,
        fileName: fileName,
        fileSize: arrayBuffer.byteLength,
        mimeType: 'application/epub+zip',
        metadata: {
          pageCount: book.pageCount,
          wordCount: book.wordCount,
          processingTimeMs: processingTimeMs,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      })
    );
  } catch (error) {
    const serialized = serializeError(error);
    const errorCode = state.isCancelled ? 'GENERATION_CANCELLED' :
                     (error as any).imageId ? 'IMAGE_ERROR' :
                     serialized.name === 'TypeError' ? 'INVALID_DATA' :
                     serialized.name === 'RangeError' ? 'RESOURCE_LIMIT' :
                     'GENERATION_ERROR';

    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: errorCode,
        message: serialized.message,
        details: serialized.stack,
        stack: serialized.stack,
        recoverable: state.isCancelled,
        elementId: (error as any).imageId,
      })
    );
  } finally {
    clearOperationTimeout();
    state.isProcessing = false;
    state.isCancelled = false;
  }
}

/**
 * Handle cancellation message
 */
function handleCancel(message: Extract<MainToWorkerMessage, { type: WorkerMessageType.CANCEL }>): void {
  if (!state.isProcessing) {
    return;
  }

  state.isCancelled = true;

  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'CANCELLED',
      message: message.data.reason || 'Generation cancelled',
      recoverable: true,
    })
  );
}

/**
 * Route incoming messages to appropriate handlers
 */
async function routeMessage(event: MessageEvent<MainToWorkerMessage>): Promise<void> {
  const message = event.data;

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
      // Unknown message type
      postMessageToMain(
        createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
          code: 'UNKNOWN_MESSAGE_TYPE',
          message: `Unknown message type: ${(message as any).type}`,
          recoverable: false,
        })
      );
    }
  } catch (error) {
    // Catch any unhandled errors in message routing
    const serialized = serializeError(error);
    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: 'ROUTING_ERROR',
        message: 'Error processing message',
        details: serialized.message,
        stack: serialized.stack,
        recoverable: false,
      })
    );
  }
}

/**
 * Global error boundary for the worker
 */
self.onerror = (event: ErrorEvent): void => {
  const serialized = serializeError(event.error || event.message);
  const location = event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : 'unknown location';

  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'WORKER_ERROR',
      message: serialized.message || 'Uncaught worker error',
      details: `Error at ${location}`,
      stack: serialized.stack,
      recoverable: false,
    })
  );

  // Clear any ongoing operation
  clearOperationTimeout();
  state.isProcessing = false;
  state.isCancelled = false;

  // Prevent default error handling
  event.preventDefault();
};

/**
 * Global unhandled promise rejection handler
 */
self.onunhandledrejection = (event: PromiseRejectionEvent): void => {
  const serialized = serializeError(event.reason);

  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'UNHANDLED_REJECTION',
      message: serialized.message || 'Unhandled promise rejection',
      details: 'A promise was rejected but no error handler was attached',
      stack: serialized.stack,
      recoverable: false,
    })
  );

  // Clear any ongoing operation
  clearOperationTimeout();
  state.isProcessing = false;
  state.isCancelled = false;

  // Prevent default error handling
  event.preventDefault();
};

/**
 * Main message event listener
 */
self.addEventListener('message', (event: MessageEvent<MainToWorkerMessage>) => {
  routeMessage(event);
});

/**
 * Send ready message when worker is initialized
 */
postMessageToMain(
  createWorkerMessage<ReadyMessage>(WorkerMessageType.READY, {
    workerId: state.workerId,
    capabilities: ['epub'],
  })
);

// Export empty object to make this a module
export {};

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
}

// Initialize worker state
const state: WorkerState = {
  isProcessing: false,
  isCancelled: false,
  workerId: crypto.randomUUID(),
};

/**
 * Post a message to the main thread
 */
function postMessageToMain(message: WorkerToMainMessage): void {
  self.postMessage(message);
}

/**
 * Handle initialization message
 */
async function handleInitialize(message: Extract<MainToWorkerMessage, { type: WorkerMessageType.INITIALIZE }>): Promise<void> {
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

  const startTime = Date.now();
  const { book, styles, images, options } = message.data;

  try {
    // Send initial progress
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 0,
        status: 'Initializing EPUB generation...',
      })
    );

    if (state.isCancelled) {
      throw new Error('Generation cancelled by user');
    }

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
        },
      })
    );
  } catch (error) {
    const err = error as Error;
    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: state.isCancelled ? 'CANCELLED' : 'GENERATION_ERROR',
        message: err.message || 'Unknown error occurred',
        details: err.stack,
        recoverable: false,
      })
    );
  } finally {
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
    const err = error as Error;
    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: 'ROUTING_ERROR',
        message: 'Error processing message',
        details: err.message,
        stack: err.stack,
        recoverable: false,
      })
    );
  }
}

/**
 * Global error boundary for the worker
 */
self.onerror = (event: ErrorEvent): void => {
  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'WORKER_ERROR',
      message: event.message || 'Worker error',
      details: `${event.filename}:${event.lineno}:${event.colno}`,
      stack: event.error?.stack,
      recoverable: false,
    })
  );
};

/**
 * Global unhandled promise rejection handler
 */
self.onunhandledrejection = (event: PromiseRejectionEvent): void => {
  const error = event.reason as Error;
  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'UNHANDLED_REJECTION',
      message: error?.message || 'Unhandled promise rejection',
      details: error?.stack,
      recoverable: false,
    })
  );
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

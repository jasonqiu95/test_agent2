/**
 * EPUB Generator Service
 * Handles the generation of EPUB files from book content
 */

import JSZip from 'jszip';
import { Book } from '../types/book';
import { BookStyle } from '../types/style';

/**
 * Options for EPUB generation
 */
export interface EpubOptions {
  /** Output file path for the generated EPUB */
  outputPath?: string;
  /** EPUB version (2.0 or 3.0) */
  version?: '2.0' | '3.0';
  /** Include table of contents */
  includeToc?: boolean;
  /** Include cover image */
  includeCover?: boolean;
  /** Compression level (0-9) */
  compressionLevel?: number;
  /** Additional metadata to include */
  additionalMetadata?: Record<string, string>;
  /** Custom CSS styles to include */
  customCss?: string;
}

/**
 * Result of EPUB generation
 */
export interface EpubGenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** Path to the generated EPUB file */
  filePath?: string;
  /** Size of the generated file in bytes */
  fileSize?: number;
  /** Any warnings generated during the process */
  warnings?: string[];
  /** Error message if generation failed */
  error?: string;
}

/**
 * Service class for generating EPUB files
 */
export class EpubGenerator {
  private defaultOptions: EpubOptions = {
    version: '3.0',
    includeToc: true,
    includeCover: true,
    compressionLevel: 6,
  };

  constructor() {
    // Initialize any required dependencies or configurations
  }

  /**
   * Generates an EPUB file from book content
   * @param book - The book content to convert
   * @param style - The style configuration to apply
   * @param options - Additional options for EPUB generation
   * @returns Promise resolving to the generation result
   */
  async generateEpub(
    book: Book,
    style: BookStyle,
    options: EpubOptions = {}
  ): Promise<EpubGenerationResult> {
    // Merge provided options with defaults
    const mergedOptions: EpubOptions = {
      ...this.defaultOptions,
      ...options,
    };

    try {
      // TODO: Implement EPUB generation logic
      // 1. Validate book content
      // 2. Apply style to book elements
      // 3. Generate EPUB structure (mimetype, container.xml, content.opf, toc.ncx)
      // 4. Package chapters and content
      // 5. Add metadata and cover
      // 6. Compress and output EPUB file

      console.log('Generating EPUB with options:', mergedOptions);
      console.log('Book title:', book.title);
      console.log('Style:', style.name);

      // Placeholder implementation
      return {
        success: false,
        error: 'EPUB generation not yet implemented',
        warnings: ['This is a placeholder implementation'],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Validates book content before generation
   * @param book - The book to validate
   * @returns Whether the book is valid for EPUB generation
   */
  private validateBook(book: Book): boolean {
    // TODO: Implement validation logic
    return book.chapters.length > 0;
  }

  /**
   * Builds the EPUB directory structure with required folders and mimetype file
   * @returns JSZip instance with the basic EPUB structure
   */
  buildEpubStructure(): JSZip {
    const zip = new JSZip();

    // Add mimetype file (must be uncompressed and first in archive)
    // The mimetype file must be the first file and stored without compression
    zip.file('mimetype', 'application/epub+zip', {
      compression: 'STORE',
      // Setting date to a fixed value ensures deterministic output
      date: new Date('2000-01-01T00:00:00Z'),
    });

    // Create META-INF directory
    // This directory contains container.xml which points to the content.opf file
    zip.folder('META-INF');

    // Create OEBPS directory (Open eBook Publication Structure)
    // This directory contains the actual content files (HTML, CSS, images, etc.)
    zip.folder('OEBPS');

    // Add container.xml to META-INF directory
    const containerXml = this.generateContainerXml();
    zip.file('META-INF/container.xml', containerXml);

    return zip;
  }

  /**
   * Generates the container.xml file content for EPUB
   * This file is required by the EPUB specification and points to the package.opf file
   * @returns The container.xml content as a string
   */
  private generateContainerXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;
  }

  /**
   * Generates the toc.ncx file for EPUB 2 compatibility
   * @param chapters - Array of chapters to include in the navigation
   * @returns XML string for the toc.ncx file
   */
  generateTocNcx(chapters: Book['chapters']): string {
    // Filter chapters that should be included in TOC
    const tocChapters = chapters.filter(chapter => chapter.includeInToc !== false);

    // Generate navPoint elements for each chapter
    const navPoints = tocChapters.map((chapter, index) => {
      const playOrder = index + 1;
      const chapterId = chapter.id || `chapter-${playOrder}`;
      const chapterTitle = chapter.title || `Chapter ${chapter.number || playOrder}`;
      const chapterFile = `${chapterId}.xhtml`;

      return `    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel>
        <text>${this.escapeXml(chapterTitle)}</text>
      </navLabel>
      <content src="${chapterFile}"/>
    </navPoint>`;
    }).join('\n');

    // Build the complete NCX file
    const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN"
  "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${this.generateUuid()}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>Table of Contents</text>
  </docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`;

    return ncxContent;
  }

  /**
   * Escapes XML special characters
   * @param text - Text to escape
   * @returns Escaped text safe for XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generates a UUID for the EPUB
   * @returns A UUID string
   */
  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Gets the default options for EPUB generation
   * @returns The default options
   */
  getDefaultOptions(): EpubOptions {
    return { ...this.defaultOptions };
  }

  /**
   * Sets default options for EPUB generation
   * @param options - Partial options to merge with defaults
   */
  setDefaultOptions(options: Partial<EpubOptions>): void {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options,
    };
  }

  /**
   * Generates the EPUB 3 navigation document (nav.xhtml)
   * This creates the primary navigation structure with a nested list of book elements
   * @param chapters - Array of chapters to include in the navigation
   * @returns The nav.xhtml content as a string
   */
  generateNavXhtml(chapters: Book['chapters']): string {
    // Group chapters by parts if they have partNumber/partTitle
    const partGroups = new Map<number, { title: string; chapters: Book['chapters'] }>();
    const standaloneChapters: Book['chapters'] = [];

    chapters.forEach((chapter) => {
      // Only include chapters that should be in TOC
      if (chapter.includeInToc === false) {
        return;
      }

      if (chapter.partNumber !== undefined && chapter.partTitle) {
        if (!partGroups.has(chapter.partNumber)) {
          partGroups.set(chapter.partNumber, {
            title: chapter.partTitle,
            chapters: [],
          });
        }
        partGroups.get(chapter.partNumber)!.chapters.push(chapter);
      } else {
        standaloneChapters.push(chapter);
      }
    });

    // Build the navigation list HTML
    let navListHtml = '';

    // Add parts and their chapters
    const sortedParts = Array.from(partGroups.entries()).sort(([a], [b]) => a - b);
    sortedParts.forEach(([partNumber, partData]) => {
      navListHtml += `      <li>\n`;
      navListHtml += `        <span class="part-title">${this.escapeXml(partData.title)}</span>\n`;
      navListHtml += `        <ol>\n`;

      partData.chapters.forEach((chapter) => {
        const chapterTitle = this.getChapterTitle(chapter);
        const chapterHref = this.getChapterHref(chapter);
        navListHtml += `          <li>\n`;
        navListHtml += `            <a href="${chapterHref}">${this.escapeXml(chapterTitle)}</a>\n`;
        navListHtml += `          </li>\n`;
      });

      navListHtml += `        </ol>\n`;
      navListHtml += `      </li>\n`;
    });

    // Add standalone chapters
    standaloneChapters.forEach((chapter) => {
      const chapterTitle = this.getChapterTitle(chapter);
      const chapterHref = this.getChapterHref(chapter);
      navListHtml += `      <li>\n`;
      navListHtml += `        <a href="${chapterHref}">${this.escapeXml(chapterTitle)}</a>\n`;
      navListHtml += `      </li>\n`;
    });

    // Build the complete XHTML document
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
  <style type="text/css">
    nav {
      font-family: sans-serif;
      line-height: 1.6;
    }
    nav > h1 {
      font-size: 1.5em;
      font-weight: bold;
      margin-bottom: 1em;
      text-align: center;
    }
    nav ol {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
    nav > ol {
      padding-left: 0;
    }
    nav ol ol {
      padding-left: 1.5em;
      margin-top: 0.5em;
      margin-bottom: 0.5em;
    }
    nav li {
      margin: 0.5em 0;
    }
    nav a {
      text-decoration: none;
      color: #0066cc;
    }
    nav a:hover {
      text-decoration: underline;
    }
    nav .part-title {
      font-weight: bold;
      font-size: 1.1em;
      display: block;
      margin-bottom: 0.5em;
    }
  </style>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${navListHtml}    </ol>
  </nav>
</body>
</html>
`;
  }

  /**
   * Gets the display title for a chapter
   * @param chapter - The chapter to get the title for
   * @returns The formatted chapter title
   */
  private getChapterTitle(chapter: Book['chapters'][0]): string {
    if (chapter.number !== undefined) {
      return `Chapter ${chapter.number}: ${chapter.title}`;
    }
    return chapter.title;
  }

  /**
   * Gets the href for a chapter in the EPUB structure
   * @param chapter - The chapter to get the href for
   * @returns The relative href to the chapter file
   */
  private getChapterHref(chapter: Book['chapters'][0]): string {
    // Generate a safe filename from the chapter ID
    const filename = `chapter-${chapter.id}.xhtml`;
    return filename;
  }

  /**
   * Escapes XML special characters
   * @param text - The text to escape
   * @returns The escaped text
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Export singleton instance
let epubGeneratorInstance: EpubGenerator | null = null;

/**
 * Gets the singleton instance of EpubGenerator
 * @returns The EpubGenerator instance
 */
export function getEpubGenerator(): EpubGenerator {
  if (!epubGeneratorInstance) {
    epubGeneratorInstance = new EpubGenerator();
  }
  return epubGeneratorInstance;
}

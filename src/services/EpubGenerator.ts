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

    const warnings: string[] = [];

    try {
      // 1. Validate book content
      if (!this.validateBook(book)) {
        return {
          success: false,
          error: 'Book validation failed: Book must have at least one chapter',
        };
      }

      // 2. Build the EPUB structure with directory folders and base files
      const zip = this.buildEpubStructure();

      // 3. Generate and add CSS styles based on BookStyle
      const cssContent = this.generateCss(style, mergedOptions.customCss);
      zip.file('OEBPS/styles.css', cssContent);

      // 4. Prepare manifest and spine items for package.opf
      const manifestItems: Array<{
        id: string;
        href: string;
        mediaType: string;
        properties?: string;
      }> = [];

      const spineItems: Array<{ idref: string; linear?: boolean }> = [];

      // Add CSS to manifest
      manifestItems.push({
        id: 'stylesheet',
        href: 'styles.css',
        mediaType: 'text/css',
      });

      // 5. Generate and add chapter content files
      const tocChapters = book.chapters.filter(chapter => chapter.includeInToc !== false);

      for (let i = 0; i < book.chapters.length; i++) {
        const chapter = book.chapters[i];
        const chapterId = chapter.id || `chapter-${i + 1}`;
        const chapterFileName = `${chapterId}.xhtml`;

        // Generate XHTML content for the chapter
        const chapterXhtml = this.generateChapterXhtml(chapter, style);
        zip.file(`OEBPS/${chapterFileName}`, chapterXhtml);

        // Add to manifest
        manifestItems.push({
          id: chapterId,
          href: chapterFileName,
          mediaType: 'application/xhtml+xml',
        });

        // Add to spine
        spineItems.push({
          idref: chapterId,
          linear: chapter.includeInToc !== false,
        });
      }

      // 6. Generate and add navigation files
      if (mergedOptions.includeToc !== false) {
        // Generate nav.xhtml (EPUB 3)
        const navXhtml = this.generateNavXhtml(tocChapters);
        zip.file('OEBPS/nav.xhtml', navXhtml);

        // Generate toc.ncx (EPUB 2 compatibility)
        const tocNcx = this.generateTocNcx(tocChapters);
        zip.file('OEBPS/toc.ncx', tocNcx);

        // Add toc.ncx to manifest
        manifestItems.push({
          id: 'ncx',
          href: 'toc.ncx',
          mediaType: 'application/x-dtbncx+xml',
        });

        // Add nav.xhtml to manifest (with nav property)
        manifestItems.push({
          id: 'nav',
          href: 'nav.xhtml',
          mediaType: 'application/xhtml+xml',
          properties: 'nav',
        });
      } else {
        warnings.push('Table of contents generation was disabled');
      }

      // 7. Handle cover image if provided
      if (mergedOptions.includeCover !== false && book.coverImage) {
        try {
          // Determine cover image format from path/data
          const coverImageData = book.coverImage;
          const coverMediaType = this.getCoverImageMediaType(coverImageData);
          const coverExt = this.getCoverImageExtension(coverMediaType);

          zip.file(`OEBPS/cover.${coverExt}`, coverImageData);

          // Add cover image to manifest
          manifestItems.push({
            id: 'cover-image',
            href: `cover.${coverExt}`,
            mediaType: coverMediaType,
            properties: 'cover-image',
          });

          // Create cover page XHTML
          const coverXhtml = this.generateCoverXhtml(coverExt);
          zip.file('OEBPS/cover.xhtml', coverXhtml);

          manifestItems.push({
            id: 'cover',
            href: 'cover.xhtml',
            mediaType: 'application/xhtml+xml',
          });

          // Add cover to the beginning of spine
          spineItems.unshift({
            idref: 'cover',
            linear: false,
          });
        } catch (error) {
          warnings.push(`Failed to add cover image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 8. Generate package.opf with metadata, manifest, and spine
      const packageOpf = this.generatePackageOpf(
        {
          title: book.title,
          subtitle: book.subtitle,
          authors: book.authors.map(author => ({
            name: author.name,
            role: author.role,
          })),
          isbn: book.metadata.isbn,
          isbn13: book.metadata.isbn13,
          language: book.metadata.language || 'en',
          publisher: book.metadata.publisher,
          publicationDate: book.metadata.publicationDate,
          description: book.metadata.description,
          rights: book.metadata.rights,
        },
        manifestItems,
        spineItems
      );
      zip.file('OEBPS/package.opf', packageOpf);

      // 9. Generate the final EPUB file
      const compressionLevel = mergedOptions.compressionLevel || 6;
      const epubBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: compressionLevel,
        },
        mimeType: 'application/epub+zip',
      });

      // 10. Save to file if outputPath is specified, otherwise return buffer
      let filePath: string | undefined;
      let fileSize = epubBuffer.length;

      if (mergedOptions.outputPath) {
        const fs = await import('fs/promises');
        await fs.writeFile(mergedOptions.outputPath, epubBuffer);
        filePath = mergedOptions.outputPath;
      }

      return {
        success: true,
        filePath,
        fileSize,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: warnings.length > 0 ? warnings : undefined,
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
   * Generates the package.opf file with metadata, manifest, spine, and guide
   * @param metadata - Book metadata to include in the OPF file
   * @param manifestItems - Array of manifest items (files to include in EPUB)
   * @param spineItems - Array of spine item IDs (reading order)
   * @param guideItems - Array of guide items (optional)
   * @returns The package.opf XML content as a string
   */
  generatePackageOpf(
    metadata: {
      title: string;
      subtitle?: string;
      authors: Array<{ name: string; role?: string }>;
      isbn?: string;
      isbn13?: string;
      language?: string;
      publisher?: string;
      publicationDate?: Date;
      description?: string;
      rights?: string;
      id?: string;
    },
    manifestItems: Array<{
      id: string;
      href: string;
      mediaType: string;
      properties?: string;
    }> = [],
    spineItems: Array<{ idref: string; linear?: boolean }> = [],
    guideItems: Array<{
      type: string;
      title: string;
      href: string;
    }> = []
  ): string {
    // Generate unique identifier for the book
    const bookId = metadata.id || metadata.isbn13 || metadata.isbn || `book-${Date.now()}`;

    // Format publication date in YYYY-MM-DD format
    const pubDate = metadata.publicationDate
      ? metadata.publicationDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Build metadata section with Dublin Core elements
    const metadataSection = this.buildMetadataSection(metadata, bookId, pubDate);

    // Build manifest section
    const manifestSection = this.buildManifestSection(manifestItems);

    // Build spine section
    const spineSection = this.buildSpineSection(spineItems);

    // Build guide section (optional)
    const guideSection = guideItems.length > 0 ? this.buildGuideSection(guideItems) : '';

    // Combine all sections into complete package.opf
    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${metadata.language || 'en'}">
${metadataSection}
${manifestSection}
${spineSection}${guideSection}
</package>`;
  }

  /**
   * Builds the metadata section with Dublin Core elements
   * @param metadata - Book metadata
   * @param bookId - Unique book identifier
   * @param pubDate - Publication date string
   * @returns Formatted metadata XML
   */
  private buildMetadataSection(
    metadata: {
      title: string;
      subtitle?: string;
      authors: Array<{ name: string; role?: string }>;
      isbn?: string;
      isbn13?: string;
      language?: string;
      publisher?: string;
      description?: string;
      rights?: string;
    },
    bookId: string,
    pubDate: string
  ): string {
    let metadataXml = '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">\n';

    // Unique identifier (required)
    metadataXml += `    <dc:identifier id="bookid">${this.escapeXml(bookId)}</dc:identifier>\n`;

    // Title (required)
    metadataXml += `    <dc:title>${this.escapeXml(metadata.title)}</dc:title>\n`;

    // Subtitle (if present)
    if (metadata.subtitle) {
      metadataXml += `    <meta property="title-type" refines="#title">main</meta>\n`;
      metadataXml += `    <dc:title id="subtitle">${this.escapeXml(metadata.subtitle)}</dc:title>\n`;
      metadataXml += `    <meta property="title-type" refines="#subtitle">subtitle</meta>\n`;
    }

    // Language (required)
    metadataXml += `    <dc:language>${this.escapeXml(metadata.language || 'en')}</dc:language>\n`;

    // Authors (required)
    metadata.authors.forEach((author, index) => {
      const authorId = `author${index + 1}`;
      metadataXml += `    <dc:creator id="${authorId}">${this.escapeXml(author.name)}</dc:creator>\n`;

      // Add role metadata if specified
      const role = author.role || 'author';
      metadataXml += `    <meta property="role" refines="#${authorId}" scheme="marc:relators">${role === 'author' ? 'aut' : role === 'editor' ? 'edt' : role === 'translator' ? 'trl' : 'ctb'}</meta>\n`;
    });

    // Publisher (optional)
    if (metadata.publisher) {
      metadataXml += `    <dc:publisher>${this.escapeXml(metadata.publisher)}</dc:publisher>\n`;
    }

    // Publication date (required)
    metadataXml += `    <dc:date>${pubDate}</dc:date>\n`;

    // ISBN (optional)
    if (metadata.isbn13) {
      metadataXml += `    <dc:identifier opf:scheme="ISBN">${this.escapeXml(metadata.isbn13)}</dc:identifier>\n`;
    } else if (metadata.isbn) {
      metadataXml += `    <dc:identifier opf:scheme="ISBN">${this.escapeXml(metadata.isbn)}</dc:identifier>\n`;
    }

    // Description (optional)
    if (metadata.description) {
      metadataXml += `    <dc:description>${this.escapeXml(metadata.description)}</dc:description>\n`;
    }

    // Rights (optional)
    if (metadata.rights) {
      metadataXml += `    <dc:rights>${this.escapeXml(metadata.rights)}</dc:rights>\n`;
    }

    // Modified timestamp (required for EPUB 3)
    metadataXml += `    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>\n`;

    metadataXml += '  </metadata>\n';

    return metadataXml;
  }

  /**
   * Builds the manifest section listing all files in the EPUB
   * @param manifestItems - Array of manifest items
   * @returns Formatted manifest XML
   */
  private buildManifestSection(
    manifestItems: Array<{
      id: string;
      href: string;
      mediaType: string;
      properties?: string;
    }>
  ): string {
    let manifestXml = '  <manifest>\n';

    // Add navigation document (required for EPUB 3)
    if (!manifestItems.find(item => item.id === 'nav')) {
      manifestXml += '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n';
    }

    // Add all manifest items
    manifestItems.forEach(item => {
      manifestXml += `    <item id="${item.id}" href="${item.href}" media-type="${item.mediaType}"`;
      if (item.properties) {
        manifestXml += ` properties="${item.properties}"`;
      }
      manifestXml += '/>\n';
    });

    manifestXml += '  </manifest>\n';

    return manifestXml;
  }

  /**
   * Builds the spine section defining the reading order
   * @param spineItems - Array of spine items
   * @returns Formatted spine XML
   */
  private buildSpineSection(
    spineItems: Array<{ idref: string; linear?: boolean }>
  ): string {
    let spineXml = '  <spine>\n';

    spineItems.forEach(item => {
      spineXml += `    <itemref idref="${item.idref}"`;
      if (item.linear === false) {
        spineXml += ' linear="no"';
      }
      spineXml += '/>\n';
    });

    spineXml += '  </spine>\n';

    return spineXml;
  }

  /**
   * Builds the guide section for special content references
   * @param guideItems - Array of guide items
   * @returns Formatted guide XML
   */
  private buildGuideSection(
    guideItems: Array<{
      type: string;
      title: string;
      href: string;
    }>
  ): string {
    let guideXml = '  <guide>\n';

    guideItems.forEach(item => {
      guideXml += `    <reference type="${item.type}" title="${item.title}" href="${item.href}"/>\n`;
    });

    guideXml += '  </guide>\n';

    return guideXml;
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

  /**
   * Generates CSS content from BookStyle
   * @param style - The BookStyle configuration
   * @param customCss - Optional custom CSS to append
   * @returns CSS content as a string
   */
  private generateCss(style: BookStyle, customCss?: string): string {
    let css = `/* Generated EPUB Styles */\n\n`;

    // Body styles
    css += `body {\n`;
    css += `  font-family: ${style.fonts.body}, ${style.fonts.fallback};\n`;
    css += `  font-size: ${style.body.fontSize};\n`;
    css += `  line-height: ${style.body.lineHeight};\n`;
    css += `  color: ${style.colors.text};\n`;
    if (style.body.fontWeight) {
      css += `  font-weight: ${style.body.fontWeight};\n`;
    }
    if (style.body.textAlign) {
      css += `  text-align: ${style.body.textAlign};\n`;
    }
    if (style.colors.background) {
      css += `  background-color: ${style.colors.background};\n`;
    }
    css += `}\n\n`;

    // Paragraph styles
    css += `p {\n`;
    css += `  margin: ${style.spacing.paragraphSpacing} 0;\n`;
    css += `}\n\n`;

    // Heading styles
    const headings = [
      { tag: 'h1', style: style.headings.h1 },
      { tag: 'h2', style: style.headings.h2 },
      { tag: 'h3', style: style.headings.h3 },
    ];

    if (style.headings.h4) {
      headings.push({ tag: 'h4', style: style.headings.h4 });
    }

    headings.forEach(({ tag, style: hStyle }) => {
      css += `${tag} {\n`;
      css += `  font-family: ${style.fonts.heading}, ${style.fonts.fallback};\n`;
      css += `  font-size: ${hStyle.fontSize};\n`;
      css += `  color: ${hStyle.color || style.colors.heading};\n`;
      if (hStyle.fontWeight) {
        css += `  font-weight: ${hStyle.fontWeight};\n`;
      }
      if (hStyle.lineHeight) {
        css += `  line-height: ${hStyle.lineHeight};\n`;
      }
      if (hStyle.marginTop) {
        css += `  margin-top: ${hStyle.marginTop};\n`;
      }
      if (hStyle.marginBottom) {
        css += `  margin-bottom: ${hStyle.marginBottom};\n`;
      }
      if (hStyle.textTransform) {
        css += `  text-transform: ${hStyle.textTransform};\n`;
      }
      if (hStyle.letterSpacing) {
        css += `  letter-spacing: ${hStyle.letterSpacing};\n`;
      }
      css += `}\n\n`;
    });

    // Drop cap styles
    if (style.dropCap.enabled) {
      css += `p.first-paragraph::first-letter {\n`;
      css += `  float: left;\n`;
      css += `  font-size: ${style.dropCap.fontSize || '3em'};\n`;
      css += `  line-height: ${style.dropCap.lines || 3};\n`;
      if (style.dropCap.fontFamily) {
        css += `  font-family: ${style.dropCap.fontFamily};\n`;
      }
      if (style.dropCap.fontWeight) {
        css += `  font-weight: ${style.dropCap.fontWeight};\n`;
      }
      if (style.dropCap.color) {
        css += `  color: ${style.dropCap.color};\n`;
      }
      css += `  margin-right: ${style.dropCap.marginRight || '0.1em'};\n`;
      css += `}\n\n`;
    }

    // First paragraph styles
    if (style.firstParagraph.enabled) {
      css += `p.first-paragraph {\n`;
      if (style.firstParagraph.textTransform) {
        css += `  text-transform: ${style.firstParagraph.textTransform};\n`;
      }
      if (style.firstParagraph.fontVariant) {
        css += `  font-variant: ${style.firstParagraph.fontVariant};\n`;
      }
      if (style.firstParagraph.letterSpacing) {
        css += `  letter-spacing: ${style.firstParagraph.letterSpacing};\n`;
      }
      if (style.firstParagraph.fontSize) {
        css += `  font-size: ${style.firstParagraph.fontSize};\n`;
      }
      css += `}\n\n`;
    }

    // Ornamental break styles
    if (style.ornamentalBreak.enabled) {
      css += `.ornamental-break {\n`;
      css += `  text-align: ${style.ornamentalBreak.textAlign || 'center'};\n`;
      css += `  margin-top: ${style.ornamentalBreak.marginTop || '2em'};\n`;
      css += `  margin-bottom: ${style.ornamentalBreak.marginBottom || '2em'};\n`;
      if (style.ornamentalBreak.fontSize) {
        css += `  font-size: ${style.ornamentalBreak.fontSize};\n`;
      }
      css += `}\n\n`;
    }

    // Add custom CSS if provided
    if (customCss) {
      css += `\n/* Custom CSS */\n`;
      css += customCss;
      css += `\n`;
    }

    return css;
  }

  /**
   * Generates XHTML content for a chapter
   * @param chapter - The chapter to convert
   * @param style - The BookStyle to apply
   * @returns XHTML content as a string
   */
  private generateChapterXhtml(chapter: Book['chapters'][0], style: BookStyle): string {
    let contentHtml = '';

    // Add chapter title
    if (chapter.title) {
      const chapterLabel = chapter.number ? `Chapter ${chapter.number}` : '';
      if (chapterLabel) {
        contentHtml += `  <h2 class="chapter-number">${this.escapeXml(chapterLabel)}</h2>\n`;
      }
      contentHtml += `  <h1 class="chapter-title">${this.escapeXml(chapter.title)}</h1>\n`;
    }

    // Add subtitle if present
    if (chapter.subtitle) {
      contentHtml += `  <h2 class="chapter-subtitle">${this.escapeXml(chapter.subtitle)}</h2>\n`;
    }

    // Add epigraph if present
    if (chapter.epigraph) {
      contentHtml += `  <div class="epigraph">\n`;
      contentHtml += `    <p>${this.escapeXml(chapter.epigraph)}</p>\n`;
      if (chapter.epigraphAttribution) {
        contentHtml += `    <p class="attribution">${this.escapeXml(chapter.epigraphAttribution)}</p>\n`;
      }
      contentHtml += `  </div>\n`;
    }

    // Add chapter content
    chapter.content.forEach((block, index) => {
      const isFirstParagraph = index === 0 && block.blockType === 'paragraph';
      contentHtml += this.generateTextBlockHtml(block, isFirstParagraph);
    });

    // Build complete XHTML document
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${this.escapeXml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
${contentHtml}
</body>
</html>
`;
  }

  /**
   * Generates HTML for a text block
   * @param block - The text block to convert
   * @param isFirstParagraph - Whether this is the first paragraph of the chapter
   * @returns HTML content as a string
   */
  private generateTextBlockHtml(block: Book['chapters'][0]['content'][0], isFirstParagraph: boolean): string {
    const content = this.escapeXml(block.content);

    switch (block.blockType) {
      case 'paragraph':
        const className = isFirstParagraph ? ' class="first-paragraph"' : '';
        return `  <p${className}>${content}</p>\n`;

      case 'heading':
        const level = block.level || 2;
        return `  <h${level}>${content}</h${level}>\n`;

      case 'preformatted':
        return `  <pre>${content}</pre>\n`;

      case 'code':
        return `  <pre><code>${content}</code></pre>\n`;

      case 'list':
        const listTag = block.listType === 'ordered' ? 'ol' : 'ul';
        return `  <${listTag}>\n    <li>${content}</li>\n  </${listTag}>\n`;

      default:
        return `  <p>${content}</p>\n`;
    }
  }

  /**
   * Generates XHTML content for the cover page
   * @param coverImageExt - The file extension of the cover image
   * @returns XHTML content as a string
   */
  private generateCoverXhtml(coverImageExt: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Cover</title>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      text-align: center;
    }
    img {
      max-width: 100%;
      max-height: 100%;
    }
  </style>
</head>
<body>
  <img src="cover.${coverImageExt}" alt="Cover Image"/>
</body>
</html>
`;
  }

  /**
   * Determines the media type of a cover image
   * @param imageData - The image data (path or base64 string)
   * @returns The MIME type of the image
   */
  private getCoverImageMediaType(imageData: string): string {
    if (imageData.startsWith('data:')) {
      // Extract MIME type from data URI
      const match = imageData.match(/^data:([^;]+);/);
      return match ? match[1] : 'image/jpeg';
    }

    // Determine from file extension
    const ext = imageData.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'image/jpeg';
    }
  }

  /**
   * Gets the file extension for a cover image media type
   * @param mediaType - The MIME type of the image
   * @returns The file extension
   */
  private getCoverImageExtension(mediaType: string): string {
    switch (mediaType) {
      case 'image/png':
        return 'png';
      case 'image/jpeg':
        return 'jpg';
      case 'image/gif':
        return 'gif';
      case 'image/svg+xml':
        return 'svg';
      default:
        return 'jpg';
    }
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

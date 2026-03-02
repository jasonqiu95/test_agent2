/**
 * EPUB Table of Contents Generator
 * Generates both NCX (EPUB 2) and nav.xhtml (EPUB 3) formats
 */

import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { TextBlock } from '../../types/textBlock';
import { Element } from '../../types/element';

/**
 * Represents a TOC entry with nested structure
 */
export interface TocEntry {
  id: string;
  title: string;
  href: string;
  playOrder: number;
  children: TocEntry[];
  level: number;
}

/**
 * Result of TOC generation
 */
export interface TocGenerationResult {
  ncx: string; // toc.ncx XML content
  navXhtml: string; // nav.xhtml HTML5 content
  entries: TocEntry[];
}

/**
 * Options for TOC generation
 */
export interface TocOptions {
  /** Maximum depth of TOC entries (default: 3) */
  maxDepth?: number;
  /** Title for the TOC (default: "Table of Contents") */
  tocTitle?: string;
  /** Include front matter in TOC (default: true) */
  includeFrontMatter?: boolean;
  /** Include back matter in TOC (default: true) */
  includeBackMatter?: boolean;
  /** Book identifier for NCX */
  bookId?: string;
  /** Book title for NCX */
  bookTitle?: string;
  /** Book author for NCX */
  bookAuthor?: string;
}

/**
 * Generates EPUB Table of Contents in both NCX and nav.xhtml formats
 * @param book - The book content
 * @param options - TOC generation options
 * @returns TOC generation result with both formats
 */
export function generateTOC(
  book: Book,
  options: TocOptions = {}
): TocGenerationResult {
  const {
    maxDepth = 3,
    tocTitle = 'Table of Contents',
    includeFrontMatter = true,
    includeBackMatter = true,
    bookId = book.id || 'book-id',
    bookTitle = book.title,
    bookAuthor = book.authors?.[0]?.name || 'Unknown Author',
  } = options;

  const entries: TocEntry[] = [];
  let playOrder = 1;

  // Process front matter
  if (includeFrontMatter && book.frontMatter?.length > 0) {
    book.frontMatter.forEach((element, index) => {
      const entry = createEntryFromElement(
        element,
        index,
        playOrder++,
        'frontmatter',
        maxDepth
      );
      if (entry) {
        entries.push(entry);
      }
    });
  }

  // Process chapters
  book.chapters.forEach((chapter, index) => {
    if (chapter.includeInToc !== false) {
      const entry = createEntryFromChapter(
        chapter,
        index,
        playOrder++,
        maxDepth
      );
      entries.push(entry);
      playOrder = updatePlayOrder(entry, playOrder);
    }
  });

  // Process back matter
  if (includeBackMatter && book.backMatter?.length > 0) {
    book.backMatter.forEach((element, index) => {
      const entry = createEntryFromElement(
        element,
        index,
        playOrder++,
        'backmatter',
        maxDepth
      );
      if (entry) {
        entries.push(entry);
      }
    });
  }

  // Generate NCX
  const ncx = generateNCX(entries, {
    bookId,
    bookTitle,
    bookAuthor,
    maxDepth,
  });

  // Generate nav.xhtml
  const navXhtml = generateNavXhtml(entries, tocTitle);

  return {
    ncx,
    navXhtml,
    entries,
  };
}

/**
 * Creates a TOC entry from a chapter
 */
function createEntryFromChapter(
  chapter: Chapter,
  index: number,
  playOrder: number,
  maxDepth: number
): TocEntry {
  const chapterId = chapter.id || `chapter-${index + 1}`;
  const filename = `chapter-${String(index + 1).padStart(3, '0')}.xhtml`;

  // Build chapter title with part information if available
  let title = chapter.title;
  if (chapter.partTitle && chapter.partNumber) {
    title = `${chapter.partTitle}: ${chapter.title}`;
  } else if (chapter.number) {
    title = `Chapter ${chapter.number}: ${chapter.title}`;
  }

  const entry: TocEntry = {
    id: chapterId,
    title,
    href: `Text/${filename}`,
    playOrder,
    children: [],
    level: 1,
  };

  // Extract subheadings from chapter content
  if (maxDepth > 1 && chapter.content?.length > 0) {
    let subPlayOrder = playOrder + 1;
    chapter.content.forEach((block, blockIndex) => {
      if (block.blockType === 'heading' && block.level && block.level > 1 && block.level <= maxDepth) {
        const subId = `${chapterId}-h${block.level}-${blockIndex}`;
        const subEntry: TocEntry = {
          id: subId,
          title: block.content,
          href: `Text/${filename}#${subId}`,
          playOrder: subPlayOrder++,
          children: [],
          level: block.level,
        };

        // Nest subheadings properly based on level
        addNestedEntry(entry, subEntry);
      }
    });
  }

  return entry;
}

/**
 * Creates a TOC entry from an element (front/back matter)
 */
function createEntryFromElement(
  element: Element,
  index: number,
  playOrder: number,
  type: 'frontmatter' | 'backmatter',
  maxDepth: number
): TocEntry | null {
  // Get title from element metadata
  const title = (element as any).title || element.id || `${type}-${index + 1}`;
  const elementId = element.id || `${type}-${index + 1}`;
  const filename = `${type}-${String(index + 1).padStart(3, '0')}.xhtml`;

  const entry: TocEntry = {
    id: elementId,
    title,
    href: `Text/${filename}`,
    playOrder,
    children: [],
    level: 1,
  };

  return entry;
}

/**
 * Adds a nested entry to the appropriate parent based on heading level
 */
function addNestedEntry(parent: TocEntry, entry: TocEntry): void {
  if (entry.level === parent.level + 1) {
    // Direct child
    parent.children.push(entry);
  } else if (parent.children.length > 0) {
    // Try to add to the last child
    addNestedEntry(parent.children[parent.children.length - 1], entry);
  } else {
    // If no suitable parent, add as direct child anyway
    parent.children.push(entry);
  }
}

/**
 * Updates play order based on entry children
 */
function updatePlayOrder(entry: TocEntry, currentPlayOrder: number): number {
  let playOrder = currentPlayOrder;
  entry.children.forEach((child) => {
    playOrder++;
    playOrder = updatePlayOrder(child, playOrder);
  });
  return playOrder;
}

/**
 * Generates NCX XML content for EPUB 2.0 compatibility
 */
function generateNCX(
  entries: TocEntry[],
  metadata: {
    bookId: string;
    bookTitle: string;
    bookAuthor: string;
    maxDepth: number;
  }
): string {
  const { bookId, bookTitle, bookAuthor, maxDepth } = metadata;

  // Build navMap
  const navPoints = entries.map((entry) => generateNavPoint(entry)).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookId)}"/>
    <meta name="dtb:depth" content="${maxDepth}"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(bookTitle)}</text>
  </docTitle>
  <docAuthor>
    <text>${escapeXml(bookAuthor)}</text>
  </docAuthor>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`;
}

/**
 * Generates a navPoint element for NCX
 */
function generateNavPoint(entry: TocEntry, indent: string = '    '): string {
  const childrenXml = entry.children.length > 0
    ? '\n' + entry.children.map((child) => generateNavPoint(child, indent + '  ')).join('\n')
    : '';

  return `${indent}<navPoint id="${escapeXml(entry.id)}" playOrder="${entry.playOrder}">
${indent}  <navLabel>
${indent}    <text>${escapeXml(entry.title)}</text>
${indent}  </navLabel>
${indent}  <content src="${escapeXml(entry.href)}"/>${childrenXml}${childrenXml ? '\n' + indent : ''}</navPoint>`;
}

/**
 * Generates nav.xhtml content for EPUB 3.0
 */
function generateNavXhtml(entries: TocEntry[], tocTitle: string): string {
  const navList = generateNavList(entries);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(tocTitle)}</title>
  <style type="text/css">
    nav#toc ol {
      list-style-type: none;
      padding-left: 0;
    }
    nav#toc ol ol {
      padding-left: 1.5em;
    }
    nav#toc li {
      margin: 0.5em 0;
    }
    nav#toc a {
      text-decoration: none;
      color: #333;
    }
    nav#toc a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <nav id="toc" epub:type="toc">
    <h1>${escapeHtml(tocTitle)}</h1>
    ${navList}
  </nav>
</body>
</html>`;
}

/**
 * Generates nested ordered list for nav.xhtml
 */
function generateNavList(entries: TocEntry[], indent: string = '    '): string {
  if (entries.length === 0) {
    return '';
  }

  const items = entries.map((entry) => {
    const children = entry.children.length > 0
      ? '\n' + generateNavList(entry.children, indent + '  ') + '\n' + indent + '  '
      : '';

    return `${indent}  <li>
${indent}    <a href="${escapeHtml(entry.href)}">${escapeHtml(entry.title)}</a>${children}</li>`;
  }).join('\n');

  return `${indent}<ol>
${items}
${indent}</ol>`;
}

/**
 * Escapes XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default generateTOC;

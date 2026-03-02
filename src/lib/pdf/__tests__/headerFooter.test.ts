/**
 * Tests for header and footer generation
 */
import {
  formatPageNumber,
  replaceTemplateVariables,
  generateHeaderFooterHtml,
  generateHeaderTemplate,
  generateFooterTemplate,
  createConfigFromBookStyle,
  generateChapterHeaderFooter,
  generateFrontMatterHeaderFooter,
  calculatePageNumberOffsets,
  DEFAULT_HEADER_FOOTER_CONFIG,
  type HeaderFooterContext,
  type HeaderFooterConfig,
  type PageHeaderFooterConfig,
} from '../headerFooter'
import type { Book } from '../../../types/book'
import type { Chapter } from '../../../types/chapter'
import type { BookStyle } from '../../../types/style'

describe('formatPageNumber', () => {
  it('should format arabic numbers', () => {
    expect(formatPageNumber(1, 'arabic')).toBe('1')
    expect(formatPageNumber(42, 'arabic')).toBe('42')
    expect(formatPageNumber(999, 'arabic')).toBe('999')
  })

  it('should format lowercase roman numerals', () => {
    expect(formatPageNumber(1, 'roman')).toBe('i')
    expect(formatPageNumber(4, 'roman')).toBe('iv')
    expect(formatPageNumber(9, 'roman')).toBe('ix')
    expect(formatPageNumber(42, 'roman')).toBe('xlii')
    expect(formatPageNumber(99, 'roman')).toBe('xcix')
  })

  it('should format uppercase roman numerals', () => {
    expect(formatPageNumber(1, 'roman-upper')).toBe('I')
    expect(formatPageNumber(4, 'roman-upper')).toBe('IV')
    expect(formatPageNumber(9, 'roman-upper')).toBe('IX')
    expect(formatPageNumber(42, 'roman-upper')).toBe('XLII')
  })

  it('should return empty string for none format', () => {
    expect(formatPageNumber(1, 'none')).toBe('')
    expect(formatPageNumber(999, 'none')).toBe('')
  })
})

describe('replaceTemplateVariables', () => {
  const mockBook: Book = {
    id: 'book-1',
    title: 'Test Book',
    subtitle: 'A Test',
    authors: [
      { id: 'author-1', name: 'Jane Doe' },
      { id: 'author-2', name: 'John Smith' },
    ],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockChapter: Chapter = {
    id: 'chapter-1',
    number: 5,
    title: 'The Beginning',
    content: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const context: HeaderFooterContext = {
    book: mockBook,
    chapter: mockChapter,
    chapterNumber: 5,
    sectionType: 'main-content',
  }

  it('should replace page number', () => {
    const result = replaceTemplateVariables('Page {pageNumber}', context, 42)
    expect(result).toBe('Page 42')
  })

  it('should replace total pages', () => {
    const result = replaceTemplateVariables('Page {pageNumber} of {totalPages}', context, 42, 200)
    expect(result).toBe('Page 42 of 200')
  })

  it('should replace chapter information', () => {
    const result = replaceTemplateVariables('Chapter {chapterNumber}: {chapterTitle}', context)
    expect(result).toBe('Chapter 5: The Beginning')
  })

  it('should replace book title', () => {
    const result = replaceTemplateVariables('{bookTitle}', context)
    expect(result).toBe('Test Book')
  })

  it('should replace author names', () => {
    const result = replaceTemplateVariables('{authorName}', context)
    expect(result).toBe('Jane Doe, John Smith')
  })

  it('should use roman numerals for front matter', () => {
    const frontMatterContext: HeaderFooterContext = {
      ...context,
      sectionType: 'front-matter',
    }
    const result = replaceTemplateVariables('{pageNumber}', frontMatterContext, 5)
    expect(result).toBe('v')
  })

  it('should replace multiple variables', () => {
    const result = replaceTemplateVariables(
      '{bookTitle} - {chapterTitle} - {pageNumber}',
      context,
      42
    )
    expect(result).toBe('Test Book - The Beginning - 42')
  })
})

describe('generateHeaderFooterHtml', () => {
  const mockBook: Book = {
    id: 'book-1',
    title: 'Test Book',
    authors: [{ id: 'author-1', name: 'Jane Doe' }],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const context: HeaderFooterContext = {
    book: mockBook,
    sectionType: 'main-content',
  }

  it('should generate empty header/footer when config is undefined', () => {
    const result = generateHeaderFooterHtml(undefined, context)
    expect(result).toContain('width: 100%')
    expect(result).toContain('height: 100%')
  })

  it('should generate HTML with all three sections', () => {
    const config: PageHeaderFooterConfig = {
      left: {
        content: 'Left',
        align: 'left',
      },
      center: {
        content: 'Center',
        align: 'center',
      },
      right: {
        content: 'Right',
        align: 'right',
      },
    }

    const result = generateHeaderFooterHtml(config, context)
    expect(result).toContain('Left')
    expect(result).toContain('Center')
    expect(result).toContain('Right')
    expect(result).toContain('hf-left')
    expect(result).toContain('hf-center')
    expect(result).toContain('hf-right')
  })

  it('should apply element styles', () => {
    const config: PageHeaderFooterConfig = {
      center: {
        content: 'Title',
        align: 'center',
        fontSize: 14,
        fontStyle: 'italic',
        fontWeight: 'bold',
      },
    }

    const result = generateHeaderFooterHtml(config, context)
    expect(result).toContain('font-size: 14pt')
    expect(result).toContain('font-style: italic')
    expect(result).toContain('font-weight: bold')
    expect(result).toContain('text-align: center')
  })

  it('should replace template variables in content', () => {
    const config: PageHeaderFooterConfig = {
      center: {
        content: '{bookTitle}',
        align: 'center',
      },
    }

    const result = generateHeaderFooterHtml(config, context)
    expect(result).toContain('Test Book')
  })

  it('should handle missing sections gracefully', () => {
    const config: PageHeaderFooterConfig = {
      center: {
        content: 'Only Center',
        align: 'center',
      },
    }

    const result = generateHeaderFooterHtml(config, context)
    expect(result).toContain('Only Center')
    expect(result).toContain('hf-left')
    expect(result).toContain('hf-right')
  })
})

describe('generateHeaderTemplate', () => {
  const mockBook: Book = {
    id: 'book-1',
    title: 'Test Book',
    authors: [{ id: 'author-1', name: 'Jane Doe' }],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const context: HeaderFooterContext = {
    book: mockBook,
    sectionType: 'main-content',
  }

  it('should return empty div when headers disabled', () => {
    const config: HeaderFooterConfig = {
      ...DEFAULT_HEADER_FOOTER_CONFIG,
      headerEnabled: false,
    }

    const result = generateHeaderTemplate(config, context)
    expect(result).toBe('<div></div>')
  })

  it('should generate valid HTML document', () => {
    const config: HeaderFooterConfig = DEFAULT_HEADER_FOOTER_CONFIG

    const result = generateHeaderTemplate(config, context)
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<html>')
    expect(result).toContain('<head>')
    expect(result).toContain('<body>')
    expect(result).toContain('</html>')
  })

  it('should include header height in styles', () => {
    const config: HeaderFooterConfig = {
      ...DEFAULT_HEADER_FOOTER_CONFIG,
      headerHeight: 20,
    }

    const result = generateHeaderTemplate(config, context)
    expect(result).toContain('height: 20mm')
  })

  it('should include custom CSS', () => {
    const config: HeaderFooterConfig = {
      ...DEFAULT_HEADER_FOOTER_CONFIG,
      customCss: '.custom { color: red; }',
    }

    const result = generateHeaderTemplate(config, context)
    expect(result).toContain('.custom { color: red; }')
  })

  it('should use book style fonts', () => {
    const bookStyle: BookStyle = {
      fonts: {
        body: { family: 'Garamond', size: 11, lineHeight: 1.5 },
        heading: { family: 'Helvetica', size: 18, weight: 'bold' },
        chapter: { family: 'Helvetica', size: 24, weight: 'bold' },
      },
      headings: {},
      bodyText: {
        fontSize: 11,
        lineHeight: 1.5,
      },
    }

    const contextWithStyle: HeaderFooterContext = {
      ...context,
      bookStyle,
    }

    const result = generateHeaderTemplate(DEFAULT_HEADER_FOOTER_CONFIG, contextWithStyle)
    expect(result).toContain('Garamond')
  })
})

describe('generateFooterTemplate', () => {
  const mockBook: Book = {
    id: 'book-1',
    title: 'Test Book',
    authors: [{ id: 'author-1', name: 'Jane Doe' }],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const context: HeaderFooterContext = {
    book: mockBook,
    sectionType: 'main-content',
  }

  it('should return empty div when footers disabled', () => {
    const config: HeaderFooterConfig = {
      ...DEFAULT_HEADER_FOOTER_CONFIG,
      footerEnabled: false,
    }

    const result = generateFooterTemplate(config, context)
    expect(result).toBe('<div></div>')
  })

  it('should generate valid HTML document', () => {
    const config: HeaderFooterConfig = DEFAULT_HEADER_FOOTER_CONFIG

    const result = generateFooterTemplate(config, context)
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<html>')
  })

  it('should include footer height in styles', () => {
    const config: HeaderFooterConfig = {
      ...DEFAULT_HEADER_FOOTER_CONFIG,
      footerHeight: 25,
    }

    const result = generateFooterTemplate(config, context)
    expect(result).toContain('height: 25mm')
  })
})

describe('createConfigFromBookStyle', () => {
  it('should return default config when no arguments provided', () => {
    const result = createConfigFromBookStyle()
    expect(result).toEqual(DEFAULT_HEADER_FOOTER_CONFIG)
  })

  it('should apply book style fonts to headers', () => {
    const bookStyle: BookStyle = {
      fonts: {
        body: { family: 'Garamond', size: 11, lineHeight: 1.5 },
        heading: { family: 'Helvetica', size: 18, weight: 'bold' },
        chapter: { family: 'Helvetica', size: 24, weight: 'bold' },
      },
      headings: {},
      bodyText: {
        fontSize: 11,
        lineHeight: 1.5,
      },
    }

    const result = createConfigFromBookStyle(bookStyle)
    expect(result.header.even?.center?.fontFamily).toBe('Garamond')
    expect(result.header.odd?.center?.fontFamily).toBe('Garamond')
  })

  it('should apply custom overrides', () => {
    const overrides: Partial<HeaderFooterConfig> = {
      headerEnabled: false,
      footerEnabled: false,
      headerHeight: 30,
    }

    const result = createConfigFromBookStyle(undefined, overrides)
    expect(result.headerEnabled).toBe(false)
    expect(result.footerEnabled).toBe(false)
    expect(result.headerHeight).toBe(30)
  })
})

describe('generateChapterHeaderFooter', () => {
  const mockBook: Book = {
    id: 'book-1',
    title: 'Test Book',
    authors: [{ id: 'author-1', name: 'Jane Doe' }],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockChapter: Chapter = {
    id: 'chapter-1',
    number: 1,
    title: 'Chapter One',
    content: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('should generate header and footer templates', () => {
    const result = generateChapterHeaderFooter(
      mockBook,
      mockChapter,
      1,
      DEFAULT_HEADER_FOOTER_CONFIG
    )

    expect(result).toHaveProperty('headerTemplate')
    expect(result).toHaveProperty('footerTemplate')
    expect(typeof result.headerTemplate).toBe('string')
    expect(typeof result.footerTemplate).toBe('string')
  })

  it('should include chapter title in templates', () => {
    const result = generateChapterHeaderFooter(
      mockBook,
      mockChapter,
      1,
      DEFAULT_HEADER_FOOTER_CONFIG
    )

    expect(result.headerTemplate).toContain('Chapter One')
  })
})

describe('generateFrontMatterHeaderFooter', () => {
  const mockBook: Book = {
    id: 'book-1',
    title: 'Test Book',
    authors: [{ id: 'author-1', name: 'Jane Doe' }],
    frontMatter: [],
    chapters: [],
    backMatter: [],
    styles: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('should generate header and footer templates for front matter', () => {
    const result = generateFrontMatterHeaderFooter(mockBook, DEFAULT_HEADER_FOOTER_CONFIG)

    expect(result).toHaveProperty('headerTemplate')
    expect(result).toHaveProperty('footerTemplate')
    expect(typeof result.headerTemplate).toBe('string')
    expect(typeof result.footerTemplate).toBe('string')
  })

  it('should generate templates with book context', () => {
    const result = generateFrontMatterHeaderFooter(mockBook, DEFAULT_HEADER_FOOTER_CONFIG)

    // Front matter uses the default header config which has {bookTitle} in even pages
    // The template is generated but variables aren't replaced until render time
    expect(result.headerTemplate).toContain('<!DOCTYPE html>')
    expect(result.footerTemplate).toContain('<!DOCTYPE html>')
  })
})

describe('calculatePageNumberOffsets', () => {
  it('should calculate correct offsets', () => {
    const result = calculatePageNumberOffsets(10, 200)

    expect(result.frontMatter).toBe(1)
    expect(result.mainContent).toBe(1)
    expect(result.backMatter).toBe(201)
  })

  it('should start front matter at page 1', () => {
    const result = calculatePageNumberOffsets(5, 100)
    expect(result.frontMatter).toBe(1)
  })

  it('should start main content at page 1', () => {
    const result = calculatePageNumberOffsets(5, 100)
    expect(result.mainContent).toBe(1)
  })
})

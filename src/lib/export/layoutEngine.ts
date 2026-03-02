/**
 * Layout engine for PDF generation
 * Handles page breaks, widow/orphan control, and content positioning
 */

import type {
  BookContent,
  PdfExportOptions,
  PageLayout,
  LayoutElement,
  WidowOrphanSettings,
  PageBreakInfo,
  Paragraph,
} from './types';
import type { PageConfiguration } from '../pdf/marginCalculator';
import { inchesToPoints } from '../pdf/pageGeometry';

/**
 * Default widow/orphan settings
 */
const DEFAULT_WIDOW_ORPHAN_SETTINGS: WidowOrphanSettings = {
  minLinesAtStart: 2,
  minLinesAtEnd: 2,
  enabled: true,
};

/**
 * Layout engine class
 */
export class LayoutEngine {
  private pages: PageLayout[] = [];
  private currentPage: number = 1;
  private currentY: number = 0;
  private pageConfig: PageConfiguration;
  private options: PdfExportOptions;
  private widowOrphanSettings: WidowOrphanSettings;

  constructor(pageConfig: PageConfiguration, options: PdfExportOptions) {
    this.pageConfig = pageConfig;
    this.options = options;
    this.widowOrphanSettings = options.widowOrphanControl
      ? DEFAULT_WIDOW_ORPHAN_SETTINGS
      : { ...DEFAULT_WIDOW_ORPHAN_SETTINGS, enabled: false };
    this.currentY = pageConfig.contentArea.y;
  }

  /**
   * Generate layout for book content
   */
  public generateLayout(content: BookContent): PageLayout[] {
    this.pages = [];
    this.currentPage = 1;
    this.currentY = this.pageConfig.contentArea.y;

    // Add first page
    this.addNewPage();

    // Process chapters
    for (const chapter of content.chapters) {
      if (chapter.startOnNewPage && this.pages[this.currentPage - 1].content.length > 0) {
        this.addNewPage();
      }

      // Add chapter title
      this.addChapterTitle(chapter.title);

      // Add chapter content
      for (const paragraph of chapter.content) {
        this.addParagraph(paragraph);
      }
    }

    // Add headers and footers to all pages
    this.addHeadersAndFooters();

    return this.pages;
  }

  /**
   * Add a new page to the layout
   */
  private addNewPage(): void {
    const newPage: PageLayout = {
      pageNumber: this.currentPage,
      content: [],
    };

    this.pages.push(newPage);
    this.currentY = this.pageConfig.contentArea.y;
  }

  /**
   * Add chapter title to current page
   */
  private addChapterTitle(title: string): void {
    const fontSize = (this.options.fonts?.baseSize || 12) * 1.5;
    const lineHeight = fontSize * 1.2;
    const spaceAfter = lineHeight * 1.5;

    // Check if we need a new page
    if (this.currentY + lineHeight + spaceAfter > this.getPageBottom()) {
      this.currentPage++;
      this.addNewPage();
    }

    const element: LayoutElement = {
      type: 'heading',
      content: title,
      x: this.pageConfig.contentArea.x,
      y: this.currentY,
      width: this.pageConfig.contentArea.width,
      height: lineHeight,
      style: {
        fontSize,
        bold: true,
        fontFamily: this.options.fonts?.heading,
      },
    };

    this.pages[this.currentPage - 1].content.push(element);
    this.currentY += lineHeight + spaceAfter;
  }

  /**
   * Add paragraph to current page
   */
  private addParagraph(paragraph: Paragraph): void {
    const fontSize = this.options.fonts?.baseSize || 12;
    const lineHeight = fontSize * (paragraph.style?.spacing?.lineHeight || 1.5);

    // Estimate number of lines based on text length
    const charsPerLine = Math.floor(this.pageConfig.contentArea.width / (fontSize * 0.6));
    const estimatedLines = Math.ceil(paragraph.text.length / charsPerLine);
    const totalHeight = estimatedLines * lineHeight;
    const spaceAfter = paragraph.style?.spacing?.after || lineHeight * 0.5;

    // Check for widow/orphan control
    if (this.widowOrphanSettings.enabled && estimatedLines > 1) {
      const remainingSpace = this.getPageBottom() - this.currentY;
      const linesOnCurrentPage = Math.floor(remainingSpace / lineHeight);

      // Orphan control: if we can't fit minimum lines at start, move to next page
      if (linesOnCurrentPage > 0 && linesOnCurrentPage < this.widowOrphanSettings.minLinesAtStart) {
        this.currentPage++;
        this.addNewPage();
      }

      // Widow control: if we can't fit minimum lines at end, move entire paragraph
      if (linesOnCurrentPage > 0 &&
          linesOnCurrentPage < estimatedLines &&
          (estimatedLines - linesOnCurrentPage) < this.widowOrphanSettings.minLinesAtEnd) {
        this.currentPage++;
        this.addNewPage();
      }
    }

    // Split paragraph across pages if needed
    let remainingHeight = totalHeight;
    let processedLines = 0;

    while (remainingHeight > 0) {
      const availableHeight = this.getPageBottom() - this.currentY;

      if (availableHeight <= lineHeight) {
        // Not enough space, go to next page
        this.currentPage++;
        this.addNewPage();
        continue;
      }

      const heightOnThisPage = Math.min(remainingHeight, availableHeight - spaceAfter);
      const linesOnThisPage = Math.floor(heightOnThisPage / lineHeight);

      const element: LayoutElement = {
        type: 'text',
        content: paragraph.text,
        x: this.pageConfig.contentArea.x + (paragraph.style?.indent || 0),
        y: this.currentY,
        width: this.pageConfig.contentArea.width - (paragraph.style?.indent || 0),
        height: heightOnThisPage,
        style: {
          fontSize,
          lineHeight,
          align: paragraph.style?.align || 'left',
          ...paragraph.formatting,
        },
      };

      this.pages[this.currentPage - 1].content.push(element);
      this.currentY += heightOnThisPage;

      processedLines += linesOnThisPage;
      remainingHeight -= heightOnThisPage;

      if (remainingHeight > 0) {
        this.currentPage++;
        this.addNewPage();
      } else {
        this.currentY += spaceAfter;
      }
    }
  }

  /**
   * Add headers and footers to all pages
   */
  private addHeadersAndFooters(): void {
    const pageNumberConfig = this.options.pageNumbers;
    const headerConfig = this.options.headers;
    const footerConfig = this.options.footers;

    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const isLeftPage = page.pageNumber % 2 === 0;

      // Add header
      if (headerConfig?.enabled) {
        const headerText = isLeftPage ? headerConfig.leftPage : headerConfig.rightPage;
        if (headerText) {
          page.header = {
            text: headerText,
            x: this.pageConfig.contentArea.x,
            y: this.pageConfig.margins.top / 2,
          };
        }
      }

      // Add footer and page number
      if (footerConfig?.enabled || pageNumberConfig?.enabled) {
        const footerY = inchesToPoints(this.pageConfig.page.height) - this.pageConfig.margins.bottom / 2;

        let footerText = '';
        if (footerConfig?.enabled) {
          footerText = isLeftPage ? footerConfig.leftPage || '' : footerConfig.rightPage || '';
        }

        let pageNumberText = '';
        if (pageNumberConfig?.enabled && page.pageNumber >= (pageNumberConfig.startPage || 1)) {
          const num = page.pageNumber - (pageNumberConfig.startPage || 1) + 1;
          pageNumberText = this.formatPageNumber(num, pageNumberConfig.format || 'numeric');
          if (pageNumberConfig.prefix) pageNumberText = pageNumberConfig.prefix + pageNumberText;
          if (pageNumberConfig.suffix) pageNumberText = pageNumberText + pageNumberConfig.suffix;
        }

        page.footer = {
          text: footerText,
          pageNumber: pageNumberText,
          x: this.pageConfig.contentArea.x,
          y: footerY,
        };
      }
    }
  }

  /**
   * Format page number according to style
   */
  private formatPageNumber(num: number, format: 'numeric' | 'roman-lower' | 'roman-upper'): string {
    if (format === 'numeric') {
      return num.toString();
    } else if (format === 'roman-lower') {
      return this.toRoman(num).toLowerCase();
    } else {
      return this.toRoman(num);
    }
  }

  /**
   * Convert number to Roman numerals
   */
  private toRoman(num: number): string {
    const romanNumerals: [number, string][] = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];

    let result = '';
    for (const [value, numeral] of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }

  /**
   * Get the bottom Y coordinate of the content area
   */
  private getPageBottom(): number {
    return inchesToPoints(this.pageConfig.page.height) - this.pageConfig.margins.bottom;
  }

  /**
   * Get page count
   */
  public getPageCount(): number {
    return this.pages.length;
  }

  /**
   * Get all page breaks
   */
  public getPageBreaks(): PageBreakInfo[] {
    return this.pages.map((page, index) => ({
      type: index === 0 ? 'hard' : 'soft',
      pageNumber: page.pageNumber,
      position: 0,
    }));
  }
}

/**
 * Format Converter for DOCX to Internal Text Format
 * Maps Word formatting styles to the app's internal text feature system
 */

import type {
  StructuredDocument,
  Paragraph,
  ParagraphContent,
  InlineFormatting,
  TextRun
} from './types';
import type { TextBlock } from '../../types/textBlock';
import type { TextFeature, Subhead, Break, Quote, List, ListItem } from '../../types/textFeature';
import type { InlineText, InlineStyle, RichText, ImageReference, TextSegment } from '../../types/inlineText';

export interface ConversionOptions {
  detectSceneBreaks?: boolean;
  sceneBreakPatterns?: RegExp[];
  preserveFormatting?: boolean;
  convertImages?: boolean;
  imageHandler?: (imageId: string) => Promise<string>;
}

export interface ConvertedDocument {
  blocks: TextBlock[];
  features: TextFeature[];
  warnings: string[];
}

export class FormatConverter {
  private warnings: string[] = [];
  private imageCounter = 0;

  /**
   * Convert a structured DOCX document to internal text format
   */
  async convert(
    document: StructuredDocument,
    options: ConversionOptions = {}
  ): Promise<ConvertedDocument> {
    this.warnings = [];
    const blocks: TextBlock[] = [];
    const features: TextFeature[] = [];

    const {
      detectSceneBreaks = true,
      sceneBreakPatterns = [/^\s*\*\s*\*\s*\*\s*$/, /^\s*#\s*#\s*#\s*$/],
      preserveFormatting = true,
      convertImages = true
    } = options;

    for (const element of document.elements) {
      if (element.type === 'paragraph') {
        const paragraph = element as Paragraph;

        // Check for scene breaks
        if (detectSceneBreaks && this.isSceneBreak(paragraph.rawText, sceneBreakPatterns)) {
          features.push(this.createSceneBreak(paragraph.rawText));
          continue;
        }

        // Check for heading
        if (paragraph.style.headingLevel) {
          const subhead = this.convertToSubhead(paragraph);
          features.push(subhead);
          continue;
        }

        // Check for block quote (detected by indentation)
        if (this.isBlockQuote(paragraph)) {
          const quote = this.convertToQuote(paragraph, preserveFormatting);
          features.push(quote);
          continue;
        }

        // Check for list item
        if (paragraph.style.numbering) {
          // Lists are complex and need context, so we'll mark for list processing
          // This would be handled by a separate list grouping pass
          continue;
        }

        // Convert to regular text block
        const textBlock = await this.convertToTextBlock(
          paragraph,
          preserveFormatting,
          convertImages,
          options.imageHandler
        );
        blocks.push(textBlock);
      } else if (element.type === 'section-break') {
        features.push({
          type: 'break',
          breakType: 'section'
        });
      }
    }

    // Post-process to group list items
    const { blocks: processedBlocks, features: processedFeatures } =
      this.groupListItems(document, blocks, features);

    return {
      blocks: processedBlocks,
      features: processedFeatures,
      warnings: this.warnings
    };
  }

  /**
   * Check if a paragraph is a scene break
   */
  private isSceneBreak(text: string, patterns: RegExp[]): boolean {
    const trimmed = text.trim();
    return patterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Create a scene break feature
   */
  private createSceneBreak(text: string): Break {
    return {
      type: 'break',
      breakType: 'scene',
      symbol: text.trim()
    };
  }

  /**
   * Check if a paragraph is a block quote (based on indentation)
   */
  private isBlockQuote(paragraph: Paragraph): boolean {
    const indentation = paragraph.style.indentation;
    if (!indentation) return false;

    // Block quotes typically have left indentation > 720 (0.5 inch in twips)
    const leftIndent = indentation.left || 0;
    return leftIndent > 720;
  }

  /**
   * Convert paragraph to subhead (heading)
   */
  private convertToSubhead(paragraph: Paragraph): Subhead {
    return {
      type: 'subhead',
      content: paragraph.rawText,
      level: paragraph.style.headingLevel
    };
  }

  /**
   * Convert paragraph to block quote
   */
  private convertToQuote(paragraph: Paragraph, preserveFormatting: boolean): Quote {
    const richText = preserveFormatting
      ? this.convertToRichText(paragraph.content)
      : { segments: [{ text: paragraph.rawText }], plainText: paragraph.rawText };

    return {
      type: 'quote',
      content: richText.plainText,
      quoteType: 'block'
    };
  }

  /**
   * Convert paragraph to text block
   */
  private async convertToTextBlock(
    paragraph: Paragraph,
    preserveFormatting: boolean,
    convertImages: boolean,
    imageHandler?: (imageId: string) => Promise<string>
  ): Promise<TextBlock> {
    const blockType = this.determineBlockType(paragraph);
    const richText = preserveFormatting
      ? this.convertToRichText(paragraph.content)
      : { segments: [{ text: paragraph.rawText }], plainText: paragraph.rawText };

    const features: TextFeature[] = [];

    // Extract links from content
    const links = this.extractLinks(paragraph);
    features.push(...links);

    // Handle alignment as a style reference
    const alignment = paragraph.style.alignment;

    return {
      content: richText.plainText,
      blockType,
      features: features.length > 0 ? features : undefined,
      // Store rich text formatting in metadata for later use
      metadata: preserveFormatting ? {
        richText: richText.segments,
        alignment
      } : undefined
    };
  }

  /**
   * Determine the block type from paragraph style
   */
  private determineBlockType(paragraph: Paragraph): TextBlock['blockType'] {
    const styleName = paragraph.style.styleName?.toLowerCase() || '';

    if (styleName.includes('code') || styleName.includes('preformatted')) {
      return 'code';
    }

    if (paragraph.style.headingLevel) {
      return 'heading';
    }

    return 'paragraph';
  }

  /**
   * Convert Word inline formatting to internal inline text format
   */
  private convertToRichText(content: ParagraphContent[]): RichText {
    const segments: TextSegment[] = [];
    let plainText = '';

    for (const item of content) {
      if (item.type === 'text') {
        const textRun = item as TextRun;
        const inlineStyle = this.convertInlineFormatting(textRun.formatting);

        segments.push({
          text: textRun.text,
          style: Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined
        });
        plainText += textRun.text;
      } else if (item.type === 'break') {
        if (item.breakType === 'line') {
          segments.push({ text: '\n' });
          plainText += '\n';
        } else if (item.breakType === 'page') {
          segments.push({ text: '\n\n' });
          plainText += '\n\n';
        }
      } else if (item.type === 'tab') {
        segments.push({ text: '\t' });
        plainText += '\t';
      }
    }

    return { segments, plainText };
  }

  /**
   * Convert Word InlineFormatting to internal InlineStyle
   */
  private convertInlineFormatting(formatting: InlineFormatting): InlineStyle {
    const style: InlineStyle = {};

    if (formatting.bold) style.bold = true;
    if (formatting.italic) style.italic = true;
    if (formatting.underline) style.underline = true;
    if (formatting.strikethrough) style.strikethrough = true;
    if (formatting.subscript) style.subscript = true;
    if (formatting.superscript) style.superscript = true;
    if (formatting.color) style.color = formatting.color;
    if (formatting.highlight) style.highlight = formatting.highlight;
    if (formatting.fontSize) style.fontSize = formatting.fontSize;
    if (formatting.fontFamily) style.fontFamily = formatting.fontFamily;

    return style;
  }

  /**
   * Extract links from paragraph (placeholder for future implementation)
   */
  private extractLinks(_paragraph: Paragraph): TextFeature[] {
    // TODO: Implement hyperlink extraction from Word document
    // This requires parsing relationships and hyperlink elements
    return [];
  }

  /**
   * Group consecutive numbered/bulleted paragraphs into lists
   */
  private groupListItems(
    document: StructuredDocument,
    blocks: TextBlock[],
    features: TextFeature[]
  ): { blocks: TextBlock[]; features: TextFeature[] } {
    const processedFeatures: TextFeature[] = [...features];
    const listGroups: Map<string, Paragraph[]> = new Map();

    // First pass: identify list items
    for (const element of document.elements) {
      if (element.type === 'paragraph') {
        const paragraph = element as Paragraph;
        if (paragraph.style.numbering) {
          const key = `${paragraph.style.numbering.format}_${paragraph.style.numbering.level}`;
          if (!listGroups.has(key)) {
            listGroups.set(key, []);
          }
          listGroups.get(key)!.push(paragraph);
        }
      }
    }

    // Second pass: convert list groups to List features
    for (const [key, paragraphs] of listGroups) {
      const list = this.convertToList(paragraphs, key);
      processedFeatures.push(list);
    }

    return { blocks, features: processedFeatures };
  }

  /**
   * Convert paragraphs to a list feature
   */
  private convertToList(paragraphs: Paragraph[], key: string): List {
    const items: ListItem[] = paragraphs.map(p => ({
      content: p.rawText,
      level: p.style.numbering?.level || 0,
      marker: this.getListMarker(p.style.numbering?.format || 'decimal')
    }));

    const listType = this.determineListType(key);

    return {
      type: 'list',
      items,
      listType: listType as 'ordered' | 'unordered',
      startNumber: listType === 'ordered' ? 1 : undefined
    };
  }

  /**
   * Determine list type from numbering format
   */
  private determineListType(format: string): 'ordered' | 'unordered' {
    const unorderedFormats = ['bullet', 'circle', 'square'];
    return unorderedFormats.includes(format.toLowerCase()) ? 'unordered' : 'ordered';
  }

  /**
   * Get list marker symbol
   */
  private getListMarker(format: string): string {
    const markers: Record<string, string> = {
      bullet: '•',
      circle: '○',
      square: '■',
      decimal: '1.',
      lowerLetter: 'a.',
      upperLetter: 'A.',
      lowerRoman: 'i.',
      upperRoman: 'I.'
    };

    return markers[format] || '•';
  }

  /**
   * Convert an image to an internal image reference
   */
  private async convertImage(
    imageData: Buffer,
    imageHandler?: (imageId: string) => Promise<string>
  ): Promise<ImageReference> {
    this.imageCounter++;
    const imageId = `img_${this.imageCounter}`;

    let src: string | undefined;
    if (imageHandler) {
      try {
        src = await imageHandler(imageId);
      } catch (error) {
        this.warnings.push(`Failed to handle image ${imageId}: ${error}`);
      }
    }

    return {
      type: 'image',
      id: imageId,
      src
    };
  }

  /**
   * Get conversion warnings
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }
}

/**
 * Convenience function to convert a DOCX document
 */
export async function convertDocxToInternalFormat(
  document: StructuredDocument,
  options?: ConversionOptions
): Promise<ConvertedDocument> {
  const converter = new FormatConverter();
  return await converter.convert(document, options);
}

export default FormatConverter;

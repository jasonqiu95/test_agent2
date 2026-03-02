/**
 * EPUB 3 Module
 *
 * Provides utilities for creating EPUB 3 compliant documents and structures,
 * including XHTML templates, block element conversion, inline formatting functions,
 * scene break conversion, and front/back matter conversion.
 */

// XHTML Template exports
export * from './xhtml-template';
export { default as xhtmlTemplate } from './xhtml-template';

// Block Converter exports
export {
  convertParagraph,
  convertHeading,
  convertBlockquote,
  convertUnorderedList,
  convertOrderedList,
  convertListItem,
  convertNestedList,
  convertVerse,
  convertVerseWithStanzas,
  convertBlockElements,
  validateBlockElement,
  extractTextContent,
  type BlockConverterOptions,
  type ConversionResult,
} from './block-converter';

// Inline Converter exports
export {
  escapeHtml,
  convertInlineText,
  convertLink,
  convertImage,
  convertFootnote,
  convertTextSegment,
  convertRichText,
  convertContent,
  createInlineText,
  createLink,
  parseSimpleFormatting,
} from './inline-converter';

// Scene Break Converter exports
export {
  convertSceneBreakToHtml,
  convertSceneBreaksToHtml,
  generateSceneBreakCss,
  isOrnamentalBreak,
  type SceneBreakStyle,
  type SceneBreakConverterOptions,
} from './scene-break-converter';

// Matter Converter exports
export {
  convertTextBlock,
  convertTextBlocks,
  convertFrontMatter,
  convertBackMatter,
  convertMatterElement,
  convertMatterElements,
  convertFrontMatterBatch,
  convertBackMatterBatch,
  convertTitlePage,
  convertCopyrightPage,
  convertDedication,
  convertAboutAuthor,
  convertAlsoBy,
  validateMatterElement,
  getMatterFilename,
  isFrontMatter,
  isBackMatter,
  type MatterConverterOptions,
  type MatterConversionResult,
} from './matter-converter';

/**
 * EPUB utilities and converters
 * Export all epub-related functionality
 */

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

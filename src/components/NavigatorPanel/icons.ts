/**
 * Icon mappings for element types and chapters
 */

import { ElementType } from '../../types/element';

export type IconType = ElementType | 'chapter';

/**
 * Maps element types and chapter to emoji icons
 */
export const ELEMENT_ICONS: Record<IconType, string> = {
  // Chapter
  'chapter': '📖',

  // Front Matter
  'title-page': '📄',
  'copyright': '©️',
  'dedication': '💝',
  'epigraph': '✍️',
  'foreword': '📝',
  'preface': '📋',
  'acknowledgments': '🙏',
  'introduction': '🎯',
  'prologue': '🎬',

  // Back Matter
  'epilogue': '🎭',
  'afterword': '📜',
  'appendix': '📎',
  'glossary': '📚',
  'bibliography': '📑',
  'index': '🔍',
  'about-author': '👤',
  'also-by': '📚',

  // Other
  'other': '📄',
};

/**
 * Get icon for a given element type or chapter
 */
export const getIcon = (type: IconType): string => {
  return ELEMENT_ICONS[type] || ELEMENT_ICONS.other;
};

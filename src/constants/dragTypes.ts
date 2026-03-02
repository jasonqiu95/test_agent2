/**
 * Drag type constants for tree elements
 * Used to identify the type of item being dragged in the book structure
 */

export const DragTypes = {
  FRONT_MATTER_ITEM: 'FRONT_MATTER_ITEM',
  CHAPTER_ITEM: 'CHAPTER_ITEM',
  BACK_MATTER_ITEM: 'BACK_MATTER_ITEM',
} as const

export type DragType = (typeof DragTypes)[keyof typeof DragTypes]

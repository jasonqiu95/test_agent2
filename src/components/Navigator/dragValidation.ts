/**
 * Drag validation utilities for section-based drop validation
 * Prevents invalid cross-section drops in Navigator component
 */

import { DragTypes } from '../../constants/dragTypes';
import type { TreeItemDragData } from '../../types/drag';

export type SectionType = 'frontMatter' | 'chapters' | 'backMatter';

export interface ValidationResult {
  canDrop: boolean;
  reason?: string;
}

/**
 * Determines the section type from drag data type
 */
export function getSectionFromDragType(dragType: string): SectionType | null {
  switch (dragType) {
    case DragTypes.FRONT_MATTER_ITEM:
      return 'frontMatter';
    case DragTypes.CHAPTER_ITEM:
      return 'chapters';
    case DragTypes.BACK_MATTER_ITEM:
      return 'backMatter';
    default:
      return null;
  }
}

/**
 * Validates whether a dragged item can be dropped on a target location
 *
 * Rules:
 * - Items can only be dropped within their own section
 * - Front matter items cannot be dropped in chapters or back matter
 * - Chapters cannot be dropped in front matter or back matter
 * - Back matter items cannot be dropped in front matter or chapters
 *
 * @param dragData - The data of the dragged item
 * @param targetSection - The section where the drop is attempted
 * @returns ValidationResult with canDrop boolean and optional reason
 */
export function validateDrop(
  dragData: TreeItemDragData | null,
  targetSection: SectionType
): ValidationResult {
  if (!dragData) {
    return {
      canDrop: false,
      reason: 'No drag data available',
    };
  }

  const sourceSection = getSectionFromDragType(dragData.type);

  if (!sourceSection) {
    return {
      canDrop: false,
      reason: 'Invalid drag type',
    };
  }

  // Items can only be dropped within the same section
  if (sourceSection !== targetSection) {
    return {
      canDrop: false,
      reason: `Cannot drop ${sourceSection} items into ${targetSection} section`,
    };
  }

  return {
    canDrop: true,
  };
}

/**
 * Validates if a specific item position is a valid drop target
 *
 * @param draggedItemId - ID of the item being dragged
 * @param targetItemId - ID of the target item
 * @param sourceIndex - Index of the dragged item in its section
 * @param targetIndex - Index of the target item in its section
 * @param dropPosition - Position relative to target ('before' or 'after')
 * @returns true if the drop would result in a position change
 */
export function validateDropPosition(
  draggedItemId: string,
  targetItemId: string,
  sourceIndex: number,
  targetIndex: number,
  dropPosition: 'before' | 'after' | null
): boolean {
  // Can't drop on itself
  if (draggedItemId === targetItemId) {
    return false;
  }

  // Check if dropping just before or after current position (no meaningful change)
  // When dropping 'before' an item that's immediately after us, no change occurs
  if (dropPosition === 'before' && sourceIndex === targetIndex - 1) {
    return false;
  }

  // When dropping 'after' an item that's immediately before us, no change occurs
  if (dropPosition === 'after' && sourceIndex === targetIndex + 1) {
    return false;
  }

  return true;
}

/**
 * Gets CSS class names for visual feedback during drag operations
 *
 * @param canDrop - Whether the current drop target is valid
 * @param isDragging - Whether a drag operation is in progress
 * @returns CSS class names for styling
 */
export function getDragFeedbackClasses(canDrop: boolean, isDragging: boolean): string {
  const classes: string[] = [];

  if (isDragging) {
    classes.push('drag-in-progress');
  }

  if (canDrop) {
    classes.push('drop-allowed');
  } else if (isDragging) {
    classes.push('drop-blocked');
  }

  return classes.join(' ');
}

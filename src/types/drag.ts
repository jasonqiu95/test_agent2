import type { DragType } from '../constants/dragTypes'

/**
 * Base drag data structure for all draggable items
 */
export interface DragData<T = unknown> {
  type: DragType
  itemId: string
  payload: T
}

/**
 * Drag data payload for front matter items
 */
export interface FrontMatterDragPayload {
  index: number
  title: string
}

/**
 * Drag data payload for chapter items
 */
export interface ChapterDragPayload {
  index: number
  title: string
  chapterId: string
}

/**
 * Drag data payload for back matter items
 */
export interface BackMatterDragPayload {
  index: number
  title: string
}

/**
 * Union type for all drag data variants
 */
export type TreeItemDragData =
  | DragData<FrontMatterDragPayload>
  | DragData<ChapterDragPayload>
  | DragData<BackMatterDragPayload>

/**
 * Type guard to check if drag data is for front matter
 */
export function isFrontMatterDragData(
  data: TreeItemDragData
): data is DragData<FrontMatterDragPayload> {
  return data.type === 'FRONT_MATTER_ITEM'
}

/**
 * Type guard to check if drag data is for chapters
 */
export function isChapterDragData(
  data: TreeItemDragData
): data is DragData<ChapterDragPayload> {
  return data.type === 'CHAPTER_ITEM'
}

/**
 * Type guard to check if drag data is for back matter
 */
export function isBackMatterDragData(
  data: TreeItemDragData
): data is DragData<BackMatterDragPayload> {
  return data.type === 'BACK_MATTER_ITEM'
}

/**
 * Test to verify drag-and-drop infrastructure is correctly set up
 */

import { DragTypes } from '../constants/dragTypes'
import {
  isFrontMatterDragData,
  isChapterDragData,
  isBackMatterDragData,
} from '../types/drag'
import type {
  DragData,
  FrontMatterDragPayload,
  ChapterDragPayload,
  BackMatterDragPayload,
  TreeItemDragData,
} from '../types/drag'

describe('Drag and Drop Infrastructure', () => {
  describe('DragTypes', () => {
    it('should export all drag type constants', () => {
      expect(DragTypes.FRONT_MATTER_ITEM).toBe('FRONT_MATTER_ITEM')
      expect(DragTypes.CHAPTER_ITEM).toBe('CHAPTER_ITEM')
      expect(DragTypes.BACK_MATTER_ITEM).toBe('BACK_MATTER_ITEM')
    })
  })

  describe('Type Guards', () => {
    it('should correctly identify front matter drag data', () => {
      const dragData: DragData<FrontMatterDragPayload> = {
        type: DragTypes.FRONT_MATTER_ITEM,
        itemId: 'fm-1',
        payload: {
          index: 0,
          title: 'Preface',
        },
      }

      expect(isFrontMatterDragData(dragData)).toBe(true)
      expect(isChapterDragData(dragData)).toBe(false)
      expect(isBackMatterDragData(dragData)).toBe(false)
    })

    it('should correctly identify chapter drag data', () => {
      const dragData: DragData<ChapterDragPayload> = {
        type: DragTypes.CHAPTER_ITEM,
        itemId: 'ch-1',
        payload: {
          index: 0,
          title: 'Chapter 1',
          chapterId: 'chapter-1',
        },
      }

      expect(isChapterDragData(dragData)).toBe(true)
      expect(isFrontMatterDragData(dragData)).toBe(false)
      expect(isBackMatterDragData(dragData)).toBe(false)
    })

    it('should correctly identify back matter drag data', () => {
      const dragData: DragData<BackMatterDragPayload> = {
        type: DragTypes.BACK_MATTER_ITEM,
        itemId: 'bm-1',
        payload: {
          index: 0,
          title: 'Epilogue',
        },
      }

      expect(isBackMatterDragData(dragData)).toBe(true)
      expect(isFrontMatterDragData(dragData)).toBe(false)
      expect(isChapterDragData(dragData)).toBe(false)
    })
  })

  describe('DragData structure', () => {
    it('should correctly type front matter payload', () => {
      const dragData: DragData<FrontMatterDragPayload> = {
        type: DragTypes.FRONT_MATTER_ITEM,
        itemId: 'fm-1',
        payload: {
          index: 0,
          title: 'Preface',
        },
      }

      expect(dragData.payload.index).toBe(0)
      expect(dragData.payload.title).toBe('Preface')
    })

    it('should correctly type chapter payload', () => {
      const dragData: DragData<ChapterDragPayload> = {
        type: DragTypes.CHAPTER_ITEM,
        itemId: 'ch-1',
        payload: {
          index: 0,
          title: 'Chapter 1',
          chapterId: 'chapter-1',
        },
      }

      expect(dragData.payload.index).toBe(0)
      expect(dragData.payload.title).toBe('Chapter 1')
      expect(dragData.payload.chapterId).toBe('chapter-1')
    })

    it('should correctly type back matter payload', () => {
      const dragData: DragData<BackMatterDragPayload> = {
        type: DragTypes.BACK_MATTER_ITEM,
        itemId: 'bm-1',
        payload: {
          index: 0,
          title: 'Epilogue',
        },
      }

      expect(dragData.payload.index).toBe(0)
      expect(dragData.payload.title).toBe('Epilogue')
    })
  })
})
